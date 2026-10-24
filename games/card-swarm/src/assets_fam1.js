/*!
 * assets_fam1.js - Arte de las familias P1 (DESIGN-v5-biomas.md A.3 Bosque y A.4 Cripta, C.4 apartado A).
 * Se carga DESPUES de assets.js (usa Assets._h). Contrato exacto: ASSETS_API.md, seccion "Familias P1 (Bosque y Cripta)".
 * Misma gramatica que assets_enemies2.js: contorno grueso #1b1124, color plano + 1 sombra + 1 brillo, miran a la DERECHA.
 * Tamano base x2 = final. Todo se precompone una vez al cargar (canvas offscreen): el dibujo en juego es un drawImage.
 */
(function () {
  'use strict';
  var A = window.Assets, H = A && A._h;
  if (!H) { if (window.console) console.error('assets_fam1: falta Assets._h (cargar tras assets.js)'); return; }
  var addV = H.addV, Pclosed = H.Pclosed, Ppoly = H.Ppoly, Pblob = H.Pblob, Prr = H.Prr, Pcirc = H.Pcirc;
  var dyingFrames = H.dyingFrames, PH = H.PH, OLC = H.OLC;
  var TAU = 6.2832;

  var WK = [1, 2, 4, 5];
  function wk(k) { var p = PH[WK[k]]; return { c: Math.round(Math.cos(p)), by: -(Math.abs(Math.sin(p)) > 0.8 ? 1 : 0), p: p }; }
  function withDie(fr, draw, w, h, opt, o) {
    var d0 = fr.length;
    dyingFrames(draw, w, h, opt, o).forEach(function (f) { fr.push(f); });
    return { f: [d0, d0 + 1, d0 + 2, d0 + 3, d0 + 4], fps: 9, loop: false };
  }
  var WALKSEQ = [0, 2, 1, 3, 4, 5];
  function eyeG(v, x, y, r, col) { v.dot(x, y, r, col || '#ff9a2a'); v.dot(x - r * 0.3, y - r * 0.3, r * 0.38, '#fff2c0'); }
  // lista de frames de caminata: 4 variantes (by, c) -> fn(opts)
  function walkFrames(F, fn, extra) {
    for (var k = 0; k < 4; k++) { var q = wk(k), o = { by: q.by, legs: [-q.c, q.c, q.c, -q.c], c: q.c, k: k }; if (extra) for (var e in extra) o[e] = extra[e]; F.push(fn(o)); }
  }

  // ======================================================================================================
  //  BOSQUE  (lana negra y crema, puas moradas, ojos naranja, granate)
  // ======================================================================================================

  // ------------------------------------------------------------ CORDERO CORRUPTO 20x20
  function cordero(o) {
    return function (v) {
      var by = o.by || 0, L = o.legs || [0, 0, 0, 0], i, tilt = o.tilt || 0;
      [[7.4, L[2], 1], [13, L[3], 1], [5.6, L[0], 0], [11.6, L[1], 0]].forEach(function (l) {
        v.part(Prr(l[0] + l[1] - 1, 14.4 + (l[2] ? 0 : 0.4), 2.4, 4.4 - (l[2] ? 0.4 : 0) - (o.crouch || 0), 0.8), l[2] ? '#17111f' : '#2a2236', { lw: 1.1, sh: '#120c1a', so: 0.3 });
      });
      var cb = 11 + by + (o.crouch || 0) * 0.6, W = [[5.4, cb + 0.6, 3.6], [8.6, cb - 2.2, 4.3], [12.4, cb - 1.6, 3.9], [7, cb + 2.2, 3.5], [11.6, cb + 2.2, 3.7], [9.6, cb, 4.3]];
      v.cluster(W.map(function (w) { return Pcirc(w[0], w[1], w[2]); }), '#f4e8c8', { lw: 1.5, sh: '#c9b78e', hi: '#fffaf0', so: 1 });
      // puas moradas en el lomo (corrupcion)
      [[6.4, 6.2, 3], [10.2, 5.2, 4], [13.2, 6.4, 3]].forEach(function (s) {
        v.part(Ppoly([[s[0] - 1.5, s[1] + 1.6 + by], [s[0] + s[2] * 0.1, s[1] - s[2] + by], [s[0] + 1.6, s[1] + 1.6 + by]]), '#8a3ac8', { lw: 1, sh: '#4a1e72', hi: '#c070e8', so: 0.4 });
      });
      // cabeza oscura
      var hx = 16.2 + (o.hx || 0), hy = 11 + by + tilt;
      v.part(Pblob(hx - 2.6, hy - 2.8, 1.9, 1.0, 11, 0.04, 8, 0.7), '#2a2236', { lw: 0.9, sh: '#17111f', so: 0.3 });
      v.stick([[hx - 1.6, hy - 2.6], [hx - 2.4, hy - 4.8], [hx - 0.6, hy - 5.8]], 1.1, '#e8d8b0', { lw: 0.8, hi: '#fff6dc' });
      v.part(Pblob(hx, hy, 3.3, 3.1, 12, 0.03), '#2a2236', { lw: 1.3, sh: '#17111f', hi: '#4a3c60', so: 0.8 });
      v.part(Pblob(hx + 2.1, hy + 1.5, 1.9, 1.4, 13), '#4a3c60', { lw: 0.8, sh: '#2a2236', so: 0.3 });
      v.part(Pcirc(hx - 0.8, hy - 3.2, 1.7), '#f4e8c8', { lw: 0.9, sh: '#c9b78e', so: 0.3 });
      eyeG(v, hx + 0.9, hy - 0.5, 0.9);
      if (o.open) { v.part(Pblob(hx + 2.8, hy + 2.3, 1.2, 0.8, 14), '#3a0e18', { lw: 0.5 }); } else v.dot(hx + 3.5, hy + 1.2, 0.45, '#ff8aa0');
    };
  }
  (function () {
    var F = [cordero({}), cordero({ by: 1 })];
    walkFrames(F, cordero);
    var dieA = withDie(F, cordero({}), 20, 20, { lw: 1.4 });
    addV('enemy_bos_cordero', 20, 20, F, { lw: 1.4 }, { idle: { f: [0, 1], fps: 4 }, walk: { f: WALKSEQ, fps: 9 }, die: dieA });
  })();

  // ------------------------------------------------------------ ZARZAL 24x24 (arbusto de corteza con espinas moradas)
  function zarzal(o) {
    return function (v) {
      var by = o.by || 0, sw = o.sw || 0, inf = o.infl || 0, L = o.legs || [0, 0], i;
      // raices (patas)
      for (i = 0; i < 2; i++) {
        var rx = (i ? 14.4 : 8.2) + L[i] * 0.6;
        v.stick([[rx - 1, 17.4], [rx + L[i], 20], [rx + L[i] + (i ? 1.6 : -1.2), 22.4]], 2.2, '#5a3418', { lw: 1.1, hi: '#8a5a30' });
      }
      var cx = 11.6, cy = 14.4 + by;
      // ramas con espinas moradas
      var br = [[-158, 8], [-134, 9.6], [-108, 10.4], [-80, 9.8], [-52, 9.2], [-26, 7.6]];
      br.forEach(function (b, k) {
        var a = (b[0] + Math.sin(sw + k * 1.7) * 7 + (o.spread || 0) * (k - 2.5) * 2) * Math.PI / 180, len = b[1] + inf * 1.6 + (o.fire && k === 5 ? 0 : 0);
        var ex = cx + Math.cos(a) * len, ey = cy + Math.sin(a) * len * 0.95, mx = cx + Math.cos(a - 0.2) * len * 0.55, my = cy + Math.sin(a - 0.2) * len * 0.55;
        v.stick([[cx + Math.cos(a) * 2.5, cy + Math.sin(a) * 2.5], [mx, my], [ex, ey]], 1.7, '#7a4a26', { lw: 1, hi: '#a8703c', curve: true });
        var tx = ex + Math.cos(a) * (2.4 + inf * 1.4), ty = ey + Math.sin(a) * (2.4 + inf * 1.4), px = -Math.sin(a), py = Math.cos(a);
        v.part(Ppoly([[ex - px * 1.3, ey - py * 1.3], [tx, ty], [ex + px * 1.3, ey + py * 1.3]]), o.aim ? '#ffe45a' : '#8a3ac8', { lw: 0.8, sh: '#4a1e72', hi: '#c070e8', so: 0.3 });
        var sx = mx + px * 0.2, sy = my + py * 0.2; // espina lateral
        v.part(Ppoly([[sx, sy - 0.8], [sx + Math.cos(a + 1.1) * 3, sy + Math.sin(a + 1.1) * 3], [sx + 0.8, sy + 0.4]]), '#8a3ac8', { lw: 0.6, sh: '#4a1e72', so: 0.2 });
        if (k % 2 === 0) v.part(Pblob(mx, my, 1.7, 1.2, 20 + k, 0.05, 7, a), '#d8782a', { lw: 0.8, sh: '#a8481a', hi: '#ffb060', so: 0.3 });
      });
      if (o.fire) { // espina saliendo disparada
        v.part(Ppoly([[18.6, cy - 1.1], [23.4, cy + 0.2], [18.6, cy + 1.5]]), '#ffc04a', { lw: 0.8, sh: '#c8501c', so: 0.2 });
      }
      v.part(Pblob(cx, cy, 6.2 + inf * 0.9, 5.6 + inf * 0.7, 31, 0.04), '#7a4a26', { lw: 1.5, sh: '#4e2c14', hi: '#a8703c', so: 1 });
      v.line(7.6, cy - 1.2, 9, cy + 2.4, 0.6, '#4e2c14'); v.line(9.4, cy - 3, 10.4, cy, 0.6, '#4e2c14');
      v.part(Pblob(14.4, cy - 0.4, 3.1, 2.8, 32), '#1a1020', { lw: 0.5 });
      var ec = o.aim ? '#ffe45a' : '#ff9a2a', er = o.aim ? 1.25 : 1;
      eyeG(v, 13.4, cy - 0.9, er, ec); eyeG(v, 16, cy - 0.9, er, ec);
      v.line(13, cy + 1.7, 16.4, cy + 1.7, 0.6, '#d8782a'); [13.6, 15.2].forEach(function (x) { v.dot(x, cy + 2, 0.4, '#f4e8c8'); });
    };
  }
  (function () {
    var F = [zarzal({ sw: 0 }), zarzal({ sw: 1.6, by: 1 })];
    walkFrames(F, function (o) { return zarzal({ by: o.by, legs: o.legs, sw: o.k * 0.9 }); });
    F.push(zarzal({ aim: true, infl: 1, spread: 1 }));          // 6 aim
    F.push(zarzal({ fire: true, infl: -0.3, by: 1, sw: 2 }));   // 7 fire
    var dieA = withDie(F, zarzal({}), 24, 24, { lw: 1.4 });
    addV('enemy_bos_zarzal', 24, 24, F, { lw: 1.4 }, {
      idle: { f: [0, 1], fps: 3 }, walk: { f: WALKSEQ, fps: 7 }, aim: { f: [6], fps: 1 }, fire: { f: [7], fps: 1 }, shoot: { f: [7, 1], fps: 8 }, die: dieA
    });
  })();

  // ------------------------------------------------------------ PERRO PASTOR 26x18
  function perro(o) {
    return function (v) {
      var by = o.by || 0, L = o.legs || [0, 0, 0, 0], st = o.stretch || 0, hy = 6.4 + by + (o.up || 0), tw = o.tail || 0, i;
      var yb = 10.2 + by + st * 1.4;
      // cola
      v.stick([[5.2 - st, yb - 1.4], [2.4 - st, yb - 3 + tw], [1.2 - st, yb - 5.4 + tw * 1.3]], 2.2, '#2a2236', { lw: 1.1, curve: true });
      v.part(Pcirc(1.4 - st, yb - 5.6 + tw * 1.3, 1.1), '#f4e8c8', { lw: 0.8, sh: '#c9b78e', so: 0.2 });
      // patas lejanas
      var pf = [[18, 3, 2.4], [7, 1, 2.4]];
      [[17.2, L[2], 0], [7.4, L[3], 0]].forEach(function (l) {
        v.part(Prr(l[0] + l[1] * 0.8 - 1, yb + 2, 2, 5.2 - by - st, 0.8), '#17111f', { lw: 1, so: 0.2 });
      });
      // cuerpo
      v.part(Pblob(11.4 - st * 0.4, yb, 7.6 + st * 1.2, 3.9 - st * 0.4, 41, 0.03, 10), '#2a2236', { lw: 1.4, sh: '#17111f', hi: '#4a3c60', so: 0.9 });
      v.part(Pblob(17.2 + st * 0.6, yb + 1.8, 2.8, 2.8, 42), '#f4e8c8', { lw: 0.9, sh: '#c9b78e', so: 0.4 });
      // patas cercanas (calcetines crema)
      [[15.4 + st * 0.6, L[0]], [9.4 - st * 0.4, L[1]]].forEach(function (l) {
        var lx = l[0] + l[1] * 0.9 - 1.1, lh = 5.2 - by - st;
        v.part(Prr(lx, yb + 1.8, 2.4, lh, 0.8), '#2a2236', { lw: 1.1, sh: '#17111f', so: 0.3 });
        v.part(Prr(lx - 0.1, yb + 1.8 + lh - 1.7, 2.6, 1.7, 0.7), '#f4e8c8', { lw: 0.8, sh: '#c9b78e', so: 0.2 });
      });
      // collar granate
      v.part(Prr(16.2, hy + 1.6, 2, 4.6, 0.8), '#8a2a3a', { lw: 0.9, sh: '#5a1426', so: 0.3 });
      // cabeza
      var hx = 19.6 + st * 1.2;
      v.part(Pblob(hx, hy, 3.6, 3.2, 43, 0.03), '#2a2236', { lw: 1.3, sh: '#17111f', hi: '#4a3c60', so: 0.8 });
      v.part(Pblob(hx + 3, hy + 1.4, 2.7, 1.8, 44), '#f4e8c8', { lw: 1, sh: '#c9b78e', so: 0.4 });
      v.part(Ppoly([[hx - 0.8, hy - 2.8], [hx + 0.5, hy - 5.4], [hx + 2.4, hy - 2.2]]), '#2a2236', { lw: 1, sh: '#17111f', so: 0.3 });  // oreja
      v.part(Ppoly([[hx - 2.6, hy - 2], [hx - 4.2, hy - 0.2], [hx - 1.6, hy + 0.6]]), '#17111f', { lw: 0.9, so: 0.2 });
      v.dot(hx + 5, hy + 0.5, 0.8, OLC);
      eyeG(v, hx + 1.5, hy - 0.8, 0.85);
      v.line(hx + 2.6, hy - 2, hx + 0.8, hy - 2.3, 0.5, '#f4e8c8');
      if (o.bark) { v.part(Pblob(hx + 3.2, hy + 2.8, 2.1, 1.3, 45, 0.04, 8, 0.5), '#3a0e18', { lw: 0.6 }); v.dot(hx + 2.6, hy + 2.2, 0.4, '#fff'); v.dot(hx + 4.2, hy + 2.8, 0.4, '#fff'); }
      else if (o.dash) { v.line(hx + 1.2, hy + 2.5, hx + 4.2, hy + 2.5, 0.5, OLC); }
      if (o.bark) { v.line(hx + 5.6, hy - 1.4, hx + 6.6, hy - 2.6, 0.7, '#fff2c0'); v.line(hx + 5.8, hy + 0.4, hx + 7, hy + 0.2, 0.7, '#fff2c0'); }
      if (o.dash) { v.line(0.2, yb - 2.6, 3.4, yb - 2.6, 0.7, 'rgba(255,240,200,0.9)'); v.line(0.2, yb + 1, 2.6, yb + 1, 0.6, 'rgba(255,240,200,0.7)'); v.line(0.4, yb + 4, 3.2, yb + 4, 0.7, 'rgba(255,240,200,0.8)'); }
    };
  }
  (function () {
    var F = [perro({ tail: 0 }), perro({ tail: 1.6, by: 0.5 }), 0, 0, 0, 0], k;
    for (k = 0; k < 4; k++) { var q = wk(k); F[2 + k] = perro({ by: q.by, legs: [-q.c * 1.4, q.c * 1.4, q.c * 1.4, -q.c * 1.4], tail: q.c }); }
    F.push(perro({ bark: true, up: -1.2, by: -0.5, tail: 2 }));           // 6 bark
    F.push(perro({ dash: true, stretch: 1, legs: [2, -2, -2, 2], by: 1.5, tail: -1 }), perro({ dash: true, stretch: 1.4, legs: [-2.2, 2.2, 2.2, -2.2], by: 2, tail: -1 })); // 7-8 dash
    var dieA = withDie(F, perro({}), 26, 18, { lw: 1.4 });
    addV('enemy_bos_perro', 26, 18, F, { lw: 1.4 }, {
      idle: { f: [0, 1], fps: 4 }, walk: { f: WALKSEQ, fps: 11 }, bark: { f: [6], fps: 1 }, dash: { f: [7, 8], fps: 14 }, die: dieA
    });
  })();

  // ------------------------------------------------------------ POLILLA DE LANA 20x20
  function polilla(o) {
    return function (v) {
      var by = o.by || 0, f = o.f, fold = o.fold ? 0.3 : 1, Rx = 10.6, Ry = 10.2 + by, x = v.ctx;
      function W(px, py) { return [Rx + px * fold, Ry + py]; }
      function wing(ff, base, sh, al) {
        x.globalAlpha = al;
        v.part(Pclosed([W(1, 0.2), W(-1, -6.4 * ff - 2.4), W(-6.4, -8.6 * ff - 1.2), W(-8.6, -3.4 * ff + 2.8), W(-4, 1.8)]), base, { lw: 1.3, sh: sh, hi: '#fffaf0', so: 0.9 });
        v.dot(Rx - 5.2 * fold, Ry - 5.2 * ff, 1.5, '#8a5a30'); v.dot(Rx - 2.6 * fold, Ry - 3 * ff - 0.4, 0.8, '#2a2236');
        x.globalAlpha = 1;
      }
      wing(Math.min(1.1, f * 0.75 + 0.1), '#d8c49a', '#a8946a', 0.97);
      x.globalAlpha = 0.97;
      v.part(Pclosed([W(0.6, 1.2), W(-4, 2.4 - f * 1.2), W(-6.6, 4.8 - f * 1.8), W(-3.2, 6.6), W(0.4, 4)]), '#e8d8b0', { lw: 1.2, sh: '#b8a478', hi: '#fffaf0', so: 0.7 });
      x.globalAlpha = 1;
      v.part(Pblob(11.2, 11.4 + by, 3.9, 3.1, 81, 0.05), '#3a2a46', { lw: 1.3, sh: '#241830', hi: '#6a5a80', so: 0.7 });
      v.part(Pcirc(11.4, 9.4 + by, 2.2), '#f4e8c8', { lw: 0.8, sh: '#c9b78e', so: 0.3 });   // mechon de lana
      // antenas plumosas naranja
      v.stick([[15.4, 8.6 + by], [14.6, 5.4 + by], [13.2, 4.2 + by]], 0.7, '#8a2a3a', { lw: 0.6 }); v.part(Pblob(13.1, 3.8 + by, 0.8, 1.5, 85, 0.05, 7, 0.5), '#ff9a2a', { lw: 0.6, so: 0.2 });
      v.stick([[16.4, 8.4 + by], [17.4, 5.2 + by], [16.6, 3.8 + by]], 0.7, '#8a2a3a', { lw: 0.6 }); v.part(Pblob(16.6, 3.4 + by, 0.8, 1.5, 86, 0.05, 7, -0.4), '#ff9a2a', { lw: 0.6, so: 0.2 });
      v.part(Pblob(15.4, 10.2 + by, 2.7, 2.5, 83), '#2a2236', { lw: 1.2, sh: '#17111f', hi: '#4a3c60', so: 0.6 });
      eyeG(v, 16.2, 9.8 + by, 0.95);
      v.line(10, 14.4 + by, 9.4, 16.2 + by, 0.5, '#2a2236'); v.line(12.2, 14.6 + by, 12.4, 16.4 + by, 0.5, '#2a2236');
      wing(f, '#f4e8c8', '#c9b78e', 0.98);
      if (o.orb) { // orbe de lana con anillo azul claro
        var oy = 16.4 + by, r = o.orb;
        v.dot(11.4, oy, r + 1.8, 'rgba(120,200,255,0.55)');
        v.part(Pcirc(11.4, oy, r), '#fff6e0', { lw: 0.9, sh: '#d8c49a', hi: '#ffffff', so: 0.5 });
        x.strokeStyle = '#6ac8ff'; x.lineWidth = 0.9; x.beginPath(); x.arc(11.4, oy, r + 1.8, 0, TAU); x.stroke();
      }
      if (o.thrown) { v.dot(18.4, 10.8 + by, 2.5, 'rgba(120,200,255,0.5)'); v.part(Pcirc(18.4, 10.8 + by, 1.8), '#fff6e0', { lw: 0.8, sh: '#d8c49a', so: 0.3 }); v.line(14.5, 12.8, 17, 11.4, 0.5, 'rgba(255,246,224,0.8)'); }
      if (o.dust) { v.dot(3.2, 15, 0.45, '#fff6e0'); v.dot(5.4, 17.6, 0.4, '#e8d8b0'); v.dot(2, 9.8, 0.4, '#fff6e0'); }
    };
  }
  (function () {
    var F = [polilla({ f: 1, by: -1, dust: true }), polilla({ f: 0.3 }), polilla({ f: -0.55, by: 1, dust: true }), polilla({ f: 0.3 }),
      polilla({ f: 1.15, fold: true, orb: 3, by: -1 }), polilla({ f: -0.5, thrown: true, by: 1 })];
    var dieA = withDie(F, polilla({ f: 0.3 }), 20, 20, { lw: 1.3 });
    addV('enemy_bos_polilla', 20, 20, F, { lw: 1.3 }, { fly: { f: [0, 1, 2, 3], fps: 14 }, idle: { f: [0, 1, 2, 3], fps: 14 }, charge: { f: [4], fps: 1 }, throw: { f: [5, 0], fps: 8 }, die: dieA });
  })();

  // ------------------------------------------------------------ ZAMPONERO 20x24 (fauno con zampona)
  function zamponero(o) {
    return function (v) {
      var by = o.by || 0, x = v.ctx, ar = o.arm || 0;
      // patas peludas con pezunas
      [[7, 0.6], [12, 0]].forEach(function (l) {
        v.part(Prr(l[0] - 1.6, 17.2 + by, 3.4, 4.4, 1.2), '#2a2236', { lw: 1.1, sh: '#17111f', so: 0.3 });
        v.part(Prr(l[0] - 1.8, 20.6, 3.8, 1.8, 0.7), '#e8d8b0', { lw: 0.8, sh: '#b8a478', so: 0.2 });
      });
      // tunica granate
      v.part(Pclosed([[5, 10.4 + by], [14.6, 10.4 + by], [16, 18 + by], [14.2, 19.4 + by], [9.8, 18.4 + by], [5.6, 19.6 + by], [3.8, 18 + by]]), '#8a2a3a', { lw: 1.4, sh: '#5a1426', hi: '#c24a5c', so: 1 });
      v.line(5.4, 14.6 + by, 14.2, 14.6 + by, 0.7, '#e0b040');
      // gola de lana
      v.cluster([Pcirc(6.4, 10.4 + by, 2.3), Pcirc(9.6, 11.2 + by, 2.4), Pcirc(12.8, 10.4 + by, 2.3)], '#f4e8c8', { lw: 1.2, sh: '#c9b78e', hi: '#fffaf0', so: 0.6 });
      // cuernos de cabra
      v.stick([[6.4, 6 + by], [3.6, 3.6 + by], [4.6, 0.8 + by], [7.2, 0.6 + by]], 1.5, '#e8d8b0', { lw: 0.9, hi: '#fff6dc', curve: true });
      v.stick([[12.2, 6 + by], [15, 3.6 + by], [14, 0.8 + by], [11.6, 0.6 + by]], 1.5, '#e8d8b0', { lw: 0.9, hi: '#fff6dc', curve: true });
      // cabeza
      v.part(Pblob(9.4, 7.6 + by, 4.6, 4.2, 91, 0.03), '#d0b890', { lw: 1.4, sh: '#a08860', hi: '#f0e0c0', so: 0.9 });
      v.part(Pblob(12, 9.6 + by, 2.4, 1.8, 92), '#f4e8c8', { lw: 0.8, sh: '#c9b78e', so: 0.3 });
      v.part(Ppoly([[5, 6.6 + by], [2.6, 7.6 + by], [5.4, 8.6 + by]]), '#d0b890', { lw: 0.9, so: 0.2 });
      eyeG(v, 8.2, 7 + by, 0.9); eyeG(v, 11.4, 7 + by, 0.9);
      v.line(10.4, 11.4 + by, 12.6, 11.4 + by, 0.5, OLC);
      // zampona (flauta de pan) delante de la boca
      var zx = 12.6 + ar * 0.4, zy = 12.4 + by + ar;
      if (o.cast === 2) { zx += 0.6; zy -= 1.2; }
      [[0, 4.4], [1.9, 3.4], [3.8, 2.5], [5.7, 1.6]].forEach(function (r, k) { v.part(Prr(zx + r[0], zy + r[1] - 3.4, 1.9, 6.4 - r[1] * 0.6 + 0.8, 0.5), ['#c8a060', '#b88c48', '#d8b070', '#a87a38'][k], { lw: 0.7, sh: '#7a5428', so: 0.3 }); });
      v.line(zx, zy + 0.2, zx + 7.6, zy - 1.6, 0.9, '#8a2a3a');
      if (o.cast) { // notas moradas
        v.dot(17.2, 4.4, 0.8, '#c070e8'); v.dot(18.4, 7.4, 0.6, '#8a3ac8'); v.dot(2.6, 12.4, 0.7, '#c070e8');
        v.line(17.2, 4.4, 17.2, 1.8, 0.6, '#c070e8'); v.line(17.2, 1.8, 18.6, 2.6, 0.6, '#c070e8');
        if (o.cast === 2) { x.strokeStyle = 'rgba(192,112,232,0.9)'; x.lineWidth = 0.8; x.beginPath(); x.arc(10, 12, 9.6, -0.9, 0.9); x.stroke(); }
      }
      // brazo
      v.part(Pblob(8.4 + ar * 0.3, 14.6 + by + ar * 0.5, 1.7, 1.5, 93), '#8a2a3a', { lw: 0.9, sh: '#5a1426', so: 0.3 });
    };
  }
  (function () {
    var F = [zamponero({}), zamponero({ by: 1 }), zamponero({ cast: 1, arm: -0.6, by: 0.5 }), zamponero({ cast: 2, arm: -1.2, by: -0.5 })];
    var dieA = withDie(F, zamponero({}), 20, 24, { lw: 1.4 });
    addV('enemy_bos_zamponero', 20, 24, F, { lw: 1.4 }, { idle: { f: [0, 1], fps: 4 }, cast: { f: [2, 3], fps: 6 }, cast_hold: { f: [3], fps: 1 }, walk: { f: [0, 1], fps: 6 }, die: dieA });
  })();

  // proj_wool_orb 12x12 (base) -> 24x24
  addV('proj_wool_orb', 12, 12, [0, 1].map(function (k) {
    return function (v) {
      var x = v.ctx, i, a;
      x.strokeStyle = '#6ac8ff'; x.lineWidth = 1.1; x.setLineDash([2.4, 1.4]); x.lineDashOffset = k * 1.9; x.beginPath(); x.arc(6, 6, 5.1, 0, TAU); x.stroke(); x.setLineDash([]);
      x.strokeStyle = 'rgba(28,74,152,0.7)'; x.lineWidth = 0.5; x.beginPath(); x.arc(6, 6, 5.6, 0, TAU); x.stroke();
      var W = []; for (i = 0; i < 6; i++) { a = i * TAU / 6 + k * 0.5; W.push(Pcirc(6 + Math.cos(a) * 1.9, 6 + Math.sin(a) * 1.9, 1.7)); }
      W.push(Pcirc(6, 6, 2));
      v.cluster(W, '#f4e8c8', { lw: 0.8, sh: '#c9b78e', hi: '#ffffff', so: 0.5 });
      v.dot(k ? 7.8 : 4.2, 4.6, 0.6, '#ffffff');
    };
  }), { lw: 0.8 }, { loop: { f: [0, 1], fps: 8 } });

  // ======================================================================================================
  //  CRIPTA  (hueso #d8cfae, magma #ff6a1a, hierro #6b7385, violeta oscuro)
  // ======================================================================================================
  var BONE = '#d8cfae', BONE_S = '#a89c78', BONE_H = '#f6f0d8', IRON = '#6b7385', IRON_S = '#474e60', IRON_H = '#9aa4ba', MAG = '#ff6a1a';

  // calavera generica centrada en (0,0) con radio r (se dibuja con ctx trasladado). jaw 0..1, glow color de cuencas
  function skullAt(v, cx, cy, r, o) {
    var x = v.ctx; o = o || {};
    x.save(); x.translate(cx, cy); if (o.rot) x.rotate(o.rot);
    var jaw = o.jaw || 0;
    v.part(Prr(-r * 0.55, r * 0.35 + jaw * r * 0.5, r * 1.1, r * 0.7, 0.8), BONE_S, { lw: v.lw * 0.9, sh: '#7a6e50', so: 0.3 });  // mandibula
    v.part(Pblob(0, -r * 0.1, r, r * 0.92, 71 + (o.seed || 0), 0.03, 10), BONE, { lw: v.lw, sh: BONE_S, hi: BONE_H, so: 0.9 });
    var gc = o.glow || '#ff9a2a';
    v.part(Pblob(-r * 0.36, -r * 0.12, r * 0.3, r * 0.34, 72, 0.04, 7), '#1a1020', { lw: 0.4 });
    v.part(Pblob(r * 0.4, -r * 0.12, r * 0.3, r * 0.34, 73, 0.04, 7), '#1a1020', { lw: 0.4 });
    if (o.x) { v.line(-r * 0.55, -r * 0.3, -r * 0.2, 0.1, 0.7, gc); v.line(-r * 0.2, -r * 0.3, -r * 0.55, 0.1, 0.7, gc); v.line(r * 0.2, -r * 0.3, r * 0.55, 0.1, 0.7, gc); v.line(r * 0.55, -r * 0.3, r * 0.2, 0.1, 0.7, gc); }
    else { v.dot(-r * 0.34, -r * 0.1, r * 0.15, gc); v.dot(r * 0.42, -r * 0.1, r * 0.15, gc); }
    v.part(Ppoly([[-r * 0.08, r * 0.2], [r * 0.12, r * 0.2], [r * 0.02, r * 0.02]]), '#1a1020', { lw: 0.3 });
    for (var i = 0; i < 4; i++) v.line(-r * 0.36 + i * r * 0.24, r * 0.46 + jaw * r * 0.5, -r * 0.36 + i * r * 0.24, r * 0.7 + jaw * r * 0.5, 0.5, '#1b1124');
    x.restore();
  }

  // ------------------------------------------------------------ ESQUELETO 20x22 (con grillete)
  function esqueleto(o) {
    return function (v) {
      var by = o.by || 0, L = o.legs || [0, 0], ar = o.arm || 0, i;
      for (i = 0; i < 2; i++) {
        var lx = (i ? 11.4 : 6.6) + L[i];
        v.stick([[lx, 15.6 + by], [lx + L[i] * 0.3, 18.4], [lx + L[i], 20.4]], 1.5, BONE, { lw: 0.9, hi: BONE_H });
        v.part(Prr(lx + L[i] - 1.4, 19.6, 3.4, 1.6, 0.6), BONE_S, { lw: 0.8, so: 0.2 });
      }
      // paño violeta
      v.part(Ppoly([[6.2, 14.6 + by], [12.8, 14.6 + by], [12.2, 18.2 + by], [9.6, 17 + by], [7, 18.4 + by]]), '#5a3a78', { lw: 1, sh: '#3a2450', so: 0.4 });
      // caja toracica
      v.part(Pblob(9.6, 12.2 + by, 4.6, 4, 61, 0.03), BONE, { lw: 1.3, sh: BONE_S, hi: BONE_H, so: 0.8 });
      for (i = 0; i < 3; i++) v.line(6.4, 10.8 + by + i * 1.6, 12.8, 10.8 + by + i * 1.6, 0.7, '#1b1124');
      v.line(9.6, 9.4 + by, 9.6, 15 + by, 0.6, '#1b1124');
      // brazo con garrote
      var hx = 14.6 + ar * 0.6, hy = 12.6 + by + ar;
      v.stick([[11.8, 10.6 + by], [13.4, 12 + by], [hx, hy]], 1.3, BONE, { lw: 0.8 });
      v.part(Prr(hx - 0.6, hy - 6.4 + (o.club || 0), 2.2, 7.6, 0.8), '#7a5428', { lw: 1, sh: '#4e3418', hi: '#a87a40', so: 0.4 });
      v.part(Pcirc(hx + 0.5, hy - 5.8 + (o.club || 0), 1.5), '#6b7385', { lw: 0.8, sh: IRON_S, so: 0.3 });
      // grillete en la muneca
      v.part(Prr(hx - 1.1, hy - 0.4, 3.2, 1.6, 0.6), IRON, { lw: 0.8, sh: IRON_S, hi: IRON_H, so: 0.3 });
      v.stick([[hx + 0.6, hy + 1.2], [hx + 1.2, hy + 3.4], [hx - 0.2, hy + 5]], 0.6, IRON_H, { lw: 0.5 });
      // craneo
      skullAt(v, 9.8, 6.2 + by, 4.6, { seed: o.k || 0 });
      v.line(5.8, 4.4 + by, 7.2, 3.8 + by, 0.5, '#1b1124');
    };
  }
  (function () {
    var F = [esqueleto({}), esqueleto({ by: 1 })];
    walkFrames(F, function (o) { return esqueleto({ by: o.by, legs: [-o.c * 1.2, o.c * 1.2], arm: o.c * 0.6, club: -o.c * 0.3 }); });
    var dieA = withDie(F, esqueleto({}), 20, 22, { lw: 1.4 });
    addV('enemy_cri_esqueleto', 20, 22, F, { lw: 1.4 }, { idle: { f: [0, 1], fps: 4 }, walk: { f: WALKSEQ, fps: 8 }, die: dieA });
  })();

  // ------------------------------------------------------------ ARQUERO DE HUESOS 22x22 (capucha andrajosa + arco de hueso)
  function arqueroH(o) {
    return function (v) {
      var by = o.by || 0, L = o.legs || [0, 0], x = v.ctx, draw = o.draw || 0;
      // capa andrajosa
      var hm = o.hem || 0;
      v.part(Pclosed([[6.2, 9.8 + by], [12, 9.8 + by], [14.2, 16.4 + by], [13 + hm, 20.4], [10.4, 18.6], [8, 20.6 - hm], [5.4, 18.8], [4.4, 16.4 + by]]), '#4a3a62', { lw: 1.4, sh: '#2e2240', hi: '#6e5a90', so: 1 });
      v.line(8.2, 13 + by, 8, 18 + by, 0.5, '#2e2240'); v.line(11, 13 + by, 11.4, 18 + by, 0.5, '#2e2240');
      for (var i = 0; i < 2; i++) v.part(Prr((i ? 10.4 : 6.2) + L[i] - 0.4, 19.2, 2.2, 2.4, 0.6), BONE, { lw: 0.8, sh: BONE_S, so: 0.2 });
      // capucha con craneo
      v.part(Ppoly([[5, 5.2 + by], [3.2, 1.6 + by], [8.4, 3.2 + by]]), '#4a3a62', { lw: 1, sh: '#2e2240', so: 0.3 });
      v.part(Pblob(9.2, 6.8 + by, 4.9, 4.7, 66, 0.03), '#4a3a62', { lw: 1.4, sh: '#2e2240', hi: '#6e5a90', so: 0.9 });
      v.part(Pblob(10.4, 7.2 + by, 3.4, 3.2, 67), BONE, { lw: 0.9, sh: BONE_S, hi: BONE_H, so: 0.5 });
      v.part(Pblob(9.7, 6.8 + by, 0.9, 1.1, 68), '#1a1020', { lw: 0.3 }); v.part(Pblob(12.6, 6.8 + by, 0.9, 1.1, 69), '#1a1020', { lw: 0.3 });
      v.dot(9.7, 6.9 + by, 0.38, '#ff9a2a'); v.dot(12.6, 6.9 + by, 0.38, '#ff9a2a');
      v.line(9.8, 9.2 + by, 12.4, 9.2 + by, 0.5, OLC);
      // arco de hueso (delante, a la derecha) y cuerda
      var bx = 16.4 + (o.bowx || 0), top = 4 + by, bot = 18.4 + by, pull = draw;
      x.strokeStyle = OLC; x.lineWidth = 3.2; x.beginPath(); x.moveTo(bx - 1.6, top); x.quadraticCurveTo(bx + 4.4, (top + bot) / 2, bx - 1.6, bot); x.stroke();
      x.strokeStyle = BONE; x.lineWidth = 1.7; x.stroke();
      x.strokeStyle = BONE_H; x.lineWidth = 0.5; x.beginPath(); x.moveTo(bx - 1.6, top + 0.4); x.quadraticCurveTo(bx + 3.8, (top + bot) / 2, bx - 1.6, bot - 0.4); x.stroke();
      var my = (top + bot) / 2;
      x.strokeStyle = '#d8d0c0'; x.lineWidth = 0.55; x.beginPath(); x.moveTo(bx - 1.6, top); x.lineTo(bx - 1.6 - pull * 3.6, my); x.lineTo(bx - 1.6, bot); x.stroke();
      // brazo
      v.stick([[10.4, 12 + by], [13, 12.4 + by], [bx + 0.4, my]], 1.3, BONE, { lw: 0.8 });
      v.dot(bx + 0.4, my, 1, BONE_S);
      if (draw > 0) { // flecha encajada
        v.line(bx - 1.6 - pull * 3.6, my, bx + 4.6, my, 0.9, '#7a5428');
        v.part(Ppoly([[bx + 4.2, my - 1.1], [bx + 6.4, my], [bx + 4.2, my + 1.1]]), BONE, { lw: 0.6, sh: BONE_S, so: 0.2 });
        v.dot(bx - pull * 3.6 - 1.2, my, 0.7, '#ff9a2a');
      }
      if (o.fire) { v.line(bx + 7, my - 2.4, bx + 9.2, my - 3.2, 0.6, 'rgba(255,255,255,0.8)'); v.line(bx + 7.2, my + 2.4, bx + 9.4, my + 3.2, 0.6, 'rgba(255,255,255,0.8)'); }
    };
  }
  (function () {
    var F = [arqueroH({}), arqueroH({ by: 1, hem: 0.8 })];
    walkFrames(F, function (o) { return arqueroH({ by: o.by, legs: [-o.c, o.c], hem: o.c * 0.8 }); });
    F.push(arqueroH({ draw: 1, bowx: -0.4, by: 0.5 }));            // 6 aim: cuerda tensa + flecha
    F.push(arqueroH({ draw: 0, bowx: 0.6, fire: true, by: 0 }));   // 7 fire
    var dieA = withDie(F, arqueroH({}), 22, 22, { lw: 1.4 });
    addV('enemy_cri_arquero', 22, 22, F, { lw: 1.4 }, { idle: { f: [0, 1], fps: 4 }, walk: { f: WALKSEQ, fps: 8 }, aim: { f: [6], fps: 1 }, fire: { f: [7], fps: 1 }, shoot: { f: [6, 7, 1], fps: 8 }, die: dieA });
  })();

  // proj_bone_arrow 16x6 (base) -> 32x12
  addV('proj_bone_arrow', 16, 6, [0, 1].map(function (k) {
    return function (v) {
      v.part(Ppoly([[1, 1.2], [3.4, 2.4], [3.4, 3.6], [1, 4.8], [2, 3]]), '#ff9a2a', { lw: 0.5, sh: '#c8501c', so: 0.15 });  // plumas
      v.part(Ppoly([[2.4, 2.2], [11.2, 2.2], [11.2, 3.8], [2.4, 3.8]]), BONE, { lw: 0.6, sh: BONE_S, hi: BONE_H, so: 0.25 });
      v.part(Ppoly([[10.6, 0.8], [15.4, 3], [10.6, 5.2], [11.8, 3]]), '#f6f0d8', { lw: 0.6, sh: BONE_S, so: 0.2 });
      v.dot(k ? 6 : 8, 3, 0.45, '#1b1124');
    };
  }), { lw: 0.6 }, { loop: { f: [0, 1], fps: 10 } });

  // ------------------------------------------------------------ CALAVERA EXPLOSIVA 18x18
  function calExp(o) {
    return function (v) {
      var by = o.by || 0, sw = o.sw || 1, lit = o.lit || 0, x = v.ctx;
      x.save(); x.translate(9, 10.4 + by); x.scale(sw, sw); x.translate(-9, -10.4 - by);
      // mecha (detras)
      v.stick([[9, 3.2 + by], [10.6, 1.4 + by], [9.8, -0.4 + by]], 0.9, '#8a5a30', { lw: 0.8 });
      x.restore();
      x.save(); x.translate(9, 10.4 + by); x.scale(sw, sw); x.translate(-9, -10.4 - by);
      skullAt(v, 9, 10 + by, 6.2, { jaw: o.jaw || 0, glow: lit ? '#ff3b1a' : '#ff9a2a', seed: 5 });
      // grietas de magma
      var gc = o.prime ? '#fff2a0' : lit ? '#ffc83d' : MAG;
      v.line(11.6, 5.6 + by, 13, 8 + by, o.prime ? 1.1 : 0.8, gc); v.line(13, 8 + by, 12, 9.6 + by, o.prime ? 1.1 : 0.8, gc);
      v.line(5.4, 12.6 + by, 7, 14.2 + by, 0.7, gc);
      x.restore();
      // chispa de la mecha
      var sx = 9.8 + (sw - 1) * 1, sy = -0.4 + by + (1 - sw) * 3;
      v.dot(sx, sy + 0.2 - 0.0, lit ? 1.5 : 1, lit ? '#ff6a1a' : '#ffc83d'); v.dot(sx, sy, lit ? 0.8 : 0.5, '#fff6c0');
      if (lit) { v.dot(sx + 2, sy - 0.8, 0.5, '#ffc83d'); v.dot(sx - 1.8, sy - 0.6, 0.45, '#ffc83d'); }
      if (o.prime) { v.ctx.strokeStyle = 'rgba(255,60,30,0.85)'; v.ctx.lineWidth = 1; v.ctx.beginPath(); v.ctx.arc(9, 10.2, 8.4, 0, TAU); v.ctx.stroke(); }
    };
  }
  (function () {
    var F = [calExp({ by: -1, jaw: 0 }), calExp({ by: 0, jaw: 0.5 }), calExp({ by: 0.5, jaw: 0 }), calExp({ by: -0.5, jaw: 0.5 }),
      calExp({ lit: 1, by: -0.5, jaw: 0.4 }), calExp({ lit: 1, by: 0.5, jaw: 0.1, sw: 1.04 }), calExp({ lit: 1, prime: true, sw: 1.16, jaw: 0.7 })];
    var dieA = withDie(F, calExp({}), 18, 18, { lw: 1.4 });
    addV('enemy_cri_calavera_exp', 18, 18, F, { lw: 1.4 }, { walk: { f: [0, 1, 2, 3], fps: 9 }, idle: { f: [0, 1, 2, 3], fps: 9 }, lit: { f: [4, 5], fps: 10 }, prime: { f: [6], fps: 1 }, die: dieA });
  })();

  // ------------------------------------------------------------ CALAVERA RODANTE 24x24
  function calRod(o) {
    return function (v) {
      var by = o.by || 0, x = v.ctx, rot = o.rot || 0, R = 8.4, cx = 12, cy = 12.4 + by;
      if (o.dust) { v.line(0.4, 8, 5, 8, 0.8, 'rgba(210,200,190,0.9)'); v.line(0.4, 12, 3.6, 12, 0.7, 'rgba(210,200,190,0.8)'); v.line(0.6, 16.4, 5.2, 16.4, 0.8, 'rgba(210,200,190,0.9)'); v.line(1.4, 20, 4, 20, 0.6, 'rgba(210,200,190,0.7)'); }
      // sombra del cuerpo de hueso (craneo grande); en rodar gira entero
      x.save(); x.translate(cx, cy); x.rotate(rot); x.translate(-cx, -cy);
      // dientes laterales de hierro (puas) - forma de rueda
      for (var i = 0; i < 6; i++) { var a = i * TAU / 6 + 0.3; v.part(Ppoly([[cx + Math.cos(a - 0.22) * (R - 1), cy + Math.sin(a - 0.22) * (R - 1)], [cx + Math.cos(a) * (R + 2.4), cy + Math.sin(a) * (R + 2.4)], [cx + Math.cos(a + 0.22) * (R - 1), cy + Math.sin(a + 0.22) * (R - 1)]]), IRON, { lw: 0.9, sh: IRON_S, hi: IRON_H, so: 0.3 }); }
      skullAt(v, cx, cy, R, { glow: o.wind ? '#ff3b1a' : '#ff9a2a', x: o.stun, jaw: o.jaw || 0, seed: 9 });
      v.part(Prr(cx - R * 0.9, cy - R * 0.72, R * 1.8, 1.6, 0.6), IRON, { lw: 0.8, sh: IRON_S, hi: IRON_H, so: 0.3 });  // aro de hierro en la frente
      v.dot(cx, cy - R * 0.72 + 0.8, 0.5, IRON_H);
      x.restore();
      if (o.wind) { v.line(12, 21.6, 22, 21.6, 0.7, 'rgba(255,106,26,0.7)'); }
      if (o.stun) { [[6, 2.4], [12, 0.8], [18, 2.6]].forEach(function (s) { v.part(Ppoly([[s[0], s[1] - 1.3], [s[0] + 0.5, s[1] - 0.4], [s[0] + 1.4, s[1]], [s[0] + 0.5, s[1] + 0.4], [s[0], s[1] + 1.3], [s[0] - 0.5, s[1] + 0.4], [s[0] - 1.4, s[1]], [s[0] - 0.5, s[1] - 0.4]]), '#ffe45a', { lw: 0.5, so: 0.1 }); }); }
    };
  }
  (function () {
    var F = [calRod({}), calRod({ by: 1, jaw: 0.4 }), calRod({ by: -1, jaw: 0.3 }), calRod({ by: 0.5, jaw: 0 }),
      calRod({ wind: true, by: 1, rot: -0.35, jaw: 0.5 })];
    for (var k = 0; k < 4; k++) F.push(calRod({ rot: k * Math.PI / 2, dust: true, by: 0.5 }));
    F.push(calRod({ stun: true, rot: 0.3, by: 1.5 }));
    var dieA = withDie(F, calRod({}), 24, 24, { lw: 1.4 });
    addV('enemy_cri_calavera_rod', 24, 24, F, { lw: 1.4 }, {
      idle: { f: [0, 1], fps: 3 }, walk: { f: [2, 3], fps: 5 }, wind: { f: [4], fps: 1 }, roll: { f: [5, 6, 7, 8], fps: 16 }, stun: { f: [9], fps: 1 }, die: dieA
    });
  })();

  // ------------------------------------------------------------ CARCELERO MENOR 26x26 (casco de hierro + puerta de celda como escudo)
  function carcelero(o) {
    return function (v) {
      var by = o.by || 0, bx = o.bx || 0, L = o.legs || [0, 0], x = v.ctx, i;
      for (i = 0; i < 2; i++) {
        v.part(Prr((i ? 14.4 : 8) + L[i] + bx * 0.4, 20.6, 4, 4.4, 1.2), '#4a3430', { lw: 1.3, sh: '#2e1e1c', so: 0.4 });
        v.part(Prr((i ? 14 : 7.6) + L[i] + bx * 0.4, 23.2, 5, 2.2, 0.9), IRON_S, { lw: 1.1, sh: '#262a3c', so: 0.3 });
      }
      // torso cuero + hierro
      v.part(Pblob(12.4 + bx, 16.6 + by, 7.2, 6.4, 81, 0.03), '#6a4638', { lw: 1.6, sh: '#3e2820', hi: '#946858', so: 1.1 });
      v.part(Pblob(12.6 + bx, 14.6 + by, 5.8, 3.6, 82), IRON, { lw: 1, sh: IRON_S, hi: IRON_H, so: 0.6 });
      v.part(Prr(6.6 + bx, 19.6 + by, 11.6, 1.6, 0.5), '#e0b040', { lw: 0.7, sh: '#a07a1c', so: 0.3 });
      // llavero
      v.stick([[7.4 + bx, 20.4 + by], [6.6 + bx, 23 + by]], 0.5, '#c8c0a0', { lw: 0.4 }); v.part(Pcirc(6.4 + bx, 23.4 + by, 1.3), '#e0b040', { lw: 0.6, sh: '#a07a1c', so: 0.2 });
      // casco cubo con ranura naranja
      v.part(Prr(8 + bx, 3.2 + by, 9.6, 10.6, 2.4), IRON, { lw: 1.5, sh: IRON_S, hi: IRON_H, so: 0.9 });
      v.part(Prr(7.4 + bx, 2.4 + by, 10.8, 2.2, 1), IRON_H, { lw: 1, sh: IRON, so: 0.3 });
      v.part(Prr(9.4 + bx, 7 + by, 8.6, 2.2, 0.6), '#1a1020', { lw: 0.4 });
      var ec = o.rec ? '#ffd23a' : MAG;
      v.dot(12 + bx, 8.1 + by, 0.7, ec); v.dot(15.4 + bx, 8.1 + by, 0.7, ec);
      for (i = 0; i < 3; i++) v.dot(10.6 + bx + i * 2.4, 11.6 + by, 0.35, IRON_S);
      v.line(12.8 + bx, 2.6 + by, 12.8 + bx, 6.4 + by, 0.5, IRON_S);
      // puerta de celda (escudo): rectangulo con barrotes
      var sx = 17 + (o.sx || 0), sy = 8.6 + (o.sy || 0) + by, sw = 7.4, sh = o.low ? 8.4 : 12.6;
      if (o.glow) { x.save(); x.strokeStyle = 'rgba(255,150,70,0.9)'; x.lineWidth = 1; x.strokeRect(sx - 1.2, sy - 1.2, sw + 2.4, sh + 2.4); x.restore(); }
      v.part(Prr(sx, sy, sw, sh, 1), IRON_S, { lw: 1.6, sh: '#262a3c', hi: IRON, so: 0.7 });
      for (i = 0; i < 3; i++) v.part(Prr(sx + 1 + i * 2.2, sy + 0.8, 1.2, sh - 1.6, 0.4), '#2a2e3e', { lw: 0.5, sh: '#181a24', hi: IRON_H, so: 0.2 });
      v.part(Prr(sx - 0.4, sy + sh * 0.45, sw + 0.8, 1.4, 0.4), IRON_H, { lw: 0.7, sh: IRON, so: 0.2 });
      v.part(Pcirc(sx + sw * 0.5, sy + sh * 0.7, 1.1), '#e0b040', { lw: 0.6, sh: '#a07a1c', so: 0.2 });
      if (o.hit) { var hx = sx + sw + 0.4, hy = sy + 5; v.part(Ppoly([[hx, hy - 4], [hx + 1.8, hy - 1], [hx + 3.8, hy - 1.8], [hx + 2.6, hy + 0.4], [hx + 4, hy + 2.4], [hx + 1.8, hy + 1.8], [hx + 0.4, hy + 4]]), '#fff6d0', { lw: 0.6, ol: '#c8501c', so: 0.1 }); }
      if (o.rec) { v.dot(5.2, 5.4, 0.45, '#d8f0ff'); v.dot(3.8, 8.2, 0.4, '#d8f0ff'); }
      if (o.dust) { v.line(1, 24, 5, 24, 0.7, 'rgba(210,200,190,0.9)'); v.line(21, 24.4, 25, 24.4, 0.7, 'rgba(210,200,190,0.9)'); }
    };
  }
  (function () {
    var F = [carcelero({}), carcelero({ by: 1 })];
    walkFrames(F, function (o) { return carcelero({ by: o.by, legs: [-o.c, o.c] }); });
    F.push(carcelero({ bx: -2, sx: -2.6, by: 0.5, glow: true }));               // 6 wind
    F.push(carcelero({ bx: 0.8, sx: 1.8, hit: true, legs: [0, 1] }));           // 7 bash
    F.push(carcelero({ sx: -1, sy: 4.4, low: true, by: 1.5, rec: true }));      // 8 rec
    var dieA = withDie(F, carcelero({}), 26, 26, { lw: 1.5 });
    addV('enemy_cri_carcelero', 26, 26, F, { lw: 1.5 }, {
      idle: { f: [0, 1], fps: 4 }, walk: { f: WALKSEQ, fps: 7 }, wind: { f: [6], fps: 1 }, bash: { f: [6, 7, 8], fps: 10 }, rec: { f: [8], fps: 1 }, die: dieA
    });
  })();

  // ------------------------------------------------------------ SALAMANDRA DE LAVA 30x16
  function salamandra(o) {
    return function (v) {
      var ph = o.ph || 0, amp = o.amp == null ? 1 : o.amp, by = o.by || 0, i, n = 10, pts = [];
      for (i = 0; i < n; i++) { var t = i / (n - 1); pts.push([3.4 + t * 18.4, 9.6 + by + Math.sin(ph + t * 4.4) * amp * (0.9 - t * 0.5), 3.1 - Math.abs(t - 0.62) * 2.4 + (t < 0.15 ? -1.4 + t * 9 : 0)]); }
      pts[0][2] = 0.9; pts[1][2] = 1.5;
      // patas
      [[0.36, 1], [0.72, 1]].forEach(function (s, k) {
        var p = pts[Math.round(s[0] * (n - 1))], sw = (o.legs ? o.legs[k] : 0);
        v.part(Prr(p[0] - 1.2 + sw, p[1] + p[2] - 1, 2.6, 3.6, 0.9), '#241820', { lw: 1, sh: '#150e14', so: 0.3 });
        v.part(Prr(p[0] + 0.6 + sw * 0.6, p[1] + p[2] - 0.6, 2.4, 3.2, 0.9), '#241820', { lw: 1, sh: '#150e14', so: 0.3 });
      });
      v.cluster(pts.map(function (p) { return Pcirc(p[0], p[1], p[2]); }), '#3a2a32', { lw: 1.4, sh: '#241820', hi: '#5a4650', so: 0.8 });
      // grietas de magma en el lomo
      pts.forEach(function (p, k) { if (k > 1 && k < n - 1) { v.dot(p[0] - 0.4, p[1] - p[2] * 0.35, 0.6 + (k % 2) * 0.35, MAG); if (k % 3 === 0) v.dot(p[0] + 0.8, p[1] - p[2] * 0.55, 0.4, '#ffc83d'); } });
      // vientre brasa
      v.flat(Pblob(pts[5][0], pts[5][1] + 1.6, 7.4, 1.4, 3, 0.04), '#ff9a2a');
      // cabeza
      var hx = 25.2, hy = pts[n - 1][1] - 0.4;
      v.part(Pblob(hx, hy, 4.3, 3.1, 121, 0.03), '#3a2a32', { lw: 1.4, sh: '#241820', hi: '#5a4650', so: 0.7 });
      v.part(Pblob(hx + 2.6, hy + 1, 2.3, 1.4, 122), '#ff9a2a', { lw: 0.8, sh: '#c8501c', so: 0.3 });
      if (o.open) { v.part(Pblob(hx + 3.4, hy + 1.6, 1.9, 1.2, 123), '#4a0e18', { lw: 0.5 }); v.line(hx + 4.6, hy + 2, hx + 7.2, hy + 3.2, 0.6, '#ff4a2a'); v.line(hx + 4.6, hy + 2, hx + 7, hy + 1.2, 0.6, '#ff4a2a'); }
      eyeG(v, hx + 0.8, hy - 1.1, 0.95, '#ffe45a');
      // cuernitos de roca
      v.part(Ppoly([[hx - 2.4, hy - 2.2], [hx - 4.2, hy - 4.6], [hx - 0.6, hy - 2.8]]), '#241820', { lw: 0.8, so: 0.2 });
      if (o.drip) { v.dot(5, 14.6, 0.7, MAG); v.dot(10.4, 15.1, 0.6, '#ffc83d'); v.dot(16.2, 14.7, 0.6, MAG); }
    };
  }
  (function () {
    var F = [salamandra({ ph: 0, amp: 0.6, drip: true }), salamandra({ ph: 1.4, amp: 0.8, by: 0.4, open: true })], k;
    for (k = 0; k < 4; k++) F.push(salamandra({ ph: PH[WK[k]] + k, amp: 1.5, drip: k % 2 === 0, legs: [wk(k).c, -wk(k).c] }));
    var dieA = withDie(F, salamandra({ ph: 0 }), 30, 16, { lw: 1.4 });
    addV('enemy_cri_salamandra', 30, 16, F, { lw: 1.4 }, { idle: { f: [0, 1], fps: 3 }, slither: { f: WALKSEQ, fps: 8 }, walk: { f: WALKSEQ, fps: 8 }, die: dieA });
  })();

  // ------------------------------------------------------------ GUARDIAN DE CADENAS 28x30
  function chainLoop(v, x0, y0, x1, y1, n, sag) { // cadena de eslabones entre dos puntos
    for (var i = 0; i <= n; i++) {
      var t = i / n, px = x0 + (x1 - x0) * t, py = y0 + (y1 - y0) * t + Math.sin(t * Math.PI) * sag;
      v.part(Pblob(px, py, i % 2 ? 1.2 : 0.8, i % 2 ? 0.8 : 1.2, 130 + i, 0.02, 7), IRON_H, { lw: 0.7, sh: IRON, so: 0.2 });
    }
  }
  function guardian(o) {
    return function (v) {
      var by = o.by || 0, L = o.legs || [0, 0], x = v.ctx, i, bx = o.bx || 0, ar = o.arm || 0;
      // cadena que cuelga a la espalda
      chainLoop(v, 6 + bx, 14 + by, 2.4 + bx - (o.swing || 0), 25 + by, 6, 0);
      // tunica larga violeta
      for (i = 0; i < 2; i++) v.part(Prr((i ? 14 : 9.4) + L[i], 24.4, 4.2, 3.8, 1), IRON_S, { lw: 1.2, sh: '#262a3c', so: 0.3 });
      v.part(Pclosed([[7.6 + bx, 11.6 + by], [18.4 + bx, 11.6 + by], [20.6 + bx, 22 + by], [18 + bx, 26.4], [13.4 + bx, 24.8], [9.4 + bx, 26.6], [6 + bx, 22.4]]), '#5e2a3e', { lw: 1.6, sh: '#381824', hi: '#8e4258', so: 1.2 });
      // cadenas cruzadas al pecho
      chainLoop(v, 8.4 + bx, 13 + by, 18.6 + bx, 23 + by, 7, -1); chainLoop(v, 18.2 + bx, 12.6 + by, 8.8 + bx, 22.4 + by, 7, 1);
      v.part(Pcirc(13.4 + bx, 18 + by, 2), '#e0b040', { lw: 0.9, sh: '#a07a1c', hi: '#ffe08a', so: 0.4 });  // candado
      v.part(Pcirc(13.4 + bx, 18 + by, 0.8), '#1a1020', { lw: 0.3 });
      // hombreras de hierro con puas
      v.part(Pblob(8 + bx, 11.6 + by, 3, 2.2, 141), IRON, { lw: 1.2, sh: IRON_S, hi: IRON_H, so: 0.5 });
      v.part(Pblob(19 + bx, 11.6 + by, 3, 2.2, 142), IRON, { lw: 1.2, sh: IRON_S, hi: IRON_H, so: 0.5 });
      v.part(Ppoly([[7, 10.2 + by], [7.8 + bx, 6.6 + by], [9.2, 10.2 + by]]), IRON_H, { lw: 0.8, so: 0.2 }); v.part(Ppoly([[18, 10.2 + by], [19.2 + bx, 6.8 + by], [20.2, 10.2 + by]]), IRON_H, { lw: 0.8, so: 0.2 });
      // capucha alta con rostro en sombra
      v.part(Ppoly([[8.4 + bx, 6 + by], [11.8 + bx, -0.4 + by], [14.8 + bx, 5.2 + by]]), '#5e2a3e', { lw: 1.2, sh: '#381824', so: 0.4 });
      v.part(Pblob(13.2 + bx, 7 + by, 5.8, 5.6, 143, 0.03), '#5e2a3e', { lw: 1.6, sh: '#381824', hi: '#8e4258', so: 1 });
      v.part(Pblob(14.8 + bx, 7.6 + by, 3.8, 3.4, 144), '#150a22', { lw: 0.5 });
      var ec = o.wind ? '#ff4a2a' : MAG;
      v.part(Prr(13.2 + bx, 6.6 + by, 1.8, 1.1, 0.4), ec, { lw: 0 }); v.part(Prr(16.4 + bx, 6.6 + by, 1.8, 1.1, 0.4), ec, { lw: 0 });
      // brazo y gancho
      if (o.mode === 'wind') { // cadena girando sobre la cabeza
        v.stick([[18 + bx, 12.6 + by], [20.4, 6], [19, 1.4]], 1.5, '#5e2a3e', { lw: 0.9 });
        x.strokeStyle = OLC; x.lineWidth = 2.2; x.beginPath(); x.ellipse(19.6, 2.4, 6, 2.4, -0.2, 0, TAU); x.stroke(); x.strokeStyle = IRON_H; x.lineWidth = 1.2; x.setLineDash([1.6, 1]); x.stroke(); x.setLineDash([]);
        v.part(Ppoly([[25.2, 1.4], [27.4, 3], [25.6, 5], [26.4, 3.2]]), IRON_H, { lw: 0.8, sh: IRON, so: 0.2 });
      } else if (o.mode === 'throw') { // brazo extendido, cadena sale
        var ex = 22 + (o.reach || 0);
        v.stick([[18 + bx, 13 + by], [ex, 14.4 + by]], 1.6, '#5e2a3e', { lw: 0.9 });
        v.part(Pcirc(ex + 0.4, 14.4 + by, 1.3), IRON, { lw: 0.8, sh: IRON_S, so: 0.2 });
        chainLoop(v, ex + 1, 14.4 + by, 28, 14.4 + by, 2, 0);
        if (o.reach) { v.line(26.4, 11.4, 27.8, 10.6, 0.6, '#fff2c0'); v.line(26.4, 17, 27.8, 17.8, 0.6, '#fff2c0'); }
      } else {
        v.stick([[18 + bx, 13 + by], [21.4 + bx, 16.4 + by + ar], [22.6 + bx, 19.4 + by + ar]], 1.6, '#5e2a3e', { lw: 0.9 });
        v.part(Pcirc(22.8 + bx, 19.8 + by + ar, 1.3), IRON, { lw: 0.8, sh: IRON_S, so: 0.2 });
        chainLoop(v, 23 + bx, 20.8 + by + ar, 25.4 + bx, 26.4 + by, 3, 0.4);
        v.part(Ppoly([[24.4 + bx, 26 + by], [27.4 + bx, 27.4 + by], [25.4 + bx, 29 + by]]), IRON_H, { lw: 0.8, sh: IRON, so: 0.2 });
      }
    };
  }
  (function () {
    var F = [guardian({}), guardian({ by: 1, arm: 0.5 })];
    walkFrames(F, function (o) { return guardian({ by: o.by, legs: [-o.c * 1.2, o.c * 1.2], swing: o.c, arm: -o.c * 0.5 }); });
    F.push(guardian({ mode: 'wind', wind: true, bx: -1.2, by: 0.5 }));                       // 6 wind
    F.push(guardian({ mode: 'throw', reach: 0, bx: 0.8, wind: true }), guardian({ mode: 'throw', reach: 1.6, bx: 1, wind: true, by: 0.5 })); // 7-8 throw
    var dieA = withDie(F, guardian({}), 28, 30, { lw: 1.5 });
    addV('enemy_cri_guardian_cadenas', 28, 30, F, { lw: 1.5 }, {
      idle: { f: [0, 1], fps: 3 }, walk: { f: WALKSEQ, fps: 6 }, wind: { f: [6], fps: 1 }, throw: { f: [7, 8], fps: 8 }, die: dieA
    });
  })();

  // proj_chain 24x8 (base) -> 48x16: cabeza de gancho a la derecha, eslabones detras
  addV('proj_chain', 24, 8, [0, 1, 2].map(function (k) {
    return function (v) {
      var i;
      for (i = 0; i < 5; i++) {
        var px = 2.6 + i * 3.8, hz = (i + k) % 2;
        v.part(Pblob(px, 4, hz ? 1.9 : 1.2, hz ? 1.1 : 1.8, 150 + i, 0.02, 7), '#9aa4ba', { lw: 0.8, sh: IRON, hi: '#d0d8e8', so: 0.3 });
        v.dot(px, 4, 0.35, '#1b1124');
      }
      v.part(Ppoly([[17.4, 4], [18, 1], [22.6, 1.6], [23.6, 4], [22.6, 6.4], [18, 7]]), '#c8d0e0', { lw: 0.8, sh: IRON, hi: '#ffffff', so: 0.4 });
      v.part(Ppoly([[20.6, 2], [23.8, 4], [20.6, 6], [21.4, 4]]), '#1a1020', { lw: 0.3 });
      v.dot(19.4, 2.6, 0.45, k === 1 ? '#fff2c0' : '#ff9a2a');
      if (k === 2) { v.line(0.6, 1.4, 3, 1.4, 0.5, 'rgba(255,255,255,0.5)'); v.line(0.6, 6.6, 3.4, 6.6, 0.5, 'rgba(255,255,255,0.5)'); }
    };
  }), { lw: 0.8 }, { loop: { f: [0, 1, 2], fps: 12 } });

  // fx_chain_link 16x16 (base) -> 32x32: eslabon grande azulado (marca de "ralentizado"/impacto de cadena), 1 frame
  addV('fx_chain_link', 16, 16, [function (v) {
    var x = v.ctx;
    x.fillStyle = 'rgba(106,200,255,0.22)'; x.beginPath(); x.arc(8, 8, 7.4, 0, TAU); x.fill();
    v.part(Pblob(8, 8, 6.6, 3.4, 160, 0.02, 12, 0.7), '#9aa4ba', { lw: 1.3, sh: IRON, hi: '#e0e8f4', so: 0.6 });
    v.part(Pblob(8, 8, 4.2, 1.5, 161, 0.02, 10, 0.7), '#150a22', { lw: 0.4 });
    v.part(Pblob(8, 8, 3.4, 6.2, 162, 0.02, 12, 0.7), 'rgba(0,0,0,0)', { lw: 0 });
    x.strokeStyle = '#6ac8ff'; x.lineWidth = 0.8; x.setLineDash([1.8, 1.4]); x.beginPath(); x.arc(8, 8, 7.2, 0, TAU); x.stroke(); x.setLineDash([]);
    v.dot(4.4, 4.8, 0.6, '#ffffff'); v.dot(11.8, 11.4, 0.5, '#d8f4ff');
  }], { lw: 0.8 });

  // ------------------------------------------------------------ ALMA PRISIONERA 22x26
  function alma(o) {
    return function (v) {
      var x = v.ctx, by = o.by || 0, w = o.w || 0, al = o.al == null ? 0.9 : o.al, mode = o.mode;
      if (o.ring) { x.save(); x.globalAlpha = 0.85; x.strokeStyle = OLC; x.lineWidth = 2.3; x.beginPath(); x.ellipse(11, 24, 8.6, 2.5, 0, 0, TAU); x.stroke(); x.strokeStyle = '#ff9a2a'; x.lineWidth = 1.1; x.setLineDash([2.2, 1.4]); x.stroke(); x.restore(); }
      x.globalAlpha = al;
      // cola de espiritu
      v.part(Pclosed([[5.6, 10.4 + by], [15.6, 10.4 + by], [17.4, 19 + by], [15.6, 23.6 + by + w], [13, 21 + by], [10.6, 25 + by - w], [8, 21.4 + by], [5.6, 24 + by + w], [4.2, 19 + by]]), '#b8c8dc', { lw: 1.4, sh: '#8294b4', hi: '#e8f0fa', so: 1.1 });
      // franjas de uniforme de preso
      for (var i = 0; i < 3; i++) v.line(5.4 + i * 0.4, 13.6 + i * 3, 16.4 - i * 0.4, 13.6 + i * 3, 0.9, '#5a6a8c');
      // cabeza redonda con ojos tristes (cuencas) y sin capucha
      v.part(Pblob(10.8, 6.8 + by, 5.2, 5.1, 171, 0.03), '#d0dcec', { lw: 1.4, sh: '#8294b4', hi: '#f4f8ff', so: 0.9 });
      v.part(Pblob(9.2, 6.6 + by, 1.3, 1.7, 172), '#1a1a2e', { lw: 0.4 }); v.part(Pblob(13, 6.6 + by, 1.3, 1.7, 173), '#1a1a2e', { lw: 0.4 });
      v.dot(9.4, 6.9 + by, 0.5, '#ffffff'); v.dot(13.2, 6.9 + by, 0.5, '#ffffff');
      v.part(Pblob(11.2, 10.4 + by, 1.2, 0.7, 174), '#1a1a2e', { lw: 0.3 });
      v.line(7.6, 4.6 + by, 9.8, 5.2 + by, 0.5, '#5a6a8c'); v.line(14.4, 4.6 + by, 12.4, 5.2 + by, 0.5, '#5a6a8c');
      // brazo con grillete y cadena rota
      var hx = 16.6, hy = 14.6 + by;
      if (mode === 'wind') { hx = 4; hy = 6; } else if (mode === 'hit') { hx = 20.4; hy = 19.4; }
      v.stick([[14.4, 12.6 + by], [(14.4 + hx) / 2 + 1, (12.6 + hy) / 2 + 1], [hx, hy]], 1.8, '#b8c8dc', { lw: 1 });
      v.part(Prr(hx - 1.5, hy - 1.2, 3.4, 2.4, 0.9), IRON, { lw: 0.9, sh: IRON_S, hi: IRON_H, so: 0.3 });
      if (mode === 'wind') { chainLoop(v, hx - 1, hy + 1, 1.4, 14, 4, -1.4); }
      else if (mode === 'hit') { chainLoop(v, hx - 1, hy + 1, 4, 22, 5, 0); x.globalAlpha = 1; x.strokeStyle = 'rgba(255,255,255,0.95)'; x.lineWidth = 1.4; x.beginPath(); x.arc(5, 4, 17, 0.1, 1.2); x.stroke(); x.strokeStyle = 'rgba(255,200,150,0.6)'; x.lineWidth = 0.8; x.beginPath(); x.arc(5, 4, 19, 0.2, 1.1); x.stroke(); x.globalAlpha = al; }
      else chainLoop(v, hx, hy + 1.2, hx - 0.6, hy + 7, 3, 0.8);
      x.globalAlpha = 1;
    };
  }
  (function () {
    var F = [alma({}), alma({ by: 1, w: 0.8 }), alma({ al: 0.4, ring: true, by: 0.5 }), alma({ al: 0.15, ring: true, by: 1, w: 0.8 }),
      alma({ mode: 'wind', al: 1 }), alma({ mode: 'hit', al: 1, w: 0.6 })];
    var dieA = withDie(F, alma({}), 22, 26, { lw: 1.4 });
    addV('enemy_cri_alma', 22, 26, F, { lw: 1.4 }, { float: { f: [0, 1], fps: 5 }, idle: { f: [0, 1], fps: 5 }, fade: { f: [2, 3], fps: 10 }, slash: { f: [4, 5, 0], fps: 12 }, die: dieA });
  })();

  // ------------------------------------------------------------------------------------------ indice
  A.FAM1 = {
    bosque: ['enemy_bos_cordero', 'enemy_bos_zarzal', 'enemy_bos_perro', 'enemy_bos_polilla', 'enemy_bos_zamponero', 'proj_wool_orb'],
    cripta: ['enemy_cri_esqueleto', 'enemy_cri_arquero', 'enemy_cri_calavera_exp', 'enemy_cri_calavera_rod', 'enemy_cri_carcelero', 'enemy_cri_salamandra',
      'enemy_cri_guardian_cadenas', 'enemy_cri_alma', 'proj_bone_arrow', 'proj_chain', 'fx_chain_link']
  };
})();
