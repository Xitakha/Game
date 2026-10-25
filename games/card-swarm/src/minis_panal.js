/* minis_panal.js - Los 2 minijefes del PANAL (P5; DESIGN-v6-minijefes.md s.5): AVISPÓN REAL (slot 1 a 3:30, presión, voladora) y REINA JOVEN (slot 2 a 5:30, control; la Madre Colmena movida al Panal).
   Misma estructura que minis_atk.js: cada ataque { name, cd, ok, off, tele(e), fix, exit, dmg, start, aim, fire, run, draw, pz, sig, double }. Datos (HP, parte, botín, Insignia) en minis.js (D.avispon / D.reina_joven).
   Avispón: Picado de aguijón (propio 1, carril 60 x 340, tele 650, 24), Zumbido envolvente (propio 2, órbita 2 s a 160 px y abanico de 5 aguijones de 9, tele 600), Estocada real (firma, carril 70 x 380,
   tele 900, 26; si falla queda expuesto 1 s x1,25), Golpe de ala (solo con el Aguijón roto, alcance 90, 16). Parte: Aguijón (24 %, share 0,45): al romperse pierde Estocada y Picado doble. El humo lo seda 1 s (-40 % vel).
   Reina Joven: Escupitajo (3 globos de miel que aterrizan y dejan un charco), Miel (abre celdas de miel con aviso de 1100 ms, 10 s), Lluvia de larvas (firma) y Eclosión al 50 % (larvas explosivas; tope de adds 3).
   Parte: Abdomen (28 %, share 0,40): roto, sin Lluvia y todo más corto. Débiles a Fuego y Hielo (x1,25, insecto), Veneno x0,75. Colores: rojo = daño directo, ámbar oscuro = miel, morado = invocación. */
