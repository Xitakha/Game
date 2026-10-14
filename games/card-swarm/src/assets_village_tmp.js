/*!
 * assets_village.js - Arte de la aldea "Rescoldo" (Swarm Hand v3): fondo por capas, edificios, props, 6 NPC animales, retratos, emotes y UI.
 * Se carga DESPUES de assets.js (usa Assets._h). Contrato de nombres/tamanos: ASSETS_API.md, seccion "Aldea v3".
 * Misma gramatica que assets.js: contorno grueso #1b1124, color plano + 1 sombra + 1 brillo. Coordenadas "base"; se rasteriza a x2.
 */
(function () {
  'use strict';
  var A = window.Assets, H = A && A._h;
  if (!H) { if (window.console) console.error('assets_village: falta Assets._h (cargar tras assets.js)'); return; }
  var addV = H.addV, Pclosed = H.Pclosed, Ppoly = H.Ppoly, Pblob = H.Pblob, Prr = H.Prr, Pcirc = H.Pcirc, OLC = H.OLC, rrand = H.rrand, mkCanvas = H.mkCanvas;
  var TAU = 6.2832, PI = Math.PI;
  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  function lerp(a, b, k) { return a + (b - a) * k; }

  // =================================================================== NPCs (celda 40x42 base -> 80x84 final; pies en (20,40))
  function eyesF(v, p, xs, y, r, o) {
    var x = v.ctx;
    xs.forEach(function (ex) {
      if (p.eyes === 'happy') { x.strokeStyle = OLC; x.lineWidth = 0.95; x.beginPath(); x.arc(ex, y + r * 0.55, r * 0.95, PI * 1.12, PI * 1.88); x.stroke(); }
      else if (p.eyes === 'closed') { x.strokeStyle = OLC; x.lineWidth = 0.95; x.beginPath(); x.arc(ex, y - r * 0.4, r * 0.95, 0.25, PI - 0.25); x.stroke(); }
      else v.eye(ex, y, r, o);
    });
  }
  function mouthF(v, p, mx, my, w) {
    var x = v.ctx;
    if (p.mouth >= 1) {
      v.part(Pblob(mx, my + 0.6, w * 0.5, p.mouth === 2 ? w * 0.5 : w * 0.26, 77), '#4a0e1c', { lw: 0.6 });
      if (p.mouth === 2) v.part(Pblob(mx, my + 1.5, w * 0.3, w * 0.16, 78), '#e8707a', { lw: 0 });
    } else {
      x.strokeStyle = OLC; x.lineWidth = 0.85; x.beginPath();
      if (p.eyes === 'happy') x.arc(mx, my - 0.9, w * 0.55, 0.15, PI - 0.15); else { x.moveTo(mx - w / 2, my); x.quadraticCurveTo(mx, my + 0.9, mx + w / 2, my - 0.3); }
      x.stroke();
    }
  }
  function star(v, cx, cy, r, col, rot) { // chispa de 4 puntas
    var P = [], i;
    for (i = 0; i < 8; i++) { var a = (rot || 0) + i * PI / 4, rr = i % 2 ? r * 0.38 : r; P.push([cx + Math.cos(a) * rr, cy + Math.sin(a) * rr]); }
    v.part(Ppoly(P), col, { lw: 0.5, ol: '#a8401c', so: 0.1, sh: null });
  }
  function paper(v, cx, cy, rot, w, h) {
    var x = v.ctx; x.save(); x.translate(cx, cy); x.rotate(rot);
    v.part(Prr(-w / 2, -h / 2, w, h, 0.4), '#f6ecd0', { lw: 0.7, sh: '#d0c090', so: 0.4 });
    v.line(-w * 0.3, -h * 0.2, w * 0.3, -h * 0.2, 0.45, '#8a7a5a'); v.line(-w * 0.3, h * 0.05, w * 0.15, h * 0.05, 0.45, '#8a7a5a');
    v.dot(0, -h / 2 + 0.7, 0.6, '#d03a2a');
    x.restore();
  }
  function stickAt(v, hx, hy, ang, len, w, col, hi) { // palo desde la mano (hx,hy)
    return v.stick([[hx, hy], [hx + Math.cos(ang) * len, hy + Math.sin(ang) * len]], w, col, { lw: 1.1, hi: hi });
  }

  // ---- GRUM: oso herrero
  function grum(p) {
    return function (v) {
      var x = v.ctx, by = -0.7 * p.b, a = p.act == null ? -1 : p.act, fur = '#8a4f2c', furS = '#5e3319', furH = '#b87a4a';
      v.part(Prr(8, 36, 10, 5, 2.2), furS, { lw: 1.4, sh: '#3a1e0e', so: 0.4 }); v.part(Prr(22, 36, 10, 5, 2.2), furS, { lw: 1.4, sh: '#3a1e0e', so: 0.4 });
      v.part(Pblob(7.5, 27, 3.8, 6.5, 13, 0.04, 8, 0.2), fur, { lw: 1.5, sh: furS, hi: furH, so: 0.8 });          // brazo trasero
      v.part(Pblob(20, 27 + by * 0.4, 14, 11.6 + p.b * 0.3, 11, 0.03, 10), fur, { lw: 1.7, sh: furS, hi: furH, so: 1.3 });
      v.part(Prr(10.5, 23 + by, 19, 14, 3), '#6a4428', { lw: 1.4, sh: '#3c2414', hi: '#8a5c38', so: 1 });          // delantal
      v.line(12.4, 18 + by, 14.2, 24 + by, 2.3, '#3c2414'); v.line(27.6, 18 + by, 25.8, 24 + by, 2.3, '#3c2414');
      v.part(Prr(15, 30, 10, 5, 1), '#4a2e1a', { lw: 0.8, sh: '#2c1a0e', so: 0.3 }); v.dot(16.4, 31.4, 0.5, '#d8c8a0'); v.dot(23.6, 31.4, 0.5, '#d8c8a0');
      // cabeza
      v.part(Pcirc(10.8, 9.2 + by, 3.7), fur, { lw: 1.4, sh: furS, hi: furH, so: 0.6 }); v.dot(10.8, 9.6 + by, 1.8, '#d9a07c');
      v.part(Pcirc(29.2, 9.2 + by, 3.7), fur, { lw: 1.4, sh: furS, hi: furH, so: 0.6 }); v.dot(29.2, 9.6 + by, 1.8, '#d9a07c');
      v.part(Pblob(20, 14.4 + by, 10, 8.6, 14, 0.03, 10), fur, { lw: 1.7, sh: furS, hi: furH, so: 1.1 });
      v.part(Pblob(24.6, 17.8 + by, 5.8, 4.3, 15), '#d9b387', { lw: 1.1, sh: '#b08a5e', so: 0.5 });
      v.part(Pblob(28.2, 16.2 + by, 1.9, 1.4, 16), '#2a1a14', { lw: 0.4 }); v.dot(27.6, 15.7 + by, 0.4, '#fff');
      v.part(Ppoly([[10.4, 10.6 + by], [29.8, 10.6 + by], [29.2, 13.4 + by], [11, 13.4 + by]]), '#c8342b', { lw: 1, sh: '#8a1e1e', hi: '#ee6a52', so: 0.5 }); // pañuelo
      v.part(Ppoly([[10.8, 10.8 + by], [5.2, 8.8 + by], [6.8, 12.2 + by]]), '#c8342b', { lw: 0.9, sh: '#8a1e1e', so: 0.3 });
      v.part(Ppoly([[10.8, 12.4 + by], [5.6, 14.8 + by], [8, 10.8 + by]]), '#a82a24', { lw: 0.8, sh: '#6a1414', so: 0.3 });
      eyesF(v, p, [19.4, 25.6], 14.6 + by, 1.05, { white: '#fff', sh: false, lw: 0.4, pr: 0.7 });
      if (p.eyes !== 'closed' && p.eyes !== 'happy') { v.line(16.8, 13.4 + by, 21, 14.2 + by, 0.9, furS); v.line(27.8, 13.4 + by, 23.8, 14.2 + by, 0.9, furS); }
      mouthF(v, p, 25, 20.4 + by, 3);
      // brazo + martillo
      var hx = 31, hy = 22, ang = -1.35, len = 14;
      if (a === 0) { hx = 30; hy = 17; ang = -1.1; len = 13; }
      else if (a === 1 || a === 2) { hx = 28; hy = 26; ang = 0.9; len = 11; }
      else if (a === 3) { hx = 28; hy = 22; ang = -0.6; len = 11; }
      v.stick([[27, 20.5 + by], [hx, hy]], 5.6, fur, { lw: 1.5, hi: furH });
      stickAt(v, hx, hy, ang, len, 2.6, '#9a6a3a', '#c08a52');
      x.save(); x.translate(hx + Math.cos(ang) * len, hy + Math.sin(ang) * len); x.rotate(ang);
      v.part(Prr(-2.6, -4.6, 7.4, 9.2, 1.2), '#7a8498', { lw: 1.4, sh: '#4a5468', hi: '#b8c2d8', so: 0.7 }); x.restore();
      v.part(Pcirc(hx, hy, 3), fur, { lw: 1.4, sh: furS, hi: furH, so: 0.5 });
      if (a === 1) { star(v, 37.4, 37.6, 3.4, '#ffd23a', 0.2); v.dot(34.4, 39.6, 0.6, '#ff9a2a'); }
      if (a === 2) { star(v, 37.6, 37.2, 4.4, '#fff3b0', 0.5); star(v, 33.4, 34, 2, '#ffd23a', 0.1); v.dot(37.6, 32.6, 0.7, '#ff9a2a'); v.dot(39.2, 36, 0.6, '#ffd23a'); }
    };
  }
  // ---- VESPER: zorra de encargos
  function vesper(p) {
    return function (v) {
      var x = v.ctx, by = -0.6 * p.b, a = p.act == null ? -1 : p.act, o = '#e8782a', oS = '#b04e16', oH = '#ffa860', cr = '#f8ecd8';
      var tw = p.b * 0.9;
      v.part(Pclosed([[14, 31], [7, 33.5], [1.5, 27], [2, 18 - tw], [6.5, 14 - tw], [8, 21], [12, 26]]), o, { lw: 1.6, sh: oS, hi: oH, so: 0.9 });
      v.part(Pclosed([[1.6, 23], [2, 18 - tw], [6.2, 14.4 - tw], [6.6, 18 - tw], [3.6, 23.4]]), cr, { lw: 0, sh: '#d8c8b0', so: 0.4 });
      v.part(Prr(14, 34, 4.4, 6.6, 1.8), '#3a2418', { lw: 1.2, sh: '#1c100a', so: 0.3 }); v.part(Prr(21.4, 34, 4.4, 6.6, 1.8), '#3a2418', { lw: 1.2, sh: '#1c100a', so: 0.3 });
      v.part(Prr(15, 38.2, 7, 2.8, 1.3), '#3a2418', { lw: 1.1, sh: '#1c100a', so: 0.2 }); v.part(Prr(22.4, 38.2, 7, 2.8, 1.3), '#3a2418', { lw: 1.1, sh: '#1c100a', so: 0.2 });
      v.part(Ppoly([[14, 17 + by], [26.5, 17 + by], [29.5, 30], [31, 36.5], [27, 34.8], [23, 37], [19, 34.8], [15, 37], [11, 34.8], [9, 36.5], [10.5, 30]]), '#2e6a46', { lw: 1.6, sh: '#1c4630', hi: '#4a9a6a', so: 1.2 });
      paper(v, 14.2, 27, -0.25, 5.6, 7); paper(v, 24.4, 30.4, 0.2, 5.4, 6.6); paper(v, 18.6, 32, -0.1, 4.4, 5.4);
      v.part(Pblob(20.5, 17.6 + by, 6.6, 2.7, 21), cr, { lw: 1, sh: '#d8c8b0', so: 0.4 });
      // orejas
      v.part(Ppoly([[14.4, 9.5 + by], [13.4, 0.8 + by], [20, 6.4 + by]]), o, { lw: 1.4, sh: oS, hi: oH, so: 0.6 }); v.part(Ppoly([[14.6, 7.4 + by], [14, 2.8 + by], [17.4, 6 + by]]), '#3a2418', { lw: 0, sh: null });
      v.part(Ppoly([[21.6, 6.6 + by], [27.4, 0.4 + by], [27.6, 9.6 + by]]), o, { lw: 1.4, sh: oS, hi: oH, so: 0.6 }); v.part(Ppoly([[23.2, 5.2 + by], [27, 1.8 + by], [27, 6.8 + by]]), '#3a2418', { lw: 0, sh: null });
      v.part(Pblob(21, 13.6 + by, 7.6, 6.7, 22, 0.03), o, { lw: 1.6, sh: oS, hi: oH, so: 1 });
      v.part(Ppoly([[23.6, 12.4 + by], [32, 15.4 + by], [23.6, 18.8 + by]]), o, { lw: 1.4, sh: oS, so: 0.6 });
      v.part(Pblob(25.6, 17.2 + by, 4.7, 2.5, 23), cr, { lw: 0, sh: '#d8c8b0', so: 0.3 });
      v.part(Pcirc(31.6, 15.4 + by, 1.3), '#2a1a14', { lw: 0.4 });
      v.part(Pblob(18.4, 15.8 + by, 3.2, 2.2, 24), cr, { lw: 0, sh: null });
      eyesF(v, p, [23.4], 12.8 + by, 1.45, { lx: 0.8, pr: 0.55, sh: false, lw: 0.45, pc: '#2a1a14' });
      eyesF(v, p, [19], 12.8 + by, 1.25, { lx: 0.8, pr: 0.55, sh: false, lw: 0.45 });
      if (p.eyes !== 'closed' && p.eyes !== 'happy') v.line(21.6, 11 + by, 25.4, 11.6 + by, 0.8, '#7a3a14');
      mouthF(v, p, 28, 18.4 + by, 2.4);
      // brazo + pergamino + pluma
      var px = 29, py = 25;
      v.stick([[25, 20 + by], [px - 1, py - 1.5]], 4, '#2e6a46', { lw: 1.3, hi: '#4a9a6a' });
      var sc = a >= 0 ? [[28.6, 25.4], [30.4, 27.4], [28.6, 29], [30.6, 24.8]][a] : null;
      v.part(Prr(px - 1, py - 4.4, 8, 10, 0.8), '#f6ecd0', { lw: 1, sh: '#d0c090', so: 0.5 });
      v.line(px + 0.8, py - 2, px + 5.2, py - 2, 0.5, '#8a7a5a'); v.line(px + 0.8, py, px + 4, py, 0.5, '#8a7a5a'); v.line(px + 0.8, py + 2, px + 5.2, py + 2, 0.5, '#8a7a5a');
      v.dot(px + 1, py - 4, 0.8, '#d03a2a');
      v.part(Pcirc(px - 1, py + 0.6, 2.2), o, { lw: 1.1, sh: oS, so: 0.4 });
      var qx = sc ? sc[0] : 33.6, qy = sc ? sc[1] : 27.4;
      v.stick([[qx + 4.2, qy - 8], [qx, qy]], 0.9, '#f8f4ea', { lw: 0.8 });
      v.part(Ppoly([[qx + 4.2, qy - 8], [qx + 7, qy - 11.5], [qx + 6.4, qy - 5.4]]), '#f8f4ea', { lw: 0.8, sh: '#c8c0b0', so: 0.4 });
      if (sc) v.dot(qx, qy, 0.5, '#2a1a14');
    };
  }
  // ---- RUFO: mapache mercader (grueso, gris oscuro, sombrero granate, mochila enorme)
  function rufo(p) {
    return function (v) {
      var x = v.ctx, by = -0.7 * p.b, a = p.act == null ? -1 : p.act, fur = '#555060', furS = '#34303e', furH = '#827c92', gold = '#e8b84a', goldS = '#a8741a';
      // cola anillada detras
      v.part(Pclosed([[10, 36], [4, 38.4], [0.6, 33], [3, 27.6], [8, 30]]), fur, { lw: 1.5, sh: furS, hi: furH, so: 0.7 });
      v.part(Pclosed([[1.8, 31], [3.2, 27.8], [6, 28.4], [4.4, 31.6]]), '#1e1a26', { lw: 0, sh: null }); v.part(Pclosed([[2.4, 36.2], [0.8, 33.4], [4.2, 33.4], [6.2, 35.6]]), '#1e1a26', { lw: 0, sh: null });
      // mochila enorme
      v.part(Prr(1.4, 3.8, 5, 4, 1.5), '#6a3a7a', { lw: 0 });
      v.part(Prr(0.8, 5, 17.4, 5, 2.4), '#7a4a8a', { lw: 1.5, sh: '#4e2a5e', hi: '#a878b8', so: 0.8 });         // rollo de manta
      v.part(Prr(2, 9, 16, 26, 3.4), '#c8902a', { lw: 1.7, sh: '#8a5e14', hi: '#e8b84a', so: 1.2 });
      v.part(Prr(4.4, 19, 11, 11, 2), '#a8741a', { lw: 1.1, sh: '#6e4a0e', so: 0.6 }); v.dot(10, 24.4, 1, gold);
      v.line(2.6, 15, 17.6, 15, 1.2, '#6e4a0e');
      v.part(Pblob(4.4, 33.4, 2.8, 2.6, 33), '#8a8aa0', { lw: 1.1, sh: '#5a5a70', hi: '#c0c0d8', so: 0.5 });      // olla colgada
      v.part(Pcirc(15.4, 6.6 - p.b * 0.2, 2.4), '#d8883a', { lw: 1, sh: '#8a4a14', hi: '#ffc070', so: 0.5 });
      v.part(Pblob(12, 1.8, 2.5, 2.1, 34), '#3a8a58', { lw: 1, sh: '#1c5a34', hi: '#78c898', so: 0.4 });
      // piernas
      v.part(Prr(13, 36, 7, 4.6, 2), furS, { lw: 1.4, sh: '#1e1a26', so: 0.3 }); v.part(Prr(23, 36, 7, 4.6, 2), furS, { lw: 1.4, sh: '#1e1a26', so: 0.3 });
      // cuerpo redondo + chaleco
      v.part(Pblob(22, 28 + by * 0.3, 13.2, 10.8 + p.b * 0.3, 41, 0.03, 10), fur, { lw: 1.8, sh: furS, hi: furH, so: 1.3 });
      v.part(Pblob(23.4, 29.4, 9.4, 8.2, 42), gold, { lw: 1.3, sh: goldS, hi: '#ffe08a', so: 0.9 });
      v.line(23.4, 23, 23.4, 36, 0.6, goldS); v.dot(25.6, 27.4, 0.8, '#7a3a2a'); v.dot(25.8, 31.4, 0.8, '#7a3a2a'); v.dot(25.8, 35, 0.7, '#7a3a2a');
      // cabeza
      v.part(Pcirc(15.8, 11.4 + by, 3), fur, { lw: 1.3, sh: furS, so: 0.5 }); v.part(Pcirc(30.6, 11.4 + by, 3), fur, { lw: 1.3, sh: furS, so: 0.5 }); v.dot(15.8, 11.8 + by, 1.2, '#e8dcc8'); v.dot(30.6, 11.8 + by, 1.2, '#e8dcc8');
      v.part(Pblob(23.2, 16.6 + by, 9.7, 7.6, 43), '#6e6a7c', { lw: 1.7, sh: furS, hi: '#9a95aa', so: 1 });
      v.part(Pblob(23.6, 16.4 + by, 8.6, 3.2, 44, 0.03), '#1a1620', { lw: 0, sh: null });                                // antifaz
      v.part(Pblob(27.6, 19.6 + by, 4.9, 3.5, 45), '#ece4d2', { lw: 1, sh: '#c8bda4', so: 0.5 });
      v.part(Pblob(31, 18.4 + by, 1.9, 1.4, 46), '#14101a', { lw: 0.3 }); v.dot(30.4, 17.9 + by, 0.4, '#fff');
      eyesF(v, p, [20, 26.4], 16.2 + by, 1.45, { white: '#fffdf2', lx: 0.8, sh: false, lw: 0.4, pr: 0.55 });
      mouthF(v, p, 28.4, 21.6 + by, 3);
      // sombrero de mercader
      v.part(Pblob(23, 10.2 + by, 12.4, 2.7, 51), '#8a2a3a', { lw: 1.5, sh: '#5a1424', hi: '#c0505e', so: 0.7 });
      v.part(Prr(16.4, 0.8 + by, 13.2, 10, 3), '#9a3040', { lw: 1.5, sh: '#6a1c2c', hi: '#d0606e', so: 1 });
      v.part(Prr(16.4, 6.6 + by, 13.2, 2.6, 0.8), gold, { lw: 0.9, sh: goldS, so: 0.3 });
      v.part(Ppoly([[28.6, 7 + by], [35.4, 1.4 + by], [33.4, 8.6 + by]]), '#3a9a8a', { lw: 0.9, sh: '#1c6a5c', hi: '#78d8c8', so: 0.4 });
      // brazo + bolsa / monedas
      var hx = 31.6, hy = 28.6;
      v.stick([[28, 24 + by], [hx - 0.4, hy - 0.6]], 5, fur, { lw: 1.4, hi: furH });
      if (a < 0) {
        v.part(Pblob(hx + 1, hy + 4.4, 3.8, 3.8, 61), '#a8742a', { lw: 1.2, sh: '#6e4a0e', hi: '#d8a458', so: 0.6 }); v.part(Ppoly([[hx - 1, hy + 1.4], [hx + 3.2, hy + 1.4], [hx + 1.2, hy + 3.2]]), '#8a5a1a', { lw: 0.8, sh: null }); v.dot(hx + 1, hy + 5, 1, gold);
      } else {
        var cy = [[hy - 2.6, 1], [hy - 6, 2], [hy - 8.8, 3], [hy - 5, 2]][a];
        for (var i = 0; i < cy[1]; i++) v.part(Prr(hx - 2.6, hy - 3 - i * 1.7, 5.2, 1.7, 0.7), gold, { lw: 0.7, sh: goldS, hi: '#fff0a8', so: 0.3 });
        v.part(Pblob(hx + 0.4, cy[0], a === 1 || a === 3 ? 2.6 : 1.1, 2.6, 62), '#ffd23a', { lw: 0.8, sh: goldS, hi: '#fff6c0', so: 0.3 });
        if (a === 2) { v.dot(hx + 4.2, hy - 9.4, 0.6, '#fff6c0'); v.dot(hx - 3.6, hy - 8.4, 0.5, '#fff6c0'); }
      }
      v.part(Pcirc(hx, hy, 2.8), furS, { lw: 1.2, sh: '#1e1a26', so: 0.4 });
    };
  }
  // ---- ULALUME: buho archivista
  function ulalume(p) {
    return function (v) {
      var x = v.ctx, by = -0.6 * p.b, a = p.act == null ? -1 : p.act, pu = '#7a5ab8', puS = '#4e3688', puH = '#a888e0', cr = '#f4e8c8';
      v.part(Pclosed([[20, 14 + by], [29.6, 20], [32.4, 33], [28, 39.4], [12, 39.4], [7.6, 33], [10.4, 20]]), pu, { lw: 1.8, sh: puS, hi: puH, so: 1.3 });
      v.part(Pblob(20, 29, 7.2, 8, 71), '#b8a0e0', { lw: 0, sh: '#9a80c8', so: 0.6 });
      for (var r = 0; r < 3; r++) for (var c = 0; c < 3; c++) { var fx = 14.4 + c * 5.6 + (r % 2) * 2.8 - 2.8 * (r % 2 ? 1 : 0), fy = 24.6 + r * 4.4; v.line(fx - 1.6, fy, fx, fy + 1.3, 0.7, '#6a50a0'); v.line(fx, fy + 1.3, fx + 1.6, fy, 0.7, '#6a50a0'); }
      v.part(Pblob(8, 29, 3.4, 8.4, 72, 0.04, 8, 0.1), puS, { lw: 1.4, sh: '#34205e', so: 0.6 }); v.part(Pblob(32, 29, 3.4, 8.4, 73, 0.04, 8, -0.1), puS, { lw: 1.4, sh: '#34205e', so: 0.6 });
      v.part(Ppoly([[15, 39], [14, 41.4], [16.4, 41], [18, 41.4], [18, 39]]), '#f0a020', { lw: 1, sh: '#b06a10', so: 0.3 }); v.part(Ppoly([[22, 39], [22, 41.4], [24, 41], [26, 41.4], [25, 39]]), '#f0a020', { lw: 1, sh: '#b06a10', so: 0.3 });
      // cabeza
      v.part(Ppoly([[11.8, 13 + by], [8.6, 5 + by], [16, 10 + by]]), pu, { lw: 1.4, sh: puS, so: 0.5 }); v.part(Ppoly([[28.2, 13 + by], [31.4, 5 + by], [24, 10 + by]]), pu, { lw: 1.4, sh: puS, so: 0.5 });
      v.part(Pblob(20, 17 + by, 9.6, 8, 74, 0.03), pu, { lw: 1.7, sh: puS, hi: puH, so: 1 });
      v.part(Pcirc(15.4, 17 + by, 5.2), cr, { lw: 1.2, sh: '#d4c498', so: 0.5 }); v.part(Pcirc(24.6, 17 + by, 5.2), cr, { lw: 1.2, sh: '#d4c498', so: 0.5 });
      if (p.eyes === 'happy' || p.eyes === 'closed') { eyesF(v, p, [15.4, 24.6], 17 + by, 3, {}); }
      else { [15.6, 24.4].forEach(function (ex) { v.part(Pcirc(ex, 17 + by, 3.6), '#ffd23a', { lw: 0.8, sh: '#e0a010', so: 0.5 }); v.dot(ex + 0.6, 17.2 + by, 1.8, OLC); v.dot(ex - 0.4, 16.2 + by, 0.7, '#fff'); }); }
      v.part(Ppoly([[18.2, 19.6 + by], [21.8, 19.6 + by], [20, 24.4 + by + (p.mouth ? 1.2 : 0)]]), '#f0a020', { lw: 1.1, sh: '#b06a10', so: 0.4 });
      // sombrero de cartomante
      v.part(Ppoly([[12.6, 10.6 + by], [27.4, 10.6 + by], [24.4, 3 + by], [21.6, 0.8 + by], [17.4, 2 + by]]), '#2e2468', { lw: 1.6, sh: '#1c1444', hi: '#5a4ca8', so: 1 });
      v.part(Pblob(20, 10.6 + by, 11.4, 2.3, 75), '#2e2468', { lw: 1.6, sh: '#1c1444', hi: '#5a4ca8', so: 0.6 });
      v.part(Prr(13.8, 7.2 + by, 12.4, 2.4, 0.8), '#e8b84a', { lw: 0.8, sh: '#a8741a', so: 0.3 });
      star(v, 20, 4.8 + by, 1.6, '#ffe08a', 0.4);
      // cartas flotantes
      function card(cx, cy, rot, face, sq) {
        x.save(); x.translate(cx, cy); x.rotate(rot); x.scale(sq == null ? 1 : sq, 1);
        v.part(Prr(-2.7, -3.7, 5.4, 7.4, 0.8), face ? '#f4ecd8' : '#1fa8a0', { lw: 0.9, sh: face ? '#cdbf9c' : '#126a70', so: 0.4 });
        if (face) { v.dot(0, -0.4, 1.3, '#e8433a'); v.dot(-1.4, -2.4, 0.5, '#e8433a'); } else v.part(Ppoly([[0, -1.6], [1.2, 0], [0, 1.6], [-1.2, 0]]), '#f3a31f', { lw: 0, sh: null });
        x.restore();
      }
      var bob = p.b * 1.2;
      if (a < 0) { card(4.4, 12 - bob, -0.3); card(36, 15 + bob, 0.28); card(35.6, 31 - bob, -0.12); }
      else {
        var ph = a * PI / 2;
        card(4.4 + Math.cos(ph) * 1.8, 12 + Math.sin(ph) * 2.4, -0.3 + a * 0.35);
        card(36 - Math.sin(ph) * 1.8, 15 + Math.cos(ph) * 2.4, 0.28 - a * 0.3);
        card(35.6, 31, -0.12, a % 2 === 1, a === 1 ? 0.35 : a === 3 ? 0.35 : 1);
        card(31.6, 6 + Math.sin(ph) * 2, 0.4, a === 2);
        v.dot(36, 24 + a, 0.55, '#fff6c0'); v.dot(3, 20 - a, 0.5, '#a8f0e0');
      }
    };
  }
  // ---- ABUELO LANUDO: carnero viejo sentado en un tronco con baston
  function lanudo(p) {
    return function (v) {
      var x = v.ctx, by = -0.5 * p.b, a = p.act == null ? -1 : p.act, wool = '#f0e6cc', woolS = '#c8b890', woolH = '#fffaf0', face = '#a8a8b2', faceS = '#7a7a8a';
      // tronco asiento
      v.part(Prr(2, 33.4, 31, 7, 3), '#8a5a34', { lw: 1.6, sh: '#5a3820', hi: '#b88050', so: 0.8 });
      v.part(Pblob(32.8, 36.8, 2.6, 3.4, 81), '#d8b078', { lw: 1.3, sh: '#a87a44', so: 0.4 }); v.line(32, 36.8, 33.8, 36.8, 0.4, '#8a5a34');
      // baston
      var sy = a === 1 || a === 3 ? -2 : 0;
      v.stick([[34.6, 40.4], [35.4, 17 + sy], [36.8, 11 + sy], [34.4, 8.6 + sy]], 2.2, '#9a6a3a', { lw: 1.2, hi: '#c08a52', curve: true });
      // piernas hacia delante
      v.part(Prr(21, 32.6, 12.4, 5.4, 2.2), face, { lw: 1.4, sh: faceS, so: 0.5 }); v.part(Pblob(33, 35.2, 2.6, 2.2, 82), '#4a4650', { lw: 1.2, sh: '#2e2a34', so: 0.3 });
      // cuerpo de lana
      v.cluster([Pcirc(14.4, 28 + by, 7.4), Pcirc(21.6, 26.4 + by, 7.2), Pcirc(11, 33, 5.4), Pcirc(19, 32.6, 6), Pcirc(24.8, 30, 5.4)], wool, { lw: 1.7, sh: woolS, hi: woolH, so: 1.2 });
      v.part(Ppoly([[13, 22.6 + by], [26, 22.6 + by], [28.4, 33], [10, 33]]), '#a8523a', { lw: 1.4, sh: '#7a3424', hi: '#d07a5a', so: 0.8 });   // manta/chal
      v.line(14, 25 + by, 25, 25 + by, 0.7, '#7a3424'); v.line(12.4, 28.6 + by, 26.6, 28.6 + by, 0.7, '#7a3424');
      // cuernos
      v.stick([[17.4, 11.6 + by], [10.6, 8.6 + by], [6.6, 13.4 + by], [9.6, 18.4 + by], [13.4, 16.4 + by]], 3.6, '#d8c08a', { lw: 1.4, hi: '#f4e4b0', curve: true });
      v.line(7.6, 11 + by, 8.8, 13 + by, 0.5, '#9a8450'); v.line(7.4, 14.6 + by, 9, 15.2 + by, 0.5, '#9a8450');
      // cabeza
      v.part(Pblob(24, 17.4 + by, 6.8, 6.8, 83, 0.03), face, { lw: 1.6, sh: faceS, hi: '#c8c8d0', so: 0.9 });
      v.part(Pblob(27.6, 21 + by, 4.2, 3.3, 84), '#c8c8d2', { lw: 1, sh: '#9a9aaa', so: 0.4 });
      v.part(Pblob(31.2, 19.8 + by, 1.7, 1.3, 85), '#3a3446', { lw: 0.4 });
      v.cluster([Pcirc(21, 11.4 + by, 3.2), Pcirc(25, 10.4 + by, 3.2), Pcirc(28.4, 12.4 + by, 2.6)], wool, { lw: 1.4, sh: woolS, hi: woolH, so: 0.7 });
      v.cluster([Pcirc(24, 25.6 + by, 2.6), Pcirc(27.4, 26.8 + by, 2.4), Pcirc(21, 25 + by, 2.2)], wool, { lw: 1.2, sh: woolS, so: 0.5 }); // barba
      v.part(Pblob(18.6, 15 + by, 2.4, 3.6, 86, 0.05, 8, 0.5), face, { lw: 1.1, sh: faceS, so: 0.4 }); // oreja
      // cejas de lana + gafas
      v.part(Pblob(26.2, 14.4 + by, 2.4, 1.1, 87), woolH, { lw: 0.7, sh: woolS, so: 0.2 }); v.part(Pblob(23, 14.8 + by, 1.8, 0.9, 88), woolH, { lw: 0.6, sh: woolS, so: 0.2 });
      eyesF(v, p, [26.2], 16.6 + by, 1.25, { white: '#fffdf2', sh: false, lw: 0.4, lx: 0.9 });
      if (p.eyes !== 'closed' && p.eyes !== 'happy') { x.strokeStyle = '#c8962a'; x.lineWidth = 0.55; x.beginPath(); x.arc(26.2, 16.6 + by, 2.2, 0, TAU); x.stroke(); x.beginPath(); x.moveTo(24, 16.6 + by); x.lineTo(21.6, 16.2 + by); x.stroke(); }
      mouthF(v, p, 28.4, 22.2 + by, 2.4);
      // mano en el baston
      v.part(Pcirc(35, 20 + sy, 2.2), face, { lw: 1.2, sh: faceS, so: 0.4 });
      if (a >= 0) { var hs = [[6, 4.6], [3.8, 3], [7.6, 3.6], [5, 2]][a]; v.dot(34.4, 6.6 + sy - a * 0.4, 0.7, '#e8b84a'); v.dot(37.6, 6 + sy, 0.5, '#e8b84a'); }
    };
  }
  // ---- TIA CASTAÑA: erizo cocinera
  function castana(p) {
    return function (v) {
      var x = v.ctx, by = -0.6 * p.b, a = p.act == null ? -1 : p.act, q = '#b86a78', qS = '#7a3a4e', qH = '#e0949c', skin = '#f8dccc', skinS = '#d8b0a0', i;
      // pies
      v.part(Prr(13, 36.6, 7, 4, 2), '#7a3a4e', { lw: 1.3, sh: '#4e2434', so: 0.3 }); v.part(Prr(23, 36.6, 7, 4, 2), '#7a3a4e', { lw: 1.3, sh: '#4e2434', so: 0.3 });
      // pinchos (espalda, izquierda)
      for (i = 0; i < 12; i++) {
        var ang = PI * 0.62 + i * (PI * 0.95 / 11), cx0 = 18, cy0 = 24 + by * 0.5, r0 = 10, r1 = 15.6 + (i % 2) * 1.8 - (i > 9 ? 2 : 0), w = 0.17;
        v.part(Ppoly([[cx0 + Math.cos(ang - w) * r0, cy0 + Math.sin(ang - w) * r0], [cx0 + Math.cos(ang) * r1, cy0 + Math.sin(ang) * r1], [cx0 + Math.cos(ang + w) * r0, cy0 + Math.sin(ang + w) * r0]]), i % 2 ? q : '#9a5266', { lw: 1.2, sh: qS, so: 0.4 });
      }
      v.part(Pblob(19, 27 + by * 0.4, 12, 10.6 + p.b * 0.3, 91, 0.03, 10), q, { lw: 1.7, sh: qS, hi: qH, so: 1.2 });
      v.part(Pblob(24, 29, 8, 8.6, 92), skin, { lw: 1.1, sh: skinS, so: 0.7 });
      // delantal
      v.part(Ppoly([[16, 24 + by], [30, 24 + by], [32, 37], [14, 37]]), '#fff6e8', { lw: 1.4, sh: '#d8c8b0', hi: '#ffffff', so: 0.8 });
      for (i = 0; i < 6; i++) { var gx = 16 + (i % 3) * 5.2 + (i > 2 ? 0 : 0), gy = 26.6 + Math.floor(i / 3) * 5; if ((i + Math.floor(i / 3)) % 2 === 0) v.part(Prr(gx, gy, 4.4, 4.4, 0.4), '#e86a74', { lw: 0, sh: null }); }
      v.line(15.4, 30.6, 31, 30.6, 0.5, '#d8c8b0');
      // cabeza
      v.part(Pblob(23.6, 17.4 + by, 7.6, 6.6, 93, 0.03), skin, { lw: 1.6, sh: skinS, hi: '#fff0e4', so: 0.9 });
      v.part(Pblob(29.6, 19.4 + by, 4.2, 2.9, 94), '#f0c8b8', { lw: 1, sh: '#d8a898', so: 0.4 });
      v.part(Pcirc(33.2, 19 + by, 1.3), '#3a2030', { lw: 0.3 }); v.dot(32.8, 18.6 + by, 0.35, '#fff');
      v.part(Pblob(19.4, 13.8 + by, 2.6, 2.3, 95), q, { lw: 1.2, sh: qS, so: 0.4 }); // oreja
      v.part(Pblob(21.6, 20 + by, 2.2, 1.4, 96), '#f09aa0', { lw: 0, sh: null }); // rubor
      eyesF(v, p, [25.4, 29.4], 16.4 + by, 1.3, { lx: 0.7, sh: false, lw: 0.4, pr: 0.62 });
      mouthF(v, p, 30.4, 21.6 + by, 2.4);
      // gorro de chef
      v.cluster([Pcirc(19, 7.4 + by, 4.3), Pcirc(24.6, 5 + by, 4.9), Pcirc(30, 7.4 + by, 4.2)], '#fffaf0', { lw: 1.5, sh: '#ddd2bc', hi: '#ffffff', so: 0.9 });
      v.part(Prr(16.4, 8.8 + by, 16, 4.4, 1.6), '#fffaf0', { lw: 1.4, sh: '#ddd2bc', so: 0.6 });
      // brazo + cuchara
      var hx = 29.4, hy = 30, sa = 0.9;
      if (a >= 0) { var ph = a * PI / 2; hx = 29.4 + Math.cos(ph) * 1.8; hy = 29.6 + Math.sin(ph) * 1.2; sa = 0.9 + Math.sin(ph) * 0.35; }
      v.stick([[25, 25.6 + by], [hx - 1, hy - 1.2]], 4.4, skin, { lw: 1.3, hi: '#fff0e4' });
      v.stick([[hx - 1, hy - 3], [hx + Math.cos(sa) * 8.2, hy - 3 + Math.sin(sa) * 8.2]], 1.5, '#b88050', { lw: 1, hi: '#d8a870' });
      var ex = hx - 1 + Math.cos(sa) * 8.4, ey = hy - 3 + Math.sin(sa) * 8.4;
      v.part(Pblob(ex, ey, 2.3, 1.6, 97, 0.03, 8, sa), '#b88050', { lw: 1, sh: '#8a5a34', hi: '#d8a870', so: 0.4 });
      v.part(Pcirc(hx, hy, 2.4), skin, { lw: 1.2, sh: skinS, so: 0.4 });
    };
  }

  var NPC_DEF = {
    grum: { fn: grum, work: 6, hx: 20, hy: 14, bg: ['#8a3a2a', '#c8602c'], talkWork: true },
    vesper: { fn: vesper, work: 7, hx: 22, hy: 13, bg: ['#2e6a46', '#5a9a5a'] },
    rufo: { fn: rufo, work: 7, hx: 23, hy: 12, bg: ['#7a2a3a', '#c08a2a'] },
    ulalume: { fn: ulalume, work: 5, hx: 20, hy: 13, bg: ['#2e2468', '#7a5ab8'] },
    lanudo: { fn: lanudo, work: 4, hx: 23, hy: 16, bg: ['#7a4a30', '#c8a870'] },
    castana: { fn: castana, work: 7, hx: 25, hy: 14, bg: ['#8a4458', '#e0949c'] }
  };
  var NPC_NAMES = ['grum', 'vesper', 'rufo', 'ulalume', 'lanudo', 'castana'];
  NPC_NAMES.forEach(function (n) {
    var D = NPC_DEF[n], F = [{ b: 0 }, { b: 1 }, { b: 0, eyes: 'closed' }, { b: 0, act: 0 }, { b: 0, act: 1 }, { b: 0, act: 2 }, { b: 0, act: 3 }, { b: 0, mouth: 1 }, { b: 0, mouth: 2 }, { b: 0, eyes: 'happy' }];
    var idle = [0, 0, 0, 1, 1, 1, 0, 0, 0, 1, 1, 1, 0, 0, 0, 1, 1, 1, 2, 0];
    addV('npc_' + n, 40, 42, F.map(function (p) { return D.fn(p); }), { lw: 1.7 }, {
      idle: { f: idle, fps: 4 }, work: { f: [3, 4, 5, 6], fps: D.work }, talk: { f: [7, 8, 7, 8, 0, 8], fps: 8 }, happy: { f: [9], fps: 1 }
    });
    // retrato 48x48 -> 96x96: marco + fondo + cabeza ampliada
    var pf = [{ b: 0 }, { b: 0, eyes: 'happy' }, { b: 0, mouth: 2 }].map(function (p) {
      return function (v) {
        var x = v.ctx, g = x.createLinearGradient(0, 0, 0, 48);
        g.addColorStop(0, D.bg[1]); g.addColorStop(1, D.bg[0]);
        x.save(); x.beginPath(); Prr(1.5, 1.5, 45, 45, 6)(x); x.clip();
        x.fillStyle = g; x.fillRect(0, 0, 48, 48);
        x.fillStyle = 'rgba(255,255,255,0.12)'; x.beginPath(); x.arc(40, 6, 18, 0, TAU); x.fill();
        x.translate(24, 30); x.scale(1.75, 1.75); x.translate(-D.hx, -D.hy);
        var op = v.part, os = v.stick, oc = v.cluster;
        v.part = function (pa, c, o) { o = Object.assign({}, o || {}); o.lw = (o.lw == null ? v.lw : o.lw) * 0.62; return op.call(v, pa, c, o); };
        v.cluster = function (ps, c, o) { o = Object.assign({}, o || {}); o.lw = (o.lw == null ? v.lw : o.lw) * 0.62; return oc.call(v, ps, c, o); };
        v.stick = function (pts, w, c, o) { o = Object.assign({}, o || {}); o.lw = (o.lw == null ? v.lw : o.lw) * 0.62; return os.call(v, pts, w, c, o); };
        D.fn(p)(v);
        v.part = op; v.stick = os; v.cluster = oc;
        x.restore();
        v.outline(Prr(1.5, 1.5, 45, 45, 6), 2.4, OLC);
        x.strokeStyle = 'rgba(255,230,170,0.7)'; x.lineWidth = 0.8; x.beginPath(); Prr(3.6, 3.6, 40.8, 40.8, 4.5)(x); x.stroke();
      };
    });
    addV('portrait_' + n, 48, 48, pf, { lw: 1.7 }, { neutral: { f: [0], fps: 1 }, happy: { f: [1], fps: 1 }, talk: { f: [0, 2, 0, 2], fps: 7 } });
  });
})();
