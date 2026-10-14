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
      eyesF(v, p, [19.4, 25.6], 14.6 + by, 1.3, { white: '#fff', sh: false, lw: 0.4, pr: 0.7 });
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
      eyesF(v, p, [23.4], 12.8 + by, 1.7, { lx: 0.8, pr: 0.55, sh: false, lw: 0.45, pc: '#2a1a14' });
      eyesF(v, p, [19], 12.8 + by, 1.45, { lx: 0.8, pr: 0.55, sh: false, lw: 0.45 });
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
      v.part(Pclosed([[12, 24 + by], [20, 22 + by], [27, 27 + by], [26, 34], [14, 35], [9, 30]]), '#a8523a', { lw: 1.4, sh: '#7a3424', hi: '#d07a5a', so: 0.8 });   // manta/chal
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
      eyesF(v, p, [25.2, 29.4], 16.4 + by, 1.6, { lx: 0.7, sh: false, lw: 0.4, pr: 0.62 });
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
        x.translate(24, 28); x.scale(1.6, 1.6); x.translate(-D.hx, -D.hy);
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

  // =================================================================== PROPS Y EDIFICIOS (coordenadas base; final = x2)
  var S = { stone: '#a08a80', stoneS: '#74605e', stoneH: '#c8b0a0', wood: '#9a6a3a', woodS: '#6e4624', woodH: '#c08a52', roof: '#8a3e36', roofS: '#5a2428', roofH: '#b8604a', iron: '#3a3040', ironS: '#221c2a', amber: '#ffc850' };
  function ln(v, a, b, c, d, w, col) { v.line(a, b, c, d, w || 0.6, col || 'rgba(27,17,36,0.45)'); }

  addV('vil_forge', 96, 76, [function (v) {
    var x = v.ctx, i;
    v.part(Prr(64, 1, 14, 30, 1.5), S.stone, { lw: 1.7, sh: S.stoneS, hi: S.stoneH, so: 1.2 }); v.part(Prr(62, 0.6, 18, 4.6, 1.2), S.stoneS, { lw: 1.4, sh: '#4a3a3e', so: 0.4 });
    v.part(Prr(8, 28, 80, 46, 2), S.stone, { lw: 1.9, sh: S.stoneS, hi: S.stoneH, so: 2 });
    var r = rrand(7);
    for (i = 0; i < 6; i++) { var yy = 33 + i * 7.4; ln(v, 9, yy, 87, yy); for (var j = 0; j < 8; j++) { var xx = 10 + j * 10 + (i % 2) * 5 + r() * 2; ln(v, xx, yy, xx, yy + 7.4); } }
    v.part(Ppoly([[0, 33], [20, 10], [76, 10], [96, 33], [90, 36], [6, 36]]), S.roof, { lw: 1.9, sh: S.roofS, hi: S.roofH, so: 2 });
    for (i = 0; i < 4; i++) { var ry = 15.6 + i * 5, k = (ry - 10) / 23; ln(v, lerp(20, 0, k) + 2, ry, lerp(76, 96, k) - 2, ry, 0.7, 'rgba(27,17,36,0.4)'); for (var m = 0; m < 9; m++) { var tx = lerp(22, 2, k) + m * ((lerp(74, 94, k) - lerp(22, 2, k)) / 8) + (i % 2) * 4; ln(v, tx, ry, tx, ry + 5, 0.6, 'rgba(27,17,36,0.35)'); } }
    v.part(Prr(6, 33.6, 84, 3, 1), '#5a2428', { lw: 1.2, sh: null });
    // boca de la fragua
    x.save(); x.beginPath(); Prr(15, 42, 36, 32, 13)(x); x.clip();
    var g = x.createRadialGradient(33, 66, 2, 33, 60, 28); g.addColorStop(0, '#ffcf6a'); g.addColorStop(0.35, '#ff7a2a'); g.addColorStop(1, '#2a1418'); x.fillStyle = g; x.fillRect(10, 38, 46, 40); x.restore();
    v.outline(Prr(15, 42, 36, 32, 13), 2, OLC);
    v.part(Prr(18, 58, 30, 16, 2), '#6a5658', { lw: 1.5, sh: '#3e3036', hi: '#8a7478', so: 0.8 }); v.part(Prr(21, 60, 24, 4.4, 1.6), '#ff6a1e', { lw: 1, sh: '#c8381a', hi: '#ffc060', so: 0.4 });
    v.dot(27, 61.6, 1.1, '#fff0a0'); v.dot(37, 61.4, 1.3, '#ffd23a');
    v.part(Ppoly([[44, 48], [47, 44], [49, 52], [46, 60]]), '#4a3a44', { lw: 0.8, sh: null }); // fuelle
    // puerta + herramientas + ventana
    v.part(Prr(60, 46, 18, 28, 8), S.wood, { lw: 1.7, sh: S.woodS, hi: S.woodH, so: 1 }); ln(v, 69, 48, 69, 74, 0.7); v.line(60.6, 56, 77.4, 56, 1.1, S.iron); v.line(60.6, 66, 77.4, 66, 1.1, S.iron); v.dot(73.6, 62, 1, '#e8b84a');
    v.part(Prr(80, 41, 5, 7, 1), '#ffb040', { lw: 1.1, sh: '#e8781c', so: 0.4 });
    v.stick([[54, 38], [54, 46]], 1.3, S.woodS, { lw: 0.8 }); v.part(Prr(51.6, 35.6, 5, 3, 0.6), '#7a8498', { lw: 0.9, sh: '#4a5468', so: 0.3 });
    // placa con yunque
    v.part(Prr(28, 36.6, 14, 4.6, 1), '#3a2a2a', { lw: 0.9, sh: null }); v.part(Ppoly([[30, 40], [31, 38], [38, 38], [40, 39], [37, 40.4]]), '#c0c8d8', { lw: 0.3, sh: null });
    v.part(Prr(4, 72, 88, 4, 1.2), '#5a4a48', { lw: 1.4, sh: '#3a2e30', so: 0.4 });
  }], { lw: 1.7 });

  addV('vil_anvil', 22, 14, [function (v) {
    v.part(Prr(4, 11, 14, 3, 1), '#3a3a4a', { lw: 1.3, sh: '#22222e', so: 0.3 });
    v.part(Ppoly([[7, 7], [15, 7], [14, 11.4], [8, 11.4]]), '#4a4e60', { lw: 1.4, sh: '#2a2c3a', so: 0.5 });
    v.part(Ppoly([[1, 1.4], [4, 0.6], [17, 0.6], [21, 3], [16, 5.4], [14, 7], [7.4, 7], [6.4, 5], [2, 4]]), '#7a8498', { lw: 1.5, sh: '#4a5468', hi: '#c0cae0', so: 0.8 });
  }], { lw: 1.5 });

  addV('vil_board', 64, 68, [0, 1, 2].map(function (k) {
    return function (v) {
      var i, x = v.ctx;
      v.part(Prr(8, 20, 6, 48, 1.2), S.wood, { lw: 1.6, sh: S.woodS, hi: S.woodH, so: 0.8 }); v.part(Prr(50, 20, 6, 48, 1.2), S.wood, { lw: 1.6, sh: S.woodS, hi: S.woodH, so: 0.8 });
      v.part(Prr(4, 15, 56, 38, 2), '#a8743e', { lw: 1.8, sh: S.woodS, hi: S.woodH, so: 1.3 });
      for (i = 0; i < 3; i++) ln(v, 5, 24 + i * 9.4, 59, 24 + i * 9.4, 0.5, 'rgba(60,30,12,0.4)');
      var P = [[12, 26, -0.1, 11, 14, 0], [26, 24, 0.07, 10, 13, 1], [41, 28, 0.12, 12, 15, 2], [17, 42, 0.05, 10, 11, 0], [32, 42, -0.1, 11, 12, 1], [47, 44, 0.06, 9, 10, 2]];
      P.forEach(function (q, j) {
        x.save(); x.translate(q[0], q[1]); x.rotate(q[2] + Math.sin(k * 2.1 + j * 1.7) * 0.05);
        v.part(Ppoly([[-q[3] / 2, -q[4] / 2], [q[3] / 2, -q[4] / 2 + Math.sin(k + j) * 0.5], [q[3] / 2, q[4] / 2], [-q[3] / 2, q[4] / 2 + (k === 1 ? 0.6 : 0)]]), j === 2 ? '#fff0b8' : '#f6ecd0', { lw: 0.9, sh: '#d0c090', so: 0.5 });
        ln(v, -q[3] * 0.32, -q[4] * 0.2, q[3] * 0.32, -q[4] * 0.2, 0.45, '#8a7a5a'); ln(v, -q[3] * 0.32, 0, q[3] * 0.2, 0, 0.45, '#8a7a5a');
        if (j === 2) { v.dot(0, q[4] * 0.2, 1.6, '#d03a2a'); } else if (j === 4) v.part(Ppoly([[-2, 1], [0, -2], [2, 1]]), '#c8602c', { lw: 0.3, sh: null });
        v.dot(0, -q[4] / 2 + 1, 0.8, '#d03a2a'); x.restore();
      });
      v.part(Ppoly([[0, 17], [32, 1.6], [64, 17], [60, 20], [4, 20]]), S.roof, { lw: 1.7, sh: S.roofS, hi: S.roofH, so: 1.2 });
      for (i = 0; i < 8; i++) ln(v, 6 + i * 7.4, 16, 8 + i * 7.4, 19.4, 0.6, 'rgba(27,17,36,0.4)');
    };
  }), { lw: 1.7 }, { wave: { f: [0, 1, 2, 1], fps: 3 } });

  addV('vil_archive', 72, 96, [function (v) {
    var x = v.ctx, i, pu = '#8a78a8', puS = '#5a4a80', puH = '#b4a4d0';
    v.part(Prr(0, 62, 22, 32, 2), pu, { lw: 1.7, sh: puS, hi: puH, so: 1.2 });
    v.part(Ppoly([[-1, 64], [11, 52], [23, 64]]), '#4a3a7a', { lw: 1.7, sh: '#2e2250', hi: '#7a68b0', so: 1 });
    v.part(Prr(10, 24, 52, 70, 2.4), pu, { lw: 1.9, sh: puS, hi: puH, so: 2 });
    var r = rrand(11);
    for (i = 0; i < 9; i++) { var yy = 30 + i * 7.4; ln(v, 11, yy, 61, yy); for (var j = 0; j < 4; j++) { var xx = 14 + j * 13 + (i % 2) * 6 + r() * 2; ln(v, xx, yy, xx, yy + 7.4); } }
    v.part(Prr(8, 20, 56, 6, 1.4), '#6a5a90', { lw: 1.6, sh: '#463868', hi: '#9888c0', so: 0.6 });
    for (i = 0; i < 5; i++) v.part(Prr(9 + i * 11.4, 13, 7.6, 8, 1), pu, { lw: 1.4, sh: puS, hi: puH, so: 0.6 });
    v.part(Ppoly([[18, 14], [36, -0.6 + 2], [54, 14]]), '#4a3a7a', { lw: 0, sh: null }); // base tejado
    v.part(Ppoly([[14, 14], [36, -2 + 6], [58, 14]]), '#4a3a7a', { lw: 1.7, sh: '#2e2250', hi: '#7a68b0', so: 1 });
    star(v, 36, 9.6, 2, '#ffe08a', 0.2);
    v.stick([[36, 6], [36, -2]], 1.2, '#3a3040', { lw: 0.7 });
    // ventana circular
    v.part(Pcirc(36, 46, 11), '#6a5a90', { lw: 1.8, sh: '#463868', hi: '#9888c0', so: 0.8 });
    x.save(); x.beginPath(); x.arc(36, 46, 8.6, 0, TAU); x.clip(); var g = x.createRadialGradient(36, 46, 1, 36, 46, 9); g.addColorStop(0, '#fff2b0'); g.addColorStop(0.6, '#ffc850'); g.addColorStop(1, '#e8901c'); x.fillStyle = g; x.fillRect(26, 36, 20, 20); x.restore();
    v.line(36, 37.4, 36, 54.6, 0.9, '#3a2a50'); v.line(27.4, 46, 44.6, 46, 0.9, '#3a2a50');
    star(v, 28, 38.4, 1.5, '#ffe08a', 0); star(v, 45.6, 52, 1.2, '#ffe08a', 0.3); star(v, 49, 36, 1.3, '#fff6c0', 0.2);
    v.dot(36, 43, 0.9, '#7a3a14'); // silueta de buho en la ventana (ojos)
    v.part(Pclosed([[56, 30], [60, 32], [56, 36]]), '#f3e8c8', { lw: 0.9, sh: null });
    // puerta
    v.part(Prr(28, 70, 16, 24, 8), S.wood, { lw: 1.7, sh: S.woodS, hi: S.woodH, so: 1 }); ln(v, 36, 72, 36, 94, 0.7); v.dot(40, 83, 0.9, '#e8b84a');
    v.part(Prr(24, 66, 24, 5, 2), '#6a5a90', { lw: 1.3, sh: null });
    // cartel con libro
    v.part(Prr(48, 74, 11, 9, 1), '#f4e6c0', { lw: 1.1, sh: '#d0c090', so: 0.4 }); v.line(53.5, 75, 53.5, 82, 0.5, '#8a5a34'); v.line(50, 77, 52.6, 77, 0.4, '#8a5a34'); v.line(55, 77, 57.6, 77, 0.4, '#8a5a34');
    v.part(Prr(3, 78, 16, 3, 0.8), '#e8b84a', { lw: 0, sh: null });
    v.part(Prr(4, 70, 6, 8, 1), '#b8504a', { lw: 0.9, sh: '#7a2a2a', so: 0.3 }); v.part(Prr(10, 71, 5, 7, 1), '#3a8a8a', { lw: 0.9, sh: '#1c5a5a', so: 0.3 });
    v.part(Prr(0, 90, 72, 6, 1.4), '#5a4a70', { lw: 1.4, sh: '#3a2e50', so: 0.4 });
  }], { lw: 1.7 });

  function archPath(c) {
    c.moveTo(2, 90); c.lineTo(2, 44); c.arc(42, 44, 40, PI, 0); c.lineTo(82, 90); c.lineTo(64, 90); c.lineTo(64, 44); c.arc(42, 44, 22, 0, PI, true); c.lineTo(20, 90); c.closePath();
  }
  addV('vil_portal', 84, 96, [0, 1, 2, 3, 4, 5].map(function (k) {
    return function (v) {
      var x = v.ctx, i, ph = k / 6;
      // interior
      x.save(); x.beginPath(); x.moveTo(20, 90); x.lineTo(20, 44); x.arc(42, 44, 22, PI, 0); x.lineTo(64, 90); x.closePath(); x.clip();
      var g = x.createRadialGradient(42, 56, 1, 42, 56, 36); g.addColorStop(0, '#e8fff8'); g.addColorStop(0.25, '#5ae0d0'); g.addColorStop(0.65, '#2a74b8'); g.addColorStop(1, '#2a1a6a');
      x.fillStyle = g; x.fillRect(16, 18, 52, 76);
      x.translate(42, 56); x.rotate(ph * TAU / 4);
      for (i = 0; i < 4; i++) { x.rotate(TAU / 4); x.strokeStyle = 'rgba(255,255,255,0.55)'; x.lineWidth = 1.5; x.beginPath(); for (var s = 0; s <= 20; s++) { var rr = 2 + s * 1.6, aa = s * 0.17; if (s === 0) x.moveTo(rr * Math.cos(aa), rr * Math.sin(aa)); else x.lineTo(rr * Math.cos(aa), rr * Math.sin(aa)); } x.stroke(); }
      x.restore();
      x.save(); x.beginPath(); x.moveTo(20, 90); x.lineTo(20, 44); x.arc(42, 44, 22, PI, 0); x.lineTo(64, 90); x.closePath(); x.clip();
      for (i = 0; i < 12; i++) { var a = ph * TAU / 12 + i * TAU / 12, ex = 42 + Math.cos(a) * 18, ey = 46 + Math.sin(a) * 20; x.fillStyle = i % 2 ? '#ffd23a' : '#ff8a2a'; x.beginPath(); x.arc(ex, ey, i % 3 === 0 ? 1.5 : 1, 0, TAU); x.fill(); }
      x.restore();
      // arco de piedra
      v.part(archPath, S.stone, { lw: 2, sh: S.stoneS, hi: S.stoneH, so: 1.6 });
      for (i = 1; i < 10; i++) { var aa = PI + i * PI / 10; ln(v, 42 + Math.cos(aa) * 22.6, 44 + Math.sin(aa) * 22.6, 42 + Math.cos(aa) * 39.4, 44 + Math.sin(aa) * 39.4, 0.7); }
      for (i = 0; i < 6; i++) { ln(v, 3, 52 + i * 6.4, 19.4, 52 + i * 6.4); ln(v, 64.6, 52 + i * 6.4, 81, 52 + i * 6.4); }
      v.part(Ppoly([[35, 6], [49, 6], [47, 20], [37, 20]]), '#c8b0a0', { lw: 1.5, sh: '#8a7468', hi: '#e8d4c4', so: 0.7 });
      x.save(); x.strokeStyle = '#ff8a2a'; x.lineWidth = 1; x.beginPath(); x.arc(42, 13, 3.4, 0, TAU); x.stroke(); x.fillStyle = '#ffd23a'; x.globalAlpha = 0.6 + 0.4 * Math.sin(ph * TAU); x.beginPath(); x.arc(42, 13, 1.5, 0, TAU); x.fill(); x.restore();
      // runas en pilares
      x.save(); x.strokeStyle = '#5af0d8'; x.lineWidth = 0.9; x.globalAlpha = 0.65 + 0.35 * Math.sin(ph * TAU + 1);
      [[11, 56], [11, 70], [73, 56], [73, 70]].forEach(function (p, j) { x.beginPath(); x.moveTo(p[0] - 2.4, p[1] - 2.4); x.lineTo(p[0] + 2.4, p[1] - 0.6); x.lineTo(p[0] - 1, p[1] + 0.8); x.lineTo(p[0] + 2, p[1] + 3); x.stroke(); });
      x.restore();
      // brasero en pilares
      [11, 73].forEach(function (cx) { v.part(Prr(cx - 6, 40, 12, 4, 1.2), '#6a5658', { lw: 1.3, sh: '#3e3036', so: 0.4 }); v.part(Pblob(cx, 38.6, 3.6, 2.2, cx), '#ff7a2a', { lw: 0.9, sh: '#c8381a', hi: '#ffd23a', so: 0.3 }); });
      v.part(Prr(0, 88, 84, 8, 2), '#8a7468', { lw: 1.6, sh: '#5a4a48', hi: '#b8a090', so: 0.8 });
    };
  }), { lw: 1.7 }, { swirl: { f: [0, 1, 2, 3, 4, 5], fps: 8 } });

  addV('vil_tent', 72, 64, [function (v) {
    var x = v.ctx, i, cr = '#f6e8d0', rd = '#d8584a';
    v.part(Prr(6, 36, 60, 27, 1.4), '#e8d8b8', { lw: 1.8, sh: '#c0aa84', hi: '#f6ecd4', so: 1.4 });
    for (i = 0; i < 6; i++) if (i % 2 === 0) { x.fillStyle = rd; x.fillRect(6 + i * 10, 36, 10, 27); }
    v.outline(Prr(6, 36, 60, 27, 1.4), 1.8, OLC);
    // abertura
    v.part(Ppoly([[26, 63], [27, 44], [36, 37.4], [45, 44], [46, 63]]), '#3a1e2a', { lw: 1.7, sh: null });
    v.part(Prr(29, 54, 14, 9, 1), '#7a4a34', { lw: 1, sh: null });
    // techo a rayas
    var A0 = [[36, 3], [72, 40], [0, 40]]; v.outline(Ppoly(A0), 1.9, OLC);
    x.save(); x.beginPath(); Ppoly(A0)(x); x.clip();
    for (i = 0; i < 8; i++) { var x0 = -8 + i * 12.8, x1 = x0 + 12.8; x.fillStyle = i % 2 ? rd : cr; x.beginPath(); x.moveTo(36, 3); x.lineTo(x0, 42); x.lineTo(x1, 42); x.closePath(); x.fill(); }
    x.fillStyle = 'rgba(80,30,60,0.22)'; x.beginPath(); x.moveTo(36, 3); x.lineTo(72, 40); x.lineTo(36, 40); x.closePath(); x.fill();
    x.restore();
    for (i = 0; i < 6; i++) { var cx = 6 + i * 12; v.part(Pblob(cx, 40.4, 6.4, 3.6, 31 + i), i % 2 ? rd : cr, { lw: 1.3, sh: i % 2 ? '#a83a30' : '#d8c8a8', so: 0.5 }); }
    v.stick([[36, 4], [36, -1]], 1.1, '#6e4624', { lw: 0.7 }); v.part(Ppoly([[36, -1], [43, 1.4], [36, 3.6]]), '#1fa8a0', { lw: 0.8, sh: '#126a70', so: 0.3 });
    // hierbas colgando y farolillo
    for (i = 0; i < 4; i++) { v.line(12 + i * 3.4, 43, 12 + i * 3.4, 49, 0.6, '#5a3a24'); v.part(Pblob(12 + i * 3.4, 51, 1.7, 2.2, 70 + i), i % 2 ? '#7a9a3a' : '#c8782a', { lw: 0.8, sh: null }); }
    v.part(Prr(52, 44, 5, 6, 1.4), S.amber, { lw: 1, sh: '#e8901c', so: 0.3 }); v.line(54.5, 40.6, 54.5, 44, 0.5, '#3a3040');
    v.part(Prr(2, 62, 68, 2.6, 1), '#6a5a48', { lw: 0, sh: null });
  }], { lw: 1.7 });

  addV('vil_pot', 26, 24, [0, 1, 2].map(function (k) {
    return function (v) {
      var x = v.ctx, i;
      v.part(Pblob(5, 21.4, 3.4, 2.4, 21), '#8a8a98', { lw: 1.3, sh: '#5a5a6a', hi: '#b8b8c8', so: 0.4 }); v.part(Pblob(21, 21.4, 3.4, 2.4, 22), '#8a8a98', { lw: 1.3, sh: '#5a5a6a', hi: '#b8b8c8', so: 0.4 });
      var T = [[[8, 3.6], [11, 2.6], [10, 1]], [[13, 4.4], [12, 1.8], [14, 2.4]], [[18, 3.6], [15, 2], [16, 0.6]]][k];
      [[10, 20, 3.6, 8], [13, 20.2, 4.2, 10.6], [16, 20, 3.6, 8]].forEach(function (f, j) {
        v.part(Pclosed([[f[0] - f[2] / 2, f[1]], [f[0] - f[2] * 0.45, f[1] - f[3] * 0.5], [f[0] + (k - 1) * 0.6, f[1] - f[3] - (j + k) % 2], [f[0] + f[2] * 0.45, f[1] - f[3] * 0.5], [f[0] + f[2] / 2, f[1]]]), '#ff5a1e', { lw: 0.9, ol: '#7a1424', sh: '#d02a1a', hi: '#ff8a2a', so: 0.3 });
      });
      v.part(Pblob(13, 11.8, 10.4, 7.6, 25, 0.03), '#4a4858', { lw: 1.6, sh: '#2c2a38', hi: '#7a7890', so: 0.9 });
      v.part(Pblob(13, 5.6, 8.8, 2.6, 26), '#c86a2a', { lw: 1.3, sh: '#8a3e14', hi: '#f0a050', so: 0.3 });
      v.part(Pblob(13, 6, 7, 1.6, 27), '#e89a4a', { lw: 0, sh: null }); v.dot(10, 5.8 + (k % 2) * 0.3, 0.8, '#7a9a3a'); v.dot(15.4, 6.2, 0.7, '#e8e0d0');
      v.part(Pcirc(3.4, 9.4, 1.5), '#4a4858', { lw: 1, sh: null }); v.part(Pcirc(22.6, 9.4, 1.5), '#4a4858', { lw: 1, sh: null });
    };
  }), { lw: 1.5 }, { fire: { f: [0, 1, 2, 1], fps: 8 } });

  addV('vil_cart', 68, 52, [function (v) {
    var x = v.ctx, i;
    // lanza del carro
    v.stick([[6, 40], [-?0:0, 0]].length ? [[8, 38], [0, 46]] : [], 2.4, '#8a5a34', { lw: 1.2, hi: '#b88050' });
    // postes y toldo
    v.part(Prr(8, 8, 3.4, 30, 1), S.woodS, { lw: 1.3, sh: null }); v.part(Prr(56, 8, 3.4, 30, 1), S.woodS, { lw: 1.3, sh: null });
    // mercancias
    v.part(Prr(10, 16, 13, 12, 1.6), '#b8742c', { lw: 1.5, sh: '#7a4a14', hi: '#e0a050', so: 0.7 });
    for (i = 0; i < 4; i++) v.dot(12.6 + i * 2.8, 16.6 + (i % 2) * 1.2, 1.7, ['#e8433a', '#f2c133', '#e8433a', '#3ac86a'][i]);
    v.part(Pblob(32, 22.4, 4.2, 5, 51), '#3a9a8a', { lw: 1.4, sh: '#1c6a5c', hi: '#78d8c8', so: 0.6 }); v.part(Prr(30, 15.6, 4, 3, 1), '#e8d8b8', { lw: 1, sh: null });
    v.part(Pblob(42, 23, 4, 4.4, 52), '#c8582a', { lw: 1.4, sh: '#8a3414', hi: '#f08a5a', so: 0.6 }); v.part(Prr(40.4, 16.8, 3.4, 3, 1), '#e8d8b8', { lw: 1, sh: null });
    v.part(Prr(48, 14, 8, 14, 3), '#7a4a8a', { lw: 1.4, sh: '#4e2a5e', hi: '#a878b8', so: 0.7 }); v.line(48.6, 20, 55.4, 20, 0.9, '#e8b84a');
    // cuerpo del carro
    v.part(Prr(5, 28, 58, 12, 2), '#a8743e', { lw: 1.9, sh: S.woodS, hi: S.woodH, so: 1.3 });
    for (i = 0; i < 4; i++) ln(v, 6, 31 + i * 2.6, 62, 31 + i * 2.6, 0.5, 'rgba(60,30,12,0.4)');
    v.part(Prr(4, 26.6, 60, 3.4, 1.2), '#8a5a2a', { lw: 1.4, sh: '#5a3a14', so: 0.4 });
    v.part(Prr(24, 31, 20, 7, 1.4), '#f4e6c0', { lw: 1.1, sh: '#d0c090', so: 0.4 }); v.dot(34, 34.6, 2.2, '#e8b84a'); v.dot(33.4, 34, 0.8, '#fff0a8');
    // toldo a rayas
    var T = [[2, 8], [66, 8], [62, 0], [6, 0]];
    v.outline(Ppoly([[0, 10], [68, 10], [62, 0.6], [6, 0.6]]), 1.8, OLC);
    x.save(); x.beginPath(); Ppoly([[0, 10], [68, 10], [62, 0.6], [6, 0.6]])(x); x.clip();
    for (i = 0; i < 8; i++) { x.fillStyle = i % 2 ? '#e8d4a0' : '#8a2a3a'; x.fillRect(i * 8.5, 0, 8.5, 12); }
    x.fillStyle = 'rgba(40,10,40,0.18)'; x.fillRect(0, 7, 68, 4); x.restore();
    for (i = 0; i < 8; i++) v.part(Pblob(4.2 + i * 8.5, 10.4, 4.4, 2.6, 61 + i), i % 2 ? '#e8d4a0' : '#8a2a3a', { lw: 1.2, sh: i % 2 ? '#c0a870' : '#5a1424', so: 0.4 });
    // balanza colgando
    v.line(34, 11, 34, 14, 0.6, '#3a3040'); v.line(28, 14, 40, 14, 0.8, '#3a3040'); v.part(Pcirc(28, 16, 2), '#e8b84a', { lw: 0.9, sh: '#a8741a', so: 0.3 }); v.part(Pcirc(40, 16.4, 2), '#e8b84a', { lw: 0.9, sh: '#a8741a', so: 0.3 });
    // ruedas
    [[14, 41], [53, 41]].forEach(function (w) {
      v.part(Pcirc(w[0], w[1], 8.2), '#8a5a2a', { lw: 1.8, sh: '#5a3a14', hi: '#c08a52', so: 0.9 }); v.part(Pcirc(w[0], w[1], 5.6), '#3a2a22', { lw: 0.8, sh: null });
      for (i = 0; i < 4; i++) { var a = i * PI / 4 + 0.3; v.line(w[0] - Math.cos(a) * 6.2, w[1] - Math.sin(a) * 6.2, w[0] + Math.cos(a) * 6.2, w[1] + Math.sin(a) * 6.2, 1.3, '#a8743e'); }
      v.part(Pcirc(w[0], w[1], 1.8), '#6a6a78', { lw: 1, sh: null });
    });
  }], { lw: 1.7 });
