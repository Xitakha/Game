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
        x.translate(24, 30); x.scale(1.5, 1.5); x.translate(-D.hx, -D.hy);
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
    v.stick([[8, 38], [0, 46]], 2.4, '#8a5a34', { lw: 1.2, hi: '#b88050' });
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

  // ---- fogata central: 6 frames de llama
  function tongue(cx, base, h, w, ph, lean) {
    var tip = Math.sin(ph) * w * 0.4 + (lean || 0);
    return Pclosed([[cx - w / 2, base], [cx - w * 0.55, base - h * 0.45], [cx + tip, base - h], [cx + w * 0.55, base - h * 0.45], [cx + w / 2, base]]);
  }
  addV('vil_bonfire', 40, 34, [0, 1, 2, 3, 4, 5].map(function (k) {
    return function (v) {
      var x = v.ctx, i, st = [], ph = k * 1.05;
      for (i = 0; i < 10; i++) { var a = i / 10 * TAU; st.push([20 + Math.cos(a) * 16.4, 27.4 + Math.sin(a) * 5.4, a]); }
      function stone(s, j) { v.part(Pblob(s[0], s[1], 3.7, 2.8, 100 + j, 0.08, 7), j % 2 ? '#8a7a80' : '#9a8a8c', { lw: 1.4, sh: '#5a4a50', hi: '#c0b0b0', so: 0.5 }); }
      st.forEach(function (s, j) { if (Math.sin(s[2]) < 0) stone(s, j); });
      x.fillStyle = 'rgba(20,10,20,0.45)'; x.beginPath(); x.ellipse(20, 27.6, 13, 4, 0, 0, TAU); x.fill();
      v.stick([[9, 29], [30, 24.4]], 3.8, '#7a4a2a', { lw: 1.3, hi: '#a8743e' }); v.stick([[31, 29], [10, 24.6]], 3.8, '#6a3e22', { lw: 1.3, hi: '#98643a' });
      var cfg = [[12.4, 14 + (k % 3), 7, 0.5], [27.6, 13 + ((k + 1) % 3), 7, 2.2], [20, 24 + (k % 2 ? 1 : -1) * 0.2, 11, 1.4]];
      var base = 25.6;
      cfg.forEach(function (c, j) { v.part(tongue(c[0], base, c[1] + (j === 2 ? 5 : 0), c[2], ph + c[3], (j - 1) * 0.6), '#ff4a1e', { lw: 1.2, ol: '#7a1424', sh: '#d02a1a', hi: '#ff8a2a', so: 0.6 }); });
      cfg.forEach(function (c, j) { v.flat(tongue(c[0], base, (c[1] + (j === 2 ? 5 : 0)) * 0.66, c[2] * 0.62, ph + c[3] + 0.4, (j - 1) * 0.4), '#ff9a2a'); });
      cfg.forEach(function (c, j) { v.flat(tongue(c[0], base, (c[1] + (j === 2 ? 5 : 0)) * 0.34, c[2] * 0.34, ph + c[3] + 0.8, 0), '#ffe27a'); });
      v.dot(20, 24.6, 2, '#fff6c0');
      st.forEach(function (s, j) { if (Math.sin(s[2]) >= 0) stone(s, j); });
      [[11, 14 - k % 3 * 2], [28, 9 + k % 2 * 3], [18, 4 + k]].forEach(function (p, j) { v.dot(p[0], p[1] - j, 0.6, j % 2 ? '#ffd23a' : '#ff9a2a'); });
    };
  }), { lw: 1.5 }, { fire: { f: [0, 1, 2, 3, 4, 5], fps: 10 } });

  // ---- arboles
  function treeCanopy(ps, k) { return ps.map(function (c, j) { return Pcirc(c[0] + Math.sin(k * 3.1 + j) * 0.5, c[1] + Math.cos(k * 3.1 + j) * 0.3, c[2]); }); }
  addV('vil_tree0', 56, 72, [0, 1].map(function (k) {
    return function (v) {
      v.part(Ppoly([[24, 70], [26, 40], [30, 40], [34, 70], [31, 66], [27, 66]]), '#7a4a2a', { lw: 1.9, sh: '#4e2e18', hi: '#a8743e', so: 1.2 });
      v.stick([[28, 48], [18, 38]], 3, '#7a4a2a', { lw: 1.4 }); v.stick([[30, 46], [40, 36]], 3, '#7a4a2a', { lw: 1.4 });
      v.cluster(treeCanopy([[28, 20, 15], [14, 28, 11], [42, 28, 11], [20, 12, 10], [37, 12, 10], [28, 33, 10]], k), '#e08a2e', { lw: 1.9, sh: '#b0561c', hi: '#f8c050', so: 2.2 });
      var r = rrand(5); for (var i = 0; i < 10; i++) v.dot(10 + r() * 36, 8 + r() * 28, 1 + r(), r() < 0.5 ? '#f8c050' : '#c8641c');
    };
  }), { lw: 1.7 }, { sway: { f: [0, 1], fps: 1.2 } });
  addV('vil_tree1', 44, 70, [0, 1].map(function (k) {
    return function (v) {
      v.part(Prr(19, 58, 7, 12, 1), '#6a3e22', { lw: 1.7, sh: '#3e2412', hi: '#946038', so: 0.8 });
      var sw = k ? 0.6 : 0, tiers = [[56, 21, 8], [42, 17, 7], [29, 13, 6.5], [17, 9.5, 6]];
      v.part(Ppoly([[22 + sw, 0.8], [30 + sw, 18], [14 + sw, 18]]), '#3a8a6a', { lw: 1.8, sh: '#1c5a48', hi: '#6ac8a0', so: 1.4 });
      v.part(Ppoly([[22 + sw * 0.8, 10], [33, 32], [11, 32]]), '#2e7a5c', { lw: 1.8, sh: '#1a4e3c', hi: '#5ab890', so: 1.6 });
      v.part(Ppoly([[22 + sw * 0.5, 22], [37, 46], [7, 46]]), '#267050', { lw: 1.8, sh: '#16443a', hi: '#4aa880', so: 1.8 });
      v.part(Ppoly([[22, 34], [41, 62], [3, 62]]), '#1e6048', { lw: 1.8, sh: '#123a30', hi: '#3a9870', so: 2 });
    };
  }), { lw: 1.7 }, { sway: { f: [0, 1], fps: 1.2 } });
  addV('vil_tree2', 44, 60, [0, 1].map(function (k) {
    return function (v) {
      v.part(Ppoly([[19, 58], [20, 30], [24, 30], [26, 58]]), '#e8e0d0', { lw: 1.7, sh: '#b8aa98', hi: '#ffffff', so: 0.9 });
      [[21, 40, 3], [23, 48, 3], [20.6, 34, 2]].forEach(function (m) { v.line(m[0] - m[2] / 2, m[1], m[0] + m[2] / 2, m[1], 1, '#3a3040'); });
      v.cluster(treeCanopy([[22, 18, 12], [11, 26, 8.4], [33, 26, 8.4], [16, 10, 7.6], [29, 10, 7.6]], k), '#c8b83a', { lw: 1.8, sh: '#8a8a1c', hi: '#f0e468', so: 1.8 });
      var r = rrand(9); for (var i = 0; i < 7; i++) v.dot(8 + r() * 28, 6 + r() * 24, 0.9 + r() * 0.6, r() < 0.5 ? '#f0e468' : '#a8982a');
    };
  }), { lw: 1.7 }, { sway: { f: [0, 1], fps: 1.2 } });

  // ---- farol, antorcha, vallas y bultos
  addV('vil_lantern', 14, 42, [function (v) {
    v.part(Prr(2.6, 38, 8.8, 4, 1), S.iron, { lw: 1.4, sh: S.ironS, so: 0.3 });
    v.part(Prr(5.6, 14, 3, 25, 1), S.iron, { lw: 1.4, sh: S.ironS, hi: '#6a5a78', so: 0.5 });
    v.part(Prr(1.4, 5, 11.2, 12, 2), S.amber, { lw: 1.5, sh: '#e8901c', hi: '#fff0b0', so: 0.8 });
    v.part(Pblob(7, 11, 2.4, 3.4, 111), '#fff6c8', { lw: 0, sh: null });
    v.line(7, 5.4, 7, 16.8, 0.7, '#3a3040'); v.line(1.8, 11, 12.2, 11, 0.7, '#3a3040');
    v.part(Ppoly([[0, 5.6], [7, 0.6], [14, 5.6]]), S.iron, { lw: 1.4, sh: S.ironS, hi: '#6a5a78', so: 0.5 }); v.part(Prr(1, 16.4, 12, 2.4, 1), S.iron, { lw: 1.1, sh: null });
  }], { lw: 1.5 });
  addV('vil_torch', 12, 34, [0, 1, 2, 3].map(function (k) {
    return function (v) {
      v.part(Ppoly([[4.6, 33], [5.4, 14], [7, 14], [8.2, 33]]), '#7a4a2a', { lw: 1.4, sh: '#4e2e18', hi: '#a8743e', so: 0.6 });
      v.part(Ppoly([[2, 11], [10, 11], [8.6, 16.6], [3.4, 16.6]]), S.iron, { lw: 1.3, sh: S.ironS, hi: '#6a5a78', so: 0.4 });
      var ph = k * 1.6;
      v.part(Pclosed([[3, 11.6], [2.6, 8], [6 + Math.sin(ph) * 0.8, 1.2 + (k % 2)], [9.4, 8], [9, 11.6]]), '#ff4a1e', { lw: 1, ol: '#7a1424', sh: '#d02a1a', hi: '#ff8a2a', so: 0.4 });
      v.flat(Pclosed([[4.2, 11.4], [4, 8.6], [6 + Math.sin(ph) * 0.5, 4.4 + (k % 2)], [8, 8.6], [7.8, 11.4]]), '#ffb830'); v.dot(6, 10, 1, '#fff3b0');
    };
  }), { lw: 1.3 }, { fire: { f: [0, 1, 2, 3], fps: 9 } });
  addV('vil_fence', 32, 16, [function (v) {
    v.part(Prr(-1, 4.4, 34, 3, 1), '#a8743e', { lw: 1.3, sh: S.woodS, hi: S.woodH, so: 0.4 }); v.part(Prr(-1, 9.6, 34, 3, 1), '#a8743e', { lw: 1.3, sh: S.woodS, hi: S.woodH, so: 0.4 });
    v.part(Ppoly([[2.4, 14.6], [2.4, 3.4], [5.4, 0.8], [8.4, 3.4], [8.4, 14.6]]), '#8a5a2e', { lw: 1.5, sh: S.woodS, hi: S.woodH, so: 0.6 });
    v.part(Ppoly([[23.6, 14.6], [23.6, 3.4], [26.6, 0.8], [29.6, 3.4], [29.6, 14.6]]), '#8a5a2e', { lw: 1.5, sh: S.woodS, hi: S.woodH, so: 0.6 });
  }], { lw: 1.3 });
  addV('vil_barrel', 16, 20, [function (v) {
    v.part(Pclosed([[2, 3], [14, 3], [15.4, 11], [14, 19], [2, 19], [0.6, 11]]), '#a8743e', { lw: 1.6, sh: S.woodS, hi: S.woodH, so: 1 });
    v.part(Pblob(8, 3, 6, 2, 121), '#c08a52', { lw: 1.3, sh: '#8a5a2e', so: 0.3 });
    v.line(1.6, 7, 14.4, 7, 1.1, '#4a3a4a'); v.line(1.2, 15, 14.8, 15, 1.1, '#4a3a4a'); v.line(5.4, 4.6, 5.2, 18, 0.5, 'rgba(27,17,36,0.4)'); v.line(10.6, 4.6, 10.8, 18, 0.5, 'rgba(27,17,36,0.4)');
  }], { lw: 1.5 });
  addV('vil_crate', 18, 16, [function (v) {
    v.part(Prr(1, 1, 16, 14, 1), '#b8843e', { lw: 1.6, sh: '#7a4e22', hi: '#e0a860', so: 0.8 });
    v.line(1.6, 1.8, 16.4, 14.4, 1.2, '#7a4e22'); v.line(16.4, 1.8, 1.6, 14.4, 1.2, '#7a4e22'); v.part(Prr(2.6, 2.6, 12.8, 10.8, 0.6), 'rgba(0,0,0,0)', { lw: 0.8, sh: null });
  }], { lw: 1.5 });
  addV('vil_hay', 22, 14, [function (v) {
    v.part(Pblob(11, 8, 10, 6, 131, 0.06, 9), '#e0b83a', { lw: 1.7, sh: '#b08a1c', hi: '#fcdc78', so: 0.9 });
    v.line(2, 6, 20, 6.4, 0.6, '#8a6a14'); v.line(2.6, 10, 19.4, 10, 0.6, '#8a6a14'); v.line(8, 3.2, 7, 5.4, 0.7, '#fcdc78'); v.line(14, 3.4, 15.4, 5.4, 0.7, '#fcdc78');
  }], { lw: 1.6 });
  addV('vil_bush', 24, 16, [function (v) {
    v.cluster([Pcirc(7, 9, 6), Pcirc(14, 7, 7), Pcirc(19, 10, 5)], '#4a8a3e', { lw: 1.6, sh: '#2a5a2a', hi: '#8ac860', so: 1.1 });
    v.dot(10, 8, 0.9, '#e8433a'); v.dot(16.4, 10.4, 0.9, '#e8433a'); v.dot(13, 5, 0.8, '#f2c133');
  }], { lw: 1.5 });
  addV('vil_bunting', 100, 24, [0, 1, 2].map(function (k) {
    return function (v) {
      var x = v.ctx, i, cols = ['#f3a31f', '#1fa8a0', '#d8584a', '#f6e8d0'];
      function cy(t) { return 3 + 9 * 4 * t * (1 - t); }
      x.strokeStyle = OLC; x.lineWidth = 2.2; x.beginPath(); x.moveTo(1, 3); x.quadraticCurveTo(50, 21, 99, 3); x.stroke();
      x.strokeStyle = '#8a6a3a'; x.lineWidth = 0.9; x.stroke();
      for (i = 0; i < 12; i++) {
        var t = (i + 0.7) / 12.6, px = 1 + t * 98, py = cy(t), sw = Math.sin(k * 2.1 + i * 0.9) * 1.1;
        v.part(Ppoly([[px - 3.6, py], [px + 3.6, py], [px + sw, py + 8.4]]), cols[i % 4], { lw: 1.1, sh: 'rgba(60,20,40,0.35)', so: 0.5 });
      }
      v.part(Pcirc(1.4, 3, 1.6), '#6e4624', { lw: 0.8, sh: null }); v.part(Pcirc(98.6, 3, 1.6), '#6e4624', { lw: 0.8, sh: null });
    };
  }), { lw: 1 }, { sway: { f: [0, 1, 2, 1], fps: 2 } });
  addV('vil_sign', 44, 34, [function (v) {
    var x = v.ctx;
    v.part(Prr(19.4, 12, 5, 22, 1), '#8a5a2e', { lw: 1.5, sh: S.woodS, hi: S.woodH, so: 0.6 });
    v.part(Prr(1, 2, 42, 14, 2), '#b8843e', { lw: 1.7, sh: '#7a4e22', hi: '#e0a860', so: 1 });
    x.save(); x.font = 'bold 8px "Courier New", monospace'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillStyle = '#3a1e0e'; x.fillText('RESCOLDO', 22.4, 9.6); x.fillStyle = '#ffe9a0'; x.fillText('RESCOLDO', 22, 9); x.restore();
    v.dot(3.4, 4.4, 0.7, '#3a3040'); v.dot(40.6, 4.4, 0.7, '#3a3040');
  }], { lw: 1.5 });
  addV('vil_cloud', 48, 16, [0, 1].map(function (k) {
    return function (v) {
      var x = v.ctx, ps = k ? [[12, 11, 7, 4], [22, 8, 8.6, 5.4], [33, 10, 7, 4.4], [24, 12, 14, 3.4]] : [[10, 11, 6, 3.6], [19, 8.4, 7.4, 5], [30, 9.6, 8, 4.6], [38, 11.4, 6, 3.4], [24, 12, 15, 3.2]];
      x.fillStyle = 'rgba(255,255,255,0.9)'; ps.forEach(function (p) { x.beginPath(); x.ellipse(p[0], p[1], p[2], p[3], 0, 0, TAU); x.fill(); });
      x.fillStyle = 'rgba(200,190,220,0.55)'; x.beginPath(); x.ellipse(24, 13.2, 14, 2.2, 0, 0, TAU); x.fill();
    };
  }), { lw: 0 });

  // =================================================================== CIELO (3 frames) Y SUELO
  var SKY = [
    { s: [[0, '#6cbce8'], [0.6, '#b4e0ec'], [1, '#f8f0d0']], h: ['#a0bcd2', '#82ac94', '#5e9462'], sun: ['#fff4b8', 380, 46, 14] },
    { s: [[0, '#2a2060'], [0.4, '#8a3a7e'], [0.75, '#ff7a4a'], [1, '#ffc878']], h: ['#7a5a8e', '#5a4278', '#44366a'], sun: ['#ffe08a', 340, 78, 22] },
    { s: [[0, '#070a22'], [0.55, '#1a2050'], [1, '#3a3a7a']], h: ['#2a2e60', '#1e2250', '#161a40'], sun: ['#f4f0d8', 410, 30, 9] }
  ];
  addV('vil_sky', 480, 270, SKY.map(function (D, k) {
    return function (v) {
      var x = v.ctx, i, r = rrand(21 + k);
      var g = x.createLinearGradient(0, 0, 0, 100); D.s.forEach(function (s) { g.addColorStop(s[0], s[1]); });
      x.fillStyle = g; x.fillRect(0, 0, 480, 100); x.fillStyle = '#3e6a34'; x.fillRect(0, 100, 480, 170);
      if (k === 2) for (i = 0; i < 70; i++) { x.fillStyle = 'rgba(255,255,255,' + (0.4 + r() * 0.6) + ')'; var sz = r() < 0.15 ? 1.4 : 0.7; x.fillRect(r() * 480, r() * 64, sz, sz); }
      var sg = x.createRadialGradient(D.sun[1], D.sun[2], 2, D.sun[1], D.sun[2], D.sun[3] * 4); sg.addColorStop(0, k === 2 ? 'rgba(220,230,255,0.35)' : 'rgba(255,230,150,0.55)'); sg.addColorStop(1, 'rgba(255,200,120,0)');
      x.fillStyle = sg; x.fillRect(D.sun[1] - 100, D.sun[2] - 100, 200, 200);
      x.fillStyle = D.sun[0]; x.beginPath(); x.arc(D.sun[1], D.sun[2], D.sun[3], 0, TAU); x.fill();
      if (k === 2) { x.fillStyle = D.s[1][1]; x.beginPath(); x.arc(D.sun[1] + 4, D.sun[2] - 2, D.sun[3] * 0.85, 0, TAU); x.fill(); }
      [[62, 14, 0.012, 0], [74, 18, 0.017, 2], [84, 12, 0.02, 4]].forEach(function (L, j) {
        var pts = [[-10, 110]], px; for (px = 0; px <= 490; px += 24) pts.push([px, L[0] + Math.sin(px * L[2] + L[3]) * L[1] + Math.sin(px * 0.05 + j) * 4]); pts.push([490, 110]);
        v.part(Pclosed(pts), D.h[j], { lw: 1.4, sh: k === 1 ? 'rgba(30,10,50,0.3)' : 'rgba(10,20,40,0.18)', so: 1.2 });
      });
      for (i = 0; i < 46; i++) { var tx = r() * 480, ty = 78 + Math.sin(tx * 0.027) * 12 + Math.sin(tx * 0.05 + 2) * 4 + 8, th = 8 + r() * 6; x.fillStyle = D.h[2]; x.beginPath(); x.moveTo(tx - 3, ty + 4); x.lineTo(tx, ty - th + 4); x.lineTo(tx + 3, ty + 4); x.fill(); }
    };
  }), { lw: 1.3 });

  // suelo: hierba, plaza y caminos (px de juego /2). Camino = trazos gruesos con borde.
  function pathStroke(x, pts, w, col, sm) {
    x.strokeStyle = col; x.lineWidth = w; x.lineCap = 'round'; x.lineJoin = 'round'; x.beginPath(); x.moveTo(pts[0][0], pts[0][1]);
    for (var i = 1; i < pts.length - 1; i++) x.quadraticCurveTo(pts[i][0], pts[i][1], (pts[i][0] + pts[i + 1][0]) / 2, (pts[i][1] + pts[i + 1][1]) / 2);
    x.lineTo(pts[pts.length - 1][0], pts[pts.length - 1][1]); x.stroke();
  }
  addV('vil_ground', 480, 270, [function (v) {
    var x = v.ctx, i, r = rrand(33), top = [];
    for (i = 0; i <= 24; i++) top.push([i * 20 - 10, 90 + Math.sin(i * 0.9) * 3 + Math.sin(i * 2.3) * 2]);
    var g = x.createLinearGradient(0, 86, 0, 270); g.addColorStop(0, '#86a83e'); g.addColorStop(0.35, '#5e8c3a'); g.addColorStop(1, '#3a6232');
    x.fillStyle = g; x.beginPath(); x.moveTo(-10, 270); top.forEach(function (p, j) { j ? x.lineTo(p[0], p[1]) : x.lineTo(p[0], p[1]); }); x.lineTo(490, 270); x.closePath(); x.fill();
    x.strokeStyle = OLC; x.lineWidth = 2; x.beginPath(); top.forEach(function (p, j) { j ? x.lineTo(p[0], p[1]) : x.moveTo(p[0], p[1]); }); x.stroke();
    // manchas de hierba
    for (i = 0; i < 38; i++) { x.fillStyle = r() < 0.5 ? 'rgba(160,200,70,0.22)' : 'rgba(30,70,40,0.2)'; x.beginPath(); x.ellipse(r() * 480, 100 + r() * 170, 14 + r() * 26, 4 + r() * 8, 0, 0, TAU); x.fill(); }
    // caminos
    var road = [[-10, 190], [40, 198], [100, 190], [160, 200], [230, 194], [300, 200], [360, 192], [420, 196], [490, 190]];
    var br = [[[65, 150], [62, 172], [72, 192]], [[150, 150], [152, 172], [140, 196]], [[280, 152], [276, 174], [270, 194]], [[368, 150], [372, 172], [380, 192]], [[436, 150], [440, 172], [430, 194]]];
    pathStroke(x, road, 36, OLC); br.forEach(function (b) { pathStroke(x, b, 22, OLC); });
    x.fillStyle = OLC; x.beginPath(); x.ellipse(240, 196, 60, 30, 0, 0, TAU); x.fill();
    pathStroke(x, road, 32, '#b8905e'); br.forEach(function (b) { pathStroke(x, b, 18, '#b8905e'); });
    x.fillStyle = '#b8905e'; x.beginPath(); x.ellipse(240, 196, 56, 27, 0, 0, TAU); x.fill();
    pathStroke(x, road, 20, '#c9a470'); br.forEach(function (b) { pathStroke(x, b, 8, '#c9a470'); });
    x.fillStyle = '#c9a470'; x.beginPath(); x.ellipse(240, 196, 44, 20, 0, 0, TAU); x.fill();
    x.strokeStyle = '#8a6640'; x.lineWidth = 0.8; x.beginPath(); x.ellipse(240, 196, 36, 15.6, 0, 0, TAU); x.stroke();
    for (i = 0; i < 30; i++) { x.fillStyle = 'rgba(138,102,64,0.45)'; x.beginPath(); x.ellipse(r() * 480, 188 + r() * 14, 3 + r() * 5, 1 + r() * 1.4, 0, 0, TAU); x.fill(); }
    for (i = 0; i < 26; i++) { var px = 8 + r() * 464, py = 177 + r() * 8 + (r() < 0.5 ? 0 : 38); v.part(Pblob(px, py, 1.6 + r() * 1.6, 1.1 + r(), 300 + i), '#9a8a86', { lw: 0.8, sh: '#6a5a58', hi: '#c0b0aa', so: 0.3 }); }
    // matas y flores
    for (i = 0; i < 140; i++) {
      var tx = r() * 480, ty = 100 + r() * 170, dx = tx - 240, dy = (ty - 196) * 2;
      if (Math.abs(ty - 196) < 20 && (tx < 490)) continue; if (dx * dx / 3600 + dy * dy / 3600 < 1.6 && ty > 170 && ty < 224) continue;
      x.strokeStyle = r() < 0.5 ? '#3a6a2e' : '#a8d060'; x.lineWidth = 0.9; x.lineCap = 'round';
      x.beginPath(); x.moveTo(tx - 2, ty + 2); x.lineTo(tx - 2.6, ty - 1.4); x.moveTo(tx, ty + 2); x.lineTo(tx + 0.2, ty - 2.6); x.moveTo(tx + 2, ty + 2); x.lineTo(tx + 3, ty - 1.2); x.stroke();
    }
    var fl = ['#f6e8d0', '#f3a31f', '#e8586a', '#8ac8f0'];
    for (i = 0; i < 46; i++) { var fx = r() * 480, fy = 104 + r() * 164; if (Math.abs(fy - 196) < 20) continue; v.line(fx, fy + 3, fx, fy, 0.6, '#3a6a2e'); v.part(Pcirc(fx, fy - 0.6, 1.5), fl[i % 4], { lw: 0.6, sh: 'rgba(60,20,40,0.25)', so: 0.2 }); v.dot(fx, fy - 0.6, 0.4, '#f3a31f'); }
  }], { lw: 1.4 });

  // =================================================================== EFECTOS Y UI
  addV('fx_portal_glow', 64, 64, [0, 1, 2, 3].map(function (k) {
    return function (v) {
      var x = v.ctx, i, ph = k / 4, g = x.createRadialGradient(32, 32, 2, 32, 32, 32);
      g.addColorStop(0, 'rgba(210,255,246,0.75)'); g.addColorStop(0.3, 'rgba(70,220,200,0.45)'); g.addColorStop(0.65, 'rgba(110,90,230,0.2)'); g.addColorStop(1, 'rgba(60,30,140,0)');
      x.fillStyle = g; x.fillRect(0, 0, 64, 64);
      for (i = 0; i < 2; i++) { var rr = 10 + ((ph + i * 0.5) % 1) * 20; x.strokeStyle = 'rgba(200,255,240,' + (0.5 * (1 - ((ph + i * 0.5) % 1))) + ')'; x.lineWidth = 1.4; x.beginPath(); x.arc(32, 32, rr, 0, TAU); x.stroke(); }
      for (i = 0; i < 8; i++) { var a = ph * TAU / 8 + i * TAU / 8, d = 14 + (i % 3) * 5; x.fillStyle = i % 2 ? 'rgba(255,210,90,0.9)' : 'rgba(255,140,50,0.9)'; x.beginPath(); x.arc(32 + Math.cos(a) * d, 32 + Math.sin(a) * d, 1, 0, TAU); x.fill(); }
    };
  }), { lw: 0 }, { loop: { f: [0, 1, 2, 3], fps: 6 } });

  // globo de dialogo 9-slice: 24x24 base (48 final), corte 16 final = 8 base
  var BUB = [['#fdf6e3', '#d8cdb0', '#1b1124'], ['#2e2250', '#1c1438', '#0c0814'], ['#ffe6a0', '#e0b050', '#3a2410']];
  addV('ui_bubble', 24, 24, BUB.map(function (C, k) {
    return function (v) {
      var x = v.ctx;
      v.part(Prr(1, 1.4, 22, 20.6, 5.6), C[0], { lw: 1.7, ol: k === 1 ? '#9a7aff' : (k === 2 ? '#8a5a14' : OLC), sh: C[1], so: 1.2 });
      if (k === 1) v.outline(Prr(0.6, 1, 22.8, 21.4, 6), 0.8, '#0c0814');
      if (k === 2) { x.fillStyle = 'rgba(255,255,255,0.5)'; x.fillRect(4, 3.6, 16, 1); }
    };
  }), { lw: 1.7 });
  addV('ui_bubble_tail', 14, 10, BUB.map(function (C, k) {
    return function (v) {
      var x = v.ctx, oc = k === 1 ? '#9a7aff' : (k === 2 ? '#8a5a14' : OLC);
      x.fillStyle = C[0]; x.beginPath(); x.moveTo(1, -1); x.lineTo(13, -1); x.lineTo(7.8, 8.6); x.quadraticCurveTo(7, 9.8, 6.2, 8.6); x.closePath(); x.fill();
      x.strokeStyle = oc; x.lineWidth = 1.6; x.lineJoin = 'round'; x.beginPath(); x.moveTo(1.4, 0); x.lineTo(6.2, 8.8); x.quadraticCurveTo(7, 9.8, 7.8, 8.8); x.lineTo(12.6, 0); x.stroke();
    };
  }), { lw: 1.7 });

  function markFn(col, colS, colH, k) {
    return function (v) {
      var x = v.ctx, s = 1 + Math.sin(k * TAU / 4) * 0.04;
      var g = x.createRadialGradient(7, 10, 1, 7, 10, 10); g.addColorStop(0, 'rgba(255,255,220,0.4)'); g.addColorStop(1, 'rgba(255,255,220,0)'); x.fillStyle = g; x.fillRect(-3, 0, 20, 22);
      x.save(); x.translate(7, 10); x.scale(s, s); x.translate(-7, -10);
      v.part(Pclosed([[7, 1.4], [12.6, 5], [12.6, 12.4], [7, 17.6], [1.4, 12.4], [1.4, 5]]), col, { lw: 1.7, sh: colS, hi: colH, so: 1 });
      v.part(Ppoly([[5.6, 4.2], [8.4, 4.2], [7.8, 11], [6.2, 11]]), '#fffbe8', { lw: 0.5, ol: colS, sh: null }); v.part(Pcirc(7, 13.6, 1.2), '#fffbe8', { lw: 0.5, ol: colS, sh: null });
      x.restore();
      var a = k * 0.8; star(v, 11.6 + Math.cos(a) * 1, 3 + Math.sin(a), 1.7 + (k % 2) * 0.7, '#fff6c0', a);
      v.dot(1.8, 15.6 - k * 0.4, 0.5, '#fff6c0');
    };
  }
  addV('ui_mark_gold', 14, 22, [0, 1, 2, 3].map(function (k) { return markFn('#f3b01f', '#b4700e', '#ffe27a', k); }), { lw: 1.7 }, { shine: { f: [0, 1, 2, 3], fps: 6 } });
  addV('ui_mark_green', 14, 22, [0, 1, 2, 3].map(function (k) { return markFn('#3ac86a', '#1a7a42', '#9af0b0', k); }), { lw: 1.7 }, { shine: { f: [0, 1, 2, 3], fps: 6 } });

  function keycap(label, w) {
    return [0, 1].map(function (k) {
      return function (v) {
        var x = v.ctx, dy = k ? 1.6 : 0;
        v.part(Prr(1, 5 + 0.6, w - 2, 12, 3), '#241a32', { lw: 1.6, sh: null });
        v.part(Prr(1, 2 + dy, w - 2, 12, 3), '#f6ecd8', { lw: 1.7, sh: '#cdbf9c', hi: '#ffffff', so: 1 });
        x.save(); x.font = 'bold 10px "Courier New", monospace'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillStyle = '#2a1e3c'; x.fillText(label, w / 2, 8.4 + dy); x.restore();
      };
    });
  }
  addV('ui_key_e', 18, 18, keycap('E', 18), { lw: 1.7 }, { pulse: { f: [0, 1], fps: 2 } });
  addV('ui_key_tab', 28, 18, keycap('TAB', 28), { lw: 1.7 }, { pulse: { f: [0, 1], fps: 2 } });
  addV('ui_arrow', 14, 14, [0, 1].map(function (k) {
    return function (v) { var dy = k * 1.6; v.part(Ppoly([[4.6, 1 + dy], [9.4, 1 + dy], [9.4, 6 + dy], [12.4, 6 + dy], [7, 12 + dy], [1.6, 6 + dy], [4.6, 6 + dy]]), '#ffd23a', { lw: 1.6, sh: '#d89010', hi: '#fff2a8', so: 0.8 }); };
  }), { lw: 1.6 }, { bob: { f: [0, 1], fps: 3 } });

  // emotes 16x16 base (32 final): 0 corazon, 1 !, 2 ?, 3 nota, 4 ..., 5 moneda, 6 destello, 7 gota
  addV('emote', 16, 16, [
    function (v) { v.part(Pclosed([[8, 14], [2, 8], [2.6, 3.6], [6, 2.6], [8, 5], [10, 2.6], [13.4, 3.6], [14, 8]]), '#ee4a64', { lw: 1.6, sh: '#a8203a', hi: '#ff9aa8', so: 0.8 }); },
    function (v) { v.part(Ppoly([[6, 1.6], [10, 1.6], [9, 10], [7, 10]]), '#ff6a3a', { lw: 1.4, sh: '#b83a14', so: 0.6 }); v.part(Pcirc(8, 13, 1.6), '#ff6a3a', { lw: 1.3, sh: '#b83a14', so: 0.4 }); },
    function (v) { var x = v.ctx; x.save(); x.strokeStyle = OLC; x.lineWidth = 4; x.lineCap = 'round'; x.beginPath(); x.arc(8, 5.6, 3.4, PI * 1.1, PI * 2.4); x.lineTo(8, 10); x.stroke(); x.strokeStyle = '#4ad8e8'; x.lineWidth = 2; x.beginPath(); x.arc(8, 5.6, 3.4, PI * 1.1, PI * 2.4); x.lineTo(8, 10); x.stroke(); x.restore(); v.part(Pcirc(8, 13.4, 1.5), '#4ad8e8', { lw: 1.3, sh: '#1c88a0', so: 0.3 }); },
    function (v) { v.part(Pblob(5.4, 12, 2.8, 2.1, 5, 0.03, 8, -0.3), '#b88aff', { lw: 1.4, sh: '#7a4ac0', so: 0.5 }); v.stick([[7.8, 11.4], [7.8, 2.4], [12.6, 4.4]], 1.6, '#b88aff', { lw: 1.2 }); },
    function (v) { [3.4, 8, 12.6].forEach(function (cx, j) { v.part(Pcirc(cx, 9 + (j % 2) * -0.8, 1.7), '#f6ecd8', { lw: 1.3, sh: '#cdbf9c', so: 0.4 }); }); },
    function (v) { v.part(Pcirc(8, 8, 6), '#ffd23a', { lw: 1.6, sh: '#c8901a', hi: '#fff6c0', so: 0.9 }); v.part(Pcirc(8, 8, 3.6), '#f3b01f', { lw: 0.8, ol: '#a8741a', sh: null }); v.line(8, 5.8, 8, 10.2, 1, '#a8741a'); },
    function (v) { star(v, 8, 8, 6.4, '#fff6c0', 0); star(v, 3.6, 3.4, 2.2, '#ffe27a', 0.2); star(v, 12.6, 12.6, 2, '#ffe27a', 0.1); },
    function (v) { v.part(Pclosed([[11, 2], [14, 8], [11, 12.6], [8, 8]]), '#8ad8ff', { lw: 1.4, sh: '#3a88c8', hi: '#d8f4ff', so: 0.6 }); }
  ], { lw: 1.5 });

  // =================================================================== DATOS DE LA ALDEA (px del canvas 960x540)
  var NPCS = {
    grum:    { name: 'Grum', title: 'Herrero', x: 108, y: 340, flip: false, color: '#c8602c', top: 74, sw: 24, off: 0 },
    vesper:  { name: 'Vesper', title: 'Cazadora de encargos', x: 352, y: 348, flip: false, color: '#e8782a', top: 80, sw: 17, off: 640 },
    rufo:    { name: 'Rufo', title: 'Mercader', x: 744, y: 436, flip: true, color: '#c8902a', top: 78, sw: 24, off: 1310 },
    ulalume: { name: 'Ulalume', title: 'Archivista', x: 772, y: 352, flip: true, color: '#7a5ab8', top: 84, sw: 19, off: 1930 },
    lanudo:  { name: 'Abuelo Lanudo', title: 'Anciano', x: 438, y: 410, flip: false, color: '#c8b890', top: 62, sw: 26, off: 2570 },
    castana: { name: 'Tia Castana', title: 'Cocinera', x: 538, y: 352, flip: false, color: '#e0949c', top: 74, sw: 19, off: 3210 }
  };
  // props: spr, x,y = ancla bottom-center, sort = y de ordenacion, anim (opcional), col = [dx,dy,w,h] rect de colision relativo al ancla
  var PROPS = [
    { id: 'tree_b0', spr: 'vil_tree0', x: 14, y: 292, sort: 270, anim: 'sway' }, { id: 'tree_b1', spr: 'vil_tree1', x: 418, y: 270, sort: 270, anim: 'sway' },
    { id: 'tree_b2', spr: 'vil_tree2', x: 384, y: 282, sort: 282, anim: 'sway' }, { id: 'tree_b3', spr: 'vil_tree1', x: 466, y: 262, sort: 262, anim: 'sway' },
    { id: 'tree_b4', spr: 'vil_tree1', x: 640, y: 298, sort: 298, anim: 'sway' }, { id: 'tree_b5', spr: 'vil_tree2', x: 944, y: 292, sort: 292, anim: 'sway' },
    { id: 'bush0', spr: 'vil_bush', x: 372, y: 306, sort: 306 }, { id: 'bush1', spr: 'vil_bush', x: 484, y: 308, sort: 308 }, { id: 'bush2', spr: 'vil_bush', x: 24, y: 330, sort: 330, col: [-20, -14, 40, 14] },
    { id: 'forge', spr: 'vil_forge', x: 130, y: 308, sort: 308, col: [-96, -78, 192, 78] },
    { id: 'board', spr: 'vil_board', x: 300, y: 308, sort: 308, anim: 'wave', col: [-64, -50, 128, 50] },
    { id: 'tent', spr: 'vil_tent', x: 560, y: 308, sort: 308, col: [-72, -56, 144, 56] },
    { id: 'archive', spr: 'vil_archive', x: 715, y: 308, sort: 308, col: [-72, -78, 144, 78] },
    { id: 'portal', spr: 'vil_portal', x: 872, y: 308, sort: 308, anim: 'swirl', col: [-84, -78, 168, 78] },
    { id: 'anvil', spr: 'vil_anvil', x: 146, y: 355, sort: 338, col: [-22, -20, 44, 20] },
    { id: 'barrel0', spr: 'vil_barrel', x: 46, y: 346, sort: 346, col: [-16, -14, 32, 14] }, { id: 'crate0', spr: 'vil_crate', x: 200, y: 356, sort: 356, col: [-18, -16, 36, 16] },
    { id: 'barrel1', spr: 'vil_barrel', x: 226, y: 348, sort: 348, col: [-16, -14, 32, 14] },
    { id: 'pot', spr: 'vil_pot', x: 578, y: 366, sort: 349, anim: 'fire', col: [-24, -20, 48, 20] },
    { id: 'cart', spr: 'vil_cart', x: 668, y: 426, sort: 426, col: [-66, -40, 132, 40] },
    { id: 'barrel2', spr: 'vil_barrel', x: 590, y: 444, sort: 444, col: [-16, -14, 32, 14] }, { id: 'crate1', spr: 'vil_crate', x: 624, y: 454, sort: 454, col: [-18, -16, 36, 16] },
    { id: 'hay0', spr: 'vil_hay', x: 700, y: 462, sort: 462, col: [-22, -14, 44, 14] },
    { id: 'bonfire', spr: 'vil_bonfire', x: 480, y: 402, sort: 402, anim: 'fire', col: [-34, -22, 68, 22] },
    { id: 'lamp0', spr: 'vil_lantern', x: 206, y: 380, sort: 380, col: [-6, -8, 12, 8] }, { id: 'lamp1', spr: 'vil_lantern', x: 400, y: 344, sort: 344, col: [-6, -8, 12, 8] },
    { id: 'lamp2', spr: 'vil_lantern', x: 560, y: 410, sort: 410, col: [-6, -8, 12, 8] }, { id: 'lamp3', spr: 'vil_lantern', x: 806, y: 392, sort: 392, col: [-6, -8, 12, 8] },
    { id: 'lamp4', spr: 'vil_lantern', x: 934, y: 440, sort: 440, col: [-6, -8, 12, 8] }, { id: 'lamp5', spr: 'vil_lantern', x: 60, y: 420, sort: 420, col: [-6, -8, 12, 8] },
    { id: 'torch0', spr: 'vil_torch', x: 800, y: 352, sort: 352, anim: 'fire', col: [-5, -8, 10, 8] }, { id: 'torch1', spr: 'vil_torch', x: 944, y: 352, sort: 352, anim: 'fire', col: [-5, -8, 10, 8] },
    { id: 'bunting0', spr: 'vil_bunting', x: 232, y: 268, sort: 330, anim: 'sway' }, { id: 'bunting1', spr: 'vil_bunting', x: 430, y: 292, sort: 330, anim: 'sway' },
    { id: 'sign', spr: 'vil_sign', x: 880, y: 484, sort: 484, col: [-14, -10, 28, 10] }
  ];
  for (var fi = 0; fi < 17; fi++) PROPS.push({ id: 'fence' + fi, spr: 'vil_fence', x: 34 + fi * 56, y: 512, sort: 512 });
  PROPS.push({ id: 'tree_f0', spr: 'vil_tree0', x: 30, y: 598, sort: 600, anim: 'sway' }, { id: 'tree_f1', spr: 'vil_tree1', x: 938, y: 604, sort: 604, anim: 'sway' });
  var COLL = [{ id: 'fence_s', x: 0, y: 500, w: 960, h: 14 }];
  PROPS.forEach(function (p) { if (p.col) COLL.push({ id: p.id, x: p.x + p.col[0], y: p.y + p.col[1], w: p.col[2], h: p.col[3] }); });
  var LIGHTS = [
    { x: 480, y: 372, r: 230, c: [255, 150, 60], s: 1, fl: 1, id: 'bonfire' },
    { x: 100, y: 276, r: 130, c: [255, 120, 40], s: 0.9, fl: 1, id: 'forge' }, { x: 715, y: 214, r: 110, c: [255, 190, 90], s: 0.8, fl: 0.3, id: 'archive' },
    { x: 597, y: 276, r: 90, c: [255, 190, 90], s: 0.7, fl: 0.3, id: 'tent' }, { x: 872, y: 250, r: 210, c: [80, 235, 215], s: 1, fl: 0.5, id: 'portal' },
    { x: 578, y: 340, r: 80, c: [255, 120, 50], s: 0.6, fl: 1, id: 'pot' }
  ];
  [[206, 380], [400, 344], [560, 410], [806, 392], [934, 440], [60, 420]].forEach(function (l, i) { LIGHTS.push({ x: l[0], y: l[1] - 62, r: 110, c: [255, 196, 100], s: 0.75, fl: 0.4, id: 'lamp' + i }); });
  [[800, 352], [944, 352]].forEach(function (l, i) { LIGHTS.push({ x: l[0], y: l[1] - 54, r: 100, c: [255, 140, 50], s: 0.8, fl: 1, id: 'torch' + i }); });

  var VIL = A.VILLAGE = {
    w: 960, h: 540, walk: { x: 20, y: 290, w: 920, h: 200 },
    spots: {
      marloStart: { x: 470, y: 440 }, portalReturn: { x: 850, y: 360 }, bonfire: { x: 480, y: 402 }, portal: { x: 872, y: 330 },
      forge: { x: 130, y: 308 }, board: { x: 300, y: 308 }, archive: { x: 715, y: 308 }, tent: { x: 560, y: 308 }, cart: { x: 668, y: 426 }
    },
    npcs: NPCS, props: PROPS, colliders: COLL, lights: LIGHTS
  };
  A.NPC_NAMES = NPC_NAMES;

  // =================================================================== API DE DIBUJO
  function frameOf(name, anim, t) { return A.animFrame(name, anim, t); }
  A.drawNPC = function (ctx, name, x, y, t, o) {
    var d = NPCS[name]; if (!d) return; o = o || {};
    var anim = o.anim || 'idle', sc = o.scale || 1, flip = o.flip == null ? d.flip : o.flip;
    var fr = frameOf('npc_' + name, anim, (t || 0) + (o.tOff == null ? d.off : o.tOff));
    ctx.save();
    if (o.alpha != null) ctx.globalAlpha = o.alpha;
    if (o.shadow !== false) { ctx.fillStyle = 'rgba(20,8,30,0.34)'; ctx.beginPath(); ctx.ellipse(x, y - 1, d.sw * sc, 6 * sc, 0, 0, TAU); ctx.fill(); }
    ctx.translate(x, y); if (flip) ctx.scale(-1, 1); ctx.scale(sc, sc);
    ctx.drawImage(fr, -40, -80);
    ctx.restore();
  };
  A.drawPortrait = function (ctx, name, x, y, o) {
    o = o || {}; var fr = A.sprite('portrait_' + name, o.mood || 0), s = o.size || 96;
    ctx.drawImage(fr, x, y, s, s);
  };
  A.drawBubble = function (ctx, x, y, w, h, o) {
    o = o || {}; var st = o.style | 0, img = A.sprite('ui_bubble', st), s = 16, W = 48; w = Math.max(w, 36); h = Math.max(h, 36);
    var sx = [0, s, W - s], sw = [s, W - 2 * s, s], dx = [x, x + s, x + w - s], dw = [s, w - 2 * s, s], dy = [y, y + s, y + h - s], dh = [s, h - 2 * s, s], r, c;
    ctx.save(); if (o.alpha != null) ctx.globalAlpha = o.alpha;
    for (r = 0; r < 3; r++) for (c = 0; c < 3; c++) ctx.drawImage(img, sx[c], sx[r], sw[c], sw[r], dx[c], dy[r], dw[c], dh[r]);
    var tl = o.tail === undefined ? 'down' : o.tail;
    if (tl) {
      var tx = clamp(o.tailX == null ? x + w / 2 : o.tailX, x + 18, x + w - 18), tail = A.sprite('ui_bubble_tail', st);
      if (tl === 'down') ctx.drawImage(tail, tx - 14, y + h - 6);
      else { ctx.translate(tx, y + 6); ctx.scale(1, -1); ctx.drawImage(tail, -14, 0); }
    }
    ctx.restore();
  };
  A.villageTime = function (n) { return typeof n === 'number' ? clamp(n, 0, 1) : ({ dia: 0, day: 0, ocaso: 0.5, dusk: 0.5, noche: 1, night: 1 }[n] != null ? { dia: 0, day: 0, ocaso: 0.5, dusk: 0.5, noche: 1, night: 1 }[n] : 0.5); };

  // tinte de oscuridad por hora: [r,g,b,alpha]
  function tintAt(tm) {
    var K = [[255, 236, 200, 0.0], [120, 46, 104, 0.3], [12, 16, 60, 0.55]], i = tm < 0.5 ? 0 : 1, k = tm < 0.5 ? tm * 2 : (tm - 0.5) * 2;
    return [lerp(K[i][0], K[i + 1][0], k), lerp(K[i][1], K[i + 1][1], k), lerp(K[i][2], K[i + 1][2], k), lerp(K[i][3], K[i + 1][3], k)];
  }
  var SHADE = null, VIGN = null;
  function lightFlick(L, t) { return 1 - L.fl * 0.12 + L.fl * (0.08 * Math.sin(t / 90 + L.x) + 0.05 * Math.sin(t / 37 + L.y)); }

  A.drawVillageLight = function (ctx, t, opts) {
    opts = opts || {}; var tm = A.villageTime(opts.time == null ? 'ocaso' : opts.time), T = tintAt(tm), dk = T[3] / 0.55, i, L;
    if (T[3] > 0.01) {
      if (!SHADE) { SHADE = mkCanvas(480, 270); }
      var s = SHADE.getContext('2d');
      s.globalCompositeOperation = 'source-over'; s.clearRect(0, 0, 480, 270);
      s.fillStyle = 'rgba(' + (T[0] | 0) + ',' + (T[1] | 0) + ',' + (T[2] | 0) + ',' + T[3].toFixed(3) + ')'; s.fillRect(0, 0, 480, 270);
      s.globalCompositeOperation = 'destination-out';
      for (i = 0; i < LIGHTS.length; i++) {
        L = LIGHTS[i]; var f = lightFlick(L, t), r = L.r * f / 2, g = s.createRadialGradient(L.x / 2, L.y / 2, 0, L.x / 2, L.y / 2, r);
        g.addColorStop(0, 'rgba(0,0,0,' + clamp(L.s * 0.95, 0, 1) + ')'); g.addColorStop(0.45, 'rgba(0,0,0,' + (L.s * 0.55) + ')'); g.addColorStop(1, 'rgba(0,0,0,0)');
        s.fillStyle = g; s.fillRect(L.x / 2 - r, L.y / 2 - r, r * 2, r * 2);
      }
      s.globalCompositeOperation = 'source-over';
      ctx.save(); ctx.imageSmoothingEnabled = true; ctx.drawImage(SHADE, 0, 0, 960, 540); ctx.restore();
    }
    // brillos aditivos calidos (mas fuertes al oscurecer)
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    var amt = 0.22 + 0.78 * clamp(dk * 1.2, 0, 1);
    for (i = 0; i < LIGHTS.length; i++) {
      L = LIGHTS[i]; var ff = lightFlick(L, t), rr = L.r * 0.8 * ff, gg = ctx.createRadialGradient(L.x, L.y, 0, L.x, L.y, rr), al = L.s * 0.32 * amt;
      gg.addColorStop(0, 'rgba(' + L.c[0] + ',' + L.c[1] + ',' + L.c[2] + ',' + al + ')'); gg.addColorStop(1, 'rgba(' + L.c[0] + ',' + L.c[1] + ',' + L.c[2] + ',0)');
      ctx.fillStyle = gg; ctx.fillRect(L.x - rr, L.y - rr, rr * 2, rr * 2);
    }
    var pg = A.animFrame('fx_portal_glow', 'loop', t), ps = 2.3 + 0.1 * Math.sin(t / 400); ctx.globalAlpha = 0.18 + 0.7 * clamp(dk, 0, 1);
    ctx.drawImage(pg, 872 - pg.width * ps / 2, 236 - pg.height * ps / 2, pg.width * ps, pg.height * ps);
    ctx.restore();
    if (opts.vignette !== false) {
      if (!VIGN) { VIGN = mkCanvas(960, 540); var vx = VIGN.getContext('2d'), vg = vx.createRadialGradient(480, 280, 250, 480, 270, 620); vg.addColorStop(0, 'rgba(20,6,36,0)'); vg.addColorStop(1, 'rgba(20,6,36,0.5)'); vx.fillStyle = vg; vx.fillRect(0, 0, 960, 540); }
      ctx.drawImage(VIGN, 0, 0);
    }
  };

  var FF = (function () { var r = rrand(77), a = []; for (var i = 0; i < 14; i++) a.push({ x: 40 + r() * 880, y: 300 + r() * 190, ax: 14 + r() * 26, ay: 8 + r() * 14, sx: 0.0003 + r() * 0.0006, sy: 0.0004 + r() * 0.0006, ph: r() * 6.3 }); return a; })();
  function drawFireflies(ctx, t, tm) {
    var k = clamp(0.18 + tm * 1.4, 0, 1); ctx.save(); ctx.globalCompositeOperation = 'lighter';
    FF.forEach(function (f) {
      var x = f.x + Math.sin(t * f.sx + f.ph) * f.ax, y = f.y + Math.cos(t * f.sy + f.ph * 2) * f.ay, p = 0.35 + 0.65 * Math.max(0, Math.sin(t * 0.003 + f.ph * 3)), al = p * k;
      var g = ctx.createRadialGradient(x, y, 0, x, y, 9); g.addColorStop(0, 'rgba(240,255,140,' + (0.8 * al) + ')'); g.addColorStop(1, 'rgba(200,255,100,0)'); ctx.fillStyle = g; ctx.fillRect(x - 9, y - 9, 18, 18);
      ctx.fillStyle = 'rgba(255,255,210,' + al + ')'; ctx.fillRect(x - 1, y - 1, 2, 2);
    });
    ctx.restore();
  }
  function puffs(ctx, x0, y0, t, n, o) {
    for (var i = 0; i < n; i++) {
      var ph = ((t / o.dur) + i / n) % 1, a = o.al * (1 - ph) * Math.min(1, ph * 5), r = o.r0 + ph * o.r1;
      ctx.fillStyle = 'rgba(' + o.col + ',' + a.toFixed(3) + ')'; ctx.beginPath(); ctx.arc(x0 + ph * o.dx + Math.sin(ph * 6 + i * 2) * o.sw, y0 - ph * o.rise, r, 0, TAU); ctx.fill();
    }
  }
  function sparks(ctx, x0, y0, t, n, spread, rise) {
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    for (var i = 0; i < n; i++) {
      var ph = ((t / 1800) + i * 0.173) % 1, a = (1 - ph), x = x0 + Math.sin(i * 5.1 + ph * 4) * spread * ph, y = y0 - ph * rise;
      ctx.fillStyle = (i % 2 ? 'rgba(255,200,70,' : 'rgba(255,120,40,') + a.toFixed(2) + ')'; ctx.fillRect(x, y, 2, 2);
    }
    ctx.restore();
  }

  A.drawVillage = function (ctx, t, opts) {
    opts = opts || {}; t = t || 0;
    var tm = A.villageTime(opts.time == null ? 'ocaso' : opts.time), i;
    ctx.save(); ctx.imageSmoothingEnabled = true;
    // cielo: mezcla entre los 3 frames
    var k0 = tm < 0.5 ? 0 : 1, kk = tm < 0.5 ? tm * 2 : (tm - 0.5) * 2;
    ctx.drawImage(A.sprite('vil_sky', k0), 0, 0);
    if (kk > 0.01) { ctx.globalAlpha = kk; ctx.drawImage(A.sprite('vil_sky', k0 + 1), 0, 0); ctx.globalAlpha = 1; }
    var cl = tm < 0.5 ? 1 - tm * 0.5 : 0.75 - (tm - 0.5) * 1.2;
    for (i = 0; i < 3; i++) { var cs = A.sprite('vil_cloud', i % 2), cx = ((t * (0.004 + i * 0.0015) + i * 380) % 1160) - 100; ctx.globalAlpha = 0.85 * clamp(cl, 0.1, 1); ctx.drawImage(cs, cx, 24 + i * 22 + (i === 1 ? 14 : 0), cs.width * 1.5, cs.height * 1.5); }
    ctx.globalAlpha = 1;
    ctx.drawImage(A.sprite('vil_ground', 0), 0, 0);
    ctx.imageSmoothingEnabled = false;
    // lista ordenada por y
    var items = [], npcOpt = opts.npcs == null ? true : opts.npcs;
    PROPS.forEach(function (p) { items.push({ y: p.sort, p: p }); });
    if (npcOpt) NPC_NAMES.forEach(function (n) {
      var o = npcOpt === true ? {} : (npcOpt[n] || {}); if (o.hidden) return; var d = NPCS[n];
      items.push({ y: o.y != null ? o.y : d.y, n: n, o: o });
    });
    (opts.actors || []).forEach(function (a) { items.push({ y: a.y, a: a }); });
    items.sort(function (a, b) { return a.y - b.y; });
    items.forEach(function (it) {
      if (it.p) {
        var p = it.p, fr = p.anim ? A.animFrame(p.spr, p.anim, t + (p.x * 7 % 900)) : A.sprite(p.spr, 0);
        ctx.drawImage(fr, Math.round(p.x - fr.width / 2), Math.round(p.y - fr.height));
        if (p.id === 'forge' && opts.smoke !== false) { /* el humo va encima de todo, ver abajo */ }
      } else if (it.n) {
        var d = NPCS[it.n], o = it.o; A.drawNPC(ctx, it.n, o.x != null ? o.x : d.x, o.y != null ? o.y : d.y, t, { anim: o.anim, flip: o.flip, tOff: o.tOff });
      } else { ctx.save(); it.a.draw(ctx); ctx.restore(); }
    });
    ctx.imageSmoothingEnabled = true;
    if (opts.smoke !== false) {
      puffs(ctx, 176, 156, t, 6, { dur: 3600, al: 0.55, r0: 4, r1: 9, dx: 26, sw: 3, rise: 74, col: tm > 0.7 ? '120,120,160' : '214,200,208' });
      puffs(ctx, 576, 326, t, 4, { dur: 2200, al: 0.4, r0: 3, r1: 5, dx: 6, sw: 2.5, rise: 34, col: '250,244,236' });
      sparks(ctx, 100, 270, t, 5, 12, 40); sparks(ctx, 480, 376, t, 9, 26, 90);
    }
    if (opts.fireflies !== false) drawFireflies(ctx, t, tm);
    ctx.restore();
    if (opts.light !== false) A.drawVillageLight(ctx, t, opts);
  };
})();
