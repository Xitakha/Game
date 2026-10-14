/* boss_letea.js - Jefes v4 (fase J2): LETEA, LA HIDRA DEL OLVIDO (asfodelo). DESIGN-v4-jefes.md 3.4.
   Cuerpo casi fijo en un charco (se desplaza a 30 px/s entre 2 charcos) y tres cabezas elementales con comportamiento propio que atacan en paralelo
   (ranuras escalonadas 1,1 s): verde (ácido), azul (hielo), amarilla (rayo). Cada cabeza es una parte rompible que REBROTA a los 18 s (12 s en la fase 3, 14 / 9 s en
   Peligro IV+) salvo que se cauterice con Fuego (3 s de fuego sostenido sobre la herida); 3 cabezas rotas a la vez = Cuerpo desnudo (derribo de 6 s x1,5).
   Ataques del cuerpo: Coletazo (rosquilla), Sumersión (inmune bajo el agua; emerge bajo el jugador), Marea (ola de 90 px con 2 huecos) y Plañideras (Polillas).
   Ataque desesperado: Coro del Olvido. Debilidad: Sangre (F1-F2) -> Veneno (F3, muda la sangre); resistencia Hielo; Rayo x1,1 (el cuerpo está en el agua).
   Se engancha al motor genérico de boss.js (DEFS[id].h) y reutiliza sus utilidades (G.Boss.u). Arte final: assets_boss2.js (con dibujo de reserva aquí). */
