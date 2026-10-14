/* waves.js - Director de spawn continuo por presupuesto (sin oleadas): tiers por tiempo, topes por tipo (maxAlive), enemigo protagonista
   rotativo cada 60 s, packs temáticos, élites a 3:30 y 5:30 y el jefe a los 7:30 (con el jefe vivo: 40 % de spawn y solo tipos ligeros). */
(function () {
  'use strict';
  var G = window.G, B = G.B, W = G.Waves = {};

  W.MINI_LAST = 45000;   // ms reales: un minijefe pendiente no entra en los últimos 45 s antes del jefe final
  W.reset = function () { W.t = 0; W.budget = 0; W.bossSpawned = false; W.bossWarn = false; W.elitesDone = {}; W.star = null; W.starT = 0; W.eliteBoost = 0; };
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
    E.spawn(type, pos[0], pos[1]);
    if (type === 'mini_bulwark') { E.spawn('shield', pos[0] + 45, pos[1] + 20); E.spawn('shield', pos[0] - 45, pos[1] + 20); }
    G.Hud.banner('¡ÉLITE: ' + B.enemy[type].name + '!', 2000, '#ffb347');
    G.sfx('boss_roar', { pitch: 1.3, vol: 0.6 });
    W.eliteBoost = 25000;
  }

  // ---- Packs temáticos: [{ t: tipo, n: cantidad, at: función(pos) -> [x,y] }], coste = suma de costes x 0.6
  var PACKS = {
    line:  { parts: [['shield', 3], ['warlock', 1]] },
    cross: { parts: [['fanner', 2]] },
    pincer:{ parts: [['scorcher', 2], ['moth', 1]] },
    field: { parts: [['sower', 2], ['worm', 4]] }
  };
  function packCost(pk) { var c = 0; pk.parts.forEach(function (q) { c += B.enemy[q[0]].cost * q[1]; }); return c * 0.6; }

  function spawnPack(name, counts) {
    var pos = spawnPos(), E = G.Enemies, p = G.player, j;
    if (name === 'line') {   // 3 escuderos en línea y el brujo detrás
      var ang = Math.atan2(p.y - pos[1], p.x - pos[0]), px = -Math.sin(ang), py = Math.cos(ang);
      for (j = -1; j <= 1; j++) E.spawn('shield', pos[0] + px * 44 * j, pos[1] + py * 44 * j);
      E.spawn('warlock', pos[0] - Math.cos(ang) * 60, pos[1] - Math.sin(ang) * 60);
    } else if (name === 'cross') {
      var m = mirror(pos); E.spawn('fanner', pos[0], pos[1]); E.spawn('fanner', m[0], m[1]);
    } else if (name === 'pincer') {
      var m2 = mirror(pos); E.spawn('scorcher', pos[0], pos[1]); E.spawn('scorcher', m2[0], m2[1]);
      var pa = G.rnd(0, 6.283); E.spawn('moth', p.x + Math.cos(pa) * 520, p.y + Math.sin(pa) * 420);
    } else {
      E.spawn('sower', pos[0], pos[1]); E.spawn('sower', pos[0] + 60, pos[1] + 30);
      for (j = 0; j < 4; j++) E.spawn('worm', pos[0] + G.rnd(-50, 50), pos[1] + G.rnd(-50, 50));
    }
  }

  // Tope efectivo por tipo: maxAlive escalado por la curva de tier (mínimo 1 para que el tipo viejo siga apareciendo). Gusano: sin tope propio, lo limita el peso.
  function capOf(k, m) {
    var d = B.enemy[k]; if (!d.maxAlive) return 1e9;
    var sc = B.tier[k] >= 3 ? Math.max(1, B.tierMul(k, m)) : B.tierMul(k, m);   // los fuertes pueden superar su tope base según la curva
    return Math.max(1, Math.round(d.maxAlive * sc));
  }

  // Encargo activo (quests.js): el tipo objetivo pesa x2,5 y entra como mucho a los 2:30 virtuales
  function qTarget() { try { return G.Quests.target(); } catch (e) { return null; } }
  function fromOf(k, qt) { var f = B.enemy[k].from; return k === qt ? Math.min(f, G.Quests.EARLY) : f; }

  W.update = function (dt) {
    var vt = G.vt(), m = vt / 60000, boss = G.Enemies.boss(), E = G.Enemies, qt = qTarget();
    if (G.frozen) return;   // intro del jefe
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
    var cap = bm ? bm.cap : B.cap(m), alive = bm ? G.Boss.normalsAlive() : G.enemies.length, counts = {};
    if (bm && bm.mul <= 0) return;
    G.enemies.forEach(function (e) { if (!e.dead) counts[e.type] = (counts[e.type] || 0) + 1; });
    var types = [];
    Object.keys(B.enemy).forEach(function (k) { var d = B.enemy[k]; if (k !== 'boss' && !d.elite && fromOf(k, qt) <= vt && (!boss || (bm && bm.allow[k]))) types.push(k); });
    // Rotación de sabor: cada 60 s un tipo protagonista (no gusano) pesa x2.2
    W.starT -= 1500;
    if (W.starT <= 0 || (W.star && types.indexOf(W.star) < 0)) {
      W.starT = 60000;
      var cand = types.filter(function (k) { return k !== 'worm'; });
      W.star = cand.length ? cand[Math.floor(Math.random() * cand.length)] : null;
    }
    // Pack: 15 % por pulso desde 2:45, en vez de un spawn suelto
    if (!boss && vt >= 165000 && Math.random() < 0.15) {
      var names = Object.keys(PACKS).filter(function (n) {
        var pk = PACKS[n], total = 0, ok = packCost(pk) <= W.budget;
        pk.parts.forEach(function (q) {
          var d = B.enemy[q[0]]; total += q[1];
          if (d.from > vt || ((counts[q[0]] || 0) + q[1] > capOf(q[0], m))) ok = false;
          if (q[0] === 'shield' && counts.mini_bulwark) ok = false;
        });
        return ok && alive + total <= cap;
      });
      if (names.length) {
        var pick = names[Math.floor(Math.random() * names.length)];
        spawnPack(pick, counts); W.budget -= packCost(PACKS[pick]);
        return;
      }
    }
    function wOf(k) { return B.enemy[k].w * B.tierMul(k, m) * (k === W.star ? 2.2 : 1) * (k === qt ? G.Quests.WEIGHT : 1); }
    var guard = 0, tmul = function (k) { return B.tierMul(k, m); };
    while (guard++ < 60 && alive < cap) {
      var opts = types.filter(function (k) {
        var d = B.enemy[k];
        return d.cost <= W.budget && (counts[k] || 0) < capOf(k, m) && !(k === 'shield' && counts.mini_bulwark);
      });
      if (!opts.length) break;
      var tot = 0; opts.forEach(function (k) { tot += wOf(k); });
      var r = Math.random() * tot, pk2 = opts[0];
      for (var i = 0; i < opts.length; i++) { r -= wOf(opts[i]); if (r <= 0) { pk2 = opts[i]; break; } }
      var pos = spawnPos();
      E.spawn(pk2, pos[0], pos[1]);
      W.budget -= B.enemy[pk2].cost; alive++; counts[pk2] = (counts[pk2] || 0) + 1;
    }
  };
})();
