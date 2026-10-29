/*!
 * assets_boss5.js - Arte del JEFE FINAL v7 (P6.5): CENIZAR, el Incendio Primero (Cráter del Hogar Quemado). Solo arte, sin logica.
 * Script clasico que EXTIENDE window.Assets; cargar tras assets.js, assets_boss.js ... assets_boss4.js y assets_fam4.js
 * (usa Assets._h y envuelve drawBoss/renderBoss/bossAnchors/drawBossTele/setBiome/arena de los modulos anteriores).
 * Contrato (nombres, state, anclas, telegrafias, VFX, reliquias, arena, cinematica): games/card-swarm/ASSETS_API.md, seccion "Jefe final v7 (P6.5: Cenizar)".
 * Diseno: DESIGN-v7-jefe-final.md sec. 1, 3, 6-8 y 13. Estilo: contorno grueso #1b1124, color plano + 1 sombra + 1 brillo, rasterizado x2.
 * Coste: todas las capas del cuerpo se componen en UN canvas compartido con rect sucio (~20 drawImage por frame), sin shadowBlur.
 * Alias: 'cenizar' (id del arte y del jefe) y 'incendio' funcionan en toda la API.
 * Convencion de tamanos del contrato: tamano BASE (x2 = final) salvo que se diga "final".
 */
