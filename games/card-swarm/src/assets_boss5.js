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
      var x = v.ctx, i, r = H.rrand(1400 + k), nF = [2, 5, 7, 4, 6, 5][k], nV = [0, 0, 0, 1, 1, 2][k];
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
  function sparkle(ctx, px, py, r, col) { ctx.fillStyle = col; ctx.beginPath(); ctx.moveTo(px, py - r); ctx.lineTo(px + r * 0.28, py - r * 0.28); ctx.lineTo(px + r, py); ctx.lineTo(px + r * 0.28, py + r * 0.28); ctx.lineTo(px, py + r); ctx.lineTo(px - r * 0.28, py + r * 0.28); ctx.lineTo(px - r, py); ctx.lineTo(px - r * 0.28, py - r * 0.28); ctx.closePath(); ctx.fill(); }

  // ================================================================= POSE
  var GY = 112, CDEATH = 4000, HOVER = 30, SR = [88, -52], SL = [-88, -52], NECK = [14, -40], HC = [22, -80], ARML = 96;
  var CNAMES = ['zarpazo', 'cometas', 'barra', 'llamada', 'extasis', 'embestida', 'requiem', 'martillazo', 'lluvia', 'coro', 'mordisco', 'coletazo', 'invierno', 'ventisca', 'cornada', 'zumbido', 'estocada', 'sol', 'rosario', 'cadena'];
  var REST = { aR: -0.12, aL: 0.12, lean: 0, hr: 0, hdx: 0, by: 0, cloak: 0, glow: 0.35, flare: 0, shake: 0, lift: 0 };
  // por ataque: w = valores al final de la telegrafia (wp=1), s = valores del golpe (sp=1); fx = [telegrafia*u, golpe] (0..1+); hf/tf/afR/afL = [frame wind, frame strike]
  var DEF = {
    zarpazo: { w: { aR: 1.4, aL: 0.3, lean: -0.1, hr: -0.08, flare: 0.4, shake: 0.4 }, s: { aR: -1.9, aL: 0.2, lean: 0.18, hr: 0.1, flare: 1, shake: 1.2 }, fx: { slash: [0, 1] }, afR: [1, 1] },
    cometas: { w: { aR: -2.5, aL: 2.5, flare: 0.6, shake: 0.5, by: -4, lift: 6 }, s: { aR: -1.7, aL: 1.7, flare: 1, shake: 1.2, by: -1 }, fx: { orbs: [1, 1.6] }, afR: [1, 1], afL: [1, 1] },
    barra: { aim: 1, w: { lean: -0.08, flare: 0.5, shake: 0.5 }, s: { lean: 0.1, flare: 1, shake: 1.2 }, fx: { beam: [0.3, 1] }, afR: [1, 1] },
    llamada: { w: { aR: -2.4, aL: 2.4, by: -4, flare: 0.6, shake: 0.9, hr: -0.15 }, s: { aR: -2.0, aL: 2.0, shake: 3, flare: 1 }, fx: { summon: [1, 1] }, hf: [1, 1] },
    extasis: { w: { aR: -0.35, aL: 0.6, lift: -30, by: 8, flare: 0.5, shake: 0.6, hr: 0.1 }, s: { shake: 0.9, flare: 0.8 }, fx: { planted: [1, 1], spines: [0.2, 1] }, afR: [1, 1] },
    embestida: { w: { aR: 0.9, aL: 0.9, lean: 0.22, hr: 0.1, shake: 0.8, flare: 0.5 }, s: { aR: 1.0, aL: 1.0, lean: 0.38, shake: 1.6, flare: 1, hdx: 10 }, fx: { dash: [0, 1] } },
    requiem: { w: { aR: -2.0, aL: 2.0, lift: 10, flare: 0.7, shake: 1, glow: 0.7 }, s: { aR: -2.4, aL: 2.4, lift: 16, flare: 1, shake: 2, glow: 1 }, fx: { nova: [0.5, 1] }, tf: [1, 1], afR: [1, 1], afL: [1, 1] },
    martillazo: { w: { aR: -3.0, aL: 3.0, lean: -0.08, by: -6, flare: 0.5, shake: 0.5 }, s: { aR: -0.8, aL: 0.8, lean: 0.2, by: 6, shake: 4, flare: 1 }, fx: { slam: [0, 1] }, afR: [1, 1], afL: [1, 1] },
    lluvia: { w: { aR: -2.7, aL: 2.7, lift: 8, flare: 0.7, shake: 0.7, hr: -0.18 }, s: { aR: -2.4, aL: 2.4, flare: 1, shake: 1.5, hr: -0.12 }, fx: { rain: [0.5, 1] }, hf: [1, 1] },
    coro: { w: { hr: -0.22, aR: -1.2, aL: 1.2, flare: 0.5, shake: 0.5 }, s: { hr: -0.3, aR: -1.5, aL: 1.5, flare: 1, shake: 1 }, fx: { voice: [0.4, 1] }, hf: [1, 1], tf: [1, 1] },
    mordisco: { w: { hdx: -10, hr: -0.16, lean: -0.1, shake: 0.5 }, s: { hdx: 44, hr: 0.12, lean: 0.16, shake: 1.5 }, hf: [0, 1], fx: { bite: [0, 1] } },
    coletazo: { w: { lean: 0.1, cloak: -0.6, aR: 0.4, aL: 0.4, shake: 0.3 }, s: { lean: -0.12, cloak: 1, aR: -0.3, aL: -0.3, shake: 1 }, fx: { lash: [0, 1] } },
    invierno: { w: { aR: -1.3, aL: 1.3, lift: -6, flare: 0.6, shake: 0.6 }, s: { aR: -1.6, aL: 1.6, flare: 1, shake: 1 }, fx: { frost: [0.6, 1] }, tf: [1, 1] },
    ventisca: { w: { aR: -1.9, aL: 1.9, lean: -0.1, shake: 0.5 }, s: { aR: -1.45, aL: 1.45, lean: 0.14, shake: 1.2 }, fx: { wind: [0.4, 1] }, afR: [1, 1], afL: [1, 1] },
    cornada: { w: { hr: 0.28, hdx: -8, lean: -0.14, shake: 0.5 }, s: { hr: 0.35, hdx: 34, lean: 0.2, shake: 1.4 }, fx: { horn: [0, 1] } },
    zumbido: { w: { aR: -1.9, aL: 1.9, lift: 10, flare: 1, glow: 1, shake: 1.3 }, s: {}, fx: { rings: [1, 1] }, hf: [1, 1], tf: [1, 1] },
    estocada: { aim: 1, w: { lean: -0.14, flare: 0.6, shake: 0.7 }, s: { lean: 0.22, flare: 1, shake: 1.4 }, fx: { thrust: [0.3, 1] }, afR: [1, 1] },
    sol: { w: { aR: -2.9, aL: 2.9, lift: 20, flare: 0.7, glow: 0.8, shake: 0.8 }, s: { aR: -0.9, aL: 0.9, lift: 0, by: 4, flare: 1, glow: 1, shake: 3 }, fx: { sun: [1, 0.6], pulse: [0, 1] }, afR: [1, 1], afL: [1, 1], hf: [1, 1], tf: [1, 1] },
    rosario: { w: { aR: -2.0, aL: 2.0, lift: 10, flare: 0.7, glow: 0.8, shake: 0.5 }, s: { aR: -2.2, aL: 2.2, flare: 1, glow: 1, shake: 1 }, fx: { beads: [1, 1] }, hf: [0, 1] },
    cadena: { w: { aR: -2.1, aL: 2.1, lift: 14, flare: 1, glow: 1, shake: 1.1 }, s: {}, fx: { beads: [1, 1], aura: [1, 1] }, hf: [1, 1], tf: [1, 1] }
  };
  function aimTheta(la) { return Math.atan2(-cos(la), sin(la)); }   // angulo del brazo para que la mano apunte a la direccion la (marco del jefe)
  function relicSt(s, id) {
    if (s.relics && s.relics[id]) return s.relics[id];
    var br = s.broken || {}; if (br[id]) return 'broken'; var ph = clamp(s.phase || 1, 1, 7), own = RELIC_PHASE[id]; return ph === own ? 'active' : (ph < own ? 'off' : 'burning');
  }
  function cPose(s) {
    var t = s.t || 0, W = s.windup, ST = s.strike, wp = s.wp != null ? s.wp : ((t % 1400) / 1400), sp = s.sp != null ? s.sp : ((t % 700) / 700), u = ease(wp), q = ease(sp), f = s.facing < 0 ? -1 : 1, k, br = s.broken || {}, ph = clamp(s.phase || 1, 1, 7);
    if (s.desperate && !W && !ST) W = 'cadena';
    var P = { fx: {}, atk: ST || W || null, hf: 0, tf: 0, afR: 0, afL: 0, staffScale: 1, staffRot: null, eyes: ph - 1, crownLit: s.crownLit != null ? s.crownLit : 5, landed: 0, dead: 0, phase: ph, aimA: 0, aimed: false, relicsGone: false, eyesOff: false };
    for (k in REST) P[k] = REST[k];
    P.by = 3 * sin(t / 620); P.aR += 0.04 * sin(t / 700); P.aL -= 0.04 * sin(t / 700 + 1); P.glow = 0.3 + 0.1 * (ph - 1) / 6 + 0.04 * sin(t / 400);
    var la = f > 0 ? (s.aim || 0) : PI - (s.aim || 0), key = ST || W, d = key && DEF[key];
    if (d) {
      var keys = {}, kk; for (kk in d.w) keys[kk] = 1; for (kk in d.s) keys[kk] = 1;
      for (kk in keys) { var restv = P[kk], wv = d.w[kk] != null ? d.w[kk] : restv, sv = d.s[kk] != null ? d.s[kk] : wv; P[kk] = ST ? lerp(wv, sv, q) : lerp(restv, wv, u); }
      for (kk in d.fx) P.fx[kk] = ST ? d.fx[kk][1] : d.fx[kk][0] * u;
      if (d.hf) P.hf = ST ? d.hf[1] : d.hf[0]; if (d.tf) P.tf = ST ? d.tf[1] : d.tf[0]; if (d.afR) P.afR = ST ? d.afR[1] : d.afR[0]; if (d.afL) P.afL = ST ? d.afL[1] : d.afL[0];
      if (d.aim) { var th = aimTheta(la); P.aR = ST ? th : lerp(P.aR, th * 0.6 - 0.5 * 0.4, u); P.aimA = la; P.aimed = true; }
      if (key === 'extasis') { P.staffScale = 2.4; P.staffRot = 0; }
      if (key === 'martillazo' && ST) { P.fx.slam = sp < 0.5 ? 1 : 1 - (sp - 0.5) * 1.6; }
    }
    var landed = clamp(s.landed === true ? 1 : +s.landed || 0, 0, 1); if (s.stun) landed = 1; P.landed = landed;
    if (s.open > 0 || s.exposed && ph >= 7) P.tf = Math.max(P.tf, (s.open != null ? s.open : 1) > 0.5 ? 2 : 0);
    if (s.stun) { P.hf = 3; P.hr = 0.38; P.hdx = 8; P.aR = -0.04; P.aL = 0.04; P.by = 16 + 2 * sin(t / 300); P.lean = 0.07; P.glow = 0.2; P.flare = 0; P.shake = 0; P.fx = {}; P.afR = 2; P.afL = 2; if (ph >= 7) P.tf = 2; P.eyes = ph - 1; }
    if (br.cayado) P.afR = P.afR === 1 ? 1 : 2; if (br.colmillo) P.afL = P.afL === 1 ? 1 : 2;
    P.hover = Math.max(0, HOVER * (1 - landed) + (s.lift || 0) + P.lift + 3 * sin(t / 450));
    if (s.roar > 0) { var ro = ease(s.roar); P.hr += -0.2 * ro; P.hf = ro > 0.2 ? 1 : P.hf; P.tf = Math.max(P.tf, ro > 0.3 ? 1 : 0); P.aR = lerp(P.aR, -1.7, ro); P.aL = lerp(P.aL, 1.7, ro); P.shake = Math.max(P.shake, 2.4 * ro); P.flare = Math.max(P.flare, ro); P.afR = ro > 0.4 ? 1 : P.afR; P.afL = ro > 0.4 ? 1 : P.afL; P.fx.roar = ro; }
    if (s.hurt > 0) { var hh = clamp(+s.hurt || 0, 0, 1); P.lean -= 0.05 * hh; P.by += 3 * hh; if (hh > 0.25) { P.hf = 2; P.tf = P.tf === 2 ? 2 : 3; } }
    if (s.enraged) { P.flare = Math.max(P.flare, 0.5); P.glow = Math.max(P.glow, 0.8); }
    if (s.exposed && P.glow < 0.6) P.glow = 0.6;
    P.tilt = P.lean;
    return P;
  }
  function cDeath(P, dt) {
    var a = clamp(dt / 1200, 0, 1), c = ease((dt - 500) / 1300);
    P.dead = dt; P.atk = null; P.fx = {}; P.landed = ease(dt / 900); P.hover = HOVER * (1 - P.landed); P.crownLit = clamp(5 - Math.floor((dt - 200) / 170), 0, 5); P.relicsGone = dt > 500;
    P.hf = dt < 1500 ? 2 : 3; P.tf = dt < 1200 ? 3 : 2; P.afR = 2; P.afL = 2; P.aR = lerp(P.aR, -0.05, a); P.aL = lerp(P.aL, 0.05, a);
    P.lean = sin(dt / 80) * 0.04 * (1 - a) + 0.18 * c; P.tilt = P.lean; P.by = 26 * c + (dt < 900 ? sin(dt / 60) * 2 * (1 - a) : 0); P.hr = 0.4 * c; P.hdx = 8 * c;
    P.glow = Math.max(0.06, 0.9 * (1 - c)); P.shake = dt < 900 ? 5 * (1 - a * 0.5) : (dt < 1800 ? 2 * (1 - c) + 0.4 : 0); P.eyesOff = dt > 1500; P.flare = 0; P.cloak = 0; return P;
  }
  function cPoseFor(s) { var P = cPose(s); if (s.dying) cDeath(P, Math.min(s.dt != null ? s.dt : (s.deathT || 0), 1800)); return P; }
  function T(P, px, py) { var c = cos(P.tilt), sn = sin(P.tilt); return { x: px * c - py * sn, y: px * sn + py * c + P.by }; }
  function hp(P, px, py) { var dx = px - NECK[0], dy = py - NECK[1], c = cos(P.hr), s = sin(P.hr); return [NECK[0] + dx * c - dy * s + P.hdx, NECK[1] + dx * s + dy * c]; }
  function handOf(S, th) { return [S[0] + ARML * -sin(th), S[1] + ARML * cos(th)]; }
  function cLayout(P, s) {
    var hR = handOf(SR, P.aR), hL = handOf(SL, P.aL), sr = P.staffRot != null ? P.staffRot : P.aR * 0.45 - 0.05, sc = P.staffScale;
    var gx = hR[0] + (5 * cos(sr) + 32 * sin(sr)) * sc, gy2 = hR[1] + (5 * sin(sr) - 32 * cos(sr)) * sc;   // cabeza del baculo (curva)
    var tipx = hR[0] + (-26 * sin(sr)) * sc, tipy = hR[1] + (26 * cos(sr)) * sc;   // pie del baculo
    var hc = hp(P, HC[0], HC[1]), out = { hand_r: T(P, hR[0], hR[1]), hand_l: T(P, hL[0], hL[1]), staff: T(P, gx, gy2), staffTip: T(P, tipx, tipy), staffRot: sr, head: T(P, hc[0], hc[1]) };
    var oj = hp(P, HC[0] + 2, HC[1] - 20), cr = hp(P, HC[0] + 2, HC[1] - 72 + 3 * sin((s.t || 0) / 500)), ey = hp(P, HC[0] + 4, HC[1] + 4), mo = hp(P, HC[0] + 12, HC[1] + 32), cw = hp(P, HC[0], HC[1] - 42);
    out.ojo = T(P, oj[0], oj[1]); out.corona = T(P, cr[0], cr[1]); out.eyes = T(P, ey[0], ey[1]); out.mouth = T(P, mo[0], mo[1]); out.crown = T(P, cw[0], cw[1]);
    out.nucleo = T(P, 40, -16); out.core = T(P, -12, 32); out.colmillo = T(P, -96, -98); out.torso = T(P, 0, 0); out.glyphs = T(P, HC[0], HC[1] - 120);
    out.tips = A.CENIZAR_TIPS.map(function (p) { var h = hp(P, HC[0] - 48 + p[0], HC[1] - 48 + p[1]); return T(P, h[0], h[1]); });
    return out;
  }

  // ================================================================= RENDER
  var RB = { cayado: 0, nucleo: 0, ojo: 0, colmillo: 0, corona: 0 };
  function drawRelicSpr(x, id, st, cx, cy, rot, sc, t, flameA) {
    var fr = st === 'off' ? 1 : (st === 'broken' ? 2 : 0), sp = A.sprite('reliq_' + id, fr), w = sp.width * sc, h = sp.height * sc;
    x.save(); x.translate(cx, cy); if (rot) x.rotate(rot); x.drawImage(sp, -w / 2, -h / 2, w, h); x.restore();
  }
  function renderCore(R, s, f, t, dying, dt) {
    var x = beginR(R), P = cPoseFor(s), L = cLayout(P, s), br = s.broken || {}, i, ph = P.phase;
    var shx = P.shake ? sin(t * 0.13) * P.shake : 0, shy = P.shake ? cos(t * 0.17) * P.shake * 0.6 : 0;
    x.translate(R.OX + shx, R.OY - P.hover + shy); if (f < 0) x.scale(-1, 1);
    extR(R, -300, -270 - P.hover, 300, 170 - P.hover);
    x.save(); x.translate(0, P.by); x.rotate(P.tilt);
    // capa de humo (detras)
    var cl = A.sprite('boss_cenizar_cloak', Math.floor(t / 200) % 4);
    x.save(); x.translate(-14, -2); if (P.cloak) { x.translate(110, 30); x.rotate(P.cloak * 0.55); x.scale(1 + Math.abs(P.cloak) * 0.25, 1); x.translate(-110, -30); } x.drawImage(cl, -96, 0); x.restore();
    // brazo lejano (izquierdo)
    function arm(spr, S, th) { x.save(); x.translate(S[0], S[1]); x.rotate(th); x.drawImage(spr, -40, -16); x.restore(); }
    arm(A.sprite('boss_cenizar_arm_l', P.afL), SL, P.aL);
    // torso
    var tf = P.tf, th0 = A.sprite('boss_cenizar_torso', tf); x.drawImage(th0, -112, -96);
    // piezas del pecho: Nucleo (reliquia F3) y Corazon de Ceniza (F7)
    var rg = P.relicsGone;
    if (!rg) {
      var sN = relicSt(s, 'nucleo'), pu = 1 + (sN === 'active' ? 0.05 * sin(t / 160) : 0);
      drawRelicSpr(x, 'nucleo', sN, 40, -16, 0, pu, t);
      if (ph >= 7 || br.core || s.exposed && ph >= 7) {
        var cf = br.core ? 2 : ((s.exposed || P.tf === 2) ? 1 : 0), cs = A.sprite('boss_cenizar_core', cf), bt = 1 + (cf === 0 ? 0.08 * sin(t / 150) : 0.04 * sin(t / 90));
        x.save(); x.translate(-12, 32); x.scale(bt, bt); x.drawImage(cs, -cs.width / 2, -cs.height / 2); x.restore();
      }
      drawRelicSpr(x, 'colmillo', relicSt(s, 'colmillo'), -96, -98, -0.28, 1, t);
    }
    // cabeza con cuello
    x.save(); x.translate(NECK[0], NECK[1]); x.rotate(P.hr); x.translate(-NECK[0] + P.hdx, -NECK[1]);
    var hs = A.sprite('boss_cenizar_head', P.hf); x.drawImage(hs, HC[0] - 48, HC[1] - 48);
    if (P.hf !== 2 && P.hf !== 3 && !P.eyesOff) { var es = A.sprite('boss_cenizar_eyes', clamp(P.eyes, 0, 6)); x.drawImage(es, HC[0] - 22, HC[1] - 6); }
    for (i = 0; i < 5; i++) {   // gemas de la corona: color del jefe, apagadas si no estan encendidas
      var tp = A.CENIZAR_TIPS[i], gx = HC[0] - 48 + tp[0], gy = HC[1] - 48 + tp[1] + 2, lit = i < P.crownLit;
      x.fillStyle = OLC; x.beginPath(); x.arc(gx, gy, 5.2, 0, TAU); x.fill(); x.fillStyle = lit ? TIPC[i] : '#2a2430'; x.beginPath(); x.arc(gx, gy, 3.5, 0, TAU); x.fill();
      if (lit) { x.fillStyle = '#ffffff'; x.beginPath(); x.arc(gx - 1, gy - 1, 1.1, 0, TAU); x.fill(); }
    }
    if (!rg) { drawRelicSpr(x, 'ojo', relicSt(s, 'ojo'), HC[0] + 2, HC[1] - 20, 0, 1, t); drawRelicSpr(x, 'corona', relicSt(s, 'corona'), HC[0] + 2, HC[1] - 72 + 3 * sin(t / 500), 0, 1, t); }
    x.restore();
    // brazo cercano (derecho) con el Cayado
    var sr = L.staffRot;
    if (!rg) {
      var hR = handOf(SR, P.aR), sC = relicSt(s, 'cayado');
      arm(A.sprite('boss_cenizar_arm_r', P.afR), SR, P.aR);
      x.save(); x.translate(hR[0], hR[1]); x.rotate(sr); x.scale(P.staffScale, P.staffScale);
      var cy = A.sprite('reliq_cayado', sC === 'off' ? 1 : (sC === 'broken' ? 2 : 0)); x.drawImage(cy, -20, -44); x.restore();
    } else arm(A.sprite('boss_cenizar_arm_r', P.afR), SR, P.aR);
    x.restore();
    // brillos aditivos
    x.globalCompositeOperation = 'lighter';
    var ec = EYE[clamp(P.eyes, 0, 6)][2], he = L.eyes;
    if (P.hf !== 2 && P.hf !== 3 && !P.eyesOff) glowAt(x, he.x, he.y, 26 + P.flare * 12, ec, 0.45 + P.flare * 0.3);
    glowAt(x, 0, 0, 120, PHC[ph - 1], 0.1 + P.glow * 0.2 + 0.04 * sin(t / 220), 100);
    var ribA = clamp(P.glow * 0.5 + P.flare * 0.3 + (P.tf === 1 ? 0.2 : 0), 0, 0.9); glowAt(x, L.torso.x + 4, L.torso.y - 10, 70, '255,106,26', ribA, 56);
    if (!rg) {
      var sN2 = relicSt(s, 'nucleo'); if (sN2 === 'active' || sN2 === 'burning') glowAt(x, L.nucleo.x, L.nucleo.y, 34 + 4 * sin(t / 140), '255,242,176', sN2 === 'active' ? 0.75 : 0.45);
      ['cayado', 'ojo', 'colmillo', 'corona'].forEach(function (id) { var st = relicSt(s, id); if (st === 'off' || st === 'broken') return; var an = id === 'cayado' ? L.staff : L[id], col = id === 'ojo' ? '79,240,208' : (id === 'colmillo' ? '191,228,255' : (id === 'corona' ? '255,210,120' : '255,160,60')); glowAt(x, an.x, an.y, (st === 'active' ? 30 : 22) + 3 * sin(t / 170 + RELIC_LINK[id]), col, st === 'active' ? 0.6 : 0.32); });
      if (ph >= 7 && !br.core) glowAt(x, L.core.x, L.core.y, 30 + (s.exposed ? 12 : 0) + 3 * sin(t / 120), '255,242,176', s.exposed ? 0.95 : 0.6);
    }
    for (i = 0; i < P.crownLit && !dying; i++) glowAt(x, L.tips[i].x, L.tips[i].y + 2, 11, '255,255,255', 0.35);
    x.globalCompositeOperation = 'source-over';
    return { R: R, P: P, L: L };
  }

  var CELL = 12, MC = 28, MR = 28, MASKS = {};
  function ensureMask(R, s) {
    var br = s.broken || {}, key = 'k' + (br.cayado ? 'a' : '') + (br.nucleo ? 'n' : '') + (br.ojo ? 'o' : '') + (br.colmillo ? 'c' : '') + (br.corona ? 'r' : '') + (br.core ? 'z' : '') + (s.phase || 1);
    if (MASKS[key]) return MASKS[key];
    var s2 = { t: 0, facing: 1, phase: s.phase, dying: true, dt: 1800, broken: br }, r = renderCore(R, s2, 1, 0, true, 1800), ox = R.OX - MC * CELL / 2, oy = R.OY - 190, sm = mkc(MC, MR), g = sm.getContext('2d');
    g.imageSmoothingEnabled = true; g.drawImage(R.cv, ox, oy, MC * CELL, MR * CELL, 0, 0, MC, MR);
    var d = g.getImageData(0, 0, MC, MR).data, mk = new Uint8Array(MC * MR); for (var i = 0; i < MC * MR; i++) mk[i] = d[i * 4 + 3] > 40 ? 1 : 0;
    endR(R); return (MASKS[key] = mk);
  }
  function cellTh(i, j) { return pr(i * 7 + j * 13 + 1) * 0.4 + (1 - j / MR) * 0.5 + (pr(i + 90) - 0.5) * 0.1; }   // se deshace de arriba abajo
  function renderCenizar(s) {
    var R = getR('cenizar', 760, 720, 380, 440), f = s.facing < 0 ? -1 : 1, t = s.t || 0, dying = !!s.dying, dt = dying ? (s.dt != null ? s.dt : (s.deathT || 0)) : 0, i;
    if (dying && dt >= CDEATH) { beginR(R); R.bb = { x0: 0, y0: 0, x1: 1, y1: 1 }; endR(R); return { canvas: R.cv, ox: R.OX, oy: R.OY, box: R.box }; }
    var mask = null; if (dying && dt >= 1800) mask = ensureMask(R, s);
    var C0 = renderCore(R, s, f, t, dying, dt), P = C0.P, x = R.cv.getContext('2d'), bx = endR(R);
    x.setTransform(1, 0, 0, 1, 0, 0); x.globalCompositeOperation = 'source-atop';
    function fill(c) { x.fillStyle = c; x.fillRect(bx.x, bx.y, bx.w, bx.h); }
    if (s.enraged && !dying) fill('rgba(255,120,30,' + (0.12 + 0.1 * sin(t / 150)).toFixed(3) + ')');
    if (s.exposed && !dying) fill('rgba(223,244,255,' + (0.18 + 0.12 * sin(t / 130)).toFixed(3) + ')');
    if (s.immune && !dying) fill('rgba(255,170,90,' + (0.16 + 0.08 * sin(t / 90)).toFixed(3) + ')');
    if (P.fx.frost > 0.2 && !dying) fill('rgba(200,230,255,' + (0.14 * P.fx.frost).toFixed(3) + ')');
    var hv = s.hurt === true ? 1 : clamp(+s.hurt || 0, 0, 1);
    if (dying && dt < 1000) hv = Math.max(hv, (Math.floor(dt / 70) % 2) ? 0.8 : 0.1); if (dying && dt < 150) hv = 1;
    if (hv > 0) fill('rgba(255,255,255,' + (hv * 0.85).toFixed(3) + ')');
    if (dying && dt >= 1800 && mask) {
      var u = clamp((dt - 1800) / 1500, 0, 1.2), ox = R.OX - MC * CELL / 2, oy = R.OY - 190;
      x.globalCompositeOperation = 'destination-out'; x.fillStyle = '#000';
      for (var j = 0; j < MR; j++) for (var ii = 0; ii < MC; ii++) { var li = f < 0 ? MC - 1 - ii : ii; if (u > cellTh(li, j)) x.fillRect(ox + ii * CELL - 0.5, oy + j * CELL - 0.5, CELL + 1, CELL + 1); }
    }
    x.globalCompositeOperation = 'source-over'; x.setTransform(1, 0, 0, 1, 0, 0);
    return { canvas: R.cv, ox: R.OX, oy: R.OY, pose: P, layout: C0.L, box: bx, mask: mask };
  }

  // ---- sombra (vuela a ras: grande, oscura, se encoge con la altura), aura de fase, cupula de brasas
  function hoverOf(s) { var P = cPose(s); var h = P.hover; if (s.dying) h *= 1 - ease((s.dt || 0) / 900); return Math.max(0, h); }
  function cShadow(ctx, px, py, s) {
    if (s.dying && s.dt >= CDEATH) return;
    var h = hoverOf(s), k = 1 / (1 + h / 200), al = 0.2 + 0.28 * k, wd = 150 * (0.6 + 0.4 * k); if (s.dying && s.dt > 2000) al *= 1 - clamp((s.dt - 2000) / 1800, 0, 1);
    ctx.save(); ctx.translate(px, py + GY + 4);
    ctx.fillStyle = 'rgba(8,4,12,' + (al * 0.5).toFixed(3) + ')'; ctx.beginPath(); ctx.ellipse(0, 0, wd * 1.2, 46 * (0.6 + 0.4 * k), 0, 0, TAU); ctx.fill();
    ctx.fillStyle = 'rgba(8,4,12,' + (al * 0.85).toFixed(3) + ')'; ctx.beginPath(); ctx.ellipse(0, 0, wd, 35 * (0.6 + 0.4 * k), 0, 0, TAU); ctx.fill();
    ctx.restore();
  }
  function cAura(ctx, px, py, s, P) {
    var t = s.t || 0, h = P.hover, ph = P.phase, a = 0.12 + 0.1 * P.glow + 0.03 * sin(t / 300) + (s.exposed ? 0.1 : 0) + (P.fx.aura ? 0.12 : 0) + (s.dying ? -0.12 * clamp(s.dt / 3000, 0, 1) : 0);
    ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = clamp(a, 0, 0.6); ctx.drawImage(glowSpr(s.exposed ? '190,230,255' : PHC[ph - 1]), px - 190, py - h - 130, 380, 270); ctx.restore();
    if (s.dying && s.dt > 1800) { var pu = clamp((s.dt - 1800) / 1800, 0, 1), fade = 1 - clamp((s.dt - 3300) / 700, 0, 1); ctx.save(); ctx.globalAlpha = 0.9 * fade; ctx.translate(px, py + GY - 4); ctx.scale(1, 0.3); ctx.fillStyle = OLC; ctx.beginPath(); ctx.arc(0, 0, 30 + 150 * ease(pu) + 3, 0, TAU); ctx.fill(); ctx.fillStyle = '#4a4452'; ctx.beginPath(); ctx.arc(0, 0, 30 + 150 * ease(pu), 0, TAU); ctx.fill(); ctx.fillStyle = '#6a6272'; ctx.beginPath(); ctx.arc(-8, -6, (30 + 150 * ease(pu)) * 0.7, 0, TAU); ctx.fill(); ctx.restore(); }
  }
  var SHC = null;
  function shieldCv() {
    if (SHC) return SHC; var c = mkc(420, 340), g = c.getContext('2d'), i, gr = g.createRadialGradient(210, 170, 40, 210, 170, 210);
    gr.addColorStop(0, 'rgba(255,200,120,0.04)'); gr.addColorStop(1, 'rgba(255,120,40,0.42)');
    g.save(); g.beginPath(); g.ellipse(210, 170, 206, 166, 0, 0, TAU); g.clip(); g.fillStyle = gr; g.fillRect(0, 0, 420, 340);
    g.strokeStyle = 'rgba(255,230,170,0.7)'; g.lineWidth = 1.4; for (i = 0; i < 14; i++) { var a = i * TAU / 14; g.beginPath(); g.moveTo(210 + cos(a) * 50, 170 + sin(a) * 40); g.lineTo(210 + cos(a + 0.2) * 130, 170 + sin(a + 0.2) * 106); g.lineTo(210 + cos(a - 0.1) * 210, 170 + sin(a - 0.1) * 170); g.stroke(); }
    for (i = 1; i < 4; i++) { g.beginPath(); g.ellipse(210, 170, 52 * i, 42 * i, 0, 0, TAU); g.stroke(); }
    g.restore(); g.strokeStyle = OLC; g.lineWidth = 4; g.beginPath(); g.ellipse(210, 170, 206, 166, 0, 0, TAU); g.stroke(); g.strokeStyle = '#ffd9a0'; g.lineWidth = 2.4; g.stroke();
    for (i = 0; i < 18; i++) { var a2 = i * TAU / 18; g.fillStyle = i % 2 ? '#ffffff' : C.emberH; g.beginPath(); g.arc(210 + cos(a2) * 206, 170 + sin(a2) * 166, 2.2, 0, TAU); g.fill(); }
    return (SHC = c);
  }
  function miniStar(ctx, x, y, r, rot, col) { ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.fillStyle = col; ctx.strokeStyle = OLC; ctx.lineWidth = 1.5; ctx.beginPath(); for (var k = 0; k < 8; k++) { var rk = k % 2 ? r * 0.45 : r; ctx.lineTo(cos(k * TAU / 8) * rk, sin(k * TAU / 8) * rk); } ctx.closePath(); ctx.stroke(); ctx.fill(); ctx.restore(); }
  function hexP(c, cx, cy, r, rot) { for (var i = 0; i < 6; i++) { var a = rot + i * PI / 3; c[i ? 'lineTo' : 'moveTo'](cx + cos(a) * r, cy + sin(a) * r); } c.closePath(); }

  // ---- efectos delanteros (encima del jefe)
  function cFront(ctx, px, py, s, P, R) {
    var t = s.t || 0, f = s.facing < 0 ? -1 : 1, L = R.layout, br = s.broken || {}, dying = !!s.dying, dt = dying ? (s.dt != null ? s.dt : 0) : 0, i, gy = py + GY, hv = P.hover, fx = P.fx, ph = P.phase;
    function G(p) { return { x: px + f * p.x, y: py + p.y - hv }; }
    var hr = G(L.hand_r), hl = G(L.hand_l), mouth = G(L.mouth), core = G(L.nucleo), body = { x: px, y: py - hv }, head = G(L.head);
    if (!dying) {
      // ceniza viva ambiente (siempre) y detalle por fase
      ctx.save();
      for (i = 0; i < 9; i++) { var pp = ((t / 2600) + i / 9) % 1, ax = px + (pr(i + 600) - 0.5) * 300, ay = py - hv + 100 - pp * 260; ctx.globalAlpha = 0.75 * Math.sin(pp * PI); ctx.fillStyle = i % 4 === 0 ? C.emberH : '#8a8294'; ctx.fillRect(ax + sin(pp * 6 + i) * 10, ay, 3, 3); }
      ctx.restore();
      ctx.save();
      if (ph === 2) { for (i = 0; i < 4; i++) { var a = t / 900 + i * TAU / 4; ctx.fillStyle = 'rgba(200,138,255,0.8)'; ctx.strokeStyle = OLC; ctx.lineWidth = 1.2; ctx.save(); ctx.translate(px + cos(a) * 170, py - hv + sin(a) * 54); ctx.rotate(a + PI / 2); ctx.beginPath(); ctx.moveTo(0, -9); ctx.lineTo(4, 3); ctx.lineTo(-4, 3); ctx.closePath(); ctx.stroke(); ctx.fill(); ctx.restore(); } }
      else if (ph === 3) { ctx.globalCompositeOperation = 'lighter'; for (i = 0; i < 6; i++) { var sp3 = ((t / 900) + i / 6) % 1; ctx.fillStyle = 'rgba(255,170,60,' + (0.8 * (1 - sp3)).toFixed(2) + ')'; ctx.fillRect(px - 120 + pr(i + 620) * 240, py - hv + 90 - sp3 * 220, 3, 5); } }
      else if (ph === 4) { for (i = 0; i < 5; i++) { var bp = ((t / 2000) + i / 5) % 1; ctx.strokeStyle = 'rgba(79,240,208,' + (0.8 * (1 - bp)).toFixed(2) + ')'; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.arc(px - 110 + pr(i + 630) * 220, py - hv + 100 - bp * 200, 3 + pr(i) * 3, 0, TAU); ctx.stroke(); } }
      else if (ph === 5) { for (i = 0; i < 8; i++) { var np = ((t / 2400) + i / 8) % 1; ctx.fillStyle = 'rgba(235,248,255,' + (0.85 * Math.sin(np * PI)).toFixed(2) + ')'; ctx.fillRect(px - 150 + pr(i + 640) * 300 + sin(np * 7 + i) * 8, py - hv - 140 + np * 260, 3, 3); } }
      else if (ph === 6) { for (i = 0; i < 5; i++) { var hp6 = ((t / 2200) + i / 5) % 1; ctx.strokeStyle = 'rgba(255,210,74,' + (0.8 * Math.sin(hp6 * PI)).toFixed(2) + ')'; ctx.lineWidth = 1.6; ctx.beginPath(); hexP(ctx, px - 130 + pr(i + 650) * 260, py - hv + 90 - hp6 * 200, 5 + pr(i) * 4, t / 800 + i); ctx.stroke(); } }
      else if (ph === 7) { ctx.globalCompositeOperation = 'lighter'; for (i = 0; i < 5; i++) { var a7 = t / 700 + i * TAU / 5; ctx.fillStyle = TIPC[i]; ctx.globalAlpha = 0.85; ctx.beginPath(); ctx.arc(px + cos(a7) * 190, py - hv - 20 + sin(a7) * 70, 3.4, 0, TAU); ctx.fill(); } }
      ctx.restore();
    }
    // ---- efectos de ataque
    if (!dying) {
      if (fx.slash > 0.02) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.lineCap = 'round'; var a1 = f > 0 ? -0.9 : PI + 0.9, a2 = f > 0 ? 0.9 : PI - 0.9; for (i = 0; i < 3; i++) { ctx.strokeStyle = 'rgba(255,' + (190 - i * 40) + ',' + (90 - i * 20) + ',' + (0.6 * fx.slash * (1 - i * 0.25)).toFixed(3) + ')'; ctx.lineWidth = 14 - i * 4; ctx.beginPath(); ctx.arc(body.x, body.y, 150 - i * 10, Math.min(a1, a2), Math.max(a1, a2)); ctx.stroke(); } ctx.restore(); }
      if (fx.orbs > 0.02) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; [hr, hl].forEach(function (h, k) { glowAt(ctx, h.x, h.y - 8, 22 + 12 * fx.orbs, '255,150,50', 0.7); for (var q = 0; q < 3; q++) { var oa = t / 160 + q * TAU / 3 + k, orr = 14 * Math.min(1, fx.orbs); ctx.fillStyle = q % 2 ? '#ffe0a0' : '#ff8a30'; ctx.beginPath(); ctx.arc(h.x + cos(oa) * orr, h.y - 8 + sin(oa) * orr, 4, 0, TAU); ctx.fill(); } }); ctx.restore(); }
      if (fx.beam > 0.02) {
        var ba = s.aim || 0; var sx0 = hr.x, sy0 = hr.y;   // aimA ya esta en el marco del mundo (facing aplicado)
        ctx.save(); ctx.globalCompositeOperation = 'lighter'; glowAt(ctx, sx0, sy0, 26 + 20 * fx.beam, '255,200,110', 0.8);
        ctx.translate(sx0, sy0); ctx.rotate(ba);
        if (fx.beam >= 0.95) { var gg = ctx.createLinearGradient(0, 0, 560, 0); gg.addColorStop(0, 'rgba(255,255,230,0.95)'); gg.addColorStop(1, 'rgba(255,106,26,0.35)'); ctx.fillStyle = gg; ctx.fillRect(0, -9, 560, 18); ctx.fillStyle = 'rgba(255,106,26,0.35)'; ctx.fillRect(0, -26, 560, 52); }
        else { ctx.strokeStyle = 'rgba(255,220,160,' + (0.6 * fx.beam).toFixed(2) + ')'; ctx.lineWidth = 2; ctx.setLineDash([8, 10]); ctx.lineDashOffset = -t / 20; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(560, 0); ctx.stroke(); ctx.setLineDash([]); }
        ctx.restore();
      }
      if (fx.summon > 0.02) {
        ctx.save(); ctx.translate(px, gy - 6); ctx.scale(1, 0.34); ctx.strokeStyle = 'rgba(176,90,240,' + (0.6 * fx.summon).toFixed(2) + ')'; ctx.lineWidth = 5; ctx.setLineDash([14, 10]); ctx.lineDashOffset = -t / 20; ctx.beginPath(); ctx.arc(0, 0, 160 * fx.summon, 0, TAU); ctx.stroke(); ctx.setLineDash([]); ctx.restore();
        for (i = 0; i < 6; i++) { var sa = t / 320 + i * TAU / 6, sr = (50 + 100 * ((i / 6 + t / 2200) % 1)) * fx.summon; ctx.fillStyle = i % 2 ? C.emberH : '#c88aff'; ctx.fillRect(px + cos(sa) * sr - 2, gy - 22 + sin(sa) * sr * 0.34 - 12 * sin(t / 100 + i), 4, 4); }
      }
      if (fx.planted > 0.02) {
        var tp = G(L.staffTip), gnd = { x: tp.x, y: gy - 4 };
        ctx.save(); ctx.globalCompositeOperation = 'lighter'; glowAt(ctx, tp.x, tp.y - 8, 34, '200,138,255', 0.5 * fx.planted); ctx.restore();
        if (fx.spines > 0.02) { ctx.save(); ctx.translate(gnd.x, gnd.y); ctx.scale(1, 0.34); ctx.lineWidth = 5; for (i = 0; i < 2; i++) { var rp = ((t / 900) + i / 2) % 1, rr = 40 + 330 * rp; ctx.strokeStyle = 'rgba(200,138,255,' + (0.6 * (1 - rp) * fx.spines).toFixed(2) + ')'; ctx.beginPath(); ctx.arc(0, 0, rr, 0, TAU); ctx.stroke(); } ctx.restore(); }
      }
      if (fx.dash > 0.02) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.lineCap = 'round'; for (i = 0; i < 8; i++) { var vy = py - hv - 90 + i * 24 + pr(i + 660) * 8, vl = 90 + 70 * pr(i + 670); ctx.strokeStyle = 'rgba(255,200,130,' + (0.55 * fx.dash).toFixed(2) + ')'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(px - f * 120, vy); ctx.lineTo(px - f * (120 + vl), vy); ctx.stroke(); } ctx.restore(); }
      if (fx.nova > 0.02) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.lineWidth = 6; for (i = 0; i < 3; i++) { var np2 = ((t / 800) + i / 3) % 1; ctx.strokeStyle = 'rgba(255,120,40,' + (0.55 * (1 - np2) * fx.nova).toFixed(3) + ')'; ctx.beginPath(); ctx.arc(core.x, core.y, 30 + np2 * 170, 0, TAU); ctx.stroke(); } glowAt(ctx, core.x, core.y, 60, '255,242,176', 0.55 * fx.nova); ctx.restore(); }
      if (fx.slam > 0.02) { var sg = { x: hr.x + f * 10, y: gy - 6 }; ctx.save(); ctx.translate(sg.x, sg.y); ctx.scale(1, 0.34); ctx.lineWidth = 8; for (i = 0; i < 2; i++) { var sp2 = ((t / 500) + i / 2) % 1; ctx.strokeStyle = 'rgba(255,200,130,' + (0.8 * (1 - sp2) * fx.slam).toFixed(2) + ')'; ctx.beginPath(); ctx.arc(0, 0, 20 + sp2 * 150, 0, TAU); ctx.stroke(); } ctx.restore(); ctx.save(); ctx.globalAlpha = Math.min(1, fx.slam * 1.5); for (i = 0; i < 6; i++) { var dd = ((t / 500) + i / 6) % 1, da = i / 6 * TAU; ctx.fillStyle = i % 2 ? '#6a6272' : '#4a4452'; ctx.strokeStyle = OLC; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.arc(sg.x + cos(da) * (24 + dd * 60), sg.y + sin(da) * (24 + dd * 60) * 0.34 - dd * 10, 5 * (1 - dd * 0.5), 0, TAU); ctx.fill(); ctx.stroke(); } ctx.restore(); }
      if (fx.rain > 0.02) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.lineCap = 'round'; for (i = 0; i < 8; i++) { var rp2 = ((t / 700) + i / 8) % 1, rx2 = px - 150 + pr(i + 680) * 300; ctx.strokeStyle = 'rgba(255,' + (150 + 40 * (i % 2)) + ',60,' + (0.7 * fx.rain * (1 - rp2 * 0.5)).toFixed(2) + ')'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(rx2, py - hv - 230 + rp2 * 90); ctx.lineTo(rx2 + 6, py - hv - 200 + rp2 * 110); ctx.stroke(); } glowAt(ctx, px, py - hv - 190, 70, '255,140,50', 0.5 * fx.rain, 40); ctx.restore(); }
      if (fx.voice > 0.02 || fx.roar > 0.02) {
        var vk = s.voice != null ? s.voice : Math.floor(t / 600) % 3, vc = ['154,255,122', '191,228,255', '255,245,138'][vk % 3]; ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.lineWidth = 4;
        for (i = 0; i < 3; i++) { var vp = ((t / 700) + i / 3) % 1; ctx.strokeStyle = 'rgba(' + (fx.roar ? '255,200,140' : vc) + ',' + (0.7 * (1 - vp) * Math.max(fx.voice || 0, fx.roar || 0)).toFixed(3) + ')'; ctx.beginPath(); ctx.arc(mouth.x + f * (10 + vp * 30), mouth.y, 14 + vp * 80, f > 0 ? -1 : PI - 1, f > 0 ? 1 : PI + 1); ctx.stroke(); }
        ctx.restore();
      }
      if (fx.bite > 0.02) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.lineCap = 'round'; for (i = 0; i < 4; i++) { ctx.strokeStyle = 'rgba(200,255,240,' + (0.6 * fx.bite).toFixed(2) + ')'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(head.x - f * (30 + i * 8), head.y - 18 + i * 12); ctx.lineTo(head.x - f * (80 + i * 10), head.y - 18 + i * 12); ctx.stroke(); } ctx.restore(); }
      if (fx.lash > 0.02) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.lineCap = 'round'; var la1 = f > 0 ? PI - 1.1 : -0.2, la2 = f > 0 ? PI + 1.1 : 1.3; for (i = 0; i < 3; i++) { ctx.strokeStyle = 'rgba(200,190,230,' + (0.5 * fx.lash * (1 - i * 0.25)).toFixed(3) + ')'; ctx.lineWidth = 14 - i * 4; ctx.beginPath(); ctx.arc(body.x, body.y + 30, 190 - i * 12, Math.min(la1, la2), Math.max(la1, la2)); ctx.stroke(); } ctx.restore(); }
      if (fx.frost > 0.02) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; glowAt(ctx, body.x, body.y, 150, '191,228,255', 0.28 * fx.frost, 110); ctx.restore(); ctx.save(); ctx.strokeStyle = 'rgba(235,248,255,0.8)'; ctx.lineWidth = 1.6; for (i = 0; i < 6; i++) { var fa = t / 1000 + i * TAU / 6, fr2 = 80 + 70 * ((i / 6 + t / 3000) % 1); ctx.save(); ctx.translate(body.x + cos(fa) * fr2, body.y + sin(fa) * fr2 * 0.6); ctx.rotate(fa); ctx.beginPath(); ctx.moveTo(-5, 0); ctx.lineTo(5, 0); ctx.moveTo(0, -5); ctx.lineTo(0, 5); ctx.stroke(); ctx.restore(); } ctx.restore(); }
      if (fx.wind > 0.02) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.lineCap = 'round'; [hr, hl].forEach(function (h, k) { for (var q = 0; q < 3; q++) { var wd2 = ((t / 450) + q / 3 + k * 0.2) % 1; ctx.strokeStyle = 'rgba(220,240,255,' + (0.6 * fx.wind * (1 - wd2)).toFixed(2) + ')'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(h.x + f * wd2 * 80, h.y - 8 + q * 14 - 14); ctx.lineTo(h.x + f * (wd2 * 80 + 40), h.y - 8 + q * 14 - 14); ctx.stroke(); } }); ctx.restore(); }
      if (fx.horn > 0.02) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.lineCap = 'round'; ctx.strokeStyle = 'rgba(255,230,200,' + (0.55 * fx.horn).toFixed(2) + ')'; ctx.lineWidth = 4; for (i = -1; i <= 1; i++) { ctx.beginPath(); ctx.moveTo(head.x + f * 40, head.y + 4); ctx.lineTo(head.x + f * (120 + 30 * fx.horn), head.y + 4 + i * 30); ctx.stroke(); } ctx.restore(); }
      if (fx.rings > 0.02) { ctx.save(); ctx.translate(px, gy - 8); ctx.scale(1, 0.4); ctx.strokeStyle = 'rgba(255,210,74,0.55)'; ctx.lineWidth = 5; ctx.setLineDash([16, 10]); ctx.lineDashOffset = -t / 26; for (i = 1; i <= 3; i++) { ctx.beginPath(); hexP(ctx, 0, 0, 80 * i + 6 * sin(t / 300 + i), 0); ctx.stroke(); } ctx.restore(); }
      if (fx.thrust > 0.02) { var ta = s.aim || 0; ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.lineCap = 'round'; for (i = 0; i < 3; i++) { ctx.strokeStyle = 'rgba(255,' + (210 - i * 30) + ',90,' + (0.5 * fx.thrust * (1 - i * 0.28)).toFixed(3) + ')'; ctx.lineWidth = 12 - i * 3.6; ctx.beginPath(); ctx.moveTo(hr.x, hr.y); ctx.lineTo(hr.x - cos(ta) * (130 - i * 20), hr.y - sin(ta) * (130 - i * 20)); ctx.stroke(); } glowAt(ctx, hr.x, hr.y, 20, '255,230,160', 0.7 * fx.thrust); ctx.restore(); }
      if (fx.sun > 0.02) { var sc = 150 * (0.5 + 0.5 * fx.sun), sg2 = A.sprite('fx_sol_pulse', fx.sun > 0.6 ? 1 : 0), sx = px + f * L.head.x * 0.6, sy2 = py - hv - 210; ctx.save(); ctx.globalCompositeOperation = 'lighter'; glowAt(ctx, sx, sy2, sc * 0.8, '255,200,100', 0.6); ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = 0.95; ctx.drawImage(sg2, sx - sc, sy2 - sc, sc * 2, sc * 2); ctx.restore(); }
      if (fx.pulse > 0.02 && s.sp != null) { var pq = clamp(s.sp, 0, 1), pR = lerp(60, 340, pq), ps = A.sprite('fx_sol_pulse', pq < 0.5 ? 2 : 3), pd = pR * 2 * (128 / 104); ctx.save(); ctx.globalAlpha = 1 - pq * 0.7; ctx.drawImage(ps, body.x - pd / 2, body.y + 40 - pd / 2, pd, pd); ctx.restore(); }
      // rosario: cuentas de brasa orbitando (restantes = links; ejecutadas = apagadas)
      var ch = s.chain, nb = ch && ch.links ? ch.links.length : 6;
      if (fx.beads > 0.02 || (ch && ch.announce > 0)) {
        ctx.save();
        for (i = 0; i < nb; i++) {
          var li = ch && ch.links ? ch.links[i] : i + 1, ba2 = t / 900 + i * TAU / nb, bxx = body.x + cos(ba2) * 150, byy = body.y + 10 + sin(ba2) * 56, dn = ch && ch.done > i;
          ctx.fillStyle = OLC; ctx.beginPath(); ctx.arc(bxx, byy, 9, 0, TAU); ctx.fill(); ctx.fillStyle = dn ? '#4a4452' : LINKC[li - 1]; ctx.beginPath(); ctx.arc(bxx, byy, 6.4, 0, TAU); ctx.fill();
          if (!dn) { ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.arc(bxx - 2, byy - 2, 1.8, 0, TAU); ctx.fill(); }
        }
        ctx.restore();
      }
      // glifos de la cadena sobre la cabeza (Anuncio: aparecen uno a uno)
      if (ch && ch.links && ch.links.length) {
        var an = ch.announce == null ? 1 : clamp(ch.announce, 0, 1), n = ch.links.length, gx0 = px + f * L.glyphs.x, gy0 = py + L.glyphs.y - hv - 6, step = 46;
        for (i = 0; i < n; i++) {
          var li2 = ch.links[i], al = clamp(an * n - i, 0, 1), dn2 = ch.done > i, cur = ch.done === i, sc2 = 0.74 + (cur ? 0.1 * sin(t / 120) : 0) + (1 - al) * 0.4;
          if (al <= 0) continue; var gs = A.sprite('fx_cenizar_glyph', (dn2 ? 6 : 0) + li2 - 1), gw = gs.width * sc2 * 0.5; ctx.save(); ctx.globalAlpha = al * (dn2 ? 0.7 : 1); ctx.drawImage(gs, gx0 + (i - (n - 1) / 2) * step - gw / 2, gy0 - gw / 2, gw, gw); ctx.restore();
        }
      }
      // numeros de eslabon sobre las Reliquias que siguen ardiendo (F7)
      if (ph >= 7 && s.linkNums !== false && !P.relicsGone) {
        RELICS.forEach(function (id) {
          if (relicSt(s, id) !== 'burning') return; var an2 = id === 'cayado' ? L.staff : L[id], gp = G(an2), gs2 = A.sprite('fx_cenizar_glyph', RELIC_LINK[id] - 1), sz = 26;
          ctx.save(); ctx.globalAlpha = 0.9; ctx.drawImage(gs2, gp.x - sz / 2, gp.y - 38 - sz / 2 + 2 * sin(t / 200 + RELIC_LINK[id]), sz, sz); ctx.restore();
        });
      }
    }
    // aro de ventana (blanco azulado) y cupula de brasas (puerta)
    if (s.exposed && !dying) {
      ctx.save(); ctx.globalAlpha = 0.85; ctx.translate(px, gy - 6); ctx.scale(1, 0.4); var Wd = 330 * (1 + 0.05 * sin(t / 150));
      ctx.strokeStyle = OLC; ctx.lineWidth = 8; ctx.beginPath(); ctx.arc(0, 0, Wd / 2, 0, TAU); ctx.stroke(); ctx.strokeStyle = '#dff4ff'; ctx.lineWidth = 5; ctx.setLineDash([22, 12]); ctx.lineDashOffset = -t / 22; ctx.beginPath(); ctx.arc(0, 0, Wd / 2, 0, TAU); ctx.stroke(); ctx.setLineDash([]);
      ctx.strokeStyle = 'rgba(160,215,255,0.7)'; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.arc(0, 0, Wd / 2 - 12, 0, TAU); ctx.stroke(); ctx.restore();
    }
    if (s.immune && !dying) { ctx.save(); ctx.globalAlpha = 0.55 + 0.25 * sin(t / 100); ctx.drawImage(shieldCv(), px - 210, py - hv - 170); ctx.restore(); }
    if (s.stun && !dying) { for (i = 0; i < 3; i++) { var sa2 = t / 380 + i * TAU / 3; miniStar(ctx, head.x + cos(sa2) * 52, head.y - 40 + sin(sa2) * 12, 6.4, t / 300 + i, '#ffc94a'); } }
    if (dying) cDeathFront(ctx, px, py, s, P, R, f, dt);
  }
  function cDeathFront(ctx, px, py, s, P, R, f, dt) {
    var i, br = s.broken || {}, L = R.layout || cLayout(P, s);
    function Wq(lx, ly) { return { x: px + f * lx, y: py + ly }; }
    // las Reliquias salen despedidas a los 500 ms (las rotas ya no estan)
    if (dt >= 500 && dt < 3000) {
      var tm = (dt - 500) / 1000, al = 1 - clamp((dt - 2400) / 600, 0, 1);
      RELICS.forEach(function (id, k) {
        if (br[id]) return; var an = id === 'cayado' ? { x: 110, y: -30 } : (id === 'nucleo' ? { x: 40, y: -16 } : (id === 'ojo' ? { x: 24, y: -100 } : (id === 'colmillo' ? { x: -96, y: -98 } : { x: 24, y: -152 })));
        var vx = (k - 2) * 90, vy = -330 - k * 20, g = 1000, gnd = GY - 18, yy = an.y + vy * tm + 0.5 * g * tm * tm, xx = an.x + vx * tm, rot = tm * (4 + k);
        if (yy >= gnd) { var tl = (-vy + Math.sqrt(vy * vy - 2 * g * (an.y - gnd))) / g, tb = tm - tl; xx = an.x + vx * tl + 20 * (k - 2) * (1 - Math.exp(-tb * 4)); yy = gnd - Math.abs(sin(tb * 7)) * 18 * Math.exp(-tb * 3.4); rot = 0.2 * (k - 2); }
        var q2 = Wq(xx, yy); ctx.save(); ctx.globalAlpha = al; drawRelicSpr(ctx, id, 'off', q2.x, q2.y, rot * f, 1, 0); ctx.restore();
      });
    }
    // disolucion en ceniza: cada celda cae como ceniza o brasa
    if (dt >= 1800 && R.mask) {
      var mask = R.mask, uu = clamp((dt - 1800) / 1500, 0, 1.2), ox2 = -MC * CELL / 2, oy2 = -190, fade = 1 - clamp((dt - 3200) / 700, 0, 1), j, ii;
      for (j = 0; j < MR; j++) for (ii = 0; ii < MC; ii++) {
        if (!mask[j * MC + ii]) continue; var th = cellTh(ii, j); if (uu <= th) continue;
        var tc = (uu - th) * 1500 / 1000, cxl = ox2 + ii * CELL + CELL / 2, cyl = oy2 + j * CELL + CELL / 2, vy0 = -30 * pr(ii * 3 + j);
        var gnd = GY - 6 - pr(ii + j * 5) * 12, ember = pr(ii * 11 + j * 3) < 0.22, yy2 = ember ? cyl + vy0 * tc * 2.4 - 60 * tc * tc : Math.min(cyl + vy0 * tc + 360 * tc * tc, gnd), xx2 = cxl + (pr(ii * 2 + j) - 0.5) * 60 * Math.min(tc, 0.8) + (ember ? sin(tc * 5 + ii) * 8 : 0);
        var wq2 = Wq(xx2, yy2), landed2 = !ember && yy2 >= gnd, sz = CELL * (0.45 + pr(ii * 5 + j * 3) * 0.3) * (ember ? Math.max(0.2, 1 - tc * 0.7) : 1);
        ctx.save(); ctx.globalAlpha = ember ? clamp(1 - tc * 0.55, 0, 1) * fade : (landed2 ? fade * 0.95 : 0.95); ctx.translate(wq2.x, wq2.y); ctx.rotate(landed2 ? (pr(ii + j) - 0.5) : tc * 3 * (pr(ii) - 0.5));
        ctx.fillStyle = ember ? ((ii + j) % 2 ? C.emberH : C.ember) : ((ii + j) % 3 ? '#5c5468' : '#3a3440'); ctx.strokeStyle = OLC; ctx.lineWidth = ember ? 0.8 : 1.3; ctx.beginPath(); ctx.rect(-sz / 2, -sz / 2, sz, sz * 0.8); if (!ember) ctx.stroke(); ctx.fill(); ctx.restore();
      }
    }
    // la ultima brasa: queda en el pecho, parpadea y se apaga (lore: la brasa que no se apagaba)
    if (dt >= 1500 && dt < CDEATH) {
      var ca = Wq(-12, 32 + 26 * ease((dt - 500) / 1300)), ba = dt < 3300 ? 1 : 1 - clamp((dt - 3300) / 700, 0, 1), fl = 0.7 + 0.3 * sin(dt / 70) * pr(Math.floor(dt / 90));
      ctx.save(); ctx.globalCompositeOperation = 'lighter'; glowAt(ctx, ca.x, ca.y + (dt > 1800 ? (GY - 40 - ca.y) * ease((dt - 1800) / 1200) : 0), 30 * fl, '255,150,40', 0.8 * ba); ctx.restore();
      ctx.save(); ctx.globalAlpha = ba; ctx.fillStyle = C.coreS; var by0 = ca.y + (dt > 1800 ? (GY - 40 - ca.y) * ease((dt - 1800) / 1200) : 0); ctx.beginPath(); ctx.arc(ca.x, by0, 3.4 * fl, 0, TAU); ctx.fill(); ctx.restore();
    }
    // humo gris que sube al final
    if (dt >= 3000) { var sp4 = (dt - 3000) / 1000; ctx.save(); for (i = 0; i < 5; i++) { var q3 = Wq(-30 + i * 20, GY - 20 - sp4 * (50 + 20 * i)); ctx.globalAlpha = 0.5 * (1 - sp4); ctx.fillStyle = '#6a6272'; ctx.beginPath(); ctx.arc(q3.x, q3.y, 8 + sp4 * 12, 0, TAU); ctx.fill(); } ctx.restore(); }
    // destello de rotura de la corona al caer cada gema
    if (dt >= 200 && dt < 1400) { var gi2 = Math.floor((dt - 200) / 170); if (gi2 >= 0 && gi2 < 5 && L.tips) { var tp = L.tips[4 - gi2 < 0 ? 0 : 4 - gi2]; if (tp) { var pp2 = ((dt - 200) % 170) / 170, g2 = Wq(tp.x, tp.y - P.hover); ctx.save(); ctx.globalCompositeOperation = 'lighter'; sparkle(ctx, g2.x, g2.y, 10 * (1 - pp2) + 3, TIPC[4 - gi2 < 0 ? 0 : 4 - gi2]); ctx.restore(); } } }
  }

  // ================================================================= VFX en funciones (dibujan en ctx, coordenadas de juego)
  // glifo numerado de la cadena: (x,y) centro. n 1-6; o.state 'active'|'done'; o.size final px (por defecto 40); o.alpha; o.t (pulso)
  A.drawCenizarGlyph = function (ctx, x, y, n, o) {
    o = o || {}; n = clamp(n | 0, 1, 6); var sz = o.size || 40, dn = o.state === 'done', t = o.t != null ? o.t : performance.now(), sp = A.sprite('fx_cenizar_glyph', (dn ? 6 : 0) + n - 1), k = 1 + (o.pulse && !dn ? 0.08 * sin(t / 120) : 0);
    ctx.save(); if (o.alpha != null) ctx.globalAlpha = o.alpha; ctx.drawImage(sp, x - sz * k / 2, y - sz * k / 2, sz * k, sz * k); ctx.restore();
  };
  // contorno fantasma de eslabon de cadena. link 1-6 (color del jefe original); shape: 'lane' {w,len,a} | 'circle' {r} | 'cone' {r,arc,a} | 'donut' {r,inner} | 'hexring' {R,th,gaps,gapHalf} | 'wave' {w,len,a,gap}
  // o: {alpha 0.25 (fantasma) .. 0.9, solid (ultimo 30%: contorno continuo), num (numero sobre la zona, por defecto true), gx, gy (posicion del numero), t}
  A.drawChainGhost = function (ctx, link, shape, x, y, o) {
    o = o || {}; var col = LINKC[clamp(link | 1, 1, 6) - 1], al = o.alpha == null ? 0.25 : o.alpha, solid = !!o.solid, t = o.t != null ? o.t : performance.now(), path = new Path2D(), a = o.a || 0, gx = x, gy = y, i;
    if (shape === 'lane' || shape === 'wave') {
      var w = o.w || 100, len = o.len || 560, ca = cos(a), sa = sin(a), h = w / 2; path.moveTo(x - sa * h, y + ca * h); path.lineTo(x - sa * h + ca * len, y + ca * h + sa * len); path.lineTo(x + sa * h + ca * len, y - ca * h + sa * len); path.lineTo(x + sa * h, y - ca * h); path.closePath();
      if (shape === 'wave' && o.gap) { var gcx = x + ca * len * 0.5, gcy = y + sa * len * 0.5; gx = gcx; gy = gcy; }
      else { gx = x + ca * len * 0.5; gy = y + sa * len * 0.5; }
    } else if (shape === 'circle') { path.arc(x, y, o.r || 90, 0, TAU); }
    else if (shape === 'cone') { var cr = o.r || 420, arc = o.arc || 40 * PI / 180; path.moveTo(x, y); path.arc(x, y, cr, a - arc / 2, a + arc / 2); path.closePath(); gx = x + cos(a) * cr * 0.55; gy = y + sin(a) * cr * 0.55; }
    else if (shape === 'donut') { path.arc(x, y, o.r || 330, 0, TAU); path.moveTo(x + (o.inner || 120), y); path.arc(x, y, o.inner || 120, 0, TAU, true); gy = y - (o.inner || 120) * 0.5 - ((o.r || 330) - (o.inner || 120)) * 0.0; }
    else if (shape === 'hexring') {
      var R = o.R || 160, th = o.th || 32, gaps = o.gaps || [], gh = o.gapHalf || 0.26, N = 120, apo = R * cos(PI / 6);
      var rad = function (ang) { var m = ((ang % (PI / 3)) + PI / 3) % (PI / 3) - PI / 6; return apo / cos(m); };
      var inGap = function (ang) { for (var g = 0; g < gaps.length; g++) { var d = Math.abs(((ang - gaps[g] + PI * 3) % TAU) - PI); if (d < gh) return true; } return false; };
      [0, 1].forEach(function (side) { var pen = false; for (i = 0; i <= N; i++) { var ang = i / N * TAU; if (inGap(ang)) { pen = false; continue; } var rr = rad(ang) + (side ? -th / 2 : th / 2); path[pen ? 'lineTo' : 'moveTo'](x + cos(ang) * rr, y + sin(ang) * rr); pen = true; } });
      gx = x + R; gy = y;
    }
    if (o.gx != null) gx = o.gx; if (o.gy != null) gy = o.gy;
    ctx.save(); ctx.lineJoin = 'round'; ctx.globalAlpha = al;
    ctx.strokeStyle = 'rgba(27,17,36,0.7)'; ctx.lineWidth = 6; ctx.stroke(path);
    ctx.strokeStyle = col; ctx.lineWidth = 3; if (!solid) { ctx.setLineDash([12, 9]); ctx.lineDashOffset = -t / 40; } ctx.stroke(path); ctx.setLineDash([]);
    ctx.restore();
    if (o.num !== false) A.drawCenizarGlyph(ctx, gx, gy, link, { size: o.size || 36, alpha: Math.min(1, al + 0.35), t: t, pulse: solid });
  };
  // Reliquia suelta (mundo/HUD): (x,y) centro. o.state 'active'|'off'|'burning'|'broken'; o.scale (1 = tamano del sprite final / 2 -> use 2 para el final); o.hp 0..1 (medidor de rotura: anillo alrededor); o.t; o.link (numero pequeno encima si burning)
  A.drawRelic = function (ctx, id, x, y, o) {
    o = o || {}; var st = o.state || 'active', t = o.t != null ? o.t : performance.now(), sc = o.scale == null ? 1 : o.scale, sp = A.sprite('reliq_' + id, st === 'off' ? 1 : (st === 'broken' ? 2 : 0)), w = sp.width * sc * 0.5 * 2, h = sp.height * sc * 0.5 * 2;
    w = sp.width * sc; h = sp.height * sc; var colr = id === 'ojo' ? '79,240,208' : (id === 'colmillo' ? '191,228,255' : (id === 'nucleo' ? '255,242,176' : '255,170,70'));
    ctx.save(); if (o.alpha != null) ctx.globalAlpha = o.alpha;
    if (st === 'active' || st === 'burning') { ctx.globalCompositeOperation = 'lighter'; var gr = Math.max(w, h) * (0.8 + 0.06 * sin(t / 160)); ctx.globalAlpha *= st === 'active' ? 0.6 : 0.35; ctx.drawImage(glowSpr(colr), x - gr, y - gr, gr * 2, gr * 2); ctx.globalAlpha = o.alpha == null ? 1 : o.alpha; ctx.globalCompositeOperation = 'source-over'; }
    ctx.drawImage(sp, x - w / 2, y - h / 2, w, h);
    if (o.hp != null && st === 'active') { var rr = Math.max(w, h) * 0.62 + 4, hp0 = clamp(o.hp, 0, 1); ctx.lineCap = 'round'; ctx.strokeStyle = 'rgba(27,17,36,0.7)'; ctx.lineWidth = 5; ctx.beginPath(); ctx.arc(x, y, rr, 0, TAU); ctx.stroke(); ctx.strokeStyle = hp0 > 0.3 ? '#fff2b0' : '#ffb04a'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(x, y, rr, -PI / 2, -PI / 2 + TAU * hp0); ctx.stroke(); }
    if (st === 'burning' && o.link) A.drawCenizarGlyph(ctx, x, y - h / 2 - 16, o.link, { size: 24, t: t });
    ctx.restore();
  };
  // rotura de una Reliquia: (x,y) = ancla, p 0..1 (~800 ms); kind 'cayado'|'nucleo'|'ojo'|'colmillo'|'corona'|'core'
  A.drawCenizarShards = function (ctx, x, y, p, o) {
    o = o || {}; p = clamp(p, 0, 1); var n = o.n || 9, i, kind = o.kind || 'nucleo', al = 1 - clamp((p - 0.6) / 0.4, 0, 1), set = { cayado: [4, 4, 1], nucleo: [0, 1, 0], ojo: [5, 0, 5], colmillo: [3, 3, 0], corona: [2, 2, 1], core: [1, 0, 1] }[kind] || [0, 1, 0];
    ctx.save(); ctx.globalAlpha = al;
    for (i = 0; i < n; i++) { var a = pr(i + 3) * TAU, sp = 90 + pr(i + 9) * 150, px = x + cos(a) * sp * p, py = y + sin(a) * sp * p - 60 * p + 260 * p * p, sf = A.sprite('fx_cenizar_chip', set[i % 3]), sz = 22 * (0.7 + pr(i + 20) * 0.7); ctx.save(); ctx.translate(px, py); ctx.rotate(p * 6 * (pr(i) - 0.5) * 2); ctx.drawImage(sf, -sz / 2, -sz / 2, sz, sz); ctx.restore(); }
    var bs = A.sprite('fx_cenizar_shatter', Math.min(4, Math.floor(p * 5))); ctx.globalAlpha = 1; ctx.drawImage(bs, x - 64, y - 64, 128, 128); ctx.restore();
  };
  // anillo circular de oleada con huecos (Exodo de Cenizas F2 = espinas, Invierno F5 = hielo/brasa): (x,y) centro, R radio, o.state 'idle'|'warn'|'hit', o.p 0..1,
  // o.gaps [rad,...] (centros), o.gapHalf (0,39 = 45 grados), o.th 22, o.style 'spine'|'ice'|'ember', o.alpha, o.t. Marcas blancas en los bordes de cada hueco.
  A.drawEmberRing = function (ctx, x, y, R, o) {
    o = o || {}; var st = o.state || 'warn', p = o.p == null ? 1 : clamp(o.p, 0, 1), th = o.th || 22, gh = o.gapHalf == null ? 0.39 : o.gapHalf, gaps = o.gaps || [], style = o.style || 'spine', al = o.alpha == null ? 1 : o.alpha, t = o.t != null ? o.t : performance.now(), i;
    function inGap(ang) { for (var g = 0; g < gaps.length; g++) { var d = Math.abs(((ang - gaps[g] + PI * 3) % TAU) - PI); if (d < gh) return true; } return false; }
    var tint = style === 'ice' ? ['191,228,255', '#bfe4ff'] : (style === 'ember' ? ['255,120,40', '#ffb060'] : ['200,138,255', '#dca0ff']);
    var cols = st === 'hit' ? ['rgba(255,240,220,0.95)', 'rgba(255,90,70,0.85)'] : (st === 'warn' ? ['rgba(255,59,48,' + (0.2 + 0.32 * p).toFixed(2) + ')', 'rgba(' + tint[0] + ',0.95)'] : ['rgba(' + tint[0] + ',0.18)', 'rgba(' + tint[0] + ',0.6)']);
    ctx.save(); ctx.globalAlpha = al; ctx.lineCap = 'butt';
    var segs = [], a0 = null; for (i = 0; i <= 160; i++) { var ang = i / 160 * TAU, ok = !inGap(ang + 1e-4); if (ok && a0 == null) a0 = ang; if (!ok && a0 != null) { segs.push([a0, ang]); a0 = null; } } if (a0 != null) segs.push([a0, TAU]);
    for (var pass = 0; pass < 3; pass++) {
      ctx.strokeStyle = pass === 0 ? cols[0] : (pass === 1 ? 'rgba(27,17,36,0.55)' : cols[1]); ctx.lineWidth = pass === 0 ? th : (pass === 1 ? 6 : 3); if (pass === 2 && st !== 'hit' && p < 0.75) { ctx.setLineDash([12, 8]); ctx.lineDashOffset = -t / 40; }
      segs.forEach(function (sg) { if (pass === 0) { ctx.beginPath(); ctx.arc(x, y, R, sg[0], sg[1]); ctx.stroke(); } else { ctx.beginPath(); ctx.arc(x, y, R + th / 2, sg[0], sg[1]); ctx.stroke(); ctx.beginPath(); ctx.arc(x, y, R - th / 2, sg[0], sg[1]); ctx.stroke(); } });
      ctx.setLineDash([]);
    }
    ctx.fillStyle = 'rgba(255,255,255,0.9)'; ctx.strokeStyle = OLC; ctx.lineWidth = 1.4;
    gaps.forEach(function (g) { for (var s2 = -1; s2 <= 1; s2 += 2) { var ag = g + s2 * gh; ctx.beginPath(); ctx.arc(x + cos(ag) * R, y + sin(ag) * R, 4, 0, TAU); ctx.fill(); ctx.stroke(); } });
    ctx.restore();
  };
  // charco de ceniza viva (F1): (x,y) centro; o.r 40 (radio de dano), o.age 0..1 (de 5 s), o.ignite 0..1 (Fuego lo limpia: destello + humo), o.alpha, o.t
  A.drawAshPuddle = function (ctx, x, y, o) {
    o = o || {}; var r = o.r || 40, age = clamp(o.age || 0, 0, 1), t = o.t != null ? o.t : performance.now(), fr = age < 0.12 ? 0 : (age < 0.75 ? 1 : 2), sp = A.sprite('fx_ash_puddle', fr), d = r * 2 * (72 / 62), al = (o.alpha == null ? 1 : o.alpha) * (age > 0.85 ? 1 - (age - 0.85) / 0.15 * 0.6 : 1);
    ctx.save(); ctx.globalAlpha = al; ctx.drawImage(sp, x - d / 2, y - d / 2 * 0.86, d, d * 0.86);
    if (age < 0.8) { ctx.fillStyle = C.emberH; for (var i = 0; i < 3; i++) { var a = t / 600 + i * 2.1; ctx.globalAlpha = al * 0.7 * (0.5 + 0.5 * sin(t / 200 + i)); ctx.fillRect(x + cos(a) * r * 0.5 - 1, y + sin(a) * r * 0.4 - 1, 2, 2); } }
    if (o.ignite > 0) { var ig = clamp(o.ignite, 0, 1); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = 0.8 * (1 - ig); ctx.drawImage(glowSpr('255,170,60'), x - r * 1.2, y - r * 0.9, r * 2.4, r * 1.8); ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = 0.5 * (1 - ig); ctx.fillStyle = '#9a8f84'; for (i = 0; i < 4; i++) { ctx.beginPath(); ctx.arc(x + (i - 1.5) * r * 0.4, y - ig * 26 - i * 3, 6 + ig * 8, 0, TAU); ctx.fill(); } }
    ctx.restore();
  };
  // pilar de ceniza (r 28): igual que drawIcePillar/drawWaxPillar. o {hp 0..1, rebuild 0..1, struck, alpha}; ancla de colision (final) (28,82): se dibuja en (x-28, y-82). Ordenar por y+12
  A.drawAshPillar = function (ctx, x, y, o) {
    o = o || {}; var hp = o.hp == null ? 1 : o.hp, fr = hp > 0.5 ? 0 : hp > 0 ? 1 : 2, sp = A.sprite('obs_ash_pillar', fr);
    ctx.save(); if (o.alpha != null) ctx.globalAlpha = o.alpha;
    if (fr === 2 && o.rebuild > 0) { ctx.strokeStyle = 'rgba(255,106,26,' + (0.5 + 0.4 * o.rebuild) + ')'; ctx.lineWidth = 2; ctx.setLineDash([4, 4]); ctx.beginPath(); ctx.ellipse(x, y + 10, 28, 24, 0, 0, TAU); ctx.stroke(); ctx.setLineDash([]); ctx.globalAlpha = 0.25 * o.rebuild; ctx.drawImage(A.sprite('obs_ash_pillar', 0), x - 28, y - 82); }
    else { ctx.drawImage(sp, x - 28, y - 82); if (o.struck) { ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = 0.5; ctx.drawImage(sp, x - 28, y - 82); } }
    ctx.restore();
  };
  // ceniza viva ambiente (= drawFireflies en el bioma crater): copos grises y brasas que suben. o {count 30, quality 0|1|2 ('baja'|'media'|'alta'), view, intensity}
  A.drawAshFall = function (ctx, w, h, t, o) {
    o = o || {}; var q = o.quality === 'baja' || o.quality === 0 ? 0 : (o.quality === 'media' || o.quality === 1 ? 1 : 2), n = Math.round((o.count || 30) * (q === 2 ? 1 : q === 1 ? 0.5 : 0)) * (o.intensity == null ? 1 : o.intensity), i; if (n < 1) return; var v = o.view || { x: 0, y: 0 };
    ctx.save(); for (i = 0; i < n; i++) { var pp = ((t / (3600 + pr(i + 700) * 2400)) + pr(i + 710)) % 1, px = (pr(i + 720) * w + sin(pp * 5 + i) * 18 + v.x * 0) % w, py = h - pp * (h + 40) + 20, em = i % 5 === 0; ctx.globalAlpha = Math.sin(pp * PI) * (em ? 0.9 : 0.55); ctx.fillStyle = em ? '#ff9a3a' : '#9a92a6'; ctx.fillRect(px, py, em ? 2.4 : 3, em ? 2.4 : 3); } ctx.restore();
  };
  // cinco sellos de F7 (marcas en el suelo, uno por jefe vencido): o {cx 720, cy 405, R 300, ry 0.6, lit:[bool x5] (por defecto todos), t, alpha}
  A.drawCraterSeals = function (ctx, o) {
    o = o || {}; var cx = o.cx == null ? 720 : o.cx, cy = o.cy == null ? 405 : o.cy, R = o.R || 300, ry = o.ry || 0.6, lit = o.lit || [1, 1, 1, 1, 1], t = o.t != null ? o.t : performance.now(), i;
    ctx.save(); if (o.alpha != null) ctx.globalAlpha = o.alpha;
    for (i = 0; i < 5; i++) {
      var a = -PI / 2 + i * TAU / 5, px = cx + cos(a) * R, py = cy + sin(a) * R * ry, on = !!lit[i], col = TIPC[i];
      ctx.save(); ctx.translate(px, py); ctx.scale(1, ry + 0.2);
      ctx.strokeStyle = 'rgba(27,17,36,0.7)'; ctx.lineWidth = 7; ctx.beginPath(); ctx.arc(0, 0, 36, 0, TAU); ctx.stroke(); ctx.strokeStyle = on ? col : '#5a5266'; ctx.globalAlpha *= on ? 0.55 + 0.2 * sin(t / 400 + i) : 0.5; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(0, 0, 36, 0, TAU); ctx.stroke();
      ctx.beginPath(); for (var k = 0; k < 5; k++) { var b = -PI / 2 + k * 2 * TAU / 5; ctx.lineTo(cos(b) * 26, sin(b) * 26); } ctx.closePath(); ctx.stroke(); ctx.restore();
      if (on) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = 0.28; ctx.drawImage(glowSpr(PHC[i === 0 ? 1 : i === 1 ? 2 : i === 2 ? 3 : i === 3 ? 4 : 5]), px - 50, py - 30, 100, 60); ctx.restore(); }
    }
    ctx.restore();
  };

  // ================================================================= TELEGRAFIAS NUEVAS
  var COLS5 = { red: { f: '255,59,48', s: '#ff6a5a' }, ember: { f: '255,120,40', s: '#ffb060' }, white: { f: '230,247,255', s: '#ffffff' }, gray: { f: '150,142,162', s: '#cfc8dc' } };
  var T5 = { barrido: 'red', faros: 'ember', islas: 'white', eco: 'red', sol: 'red', brasa: 'ember' };
  function tele5(ctx, kind, x, y, o) {
    o = o || {}; var p = o.p == null ? 1 : clamp(o.p, 0, 1), col = COLS5[o.color || T5[kind]], a = o.a || 0, t = o.t != null ? o.t : performance.now(), fix = o.fix != null ? o.fix : p >= 0.7, r = o.r || 100, path = new Path2D(), prog = new Path2D(), extra = null, i;
    if (kind === 'barrido') {   // Barra de Rescoldo: rectangulo w x len que gira `sweep` rad desde `a`; sp = progreso del giro (0..1) del golpe
      var w = o.w || 60, len = o.len || 520, sw = o.sweep == null ? 1.745 : o.sweep, sp = o.sp == null ? 0 : clamp(o.sp, 0, 1);
      path.moveTo(x, y); path.arc(x, y, len, a, a + sw); path.closePath(); prog.moveTo(x, y); prog.arc(x, y, Math.max(4, len * p), a, a + sw); prog.closePath();
      extra = function () {
        function bar(ang, al2) { ctx.save(); ctx.translate(x, y); ctx.rotate(ang); ctx.fillStyle = 'rgba(255,59,48,' + (0.2 * al2).toFixed(3) + ')'; ctx.fillRect(0, -w / 2, len, w); ctx.strokeStyle = 'rgba(255,255,255,' + (0.85 * al2).toFixed(2) + ')'; ctx.lineWidth = 2.4; ctx.strokeRect(0, -w / 2, len, w); ctx.restore(); }
        bar(a, 1); bar(a + sw, 0.55); if (sp > 0) bar(a + sw * sp, 1);
        ctx.strokeStyle = 'rgba(255,236,224,0.85)'; ctx.fillStyle = 'rgba(255,236,224,0.9)'; ctx.lineWidth = 2.4; ctx.beginPath(); ctx.arc(x, y, len * 0.7, a + 0.1, a + sw - 0.1); ctx.stroke(); var ea = a + sw - 0.1; ctx.beginPath(); ctx.moveTo(x + cos(ea) * len * 0.7 + cos(ea + PI / 2) * 10, y + sin(ea) * len * 0.7 + sin(ea + PI / 2) * 10); ctx.lineTo(x + cos(ea) * len * 0.7 - cos(ea + PI / 2) * 4 + cos(ea) * 9, y + sin(ea) * len * 0.7 - sin(ea + PI / 2) * 4 + sin(ea) * 9); ctx.lineTo(x + cos(ea) * len * 0.7 - cos(ea + PI / 2) * 4 - cos(ea) * 9, y + sin(ea) * len * 0.7 - sin(ea + PI / 2) * 4 - sin(ea) * 9); ctx.closePath(); ctx.fill();
      };
    } else if (kind === 'faros') {   // Exodo de Cenizas: cayado clavado en (x,y); faros en los huecos (o.gaps rad) sobre un anillo de radio r; o.dir +1/-1 giro; o.inv 0..1 aviso de inversion
      r = o.r || 360; var gaps = o.gaps || [], dir = o.dir || 1, inv = o.inv || 0;
      path.arc(x, y, r, 0, TAU); prog.arc(x, y, Math.max(1, r * p), 0, TAU);
      extra = function () {
        gaps.forEach(function (g, k) {
          var gx = x + cos(g) * r, gy = y + sin(g) * r; ctx.save(); ctx.translate(gx, gy); ctx.rotate(g);
          ctx.fillStyle = OLC; ctx.beginPath(); ctx.moveTo(0, -14); ctx.lineTo(12, 0); ctx.lineTo(0, 14); ctx.lineTo(-12, 0); ctx.closePath(); ctx.fill(); ctx.fillStyle = '#fff6c0'; ctx.beginPath(); ctx.moveTo(0, -10.4); ctx.lineTo(8.6, 0); ctx.lineTo(0, 10.4); ctx.lineTo(-8.6, 0); ctx.closePath(); ctx.fill();
          ctx.strokeStyle = 'rgba(255,246,192,0.7)'; ctx.lineWidth = 2; ctx.setLineDash([6, 6]); ctx.beginPath(); ctx.moveTo(-r * 0.6, 0); ctx.lineTo(-24, 0); ctx.stroke(); ctx.setLineDash([]);
          var d2 = inv > 0 ? -dir : dir, flash = inv > 0 ? 0.5 + 0.5 * sin(t / 70) : 1; ctx.rotate(PI / 2); ctx.fillStyle = inv > 0 ? 'rgba(255,255,255,' + (0.9 * flash).toFixed(2) + ')' : 'rgba(255,246,192,0.9)'; ctx.beginPath(); ctx.moveTo(d2 * 14, 26); ctx.lineTo(-d2 * 6, 20); ctx.lineTo(-d2 * 6, 32); ctx.closePath(); ctx.fill(); ctx.restore();
        });
        ctx.strokeStyle = 'rgba(230,200,255,0.9)'; ctx.fillStyle = 'rgba(176,90,240,0.45)'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(x, y + 8); ctx.lineTo(x, y - 40); ctx.stroke(); ctx.beginPath(); ctx.arc(x, y - 42, 8, 0, TAU); ctx.fill(); ctx.stroke();
      };
    } else if (kind === 'islas') {   // Requiem Abrasador: islas SEGURAS blanco azuladas (o.pts [{x,y,r}]); el resto es lava
      var pts = o.pts || [];
      pts.forEach(function (q, k) { var rr = q.r || r, pz = 0.92 + 0.08 * sin(t / 180 + k), hpth = new Path2D(); hpth.arc(q.x, q.y, rr * pz, 0, TAU); ctx.save(); ctx.fillStyle = 'rgba(230,247,255,' + (0.14 + 0.16 * p).toFixed(3) + ')'; ctx.fill(hpth); ctx.strokeStyle = 'rgba(27,17,36,0.5)'; ctx.lineWidth = 6; ctx.stroke(hpth); ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 3; ctx.setLineDash([14, 9]); ctx.lineDashOffset = t / 40; ctx.stroke(hpth); ctx.setLineDash([]); ctx.strokeStyle = 'rgba(230,247,255,0.8)'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(q.x - 10, q.y); ctx.lineTo(q.x - 2, q.y + 9); ctx.lineTo(q.x + 12, q.y - 9); ctx.stroke(); ctx.restore(); });
      return true;
    } else if (kind === 'eco') {   // Eco del Coro (F4): contorno punteado (circulo r, o cono si o.arc) en la posicion espejo; aviso lleno al final
      if (o.arc) { var arc = o.arc, R0 = o.r || 420; path.moveTo(x, y); path.arc(x, y, R0, a - arc / 2, a + arc / 2); path.closePath(); prog.moveTo(x, y); prog.arc(x, y, Math.max(2, R0 * p), a - arc / 2, a + arc / 2); prog.closePath(); } else { path.arc(x, y, r, 0, TAU); prog.arc(x, y, Math.max(1, r * p), 0, TAU); }
      extra = function () { ctx.save(); ctx.strokeStyle = 'rgba(255,255,255,0.7)'; ctx.lineWidth = 1.6; ctx.setLineDash([3, 7]); ctx.lineDashOffset = -t / 50; ctx.stroke(path); ctx.setLineDash([]); ctx.restore(); ctx.strokeStyle = 'rgba(255,255,255,0.85)'; ctx.lineWidth = 2; var q = 7; ctx.beginPath(); ctx.moveTo(x - q, y - q); ctx.lineTo(x + q, y + q); ctx.moveTo(x + q, y - q); ctx.lineTo(x - q, y + q); ctx.stroke(); };
      fix = o.fix != null ? o.fix : p >= 0.7;
    } else if (kind === 'sol') {   // Sol de Cenizar: rosquilla letal inner..r (por defecto 120..330) con la zona segura central
      var inner = o.inner == null ? 120 : o.inner; r = o.r || 330;
      path.arc(x, y, r, 0, TAU); path.moveTo(x + inner, y); path.arc(x, y, inner, 0, TAU, true); prog.arc(x, y, inner + (r - inner) * p, 0, TAU); prog.moveTo(x + inner, y); prog.arc(x, y, inner, 0, TAU, true);
      extra = function () {
        ctx.fillStyle = 'rgba(230,247,255,' + (0.1 + 0.08 * sin(t / 140)).toFixed(3) + ')'; ctx.beginPath(); ctx.arc(x, y, inner, 0, TAU); ctx.fill(); ctx.strokeStyle = 'rgba(230,247,255,0.95)'; ctx.lineWidth = 3; ctx.setLineDash([8, 6]); ctx.lineDashOffset = t / 40; ctx.beginPath(); ctx.arc(x, y, inner, 0, TAU); ctx.stroke(); ctx.setLineDash([]);
        ctx.strokeStyle = 'rgba(255,236,200,0.75)'; ctx.lineWidth = 2.2; ctx.lineCap = 'round'; for (var q = 0; q < 16; q++) { var ag = q * TAU / 16 + t / 2400, r1 = inner + 14, r2 = inner + 14 + (r - inner - 28) * p; ctx.beginPath(); ctx.moveTo(x + cos(ag) * r1, y + sin(ag) * r1); ctx.lineTo(x + cos(ag) * r2, y + sin(ag) * r2); ctx.stroke(); }
      };
    } else if (kind === 'brasa') {   // brasa sobre hoguera (F5): circulo naranja r 120
      r = o.r || 120; path.arc(x, y, r, 0, TAU); prog.arc(x, y, Math.max(1, r * p), 0, TAU);
      extra = function () { ctx.fillStyle = 'rgba(255,200,110,0.85)'; for (var q = 0; q < 7; q++) { var ph2 = ((t / 700) + q / 7) % 1, ag = q * 1.9; ctx.globalAlpha = Math.sin(ph2 * PI); ctx.beginPath(); ctx.moveTo(x + cos(ag) * r * 0.6 - 3, y + sin(ag) * r * 0.5); ctx.lineTo(x + cos(ag) * r * 0.6, y + sin(ag) * r * 0.5 - 12 - ph2 * 10); ctx.lineTo(x + cos(ag) * r * 0.6 + 3, y + sin(ag) * r * 0.5); ctx.closePath(); ctx.fill(); } ctx.globalAlpha = 1; };
    } else return false;
    ctx.save(); ctx.lineJoin = 'round';
    if (kind !== 'faros') { ctx.fillStyle = 'rgba(' + col.f + ',' + (0.12 + 0.28 * p).toFixed(3) + ')'; ctx.fill(path, 'evenodd'); ctx.fillStyle = 'rgba(' + col.f + ',0.20)'; ctx.fill(prog, 'evenodd'); } else { ctx.fillStyle = 'rgba(255,120,40,0.05)'; ctx.fill(path); }
    if (o.sig) { ctx.strokeStyle = 'rgba(255,255,255,0.28)'; ctx.lineWidth = 9; ctx.stroke(path); }
    ctx.strokeStyle = 'rgba(27,17,36,0.45)'; ctx.lineWidth = (fix ? 3.4 : 2.6) + 2.6; ctx.stroke(path);
    ctx.strokeStyle = col.s; ctx.globalAlpha = 0.9; ctx.lineWidth = fix ? 3.4 : 2.6; if (!fix) { ctx.setLineDash([11, 8]); ctx.lineDashOffset = -t / 40; } ctx.stroke(path); ctx.setLineDash([]); ctx.globalAlpha = 1;
    if (extra) extra();
    ctx.restore(); return true;
  }
  var oldTele = A.drawBossTele;
  A.drawBossTele = function (ctx, kind, x, y, o) {
    if (T5[kind]) return tele5(ctx, kind, x, y, o);
    var r = oldTele.apply(A, arguments);
    if (o && o.link && r !== false) A.drawCenizarGlyph(ctx, o.gx != null ? o.gx : x, o.gy != null ? o.gy : y, o.link, { size: o.gsize || 36, t: o.t, pulse: true });   // numero del eslabon sobre cualquier telegrafia
    return r;
  };

  // ================================================================= BIOMA 'crater' (Assets.setBiome('crater')) y ARENA
  // geometria base 1440x810 (arena estandar): ruinas del Hogar en el centro (sin colision), 6 pilares sugeridos (r 28), 5 sellos de F7
  var CR_C = [720, 405];
  var CR_PILLARS = (function () { var o = [], k; for (k = 0; k < 6; k++) { var a = k * PI / 3; o.push([Math.round(CR_C[0] + cos(a) * 430), Math.round(CR_C[1] + sin(a) * 240)]); } return o; })();
  var CR_SEALS = (function () { var o = [], k; for (k = 0; k < 5; k++) { var a = -PI / 2 + k * TAU / 5; o.push([Math.round(CR_C[0] + cos(a) * 300), Math.round(CR_C[1] + sin(a) * 180)]); } return o; })();
  A.CRATER = { W: 1440, H: 810, center: CR_C, hearth: [720, 392], pillars: CR_PILLARS, pillarR: 28, seals: CR_SEALS, tips: 'pilares y sellos son sugerencias; los pilares los gestiona la logica (HP 300)' };
  var OVC = {}, CRT = false;
  function ovE(name, canvases, w, h) { return { name: name, w: w, h: h, frames: canvases, anims: null }; }
  (function () {
    var i, d = function (k) { return A.sprite('decor_crater', k); }, ty = [0, 0, 1, 2, 0, 3, 4, 5, 1, 0];
    for (i = 0; i < 10; i++) { var gc = mkc(32, 32), gx = gc.getContext('2d'); gx.imageSmoothingEnabled = true; gx.drawImage(A.sprite('tile_crater', ty[i]), 0, 0, 32, 32); OVC['ground' + i] = ovE('ground' + i, [gc], 32, 32); }
    [4, 1, 4].forEach(function (k, j) { OVC['rock' + j] = ovE('rock' + j, [d(k)], 64, 64); });
    [0, 5, 0].forEach(function (k, j) { OVC['grass' + j] = ovE('grass' + j, [d(k)], 64, 64); });
    OVC.mushroom = ovE('mushroom', [d(0)], 64, 64); OVC.bush0 = ovE('bush0', [d(0)], 64, 64); OVC.bush1 = ovE('bush1', [d(5)], 64, 64);
    [2, 3, 5].forEach(function (k, j) { OVC['bones' + j] = ovE('bones' + j, [d(k)], 64, 64); });
    OVC.stump0 = ovE('stump0', [d(4)], 64, 64); OVC.stump1 = ovE('stump1', [d(1)], 64, 64); OVC.grave = OVC.stump1;
    for (i = 0; i < 4; i++) OVC['rune' + i] = ovE('rune' + i, [mkc(2, 2)], 2, 2);
    OVC.column = ovE('column', [A.sprite('obs_ash_pillar', 0)], 56, 104); OVC.torch = ovE('torch', [d(0)], 64, 64); OVC.edge0 = ovE('edge0', [d(4)], 64, 64); OVC.edge1 = ovE('edge1', [d(1)], 64, 64);
    [0, 1].forEach(function (n) { var fc = mkc(96, 48), fg = fc.getContext('2d'), r = H.rrand(1500 + n), q; for (q = 0; q < 8; q++) { var cx = 8 + r() * 80, cy = 8 + r() * 32, R = 9 + r() * 10, g = fg.createRadialGradient(cx, cy, 0, cx, cy, R); g.addColorStop(0, 'rgba(120,100,120,0.35)'); g.addColorStop(1, 'rgba(120,100,120,0)'); fg.fillStyle = g; fg.fillRect(cx - R, cy - R, R * 2, R * 2); } OVC['fog' + n] = ovE('fog' + n, [fc], 96, 48); });
  })();
  function pickC(e, name, f) {
    if (typeof f === 'string') { var p = f.split(':'), an = e.anims && e.anims[p[0]]; if (!an) throw new Error('Assets: animacion desconocida "' + f + '" en ' + name); return e.frames[an.f[((parseInt(p[1], 10) || 0) % an.f.length + an.f.length) % an.f.length]]; }
    return e.frames[((f | 0) % e.frames.length + e.frames.length) % e.frames.length];
  }
  var c_sprite = A.sprite, c_frames = A.frames, c_info = A.info, c_anim = A.animFrame, c_has = A.hasAnim, c_set = A.setBiome, c_get = A.getBiome, c_biomes = A.biomes, c_binfo = A.biomeInfo;
  var c_vig = A.vignette, c_ff = A.drawFireflies, c_rg = A.drawRitualGlow, c_dec = A.decorate, c_arena = A.arena, c_ph = A.addToPhaser;
  A.sprite = function (n, f) { var e = CRT && OVC[n]; return e ? pickC(e, n, f || 0) : c_sprite(n, f); };
  A.frames = function (n) { var e = CRT && OVC[n]; return e ? e.frames.length : c_frames(n); };
  A.info = function (n) { var e = CRT && OVC[n]; return e ? { name: n, w: e.w, h: e.h, frames: e.frames.length, anims: e.anims } : c_info(n); };
  A.animFrame = function (n, an, t) { return CRT && OVC[n] ? OVC[n].frames[0] : c_anim(n, an, t); };
  A.hasAnim = function (n, an) { return CRT && OVC[n] ? false : c_has(n, an); };
  A.setBiome = function (name) { if (name === 'crater') { var r = c_set('bosque'); CRT = true; return r; } CRT = false; return c_set(name); };
  A.getBiome = function () { return CRT ? 'crater' : c_get(); };
  A.biomes = function () { return c_biomes().concat(['crater']); };
  A.biomeInfo = function (name) {
    if (name === 'crater' || (!name && CRT)) return { name: 'crater', label: 'Crater del Hogar Quemado: vidrio volcanico, ceniza y brasas', bg: '#0c0810', decor: ['decor_crater', 'decor_hearth', 'obs_ash_pillar'], tiles: 10, ember: C.ember, glass: C.glass };
    return c_binfo(name);
  };
  A.vignette = function (w, h, o) { if (CRT && !(o && o.tint)) o = Object.assign({}, o, { tint: '44,10,4' }); return c_vig(w, h, o); };
  A.drawFireflies = function (c, w, h, t, o) { if (CRT) A.drawAshFall(c, w, h, t, o); else c_ff(c, w, h, t, o); };
  A.drawRitualGlow = function (c, x, y, t, r) { if (!CRT) c_rg(c, x, y, t, r); };
  A.addToPhaser = function (tex) {
    c_ph(tex);
    Object.keys(OVC).forEach(function (n) { OVC[n].frames.forEach(function (c, i) { var k = n + '@crater:' + i; if (tex.exists(k)) tex.remove(k); tex.addCanvas(k, c); if (CRT) { var k2 = n + ':' + i; if (tex.exists(k2)) tex.remove(k2); tex.addCanvas(k2, c); } }); });
  };
  A.decorate = function (g, w, h, o) { if (!CRT) return c_dec(g, w, h, o); return { torches: [], items: 0 }; };   // el decorado del crater ya va horneado en arena()

  // arena del Crater: A.arena(w, h, {seed}) -> {canvas, torches:[], ritual:null, pillars:[{x,y,r:28}x6], seals:[{x,y}x5], hearth:{x,y}, lights:[{x,y,r}]} (escalado por w/1440, h/810)
  function craterArena(w, h, o) {
    o = o || {}; var sx = w / 1440, sy = h / 810, rr = H.rrand(o.seed || 909), c = mkc(w, h), x = c.getContext('2d'), i, j;
    function R(a, b) { return a + rr() * (b - a); }
    x.imageSmoothingEnabled = true; x.fillStyle = C.glassS; x.fillRect(0, 0, w, h);
    var tw = 64 * Math.min(sx, sy), th = tw; for (j = 0; j * th < h + th; j++) for (i = 0; i * tw < w + tw; i++) { var r0 = rr(), ti = r0 < 0.6 ? 0 : (r0 < 0.78 ? 1 : (r0 < 0.9 ? 2 : (r0 < 0.95 ? 3 : (r0 < 0.98 ? 4 : 5)))); x.drawImage(A.sprite('tile_crater', ti), i * tw, j * th, tw + 1, th + 1); }
    // grandes grietas de brasa que irradian del hogar
    x.lineCap = 'round'; x.lineJoin = 'round';
    for (i = 0; i < 9; i++) {
      var a = i * TAU / 9 + R(-0.2, 0.2), px = CR_C[0] + cos(a) * 150, py = CR_C[1] + sin(a) * 90, pts = [[px, py]], q;
      for (q = 0; q < 9; q++) { a += R(-0.35, 0.35); px += cos(a) * R(60, 110); py += sin(a) * R(40, 70); pts.push([px, py]); }
      [['rgba(255,106,26,0.12)', 12], ['rgba(255,106,26,0.5)', 3.4], ['rgba(255,200,110,0.8)', 1.2]].forEach(function (st) { x.strokeStyle = st[0]; x.lineWidth = st[1] * Math.min(sx, sy); x.beginPath(); pts.forEach(function (p2, k2) { x[k2 ? 'lineTo' : 'moveTo'](p2[0] * sx, p2[1] * sy); }); x.stroke(); });
    }
    // resplandor del hogar
    var gl = x.createRadialGradient(CR_C[0] * sx, CR_C[1] * sy, 20, CR_C[0] * sx, CR_C[1] * sy, 560 * sx); gl.addColorStop(0, 'rgba(255,140,50,0.2)'); gl.addColorStop(0.5, 'rgba(255,90,30,0.07)'); gl.addColorStop(1, 'rgba(0,0,0,0)'); x.fillStyle = gl; x.fillRect(0, 0, w, h);
    // decorado suelto (evita el centro)
    for (i = 0; i < 26; i++) { var dx = R(60, 1380), dy = R(60, 760); if (Math.abs(dx - CR_C[0]) < 260 && Math.abs(dy - CR_C[1]) < 170) continue; var ds = A.sprite('decor_crater', (rr() * 6) | 0), dsz = 64 * Math.min(sx, sy); x.globalAlpha = 0.85; x.drawImage(ds, dx * sx - dsz / 2, dy * sy - dsz * 0.875, dsz, dsz); }
    x.globalAlpha = 1;
    // ruinas del Hogar (centro): mesa y silla quemadas junto a la chimenea
    var hs = 192 * sx, hh = 160 * sy;
    [[1, 636, 430, 0.8], [2, 800, 440, 0.7], [0, 720, 396, 1.0]].forEach(function (d) { var sp = A.sprite('decor_hearth', d[0]), k = d[3]; x.drawImage(sp, d[1] * sx - hs * k / 2, d[2] * sy - hh * k * 0.95, hs * k, hh * k); });
    var hg = x.createRadialGradient(720 * sx, 392 * sy, 2, 720 * sx, 392 * sy, 120 * sx); hg.addColorStop(0, 'rgba(255,170,70,0.35)'); hg.addColorStop(1, 'rgba(255,106,26,0)'); x.fillStyle = hg; x.fillRect(560 * sx, 250 * sy, 320 * sx, 260 * sy);
    // borde del crater: roca oscura con grietas hacia el exterior
    x.save(); x.strokeStyle = 'rgba(8,4,12,0.9)'; x.lineWidth = 90 * Math.min(sx, sy); x.strokeRect(0, 0, w, h); x.restore();
    for (i = 0; i < 70; i++) { var side = (rr() * 4) | 0, ex = side === 0 ? R(0, 1440) : (side === 1 ? R(0, 1440) : (side === 2 ? R(0, 70) : R(1370, 1440))), ey = side === 0 ? R(0, 60) : (side === 1 ? R(750, 810) : R(0, 810)); x.fillStyle = i % 3 ? '#1e1626' : '#2a2034'; x.strokeStyle = '#0a060e'; x.lineWidth = 2; x.beginPath(); for (var k = 0; k < 6; k++) { var ak = k * TAU / 6 + R(0, 0.5), rk = R(12, 30) * Math.min(sx, sy); x[k ? 'lineTo' : 'moveTo'](ex * sx + cos(ak) * rk, ey * sy + sin(ak) * rk * 0.8); } x.closePath(); x.fill(); x.stroke(); }
    x.save(); x.translate(w / 2, h / 2); x.scale(1, h / w); var vg = x.createRadialGradient(0, 0, w * 0.34, 0, 0, w * 0.62); vg.addColorStop(0, 'rgba(30,8,4,0)'); vg.addColorStop(0.7, 'rgba(30,8,4,0.35)'); vg.addColorStop(1, 'rgba(14,4,2,0.8)'); x.fillStyle = vg; x.fillRect(-w, -w, w * 2, w * 2); x.restore();
    return { canvas: c, torches: [], ritual: null, pillars: CR_PILLARS.map(function (p) { return { x: p[0] * sx, y: p[1] * sy, r: 28 * sx }; }), seals: CR_SEALS.map(function (p) { return { x: p[0] * sx, y: p[1] * sy }; }), hearth: { x: 720 * sx, y: 392 * sy }, lights: [{ x: 720 * sx, y: 390 * sy, r: 260 * sx }] };
  }
  A.arena = function (w, h, o) { return CRT ? craterArena(w, h, o) : c_arena(w, h, o); };

  // ================================================================= CINEMATICA FINAL (arte simple, procedural): el Hogar reencendido + creditos
  // A.ENDING = {duration, stages}. A.drawEndingScene(ctx, w, h, p, o): p 0..1 (progreso de ~50 s). Se pinta a pantalla completa (w x h), sin dependencias del mundo.
  A.ENDING = { duration: 50000, stages: [[0, 0.14, 'ruinas: solo queda una brasa'], [0.14, 0.45, 'la brasa prende el hogar'], [0.45, 0.7, 'la casa se recompone, llegan los amigos'], [0.7, 0.9, 'amanece'], [0.9, 1, 'fundido calido a creditos']] };
  function flame(x, cx, cy, wd, ht, t, seed, I) {
    var i, n = 5;
    for (i = 0; i < n; i++) {
      var k = (i - (n - 1) / 2) / ((n - 1) / 2), fl = 0.75 + 0.25 * sin(t / (120 + i * 17) + seed + i), hh = ht * (1 - Math.abs(k) * 0.45) * fl * I, ww = wd * (0.32 - Math.abs(k) * 0.1), bx = cx + k * wd * 0.4 + sin(t / 200 + i + seed) * 3;
      [['#b8380a', 1], ['#ff6a1a', 0.78], ['#ffb04a', 0.5], ['#fff2b0', 0.28]].forEach(function (c, q) { x.fillStyle = c[0]; x.beginPath(); x.moveTo(bx - ww * c[1], cy); x.quadraticCurveTo(bx - ww * c[1] * 1.05, cy - hh * c[1] * 0.55, bx + sin(t / 150 + i) * 3, cy - hh * c[1]); x.quadraticCurveTo(bx + ww * c[1] * 1.05, cy - hh * c[1] * 0.55, bx + ww * c[1], cy); x.closePath(); x.fill(); });
    }
  }
  function friend(x, bx, by, k, hgt, lit, col) {   // siluetas simples de los cinco amigos (Lanudo, Vesper, Castana, Grum, Ulalume), con luz de hogar por el borde
    var wd = hgt * 0.5, i;
    x.save(); x.translate(bx, by); x.globalAlpha = lit;
    x.fillStyle = '#0e0912'; x.strokeStyle = OLC; x.lineWidth = 2.4; x.beginPath(); x.moveTo(-wd * 0.55, 0); x.quadraticCurveTo(-wd * 0.7, -hgt * 0.5, -wd * 0.3, -hgt * 0.72); x.lineTo(wd * 0.3, -hgt * 0.72); x.quadraticCurveTo(wd * 0.7, -hgt * 0.5, wd * 0.55, 0); x.closePath(); x.fill(); x.stroke();
    x.beginPath(); x.arc(0, -hgt * 0.86, hgt * 0.2, 0, TAU); x.fill(); x.stroke();
    if (k === 0) { for (i = 0; i < 5; i++) { x.beginPath(); x.arc(-hgt * 0.2 + i * hgt * 0.1, -hgt * (0.94 + (i % 2) * 0.05), hgt * 0.1, 0, TAU); x.fill(); x.stroke(); } }
    if (k === 1) { x.beginPath(); x.moveTo(-hgt * 0.16, -hgt * 0.98); x.lineTo(-hgt * 0.24, -hgt * 1.16); x.lineTo(-hgt * 0.04, -hgt * 1.02); x.moveTo(hgt * 0.16, -hgt * 0.98); x.lineTo(hgt * 0.24, -hgt * 1.16); x.lineTo(hgt * 0.04, -hgt * 1.02); x.fill(); x.stroke(); }
    if (k === 2) { x.beginPath(); x.rect(-wd * 0.32, -hgt * 0.4, wd * 0.64, hgt * 0.4); x.fill(); x.stroke(); }
    if (k === 3) { x.beginPath(); x.moveTo(-wd * 0.8, -hgt * 0.62); x.lineTo(wd * 0.8, -hgt * 0.62); x.lineTo(wd * 0.6, -hgt * 0.4); x.lineTo(-wd * 0.6, -hgt * 0.4); x.closePath(); x.fill(); x.stroke(); }
    if (k === 4) { x.beginPath(); x.moveTo(-hgt * 0.24, -hgt * 0.78); x.quadraticCurveTo(0, -hgt * 1.16, hgt * 0.24, -hgt * 0.78); x.closePath(); x.fill(); x.stroke(); }
    x.globalAlpha = lit * 0.55; x.strokeStyle = col; x.lineWidth = 2; x.beginPath(); x.moveTo(wd * 0.3, -hgt * 0.72); x.quadraticCurveTo(wd * 0.7, -hgt * 0.5, wd * 0.55, 0); x.stroke(); x.beginPath(); x.arc(0, -hgt * 0.86, hgt * 0.2, -1.2, 0.6); x.stroke();
    x.restore();
  }
  A.drawEndingScene = function (ctx, w, h, p, o) {
    o = o || {}; p = clamp(p, 0, 1); var t = o.t != null ? o.t : p * A.ENDING.duration, s = Math.min(w / 960, h / 540), cx = w / 2, fl = h * 0.78, i;
    var I = ease((p - 0.14) / 0.3), dawn = ease((p - 0.68) / 0.22), rest = ease((p - 0.45) / 0.2), fr = ease((p - 0.5) / 0.15), flick = 0.9 + 0.1 * sin(t / 90) * sin(t / 37);
    ctx.save(); ctx.fillStyle = '#07040a'; ctx.fillRect(0, 0, w, h);
    // pared del fondo y ventana
    var wg = ctx.createLinearGradient(0, 0, 0, fl); wg.addColorStop(0, lerpCol('#120c18', '#3a2430', I * 0.6 + dawn * 0.3)); wg.addColorStop(1, lerpCol('#0c0710', '#2a1a1c', I * 0.7)); ctx.fillStyle = wg; ctx.fillRect(0, 0, w, fl);
    for (i = 0; i < 14; i++) { ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.fillRect(i * w / 14, 0, 2, fl); }
    var wx = cx + 250 * s, wy = fl - 280 * s, ww = 120 * s, wh = 150 * s, sk = ctx.createLinearGradient(0, wy, 0, wy + wh); sk.addColorStop(0, lerpCol('#0a0a22', '#5a8ad0', dawn)); sk.addColorStop(1, lerpCol('#141030', '#ffb070', dawn));
    ctx.fillStyle = sk; ctx.fillRect(wx, wy, ww, wh); if (dawn < 0.8) { ctx.fillStyle = 'rgba(255,255,230,' + (0.9 * (1 - dawn)) + ')'; ctx.beginPath(); ctx.arc(wx + ww * 0.7, wy + wh * 0.3, 9 * s, 0, TAU); ctx.fill(); } else { ctx.fillStyle = 'rgba(255,230,160,' + dawn + ')'; ctx.beginPath(); ctx.arc(wx + ww * 0.3, wy + wh * (1.05 - dawn * 0.5), 14 * s, 0, TAU); ctx.fill(); }
    ctx.strokeStyle = OLC; ctx.lineWidth = 5 * s; ctx.strokeRect(wx, wy, ww, wh); ctx.beginPath(); ctx.moveTo(wx + ww / 2, wy); ctx.lineTo(wx + ww / 2, wy + wh); ctx.moveTo(wx, wy + wh / 2); ctx.lineTo(wx + ww, wy + wh / 2); ctx.stroke();
    // suelo de madera
    var fg = ctx.createLinearGradient(0, fl, 0, h); fg.addColorStop(0, lerpCol('#140e12', '#3a2418', I)); fg.addColorStop(1, lerpCol('#08050a', '#1c120c', I)); ctx.fillStyle = fg; ctx.fillRect(0, fl, w, h - fl); ctx.strokeStyle = 'rgba(0,0,0,0.35)'; ctx.lineWidth = 2; for (i = 0; i < 9; i++) { ctx.beginPath(); ctx.moveTo(0, fl + (i + 1) * (h - fl) / 9); ctx.lineTo(w, fl + (i + 1) * (h - fl) / 9); ctx.stroke(); }
    // chimenea
    var hx = cx - 60 * s, hw = 170 * s, hh = 250 * s;
    ctx.fillStyle = '#3a3040'; ctx.strokeStyle = OLC; ctx.lineWidth = 5 * s; ctx.beginPath(); ctx.moveTo(hx - hw / 2, fl); ctx.lineTo(hx - hw * 0.46, fl - hh * 0.8); ctx.lineTo(hx - hw * 0.3, fl - hh); ctx.lineTo(hx + hw * 0.3, fl - hh); ctx.lineTo(hx + hw * 0.46, fl - hh * 0.8); ctx.lineTo(hx + hw / 2, fl); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.strokeStyle = 'rgba(16,10,22,0.5)'; ctx.lineWidth = 1.4; for (i = 0; i < 6; i++) { ctx.beginPath(); ctx.moveTo(hx - hw * 0.45, fl - hh * (0.15 + i * 0.14)); ctx.lineTo(hx + hw * 0.45, fl - hh * (0.15 + i * 0.14)); ctx.stroke(); }
    ctx.fillStyle = '#0a060c'; ctx.strokeStyle = OLC; ctx.lineWidth = 4 * s; ctx.beginPath(); ctx.moveTo(hx - hw * 0.3, fl); ctx.lineTo(hx - hw * 0.3, fl - hh * 0.42); ctx.quadraticCurveTo(hx, fl - hh * 0.56, hx + hw * 0.3, fl - hh * 0.42); ctx.lineTo(hx + hw * 0.3, fl); ctx.closePath(); ctx.fill(); ctx.stroke();
    var fy = fl - 6 * s;
    // fuego: una sola brasa al principio, luego llamas que crecen
    ctx.save(); ctx.globalCompositeOperation = 'lighter'; var gR = (120 + 520 * I) * s * flick; var lg = ctx.createRadialGradient(hx, fy - 40 * s, 4, hx, fy - 40 * s, gR); lg.addColorStop(0, 'rgba(255,180,80,' + (0.25 + 0.55 * I) + ')'); lg.addColorStop(0.5, 'rgba(255,110,30,' + (0.08 + 0.2 * I) + ')'); lg.addColorStop(1, 'rgba(255,106,26,0)'); ctx.fillStyle = lg; ctx.fillRect(0, 0, w, h); ctx.restore();
    var ember = 0.5 + 0.5 * sin(t / 300); ctx.fillStyle = '#ff6a1a'; ctx.beginPath(); ctx.arc(hx, fy - 4 * s, (3 + 2 * ember) * s * (1 - I * 0.5), 0, TAU); ctx.fill(); ctx.fillStyle = '#fff2b0'; ctx.beginPath(); ctx.arc(hx, fy - 4 * s, 1.6 * s, 0, TAU); ctx.fill();
    ctx.fillStyle = '#2a2018'; ctx.strokeStyle = OLC; ctx.lineWidth = 3 * s; for (i = 0; i < 3; i++) { ctx.save(); ctx.translate(hx + (i - 1) * 34 * s, fy); ctx.rotate((i - 1) * 0.5); ctx.fillRect(-26 * s, -6 * s, 52 * s, 11 * s); ctx.strokeRect(-26 * s, -6 * s, 52 * s, 11 * s); ctx.restore(); }
    if (I > 0.02) flame(ctx, hx, fy, 150 * s, 190 * s, t, 1, I);
    for (i = 0; i < 14 * I; i++) { var sp = ((t / 1400) + pr(i + 800)) % 1; ctx.fillStyle = 'rgba(255,200,110,' + (1 - sp).toFixed(2) + ')'; ctx.fillRect(hx + (pr(i + 810) - 0.5) * 90 * s + sin(sp * 7 + i) * 10, fy - 40 * s - sp * 260 * s, 2.4 * s, 2.4 * s); }
    // mesa y silla: quemadas -> reparadas
    var tx = cx + 130 * s, ty = fl + 40 * s;
    function table(col, hi, al) { ctx.save(); ctx.globalAlpha = al; ctx.fillStyle = col; ctx.strokeStyle = OLC; ctx.lineWidth = 4 * s; ctx.beginPath(); ctx.rect(tx - 110 * s, ty - 56 * s, 220 * s, 16 * s); ctx.fill(); ctx.stroke(); [-90, 90].forEach(function (lx) { ctx.beginPath(); ctx.rect(tx + lx * s - 8 * s, ty - 40 * s, 16 * s, 60 * s); ctx.fill(); ctx.stroke(); }); ctx.fillStyle = hi; ctx.fillRect(tx - 104 * s, ty - 54 * s, 208 * s, 3 * s); ctx.restore(); }
    table('#241a14', '#3a2c20', 1 - rest); table('#8a5a34', '#c08a56', rest);
    if (rest > 0.4) { ctx.save(); ctx.globalAlpha = (rest - 0.4) / 0.6; ctx.fillStyle = '#e8d8b0'; ctx.strokeStyle = OLC; ctx.lineWidth = 3 * s; ctx.beginPath(); ctx.ellipse(tx - 30 * s, ty - 62 * s, 22 * s, 6 * s, 0, 0, TAU); ctx.fill(); ctx.stroke(); ctx.fillStyle = '#ffb04a'; ctx.beginPath(); ctx.arc(tx + 40 * s, ty - 70 * s, 5 * s, 0, TAU); ctx.fill(); ctx.restore(); }
    var chx = tx - 190 * s; ctx.save(); ctx.globalAlpha = 1 - rest; ctx.fillStyle = '#241a14'; ctx.strokeStyle = OLC; ctx.lineWidth = 3.4 * s; ctx.fillRect(chx - 22 * s, ty - 40 * s, 44 * s, 8 * s); ctx.strokeRect(chx - 22 * s, ty - 40 * s, 44 * s, 8 * s); ctx.restore(); ctx.save(); ctx.globalAlpha = rest; ctx.fillStyle = '#8a5a34'; ctx.strokeStyle = OLC; ctx.lineWidth = 3.4 * s; ctx.fillRect(chx - 22 * s, ty - 40 * s, 44 * s, 8 * s); ctx.strokeRect(chx - 22 * s, ty - 40 * s, 44 * s, 8 * s); ctx.fillRect(chx - 22 * s, ty - 90 * s, 8 * s, 52 * s); ctx.strokeRect(chx - 22 * s, ty - 90 * s, 8 * s, 52 * s); ctx.fillRect(chx - 20 * s, ty - 32 * s, 6 * s, 40 * s); ctx.fillRect(chx + 14 * s, ty - 32 * s, 6 * s, 40 * s); ctx.restore();
    // los amigos (siluetas con luz por el borde): Lanudo, Vesper, Castana, Grum, Ulalume
    var cols = ['#ffd9a0', '#d0a0ff', '#ffb060', '#ffc890', '#a0f0e0'], hts = [118, 96, 108, 140, 90], xs = [-330, -210, 60, 290, 390];
    for (i = 0; i < 5; i++) { var lit = clamp((fr * 5 - i) * 0.9, 0, 1); if (lit > 0) friend(ctx, hx + xs[i] * s * 0.9 + (1 - lit) * 24 * s, fl + 52 * s + (i % 2) * 6 * s, i, hts[i] * s, lit, cols[i]); }
    // fundido calido final
    var fo = ease((p - 0.9) / 0.1); if (fo > 0) { ctx.fillStyle = 'rgba(20,8,4,' + (0.85 * fo).toFixed(3) + ')'; ctx.fillRect(0, 0, w, h); }
    ctx.restore();
  };
  function lerpCol(a, b, u) { u = clamp(u, 0, 1); var pa = [1, 3, 5].map(function (i) { return parseInt(a.substr(i, 2), 16); }), pb = [1, 3, 5].map(function (i) { return parseInt(b.substr(i, 2), 16); }); return 'rgb(' + pa.map(function (v, i) { return Math.round(v + (pb[i] - v) * u); }).join(',') + ')'; }
  // creditos: A.drawCredits(ctx, w, h, tMs, lines, o). lines: ['texto', {h:'Titulo'}, '']; o {speed px/s 38, size 22, color, y0}. Devuelve true cuando el ultimo texto ya salio por arriba
  A.drawCredits = function (ctx, w, h, tMs, lines, o) {
    o = o || {}; var sp = o.speed || 38, sz = o.size || Math.round(22 * Math.min(w / 960, h / 540)), lh = sz * 1.9, y0 = o.y0 == null ? h + 20 : o.y0, i, y = y0 - tMs / 1000 * sp, done = true;
    ctx.save(); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.lineJoin = 'round'; ctx.lineWidth = Math.max(3, sz * 0.22); ctx.strokeStyle = OLC;
    for (i = 0; i < lines.length; i++) {
      var ln = lines[i], hd = ln && typeof ln === 'object', tx = hd ? ln.h : ln, yy = y + i * lh + (hd ? sz * 0.6 : 0); if (yy > -sz) done = false; if (yy < -sz || yy > h + sz || !tx) continue;
      ctx.font = 'bold ' + (hd ? Math.round(sz * 1.4) : sz) + 'px "Courier New", monospace'; var edge = Math.min(1, Math.min(yy, h - yy) / (h * 0.12)); ctx.globalAlpha = clamp(edge, 0, 1);
      ctx.strokeText(tx, w / 2, yy); ctx.fillStyle = hd ? '#ffb04a' : (o.color || '#fff2dc'); ctx.fillText(tx, w / 2, yy);
    }
    ctx.restore(); return done;
  };

  // ================================================================= API PUBLICA (envuelve la anterior; los ids viejos siguen igual)
  var BOSSES = A.BOSS;
  var B5 = {
    cenizar: {
      id: 'cenizar', name: 'Cenizar', title: 'El Incendio Primero', r: 96, gy: GY, w: 300, h: 310, deathMs: CDEATH, windups: CNAMES, hover: HOVER,
      phases: ['Rescoldo', 'Exodo de Cenizas', 'Requiem Abrasador', 'Coro de los Tres Rios', 'Invierno de Ceniza', 'Enjambre de Brasas', 'El Incendio Primero'], despair: 'Cadena Final',
      parts: { cayado: { r: 22 }, nucleo: { r: 20 }, ojo: { r: 16 }, colmillo: { r: 18 }, corona: { r: 22 }, corazon: { r: 18 } }, windowColor: '#dff4ff', speeds: [40, 50, 60, 65, 70, 75, 85], eyes: EYE.map(function (e) { return e[0]; }),
      weak: [['ice', 1.25], ['steel', 1.1]], resist: [['fire', 0.8]], immuneStates: [], relics: RELICS.slice(), relicPhase: RELIC_PHASE, relicLink: RELIC_LINK, linkColors: LINKC.slice(),
      render: renderCenizar, shadow: cShadow, aura: cAura, front: cFront
    }
  };
  BOSSES.cenizar = B5.cenizar; B5.incendio = B5.cenizar;
  Object.defineProperty(BOSSES, 'incendio', { value: B5.cenizar, enumerable: false, configurable: true, writable: true });
  var oldDraw = A.drawBoss, oldRender = A.renderBoss, oldShadow = A.drawBossShadow, oldAnch = A.bossAnchors, oldNames = A.bossPoseNames;
  A.drawBoss = function (id, ctx, x, y, s) {
    var B = B5[id]; if (!B) return oldDraw.apply(A, arguments);
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
  A.renderBoss = function (id, s) { var B = B5[id]; return B ? B.render(s || {}) : oldRender.apply(A, arguments); };
  A.drawBossShadow = function (ctx, x, y, s) { var id = s && s.id; if (id && B5[id]) return B5[id].shadow(ctx, x, y, s); return oldShadow.apply(A, arguments); };
  A.bossPoseNames = function (id) { return (id === 'cenizar' || id === 'incendio') ? CNAMES.slice() : oldNames.apply(A, arguments); };
  A.cenizarRelicState = function (s, id) { return relicSt(s || {}, id); };
  function rdp(p, r) { return { x: rd(p.x), y: rd(p.y), r: r || 0 }; }
  A.bossAnchors = function (id, s) {
    if (id !== 'cenizar' && id !== 'incendio') return oldAnch.apply(A, arguments);
    s = s || {}; var f = s.facing < 0 ? -1 : 1, P = cPoseFor(s), L = cLayout(P, s), hv = P.hover, sa = f > 0 ? P.aimA : PI - P.aimA;
    function X(p, r) { return { x: rd(p.x * f), y: rd(p.y - hv), r: r || 0 }; }
    var out = { body: { x: 0, y: rd(-hv), r: 96 }, torso: X(L.torso, 70), head: X(L.head, 34), crown: X(L.crown, 22), corona: X(L.corona, 22), ojo: X(L.ojo, 16), eyes: X(L.eyes, 8), mouth: X(L.mouth, 10),
      nucleo: X(L.nucleo, 20), core: X(L.core, 18), corazon: X(L.core, 18), colmillo: X(L.colmillo, 18), cayado: X(L.staff, 22), staffTip: X(L.staffTip, 8), hand_r: X(L.hand_r, 14), hand_l: X(L.hand_l, 14), glyphs: X(L.glyphs, 0), origin: X(L.nucleo, 0) };
    out.tips = L.tips.map(function (p) { return X(p, 6); });
    out.aim = { x: out.hand_r.x, y: out.hand_r.y, r: 0, a: Math.round((((s.aim || 0) % TAU) + TAU) % TAU * 1000) / 1000 };
    out.feet = { x: 0, y: GY, r: 0 }; out.groundShadow = { x: 0, y: GY + 4, r: 150 }; out.hover = { x: 0, y: rd(-hv), r: 0, h: rd(hv) };
    return out;
  };
})();
