/*!
 * assets_fam3.js - Arte P3: TUNDRA (DESIGN-v5-biomas.md B.1 mundo, B.3 familia de 9 monstruos, C.4-B; sin el jefe Yarlak = P4).
 * Se carga DESPUES de assets_fam2.js (usa Assets._h). Contrato exacto: ASSETS_API.md, seccion "Tundra P3".
 * Misma gramatica que fam1/fam2: contorno grueso #1b1124, color plano + 1 sombra + 1 brillo, miran a la DERECHA.
 * Tamano base x2 = final. Todo se precompone una vez al cargar (offscreen): en juego el dibujo es un drawImage.
 * Paleta: pelaje #e8eef5 (sombra #8fa4bf), hielo #9fd8ff / #5aa8e8 / #2a4f8a / #1b2f66, marfil #f1ead2, ojos cian #5ff0ff.
 * Acentos por monstruo: lobezno rosa palido, cazador bufanda ambar, lobo puas de hielo, oso cristales y cicatriz, yeti cara azul y placa,
 * murcielago alas de cristal indigo, estalagmita ojos rojizos tenues, espiritu lila, chaman runas violetas.
 */
(function () {
  'use strict';
  var A = window.Assets, H = A && A._h;
  if (!H) { if (window.console) console.error('assets_fam3: falta Assets._h (cargar tras assets.js)'); return; }
  var addV = H.addV, Pclosed = H.Pclosed, Ppoly = H.Ppoly, Pblob = H.Pblob, Prr = H.Prr, Pcirc = H.Pcirc;
  var dyingFrames = H.dyingFrames, PH = H.PH, OLC = H.OLC, mkCanvas = H.mkCanvas;
  var TAU = 6.2832, sin = Math.sin, cos = Math.cos, PI = Math.PI;
  var FUR = '#e8eef5', FUR_S = '#8fa4bf', FUR_H = '#ffffff', ICE = '#9fd8ff', ICE_M = '#5aa8e8', ICE_D = '#2a4f8a', ICE_DD = '#1b2f66';
  var IVO = '#f1ead2', IVO_S = '#c8bb98', CY = '#5ff0ff', SNOW = '#e8eef5';

  var WK = [1, 2, 4, 5];
  function wk(k) { var p = PH[WK[k]]; return { c: Math.round(cos(p)), by: -(Math.abs(sin(p)) > 0.8 ? 1 : 0), p: p }; }
  function withDie(fr, draw, w, h, opt, o) {
    var d0 = fr.length;
    dyingFrames(draw, w, h, opt, o).forEach(function (f) { fr.push(f); });
    return { f: [d0, d0 + 1, d0 + 2, d0 + 3, d0 + 4], fps: 9, loop: false };
  }
  var WALKSEQ = [0, 2, 1, 3, 4, 5];
  function eye(v, x, y, r, col) { v.dot(x, y, r + 0.55, OLC); v.dot(x, y, r, col || CY); v.dot(x - r * 0.35, y - r * 0.35, r * 0.42, '#ffffff'); }
  function spikes(cx, cy, rx, ry, n, amp, seed, rot) { // contorno de pelaje "erizado" (poligono de radios alternos)
    var pts = [], i, r = H.rrand(seed || 1);
    for (i = 0; i < n * 2; i++) {
      var a = i / (n * 2) * TAU + (rot || 0), k = (i % 2 ? 1 : 1 + amp) * (1 + (r() - 0.5) * 0.12);
      pts.push([cx + cos(a) * rx * k, cy + sin(a) * ry * k]);
    }
    return Ppoly(pts);
  }
  function snowDots(v, pts, r) { pts.forEach(function (p) { v.dot(p[0], p[1], r || 0.5, '#ffffff'); }); }

  // ======================================================================================================
  //  1. LOBEZNO DE NIEVE 20x16  (worm)  -- cachorro redondo y esponjoso, orejas y morro rosa palido
  // ======================================================================================================
  function lobezno(o) {
    return function (v) {
      var by = o.by || 0, L = o.legs || [0, 0, 0, 0], U = o.up || [0, 0, 0, 0];
      // cola esponjosa
      v.part(Ppoly([[4.2, 9.6 + by], [1.4, 7.4 + by], [2.2, 5.8 + by], [3.2, 7 + by], [3.8, 4.8 + by], [5.4, 7.6 + by]]), FUR, { lw: 1, sh: FUR_S, so: 0.4 });
      // patas lejanas
      [[7.8, L[2], U[2]], [12.8, L[3], U[3]]].forEach(function (l) { v.stick([[l[0], 11.4 + by], [l[0] + l[1] * 1.2, 14.8 - l[2]]], 2.3, FUR_S, { lw: 1.1 }); });
      // mechones del lomo
      v.part(Ppoly([[5.4, 7 + by], [6.2, 3.8 + by], [7.8, 6 + by], [9.4, 3.2 + by], [10.6, 6 + by], [12, 4.4 + by], [12.4, 7.6 + by]]), FUR, { lw: 1, sh: FUR_S, so: 0.4 });
      // cuerpo
      v.part(Pblob(9.2, 9.4 + by, 6.4, 4.6, 301, 0.05), FUR, { lw: 1.4, sh: FUR_S, hi: FUR_H, so: 0.9 });
      v.part(Pblob(8.4, 11.4 + by, 3.4, 1.7, 303), '#f6faff', { lw: 0, so: 0 });
      // patas cercanas
      [[5.6, L[0], U[0]], [11, L[1], U[1]]].forEach(function (l) { v.stick([[l[0], 11.6 + by], [l[0] + l[1] * 1.2, 14.9 - l[2]]], 2.5, FUR, { lw: 1.1, hi: FUR_H }); });
      // cabeza grande de cachorro
      v.part(Pblob(14.4, 7.6 + by, 4.6, 4.2, 302, 0.04), FUR, { lw: 1.4, sh: FUR_S, hi: FUR_H, so: 0.9 });
      // orejas con interior rosa palido (acento)
      v.part(Ppoly([[11.8, 5.6 + by], [12.2, 1.6 + by], [14.8, 4.2 + by]]), FUR, { lw: 1.1, sh: FUR_S, so: 0.3 });
      v.part(Ppoly([[15.2, 4.2 + by], [17.2, 1.8 + by], [18, 5.6 + by]]), FUR, { lw: 1.1, sh: FUR_S, so: 0.3 });
      v.part(Ppoly([[12.8, 4.6 + by], [12.9, 3 + by], [14, 4.2 + by]]), '#f4b8d0', { lw: 0, so: 0 });
      v.part(Ppoly([[16, 4.2 + by], [16.9, 3.2 + by], [17.2, 4.8 + by]]), '#f4b8d0', { lw: 0, so: 0 });
      // hocico + nariz
      v.part(Pblob(17.6, 9 + by, 2.3, 1.7, 304), '#f6faff', { lw: 1, sh: FUR_S, so: 0.3 });
      v.dot(19.2, 8.5 + by, 0.95, '#2a2040'); v.dot(18.9, 8.2 + by, 0.3, '#ffffff');
      v.line(17.6, 9.8 + by, 18.8, 10 + by, 0.5, OLC);
      eye(v, 15.8, 6.9 + by, 1.05, CY);
      if (o.snow) snowDots(v, [[3, 3], [7, 1.5], [12, 0.8]], 0.5);
    };
  }
  (function () {
    var F = [lobezno({}), lobezno({ by: 0.7, legs: [0, 0, 0, 0] })], k;
    for (k = 0; k < 4; k++) { var q = wk(k); F.push(lobezno({ by: q.by * 0.8, legs: [-q.c, q.c, q.c, -q.c], up: [q.c > 0 ? 0.6 : 0, q.c < 0 ? 0.6 : 0, q.c < 0 ? 0.6 : 0, q.c > 0 ? 0.6 : 0] })); }
    var dieA = withDie(F, lobezno({}), 20, 16, { lw: 1.4 });
    addV('enemy_tun_lobezno', 20, 16, F, { lw: 1.4 }, { idle: { f: [0, 1], fps: 4 }, walk: { f: WALKSEQ, fps: 9 }, die: dieA });
  })();

  // ======================================================================================================
  //  2. CAZADOR DE LA VENTISCA 24x28 (archer) -- parka azul marino, capucha con pelo, bufanda ambar, arco de marfil y hielo
  // ======================================================================================================
  function cazador(o) {
    return function (v) {
      var by = o.by || 0, c = o.c || 0, bx = 18.4, bY = 13.4 + by + (o.bdy || 0), aim = o.aim, px = bx - 5.2;
      // piernas y botas
      v.stick([[9.6, 20.4 + by], [9.2 + c * 1.5, 25.6]], 3.1, ICE_DD, { lw: 1.1, hi: '#3a5a98' });
      v.part(Prr(7.6 + c * 1.5, 24.6, 4.6, 2.6, 1), IVO, { lw: 1, sh: IVO_S, so: 0.3 });
      v.stick([[13.6, 20.4 + by], [14 - c * 1.5, 25.6]], 3.1, ICE_D, { lw: 1.1, hi: '#4a7ac0' });
      v.part(Prr(12 - c * 1.5, 24.6, 4.6, 2.6, 1), IVO, { lw: 1, sh: IVO_S, so: 0.3 });
      // brazo de la cuerda (lejano)
      if (aim) v.stick([[11.4, 13 + by], [8.4, 14 + by], [px, bY]], 2.3, ICE_DD, { lw: 1, curve: true });
      // parka
      v.part(Pclosed([[6.4, 12.6 + by], [9.4, 10.6 + by], [15, 10.6 + by], [17.6, 13 + by], [18.2, 21.6 + by], [12, 23.4 + by], [5.8, 21.6 + by]]), ICE_D, { lw: 1.5, sh: ICE_DD, hi: '#4a7ac0', so: 1 });
      v.line(12, 15.6 + by, 12, 22 + by, 0.7, ICE_DD);
      v.part(Pclosed([[5.6, 21 + by], [12, 22.8 + by], [18.6, 21 + by], [18, 24 + by], [12, 25.2 + by], [6.2, 24 + by]]), FUR, { lw: 1.1, sh: FUR_S, hi: FUR_H, so: 0.5 });
      // capucha
      v.part(Ppoly([[8.4, 5.4 + by], [7, 1.2 + by], [11.6, 3.2 + by]]), ICE_D, { lw: 1.2, so: 0.3 });
      v.part(Pblob(12.4, 7.8 + by, 5.7, 5.5, 311, 0.03), FUR, { lw: 1.5, sh: FUR_S, hi: FUR_H, so: 0.9 });
      v.part(Pblob(13.7, 8.2 + by, 3.7, 3.5, 312), '#0f1a3a', { lw: 0.9 });
      v.dot(12.8, 7.9 + by, 0.95, CY); v.dot(15.4, 7.9 + by, 0.95, CY); v.dot(12.6, 7.6 + by, 0.35, '#fff'); v.dot(15.2, 7.6 + by, 0.35, '#fff');
      // bufanda ambar (acento)
      v.part(Pclosed([[8.2, 12 + by], [15.6, 11.8 + by], [16.4, 14 + by], [12, 14.8 + by], [7.8, 14.2 + by]]), '#f0a030', { lw: 1.1, sh: '#b86a18', hi: '#ffd070', so: 0.5 });
      v.part(Ppoly([[8.6, 13.6 + by], [5.6, 15.6 + by], [6.4, 19.4 + by], [9.6, 15 + by]]), '#f0a030', { lw: 1, sh: '#b86a18', so: 0.4 });
      // arco de marfil con puntas de hielo
      var sg = o.sag || 0;
      v.stick([[bx - 1.6, bY - 8.4], [bx + 3.4 + sg, bY], [bx - 1.6, bY + 8.4]], 1.5, IVO, { lw: 1, curve: true, hi: '#fffbe8' });
      v.dot(bx - 1.6, bY - 8.4, 0.9, ICE); v.dot(bx - 1.6, bY + 8.4, 0.9, ICE);
      if (aim) {
        x(v).strokeStyle = '#eaf6ff'; x(v).lineWidth = 0.5; x(v).beginPath(); x(v).moveTo(bx - 1.6, bY - 8.2); x(v).lineTo(px, bY); x(v).lineTo(bx - 1.6, bY + 8.2); x(v).stroke();
        v.stick([[px, bY], [bx + 4.6, bY]], 0.9, '#bfe4ff', { lw: 0.6 });
        v.part(Ppoly([[bx + 4.2, bY - 1.1], [bx + 6.4, bY], [bx + 4.2, bY + 1.1]]), ICE, { lw: 0.8, so: 0.2 });
        v.part(Ppoly([[px - 0.2, bY], [px + 1.6, bY - 1.1], [px + 1.6, bY + 1.1]]), '#ffffff', { lw: 0.5, so: 0 });
      } else {
        x(v).strokeStyle = '#eaf6ff'; x(v).lineWidth = 0.5; x(v).beginPath(); x(v).moveTo(bx - 1.6, bY - 8.2); x(v).lineTo(bx - 1.6 - (o.rel ? -1.2 : 0), bY); x(v).lineTo(bx - 1.6, bY + 8.2); x(v).stroke();
      }
      if (o.rel) { v.dot(bx + 4.4, bY - 1, 0.9, '#cfeeff'); v.dot(bx + 6.2, bY + 1, 0.6, '#ffffff'); v.dot(bx + 5, bY + 2.4, 0.5, ICE); }
      // brazo del arco (cercano)
      v.stick([[15.4, 13 + by], [17 + (aim ? 0.4 : 0), 13.6 + by + (o.bdy || 0) * 0.5], [bx - 0.4, bY]], 2.4, ICE_D, { lw: 1, curve: true, hi: '#4a7ac0' });
      v.part(Pcirc(bx - 0.4, bY, 1.3), FUR, { lw: 0.8, sh: FUR_S, so: 0.2 });
    };
  }
  function x(v) { return v.ctx; }
  (function () {
    var F = [cazador({}), cazador({ by: 0.7 })], k;
    for (k = 0; k < 4; k++) { var q = wk(k); F.push(cazador({ by: q.by * 0.8, c: q.c })); }
    F.push(cazador({ aim: true, by: 0.2 }));                       // 6 aim
    F.push(cazador({ rel: true, sag: 0.8 }));                      // 7 shoot (suelta)
    F.push(cazador({ bdy: 1.8, by: 0.4 }));                        // 8 recupera
    var dieA = withDie(F, cazador({}), 24, 28, { lw: 1.5 });
    addV('enemy_tun_cazador', 24, 28, F, { lw: 1.5 }, { idle: { f: [0, 1], fps: 3 }, walk: { f: WALKSEQ, fps: 7 }, aim: { f: [6], fps: 1 }, shoot: { f: [7, 8], fps: 8 }, die: dieA });
  })();

  // ======================================================================================================
  //  3. LOBO DE ESCARCHA 28x20 (frostwolf) -- lobo largo y esbelto gris azulado con puas de hielo en el lomo
  // ======================================================================================================
  function lobo(o) {
    return function (v) {
      var X = v.ctx, by = o.by || 0, F4 = o.f || [[0, 0], [0, 0], [0, 0], [0, 0]], hr = o.hr || 0, tilt = o.tilt || 0, BS = '#9fb4cc', BSS = '#5e7a9c', BH = '#dce8f4';
      var ln = o.ln || 0; // estiramiento (lance)
      // patas lejanas (traseras = 0,1 ; delanteras = 2,3 ; indices 1 y 3 son las lejanas)
      function leg(hx, hy, f, col, hi) { v.stick([[hx, hy], [hx + f[0] * 0.5, (hy + 18.6 + f[1]) / 2 + 0.4], [hx + f[0] + 0.8, 18.4 + f[1]]], 2.5, col, { lw: 1.1, hi: hi, curve: true }); }
      leg(8.6 - ln, 13 + by, F4[1], BSS); leg(18 + ln, 13 + by, F4[3], BSS);
      // cola
      v.part(Pclosed([[5.6 - ln, 9 + by], [2.2 - ln, 9.6 + by + (o.tail || 0)], [0.4 - ln, 13 + by + (o.tail || 0) * 1.5], [2.6 - ln, 12.4 + by], [6, 12 + by]]), BS, { lw: 1.2, sh: BSS, hi: BH, so: 0.6 });
      X.save(); X.translate(12, 13); X.rotate(tilt); X.translate(-12, -13);
      // cuerpo
      v.part(Pblob(13.2, 10.6 + by, 9.4 + ln, 4.4, 331, 0.04), BS, { lw: 1.5, sh: BSS, hi: BH, so: 0.9 });
      v.part(Pblob(14, 12.4 + by, 6.4 + ln, 1.8, 334), '#d4e2f0', { lw: 0, so: 0 });
      // puas de hielo a lo largo del lomo (acento)
      [[8.4, 2.8], [11.4, 3.8], [14.4, 3.4], [17.2, 2.6]].forEach(function (s, i) {
        var sx = s[0] + (i - 1.5) * ln * 0.4;
        v.part(Ppoly([[sx - 1.3, 7.4 + by], [sx + 0.2, 7.4 - s[1] - 1.6 + by], [sx + 1.5, 7.2 + by]]), ICE, { lw: 0.9, sh: ICE_M, hi: '#ffffff', so: 0.3 });
      });
      X.restore();
      // cabeza
      X.save(); X.translate(19 + ln, 9.6 + by); X.rotate(hr);
      v.part(Pblob(0.6, 1.2, 3.6, 3.2, 332), BS, { lw: 1.3, sh: BSS, so: 0.6 });
      var jaw = o.mouth || 0;
      v.part(Pclosed([[1, 3.4], [5.4, 2.4 + jaw * 1.4], [8.6, 3 + jaw * 2.6], [4, 5 + jaw * 2.4]]), '#8aa2bc', { lw: 1, sh: BSS, so: 0.3 });
      if (jaw > 0.2) v.part(Pblob(5, 3 + jaw, 2.8, 0.8 + jaw * 0.7, 335), '#7a1e2a', { lw: 0.5 });
      v.part(Pclosed([[2.4, -1.2], [6.6, -0.6 + jaw * 0.2], [9, 0.6 - jaw * 0.6], [8.4, 2.4 - jaw * 0.5], [3, 3]]), '#dce8f4', { lw: 1.2, sh: '#9fb4cc', hi: '#ffffff', so: 0.4 });
      v.dot(9, 0.4 - jaw * 0.6, 1, '#2a2040'); v.dot(8.7, 0.1 - jaw * 0.6, 0.3, '#fff');
      v.part(Ppoly([[3.6, 2.2 - jaw * 0.3], [4.1, 3.9 + jaw * 0.8], [4.8, 2.2 - jaw * 0.3]]), IVO, { lw: 0.5, so: 0 });
      v.part(Ppoly([[6.4, 1.8 - jaw * 0.3], [6.9, 3.4 + jaw * 0.8], [7.5, 1.8 - jaw * 0.3]]), IVO, { lw: 0.5, so: 0 });
      var ea = o.earBack || 0;
      v.part(Ppoly([[-1.8, -1.6], [-2.6 - ea, -5.8], [0.8, -2.8]]), BS, { lw: 1.1, sh: BSS, so: 0.3 });
      v.part(Ppoly([[0.8, -2.4], [1.8 - ea * 0.5, -6], [3.4, -1.6]]), BS, { lw: 1.1, sh: BSS, so: 0.3 });
      eye(v, 3.6, 0.2, 0.95, CY);
      X.restore();
      // patas cercanas
      leg(7 - ln, 13.2 + by, F4[0], BS, BH); leg(19.4 + ln, 13.2 + by, F4[2], BS, BH);
      if (o.howl) { X.strokeStyle = 'rgba(159,216,255,0.95)'; X.lineWidth = 0.8; [[1, 0.6], [1.7, 0.9]].forEach(function (s, i) { X.beginPath(); X.arc(24.4 + ln, 3.4 + by, 1.8 + i * 1.8, -1.2, 0.5); X.stroke(); }); }
      if (o.lines) { v.line(0.2, 8, 4, 8, 0.7, 'rgba(232,238,245,0.85)'); v.line(0.2, 12, 3, 12, 0.7, 'rgba(232,238,245,0.7)'); v.line(1, 5.4, 4.4, 5.4, 0.6, 'rgba(232,238,245,0.6)'); }
    };
  }
  (function () {
    var F = [lobo({}), lobo({ by: 0.6, tail: 0.6 })], k;
    for (k = 0; k < 4; k++) {
      var q = wk(k), c = q.c; F.push(lobo({ by: q.by * 0.7, tail: c * 0.5, f: [[-c * 2.4, c > 0 ? -1 : 0], [c * 2.4, c < 0 ? -1 : 0], [c * 2.4, c < 0 ? -1 : 0], [-c * 2.4, c > 0 ? -1 : 0]] }));
    }
    F.push(lobo({ hr: -1.05, mouth: 1, howl: true, by: -0.4, tilt: -0.1, f: [[-1, 0], [-1.6, 0], [1.6, 0], [2.4, 0]] }));              // 6 howl
    F.push(lobo({ tilt: 0.16, hr: 0.35, earBack: 1.6, by: 1.2, tail: -0.6, f: [[1.4, 0], [0.6, 0], [2.4, 0], [3.4, 0]] }));          // 7 crouch
    F.push(lobo({ ln: 2.6, tilt: -0.1, mouth: 0.9, earBack: 1.2, by: -2.6, lines: true, f: [[-6.4, -5], [-5, -4], [6.6, -5.4], [7.8, -4.6]] })); // 8 lunge (en el aire)
    F.push(lobo({ ln: 1.4, tilt: 0.12, mouth: 1, earBack: 1, by: 0.4, lines: true, f: [[-3, -1.4], [-2, -0.6], [5.4, 0], [6.4, 0]] }));   // 9 lunge (aterriza)
    var dieA = withDie(F, lobo({}), 28, 20, { lw: 1.5 });
    addV('enemy_tun_lobo', 28, 20, F, { lw: 1.5 }, { idle: { f: [0, 1], fps: 3 }, walk: { f: WALKSEQ, fps: 10 }, howl: { f: [6], fps: 1 }, crouch: { f: [7], fps: 1 }, lunge: { f: [8, 9], fps: 8 }, die: dieA });
  })();

  // ======================================================================================================
  //  4. OSO POLAR 40x32 (boar) -- masa blanca con cristales de hielo azul en el lomo y cicatriz
  // ======================================================================================================
  function oso(o) {
    return function (v) {
      var X = v.ctx, by = o.by || 0, F4 = o.f || [[0, 0], [0, 0], [0, 0], [0, 0]], tilt = o.tilt || 0, hy = o.hy || 0, ln = o.ln || 0, B = '#f4f6f8', BS = '#a8b8cc', BH = '#ffffff';
      function leg(hx, hy0, f, col, hi) {
        v.stick([[hx, hy0], [hx + f[0] * 0.5, (hy0 + 28 + f[1]) / 2], [hx + f[0], 28.4 + f[1]]], 5.4, col, { lw: 1.3, hi: hi, curve: true });
        v.part(Prr(hx + f[0] - 3, 27.6 + f[1], 6.6, 3.2, 1.4), col === B ? '#e2eaf2' : BS, { lw: 1.1, sh: BS, so: 0.3 });
        v.dot(hx + f[0] + 2.4, 30.2 + f[1], 0.45, '#2a2040'); v.dot(hx + f[0] + 0.8, 30.4 + f[1], 0.45, '#2a2040');
      }
      leg(10.4 - ln, 21 + by, F4[1], BS); leg(27 + ln, 21 + by, F4[3], BS);
      X.save(); X.translate(20, 26); X.rotate(tilt); X.translate(-20, -26);
      // cristales de hielo del lomo (acento azul)
      [[11, 7.4, 1], [15.6, 5.6, 1.15], [20.4, 6.2, 1.05], [24.4, 8.4, 0.85]].forEach(function (s) {
        var sx = s[0], k = s[2];
        v.part(Ppoly([[sx - 2.6 * k, 11.4 + by], [sx - 0.6 * k, 11.4 - 8 * k + by + 2], [sx + 0.8 * k, 11.4 - 6 * k + by], [sx + 2.8 * k, 11.8 + by]]), ICE, { lw: 1.1, sh: ICE_M, hi: '#ffffff', so: 0.5 });
      });
      // cuerpo + joroba
      v.part(Pblob(19.4, 17.8 + by, 14.2 + ln, 8.6, 341, 0.04), B, { lw: 1.7, sh: BS, hi: BH, so: 1.2 });
      v.part(Pblob(25.4, 14 + by, 7.2, 6, 342, 0.05), B, { lw: 0, sh: BS, hi: BH, so: 0.8 });
      v.part(Pblob(18, 22.4 + by, 9, 2.6, 343), '#e2eaf2', { lw: 0, so: 0 });
      // cicatriz azul sobre el costado
      v.line(13, 14.4 + by, 17.2, 19 + by, 0.8, '#6a8ab0'); v.line(14.4, 13.6 + by, 18.4, 18.2 + by, 0.6, '#8aa6c8');
      X.restore();
      // cabeza
      X.save(); X.translate(29 + ln * 0.6, 15.4 + by + hy); X.rotate(o.hr || 0);
      v.part(Pblob(3.4, 0, 6, 5.2, 344, 0.03), B, { lw: 1.6, sh: BS, hi: BH, so: 0.9 });
      v.part(Pclosed([[5, -1.8], [10, -0.8], [11, 1.6], [8, 3.4], [5, 3]]), '#eef2f6', { lw: 1.4, sh: BS, hi: BH, so: 0.5 });
      v.dot(10.4, -0.2, 1.7, '#1b1124'); v.dot(9.8, -0.8, 0.5, '#8aa6c8');
      var mo = o.mouth || 0;
      v.line(8.6, 2.6, 5.6, 2.4 + mo * 1.4, 0.7, OLC);
      if (mo) { v.part(Pblob(7.6, 3, 2.4, 0.9 + mo, 345), '#7a1e2a', { lw: 0.6 }); v.dot(9, 1.8, 0.4, IVO); v.dot(6.6, 1.8, 0.4, IVO); }
      v.part(Pcirc(0.4, -4.2, 2.3), B, { lw: 1.2, sh: BS, so: 0.3 }); v.dot(0.6, -4, 1, '#f4b8d0');
      v.part(Pcirc(4.4, -4.4, 2), B, { lw: 1.1, sh: BS, so: 0.3 });
      eye(v, 6, -1.8, 1, CY);
      v.line(3, -3.4, 8, 1.4, 0.7, '#6a8ab0');
      X.restore();
      leg(8 - ln, 21.4 + by, F4[0], B, BH); leg(25 + ln, 21.4 + by, F4[2], B, BH);
      if (o.dig) { snowDots(v, [[33, 28], [36, 26], [34.6, 24.4], [37.4, 28.6]], 0.7); v.stick([[36, 30], [38.4, 27.6]], 0.9, '#fff', { lw: 0.5 }); }
      if (o.lines) { v.line(0.4, 12, 7, 12, 0.8, 'rgba(232,238,245,0.9)'); v.line(0.4, 18, 5.6, 18, 0.8, 'rgba(232,238,245,0.8)'); v.line(1.4, 24, 6, 24, 0.7, 'rgba(232,238,245,0.7)'); snowDots(v, [[3, 28], [6.4, 29.4], [9, 28]], 0.9); }
      if (o.spray) { snowDots(v, [[36, 29], [38, 27], [34, 30], [38.6, 30], [37, 25]], 0.9); v.line(34, 31, 39, 31, 0.8, 'rgba(232,238,245,0.9)'); v.line(30.6, 31.2, 36, 31.2, 0.7, 'rgba(232,238,245,0.7)'); }
    };
  }
  (function () {
    var F = [oso({}), oso({ by: 0.7, hy: 0.4 })], k;
    for (k = 0; k < 4; k++) {
      var q = wk(k), c = q.c; F.push(oso({ by: q.by * 0.8, hy: -q.by * 0.3, f: [[-c * 2.4, c > 0 ? -1.4 : 0], [c * 2.4, c < 0 ? -1.4 : 0], [c * 2.4, c < 0 ? -1.4 : 0], [-c * 2.4, c > 0 ? -1.4 : 0]] }));
    }
    F.push(oso({ tilt: 0.1, hy: 3.4, hr: 0.35, mouth: 0.5, by: 0.8, dig: true, f: [[-2, 0], [-1, 0], [-2.6, -4], [1, 0]] }));                                // 6 wind: cabeza baja, una zarpa escarba
    F.push(oso({ tilt: 0.06, hy: 3.6, hr: 0.2, mouth: 0.9, by: 1.2, ln: 1.2, lines: true, f: [[-6.4, -3], [-5, -2.2], [4.6, -3], [6, -3.4]] }));            // 7 charge A
    F.push(oso({ tilt: 0.04, hy: 4, hr: 0.2, mouth: 1, by: 0.2, ln: 1.4, lines: true, f: [[-3, -1], [-6, -2.4], [6.4, -1.4], [3, -2.8]] }));              // 8 charge B
    F.push(oso({ tilt: -0.12, hy: -0.4, hr: -0.1, mouth: 0.4, by: 0.8, spray: true, f: [[4.4, 0], [3, 0], [8, 0], [9.4, 0]] }));                           // 9 slide: patina con las patas por delante
    var dieA = withDie(F, oso({}), 40, 32, { lw: 1.7 });
    addV('enemy_tun_oso', 40, 32, F, { lw: 1.7 }, { idle: { f: [0, 1], fps: 3 }, walk: { f: WALKSEQ, fps: 8 }, wind: { f: [6], fps: 1 }, charge: { f: [7, 8], fps: 12 }, slide: { f: [9], fps: 1 }, die: dieA });
  })();

  // ======================================================================================================
  //  5. YETI 34x36 (shield) -- bruto peludo de cara azul con placa frontal de hielo (se derrite con Fuego)
  // ======================================================================================================
  function plate(v, px, py, o) { // placa de hielo en pie delante del yeti, centro (px,py), alto ~22
    var cr = o.cracked, rot = o.prot || 0, X = v.ctx;
    X.save(); X.translate(px, py); X.rotate(rot);
    v.part(Ppoly([[-3.6, -11], [3, -9], [4.2, 9], [0.4, 12.4], [-4.2, 8.6], [-4.8, -6]]), ICE, { lw: 1.6, sh: ICE_M, hi: '#ffffff', so: 1 });
    v.part(Ppoly([[-2.4, -8.4], [1.6, -7], [2.2, 6], [-1, 8.4], [-2.8, 5.4]]), '#cfeeff', { lw: 0, sh: '#8ccaf2', so: 0.5 });
    v.line(-2, -6, -0.8, 5.4, 0.5, '#ffffff');
    if (cr) { X.strokeStyle = OLC; X.lineWidth = 0.9; X.beginPath(); X.moveTo(-3.6, -4); X.lineTo(0.4, -1.4); X.lineTo(-1.2, 1.8); X.lineTo(2.6, 4.4); X.moveTo(0.4, -1.4); X.lineTo(3, -4.6); X.stroke(); }
    if (o.drip) { v.dot(4.6, 4 + o.drip, 0.8, ICE); v.dot(-4.8, 7 + o.drip * 0.5, 0.7, ICE); v.dot(1, 12.4 + o.drip, 0.7, '#cfeeff'); }
    X.restore();
  }
  function yeti(o) {
    return function (v) {
      var X = v.ctx, by = o.by || 0, c = o.c || 0, lean = o.lean || 0, np = o.np, FY = '#dfe8f2';
      // piernas
      v.stick([[12.6, 27 + by], [12.4 + c * 1.6, 32.4]], 5, FUR_S, { lw: 1.3 });
      v.part(Prr(9.8 + c * 1.6, 31.4, 6.8, 3.4, 1.4), '#6a7a98', { lw: 1.2, sh: '#4a5a78', so: 0.3 });
      v.stick([[19.4, 27 + by], [19.8 - c * 1.6, 32.4]], 5, FUR, { lw: 1.3, hi: FUR_H });
      v.part(Prr(17 - c * 1.6, 31.4, 6.8, 3.4, 1.4), '#8a9ab8', { lw: 1.2, sh: '#5a6a88', so: 0.3 });
      X.save(); X.translate(16, 33); X.rotate(lean); X.translate(-16, -33);
      // brazo lejano
      var ua = o.up || 0;
      v.stick([[10.4, 15 + by], [6 - ua * 0.4, 20 - ua * 6 + by], [6.4 - ua, 25.6 - ua * 14 + by]], 4.8, FUR_S, { lw: 1.3, curve: true });
      v.part(Pcirc(6.4 - ua, 25.6 - ua * 14 + by, 2.4), '#6a7a98', { lw: 1, sh: '#4a5a78', so: 0.3 });
      // torso peludo
      v.part(spikes(15.4, 21 + by, 10.2, 10.6, 9, 0.12, 351), FY, { lw: 1.6, sh: FUR_S, hi: FUR_H, so: 1.1 });
      v.part(Pblob(14.4, 25 + by, 6.4, 3.6, 352), '#cfdae8', { lw: 0, so: 0 });
      // cabeza: melena + cara azul
      v.part(spikes(17, 9.4 + by + (o.hy || 0), 6.6, 6.2, 7, 0.14, 353), FY, { lw: 1.5, sh: FUR_S, hi: FUR_H, so: 0.9 });
      var hy = 10.4 + by + (o.hy || 0);
      v.part(Pblob(19, hy, 4.1, 3.8, 354), '#5a78b0', { lw: 1.1, sh: '#3a5488', hi: '#8aa8d8', so: 0.5 });
      v.part(Ppoly([[15.4, hy - 3], [22.4, hy - 2.2], [22.4, hy - 0.8], [15.8, hy - 1.6]]), ICE_DD, { lw: 0.7, so: 0 });
      eye(v, 17.8, hy - 0.6, 0.95, CY); eye(v, 21, hy - 0.4, 0.85, CY);
      var mo = o.mouth || 0;
      v.part(Pblob(19.6, hy + 2.6, 2.5, 0.8 + mo, 355), '#1b1124', { lw: 0.5 });
      v.part(Ppoly([[17.6, hy + 1.8], [17.2, hy + 4.6 + mo], [18.8, hy + 2.2]]), IVO, { lw: 0.6, so: 0 });
      v.part(Ppoly([[20.4, hy + 2.2], [21.6, hy + 4.4 + mo], [22, hy + 1.8]]), IVO, { lw: 0.6, so: 0 });
      // brazo cercano + placa
      var px = 27 + (o.px || 0), py = 20 + by + (o.py || 0);
      if (!np) { v.stick([[20, 15.4 + by], [23.6, 19 + by], [px - 2.2, py + 1]], 5, FUR, { lw: 1.3, curve: true, hi: FUR_H }); plate(v, px, py, { cracked: o.cr, drip: o.drip, prot: o.prot }); v.part(Pcirc(px - 3, py + 1, 2.4), '#8aa8d8', { lw: 1, sh: '#5a78b0', so: 0.3 }); }
      else { v.stick([[20, 15.4 + by], [24, 19 + by], [px - 2.4, py + 4.4 + (o.pyn || 0)]], 5, FUR, { lw: 1.3, curve: true, hi: FUR_H }); v.part(Pcirc(px - 2.4, py + 4.4 + (o.pyn || 0), 2.6), '#8aa8d8', { lw: 1, sh: '#5a78b0', so: 0.3 }); }
      X.restore();
      if (o.breath) { X.fillStyle = 'rgba(232,242,255,0.8)'; [[27, 8, 1.8], [29.4, 6, 1.3], [31, 8.4, 1]].forEach(function (b) { X.beginPath(); X.arc(b[0], b[1], b[2], 0, TAU); X.fill(); }); }
      if (o.lines) { v.line(0.6, 14, 5, 14, 0.8, 'rgba(232,238,245,0.9)'); v.line(0.2, 20, 4.4, 20, 0.8, 'rgba(232,238,245,0.7)'); v.line(1.4, 26, 5.4, 26, 0.7, 'rgba(232,238,245,0.6)'); }
    };
  }
  (function () {
    function seq(np) {
      var out = [yeti({ np: np }), yeti({ np: np, by: 0.8, mouth: 0.4 })], k;
      for (k = 0; k < 4; k++) { var q = wk(k); out.push(yeti({ np: np, by: q.by * 0.8, c: q.c })); }
      out.push(yeti({ np: np, lean: -0.1, up: 0.9, px: -4, py: -8, pyn: -4, by: -0.4, hy: -0.6, mouth: 0.8, prot: -0.3 }));   // wind
      out.push(yeti({ np: np, lean: 0.16, px: 2.4, py: 1.4, pyn: 0, by: 0.4, hy: 1.4, mouth: 1, lines: true }));              // bash
      out.push(yeti({ np: np, lean: 0.22, hy: 3, by: 1.4, px: -1.6, py: 4, pyn: 3, mouth: 0.5, breath: true }));              // rec
      return out;
    }
    var F = seq(false);
    F.push(yeti({ cr: true, drip: 2.6, lean: -0.08, hy: 1.4, by: 0.6, px: 0.4, py: 2.4 }));                                    // 9 melt
    var dieA = withDie(F, yeti({}), 34, 36, { lw: 1.6 });                                                                       // 10-14
    var n0 = F.length; seq(true).forEach(function (f) { F.push(f); });                                                            // 15+ sin placa (bonus)
    // 15-16 idle_np, 17-20 walk_np, 21 wind_np, 22 bash_np, 23 rec_np
    addV('enemy_tun_yeti', 34, 36, F, { lw: 1.6 }, {
      idle: { f: [0, 1], fps: 3 }, walk: { f: WALKSEQ.slice(0, 1).concat([2, 1, 3, 4, 5]), fps: 6 }, wind: { f: [6], fps: 1 }, bash: { f: [6, 7, 8], fps: 10 }, rec: { f: [8], fps: 1 }, melt: { f: [9], fps: 1 }, die: dieA,
      idle_np: { f: [n0, n0 + 1], fps: 3 }, walk_np: { f: [n0, n0 + 2, n0 + 1, n0 + 3, n0 + 4, n0 + 5], fps: 6 }, wind_np: { f: [n0 + 6], fps: 1 }, bash_np: { f: [n0 + 6, n0 + 7, n0 + 8], fps: 10 }, rec_np: { f: [n0 + 8], fps: 1 }
    });
  })();

  // ======================================================================================================
  //  6. MURCIELAGO DE HIELO 24x16 (moth) -- alas de cristal azul sobre cuerpo indigo
  // ======================================================================================================
  function murci(o) {
    return function (v) {
      var X = v.ctx, wy = o.wy == null ? 6 : o.wy, dive = o.dive, by = o.by || 0, wsw = o.wsw || 0;
      function wing(side, far) {
        var sx = 11.4, sy = 8.4 + by, s = side, tipx = dive ? sx - s * 7.4 * (dive === 2 ? 0.55 : 1) : sx + s * 10.4, tipy = dive ? (dive === 2 ? 5 : 3.4) + by : wy + by;
        if (dive === 2) tipx = sx - s * 6.2;
        var mx = sx + (tipx - sx) * 0.55, my = Math.min(sy, tipy) - 2.4 + (tipy < sy ? -1 : 1.4);
        var pts = [[sx, sy - 1], [mx, my], [tipx, tipy], [tipx - s * 2.4, tipy + 3.6], [sx + (tipx - sx) * 0.55, (sy + tipy) / 2 + 4.8], [sx + (tipx - sx) * 0.3, sy + 4.2 + (tipy - sy) * 0.15], [sx, sy + 3.4]];
        if (dive) { pts = [[sx, sy - 1], [sx - s * 4.6, sy - 3.4 + by * 0], [tipx, tipy], [tipx + s * 1.4, tipy + 5], [sx - s * 5, sy + 2.4], [sx, sy + 3]]; }
        v.part(Pclosed(pts), far ? '#4a96d8' : ICE_M, { lw: 1.4, sh: far ? '#2a6ab0' : '#2a8fd8', hi: '#cfeeff', so: 0.8 });
        X.strokeStyle = ICE_D; X.lineWidth = 0.8; X.beginPath(); X.moveTo(sx, sy - 0.4); X.lineTo(tipx - s * 0.4, tipy + 0.4); X.moveTo(sx, sy); X.lineTo(pts[3][0], pts[3][1] - 0.6); X.moveTo(sx, sy + 1); X.lineTo(pts[4][0], pts[4][1] - 0.6); X.stroke();
        v.dot(tipx - s * 0.2, tipy, 0.8, '#ffffff');
      }
      wing(-1, true);
      // cuerpo indigo
      v.part(Pblob(12.2, 9.4 + by, 3.3, 3.9, 361, 0.04, 8, dive ? -0.5 : 0), '#4a3a9a', { lw: 1.4, sh: '#2a2060', hi: '#8a7ae0', so: 0.7 });
      v.part(Ppoly([[11.2, 9.6 + by], [12.2, 8 + by], [13.2, 9.6 + by], [12.2, 12.4 + by]]), ICE, { lw: 0.7, sh: ICE_M, so: 0.2 });
      // cabeza
      var hx = dive ? 15 : 14.8, hy = (dive ? 8.6 : 6.8) + by;
      v.part(Ppoly([[hx - 2.6, hy - 1.6], [hx - 2.8, hy - 5.2], [hx - 0.4, hy - 2.4]]), '#4a3a9a', { lw: 1, sh: '#2a2060', so: 0.2 });
      v.part(Ppoly([[hx + 0.2, hy - 2.4], [hx + 1.8, hy - 5.2], [hx + 2.4, hy - 1.6]]), '#4a3a9a', { lw: 1, sh: '#2a2060', so: 0.2 });
      v.part(Pblob(hx, hy, 3.3, 2.9, 362), '#5a4aaa', { lw: 1.3, sh: '#2a2060', hi: '#9a8af0', so: 0.7 });
      eye(v, hx + 1.2, hy - 0.4, 0.85, CY);
      var mo = o.mouth || 0;
      v.part(Pblob(hx + 2.6, hy + 1.4, 1.7, 0.7 + mo * 0.8, 363), '#7a1e2a', { lw: 0.5 });
      v.part(Ppoly([[hx + 1.4, hy + 1.2], [hx + 1.9, hy + 3.2 + mo], [hx + 2.4, hy + 1.2]]), IVO, { lw: 0.5, so: 0 });
      v.part(Ppoly([[hx + 3, hy + 1.2], [hx + 3.5, hy + 3 + mo], [hx + 3.9, hy + 1.2]]), IVO, { lw: 0.5, so: 0 });
      wing(1, false);
      // garras
      v.stick([[11.4, 12.6 + by], [10.8, 14.4 + by]], 1, '#2a2060', { lw: 0.7 }); v.stick([[13.4, 12.6 + by], [14.2, 14.4 + by]], 1, '#2a2060', { lw: 0.7 });
      if (o.lines) { v.line(0.4, 6 + by, 4.6, 6 + by, 0.7, 'rgba(207,238,255,0.9)'); v.line(0.2, 10 + by, 3.6, 10 + by, 0.7, 'rgba(207,238,255,0.7)'); }
    };
  }
  (function () {
    var F = [murci({ wy: 2.8 }), murci({ wy: 5, by: 0.5 }), murci({ wy: 12.4, by: 1.2 }), murci({ wy: 6.2, by: 0.5 }), murci({ dive: 1, mouth: 0.6, by: 1 }), murci({ dive: 2, mouth: 1, by: 1.4, lines: true })];
    var dieA = withDie(F, murci({ wy: 5 }), 24, 16, { lw: 1.4 });
    addV('enemy_tun_murcielago', 24, 16, F, { lw: 1.4 }, { flap: { f: [0, 1, 2, 3], fps: 14 }, idle: { f: [0, 1, 2, 3], fps: 12 }, fly: { f: [0, 1, 2, 3], fps: 14 }, walk: { f: [0, 1, 2, 3], fps: 14 }, dive: { f: [4, 5], fps: 10 }, die: dieA });
  })();

  // ======================================================================================================
  //  7. ESTALAGMITA VIVA 20x30 (sower) -- cono de hielo opaco con ojos ROJIZOS TENUES (la del jefe es azul liso y sin ojos)
  // ======================================================================================================
  function estal(o) {
    return function (v) {
      var X = v.ctx, st = o.st || 0, sh = o.shake || 0, wk0 = o.wake || 0, er = o.erupt, cr = o.crawl, tilt = o.tilt || 0;
      var BASE = '#6a8cb8', BS = '#3a5580', BHI = '#b4d0ec';
      if (er) { // puas que brotan alrededor
        [[-0.6, 22, 3.8, 0.5], [18, 20, 3.4, -0.5], [3, 15, 4.4, 0.2], [15.4, 13, 3.6, -0.2], [6.6, 9.6, 3.2, 0.1]].forEach(function (s, i) {
          if (er === 1 && i > 2) return;
          X.save(); X.translate(s[0] + 1, 27); X.rotate(s[3]);
          v.part(Ppoly([[-s[2] / 2, 0], [0, -s[1] + (er === 1 ? 4 : 0)], [s[2] / 2, 0]]), '#c9e2fa', { lw: 1.1, sh: '#7aa4d0', hi: '#ffffff', so: 0.4 }); X.restore();
        });
      }
      // grietas en el suelo (despertar)
      if (wk0 || er) { X.strokeStyle = OLC; X.lineWidth = 0.9; X.beginPath(); X.moveTo(1, 28.6); X.lineTo(4, 27.6); X.lineTo(2, 29.4); X.moveTo(19, 28.6); X.lineTo(16, 27.8); X.lineTo(18, 29.6); X.stroke(); }
      X.save(); X.translate(10 + sh, 28); X.rotate(tilt); X.translate(-10, -28);
      var topx = cr ? 8.4 : 10, pts = [[2.4, 28.4], [3.8, 21], [5.4, 13], [topx - 1, 5], [topx + 0.4, 1.4], [topx + 1.8, 6], [13.8, 13.6], [15.6, 21.2], [17.4, 28.4], [10, 29.6]];
      v.part(Pclosed(pts), BASE, { lw: 1.7, sh: BS, hi: BHI, so: 1.2 });
      v.part(Ppoly([[topx + 0.6, 2.4], [topx + 1.8, 6], [13.8, 13.6], [12, 13], [topx + 0.2, 7]]), BS, { lw: 0, so: 0 });
      // facetas
      X.strokeStyle = 'rgba(27,17,36,0.55)'; X.lineWidth = 0.7; X.beginPath(); X.moveTo(topx, 5); X.lineTo(7.6, 14); X.lineTo(5.6, 23); X.moveTo(7.6, 14); X.lineTo(12.4, 15); X.lineTo(14, 22.4); X.stroke();
      X.strokeStyle = 'rgba(207,238,255,0.8)'; X.lineWidth = 0.6; X.beginPath(); X.moveTo(topx - 0.4, 7); X.lineTo(6.4, 13); X.stroke();
      // fisuras brillantes cuando despierta
      if (wk0) { X.strokeStyle = 'rgba(255,120,100,' + (0.5 + wk0 * 0.3) + ')'; X.lineWidth = 0.8; X.beginPath(); X.moveTo(9, 17); X.lineTo(7.6, 20.6); X.lineTo(9, 24); X.moveTo(12, 17); X.lineTo(13, 21); X.stroke(); }
      // ojos rojizos tenues
      var ea = o.eyeA == null ? 0.55 : o.eyeA, ey = 15.6 + (cr ? 0.4 : 0), ex = cr ? 9.6 : 10.8;
      if (st === 1) { v.line(ex - 2.8, ey, ex - 1.2, ey + 0.2, 0.7, 'rgba(150,60,56,0.5)'); v.line(ex + 0.8, ey, ex + 2.4, ey + 0.2, 0.7, 'rgba(150,60,56,0.5)'); }
      else {
        X.globalAlpha = ea; v.dot(ex - 1.9, ey, 1.35, '#a8302c'); v.dot(ex + 1.7, ey, 1.35, '#a8302c'); X.globalAlpha = Math.min(1, ea + 0.2);
        v.dot(ex - 1.9, ey, 0.7, '#e8706a'); v.dot(ex + 1.7, ey, 0.7, '#e8706a'); X.globalAlpha = 1;
      }
      // boca-fisura
      if (er || wk0 > 0.5) v.part(Pblob(ex - 0.1, ey + 3.6, 1.8, er ? 1.2 : 0.7, 371), '#2a1020', { lw: 0.6 });
      else v.line(ex - 1.6, ey + 3.4, ex + 1.4, ey + 3.6, 0.7, 'rgba(27,17,36,0.8)');
      X.restore();
      if (cr) { // patitas de roca que arrastran
        var s = o.cs || 0; v.stick([[5.6, 27], [3.6 + s, 29.4]], 2.2, BS, { lw: 1 }); v.stick([[14.6, 27], [16.4 - s, 29.4]], 2.2, BS, { lw: 1 }); v.dot(0.6 + s, 29, 0.6, '#cfeeff'); v.dot(19 - s, 29.2, 0.5, '#cfeeff');
      }
    };
  }
  (function () {
    var F = [estal({ st: 1, eyeA: 0.4 }),                                    // 0 dormant
      estal({ wake: 0.5, shake: -0.4, eyeA: 0.7 }), estal({ wake: 1, shake: 0.5, eyeA: 0.9 }),    // 1-2 wake
      estal({ erupt: 1, wake: 1, eyeA: 1 }), estal({ erupt: 2, wake: 1, eyeA: 1, shake: 0.3 }),   // 3-4 erupt
      estal({ crawl: true, tilt: -0.07, cs: 0, eyeA: 0.8 }), estal({ crawl: true, tilt: 0.07, cs: 1.4, eyeA: 0.8 })]; // 5-6 crawl
    var dieA = withDie(F, estal({ st: 1 }), 20, 30, { lw: 1.7 });
    addV('enemy_tun_estalagmita', 20, 30, F, { lw: 1.7 }, { dormant: { f: [0], fps: 1 }, idle: { f: [0], fps: 1 }, wake: { f: [1, 2], fps: 8, loop: false }, erupt: { f: [3, 4], fps: 10, loop: false }, crawl: { f: [5, 6], fps: 4 }, walk: { f: [5, 6], fps: 4 }, die: dieA });
  })();

  // ======================================================================================================
  //  8. ESPIRITU DE NIEVE 22x28 (blinker) -- espectro de ventisca lila y blanco, sin piernas, con bufanda de nieve
  // ======================================================================================================
  function espiritu(o) {
    return function (v) {
      var X = v.ctx, by = o.by || 0, w = o.w || 0, al = o.al == null ? 0.88 : o.al, sl = o.slash;
      if (o.ring) { X.strokeStyle = 'rgba(220,210,255,0.95)'; X.lineWidth = 1.1; X.setLineDash([2.4, 1.6]); X.beginPath(); X.ellipse(11, 25.4, 8.8, 2.4, 0, 0, TAU); X.stroke(); X.setLineDash([]); }
      X.globalAlpha = al;
      // cola de remolino
      v.part(Pclosed([[7, 14 + by], [15, 14 + by], [14.4, 19 + by], [12.6, 22 + by + w], [10, 26.4 + by], [8.2, 22.4 + by - w], [6.4, 18.4 + by]]), '#cfc8ff', { lw: 1.4, sh: '#8e86d0', hi: '#ffffff', so: 0.9 });
      X.strokeStyle = 'rgba(255,255,255,0.9)'; X.lineWidth = 0.7; X.beginPath(); X.arc(10.6, 20.4 + by, 3, 0.2, 3.6); X.stroke(); X.beginPath(); X.arc(10.6, 22.8 + by, 1.7, 3.4, 6.4); X.stroke();
      // bufanda de nieve ondeando hacia atras
      v.part(Pclosed([[7.6, 11.2 + by], [3.4, 11 + by - w], [0.6, 13.6 + by + w], [3.4, 14.4 + by], [7.8, 14 + by]]), '#ffffff', { lw: 1.2, sh: '#c8c0f0', so: 0.5 });
      // brazos largos (garras)
      var aa = sl ? 1 : 0;
      v.stick([[7.6, 14.6 + by], [5.4, 17.6 + by + w], [5.2, 20.8 + by]], 1.9, '#bdb4f4', { lw: 1, curve: true });
      v.stick([[15, 14.4 + by], [aa ? 20 : 18.4, aa ? 11 + by : 17 + by], [aa ? 21.4 : 19, aa ? 7.6 + by : 20.6 + by]], 2, '#e0daff', { lw: 1, curve: true, hi: '#ffffff' });
      if (aa) { X.strokeStyle = '#ffffff'; X.lineWidth = 1.2; X.beginPath(); X.arc(16.4, 11 + by, 7.6, -1.1, 0.9); X.stroke(); X.strokeStyle = 'rgba(190,170,255,0.9)'; X.lineWidth = 0.8; X.beginPath(); X.arc(16.4, 11 + by, 9, -1.0, 0.8); X.stroke(); }
      // cabeza con capucha de ventisca y corona de cristal
      v.part(Pblob(11.4, 8 + by, 5.5, 5.5, 381, 0.03), '#e8e2ff', { lw: 1.5, sh: '#a9a0e6', hi: '#ffffff', so: 0.9 });
      v.part(Ppoly([[7.6, 4.2 + by], [8.4, 0.4 + by], [10.2, 3.2 + by]]), ICE, { lw: 0.9, sh: ICE_M, so: 0.2 });
      v.part(Ppoly([[10.4, 3.2 + by], [11.8, -0.4 + by], [13.2, 3.2 + by]]), '#cfeeff', { lw: 0.9, sh: ICE, so: 0.2 });
      v.part(Ppoly([[13.2, 3.4 + by], [15, 0.4 + by], [16, 4.6 + by]]), ICE, { lw: 0.9, sh: ICE_M, so: 0.2 });
      v.part(Pblob(12.6, 8.6 + by, 3.7, 3.3, 382), '#5a4a98', { lw: 0.9 });
      eye(v, 11.8, 8.2 + by, 0.95, CY); eye(v, 14.6, 8.2 + by, 0.95, CY);
      X.globalAlpha = 1;
      if (o.fadeSnow) snowDots(v, [[4, 6], [18, 5], [7, 22], [16, 24], [2, 17]], 0.8);
    };
  }
  (function () {
    var F = [espiritu({}), espiritu({ by: -1, w: 0.9 }),
      espiritu({ al: 0.42, ring: true, by: -0.4, w: 0.5, fadeSnow: true }), espiritu({ al: 0.16, ring: true, by: -1, w: 1, fadeSnow: true }),
      espiritu({ slash: false, by: 0.4, w: -0.8, al: 0.95 }), espiritu({ slash: true, by: -0.4, w: 1, al: 0.95 })];
    var dieA = withDie(F, espiritu({}), 22, 28, { lw: 1.4 }, { ash: false });
    addV('enemy_tun_espiritu', 22, 28, F, { lw: 1.4 }, { idle: { f: [0, 1], fps: 5 }, float: { f: [0, 1], fps: 5 }, walk: { f: [0, 1], fps: 5 }, fade: { f: [2, 3], fps: 10 }, slash: { f: [4, 5, 0], fps: 12 }, die: dieA });
  })();

  // ======================================================================================================
  //  9. CHAMAN DEL AULLIDO 26x30 (warlock) -- encorvado, capa de piel, mascara de craneo de lobo, runas violeta y baston de cristal
  // ======================================================================================================
  function chaman(o) {
    return function (v) {
      var X = v.ctx, by = o.by || 0, c = o.c || 0, hw = o.howl || 0, ha = o.hr || 0;
      // baston (derecha) con cristal cian
      var sx = 21.4 + (o.sx || 0), sy0 = 27, sy1 = 6 - hw * 3 + by;
      v.stick([[sx, sy0], [sx + 0.4, sy1 + 3]], 1.8, '#8a6a4a', { lw: 1.1, hi: '#c8a070' });
      v.part(Ppoly([[sx - 2.2, sy1 + 3.4], [sx - 0.4, sy1 - 3.6], [sx + 1.8, sy1 - 0.4], [sx + 2.4, sy1 + 3.4], [sx + 0.2, sy1 + 5]]), ICE, { lw: 1.1, sh: ICE_M, hi: '#ffffff', so: 0.5 });
      v.dot(sx + 0.2, sy1 + 0.8, 1, CY); if (hw) { X.strokeStyle = 'rgba(95,240,255,0.7)'; X.lineWidth = 0.8; X.beginPath(); X.arc(sx, sy1 + 1, 5, 0, TAU); X.stroke(); }
      // pies
      v.part(Prr(8.2 + c * 1.4, 26.6, 4.4, 2.6, 1), '#4a3a30', { lw: 1, sh: '#2a2018', so: 0.3 });
      v.part(Prr(13.6 - c * 1.4, 26.6, 4.4, 2.6, 1), '#4a3a30', { lw: 1, sh: '#2a2018', so: 0.3 });
      // capa de piel encorvada
      v.part(Pclosed([[6.4, 13.6 + by], [11, 10.4 + by], [16.4, 12 + by], [19, 18 + by], [19.8, 26.4], [13, 27.8], [5.4, 26.4], [5, 19 + by]]), '#7f9bc0', { lw: 1.7, sh: '#4a6890', hi: '#b8d0ec', so: 1.1 });
      // flecos de piel en el dobladillo
      v.part(Ppoly([[5.4, 25.2], [7, 28], [8.8, 25.8], [10.6, 28.4], [12.4, 26], [14.4, 28.4], [16, 25.8], [18, 28], [19.6, 25.2]]), FUR, { lw: 1, sh: FUR_S, so: 0.3 });
      // runas violeta (acento)
      X.strokeStyle = '#b070ff'; X.lineWidth = 0.9; X.beginPath(); X.moveTo(10, 17 + by); X.lineTo(12, 20 + by); X.lineTo(10, 23); X.moveTo(14.4, 17.4 + by); X.lineTo(14.4, 23); X.moveTo(14.4, 20 + by); X.lineTo(16.8, 18.4 + by); X.stroke();
      v.dot(12, 20 + by, 0.5, '#e0c4ff');
      // brazo con baston
      v.stick([[16, 14.4 + by], [18.8, 16.6 + by], [sx - 0.2, 17.6 - hw * 3 + by]], 2.4, '#5f7ca8', { lw: 1, curve: true });
      v.part(Pcirc(sx - 0.2, 17.6 - hw * 3 + by, 1.5), '#b8c8d8', { lw: 0.8, sh: '#8898a8', so: 0.2 });
      // cabeza: craneo de lobo
      X.save(); X.translate(11.6, 11 + by); X.rotate(ha);
      v.part(Pblob(-0.2, 0, 4.8, 4.5, 391, 0.03), '#4a6890', { lw: 1.3, so: 0 });
      v.part(Pblob(0.4, -0.6, 4.1, 4, 392, 0.03), IVO, { lw: 1.4, sh: IVO_S, hi: '#ffffff', so: 0.8 });
      var jaw = hw * 2.6;
      v.part(Pclosed([[2, 1.4], [7.4, 0.8], [9.4, 1.8], [8, 3 + jaw], [3.4, 3.4 + jaw]]), IVO, { lw: 1.2, sh: IVO_S, hi: '#ffffff', so: 0.4 });
      v.part(Pclosed([[2.6, -0.8], [7.2, -1.2], [10, 0.4], [8.2, 1.6], [3, 1.6]]), '#f6f0da', { lw: 1.2, sh: IVO_S, hi: '#ffffff', so: 0.4 });
      v.dot(9.6, -0.2, 0.9, '#1b1124');
      v.part(Ppoly([[4, 1.2], [4.6, 2.8], [5.2, 1.2]]), '#ffffff', { lw: 0.5, so: 0 }); v.part(Ppoly([[6.8, 1], [7.4, 2.4], [7.9, 1]]), '#ffffff', { lw: 0.5, so: 0 });
      v.part(Pblob(2.4, -1.2, 1.5, 1.4, 393), '#1b1124', { lw: 0.3 }); v.dot(2.6, -1.3, 0.8, CY);
      // orejas / cuernos de hueso
      v.part(Ppoly([[-3.2, -2.6], [-4.6, -7], [-0.8, -3.8]]), IVO, { lw: 1, sh: IVO_S, so: 0.3 });
      v.part(Ppoly([[-0.4, -3.8], [0.6, -8], [2.6, -3.4]]), IVO, { lw: 1, sh: IVO_S, so: 0.3 });
      X.restore();
      if (hw) { X.strokeStyle = 'rgba(176,112,255,0.9)'; X.lineWidth = 0.9; [0, 1].forEach(function (i) { X.beginPath(); X.arc(21 + i * 0.3, 2 + by, 2.6 + i * 2.2, -1.2, 0.4); X.stroke(); }); X.strokeStyle = 'rgba(176,112,255,0.9)'; [0, 1].forEach(function (i) { X.beginPath(); X.arc(2, 2 + by, 2.6 + i * 2.2, PI - 0.4, PI + 1.2); X.stroke(); }); }
    };
  }
  (function () {
    var F = [chaman({}), chaman({ by: 0.8 }), chaman({ c: 1, by: -0.4 }), chaman({ c: -1, by: 0.4 }),
      chaman({ howl: 0.6, hr: -0.5, by: -0.6, sx: 0.2 }), chaman({ howl: 1, hr: -0.95, by: -1.2, sx: 0.4 })];
    var dieA = withDie(F, chaman({}), 26, 30, { lw: 1.5 });
    addV('enemy_tun_chaman', 26, 30, F, { lw: 1.5 }, { idle: { f: [0, 1], fps: 3 }, walk: { f: [2, 3], fps: 5 }, howl: { f: [4, 5], fps: 5 }, die: dieA });
  })();

  // ======================================================================================================
  //  GUARDIANES (3:30 y 5:30): variantes de enemy_mini_bulwark (16 frames) y enemy_mini_hive (15 frames)
  // ======================================================================================================
  function gYeti(o) {
    return function (v) {
      var X = v.ctx, by = o.by || 0, c = o.c || 0, lean = o.lean || 0, FY = '#dfe8f2', au = o.au || 0, sl = o.slam || 0;
      // piernas
      v.part(Prr(7.4 + c, 26 + by * 0.4, 6.4, 5.2, 1.6), FUR_S, { lw: 1.4, sh: '#5a6a88', so: 0.4 });
      v.part(Prr(18.6 - c, 26 + by * 0.4, 6.4, 5.2, 1.6), FUR, { lw: 1.4, sh: FUR_S, so: 0.4 });
      X.save(); X.translate(16, 30); X.rotate(lean); X.translate(-16, -30);
      // brazo lejano
      v.stick([[6.4, 14 + by], [2.8, 19 - au * 6 + by], [3.6, 24 - au * 14 + sl * 3 + by]], 5.6, FUR_S, { lw: 1.4, curve: true });
      v.part(Pcirc(3.6, 24.4 - au * 14 + sl * 3 + by, 3), ICE_M, { lw: 1.2, sh: ICE_D, hi: ICE, so: 0.4 });
      // torso
      v.part(spikes(16, 18.6 + by, 12.4, 9.8, 10, 0.1, 401), FY, { lw: 1.8, sh: FUR_S, hi: FUR_H, so: 1.3 });
      // grietas cian del pecho
      X.strokeStyle = CY; X.lineWidth = 0.9; X.beginPath(); X.moveTo(13.4, 17 + by); X.lineTo(15.2, 20 + by); X.lineTo(14, 23 + by); X.moveTo(15.2, 20 + by); X.lineTo(18, 21.6 + by); X.stroke();
      // hombreras de hielo
      v.part(Ppoly([[3.4, 13.6 + by], [6, 8 + by], [10, 10.4 + by], [8.4, 15.4 + by]]), ICE, { lw: 1.4, sh: ICE_M, hi: '#ffffff', so: 0.6 });
      v.part(Ppoly([[21.4, 11 + by], [26, 7.4 + by], [28.4, 12.4 + by], [24, 15.4 + by]]), ICE, { lw: 1.4, sh: ICE_M, hi: '#ffffff', so: 0.6 });
      // cabeza
      var hy = 9.6 + by + (o.hy || 0);
      v.part(Ppoly([[11.4, hy - 2], [12.4, hy - 7.6], [14.2, hy - 3.6], [16, hy - 8.8], [17.8, hy - 3.6], [19.8, hy - 7.2], [20.6, hy - 1.6]]), ICE, { lw: 1.2, sh: ICE_M, hi: '#ffffff', so: 0.4 });
      v.part(spikes(16.4, hy + 0.4, 6.8, 5.6, 7, 0.12, 402), FY, { lw: 1.5, sh: FUR_S, hi: FUR_H, so: 0.9 });
      v.part(Pblob(17.8, hy + 1.2, 4.6, 3.8, 403), '#5a78b0', { lw: 1.1, sh: '#3a5488', hi: '#8aa8d8', so: 0.5 });
      v.part(Ppoly([[13.6, hy - 1.6], [21.6, hy - 1.2], [21.6, hy + 0.2], [14, hy - 0.2]]), ICE_DD, { lw: 0.7, so: 0 });
      eye(v, 16.4, hy + 0.6, 1, CY); eye(v, 19.8, hy + 0.8, 0.9, CY);
      var mo = o.mouth || 0;
      v.part(Pblob(18.2, hy + 3.4, 2.7, 0.9 + mo, 404), OLC, { lw: 0.4 });
      v.part(Ppoly([[16.2, hy + 2.8], [15.8, hy + 5.8 + mo], [17.6, hy + 3]]), IVO, { lw: 0.6, so: 0 });
      v.part(Ppoly([[19.4, hy + 3], [20.8, hy + 5.6 + mo], [21, hy + 2.6]]), IVO, { lw: 0.6, so: 0 });
      // brazo cercano con escudo de hielo
      var sx = 25.4 + (o.sx || 0), sy = 17.6 + by + (o.sy || 0) - au * 9;
      v.stick([[22, 13.6 + by], [25, 16 + by], [sx - 1, sy + 2]], 5.8, FUR, { lw: 1.4, curve: true, hi: FUR_H });
      if (!o.fist) plate(v, sx + 1.4, sy, { cracked: o.cr, prot: 0 });
      else v.part(Pcirc(sx + 1, sy + 1, 3.6 + (o.fistR || 0)), ICE, { lw: 1.4, sh: ICE_M, hi: '#ffffff', so: 0.6 });
      X.restore();
      if (sl) { snowDots(v, [[2, 30], [5, 28.6], [27, 30], [30, 28.4], [14, 31], [22, 31.2]], 0.9); v.line(0.6, 31, 7, 31, 0.8, 'rgba(232,238,245,0.9)'); v.line(25, 31, 31.4, 31, 0.8, 'rgba(232,238,245,0.9)'); }
      if (o.lines) { v.line(0.4, 12, 5, 12, 0.8, 'rgba(232,238,245,0.9)'); v.line(0.2, 18, 4.4, 18, 0.8, 'rgba(232,238,245,0.7)'); v.line(0.8, 24, 5, 24, 0.7, 'rgba(232,238,245,0.6)'); }
      if (o.breath) { X.fillStyle = 'rgba(232,242,255,0.85)'; [[27, 5, 1.6], [29.4, 3, 1.2]].forEach(function (b) { X.beginPath(); X.arc(b[0], b[1], b[2], 0, TAU); X.fill(); }); }
    };
  }
  (function () {
    var F = [gYeti({}), gYeti({ by: 0.8, mouth: 0.4 })], k;
    for (k = 0; k < 4; k++) { var q = wk(k); F.push(gYeti({ by: q.by * 0.8, c: q.c * 1.4 })); }
    F.push(gYeti({ lean: -0.1, sx: -3, sy: -5, hy: -0.6, mouth: 0.8, by: -0.4, fist: true }));               // 6 bash-wind
    F.push(gYeti({ lean: 0.15, sx: 2, sy: 1.6, hy: 1.4, mouth: 1, lines: true, by: 0.4 }));                    // 7 bash (onda de choque, el juego la dibuja)
    F.push(gYeti({ au: 0.95, hy: -1, mouth: 1, by: -1.4, fist: true, fistR: 0.6 }));                          // 8 stomp-wind (brazos arriba)
    F.push(gYeti({ slam: 1, lean: 0.08, hy: 1.6, mouth: 0.8, by: 1.2, fist: true, fistR: 0.8, au: 0, sy: 6 })); // 9 stomp (golpea el suelo)
    F.push(gYeti({ lean: 0.2, hy: 2.8, by: 1.4, mouth: 0.4, breath: true, sx: -2, sy: 3 }));                   // 10 rec
    var dieA = withDie(F, gYeti({}), 32, 32, { lw: 1.7 });
    addV('enemy_mini_yeti', 32, 32, F, { lw: 1.7 }, { idle: { f: [0, 1], fps: 3 }, walk: { f: WALKSEQ, fps: 6 }, bash: { f: [6, 7], fps: 8 }, stomp: { f: [8, 9], fps: 8 }, rec: { f: [10], fps: 1 }, die: dieA });
  })();

  function gVent(o) {
    return function (v) {
      var X = v.ctx, by = (o.by || 0) + 1.2, sw = o.sw || 0, sc = o.sc || 1, mo = o.mouth || 0, fl = o.flap || 0;
      X.save(); X.translate(16, 15 + by); X.scale(sc, sc); X.translate(-16, -15 - by);
      // carambanos colgantes (3)
      [[10.4, 4.6], [16, 7], [21.4, 4.8]].forEach(function (s, i) {
        var L = s[1] + (i === 1 ? 2 : 0) + (o.hang || 0);
        v.part(Ppoly([[s[0] - 2, 21 + by], [s[0] + sw * (i - 1) * 0.4, 21 + L + by], [s[0] + 2, 21 + by]]), '#cfeeff', { lw: 1.2, sh: ICE, hi: '#ffffff', so: 0.4 });
      });
      // falda de ventisca (rayas de nube)
      v.part(Pclosed([[4.4, 17 + by], [8, 22.4 + by], [16, 24 + by + sw * 0.3], [24, 22.4 + by], [27.6, 17 + by], [16, 20 + by]]), '#dfe8f6', { lw: 1.4, sh: '#9ab0d0', hi: '#ffffff', so: 0.8 });
      X.strokeStyle = 'rgba(120,150,200,0.8)'; X.lineWidth = 0.7; X.beginPath(); X.moveTo(7, 19.4 + by); X.quadraticCurveTo(10, 21.4 + by, 13, 20.4 + by); X.moveTo(18, 21 + by); X.quadraticCurveTo(22, 22 + by, 25, 19.6 + by); X.stroke();
      // brazos de hielo
      v.stick([[6.6, 14 + by], [3 - fl, 16 + by + sw * 0.4], [2 - fl, 12 + by - fl]], 2.6, ICE_M, { lw: 1.2, curve: true, hi: ICE });
      v.stick([[25.4, 14 + by], [29 + fl, 16 + by - sw * 0.4], [30 + fl, 12 + by - fl]], 2.6, ICE_M, { lw: 1.2, curve: true, hi: ICE });
      // cuerpo-copo
      v.part(Pblob(16, 13.4 + by, 9.4, 8.8, 411, 0.04, 10), '#eef4fc', { lw: 1.7, sh: '#a8bcdc', hi: '#ffffff', so: 1.2 });
      // corona de cristales
      [[9.4, 4.4, 6.2], [12.8, 3, 8.4], [16, 2.4, 9.6], [19.2, 3, 8.4], [22.6, 4.4, 6.2]].forEach(function (s, i) {
        v.part(Ppoly([[s[0] - 1.5, 7 + by], [s[0], 7 - s[2] + by - (o.crown || 0) * (i === 2 ? 2 : 1)], [s[0] + 1.5, 7 + by]]), i % 2 ? '#cfeeff' : ICE, { lw: 1, sh: ICE_M, hi: '#ffffff', so: 0.3 });
      });
      // cara enfadada
      v.part(Pblob(16, 13.4 + by, 6.6, 5.4, 412), '#2a4f8a', { lw: 0.9 });
      v.part(Ppoly([[10.4, 9.6 + by], [14.6, 11.6 + by], [14.6, 10.4 + by], [10.6, 8.6 + by]]), ICE_DD, { lw: 0.5, so: 0 });
      v.part(Ppoly([[21.6, 9.6 + by], [17.4, 11.6 + by], [17.4, 10.4 + by], [21.4, 8.6 + by]]), ICE_DD, { lw: 0.5, so: 0 });
      eye(v, 12.8, 12.4 + by, 1.3, CY); eye(v, 19.2, 12.4 + by, 1.3, CY);
      v.part(Pblob(16, 16.8 + by, 2.4 + mo * 0.8, 1 + mo * 1.8, 413), '#0f1a3a', { lw: 0.5 });
      if (mo > 0.5) { v.part(Ppoly([[15, 16 + by], [16, 20.4 + by], [17, 16 + by]]), '#ffffff', { lw: 0.7, so: 0 }); }
      X.restore();
      if (o.blow) { X.strokeStyle = 'rgba(255,255,255,0.95)'; X.lineWidth = 1; [[4, 6], [7, 28], [27, 6], [29, 26], [2, 19]].forEach(function (s, i) { X.beginPath(); X.moveTo(s[0], s[1]); X.quadraticCurveTo(s[0] + 3, s[1] - 2, s[0] + 6, s[1] + 0.4 * (i % 2 ? 1 : -1)); X.stroke(); }); }
      if (o.shot) { v.part(Ppoly([[19.4, 15.6 + by], [26, 16.6 + by], [19.4, 18 + by]]), '#cfeeff', { lw: 1, sh: ICE, so: 0.2 }); }
      if (o.burst) { X.fillStyle = '#ffffff'; X.strokeStyle = OLC; X.lineWidth = 1; for (var i = 0; i < 10; i++) { var a = i / 10 * TAU, r0 = 12, r1 = 15.4 + (i % 2) * 1.6; X.beginPath(); X.moveTo(16 + cos(a - 0.1) * r0, 15 + by + sin(a - 0.1) * r0); X.lineTo(16 + cos(a) * r1, 15 + by + sin(a) * r1); X.lineTo(16 + cos(a + 0.1) * r0, 15 + by + sin(a + 0.1) * r0); X.fill(); } }
    };
  }
  (function () {
    var F = [gVent({}), gVent({ by: -1, sw: 1 })], k;
    for (k = 0; k < 4; k++) F.push(gVent({ by: [-1.4, -0.4, 0.8, -0.2][k], sw: [1.2, 0.2, -1.2, -0.2][k], flap: k % 2 }));
    F.push(gVent({ mouth: 1, shot: true, by: -0.4, crown: 1 }));                       // 6 spit (carambano)
    F.push(gVent({ blow: true, mouth: 0.8, sw: 1.4, hang: 1.4, crown: 1 }));           // 7 acid = ventisca local
    F.push(gVent({ sc: 1.08, mouth: 0.6, by: -0.4, flap: 1.4, hang: 1 }));             // 8 swell
    F.push(gVent({ sc: 1.12, mouth: 1, burst: true, by: -0.6, flap: 2, crown: 1 }));   // 9 burst
    var dieA = withDie(F, gVent({}), 32, 32, { lw: 1.6 });
    addV('enemy_mini_ventisquero', 32, 32, F, { lw: 1.6 }, { idle: { f: [0, 1], fps: 3 }, float: { f: WALKSEQ, fps: 7 }, walk: { f: WALKSEQ, fps: 7 }, spit: { f: [6], fps: 1 }, acid: { f: [7], fps: 1 }, blizzard: { f: [7], fps: 1 }, swell: { f: [8, 9], fps: 8 }, die: dieA });
  })();

  // ======================================================================================================
  //  PROYECTILES Y VFX
  // ======================================================================================================
  function flake(X, cx, cy, r, col, lw, rot) {
    var i, j;
    X.save(); X.translate(cx, cy); X.rotate(rot || 0); X.lineCap = 'round';
    for (j = 0; j < 2; j++) {
      X.strokeStyle = j ? col : OLC; X.lineWidth = j ? lw : lw + 1.6; X.beginPath();
      for (i = 0; i < 6; i++) { var a = i * TAU / 6; X.moveTo(0, 0); X.lineTo(cos(a) * r, sin(a) * r); var bx = cos(a) * r * 0.6, by = sin(a) * r * 0.6; X.moveTo(bx, by); X.lineTo(bx + cos(a + 0.9) * r * 0.32, by + sin(a + 0.9) * r * 0.32); X.moveTo(bx, by); X.lineTo(bx + cos(a - 0.9) * r * 0.32, by + sin(a - 0.9) * r * 0.32); }
      X.stroke();
    }
    X.restore();
  }
  // flecha helada 16x6
  addV('proj_ice_arrow', 16, 6, [0, 1].map(function (k) {
    return function (v) {
      v.part(Ppoly([[1, 0.6], [4, 3], [1, 5.4], [2, 3]]), '#ffffff', { lw: 0.6, so: 0 });
      v.stick([[2.4, 3], [11.6, 3]], 1.2, '#bfe4ff', { lw: 0.8 });
      v.part(Ppoly([[10.4, 0.8], [15.2, 3], [10.4, 5.2]]), ICE, { lw: 0.9, sh: ICE_M, hi: '#ffffff', so: 0.3 });
      v.dot(k ? 12.4 : 4.6, 2.6, 0.5, '#ffffff');
    };
  }), { lw: 0.8 }, { loop: { f: [0, 1], fps: 10 } });
  // carambano 14x28 (cae hacia abajo, punta abajo)
  addV('proj_icicle', 14, 28, [0, 1].map(function (k) {
    return function (v) {
      v.part(Ppoly([[2.6, 3], [7, 1], [11.4, 3], [8.4, 18], [7, 26.4], [5.6, 18]]), '#cfeeff', { lw: 1.4, sh: ICE, hi: '#ffffff', so: 0.9 });
      v.part(Ppoly([[7, 2.6], [11, 3.2], [8.4, 18], [7, 25]]), ICE_M, { lw: 0, so: 0 });
      v.line(5, 5, 5.8, 15, 0.7, '#ffffff');
      v.dot(k ? 4.6 : 9.6, k ? 9 : 6, 0.7, '#ffffff'); if (k) v.line(2, 8, 3.4, 8, 0.6, '#ffffff');
    };
  }), { lw: 1.2 }, { loop: { f: [0, 1], fps: 8 } });
  // placa de hielo 24x28
  addV('fx_ice_slab', 24, 28, [0, 1].map(function (k) { return function (v) { plate(v, 12, 14, { cracked: k, drip: k ? 2 : 0 }); if (k) { v.dot(5, 25, 0.9, ICE); v.dot(19, 24, 0.8, '#cfeeff'); } }; }), { lw: 1.4 }, { idle: { f: [0], fps: 1 }, melt: { f: [0, 1], fps: 3, loop: false } });
  // remolino de nieve 36x36 (disco r~17 base)
  addV('fx_snow_whirl', 36, 36, [0, 1, 2, 3].map(function (k) {
    return function (v) {
      var X = v.ctx, i, j, R = 16.4;
      X.fillStyle = 'rgba(214,208,255,0.30)'; X.beginPath(); X.arc(18, 18, R, 0, TAU); X.fill();
      X.strokeStyle = 'rgba(27,17,36,0.85)'; X.lineWidth = 1.6; X.beginPath(); X.arc(18, 18, R, 0, TAU); X.stroke();
      X.strokeStyle = 'rgba(232,226,255,0.95)'; X.lineWidth = 0.8; X.beginPath(); X.arc(18, 18, R - 1.1, 0, TAU); X.stroke();
      for (j = 0; j < 2; j++) for (i = 0; i < 3; i++) {
        var a0 = k * 0.55 + i * TAU / 3; X.strokeStyle = j ? '#ffffff' : 'rgba(80,60,150,0.7)'; X.lineWidth = j ? 1.1 : 2.4; X.beginPath();
        for (var s = 0; s <= 14; s++) { var t = s / 14, a = a0 + t * 2.4, r = 3 + t * 11.6; X[s ? 'lineTo' : 'moveTo'](18 + cos(a) * r, 18 + sin(a) * r); }
        X.stroke();
      }
      for (i = 0; i < 6; i++) { var b = k * 0.9 + i * 1.1; v.dot(18 + cos(b) * (5 + (i * 3) % 9), 18 + sin(b) * (5 + (i * 3) % 9), 0.7, '#ffffff'); }
    };
  }), { lw: 0.8 }, { loop: { f: [0, 1, 2, 3], fps: 8 } });
  // grieta 96x24: 0 cerrada, 1 abriendose, 2 abierta (agua helada)
  addV('fx_ice_crack', 96, 24, [0, 1, 2].map(function (k) {
    return function (v) {
      var X = v.ctx, pts = [[4, 12], [16, 10], [28, 14], [40, 10.4], [54, 13.6], [68, 10.6], [80, 13], [92, 11.6]], i;
      function path() { X.beginPath(); pts.forEach(function (p, n) { X[n ? 'lineTo' : 'moveTo'](p[0], p[1] + (n % 2 ? 0.6 : -0.6) * k); }); }
      X.lineJoin = 'round'; X.lineCap = 'round';
      if (k === 2) {
        X.fillStyle = '#10346a'; X.strokeStyle = OLC; X.lineWidth = 2; X.beginPath(); X.moveTo(6, 12);
        for (i = 0; i < 8; i++) X.lineTo(pts[i][0], pts[i][1] - 4.4 - (i % 3)); X.lineTo(94, 12); for (i = 7; i >= 0; i--) X.lineTo(pts[i][0], pts[i][1] + 4.2 + (i % 2) * 1.4); X.closePath(); X.fill(); X.stroke();
        X.strokeStyle = 'rgba(159,216,255,0.8)'; X.lineWidth = 0.8; [[16, 10], [38, 13], [60, 11], [78, 13]].forEach(function (s) { X.beginPath(); X.ellipse(s[0], s[1], 5, 1.4, 0, 0, TAU); X.stroke(); });
        X.strokeStyle = '#cfeeff'; X.lineWidth = 0.9; X.beginPath(); X.moveTo(8, 8); for (i = 0; i < 8; i++) X.lineTo(pts[i][0], pts[i][1] - 4.8 - (i % 3)); X.stroke();
        return;
      }
      X.strokeStyle = 'rgba(207,238,255,0.85)'; X.lineWidth = 3.4 + k * 2.4; path(); X.stroke();
      X.strokeStyle = OLC; X.lineWidth = 2 + k * 2.2; path(); X.stroke();
      X.strokeStyle = k ? '#123a78' : '#0d1830'; X.lineWidth = 0.9 + k * 1.4; path(); X.stroke();
      X.strokeStyle = 'rgba(207,238,255,0.9)'; X.lineWidth = 0.6; X.beginPath(); X.moveTo(28, 14); X.lineTo(32, 19); X.moveTo(54, 13.6); X.lineTo(51, 7); X.moveTo(80, 13); X.lineTo(84, 18); X.stroke();
    };
  }), { lw: 0.8 }, { grow: { f: [0, 1, 2], fps: 3, loop: false }, closed: { f: [0], fps: 1 }, open: { f: [2], fps: 1 } });
  // pilar de hielo 26x52 (obstaculo; azul liso, SIN ojos): 0 entero, 1 agrietado, 2 escombro; base-centro en (13,48)
  addV('obs_ice_pillar', 26, 52, [0, 1, 2].map(function (k) {
    return function (v) {
      var X = v.ctx;
      v.part(Pblob(13, 47, 11.4, 3.6, 421, 0.04), '#dfe8f2', { lw: 1.4, sh: FUR_S, hi: '#ffffff', so: 0.6 });
      if (k === 2) {
        [[7, 43, 4.4, 3.4, 0], [14, 44.6, 5, 3.4, 1], [19, 42, 3.4, 3, 2], [11, 40, 3, 2.6, 3]].forEach(function (s, i) { v.part(Ppoly([[s[0] - s[2], s[1] + s[3]], [s[0] - s[2] * 0.3, s[1] - s[3]], [s[0] + s[2], s[1] + s[3] * 0.4], [s[0] + s[2] * 0.4, s[1] + s[3]]]), i % 2 ? ICE : '#cfeeff', { lw: 1.1, sh: ICE_M, hi: '#ffffff', so: 0.4 }); });
        return;
      }
      v.part(Pclosed([[4.4, 46], [5, 30], [7, 14], [10.4, 3.4], [13.4, 1], [16.4, 6], [19.4, 16], [21, 32], [21.4, 46], [13, 49]]), ICE, { lw: 1.8, sh: ICE_M, hi: '#ffffff', so: 1.4 });
      v.part(Ppoly([[13.4, 2], [16.4, 6], [19.4, 16], [21, 32], [21.4, 46], [15, 47], [14.4, 28], [13.6, 12]]), ICE_M, { lw: 0, so: 0 });
      v.part(Ppoly([[8.4, 14], [10.6, 5], [11.6, 30], [9, 41]]), '#cfeeff', { lw: 0, so: 0 });
      X.strokeStyle = '#ffffff'; X.lineWidth = 0.8; X.beginPath(); X.moveTo(8.6, 12); X.lineTo(7.6, 34); X.stroke();
      v.dot(11, 8, 0.8, '#ffffff'); v.dot(10, 20, 0.6, '#ffffff');
      if (k === 1) { X.strokeStyle = OLC; X.lineWidth = 1.1; X.beginPath(); X.moveTo(8, 20); X.lineTo(13, 25); X.lineTo(10.4, 30); X.lineTo(16, 36); X.lineTo(14, 42); X.moveTo(13, 25); X.lineTo(18.4, 22); X.stroke(); v.part(Ppoly([[16.4, 6], [19.4, 16], [17.4, 17], [15, 9]]), '#ffffff', { lw: 0.6, so: 0 }); }
    };
  }), { lw: 1.4 }, { idle: { f: [0], fps: 1 }, cracked: { f: [1], fps: 1 }, rubble: { f: [2], fps: 1 } });
  // hoguera 20x24: troncos + llama (4 frames)
  addV('fx_campfire', 20, 24, [0, 1, 2, 3].map(function (k) {
    return function (v) {
      var X = v.ctx, f = [0, 1.2, -0.8, 0.6][k], hh = [11, 13, 12, 13.6][k];
      [[3, 21.6, 0.3], [17, 21.6, -0.3]].forEach(function (s) { X.save(); X.translate(s[0] + 0, s[1]); X.rotate(s[2]); v.part(Prr(-1, -2.6, 11, 4.2, 1.6), '#7a4a2a', { lw: 1.2, sh: '#4a2a14', hi: '#b07848', so: 0.5 }); X.restore(); });
      v.part(Ppoly([[3, 21.4], [10, 17], [17, 21.4], [10, 22.6]]), '#5a3418', { lw: 1.2, so: 0 });
      [[2.2, 22.8], [17.8, 22.8], [10, 23.6]].forEach(function (s, i) { v.part(Pblob(s[0], s[1], 2.4, 1.3, 430 + i), '#9aa4b4', { lw: 1, sh: '#6a7488', hi: '#d0d8e4', so: 0.3 }); });
      v.part(Pclosed([[4.6, 18.6], [5, 12], [8, 8 - hh * 0.2 + 4], [10 + f, 21.6 - hh - 6 + 6], [12.6, 8], [15.4, 12.4], [15.6, 18.6], [10, 21]]), '#ff7a2a', { lw: 1.4, sh: '#d0401a', hi: '#ffb040', so: 0.8 });
      v.part(Pclosed([[7, 19], [7.4, 14], [10 + f * 0.6, 21 - hh - 3], [12.6, 14.4], [13, 19], [10, 20.4]]), '#ffc83d', { lw: 0, sh: '#ff9a2a', so: 0.5 });
      v.part(Pclosed([[8.6, 19.4], [10 + f * 0.3, 14.4 + (k % 2)], [11.6, 19.4], [10, 20.4]]), '#fff4c0', { lw: 0, so: 0 });
      v.dot(6 + k * 2.6, 6 + (k % 2) * 2, 0.6, '#ffc83d'); v.dot(14 - k * 1.6, 5 + k, 0.5, '#ff9a2a');
    };
  }), { lw: 1.2 }, { burn: { f: [0, 1, 2, 3], fps: 8 }, loop: { f: [0, 1, 2, 3], fps: 8 } });
  // loseta de ventisca 128x128 (tileable, 3 frames)
  addV('fx_blizzard_tile', 128, 128, [0, 1, 2].map(function (k) {
    return function (v) {
      var X = v.ctx, r = H.rrand(900 + k * 37), i;
      X.lineCap = 'round';
      for (i = 0; i < 46; i++) {
        var x0 = r() * 128, y0 = r() * 128, L = 8 + r() * 22, dx = L * 0.94, dy = L * 0.34, al = 0.25 + r() * 0.6, w = 0.7 + r() * 1.1;
        X.strokeStyle = 'rgba(255,255,255,' + al.toFixed(2) + ')'; X.lineWidth = w;
        for (var ox = -128; ox <= 128; ox += 128) for (var oy = -128; oy <= 128; oy += 128) { X.beginPath(); X.moveTo(x0 + ox, y0 + oy); X.lineTo(x0 + ox + dx, y0 + oy + dy); X.stroke(); }
      }
      for (i = 0; i < 22; i++) { var px = r() * 128, py = r() * 128; X.fillStyle = 'rgba(255,255,255,' + (0.4 + r() * 0.5).toFixed(2) + ')'; X.fillRect(px, py, 1.4, 1.4); }
    };
  }), { lw: 0 }, { loop: { f: [0, 1, 2], fps: 10 } });
  // bloque de hielo 22x22 (Alud): 0 entero, 1 agrietado, 2 derritiendose
  addV('fx_ice_block', 22, 22, [0, 1, 2].map(function (k) {
    return function (v) {
      var X = v.ctx, s = k === 2 ? 0.86 : 1;
      if (k === 2) v.part(Pblob(11, 19.4, 9.4, 2.4, 441), '#3a78c8', { lw: 1, sh: '#1b4a98', hi: '#7ac0f8', so: 0.4 });
      v.part(Ppoly([[3, 6 + (1 - s) * 8], [8, 2 + (1 - s) * 8], [18, 4 + (1 - s) * 8], [19.4, 17], [14, 20], [4, 18]]), '#cfeeff', { lw: 1.7, sh: ICE, hi: '#ffffff', so: 1 });
      v.part(Ppoly([[11, 8], [18, 4.4], [19.4, 17], [14, 20], [10.4, 17]]), ICE_M, { lw: 0, so: 0 });
      v.line(5, 8, 6, 15, 0.7, '#ffffff');
      if (k === 1) { X.strokeStyle = OLC; X.lineWidth = 1; X.beginPath(); X.moveTo(7, 4); X.lineTo(10, 10); X.lineTo(8, 14); X.lineTo(13, 19); X.moveTo(10, 10); X.lineTo(16, 12); X.stroke(); }
      if (k === 2) { v.dot(6, 20, 0.7, ICE); v.dot(16, 20.4, 0.6, '#cfeeff'); }
    };
  }), { lw: 1.3 }, { idle: { f: [0], fps: 1 }, melt: { f: [0, 1, 2], fps: 3, loop: false } });
  // estallido de hielo 48x48 (5 frames)
  addV('fx_ice_burst', 48, 48, [0, 1, 2, 3, 4].map(function (k) {
    return function (v) {
      var X = v.ctx, i, R = 5 + k * 3.7, al = 1 - k * 0.17;
      X.globalAlpha = Math.max(0.15, al);
      if (k < 2) { X.fillStyle = 'rgba(255,255,255,' + (0.85 - k * 0.4) + ')'; X.beginPath(); X.arc(24, 24, 9 - k * 2, 0, TAU); X.fill(); }
      for (i = 0; i < 9; i++) {
        var a = i / 9 * TAU + 0.3, r = R + (i % 3) * 2, sz = (3.6 - k * 0.35) * (1 + (i % 2) * 0.3), cx = 24 + cos(a) * r, cy = 24 + sin(a) * r;
        v.part(Ppoly([[cx + cos(a) * sz * 1.5, cy + sin(a) * sz * 1.5], [cx + cos(a + 2.2) * sz, cy + sin(a + 2.2) * sz], [cx + cos(a - 2.2) * sz, cy + sin(a - 2.2) * sz]]), i % 2 ? '#cfeeff' : ICE, { lw: 1.1, sh: ICE_M, hi: '#ffffff', so: 0.3 });
      }
      X.globalAlpha = 1;
    };
  }), { lw: 1 }, { burst: { f: [0, 1, 2, 3, 4], fps: 14, loop: false } });
  // estela de derrape 48x16 (apunta a la derecha; extremo derecho = donde esta el que patina), 3 frames
  addV('fx_skid_trail', 48, 16, [0, 1, 2].map(function (k) {
    return function (v) {
      var X = v.ctx, i; X.lineCap = 'round';
      [5.4, 10.4].forEach(function (y, j) {
        var L = 40 - k * 4, x0 = 2 + k * 4;
        X.strokeStyle = 'rgba(13,24,48,' + (0.75 - k * 0.15) + ')'; X.lineWidth = 2.2; X.beginPath(); X.moveTo(x0, y + (j ? 0.6 : -0.6)); X.lineTo(x0 + L, y); X.stroke();
        X.strokeStyle = 'rgba(232,242,255,' + (0.9 - k * 0.2) + ')'; X.lineWidth = 0.8; X.beginPath(); X.moveTo(x0 + 2, y + (j ? 0.1 : -1)); X.lineTo(x0 + L - 3, y - 0.9); X.stroke();
      });
      for (i = 0; i < 7; i++) v.dot(8 + i * 5.4 + k, 3 + (i * 5 % 11), 0.7 - k * 0.1, 'rgba(255,255,255,0.9)');
    };
  }), { lw: 0.8 }, { fade: { f: [0, 1, 2], fps: 6, loop: false } });
  // aliento de hielo 64x64 (nube, 4 frames, centrada)
  function puffCloud(v, k, n, col, edge) {
    var X = v.ctx, i, S = 32;
    for (i = 0; i < n; i++) {
      var a = i * 2.4 + 0.5, d = (4 + (i * 7 % 13)) * (0.6 + k * 0.28), r = (5 + (i % 3) * 2) * (0.7 + k * 0.2);
      v.part(Pcirc(S + cos(a) * d, S + sin(a) * d, r), col[i % col.length], { lw: 1.1, ol: edge, sh: '#8ccaf2', hi: '#ffffff', so: 1 });
    }
  }
  addV('fx_ice_breath', 64, 64, [0, 1, 2, 3].map(function (k) { return function (v) { v.ctx.globalAlpha = 1 - k * 0.2; puffCloud(v, k, 7, ['#e8f6ff', '#cfeeff', '#ffffff'], 'rgba(42,79,138,0.9)'); v.ctx.globalAlpha = 1; for (var i = 0; i < 4; i++) v.dot(32 + cos(i * 1.7 + k) * (12 + k * 5), 32 + sin(i * 1.7 + k) * (12 + k * 5), 0.8, '#ffffff'); }; }), { lw: 1 }, { puff: { f: [0, 1, 2, 3], fps: 10, loop: false }, loop: { f: [0, 1, 2, 3], fps: 10 } });
  // puff de nieve 32x32 (impacto/lance/embestida), 4 frames
  addV('fx_snow_puff', 32, 32, [0, 1, 2, 3].map(function (k) { return function (v) { v.ctx.globalAlpha = 1 - k * 0.22; var X = v.ctx, i; for (i = 0; i < 6; i++) { var a = i * 1.05 + 0.4, d = (2 + (i * 3 % 5)) * (0.7 + k * 0.5), r = (3.6 + (i % 2)) * (0.8 + k * 0.18); v.part(Pcirc(16 + cos(a) * d, 18 + sin(a) * d * 0.7, r), i % 2 ? '#ffffff' : '#e8eef5', { lw: 1, ol: 'rgba(60,90,140,0.85)', sh: '#b4c4dc', so: 0.6 }); } X.globalAlpha = 1; }; }), { lw: 1 }, { puff: { f: [0, 1, 2, 3], fps: 12, loop: false } });
  // hielo roto 48x32 y charco de nieve 48x32 (suelo, 3 frames)
  addV('fx_ice_debris', 48, 32, [0, 1, 2].map(function (k) {
    return function (v) {
      [[10, 20, 5], [20, 12, 4], [30, 21, 5.4], [38, 14, 3.6], [24, 24, 3.4], [14, 11, 2.6], [41, 24, 3]].forEach(function (s, i) {
        var a = i * 1.3 + k * 0.5;
        v.part(Ppoly([[s[0] + cos(a) * s[2], s[1] + sin(a) * s[2] * 0.6], [s[0] + cos(a + 2.1) * s[2] * 0.8, s[1] + sin(a + 2.1) * s[2] * 0.5], [s[0] + cos(a + 4.2) * s[2], s[1] + sin(a + 4.2) * s[2] * 0.6]]), i % 2 ? '#cfeeff' : ICE, { lw: 1.1, sh: ICE_M, hi: '#ffffff', so: 0.4 });
      });
      v.dot(18 + k * 5, 16, 0.6, '#ffffff');
    };
  }), { lw: 1 }, { glint: { f: [0, 1, 2], fps: 3 } });
  addV('fx_snow_pool', 48, 32, [0, 1, 2].map(function (k) {
    return function (v) {
      v.part(Pblob(24, 17, 20, 9.4, 450 + k, 0.1, 12), '#f4f8fc', { lw: 1.5, sh: '#b4c8e0', hi: '#ffffff', so: 1 });
      v.part(Pblob(24, 18, 12, 4.8, 455 + k, 0.1, 9), '#dce8f6', { lw: 0, so: 0 });
      for (var i = 0; i < 9; i++) v.dot(8 + (i * 7 + k * 5) % 32, 11 + (i * 5 + k * 3) % 13, 0.7, i % 2 ? '#8fa4bf' : '#ffffff');
    };
  }), { lw: 1 }, { idle: { f: [0, 1, 2], fps: 2 } });
  // decoracion (6): base 28x28 anclaje base-centro (14,26)
  addV('decor_tundra', 28, 28, [
    function (v) { [[9, 25, 9, 0.2], [15, 25, 13, 0], [20, 25, 8, -0.25]].forEach(function (s) { v.ctx.save(); v.ctx.translate(s[0], s[1]); v.ctx.rotate(s[3]); v.part(Ppoly([[-3, 0], [-0.8, -s[2]], [3, 0]]), '#cfeeff', { lw: 1.3, sh: ICE, hi: '#ffffff', so: 0.6 }); v.ctx.restore(); }); },
    function (v) { v.part(Pblob(14, 25, 11, 2.6, 461), SNOW, { lw: 1.2, sh: FUR_S, so: 0.4 }); [[8, 24, 7.4], [14, 24, 12], [20, 24, 6]].forEach(function (s) { v.part(Ppoly([[s[0] - 3.2, s[1]], [s[0] - 0.4, s[1] - s[2]], [s[0] + 3.4, s[1]]]), '#6a8cb8', { lw: 1.4, sh: '#3a5580', hi: '#b4d0ec', so: 0.7 }); }); },
    function (v) { v.part(Pblob(14, 22, 12.4, 5.6, 462, 0.07), SNOW, { lw: 1.5, sh: '#b4c8e0', hi: '#ffffff', so: 1 }); snowDots(v, [[8, 22], [12, 19], [17, 21], [20, 23], [14, 24]], 0.6); v.dot(10, 20, 0.5, '#8fa4bf'); },
    function (v) { v.part(Pblob(14, 23, 10, 4, 463, 0.07), SNOW, { lw: 1.4, sh: '#b4c8e0', hi: '#ffffff', so: 0.9 }); [[9, 23, -0.4], [13, 23, 0.1], [18, 23, 0.5]].forEach(function (s) { v.stick([[s[0], s[1]], [s[0] + s[2] * 4, s[1] - 7]], 1.2, '#8a9a6a', { lw: 0.8 }); v.dot(s[0] + s[2] * 4, s[1] - 7.4, 0.8, '#ffffff'); }); },
    function (v) { v.part(Pblob(14, 21.4, 9.4, 6, 464, 0.1, 8), '#7a8aa8', { lw: 1.6, sh: '#4a5878', hi: '#b4c0d8', so: 1 }); v.part(Pblob(13, 17, 8.4, 3.4, 465, 0.08), '#ffffff', { lw: 1.2, sh: '#c8d8ec', so: 0.5 }); v.part(Pblob(14, 25, 11, 2.2, 466), SNOW, { lw: 1, sh: FUR_S, so: 0.3 }); },
    function (v) { v.part(Pblob(14, 25, 8, 2.4, 467), SNOW, { lw: 1.1, sh: FUR_S, so: 0.3 }); v.stick([[14, 25], [13, 17], [16, 9]], 1.8, '#5a4a40', { lw: 1, curve: true }); v.stick([[13.2, 17], [8, 13]], 1.2, '#5a4a40', { lw: 0.8 }); v.stick([[14.8, 12.4], [19, 8]], 1.2, '#5a4a40', { lw: 0.8 }); snowDots(v, [[16, 8.4], [8.2, 12.6], [13.4, 16.6]], 0.8); }
  ], { lw: 1.2 }, null);
  // icono de Frio (copo) 12x12, 2 frames
  addV('icon_frio', 12, 12, [0, 1].map(function (k) { return function (v) { flake(v.ctx, 6, 6, 4.6, k ? '#ffffff' : '#bfe8ff', 1.1, k ? 0.26 : 0); if (k) v.dot(6, 6, 1.2, CY); }; }), { lw: 0.8 }, { loop: { f: [0, 1], fps: 2 } });

  // ======================================================================================================
  //  TERRENO: tile_ice (6), tile_snow_patch (3), nieblas
  // ======================================================================================================
  // losetas SIN COSTURAS: todo trazo se dibuja con envoltura (+-32)
  function wrapDo(fn) { for (var ox = -32; ox <= 32; ox += 32) for (var oy = -32; oy <= 32; oy += 32) fn(ox, oy); }
  addV('tile_ice', 32, 32, [0, 1, 2, 3, 4, 5].map(function (k) {
    return function (v) {
      var X = v.ctx, r = H.rrand(1200 + k * 17), i;
      X.fillStyle = '#2a4f8a'; X.fillRect(0, 0, 32, 32);
      // manchas de tono (hielo mas claro / mas hondo)
      for (i = 0; i < 4; i++) { var bx = r() * 32, by = r() * 32, br = 6 + r() * 8, col = r() < 0.5 ? 'rgba(70,130,210,0.16)' : 'rgba(20,50,110,0.16)'; wrapDo(function (ox, oy) { X.fillStyle = col; X.beginPath(); X.ellipse(bx + ox, by + oy, br, br * 0.6, 0.5, 0, TAU); X.fill(); }); }
      // diagonales brillantes (patron del HIELO)
      var n = 2 + (k % 3);
      for (i = 0; i < n; i++) {
        var sx = r() * 32, sy = r() * 32, L = 6 + r() * 10, al = 0.22 + r() * 0.26;
        wrapDo(function (ox, oy) { X.strokeStyle = 'rgba(159,216,255,' + al.toFixed(2) + ')'; X.lineWidth = 1.1; X.beginPath(); X.moveTo(sx + ox, sy + oy); X.lineTo(sx + ox + L, sy + oy - L); X.stroke(); X.strokeStyle = 'rgba(255,255,255,' + (al * 0.8).toFixed(2) + ')'; X.lineWidth = 0.5; X.beginPath(); X.moveTo(sx + ox + 1, sy + oy - 1); X.lineTo(sx + ox + L * 0.6, sy + oy - L * 0.6); X.stroke(); });
      }
      // grietas finas oscuras
      if (k % 2) { var cx = r() * 32, cy = r() * 32; wrapDo(function (ox, oy) { X.strokeStyle = 'rgba(14,34,80,0.7)'; X.lineWidth = 0.7; X.beginPath(); X.moveTo(cx + ox, cy + oy); X.lineTo(cx + ox + 5, cy + oy + 3); X.lineTo(cx + ox + 7, cy + oy + 8); X.stroke(); }); }
      for (i = 0; i < 3; i++) { var dx = r() * 32, dy = r() * 32; wrapDo(function (ox, oy) { X.fillStyle = 'rgba(207,238,255,0.8)'; X.fillRect(dx + ox, dy + oy, 0.9, 0.9); }); }
    };
  }), { lw: 0 }, { idle: { f: [0], fps: 1 } });
  addV('tile_snow_patch', 32, 32, [0, 1, 2].map(function (k) {
    return function (v) {
      var X = v.ctx, r = H.rrand(1300 + k * 29), i;
      X.fillStyle = '#e8eef5'; X.fillRect(0, 0, 32, 32);
      for (i = 0; i < 3; i++) { var bx = r() * 32, by = r() * 32, br = 5 + r() * 7; wrapDo(function (ox, oy) { X.fillStyle = 'rgba(180,200,225,0.35)'; X.beginPath(); X.ellipse(bx + ox, by + oy, br, br * 0.55, 0, 0, TAU); X.fill(); }); }
      // PUNTOS (patron de la NIEVE firme: se distingue por patron, no solo por color)
      for (i = 0; i < 26; i++) { var px = r() * 32, py = r() * 32, big = r() < 0.4, dc = r() < 0.55 ? '#8fa4bf' : '#ffffff'; wrapDo(function (ox, oy) { X.fillStyle = dc; X.beginPath(); X.arc(px + ox, py + oy, big ? 1.1 : 0.7, 0, TAU); X.fill(); }); }
    };
  }), { lw: 0 }, { idle: { f: [0], fps: 1 } });
  [0, 1].forEach(function (n) {
    addV('tun_fog' + n, 48, 24, [function (v) {
      var X = v.ctx, r = H.rrand(1400 + n), i;
      for (i = 0; i < 9; i++) { var cx = 6 + r() * 36, cy = 6 + r() * 12, R = 8 + r() * 9, g = X.createRadialGradient(cx, cy, 0, cx, cy, R); g.addColorStop(0, 'rgba(225,238,255,0.5)'); g.addColorStop(1, 'rgba(225,238,255,0)'); X.fillStyle = g; X.fillRect(cx - R, cy - R, R * 2, R * 2); }
    }], { lw: 0 }, null);
  });

  // ======================================================================================================
  //  OVERRIDES de bioma 'tundra' (Assets.setBiome('tundra')): mismos nombres que usan decorate/drawFog/etc.
  // ======================================================================================================
  var OV = {}, TUN = false;
  function ovEntry(name, canvases, w, h) { return { name: name, w: w, h: h, frames: canvases, anims: null }; }
  function cloneSized(src, w, h) { var c = mkCanvas(w, h), x = c.getContext('2d'); x.imageSmoothingEnabled = false; x.drawImage(src, 0, 0, w, h); return c; }
  (function () {
    var i, d = function (k) { return A.sprite('decor_tundra', k); };
    for (i = 0; i < 10; i++) OV['ground' + i] = ovEntry('ground' + i, [cloneSized(A.sprite('tile_ice', i % 6), 32, 32)], 32, 32);
    [4, 1, 0].forEach(function (k, j) { OV['rock' + j] = ovEntry('rock' + j, [d(k)], 56, 56); });
    [2, 3, 5].forEach(function (k, j) { OV['grass' + j] = ovEntry('grass' + j, [d(k)], 56, 56); });
    OV.mushroom = ovEntry('mushroom', [d(0)], 56, 56);
    OV.bush0 = ovEntry('bush0', [d(2)], 56, 56); OV.bush1 = ovEntry('bush1', [d(3)], 56, 56);
    [5, 4, 0].forEach(function (k, j) { OV['bones' + j] = ovEntry('bones' + j, [d(k)], 56, 56); });
    OV.stump0 = ovEntry('stump0', [d(1)], 56, 56); OV.stump1 = ovEntry('stump1', [d(4)], 56, 56); OV.grave = OV.stump1;
    for (i = 0; i < 4; i++) OV['rune' + i] = ovEntry('rune' + i, [mkCanvas(2, 2)], 2, 2);
    OV.column = ovEntry('column', [A.sprite('obs_ice_pillar', 0)], 52, 104);
    OV.edge0 = ovEntry('edge0', [d(1)], 56, 56); OV.edge1 = ovEntry('edge1', [d(0)], 56, 56);
    OV.torch = ovEntry('torch', [A.sprite('fx_campfire', 0)], 40, 48);
    OV.fog0 = ovEntry('fog0', [A.sprite('tun_fog0', 0)], 96, 48); OV.fog1 = ovEntry('fog1', [A.sprite('tun_fog1', 0)], 96, 48);
  })();
  function pick(e, name, f) {
    if (typeof f === 'string') { var p = f.split(':'), an = e.anims && e.anims[p[0]]; if (!an) throw new Error('Assets: animacion desconocida "' + f + '" en ' + name); return e.frames[an.f[((parseInt(p[1], 10) || 0) % an.f.length + an.f.length) % an.f.length]]; }
    return e.frames[((f | 0) % e.frames.length + e.frames.length) % e.frames.length];
  }
  var o_sprite = A.sprite, o_frames = A.frames, o_info = A.info, o_anim = A.animFrame, o_has = A.hasAnim, o_set = A.setBiome, o_get = A.getBiome, o_biomes = A.biomes, o_binfo = A.biomeInfo;
  var o_vig = A.vignette, o_ff = A.drawFireflies, o_rg = A.drawRitualGlow, o_dec = A.decorate, o_arena = A.arena, o_ph = A.addToPhaser;
  A.sprite = function (n, f) { var e = TUN && OV[n]; return e ? pick(e, n, f || 0) : o_sprite(n, f); };
  A.frames = function (n) { var e = TUN && OV[n]; return e ? e.frames.length : o_frames(n); };
  A.info = function (n) { var e = TUN && OV[n]; return e ? { name: n, w: e.w, h: e.h, frames: e.frames.length, anims: e.anims } : o_info(n); };
  A.animFrame = function (n, an, t) { return TUN && OV[n] ? OV[n].frames[0] : o_anim(n, an, t); };
  A.hasAnim = function (n, an) { return TUN && OV[n] ? false : o_has(n, an); };
  A.setBiome = function (name) { if (name === 'tundra') { TUN = true; return o_set('asfodelo'); } TUN = false; return o_set(name); };
  A.getBiome = function () { return TUN ? 'tundra' : o_get(); };
  A.biomes = function () { return o_biomes().concat(['tundra']); };
  A.biomeInfo = function (name) {
    if (name === 'tundra' || (!name && TUN)) return { name: 'tundra', label: 'Tundra: hielo, ventisca y Frio', bg: '#0b1530', decor: ['decor_tundra', 'obs_ice_pillar', 'fx_campfire'], tiles: 10, snow: '#e8eef5', ice: '#2a4f8a' };
    return o_binfo(name);
  };
  A.vignette = function (w, h, o) { if (TUN && !(o && o.tint)) { o = Object.assign({}, o, { tint: '6,18,46' }); } return o_vig(w, h, o); };
  A.drawFireflies = function (c, w, h, t, o) { if (TUN) A.drawSnowfall(c, w, h, t, o); else o_ff(c, w, h, t, o); };
  A.drawRitualGlow = function (c, x, y, t, r) { if (!TUN) o_rg(c, x, y, t, r); };
  A.addToPhaser = function (tex) {
    o_ph(tex);
    Object.keys(OV).forEach(function (n) { OV[n].frames.forEach(function (c, i) { var k = n + '@tundra:' + i; if (tex.exists(k)) tex.remove(k); tex.addCanvas(k, c); if (TUN) { var k2 = n + ':' + i; if (tex.exists(k2)) tex.remove(k2); tex.addCanvas(k2, c); } }); });
  };
  A.decorate = function (g, w, h, o) {
    if (!TUN) return o_dec(g, w, h, o);
    o = o || {}; var rr = H.rrand(o.seed || 4242), wall = o.wall == null ? 28 : o.wall, avoid = o.avoid || [{ x: w / 2, y: h / 2, r: 150 }], n = Math.round(60 * (o.density == null ? 1 : o.density)), items = [], i, k;
    for (i = 0; i < n * 4 && items.length < n; i++) {
      var px = wall + 20 + rr() * (w - 2 * wall - 40), py = wall + 20 + rr() * (h - 2 * wall - 40), bad = false;
      for (k = 0; k < avoid.length; k++) if (Math.hypot(px - avoid[k].x, py - avoid[k].y) < avoid[k].r) bad = true;
      if (!bad) items.push({ k: (rr() * 6) | 0, x: px, y: py });
    }
    items.sort(function (a, b) { return a.y - b.y; });
    items.forEach(function (it) { var s = A.sprite('decor_tundra', it.k), sh = o_sprite('shadow'); g.globalAlpha = 0.35; g.drawImage(sh, it.x - sh.width / 2, it.y - sh.height / 2 - 2); g.globalAlpha = 1; g.drawImage(s, Math.round(it.x - s.width / 2), Math.round(it.y - s.height * 0.93)); });
    return { torches: [], items: items.length };
  };

  // ======================================================================================================
  //  ARENA 'tundra'  (B.1.1): hielo negro con brillos, 5 parches de nieve firme (puntos), grietas, estalagmitas decorativas
  // ======================================================================================================
  var SNOW_SPOTS = [[270, 200], [1170, 200], [720, 405], [270, 610], [1170, 610]];
  var PILLAR_SPOTS = [[480, 280], [960, 280], [480, 530], [960, 530], [720, 240], [720, 570], [300, 405], [1140, 405]];
  var CRACK_SPOTS = [[495, 405, 200, -0.2], [945, 405, 210, 0.25], [720, 300, 180, 1.2], [720, 520, 190, -1.1], [720, 90, 240, 0.0]];
  function tundraArena(w, h, o) {
    o = o || {};
    var s = w / 1440, rr = H.rrand(o.seed || 777), wall = o.wall == null ? 28 : o.wall, cx = w / 2, cy = h / 2, i, j;
    var c = mkCanvas(w, h), x = c.getContext('2d'), snowR = (o.snowR || 110) * s;
    function R(a, b) { return a + rr() * (b - a); }
    x.lineJoin = 'round'; x.lineCap = 'round';
    // exterior: noche azul con ventisca lejana
    var g = x.createLinearGradient(0, 0, 0, h); g.addColorStop(0, '#0e1c40'); g.addColorStop(1, '#050b1f'); x.fillStyle = g; x.fillRect(0, 0, w, h);
    for (i = 0; i < 260; i++) { x.strokeStyle = 'rgba(' + (i % 3 ? '120,160,220' : '200,225,255') + ',' + R(0.05, 0.16).toFixed(2) + ')'; x.lineWidth = R(1, 3); var sx = R(0, w), sy = R(0, h), L = R(20, 70); x.beginPath(); x.moveTo(sx, sy); x.lineTo(sx + L * 0.94, sy + L * 0.34); x.stroke(); }
    // plataforma (superelipse)
    var rx = w / 2 - 30 * s - 4, ry = h / 2 - 30 * s - 4, pts = [];
    for (i = 0; i < 140; i++) { var a = i / 140 * TAU, ca = cos(a), sa = sin(a), q = 1 + 0.012 * sin(5 * a + 1) + 0.008 * sin(11 * a); pts.push([cx + (ca < 0 ? -1 : 1) * Math.pow(Math.abs(ca), 0.4) * rx * q, cy + (sa < 0 ? -1 : 1) * Math.pow(Math.abs(sa), 0.4) * ry * q]); }
    function plat(cc) { cc.moveTo(pts[0][0], pts[0][1]); for (var n = 1; n < pts.length; n++) cc.lineTo(pts[n][0], pts[n][1]); cc.closePath(); }
    x.save(); x.translate(0, 20); x.fillStyle = '#1b4a88'; x.strokeStyle = '#0a1430'; x.lineWidth = 12; x.beginPath(); plat(x); x.stroke(); x.fill(); x.restore(); // cara del acantilado
    x.save(); x.translate(0, 20); x.strokeStyle = 'rgba(159,216,255,0.25)'; x.lineWidth = 2; for (i = 0; i < 70; i++) { var q2 = pts[(rr() * pts.length) | 0]; x.beginPath(); x.moveTo(q2[0], q2[1]); x.lineTo(q2[0] + R(-3, 3), q2[1] + R(8, 16)); x.stroke(); } x.restore();
    x.fillStyle = '#0a1430'; x.strokeStyle = '#0a1430'; x.lineWidth = 16; x.beginPath(); plat(x); x.stroke(); x.fill();
    x.save(); x.beginPath(); plat(x); x.clip();
    x.fillStyle = '#2a4f8a'; x.fillRect(0, 0, w, h);
    var tile = A.sprite('tile_ice', 0), TS = tile.width; x.imageSmoothingEnabled = false;
    for (j = 0; j < h; j += TS) for (i = 0; i < w; i += TS) x.drawImage(A.sprite('tile_ice', (rr() * 6) | 0), i, j);
    x.imageSmoothingEnabled = true;
    // reflejos: bandas diagonales claras y brillo ancho
    for (i = 0; i < 16; i++) { var bx0 = R(-200, w), bw = R(14, 60); x.strokeStyle = 'rgba(159,216,255,' + R(0.05, 0.12).toFixed(2) + ')'; x.lineWidth = bw; x.beginPath(); x.moveTo(bx0, h + 40); x.lineTo(bx0 + h * 0.9, -40); x.stroke(); }
    var gl = x.createRadialGradient(cx * 0.8, cy * 0.7, 20, cx * 0.8, cy * 0.7, w * 0.5); gl.addColorStop(0, 'rgba(159,216,255,0.18)'); gl.addColorStop(1, 'rgba(159,216,255,0)'); x.fillStyle = gl; x.fillRect(0, 0, w, h);
    // grietas finas del suelo
    for (i = 0; i < 22; i++) { var px = R(40, w - 40), py = R(40, h - 40); x.strokeStyle = 'rgba(8,20,52,0.55)'; x.lineWidth = 1.6; x.beginPath(); x.moveTo(px, py); for (j = 0; j < 5; j++) { px += R(-18, 22); py += R(-12, 16); x.lineTo(px, py); } x.stroke(); x.strokeStyle = 'rgba(207,238,255,0.35)'; x.lineWidth = 0.8; x.save(); x.translate(-1, -1); x.stroke(); x.restore(); }
    // grietas largas (fisuras; seguras de cruzar)
    var cracks = [];
    CRACK_SPOTS.forEach(function (cs) {
      var len = cs[2] * s, cr = A.sprite('fx_ice_crack', 0), sc = len / cr.width, ccx = cs[0] * s, ccy = cs[1] * s;
      x.save(); x.translate(ccx, ccy); x.rotate(cs[3]); x.drawImage(cr, -len / 2, -cr.height * sc * 0.8, len, cr.height * sc * 1.6); x.restore(); cracks.push({ x: ccx, y: ccy, len: len, a: cs[3] });
    });
    // parches de NIEVE FIRME: halo de transicion punteado + disco crema con puntos y borde festoneado
    var snow = [], fires = [];
    var snowTile = A.sprite('tile_snow_patch', 0);
    SNOW_SPOTS.forEach(function (sp, n) {
      var sx = sp[0] * s, sy = sp[1] * s, T = 24 * s, k, m;
      // sombra/pie del parche (realza que es suelo distinto)
      x.fillStyle = 'rgba(8,20,52,0.35)'; x.beginPath(); x.ellipse(sx, sy + 5, snowR + T * 0.7, snowR * 0.96 + T * 0.7, 0, 0, TAU); x.fill();
      // transicion de 24 px: puntos de nieve que se aclaran hacia el hielo
      var gT = x.createRadialGradient(sx, sy, snowR * 0.9, sx, sy, snowR + T); gT.addColorStop(0, 'rgba(232,238,245,0.3)'); gT.addColorStop(1, 'rgba(232,238,245,0)'); x.fillStyle = gT; x.beginPath(); x.arc(sx, sy, snowR + T, 0, TAU); x.fill();
      for (k = 0; k < 260 * s * s + 120; k++) { var ang = R(0, TAU), rad = snowR + R(0, T) * R(0.2, 1), dens = 1 - (rad - snowR) / T; if (rr() > dens * 0.9) continue; x.fillStyle = rr() < 0.7 ? '#e8eef5' : '#ffffff'; x.beginPath(); x.arc(sx + cos(ang) * rad, sy + sin(ang) * rad * 0.97, R(0.8, 2.2), 0, TAU); x.fill(); }
      // disco con borde festoneado
      var bp = []; for (k = 0; k < 40; k++) { var aa = k / 40 * TAU, rb = snowR * (1 + 0.035 * sin(k * 2.1 + n) + (k % 2 ? 0.025 : -0.01)); bp.push([sx + cos(aa) * rb, sy + sin(aa) * rb * 0.97]); }
      function discP(cc) { cc.moveTo(bp[0][0], bp[0][1]); for (var z = 1; z < bp.length; z++) cc.lineTo(bp[z][0], bp[z][1]); cc.closePath(); }
      x.strokeStyle = '#8fa4bf'; x.lineWidth = 5; x.beginPath(); discP(x); x.stroke();
      x.fillStyle = '#e8eef5'; x.beginPath(); discP(x); x.fill();
      x.save(); x.beginPath(); discP(x); x.clip(); x.imageSmoothingEnabled = false;
      for (m = sy - snowR; m < sy + snowR; m += TS) for (k = sx - snowR; k < sx + snowR; k += TS) x.drawImage(A.sprite('tile_snow_patch', ((k + m) / TS | 0) % 3 < 0 ? 0 : (((k / TS | 0) + (m / TS | 0)) % 3 + 3) % 3), k, m);
      var sg = x.createRadialGradient(sx - snowR * 0.3, sy - snowR * 0.3, 4, sx, sy, snowR); sg.addColorStop(0, 'rgba(255,255,255,0.35)'); sg.addColorStop(1, 'rgba(120,150,200,0.25)'); x.fillStyle = sg; x.fillRect(sx - snowR, sy - snowR, snowR * 2, snowR * 2);
      x.restore();
      x.strokeStyle = '#ffffff'; x.lineWidth = 1.6; x.beginPath(); discP(x); x.stroke();
      // huellas
      for (k = 0; k < 4; k++) { var fa = R(0, TAU), fr = R(0.4, 0.8) * snowR; x.fillStyle = 'rgba(120,150,190,0.55)'; x.beginPath(); x.ellipse(sx + cos(fa) * fr, sy + sin(fa) * fr, 3.2, 2, fa, 0, TAU); x.fill(); }
      snow.push({ x: sx, y: sy, r: snowR }); fires.push({ x: sx, y: sy, r: 64 * s });
    });
    // estalagmitas decorativas del borde (no son obstaculos)
    var dec = [];
    for (i = 0; i < 90; i++) {
      var dx = R(wall + 10, w - wall - 10), dy = R(wall + 10, h - wall - 10), dn = Math.pow(Math.pow(Math.abs(dx - cx) / rx, 2.4) + Math.pow(Math.abs(dy - cy) / ry, 2.4), 1 / 2.4);
      if (dn < 0.88 || dn > 0.97) continue; dec.push([dx, dy, [0, 1, 0, 2, 3][(rr() * 5) | 0]]);
    }
    dec.sort(function (a, b) { return a[1] - b[1]; });
    var shd = o_sprite('shadow');
    dec.forEach(function (d) { var sp = A.sprite('decor_tundra', d[2]); x.globalAlpha = 0.4; x.drawImage(shd, d[0] - shd.width / 2, d[1] - shd.height / 2 - 2); x.globalAlpha = 1; x.drawImage(sp, d[0] - sp.width * 0.6, d[1] - sp.height * 1.1, sp.width * 1.2, sp.height * 1.2); });
    // resplandor frio del borde
    for (i = 1; i <= 8; i++) { x.strokeStyle = 'rgba(120,190,255,0.5)'; x.lineWidth = i * 12; x.globalAlpha = 0.07; x.beginPath(); plat(x); x.stroke(); } x.globalAlpha = 1;
    x.restore();
    // borde
    x.strokeStyle = '#0a1430'; x.lineWidth = 14; x.beginPath(); plat(x); x.stroke();
    x.strokeStyle = '#9fd8ff'; x.lineWidth = 6; x.beginPath(); plat(x); x.stroke();
    x.strokeStyle = 'rgba(255,255,255,0.7)'; x.lineWidth = 2; x.save(); x.translate(-1.5, -1.5); x.beginPath(); plat(x); x.stroke(); x.restore();
    // ventisqueros blancos en el borde
    for (i = 0; i < 70; i++) { var q3 = pts[(rr() * pts.length) | 0], bpx = q3[0] + R(-6, 6), bpy = q3[1] + R(-6, 6); var sdr = H.rrand(i + 5); x.save(); x.beginPath(); Pblob(bpx, bpy, R(12, 30), R(6, 12), i + 11, 0.15, 9)(x); x.fillStyle = '#e8eef5'; x.fill(); x.strokeStyle = '#6a86b0'; x.lineWidth = 2; x.stroke(); x.restore(); }
    // viñeta azul exterior
    x.save(); x.translate(cx, cy); x.scale(1, h / w);
    var vg = x.createRadialGradient(0, 0, w * 0.36, 0, 0, w * 0.64); vg.addColorStop(0, 'rgba(6,18,46,0)'); vg.addColorStop(0.7, 'rgba(6,18,46,0.4)'); vg.addColorStop(1, 'rgba(6,18,46,0.75)'); x.fillStyle = vg; x.fillRect(-w, -w, w * 2, w * 2); x.restore();
    return { canvas: c, torches: [], ritual: null, snow: snow, fires: fires, cracks: cracks, pillars: PILLAR_SPOTS.map(function (p) { return { x: p[0] * s, y: p[1] * s, r: 22 * s }; }) };
  }
  A.arena = function (w, h, o) { return TUN ? tundraArena(w, h, o) : o_arena(w, h, o); };
  A.TUNDRA_SPOTS = { snow: SNOW_SPOTS, pillars: PILLAR_SPOTS, cracks: CRACK_SPOTS };

  // ======================================================================================================
  //  VENTISCA (B.1.3): capa de pantalla. Dibujar tras el mundo y ANTES de telegrafias/proyectiles enemigos/barras del jefe.
  // ======================================================================================================
  var SC = null, EDGE = {};
  function qual(q) { return q === 'baja' || q === 0 ? 0 : q === 'media' || q === 1 ? 1 : 2; }
  // A.drawBlizzard(ctx, t, intensity, o): t ms; intensity = alfa de la ventisca (0,15 calma / 0,45 rafaga / 0,6 maximo; 0 = nada)
  // o: {w,h (area de pantalla; defecto el canvas), px,py (centro despejado en px de pantalla; defecto el centro), clear 330, outer 520,
  //     quality 'alta'|'media'|'baja' (o 2|1|0), wind (rad, defecto 0.35 = 20 grados)}
  A.drawBlizzard = function (ctx, t, intensity, o) {
    o = o || {};
    if (!(intensity > 0.004)) return;
    var W = o.w || ctx.canvas.width, Hh = o.h || ctx.canvas.height, q = qual(o.quality == null ? 2 : o.quality), px = o.px == null ? W / 2 : o.px, py = o.py == null ? Hh / 2 : o.py;
    var rc = o.clear || 330, ro = o.outer || 520, mistA = Math.min(0.7, intensity * 1.22), i, g;
    ctx.save();
    if (q === 0) { // solo degradado estatico en los bordes (cero particulas)
      var key = W + 'x' + Hh + ':' + rc + ':' + ro;
      if (!EDGE[key]) { var ec = mkCanvas(W, Hh), ex = ec.getContext('2d'), eg = ex.createRadialGradient(W / 2, Hh / 2, rc * 0.7, W / 2, Hh / 2, Math.max(ro, Math.hypot(W, Hh) / 2)); eg.addColorStop(0, 'rgba(232,242,255,0)'); eg.addColorStop(1, 'rgba(232,242,255,0.8)'); ex.fillStyle = eg; ex.fillRect(0, 0, W, Hh); EDGE[key] = ec; }
      ctx.globalAlpha = Math.min(1, intensity * 1.3); ctx.drawImage(EDGE[key], 0, 0); ctx.restore(); return;
    }
    // rayas de nieve en diagonal (loseta fx_blizzard_tile) enmascaradas fuera del circulo despejado
    var HW = (W / 2) | 0, HH = (Hh / 2) | 0;
    if (!SC || SC.width !== HW || SC.height !== HH) { SC = mkCanvas(HW, HH); }
    var sx = SC.getContext('2d'), tl = A.animFrame('fx_blizzard_tile', 'loop', t), TS = tl.width / 2, layers = q === 2 ? 2 : 1, L, wind = o.wind == null ? 0.35 : o.wind;
    sx.globalCompositeOperation = 'source-over'; sx.clearRect(0, 0, HW, HH);
    for (L = 0; L < layers; L++) {
      var sc = L ? 1.5 : 1, sp = (L ? 260 : 170) * (0.5 + intensity) / 2, dxs = cos(wind) * sp * t / 1000, dys = sin(wind) * sp * t / 1000, ts = TS * sc;
      var ox = ((dxs % ts) + ts) % ts - ts, oy = ((dys % ts) + ts) % ts - ts, a, b;
      sx.globalAlpha = (L ? 0.7 : 1) * Math.min(1, 0.25 + intensity * 1.5);
      for (b = oy; b < HH; b += ts) for (a = ox; a < HW; a += ts) sx.drawImage(tl, a, b, ts, ts);
    }
    sx.globalAlpha = 1; sx.globalCompositeOperation = 'destination-out';
    var mg = sx.createRadialGradient(px / 2, py / 2, rc * 0.41, px / 2, py / 2, ro / 2); mg.addColorStop(0, 'rgba(0,0,0,1)'); mg.addColorStop(1, 'rgba(0,0,0,0.12)'); sx.fillStyle = mg; sx.fillRect(0, 0, HW, HH);
    sx.globalCompositeOperation = 'source-over'; sx.globalAlpha = 1;
    g = sx.createRadialGradient(px / 2, py / 2, rc / 2, px / 2, py / 2, ro / 2); g.addColorStop(0, 'rgba(226,238,255,0)'); g.addColorStop(1, 'rgba(226,238,255,' + mistA.toFixed(3) + ')'); sx.fillStyle = g; sx.fillRect(0, 0, HW, HH);
    ctx.imageSmoothingEnabled = false; ctx.drawImage(SC, 0, 0, W, Hh);
    ctx.restore();
  };
  // copos / brillos sueltos del mundo (lo usa drawFireflies en bioma tundra). o: {count 70, view {x,y,w,h}}
  A.drawSnowfall = function (ctx, w, h, tMs, o) {
    o = o || {}; var n = o.count == null ? 70 : o.count, t = (tMs || 0) / 1000, vw = o.view || { x: 0, y: 0, w: w, h: h }, i;
    ctx.save(); ctx.fillStyle = '#ffffff';
    for (i = 0; i < n; i++) {
      var h1 = sin(i * 12.9898) * 43758.5453; h1 -= Math.floor(h1); var h2 = sin(i * 78.233 + 1.7) * 24634.6345; h2 -= Math.floor(h2);
      var sp = 18 + h1 * 36, px = (((h1 * w + t * sp * 0.9 + sin(t * 0.8 + i) * 10) % w) + w) % w, py = (((h2 * h + t * sp * 0.5) % h) + h) % h;
      if (px < vw.x - 4 || px > vw.x + vw.w + 4 || py < vw.y - 4 || py > vw.y + vw.h + 4) continue;
      var sz = 1.4 + h2 * 2; ctx.globalAlpha = 0.5 + 0.4 * h1; ctx.fillRect(px | 0, py | 0, sz, sz);
      if (i % 9 === 0) { var tw = 0.5 + 0.5 * sin(t * 3 + i); ctx.globalAlpha = 0.3 + 0.6 * tw; ctx.fillStyle = '#cfeeff'; ctx.fillRect((px | 0) - 2, (py | 0), 5, 1); ctx.fillRect((px | 0), (py | 0) - 2, 1, 5); ctx.fillStyle = '#ffffff'; }
    }
    ctx.restore();
  };

  // ======================================================================================================
  //  HOGUERA, PILAR, UI DE FRIO
  // ======================================================================================================
  var WARM = null;
  function warmSprite() {
    if (WARM) return WARM; WARM = mkCanvas(128, 128); var x = WARM.getContext('2d'), g = x.createRadialGradient(64, 64, 0, 64, 64, 64);
    g.addColorStop(0, 'rgba(255,200,110,0.34)'); g.addColorStop(0.35, 'rgba(255,150,60,0.15)'); g.addColorStop(1, 'rgba(255,120,40,0)'); x.fillStyle = g; x.fillRect(0, 0, 128, 128); return WARM;
  }
  // A.drawCampfire(ctx, x, y, t, o): (x,y) = centro de la hoguera (suelo). o: {r 64 (radio de calor), scale 1 (sprite), ring true (aro punteado del radio de calor), light true, alpha 1}
  A.drawCampfire = function (ctx, x, y, t, o) {
    o = o || {}; var r = o.r || 64, sc = o.scale || 1, f = A.animFrame('fx_campfire', 'burn', (t || 0) + (x * 13 + y * 7) % 400), fl = 1 + 0.05 * sin((t || 0) / 90 + x);
    ctx.save(); if (o.alpha != null) ctx.globalAlpha = o.alpha;
    if (o.ring !== false) { ctx.strokeStyle = 'rgba(255,170,70,0.55)'; ctx.lineWidth = 2; ctx.setLineDash([6, 6]); ctx.lineDashOffset = -(t || 0) / 60; ctx.beginPath(); ctx.ellipse(x, y, r, r * 0.97, 0, 0, TAU); ctx.stroke(); ctx.setLineDash([]); ctx.fillStyle = 'rgba(255,150,60,0.07)'; ctx.fill(); }
    if (o.light !== false) { var lw = warmSprite(), s = r * 3.1 * fl; ctx.globalCompositeOperation = 'lighter'; ctx.drawImage(lw, x - s / 2, y - s / 2, s, s); ctx.globalCompositeOperation = 'source-over'; }
    ctx.imageSmoothingEnabled = false; ctx.drawImage(f, Math.round(x - 20 * sc), Math.round(y - 38 * sc), f.width * sc, f.height * sc);
    ctx.restore();
  };
  // A.drawIcePillar(ctx, x, y, o): (x,y) = centro del circulo de colision (r 22). o: {hp 0..1, rebuild 0..1 (aviso a hp 0), struck, alpha}. Ordenar por y + 12.
  A.drawIcePillar = function (ctx, x, y, o) {
    o = o || {}; var hp = o.hp == null ? 1 : o.hp, fr = hp > 0.5 ? 0 : hp > 0 ? 1 : 2, s = A.sprite('obs_ice_pillar', fr);
    ctx.save(); if (o.alpha != null) ctx.globalAlpha = o.alpha;
    if (fr === 2 && o.rebuild > 0) { ctx.strokeStyle = 'rgba(159,216,255,' + (0.5 + 0.4 * o.rebuild) + ')'; ctx.lineWidth = 2; ctx.setLineDash([4, 4]); ctx.beginPath(); ctx.ellipse(x, y + 10, 22, 20, 0, 0, TAU); ctx.stroke(); ctx.setLineDash([]); ctx.globalAlpha = (o.alpha == null ? 1 : o.alpha) * (0.3 + 0.5 * o.rebuild); ctx.drawImage(A.sprite('obs_ice_pillar', 0), x - 26, y - 82); }
    else { ctx.drawImage(s, x - 26, y - 82); if (o.struck) { ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = 0.5; ctx.drawImage(s, x - 26, y - 82); } }
    ctx.restore();
  };
  function rrect(c, x, y, w, h, r) { c.beginPath(); c.moveTo(x + r, y); c.lineTo(x + w - r, y); c.quadraticCurveTo(x + w, y, x + w, y + r); c.lineTo(x + w, y + h - r); c.quadraticCurveTo(x + w, y + h, x + w - r, y + h); c.lineTo(x + r, y + h); c.quadraticCurveTo(x, y + h, x, y + h - r); c.lineTo(x, y + r); c.quadraticCurveTo(x, y, x + r, y); c.closePath(); }
  // A.drawFlake(ctx, x, y, r, o): copo vectorial (o: color, rot, alpha)
  A.drawFlake = function (ctx, x, y, r, o) { o = o || {}; ctx.save(); if (o.alpha != null) ctx.globalAlpha = o.alpha; flake(ctx, x, y, r, o.color || '#bfe8ff', Math.max(0.8, r * 0.18), o.rot || 0); ctx.restore(); };
  // A.drawColdBar(ctx, x, y, value, t, o): (x,y) = esquina sup. izq. del conjunto; value 0..100. Barra 140x10 + icono a la izquierda + numero a la derecha.
  // o: {w 140, h 10, text true, frozen (estado Escarcha), alpha}. Devuelve el ancho total (24 + w + 34). Colores: <40 azul claro, 40-70 cian, >=70 blanco azulado (Helado), 100 destella.
  A.drawColdBar = function (ctx, x, y, value, t, o) {
    o = o || {}; var w = o.w || 140, h = o.h || 10, v = Math.max(0, Math.min(100, value || 0)), bx = x + 24, by = y + 2, fr = v >= 70 || o.frozen, pulse = 0.5 + 0.5 * sin((t || 0) / (v >= 99 ? 90 : 260));
    ctx.save(); if (o.alpha != null) ctx.globalAlpha = o.alpha;
    var ic = A.sprite('icon_frio', fr && pulse > 0.5 ? 1 : 0); ctx.imageSmoothingEnabled = false; ctx.drawImage(ic, x, y - 3, 22, 22);
    rrect(ctx, bx - 1.5, by - 1.5, w + 3, h + 3, 4); ctx.fillStyle = '#1b1124'; ctx.fill();
    rrect(ctx, bx, by, w, h, 3); ctx.fillStyle = '#0f1a3a'; ctx.fill();
    ctx.save(); rrect(ctx, bx, by, w, h, 3); ctx.clip();
    var fw = w * v / 100, g = ctx.createLinearGradient(bx, 0, bx + w, 0); g.addColorStop(0, '#6ac8ff'); g.addColorStop(0.4, '#9fd8ff'); g.addColorStop(0.7, '#d8f2ff'); g.addColorStop(1, '#ffffff');
    ctx.fillStyle = g; ctx.fillRect(bx, by, fw, h);
    ctx.fillStyle = 'rgba(255,255,255,0.35)'; ctx.fillRect(bx, by, fw, h * 0.38);
    if (fr) { ctx.fillStyle = 'rgba(255,255,255,' + (0.18 + 0.3 * pulse) + ')'; ctx.fillRect(bx, by, fw, h); }
    for (var i = 0; i < 4; i++) { var sxp = bx + ((i * 37 + (t || 0) / 40) % Math.max(10, fw)); if (sxp < bx + fw) { ctx.fillStyle = 'rgba(255,255,255,0.7)'; ctx.fillRect(sxp, by + 2 + (i % 3) * 2, 1.5, 1.5); } }
    ctx.restore();
    ctx.fillStyle = '#1b1124'; [40, 70].forEach(function (m) { ctx.fillRect(bx + w * m / 100 - 0.5, by - 1, 1.5, h + 2); }); // marcas de 40 (escarcha en bordes) y 70 (Helado)
    if (v >= 99 || o.frozen) { ctx.strokeStyle = 'rgba(255,255,255,' + (0.5 + 0.5 * pulse) + ')'; ctx.lineWidth = 1.5; rrect(ctx, bx - 2.5, by - 2.5, w + 5, h + 5, 5); ctx.stroke(); }
    if (o.text !== false) { var txt = Math.round(v) + '%'; ctx.font = 'bold 10px sans-serif'; ctx.textBaseline = 'middle'; ctx.lineWidth = 3; ctx.strokeStyle = '#1b1124'; ctx.strokeText(txt, bx + w + 5, by + h / 2 + 0.5); ctx.fillStyle = v >= 70 ? '#ffffff' : '#bfe8ff'; ctx.fillText(txt, bx + w + 5, by + h / 2 + 0.5); }
    ctx.restore(); return 24 + w + 34;
  };
  // A.drawColdVignette(ctx, W, H, value, t, o): escarcha azul en bordes/esquinas segun el Frio (0..100). Nada por debajo de ~20. >=40 visible, >=70 intensa, 100 = Escarcha (blanquea). o: {alpha}
  var FROST = {};
  function frostCanvas(W, Hh) {
    var key = W + 'x' + Hh; if (FROST[key]) return FROST[key];
    var c = mkCanvas(W, Hh), x = c.getContext('2d'), R = Math.hypot(W, Hh) / 2, g = x.createRadialGradient(W / 2, Hh / 2, R * 0.5, W / 2, Hh / 2, R);
    g.addColorStop(0, 'rgba(110,190,255,0)'); g.addColorStop(0.7, 'rgba(110,190,255,0.28)'); g.addColorStop(1, 'rgba(190,230,255,0.75)'); x.fillStyle = g; x.fillRect(0, 0, W, Hh);
    var r = H.rrand(77), i, k;
    for (k = 0; k < 4; k++) {
      var ox = k % 2 ? W : 0, oy = k > 1 ? Hh : 0, dx = k % 2 ? -1 : 1, dy = k > 1 ? -1 : 1;
      for (i = 0; i < 38; i++) {
        var a = r() * 1.57, len = 30 + r() * (W * 0.2) * (1 - i / 60), bx = ox + dx * r() * W * 0.1, by = oy + dy * r() * Hh * 0.1, ex = bx + dx * cos(a) * len, ey = by + dy * sin(a) * len;
        x.strokeStyle = 'rgba(27,17,36,0.35)'; x.lineWidth = 3.4; x.beginPath(); x.moveTo(bx, by); x.lineTo(ex, ey); x.stroke();
        x.strokeStyle = i % 3 ? 'rgba(207,238,255,0.8)' : 'rgba(255,255,255,0.9)'; x.lineWidth = 1.6; x.stroke();
        x.fillStyle = 'rgba(230,246,255,0.75)'; x.beginPath(); x.moveTo(ex, ey); x.lineTo(ex - dx * 4 + dy * 4, ey - dy * 4 - dx * 4); x.lineTo(ex - dx * 4 - dy * 4, ey - dy * 4 + dx * 4); x.closePath(); x.fill();
      }
      var cg = x.createRadialGradient(ox, oy, 0, ox, oy, Hh * 0.55); cg.addColorStop(0, 'rgba(230,246,255,0.7)'); cg.addColorStop(1, 'rgba(230,246,255,0)'); x.fillStyle = cg; x.fillRect(ox - Hh * 0.6, oy - Hh * 0.6, Hh * 1.2, Hh * 1.2);
    }
    FROST[key] = c; return c;
  }
  A.drawColdVignette = function (ctx, W, Hh, value, t, o) {
    o = o || {}; var v = Math.max(0, Math.min(100, value || 0)); if (v < 20) return;
    var s = Math.min(1, (v - 20) / 80), a = (v < 40 ? s * 0.55 : 0.28 + s * 0.65) * (o.alpha == null ? 1 : o.alpha), fc = frostCanvas(W, Hh);
    ctx.save(); ctx.globalAlpha = Math.min(1, a) * (v >= 70 ? 0.9 + 0.1 * sin((t || 0) / 300) : 1); ctx.drawImage(fc, 0, 0);
    if (v >= 99) { ctx.globalAlpha = 0.14 + 0.06 * sin((t || 0) / 120); ctx.fillStyle = '#e8f6ff'; ctx.fillRect(0, 0, W, Hh); }
    ctx.restore();
  };

  // ------------------------------------------------------------------------------------------ indice
  A.FAM3 = {
    tundra: ['enemy_tun_lobezno', 'enemy_tun_cazador', 'enemy_tun_lobo', 'enemy_tun_oso', 'enemy_tun_yeti', 'enemy_tun_murcielago', 'enemy_tun_estalagmita', 'enemy_tun_espiritu', 'enemy_tun_chaman',
      'enemy_mini_yeti', 'enemy_mini_ventisquero',
      'proj_ice_arrow', 'proj_icicle', 'fx_ice_slab', 'fx_snow_whirl', 'fx_ice_crack', 'obs_ice_pillar', 'fx_campfire', 'fx_blizzard_tile', 'fx_ice_block', 'fx_ice_burst',
      'fx_skid_trail', 'fx_ice_breath', 'fx_snow_puff', 'fx_ice_debris', 'fx_snow_pool', 'decor_tundra', 'icon_frio', 'tile_ice', 'tile_snow_patch']
  };
})();
