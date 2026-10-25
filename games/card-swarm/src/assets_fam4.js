/*!
 * assets_fam4.js - Arte P5: PANAL (DESIGN-v5-biomas.md B.0, B.4 mundo, B.6 familia de 9 monstruos, C.4-C; DESIGN-v6-minijefes.md 5: Reina Joven y Avispon Real).
 * NO incluye a Melaria (jefa = P6, assets_boss4.js). Se carga DESPUES de assets_mini2.js (usa Assets._h). Contrato exacto: ASSETS_API.md, seccion "Panal P5".
 * Misma gramatica que fam1/fam3/mini*: contorno grueso #1b1124, color plano + 1 sombra + 1 brillo, miran a la DERECHA. Tamano base x2 = final.
 * Todo se precompone una vez al cargar (offscreen): en juego el dibujo es un drawImage.
 * Paleta: ambar #f3a31f, negro #2a1b10, cera #f0d98a, miel (oscura, NUNCA dorado puro) #c97a14, alas translucidas #e9f4ff.
 * Acentos: obrera mandibulas marfil y saco de polen; aguijonera naranja rojizo con aguijon palido; larva crema con mecha de cera; zangano pardo con ojos
 * enormes azul oscuro; guardia armadura de cera y escudo hexagonal; babosa miel translucida con ojos en tallo; polinizador crema con verde palido y flor rosa;
 * avispa limon y negro, delgada y diagonal; nodriza crema con abdomen de celdas y morado.
 */
