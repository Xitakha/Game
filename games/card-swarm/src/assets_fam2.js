/*!
 * assets_fam2.js - Arte de la familia P2: ASFODELO DEL OLVIDO (DESIGN-v5-biomas.md A.5, C.4 apartado A).
 * Se carga DESPUES de assets_fam1.js (usa Assets._h). Contrato exacto: ASSETS_API.md, seccion "Familias P2 (Asfodelo)".
 * Misma gramatica que assets_fam1.js: contorno grueso #1b1124, color plano + 1 sombra + 1 brillo, miran a la DERECHA.
 * Tamano base x2 = final. Todo se precompone una vez al cargar (canvas offscreen): el dibujo en juego es un drawImage.
 * Paleta: verde azulado #2f6f6a, crema #e8e4d4; acentos acido #7be34a / hielo #6ac8ff / rayo #ffe45a; olvido #7fffe0.
 */
(function () {
  'use strict';
  var A = window.Assets, H = A && A._h;
  if (!H) { if (window.console) console.error('assets_fam2: falta Assets._h (cargar tras assets.js)'); return; }
  var addV = H.addV, Pclosed = H.Pclosed, Ppoly = H.Ppoly, Pblob = H.Pblob, Prr = H.Prr, Pcirc = H.Pcirc;
  var dyingFrames = H.dyingFrames, PH = H.PH, OLC = H.OLC;
  var TAU = 6.2832, sin = Math.sin, cos = Math.cos;
  var TEAL = '#2f6f6a', TEAL_S = '#1b4540', TEAL_H = '#5aa8a0', CREAM = '#e8e4d4', CREAM_S = '#b4b098';
  var ACID = '#7be34a', ICE = '#6ac8ff', BOLT = '#ffe45a', OLV = '#7fffe0';

  var WK = [1, 2, 4, 5];
  function wk(k) { var p = PH[WK[k]]; return { c: Math.round(cos(p)), by: -(Math.abs(sin(p)) > 0.8 ? 1 : 0), p: p }; }
  function withDie(fr, draw, w, h, opt, o) {
    var d0 = fr.length;
    dyingFrames(draw, w, h, opt, o).forEach(function (f) { fr.push(f); });
    return { f: [d0, d0 + 1, d0 + 2, d0 + 3, d0 + 4], fps: 9, loop: false };
  }
  var WALKSEQ = [0, 2, 1, 3, 4, 5];
  function eyeG(v, x, y, r, col) { v.dot(x, y, r, col || '#ff9a2a'); v.dot(x - r * 0.3, y - r * 0.3, r * 0.38, '#fff2c0'); }

  // ------------------------------------------------------------ ALMA ERRANTE 20x22 (voluta semitransparente, sin patas)
  function alma(o) {
    return function (v) {
      var x = v.ctx, by = o.by || 0, w = o.w || 0;
      x.globalAlpha = 0.8;
      // cola de voluta hacia atras (izquierda y abajo)
      v.part(Pclosed([[8, 9 + by], [16.6, 9 + by], [15.6, 14 + by], [11, 17.4 + by + w], [6.4, 20 + by - w], [2.4, 18.6 + by + w], [5, 15.4 + by], [6, 12 + by]]), '#9fd6cc', { lw: 1.4, sh: '#5a9a94', hi: '#f0fff8', so: 1 });
      v.part(Pblob(4.6, 17.6 + by + w * 0.6, 1.5, 1.2, 201, 0.05, 8), '#c6ece4', { lw: 0.8, sh: '#7ab8b0', so: 0.3 });
      // mechones de llama palida en la coronilla
      v.part(Ppoly([[10.4, 4.2 + by], [11.4, 0.8 + by + w * 0.4], [13.2, 3.8 + by]]), '#e8e4d4', { lw: 0.9, sh: CREAM_S, so: 0.2 });
      v.part(Ppoly([[13.4, 3.6 + by], [15.2, 1.4 + by - w * 0.3], [16, 4.6 + by]]), '#e8e4d4', { lw: 0.8, sh: CREAM_S, so: 0.2 });
      // cabeza
      v.part(Pblob(12.6, 8.2 + by, 5.6, 5.2, 202, 0.03), '#bfe8e0', { lw: 1.4, sh: '#6aa8a2', hi: '#f4fffc', so: 0.9 });
      // ojos huecos y boca en "o"
      v.part(Pblob(11.6, 7.8 + by, 1.2, 1.7, 203), '#16303a', { lw: 0.4 }); v.part(Pblob(15.6, 7.8 + by, 1.2, 1.7, 204), '#16303a', { lw: 0.4 });
      v.dot(11.9, 7.2 + by, 0.45, '#e8fff8'); v.dot(15.9, 7.2 + by, 0.45, '#e8fff8');
      v.part(Pblob(14.2, 11 + by, 0.9, 1.2, 205), '#16303a', { lw: 0.3 });
      // brazos de humo
      v.stick([[8.6, 12.4 + by], [6.4, 14 + by + w], [5.6, 16.4 + by]], 1.5, '#9fd6cc', { lw: 0.9 });
      v.stick([[16, 12.2 + by], [18, 13.8 + by - w * 0.6], [18.6, 16.4 + by]], 1.5, '#bfe8e0', { lw: 0.9 });
      x.globalAlpha = 1;
    };
  }
  (function () {
    var F = [alma({}), alma({ by: 1, w: 0.8 })], k;
    for (k = 0; k < 4; k++) { var q = wk(k); F.push(alma({ by: q.by * 1.4, w: q.c * 1.2 })); }
    var dieA = withDie(F, alma({}), 20, 22, { lw: 1.4 });
    addV('enemy_asf_alma_errante', 20, 22, F, { lw: 1.4 }, { idle: { f: [0, 1], fps: 4 }, walk: { f: WALKSEQ, fps: 8 }, die: dieA });
  })();

  // ------------------------------------------------------------ SANGUIJUELA 18x10
  function leech(o) {
    return function (v) {
      var amp = o.amp == null ? 1 : o.amp, ph = o.ph || 0, n = 8, i, C = [], x0 = o.x0 == null ? 3 : o.x0, dx = o.dx || 1.9;
      var cy = 5.4;
      if (o.curl) { // expuesta: boca arriba y enroscada
        v.part(Pblob(9, 6.2, 7.4, 2.6, 211, 0.04, 12), '#e0cdb4', { lw: 1.4, sh: '#b49c82', hi: '#fff6e6', so: 0.8 });
        for (i = 0; i < 4; i++) v.line(4.6 + i * 2.6, 4.6, 5 + i * 2.6, 7.8, 0.5, '#b49c82');
        v.part(Pblob(15.4, 5.4, 2.6, 2.4, 212), '#7a1e2a', { lw: 1.1, sh: '#4a0e18', hi: '#d8452a', so: 0.4 });
        v.dot(15.4, 5.4, 0.9, '#1b1124'); v.dot(14.6, 4.6, 0.4, '#fff'); v.dot(16.2, 4.6, 0.4, '#fff'); v.dot(15.4, 6.4, 0.4, '#fff');
        v.dot(3.2, 7.8, 0.5, '#b01c2c'); v.dot(2.2, 9, 0.4, '#b01c2c');
        return;
      }
      for (i = 0; i < n; i++) {
        var t = i / (n - 1);
        C.push(Pcirc(x0 + i * dx, cy + sin(ph + i * 0.9) * amp * (1 - t * 0.4), 1.5 + t * 1.1));
      }
      v.cluster(C, '#3c5a48', { lw: 1.2, sh: '#243a2e', hi: '#7aa088', so: 0.6 });
      // franja dorsal roja
      for (i = 1; i < n - 1; i++) v.dot(x0 + i * dx, cy + sin(ph + i * 0.9) * amp * (1 - i / (n - 1) * 0.4) - 0.8, 0.55, '#d8452a');
      // cabeza con ventosa y dientes
      var hx = x0 + (n - 1) * dx + 1.2, hy = cy + sin(ph + 6.3) * amp * 0.6;
      v.part(Pblob(hx, hy, 2.5, 2.9, 213), '#7a1e2a', { lw: 1.2, sh: '#4a0e18', hi: '#d8452a', so: 0.4 });
      v.dot(hx + 0.5, hy, o.open ? 1.7 : 1.1, '#1b1124');
      v.dot(hx - 0.2, hy - 1.5, 0.4, '#fff'); v.dot(hx + 1.2, hy - 1.1, 0.4, '#fff'); v.dot(hx + 1.2, hy + 1.1, 0.4, '#fff'); v.dot(hx - 0.2, hy + 1.5, 0.4, '#fff');
      v.dot(hx - 1.4, hy - 1.9, 0.45, '#ffe45a');
      if (o.lunge) { v.line(0.4, 3.6, 3, 3.6, 0.6, 'rgba(232,228,212,0.8)'); v.line(0.4, 7.2, 2.6, 7.2, 0.6, 'rgba(232,228,212,0.7)'); }
    };
  }
  (function () {
    var F = [leech({ ph: 0 }), leech({ ph: 3.1 }), leech({ amp: 0.2, x0: 2.2, dx: 2.1, lunge: true, open: true }), leech({ amp: 0.35, x0: 1.4, dx: 2.15, ph: 1, lunge: true, open: true }), leech({ curl: true })];
    var dieA = withDie(F, leech({}), 18, 10, { lw: 1.2 });
    addV('enemy_asf_sanguijuela', 18, 10, F, { lw: 1.2 }, { swim: { f: [0, 1], fps: 7 }, idle: { f: [0, 1], fps: 5 }, lunge: { f: [2, 3], fps: 14 }, exposed: { f: [4], fps: 1 }, die: dieA });
  })();

  // ------------------------------------------------------------ RANA ACIDA 26x22
  function rana(o) {
    return function (v) {
      var x = v.ctx, sq = o.sq || 0, by = o.by || 0, air = o.air, rest = o.rest, bx = 12.4;
      var cy = 14 + sq * 2.4 + by, rx = 8 + sq * 1.4, ry = 5.6 - sq * 1.7;
      if (o.splash) { [[2, 17], [4, 14.4], [22, 14.8], [24.2, 17.4], [0.8, 19.4]].forEach(function (p) { v.dot(p[0], p[1], 0.9, ACID); v.dot(p[0] - 0.2, p[1] - 0.3, 0.35, '#e8ffc8'); }); }
      // patas traseras
      if (air) { v.stick([[8, cy], [3.6, cy + 1.6], [0.6, cy + 3.6]], 2.8, '#4fb43a', { lw: 1.1, hi: '#9ae870' }); v.part(Ppoly([[0.4, cy + 2], [-0.2, cy + 5.2], [2.6, cy + 4.2]]), '#2f6f6a', { lw: 0.8, so: 0.2 }); }
      else { v.part(Pblob(7.2, cy + 1, 4.4, 3.6 - sq * 0.5, 221, 0.04), '#4fb43a', { lw: 1.3, sh: '#2f7a2c', hi: '#9ae870', so: 0.8 }); v.part(Prr(2.8, 19 + sq * 1.2 + by, 6.4, 1.9, 0.9), '#2f6f6a', { lw: 0.9, sh: TEAL_S, so: 0.3 }); }
      // cuerpo
      v.part(Pblob(bx, cy, rx, ry, 222, 0.03), '#6fcf4a', { lw: 1.5, sh: '#3a8a3a', hi: '#b8f08a', so: 1 });
      v.part(Pblob(bx + 1.4, cy + ry * 0.45, rx * 0.62, ry * 0.5, 223), CREAM, { lw: 0.8, sh: CREAM_S, so: 0.3 });
      // verrugas verde azulado
      [[8, cy - 2], [11, cy - 3.6], [14, cy - 2.2], [9.4, cy + 0.6]].forEach(function (p) { v.dot(p[0], p[1], 0.8, TEAL); });
      // patas delanteras
      v.part(Prr(15.6, cy + ry * 0.4, 2.4, air ? 2 : 3.6 - sq, 0.9), '#4fb43a', { lw: 1, sh: '#2f7a2c', so: 0.3 });
      v.part(Prr(15, cy + ry * 0.4 + (air ? 1.4 : 2.8 - sq), 3.6, 1.4, 0.7), TEAL, { lw: 0.8, so: 0.2 });
      // saco vocal inflado (idle 1)
      if (o.sac) v.part(Pblob(19.6, cy + 2, 2.8, 2.5, 224), '#e8ffc8', { lw: 1, sh: '#9ad8a0', hi: '#ffffff', so: 0.4 });
      // cabeza: ojos saltones arriba
      var hx = 18, hy = cy - ry * 0.55;
      v.part(Pblob(hx, hy + 1.2, 4.2, 3, 225), '#6fcf4a', { lw: 1.3, sh: '#3a8a3a', hi: '#b8f08a', so: 0.7 });
      [[hx - 3.4, hy - 1.4], [hx + 0.8, hy - 1.8]].forEach(function (e, k) {
        v.part(Pcirc(e[0], e[1], 2.3), '#fff6c8', { lw: 1.1, sh: '#d8d090', so: 0.4 });
        if (rest) { v.line(e[0] - 1.6, e[1] - 0.2, e[0] + 1.6, e[1] + 0.4, 0.9, OLC); }
        else { v.dot(e[0] + 0.5, e[1] + 0.2, 1.2, '#1b1124'); v.dot(e[0] + 0.2, e[1] - 0.3, 0.4, '#ffe45a'); }
      });
      // boca ancha
      var mo = o.mouth || 0;
      v.line(hx - 0.6, hy + 3.2, hx + 4.4, hy + 2.8 + mo, 0.8, OLC);
      if (mo) v.part(Pblob(hx + 2.6, hy + 3.6, 2.2, 1.1, 226), '#7a1e2a', { lw: 0.6 });
      if (o.tongue) { v.line(hx + 3.4, hy + 3.6, hx + 6.2, hy + 5.2, 1.5, '#e8607a'); v.dot(hx + 6.4, hy + 5.4, 0.9, '#e8607a'); }
      v.dot(hx + 3.2, hy + 1, 0.4, TEAL_S);
      // goteo acido
      if (o.drip) { v.dot(hx + 1.4, hy + 5.4, 0.7, ACID); }
    };
  }
  (function () {
    var F = [rana({}), rana({ sac: true, by: -0.4 }), rana({ sq: 1, drip: true }), rana({ air: true, by: -2.4, mouth: 1 }), rana({ sq: 1.5, splash: true, by: 0.6 }), rana({ rest: true, sq: 0.8, tongue: true })];
    var dieA = withDie(F, rana({}), 26, 22, { lw: 1.5 });
    addV('enemy_asf_rana', 26, 22, F, { lw: 1.5 }, {
      idle: { f: [0, 1], fps: 3 }, crouch: { f: [2], fps: 1 }, air: { f: [3], fps: 1 }, land: { f: [4], fps: 1 }, rest: { f: [5], fps: 1 },
      hop: { f: [2, 3, 4], fps: 6 }, die: dieA
    });
  })();

  // ------------------------------------------------------------ MEDUSA HELADA 24x28
  function medusa(o) {
    return function (v) {
      var x = v.ctx, p = o.p || 0, by = o.by || 0, cx = 11, cy = 9 + by;
      var bw = 8.6 + p * 1.1, bh = 7 - p * 1.2;
      // tentaculos
      var T = [-6, -3, 0, 3, 6], i;
      for (i = 0; i < T.length; i++) {
        var L = 11 + (i % 2) * 3 + (o.long || 0), sw = sin(o.sw + i * 1.4) * 1.4, fx = o.fling ? 5 + i * 0.5 : 0;
        v.stick([[cx + T[i], cy + 3.4], [cx + T[i] * 1.1 + sw + fx * 0.4, cy + 3.4 + L * 0.5], [cx + T[i] * 1.2 - sw + fx, cy + 3.4 + L * (o.fling ? 0.6 : 1)]], i % 2 ? 1.5 : 1.9, i % 2 ? '#4a9a98' : CREAM, { lw: 0.9, hi: i % 2 ? '#8ad0c8' : '#fffdf0', curve: true });
      }
      // campana
      v.part(Pclosed([[cx - bw, cy + 3.6], [cx - bw * 0.92, cy - bh * 0.5], [cx - bw * 0.4, cy - bh - 1], [cx + bw * 0.4, cy - bh - 1], [cx + bw * 0.92, cy - bh * 0.5], [cx + bw, cy + 3.6], [cx + bw * 0.5, cy + 4.8 - p], [cx, cy + 3.8], [cx - bw * 0.5, cy + 4.8 - p]]), '#bfe8f6', { lw: 1.5, sh: '#74b8dc', hi: '#f0fcff', so: 1 });
      // manchas y borde crema
      [[-4, -1.6], [-1, -3], [2, -2.2]].forEach(function (s) { v.dot(cx + s[0], cy + s[1], 0.9, TEAL); });
      v.line(cx - bw * 0.9, cy + 3.8, cx + bw * 0.9, cy + 3.8, 0.9, CREAM);
      // cara
      eyeG(v, cx + 3.2, cy + 0.6, 1, '#1c4a98'); eyeG(v, cx + 6.4, cy + 0.8, 0.9, '#1c4a98');
      v.line(cx + 4, cy + 2.8, cx + 6, cy + 2.8, 0.5, '#1c4a98');
      // cristales de hielo en la campana
      v.part(Ppoly([[cx - 2, cy - bh - 0.6], [cx - 1, cy - bh - 3.4], [cx + 0.2, cy - bh - 0.6]]), '#d8f4ff', { lw: 0.8, ol: '#1c4a98', so: 0.2 });
      v.part(Ppoly([[cx + 1.4, cy - bh - 0.6], [cx + 3, cy - bh - 2.6], [cx + 3.6, cy - bh - 0.2]]), '#d8f4ff', { lw: 0.7, ol: '#1c4a98', so: 0.2 });
      if (o.orb) { // orbe de hielo entre los tentaculos
        var ox = o.fling ? 21 : cx, oy = o.fling ? cy + 5 : cy + 12;
        x.strokeStyle = 'rgba(106,200,255,0.7)'; x.lineWidth = 0.8; x.beginPath(); x.arc(ox, oy, 4.6, 0, TAU); x.stroke();
        v.part(Pblob(ox, oy, 3.4, 3.4, 231, 0.04, 10), '#7fd4ff', { lw: 0.9, ol: '#1c4a98', sh: '#3a88d8', hi: '#d8f4ff', so: 0.5 });
        v.dot(ox - 0.4, oy - 0.4, 1.4, '#ffffff');
      }
    };
  }
  (function () {
    var F = [medusa({ p: 0, sw: 0 }), medusa({ p: 0.7, sw: 1.2, by: -1 }), medusa({ p: 1, sw: 2.4, by: -1.6 }), medusa({ p: 0.4, sw: 3.6, by: -0.6 }),
      medusa({ p: 1.2, sw: 0, orb: true, by: -1 }), medusa({ p: 0, sw: 0.6, orb: true, fling: true, by: 0.4 })];
    var dieA = withDie(F, medusa({ p: 0, sw: 0 }), 24, 28, { lw: 1.4 });
    addV('enemy_asf_medusa', 24, 28, F, { lw: 1.4 }, { float: { f: [0, 1, 2, 3], fps: 6 }, idle: { f: [0, 1, 2, 3], fps: 6 }, charge: { f: [4], fps: 1 }, throw: { f: [5, 0], fps: 8 }, die: dieA });
  })();

  // ------------------------------------------------------------ CABEZA MENOR 28x36 (mini Letea: cuello de charco y cresta de tres colores)
  function cabeza(o) {
    return function (v) {
      var x = v.ctx, nh = o.nh == null ? 1 : o.nh, dx = o.dx || 0, by = o.by || 0, mo = o.mouth || 0, sc = o.hs == null ? 1 : o.hs, i;
      // charco circular en la base
      v.part(Pblob(14, 32.2, 11.4, 3.2, 241, 0.03, 14), '#1f4a52', { lw: 1.3, sh: '#12303a', hi: '#3f8f98', so: 0.5 });
      x.strokeStyle = 'rgba(232,228,212,0.8)'; x.lineWidth = 0.7; x.beginPath(); x.ellipse(14, 32.2, 8.4 + (o.rip || 0), 2.1 + (o.rip || 0) * 0.3, 0, 0, TAU); x.stroke();
      var top = 31 - 20 * nh, hx = 13.4 + dx, hy = top + by;
      // cuello (ligeramente curvado hacia la derecha)
      v.stick([[13, 32], [12.4 + dx * 0.3, (32 + hy) / 2 + 2], [hx - 0.4, hy + 2]], 6.4, '#3f8f86', { lw: 1.4, hi: '#7ac8c0', curve: true });
      for (i = 1; i < 5; i++) { var ty = 32 - (32 - hy - 2) * i / 5; if (ty > 29 || ty < hy + 5) continue; v.line(10.4 + dx * (1 - ty / 32) * 0.2, ty, 15.6 + dx * (1 - ty / 32) * 0.2, ty + 0.4, 0.6, TEAL_S); }
      if (o.stump) { // muñon cortado: herida abierta (o carbonizada)
        v.part(Pblob(hx, hy + 2, 3.8, 1.8, 242), o.burnt ? '#2a2236' : '#a8242c', { lw: 1.2, sh: o.burnt ? '#17111f' : '#6a1018', hi: o.burnt ? '#5a4a60' : '#e8606a', so: 0.4 });
        v.dot(hx - 1.4, hy + 6, 0.7, o.burnt ? '#ff9a2a' : '#c8283a'); v.dot(hx + 2, hy + 9, 0.6, o.burnt ? '#ffc04a' : '#c8283a');
        if (!(o.bud > 0)) return;
      }
      if (o.bud > 0) { // brote: cabeza en miniatura que crece
        sc = o.bud; hy = hy + 1; hx = hx + 0.6;
      }
      x.save(); x.translate(hx, hy); x.scale(sc, sc);
      // cresta de tres puas (acido, hielo, rayo)
      [[-4.4, ACID, -9.4], [-1.4, ICE, -11], [1.8, BOLT, -9.4]].forEach(function (c) {
        v.part(Ppoly([[c[0] - 1.1, -3], [c[0] + 0.4, c[2]], [c[0] + 1.8, -3]]), c[1], { lw: 0.9, so: 0.2 });
      });
      // cabeza + hocico
      var jaw = mo * 3.4;
      v.part(Pblob(0, 0, 6, 5, 243, 0.03), '#3f8f86', { lw: 1.5, sh: '#245a56', hi: '#8ad0c8', so: 1 });
      // mandibula inferior (abre)
      v.part(Pclosed([[-1, 2.4], [6.4, 2 + jaw * 0.6], [8.6, 3.4 + jaw], [3, 5.4 + jaw], [-2, 4.6]]), '#2f7a72', { lw: 1.2, sh: '#1b4540', so: 0.4 });
      if (mo > 0.2) { v.part(Pblob(4.6, 3 + jaw * 0.5, 3.6, 1 + jaw * 0.35, 244), '#7a1e2a', { lw: 0.6 }); }
      // hocico superior
      v.part(Pblob(4.8, -0.6 - mo * 1.2, 4.6, 2.6, 245), '#4fa49a', { lw: 1.2, sh: '#2f6f6a', hi: '#a8e4dc', so: 0.6 });
      v.dot(8, -1.6 - mo * 1.2, 0.5, TEAL_S);
      // colmillos crema
      v.part(Ppoly([[3.4, 1.4 - mo * 0.8], [4.2, 3.6 + mo * 0.6], [5, 1.4 - mo * 0.8]]), CREAM, { lw: 0.6, so: 0.1 });
      v.part(Ppoly([[6.2, 1.4 - mo * 0.8], [6.8, 3.2 + mo * 0.6], [7.5, 1.4 - mo * 0.8]]), CREAM, { lw: 0.6, so: 0.1 });
      // ojo amarillo rayo
      v.dot(0.8, -1.8, 1.8, '#1b1124'); v.dot(0.8, -1.8, 1.3, BOLT); v.dot(1.2, -1.8, 0.55, '#1b1124'); v.dot(0.4, -2.4, 0.4, '#fff');
      x.restore();
      if (mo > 0.8) { v.line(2, 2, 0, 3.6, 0.6, 'rgba(232,228,212,0.8)'); }
    };
  }
  (function () {
    var F = [
      cabeza({ nh: 0.1, rip: 1.6 }), cabeza({ nh: 0.4, rip: 1, by: 1 }), cabeza({ nh: 0.75, rip: 0.4 }), cabeza({ nh: 1.04, dx: 0.6 }),   // 0-3 emerge
      cabeza({}), cabeza({ by: 1, dx: -0.6 }),                                                                                           // 4-5 idle
      cabeza({ dx: -2.6, mouth: 0.7, by: 1 }), cabeza({ dx: 4.6, mouth: 1, nh: 0.94 }),                                                   // 6-7 bite (aviso, mordisco)
      cabeza({ nh: 0.3, stump: true }),                                                                                                  // 8 stump
      cabeza({ nh: 0.3, stump: true, bud: 0.35 }), cabeza({ nh: 0.45, stump: true, bud: 0.62 }), cabeza({ nh: 0.7, stump: true, bud: 0.86 }) // 9-11 regrow
    ];
    var dieA = withDie(F, cabeza({}), 28, 36, { lw: 1.5 });
    addV('enemy_asf_cabeza_menor', 28, 36, F, { lw: 1.5 }, {
      emerge: { f: [0, 1, 2, 3], fps: 7, loop: false }, idle: { f: [4, 5], fps: 3 }, bite: { f: [6, 7], fps: 8 }, stump: { f: [8], fps: 1 }, regrow: { f: [9, 10, 11], fps: 4, loop: false }, die: dieA
    });
  })();

  // ------------------------------------------------------------ ANGUILA ELECTRICA 40x14
  function anguila(o) {
    return function (v) {
      var x = v.ctx, amp = o.amp == null ? 2 : o.amp, ph = o.ph || 0, n = 22, i, C = [], P = [], x0 = o.x0 == null ? 3 : o.x0, dxs = o.dx || 1.55;
      var body = o.dim ? '#3a4a50' : '#2a5568', bsh = o.dim ? '#26343a' : '#183844', cy = 7.4 + (o.by || 0);
      for (i = 0; i < n; i++) {
        var t = i / (n - 1), px = x0 + i * dxs, py = cy + sin(ph + i * 0.55) * amp * (0.35 + t * 0.55);
        P.push([px, py]); C.push(Pcirc(px, py, 1.1 + sin(t * 3.1) * 1.9 + t * 0.4));
      }
      if (o.sparks) { x.strokeStyle = BOLT; x.lineWidth = 0.9; [[6, -4], [16, 4], [28, -3], [36, 4]].forEach(function (s, k) { var px = s[0], py = cy + s[1]; x.beginPath(); x.moveTo(px, py); x.lineTo(px + 1.8, py - 1.4 * Math.sign(s[1])); x.lineTo(px + 0.6, py - 2.4 * Math.sign(s[1])); x.lineTo(px + 2.6, py - 3.8 * Math.sign(s[1])); x.stroke(); }); }
      v.cluster(C, body, { lw: 1.3, sh: bsh, hi: o.dim ? '#6a7a80' : '#6aa4b8', so: 0.6 });
      // aleta dorsal crema
      for (i = 3; i < n - 4; i += 3) v.part(Ppoly([[P[i][0] - 1.4, P[i][1] - 2.2], [P[i][0] + 0.2, P[i][1] - 4], [P[i][0] + 1.6, P[i][1] - 2.2]]), '#4a9a98', { lw: 0.7, so: 0.1 });
      // rayas electricas en zigzag
      for (i = 2; i < n - 3; i += 2) {
        var q = P[i], gl = o.glow ? '#fff6a0' : (o.dim ? '#8a8a5a' : BOLT);
        v.line(q[0] - 0.5, q[1] - 1.3, q[0] + 0.5, q[1] + 0.1, 0.9, gl); v.line(q[0] + 0.5, q[1] + 0.1, q[0] - 0.3, q[1] + 1.4, 0.9, gl);
      }
      // cabeza (derecha) con mandibula
      var h = P[n - 1];
      v.part(Pblob(h[0] + 1.2, h[1], 4.1, 3, 251, 0.03), body, { lw: 1.3, sh: bsh, hi: o.dim ? '#6a7a80' : '#6aa4b8', so: 0.6 });
      if (o.open) { v.part(Pblob(h[0] + 3, h[1] + 1.2, 2.6, 1.5, 252), '#7a1e2a', { lw: 0.6 }); v.dot(h[0] + 2, h[1] + 0.3, 0.35, '#fff'); v.dot(h[0] + 4, h[1] + 0.3, 0.35, '#fff'); v.dot(h[0] + 2.6, h[1] + 2.2, 0.35, '#fff'); }
      else v.line(h[0] + 1, h[1] + 1.4, h[0] + 4.6, h[1] + 1.2, 0.6, OLC);
      if (o.dim) { v.line(h[0] - 0.2, h[1] - 1.9, h[0] + 1.6, h[1] - 0.6, 0.8, OLC); v.line(h[0] + 1.6, h[1] - 1.9, h[0] - 0.2, h[1] - 0.6, 0.8, OLC); }
      else eyeG(v, h[0] + 1, h[1] - 0.9, 0.9, BOLT);
      if (o.trail) { v.line(0.2, cy - 2.4, 4, cy - 2.4, 0.7, 'rgba(255,240,160,0.9)'); v.line(0.2, cy + 2.6, 3.2, cy + 2.6, 0.7, 'rgba(255,240,160,0.7)'); v.line(0.6, cy, 3.8, cy, 0.8, 'rgba(255,255,255,0.8)'); }
    };
  }
  (function () {
    var F = [anguila({ ph: 0, amp: 1.2 }), anguila({ ph: 3.1, amp: 1.2, by: 0.4 })], k;
    for (k = 0; k < 4; k++) F.push(anguila({ ph: k * 1.57, amp: 2.8 }));
    F.push(anguila({ ph: 0, amp: 0.8, sparks: true, glow: true, by: -0.6 }));                          // 6 wind
    F.push(anguila({ ph: 0, amp: 0.15, open: true, trail: true, x0: 2, dx: 1.62, glow: true }));      // 7 dash
    F.push(anguila({ ph: 1, amp: 0.7, dim: true, by: 1.8, x0: 3 }));                                  // 8 rec
    var dieA = withDie(F, anguila({ ph: 0, amp: 1.2 }), 40, 14, { lw: 1.4 });
    addV('enemy_asf_anguila', 40, 14, F, { lw: 1.4 }, { idle: { f: [0, 1], fps: 4 }, slither: { f: [2, 3, 4, 5], fps: 10 }, walk: { f: [2, 3, 4, 5], fps: 10 }, wind: { f: [6], fps: 1 }, dash: { f: [7], fps: 1 }, rec: { f: [8], fps: 1 }, die: dieA });
  })();

  // ------------------------------------------------------------ LIRIO DEL OLVIDO 22x24
  function lirio(o) {
    return function (v) {
      var x = v.ctx, by = o.by || 0, op = o.open == null ? 0.5 : o.open, L = o.legs || [0, 0], i;
      // raicillas (patas)
      [[7.4, L[0]], [14.4, L[1]]].forEach(function (l) { v.stick([[l[0], 19.6], [l[0] + l[1] * 0.8, 21.4], [l[0] + l[1] * 1.2 + 0.4, 22.8]], 1.5, '#4a7a4a', { lw: 0.9, hi: '#7aaa6a' }); });
      // hoja de nenufar con muesca
      v.part(Pclosed([[1.4, 18.6 + by], [5, 16.6 + by], [11, 16 + by], [17, 16.6 + by], [20.6, 18.6 + by], [17, 21 + by], [11, 21.6 + by], [5, 21 + by]]), '#2f8f7a', { lw: 1.4, sh: '#1b5a50', hi: '#6ad0b0', so: 0.9 });
      v.part(Ppoly([[11, 19 + by], [20.6, 17.6 + by], [20.8, 20.4 + by]]), '#1f4a52', { lw: 0.8, so: 0.1 });
      v.line(5, 19 + by, 9, 19.2 + by, 0.5, '#5ac8a8');
      // petalos en abanico (crema)
      var N = 7, R = 7.6 + op * 3.6;
      for (i = 0; i < N; i++) {
        var a = (-165 + i * 50 / 1 * (op * 0.4 + 0.65) / 1.4 * 0.7 + (i - 3) * 3 * op) * Math.PI / 180, cx0 = 11 + (o.sway || 0) * 0.3, cy0 = 12 + by;
        a = (-172 + i * (152 / 6) * (0.75 + op * 0.25)) * Math.PI / 180 - (1 - op) * 0.0;
        var px = -sin(a), py = cos(a), ex = cx0 + cos(a) * R, ey = cy0 + sin(a) * R * 0.95;
        v.part(Ppoly([[cx0 + cos(a) * 2 - px * 2.3, cy0 + sin(a) * 2 - py * 2.3], [ex, ey], [cx0 + cos(a) * 2 + px * 2.3, cy0 + sin(a) * 2 + py * 2.3]]), i % 2 ? '#f4f0e0' : CREAM, { lw: 1, sh: CREAM_S, hi: '#ffffff', so: 0.4 });
      }
      // bulbo turquesa con carita dormida
      v.part(Pblob(11 + (o.sway || 0) * 0.3, 12 + by, 4.2, 4.2, 261, 0.03), '#9ff0dc', { lw: 1.3, sh: '#4ab8a4', hi: '#eafffa', so: 0.8 });
      v.line(9.2, 11.6 + by, 11, 11.6 + by, 0.6, OLC); v.line(12.4, 11.6 + by, 14.2, 11.6 + by, 0.6, OLC);
      v.dot(12.6, 13.8 + by, o.sow ? 0.9 : 0.5, '#16303a');
      if (o.sow) { // esporas turquesa saliendo
        [[3, 3], [6, 0.8], [17, 1.4], [19.6, 4.4], [1.4, 8], [20.6, 9]].forEach(function (s, k) { v.dot(s[0], s[1] + by, 1 - (k % 2) * 0.3, OLV); v.dot(s[0] - 0.3, s[1] - 0.3 + by, 0.3, '#ffffff'); });
        x.strokeStyle = 'rgba(127,255,224,0.9)'; x.lineWidth = 0.8; x.beginPath(); x.arc(11, 12 + by, 10.4, 3.6, 5.8); x.stroke();
      }
    };
  }
  (function () {
    var F = [lirio({ open: 0.45 }), lirio({ open: 0.6, by: 0.8 })], k;
    for (k = 0; k < 4; k++) { var q = wk(k); F.push(lirio({ open: 0.5, by: q.by, legs: [-q.c, q.c], sway: q.c })); }
    F.push(lirio({ open: 1, sow: true, by: -0.6 }), lirio({ open: 0.85, sow: true, by: 0.6 }));
    var dieA = withDie(F, lirio({ open: 0.45 }), 22, 24, { lw: 1.4 });
    addV('enemy_asf_lirio', 22, 24, F, { lw: 1.4 }, { idle: { f: [0, 1], fps: 3 }, walk: { f: WALKSEQ, fps: 7 }, sow: { f: [6, 7], fps: 6 }, die: dieA });
  })();

  // ------------------------------------------------------------ SACERDOTISA AHOGADA 24x28
  function sacerdotisa(o) {
    return function (v) {
      var x = v.ctx, by = o.by || 0, w = o.w || 0, up = o.up || 0, i;
      if (o.cast) { x.strokeStyle = 'rgba(192,112,232,0.95)'; x.lineWidth = 1.2; x.setLineDash([2.4, 1.6]); x.beginPath(); x.ellipse(12, 24.4, 9.6, 2.6, 0, 0, TAU); x.stroke(); x.setLineDash([]); }
      // pelo de alga colgando atras
      for (i = 0; i < 3; i++) v.stick([[8.4 + i, 6 + by], [5.6 + i * 1.2 + w, 12 + by], [4.6 + i * 1.6 - w, 19 + by + i]], 1.7, i % 2 ? '#2a6a4a' : '#1f4a3a', { lw: 0.9, hi: '#4a9a6a', curve: true });
      // tunica con dobladillo hecho jirones
      v.part(Pclosed([[7.4, 11 + by], [16.4, 11 + by], [18.6, 18 + by], [19.4, 23 + by + w * 0.5], [16.4, 21.8 + by], [14.4, 25.2 + by - w], [11.6, 22.2 + by], [8.6, 25 + by + w], [6.6, 21.8 + by], [4.4, 23 + by - w * 0.5], [5.4, 18 + by]]), '#245a58', { lw: 1.5, sh: '#17403f', hi: '#4f9a92', so: 1.1 });
      v.line(8.4, 15.4 + by, 15.8, 15.4 + by, 0.8, CREAM); v.line(7.6, 19 + by, 17, 19 + by, 0.5, '#4f9a92');
      // velo/capucha crema
      v.part(Pclosed([[7, 8.6 + by], [8.4, 3 + by], [12.8, 1.4 + by], [17, 3.6 + by], [17.8, 9 + by], [14.6, 11.4 + by], [9.6, 11.4 + by]]), CREAM, { lw: 1.4, sh: CREAM_S, hi: '#fffdf2', so: 0.9 });
      // cara palida ahogada
      v.part(Pblob(13.2, 7.6 + by, 3.5, 3.9, 271, 0.03), '#b8d0cc', { lw: 1, sh: '#7a9a98', hi: '#e4f4f0', so: 0.5 });
      eyeG(v, 13.2, 6.8 + by, 0.85, OLV); eyeG(v, 16.2, 6.8 + by, 0.85, OLV);
      v.line(13.4, 10 + by, 15.6, 10.2 + by, 0.5, '#2a3a40');
      v.dot(15.4, 11.4 + by, 0.5, '#7fd4ff'); // gota
      // brazos
      var ay = up ? 8 + by - up * 2 : 14.4 + by;
      v.stick([[15.6, 13 + by], [19 + up, (13 + ay) / 2 + by * 0.2], [19.8 + up, ay]], 2.2, '#245a58', { lw: 1, hi: '#4f9a92', curve: true });
      v.part(Pcirc(19.8 + up, ay - 0.4, 1.5), '#b8d0cc', { lw: 0.9, sh: '#7a9a98', so: 0.3 });
      v.stick([[8.4, 13 + by], [5.2 - up, (13 + ay) / 2 + by * 0.2], [4.6 - up, ay]], 2.2, '#17403f', { lw: 1, hi: '#3f8a82', curve: true });
      v.part(Pcirc(4.6 - up, ay - 0.4, 1.4), '#9ab8b4', { lw: 0.9, sh: '#7a9a98', so: 0.3 });
      if (o.cast) { [[4, 3], [20.6, 4], [12, 0.6]].forEach(function (s) { v.dot(s[0], s[1], 0.9, '#c070e8'); v.dot(s[0] - 0.2, s[1] - 0.2, 0.3, '#fff'); }); }
      if (o.drip) { v.dot(7 + o.drip, 26.4, 0.6, ICE); }
    };
  }
  (function () {
    var F = [sacerdotisa({}), sacerdotisa({ by: 1, w: 0.6 }), sacerdotisa({ by: -1, w: 1, drip: 1 }), sacerdotisa({ by: -1.6, w: -0.6, drip: 4 }), sacerdotisa({ by: -0.6, w: 0.3 }),
      sacerdotisa({ cast: true, up: 0.8, by: -0.6 }), sacerdotisa({ cast: true, up: 1.6, by: -1.2, w: 1 })];
    var dieA = withDie(F, sacerdotisa({}), 24, 28, { lw: 1.4 });
    addV('enemy_asf_sacerdotisa', 24, 28, F, { lw: 1.4 }, { idle: { f: [0, 1], fps: 3 }, float: { f: [2, 3, 4], fps: 5 }, walk: { f: [2, 3, 4], fps: 5 }, cast: { f: [5, 6], fps: 6 }, cast_hold: { f: [6], fps: 1 }, die: dieA });
  })();

  // ======================================================================================================
  //  VFX / PROPS
  // ======================================================================================================
  // anillo de ondas con borde oscuro (elipse)
  function ring(x, cx, cy, rx, ry, a, col, lw) {
    x.globalAlpha = a; x.strokeStyle = '#12303a'; x.lineWidth = (lw || 1) + 1.4; x.beginPath(); x.ellipse(cx, cy, rx, ry, 0, 0, TAU); x.stroke();
    x.strokeStyle = col || CREAM; x.lineWidth = lw || 1; x.beginPath(); x.ellipse(cx, cy, rx, ry, 0, 0, TAU); x.stroke(); x.globalAlpha = 1;
  }

  // fx_pond_ripple 48x24 -> 96x48: SOLO ondas (donde se oculta la Sanguijuela), 3 frames
  addV('fx_pond_ripple', 48, 24, [0, 1, 2].map(function (k) {
    return function (v) {
      var x = v.ctx;
      ring(x, 24, 12, 8 + k * 5, 3.6 + k * 2.1, 1 - k * 0.3, CREAM, 1);
      ring(x, 24, 12, 3 + k * 5, 1.4 + k * 2.1, 0.9, '#bfe8e0', 0.9);
      if (k === 0) ring(x, 24, 12, 18, 8, 0.45, CREAM, 0.8);
      v.dot(24 + (k - 1) * 3, 12 - k, 0.7, '#e8fff8');
    };
  }), { lw: 0.8 }, { ripple: { f: [0, 1, 2], fps: 3 } });

  // fx_pond 80x48 -> 160x96: charco fijo (agua r~40 final) con juncos y piedras; las ondas se animan en 3 frames
  addV('fx_pond', 80, 48, [0, 1, 2].map(function (k) {
    return function (v) {
      var x = v.ctx, i, g;
      v.part(Pblob(40, 26, 21.5, 13.2, 281, 0.04, 20), '#1f5a60', { lw: 1.8, sh: '#12383f', hi: '#3f8f98', so: 1.2 });
      g = x.createRadialGradient(36, 22, 2, 40, 26, 20); g.addColorStop(0, 'rgba(127,230,214,0.35)'); g.addColorStop(1, 'rgba(20,70,76,0)');
      x.fillStyle = g; x.beginPath(); x.ellipse(40, 26, 19, 11.4, 0, 0, TAU); x.fill();
      ring(x, 40, 26, 6 + k * 5, 3 + k * 2.5, 0.9 - k * 0.2, CREAM, 0.9);
      ring(x, 40, 26, 14 + ((k + 1) % 3) * 2, 7.4 + ((k + 1) % 3) * 1, 0.4, '#bfe8e0', 0.7);
      // piedras del borde
      [[17, 30], [62, 31], [27, 38], [54, 38.4], [66, 24], [14, 22]].forEach(function (s, q) { v.part(Pblob(s[0], s[1], 3 + (q % 2), 1.9 + (q % 2) * 0.4, 290 + q, 0.05, 9), q % 2 ? '#8a9a94' : '#a8b4a8', { lw: 1.1, sh: '#5a6a66', hi: '#d8e0d4', so: 0.5 }); });
      // juncos
      [[19, 20, -1], [21.4, 19, 1], [60, 19, 1], [62.6, 20, -1], [43, 36.6, 0]].forEach(function (s, q) {
        var sw = sin(k * 1.1 + q) * 0.6, h = 8 + (q % 2) * 3;
        v.stick([[s[0], s[1]], [s[0] + s[2] * 1 + sw, s[1] - h * 0.5], [s[0] + s[2] * 2.2 + sw * 1.4, s[1] - h]], 1.1, '#4a8a4a', { lw: 0.8, hi: '#8ac86a', curve: true });
        v.part(Pblob(s[0] + s[2] * 2.2 + sw * 1.4, s[1] - h - 1.2, 0.9, 1.9, 300 + q, 0.04, 8), '#8a5a30', { lw: 0.7, sh: '#5a3418', so: 0.2 });
      });
      v.dot(33 + k * 3, 24 - k, 0.8, '#e8fff8');
    };
  }), { lw: 1 }, { ripple: { f: [0, 1, 2], fps: 3 } });

  // fx_olvido_zone 48x48 -> 96x96: zona turquesa (#7fffe0) r42 final. frame 0 = aviso (arm), 1-2 = activa
  addV('fx_olvido_zone', 48, 48, [0, 1, 2].map(function (k) {
    return function (v) {
      var x = v.ctx, R = 21.6, i, g;
      if (k === 0) {
        x.fillStyle = 'rgba(127,255,224,0.10)'; x.beginPath(); x.arc(24, 24, R, 0, TAU); x.fill();
        x.strokeStyle = 'rgba(14,64,60,0.85)'; x.lineWidth = 2.2; x.setLineDash([2.6, 2.6]); x.beginPath(); x.arc(24, 24, R, 0, TAU); x.stroke();
        x.strokeStyle = OLV; x.lineWidth = 1.2; x.stroke(); x.setLineDash([]);
        for (i = 0; i < 4; i++) { var a = i * TAU / 4 + 0.4; v.dot(24 + cos(a) * 11, 24 + sin(a) * 11, 0.9, 'rgba(127,255,224,0.7)'); }
        return;
      }
      g = x.createRadialGradient(24, 24, 3, 24, 24, R); g.addColorStop(0, 'rgba(160,255,236,0.30)'); g.addColorStop(0.7, 'rgba(100,230,206,0.42)'); g.addColorStop(1, 'rgba(50,190,170,0.55)');
      x.fillStyle = g; x.beginPath(); x.arc(24, 24, R, 0, TAU); x.fill();
      x.strokeStyle = 'rgba(14,64,60,0.9)'; x.lineWidth = 1.8; x.beginPath(); x.arc(24, 24, R, 0, TAU); x.stroke();
      x.strokeStyle = 'rgba(200,255,244,0.95)'; x.lineWidth = 0.8; x.beginPath(); x.arc(24, 24, R - 1.3, 0, TAU); x.stroke();
      // remolino lento (espirales)
      x.strokeStyle = 'rgba(232,255,250,0.75)'; x.lineWidth = 0.9;
      for (i = 0; i < 3; i++) { x.beginPath(); x.arc(24, 24, 6 + i * 4.4, k * 1.3 + i * 2.1, k * 1.3 + i * 2.1 + 2.1); x.stroke(); }
      // numeros de reloj roto: marcas girando
      for (i = 0; i < 6; i++) { var b = i * TAU / 6 + k * 0.5; v.line(24 + cos(b) * 15, 24 + sin(b) * 15, 24 + cos(b) * 17.4, 24 + sin(b) * 17.4, 0.9, 'rgba(14,64,60,0.8)'); }
      for (i = 0; i < 6; i++) { var c = i * 1.9 + k * 2.4, d = 5 + ((i * 7 + k * 3) % 13); v.dot(24 + cos(c) * d, 24 + sin(c) * d, 0.8, '#ffffff'); }
    };
  }), { lw: 0.8 }, { arm: { f: [0], fps: 1 }, active: { f: [1, 2], fps: 3 } });

  // fx_lightning_lane 32x32 -> 64x64: tile de rayo horizontal, repetible en x (los bordes izq/der coinciden en y=16)
  addV('fx_lightning_lane', 32, 32, [0, 1, 2].map(function (k) {
    return function (v) {
      var x = v.ctx, ys = [[16, 9, 21, 11, 16], [16, 22, 10, 20, 16], [16, 12, 22, 9.5, 16]][k], xs = [0, 8, 16, 24, 32], i;
      function path() { x.beginPath(); x.moveTo(-2, 16); for (i = 0; i < 5; i++) x.lineTo(xs[i], ys[i]); x.lineTo(34, 16); }
      x.lineJoin = 'round'; x.lineCap = 'butt';
      x.strokeStyle = 'rgba(255,228,90,0.28)'; x.lineWidth = 12; path(); x.stroke();
      x.strokeStyle = 'rgba(255,200,60,0.5)'; x.lineWidth = 7; path(); x.stroke();
      x.strokeStyle = '#1b1124'; x.lineWidth = 3.8; path(); x.stroke();
      x.strokeStyle = BOLT; x.lineWidth = 2.4; path(); x.stroke();
      x.strokeStyle = '#ffffff'; x.lineWidth = 1; path(); x.stroke();
      // ramal corto
      x.strokeStyle = BOLT; x.lineWidth = 1.2; x.beginPath(); x.moveTo(xs[2], ys[2]); x.lineTo(xs[2] + 3, ys[2] + (ys[2] > 16 ? 5 : -5)); x.lineTo(xs[2] + 1.6, ys[2] + (ys[2] > 16 ? 8 : -8)); x.stroke();
    };
  }), { lw: 0.8 }, { loop: { f: [0, 1, 2], fps: 18 } });

  // fx_frog_acid 30x30 -> 60x60: charco acido de la rana (r28 final), 3 frames de burbujeo
  addV('fx_frog_acid', 30, 30, [0, 1, 2].map(function (k) {
    return function (v) {
      var x = v.ctx, i, g;
      v.part(Pblob(15, 15, 13.4, 13, 310 + k, 0.05, 16), '#5ac83a', { lw: 1.5, sh: '#2f8a2a', hi: '#a8f070', so: 0.9 });
      g = x.createRadialGradient(15, 15, 2, 15, 15, 12); g.addColorStop(0, 'rgba(200,255,140,0.45)'); g.addColorStop(1, 'rgba(60,170,40,0)');
      x.fillStyle = g; x.beginPath(); x.arc(15, 15, 12, 0, TAU); x.fill();
      for (i = 0; i < 5; i++) { var a = i * 2.3 + k * 1.7, d = 3 + (i * 5 + k * 3) % 7, r = 1.2 + ((i + k) % 3) * 0.6; x.strokeStyle = '#1b4a1a'; x.lineWidth = 1.4; x.beginPath(); x.arc(15 + cos(a) * d, 15 + sin(a) * d, r, 0, TAU); x.stroke(); x.strokeStyle = '#e8ffc8'; x.lineWidth = 0.6; x.stroke(); }
      v.dot(9, 9, 0.9, '#f4ffe0');
    };
  }), { lw: 1.2 }, { bubble: { f: [0, 1, 2], fps: 4 } });

  // icon_olvido 16x16 -> 32x32: reloj roto turquesa (estado 'olvido' sobre la mano), 2 frames
  addV('icon_olvido', 16, 16, [0, 1].map(function (k) {
    return function (v) {
      var x = v.ctx;
      v.part(Pcirc(8, 8, 6.6), '#d8fff4', { lw: 1.3, sh: '#6ad8c0', hi: '#ffffff', so: 0.6 });
      x.strokeStyle = '#2f6f6a'; x.lineWidth = 1; x.beginPath(); x.arc(8, 8, 5.2, 0, TAU); x.stroke();
      // marcas
      for (var i = 0; i < 4; i++) { var a = i * TAU / 4; v.line(8 + cos(a) * 3.8, 8 + sin(a) * 3.8, 8 + cos(a) * 4.8, 8 + sin(a) * 4.8, 0.8, '#2f6f6a'); }
      // agujas (cambian entre frames)
      var h = k ? 1.1 : 0.2; v.line(8, 8, 8 + cos(h) * 3.6, 8 + sin(h) * 3.6, 1, '#1b1124'); v.line(8, 8, 8 + cos(h + 3) * 2.6, 8 + sin(h + 3) * 2.6, 1, '#1b1124');
      // grieta en zigzag y cuña rota
      x.strokeStyle = '#1b1124'; x.lineWidth = 1.1; x.beginPath(); x.moveTo(10.6, 2.2); x.lineTo(8.8, 5); x.lineTo(10.4, 7); x.lineTo(9, 9.4); x.stroke();
      v.part(Ppoly([[12.6, 10.4], [15.6, 12.8], [13.2, 15.2]]), '#d8fff4', { lw: 0.8, sh: '#6ad8c0', so: 0.2 });
      if (k) v.dot(14.6, 3.2, 0.6, OLV);
    };
  }), { lw: 0.8 }, { loop: { f: [0, 1], fps: 2 } });

  // fx_ambush_bubbles 24x24 -> 48x48: burbujas que suben y estallan (aviso de emboscada de Sanguijuela / brote de Cabeza menor), 4 frames
  addV('fx_ambush_bubbles', 24, 24, [0, 1, 2, 3].map(function (k) {
    return function (v) {
      var x = v.ctx, B = [[8, 17, 2.6], [15, 18.6, 2], [12, 14, 1.6], [6, 12, 1.2], [17, 11, 1.4]];
      B.forEach(function (b, i) {
        var rise = k * (2.6 + i * 0.5), by = b[1] - rise, r = b[2] * (1 + k * 0.08);
        if (by < 3) return;
        if (k === 3 && i % 2 === 0) { // estallido: gotas
          v.dot(b[0] - 2, by - 1, 0.6, '#e8fff8'); v.dot(b[0] + 2, by - 1.4, 0.6, '#e8fff8'); v.dot(b[0], by - 3, 0.5, '#bfe8e0'); return;
        }
        x.fillStyle = 'rgba(180,240,230,0.28)'; x.beginPath(); x.arc(b[0], by, r, 0, TAU); x.fill();
        x.strokeStyle = '#12303a'; x.lineWidth = 1.5; x.beginPath(); x.arc(b[0], by, r, 0, TAU); x.stroke();
        x.strokeStyle = '#e8fff8'; x.lineWidth = 0.6; x.stroke();
        v.dot(b[0] - r * 0.35, by - r * 0.35, Math.max(0.3, r * 0.28), '#ffffff');
      });
      ring(x, 12, 20.4, 6 + k * 1.2, 2 + k * 0.5, 0.8 - k * 0.15, CREAM, 0.8);
    };
  }), { lw: 0.8 }, { rise: { f: [0, 1, 2, 3], fps: 8 } });

  // ------------------------------------------------------------------------------------------ indice
  A.FAM2 = {
    asfodelo: ['enemy_asf_alma_errante', 'enemy_asf_sanguijuela', 'enemy_asf_rana', 'enemy_asf_medusa', 'enemy_asf_cabeza_menor', 'enemy_asf_lirio', 'enemy_asf_anguila', 'enemy_asf_sacerdotisa',
      'fx_pond_ripple', 'fx_pond', 'fx_olvido_zone', 'fx_lightning_lane', 'fx_frog_acid', 'icon_olvido', 'fx_ambush_bubbles']
  };
})();
