/*!
 * assets_boss4.js - Arte del JEFE v5 (P6): MELARIA, la Reina Abeja (Panal). Solo arte, sin logica.
 * Script clasico que EXTIENDE window.Assets; cargar tras assets.js, assets_boss.js, assets_boss2.js y assets_boss3.js
 * (usa Assets._h y la API de drawBoss/drawBossTele/bossAnchors de los jefes anteriores).
 * Contrato (nombres, state, anclas, telegrafias, trofeos): games/card-swarm/ASSETS_API.md, seccion "Jefes v4 (P6: Melaria)".
 * Diseno: DESIGN-v5-biomas.md B.5 y C.4-C. Estilo: contorno grueso #1b1124, color plano + 1 sombra + 1 brillo, rasterizado x2.
 * Coste: todas las capas del cuerpo se componen en UN canvas compartido con rect sucio (~26 drawImage por frame), sin shadowBlur.
 * Alias: el id logico del jefe del bioma es 'reina' (Boss.BIOME_BOSS) y el del arte es 'melaria': ambos funcionan en toda la API.
 */
(function () {
  'use strict';
  var A = window.Assets, H = A && A._h;
  if (!H || !A.drawBoss || !A.drawBossTele || !A.sprite) { if (window.console) console.error('assets_boss4: falta Assets._h o assets_boss*.js (cargar tras assets_boss3.js)'); return; }
  var addV = H.addV, Ppoly = H.Ppoly, Pblob = H.Pblob, Prr = H.Prr, Pclosed = H.Pclosed, OLC = H.OLC;
  var TAU = Math.PI * 2, LW = 2.1, sin = Math.sin, cos = Math.cos, PI = Math.PI;
  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  function lerp(a, b, u) { return a + (b - a) * u; }
  function ease(u) { u = clamp(u, 0, 1); return u * u * (3 - 2 * u); }
  function pr(i) { var s = Math.sin(i * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); }
  function mkc(w, h) { var c = document.createElement('canvas'); c.width = w; c.height = h; return c; }
  function rd(v) { return Math.round(v * 10) / 10; }

  var M = {
    amber: '#f3a31f', amberS: '#b9690c', amberH: '#ffd36a', blk: '#2a1b10', blkS: '#150d07', blkH: '#5a3a22',
    wax: '#fff3d6', waxS: '#d9bf8c', waxD: '#a98a54', jelly: '#fffbe8', mem: '#e9f4ff', memS: '#b8d4ee', vein: '#7a98b8',
    honey: '#c97a14', honeyS: '#8a4e0a', honeyH: '#f0a63a', cell: '#ffe9a0'
  };
  var EYE = [['#c8f5a0', '#f2ffe0', '200,245,160'], ['#ffc440', '#fff0b8', '255,196,64'], ['#ffe6f2', '#ffffff', '255,226,242']];   // F1 verde palido, F2 ambar, F3 blanco-rosado (sin rojo)

  function hexPts(cx, cy, r, rot) { var p = [], i; rot = rot || 0; for (i = 0; i < 6; i++) p.push([cx + cos(rot + i * PI / 3) * r, cy + sin(rot + i * PI / 3) * r]); return p; }
  function hexPath(c, cx, cy, r, rot) { var p = hexPts(cx, cy, r, rot), i; c.moveTo(p[0][0], p[0][1]); for (i = 1; i < 6; i++) c.lineTo(p[i][0], p[i][1]); c.closePath(); }

  // ================================================================= SPRITES
  // ---- torax peludo: 56x46 (final 112x92). 0/1 respiracion. Centro (28,24). Cabeza a la derecha; abdomen a la izquierda
  function thoraxDraw(f) {
    return function (v) {
      var x = v.ctx, i, cx = 28, cy = 24, rx = 22 + f * 0.7, ry = 18 + f * 0.6;
      for (i = 0; i < 20; i++) {
        var a = i / 20 * TAU + 0.1, bx = cx + cos(a) * rx * 0.94, by = cy + sin(a) * ry * 0.94, ln = 4 + pr(i + f * 3 + 11) * 3.6, nx = cos(a), ny = sin(a);
        v.part(Ppoly([[bx - ny * 3.4, by + nx * 3.4], [bx + nx * ln, by + ny * ln], [bx + ny * 3.4, by - nx * 3.4]]), i % 2 ? M.amberH : M.amber, { lw: 1.2, sh: M.amberS, so: 0.4 });
      }
      v.part(Pblob(cx, cy, rx, ry, 811, 0.035, 12), M.amber, { lw: LW, sh: M.amberS, hi: M.amberH, so: 2.4 });
      x.save(); x.beginPath(); Pblob(cx, cy, rx, ry, 811, 0.035, 12)(x); x.clip();
      x.fillStyle = M.blk; x.beginPath(); x.moveTo(-2, -2); x.lineTo(15, -2); x.lineTo(17, 8); x.lineTo(13, 14); x.lineTo(17, 21); x.lineTo(13, 29); x.lineTo(17, 36); x.lineTo(14, 50); x.lineTo(-2, 50); x.closePath(); x.fill();
      x.fillStyle = M.blkH; x.fillRect(2, 2, 3, 40);
      x.fillStyle = 'rgba(130,64,0,0.36)'; x.beginPath(); x.ellipse(cx, cy + 22, 30, 10, 0, 0, TAU); x.fill();
      x.strokeStyle = 'rgba(255,226,140,0.85)'; x.lineWidth = 0.9; x.lineCap = 'round';
      for (i = 0; i < 12; i++) { var hx = 20 + pr(i + 5) * 28, hy = 8 + pr(i + 9) * 28, hl = 4 + pr(i + 2) * 4; x.beginPath(); x.moveTo(hx, hy); x.quadraticCurveTo(hx + 1.2, hy + hl * 0.5, hx + 0.4, hy + hl); x.stroke(); }
      x.strokeStyle = 'rgba(70,40,10,0.7)'; x.lineWidth = 0.8;
      for (i = 0; i < 8; i++) { var kx = 2 + pr(i + 20) * 12, ky = 4 + pr(i + 30) * 34; x.beginPath(); x.moveTo(kx, ky); x.lineTo(kx + 3, ky + 3); x.stroke(); }
      x.restore();
      // gorguera real de pelo claro (cuello)
      for (i = 0; i < 6; i++) { var gy = 10 + i * 4.6; v.part(Ppoly([[43, gy - 2.6], [50 + (i % 2) * 2, gy + 0.6], [43, gy + 2.6]]), i % 2 ? M.wax : M.jelly, { lw: 1, sh: M.waxS, so: 0.3 }); }
      // bultos de la raiz de las alas
      v.part(Pblob(36, 6, 3.6, 2.4, 812, 0.05, 7), M.blk, { lw: 1.3, sh: M.blkS, hi: M.blkH, so: 0.4 }); v.part(Pblob(20, 6.4, 3.6, 2.4, 813, 0.05, 7), M.blk, { lw: 1.3, sh: M.blkS, hi: M.blkH, so: 0.4 });
    };
  }
  addV('boss_reina_thorax', 56, 46, [thoraxDraw(0), thoraxDraw(1)], { lw: LW }, { idle: { f: [0, 1], fps: 1.6 } });

  // ---- abdomen: 70x46 (final 140x92), apunta a la IZQUIERDA (-x); engancha al torax por la derecha (64,23), la punta (donde va el aguijon) es (4,23).
  // 0 normal, 1 brillo (F3 / canal), 2 hinchado, 3 hinchado + grietas brillantes (Eclosion masiva)
  var ABDC = [[66, 16], [57, 9], [44, 6], [30, 8], [17, 12.4], [8, 19], [4, 23], [8, 27], [17, 33.6], [30, 38], [44, 40], [57, 37], [66, 30]];
  function abdPts(k) { return ABDC.map(function (p) { return [p[0], 23 + (p[1] - 23) * k]; }); }
  function abdomenDraw(f) {
    var sw = f >= 2, glow = f === 1 || f === 3, k = sw ? 1.34 : 1;
    return function (v) {
      var x = v.ctx, i, pts = abdPts(k), P = Pclosed(pts);
      v.part(P, M.amber, { lw: LW, sh: M.amberS, hi: M.amberH, so: 2.2 });
      x.save(); x.beginPath(); P(x); x.clip();
      x.fillStyle = M.blk; [[49, 56], [24, 29.5], [10.5, 14]].forEach(function (b) { x.fillRect(b[0], 0, b[1] - b[0], 46); x.fillStyle = M.blkH; x.fillRect(b[0], 0, 1.4, 46); x.fillStyle = M.blk; });
      x.fillStyle = 'rgba(130,64,0,0.34)'; x.beginPath(); x.ellipse(36, 23 + 21 * k, 40, 10 * k, 0, 0, TAU); x.fill();
      x.fillStyle = 'rgba(255,236,170,0.55)'; x.beginPath(); x.ellipse(34, 23 - 14 * k, 26, 3.2, 0, 0, TAU); x.fill();
      x.restore();
      // celdas luminosas de cera en las bandas ambar
      var cells = [[37, 23, 5.2], [37, 13.4, 4], [37, 32.6, 4], [19.4, 23, 4], [19.4, 15.8, 2.8], [19.4, 30.2, 2.8], [60, 23, 3.2]];
      cells.forEach(function (c, ci) {
        var cy = 23 + (c[1] - 23) * k;
        v.part(function (cc) { hexPath(cc, c[0], cy, c[2], 0); }, glow ? '#fff3b0' : M.cell, { lw: 0.9, ol: M.honeyS, sh: glow ? M.honeyH : M.honey, so: 0.4 });
        if (glow) { x.fillStyle = 'rgba(255,255,230,0.9)'; x.beginPath(); x.arc(c[0] - c[2] * 0.2, cy - c[2] * 0.2, c[2] * 0.35, 0, TAU); x.fill(); }
      });
      // toma del aguijon (punta)
      v.part(Pblob(7, 23, 3.4, 3.6 * k, 821, 0.05, 7), M.blk, { lw: 1.2, sh: M.blkS, hi: M.blkH, so: 0.4 });
      if (f === 3) {
        x.strokeStyle = OLC; x.lineWidth = 1.4; x.beginPath(); x.moveTo(44, 6.4); x.lineTo(41, 14); x.lineTo(45, 21); x.lineTo(40, 29); x.lineTo(43.4, 40); x.moveTo(27, 8); x.lineTo(29.6, 17); x.lineTo(25, 24); x.stroke();
        x.strokeStyle = 'rgba(255,248,200,0.95)'; x.lineWidth = 0.7; x.beginPath(); x.moveTo(44, 6.4); x.lineTo(41, 14); x.lineTo(45, 21); x.lineTo(40, 29); x.lineTo(43.4, 40); x.stroke();
      }
    };
  }
  addV('boss_reina_abdomen', 70, 46, [abdomenDraw(0), abdomenDraw(1), abdomenDraw(2), abdomenDraw(3)], { lw: LW }, { idle: { f: [0], fps: 1 }, glow: { f: [1], fps: 1 }, swollen: { f: [2, 3], fps: 4 } });

  // ---- aguijon: 24x12 (final 48x24), apunta a la IZQUIERDA; base (22,6), punta (1,6). 0 entero, 1 cargado (punta incandescente), 2 roto (munon)
  function stingDraw(f) {
    return function (v) {
      var x = v.ctx;
      if (f === 2) {
        v.part(Ppoly([[22, 2.4], [16, 3.4], [12.6, 4.4], [14.6, 5.6], [12.2, 7], [15, 8.2], [16, 9.4], [22, 9.8]]), M.blk, { lw: 1.5, sh: M.blkS, hi: M.blkH, so: 0.5 });
        v.dot(13.4, 6.2, 1.4, M.honeyH); x.strokeStyle = 'rgba(255,230,160,0.9)'; x.lineWidth = 0.6; x.beginPath(); x.moveTo(13, 4.8); x.lineTo(14.6, 6); x.lineTo(13, 7.2); x.stroke();
        return;
      }
      v.part(Ppoly([[22.4, 2], [16, 3], [11.4, 4.2], [8, 3.4], [9, 4.8], [5, 5.2], [1, 6], [5, 6.8], [9, 7.2], [8, 8.6], [11.4, 7.8], [16, 9], [22.4, 10]]), f ? '#5a2a12' : M.blk, { lw: 1.5, sh: M.blkS, hi: M.blkH, so: 0.5 });
      v.part(Pblob(20.6, 6, 3.4, 4.6, 831, 0.05, 8), M.amberS, { lw: 1.3, sh: '#7a4408', hi: M.amberH, so: 0.4 });
      if (f) {
        x.fillStyle = 'rgba(255,170,60,0.85)'; x.beginPath(); x.moveTo(1, 6); x.lineTo(9, 4.4); x.lineTo(9, 7.6); x.closePath(); x.fill();
        x.fillStyle = 'rgba(255,255,230,0.95)'; x.beginPath(); x.moveTo(1.4, 6); x.lineTo(5.4, 5.2); x.lineTo(5.4, 6.8); x.closePath(); x.fill();
      } else v.line(7, 5.4, 15, 4.6, 0.6, '#9a6a3a');
    };
  }
  addV('boss_reina_sting', 24, 12, [stingDraw(0), stingDraw(1), stingDraw(2)], { lw: LW }, { whole: { f: [0], fps: 1 }, charged: { f: [1], fps: 1 }, broken: { f: [2], fps: 1 } });

  // ---- cabeza: 34x32 (final 68x64), mira a la DERECHA. Sin antenas (se dibujan en el compuesto) ni brillo de ojos (sprite aparte).
  // 0 neutra, 1 zumbido (mandibulas abiertas), 2 herida (ojo entrecerrado), 3 aturdida/abatida. Cuello (4,18); ojo compuesto (23,12)
  function headDraw(f) {
    return function (v) {
      var x = v.ctx, i;
      for (i = 0; i < 6; i++) v.part(Ppoly([[6 + i * 3.2, 6.6], [8 + i * 3.2 + (i - 2) * 0.5, 1.6 + Math.abs(i - 2) * 1.4], [10.4 + i * 3.2, 6.6]]), i % 2 ? M.amber : M.amberH, { lw: 1.2, sh: M.amberS, so: 0.3 });
      v.part(Pblob(16, 17.5, 14, 12.4, 841, 0.04, 11), M.blk, { lw: LW, sh: M.blkS, hi: M.blkH, so: 1.8 });
      for (i = 0; i < 5; i++) v.part(Ppoly([[4, 18 + i * 2.6 - 4], [-0.6 + (i % 2), 20 + i * 2.6 - 4], [5, 22.4 + i * 2.6 - 4]]), M.amber, { lw: 1, sh: M.amberS, so: 0.3 });   // pelusa de la nuca
      v.part(Pblob(11, 25, 5.6, 4.4, 842, 0.06, 8), M.amber, { lw: 1.2, sh: M.amberS, hi: M.amberH, so: 0.6 });                                          // moflete
      // ojo compuesto grande (oscuro; el color lo pone boss_reina_eyes)
      v.part(Pblob(23, 12, 8.6, 7.6, 843, 0.03, 10, -0.3), '#1b1530', { lw: 1.4, sh: '#0e0a1c', so: 0.6 });
      x.strokeStyle = 'rgba(120,100,170,0.5)'; x.lineWidth = 0.5; for (i = 0; i < 3; i++) { x.beginPath(); x.moveTo(16.4, 9 + i * 2.8); x.lineTo(29, 7 + i * 2.8); x.stroke(); }
      // mandibulas
      if (f === 1) {
        v.part(Ppoly([[24, 24], [30, 24.4], [33, 30], [29.6, 30.4], [27, 27]]), M.wax, { lw: 1.2, sh: M.waxS, so: 0.4 }); v.part(Ppoly([[21, 25], [26, 27], [25, 31], [20.6, 29]]), M.wax, { lw: 1.2, sh: M.waxS, so: 0.4 });
        v.part(Ppoly([[22, 24], [29, 24.4], [29, 27], [22, 26.6]]), '#5a1a14', { lw: 0.8, so: 0 });
      } else if (f === 3) {
        v.part(Ppoly([[24, 25], [29, 25.6], [30, 28.4], [26, 28]]), M.wax, { lw: 1.2, sh: M.waxS, so: 0.3 });
      } else {
        v.part(Ppoly([[24, 24], [30, 25], [31, 29.6], [28.4, 28.4], [25.6, 27.6]]), M.wax, { lw: 1.2, sh: M.waxS, so: 0.4 }); v.part(Ppoly([[22, 25.6], [26, 27], [25, 30], [21.6, 28.4]]), M.wax, { lw: 1.2, sh: M.waxS, so: 0.4 });
      }
      if (f === 2) { x.strokeStyle = OLC; x.lineWidth = 1.6; x.lineCap = 'round'; x.beginPath(); x.moveTo(17.4, 9.6); x.lineTo(29, 14); x.stroke(); x.strokeStyle = '#fff'; x.lineWidth = 0.7; x.beginPath(); x.moveTo(19, 4); x.lineTo(21, 9); x.lineTo(19, 13); x.stroke(); }
      if (f === 3) { x.strokeStyle = M.amberH; x.lineWidth = 1.2; x.lineCap = 'round'; x.beginPath(); x.moveTo(19, 9); x.lineTo(27, 15); x.moveTo(27, 9); x.lineTo(19, 15); x.stroke(); }
    };
  }
  addV('boss_reina_head', 34, 32, [headDraw(0), headDraw(1), headDraw(2), headDraw(3)], { lw: LW }, { idle: { f: [0], fps: 1 }, buzz: { f: [1], fps: 1 }, hurt: { f: [2], fps: 1 }, down: { f: [3], fps: 1 } });

  // ---- ojos (brillo de color sobre el ojo compuesto): 16x9 (final 32x18). 0 verde palido (F1), 1 ambar (F2), 2 blanco-rosado (F3). Sin rojo
  function eyesDraw(f) {
    var c = EYE[f];
    return function (v) {
      var x = v.ctx;
      v.part(Pblob(8, 4.6, 6.8, 3.6, 851 + f, 0.03, 10, -0.28), c[0], { lw: 0.9, ol: '#1b1530', sh: f === 1 ? '#c88a10' : (f === 0 ? '#7ab860' : '#e0a8c8'), hi: c[1], so: 0.6 });
      x.strokeStyle = 'rgba(40,24,10,0.45)'; x.lineWidth = 0.4; x.beginPath(); for (var i = 0; i < 4; i++) { x.moveTo(3 + i * 3, 2.2 + i * 0.2); x.lineTo(4 + i * 3, 7); } x.stroke();
      v.ctx.fillStyle = 'rgba(30,18,6,0.8)'; x.beginPath(); x.ellipse(9.4, 4.6, 0.9, 2.6, -0.2, 0, TAU); x.fill();
      v.dot(5.6, 3.2, 1.1, '#ffffff');
    };
  }
  addV('boss_reina_eyes', 16, 9, [eyesDraw(0), eyesDraw(1), eyesDraw(2)], { lw: 0.6 }, { phase1: { f: [0], fps: 1 }, phase2: { f: [1], fps: 1 }, phase3: { f: [2], fps: 1 } });

  // ---- corona de cera con jalea real: 22x17 (final 44x34). 0 entera, 1 brillo (canal de Jalea real), 2 rota (munon + gota). Base-centro (11,16)
  function crownDraw(f) {
    return function (v) {
      var x = v.ctx, i;
      if (f === 2) {
        v.part(Ppoly([[2.4, 16], [2.8, 10.4], [5.6, 12], [7, 8.6], [9.4, 11.4], [12.4, 9.6], [15, 12], [18.4, 10.6], [19.6, 16]]), M.wax, { lw: 1.6, sh: M.waxS, hi: '#ffffff', so: 0.8 });
        v.part(Ppoly([[2.4, 12.8], [19.6, 12.8], [19.6, 16], [2.4, 16]]), M.amber, { lw: 1.3, sh: M.amberS, so: 0.5 });
        v.part(Pblob(11, 11.4, 2.2, 1.3, 861, 0.06, 7), M.honey, { lw: 1, sh: M.honeyS, so: 0.3 }); v.part(Ppoly([[10, 12], [12, 12], [11.6, 15.6], [10.4, 15.6]]), M.honeyH, { lw: 0.7, so: 0 });
        return;
      }
      if (f === 1) { x.fillStyle = 'rgba(255,250,200,0.45)'; x.beginPath(); x.arc(11, 8, 11, 0, TAU); x.fill(); }
      v.part(Ppoly([[2.4, 16], [1.6, 4.4], [5.6, 9], [8.4, 2.2], [11, 8.4], [13.6, 2.2], [16.4, 9], [20.4, 4.4], [19.6, 16]]), M.wax, { lw: LW * 0.82, sh: M.waxS, hi: '#ffffff', so: 1 });
      [[1.6, 4.4], [8.4, 2.2], [13.6, 2.2], [20.4, 4.4]].forEach(function (p, k) { v.part(Pblob(p[0], p[1] - 0.6, 1.9, 1.9, 862 + k, 0.05, 7), f ? '#fff6c0' : M.amber, { lw: 1, sh: M.amberS, hi: M.amberH, so: 0.4 }); });
      v.part(Ppoly([[2.4, 12.6], [19.6, 12.6], [19.8, 16.4], [2.2, 16.4]]), M.amber, { lw: 1.3, sh: M.amberS, hi: M.amberH, so: 0.6 });
      v.part(Pblob(11, 9, 2.7, 3.2, 866, 0.05, 8), f ? '#ffffff' : M.jelly, { lw: 1.1, sh: f ? '#ffe9a0' : '#e8dcb0', hi: '#ffffff', so: 0.5 });
      v.dot(10.2, 8, 0.8, '#ffffff');
      for (i = 0; i < 3; i++) v.dot(5 + i * 6, 14.4, 0.7, M.honeyS);
    };
  }
  addV('boss_reina_crown', 22, 17, [crownDraw(0), crownDraw(1), crownDraw(2)], { lw: LW }, { whole: { f: [0], fps: 1 }, glow: { f: [1], fps: 1 }, broken: { f: [2], fps: 1 } });

  // ---- alas: translucidas. wing_front 66x36 (final 132x72), wing_back 58x32 (116x64). Apuntan a la DERECHA, raiz a la izquierda (3,18)/(3,16).
  // 0-3 ciclo de aleteo (escorzo del ancho), 4 rota (muñon desgarrado)
  var WK = [1, 0.84, 0.62, 0.84];
  function wingDraw(back, f) {
    var L = back ? 58 : 66, Hh = back ? 32 : 36, ay = Hh / 2;
    return function (v) {
      var x = v.ctx, i, k = f < 4 ? WK[f] : 1;
      function Y(y) { return ay + (y - ay) * k; }
      var s = L / 66;
      var pts = back ? [[3, 16], [10, 6], [26, 2], [44, 5], [56, 12], [52, 21], [38, 28], [20, 29], [8, 24]] : [[3, 18], [14, 6], [34, 2], [54, 6], [64, 13], [60, 22], [46, 29], [26, 31], [10, 26]];
      function pathW() { x.beginPath(); x.moveTo(pts[0][0], Y(pts[0][1])); for (var j = 1; j < pts.length; j++) { var p = pts[j], q = pts[(j + 1) % pts.length], m = [(p[0] + q[0]) / 2, (Y(p[1]) + Y(q[1])) / 2]; x.quadraticCurveTo(p[0], Y(p[1]), m[0], m[1]); } x.closePath(); }
      if (f === 4) {
        x.beginPath(); x.moveTo(3, ay); x.lineTo(10, ay - 10); x.lineTo(17, ay - 4); x.lineTo(21, ay - 11); x.lineTo(27, ay - 1); x.lineTo(30, ay + 6); x.lineTo(23, ay + 4); x.lineTo(20, ay + 11); x.lineTo(13, ay + 6); x.lineTo(8, ay + 10); x.closePath();
        x.fillStyle = 'rgba(233,244,255,0.5)'; x.fill(); x.strokeStyle = 'rgba(27,17,36,0.9)'; x.lineWidth = 1.5; x.stroke();
        x.strokeStyle = 'rgba(122,152,184,0.9)'; x.lineWidth = 0.7; x.beginPath(); x.moveTo(3, ay); x.lineTo(24, ay - 3); x.moveTo(8, ay + 1); x.lineTo(20, ay + 8); x.stroke();
        x.strokeStyle = 'rgba(233,244,255,0.7)'; x.lineWidth = 0.8; x.beginPath(); x.moveTo(27, ay - 1); x.quadraticCurveTo(34, ay + 5, 32, ay + 14); x.moveTo(21, ay - 11); x.quadraticCurveTo(26, ay - 18, 24, ay - 22); x.stroke();
        v.part(Pblob(4.4, ay, 3.4, 3, 871 + (back ? 1 : 0), 0.05, 7), M.blk, { lw: 1.2, sh: M.blkS, so: 0.3 });
        return;
      }
      var g = x.createLinearGradient(0, 0, L, 0); g.addColorStop(0, 'rgba(200,225,250,0.82)'); g.addColorStop(0.6, 'rgba(233,244,255,0.62)'); g.addColorStop(1, 'rgba(255,255,255,0.5)');
      pathW(); x.fillStyle = g; x.fill();
      x.save(); pathW(); x.clip();
      x.fillStyle = 'rgba(255,255,255,0.4)'; x.beginPath(); x.ellipse(L * 0.5, Y(ay - 9), L * 0.36, 3.2 * k, -0.06, 0, TAU); x.fill();
      x.strokeStyle = 'rgba(122,152,184,0.85)'; x.lineWidth = 0.7;
      x.beginPath(); x.moveTo(3, ay); x.quadraticCurveTo(L * 0.5, Y(ay - 8), L - 4, Y(ay - 3));
      x.moveTo(3, ay); x.quadraticCurveTo(L * 0.5, Y(ay + 1), L - 8, Y(ay + 8));
      x.moveTo(3, ay); x.quadraticCurveTo(L * 0.4, Y(ay + 9), L * 0.7, Y(ay + 13));
      for (i = 1; i < 5; i++) { var cx = 8 + i * (L - 18) / 5; x.moveTo(cx, Y(ay - 7 + i)); x.lineTo(cx + 2, Y(ay + 9)); }
      x.stroke();
      x.restore();
      pathW(); x.strokeStyle = 'rgba(27,17,36,0.9)'; x.lineWidth = 1.5; x.stroke();
      pathW(); x.strokeStyle = 'rgba(255,255,255,0.8)'; x.lineWidth = 0.6; x.save(); x.translate(-0.3, -0.5); x.stroke(); x.restore();
      v.part(Pblob(4.6, ay, 3.6, 3.2, 871 + (back ? 1 : 0), 0.05, 7), M.blk, { lw: 1.2, sh: M.blkS, so: 0.3 });
    };
  }
  var WA = { flap: { f: [0, 1, 2, 3], fps: 24 }, broken: { f: [4], fps: 1 } };
  addV('boss_reina_wing_front', 66, 36, [0, 1, 2, 3, 4].map(function (f) { return wingDraw(false, f); }), { lw: LW }, WA);
  addV('boss_reina_wing_back', 58, 32, [0, 1, 2, 3, 4].map(function (f) { return wingDraw(true, f); }), { lw: LW }, WA);

  // ---- patas: 3 patas por lado, 40x32 (final 80x64). 0 colgando A, 1 colgando B, 2 recogidas, 3 abiertas (aterrizada). 4-7 igual pero lado lejano (oscuro). Caderas y=3
  var LEGP = [
    [[[8, 3], [3, 13], [5, 27]], [[20, 3], [18, 14], [20, 29]], [[32, 3], [36, 12], [36, 25]]],
    [[[8, 3], [5, 14], [9, 27]], [[20, 3], [22, 15], [24, 28]], [[32, 3], [34, 14], [33, 26]]],
    [[[8, 3], [1, 8], [6, 14]], [[20, 3], [14, 11], [19, 16]], [[32, 3], [38, 9], [34, 15]]],
    [[[8, 3], [0, 14], [1, 29]], [[20, 3], [19, 16], [20, 30]], [[32, 3], [39, 14], [38, 29]]]
  ];
  function legsDraw(f) {
    var far = f >= 4, set = LEGP[f % 4], col = far ? '#1a110a' : M.blk, hi = far ? '#3a2616' : M.blkH;
    return function (v) {
      set.forEach(function (lg, i) {
        v.stick(lg, 2.6, col, { lw: 1.3, hi: hi, curve: true });
        var e = lg[2]; v.part(Ppoly([[e[0] - 2, e[1] - 1], [e[0] + (i === 2 ? 2.4 : -0.6), e[1] + 2.6], [e[0] + 2, e[1] - 1]]), col, { lw: 1, so: 0 });
        var k = lg[1]; v.dot(k[0], k[1], 1.5, far ? M.amberS : M.amber);
      });
    };
  }
  addV('boss_reina_legs', 40, 32, [0, 1, 2, 3, 4, 5, 6, 7].map(legsDraw), { lw: LW }, { hang: { f: [0, 1], fps: 2 }, tucked: { f: [2], fps: 1 }, splay: { f: [3], fps: 1 }, hang_far: { f: [4, 5], fps: 2 } });

  // ---- retrato 48x48 (final 96): 0 neutro, 1 furia (ojos blanco-rosado, brillo), 2 herido
  function portraitDraw(f) {
    return function (v) {
      var x = v.ctx, hot = f === 1, i;
      v.part(Prr(1.4, 1.4, 45.2, 45.2, 6), hot ? '#5a3010' : '#3a2208', { lw: 2, ol: OLC, sh: '#1c1004', so: 1.4 });
      x.save(); x.beginPath(); Prr(2.4, 2.4, 43.2, 43.2, 5)(x); x.clip();
      var g = x.createRadialGradient(24, 24, 2, 24, 24, 32); g.addColorStop(0, hot ? 'rgba(255,230,150,0.75)' : 'rgba(255,190,60,0.5)'); g.addColorStop(1, 'rgba(0,0,0,0)'); x.fillStyle = g; x.fillRect(0, 0, 48, 48);
      x.strokeStyle = 'rgba(255,200,90,0.28)'; x.lineWidth = 0.8; for (i = 0; i < 12; i++) { x.beginPath(); hexPath(x, 6 + (i % 4) * 13 + (Math.floor(i / 4) % 2) * 6.5, 6 + Math.floor(i / 4) * 12, 7.4, 0); x.stroke(); }
      var hs = A.sprite('boss_reina_head', f === 2 ? 2 : (hot ? 1 : 0)), cr = A.sprite('boss_reina_crown', hot ? 1 : 0), es = A.sprite('boss_reina_eyes', hot ? 2 : 0), k = 0.94, hx = 7, hy = 16;
      x.lineCap = 'round'; x.beginPath(); x.moveTo(hx + 26 * k, hy + 5); x.quadraticCurveTo(hx + 31 * k, hy - 3, hx + 38 * k, hy - 2); x.strokeStyle = OLC; x.lineWidth = 3.2; x.stroke(); x.strokeStyle = M.blk; x.lineWidth = 1.5; x.stroke();
      v.dot(hx + 38 * k, hy - 2, 1.9, M.amber);
      x.drawImage(hs, hx, hy, hs.width / 2 * k, hs.height / 2 * k);
      if (f !== 2) x.drawImage(es, hx + 15 * k, hy + 7.4 * k, es.width / 2 * k, es.height / 2 * k);
      x.drawImage(cr, hx + 6.6 * k, hy - 10.6 * k, cr.width / 2 * k, cr.height / 2 * k);
      x.restore();
      if (f === 2) { x.strokeStyle = '#ffffff'; x.lineWidth = 0.9; x.beginPath(); x.moveTo(33, 4); x.lineTo(30, 12); x.lineTo(34, 19); x.lineTo(31, 27); x.stroke(); }
      v.part(Prr(1.4, 1.4, 45.2, 45.2, 6), 'rgba(0,0,0,0)', { lw: 2, ol: OLC });
      x.strokeStyle = hot ? '#ffe9a0' : M.amber; x.lineWidth = 0.9; x.beginPath(); Prr(3.2, 3.2, 41.6, 41.6, 4.4)(x); x.stroke();
    };
  }
  addV('boss_reina_portrait', 48, 48, [portraitDraw(0), portraitDraw(1), portraitDraw(2)], { lw: LW }, { neutral: { f: [0], fps: 1 }, rage: { f: [1], fps: 1 }, hurt: { f: [2], fps: 1 } });
  H.reg['boss_melaria_portrait'] = H.reg['boss_reina_portrait'];   // alias: drawBossPortrait('melaria') busca boss_melaria_portrait

  // ---- trofeos 16x16 (final 32): 0 normal, 1 ROTO (gris con aspa roja)
  function trophyDraw(kind, broken) {
    return function (v) {
      var x = v.ctx;
      v.part(Prr(1, 1, 14, 14, 3), '#3a2208', { lw: 1.2, sh: '#1c1004', so: 0.5 });
      x.save(); if (broken) x.globalAlpha = 0.45;
      if (kind === 'wing') { var ws = A.sprite('boss_reina_wing_front', 0); x.save(); x.translate(2.6, 11.6); x.rotate(-0.78); x.drawImage(ws, 0, -ws.height / 2 * 0.2, ws.width / 2 * 0.2, ws.height / 2 * 0.2); x.restore(); x.save(); x.translate(3.4, 12.6); x.rotate(-0.28); x.globalAlpha *= 0.8; x.drawImage(ws, 0, -ws.height / 2 * 0.15, ws.width / 2 * 0.16, ws.height / 2 * 0.15); x.restore(); }
      else if (kind === 'sting') { var ss = A.sprite('boss_reina_sting', 0); x.save(); x.translate(8, 8); x.rotate(-0.7); x.scale(0.5, 0.5); x.drawImage(ss, -12, -6, ss.width / 2, ss.height / 2); x.restore(); }
      else { var cs = A.sprite('boss_reina_crown', 0); x.drawImage(cs, 2.4, 2, cs.width / 2 * 0.58, cs.height / 2 * 0.58); v.part(Pblob(8, 11.4, 3.2, 2.6, 881, 0.05, 7), '#fffbe8', { lw: 0.8, sh: '#e8dcb0', hi: '#fff', so: 0.3 }); }
      x.restore();
      if (broken) { x.strokeStyle = OLC; x.lineWidth = 3.2; x.beginPath(); x.moveTo(3, 3); x.lineTo(13, 13); x.moveTo(13, 3); x.lineTo(3, 13); x.stroke(); x.strokeStyle = '#ff3b30'; x.lineWidth = 1.8; x.stroke(); }
      x.strokeStyle = broken ? '#7a8294' : M.amber; x.lineWidth = 0.7; x.beginPath(); Prr(1.8, 1.8, 12.4, 12.4, 2.6)(x); x.stroke();
    };
  }
  [['wing', 'wing'], ['sting', 'sting'], ['jelly', 'jelly']].forEach(function (k) {
    addV('trophy_reina_' + k[0], 16, 16, [trophyDraw(k[1], false), trophyDraw(k[1], true)], { lw: 1 }, { ok: { f: [0], fps: 1 }, broken: { f: [1], fps: 1 } });
  });
  // icono "inmune" (Veneno inmune a estados): gota barrada dentro de escudo. 12x12 base (24 final)
  addV('icon_immune', 12, 12, [function (v) {
    var x = v.ctx;
    v.part(Pblob(6, 6, 5, 5, 891, 0.02, 10), '#6a6272', { lw: 1.3, sh: '#403a48', hi: '#9a92a8', so: 0.5 });
    x.fillStyle = '#c9f0a0'; x.beginPath(); x.moveTo(6, 2.4); x.quadraticCurveTo(9.2, 6.2, 6, 9.2); x.quadraticCurveTo(2.8, 6.2, 6, 2.4); x.fill();
    x.strokeStyle = OLC; x.lineWidth = 2.2; x.lineCap = 'round'; x.beginPath(); x.moveTo(2.4, 9.6); x.lineTo(9.6, 2.4); x.stroke(); x.strokeStyle = '#ff3b30'; x.lineWidth = 1.2; x.stroke();
  }], { lw: 1 });

  // ================================================================= VFX propios (sprites)
  // gota de jalea real / cruz de curacion: 12x12 base (24? no: 24x24 final = 12x12 base) -> aqui 24x24 base (48 final)
  addV('fx_royal_jelly', 24, 24, [0, 1, 2, 3].map(function (k) {
    return function (v) {
      var x = v.ctx, a = 0.9 - k * 0.1, rr = 7 + (k % 2);
      x.fillStyle = 'rgba(120,230,150,' + (0.5 - k * 0.05) + ')'; x.beginPath(); x.arc(12, 12, 11, 0, TAU); x.fill();
      x.strokeStyle = OLC; x.lineWidth = 5.4; x.lineCap = 'round'; x.beginPath(); x.moveTo(12, 12 - rr); x.lineTo(12, 12 + rr); x.moveTo(12 - rr, 12); x.lineTo(12 + rr, 12); x.stroke();
      x.strokeStyle = 'rgba(244,255,236,' + a + ')'; x.lineWidth = 3.6; x.stroke();
      x.strokeStyle = 'rgba(40,190,100,' + a + ')'; x.lineWidth = 1.6; x.stroke();
      v.part(Pblob(12 + (k - 1.5) * 0.4, 12, 2.6, 3, 901 + k, 0.05, 7), M.jelly, { lw: 0.9, sh: '#e8dcb0', hi: '#fff', so: 0.3 });
    };
  }), { lw: 1 }, { loop: { f: [0, 1, 2, 3], fps: 8 } });

  // hexagono (celda) de aro para anillos y avisos: 64x56 base (final 128x112), hexagono plano de radio 30. 0 reposo, 1 aviso rojo, 2 golpe
  addV('fx_hex_ring', 64, 56, [0, 1, 2].map(function (k) {
    return function (v) {
      var x = v.ctx;
      if (k) { x.fillStyle = k === 1 ? 'rgba(255,59,48,0.32)' : 'rgba(255,230,210,0.62)'; x.beginPath(); hexPath(x, 32, 28, 29, 0); x.fill(); }
      x.strokeStyle = OLC; x.lineWidth = 4.2; x.beginPath(); hexPath(x, 32, 28, 29, 0); x.stroke();
      x.strokeStyle = k === 0 ? '#7a4a14' : (k === 1 ? '#ff6a5a' : '#ffffff'); x.lineWidth = 2.4; if (k === 0) x.setLineDash([6, 4]); x.beginPath(); hexPath(x, 32, 28, 29, 0); x.stroke(); x.setLineDash([]);
      if (k === 0) { x.strokeStyle = 'rgba(255,255,255,0.35)'; x.lineWidth = 0.8; x.beginPath(); hexPath(x, 32, 28, 26, 0); x.stroke(); }
    };
  }), { lw: 1 }, { idle: { f: [0], fps: 1 }, warn: { f: [1], fps: 1 }, hit: { f: [2], fps: 1 } });

  // aro hexagonal de ventana (blanco azulado, el ambar/dorado de la Reina no sirve): 64x64 base (final 128), 4 frames girando
  addV('fx_melaria_window', 64, 64, [0, 1, 2, 3].map(function (k) {
    return function (v) {
      var x = v.ctx, i;
      x.strokeStyle = OLC; x.lineWidth = 5; x.beginPath(); hexPath(x, 32, 32, 28, 0); x.stroke();
      x.strokeStyle = '#e6f7ff'; x.lineWidth = 3; x.setLineDash([9, 5]); x.lineDashOffset = -k * 3.5; x.beginPath(); hexPath(x, 32, 32, 28, 0); x.stroke(); x.setLineDash([]);
      x.strokeStyle = 'rgba(160,215,255,0.75)'; x.lineWidth = 1; x.beginPath(); hexPath(x, 32, 32, 24, 0); x.stroke();
      for (i = 0; i < 6; i++) { var a = i * PI / 3 + k * 0.1; v.dot(32 + cos(a) * 28, 32 + sin(a) * 28, 1.9, '#ffffff'); }
    };
  }), { lw: 1 }, { loop: { f: [0, 1, 2, 3], fps: 8 } });

  // cupula de celdas (puerta de fase inmune): 64x64 base, hexagonos translucidos blanco azulado
  addV('fx_melaria_shield', 64, 64, [function (v) {
    var x = v.ctx, i, j, gr = x.createRadialGradient(32, 32, 10, 32, 32, 31); gr.addColorStop(0, 'rgba(230,247,255,0.04)'); gr.addColorStop(1, 'rgba(200,235,255,0.42)');
    x.fillStyle = gr; x.beginPath(); x.arc(32, 32, 31, 0, TAU); x.fill();
    x.save(); x.beginPath(); x.arc(32, 32, 30, 0, TAU); x.clip(); x.strokeStyle = 'rgba(235,250,255,0.85)'; x.lineWidth = 1;
    for (j = -1; j < 7; j++) for (i = -1; i < 6; i++) { x.beginPath(); hexPath(x, i * 13.6 + (j % 2) * 6.8, j * 11.8, 7.4, 0); x.stroke(); }
    x.restore();
    x.strokeStyle = OLC; x.lineWidth = 2.4; x.beginPath(); x.arc(32, 32, 30.4, 0, TAU); x.stroke(); x.strokeStyle = '#e6f7ff'; x.lineWidth = 1.4; x.stroke();
  }], { lw: 1 });

  // gota de miel que cuelga y cae: 8x16 base (final 16x32). 0 colgando, 1 estirandose, 2 cayendo (punta abajo)
  addV('fx_melaria_drip', 8, 16, [0, 1, 2].map(function (k) {
    return function (v) {
      var x = v.ctx;
      if (k === 0) { v.part(Pblob(4, 3, 3.2, 2.6, 911, 0.05, 7), M.honey, { lw: 1, sh: M.honeyS, hi: M.honeyH, so: 0.4 }); v.part(Ppoly([[2.2, 3], [5.8, 3], [4.6, 9], [3.4, 9]]), M.honey, { lw: 0.9, sh: M.honeyS, so: 0.3 }); v.part(Pblob(4, 10, 2.2, 2.6, 912, 0.05, 7), M.honey, { lw: 0.9, sh: M.honeyS, hi: M.honeyH, so: 0.3 }); }
      else if (k === 1) { v.part(Ppoly([[2, 2], [6, 2], [4.8, 8], [4.4, 13], [3.6, 13], [3.2, 8]]), M.honey, { lw: 1, sh: M.honeyS, hi: M.honeyH, so: 0.3 }); v.part(Pblob(4, 13, 2.6, 2.4, 913, 0.05, 7), M.honey, { lw: 0.9, sh: M.honeyS, hi: M.honeyH, so: 0.3 }); }
      else { v.part(Ppoly([[4, 1.6], [6.4, 8], [5.4, 13], [2.6, 13], [1.6, 8]]), M.honey, { lw: 1, sh: M.honeyS, hi: M.honeyH, so: 0.4 }); }
      v.dot(3.2, 6, 0.8, '#ffe9a0');
    };
  }), { lw: 1 }, { hang: { f: [0], fps: 1 }, stretch: { f: [1], fps: 1 }, fall: { f: [2], fps: 1 } });

  // esquirlas: 16x16 base (final 32). 0 cera, 1 retal de ala, 2 astilla de aguijon, 3 gota de jalea, 4 trozo hexagonal de miel, 5 trozo hexagonal de cera
  addV('fx_melaria_chip', 16, 16, [0, 1, 2, 3, 4, 5].map(function (k) {
    return function (v) {
      var x = v.ctx;
      if (k === 0) v.part(Ppoly([[2, 11], [4, 3], [11, 2], [13.6, 9], [8, 14]]), M.wax, { lw: 1.4, sh: M.waxS, hi: '#fff', so: 0.7 });
      else if (k === 1) { x.fillStyle = 'rgba(233,244,255,0.78)'; x.strokeStyle = OLC; x.lineWidth = 1.2; x.beginPath(); x.moveTo(2, 12); x.lineTo(5, 3); x.lineTo(12, 2); x.lineTo(14, 8); x.lineTo(8, 14); x.closePath(); x.fill(); x.stroke(); x.strokeStyle = M.vein; x.lineWidth = 0.6; x.beginPath(); x.moveTo(3, 11); x.lineTo(11, 4); x.stroke(); }
      else if (k === 2) v.part(Ppoly([[2, 13], [5, 6], [13, 2], [11, 9], [6, 14]]), M.blk, { lw: 1.3, sh: M.blkS, hi: M.blkH, so: 0.5 });
      else if (k === 3) { v.part(Pblob(8, 9, 4.2, 5, 921, 0.05, 8), M.jelly, { lw: 1.2, sh: '#e8dcb0', hi: '#fff', so: 0.6 }); v.dot(6.6, 7.4, 1, '#fff'); }
      else v.part(function (c) { hexPath(c, 8, 8, 6.2, 0.3); }, k === 4 ? M.honey : M.wax, { lw: 1.4, sh: k === 4 ? M.honeyS : M.waxS, hi: k === 4 ? M.honeyH : '#fff', so: 0.7 });
    };
  }), { lw: 1.2 }, { wax: { f: [0], fps: 1 }, wing: { f: [1], fps: 1 }, sting: { f: [2], fps: 1 }, jelly: { f: [3], fps: 1 }, honeyhex: { f: [4], fps: 1 }, waxhex: { f: [5], fps: 1 } });

  // anillo de zumbido (ondas sonoras ambar/blanco): 32x32 base (final 64), 4 frames
  addV('fx_melaria_buzz', 32, 32, [0, 1, 2, 3].map(function (k) {
    return function (v) {
      var x = v.ctx, R0 = 11 + k * 1.4;
      x.strokeStyle = 'rgba(255,190,60,' + (0.4 - k * 0.05) + ')'; x.lineWidth = 6; x.beginPath(); x.arc(16, 16, R0, 0, TAU); x.stroke();
      x.strokeStyle = 'rgba(255,248,210,0.9)'; x.lineWidth = 2; x.setLineDash([5, 3]); x.lineDashOffset = -k * 2; x.beginPath(); x.arc(16, 16, R0, 0, TAU); x.stroke(); x.setLineDash([]);
    };
  }), { lw: 1 }, { loop: { f: [0, 1, 2, 3], fps: 10 } });

  // aguijon que dispara la Lluvia de aguijones: 14x6 base (final 28x12), apunta a la DERECHA. 2 frames (brillo de punta)
  addV('proj_boss_quill', 14, 6, [0, 1].map(function (k) {
    return function (v) {
      var x = v.ctx;
      v.part(Ppoly([[0.6, 1.6], [8, 1.2], [13.4, 3], [8, 4.8], [0.6, 4.4], [2.4, 3]]), M.blk, { lw: 1.1, sh: M.blkS, hi: M.blkH, so: 0.3 });
      x.fillStyle = k ? 'rgba(255,230,140,1)' : 'rgba(255,170,60,0.95)'; x.beginPath(); x.moveTo(13.4, 3); x.lineTo(9.6, 2); x.lineTo(9.6, 4); x.closePath(); x.fill();
      v.line(2.4, 3, 8, 3, 0.6, M.amber);
    };
  }), { lw: 1 }, { loop: { f: [0, 1], fps: 12 } });

  // ================================================================= infraestructura de render (canvas compartido + rect sucio)
  var CVS = {};
  function getR(id, W, Hh, OX, OY) { return CVS[id] || (CVS[id] = { cv: mkc(W, Hh), box: null, W: W, H: Hh, OX: OX, OY: OY }); }
  function beginR(R) {
    var x = R.cv.getContext('2d'); x.setTransform(1, 0, 0, 1, 0, 0); x.globalCompositeOperation = 'source-over'; x.globalAlpha = 1;
    if (R.box) x.clearRect(R.box.x, R.box.y, R.box.w, R.box.h); else x.clearRect(0, 0, R.W, R.H);
    x.imageSmoothingEnabled = true; R.bb = { x0: 1e9, y0: 1e9, x1: -1e9, y1: -1e9 }; return x;
  }
  function extR(R, x0, y0, x1, y1) { var b = R.bb; b.x0 = Math.min(b.x0, R.OX + x0); b.y0 = Math.min(b.y0, R.OY + y0); b.x1 = Math.max(b.x1, R.OX + x1); b.y1 = Math.max(b.y1, R.OY + y1); }
  function endR(R) {
    var b = R.bb, x0 = clamp(Math.floor(b.x0) - 3, 0, R.W), y0 = clamp(Math.floor(b.y0) - 3, 0, R.H), x1 = clamp(Math.ceil(b.x1) + 3, 0, R.W), y1 = clamp(Math.ceil(b.y1) + 3, 0, R.H);
    R.box = { x: x0, y: y0, w: Math.max(1, x1 - x0), h: Math.max(1, y1 - y0) }; return R.box;
  }
  var GL = {};
  function glowSpr(col) {
    if (GL[col]) return GL[col]; var c = mkc(64, 64), g = c.getContext('2d'), gr = g.createRadialGradient(32, 32, 0, 32, 32, 32); gr.addColorStop(0, 'rgba(' + col + ',1)'); gr.addColorStop(1, 'rgba(' + col + ',0)'); g.fillStyle = gr; g.fillRect(0, 0, 64, 64); return (GL[col] = c);
  }
  function glowAt(x, px, py, r, col, a, ry) { var ga = x.globalAlpha; x.globalAlpha = ga * clamp(a, 0, 1); x.drawImage(glowSpr(col), px - r, py - (ry || r), r * 2, (ry || r) * 2); x.globalAlpha = ga; }

  // ================================================================= POSE
  var GY = 84, MDEATH = 3500, HOVER = 40, REST = -0.49;
  var PIV = [-38, 14], HEAD0 = [66, -12], NECK = [44, 0];
  var MNAMES = ['estocada', 'picado', 'lluvia', 'llamada', 'panal', 'torbellino', 'jalea', 'eclosion', 'alazo', 'zumbido'];
  var WROOT = { nf: [14, -32], nb: [-6, -34], ff: [8, -37], fb: [-12, -38] };

  function tipDelta(la) {   // angulo de la punta (marco del jefe, mira a +x) -> rotacion del abdomen
    la = ((la % TAU) + TAU + PI) % TAU - PI;
    if (la < -0.3) la = la < -1.9 ? 3.3 : -0.3; if (la > 3.3) la = 3.3;
    return la - PI;
  }
  // apunta el aguijon a la direccion `la` (marco del jefe): el abdomen solo gira por el hemisferio ventral [-0.3, 3.3] rad, el resto lo compensa inclinando el cuerpo
  function aimAb(la) {
    la = ((la % TAU) + TAU + PI) % TAU - PI; var d = 0;
    if (la < -0.3) { if (la > -1.9) d = la + 0.3; else { var l2 = la + TAU; d = l2 - 3.3; } }
    var tl = clamp(d * 0.55, -0.7, 0.7); return { tilt: tl, delta: tipDelta(la - tl) };
  }
  function T(P, px, py) { var c = cos(P.tilt), sn = sin(P.tilt); return { x: px * c - py * sn, y: px * sn + py * c + P.by }; }
  function hp(P, px, py) { var dx = px - NECK[0], dy = py - NECK[1], c = cos(P.hr), s = sin(P.hr); return [NECK[0] + dx * c - dy * s, NECK[1] + dx * s + dy * c]; }

  function mPose(s) {
    var t = s.t || 0, W = s.windup, ST = s.strike, wp = s.wp != null ? s.wp : ((t % 1400) / 1400), sp = s.sp != null ? s.sp : ((t % 700) / 700), u = ease(wp), q = ease(sp), f = s.facing < 0 ? -1 : 1;
    if (s.desperate && !W && !ST) W = 'zumbido';
    var br = s.broken || {}, ph = clamp(s.phase || 1, 1, 3);
    var P = {
      by: 0, tilt: 0, hr: 0, hf: 0, ab: REST, abLen: 1, abF: ph >= 3 ? 1 : 0, sF: br.aguijon ? 2 : 0, wfold: 0, wsp: 1, wamp: 0.2, wspread: 0, wf: 0, lf: 0, antA: 1, antLimp: 0,
      glow: 0.35 + 0.15 * (ph - 1), flare: 0, shake: 0, eyes: ph - 1, hover: HOVER, sx: 1, crownF: br.corona ? 2 : (ph >= 3 ? 1 : 0), atk: null,
      stingGlow: 0, trail: 0, dive: 0, impact: 0, quills: 0, summon: 0, buzz: 0, drip: 0, splash: 0, vortex: 0, jelly: 0, jellyBurst: 0, burst: 0, swat: 0, swing: 0,
      stars: 0, honey: 0, rings: 0, wingBlur: 0, dust: 0, dead: 0, fly: 0, crackFx: 0, swollen: clamp(+s.swollen || 0, 0, 1), landed: 0, tripAlas: 0
    };
    P.atk = W || ST || null;
    var la = f > 0 ? (s.aim || 0) : PI - (s.aim || 0), m = null;
    function A_(n) { return ST === n ? 'S' : (W === n && !ST ? 'W' : null); }
    var landed = clamp(s.landed === true ? 1 : +s.landed || 0, 0, 1);
    if (br.alas) landed = 1;
    if (s.stun || s.stuck) landed = 1;
    P.landed = landed;
    P.ab = REST + 0.05 * sin(t / 800); P.by = (1 - landed) * 2.6 * sin(t / 520); P.tilt = 0.012 * sin(t / 1300) - 0.03 * (1 - landed);
    P.antA = 0.6 + 0.4 * sin(t / 900);
    P.wamp = 0.2; P.wsp = 1; P.wspread = 0;
    if ((m = A_('estocada'))) {
      var aA = aimAb(la), dA = aA.delta;
      if (m === 'W') { P.ab = lerp(REST, dA, u); P.tilt += -0.15 * u + aA.tilt * u; P.by += -4 * u; P.wsp = 1.5; P.sF = br.aguijon ? 2 : (u > 0.35 ? 1 : 0); P.stingGlow = u; P.flare = 0.6 * u; P.shake = 0.7 * u; P.lf = 2; P.hr += -0.06 * u; }
      else { P.ab = dA; P.abLen = 1 + 0.1 * (1 - q); P.tilt += lerp(-0.15, 0.2, q) + aA.tilt; P.sF = br.aguijon ? 2 : 1; P.stingGlow = 1; P.trail = 1 - sp * 0.4; P.wsp = 1.6; P.wspread = 0.1; P.lf = 2; P.flare = 1; P.shake = 1.4; P.hr += 0.08; }
    } else if ((m = A_('picado'))) {
      var short = !!br.alas;
      if (m === 'W') { P.tilt += -0.22 * u; P.wsp = short ? 1 : 1.9; P.wamp = short ? 0.1 : 0.34; P.wspread = -0.28 * u; P.ab = REST - 0.35 * u; P.lf = 2; P.flare = 0.7 * u; P.shake = 0.8 * u; P.by += -3 * u; if (short) { P.by += 8 * u; P.tilt += 0.12 * u; } }
      else {
        var dq = ease(clamp(sp / 0.3, 0, 1)), im = clamp((sp - 0.3) / 0.7, 0, 1);
        P.tilt += lerp(-0.22, short ? 0.3 : 0.85, dq) * (1 - ease(clamp((sp - 0.42) / 0.3, 0, 1)) * 0.85); P.wfold = short ? 0 : 0.8 * (1 - ease(clamp((sp - 0.5) / 0.4, 0, 1))); P.ab = lerp(REST - 0.35, REST + 0.35, dq); P.lf = 2;
        P.dive = sp < 0.34 ? 1 - sp / 0.34 : 0; P.impact = sp >= 0.3 ? 1 - im : 0; P.shake = sp >= 0.3 ? 6 * (1 - im) : 1; P.flare = 1; P.dust = sp >= 0.3 ? 1 - im : 0; P.by += sp >= 0.3 ? 6 * (1 - im) : 0; if (!short) P.wsp = 0.6;
      }
    } else if ((m = A_('lluvia'))) {
      var aB = aimAb(la), dB = aB.delta;
      if (m === 'W') { P.ab = lerp(REST, dB, u); P.tilt += -0.1 * u + aB.tilt * u; P.wsp = 1.4; P.sF = br.aguijon ? 2 : (u > 0.3 ? 1 : 0); P.stingGlow = u; P.quills = u; P.flare = 0.7 * u; P.shake = 0.6 * u; P.lf = 2; }
      else { P.ab = dB + 0.05 * sin(t / 24); P.tilt += -0.1 + aB.tilt; P.sF = br.aguijon ? 2 : 1; P.stingGlow = 1; P.quills = 1; P.burst = 1; P.flare = 1; P.shake = 1.6; P.hf = 1; P.wsp = 1.5; P.lf = 2; }
    } else if ((m = A_('llamada'))) {
      if (m === 'W') { P.wsp = 2.4; P.wamp = 0.3; P.wspread = -0.3 * u; P.tilt += -0.12 * u; P.hr += -0.2 * u; P.hf = u > 0.3 ? 1 : 0; P.summon = u; P.buzz = u; P.flare = 0.6 * u; P.shake = 0.9 * u; P.lf = 2; P.antA = 1.6; P.by += -4 * u; P.ab = REST + 0.15 * u; }
      else { P.wsp = 2.6; P.wamp = 0.32; P.wspread = -0.3; P.tilt += lerp(-0.12, 0.05, q); P.hf = 1; P.summon = 1; P.buzz = 1; P.shake = sp < 0.5 ? 3 : 1; P.flare = 1; P.lf = 2; P.antA = 1.6; }
    } else if ((m = A_('panal'))) {
      if (m === 'W') { P.ab = lerp(REST, tipDelta(1.95), u); P.tilt += 0.06 * u; P.by += 5 * u; P.drip = u; P.lf = 2; P.flare = 0.5 * u; P.shake = 0.5 * u; P.abF = ph >= 3 ? 1 : 0; P.wsp = 0.9; }
      else { P.ab = tipDelta(1.95) + 0.08 * sin(t / 70); P.tilt += 0.06; P.by += 5 - 3 * q; P.drip = 1; P.splash = 1; P.lf = 2; P.flare = 0.9; P.shake = 1.4 * (1 - sp * 0.5); P.abF = 1; P.abLen = 1 + 0.06 * sin(t / 70); }
    } else if ((m = A_('torbellino'))) {
      if (m === 'W') { P.wsp = 2 + u; P.wamp = 0.45; P.wspread = 0.55 * u; P.vortex = 0.6 * u; P.tilt += -0.1 * u; P.lf = 2; P.ab = REST + 0.25 * u; P.flare = 0.7 * u; P.shake = 1 * u; P.wingBlur = u; }
      else { P.wsp = 3.4; P.wamp = 0.5; P.wspread = 0.6; P.vortex = 1; P.sx = cos(t / 85); if (Math.abs(P.sx) < 0.28) P.sx = P.sx < 0 ? -0.28 : 0.28; P.lf = 2; P.ab = REST + 0.3; P.flare = 1; P.shake = 3; P.wingBlur = 1; }
    } else if ((m = A_('jalea'))) {
      P.tilt += -0.05; P.hr += -0.1; P.wsp = 0.55; P.wamp = 0.14; P.wspread = -0.1; P.lf = 2; P.ab = REST + 0.18; P.crownF = br.corona ? 2 : 1; P.glow = 0.7; P.antA = 1.2;
      if (m === 'W') { P.jelly = u; P.flare = 0.4 + 0.3 * u; P.shake = 0.3; P.by += -2 * u; } else { P.jelly = 1; P.jellyBurst = sp; P.flare = 1 - sp * 0.5; P.by += -2 + 2 * q; P.hf = 0; }
    } else if ((m = A_('eclosion'))) {
      P.lf = 2; P.wsp = 1.1;
      if (m === 'W') { P.abF = u > 0.62 ? 3 : (u > 0.14 ? 2 : P.abF); P.abLen = 1 + 0.12 * u; P.ab = REST + 0.1 * u + 0.03 * sin(t / 60) * u; P.tilt += -0.06 * u; P.flare = 0.5 + 0.5 * u; P.shake = 1.4 * u; P.glow = 0.5 + 0.5 * u; P.swollen = Math.max(P.swollen, u); P.by += -2 * u; }
      else { P.abF = sp < 0.4 ? 3 : 2; P.abLen = 1.12 - 0.06 * q; P.ab = REST + 0.1; P.burst = sp < 0.6 ? 1 - sp / 0.6 : 0; P.flare = 1; P.shake = sp < 0.4 ? 3 : 1; P.swollen = 1; P.tilt += lerp(-0.06, 0.04, q); }
    } else if ((m = A_('alazo'))) {
      if (m === 'W') { P.tilt += -0.1 * u; P.swing = -0.9 * u; P.wsp = 1.3; P.lf = 2; P.flare = 0.5 * u; P.shake = 0.5 * u; P.hr += -0.08 * u; }
      else { P.tilt += lerp(-0.1, 0.18, q); P.swing = lerp(-0.9, 1.5, q); P.swat = 1 - sp * 0.3; P.wsp = 1.3; P.lf = 2; P.flare = 1; P.shake = 1.2; P.hf = 1; }
    } else if ((m = A_('zumbido'))) {
      P.wsp = 3; P.wamp = 0.42; P.wspread = 0.4; P.tilt += -0.08; P.hf = 1; P.glow = 1; P.eyes = 2; P.crownF = br.corona ? 2 : 1; P.abF = 1; P.rings = 1; P.buzz = 0.8; P.flare = 1; P.shake = 1.3; P.lf = 2; P.antA = 1.5; P.hover = HOVER + 2 * sin(t / 300); P.wingBlur = 0.7;
    }
    if (s.stun || s.stuck) {
      P.hf = 3; P.antLimp = 1; P.wfold = 0.85; P.lf = 3; P.tilt = 0.12; P.by = 6; P.ab = -0.18; P.glow = 0.25; P.flare = 0; P.stingGlow = 0; P.trail = 0; P.vortex = 0; P.summon = 0; P.buzz = 0; P.rings = 0; P.sx = 1; P.wsp = 0; P.wamp = 0; P.jelly = 0; P.dive = 0; P.impact = 0; P.quills = 0; P.drip = 0; P.splash = 0; P.burst = 0;
      if (s.stun) P.stars = 1;
      if (s.stuck) { P.honey = 1; P.shake = 1.1 + 0.8 * sin(t / 90); P.hf = 2; P.stars = 0; P.wfold = 0.6; P.by = 7 + 1.6 * sin(t / 110); }
    }
    if (landed > 0.5 && P.lf < 3 && !(P.atk)) P.lf = 3;
    P.hover = HOVER * (1 - landed) + (s.lift || 0) + (P.hover - HOVER) * (1 - landed);
    if (P.hover < 0) P.hover = 0;
    if (s.roar > 0) { var ro = ease(s.roar); P.tilt += -0.15 * ro; P.hr += -0.25 * ro; P.hf = ro > 0.2 ? 1 : P.hf; P.wsp = Math.max(P.wsp, 2.2); P.wamp = Math.max(P.wamp, 0.3); P.buzz = Math.max(P.buzz, ro); P.shake = Math.max(P.shake, 2 * ro); P.flare = Math.max(P.flare, ro); P.antA = 1.6; }
    if (s.hurt > 0) { var hh = clamp(+s.hurt, 0, 1); P.tilt -= 0.05 * hh; P.by += 3 * hh; P.antLimp = Math.max(P.antLimp, hh * 0.6); if (hh > 0.25) P.hf = 2; }
    if (s.enraged) { P.flare = Math.max(P.flare, 0.5); P.wsp *= 1.25; P.glow = Math.max(P.glow, 0.8); }
    if (P.swollen > 0.02 && P.abF < 2) { P.abF = 2; P.abLen = Math.max(P.abLen, 1.04); }
    if (br.alas) { P.wsp = 0; P.wamp = 0; }
    return P;
  }
  function mDeath(P, dt, s) {
    var a = clamp(dt / 1000, 0, 1), c = ease((dt - 1000) / 800);
    P.dead = dt; P.atk = null; P.dive = 0; P.impact = 0; P.trail = 0; P.quills = 0; P.summon = 0; P.buzz = 0; P.vortex = 0; P.jelly = 0; P.rings = 0; P.sx = 1; P.stingGlow = 0; P.burst = 0; P.drip = 0; P.splash = 0; P.stars = 0; P.honey = 0; P.flare = 0; P.wingBlur = 0;
    P.hf = dt < 1800 ? 2 : 3; P.hover = HOVER * (1 - ease(dt / 900)); P.landed = ease(dt / 900); P.lf = dt > 900 ? 3 : 2; P.antLimp = a; P.wsp = (1 - a) * 0.8; P.wamp = 0.2 * (1 - a); P.fly = clamp((dt - 500) / 1300, 0, 1); P.crackFx = clamp(dt / 1700, 0, 1);
    P.tilt = sin(dt / 90) * 0.06 * (1 - a) + 0.14 * c; P.by = 6 * c + (dt < 1000 ? sin(dt / 60) * 2 * (1 - a) : 0); P.hr = 0.25 * a + 0.3 * c; P.shake = dt < 1000 ? 5 * (1 - a * 0.5) : (dt < 1800 ? 2.4 * (1 - c) + 0.6 : 0);
    P.ab = lerp(REST, -0.2, c); P.swollen = c * 0.85; P.abF = c > 0.3 ? 3 : (P.abF); P.abLen = 1 + 0.08 * c; P.glow = 1 - c * 0.4; P.crownF = 2;
    if (dt > 600) P.wf = 1;   // las alas salen despedidas (se pintan aparte)
    P.eyes = dt > 1000 ? 0 : P.eyes; P.dust = dt > 900 && dt < 1800 ? 0.5 : 0; return P;
  }
  function mPoseFor(s) { var P = mPose(s); if (s.dying) mDeath(P, Math.min(s.dt != null ? s.dt : (s.deathT || 0), 1800), s); return P; }
  function mLayout(P, s) {
    var br = s.broken || {}, k = P.abLen, tipX = -114 * k - 42, c = cos(P.ab), sn = sin(P.ab), i;
    var tipG = { x: PIV[0] + tipX * c, y: PIV[1] + tipX * sn }, abC = { x: PIV[0] + (-60 * k) * c, y: PIV[1] + (-60 * k) * sn }, abBase = { x: PIV[0] + (-30) * c, y: PIV[1] + (-30) * sn };
    var hc = hp(P, HEAD0[0], HEAD0[1]), hcr = hp(P, HEAD0[0] + 4, HEAD0[1] - 34), hm = hp(P, HEAD0[0] + 26, HEAD0[1] + 12), he = hp(P, HEAD0[0] + 10, HEAD0[1] - 5);
    var out = { tip: T(P, tipG.x, tipG.y), tipRoot: T(P, abBase.x, abBase.y), abC: T(P, abC.x, abC.y), head: T(P, hc[0], hc[1]), crown: T(P, hcr[0], hcr[1]), mouth: T(P, hm[0], hm[1]), eyes: T(P, he[0], he[1]), stingA: P.ab + PI + P.tilt, pivot: T(P, PIV[0], PIV[1]) };
    var ant = []; for (i = 0; i < 2; i++) { var b = hp(P, HEAD0[0] + 6 - i * 9, HEAD0[1] - 28); ant.push(b); } out.antBase = ant; return out;
  }

  // ================================================================= RENDER
  function wingAngles(P, t, back, far, br) {
    var th, amp = P.wamp * (1 - P.wfold), hz = 0.011 * P.wsp;
    if (br.alas) { th = 0.55 + 0.04 * sin(t / 400 + (far ? 2 : 0)); return { th: th + (back ? 0.1 : 0), amp: 0 }; }
    var sw = P.wspread + (far ? 0.12 : 0);
    var open = -0.95 + sw + (P.swing && !back && !far ? P.swing : 0);
    var fold = back ? -0.12 : -2.95;
    th = lerp(open, fold, P.wfold);
    return { th: th, amp: amp, hz: hz };
  }
  function drawWing(x, P, t, back, far, br) {
    var root = far ? (back ? WROOT.fb : WROOT.ff) : (back ? WROOT.nb : WROOT.nf), wa = wingAngles(P, t, back, far, br), broken = !!br.alas;
    var spr = A.sprite(back ? 'boss_reina_wing_back' : 'boss_reina_wing_front', broken ? 4 : 0), rr = back ? [6, 32] : [6, 36], ph = t * (wa.hz || 0) * TAU + (far ? 1.7 : 0) + (back ? 0.9 : 0);
    var fr = broken ? 4 : ((Math.floor(t / 45) + (back ? 1 : 0)) % 4), sc = far ? 0.9 : 1;
    function one(th, al, frame) {
      x.save(); x.translate(root[0], root[1]); if (back) x.scale(-1, 1); x.rotate(th); x.scale(sc, sc); x.globalAlpha *= al;
      var sp2 = frame === fr ? spr : A.sprite(back ? 'boss_reina_wing_back' : 'boss_reina_wing_front', frame); x.drawImage(sp2, -rr[0], -rr[1]); x.restore();
    }
    if (broken || wa.amp < 0.02) { one(wa.th, far ? 0.55 : 0.92, fr); return; }
    var d = wa.amp * sin(ph);
    one(wa.th + d, far ? 0.4 : 0.6, fr); one(wa.th - d * 0.7 - wa.amp * 0.6, far ? 0.3 : 0.4, (fr + 2) % 4);
    if (P.wingBlur > 0.1 && !far) { one(wa.th + wa.amp * 1.4 * sin(ph + 1.3), 0.22 * P.wingBlur, (fr + 1) % 4); }
  }
  function drawAntennae(x, P, L, t) {
    var i, ba = L.antBase;
    x.lineCap = 'round';
    for (i = 0; i < 2; i++) {
      var b = ba[i], wig = P.antA * (3 + 2 * i), ph = t / 160 + i * 1.9, lm = P.antLimp;
      var tipx = b[0] + (16 + i * 8) * (1 - lm * 0.5) + sin(ph) * wig, tipy = b[1] - (26 - i * 4) * (1 - lm * 1.5) + cos(ph * 0.8) * wig * 0.7 + lm * 30;
      var cx = b[0] + (4 + i * 3) * (1 - lm * 0.5), cy = b[1] - (20 - i * 3) * (1 - lm * 1.4) + lm * 10;
      x.strokeStyle = OLC; x.lineWidth = 4.8; x.beginPath(); x.moveTo(b[0], b[1]); x.quadraticCurveTo(cx, cy, tipx, tipy); x.stroke();
      x.strokeStyle = M.blk; x.lineWidth = 2.6; x.stroke();
      x.strokeStyle = M.blkH; x.lineWidth = 0.8; x.stroke();
      x.fillStyle = M.amber; x.strokeStyle = OLC; x.lineWidth = 1.7; x.beginPath(); x.arc(tipx, tipy, 4.2, 0, TAU); x.fill(); x.stroke();
      x.fillStyle = M.amberH; x.beginPath(); x.arc(tipx - 1.2, tipy - 1.2, 1.4, 0, TAU); x.fill();
    }
  }
  function renderCore(R, s, f, t, dying, dt) {
    var x = beginR(R), P = mPoseFor(s), L = mLayout(P, s), br = s.broken || {}, i;
    var shx = P.shake ? sin(t * 0.13) * P.shake : 0, shy = P.shake ? cos(t * 0.17) * P.shake * 0.6 : 0, ghostWings = dying && P.wf && !br.alas;
    x.translate(R.OX + shx, R.OY - P.hover + shy); if (f < 0) x.scale(-1, 1); if (P.sx !== 1) x.scale(P.sx, 1);
    var ex0 = Math.min(-96, L.tip.x - 34, -150 + P.wspread * -60), ex1 = Math.max(130, 150 + P.wspread * 60), ey0 = -214 - P.wfold * 0 + (P.wspread > 0.3 ? 40 : 0) - P.by * 0, ey1 = Math.max(128, L.tip.y + 40);
    if (Math.abs(P.sx) !== 1) { ex0 = -250; ex1 = 250; }
    extR(R, ex0 - 30, ey0 - 20 - P.hover, ex1 + 30, ey1 + 20 - P.hover);
    // grupo con balanceo
    x.save(); x.translate(0, P.by); x.rotate(P.tilt);
    // alas lejanas, patas lejanas
    if (!ghostWings) { drawWing(x, P, t, true, true, br); drawWing(x, P, t, false, true, br); }
    var lg = A.sprite('boss_reina_legs', 4 + (P.lf === 3 ? 3 : (P.lf === 2 ? 2 : (Math.floor(t / 500) % 2)))), lgn = A.sprite('boss_reina_legs', P.lf === 3 ? 3 : (P.lf === 2 ? 2 : (Math.floor(t / 600) % 2)));
    x.drawImage(lg, -26, 24);
    function drawAbd() {
    x.save(); x.translate(PIV[0], PIV[1]); x.rotate(P.ab);
    var ab = A.sprite('boss_reina_abdomen', P.abF), sw = P.swollen > 0.02 && P.abF >= 2 ? 1 + 0.04 * sin(t / 90) * P.swollen : 1;
    x.save(); x.scale(P.abLen, sw); x.drawImage(ab, -122, -46); x.restore();
    var stg = A.sprite('boss_reina_sting', P.sF); x.drawImage(stg, -114 * P.abLen - 44, -12);
    x.restore();
    }
    var abFront = cos(P.ab + PI) > -0.15;
    if (!abFront) drawAbd();
    // torax
    var th = A.sprite('boss_reina_thorax', Math.floor(t / 620) % 2); x.drawImage(th, -56, -48);
    // patas cercanas
    x.drawImage(lgn, -38, 28);
    if (abFront) drawAbd();
    // cabeza con cuello
    x.save(); x.translate(NECK[0], NECK[1]); x.rotate(P.hr); x.translate(-NECK[0], -NECK[1]);
    drawAntennae(x, { antA: P.antA, antLimp: P.antLimp }, { antBase: [[HEAD0[0] + 22, HEAD0[1] - 24], [HEAD0[0] + 12, HEAD0[1] - 28]] }, t);
    var hs = A.sprite('boss_reina_head', P.hf); x.drawImage(hs, HEAD0[0] - 34, HEAD0[1] - 32);
    if (P.hf !== 2 && P.hf !== 3) { var es = A.sprite('boss_reina_eyes', clamp(P.eyes, 0, 2)); x.drawImage(es, HEAD0[0] - 4, HEAD0[1] - 17); }
    if (!(dying && P.fly > 0 && !br.corona)) { var cr = A.sprite('boss_reina_crown', P.crownF); x.drawImage(cr, HEAD0[0] - 18, HEAD0[1] - 53); }
    x.restore();
    // alas cercanas
    if (!ghostWings) { drawWing(x, P, t, true, false, br); drawWing(x, P, t, false, false, br); }
    x.restore();
    // brillos aditivos
    x.globalCompositeOperation = 'lighter';
    var ec = EYE[clamp(P.eyes, 0, 2)][2], he = L.eyes;
    if (P.hf !== 2 && P.hf !== 3) glowAt(x, he.x + 8, he.y, 14 + P.flare * 8, ec, 0.5 + P.flare * 0.25);
    if (P.crownF === 1) glowAt(x, L.crown.x, L.crown.y + 10, 30, '255,246,200', 0.55 + 0.2 * sin(t / 120));
    if (P.stingGlow > 0.05 && !br.aguijon) glowAt(x, L.tip.x, L.tip.y, 20 + 10 * P.stingGlow, '255,170,60', 0.75 * P.stingGlow);
    var abg = (P.abF === 1 || P.abF === 3 ? 0.5 : 0.12) + P.glow * 0.2 + P.swollen * 0.3;
    glowAt(x, L.abC.x, L.abC.y, 52 + P.swollen * 12, '255,196,70', clamp(abg * (0.7 + 0.3 * sin(t / 220)), 0, 0.8));
    x.globalCompositeOperation = 'source-over';
    return { R: R, P: P, L: L };
  }
  var CELL = 16, MC = 28, MR = 22, MASKS = {};
  function ensureMask(R, s) {
    var br = s.broken || {}, key = (br.alas ? 'a' : '') + (br.aguijon ? 's' : '') + (br.corona ? 'c' : '') + (s.phase || 1);
    if (MASKS[key]) return MASKS[key];
    var s2 = { t: 0, facing: 1, phase: s.phase, dying: true, dt: 1800, id: 'melaria', broken: br }, r = renderCore(R, s2, 1, 0, true, 1800), ox = R.OX - MC * CELL / 2, oy = R.OY - 230, sm = mkc(MC, MR), g = sm.getContext('2d');
    g.imageSmoothingEnabled = true; g.drawImage(R.cv, ox, oy, MC * CELL, MR * CELL, 0, 0, MC, MR);
    var d = g.getImageData(0, 0, MC, MR).data, mk = new Uint8Array(MC * MR); for (var i = 0; i < MC * MR; i++) mk[i] = d[i * 4 + 3] > 40 ? 1 : 0;
    endR(R); return (MASKS[key] = mk);
  }
  function cellTh(i, j) { return pr(i * 7 + j * 13 + 1) * 0.4 + (j / MR) * 0.5 + (pr(i + 90) - 0.5) * 0.1; }   // las celdas altas se funden primero? (arriba antes: th pequeno arriba)
  function renderMelaria(s) {
    var R = getR('melaria', 720, 620, 380, 430), f = s.facing < 0 ? -1 : 1, t = s.t || 0, dying = !!s.dying, dt = dying ? (s.dt != null ? s.dt : (s.deathT || 0)) : 0, i;
    if (dying && dt >= MDEATH) { beginR(R); R.bb = { x0: 0, y0: 0, x1: 1, y1: 1 }; endR(R); return { canvas: R.cv, ox: R.OX, oy: R.OY, box: R.box }; }
    var mask = null; if (dying && dt >= 1800) mask = ensureMask(R, s);
    var C = renderCore(R, s, f, t, dying, dt), P = C.P, x = R.cv.getContext('2d'), bx = endR(R);
    x.setTransform(1, 0, 0, 1, 0, 0); x.globalCompositeOperation = 'source-atop';
    function fill(c) { x.fillStyle = c; x.fillRect(bx.x, bx.y, bx.w, bx.h); }
    if (s.enraged && !dying) fill('rgba(255,150,40,' + (0.12 + 0.1 * sin(t / 150)).toFixed(3) + ')');
    if (s.exposed && !dying) fill('rgba(214,240,255,' + (0.2 + 0.12 * sin(t / 130)).toFixed(3) + ')');
    if (s.immune && !dying) fill('rgba(190,225,255,' + (0.14 + 0.08 * sin(t / 90)).toFixed(3) + ')');
    if (P.swollen > 0.3 && !dying) fill('rgba(255,200,120,' + (0.1 + 0.08 * sin(t / 100)).toFixed(3) + ')');
    var hv = s.hurt === true ? 1 : clamp(+s.hurt || 0, 0, 1);
    if (dying && dt < 1000) hv = Math.max(hv, (Math.floor(dt / 70) % 2) ? 0.8 : 0.1); if (dying && dt < 150) hv = 1;
    if (hv > 0) fill('rgba(255,255,255,' + (hv * 0.85).toFixed(3) + ')');
    if (dying && dt >= 1000 && dt < 1800) {   // la miel rezuma por las grietas del cuerpo
      var ll = ease((dt - 1000) / 800); x.fillStyle = 'rgba(201,122,20,' + (0.5 * ll).toFixed(3) + ')';
      x.save(); x.translate(R.OX, R.OY); if (f < 0) x.scale(-1, 1);
      for (i = 0; i < 9; i++) { var cx0 = -150 + pr(i + 4) * 220, cy0 = -60 + pr(i + 9) * 90, rw = 5 + pr(i + 2) * 8; x.beginPath(); x.ellipse(cx0, cy0 + ll * 14 * pr(i + 6), rw, rw * (1 + ll), 0, 0, TAU); x.fill(); }
      x.restore();
    }
    if (dying && dt >= 1800 && mask) {
      var u = clamp((dt - 1800) / 1500, 0, 1.2), ox = R.OX - MC * CELL / 2, oy = R.OY - 230;
      x.globalCompositeOperation = 'destination-out'; x.fillStyle = '#000';
      for (var j = 0; j < MR; j++) for (var ii = 0; ii < MC; ii++) { var li = f < 0 ? MC - 1 - ii : ii; if (u > cellTh(li, j)) x.fillRect(ox + ii * CELL - 0.5, oy + j * CELL - 0.5, CELL + 1, CELL + 1); }
    }
    x.globalCompositeOperation = 'source-over'; x.setTransform(1, 0, 0, 1, 0, 0);
    return { canvas: R.cv, ox: R.OX, oy: R.OY, pose: C.P, layout: C.L, box: bx, mask: mask };
  }

  // ---- sombra (vuela: separada y mas pequena/clara cuanto mas alta), aura y efectos de suelo
  function hoverOf(s) {
    var br = s.broken || {}, landed = clamp(s.landed === true ? 1 : +s.landed || 0, 0, 1); if (br.alas || s.stun || s.stuck) landed = 1;
    var h = HOVER * (1 - landed) + (s.lift || 0); if (s.dying) h *= 1 - ease((s.dt || 0) / 900);
    return Math.max(0, h);
  }
  function mShadow(ctx, px, py, s) {
    if (s.dying && s.dt >= MDEATH) return;
    var h = hoverOf(s), k = 1 / (1 + h / 160), al = 0.18 + 0.26 * k, wd = 128 * (0.55 + 0.45 * k); if (s.dying && s.dt > 1700) al *= 1 - clamp((s.dt - 1700) / 1800, 0, 1);
    ctx.save(); ctx.translate(px, py + GY + 4);
    ctx.fillStyle = 'rgba(40,22,4,' + (al * 0.5).toFixed(3) + ')'; ctx.beginPath(); ctx.ellipse(0, 0, wd * 1.22, 44 * (0.6 + 0.4 * k), 0, 0, TAU); ctx.fill();
    ctx.fillStyle = 'rgba(40,22,4,' + (al * 0.85).toFixed(3) + ')'; ctx.beginPath(); ctx.ellipse(0, 0, wd, 34 * (0.6 + 0.4 * k), 0, 0, TAU); ctx.fill();
    ctx.restore();
  }
  function mAura(ctx, px, py, s, P) {
    var t = s.t || 0, h = P.hover, a = 0.1 + 0.08 * P.glow + 0.03 * sin(t / 300) + (s.exposed ? 0.1 : 0) + (P.rings ? 0.1 : 0) + (s.phase >= 3 ? 0.08 : 0) + (s.dying ? -0.1 * clamp(s.dt / 3000, 0, 1) : 0);
    ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = clamp(a, 0, 0.55); ctx.drawImage(glowSpr(s.exposed ? '190,230,255' : '255,184,60'), px - 160, py - h - 100, 320, 200); ctx.restore();
    // miel en la que esta atrapada / charco al morir
    if (P.honey > 0 || (s.stuck && !s.dying)) { honeyPool(ctx, px, py + GY - 6, 120, 1, t); }
    if (s.dying && s.dt > 900) { var pu = clamp((s.dt - 900) / 2000, 0, 1), fade = 1 - clamp((s.dt - 3000) / 500, 0, 1); honeyPool(ctx, px, py + GY - 6, 40 + 170 * ease(pu), fade, t); }
  }
  function honeyPool(ctx, cx, cy, rx, al, t) {
    ctx.save(); ctx.globalAlpha = al; ctx.translate(cx, cy); ctx.scale(1, 0.34);
    ctx.fillStyle = OLC; ctx.beginPath(); ctx.arc(0, 0, rx + 3, 0, TAU); ctx.fill();
    ctx.fillStyle = M.honey; ctx.beginPath(); ctx.arc(0, 0, rx, 0, TAU); ctx.fill();
    ctx.fillStyle = M.honeyH; ctx.beginPath(); ctx.arc(-rx * 0.12, -rx * 0.12, rx * 0.8, Math.PI * 1.1, Math.PI * 1.9); ctx.arc(0, 0, rx * 0.55, Math.PI * 1.9, Math.PI * 1.1, true); ctx.fill();
    ctx.fillStyle = 'rgba(255,233,160,0.8)'; for (var i = 0; i < 6; i++) { var a = i * 1.1 + t / 1500, rr = rx * (0.35 + 0.5 * pr(i + 5)); ctx.beginPath(); ctx.arc(cos(a) * rr, sin(a) * rr * 0.8, 3 + pr(i) * 3, 0, TAU); ctx.fill(); }
    ctx.restore();
  }
  var SHC = null;
  function shieldCv() {   // cupula de celdas blanco azulada (puerta de fase): se pinta una sola vez
    if (SHC) return SHC; var c = mkc(380, 300), g = c.getContext('2d'), i, j, gr = g.createRadialGradient(190, 150, 40, 190, 150, 190);
    gr.addColorStop(0, 'rgba(230,247,255,0.04)'); gr.addColorStop(1, 'rgba(200,235,255,0.4)');
    g.save(); g.beginPath(); g.ellipse(190, 150, 186, 146, 0, 0, TAU); g.clip(); g.fillStyle = gr; g.fillRect(0, 0, 380, 300);
    g.strokeStyle = 'rgba(235,250,255,0.8)'; g.lineWidth = 1.6; for (j = -1; j < 10; j++) for (i = -1; i < 9; i++) { g.beginPath(); hexPath(g, i * 48 + (j % 2) * 24, j * 41.6, 26, 0); g.stroke(); }
    g.restore(); g.strokeStyle = OLC; g.lineWidth = 4; g.beginPath(); g.ellipse(190, 150, 186, 146, 0, 0, TAU); g.stroke(); g.strokeStyle = '#e6f7ff'; g.lineWidth = 2.4; g.stroke(); return (SHC = c);
  }
  function sparkle(ctx, px, py, r, col) { ctx.fillStyle = col; ctx.beginPath(); ctx.moveTo(px, py - r); ctx.lineTo(px + r * 0.28, py - r * 0.28); ctx.lineTo(px + r, py); ctx.lineTo(px + r * 0.28, py + r * 0.28); ctx.lineTo(px, py + r); ctx.lineTo(px - r * 0.28, py + r * 0.28); ctx.lineTo(px - r, py); ctx.lineTo(px - r * 0.28, py - r * 0.28); ctx.closePath(); ctx.fill(); }

  // ---- efectos delanteros (encima del jefe)
  function mFront(ctx, px, py, s, P, R) {
    var t = s.t || 0, f = s.facing < 0 ? -1 : 1, L = R.layout, br = s.broken || {}, dying = !!s.dying, dt = dying ? (s.dt != null ? s.dt : 0) : 0, i, sx = P.sx, gy = py + GY, hv = P.hover;
    function Wp(lx, ly) { return { x: px + f * sx * lx, y: py + ly - hv }; }
    function G(p) { return Wp(p.x, p.y); }
    var tip = G(L.tip), mouth = G(L.mouth), crown = G(L.crown), head = G(L.head), abc = G(L.abC);
    var stA = f > 0 ? L.stingA : PI - L.stingA;   // angulo del aguijon en el mundo
    // polen que cae de las alas (vuelo)
    if (!dying && P.landed < 0.5 && !br.alas) {
      ctx.save(); for (i = 0; i < 7; i++) { var ph = ((t / 1400) + i / 7) % 1, o = Wp(-60 + pr(i + 2) * 150, -80 + ph * 150); ctx.globalAlpha = 0.7 * (1 - ph) * (0.5 + 0.5 * pr(i)); ctx.fillStyle = i % 2 ? '#fff0a0' : '#ffc43a'; ctx.fillRect(o.x - 1.5, o.y - 1.5, 3 + pr(i + 1) * 1.5, 3); } ctx.restore();
    }
    // estela y destello de la estocada
    if (P.trail > 0.02 && !br.aguijon) {
      ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.lineCap = 'round';
      for (i = 0; i < 3; i++) { ctx.strokeStyle = 'rgba(255,' + (200 - i * 30) + ',100,' + (0.5 * P.trail * (1 - i * 0.28)).toFixed(3) + ')'; ctx.lineWidth = 12 - i * 3.6; ctx.beginPath(); ctx.moveTo(tip.x, tip.y); ctx.lineTo(tip.x - cos(stA) * (120 - i * 20), tip.y - sin(stA) * (120 - i * 20)); ctx.stroke(); }
      ctx.restore();
    }
    if (P.quills > 0.05 && !br.aguijon) {   // aguijones erizados + fogonazo
      ctx.save(); ctx.globalCompositeOperation = 'lighter';
      for (i = 0; i < 5; i++) { var qa = stA + (i - 2) * 0.28 * (0.5 + 0.5 * P.quills); ctx.strokeStyle = 'rgba(255,220,140,' + (0.55 * P.quills).toFixed(3) + ')'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(tip.x, tip.y); ctx.lineTo(tip.x + cos(qa) * (30 + 12 * P.quills + (P.burst ? 30 * sin(t / 40 + i) : 0)), tip.y + sin(qa) * (30 + 12 * P.quills + (P.burst ? 30 * sin(t / 40 + i) : 0))); ctx.stroke(); }
      if (P.burst) { ctx.fillStyle = 'rgba(255,240,180,' + (0.5 + 0.3 * sin(t / 30)).toFixed(2) + ')'; ctx.beginPath(); ctx.arc(tip.x + cos(stA) * 12, tip.y + sin(stA) * 12, 14 + 5 * sin(t / 25), 0, TAU); ctx.fill(); }
      ctx.restore();
    }
    // picado: lineas de velocidad y polvo/ondas del aterrizaje
    if (P.dive > 0.02) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.lineCap = 'round'; for (i = 0; i < 9; i++) { var vx = px - 70 + i * 17 + pr(i) * 6, vy0 = py - hv - 150 - pr(i + 3) * 60; ctx.strokeStyle = 'rgba(255,240,200,' + (0.6 * P.dive).toFixed(3) + ')'; ctx.lineWidth = 2.4; ctx.beginPath(); ctx.moveTo(vx, vy0); ctx.lineTo(vx + 4, vy0 + 70 + 40 * pr(i + 7)); ctx.stroke(); } ctx.restore(); }
    if (P.dust > 0.05) {
      ctx.save(); for (i = 0; i < 8; i++) { var pd = ((t / 600) + i / 8) % 1, ang = i / 8 * TAU, rr = 40 + 120 * (1 - P.dust) + pd * 30; ctx.globalAlpha = 0.95 * Math.min(1, P.dust * 2) * (1 - pd); ctx.fillStyle = i % 2 ? '#fff3d6' : '#d9bf8c'; ctx.strokeStyle = OLC; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.arc(px + cos(ang) * rr, gy - 8 + sin(ang) * rr * 0.32, 8 + 6 * (1 - pd), 0, TAU); ctx.fill(); ctx.stroke(); } ctx.restore();
    }
    // zumbido: ondas desde la boca
    if (P.buzz > 0.05) {
      ctx.save(); ctx.globalCompositeOperation = 'lighter';
      for (i = 0; i < 3; i++) { var bp = ((t / 700) + i / 3) % 1, bs = A.sprite('fx_melaria_buzz', Math.floor(bp * 4) % 4), bz = 40 + bp * 120 * P.buzz; ctx.globalAlpha = 0.8 * (1 - bp) * Math.min(1, bp * 4) * P.buzz; ctx.drawImage(bs, mouth.x - bz / 2 + f * (14 + bp * 40), mouth.y - bz / 2, bz, bz); }
      ctx.restore();
    }
    // llamada: anillo morado de enjambre en el suelo y abejitas en espiral
    if (P.summon > 0.02) {
      ctx.save(); ctx.translate(px, gy - 6); ctx.scale(1, 0.34); ctx.strokeStyle = 'rgba(176,90,240,' + (0.55 * P.summon).toFixed(2) + ')'; ctx.lineWidth = 5; ctx.setLineDash([14, 10]); ctx.lineDashOffset = -t / 20; ctx.beginPath(); ctx.arc(0, 0, 150 * P.summon, 0, TAU); ctx.stroke(); ctx.setLineDash([]);
      ctx.strokeStyle = 'rgba(220,170,255,0.7)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(0, 0, Math.max(1, 150 * P.summon - 12), 0, TAU); ctx.stroke(); ctx.restore();
      for (i = 0; i < 6; i++) { var sa = t / 300 + i * TAU / 6, sr = (50 + 100 * ((i / 6 + t / 2000) % 1)) * P.summon; miniBee(ctx, px + cos(sa) * sr, gy - 22 + sin(sa) * sr * 0.34 - 14 * sin(t / 90 + i), 0.9, sa, t); }
    }
    // panal abierto: goteo de miel desde el abdomen y salpicadura
    if (P.drip > 0.02) {
      for (i = 0; i < 3; i++) { var dp = ((t / 700) + i / 3) % 1, dfr = Math.min(2, Math.floor(dp * 3)), dsp = A.sprite('fx_melaria_drip', dfr), dy = tip.y + dp * Math.max(10, gy - tip.y - 10); ctx.globalAlpha = P.drip; ctx.drawImage(dsp, tip.x - 8 + (i - 1) * 7, dy, 16, 32); }
      ctx.globalAlpha = 1;
      if (P.splash) { ctx.save(); ctx.translate(tip.x, gy - 4); ctx.scale(1, 0.32); var sr2 = 30 + ((t / 8) % 100); ctx.strokeStyle = 'rgba(201,122,20,' + (0.8 * (1 - (sr2 - 30) / 100)).toFixed(2) + ')'; ctx.lineWidth = 6; ctx.beginPath(); ctx.arc(0, 0, sr2, 0, TAU); ctx.stroke(); ctx.restore(); }
    }
    // torbellino: remolinos y rosquilla de viento
    if (P.vortex > 0.02) {
      ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.lineCap = 'round';
      for (i = 0; i < 9; i++) { var a0 = t / 260 * (i % 2 ? 1 : -1) * 0.8 + i * 0.7, rr2 = (120 + (i % 4) * 36) * (0.5 + 0.5 * P.vortex); ctx.strokeStyle = (i % 2 ? 'rgba(255,240,200,' : 'rgba(255,196,80,') + (0.5 * P.vortex).toFixed(2) + ')'; ctx.lineWidth = 3; ctx.beginPath(); ctx.ellipse(px, gy - 40, rr2, rr2 * 0.42, 0, a0, a0 + 0.9); ctx.stroke(); }
      ctx.restore();
    }
    // jalea real: aura blanco-verdosa, cruces que suben hacia la corona
    if (P.jelly > 0.02) {
      ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = 0.5 * P.jelly; ctx.drawImage(glowSpr('200,255,210'), abc.x - 120, abc.y - 110, 240, 220); ctx.restore();
      for (i = 0; i < 6; i++) { var jp = ((t / 1100) + i / 6) % 1, ja = i * 1.9 + t / 800, jr = 90 * (1 - jp), jx = abc.x + cos(ja) * jr, jy = abc.y + 30 - jp * 100 + sin(ja) * jr * 0.3, jsp = A.sprite('fx_royal_jelly', Math.floor(t / 120 + i) % 4); ctx.globalAlpha = P.jelly * (1 - jp * 0.7); ctx.drawImage(jsp, jx - 16, jy - 16, 32, 32); }
      ctx.globalAlpha = 1;
      var cb = A.sprite('fx_royal_jelly', 0); ctx.globalAlpha = P.jelly * 0.9; ctx.drawImage(cb, crown.x - 18, crown.y - 62 - 3 * sin(t / 200), 36, 36); ctx.globalAlpha = 1;
      if (P.jellyBurst > 0) { var jb = P.jellyBurst; ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.strokeStyle = 'rgba(220,255,225,' + (0.8 * (1 - jb)).toFixed(2) + ')'; ctx.lineWidth = 6 * (1 - jb) + 2; ctx.beginPath(); ctx.ellipse(abc.x, abc.y + 30, 40 + 140 * jb, (40 + 140 * jb) * 0.7, 0, 0, TAU); ctx.stroke(); ctx.restore(); }
    }
    // eclosion: chorro de miel y gotas desde las celdas
    if (P.burst > 0.02 && P.atk === 'eclosion') {
      ctx.save(); for (i = 0; i < 12; i++) { var ea = i / 12 * TAU + 0.3, er = 20 + (1 - P.burst) * (60 + 50 * pr(i + 4)); ctx.globalAlpha = P.burst; ctx.drawImage(A.sprite('fx_melaria_chip', i % 3 === 0 ? 4 : 3), abc.x + cos(ea) * er - 8, abc.y + sin(ea) * er * 0.8 - 8 + (1 - P.burst) * 24, 16, 16); } ctx.restore();
    }
    // alazo: estela del manotazo
    if (P.swat > 0.05) {
      var ca = head; ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.lineCap = 'round'; var a1 = f > 0 ? -0.9 : PI + 0.9, a2 = f > 0 ? 0.9 : PI - 0.9;
      for (i = 0; i < 3; i++) { ctx.strokeStyle = 'rgba(255,' + (240 - i * 30) + ',' + (200 - i * 40) + ',' + (0.55 * P.swat * (1 - i * 0.25)).toFixed(3) + ')'; ctx.lineWidth = 12 - i * 3.5; ctx.beginPath(); ctx.arc(px, py - hv, 110 - i * 8, Math.min(a1, a2), Math.max(a1, a2)); ctx.stroke(); }
      ctx.restore();
    }
    // miel pegada al cuerpo (atrapada)
    if (P.honey > 0.02) {
      ctx.save(); ctx.fillStyle = 'rgba(201,122,20,0.85)'; ctx.strokeStyle = OLC; ctx.lineWidth = 1.8;
      [[-40, 60, 22, 12], [10, 64, 26, 13], [-90, 40, 18, 10], [40, 30, 16, 9]].forEach(function (b, k) { var o = Wp(b[0], b[1] - 8); ctx.beginPath(); ctx.ellipse(o.x, o.y + hv * 0, b[2], b[3], 0, 0, TAU); ctx.fill(); ctx.stroke(); ctx.fillStyle = 'rgba(255,215,120,0.7)'; ctx.beginPath(); ctx.ellipse(o.x - b[2] * 0.3, o.y - b[3] * 0.3, b[2] * 0.4, b[3] * 0.3, 0, 0, TAU); ctx.fill(); ctx.fillStyle = 'rgba(201,122,20,0.85)'; });
      ctx.restore();
    }
    // anillos hexagonales del Zumbido Mortal (aura de suelo)
    if (P.rings > 0.02) {
      ctx.save(); ctx.translate(px, gy - 8); ctx.scale(1, 0.4); ctx.strokeStyle = 'rgba(255,196,80,0.55)'; ctx.lineWidth = 5; ctx.setLineDash([16, 10]); ctx.lineDashOffset = -t / 26;
      for (i = 1; i <= 3; i++) { ctx.beginPath(); hexPath(ctx, 0, 0, 70 * i + 6 * sin(t / 300 + i), 0); ctx.stroke(); } ctx.restore();
    }
    // aro de ventana blanco azulado (hexagonal) + cupula inmune
    if (s.exposed && !dying) {
      var wr = A.animFrame('fx_melaria_window', 'loop', t), pu = 1 + 0.05 * sin(t / 150), Wd = 300 * pu;
      ctx.save(); ctx.globalAlpha = 0.85; ctx.translate(px, gy - 6); ctx.scale(1, 0.4); ctx.drawImage(wr, -Wd * 0.6, -Wd * 0.6, Wd * 1.2, Wd * 1.2); ctx.restore();
    }
    if (s.immune && !dying) {
      ctx.save(); ctx.globalAlpha = 0.55 + 0.25 * sin(t / 100); ctx.drawImage(shieldCv(), px - 190, py - hv - 158); ctx.restore();
    }
    // aturdida: estrellas de miel y abejitas mareadas
    if (P.stars > 0 && !dying) {
      for (i = 0; i < 3; i++) {
        var aa = t / 380 + i * TAU / 3, sx3 = head.x + cos(aa) * 46, sy3 = head.y - 34 + sin(aa) * 11; ctx.save(); ctx.translate(sx3, sy3); ctx.rotate(t / 300 + i); ctx.fillStyle = '#ffe9a0'; ctx.strokeStyle = OLC; ctx.lineWidth = 1.6; ctx.beginPath();
        for (var k2 = 0; k2 < 8; k2++) { var rk = k2 % 2 ? 2.7 : 6; ctx.lineTo(cos(k2 * TAU / 8) * rk, sin(k2 * TAU / 8) * rk); } ctx.closePath(); ctx.stroke(); ctx.fill(); ctx.restore();
      }
    }
    // muerte: corona que cae, alas desgarradas, abejitas, trozos de cera y miel
    if (dying) mDeathFront(ctx, px, py, s, P, R, f, dt);
  }
  function miniBee(ctx, bx, by, sc, ang, t) {
    ctx.save(); ctx.translate(bx, by); ctx.scale(sc, sc);
    ctx.fillStyle = 'rgba(233,244,255,0.85)'; ctx.strokeStyle = OLC; ctx.lineWidth = 1; ctx.beginPath(); ctx.ellipse(-1, -4.6 + 1.2 * sin(t / 30 + ang), 3.2, 2, -0.4, 0, TAU); ctx.fill(); ctx.stroke();
    ctx.fillStyle = M.amber; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.ellipse(0, 0, 5, 3.4, 0, 0, TAU); ctx.stroke(); ctx.fill();
    ctx.fillStyle = M.blk; ctx.fillRect(-1.4, -3.2, 1.8, 6.4); ctx.fillRect(1.6, -3, 1.4, 6); ctx.restore();
  }
  function mDeathFront(ctx, px, py, s, P, R, f, dt) {
    var i, br = s.broken || {}, GYl = GY;
    function Wq(lx, ly) { return { x: px + f * lx, y: py + ly }; }
    // corona: sale despedida a los 500 ms, rebota y se queda en el suelo brillando
    if (dt >= 500 && !br.corona) {
      var tm = (dt - 500) / 1000, x0 = 66, y0 = -52 + HOVER * 0.4, vx = 70, vy = -360, g = 1000, yy = y0 + vy * tm + 0.5 * g * tm * tm, xx = x0 + vx * tm, gnd = GYl - 22, rot = 0, landed = false;
      if (yy >= gnd) { var tl = (-vy + Math.sqrt(vy * vy - 2 * g * (y0 - gnd))) / g, tb = tm - tl; xx = x0 + vx * tl + 28 * (1 - Math.exp(-tb * 4)); yy = gnd - Math.abs(sin(tb * 7)) * 22 * Math.exp(-tb * 3.4); landed = tb > 1.2; rot = 0.12 * (1 - Math.exp(-tb * 3)) * 4; }
      else rot = tm * 6;
      var al = 1 - clamp((dt - 3100) / 400, 0, 1), cs = A.sprite('boss_reina_crown', 0), q2 = Wq(xx, yy);
      ctx.save(); ctx.globalAlpha = al; ctx.translate(q2.x, q2.y); ctx.rotate(rot * f); ctx.drawImage(cs, -22, -17, 44, 34); ctx.restore();
      if (yy >= gnd - 24 || landed) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = al * (0.5 + 0.3 * sin(dt / 90)); sparkle(ctx, q2.x - 8, q2.y - 14, 8 + 3 * sin(dt / 70), '#fff6c0'); sparkle(ctx, q2.x + 12, q2.y - 6, 5, '#ffffff'); ctx.restore(); }
    }
    // alas desgarradas: giran y aterrizan flotando
    if (dt >= 600 && dt < 3200 && !br.alas) {
      var wt = (dt - 600) / 1000;
      for (i = 0; i < 4; i++) {
        var back = i % 2, side = i < 2 ? 1 : -1, wx = (back ? -6 : 14) + side * (60 + 40 * i) * Math.min(wt, 1.2) * 0.8, wyy = -36 + 120 * wt * wt + 10 * sin(wt * 6 + i), gnd2 = GYl - 14 + (i - 1.5) * 4;
        if (wyy > gnd2) wyy = gnd2; var wal = 1 - clamp((dt - 2400) / 700, 0, 1), spw = A.sprite(back ? 'boss_reina_wing_back' : 'boss_reina_wing_front', 4), q3 = Wq(wx, wyy);
        ctx.save(); ctx.globalAlpha = wal * 0.95; ctx.translate(q3.x, q3.y); ctx.rotate(f * (wt < 1 ? wt * 5 * (i % 2 ? 1 : -1) : 0.2 * (i - 1.5))); ctx.drawImage(spw, -spw.width / 2 * 0.6, -spw.height / 2 * 0.6, spw.width * 0.6, spw.height * 0.6); ctx.restore();
      }
    }
    // abejitas que huyen del cuerpo
    if (dt >= 1000 && dt < 3300) { for (i = 0; i < 7; i++) { var bt = (dt - 1000 - i * 150) / 1000; if (bt <= 0) continue; var q4 = Wq(-20 + pr(i + 1) * 80 + bt * (pr(i + 8) - 0.5) * 300, -10 - bt * 160 + sin(bt * 8 + i) * 12); ctx.globalAlpha = 1 - clamp((bt - 1.2) / 1, 0, 1); miniBee(ctx, q4.x, q4.y, 1, i, dt); } ctx.globalAlpha = 1; }
    // goteo de miel durante el derrumbe
    if (dt >= 1000 && dt < 1800) { for (i = 0; i < 5; i++) { var dp = ((dt / 600) + i / 5) % 1, qd = Wq(-110 + i * 38, 10 + dp * 78); ctx.globalAlpha = 0.9; ctx.drawImage(A.sprite('fx_melaria_drip', Math.min(2, Math.floor(dp * 3))), qd.x - 8, qd.y, 16, 32); } ctx.globalAlpha = 1; }
    // desmoronamiento: cada celda cae como un trozo hexagonal de miel o cera
    if (dt >= 1800 && R.mask) {
      var mask = R.mask, uu = clamp((dt - 1800) / 1500, 0, 1.2), ox2 = -MC * CELL / 2, oy2 = -230 + (HOVER * 0), fade = 1 - clamp((dt - 3000) / 500, 0, 1), j, ii;
      for (j = 0; j < MR; j++) for (ii = 0; ii < MC; ii++) {
        if (!mask[j * MC + ii]) continue; var th = cellTh(ii, j); if (uu <= th) continue;
        var tc = (uu - th) * 1500 / 1000, cxl = ox2 + ii * CELL + CELL / 2, cyl = oy2 + j * CELL + CELL / 2, vy0 = 20 * pr(ii * 3 + j);
        var gnd = GYl - 8 - pr(ii + j * 5) * 12, yy2 = Math.min(cyl + vy0 * tc + 520 * tc * tc, gnd), xx2 = cxl + (pr(ii * 2 + j) - 0.5) * 40 * Math.min(tc, 0.6), wq2 = Wq(xx2, yy2), landed2 = yy2 >= gnd;
        var honey = (ii + j) % 3 !== 0, sz = CELL * (0.5 + pr(ii * 5 + j * 3) * 0.28) * (landed2 ? 0.9 : 1);
        ctx.save(); ctx.globalAlpha = landed2 ? fade * 0.95 : 0.95; ctx.translate(wq2.x, wq2.y); ctx.rotate(landed2 ? (pr(ii + j) - 0.5) : tc * 3 * (pr(ii) - 0.5));
        ctx.fillStyle = honey ? ((ii + j) % 2 ? M.honey : M.honeyH) : M.wax; ctx.strokeStyle = OLC; ctx.lineWidth = 1.4; ctx.beginPath(); hexPath(ctx, 0, 0, sz, 0.3); ctx.fill(); ctx.stroke();
        ctx.fillStyle = 'rgba(255,255,255,0.55)'; ctx.fillRect(-sz * 0.5, -sz * 0.5, sz * 0.5, 2); ctx.restore();
      }
      for (i = 0; i < 6; i++) { var bph = clamp((dt - 1800 - i * 180) / 900, 0, 1); if (bph > 0 && bph < 1) { var bq = Wq(-130 + i * 48, 10 - bph * 40), cc = A.sprite('fx_melaria_chip', 3 + (i % 2)); ctx.globalAlpha = 1 - bph; ctx.drawImage(cc, bq.x - 10, bq.y - 10 - bph * 30, 20, 20); ctx.globalAlpha = 1; } }
    }
  }

  // ================================================================= VFX en funciones
  // ruptura de una parte: p 0..1 (~800 ms); kind 'wing' | 'sting' | 'crown'
  A.drawMelariaShards = function (ctx, x, y, p, o) {
    o = o || {}; p = clamp(p, 0, 1); var n = o.n || 9, i, kind = o.kind || 'wing', al = 1 - clamp((p - 0.6) / 0.4, 0, 1);
    ctx.save(); ctx.globalAlpha = al;
    for (i = 0; i < n; i++) {
      var a = pr(i + 3) * TAU, sp = 90 + pr(i + 9) * 150, px = x + cos(a) * sp * p, py = y + sin(a) * sp * p - 60 * p + 260 * p * p, fr = kind === 'wing' ? (i % 3 === 0 ? 0 : 1) : (kind === 'sting' ? (i % 2 ? 2 : 0) : (i % 2 ? 3 : 0)), sf = A.sprite('fx_melaria_chip', fr), sz = 22 * (0.7 + pr(i + 20) * 0.7);
      ctx.save(); ctx.translate(px, py); ctx.rotate(p * 6 * (pr(i) - 0.5) * 2); ctx.drawImage(sf, -sz / 2, -sz / 2, sz, sz); ctx.restore();
    }
    var bs = A.sprite('fx_part_break', Math.min(4, Math.floor(p * 5))); ctx.globalAlpha = 1; ctx.drawImage(bs, x - 60, y - 60, 120, 120);
    ctx.restore();
  };
  // ondas de zumbido: (x,y) = boca, p 0..1 (progreso de una onda) o t en o.t
  A.drawMelariaBuzz = function (ctx, x, y, p, o) {
    o = o || {}; var r = o.r || 200, i; ctx.save(); ctx.globalCompositeOperation = 'lighter';
    for (i = 0; i < 3; i++) { var q = (p + i / 3) % 1, sp = A.sprite('fx_melaria_buzz', Math.floor(q * 4) % 4), z = 30 + q * r * 2; ctx.globalAlpha = 0.8 * (1 - q); ctx.drawImage(sp, x - z / 2, y - z / 2, z, z); }
    ctx.restore();
  };
  // aura de Jalea real: (x,y) = centro del abdomen, p 0..1 intensidad
  A.drawMelariaJelly = function (ctx, x, y, p, o) {
    o = o || {}; var t = o.t != null ? o.t : performance.now(), i; p = clamp(p, 0, 1);
    ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = 0.5 * p; ctx.drawImage(glowSpr('200,255,210'), x - 120, y - 110, 240, 220); ctx.globalCompositeOperation = 'source-over';
    for (i = 0; i < 6; i++) { var jp = ((t / 1100) + i / 6) % 1, ja = i * 1.9 + t / 800, jr = 90 * (1 - jp); ctx.globalAlpha = p * (1 - jp * 0.7); ctx.drawImage(A.sprite('fx_royal_jelly', Math.floor(t / 120 + i) % 4), x + cos(ja) * jr - 12, y + 30 - jp * 100 + sin(ja) * jr * 0.3 - 12, 24, 24); }
    ctx.restore();
  };
  // polen ambiente alrededor de un punto
  A.drawMelariaPollen = function (ctx, x, y, t, o) {
    o = o || {}; var n = o.n || 8, r = o.r || 90, i; ctx.save();
    for (i = 0; i < n; i++) { var ph = ((t / 2400) + i / n) % 1, a = i * 2.4 + t / 1900, rr = r * (0.3 + 0.7 * pr(i + 3)); ctx.globalAlpha = (o.alpha == null ? 0.8 : o.alpha) * Math.sin(ph * PI); ctx.fillStyle = i % 2 ? '#fff0a0' : '#ffc43a'; ctx.fillRect(x + cos(a) * rr - 1.5, y + sin(a) * rr * 0.6 - ph * 18 - 1.5, 3, 3); }
    ctx.restore();
  };
  // anillo hexagonal del Zumbido Mortal: (x,y) centro, R = radio (al vertice), o.state 'idle'|'warn'|'hit', o.p 0..1 (relleno del aviso),
  // o.gaps = [angulo central en rad, ...] (hueco de o.gapHalf rad, por defecto 0.25), o.th grosor (26), o.alpha
  A.drawMelariaRing = function (ctx, x, y, R, o) {
    o = o || {}; var st = o.state || 'warn', p = o.p == null ? 1 : clamp(o.p, 0, 1), th = o.th || 26, gh = o.gapHalf == null ? 0.25 : o.gapHalf, gaps = o.gaps || [], N = 150, i, al = o.alpha == null ? 1 : o.alpha, t = o.t != null ? o.t : performance.now();
    var a = R * cos(PI / 6);
    function rad(th2) { var m = ((th2 % (PI / 3)) + PI / 3) % (PI / 3) - PI / 6; return a / cos(m); }
    function inGap(ang) { for (var g = 0; g < gaps.length; g++) { var d = Math.abs(((ang - gaps[g] + PI * 3) % TAU) - PI); if (d < gh) return true; } return false; }
    ctx.save(); ctx.globalAlpha = al; ctx.lineCap = 'butt'; ctx.lineJoin = 'round';
    var cols = st === 'hit' ? ['rgba(255,235,220,0.95)', 'rgba(255,90,70,0.85)'] : (st === 'warn' ? ['rgba(255,59,48,' + (0.2 + 0.32 * p).toFixed(2) + ')', 'rgba(255,106,90,0.95)'] : ['rgba(122,74,20,0.22)', 'rgba(122,74,20,0.7)']);
    for (var pass = 0; pass < 2; pass++) {
      ctx.strokeStyle = pass ? cols[1] : cols[0]; ctx.lineWidth = pass ? 3 : th; if (pass && st === 'idle') ctx.setLineDash([8, 7]); if (pass && st === 'warn' && p < 0.75) { ctx.setLineDash([12, 8]); ctx.lineDashOffset = -t / 40; }
      var pen = false; ctx.beginPath();
      for (i = 0; i <= N; i++) {
        var ang = i / N * TAU, ok = !inGap(ang), rr = rad(ang) + (pass ? th / 2 : 0), px = x + cos(ang) * rr, py = y + sin(ang) * rr * (o.ry || 1);
        if (!ok) { pen = false; continue; } if (!pen) { ctx.moveTo(px, py); pen = true; } else ctx.lineTo(px, py);
      }
      ctx.stroke(); if (pass) { ctx.beginPath(); pen = false; ctx.setLineDash([]); for (i = 0; i <= N; i++) { var ang2 = i / N * TAU, ok2 = !inGap(ang2), rr2 = rad(ang2) - th / 2, px2 = x + cos(ang2) * rr2, py2 = y + sin(ang2) * rr2 * (o.ry || 1); if (!ok2) { pen = false; continue; } if (!pen) { ctx.moveTo(px2, py2); pen = true; } else ctx.lineTo(px2, py2); } ctx.stroke(); }
      ctx.setLineDash([]);
    }
    // marcas blancas en los huecos (zonas seguras)
    ctx.fillStyle = 'rgba(255,255,255,0.9)'; ctx.strokeStyle = OLC; ctx.lineWidth = 1.4;
    gaps.forEach(function (g) { for (var s2 = -1; s2 <= 1; s2 += 2) { var ag = g + s2 * gh, rr3 = rad(ag), cx = x + cos(ag) * rr3, cy = y + sin(ag) * rr3 * (o.ry || 1); ctx.beginPath(); ctx.arc(cx, cy, 4, 0, TAU); ctx.fill(); ctx.stroke(); } });
    ctx.restore();
  };

  // ================================================================= TELEGRAFIAS NUEVAS
  var COLS = { red: { f: '255,59,48', s: '#ff6a5a' }, amber: { f: '201,122,20', s: '#7a4a14' }, green: { f: '170,255,200', s: '#d8ffe8' }, purple: { f: '176,90,240', s: '#dca0ff' }, white: { f: '230,247,255', s: '#ffffff' } };
  var T4 = { larvae1: 'red', stinglane: 'red', dive: 'red', quills: 'red', honeycells: 'amber', whirl: 'red', jelly: 'green', larvae: 'red', swarm: 'purple', pollen: 'amber', honey: 'amber' };
  function sector(path, x, y, r, a0, a1, inner) { if (inner > 0) { path.arc(x, y, r, a0, a1); path.arc(x, y, inner, a1, a0, true); } else { path.moveTo(x, y); path.arc(x, y, r, a0, a1); } path.closePath(); }
  function tele4(ctx, kind, x, y, o) {
    o = o || {}; var p = o.p == null ? 1 : clamp(o.p, 0, 1), col = COLS[o.color || T4[kind]], a = o.a || 0, t = o.t != null ? o.t : performance.now(), fix = o.fix != null ? o.fix : p >= 0.7, r = o.r || 100, path = new Path2D(), prog = new Path2D(), extra = null, i;
    if (kind === 'stinglane') {
      var w = o.w || 70, len = o.len || 420, ca = cos(a), sa = sin(a), tipL = Math.min(46, len * 0.25);
      function pt(P2, lx, ly, first) { var wx = x + lx * ca - ly * sa, wy = y + lx * sa + ly * ca; if (first) P2.moveTo(wx, wy); else P2.lineTo(wx, wy); }
      function lanePath(P2, L2) { var tl = Math.min(tipL, L2); pt(P2, 0, -w / 2, true); pt(P2, Math.max(0, L2 - tl), -w / 2); pt(P2, L2, 0); pt(P2, Math.max(0, L2 - tl), w / 2); pt(P2, 0, w / 2); P2.closePath(); }
      lanePath(path, len); lanePath(prog, Math.max(4, len * p));
      extra = function () {
        ctx.save(); ctx.translate(x, y); ctx.rotate(a);
        ctx.strokeStyle = 'rgba(255,255,255,0.45)'; ctx.lineWidth = 2; ctx.setLineDash([10, 12]); ctx.lineDashOffset = -t / 30; ctx.beginPath(); ctx.moveTo(8, 0); ctx.lineTo(len - 14, 0); ctx.stroke(); ctx.setLineDash([]);
        ctx.fillStyle = 'rgba(255,235,225,0.85)'; for (var q = 0; q < Math.floor(len / 64); q++) { var cx = 34 + q * 64 + ((t / 9) % 32) * p; if (cx > len - 24) continue; ctx.beginPath(); ctx.moveTo(cx + 12, 0); ctx.lineTo(cx - 6, -10); ctx.lineTo(cx - 6, 10); ctx.closePath(); ctx.fill(); }
        ctx.strokeStyle = 'rgba(255,255,255,0.95)'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(len - 10, -8); ctx.lineTo(len + 4, 0); ctx.lineTo(len - 10, 8); ctx.stroke();
        ctx.restore();
      };
    } else if (kind === 'dive') {
      r = o.r || 100; path.arc(x, y, r, 0, TAU); prog.arc(x, y, Math.max(1, r * p), 0, TAU);
      extra = function () {
        ctx.save(); ctx.translate(x, y); ctx.scale(1, 1);
        ctx.fillStyle = 'rgba(30,14,2,' + (0.12 + 0.28 * p).toFixed(3) + ')'; ctx.beginPath(); ctx.ellipse(0, 0, r * (0.35 + 0.65 * p), r * (0.35 + 0.65 * p), 0, 0, TAU); ctx.fill();
        ctx.fillStyle = 'rgba(255,235,225,0.9)'; for (var q = 0; q < 6; q++) { var ag = q * PI / 3 + t / 900, rr = r * (0.92 - 0.3 * ((t / 600 + q / 6) % 1)); ctx.save(); ctx.translate(cos(ag) * rr, sin(ag) * rr); ctx.rotate(ag + PI); ctx.beginPath(); ctx.moveTo(9, 0); ctx.lineTo(-6, -6); ctx.lineTo(-6, 6); ctx.closePath(); ctx.fill(); ctx.restore(); }
        ctx.strokeStyle = 'rgba(255,255,255,0.7)'; ctx.lineWidth = 1.8; ctx.beginPath(); ctx.moveTo(-9, 0); ctx.lineTo(9, 0); ctx.moveTo(0, -9); ctx.lineTo(0, 9); ctx.stroke();
        ctx.restore();
      };
    } else if (kind === 'quills') {
      var arc = o.arc || 80 * PI / 180, R0 = o.r || 400, n = o.n || 9, a0 = a - arc / 2, a1 = a + arc / 2;
      sector(path, x, y, R0, a0, a1, 0); sector(prog, x, y, Math.max(2, R0 * p), a0, a1, 0);
      extra = function () {
        ctx.strokeStyle = 'rgba(255,235,225,0.8)'; ctx.fillStyle = 'rgba(255,235,225,0.9)'; ctx.lineWidth = 1.8; ctx.setLineDash([6, 8]); ctx.lineDashOffset = -t / 40;
        for (var q = 0; q < n; q++) { var ag = a0 + arc * (n === 1 ? 0.5 : q / (n - 1)); ctx.beginPath(); ctx.moveTo(x + cos(ag) * 30, y + sin(ag) * 30); ctx.lineTo(x + cos(ag) * R0 * 0.92, y + sin(ag) * R0 * 0.92); ctx.stroke(); }
        ctx.setLineDash([]);
        for (var q2 = 0; q2 < n; q2++) { var ag2 = a0 + arc * (n === 1 ? 0.5 : q2 / (n - 1)), d = R0 * 0.92 * Math.max(0.15, p); ctx.save(); ctx.translate(x + cos(ag2) * d, y + sin(ag2) * d); ctx.rotate(ag2); ctx.beginPath(); ctx.moveTo(8, 0); ctx.lineTo(-5, -3.4); ctx.lineTo(-5, 3.4); ctx.closePath(); ctx.fill(); ctx.restore(); }
      };
    } else if (kind === 'whirl') {
      var inner = o.inner == null ? 100 : o.inner; r = o.r || 260;
      path.arc(x, y, r, 0, TAU); path.moveTo(x + inner, y); path.arc(x, y, inner, 0, TAU, true);
      prog.arc(x, y, inner + (r - inner) * p, 0, TAU); prog.moveTo(x + inner, y); prog.arc(x, y, inner, 0, TAU, true);
      extra = function () {
        ctx.fillStyle = 'rgba(230,247,255,' + (0.1 + 0.08 * sin(t / 140)).toFixed(3) + ')'; ctx.beginPath(); ctx.arc(x, y, inner, 0, TAU); ctx.fill();
        ctx.strokeStyle = 'rgba(230,247,255,0.95)'; ctx.lineWidth = 3; ctx.setLineDash([8, 6]); ctx.lineDashOffset = t / 40; ctx.beginPath(); ctx.arc(x, y, inner, 0, TAU); ctx.stroke(); ctx.setLineDash([]);
        ctx.strokeStyle = 'rgba(255,236,224,0.8)'; ctx.fillStyle = 'rgba(255,236,224,0.9)'; ctx.lineWidth = 2.4; ctx.lineCap = 'round';
        for (var q = 0; q < 4; q++) { var a00 = t / 500 + q * PI / 2, rm = (inner + r) / 2; ctx.beginPath(); ctx.arc(x, y, rm, a00, a00 + 0.8); ctx.stroke(); var ea = a00 + 0.8; ctx.beginPath(); ctx.moveTo(x + cos(ea) * (rm + 9), y + sin(ea) * (rm + 9)); ctx.lineTo(x + cos(ea - 0.16) * (rm - 8), y + sin(ea - 0.16) * (rm - 8)); ctx.lineTo(x + cos(ea + 0.2) * rm * 1.0, y + sin(ea + 0.2) * rm * 1.0); ctx.closePath(); ctx.fill(); }
      };
    } else if (kind === 'jelly') {
      r = o.r || 130; path.arc(x, y, r, 0, TAU); prog.arc(x, y, Math.max(1, r * p), 0, TAU);
      extra = function () {
        ctx.save(); ctx.lineCap = 'round'; ctx.strokeStyle = 'rgba(27,17,36,0.55)'; ctx.lineWidth = 9; ctx.beginPath(); ctx.arc(x, y, r + 8, -PI / 2, -PI / 2 + TAU * p); ctx.stroke();
        ctx.strokeStyle = '#eafff0'; ctx.lineWidth = 5; ctx.beginPath(); ctx.arc(x, y, r + 8, -PI / 2, -PI / 2 + TAU * p); ctx.stroke(); ctx.restore();
        var cc = A.sprite('fx_royal_jelly', Math.floor(t / 125) % 4); ctx.globalAlpha = 0.9; ctx.drawImage(cc, x - 22, y - 22, 44, 44); ctx.globalAlpha = 1;
        if (o.hit != null) { var bw = 90, bh = 9, hx = x - bw / 2, hy = y + r + 22, hv2 = clamp(o.hit, 0, 1); ctx.fillStyle = 'rgba(27,17,36,0.75)'; ctx.fillRect(hx - 2, hy - 2, bw + 4, bh + 4); ctx.fillStyle = 'rgba(255,255,255,0.18)'; ctx.fillRect(hx, hy, bw, bh); ctx.fillStyle = hv2 > 0.8 ? '#ffd24a' : '#ff9a3a'; ctx.fillRect(hx, hy, bw * hv2, bh); ctx.strokeStyle = '#fff'; ctx.lineWidth = 1; ctx.strokeRect(hx, hy, bw, bh); }
      };
    } else if (kind === 'larvae') {
      var pts = o.pts || [], rr = o.r || 46;
      for (i = 0; i < pts.length; i++) tele4(ctx, 'larvae1', pts[i].x, pts[i].y, { r: rr, p: clamp(p * 1.4 - i * 0.08, 0, 1), t: t, fix: p >= 0.7 });
      return true;
    } else if (kind === 'larvae1') {
      r = o.r || 46; path.arc(x, y, r, 0, TAU); prog.arc(x, y, Math.max(1, r * p), 0, TAU);
      extra = function () { ctx.fillStyle = 'rgba(255,240,225,' + (0.5 + 0.4 * sin(t / (120 - 60 * p))).toFixed(2) + ')'; ctx.strokeStyle = OLC; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.ellipse(x, y, 11, 8, 0, 0, TAU); ctx.fill(); ctx.stroke(); ctx.fillStyle = OLC; ctx.fillRect(x - 5, y - 2, 2, 2); ctx.fillRect(x + 3, y - 2, 2, 2); };
    } else if (kind === 'swarm') {
      r = o.r || 120; path.arc(x, y, r, 0, TAU); prog.arc(x, y, Math.max(1, r * p), 0, TAU);
      extra = function () { for (var q = 0; q < 12; q++) { var u2 = (q / 12 + t / 1800) % 1, ag = u2 * TAU * 2 + q, rr3 = r * (1 - u2 * 0.85); miniBee(ctx, x + cos(ag) * rr3, y + sin(ag) * rr3 * 0.8, 0.8, ag, t); } ctx.strokeStyle = 'rgba(230,200,255,0.8)'; ctx.lineWidth = 1.8; ctx.setLineDash([5, 7]); ctx.beginPath(); ctx.arc(x, y, r * 0.5, 0, TAU); ctx.stroke(); ctx.setLineDash([]); };
    } else if (kind === 'pollen') {
      r = o.r || 90; path.arc(x, y, r, 0, TAU); prog.arc(x, y, Math.max(1, r * p), 0, TAU);
      extra = function () { A.drawMelariaPollen(ctx, x, y, t, { n: 12, r: r * 0.9, alpha: 1 }); };
    } else if (kind === 'honey') {
      r = o.r || 70; path.arc(x, y, r, 0, TAU); prog.arc(x, y, Math.max(1, r * p), 0, TAU);
      extra = function () { ctx.fillStyle = 'rgba(255,214,120,0.8)'; for (var q = 0; q < 6; q++) { var ph = ((t / 1800) + q / 6) % 1, ag = q * 1.7 + t / 3000; ctx.globalAlpha = Math.sin(ph * PI); ctx.beginPath(); ctx.arc(x + cos(ag) * r * 0.6 * pr(q + 2), y + sin(ag) * r * 0.5 * pr(q + 4) - ph * 8, 2.5 + pr(q) * 2, 0, TAU); ctx.fill(); } ctx.globalAlpha = 1; };
    } else if (kind === 'honeycells') {
      var cells = o.cells || [], hr = o.r || 44;
      cells.forEach(function (c, k) {
        var pc = clamp(p * 1.5 - k * 0.05, 0, 1), cx = c.x, cy = c.y, hp2 = new Path2D(); hexPath(hp2, cx, cy, hr, 0);
        ctx.save(); ctx.lineJoin = 'round';
        ctx.fillStyle = c.nest ? 'rgba(255,59,48,' + (0.1 + 0.26 * pc + 0.12 * sin(t / 110)).toFixed(3) + ')' : 'rgba(201,122,20,' + (0.1 + 0.4 * pc).toFixed(3) + ')'; ctx.fill(hp2);
        var hp3 = new Path2D(); hexPath(hp3, cx, cy, hr * Math.max(0.15, pc), 0); ctx.fillStyle = c.nest ? 'rgba(255,59,48,0.26)' : 'rgba(240,166,58,0.34)'; ctx.fill(hp3);
        ctx.strokeStyle = 'rgba(255,255,255,0.55)'; ctx.lineWidth = 5.2; ctx.stroke(hp2);
        ctx.strokeStyle = c.nest ? '#ff6a5a' : '#7a4a14'; ctx.lineWidth = 3; if (!(fix && c.nest)) { ctx.setLineDash([9, 7]); ctx.lineDashOffset = -t / 40; } ctx.stroke(hp2); ctx.setLineDash([]);
        if (c.nest) { ctx.fillStyle = 'rgba(255,240,225,0.9)'; ctx.strokeStyle = OLC; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.ellipse(cx, cy, 10 + 2 * sin(t / 100), 7, 0, 0, TAU); ctx.fill(); ctx.stroke(); ctx.fillStyle = OLC; ctx.fillRect(cx - 4, cy - 2, 2, 2); ctx.fillRect(cx + 2, cy - 2, 2, 2); }
        ctx.restore();
      });
      return true;
    } else return false;
    ctx.save(); ctx.lineJoin = 'round';
    ctx.fillStyle = 'rgba(' + col.f + ',' + (0.12 + 0.28 * p).toFixed(3) + ')'; ctx.fill(path, 'evenodd');
    ctx.fillStyle = 'rgba(' + col.f + ',0.20)'; ctx.fill(prog, 'evenodd');
    if (o.sig) { ctx.strokeStyle = 'rgba(255,255,255,0.28)'; ctx.lineWidth = 9; ctx.stroke(path); }
    ctx.strokeStyle = 'rgba(27,17,36,0.45)'; ctx.lineWidth = (fix ? 3.4 : 2.6) + 2.6; ctx.stroke(path);   // filo oscuro: se lee sobre la cera clara
    ctx.strokeStyle = col.s; ctx.globalAlpha = 0.9; ctx.lineWidth = fix ? 3.4 : 2.6;
    if (!fix) { ctx.setLineDash([11, 8]); ctx.lineDashOffset = -t / 40; }
    ctx.stroke(path); ctx.setLineDash([]); ctx.globalAlpha = 1;
    if (o.sig2 || o.sig) { ctx.strokeStyle = 'rgba(27,17,36,0.55)'; ctx.lineWidth = 1.4; ctx.stroke(path); }
    if (extra) extra();
    ctx.restore(); return true;
  }
  var oldTele = A.drawBossTele;
  A.drawBossTele = function (ctx, kind, x, y, o) { if (T4[kind]) return tele4(ctx, kind, x, y, o); return oldTele.apply(A, arguments); };

  // ================================================================= API PUBLICA (envuelve la anterior; los ids viejos siguen igual)
  var BOSSES = A.BOSS, B4 = {
    melaria: {
      id: 'melaria', name: 'Melaria', title: 'La Reina Abeja', r: 70, gy: GY, w: 300, h: 260, deathMs: MDEATH, windups: MNAMES, hover: HOVER,
      phases: ['Corte real', 'Enjambre', 'Reina furiosa'], despair: 'Zumbido Mortal',
      parts: { alas: { r: 52 }, aguijon: { r: 24 }, corona: { r: 24 } }, windowColor: '#e6f7ff', speeds: [60, 70, 80], eyes: ['#c8f5a0', '#ffc440', '#ffe6f2'],
      weak: [['fire', 1.25], ['ice', 1.25]], resist: [['poison', 0.5], ['lightning', 0.8]], immuneStates: ['poison'],
      render: renderMelaria, shadow: mShadow, aura: mAura, front: mFront
    }
  };
  BOSSES.melaria = B4.melaria; B4.reina = B4.melaria;
  Object.defineProperty(BOSSES, 'reina', { value: B4.melaria, enumerable: false, configurable: true, writable: true });
  H.reg['boss_melaria_portrait'] = H.reg['boss_reina_portrait'];
  var oldDraw = A.drawBoss, oldRender = A.renderBoss, oldShadow = A.drawBossShadow, oldAnch = A.bossAnchors, oldNames = A.bossPoseNames, oldWeak = A.drawWeakIcon;
  A.drawBoss = function (id, ctx, x, y, s) {
    var B = B4[id]; if (!B) return oldDraw.apply(A, arguments);
    s = s || {}; var R = B.render(s), P = R.pose, dying = s.dying && (s.dt != null ? s.dt : (s.deathT || 0)) >= B.deathMs;
    if (!s.noShadow) B.shadow(ctx, x, y, s);
    if (P && !s.noFx) B.aura(ctx, x, y, s, P);
    if (!dying) {
      var b = R.box, al = s.alpha == null ? 1 : s.alpha; if (al < 1) { ctx.save(); ctx.globalAlpha = al; }
      ctx.drawImage(R.canvas, b.x, b.y, b.w, b.h, Math.round(x - R.ox) + b.x, Math.round(y - R.oy) + b.y, b.w, b.h);
      if (al < 1) ctx.restore();
    }
    if (P && !s.noFx) B.front(ctx, x, y, s, P, R);
    return R;
  };
  A.renderBoss = function (id, s) { var B = B4[id]; return B ? B.render(s || {}) : oldRender.apply(A, arguments); };
  A.drawBossShadow = function (ctx, x, y, s) { var id = s && s.id; if (id && B4[id]) return B4[id].shadow(ctx, x, y, s); return oldShadow.apply(A, arguments); };
  A.bossPoseNames = function (id) { return (id === 'melaria' || id === 'reina') ? MNAMES.slice() : oldNames.apply(A, arguments); };
  // iconos de debilidad/resistencia: {immune:true} pinta el icono de "inmune" sobre la etiqueta (Veneno inmune a estados)
  A.drawWeakIcon = function (ctx, tag, x, y, o) {
    if (o && o.immune) { o = Object.assign({}, o); delete o.mult; }
    oldWeak.call(A, ctx, tag, x, y, o);
    if (o && o.immune) {
      var sz = o.size || 24, ic = A.sprite('icon_immune'); ctx.drawImage(ic, x + sz * 0.45, y - sz * 0.05, sz * 0.6, sz * 0.6);
      ctx.save(); ctx.font = 'bold 9px "Courier New", monospace'; ctx.textAlign = 'left'; ctx.textBaseline = 'middle'; ctx.lineWidth = 3; ctx.strokeStyle = OLC; ctx.fillStyle = '#cfc8dc'; ctx.strokeText('INM', x + sz + 3, y + sz * 0.5); ctx.fillText('INM', x + sz + 3, y + sz * 0.5); ctx.restore();
    }
  };
  A.melariaPortraitId = 'boss_reina_portrait';
  function rdp(p, r) { return { x: rd(p.x), y: rd(p.y), r: r || 0 }; }
  A.bossAnchors = function (id, s) {
    if (id !== 'melaria' && id !== 'reina') return oldAnch.apply(A, arguments);
    s = s || {}; var f = s.facing < 0 ? -1 : 1, P = mPoseFor(s), L = mLayout(P, s), br = s.broken || {}, hv = P.hover, sx = P.sx;
    function X(p, r) { return { x: rd(p.x * f * sx), y: rd(p.y - hv), r: r || 0 }; }
    var out = { body: { x: 0, y: rd(-hv), r: 70 }, head: X(L.head, 30), crown: X(L.crown, 24), corona: X(L.crown, 24), mouth: X(L.mouth, 10), eyes: X(L.eyes, 8), thorax: X({ x: 0, y: P.by }, 46) };
    var th0 = wingAngles(P, s.t || 0, false, false, br), th1 = wingAngles(P, s.t || 0, true, false, br), a0 = th0.th, a1 = th1.th;
    var wf = T(P, WROOT.nf[0] + cos(a0) * 54, WROOT.nf[1] + sin(a0) * 54), wb = T(P, WROOT.nb[0] - cos(a1) * 48, WROOT.nb[1] + sin(a1) * 48);
    out.alas = X({ x: (wf.x + wb.x) / 2, y: (wf.y + wb.y) / 2 }, 52);
    out.wingFront = X(wf, 30); out.wingBack = X(wb, 30);
    out.wingTip = X(T(P, WROOT.nf[0] + cos(a0) * 118, WROOT.nf[1] + sin(a0) * 118), 14); out.wingTipBack = X(T(P, WROOT.nb[0] - cos(a1) * 104, WROOT.nb[1] + sin(a1) * 104), 14);
    out.abdomen = X(L.abC, 44); out.aguijon = X(L.tip, 24); var stA = f > 0 ? L.stingA : PI - L.stingA;
    out.stingTip = { x: rd(L.tip.x * f * sx), y: rd(L.tip.y - hv), r: 8, a: Math.round((((stA % TAU) + TAU) % TAU) * 1000) / 1000 };
    out.stingBase = X(L.tipRoot, 10); out.spawn = X(L.abC, 0); out.jelly = X({ x: L.crown.x, y: L.crown.y - 8 }, 0);
    out.feet = { x: 0, y: GY, r: 0 }; out.groundShadow = { x: 0, y: GY + 4, r: 130 }; out.hover = { x: 0, y: rd(-hv), r: 0, h: rd(hv) };
    return out;
  };
})();
