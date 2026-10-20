/* combat.js - Daño unificado, estados (quemado, ralentizado, veneno, sangrado, aturdido), efectos de combos,
   zonas (charcos, vapor), explosiones, cadenas de rayo y gemas (XP, Ceniza, corazones). */
(function () {
  'use strict';
  var G = window.G, B = G.B, fx = G.fx, C = G.Combat = {};

  G.TAGS = {
    fire:      { name: 'FUEGO',  color: '#ff7a2a' },
    ice:       { name: 'HIELO',  color: '#6ac8ff' },
    lightning: { name: 'RAYO',   color: '#ffe45a' },
    poison:    { name: 'VENENO', color: '#7be34a' },
    blood:     { name: 'SANGRE', color: '#d02048' },
    steel:     { name: 'ACERO',  color: '#b8c0cc' },
    neutral:   { name: 'NEUTRO', color: '#c8b8e8' }
  };
  function A() { return G.Cards.active; }
  function M() { return G.Cards.mods; }
  function col(tag) { return (G.TAGS[tag] || G.TAGS.neutral).color; }
  C.col = col;

  // ------------------------------------------------------------- Búsqueda
  C.nearest = function (x, y, range, exclude) {
    var best = null, bd = range || 1e9, L = G.enemies;
    for (var i = 0; i < L.length; i++) {
      var e = L[i]; if (e.dead || e.spawnT > 0 || (exclude && exclude.indexOf(e) >= 0)) continue;
      var d = Math.hypot(e.x - x, e.y - y) - e.r;
      if (d < bd) { bd = d; best = e; }
    }
    return best;
  };
  C.inRange = function (x, y, r) {
    var out = [], L = G.enemies;
    for (var i = 0; i < L.length; i++) { var e = L[i]; if (!e.dead && e.spawnT <= 0 && Math.hypot(e.x - x, e.y - y) <= r + e.r) out.push(e); }
    return out;
  };

  // ------------------------------------------------------------- Estados
  C.slow = function (e, pct, ms) {
    var m = M(); pct = Math.min(0.8, pct + m.slowAdd); ms += m.slowDur;
    if (G.Tree.fx.permafrost) pct = Math.max(pct, 0.45);   // Permafrost (Hielo): toda ralentización es de al menos el 45 %
    if (e.type === 'boss' || e.big) pct *= 0.5;
    e.slowPct = Math.max(e.slowT > 0 ? e.slowPct : 0, pct); e.slowT = Math.max(e.slowT, ms);
  };
  C.burn = function (e, dps, ms) { e.burnDps = Math.max(e.burnT > 0 ? e.burnDps : 0, dps); e.burnT = Math.max(e.burnT, ms || 2000); };
  C.poison = function (e, n) {
    var a = A(), m = M();
    e.poisonN = Math.min(m.poisonMax, (e.poisonN || 0) + (n || 1));
    var dur = 4000 + (a.plague && e.slowT > 0 ? 3000 : 0), tf = G.Tree.fx;
    e.poisonT = Math.max(e.poisonT, dur);
    if (tf.plaga && (e.big || e.type === 'boss')) e.poisonT = 1e9;   // Plaga (Veneno, maestría): el veneno nunca expira en élites y jefes
    if (tf.neurotoxina && e.poisonN >= 5 && !(e.neuCd > 0)) { e.neuCd = 3000; C.stun(e, 1000); fx.burst(e.x, e.y, 6, '#b4ff7a', 120, 400, 3, { add: true }); }   // Neurotoxina: 5 stacks aturden 1 s
  };
  C.bleed = function (e) { e.bleedT = Math.max(e.bleedT, 3000); };
  C.stun = function (e, ms) { if (e.type === 'boss' || e.big) return; e.stunT = Math.max(e.stunT, ms); };

  // ------------------------------------------------------------- Números y partículas
  // Indicador de debilidad / resistencia por material (A.8): x1,25 = número verde claro, más grande y con "!"; x0,75 = gris, pequeño y entre paréntesis (los críticos siguen dorados)
  C.MAT_WEAK = '#b6ff7a'; C.MAT_RES = '#9a9aa8';
  C.num = function (e, amt, tag, crit) {
    e.numAcc += amt;
    if (crit || e.numT <= 0) {
      var c = (tag === 'steel' || tag === 'neutral') ? '#ffffff' : col(tag), n = Math.round(e.numAcc), mm = e.mm || 1;
      if (mm > 1.02 && !crit) fx.num(e.x, e.y - e.r - 8, n + '!', C.MAT_WEAK, false, { size: 18 });
      else if (mm < 0.98 && !crit) fx.num(e.x, e.y - e.r - 8, '(' + n + ')', C.MAT_RES, false, { size: 11 });
      else fx.num(e.x, e.y - e.r - 8, n, crit ? '#ffe14a' : c, crit || e.numAcc >= 30);
      e.numAcc = 0; e.numT = 150;
    }
  };

  C.hitFx = function (e, tag, ang) {
    var x = e.x, y = e.y;
    switch (tag) {
      case 'fire': fx.spark(x, y, 3, ang); fx.ember(x, y, 2, 6); break;
      case 'ice': fx.burst(x, y, 6, '#bfeaff', 150, 380, 3, { add: true }); fx.burst(x, y, 3, '#6ac8ff', 90, 450, 4); break;
      case 'lightning': fx.burst(x, y, 7, '#fff6a8', 220, 260, 3, { add: true }); break;
      case 'poison': for (var i = 0; i < 4; i++) fx.dot(x + G.rnd(-6, 6), y + G.rnd(-4, 4), G.rnd(-30, 30), G.rnd(-70, -20), G.rnd(400, 650), i % 2 ? '#7be34a' : '#b4ff7a', 4, { drag: 1 }); break;
      case 'blood': fx.burst(x, y, 6, '#c01838', 170, 420, 3, { g: 300 }); break;
      case 'steel': fx.spark(x, y, 2, ang); fx.burst(x, y, 4, '#dfe6f0', 200, 220, 2, { add: true }); break;
      default: fx.burst(x, y, 4, '#d8cfe8', 120, 300, 3);
    }
  };

  // ------------------------------------------------------------- Daño unificado
  // o: { tag, id, ang, kb, burn:dps, slow:[pct,ms], poison, bleed, stun, proj, lifesteal, noChain, zone, depth }
  C.deal = function (e, base, o) {
    o = o || {};
    if (e.dead || e.spawnT > 0) return 0;
    if (e.partOf) return G.Boss.dealPart(e, base, o);   // parte rompible del jefe: reparte al jefe y llena su medidor
    if (e.immune) return 0;   // el Espectro es inmune mientras se desvanece; el jefe en la puerta de fase
    var a = A(), m = M(), p = G.player, tag = o.tag || 'neutral', dmg = base, crit = false;
    var slowed = e.slowT > 0;
    var tf = G.Tree.fx;
    if (e.mat) { e.mm = B.matMul(e, tag); dmg *= e.mm; }   // debilidad / resistencia por material (A.8), antes de resonancia y talentos; e.mat solo existe con G.B.mat.on. e.mm = último multiplicador (lo lee C.num)
    if (tag === 'fire') {
      dmg *= m.fireDmg;
      if (tf.fundicion && (e.big || e.type === 'boss')) dmg *= 1.15;   // Fundición (F7): +15 % a élites y jefe
    }
    if (m.tagMul[tag]) dmg *= m.tagMul[tag];   // Hielo / Rayo / Veneno / Sangre: pasivo del árbol y Resonancia (set)
    if (tag === 'steel') {
      dmg *= m.steelDmg;
      if ((a.edge_ice && slowed) || Math.random() < m.steelCrit) {
        dmg *= 2; crit = true;
        if (m.set4.steel && (!C.filoCd || G.time - C.filoCd > 400)) {   // Filo eterno (set Acero 4+): un crítico recorta 0,3 s todos los cooldowns
          C.filoCd = G.time; for (var fi = 0; fi < p.hand.length; fi++) if (p.hand[fi] && p.hand[fi].cd > 0) p.hand[fi].cd = Math.max(0, p.hand[fi].cd - 300);
        }
      }
    }
    if (tf.quebradizo && slowed) dmg *= 1.25;                          // Quebradizo (Hielo): +25 % de daño a ralentizados
    if (tf.berserker && p.hp < p.maxHp * 0.4) dmg *= 1.35;            // Berserker (Sangre): +35 % con menos del 40 % de vida
    if (p.pactT > 0) dmg *= 1.1;                                       // Pacto de sangre: +10 % de daño 5 s
    if (a.pact && p.hp < p.maxHp * 0.5) dmg *= 1.2;
    if (tag === 'fire' && a.vapor && slowed) {
      dmg *= 1.5;
      if (!o.zone && e.vaporCd <= 0) {
        e.vaporCd = 700;
        C.zone({ kind: 'vapor', x: e.x, y: e.y, r: 40, life: 500, dps: 16, tag: 'fire', interval: 250 });
        fx.burst(e.x, e.y, 6, '#e8f6ff', 80, 500, 5, { add: true, drag: 1 });
      }
    }
    if (tag === 'lightning') {
      if (a.freeze && slowed) { dmg *= 1.5; C.stun(e, 800); fx.burst(e.x, e.y, 5, '#ffffff', 100, 400, 3, { add: true }); }
      if (a.discharge && e.poisonN > 0) {
        dmg += 8 * e.poisonN; fx.num(e.x + 10, e.y - e.r - 22, '-' + e.poisonN + 'x VENENO', '#b4ff7a');
        e.poisonN = 0; e.poisonT = 0; fx.burst(e.x, e.y, 6, '#b4ff7a', 160, 350, 3, { add: true });
      }
    }
    if (e.type === 'boar' && e.st === 'stun') dmg *= 1.5;
    // escudo frontal: solo cuenta si el golpe trae posición de origen (o.sx/o.sy); auras, orbitales y pulsos cuentan como por la espalda
    var blocked = false, pre = dmg;
    if (e.shield && o.sx != null && e.fa != null && Math.abs(G.angDiff(Math.atan2(o.sy - e.y, o.sx - e.x), e.fa)) <= e.shield) {
      if (!e.shieldDown) { dmg *= (tag === 'fire' && tf.fundicion) ? 0.5 : 0.2; blocked = true; }   // Fundición: el escudo frontal frena la mitad
    }
    if (e.expT > 0) dmg *= e.expMul;   // ventana de exposición de los minijefes (x1,5 / x1,4) desde cualquier ángulo
    dmg = Math.max(1, dmg) * G.B.cardDmgMul;   // multiplicador global de balance (sin redondeo: así -2 % cuenta también en golpes pequeños)
    if (e.type === 'boss') { dmg = G.Boss.mulIn(e, dmg, tag, o); if (dmg <= 0) return 0; }   // debilidades, Vellón, ventanas, deduplicado cuerpo+parte
    if (blocked && e.type === 'mini_bulwark') G.Enemies.shieldHit(e, pre * G.B.cardDmgMul);   // Escudo rompible: el daño frontal bloqueado lo gasta
    if (blocked) {
      var ba = e.fa + G.rnd(-0.4, 0.4), bx = e.x + Math.cos(ba) * (e.r + 2), by = e.y + Math.sin(ba) * (e.r + 2);
      if (G.hasSpr('fx_shield_spark')) fx.part('fx_shield_spark', bx, by, Math.cos(ba) * 60, Math.sin(ba) * 60, 220, { add: true, sc: 1.3 });
      else fx.burst(bx, by, 4, '#ffffff', 140, 220, 3, { add: true });
      if (!e.sparkSfx || G.time - e.sparkSfx > 120) { e.sparkSfx = G.time; G.sfx('hit', { pitch: 2.2, vol: 0.4 }); }
    }
    // estados (antes del daño para que el veneno cuente si muere en este golpe)
    if (o.burn || (a.forge && tag === 'steel' && o.proj)) {
      if (o.id === 'spark' && tf.pavesa) C.burn(e, (o.burn || 5) * 1.3, 4000);   // Pavesa (F1-A): quemadura +2 s y +30 %
      else C.burn(e, o.burn || 5, 2000);
    }
    if (o.slow) C.slow(e, o.slow[0], o.slow[1]);
    if (o.poison) C.poison(e, o.poison === 2 ? 2 : 1);
    if (o.bleed) C.bleed(e);
    if (o.stun) C.stun(e, o.stun);
    e.hp -= dmg; e.flash = 70; e.lastTag = tag; e.boomDepth = o.depth || 0;
    if (e.type === 'mini_hive') G.Enemies.sacHit(e, dmg);   // Saco de larvas: absorbe parte de todo el daño
    if (e.type === 'boss') G.Boss.afterHit(e);   // suelo de HP en los umbrales de fase
    C.num(e, dmg, tag, crit);
    if (!o.quiet && !o.zone) C.hitFx(e, tag, o.ang);
    var armor = e.type === 'boss' || e.big || blocked || (e.type === 'boar' && (e.st === 'charge' || e.st === 'roll' || e.st === 'roll2'));   // e.big = super armor de los élites
    if (o.kb && !armor) { var k = 12; e.kx = Math.cos(o.ang || 0) * o.kb * k; e.ky = Math.sin(o.ang || 0) * o.kb * k; }
    if (e.type === 'archer' && e.st === 'aim' && o.kb) { e.st = 'move'; e.shootT = 1200; }
    if (e.type === 'fanner' && e.st === 'aim' && o.kb && !blocked) { e.st = 'move'; e.shootT = 1200; }   // un empujón interrumpe la ráfaga
    if ((e.type === 'boss' || e.big) && !o.zone) fx.hitspark(e.x + G.rnd(-14, 14), e.y + G.rnd(-14, 14), 1.4);
    if (o.proj && a.edge_elec && tag === 'steel' && !o.noChain) {
      var nx = C.nearest(e.x, e.y, 100, [e]);
      if (nx) C.chain(e.x, e.y, nx, 2, 8, 1, 100, 'lightning', { noChain: true, exclude: [e] });
    }
    if (m.set4.ice && e.hp > 0 && e.slowT > 0 && e.hp < e.maxHp * 0.15 && e.type !== 'boss' && !e.big && !e.partOf) {   // Cripta (set Hielo 4+): ralentizados <15 % de vida mueren congelados
      e.hp = 0; fx.burst(e.x, e.y, 8, '#e8f6ff', 160, 450, 3, { add: true }); fx.ring(e.x, e.y, 4, 26, 260, '#bfeaff', 3);
    }
    if (e.hp <= 0) {
      G.Enemies.kill(e, false, tag);
      if (o.lifesteal && Math.random() < B.heal.chance) G.Player.heal(p, o.lifesteal, 'fang');   // robo de vida: 20 % por kill
    }
    return dmg;
  };

  // Daño por estados (sin knockback ni efectos de combo de impacto)
  C.dot = function (e, n, tag) {
    n *= G.B.cardDmgMul;
    if (e.mat) { e.mm = B.matMul(e, tag); n *= e.mm; }   // también los ticks de estados (A.8)
    if (e.type === 'boss') { n = G.Boss.mulIn(e, n, tag, { proj: true, dot: true }); if (n <= 0) return false; }
    if (e.expT > 0) n *= e.expMul;
    e.hp -= n; e.lastTag = tag;
    if (e.type === 'mini_hive') G.Enemies.sacHit(e, n);
    if (e.type === 'boss') G.Boss.afterHit(e);
    e.dotAcc += n;
    if (e.dotT <= 0 && e.dotAcc >= 3) {
      var dm = e.mm || 1, dn = Math.round(e.dotAcc);
      if (e.mat && dm > 1.02) fx.num(e.x, e.y - e.r - 8, dn + '!', C.MAT_WEAK, false, { size: 16 }); else if (e.mat && dm < 0.98) fx.num(e.x, e.y - e.r - 8, '(' + dn + ')', C.MAT_RES, false, { size: 11 }); else fx.num(e.x, e.y - e.r - 8, dn, col(tag));
      e.dotAcc = 0; e.dotT = 600;
    }
    if (e.hp <= 0) { G.Enemies.kill(e, false, tag); return true; }
    return false;
  };

  function tickAcc(e, key, dps, dt, tag) {
    e.acc[key] += dps * dt / 1000;
    if (e.acc[key] >= 1) { var n = Math.floor(e.acc[key]); e.acc[key] -= n; return C.dot(e, n, tag); }
    return false;
  }

  // Devuelve true si el enemigo murió por estados
  C.tickStatus = function (e, dt) {
    var a = A(), m = M();
    if (e.vaporCd > 0) e.vaporCd -= dt;
    if (e.numT > 0) e.numT -= dt;
    if (e.dotT > 0) e.dotT -= dt;
    if (e.slowT > 0) e.slowT -= dt;
    if (e.stunT > 0) e.stunT -= dt;
    if (e.burnT > 0) {
      e.burnT -= dt;
      if (Math.random() < 0.12) fx.flames(e.x, e.y - 4, 1, e.r * 0.6);
      if (tickAcc(e, 'fire', e.burnDps, dt, 'fire')) return true;
    }
    if (e.poisonT > 0) {
      e.poisonT -= dt;
      if (e.poisonT <= 0) e.poisonN = 0;
      else {
        if (Math.random() < 0.05 * e.poisonN) fx.dot(e.x + G.rnd(-6, 6), e.y, 0, -40, 500, '#7be34a', 3, { drag: 1 });
        if (tickAcc(e, 'poison', 4 * e.poisonN * m.poisonDmg, dt, 'poison')) return true;
      }
    }
    if (e.bleedT > 0) e.bleedT -= dt;
    if (e.neuCd > 0) e.neuCd -= dt;
    var bl = ((e.bleedT > 0 ? (G.Tree.fx.sangradoHondo ? 7 : 5) : 0) + (a.bloodpoison && e.poisonN > 0 ? 3 : 0)) * m.tagMul.blood;
    if (bl > 0) {
      if (Math.random() < 0.05) fx.dot(e.x, e.y, G.rnd(-20, 20), 30, 400, '#c01838', 3, { g: 200 });
      if (tickAcc(e, 'blood', bl, dt, 'blood')) return true;
    }
    return false;
  };

  // ------------------------------------------------------------- Rayos, explosiones, zonas
  C.chain = function (sx, sy, first, jumps, dmg, fall, range, tag, o) {
    o = o || {};
    var hits = (o.exclude || []).slice(), cur = first, px = sx, py = sy, d = dmg;
    for (var i = 0; i < jumps && cur; i++) {
      fx.bolt(px, py, cur.x, cur.y, col(tag), 3);
      hits.push(cur);
      var oo = { tag: tag, id: o.id, noChain: true, ang: Math.atan2(cur.y - py, cur.x - px), kb: o.kb, slow: o.slow, zone: o.zone };
      C.deal(cur, d, oo);
      px = cur.x; py = cur.y; d *= fall;
      var next = null, bd = range, L = G.enemies;
      for (var j = 0; j < L.length; j++) {
        var e = L[j]; if (e.dead || e.spawnT > 0 || hits.indexOf(e) >= 0) continue;
        var dd = Math.hypot(e.x - px, e.y - py); if (dd < bd) { bd = dd; next = e; }
      }
      cur = next;
    }
  };

  C.boom = function (x, y, r, dmg, tag, o) {
    o = o || {};
    var c = o.color || col(tag);
    fx.ring(x, y, 6, r, 300, c, 5); fx.shockwave(x, y, r * 2.2);
    fx.burst(x, y, 10, c, 220, 420, 4, { add: true });
    if (tag === 'fire') fx.flames(x, y, 6, r * 0.6);
    var list = C.inRange(x, y, r);
    for (var i = 0; i < list.length; i++) {
      C.deal(list[i], dmg, { tag: tag, id: o.id, ang: Math.atan2(list[i].y - y, list[i].x - x), kb: o.kb || 40, depth: o.depth || 0, noChain: true, zone: o.zone, burn: o.burn, slow: o.slow, poison: o.poison });
    }
    G.Snd.play(o.big ? 'boom' : 'fire', o.big ? 1 : 0.7);
  };

  C.zone = function (z) { z.max = z.life; z.tk = z.interval || 300; G.zones.push(z); };

  function updateZones(dt) {
    for (var i = G.zones.length - 1; i >= 0; i--) {
      var z = G.zones[i]; if (!z || z.team === 'e') continue;   // zonas enemigas: las gestiona enemies.js (z puede faltar si la muerte del jefe limpió zonas a mitad del bucle)
      z.life -= dt; z.tk -= dt;
      if (z.kind === 'pool' && Math.random() < 0.08) fx.dot(z.x + G.rnd(-z.r, z.r) * 0.7, z.y + G.rnd(-z.r, z.r) * 0.5, 0, -30, 600, '#9aff6a', 3, { drag: 1 });
      if (z.tk <= 0) {
        z.tk = z.interval || 300;
        var list = C.inRange(z.x, z.y, z.r);
        for (var j = 0; j < list.length; j++) C.deal(list[j], z.dps * (z.interval || 300) / 1000, { tag: z.tag, id: z.id, poison: z.poison, slow: z.slow, zone: true, noChain: true });
      }
      if (z.life <= 0) G.zones.splice(i, 1);
    }
  }

  C.drawZones = function (c) {
    for (var i = 0; i < G.zones.length; i++) {
      var z = G.zones[i], u = Math.min(1, z.life / 400), t = G.time / 1000;
      if (z.team === 'e') continue;
      c.save(); c.globalAlpha = (z.kind === 'vapor' ? 0.35 : 0.3) * u;
      var g = c.createRadialGradient(z.x, z.y, z.r * 0.2, z.x, z.y, z.r);
      var fk = z.kind === 'napalm' || z.kind === 'embers', k = z.kind === 'vapor' ? '232,246,255' : fk ? '255,130,40' : '110,220,70';
      g.addColorStop(0, 'rgba(' + k + ',0.7)'); g.addColorStop(1, 'rgba(' + k + ',0.05)');
      c.fillStyle = G.fg(g, 'rgba(' + k + ',0.4)'); c.beginPath(); c.ellipse(z.x, z.y, z.r, z.r * 0.8, 0, 0, 6.283); c.fill();
      c.globalAlpha = 0.6 * u; c.strokeStyle = z.kind === 'vapor' ? '#ffffff' : fk ? '#ffb347' : '#9aff6a'; c.lineWidth = 2;
      c.beginPath(); c.ellipse(z.x, z.y, z.r * (0.9 + 0.05 * Math.sin(t * 5 + i)), z.r * 0.72, 0, 0, 6.283); c.stroke();
      c.restore();
    }
  };

  // ------------------------------------------------------------- Sobrecarga: cada 6.º disparo de Rayo/Fuego
  C.shot = function (tag) {
    if (!A().overload || (tag !== 'fire' && tag !== 'lightning')) return;
    C.shotN = (C.shotN || 0) + 1;
    if (C.shotN % 6 !== 0) return;
    var p = G.player, t = C.nearest(p.x, p.y, 460);
    if (!t) return;
    fx.bolt(p.x, p.y - 6, t.x, t.y, '#ff80ff', 5);
    C.boom(t.x, t.y, 60, 45, 'lightning', { color: '#ff80ff', kb: 70, big: true });
    fx.shake(5, 150); fx.hit(35);
  };

  // ------------------------------------------------------------- Muerte
  var killTimes = [], stopCd = 0;
  C.onKill = function (e, tag) {
    var a = A(), p = G.player, d = B.enemy[e.type];
    var elite = d.elite, drops = e.type === 'boss' ? 6 : 1;
    for (var i = 0; i < drops; i++) C.dropGem(e.x, e.y, 'xp', d.xp / drops);
    if (elite) { for (var q = 0; q < 4; q++) C.dropGem(e.x, e.y, 'ash', d.ash / 4); C.dropGem(e.x, e.y, 'heart', B.player.heal * 2); }
    else if (e.type === 'worm' || e.type === 'archer' || e.type === 'bomb') { if (Math.random() < 0.5) C.dropGem(e.x, e.y, 'ash', 2); }
    else for (var j = 0; j < (e.type === 'boss' ? 6 : 1); j++) C.dropGem(e.x, e.y, 'ash', d.ash / (e.type === 'boss' ? 6 : 1));
    if (Math.random() < B.player.heartP) C.dropGem(e.x, e.y, 'heart', B.player.heal);
    G.Loot.onKill(e);
    if (e.burnT > 0) {
      var tf = G.Tree.fx;
      if (tf.cenizas) {   // Cenizas ardientes (F6): el quemado que muere deja fuego en el suelo
        C.zone({ kind: 'embers', x: e.x, y: e.y, r: 35, life: 3000, dps: 6, tag: 'fire', interval: 500 });
        fx.flames(e.x, e.y, 3, 14);
      }
      if (M().pira) {   // Pira (Emblema, 4+ Fuego): las quemaduras se propagan al morir
        var pl = C.inRange(e.x, e.y, 70), pn = 0;
        for (var pi = 0; pi < pl.length && pn < 3; pi++) if (pl[pi] !== e) { C.burn(pl[pi], e.burnDps, 2500); fx.bolt(e.x, e.y, pl[pi].x, pl[pi].y, '#ff7a2a', 2); pn++; }
      }
    }
    var tfk = G.Tree.fx;
    if (tfk.vampiro && tag === 'blood' && Math.random() < 0.12) G.Player.heal(p, 3, 'vampiro');   // Vampiro (Sangre): 12 % de curar 3 HP al matar con Sangre
    if (M().set4.blood) { p.sedN = (p.sedN || 0) + 1; if (p.sedN % 3 === 0) { p.shield = Math.min(20, (p.shield || 0) + 10); G.fx.num(p.x, p.y - 30, '+10 escudo', '#d02048'); } }   // Sed (set Sangre 4+): 3 kills = escudo de 10 HP (tope 20)
    if (tfk.pactoSangre) { p.pactN = (p.pactN || 0) + 1; if (p.pactN % 25 === 0) { G.Player.heal(p, 15, 'pacto'); p.pactT = 5000; G.fx.ring(p.x, p.y, 8, 70, 400, '#d02048', 5); } }   // Pacto de sangre (maestría)
    if (tfk.pandemia && e.poisonN > 0) {   // Pandemia (Veneno): un envenenado que muere pasa sus stacks a 3 enemigos cercanos
      var pn2 = 0, pl2 = C.inRange(e.x, e.y, 90);
      for (var pj = 0; pj < pl2.length && pn2 < 3; pj++) if (pl2[pj] !== e) { C.poison(pl2[pj], Math.min(2, e.poisonN)); fx.bolt(e.x, e.y, pl2[pj].x, pl2[pj].y, '#7be34a', 2); pn2++; }
    }
    if (M().set4.poison && e.poisonN > 0) C.zone({ kind: 'pool', x: e.x, y: e.y, r: 40, life: 2500, dps: 5, tag: 'poison', poison: true, interval: 500 });   // Epidemia (set Veneno 4+): charco venenoso al morir un envenenado
    if (a.frenzy) p.frenzyT = 1500;
    if (a.pact && tag === 'fire' && Math.random() < B.heal.chance) G.Player.heal(p, B.heal.pact, 'pact');
    if (e.poisonN > 0) {
      if (a.bloodpoison) { p.poisonKills++; if (p.poisonKills % 15 === 0) G.Player.heal(p, B.heal.bloodpoison, 'bloodpoison'); }
      if (a.plague) {
        var n = 0, L = C.inRange(e.x, e.y, 70);
        for (var k = 0; k < L.length && n < 3; k++) if (L[k] !== e) { C.poison(L[k], 1); fx.bolt(e.x, e.y, L[k].x, L[k].y, '#7be34a', 2); n++; }
      }
      if (a.gas && (e.boomDepth || 0) < 3) C.boom(e.x, e.y, 50, 25, 'fire', { depth: (e.boomDepth || 0) + 1, color: '#b8ff40' });
    }
    // hit-stop leve solo en kills en masa
    var now = G.time; killTimes.push(now);
    while (killTimes.length && now - killTimes[0] > 150) killTimes.shift();
    if (killTimes.length >= 4 && stopCd <= 0) { fx.hit(30); stopCd = 500; fx.shake(3, 100); }
  };

  // ------------------------------------------------------------- Gemas
  C.dropGem = function (x, y, kind, v) {
    var a = G.rnd(0, 6.283), s = G.rnd(30, 90);
    G.gems.push({ x: x, y: y, kind: kind, v: v, vx: Math.cos(a) * s, vy: Math.sin(a) * s, t: 0, pull: false });
    if (G.gems.length > 260) collect(G.gems.shift());
  };
  function collect(g) {
    var p = G.player, m = M();
    if (g.kind === 'xp') {
      p.xp += g.v * m.xpMul * B.xpGem();
      var need = B.xpNeed(p.level);
      while (p.xp >= need) { p.xp -= need; p.level++; G.pendingLevels++; need = B.xpNeed(p.level); }
      G.Snd.play('gem', 1);
    } else if (g.kind === 'part') {
      G.Loot.collect(g.part, g.trophy); G.Snd.play('gem', 1.8);
    } else if (g.kind === 'ash') {
      p.ash += Math.max(1, Math.round(g.v * m.ashMul)); G.Snd.play('gem', 1.4);
    } else { G.Player.heal(p, g.v, 'gem'); G.sfx('pickup'); }
  }

  function updateGems(dt) {
    var p = G.player, s = dt / 1000, R = B.player.pickup * M().magnet * (G.runBuff && G.runBuff.magnet ? 1.5 : 1);
    for (var i = G.gems.length - 1; i >= 0; i--) {
      var g = G.gems[i]; g.t += dt;
      var dx = p.x - g.x, dy = p.y - g.y, d = Math.hypot(dx, dy);
      if (!p.dead && (g.pull || d < R)) {
        g.pull = true;
        var sp = 260 + g.t * 0.2 + Math.max(0, 200 - d) * 1.5;
        g.x += dx / d * sp * s; g.y += dy / d * sp * s;
        if (d < 12) { collect(g); G.gems.splice(i, 1); }
      } else {
        g.x += g.vx * s; g.y += g.vy * s; var k = Math.exp(-6 * s); g.vx *= k; g.vy *= k;
      }
    }
  }

  C.drawGems = function (c) {
    var t = G.time / 1000;
    for (var i = 0; i < G.gems.length; i++) {
      var g = G.gems[i];
      if (g.x < G.cam.x - 20 || g.x > G.cam.x + G.W + 20 || g.y < G.cam.y - 20 || g.y > G.cam.y + G.VH + 20) continue;
      var bob = Math.sin(t * 5 + i) * 1.5, x = Math.round(g.x), y = Math.round(g.y + bob);
      G.Proj.up(c, g.x, g.y); c.save();
      if (g.kind === 'part' && g.trophy && G.Boss.TROPHY[g.trophy]) {   // trofeo de jefe
        c.globalCompositeOperation = 'lighter'; c.globalAlpha = 0.35 + 0.15 * Math.sin(t * 6 + i); c.fillStyle = '#ffd27a';
        c.beginPath(); c.arc(x, y, 14, 0, 6.283); c.fill(); c.globalCompositeOperation = 'source-over'; c.globalAlpha = 1;
        c.drawImage(Assets.sprite(G.Boss.TROPHY[g.trophy].spr, 0), x - 14, y - 14, 28, 28);
      } else if (g.kind === 'part') {
        c.globalCompositeOperation = 'lighter'; c.globalAlpha = 0.3 + 0.15 * Math.sin(t * 6 + i); c.fillStyle = G.Loot.part(g.part).color;
        c.beginPath(); c.arc(x, y, 11, 0, 6.283); c.fill(); c.globalCompositeOperation = 'source-over'; c.globalAlpha = 1;
        G.UI.part(c, g.part, x, y, 7);
      } else if (g.kind === 'heart') {
        c.fillStyle = '#ff5a7a'; c.strokeStyle = '#3a0a18'; c.lineWidth = 2;
        c.beginPath(); c.moveTo(x, y + 5); c.bezierCurveTo(x - 9, y - 1, x - 5, y - 8, x, y - 3); c.bezierCurveTo(x + 5, y - 8, x + 9, y - 1, x, y + 5); c.fill(); c.stroke();
      } else {
        var cc = g.kind === 'xp' ? '#5dff8a' : '#ff9a3c', r = g.kind === 'xp' ? 4 + Math.min(3, g.v * 0.5) : 4;
        c.globalCompositeOperation = 'lighter'; c.globalAlpha = 0.35; c.fillStyle = cc; c.beginPath(); c.arc(x, y, r + 4, 0, 6.283); c.fill();
        c.globalCompositeOperation = 'source-over'; c.globalAlpha = 1; c.fillStyle = cc; c.strokeStyle = '#102014'; c.lineWidth = 1.5;
        c.beginPath(); c.moveTo(x, y - r - 1); c.lineTo(x + r, y); c.lineTo(x, y + r + 1); c.lineTo(x - r, y); c.closePath(); c.fill(); c.stroke();
        c.fillStyle = 'rgba(255,255,255,0.7)'; c.fillRect(x - 1, y - r + 1, 2, 2);
      }
      c.restore(); G.Proj.down(c);
    }
  };

  C.update = function (dt) {
    if (stopCd > 0) stopCd -= dt;
    updateZones(dt);
    updateGems(dt);
  };
  C.reset = function () { killTimes.length = 0; stopCd = 0; C.shotN = 0; };
})();
