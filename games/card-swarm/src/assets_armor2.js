/*!
 * assets_armor2.js - Arte de armaduras v8, parte 2: sets Letea / Yarlak / Melaria / Cenizar (T3-T6), 5 talismanes de minijefe,
 * overlay "Marlo vestido" y efecto fx_armor_block. Se carga DESPUES de assets_armor.js (extiende Assets.armorIcon / drawArmorIcon /
 * drawMannequin / ARMOR_ART sin tocar ese archivo). Contrato: ASSETS_API.md, seccion "Armaduras v8 parte 2".
 * Todo procedural (canvas 2D), iconos cacheados en offscreen, contorno #1b1124, rasterizado x2. Seguro: nunca lanza.
 */
(function () {
  'use strict';
  var A = window.Assets, H = A && A._h;
  if (!A || !H || !A.armorIcon || !A.ARMOR_ART || !A.sprite) { if (window.console) console.warn('assets_armor2: falta assets_armor.js; no se extiende'); return; }
  var addV = H.addV, Pclosed = H.Pclosed, Ppoly = H.Ppoly, Pblob = H.Pblob, Prr = H.Prr, Pcirc = H.Pcirc, vframe = H.vframe;
  var TAU = 6.2832, PI = Math.PI, OLC = '#1b1124', ART = A.ARMOR_ART;
  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  var WARNED = false;
  function safe(fn, fb) { return function () { try { return fn.apply(this, arguments); } catch (e) { if (!WARNED) { WARNED = true; if (window.console) console.warn('assets_armor2: ' + (e && e.message ? e.message : e)); } try { return fb ? fb.apply(this, arguments) : undefined; } catch (e2) { return undefined; } } }; }

  // ============================================================ ids
  var NEW_SETS = ['letea', 'yarlak', 'melaria', 'cenizar'];
  var ALIAS = { letea: 'letea', escama: 'letea', escama_del_olvido: 'letea', yarlak: 'yarlak', glacial: 'yarlak', pelaje_glacial: 'yarlak', melaria: 'melaria', jalea: 'melaria', jalea_real: 'melaria', cenizar: 'cenizar', brasa_primera: 'cenizar', brasa: 'cenizar' };
  function normNew(s) { s = String(s == null ? '' : s).toLowerCase().replace(/[ -]/g, '_'); return ALIAS[s] || null; }
  var RARITY = { letea: 3, yarlak: 3, melaria: 4, cenizar: 4 };
  var BG = { letea: ['#2f6f6a', '#12262a'], yarlak: ['#7ab8e0', '#1c3050'], melaria: ['#d8a020', '#3a2410'], cenizar: ['#a8501a', '#1a1014'] };
  var SET_COLOR = { letea: '#2f6f6a', yarlak: '#9fd8ff', melaria: '#ffd23a', cenizar: '#ff9a3c' };
  var PAL = {
    letea: { m: '#2f6f6a', s: '#1c4744', h: '#6fb8a8', a: '#9be24a', as: '#5a9a1c', ah: '#e4ff9a', k: '#14282a', pearl: '#e4f4f4', pearlS: '#9cc4c8' },
    yarlak: { m: '#9fd8ff', s: '#5a9ac8', h: '#eaf8ff', a: '#f2f6fa', as: '#b4c4d6', ah: '#ffffff', k: '#1e3550', tusk: '#f4eed8', tuskS: '#c4b890' },
    melaria: { m: '#ffd23a', s: '#c8941a', h: '#fff2a8', a: '#e8841a', as: '#a8520c', ah: '#ffd070', k: '#3a2410', red: '#c8283a', redS: '#7a1424', wing: '#e4f6ff', wingS: '#a8c8dc' },
    cenizar: { m: '#5a4650', s: '#34262e', h: '#8c7078', a: '#ff9a3c', as: '#c8561a', ah: '#ffe45a', k: '#1e1418', ash: '#a89aa0' }
  };

  // ============================================================ utilidades de dibujo
  function glow(v, cx, cy, r, c0, c1) { var x = v.ctx, g = x.createRadialGradient(cx, cy, 0, cx, cy, r); g.addColorStop(0, c0 || '#fff3b0'); g.addColorStop(0.45, c1 || '#ff8a2a'); g.addColorStop(1, 'rgba(255,106,26,0)'); x.fillStyle = g; x.beginPath(); x.arc(cx, cy, r, 0, TAU); x.fill(); }
  function spark(v, cx, cy, r, col, rot) { var P = [], i; for (i = 0; i < 8; i++) { var a = (rot || 0) + i * PI / 4, rr = i % 2 ? r * 0.38 : r; P.push([cx + Math.cos(a) * rr, cy + Math.sin(a) * rr]); } v.part(Ppoly(P), col, { lw: 0.5, ol: '#a8401c', so: 0.1, sh: null }); }
  function hex(cx, cy, r) { var P = [], i; for (i = 0; i < 6; i++) { var a = PI / 6 + i * PI / 3; P.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r]); } return Ppoly(P); }
  function cord(v, col) { col = col || '#4a3220'; v.line(7, 1.6, 16, 12, 1.2, col); v.line(25, 1.6, 16, 12, 1.2, col); v.line(7.4, 1.4, 16, 11.6, 0.5, '#a87a4a'); v.line(24.6, 1.4, 16, 11.6, 0.5, '#a87a4a'); }
  function scaleFill(v, pathFn, x0, y0, x1, y1, sz, col) {
    var x = v.ctx, r, cx; x.save(); x.beginPath(); pathFn(x); x.clip(); x.strokeStyle = col; x.lineWidth = 0.55;
    for (r = 0; y0 + r * sz * 0.62 < y1; r++) for (cx = x0 + (r % 2) * sz / 2; cx < x1; cx += sz) { x.beginPath(); x.arc(cx, y0 + r * sz * 0.62, sz / 2, 0.15, PI - 0.15); x.stroke(); }
    x.restore();
  }
  function drop(v, cx, cy, r, c, sh) { v.part(Ppoly([[cx, cy - r * 1.7], [cx + r, cy + r * 0.2], [cx, cy + r * 1.1], [cx - r, cy + r * 0.2]]), c, { lw: 0.7, sh: sh || null, so: 0.3 }); v.dot(cx - r * 0.3, cy, r * 0.28, '#ffffffaa'); }
  var BODY = [[6, 8], [11.6, 5.4], [14.6, 6.6], [17.4, 6.6], [20.4, 5.4], [26, 8], [27.6, 14], [23.4, 16.6], [23.4, 27.6], [16, 29], [8.6, 27.6], [8.6, 16.6], [4.4, 14]];
  function legPoly(l, top) { return Ppoly([[l[0] + 0.4, top], [l[0] + 8.2, top], [l[0] + 8, 20], [l[0] + 11, 23.4], [l[0] + 10.8, 28], [l[0] - 1.6, 28], [l[0] - 0.4, 21]]); }
  var LEGS = [[5.4, 14], [18.2, 14]];

  // ============================================================ PIEZAS por set (lienzo 32x32 base)
  var PIECE = {
    letea: {
      yelmo: function (v, P) {   // Cresta de perla: yelmo de escamas con aletas, cresta y perla en la frente
        v.part(Ppoly([[4.4, 12], [1.6, 6.6], [3, 19.4], [7.6, 20]]), P.a, { lw: 1.2, sh: P.as, hi: P.ah, so: 0.5 }); v.part(Ppoly([[27.6, 12], [30.4, 6.6], [29, 19.4], [24.4, 20]]), P.a, { lw: 1.2, sh: P.as, hi: P.ah, so: 0.5 });
        v.part(Ppoly([[16, 0.6], [20, 8], [18.6, 9.2], [16, 6.6], [13.4, 9.2], [12, 8]]), P.a, { lw: 1.2, sh: P.as, hi: P.ah, so: 0.5 });
        var d = Pblob(16, 15.6, 10, 9.8, 41, 0.03); v.part(d, P.m, { lw: 1.7, sh: P.s, hi: P.h, so: 1.2 });
        scaleFill(v, d, 6, 7, 26, 24, 3.2, P.s);
        v.part(Prr(10.2, 17.6, 11.6, 8.6, 2.4), P.k, { lw: 1.2, sh: null }); v.dot(13, 20, 1, P.ah); v.dot(19, 20, 1, P.ah); v.line(12, 23.4, 20, 23.4, 0.6, P.as);
        v.part(Pcirc(16, 11.6, 2.5), P.pearl, { lw: 1.1, sh: P.pearlS, so: 0.5 }); v.dot(15.2, 10.8, 0.7, '#fff');
      },
      peto: function (v, P) {   // Escamas de hidra: coraza escamosa, hombreras con pua y gema acida
        var b = Pclosed(BODY); v.part(b, P.m, { lw: 1.7, sh: P.s, hi: P.h, so: 1.2 });
        scaleFill(v, b, 4, 6, 28, 29, 3.4, P.s);
        v.part(Ppoly([[4.6, 9], [6, 2.4], [9.6, 8]]), P.a, { lw: 1.1, sh: P.as, so: 0.4 }); v.part(Ppoly([[27.4, 9], [26, 2.4], [22.4, 8]]), P.a, { lw: 1.1, sh: P.as, so: 0.4 });
        v.part(Ppoly([[12.4, 6.6], [19.6, 6.6], [16, 12]]), P.k, { lw: 0.9, sh: null });
        v.part(Ppoly([[16, 11.4], [19.4, 16], [16, 21.4], [12.6, 16]]), P.a, { lw: 1.1, sh: P.as, hi: P.ah, so: 0.6 }); v.dot(15, 14.6, 0.8, '#fff');
        v.line(9, 24.4, 23, 24.4, 0.8, P.s); drop(v, 12, 29.6, 1, P.a, P.as); drop(v, 20.6, 29.8, 0.9, P.a, P.as);
      },
      grebas: function (v, P) {   // Sandalias de marea: grebas escamosas con aleta lateral y gotas
        LEGS.forEach(function (l, i) {
          var out = i ? 1 : -1, fx = i ? l[0] + 10.6 : l[0] - 0.4;
          v.part(Ppoly([[fx, 11], [fx + out * 4.6, 15.6], [fx, 20.4]]), P.a, { lw: 1, sh: P.as, so: 0.4 });
          var g = legPoly(l, 5); v.part(g, P.m, { lw: 1.5, sh: P.s, hi: P.h, so: 1 }); scaleFill(v, g, l[0] - 2, 5, l[0] + 12, 28, 3, P.s);
          v.part(Prr(l[0] - 0.4, 7, 8.8, 3.2, 1), P.k, { lw: 0.9, sh: null }); v.dot(l[0] + 4.2, 8.6, 0.9, P.ah);
          v.line(l[0] - 1, 25.6, l[0] + 10.6, 25.6, 0.9, P.as);
        });
        drop(v, 16, 30, 1, P.a, P.as);
      },
      talisman: function (v, P) {   // Colgante del olvido: escama-gota con perla y goteo
        cord(v, '#2a4a46'); v.part(Pcirc(16, 13, 1.8), P.m, { lw: 1, sh: P.s, so: 0.3 });
        var t = Pclosed([[16, 14.4], [23, 20.6], [21.6, 27], [16, 30], [10.4, 27], [9, 20.6]]); v.part(t, P.m, { lw: 1.5, sh: P.s, hi: P.h, so: 0.9 });
        scaleFill(v, t, 8, 15, 24, 30, 3.2, P.s);
        v.part(Pcirc(16, 21.6, 3.6), P.pearl, { lw: 1.1, sh: P.pearlS, so: 0.6 }); v.dot(15, 20.6, 1, '#fff'); v.dot(17.4, 23, 0.5, P.pearlS);
        drop(v, 22.6, 14.6, 1.2, P.a, P.as);
      }
    },
    yarlak: {
      yelmo: function (v, P) {   // Casco de colmillos: cupula helada, ribete de pelaje, colmillos y cristal
        function tusk(sx) { v.stick([[16 + sx * 9, 17], [16 + sx * 13.4, 20.6], [16 + sx * 13.6, 26], [16 + sx * 10.6, 29.4]], 3.4, P.tusk, { lw: 1.1, hi: '#fffbe8', curve: false }); }
        tusk(-1); tusk(1);
        var d = Pblob(16, 15.4, 10, 9.4, 43, 0.03); v.part(d, P.m, { lw: 1.6, sh: P.s, hi: P.h, so: 1.1 });
        v.part(Ppoly([[16, 0.6], [19, 7], [16, 9.4], [13, 7]]), P.h, { lw: 1.2, sh: P.m, so: 0.5 });
        v.part(Prr(10.4, 17.4, 11.2, 8.8, 2.4), P.k, { lw: 1.2, sh: null }); v.line(16, 12, 16, 17.4, 1.2, P.s); v.dot(13, 21, 0.8, '#bfe8ff'); v.dot(19, 21, 0.8, '#bfe8ff');
        for (var i = 0; i < 6; i++) v.part(Pblob(7.6 + i * 3.4, 15.2 + (i % 2) * 0.8, 2.2, 1.9, 60 + i), P.a, { lw: 0.9, sh: P.as, so: 0.3 });
      },
      peto: function (v, P) {   // Placa glacial: placas de hielo, cuello de pelaje y cristal central
        var b = Pclosed(BODY); v.part(b, P.m, { lw: 1.7, sh: P.s, hi: P.h, so: 1.2 });
        v.line(16, 10, 16, 28.6, 0.9, P.s); v.line(8.8, 19, 23.2, 19, 0.8, P.s); v.line(9, 24, 23, 24, 0.7, P.s);
        v.part(Ppoly([[16, 11], [20, 16], [16, 22], [12, 16]]), P.h, { lw: 1.2, sh: '#bfe8ff', so: 0.6 }); v.line(16, 12, 16, 21, 0.5, '#fff'); v.dot(14.6, 15, 0.7, '#fff');
        [[9.4, 13], [22.6, 13], [10, 27], [22, 27]].forEach(function (d) { v.dot(d[0], d[1], 0.6, P.h); });
        for (var i = 0; i < 6; i++) v.part(Pblob(7.6 + i * 3.4, 6.4 + Math.abs(i - 2.5) * 0.5, 2.3, 2, 70 + i), P.a, { lw: 0.9, sh: P.as, so: 0.3 });
      },
      grebas: function (v, P) {   // Pezunas de escarcha: ribete de pelaje, carambanos y pezuna oscura
        LEGS.forEach(function (l, i) {
          v.part(legPoly(l, 5), P.m, { lw: 1.5, sh: P.s, hi: P.h, so: 1 });
          v.line(l[0] + 4.2, 12, l[0] + 4.2, 20, 0.7, P.s);
          v.part(Prr(l[0] - 1.6, 22.8, 12.6, 5.6, 1.6), P.k, { lw: 1, sh: null }); v.line(l[0] + 4.2, 23, l[0] + 4.2, 28, 0.7, P.s);
          for (var j = 0; j < 3; j++) v.part(Pblob(l[0] + 1.6 + j * 3, 6.2 + (j % 2) * 0.6, 2.1, 1.9, 80 + i * 3 + j), P.a, { lw: 0.9, sh: P.as, so: 0.3 });
          v.part(Ppoly([[l[0] + 1, 8.4], [l[0] + 2.8, 8.4], [l[0] + 1.9, 12.6]]), P.h, { lw: 0.6, sh: null }); v.part(Ppoly([[l[0] + 5.4, 8.4], [l[0] + 7.2, 8.4], [l[0] + 6.3, 12.4]]), P.h, { lw: 0.6, sh: null });
        });
      },
      talisman: function (v, P) {   // Garra del yeti: garra curva con mechon de pelo y esquirla de hielo
        cord(v, '#3a4a60'); v.part(Pcirc(16, 13.4, 1.8), P.m, { lw: 1, sh: P.s, so: 0.3 });
        v.stick([[11, 16.6], [10.4, 22], [14, 27.4], [20.4, 28.4]], 5.2, P.tusk, { lw: 1.3, hi: '#fffbe8', curve: true });
        v.part(Ppoly([[20, 26.6], [24.6, 29.6], [19.6, 30.4]]), P.tuskS, { lw: 0.9, sh: null });
        for (var i = 0; i < 4; i++) v.part(Pblob(11.6 + i * 2.6, 16.2 + (i % 2) * 0.6, 2.2, 2, 90 + i), P.a, { lw: 0.9, sh: P.as, so: 0.3 });
        v.part(Ppoly([[22.6, 15], [26, 20.4], [22.6, 26], [19.6, 20.4]]), P.m, { lw: 1.1, sh: P.s, hi: P.h, so: 0.6 }); v.dot(22, 19, 0.6, '#fff');
      }
    },
    melaria: {
      yelmo: function (v, P) {   // Corona de jalea: yelmo dorado con panal, corona en puntas y gota de miel
        var d = Pblob(16, 16, 10, 9.4, 44, 0.03); v.part(d, P.m, { lw: 1.7, sh: P.s, hi: P.h, so: 1.2 });
        [[9.6, 12.2], [14.4, 12.2], [19.2, 12.2], [24, 12.2], [12, 16.2], [16.8, 16.2], [21.6, 16.2]].forEach(function (c) { v.part(hex(c[0] - 1.2, c[1], 2.4), 'rgba(0,0,0,0)', { lw: 0.55, sh: null, ol: P.s }); });
        v.part(Ppoly([[6.4, 11], [6.8, 3.2], [10.8, 8], [13, 1.6], [16, 7.4], [19, 1.6], [21.2, 8], [25.2, 3.2], [25.6, 11], [16, 12.4]]), P.m, { lw: 1.4, sh: P.s, hi: P.h, so: 0.7 });
        v.dot(6.8, 3.2, 1, P.red); v.dot(13, 1.8, 1, P.red); v.dot(19, 1.8, 1, P.red); v.dot(25.2, 3.2, 1, P.red);
        v.part(Prr(9.8, 18.6, 12.4, 7.8, 2.4), P.k, { lw: 1.2, sh: null }); v.line(10.4, 22, 21.6, 22, 0.8, P.a); v.dot(13.4, 20.6, 0.8, P.ah); v.dot(18.6, 20.6, 0.8, P.ah);
        v.part(Pcirc(16, 9.6, 1.9), P.red, { lw: 0.9, sh: P.redS, so: 0.4 }); v.dot(15.4, 9, 0.5, '#fff');
        drop(v, 8.4, 24, 1.2, P.a, P.as);
      },
      peto: function (v, P) {   // Manto de alas: peto dorado de panal con alas translucidas
        v.part(Ppoly([[4.6, 9], [0.4, 14], [3.4, 24], [8.6, 20]]), P.wing, { lw: 1.1, sh: P.wingS, so: 0.5 }); v.part(Ppoly([[27.4, 9], [31.6, 14], [28.6, 24], [23.4, 20]]), P.wing, { lw: 1.1, sh: P.wingS, so: 0.5 });
        v.line(5, 11, 2.6, 21, 0.5, P.wingS); v.line(27, 11, 29.4, 21, 0.5, P.wingS);
        var b = Pclosed(BODY); v.part(b, P.m, { lw: 1.7, sh: P.s, hi: P.h, so: 1.2 });
        var x = v.ctx; x.save(); x.beginPath(); b(x); x.clip();
        v.part(Prr(0, 19, 32, 3.2, 0), P.k, { lw: 0, sh: null }); v.part(Prr(0, 25, 32, 3.2, 0), P.k, { lw: 0, sh: null }); x.restore();
        v.outline(b, 1.7, OLC);
        v.part(hex(16, 13.4, 4.4), P.a, { lw: 1.1, sh: P.as, hi: P.ah, so: 0.6 }); v.dot(15, 12.4, 0.8, '#fff'); v.dot(16, 14.4, 0.7, P.red);
        v.part(Ppoly([[12.4, 6.6], [19.6, 6.6], [16, 9.4]]), P.k, { lw: 0.8, sh: null });
      },
      grebas: function (v, P) {   // Espolones de aguijon: grebas a rayas con espolon
        LEGS.forEach(function (l, i) {
          var g = legPoly(l, 5); v.part(g, P.m, { lw: 1.5, sh: P.s, hi: P.h, so: 1 });
          var x = v.ctx; x.save(); x.beginPath(); g(x); x.clip(); v.part(Prr(l[0] - 2, 11, 16, 3, 0), P.k, { lw: 0, sh: null }); v.part(Prr(l[0] - 2, 17.4, 16, 3, 0), P.k, { lw: 0, sh: null }); x.restore();
          v.outline(g, 1.5, OLC);
          v.part(Ppoly([[l[0] + 2, 5.2], [l[0] + 6.6, 5.2], [l[0] + 4.4, 9.4]]), P.a, { lw: 0.9, sh: P.as, so: 0.3 });
          var sx = i ? l[0] + 10.6 : l[0] - 0.8, d = i ? 1 : -1;
          v.part(Ppoly([[sx, 21], [sx + d * 5.4, 24.4], [sx, 25.8]]), P.red, { lw: 1.1, sh: P.redS, hi: '#ff8a96', so: 0.5 });
          v.line(l[0] - 1, 26.4, l[0] + 10.6, 26.4, 0.8, P.as);
        });
      },
      talisman: function (v, P) {   // Frasco de miel: frasquito de vidrio con miel, corcho y panal
        cord(v, '#5a3a14'); v.part(Pcirc(16, 12.8, 1.8), P.m, { lw: 1, sh: P.s, so: 0.3 });
        v.part(Prr(13.6, 14.4, 4.8, 3.6, 1), '#a8794a', { lw: 1, sh: '#6e4a28', hi: '#d09a64', so: 0.4 });
        var f = Pblob(16, 23, 8, 7.4, 45, 0.02); v.part(f, '#e4f6ff', { lw: 1.5, sh: P.wingS, hi: '#fff', so: 0.6 });
        var x = v.ctx; x.save(); x.beginPath(); f(x); x.clip(); x.fillStyle = P.a; x.fillRect(0, 21, 32, 12); x.fillStyle = P.m; x.fillRect(0, 24, 32, 9); x.restore();
        v.outline(f, 1.5, OLC);
        v.part(hex(16, 25, 2.6), P.ah, { lw: 0.7, sh: P.s, so: 0.3 }); v.dot(11.6, 20.4, 0.8, '#ffffffcc'); drop(v, 24.4, 17, 1.1, P.red, P.redS);
      }
    },
    cenizar: {
      yelmo: function (v, P) {   // Corona de ceniza: yelmo ceniciento con llamas de rayo y ojos de brasa
        glow(v, 16, 12, 12, '#ffe45a', '#ff7a2a');
        v.part(Ppoly([[8, 11], [5, 1.6], [11.4, 7.2], [16, 0.4], [20.6, 7.2], [27, 1.6], [24, 11]]), P.a, { lw: 1.3, sh: P.as, hi: P.ah, so: 0.6 });
        var d = Pblob(16, 16, 10, 9.4, 46, 0.03); v.part(d, P.m, { lw: 1.7, sh: P.s, hi: P.h, so: 1.2 });
        v.part(Prr(9.4, 17, 13.2, 8.6, 2.6), P.k, { lw: 1.2, sh: null });
        v.part(Ppoly([[10.6, 19.4], [14.4, 20.4], [14, 21.8], [10.6, 21]]), P.ah, { lw: 0, sh: null }); v.part(Ppoly([[21.4, 19.4], [17.6, 20.4], [18, 21.8], [21.4, 21]]), P.ah, { lw: 0, sh: null });
        v.line(16, 9, 14.4, 12.6, 1.1, P.ah); v.line(14.4, 12.6, 17, 13, 1.1, P.ah); v.line(17, 13, 15.4, 16.4, 1.1, P.ah);
        v.line(7.4, 14, 10, 12.6, 0.7, P.a); v.line(24.6, 14, 22, 12.6, 0.7, P.a);
      },
      peto: function (v, P) {   // Corazon de Brasa Primera: coraza oscura con corazon fisurado y rayo
        var b = Pclosed(BODY); v.part(b, P.m, { lw: 1.7, sh: P.s, hi: P.h, so: 1.2 });
        v.part(Ppoly([[4.8, 6], [6.6, 0.8], [9.6, 6.2]]), P.k, { lw: 1.1, sh: null }); v.part(Ppoly([[22.4, 6.2], [25.4, 0.8], [27.2, 6]]), P.k, { lw: 1.1, sh: null });
        glow(v, 16, 16, 9, '#ffe45a', '#ff7a2a');
        v.part(Pblob(16, 16, 4.4, 4.6, 47), P.a, { lw: 1.1, sh: P.as, hi: P.ah, so: 0.6 });
        v.line(16.6, 11.4, 14.2, 15.4, 1.1, P.ah); v.line(14.2, 15.4, 17.4, 16, 1.1, P.ah); v.line(17.4, 16, 15.2, 20.4, 1.1, P.ah);
        v.line(9.6, 23, 12, 26.6, 0.8, P.a); v.line(12, 26.6, 10.6, 28, 0.8, P.a); v.line(22.4, 22.6, 20, 26, 0.8, P.a);
        v.line(8.8, 20.4, 23.2, 20.4, 0.7, P.s);
      },
      grebas: function (v, P) {   // Pasos de ceniza: grebas oscuras con grietas de brasa y bocanada de ceniza
        LEGS.forEach(function (l, i) {
          v.part(legPoly(l, 5), P.m, { lw: 1.6, sh: P.s, hi: P.h, so: 1 });
          v.line(l[0] + 3, 8, l[0] + 5.2, 12, 0.9, P.a); v.line(l[0] + 5.2, 12, l[0] + 3.6, 16, 0.9, P.a); v.line(l[0] + 3.6, 16, l[0] + 5.6, 20.4, 0.9, P.ah);
          v.part(Prr(l[0] - 0.6, 22.6, 10.2, 2.8, 0.8), P.k, { lw: 0.8, sh: null });
          v.part(Ppoly([[l[0] + 1.2, 6], [l[0] + 2.8, 1.6], [l[0] + 4.4, 6]]), P.k, { lw: 0.8, sh: null });
        });
        v.part(Pblob(7, 29.6, 2.6, 1.6, 48), P.ash, { lw: 0.7, sh: null, so: 0.2 }); v.part(Pblob(25.6, 29.8, 2.4, 1.5, 49), P.ash, { lw: 0.7, sh: null, so: 0.2 }); v.dot(16, 30.4, 0.9, P.a);
      },
      talisman: function (v, P) {   // Rescoldo: brasa en jaula de hierro con rayo
        cord(v, '#3a2a30'); glow(v, 16, 20, 11, '#ffe45a', '#ff7a2a');
        v.part(Pcirc(16, 13.6, 1.8), P.m, { lw: 1, sh: P.s, so: 0.3 });
        v.part(Pcirc(16, 21, 6.8), P.a, { lw: 1.2, sh: P.as, hi: P.ah, so: 0.8 });
        v.line(16.8, 15.6, 14.4, 20.6, 1.2, P.ah); v.line(14.4, 20.6, 17.6, 21.4, 1.2, P.ah); v.line(17.6, 21.4, 15.2, 26.4, 1.2, P.ah);
        var x = v.ctx; x.strokeStyle = OLC; x.lineWidth = 1.5; x.beginPath(); x.ellipse(16, 21, 3.4, 7.8, 0, 0, TAU); x.stroke(); x.beginPath(); x.moveTo(8, 21); x.lineTo(24, 21); x.stroke();
        x.strokeStyle = P.h; x.lineWidth = 0.6; x.beginPath(); x.ellipse(16, 21, 3.4, 7.8, 0, 0.2, 1.2); x.stroke();
        v.part(Prr(12.4, 27.2, 7.2, 2.6, 0.8), P.m, { lw: 1, sh: P.s, so: 0.3 });
      }
    }
  };

  // ============================================================ TALISMANES DE MINIJEFE (1 por bioma; piezas 29-33)
  var MINI_BIOMES = ['bosque', 'cripta', 'asfodelo', 'tundra', 'panal'];
  var MINI_ALIAS = { bosque: 'bosque', carnero: 'bosque', tejedora: 'bosque', cripta: 'cripta', alcaide: 'cripta', centinela: 'cripta', asfodelo: 'asfodelo', hidra: 'asfodelo', planidera: 'asfodelo', tundra: 'tundra', yeti_mayor: 'tundra', yeti: 'tundra', ventisquero: 'tundra', panal: 'panal', avispon: 'panal', reina_joven: 'panal' };
  var MINI_INFO = {
    bosque: { name: 'Colmillo de arrastre', bonus: '+10 % radio de iman', ids: ['carnero', 'tejedora'], bg: ['#5a7a3a', '#1a2818'] },
    cripta: { name: 'Llave maestra', bonus: '+1 HP por corazon', ids: ['alcaide', 'centinela'], bg: ['#a8501a', '#24121a'] },
    asfodelo: { name: 'Perla del rio', bonus: '+10 % XP de gemas de Pantano', ids: ['hidra', 'planidera'], bg: ['#3a7a8a', '#0e1c2a'] },
    tundra: { name: 'Brasa de bolsillo', bonus: 'Frio -10 %', ids: ['yeti_mayor', 'ventisquero'], bg: ['#6aa8d0', '#1a2a44'] },
    panal: { name: 'Gota de ambar', bonus: 'Miel -15 %', ids: ['avispon', 'reina_joven'], bg: ['#d8a020', '#3a2410'] }
  };
  function normMini(s) { s = String(s == null ? '' : s).toLowerCase().replace(/[ -]/g, '_'); return MINI_ALIAS[s] || null; }
  var MINI = {
    bosque: function (v) {   // colmillo curvo del carnero con aro de iman
      cord(v, '#4a3220'); v.part(Pcirc(16, 13.4, 1.8), '#9aa4b0', { lw: 1, sh: '#66707e', so: 0.3 });
      v.stick([[10, 16.4], [8.4, 22], [12, 27.6], [19.4, 28]], 5.6, '#f0e4bc', { lw: 1.3, hi: '#fff8dc', curve: true });
      v.part(Ppoly([[19, 25.6], [24, 28.6], [18.8, 30.2]]), '#c8b888', { lw: 0.9, sh: null });
      v.part(Prr(9.4, 15.4, 6.6, 4, 1.2), '#f4ecd4', { lw: 1.1, sh: '#c8bc9c', so: 0.4 });
      var x = v.ctx; x.strokeStyle = OLC; x.lineWidth = 3.6; x.lineCap = 'butt'; x.beginPath(); x.arc(22.6, 20, 3.4, PI * 0.2, PI * 1.8); x.stroke();
      x.strokeStyle = '#d03a2a'; x.lineWidth = 1.8; x.beginPath(); x.arc(22.6, 20, 3.4, PI * 0.2, PI * 1.8); x.stroke(); x.lineCap = 'round';
      v.dot(24.6, 17.4, 0.6, '#fff');
    },
    cripta: function (v) {   // llave maestra con brasa
      glow(v, 16, 12, 9, '#ffd23a', '#ff6a1a'); cord(v, '#3a2a30');
      v.part(Pcirc(16, 12.6, 5), '#ffb030', { lw: 1.5, sh: '#a8741a', hi: '#ffe27a', so: 0.8 }); v.part(Pcirc(16, 12.6, 2.4), '#2a1a22', { lw: 0.8, sh: null }); v.dot(16, 12.6, 1.1, '#ff6a1a');
      v.part(Prr(14.6, 16.4, 2.8, 12.4, 0.8), '#ffb030', { lw: 1.2, sh: '#a8741a', hi: '#ffe27a', so: 0.5 });
      v.part(Ppoly([[17, 21.4], [22, 21.4], [22, 23.4], [19, 23.4], [19, 24.8], [22, 24.8], [22, 27.8], [17, 27.8]]), '#ffb030', { lw: 1.1, sh: '#a8741a', so: 0.4 });
      v.part(Ppoly([[14.6, 25.2], [10.4, 25.2], [10.4, 27.6], [14.6, 27.6]]), '#6a5058', { lw: 1, sh: '#3e2a34', so: 0.3 });
    },
    asfodelo: function (v) {   // perla en velo anegado
      cord(v, '#2a4a46'); v.part(Pcirc(16, 13.2, 1.8), '#6fb8a8', { lw: 1, sh: '#2f6f6a', so: 0.3 });
      var vel = Pclosed([[16, 15], [24.4, 18.6], [25.6, 27], [20, 30.4], [12, 30.4], [6.4, 27], [7.6, 18.6]]); v.part(vel, 'rgba(120,200,200,0.55)', { lw: 1.3, sh: null });
      v.line(9, 22, 12, 29, 0.6, '#d8f4f4'); v.line(23, 22, 20, 29, 0.6, '#d8f4f4');
      v.part(Pcirc(16, 22.4, 5.2), '#eef8f8', { lw: 1.3, sh: '#9cc4c8', hi: '#fff', so: 0.8 }); v.part(Pblob(14.6, 20.6, 1.6, 1.1, 50), '#ffffff', { lw: 0, sh: null }); v.dot(18, 25, 0.8, '#c8e4ec');
      drop(v, 24.6, 13, 1.1, '#7ad0c8', '#2f6f6a');
    },
    tundra: function (v) {   // brasa de bolsillo: ascua dentro de cristal de hielo
      cord(v, '#3a4a60'); v.part(Pcirc(16, 13.2, 1.8), '#9fd8ff', { lw: 1, sh: '#5a9ac8', so: 0.3 });
      glow(v, 16, 22, 10, '#ffe45a', '#ff7a2a');
      var c = Pclosed([[16, 15.4], [23, 19], [23.4, 26], [16, 30], [8.6, 26], [9, 19]]); v.part(c, 'rgba(190,232,255,0.7)', { lw: 1.5, sh: '#7ab8e0', hi: '#fff', so: 0.6 });
      v.part(Pblob(16, 23, 3.6, 3.8, 51), '#ff9a3c', { lw: 0.9, sh: '#c8561a', hi: '#ffe45a', so: 0.5 }); v.dot(15.2, 22, 0.9, '#ffe45a');
      v.line(10.4, 19.6, 13, 17.4, 0.6, '#fff'); v.line(21.6, 19.8, 20, 18.2, 0.5, '#fff');
    },
    panal: function (v) {   // gota de ambar con abeja atrapada
      cord(v, '#5a3a14'); v.part(Pcirc(16, 13.2, 1.8), '#ffd23a', { lw: 1, sh: '#c8941a', so: 0.3 });
      var g = Pclosed([[16, 14.6], [23.4, 22.4], [21.4, 28.6], [16, 30.4], [10.6, 28.6], [8.6, 22.4]]); v.part(g, '#e89a1a', { lw: 1.6, sh: '#a8520c', hi: '#ffd070', so: 0.9 });
      v.part(Pblob(16, 23, 3, 2.1, 52), '#3a2410', { lw: 0, sh: null }); v.line(14.6, 21.4, 14.6, 24.6, 0.9, '#ffd23a'); v.line(17, 21.4, 17, 24.6, 0.9, '#ffd23a');
      v.part(Pblob(14.4, 20, 2, 1.3, 53, 0.02, 8, -0.5), 'rgba(228,246,255,0.9)', { lw: 0.4, sh: null }); v.part(Pblob(18.2, 20, 2, 1.3, 54, 0.02, 8, 0.5), 'rgba(228,246,255,0.9)', { lw: 0.4, sh: null });
      v.dot(11.6, 20.6, 0.8, '#fff3b0'); v.dot(20.6, 27, 0.5, '#fff3b0');
    }
  };

  // ============================================================ caches e iconos
  var PIECE_CACHE = {}, MINI_PIECE = {}, ICON_CACHE = {};
  var prevPiece = ART.pieceCanvas;
  function pieceCanvas(setId, slotId) {
    var set = normNew(setId), slot = ART.normSlot(slotId);
    if (!set) return prevPiece(setId, slotId);
    var k = set + '|' + slot;
    return PIECE_CACHE[k] || (PIECE_CACHE[k] = vframe(32, 32, function (v) { PIECE[set][slot](v, PAL[set]); }, { lw: 1.5 }));
  }
  function miniPiece(b) { return MINI_PIECE[b] || (MINI_PIECE[b] = vframe(32, 32, function (v) { MINI[b](v); }, { lw: 1.5 })); }

  function buildIcon(piece, bg, ref, rar, locked) {
    var RC = ART.rarityColors, FC = ART.refColors;
    return vframe(32, 32, function (v) {
      var x = v.ctx, g = x.createLinearGradient(0, 0, 0, 32);
      g.addColorStop(0, bg[0]); g.addColorStop(1, bg[1]);
      x.save(); x.beginPath(); Prr(1.6, 1.6, 28.8, 28.8, 5)(x); x.clip(); x.fillStyle = g; x.fillRect(0, 0, 32, 32);
      x.fillStyle = 'rgba(255,255,255,0.12)'; x.beginPath(); x.arc(24, 5, 12, 0, TAU); x.fill(); x.restore();
      x.drawImage(piece, 0, 0, 32, 32);
      v.outline(Prr(1.6, 1.6, 28.8, 28.8, 5), 2.2, OLC);
      x.strokeStyle = RC[rar]; x.lineWidth = 1.5; x.beginPath(); Prr(2.6, 2.6, 26.8, 26.8, 4.2)(x); x.stroke();
      if (ref > 0) { x.strokeStyle = FC[ref]; x.lineWidth = 0.9; x.beginPath(); Prr(4, 4, 24, 24, 3.4)(x); x.stroke(); }
      if (ref === 3) { spark(v, 26.6, 5.4, 3.4, '#fff3b0', 0.4); spark(v, 5.2, 26, 2, '#ffe27a', 0.1); }
      if (ref > 0) {
        v.part(Prr(17.4, 21.6, 12.6, 8.8, 3), FC[ref], { lw: 1.2, sh: ref === 3 ? '#c8901a' : ref === 2 ? '#8a94ac' : '#8a5428', so: 0.5 });
        x.fillStyle = '#1b1124'; x.font = 'bold 7px system-ui, Arial, sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText('+' + ref, 23.8, 26.2);
      }
      if (locked) { x.save(); x.globalCompositeOperation = 'source-atop'; x.fillStyle = 'rgba(20,14,30,0.62)'; x.fillRect(0, 0, 32, 32); x.restore(); }
    }, { lw: 1.5 });
  }

  var prevIcon = A.armorIcon;
  /**
   * Assets.armorIcon(setId, slot, ref=0, {rarity, locked}) -> canvas 64x64 CACHEADO.
   * Extiende: setId 'letea'|'yarlak'|'melaria'|'cenizar' (+ alias) con slots yelmo/peto/grebas/talisman,
   * y setId 'mini' con slot = id de minijefe o de bioma (carnero, tejedora, alcaide, centinela, hidra, planidera, yeti_mayor, ventisquero, avispon, reina_joven | bosque..panal).
   * Otros sets delegan en assets_armor.js.
   */
  A.armorIcon = safe(function (setId, slot, ref, o) {
    var s = String(setId == null ? '' : setId).toLowerCase(), set = normNew(s), isMini = (s === 'mini' || s === 'minijefe' || s === 'talisman_mini');
    if (!set && !isMini) return prevIcon.apply(this, arguments);
    o = o || {}; var r = clamp(ref | 0, 0, 3), lk = o.locked ? 1 : 0, sl, mb, rar, k;
    if (isMini) {
      mb = normMini(slot) || 'bosque'; rar = clamp(o.rarity == null ? 2 : o.rarity | 0, 0, 4); k = ['mini', mb, r, rar, lk].join('|');
      return ICON_CACHE[k] || (ICON_CACHE[k] = buildIcon(miniPiece(mb), MINI_INFO[mb].bg, r, rar, lk));
    }
    sl = ART.normSlot(slot); rar = clamp(o.rarity == null ? RARITY[set] : o.rarity | 0, 0, 4); k = [set, sl, r, rar, lk].join('|');
    return ICON_CACHE[k] || (ICON_CACHE[k] = buildIcon(pieceCanvas(set, sl), BG[set], r, rar, lk));
  }, function () { return prevIcon.apply(this, arguments); });

  /** Assets.miniTalismanIcon(idMinijefeOBioma, ref=0, {rarity, locked}) = armorIcon('mini', id, ref, o). */
  A.miniTalismanIcon = safe(function (id, ref, o) { return A.armorIcon('mini', id, ref, o); });
  /** Assets.drawMiniTalisman(ctx, id, x, y, size=32, {ref, rarity, locked, alpha}) */
  A.drawMiniTalisman = safe(function (ctx, id, x, y, size, o) { A.drawArmorIcon(ctx, 'mini', id, x, y, size, o); });

  // ============================================================ maniqui con los 7 sets (reemplaza drawMannequin; mismo contrato)
  var MANN = { yelmo: [28, 14, 36], peto: [28, 52, 50], grebas: [28, 80, 40], talisman: [28, 56, 22] };
  function eqEntry(e) { if (!e) return null; if (typeof e === 'string') return { set: e }; return e.set || e.setId ? { set: e.set || e.setId, ref: e.ref | 0 } : null; }
  var prevMann = A.drawMannequin;
  /** Assets.drawMannequin(ctx, x, y, equip, t, {scale}): igual que antes, ahora tambien con letea/yarlak/melaria/cenizar y {set:'mini', id} en talisman. */
  A.drawMannequin = safe(function (ctx, x, y, equip, t, o) {
    o = o || {}; var s = o.scale || 1, im = A.sprite('vil_mannequin', 0), w = im.width * s, h = im.height * s, top = y - h, left = x - w / 2;
    ctx.save(); ctx.drawImage(im, left, top, w, h); equip = equip || {};
    ['grebas', 'peto', 'yelmo', 'talisman'].forEach(function (sl) {
      var e = eqEntry(equip[sl]); if (!e) return; var m = MANN[sl], sz = m[2] * s, pc;
      if (sl === 'talisman' && (e.set === 'mini' || (equip[sl] && equip[sl].mini))) pc = miniPiece(normMini(equip[sl].id || equip[sl].mini) || 'bosque'); else pc = pieceCanvas(e.set, sl);
      ctx.drawImage(pc, left + (m[0] * s) - sz / 2, top + (m[1] * s) - sz / 2, sz, sz);
    });
    ctx.restore();
  }, function () { return prevMann ? prevMann.apply(this, arguments) : undefined; });

  // ============================================================ MARLO VESTIDO (overlay 'dressed' sobre el sprite 'player' 24x24 -> 48x48)
  // Marlo mira a la DERECHA; cabeza centro (12.6, 9.2+by), chaleco (8.3-16.6, 12.4-20.4). Se dibuja con el mismo ancla que el sprite: x,y = CENTRO del sprite.
  var DP = {   // paleta compacta por set (m=metal/tela, s=sombra, h=brillo, a=acento, k=oscuro)
    aldeano: { m: '#b8a878', s: '#8a7a52', h: '#e4d9ae', a: '#8a5a32', as: '#5e3a1c', k: '#5e3a1c' },
    pastor: { m: '#9aa4b0', s: '#66707e', h: '#d8e0ec', a: '#f4ecd4', as: '#c8bc9c', k: '#363f4e', horn: '#e8d8a8' },
    karceron: { m: '#6a5058', s: '#3e2a34', h: '#9c7a84', a: '#ff6a1a', as: '#b0380e', k: '#241820', ah: '#ffd23a' },
    letea: PAL.letea, yarlak: PAL.yarlak, melaria: PAL.melaria, cenizar: PAL.cenizar
  };
  var DSET = { aldeano: 'aldeano', village: 'aldeano', pastor: 'pastor', esquila: 'pastor', karceron: 'karceron', carcelero: 'karceron' };
  function dressSet(s) { s = String(s == null ? '' : s).toLowerCase().replace(/[ -]/g, '_'); return DSET[s] || normNew(s) || null; }
  function dHelm(v, set, P, by) {
    var d = Pblob(12.5, 5.2 + by, 5.8, 3.1, 61, 0.02, 10);
    if (set === 'pastor') { v.stick([[7.2, 6 + by], [4.8, 6.6 + by], [4.4, 9.4 + by], [6.4, 10.6 + by]], 1.9, P.horn, { lw: 0.8, curve: false }); v.stick([[17.8, 6 + by], [20, 6.6 + by], [20.2, 9.6 + by], [18.4, 10.6 + by]], 1.9, P.horn, { lw: 0.8, curve: false }); }
    if (set === 'yarlak') { v.stick([[7.4, 8 + by], [6.4, 11 + by], [7.6, 13.2 + by]], 1.8, P.tusk, { lw: 0.7, curve: false }); }
    if (set === 'letea') { v.part(Ppoly([[12.5, 0.8 + by], [14.6, 4.6 + by], [10.4, 4.6 + by]]), P.a, { lw: 0.8, sh: P.as, so: 0.2 }); }
    if (set === 'cenizar') { v.part(Ppoly([[7.4, 6 + by], [6.4, 1.6 + by], [9.6, 4 + by], [12.5, 0.6 + by], [15.4, 4 + by], [18.6, 1.6 + by], [17.6, 6 + by]]), P.a, { lw: 0.8, sh: P.as, so: 0.2 }); }
    if (set === 'karceron') { v.part(Ppoly([[8.4, 5.4 + by], [9.2, 1 + by], [11.4, 4.6 + by]]), P.k, { lw: 0.7, sh: null }); v.part(Ppoly([[16.4, 5.4 + by], [15.6, 1 + by], [13.6, 4.6 + by]]), P.k, { lw: 0.7, sh: null }); }
    v.part(d, P.m, { lw: 1.1, sh: P.s, hi: P.h, so: 0.7 });
    if (set === 'aldeano') { v.part(Prr(7.2, 6.4 + by, 10.6, 1.6, 0.8), P.a, { lw: 0.8, sh: P.as, so: 0.2 }); v.part(Pcirc(12.5, 2.4 + by, 1.5), '#ece0b8', { lw: 0.8, sh: null }); }
    else if (set === 'pastor') { for (var i = 0; i < 3; i++) v.part(Pblob(9.8 + i * 2.7, 3.2 + by + (i === 1 ? -0.5 : 0), 1.5, 1.3, 62 + i), P.a, { lw: 0.6, sh: P.as, so: 0.2 }); v.line(12.5, 3.2 + by, 12.5, 7.6 + by, 0.7, P.s); }
    else if (set === 'karceron') { v.line(7.6, 7 + by, 17.4, 7 + by, 0.8, P.a); v.dot(12.5, 4.4 + by, 0.8, P.ah); }
    else if (set === 'letea') { v.dot(12.5, 6.8 + by, 1, P.pearl); scaleFill(v, d, 6, 3, 19, 9, 2.2, P.s); }
    else if (set === 'yarlak') { for (var j = 0; j < 4; j++) v.part(Pblob(8.6 + j * 2.7, 7.4 + by, 1.5, 1.2, 66 + j), P.a, { lw: 0.6, sh: P.as, so: 0.2 }); v.dot(12.5, 3.6 + by, 0.9, P.h); }
    else if (set === 'melaria') { v.part(Ppoly([[7.2, 6.6 + by], [7.4, 2.4 + by], [9.6, 4.8 + by], [12.5, 1.6 + by], [15.4, 4.8 + by], [17.6, 2.4 + by], [17.8, 6.6 + by]]), P.m, { lw: 0.8, sh: P.s, so: 0.2 }); v.dot(12.5, 5.4 + by, 0.8, P.red); }
    else if (set === 'cenizar') { v.line(12.8, 3.4 + by, 11.6, 5.4 + by, 0.7, P.ah); v.line(11.6, 5.4 + by, 13.2, 5.8 + by, 0.7, P.ah); }
  }
  function dChest(v, set, P, by) {
    var b = Pclosed([[8.2, 12.8 + by], [10.8, 12 + by], [14.4, 12 + by], [16.8, 12.8 + by], [17, 18.2 + by], [12.5, 20.8 + by], [8, 18.2 + by]]);
    if (set === 'melaria') { v.part(Ppoly([[8.2, 13 + by], [5.4, 14 + by], [6.4, 19 + by], [8.6, 17 + by]]), P.wing, { lw: 0.6, sh: null, so: 0.1 }); }
    v.part(b, P.m, { lw: 1.1, sh: P.s, hi: P.h, so: 0.7 });
    if (set === 'aldeano') { v.line(10.6, 13.8 + by, 14.4, 15.6 + by, 0.5, P.a); v.line(14.4, 13.8 + by, 10.6, 15.6 + by, 0.5, P.a); v.part(Prr(8.4, 18 + by, 8.2, 1.6, 0.6), P.a, { lw: 0.6, sh: null }); }
    else if (set === 'pastor') { for (var i = 0; i < 4; i++) v.part(Pblob(9.6 + i * 2.1, 12.8 + by, 1.2, 1, 71 + i), P.a, { lw: 0.5, sh: null }); v.line(8.6, 17 + by, 16.4, 17 + by, 0.5, P.s); v.dot(12.5, 15.2 + by, 0.8, P.k); }
    else if (set === 'karceron') { v.dot(12.5, 15.8 + by, 1.7, P.ah); v.dot(12.5, 15.8 + by, 0.8, P.a); }
    else if (set === 'letea') { scaleFill(v, b, 7, 12, 18, 21, 2.4, P.s); v.dot(12.5, 15.4 + by, 1, P.a); }
    else if (set === 'yarlak') { for (var j = 0; j < 4; j++) v.part(Pblob(9.6 + j * 2.1, 12.8 + by, 1.3, 1.1, 75 + j), P.a, { lw: 0.5, sh: null }); v.part(Ppoly([[12.5, 14 + by], [14, 16.4 + by], [12.5, 18.4 + by], [11, 16.4 + by]]), P.h, { lw: 0.6, sh: null }); }
    else if (set === 'melaria') { v.part(hex(12.5, 15.8 + by, 2.2), P.a, { lw: 0.7, sh: P.as, so: 0.2 }); v.line(8.4, 18.6 + by, 16.6, 18.6 + by, 0.8, P.k); }
    else if (set === 'cenizar') { v.dot(12.5, 15.8 + by, 1.8, P.a); v.line(13, 14 + by, 11.8, 15.8 + by, 0.7, P.ah); v.line(11.8, 15.8 + by, 13.2, 17.6 + by, 0.7, P.ah); }
  }
  var DRESS_CACHE = {};
  function dressedCanvas(set, by, helm, chest) {
    var k = [set, by, helm ? 1 : 0, chest ? 1 : 0].join('|');
    return DRESS_CACHE[k] || (DRESS_CACHE[k] = vframe(24, 24, function (v) { var P = DP[set]; if (chest) dChest(v, set, P, by); if (helm) dHelm(v, set, P, by); }, { lw: 1.1 }));
  }
  function dressBy(anim, t) {
    t = t || 0;
    if (anim === 'hurt' || anim === 'die') return 1;
    if (anim === 'walk') { var k = Math.floor(t / 80) % 6; return (k === 1 || k === 4) ? -1 : 0; }
    var i = Math.floor(t / 166) % 24; return ((i >= 4 && i <= 9) || (i >= 17 && i <= 22)) ? 1 : 0;   // mismo ciclo que la anim 'idle' de player
  }
  /**
   * Assets.drawMarloArmor(ctx, x, y, t, {set, flip, scale, anim, by, equip, alpha})
   * Overlay sobre el sprite 'player' (24x24 base, 48x48 final): x,y = CENTRO del sprite (mismo punto en que se dibuja Marlo). Dibuja yelmo+peto del set.
   *  set: 'aldeano'|'pastor'|'karceron'|'letea'|'yarlak'|'melaria'|'cenizar' (+alias) o null (no dibuja). equip = {yelmo:set|null, peto:set|null} para mezclar sets (gana a `set`).
   *  flip: true si Marlo mira a la izquierda. scale: 1 en run, 1.3 en la aldea. anim: 'idle'|'walk'|'hurt' (+ t en ms) ajusta el balanceo; by (-1|0|1) lo fuerza.
   * Llamar justo DESPUES de dibujar el sprite (con el mismo alpha/tinte si se quiere). Devuelve true si dibujo algo.
   */
  A.drawMarloArmor = safe(function (ctx, x, y, t, o) {
    o = o || {}; var eq = o.equip || {}, hs = dressSet(eq.yelmo !== undefined ? eq.yelmo : o.set), ps = dressSet(eq.peto !== undefined ? eq.peto : o.set);
    if (!hs && !ps) return false;
    var by = o.by != null ? clamp(o.by | 0, -1, 1) : dressBy(o.anim, t), sc = o.scale || 1;
    ctx.save(); if (o.alpha != null) ctx.globalAlpha = o.alpha; ctx.translate(x, y); ctx.scale(o.flip ? -sc : sc, sc);
    if (hs === ps) ctx.drawImage(dressedCanvas(hs, by, 1, 1), -24, -24);
    else { if (ps) ctx.drawImage(dressedCanvas(ps, by, 0, 1), -24, -24); if (hs) ctx.drawImage(dressedCanvas(hs, by, 1, 0), -24, -24); }
    ctx.restore(); return true;
  }, function () { return false; });

  // ============================================================ fx_armor_block: destello corto de golpe amortiguado (32x32, 3 frames)
  // f0 impacto (disco + chispas cortas), f1 anillo + escudo hexagonal tenue, f2 disipacion (anillo roto + motas)
  function fxFrame(k) {
    return function (v) {
      var x = v.ctx, i, cx = 16, cy = 16;
      x.save(); x.globalCompositeOperation = 'lighter';
      if (k === 0) {
        glow(v, cx, cy, 12, '#e8f4ff', '#6ab0d8');
        for (i = 0; i < 6; i++) { var a = i * PI / 3 + 0.3; v.line(cx + Math.cos(a) * 5, cy + Math.sin(a) * 5, cx + Math.cos(a) * 9.4, cy + Math.sin(a) * 9.4, 1.4, '#ffffff'); }
      } else if (k === 1) {
        x.strokeStyle = 'rgba(190,230,255,0.9)'; x.lineWidth = 2; x.beginPath(); x.arc(cx, cy, 10, 0, TAU); x.stroke();
        x.strokeStyle = 'rgba(255,255,255,0.6)'; x.lineWidth = 0.9; x.beginPath(); x.arc(cx, cy, 7.4, 0, TAU); x.stroke();
        x.fillStyle = 'rgba(120,190,230,0.28)'; x.beginPath(); hex(cx, cy, 8.4)(x); x.fill();
        x.strokeStyle = 'rgba(255,255,255,0.8)'; x.lineWidth = 1; x.beginPath(); hex(cx, cy, 8.4)(x); x.stroke();
      } else {
        x.strokeStyle = 'rgba(190,230,255,0.55)'; x.lineWidth = 1.2;
        for (i = 0; i < 5; i++) { var a0 = i * TAU / 5 + 0.2; x.beginPath(); x.arc(cx, cy, 13, a0, a0 + 0.8); x.stroke(); }
        for (i = 0; i < 7; i++) { var b = i * 0.9 + 0.5, r = 9 + (i % 3) * 2; v.dot(cx + Math.cos(b) * r, cy + Math.sin(b) * r, 0.7, 'rgba(230,246,255,0.8)'); }
      }
      x.restore();
    };
  }
  addV('fx_armor_block', 32, 32, [0, 1, 2].map(fxFrame), { lw: 1 }, { block: { f: [0, 1, 2], fps: 10 } });
  /**
   * Assets.fxArmorBlock(ctx, x, y, t, {scale=1, dur=300, alpha=1}): x,y = CENTRO; t = ms desde el golpe (0..dur). Dibuja 3 fases (impacto, escudo, disipacion)
   * con 'lighter' y se desvanece; fuera de [0,dur) no dibuja. Devuelve true mientras siga vivo (para que el llamador lo elimine al acabar).
   */
  A.fxArmorBlock = safe(function (ctx, x, y, t, o) {
    o = o || {}; var dur = o.dur || 300, sc = o.scale || 1; t = t || 0;
    if (t < 0 || t >= dur) return false;
    var p = t / dur, f = p < 0.25 ? 0 : p < 0.6 ? 1 : 2, im = A.sprite('fx_armor_block', f), s = sc * (0.8 + 0.5 * p), w = im.width * s * 0.5;
    ctx.save(); ctx.globalAlpha = (o.alpha == null ? 1 : o.alpha) * (p < 0.15 ? 1 : 1 - (p - 0.15) / 0.85); ctx.globalCompositeOperation = 'lighter';
    ctx.drawImage(im, x - w / 2, y - w / 2, w, w); ctx.restore(); return true;
  }, function () { return false; });

  // ============================================================ ARMOR_ART ampliado
  ART.sets = ART.sets.concat(NEW_SETS);
  ART.pieceCanvas = pieceCanvas;
  ART.miniPieceCanvas = function (id) { return miniPiece(normMini(id) || 'bosque'); };
  var prevNorm = ART.normSet; ART.normSet = function (s) { return normNew(s) || prevNorm(s); };
  NEW_SETS.forEach(function (s) { ART.setColors[s] = SET_COLOR[s]; ART.defaultRarity[s] = RARITY[s]; for (var a in ALIAS) if (ALIAS[a] === s) ART.setAlias[a] = s; });
  ART.mini = { ready: true, biomes: MINI_BIOMES, alias: MINI_ALIAS, info: MINI_INFO, norm: normMini };
  ART.ready2 = true;
})();