(function () {
  'use strict';
  var A = window.Assets, H = A && A._h;
  if (!H || !A.drawBoss || !A.drawBossTele || !A.sprite || !A.bossAnchors) { if (window.console) console.error('assets_boss5: falta Assets._h o assets_boss*.js (cargar tras assets_boss4.js y assets_fam4.js)'); return; }
  var addV = H.addV, Ppoly = H.Ppoly, Pblob = H.Pblob, Prr = H.Prr, Pclosed = H.Pclosed, Pcirc = H.Pcirc, OLC = H.OLC;
  var TAU = Math.PI * 2, LW = 2.1, sin = Math.sin, cos = Math.cos, PI = Math.PI;
  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  function lerp(a, b, u) { return a + (b - a) * u; }
  function ease(u) { u = clamp(u, 0, 1); return u * u * (3 - 2 * u); }
  function pr(i) { var s = Math.sin(i * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); }
  function mkc(w, h) { var c = document.createElement('canvas'); c.width = w; c.height = h; return c; }
  function rd(v) { return Math.round(v * 10) / 10; }

  // ---- paleta: ceniza #3a3440, brasa #ff6a1a, nucleo blanco-amarillo #fff2b0 (DESIGN-v7 sec. 1)
  var C = {
    ash: '#3a3440', ashS: '#241f2b', ashH: '#5c5468', ashD: '#16111c', ember: '#ff6a1a', emberS: '#b8380a', emberH: '#ffa04a', core: '#fff2b0', coreS: '#ffc94a',
    smoke: '#4a4352', smokeS: '#2e2936', smokeH: '#6e6578', dead: '#8a8294', deadS: '#5c5668', deadH: '#b4aec0', glass: '#17121d', glassS: '#0e0a13', glassH: '#2a2234', wax: '#fff3d6', waxS: '#d9bf8c'
  };
  // ojos por fase: F1 brasa, F2 violeta (Pastor), F3 naranja (Karceron), F4 turquesa (Letea), F5 azul hielo (Yarlak), F6 ambar (Melaria), F7 blanco-amarillo. Nunca rojo
  var EYE = [['#ffa04a', '#ffe0a8', '255,160,74'], ['#c88aff', '#f0dcff', '200,138,255'], ['#ff9a3a', '#ffe0b0', '255,154,58'], ['#4ff0d0', '#d8fff6', '79,240,208'],
    ['#bfe4ff', '#ffffff', '191,228,255'], ['#ffd24a', '#fff6c0', '255,210,74'], ['#fff6c0', '#ffffff', '255,246,192']];
  // colores de los 5 jefes originales (puntas de la corona) y del cierre; eslabones 1-6 de la cadena
  var LINKC = ['#b07cff', '#ff8a30', '#34e0c0', '#b8e0ff', '#ffc23a', '#ffffff'];
  var TIPC = [LINKC[0], LINKC[1], LINKC[2], LINKC[3], LINKC[4]];
  var PHC = ['255,150,60', '200,138,255', '255,140,40', '79,240,208', '191,228,255', '255,210,74', '255,242,176'];
  A.CENIZAR_LINK_COLORS = LINKC.slice();

  // ================================================================= SPRITES
  function ashSpeckle(v, seed, n, w, h) {
    var x = v.ctx, i;
    for (i = 0; i < n; i++) { var px = pr(seed + i) * w, py = pr(seed + i + 50) * h, r = 0.5 + pr(seed + i + 90) * 1.3; x.fillStyle = i % 3 ? 'rgba(92,84,104,0.5)' : 'rgba(14,10,18,0.35)'; x.beginPath(); x.arc(px, py, r, 0, TAU); x.fill(); }
  }
  function emberLine(v, pts, w, f) {   // grieta/costilla de brasa: oscuro + brasa + brillo
    var x = v.ctx, i, col = f === 1 ? C.coreS : (f === 3 ? '#8a8294' : C.ember), hi = f === 1 ? '#ffffff' : (f === 3 ? '#c8c2d2' : C.emberH);
    [[w + 1.6, OLC], [w, col], [Math.max(0.4, w * 0.36), hi]].forEach(function (s) {
      x.strokeStyle = s[1]; x.lineWidth = s[0]; x.lineCap = 'round'; x.beginPath(); x.moveTo(pts[0][0], pts[0][1]);
      for (i = 1; i < pts.length - 1; i++) x.quadraticCurveTo(pts[i][0], pts[i][1], (pts[i][0] + pts[i + 1][0]) / 2, (pts[i][1] + pts[i + 1][1]) / 2);
      x.lineTo(pts[pts.length - 1][0], pts[pts.length - 1][1]); x.stroke();
    });
  }

  // ---- torso: 112x96 (final 224x192). Centro (56,48). 0 idle, 1 rugido, 2 ventana abierta (pecho abierto), 3 dano
  // zocalos: Nucleo (76,40) y Corazon de Ceniza (50,64) [base]. Costillas de brasa; hombreras con punta.
  var SOCK_N = [76, 40], SOCK_C = [50, 64];
  function torsoDraw(f) {
    return function (v) {
      var x = v.ctx, i, P = [[56, 6], [84, 9], [104, 22], [106, 42], [92, 60], [80, 84], [56, 93], [32, 84], [20, 60], [6, 42], [8, 22], [28, 9]], S = Pclosed(P);
      // hombreras (puntas de ceniza) detras
      v.part(Ppoly([[12, 26], [4, 4], [28, 14]]), C.ash, { lw: 1.6, sh: C.ashS, hi: C.ashH, so: 0.8 }); v.part(Ppoly([[100, 26], [108, 4], [84, 14]]), C.ash, { lw: 1.6, sh: C.ashS, hi: C.ashH, so: 0.8 });
      v.dot(5.4, 6.4, 1.6, f === 1 ? C.coreS : C.ember); v.dot(106.6, 6.4, 1.6, f === 1 ? C.coreS : C.ember);
      v.part(S, f === 3 ? '#4c4658' : C.ash, { lw: LW, sh: C.ashS, hi: C.ashH, so: 2.8 });
      x.save(); x.beginPath(); S(x); x.clip();
      ashSpeckle(v, 5 + f, 34, 112, 96);
      x.fillStyle = 'rgba(16,10,22,0.3)'; x.beginPath(); x.ellipse(60, 92, 48, 14, 0, 0, TAU); x.fill();
      x.strokeStyle = 'rgba(16,10,22,0.6)'; x.lineWidth = 0.9; x.lineCap = 'round';
      for (i = 0; i < 9; i++) { var kx = 10 + pr(i + 70) * 92, ky = 10 + pr(i + 80) * 70; x.beginPath(); x.moveTo(kx, ky); x.lineTo(kx + 3 + pr(i) * 4, ky + 4 + pr(i + 3) * 5); x.lineTo(kx + 1, ky + 11); x.stroke(); }
      // pecho abierto: cavidad oscura con luz
      if (f === 2) {
        x.fillStyle = '#100a14'; x.beginPath(); x.ellipse(56, 46, 17, 28, 0, 0, TAU); x.fill();
        var g = x.createRadialGradient(54, 62, 2, 54, 54, 28); g.addColorStop(0, 'rgba(255,242,176,0.95)'); g.addColorStop(0.45, 'rgba(255,150,40,0.7)'); g.addColorStop(1, 'rgba(255,106,26,0)'); x.fillStyle = g; x.beginPath(); x.ellipse(56, 46, 17, 28, 0, 0, TAU); x.fill();
        x.strokeStyle = OLC; x.lineWidth = 2.2; x.beginPath(); x.ellipse(56, 46, 17, 28, 0, 0, TAU); x.stroke();
      }
      x.restore();
      // costillas de brasa
      var gap = f === 2 ? 20 : 0;
      for (i = 0; i < 4; i++) {
        var yy = 22 + i * 10;
        [-1, 1].forEach(function (sd) {
          var x0 = 56 + sd * (gap || 3), x1 = 56 + sd * (34 - i * 4);
          emberLine(v, [[x0, yy - (gap ? 0 : 1)], [56 + sd * (gap ? 28 : 18), yy - 6], [x1, yy + 7]], 1.9, f);
        });
      }
      if (!gap) emberLine(v, [[56, 14], [56, 40], [56, 66]], 1.7, f);
      // zocalos de las dos piezas del pecho
      [SOCK_N, SOCK_C].forEach(function (s, k) { v.part(Pcirc(s[0], s[1], 11.4), '#120c17', { lw: 1.4, sh: '#0a0610', so: 0.5 }); x.strokeStyle = f === 3 ? C.deadS : C.emberS; x.lineWidth = 1; x.beginPath(); x.arc(s[0], s[1], 9.6, 0, TAU); x.stroke(); });
      if (f === 3) { x.strokeStyle = '#ffffff'; x.lineWidth = 1.2; x.beginPath(); x.moveTo(30, 12); x.lineTo(40, 26); x.lineTo(33, 40); x.lineTo(44, 58); x.moveTo(84, 14); x.lineTo(76, 30); x.lineTo(88, 44); x.stroke(); }
    };
  }
  addV('boss_cenizar_torso', 112, 96, [0, 1, 2, 3].map(torsoDraw), { lw: LW }, { idle: { f: [0], fps: 1 }, roar: { f: [1], fps: 1 }, open: { f: [2], fps: 1 }, hurt: { f: [3], fps: 1 } });

  // ---- cabeza: 48x48 (final 96). Mira a la DERECHA. Corona de CINCO puntas (puntas sin color: el color de cada jefe y su encendido los pone el compuesto).
  // 0 neutra, 1 rugido (mandibula abierta), 2 herida, 3 abatida (ojos en X). Visor (25,26); puntas en (6,7) (14,3) (24,0.5) (34,3) (42,7)
  var TIPS = [[6, 7], [14, 3], [24, 0.8], [34, 3], [42, 7]];
  function headDraw(f) {
    return function (v) {
      var x = v.ctx, i, jaw = f === 1 ? 5 : 0;
      for (i = 0; i < 5; i++) {   // corona
        var tp = TIPS[i], bx = 9 + i * 7.5;
        v.part(Ppoly([[bx - 3.6, 15], [tp[0], tp[1]], [bx + 3.6, 15]]), C.ash, { lw: 1.4, sh: C.ashS, hi: C.ashH, so: 0.6 });
        v.line(bx, 14, tp[0] + (bx - tp[0]) * 0.3, tp[1] + 4, 0.7, f === 3 ? C.deadS : C.emberS);
      }
      v.part(Pblob(24, 27, 15.4, 15, 1101, 0.035, 11), C.ash, { lw: LW, sh: C.ashS, hi: C.ashH, so: 1.8 });
      x.save(); x.beginPath(); Pblob(24, 27, 15.4, 15, 1101, 0.035, 11)(x); x.clip(); ashSpeckle(v, 130 + f, 14, 48, 48); x.restore();
      v.part(Ppoly([[12, 34], [36, 34], [32, 45 + jaw], [16, 45 + jaw]]), C.ashS, { lw: 1.5, sh: C.ashD, hi: C.ash, so: 0.5 });
      if (f === 1) { x.fillStyle = '#10080e'; x.beginPath(); x.moveTo(14, 36); x.lineTo(34, 36); x.lineTo(31, 43); x.lineTo(17, 43); x.closePath(); x.fill(); var g = x.createLinearGradient(0, 36, 0, 46); g.addColorStop(0, 'rgba(255,200,90,0.9)'); g.addColorStop(1, 'rgba(255,106,26,0.5)'); x.fillStyle = g; x.fillRect(16, 37, 16, 5); }
      else emberLine(v, [[14, 37], [19, 39], [24, 37], [29, 39], [34, 37]], 1.1, f);
      v.part(Pblob(25, 26, 13.4, 5.4, 1102, 0.03, 9), '#0d0812', { lw: 1.3, sh: '#07040a', so: 0.4 });   // visor/cuenca (el color lo pone boss_cenizar_eyes)
      if (f === 2) { x.strokeStyle = '#ffffff'; x.lineWidth = 0.9; x.beginPath(); x.moveTo(30, 13); x.lineTo(27, 20); x.lineTo(31, 26); x.lineTo(28, 33); x.stroke(); }
      if (f === 3) { x.strokeStyle = C.emberH; x.lineWidth = 1.3; x.lineCap = 'round'; x.beginPath(); [[17, 24], [26, 29], [26, 24], [17, 29]].forEach(function (p, k) { x.moveTo(p[0], p[1]); }); x.stroke(); }
    };
  }
  addV('boss_cenizar_head', 48, 48, [0, 1, 2, 3].map(headDraw), { lw: LW }, { idle: { f: [0], fps: 1 }, roar: { f: [1], fps: 1 }, hurt: { f: [2], fps: 1 }, down: { f: [3], fps: 1 } });
  A.CENIZAR_TIPS = TIPS.map(function (p) { return [p[0] * 2, p[1] * 2]; });   // puntas de la corona en px finales dentro de boss_cenizar_head

  // ---- ojos: 24x10 (final 48x20). 0..6 uno por fase. Dos ojos oblicuos con nucleo claro
  function eyesDraw(f) {
    var c = EYE[f];
    return function (v) {
      var x = v.ctx;
      [7, 17.4].forEach(function (cx, k) {
        v.part(Pblob(cx, 5 + (k ? 0.3 : -0.3), 5, 2.7, 1110 + f * 3 + k, 0.03, 9, k ? 0.28 : -0.28), c[0], { lw: 0.8, ol: '#0d0812', sh: c[2] ? 'rgba(' + c[2] + ',0.55)' : c[0], hi: c[1], so: 0.5 });
        x.fillStyle = c[1]; x.beginPath(); x.ellipse(cx + (k ? 0.8 : 1), 5, 1.9, 0.9, 0, 0, TAU); x.fill();
      });
    };
  }
  addV('boss_cenizar_eyes', 24, 10, [0, 1, 2, 3, 4, 5, 6].map(eyesDraw), { lw: 0.6 }, { phase1: { f: [0], fps: 1 }, phase2: { f: [1], fps: 1 }, phase3: { f: [2], fps: 1 }, phase4: { f: [3], fps: 1 }, phase5: { f: [4], fps: 1 }, phase6: { f: [5], fps: 1 }, phase7: { f: [6], fps: 1 } });

  // ---- brazos: 40x64 (final 80x128). Pivote del hombro (20,8) base = (40,16) final; mano en (20,56) base. 0 reposo, 1 ataque (mano abierta, garras), 2 roto (agrietado, apagado)
  function armDraw(f, far) {
    return function (v) {
      var x = v.ctx, i, col = far ? '#2e2836' : C.ash, sh = far ? C.ashD : C.ashS, dead = f === 2;
      v.part(Ppoly([[12, 8], [28, 8], [31, 30], [27, 48], [13, 48], [9, 30]]), col, { lw: LW * 0.9, sh: sh, hi: far ? C.ashS : C.ashH, so: 1.4 });
      v.part(Pblob(20, 9, 10, 7, 1120 + f, 0.05, 8), col, { lw: 1.7, sh: sh, hi: far ? C.ashS : C.ashH, so: 0.8 });   // hombro
      x.save(); x.beginPath(); Ppoly([[12, 8], [28, 8], [31, 30], [27, 48], [13, 48], [9, 30]])(x); x.clip(); ashSpeckle(v, 160 + f, 8, 40, 60); x.restore();
      emberLine(v, [[18, 14], [21, 26], [18, 38]], 1.4, dead ? 3 : 0);
      if (dead) { x.strokeStyle = '#ffffff'; x.lineWidth = 1; x.beginPath(); x.moveTo(14, 20); x.lineTo(22, 28); x.lineTo(16, 36); x.stroke(); }
      // mano con garras
      var sp = f === 1 ? 7 : 3.4;
      v.part(Pblob(20, 51, 8.6, 6, 1125 + f, 0.06, 8), col, { lw: 1.6, sh: sh, hi: far ? C.ashS : C.ashH, so: 0.8 });
      for (i = 0; i < 3; i++) { var fx = 20 + (i - 1) * sp; v.part(Ppoly([[fx - 2.2, 54], [fx + (i - 1) * (f === 1 ? 1.6 : 0.4), 63], [fx + 2.2, 54]]), dead ? C.deadS : C.ashH, { lw: 1.2, sh: sh, so: 0.3 }); }
      if (f === 1) { v.dot(20, 55, 2.2, C.emberH); }
    };
  }
  addV('boss_cenizar_arm_l', 40, 64, [armDraw(0, true), armDraw(1, true), armDraw(2, true)], { lw: LW }, { rest: { f: [0], fps: 1 }, attack: { f: [1], fps: 1 }, broken: { f: [2], fps: 1 } });
  addV('boss_cenizar_arm_r', 40, 64, [armDraw(0, false), armDraw(1, false), armDraw(2, false)], { lw: LW }, { rest: { f: [0], fps: 1 }, attack: { f: [1], fps: 1 }, broken: { f: [2], fps: 1 } });

  // ---- capa de humo: 96x64 (final 192x128). 4 frames de ondulacion; arrastra hacia la IZQUIERDA (detras del jefe); hombros arriba a la derecha
  function cloakDraw(f) {
    return function (v) {
      var x = v.ctx, i, ph = f * PI / 2, pts = [[80, 4], [92, 14], [84, 32]], k;
      for (i = 0; i < 6; i++) { var a = i / 5; pts.push([70 - a * 56 + sin(ph + i * 1.3) * 3, 42 + 14 * (1 - Math.abs(a - 0.45)) + sin(ph * 1 + i * 2) * 3 + (i % 2) * 5]); }
      pts.push([6 + sin(ph) * 3, 36 + sin(ph + 1) * 3]); pts.push([14, 18]); pts.push([40, 6]);
      v.part(Pclosed(pts), C.smoke, { lw: LW * 0.9, sh: C.smokeS, hi: C.smokeH, so: 2.2 });
      x.save(); x.beginPath(); Pclosed(pts)(x); x.clip();
      for (k = 0; k < 4; k++) { x.strokeStyle = k % 2 ? 'rgba(110,101,120,0.5)' : 'rgba(30,24,38,0.4)'; x.lineWidth = 1.6; x.beginPath(); x.moveTo(78 - k * 14, 8); x.quadraticCurveTo(66 - k * 16 + sin(ph + k) * 4, 30, 54 - k * 13 + sin(ph + k + 1) * 5, 56); x.stroke(); }
      x.restore();
      for (i = 0; i < 5; i++) { var ex = 10 + pr(i + 140 + f) * 62, ey = 30 + pr(i + 150 + f) * 26; v.dot(ex, ey, 0.8 + pr(i) * 0.7, i % 2 ? C.emberH : C.ember); }
    };
  }
  addV('boss_cenizar_cloak', 96, 64, [0, 1, 2, 3].map(cloakDraw), { lw: LW }, { sway: { f: [0, 1, 2, 3], fps: 5 } });

  // ---- RELIQUIAS: 3 frames c/u (0 activa, 1 apagada [gris, invulnerable], 2 rota). Tamanos base: cayado 20x36, nucleo 28x28, ojo 20x16, colmillo 20x32, corona 32x24
  var RELICS = ['cayado', 'nucleo', 'ojo', 'colmillo', 'corona'];
  var RELIC_SIZE = { cayado: [20, 36], nucleo: [28, 28], ojo: [20, 16], colmillo: [20, 32], corona: [32, 24] };
  var RELIC_PHASE = { cayado: 2, nucleo: 3, ojo: 4, colmillo: 5, corona: 6 };
  var RELIC_LINK = { cayado: 1, nucleo: 2, ojo: 3, colmillo: 4, corona: 5 };
  function relicDraw(kind, st) {   // st 0 activa, 1 apagada, 2 rota
    var off = st === 1, brk = st === 2;
    return function (v) {
      var x = v.ctx, i;
      function pal(a, aS, aH) { return off ? [C.dead, C.deadS, C.deadH] : [a, aS, aH]; }
      if (kind === 'cayado') {   // baculo retorcido con curva de pastor; 20x36
        var p = pal('#8a5a34', '#5a3418', '#c08a56'), glow = off ? C.deadH : C.emberH;
        if (brk) {
          v.stick([[10, 34], [10.6, 26], [9.6, 21]], 3.4, '#6a4222', { lw: 1.4, hi: '#a87244' }); v.part(Ppoly([[7.6, 21], [10, 19], [12.6, 21.4], [11, 23.4], [9, 22.4]]), '#a87244', { lw: 1, so: 0.2 });
          v.stick([[3.4, 5.6], [5, 8], [6.4, 13]], 2.8, '#6a4222', { lw: 1.2, hi: '#a87244' }); v.dot(5, 8, 1, C.emberH); return;
        }
        v.stick([[10, 35], [10.8, 24], [9.6, 14], [9.4, 7]], 3.4, p[0], { lw: 1.4, hi: p[2], curve: true });
        v.stick([[9.4, 7], [10.4, 2.6], [14.6, 2.2], [16.2, 6], [14.2, 9.6]], 3, p[0], { lw: 1.4, hi: p[2], curve: true });
        for (i = 0; i < 3; i++) v.line(7.8, 14 + i * 5, 12.4, 12.6 + i * 5, 1, off ? C.deadS : C.emberS);
        v.dot(14.2, 9.4, 2.1, glow); if (!off) { v.dot(13.8, 9, 1, '#ffffff'); v.line(10, 20, 10.4, 30, 0.8, C.ember); }
      } else if (kind === 'nucleo') {   // esfera de brasas en pecho; 28x28
        if (brk) {
          [[8, 9, 6], [19, 8, 5], [9, 19, 5], [20, 19, 6]].forEach(function (s, k) { v.part(Ppoly([[s[0] - s[2], s[1]], [s[0], s[1] - s[2] * 0.9], [s[0] + s[2], s[1] + 1], [s[0] - 1, s[1] + s[2]]]), C.ashS, { lw: 1.3, sh: C.ashD, hi: C.ashH, so: 0.4 }); v.dot(s[0], s[1], 1.4, C.ember); });
          return;
        }
        var q = pal(C.ember, C.emberS, C.emberH);
        v.part(Pblob(14, 14, 11.4, 11.4, 1201, 0.04, 11), off ? C.deadS : C.ashS, { lw: LW, sh: C.ashD, hi: off ? C.dead : C.ashH, so: 1.2 });
        v.part(Pblob(14, 14, 8.6, 8.6, 1202, 0.05, 9), q[0], { lw: 1.2, sh: q[1], hi: q[2], so: 0.9 });
        if (!off) { v.part(Pblob(13.4, 13.4, 4.6, 4.6, 1203, 0.05, 8), C.core, { lw: 0.9, ol: C.coreS, sh: C.coreS, hi: '#ffffff', so: 0.4 }); v.dot(12.4, 12.2, 1.3, '#ffffff'); }
        else { x.strokeStyle = C.deadH; x.lineWidth = 0.8; x.beginPath(); x.moveTo(9, 10); x.lineTo(14, 15); x.lineTo(12, 20); x.stroke(); }
        for (i = 0; i < 6; i++) { var a = i * PI / 3 + 0.3; v.part(Ppoly([[14 + cos(a - 0.2) * 11, 14 + sin(a - 0.2) * 11], [14 + cos(a) * 14, 14 + sin(a) * 14], [14 + cos(a + 0.2) * 11, 14 + sin(a + 0.2) * 11]]), off ? C.deadS : C.ashH, { lw: 0.9, so: 0.2 }); }
      } else if (kind === 'ojo') {   // Ojo del Olvido; 20x16
        var po = pal('#4ff0d0', '#1c8a90', '#d8fff6');
        if (brk) {
          v.part(Ppoly([[2, 8], [7, 3], [10, 9], [6, 12]]), C.deadS, { lw: 1.3, sh: C.ashD, hi: C.dead, so: 0.4 }); v.part(Ppoly([[11, 9], [14, 3], [18, 8], [13, 13]]), C.deadS, { lw: 1.3, sh: C.ashD, hi: C.dead, so: 0.4 });
          v.dot(10, 8, 1.4, '#4ff0d0'); x.strokeStyle = OLC; x.lineWidth = 1.2; x.beginPath(); x.moveTo(9, 2); x.lineTo(10.4, 8); x.lineTo(8.6, 14); x.stroke(); return;
        }
        v.part(Ppoly([[1, 8], [6, 2.6], [14, 2.6], [19, 8], [14, 13.4], [6, 13.4]]), off ? C.deadS : '#1b3b40', { lw: LW * 0.8, sh: C.ashD, hi: off ? C.dead : '#3a8088', so: 0.9 });
        if (!off) { v.part(Pcirc(10, 8, 4.4), po[0], { lw: 1, ol: '#0e2a30', sh: po[1], hi: po[2], so: 0.6 }); v.part(Prr(9.2, 4.8, 1.6, 6.4, 0.7), '#071418', { lw: 0.3, so: 0 }); v.dot(8.6, 6.6, 1, '#ffffff'); for (i = 0; i < 3; i++) v.dot(4 + i * 6, 14.6 + (i % 2) * 0.4, 0.9, po[0]); }
        else { x.strokeStyle = OLC; x.lineWidth = 1.4; x.beginPath(); x.moveTo(3.4, 8.4); x.quadraticCurveTo(10, 11.4, 16.6, 8.4); x.stroke(); }
      } else if (kind === 'colmillo') {   // colmillo glacial; 20x32 (apunta arriba)
        var pc = pal('#bfe4ff', '#6aa6d6', '#ffffff');
        if (brk) {
          v.part(Ppoly([[4, 31], [5, 22], [10, 18], [15, 23], [16, 31]]), pc[0], { lw: 1.5, sh: pc[1], hi: pc[2], so: 0.7 });
          v.part(Ppoly([[2, 12], [6, 7], [8, 14], [4, 15]]), pc[0], { lw: 1.2, sh: pc[1], hi: pc[2], so: 0.4 }); v.part(Ppoly([[13, 8], [17, 14], [12, 15]]), pc[0], { lw: 1.2, sh: pc[1], so: 0.3 }); return;
        }
        v.part(Ppoly([[3, 31], [5, 14], [10, 1], [15, 14], [17, 31]]), pc[0], { lw: LW * 0.85, sh: pc[1], hi: pc[2], so: 1.3 });
        v.part(Ppoly([[3, 31], [17, 31], [16, 26], [4, 26]]), off ? C.deadS : C.ashS, { lw: 1.3, sh: C.ashD, hi: C.ashH, so: 0.4 });
        v.line(9, 22, 10, 7, 0.9, off ? C.deadH : '#ffffff'); if (!off) { v.line(12.4, 24, 12.8, 14, 0.5, '#6aa6d6'); }
      } else {   // corona de cera; 32x24
        var pw = pal(C.wax, C.waxS, '#ffffff');
        if (brk) {
          v.part(Ppoly([[4, 22], [4.6, 15], [9, 17.6], [11, 12], [14, 16.4], [17, 12.4], [20, 17], [24, 14.6], [28, 22]]), pw[0], { lw: 1.6, sh: pw[1], hi: pw[2], so: 0.8 });
          v.part(Pblob(16, 17, 3.6, 2, 1210, 0.06, 7), '#e8a640', { lw: 1, sh: '#a8661a', so: 0.3 }); v.part(Ppoly([[14.6, 17.6], [17.4, 17.6], [17, 22], [15, 22]]), '#f0a63a', { lw: 0.8, so: 0 }); return;
        }
        v.part(Ppoly([[3, 22], [2, 6], [8.6, 13], [12, 3], [16, 11.6], [20, 3], [23.4, 13], [30, 6], [29, 22]]), pw[0], { lw: LW * 0.85, sh: pw[1], hi: pw[2], so: 1 });
        v.part(Ppoly([[3.2, 18], [28.8, 18], [29, 23], [3, 23]]), off ? C.deadS : '#c88a2c', { lw: 1.3, sh: off ? C.ashD : '#8a5a12', hi: off ? C.dead : '#f0c050', so: 0.6 });
        [[2, 6], [12, 3], [20, 3], [30, 6]].forEach(function (pt, k) { v.dot(pt[0], pt[1] - 1, 1.5, off ? C.deadH : '#ffd24a'); if (!off) { v.part(Ppoly([[pt[0] - 1.1, pt[1] - 2], [pt[0], pt[1] - 5.4], [pt[0] + 1.1, pt[1] - 2]]), C.emberH, { lw: 0.6, so: 0 }); } });
        v.part(Pblob(16, 14, 2.4, 2.8, 1211, 0.05, 8), off ? C.deadH : '#ff9a3a', { lw: 0.9, sh: off ? C.deadS : C.emberS, hi: '#fff', so: 0.4 });
      }
    };
  }
  RELICS.forEach(function (k) {
    addV('reliq_' + k, RELIC_SIZE[k][0], RELIC_SIZE[k][1], [relicDraw(k, 0), relicDraw(k, 1), relicDraw(k, 2)], { lw: LW }, { active: { f: [0], fps: 1 }, off: { f: [1], fps: 1 }, broken: { f: [2], fps: 1 } });
  });

  // ---- Corazon de Ceniza: 28x28 (final 56). 0 latido (2 sub-estados via animFrame), 1 expuesto (blanco, grande), 2 roto (hueco con una brasa)
  function coreDraw(f) {
    return function (v) {
      var x = v.ctx, i;
      if (f === 2) {
        v.part(Pblob(14, 14, 11, 11, 1220, 0.05, 10), '#100a14', { lw: 1.6, sh: '#08040a', so: 0.4 });
        x.strokeStyle = C.emberS; x.lineWidth = 1; x.beginPath(); x.arc(14, 14, 9, 0.4, 3.0); x.stroke();
        [[8, 8], [20, 9], [19, 20], [9, 19]].forEach(function (p, k) { v.part(Ppoly([[p[0] - 3, p[1]], [p[0], p[1] - 3], [p[0] + 3, p[1] + 1]]), C.ashS, { lw: 1, so: 0.2 }); }); v.dot(14, 15, 1.8, C.ember); v.dot(13.6, 14.4, 0.8, C.core); return;
      }
      var big = f === 1;
      x.fillStyle = big ? 'rgba(255,255,230,0.55)' : 'rgba(255,170,60,0.4)'; x.beginPath(); x.arc(14, 14, big ? 13.6 : 12.4, 0, TAU); x.fill();
      v.part(Pblob(14, 14, big ? 10.8 : 9.4, big ? 10.8 : 9.4, 1221 + f, 0.05, 10), big ? '#fffbe0' : C.ember, { lw: LW * 0.85, ol: big ? C.coreS : OLC, sh: big ? C.coreS : C.emberS, hi: big ? '#ffffff' : C.emberH, so: 1.1 });
      v.part(Pblob(13.4, 13.4, big ? 6.6 : 5, big ? 6.6 : 5, 1223 + f, 0.05, 9), big ? '#ffffff' : C.core, { lw: 0.8, ol: C.coreS, sh: C.coreS, hi: '#ffffff', so: 0.5 });
      for (i = 0; i < 8; i++) { var a = i * PI / 4 + 0.2, r0 = big ? 11 : 10, r1 = big ? 14 : 12; v.line(14 + cos(a) * r0, 14 + sin(a) * r0, 14 + cos(a) * r1, 14 + sin(a) * r1, 1.2, big ? '#fff6c0' : C.emberH); }
      v.dot(11.6, 11.4, 1.5, '#ffffff');
    };
  }
  addV('boss_cenizar_core', 28, 28, [0, 1, 2].map(coreDraw), { lw: LW }, { beat: { f: [0], fps: 1 }, exposed: { f: [1], fps: 1 }, broken: { f: [2], fps: 1 } });

  // ---- retrato 48x48 (final 96): 0 neutro, 1 furia (ojos F7, brillo), 2 herido
  function portraitDraw(f) {
    return function (v) {
      var x = v.ctx, hot = f === 1, i;
      v.part(Prr(1.4, 1.4, 45.2, 45.2, 6), hot ? '#4a1c0c' : '#241a2c', { lw: 2, ol: OLC, sh: '#120c18', so: 1.4 });
      x.save(); x.beginPath(); Prr(2.4, 2.4, 43.2, 43.2, 5)(x); x.clip();
      var g = x.createRadialGradient(24, 30, 2, 24, 28, 32); g.addColorStop(0, hot ? 'rgba(255,230,150,0.8)' : 'rgba(255,120,40,0.5)'); g.addColorStop(1, 'rgba(0,0,0,0)'); x.fillStyle = g; x.fillRect(0, 0, 48, 48);
      for (i = 0; i < 9; i++) { x.fillStyle = i % 2 ? 'rgba(255,160,70,0.6)' : 'rgba(255,230,160,0.7)'; x.fillRect(4 + pr(i + 300) * 40, 4 + pr(i + 310) * 38, 1.4, 1.4); }
      var ts = A.sprite('boss_cenizar_torso', f === 2 ? 3 : (hot ? 1 : 0)), hs = A.sprite('boss_cenizar_head', f === 2 ? 2 : (hot ? 1 : 0)), es = A.sprite('boss_cenizar_eyes', hot ? 6 : 0);
      x.drawImage(ts, -10, 24, ts.width / 2 * 0.8, ts.height / 2 * 0.8);
      x.drawImage(hs, 3, 2, hs.width / 2 * 0.86, hs.height / 2 * 0.86);
      if (f !== 2) x.drawImage(es, 3 + 13 * 0.86, 2 + 21 * 0.86, es.width / 2 * 0.86, es.height / 2 * 0.86);
      x.restore();
      for (i = 0; i < 5; i++) { var tp = TIPS[i]; v.dot(3 + tp[0] * 0.86, 2 + tp[1] * 0.86 + 0.6, 1.5, TIPC[i]); }
      v.part(Prr(1.4, 1.4, 45.2, 45.2, 6), 'rgba(0,0,0,0)', { lw: 2, ol: OLC });
      x.strokeStyle = hot ? '#ffe9a0' : C.ember; x.lineWidth = 0.9; x.beginPath(); Prr(3.2, 3.2, 41.6, 41.6, 4.4)(x); x.stroke();
    };
  }
  addV('boss_cenizar_portrait', 48, 48, [0, 1, 2].map(portraitDraw), { lw: LW }, { neutral: { f: [0], fps: 1 }, rage: { f: [1], fps: 1 }, hurt: { f: [2], fps: 1 } });
  H.reg['boss_incendio_portrait'] = H.reg['boss_cenizar_portrait'];   // alias: drawBossPortrait('incendio')

  // ---- glifos de la cadena: 32x32 base (final 64). 0-5 activos (1-6), 6-11 ejecutados (1-6). Anillo del color del jefe original; numero grande
  var NUMS = { 1: [[0.5, 0.15, 0.5, 0.85]], 2: [[0.18, 0.28, 0.5, 0.12, 0.82, 0.28, 0.2, 0.85, 0.85, 0.85]], 3: [[0.2, 0.15, 0.8, 0.15, 0.5, 0.48, 0.82, 0.68, 0.5, 0.88, 0.18, 0.8]], 4: [[0.7, 0.88, 0.7, 0.12, 0.16, 0.64, 0.86, 0.64]], 5: [[0.8, 0.14, 0.24, 0.14, 0.2, 0.46, 0.6, 0.42, 0.84, 0.66, 0.6, 0.88, 0.18, 0.8]], 6: [[0.78, 0.18, 0.4, 0.14, 0.2, 0.5, 0.22, 0.8, 0.52, 0.9, 0.8, 0.72, 0.6, 0.5, 0.24, 0.58]] };
  function drawNum(x, n, cx, cy, s, col, lw, ol) {   // numero 1-6 con trazos (sin fuentes)
    var pts = NUMS[n][0], i; x.save(); x.lineCap = 'round'; x.lineJoin = 'round';
    [[lw + 1.8, ol], [lw, col]].forEach(function (pass) {
      x.strokeStyle = pass[1]; x.lineWidth = pass[0]; x.beginPath();
      if (n === 2 || n === 3 || n === 5 || n === 6) {
        x.moveTo(cx + (pts[0] - 0.5) * s, cy + (pts[1] - 0.5) * s);
        for (i = 2; i < pts.length - 2; i += 2) x.quadraticCurveTo(cx + (pts[i] - 0.5) * s, cy + (pts[i + 1] - 0.5) * s, cx + ((pts[i] + pts[i + 2]) / 2 - 0.5) * s, cy + ((pts[i + 1] + pts[i + 3]) / 2 - 0.5) * s);
        x.lineTo(cx + (pts[pts.length - 2] - 0.5) * s, cy + (pts[pts.length - 1] - 0.5) * s);
      } else { x.moveTo(cx + (pts[0] - 0.5) * s, cy + (pts[1] - 0.5) * s); for (i = 2; i < pts.length; i += 2) x.lineTo(cx + (pts[i] - 0.5) * s, cy + (pts[i + 1] - 0.5) * s); }
      x.stroke();
    });
    x.restore();
  }
  function glyphDraw(n, done) {
    return function (v) {
      var x = v.ctx, col = LINKC[n - 1], i;
      x.fillStyle = done ? 'rgba(40,34,48,0.8)' : 'rgba(20,12,28,0.78)'; x.beginPath(); x.arc(16, 16, 14, 0, TAU); x.fill();
      x.strokeStyle = OLC; x.lineWidth = 4; x.beginPath(); x.arc(16, 16, 14, 0, TAU); x.stroke();
      x.strokeStyle = done ? '#7a7284' : col; x.lineWidth = 2.2; x.beginPath(); x.arc(16, 16, 14, 0, TAU); x.stroke();
      if (!done) for (i = 0; i < 8; i++) { var a = i * PI / 4; v.dot(16 + cos(a) * 14, 16 + sin(a) * 14, 1.2, '#ffffff'); }
      drawNum(x, n, 16, 16.4, 14, done ? '#8a8294' : '#ffffff', 2.2, OLC);
      if (done) { x.strokeStyle = 'rgba(255,255,255,0.35)'; x.lineWidth = 1; x.beginPath(); x.moveTo(6, 26); x.lineTo(26, 6); x.stroke(); }
    };
  }
  var GLY = [], GA = { };
  [0, 1].forEach(function (d) { for (var n = 1; n <= 6; n++) GLY.push(glyphDraw(n, d)); });
  for (var gi = 1; gi <= 6; gi++) { GA['g' + gi] = { f: [gi - 1], fps: 1 }; GA['d' + gi] = { f: [gi + 5], fps: 1 }; }
  addV('fx_cenizar_glyph', 32, 32, GLY, { lw: 1 }, GA);

  // ---- contorno fantasma de eslabon (generico, para escalar): 64x64 base, anillo punteado con cuatro marcas
  addV('fx_chain_ghost', 64, 64, [function (v) {
    var x = v.ctx, i; x.strokeStyle = 'rgba(27,17,36,0.6)'; x.lineWidth = 4; x.beginPath(); x.arc(32, 32, 28, 0, TAU); x.stroke();
    x.strokeStyle = 'rgba(255,255,255,0.9)'; x.lineWidth = 2; x.setLineDash([6, 5]); x.beginPath(); x.arc(32, 32, 28, 0, TAU); x.stroke(); x.setLineDash([]);
    for (i = 0; i < 4; i++) { var a = i * PI / 2 + PI / 4; v.line(32 + cos(a) * 24, 32 + sin(a) * 24, 32 + cos(a) * 31, 32 + sin(a) * 31, 2, '#ffffff'); }
  }], { lw: 1 });

  // ---- trofeos 16x16 (final 32): 0 normal, 1 ROTO/sin conseguir (gris con aspa roja). 6 trofeos + Insignia 11
  function trophyDraw(kind, broken) {
    return function (v) {
      var x = v.ctx, sp, s;
      v.part(Prr(1, 1, 14, 14, 3), '#2a1c30', { lw: 1.2, sh: '#120c18', so: 0.5 });
      x.save(); if (broken) x.globalAlpha = 0.45;
      if (kind === 'core') { sp = A.sprite('boss_cenizar_core', 0); x.drawImage(sp, 2, 2, 12, 12); }
      else { sp = A.sprite('reliq_' + kind, 0); s = Math.min(11 / (sp.width / 2), 11 / (sp.height / 2)); var w = sp.width / 2 * s, h = sp.height / 2 * s; x.drawImage(sp, 8 - w / 2, 8 - h / 2, w, h); }
      x.restore();
      if (broken) { x.strokeStyle = OLC; x.lineWidth = 3.2; x.beginPath(); x.moveTo(3, 3); x.lineTo(13, 13); x.moveTo(13, 3); x.lineTo(3, 13); x.stroke(); x.strokeStyle = '#ff3b30'; x.lineWidth = 1.8; x.stroke(); }
      x.strokeStyle = broken ? '#7a8294' : C.ember; x.lineWidth = 0.7; x.beginPath(); Prr(1.8, 1.8, 12.4, 12.4, 2.6)(x); x.stroke();
    };
  }
  [['cayado', 'cayado'], ['nucleo', 'nucleo'], ['ojo', 'ojo'], ['colmillo', 'colmillo'], ['corona', 'corona'], ['corazon', 'core']].forEach(function (k) {
    addV('trophy_cenizar_' + k[0], 16, 16, [trophyDraw(k[1], false), trophyDraw(k[1], true)], { lw: 1 }, { ok: { f: [0], fps: 1 }, broken: { f: [1], fps: 1 } });
  });
  // Insignia 11 "Brasa Primera": medalla con la brasa y la corona de cinco puntas. 0 conseguida, 1 sin conseguir (silueta gris)
  addV('insignia_brasa_primera', 16, 16, [0, 1].map(function (k) {
    return function (v) {
      var x = v.ctx, i; v.part(Pcirc(8, 8, 6.8), k ? '#4a4452' : '#3a2230', { lw: 1.3, sh: k ? '#2a2630' : '#1c0e18', so: 0.7 });
      x.strokeStyle = k ? '#7a7284' : C.ember; x.lineWidth = 0.8; x.beginPath(); x.arc(8, 8, 5.4, 0, TAU); x.stroke();
      if (k) { x.fillStyle = '#7a7284'; x.font = 'bold 8px monospace'; x.textAlign = 'center'; x.fillText('?', 8, 11); return; }
      for (i = 0; i < 5; i++) { var a = -PI / 2 + (i - 2) * 0.42; v.dot(8 + cos(a) * 4.4, 8 + sin(a) * 4.4 - 0.4, 0.9, TIPC[i]); }
      v.part(Pblob(8, 9.6, 2.8, 2.8, 1301, 0.05, 8), C.ember, { lw: 0.8, sh: C.emberS, hi: C.emberH, so: 0.3 }); v.dot(7.6, 9.2, 1, C.core);
    };
  }), { lw: 1 }, { won: { f: [0], fps: 1 }, locked: { f: [1], fps: 1 } });

  // ================================================================= VFX propios (sprites)
  // Ceniza viva (F1): charco gris de 36x36 base (final 72). 0 recien caida (oscura, brasas), 1 asentada, 2 desvaneciendose. Gris = peligro de suelo (no rojo)
  addV('fx_ash_puddle', 36, 36, [0, 1, 2].map(function (k) {
    return function (v) {
      var x = v.ctx, i, al = [0.95, 0.8, 0.5][k]; x.globalAlpha = al;
      v.part(Pblob(18, 18, 15.6 - k * 0.6, 12.4 - k * 0.5, 1310 + k, 0.1, 12), k === 0 ? '#4a4452' : (k === 1 ? '#6a6272' : '#8a8294'), { lw: 1.6, ol: 'rgba(27,17,36,0.85)', sh: '#2a2430', hi: '#aaa2b8', so: 1.2 });
      v.part(Pblob(18, 18.6, 9.4, 6.8, 1315 + k, 0.1, 9), '#2e2836', { lw: 0, sh: null, so: 0 });
      for (i = 0; i < 6 - k * 2; i++) { var a = pr(i + 320 + k) * TAU, d = 3 + pr(i + 330) * 9; v.dot(18 + cos(a) * d, 18 + sin(a) * d * 0.7, 0.9 + pr(i) * 0.8, k === 0 ? C.emberH : (i % 2 ? '#c8c2d2' : C.ember)); }
      x.globalAlpha = 1;
    };
  }), { lw: 1 }, { fresh: { f: [0], fps: 1 }, settled: { f: [1], fps: 1 }, fade: { f: [2], fps: 1 } });

  // anillo de brasas (oleadas de espinas F2 / hielo-brasa F5): 128x128 base (final 256); radio del anillo ~58 base. 0 reposo punteado, 1 aviso, 2 golpe, 3 disipandose
  addV('fx_ember_ring', 128, 128, [0, 1, 2, 3].map(function (k) {
    return function (v) {
      var x = v.ctx, i, R = 56, N = 28;
      if (k === 1) { x.strokeStyle = 'rgba(255,90,40,0.3)'; x.lineWidth = 9; x.beginPath(); x.arc(64, 64, R, 0, TAU); x.stroke(); }
      if (k === 2) { x.strokeStyle = 'rgba(255,240,210,0.7)'; x.lineWidth = 8; x.beginPath(); x.arc(64, 64, R, 0, TAU); x.stroke(); }
      x.strokeStyle = OLC; x.lineWidth = k === 3 ? 2 : 5; x.beginPath(); x.arc(64, 64, R, 0, TAU); x.stroke();
      x.strokeStyle = [C.emberS, '#ff6a5a', '#ffffff', 'rgba(200,190,210,0.5)'][k]; x.lineWidth = k === 3 ? 1 : 2.4; if (k === 0) x.setLineDash([5, 4]); x.beginPath(); x.arc(64, 64, R, 0, TAU); x.stroke(); x.setLineDash([]);
      for (i = 0; i < N; i++) {
        var a = i / N * TAU, h = (k === 3 ? 2.6 : 5.4 + (i % 2) * 2) * (k === 0 ? 0.7 : 1), jx = k === 3 ? (pr(i + 340) - 0.5) * 12 : 0;
        var bx = 64 + cos(a) * R + jx, by = 64 + sin(a) * R + jx * 0.3;
        v.part(Ppoly([[bx - sin(a) * 2.4, by + cos(a) * 2.4], [bx + cos(a) * h, by + sin(a) * h], [bx + sin(a) * 2.4, by - cos(a) * 2.4]]), k === 2 ? '#fff6c0' : (k === 3 ? '#8a8294' : C.ember), { lw: k === 3 ? 0.6 : 1, sh: k === 2 ? C.coreS : C.emberS, so: 0.3 });
      }
    };
  }), { lw: 1 }, { idle: { f: [0], fps: 1 }, warn: { f: [1], fps: 1 }, hit: { f: [2], fps: 1 }, fade: { f: [3], fps: 1 } });

  // Sol de Cenizar: 128x128 base (final 256). 0 carga pequena, 1 carga grande, 2 pulso (anillo grueso, r ~54), 3 pulso desvaneciendose (r ~60)
  addV('fx_sol_pulse', 128, 128, [0, 1, 2, 3].map(function (k) {
    return function (v) {
      var x = v.ctx, i;
      if (k <= 1) {
        var r = k ? 24 : 14, g = x.createRadialGradient(64, 64, 2, 64, 64, r * 2.2); g.addColorStop(0, 'rgba(255,255,230,0.9)'); g.addColorStop(0.4, 'rgba(255,170,60,0.5)'); g.addColorStop(1, 'rgba(255,106,26,0)'); x.fillStyle = g; x.beginPath(); x.arc(64, 64, r * 2.2, 0, TAU); x.fill();
        for (i = 0; i < 12; i++) { var a = i * PI / 6, r1 = r + 2, r2 = r + (i % 2 ? 7 : 12) + k * 6; v.part(Ppoly([[64 + cos(a - 0.12) * r1, 64 + sin(a - 0.12) * r1], [64 + cos(a) * r2, 64 + sin(a) * r2], [64 + cos(a + 0.12) * r1, 64 + sin(a + 0.12) * r1]]), C.coreS, { lw: 1, sh: C.ember, so: 0.3 }); }
        v.part(Pblob(64, 64, r, r, 1330 + k, 0.03, 12), '#fffbe0', { lw: 2, ol: C.coreS, sh: C.coreS, hi: '#ffffff', so: 1.2 });
        return;
      }
      var R = k === 2 ? 52 : 58, th = k === 2 ? 14 : 8;
      x.strokeStyle = 'rgba(255,170,60,' + (k === 2 ? 0.5 : 0.28) + ')'; x.lineWidth = th + 8; x.beginPath(); x.arc(64, 64, R, 0, TAU); x.stroke();
      x.strokeStyle = OLC; x.lineWidth = th + 3.4; x.beginPath(); x.arc(64, 64, R, 0, TAU); x.stroke();
      x.strokeStyle = k === 2 ? '#fff6c0' : 'rgba(255,230,170,0.85)'; x.lineWidth = th; x.beginPath(); x.arc(64, 64, R, 0, TAU); x.stroke();
      x.strokeStyle = '#ffffff'; x.lineWidth = th * 0.3; x.beginPath(); x.arc(64, 64, R + th * 0.15, 3.6, 5.4); x.stroke();
      for (i = 0; i < 16; i++) { var a2 = i * PI / 8 + 0.1; v.dot(64 + cos(a2) * (R + th * 0.8), 64 + sin(a2) * (R + th * 0.8), 1.3 + (i % 2), C.emberH); }
    };
  }), { lw: 1 }, { charge: { f: [0, 1], fps: 3 }, pulse: { f: [2, 3], fps: 8 } });

  // rotura de Reliquia: 64x64 base (final 128), 5 frames (destello, ondas, esquirlas, humo, cenizas)
  addV('fx_cenizar_shatter', 64, 64, [0, 1, 2, 3, 4].map(function (f) {
    return function (v) {
      var x = v.ctx, i;
      if (f === 0) { v.part(Pblob(32, 32, 15, 15, 1340), '#fff6d0', { lw: 2, ol: C.ember, sh: '#ffe0a0', so: 1 }); return; }
      var rr = [0, 12, 22, 28, 31][f], al = [1, 1, 0.95, 0.7, 0.35][f]; x.globalAlpha = al;
      if (f <= 2) { x.strokeStyle = '#fff2b0'; x.lineWidth = 3.6 - f; x.beginPath(); x.arc(32, 32, rr * 0.7, 0, TAU); x.stroke(); x.strokeStyle = 'rgba(255,106,26,0.7)'; x.lineWidth = 2; x.beginPath(); x.arc(32, 32, rr * 0.95, 0, TAU); x.stroke(); }
      for (i = 0; i < 10; i++) {
        var a = i / 10 * TAU + pr(i) * 0.5, d = rr * (0.55 + pr(i + 9) * 0.5), px = 32 + cos(a) * d, py = 32 + sin(a) * d * 0.9, s = (4.6 - f * 0.7) * (0.6 + pr(i + 20) * 0.6);
        if (f === 4) { v.dot(px, py, 1.4, 'rgba(150,140,160,0.6)'); continue; }
        v.part(Ppoly([[px - s, py - s * 0.4], [px + s * 0.2, py - s], [px + s, py + s * 0.5], [px - s * 0.3, py + s * 0.8]]), i % 3 ? C.ash : C.ember, { lw: 1.2, sh: i % 3 ? C.ashS : C.emberS, so: 0.5 });
      }
      if (f >= 2) { x.fillStyle = 'rgba(120,110,130,' + (0.5 - f * 0.1) + ')'; for (i = 0; i < 6; i++) { x.beginPath(); x.arc(32 + cos(i * 1.1) * rr * 0.9, 32 + sin(i * 1.1) * rr * 0.8, 4 + f, 0, TAU); x.fill(); } }
      x.globalAlpha = 1;
    };
  }), { lw: 1.4 }, { burst: { f: [0, 1, 2, 3, 4], fps: 14, loop: false } });

  // esquirlas: 16x16 base (final 32). 0 ceniza, 1 brasa, 2 cera, 3 hielo, 4 astilla de baculo, 5 fragmento de ojo
  addV('fx_cenizar_chip', 16, 16, [0, 1, 2, 3, 4, 5].map(function (k) {
    return function (v) {
      var pts = [[2, 11], [4, 3], [11, 2], [13.6, 9], [8, 14]], cols = [[C.ash, C.ashS, C.ashH], [C.ember, C.emberS, C.emberH], [C.wax, C.waxS, '#ffffff'], ['#bfe4ff', '#6aa6d6', '#ffffff'], ['#8a5a34', '#5a3418', '#c08a56'], ['#4ff0d0', '#1c8a90', '#d8fff6']][k];
      if (k === 4) pts = [[2, 13], [5, 6], [13, 2], [11, 9], [6, 14]];
      v.part(Ppoly(pts), cols[0], { lw: 1.4, sh: cols[1], hi: cols[2], so: 0.7 });
    };
  }), { lw: 1.2 }, { ash: { f: [0], fps: 1 }, ember: { f: [1], fps: 1 }, wax: { f: [2], fps: 1 }, ice: { f: [3], fps: 1 }, wood: { f: [4], fps: 1 }, eye: { f: [5], fps: 1 } });

  // pilar de ceniza (6 pilares r 28, 300 HP): 28x52 base (final 56x104). 0 entero, 1 agrietado, 2 escombro. Ancla de colision (final) = (28,82)
  addV('obs_ash_pillar', 28, 52, [0, 1, 2].map(function (k) {
    return function (v) {
      var x = v.ctx, i;
      v.part(Pblob(14, 41, 13, 6.4, 1350, 0.05, 10), '#16101c', { lw: 0, so: 0 });
      if (k === 2) {
        [[7, 38, 6], [16, 36, 5], [21, 40, 4], [12, 41, 4]].forEach(function (s, j) { v.part(Ppoly([[s[0] - s[2], s[1] + 2], [s[0] - s[2] * 0.5, s[1] - s[2]], [s[0] + s[2], s[1] - 1], [s[0] + s[2] * 0.7, s[1] + 3]]), C.ash, { lw: 1.4, sh: C.ashS, hi: C.ashH, so: 0.5 }); });
        v.dot(11, 38, 1, C.ember); v.dot(18, 36, 0.8, C.emberH); return;
      }
      var top = k ? 12 : 6, P = [[3, 42], [4, 22], [5, top + 6], [8, top], [11, top + 5], [14, top - 3], [18, top + 4], [21, top + 1], [23, top + 8], [25, 24], [26, 42]];
      v.part(Ppoly(P), C.ash, { lw: LW * 0.9, sh: C.ashS, hi: C.ashH, so: 1.6 });
      x.save(); x.beginPath(); Ppoly(P)(x); x.clip(); ashSpeckle(v, 360 + k, 16, 28, 52); x.fillStyle = 'rgba(16,10,22,0.3)'; x.fillRect(3, 38, 24, 6); x.restore();
      for (i = 0; i < 3; i++) emberLine(v, [[8 + i * 6, 40 - i], [7 + i * 6.6, 30 - i * 2], [9 + i * 6, 20 + i]], 1.1, 0);
      if (k) { x.strokeStyle = OLC; x.lineWidth = 1.4; x.beginPath(); x.moveTo(14, top - 2); x.lineTo(11, 22); x.lineTo(15, 30); x.lineTo(12, 40); x.stroke(); x.strokeStyle = C.emberH; x.lineWidth = 0.6; x.stroke(); }
    };
  }), { lw: LW }, { whole: { f: [0], fps: 1 }, cracked: { f: [1], fps: 1 }, rubble: { f: [2], fps: 1 } });

  // ---- suelo del Crater: vidrio volcanico negro con vetas naranja. 32x32 base (final 64), 6 variantes SIN costuras
  function wrapDo(fn) { for (var ox = -32; ox <= 32; ox += 32) for (var oy = -32; oy <= 32; oy += 32) fn(ox, oy); }
  function tileDraw(k) {
    return function (v) {
      var x = v.ctx, i, r = H.rrand(1400 + k), nF = [2, 5, 7, 4, 6, 5][k], nV = [0, 0, 1, 2, 2, 3][k];
      x.fillStyle = C.glass; x.fillRect(0, 0, 32, 32);
      for (i = 0; i < nF; i++) {   // facetas de vidrio (envueltas)
        var cx = r() * 32, cy = r() * 32, rr = 5 + r() * 9, a0 = r() * TAU, shade = r() < 0.5 ? C.glassH : C.glassS;
        wrapDo(function (ox, oy) { x.fillStyle = shade; x.globalAlpha = 0.55; x.beginPath(); for (var q = 0; q < 5; q++) { var a = a0 + q * TAU / 5 + (q % 2) * 0.3, rq = rr * (0.7 + 0.4 * ((q * 7 + i) % 3) / 2); x.lineTo(cx + ox + cos(a) * rq, cy + oy + sin(a) * rq); } x.closePath(); x.fill(); x.globalAlpha = 1; });
      }
      for (i = 0; i < 4 + k; i++) { var sx = r() * 32, sy = r() * 32; wrapDo(function (ox, oy) { x.fillStyle = 'rgba(120,110,150,0.16)'; x.fillRect(sx + ox, sy + oy, 3 + r() * 3, 0.8); }); }
      for (i = 0; i < nV; i++) {   // vetas de brasa
        var px = r() * 32, py = r() * 32, ang = r() * TAU, pts = [[px, py]]; for (var q = 1; q < 5; q++) { ang += (r() - 0.5) * 1.3; px += cos(ang) * 6; py += sin(ang) * 6; pts.push([px, py]); }
        wrapDo(function (ox, oy) {
          [['rgba(255,106,26,0.18)', 3.6], ['rgba(255,106,26,0.75)', 1.5], ['rgba(255,200,110,0.9)', 0.6]].forEach(function (s) { x.strokeStyle = s[0]; x.lineWidth = s[1]; x.lineCap = 'round'; x.beginPath(); pts.forEach(function (p, j) { x[j ? 'lineTo' : 'moveTo'](p[0] + ox, p[1] + oy); }); x.stroke(); });
        });
      }
    };
  }
  addV('tile_crater', 32, 32, [0, 1, 2, 3, 4, 5].map(tileDraw), { lw: 0 }, { plain: { f: [0], fps: 1 } });

  // ---- decorado suelto del Crater: 32x32 base (final 64), ancla base-centro (16,28). 0 pila de brasas, 1 esquirla de vidrio negro, 2 tablon carbonizado, 3 cuenco roto, 4 piedra agrietada con brasa, 5 tizon
  addV('decor_crater', 32, 32, [0, 1, 2, 3, 4, 5].map(function (k) {
    return function (v) {
      var x = v.ctx, i;
      v.part(Pblob(16, 28, 11, 3.2, 1370 + k, 0.05, 8), 'rgba(10,6,14,0.55)', { lw: 0, so: 0 });
      if (k === 0) { for (i = 0; i < 4; i++) v.part(Pblob(9 + i * 4.4, 24 - (i % 2) * 3, 5.4, 4, 1371 + i, 0.08, 8), i % 2 ? C.ash : C.ashS, { lw: 1.3, sh: C.ashD, hi: C.ashH, so: 0.5 }); [[10, 22], [17, 20], [22, 23]].forEach(function (p, j) { v.dot(p[0], p[1], 1.5, C.ember); v.dot(p[0] - 0.4, p[1] - 0.4, 0.6, C.core); }); }
      else if (k === 1) { v.part(Ppoly([[8, 28], [11, 8], [17, 2], [21, 14], [24, 28]]), C.glassH, { lw: 1.6, sh: C.glass, hi: '#5a4a70', so: 1 }); v.line(14, 24, 16, 8, 0.8, 'rgba(255,255,255,0.4)'); }
      else if (k === 2) { v.part(Ppoly([[3, 26], [6, 21], [27, 18], [29, 24], [24, 28]]), '#2a2018', { lw: 1.5, sh: '#140e0a', hi: '#4a3a2c', so: 0.7 }); emberLine(v, [[8, 24], [16, 22], [24, 22]], 0.8, 0); }
      else if (k === 3) { v.part(Ppoly([[6, 18], [26, 18], [22, 28], [10, 28]]), '#3a2a22', { lw: 1.5, sh: '#1c120c', hi: '#6a5040', so: 0.8 }); x.fillStyle = '#100a0a'; x.beginPath(); x.ellipse(16, 18, 10, 2.4, 0, 0, TAU); x.fill(); v.part(Ppoly([[23, 19], [27, 14], [28, 20]]), '#3a2a22', { lw: 1, so: 0.2 }); }
      else if (k === 4) { v.part(Pblob(16, 20, 12, 8.6, 1380, 0.08, 10), C.ash, { lw: LW * 0.8, sh: C.ashS, hi: C.ashH, so: 1 }); emberLine(v, [[10, 16], [14, 20], [12, 25]], 1.2, 0); emberLine(v, [[20, 14], [19, 20], [23, 24]], 1, 0); }
      else { v.stick([[6, 27], [15, 21], [26, 12]], 3.2, '#241a14', { lw: 1.3, hi: '#4a382a' }); v.dot(25, 12, 1.8, C.ember); v.dot(25, 12, 0.8, C.core); }
    };
  }), { lw: LW }, { embers: { f: [0], fps: 1 }, glass: { f: [1], fps: 1 }, plank: { f: [2], fps: 1 }, bowl: { f: [3], fps: 1 }, rock: { f: [4], fps: 1 }, brand: { f: [5], fps: 1 } });

  // ---- ruinas del Hogar (centro de la arena, SIN colision): 96x80 base (final 192x160), ancla base-centro (48,76). 0 chimenea, 1 mesa quemada, 2 silla quemada
  addV('decor_hearth', 96, 80, [0, 1, 2].map(function (k) {
    return function (v) {
      var x = v.ctx, i;
      v.part(Pblob(48, 76, 40, 5, 1390 + k, 0.04, 10), 'rgba(10,6,14,0.55)', { lw: 0, so: 0 });
      if (k === 0) {
        v.part(Ppoly([[18, 76], [20, 22], [30, 8], [66, 8], [76, 22], [78, 76]]), '#4a4048', { lw: LW, sh: '#2a2230', hi: '#6e6276', so: 2 });
        for (i = 0; i < 7; i++) { var by = 14 + i * 9; x.strokeStyle = 'rgba(16,10,22,0.55)'; x.lineWidth = 1; x.beginPath(); x.moveTo(20 + (i % 2) * 6, by); x.lineTo(76, by); x.stroke(); }
        v.part(Ppoly([[12, 22], [84, 22], [82, 30], [14, 30]]), '#5a4e5a', { lw: 1.6, sh: '#34283a', hi: '#8a7c8e', so: 0.8 });   // repisa
        v.part(Ppoly([[32, 76], [33, 44], [40, 36], [56, 36], [63, 44], [64, 76]]), '#0e080e', { lw: 1.8, sh: '#060306', so: 0.5 });   // hogar
        var g = x.createRadialGradient(48, 72, 1, 48, 66, 14); g.addColorStop(0, 'rgba(255,242,176,0.95)'); g.addColorStop(0.5, 'rgba(255,106,26,0.7)'); g.addColorStop(1, 'rgba(255,106,26,0)'); x.fillStyle = g; x.fillRect(32, 50, 32, 26);
        v.dot(44, 73, 2, C.ember); v.dot(52, 74, 1.6, C.emberH); v.dot(48, 72, 1, C.core);
        v.part(Ppoly([[36, 8], [34, 0], [44, 4], [52, 0], [58, 6], [62, 8]]), '#3a3040', { lw: 1.4, so: 0.3 });
      } else if (k === 1) {
        v.part(Ppoly([[10, 40], [86, 38], [90, 46], [8, 48]]), '#2a2018', { lw: LW, sh: '#140e0a', hi: '#4a3a2c', so: 1 });
        [[16, 48, 22, 76], [78, 46, 72, 76]].forEach(function (l) { v.part(Ppoly([[l[0] - 3, l[1]], [l[0] + 3, l[1]], [l[2] + 3, l[3]], [l[2] - 3, l[3]]]), '#241a14', { lw: 1.6, sh: '#100a08', hi: '#4a382a', so: 0.5 }); });
        emberLine(v, [[20, 43], [40, 44], [60, 42]], 1, 0); v.part(Ppoly([[44, 38], [50, 30], [56, 38]]), '#1c140e', { lw: 1.2, so: 0.2 });
      } else {
        v.part(Ppoly([[28, 76], [30, 48], [34, 48], [32, 76]]), '#241a14', { lw: 1.4, hi: '#4a382a', sh: '#100a08', so: 0.4 }); v.part(Ppoly([[58, 76], [56, 48], [60, 48], [64, 76]]), '#241a14', { lw: 1.4, hi: '#4a382a', sh: '#100a08', so: 0.4 });
        v.part(Ppoly([[26, 48], [64, 48], [62, 54], [28, 54]]), '#2a2018', { lw: 1.6, sh: '#140e0a', hi: '#4a3a2c', so: 0.6 });
        v.part(Ppoly([[26, 48], [28, 14], [34, 12], [34, 48]]), '#2a2018', { lw: 1.6, sh: '#140e0a', hi: '#4a3a2c', so: 0.6 }); v.part(Ppoly([[27, 22], [40, 20], [40, 26], [27, 28]]), '#241a14', { lw: 1.2, so: 0.2 });
        emberLine(v, [[40, 51], [52, 50], [60, 52]], 0.9, 0);
      }
    };
  }), { lw: LW }, { chimney: { f: [0], fps: 1 }, table: { f: [1], fps: 1 }, chair: { f: [2], fps: 1 } });

  //__NEXT__
})();
