/*!
 * assets_boss3.js - Arte del JEFE v5 (P4): YARLAK, el Coloso Gelido (mamut-glaciar de la Tundra). Solo arte, sin logica.
 * Script clasico que EXTIENDE window.Assets; cargar tras assets.js, assets_boss.js, assets_boss2.js y assets_fam3.js
 * (usa Assets._h, la API de drawBoss del Pastor/Karceron/Letea y los VFX de la Tundra P3).
 * Contrato (nombres, state, anclas, telegrafias, trofeos): games/card-swarm/ASSETS_API.md, seccion "Jefes v4 (P4: Yarlak)".
 * Diseno: DESIGN-v5-biomas.md B.2 y C.4-B. Estilo: contorno grueso #1b1124, color plano + 1 sombra + 1 brillo, rasterizado x2.
 * Coste: capa del cuerpo precompuesta en un canvas compartido con rect sucio; ~25 drawImage por frame.
 */
(function () {
  'use strict';
  var A = window.Assets, H = A && A._h;
  if (!H || !A.drawBoss || !A.drawBossTele || !A.sprite) { if (window.console) console.error('assets_boss3: falta Assets._h o assets_boss*.js (cargar tras assets_boss2.js y assets_fam3.js)'); return; }
  var addV = H.addV, Ppoly = H.Ppoly, Pblob = H.Pblob, Prr = H.Prr, Pclosed = H.Pclosed, OLC = H.OLC;
  var TAU = Math.PI * 2, LW = 2.2, sin = Math.sin, cos = Math.cos, PI = Math.PI;
  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  function lerp(a, b, u) { return a + (b - a) * u; }
  function ease(u) { u = clamp(u, 0, 1); return u * u * (3 - 2 * u); }
  function pr(i) { var s = Math.sin(i * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); }
  function mkc(w, h) { var c = document.createElement('canvas'); c.width = w; c.height = h; return c; }
  function rd(v) { return Math.round(v * 10) / 10; }

  var Y = {
    fur: '#e2eaf4', furS: '#7f97ba', furD: '#5b7199', furH: '#ffffff',
    ice: '#9fd8ff', iceM: '#5aa8e8', iceD: '#2a4f8a', iceDD: '#1b2f66', ivo: '#f1ead2', ivoS: '#c8bb98', cy: '#5ff0ff', cav: '#14264a'
  };
  var EYE = [['#8fdcff', '#e8fbff', '143,220,255'], ['#ffffff', '#cfeeff', '230,244,255'], ['#5ff0ff', '#ffffff', '95,240,255'], ['#fff3a0', '#ffffff', '255,243,160']];

  // ---------------------------------------------------------------- utilidades de forma
  function smooth(pts, n) {   // Catmull-Rom abierta
    var out = [], i, k, p0, p1, p2, p3;
    for (i = 0; i < pts.length - 1; i++) {
      p0 = pts[Math.max(0, i - 1)]; p1 = pts[i]; p2 = pts[i + 1]; p3 = pts[Math.min(pts.length - 1, i + 2)];
      for (k = 0; k < n; k++) {
        var u = k / n, u2 = u * u, u3 = u2 * u;
        out.push([0.5 * (2 * p1[0] + (-p0[0] + p2[0]) * u + (2 * p0[0] - 5 * p1[0] + 4 * p2[0] - p3[0]) * u2 + (-p0[0] + 3 * p1[0] - 3 * p2[0] + p3[0]) * u3),
          0.5 * (2 * p1[1] + (-p0[1] + p2[1]) * u + (2 * p0[1] - 5 * p1[1] + 4 * p2[1] - p3[1]) * u2 + (-p0[1] + 3 * p1[1] - 3 * p2[1] + p3[1]) * u3)]);
      }
    }
    out.push(pts[pts.length - 1]); return out;
  }
  function ribbon(pts, w0, w1) {  // poligono alrededor de una polilinea con ancho que se afina
    var L = [], Rr = [], n = pts.length, i;
    for (i = 0; i < n; i++) {
      var a = pts[Math.max(0, i - 1)], b = pts[Math.min(n - 1, i + 1)], dx = b[0] - a[0], dy = b[1] - a[1], d = Math.sqrt(dx * dx + dy * dy) || 1, nx = -dy / d, ny = dx / d, w = lerp(w0, w1, i / (n - 1)) / 2;
      L.push([pts[i][0] + nx * w, pts[i][1] + ny * w]); Rr.push([pts[i][0] - nx * w, pts[i][1] - ny * w]);
    }
    return Ppoly(L.concat(Rr.reverse()));
  }
  function crystal(v, cx, cy, h, w, rot, col) {   // cristal de hielo (rombo alargado)
    var c = cos(rot), s = sin(rot);
    function P(px, py) { return [cx + px * c - py * s, cy + px * s + py * c]; }
    v.part(Ppoly([P(0, -h), P(w, -h * 0.25), P(w * 0.7, h * 0.35), P(-w * 0.7, h * 0.35), P(-w, -h * 0.25)]), col || Y.ice, { lw: 1.1, sh: Y.iceM, hi: '#ffffff', so: 0.5 });
  }

  // ================================================================= SPRITES
  // ---- cuerpo: 112x80 (final 224x160). 0 pecho cerrado, 1 pecho abierto (cavidad grande con astillas de hielo)
  var BODY = [[8, 62], [3, 48], [5, 32], [15, 20], [28, 8], [42, 3], [55, 6], [67, 14], [81, 14], [95, 20], [106, 32], [110, 46], [106, 58], [97, 67], [80, 70], [58, 71], [34, 70], [18, 68]];
  function bodyDraw(f) {
    return function (v) {
      var x = v.ctx, i;
      for (i = 0; i < 9; i++) { var bx = 18 + i * 9.6, ln = 5 + (i % 3) * 2; v.part(Ppoly([[bx - 4.4, 62], [bx + (i % 2 ? 1.4 : -1.4), 69 + ln * 0.7], [bx + 4.4, 62]]), Y.furS, { lw: 1.5, sh: Y.furD, so: 0.5 }); }
      for (i = 0; i < BODY.length; i++) {   // flecos de pelaje en el perfil (trasera, lomo, pecho)
        var q0 = BODY[i], q1 = BODY[(i + 1) % BODY.length], mx = (q0[0] + q1[0]) / 2, my = (q0[1] + q1[1]) / 2;
        if (my > 62) continue; var ux = mx - 56, uy = my - 42, ud = Math.sqrt(ux * ux + uy * uy), tl = 5 + pr(i + 30) * 4; ux /= ud; uy /= ud;
        v.part(Ppoly([[mx - uy * 3.6 - ux * 1.6, my + ux * 3.6 - uy * 1.6], [mx + ux * tl, my + uy * tl], [mx + uy * 3.6 - ux * 1.6, my - ux * 3.6 - uy * 1.6]]), i % 2 ? Y.furS : Y.fur, { lw: 1.4, sh: Y.furD, so: 0.4 });
      }
      v.part(Pclosed(BODY), Y.fur, { lw: LW, sh: Y.furS, hi: Y.furH, so: 3.4 });
      x.save(); x.beginPath(); Pclosed(BODY)(x); x.clip();
      x.fillStyle = 'rgba(91,113,153,0.5)'; x.beginPath(); x.ellipse(56, 78, 60, 22, 0, 0, TAU); x.fill();
      x.strokeStyle = 'rgba(143,164,191,0.85)'; x.lineWidth = 1; x.lineCap = 'round';
      for (i = 0; i < 18; i++) { var sx = 9 + pr(i + 3) * 94, sy = 12 + pr(i + 9) * 52, ln2 = 8 + pr(i + 5) * 9; x.beginPath(); x.moveTo(sx, sy); x.quadraticCurveTo(sx - ln2 * 0.3, sy + ln2 * 0.5, sx - ln2 * 0.1, sy + ln2); x.stroke(); }
      x.strokeStyle = 'rgba(255,255,255,0.9)'; x.lineWidth = 0.9;
      for (i = 0; i < 6; i++) { var hx = 22 + pr(i + 40) * 56, hy = 10 + pr(i + 50) * 20, hl = 6 + pr(i + 60) * 6; x.beginPath(); x.moveTo(hx, hy); x.quadraticCurveTo(hx - 1.5, hy + hl * 0.5, hx - 0.5, hy + hl); x.stroke(); }
      x.restore();
      // cavidad del pecho (centro 88,50)
      var rx = f ? 15 : 11, ry = f ? 17.5 : 13.5;
      if (f) for (i = 0; i < 11; i++) { var a = i / 11 * TAU + 0.2, cx2 = 88 + cos(a) * (rx + 1), cy2 = 50 + sin(a) * (ry + 1); v.part(Ppoly([[cx2 + cos(a) * 5.4, cy2 + sin(a) * 5.4], [cx2 + cos(a + 1.5) * 2.6, cy2 + sin(a + 1.5) * 2.6], [cx2 + cos(a - 1.5) * 2.6, cy2 + sin(a - 1.5) * 2.6]]), i % 2 ? Y.ice : '#cfeeff', { lw: 1.1, sh: Y.iceM, so: 0.3 }); }
      v.part(Pblob(88, 50, rx, ry, 701 + f, 0.04, 11), Y.cav, { lw: 1.8, sh: '#0b1630', so: 1.3 });
      x.fillStyle = 'rgba(95,240,255,' + (f ? 0.28 : 0.12) + ')'; x.beginPath(); x.ellipse(88, 50, rx * 0.8, ry * 0.8, 0, 0, TAU); x.fill();
      // carambanos del flequillo
      for (i = 0; i < 7; i++) { var ix = 24 + i * 11 + (i % 2) * 3, il = 5 + pr(i + 70) * 6; v.part(Ppoly([[ix - 1.8, 66], [ix, 66 + il + 4], [ix + 1.8, 66]]), '#cfeeff', { lw: 1, sh: Y.ice, hi: '#ffffff', so: 0.3 }); }
    };
  }
  addV('boss_yarlak_body', 112, 80, [bodyDraw(0), bodyDraw(1)], { lw: LW }, { closed: { f: [0], fps: 1 }, open: { f: [1], fps: 1 } });

  // ---- pata: 24x56 (final 48x112); 0-3 lado cercano (0 apoyada, 1 contacto, 2 levantada, 3 adelantando), 4-7 lado lejano (mas oscuro). Cadera = (12,4)
  var LEGN = { len: [51, 49, 40, 48], kx: [0, 1.5, 4, 2], fx: [0, 1.5, 3, 5] };
  function legDraw(f) {
    var k = f % 4, far = f >= 4, len = LEGN.len[k], kx = LEGN.kx[k], fx = LEGN.fx[k];
    var c0 = far ? '#c4d2e4' : Y.fur, c1 = far ? Y.furD : Y.furS, c2 = far ? '#e0e8f2' : Y.furH;
    return function (v) {
      var x = v.ctx, i;
      var pts = [[4, 1], [20, 1], [22.5, 12], [19.5 + kx * 0.5, len * 0.55], [21 + fx, len - 6], [23 + fx, len - 1], [22 + fx, len + 1.4], [2 + fx, len + 1.4], [1 + fx, len - 1], [3 + fx, len - 6], [5 + kx * 0.5, len * 0.55], [1.5, 12]];
      v.part(Pclosed(pts), c0, { lw: LW, sh: c1, hi: c2, so: 1.8 });
      x.save(); x.beginPath(); Pclosed(pts)(x); x.clip();
      x.strokeStyle = far ? 'rgba(80,100,140,0.7)' : 'rgba(143,164,191,0.9)'; x.lineWidth = 1;
      for (i = 0; i < 6; i++) { var sy = 5 + i * 7, sx = 6 + (i % 3) * 5; x.beginPath(); x.moveTo(sx, sy); x.quadraticCurveTo(sx - 1, sy + 3, sx, sy + 7); x.stroke(); }
      x.restore();
      // tobillera de pelo largo + punas de hielo + unas de marfil
      for (i = 0; i < 4; i++) { var tx = 4 + fx + i * 5; v.part(Ppoly([[tx - 2.6, len - 5], [tx + (i % 2 ? 0.8 : -0.8), len + 3.4], [tx + 2.6, len - 5]]), c1, { lw: 1.2, sh: far ? '#4a5f82' : Y.furD, so: 0.3 }); }
      for (i = 0; i < 3; i++) v.part(Prr(6 + fx + i * 5.2, len + 1.6, 3.2, 3.2, 1), Y.ivo, { lw: 0.9, sh: Y.ivoS, so: 0.2 });
      if (!far) crystal(v, 19.5 + fx * 0.6, len - 12, 4.2, 2, 0.5, Y.ice);
    };
  }
  addV('boss_yarlak_leg', 24, 56, [0, 1, 2, 3, 4, 5, 6, 7].map(legDraw), { lw: LW }, { stand: { f: [0], fps: 1 }, walk: { f: [0, 2, 3, 1], fps: 4 }, walk_far: { f: [4, 6, 7, 5], fps: 4 } });

  // ---- placa de armadura: 24x30 (final 48x60). 0 entera, 1 agrietada, 2 muñon. Ancla = centro-base (12,28)
  function plateDraw(f) {
    return function (v) {
      var x = v.ctx;
      if (f === 2) {
        v.part(Ppoly([[3, 28], [4, 22], [8, 24.4], [10.4, 18.6], [14, 23.4], [18, 21], [21, 28]]), Y.iceM, { lw: 1.7, sh: Y.iceD, hi: Y.ice, so: 0.8 });
        crystal(v, 15, 23, 3.6, 1.7, 0.4, '#cfeeff'); v.dot(8, 26, 0.7, '#ffffff');
        return;
      }
      v.part(Ppoly([[3, 28], [1.4, 15], [7.6, 5], [12, 0.6], [17.4, 5.6], [22.6, 15.4], [21, 28]]), Y.iceM, { lw: LW, sh: Y.iceD, hi: Y.ice, so: 1.5 });
      v.part(Ppoly([[12, 0.6], [17.4, 5.6], [22.6, 15.4], [21, 28], [13.4, 28], [13, 12]]), Y.iceD, { lw: 0, so: 0 });
      v.part(Ppoly([[12, 1.6], [7.6, 6], [3, 15.4], [4.4, 26], [8.4, 26], [9, 12]]), Y.ice, { lw: 0, so: 0 });
      x.strokeStyle = 'rgba(255,255,255,0.85)'; x.lineWidth = 0.8; x.beginPath(); x.moveTo(11.8, 2); x.lineTo(12.6, 14); x.lineTo(11.4, 26); x.stroke();
      v.dot(6, 11, 0.9, '#ffffff'); v.line(4.6, 17, 5, 22, 0.7, '#ffffff');
      if (f === 1) {
        x.strokeStyle = OLC; x.lineWidth = 1.5; x.beginPath(); x.moveTo(11, 3); x.lineTo(14, 9); x.lineTo(10.6, 13.6); x.lineTo(15.4, 19); x.lineTo(12.6, 25); x.moveTo(14, 9); x.lineTo(19, 11.4); x.moveTo(10.6, 13.6); x.lineTo(6, 15.4); x.stroke();
        x.strokeStyle = '#ffffff'; x.lineWidth = 0.6; x.beginPath(); x.moveTo(11.4, 3.4); x.lineTo(14.4, 9); x.lineTo(11, 13.6); x.lineTo(15.8, 19); x.stroke();
      }
    };
  }
  addV('boss_yarlak_plate', 24, 30, [plateDraw(0), plateDraw(1), plateDraw(2)], { lw: LW }, { whole: { f: [0], fps: 1 }, cracked: { f: [1], fps: 1 }, stub: { f: [2], fps: 1 } });
  // ---- armadura compuesta: 80x48 (5 placas en arco). 0 entera, 1 agrietada, 2 rota (muñones)
  var PLATES = [{ x: -84, y: -58, r: -0.8, s: 0.5, th: 0.8 }, { x: -58, y: -82, r: -0.5, s: 0.58, th: 0.6 }, { x: -30, y: -94, r: -0.1, s: 0.66, th: 0.4 }, { x: 0, y: -89, r: 0.25, s: 0.58, th: 0.2 }, { x: 30, y: -73, r: 0.6, s: 0.5, th: 0 }];
  function armorDraw(f) {
    return function (v) {
      var x = v.ctx, i;
      v.part(Ppoly([[2, 46], [6, 38], [20, 34], [40, 32], [60, 34], [74, 38], [78, 46]]), Y.iceD, { lw: 1.6, sh: Y.iceDD, hi: Y.iceM, so: 0.9 });
      for (i = 0; i < 5; i++) {
        var P = PLATES[i], sp = A.sprite('boss_yarlak_plate', f === 2 ? 2 : (f === 1 && i % 2 === 0 ? 1 : 0)), sc = P.s * 0.62, w = sp.width / 2 * sc, h = sp.height / 2 * sc;
        x.save(); x.translate(8 + i * 16, 38 - Math.abs(2 - i) * 1.6); x.rotate((i - 2) * 0.22); x.drawImage(sp, -w / 2, -h * 0.93, w, h); x.restore();
      }
    };
  }
  addV('boss_yarlak_armor', 80, 48, [armorDraw(0), armorDraw(1), armorDraw(2)], { lw: LW }, { whole: { f: [0], fps: 1 }, cracked: { f: [1], fps: 1 }, broken: { f: [2], fps: 1 } });

  // ---- corazon helado: 28x28 (final 56). 0 late, 1 expuesto (aro blanco-azulado), 2 roto (esquirlas)
  function heartPath(c) {
    c.moveTo(14, 25); c.bezierCurveTo(4, 18, 2, 9.4, 7, 5.6); c.bezierCurveTo(10.6, 3, 13, 5.6, 14, 8.4); c.bezierCurveTo(15, 5.6, 17.4, 3, 21, 5.6); c.bezierCurveTo(26, 9.4, 24, 18, 14, 25); c.closePath();
  }
  function heartDraw(f) {
    return function (v) {
      var x = v.ctx;
      if (f === 2) {
        [[8, 10, 6.6, 0.2], [18, 9, 6, 1.1], [11, 19, 6, 2.4], [19.6, 19, 5, 3.4], [14, 14, 3.4, 5]].forEach(function (p, k) {
          v.part(Ppoly([[p[0] - p[2] * 0.6, p[1] + p[2] * 0.5], [p[0] + cos(p[3]) * 1, p[1] - p[2] * 0.8], [p[0] + p[2] * 0.7, p[1] + p[2] * 0.4]]), k % 2 ? Y.iceD : Y.iceM, { lw: 1.4, sh: Y.iceDD, hi: Y.ice, so: 0.5 });
        });
        x.strokeStyle = 'rgba(95,240,255,0.7)'; x.lineWidth = 0.7; x.beginPath(); x.moveTo(6, 14); x.lineTo(13, 13); x.lineTo(22, 15); x.stroke();
        return;
      }
      if (f === 1) { x.strokeStyle = OLC; x.lineWidth = 3.6; x.beginPath(); x.arc(14, 14, 13, 0, TAU); x.stroke(); x.strokeStyle = '#e8f8ff'; x.lineWidth = 1.8; x.beginPath(); x.arc(14, 14, 13, 0, TAU); x.stroke(); }
      v.part(heartPath, f ? '#aef8ff' : Y.cy, { lw: 1.9, sh: f ? Y.cy : '#2aa8d0', hi: '#ffffff', so: 1.2 });
      x.save(); x.beginPath(); heartPath(x); x.clip();
      x.fillStyle = 'rgba(255,255,255,0.35)'; x.beginPath(); x.moveTo(14, 8.4); x.lineTo(21, 6); x.lineTo(17, 17); x.lineTo(14, 22); x.closePath(); x.fill();
      x.strokeStyle = 'rgba(255,255,255,0.8)'; x.lineWidth = 0.7; x.beginPath(); x.moveTo(8, 8); x.lineTo(12, 14); x.lineTo(10, 20); x.moveTo(12, 14); x.lineTo(19, 12); x.stroke();
      x.restore();
      v.dot(9.4, 9.4, 1.4, '#ffffff');
    };
  }
  addV('boss_yarlak_heart', 28, 28, [heartDraw(0), heartDraw(1), heartDraw(2)], { lw: LW }, { beat: { f: [0], fps: 1 }, exposed: { f: [1], fps: 1 }, broken: { f: [2], fps: 1 } });

  // ---- costra del pecho: 24x28 (final 48x56). 0 entera translucida, 1 agrietada, 2 abierta (solo el borde astillado). Centro (12,14)
  function crustDraw(f) {
    return function (v) {
      var x = v.ctx, i;
      if (f === 2) {
        for (i = 0; i < 13; i++) { var a = i / 13 * TAU + 0.15, cx = 12 + cos(a) * 11.2, cy = 14 + sin(a) * 13.2; v.part(Ppoly([[cx + cos(a) * 5, cy + sin(a) * 5], [cx + cos(a + 1.5) * 2.8, cy + sin(a + 1.5) * 2.8], [cx + cos(a - 1.5) * 2.8, cy + sin(a - 1.5) * 2.8]]), i % 2 ? '#cfeeff' : Y.ice, { lw: 1.2, sh: Y.iceM, hi: '#ffffff', so: 0.3 }); }
        return;
      }
      x.fillStyle = 'rgba(159,216,255,0.46)'; x.beginPath(); x.ellipse(12, 14, 11.2, 13.2, 0, 0, TAU); x.fill();
      x.fillStyle = 'rgba(255,255,255,0.28)'; x.beginPath(); x.ellipse(9, 9, 5, 7, -0.4, 0, TAU); x.fill();
      x.strokeStyle = OLC; x.lineWidth = 1.7; x.beginPath(); x.ellipse(12, 14, 11.2, 13.2, 0, 0, TAU); x.stroke();
      x.strokeStyle = 'rgba(232,248,255,0.95)'; x.lineWidth = 0.8; x.beginPath(); x.ellipse(12, 14, 10, 12, 0, 0.2, 2.6); x.stroke();
      x.strokeStyle = 'rgba(255,255,255,0.85)'; x.lineWidth = 0.7; x.beginPath(); x.moveTo(4, 9); x.lineTo(9, 14); x.moveTo(19, 7); x.lineTo(15, 12); x.moveTo(6, 22); x.lineTo(11, 19); x.stroke();
      if (f === 1) {
        x.strokeStyle = OLC; x.lineWidth = 1.4; x.beginPath(); x.moveTo(12, 2.4); x.lineTo(9.6, 8); x.lineTo(13.4, 12.4); x.lineTo(10, 18); x.lineTo(13, 25.6); x.moveTo(13.4, 12.4); x.lineTo(19.6, 14.4); x.moveTo(9.6, 8); x.lineTo(4, 7); x.stroke();
        x.strokeStyle = 'rgba(95,240,255,0.9)'; x.lineWidth = 0.6; x.beginPath(); x.moveTo(12, 2.4); x.lineTo(9.6, 8); x.lineTo(13.4, 12.4); x.lineTo(10, 18); x.lineTo(13, 25.6); x.stroke();
      }
    };
  }
  addV('boss_yarlak_crust', 24, 28, [crustDraw(0), crustDraw(1), crustDraw(2)], { lw: 1.4 }, { whole: { f: [0], fps: 1 }, cracked: { f: [1], fps: 1 }, open: { f: [2], fps: 1 } });

  // ---- cabeza: 56x56 (final 112). 0 neutra, 1 rugido (boca abierta), 2 herida (ojos cerrados), 3 aturdida/abatida. Cuello (12,38); raiz de la trompa (47,44)
  function headDraw(f) {
    return function (v) {
      var x = v.ctx, i;
      // orejas y flequillo de la cresta
      v.part(Pblob(14, 30, 7.4, 11, 721, 0.07, 9, -0.2), Y.furS, { lw: LW, sh: Y.furD, hi: Y.fur, so: 1.2 });
      for (i = 0; i < 5; i++) v.part(Ppoly([[17 + i * 5.2, 11], [19 + i * 5.2 + (i - 2) * 1.2, 2.2 + Math.abs(i - 2) * 2.6], [22 + i * 5.2, 11]]), Y.fur, { lw: 1.6, sh: Y.furS, hi: Y.furH, so: 0.6 });
      var skull = [[8, 36], [9, 20], [18, 10], [31, 9], [41, 16], [46, 27], [51, 37], [51, 45], [45, 51], [34, 52], [22, 50], [13, 46]];
      v.part(Pclosed(skull), Y.fur, { lw: LW, sh: Y.furS, hi: Y.furH, so: 2.2 });
      x.save(); x.beginPath(); Pclosed(skull)(x); x.clip();
      x.fillStyle = 'rgba(106,128,162,0.34)'; x.beginPath(); x.ellipse(30, 58, 30, 14, 0, 0, TAU); x.fill();
      x.strokeStyle = 'rgba(143,164,191,0.9)'; x.lineWidth = 1; x.lineCap = 'round';
      for (i = 0; i < 12; i++) { var sx = 12 + pr(i + 1) * 34, sy = 12 + pr(i + 7) * 30, ln = 6 + pr(i + 5) * 6; x.beginPath(); x.moveTo(sx, sy); x.quadraticCurveTo(sx + ln * 0.3, sy + ln * 0.5, sx + ln * 0.1, sy + ln); x.stroke(); }
      x.restore();
      // barba de pelo largo bajo el hocico
      for (i = 0; i < 5; i++) v.part(Ppoly([[18 + i * 5.4, 47], [20 + i * 5.4 + (i % 2 ? 1 : -1), 55 + (i % 3)], [24 + i * 5.4, 47]]), Y.furS, { lw: 1.3, sh: Y.furD, so: 0.4 });
      // cresta de cristales de hielo en la frente
      crystal(v, 24, 10, 6, 2.4, -0.3, Y.ice); crystal(v, 31, 8, 7.4, 2.8, 0.05, '#cfeeff'); crystal(v, 38, 12, 5.4, 2.2, 0.4, Y.ice);
      // boca / hocico
      if (f === 1) {
        v.part(Ppoly([[36, 46], [48, 45], [51, 51], [44, 56], [36, 54]]), '#3a1a58', { lw: 1.5, sh: '#241036', so: 0.8 });
        v.part(Ppoly([[38, 52], [46, 51], [44, 55], [39, 55]]), '#8fb4e8', { lw: 0, so: 0 });
        v.part(Ppoly([[38.4, 46], [40.4, 50], [42.4, 46]]), Y.ivo, { lw: 0.8, so: 0.2 });
      } else {
        x.strokeStyle = OLC; x.lineWidth = 1.2; x.beginPath(); x.moveTo(35, 49); x.quadraticCurveTo(42, 51, 49, 47); x.stroke();
      }
      // ceja y parpado
      x.strokeStyle = OLC; x.lineWidth = 3.4; x.lineCap = 'round'; x.beginPath(); x.moveTo(24.6, 20.4); x.quadraticCurveTo(35, 21.4, 46.4, 27.6); x.stroke();
      x.strokeStyle = Y.furD; x.lineWidth = 1.6; x.beginPath(); x.moveTo(25.4, 20.8); x.quadraticCurveTo(35, 22, 45.4, 27.2); x.stroke();
      if (f === 2 || f === 3) {   // ojos cerrados
        x.strokeStyle = OLC; x.lineWidth = 1.5; x.lineCap = 'round'; x.beginPath();
        if (f === 2) { x.moveTo(29, 26); x.lineTo(36, 29.4); x.lineTo(29, 31.6); x.moveTo(42, 25.4); x.lineTo(46, 27.6); x.lineTo(42, 29); }
        else { x.moveTo(28.4, 29); x.quadraticCurveTo(33, 31.6, 37.6, 28.6); x.moveTo(41, 28); x.quadraticCurveTo(43.6, 29.6, 46, 27.6); }
        x.stroke();
      }
      if (f === 2) { x.strokeStyle = '#ffffff'; x.lineWidth = 0.8; x.beginPath(); x.moveTo(30, 10); x.lineTo(28, 17); x.lineTo(31.4, 22); x.stroke(); }
      if (f === 3) { for (i = 0; i < 3; i++) v.dot(20 + i * 4, 52 + (i % 2), 0.8, '#cfeeff'); }
    };
  }
  addV('boss_yarlak_head', 56, 56, [headDraw(0), headDraw(1), headDraw(2), headDraw(3)], { lw: LW }, { idle: { f: [0], fps: 1 }, roar: { f: [1], fps: 1 }, hurt: { f: [2], fps: 1 }, down: { f: [3], fps: 1 } });

  // ---- colmillos: 28x60 (final 56x120). _l = lejano (mas oscuro), _r = cercano. 0 entero, 1 roto. Raiz (8,4) -> punta (27,40) base = (38,72) px finales
  var TUSKC = [[8, 4], [7.5, 16], [10, 29], [16, 40], [23, 45], [27, 40]];
  function tuskDraw(far, broken) {
    var ivo = far ? '#d3c8a8' : Y.ivo, ivoS = far ? '#9c8e6c' : Y.ivoS;
    return function (v) {
      var x = v.ctx, c = smooth(TUSKC, 6), i;
      if (broken) {
        c = c.slice(0, 13);
        v.part(ribbon(c, 12, 10), ivo, { lw: LW, sh: ivoS, hi: '#ffffff', so: 1 });
        var e = c[c.length - 1];
        v.part(Ppoly([[e[0] - 4.8, e[1] - 1], [e[0] - 2.6, e[1] + 3.4], [e[0] - 0.6, e[1] - 0.4], [e[0] + 1.6, e[1] + 4.2], [e[0] + 4.8, e[1] - 1]]), ivoS, { lw: 1.2, sh: '#7a6e50', so: 0.3 });
        x.strokeStyle = 'rgba(95,240,255,0.8)'; x.lineWidth = 0.6; x.beginPath(); x.moveTo(7, 8); x.lineTo(9, 13); x.lineTo(7, e[1] - 2); x.stroke();
      } else {
        v.part(ribbon(c, 12.4, 1), ivo, { lw: LW, sh: ivoS, hi: '#ffffff', so: 1.2 });
        x.strokeStyle = far ? 'rgba(120,108,80,0.75)' : 'rgba(168,150,110,0.85)'; x.lineWidth = 0.9;
        for (i = 4; i < c.length - 5; i += 5) { var p = c[i], q = c[i + 1], dx = q[0] - p[0], dy = q[1] - p[1], d = Math.sqrt(dx * dx + dy * dy) || 1, wd = lerp(4.6, 0.6, i / c.length); x.beginPath(); x.moveTo(p[0] - dy / d * wd, p[1] + dx / d * wd); x.lineTo(p[0] + dy / d * wd, p[1] - dx / d * wd); x.stroke(); }
      }
      v.part(Pblob(8, 4.4, 6.4, 4.6, far ? 731 : 732, 0.06, 9), far ? Y.iceM : Y.ice, { lw: 1.5, sh: Y.iceD, hi: '#ffffff', so: 0.7 });
      if (!far) crystal(v, 12.4, 5, 3.4, 1.6, 1, '#cfeeff');
    };
  }
  addV('boss_yarlak_tusk_l', 28, 60, [tuskDraw(true, false), tuskDraw(true, true)], { lw: LW }, { whole: { f: [0], fps: 1 }, broken: { f: [1], fps: 1 } });
  addV('boss_yarlak_tusk_r', 28, 60, [tuskDraw(false, false), tuskDraw(false, true)], { lw: LW }, { whole: { f: [0], fps: 1 }, broken: { f: [1], fps: 1 } });

  // ---- ojos: 24x10 (final 48x20). 0 azul claro (F1), 1 blanco (F2), 2 cian (F3), 3 amarillo palido (F4). Sin rojo
  function eyesDraw(f) {
    var c = EYE[f];
    return function (v) {
      v.part(Ppoly([[0.6, 7.4], [3.4, 2], [9.6, 1.6], [12.4, 6.2], [7, 8.6]]), c[0], { lw: 0.9, ol: '#0e1a3a', sh: null });
      v.part(Ppoly([[15.4, 6.6], [17.4, 3], [22.4, 2.4], [23.4, 6], [19.4, 7.8]]), c[0], { lw: 0.8, ol: '#0e1a3a', sh: null });
      v.dot(6.4, 5.2, 1.7, c[1]); v.dot(19.6, 5, 1.2, c[1]); v.dot(5.8, 4.6, 0.6, '#ffffff');
    };
  }
  addV('boss_yarlak_eyes', 24, 10, [eyesDraw(0), eyesDraw(1), eyesDraw(2), eyesDraw(3)], { lw: 0.6 }, { phase1: { f: [0], fps: 1 }, phase2: { f: [1], fps: 1 }, phase3: { f: [2], fps: 1 }, phase4: { f: [3], fps: 1 } });

  // ---- retrato 48x48 (final 96): 0 neutro, 1 furia, 2 herido
  function portraitDraw(f) {
    return function (v) {
      var x = v.ctx, hot = f === 1;
      v.part(Prr(1.4, 1.4, 45.2, 45.2, 6), hot ? '#1a3a5c' : '#122846', { lw: 2, ol: OLC, sh: '#0a1830', so: 1.4 });
      x.save(); x.beginPath(); Prr(2.4, 2.4, 43.2, 43.2, 5)(x); x.clip();
      var g = x.createRadialGradient(24, 22, 2, 24, 22, 32); g.addColorStop(0, hot ? 'rgba(255,243,160,0.55)' : 'rgba(95,240,255,0.42)'); g.addColorStop(1, 'rgba(0,0,0,0)'); x.fillStyle = g; x.fillRect(0, 0, 48, 48);
      x.strokeStyle = 'rgba(232,240,255,0.5)'; x.lineWidth = 0.8; for (var i = 0; i < 7; i++) { var yy = 6 + i * 6; x.beginPath(); x.moveTo(2 + pr(i) * 6, yy); x.lineTo(14 + pr(i + 3) * 10, yy - 5); x.stroke(); }
      var hs = A.sprite('boss_yarlak_head', f === 2 ? 2 : (hot ? 1 : 0)), ts = A.sprite('boss_yarlak_tusk_r', 0), k = 0.86, hw = hs.width / 2 * k, hh = hs.height / 2 * k, hx0 = 1, hy0 = -4;
      x.drawImage(ts, hx0 + 37 * k - 8 * 0.62, hy0 + 46 * k - 4 * 0.62, ts.width / 2 * 0.62, ts.height / 2 * 0.62);
      v.stick([[hx0 + 46 * k, hy0 + 44 * k], [hx0 + 51 * k, hy0 + 52 * k], [hx0 + 53 * k, hy0 + 62 * k]], 6.4, Y.fur, { lw: 1.6, hi: '#ffffff' });
      x.drawImage(hs, hx0, hy0, hw, hh);
      if (f !== 2) { var es = A.sprite('boss_yarlak_eyes', hot ? 3 : 0); x.drawImage(es, hx0 + 36 * k - 12 * 0.9, hy0 + 26 * k - 5 * 0.9, es.width / 2 * 0.9, es.height / 2 * 0.9); }
      x.restore();
      if (f === 2) { x.strokeStyle = '#ffffff'; x.lineWidth = 0.9; x.beginPath(); x.moveTo(33, 4); x.lineTo(30, 12); x.lineTo(34, 19); x.lineTo(31, 27); x.stroke(); }
      v.part(Prr(1.4, 1.4, 45.2, 45.2, 6), 'rgba(0,0,0,0)', { lw: 2, ol: OLC });
      x.strokeStyle = hot ? '#fff3a0' : '#9fd8ff'; x.lineWidth = 0.9; x.beginPath(); Prr(3.2, 3.2, 41.6, 41.6, 4.4)(x); x.stroke();
    };
  }
  addV('boss_yarlak_portrait', 48, 48, [portraitDraw(0), portraitDraw(1), portraitDraw(2)], { lw: LW }, { neutral: { f: [0], fps: 1 }, rage: { f: [1], fps: 1 }, hurt: { f: [2], fps: 1 } });

  // ---- trofeos 16x16 (final 32): 0 normal, 1 ROTO (gris con aspa roja)
  function trophyDraw(kind, broken) {
    return function (v) {
      var x = v.ctx;
      v.part(Prr(1, 1, 14, 14, 3), '#16294a', { lw: 1.2, sh: '#0d1b33', so: 0.5 });
      x.save(); if (broken) x.globalAlpha = 0.45;
      if (kind === 'tusk') { var ts = A.sprite('boss_yarlak_tusk_r', 0); x.save(); x.translate(3.6, 1); x.rotate(0.12); x.scale(0.25, 0.25); x.drawImage(ts, 0, 0, ts.width / 2, ts.height / 2); x.restore(); }
      else if (kind === 'plate') { var ps = A.sprite('boss_yarlak_plate', 0); x.drawImage(ps, 2.6, 2.4, ps.width / 2 * 0.86, ps.height / 2 * 0.86); }
      else { var hs = A.sprite('boss_yarlak_heart', 0); x.drawImage(hs, 2, 2, hs.width / 2 * 0.8, hs.height / 2 * 0.8); }
      x.restore();
      if (broken) { x.strokeStyle = OLC; x.lineWidth = 3.2; x.beginPath(); x.moveTo(3, 3); x.lineTo(13, 13); x.moveTo(13, 3); x.lineTo(3, 13); x.stroke(); x.strokeStyle = '#ff3b30'; x.lineWidth = 1.8; x.stroke(); }
      x.strokeStyle = broken ? '#7a8294' : '#9fd8ff'; x.lineWidth = 0.7; x.beginPath(); Prr(1.8, 1.8, 12.4, 12.4, 2.6)(x); x.stroke();
    };
  }
  ['tusk', 'plate', 'heart'].forEach(function (k) {
    addV('trophy_yarlak_' + k, 16, 16, [trophyDraw(k, false), trophyDraw(k, true)], { lw: 1 }, { ok: { f: [0], fps: 1 }, broken: { f: [1], fps: 1 } });
  });

  // ================================================================= VFX propios
  function cloud(v, k, n, cols, edge) {
    var x = v.ctx, i;
    for (i = 0; i < n; i++) {
      var a = i / n * TAU + k * 0.5, r = 4 + k * 2.2 + (i % 3) * 1.6, px = 16 + cos(a) * r, py = 16 + sin(a) * r * 0.85, rr = 5.2 - k * 0.5 + (i % 2) * 1.2;
      x.fillStyle = cols[i % cols.length]; x.strokeStyle = edge; x.lineWidth = 0.8; x.beginPath(); x.arc(px, py, Math.max(1.4, rr), 0, TAU); x.fill(); x.stroke();
    }
  }
  addV('fx_yarlak_breath', 32, 32, [0, 1, 2, 3].map(function (k) {
    return function (v) { v.ctx.globalAlpha = 1 - k * 0.2; cloud(v, k, 7, ['rgba(232,246,255,0.9)', 'rgba(207,238,255,0.85)', 'rgba(255,255,255,0.9)'], 'rgba(90,168,232,0.55)'); v.ctx.globalAlpha = 1; };
  }), { lw: 1 }, { puff: { f: [0, 1, 2, 3], fps: 10, loop: false }, loop: { f: [0, 1, 2, 3], fps: 10 } });

  addV('fx_yarlak_pulse', 64, 64, [0, 1, 2, 3].map(function (k) {
    return function (v) {
      var x = v.ctx, i, R = 25 + k * 1.2;
      x.strokeStyle = 'rgba(95,240,255,' + (0.35 - k * 0.04) + ')'; x.lineWidth = 9; x.beginPath(); x.arc(32, 32, R, 0, TAU); x.stroke();
      x.strokeStyle = 'rgba(207,238,255,0.9)'; x.lineWidth = 3.4; x.beginPath(); x.arc(32, 32, R, 0, TAU); x.stroke();
      x.strokeStyle = '#ffffff'; x.lineWidth = 1.2; x.beginPath(); x.arc(32, 32, R, 0, TAU); x.stroke();
      for (i = 0; i < 10; i++) { var a = i / 10 * TAU + k * 0.4; crystal(v, 32 + cos(a) * (R + 2.6), 32 + sin(a) * (R + 2.6), 3, 1.3, a + PI / 2, i % 2 ? Y.ice : '#cfeeff'); }
    };
  }), { lw: 0.9 }, { loop: { f: [0, 1, 2, 3], fps: 10 } });

  // onda de hielo: segmento de 64x16 (final 128x32); borde exterior (arriba) dentado. Lo usa drawBossWave con style:3
  addV('fx_ice_shockwave', 64, 16, [function (v) {
    var x = v.ctx, i, g = x.createLinearGradient(0, 0, 0, 16);
    g.addColorStop(0, 'rgba(232,248,255,0.95)'); g.addColorStop(0.45, 'rgba(159,216,255,0.75)'); g.addColorStop(1, 'rgba(90,168,232,0)');
    x.fillStyle = g; x.beginPath(); x.moveTo(0, 16); x.lineTo(0, 7);
    for (i = 0; i < 8; i++) { x.lineTo(i * 8 + 2, 2 + (i % 2) * 2); x.lineTo(i * 8 + 4, 0.6); x.lineTo(i * 8 + 8, 6 + (i % 3)); }
    x.lineTo(64, 16); x.closePath(); x.fill();
    x.strokeStyle = OLC; x.lineWidth = 1.3; x.beginPath(); x.moveTo(0, 7); for (i = 0; i < 8; i++) { x.lineTo(i * 8 + 2, 2 + (i % 2) * 2); x.lineTo(i * 8 + 4, 0.6); x.lineTo(i * 8 + 8, 6 + (i % 3)); } x.stroke();
    x.strokeStyle = '#ffffff'; x.lineWidth = 0.7; x.beginPath(); x.moveTo(0, 9); x.lineTo(64, 9); x.stroke();
  }], { lw: 1 }, { wave: { f: [0], fps: 1 } });

  // fragmentos de armadura / colmillo: 16x16 (final 32), 4 formas
  addV('fx_yarlak_shard', 16, 16, [0, 1, 2, 3].map(function (k) {
    var shapes = [[[3, 12], [4, 4], [11, 2], [13, 9], [8, 14]], [[2, 9], [8, 1.6], [14, 7], [11, 14], [4, 13]], [[3, 13], [7, 2], [12, 6], [13, 13]], [[2, 7], [9, 2], [14, 11], [6, 14]]];
    return function (v) { v.part(Ppoly(shapes[k]), k === 1 ? Y.ivo : (k % 2 ? Y.iceM : Y.ice), { lw: 1.4, sh: k === 1 ? Y.ivoS : Y.iceD, hi: '#ffffff', so: 0.7 }); v.line(shapes[k][0][0] + 1.4, shapes[k][0][1] - 2, shapes[k][1][0] + 1, shapes[k][1][1] + 2, 0.6, '#ffffff'); };
  }), { lw: 1.2 }, { s0: { f: [0], fps: 1 }, s1: { f: [1], fps: 1 }, s2: { f: [2], fps: 1 }, s3: { f: [3], fps: 1 } });

  // carambano que cae del jefe: 8x18 (final 16x36). 0 colgando (con raiz de hielo), 1 agrietandose, 2 cayendo (punta abajo)
  addV('fx_yarlak_icicle', 8, 18, [0, 1, 2].map(function (k) {
    return function (v) {
      var x = v.ctx;
      if (k < 2) v.part(Pblob(4, 2.6, 3.6, 2.4, 741 + k, 0.08, 7), Y.iceM, { lw: 1, sh: Y.iceD, so: 0.4 });
      v.part(Ppoly([[1.2, k < 2 ? 3 : 1.4], [6.8, k < 2 ? 3 : 1.4], [4.6, 11], [4, 17], [3.4, 11]]), '#cfeeff', { lw: 1.1, sh: Y.ice, hi: '#ffffff', so: 0.5 });
      if (k === 1) { x.strokeStyle = OLC; x.lineWidth = 0.7; x.beginPath(); x.moveTo(1.4, 5); x.lineTo(6.4, 7); x.stroke(); }
      v.line(2.8, 4, 3.2, 10, 0.5, '#ffffff');
    };
  }), { lw: 1 }, { hang: { f: [0], fps: 1 }, crack: { f: [1], fps: 1 }, fall: { f: [2], fps: 1 } });

  // estaca de hielo del Pisoton (brota del suelo, brillo azul LISO, sin ojos): 14x24 (final 28x48), 4 frames. Ancla = base-centro (14,44)
  addV('fx_yarlak_spike', 14, 24, [0, 1, 2, 3].map(function (k) {
    var h = [5, 12, 20, 18][k];
    return function (v) {
      var x = v.ctx;
      v.part(Pblob(7, 21.6, 6.4, 2.2, 751 + k, 0.08, 8), k === 3 ? '#a8c0d8' : Y.fur, { lw: 1.2, sh: Y.furS, so: 0.4 });
      if (k === 0) { x.fillStyle = 'rgba(232,238,245,0.9)'; for (var i = 0; i < 5; i++) { x.beginPath(); x.arc(2.4 + i * 2.4, 20.6 - (i % 2), 1.2, 0, TAU); x.fill(); } }
      v.part(Ppoly([[2.4, 21.4], [4.2, 21.4 - h * 0.72], [7, 21.6 - h], [9.8, 21.4 - h * 0.7], [11.6, 21.4]]), Y.iceM, { lw: LW * 0.8, sh: Y.iceD, hi: Y.ice, so: 0.9 });
      v.part(Ppoly([[7, 21.6 - h], [9.8, 21.4 - h * 0.7], [11.6, 21.4], [7.4, 21.4]]), Y.iceD, { lw: 0, so: 0 });
      if (k > 0) v.line(5, 20 - h * 0.12, 6.2, 21 - h * 0.78, 0.7, '#ffffff');
      if (k === 3) { x.strokeStyle = OLC; x.lineWidth = 0.8; x.beginPath(); x.moveTo(5.4, 8); x.lineTo(8.4, 12); x.lineTo(6.6, 16); x.stroke(); }
    };
  }), { lw: 1.4 }, { rise: { f: [0, 1, 2], fps: 12, loop: false }, sink: { f: [3, 0], fps: 8, loop: false }, idle: { f: [2], fps: 1 } });

  // aro de ventana blanco azulado: 64x64 (final 128), 4 frames girando
  addV('fx_yarlak_window', 64, 64, [0, 1, 2, 3].map(function (k) {
    return function (v) {
      var x = v.ctx, i;
      x.strokeStyle = OLC; x.lineWidth = 5; x.beginPath(); x.arc(32, 32, 27, 0, TAU); x.stroke();
      x.strokeStyle = '#e8f8ff'; x.lineWidth = 3; x.setLineDash([9, 5]); x.lineDashOffset = -k * 3.5; x.beginPath(); x.arc(32, 32, 27, 0, TAU); x.stroke(); x.setLineDash([]);
      x.strokeStyle = 'rgba(95,240,255,0.7)'; x.lineWidth = 1; x.beginPath(); x.arc(32, 32, 23.4, 0, TAU); x.stroke();
      for (i = 0; i < 4; i++) { var a = i * PI / 2 + k * 0.2; crystal(v, 32 + cos(a) * 30, 32 + sin(a) * 30, 3.4, 1.5, a + PI / 2, '#ffffff'); }
    };
  }), { lw: 1 }, { loop: { f: [0, 1, 2, 3], fps: 8 } });

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
  var GY = 100, YDEATH = 3500, HIPY = -12, HS = 1.15, PVX = -70, PVY = 60, NJX = 88, NJY = -8;
  var YNAMES = ['pisoton', 'embestida', 'cornada', 'aliento', 'llamada', 'alud', 'latido', 'ventisca', 'invierno'];
  var LEGS = [{ x: -92, far: 1, ph: 0.5 }, { x: -62, far: 0, ph: 0 }, { x: 34, far: 1, ph: 0 }, { x: 60, far: 0, ph: 0.5 }];   // lejana trasera, cercana trasera, lejana delantera, cercana delantera
  var TUSKV = [38, 72];   // raiz -> punta del colmillo (px finales, sin rotar)
  var TROOT = [156, -4];  // raiz de la trompa (marco de la cabeza sin rotar)

  function xf(P, px, py) { var dx = px - PVX, dy = py - PVY, c = cos(P.tilt), s = sin(P.tilt); return { x: PVX + dx * c - dy * s, y: PVY + dx * s + dy * c + P.by }; }
  function hdx(P, px, py) { var dx = (px - NJX) * HS, dy = (py - NJY) * HS, c = cos(P.hr), s = sin(P.hr); return { x: NJX + dx * c - dy * s, y: NJY + dx * s + dy * c }; }
  function trunkPts(P) {
    var r = hdx(P, TROOT[0], TROOT[1]), pts = [[r.x, r.y]], a = P.tk.a0, px = r.x, py = r.y, n = 12, seg = P.tk.len || 9.2, i;
    for (i = 0; i < n; i++) { a = P.tk.a0 - i * P.tk.c; px += cos(a) * seg; py += sin(a) * seg; pts.push([px, py]); }
    return pts;
  }
  function gaitHz(speed) { return clamp(speed / 70, 0.45, 6); }
  function applyGait(P, uG, amp) {
    var i;
    for (i = 0; i < 4; i++) {
      var c = (uG + LEGS[i].ph) % 1, L = P.legs[i];
      if (c < 0.5) { L.f = c < 0.06 ? 1 : 0; L.dx = lerp(amp, -amp, c / 0.5); }
      else if (c < 0.75) { L.f = 2; L.dx = lerp(-amp, 0, (c - 0.5) / 0.25); }
      else { L.f = 3; L.dx = lerp(0, amp, (c - 0.75) / 0.25); }
    }
    P.by += 2.8 * cos(4 * PI * uG); P.tilt += 0.014 * sin(TAU * uG); P.step = Math.pow(Math.max(0, cos(4 * PI * uG)), 8);
    P.stepFoot = uG % 1 < 0.25 || uG % 1 >= 0.75 ? 1 : 3;
  }
  function yPose(s) {
    var t = s.t || 0, W = s.windup, ST = s.strike, wp = s.wp != null ? s.wp : ((t % 1400) / 1400), sp = s.sp != null ? s.sp : ((t % 700) / 700), u = ease(wp), q = ease(sp), f = s.facing < 0 ? -1 : 1, i;
    if (s.desperate && !W && !ST) W = 'invierno';
    var P = { by: 0, tilt: 0, hr: 0, hf: 0, tuskR: 0, tk: { a0: 1.5, c: 0.035, len: 9.2, abs: false }, legs: [{ f: 0, dx: 0 }, { f: 0, dx: 0 }, { f: 0, dx: 0 }, { f: 0, dx: 0 }], open: s.open != null ? clamp(+s.open, 0, 1) : 0,
      glow: 0.5, flare: 0, shake: 0, dust: 0, spray: 0, breath: 0, pulse: 0, summon: 0, wind: 0, blocks: 0, vapor: 0, skid: clamp(+s.skid || 0, 0, 1), charge: 0, step: 0, stepFoot: 3, fit: true, sq: 0,
      moving: 0, eyes: 0, frost: 0, sweep: 0, wsp: sp, wwp: wp, atk: null, collapse: 0, dead: 0, fly: 0, crackFx: 0, ring: 0, sweepN: 0 };
    var m = null; function A_(n) { return ST === n ? 'S' : (W === n && !ST ? 'W' : null); }
    P.by = sin(t / 950) * 1.5; P.tilt = sin(t / 1900) * 0.008;
    P.tk.a0 = 1.5 + 0.05 * sin(t / 1300); P.tk.c = 0.035;
    var mv = s.moving === true ? 1 : +s.moving || 0, speed = +s.speed > 0 ? +s.speed : 60;
    P.moving = mv;
    if (mv > 0.05) { var hz = gaitHz(speed); applyGait(P, ((t / 1000) * hz) % 1, speed >= 300 ? 18 : 13); P.dust = Math.max(P.dust, P.step * 0.6); }
    else { P.legs[1].f = 0; P.legs[3].f = 0; }
    var la = f > 0 ? (s.aim || 0) : PI - (s.aim || 0);            // angulo de apuntado en el marco del jefe (mira a +x)
    la = ((la + PI * 3) % TAU) - PI;
    function trunkRaise(k) { P.tk.a0 = lerp(P.tk.a0, -1.1, k); P.tk.c = lerp(P.tk.c, 0.085, k); }
    function legsRear(k) { P.legs[2].f = 2; P.legs[3].f = 2; P.legs[2].dx = -8 * k; P.legs[3].dx = -12 * k; }
    P.atk = W || ST || null;
    if ((m = A_('pisoton'))) {
      if (m === 'W') { P.tilt += -0.2 * u; P.by += -6 * u; P.hr += -0.16 * u; trunkRaise(u); legsRear(1); P.hf = u > 0.55 ? 1 : 0; P.flare = 0.5 * u; P.shake = 0.6 * u; }
      else { var qq = ease(clamp(sp / 0.22, 0, 1)); P.tilt += lerp(-0.2, 0.05, qq); P.by += lerp(-6, 8, qq) * (1 - clamp((sp - 0.4) / 0.6, 0, 1)); P.hr += lerp(-0.16, 0.12, qq); trunkRaise(1 - qq); P.hf = sp < 0.5 ? 1 : 0; if (qq < 0.6) legsRear(1 - qq); P.shake = sp > 0.18 ? 6 * (1 - clamp((sp - 0.18) / 0.82, 0, 1)) : 0; P.dust = sp > 0.18 ? 1 - clamp((sp - 0.18) / 0.82, 0, 1) : 0; P.flare = 1 - sp * 0.6; }
    } else if ((m = A_('embestida'))) {
      if (m === 'W') {
        P.by += 10 * u; P.tilt += 0.12 * u; P.hr += 0.28 * u; P.tuskR += -0.32 * u; P.tk.a0 = lerp(P.tk.a0, 1.7, u); P.tk.c = lerp(P.tk.c, 0.05, u); P.flare = 0.7 * u; P.shake = 0.9 * u;
        P.legs[3].f = ((t / 130) | 0) % 2 ? 2 : 0; P.legs[3].dx = ((t / 130) | 0) % 2 ? -4 : -20 * u; P.legs[2].f = 0; P.spray = u; P.dust = 0.4 * u;
      } else {
        P.moving = 1; applyGait(P, ((t / 1000) * 5.2) % 1, 20); P.by += 8; P.tilt += 0.12; P.hr += 0.3; P.tuskR += -0.32; P.tk.a0 = 0.2; P.tk.c = -0.02; P.shake = 1.6; P.charge = 1; P.spray = 1; P.dust = 1; P.flare = 1;
      }
    } else if ((m = A_('cornada'))) {
      if (m === 'W') { P.hr += 0.5 * u; P.tuskR += 0.55 * u; P.tilt += 0.06 * u; P.by += 7 * u; P.tk.a0 = lerp(P.tk.a0, 1.9, u); P.tk.c = lerp(P.tk.c, 0.1, u); P.flare = 0.6 * u; P.shake = 0.5 * u; P.legs[3].f = 1; P.legs[3].dx = 8 * u; }
      else { P.hr += lerp(0.5, -0.68, q); P.tuskR += lerp(0.55, -0.85, q); P.tilt += lerp(0.06, -0.1, q); P.by += lerp(7, -2, q); P.tk.a0 = lerp(1.9, 0.6, q); P.sweep = 1; P.shake = sp < 0.5 ? 2 : 0.6; P.flare = 1; P.legs[3].f = 1; P.legs[3].dx = 8; P.dust = 0.4; }
    } else if ((m = A_('aliento'))) {
      var ta = clamp(la, -1.15, 1.0);
      if (m === 'W') { P.tilt += -0.08 * u; P.hr += -0.14 * u; P.by += -4 * u; P.tk.a0 = lerp(P.tk.a0, ta - P.tilt, u); P.tk.c = lerp(P.tk.c, 0.02, u); P.tk.abs = u > 0.01; P.vapor = u; P.flare = 0.5 * u; P.shake = 0.5 * u; }
      else { P.tilt += -0.08; P.hr += -0.14; P.by += -4; P.tk.a0 = ta - P.tilt; P.tk.c = 0.015; P.tk.abs = true; P.breath = clamp(sp * 5, 0, 1); P.vapor = 1; P.shake = 1.2; P.flare = 1; P.hf = 1; }
    } else if ((m = A_('llamada'))) {
      if (m === 'W') { P.hr += -0.3 * u; P.tilt += -0.1 * u; trunkRaise(u); P.hf = u > 0.35 ? 1 : 0; P.summon = u; P.flare = 0.5 * u; P.shake = 0.7 * u; P.by += -3 * u; }
      else { P.hr += lerp(-0.3, 0.1, q); P.tilt += lerp(-0.1, 0.04, q); P.by += lerp(-3, 5, q); trunkRaise(1 - q * 0.6); P.hf = 1; P.summon = 1; P.shake = sp < 0.5 ? 3 : 1; P.dust = 0.5; P.flare = 1; }
    } else if ((m = A_('alud'))) {
      if (m === 'W') { P.tilt += -0.12 * u; P.hr += -0.1 * u; trunkRaise(u); P.blocks = u; P.flare = 0.7 * u; P.shake = 1.1 * u; P.by += -3 * u; legsRear(u * 0.6); }
      else { P.tilt += lerp(-0.12, 0.05, q); P.hr += lerp(-0.1, 0.16, q); P.tk.a0 = lerp(-1.1, 0.9, q); P.tk.c = lerp(0.085, 0.05, q); P.blocks = 1 + sp; P.shake = sp < 0.4 ? 4 : 1.2; P.dust = 0.7; P.flare = 1; P.hf = 1; }
    } else if ((m = A_('latido'))) {
      if (m === 'W') { P.by += 6 * u; P.tilt += 0.05 * u; P.hr += 0.2 * u; P.tk.a0 = lerp(P.tk.a0, 1.5, u); P.glow = 0.5 + 0.5 * u; P.flare = u; P.shake = 0.9 * u; P.open = Math.max(P.open, 0.18 * u); }
      else { P.by += 6; P.tilt += 0.05; P.hr += 0.2; P.tk.a0 = 1.5; P.glow = 1; P.pulse = sp; P.shake = sp < 0.5 ? 3 : 1; P.flare = 1; P.open = Math.max(P.open, ease(clamp((sp - 0.3) / 0.5, 0, 1))); P.hf = 1; }
    } else if ((m = A_('ventisca'))) {
      if (m === 'W') { P.tilt += -0.18 * u; P.hr += -0.2 * u; trunkRaise(u); legsRear(u); P.hf = u > 0.5 ? 1 : 0; P.wind = u; P.flare = 0.8 * u; P.shake = 0.9 * u; P.by += -5 * u; }
      else { P.tilt += lerp(-0.18, 0.02, ease(clamp(sp / 0.3, 0, 1))); P.hr += -0.1; trunkRaise(1 - 0.5 * q); P.hf = 1; P.wind = 1; P.shake = 3; P.dust = 0.6; P.flare = 1; P.by += lerp(-5, 3, ease(clamp(sp / 0.3, 0, 1))); }
    } else if ((m = A_('invierno'))) {
      P.tilt += -0.12; P.hr += -0.2; trunkRaise(1); P.hf = 1; P.open = 1; P.glow = 1; P.wind = 1; P.shake = 1.4; P.flare = 1; P.ring = 1; P.legs[2].f = 0; P.legs[3].f = 0; P.eyes = 3; P.dust = 0.3; P.by += 2 * sin(t / 400);
    }
    if (s.stun) { P.hr = 0.5; P.hf = 3; P.by += 10; P.tilt = 0.1; P.tk.a0 = 1.55; P.tk.c = 0.03; P.legs[0].f = 1; P.legs[1].f = 1; P.legs[2].f = 1; P.legs[3].f = 1; P.legs[1].dx = -6; P.legs[3].dx = 8; P.glow = 0.25; P.flare = 0; P.spray = 0; P.charge = 0; P.breath = 0; P.pulse = 0; }
    if (s.roar > 0) { var ro = ease(s.roar); P.tilt += -0.14 * ro; P.hr += -0.2 * ro; trunkRaise(ro); P.hf = ro > 0.2 ? 1 : P.hf; P.shake = Math.max(P.shake, 2 * ro); P.flare = Math.max(P.flare, ro); P.legs[2].f = ro > 0.5 ? 2 : P.legs[2].f; P.legs[3].f = ro > 0.5 ? 2 : P.legs[3].f; P.dust = Math.max(P.dust, 0.4 * ro); }
    if (s.hurt > 0) { var hh = clamp(+s.hurt, 0, 1); P.tilt -= 0.03 * hh; P.by += 2.4 * hh; if (hh > 0.25) { P.hf = 2; } }
    var ph = clamp(s.phase || 1, 1, 4); P.frost = (ph - 1) / 3;
    P.eyes = P.eyes || clamp(ph - 1, 0, 3);
    if (s.enraged) P.flare = Math.max(P.flare, 0.5);
    if (s.open != null) P.open = clamp(+s.open, 0, 1); else if (s.exposed && !s.stun && !P.atk) P.open = Math.max(P.open, 0.0);
    if (s.broken && s.broken.corazon) P.open = Math.max(P.open, 0.55);
    // aparicion con la ventisca (entrada): alpha global lo maneja drawBoss
    return P;
  }
  function yDeath(P, dt, s) {
    var a = clamp(dt / 900, 0, 1), c = ease((dt - 900) / 900), c2 = ease((dt - 1700) / 100);
    P.dead = dt; P.atk = null; P.hf = dt < 1700 ? 2 : 3; P.skid = 0; P.charge = 0; P.breath = 0; P.pulse = 0; P.summon = 0; P.wind = 0; P.blocks = 0; P.vapor = 0; P.spray = 0; P.ring = 0; P.flare = 0;
    P.collapse = c; P.crackFx = clamp(dt / 1700, 0, 1); P.fly = clamp((dt - 500) / 1300, 0, 1);
    P.tilt = sin(dt / 90) * 0.05 * (1 - a) * (dt < 900 ? 1 : 0) + 0.1 * c; P.by = 46 * c + (dt < 900 ? sin(dt / 70) * 2 * (1 - a) : 0); P.hr = 0.3 * a + 0.35 * c; P.tk.a0 = lerp(0.9, 1.6, a); P.tk.c = 0.03; P.tk.abs = false;
    P.shake = dt < 900 ? 5 * (1 - a * 0.5) : (dt < 1800 ? 2.4 * (1 - c) + 0.6 : 0); P.glow = 1 - c * 0.5; P.eyes = dt > 900 ? 0 : P.eyes;
    P.legs.forEach(function (L, i) { L.f = c > 0.2 ? 1 : 0; L.dx = (i < 2 ? -6 : 6) * c; }); P.fit = true; P.moving = 0; P.step = 0; P.dust = dt > 900 && dt < 1800 ? 0.6 : 0;
    P.open = Math.max(P.open, a); return P;
  }
  function yPoseFor(s) { var P = yPose(s); if (s.dying) yDeath(P, Math.min(s.dt != null ? s.dt : (s.deathT || 0), 1800), s); return P; }
  function yLayout(P, s) {
    var br = s.broken || {}, near = hdx(P, 138, 8), far = hdx(P, 128, 4), rot = P.hr + P.tilt * 0 + P.tuskR, i;
    function tip(root, rr) { var c = cos(rr), sn = sin(rr); return { x: root.x + TUSKV[0] * c - TUSKV[1] * sn, y: root.y + TUSKV[0] * sn + TUSKV[1] * c }; }
    var nearTip = tip(near, rot), farTip = tip(far, rot), tk = trunkPts(P), tt = tk[tk.length - 1];
    var out = { tusk: near, tuskTip: nearTip, tuskFar: far, tuskFarTip: farTip, trunk: tk, trunkTip: { x: tt[0], y: tt[1] }, rot: rot };
    return out;
  }

  // ================================================================= RENDER
  function drawTrunk(x, pts, P, far) {
    var n = pts.length - 1, i, w0 = 31, w1 = 13;
    function wAt(k) { return lerp(w0, w1, k / n); }
    x.lineCap = 'round'; x.lineJoin = 'round';
    for (i = 0; i < n; i++) { x.strokeStyle = OLC; x.lineWidth = wAt(i) + 4.6; x.beginPath(); x.moveTo(pts[i][0], pts[i][1]); x.lineTo(pts[i + 1][0], pts[i + 1][1]); x.stroke(); }
    for (i = 0; i < n; i++) { x.strokeStyle = Y.furS; x.lineWidth = wAt(i); x.beginPath(); x.moveTo(pts[i][0], pts[i][1]); x.lineTo(pts[i + 1][0], pts[i + 1][1]); x.stroke(); }
    for (i = 0; i < n; i++) { x.strokeStyle = Y.fur; x.lineWidth = wAt(i) * 0.72; x.beginPath(); x.moveTo(pts[i][0] - 1.4, pts[i][1] - 1.7); x.lineTo(pts[i + 1][0] - 1.4, pts[i + 1][1] - 1.7); x.stroke(); }
    x.strokeStyle = 'rgba(106,128,162,0.85)'; x.lineWidth = 1.2;
    for (i = 1; i < n; i++) {
      var a = pts[i - 1], b = pts[i + 1], dx = b[0] - a[0], dy = b[1] - a[1], d = Math.sqrt(dx * dx + dy * dy) || 1, nx = -dy / d, ny = dx / d, w = wAt(i) * 0.5 - 1;
      x.beginPath(); x.moveTo(pts[i][0] + nx * w, pts[i][1] + ny * w); x.quadraticCurveTo(pts[i][0] + dx / d * 1.6, pts[i][1] + dy / d * 1.6, pts[i][0] - nx * w, pts[i][1] - ny * w); x.stroke();
    }
    // punta con dos "dedos" y carambano
    var e = pts[n], p = pts[n - 1], ang = Math.atan2(e[1] - p[1], e[0] - p[0]);
    x.save(); x.translate(e[0], e[1]); x.rotate(ang); x.fillStyle = Y.ice; x.strokeStyle = OLC; x.lineWidth = 1.6; x.beginPath(); x.moveTo(2, -3.6); x.lineTo(8, -1); x.lineTo(2, 0.6); x.closePath(); x.fill(); x.stroke(); x.beginPath(); x.moveTo(2, 1); x.lineTo(7, 3.4); x.lineTo(1, 4); x.closePath(); x.fill(); x.stroke(); x.restore();
  }
  function legDraw2(x, i, P, s) {
    var L = LEGS[i], Q = P.legs[i], hipTop = xf(P, L.x, HIPY), sp = A.sprite('boss_yarlak_leg', (L.far ? 4 : 0) + Q.f), natH = sp.height, w = sp.width;
    var top = hipTop.y, h = natH;
    if (Q.f <= 1 && P.fit) { h = clamp(GY - top, natH * 0.55, natH * 1.04); }
    if (Q.f >= 2) { /* levantada: geometria propia del frame */ }
    var px = hipTop.x + Q.dx - w / 2;
    x.drawImage(sp, px, top, w, h);
    return { x: px + w / 2, y: top + h };
  }
  function renderCore(R, s, f, t, dying, dt) {
    var x = beginR(R), P = yPoseFor(s), Lt = yLayout(P, s), br = s.broken || {}, i;
    var shx = P.shake ? sin(t * 0.13) * P.shake : 0, shy = P.shake ? cos(t * 0.17) * P.shake * 0.6 : 0;
    x.translate(R.OX + shx, R.OY + shy); if (f < 0) x.scale(-1, 1);
    extR(R, -250, -210, 250, 130);
    var armor = br.armadura ? 0 : (s.armor == null ? 1 : clamp(+s.armor, 0, 1));
    var fly = dying ? P.fly : 0, exposedOpen = P.open;
    // ---- patas lejanas
    var feet = [];
    feet[0] = legDraw2(x, 0, P, s); feet[2] = legDraw2(x, 2, P, s); feet[1] = legDraw2(x, 1, P, s); feet[3] = legDraw2(x, 3, P, s);
    // ---- grupo A: cuerpo, corazon, costra, placas
    x.save(); x.translate(PVX, PVY + P.by); x.rotate(P.tilt); x.translate(-PVX, -PVY);
    var o2 = exposedOpen;
    x.drawImage(A.sprite('boss_yarlak_body', 0), -116, -100);
    if (o2 > 0.2) { x.globalAlpha = clamp((o2 - 0.2) / 0.4, 0, 1); x.drawImage(A.sprite('boss_yarlak_body', 1), -116, -100); x.globalAlpha = 1; }
    var hbeat = 1 + 0.1 * sin(t / (P.atk === 'latido' ? 110 : 330)) + (P.flare * 0.06), hfr = br.corazon ? 2 : (s.exposed || o2 > 0.6 ? 1 : 0), hs = A.sprite('boss_yarlak_heart', hfr), hsc = (hfr === 1 ? 1.22 : (o2 > 0.1 ? 1.08 : 0.92)) * (br.corazon ? 1 : hbeat);
    x.save(); x.globalAlpha = br.corazon ? 0.95 : clamp(0.55 + o2 * 0.45 + P.glow * 0.15, 0, 1); x.translate(60, 0); x.scale(hsc, hsc); x.drawImage(hs, -hs.width / 2, -hs.height / 2); x.restore();
    var cfr = o2 > 0.5 ? 2 : ((P.frost >= 0.6 || armor <= 0.001 || br.armadura) ? 1 : 0), cs = A.sprite('boss_yarlak_crust', cfr);
    if (!(br.corazon && cfr === 2 && false)) x.drawImage(cs, 60 - cs.width / 2, -cs.height / 2, cs.width, cs.height);
    // placas
    var pdone = !!br.armadura;
    for (i = 0; i < 5; i++) {
      var PL = PLATES[i], present = !br.armadura && armor > PL.th, crack = present && (armor - PL.th) < 0.14 && armor < 0.99, fr2 = present ? (crack ? 1 : 0) : 2;
      if (present && fly > 0 && dying) fr2 = 2;
      var ps = A.sprite('boss_yarlak_plate', fr2), sc = PL.s;
      x.save(); x.translate(PL.x, PL.y + 6); x.rotate(PL.r); x.drawImage(ps, -ps.width / 2 * sc, -ps.height * 0.93 * sc, ps.width * sc, ps.height * sc); x.restore();
    }
    x.restore();
    // ---- patas cercanas
    // ---- grupo B: colmillo lejano, trompa, cabeza, ojos, colmillo cercano
    x.save(); x.translate(PVX, PVY + P.by); x.rotate(P.tilt); x.translate(-PVX, -PVY);
    var tfar = A.sprite('boss_yarlak_tusk_l', br.colmillos ? 1 : 0), tnear = A.sprite('boss_yarlak_tusk_r', br.colmillos ? 1 : 0), hideTusk = dying && fly > 0 && !br.colmillos;
    function tuskAt(sp, root) { x.save(); x.translate(root.x, root.y); x.rotate(Lt.rot); x.drawImage(sp, -16, -8); x.restore(); }
    if (!hideTusk) tuskAt(tfar, Lt.tuskFar);
    drawTrunk(x, Lt.trunk, P);
    x.save(); x.translate(NJX, NJY); x.rotate(P.hr); x.scale(HS, HS); x.translate(-NJX, -NJY);
    x.drawImage(A.sprite('boss_yarlak_head', P.hf), 64, -84);
    if (P.hf !== 2 && P.hf !== 3) { var es = A.sprite('boss_yarlak_eyes', clamp(P.eyes, 0, 3)); x.drawImage(es, 136 - es.width / 2, -32 - es.height / 2); }
    x.restore();
    if (!hideTusk) tuskAt(tnear, Lt.tusk);
    // brillos aditivos
    x.globalCompositeOperation = 'lighter';
    var ec = EYE[clamp(P.eyes, 0, 3)][2], ep = hdx(P, 136, -32);
    if (P.hf !== 2 && P.hf !== 3) glowAt(x, ep.x, ep.y, 20 + P.flare * 8, ec, 0.5 + P.flare * 0.2);
    glowAt(x, 60, 0, 30 + o2 * 30 + P.glow * 10 + P.flare * 10, br.corazon ? '40,90,160' : '95,240,255', clamp(0.1 + o2 * 0.45 + P.glow * 0.14 + (s.exposed ? 0.2 : 0) + P.frost * 0.12, 0, 0.8));
    if (P.flare > 0.15) { for (i = 0; i < 5; i++) { if (armor > PLATES[i].th && !br.armadura) glowAt(x, PLATES[i].x, PLATES[i].y - 12, 22, '159,216,255', 0.35 * P.flare); } glowAt(x, Lt.tuskTip.x, Lt.tuskTip.y, 14, '207,238,255', 0.4 * P.flare); }
    x.globalCompositeOperation = 'source-over';
    x.restore();
    return { R: R, P: P, Lt: Lt, feet: feet };
  }
  // mascara de celdas (14 px) del cuerpo muerto a 1800 ms: se calcula una vez
  var CELL = 16, MC = 28, MR = 20, MASK = null;
  function ensureMask(R, s) {
    if (MASK) return;
    var s2 = { t: 0, facing: 1, phase: s.phase, dying: true, dt: 1800, id: 'yarlak', broken: s.broken, armor: s.armor }, r = renderCore(R, s2, 1, 0, true, 1800), ox = R.OX - MC * CELL / 2, oy = R.OY - 210, sm = mkc(MC, MR), g = sm.getContext('2d');
    g.imageSmoothingEnabled = true; g.drawImage(R.cv, ox, oy, MC * CELL, MR * CELL, 0, 0, MC, MR);
    var d = g.getImageData(0, 0, MC, MR).data; MASK = new Uint8Array(MC * MR); for (var i = 0; i < MC * MR; i++) MASK[i] = d[i * 4 + 3] > 40 ? 1 : 0;
    endR(R);
  }
  function cellTh(i, j) { return pr(i * 7 + j * 13 + 1) * 0.42 + (j / MR) * 0.5 + (pr(i + 90) - 0.5) * 0.1; }
  function renderYarlak(s) {
    var R = getR('yarlak', 640, 520, 320, 330), f = s.facing < 0 ? -1 : 1, t = s.t || 0, dying = !!s.dying, dt = dying ? (s.dt != null ? s.dt : (s.deathT || 0)) : 0, i;
    if (dying && dt >= YDEATH) { beginR(R); R.bb = { x0: 0, y0: 0, x1: 1, y1: 1 }; endR(R); return { canvas: R.cv, ox: R.OX, oy: R.OY, box: R.box }; }
    if (dying && dt >= 1800) ensureMask(R, s);
    var C = renderCore(R, s, f, t, dying, dt), P = C.P, x = R.cv.getContext('2d'), bx = endR(R);
    // tintes
    x.setTransform(1, 0, 0, 1, 0, 0); x.globalCompositeOperation = 'source-atop';
    function fill(c) { x.fillStyle = c; x.fillRect(bx.x, bx.y, bx.w, bx.h); }
    if (s.enraged && !dying) fill('rgba(220,245,255,' + (0.14 + 0.1 * Math.sin(t / 150)).toFixed(3) + ')');
    if (s.exposed && !dying) fill('rgba(200,240,255,' + (0.18 + 0.12 * Math.sin(t / 130)).toFixed(3) + ')');
    if (s.immune && !dying) fill('rgba(150,200,255,' + (0.24 + 0.12 * Math.sin(t / 90)).toFixed(3) + ')');
    var hv = s.hurt === true ? 1 : clamp(+s.hurt || 0, 0, 1);
    if (dying && dt < 900) hv = Math.max(hv, (Math.floor(dt / 70) % 2) ? 0.8 : 0.1); if (dying && dt < 150) hv = 1;
    if (hv > 0) fill('rgba(255,255,255,' + (hv * 0.85).toFixed(3) + ')');
    // grietas de escarcha que se extienden por el cuerpo al morir
    if (dying && P.crackFx > 0 && dt < 1800) {
      x.globalCompositeOperation = 'source-atop'; x.strokeStyle = 'rgba(236,250,255,0.95)'; x.lineWidth = 1.8; x.lineCap = 'round';
      x.save(); x.translate(R.OX, R.OY); if (f < 0) x.scale(-1, 1);
      for (i = 0; i < 9; i++) {
        var cx0 = -100 + pr(i + 4) * 200, cy0 = -80 + pr(i + 9) * 120, n2 = Math.floor(2 + P.crackFx * 5);
        x.beginPath(); x.moveTo(cx0, cy0); for (var k = 1; k <= n2; k++) x.lineTo(cx0 + (pr(i * 5 + k) - 0.5) * 36 * k * 0.9, cy0 + (pr(i * 5 + k + 40) - 0.2) * 22 * k * 0.9); x.stroke();
      }
      x.restore();
    }
    // desintegracion en bloques de hielo
    if (dying && dt >= 1800 && MASK) {
      var u = clamp((dt - 1800) / 1500, 0, 1.2), ox = R.OX - MC * CELL / 2, oy = R.OY - 210;
      x.globalCompositeOperation = 'destination-out'; x.fillStyle = '#000';
      for (var j = 0; j < MR; j++) for (var ii = 0; ii < MC; ii++) { var li = f < 0 ? MC - 1 - ii : ii; if (u > cellTh(li, j)) x.fillRect(ox + ii * CELL - 0.5, oy + j * CELL - 0.5, CELL + 1, CELL + 1); }
    }
    x.globalCompositeOperation = 'source-over';
    x.setTransform(1, 0, 0, 1, 0, 0);
    return { canvas: R.cv, ox: R.OX, oy: R.OY, pose: P, layout: C.Lt, box: bx, feet: C.feet };
  }

  // ---- sombra, aura y efectos delanteros
  function yShadow(ctx, px, py, s) {
    var al = 0.42, wd = 1; if (s.dying && s.dt > 1700) { al *= 1 - clamp((s.dt - 1700) / 1800, 0, 1); }
    if (s.dying && s.dt >= YDEATH) return;
    ctx.save(); ctx.translate(px, py + GY + 6);
    ctx.fillStyle = 'rgba(8,16,40,' + (al * 0.5).toFixed(3) + ')'; ctx.beginPath(); ctx.ellipse(0, 0, 176 * wd, 48, 0, 0, TAU); ctx.fill();
    ctx.fillStyle = 'rgba(8,16,40,' + (al * 0.8).toFixed(3) + ')'; ctx.beginPath(); ctx.ellipse(0, 0, 140 * wd, 36, 0, 0, TAU); ctx.fill();
    ctx.restore();
  }
  function yAura(ctx, px, py, s, P) {
    var t = s.t || 0, a = 0.14 + 0.08 * P.glow + 0.04 * sin(t / 300) + P.frost * 0.1 + (s.exposed ? 0.1 : 0) + (s.dying ? -0.1 * clamp(s.dt / 3000, 0, 1) : 0);
    ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = clamp(a, 0, 0.6); ctx.drawImage(glowSpr('120,200,255'), px - 230, py + GY - 74, 460, 132); ctx.restore();
  }
  function wp2(f, gx, gy, lx, ly) { return { x: gx + f * lx, y: gy + ly }; }
  function yFront(ctx, px, py, s, P, R) {
    var t = s.t || 0, f = s.facing < 0 ? -1 : 1, gx = px, gy = py, i, Lt = R.layout, br = s.broken || {}, dying = !!s.dying, dt = dying ? (s.dt != null ? s.dt : 0) : 0;
    function W(lx, ly) { return { x: gx + f * lx, y: gy + ly }; }
    function G(p) { var q = xf(P, p.x, p.y); return W(q.x, q.y); }
    // trazos y rastro de derrape
    if ((P.atk === 'embestida' && s.strike === 'embestida') || P.skid > 0.02) {
      var dir = s.aim != null ? s.aim : (f > 0 ? 0 : PI), sk = P.skid > 0 ? 1 : ease(s.sp != null ? s.sp : 0.5);
      A.drawYarlakSkid(ctx, gx - cos(dir) * 30, gy + GY - 4, dir + PI, 70 + 230 * sk, 1, { t: t, snow: true, alpha: 0.9 });
    }
    // polvo de pisadas y nieve levantada
    if (P.step > 0.35 && !dying) { for (i = 0; i < 2; i++) { var fp = W(P.stepFoot === 1 ? -62 + i * 20 : 58 + i * 20, GY - 2), sf = A.sprite('fx_snow_puff', Math.min(3, Math.floor((1 - P.step) * 6))); ctx.globalAlpha = 0.6 * P.step; ctx.drawImage(sf, fp.x - 18, fp.y - 24, 36, 36); } ctx.globalAlpha = 1; }
    if (P.dust > 0.05 && !dying) {
      ctx.save(); for (i = 0; i < 6; i++) { var ph = ((t / 700) + i / 6) % 1, dxp = (pr(i + 3) - 0.5) * 240, sfp = A.sprite('fx_snow_puff', Math.min(3, Math.floor(ph * 4))); ctx.globalAlpha = 0.55 * P.dust * (1 - ph); ctx.drawImage(sfp, gx + dxp - 20 * (1 + ph), gy + GY - 26 - ph * 16, 40 * (1 + ph), 40 * (1 + ph)); } ctx.restore();
    }
    if (P.spray > 0.05) { ctx.save(); ctx.fillStyle = 'rgba(240,248,255,0.9)'; for (i = 0; i < 12; i++) { var ph2 = ((t / 420) + i / 12) % 1, o = W(70 + 20 * ph2 * (1 + P.spray), GY - 6 - ph2 * 36 * P.spray); ctx.globalAlpha = (1 - ph2) * P.spray; ctx.fillRect(o.x - 2, o.y - 2 - pr(i) * 6, 3.4 * (1 - ph2) + 1, 3.4 * (1 - ph2) + 1); } ctx.restore(); }
    // vapor de la trompa
    var tp = G(Lt.trunkTip);
    if (P.vapor > 0.05 || P.frost >= 0.6 || s.enraged) {
      var vv = Math.max(P.vapor, P.frost >= 0.6 ? 0.35 : 0, s.enraged ? 0.5 : 0); ctx.save();
      for (i = 0; i < 4; i++) { var phv = ((t / 900) + i / 4) % 1, sfb = A.sprite('fx_yarlak_breath', Math.min(3, Math.floor(phv * 4))); ctx.globalAlpha = 0.6 * vv * (1 - phv); ctx.drawImage(sfb, tp.x + f * phv * 24 - 14, tp.y - phv * 20 - 14, 28, 28); }
      ctx.restore();
    }
    // aliento polar
    if (P.breath > 0.02) A.drawYarlakBreath(ctx, tp.x, tp.y, s.aim || 0, P.breath, { t: t, len: 480 });
    // pulso del Latido
    if (P.pulse > 0.01) { var cp = G({ x: 60, y: 0 }); A.drawYarlakPulse(ctx, cp.x, cp.y, P.pulse, { r: 280, t: t }); }
    // llamada (anillo morado de aullido)
    if (P.summon > 0.02) {
      ctx.save(); ctx.translate(gx, gy + GY - 4); ctx.scale(1, 0.34); ctx.strokeStyle = 'rgba(176,90,240,' + (0.55 * P.summon).toFixed(2) + ')'; ctx.lineWidth = 5; ctx.setLineDash([14, 10]); ctx.lineDashOffset = -t / 20; ctx.beginPath(); ctx.arc(0, 0, 150 * P.summon, 0, TAU); ctx.stroke();
      ctx.setLineDash([]); ctx.strokeStyle = 'rgba(220,170,255,0.7)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(0, 0, Math.max(1, 150 * P.summon - 12), 0, TAU); ctx.stroke(); ctx.restore();
    }
    // bloques que flotan sobre el lomo (Alud)
    if (P.blocks > 0.02) {
      var bl = P.blocks, up = bl > 1 ? (bl - 1) : 0;
      for (i = 0; i < 4; i++) { var bs = A.sprite('fx_ice_block', 0), bp = W(-80 + i * 52, -140 - 24 * Math.min(bl, 1) - sin(t / 260 + i) * 5 - up * 220 + (i % 2) * 10); ctx.globalAlpha = clamp(Math.min(bl, 1) * 1.4, 0, 1) * (1 - up); ctx.drawImage(bs, bp.x - 22, bp.y - 22, 44, 44); }
      ctx.globalAlpha = 1;
    }
    // remolino de ventisca alrededor del cuerpo
    if (P.wind > 0.02) {
      ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.strokeStyle = 'rgba(232,248,255,' + (0.5 * P.wind).toFixed(2) + ')'; ctx.lineWidth = 3; ctx.lineCap = 'round';
      for (i = 0; i < 7; i++) { var a0 = t / 360 * (i % 2 ? 1 : -1) + i * 0.9, rr = 150 + (i % 3) * 22; ctx.beginPath(); ctx.ellipse(gx, gy - 10, rr, rr * 0.5, 0, a0, a0 + 0.9); ctx.stroke(); }
      ctx.restore();
    }
    // Invierno Eterno: anillo de carambanos girando en el suelo
    if (P.ring > 0) {
      ctx.save(); ctx.translate(gx, gy + GY - 2); ctx.scale(1, 0.32); ctx.strokeStyle = 'rgba(159,216,255,0.5)'; ctx.lineWidth = 6; ctx.setLineDash([22, 14]); ctx.lineDashOffset = -t / 24; ctx.beginPath(); ctx.arc(0, 0, 170 + 6 * sin(t / 300), 0, TAU); ctx.stroke(); ctx.restore();
    }
    // golpe de la cornada: estela de los colmillos
    if (s.strike === 'cornada' && s.sp != null || (s.strike === 'cornada' && s.sp == null)) {
      var spv = s.sp != null ? s.sp : ((t % 700) / 700), pts = [], k;
      for (k = 0; k < 7; k++) { var s2 = {}; for (var key in s) s2[key] = s[key]; s2.sp = clamp(spv - k * 0.045, 0, 1); s2.facing = 1; var Pk = yPose(s2), Lk = yLayout(Pk, s2); pts.push((function () { var q = xf(Pk, Lk.tuskTip.x, Lk.tuskTip.y); return W(q.x, q.y); })()); }
      ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.lineCap = 'round';
      for (k = 0; k < 6; k++) { ctx.strokeStyle = 'rgba(207,240,255,' + (0.55 * (1 - k / 6)).toFixed(3) + ')'; ctx.lineWidth = 14 * (1 - k / 6) + 2; ctx.beginPath(); ctx.moveTo(pts[k].x, pts[k].y); ctx.lineTo(pts[k + 1].x, pts[k + 1].y); ctx.stroke(); }
      ctx.restore();
    }
    // carambanos que caen del flequillo (F2+, herido)
    if (P.frost > 0.2 || s.hurt > 0.3) {
      for (i = 0; i < 3; i++) {
        var cyc = 1700, ph3 = ((t + i * 590) % cyc) / cyc, sl = Math.floor((t + i * 590) / cyc), sx = -90 + pr(sl * 3 + i) * 190;
        if (ph3 > 0.55) { var fu = (ph3 - 0.55) / 0.45, ic = A.sprite('fx_yarlak_icicle', 2), fy = 66 + fu * fu * (GY - 66 + 14), ip = W(sx, fy); ctx.globalAlpha = 1 - clamp((fu - 0.9) * 10, 0, 1); ctx.drawImage(ic, ip.x - 8, ip.y - 14, 16, 36); ctx.globalAlpha = 1; if (fu > 0.9) { var sf2 = A.sprite('fx_snow_puff', 1); ctx.globalAlpha = 0.5; ctx.drawImage(sf2, ip.x - 10, ip.y - 8, 24, 24); ctx.globalAlpha = 1; } }
        else if (ph3 > 0.3) { var ic2 = A.sprite('fx_yarlak_icicle', ph3 > 0.45 ? 1 : 0), ip2 = W(sx, 66); ctx.drawImage(ic2, ip2.x - 8, ip2.y - 4 + (ph3 > 0.45 ? sin(t / 30) : 0), 16, 36); }
      }
    }
    // piezas que salen despedidas al morir (colmillos y placas)
    if (dying && dt >= 500 && dt < 3200) {
      var fu2 = clamp((dt - 500) / 1300, 0, 1.6), tm = (dt - 500) / 1000;
      function flyPiece(spr, lx, ly, vx, vy, rot0, vr, sc) { var xx = lx + vx * tm, yy = ly + vy * tm + 380 * tm * tm; if (yy > GY - 6) yy = GY - 6 + sin(tm * 3) * 0 ; var al = 1 - clamp((dt - 2600) / 600, 0, 1); ctx.save(); ctx.globalAlpha = al; var wq = W(xx, yy); ctx.translate(wq.x, wq.y); ctx.rotate(f * (rot0 + vr * Math.min(tm, 1.1))); ctx.drawImage(spr, -spr.width / 2 * sc, -spr.height / 2 * sc, spr.width * sc, spr.height * sc); ctx.restore(); }
      if (!br.colmillos) { flyPiece(A.sprite('boss_yarlak_tusk_r', 0), 140, 40, 110, -330, 0, 5, 1); flyPiece(A.sprite('boss_yarlak_tusk_l', 0), 128, 36, 60, -280, 0.3, -4, 1); }
      var armorV = br.armadura ? 0 : (s.armor == null ? 1 : clamp(+s.armor, 0, 1));
      for (i = 0; i < 5; i++) if (armorV > PLATES[i].th) flyPiece(A.sprite('boss_yarlak_plate', 0), PLATES[i].x, PLATES[i].y, (i - 2) * 90 - 20, -300 - (i % 2) * 60, PLATES[i].r, (i % 2 ? 4 : -4), PLATES[i].s);
    }
    // desmoronamiento: cada celda cae como un bloque de hielo
    if (dying && dt >= 1800 && MASK) {
      var uu = clamp((dt - 1800) / 1500, 0, 1.2), ox2 = -MC * CELL / 2, oy2 = -210 + (GY - 0) * 0 ;
      var fade = 1 - clamp((dt - 2900) / 600, 0, 1), j, ii;
      for (j = 0; j < MR; j++) for (ii = 0; ii < MC; ii++) {
        if (!MASK[j * MC + ii]) continue; var th = cellTh(ii, j);
        if (uu <= th) continue;
        var tc = (uu - th) * 1500 / 1000, cxl = ox2 + ii * CELL + CELL / 2, cyl = oy2 + j * CELL + CELL / 2, vy0 = 30 * pr(ii * 3 + j);
        var gnd = GY - 6 - pr(ii + j * 5) * 12, yy2 = Math.min(cyl + vy0 * tc + 520 * tc * tc, gnd);
        var xx2 = cxl + (pr(ii * 2 + j) - 0.5) * 40 * Math.min(tc, 0.6), wq2 = W(xx2, yy2), landed = yy2 >= gnd;
        ctx.save(); ctx.globalAlpha = landed ? fade * 0.95 : 0.95; ctx.translate(wq2.x, wq2.y); ctx.rotate(landed ? (pr(ii + j) - 0.5) : tc * 3 * (pr(ii) - 0.5));
        var sz = CELL * (0.46 + pr(ii * 5 + j * 3) * 0.3) * (landed ? 0.9 : 1), col = (ii + j) % 3 === 0 ? '#cfeeff' : ((ii + j) % 3 === 1 ? Y.ice : Y.iceM);
        ctx.fillStyle = col; ctx.strokeStyle = OLC; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.moveTo(-sz, sz * 0.7); ctx.lineTo(-sz * 0.6, -sz * 0.8); ctx.lineTo(sz * 0.8, -sz * 0.5); ctx.lineTo(sz, sz * 0.7); ctx.closePath(); ctx.fill(); ctx.stroke();
        ctx.fillStyle = 'rgba(255,255,255,0.6)'; ctx.fillRect(-sz * 0.5, -sz * 0.5, sz * 0.5, 2); ctx.restore();
      }
      for (i = 0; i < 5; i++) { var bph = clamp((dt - 1800 - i * 220) / 700, 0, 1); if (bph > 0 && bph < 1) { var bs2 = A.sprite('fx_ice_burst', Math.min(4, Math.floor(bph * 5))), bq = W(-110 + i * 55, -10 - (i % 2) * 40); ctx.drawImage(bs2, bq.x - 60, bq.y - 60, 120, 120); } }
    }
    // aro de ventana blanco-azulado + corazon
    if (s.exposed && !dying) {
      var wr = A.animFrame('fx_yarlak_window', 'loop', t), pu = 1 + 0.05 * sin(t / 150), Wd = 330 * pu;
      ctx.save(); ctx.globalAlpha = 0.85; ctx.translate(gx, gy + GY - 4); ctx.scale(1, 0.38); ctx.drawImage(wr, -Wd * 0.6, -Wd * 0.6, Wd * 1.2, Wd * 1.2); ctx.restore();
      if (P.open > 0.5 && !br.corazon) { var w2 = 86 * pu, cq = G({ x: 60, y: 0 }); ctx.save(); ctx.globalAlpha = 0.9; ctx.drawImage(wr, cq.x - w2 / 2, cq.y - w2 / 2, w2, w2); ctx.restore(); }
    }
    if (s.immune && !dying) { ctx.save(); ctx.strokeStyle = 'rgba(200,235,255,' + (0.5 + 0.3 * sin(t / 100)).toFixed(2) + ')'; ctx.lineWidth = 3; ctx.setLineDash([12, 8]); ctx.lineDashOffset = -t / 30; ctx.beginPath(); ctx.ellipse(gx, gy - 24, 200, 150, 0, 0, TAU); ctx.stroke(); ctx.restore(); }
    if (s.stun && !dying) {
      var hp = G({ x: Lt.tuskFar.x - 14, y: Lt.tuskFar.y - 64 });
      for (i = 0; i < 3; i++) {
        var aa2 = t / 380 + i * TAU / 3, sx3 = hp.x + cos(aa2) * 42, sy3 = hp.y + sin(aa2) * 10;
        ctx.save(); ctx.translate(sx3, sy3); ctx.rotate(t / 300 + i); ctx.fillStyle = '#e8f8ff'; ctx.strokeStyle = OLC; ctx.lineWidth = 1.6; ctx.beginPath();
        for (var k2 = 0; k2 < 8; k2++) { var rk = k2 % 2 ? 2.7 : 6; ctx.lineTo(cos(k2 * TAU / 8) * rk, sin(k2 * TAU / 8) * rk); } ctx.closePath(); ctx.stroke(); ctx.fill(); ctx.restore();
      }
    }
  }
  A.yarlakGait = function (speed, t) {
    var hz = gaitHz(speed > 0 ? speed : 60), u = ((t || 0) / 1000 * hz) % 1;
    return { u: u, hz: hz, stepHz: hz * 2, impact: Math.pow(Math.max(0, cos(4 * PI * u)), 8), foot: (u < 0.25 || u >= 0.75) ? 'rear' : 'front' };
  };

  // ================================================================= VFX en funciones
  // estela de derrape: (x,y) = punto donde empieza (el cuerpo), a = direccion en la que se EXTIENDE la estela (rad), len px, p 0..1 alfa/crecimiento
  A.drawYarlakSkid = function (ctx, x, y, a, len, p, o) {
    o = o || {}; p = clamp(p == null ? 1 : p, 0, 1); var t = o.t || 0, i, al = (o.alpha == null ? 1 : o.alpha) * p;
    ctx.save(); ctx.translate(x, y); ctx.rotate(a); ctx.lineCap = 'round';
    for (i = -1; i <= 1; i++) {
      ctx.strokeStyle = 'rgba(27,17,36,' + (0.5 * al).toFixed(3) + ')'; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(0, i * 26); ctx.lineTo(len, i * 26 + (i ? i * 4 : 0)); ctx.stroke();
      ctx.strokeStyle = 'rgba(232,248,255,' + (0.85 * al).toFixed(3) + ')'; ctx.lineWidth = 2.2; ctx.beginPath(); ctx.moveTo(0, i * 26 - 1); ctx.lineTo(len, i * 26 + (i ? i * 4 : 0) - 1); ctx.stroke();
    }
    if (o.snow !== false) { for (i = 0; i < 10; i++) { var ph = (t / 600 + i / 10) % 1, px = len * pr(i + 2) * 0.9, py = (pr(i + 8) - 0.5) * 70 - ph * 14; ctx.fillStyle = 'rgba(240,248,255,' + (0.8 * (1 - ph) * al).toFixed(3) + ')'; ctx.fillRect(px, py, 3.4 * (1 - ph) + 1, 3.4 * (1 - ph) + 1); } }
    ctx.restore();
  };
  // cono de aliento polar: origen (x,y) = punta de la trompa (anchors.trunkTip), a = direccion, p 0..1 = despliegue
  A.drawYarlakBreath = function (ctx, x, y, a, p, o) {
    o = o || {}; var t = o.t != null ? o.t : performance.now(), Ln = (o.len || 480) * ease(p), n, half = (o.arc || 50 * PI / 180) / 2;
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    [[0.6, 'rgba(60,120,220,0.20)'], [0.42, 'rgba(120,200,255,0.26)'], [0.22, 'rgba(232,248,255,0.34)']].forEach(function (c, k) {
      ctx.fillStyle = c[1]; ctx.beginPath(); ctx.moveTo(x, y);
      for (n = 0; n <= 10; n++) { var u = n / 10, r = Ln * u, w = half * c[0] / 0.6 * (0.2 + u) * (1 + 0.1 * sin(t / 70 + n * 1.7 + k)); ctx.lineTo(x + cos(a - w) * r, y + sin(a - w) * r); }
      for (n = 10; n >= 0; n--) { var u2 = n / 10, r2 = Ln * u2, w2 = half * c[0] / 0.6 * (0.2 + u2) * (1 + 0.1 * sin(t / 70 + n * 1.3 + k)); ctx.lineTo(x + cos(a + w2) * r2, y + sin(a + w2) * r2); }
      ctx.closePath(); ctx.fill();
    });
    for (n = 0; n < 5; n++) { var ph = ((t / 520) + n / 5) % 1, rr = ph * Ln, aa = a + (pr(n + 4) - 0.5) * half * 1.4 * (0.2 + ph), sf = A.sprite('fx_yarlak_breath', Math.min(3, Math.floor(ph * 4))), sz = 30 + ph * 40; ctx.globalAlpha = 0.8 * (1 - ph); ctx.drawImage(sf, x + cos(aa) * rr - sz / 2, y + sin(aa) * rr - sz / 2, sz, sz); }
    ctx.globalAlpha = 1;
    for (n = 0; n < 22; n++) { var ph2 = ((t / 480) + n / 22) % 1, rr2 = ph2 * Ln, aa2 = a + (pr(n + 14) - 0.5) * half * 1.8 * (0.2 + ph2), s2 = 4 * (1 - ph2) + 1.6; ctx.fillStyle = n % 2 ? 'rgba(255,255,255,0.9)' : 'rgba(150,215,255,0.9)'; ctx.fillRect(x + cos(aa2) * rr2 - s2 / 2, y + sin(aa2) * rr2 - s2 / 2, s2, s2); }
    ctx.restore();
  };
  // pulso del Latido gelido: (x,y) = pecho, p 0..1, o.r (280), o.inner (100)
  A.drawYarlakPulse = function (ctx, x, y, p, o) {
    o = o || {}; p = clamp(p, 0, 1); var R0 = (o.r || 280) * ease(p), al = 1 - p * 0.7, i;
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    ctx.strokeStyle = 'rgba(95,240,255,' + (0.35 * al).toFixed(3) + ')'; ctx.lineWidth = 22 * (1 - p) + 5; ctx.beginPath(); ctx.arc(x, y, R0, 0, TAU); ctx.stroke();
    ctx.strokeStyle = 'rgba(232,250,255,' + (0.8 * al).toFixed(3) + ')'; ctx.lineWidth = 6 * (1 - p) + 2; ctx.beginPath(); ctx.arc(x, y, R0, 0, TAU); ctx.stroke();
    var sf = A.sprite('fx_yarlak_pulse', Math.floor(((o.t || 0) / 90)) % 4); ctx.globalAlpha = 0.6 * (1 - p); var s0 = Math.max(20, R0 * 2 * 1.14); ctx.drawImage(sf, x - s0 / 2, y - s0 / 2, s0, s0); ctx.globalAlpha = 1;
    for (i = 0; i < 18; i++) { var a = i / 18 * TAU + p * 0.8; ctx.fillStyle = 'rgba(255,255,255,' + (0.8 * al).toFixed(2) + ')'; ctx.fillRect(x + cos(a) * R0 - 2, y + sin(a) * R0 - 2, 4, 4); }
    ctx.restore();
  };
  // estaca de hielo del Pisoton que brota: p 0..1 (0 aviso... 1 completa); (x,y) = centro de la colision (r 26)
  A.drawYarlakSpike = function (ctx, x, y, p, o) {
    o = o || {}; p = clamp(p, 0, 1); var fr = p < 0.2 ? 0 : (p < 0.5 ? 1 : 2), sp = A.sprite('fx_yarlak_spike', o.sink ? 3 : fr), sc = o.scale || 1.25;
    ctx.save(); ctx.globalAlpha = o.alpha == null ? 1 : o.alpha; ctx.drawImage(sp, x - 14 * sc, y - 44 * sc + 18 * sc, sp.width * sc, sp.height * sc); ctx.restore();
  };
  // ruptura de una placa o colmillo: p 0..1 (~800 ms); kind 'plate' | 'tusk' | 'heart'
  A.drawYarlakShards = function (ctx, x, y, p, o) {
    o = o || {}; p = clamp(p, 0, 1); var n = o.n || 9, i, kind = o.kind || 'plate', al = 1 - clamp((p - 0.6) / 0.4, 0, 1);
    ctx.save(); ctx.globalAlpha = al;
    for (i = 0; i < n; i++) {
      var a = pr(i + 3) * TAU, sp = 90 + pr(i + 9) * 150, px = x + cos(a) * sp * p, py = y + sin(a) * sp * p - 60 * p + 260 * p * p, sf = A.sprite('fx_yarlak_shard', kind === 'tusk' ? (i % 2 ? 1 : 3) : (kind === 'heart' ? (i % 2 ? 0 : 2) : i % 4)), sz = 22 * (0.7 + pr(i + 20) * 0.7);
      ctx.save(); ctx.translate(px, py); ctx.rotate(p * 6 * (pr(i) - 0.5) * 2); ctx.drawImage(sf, -sz / 2, -sz / 2, sz, sz); ctx.restore();
    }
    var bs = A.sprite('fx_ice_burst', Math.min(4, Math.floor(p * 5))); ctx.globalAlpha = 1; ctx.drawImage(bs, x - 50, y - 50, 100, 100);
    ctx.restore();
  };
  // carambano suelto: (x,y) = punta; p 0..1 cayendo desde y-h hasta y
  A.drawYarlakIcicle = function (ctx, x, y, p, o) {
    o = o || {}; var h = o.h || 140, yy = y - h * (1 - p * p), sp = A.sprite('fx_yarlak_icicle', 2), sc = o.scale || 1.2;
    ctx.save(); ctx.globalAlpha = o.alpha == null ? 1 : o.alpha; ctx.drawImage(sp, x - 8 * sc, yy - 36 * sc, 16 * sc, 36 * sc); ctx.restore();
  };

  // ================================================================= TELEGRAFIAS NUEVAS
  var COLS = { red: { f: '255,59,48', s: '#ff6a5a' }, blue: { f: '106,200,255', s: '#c0ecff' }, purple: { f: '176,90,240', s: '#dca0ff' }, white: { f: '232,248,255', s: '#ffffff' } };
  var T3 = { skidlane: 'red', polar: 'blue', stalag: 'red', block: 'red', avalanche: 'red', heartbeat: 'red' };
  function sector(path, x, y, r, a0, a1, inner) { if (inner > 0) { path.arc(x, y, r, a0, a1); path.arc(x, y, inner, a1, a0, true); } else { path.moveTo(x, y); path.arc(x, y, r, a0, a1); } path.closePath(); }
  function tele3(ctx, kind, x, y, o) {
    o = o || {}; var p = o.p == null ? 1 : clamp(o.p, 0, 1), col = COLS[o.color || T3[kind]], a = o.a || 0, t = o.t != null ? o.t : performance.now(), fix = o.fix != null ? o.fix : p >= 0.7, r = o.r || 100, path = new Path2D(), prog = new Path2D(), extra = null, noStroke = false, i;
    if (kind === 'skidlane') {
      var w = o.w || 110, len = o.len || 560, sk = o.skid == null ? 220 : o.skid, ca = cos(a), sa = sin(a);
      function rotRect(P2, x0, y0, w0, h0) { var pts = [[x0, y0], [x0 + w0, y0], [x0 + w0, y0 + h0], [x0, y0 + h0]]; pts.forEach(function (q, k) { var wx = x + q[0] * ca - q[1] * sa, wy = y + q[0] * sa + q[1] * ca; if (k) P2.lineTo(wx, wy); else P2.moveTo(wx, wy); }); P2.closePath(); }
      rotRect(path, 0, -w / 2, len, w); rotRect(prog, 0, -w / 2, len * p, w);
      extra = function () {
        // tramo de derrape punteado y mas claro
        ctx.save(); ctx.translate(x, y); ctx.rotate(a);
        ctx.fillStyle = 'rgba(255,170,160,' + (0.08 + 0.1 * p).toFixed(3) + ')'; ctx.fillRect(len, -w / 2, sk, w);
        ctx.strokeStyle = 'rgba(255,200,190,0.85)'; ctx.lineWidth = 2.4; ctx.setLineDash([6, 9]); ctx.lineDashOffset = -t / 40; ctx.strokeRect(len, -w / 2, sk, w); ctx.setLineDash([]);
        ctx.fillStyle = 'rgba(255,230,220,0.85)'; for (var q = 0; q < Math.floor(len / 70); q++) { var cx = 40 + q * 70 + ((t / 10) % 30) * p; ctx.beginPath(); ctx.moveTo(cx + 12, 0); ctx.lineTo(cx - 6, -9); ctx.lineTo(cx - 6, 9); ctx.closePath(); ctx.fill(); }
        ctx.fillStyle = 'rgba(232,248,255,0.8)'; for (var q2 = 0; q2 < 3; q2++) { var cx2 = len + 30 + q2 * 62; ctx.beginPath(); ctx.moveTo(cx2 + 10, 0); ctx.lineTo(cx2 - 4, -6); ctx.lineTo(cx2 - 4, 6); ctx.closePath(); ctx.fill(); }
        ctx.restore();
      };
    } else if (kind === 'polar') {
      var arc = o.arc || 50 * PI / 180, R0 = o.r || 480, sw = o.sweep == null ? 30 * PI / 180 : o.sweep, a0 = a - arc / 2, a1 = a + arc / 2 + sw;
      sector(path, x, y, R0, a0, a1, 0); sector(prog, x, y, R0 * p, a0, a1, 0);
      extra = function () {
        ctx.strokeStyle = 'rgba(232,250,255,0.95)'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(x, y, R0 * 0.94, a + arc / 2 - 0.02, a1); ctx.stroke();
        var ex = x + cos(a1) * R0 * 0.94, ey = y + sin(a1) * R0 * 0.94; ctx.fillStyle = 'rgba(232,250,255,0.95)'; ctx.beginPath(); ctx.moveTo(ex + cos(a1 + 1.57) * 12, ey + sin(a1 + 1.57) * 12); ctx.lineTo(ex + cos(a1 - 1.57) * 8, ey + sin(a1 - 1.57) * 8); ctx.lineTo(ex + cos(a1) * 14, ey + sin(a1) * 14); ctx.closePath(); ctx.fill();
        ctx.strokeStyle = 'rgba(232,250,255,0.55)'; ctx.lineWidth = 1.6; ctx.setLineDash([8, 8]); ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + cos(a - arc / 2) * R0, y + sin(a - arc / 2) * R0); ctx.moveTo(x, y); ctx.lineTo(x + cos(a1) * R0, y + sin(a1) * R0); ctx.stroke(); ctx.setLineDash([]);
        ctx.fillStyle = 'rgba(232,250,255,0.8)'; for (var q = 1; q <= 4; q++) { var d = R0 * q / 5 * Math.max(0.2, p), aa = a + arc / 2 * 0.2 * (q % 2 ? 1 : -1), cx = x + cos(aa) * d, cy = y + sin(aa) * d; ctx.beginPath(); ctx.moveTo(cx + cos(aa) * 9, cy + sin(aa) * 9); ctx.lineTo(cx + cos(aa + 1.57) * 4, cy + sin(aa + 1.57) * 4); ctx.lineTo(cx - cos(aa) * 7, cy - sin(aa) * 7); ctx.lineTo(cx + cos(aa - 1.57) * 4, cy + sin(aa - 1.57) * 4); ctx.closePath(); ctx.fill(); }
      };
    } else if (kind === 'stalag' || kind === 'block') {
      r = o.r || (kind === 'stalag' ? 26 : 50); path.arc(x, y, r, 0, TAU); prog.arc(x, y, Math.max(1, r * p), 0, TAU);
      extra = function () {
        if (kind === 'stalag') { ctx.fillStyle = 'rgba(232,248,255,' + (0.45 + 0.4 * p).toFixed(2) + ')'; for (var q = 0; q < 3; q++) { var bx = x + (q - 1) * r * 0.5, h = r * (0.5 + 0.5 * p) * (q === 1 ? 1.1 : 0.8); ctx.beginPath(); ctx.moveTo(bx - 4, y + r * 0.35); ctx.lineTo(bx, y + r * 0.35 - h); ctx.lineTo(bx + 4, y + r * 0.35); ctx.closePath(); ctx.fill(); } }
        else {
          ctx.save(); var k = 0.4 + 0.6 * p, fy = y - r * 1.5 * (1 - p); ctx.fillStyle = 'rgba(159,216,255,' + (0.2 + 0.35 * p).toFixed(3) + ')'; ctx.strokeStyle = 'rgba(232,248,255,0.8)'; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.rect(x - r * 0.4 * k, fy - r * 0.4 * k, r * 0.8 * k, r * 0.8 * k); ctx.fill(); ctx.stroke(); ctx.restore();
          ctx.strokeStyle = 'rgba(255,255,255,0.6)'; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.moveTo(x - 8, y); ctx.lineTo(x + 8, y); ctx.moveTo(x, y - 8); ctx.lineTo(x, y + 8); ctx.stroke();
        }
      };
    } else if (kind === 'avalanche') {
      var pts = o.pts || [], rr = o.r || 50, stag = o.stag == null ? 0.1 : o.stag;
      for (i = 0; i < pts.length; i++) tele3(ctx, 'block', pts[i].x, pts[i].y, { r: rr, p: clamp(p * 1.7 - i * stag, 0, 1), t: t, fix: pts[i].fix, sig: o.sig && i === 0 });
      return true;
    } else if (kind === 'heartbeat') {
      var inner = o.inner == null ? 100 : o.inner; r = o.r || 280;
      path.arc(x, y, r, 0, TAU); path.moveTo(x + inner, y); path.arc(x, y, inner, 0, TAU, true);
      prog.arc(x, y, inner + (r - inner) * p, 0, TAU); prog.moveTo(x + inner, y); prog.arc(x, y, inner, 0, TAU, true);
      extra = function () {
        // zona segura interior: blanca-azulada punteada
        ctx.fillStyle = 'rgba(190,230,255,' + (0.1 + 0.08 * Math.sin(t / 140)).toFixed(3) + ')'; ctx.beginPath(); ctx.arc(x, y, inner, 0, TAU); ctx.fill();
        ctx.strokeStyle = 'rgba(232,250,255,0.95)'; ctx.lineWidth = 3; ctx.setLineDash([8, 6]); ctx.lineDashOffset = t / 40; ctx.beginPath(); ctx.arc(x, y, inner, 0, TAU); ctx.stroke(); ctx.setLineDash([]);
        ctx.strokeStyle = 'rgba(255,200,190,0.6)'; ctx.lineWidth = 2; for (var q = 0; q < 3; q++) { var ph = ((t / 700) + q / 3) % 1; ctx.globalAlpha = ph; ctx.beginPath(); ctx.arc(x, y, inner + (r - inner) * (1 - ph) * 0.97, 0, TAU); ctx.stroke(); } ctx.globalAlpha = 1;
        if (o.cd != null) { var txt = String(Math.max(0, Math.ceil(o.cd))); ctx.font = 'bold 34px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.lineWidth = 6; ctx.strokeStyle = '#1b1124'; ctx.strokeText(txt, x, y - inner - 24); ctx.fillStyle = '#e8f8ff'; ctx.fillText(txt, x, y - inner - 24); }
      };
    } else return false;
    ctx.save(); ctx.lineJoin = 'round';
    ctx.fillStyle = 'rgba(' + col.f + ',' + (0.12 + 0.28 * p).toFixed(3) + ')'; ctx.fill(path, 'evenodd');
    ctx.fillStyle = 'rgba(' + col.f + ',0.20)'; ctx.fill(prog, 'evenodd');
    if (!noStroke) {
      if (o.sig) { ctx.strokeStyle = 'rgba(255,255,255,0.28)'; ctx.lineWidth = 9; ctx.stroke(path); }
      ctx.strokeStyle = col.s; ctx.globalAlpha = 0.85; ctx.lineWidth = fix ? 3.4 : 2.6;
      if (!fix) { ctx.setLineDash([11, 8]); ctx.lineDashOffset = -t / 40; }
      ctx.stroke(path); ctx.setLineDash([]); ctx.globalAlpha = 1;
      if (o.sig2 || (o.sig && kind === 'skidlane')) { ctx.strokeStyle = 'rgba(27,17,36,0.55)'; ctx.lineWidth = 1.4; ctx.stroke(path); }
    }
    if (extra) extra();
    ctx.restore(); return true;
  }
  var oldTele = A.drawBossTele;
  A.drawBossTele = function (ctx, kind, x, y, o) { if (T3[kind]) return tele3(ctx, kind, x, y, o); return oldTele.apply(A, arguments); };
  // onda anular de hielo: style:3 en drawBossWave (mismos parametros que los otros estilos)
  var oldWave = A.drawBossWave;
  A.drawBossWave = function (ctx, x, y, r, o) {
    if (!o || o.style !== 3) return oldWave.apply(A, arguments);
    var th = o.th || 24, gap = o.gap == null ? PI / 3 : o.gap, a = o.a || 0, N = clamp(Math.round(TAU * r / 46), 10, 56), sg = A.sprite('fx_ice_shockwave', 0), segLen = TAU * r / N * 1.1, i, d, half = gap / 2;
    ctx.save(); ctx.globalAlpha = o.alpha == null ? 1 : o.alpha;
    for (i = 0; i < N; i++) {
      var ang = i / N * TAU; d = Math.abs(((ang - a + PI * 3) % TAU) - PI);
      if (gap > 0 && d < half - (TAU / N) * 0.35) continue;
      ctx.save(); ctx.translate(x + cos(ang) * r, y + sin(ang) * r); ctx.rotate(ang + PI / 2); ctx.drawImage(sg, -segLen / 2, -th / 2, segLen, th); ctx.restore();
    }
    ctx.restore();
  };
  // ola de la Ventisca blanca: style:'ice' (no tele). Reutiliza los parametros de drawBossBand
  var oldBand = A.drawBossBand;
  if (oldBand) A.drawBossBand = function (ctx, x, y, a, len, th, o) {
    if (!o || o.style !== 'ice' || o.tele) return oldBand.apply(A, arguments);
    var t = o.t != null ? o.t : performance.now(), al = o.alpha == null ? 1 : o.alpha, gaps = (o.gaps || []).slice().sort(function (g1, g2) { return g1[0] - g2[0]; }), segs = [], cur = 0, i;
    gaps.forEach(function (g) { if (g[0] > cur) segs.push([cur, g[0]]); cur = Math.max(cur, g[1]); }); if (cur < len) segs.push([cur, len]);
    ctx.save(); ctx.translate(x, y); ctx.rotate(a); ctx.globalAlpha = al;
    segs.forEach(function (sg) {
      var y0 = -len / 2 + sg[0], y1 = -len / 2 + sg[1], h = y1 - y0, g = ctx.createLinearGradient(-th, 0, 0, 0);
      g.addColorStop(0, 'rgba(160,210,255,0.0)'); g.addColorStop(0.6, 'rgba(190,228,255,0.45)'); g.addColorStop(1, 'rgba(240,250,255,0.95)');
      ctx.fillStyle = g; ctx.fillRect(-th, y0, th, h);
      ctx.beginPath(); ctx.moveTo(0, y0); for (var yy = y0; yy <= y1; yy += 10) ctx.lineTo(sin(yy / 7 + t / 90) * 4 + ((Math.floor(yy / 10) % 2) ? 6 : 0), yy); ctx.lineTo(-10, y1); ctx.lineTo(-10, y0); ctx.closePath();
      ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 4; ctx.stroke(); ctx.strokeStyle = 'rgba(27,17,36,0.6)'; ctx.lineWidth = 1.2; ctx.stroke();
      ctx.fillStyle = 'rgba(255,255,255,0.85)'; for (i = 0; i < Math.floor(h / 18); i++) { var by2 = y0 + 9 + i * 18; ctx.fillRect(-6 - ((i * 13 + t / 6) % th), by2 + sin(i + t / 160) * 4, 5, 2.2); }
    });
    ctx.restore();
  };

  // ================================================================= API PUBLICA (envuelve la anterior; los ids viejos siguen igual)
  var BOSSES = A.BOSS, B3 = {
    yarlak: {
      id: 'yarlak', name: 'Yarlak', title: 'El Coloso Gélido', r: 96, gy: GY, w: 300, h: 250, deathMs: YDEATH, windups: YNAMES,
      phases: ['Primera nevada', 'La manada', 'Corazón helado', 'Invierno eterno'], despair: 'Invierno Eterno',
      parts: { colmillos: { r: 30 }, armadura: { r: 46 }, corazon: { r: 24 } }, windowColor: '#cfeeff', speeds: [55, 65, 75, 85], eyes: ['#8fdcff', '#ffffff', '#5ff0ff', '#fff3a0'],
      render: renderYarlak, shadow: yShadow, aura: yAura, front: yFront
    }
  };
  BOSSES.yarlak = B3.yarlak;
  var oldDraw = A.drawBoss, oldRender = A.renderBoss, oldShadow = A.drawBossShadow, oldAnch = A.bossAnchors, oldNames = A.bossPoseNames;
  A.drawBoss = function (id, ctx, x, y, s) {
    var B = B3[id]; if (!B) return oldDraw.apply(A, arguments);
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
  A.renderBoss = function (id, s) { var B = B3[id]; return B ? B.render(s || {}) : oldRender.apply(A, arguments); };
  A.drawBossShadow = function (ctx, x, y, s) { var id = s && s.id; if (id && B3[id]) return B3[id].shadow(ctx, x, y, s); return oldShadow.apply(A, arguments); };
  A.bossPoseNames = function (id) { return id === 'yarlak' ? YNAMES.slice() : oldNames.apply(A, arguments); };
  function pt(p, r) { return { x: rd(p.x), y: rd(p.y), r: r || 0 }; }
  A.bossAnchors = function (id, s) {
    if (id !== 'yarlak') return oldAnch.apply(A, arguments);
    s = s || {}; var f = s.facing < 0 ? -1 : 1, P = yPoseFor(s), Lt = yLayout(P, s), br = s.broken || {};
    function X(p, r) { var q = xf(P, p.x, p.y); return { x: rd(q.x * f), y: rd(q.y), r: r || 0 }; }
    function raw(p, r) { return { x: rd(p.x * f), y: rd(p.y), r: r || 0 }; }
    var head = hdx(P, 118, -34), hq = xf(P, head.x, head.y), mouth = hdx(P, 150, 18), tipv = Lt.tuskTip, rootv = Lt.tusk;
    var tuskC = br.colmillos ? { x: rootv.x + (tipv.x - rootv.x) * 0.22, y: rootv.y + (tipv.y - rootv.y) * 0.22 } : { x: rootv.x + (tipv.x - rootv.x) * 0.78, y: rootv.y + (tipv.y - rootv.y) * 0.78 };
    var armorC = xf(P, -26, -78), heart = xf(P, 60, 0), tk = Lt.trunkTip;
    var out = {
      body: { x: 0, y: 0, r: 96 }, head: { x: rd(hq.x * f), y: rd(hq.y), r: 40 },
      colmillos: X(tuskC, 30), tuskTip: br.colmillos ? X(tuskC, 8) : X(tipv, 8), tuskBase: X(rootv, 10), tuskFar: X(Lt.tuskFar, 10),
      armadura: { x: rd(armorC.x * f), y: rd(armorC.y), r: 46 }, corazon: { x: rd(heart.x * f), y: rd(heart.y), r: 24 },
      mouth: X(mouth, 10), trunkTip: X(tk, 12), breath: X(tk, 12), chest: { x: rd(heart.x * f), y: rd(heart.y), r: 0 },
      eyes: X(hdx(P, 136, -32), 8), hump: X({ x: -28, y: -92 }, 30),
      feet: { x: 0, y: GY, r: 0 }, groundShadow: { x: 0, y: GY + 8, r: 190 }
    };
    for (var i = 0; i < 5; i++) { var pp = PLATES[i], q = xf(P, pp.x, pp.y - 20); out['plate' + i] = { x: rd(q.x * f), y: rd(q.y), r: 18 }; }
    out.step = { u: P.moving > 0.05 ? rd((((s.t || 0) / 1000) * gaitHz(+s.speed > 0 ? +s.speed : 60)) % 1 * 100) / 100 : 0, impact: rd(P.step * 100) / 100 };
    return out;
  };
})();