(function () {
  'use strict';
  var G = window.G, S = G.Boss, fx = G.fx, E = G.Enemies, U = S && S.u;
  if (!S || !U) return;
  var ATKS = S.ATKS, ATK = S.ATK, TAU = Math.PI * 2, DEG = Math.PI / 180;
  var ease = U.ease, angTo = U.angTo, sfx = U.sfx, hurt = U.hurt, pel = U.pel, expose = U.expose;
  function PL() { return G.player; }
  function A() { return S.A; }
  function ART() { try { return !!(Assets.drawBossBand && Assets.bossIds().indexOf('letea') >= 0 && G.hasSpr('boss_letea_body')); } catch (x) { return false; } }   // arte de assets_boss2.js disponible

  var POOLS = [[560, 270], [880, 270], [720, 600]];                    // charcos de agua (r 90; +20 % en la fase 2); Letea se mueve entre los 2 primeros
  var PILLARS = [[360, 300], [1080, 360], [500, 540], [940, 600]];     // pilares de cristal (r 26): cobertura y huecos de la Marea
  var KEYS = ['verde', 'azul', 'amarilla'], ARTK = { verde: 'acid', azul: 'ice', amarilla: 'bolt' }, OWN = { verde: 'l_acido', azul: 'l_aliento', amarilla: 'l_rayo' };
  var OFF = { verde: -0.85, azul: 0, amarilla: 0.85 }, CORO = { verde: -150 * DEG, azul: -90 * DEG, amarilla: -30 * DEG };
  var COL = { verde: '#7be34a', azul: '#6ac8ff', amarilla: '#ffe45a' };

  S.DEFS.letea = {
    id: 'letea', name: 'Letea, la Hidra del Olvido', title: 'Tres Memorias', furia: 'DE LETEA', hp: 6600, r: 80, gy: (window.Assets && Assets.BOSS && Assets.BOSS.letea) ? Assets.BOSS.letea.gy : 56,
    phases: [
      { n: 'Tres memorias', thr: 0.65, cad: 3200, spd: 30, music: 0.55, spawn: { mul: 0.25, allow: { worm: 1, archer: 1, bomb: 1 }, cap: 15 } },
      { n: 'Marea',         thr: 0.30, cad: 2600, spd: 30, music: 0.78, spawn: { mul: 0.25, allow: { worm: 1, archer: 1, fanner: 1 }, cap: 15 } },
      { n: 'Antídoto',      thr: 0,    cad: 2200, spd: 30, music: 1.0,  spawn: { mul: 0, allow: {}, cap: 0 } }
    ],
    despairAt: 0.08, despair: 'Coro del Olvido',
    barCol: ['#2f9a8a', '#3a8ac8', '#7be34a'],
    parts: {
      verde:    { name: 'Cabeza verde',    fem: true, pct: 0.08, hz: 1.15, trophy: 'acid', r: 28 },
      azul:     { name: 'Cabeza azul',     fem: true, pct: 0.08, hz: 1.15, trophy: 'ice',  r: 28 },
      amarilla: { name: 'Cabeza amarilla', fem: true, pct: 0.08, hz: 1.15, trophy: 'bolt', r: 28 }
    },
    weak: [{ tag: 'blood', mul: 1.25, phases: [1, 2] }, { tag: 'poison', mul: 1.25, phases: [3] }, { tag: 'lightning', mul: 1.1, phases: [1, 2, 3] }],
    resist: [{ tag: 'ice', mul: 0.8 }],
    hpCal: 4.0, brasas: 12, brasasPart: 4, pf: 2, pfFirst: 3,
    guaranteed: { spine: 2, frost: 2, fang: 1 },
    h: { camW: 0.4 }
  };
  var D = S.DEFS.letea, H = D.h;
  [['acid', 'trophy_letea_acid', 'Colmillo Ácido'], ['ice', 'trophy_letea_ice', 'Perla Helada'], ['bolt', 'trophy_letea_bolt', 'Ojo Tormentoso']].forEach(function (t) {
    Object.defineProperty(S.TROPHY, t[0], { enumerable: true, configurable: true, get: function () { return { spr: G.hasSpr(t[1]) ? t[1] : 'trophy_pastor_horn', name: t[2] }; } });
  });

  // ------------------------------------------------------------------ utilidades
  function clampX(x, m) { return G.clamp(x, G.WALL + (m || 30), G.AW - G.WALL - (m || 30)); }
  function clampY(y, m) { return G.clamp(y, G.WALL + (m || 30), G.AH - G.WALL - (m || 30)); }
  function poolR(a, i) { return 90 * (a.poolMul || 1); }
  function crystalBlocks(ox, oy, p) {   // ¿un pilar de cristal tapa el trayecto cabeza -> jugador?
    for (var i = 0; i < S.obs.length; i++) {
      var o = S.obs[i]; if (o.dead || o.kind !== 'crystal') continue;
      var dx = p.x - ox, dy = p.y - oy, l2 = dx * dx + dy * dy, t = l2 ? G.clamp(((o.x - ox) * dx + (o.y - oy) * dy) / l2, 0, 1) : 0;
      if (Math.hypot(ox + dx * t - o.x, oy + dy * t - o.y) < o.r + 4) return true;
    }
    return false;
  }
  function breakCrystal(o) {
    if (o.dead) return;
    o.dead = true; o.deadAt = G.time; o.warn = false;
    fx.burst(o.x, o.y, 14, '#bfeaff', 220, 600, 4, { add: true }); fx.puff(o.x, o.y, 2); fx.shake(4, 140); sfx('hit', { pitch: 1.8, vol: 0.5 });
    A().rub.push({ x: o.x, y: o.y });
  }
  function pressure() {
    var a = A(), n = 0, k;
    for (k in a.slots) { var A0 = a.slots[k].A; if (A0 && A0.step !== 'rec') n++; }
    if (a.bands.length) n += 2;
    return n;
  }
  function headAlive(e, k) { return !e.broken[k]; }
  function hd(k) { return A().hd[k]; }
  function toPool(e, i) { A().pi = i; e.x = POOLS[i][0]; e.y = POOLS[i][1]; }

  // ------------------------------------------------------------------ ganchos del motor
  H.pos = function () { return { x: POOLS[0][0], y: POOLS[0][1] }; };
  H.setup = function (e, p) {
    var a = A();
    a.pi = 0; a.moveWait = 7000; a.poolMul = 1; a.poolTo = 1; a.rub = []; a.bands = []; a.strikes = []; a.wounds = {}; a.subU = 0; a.naked = false; a.hd = {}; a.slots = { body: { A: null, cadT: 3500 } };
    KEYS.forEach(function (k, i) {
      a.hd[k] = { key: k, x: e.x, y: e.y, hold: false, vis: null };
      a.slots[k] = { A: null, cadT: 1500 + i * 1100 };
    });
    PILLARS.forEach(function (q) { S.obs.push({ x: q[0], y: q[1], r: 26, hp: 1, dead: false, shake: 0, sortY: q[1] + 6, kind: 'crystal', draw: drawCrystal }); });
    e.rise = 0; e.foot = D.gy; e.submerged = false; e.cadMul = 1;
    S.cds.l_marea = 6000; S.cds.l_sumersion = 5000;
  };
  H.anchors = function (e) {
    var a = A(), out = {};
    KEYS.forEach(function (k) { var h = a.hd[k]; out[k] = { x: h.x - e.x, y: h.y - e.y, r: 28 }; });
    return out;
  };
  H.keepAtk = function () { return true; };   // Letea no se tambalea: sus ranuras de ataque siguen (solo el derribo x1,3 al romper una cabeza)
  H.partMul = function (e, pe) { return pe.expT > 0 ? 1.25 : 1; };
  H.sigP = function (e) {
    var a = A(), m = 0;
    for (var k in a.slots) { var A0 = a.slots[k].A; if (A0 && A0.sig && A0.step === 'tele') m = Math.max(m, Math.min(1, A0.t / A0.tele)); }
    return m;
  };
  H.sigNow = function (e) { var a = A(); for (var k in a.slots) { var A0 = a.slots[k].A; if (A0 && A0.sig && A0.step !== 'rec') return true; } return false; };
  H.clear = function (e) {
    var a = A(), k;
    if (e.submerged) emerge(e, null);
    for (k in a.slots) a.slots[k].A = null;
    a.bands.length = 0; a.strikes.length = 0;
    for (k in a.hd) a.hd[k].hold = false;
  };
  H.onGate = function (e) {
    var a = A(), k;
    for (k in a.slots) a.slots[k].cadT = 2500 + (k === 'verde' ? 0 : k === 'azul' ? 1100 : k === 'amarilla' ? 2200 : 800);
    if (e.phase === 2) { a.poolTo = 1.2; G.Hud.banner('LOS CHARCOS CRECEN', 2200, '#6ac8ff'); }
    if (e.phase === 3) { G.Hud.banner('MUDA SU SANGRE: DEBILIDAD AL VENENO', 2600, '#7be34a'); fx.ring(e.x, e.y, 30, 340, 700, '#7be34a', 6); }
  };

  // ------------------------------------------------------------------ cabezas rotas: herida, rebrote y cauterizado
  H.onBreak = function (e, pe) {
    var a = A(), k = pe.key, h = a.hd[k], an = angTo(e, { x: h.x, y: h.y });
    a.slots[k].A = null; h.hold = false;
    pe.regrow = true; pe.regrowT = 18000; pe.regrowF = 0; pe.cauter = false; pe.cautT = 0;
    var w = U.mkPart(e, k + '_w', e.x + Math.cos(an) * 84, e.y + Math.sin(an) * 84, 24, 1e12, 1);   // herida abierta: se puede apuntar; el Fuego sostenido la cauteriza
    w.isWound = true; w.head = pe; w.cautT = 0; w.fireUntil = 0; a.wounds[k] = w; G.enemies.unshift(w);
    fx.burst(h.x, h.y, 14, COL[k], 220, 600, 4, { add: true });
    if (e.broken.verde && e.broken.azul && e.broken.amarilla && !a.naked) {   // Cuerpo desnudo: la gran ventana del jefe
      a.naked = true; expose(e, 1.5, 6000, 'derribo'); G.Hud.banner('¡CUERPO DESNUDO!', 2000, '#ffd24a'); fx.shake(9, 300);
    }
  };
  H.onPartHit = function (e, pe, o) {
    if (pe.isWound && o && o.tag === 'fire') pe.fireUntil = G.time + 700;
  };
  function cauterize(e, k, w) {
    var pe = e.parts[k]; pe.regrow = false; pe.cauter = true; w.dead = true;
    fx.flames(w.x, w.y, 14, 24); fx.burst(w.x, w.y, 12, '#ff9a3c', 200, 600, 4, { add: true }); sfx('flame', { vol: 0.8 });
    G.Hud.banner('¡' + D.parts[k].name.toUpperCase() + ' CAUTERIZADA!', 1800, '#ff9a3c');
  }
  function regrow(e, k) {
    var a = A(), pe = e.parts[k], w = a.wounds[k], h = a.hd[k];
    pe.dead = false; pe.regrow = false; pe.meter = pe.meterMax * 0.5; e.broken[k] = false; a.naked = false;
    if (w) w.dead = true;
    h.x = e.x + (w ? w.x - e.x : 0) * 0.6; h.y = e.y + (w ? w.y - e.y : 0) * 0.6;
    G.enemies.push(pe); a.slots[k].cadT = 2200;
    fx.burst(h.x, h.y, 12, COL[k], 200, 600, 4, { add: true }); fx.shake(4, 150); sfx('boss_roar', { pitch: 1.6, vol: 0.4 });
    G.Hud.banner('¡' + D.parts[k].name.toUpperCase() + ' REBROTA!', 1500, COL[k]);
  }

  // ------------------------------------------------------------------ bucle de arena: charcos, cabezas, ranuras de ataque, olas, rayos
  function headTarget(e, k, t) {
    var a = A(), p = PL(), kk = KEYS.indexOf(k), d = Math.hypot(p.x - e.x, p.y - e.y), base = d < 900 ? angTo(e, p) : 90 * DEG;
    if (e.mode === 'despair') { var an0 = CORO[k]; return { x: e.x + Math.cos(an0) * 200, y: e.y + Math.sin(an0) * 160 }; }
    var R = (e.submerged || a.subU > 0.3 ? 100 : 168) + 26 * Math.sin(t / 800 + kk * 2.1), an = base + OFF[k] + 0.08 * Math.sin(t / 1100 + kk);
    return { x: clampX(e.x + Math.cos(an) * R, 36), y: clampY(e.y + Math.sin(an) * R * 0.92, 36) };
  }
  H.tick = function (e, dt) {
    var a = A(), p = PL(), t = G.time, i, k, rate;
    // charcos
    if (a.poolMul < a.poolTo) a.poolMul = Math.min(a.poolTo, a.poolMul + 0.2 * dt / 2000);
    if (!p.dead) for (i = 0; i < POOLS.length; i++) if (Math.hypot(p.x - POOLS[i][0], p.y - POOLS[i][1]) < poolR(a) - 4) G.Player.slow(p, 0.3, 300);
    a.subU += ((e.submerged ? 1 : 0) - a.subU) * Math.min(1, dt / 220);
    // pilares de cristal: se reconstruyen a los 35 s
    for (i = 0; i < S.obs.length; i++) {
      var o = S.obs[i]; if (o.kind !== 'crystal' || !o.dead) continue;
      var age = G.time - o.deadAt; o.warn = age > 33500;
      if (age >= 35000) { o.dead = false; o.warn = false; S.pushOutOne(o, p, p.r); fx.burst(o.x, o.y, 8, '#bfeaff', 120, 400, 3, { add: true }); sfx('hit', { pitch: 1.4, vol: 0.4 }); }
    }
    // cabezas: siguen su objetivo con muelle; las que atacan se quedan quietas (salvo el mordisco, que las mueve el ataque)
    for (k in a.hd) {
      var h = a.hd[k], pe = e.parts[k];
      if (e.broken[k] && !(pe && pe.dead === false)) {   // cabeza cortada: el muñón queda en el borde del cuerpo
        var w = a.wounds[k]; if (w) { h.x = w.x; h.y = w.y; }
      } else if (!h.hold) {
        var T = headTarget(e, k, t), s = Math.min(1, dt / 1000 * (e.mode === 'intro' ? 4 : 7));
        h.x += (T.x - h.x) * s; h.y += (T.y - h.y) * s;
      }
    }
    // rebrote / cauterizado
    for (k in a.wounds) {
      var wd = a.wounds[k], hp = e.parts[k];
      if (wd.dead && !hp.regrow) continue;
      if (wd.dead) continue;
      if (G.time < wd.fireUntil) wd.cautT += dt; else wd.cautT = Math.max(0, wd.cautT - dt * 0.3);
      hp.cautF = wd.cautT / 3000;
      if (wd.cautT >= 3000) { cauterize(e, k, wd); continue; }
      rate = (e.phase === 3 ? 1.5 : 1) * (pel().regrow ? 18 / 14 : 1);
      hp.regrowT -= dt * rate; hp.regrowF = 1 - hp.regrowT / 18000;
      if (hp.regrowT <= 0) regrow(e, k);
    }
    // olas (Marea)
    for (i = a.bands.length - 1; i >= 0; i--) {
      var b = a.bands[i]; b.x += b.dir * b.v * dt / 1000;
      if (!b.hit && !p.dead && S.noHurt <= 0 && Math.abs(p.x - b.x) < b.w / 2 + p.r * 0.5) {
        var inGap = false; for (var g = 0; g < b.gaps.length; g++) if (Math.abs(p.y - b.gaps[g]) <= 50 - 4) inGap = true;
        if (!inGap) { b.hit = true; hurt(e, 20, 'boss_marea', { kb: 1.2, slow: [0.2, 800] }); }
      }
      if ((b.dir > 0 && b.x > G.AW + 80) || (b.dir < 0 && b.x < -80)) a.bands.splice(i, 1);
    }
    for (i = a.strikes.length - 1; i >= 0; i--) { a.strikes[i].t += dt; if (a.strikes[i].t > 380) a.strikes.splice(i, 1); }
    // movimiento lento del cuerpo entre los 2 charcos (a 30 px/s)
    e.moveAmt = 0;
    if (e.mode === 'fight' && !e.submerged) {
      a.moveWait -= dt;
      var tgt = POOLS[1 - a.pi];
      if (a.moveWait <= 0) {
        var dd = Math.hypot(tgt[0] - e.x, tgt[1] - e.y);
        if (dd < 3) { a.pi = 1 - a.pi; a.moveWait = 9000; }
        else { var st = Math.min(dd, 30 * dt / 1000); e.x += (tgt[0] - e.x) / dd * st; e.y += (tgt[1] - e.y) / dd * st; e.moveAmt = 1; e.curSpd = 30; }
      }
    }
    e.face = p.x >= e.x ? 1 : -1;
  };

  // ------------------------------------------------------------------ ranuras de ataque (3 cabezas + cuerpo en paralelo)
  H.fight = function (e, dt) {
    var a = A(), p = PL(), PH = e.def.phases[e.phase - 1], k, sl, P = pressure(), maxP = 3;
    var sub = a.slots.body.A && a.slots.body.A.name === 'l_sumersion';
    for (k in a.slots) {
      sl = a.slots[k];
      if (sl.A) {
        if (U.stepAtk(e, sl.A, dt)) { var done = sl.A; sl.A = null; if (done.head) { a.hd[done.head].hold = false; } sl.cadT = Math.max(sl.cadT, 300); e.last = done.name; }
        continue;
      }
      if (e.stagT > 0) { e.stagT -= 0; }
      if (p.dead || sub) continue;
      var isBody = k === 'body';
      if (!isBody && e.broken[k]) continue;
      sl.cadT -= dt * S.fury * (isBody ? 1 : 1);
      if (sl.cadT > 0) continue;
      P = pressure();
      var n = isBody ? pickBody(e, P) : pickHead(e, k, P, maxP);
      if (!n) { sl.cadT = 350; continue; }
      var A1 = U.makeAtk(e, n, isBody ? null : { head: k });
      sl.A = A1;
      if (!isBody) a.hd[k].hold = true;
      sl.cadT = isBody ? (e.phase === 1 ? 3800 : e.phase === 2 ? 3300 : 2900) * (KEYS.every(function (kk) { return e.broken[kk]; }) ? 0.6 : 1) : PH.cad;
    }
    // el cuerpo sumergido no puede ser objetivo de las cartas (las cabezas sí)
  };
  function pickHead(e, k, P, maxP) {
    var h = hd(k), p = PL(), d = Math.hypot(p.x - h.x, p.y - h.y), own = OWN[k], i, n;
    if (P >= maxP) return null;
    var opts = [own, 'l_mordisco'];
    if (e.lastHead === k + own) opts.reverse();
    for (i = 0; i < opts.length; i++) {
      n = opts[i];
      if ((S.cds[n] || 0) > 0) continue;
      if (n === 'l_mordisco' && (d > 320 || P >= 2)) continue;
      if (n === 'l_aliento' && (d < 30 || d > 400)) continue;
      e.lastHead = k + n; return n;
    }
    return null;
  }
  function pickBody(e, P) {
    var p = PL(), d = Math.hypot(p.x - e.x, p.y - e.y), bag = ['l_coletazo'], i, n;
    if (e.phase >= 2) bag.push('l_sumersion', 'l_marea');
    if (e.phase >= 3) bag.push('l_planideras');
    bag = U.shuffle(bag);
    for (i = 0; i < bag.length; i++) {
      n = bag[i];
      if ((S.cds[n] || 0) > 0 || n === e.lastBody) continue;
      if (n === 'l_coletazo' && (d > 330 || P > 1)) continue;
      if ((n === 'l_sumersion' || n === 'l_marea') && (P > 0 || A().bands.length)) continue;
      if (n === 'l_planideras' && (U.addsAlive() >= pel().cap || P > 1)) continue;
      e.lastBody = n; return n;
    }
    return null;
  }

  // ------------------------------------------------------------------ ataques
  function def(name, o) { o.b = 'letea'; ATKS[name] = o; }
  def('l_mordisco',   { name: 'Mordisco en picado',  tele: 700,  cd: 3200,  dmg: 22, phases: [1, 2, 3] });
  def('l_acido',      { name: 'Escupitajo ácido',    tele: 900,  cd: 10000, dmg: 8,  phases: [1, 2, 3] });
  def('l_aliento',    { name: 'Aliento helado',      tele: 900,  cd: 9000,  dmg: 14, phases: [1, 2, 3] });
  def('l_rayo',       { name: 'Rayo del cielo',      tele: 1000, cd: 10000, dmg: 22, phases: [1, 2, 3] });
  def('l_coletazo',   { name: 'Coletazo',            tele: 800,  cd: 8000,  dmg: 24, phases: [1, 2, 3] });
  def('l_sumersion',  { name: 'Sumersión',           tele: 1000, cd: 16000, dmg: 28, phases: [2, 3], sig: true });
  def('l_marea',      { name: 'Marea',               tele: 1200, cd: 18000, dmg: 20, phases: [2, 3] });
  def('l_planideras', { name: 'Plañideras',          tele: 800,  cd: 20000, dmg: 0,  phases: [3] });

  // ---- Mordisco en picado: la cabeza se echa atrás, se lanza 320 px y vuelve; si falla queda expuesta 1 s (x1,25 a esa cabeza)
  ATK.l_mordisco = {
    start: function (e, A0) { var h = hd(A0.head); A0.ox = h.x; A0.oy = h.y; A0.aim = angTo(h, PL()); A0.len = 320; A0.w = 70; A0.pose = 'mordisco'; A0.fixAt = 220;   // el carril sigue al jugador solo 220 ms: quedan 480 ms de línea fija (reacción 250 + salida lateral ~190)
      A0.rec = 300; A0.hit = false; A0.drawAct = false; },
    tele: function (e, A0) {
      var h = hd(A0.head), u = ease(A0.t / A0.tele);
      if (A0.t < A0.fixAt) A0.aim = Math.atan2(PL().y - A0.oy, PL().x - A0.ox);
      h.x = A0.ox - Math.cos(A0.aim) * 34 * u; h.y = A0.oy - Math.sin(A0.aim) * 34 * u;
    },
    go: function (e, A0) { sfx('whoosh', { pitch: 0.7, vol: 0.7 }); fx.shake(3, 100); },
    act: function (e, A0) {
      var h = hd(A0.head), p = PL(), t = A0.t, d;
      if (t < 250) d = A0.len * ease(t / 250) - 34 * (1 - ease(t / 250)); else d = A0.len * (1 - ease(Math.min(1, (t - 250) / 450)));
      h.x = A0.ox + Math.cos(A0.aim) * d; h.y = A0.oy + Math.sin(A0.aim) * d;
      if (!A0.hit && !p.dead && Math.hypot(p.x - h.x, p.y - h.y) < 30 + p.r * 0.5) { A0.hit = true; hurt(e, A0.def.dmg, 'boss_mordisco', { kb: 1.4 }); sfx('hit_heavy', { vol: 0.6 }); }
      if (t >= 700) { h.x = A0.ox; h.y = A0.oy; if (!A0.hit) { var pe = e.parts[A0.head]; if (pe && !pe.dead) { pe.expT = 1000; fx.ring(pe.x, pe.y, 10, 50, 300, '#ffe9a0', 3); } } return true; }
      return false;
    },
    draw: function (c, e, A0) { Assets.drawBossTele(c, 'lane', A0.ox, A0.oy, { w: A0.w, len: A0.len, a: A0.aim, p: A0.t / A0.tele, fix: A0.t >= A0.fixAt, t: G.time }); },
    haz: function (e, A0, out) { if (A0.step === 'tele') out.push({ k: 'lane', x: A0.ox, y: A0.oy, a: A0.aim, w: A0.w, len: A0.len, t0: A0.tele - A0.t, t1: A0.tele - A0.t + 700 }); }
  };

  // ---- Escupitajo ácido (cabeza verde): 3 charcos ácidos r 50 durante 6 s (Coro: r 65, 4 s)
  ATK.l_acido = {
    start: function (e, A0) {
      var p = PL(), big = A0.big || 1, a0 = Math.random() * TAU, h = hd(A0.head); A0.pose = 'escupitajo'; A0.rec = 600; A0.actMs = 300; A0.r = 50 * big; A0.spots = []; A0.ox = h.x; A0.oy = h.y; A0.aim = angTo(h, p);
      for (var i = 0; i < 3; i++) {
        var an = a0 + i * TAU / 3, d = G.rnd(55, 125) * big, x = clampX(p.x + Math.cos(an) * d, 60), y = clampY(p.y + Math.sin(an) * d, 60);
        A0.spots.push({ x: x, y: y });
        var z = E.zone({ kind: 'acid', x: x, y: y, r: A0.r, arm: A0.tele, life: big > 1 ? 4000 : 6000, dmg: 8 * U.dmgMul(), tick: 500, slow: 0.15, owner: e, src: 'boss_acido' }); z.noArmDraw = true;
      }
    },
    go: function (e, A0) { sfx('hit', { pitch: 0.7, vol: 0.5 }); fx.burst(A0.ox, A0.oy, 8, '#7be34a', 160, 400, 3, { add: true }); },
    act: function (e, A0) { return A0.t >= A0.actMs; },
    draw: function (c, e, A0) { for (var i = 0; i < A0.spots.length; i++) Assets.drawBossTele(c, ART() ? 'acid' : 'spore', A0.spots[i].x, A0.spots[i].y, { r: A0.r, p: A0.t / A0.tele, t: G.time }); },
    haz: function () { }
  };

  // ---- Aliento helado (cabeza azul): cono azul de 40 grados, alcance 420, estático 0,8 s; ralentiza 35 % durante 2 s
  ATK.l_aliento = {
    start: function (e, A0) {
      var big = A0.big || 1, h = hd(A0.head); A0.ox = h.x; A0.oy = h.y; A0.aim = angTo(h, PL()); A0.reach = 420 * big; A0.half = 20 * DEG * big; A0.pose = 'aliento'; A0.actMs = 800; A0.rec = 500; A0.hit = false; A0.drawAct = true;
    },
    tele: function (e, A0) { if (A0.t < A0.tele * 0.55) A0.aim = Math.atan2(PL().y - A0.oy, PL().x - A0.ox); },
    go: function (e, A0) { sfx('flame', { vol: 0.6, pitch: 1.6 }); fx.shake(3, 150); },
    act: function (e, A0, dt) {
      var p = PL();
      if (Math.random() < 0.8) { var d = G.rnd(40, A0.reach); fx.burst(A0.ox + Math.cos(A0.aim) * d, A0.oy + Math.sin(A0.aim) * d, 1, '#bfeaff', 60, 400, 3, { add: true }); }
      if (!A0.hit && !p.dead) {
        var d2 = Math.hypot(p.x - A0.ox, p.y - A0.oy);
        if (d2 <= A0.reach + p.r && Math.abs(G.angDiff(Math.atan2(p.y - A0.oy, p.x - A0.ox), A0.aim)) <= A0.half && !crystalBlocks(A0.ox, A0.oy, p)) { A0.hit = true; hurt(e, A0.def.dmg, 'boss_aliento_helado', { slow: [0.35, 2000], kb: 0.6 }); }
      }
      return A0.t >= A0.actMs;
    },
    draw: function (c, e, A0) { Assets.drawBossTele(c, ART() ? 'frost' : 'cone', A0.ox, A0.oy, { r: A0.reach, arc: A0.half * 2, a: A0.aim, p: A0.step === 'tele' ? A0.t / A0.tele : 1, color: 'blue', fix: A0.step !== 'tele' || A0.t >= A0.tele * 0.55, t: G.time }); },
    haz: function (e, A0, out) {
      if (A0.step === 'tele') out.push({ k: 'arc', x: A0.ox, y: A0.oy, r: A0.reach, inner: 0, a: A0.aim, arc: A0.half * 2, t0: A0.tele - A0.t, t1: A0.tele - A0.t + A0.actMs });
      else if (A0.step === 'act' && !A0.hit) out.push({ k: 'arc', x: A0.ox, y: A0.oy, r: A0.reach, inner: 0, a: A0.aim, arc: A0.half * 2, t0: 0, t1: A0.actMs - A0.t });
    }
  };

  // ---- Rayo del cielo (cabeza amarilla): 4 rayos r 45 cayendo cada 250 ms (F3: 6 sobre una línea hacia el jugador); los pilares de cristal absorben el rayo
  ATK.l_rayo = {
    start: function (e, A0) {
      var p = PL(), big = A0.big || 1, h = hd(A0.head), n = e.phase === 3 && !A0.big ? 6 : 4, i, an;
      A0.pose = 'rayo'; A0.rec = 500; A0.r = 45 * big; A0.bolts = []; A0.drawAct = true; A0.n = n; A0.ox = h.x; A0.oy = h.y;
      if (e.phase === 3 || A0.big) {   // en línea desde la cabeza hacia el jugador y más allá
        var ang = angTo(h, p), dd = Math.hypot(p.x - h.x, p.y - h.y);
        for (i = 0; i < n; i++) { var f = Math.max(60, dd - 200) + i * 80 * big; A0.bolts.push({ x: clampX(h.x + Math.cos(ang) * f, 40), y: clampY(h.y + Math.sin(ang) * f, 40), st: 0 }); }
      } else {
        A0.bolts.push({ x: clampX(p.x + G.rnd(-22, 22), 40), y: clampY(p.y + G.rnd(-22, 22), 40), st: 0 });
        var a0 = Math.random() * TAU;
        for (i = 1; i < n; i++) { an = a0 + i * TAU / (n - 1) + G.rnd(-0.3, 0.3); A0.bolts.push({ x: clampX(p.x + Math.cos(an) * G.rnd(95, 130) * big, 40), y: clampY(p.y + Math.sin(an) * G.rnd(95, 130) * big, 40), st: 0 }); }
      }
      U.shuffle(A0.bolts);
    },
    go: function (e, A0) { sfx('whoosh', { pitch: 2.0, vol: 0.4 }); },
    act: function (e, A0) {
      var p = PL(), a = A();
      for (var i = 0; i < A0.bolts.length; i++) {
        var b = A0.bolts[i]; if (b.st || A0.t < i * 250) continue;
        b.st = 1; a.strikes.push({ x: b.x, y: b.y, t: 0 }); fx.shake(4, 120); sfx('explosion', { pitch: 1.8, vol: 0.5 }); fx.burst(b.x, b.y, 8, '#fff6a8', 240, 350, 3, { add: true }); fx.ring(b.x, b.y, 8, A0.r, 250, '#ffe45a', 4);
        var absorbed = false;
        for (var j = 0; j < S.obs.length; j++) { var o = S.obs[j]; if (o.kind === 'crystal' && !o.dead && Math.hypot(o.x - b.x, o.y - b.y) < A0.r + o.r) { absorbed = true; breakCrystal(o); break; } }
        if (!absorbed && !p.dead && Math.hypot(p.x - b.x, p.y - b.y) <= A0.r) hurt(e, A0.def.dmg, 'boss_rayo', { kb: 1.2 });
      }
      return A0.t >= (A0.n - 1) * 250 + 200;
    },
    draw: function (c, e, A0) {
      for (var i = 0; i < A0.bolts.length; i++) { var b = A0.bolts[i]; if (b.st) continue; var tt = A0.step === 'tele' ? A0.t : A0.tele + A0.t; Assets.drawBossTele(c, ART() ? 'bolt' : 'circle', b.x, b.y, { r: A0.r, p: G.clamp(tt / (A0.tele + i * 250), 0, 1), color: 'gold', t: G.time }); }
    },
    haz: function (e, A0, out) {
      for (var i = 0; i < A0.bolts.length; i++) { var b = A0.bolts[i]; if (b.st) continue; var rem = (A0.step === 'tele' ? A0.tele - A0.t : -A0.t) + i * 250; out.push({ k: 'circle', x: b.x, y: b.y, r: A0.r, t0: rem, t1: rem + 150 }); }
    }
  };

  // ---- Coletazo: la cola barre 360 grados; zona segura interior (pegado al cuerpo) y exterior
  ATK.l_coletazo = {
    start: function (e, A0) { A0.inner = 110; A0.outer = 240; A0.pose = 'coletazo'; A0.actMs = 400; A0.rec = 600; },
    go: function (e, A0) {
      var p = PL(), d = Math.hypot(p.x - e.x, p.y - e.y);
      fx.shake(7, 220); sfx('hit_heavy', { pitch: 0.8, vol: 0.8 }); sfx('whoosh', { pitch: 0.6, vol: 0.7 }); fx.ring(e.x, e.y, A0.inner, A0.outer, 350, '#bfeaf0', 6); fx.burst(e.x, e.y, 12, '#bfeaff', 260, 500, 4, { add: true });
      if (!p.dead && d >= A0.inner && d <= A0.outer + p.r * 0.5) hurt(e, A0.def.dmg, 'boss_coletazo', { kb: 1.5 });
    },
    act: function (e, A0) { return A0.t >= A0.actMs; },
    draw: function (c, e, A0) { Assets.drawBossTele(c, 'donut', e.x, e.y, { r: A0.outer, inner: A0.inner, p: A0.t / A0.tele, t: G.time }); },
    haz: function (e, A0, out) { if (A0.step === 'tele') out.push({ k: 'arc', x: e.x, y: e.y, r: A0.outer, inner: A0.inner, a: 0, arc: TAU + 0.2, t0: A0.tele - A0.t, t1: A0.tele - A0.t + 150 }); }
  };

  // ---- Sumersión: se hunde 2,5 s (inmune; las cabezas siguen vivas y se pueden romper) y emerge bajo el jugador con una erupción (r 140, 28)
  function emerge(e, A0) {
    var a = A(), tx = A0 ? A0.tx : e.x, ty = A0 ? A0.ty : e.y, bi = 0, bd = 1e9, i;
    e.submerged = false; e.immune = false; e.spawnT = 0;
    for (i = 0; i < 2; i++) { var d = Math.hypot(POOLS[i][0] - tx, POOLS[i][1] - ty); if (d < bd) { bd = d; bi = i; } }
    toPool(e, bi); a.moveWait = 9000;
    for (var k in a.slots) if (k !== 'body') a.slots[k].cadT = Math.max(a.slots[k].cadT, 900);
  }
  ATK.l_sumersion = {
    start: function (e, A0) { var p = PL(); A0.tx = clampX(p.x, 60); A0.ty = clampY(p.y, 60); A0.r = 140; A0.pose = 'sumersion'; A0.fixAt = 400; A0.actMs = 2500; A0.rec = 800; A0.drawAct = true; A0.sub = false; },
    tele: function (e, A0) { if (A0.t < A0.fixAt) { var p = PL(); A0.tx = clampX(p.x, 60); A0.ty = clampY(p.y, 60); } },
    go: function (e, A0) {
      e.submerged = true; e.immune = true; e.spawnT = 99999;   // spawnT: las cartas no apuntan al cuerpo hundido (las cabezas sí)
      fx.ring(e.x, e.y, 20, 140, 500, '#6ac8ff', 5); fx.burst(e.x, e.y, 18, '#bfeaff', 240, 600, 4, { add: true }); sfx('shockwave', { pitch: 0.8, vol: 0.7 }); A0.sub = true;
    },
    act: function (e, A0) {
      if (A0.t >= A0.actMs) {
        var p = PL();
        fx.shake(9, 300); fx.hit(40); sfx('explosion', { pitch: 0.8, vol: 0.9 }); fx.shockwave(A0.tx, A0.ty, 300); fx.burst(A0.tx, A0.ty, 24, '#bfeaff', 320, 700, 5, { add: true }); fx.ring(A0.tx, A0.ty, 20, A0.r, 400, '#ffffff', 6);
        if (!p.dead && Math.hypot(p.x - A0.tx, p.y - A0.ty) <= A0.r) hurt(e, A0.def.dmg, 'boss_sumersion', { kb: 1.6 });
        emerge(e, A0); return true;
      }
      return false;
    },
    draw: function (c, e, A0) { Assets.drawBossTele(c, ART() ? 'bubbles' : 'circle', A0.tx, A0.ty, { r: A0.r, p: A0.step === 'tele' ? A0.t / (A0.tele + A0.actMs) : (A0.tele + A0.t) / (A0.tele + A0.actMs), fix: A0.step !== 'tele' || A0.t >= A0.fixAt, sig: true, t: G.time }); },
    haz: function (e, A0, out) {
      if (A0.step === 'tele') out.push({ k: 'circle', x: A0.tx, y: A0.ty, r: A0.r, t0: A0.tele - A0.t + A0.actMs, t1: A0.tele - A0.t + A0.actMs + 150 });
      else if (A0.step === 'act') out.push({ k: 'circle', x: A0.tx, y: A0.ty, r: A0.r, t0: A0.actMs - A0.t, t1: A0.actMs - A0.t + 150 });
    }
  };

  // ---- Marea: ola de 90 px que cruza toda la arena a 220 px/s con 2 huecos de 100 px (en la fila de dos pilares)
  ATK.l_marea = {
    ok: function () { return !A().bands.length; },
    start: function (e, A0) {
      var rows = U.shuffle(PILLARS.map(function (q) { return q[1]; })), g1 = rows[0], g2 = rows[1], tries = 0;
      while (Math.abs(g1 - g2) < 120 && tries++ < 8) g2 = rows[Math.floor(Math.random() * rows.length)];
      A0.dir = Math.random() < 0.5 ? 1 : -1; A0.gaps = [g1, g2]; A0.x0 = A0.dir > 0 ? G.WALL - 10 : G.AW - G.WALL + 10; A0.w = 90; A0.v = 220; A0.pose = 'marea'; A0.actMs = 300; A0.rec = 600; A0.drawAct = false;
    },
    go: function (e, A0) {
      A().bands.push({ x: A0.x0, dir: A0.dir, v: A0.v, w: A0.w, gaps: A0.gaps.slice(), hit: false });
      fx.shake(6, 300); sfx('shockwave', { pitch: 0.6, vol: 0.8 });
    },
    act: function (e, A0) { return A0.t >= A0.actMs; },
    draw: function (c, e, A0) { drawBand(c, A0.x0, A0.dir, A0.w, A0.gaps, A0.t / A0.tele, true); },
    haz: function (e, A0, out) {
      if (A0.step === 'tele') out.push({ k: 'band', x: A0.x0, dir: A0.dir, v: A0.v, w: A0.w, gaps: A0.gaps, t0: A0.tele - A0.t, t1: A0.tele - A0.t + (G.AW + 160) / A0.v * 1000 });
    }
  };

  // ---- Plañideras: 3 Polillas gélidas (tope de adds)
  ATK.l_planideras = {
    ok: function () { return U.addsAlive() < pel().cap; },
    start: function (e, A0) {
      var P = pel(), room = P.cap - U.addsAlive(), p = PL(), n = Math.max(0, Math.min(3 + P.adds, room)), a0 = Math.random() * TAU; A0.pose = 'plaideras'; A0.actMs = 300; A0.rec = 600; A0.spots = [];
      for (var i = 0; i < n; i++) {
        var an = a0 + i * TAU / 3, x = clampX(e.x + Math.cos(an) * 170, 50), y = clampY(e.y + Math.sin(an) * 140, 50);
        if (Math.hypot(x - p.x, y - p.y) < 90) { x = clampX(x + (x < p.x ? -110 : 110), 50); }
        A0.spots.push({ x: x, y: y }); var ad = E.spawn('moth', x, y, { summoned: true, spawnT: A0.tele }); ad.bossAdd = true;
      }
      sfx('wave_start', { pitch: 0.8, vol: 0.8 });
    },
    go: function (e) { fx.ring(e.x, e.y, 10, 130, 500, '#a060ff', 5); fx.shake(4, 150); sfx('hit_heavy', { pitch: 0.7, vol: 0.5 }); },
    act: function (e, A0) { return A0.t >= A0.actMs; },
    draw: function (c, e, A0) { for (var i = 0; i < A0.spots.length; i++) Assets.drawBossTele(c, 'summon', A0.spots[i].x, A0.spots[i].y, { r: 44, p: A0.t / A0.tele, t: G.time }); },
    haz: function () { }
  };

  // ------------------------------------------------------------------ ataque desesperado: Coro del Olvido
  H.onDespair = function (e) {
    var a = A(); a.coro = { n: 0 };
    expose(e, 1.25, 9500, 'despair');
    for (var k in a.slots) a.slots[k].A = null;
    KEYS.forEach(function (kk) { a.hd[kk].hold = false; });
  };
  H.updDespair = function (e, dt) {
    var a = A(), k, i, order = ['verde', 'azul', 'amarilla'];
    e.despT += dt; e.moveAmt = 0;
    while (a.coro.n < 6 && e.despT >= 1000 + a.coro.n * 1500) {   // cada 1,5 s una cabeza canta su patrón (+30 % de tamaño); las cabezas rotas no cantan
      var key = order[a.coro.n % 3]; a.coro.n++;
      if (!headAlive(e, key) || a.slots[key].A) continue;
      a.slots[key].A = U.makeAtk(e, OWN[key], { head: key, big: 1.3 }); a.hd[key].hold = true; sfx('boss_roar', { pitch: 1.4 + 0.15 * order.indexOf(key), vol: 0.4 });
    }
    for (k in a.slots) { if (a.slots[k].A && U.stepAtk(e, a.slots[k].A, dt)) { a.slots[k].A = null; if (k !== 'body') a.hd[k].hold = false; } }
    if (e.despT >= 10000 && !pressure()) {
      e.mode = 'fight'; e.cadT = 1500; KEYS.forEach(function (kk, ii) { a.slots[kk].cadT = 1200 + ii * 1100; a.hd[kk].hold = false; });
      G.Hud.banner('El coro se apaga...', 1300, '#c090ff');
    }
  };
  H.onDeath = function (e) {
    var a = A(); a.bands.length = 0; e.submerged = false; e.spawnT = 0;
    for (var k in a.wounds) a.wounds[k].dead = true;
    for (var s in a.slots) a.slots[s].A = null;
  };

  // ------------------------------------------------------------------ intro: el estanque burbujea 800 ms y las 3 cabezas emergen una a una (300 ms de diferencia)
  H.intro = function (e, I, t) {
    e.alpha = 1; e.lift = 0; e.rise = G.clamp(t / 1800, 0, 1);
    if (t < 800 && Math.random() < 0.35) fx.dot(e.x + G.rnd(-80, 80), e.y + G.rnd(10, 50), G.rnd(-10, 10), G.rnd(-60, -20), 700, '#bfeaff', G.rnd(2, 5), { add: true });
    KEYS.forEach(function (k, i) {
      var h = hd(k), T = headTarget(e, k, G.time), u = ease((t - 800 - i * 300) / 700);
      h.x = e.x + (T.x - e.x) * u; h.y = e.y + (T.y - e.y) * u;
      if (!I['h' + i] && t >= 800 + i * 300) { I['h' + i] = true; fx.ring(h.x, h.y, 8, 70, 400, COL[k], 4); fx.burst(h.x, h.y, 10, '#bfeaff', 220, 500, 4, { add: true }); sfx('shockwave', { pitch: 1.0 + i * 0.2, vol: 0.5 }); fx.shake(3, 120); }
    });
    if (t >= 800 && !I.landed) { I.landed = true; fx.shockwave(e.x, e.y, 320); }
  };

  // ------------------------------------------------------------------ DIBUJO
  var OUT = '#1b1124';
  function artStateL(e) {
    var a = A(), st = S.expo(e), t = G.time, heads = {}, sl;
    KEYS.forEach(function (k) {
      var h = a.hd[k], pe = e.parts[k], A0 = a.slots[k] && a.slots[k].A, o = { tx: h.x - e.x, ty: h.y - e.y, broken: !!e.broken[k], regrow: pe.regrow ? G.clamp(pe.regrowF || 0, 0, 1) : 0, cauter: pe.cauter ? 1 : (pe.cautF || 0), exposed: pe.expT > 0, hurt: pe.flash > 0 ? 1 : 0 };
      if (A0) {
        var nm = ({ l_mordisco: 'mordisco', l_acido: 'escupitajo', l_aliento: 'aliento', l_rayo: 'rayo' })[A0.name] || null;
        o.aim = A0.aim != null ? A0.aim : angTo(e, PL());
        if (e.mode === 'despair') { o.windup = 'coro'; o.wp = 0.5; o.strike = A0.step === 'act' ? 'coro' : null; o.sp = A0.step === 'act' ? G.clamp(A0.t / 600, 0, 0.999) : 0; }
        else if (A0.step === 'tele') { o.windup = nm; o.wp = G.clamp(A0.t / A0.tele, 0, 0.999); }
        else if (A0.step === 'act') { o.strike = nm; o.sp = G.clamp(A0.t / (A0.actMs || 700), 0, 0.999); }
      }
      heads[ARTK[k]] = o;
    });
    var s = { t: t, phase: e.phase, hurt: e.hurtT > 0 ? 0.6 : 0, enraged: S.fury > 1, desperate: e.mode === 'despair', exposed: st.mul > 1 && st.kind !== 'stun' && st.kind !== 'derribo' || (st.kind === 'derribo' && st.mul > 1.4),
      stun: st.kind === 'derribo' || st.kind === 'stun', immune: e.immune && !e.submerged && e.mode === 'gate', roar: e.roar || 0, alpha: e.alpha == null ? 1 : e.alpha, facing: e.face, submerge: a.subU, emerge: e.rise == null ? 1 : e.rise, heads: heads };
    sl = a.slots.body.A;
    if (sl) {
      var bn = ({ l_coletazo: 'coletazo', l_sumersion: 'sumersion', l_marea: 'marea', l_planideras: 'plaideras' })[sl.name];
      if (sl.step === 'tele') { s.windup = bn; s.wp = G.clamp(sl.t / sl.tele, 0, 0.999); }
      else if (sl.step === 'act') { s.strike = bn; s.sp = G.clamp(sl.t / (sl.actMs || 400), 0, 0.999); }
    }
    if (e.mode === 'despair') s.windup = 'coro', s.wp = 0.5;
    return s;
  }
  // dibujo de reserva por código (sin arte): cuerpo, cuellos con muelle y cabezas de color
  function drawL(c, e, s) {
    var a = A(), t = G.time, x = e.x, y = e.y, sub = s.submerge, rise = s.emerge;
    c.save();
    c.globalAlpha = s.alpha * (1 - sub * 0.85);
    // charco
    var g = c.createRadialGradient(x, y + 56, 10, x, y + 56, 150); g.addColorStop(0, 'rgba(120,200,230,0.85)'); g.addColorStop(1, 'rgba(60,120,170,0)'); c.fillStyle = g; c.beginPath(); c.ellipse(x, y + 56, 150, 52, 0, 0, TAU); c.fill();
    c.save(); c.beginPath(); c.rect(x - 260, y - 260, 520, 260 + 62); c.clip(); c.translate(0, (1 - rise) * 120 + sub * 60);
    // cola
    c.strokeStyle = OUT; c.lineWidth = 30; c.lineCap = 'round'; c.beginPath(); c.moveTo(x - s.facing * 70, y + 20); c.quadraticCurveTo(x - s.facing * 130, y + 30, x - s.facing * 150, y - 10); c.stroke();
    c.strokeStyle = '#2f6f6a'; c.lineWidth = 22; c.stroke();
    // cuerpo
    c.fillStyle = '#2f6f6a'; c.strokeStyle = OUT; c.lineWidth = 5; c.beginPath(); c.ellipse(x, y + 8, 100, 62, 0, 0, TAU); c.fill(); c.stroke();
    c.fillStyle = s.phase >= 3 ? '#4a8a3a' : '#e8e4d4'; c.beginPath(); c.ellipse(x, y + 30, 70, 30, 0, 0, TAU); c.fill();
    c.restore(); c.restore();
    // cuellos y cabezas
    KEYS.forEach(function (k, i) {
      var h = a.hd[k], pe = e.parts[k], broken = e.broken[k], hx = h.x, hy = h.y;
      c.save(); c.globalAlpha = s.alpha * (rise > 0.3 + i * 0.15 ? 1 : 0);
      if (broken) { c.fillStyle = pe.cauter ? '#241418' : '#c0283c'; c.strokeStyle = OUT; c.lineWidth = 3; c.beginPath(); c.arc(hx, hy, 14, 0, TAU); c.fill(); c.stroke(); c.restore(); return; }
      var mx = (x + hx) / 2 + Math.sin(t / 500 + i) * 14, my = (y + hy) / 2 - 24;
      for (var pass = 0; pass < 2; pass++) { c.strokeStyle = pass ? COL[k] : OUT; c.lineWidth = pass ? 15 : 22; c.lineCap = 'round'; c.beginPath(); c.moveTo(x, y); c.quadraticCurveTo(mx, my, hx, hy); c.stroke(); }
      c.fillStyle = COL[k]; c.strokeStyle = OUT; c.lineWidth = 4; c.beginPath(); c.arc(hx, hy, 26, 0, TAU); c.fill(); c.stroke();
      c.fillStyle = '#1b1124'; c.beginPath(); c.arc(hx - 8, hy - 5, 4, 0, TAU); c.arc(hx + 8, hy - 5, 4, 0, TAU); c.fill();
      c.fillStyle = '#fff'; c.beginPath(); c.arc(hx, hy + 11, 7, 0, Math.PI); c.fill();
      if (pe.expT > 0) { c.strokeStyle = 'rgba(255,230,120,0.95)'; c.lineWidth = 3; c.beginPath(); c.arc(hx, hy, 34, 0, TAU); c.stroke(); }
      c.restore();
    });
    if (s.exposed) { c.strokeStyle = 'rgba(255,224,110,' + (0.55 + 0.35 * Math.sin(t / 120)) + ')'; c.lineWidth = 4; c.beginPath(); c.ellipse(x, y + 56, 130, 44, 0, 0, TAU); c.stroke(); }
    if (e.immune && e.mode === 'gate') { c.strokeStyle = 'rgba(160,220,255,0.7)'; c.lineWidth = 3; c.setLineDash([6, 8]); c.lineDashOffset = -t / 30; c.beginPath(); c.ellipse(x, y + 56, 150, 50, 0, 0, TAU); c.stroke(); c.setLineDash([]); }
    if (e.submerged) G.txt(c, 'SUMERGIDA', x, y - 4, 14, '#bfeaff', 'center');
    c.restore();
  }
  H.draw = function (c, e) {
    var s = artStateL(e);
    if (ART()) Assets.drawBoss('letea', c, e.x, e.y, s); else drawL(c, e, s);
    // marcas de heridas (cauterizado): barra fina sobre la herida
    var a = A();
    for (var k in a.wounds) { var w = a.wounds[k]; if (w.dead) continue; var f = G.clamp(w.cautT / 3000, 0, 1); if (f > 0.02) { c.fillStyle = '#1a0a12'; c.fillRect(w.x - 21, w.y - 34, 42, 6); c.fillStyle = '#ff9a3c'; c.fillRect(w.x - 20, w.y - 33, 40 * f, 4); } }
  };
  H.drawGhost = function (c, Dd) {
    var u = G.clamp(Dd.dt / 2600, 0, 1), fake = { x: Dd.x, y: Dd.y, parts: {}, broken: { verde: true, azul: true, amarilla: true }, mode: 'dead', immune: false, submerged: false };
    var a = A();
    c.save(); c.globalAlpha = 1 - u;
    c.fillStyle = '#2f6f6a'; c.strokeStyle = OUT; c.lineWidth = 5; c.beginPath(); c.ellipse(Dd.x, Dd.y + 8 + u * 60, 100, 62 * (1 - u * 0.5), 0, 0, TAU); c.fill(); c.stroke();
    c.restore();
  };

  function drawCrystal(c, it) {
    var o = it.o, sh = o.shake > 0 ? (Math.random() * 2 - 1) * 2 : 0, x = Math.round(o.x + sh), y = o.y;
    if (ART()) { Assets.drawPillar(c, 'crystal', x, y, { hp: 1, t: G.time }); return; }
    c.save(); c.fillStyle = 'rgba(0,0,0,0.3)'; c.beginPath(); c.ellipse(x, y + 14, 28, 10, 0, 0, TAU); c.fill();
    c.fillStyle = '#8ad8ff'; c.strokeStyle = OUT; c.lineWidth = 4; c.lineJoin = 'round';
    c.beginPath(); c.moveTo(x - 18, y + 16); c.lineTo(x - 12, y - 40); c.lineTo(x, y - 62); c.lineTo(x + 12, y - 40); c.lineTo(x + 18, y + 16); c.closePath(); c.fill(); c.stroke();
    c.fillStyle = 'rgba(255,255,255,0.55)'; c.beginPath(); c.moveTo(x - 6, y + 10); c.lineTo(x - 4, y - 38); c.lineTo(x + 2, y - 50); c.lineTo(x + 2, y + 10); c.closePath(); c.fill();
    c.restore();
  }
  function drawBand(c, x, dir, w, gaps, p, tele) {
    var y0 = G.WALL, y1 = G.AH - G.WALL, i, ys = [y0];
    if (ART() && !tele) {   // relleno translúcido bajo el arte: la ola se lee mejor sobre el suelo verde
      var sg0 = [y0]; gaps.slice().sort(function (a1, b1) { return a1 - b1; }).forEach(function (g) { sg0.push(g - 50, g + 50); }); sg0.push(y1);
      c.save(); c.fillStyle = 'rgba(60,160,230,0.38)'; for (i = 0; i < sg0.length; i += 2) c.fillRect(x - w / 2, sg0[i], w, sg0[i + 1] - sg0[i]); c.restore();
    }
    if (ART()) {   // (x,y) = centro del borde delantero; para dir < 0 el marco local va girado 180 grados: se espejan los huecos
      var len = y1 - y0;
      Assets.drawBossBand(c, x + dir * w / 2, (y0 + y1) / 2, dir > 0 ? 0 : Math.PI, len, w, { gaps: gaps.map(function (g) { var s0 = g - 50 - y0, s1 = g + 50 - y0; return dir > 0 ? [s0, s1] : [len - s1, len - s0]; }), style: 'water', p: p, tele: !!tele, t: G.time, alpha: 1 }); return;
    }
    gaps.slice().sort(function (a, b) { return a - b; }).forEach(function (g) { ys.push(g - 50, g + 50); }); ys.push(y1);
    c.save();
    for (i = 0; i < ys.length; i += 2) {
      c.fillStyle = tele ? 'rgba(255,60,60,' + (0.14 + 0.26 * p) + ')' : 'rgba(80,170,230,0.55)'; c.fillRect(x - w / 2, ys[i], w, ys[i + 1] - ys[i]);
      c.strokeStyle = tele ? 'rgba(255,120,110,0.9)' : 'rgba(210,240,255,0.9)'; c.lineWidth = 3; c.strokeRect(x - w / 2, ys[i], w, ys[i + 1] - ys[i]);
    }
    c.fillStyle = 'rgba(120,200,255,0.8)';
    for (var yy = y0 + 30; yy < y1; yy += 70) { var ax = x + dir * (w / 2 + 28 + 10 * Math.sin(G.time / 150)); c.beginPath(); c.moveTo(ax, yy); c.lineTo(ax - dir * 18, yy - 12); c.lineTo(ax - dir * 18, yy + 12); c.closePath(); c.fill(); }
    c.restore();
  }
  H.drawGround = function (c, e) {
    var a = A(), t = G.time, i;
    for (i = 0; i < POOLS.length; i++) {
      var r = poolR(a);
      if (ART()) Assets.drawWaterPool(c, POOLS[i][0], POOLS[i][1], r, t + i * 400);
      else {
        var g = c.createRadialGradient(POOLS[i][0], POOLS[i][1], r * 0.2, POOLS[i][0], POOLS[i][1], r);
        g.addColorStop(0, 'rgba(110,200,235,0.8)'); g.addColorStop(0.8, 'rgba(60,140,200,0.7)'); g.addColorStop(1, 'rgba(40,110,170,0.5)');
        c.fillStyle = g; c.beginPath(); c.ellipse(POOLS[i][0], POOLS[i][1], r, r * 0.8, 0, 0, TAU); c.fill();
        c.strokeStyle = 'rgba(210,245,255,' + (0.5 + 0.2 * Math.sin(t / 300 + i)) + ')'; c.lineWidth = 3; c.stroke();
        c.strokeStyle = 'rgba(210,245,255,0.35)'; c.lineWidth = 2; c.beginPath(); c.ellipse(POOLS[i][0], POOLS[i][1], r * (0.45 + 0.1 * Math.sin(t / 400 + i)), r * 0.36, 0, 0, TAU); c.stroke();
      }
    }
    if (ART()) for (i = 0; i < S.obs.length; i++) { var oc = S.obs[i]; if (oc.kind === 'crystal' && oc.dead) Assets.drawPillar(c, 'crystal', oc.x, oc.y, { hp: 0, rebuild: oc.warn ? (G.time - oc.deadAt - 33500) / 1500 : 0, t: t }); }
    else for (i = 0; i < a.rub.length; i++) { var rb = a.rub[i]; c.fillStyle = 'rgba(160,220,250,0.5)'; c.strokeStyle = OUT; c.lineWidth = 2; c.beginPath(); c.ellipse(rb.x, rb.y + 6, 24, 9, 0, 0, TAU); c.fill(); c.stroke(); }
    for (i = 0; i < S.obs.length; i++) { var o = S.obs[i]; if (o.kind === 'crystal' && o.dead && o.warn) { c.strokeStyle = 'rgba(255,255,255,' + (0.5 + 0.4 * Math.sin(t / 90)) + ')'; c.lineWidth = 3; c.beginPath(); c.arc(o.x, o.y, o.r + 8, 0, TAU); c.stroke(); } }
    for (i = 0; i < a.bands.length; i++) drawBand(c, a.bands[i].x, a.bands[i].dir, a.bands[i].w, a.bands[i].gaps, 1, false);
    // rayos cayendo
    for (i = 0; i < a.strikes.length; i++) {
      var sk = a.strikes[i], u = sk.t / 380;
      if (ART()) { Assets.drawLightning(c, sk.x, sk.y, u, { r: 45, t: t }); continue; }
      c.save(); c.globalAlpha = 1 - u; c.strokeStyle = '#fff6a8'; c.lineWidth = 7 * (1 - u) + 2; c.lineJoin = 'round'; c.beginPath(); c.moveTo(sk.x, sk.y);
      for (var sg = 1; sg <= 6; sg++) c.lineTo(sk.x + ((sg * 37 + sk.x) % 31 - 15), sk.y - sg * 46); c.stroke();
      c.strokeStyle = '#ffe45a'; c.lineWidth = 3; c.stroke(); c.restore();
    }
    // telegrafía del cuerpo (Sumersión y Marea se dibujan también en la ranura 'body')
    for (var k in a.slots) {
      if (k === 'body' && e.atk) continue;
      var A0 = a.slots[k].A; if (!A0 || A0.step === 'rec') continue;
      var Hh = ATK[A0.name]; if (Hh.draw && (A0.step === 'tele' || A0.drawAct)) Hh.draw(c, e, A0);
    }
  };
  H.items = function () { };

  // ------------------------------------------------------------------ amenazas para el bot / pruebas
  H.hazards = function (e, out) {
    var a = A(), k, i;
    for (k in a.slots) {
      var A0 = a.slots[k].A, n0 = out.length; if (!A0) continue;
      if (ATK[A0.name].haz) { ATK[A0.name].haz(e, A0, out); for (i = n0; i < out.length; i++) out[i].ref = A0; }
    }
    for (i = 0; i < a.bands.length; i++) { var b = a.bands[i]; out.push({ ref: b, k: 'band', x: b.x, dir: b.dir, v: b.v, w: b.w, gaps: b.gaps, t0: 0, t1: ((b.dir > 0 ? G.AW + 80 - b.x : b.x + 80)) / b.v * 1000, live: true }); }
  };
  H.force = function (e, name, arg) {   // pruebas / capturas: G.Boss.force('l_rayo', 'amarilla') fuerza el ataque en la ranura de esa cabeza (o 'body')
    var a = A(), k = arg || (({ l_acido: 'verde', l_aliento: 'azul', l_rayo: 'amarilla' })[name]) || (/^l_(coletazo|sumersion|marea|planideras)$/.test(name) ? 'body' : 'verde');
    if (e.mode !== 'fight' || a.slots[k].A) return false;
    a.slots[k].A = U.makeAtk(e, name, k === 'body' ? null : { head: k }); if (k !== 'body') a.hd[k].hold = true;
    return true;
  };
  S.leteaInfo = function () { var a = A(); return { sub: A().subU, bands: a.bands.length, naked: a.naked, slots: Object.keys(a.slots).map(function (k) { return k + ':' + (a.slots[k].A ? a.slots[k].A.name + '/' + a.slots[k].A.step : '-'); }).join(' '), regrow: KEYS.map(function (k) { var p = S.e.parts[k]; return p.regrow ? Math.round(p.regrowT) : (S.e.broken[k] ? 'x' : 'ok'); }) }; };
})();
