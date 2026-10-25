/*!
 * assets_mini1.js - Arte de los MINIJEFES P4.5 del Bosque y del Asfodelo (DESIGN-v6-minijefes.md 4.1, 4.2, 4.5, 4.6). Solo arte, sin logica.
 * Script clasico que EXTIENDE window.Assets; cargar tras assets.js (usa Assets._h). Contrato: ASSETS_API.md, "Minijefes P4.5 (Bosque y Asfodelo)".
 * Estilo del juego: contorno grueso #1b1124, color plano + 1 sombra + 1 brillo, miran a la DERECHA, base x2 = final.
 * Coste en juego: cada frame se precompone al cargar -> un drawImage por minijefe (0 trabajo de dibujo vectorial por frame).
 * Sprites: enemy_mini_carnero, enemy_mini_tejedora, enemy_mini_hidra (+_head, +_neck), enemy_mini_planidera, enemy_mini_pod,
 *          fx_root_spike, fx_mini_thorn_patch, fx_horn_shard, fx_mini_crack_{carnero,tejedora,planidera}.
 */
(function () {
  'use strict';
  var A = window.Assets, H = A && A._h;
  if (!H) { if (window.console) console.error('assets_mini1: falta Assets._h (cargar tras assets.js)'); return; }
  var addV = H.addV, Pclosed = H.Pclosed, Ppoly = H.Ppoly, Pblob = H.Pblob, Prr = H.Prr, Pcirc = H.Pcirc, dyingFrames = H.dyingFrames;
  var TAU = 6.2832, sin = Math.sin, cos = Math.cos, PI = Math.PI;
  var WALKSEQ = [0, 2, 1, 3, 4, 5];

  function withDie(fr, draw, w, h, opt, o) {
    var d0 = fr.length;
    dyingFrames(draw, w, h, opt, o).forEach(function (f) { fr.push(f); });
    return { f: [d0, d0 + 1, d0 + 2, d0 + 3, d0 + 4], fps: 9, loop: false };
  }
  function rot(pts, a, cx, cy) {
    var c = cos(a), s = sin(a);
    return pts.map(function (p) { var dx = p[0] - cx, dy = p[1] - cy; return [cx + dx * c - dy * s, cy + dx * s + dy * c]; });
  }
  function mv(pts, dx, dy) { return pts.map(function (p) { return [p[0] + dx, p[1] + dy]; }); }
  function spiral(v, cx, cy, r, col) {
    var x = v.ctx, i;
    x.strokeStyle = col; x.lineWidth = 0.7; x.beginPath();
    for (i = 0; i <= 14; i++) { var a = i * 0.7, rr = r * i / 14; if (i === 0) x.moveTo(cx, cy); else x.lineTo(cx + cos(a) * rr, cy + sin(a) * rr); }
    x.stroke();
  }
  function note(v, cx, cy, col, s) {   // corchea
    s = s || 1;
    v.dot(cx, cy, 1.5 * s, '#1b1124'); v.dot(cx, cy, 1.1 * s, col);
    v.line(cx + 1.2 * s, cy, cx + 1.2 * s, cy - 4.4 * s, 0.9 * s + 0.8, '#1b1124'); v.line(cx + 1.2 * s, cy, cx + 1.2 * s, cy - 4.4 * s, 0.9 * s, col);
    v.line(cx + 1.2 * s, cy - 4.4 * s, cx + 3.2 * s, cy - 3.2 * s, 0.9 * s, col);
  }
  function star(v, cx, cy, r, col) { v.dot(cx, cy, r, '#1b1124'); v.dot(cx, cy, r * 0.62, col); }
  function ph(k) { return k * PI / 3; }   // fase de paso (6 pasos por ciclo)

  // ================================================================================================================
  // 1) CARNERO MAYOR  44x32 -> 88x64.  Lana carbon, manchas crema, puas moradas, cuernos hueso con veta granate.
  // ================================================================================================================
  var CHAR = '#2a2430', CHAR_S = '#15101b', CHAR_H = '#4e4260', CREAM = '#e8e4d4', CREAM_S = '#b4b098', PUR = '#8a3aa8', PUR_S = '#521e6c', PUR_H = '#c072e0';
  var BONE = '#b8a890', BONE_S = '#7e7058', BONE_H = '#efe6d2', GRAN = '#6a1f2f';
  var HORN = [[-1.5, -3], [-5, -7.5], [-3.6, -12.6], [1.6, -13.4], [4.6, -10.4], [3.4, -7.2]];   // espiral, local a la cabeza

  function carnero(o) {
    o = o || {};
    return function (v) {
      var x = v.ctx, by = o.by || 0, st = o.st || 0, np = o.np, hd = o.hd || 0, hxo = o.hx || 0, sq = o.sq || 0, i;
      x.translate(-3.4 - Math.max(0, hd) * 2.6 - st * 2.2, 0);
      var wal = o.ph != null, lift = function (k) { return wal ? Math.max(0, sin(o.ph + k * PI)) * 2.4 : 0; };
      var sp = o.sp || 0, bx0 = 20, sx = 1 + st * 0.14;
      function X(px) { return bx0 + (px - bx0) * sx; }
      var hx = 36.5 + hxo + st * 2.5, hy = 17.6 + hd * 6 + by + (o.hy || 0);
      if (o.lines) for (i = 0; i < 5; i++) v.line(-2 + i * 0.6, 11 + i * 3.4, 6 + i % 2 * 4, 11 + i * 3.4, 0.7, 'rgba(232,228,212,0.75)');
      // patas lejanas
      [[X(14), 1], [X(29), 0]].forEach(function (L, k) {
        var l = lift(k + 1), fx = L[0] + (k ? sp : -sp) * 0.7;
        v.stick([[L[0] - 0.4, 22 + by], [fx, 30 - l - sq]], 3.4, '#241d2c', { lw: 1.1 });
        v.part(Prr(fx - 1.9, 29 - l - sq, 3.8, 2, 0.7), CREAM_S, { lw: 0.8, so: 0.2 });
      });
      // cola
      v.part(Pblob(X(5.6), 16.6 + by - hd * 0.6, 3, 2.6, 301), CHAR, { lw: 1.4, sh: CHAR_S, hi: CHAR_H, so: 0.6 });
      // lomo con puas moradas (detras del cuerpo)
      var sc = o.spike || 1;
      for (i = 0; i < 5; i++) {
        var sxp = X(11 + i * 3.8), syp = 8.4 + by + Math.abs(i - 2) * 1.1 + (st > 0.5 ? 0.6 : 0);
        v.part(Ppoly([[sxp - 1.7, syp + 2.4], [sxp + 0.3, syp - 3.4 * sc], [sxp + 2, syp + 2.4]]), PUR, { lw: 0.9, sh: PUR_S, hi: PUR_H, so: 0.4 });
      }
      // cuerpo de lana
      var bo = [[12, 19, 6.6], [18, 15.8, 7], [25, 16.4, 6.6], [30, 20, 5.6], [20, 22, 6.6], [14, 22.6, 5.2], [26, 22.2, 5.4]];
      v.cluster(bo.map(function (b, k) { return Pblob(X(b[0]), b[1] + by + sq * 1.2, b[2] * sx, b[2] * (1 - sq * 0.08), 310 + k, 0.06, 9); }), o.hurt ? '#5a4a6a' : CHAR, { lw: 1.7, sh: CHAR_S, hi: CHAR_H, so: 1 });
      [[9, 17.4], [17, 13.6], [27, 18.4], [14, 23], [24, 22.4]].forEach(function (s, k) { v.dot(X(s[0]), s[1] + by + sq * 1.2, k % 3 === 0 ? 1.4 : 0.9, CREAM); });
      // patas cercanas
      [[X(10), 3], [X(25.5), 2]].forEach(function (L, k) {
        var l = lift(k + 3), fx = L[0] + (k ? sp : -sp);
        v.stick([[L[0], 22 + by], [fx, 30 - l - sq]], 3.8, '#1c1622', { lw: 1.2, hi: '#3a3046' });
        v.part(Prr(fx - 2.1, 29 - l - sq, 4.2, 2.2, 0.8), CREAM, { lw: 0.9, sh: CREAM_S, so: 0.3 });
      });
      // nariz / vapor
      if (o.steam) for (i = 0; i < o.steam; i++) { x.fillStyle = 'rgba(232,228,212,' + (0.8 - i * 0.2) + ')'; x.beginPath(); x.arc(hx + 6.8 + i * 2.4, hy + 3.2 - i * 1.4, 1.5 + i * 0.5, 0, TAU); x.fill(); }
      // cuello de lana
      v.part(Pblob(hx - 4.6, hy + 1.2, 5.2, 5, 320, 0.06), CHAR, { lw: 1.5, sh: CHAR_S, hi: CHAR_H, so: 0.7 });
      // cuernos (el lejano mas oscuro, desplazado)
      function horn(dx, dy, col, sh, alpha) {
        var P = mv(rot(HORN, hd * 1.15 + (o.ha || 0), 0, 0), hx + dx, hy + dy);
        v.stick(P, 3.4, col, { lw: 1.4, curve: true, hi: alpha ? null : BONE_H });
        if (alpha) return;
        v.stick(P.slice(1), 0.9, GRAN, { lw: 0, curve: true });
        if (o.glow) { x.globalAlpha = o.glow; v.stick(P.slice(3), 1.6, '#ff9a2a', { lw: 0, curve: true }); v.dot(P[4][0], P[4][1], 1.3, '#ffe0a0'); x.globalAlpha = 1; }
        if (o.crack) for (var k = 0; k < o.crack; k++) { var q = P[1 + k]; v.line(q[0] - 1.4, q[1] - 0.6, q[0] + 1.4, q[1] + 1, 0.6, '#1b1124'); }
      }
      if (!np) horn(-2.4, 1, BONE_S, null, true);
      // cabeza
      v.part(Pblob(hx, hy, 5.8, 4.8, 330, 0.04, 10), o.hurt ? '#6a5a7a' : '#3d3344', { lw: 1.5, sh: CHAR_S, hi: '#5a4c68', so: 0.7 });
      v.part(Pblob(hx + 3.2, hy + 2, 3.6, 2.6, 331, 0.04), CREAM, { lw: 1.1, sh: CREAM_S, hi: '#fff', so: 0.5 });
      v.dot(hx + 5.4, hy + 1.2, 0.7, '#1b1124');
      if (o.mouth) { v.part(Pblob(hx + 3.4, hy + 3.4, 2.8, 1.5, 332), '#2a0f18', { lw: 0.8, so: 0 }); v.dot(hx + 3.6, hy + 3.9, 0.9, '#d8606a'); }
      v.part(Pblob(hx - 3.6, hy - 2.8, 2.2, 1.2, 333, 0.05, 8, -0.5), '#3d3344', { lw: 1, sh: CHAR_S, so: 0.3 });   // oreja
      // ojo
      var ec = o.eye || '#ff9a2a';
      if (o.spin) { v.dot(hx + 1.4, hy - 1.4, 2, '#fff6dc'); spiral(v, hx + 1.4, hy - 1.4, 1.8, '#1b1124'); }
      else if (o.sq2) { v.line(hx - 0.2, hy - 1.2, hx + 3, hy - 1.8, 1.1, '#1b1124'); }
      else { v.part(Pblob(hx + 1.5, hy - 1.4, 1.9, 1.5, 334), ec, { lw: 0.8, so: 0.2 }); v.dot(hx + 2.2, hy - 1.4, 0.55, '#1b1124'); v.dot(hx + 0.9, hy - 1.9, 0.4, '#fff'); }
      if (!np) horn(0, 0, BONE, BONE_S, false);
      else {   // munones
        var s0 = mv(rot([[-1.5, -3], [-3.4, -5.6]], hd * 1.15, 0, 0), hx, hy);
        v.stick(s0, 3.6, BONE, { lw: 1.4, hi: BONE_H });
        v.part(Ppoly([[s0[1][0] - 1.9, s0[1][1] + 0.4], [s0[1][0] - 1.1, s0[1][1] - 1.5], [s0[1][0], s0[1][1] - 0.4], [s0[1][0] + 1, s0[1][1] - 1.7], [s0[1][0] + 1.9, s0[1][1] + 0.4]]), BONE_S, { lw: 0.7, so: 0.2 });
        v.dot(s0[1][0], s0[1][1] + 0.3, 0.9, '#a02a3a');
      }
      if (o.stun) {   // chispas y estrellitas
        star(v, hx - 5, hy - 7.5, 1.4, '#ffe45a'); star(v, hx + 2, hy - 9.6, 1.1, '#fff'); star(v, hx + 7.4, hy - 5.6, 1.2, '#ffe45a');
        for (i = 0; i < 3; i++) v.line(hx + 6 + i * 1.3, hy + 5 + i * 1, hx + 7.6 + i * 1.3, hy + 6.4 + i, 0.6, 'rgba(232,228,212,0.8)');
      }
      if (o.notes) { note(v, 36, 6.4, PUR_H, 0.9); note(v, 41, 3.8, '#c070e8', 0.8); note(v, 31, 3.2, '#a458d0', 0.8); }
      if (o.hit) { x.strokeStyle = 'rgba(255,230,160,0.85)'; x.lineWidth = 0.9; x.beginPath(); x.arc(hx + 4, hy + 1, 8.4, -0.8, 0.9); x.stroke(); x.beginPath(); x.arc(hx + 4, hy + 1, 10.4, -0.5, 0.6); x.stroke(); }
    };
  }
  (function () {
    var P = {
      idle0: carnero({}), idle1: carnero({ by: 0.7, hy: -0.3 }), horn: carnero({ hd: 0.95, glow: 0.9, hx: 0.6, steam: 1 }), hornHit: carnero({ hd: -0.15, hx: 3, hit: true, hy: -0.4 }),
      cwind: carnero({ sq: 0.5, hd: 0.7, steam: 3, by: 1.4, sp: 0.8, glow: 0.5 }), charge: carnero({ st: 1, hd: 0.8, hx: 1, lines: true, sp: 3, by: 0, spike: 1.2 }),
      stun: carnero({ hd: 1.0, hx: 3.4, hy: 1.2, spin: true, stun: true, crack: 2 }), call: carnero({ hd: -0.55, hy: -0.4, mouth: true, notes: true, by: -0.4 }),
      hurt: carnero({ hurt: true, sq: 0.5, hd: -0.2, sq2: true, mouth: true, by: 0.8, crack: 1 }), roar: carnero({ eye: '#ff3a2a', hd: -0.6, mouth: true, steam: 3, spike: 1.35, by: -0.5, glow: 0.35 })
    };
    var F = [P.idle0, P.idle1], k;
    for (k = 0; k < 4; k++) F.push(carnero({ ph: ph(k + 1), by: -(k % 2) * 0.8 }));
    F.push(P.horn, P.hornHit, P.cwind, P.charge, P.stun, P.call, P.hurt, P.roar);       // 6..13
    var dieA = withDie(F, carnero({ crack: 2 }), 44, 32, { lw: 1.8 });                   // 14..18
    var NP = { np: true };
    function n(o) { o.np = true; return carnero(o); }
    F.push(n({}), n({ by: 0.7, hy: -0.3 }));                                              // 19-20
    for (k = 0; k < 4; k++) F.push(n({ ph: ph(k + 1), by: -(k % 2) * 0.8 }));            // 21-24
    F.push(n({ sq: 0.5, hd: 0.7, steam: 3, by: 1.4, sp: 0.8 }), n({ st: 1, hd: 0.8, hx: 1, lines: true, sp: 3, spike: 1.2 }), n({ hd: 1.0, hx: 3.4, hy: 1.2, spin: true, stun: true }), n({ hd: 0.5, hx: 2, hit: true, mouth: true, hy: 0.4 })); // 25-28
    addV('enemy_mini_carnero', 44, 32, F, { lw: 1.8 }, {
      idle: { f: [0, 1], fps: 3 }, walk: { f: WALKSEQ.map(function (i) { return i; }), fps: 7 }, horn: { f: [6, 7], fps: 8 }, charge_wind: { f: [8], fps: 1 }, charge: { f: [9], fps: 1 }, stun: { f: [10], fps: 1 },
      call: { f: [11], fps: 1 }, hurt: { f: [12], fps: 1 }, roar: { f: [13], fps: 1 }, die: dieA,
      idle_np: { f: [19, 20], fps: 3 }, walk_np: { f: [19, 21, 20, 22, 23, 24], fps: 7 }, charge_wind_np: { f: [25], fps: 1 }, charge_np: { f: [26], fps: 1 }, stun_np: { f: [27], fps: 1 }, horn_np: { f: [28], fps: 1 }
    });
    // grietas de los cuernos (66 % y 33 %): superponer sobre idle/walk en el mismo ancla; frame 0 = 1.a grieta, 1 = 2.a (mas gruesa, con brillo naranja)
    var C = [0, 1].map(function (lv) {
      return function (v) {
        var hx = 36.5, hy = 17.6, P = mv(HORN, hx, hy);
        for (var q = 1; q <= 3 + lv * 2; q++) { var p = P[Math.min(5, q)]; v.line(p[0] - 1.6, p[1] - 0.8 + q * 0.2, p[0] + 1.6, p[1] + 1.2 - q * 0.2, 0.7 + lv * 0.3, '#1b1124'); if (lv) v.dot(p[0], p[1], 0.5, '#ff9a2a'); }
      };
    });
    addV('fx_mini_crack_carnero', 44, 32, C, { outline: false, lw: 0 }, { loop: { f: [0, 1], fps: 1 } });
  })();

  // ================================================================================================================
  // 2) TEJEDORA DE ZARZAS  40x40 -> 80x80.
  // ================================================================================================================
  var BARK = '#3a2a1e', BARK_S = '#1f150d', BARK_H = '#6a5038', LEAF = '#2f5a2a', LEAF_S = '#173018', LEAF_H = '#5a9a40', SPORE = '#c8e85a', SPORE_S = '#7aa832', SPORE_H = '#f4ffb0';

  function tejedora(o) {
    o = o || {};
    return function (v) {
      var x = v.ctx, by = o.by || 0, np = o.np, i, wal = o.ph != null, sw = o.sw || 0, inf = o.inf || 1;
      var A1 = o.a1 || [[29, 20], [31, 25]], A2 = o.a2 || [[12, 20], [10, 25]];     // [codo, mano]
      // raices-pata (4)
      var feet = [[6, 37], [13, 38], [27, 38], [35, 37]], knees = [[7, 24], [12, 22], [28, 22], [33, 25]], k;
      for (k = 0; k < 4; k++) {
        var lf = wal ? Math.max(0, sin(o.ph + k * PI * 0.5)) * 3 : 0, fxo = wal ? cos(o.ph + k * PI * 0.5) * 1.6 : 0;
        var kx = knees[k][0] + fxo * 0.4, ky = knees[k][1] - lf * 0.5, ft = [feet[k][0] + fxo + (o.spread || 0) * (k < 2 ? -1 : 1), feet[k][1] - lf];
        v.stick([[19 + (k < 2 ? -2 : 2), 26 + by], [kx, ky], ft], k === 1 || k === 2 ? 2.5 : 2.1, k === 1 || k === 2 ? BARK : '#2c2016', { lw: 1.2, curve: true, hi: BARK_H });
        v.line(ft[0], ft[1], ft[0] - 1.8, ft[1] + 1.2, 1, BARK); v.line(ft[0], ft[1], ft[0] + 1.8, ft[1] + 1.2, 1, BARK);
        v.dot(kx, ky - 0.8, 1, LEAF_H);
      }
      // bulbo / raiz madre (a la espalda)
      if (!np) {
        v.stick([[17, 20 + by], [12, 24 + by], [9.4, 24 + by]], 2.2, BARK, { lw: 1.2 });
        var gl = o.glow == null ? 0.5 : o.glow;
        x.fillStyle = 'rgba(200,232,90,' + (0.18 + gl * 0.2) + ')'; x.beginPath(); x.arc(9, 26 + by, 6.8 + gl * 1, 0, TAU); x.fill();
        v.part(Pblob(8.6, 26 + by, 5.8, 6.4, 401, 0.05), SPORE, { lw: 1.6, sh: SPORE_S, hi: SPORE_H, so: 1 });
        v.dot(7.4, 24.4 + by, 1.2, '#fffbd0'); v.dot(10.4, 28.4 + by, 0.8, SPORE_S);
        v.line(6.8, 21 + by, 8.2, 24 + by, 0.5, SPORE_S);
        for (k = 0; k < 4; k++) v.part(Ppoly([[4 + k * 2.2, 21.6 + by - Math.abs(k - 1.5) * 0.5], [5.2 + k * 2.2, 18.2 + by], [6.4 + k * 2.2, 21.8 + by]]), PUR, { lw: 0.7, sh: PUR_S, so: 0.2 });
      } else {
        // muñon rasgado: raices cortadas, jugo amarillo
        v.part(Ppoly([[15, 19 + by], [11.4, 20.6 + by], [11.8, 23.2 + by], [10.2, 24.6 + by], [12.8, 25.8 + by], [16, 25 + by]]), BARK, { lw: 1.4, sh: BARK_S, hi: BARK_H, so: 0.5 });
        v.dot(11.6, 23, 1.1, SPORE); v.dot(10.2, 26.6 + by, 0.9, SPORE_S); v.dot(11.2, 28.6, 0.6, SPORE);
        v.line(10.4, 21, 7.4, 20.4, 1.1, BARK); v.line(10.6, 24.6, 8, 26, 1.1, BARK);
      }
      // falda de raices
      var sl = [[11, 24 + by], [20, 22.4 + by], [29, 24 + by], [30.5, 31], [27.4, 33.2 + sw], [24, 31.4], [20.8, 34 - sw], [17.4, 31.6], [14, 33.4 + sw], [11.2, 30.8]];
      v.part(Pclosed(sl), LEAF, { lw: 1.6, sh: LEAF_S, hi: LEAF_H, so: 1 });
      for (k = 0; k < 4; k++) v.line(14 + k * 4.2, 27, 14.6 + k * 4.2 + sw * 0.3, 32.6, 0.7, LEAF_S);
      // brazo lejano
      function arm(a, col, far) {
        var sx = far ? 17 : 24.6, sy = 16.4 + by;
        v.stick([[sx, sy], a[0], a[1]], far ? 2.2 : 2.6, col, { lw: 1.3, curve: true, hi: BARK_H });
        for (var f = -1; f <= 1; f++) v.line(a[1][0], a[1][1], a[1][0] + (a[1][0] > sx ? 1 : -1) * 1.6 + f * 0.4, a[1][1] + f * 1.4 + 0.4, 0.9, col);
        if (o.thorn) { var d = a[1][1] > a[0][1] ? 1 : -1; for (var q = 0; q < 3; q++) { var t = 0.3 + q * 0.28, px = sx + (a[1][0] - sx) * t, py = sy + (a[1][1] - sy) * t; v.part(Ppoly([[px - 1, py], [px + (far ? -1 : 1) * 1.8, py + d * 3.2 + (q % 2) * 0], [px + 1, py]]), PUR, { lw: 0.7, sh: PUR_S, hi: PUR_H, so: 0.2 }); } }
      }
      arm(A2, '#2c2016', true);
      // torso
      var tz = o.tz || 1;
      x.save(); x.translate(20.5, 21 + by); x.scale(tz, tz); x.translate(-20.5, -21 - by);
      v.part(Pclosed([[16, 15 + by], [24.4, 14 + by], [27, 18 + by], [25, 25 + by], [17.4, 25.4 + by], [14.4, 19.6 + by]]), BARK, { lw: 1.7, sh: BARK_S, hi: BARK_H, so: 1 });
      v.line(17.4, 17 + by, 19, 24 + by, 0.6, BARK_S); v.line(22.6, 16 + by, 23.4, 23 + by, 0.6, BARK_S);
      for (k = 0; k < 3; k++) v.part(Ppoly([[15 + k * 1.2, 16 + by - k * 0.4], [14.4 + k * 1.2, 12.6 + by - k * 0.4], [17 + k * 1.2, 15.4 + by - k * 0.4]]), PUR, { lw: 0.7, sh: PUR_S, so: 0.2 });
      if (o.chest) {   // pecho abierto: cavidad de esporas
        v.part(Pblob(21.2, 19.6 + by, 3.8, 4.6, 410, 0.06), SPORE, { lw: 1.2, sh: SPORE_S, hi: SPORE_H, so: 0.6 });
        v.dot(20.6, 18.4 + by, 1.2, '#fffbd0');
        for (k = 0; k < 4; k++) v.part(Ppoly([[17.8 + k * 2, 15.4 + by], [18.6 + k * 2, 18 + by], [19.6 + k * 2, 15.4 + by]]), BARK_S, { lw: 0.5, so: 0 });
      }
      x.restore();
      if (o.glowAura) { x.fillStyle = 'rgba(255,240,160,' + o.glowAura + ')'; x.beginPath(); x.arc(20.5, 20 + by, 13, 0, TAU); x.fill(); }
      // cabeza
      var hx = 23 + (o.hxo || 0), hy = 9.6 + by + (o.hyo || 0);
      v.stick([[21, 16 + by], [hx - 0.4, hy + 3]], 3, BARK, { lw: 1.2 });
      // hojas y corona de espinas
      [[-4.2, -2.6, -0.9, 3.6], [-0.5, -4.6, -0.1, 3.8], [3.8, -3.2, 0.8, 3.4]].forEach(function (L, q) {
        v.part(Pblob(hx + L[0], hy + L[1] - 1, 1.6, L[3] / 2 + 1, 420 + q, 0.04, 8, L[2]), LEAF, { lw: 1, sh: LEAF_S, hi: LEAF_H, so: 0.4 });
      });
      v.part(Ppoly([[hx - 2, hy - 3.2], [hx - 0.4, hy - 8.4], [hx + 1.2, hy - 3.4]]), PUR, { lw: 0.8, sh: PUR_S, hi: PUR_H, so: 0.3 });
      v.part(Ppoly([[hx + 1.8, hy - 3.2], [hx + 4.2, hy - 7.4], [hx + 4.8, hy - 2.6]]), PUR, { lw: 0.8, sh: PUR_S, hi: PUR_H, so: 0.3 });
      v.part(Pblob(hx, hy, 4.6, 4.8, 430, 0.05), '#5a4230', { lw: 1.5, sh: BARK_S, hi: '#8a6a48', so: 0.8 });
      if (o.hurtFace) { v.line(hx - 3.4, hy - 1.4, hx - 0.8, hy - 0.6, 1, '#1b1124'); v.line(hx + 0.8, hy - 0.6, hx + 3.4, hy - 1.4, 1, '#1b1124'); }
      else {
        v.part(Pblob(hx - 1.8, hy - 0.6, 1.5, 1.2, 431), '#ff9a2a', { lw: 0.6, so: 0.2 }); v.part(Pblob(hx + 2.2, hy - 0.8, 1.5, 1.2, 432), '#ff9a2a', { lw: 0.6, so: 0.2 });
        v.dot(hx - 1.5, hy - 0.6, 0.45, '#1b1124'); v.dot(hx + 2.5, hy - 0.8, 0.45, '#1b1124');
      }
      if (o.mouth) v.part(Pblob(hx + 0.2, hy + 2.6, 1.9, 1.3, 433), '#1b0d10', { lw: 0.6, so: 0 });
      else v.line(hx - 1.4, hy + 2.6, hx + 1.8, hy + 2.8, 0.7, '#1b1124');
      arm(A1, BARK, false);
      // extras
      if (o.rootsOut) {   // raices verdes que brotan hacia delante
        for (k = 0; k < 3; k++) v.stick([[31 + k, 37.2], [34 + k * 1.6, 35 - k * 1.5], [38, 36 + k * 0.8 - 2]], 1.8, '#4a9a38', { lw: 1, curve: true, hi: LEAF_H });
      }
      if (o.rootsIn) { for (k = 0; k < 2; k++) { var pp = k ? A2[1] : A1[1]; v.stick([[pp[0], pp[1]], [pp[0] + (k ? -1 : 1) * 1.2, pp[1] + 2]], 1.6, '#4a9a38', { lw: 0.9 }); v.dot(pp[0], 38.6, 1.4, '#4a9a38'); } }
      if (o.spores) {
        [[6, 8], [14, 4], [30, 6], [35, 12], [3, 18], [37, 20], [26, 2], [20, 1]].forEach(function (s, q) { if (q < o.spores) { v.dot(s[0], s[1], 1.5, '#1b1124'); v.dot(s[0], s[1], 1, q % 2 ? SPORE : SPORE_H); } });
      }
      if (o.radial) {
        for (k = 0; k < 12; k++) { var an = k * TAU / 12 + 0.2, r1 = 11, r2 = 17 + (k % 2) * 3; v.part(Ppoly([[20 + cos(an - 0.14) * r1, 20 + by + sin(an - 0.14) * r1], [20 + cos(an) * r2, 20 + by + sin(an) * r2], [20 + cos(an + 0.14) * r1, 20 + by + sin(an + 0.14) * r1]]), PUR, { lw: 0.8, sh: PUR_S, hi: PUR_H, so: 0.3 }); }
      }
    };
  }
  (function () {
    var F = [tejedora({ glow: 0.4 }), tejedora({ by: -0.9, sw: 1, glow: 0.8, a1: [[29, 19.5], [31, 24]], a2: [[12, 19.5], [10, 24]] })], k;
    for (k = 0; k < 4; k++) F.push(tejedora({ ph: ph(k + 1), by: -(k % 2) * 0.8, sw: cos(ph(k + 1)) * 1.2, glow: 0.5 + (k % 2) * 0.3 }));
    F.push(tejedora({ a1: [[31, 29], [32, 37]], a2: [[10, 29], [14, 37]], rootsIn: true, by: 1.4, glow: 0.7 }));                                  // 6 roots-wind
    F.push(tejedora({ a1: [[31, 22], [37, 29]], a2: [[13, 22], [34, 33]], rootsOut: true, glow: 0.7, by: 0.6 }));                                   // 7 roots-cast
    F.push(tejedora({ chest: true, a1: [[32, 15], [37, 12]], a2: [[9, 16], [4, 13]], glow: 0.9, mouth: true }));                                    // 8
    F.push(tejedora({ chest: true, a1: [[32, 13], [36, 7]], a2: [[9, 13], [5, 7]], spores: 8, glow: 0.9, mouth: true, by: -0.6 }));               // 9
    F.push(tejedora({ a1: [[31, 9], [30, 2]], a2: [[11, 9], [12, 2]], thorn: true, by: -0.4, glow: 0.7 }));                                         // 10
    F.push(tejedora({ a1: [[32, 24], [32, 33]], a2: [[9, 24], [8, 33]], thorn: true, by: 1, glow: 0.7 }));                                          // 11
    F.push(tejedora({ tz: 1.14, glowAura: 0.28, thorn: true, a1: [[33, 17], [37, 22]], a2: [[8, 17], [4, 22]], glow: 1, by: -0.6 }));            // 12 burst-wind
    F.push(tejedora({ radial: true, glowAura: 0.18, a1: [[32, 15], [37, 13]], a2: [[9, 15], [4, 13]], glow: 1, mouth: true }));                    // 13 burst
    F.push(tejedora({ hurtFace: true, hxo: -1.4, hyo: 0.6, a1: [[33, 18], [36, 14]], a2: [[9, 22], [5, 27]], by: 1, sw: 1.4 }));                // 14 hurt
    F.push(tejedora({ mouth: true, a1: [[33, 13], [37, 6]], a2: [[8, 13], [4, 6]], spread: 1, by: -0.8, glow: 0.8 }));                          // 15 roar
    var dieA = withDie(F, tejedora({ glow: 0.4 }), 40, 40, { lw: 1.8 });                                                                          // 16..20
    function n(o) { o.np = true; return tejedora(o); }
    F.push(n({}), n({ by: -0.9, sw: 1, a1: [[29, 19.5], [31, 24]], a2: [[12, 19.5], [10, 24]] }));                                                // 21-22
    for (k = 0; k < 4; k++) F.push(n({ ph: ph(k + 1), by: -(k % 2) * 0.8, sw: cos(ph(k + 1)) * 1.2 }));                                         // 23-26
    F.push(n({ a1: [[31, 29], [32, 37]], a2: [[10, 29], [14, 37]], rootsIn: true, by: 1.4 }));                                                    // 27
    F.push(n({ a1: [[31, 9], [30, 2]], a2: [[11, 9], [12, 2]], thorn: true, by: -0.4 }));                                                         // 28
    F.push(n({ tz: 1.1, radial: true, glowAura: 0.14, a1: [[32, 15], [37, 13]], a2: [[9, 15], [4, 13]], mouth: true }));                         // 29
    addV('enemy_mini_tejedora', 40, 40, F, { lw: 1.8 }, {
      idle: { f: [0, 1], fps: 3 }, walk: { f: WALKSEQ, fps: 6 }, roots: { f: [6, 7], fps: 8 }, bloom: { f: [8, 9], fps: 8 }, thorn: { f: [10, 11], fps: 8 }, burst: { f: [12, 13], fps: 8 },
      hurt: { f: [14], fps: 1 }, roar: { f: [15], fps: 1 }, die: dieA, idle_np: { f: [21, 22], fps: 3 }, walk_np: { f: [21, 23, 22, 24, 25, 26], fps: 6 },
      roots_np: { f: [27], fps: 1 }, thorn_np: { f: [28], fps: 1 }, burst_np: { f: [29], fps: 1 }
    });
    // grietas de la Raiz madre (66 % y 33 %): superponer sobre idle/walk en el ancla del sprite
    addV('fx_mini_crack_tejedora', 40, 40, [0, 1].map(function (lv) {
      return function (v) {
        v.line(7.4, 21, 9.4, 25 + lv, 0.8, '#1b1124'); v.line(9.4, 25 + lv, 7.4, 29, 0.7, '#1b1124');
        if (lv) { v.line(9.4, 25.4, 13, 24, 0.8, '#1b1124'); v.line(9.4, 25.4, 12, 29.6, 0.7, '#1b1124'); v.dot(9.4, 25.4, 1, '#fffbd0'); for (var q = 0; q < 3; q++) v.dot(5 + q * 4, 33 + q % 2, 0.7, SPORE); }
        else v.dot(9.4, 25.4, 0.7, '#fffbd0');
      };
    }), { outline: false, lw: 0 }, { loop: { f: [0, 1], fps: 1 } });
  })();

  // ---- Vaina de esporas 14x14 -> 28x28 (9 frames)
  function pod(o) {
    o = o || {};
    return function (v) {
      var x = v.ctx, by = o.by || 0, k;
      if (o.halo) { x.fillStyle = 'rgba(214,244,150,' + o.halo + ')'; x.beginPath(); x.arc(7, 8 + by, 6.8, 0, TAU); x.fill(); }
      for (k = 0; k < 5; k++) { var an = -PI + k * PI / 4 + 0.2; v.part(Ppoly([[7 + cos(an - 0.2) * 5, 8.4 + by + sin(an - 0.2) * 5], [7 + cos(an) * 8.4, 8.4 + by + sin(an) * 8.4], [7 + cos(an + 0.2) * 5, 8.4 + by + sin(an + 0.2) * 5]]), PUR, { lw: 0.7, sh: PUR_S, so: 0.2 }); }
      v.part(Pblob(7, 8.6 + by, 5.4 * (o.sx || 1), 5 * (o.sy || 1), 440, 0.05), '#a8d048', { lw: 1.4, sh: '#5a8a2a', hi: SPORE_H, so: 0.8 });
      v.part(Pblob(7, 5.4 + by, 3, 1.8, 441), '#6a9a38', { lw: 0.7, so: 0.2 });
      v.dot(5.4, 8.6 + by, 0.9, '#ff9a2a'); v.dot(8.8, 8.6 + by, 0.9, '#ff9a2a');
      v.line(5.2, 11 + by, 8.8, 11 + by, 0.6, '#1b1124');
      if (o.burst) for (k = 0; k < o.burst; k++) v.dot(7 + cos(k * 1.3) * (3 + o.rb), 8 + sin(k * 1.3) * (3 + o.rb), 0.9, SPORE);
    };
  }
  (function () {
    var F = [pod({}), pod({ by: -0.5, sy: 1.06, sx: 0.96 }), pod({ halo: 0.35, sx: 1.08, sy: 0.96 }), pod({ halo: 0.5, by: -0.5, sx: 1.14, sy: 0.92 })];
    var dieA = { f: [4, 5, 6, 7, 8], fps: 9, loop: false };
    F.push(pod({ sx: 1.2, sy: 0.9, halo: 0.4 }), pod({ sx: 1.3, sy: 0.7, burst: 5, rb: 1.5 }), pod({ sx: 1.2, sy: 0.4, burst: 7, rb: 3 }), pod({ sx: 0.9, sy: 0.25, burst: 7, rb: 4.6 }), function (v) { for (var q = 0; q < 6; q++) v.dot(7 + cos(q * 1.1) * 5.4, 8 + sin(q * 1.1) * 3.4, 0.7, SPORE_S); });
    addV('enemy_mini_pod', 14, 14, F, { lw: 1.4 }, { idle: { f: [0, 1], fps: 3 }, pulse: { f: [2, 3], fps: 6 }, die: dieA });
  })();

  // ---- fx_root_spike 24x48 -> 48x96 (emerge 0-1, clavada 2, retrae 3), raiz-espina con base en el borde inferior
  (function () {
    function spike(h, w, o) {
      o = o || {};
      return function (v) {
        var x = v.ctx, b = 46, k, sw = o.sw || 0;
        if (o.dirt) for (k = 0; k < 5; k++) v.dot(12 + (k - 2) * 4.4, b - 0.6 - (k % 2), 1.3, BARK);
        v.part(Pclosed([[12 - w, b], [12 - w * 0.8 + sw, b - h * 0.4], [12 - w * 0.4 + sw, b - h * 0.8], [12 + sw * 1.4, b - h], [12 + w * 0.4 + sw, b - h * 0.8], [12 + w * 0.8 + sw, b - h * 0.4], [12 + w, b]]), BARK, { lw: 1.7, sh: BARK_S, hi: BARK_H, so: 1 });
        v.part(Ppoly([[12 - w * 0.4 + sw, b - h * 0.84], [12 + sw * 1.4, b - h - 1.4], [12 + w * 0.4 + sw, b - h * 0.84]]), PUR, { lw: 0.8, sh: PUR_S, hi: PUR_H, so: 0.2 });
        if (h > 22) for (k = 0; k < 3; k++) {
          var y0 = b - h * (0.28 + k * 0.2), s = k % 2 ? 1 : -1;
          v.part(Ppoly([[12 + s * w * 0.5, y0], [12 + s * (w + 4.6), y0 - 3.6], [12 + s * w * 0.5, y0 - 2.6]]), PUR, { lw: 0.8, sh: PUR_S, hi: PUR_H, so: 0.2 });
        }
        for (k = 0; k < 3; k++) v.line(12 - w * 0.3 + k * w * 0.3 + sw * 0.5, b - 2, 12 - w * 0.2 + k * w * 0.25 + sw, b - h * (0.5 + k * 0.1), 0.6, BARK_S);
        if (h > 30) { v.part(Pblob(12 - w - 0.4, b - 3, 3.2, 1.6, 450), LEAF, { lw: 0.8, so: 0.2 }); v.part(Pblob(12 + w + 0.4, b - 2.6, 3, 1.5, 451), LEAF, { lw: 0.8, so: 0.2 }); }
      };
    }
    addV('fx_root_spike', 24, 48, [spike(14, 4.4, { dirt: true }), spike(30, 5.2, { dirt: true, sw: 0.6 }), spike(42, 5.6, { sw: -0.4 }), spike(20, 4.4, { dirt: true })], { lw: 1.6 }, { emerge: { f: [0, 1, 2], fps: 12, loop: false }, stuck: { f: [2], fps: 1 }, retract: { f: [3], fps: 1 } });
  })();

  // ---- fx_mini_thorn_patch 64x64 -> 128x128 (3 frames). Disco de zarzas r ~27 base (55 final) + borde
  (function () {
    function patch(p) {
      return function (v) {
        var x = v.ctx, k, c = 32;
        x.fillStyle = 'rgba(30,50,30,' + (0.5 + p * 0.1) + ')'; x.beginPath(); x.arc(c, c, 28 + p * 0.6, 0, TAU); x.fill();
        x.fillStyle = 'rgba(138,58,168,' + (0.1 + p * 0.06) + ')'; x.beginPath(); x.arc(c, c, 21, 0, TAU); x.fill();
        x.strokeStyle = '#1b1124'; x.lineWidth = 1.4; x.setLineDash([3, 2.4]); x.beginPath(); x.arc(c, c, 27.4, 0, TAU); x.stroke(); x.setLineDash([]);
        for (k = 0; k < 14; k++) {   // tallos retorcidos
          var an = k * TAU / 14 + p * 0.1, r0 = 6 + (k % 3) * 4, r1 = 22 + (k % 4) * 2.4;
          v.stick([[c + cos(an) * r0, c + sin(an) * r0], [c + cos(an + 0.45) * (r0 + r1) * 0.5, c + sin(an + 0.45) * (r0 + r1) * 0.5], [c + cos(an + 0.2) * r1, c + sin(an + 0.2) * r1]], 1.4, k % 2 ? BARK : LEAF, { lw: 0.8, curve: true });
        }
        for (k = 0; k < 16; k++) {
          var a2 = k * TAU / 16 + 0.1, rr = 24.4 + (k % 2) * 2, th = 3.4 + p * 0.5 + (k % 3) * 0.5;
          v.part(Ppoly([[c + cos(a2 - 0.12) * rr, c + sin(a2 - 0.12) * rr], [c + cos(a2) * (rr + th), c + sin(a2) * (rr + th)], [c + cos(a2 + 0.12) * rr, c + sin(a2 + 0.12) * rr]]), PUR, { lw: 0.8, sh: PUR_S, hi: PUR_H, so: 0.25 });
        }
        for (k = 0; k < 6; k++) { var a3 = k * 1.05 + 0.4; v.part(Ppoly([[c + cos(a3) * 8 - 1, c + sin(a3) * 8 + 2], [c + cos(a3) * 8 + p, c + sin(a3) * 8 - 3 - p], [c + cos(a3) * 8 + 1.4, c + sin(a3) * 8 + 2]]), PUR, { lw: 0.7, so: 0.2 }); }
      };
    }
    addV('fx_mini_thorn_patch', 64, 64, [patch(0), patch(1), patch(2)], { outline: false, lw: 1 }, { arm: { f: [0], fps: 1 }, active: { f: [1, 2], fps: 4 }, idle: { f: [1, 2], fps: 4 } });
  })();

  // ---- fx_horn_shard 16x16 -> 32x32 (4 frames, esquirlas de hueso girando)
  (function () {
    function sh(a, s) {
      return function (v) {
        var pts = rot([[-5 * s, -2], [4.4 * s, -1.2], [6 * s, 0.6], [-1, 2.6], [-4 * s, 2]], a, 0, 0);
        v.part(Ppoly(mv(pts, 8, 8)), BONE, { lw: 1.2, sh: BONE_S, hi: BONE_H, so: 0.6 });
        var l = rot([[-3, 0], [2, 0.4]], a, 0, 0); v.line(l[0][0] + 8, l[0][1] + 8, l[1][0] + 8, l[1][1] + 8, 0.6, GRAN);
      };
    }
    addV('fx_horn_shard', 16, 16, [sh(0.2, 1), sh(1.1, 0.95), sh(2.2, 1), sh(3.4, 0.95)], { lw: 1.2 }, { spin: { f: [0, 1, 2, 3], fps: 14 }, loop: { f: [0, 1, 2, 3], fps: 14 } });
  })();

  // ================================================================================================================
  // 3) HIDRA JOVEN: cuerpo 40x32 -> 80x64, cabeza 24x24 -> 48x48, cuello 12x12 -> 24x24
  // ================================================================================================================
  var HT = '#2f6f6a', HT_S = '#1b4540', HT_H = '#5aa8a0', ACID = '#7be34a', ACID_S = '#3f9a2a', ACID_H = '#c8ff9a', WND = '#c04040', SMK = '#5a3a30';

  function ripples(v, cx, cy, n, r0, a) {
    var x = v.ctx, k;
    for (k = 0; k < n; k++) {
      x.strokeStyle = 'rgba(150,232,222,' + (a - k * 0.18) + ')'; x.lineWidth = 1.1; x.beginPath(); x.ellipse(cx, cy, r0 + k * 5.2, (r0 + k * 5.2) * 0.34, 0, 0, TAU); x.stroke();
      x.strokeStyle = 'rgba(27,17,36,' + (0.5 - k * 0.12) + ')'; x.lineWidth = 0.5; x.beginPath(); x.ellipse(cx, cy + 0.6, r0 + k * 5.2, (r0 + k * 5.2) * 0.34, 0, 0, TAU); x.stroke();
    }
  }
  function bubbles(v, pts) { pts.forEach(function (p) { var x = v.ctx; x.fillStyle = 'rgba(190,245,236,0.45)'; x.beginPath(); x.arc(p[0], p[1], p[2], 0, TAU); x.fill(); x.strokeStyle = '#1b3a44'; x.lineWidth = 0.7; x.stroke(); v.dot(p[0] - p[2] * 0.35, p[1] - p[2] * 0.35, Math.max(0.3, p[2] * 0.28), '#fff'); }); }

  function hidra(o) {
    o = o || {};
    return function (v) {
      var x = v.ctx, by = o.by || 0, tw = o.tw || 0, i, np = o.np;
      var oy = o.sink || 0;   // hundimiento
      if (o.mode === 'dive') { ripples(v, 19, 26, 3, 6, 0.8); bubbles(v, [[12, 20 - o.k * 3, 1.8], [24, 16 - o.k * 2, 1.4], [30, 22 - o.k * 3, 2.2], [18, 12 - o.k, 1.1], [6, 24, 1.2]]); return; }
      // cola (sale por la izquierda)
      var tl = o.tail || 'flat';
      var T = tl === 'up' ? [[8, 21], [3, 17], [1, 11], [3, 5]] : tl === 'swing' ? [[8, 22], [3, 24], [0.6, 20], [1, 14]] : [[8, 22 + by], [3, 23 + by + tw], [0.8, 20 + by - tw], [0, 17 + by]];
      v.stick(T, 6.4, HT, { lw: 1.7, curve: true, hi: HT_H });
      var te = T[3];
      v.part(Ppoly([[te[0] - 1, te[1] + 1], [te[0] - 3.2, te[1] - 3.6], [te[0] + 1, te[1] - 1.6], [te[0] + 3.4, te[1] - 3.4], [te[0] + 2.6, te[1] + 1.8]]), ACID_S, { lw: 1.1, sh: HT_S, hi: ACID, so: 0.3 });
      if (o.swish) { x.strokeStyle = 'rgba(232,232,212,0.8)'; x.lineWidth = 1; x.beginPath(); x.arc(14, 24, 15, PI * 0.95, PI * 1.6); x.stroke(); x.beginPath(); x.arc(14, 24, 18, PI * 1.05, PI * 1.5); x.stroke(); }
      // aletas dorsales
      for (i = 0; i < 4; i++) { var fx = 11 + i * 5.2, fy = 13.6 + by + Math.abs(i - 1.5) * 0.8; v.part(Ppoly([[fx - 1.8, fy + 2.4], [fx + 0.4, fy - 3.4], [fx + 2.2, fy + 2.4]]), ACID_S, { lw: 0.9, sh: HT_S, hi: ACID, so: 0.3 }); }
      // cuerpo
      var sq = o.sq || 0;
      v.part(Pblob(19, 21 + by + sq, 15, 8.4 - sq * 1.5, 501, 0.04, 11), o.hurt ? '#4a8f88' : HT, { lw: 1.9, sh: HT_S, hi: HT_H, so: 1.1 });
      v.part(Pblob(21, 26.8 + by + sq, 10.4, 2.2, 502, 0.04), CREAM, { lw: 0.9, sh: CREAM_S, hi: '#fff', so: 0.4 });
      for (i = 0; i < 6; i++) v.dot(10 + i * 3.4, 17.6 + by + (i % 2) * 1.6, 0.8, HT_H);
      // aleta delantera
      v.part(Pblob(25, 28.4 + by, 3.6, 1.7, 503, 0.05, 8, 0.4), ACID_S, { lw: 1, sh: HT_S, so: 0.3 });
      // cuello (base) o herida
      var nx = 31.4, ny = 13 + by;
      if (!np && !o.wound) {
        v.part(Pblob(nx, ny + 1.4, 4.4, 6.6, 504, 0.04, 9, 0.18), HT, { lw: 1.7, sh: HT_S, hi: HT_H, so: 0.8 });
        v.part(Pblob(nx + 0.4, ny - 4.4, 3.6, 1.8, 505), ACID_S, { lw: 1, sh: HT_S, hi: ACID, so: 0.3 });   // collar donde engancha el cuello
      } else {
        v.part(Pblob(nx, ny + 2.4, 4.4, 5.6, 506, 0.04, 9, 0.18), o.mode === 'burn' ? SMK : HT, { lw: 1.7, sh: o.mode === 'burn' ? '#2e1c18' : HT_S, hi: HT_H, so: 0.8 });
        if (o.mode === 'burn') {
          v.part(Pblob(nx + 0.2, ny - 2.8, 3.3, 1.5, 507), '#2a1612', { lw: 0.9, so: 0 }); v.dot(nx, ny - 2.8, 0.7, '#e8601a');
          [[0, -6.4, 1.8, 0.6], [2, -9.6, 2.4, 0.45], [-1.2, -12.8, 3, 0.3]].forEach(function (s) { x.fillStyle = 'rgba(120,110,120,' + s[3] + ')'; x.beginPath(); x.arc(nx + s[0] + (o.k || 0) * 0.8, ny + s[1], s[2], 0, TAU); x.fill(); });
        } else if (o.mode === 'bud') {
          v.stick([[nx, ny - 2], [nx + 0.4, ny - 5]], 2.6, ACID_S, { lw: 1.1 });
          v.part(Pblob(nx + 1, ny - 7, 2.7, 2.9, 508), ACID, { lw: 1.2, sh: ACID_S, hi: ACID_H, so: 0.5 }); v.dot(nx + 2, ny - 7.6, 0.6, '#ffe45a');
          v.part(Pblob(nx, ny - 2.6, 3.5, 1.4, 509), WND, { lw: 0.8, so: 0 });
        } else {
          v.part(Pblob(nx + 0.2, ny - 2.8, 3.4, 1.7, 510), WND, { lw: 1, sh: '#7a1e2a', hi: '#ff8070', so: 0.4 });
          v.dot(nx - 0.6, ny - 2.8, 0.9, '#ffb0a0');
          v.dot(nx + 2.8, ny - 0.4, 0.9, WND); v.dot(nx + 3.4, ny + 2.2, 0.7, WND); v.dot(nx + 3, ny + 4.4, 0.5, WND);
        }
      }
      if (o.mode === 'emerge') {   // columna de agua
        for (i = 0; i < 9; i++) { var a = -PI + (i + 0.5) * PI / 9; v.part(Ppoly([[19 + cos(a) * 6, 24 + sin(a) * 3], [19 + cos(a) * 15, 17 + sin(a) * 13 - 4], [19 + cos(a + 0.2) * 7.4, 24 + sin(a + 0.2) * 3.2]]), '#bff2ea', { lw: 0.9, sh: '#6ac8c0', hi: '#fff', so: 0.3 }); }
        bubbles(v, [[6, 8, 1.4], [32, 6, 1.2], [19, 2.6, 1.6], [38, 14, 1]]); ripples(v, 19, 27, 2, 10, 0.8);
      }
      if (o.roar) { x.strokeStyle = 'rgba(232,228,212,0.75)'; x.lineWidth = 0.8; for (i = 0; i < 3; i++) { x.beginPath(); x.arc(nx + 2, ny - 6, 3 + i * 3, -1.3, 0.1); x.stroke(); } }
      if (o.dripWound) { v.dot(nx + 4.6, ny + 8, 0.7, WND); }
    };
  }
  (function () {
    var F = [hidra({}), hidra({ by: 0.6, tw: 0.8 })], k;
    for (k = 0; k < 4; k++) F.push(hidra({ by: -(k % 2) * 0.7, tw: cos(ph(k + 1)) * 2.4 }));
    F.push(hidra({ mode: 'dive', k: 0 }) && function (v) { // 6 dive-wind: cuerpo hundiendose bajo las ondas
      hidra({ by: 5, sq: -0.4 })(v); v.ctx.fillStyle = 'rgba(80,170,170,0.5)'; v.ctx.fillRect(0, 27, 40, 6); ripples(v, 19, 28, 3, 8, 0.85); bubbles(v, [[8, 22, 1.6], [28, 20, 1.3], [34, 24, 1.8]]);
    });
    F.push(hidra({ mode: 'dive', k: 1 }));                       // 7
    F.push(hidra({ mode: 'emerge', by: -1 }));                   // 8
    F.push(hidra({ wound: true, tail: 'up', by: -0.4 }), hidra({ wound: true, tail: 'swing', swish: true, by: 0.6 }));   // 9-10
    F.push(hidra({ hurt: true, sq: 1.2, by: 1 }), hidra({ roar: true, by: -0.8 }));                                   // 11-12
    var dieA = withDie(F, hidra({}), 40, 32, { lw: 1.8 });                                                              // 13-17
    function n(o) { o.np = true; return hidra(o); }
    F.push(n({}), n({ by: 0.6, tw: 0.8 }));                                                                            // 18-19
    for (k = 0; k < 4; k++) F.push(n({ by: -(k % 2) * 0.7, tw: cos(ph(k + 1)) * 2.4 }));                                // 20-23
    F.push(n({ mode: 'burn', k: 0 }), n({ mode: 'bud' }));                                                              // 24-25
    addV('enemy_mini_hidra', 40, 32, F, { lw: 1.8 }, {
      idle: { f: [0, 1], fps: 3 }, slither: { f: WALKSEQ, fps: 7 }, walk: { f: WALKSEQ, fps: 7 }, dive: { f: [6, 7], fps: 6 }, emerge: { f: [8], fps: 1 }, tail: { f: [9, 10], fps: 8 },
      hurt: { f: [11], fps: 1 }, roar: { f: [12], fps: 1 }, die: dieA, idle_np: { f: [18, 19], fps: 3 }, slither_np: { f: [18, 20, 19, 21, 22, 23], fps: 7 }, walk_np: { f: [18, 20, 19, 21, 22, 23], fps: 7 },
      burn_np: { f: [24], fps: 1 }, bud_np: { f: [25], fps: 1 }
    });
  })();

  // ---- Cabeza 24x24 -> 48x48. Union del cuello en (4,14) base (8,28 final); mira a la derecha.
  function hhead(o) {
    o = o || {};
    return function (v) {
      var x = v.ctx, i, jaw = o.jaw || 0;
      x.translate(0, -3);
      if (o.bud) {
        v.stick([[4, 19], [5, 15]], 3.4, ACID_S, { lw: 1.2 });
        v.part(Pblob(7, 12, 3.8, 4, 600), ACID, { lw: 1.4, sh: ACID_S, hi: ACID_H, so: 0.6 }); v.dot(8.6, 11, 0.9, '#ffe45a'); v.dot(5.6, 10.6, 0.6, '#ffe45a');
        v.part(Pblob(4, 19, 3.6, 1.6, 601), WND, { lw: 0.9, so: 0 }); return;
      }
      x.save(); x.translate(4, 17); x.rotate(o.rot || 0); x.translate(-4, -17);
      var yo = o.yo || 0;
      // cresta
      for (i = 0; i < 3; i++) v.part(Ppoly([[7 + i * 2.6, 9 + yo], [6 + i * 2.6, 4.4 + yo - (i === 1 ? 1 : 0)], [10 + i * 2.6, 8 + yo]]), HT, { lw: 0.9, sh: HT_S, hi: HT_H, so: 0.3 });
      // mandibula
      x.save(); x.translate(8, 15.6 + yo); x.rotate(jaw); x.translate(-8, -15.6 - yo);
      v.part(Pclosed([[7, 15 + yo], [14, 15.6 + yo], [21.4, 15 + yo], [20.6, 18 + yo], [14, 18.6 + yo], [8, 18.4 + yo]]), o.dead ? '#8a9a8a' : ACID_S, { lw: 1.4, sh: HT_S, hi: ACID, so: 0.6 });
      if (jaw > 0.12) { v.part(Pblob(14, 15.8 + yo, 5.6, 1.2, 602), '#8a2a3a', { lw: 0.6, so: 0 }); v.part(Ppoly([[9, 15.4 + yo], [10, 13.8 + yo], [11, 15.4 + yo]]), '#fff', { lw: 0.5, so: 0 }); v.part(Ppoly([[18, 15.4 + yo], [18.8, 13.4 + yo], [19.8, 15.4 + yo]]), '#fff', { lw: 0.5, so: 0 }); }
      if (o.tongue) v.part(Ppoly([[14, 16.6 + yo], [21, 19.6 + yo], [19, 21 + yo], [13, 18 + yo]]), '#e8607a', { lw: 0.8, so: 0.2 });
      x.restore();
      // craneo / hocico
      var hc = o.dead ? '#8a9a8a' : ACID;
      v.part(Pclosed([[4, 14 + yo], [7, 8.4 + yo], [14, 7.2 + yo], [20.6, 9.4 + yo], [23, 12 + yo], [21, 15 + yo], [14, 15.4 + yo], [8, 16.4 + yo]]), hc, { lw: 1.6, sh: o.dead ? '#566a5a' : ACID_S, hi: ACID_H, so: 0.9 });
      if (o.cheek) { v.part(Pblob(14, 16.6 + yo, 6.4, 4.6, 603), '#a6ff6a', { lw: 1.3, sh: ACID, hi: '#eaffd0', so: 0.5 }); x.fillStyle = 'rgba(200,255,140,0.35)'; x.beginPath(); x.arc(13, 14, 11, 0, TAU); x.fill(); }
      v.part(Pblob(11.4, 11.6 + yo, 3.4, 2.8, 604, 0.05), HT, { lw: 0.8, sh: HT_S, so: 0.2 });   // mejilla escamosa
      v.dot(21.2, 11.6 + yo, 0.8, '#1b1124'); v.dot(21.4, 13 + yo, 0.5, '#1b1124');
      if (jaw <= 0.12 && !o.cheek) { for (i = 0; i < 2; i++) v.part(Ppoly([[12 + i * 6, 15.2 + yo], [12.8 + i * 6, 17.2 + yo], [13.8 + i * 6, 15.2 + yo]]), '#fff', { lw: 0.5, so: 0 }); }
      // ojo
      if (o.spin) { v.dot(15.4, 10.4 + yo, 2.2, '#fff6dc'); spiral(v, 15.4, 10.4 + yo, 2, '#1b1124'); }
      else if (o.closed) { v.line(13.4, 9.6 + yo, 17, 11.4 + yo, 1.1, '#1b1124'); v.line(13.4, 11.4 + yo, 17, 9.6 + yo, 1.1, '#1b1124'); }
      else if (o.narrow) { v.part(Pblob(15.4, 10.4 + yo, 2.2, 1.1, 605), '#ffe45a', { lw: 0.8, so: 0.2 }); v.dot(15.8, 10.4 + yo, 0.5, '#1b1124'); }
      else { v.part(Pblob(15.4, 10.4 + yo, 2.2, 2, 606), '#ffe45a', { lw: 0.9, so: 0.2 }); v.line(15.6, 9.2 + yo, 15.6, 11.6 + yo, 0.8, '#1b1124'); v.dot(14.6, 9.6 + yo, 0.45, '#fff'); }
      x.restore();
      if (o.lunge) { for (i = 0; i < 3; i++) v.line(0, 8 + i * 4.4, 4 + i % 2 * 2, 8 + i * 4.4, 0.7, 'rgba(232,228,212,0.8)'); }
      if (o.spray) { [[22, 14, 1.8], [23.4, 17, 1.4], [21, 19.6, 1.6], [23, 11, 1.1]].forEach(function (p) { v.dot(p[0], p[1], p[2] + 0.5, '#1b1124'); v.dot(p[0], p[1], p[2], ACID); v.dot(p[0] - 0.3, p[1] - 0.4, p[2] * 0.35, ACID_H); }); }
      if (o.stars) { star(v, 7, 3.4, 1.3, '#ffe45a'); star(v, 14, 1.8, 1.1, '#fff'); star(v, 20, 4, 1.3, '#ffe45a'); }
      if (o.cut) { v.part(Pblob(4, 17, 2.2, 3.6, 607), WND, { lw: 0.9, sh: '#7a1e2a', so: 0.3 }); v.dot(2.6, 21.2, 0.8, WND); }
    };
  }
  (function () {
    addV('enemy_mini_hidra_head', 24, 24, [
      hhead({}), hhead({ rot: -0.32, narrow: true, yo: 0.6 }), hhead({ jaw: 0.62, lunge: true, rot: 0.1 }), hhead({ cheek: true, narrow: true, rot: -0.1 }), hhead({ jaw: 0.5, spray: true, rot: 0.06 }),
      hhead({ closed: true, jaw: 0.22, rot: -0.2, yo: 0.5 }), hhead({ spin: true, jaw: 0.3, tongue: true, stars: true, rot: 0.22, yo: 1 }), hhead({ rot: 1.05, closed: true, jaw: 0.3, dead: true, cut: true, yo: 1 }), hhead({ bud: true })
    ], { lw: 1.6 }, { idle: { f: [0], fps: 1 }, lunge: { f: [1, 2], fps: 8 }, spit: { f: [3, 4], fps: 8 }, hurt: { f: [5], fps: 1 }, exposed: { f: [6], fps: 1 }, severed: { f: [7], fps: 1 }, regrow: { f: [8], fps: 1 } });
    addV('enemy_mini_hidra_neck', 12, 12, [function (v) {
      v.part(Pblob(6, 6, 4.8, 4.4, 620, 0.05), HT, { lw: 1.5, sh: HT_S, hi: HT_H, so: 0.8 });
      v.part(Pblob(7.2, 8.6, 3, 1.6, 621), CREAM, { lw: 0.6, sh: CREAM_S, so: 0.2 });
      v.dot(4, 4.2, 0.7, HT_H); v.dot(7.6, 3.4, 0.6, HT_H);
    }], { lw: 1.4 }, { idle: { f: [0], fps: 1 } });
  })();

  // ================================================================================================================
  // 4) PLANIDERA ANEGADA  36x40 -> 72x80.  Figura velada flotante, vestido turquesa que gotea, velo translucido.
  // ================================================================================================================
  var TQ = '#2f9a9a', TQ_S = '#1b6266', TQ_H = '#74dcd0', VEIL = '#7fffe0', THR = '#6a4a9a', THR_S = '#3c2a5e', THR_H = '#9c80d0';

  function plan(o) {
    o = o || {};
    return function (v) {
      var x = v.ctx, by = o.by || 0, sw = o.sw || 0, np = o.np, i, hx = 18 + (o.hxo || 0), hy = 10 + by + (o.hyo || 0), sz = o.sz || 1;
      var A1 = o.a1 || [[25, 12], [29, 6]], A2 = o.a2 || [[11, 12], [7, 6]];
      // bruma al pie
      for (i = 0; i < 4; i++) { x.fillStyle = 'rgba(127,255,224,' + (0.2 - i * 0.02) + ')'; x.beginPath(); x.ellipse(18 + (i - 1.5) * 6 + sw, 35.4 + (i % 2) * 1.6, 6.6, 2.8, 0, 0, TAU); x.fill(); }
      // hilos morados detras
      v.stick([[hx - 3, hy], [hx - 7 - sw * 0.6, hy + 9], [hx - 6 + sw, hy + 18]], 1.8, THR, { lw: 0.9, curve: true, hi: THR_H });
      v.stick([[hx + 3, hy], [hx + 7 + sw * 0.6, hy + 9], [hx + 6.4 + sw, hy + 17]], 1.8, THR, { lw: 0.9, curve: true, hi: THR_H });
      // vestido (borde roto que gotea)
      x.save(); x.translate(18, 20 + by); x.scale(sz, sz); x.translate(-18, -20 - by);
      var D = [[14, 15 + by], [22, 15 + by], [26, 22 + by], [30, 31], [28, 35 + sw * 0.4], [24.4, 33.4], [21, 36.6], [17.4, 33.8], [13.6, 36 - sw * 0.4], [10.4, 33.4], [6, 34], [8.4, 26 + by]];
      v.part(Pclosed(D), o.hurt ? '#5ab8b4' : TQ, { lw: 1.7, sh: TQ_S, hi: TQ_H, so: 1.1 });
      for (i = 0; i < 4; i++) v.line(12 + i * 4.2, 22 + by, 10.6 + i * 5.2 + sw * 0.3, 33, 0.6, TQ_S);
      v.part(Prr(13, 15.6 + by, 10, 2.2, 1), THR, { lw: 1, sh: THR_S, hi: THR_H, so: 0.3 });  // cenefa
      x.restore();
      // desvanecer el dobladillo
      x.save(); x.globalCompositeOperation = 'destination-out';
      var g = x.createLinearGradient(0, 30, 0, 40); g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(0,0,0,0.92)'); x.fillStyle = g; x.fillRect(0, 30, 40, 10); x.restore();
      // gotas del dobladillo
      [[11, 36 + (o.dr || 0)], [23, 37.4 + (o.dr || 0) * 0.6], [30, 35.4]].forEach(function (d) { x.fillStyle = 'rgba(127,255,224,0.7)'; x.beginPath(); x.ellipse(d[0], d[1], 0.9, 1.4, 0, 0, TAU); x.fill(); });
      // brazo lejano
      function arm(a, far) {
        var sx = far ? 13.4 : 22.6, sy = 17 + by;
        v.stick([[sx, sy], a[0], a[1]], far ? 2.8 : 3.2, far ? '#237c80' : TQ, { lw: 1.3, curve: true, hi: far ? null : TQ_H });
        v.part(Pblob(a[1][0], a[1][1], 1.9, 1.7, 700 + (far ? 1 : 0)), CREAM, { lw: 0.9, sh: CREAM_S, so: 0.2 });
        for (var f = -1; f <= 1; f++) v.line(a[1][0], a[1][1], a[1][0] + (a[1][0] > sx ? 2.8 : -2.8) + (a[1][1] < a[0][1] ? 0 : 0), a[1][1] + (a[1][1] < a[0][1] ? -2.4 : 2.4) + f * 1.2, 0.7, CREAM);
        if (o.thr) v.stick([[a[1][0], a[1][1]], [a[1][0] + (far ? -2 : 2), a[1][1] + 6], [a[1][0] + (far ? -1 : 1) * 0.6 + sw, a[1][1] + 11]], 0.9, THR, { lw: 0.5, curve: true });
      }
      arm(A2, true);
      // cabeza
      v.part(Pblob(hx, hy, 4.8, 5.4, 710, 0.04), '#d8d4c4', { lw: 1.5, sh: CREAM_S, hi: '#fff', so: 0.7 });
      // ojos (blancos, cuencas oscuras) y boca
      var ey = hy - 0.4;
      if (o.hurtFace) { v.line(hx - 3, ey - 1, hx - 0.6, ey, 1, '#1b1124'); v.line(hx + 0.6, ey, hx + 3, ey - 1, 1, '#1b1124'); }
      else {
        v.part(Pblob(hx - 1.9, ey, 1.4, 1.9, 711), '#16303a', { lw: 0.4, so: 0 }); v.part(Pblob(hx + 1.9, ey, 1.4, 1.9, 712), '#16303a', { lw: 0.4, so: 0 });
        v.dot(hx - 1.9, ey - 0.2, 0.75, '#ffffff'); v.dot(hx + 1.9, ey - 0.2, 0.75, '#ffffff');
        if (np) { v.line(hx - 1.9, ey + 1.6, hx - 2.3, ey + 4.4, 0.6, VEIL); v.line(hx + 1.9, ey + 1.6, hx + 2.3, ey + 4.4, 0.6, VEIL); }
      }
      if (o.mouth) v.part(Pblob(hx, hy + 3.2, 1.6, 2.2 * (o.mouth === 2 ? 1.2 : 1), 713), '#1b0d1c', { lw: 0.5, so: 0 }); else v.line(hx - 1, hy + 3.4, hx + 1, hy + 3.2, 0.6, '#1b1124');
      // cabello/capucha de hilo
      v.part(Pclosed([[hx - 5.4, hy - 1], [hx - 3, hy - 6.6], [hx + 1, hy - 7], [hx + 4.6, hy - 5.6], [hx + 5.4, hy - 0.6], [hx + 3.4, hy - 3.6], [hx, hy - 4.4], [hx - 3.4, hy - 3.2]]), THR, { lw: 1.2, sh: THR_S, hi: THR_H, so: 0.5 });
      // velo (parte)
      if (!np) {
        var vw = o.vw || 0, tear = o.tear || 0;
        x.globalAlpha = 0.72;
        v.part(Pclosed([[hx - 6, hy - 5.4], [hx, hy - 8 - vw * 0.6], [hx + 6, hy - 5.4], [hx + 7.6 + vw, hy + 4], [hx + 6 + vw * 1.4, hy + 11], [hx + 3 + vw * 0.5, hy + 9], [hx, hy + 12 + vw], [hx - 3.4 - vw * 0.5, hy + 9.4], [hx - 6.6 - vw * 1.4, hy + 11], [hx - 7.8 - vw, hy + 4]]), VEIL, { lw: 0.9, sh: '#35c9ae', hi: '#e8fff8', so: 0.7 });
        x.globalAlpha = 1;
        v.line(hx - 4, hy - 4, hx - 5, hy + 7, 0.5, 'rgba(232,255,248,0.8)'); v.line(hx + 4, hy - 4, hx + 5.4, hy + 7, 0.5, 'rgba(232,255,248,0.8)');
        if (tear) { v.line(hx - 1, hy - 2, hx + 1, hy + 4, 0.8, '#16303a'); }
        v.dot(hx - 1.9, ey, 0.6, '#ffffff'); v.dot(hx + 1.9, ey, 0.6, '#ffffff');
      }
      arm(A1, false);
      // extras
      if (o.tears) for (i = 0; i < o.tears; i++) { var tx = [8, 28, 4, 32, 13, 24][i % 6], ty = 6 + (i * 5) % 17 + (o.tdy || 0); x.fillStyle = '#1b1124'; x.beginPath(); x.ellipse(tx, ty, 1.5, 2.2, 0, 0, TAU); x.fill(); x.fillStyle = VEIL; x.beginPath(); x.ellipse(tx, ty, 1, 1.7, 0, 0, TAU); x.fill(); v.dot(tx - 0.3, ty - 0.5, 0.4, '#fff'); }
      if (o.notes) { note(v, 30, 7, '#a08ae0', 1); note(v, 5, 6, '#8a70d0', 0.9); if (o.notes > 1) note(v, 33, 15, '#b8a0f0', 0.8); }
      if (o.rings) { x.strokeStyle = 'rgba(127,255,224,0.75)'; x.lineWidth = 1.1; for (i = 0; i < o.rings; i++) { x.beginPath(); x.arc(18, 20 + by, 14 + i * 3, 0, TAU); x.stroke(); } }
      if (o.ripple) ripples(v, 18, 36, 2, 6, 0.75);
      if (o.glowAura) { x.fillStyle = 'rgba(232,255,248,' + o.glowAura + ')'; x.beginPath(); x.arc(18, 20 + by, 15, 0, TAU); x.fill(); }
    };
  }
  (function () {
    var F = [plan({}), plan({ by: -1, sw: 1, dr: 0.8, a1: [[25, 11], [29, 5]], a2: [[11, 11], [7, 5]] })], k;
    for (k = 0; k < 4; k++) F.push(plan({ by: -(k % 2) * 1.1, sw: cos(ph(k + 1)) * 1.6, dr: k * 0.4 }));                                    // 2-5
    F.push(plan({ a1: [[26, 7], [28, 0.6]], a2: [[10, 7], [8, 0.6]], tears: 4, by: -0.6, mouth: 1, tdy: 2 }));                              // 6 rain-wind
    F.push(plan({ a1: [[28, 20], [32, 28]], a2: [[8, 20], [4, 28]], tears: 6, by: 0.6, tdy: 4, vw: 0.6 }));                               // 7 rain-cast
    F.push(plan({ a1: [[28, 15], [34, 14]], a2: [[8, 15], [2, 14]], vw: 3, by: -0.6, thr: true }));                                         // 8 tide-wind
    F.push(plan({ a1: [[27, 22], [32, 30]], a2: [[9, 22], [4, 30]], vw: 1.4, ripple: true, thr: true, by: 0.8 }));                          // 9 tide-cast
    F.push(plan({ a1: [[27, 10], [31, 5]], a2: [[9, 10], [5, 5]], mouth: 2, notes: 1, vw: 0.8, by: -0.8 }));                                // 10 choir-wind
    F.push(plan({ a1: [[28, 14], [34, 12]], a2: [[8, 14], [2, 12]], mouth: 2, notes: 2, vw: 1.2, by: -1 }));                                // 11 choir-cast
    F.push(plan({ sz: 1.1, glowAura: 0.3, a1: [[28, 14], [33, 12]], a2: [[8, 14], [3, 12]], vw: 2, mouth: 2, by: -0.6 }));                 // 12 burst-wind
    F.push(plan({ rings: 3, glowAura: 0.18, a1: [[28, 12], [33, 8]], a2: [[8, 12], [3, 8]], vw: 2.4, mouth: 2, by: -1 }));                  // 13 burst
    F.push(plan({ hurt: true, hurtFace: true, hxo: -1, hyo: 0.8, a1: [[27, 16], [30, 11]], a2: [[9, 18], [5, 22]], vw: 1.6, tear: 1, by: 1 })); // 14 hurt
    F.push(plan({ mouth: 2, a1: [[29, 11], [34, 4]], a2: [[7, 11], [2, 4]], vw: 2.4, rings: 1, by: -1 }));                                // 15 roar
    var dieA = withDie(F, plan({}), 36, 40, { lw: 1.6 });                                                                                   // 16-20
    function n(o) { o.np = true; return plan(o); }
    F.push(n({}), n({ by: -1, sw: 1, dr: 0.8, a1: [[25, 11], [29, 5]], a2: [[11, 11], [7, 5]] }));                                         // 21-22
    for (k = 0; k < 4; k++) F.push(n({ by: -(k % 2) * 1.1, sw: cos(ph(k + 1)) * 1.6, dr: k * 0.4 }));                                    // 23-26
    F.push(n({ a1: [[28, 15], [34, 14]], a2: [[8, 15], [2, 14]], by: -0.6, thr: true }), n({ a1: [[27, 22], [32, 30]], a2: [[9, 22], [4, 30]], ripple: true, thr: true, by: 0.8 })); // 27-28
    F.push(n({ a1: [[27, 10], [31, 5]], a2: [[9, 10], [5, 5]], mouth: 2, notes: 1, by: -0.8 }), n({ a1: [[28, 14], [34, 12]], a2: [[8, 14], [2, 12]], mouth: 2, notes: 2, by: -1 })); // 29-30
    F.push(n({ rings: 3, glowAura: 0.18, a1: [[28, 12], [33, 8]], a2: [[8, 12], [3, 8]], mouth: 2, by: -1 }));                             // 31
    addV('enemy_mini_planidera', 36, 40, F, { lw: 1.7 }, {
      idle: { f: [0, 1], fps: 3 }, float: { f: WALKSEQ, fps: 7 }, walk: { f: WALKSEQ, fps: 7 }, rain: { f: [6, 7], fps: 8 }, tide: { f: [8, 9], fps: 8 }, choir: { f: [10, 11], fps: 8 }, burst: { f: [12, 13], fps: 8 },
      hurt: { f: [14], fps: 1 }, roar: { f: [15], fps: 1 }, die: dieA, idle_np: { f: [21, 22], fps: 3 }, float_np: { f: [21, 23, 22, 24, 25, 26], fps: 7 },
      tide_np: { f: [27, 28], fps: 8 }, choir_np: { f: [29, 30], fps: 8 }, burst_np: { f: [31], fps: 1 }
    });
    // velo que se rasga (66 % y 33 %): superponer sobre idle/float en el ancla del sprite
    addV('fx_mini_crack_planidera', 36, 40, [0, 1].map(function (lv) {
      return function (v) {
        var hx = 18, hy = 10;
        v.line(hx - 5, hy - 1, hx - 1.6, hy + 4 + lv, 0.9, '#16303a'); v.line(hx - 1.6, hy + 4 + lv, hx - 3, hy + 9, 0.8, '#16303a');
        if (lv) { v.line(hx + 4.6, hy - 2, hx + 1.4, hy + 5, 0.9, '#16303a'); v.line(hx + 1.4, hy + 5, hx + 3.4, hy + 10, 0.8, '#16303a'); v.part(Ppoly([[hx - 1, hy + 1], [hx + 1, hy + 2], [hx, hy + 4]]), '#d8d4c4', { lw: 0.4, so: 0 }); }
      };
    }), { outline: false, lw: 0 }, { loop: { f: [0, 1], fps: 1 } });
  })();

  // ------------------------------------------------------------------------------------------ indice y anclas
  // Anclas en px FINALES relativas a la esquina superior izquierda del sprite (sin voltear). Girar con scale(-1) = (w - x).
  A.MINI1 = {
    bosque: ['enemy_mini_carnero', 'enemy_mini_tejedora', 'enemy_mini_pod', 'fx_root_spike', 'fx_mini_thorn_patch', 'fx_horn_shard', 'fx_mini_crack_carnero', 'fx_mini_crack_tejedora'],
    asfodelo: ['enemy_mini_hidra', 'enemy_mini_hidra_head', 'enemy_mini_hidra_neck', 'enemy_mini_planidera', 'fx_mini_crack_planidera'],
    anchors: {
      enemy_mini_carnero: { feet: [44, 60], horns: [73, 35], head: [73, 36], mouth: [80, 40] },
      enemy_mini_tejedora: { feet: [40, 76], rootMother: [17, 52], head: [46, 19], hands: [[62, 44], [20, 44]] },
      enemy_mini_hidra: { feet: [38, 56], neck: [63, 26], tail: [2, 42] },
      enemy_mini_hidra_head: { neck: [8, 28] },
      enemy_mini_planidera: { feet: [36, 74], veil: [36, 20], face: [36, 20], hands: [[58, 12], [14, 12]] }
    }
  };
})();
