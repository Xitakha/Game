/* waves.js - Director de spawn continuo por presupuesto (sin oleadas): tiers por tiempo, topes por tipo (maxAlive), enemigo protagonista
   rotativo cada 60 s, packs temáticos, élites a 3:30 y 5:30 y el jefe a los 7:30 (con el jefe vivo: 40 % de spawn y solo tipos ligeros). */
(function () {
  'use strict';
  var G = window.G, B = G.B, W = G.Waves = {};

  W.MINI_LAST = 45000;   // ms reales: un minijefe pendiente no entra en los últimos 45 s antes del jefe final
  W.reset = function () { W.cleanT = null; W.t = 0; W.budget = 0; W.bossSpawned = false; W.bossWarn = false; W.elitesDone = {}; W.star = null; W.starT = 0; W.eliteBoost = 0; };
  W.reset();

  // Posición en anillo fuera de cámara (cae dentro de la arena)
  function spawnPos() {
    var p = G.player, m = G.WALL + 30, x, y, tries = 0;
    do {
      var a = G.rnd(0, 6.283), r = G.rnd(500, 580);
      x = p.x + Math.cos(a) * r; y = p.y + Math.sin(a) * r * 0.8; tries++;
    } while ((x < m || x > G.AW - m || y < m || y > G.AH - m) && tries < 20);
    if (tries >= 20) {  // jugador cerca de una pared: cualquier punto lejano
      do { x = G.rnd(m, G.AW - m); y = G.rnd(m, G.AH - m); tries++; } while (G.dist(x, y, p.x, p.y) < 320 && tries < 60);
    }
    return [x, y];
  }
  function mirror(pos) { var p = G.player; return [G.clamp(2 * p.x - pos[0], G.WALL + 30, G.AW - G.WALL - 30), G.clamp(2 * p.y - pos[1], G.WALL + 30, G.AH - G.WALL - 30)]; }

  function spawnBoss() {
    W.bossSpawned = true;
    for (var i = 0; i < G.enemies.length; i++) if (B.enemy[G.enemies[i].type].elite) G.Enemies.kill(G.enemies[i], true);   // los élites desaparecen
    G.Boss.spawn(G.bossId || 'pastor');   // intro de 3,5 s, música de jefe y todo lo demás: boss.js
  }

  function spawnElite(type) {
    W.elitesDone[type] = true;
    var pos = spawnPos(), E = G.Enemies;
    var el = E.spawn(type, pos[0], pos[1]), vr = G.curBiome === 'cripta' && type === 'mini_bulwark' ? 'warden' : G.curBiome === 'asfodelo' && type === 'mini_hive' ? 'wraith' : null;
    if (vr) E.variant(el, vr);   // guardián propio del bioma (J3)
    if (type === 'mini_bulwark') { E.spawn('shield', pos[0] + 45, pos[1] + 20); E.spawn('shield', pos[0] - 45, pos[1] + 20); }
    G.Hud.banner('¡GUARDIÁN: ' + (vr ? G.Enemies.VARIANTS[vr].name : B.enemy[type].name) + '!', 2000, '#ffb347');
    G.sfx('boss_roar', { pitch: 1.3, vol: 0.6 });
    W.eliteBoost = 25000;
  }

  // ---- Packs temáticos: datos en G.B.packsLegacy / G.B.fam[bioma].packs (families.js): { id, layout, parts: [[rol, n], ...] }; coste = suma de costes x 0.6.
  // layout = forma de aparición. Los roles de `parts` se resuelven a la familia del bioma activo al hacer E.spawn.
  function packCost(pk) { var c = 0; pk.parts.forEach(function (q) { c += B.val(q[0], 'cost') * q[1]; }); return c * 0.6; }

  function spawnPack(pk) {
    var pos = spawnPos(), E = G.Enemies, p = G.player, j, A = pk.parts[0], Z = pk.parts[1];
    if (pk.layout === 'line') {   // n del primer rol en línea y el segundo detrás
      var ang = Math.atan2(p.y - pos[1], p.x - pos[0]), px = -Math.sin(ang), py = Math.cos(ang), h = (A[1] - 1) / 2;
      for (j = 0; j < A[1]; j++) E.spawn(A[0], pos[0] + px * 44 * (j - h), pos[1] + py * 44 * (j - h));
      if (Z) E.spawn(Z[0], pos[0] - Math.cos(ang) * 60, pos[1] - Math.sin(ang) * 60);
    } else if (pk.layout === 'cross') {   // pareja en lados opuestos (+ nube del segundo rol, p. ej. Pastoreo y Boliche de las familias P1)
      var m = mirror(pos); E.spawn(A[0], pos[0], pos[1]); E.spawn(A[0], m[0], m[1]);
      if (Z) for (j = 0; j < Z[1]; j++) E.spawn(Z[0], pos[0] + G.rnd(-50, 50), pos[1] + G.rnd(-50, 50));
    } else if (pk.layout === 'pincer') {   // pareja opuesta + uno por un flanco
      var m2 = mirror(pos); E.spawn(A[0], pos[0], pos[1]); E.spawn(A[0], m2[0], m2[1]);
      var pa = G.rnd(0, 6.283); E.spawn(Z[0], p.x + Math.cos(pa) * 520, p.y + Math.sin(pa) * 420);
    } else {   // 'field': dos zonificadores juntos y una nube del segundo rol
      E.spawn(A[0], pos[0], pos[1]); E.spawn(A[0], pos[0] + 60, pos[1] + 30);
      for (j = 0; j < Z[1]; j++) E.spawn(Z[0], pos[0] + G.rnd(-50, 50), pos[1] + G.rnd(-50, 50));
    }
  }

  // Tope efectivo por tipo: maxAlive escalado por la curva de tier (mínimo 1 para que el tipo viejo siga apareciendo). Gusano: sin tope propio, lo limita el peso.
  // capGrow (opcional, solo tier 3; A.2): crecimiento máximo del tope -> round(maxAlive x min(capGrow, max(1, tierMul))). Sin capGrow: comportamiento de siempre.
  function capOf(k, m) {
    var ma = B.val(k, 'maxAlive'); if (!ma) return 1e9;
    var tm = B.tierMul(k, m), sc = B.tierOf(k) >= 3 ? Math.max(1, tm) : tm, cg = B.val(k, 'capGrow');   // los fuertes pueden superar su tope base según la curva
    if (cg && B.tierOf(k) >= 3) sc = Math.min(cg, sc);
    return Math.max(1, Math.round(ma * sc));
  }
  W.capOf = capOf;

  // CENSO (A.2, herramienta tools/card-swarm-balance-bot/census.js): enemigos normales vivos por rol, por tier y por nombre de familia en este instante.
  W.census = function () {
    var out = { alive: 0, byType: {}, byTier: [0, 0, 0, 0], byFam: {}, fam: !!B.famOf() }, i, e, f = B.famOf();
    for (i = 0; i < G.enemies.length; i++) {
      e = G.enemies[i]; if (e.dead || e.partOf || e.type === 'boss' || B.enemy[e.type].elite) continue;
      var t = B.tierOf(e.type), nm = f && f.use[e.type] ? f.use[e.type].name : e.type;
      out.alive++; out.byType[e.type] = (out.byType[e.type] || 0) + 1; if (t != null) out.byTier[t]++; out.byFam[nm] = (out.byFam[nm] || 0) + 1;
    }
    return out;
  };

  // Encargo activo (quests.js): el tipo objetivo pesa x2,5 y entra como mucho a los 2:30 virtuales
  function qTarget() { try { return G.Quests.target(); } catch (e) { return null; } }
  function fromOf(k, qt) { var f = B.val(k, 'from'); return k === qt ? Math.min(f, G.Quests.EARLY) : f; }

  // Cacería / práctica (J3, DESIGN 4.2 y 4.4): sin hordas. Tras las 6 ofertas de preparación entra el jefe; solo sus adds + una oleada de limpieza de 3 gusanos cada 25 s
  // (para que las cartas de área tengan algo que hacer), nunca durante la intro, las puertas de fase, los desesperados ni los ataques firma. Tope: 6 normales.
  function huntUpdate(dt) {
    var boss = G.Enemies.boss();
    if (!W.bossSpawned) {
      if (G.pendingLevels > 0) return;   // preparación en curso
      G.prep = null;
      if (G.mode === 'practice') G.practiceHand = { boss: G.bossId, hand: G.Cards.snapshot().hand };
      spawnBoss(); return;
    }
    if (!boss || boss.dead || boss.mode !== 'fight') return;
    if (boss.atk && boss.atk.sig) return;
    if (boss.def.h && boss.def.h.sigNow && boss.def.h.sigNow(boss)) return;
    W.cleanT = (W.cleanT == null ? 12000 : W.cleanT) - dt;
    if (W.cleanT > 0) return;
    W.cleanT = 25000;
    if (G.Boss.normalsAlive() > 3) return;
    var pos = spawnPos();
    for (var i = 0; i < 3; i++) G.Enemies.spawn('worm', G.clamp(pos[0] + G.rnd(-40, 40), G.WALL + 30, G.AW - G.WALL - 30), G.clamp(pos[1] + G.rnd(-40, 40), G.WALL + 30, G.AH - G.WALL - 30));
  }

  W.update = function (dt) {
    if (G.frozen) return;   // intro del jefe
    if (G.mode !== 'run') { huntUpdate(dt); return; }
    var vt = G.vt(), m = vt / 60000, boss = G.Enemies.boss(), E = G.Enemies, qt = qTarget();
    if (!W.bossSpawned && G.runT >= G.BOSS_T) spawnBoss();
    if (W.eliteBoost > 0) W.eliteBoost -= dt;
    try { if (!W.bossSpawned) Assets.music.setIntensity(Math.min(0.9, 0.12 + 0.09 * m + (W.eliteBoost > 0 ? 0.15 : 0))); } catch (e) { /* audio */ }
    // v5: los dos minijefes nunca coexisten (la Madre Colmena espera a que el Coloso caiga) y ninguno entra en el último minuto previo al jefe final
    if (!W.bossSpawned) Object.keys(B.enemy).forEach(function (k) {
      if (!B.enemy[k].elite || W.elitesDone[k] || vt < (k === qt ? Math.min(B.enemy[k].at, G.Quests.EARLY) : B.enemy[k].at)) return;
      if (E.minis().length || G.runT >= G.BOSS_T - W.MINI_LAST) return;
      spawnElite(k);
    });
    W.t += dt;
    if (W.t < 1500) return;
    W.t -= 1500;
    var bm = boss ? G.Boss.spawnMode() : null;   // por fase del jefe: multiplicador, tipos permitidos y tope de normales
    var bp = B.bp(m) * (bm ? bm.mul : 1);
    W.budget = Math.min(W.budget + bp, bp * 2.5);
    var cap = Math.max(6, Math.round((bm ? bm.cap : B.cap(m)) * G.Q.enemyMul)), alive = bm ? G.Boss.normalsAlive() : G.enemies.length, counts = {};
    if (bm && bm.mul <= 0) return;
    G.enemies.forEach(function (e) { if (!e.dead) counts[e.type] = (counts[e.type] || 0) + 1; });
    var types = [];
    Object.keys(B.enemy).forEach(function (k) { var d = B.enemy[k]; if (k !== 'boss' && !d.elite && B.has(k) && fromOf(k, qt) <= vt && (!boss || (bm && bm.allow[k]))) types.push(k); });
    // Rotación de sabor: cada 60 s un tipo protagonista (no gusano) pesa x2.2
    W.starT -= 1500;
    if (W.starT <= 0 || (W.star && types.indexOf(W.star) < 0)) {
      W.starT = 60000;
      var fm = B.famOf(), sc = fm && fm.star, cand = types.filter(function (k) { return k !== 'worm' && (!sc || sc.indexOf(k) >= 0); });
      if (!cand.length) cand = types.filter(function (k) { return k !== 'worm'; });
      W.star = cand.length ? cand[Math.floor(Math.random() * cand.length)] : null;
    }
    // Pack: 15 % por pulso desde 2:45, en vez de un spawn suelto
    if (!boss && vt >= 165000 && Math.random() < 0.15) {
      var packs = B.packsOf(), okp = packs.filter(function (pk) {
        var total = 0, ok = packCost(pk) <= W.budget;
        pk.parts.forEach(function (q) {
          total += q[1];
          if (!B.has(q[0]) || B.val(q[0], 'from') > vt || ((counts[q[0]] || 0) + q[1] > capOf(q[0], m))) ok = false;
          if (q[0] === 'shield' && counts.mini_bulwark) ok = false;
        });
        return ok && alive + total <= cap;
      });
      if (okp.length) {
        var pick = okp[Math.floor(Math.random() * okp.length)];
        spawnPack(pick); W.budget -= packCost(pick);
        return;
      }
    }
    function wOf(k) { return B.val(k, 'w') * B.tierMul(k, m) * (k === W.star ? 2.2 : 1) * (k === qt ? G.Quests.WEIGHT : 1); }
    var guard = 0, tmul = function (k) { return B.tierMul(k, m); };
    while (guard++ < 60 && alive < cap) {
      var opts = types.filter(function (k) {
        var d = B.enemy[k];
        return B.val(k, 'cost') <= W.budget && (counts[k] || 0) < capOf(k, m) && !(k === 'shield' && counts.mini_bulwark);
      });
      if (!opts.length) break;
      var tot = 0; opts.forEach(function (k) { tot += wOf(k); });
      var r = Math.random() * tot, pk2 = opts[0];
      for (var i = 0; i < opts.length; i++) { r -= wOf(opts[i]); if (r <= 0) { pk2 = opts[i]; break; } }
      var pos = spawnPos();
      E.spawn(pk2, pos[0], pos[1]);
      W.budget -= B.val(pk2, 'cost'); alive++; counts[pk2] = (counts[pk2] || 0) + 1;
    }
  };
})();