(function () {
  'use strict';
  var G = window.G, B = G.B, E = G.Enemies, fx = G.fx, H = E.H, M = G.Minis, P = G.Panal, DEG = Math.PI / 180, TAU = 6.283;
  var A = M.ATK, hurt = M.hurt, snd = M.snd;
  function rnd(a, b) { return G.rnd(a, b); }
  function clampPt(x, y, m) { return M.clampArena(x, y, m); }
  function inRing(x, y, r, p, th) { return Math.abs(G.dist(x, y, p.x, p.y) - r) <= (th || 9) + p.r * 0.6; }
  function psnd(n, fb, o) { snd(n, fb, o); }
  function circ(c, x, y, r, u, o) {
    o = o || {}; var f = o.fill || '255,40,40', st = o.stroke || '255,110,100';
    H.tdisc(c, x, y, r, 'rgba(' + f + ',' + (0.07 + 0.22 * u) + ')', 'rgba(' + st + ',0.95)', 2.5);
    c.save();
    if (o.sig) { c.strokeStyle = 'rgba(255,236,160,0.95)'; c.lineWidth = 1.8; c.beginPath(); c.arc(x, y, r + 5, 0, TAU); c.stroke(); }
    if (o.close !== false) { c.strokeStyle = 'rgba(255,215,160,0.85)'; c.lineWidth = 2; c.beginPath(); c.arc(x, y, r * (1 - 0.8 * u), 0, TAU); c.stroke(); }
    c.restore();
  }
  function lane(c, x, y, ang, len, w, u, fixed, sig) {
    if (sig) { c.save(); c.translate(x, y); c.rotate(ang); c.strokeStyle = 'rgba(255,236,160,0.9)'; c.lineWidth = 1.8; c.strokeRect(-3, -w / 2 - 4, len + 6, w + 8); c.restore(); }
    H.lane(c, x, y, ang, len, w, u, fixed);
  }
  function thin(c, x, y, ang, len, u, fixed) { H.thinLine(c, x, y, ang, len, 'rgba(255,90,90,' + (0.5 + 0.45 * u) + ')', fixed ? 2.5 : 1.5, fixed ? null : [6, 4]); }
  // punto de parada de una carga recortado por los lados rectos (los muros diagonales y los pilares paran el picado en vuelo: aturde)
  function chargeEnd(e, len) {
    var mg = G.WALL + e.r + 2, dx = Math.cos(e.ang), dy = Math.sin(e.ang), tm = len;
    if (dx > 1e-3) tm = Math.min(tm, (G.AW - mg - e.x) / dx); else if (dx < -1e-3) tm = Math.min(tm, (mg - e.x) / dx);
    if (dy > 1e-3) tm = Math.min(tm, (G.AH - mg - e.y) / dy); else if (dy < -1e-3) tm = Math.min(tm, (mg - e.y) / dy);
    e.clen = Math.max(0, tm); e.tx = e.x + dx * e.clen; e.ty = e.y + dy * e.clen;
  }
  function blockedNow(e) {   // muro diagonal, borde o pilar de cera
    var m = G.WALL + e.r + 1;
    return e.x <= m || e.x >= G.AW - m || e.y <= m || e.y >= G.AH - m || P.wallDist(e.x, e.y) <= 28 + e.r + 1 || !!P.pillarAt(e.x, e.y, e.r * 0.8);
  }
  // carga en vuelo (picado / estocada): o = { spd, dmg, name, onEnd(e, obstacle), hitFn }
  function dive(e, dt, X, o) {
    var p = X.p, s = X.s, stp = Math.min(o.spd * s, e.clen - e.trav);
    e.x += Math.cos(e.ang) * stp; e.y += Math.sin(e.ang) * stp; e.trav += stp;
    if (Math.random() < 0.4) fx.dust(e.x - Math.cos(e.ang) * 16, e.y + 12, 1);
    if (!e.hitDone && !p.dead && G.dist(e.x, e.y, p.x, p.y) < e.r + p.r + 4) { if (hurt(e, p, o.dmg, o.name, 1.4) || G.god) e.hitDone = true; }
    var pil = P.pillarAt(e.x, e.y, e.r * 0.8), blk = blockedNow(e);
    if (pil) P.hitPillar(pil.i, 150);
    if (blk || e.trav >= e.clen - 0.01) { fx.shake(blk ? 6 : 4, 160); if (blk) { fx.dust(e.x, e.y + 10, 8); psnd('avispon_stun', 'hit_heavy', { vol: 0.8 }); } o.onEnd(e, blk); }
  }

  // ================================================================= 1. AVISPÓN REAL (Panal, presión)
  var AV = A.avispon = {};
  AV.picado = { name: 'picado', cd: 5000, exit: 45, dmg: 24, double: true, fix: 160, sT: ['avispon_buzz', 'whoosh'], pz: ['dash_wind:0', 'dash:0'],
    ok: function (e, d) { return d >= 120 && d <= 380; },
    tele: function (e) { return e.stage ? 560 : 650; },
    start: function (e, X) { e.ang = X.a; e.fa = X.a; chargeEnd(e, 340); },
    aim: function (e, X) { e.ang = X.a; e.fa = X.a; chargeEnd(e, 340); },
    fire: function (e) { e.st = 'run'; e.t = 0; e.ph = 'go'; e.trav = 0; e.hitDone = false; psnd('avispon_charge', 'hit', { vol: 0.8 }); },
    run: function (e, dt, X) {
      dive(e, dt, X, { spd: 520, dmg: 24, name: 'picado', onEnd: function (e2, blk) {
        if (blk) { e2.stunned = true; fx.burst(e2.x, e2.y, 10, '#f3a31f', 200, 500, 3); M.endAtk(e2, 1000, [1000, 1.35], 'stun'); return; }   // choca con pilar o muro: aturdido 1 s
        if (e2.enraged && e2.stage < 1 && !e2.part.broken) { M.restage(e2); return; }                                                 // Picado doble (se pierde con el Aguijón roto)
        M.endAtk(e2, 600, null, 'idle');
      } });
    },
    draw: function (c, e, p, st) {
      var u = st === 'run' ? 1 : e.t / e.teleMs, len = st === 'run' ? Math.max(0, e.clen - e.trav) : e.clen;
      lane(c, e.x, e.y, e.ang, len + e.r, 60, u, st === 'run' || e.t >= e.teleMs - 160, false);
    } };

  AV.zumbido = { name: 'zumbido', cd: 11000, exit: 16, dmg: 9, sT: ['avispon_orbit_tele', 'wave_start'], pz: ['roar:0', 'fly:0'],
    ok: function (e, d) { return d < 420; },
    tele: function () { return 600; },
    start: function (e, X) { e.orbR = 160; },
    fire: function (e, X) {
      var p = X.p; e.st = 'run'; e.t = 0; e.ph = 'orbit'; e.fired = false; e.th = Math.atan2(e.y - p.y, e.x - p.x); e.r0 = Math.max(60, Math.hypot(e.x - p.x, e.y - p.y)); e.dirO = Math.random() < 0.5 ? -1 : 1;
      psnd('avispon_orbit', 'whoosh', { vol: 0.7 });
    },
    run: function (e, dt, X) {
      var p = X.p, ORB = 2000, AIM = 400;
      if (e.ph === 'orbit') {
        var u = Math.min(1, e.t / 350), rr = e.r0 + (160 - e.r0) * u;
        e.th += e.dirO * 2.2 * X.s; var q = clampPt(p.x + Math.cos(e.th) * rr, p.y + Math.sin(e.th) * rr, 20); e.x = q[0]; e.y = q[1];
        e.face = p.x >= e.x ? 1 : -1; e.fa = Math.atan2(p.y - e.y, p.x - e.x);
        if (e.t >= ORB) { e.ph = 'aim'; e.t = 0; e.ang = e.fa; }
      } else if (e.ph === 'aim') {
        if (e.t < AIM - 150) e.ang = Math.atan2(p.y - e.y, p.x - e.x);
        if (e.t >= AIM) {
          var n = e.part.broken ? 3 : 5, dm = 9 * (e.D.dmgK || 1);
          for (var i = 0; i < n; i++) E.shoot('e', e.x, e.y, e.ang + (i - (n - 1) / 2) * 0.2, 230, dm, 'proj_stinger', { r: 5, life: 2200, fb: 'arrow', src: 'mini_avispon_zumbido', sfxHit: 'stinger_hit' });
          psnd('bee_sting', 'shoot', { vol: 0.5 });
          M.endAtk(e, 700, null, 'idle');
        }
      }
    },
    draw: function (c, e, p, st) {
      if (st === 'tele') { var u = e.t / e.teleMs; c.save(); c.setLineDash([8, 6]); c.lineDashOffset = -G.time / 30; circ(c, p.x, p.y, 160, u, { close: false }); c.restore(); return; }
      if (e.ph === 'orbit') { c.save(); c.setLineDash([6, 8]); c.lineDashOffset = -G.time / 40; c.strokeStyle = 'rgba(255,110,90,0.5)'; c.lineWidth = 1.5; c.beginPath(); c.arc(p.x, p.y, 160, 0, TAU); c.stroke(); c.restore(); }
      else if (e.ph === 'aim') {
        var n = e.part.broken ? 3 : 5, fixed = e.t >= 250;
        for (var i = 0; i < n; i++) thin(c, e.x, e.y, e.ang + (i - (n - 1) / 2) * 0.2, 280, e.t / 400, fixed);
      }
    } };

  AV.estocada = { name: 'estocada', sig: true, double: true, cd: 9000, exit: 45, dmg: 26, fix: 270, sT: ['avispon_sting_tele', 'wave_start'], pz: ['sting_wind:0', 'sting:0'],
    off: function (e) { return e.part.broken; },
    ok: function (e, d) { return d >= 140 && d <= 420; },
    tele: function (e) { return e.stage ? 740 : 900; },
    start: function (e, X) { e.ang = X.a; e.fa = X.a; chargeEnd(e, 380); },
    aim: function (e, X) { e.ang = X.a; e.fa = X.a; chargeEnd(e, 380); },
    fire: function (e) { e.st = 'run'; e.t = 0; e.ph = 'go'; e.trav = 0; e.hitDone = false; psnd('avispon_sting', 'hit_heavy', { vol: 0.9 }); },
    run: function (e, dt, X) {
      dive(e, dt, X, { spd: 560, dmg: 26, name: 'estocada', onEnd: function (e2, blk) {
        if (blk) { e2.stunned = true; M.endAtk(e2, 1000, [1000, 1.35], 'stun'); return; }
        if (e2.enraged && e2.stage < 1) { M.restage(e2); return; }
        if (e2.hitDone) M.endAtk(e2, 600, null, 'idle');
        else M.endAtk(e2, 1000, [1000, 1.25], 'idle');   // si falla, queda expuesto 1 s (x1,25)
      } });
    },
    draw: function (c, e, p, st) {
      var u = st === 'run' ? 1 : e.t / e.teleMs, len = st === 'run' ? Math.max(0, e.clen - e.trav) : e.clen;
      lane(c, e.x, e.y, e.ang, len + e.r, 70, u, st === 'run' || e.t >= e.teleMs - 270, true);
    } };

  AV.ala = { name: 'ala', cd: 3500, exit: 50, dmg: 16, sT: ['avispon_orbit_tele', 'whoosh'], pz: ['wing_wind:0', 'wing:0'],
    off: function (e) { return !e.part.broken; },
    ok: function (e, d) { return d < 120; },
    tele: function () { return 560; },
    start: function (e, X) { e.ang = X.a; }, aim: function (e, X) { e.ang = X.a; e.fa = X.a; },
    fire: function (e, X) {
      var p = X.p; if (!p.dead && H.inFan(e, p, e.ang, 50 * DEG, 90 + p.r)) hurt(e, p, 16, 'ala', 1.2);
      fx.ring(e.x, e.y, 20, 90, 250, '#f3a31f', 4); fx.shake(4, 120); psnd('avispon_sting', 'hit', { vol: 0.7 }); M.endAtk(e, 500, null, 'idle');
    },
    draw: function (c, e, p, st) { if (st === 'tele') H.fan(c, e.x, e.y, 90 + p.r, e.ang, 50 * DEG, e.t / e.teleMs); } };

  var AD = M.D.avispon;
  AD.sBreak = 'avispon_stun';
  AD.onBreak = function (e) { e.st = 'rec'; e.t = 0; e.recDur = 3000; e.recPose = 'stun:0'; M.expose(e, 3000, 1.5); };
  // humo: lo seda 1 s (-40 % de velocidad, no empieza ataques nuevos)
  AD.tick = function (e, X) {
    if (P.on && P.inSmoke(e.x, e.y, e.r * 0.4)) { if (!(e.sedT > 0)) P.sfx('smoke_hiss', null, { vol: 0.5 }); e.sedT = 1000; }
    if (e.sedT > 0) { e.sedT -= X.dt; e.spdMul = B.biomes.panal.smoke.sedSpd; if (e.st === 'move' && e.atkT < 250) e.atkT = 250; e.sed = true; }
    else { e.spdMul = 1; e.sed = false; }
  };
  AD.poseMove = function (e) { return 'fly:' + Math.floor(e.anim / 70); };

  // ================================================================= 2. REINA JOVEN (Panal, control; la Madre Colmena movida)
  var RJ = A.reina_joven = {};
  function rainPts(p, n) {
    var pts = [clampPt(p.x, p.y, 30)], tries = 0;
    while (pts.length < n && tries++ < 60) {
      var a = rnd(0, TAU), d = rnd(45, 150), q = clampPt(p.x + Math.cos(a) * d, p.y + Math.sin(a) * d, 30), ok = true;
      for (var k = 0; k < pts.length; k++) if (G.dist(q[0], q[1], pts[k][0], pts[k][1]) < 66) ok = false;
      if (ok) pts.push(q);
    }
    return pts;
  }
  RJ.escupitajo = { name: 'escupitajo', cd: 7000, exit: 34, dmg: 14, sT: ['reinaj_spit_tele', 'wave_start'], pz: ['spit:0', 'spit:0'],
    tele: function () { return 800; },
    start: function (e, X) { e.pts = rainPts(X.p, e.part.broken ? 2 : e.enraged ? 5 : 3); },
    fire: function (e, X) {
      var p = X.p;
      for (var i = 0; i < e.pts.length; i++) {
        var r = e.pts[i]; fx.ring(r[0], r[1], 4, 34, 250, '#c97a14', 4); fx.burst(r[0], r[1], 6, '#c97a14', 120, 380, 3);
        if (!p.dead && G.dist(r[0], r[1], p.x, p.y) <= 26 + p.r * 0.6) hurt(e, p, 14, 'escupitajo', 0.8);
        P.puddle(r[0], r[1], 34, 5000, { owner: e });
      }
      psnd('reinaj_honey_squelch', 'hit_heavy', { pitch: 1.2, vol: 0.5 }); fx.shake(4, 120); M.endAtk(e, 500, null, 'idle');
    },
    draw: function (c, e) { var u = e.t / e.teleMs; for (var i = 0; i < e.pts.length; i++) circ(c, e.pts[i][0], e.pts[i][1], 26, u, { fill: '201,122,20', stroke: '232,165,58' }); } };

  RJ.miel = { name: 'miel', cd: 12000, exit: 0, dmg: 0, sT: ['reinaj_spit_tele', 'wave_start'], pz: ['honey:0', 'honey:0'],
    tele: function () { return 1100; },
    start: function (e, X) {   // celdas de miel (aviso de 1100 ms, 10 s): alrededor del jugador; si no caben (tope / conexión), charcos libres de r 50
      var p = X.p, n = e.part.broken ? 2 : e.enraged ? 5 : 3, k = P.openHoney(p.x + rnd(-40, 40), p.y + rnd(-40, 40), n, { tele: 1100, src: 'reina' });
      e.pts = []; if (!k) { var a0 = rnd(0, TAU); for (var i = 0; i < 3; i++) { var a = a0 + i * TAU / 3; e.pts.push(clampPt(p.x + Math.cos(a) * 80, p.y + Math.sin(a) * 80, 55)); } }
    },
    fire: function (e) { for (var i = 0; i < e.pts.length; i++) P.puddle(e.pts[i][0], e.pts[i][1], 50, 10000, { owner: e }); psnd('reinaj_honey_squelch', null, { vol: 0.6 }); M.endAtk(e, 600, null, 'idle'); },
    draw: function (c, e) { var u = e.t / e.teleMs; for (var i = 0; i < e.pts.length; i++) circ(c, e.pts[i][0], e.pts[i][1], 50, u, { fill: '201,122,20', stroke: '232,165,58' }); } };

  RJ.lluvia = { name: 'lluvia', sig: true, cd: 14000, exit: 36, dmg: 12, sT: ['reinaj_swell', 'wave_start'], pz: ['rain:0', 'rain:0'],
    off: function (e) { return e.part.broken; },
    tele: function () { return 800; },
    start: function (e, X) { e.pts = rainPts(X.p, e.enraged ? 6 : 4); },
    fire: function (e, X) {
      var p = X.p;
      for (var i = 0; i < e.pts.length; i++) {
        var r = e.pts[i]; fx.ring(r[0], r[1], 4, 34, 250, '#f6ecd0', 4);
        if (!p.dead && G.dist(r[0], r[1], p.x, p.y) <= 26 + p.r * 0.6) hurt(e, p, 12, 'lluvia', 0.8);
        M.addAdd(e, 'worm', r[0], r[1], {});
      }
      psnd('reinaj_hatch', 'hit_heavy', { pitch: 1.3, vol: 0.5 }); fx.shake(4, 120); M.endAtk(e, 500, null, 'idle');
    },
    draw: function (c, e) { var u = e.t / e.teleMs; for (var i = 0; i < e.pts.length; i++) circ(c, e.pts[i][0], e.pts[i][1], 26, u, { sig: true }); } };

  RJ.eclosion = { name: 'eclosion', cd: 1e9, exit: 160, dmg: 14, sT: ['reinaj_swell', 'boss_roar'], pz: ['swell:0', 'burst:0'], ok: function () { return true; },
    tele: function () { return 1150; },
    fire: function (e, X) {
      var p = X.p; if (!p.dead && X.d <= 150 + p.r * 0.5) hurt(e, p, 14, 'eclosion', 1.4);
      fx.shake(8, 250); fx.ring(e.x, e.y, 20, 150, 400, '#c97a14', 7); fx.shockwave(e.x, e.y, 300); psnd('reinaj_burst', 'explosion', { vol: 0.8 });
      for (var i = 0; i < 3; i++) { var a = i * 2.094 + rnd(0, 1); M.addAdd(e, 'bomb', e.x + Math.cos(a) * 70, e.y + Math.sin(a) * 70, {}); }   // larvas explosivas (tope de adds 3)
      P.puddle(e.x, e.y, 50, 6000, { owner: e }); M.endAtk(e, 2200, [2200, 1.4], 'rec');
    },
    draw: function (c, e) { circ(c, e.x, e.y, 150, e.t / e.teleMs, {}); } };

  var RD = M.D.reina_joven;
  RD.sBreak = 'reinaj_burst';
  RD.onBreak = function (e) { e.st = 'rec'; e.t = 0; e.recDur = 3500; e.recPose = 'idle'; M.expose(e, 3500, 1.4); };
  RD.afterEnrage = function (e) { e.force = 'eclosion'; e.atkT = 0; };
  RD.poseMove = function (e) { return 'float:' + Math.floor(e.anim / 140); };
})();
