/*!
 * assets_boss.js - Arte de los JEFES v4 (J1: Pastor Corrupto, centauro-carnero). Solo arte, sin logica.
 * Script clasico que EXTIENDE window.Assets; cargar tras assets.js (usa Assets._h) y tras assets_village.js.
 * Contrato (nombres, anclajes, estado de dibujo): games/card-swarm/ASSETS_API.md, seccion "Jefes v4 (J1)".
 * Estilo del juego: contorno grueso #1b1124, color plano + 1 sombra + 1 brillo, rasterizado x2, miran a la DERECHA.
 */
(function () {
  'use strict';
  var A = window.Assets, H = A && A._h;
  if (!H) { if (window.console) console.error('assets_boss: falta Assets._h (cargar tras assets.js)'); return; }
  var addV = H.addV, Pclosed = H.Pclosed, Ppoly = H.Ppoly, Pblob = H.Pblob, Prr = H.Prr, Pcirc = H.Pcirc, OLC = H.OLC;
  var TAU = Math.PI * 2;
  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  function lerp(a, b, u) { return a + (b - a) * u; }
  function ease(u) { u = clamp(u, 0, 1); return u * u * (3 - 2 * u); }
  function pr(i) { var s = Math.sin(i * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); }

  // ===================================================================== helpers de forma
  function catmull(pts, n) {
    var out = [], i, k, L = pts.length;
    for (i = 0; i < L - 1; i++) {
      var p0 = pts[Math.max(i - 1, 0)], p1 = pts[i], p2 = pts[i + 1], p3 = pts[Math.min(i + 2, L - 1)];
      for (k = 0; k < n; k++) {
        var u = k / n, u2 = u * u, u3 = u2 * u;
        out.push([0.5 * ((2 * p1[0]) + (-p0[0] + p2[0]) * u + (2 * p0[0] - 5 * p1[0] + 4 * p2[0] - p3[0]) * u2 + (-p0[0] + 3 * p1[0] - 3 * p2[0] + p3[0]) * u3),
          0.5 * ((2 * p1[1]) + (-p0[1] + p2[1]) * u + (2 * p0[1] - 5 * p1[1] + 4 * p2[1] - p3[1]) * u2 + (-p0[1] + 3 * p1[1] - 3 * p2[1] + p3[1]) * u3)]);
      }
    }
    out.push(pts[L - 1]); return out;
  }
  function taperPts(pts, w0, w1, n) {
    var c = catmull(pts, n || 6), Lf = [], Rt = [], i, N = c.length;
    for (i = 0; i < N; i++) {
      var a = c[Math.max(i - 1, 0)], b = c[Math.min(i + 1, N - 1)], dx = b[0] - a[0], dy = b[1] - a[1], d = Math.sqrt(dx * dx + dy * dy) || 1;
      var nx = -dy / d, ny = dx / d, w = lerp(w0, w1, i / (N - 1)) / 2;
      Lf.push([c[i][0] + nx * w, c[i][1] + ny * w]); Rt.push([c[i][0] - nx * w, c[i][1] - ny * w]);
    }
    return { c: c, poly: Ppoly(Lf.concat(Rt.reverse())) };
  }
  var LW = 2.2;

  // ===================================================================== PASTOR CORRUPTO: partes
  var PAL = {
    wool: '#383049', woolS: '#1e1828', woolH: '#5e5276', spike: '#8a3aa8', spikeS: '#5a2078', spikeH: '#c070e0',
    org: '#ff9a2a', orgH: '#ffd070', robe: '#6a1f2f', robeS: '#40111e', robeH: '#a03a4a',
    skin: '#d8c8b0', skinS: '#a89878', skinH: '#f4ead6', bone: '#e8dcc0', boneS: '#b4a47c', boneH: '#fff6e0',
    wood: '#6a4a30', woodS: '#40281a', woodH: '#9a7048', ash: '#7a6a88', ashS: '#4e4260', ashH: '#a898b8'
  };

  // ---- cuerpo (barril de carnero): 96x72 base -> 192x144
  function bodyDraw(f) {
    return function (v) {
      var x = v.ctx, br = f === 1 ? 1 : 0, cy = 43 - br * 0.6, ps = [], i;
      ps.push(Pblob(8, 37, 5.6, 5.2, 201));
      for (i = 0; i < 16; i++) { var a = i / 16 * TAU; ps.push(Pcirc(48 + Math.cos(a) * (37 + br * 0.5), cy + Math.sin(a) * (17.5 + br * 0.6), 8 + (i % 3) * 1.2)); }
      ps.push(Pblob(48, cy, 36, 18 + br * 0.5, 202, 0.02, 12));
      v.cluster(ps, PAL.wool, { lw: LW, sh: PAL.woolS, hi: PAL.woolH, so: 1.5 });
      // manta de silla granate bajo el torso
      v.part(Ppoly([[57, 24], [77, 22], [82, 33], [72, 40], [60, 36]]), PAL.robe, { lw: 1.3, sh: PAL.robeS, hi: PAL.robeH, so: 0.8 });
      v.line(60, 28, 78, 27, 0.7, '#3a1020');
      // cincha + hebilla
      v.part(Prr(52.4, 22, 3.6, 28, 1.2), '#3a2a22', { lw: 1, sh: '#241812', so: 0.5 });
      v.part(Prr(52, 34, 4.4, 5, 1), PAL.org, { lw: 0.8, sh: '#b4601a', so: 0.4 });
      // rizos de lana
      x.strokeStyle = PAL.woolH; x.lineWidth = 0.9; x.lineCap = 'round';
      for (i = 0; i < 16; i++) {
        var cxp = 12 + pr(i + 3) * 70, cyp = cy - 12 + pr(i + 40) * 28;
        if (cxp > 50 && cxp < 80 && cyp < 40) continue;
        x.beginPath(); x.arc(cxp, cyp, 2.1 + pr(i) * 1.4, 0.4, 4.4); x.stroke();
      }
      // venas de corrupcion moradas
      x.strokeStyle = PAL.spike; x.lineWidth = 0.9;
      [[14, 46, 20, 40, 27, 44], [32, 54, 38, 49, 45, 53], [64, 54, 70, 50, 77, 52]].forEach(function (q) {
        x.beginPath(); x.moveTo(q[0], q[1]); x.quadraticCurveTo(q[2], q[3], q[4], q[5]); x.stroke();
      });
      v.dot(27, 44, 0.8, PAL.spikeH); v.dot(45, 53, 0.8, PAL.spikeH); v.dot(77, 52, 0.8, PAL.spikeH);
      // penacho de la cola
      v.part(Ppoly([[6, 34], [0.5, 28], [3, 38], [0, 42], [7, 42]]), PAL.spike, { lw: 1.2, sh: PAL.spikeS, hi: PAL.spikeH, so: 0.5 });
    };
  }
  addV('boss_pastor_body', 96, 72, [bodyDraw(0), bodyDraw(1)], { lw: LW }, { idle: { f: [0, 1], fps: 1.6 } });

  // ---- patas de carnero: 20x36 base (hip en 10,5). frames 0-3 = lado cercano (ciclo de trote), 4-7 = lado lejano (mas oscuro)
  var LEGP = [[3, 7, 0], [0, 1, 0], [-3, -6, 0.5], [2, -1, 6]];
  function legDraw(k, far) {
    var p = LEGP[k];
    return function (v) {
      var c = far ? { w: '#262034', ws: '#140f1c', wh: '#3a3148', sh: '#322a42', hoof: '#8a7e62', hoofS: '#5e5440' }
        : { w: PAL.wool, ws: PAL.woolS, wh: PAL.woolH, sh: '#52476a', hoof: '#cdbf9a', hoofS: '#8a7e62' };
      var kx = 10 + p[0], fx = 10 + p[1], ly = 29 - p[2];
      var th = taperPts([[10, 4], [kx + 0.5, 15], [kx, 18]], 9.5, 7.2, 4);
      v.part(th.poly, c.w, { lw: 1.9, sh: c.ws, hi: c.wh, so: 1.1 });
      v.part(Pblob(kx, 17, 4.9, 4.6, 211 + k), c.w, { lw: 1.7, sh: c.ws, hi: c.wh, so: 0.9 });
      v.stick([[kx, 18], [fx - (kx - fx) * 0.1, ly - 5], [fx, ly]], 5, c.sh, { lw: 1.7, hi: c.wh });
      v.part(Ppoly([[fx - 3.2, ly - 0.5], [fx + 3.4, ly - 0.5], [fx + 4.2, ly + 4.4], [fx - 3.6, ly + 4.4]]), c.hoof, { lw: 1.5, sh: c.hoofS, so: 0.6 });
    };
  }
  (function () {
    var F = [], k;
    for (k = 0; k < 4; k++) F.push(legDraw(k, false));
    for (k = 0; k < 4; k++) F.push(legDraw(k, true));
    addV('boss_pastor_leg', 20, 36, F, { lw: LW }, { trot: { f: [0, 1, 2, 3], fps: 6 }, trot_far: { f: [4, 5, 6, 7], fps: 6 } });
  })();

  // ---- torso encapuchado: 48x56 base (cintura = centro-abajo 24,56)
  function torsoDraw(f) {
    return function (v) {
      var rot = f === 1 ? -0.14 : f === 2 ? 0.16 : 0, x = v.ctx;
      var bs = f === 1 ? 2.2 : 0;
      // pas de hombro
      v.part(Ppoly([[10, 18], [6 - bs * 0.4, 8 - bs], [15, 14]]), PAL.spike, { lw: 1.2, sh: PAL.spikeS, hi: PAL.spikeH, so: 0.5 });
      v.part(Ppoly([[18, 14], [17 - bs * 0.4, 3 - bs], [24, 12]]), PAL.spike, { lw: 1.2, sh: PAL.spikeS, hi: PAL.spikeH, so: 0.5 });
      v.part(Pblob(24, 47, 12.5, 11, 221, 0.03), PAL.robe, { lw: 1.9, sh: PAL.robeS, hi: PAL.robeH, so: 1.1 });
      v.part(Pblob(24, 31, 21, 16, 222, 0.03, 10, rot), PAL.robe, { lw: 2, sh: PAL.robeS, hi: PAL.robeH, so: 1.4 });
      // bandolera y parches corruptos
      v.line(10, 19, 37, 43, 3.4, '#241812'); v.line(10, 18.2, 37, 42.2, 2.2, '#4a3426');
      v.part(Pblob(14, 38, 4.2, 3, 223), PAL.spike, { lw: 0.9, sh: PAL.spikeS, hi: PAL.spikeH, so: 0.5 });
      v.dot(14.4, 38, 1, PAL.org);
      x.strokeStyle = PAL.spikeH; x.lineWidth = 0.7;
      x.beginPath(); x.moveTo(33, 24); x.quadraticCurveTo(37, 29, 34, 34); x.stroke();
      // cinturon con hebilla naranja
      v.part(Prr(11, 45.4, 26, 5.6, 1.6), PAL.wool, { lw: 1.4, sh: PAL.woolS, hi: PAL.woolH, so: 0.6 });
      v.part(Prr(21, 45.8, 6.4, 4.8, 1), PAL.org, { lw: 1, sh: '#b4601a', hi: PAL.orgH, so: 0.4 });
      // cuello de lana
      v.part(Pblob(24, 17, 11.5, 5.2, 224, 0.04), PAL.wool, { lw: 1.7, sh: PAL.woolS, hi: PAL.woolH, so: 0.9 });
    };
  }
  addV('boss_pastor_torso', 48, 56, [torsoDraw(0), torsoDraw(1), torsoDraw(2)], { lw: LW }, { idle: { f: [0], fps: 1 }, windup: { f: [1], fps: 1 }, strike: { f: [2], fps: 1 } });

  // ---- cabeza de carnero con capucha: 32x32 base (pivote del cuello en 16,28)
  function headDraw(f) {
    return function (v) {
      var x = v.ctx, jaw = f === 1 ? 2.6 : 0;
      v.part(Pblob(13, 17, 13.5, 13, 231, 0.03), PAL.robe, { lw: 2, sh: PAL.robeS, hi: PAL.robeH, so: 1.2 });
      v.part(Ppoly([[3, 12], [-0.5, 22], [5, 24]]), PAL.robe, { lw: 1.5, sh: PAL.robeS, so: 0.5 });
      v.part(Pblob(8, 15, 4.2, 2, 232, 0.04, 8, -0.4), PAL.skin, { lw: 1.4, sh: PAL.skinS, so: 0.5 });
      // mandibula
      if (f === 1) {
        v.part(Pblob(24, 24.5 + jaw * 0.4, 6.4, 3, 233, 0.03, 8, 0.15), PAL.skinS, { lw: 1.6, sh: '#6a5a44', so: 0.6 });
        v.part(Pblob(24, 21.2, 5.6, 3.2, 234, 0.03, 8), '#3a0e18', { lw: 0.5 });
      }
      v.part(Pblob(16, 15, 9.2, 9.2, 235, 0.03), PAL.skin, { lw: 1.9, sh: PAL.skinS, hi: PAL.skinH, so: 1.1 });
      v.part(Pblob(23, 19.2 - (f === 1 ? 1.2 : 0), 7.2, 5.4, 236, 0.03, 9, f === 1 ? -0.22 : 0), PAL.skin, { lw: 1.9, sh: PAL.skinS, hi: PAL.skinH, so: 1.1 });
      v.part(Pblob(28.8, 18 - (f === 1 ? 1.6 : 0), 2.6, 2.3, 237), '#3a2a30', { lw: 0.9, sh: '#241820', so: 0.3 });
      // cuencas de los ojos (el brillo es el sprite boss_pastor_eyes)
      if (f === 2) {
        v.line(14.4, 11.3, 20, 12.6, 1.2, OLC); v.line(9.4, 11.3, 13.2, 11.8, 1.1, OLC);
      } else {
        v.part(Pblob(18.6, 12.6, 2.9, 1.7, 238, 0.04, 8, 0.2), '#1b1124', { lw: 0.5 });
        v.part(Pblob(12.6, 12.2, 2.5, 1.6, 239, 0.04, 8, 0.1), '#1b1124', { lw: 0.5 });
      }
      v.line(9.6, 9.4, 15.4, 10.4, 0.9, '#6a5a44'); v.line(15.8, 10.2, 21.6, 11.2, 0.9, '#6a5a44');
      // boca
      if (f === 1) {
        [26, 28.6, 31].forEach(function (tx) { v.part(Ppoly([[tx - 1, 21.4], [tx, 23.8], [tx + 0.9, 21.4]]), '#fff6e0', { lw: 0.4 }); });
      } else if (f === 2) { v.line(21, 22.4, 24, 21.4, 0.8, OLC); v.line(24, 21.4, 28.6, 22.8, 0.8, OLC); }
      else v.line(21, 22, 28, 21.6, 0.8, OLC);
      // mechon de lana entre los cuernos
      v.part(Pblob(15, 5.6, 4.2, 2.8, 240), PAL.wool, { lw: 1.4, sh: PAL.woolS, hi: PAL.woolH, so: 0.6 });
    };
  }
  addV('boss_pastor_head', 32, 32, [headDraw(0), headDraw(1), headDraw(2)], { lw: LW }, { idle: { f: [0], fps: 1 }, roar: { f: [1], fps: 1 }, hurt: { f: [2], fps: 1 } });

  // ---- ojos: 12x6 base. 0 naranja (F1), 1 rojo (F2/furia), 2 blanco (F3/desesperado)
  function eyesDraw(f) {
    var cols = [['#ff9a2a', '#ffe08a'], ['#ff3b30', '#ffb0a0'], ['#ffffff', '#fff6c0']][f];
    return function (v) {
      v.part(Ppoly([[0.8, 4.2], [4.4, 1.2], [5.4, 3.8], [3.4, 5]]), cols[0], { lw: 0.5, ol: '#3a0e18', sh: null });
      v.part(Ppoly([[11.2, 3.6], [7.4, 0.8], [6.6, 3.6], [8.6, 4.8]]), cols[0], { lw: 0.5, ol: '#3a0e18', sh: null });
      v.dot(3.2, 3.5, 0.9, cols[1]); v.dot(8.6, 3.2, 0.9, cols[1]);
    };
  }
  addV('boss_pastor_eyes', 12, 6, [eyesDraw(0), eyesDraw(1), eyesDraw(2)], { lw: 0.5 }, { phase1: { f: [0], fps: 1 }, phase2: { f: [1], fps: 1 }, phase3: { f: [2], fps: 1 } });

  // ---- cuernos enroscados: 24x32 base. 0 entero, 1 roto. _l = lado lejano (mas oscuro), _r = lado cercano
  function hornDraw(far, broken) {
    return function (v) {
      var c = far ? { b: '#cbbf9f', s: '#8e8062', h: '#e8dcc0', r: '#7a6c50' } : { b: PAL.bone, s: PAL.boneS, h: PAL.boneH, r: '#9a8a62' }, x = v.ctx, i;
      if (broken) {
        v.part(Ppoly([[4.4, 31], [11.6, 31.4], [12, 24], [9.4, 19.4], [8, 25], [6.2, 21.4], [4.6, 25.6]]), c.b, { lw: 1.9, sh: c.s, hi: c.h, so: 0.9 });
        v.part(Ppoly([[7, 28], [10, 27.6], [9.4, 24], [8, 26.2]]), '#3a3040', { lw: 0, });
        v.line(8.2, 30, 7.4, 25.4, 0.6, '#5a4a38'); v.dot(9.4, 19.6, 0.6, PAL.org);
        return;
      }
      var tp = taperPts([[9, 31], [4.5, 21], [5.5, 10], [11, 4.5], [17.5, 5.5], [20.5, 11], [17.5, 16.5], [13.5, 14.5]], 7.6, 1.2, 6);
      v.part(tp.poly, c.b, { lw: 2, sh: c.s, hi: c.h, so: 1.1 });
      var cc = tp.c, N = cc.length;
      x.strokeStyle = c.r; x.lineWidth = 0.8;
      for (i = 1; i <= 5; i++) {
        var k = Math.floor(N * (0.1 + i * 0.14)), a = cc[k - 1], b = cc[Math.min(k + 1, N - 1)], dx = b[0] - a[0], dy = b[1] - a[1], d = Math.sqrt(dx * dx + dy * dy) || 1;
        var nx = -dy / d, ny = dx / d, w = lerp(7.6, 1.2, k / N) * 0.42;
        x.beginPath(); x.moveTo(cc[k][0] + nx * w, cc[k][1] + ny * w); x.lineTo(cc[k][0] - nx * w, cc[k][1] - ny * w); x.stroke();
      }
    };
  }
  addV('boss_pastor_horn_l', 24, 32, [hornDraw(true, false), hornDraw(true, true)], { lw: LW }, { whole: { f: [0], fps: 1 }, broken: { f: [1], fps: 1 } });
  addV('boss_pastor_horn_r', 24, 32, [hornDraw(false, false), hornDraw(false, true)], { lw: LW }, { whole: { f: [0], fps: 1 }, broken: { f: [1], fps: 1 } });

  // ---- cayado gigante con farol: 20x88 base (agarre en 10,50). 0-1 entero (brillo A/B del farol), 2 roto
  function staffDraw(f) {
    return function (v) {
      var x = v.ctx, i;
      if (f === 2) {
        v.stick([[10, 84], [10, 36]], 4.2, PAL.wood, { lw: 1.7, hi: PAL.woodH });
        v.part(Ppoly([[7, 40], [8, 29], [9.4, 36], [10.6, 26], [11.8, 35], [13, 30], [13.2, 40]]), PAL.wood, { lw: 1.4, sh: PAL.woodS, hi: PAL.woodH, so: 0.6 });
        v.dot(10.4, 27.4, 0.8, PAL.org); v.dot(12.6, 31.4, 0.6, PAL.orgH);
      } else {
        v.stick([[10, 26], [10, 84]], 4.2, PAL.wood, { lw: 1.7, hi: PAL.woodH });
        // gancho + farol
        v.stick([[10, 26], [10, 11], [13, 5.4], [16.6, 6.6]], 3.2, PAL.wood, { lw: 1.6, hi: PAL.woodH, curve: true });
        v.line(16.6, 7, 16.6, 9.4, 0.8, OLC);
        v.part(Prr(13, 9.4, 7, 9.2, 1.6), PAL.wool, { lw: 1.4, sh: PAL.woolS, so: 0.4 });
        v.part(Pblob(16.5, 14.2, 2.3, f ? 3.5 : 3, 251 + f), f ? PAL.orgH : PAL.org, { lw: 0.5, ol: '#7a3a10', sh: null });
        v.dot(16.3, 14.8, 1, '#fff6c0');
        v.part(Prr(12.4, 8.2, 8.2, 2, 0.8), PAL.spike, { lw: 0.9, sh: PAL.spikeS, so: 0.3 });
      }
      // empunadura de cuero + mechon morado
      v.part(Prr(6.4, 47, 7.2, 7, 1.4), PAL.wool, { lw: 1.3, sh: PAL.woolS, hi: PAL.woolH, so: 0.5 });
      v.part(Ppoly([[12, 49], [16, 47.4], [14.6, 52.4]]), PAL.spike, { lw: 0.9, sh: PAL.spikeS, so: 0.3 });
      // venas moradas brillantes en el palo
      x.strokeStyle = PAL.spikeH; x.lineWidth = 0.55;
      for (i = 0; i < 4; i++) { var yy = f === 2 ? 56 + i * 7 : 30 + i * 12 + (i > 1 ? 6 : 0); x.beginPath(); x.moveTo(9.2, yy); x.lineTo(10.6, yy + 3.6); x.stroke(); }
      // punta de hierro
      v.part(Ppoly([[8.4, 83], [10, 88], [11.6, 83]]), '#6a7388', { lw: 1.2, sh: '#40475a', hi: '#aab4cc', so: 0.4 });
    };
  }
  addV('boss_pastor_staff', 20, 88, [staffDraw(0), staffDraw(1), staffDraw(2)], { lw: LW }, { whole: { f: [0, 1], fps: 6 }, broken: { f: [2], fps: 1 } });

  // ---- brazo con manga y garra: 22x42 base (hombro en 11,6; mano en 11,34). 0 cercano, 1 lejano (oscuro), 2 puno
  function armDraw(f) {
    return function (v) {
      var far = f === 1, c = far ? { b: '#4a1626', s: '#2a0a14', h: '#6a1f2f', hb: '#5a4e68', hs: '#3a3048', hh: '#7a6a88' } : { b: PAL.robe, s: PAL.robeS, h: PAL.robeH, hb: PAL.ash, hs: PAL.ashS, hh: PAL.ashH };
      var tp = taperPts([[11, 5], [11.2, 17], [11.4, 28]], 11.6, 7.8, 4);
      v.part(tp.poly, c.b, { lw: 1.9, sh: c.s, hi: c.h, so: 1.1 });
      v.part(Pblob(11.4, 5.4, 6.6, 4.4, 261 + f), c.b, { lw: 1.7, sh: c.s, hi: c.h, so: 0.8 });
      v.part(Prr(7, 26.6, 8.8, 3.6, 1), PAL.wool, { lw: 1.2, sh: PAL.woolS, so: 0.4 });
      if (f === 2) {
        v.part(Pblob(11.4, 34, 5.8, 5.2, 264), c.hb, { lw: 1.8, sh: c.hs, hi: c.hh, so: 0.9 });
        v.line(8.4, 32, 8.4, 36, 0.7, c.hs); v.line(11.4, 31.4, 11.4, 36.4, 0.7, c.hs); v.line(14.4, 32, 14.4, 36, 0.7, c.hs);
      } else {
        v.part(Pblob(11.4, 33.6, 4.8, 4.6, 265), c.hb, { lw: 1.8, sh: c.hs, hi: c.hh, so: 0.9 });
        [[8, 37.6], [11.4, 38.8], [14.8, 37.6]].forEach(function (p) { v.part(Pcirc(p[0], p[1], 1.9), c.hb, { lw: 1.2, sh: c.hs, so: 0.3 }); });
      }
    };
  }
  addV('boss_pastor_arm', 22, 42, [armDraw(0), armDraw(1), armDraw(2)], { lw: LW }, { near: { f: [0], fps: 1 }, far: { f: [1], fps: 1 }, fist: { f: [2], fps: 1 } });

  // ---- vellon (manto de lana con puas draped sobre el lomo): 56x40 base (base-centro 28,40). 0 entero, 1 roto/brasas
  function fleeceDraw(broken) {
    return function (v) {
      var i, ps = [], x = v.ctx;
      var wc = broken ? '#17111c' : '#4c4262', ws = broken ? '#0c080f' : '#2e2640', wh = broken ? '#2e2436' : '#7a6a98';
      for (i = 0; i < 8; i++) {
        var x0 = 6 + i * 6, h = broken ? 3 + (i * 3 % 4) * 1.6 : 12 + ((i * 5) % 4) * 2.4;
        var cb = broken ? '#3a2440' : PAL.spike, cs = broken ? '#201028' : PAL.spikeS, ch = broken ? '#5a3a60' : PAL.spikeH;
        var poly = broken ? [[x0 - 2.8, 20], [x0 - 2.2, 20 - h], [x0 - 0.6, 20 - h * 0.7], [x0 + 0.8, 20 - h * 1.05], [x0 + 2.8, 20]]
          : [[x0 - 3, 20], [x0 - h * 0.3, 20 - h], [x0 + 3, 20]];
        v.part(Ppoly(poly), cb, { lw: 1.5, sh: cs, hi: ch, so: 0.7 });
      }
      // manto: dorso redondeado con borde inferior festoneado (cuelga por el costado)
      ps.push(Pblob(28, 25, 25, 8.4, 301, 0.03, 12));
      for (i = 0; i < 7; i++) ps.push(Pcirc(6 + i * 7.3, 30 + (i % 2) * 2.4, 5.6 + (i % 3) * 0.5));
      v.cluster(ps, wc, { lw: LW, sh: ws, hi: wh, so: 1.3 });
      x.strokeStyle = wh; x.lineWidth = 0.8;
      for (i = 0; i < 9; i++) { x.beginPath(); x.arc(8 + pr(i + 70) * 40, 24 + pr(i + 90) * 9, 1.8 + pr(i) * 1.2, 0.4, 4.4); x.stroke(); }
      if (broken) {
        x.strokeStyle = PAL.org; x.lineWidth = 0.8;
        [[10, 28, 15, 25], [22, 31, 27, 27.5], [36, 28, 41, 31], [44, 25, 48, 27]].forEach(function (q) { x.beginPath(); x.moveTo(q[0], q[1]); x.lineTo(q[2], q[3]); x.stroke(); });
        [[14, 26.4], [25, 29.6], [39, 29], [30, 24], [47, 26.4]].forEach(function (p, k) { v.dot(p[0], p[1], 0.9, k % 2 ? PAL.orgH : PAL.org); });
      }
    };
  }
  addV('boss_pastor_fleece', 56, 40, [fleeceDraw(false), fleeceDraw(true)], { lw: LW }, { whole: { f: [0], fps: 1 }, broken: { f: [1], fps: 1 } });

  // ---- retrato para la barra de vida / intro: 48x48 base = 96x96. 0 neutro, 1 furia, 2 herido
  function portraitDraw(f) {
    return function (v) {
      var x = v.ctx, red = f === 1;
      v.part(Prr(1.4, 1.4, 45.2, 45.2, 6), red ? '#3a0f18' : '#241830', { lw: 2, ol: OLC, sh: red ? '#240810' : '#160f20', so: 1.4 });
      x.save(); x.beginPath(); Prr(2.4, 2.4, 43.2, 43.2, 5)(x); x.clip();
      var g = x.createRadialGradient(24, 22, 2, 24, 22, 30);
      g.addColorStop(0, red ? 'rgba(255,70,40,0.55)' : 'rgba(255,154,42,0.38)'); g.addColorStop(1, 'rgba(0,0,0,0)');
      x.fillStyle = g; x.fillRect(0, 0, 48, 48);
      // hombros / capucha / lana
      v.part(Pblob(24, 48, 25, 11, 271), PAL.robe, { lw: 1.8, sh: PAL.robeS, hi: PAL.robeH, so: 1 });
      v.part(Pblob(24, 41, 13, 5, 272), PAL.wool, { lw: 1.6, sh: PAL.woolS, hi: PAL.woolH, so: 0.8 });
      // cabeza + cuernos (reutiliza las partes de cuerpo completo)
      x.save(); x.translate(24 - 16 * 0.9, 48 - 28 * 0.9); x.scale(0.9, 0.9);
      x.save(); x.translate(6.5 - 8 * 0.72, 6 - 30 * 0.72); x.scale(0.72, 0.72); hornDraw(true, false)(v); x.restore();
      headDraw(f === 2 ? 2 : (f === 1 ? 1 : 0))(v);
      x.save(); x.translate(13 - 8 * 0.72, 6 - 30 * 0.72); x.scale(0.72, 0.72); hornDraw(false, f === 2)(v); x.restore();
      if (f !== 2) { x.save(); x.translate(10, 8.5); eyesDraw(f === 1 ? 1 : 0)(v); x.restore(); }
      x.restore();
      x.restore();
      if (f === 2) { // grieta + parpadeo blanco
        x.strokeStyle = '#fff6e0'; x.lineWidth = 0.9; x.beginPath(); x.moveTo(30, 4); x.lineTo(27, 12); x.lineTo(31, 19); x.lineTo(28, 27); x.stroke();
        x.strokeStyle = OLC; x.lineWidth = 0.5; x.beginPath(); x.moveTo(30.6, 4); x.lineTo(27.6, 12); x.lineTo(31.6, 19); x.lineTo(28.6, 27); x.stroke();
      }
      v.part(Prr(1.4, 1.4, 45.2, 45.2, 6), 'rgba(0,0,0,0)', { lw: 2, ol: OLC });
      x.strokeStyle = red ? '#ff6a5a' : '#c8a050'; x.lineWidth = 0.9; x.beginPath(); Prr(3.2, 3.2, 41.6, 41.6, 4.4)(x); x.stroke();
    };
  }
  addV('boss_pastor_portrait', 48, 48, [portraitDraw(0), portraitDraw(1), portraitDraw(2)], { lw: LW }, { neutral: { f: [0], fps: 1 }, rage: { f: [1], fps: 1 }, hurt: { f: [2], fps: 1 } });

  // ===================================================================== VFX, PROYECTILES, ARENA, ICONOS
  // ---- puas del jefe: 16x8 base (apuntan a la derecha), 2 frames
  function thornDraw(f) {
    return function (v) {
      v.part(Ppoly([[1, 4], [5, 1.1], [14.4, 4], [5, 6.9]]), PAL.spike, { lw: 1.3, sh: PAL.spikeS, hi: PAL.spikeH, so: 0.6 });
      v.part(Ppoly([[10.6, 3], [14.4, 4], [10.6, 5]]), f ? PAL.orgH : PAL.org, { lw: 0, });
      v.dot(14, 4, f ? 1.1 : 0.7, f ? '#fff6c0' : PAL.orgH);
      if (f) { v.line(0.5, 2.6, 3.6, 3, 0.5, 'rgba(192,112,224,0.8)'); v.line(0.5, 5.4, 3.6, 5, 0.5, 'rgba(192,112,224,0.8)'); }
    };
  }
  addV('proj_boss_thorn', 16, 8, [thornDraw(0), thornDraw(1)], { lw: 1.4 }, { loop: { f: [0, 1], fps: 10 } });

  // ---- segmento de onda (para componer anillos): 64x16 base. 0 rojo/tierra (danio), 1 morado (extasis), 2 verde (esporas)
  function waveSegDraw(f) {
    var c = [['#ff5a3a', '#b02a1c', '#ffb08a', '#c8a47a'], ['#b05af0', '#6a2aa8', '#e0b0ff', '#8a6ab0'], ['#7be34a', '#3f8a28', '#d0ff9a', '#8aa86a']][f];
    return function (v) {
      var pts = [[0, 15]], i;
      for (i = 0; i <= 8; i++) pts.push([i * 8, i % 2 ? 6 : 1.5]);
      pts.push([64, 15]);
      v.part(Ppoly(pts), c[0], { lw: 1.6, sh: c[1], hi: c[2], so: 1.1 });
      v.line(2, 11, 62, 11, 1.2, c[2]);
      v.line(0, 14.4, 64, 14.4, 1.4, c[3]);
    };
  }
  addV('fx_shockwave_seg', 64, 16, [waveSegDraw(0), waveSegDraw(1), waveSegDraw(2)], { lw: 1.6 }, { red: { f: [0], fps: 1 }, purple: { f: [1], fps: 1 }, green: { f: [2], fps: 1 } });

  // ---- grieta del suelo: 48x48 base, 3 frames (crece)
  function crackDraw(f) {
    return function (v) {
      var n = 5 + f, i, x = v.ctx;
      for (i = 0; i < n; i++) {
        var a = i / n * TAU + 0.3, len = (8 + f * 5) * (0.7 + pr(i + 5) * 0.5), pts = [[24, 24]], k;
        for (k = 1; k <= 3; k++) pts.push([24 + Math.cos(a + (pr(i * 3 + k) - 0.5) * 0.7) * len * k / 3, 24 + Math.sin(a + (pr(i * 3 + k) - 0.5) * 0.7) * len * k / 3 * 0.8]);
        v.stick(pts, 2.4 - f * 0.1, '#120c1a', { lw: 0.6, ol: '#120c1a' });
        if (f > 0) { x.strokeStyle = f > 1 ? PAL.org : '#b45a20'; x.lineWidth = 0.7; x.beginPath(); x.moveTo(pts[0][0], pts[0][1]); for (k = 1; k < pts.length; k++) x.lineTo(pts[k][0], pts[k][1]); x.stroke(); }
      }
      v.dot(24, 24, 2 + f * 0.6, '#120c1a');
    };
  }
  addV('fx_boss_crack', 48, 48, [crackDraw(0), crackDraw(1), crackDraw(2)], { lw: 1 }, { grow: { f: [0, 1, 2], fps: 8, loop: false } });

  // ---- estallido al romper una parte: 64x64 base, 5 frames
  function breakDraw(f) {
    return function (v) {
      var x = v.ctx, i;
      if (f === 0) { v.part(Pblob(32, 32, 14, 14, 401), '#ffffff', { lw: 2, ol: '#ffd070', sh: '#ffe8b0', so: 1 }); return; }
      var rr = [0, 12, 22, 28, 31][f], al = [1, 1, 0.95, 0.7, 0.35][f];
      x.globalAlpha = al;
      if (f <= 2) { x.strokeStyle = '#fff6e0'; x.lineWidth = 3.4 - f; x.beginPath(); x.arc(32, 32, rr * 0.7, 0, TAU); x.stroke(); }
      for (i = 0; i < 9; i++) {
        var a = i / 9 * TAU + pr(i) * 0.5, d = rr * (0.55 + pr(i + 9) * 0.5), px = 32 + Math.cos(a) * d, py = 32 + Math.sin(a) * d * 0.9, s = (4.6 - f * 0.7) * (0.6 + pr(i + 20) * 0.6);
        if (f === 4) { v.dot(px, py, 1.4, 'rgba(200,184,150,0.6)'); continue; }
        v.part(Ppoly([[px - s, py - s * 0.4], [px + s * 0.2, py - s], [px + s, py + s * 0.5], [px - s * 0.3, py + s * 0.8]]), i % 3 ? PAL.bone : PAL.org, { lw: 1.2, sh: i % 3 ? PAL.boneS : '#b4601a', so: 0.5 });
      }
      if (f >= 2) { x.fillStyle = 'rgba(190,175,150,' + (0.5 - f * 0.1) + ')'; for (i = 0; i < 6; i++) { x.beginPath(); x.arc(32 + Math.cos(i * 1.1) * rr * 0.9, 32 + Math.sin(i * 1.1) * rr * 0.8, 4 + f, 0, TAU); x.fill(); } }
      x.globalAlpha = 1;
    };
  }
  addV('fx_part_break', 64, 64, [breakDraw(0), breakDraw(1), breakDraw(2), breakDraw(3), breakDraw(4)], { lw: 1.4 }, { burst: { f: [0, 1, 2, 3, 4], fps: 14, loop: false } });

  // ---- aro dorado de ventana de dano: 64x64 base, 4 frames
  function windowRingDraw(f) {
    return function (v) {
      var x = v.ctx, i;
      x.strokeStyle = OLC; x.lineWidth = 5.4; x.beginPath(); x.ellipse(32, 32, 27, 27, 0, 0, TAU); x.stroke();
      x.strokeStyle = '#ffd23a'; x.lineWidth = 3.2; x.beginPath(); x.ellipse(32, 32, 27, 27, 0, 0, TAU); x.stroke();
      x.strokeStyle = '#fff6c0'; x.lineWidth = 1.2; x.beginPath(); x.ellipse(32, 32, 27.8, 27.8, 0, 3.6, 5.2); x.stroke();
      for (i = 0; i < 4; i++) {
        var a = f * 0.4 + i * TAU / 4, px = 32 + Math.cos(a) * 27, py = 32 + Math.sin(a) * 27, s = 3.4 + (i + f) % 2;
        v.part(Ppoly([[px, py - s], [px + s * 0.35, py - s * 0.35], [px + s, py], [px + s * 0.35, py + s * 0.35], [px, py + s], [px - s * 0.35, py + s * 0.35], [px - s, py], [px - s * 0.35, py - s * 0.35]]), '#fff6c0', { lw: 0.8, ol: '#c8901c', sh: null });
      }
    };
  }
  addV('fx_window_ring', 64, 64, [windowRingDraw(0), windowRingDraw(1), windowRingDraw(2), windowRingDraw(3)], { lw: 1 }, { loop: { f: [0, 1, 2, 3], fps: 8 } });

  // ---- estaca / espina de suelo que emerge: 14x22 base (ancla: base-centro 7,21). 4 frames: brota, completa, completa+temblor, se hunde
  function spikeDraw(f) {
    var h = [5, 13, 19, 9][f];
    return function (v) {
      v.part(Pblob(7, 20, 6.2, 2.4, 411), '#3a2c3a', { lw: 1.4, sh: '#241a26', so: 0.6 });
      v.part(Ppoly([[7 - 3.6, 20], [7 + (f === 2 ? 0.6 : 0), 20 - h], [7 + 3.6, 20]]), PAL.spike, { lw: 1.6, sh: PAL.spikeS, hi: PAL.spikeH, so: 0.9 });
      if (h > 10) v.dot(7 + (f === 2 ? 0.6 : 0), 20 - h + 2.4, 0.8, PAL.orgH);
    };
  }
  addV('fx_boss_spike', 14, 22, [spikeDraw(0), spikeDraw(1), spikeDraw(2), spikeDraw(3)], { lw: 1.6 }, { rise: { f: [0, 1, 2], fps: 12, loop: false }, sink: { f: [3, 0], fps: 10, loop: false } });

  // ---- rastro de carga (polvo): 48x28 base, 4 frames. Se coloca centrado detras del jefe; mira a la derecha
  function trailDraw(f) {
    return function (v) {
      var x = v.ctx, i, a = [0.95, 0.8, 0.55, 0.3][f], sz = [1, 1.25, 1.5, 1.7][f];
      x.globalAlpha = a;
      for (i = 0; i < 4; i++) {
        var px = 40 - i * 9 - f * 2.5, py = 18 - (i % 2) * 3.4 - f * 1.4, r = (4.6 - i * 0.5) * sz;
        v.part(Pblob(px, py, r * 1.3, r, 421 + i), '#c8b8a0', { lw: 1.3, sh: '#8a7a68', hi: '#efe6d6', so: 0.8 });
      }
      v.line(2, 22, 22 - f * 3, 22, 1.2, '#efe6d6'); v.line(6, 13, 26 - f * 3, 13, 1, '#efe6d6');
      x.globalAlpha = 1;
    };
  }
  addV('fx_charge_trail', 48, 28, [trailDraw(0), trailDraw(1), trailDraw(2), trailDraw(3)], { lw: 1.3 }, { puff: { f: [0, 1, 2, 3], fps: 10, loop: false } });

  // ---- nube de esporas / vellon: 16x16 base, 4 frames (crece y se desvanece)
  function sporeDraw(f) {
    return function (v) {
      var x = v.ctx, r = [3.4, 5.4, 6.6, 7][f], i;
      x.globalAlpha = [1, 1, 0.8, 0.45][f];
      v.part(Pblob(8, 8, r, r * 0.9, 431 + f), '#7be34a', { lw: 1.4, ol: '#1c4a20', sh: '#3f8a28', hi: '#d0ff9a', so: 0.9 });
      for (i = 0; i < 4; i++) v.dot(8 + Math.cos(i * 1.7 + f) * r * 0.55, 8 + Math.sin(i * 1.7 + f) * r * 0.5, 0.7, '#e8ffc0');
      x.globalAlpha = 1;
    };
  }
  addV('fx_spore_puff', 16, 16, [sporeDraw(0), sporeDraw(1), sporeDraw(2), sporeDraw(3)], { lw: 1.4 }, { puff: { f: [0, 1, 2, 3], fps: 8, loop: false } });

  // ---- tronco de arena (obstaculo r28): 32x32 base = 64x64; ancla = centro del circulo de colision (32,40 finales). 0 entero, 1 agrietado, 2 escombro
  function logDraw(f) {
    return function (v) {
      var x = v.ctx, i;
      if (f === 2) {
        v.part(Pblob(16, 24, 12, 4.6, 441), '#2a2430', { lw: 1.4, sh: '#18131e', so: 0.5, ol: OLC });
        [[8, 22, 6], [19, 24, 7], [14, 18, 5], [24, 20, 5]].forEach(function (p, k) {
          v.part(Ppoly([[p[0] - p[2] * 0.5, p[1]], [p[0], p[1] - p[2] * 0.8], [p[0] + p[2] * 0.5, p[1] - 1], [p[0] + p[2] * 0.4, p[1] + 2.4], [p[0] - p[2] * 0.3, p[1] + 2.8]]), k % 2 ? PAL.wood : '#8a6440', { lw: 1.5, sh: PAL.woodS, hi: PAL.woodH, so: 0.6 });
        });
        v.dot(11, 19, 0.6, PAL.org);
        return;
      }
      v.part(Pblob(16, 26.4, 13, 4.6, 442), '#18131e', { lw: 0, }); // sombra de apoyo
      v.part(Prr(4.2, 13.4, 23.6, 13.2, 3.2), PAL.wood, { lw: LW, sh: PAL.woodS, hi: PAL.woodH, so: 1.2 });
      for (i = 0; i < 4; i++) v.line(7 + i * 5.4, 15, 7.6 + i * 5.4, 25, 0.8, PAL.woodS);
      v.part(Pblob(16, 13.4, 11.8, 6.4, 443), '#c8a070', { lw: LW, sh: '#9a7448', hi: '#e8c898', so: 1 });
      x.strokeStyle = '#8a6440'; x.lineWidth = 0.8;
      for (i = 1; i <= 3; i++) { x.beginPath(); x.ellipse(16, 13.4, i * 3.2, i * 1.7, 0, 0, TAU); x.stroke(); }
      v.dot(16, 13.4, 0.7, '#6a4a30');
      // musgo y brotes corruptos
      v.part(Pblob(7.4, 24.6, 3.6, 1.6, 444), '#4a6a3a', { lw: 0.8, sh: '#2c4a28', so: 0.3 });
      v.part(Ppoly([[24, 15.4], [26.4, 10.4], [25.6, 15.8]]), PAL.spike, { lw: 0.9, sh: PAL.spikeS, so: 0.3 });
      if (f === 1) {
        x.strokeStyle = OLC; x.lineWidth = 1.1; x.beginPath(); x.moveTo(20, 9.8); x.lineTo(17.6, 14); x.lineTo(19.6, 17.8); x.lineTo(17.4, 25.6); x.stroke();
        x.strokeStyle = PAL.org; x.lineWidth = 0.5; x.beginPath(); x.moveTo(20, 9.8); x.lineTo(17.6, 14); x.lineTo(19.6, 17.8); x.lineTo(17.4, 25.6); x.stroke();
        v.part(Ppoly([[6, 14], [9.6, 12.4], [8, 18]]), '#9a7448', { lw: 0.9, sh: PAL.woodS, so: 0.3 });
      }
    };
  }
  addV('obs_log', 32, 32, [logDraw(0), logDraw(1), logDraw(2)], { lw: LW }, { whole: { f: [0], fps: 1 }, cracked: { f: [1], fps: 1 }, rubble: { f: [2], fps: 1 } });

  // ---- zarzal de espinas de borde (zona verde lenta, F2): 40x28 base = 80x56; centrado en (40,38 finales). 3 frames (balanceo)
  function patchDraw(f) {
    return function (v) {
      var x = v.ctx, i;
      v.part(Pblob(20, 21, 17.4, 5.6, 451), 'rgba(40,64,36,0.9)', { lw: 1.2, sh: 'rgba(24,40,24,0.9)', so: 0.6 });
      for (i = 0; i < 7; i++) {
        var bx = 6 + i * 4.6, sw = Math.sin(f * 2.1 + i) * 1.4, h = 10 + (i * 7 % 5) * 2.2, pts = [[bx, 22], [bx + sw - 2, 22 - h * 0.5], [bx + sw + 1.6 * (i % 2 ? 1 : -1), 22 - h]];
        v.stick(pts, 1.8, '#2c5a3a', { lw: 1.2, hi: '#58a060', curve: true });
        v.part(Ppoly([[pts[2][0] - 1.4, pts[2][1] + 1.4], [pts[2][0] + 0.2, pts[2][1] - 2.8], [pts[2][0] + 1.6, pts[2][1] + 1.6]]), '#d8e870', { lw: 0.8, sh: '#98a838', so: 0.3 });
        v.dot(bx + sw - 1.6, 22 - h * 0.5, 0.9, '#d8e870');
      }
      x.fillStyle = 'rgba(123,227,74,0.5)';
      for (i = 0; i < 3; i++) { x.beginPath(); x.arc(8 + i * 12 + f * 1.5, 7 + (i + f) % 2 * 3, 1, 0, TAU); x.fill(); }
    };
  }
  addV('fx_thorn_patch', 40, 28, [patchDraw(0), patchDraw(1), patchDraw(2)], { lw: 1.4 }, { sway: { f: [0, 1, 2, 1], fps: 3 } });

  // ---- iconos de trofeo / parte: 16x16 base = 32x32. frame 0 normal, 1 ROTO (gris con aspa roja, para la barra del jefe)
  function badge(v, broken) {
    v.part(Pcirc(8, 8, 7), broken ? '#2c2832' : '#2a2038', { lw: 1.5, ol: OLC, sh: broken ? '#1a1820' : '#18101f', so: 0.8 });
    v.ctx.strokeStyle = broken ? '#6a6272' : '#c8a050'; v.ctx.lineWidth = 0.7; v.ctx.beginPath(); v.ctx.arc(8, 8, 5.9, 0, TAU); v.ctx.stroke();
  }
  function cross(v) {
    v.ctx.strokeStyle = OLC; v.ctx.lineWidth = 3.2; v.ctx.beginPath(); v.ctx.moveTo(3, 3); v.ctx.lineTo(13, 13); v.ctx.moveTo(13, 3); v.ctx.lineTo(3, 13); v.ctx.stroke();
    v.ctx.strokeStyle = '#ff3b30'; v.ctx.lineWidth = 1.8; v.ctx.beginPath(); v.ctx.moveTo(3, 3); v.ctx.lineTo(13, 13); v.ctx.moveTo(13, 3); v.ctx.lineTo(3, 13); v.ctx.stroke();
  }
  function iconHorn(broken) {
    return function (v) {
      badge(v, broken); var x = v.ctx; x.save(); x.translate(3.6, 2.6); x.scale(0.34, 0.34);
      if (broken) x.globalAlpha = 0.45; hornDraw(false, false)(v); x.restore(); if (broken) cross(v);
    };
  }
  function iconStaff(broken) {
    return function (v) {
      badge(v, broken); var x = v.ctx; x.save(); x.globalAlpha = broken ? 0.45 : 1;
      v.stick([[11.2, 3.6], [5.2, 12.6]], 1.6, PAL.wood, { lw: 0.8, hi: PAL.woodH });
      v.part(Prr(10.4, 3.4, 3, 3.6, 0.6), PAL.wool, { lw: 0.7, so: 0.2 }); v.dot(11.9, 5.2, 0.9, broken ? '#8a7a68' : PAL.orgH);
      x.restore(); if (broken) cross(v);
    };
  }
  function iconFleece(broken) {
    return function (v) {
      badge(v, broken); var x = v.ctx; x.save(); x.globalAlpha = broken ? 0.45 : 1;
      [[5, 7], [8, 5.2], [11, 7]].forEach(function (p) { v.part(Ppoly([[p[0] - 1.5, 9], [p[0], p[1]], [p[0] + 1.5, 9]]), PAL.spike, { lw: 0.8, sh: PAL.spikeS, so: 0.3 }); });
      v.part(Pblob(8, 10.4, 4.6, 2.6, 461), PAL.wool, { lw: 1, sh: PAL.woolS, hi: PAL.woolH, so: 0.5 });
      x.restore(); if (broken) cross(v);
    };
  }
  addV('trophy_pastor_horn', 16, 16, [iconHorn(false), iconHorn(true)], { lw: 1 }, { ok: { f: [0], fps: 1 }, broken: { f: [1], fps: 1 } });
  addV('trophy_pastor_staff', 16, 16, [iconStaff(false), iconStaff(true)], { lw: 1 }, { ok: { f: [0], fps: 1 }, broken: { f: [1], fps: 1 } });
  addV('trophy_pastor_fleece', 16, 16, [iconFleece(false), iconFleece(true)], { lw: 1 }, { ok: { f: [0], fps: 1 }, broken: { f: [1], fps: 1 } });

  // ---- iconos de debilidad / resistencia: 12x12 base (flecha verde arriba / gris abajo)
  function arrowIcon(up) {
    return function (v) {
      var c = up ? ['#5ae27a', '#2a8a44', '#b8ffc8'] : ['#9a94a8', '#5e586c', '#d0cadc'], d = up ? 1 : -1, y0 = up ? 0 : 12;
      v.part(Ppoly([[6, y0 + d * 1], [10.6, y0 + d * 6], [7.6, y0 + d * 6], [7.6, y0 + d * 11], [4.4, y0 + d * 11], [4.4, y0 + d * 6], [1.4, y0 + d * 6]]), c[0], { lw: 1.2, sh: c[1], hi: c[2], so: 0.5 });
    };
  }
  addV('icon_weak', 12, 12, [arrowIcon(true)], { lw: 1.2 });
  addV('icon_resist', 12, 12, [arrowIcon(false)], { lw: 1.2 });

  // ===================================================================== MATRICES 2D (jerarquia de partes)
  function mT(x, y) { return [1, 0, 0, 1, x, y]; }
  function mR(a) { var c = Math.cos(a), s = Math.sin(a); return [c, s, -s, c, 0, 0]; }
  function mS(x, y) { return [x, 0, 0, y, 0, 0]; }
  function mM(a, b) {
    return [a[0] * b[0] + a[2] * b[1], a[1] * b[0] + a[3] * b[1], a[0] * b[2] + a[2] * b[3], a[1] * b[2] + a[3] * b[3],
      a[0] * b[4] + a[2] * b[5] + a[4], a[1] * b[4] + a[3] * b[5] + a[5]];
  }
  function mP(m, x, y) { return { x: m[0] * x + m[2] * y + m[4], y: m[1] * x + m[3] * y + m[5] }; }
  function chain() { var m = arguments[0], i; for (i = 1; i < arguments.length; i++) m = mM(m, arguments[i]); return m; }

  // ===================================================================== PASTOR: pose (todo en espacio L: origen = suelo bajo el centro del cuerpo, +x = adelante, +y = abajo)
  var GY = 88;                     // el origen del suelo esta GY px por debajo de la posicion logica (x,y) de la entidad
  var NAMES = ['barrido', 'embestida', 'pisoton', 'salto', 'abanico', 'llamada', 'esporas', 'estampida', 'extasis'];
  var DEATH_MS = 3200;
  var HS = 0.78;                   // escala de dibujo de los cuernos

  function pose(s) {
    var t = s.t || 0, P = {
      bx: 0, by: 0, br: 0, bsy: 1, pvx: -55, pvy: -8, tr: 0, tf: 0, hr: 0, hx: 0, hy: 0, hf: 0,
      hand: [38, 4], farHand: [-12, -22], sr: 0, armF: 0, tuck: 0, tuckK: 1, crouch: 0, leg: 'walk', paw: 0,
      spikes: 0.25, fleeceK: 1, shake: 0, dust: 0, spore: 0, summon: 0, glow: 0.55, trail: 0, stars: 0, planted: 0, eyeRed: 0, gallop: 0
    };
    var mv = s.moving != null ? (s.moving === true ? 1 : +s.moving) : 0, speed = s.speed != null ? s.speed : mv * 80;
    P.speed = speed; P.moving = mv > 0.02 || speed > 4;
    var cyc = clamp(110000 / Math.max(speed, 1), 170, 2600);
    P.cyc = cyc; P.cu = (t / cyc) % 1;
    var W = s.windup, ST = s.strike;
    var wp = s.wp != null ? s.wp : ((t % 1100) / 1100), sp = s.sp != null ? s.sp : ((t % 480) / 480), u = ease(wp), q = ease(sp);
    if (s.desperate && !W && !ST) W = 'extasis';
    // reposo / marcha
    var bob = P.moving ? Math.abs(Math.sin(P.cu * TAU * 2)) : 0;
    P.by = P.moving ? -bob * 3.6 : Math.sin(t / 520) * 1.1;
    P.tr = P.moving ? Math.sin(P.cu * TAU * 2) * 0.03 : Math.sin(t / 700) * 0.012;
    P.hr = Math.sin(t / 900 + 1) * 0.03 + (P.moving ? Math.sin(P.cu * TAU * 2 + 1) * 0.04 : 0);
    P.sr = 0.04 + Math.sin(t / 800) * 0.02 + (P.moving ? Math.sin(P.cu * TAU * 2) * 0.07 : 0);
    P.hand = [38, 4 - (P.moving ? bob * 5 : 0)];
    if (P.moving) P.leg = 'walk'; else P.leg = 'idle';

    function A_(n) { return ST === n ? 'S' : (W === n && !ST ? 'W' : null); }
    var m;
    if ((m = A_('barrido'))) {
      if (m === 'W') { P.sr = lerp(0.04, -1.9, u); P.hand = [lerp(38, 18, u), lerp(4, -118, u)]; P.tr = -0.2 * u; P.bx = -4 * u; P.tf = 1; P.hr = -0.1 * u; P.armF = 0; P.leg = 'idle'; }
      else { P.sr = lerp(-1.9, 1.7, q); P.hand = [lerp(18, 60, q), lerp(-118, -2, q)]; P.tr = lerp(-0.2, 0.26, q); P.bx = lerp(-4, 12, q); P.tf = 2; P.hf = 1; P.leg = 'idle'; P.shake = q > 0.5 ? 1.2 : 0; }
    } else if ((m = A_('embestida')) || (m = A_('estampida'))) {
      var stamp = ST === 'estampida' || W === 'estampida';
      if (m === 'W') { P.br = 0.05 * u; P.tr = 0.35 * u; P.hr = 0.55 * u; P.bx = -8 * u; P.by = 3 * u + Math.sin(t / 60) * 0.8 * u; P.sr = 1.3 * u; P.hand = [lerp(38, 30, u), lerp(4, -14, u)]; P.leg = 'paw'; P.dust = u; P.eyeRed = u; P.tf = 1; P.shake = 0.8 * u; }
      else { P.br = 0.07; P.tr = 0.42; P.hr = 0.62; P.by = 4; P.sr = 1.45; P.hand = [34, -10]; P.leg = 'gallop'; P.trail = 1; P.eyeRed = 1; P.tf = 2; P.dust = 0.6; P.gallop = stamp ? 1.25 : 1; P.speed = Math.max(speed, 520); P.cyc = 215 / P.gallop; P.cu = (t / P.cyc) % 1; }
    } else if ((m = A_('pisoton'))) {
      if (m === 'W') { P.br = -0.3 * u; P.tr = -0.15 * u; P.hr = -0.2 * u; P.hand = [lerp(38, 40, u), lerp(4, -112, u)]; P.farHand = [lerp(-12, 4, u), lerp(-22, -108, u)]; P.sr = -0.6 * u; P.leg = 'rear'; P.tuck = u; P.tf = 1; P.by = -5 * u; P.shake = 0.6 * u; }
      else { P.br = lerp(-0.3, 0.03, Math.min(1, sp * 3)); P.by = sp < 0.35 ? lerp(-5, 8, sp / 0.35) : lerp(8, 0, (sp - 0.35) / 0.65); P.tr = 0.2 * (1 - sp); P.hr = 0.2; P.hand = [50, -30]; P.farHand = [10, -26]; P.sr = 0.5; P.leg = 'idle'; P.tf = 2; P.hf = 1; P.shake = sp < 0.5 ? 2 : 0; P.dust = sp < 0.7 ? 1 : 0; }
    } else if ((m = A_('salto'))) {
      var lift = s.lift || 0;
      if (m === 'W') { P.bsy = 1 - 0.14 * u; P.by = 10 * u; P.tr = 0.25 * u; P.hr = 0.2 * u; P.sr = 0.9 * u; P.hand = [34, lerp(4, -6, u)]; P.leg = 'idle'; P.crouch = u; P.tf = 1; P.eyeRed = 0.5 * u; }
      else { P.bsy = lerp(0.84, 1, q); P.by = lerp(12, 0, q); P.tr = lerp(0.3, 0, q); P.sr = lerp(0.1, 0.2, q); P.hand = [46, lerp(-100, 4, Math.min(1, q * 2.2))]; P.leg = 'idle'; P.tf = 2; P.crouch = 1 - q; P.dust = q < 0.6 ? 1 : 0; P.shake = q < 0.4 ? 2 : 0; }
      if (lift > 2) { P.leg = 'tuck'; P.tuck = 1; P.tr = -0.12; P.hand = [40, -96]; P.farHand = [4, -90]; P.sr = -0.35; P.bsy = 1; P.by = -2; P.hr = 0.12; P.crouch = 0; }
    } else if ((m = A_('abanico'))) {
      if (m === 'W') { P.tr = -0.12 * u; P.hr = -0.1 * u; P.bx = -3 * u; P.spikes = lerp(0.25, 1, u); P.hand = [lerp(38, 62, u), lerp(4, -40, u)]; P.farHand = [lerp(-12, -22, u), lerp(-22, -34, u)]; P.sr = 1.2 * u; P.fleeceK = 1 + 0.2 * u; P.leg = 'idle'; P.glow = 0.55 + 0.4 * u; P.tf = 1; P.shake = 0.8 * u; }
      else { P.spikes = 1; P.fleeceK = lerp(1.3, 1.05, q); P.bx = lerp(-7, 0, q); P.tf = 2; P.hand = [62, -40]; P.farHand = [-22, -34]; P.sr = 1.2; P.tr = lerp(0.1, 0, q); P.leg = 'idle'; P.glow = 1; P.hf = 1; }
    } else if ((m = A_('llamada'))) {
      if (m === 'W') { P.hr = -0.25 * u; P.hf = u > 0.4 ? 1 : 0; P.tr = -0.12 * u; P.hand = [lerp(38, 36, u), lerp(4, -34, u)]; P.sr = 0.02; P.by = -Math.abs(Math.sin(wp * 9)) * 3 * u; P.summon = u; P.glow = 0.55 + 0.45 * u; P.leg = 'idle'; P.tf = 1; P.armF = 0; }
      else { P.by = sp < 0.3 ? lerp(0, 6, sp / 0.3) : lerp(6, 0, (sp - 0.3) / 0.7); P.hand = [36, lerp(-34, 4, Math.min(1, q * 2))]; P.summon = 1 - sp * 0.5; P.hf = 1; P.glow = 1; P.tf = 2; P.leg = 'idle'; P.shake = sp < 0.4 ? 1.4 : 0; P.dust = sp < 0.5 ? 0.8 : 0; }
    } else if ((m = A_('esporas'))) {
      if (m === 'W') { P.tr = 0.2 * u; P.hr = 0.25 * u; P.shake = 1.6 * u; P.spore = u; P.hand = [30, lerp(4, -8, u)]; P.farHand = [-4, -16]; P.armF = 2; P.fleeceK = 1 + 0.08 * Math.sin(t / 55) * u; P.leg = 'idle'; P.tf = 1; }
      else { P.spore = 1; P.fleeceK = lerp(1.25, 1, q); P.tr = lerp(-0.1, 0.1, q); P.hf = 1; P.hand = [30, -8]; P.armF = 2; P.farHand = [-4, -16]; P.leg = 'idle'; P.tf = 2; }
    } else if ((m = A_('extasis'))) {
      P.tr = 0.24; P.by = 5 + Math.sin(t / 45) * 0.9; P.hr = -0.3; P.hf = 1; P.hand = [50, 10]; P.farHand = [10, -8]; P.sr = -0.2; P.planted = 1; P.leg = 'idle'; P.spikes = 1;
      P.glow = 1; P.shake = 1.5; P.tf = 1; P.summon = 1; P.eyeRed = 1; P.bsy = 0.97; P.armF = 2;
    }
    if (s.stun) { P.hr = 0.5; P.tr = 0.3; P.hf = 2; P.hand = [30, 10]; P.sr = 0.8; P.leg = 'idle'; P.stars = 1; P.spikes = 0.1; P.glow = 0.2; P.bsy = 0.96; P.by += 4; P.tf = 0; P.armF = 0; }
    if (s.roar > 0) { var ro = ease(s.roar); P.hr = -0.35 * ro; P.tr = -0.2 * ro; P.hf = 1; P.shake = Math.max(P.shake, 1.6 * ro); P.hand = [60, -50]; P.farHand = [-20, -50]; P.sr = 0.5 * ro; P.spikes = 1; P.glow = 1; P.leg = 'idle'; }
    if (s.hurt > 0) { var hh = clamp(+s.hurt, 0, 1); P.bx -= 5 * hh; P.hf = hh > 0.25 ? 2 : P.hf; P.tr -= 0.05 * hh; }
    if (s.lift > 2 && !(W === 'salto' || ST === 'salto')) { P.leg = 'tuck'; P.tuck = 1; }
    P.eyes = s.desperate ? 2 : s.enraged || P.eyeRed > 0.5 ? 1 : clamp((s.phase || 1) - 1, 0, 2);
    P.wp = wp; P.sp = sp;
    return P;
  }

  // layout: matrices de cada parte + puntos clave (todo en espacio L sin voltear)
  function layout(P) {
    var Mb = chain(mT(P.bx, P.by), mT(P.pvx, P.pvy), mR(P.br), mT(-P.pvx, -P.pvy));
    var Mbody = chain(Mb, mT(0, -48), mS(1, P.bsy), mT(0, 48));
    var Mt = chain(Mb, mT(46, -84), mR(P.tr));
    var Mh = chain(Mt, mT(8 + P.hx, -80 + P.hy), mR(P.hr), mS(1.2, 1.2));
    var shN = mP(Mt, 14, -56), shF = mP(Mt, -10, -58);
    var handN = mP(Mt, P.hand[0], P.hand[1]), handF = mP(Mt, P.farHand[0], P.farHand[1]);
    var sAng = P.sr + P.tr + P.br;
    var Mst = chain(mT(handN.x, handN.y), mR(sAng));
    var Mfl = chain(Mb, mT(-26, -96), mS(P.fleeceK, P.fleeceK * (0.75 + 0.25 * P.spikes)));
    var L = {
      Mb: Mb, Mbody: Mbody, Mt: Mt, Mh: Mh, Mst: Mst, Mfl: Mfl, shN: shN, shF: shF, handN: handN, handF: handF, sAng: sAng,
      lantern: mP(Mst, 0, -66), head: mP(Mh, 0, -24), horns: mP(Mh, -4, -50 * HS - 6), mouth: mP(Mh, 26, -18), eyes: mP(Mh, 0, -33),
      fleece: mP(Mb, -26, -128), body: mP(Mb, 0, -92), staffTip: mP(Mst, 0, 76)
    };
    return L;
  }
  function pointOf(P, id) { return layout(P)[id]; }

  // ---- muerte espectacular: pose por tiempo dt (ms desde que muere)
  function deathPose(P, dt) {
    var a = clamp(dt / 800, 0, 1), c = ease((dt - 800) / 1000);
    P.hf = 2; P.tf = 0; P.leg = 'idle'; P.spikes = 0.3; P.glow = 0.3; P.stars = 0; P.summon = 0; P.trail = 0; P.dust = 0; P.planted = 0; P.armF = 0;
    P.tr = -0.2 * a + 0.5 * c; P.bx = -6 * a + 4 * c; P.hr = -0.25 * a + 0.75 * c; P.br = 0.16 * c; P.by = 40 * c; P.bsy = 1 - 0.1 * c;
    P.shake = dt < 1800 ? 4.2 * (1 - c * 0.8) : 0.6;
    P.hand = [lerp(40, 28, c), lerp(-40, 14, c)]; P.farHand = [-6, lerp(-30, 6, c)]; P.sr = 0.3 + 1.1 * c;
    if (c > 0.02) { P.leg = 'tuck'; P.tuck = c; }
    P.eyes = 2; P.dead = dt > 1100 ? clamp((dt - 1100) / 700, 0, 1) : 0;
    return P;
  }
  function poseFor(s) {
    var P = pose(s);
    if (s.dying) deathPose(P, s.dt != null ? s.dt : (s.deathT || 0));
    return P;
  }

  // ===================================================================== RENDER del Pastor (canvas compartido: origen del suelo en (ox, oy))
  var SC = null, SW = 640, SHH = 470, SOX = 320, SOY = 410;
  var LEGS = [{ hx: -62, far: 1, off: 0, hind: 1 }, { hx: -50, far: 0, off: 0.5, hind: 1 }, { hx: 44, far: 1, off: 0.5, hind: 0 }, { hx: 56, far: 0, off: 0, hind: 0 }];
  function legFrame(P, L, t) {
    var m = P.leg;
    if (m === 'walk') return Math.floor(((P.cu + L.off) % 1) * 4) % 4;
    if (m === 'gallop') return Math.floor(((P.cu + (L.hind ? 0.5 : 0) + (L.far ? 0.1 : 0)) % 1) * 4) % 4;
    if (m === 'paw' && !L.hind && !L.far) return [3, 0, 1, 0][Math.floor(t / 120) % 4];
    return 1;
  }
  function renderPastor(s) {
    if (!SC) { SC = document.createElement('canvas'); SC.width = SW; SC.height = SHH; }
    var x = SC.getContext('2d'), t = s.t || 0, f = s.facing < 0 ? -1 : 1, br = s.broken || {};
    x.setTransform(1, 0, 0, 1, 0, 0); x.globalCompositeOperation = 'source-over'; x.globalAlpha = 1; x.clearRect(0, 0, SW, SHH);
    x.imageSmoothingEnabled = true;
    var dying = !!s.dying, dt = dying ? (s.dt != null ? s.dt : (s.deathT || 0)) : 0;
    if (dying && dt >= DEATH_MS) return { canvas: SC, ox: SOX, oy: SOY };
    var P = poseFor(s), Ly = layout(P);
    var shx = P.shake ? Math.sin(t * 0.13) * P.shake : 0, shy = P.shake ? Math.cos(t * 0.17) * P.shake * 0.6 : 0;
    var base = [f, 0, 0, 1, SOX + shx, SOY + shy];
    function place(m) { var M = mM(base, m); x.setTransform(M[0], M[1], M[2], M[3], M[4], M[5]); }
    function spr(name, fr) { return A.sprite(name, fr); }
    function drawArm(sh, hand, fr) {
      var dx = hand.x - sh.x, dy = hand.y - sh.y, d = Math.sqrt(dx * dx + dy * dy) || 1, th = Math.atan2(-dx, dy), k = clamp(d / 56, 0.7, 1.45);
      place(chain(mT(sh.x, sh.y), mR(th), mS(1, k))); x.drawImage(spr('boss_pastor_arm', fr), -22, -12);
    }
    var hornBroken = !!br.cuernos || (dying && dt >= 500), staffBroken = !!br.cayado, fleeceBroken = !!br.vellon || (dying && dt >= 500);
    var staffOn = !(dying && dt >= 500);
    var i, L;
    // patas lejanas
    for (i = 0; i < 4; i++) {
      L = LEGS[i]; if (!L.far) continue; drawLeg(L);
    }
    function drawLeg(L) {
      var hip = mP(Ly.Mb, L.hx, -62), rot = 0, sy;
      var tuckIt = P.tuck > 0 && (P.leg === 'tuck' || (P.leg === 'rear' && !L.hind));
      if (tuckIt) { rot = (L.hind ? 0.9 : -1.0) * P.tuck; sy = 1 - 0.32 * P.tuck; }
      else sy = clamp((0 - hip.y) / 62, 0.6, 1.3);
      place(chain(mT(hip.x, hip.y), mR(rot), mS(1, sy)));
      x.drawImage(spr('boss_pastor_leg', (L.far ? 4 : 0) + legFrame(P, L, t)), -20, -10);
    }
    // brazo lejano, torso, cuerpo, vellon
    drawArm(Ly.shF, Ly.handF, 1);
    place(Ly.Mt); x.drawImage(spr('boss_pastor_torso', P.tf), -48, -112);
    place(Ly.Mbody); x.drawImage(spr('boss_pastor_body', Math.floor(t / 620) % 2), -96, -174);
    place(Ly.Mfl); x.drawImage(spr('boss_pastor_fleece', fleeceBroken ? 1 : 0), -56, -80);
    // patas cercanas
    for (i = 0; i < 4; i++) { L = LEGS[i]; if (L.far) continue; drawLeg(L); }
    // cabeza: cuerno lejano, cabeza, ojos, cuerno cercano
    place(chain(Ly.Mh, mT(-20, -42), mR(-0.42), mS(HS * 0.95, HS * 0.95))); x.drawImage(spr('boss_pastor_horn_l', hornBroken ? 1 : 0), -16, -60);
    place(Ly.Mh); x.drawImage(spr('boss_pastor_head', P.hf), -32, -56);
    if (!(dying && dt > 1100)) {
      place(chain(Ly.Mh, mT(0, -33), mS(1, P.hf === 2 ? 0.45 : 1))); x.globalAlpha = dying ? 1 - (P.dead || 0) : 1;
      x.drawImage(spr('boss_pastor_eyes', P.eyes), -12, -6); x.globalAlpha = 1;
    }
    place(chain(Ly.Mh, mT(-6, -44), mS(HS, HS))); x.drawImage(spr('boss_pastor_horn_r', hornBroken ? 1 : 0), -16, -60);
    // cayado + brazo cercano
    if (staffOn) { place(Ly.Mst); x.drawImage(spr('boss_pastor_staff', staffBroken ? 2 : Math.floor(t / 170) % 2), -20, -100); }
    drawArm(Ly.shN, Ly.handN, P.armF === 2 ? 2 : 0);
    // piezas que salen despedidas al morir
    if (dying && dt >= 500) {
      var P5 = poseFor({ t: s.t, facing: 1, phase: s.phase, dying: true, dt: 500, broken: br }), L5 = layout(P5), tau = (dt - 500) / 1000;
      var deb = [];
      if (!br.cuernos) { deb.push({ n: 'boss_pastor_horn_r', fr: 0, p: mP(L5.Mh, -6, -44), vx: 90, vy: -190, sp: 5, sc: HS, px: 16, py: 60 }); deb.push({ n: 'boss_pastor_horn_l', fr: 0, p: mP(L5.Mh, -10, -46), vx: -70, vy: -210, sp: -4, sc: HS * 0.92, px: 16, py: 60 }); }
      if (!br.cayado) deb.push({ n: 'boss_pastor_staff', fr: 0, p: mP(L5.Mst, 0, 0), vx: 130, vy: -150, sp: 3, sc: 1, px: 20, py: 100 });
      if (!br.vellon) deb.push({ n: 'boss_pastor_fleece', fr: 0, p: mP(L5.Mfl, 0, 0), vx: -90, vy: -160, sp: -2.5, sc: 1, px: 56, py: 80 });
      deb.forEach(function (d) {
        var yy = Math.min(-8, d.p.y + d.vy * tau + 450 * tau * tau), xx = d.p.x + d.vx * Math.min(tau, 1.1), rot = d.sp * Math.min(tau, 1.0);
        place(chain(mT(xx, yy), mR(rot), mS(d.sc, d.sc))); x.drawImage(spr(d.n, d.fr), -d.px, -d.py);
      });
    }
    // brillos aditivos (farol, ojos, puas, brasas)
    x.setTransform(1, 0, 0, 1, 0, 0);
    x.globalCompositeOperation = 'lighter';
    function scx(px) { return base[4] + f * px; }
    function scy(py) { return base[5] + py; }
    function glow(px, py, r, col, a) {
      var X = scx(px), Y = scy(py), g = x.createRadialGradient(X, Y, 0, X, Y, r); g.addColorStop(0, 'rgba(' + col + ',' + a.toFixed(3) + ')'); g.addColorStop(1, 'rgba(' + col + ',0)');
      x.fillStyle = g; x.fillRect(X - r, Y - r, r * 2, r * 2);
    }
    if (!dying || dt < 900) {
      var fl = 0.8 + 0.2 * Math.sin(t / 90) + 0.1 * Math.sin(t / 37);
      if (!staffBroken && staffOn) glow(Ly.lantern.x, Ly.lantern.y, 40 * (0.8 + P.glow * 0.5) * fl, '255,154,42', 0.5 * P.glow + 0.12);
      var ec = ['255,154,42', '255,60,40', '255,255,255'][P.eyes];
      glow(Ly.eyes.x, Ly.eyes.y, 20 + P.eyes * 3, ec, 0.55);
    }
    var i2, emb = (!dying) && (br.vellon || (s.phase || 1) >= 3 || s.enraged || s.desperate);
    if (emb) {
      for (i2 = 0; i2 < 9; i2++) {
        var ph = ((t / 1500) + i2 / 9) % 1, ex = Ly.fleece.x + (pr(i2 + 5) - 0.5) * 100 + Math.sin(ph * 7 + i2) * 7, ey = Ly.fleece.y + 18 - ph * 70;
        x.fillStyle = (i2 % 2 ? 'rgba(255,200,70,' : 'rgba(255,120,40,') + (1 - ph).toFixed(2) + ')';
        var sz = 3.2 * (1 - ph) + 1; x.fillRect(scx(ex) - sz / 2, scy(ey) - sz / 2, sz, sz);
      }
    }
    if (P.spikes > 0.7 && !fleeceBroken) { for (i2 = 0; i2 < 5; i2++) { var sp2 = mP(Ly.Mfl, -44 + i2 * 22, -66 - (i2 % 2) * 4); glow(sp2.x, sp2.y, 14, '200,110,255', 0.45); } }
    if (dying && dt >= 1500) { // brasas al disolverse
      var en = 28;
      for (i2 = 0; i2 < en; i2++) {
        var ph2 = ((dt - 1500) / 1300 + i2 / en) % 1, ex2 = (pr(i2 + 11) - 0.5) * 220 + Math.sin(ph2 * 6 + i2) * 12, ey2 = -30 - pr(i2 + 31) * 90 - ph2 * 110;
        x.fillStyle = (i2 % 2 ? 'rgba(255,200,70,' : 'rgba(255,120,40,') + (Math.max(0, 1 - ph2) * (1 - clamp((dt - 2600) / 600, 0, 1))).toFixed(2) + ')';
        var sz2 = 2 + (1 - ph2) * 4; x.fillRect(SOX + ex2 - sz2 / 2, SOY + ey2 - sz2 / 2, sz2, sz2);
      }
    }
    x.globalCompositeOperation = 'source-over';
    x.setTransform(1, 0, 0, 1, 0, 0);
    // desintegracion
    if (dying && dt > 1800) {
      var u = clamp((dt - 1800) / 1400, 0, 1), n = Math.floor(u * 700);
      x.globalCompositeOperation = 'destination-out'; x.fillStyle = '#000';
      for (i2 = 0; i2 < n; i2++) x.fillRect(SOX - 150 + pr(i2 * 3 + 1) * 300, SOY - 300 + pr(i2 * 3 + 2) * 330 * (1 - u * 0.15), 12, 12);
      if (u > 0.55) { x.fillStyle = 'rgba(0,0,0,' + clamp((u - 0.55) / 0.45, 0, 1).toFixed(2) + ')'; x.fillRect(0, 0, SW, SHH); }
      x.globalCompositeOperation = 'source-over';
    }
    // tintes sobre la silueta (hurt/furia/ventana/inmune)
    x.globalCompositeOperation = 'source-atop';
    var hv = s.hurt === true ? 1 : clamp(+s.hurt || 0, 0, 1);
    if (dying && dt < 800) hv = Math.max(hv, (Math.floor(dt / 70) % 2) ? 0.85 : 0.15);
    if (dying && dt < 150) hv = 1;
    if (s.enraged && !dying) { x.fillStyle = 'rgba(255,30,10,' + (0.12 + 0.07 * Math.sin(t / 160)).toFixed(3) + ')'; x.fillRect(0, 0, SW, SHH); }
    if (s.exposed && !dying) { x.fillStyle = 'rgba(255,210,60,' + (0.16 + 0.1 * Math.sin(t / 130)).toFixed(3) + ')'; x.fillRect(0, 0, SW, SHH); }
    if (s.immune && !dying) { x.fillStyle = 'rgba(200,235,255,' + (0.22 + 0.12 * Math.sin(t / 90)).toFixed(3) + ')'; x.fillRect(0, 0, SW, SHH); }
    if (hv > 0) { x.fillStyle = 'rgba(255,255,255,' + (hv * 0.85).toFixed(3) + ')'; x.fillRect(0, 0, SW, SHH); }
    x.globalCompositeOperation = 'source-over';
    return { canvas: SC, ox: SOX, oy: SOY, pose: P, layout: Ly };
  }

  // ===================================================================== sombra, aura y efectos de suelo
  function shadow(ctx, x, y, s) {
    var lift = s.lift || 0, k = 1 - clamp(lift / 260, 0, 0.55), al = 0.35 * (1 + (1 - k) * 0.9);
    if (s.dying && s.dt > 1800) al *= 1 - clamp((s.dt - 1800) / 1400, 0, 1);
    ctx.save(); ctx.translate(x, y + GY - 6);
    ctx.fillStyle = 'rgba(8,4,14,' + (al * 0.55).toFixed(3) + ')'; ctx.beginPath(); ctx.ellipse(0, 0, 90 * k, 28 * k, 0, 0, TAU); ctx.fill();
    ctx.fillStyle = 'rgba(8,4,14,' + (al * 0.8).toFixed(3) + ')'; ctx.beginPath(); ctx.ellipse(0, 0, 72 * k, 21 * k, 0, 0, TAU); ctx.fill();
    ctx.restore();
  }
  function aura(ctx, x, y, s, P) {
    var t = s.t || 0, gx = x, gy = y + GY, i;
    var col = s.desperate ? [176, 90, 240] : [255, 60, 30];
    var on = s.enraged || s.desperate || P.summon > 0.05 || P.planted;
    if (!on) return;
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    if (P.summon > 0.05) { // anillo de runas moradas bajo los pies (llamada / extasis)
      var rs = P.planted ? 1 : P.summon;
      ctx.strokeStyle = 'rgba(176,90,240,' + (0.45 * rs).toFixed(2) + ')'; ctx.lineWidth = 3; ctx.beginPath(); ctx.ellipse(gx, gy - 6, 120 * (0.6 + 0.4 * rs), 40 * (0.6 + 0.4 * rs), 0, 0, TAU); ctx.stroke();
      for (i = 0; i < 12; i++) { var a = i / 12 * TAU + t / 1500; ctx.fillStyle = 'rgba(224,176,255,' + (0.5 * rs).toFixed(2) + ')'; ctx.fillRect(gx + Math.cos(a) * 120 * (0.6 + 0.4 * rs) - 2, gy - 6 + Math.sin(a) * 40 * (0.6 + 0.4 * rs) - 2, 4, 4); }
    }
    if (s.enraged || s.desperate) {
      var g = ctx.createRadialGradient(gx, gy - 90, 10, gx, gy - 90, 170);
      g.addColorStop(0, 'rgba(' + col.join(',') + ',0.22)'); g.addColorStop(1, 'rgba(' + col.join(',') + ',0)');
      ctx.fillStyle = g; ctx.fillRect(gx - 170, gy - 260, 340, 340);
      for (i = 0; i < 10; i++) {
        var aa = i / 10 * TAU, bx = gx + Math.cos(aa) * 84, by = gy - 8 + Math.sin(aa) * 24, hh = 46 + 18 * Math.sin(t / 110 + i * 2.1), sw = Math.sin(t / 170 + i) * 6;
        ctx.fillStyle = 'rgba(' + col.join(',') + ',0.30)';
        ctx.beginPath(); ctx.moveTo(bx - 9, by); ctx.quadraticCurveTo(bx - 7 + sw, by - hh * 0.55, bx + sw, by - hh); ctx.quadraticCurveTo(bx + 7 + sw, by - hh * 0.5, bx + 9, by); ctx.closePath(); ctx.fill();
      }
    }
    ctx.restore();
  }
  function frontFx(ctx, x, y, s, P, R) {
    var t = s.t || 0, gx = x, gy = y + GY, f = s.facing < 0 ? -1 : 1, i;
    // polvo en pezunas
    if (P.dust > 0.05) {
      for (i = 0; i < 6; i++) {
        var ph = ((t / 520) + i / 6) % 1, px = gx + f * (46 + 14 - ph * 34 + (i % 2) * 8), py = gy - 6 - ph * 22;
        ctx.fillStyle = 'rgba(200,184,160,' + (0.55 * (1 - ph) * Math.min(1, P.dust)).toFixed(2) + ')'; ctx.beginPath(); ctx.arc(px, py, 3 + ph * 8, 0, TAU); ctx.fill();
      }
    }
    // lineas de velocidad / rastro de carga
    if (P.trail) {
      for (i = 0; i < 4; i++) {
        var ly = gy - 20 - i * 26 - (i % 2) * 6, len = 130 + i * 18, sx = gx - f * (60 + (i % 2) * 30);
        var gr = ctx.createLinearGradient(sx, 0, sx - f * len, 0); gr.addColorStop(0, 'rgba(240,230,214,0.55)'); gr.addColorStop(1, 'rgba(240,230,214,0)');
        ctx.fillStyle = gr; ctx.fillRect(Math.min(sx, sx - f * len), ly - 2, len, 4);
      }
      var tr = A.animFrame('fx_charge_trail', 'puff', (t % 400) * 1.2); ctx.save(); ctx.translate(gx - f * 118, gy - 14); ctx.scale(f, 1); ctx.drawImage(tr, -tr.width / 2, -tr.height / 2); ctx.restore();
    }
    // esporas verdes
    if (P.spore > 0.05) {
      for (i = 0; i < 7; i++) {
        var p2 = ((t / 1300) + i / 7) % 1, sx2 = gx + f * (-26 + Math.sin(i * 2.3) * 40) + Math.sin(p2 * 8 + i) * 8, sy2 = gy - 120 - p2 * 70, sc = 1 + p2 * 1.6;
        var fr = A.sprite('fx_spore_puff', Math.min(3, Math.floor(p2 * 4))); ctx.globalAlpha = Math.min(1, P.spore + 0.2) * (1 - p2 * 0.5);
        ctx.drawImage(fr, sx2 - fr.width * sc / 2, sy2 - fr.height * sc / 2, fr.width * sc, fr.height * sc);
      }
      ctx.globalAlpha = 1;
    }
    // estrellitas de aturdimiento
    if (P.stars) {
      var hd = R.layout.head;
      for (i = 0; i < 3; i++) {
        var a = t / 380 + i * TAU / 3, sx3 = gx + f * hd.x + Math.cos(a) * 34, sy3 = gy + hd.y - 40 + Math.sin(a) * 9, r = 6;
        ctx.save(); ctx.translate(sx3, sy3); ctx.rotate(t / 300 + i); ctx.fillStyle = '#ffe45a'; ctx.strokeStyle = OLC; ctx.lineWidth = 1.6; ctx.beginPath();
        for (var k = 0; k < 8; k++) { var rr = k % 2 ? r * 0.45 : r; ctx.lineTo(Math.cos(k * TAU / 8) * rr, Math.sin(k * TAU / 8) * rr); }
        ctx.closePath(); ctx.stroke(); ctx.fill(); ctx.restore();
      }
    }
    // aro dorado de ventana de dano
    if (s.exposed && !s.dying) {
      var wr = A.animFrame('fx_window_ring', 'loop', t), pu = 1 + 0.05 * Math.sin(t / 150), W = 250 * pu;
      ctx.save(); ctx.globalAlpha = 0.85; ctx.translate(gx, gy - 8); ctx.scale(1, 0.4); ctx.drawImage(wr, -W * 0.6, -W * 0.6, W * 1.2, W * 1.2); ctx.restore();
    }
    // campo de inmunidad (puerta de fase)
    if (s.immune && !s.dying) {
      ctx.save(); ctx.strokeStyle = 'rgba(200,235,255,' + (0.5 + 0.3 * Math.sin(t / 100)).toFixed(2) + ')'; ctx.lineWidth = 3; ctx.setLineDash([12, 8]); ctx.lineDashOffset = -t / 30;
      ctx.beginPath(); ctx.ellipse(gx, gy - 80, 118, 128, 0, 0, TAU); ctx.stroke(); ctx.restore();
    }
  }

  // ===================================================================== API publica
  var BOSSES = {
    pastor: {
      id: 'pastor', name: 'El Pastor Corrupto', title: 'Bestia del Rebaño', r: 74, gy: GY, w: 250, h: 250, deathMs: DEATH_MS,
      windups: NAMES, phases: ['El Rebaño', 'La Corrupción', 'Cenizas'], despair: 'Éxtasis del Rebaño',
      parts: { cuernos: { r: 30 }, cayado: { r: 26 }, vellon: { r: 34 } }, render: renderPastor
    }
  };
  A.BOSS = BOSSES;
  A.bossIds = function () { return Object.keys(BOSSES); };
  A.bossInfo = function (id) { return BOSSES[id] || null; };

  // dibuja el jefe compuesto. (x,y) = posicion logica de la entidad (centro del circulo de colision r=BOSS.pastor.r). s = state (ver ASSETS_API.md)
  A.drawBoss = function (id, ctx, x, y, s) {
    var B = BOSSES[id]; if (!B) return null; s = s || {};
    var R = B.render(s), P = R.pose;
    if (!s.noShadow) shadow(ctx, x, y, s);
    if (P && !s.noFx) aura(ctx, x, y, s, P);
    if (!(s.dying && (s.dt || s.deathT || 0) >= DEATH_MS)) {
      var al = s.alpha == null ? 1 : s.alpha; if (al < 1) { ctx.save(); ctx.globalAlpha = al; }
      ctx.drawImage(R.canvas, Math.round(x - R.ox), Math.round(y + GY - R.oy - (s.lift || 0)));
      if (al < 1) ctx.restore();
    }
    if (P && !s.noFx) { ctx.save(); ctx.translate(0, -(s.lift || 0)); frontFx(ctx, x, y, s, P, R); ctx.restore(); }
    return R;
  };
  // solo el canvas del jefe (para texturas Phaser): {canvas, ox, oy}; el canvas es COMPARTIDO y se sobrescribe en cada llamada
  A.renderBoss = function (id, s) { var B = BOSSES[id]; return B ? B.render(s || {}) : null; };
  A.drawBossShadow = function (ctx, x, y, s) { shadow(ctx, x, y, s || {}); };

  // puntos de anclaje de hitboxes hijas, en px RELATIVOS a (x,y) de la entidad, ya con facing y lift aplicados
  A.bossAnchors = function (id, s) {
    s = s || {}; var f = s.facing < 0 ? -1 : 1, P = poseFor(s), L = layout(P), lift = s.lift || 0;
    function w(p, r) { return { x: Math.round(f * p.x * 10) / 10, y: Math.round((GY + p.y - lift) * 10) / 10, r: r }; }
    var o = {
      body: w(L.body, 74), head: w(L.head, 26), cuernos: w(L.horns, 30), cayado: w(L.lantern, 26), vellon: w(L.fleece, 34),
      hand: w(L.handN, 12), mouth: w(L.mouth, 10), staffTip: w(L.staffTip, 8), shoulder: w(L.shN, 10), eyes: w(L.eyes, 8),
      feet: { x: 0, y: GY - lift, r: 0 }, groundShadow: { x: 0, y: GY - 6, r: 86 }
    };
    return o;
  };
  // pose de ataque como la usa el dibujo (para sincronizar logica): duraciones sugeridas de telegrafia estan en el doc
  A.bossPoseNames = function () { return NAMES.slice(); };

  // ===================================================================== TELEGRAFIAS (formas) y ondas
  var COLS = {
    red: { f: '255,59,48', s: '#ff6a5a' }, green: { f: '123,227,74', s: '#b0f58a' }, purple: { f: '176,90,240', s: '#dca0ff' },
    orange: { f: '255,138,26', s: '#ffe45a' }, gold: { f: '255,210,58', s: '#fff6c0' }, blue: { f: '106,200,255', s: '#c0ecff' }
  };
  var DEFCOL = { summon: 'purple', spore: 'green' };
  // kinds: circle{r} | arc{r,inner,arc} | cone{r,arc} | rect/lane{w,len} | ring{r,th,gap} | donut{r,inner} | summon{r} | spore{r}
  // o: {p:0..1 progreso, a:angulo, color, fix:bool (auto p>=.75), sig:bool (doble contorno), t:ms}
  A.drawBossTele = function (ctx, kind, x, y, o) {
    o = o || {}; var p = o.p == null ? 1 : clamp(o.p, 0, 1), col = COLS[o.color || DEFCOL[kind] || 'red'], a = o.a || 0, t = o.t != null ? o.t : performance.now();
    var fix = o.fix != null ? o.fix : p >= 0.75, r = o.r || 120, path = new Path2D(), prog = new Path2D(), extra = null, i;
    if (kind === 'circle') { path.arc(x, y, r, 0, TAU); prog.arc(x, y, Math.max(1, r * p), 0, TAU); }
    else if (kind === 'arc' || kind === 'cone') {
      var arc = o.arc || (kind === 'arc' ? Math.PI : 70 * Math.PI / 180), inner = kind === 'arc' ? (o.inner == null ? 40 : o.inner) : 0, rp = inner + (r - inner) * p;
      [[path, r], [prog, rp]].forEach(function (z) {
        if (inner > 0) { z[0].arc(x, y, z[1], a - arc / 2, a + arc / 2); z[0].arc(x, y, inner, a + arc / 2, a - arc / 2, true); } else { z[0].moveTo(x, y); z[0].arc(x, y, z[1], a - arc / 2, a + arc / 2); }
        z[0].closePath();
      });
    } else if (kind === 'rect' || kind === 'lane') {
      var w = o.w || 90, len = o.len || 520, ca = Math.cos(a), sa = Math.sin(a);
      [[path, len], [prog, len * p]].forEach(function (z) {
        var L = z[1], h = w / 2;
        z[0].moveTo(x - sa * h, y + ca * h); z[0].lineTo(x - sa * h + ca * L, y + ca * h + sa * L); z[0].lineTo(x + sa * h + ca * L, y - ca * h + sa * L); z[0].lineTo(x + sa * h, y - ca * h); z[0].closePath();
      });
      extra = function () { // flechas de direccion
        ctx.fillStyle = 'rgba(' + col.f + ',0.55)'; for (i = 1; i < 6; i++) { var d = (len * i / 6 + (t / 6) % (len / 6)) , px = x + ca * d, py = y + sa * d; if (d > len * p) break; ctx.beginPath(); ctx.moveTo(px + ca * 12, py + sa * 12); ctx.lineTo(px - ca * 6 - sa * 12, py - sa * 6 + ca * 12); ctx.lineTo(px - ca * 6 + sa * 12, py - sa * 6 - ca * 12); ctx.closePath(); ctx.fill(); }
      };
    } else if (kind === 'ring') {
      var th = o.th || 24, gap = o.gap == null ? Math.PI / 3 : o.gap, rp2 = Math.max(th + 1, r * p);
      path.arc(x, y, r, a + gap / 2, a - gap / 2 + TAU); path.arc(x, y, r - th, a - gap / 2 + TAU, a + gap / 2, true); path.closePath();
      prog.arc(x, y, rp2, a + gap / 2, a - gap / 2 + TAU); prog.arc(x, y, rp2 - th, a - gap / 2 + TAU, a + gap / 2, true); prog.closePath();
      extra = function () { // marca del hueco seguro
        ctx.strokeStyle = 'rgba(220,255,220,0.9)'; ctx.lineWidth = 2.4; ctx.setLineDash([]);
        [-1, 1].forEach(function (sg) { var ag = a + sg * gap / 2; ctx.beginPath(); ctx.moveTo(x + Math.cos(ag) * r * 0.25, y + Math.sin(ag) * r * 0.25); ctx.lineTo(x + Math.cos(ag) * r, y + Math.sin(ag) * r); ctx.stroke(); });
        ctx.fillStyle = 'rgba(220,255,220,0.8)';
        [0.45, 0.7, 0.93].forEach(function (k) { var d = r * k + ((t / 14) % 20), cx = x + Math.cos(a) * d, cy = y + Math.sin(a) * d; if (d > r) return; ctx.beginPath(); ctx.moveTo(cx + Math.cos(a) * 9, cy + Math.sin(a) * 9); ctx.lineTo(cx - Math.cos(a) * 5 - Math.sin(a) * 8, cy - Math.sin(a) * 5 + Math.cos(a) * 8); ctx.lineTo(cx - Math.cos(a) * 5 + Math.sin(a) * 8, cy - Math.sin(a) * 5 - Math.cos(a) * 8); ctx.closePath(); ctx.fill(); });
      };
    } else if (kind === 'donut') {
      var inn = o.inner == null ? 40 : o.inner; path.arc(x, y, r, 0, TAU); path.moveTo(x + inn, y); path.arc(x, y, inn, 0, TAU, true);
      prog.arc(x, y, inn + (r - inn) * p, 0, TAU); prog.moveTo(x + inn, y); prog.arc(x, y, inn, 0, TAU, true);
    } else if (kind === 'summon') {
      path.arc(x, y, r, 0, TAU); prog.arc(x, y, Math.max(1, r * p), 0, TAU);
      extra = function () {
        ctx.strokeStyle = 'rgba(224,176,255,0.85)'; ctx.lineWidth = 2; ctx.setLineDash([]); ctx.beginPath();
        for (i = 0; i < 5; i++) { var ag = t / 700 + i * TAU * 2 / 5; ctx.lineTo(x + Math.cos(ag) * r * 0.9, y + Math.sin(ag) * r * 0.9); } ctx.closePath(); ctx.stroke();
        for (i = 0; i < 12; i++) { var ag2 = -t / 900 + i * TAU / 12; ctx.beginPath(); ctx.moveTo(x + Math.cos(ag2) * r * 0.92, y + Math.sin(ag2) * r * 0.92); ctx.lineTo(x + Math.cos(ag2) * r * 1.04, y + Math.sin(ag2) * r * 1.04); ctx.stroke(); }
      };
    } else if (kind === 'spore') {
      path.arc(x, y, r, 0, TAU); prog.arc(x, y, Math.max(1, r * p), 0, TAU);
      extra = function () { ctx.strokeStyle = 'rgba(' + col.f + ',0.9)'; ctx.lineWidth = 3; ctx.setLineDash([2, 8]); ctx.beginPath(); ctx.arc(x, y, r * (1.6 - 0.6 * p), 0, TAU); ctx.stroke(); ctx.setLineDash([]); };
    } else return;
    ctx.save(); ctx.lineJoin = 'round';
    ctx.fillStyle = 'rgba(' + col.f + ',' + (0.12 + 0.28 * p).toFixed(3) + ')'; ctx.fill(path, 'evenodd');
    ctx.fillStyle = 'rgba(' + col.f + ',0.20)'; ctx.fill(prog, 'evenodd');
    if (o.sig) { ctx.strokeStyle = 'rgba(255,255,255,0.28)'; ctx.lineWidth = 9; ctx.stroke(path); }
    ctx.strokeStyle = col.s; ctx.globalAlpha = 0.85; ctx.lineWidth = fix ? 3.4 : 2.6;
    if (!fix) { ctx.setLineDash([11, 8]); ctx.lineDashOffset = -t / 40; }
    ctx.stroke(path); ctx.setLineDash([]); ctx.globalAlpha = 1;
    if (extra) extra();
    ctx.restore();
  };
  // viñeta roja de borde para ataques firma (p = 0..1, pulsa en los ultimos 300 ms: pasar p alto)
  A.drawBossVignette = function (ctx, W, H, p, color) {
    var c = color || '255,30,20', g = ctx.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.42, W / 2, H / 2, Math.max(W, H) * 0.72);
    g.addColorStop(0, 'rgba(' + c + ',0)'); g.addColorStop(1, 'rgba(' + c + ',' + (0.1 * clamp(p, 0, 1)).toFixed(3) + ')');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  };
  // tinte de arena del Exstasis (morado): a 0..1
  A.drawBossArenaTint = function (ctx, W, H, t, a, color) {
    var c = color || '120,40,170'; a = clamp(a, 0, 1);
    ctx.fillStyle = 'rgba(' + c + ',' + (0.22 * a).toFixed(3) + ')'; ctx.fillRect(0, 0, W, H);
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    for (var i = 0; i < 14; i++) { var ph = ((t / 3200) + i / 14) % 1; ctx.fillStyle = 'rgba(200,120,255,' + (0.35 * a * (1 - ph)).toFixed(2) + ')'; ctx.fillRect((pr(i) * W + Math.sin(ph * 6 + i) * 20) | 0, (H - ph * H * 0.9) | 0, 3, 3); }
    ctx.restore();
  };
  // anillo/onda con hueco compuesto con fx_shockwave_seg. o: {th:24, gap:rad (0 = sin hueco), a: centro del hueco, style:0 rojo|1 morado|2 verde, alpha}
  A.drawBossWave = function (ctx, x, y, r, o) {
    o = o || {}; var th = o.th || 24, gap = o.gap == null ? Math.PI / 3 : o.gap, a = o.a || 0, st = o.style || 0, N = clamp(Math.round(TAU * r / 46), 10, 56), sg = A.sprite('fx_shockwave_seg', st);
    var segLen = TAU * r / N * 1.1, i, d, half = gap / 2;
    ctx.save(); ctx.globalAlpha = o.alpha == null ? 1 : o.alpha;
    for (i = 0; i < N; i++) {
      var ang = i / N * TAU; d = Math.abs(((ang - a + Math.PI * 3) % TAU) - Math.PI);
      if (gap > 0 && d < half - (TAU / N) * 0.35) continue;
      ctx.save(); ctx.translate(x + Math.cos(ang) * r, y + Math.sin(ang) * r); ctx.rotate(ang + Math.PI / 2); ctx.drawImage(sg, -segLen / 2, -th / 2, segLen, th); ctx.restore();
    }
    ctx.restore();
  };
  // retrato para la barra/intro: Assets.drawBossPortrait('pastor', ctx, x, y, {size:96, mood:0|1|2}) (x,y = esquina sup. izq.)
  A.drawBossPortrait = function (id, ctx, x, y, o) {
    o = o || {}; var sz = o.size || 96, c = A.sprite('boss_' + id + '_portrait', o.mood || 0);
    ctx.drawImage(c, x, y, sz, sz);
  };
})();