(function () {
  'use strict';
  var A = window.Assets, H = A && A._h;
  if (!H || !H.reg) { if (window.console) console.error('assets_fam4: falta Assets._h (cargar tras assets.js)'); return; }
  var addV = H.addV, Pclosed = H.Pclosed, Ppoly = H.Ppoly, Pblob = H.Pblob, Prr = H.Prr, Pcirc = H.Pcirc;
  var dyingFrames = H.dyingFrames, PH = H.PH, OLC = H.OLC, mkCanvas = H.mkCanvas;
  var TAU = 6.2832, sin = Math.sin, cos = Math.cos, PI = Math.PI, abs = Math.abs;
  var AMB = '#f3a31f', AMB_S = '#b8691a', AMB_H = '#ffd070', BLK = '#2a1b10', BLK_H = '#5a3d22';
  var WAX = '#f0d98a', WAX_S = '#c9a850', WAX_H = '#fff3c8', WAXD = '#7a4a14';
  var HON = '#c97a14', HON_S = '#8a4e0a', HON_H = '#f0b040';
  var WING = '#e9f4ff', WING_S = '#b4cce4';
  var CREAM = '#f6ecd0', CREAM_S = '#d2bc86';

  var WK = [1, 2, 4, 5], WALKSEQ = [0, 2, 1, 3, 4, 5];
  function wk(k) { var p = PH[WK[k]]; return { c: Math.round(cos(p)), by: -(abs(sin(p)) > 0.8 ? 1 : 0), p: p }; }
  function withDie(fr, draw, w, h, opt, o) {
    var d0 = fr.length;
    dyingFrames(draw, w, h, opt, o).forEach(function (f) { fr.push(f); });
    return { f: [d0, d0 + 1, d0 + 2, d0 + 3, d0 + 4], fps: 9, loop: false };
  }
  function glow(X, x, y, r, rgb, a) {
    var g = X.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, 'rgba(' + rgb + ',' + a + ')'); g.addColorStop(1, 'rgba(' + rgb + ',0)');
    X.fillStyle = g; X.beginPath(); X.arc(x, y, r, 0, TAU); X.fill();
  }
  function spikes(cx, cy, rx, ry, n, amp, seed, rot) { // contorno "peludo" (poligono de radios alternos)
    var pts = [], i, r = H.rrand(seed || 1);
    for (i = 0; i < n * 2; i++) {
      var a = i / (n * 2) * TAU + (rot || 0), k = (i % 2 ? 1 : 1 + amp) * (1 + (r() - 0.5) * 0.12);
      pts.push([cx + cos(a) * rx * k, cy + sin(a) * ry * k]);
    }
    return Ppoly(pts);
  }
  function star(v, x, y, r, col) { var pts = [], i; for (i = 0; i < 10; i++) { var a = i / 10 * TAU - 0.3, rr = i % 2 ? r * 0.45 : r; pts.push([x + cos(a) * rr, y + sin(a) * rr]); } v.part(Ppoly(pts), col, { lw: 0.6, so: 0.1 }); }
  function hexP(cx, cy, r, rot) { var p = [], i; for (i = 0; i < 6; i++) p.push([cx + cos(i * PI / 3 + (rot || 0)) * r, cy + sin(i * PI / 3 + (rot || 0)) * r]); return Ppoly(p); }
  // ala translucida: raiz (x,y), angulo (rad, 0 = derecha, -PI/2 = arriba), largo, ancho
  function wing(v, x, y, ang, len, wid, al, tone) {
    var X = v.ctx, cx = x + cos(ang) * len / 2, cy = y + sin(ang) * len / 2;
    X.globalAlpha = al == null ? 0.78 : al;
    v.part(Pblob(cx, cy, len / 2, wid / 2, ((x * 7 + y * 3 + len) | 0) + 11, 0.02, 9, ang), tone || WING, { lw: 1, sh: WING_S, hi: '#ffffff', so: 0.5 });
    X.globalAlpha = 1;
    v.line(x, y, x + cos(ang) * len * 0.85, y + sin(ang) * len * 0.85, 0.4, 'rgba(80,100,130,0.5)');
  }
  // ojo compuesto grande
  function beye(v, x, y, rx, ry, col, rot, hl) {
    v.part(Pblob(x, y, rx, ry, ((x * 5 + y) | 0) + 3, 0.02, 8, rot || 0), col, { lw: 0.8, so: 0 });
    v.dot(x - rx * 0.3, y - ry * 0.34, Math.min(rx, ry) * 0.34, hl || '#ffffff');
  }
  function rp(o, u, w) { return [o.x + u * cos(o.a) - w * sin(o.a), o.y + u * sin(o.a) + w * cos(o.a)]; }
  // abdomen orientable: base (x,y), angulo a, largo len, grosor th, bandas (u), aguijon st. Sombra y brillo siempre en el mismo sentido.
  function abd(v, o) {
    var X = v.ctx, c = rp(o, o.len / 2, 0), lw = o.lw == null ? 1.5 : o.lw, path = Pblob(c[0], c[1], o.len / 2, o.th / 2, o.seed || 5, 0.03, 10, o.a), i;
    if (o.st) v.part(Ppoly([rp(o, o.len - 1.2, -o.th * 0.17), rp(o, o.len + o.st, 0), rp(o, o.len - 1.2, o.th * 0.17)]), o.stc || '#3a2a18', { lw: 1, so: 0.1 });
    v.part(path, o.col, { lw: lw, sh: o.sh, hi: o.hi, so: o.so == null ? 0.8 : o.so });
    if (o.bands) {
      X.save(); X.beginPath(); path(X); X.clip(); X.fillStyle = o.bcol || BLK;
      for (i = 0; i < o.bands.length; i++) { var u = o.bands[i], w = (o.bw || 1.6) / 2; X.beginPath(); [rp(o, u - w, -o.th), rp(o, u + w, -o.th), rp(o, u + w, o.th), rp(o, u - w, o.th)].forEach(function (p, k) { X[k ? 'lineTo' : 'moveTo'](p[0], p[1]); }); X.fill(); }
      X.restore(); v.outline(path, lw, OLC);
    }
    return path;
  }
  function thinLeg(v, pts, col) { v.stick(pts, 1.1, col || '#4a3220', { lw: 0.8, curve: true }); }

  // ======================================================================================================
  //  1. OBRERA 18x18 (worm) -- abeja obrera que corre: abdomen rayado, torax peludo, mandibulas marfil y saco de polen
  // ======================================================================================================
  function obrera(o) {
    return function (v) {
      var by = o.by || 0, c = o.c || 0, op = o.open || 0, i;
      var lx = [5.2, 8.8, 12.2];
      for (i = 0; i < 3; i++) { var s = (i % 2 ? 1 : -1) * c; thinLeg(v, [[lx[i], 12.6 + by], [lx[i] + 0.8 + s * 1.4, 14.8], [lx[i] + 0.2 + s * 1.9, 16.3]], i === 1 ? '#6a4a30' : '#4a3220'); }
      v.part(Pcirc(4.6 - c * 0.5, 15, 1.6), '#ffe45a', { lw: 0.9, sh: '#d8a82a', hi: '#fffbb0', so: 0.3 }); // saco de polen
      wing(v, 10, 7.6 + by, PI + 0.5 + (o.wf || 0), 8, 4.2, 0.72);
      abd(v, { x: 8.6, y: 10.6 + by, a: PI + 0.06, len: 7, th: 7.2, col: AMB, sh: AMB_S, hi: AMB_H, bands: [2.8, 5.4], bw: 1.6, st: 1.3, seed: 31 });
      v.part(spikes(11, 10.2 + by, 3.4, 3.4, 11, 0.1, 32), '#d89a3a', { lw: 1.3, sh: '#a0702a', hi: '#f0cc8a', so: 0.7 });
      // cabeza
      v.stick([[14.4, 6.8 + by], [13.8, 4.6 + by], [15.2, 3.2 + by]], 0.7, BLK, { lw: 0.7 }); v.dot(15.3, 3.1 + by, 0.8, AMB_H);
      v.part(Pblob(14.4, 9.4 + by, 3, 3, 33, 0.03), AMB, { lw: 1.4, sh: AMB_S, hi: AMB_H, so: 0.7 });
      beye(v, 15.2, 8.6 + by, 1.6, 1.9, '#241810', 0.2);
      v.part(Ppoly([[15.8, 11.2 + by], [17.4, 10.6 + by + op * 0.4], [16.6, 12.4 + by + op]]), '#fff6da', { lw: 0.7, so: 0 });
      v.part(Ppoly([[14.2, 12 + by], [16, 12.2 + by + op * 1.2], [15, 13.4 + by + op * 0.6]]), '#fff6da', { lw: 0.6, so: 0 });
    };
  }
  (function () {
    var F = [obrera({}), obrera({ by: 0.7, open: 0.8, wf: -0.2 })], k;
    for (k = 0; k < 4; k++) { var q = wk(k); F.push(obrera({ by: q.by * 0.8, c: q.c, wf: k % 2 ? 0.2 : -0.1 })); }
    var dieA = withDie(F, obrera({}), 18, 18, { lw: 1.3 });
    addV('enemy_pan_obrera', 18, 18, F, { lw: 1.3 }, { idle: { f: [0, 1], fps: 4 }, walk: { f: WALKSEQ, fps: 9 }, die: dieA });
  })();

  // ======================================================================================================
  //  2. ABEJA AGUIJONERA 22x22 (archer, vuela) -- naranja rojizo, aguijon que se curva hacia delante para apuntar
  // ======================================================================================================
  function aguij(o) {
    return function (v) {
      var X = v.ctx, by = (o.by || 0) - 1.6, wa = o.wa == null ? 0.4 : o.wa, ang = o.ang == null ? PI - 0.62 : o.ang, aim = o.aim;
      wing(v, 11, 8 + by, -PI * 0.8 - wa * 0.45, 9.4, 4.4, 0.72);
      wing(v, 12, 8 + by, -PI * 0.56 - wa * 0.7, 8.6, 4, 0.82);
      // patas
      thinLeg(v, [[10.4, 14 + by], [10, 16.4 + by], [10.6, 18 + by]]); thinLeg(v, [[12.6, 14.2 + by], [12.8, 16.6 + by], [13.8, 17.8 + by]]);
      abd(v, { x: 8.6, y: 12.4 + by, a: ang, len: 8.2, th: 6.4, col: '#e8741a', sh: '#a8420e', hi: '#ffa850', bands: [3.2, 6.4], bw: 1.7, st: aim ? 3.6 : 2.8, stc: aim ? '#fff4b0' : '#3a2a18', seed: 41 });
      if (aim) { var tp = rp({ x: 8.6, y: 12.4 + by, a: ang }, 8.2 + 3.6, 0); glow(X, tp[0], tp[1], 3.4, '255,240,150', 0.85); v.dot(tp[0], tp[1], 0.8, '#ffffff'); }
      v.part(spikes(12, 11.4 + by, 3.9, 3.7, 11, 0.1, 42), '#3a2418', { lw: 1.4, sh: '#1e120a', hi: '#6a4a30', so: 0.7 });
      v.part(Pblob(16.6, 10.8 + by, 3.6, 3.5, 43, 0.03), '#e8741a', { lw: 1.4, sh: '#a8420e', hi: '#ffa850', so: 0.7 });
      beye(v, 17.6, 10 + by, 1.9, 2.3, '#241810', 0.2, '#e8ff8a'); v.dot(18, 10.6 + by, 0.7, '#e8ff6a');
      v.stick([[16.4, 7.6 + by], [16.8, 5 + by], [18.6, 3.8 + by]], 0.7, BLK, { lw: 0.7 }); v.dot(18.7, 3.7 + by, 0.8, '#ffa850');
      v.line(18.4, 12.6 + by, 20.4, 12.4 + by, 0.7, OLC);
      if (o.flash) { var fp = rp({ x: 8.6, y: 12.4 + by, a: ang }, 12.6, 0); star(v, fp[0] + 1.2, fp[1], 3, '#fff6b0'); v.dot(fp[0] + 1.2, fp[1], 1, '#ffffff'); }
    };
  }
  (function () {
    var F = [aguij({}), aguij({ by: -0.8, wa: 0.9 })], k, was = [0.9, 0.1, -0.5, 0.2];
    for (k = 0; k < 4; k++) F.push(aguij({ by: [-0.6, 0.2, -0.4, 0.4][k], wa: was[k] }));
    F.push(aguij({ aim: true, ang: 0.42, by: -0.2, wa: 0.3 }));                         // 6 aim
    F.push(aguij({ aim: true, ang: 0.3, flash: true, by: -0.6, wa: 0.7 }));             // 7 shoot (destello)
    F.push(aguij({ ang: 0.95, by: 0.2, wa: 0 }));                                       // 8 recupera
    var dieA = withDie(F, aguij({}), 22, 22, { lw: 1.4 });
    addV('enemy_pan_aguijonera', 22, 22, F, { lw: 1.4 }, { idle: { f: [0, 1], fps: 4 }, fly: { f: [2, 3, 4, 5], fps: 14 }, walk: { f: [2, 3, 4, 5], fps: 14 }, aim: { f: [6], fps: 1 }, shoot: { f: [7, 8], fps: 8 }, die: dieA });
  })();

  // ======================================================================================================
  //  3. LARVA EXPLOSIVA 18x14 -- oruga de cera crema con saco de miel en el lomo y una mecha de cera
  // ======================================================================================================
  function larva(o) {
    return function (v) {
      var X = v.ctx, ph = o.ph || 0, sw = o.sw || 1, hot = o.hot || 0, by = 9.2, cx = [3.4, 6.6, 9.8, 12.8], rr = [2.6, 3.3, 3.7, 3.2], i, ys = [];
      var col = hot > 1 ? '#fff0b0' : hot ? '#ffd890' : CREAM, sh = hot > 1 ? '#ffb040' : hot ? '#e8a040' : CREAM_S;
      for (i = 0; i < 4; i++) ys.push(by - abs(sin(ph + i * 0.9)) * 1.2);
      // mecha de cera sobre el 3er segmento
      var wx = 9.6, wy = ys[2] - rr[2] * 0.82 * sw;
      v.stick([[wx, wy + 0.8], [wx + 0.1, wy - 1.8]], 1, '#5a3a22', { lw: 0.7 });
      if (o.flame) {
        var fh = 1.6 + o.flame * 0.9;
        glow(X, wx + 0.1, wy - 3, o.flame > 1 ? 5 : 3.6, '255,170,50', 0.6);
        v.part(Pclosed([[wx - 1.3, wy - 2.2], [wx - 0.7, wy - 2.6 - fh * 0.8], [wx + 0.2, wy - 2.2 - fh * 1.7], [wx + 1.0, wy - 2.8 - fh * 0.8], [wx + 1.4, wy - 2.2], [wx + 0.1, wy - 1.3]]), '#ff9a1a', { lw: 0.8, ol: '#7a2a08', hi: '#ffd860', so: 0.2 });
        v.dot(wx + 0.1, wy - 2.4, 0.7, '#fff6c0');
      }
      for (i = 0; i < 4; i++) {
        var yy = ys[i], r = rr[i] * (i === 1 && o.sw ? sw : sw);
        v.part(Pblob(cx[i], yy, r, r * 0.96, 51 + i, 0.03, 9), col, { lw: 1.3, sh: sh, hi: hot > 1 ? '#ffffff' : '#ffffff', so: 0.7 });
        v.line(cx[i] - r * 0.4, yy - r * 0.6, cx[i] + r * 0.2, yy - r * 0.9, 0.5, 'rgba(120,80,30,0.45)');
      }
      // celdas de miel en el lomo
      [[6.8, ys[1] - 1.2, 1.2], [10, ys[2] - 1.8, 1.4], [12.6, ys[3] - 1.4, 1]].forEach(function (c, k) { v.part(hexP(c[0], c[1], c[2] * sw, 0.52), hot ? '#fff6a0' : '#e8921a', { lw: 0.6, sh: hot ? '#ffc040' : HON, so: 0.3 }); });
      // cabeza
      v.part(Pblob(15.4, ys[3] + 0.2, 2.7, 2.6, 57, 0.03), '#e08a20', { lw: 1.3, sh: AMB_S, hi: AMB_H, so: 0.6 });
      v.dot(16.4, ys[3] - 0.5, 1.2, '#241810'); v.dot(16, ys[3] - 0.9, 0.4, '#ffffff');
      v.part(Ppoly([[16.8, ys[3] + 1.2], [18, ys[3] + 1.8], [16.8, ys[3] + 2.4]]), '#fff6da', { lw: 0.6, so: 0 });
      if (hot > 1) { // prime: grietas brillantes y chispas
        X.strokeStyle = '#ffffff'; X.lineWidth = 0.7; X.beginPath(); X.moveTo(5.6, ys[1] - 2); X.lineTo(7, ys[1]); X.lineTo(6, ys[1] + 2); X.moveTo(10, ys[2] - 2.4); X.lineTo(9, ys[2]); X.lineTo(10.6, ys[2] + 2.2); X.stroke();
        v.dot(1.4, 4.4, 0.6, '#ffe45a'); v.dot(17, 2.6, 0.6, '#ffb040'); v.dot(2.4, 8, 0.5, '#fff6c0');
      }
    };
  }
  (function () {
    var F = [], k;
    for (k = 0; k < 4; k++) F.push(larva({ ph: k * 1.57, sw: 1 + (k % 2) * 0.04 }));               // 0-3 crawl
    F.push(larva({ hot: 1, flame: 1, ph: 0.5, sw: 1.04 }), larva({ hot: 1, flame: 1.6, ph: 2, sw: 1.07 })); // 4-5 lit
    F.push(larva({ hot: 2, flame: 2, ph: 1, sw: 1.14 }));                                                  // 6 prime
    var dieA = withDie(F, larva({ ph: 0 }), 18, 14, { lw: 1.3 });
    addV('enemy_pan_larva', 18, 14, F, { lw: 1.3 }, { idle: { f: [0, 1, 2, 3], fps: 5 }, crawl: { f: [0, 1, 2, 3], fps: 9 }, walk: { f: [0, 1, 2, 3], fps: 9 }, lit: { f: [4, 5], fps: 10 }, prime: { f: [6], fps: 1 }, die: dieA });
  })();

  // ======================================================================================================
  //  4. ZANGANO 28x24 (boar, vuela) -- macho corpulento pardo, ojos enormes azul oscuro, sin aguijon
  // ======================================================================================================
  function zangano(o) {
    return function (v) {
      var X = v.ctx, by = o.by || 0, wa = o.wa == null ? 0.4 : o.wa, tilt = o.tilt || 0, hd = o.hd || 0, i;
      X.save(); X.translate(15, 13); X.rotate(tilt); X.translate(-15, -13);
      var wb = o.wb == null ? 0 : o.wb; // 1 = alas pegadas hacia atras
      wing(v, 15.6, 8.6 + by, wb ? PI + 0.18 : -PI * 0.82 - wa * 0.45, 12.4, 5.6, 0.72);
      wing(v, 17, 8.8 + by, wb ? PI + 0.04 : -PI * 0.6 - wa * 0.7, 11, 5.2, 0.82);
      thinLeg(v, [[15, 17.4 + by], [14.4, 20 + by], [15.2, 21.6 + by]]); thinLeg(v, [[18, 17.8 + by], [18.2, 20.6 + by], [19.4, 21.8 + by]]); thinLeg(v, [[20.4, 16.8 + by], [21.8, 19.4 + by], [22.8, 20.6 + by]]);
      abd(v, { x: 13, y: 13.2 + by, a: PI + 0.08, len: 11, th: 10, col: '#8a5a2a', sh: '#5a3414', hi: '#b4824a', bands: [3, 6.2], bw: 1.9, bcol: '#d6a05a', seed: 61, lw: 1.6 });
      v.part(spikes(18.4, 12.6 + by, 5.6, 5.3, 12, 0.09, 62), '#d6a05a', { lw: 1.5, sh: '#a0703a', hi: '#f0cc8a', so: 0.9 });
      v.stick([[23.4, 8.6 + by + hd], [22.8, 5.6 + by + hd], [24, 3.8 + by + hd]], 0.9, BLK, { lw: 0.8 }); v.dot(24.1, 3.7 + by + hd, 1.1, '#d6a05a');
      v.part(Pblob(23.6, 12.6 + by + hd, 3.8, 4.2, 63, 0.03), '#6a4020', { lw: 1.5, sh: '#3e2410', hi: '#9a6a3a', so: 0.8 });
      beye(v, 24.2, 11.2 + by + hd, 2.9, 3.6, '#2a3a78', 0.1, '#9ad8ff');
      X.strokeStyle = '#5a7ae8'; X.lineWidth = 0.6; X.beginPath(); X.arc(24.4, 11.2 + by + hd, 2.2, 0.3, 1.9); X.stroke();
      if (o.dizzy) { X.strokeStyle = OLC; X.lineWidth = 0.9; X.beginPath(); X.moveTo(22.8, 9.6 + by + hd); X.lineTo(26, 13 + by + hd); X.moveTo(26, 9.6 + by + hd); X.lineTo(22.8, 13 + by + hd); X.stroke(); }
      v.line(25.6, 15 + by + hd, 27.2, 14.6 + by + hd, 0.7, OLC);
      X.restore();
      if (o.lines) { v.line(0.2, 8, 7, 8, 0.8, 'rgba(255,240,200,0.9)'); v.line(0.6, 13, 5, 13, 0.8, 'rgba(255,240,200,0.7)'); v.line(0.4, 18, 6.4, 18, 0.7, 'rgba(255,240,200,0.6)'); if (o.lines > 1) v.line(2, 4.6, 8, 4.6, 0.7, 'rgba(255,240,200,0.6)'); }
      if (o.sweat) { v.dot(2.6, 5, 0.6, '#cfeeff'); v.dot(5, 3.4, 0.5, '#cfeeff'); }
      if (o.dizzy) { star(v, 17, 3.2, 2, '#ffe45a'); star(v, 24, 1.6, 1.7, '#fff6b0'); star(v, 10, 4, 1.5, '#ffd070'); }
    };
  }
  (function () {
    var F = [zangano({}), zangano({ by: -0.9, wa: 0.9 })], k, was = [0.9, 0.2, -0.5, 0.2];
    for (k = 0; k < 4; k++) F.push(zangano({ by: [-0.6, 0.2, -0.4, 0.4][k], wa: was[k] }));
    F.push(zangano({ tilt: -0.2, hd: 1.4, by: 0.6, wa: 1, sweat: true }));                       // 6 wind: se echa atras y agacha la cabeza
    F.push(zangano({ tilt: 0.1, hd: 1.2, wb: 1, lines: 1 }));                                    // 7 charge A
    F.push(zangano({ tilt: 0.08, hd: 1.6, wb: 1, lines: 2, by: 0.4 }));                          // 8 charge B
    F.push(zangano({ tilt: -0.16, hd: 1, by: 0.8, wa: -0.6, dizzy: true }));                     // 9 stun
    var dieA = withDie(F, zangano({}), 28, 24, { lw: 1.5 });
    addV('enemy_pan_zangano', 28, 24, F, { lw: 1.5 }, { idle: { f: [0, 1], fps: 4 }, fly: { f: [2, 3, 4, 5], fps: 14 }, walk: { f: [2, 3, 4, 5], fps: 14 }, wind: { f: [6], fps: 1 }, charge: { f: [7, 8], fps: 12 }, stun: { f: [9], fps: 1 }, die: dieA });
  })();

  // ======================================================================================================
  //  5. GUARDIA DE CERA 26x26 (shield) -- soldado de armadura de cera crema y casco ambar con un gran escudo hexagonal de panal (se funde con Fuego)
  // ======================================================================================================
  function shield(v, px, py, o) { // escudo de cera en pie delante de la guardia; centro (px,py), alto ~21, ancho ~8
    o = o || {}; var X = v.ctx, sc = o.sc || 1;
    X.save(); X.translate(px, py); X.rotate(o.rot || 0); X.scale(sc, sc);
    var m = o.melt;
    v.part(Ppoly([[-1.2, -10.4], [3.8, -6.4], [4, 6], [-0.6, 10.6], [-4, 5.8], [-3.8, -6.6]]), m ? '#e8cf74' : WAX, { lw: 1.7, sh: m ? '#b8862c' : WAX_S, hi: WAX_H, so: 1 });
    X.strokeStyle = WAXD; X.lineWidth = 0.7;
    [[-0.2, -5.2], [0.4, 0.2], [-0.2, 5.6]].forEach(function (c) { X.beginPath(); hexP(c[0], c[1], 2.5, 0.52)(X); X.stroke(); });
    v.dot(0, 0.2, 0.9, m ? '#d89a2a' : HON_H);
    if (m) {
      X.strokeStyle = OLC; X.lineWidth = 0.9; X.beginPath(); X.moveTo(-3.6, -3.8); X.lineTo(0.2, -1.2); X.lineTo(-1.4, 2); X.lineTo(2.8, 4.6); X.moveTo(0.2, -1.2); X.lineTo(3, -4.2); X.stroke();
      var d = o.drip || 0;
      [[3.6, 4 + d, 0.9], [-4.2, 7 + d * 0.6, 0.8], [0.6, 11 + d, 0.9]].forEach(function (p) { v.part(Pclosed([[p[0], p[1] - p[2] * 1.6], [p[0] + p[2], p[1]], [p[0], p[1] + p[2]], [p[0] - p[2], p[1]]]), HON, { lw: 0.5, sh: HON_S, hi: HON_H, so: 0.2 }); });
    }
    X.restore();
  }
  function guardia(o) {
    return function (v) {
      var X = v.ctx, by = o.by || 0, c = o.c || 0, lean = o.lean || 0, hy = o.hy || 0, np = o.np;
      v.stick([[10.4, 19.4 + by], [10 + c * 1.5, 24]], 4, '#6a4020', { lw: 1.2 }); v.part(Prr(7.6 + c * 1.5, 23, 5.6, 2.4, 1.1), '#3a2418', { lw: 1, so: 0.2 });
      v.stick([[15.4, 19.4 + by], [15.6 - c * 1.5, 24]], 4, '#8a5a2a', { lw: 1.2, hi: '#b4824a' }); v.part(Prr(13 - c * 1.5, 23, 5.6, 2.4, 1.1), '#3a2418', { lw: 1, so: 0.2 });
      X.save(); X.translate(13, 25); X.rotate(lean); X.translate(-13, -25);
      abd(v, { x: 10.6, y: 16 + by, a: PI + 0.1, len: 9, th: 9, col: AMB, sh: AMB_S, hi: AMB_H, bands: [3, 6], bw: 1.8, st: 1.4, seed: 71, lw: 1.6 });
      // armadura de cera
      v.part(Pblob(14.4, 16 + by, 5.4, 5.8, 72, 0.03), WAX, { lw: 1.6, sh: WAX_S, hi: WAX_H, so: 0.9 });
      v.line(11.4, 15.4 + by, 17.4, 15 + by, 0.6, WAXD); v.line(11.8, 18.6 + by, 17.2, 18.2 + by, 0.6, WAXD);
      // casco
      v.stick([[15.6, 5.4 + by + hy], [15.2, 2.8 + by + hy], [16.8, 1.6 + by + hy]], 0.8, BLK, { lw: 0.7 }); v.dot(16.9, 1.5 + by + hy, 0.9, AMB_H);
      v.part(Pblob(14.8, 9.2 + by + hy, 4.7, 4.5, 73, 0.03), '#d8861c', { lw: 1.6, sh: '#8a4e0a', hi: AMB_H, so: 0.8 });
      v.part(Ppoly([[10.8, 6.4 + by + hy], [13.4, 3.6 + by + hy], [14.8, 6 + by + hy]]), AMB, { lw: 1, sh: AMB_S, so: 0.3 });
      v.part(Prr(15.2, 7.6 + by + hy, 5, 2.8, 1.2), '#1e140c', { lw: 0.8, so: 0 });
      v.dot(16.6, 9 + by + hy, 0.8, '#e8ff6a'); v.dot(19, 9 + by + hy, 0.7, '#e8ff6a');
      var mo = o.mouth || 0; v.part(Ppoly([[16.4, 11.6 + by + hy], [18.6, 11.8 + by + hy + mo], [17, 13 + by + hy + mo]]), '#fff6da', { lw: 0.6, so: 0 });
      // brazo y escudo
      var px = 19.4 + (o.px || 0), py = 17 + by + (o.py || 0);
      if (!np) { v.stick([[17, 14.6 + by], [18.6, 16 + by], [px - 2.6, py + 0.4]], 3.4, '#8a5a2a', { lw: 1.2, curve: true, hi: '#b4824a' }); shield(v, px, py, { melt: o.melt, drip: o.drip, rot: o.rot, sc: o.ssc }); v.part(Pcirc(px - 2.8, py + 0.6, 1.8), '#6a4020', { lw: 0.9, so: 0.2 }); }
      else { v.stick([[17, 14.6 + by], [19.6, 17.4 + by], [px - 0.6 + (o.fx || 0), py + 2.6 + (o.fy || 0)]], 3.4, '#8a5a2a', { lw: 1.2, curve: true, hi: '#b4824a' }); v.part(Pcirc(px - 0.6 + (o.fx || 0), py + 2.6 + (o.fy || 0), 2.2), '#6a4020', { lw: 1, so: 0.3 }); }
      X.restore();
      if (o.hit) star(v, 23.4, 11 + by, 2.4, '#fff6b0');
      if (o.breath) { X.fillStyle = 'rgba(255,248,220,0.85)'; [[22, 7, 1.5], [24, 5, 1.1]].forEach(function (b) { X.beginPath(); X.arc(b[0], b[1], b[2], 0, TAU); X.fill(); }); }
    };
  }
  (function () {
    function seq(np) {
      var out = [guardia({ np: np }), guardia({ np: np, by: 0.8, mouth: 0.4 })], k;
      for (k = 0; k < 4; k++) { var q = wk(k); out.push(guardia({ np: np, by: q.by * 0.8, c: q.c })); }
      out.push(guardia({ np: np, lean: -0.1, px: -3.2, py: -5.4, rot: -0.35, by: -0.4, hy: -0.6, mouth: 0.8 }));   // 6 wind
      out.push(guardia({ np: np, lean: 0.15, px: 1.2, py: 0.6, hy: 1.2, mouth: 1, hit: true }));                      // 7 bash
      out.push(guardia({ np: np, lean: 0.2, hy: 2.8, by: 1.2, px: -0.8, py: 3.2, ssc: 0.92, mouth: 0.4, breath: true })); // 8 rec
      return out;
    }
    var F = seq(false);
    F.push(guardia({ melt: true, drip: 2.4, lean: -0.06, hy: 1, by: 0.5, rot: 0.08 }));                              // 9 melt
    var dieA = withDie(F, guardia({}), 26, 26, { lw: 1.5 });                                                          // 10-14
    F.push(guardia({ np: true }), guardia({ np: true, by: 0.8, mouth: 0.4, fx: 1, fy: -1.4 }));                       // 15-16 sin escudo
    addV('enemy_pan_guardia', 26, 26, F, { lw: 1.5 }, {
      idle: { f: [0, 1], fps: 3 }, walk: { f: WALKSEQ, fps: 6 }, wind: { f: [6], fps: 1 }, bash: { f: [6, 7, 8], fps: 10 }, rec: { f: [8], fps: 1 }, melt: { f: [9], fps: 1 }, die: dieA,
      idle_np: { f: [15, 16], fps: 3 }, walk_np: { f: [15, 16], fps: 7 }, wind_np: { f: [15], fps: 1 }, bash_np: { f: [16, 15], fps: 10 }, rec_np: { f: [15], fps: 1 }
    });
  })();
  addV('fx_wax_shield', 24, 28, [0, 1].map(function (k) { return function (v) { shield(v, 12, 14, { melt: !!k, drip: k ? 2.2 : 0 }); if (k) { v.dot(5, 25, 0.9, HON); v.dot(19, 24.4, 0.8, HON_H); } }; }), { lw: 1.4 }, { idle: { f: [0], fps: 1 }, melt: { f: [0, 1], fps: 3, loop: false } });

  // ======================================================================================================
  //  6. BABOSA DE MIEL 30x16 -- babosa larga y baja de miel translucida con burbujas y ojos en tallo (inmune a la miel)
  // ======================================================================================================
  function babosa(o) {
    return function (v) {
      var X = v.ctx, ph = o.ph || 0, rise = o.rise || 0, open = o.open || 0, i, pts = [], sx = o.stretch || 0;
      // gotas que deja
      v.part(Pblob(5, 15, 5, 1, 81, 0.1), HON, { lw: 0.9, sh: HON_S, hi: HON_H, so: 0.2 });
      for (i = 0; i <= 8; i++) {
        var x = 1.8 + i * 2.5 + (i > 5 ? sx * 0.6 : 0), t = i / 8, h = 1.4 + 5.4 * Math.pow(sin(Math.min(1, t * 1.02) * PI * 0.88), 0.8) + 0.9 * sin(ph + i * 0.85) * (t < 0.9 ? 1 : 0.2);
        pts.push([x, 13.8 - h]);
      }
      var hx = 23 + sx;
      pts.push([hx + 1.8, 9.6 - rise], [hx + 4, 10.6 - rise * 0.8], [hx + 4.1, 13.2 - rise * 0.3], [hx + 1.4, 14.6], [14, 14.8], [6, 14.8], [1.4, 14.2]);
      // ojos en tallo (detras del cuerpo)
      v.stick([[hx - 0.2, 8.8 - rise], [hx + 0.4 + (o.sway || 0), 6 - rise], [hx + 0.2 + (o.sway || 0) * 1.5, 4.4 - rise]], 1.3, '#d8861c', { lw: 0.9, curve: true });
      v.stick([[hx + 2.4, 9.2 - rise], [hx + 3.2 - (o.sway || 0), 6.6 - rise], [hx + 3.6 - (o.sway || 0) * 1.5, 5 - rise]], 1.3, '#e8921a', { lw: 0.9, curve: true });
      v.part(Pclosed(pts), '#e8921a', { lw: 1.5, sh: '#b8620e', hi: '#ffc860', so: 0.9 });
      v.part(Pblob(14, 13.2, 11.4, 1.2, 82, 0.05), '#ffd070', { lw: 0, so: 0 });
      // burbujas y manchas
      [[6.4, 9.6, 1.2], [10.6, 8, 1.6], [15.4, 8.6, 1.1], [19.4, 9.6, 1.4], [12.6, 11, 0.8]].forEach(function (b, k) {
        v.part(Pcirc(b[0], b[1] + 0.4 * sin(ph + k) - rise * (b[0] > 20 ? 0.5 : 0), b[2]), k % 2 ? '#ffe0a0' : '#c8700e', { lw: 0.5, ol: '#8a4e0a', so: 0.2 }); if (k % 2) v.dot(b[0] - b[2] * 0.3, b[1] - b[2] * 0.3, 0.35, '#ffffff');
      });
      beyeS(v, hx + 0.3 + (o.sway || 0) * 1.5, 4.2 - rise, 1.5); beyeS(v, hx + 3.7 - (o.sway || 0) * 1.5, 4.8 - rise, 1.4);
      if (open) { v.part(Pblob(hx + 3.6, 11.4 - rise * 0.6, 1.4, 1.4 + open, 83), '#4a1e08', { lw: 0.5 }); if (open > 0.8) { v.part(Pcirc(hx + 6, 10.4 - rise * 0.6, 2.1), '#e8921a', { lw: 0.9, sh: HON_S, hi: HON_H, so: 0.4 }); } }
      else v.line(hx + 2.4, 12.6, hx + 4, 12.2, 0.6, OLC);
      if (o.cheek) v.part(Pblob(hx + 1.8, 11.4 - rise * 0.6, 2.4, 2.1, 84), '#ffb040', { lw: 0.6, so: 0 });
    };
  }
  function beyeS(v, x, y, r) { v.dot(x, y, r + 0.6, OLC); v.dot(x, y, r, '#fffdf2'); v.dot(x + r * 0.3, y, r * 0.5, '#241810'); }
  (function () {
    var F = [babosa({ ph: 0 }), babosa({ ph: 1.6, sway: 0.5 })], k;
    for (k = 0; k < 4; k++) F.push(babosa({ ph: k * 1.57, sway: [0.3, 0.8, 0.3, -0.2][k], stretch: [0, 0.8, 1.2, 0.6][k] }));
    F.push(babosa({ rise: 2, cheek: true, ph: 0.6 }));                       // 6 spit A: hincha el carrillo y se alza
    F.push(babosa({ rise: 1.4, open: 1, ph: 1, stretch: 0.6 }));               // 7 spit B: escupe el glob
    var dieA = withDie(F, babosa({ ph: 0 }), 30, 16, { lw: 1.4 });
    addV('enemy_pan_babosa', 30, 16, F, { lw: 1.4 }, { idle: { f: [0, 1], fps: 3 }, crawl: { f: [2, 3, 4, 5], fps: 6 }, walk: { f: [2, 3, 4, 5], fps: 6 }, spit: { f: [6, 7], fps: 6 }, die: dieA });
  })();

  // ======================================================================================================
  //  7. POLINIZADOR 24x24 (curandero, vuela) -- abeja crema peluda con verde palido y una flor rosa en el lomo
  // ======================================================================================================
  function petals(v, cx, cy, r, open, ph) {
    var i; for (i = 0; i < 5; i++) { var a = i / 5 * TAU + (ph || 0); v.part(Pblob(cx + cos(a) * r * 0.62 * open, cy + sin(a) * r * 0.62 * open, r * 0.5, r * 0.5, 90 + i, 0.02, 7), '#ff9ac8', { lw: 0.8, sh: '#d85a98', hi: '#ffd0e8', so: 0.3 }); }
    v.part(Pcirc(cx, cy, r * 0.42), '#ffe45a', { lw: 0.8, sh: '#d8a82a', hi: '#fffbb0', so: 0.2 });
  }
  function cross(v, cx, cy, s, col) { v.part(Ppoly([[cx - s * 0.36, cy - s], [cx + s * 0.36, cy - s], [cx + s * 0.36, cy - s * 0.36], [cx + s, cy - s * 0.36], [cx + s, cy + s * 0.36], [cx + s * 0.36, cy + s * 0.36], [cx + s * 0.36, cy + s], [cx - s * 0.36, cy + s], [cx - s * 0.36, cy + s * 0.36], [cx - s, cy + s * 0.36], [cx - s, cy - s * 0.36], [cx - s * 0.36, cy - s * 0.36]]), col, { lw: 0.8, sh: '#6ad060', hi: '#e8ffd8', so: 0.3 }); }
  function polin(o) {
    return function (v) {
      var X = v.ctx, by = o.by || 0, wa = o.wa == null ? 0.4 : o.wa, pu = o.pulse || 0, sed = o.sed, tilt = o.tilt || 0;
      if (pu) { glow(X, 12, 12.4, 12, '184,255,154', 0.5 * pu); X.strokeStyle = 'rgba(184,255,154,0.9)'; X.lineWidth = 0.9; X.setLineDash([2.4, 1.6]); X.beginPath(); X.arc(12, 12.4, 10.8, 0, TAU); X.stroke(); X.setLineDash([]); }
      X.save(); X.translate(12, 13); X.rotate(tilt); X.translate(-12, -13);
      var ws = sed ? -0.9 : 0, wt = '#dcffd8';
      if (o.blur) { wing(v, 12.6, 8.4 + by, -PI * 0.86, 11, 5, 0.3, wt); wing(v, 12.6, 8.4 + by, -PI * 0.5, 10.4, 5, 0.3, wt); }
      wing(v, 12.4, 8.6 + by, sed ? PI + 0.5 : -PI * 0.8 - wa * 0.45, 11, 5.4, sed ? 0.6 : 0.72, wt);
      wing(v, 13.4, 8.8 + by, sed ? PI + 0.15 : -PI * 0.58 - wa * 0.7, 10, 5, sed ? 0.7 : 0.82, wt);
      thinLeg(v, [[11.4, 16.6 + by], [10.6, 19 + by], [11.2, 20.6 + by]], '#7a6a48'); thinLeg(v, [[14, 16.8 + by], [14.4, 19.4 + by], [15.6, 20.4 + by]], '#7a6a48');
      abd(v, { x: 9.6, y: 14.6 + by, a: PI - 0.34, len: 7.8, th: 6.4, col: CREAM, sh: CREAM_S, hi: '#ffffff', bands: [2.8, 5.2], bw: 1.5, bcol: '#9fe88a', seed: 91 });
      v.part(spikes(13.6, 13.2 + by, 4.3, 4.2, 11, 0.12, 92), '#fff8d8', { lw: 1.4, sh: '#d8c890', hi: '#ffffff', so: 0.8 });
      petals(v, 12.4, 8.4 + by, 3.6, pu ? 1.25 : 1, pu * 0.3);
      v.stick([[18.6, 8.6 + by], [19, 6.4 + by], [20.6, 5.2 + by]], 0.7, '#7a6a48', { lw: 0.7 }); v.dot(20.7, 5.2 + by, 1, '#ff9ac8');
      v.part(Pblob(18.6, 12.4 + by, 3.4, 3.3, 93, 0.03), CREAM, { lw: 1.4, sh: CREAM_S, hi: '#ffffff', so: 0.7 });
      if (sed) { v.line(18.6, 11.6 + by, 21, 11.6 + by, 0.8, OLC); v.line(17, 11.8 + by, 18, 11.8 + by, 0.6, OLC); }
      else { beye(v, 19.4, 11.6 + by, 1.8, 2.2, '#4ab04a', 0.2, '#e8ffd8'); if (o.fear) v.dot(19.6, 11.6 + by, 0.5, OLC); }
      v.line(20, 14.2 + by, 21.6, 14 + by, 0.7, OLC);
      X.restore();
      if (pu) { cross(v, 20.4, 3.6, 2.8, '#b8ff9a'); v.dot(3.6, 8, 0.7, '#e8ffd8'); v.dot(21.4, 19, 0.7, '#e8ffd8'); }
      if (o.fear) { v.part(Pclosed([[3.4, 4.2], [4.4, 6.4], [3.4, 7.4], [2.4, 6.4]]), '#9ad8ff', { lw: 0.6, so: 0.2 }); }
      if (o.lines) { v.line(1, 11, 4.4, 11, 0.7, 'rgba(255,255,230,0.9)'); v.line(0.6, 15, 3.6, 15, 0.7, 'rgba(255,255,230,0.7)'); }
      if (sed) { X.fillStyle = OLC; X.font = 'bold 4px sans-serif'; X.fillText('z', 21, 7.4); X.font = 'bold 3px sans-serif'; X.fillText('z', 23, 4.8); }
    };
  }
  (function () {
    var F = [], k, was = [0.9, 0.2, -0.5, 0.2];
    for (k = 0; k < 4; k++) F.push(polin({ by: [-0.8, 0, -0.5, 0.5][k], wa: was[k] }));
    F.push(polin({ pulse: 0.6, wa: 1, by: -0.6 }), polin({ pulse: 1, wa: 1.2, by: -1.2 }));       // 4-5 pulse
    var dieA = withDie(F, polin({}), 24, 24, { lw: 1.4 });                                          // 6-10
    F.push(polin({ tilt: 0.2, blur: true, fear: true, lines: true, wa: 0.9 }), polin({ tilt: 0.28, blur: true, fear: true, lines: true, wa: -0.4, by: -0.5 })); // 11-12 flee
    F.push(polin({ sed: true, by: 1, tilt: 0.08 }), polin({ sed: true, by: 1.8, tilt: 0.12 }));   // 13-14 sedated
    addV('enemy_pan_polinizador', 24, 24, F, { lw: 1.4 }, { idle: { f: [0, 1, 2, 3], fps: 8 }, float: { f: [0, 1, 2, 3], fps: 12 }, fly: { f: [0, 1, 2, 3], fps: 12 }, walk: { f: [0, 1, 2, 3], fps: 12 }, pulse: { f: [4, 5], fps: 6 }, flee: { f: [11, 12], fps: 14 }, sedated: { f: [13, 14], fps: 2 }, die: dieA });
  })();

  // ======================================================================================================
  //  8. AVISPA 22x22 (blinker, vuela) -- avispa delgada y diagonal, limon y negro, cuatro alas ahumadas; fade = alpha + aro en el suelo
  // ======================================================================================================
  function avispa(o) {
    return function (v) {
      var X = v.ctx, by = (o.by || 0) - 1, wa = o.wa == null ? 0.4 : o.wa, al = o.al == null ? 1 : o.al, ang = o.ang == null ? PI - 0.95 : o.ang, dx = o.dx || 0;
      if (o.ring) { X.strokeStyle = 'rgba(255,240,120,0.95)'; X.lineWidth = 1.1; X.setLineDash([2.4, 1.6]); X.beginPath(); X.ellipse(11, 20.2, 8.4, 2.4, 0, 0, TAU); X.stroke(); X.setLineDash([]); }
      X.globalAlpha = al; X.save(); X.translate(dx, 0);
      var wt = '#c8d0e4';
      wing(v, 10.4, 8.6 + by, -PI * 0.88 - wa * 0.4, 10.6, 3.4, 0.6, wt); wing(v, 11.4, 8.4 + by, -PI * 0.7 - wa * 0.5, 9.6, 3.2, 0.7, wt);
      wing(v, 11.8, 8.4 + by, -PI * 0.52 - wa * 0.6, 8.4, 3, 0.7, wt);
      thinLeg(v, [[9.6, 13 + by], [8.6, 16.4 + by], [9.8, 18.4 + by]], '#2a1c10'); thinLeg(v, [[12, 12.6 + by], [12.8, 16 + by], [14.4, 17 + by]], '#2a1c10');
      abd(v, { x: 9.2, y: 12.4 + by, a: ang, len: 7.6, th: 4.8, col: '#ffe030', sh: '#c8a010', hi: '#fff6a0', bands: [2.2, 4.4, 6.5], bw: 1.4, bcol: '#1a1210', st: 2.6, stc: '#2a1c10', seed: 101, lw: 1.3 });
      v.part(Pblob(11.4, 10.4 + by, 3, 2.9, 102, 0.03), '#1e1610', { lw: 1.3, sh: '#0e0a06', hi: '#5a4a30', so: 0.6 });
      v.part(Ppoly([[9.8, 9.4 + by], [13, 9.4 + by], [13, 10.4 + by], [9.8, 10.4 + by]]), '#ffe030', { lw: 0, so: 0 });
      v.part(Pblob(15.6, 7.6 + by, 3.1, 3, 103, 0.03), '#ffe030', { lw: 1.4, sh: '#c8a010', hi: '#fff6a0', so: 0.7 });
      v.part(Ppoly([[13.6, 6.8 + by], [17.6, 6 + by], [16.6, 8.6 + by], [14.4, 8.4 + by]]), '#1e1610', { lw: 0, so: 0 });
      v.part(Pblob(16.8, 7.4 + by, 1.7, 1.2, 104, 0.02, 7, -0.4), '#8aff4a', { lw: 0.7, so: 0 }); v.dot(16.3, 7 + by, 0.35, '#fff');
      v.stick([[15.4, 4.8 + by], [15.6, 2.4 + by], [17.4, 1.4 + by]], 0.6, '#2a1c10', { lw: 0.6 });
      v.part(Ppoly([[17.4, 9.4 + by], [19.6, 10.4 + by], [17.6, 10.8 + by]]), '#2a1c10', { lw: 0.6, so: 0 });
      X.restore();
      if (o.slash) { X.strokeStyle = '#ffffff'; X.lineWidth = 1.2; X.beginPath(); X.arc(9.6 + dx, 11 + by, 8.2, -0.9, 0.9); X.stroke(); X.strokeStyle = 'rgba(255,236,110,0.9)'; X.lineWidth = 0.8; X.beginPath(); X.arc(9.6 + dx, 11 + by, 9.5, -0.8, 0.8); X.stroke(); }
      X.globalAlpha = 1;
    };
  }
  (function () {
    var F = [avispa({}), avispa({ by: -0.7, wa: 1 })], k, was = [1, 0.1, -0.6, 0.2];
    for (k = 0; k < 4; k++) F.push(avispa({ by: [-0.5, 0.2, -0.3, 0.4][k], wa: was[k] }));
    F.push(avispa({ al: 0.42, ring: true, by: 0.2, wa: 0.6 }), avispa({ al: 0.16, ring: true, by: -0.4, wa: 0.2 })); // 6-7 fade
    F.push(avispa({ ang: 0.5, by: 0.4, dx: -0.6, wa: 0.2 }));                                                          // 8 sting A: curva el abdomen
    F.push(avispa({ ang: 0.18, by: -0.2, dx: 1, slash: true, wa: 0.9 }));                                              // 9 sting B: tajo con arco
    var dieA = withDie(F, avispa({}), 22, 22, { lw: 1.4 }, { ash: false });
    addV('enemy_pan_avispa', 22, 22, F, { lw: 1.4 }, { idle: { f: [0, 1], fps: 6 }, fly: { f: [2, 3, 4, 5], fps: 15 }, walk: { f: [2, 3, 4, 5], fps: 15 }, fade: { f: [6, 7], fps: 10 }, sting: { f: [8, 9], fps: 12 }, die: dieA });
  })();

  // ======================================================================================================
  //  9. NODRIZA 26x28 (warlock, vuela) -- abeja crema de abdomen grande con celdas y larvas, velo morado; invoca 2 larvas
  // ======================================================================================================
  function nodriza(o) {
    return function (v) {
      var X = v.ctx, by = o.by || 0, wa = o.wa == null ? 0.4 : o.wa, cast = o.cast || 0, i;
      if (cast) { X.strokeStyle = 'rgba(190,120,255,0.95)'; X.lineWidth = 1.2; X.setLineDash([2.6, 1.8]); X.beginPath(); X.ellipse(13, 24, 11.4, 3, 0, 0, TAU); X.stroke(); X.setLineDash([]); }
      wing(v, 14, 9.4 + by, -PI * 0.8 - wa * 0.4, 10.4, 4.6, 0.7); wing(v, 15, 9.6 + by, -PI * 0.58 - wa * 0.6, 9.6, 4.2, 0.8);
      // abdomen con celdas
      var ab = Pblob(9.2, 18.4 + by + cast * 0.4, 7.4 * (1 + cast * 0.06), 7.6 * (1 + cast * 0.06), 111, 0.03, 11);
      v.part(Pclosed([[7.4, 25 + by], [9.2, 28 + by], [11.2, 25 + by]]), '#3a2a18', { lw: 1, so: 0.1 });
      v.part(ab, WAX, { lw: 1.7, sh: WAX_S, hi: WAX_H, so: 1 });
      [[6.4, 15.4], [11.6, 15.8], [9, 20], [4.8, 21.4], [13.2, 21.4]].forEach(function (c, k) {
        v.part(hexP(c[0], c[1] + by, 2.6, 0.52), cast ? '#d8a8ff' : '#e8a030', { lw: 0.7, sh: cast ? '#9a58e0' : HON, so: 0.3 });
        v.part(Pblob(c[0], c[1] + by, 1.1, 0.8, 112 + k, 0.1, 6, k * 0.7), CREAM, { lw: 0.4, so: 0 }); // larva dentro
      });
      thinLeg(v, [[13.4, 18 + by], [12.6, 21 + by], [13.6, 22.8 + by]], '#7a6a48');
      v.part(spikes(14.6, 12 + by, 4.2, 4.2, 11, 0.12, 113), '#fff0c8', { lw: 1.5, sh: '#d8bf86', hi: '#ffffff', so: 0.8 });
      // brazos con larva
      var ay = o.armsUp ? -3.2 : 0;
      v.stick([[17.6, 13.4 + by], [19.6, 15 + by + ay * 0.5], [21.4, 15.8 + by + ay]], 1.4, '#8a6a40', { lw: 0.8, curve: true });
      if (!o.armsUp) v.part(Pblob(22.4, 16.4 + by, 2.2, 1.6, 114, 0.05, 8, 0.4), CREAM, { lw: 0.9, sh: CREAM_S, so: 0.3 }); else { star(v, 22.4, 11.6 + by, 2.2, '#e0b8ff'); v.dot(22.4, 11.6 + by, 0.8, '#ffffff'); }
      // cabeza con velo morado
      v.part(Pblob(18.6, 8.4 + by, 3.9, 3.9, 115, 0.03), CREAM, { lw: 1.5, sh: CREAM_S, hi: '#ffffff', so: 0.7 });
      v.part(Pclosed([[14.4, 9.4 + by], [14.6, 5.4 + by], [18, 3.6 + by], [21.6, 5.2 + by], [19, 5.8 + by], [16.4, 6.8 + by], [16, 10.6 + by]]), '#8a4ac8', { lw: 1.3, sh: '#5a2a98', hi: '#c394f5', so: 0.7 });
      beye(v, 19.8, 8.6 + by, 1.7, 2.1, '#6a2ab0', 0.2, '#e8d0ff');
      v.stick([[19, 4.4 + by], [19.8, 2 + by], [21.6, 1 + by]], 0.6, '#5a2a98', { lw: 0.6 }); v.dot(21.7, 0.9 + by, 0.8, '#c394f5');
      v.line(20.8, 11 + by, 22.4, 10.8 + by, 0.6, OLC);
      if (o.larvae) { [[22.6, 22.2], [4.4, 24.6]].forEach(function (p, k) { v.part(Pblob(p[0], p[1] + by, 2, 1.5, 116 + k, 0.05, 8, k ? -0.3 : 0.3), CREAM, { lw: 0.9, sh: CREAM_S, so: 0.3 }); v.dot(p[0] + 0.7, p[1] - 0.3 + by, 0.5, OLC); }); }
    };
  }
  (function () {
    var F = [nodriza({}), nodriza({ by: -0.8, wa: 0.9 })], k, was = [0.9, 0.2, -0.5, 0.2];
    for (k = 0; k < 4; k++) F.push(nodriza({ by: [-0.6, 0.2, -0.4, 0.4][k], wa: was[k] }));
    F.push(nodriza({ cast: 0.6, armsUp: true, by: -0.6, wa: 1 }));                       // 6 cast A
    F.push(nodriza({ cast: 1, armsUp: true, larvae: true, by: -1, wa: 0.2 }));           // 7 cast B (salen las larvas)
    var dieA = withDie(F, nodriza({}), 26, 28, { lw: 1.5 });
    addV('enemy_pan_nodriza', 26, 28, F, { lw: 1.5 }, { idle: { f: [0, 1], fps: 4 }, fly: { f: [2, 3, 4, 5], fps: 13 }, walk: { f: [2, 3, 4, 5], fps: 13 }, cast: { f: [6, 7], fps: 6 }, cast_hold: { f: [7], fps: 1 }, die: dieA });
  })();

  // ======================================================================================================
  //  GUARDIANES (3:30 Avispon Real y 5:30 Reina Joven; DESIGN-v6 5.1 y 5.2). Ambos con anims `*_np` = parte rota (Saco / Aguijon).
  // ======================================================================================================
  function tint(X, w, h, rgba) { X.save(); X.globalCompositeOperation = 'source-atop'; X.fillStyle = rgba; X.fillRect(0, 0, w, h); X.restore(); }
  // ---- Reina Joven 36x36: crisalida de Melaria (larva-reina flotante con saco/abdomen de celdas, alas sin formar, corona de cera a medio hacer)
  function reinaj(o) {
    return function (v) {
      var X = v.ctx, by = o.by || 0, wf = o.wf || 0, sw = o.sw || 1, hot = o.hot || 0, np = o.np, lean = o.lean || 0, sway = o.sway || 0, i;
      X.save(); X.translate(18, 28); X.rotate(lean); X.translate(-18, -28);
      // alas sin formar (arrugadas)
      wing(v, 17, 13 + by, -PI * 0.78 - wf * 0.3, 11, 5.4, 0.66); wing(v, 18.4, 13.4 + by, -PI * 0.58 - wf * 0.4, 9.6, 4.8, 0.7);
      // gotas de miel bajo el saco
      if (!np) [[6, 33.2, 1.2], [11.6, 34.2, 1.4], [16, 33, 1]].forEach(function (d, k) { var dd = o.honey ? 2.6 + k : 0.4 * sin(by + k * 2); v.part(Pclosed([[d[0], d[1] + dd - d[2] * 1.7], [d[0] + d[2], d[1] + dd], [d[0], d[1] + dd + d[2]], [d[0] - d[2], d[1] + dd]]), HON, { lw: 0.7, sh: HON_S, hi: HON_H, so: 0.3 }); });
      // saco / abdomen
      var sc = np ? 0.78 : sw, sx = 10.8 + sway, sy = 23.6 + by + (np ? 2.6 : 0);
      var sack = Pblob(sx, sy, 9.6 * sc, 9.2 * sc, 121, 0.03, 12);
      if (np) {
        v.part(sack, '#c98a28', { lw: 1.9, sh: '#8a5a14', hi: '#e8b050', so: 1.2 });
        X.save(); X.beginPath(); sack(X); X.clip(); X.fillStyle = '#3a2814'; [3.4, 7, 10.6].forEach(function (u) { X.fillRect(sx - 9.6 * sc + u * 0.9, 0, 1.8, 40); }); X.restore(); v.outline(sack, 1.9, OLC);
        v.part(Ppoly([[sx - 2.4, sy - 7.6 * sc], [sx + 1, sy - 2], [sx + 4.4, sy - 6.6 * sc], [sx + 3.2, sy + 3], [sx - 0.6, sy + 0.4], [sx - 3.4, sy + 3.6]]), '#2a1608', { lw: 0.9, so: 0 });
        v.dot(sx + 0.4, sy - 0.4, 1, '#a8560a');
        [[sx - 5, sy + 8 * sc + 0.4, 1.1], [sx + 4.6, sy + 8 * sc + 1.6, 1.3]].forEach(function (d) { v.part(Pclosed([[d[0], d[1] - d[2] * 1.6], [d[0] + d[2], d[1]], [d[0], d[1] + d[2] * 1.2], [d[0] - d[2], d[1]]]), HON, { lw: 0.6, sh: HON_S, so: 0.2 }); });
      } else {
        v.part(sack, hot > 1 ? '#ffd890' : AMB, { lw: 1.9, sh: hot ? '#e8a030' : AMB_S, hi: AMB_H, so: 1.2 });
        X.save(); X.beginPath(); sack(X); X.clip(); X.fillStyle = BLK; [3.6, 7.8, 12].forEach(function (u) { X.save(); X.translate(sx - 9.6 * sc + u * sc, sy); X.rotate(0.12); X.fillRect(-0.9 * sc, -12, 1.9 * sc, 24); X.restore(); }); X.restore(); v.outline(sack, 1.9, OLC);
        [[sx - 4.4, sy - 3, 2.5], [sx + 2.8, sy - 4.6, 2.2], [sx - 1.6, sy + 3.4, 2.7], [sx + 5, sy + 2.6, 2]].forEach(function (c, k) { v.part(hexP(sx + (c[0] - sx) * sc, sy + (c[1] - sy) * sc, c[2] * sc, 0.52), hot > 1 ? '#ffffff' : hot ? '#fff0a0' : '#ffd23a', { lw: 0.8, sh: hot ? '#ffc040' : '#e09a1a', hi: '#fffbd0', so: 0.3 }); });
        if (hot) glow(X, sx, sy, 11 * sc, '255,230,140', hot > 1 ? 0.55 : 0.32);
        if (o.burst) { X.strokeStyle = '#ffffff'; X.lineWidth = 0.9; X.beginPath(); X.moveTo(sx - 6, sy - 6); X.lineTo(sx - 2, sy - 1); X.lineTo(sx - 5, sy + 4); X.moveTo(sx + 6, sy - 5); X.lineTo(sx + 2, sy); X.lineTo(sx + 5.4, sy + 5); X.stroke(); [[2, 8, 2], [32, 26, 1.8], [4, 30, 1.6], [30, 6, 1.5]].forEach(function (c) { v.part(hexP(c[0], c[1], c[2], 0.3), '#ffd23a', { lw: 0.7, sh: '#e09a1a', so: 0.2 }); }); }
      }
      // tira de cera arrancada del capullo
      v.part(Pclosed([[16, 21 + by], [20, 19.4 + by], [22.6, 22 + by], [18.6, 24.6 + by]]), WAX, { lw: 1.1, sh: WAX_S, hi: WAX_H, so: 0.4 });
      v.line(17.4, 22.4 + by, 21, 21.4 + by, 0.5, WAXD);
      // torax y brazos
      var ay = o.rain ? -5.6 : 0;
      v.stick([[24, 21 + by], [27.6, 22.4 + by + ay * 0.5], [30, 23 + by + ay]], 2.2, '#3a2418', { lw: 1, curve: true }); v.part(Pcirc(30.2, 23 + by + ay, 1.6), AMB, { lw: 0.9, sh: AMB_S, so: 0.3 });
      v.part(spikes(20.2, 20 + by, 6.8, 6.2, 12, 0.1, 122), AMB, { lw: 1.7, sh: AMB_S, hi: AMB_H, so: 1 });
      v.part(Prr(18.8, 14.4 + by, 2.8, 11, 1.2), BLK, { lw: 0.8, so: 0 });
      // cabeza + corona sin terminar
      var hy = o.hy || 0, hx = o.hx || 0;
      v.stick([[28, 8.6 + by + hy], [28.4, 5.6 + by + hy], [30.4, 4.4 + by + hy]], 0.8, BLK, { lw: 0.8 }); v.dot(30.6, 4.3 + by + hy, 1.1, '#ffd23a');
      v.stick([[24.6, 8.8 + by + hy], [24, 5.6 + by + hy], [22.4, 4.6 + by + hy]], 0.8, BLK, { lw: 0.8 }); v.dot(22.3, 4.5 + by + hy, 1.1, '#ffd23a');
      v.part(Pblob(26.6 + hx, 14.2 + by + hy, 5.6, 5.4, 123, 0.03), '#ffb73a', { lw: 1.7, sh: '#c87a1a', hi: '#ffe08a', so: 1 });
      v.part(Ppoly([[22.6 + hx, 10 + by + hy], [23.4 + hx, 6.4 + by + hy], [25 + hx, 8.4 + by + hy], [26.4 + hx, 5.4 + by + hy], [27.8 + hx, 8.6 + by + hy], [29.6 + hx, 6.6 + by + hy], [29.8 + hx, 10.4 + by + hy]]), WAX, { lw: 1.1, sh: WAX_S, hi: WAX_H, so: 0.4 });
      v.line(26.4 + hx, 6.4 + by + hy, 26 + hx, 9.6 + by + hy, 0.5, WAXD);
      if (o.hurt) { X.strokeStyle = OLC; X.lineWidth = 1; X.beginPath(); X.moveTo(24.6 + hx, 12 + by + hy); X.lineTo(27 + hx, 13.2 + by + hy); X.lineTo(24.6 + hx, 14.4 + by + hy); X.moveTo(30.2 + hx, 12 + by + hy); X.lineTo(28 + hx, 13.2 + by + hy); X.lineTo(30.2 + hx, 14.4 + by + hy); X.stroke(); }
      else { v.eye(25.2 + hx, 13.2 + by + hy, 2.3, { white: '#d8ffc0', shc: '#98d878', lx: 0.8, pr: 0.5, lw: 0.5 }); v.eye(29.4 + hx, 13.2 + by + hy, 2.1, { white: '#d8ffc0', shc: '#98d878', lx: 0.8, pr: 0.5, lw: 0.5 }); }
      var mo = o.spit ? 1 : o.roar ? 1.6 : 0;
      if (mo) { v.part(Pblob(28 + hx, 17.8 + by + hy, 2.8, 1.4 + mo, 124), '#4a0e08', { lw: 0.7 }); if (o.spit) v.part(Pblob(32.2, 19.2 + by, 2, 1.8, 125), '#e8921a', { lw: 0.9, sh: HON_S, hi: HON_H, so: 0.3 }); }
      else v.line(26.2 + hx, 18 + by + hy, 29.6 + hx, 17.8 + by + hy, 0.7, OLC);
      if (o.rain) { [[7, 6], [14, 2.8]].forEach(function (p, k) { v.part(Pblob(p[0], p[1], 2.2, 1.6, 126 + k, 0.05, 8, k ? 0.4 : -0.3), CREAM, { lw: 0.9, sh: CREAM_S, so: 0.3 }); v.dot(p[0] + 0.8, p[1] - 0.3, 0.5, OLC); }); }
      if (o.roar) { X.strokeStyle = 'rgba(255,240,200,0.9)'; X.lineWidth = 0.9; [[0, 0.6], [1, 0.9], [2, 1.2]].forEach(function (s) { X.beginPath(); X.arc(31 + hx, 18 + by, 1.6 + s[0] * 1.8, -0.9, 0.9); X.stroke(); }); }
      X.restore();
      if (o.hurt) { star(v, 31, 10, 2.4, '#fff6b0'); tint(X, 36, 36, 'rgba(255,255,255,0.32)'); }
    };
  }
  (function () {
    var F = [reinaj({}), reinaj({ by: -1, wf: 1, sway: 0.4 })], k;
    for (k = 0; k < 4; k++) F.push(reinaj({ by: [-1.4, -0.4, -1, 0.2][k], wf: [1.1, 0.1, 0.9, -0.2][k], sway: [0.6, 0, -0.5, 0][k] }));
    F.push(reinaj({ spit: true, by: -0.4, hx: 0.6 }));                                    // 6 spit
    F.push(reinaj({ honey: true, lean: 0.1, by: 0.4, hy: 0.8 }));                         // 7 honey (charco / acido de miel)
    F.push(reinaj({ sw: 1.16, hot: 1, by: -0.6 }));                                       // 8 swell
    F.push(reinaj({ sw: 1.28, hot: 2, burst: true, by: -1, wf: 1 }));                     // 9 burst (Eclosion)
    F.push(reinaj({ rain: true, by: -2, wf: 1, hy: -0.4 }));                              // 10 rain-wind
    F.push(reinaj({ hurt: true, lean: -0.1, hx: -0.6 }));                                 // 11 hurt
    F.push(reinaj({ roar: true, lean: -0.08, by: -1, wf: 1.4, hy: -0.6 }));               // 12 roar
    var dieA = withDie(F, reinaj({}), 36, 36, { lw: 1.7 });                               // 13-17
    F.push(reinaj({ np: true }), reinaj({ np: true, by: -1, wf: 1 }));                    // 18-19 idle_np
    for (k = 0; k < 4; k++) F.push(reinaj({ np: true, by: [-1.4, -0.4, -1, 0.2][k], wf: [1.1, 0.1, 0.9, -0.2][k], sway: [0.6, 0, -0.5, 0][k] })); // 20-23 float_np
    F.push(reinaj({ np: true, spit: true, by: -0.4, hx: 0.6 }));                          // 24 spit_np
    F.push(reinaj({ np: true, honey: true, lean: 0.1, by: 0.4, hy: 0.8 }));               // 25 honey_np
    addV('enemy_mini_reina_joven', 36, 36, F, { lw: 1.7 }, {
      idle: { f: [0, 1], fps: 3 }, float: { f: WALKSEQ, fps: 7 }, walk: { f: WALKSEQ, fps: 7 }, spit: { f: [6], fps: 1 }, honey: { f: [7], fps: 1 }, acid: { f: [7], fps: 1 },
      swell: { f: [8, 9], fps: 8 }, burst: { f: [9], fps: 1 }, rain: { f: [10], fps: 1 }, hurt: { f: [11], fps: 1 }, roar: { f: [12], fps: 1 }, die: dieA,
      idle_np: { f: [18, 19], fps: 3 }, float_np: { f: [18, 20, 19, 21, 22, 23], fps: 7 }, walk_np: { f: [18, 20, 19, 21, 22, 23], fps: 7 }, spit_np: { f: [24], fps: 1 }, honey_np: { f: [25], fps: 1 }, acid_np: { f: [25], fps: 1 }
    });
  })();

  // ---- Avispon Real 30x28: avispon corpulento negro y ambar con gorguera dorada, cabeza herrumbre, aguijon largo (parte rompible)
  function avispon(o) {
    return function (v) {
      var X = v.ctx, by = o.by || 0, wa = o.wa == null ? 0.4 : o.wa, tilt = o.tilt || 0, np = o.np, ang = o.ang == null ? PI - 0.75 : o.ang, dx = o.dx || 0, glowT = o.glow, hy = o.hy || 0;
      X.save(); X.translate(15 + dx, 14); X.rotate(tilt); X.translate(-15, -14);
      var wb = o.wb, wt = '#ccd6ec';
      if (o.limp) { wing(v, 14, 9 + by, PI + 0.6, 13, 5.4, 0.6, wt); wing(v, 15, 9.4 + by, PI + 0.25, 12, 5, 0.7, wt); }
      else if (wb) { wing(v, 14, 9 + by, PI + 0.12, 15, 5.8, 0.62, wt); wing(v, 15, 9.2 + by, PI - 0.04, 13.4, 5.4, 0.72, wt); }
      else { wing(v, 14, 9 + by, -PI * 0.84 - wa * 0.35, 15, 5.8, 0.62, wt); wing(v, 15, 9.2 + by, -PI * 0.64 - wa * 0.5, 13.4, 5.4, 0.72, wt); }
      thinLeg(v, [[12.4, 18 + by], [11.2, 21.4 + by], [12.6, 23.6 + by]], '#2a1c10'); thinLeg(v, [[16, 18.6 + by], [16.2, 22 + by], [18, 23.4 + by]], '#2a1c10'); thinLeg(v, [[19, 17.6 + by], [20.6, 20.4 + by], [22.4, 21.2 + by]], '#2a1c10');
      var st = np ? 0 : (o.st == null ? 5 : o.st), len = o.len || 10;
      abd(v, { x: 10.8, y: 14.6 + by, a: ang, len: len, th: 8.4, col: '#33201a', sh: '#1a100a', hi: '#6a4a38', bands: [2.6, 5.8, 9], bw: 2.1, bcol: AMB, st: st, stc: glowT ? '#fff4b0' : '#e8c060', seed: 131, lw: 1.7 });
      if (np) { var sp = rp({ x: 10.8, y: 14.6 + by, a: ang }, len + 0.6, 0); v.part(Pblob(sp[0], sp[1], 1.6, 1.4, 132), '#8a3a0e', { lw: 0.9, so: 0.2 }); v.dot(sp[0] - 0.4, sp[1] + 2.6, 0.8, '#d8651a'); }
      if (glowT && !np) { var tp = rp({ x: 10.8, y: 14.6 + by, a: ang }, len + st, 0); glow(X, tp[0], tp[1], 4.6, '255,230,120', 0.8); v.dot(tp[0], tp[1], 0.9, '#ffffff'); }
      v.part(spikes(16.2, 13.6 + by, 5.8, 5.6, 12, 0.1, 133), '#3a2418', { lw: 1.6, sh: '#1e120a', hi: '#6a4a30', so: 0.9 });
      v.part(Prr(15.6, 8.4 + by, 2.4, 10, 1), AMB, { lw: 0.7, so: 0 });
      // gorguera dorada
      v.part(spikes(21, 13.2 + by + hy * 0.5, 2.8, 5.2, 7, 0.16, 134), '#ffd23a', { lw: 1.3, sh: '#c8901a', hi: '#fff0a0', so: 0.5 });
      // cabeza
      v.stick([[23.6, 8.4 + by + hy], [24.2, 5 + by + hy], [26.4, 3.6 + by + hy]], 0.8, BLK, { lw: 0.8 }); v.dot(26.6, 3.5 + by + hy, 1.1, '#ffd23a');
      v.part(Pblob(24, 12.4 + by + hy, 4.8, 4.8, 135, 0.03), '#d8651a', { lw: 1.7, sh: '#8a3a0e', hi: '#ffa850', so: 0.9 });
      [[21.8, 8.4], [24, 7.2], [26.2, 8.2]].forEach(function (p, k) { v.part(Ppoly([[p[0] - 1, p[1] + 1.4 + by + hy], [p[0], p[1] - 1.6 + by + hy], [p[0] + 1, p[1] + 1.4 + by + hy]]), '#ffd23a', { lw: 0.7, so: 0.1 }); });
      if (o.limp) { X.strokeStyle = OLC; X.lineWidth = 1; X.beginPath(); X.moveTo(23.4, 10.6 + by); X.lineTo(26.8, 14.2 + by); X.moveTo(26.8, 10.6 + by); X.lineTo(23.4, 14.2 + by); X.stroke(); }
      else { beye(v, 25.2, 11.4 + by + hy, 2.4, 3, '#1a0e06', 0.15, '#ffe9a0'); v.dot(26, 12 + by + hy, 0.8, '#ffe45a'); }
      var mo = o.mouth || 0;
      v.part(Ppoly([[25.4, 15.2 + by + hy], [28.6, 14.4 + by + hy + mo * 0.4], [27.2, 17.4 + by + hy + mo]]), '#fff6da', { lw: 0.8, so: 0 });
      v.part(Ppoly([[23, 16 + by + hy], [26, 16.6 + by + hy + mo * 0.8], [24.8, 18.4 + by + hy + mo]]), '#fff6da', { lw: 0.7, so: 0 });
      X.restore();
      if (o.lines) { v.line(0.2, 6, 7, 6, 0.9, 'rgba(255,240,200,0.9)'); v.line(0.2, 12, 5, 12, 0.9, 'rgba(255,240,200,0.7)'); v.line(0.6, 18, 7.4, 18, 0.8, 'rgba(255,240,200,0.6)'); }
      if (o.dizzy) { star(v, 17, 2.4, 2.1, '#ffe45a'); star(v, 24.4, 1.4, 1.8, '#fff6b0'); star(v, 9.4, 4.4, 1.6, '#ffd070'); }
      if (o.streak) { X.strokeStyle = '#ffffff'; X.lineWidth = 1.1; X.beginPath(); X.moveTo(24, 22.6); X.lineTo(29.6, 20.6); X.stroke(); X.strokeStyle = 'rgba(255,230,120,0.9)'; X.lineWidth = 0.7; X.beginPath(); X.moveTo(22, 24.4); X.lineTo(29.6, 22); X.stroke(); }
      if (o.roar) { X.strokeStyle = 'rgba(255,240,200,0.9)'; X.lineWidth = 0.9; [0, 1, 2].forEach(function (s) { X.beginPath(); X.arc(26.6, 17, 2.2 + s * 1.7, -0.8, 0.8); X.stroke(); }); }
      if (o.hurt) { star(v, 27, 6, 2.4, '#fff6b0'); tint(X, 30, 28, 'rgba(255,255,255,0.32)'); }
      if (o.dust) { v.dot(5, 25, 0.9, 'rgba(255,230,180,0.8)'); v.dot(8, 26, 0.7, 'rgba(255,230,180,0.7)'); v.dot(2.6, 22.6, 0.6, 'rgba(255,230,180,0.7)'); }
    };
  }
  (function () {
    var F = [avispon({}), avispon({ by: -1, wa: 1 })], k, was = [1, 0.1, -0.6, 0.2];
    for (k = 0; k < 4; k++) F.push(avispon({ by: [-0.7, 0.2, -0.5, 0.4][k], wa: was[k] }));
    F.push(avispon({ tilt: -0.28, by: 0.6, hy: -0.6, mouth: 1.4, wa: 1, dust: true, ang: PI - 0.3, len: 9 }));                           // 6 dash-wind
    F.push(avispon({ tilt: 0.2, dx: 0.6, wb: true, lines: true, mouth: 0.8, by: 0.4 }));                                                    // 7 dash
    F.push(avispon({ tilt: -0.2, by: 0.8, limp: true, dizzy: true, ang: PI - 1.1, mouth: 0.4 }));                                           // 8 stun
    F.push(avispon({ ang: 0.45, len: 9.6, st: 5, glow: true, by: -0.4, dx: -1.2, wa: 0.6, hy: 0.4 }));                                      // 9 sting-wind (el abdomen apunta)
    F.push(avispon({ ang: 0.12, len: 9.4, st: 8, glow: true, by: -0.6, dx: -3.4, tilt: 0.1, wb: true, streak: true, mouth: 0.6, hy: 0.6 })); // 10 sting
    F.push(avispon({ hurt: true, tilt: -0.1, by: 0.4 }));                                                                                   // 11 hurt
    F.push(avispon({ roar: true, tilt: -0.1, by: -1, wa: 1.2, mouth: 1.8, hy: -0.6 }));                                                      // 12 roar
    var dieA = withDie(F, avispon({}), 30, 28, { lw: 1.7 });                                                                                // 13-17
    F.push(avispon({ np: true }), avispon({ np: true, by: -1, wa: 1 }));                                                                    // 18-19 idle_np
    for (k = 0; k < 4; k++) F.push(avispon({ np: true, by: [-0.7, 0.2, -0.5, 0.4][k], wa: was[k] }));                                       // 20-23 fly_np
    F.push(avispon({ np: true, tilt: -0.2, wb: false, wa: 1.2, mouth: 1, by: -0.4, hy: -0.4 }));                                            // 24 wing-wind_np (golpe de ala: se arma)
    F.push(avispon({ np: true, tilt: 0.16, wb: true, lines: true, mouth: 1, dx: 0.8, by: 0.2 }));                                           // 25 wing_np (golpe de ala)
    addV('enemy_mini_avispon', 30, 28, F, { lw: 1.7 }, {
      idle: { f: [0, 1], fps: 6 }, fly: { f: [2, 3, 4, 5], fps: 14 }, walk: { f: [2, 3, 4, 5], fps: 14 }, dash_wind: { f: [6], fps: 1 }, dash: { f: [7], fps: 1 }, stun: { f: [8], fps: 1 },
      sting_wind: { f: [9], fps: 1 }, sting: { f: [10], fps: 1 }, stab: { f: [9, 10], fps: 8 }, hurt: { f: [11], fps: 1 }, roar: { f: [12], fps: 1 }, die: dieA,
      idle_np: { f: [18, 19], fps: 6 }, fly_np: { f: [20, 21, 22, 23], fps: 14 }, walk_np: { f: [20, 21, 22, 23], fps: 14 }, wing_wind_np: { f: [24], fps: 1 }, wing_np: { f: [25], fps: 1 }, wing_hit_np: { f: [24, 25], fps: 10 }
    });
  })();

//@@PART4@@
  A.FAM4 = { panal: [] };
})();
