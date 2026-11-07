/*!
 * assets_enemies2.js - Arte de Swarm Hand v2: 6 enemigos nuevos, 2 elites y proyectiles/VFX.
 * Se carga DESPUES de assets.js (usa Assets._h). Nombres y frames: ver ASSETS_API.md (seccion "Swarm Hand v2").
 * Misma gramatica que assets.js: contorno grueso #1b1124, color plano + 1 sombra + 1 brillo, miran a la DERECHA.
 */
(function () {
  'use strict';
  var A = window.Assets, H = A && A._h;
  if (!H) { if (window.console) console.error('assets_enemies2: falta Assets._h (cargar tras assets.js)'); return; }
  var addV = H.addV, Pclosed = H.Pclosed, Ppoly = H.Ppoly, Pblob = H.Pblob, Prr = H.Prr, Pcirc = H.Pcirc;
  var dyingFrames = H.dyingFrames, DIE_ANIM = H.DIE_ANIM, PH = H.PH, OLC = H.OLC, rrand = H.rrand;
  var TAU = 6.2832;

  // fase de caminata: frames 2-5 usan PH[1], PH[2], PH[4], PH[5]
  var WK = [1, 2, 4, 5];
  function wk(k) { var p = PH[WK[k]]; return { c: Math.round(Math.cos(p)), by: -(Math.abs(Math.sin(p)) > 0.8 ? 1 : 0), p: p }; }
  function withDie(fr, draw, w, h, opt, o) {
    var d0 = fr.length;
    dyingFrames(draw, w, h, opt, o).forEach(function (f) { fr.push(f); });
    return { f: [d0, d0 + 1, d0 + 2, d0 + 3, d0 + 4], fps: 9, loop: false };
  }
  var WALKSEQ = [0, 2, 1, 3, 4, 5];

  // =================================================================== ESPINOSO (fanner) 20x18
  function fanner(o) {
    return function (v) {
      var by = o.by || 0, L = o.legs || [0, 0], inf = o.infl || 0, i;
      var cx = 9.4, cy = 9.8 + by + (inf < 0 ? 1.2 : 0), R = 6.2 + inf * 1.2, n = 10;
      for (i = 0; i < 2; i++) v.part(Prr((i ? 10.6 : 5.8) + L[i], 14.6, 3, 2.6, 1), '#1f6a42', { lw: 1, sh: '#154a30', so: 0.4 });
      var len = inf < 0 ? 3 : 4.6 + inf * 2.6;
      for (i = 0; i < n; i++) {
        var a = (-205 + i * (170 / (n - 1))) * Math.PI / 180 + (inf < 0 ? -0.35 : 0);
        var ca = Math.cos(a), sa = Math.sin(a), bx = cx + ca * R * 0.78, bY = cy + sa * R * 0.78, w = 1.45 + inf * 0.3, l = len * (i % 2 ? 0.85 : 1);
        var tx = bx + ca * l, ty = bY + sa * l, px = -sa, py = ca;
        v.part(Ppoly([[bx - px * w, bY - py * w], [tx, ty], [bx + px * w, bY + py * w]]), '#f4e8c8', { lw: 0.8, sh: '#c9b78e', so: 0.25 });
        var m = 0.5; v.flat(Ppoly([[bx - px * w * (1 - m) + ca * l * m, bY - py * w * (1 - m) + sa * l * m], [tx, ty], [bx + px * w * (1 - m) + ca * l * m, bY + py * w * (1 - m) + sa * l * m]]), '#ff9a2a');
      }
      v.part(Pblob(cx, cy, R + 0.4, (R - 0.3) * (inf < 0 ? 0.82 : 1), 61, 0.03), '#2f8f5a', { lw: 1.4, sh: '#1d5c3a', hi: '#5cc088', so: 0.9 });
      v.part(Pblob(cx + 2, cy + 2.4, R * 0.55, R * 0.32, 62), '#a8e0b0', { lw: 0, sh: '#78b888', so: 0.3 });
      v.part(Pblob(16.6, cy + 0.9, 1.7, 1.4, 63), '#7fd4a0', { lw: 0.9, sh: '#4fa070', so: 0.3 });
      v.dot(17.4, cy + 0.5, 0.45, OLC);
      var ex = [11.2, 14.3], ey = cy - 1.4;
      if (inf > 0.5) {
        ex.forEach(function (e) { v.eye(e, ey, 1.55, { white: '#fff6c0', lx: 0.8, pr: 0.55, lw: 0.4, sh: false }); });
        v.line(9.6, ey - 2.4, 12.8, ey - 1.3, 0.9, '#10301f'); v.line(15.8, ey - 2.4, 13, ey - 1.3, 0.9, '#10301f');
        v.part(Pblob(14.6, cy + 3.2, 1.7, 1.1, 64), '#3a0e18', { lw: 0.5 }); v.dot(13.8, cy + 2.7, 0.35, '#fff'); v.dot(15.4, cy + 2.7, 0.35, '#fff');
      } else {
        ex.forEach(function (e) { v.eye(e, ey, 1.5, { lx: 0.8, pr: 0.55, lw: 0.4, sh: false }); });
        if (inf < 0) v.part(Pblob(15.4, cy + 3, 0.9, 0.9, 65), '#3a0e18', { lw: 0.4 }); else v.line(13, cy + 3, 15.4, cy + 3, 0.6, OLC);
      }
      if (o.fire) { // tres espinas saliendo en abanico
        [[-3.4, 0], [0, 0.5], [3.4, 0]].forEach(function (p, k) {
          v.part(Ppoly([[16.2, cy + p[0] - 0.8], [19.6, cy + p[0] * 1.5], [16.2, cy + p[0] + 0.8]]), '#f4e8c8', { lw: 0.6, sh: '#c9b78e', so: 0.2 });
          v.flat(Ppoly([[18.2, cy + p[0] * 1.3 - 0.5], [19.6, cy + p[0] * 1.5], [18.2, cy + p[0] * 1.3 + 0.5]]), '#ff9a2a');
        });
      }
    };
  }
  (function () {
    var w = wk, F = [fanner({}), fanner({ by: 1 })], k;
    for (k = 0; k < 4; k++) { var q = w(k); F.push(fanner({ by: q.by, legs: [-q.c, q.c] })); }
    F.push(fanner({ infl: 1, by: -0.5 }), fanner({ infl: -0.5, fire: true, by: 1 }));
    var dieA = withDie(F, fanner({}), 20, 18, { lw: 1.4 });
    addV('enemy_fanner', 20, 18, F, { lw: 1.4 }, {
      idle: { f: [0, 1], fps: 4 }, walk: { f: WALKSEQ, fps: 8 }, aim: { f: [6], fps: 1 }, shoot: { f: [7, 1], fps: 8 }, die: dieA
    });
  })();

  // =================================================================== ESCUDERO / COLOSO (soldier) 24x24 base
  function soldier(o, big) {
    return function (v) {
      var x = v.ctx;
      if (big) x.scale(4 / 3, 4 / 3);
      var P = big ? { cloth: '#3a3f55', clothS: '#262a3c', steel: '#5a6478', steelS: '#3c4458', steelH: '#8c98b0', gold: '#e0b040', goldS: '#a07a1c', ring: '#3c4458' }
        : { cloth: '#8a2a3a', clothS: '#5a1426', steel: '#8fa0b8', steelS: '#5e6e88', steelH: '#c9d6e8', gold: '#e8d070', goldS: '#a89030', ring: '#8a2a3a' };
      var by = o.by || 0, bx = o.bx || 0, L = o.legs || [0, 0], sx = 15.4 + (o.sx || 0), sy = 13.8 + (o.sy || 0), lift = o.lift || [0, 0];
      var i;
      for (i = 0; i < 2; i++) {
        v.part(Prr((i ? 11.6 : 6.6) + L[i] + bx * 0.5, 17.8 - lift[i], 3.4, 4.4 + (lift[i] ? 0 : 0), 1.2), P.cloth, { lw: 1.2, sh: P.clothS, so: 0.5 });
        v.part(Prr((i ? 11.2 : 6.2) + L[i] + bx * 0.5, 20.4 - lift[i], 4.2, 2.2, 0.9), P.steelS, { lw: 1, sh: '#262a3c', so: 0.3 });
      }
      // torso
      v.part(Pblob(10.2 + bx, 14.2 + by, 5.4, 5, 71, 0.03), P.cloth, { lw: 1.4, sh: P.clothS, so: 0.9 });
      v.part(Pblob(10.6 + bx, 12.8 + by, 4.2, 3.2, 72), P.steel, { lw: 1, sh: P.steelS, hi: P.steelH, so: 0.6 });
      v.part(Prr(5.6 + bx, 16.6 + by, 9.2, 1.4, 0.5), P.gold, { lw: 0.6, sh: P.goldS, so: 0.3 });
      if (big) { v.part(Pcirc(5.4 + bx, 11.4 + by, 2.6), P.gold, { lw: 1, sh: P.goldS, so: 0.4 }); v.part(Pcirc(15.2 + bx, 11.4 + by, 2.3), P.gold, { lw: 1, sh: P.goldS, so: 0.4 }); }
      // casco
      if (big) {
        v.part(Ppoly([[6.8 + bx, 6.4 + by], [4.4 + bx, 2.6 + by], [8.4 + bx, 4.4 + by]]), '#f0e0a0', { lw: 0.9, sh: '#b8a060', so: 0.3 });
        v.part(Ppoly([[13.8 + bx, 6.4 + by], [16.4 + bx, 2.6 + by], [12.4 + bx, 4.4 + by]]), '#f0e0a0', { lw: 0.9, sh: '#b8a060', so: 0.3 });
      } else {
        v.part(Ppoly([[7.4 + bx, 4.4 + by], [9.2 + bx, 0.8 + by], [13.2 + bx, 3.6 + by], [12 + bx, 5 + by]]), '#b83a4c', { lw: 0.9, sh: '#7a1e30', so: 0.3 });
      }
      v.part(Pblob(10.4 + bx, 8.2 + by, 4.6, 4.3, 73, 0.03), P.steel, { lw: 1.3, sh: P.steelS, hi: P.steelH, so: 0.8 });
      v.part(Prr(9 + bx, 7.4 + by, 6.2, 1.9, 0.8), '#1a1424', { lw: 0.5 });
      var ec = o.rec ? '#ffd23a' : (big ? '#ff6a4a' : '#ffe45a');
      v.dot(10.8 + bx, 8.35 + by, 0.65, ec); v.dot(13.4 + bx, 8.35 + by, 0.65, ec);
      v.line(10.4 + bx, 10.6 + by, 12.6 + bx, 10.6 + by, 0.5, P.steelS);
      if (o.rec) { v.dot(7.2, 5.6, 0.45, '#d8f0ff'); v.dot(5.6, 8.2, 0.4, '#d8f0ff'); }
      // pavés
      var R = big ? 6.2 : 6;
      if (o.glow) {
        x.save(); x.strokeStyle = 'rgba(255,240,170,0.9)'; x.lineWidth = 1.1; x.beginPath(); x.arc(sx, sy, R + 1.8, 0, TAU); x.stroke(); x.restore();
        v.dot(sx + R + 1.5, sy - R * 0.9, 0.55, '#fff6c0'); v.dot(sx - 1, sy - R - 1.2, 0.5, '#ffe45a'); v.dot(sx + R * 0.7, sy + R + 1.2, 0.5, '#ffe45a');
      }
      var rot = o.low ? 0.5 : 0;
      v.part(Pblob(sx, sy, R, o.low ? R * 0.75 : R, 74, 0.02, 12, rot), P.steel, { lw: 1.5, sh: P.steelS, hi: P.steelH, so: 1 });
      v.part(Pblob(sx, sy, R * 0.72, o.low ? R * 0.54 : R * 0.72, 75, 0.02, 12, rot), P.ring, { lw: 0.8, sh: big ? '#262a3c' : '#5a1426', so: 0.5 });
      if (big) {
        v.part(Pblob(sx, sy, 2.7, 1.9, 76, 0.03, 9, rot), '#ff3b30', { lw: 0.8, sh: '#a31824', hi: '#ffb06a', so: 0.4 });
        v.part(Prr(sx - 0.35, sy - 1.5, 0.7, 3, 0.3), '#1b1124', { lw: 0 }); v.dot(sx - 0.9, sy - 0.7, 0.4, '#fff');
        v.dot(sx - R * 0.8, sy, 0.6, P.gold); v.dot(sx + R * 0.8, sy, 0.6, P.gold); v.dot(sx, sy - R * 0.8, 0.6, P.gold);
      } else {
        v.part(Pcirc(sx, sy, 1.9), P.steel, { lw: 0.8, sh: P.steelS, hi: P.steelH, so: 0.4 });
        v.dot(sx - 0.4, sy - 0.4, 0.5, P.steelH);
      }
      if (o.hit) {
        v.part(Ppoly([[sx + R + 0.4, sy - 4.2], [sx + R + 2.2, sy - 1.2], [sx + R + 4.2, sy - 2], [sx + R + 2.8, sy], [sx + R + 4.4, sy + 2], [sx + R + 2.2, sy + 1.6], [sx + R + 0.6, sy + 4.2]]), '#fff6d0', { lw: 0.7, ol: '#c8501c', so: 0.2 });
      }
      if (o.dust) { v.line(2, 22.6, 6, 22.6, 0.7, 'rgba(210,200,190,0.9)'); v.line(1, 20.6, 4.6, 21, 0.6, 'rgba(210,200,190,0.8)'); v.line(19, 22.6, 23, 22.6, 0.7, 'rgba(210,200,190,0.9)'); v.line(20, 20.6, 23.4, 20.8, 0.6, 'rgba(210,200,190,0.8)'); }
    };
  }
  function buildSoldier(name, big, extra) {
    var S = function (o) { return soldier(o, big); }, F = [S({}), S({ by: 1 })], k;
    for (k = 0; k < 4; k++) { var q = wk(k); F.push(S({ by: q.by, legs: [-q.c, q.c] })); }
    F.push(S({ bx: -1.8, sx: -2.4, by: 0.5, glow: true })); // 6 wind
    F.push(S({ bx: 0.8, sx: 1.2, hit: true, legs: [0, 1] })); // 7 bash
    var rec = S({ sx: 0, sy: 4.4, low: true, by: 1, rec: true });
    var bulwarkExtra = [];
    if (extra) { // 8 stomp-wind (pie arriba), 9 stomp, 10 rec
      F[8] = S({ bx: -1.8, sx: -2.2, glow: true, lift: [0, 3.2], by: -0.5 });
      F[9] = S({ bx: 0.4, sx: 0.8, legs: [-1, 1], dust: true, by: 1, hit: true });
      F[10] = rec;
      F[6] = S({ bx: -1.8, sx: -2.4, by: 0.5, glow: true }); F[7] = S({ bx: 0.4, sx: 1.2, hit: true, legs: [0, 1] });
    } else { F[8] = rec; }
    var dieA = withDie(F, S({}), big ? 32 : 24, big ? 32 : 24, { lw: big ? 1.4 : 1.5 });
    var an = big
      ? { idle: { f: [0, 1], fps: 3 }, walk: { f: WALKSEQ, fps: 6 }, bash: { f: [6, 7], fps: 8 }, stomp: { f: [8, 9], fps: 8 }, rec: { f: [10], fps: 1 }, die: dieA }
      : { idle: { f: [0, 1], fps: 4 }, walk: { f: WALKSEQ, fps: 7 }, bash: { f: [6, 7, 8], fps: 10 }, wind: { f: [6], fps: 1 }, rec: { f: [8], fps: 1 }, die: dieA };
    addV(name, big ? 32 : 24, big ? 32 : 24, F, { lw: big ? 1.4 : 1.5 }, an);
  }
  buildSoldier('enemy_shield', false, false);
  buildSoldier('enemy_mini_bulwark', true, true);

  // =================================================================== POLILLA GELIDA (moth) 20x20
  function moth(o) {
    return function (v) {
      var by = o.by || 0, f = o.f, fold = o.fold ? 0.3 : 1, Rx = 10.6, Ry = 10.2 + by, x = v.ctx;
      function W(px, py) { return [Rx + px * fold, Ry + py]; }
      function wing(ff, base, sh, al, k) {
        x.globalAlpha = al;
        v.part(Pclosed([W(1, 0.2), W(-1, -6.4 * ff - 2.4), W(-6.4, -8.6 * ff - 1.2), W(-8.6, -3.4 * ff + 2.8), W(-4, 1.8)]), base, { lw: 1.3, sh: sh, hi: '#ffffff', so: 0.9 });
        v.line(Rx - 0.4, Ry, Rx - 6.2 * fold, Ry - 7 * ff, 0.4, '#8fc4f0'); v.dot(Rx - 5.4 * fold, Ry - 6 * ff + 0.4, 0.8, '#4aa8ff');
        x.globalAlpha = 1;
      }
      wing(Math.min(1.1, f * 0.75 + 0.1), '#b8d8f4', '#86b0dc', 0.95);                 // ala lejana
      // ala inferior
      x.globalAlpha = 0.95;
      v.part(Pclosed([W(0.6, 1.2), W(-4, 2.4 - f * 1.2), W(-6.6, 4.8 - f * 1.8), W(-3.2, 6.6), W(0.4, 4)]), '#cfe8fb', { lw: 1.2, sh: '#9cc8f0', hi: '#fff', so: 0.7 });
      x.globalAlpha = 1;
      v.part(Pblob(11.2, 11.4 + by, 3.9, 2.9, 81, 0.04), '#4aa8ff', { lw: 1.3, sh: '#2060b8', hi: '#9ad4ff', so: 0.7 });
      v.line(9.6, 9.8 + by, 9.2, 13 + by, 0.5, '#1c4a98'); v.line(11.4, 9.5 + by, 11.2, 13.3 + by, 0.5, '#1c4a98');
      v.part(Pblob(11.6, 9.6 + by, 2.5, 1.9, 82), '#f0faff', { lw: 0, sh: '#b0d0e8', so: 0.3 });
      v.stick([[15.4, 8.6 + by], [14.6, 5.6 + by], [13.2, 4.4 + by]], 0.6, '#2a5a98', { lw: 0.6 }); v.dot(13.1, 4.3 + by, 0.7, '#ffe45a');
      v.stick([[16.4, 8.4 + by], [17.4, 5.4 + by], [16.6, 4.2 + by]], 0.6, '#2a5a98', { lw: 0.6 }); v.dot(16.5, 4.1 + by, 0.7, '#ffe45a');
      v.part(Pblob(15.4, 10.2 + by, 2.7, 2.5, 83), '#7cc0ff', { lw: 1.2, sh: '#4a88d0', hi: '#c0e4ff', so: 0.6 });
      v.eye(16.2, 9.7 + by, 1.25, { white: '#ffe45a', lx: 0.8, pr: 0.5, lw: 0.3, sh: false });
      v.line(10, 14 + by, 9.4, 15.8 + by, 0.5, '#2a5a98'); v.line(12.2, 14.2 + by, 12.4, 16 + by, 0.5, '#2a5a98');
      wing(f, '#e4f4ff', '#a8d0f0', 0.97);                                                // ala cercana
      if (o.orb) { // orbe de hielo entre las patas
        var oy = 16 + by, r = o.orb;
        v.part(Pcirc(11.4, oy, r), '#7fd4ff', { lw: 0.9, ol: '#1c4a98', sh: '#3a88d8', hi: '#d8f4ff', so: 0.5 }); v.dot(11.2, oy - 0.2, r * 0.45, '#ffffff');
      }
      if (o.thrown) { v.part(Pcirc(18.4, 10.8 + by, 1.8), '#7fd4ff', { lw: 0.8, ol: '#1c4a98', sh: '#3a88d8', so: 0.3 }); v.dot(18.3, 10.7 + by, 0.7, '#fff'); v.line(14.5, 12.8, 17, 11.4, 0.5, 'rgba(216,244,255,0.8)'); }
      if (o.dust) { v.dot(3.2, 15, 0.45, '#e8f8ff'); v.dot(5.4, 17.6, 0.4, '#bfe6ff'); v.dot(2, 9.8, 0.4, '#e8f8ff'); }
    };
  }
  (function () {
    var F = [moth({ f: 1, by: -1, dust: true }), moth({ f: 0.3 }), moth({ f: -0.55, by: 1, dust: true }), moth({ f: 0.3 }),
      moth({ f: 1.15, fold: true, orb: 3, by: -1 }), moth({ f: -0.5, thrown: true, by: 1 })];
    var dieA = withDie(F, moth({ f: 0.3 }), 20, 20, { lw: 1.3 });
    addV('enemy_moth', 20, 20, F, { lw: 1.3 }, { fly: { f: [0, 1, 2, 3], fps: 14 }, charge: { f: [4], fps: 1 }, throw: { f: [5, 0], fps: 8 }, die: dieA });
  })();

  // =================================================================== SEMBRADOR (sower) 22x22
  function sower(o) {
    return function (v) {
      var by = o.by || 0, L = o.legs || [0, 0], cr = o.crouch || 0, sk = o.shake || 0, x = v.ctx, i;
      // bolsa de esporas
      v.part(Pblob(4.6, 14.2 + by + cr, 3.4, 3.6, 91), '#7c9a34', { lw: 1.2, sh: '#4c6a1c', hi: '#b8d860', so: 0.6 });
      v.part(Pclosed([[3.2, 11.2 + by + cr], [5.8, 10.6 + by + cr], [6, 12 + by + cr], [3.4, 12.4 + by + cr]]), '#a0803c', { lw: 0.7, sh: '#6a5020', so: 0.2 });
      v.dot(4.4, 14 + by + cr, 0.6, '#9bff4a');
      for (i = 0; i < 2; i++) v.part(Prr((i ? 12.2 : 7.4) + L[i], 17.6 + cr * 0.8, 2.8, 3.6 - cr * 0.8, 1.1), '#b8a67c', { lw: 1.1, sh: '#887848', so: 0.4 });
      v.part(Pblob(10.6, 14.6 + by + cr, 4.8, 4.6, 92, 0.03), '#d8c8a0', { lw: 1.4, sh: '#a89868', hi: '#f6eed0', so: 0.9 });
      v.eye(11.6, 14.1 + by + cr, 1.55, { lx: 0.8, pr: 0.55, lw: 0.35, sh: false }); v.eye(14.6, 14.1 + by + cr, 1.55, { lx: 0.8, pr: 0.55, lw: 0.35, sh: false });
      if (o.sow) v.part(Pblob(13.2, 17.2 + by + cr, 1.3, 0.9, 93), '#4a1230', { lw: 0.4 }); else v.line(12, 17 + by + cr, 14.4, 17 + by + cr, 0.55, OLC);
      // sombrero
      var capY = 7.2 + by + cr + (o.capUp || 0), cxp = 10.4 + sk;
      v.part(Pblob(cxp, capY + 3.4, 8.8, 1.9, 94, 0.02), '#e8d8b0', { lw: 1, sh: '#b8a478', so: 0.4 });
      v.part(Pblob(cxp, capY, 9.6, 5.6, 95, 0.03, 11, o.tilt || 0), '#9a2a78', { lw: 1.6, sh: '#5e1448', hi: '#d060b0', so: 1.1 });
      [[6.6, -0.8, 1.5], [11.8, -2.6, 1.7], [14.6, 0.6, 1.3], [9.4, 1.4, 1], [16, -0.6, 0.8], [4.6, 1.2, 0.8]].forEach(function (d) {
        v.part(Pcirc(d[0] + sk, capY + d[1], d[2]), '#f4e8c8', { lw: 0.5, sh: '#c9b78e', so: 0.3 });
      });
      if (o.spores) {
        [[5, 20.6], [9, 21], [13, 20.4], [16.4, 19.6], [7, 18.8], [14.6, 17.8]].forEach(function (d, k) {
          v.part(Pcirc(d[0], d[1] + (k % 2 ? 0 : -0.4), 0.9 + (k % 3) * 0.2), '#9bff4a', { lw: 0.5, ol: '#1a5a1a', sh: '#4aa82a', so: 0.2 });
        });
      }
    };
  }
  (function () {
    var F = [sower({}), sower({ by: 1 })], k;
    for (k = 0; k < 4; k++) { var q = wk(k); F.push(sower({ by: q.by, legs: [-q.c, q.c], shake: 0 })); }
    F.push(sower({ crouch: 2.4, shake: -1, tilt: 0.12, sow: true }));
    F.push(sower({ crouch: 0, capUp: -1.2, shake: 0.6, spores: true, sow: true }));
    var dieA = withDie(F, sower({}), 22, 22, { lw: 1.4 });
    addV('enemy_sower', 22, 22, F, { lw: 1.4 }, { idle: { f: [0, 1], fps: 4 }, walk: { f: WALKSEQ, fps: 7 }, sow: { f: [6, 7, 0], fps: 8 }, die: dieA });
  })();

  // =================================================================== ESPECTRO (blinker) 20x24
  function blinker(o) {
    return function (v) {
      var x = v.ctx, by = o.by || 0, w = o.w || 0, al = o.al == null ? 0.88 : o.al, sc = o.scythe;
      if (o.ring) { // anillo en los pies (a opacidad propia)
        x.save(); x.globalAlpha = 0.85; x.strokeStyle = OLC; x.lineWidth = 2.3; x.beginPath(); x.ellipse(10, 21.6, 8.2, 2.5, 0, 0, TAU); x.stroke();
        x.strokeStyle = '#c8a8ff'; x.lineWidth = 1.1; x.setLineDash([2.2, 1.4]); x.stroke(); x.restore();
      }
      x.globalAlpha = al;
      // guadana detras (alza / reposo)
      var hx, hy, bladeUp = true;
      if (sc === 'wind') { v.stick([[14, 15], [6.4, 0.8]], 1.1, '#d8cfc0', { lw: 0.9 }); v.part(Ppoly([[6.4, 0.8], [2.6, 0.4], [0.8, 3.4], [3.4, 2.4]]), '#d8dcf0', { lw: 0.9, sh: '#8a90b8', so: 0.3 }); }
      else if (sc !== 'hit') { v.stick([[15.8, 21.4 + by], [15.8, 5 + by]], 1.1, '#d8cfc0', { lw: 0.9 }); v.part(Ppoly([[15.4, 5.2 + by], [17.6, 2.6 + by], [20, 3.6 + by], [18, 4 + by], [16.6, 7 + by]]), '#d8dcf0', { lw: 0.9, sh: '#8a90b8', so: 0.3 }); }
      // tunica
      v.part(Pclosed([[5.4, 9.6 + by], [14.2, 9.6 + by], [16.2, 18 + by], [15, 21.6 + by + w], [12.4, 19.8 + by], [10, 22.8 + by - w], [7.6, 20 + by], [5, 22.2 + by + w], [3.8, 18 + by]]), '#8a6ae0', { lw: 1.4, sh: '#5a3eb0', hi: '#b8a0ff', so: 1.1 });
      v.line(9.8, 14 + by, 10.4, 19 + by, 0.5, '#b8a0ff');
      // capucha
      v.part(Ppoly([[5.6, 5.6 + by], [2.6, 1.2 + by], [8.6, 3.2 + by]]), '#8a6ae0', { lw: 1, sh: '#5a3eb0', so: 0.3 });
      v.part(Pblob(10, 7.6 + by, 5.2, 4.9, 101, 0.03), '#8a6ae0', { lw: 1.4, sh: '#5a3eb0', hi: '#b8a0ff', so: 0.9 });
      v.part(Pblob(11.4, 8 + by, 3.5, 3.2, 102), '#150a2a', { lw: 0.5 });
      v.part(Pblob(10.5, 7.6 + by, 0.95, 1.4, 103), '#ffffff', { lw: 0.3 }); v.part(Pblob(13.4, 7.6 + by, 0.95, 1.4, 104), '#ffffff', { lw: 0.3 });
      // mano / manga
      if (sc === 'hit') {
        v.stick([[7.4, 1.4], [15.6, 18.2]], 1.1, '#d8cfc0', { lw: 0.9 });
        v.part(Ppoly([[15.6, 18.2], [19.4, 20.4], [19.6, 23], [16.8, 21], [14.6, 19.8]]), '#d8dcf0', { lw: 0.9, sh: '#8a90b8', so: 0.3 });
        x.globalAlpha = 1; x.strokeStyle = 'rgba(255,255,255,0.95)'; x.lineWidth = 1.4; x.beginPath(); x.arc(5, 9, 15, -0.2, 1.15); x.stroke();
        x.strokeStyle = 'rgba(255,255,255,0.55)'; x.lineWidth = 0.8; x.beginPath(); x.arc(5, 9, 17, 0.05, 1.05); x.stroke(); x.globalAlpha = al;
        v.part(Pblob(13.2, 12.6, 1.6, 1.5, 105), '#6a4ac0', { lw: 0.9, sh: '#43288a', so: 0.3 });
      } else if (sc === 'wind') v.part(Pblob(13.4, 14.6, 1.7, 1.5, 105), '#6a4ac0', { lw: 0.9, sh: '#43288a', so: 0.3 });
      else v.part(Pblob(15.2, 15.6 + by, 1.7, 1.5, 105), '#6a4ac0', { lw: 0.9, sh: '#43288a', so: 0.3 });
      x.globalAlpha = 1;
    };
  }
  (function () {
    var F = [blinker({}), blinker({ by: 1, w: 0.8 }), blinker({ al: 0.4, ring: true, by: 0.5 }), blinker({ al: 0.15, ring: true, by: 1, w: 0.8 }),
      blinker({ scythe: 'wind', al: 1 }), blinker({ scythe: 'hit', al: 1, w: 0.6 })];
    var dieA = withDie(F, blinker({}), 20, 24, { lw: 1.4 });
    addV('enemy_blinker', 20, 24, F, { lw: 1.4 }, { idle: { f: [0, 1], fps: 5 }, fade: { f: [2, 3], fps: 10 }, slash: { f: [4, 5, 0], fps: 12 }, die: dieA });
  })();

  // =================================================================== ASCUA (scorcher) 28x16
  function scorcher(o) {
    return function (v) {
      var mode = o.mode, ph = o.ph || 0, amp = o.amp == null ? 1 : o.amp, i, n = 9, pts = [], hx, hy;
      if (mode === 'coil') {
        for (i = 0; i < 10; i++) { var a = 2.4 + i * 0.85, rr = 5.6 - i * 0.38; pts.push([11 + Math.cos(a) * rr, 10.4 + Math.sin(a) * rr * 0.8, 1.5 + i * 0.22]); }
        hx = 20; hy = 5.2;
      } else if (mode === 'dash') {
        for (i = 0; i < n; i++) { var t = i / (n - 1); pts.push([2 + t * 19.5, 9.6 + Math.sin(ph + t * 4) * 0.4, 1.1 + t * 1.5]); }
        hx = 24.6; hy = 9.4;
      } else if (mode === 'rec') {
        for (i = 0; i < n; i++) { var t2 = i / (n - 1); pts.push([3 + t2 * 17, 11.6 + Math.sin(ph + t2 * 5) * 0.5, 1.3 + t2 * 2.1]); }
        hx = 23.4; hy = 11;
      } else {
        for (i = 0; i < n; i++) { var t3 = i / (n - 1); pts.push([3 + t3 * 17, 10.6 + Math.sin(ph + t3 * 5.2) * amp * (0.5 + t3 * 0.8), 1.2 + t3 * 2.2]); }
        hx = 23.4; hy = pts[n - 1][1] - 0.8;
      }
      // patitas
      if (mode !== 'coil' && mode !== 'dash') [[0.38, 1], [0.78, 1]].forEach(function (s) { var p = pts[Math.round(s[0] * (n - 1))]; v.part(Prr(p[0] - 1, p[1] + p[2] - 1, 2.2, 2.6, 0.8), '#8a3414', { lw: 0.9, sh: '#5a200c', so: 0.3 }); });
      v.cluster(pts.map(function (p) { return Pcirc(p[0], p[1], p[2]); }), '#c8501c', { lw: 1.4, sh: '#8a2c10', hi: '#f08040', so: 0.8 });
      pts.forEach(function (p, k) {
        if (mode !== 'coil') v.flat(Pcirc(p[0], p[1] + p[2] * 0.45, p[2] * 0.5), '#ffd23a');
        if (k % 2 && k > 1) v.line(p[0] - 0.7, p[1] - p[2] * 0.7, p[0] + 0.5, p[1] - p[2] * 0.05, 0.5, '#ffd23a');
      });
      // cabeza
      var ope = o.open;
      v.part(Pblob(hx, hy, 4.1, 3, 111, 0.03), '#d8581e', { lw: 1.4, sh: '#8a2c10', hi: '#f89050', so: 0.7 });
      v.part(Ppoly([[hx - 2, hy - 2.6], [hx - 3.6, hy - 5], [hx - 0.4, hy - 3]]), '#7a1e0c', { lw: 0.8, so: 0.2 });
      v.part(Pblob(hx + 2.3, hy + 0.9, 2.2, 1.5, 112), '#ffd23a', { lw: 0.9, sh: '#c8901c', so: 0.3 });
      if (ope) { v.part(Pblob(hx + 2.4, hy + 1.6, 2.1, 1.4, 113), '#4a0e18', { lw: 0.5 }); v.dot(hx + 1.3, hy + 0.8, 0.4, '#fff'); v.dot(hx + 3.4, hy + 0.9, 0.4, '#fff'); v.line(hx + 4.2, hy + 2.4, hx + 6, hy + 3.2, 0.7, '#ff4a2a'); }
      else v.line(hx + 0.8, hy + 1.6, hx + 4, hy + 1.2, 0.5, OLC);
      v.eye(hx + 0.5, hy - 1, 1.15, { white: '#ffe45a', lx: 0.8, pr: 0.5, lw: 0.3, sh: false, pc: '#7a1010' });
      if (mode === 'coil') { // humo
        [[5, 2.4, 1.6], [8, 1, 1.3], [3, 5.2, 1.2]].forEach(function (s) { v.ctx.globalAlpha = 0.8; v.part(Pcirc(s[0], s[1], s[2]), '#8a8098', { lw: 0.8, sh: '#5a5068', so: 0.3 }); v.ctx.globalAlpha = 1; });
      }
      if (mode === 'dash') { v.line(0.2, 5.6, 3.4, 5.6, 0.7, 'rgba(255,220,150,0.95)'); v.line(0.2, 9.6, 2.4, 9.6, 0.7, 'rgba(255,220,150,0.8)'); v.line(0.6, 13.2, 3.6, 13.2, 0.7, 'rgba(255,220,150,0.9)'); }
      if (o.embers) { v.dot(1.2, 13.6, 0.5, '#ff8a2a'); v.dot(3.4, 14.4, 0.45, '#ffc83d'); }
      if (mode === 'rec') { v.dot(hx + 4, hy - 3.6, 0.5, '#8a8098'); v.dot(hx + 5.2, hy - 5, 0.6, '#8a8098'); }
    };
  }
  (function () {
    var F = [scorcher({ ph: 0, embers: true }), scorcher({ ph: 1.2, amp: 1.3 })], k;
    for (k = 0; k < 4; k++) F.push(scorcher({ ph: PH[WK[k]] * 1.0 + k, amp: 1.5, embers: k % 2 === 0 }));
    F.push(scorcher({ mode: 'coil' }), scorcher({ mode: 'dash', ph: 0.5, embers: true }), scorcher({ mode: 'rec', open: true }));
    var dieA = withDie(F, scorcher({ ph: 0 }), 28, 16, { lw: 1.4 });
    addV('enemy_scorcher', 28, 16, F, { lw: 1.4 }, { idle: { f: [0, 1], fps: 4 }, walk: { f: WALKSEQ, fps: 9 }, charge: { f: [6, 7], fps: 10 }, rec: { f: [8], fps: 1 }, die: dieA });
  })();

  // =================================================================== MADRE COLMENA (mini_hive) 32x32
  function hex(cx, cy, r) { var p = [], i; for (i = 0; i < 6; i++) p.push([cx + Math.cos(i * Math.PI / 3 + 0.52) * r, cy + Math.sin(i * Math.PI / 3 + 0.52) * r]); return Ppoly(p); }
  function hive(o) {
    return function (v) {
      var x = v.ctx, by = o.by || 0, sw = o.sw || 1, wf = o.wf == null ? 0.4 : o.wf, glow = o.glow || 0, i;
      // alas
      x.globalAlpha = 0.7;
      v.part(Pclosed([[17, 12 + by], [14, 12 - 9 * wf + by - 2], [8.4, 10 - 9 * wf + by], [10, 13 - 4 * wf + by], [14, 14 + by]]), '#ecdcff', { lw: 1.2, sh: '#b898e0', hi: '#fff', so: 0.8 });
      v.part(Pclosed([[21, 12 + by], [20, 12 - 8 * wf + by - 2], [14.8, 9 - 8.4 * wf + by], [15.4, 12 - 3.6 * wf + by], [18, 14 + by]]), '#f4eaff', { lw: 1.2, sh: '#c8aaee', hi: '#fff', so: 0.8 });
      x.globalAlpha = 1;
      // patitas
      [[16, 1], [20, 0], [24, 0.6]].forEach(function (s) { v.part(Prr(s[0] - 1, 21.4 + by - s[1], 2, 3.2, 0.8), '#4a1e72', { lw: 0.9, sh: '#2a0e48', so: 0.2 }); });
      // abdomen
      x.save(); x.translate(10.4, 19.6 + by); x.scale(sw, sw); x.translate(-10.4, -19.6 - by);
      v.part(Pblob(10.4, 19.6 + by, 9.2, 8.2, 121, 0.03, 12), glow ? '#9a4ac8' : '#7a3aa8', { lw: 1.9, sh: '#4a1e72', hi: '#b878e0', so: 1.3 });
      [[7, 17], [12.4, 16], [10, 21], [15.2, 20.4], [5.6, 22], [12.6, 24]].forEach(function (c, k) {
        var r = 2.1 + (glow ? 0.4 : 0);
        v.part(hex(c[0], c[1] + by, r), glow ? '#ffd860' : '#ffb73a', { lw: 0.8, sh: '#c87a1a', hi: '#fff0a0', so: 0.4 });
        v.dot(c[0] - 0.2, c[1] + by - 0.2, 0.75 + (glow ? 0.35 : 0) + (k % 2) * 0.1, glow ? '#ffffff' : '#fff0a0');
      });
      x.restore();
      if (o.burst) { // grietas y celdas saliendo
        v.line(5, 15, 9, 19, 0.8, '#1b1124'); v.line(14, 14, 11, 19, 0.8, '#1b1124'); v.line(8, 26, 12, 22, 0.8, '#1b1124');
        [[2, 12, 1.5], [18, 21, 1.3], [3, 25, 1.2], [1, 18, 1]].forEach(function (c) { v.part(hex(c[0], c[1], c[2]), '#ffd860', { lw: 0.6, sh: '#c87a1a', so: 0.2 }); });
      }
      if (o.acid) { // goteo acido
        [[7, 27, 1.5], [12.4, 28, 1.1], [16, 26.6, 1.3]].forEach(function (d) {
          v.part(Pclosed([[d[0], d[1] - d[2] * 1.7], [d[0] + d[2], d[1]], [d[0], d[1] + d[2]], [d[0] - d[2], d[1]]]), '#9bff4a', { lw: 0.7, ol: '#1a5a1a', sh: '#4aa82a', hi: '#e0ffb0', so: 0.3 });
        });
        v.part(Pblob(10.4, 26.2 + by, 5.6, 1.2, 122), '#9bff4a', { lw: 0, sh: '#4aa82a', so: 0.2 });
      }
      // torax
      v.part(Pblob(19.4, 17.4 + by, 5.8, 5.4, 123, 0.03), '#7a3aa8', { lw: 1.6, sh: '#4a1e72', hi: '#b878e0', so: 0.9 });
      v.part(Prr(18, 12.2 + by, 2.6, 10.4, 1), '#ffb73a', { lw: 0.8, sh: '#c87a1a', hi: '#ffe08a', so: 0.4 });
      // cabeza
      v.stick([[26, 10.6 + by], [26.6, 8 + by], [28.4, 6.6 + by]], 0.7, '#4a1e72', { lw: 0.7 }); v.dot(28.5, 6.5 + by, 0.9, '#ffe45a');
      v.stick([[24, 10.8 + by], [23.4, 8 + by], [21.8, 6.8 + by]], 0.7, '#4a1e72', { lw: 0.7 }); v.dot(21.7, 6.7 + by, 0.9, '#ffe45a');
      v.part(Pblob(25.6, 15.8 + by, 5.1, 4.8, 124, 0.03), '#ffb73a', { lw: 1.6, sh: '#c87a1a', hi: '#ffe08a', so: 0.9 });
      v.eye(24.4, 14.6 + by, 1.9, { lx: 0.8, pr: 0.5, lw: 0.4, sh: false }); v.eye(28.4, 14.6 + by, 1.7, { lx: 0.8, pr: 0.5, lw: 0.4, sh: false });
      if (o.spit) {
        v.part(Pblob(28, 19 + by, 2.5, 2.1, 125), '#4a0e18', { lw: 0.6 });
        v.part(Pblob(30.4, 20.6 + by, 1.7, 1.5, 126), '#9a58e0', { lw: 0.9, sh: '#6230a8', hi: '#c394f5', so: 0.3 }); v.dot(30.8, 20.2 + by, 0.35, '#fff');
      } else { v.line(26, 18.6 + by, 29.2, 18.4 + by, 0.7, OLC); v.line(28.6, 18.4 + by, 29.8, 19.8 + by, 0.7, OLC); }
    };
  }
  (function () {
    var F = [hive({}), hive({ by: 1, wf: -0.2 })], k;
    for (k = 0; k < 4; k++) F.push(hive({ by: [-1, 0, -1, 0][k], wf: [0.9, 0.2, 0.9, 0.2][k] }));
    F.push(hive({ spit: true, by: 0 }), hive({ acid: true, by: -1, wf: 0.6 }), hive({ sw: 1.16, glow: 1, by: -1 }), hive({ sw: 1.26, glow: 1, burst: true, by: -1, wf: 1 }));
    var dieA = withDie(F, hive({}), 32, 32, { lw: 1.4 });
    addV('enemy_mini_hive', 32, 32, F, { lw: 1.4 }, {
      idle: { f: [0, 1], fps: 3 }, float: { f: WALKSEQ, fps: 7 }, spit: { f: [6], fps: 1 }, acid: { f: [7], fps: 1 }, swell: { f: [8, 9], fps: 8 }, die: dieA
    });
  })();

  // =================================================================== PROYECTILES / VFX
  addV('proj_thorn_small', 8, 4, [0, 1].map(function (k) {
    return function (v) {
      v.part(Ppoly([[0.4, 0.6], [5.6, 2], [0.4, 3.4], [1.4, 2]]), '#f4e8c8', { lw: 0.6, sh: '#c9b78e', so: 0.2 });
      v.part(Ppoly([[4.2, 0.9], [7.6, 2], [4.2, 3.1]]), k ? '#ffc04a' : '#ff9a2a', { lw: 0.5, sh: '#c8501c', so: 0.15 });
    };
  }), { lw: 0.6 }, { loop: { f: [0, 1], fps: 10 } });

  addV('proj_frost_orb', 12, 12, [0, 1].map(function (k) {
    return function (v) {
      var i, a;
      for (i = 0; i < 4; i++) { a = i * Math.PI / 2 + (k ? 0.78 : 0); v.part(Ppoly([[6 + Math.cos(a - 0.35) * 3, 6 + Math.sin(a - 0.35) * 3], [6 + Math.cos(a) * 5.6, 6 + Math.sin(a) * 5.6], [6 + Math.cos(a + 0.35) * 3, 6 + Math.sin(a + 0.35) * 3]]), '#d8f4ff', { lw: 0.6, ol: '#1c4a98', so: 0.1 }); }
      v.part(Pblob(6, 6, 3.7, 3.7, 131 + k, 0.04, 10), '#7fd4ff', { lw: 0.9, ol: '#1c4a98', sh: '#3a88d8', hi: '#d8f4ff', so: 0.5 });
      v.dot(5.6, 5.6, 1.7, '#ffffff');
      v.dot(k ? 10.4 : 1.6, k ? 2 : 9.6, 0.5, '#e8f8ff'); v.dot(k ? 1.6 : 10.4, k ? 9.6 : 2.2, 0.4, '#bfe6ff');
    };
  }), { lw: 0.8 }, { loop: { f: [0, 1], fps: 8 } });

  addV('fx_spore_zone', 48, 48, [0, 1, 2].map(function (k) {
    return function (v) {
      var x = v.ctx, rr = rrand(150 + k), i, R = 22.5;
      if (k === 0) {
        x.fillStyle = 'rgba(155,255,74,0.10)'; x.beginPath(); x.arc(24, 24, R, 0, TAU); x.fill();
        x.strokeStyle = 'rgba(26,90,26,0.8)'; x.lineWidth = 2.2; x.setLineDash([2.6, 2.6]); x.beginPath(); x.arc(24, 24, R, 0, TAU); x.stroke();
        x.strokeStyle = '#9bff4a'; x.lineWidth = 1.2; x.stroke(); x.setLineDash([]);
      } else {
        var g = x.createRadialGradient(24, 24, 3, 24, 24, R); g.addColorStop(0, 'rgba(155,255,74,0.30)'); g.addColorStop(0.7, 'rgba(100,220,50,0.42)'); g.addColorStop(1, 'rgba(60,170,40,0.55)');
        x.fillStyle = g; x.beginPath(); x.arc(24, 24, R, 0, TAU); x.fill();
        x.strokeStyle = 'rgba(26,90,26,0.9)'; x.lineWidth = 1.8; x.beginPath(); x.arc(24, 24, R, 0, TAU); x.stroke();
        x.strokeStyle = 'rgba(190,255,120,0.9)'; x.lineWidth = 0.8; x.beginPath(); x.arc(24, 24, R - 1.3, 0, TAU); x.stroke();
      }
      for (i = 0; i < 12; i++) {
        var a = rr() * TAU, d = rr() * (R - 4);
        v.part(Pcirc(24 + Math.cos(a) * d, 24 + Math.sin(a) * d, k ? 0.8 + rr() * 1.6 : 0.6 + rr() * 0.6), k ? '#c8ff80' : 'rgba(155,255,74,0.5)', { lw: k ? 0.5 : 0.3, ol: '#1a5a1a', sh: k ? '#6ae83a' : null, so: 0.2 });
      }
    };
  }), { lw: 0 }, { arm: { f: [0], fps: 1 }, active: { f: [1, 2], fps: 4 } });

  addV('fx_fire_cell', 22, 22, [0, 1, 2].map(function (k) {
    return function (v) {
      var x = v.ctx, g = x.createRadialGradient(11, 12, 1, 11, 12, 11); g.addColorStop(0, 'rgba(255,170,50,0.55)'); g.addColorStop(1, 'rgba(255,60,20,0.0)');
      x.fillStyle = g; x.fillRect(0, 0, 22, 22);
      function tongue(cx, h, w, ph) {
        var t = ph + k * 1.05, tip = Math.sin(t) * w * 0.3;
        return Pclosed([[cx - w / 2, 18], [cx - w * 0.5, 18 - h * 0.5], [cx + tip, 18 - h], [cx + w * 0.5, 18 - h * 0.5], [cx + w / 2, 18]]);
      }
      var cfg = [[6, 8 + (k === 1 ? 2 : 0), 5, 0], [11, 12 - (k === 1 ? 2 : 0), 6.4, 1.7], [16, 8 + (k === 2 ? 2 : 0), 5, 3.1]];
      cfg.forEach(function (c) { v.part(tongue(c[0], c[1], c[2], c[3]), '#ff4a1e', { lw: 1, ol: '#7a1424', sh: '#d02a1a', hi: '#ff8a2a', so: 0.4 }); });
      cfg.forEach(function (c) { v.flat(tongue(c[0], c[1] * 0.6, c[2] * 0.55, c[3]), '#ffb830'); });
      v.dot(11, 17, 1.1, '#fff3b0');
    };
  }), { lw: 0.9 }, { loop: { f: [0, 1, 2, 1], fps: 10 } });

  addV('fx_blink_ring', 24, 24, [0, 1].map(function (k) {
    return function (v) {
      var x = v.ctx, i;
      x.fillStyle = 'rgba(138,106,224,0.16)'; x.beginPath(); x.arc(12, 12, 10.4, 0, TAU); x.fill();
      x.strokeStyle = OLC; x.lineWidth = 2.6; x.beginPath(); x.arc(12, 12, 10.4, 0, TAU); x.stroke();
      x.strokeStyle = '#a888f0'; x.lineWidth = 1.5; x.setLineDash([3.4, 1.8]); x.lineDashOffset = k * 2.6; x.beginPath(); x.arc(12, 12, 10.4, 0, TAU); x.stroke(); x.setLineDash([]);
      x.strokeStyle = 'rgba(216,200,255,0.9)'; x.lineWidth = 0.7; x.beginPath(); x.arc(12, 12, 6.6, 0, TAU); x.stroke();
      for (i = 0; i < 4; i++) { var a = i * Math.PI / 2 + (k ? 0.4 : 0); v.part(Ppoly([[12 + Math.cos(a) * 4.2, 12 + Math.sin(a) * 4.2], [12 + Math.cos(a + 0.35) * 7.6, 12 + Math.sin(a + 0.35) * 7.6], [12 + Math.cos(a - 0.35) * 7.6, 12 + Math.sin(a - 0.35) * 7.6]]), '#c8a8ff', { lw: 0.5, sh: '#8a6ae0', so: 0.2 }); }
    };
  }), { lw: 0 }, { loop: { f: [0, 1], fps: 8 } });

  addV('fx_shield_spark', 12, 12, [function (v) {
    var P = [[6, 0.4], [7.2, 4.8], [11.6, 6], [7.2, 7.2], [6, 11.6], [4.8, 7.2], [0.4, 6], [4.8, 4.8]];
    v.part(Ppoly(P), '#ffffff', { lw: 0.8, ol: '#ff9a2a', so: 0.1 });
    v.dot(6, 6, 1.3, '#fff6d0');
    v.part(Ppoly([[9.6, 1.4], [10.4, 2.6], [9.2, 2.2]]), '#fff6d0', { lw: 0.3, ol: '#ff9a2a' }); v.part(Ppoly([[2, 9.6], [2.8, 10.6], [1.6, 10.4]]), '#fff6d0', { lw: 0.3, ol: '#ff9a2a' });
  }], { lw: 0.8 });

  addV('fx_freeze_ring', 20, 8, [0, 1].map(function (k) {
    return function (v) {
      var x = v.ctx, i;
      x.fillStyle = 'rgba(127,212,255,0.22)'; x.beginPath(); x.ellipse(10, 4, 8.6, 2.9, 0, 0, TAU); x.fill();
      x.strokeStyle = '#1c4a98'; x.lineWidth = 2; x.beginPath(); x.ellipse(10, 4, 8.6, 2.9, 0, 0, TAU); x.stroke();
      x.strokeStyle = '#a8e4ff'; x.lineWidth = 1; x.setLineDash([2.6, 1.6]); x.lineDashOffset = k * 2; x.stroke(); x.setLineDash([]);
      [[2.4, 3.4], [10, 0.8], [17.6, 3.4], [6, 6.8], [14, 6.8]].forEach(function (s, j) {
        if ((j + k) % 2) return; var cx = s[0], cy = s[1];
        v.part(Ppoly([[cx, cy - 1.8], [cx + 0.8, cy], [cx, cy + 0.9], [cx - 0.8, cy]]), '#e8f8ff', { lw: 0.4, ol: '#1c4a98', so: 0.1 });
      });
    };
  }), { lw: 0 }, { loop: { f: [0, 1], fps: 6 } });
})();
