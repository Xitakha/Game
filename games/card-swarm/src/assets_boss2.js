/*!
 * assets_boss2.js - Arte de los JEFES v4 (J2): Karceron (Carcelero de Brasa, cripta) y Letea (Hidra del Olvido, asfodelo). Solo arte, sin logica.
 * Script clasico que EXTIENDE window.Assets; cargar tras assets.js y assets_boss.js (usa Assets._h y la API de drawBoss del Pastor).
 * Contrato (nombres, anclajes, estado de dibujo): games/card-swarm/ASSETS_API.md, seccion "Jefes v4 (J2)".
 * Estilo del juego: contorno grueso #1b1124, color plano + 1 sombra + 1 brillo, rasterizado x2.
 */
(function () {
  'use strict';
  var A = window.Assets, H = A && A._h;
  if (!H || !A.drawBoss) { if (window.console) console.error('assets_boss2: falta Assets._h o assets_boss.js (cargar tras assets_boss.js)'); return; }
  var addV = H.addV, Ppoly = H.Ppoly, Pblob = H.Pblob, Prr = H.Prr, Pcirc = H.Pcirc, OLC = H.OLC;
  var TAU = Math.PI * 2, LW = 2.2;
  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  function lerp(a, b, u) { return a + (b - a) * u; }
  function ease(u) { u = clamp(u, 0, 1); return u * u * (3 - 2 * u); }
  function pr(i) { var s = Math.sin(i * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); }
  function mkc(w, h) { var c = document.createElement('canvas'); c.width = w; c.height = h; return c; }
  function angLerp(a, b, u) { var d = ((b - a + Math.PI * 3) % TAU) - Math.PI; return a + d * u; }

  // ===================================================================== KARCERON: sprites
  var K = {
    bone: '#d8cfae', boneS: '#a89c78', boneH: '#f2ecd2', mag: '#ff6a1a', magD: '#b8340c', lava: '#ffd23a', lavaH: '#fff0a0',
    iron: '#6b7385', ironS: '#40475a', ironH: '#aab4cc', rock: '#3a3044', rockS: '#241c30', rockH: '#5a4c6a', cav: '#2a1220'
  };
  function bonePart(v, p, o) { o = o || {}; v.part(p, K.bone, { lw: o.lw == null ? LW : o.lw, sh: K.boneS, hi: K.boneH, so: o.so == null ? 1.1 : o.so }); }
  function lavaCrack(v, pts, w) {
    var x = v.ctx, i; x.strokeStyle = OLC; x.lineWidth = (w || 0.9) + 1; x.beginPath(); x.moveTo(pts[0][0], pts[0][1]); for (i = 1; i < pts.length; i++) x.lineTo(pts[i][0], pts[i][1]); x.stroke();
    x.strokeStyle = K.mag; x.lineWidth = w || 0.9; x.stroke(); x.strokeStyle = K.lava; x.lineWidth = (w || 0.9) * 0.4; x.stroke();
  }

  // ---- cavidad/espina (fondo del torso): 96x80. 0 cerrado, 1 abriendo, 2 abierto
  function cavityDraw(f) {
    return function (v) {
      var x = v.ctx, g = [3, 12, 25][f], i;
      v.part(Pblob(48, 70, 33, 11, 501, 0.04, 10), K.rock, { lw: LW, sh: K.rockS, hi: K.rockH, so: 1 });
      v.part(Pblob(48, 38, 33, 29, 502, 0.03, 12), '#1c0e18', { lw: 1.8, sh: '#120810', so: 1 });
      var gr = x.createRadialGradient(48, 38, 2, 48, 38, 34); gr.addColorStop(0, 'rgba(255,150,50,' + (0.85 + f * 0.1) + ')'); gr.addColorStop(0.55, 'rgba(255,90,20,' + (0.4 + f * 0.1) + ')'); gr.addColorStop(1, 'rgba(255,60,10,0)');
      x.fillStyle = gr; x.fillRect(10, 8, 76, 60);
      for (i = 0; i < 6; i++) v.part(Pblob(48, 12 + i * 10.6, 4.6, 4, 510 + i, 0.05, 7), K.bone, { lw: 1.5, sh: K.boneS, hi: K.boneH, so: 0.7 });
      if (f) { v.part(Ppoly([[48 - g - 4, 26], [48 + g + 4, 26], [48 + g, 56], [48 - g, 56]]), 'rgba(0,0,0,0)', { lw: 0 }); }
    };
  }
  addV('boss_karceron_cavity', 96, 80, [cavityDraw(0), cavityDraw(1), cavityDraw(2)], { lw: LW }, { closed: { f: [0], fps: 1 }, opening: { f: [1], fps: 1 }, open: { f: [2], fps: 1 } });

  // ---- torso (costillas + clavicula): 96x80. 0 cerrado, 1 abriendo, 2 abierto. El nucleo se dibuja ENTRE cavity y torso
  function torsoDraw(f) {
    return function (v) {
      var x = v.ctx, g = [3, 12, 25][f], i, s;
      for (s = -1; s <= 1; s += 2) {
        for (i = 0; i < 5; i++) {
          var y0 = 17 + i * 9.6, ox = 33 - i * 2.2 + f * 2.5, ex = 48 + s * (g + 2 + i * 0.8);
          v.stick([[48 + s * 4, y0], [48 + s * ox, y0 + 1], [ex, y0 + 11]], 5.6 - i * 0.2, K.bone, { lw: 1.7, hi: K.boneH, curve: true });
        }
        v.part(Ppoly([[48 + s * 38, 5], [48 + s * 45, 11], [48 + s * 41, 22]]), K.bone, { lw: 1.5, sh: K.boneS, hi: K.boneH, so: 0.6 });
      }
      if (f === 0) v.part(Prr(44, 15, 8, 46, 3), K.bone, { lw: 1.8, sh: K.boneS, hi: K.boneH, so: 0.8 });
      else if (f === 1) { v.part(Prr(48 - g + 1, 20, 4.4, 36, 2), K.bone, { lw: 1.4, sh: K.boneS, so: 0.6 }); v.part(Prr(48 + g - 5.4, 20, 4.4, 36, 2), K.bone, { lw: 1.4, sh: K.boneS, so: 0.6 }); }
      v.stick([[8, 9], [28, 4], [48, 7], [68, 4], [88, 9]], 6.4, K.bone, { lw: 1.9, hi: K.boneH, curve: true });
      lavaCrack(v, [[18, 6.6], [24, 9], [30, 6.4]], 0.8); lavaCrack(v, [[66, 6.4], [72, 9], [78, 6.6]], 0.8);
      lavaCrack(v, [[48 - g - 3, 26], [48 - g - 6, 31], [48 - g - 4, 38]], 0.7); lavaCrack(v, [[48 + g + 3, 44], [48 + g + 6, 50], [48 + g + 4, 55]], 0.7);
    };
  }
  addV('boss_karceron_torso', 96, 80, [torsoDraw(0), torsoDraw(1), torsoDraw(2)], { lw: LW }, { closed: { f: [0], fps: 1 }, opening: { f: [1], fps: 1 }, open: { f: [2], fps: 1 } });

  // ---- craneo con corona de cuernos: 40x40 (cuello en 20,36). 0 neutro, 1 rugido, 2 dano
  function skullDraw(f) {
    return function (v) {
      var x = v.ctx, jaw = f === 1 ? 5.5 : 0, i;
      for (i = 0; i < 7; i++) {
        var a = -Math.PI + 0.35 + i * (Math.PI - 0.7) / 6, bx = 20 + Math.cos(a) * 12, by = 15 + Math.sin(a) * 11, h = (i % 2 ? 6 : 9) + (i === 3 ? 3 : 0);
        v.part(Ppoly([[bx - 2.6 * Math.sin(a), by + 2.6 * Math.cos(a)], [20 + Math.cos(a) * (12 + h), 15 + Math.sin(a) * (11 + h)], [bx + 2.6 * Math.sin(a), by - 2.6 * Math.cos(a)]]), K.bone, { lw: 1.5, sh: K.boneS, hi: K.boneH, so: 0.6 });
      }
      v.part(Pblob(20, 31 + jaw * 0.4, 11.5, 5.4, 531, 0.03, 9), '#1b0e18', { lw: 1.3 });
      if (jaw) { v.part(Pblob(20, 30.5 + jaw * 0.3, 8, 3.6 + jaw * 0.2, 532, 0.03, 8), K.mag, { lw: 0, sh: K.magD }); }
      v.part(Pblob(20, 33 + jaw, 10.5, 4.6, 533, 0.03, 9), K.bone, { lw: 1.8, sh: K.boneS, hi: K.boneH, so: 0.8 });
      for (i = 0; i < 5; i++) v.part(Ppoly([[12.4 + i * 3.8, 31 + jaw], [14.2 + i * 3.8, 34.4 + jaw], [16 + i * 3.8, 31 + jaw]]), '#fff6e0', { lw: 0.6, sh: null });
      v.part(Pblob(20, 15, 15, 13, 534, 0.03, 11), K.bone, { lw: 2, sh: K.boneS, hi: K.boneH, so: 1.2 });
      v.part(Pblob(12.8, 17, 4.6, 4.2, 535, 0.04, 8), '#1b0e18', { lw: 1.1 }); v.part(Pblob(27.2, 17, 4.6, 4.2, 536, 0.04, 8), '#1b0e18', { lw: 1.1 });
      v.part(Ppoly([[18, 22], [20, 18.6], [22, 22], [20, 23.4]]), '#1b0e18', { lw: 0.8 });
      v.line(8, 11.4, 16.6, 13.6, 1.6, K.boneS); v.line(32, 11.4, 23.4, 13.6, 1.6, K.boneS);
      if (f === 2) { lavaCrack(v, [[22, 3], [19, 8], [23, 13], [20, 19]], 0.9); v.line(9, 15.6, 16.6, 17.4, 1.4, OLC); v.line(31, 15.6, 23.4, 17.4, 1.4, OLC); }
      else lavaCrack(v, [[27, 3.4], [29, 7], [26.6, 10]], 0.7);
    };
  }
  addV('boss_karceron_skull', 40, 40, [skullDraw(0), skullDraw(1), skullDraw(2)], { lw: LW }, { idle: { f: [0], fps: 1 }, roar: { f: [1], fps: 1 }, hurt: { f: [2], fps: 1 } });

  // ---- ojos de brasa: 28x8 (centro 14,4). 0 naranja (F1), 1 rojo (F2/furia), 2 blanco (F3/desesperado)
  function eyesDraw(f) {
    var c = [['#ff9a2a', '#ffe08a'], ['#ff3b30', '#ffb0a0'], ['#ffffff', '#fff6c0']][f];
    return function (v) {
      v.part(Ppoly([[0.6, 6.4], [5.6, 1.4], [10, 3.4], [8, 6.8]]), c[0], { lw: 0.6, ol: '#3a0e18', sh: null });
      v.part(Ppoly([[27.4, 6.4], [22.4, 1.4], [18, 3.4], [20, 6.8]]), c[0], { lw: 0.6, ol: '#3a0e18', sh: null });
      v.dot(6, 4.4, 1.2, c[1]); v.dot(22, 4.4, 1.2, c[1]);
    };
  }
  addV('boss_karceron_eyes', 28, 8, [eyesDraw(0), eyesDraw(1), eyesDraw(2)], { lw: 0.6 }, { phase1: { f: [0], fps: 1 }, phase2: { f: [1], fps: 1 }, phase3: { f: [2], fps: 1 } });

  // ---- hombrera: 36x32 (centro 18,18). 0 hueso, 1 con anillo de hierro (lado grillete)
  function shoulderDraw(f) {
    return function (v) {
      var i;
      for (i = 0; i < 3; i++) v.part(Ppoly([[8 + i * 8, 10], [10.5 + i * 8 + (i - 1) * 2, 0.5 + (i === 1 ? -1.5 : 1)], [14 + i * 8, 10]]), K.bone, { lw: 1.6, sh: K.boneS, hi: K.boneH, so: 0.7 });
      v.part(Pblob(18, 19, 16, 11.4, 541, 0.03, 10), K.bone, { lw: 2, sh: K.boneS, hi: K.boneH, so: 1.1 });
      lavaCrack(v, [[10, 14], [14, 19], [12, 25]], 0.8);
      if (f) { v.part(Prr(8, 22, 20, 7, 3), K.iron, { lw: 1.6, sh: K.ironS, hi: K.ironH, so: 0.7 }); v.dot(18, 25.5, 1.5, K.ironS); }
    };
  }
  addV('boss_karceron_shoulder', 36, 32, [shoulderDraw(0), shoulderDraw(1)], { lw: LW }, { bone: { f: [0], fps: 1 }, iron: { f: [1], fps: 1 } });

  // ---- hueso largo (se estira a lo largo): 14x40 base, el eje es +y. Sin tapas (los nudos cubren los extremos)
  addV('boss_karceron_bone', 14, 40, [function (v) {
    var x = v.ctx;
    x.fillStyle = K.boneS; x.fillRect(2.2, -2, 9.6, 44); x.fillStyle = K.bone; x.fillRect(2.2, -2, 7, 44); x.fillStyle = K.boneH; x.fillRect(2.8, -2, 2.2, 44);
    x.strokeStyle = OLC; x.lineWidth = 2.2; x.beginPath(); x.moveTo(1.8, -2); x.lineTo(1.8, 42); x.moveTo(12.4, -2); x.lineTo(12.4, 42); x.stroke();
    x.strokeStyle = K.mag; x.lineWidth = 0.7; x.beginPath(); x.moveTo(8, 4); x.lineTo(7, 14); x.lineTo(8.4, 22); x.stroke();
  }], { lw: LW });
  // ---- nudo de articulacion: 22x22 (centro 11,11)
  addV('boss_karceron_joint', 22, 22, [function (v) {
    v.part(Pblob(11, 11, 9.4, 9.4, 551, 0.06, 9), K.bone, { lw: LW, sh: K.boneS, hi: K.boneH, so: 1 }); lavaCrack(v, [[7, 8], [11, 12], [14, 16]], 0.7);
  }], { lw: LW });

  // ---- manos: 34x36 (muneca en 17,4). hand_l: 0 punyo con grillete, 1 abierta. hand_r (agarra la maza): 0 agarre, 1 abierta
  function handDraw(left, open) {
    return function (v) {
      v.part(Pblob(17, 20, 12.6, 11.4, left ? 561 : 562, 0.04, 9), K.bone, { lw: LW, sh: K.boneS, hi: K.boneH, so: 1 });
      var i;
      for (i = 0; i < 4; i++) {
        var fx = 8.4 + i * 5.6;
        if (open) v.part(Ppoly([[fx - 2, 22], [fx - 0.6 + (i - 1.5) * 1.2, 34.6], [fx + 2, 22]]), K.bone, { lw: 1.4, sh: K.boneS, so: 0.5 });
        else v.part(Pblob(fx, 29, 2.9, 3.4, 570 + i, 0.05, 6), K.bone, { lw: 1.4, sh: K.boneS, so: 0.5 });
      }
      v.part(Prr(8, 6, 18, 6.4, 2.4), left ? K.iron : K.boneS, { lw: 1.7, sh: left ? K.ironS : '#807454', hi: left ? K.ironH : K.bone, so: 0.6 });
      if (left) { v.part(Pcirc(17, 14.6, 3), K.iron, { lw: 1.3, sh: K.ironS, so: 0.4 }); v.dot(17, 14.6, 1.1, '#1b1124'); }
      lavaCrack(v, [[12, 16], [15, 21], [13, 26]], 0.6);
    };
  }
  addV('boss_karceron_hand_l', 34, 36, [handDraw(true, false), handDraw(true, true)], { lw: LW }, { fist: { f: [0], fps: 1 }, open: { f: [1], fps: 1 } });
  addV('boss_karceron_hand_r', 34, 36, [handDraw(false, false), handDraw(false, true)], { lw: LW }, { grip: { f: [0], fps: 1 }, open: { f: [1], fps: 1 } });

  // ---- maza de piedra: 40x64 (agarre en 20,50; la cabeza apunta a -y). Un solo frame (+1 clavada: brillo)
  function maceDraw(f) {
    return function (v) {
      v.part(Prr(17, 24, 6, 36, 2.4), '#6a4a30', { lw: 1.7, sh: '#40281a', hi: '#9a7048', so: 0.8 });
      v.part(Prr(15.6, 44, 8.8, 9, 2), '#3a2a22', { lw: 1.4, sh: '#241812', so: 0.5 });
      [[10, 0], [30, 0], [10, 20], [30, 20]].forEach(function (p, k) { v.part(Ppoly([[p[0] + (k % 2 ? 4 : -4), 4 + p[1] * 0.5], [p[0] + (k % 2 ? 9.6 : -9.6), 10 + p[1] * 0.5 + (k < 2 ? -3 : 3)], [p[0] + (k % 2 ? 4 : -4), 16 + p[1] * 0.5]]), K.rock, { lw: 1.5, sh: K.rockS, hi: K.rockH, so: 0.6 }); });
      v.part(Prr(6, 2, 28, 28, 6), K.rock, { lw: LW, sh: K.rockS, hi: K.rockH, so: 1.4 });
      v.part(Prr(4, 12, 32, 5.6, 1.6), K.iron, { lw: 1.5, sh: K.ironS, hi: K.ironH, so: 0.6 });
      lavaCrack(v, [[12, 4], [15, 11], [12, 19], [16, 27]], 1); lavaCrack(v, [[27, 5], [24, 13], [28, 22]], 0.8);
      if (f) { v.ctx.fillStyle = 'rgba(255,210,58,0.35)'; v.ctx.fillRect(6, 2, 28, 28); }
    };
  }
  addV('boss_karceron_mace', 40, 64, [maceDraw(0), maceDraw(1)], { lw: LW }, { held: { f: [0], fps: 1 }, planted: { f: [1], fps: 1 } });

  // ---- muñon de brazo roto: 26x26 (cara rota hacia -y, centro 13,22). Chispas/magma
  addV('boss_karceron_stump', 26, 26, [function (v) {
    v.part(Ppoly([[3.4, 24], [4.6, 16], [7.4, 18.4], [9.4, 11], [12.6, 16.4], [15, 8.6], [17.6, 16], [20.4, 13], [22.2, 24]]), K.bone, { lw: LW, sh: K.boneS, hi: K.boneH, so: 0.9 });
    v.part(Ppoly([[7, 24], [9, 18], [13, 20.4], [16.4, 17.6], [19, 24]]), K.mag, { lw: 0, sh: K.magD, so: 0.5 });
    v.dot(10.6, 19.6, 0.9, K.lavaH); v.dot(16.2, 20.6, 0.8, K.lavaH);
  }], { lw: LW });
  // ---- brazo caido (cobertura): 56x32 base = 112x64. 0 entero, 1 agrietado
  function fallenArm(f) {
    return function (v) {
      v.part(Pblob(28, 25, 24, 4.6, 581), 'rgba(18,10,26,0.8)', { lw: 0 });
      v.part(Prr(4, 14, 36, 10, 4.4), K.bone, { lw: LW, sh: K.boneS, hi: K.boneH, so: 1 });
      v.part(Pblob(40, 15, 6.4, 6.4, 582, 0.06, 8), K.bone, { lw: LW, sh: K.boneS, hi: K.boneH, so: 0.9 });
      v.part(Pblob(46, 17, 8.6, 7.2, 583, 0.05, 8), K.bone, { lw: LW, sh: K.boneS, hi: K.boneH, so: 0.9 });
      for (var i = 0; i < 3; i++) v.part(Pblob(52 - i * 2, 11 + i * 4.6, 2.6, 2.4, 584 + i, 0.05, 6), K.bone, { lw: 1.2, sh: K.boneS, so: 0.4 });
      v.part(Ppoly([[3, 14], [0.4, 18], [3, 24]]), K.boneS, { lw: 1.5, so: 0.4 });
      lavaCrack(v, [[12, 16], [18, 20], [24, 17]], 0.8);
      if (f) { lavaCrack(v, [[30, 13], [32, 18], [30, 24]], 1.1); lavaCrack(v, [[20, 14], [22, 24]], 0.8); }
    };
  }
  addV('obs_karceron_arm', 56, 32, [fallenArm(0), fallenArm(1)], { lw: LW }, { whole: { f: [0], fps: 1 }, cracked: { f: [1], fps: 1 } });

  // ---- nucleo de lava: 28x28. 0 latido, 1 expuesto (brillante, anillo dorado), 2 roto (esquirlas)
  function coreDraw(f) {
    return function (v) {
      var x = v.ctx, i;
      if (f === 2) {
        [[8, 10, 7], [18, 9, 6], [12, 19, 6.4], [20, 19, 5]].forEach(function (p, k) { v.part(Ppoly([[p[0] - p[2] * 0.5, p[1] + p[2] * 0.4], [p[0], p[1] - p[2] * 0.7], [p[0] + p[2] * 0.6, p[1] + p[2] * 0.5]]), k % 2 ? '#7a2a14' : K.magD, { lw: 1.4, sh: '#40140a', so: 0.5 }); });
        v.dot(14, 14, 1.4, K.mag); return;
      }
      if (f === 1) { x.strokeStyle = OLC; x.lineWidth = 3.6; x.beginPath(); x.arc(14, 14, 12.6, 0, TAU); x.stroke(); x.strokeStyle = '#ffd23a'; x.lineWidth = 2; x.beginPath(); x.arc(14, 14, 12.6, 0, TAU); x.stroke(); }
      v.part(Ppoly([[14, 3], [22, 8], [24, 17], [14, 25], [5, 18], [6, 8]]), f ? K.lava : K.mag, { lw: 1.9, sh: f ? K.mag : K.magD, hi: f ? K.lavaH : '#ff9a4a', so: 1.2 });
      v.part(Ppoly([[14, 8], [19, 12], [18, 19], [14, 21], [10, 17], [10, 12]]), f ? K.lavaH : K.lava, { lw: 0, sh: f ? K.lava : K.mag, so: 0.8 });
      v.dot(11.6, 11, 1.4, '#ffffff');
    };
  }
  addV('boss_karceron_core', 28, 28, [coreDraw(0), coreDraw(1), coreDraw(2)], { lw: LW }, { beat: { f: [0], fps: 1 }, exposed: { f: [1], fps: 1 }, broken: { f: [2], fps: 1 } });

  // ---- charco de magma del jefe: 112x40 base = 224x80 (elipse; el cuerpo emerge de el). 3 frames de burbujeo
  function poolDraw(f) {
    return function (v) {
      var x = v.ctx, i;
      v.part(Pblob(56, 21, 54, 17, 591, 0.03, 16), K.rock, { lw: LW, sh: K.rockS, hi: K.rockH, so: 1.4 });
      v.part(Pblob(56, 20.4, 48.6, 14, 592, 0.025, 16), K.mag, { lw: 1.4, ol: '#7a2a10', sh: K.magD, hi: '#ff9a3a', so: 1 });
      x.fillStyle = K.lava; x.globalAlpha = 0.7;
      for (i = 0; i < 6; i++) { var bx = 14 + pr(i + 7) * 84, by = 14 + pr(i + 17) * 14; x.beginPath(); x.ellipse(bx, by, 4 + pr(i + 2) * 5, 1.4 + pr(i) * 1.2, 0, 0, TAU); x.fill(); }
      x.globalAlpha = 1;
      for (i = 0; i < 4; i++) { var ph = (f / 3 + i / 4) % 1; v.dot(20 + i * 24 + pr(i + f) * 6, 22 - ph * 7, 2.6 * (1 - ph) + 0.6, ph < 0.8 ? K.lavaH : K.mag); }
      v.ctx.strokeStyle = K.lava; v.ctx.lineWidth = 1; v.ctx.beginPath(); v.ctx.ellipse(56, 20.4, 48.6, 14, 0, 0.2, Math.PI - 0.2); v.ctx.stroke();
    };
  }
  addV('boss_karceron_lava_pool', 112, 40, [poolDraw(0), poolDraw(1), poolDraw(2)], { lw: LW }, { bubble: { f: [0, 1, 2, 1], fps: 4 } });

  // ---- pilar de hueso (obstaculo r30): 30x48 base = 60x96; ancla = centro del circulo de colision (30,66 finales). 0 entero, 1 agrietado, 2 escombro, 3 reconstruyendo
  function pillarDraw(f) {
    return function (v) {
      var x = v.ctx, i;
      if (f === 2) {
        v.part(Pblob(15, 36, 12, 4.4, 601), '#2a2236', { lw: 1.3, sh: '#18121f', so: 0.5 });
        [[8, 33, 6], [18, 35, 7], [13, 29, 5], [22, 31, 4.6]].forEach(function (p, k) { v.part(Ppoly([[p[0] - p[2] * 0.5, p[1] + 1], [p[0], p[1] - p[2] * 0.8], [p[0] + p[2] * 0.5, p[1] - 1], [p[0] + p[2] * 0.4, p[1] + 2.4]]), k % 2 ? K.bone : '#c0b690', { lw: 1.4, sh: K.boneS, hi: K.boneH, so: 0.6 }); });
        v.dot(11, 30, 0.6, K.mag); return;
      }
      v.part(Pblob(15, 37.4, 13.4, 4.6, 602), '#18121f', { lw: 0 });
      v.part(Pblob(15, 35, 12, 4.4, 603, 0.03), K.rock, { lw: LW, sh: K.rockS, hi: K.rockH, so: 1 });
      var h = f === 3 ? 0.55 : 1, top = 36 - 30 * h;
      // columna de vertebras/femures apilados
      for (i = 0; i < 4; i++) {
        var yy = 33 - i * 7.6 * h; if (yy < top) break;
        v.part(Pblob(15, yy, 8.2 - (i === 1 || i === 2 ? 1 : 0), 4.4, 610 + i, 0.05, 8), K.bone, { lw: 1.7, sh: K.boneS, hi: K.boneH, so: 0.8 });
      }
      v.part(Pblob(15, top - 1.4, 9.6, 5.6, 615, 0.04, 9), K.bone, { lw: LW, sh: K.boneS, hi: K.boneH, so: 1 });
      // craneo de remate
      if (f !== 3) { v.part(Pblob(15, 6.6, 8.6, 6.6, 616, 0.04, 9), K.bone, { lw: LW, sh: K.boneS, hi: K.boneH, so: 1 }); v.dot(12.4, 7, 1.6, '#1b0e18'); v.dot(17.6, 7, 1.6, '#1b0e18'); v.ctx.fillStyle = K.mag; v.ctx.fillRect(11.8, 6.6, 1.2, 0.9); v.ctx.fillRect(17, 6.6, 1.2, 0.9); }
      if (f === 1) { lavaCrack(v, [[17, 10], [14, 18], [17, 25], [13, 32]], 1); x.strokeStyle = OLC; x.lineWidth = 1; x.beginPath(); x.moveTo(8, 20); x.lineTo(12, 22); x.stroke(); }
      if (f === 3) { x.globalAlpha = 0.7; v.dot(15, top - 4, 6, 'rgba(255,200,80,0.35)'); x.globalAlpha = 1; lavaCrack(v, [[9, 33], [12, 30]], 0.8); lavaCrack(v, [[20, 31], [22, 34]], 0.8); }
    };
  }
  addV('obs_bone_pillar', 30, 48, [pillarDraw(0), pillarDraw(1), pillarDraw(2), pillarDraw(3)], { lw: LW }, { whole: { f: [0], fps: 1 }, cracked: { f: [1], fps: 1 }, rubble: { f: [2], fps: 1 }, rebuild: { f: [3, 0], fps: 3, loop: false } });

  // ---- charco de lava (disco r70 final en el centro de 160x160): 80x80 base, 4 frames
  function lavaDiscDraw(f) {
    return function (v) {
      var x = v.ctx, i;
      x.save(); x.globalAlpha = 0.5; v.dot(40, 40, 38.4, 'rgba(255,90,20,0.35)'); x.restore();
      v.part(Pblob(40, 40, 36.4, 35.4, 620, 0.025, 18), K.rock, { lw: LW, sh: K.rockS, so: 1 });
      v.part(Pblob(40, 40, 33.6, 32.6, 621, 0.03, 18), K.mag, { lw: 1.2, ol: '#c8601a', sh: K.magD, hi: '#ff9a3a', so: 1.2 });
      x.save(); x.beginPath(); x.arc(40, 40, 33, 0, TAU); x.clip();
      x.fillStyle = K.lava; x.globalAlpha = 0.75;
      for (i = 0; i < 9; i++) { var a = pr(i + 3) * TAU + f * 0.25, d = 6 + pr(i + 9) * 24; x.beginPath(); x.ellipse(40 + Math.cos(a) * d, 40 + Math.sin(a) * d, 4 + pr(i) * 6, 1.8 + pr(i + 1) * 2, a, 0, TAU); x.fill(); }
      x.globalAlpha = 1;
      for (i = 0; i < 5; i++) { var ph = (f / 4 + i / 5) % 1, ba = pr(i + 20) * TAU, bd = 6 + pr(i + 30) * 22; v.dot(40 + Math.cos(ba) * bd, 40 + Math.sin(ba) * bd, 3.4 * (1 - ph) + 0.6, ph < 0.75 ? K.lavaH : K.mag); }
      x.restore();
      x.strokeStyle = K.lava; x.lineWidth = 1.4; x.beginPath(); x.arc(40, 40, 33.6, 0, TAU); x.stroke();
    };
  }
  addV('fx_lava_pool', 80, 80, [lavaDiscDraw(0), lavaDiscDraw(1), lavaDiscDraw(2), lavaDiscDraw(3)], { lw: LW }, { bubble: { f: [0, 1, 2, 3], fps: 5 } });

  // ---- baldosa de lava tileable: 32x32 base = 64x64, 4 frames (corriente)
  function lavaTile(f) {
    return function (v) {
      var x = v.ctx, i;
      x.fillStyle = K.mag; x.fillRect(0, 0, 32, 32);
      x.fillStyle = K.magD; for (i = 0; i < 5; i++) { var py = (i * 7 + f * 2) % 32; x.beginPath(); x.ellipse(8 + i * 5.4 % 32, py, 9, 2.4, 0, 0, TAU); x.fill(); x.beginPath(); x.ellipse(8 + i * 5.4 % 32 - 32, py, 9, 2.4, 0, 0, TAU); x.fill(); }
      x.fillStyle = K.lava; x.globalAlpha = 0.8; for (i = 0; i < 6; i++) { var px = (i * 11 + f * 3) % 32, py2 = (i * 13 + 5) % 32; [[0, 0], [-32, 0], [0, -32], [-32, -32]].forEach(function (o) { x.beginPath(); x.ellipse(px + o[0], py2 + o[1], 5, 1.7, 0.3, 0, TAU); x.fill(); }); }
      x.globalAlpha = 1; x.fillStyle = K.lavaH; for (i = 0; i < 3; i++) { x.fillRect((i * 13 + f * 5) % 31, (i * 9 + 3) % 31, 1.6, 1.2); }
    };
  }
  addV('fx_lava_tile', 32, 32, [lavaTile(0), lavaTile(1), lavaTile(2), lavaTile(3)], { lw: 0 }, { flow: { f: [0, 1, 2, 3], fps: 4 } });

  // ---- isla de piedra segura: 128x128 base = 256 (disco r120 final = 60 base). 0 normal, 1 iluminada (aviso), 2 agrietada/encogiendo
  function islandDraw(f) {
    return function (v) {
      var x = v.ctx, i;
      v.part(Pblob(64, 64, 62.6, 62, 630, 0.012, 22), f === 1 ? '#fff6e0' : '#2a2236', { lw: 1, ol: OLC, sh: null });
      v.part(Pblob(64, 64, 60, 59.4, 631, 0.015, 22), f === 1 ? '#f4ecd6' : K.rock, { lw: LW, sh: f === 1 ? '#c8bea4' : K.rockS, hi: f === 1 ? '#ffffff' : K.rockH, so: 2 });
      x.save(); x.beginPath(); x.arc(64, 64, 56, 0, TAU); x.clip();
      x.strokeStyle = f === 1 ? '#c8bea4' : '#1b1424'; x.lineWidth = 1.3;
      for (i = 0; i < 10; i++) { var a = i / 10 * TAU + 0.2; x.beginPath(); x.moveTo(64 + Math.cos(a) * 14, 64 + Math.sin(a) * 14); x.lineTo(64 + Math.cos(a + 0.12) * 40, 64 + Math.sin(a + 0.12) * 40); x.lineTo(64 + Math.cos(a - 0.05) * 62, 64 + Math.sin(a - 0.05) * 62); x.stroke(); }
      x.beginPath(); x.arc(64, 64, 26, 0, TAU); x.stroke(); x.beginPath(); x.arc(64, 64, 44, 0, TAU); x.stroke();
      x.restore();
      v.ctx.strokeStyle = f === 1 ? '#ffffff' : K.lava; x.lineWidth = f === 1 ? 3 : 1.6; x.beginPath(); x.arc(64, 64, 61, 0, TAU); x.stroke();
      if (f === 2) { for (i = 0; i < 6; i++) { var b = i / 6 * TAU + 0.5; lavaCrack(v, [[64 + Math.cos(b) * 58, 64 + Math.sin(b) * 58], [64 + Math.cos(b) * 46, 64 + Math.sin(b + 0.1) * 46], [64 + Math.cos(b) * 38, 64 + Math.sin(b - 0.05) * 38]], 1.3); } }
      else if (f === 0) { v.part(Pblob(64, 64, 9, 7, 632, 0.05, 8), '#4a3c58', { lw: 1.3, sh: K.rockS, so: 0.6 }); v.dot(63, 63, 1, K.mag); }
    };
  }
  addV('fx_island_stone', 128, 128, [islandDraw(0), islandDraw(1), islandDraw(2)], { lw: LW }, { calm: { f: [0], fps: 1 }, lit: { f: [1], fps: 1 }, crack: { f: [2], fps: 1 } });

  // ---- charco de brasas pequeno (r ~30): 36x36 base, 3 frames
  function emberPatch(f) {
    return function (v) {
      var x = v.ctx, i;
      v.part(Pblob(18, 18, 15, 13.6, 640, 0.07, 10), '#5a1e10', { lw: 1.6, sh: '#2a0c08', so: 0.7 });
      v.part(Pblob(18, 18, 12, 10.6, 641, 0.08, 10), K.mag, { lw: 0, sh: K.magD, hi: '#ff9a3a', so: 0.8 });
      for (i = 0; i < 5; i++) { var a = pr(i + f * 3) * TAU, d = pr(i + 9) * 8; v.dot(18 + Math.cos(a) * d, 18 + Math.sin(a) * d * 0.9, 1.4 + pr(i + f) * 1.2, i % 2 ? K.lava : K.lavaH); }
      x.fillStyle = 'rgba(255,200,70,0.8)'; x.fillRect(10 + f * 4, 6 + f * 3, 1.4, 1.4); x.fillRect(24 - f * 3, 8 + f, 1.2, 1.2);
    };
  }
  addV('fx_ember_patch', 36, 36, [emberPatch(0), emberPatch(1), emberPatch(2)], { lw: LW }, { glow: { f: [0, 1, 2, 1], fps: 5 } });

  // ---- grieta de lava (naranja, brillante): 48x48 base, 3 frames (crece)
  function crackLava(f) {
    return function (v) {
      var n = 5 + f, i, k, x = v.ctx;
      for (i = 0; i < n; i++) {
        var a = i / n * TAU + 0.3, len = (8 + f * 6) * (0.7 + pr(i + 5) * 0.5), pts = [[24, 24]];
        for (k = 1; k <= 3; k++) pts.push([24 + Math.cos(a + (pr(i * 3 + k) - 0.5) * 0.8) * len * k / 3 * 1.1, 24 + Math.sin(a + (pr(i * 3 + k) - 0.5) * 0.8) * len * k / 3 * 0.9]);
        v.stick(pts, 2.2 - f * 0.1, '#1a0a10', { lw: 0.8, ol: '#120c1a' });
        x.strokeStyle = f > 1 ? K.lava : K.mag; x.lineWidth = 0.9 + f * 0.25; x.beginPath(); x.moveTo(pts[0][0], pts[0][1]); for (k = 1; k < pts.length; k++) x.lineTo(pts[k][0], pts[k][1]); x.stroke();
      }
      v.dot(24, 24, 2.6 + f * 0.8, K.mag); v.dot(24, 24, 1.2 + f * 0.4, K.lavaH);
    };
  }
  addV('fx_boss_crack_lava', 48, 48, [crackLava(0), crackLava(1), crackLava(2)], { lw: 1 }, { grow: { f: [0, 1, 2], fps: 8, loop: false } });

  // ---- salpicadura de lava (martillazo/erupcion): 48x48 base, 5 frames
  function splash(f) {
    return function (v) {
      var x = v.ctx, i, rr = [4, 12, 18, 21, 22][f], al = [1, 1, 0.95, 0.7, 0.3][f];
      x.globalAlpha = al;
      if (f <= 2) { x.strokeStyle = K.lavaH; x.lineWidth = 3 - f * 0.6; x.beginPath(); x.arc(24, 26, rr * 0.8, 0, TAU); x.stroke(); }
      for (i = 0; i < 9; i++) {
        var a = -Math.PI + i / 8 * Math.PI + (pr(i) - 0.5) * 0.4, d = rr * (0.6 + pr(i + 9) * 0.6), px = 24 + Math.cos(a) * d, py = 26 + Math.sin(a) * d * 1.1 + f * 1.8, s = (3.8 - f * 0.55) * (0.7 + pr(i + 20) * 0.6);
        if (f === 4) { v.dot(px, py, 1.1, 'rgba(255,150,50,0.6)'); continue; }
        v.part(Pblob(px, py, s, s * 1.2, 650 + i, 0.1, 6), i % 3 ? K.mag : K.lava, { lw: 1.2, ol: '#7a2a10', sh: K.magD, so: 0.4 });
      }
      x.globalAlpha = 1;
    };
  }
  addV('fx_lava_splash', 48, 48, [splash(0), splash(1), splash(2), splash(3), splash(4)], { lw: 1.2 }, { burst: { f: [0, 1, 2, 3, 4], fps: 14, loop: false } });

  // ---- meteoro de brasa (cae): 16x16 base = 32. apunta hacia ABAJO (la estela sube). 3 frames
  function meteor(f) {
    return function (v) {
      var x = v.ctx;
      x.fillStyle = 'rgba(255,120,30,0.45)'; x.beginPath(); x.moveTo(5, 1 + f); x.lineTo(11, 1 + f); x.lineTo(9.4, 8); x.lineTo(6.6, 8); x.closePath(); x.fill();
      x.fillStyle = 'rgba(255,200,70,0.55)'; x.beginPath(); x.moveTo(6.6, 0 + f); x.lineTo(9.4, 0 + f); x.lineTo(8.6, 7); x.lineTo(7.4, 7); x.closePath(); x.fill();
      v.part(Pblob(8, 10.4, 4.6 + f * 0.2, 4.4, 660 + f, 0.1, 8), K.rock, { lw: 1.4, sh: K.rockS, hi: K.rockH, so: 0.7 });
      lavaCrack(v, [[6, 8.6], [8, 11], [10.4, 10]], 0.8); v.dot(8, 11, 1.2, K.lavaH);
    };
  }
  addV('proj_ember_big', 16, 16, [meteor(0), meteor(1), meteor(2)], { lw: 1.4 }, { loop: { f: [0, 1, 2], fps: 12 } });
  // ---- puas de hueso: 14x6 base = 28x12, apunta a la derecha. 2 frames
  function boneSpike(f) {
    return function (v) {
      v.part(Ppoly([[0.6, 3], [3, 0.8], [13.4, 3], [3, 5.2]]), K.bone, { lw: 1.2, sh: K.boneS, hi: K.boneH, so: 0.5 });
      v.part(Ppoly([[0.4, 1.2], [3.4, 1], [3, 3], [0.4, 4.8], [3.4, 5], [3, 3]]), K.boneS, { lw: 0.6, sh: null });
      v.dot(2.4, 3, f ? 1.5 : 1, f ? K.lava : K.mag);
    };
  }
  addV('proj_bone_spike', 14, 6, [boneSpike(0), boneSpike(1)], { lw: 1.2 }, { loop: { f: [0, 1], fps: 10 } });

  // ---- retrato de Karceron / Letea (48x48 = 96): 0 neutro, 1 furia, 2 herido. Cuerpo de cada uno mas abajo; se registra al final del fichero
  function portraitFrame(kind, f) {
    return function (v) {
      var x = v.ctx, red = f === 1;
      v.part(Prr(1.4, 1.4, 45.2, 45.2, 6), kind === 'k' ? (red ? '#3a0f18' : '#241830') : (red ? '#10303a' : '#12282e'), { lw: 2, ol: OLC, sh: '#0e0a16', so: 1.4 });
      x.save(); x.beginPath(); Prr(2.4, 2.4, 43.2, 43.2, 5)(x); x.clip();
      var g = x.createRadialGradient(24, 24, 2, 24, 24, 30);
      if (kind === 'k') { g.addColorStop(0, red ? 'rgba(255,70,40,0.6)' : 'rgba(255,120,30,0.45)'); g.addColorStop(1, 'rgba(0,0,0,0)'); }
      else { g.addColorStop(0, red ? 'rgba(180,255,120,0.5)' : 'rgba(110,230,200,0.4)'); g.addColorStop(1, 'rgba(0,0,0,0)'); }
      x.fillStyle = g; x.fillRect(0, 0, 48, 48);
      x.restore();
      x.save(); x.beginPath(); Prr(2.4, 2.4, 43.2, 43.2, 5)(x); x.clip();
      if (kind === 'k') {
        v.part(Pblob(24, 52, 26, 12, 671), K.bone, { lw: 1.8, sh: K.boneS, hi: K.boneH, so: 1 });
        x.save(); x.translate(24 - 20 * 1.05, 44 - 36 * 1.05); x.scale(1.05, 1.05); skullDraw(f === 2 ? 2 : (f === 1 ? 1 : 0))(v);
        if (f !== 2) { x.save(); x.translate(6, 12); eyesDraw(f === 1 ? 1 : 0)(v); x.restore(); }
        x.restore();
      } else {
        v.part(Pblob(24, 54, 28, 12, 672), '#2f6f6a', { lw: 1.8, sh: '#1f4a4a', hi: '#5ba89a', so: 1 });
        var cols = [['#7be34a', '#3f8a28', '#d0ff9a'], ['#6ac8ff', '#2a78a8', '#d0f0ff'], ['#ffe45a', '#b49a1c', '#fff6b0']];
        [-13, 13, 0].forEach(function (dx, i) { var cc = cols[i], sc = i === 2 ? 0.74 : 0.6; x.save(); x.translate(24 + dx - 20 * sc, (i === 2 ? 36 : 40) - 16 * sc); x.scale(sc, sc); letHead(v, i, f === 2 ? 3 : (f === 1 ? 2 : 0)); x.restore(); });
      }
      x.restore();
      if (f === 2) { x.strokeStyle = '#fff6e0'; x.lineWidth = 0.9; x.beginPath(); x.moveTo(30, 4); x.lineTo(27, 12); x.lineTo(31, 19); x.lineTo(28, 27); x.stroke(); }
      v.part(Prr(1.4, 1.4, 45.2, 45.2, 6), 'rgba(0,0,0,0)', { lw: 2, ol: OLC });
      x.strokeStyle = red ? '#ff6a5a' : '#c8a050'; x.lineWidth = 0.9; x.beginPath(); Prr(3.2, 3.2, 41.6, 41.6, 4.4)(x); x.stroke();
    };
  }

  // ===================================================================== infraestructura de render (canvas compartido por jefe + rect sucio)
  var CVS = {};
  function getR(id, W, Hh, OX, OY) { return CVS[id] || (CVS[id] = { cv: mkc(W, Hh), box: null, W: W, H: Hh, OX: OX, OY: OY }); }
  function beginR(R) {
    var x = R.cv.getContext('2d'); x.setTransform(1, 0, 0, 1, 0, 0); x.globalCompositeOperation = 'source-over'; x.globalAlpha = 1;
    if (R.box) x.clearRect(R.box.x, R.box.y, R.box.w, R.box.h); else x.clearRect(0, 0, R.W, R.H);
    x.imageSmoothingEnabled = true; R.bb = { x0: 1e9, y0: 1e9, x1: -1e9, y1: -1e9 }; return x;
  }
  function ext(R, rx, ry, r) { var b = R.bb; b.x0 = Math.min(b.x0, R.OX + rx - r); b.y0 = Math.min(b.y0, R.OY + ry - r); b.x1 = Math.max(b.x1, R.OX + rx + r); b.y1 = Math.max(b.y1, R.OY + ry + r); }
  function extR(R, x0, y0, x1, y1) { var b = R.bb; b.x0 = Math.min(b.x0, R.OX + x0); b.y0 = Math.min(b.y0, R.OY + y0); b.x1 = Math.max(b.x1, R.OX + x1); b.y1 = Math.max(b.y1, R.OY + y1); }
  function endR(R) {
    var b = R.bb, x0 = clamp(Math.floor(b.x0) - 3, 0, R.W), y0 = clamp(Math.floor(b.y0) - 3, 0, R.H), x1 = clamp(Math.ceil(b.x1) + 3, 0, R.W), y1 = clamp(Math.ceil(b.y1) + 3, 0, R.H);
    R.box = { x: x0, y: y0, w: Math.max(1, x1 - x0), h: Math.max(1, y1 - y0) }; return R.box;
  }
  function tintR(R, x, s, dying, dt, hv) {
    var b = R.box, t = s.t || 0; x.setTransform(1, 0, 0, 1, 0, 0); x.globalCompositeOperation = 'source-atop';
    function fill(c) { x.fillStyle = c; x.fillRect(b.x, b.y, b.w, b.h); }
    if (s.enraged && !dying) fill('rgba(255,30,10,' + (0.12 + 0.07 * Math.sin(t / 160)).toFixed(3) + ')');
    if (s.exposed && !dying) fill('rgba(255,210,60,' + (0.16 + 0.1 * Math.sin(t / 130)).toFixed(3) + ')');
    if (s.immune && !dying) fill('rgba(200,235,255,' + (0.22 + 0.12 * Math.sin(t / 90)).toFixed(3) + ')');
    if (hv > 0) fill('rgba(255,255,255,' + (hv * 0.85).toFixed(3) + ')');
    x.globalCompositeOperation = 'source-over';
  }
  function hurtOf(s, dying, dt) {
    var hv = s.hurt === true ? 1 : clamp(+s.hurt || 0, 0, 1);
    if (dying && dt < 800) hv = Math.max(hv, (Math.floor(dt / 70) % 2) ? 0.85 : 0.15);
    if (dying && dt < 150) hv = 1; return hv;
  }
  var GL = {};
  function glowSpr(col) {
    if (GL[col]) return GL[col]; var c = mkc(64, 64), g = c.getContext('2d'), gr = g.createRadialGradient(32, 32, 0, 32, 32, 32); gr.addColorStop(0, 'rgba(' + col + ',1)'); gr.addColorStop(1, 'rgba(' + col + ',0)'); g.fillStyle = gr; g.fillRect(0, 0, 64, 64); return (GL[col] = c);
  }
  function glowAt(x, px, py, r, col, a) { var ga = x.globalAlpha; x.globalAlpha = ga * clamp(a, 0, 1); x.drawImage(glowSpr(col), px - r, py - r, r * 2, r * 2); x.globalAlpha = ga; }

  // ===================================================================== KARCERON: pose
  var KGY = 78, KDEATH = 3600;
  var KNAMES = ['martillazo', 'barrido', 'brasas', 'aliento', 'costillas', 'erupcion', 'penitentes', 'marea', 'requiem'];
  var KSH = { x: 98, y: -58 };       // hombros (R = +x, L = -x)
  var HAND_R = [172, 112], HAND_L = [-172, 112];
  function ik(shx, shy, hx, hy, side) {
    var dx = hx - shx, dy = hy - shy, d = Math.sqrt(dx * dx + dy * dy) || 1, Lb = Math.max(100, d * 0.5 + 3), hh = Math.sqrt(Math.max(0, Lb * Lb - d * d / 4));
    var mx = shx + dx / 2, my = shy + dy / 2, nx = -dy / d, ny = dx / d, a = { x: mx + nx * hh, y: my + ny * hh }, b = { x: mx - nx * hh, y: my - ny * hh };
    return (side * a.x + (-a.y) * 0.25 > side * b.x + (-b.y) * 0.25) ? a : b;
  }
  function kPose(s) {
    var t = s.t || 0, W = s.windup, ST = s.strike, wp = s.wp != null ? s.wp : ((t % 1100) / 1100), sp = s.sp != null ? s.sp : ((t % 600) / 600), u = ease(wp), q = ease(sp);
    if (s.desperate && !W && !ST) W = 'requiem';
    var P = { by: 0, tilt: 0, sr: 0, sy: 0, jaw: 0, open: s.open != null ? clamp(+s.open, 0, 1) : 0, glow: 0.5, shake: 0, hf: 0, spikes: 0, embers: 0, flare: 0, breath: 0, planted: 0, cracks: 0, pulse: 0, splash: 0,
      R: { x: HAND_R[0] + Math.sin(t / 1100) * 3, y: HAND_R[1] + Math.sin(t / 800) * 2.5, th: -Math.PI / 2 + 0.38, open: 0, abs: 0 }, L: { x: HAND_L[0] + Math.sin(t / 1000 + 1) * 3, y: HAND_L[1] + Math.sin(t / 900) * 2.5, open: 0, ca: Math.PI / 2 }, T: null, eyes: 0, chainLoose: 0 };
    P.sr = Math.sin(t / 1300) * 0.025; P.by = Math.sin(t / 900) * 2;
    var look = clamp((s.facing || 0) * 0.08, -0.1, 0.1); P.sr += look;
    var m = null; function A_(n) { return ST === n ? 'S' : (W === n && !ST ? 'W' : null); }
    var T = null;
    if (s.tx != null && s.ty != null) { var dd = Math.sqrt(s.tx * s.tx + s.ty * s.ty), kk = dd > 400 ? 400 / dd : 1; T = { x: s.tx * kk, y: s.ty * kk }; }
    function maceFinal(T0) { var dx = T0.x - KSH.x, dy = T0.y - KSH.y, d = Math.sqrt(dx * dx + dy * dy) || 1, ux = dx / d, uy = dy / d; return { x: T0.x - ux * 88, y: T0.y - uy * 88, th: Math.atan2(uy, ux) }; }
    if ((m = A_('martillazo'))) {
      var T0 = T || { x: 150, y: 110 }, F = maceFinal(T0);
      if (m === 'W') { P.R.x = lerp(HAND_R[0], 70, u); P.R.y = lerp(HAND_R[1], -196, u); P.R.th = angLerp(-Math.PI / 2 + 0.38, -Math.PI + 0.45, u); P.tilt = -0.05 * u; P.L.x = lerp(HAND_L[0], -150, u); P.L.y = lerp(HAND_L[1], -10, u); P.sr -= 0.18 * u; P.flare = 0.4 * u; P.shake = 0.6 * u; P.by -= 6 * u; P.T = T0; }
      else { var qq = ease(clamp(sp / 0.4, 0, 1)); P.R.x = lerp(70, F.x, qq); P.R.y = lerp(-196, F.y, qq); P.R.th = angLerp(-Math.PI + 0.45, F.th, qq); P.R.abs = 1; P.tilt = lerp(-0.05, 0.06, qq); P.planted = sp > 0.4 ? 1 : 0; P.shake = sp > 0.38 ? 3 * (1 - clamp((sp - 0.4) / 0.6, 0, 1)) : 0; P.splash = sp > 0.38 ? clamp((sp - 0.38) / 0.4, 0, 1) : 0; P.T = T0; P.hf = sp > 0.4 ? 0 : 1; }
    } else if (s.stuck && T) {
      var F2 = maceFinal(T); P.R.x = F2.x; P.R.y = F2.y; P.R.th = F2.th; P.R.abs = 1; P.planted = 1; P.T = T; P.tilt = 0.06; P.sr += 0.1;
    } else if ((m = A_('barrido'))) {
      var a0 = (s.aim || 0), st = a0 - 1.22, en = a0 + 1.22;
      if (m === 'W') { var an = st, rd = lerp(150, 175, u); P.L.x = Math.cos(an) * rd; P.L.y = Math.sin(an) * rd - 36 * u; P.L.open = 0; P.tilt = -0.05 * u; P.R.x = lerp(HAND_R[0], 130, u); P.R.y = lerp(HAND_R[1], -6, u); P.L.ca = an + 1.2; P.shake = 0.5 * u; }
      else { var an2 = lerp(st, en, q), rd2 = lerp(175, 295, ease(clamp(sp * 3, 0, 1))); P.L.x = Math.cos(an2) * rd2; P.L.y = Math.sin(an2) * rd2 - 6; P.L.open = 1; P.L.ca = an2 - 1.5; P.tilt = lerp(-0.05, 0.07, q); P.R.x = 130; P.R.y = -6; P.shake = 1.2; P.hf = 1; }
    } else if ((m = A_('brasas'))) {
      if (m === 'W') { P.R.x = lerp(HAND_R[0], 120, u); P.R.y = lerp(HAND_R[1], -215, u); P.R.th = -Math.PI / 2 + 0.2; P.L.x = -lerp(-HAND_L[0], 120, u); P.L.y = lerp(HAND_L[1], -215, u); P.L.open = 1; P.sr -= 0.28 * u; P.jaw = 0.9 * u; P.embers = u; P.flare = 0.7 * u; P.shake = 0.7 * u; P.hf = u > 0.4 ? 1 : 0; P.by -= 5 * u; }
      else { P.R.x = lerp(120, 178, q); P.R.y = lerp(-215, 62, q); P.R.th = lerp(-Math.PI / 2 + 0.2, Math.PI / 2 - 0.2, q); P.L.x = -P.R.x; P.L.y = P.R.y; P.L.open = 1; P.embers = 1 - 0.5 * sp; P.shake = sp > 0.5 ? 2.4 * (1 - sp) : 0; P.hf = 1; P.jaw = 1 - sp; P.flare = 1 - sp * 0.6; P.by += 6 * q; }
    } else if ((m = A_('aliento'))) {
      var a1 = s.aim || 0;
      if (m === 'W') { P.R.x = lerp(HAND_R[0], 196, u); P.R.y = lerp(HAND_R[1], 74, u); P.L.x = -P.R.x; P.L.y = P.R.y; P.sr += clamp(Math.cos(a1) * 0.4, -0.4, 0.4) * u - 0.14 * u; P.jaw = u; P.flare = u; P.hf = u > 0.5 ? 1 : 0; P.by -= 4 * u; P.shake = 0.8 * u; P.tilt = -0.03 * u; P.breath = 0; }
      else { P.R.x = 196; P.R.y = 74; P.L.x = -196; P.L.y = 74; P.sr += clamp(Math.cos(a1) * 0.4, -0.4, 0.4) - 0.1; P.jaw = 1; P.flare = 1; P.hf = 1; P.breath = clamp(sp * 5, 0, 1); P.shake = 1.4; P.tilt = 0.03; P.embers = 0.6; }
    } else if ((m = A_('costillas'))) {
      if (m === 'W') { P.R.x = lerp(HAND_R[0], 70, u); P.R.y = lerp(HAND_R[1], -26, u); P.L.x = -P.R.x; P.L.y = P.R.y; P.spikes = u; P.glow = 0.5 + 0.5 * u; P.shake = 1.4 * u; P.open = Math.max(P.open, 0.12 * u); P.sr -= 0.1 * u; P.flare = 0.5 * u; }
      else { P.R.x = lerp(70, 205, q); P.R.y = lerp(-26, -64, q); P.L.x = -P.R.x; P.L.y = P.R.y; P.R.th = -0.5; P.R.open = 1; P.L.open = 1; P.spikes = 1 - 0.7 * sp; P.glow = 1; P.shake = sp < 0.5 ? 2.4 : 0.4; P.open = Math.max(P.open, 0.3 * (1 - sp)); P.hf = 1; P.jaw = 0.6; }
    } else if ((m = A_('erupcion'))) {
      if (m === 'W') { P.open = Math.max(P.open, u); P.R.x = lerp(HAND_R[0], 196, u); P.R.y = lerp(HAND_R[1], -118, u); P.L.x = -P.R.x; P.L.y = P.R.y; P.R.open = 1; P.L.open = 1; P.sr -= 0.3 * u; P.jaw = 0.7 * u; P.glow = 0.6 + 0.4 * u; P.shake = 1.4 * u; P.hf = u > 0.5 ? 1 : 0; P.flare = u; }
      else { P.open = 1; P.R.x = 196; P.R.y = -118; P.L.x = -196; P.L.y = -118; P.R.open = 1; P.L.open = 1; P.sr -= 0.32; P.jaw = 1; P.hf = 1; P.glow = 1; P.pulse = sp; P.shake = sp < 0.4 ? 3.2 : 0.8; P.flare = 1; }
    } else if ((m = A_('penitentes'))) {
      if (m === 'W') { P.R.x = lerp(HAND_R[0], 176, u); P.R.y = lerp(HAND_R[1], -150, u); P.L.x = -P.R.x; P.L.y = P.R.y; P.R.open = 1; P.L.open = 1; P.chainLoose = u; P.sr -= 0.16 * u; P.flare = 0.6 * u; P.shake = 0.7 * u; P.glow = 0.5 + 0.4 * u; }
      else { P.R.x = lerp(176, 150, q); P.R.y = lerp(-150, -10, q); P.L.x = -P.R.x; P.L.y = P.R.y; P.chainLoose = 1 - q; P.hf = 1; P.jaw = 0.7; P.shake = sp < 0.4 ? 2 : 0; P.flare = 1; }
    } else if ((m = A_('marea'))) {
      if (m === 'W') { P.by += 16 * u; P.R.x = lerp(HAND_R[0], 214, u); P.R.y = lerp(HAND_R[1], -102, u); P.L.x = -P.R.x; P.L.y = P.R.y; P.R.open = 1; P.L.open = 1; P.sr -= 0.32 * u; P.jaw = u; P.hf = u > 0.4 ? 1 : 0; P.cracks = u; P.shake = 2 * u; P.flare = u; P.embers = u; }
      else { P.by += lerp(16, 0, q); P.R.x = lerp(214, 236, q); P.R.y = lerp(-102, 72, q); P.L.x = -P.R.x; P.L.y = P.R.y; P.R.open = 1; P.L.open = 1; P.cracks = 1; P.shake = sp < 0.5 ? 4 : 1; P.hf = 1; P.jaw = 1; P.flare = 1; P.embers = 1; }
    } else if ((m = A_('requiem'))) {
      P.open = 1; P.by += 40 + Math.sin(t / 380) * 3; P.R.x = 124; P.R.y = -178 + Math.sin(t / 500) * 6; P.L.x = -124; P.L.y = P.R.y; P.R.open = 1; P.L.open = 1; P.sr -= 0.32; P.jaw = 1; P.hf = 1; P.glow = 1; P.shake = 1.4; P.flare = 1; P.embers = 1; P.eyes = 2;
    }
    if (s.stun) { P.sr = 0.0; P.sy = 16; P.hf = 2; P.R.x = 178; P.R.y = 76; P.L.x = -178; P.L.y = 76; P.R.open = 1; P.L.open = 1; P.tilt = 0.05; P.by += 8; P.glow = 0.25; P.jaw = 0; P.flare = 0; P.planted = 0; P.R.abs = 0; P.R.th = Math.PI / 2 - 0.3; }
    if (s.roar > 0) { var ro = ease(s.roar); P.sr = -0.3 * ro; P.jaw = ro; P.hf = 1; P.shake = Math.max(P.shake, 2 * ro); P.R.x = lerp(P.R.x, 214, ro); P.R.y = lerp(P.R.y, -60, ro); P.L.x = -P.R.x; P.L.y = P.R.y; P.R.open = 1; P.L.open = 1; P.flare = ro; P.embers = Math.max(P.embers, ro); P.glow = 1; }
    if (s.hurt > 0) { var hh = clamp(+s.hurt, 0, 1); P.tilt -= 0.04 * hh; P.hf = hh > 0.25 ? 2 : P.hf; P.by += 3 * hh; }
    if (s.broken && s.broken.nucleo) { P.open = Math.max(P.open, 0.5); P.glow = Math.max(P.glow, 0.8); }
    if (s.open != null) P.open = clamp(+s.open, 0, 1);
    var sk = clamp(s.sunk || 0, 0, 1), em = s.emerge == null ? 1 : clamp(+s.emerge, 0, 1);
    P.sunk = sk; P.emerge = em;
    if (em < 1) { var e2 = ease((em - 0.35) / 0.65); P.by += (1 - e2) * 200; P.shake = Math.max(P.shake, em < 0.35 ? 3 : 2 * (1 - e2)); P.cracks = Math.max(P.cracks, em < 0.9 ? 1 : 0); P.R.y += (1 - e2) * 120; P.L.y += (1 - e2) * 120; P.R.x = lerp(HAND_R[0], P.R.x, e2); }
    if (sk > 0) { P.by += ease(sk) * 200; P.shake = Math.max(P.shake, 1.4 * sk); }
    P.moving = s.moving === true ? 1 : +s.moving || 0;
    P.hungry = !!s.hungry || !!(s.broken && s.broken.nucleo && (s.hungry == null || s.hungry));
    P.eyes = P.eyes || (s.desperate ? 2 : (s.enraged || P.hungry ? 1 : clamp((s.phase || 1) - 1, 0, 2)));
    P.wp = wp; P.sp = sp;
    return P;
  }
  function kDeath(P, dt) {
    var a = clamp(dt / 900, 0, 1), c = ease((dt - 900) / 1700);
    P.hf = 2; P.R.th = Math.PI / 2; P.R.open = 1; P.L.open = 1; P.planted = 0; P.R.abs = 0; P.T = null; P.spikes = 0; P.breath = 0; P.pulse = 0; P.splash = 0; P.cracks = 0; P.flare = 0; P.jaw = a * 0.8; P.embers = 0.5;
    P.open = Math.max(P.open, a); P.sr = -0.25 * a + 0.5 * c; P.sy = 20 * c; P.by = 24 * c + 190 * ease((dt - 1500) / 1600); P.tilt = 0.08 * c;
    P.R.x = lerp(P.R.x, 190, c); P.R.y = lerp(P.R.y, 84, c); P.L.x = -P.R.x; P.L.y = P.R.y;
    P.shake = dt < 1500 ? 4.4 * (1 - c * 0.7) : 0.5; P.eyes = dt > 1100 ? 3 : 2; P.glow = 1 - c * 0.6; P.dead = clamp((dt - 1500) / 1500, 0, 1);
    return P;
  }
  function kPoseFor(s) { var P = kPose(s); if (s.dying) kDeath(P, s.dt != null ? s.dt : (s.deathT || 0)); return P; }

  // anclajes (relativos a la entidad)
  function kLayout(P, s) {
    var by = P.by, br = (s.broken || {}), rh = { x: P.R.x, y: P.R.y + (P.R.abs ? 0 : by * 0.6) }, lh = { x: P.L.x, y: P.L.y + by * 0.6 };
    var mh = { x: rh.x + Math.cos(P.R.th) * 88, y: rh.y + Math.sin(P.R.th) * 88 };
    if (P.R.abs && P.T) mh = { x: P.T.x, y: P.T.y };
    var sR = { x: KSH.x, y: KSH.y + by }, sL = { x: -KSH.x, y: KSH.y + by };
    var eR = ik(sR.x, sR.y, rh.x, rh.y, 1), eL = ik(sL.x, sL.y, lh.x, lh.y, -1);
    var skull = { x: Math.sin(P.sr) * 40, y: -62 + by + P.sy - Math.cos(P.sr) * 40 };
    return { rh: rh, lh: lh, mh: mh, sR: sR, sL: sL, eR: eR, eL: eL, skull: skull, mouth: { x: Math.sin(P.sr) * 30, y: -66 + by + P.sy + P.jaw * 8 }, chest: { x: 0, y: -10 + by }, core: { x: 0, y: -10 + by }, body: { x: 0, y: 0 } };
  }

  // ===================================================================== KARCERON: render
  var LINKS = null, BX = 0, BY = 0;
  function linkSprites() {
    if (LINKS) return LINKS;
    function mk(rx, ry) {
      var c = mkc(Math.ceil(rx * 2 + 8), Math.ceil(ry * 2 + 8)), g = c.getContext('2d'), cx = c.width / 2, cy = c.height / 2;
      g.beginPath(); g.ellipse(cx, cy, rx, ry, 0, 0, TAU); g.strokeStyle = OLC; g.lineWidth = 4.6; g.stroke(); g.strokeStyle = K.iron; g.lineWidth = 2.2; g.stroke();
      g.strokeStyle = K.ironH; g.lineWidth = 0.8; g.beginPath(); g.ellipse(cx, cy - 0.6, rx * 0.8, ry * 0.7, 0, Math.PI * 1.1, Math.PI * 1.8); g.stroke(); return c;
    }
    return (LINKS = [mk(5.6, 3.6), mk(4.2, 2.4)]);
  }
  function chainLine(ax, ay, bx, by, sag, n) {
    var cx = (ax + bx) / 2, cy = (ay + by) / 2 + sag, i, L = linkSprites();
    for (i = 0; i <= n; i++) {
      var u = i / n, px = (1 - u) * (1 - u) * ax + 2 * u * (1 - u) * cx + u * u * bx, py = (1 - u) * (1 - u) * ay + 2 * u * (1 - u) * cy + u * u * by;
      var tx = 2 * (1 - u) * (cx - ax) + 2 * u * (bx - cx), ty = 2 * (1 - u) * (cy - ay) + 2 * u * (by - cy), ang = Math.atan2(ty, tx), co = Math.cos(ang), si = Math.sin(ang), sp = L[i % 2];
      x.setTransform(co, si, -si, co, BX + px, BY + py); x.drawImage(sp, -sp.width / 2, -sp.height / 2);
    }
    x.setTransform(1, 0, 0, 1, BX, BY);
  }
  var x; // contexto activo de dibujo (compartido por los helpers de render)
  function boneSeg(ax, ay, bx, by, w) {
    var dx = bx - ax, dy = by - ay, len = Math.sqrt(dx * dx + dy * dy) || 1;
    x.save(); x.translate(ax, ay); x.rotate(Math.atan2(dy, dx) - Math.PI / 2); x.drawImage(A.sprite('boss_karceron_bone', 0), -w / 2, -3, w, len + 6); x.restore();
  }
  function joint(px, py, sc) { var j = A.sprite('boss_karceron_joint', 0), w = j.width * (sc || 1); x.drawImage(j, px - w / 2, py - w / 2, w, w); }

  function renderKarceron(s) {
    var R = getR('karceron', 900, 700, 450, 400), t = s.t || 0, br = s.broken || {}, dying = !!s.dying, dt = dying ? (s.dt != null ? s.dt : (s.deathT || 0)) : 0, i;
    x = beginR(R);
    if (dying && dt >= KDEATH) { R.bb = { x0: 0, y0: 0, x1: 1, y1: 1 }; endR(R); return { canvas: R.cv, ox: R.OX, oy: R.OY, box: R.box }; }
    var P = kPoseFor(s), Lt = kLayout(P, s), by = P.by;
    var shx = P.shake ? Math.sin(t * 0.13) * P.shake : 0, shy = P.shake ? Math.cos(t * 0.17) * P.shake * 0.6 : 0;
    BX = R.OX + shx; BY = R.OY + shy; x.translate(BX, BY);
    extR(R, -140, -150, 140, 125);
    var pf = [0, 1, 2, 1][Math.floor(t / 250) % 4];
    x.drawImage(A.sprite('boss_karceron_lava_pool', pf), -112, KGY - 42);
    if (P.moving > 0.05) { x.strokeStyle = 'rgba(255,210,58,' + (0.5 * P.moving).toFixed(2) + ')'; x.lineWidth = 2; for (i = 0; i < 2; i++) { var rp = ((t / 900) + i * 0.5) % 1; x.beginPath(); x.ellipse(0, KGY + 2, 112 + rp * 24, 36 + rp * 9, 0, 0, TAU); x.stroke(); } }
    var vis = P.sunk >= 1 ? 0 : 1;
    if (vis && (by < 230)) {
      // ---- cuerpo (recortado por la superficie de la lava)
      x.save(); x.beginPath(); x.rect(-450, -400, 900, 400 + KGY + 6); x.clip();
      x.save(); x.translate(0, 70 + by); x.rotate(P.tilt); x.translate(0, -70);
      var o2 = clamp(P.open, 0, 1) * 2, f0 = Math.min(2, Math.floor(o2)), f1 = Math.min(2, f0 + 1), fr = o2 - f0;
      if (f0 === 2) { f1 = 2; fr = 0; }
      var cav0 = A.sprite('boss_karceron_cavity', f0);
      x.drawImage(cav0, -96, -74); if (fr > 0.02) { x.globalAlpha = fr; x.drawImage(A.sprite('boss_karceron_cavity', f1), -96, -74); x.globalAlpha = 1; }
      // nucleo
      var cfr = br.nucleo ? 2 : ((s.exposed || P.open > 0.6) ? 1 : 0), beat = (cfr === 1 ? 1.25 : 1) + 0.07 * Math.sin(t / (P.hungry ? 150 : 400)) + (P.flare * 0.05), ca = br.nucleo ? 0.95 : clamp(0.72 + P.open * 0.4 + P.glow * 0.1, 0, 1);
      x.save(); x.globalAlpha = ca; x.translate(0, -10); x.scale(beat, beat); var cs = A.sprite('boss_karceron_core', cfr); x.drawImage(cs, -cs.width / 2, -cs.height / 2); x.restore();
      var tor0 = A.sprite('boss_karceron_torso', f0); x.drawImage(tor0, -96, -74); if (fr > 0.02) { x.globalAlpha = fr; x.drawImage(A.sprite('boss_karceron_torso', f1), -96, -74); x.globalAlpha = 1; }
      // puas de hueso asomando entre las costillas (costillas)
      if (P.spikes > 0.05) {
        for (i = 0; i < 10; i++) {
          var sd = i < 5 ? -1 : 1, k5 = i % 5, bx = sd * (60 - k5 * 4), byy = -52 + k5 * 19, ln = 22 * P.spikes, ang = sd > 0 ? -0.25 + (k5 - 2) * 0.28 : Math.PI + 0.25 - (k5 - 2) * 0.28;
          x.save(); x.translate(bx, byy); x.rotate(ang); x.beginPath(); x.moveTo(0, -4.4); x.lineTo(ln, 0); x.lineTo(0, 4.4); x.closePath(); x.fillStyle = K.bone; x.fill(); x.strokeStyle = OLC; x.lineWidth = 2; x.stroke(); x.beginPath(); x.moveTo(ln * 0.45, -1); x.lineTo(ln, 0); x.lineTo(ln * 0.45, 1.6); x.fillStyle = K.mag; x.fill(); x.restore();
        }
      }
      // cadena que cruza el pecho (mientras el brazo-grillete siga entero)
      if (!br.grillete && !dying) { x.save(); x.globalAlpha = clamp(1 - P.open * 1.3, 0.15, 1); chainLine(-90, -52, 80, 34, 22 + P.chainLoose * 16, 7); x.restore(); }
      // craneo
      var neckY = -62 + P.sy; x.save(); x.translate(0, neckY); x.rotate(P.sr);
      var skf = P.hf === 2 ? 2 : ((P.jaw > 0.5 || P.hf === 1) ? 1 : 0); x.drawImage(A.sprite('boss_karceron_skull', skf), -40, -72);
      if (P.eyes < 3 && skf !== 2) { x.save(); x.translate(0, -40); x.drawImage(A.sprite('boss_karceron_eyes', Math.min(2, P.eyes)), -28, -8); x.restore(); }
      x.restore();
      x.restore(); // fin del grupo con tilt
      x.restore(); // fin del clip
      // ---- brazos
      var armA = (1 - clamp((P.sunk - 0.25) / 0.4, 0, 1)) * clamp((P.emerge - 0.45) / 0.35, 0, 1);
      if (armA > 0.02) {
        x.save(); x.globalAlpha = armA;
        function sideArm(side) {
          var sh = side > 0 ? Lt.sR : Lt.sL, hd = side > 0 ? Lt.rh : Lt.lh, brk = side > 0 ? br.maza : br.grillete, hp = side > 0 ? P.R : P.L;
          if (brk) { x.save(); x.translate(sh.x + side * 22, sh.y + 16); x.rotate(Math.PI - side * 0.35); x.scale(1.6, 1.6); x.drawImage(A.sprite('boss_karceron_stump', 0), -26, -44); x.restore(); if (side < 0) chainLine(sh.x - 6, sh.y + 20, sh.x - 14, sh.y + 78, 8, 4); ext(R, sh.x, sh.y + 40, 50); return; }
          var el = side > 0 ? Lt.eR : Lt.eL;
          if (side > 0 && P.R.abs && P.T) { /* maza clavada: la mano la marca el ancla */ }
          var dx = hd.x - el.x, dy = hd.y - el.y, fa = Math.atan2(dy, dx), fl = Math.sqrt(dx * dx + dy * dy) || 1;
          // maza detras de la mano
          if (side > 0) {
            var gx = hd.x + Math.cos(fa) * 22, gy = hd.y + Math.sin(fa) * 22;
            x.save(); x.translate(gx, gy); x.rotate(P.R.th + Math.PI / 2); x.drawImage(A.sprite('boss_karceron_mace', P.planted ? 1 : 0), -40, -100); x.restore();
            ext(R, Lt.mh.x, Lt.mh.y, 52);
          } else if (!dying) {
            var ca2 = P.L.ca; chainLine(hd.x, hd.y + 10, hd.x + Math.cos(ca2) * 74, hd.y + 10 + Math.sin(ca2) * 74, 16 - P.chainLoose * 10, 4);
            var lx = hd.x + Math.cos(ca2) * 74, ly = hd.y + 10 + Math.sin(ca2) * 74; v_shackle(lx, ly);
          }
          boneSeg(sh.x, sh.y, el.x, el.y, 46); boneSeg(el.x, el.y, hd.x, hd.y, 40);
          joint(el.x, el.y, 1.55); joint(sh.x, sh.y, 1.7);
          x.save(); x.translate(hd.x, hd.y); x.rotate(fa - Math.PI / 2); var hs = A.sprite(side > 0 ? 'boss_karceron_hand_r' : 'boss_karceron_hand_l', hp.open ? 1 : 0); x.drawImage(hs, -hs.width / 2, -6); x.restore();
          ext(R, hd.x, hd.y, 46); ext(R, el.x, el.y, 34);
        }
        sideArm(-1); sideArm(1);
        x.restore();
      }
      // hombreras (encima de las articulaciones)
      if (armA > 0.02 || true) {
        x.save(); x.translate(0, by); x.beginPath(); x.rect(-450, -400, 900, 400 + KGY + 6 - by); x.clip(); x.translate(0, 0);
        var psR = A.sprite('boss_karceron_shoulder', 0), psL = A.sprite('boss_karceron_shoulder', br.grillete ? 0 : 1);
        x.save(); x.translate(KSH.x, KSH.y); x.rotate(P.tilt); x.drawImage(psR, -36, -40); x.restore();
        x.save(); x.translate(-KSH.x, KSH.y); x.rotate(P.tilt); x.scale(-1, 1); x.drawImage(psL, -36, -40); x.restore();
        x.restore();
      }
      // labio de lava donde el cuerpo entra en el charco
      if (by < 150) {
        x.beginPath(); x.moveTo(-108, KGY + 6);
        for (i = 0; i <= 18; i++) x.lineTo(-108 + i * 12, KGY + 5 + Math.sin(i * 0.9 + t / 220) * 2.4);
        x.lineTo(108, KGY + 14); x.lineTo(-108, KGY + 14); x.closePath(); x.fillStyle = 'rgba(255,106,26,0.92)'; x.fill();
        x.strokeStyle = K.lava; x.lineWidth = 2; x.beginPath(); x.moveTo(-108, KGY + 6); for (i = 0; i <= 18; i++) x.lineTo(-108 + i * 12, KGY + 5 + Math.sin(i * 0.9 + t / 220) * 2.4); x.stroke();
      }
      // ---- brillos aditivos
      x.globalCompositeOperation = 'lighter';
      var sn = Math.sin(P.sr), cn = Math.cos(P.sr), ex = sn * 40, ey = -62 + P.sy + by - cn * 40;
      if (P.eyes < 3 && P.hf !== 2 && !(dying && dt > 1100)) glowAt(x, ex, ey, 18 + P.eyes * 2 + P.flare * 6, ['255,154,42', '255,60,40', '255,230,200'][Math.min(2, P.eyes)], P.eyes === 2 ? 0.3 : 0.55);
      if (P.jaw > 0.3) glowAt(x, Lt.mouth.x, Lt.mouth.y + 4, 22 + P.jaw * 14, '255,150,40', 0.35 + 0.35 * P.flare);
      glowAt(x, 0, -10 + by, 34 + P.open * 26 + P.flare * 26, br.nucleo ? '255,100,40' : '255,150,50', clamp(0.1 + P.open * 0.28 + P.glow * 0.1 + P.flare * 0.25, 0, 0.7));
      x.globalCompositeOperation = 'source-over';
    }
    var bx = endR(R);
    // dibujo de brasas de disolucion y tintes
    tintR(R, x, s, dying, dt, hurtOf(s, dying, dt));
    if (dying && dt > 2000) {
      var u = clamp((dt - 2000) / 1500, 0, 1), n = Math.floor(u * 520); x.globalCompositeOperation = 'destination-out'; x.fillStyle = '#000';
      for (i = 0; i < n; i++) x.fillRect(R.OX - 150 + pr(i * 3 + 1) * 300, R.OY - 180 + pr(i * 3 + 2) * 300, 14, 14);
      if (u > 0.6) { x.fillStyle = 'rgba(0,0,0,' + clamp((u - 0.6) / 0.4, 0, 1).toFixed(2) + ')'; x.fillRect(bx.x, bx.y, bx.w, bx.h); }
      x.globalCompositeOperation = 'source-over';
    }
    x.setTransform(1, 0, 0, 1, 0, 0);
    return { canvas: R.cv, ox: R.OX, oy: R.OY, pose: P, layout: Lt, box: bx };
  }
  // grillete suelto al final de la cadena
  function v_shackle(px, py) {
    x.save(); x.translate(px, py); x.beginPath(); x.arc(0, 0, 9, 0, TAU); x.strokeStyle = OLC; x.lineWidth = 6.4; x.stroke(); x.strokeStyle = K.iron; x.lineWidth = 3.6; x.stroke();
    x.strokeStyle = K.ironH; x.lineWidth = 1; x.beginPath(); x.arc(0, 0, 9, 3.6, 5); x.stroke(); x.fillStyle = K.ironS; x.fillRect(-4, -12, 8, 5); x.restore();
  }

  // ===================================================================== KARCERON: sombra, aura y efectos de suelo/frente
  function kShadow(ctx, px, py, s) {
    var al = 0.4; if (s.dying && s.dt > 2200) al *= 1 - clamp((s.dt - 2200) / 1400, 0, 1);
    ctx.save(); ctx.translate(px, py + KGY + 10);
    ctx.fillStyle = 'rgba(8,4,14,' + (al * 0.55).toFixed(3) + ')'; ctx.beginPath(); ctx.ellipse(0, 0, 150, 46, 0, 0, TAU); ctx.fill();
    ctx.fillStyle = 'rgba(8,4,14,' + (al * 0.8).toFixed(3) + ')'; ctx.beginPath(); ctx.ellipse(0, 0, 122, 36, 0, 0, TAU); ctx.fill();
    ctx.restore();
  }
  function kAura(ctx, px, py, s, P) {
    var t = s.t || 0, gx = px, gy = py + KGY;
    var a = 0.2 + 0.12 * P.glow + 0.05 * Math.sin(t / 300) + (s.enraged ? 0.08 : 0) + (s.dying ? -0.1 * clamp(s.dt / 3000, 0, 1) : 0);
    ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = clamp(a * 1.6, 0, 1); ctx.drawImage(glowSpr('255,100,26'), gx - 250, gy - 112, 500, 224); ctx.restore();
  }
  function kFront(ctx, px, py, s, P, R) {
    var t = s.t || 0, gx = px, gy = py + KGY, i, Lt = R.layout;
    // grietas de lava alrededor del charco (entrada / marea)
    if (P.cracks > 0.02) {
      var cf = Math.min(1, Math.floor(P.cracks * 1.99)), cs = A.sprite('fx_boss_crack_lava', cf);
      [[-150, 14, 1.9], [150, 18, 1.9], [-70, 56, 1.6], [78, 60, 1.6], [0, 80, 2.1]].forEach(function (c, k) { var sc = c[2] * (0.6 + 0.4 * P.cracks); ctx.globalAlpha = clamp(P.cracks * 1.2, 0, 0.85); ctx.drawImage(cs, gx + c[0] - cs.width * sc / 2, gy + c[1] - cs.height * sc / 2 * 0.7, cs.width * sc, cs.height * sc * 0.7); });
      ctx.globalAlpha = 1;
    }
    // aliento de magma
    if (P.breath > 0.02) {
      var a = s.aim || 0, mx = gx + Lt.mouth.x, my = gy - KGY + Lt.mouth.y + 6, Ln = 560 * ease(P.breath), n;
      ctx.save(); ctx.globalCompositeOperation = 'lighter';
      [[0.3, 'rgba(255,60,20,0.30)'], [0.2, 'rgba(255,140,30,0.38)'], [0.1, 'rgba(255,230,120,0.5)']].forEach(function (c, k) {
        ctx.fillStyle = c[1]; ctx.beginPath(); ctx.moveTo(mx, my);
        for (n = 0; n <= 10; n++) { var u = n / 10, r = Ln * u, w = c[0] * (0.25 + u) * (1 + 0.12 * Math.sin(t / 60 + n * 1.7 + k)); ctx.lineTo(mx + Math.cos(a - w) * r, my + Math.sin(a - w) * r); }
        for (n = 10; n >= 0; n--) { var u2 = n / 10, r2 = Ln * u2, w2 = c[0] * (0.25 + u2) * (1 + 0.12 * Math.sin(t / 60 + n * 1.3 + k)); ctx.lineTo(mx + Math.cos(a + w2) * r2, my + Math.sin(a + w2) * r2); }
        ctx.closePath(); ctx.fill();
      });
      for (n = 0; n < 26; n++) { var ph = ((t / 520) + n / 26) % 1, rr = ph * Ln, aa = a + (pr(n + 4) - 0.5) * 0.5 * (0.2 + ph), sz = 5 * (1 - ph) + 2; ctx.fillStyle = n % 2 ? 'rgba(255,210,80,0.9)' : 'rgba(255,120,40,0.9)'; ctx.fillRect(mx + Math.cos(aa) * rr - sz / 2, my + Math.sin(aa) * rr - sz / 2, sz, sz); }
      ctx.restore();
    }
    // pulso de la erupcion
    if (P.pulse > 0.01) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.strokeStyle = 'rgba(255,150,50,' + (0.6 * (1 - P.pulse)).toFixed(3) + ')'; ctx.lineWidth = 10 * (1 - P.pulse) + 2; ctx.beginPath(); ctx.arc(gx + Lt.chest.x, gy - KGY + Lt.chest.y, 250 * ease(P.pulse), 0, TAU); ctx.stroke(); ctx.restore(); }
    // maza clavada: salpicadura y brillo en el punto de impacto
    if (P.T && (P.planted || P.splash > 0)) {
      var tx = gx + P.T.x, ty = gy - KGY + P.T.y;
      if (P.splash > 0 && P.splash < 1) { var sf = A.sprite('fx_lava_splash', Math.min(4, Math.floor(P.splash * 5))); ctx.drawImage(sf, tx - sf.width * 0.9, ty - sf.height * 1.1, sf.width * 1.8, sf.height * 1.8); }
      if (P.planted) { var cr = A.sprite('fx_boss_crack_lava', 2); ctx.globalAlpha = 0.9; ctx.drawImage(cr, tx - cr.width * 0.8, ty - cr.height * 0.5, cr.width * 1.6, cr.height * 1.0); ctx.globalAlpha = 1; }
    }
    // brasas que suben del charco / torso
    var emb = Math.max(P.embers, s.enraged ? 0.5 : 0, P.hungry ? 0.8 : 0, s.desperate ? 1 : 0, 0.18);
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    var cnt = Math.round(5 + emb * 10);
    for (i = 0; i < cnt; i++) {
      var ph2 = ((t / 1700) + i / cnt) % 1, ex = gx + (pr(i + 5) - 0.5) * 200 + Math.sin(ph2 * 7 + i) * 8, ey = gy - 4 - ph2 * (120 + emb * 110) - pr(i) * 20;
      ctx.fillStyle = (i % 2 ? 'rgba(255,210,70,' : 'rgba(255,120,40,') + (1 - ph2).toFixed(2) + ')'; var sz = 3.4 * (1 - ph2) + 1; ctx.fillRect(ex - sz / 2, ey - sz / 2, sz, sz);
    }
    ctx.restore();
    // aro dorado de ventana (suelo + nucleo)
    if (s.exposed && !s.dying) {
      var wr = A.animFrame('fx_window_ring', 'loop', t), pu = 1 + 0.05 * Math.sin(t / 150), Wd = 310 * pu;
      ctx.save(); ctx.globalAlpha = 0.85; ctx.translate(gx, gy - 6); ctx.scale(1, 0.4); ctx.drawImage(wr, -Wd * 0.6, -Wd * 0.6, Wd * 1.2, Wd * 1.2); ctx.restore();
      if (P.open > 0.5) { var w2 = 78 * pu; ctx.save(); ctx.globalAlpha = 0.9; ctx.drawImage(wr, gx + Lt.core.x - w2 / 2, gy - KGY + Lt.core.y - w2 / 2, w2, w2); ctx.restore(); }
    }
    if (s.immune && !s.dying) { ctx.save(); ctx.strokeStyle = 'rgba(200,235,255,' + (0.5 + 0.3 * Math.sin(t / 100)).toFixed(2) + ')'; ctx.lineWidth = 3; ctx.setLineDash([12, 8]); ctx.lineDashOffset = -t / 30; ctx.beginPath(); ctx.ellipse(gx, gy - 90, 150, 140, 0, 0, TAU); ctx.stroke(); ctx.restore(); }
    if (s.stun && !s.dying) {
      for (i = 0; i < 3; i++) {
        var aa2 = t / 380 + i * TAU / 3, sx3 = gx + Lt.skull.x + Math.cos(aa2) * 42, sy3 = gy - KGY + Lt.skull.y - 30 + Math.sin(aa2) * 10;
        ctx.save(); ctx.translate(sx3, sy3); ctx.rotate(t / 300 + i); ctx.fillStyle = '#ffe45a'; ctx.strokeStyle = OLC; ctx.lineWidth = 1.6; ctx.beginPath();
        for (var k = 0; k < 8; k++) { var rk = k % 2 ? 2.7 : 6; ctx.lineTo(Math.cos(k * TAU / 8) * rk, Math.sin(k * TAU / 8) * rk); } ctx.closePath(); ctx.stroke(); ctx.fill(); ctx.restore();
      }
    }
    // nubes de ceniza al emerger
    if (P.emerge < 1) { for (i = 0; i < 7; i++) { var pp = ((t / 700) + i / 7) % 1; ctx.fillStyle = 'rgba(60,44,70,' + (0.5 * (1 - pp) * (1 - P.emerge)).toFixed(2) + ')'; ctx.beginPath(); ctx.arc(gx + (pr(i + 2) - 0.5) * 220, gy - 10 - pp * 70, 8 + pp * 14, 0, TAU); ctx.fill(); } }
  }

  // ===================================================================== LETEA: sprites
  var LC = {
    body: '#2f6f6a', bodyS: '#1f4a4a', bodyH: '#5ba89a', belly: '#e8e4d4', bellyS: '#b8b49c', fin: '#256058', finS: '#173a3a', finH: '#4a9a8a',
    el: [{ m: '#7be34a', s: '#3f8a28', h: '#d0ff9a', n: '#3f9a4a', ns: '#27682c', nh: '#7ad06a', glow: '123,227,74' },
         { m: '#6ac8ff', s: '#2a78a8', h: '#d8f4ff', n: '#3f8fb8', ns: '#245f80', nh: '#80c4e4', glow: '106,200,255' },
         { m: '#ffe45a', s: '#b49a1c', h: '#fff8c0', n: '#b4a438', ns: '#7a6c1c', nh: '#e4d470', glow: '255,228,90' }]
  };
  var LNAMES = ['coletazo', 'sumersion', 'marea', 'plaideras', 'coro', 'mordisco', 'escupitajo', 'aliento', 'rayo'];
  // ---- cabeza 32x32 base (64x64): centro de la cabeza (14,16); union con el cuello en (-4,16). Mira a +x.
  // f: 0 neutro, 1 preparacion, 2 ataque, 3 dano, 4 herida abierta, 5 brote, 6 cauterizada
  function letHead(v, kind, f) {
    var x = v.ctx, E = LC.el[kind], i, jaw = f === 2 ? 6.4 : f === 1 ? 3 : f === 3 ? 1.6 : 0;
    if (f === 4 || f === 6) { // muñon del cuello cortado
      var ch = f === 6;
      v.part(Pblob(2, 16, 9, 8.6, 701 + kind, 0.03, 9), E.n, { lw: LW, sh: E.ns, hi: E.nh, so: 1 });
      v.part(Pblob(11, 16, 4.6, 8.2, 705 + kind, 0.03, 8), ch ? '#2a1e24' : '#d0506a', { lw: 1.8, sh: ch ? '#140e12' : '#8a2a40', hi: ch ? '#4a3a42' : '#f08aa0', so: 0.8 });
      if (ch) { lavaCrack(v, [[10, 11], [12, 15], [10, 20]], 0.7); v.dot(11, 16, 1, K.lava); v.dot(13, 12, 0.7, K.mag); }
      else {
        v.part(Pblob(11.4, 16, 2, 3.4, 709, 0.05, 6), '#f4ecd8', { lw: 0.8, sh: '#c8b898', so: 0.3 });
        v.part(Ppoly([[12, 20], [16, 21], [15, 27], [13.4, 30], [12.4, 26]]), E.m, { lw: 1, sh: E.s, so: 0.4 }); v.dot(14, 30.6, 1.6, E.m); v.dot(18, 24, 1.1, E.h);
        v.part(Ppoly([[12.4, 11], [16, 8], [15.6, 4.6], [13.4, 7]]), E.m, { lw: 0.9, sh: E.s, so: 0.3 });
      }
      return;
    }
    if (f === 5) { // brote: cabecita cerrada
      v.part(Pblob(2, 16, 8, 7.4, 711 + kind, 0.03, 9), E.n, { lw: LW, sh: E.ns, hi: E.nh, so: 1 });
      v.part(Pblob(10, 16, 7, 6.4, 715 + kind, 0.04, 9), E.m, { lw: LW, sh: E.s, hi: E.h, so: 1 });
      v.line(8, 14, 12, 14.4, 1, OLC); v.line(8, 17.6, 12, 18, 1, OLC); v.dot(9, 12.4, 1.1, E.h);
      return;
    }
    // aleta/cresta trasera
    if (kind === 0) { for (i = 0; i < 3; i++) { v.part(Ppoly([[8 - i * 3.6, 7 + i * 0.8], [5 - i * 5.4, -1 + i * 2.4], [10 - i * 3.6, 4.6 + i * 0.4]]), E.m, { lw: 1.4, sh: E.s, hi: E.h, so: 0.5 }); v.dot(3 - i * 5.4, 1 + i * 2.4, 1.1, E.h); } }
    else if (kind === 1) { for (i = 0; i < 4; i++) v.part(Ppoly([[9 - i * 3, 6 + i * 0.6], [4 - i * 4.4, -2 + i * 2.2 - (i % 2) * 2], [11 - i * 3, 5 + i * 0.6]]), E.h, { lw: 1.4, sh: E.m, hi: '#ffffff', so: 0.4 }); }
    else { for (i = 0; i < 3; i++) v.part(Ppoly([[9 - i * 3.4, 6.6 + i], [6 - i * 5.4, 3 + i * 2], [8 - i * 3.6, 1.6 + i * 2], [3 - i * 5.4, -2 + i * 2.2], [11 - i * 3.4, 4.6 + i]]), E.m, { lw: 1.3, sh: E.s, hi: E.h, so: 0.4 }); }
    // mandibula inferior
    v.part(Pblob(19.6, 22 + jaw * 0.55, 9.2, 3.5, 721 + kind, 0.03, 8, jaw * 0.045), E.s, { lw: 1.7, sh: '#1b1124', so: 0.5 });
    if (jaw > 2) { v.part(Pblob(21, 20.4 + jaw * 0.2, 7.6, 2.4 + jaw * 0.3, 725, 0.03, 8), '#3a0e18', { lw: 0 }); v.dot(21, 20.8 + jaw * 0.25, 1.6 + jaw * 0.3, kind === 1 ? '#d8f4ff' : E.m); if (f === 2) { v.dot(24, 21, 1, '#ffffff'); } }
    // craneo + hocico
    v.part(Pblob(13, 15, 10.4, 8.8, 731 + kind, 0.03, 10), E.m, { lw: LW, sh: E.s, hi: E.h, so: 1.2 });
    v.part(Pblob(21.6, 17.4 - jaw * 0.2, 9, 5.2, 735 + kind, 0.03, 9, -jaw * 0.02), E.m, { lw: LW, sh: E.s, hi: E.h, so: 1 });
    v.part(Pblob(14, 20, 10, 3.4, 739 + kind, 0.04, 8), LC.belly, { lw: 0, sh: LC.bellyS, so: 0.5 });
    for (i = 0; i < 3; i++) v.part(Ppoly([[17 + i * 3.8, 19.6 + jaw * 0.2], [18.6 + i * 3.8, 22.4 + jaw * 0.35], [20.2 + i * 3.8, 19.6 + jaw * 0.2]]), '#fff6e0', { lw: 0.5, sh: null });
    v.dot(28.6, 15.6, 0.9, '#1b1124');
    // ojo
    if (f === 3) { v.line(13, 10.6, 19, 12.4, 1.3, OLC); v.line(14, 13.8, 18.6, 12.8, 0.9, OLC); }
    else {
      v.part(Pblob(16.4, 11.6, 3.5, 3.1, 741 + kind, 0.04, 8), kind === 2 ? '#fffbe0' : '#fff6c8', { lw: 1.2, sh: '#d8c878', so: 0.4 });
      v.part(Pblob(17.2, 11.6, 0.9, 2.3, 745, 0.02, 6), '#1b1124', { lw: 0 });
      v.line(12.6, 8.4, 20, 9.8 + (f === 1 ? 1 : 0), 1.2, E.s);
    }
    if (kind === 2 && f >= 1) { x.strokeStyle = '#ffffff'; x.lineWidth = 0.7; x.beginPath(); x.moveTo(5, 6); x.lineTo(8, 9); x.lineTo(6, 11); x.lineTo(10, 14); x.stroke(); }
    if (kind === 0 && f >= 1) { v.dot(20, 25.6 + jaw * 0.4, 1.2, E.m); v.dot(20.4, 28.4 + jaw * 0.4, 0.8, E.h); }
  }
  [['acid', 0], ['ice', 1], ['bolt', 2]].forEach(function (e) {
    var fns = []; for (var f = 0; f < 7; f++) fns.push((function (ff) { return function (v) { letHead(v, e[1], ff); }; })(f));
    addV('boss_letea_head_' + e[0], 32, 32, fns, { lw: LW }, { idle: { f: [0], fps: 1 }, prep: { f: [1], fps: 1 }, attack: { f: [2], fps: 1 }, hurt: { f: [3], fps: 1 }, wound: { f: [4], fps: 1 }, bud: { f: [5], fps: 1 }, cauter: { f: [6], fps: 1 } });
  });

  // ---- cuerpo (espiral de serpiente que emerge del estanque): 112x64 base. 0 idle, 1 hundiendose (mojado), 2 emergiendo (chorreando)
  function letBody(f) {
    return function (v) {
      var x = v.ctx, i, ps = [];
      for (i = 0; i < 9; i++) { var a = Math.PI + i / 8 * Math.PI; ps.push(Pblob(56 + Math.cos(a) * 36, 40 + Math.sin(a) * 14, 18 - Math.abs(i - 4) * 0.8, 15, 750 + i, 0.03, 8)); }
      v.cluster(ps, f === 1 ? '#285c58' : LC.body, { lw: LW, sh: LC.bodyS, hi: LC.bodyH, so: 1.3 });
      v.part(Pblob(56, 40, 46, 20, 760, 0.03, 12), f === 1 ? '#285c58' : LC.body, { lw: LW, sh: LC.bodyS, hi: LC.bodyH, so: 1.6 });
      // vientre crema (anillos)
      v.part(Pblob(56, 52, 34, 7, 761, 0.03, 10), LC.belly, { lw: 1.5, sh: LC.bellyS, so: 0.8 });
      x.strokeStyle = LC.bellyS; x.lineWidth = 0.7; for (i = 0; i < 7; i++) { x.beginPath(); x.moveTo(30 + i * 8, 47); x.lineTo(31 + i * 8, 57); x.stroke(); }
      // escamas
      x.strokeStyle = LC.bodyS; x.lineWidth = 0.9; x.lineCap = 'round';
      for (i = 0; i < 26; i++) { var sx = 14 + (i % 9) * 10.4 + (Math.floor(i / 9) % 2) * 5, sy = 24 + Math.floor(i / 9) * 7.6; if (sy > 46) continue; x.beginPath(); x.arc(sx, sy, 3, 0.2, Math.PI - 0.2); x.stroke(); }
      x.strokeStyle = LC.bodyH; x.lineWidth = 0.6; for (i = 0; i < 10; i++) { x.beginPath(); x.arc(16 + i * 8.6, 22 + (i % 3) * 4, 2.4, 3.4, 5.6); x.stroke(); }
      // 3 collares donde nacen los cuellos
      [[30, 14, 0], [56, 9, 1], [82, 14, 2]].forEach(function (c) { v.part(Pblob(c[0], c[1], 9, 5.6, 770 + c[2], 0.04, 9), LC.el[c[2]].n, { lw: LW, sh: LC.el[c[2]].ns, hi: LC.el[c[2]].nh, so: 0.9 }); });
      // aletas dorsales
      for (i = 0; i < 6; i++) { var fx = 14 + i * 16.4; v.part(Ppoly([[fx - 3, 27 + Math.abs(i - 2.5) * 1.6], [fx + 1, 17 - (i % 2) * 3 + Math.abs(i - 2.5) * 1.4], [fx + 5, 26 + Math.abs(i - 2.5) * 1.6]]), LC.fin, { lw: 1.4, sh: LC.finS, hi: LC.finH, so: 0.6 }); }
      if (f) { // gotas y chorretones
        x.fillStyle = 'rgba(190,240,236,0.8)'; for (i = 0; i < (f === 2 ? 9 : 5); i++) { var dx = 18 + pr(i + f * 7) * 78, dy = 22 + pr(i + 3) * 24; x.beginPath(); x.ellipse(dx, dy + (f === 2 ? 4 : 0), 0.9, f === 2 ? 3.4 : 1.4, 0, 0, TAU); x.fill(); }
        x.strokeStyle = 'rgba(220,250,246,0.7)'; x.lineWidth = 0.8; x.beginPath(); x.moveTo(8, 56); for (i = 1; i <= 14; i++) x.lineTo(8 + i * 7, 56 + Math.sin(i * 1.3 + f) * 1.4); x.stroke();
      }
      v.part(Ppoly([[104, 36], [112, 42], [104, 46]]), LC.body, { lw: 1.4, so: 0 });
    };
  }
  addV('boss_letea_body', 112, 64, [letBody(0), letBody(1), letBody(2)], { lw: LW }, { idle: { f: [0], fps: 1 }, sink: { f: [1], fps: 1 }, emerge: { f: [2], fps: 1 } });

  // ---- aleta de la punta de la cola: 48x32 base (union en 4,16; apunta a +x). 0 reposo, 1 coletazo
  function tailFin(f) {
    return function (v) {
      var spread = f ? 12 : 8.6;
      v.part(Ppoly([[3, 12.4], [14, 16 - spread], [30, 16 - spread * 1.2 + 3], [44, 16 - 2], [32, 16], [44, 16 + 2], [30, 16 + spread * 1.2 - 3], [14, 16 + spread], [3, 19.6]]), LC.fin, { lw: LW, sh: LC.finS, hi: LC.finH, so: 1 });
      v.ctx.strokeStyle = LC.finH; v.ctx.lineWidth = 0.8; [[8, 16, 36, 16 - spread * 0.5], [8, 16, 36, 16 + spread * 0.5], [8, 16, 30, 16]].forEach(function (l) { v.ctx.beginPath(); v.ctx.moveTo(l[0], l[1]); v.ctx.lineTo(l[2], l[3]); v.ctx.stroke(); });
      v.part(Pblob(5, 16, 5.4, 4.4, 780, 0.04, 8), LC.body, { lw: 1.5, sh: LC.bodyS, so: 0.6 });
      if (f) { v.ctx.strokeStyle = 'rgba(220,250,246,0.8)'; v.ctx.lineWidth = 0.9; v.ctx.beginPath(); v.ctx.moveTo(1, 5); v.ctx.lineTo(14, 8); v.ctx.moveTo(1, 27); v.ctx.lineTo(14, 24); v.ctx.stroke(); }
    };
  }
  addV('boss_letea_tail', 48, 32, [tailFin(0), tailFin(1)], { lw: LW }, { rest: { f: [0], fps: 1 }, whip: { f: [1], fps: 1 } });

  // ---- estanque de Letea: 180x64 base = 360x128; centro (90,32). 3 frames de ondas
  function pond(f) {
    return function (v) {
      var x = v.ctx, i;
      v.part(Pblob(90, 33, 88, 29, 790, 0.02, 16), '#3a4a40', { lw: LW, sh: '#26322c', hi: '#5a6a56', so: 1.6 });
      v.part(Pblob(90, 32, 82, 25, 791, 0.02, 16), '#1f5a66', { lw: 1.2, ol: '#103a40', sh: '#16424c', hi: '#3a9aa6', so: 1.2 });
      x.fillStyle = 'rgba(160,240,230,0.35)'; for (i = 0; i < 6; i++) { var a = pr(i + 4) * TAU, d = 16 + pr(i + 8) * 42; x.beginPath(); x.ellipse(90 + Math.cos(a) * d, 32 + Math.sin(a) * d * 0.32, 8 + pr(i) * 7, 1.6, 0, 0, TAU); x.fill(); }
      x.strokeStyle = 'rgba(210,252,246,0.7)'; x.lineWidth = 1; for (i = 0; i < 3; i++) { var rr = ((f / 3) + i / 3) % 1; x.beginPath(); x.ellipse(90, 32, 20 + rr * 60, 6 + rr * 18, 0, 0, TAU); x.globalAlpha = 1 - rr; x.stroke(); x.globalAlpha = 1; }
      for (i = 0; i < 5; i++) { var ph = (f / 3 + i / 5) % 1; v.dot(30 + i * 28 + pr(i) * 8, 36 - ph * 5, 1.8 * (1 - ph) + 0.4, 'rgba(220,255,250,0.8)'); }
    };
  }
  addV('fx_letea_pond', 180, 64, [pond(0), pond(1), pond(2)], { lw: LW }, { ripple: { f: [0, 1, 2], fps: 3 } });

  // ---- charco de agua (arena, disco r90 final centrado en 200x200): 100x100 base
  function waterDisc(acid, f) {
    return function (v) {
      var x = v.ctx, i, c = acid ? ['#4a8a30', '#27501c', '#9ae860', 'rgba(210,255,140,0.7)'] : ['#1f5a66', '#16424c', '#3a9aa6', 'rgba(210,252,246,0.7)'];
      var R0 = acid ? 25 : 45;
      v.part(Pblob(50, 50, R0 + 3, R0 + 2.6, acid ? 801 : 800, 0.02, 18), acid ? '#2a3a22' : '#3a4a40', { lw: LW, sh: '#1a2218', so: 1.2 });
      v.part(Pblob(50, 50, R0 - 0.6, R0 - 1, acid ? 803 : 802, 0.025, 18), c[0], { lw: 1.2, ol: acid ? '#1c4a20' : '#103a40', sh: c[1], hi: c[2], so: 1.1 });
      x.strokeStyle = c[3]; x.lineWidth = 1; for (i = 0; i < 3; i++) { var rr = ((f / 3) + i / 3) % 1; x.globalAlpha = 1 - rr; x.beginPath(); x.arc(50, 50, R0 * 0.25 + rr * R0 * 0.7, 0, TAU); x.stroke(); }
      x.globalAlpha = 1;
      if (acid) for (i = 0; i < 6; i++) { var ph = (f / 3 + i / 6) % 1, a = pr(i + 20) * TAU, d = pr(i + 30) * R0 * 0.7; v.dot(50 + Math.cos(a) * d, 50 + Math.sin(a) * d, 2.4 * (1 - ph) + 0.5, ph < 0.8 ? '#d0ff9a' : '#7be34a'); }
    };
  }
  addV('fx_water_pool', 100, 100, [waterDisc(false, 0), waterDisc(false, 1), waterDisc(false, 2)], { lw: LW }, { ripple: { f: [0, 1, 2], fps: 3 } });
  addV('fx_acid_puddle', 60, 60, [waterDisc(true, 0), waterDisc(true, 1), waterDisc(true, 2)], { lw: LW }, { bubble: { f: [0, 1, 2], fps: 4 } });

  // ---- pilar de cristal (obstaculo r26): 26x52 base = 52x104; ancla = centro de colision (26,78 finales). 0 entero, 1 agrietado, 2 escombro, 3 reflejo de rayo
  function crystalPillar(f) {
    return function (v) {
      var x = v.ctx;
      if (f === 2) {
        v.part(Pblob(13, 44, 11, 3.6, 811), '#2a3a50', { lw: 1.2, sh: '#1a2638', so: 0.4 });
        [[7, 42, 6], [15, 43, 7], [11, 38, 5], [18, 39, 4.6]].forEach(function (p, k) { v.part(Ppoly([[p[0] - p[2] * 0.5, p[1] + 1], [p[0], p[1] - p[2] * 0.9], [p[0] + p[2] * 0.5, p[1] - 1], [p[0] + p[2] * 0.4, p[1] + 2.2]]), k % 2 ? '#9adcff' : '#6ac8ff', { lw: 1.4, sh: '#2a78a8', hi: '#e8f8ff', so: 0.6 }); });
        return;
      }
      v.part(Pblob(13, 46.4, 11.4, 3.6, 812), '#18121f', { lw: 0 });
      v.part(Pblob(13, 44.6, 10, 3.6, 813, 0.03), '#3a4a60', { lw: 1.6, sh: '#202c40', hi: '#5a6a80', so: 0.8 });
      var glow = f === 3 ? '#fff6a0' : '#9adcff';
      v.part(Ppoly([[5, 44], [6.4, 18], [10, 2.5], [13, 0.5], [17, 3.4], [20, 18], [21, 44]]), glow, { lw: LW, sh: f === 3 ? '#e8c840' : '#4a9ad0', hi: '#ffffff', so: 1.4 });
      v.part(Ppoly([[8.4, 44], [9.4, 20], [12.2, 6], [14.4, 22], [14.4, 44]]), f === 3 ? '#fffbd0' : '#c8ecff', { lw: 0, sh: f === 3 ? '#ffe45a' : '#7ac0ec', so: 0.7 });
      v.part(Ppoly([[2.6, 32], [3.6, 22], [7, 28], [6, 40]]), '#6ac8ff', { lw: 1.4, sh: '#2a78a8', hi: '#d8f4ff', so: 0.4 });
      v.part(Ppoly([[19, 36], [22.6, 24], [24, 38], [21, 42]]), '#6ac8ff', { lw: 1.4, sh: '#2a78a8', hi: '#d8f4ff', so: 0.4 });
      if (f === 1) { x.strokeStyle = OLC; x.lineWidth = 1.1; x.beginPath(); x.moveTo(15, 5); x.lineTo(11, 15); x.lineTo(15, 25); x.lineTo(11, 36); x.stroke(); x.strokeStyle = '#e8f8ff'; x.lineWidth = 0.4; x.stroke(); }
      if (f === 3) { x.strokeStyle = '#fffbd0'; x.lineWidth = 1.2; x.beginPath(); x.moveTo(13, 0); x.lineTo(10, 8); x.lineTo(15, 14); x.lineTo(11, 24); x.stroke(); }
    };
  }
  addV('obs_crystal_pillar', 26, 52, [crystalPillar(0), crystalPillar(1), crystalPillar(2), crystalPillar(3)], { lw: LW }, { whole: { f: [0], fps: 1 }, cracked: { f: [1], fps: 1 }, rubble: { f: [2], fps: 1 }, struck: { f: [3], fps: 1 } });

  // ---- columna de rayo: 48x160 base = 96x320; ancla base-centro (48,156 base => 96,312 finales). 3 frames
  function bolt(f) {
    return function (v) {
      var x = v.ctx, i, pts = [[24, 0]], yy = 0;
      var jit = [[-3, 4, -5, 3, -2, 4, -4], [3, -4, 4, -3, 2, -4, 3], [-2, 5, -3, 2, -5, 3, -3]][f];
      for (i = 0; i < 7; i++) { yy += 22; pts.push([24 + jit[i] * (1 + i * 0.1), Math.min(yy, 150)]); }
      pts.push([24, 154]);
      x.lineJoin = 'round'; x.lineCap = 'round';
      var w = [[9, 'rgba(255,228,90,0.35)'], [5.4, '#ffe45a'], [2.6, '#ffffff']];
      w.forEach(function (c, k) { x.strokeStyle = k === 1 ? OLC : c[1]; x.lineWidth = k === 1 ? c[0] + 2.4 : c[0]; if (k === 1) { x.beginPath(); pts.forEach(function (p, j) { j ? x.lineTo(p[0], p[1]) : x.moveTo(p[0], p[1]); }); x.stroke(); x.strokeStyle = c[1]; x.lineWidth = c[0]; } x.beginPath(); pts.forEach(function (p, j) { j ? x.lineTo(p[0], p[1]) : x.moveTo(p[0], p[1]); }); x.stroke(); });
      x.strokeStyle = '#ffe45a'; x.lineWidth = 1.6; x.beginPath(); x.moveTo(pts[3][0], pts[3][1]); x.lineTo(pts[3][0] + 9 * (f % 2 ? -1 : 1), pts[3][1] + 12); x.lineTo(pts[3][0] + 6 * (f % 2 ? -1 : 1), pts[3][1] + 22); x.stroke();
      v.part(Pblob(24, 154, 14 + f * 2, 4, 820 + f, 0.1, 8), 'rgba(255,248,180,0.9)', { lw: 0 });
      for (i = 0; i < 5; i++) v.dot(24 + (pr(i + f) - 0.5) * 28, 150 - pr(i + 5) * 8, 1.1, '#fff8c0');
    };
  }
  addV('fx_lightning_strike', 48, 160, [bolt(0), bolt(1), bolt(2)], { lw: 1.4 }, { strike: { f: [0, 1, 2, 1], fps: 14 } });

  // ---- globo de acido: 14x14 base = 28x28, 2 frames
  function acidGlob(f) { return function (v) { v.part(Pblob(7, 7, 4.6 + f * 0.4, 4.4 - f * 0.3, 830 + f, 0.1, 8), '#7be34a', { lw: 1.4, ol: '#1c4a20', sh: '#3f8a28', hi: '#d0ff9a', so: 0.7 }); v.dot(5.4, 5.4, 1, '#ffffff'); v.dot(10.6, 9.6, 0.7, '#d0ff9a'); }; }
  addV('proj_acid_glob', 14, 14, [acidGlob(0), acidGlob(1)], { lw: 1.4 }, { loop: { f: [0, 1], fps: 8 } });

  // ---- salpicadura de agua: 48x48 base = 96, 5 frames (emerge / erupcion)
  function wsplash(f) {
    return function (v) {
      var x = v.ctx, i, rr = [4, 12, 18, 21, 22][f], al = [1, 1, 0.95, 0.7, 0.3][f];
      x.globalAlpha = al; x.strokeStyle = '#e8fffa'; x.lineWidth = 3 - f * 0.5; if (f <= 3) { x.beginPath(); x.arc(24, 28, rr * 0.8, 0, TAU); x.stroke(); }
      for (i = 0; i < 9; i++) {
        var a = -Math.PI + i / 8 * Math.PI + (pr(i) - 0.5) * 0.4, d = rr * (0.6 + pr(i + 9) * 0.6), px = 24 + Math.cos(a) * d, py = 28 + Math.sin(a) * d * 1.2 + f * 1.6, s = (3.4 - f * 0.5) * (0.7 + pr(i + 20) * 0.6);
        if (f === 4) { v.dot(px, py, 1, 'rgba(210,252,246,0.6)'); continue; }
        v.part(Pblob(px, py, s * 0.8, s * 1.3, 840 + i, 0.1, 6), i % 3 ? '#a8ece4' : '#e8fffa', { lw: 1.1, ol: '#1f6a76', sh: '#5ab8b8', so: 0.4 });
      }
      x.globalAlpha = 1;
    };
  }
  addV('fx_water_splash', 48, 48, [wsplash(0), wsplash(1), wsplash(2), wsplash(3), wsplash(4)], { lw: 1.2 }, { burst: { f: [0, 1, 2, 3, 4], fps: 14, loop: false } });

  // ---- retratos (48x48 = 96)
  [['karceron', 'k'], ['letea', 'l']].forEach(function (e) {
    addV('boss_' + e[0] + '_portrait', 48, 48, [portraitFrame(e[1], 0), portraitFrame(e[1], 1), portraitFrame(e[1], 2)], { lw: LW }, { neutral: { f: [0], fps: 1 }, rage: { f: [1], fps: 1 }, hurt: { f: [2], fps: 1 } });
  });

  // ===================================================================== LETEA: pose
  var LGY = 56, LDEATH = 3600, WL = LGY + 4;                  // WL = linea de agua (el cuerpo se recorta por encima)
  var LBASE = [[-52, -24], [0, -34], [52, -24]], LHOME = [[-140, -116], [0, -172], [140, -116]], LIDLE = [Math.PI - 0.25, 0.45, -0.15];
  var LKEYS = ['acid', 'ice', 'bolt'], LHEAD_SPR = ['boss_letea_head_acid', 'boss_letea_head_ice', 'boss_letea_head_bolt'];
  var LATK = { acid: 'escupitajo', ice: 'aliento', bolt: 'rayo' };

  function lHeadPose(k, s, t, P) {
    var hs = (s.heads && s.heads[LKEYS[k]]) || {}, B = LBASE[k], H0 = LHOME[k], i;
    var o = { k: k, x: H0[0] + Math.sin(t / 700 + k * 2.1) * 9, y: H0[1] + Math.cos(t / 900 + k * 1.3) * 7, ha: LIDLE[k] + Math.sin(t / 1100 + k) * 0.1, fr: 0, glow: 0, mist: 0, spark: 0, sing: 0, hurt: 0, broken: !!hs.broken, regrow: clamp(hs.regrow || 0, 0, 1), cauter: clamp(hs.cauter || 0, 0, 1), exposed: !!hs.exposed, atk: null, a: 0, sp: 0, hv: 1 };
    var nm = hs.strike || hs.windup, isS = !!hs.strike, bodyNm = P.bodyAtk;
    if (!nm && (bodyNm === 'plaideras' || bodyNm === 'marea' || bodyNm === 'coro')) { nm = bodyNm; isS = P.bodyIsS; }
    var wp = hs.wp != null ? hs.wp : ((t % 1100) / 1100), sp = hs.sp != null ? hs.sp : ((t % 800) / 800), u = ease(wp), q = ease(sp);
    if (hs.strike && hs.wp == null && hs.sp == null) { /* preview */ }
    if (!isS && bodyNm && nm === bodyNm) { wp = P.bodyWp; u = ease(wp); }
    if (isS && bodyNm && nm === bodyNm) { sp = P.bodySp; q = ease(sp); }
    var a = hs.aim != null ? hs.aim : Math.PI / 2, dx = Math.cos(a), dy = Math.sin(a);
    if (hs.tx != null && hs.ty != null) { o.x = hs.tx; o.y = hs.ty; o.ha = hs.aim != null ? hs.aim : Math.atan2(hs.ty - B[1], hs.tx - B[0]); }
    else if (nm === 'mordisco') {
      o.atk = 'mordisco'; o.a = a;
      if (!isS) { o.x = H0[0] - dx * 46 * u; o.y = H0[1] - dy * 46 * u - 10 * u; o.ha = angLerp(o.ha, a, u); o.fr = u > 0.5 ? 1 : 0; }
      else { var out = sp < 0.45 ? ease(sp / 0.45) : 1 - ease((sp - 0.45) / 0.55), sx = H0[0] - dx * 46, sy = H0[1] - dy * 46 - 10; o.x = lerp(sx, B[0] + dx * 320, out); o.y = lerp(sy, B[1] + dy * 320, out); o.ha = a; o.fr = out > 0.12 ? 2 : 1; }
    } else if (nm === 'escupitajo') {
      o.atk = 'escupitajo'; o.a = a;
      if (!isS) { o.x = H0[0] - dx * 30 * u; o.y = H0[1] - dy * 30 * u - 26 * u; o.ha = angLerp(o.ha, a - 0.55, u); o.fr = u > 0.3 ? 1 : 0; o.glow = u; }
      else { o.x = H0[0] + dx * 36 * (sp < 0.3 ? ease(sp / 0.3) : 1 - ease((sp - 0.3) / 0.7) * 0.8); o.y = H0[1] + dy * 36 * (sp < 0.3 ? ease(sp / 0.3) : 1 - ease((sp - 0.3) / 0.7) * 0.8); o.ha = a; o.fr = sp < 0.7 ? 2 : 0; o.glow = 1 - sp; }
    } else if (nm === 'aliento') {
      o.atk = 'aliento'; o.a = a;
      if (!isS) { o.x = H0[0] - dx * 34 * u; o.y = H0[1] - dy * 34 * u; o.ha = angLerp(o.ha, a, u); o.fr = u > 0.3 ? 1 : 0; o.glow = u; }
      else { o.x = H0[0] + dx * 20; o.y = H0[1] + dy * 20; o.ha = a; o.fr = 2; o.mist = clamp(sp * 5, 0, 1); o.glow = 1; }
    } else if (nm === 'rayo') {
      o.atk = 'rayo'; o.a = a;
      if (!isS) { o.y = H0[1] - 20 * u; o.ha = angLerp(o.ha, -Math.PI / 2 + 0.1, u); o.fr = u > 0.3 ? 1 : 0; o.spark = u; }
      else { o.x = H0[0] + dx * 30 * (1 - sp * 0.6); o.y = H0[1] + dy * 30 * (1 - sp * 0.6); o.ha = angLerp(-Math.PI / 2, a, clamp(sp * 4, 0, 1)); o.fr = 2; o.spark = 1 - sp * 0.5; }
    } else if (nm === 'coro') {
      o.atk = 'coro'; o.y = H0[1] - 24; o.ha = -Math.PI / 2 + Math.sin(t / 300 + k) * 0.08; o.fr = 2; o.sing = 1; o.glow = 0.6 + 0.4 * Math.sin(t / 200 + k * 2);
    } else if (nm === 'plaideras') {
      o.atk = 'plaideras'; o.y = H0[1] - 30 * (isS ? 1 : u); o.ha = -Math.PI / 2 + 0.3 * (k - 1) * 0.6; o.fr = (isS || u > 0.4) ? 2 : 1; o.sing = isS ? 1 : u; o.glow = isS ? 1 : u;
    } else if (nm === 'marea') {
      o.atk = 'marea'; var uu = isS ? 1 : u; o.y = H0[1] - 40 * uu; o.x = H0[0] * (1 + 0.1 * uu); o.ha = angLerp(o.ha, -Math.PI / 2 + (k - 1) * 0.4, uu); o.fr = uu > 0.4 ? 2 : 1;
    }
    if (hs.hurt > 0) { var hv = clamp(+hs.hurt, 0, 1); o.hurt = hv; o.x += Math.sin(t * 0.09 + k) * 5 * hv; o.y += Math.cos(t * 0.11) * 4 * hv; if (hv > 0.25) o.fr = 3; }
    if (hs.down) { o.x = H0[0] * 0.75; o.y = 40; o.ha = Math.PI / 2; o.fr = 3; }
    if (s.stun && !hs.broken) { o.y += 26; o.ha = Math.PI / 2 - 0.2 * (k - 1); o.fr = 3; }
    if (o.broken) { // muñon
      var ang = Math.atan2(H0[1] - B[1], H0[0] - B[0]), lenS = 0.42;
      o.x = B[0] + (H0[0] - B[0]) * lenS + (k - 1) * 8; o.y = B[1] + (H0[1] - B[1]) * lenS + 12; o.ha = ang + (k === 0 ? -0.35 : k === 2 ? 0.35 : 0.0);
      o.fr = o.cauter >= 0.98 ? 6 : 4; o.stump = true;
      if (o.regrow > 0.02) { var rg = ease(o.regrow); o.x = lerp(o.x, H0[0], rg * 0.9); o.y = lerp(o.y, H0[1], rg * 0.9); o.ha = angLerp(o.ha, LIDLE[k], rg); if (o.regrow < 0.97) { o.fr = 5; o.sc = 0.45 + 0.55 * rg; o.stump = false; } else { o.fr = 0; o.broken = false; o.stump = false; } }
    }
    return o;
  }
  function lPose(s) {
    var t = s.t || 0, W = s.windup, ST = s.strike, wp = s.wp != null ? s.wp : ((t % 1400) / 1400), sp = s.sp != null ? s.sp : ((t % 1000) / 1000), f = s.facing < 0 ? -1 : 1;
    var P = { f: f, by: Math.sin(t / 760) * 2, sub: clamp(s.submerge || 0, 0, 1), bodyAtk: null, bodyIsS: false, bodyWp: wp, bodySp: sp, shake: 0, bubbles: 0, tailAtk: 0, bodyFr: 0, ripple: 0, splash: 0 };
    if (s.desperate && !W && !ST) W = 'coro';
    var nm = ST || W;
    if (nm === 'coletazo' || nm === 'sumersion' || nm === 'marea' || nm === 'plaideras' || nm === 'coro') { P.bodyAtk = nm; P.bodyIsS = !!ST; }
    if (nm === 'sumersion' && s.submerge == null) { P.sub = ST ? 1 - ease(sp) : ease(wp); P.bubbles = 1; P.ripple = 1; if (ST && sp < 0.5) P.splash = sp * 2; P.shake = ST ? 2.4 * (1 - sp) : 0.8 * wp; }
    if (nm === 'marea') { P.by -= 10 * (ST ? 1 : ease(wp)); P.shake = ST ? 1.6 : 1.2 * wp; }
    if (nm === 'coro') { P.by -= 6; P.shake = 0.6; }
    if (s.roar > 0) { P.shake = Math.max(P.shake, 1.8 * ease(s.roar)); P.by -= 6 * ease(s.roar); }
    var em = s.emerge == null ? 1 : clamp(+s.emerge, 0, 1); P.emerge = em;
    if (em < 1) { P.by += (1 - ease(clamp(em * 1.8, 0, 1))) * 170; P.bubbles = Math.max(P.bubbles, 1 - em); P.ripple = 1; P.splash = em > 0.15 && em < 0.5 ? (em - 0.15) / 0.35 : 0; P.shake = Math.max(P.shake, 1.6 * (1 - em)); }
    // muerte
    if (s.dying) {
      var dt = s.dt != null ? s.dt : (s.deathT || 0); P.dt = dt;
      var sink = ease((dt - 1400) / 1500); P.sub = Math.max(P.sub, sink); P.bubbles = dt > 1200 ? 1 : 0; P.ripple = 1; P.shake = dt < 1400 ? 3.4 : 0.6; P.dead = clamp((dt - 2700) / 900, 0, 1);
    }
    // cabezas
    P.heads = []; P.sunkH = P.sub * 300; P.sunkB = P.sub * 200;
    for (var k = 0; k < 3; k++) {
      var h = lHeadPose(k, s, t, P);
      if (s.dying) {
        var c = ease((P.dt - 400) / 1200); h.fr = 3; h.x = lerp(h.x, LBASE[k][0] * 1.5 + (k - 1) * 40, c) + (P.dt < 400 ? Math.sin(t * 0.13 + k) * 8 : 0); h.y = lerp(h.y, 70 + k * 6, c) + (P.dt < 400 ? Math.cos(t * 0.15 + k) * 8 : 0); h.ha = lerp(h.ha, Math.PI / 2, c); h.broken = false; h.stump = false; h.hurt = P.dt < 300 ? 1 : 0; h.sing = 0; h.glow = 0;
      }
      if (em < 1) { var hk = ease(clamp((em * 1800 - 300 * k - 500) / 800, 0, 1)); h.y += (1 - hk) * 330; h.vis = hk; if (k === 2 && em > 0.8) { h.fr = 2; } }
      h.y += P.sunkH;
      P.heads.push(h);
    }
    // cola
    P.tail = lTail(s, P, t, f);
    return P;
  }
  function lTail(s, P, t, f) {
    var th0 = f > 0 ? Math.PI : 0, C = { x: 0, y: 10 }, n = 9, pts = [], k, nm = P.bodyAtk === 'coletazo' ? (P.bodyIsS ? 'S' : 'W') : null, wpp = ease(P.bodyWp), spp = P.bodySp;
    function rest(kk) { var u = kk / (n - 1), bx = f * -86, by = 28; return { x: bx - f * u * 118 + 0, y: by + 22 * u * u + Math.sin(t / 520 - kk * 0.7) * 7 * u }; }
    function polar(kk, tip, rt, lag) { var u = kk / (n - 1), r = 84 + (rt - 84) * u, ph = tip - lag * Math.pow(1 - u, 1.5); return { x: C.x + Math.cos(ph) * r, y: C.y + Math.sin(ph) * r }; }
    for (k = 0; k < n; k++) {
      var p = rest(k);
      if (nm === 'W') { var c = polar(k, th0 - 0.9 * f * wpp, lerp(150, 120, wpp), 0.6 + 0.8 * wpp); p = { x: lerp(p.x, c.x, wpp), y: lerp(p.y, c.y, wpp) }; }
      else if (nm === 'S') {
        var tip = th0 - 0.9 * f + f * spp * (TAU + 0.9), rt = spp < 0.25 ? lerp(120, 225, ease(spp / 0.25)) : (spp > 0.9 ? lerp(225, 150, (spp - 0.9) / 0.1) : 225), c2 = polar(k, tip, rt, 1.4), bo = clamp((spp - 0.9) / 0.1, 0, 1);
        p = { x: lerp(c2.x, p.x, ease(bo)), y: lerp(c2.y, p.y, ease(bo)) };
      }
      pts.push(p);
    }
    var a = Math.atan2(pts[n - 1].y - pts[n - 2].y, pts[n - 1].x - pts[n - 2].x);
    return { pts: pts, ang: a, fin: nm === 'S' ? 1 : 0, tip: pts[n - 1] };
  }
  function lDeathAlpha(P) { return P.dead ? 1 - P.dead : 1; }

  // neck: bezier de la base al cuello de la cabeza, 7 puntos (6 segmentos)
  function neckPts(k, h, P, t, sc) {
    var B = LBASE[k], by = P.by + P.sunkB, bx = B[0], byy = B[1] + by, ca = Math.cos(h.ha), sa = Math.sin(h.ha), hx = h.x, hy = h.y;
    var jx = hx - ca * 18 * (sc || 1), jy = hy - sa * 18 * (sc || 1), dx = jx - bx, dy = jy - byy, len = Math.sqrt(dx * dx + dy * dy) || 1;
    var ux = dx / len, uy = dy / len, up = 0.75, c1x = bx + (ux * 0.35 + 0 * up) * len * 0.6, c1y = byy + (uy * 0.35 - up * 0.65) * len * 0.6;
    var wob = Math.sin(t / 520 + k * 2.4) * len * 0.09 * (h.atk === 'mordisco' && h.fr === 2 ? 0.1 : 1);
    c1x += -uy * wob; c1y += ux * wob;
    var c2x = jx - ca * len * 0.34 + (-uy) * (-wob * 0.8), c2y = jy - sa * len * 0.34 + ux * (-wob * 0.8), pts = [], i;
    for (i = 0; i <= 6; i++) { var u = i / 6, m = 1 - u; pts.push({ x: m * m * m * bx + 3 * m * m * u * c1x + 3 * m * u * u * c2x + u * u * u * jx, y: m * m * m * byy + 3 * m * m * u * c1y + 3 * m * u * u * c2y + u * u * u * jy }); }
    return pts;
  }

  // ===================================================================== LETEA: render
  function strokeSegs(pts, w0, w1, col, o) {
    var n = pts.length, i, L = [], Rr = [], N = [], sg = o.belly || 1, avg = (w0 + w1) / 2;
    for (i = 0; i < n; i++) {
      var a = pts[Math.max(i - 1, 0)], b = pts[Math.min(i + 1, n - 1)], dx = b.x - a.x, dy = b.y - a.y, d = Math.sqrt(dx * dx + dy * dy) || 1, nx = -dy / d, ny = dx / d, hw = lerp(w0, w1, i / (n - 1)) / 2;
      N.push([nx, ny, hw, dx / d, dy / d]); L.push([pts[i].x + nx * hw, pts[i].y + ny * hw]); Rr.push([pts[i].x - nx * hw, pts[i].y - ny * hw]);
    }
    function poly() { x.beginPath(); for (i = 0; i < n; i++) i ? x.lineTo(L[i][0], L[i][1]) : x.moveTo(L[i][0], L[i][1]); for (i = n - 1; i >= 0; i--) x.lineTo(Rr[i][0], Rr[i][1]); x.closePath(); }
    function line(off, w, c, al) { x.beginPath(); for (i = 0; i < n; i++) { var q = N[i], px = pts[i].x + q[0] * q[2] * off * sg, py = pts[i].y + q[1] * q[2] * off * sg; i ? x.lineTo(px, py) : x.moveTo(px, py); } x.strokeStyle = c; x.lineWidth = w; x.globalAlpha = al; x.stroke(); x.globalAlpha = 1; }
    x.lineCap = 'round'; x.lineJoin = 'round';
    poly(); x.fillStyle = col; x.fill(); x.strokeStyle = OLC; x.lineWidth = 4.6; x.stroke();
    line(0.62, avg * 0.34, o.sh, 1);                 // sombra del lado inferior
    if (o.bellyCol) line(0.5, avg * 0.2, o.bellyCol, 0.8);
    line(-0.52, Math.max(1.4, avg * 0.11), o.hi, 1);  // brillo
    if (o.rings) { x.beginPath(); for (i = 1; i < n - 1; i++) { var q2 = N[i]; x.moveTo(pts[i].x + q2[0] * q2[2] * 0.9, pts[i].y + q2[1] * q2[2] * 0.9); x.lineTo(pts[i].x - q2[0] * q2[2] * 0.9, pts[i].y - q2[1] * q2[2] * 0.9); } x.strokeStyle = o.sh; x.lineWidth = 1.5; x.stroke(); }
    if (o.fins) {
      x.beginPath();
      for (i = 1; i < n - 1; i++) { var q3 = N[i], bx2 = pts[i].x - q3[0] * q3[2] * 0.85 * sg, by2 = pts[i].y - q3[1] * q3[2] * 0.85 * sg, fl = q3[2] * 0.85; x.moveTo(bx2 - q3[3] * fl * 0.5, by2 - q3[4] * fl * 0.5); x.lineTo(bx2 - q3[0] * fl * 1.1 * sg + q3[3] * fl * 0.2, by2 - q3[1] * fl * 1.1 * sg + q3[4] * fl * 0.2); x.lineTo(bx2 + q3[3] * fl * 0.5, by2 + q3[4] * fl * 0.5); x.closePath(); }
      x.fillStyle = o.hi; x.fill(); x.strokeStyle = OLC; x.lineWidth = 1.6; x.stroke();
    }
  }
  function renderLetea(s) {
    var R = getR('letea', 1000, 760, 500, 470), t = s.t || 0, dying = !!s.dying, i, k;
    x = beginR(R);
    var P = lPose(s), f = P.f;
    if (dying && P.dt >= LDEATH) { R.bb = { x0: 0, y0: 0, x1: 1, y1: 1 }; endR(R); return { canvas: R.cv, ox: R.OX, oy: R.OY, box: R.box }; }
    var shx = P.shake ? Math.sin(t * 0.13) * P.shake : 0, shy = P.shake ? Math.cos(t * 0.17) * P.shake * 0.6 : 0;
    x.translate(R.OX + shx, R.OY + shy);
    if (dying) x.globalAlpha = lDeathAlpha(P);
    extR(R, -190, -60, 190, 130);
    x.drawImage(A.sprite('fx_letea_pond', Math.floor(t / 330) % 3), -180, LGY - 64);
    var by = P.by + P.sunkB, tl = P.tail, tailFront = (tl.pts[5].y + tl.pts[8].y) / 2 > 14;
    function drawTail() {
      var w0 = 46, w1 = 14; strokeSegs(tl.pts, w0, w1, LC.body, { sh: LC.bodyS, hi: LC.bodyH, bellyCol: LC.belly, rings: true });
      var tp = tl.pts[tl.pts.length - 1]; x.save(); x.translate(tp.x, tp.y); x.rotate(tl.ang); if (Math.cos(tl.ang) < 0 && false) x.scale(1, -1); x.drawImage(A.sprite('boss_letea_tail', tl.fin), -8, -32); x.restore();
      for (var q = 0; q < tl.pts.length; q++) ext(R, tl.pts[q].x, tl.pts[q].y, 60);
    }
    if (!tailFront && P.sub < 0.95) drawTail();
    // cuerpo (recortado por la linea de agua)
    x.save(); x.beginPath(); x.rect(-500, -470, 1000, 470 + WL); x.clip();
    x.save(); x.translate(0, by); if (f < 0) x.scale(-1, 1);
    var bfr = P.sub > 0.1 && P.sub < 0.6 ? 1 : (P.emerge < 1 ? 2 : (P.bodyAtk === 'sumersion' && P.bodyIsS ? 2 : 0));
    x.drawImage(A.sprite('boss_letea_body', bfr), -112, -52);
    x.restore();
    x.restore();
    if (tailFront && P.sub < 0.95) drawTail();
    // F3: la sangre muda (tinte toxico sobre lo ya dibujado)
    if ((s.phase || 1) >= 3 && !dying) { x.save(); x.globalCompositeOperation = 'source-atop'; x.fillStyle = 'rgba(120,214,60,' + (0.14 + 0.04 * Math.sin(t / 300)).toFixed(3) + ')'; x.fillRect(-500, -470, 1000, 940); x.restore(); }
    // cuellos y cabezas (recortados solo si estan bajo el agua)
    var needClip = P.sub > 0.02 || P.emerge < 1;
    if (needClip) { x.save(); x.beginPath(); x.rect(-500, -470, 1000, 470 + WL); x.clip(); }
    var order = [0, 2, 1];
    for (var oi = 0; oi < 3; oi++) {
      k = order[oi]; var h = P.heads[k], E = LC.el[k], sc = h.sc || 1, np = neckPts(k, h, P, t, sc);
      var w0n = h.stump ? 34 : 38, w1n = h.stump ? 30 : 26;
      strokeSegs(np, w0n, h.broken ? 30 : (h.fr === 5 ? 22 : 28), E.n, { sh: E.ns, hi: E.nh, bellyCol: LC.belly, rings: true, fins: !h.stump });
      for (i = 0; i < np.length; i++) ext(R, np[i].x, np[i].y, 30);
      ext(R, h.x, h.y, 56);
      // cabeza
      x.save(); x.translate(h.x, h.y); x.rotate(h.ha); if (Math.cos(h.ha) < 0) x.scale(1, -1); if (sc !== 1) x.scale(sc, sc);
      var fr = h.fr; if (h.stump && !h.regrow) fr = h.cauter >= 0.98 ? 6 : 4;
      var hs = A.sprite(LHEAD_SPR[k], fr); x.drawImage(hs, -28, -32);
      x.restore();
    }
    if (needClip) x.restore();
    // espuma en la linea de agua
    if (by < 160) {
      x.beginPath(); x.moveTo(-110, WL + 2); for (i = 0; i <= 22; i++) x.lineTo(-110 + i * 10, WL + 1 + Math.sin(i * 0.8 + t / 260) * 2.2); x.lineTo(110, WL + 12); x.lineTo(-110, WL + 12); x.closePath();
      x.fillStyle = 'rgba(40,120,128,0.55)'; x.fill(); x.strokeStyle = 'rgba(232,255,250,0.85)'; x.lineWidth = 1.8; x.beginPath(); x.moveTo(-110, WL + 2); for (i = 0; i <= 22; i++) x.lineTo(-110 + i * 10, WL + 1 + Math.sin(i * 0.8 + t / 260) * 2.2); x.stroke();
    }
    x.globalAlpha = 1;
    var bx = endR(R);
    var hv = hurtOf(s, dying, P.dt || 0);
    tintR(R, x, s, dying, P.dt || 0, hv);
    x.setTransform(1, 0, 0, 1, 0, 0);
    return { canvas: R.cv, ox: R.OX, oy: R.OY, pose: P, layout: lLayout(P), box: bx };
  }
  function lLayout(P) {
    var o = { heads: [], necks: [], tail: P.tail.tip };
    for (var k = 0; k < 3; k++) { var h = P.heads[k]; o.heads.push({ x: h.x, y: h.y, ha: h.ha }); }
    return o;
  }
  // ===================================================================== LETEA: sombra, aura y efectos
  function lShadow(ctx, px, py, s) {
    var al = 0.38; if (s.dying && s.dt > 2700) al *= 1 - clamp((s.dt - 2700) / 900, 0, 1);
    ctx.save(); ctx.translate(px, py + LGY + 8);
    ctx.fillStyle = 'rgba(6,14,16,' + (al * 0.55).toFixed(3) + ')'; ctx.beginPath(); ctx.ellipse(0, 0, 190, 58, 0, 0, TAU); ctx.fill();
    ctx.fillStyle = 'rgba(6,14,16,' + (al * 0.8).toFixed(3) + ')'; ctx.beginPath(); ctx.ellipse(0, 0, 160, 46, 0, 0, TAU); ctx.fill();
    ctx.restore();
  }
  function lAura(ctx, px, py, s, P) {
    var t = s.t || 0, on = s.enraged || s.desperate || (s.phase || 1) >= 3; if (!on) return;
    var col = (s.phase || 1) >= 3 && !s.enraged ? '120,230,70' : (s.desperate ? '176,90,240' : '255,60,30'), a = 0.16 + 0.06 * Math.sin(t / 350);
    ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = clamp(a * 1.5, 0, 1); ctx.drawImage(glowSpr(col), px - 240, py + LGY - 96, 480, 192); ctx.restore();
  }
  function lFront(ctx, px, py, s, P, R) {
    var t = s.t || 0, gx = px, gy = py + LGY, i, k;
    // ondas y burbujas del estanque
    if (P.ripple) { for (i = 0; i < 3; i++) { var rp = ((t / 1100) + i / 3) % 1; ctx.strokeStyle = 'rgba(220,252,246,' + (0.6 * (1 - rp)).toFixed(2) + ')'; ctx.lineWidth = 2.4; ctx.beginPath(); ctx.ellipse(gx, gy, 40 + rp * 130, 12 + rp * 40, 0, 0, TAU); ctx.stroke(); } }
    if (P.bubbles) { for (i = 0; i < 12; i++) { var bp = ((t / 900) + i / 12) % 1, bx = gx + (pr(i + 3) - 0.5) * 220, by = gy + 6 - bp * 40 + (pr(i) - 0.5) * 20, br = 3 + pr(i + 8) * 4 * (0.4 + bp); ctx.strokeStyle = 'rgba(232,255,250,' + (0.85 * (1 - bp)).toFixed(2) + ')'; ctx.fillStyle = 'rgba(160,240,230,' + (0.25 * (1 - bp)).toFixed(2) + ')'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(bx, by, br, 0, TAU); ctx.fill(); ctx.stroke(); } }
    if (P.splash > 0 && P.splash < 1) { var sf = A.sprite('fx_water_splash', Math.min(4, Math.floor(P.splash * 5))); ctx.drawImage(sf, gx - sf.width * 1.4, gy - sf.height * 2.0, sf.width * 2.8, sf.height * 2.8); }
    // efectos por cabeza
    for (k = 0; k < 3; k++) {
      var h = P.heads[k], E = LC.el[k], hx = gx + h.x, hy = py + h.y, ca = Math.cos(h.ha), sa = Math.sin(h.ha), mx = hx + ca * 26, my = hy + sa * 26 + (Math.cos(h.ha) < 0 ? 0 : 0);
      if (h.vis != null && h.vis < 0.4) continue;
      ctx.save(); ctx.globalCompositeOperation = 'lighter';
      if (h.glow > 0.02 && !h.stump) glowAt(ctx, mx, my, 16 + h.glow * 20, h.atk === 'plaideras' ? '176,90,240' : E.glow, 0.5 * h.glow);
      if (h.hurt > 0.05) glowAt(ctx, hx, hy, 40, '255,255,255', 0.45 * h.hurt);
      if (h.mist > 0.02) { // niebla helada en cono
        var Ln = 420 * ease(h.mist), a = h.a;
        for (i = 0; i < 3; i++) { var w = [0.34, 0.22, 0.1][i]; ctx.fillStyle = ['rgba(106,200,255,0.16)', 'rgba(160,225,255,0.22)', 'rgba(230,248,255,0.32)'][i]; ctx.beginPath(); ctx.moveTo(mx, my); ctx.lineTo(mx + Math.cos(a - w) * Ln, my + Math.sin(a - w) * Ln); ctx.lineTo(mx + Math.cos(a + w) * Ln, my + Math.sin(a + w) * Ln); ctx.closePath(); ctx.fill(); }
        for (i = 0; i < 18; i++) { var ph = ((t / 700) + i / 18) % 1, rr = ph * Ln, aa = a + (pr(i + 7) - 0.5) * 0.5 * (0.3 + ph), sz = 3 + ph * 7; ctx.fillStyle = 'rgba(232,250,255,' + (0.7 * (1 - ph)).toFixed(2) + ')'; ctx.fillRect(mx + Math.cos(aa) * rr - sz / 2, my + Math.sin(aa) * rr - sz / 2, sz, sz); }
      }
      if (h.spark > 0.02 && !h.stump) { // chisporroteo
        ctx.strokeStyle = 'rgba(255,248,170,' + (0.9 * h.spark).toFixed(2) + ')'; ctx.lineWidth = 2;
        for (i = 0; i < 4; i++) { var a0 = t / 90 + i * 1.7 + k, px0 = hx + Math.cos(a0) * 24, py0 = hy + Math.sin(a0) * 24; ctx.beginPath(); ctx.moveTo(px0, py0); ctx.lineTo(px0 + Math.cos(a0 + 0.8) * 10 + (pr(Math.floor(t / 60) + i) - 0.5) * 10, py0 + Math.sin(a0 + 0.8) * 10); ctx.lineTo(px0 + Math.cos(a0) * 20, py0 + Math.sin(a0) * 20 + (pr(Math.floor(t / 60) + i + 9) - 0.5) * 8); ctx.stroke(); }
        glowAt(ctx, hx, hy, 34, '255,228,90', 0.28 * h.spark);
      }
      if (h.sing > 0.02) { // ondas de canto (arcos que salen de la boca)
        ctx.strokeStyle = 'rgba(' + (h.atk === 'plaideras' ? '200,120,255' : E.glow) + ',' + (0.8 * h.sing).toFixed(2) + ')'; ctx.lineWidth = 2.4;
        for (i = 0; i < 3; i++) { var rp2 = ((t / 900) + i / 3 + k * 0.2) % 1; ctx.globalAlpha = 1 - rp2; ctx.lineWidth = 3.4 * (1 - rp2) + 1; ctx.beginPath(); ctx.arc(mx, my, 16 + rp2 * 64, h.ha - 0.8, h.ha + 0.8); ctx.stroke(); }
        ctx.globalAlpha = 1;
      }
      ctx.restore();
      // herida: llama de cauterizado y brote
      if (h.stump && h.cauter > 0.02 && h.cauter < 0.98) {
        for (i = 0; i < 6; i++) { var fp = ((t / 380) + i / 6) % 1, fx = hx + (pr(i + 2) - 0.5) * 26, fy = hy - fp * 40 * h.cauter; ctx.fillStyle = (i % 2 ? 'rgba(255,200,70,' : 'rgba(255,100,30,') + (0.9 * (1 - fp)).toFixed(2) + ')'; ctx.beginPath(); ctx.ellipse(fx, fy, 6 * (1 - fp) + 2, 10 * (1 - fp) + 3, 0, 0, TAU); ctx.fill(); }
      }
      if (h.regrow > 0.02 && h.regrow < 0.98) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; for (i = 0; i < 4; i++) { var sp = ((t / 700) + i / 4) % 1; ctx.fillStyle = 'rgba(' + E.glow + ',' + (0.8 * (1 - sp)).toFixed(2) + ')'; ctx.fillRect(hx + (pr(i + 5) - 0.5) * 36, hy - sp * 30, 3, 3); } ctx.restore(); }
      if (h.exposed && !s.dying) { var pu = 1 + 0.08 * Math.sin(t / 130); ctx.save(); ctx.strokeStyle = 'rgba(255,230,120,0.95)'; ctx.lineWidth = 3.4; ctx.beginPath(); ctx.arc(hx, hy, 40 * pu, 0, TAU); ctx.stroke(); ctx.strokeStyle = OLC; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(hx, hy, 43 * pu, 0, TAU); ctx.stroke(); ctx.restore(); }
    }
    if (s.exposed && !s.dying) { var wr = A.animFrame('fx_window_ring', 'loop', t), pu2 = 1 + 0.05 * Math.sin(t / 150), Wd = 280 * pu2; ctx.save(); ctx.globalAlpha = 0.85; ctx.translate(gx, gy - 4); ctx.scale(1, 0.4); ctx.drawImage(wr, -Wd * 0.6, -Wd * 0.6, Wd * 1.2, Wd * 1.2); ctx.restore(); }
    if (s.immune && !s.dying) { ctx.save(); ctx.strokeStyle = 'rgba(200,235,255,' + (0.5 + 0.3 * Math.sin(t / 100)).toFixed(2) + ')'; ctx.lineWidth = 3; ctx.setLineDash([12, 8]); ctx.lineDashOffset = -t / 30; ctx.beginPath(); ctx.ellipse(gx, gy - 90, 190, 150, 0, 0, TAU); ctx.stroke(); ctx.restore(); }
    // estela del coletazo
    if (P.bodyAtk === 'coletazo' && P.bodyIsS) { ctx.save(); ctx.strokeStyle = 'rgba(220,252,246,0.55)'; ctx.lineWidth = 5; ctx.lineCap = 'round'; var sp3 = P.bodySp, tip = P.tail.tip; var an = Math.atan2(tip.y - 10, tip.x), rd = Math.sqrt(tip.x * tip.x + (tip.y - 10) * (tip.y - 10)); ctx.beginPath(); ctx.arc(gx, py + 10, rd, an - 1.3 * (s.facing < 0 ? -1 : 1), an, s.facing < 0); ctx.stroke(); ctx.restore(); }
  }

  // ===================================================================== TELEGRAFIAS NUEVAS
  var COLS = {
    red: { f: '255,59,48', s: '#ff6a5a' }, green: { f: '123,227,74', s: '#b0f58a' }, purple: { f: '176,90,240', s: '#dca0ff' },
    orange: { f: '255,138,26', s: '#ffe45a' }, gold: { f: '255,210,58', s: '#fff6c0' }, blue: { f: '106,200,255', s: '#c0ecff' }, yellow: { f: '255,228,90', s: '#fff6a0' }
  };
  var TELE2 = { mace: 'red', meteor: 'orange', ribs: 'red', breath: 'red', erupt: 'red', flood: 'orange', acid: 'green', frost: 'blue', bolt: 'yellow', bubbles: 'red' };
  function sector(path, x, y, r, a0, a1, inner) { if (inner > 0) { path.arc(x, y, r, a0, a1); path.arc(x, y, inner, a1, a0, true); } else { path.moveTo(x, y); path.arc(x, y, r, a0, a1); } path.closePath(); }
  function tele2(ctx, kind, x, y, o) {
    o = o || {}; var p = o.p == null ? 1 : clamp(o.p, 0, 1), col = COLS[o.color || TELE2[kind]], a = o.a || 0, t = o.t != null ? o.t : performance.now(), fix = o.fix != null ? o.fix : p >= 0.75, r = o.r || 100, path = new Path2D(), prog = new Path2D(), extra = null, i, noStroke = false;
    if (kind === 'mace') {
      r = o.r || 90; path.arc(x, y, r, 0, TAU); prog.arc(x, y, Math.max(1, r * p), 0, TAU);
      extra = function () {
        ctx.save(); ctx.translate(x, y); ctx.rotate(-0.35); var k = 0.35 + 0.65 * p; ctx.fillStyle = 'rgba(10,4,16,' + (0.18 + 0.32 * p).toFixed(3) + ')';
        ctx.beginPath(); ctx.rect(-r * 0.46 * k, -r * 0.3 * k, r * 0.92 * k, r * 0.6 * k); ctx.fill(); ctx.fillRect(-4 * k, -r * 0.3 * k - r * 1.1 * (1 - p) - 2, 8 * k, r * 1.1 * (1 - p) + 4);
        ctx.restore(); ctx.strokeStyle = 'rgba(255,255,255,0.5)'; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.moveTo(x - 10, y); ctx.lineTo(x + 10, y); ctx.moveTo(x, y - 10); ctx.lineTo(x, y + 10); ctx.stroke();
      };
    } else if (kind === 'meteor') {
      r = o.r || 55; path.arc(x, y, r, 0, TAU); prog.arc(x, y, Math.max(1, r * p), 0, TAU);
      extra = function () {
        ctx.strokeStyle = 'rgba(255,255,255,0.65)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x - r * 0.45, y - r * 0.45); ctx.lineTo(x + r * 0.45, y + r * 0.45); ctx.moveTo(x + r * 0.45, y - r * 0.45); ctx.lineTo(x - r * 0.45, y + r * 0.45); ctx.stroke();
        ctx.fillStyle = 'rgba(255,230,120,' + (0.25 + 0.5 * p).toFixed(2) + ')'; ctx.beginPath(); ctx.arc(x, y, 4 + 4 * p, 0, TAU); ctx.fill();
      };
    } else if (kind === 'ribs') {
      var n = o.n || 12, len = o.len || 420, w = 0.07;
      for (i = 0; i < n; i++) { var an = a + i * TAU / n; [[path, len], [prog, len * p]].forEach(function (z) { z[0].moveTo(x, y); z[0].lineTo(x + Math.cos(an - w) * z[1], y + Math.sin(an - w) * z[1]); z[0].lineTo(x + Math.cos(an + w) * z[1], y + Math.sin(an + w) * z[1]); z[0].closePath(); }); }
      noStroke = true;
      extra = function () {
        ctx.strokeStyle = col.s; ctx.lineWidth = fix ? 3 : 2; if (!fix) { ctx.setLineDash([10, 7]); ctx.lineDashOffset = -t / 40; }
        for (var q = 0; q < n; q++) { var an2 = a + q * TAU / n; ctx.beginPath(); ctx.moveTo(x + Math.cos(an2) * 50, y + Math.sin(an2) * 50); ctx.lineTo(x + Math.cos(an2) * len * Math.max(0.15, p), y + Math.sin(an2) * len * Math.max(0.15, p)); ctx.stroke(); }
        ctx.setLineDash([]); ctx.fillStyle = 'rgba(255,200,180,0.8)';
        for (var q2 = 0; q2 < n; q2++) { var an3 = a + q2 * TAU / n, ex = x + Math.cos(an3) * len * Math.max(0.15, p), ey = y + Math.sin(an3) * len * Math.max(0.15, p); ctx.beginPath(); ctx.moveTo(ex + Math.cos(an3) * 10, ey + Math.sin(an3) * 10); ctx.lineTo(ex - Math.cos(an3) * 4 - Math.sin(an3) * 7, ey - Math.sin(an3) * 4 + Math.cos(an3) * 7); ctx.lineTo(ex - Math.cos(an3) * 4 + Math.sin(an3) * 7, ey - Math.sin(an3) * 4 - Math.cos(an3) * 7); ctx.closePath(); ctx.fill(); }
      };
    } else if (kind === 'breath' || kind === 'frost') {
      var arc = o.arc || (kind === 'breath' ? 50 : 40) * Math.PI / 180, R0 = o.r || (kind === 'breath' ? 560 : 420), sw = kind === 'breath' ? (o.sweep == null ? 40 * Math.PI / 180 : o.sweep) : 0, a0 = a - arc / 2, a1 = a + arc / 2 + sw;
      sector(path, x, y, R0, a0, a1, 0); sector(prog, x, y, R0 * p, a0, a1, 0);
      extra = function () {
        if (kind === 'breath') { ctx.strokeStyle = 'rgba(255,230,140,0.9)'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(x, y, R0 * 0.94, a + arc / 2 - 0.02, a1); ctx.stroke(); var ex = x + Math.cos(a1) * R0 * 0.94, ey = y + Math.sin(a1) * R0 * 0.94; ctx.fillStyle = 'rgba(255,230,140,0.95)'; ctx.beginPath(); ctx.moveTo(ex + Math.cos(a1 + 1.57) * 12, ey + Math.sin(a1 + 1.57) * 12); ctx.lineTo(ex + Math.cos(a1 - 1.57) * 8 + Math.cos(a1) * 0, ey + Math.sin(a1 - 1.57) * 8); ctx.lineTo(ex + Math.cos(a1) * 0 + Math.cos(a1 + 1.57) * -8, ey + Math.sin(a1 + 1.57) * -8); ctx.closePath(); ctx.fill(); }
        else { ctx.fillStyle = 'rgba(232,250,255,0.85)'; for (var q = 1; q <= 4; q++) { var d = R0 * q / 5 * Math.max(0.2, p); [-1, 1].forEach(function (sg) { var aa = a + sg * arc / 2 * 0.9, cx = x + Math.cos(aa) * d, cy = y + Math.sin(aa) * d; ctx.beginPath(); ctx.moveTo(cx + Math.cos(aa) * 9, cy + Math.sin(aa) * 9); ctx.lineTo(cx + Math.cos(aa + 1.57) * 4, cy + Math.sin(aa + 1.57) * 4); ctx.lineTo(cx - Math.cos(aa) * 7, cy - Math.sin(aa) * 7); ctx.lineTo(cx + Math.cos(aa - 1.57) * 4, cy + Math.sin(aa - 1.57) * 4); ctx.closePath(); ctx.fill(); }); } }
      };
    } else if (kind === 'erupt') {
      r = o.r || 250; path.arc(x, y, r, 0, TAU); prog.arc(x, y, Math.max(1, r * p), 0, TAU);
      extra = function () { ctx.strokeStyle = 'rgba(255,200,150,0.6)'; ctx.lineWidth = 2.2; for (var q = 0; q < 3; q++) { var ph = ((t / 700) + q / 3) % 1; ctx.globalAlpha = ph; ctx.beginPath(); ctx.arc(x, y, r * (1 - ph) * 0.95 + 10, 0, TAU); ctx.stroke(); } ctx.globalAlpha = 1; };
    } else if (kind === 'flood') {
      var rc = o.rect || { x: x - 300, y: y - 200, w: 600, h: 400 }, isl = o.islands || [];
      path.rect(rc.x, rc.y, rc.w, rc.h); isl.forEach(function (c) { path.moveTo(c.x + c.r, c.y); path.arc(c.x, c.y, c.r, 0, TAU, true); });
      prog.rect(rc.x, rc.y, rc.w, rc.h); isl.forEach(function (c) { prog.moveTo(c.x + c.r, c.y); prog.arc(c.x, c.y, c.r, 0, TAU, true); });
      extra = function () {
        ctx.save(); ctx.clip(path, 'evenodd'); ctx.strokeStyle = 'rgba(255,190,60,' + (0.35 + 0.5 * p).toFixed(2) + ')'; ctx.lineWidth = 2.4;
        for (var q = 0; q < 14; q++) { var sx = rc.x + pr(q + 1) * rc.w, sy = rc.y + pr(q + 40) * rc.h; ctx.beginPath(); ctx.moveTo(sx, sy); for (var z = 1; z <= 4; z++) ctx.lineTo(sx + (pr(q * 5 + z) - 0.5) * 90 * z * p, sy + (pr(q * 5 + z + 50) - 0.5) * 70 * z * p); ctx.stroke(); }
        ctx.restore();
        isl.forEach(function (c) { var pu = 0.5 + 0.5 * Math.sin(t / 160); ctx.fillStyle = 'rgba(255,255,255,' + (0.1 + 0.16 * pu).toFixed(2) + ')'; ctx.beginPath(); ctx.arc(c.x, c.y, c.r, 0, TAU); ctx.fill(); ctx.strokeStyle = 'rgba(255,255,255,' + (0.7 + 0.3 * pu).toFixed(2) + ')'; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(c.x, c.y, c.r, 0, TAU); ctx.stroke(); });
      };
    } else if (kind === 'acid') {
      r = o.r || 50; path.arc(x, y, r, 0, TAU); prog.arc(x, y, Math.max(1, r * p), 0, TAU);
      extra = function () { ctx.fillStyle = 'rgba(208,255,154,0.8)'; for (var q = 0; q < 6; q++) { var ph = ((t / 900) + q / 6) % 1, ba = pr(q + 3) * TAU, bd = pr(q + 9) * r * 0.65; ctx.beginPath(); ctx.arc(x + Math.cos(ba) * bd, y + Math.sin(ba) * bd - ph * 8, 2.6 * (1 - ph) + 0.8, 0, TAU); ctx.fill(); } ctx.strokeStyle = 'rgba(' + col.f + ',0.9)'; ctx.lineWidth = 3; ctx.setLineDash([2, 8]); ctx.beginPath(); ctx.arc(x, y, r * (1.6 - 0.6 * p), 0, TAU); ctx.stroke(); ctx.setLineDash([]); };
    } else if (kind === 'bolt') {
      r = o.r || 45; path.arc(x, y, r, 0, TAU); prog.arc(x, y, Math.max(1, r * p), 0, TAU);
      extra = function () { ctx.strokeStyle = 'rgba(255,255,255,0.9)'; ctx.lineWidth = 2.6; ctx.lineJoin = 'miter'; ctx.beginPath(); ctx.moveTo(x + 6, y - r * 0.62); ctx.lineTo(x - 8, y + 2); ctx.lineTo(x + 2, y + 2); ctx.lineTo(x - 6, y + r * 0.62); ctx.stroke(); ctx.lineJoin = 'round'; };
    } else if (kind === 'bubbles') {
      r = o.r || 140; path.arc(x, y, r, 0, TAU); prog.arc(x, y, Math.max(1, r * p), 0, TAU);
      extra = function () { ctx.strokeStyle = 'rgba(232,255,250,0.85)'; ctx.fillStyle = 'rgba(160,240,230,0.2)'; ctx.lineWidth = 1.6; for (var q = 0; q < 12; q++) { var ph = ((t / 800) + q / 12) % 1, ba = pr(q + 5) * TAU, bd = pr(q + 15) * r * 0.85, br = 3 + pr(q + 25) * 6 * (0.4 + ph); ctx.globalAlpha = 1 - ph * 0.6; ctx.beginPath(); ctx.arc(x + Math.cos(ba) * bd, y + Math.sin(ba) * bd - ph * 14, br, 0, TAU); ctx.fill(); ctx.stroke(); } ctx.globalAlpha = 1; };
    } else return false;
    ctx.save(); ctx.lineJoin = 'round';
    ctx.fillStyle = 'rgba(' + col.f + ',' + (0.12 + 0.28 * p).toFixed(3) + ')'; ctx.fill(path, 'evenodd');
    ctx.fillStyle = 'rgba(' + col.f + ',0.20)'; ctx.fill(prog, 'evenodd');
    if (!noStroke) {
      if (o.sig) { ctx.strokeStyle = 'rgba(255,255,255,0.28)'; ctx.lineWidth = 9; ctx.stroke(path); }
      ctx.strokeStyle = col.s; ctx.globalAlpha = 0.85; ctx.lineWidth = fix ? 3.4 : 2.6;
      if (!fix) { ctx.setLineDash([11, 8]); ctx.lineDashOffset = -t / 40; }
      ctx.stroke(path); ctx.setLineDash([]); ctx.globalAlpha = 1;
    }
    if (extra) extra();
    ctx.restore(); return true;
  }
  var oldTele = A.drawBossTele;
  A.drawBossTele = function (ctx, kind, x, y, o) { if (TELE2[kind]) return tele2(ctx, kind, x, y, o); return oldTele.apply(A, arguments); };

  // banda de ola / marea: (x,y) = centro del borde delantero, a = direccion de avance, len = ancho perpendicular, th = grosor detras del borde.
  A.drawBossBand = function (ctx, x, y, a, len, th, o) {
    o = o || {}; var t = o.t != null ? o.t : performance.now(), lava = o.style === 'lava', tele = !!o.tele, p = o.p == null ? 1 : o.p, al = o.alpha == null ? 1 : o.alpha, gaps = (o.gaps || []).slice().sort(function (g1, g2) { return g1[0] - g2[0]; });
    var segs = [], cur = 0, i; gaps.forEach(function (g) { if (g[0] > cur) segs.push([cur, g[0]]); cur = Math.max(cur, g[1]); }); if (cur < len) segs.push([cur, len]);
    ctx.save(); ctx.translate(x, y); ctx.rotate(a); ctx.globalAlpha = al;
    segs.forEach(function (sg) {
      var y0 = -len / 2 + sg[0], y1 = -len / 2 + sg[1], h = y1 - y0;
      if (tele) {
        ctx.fillStyle = 'rgba(255,59,48,' + (0.12 + 0.28 * p).toFixed(3) + ')'; ctx.fillRect(-th, y0, th, h);
        ctx.strokeStyle = '#ff6a5a'; ctx.lineWidth = p >= 0.75 ? 3.4 : 2.6; if (p < 0.75) { ctx.setLineDash([11, 8]); ctx.lineDashOffset = -t / 40; } ctx.strokeRect(-th, y0, th, h); ctx.setLineDash([]);
        ctx.fillStyle = 'rgba(' + (lava ? '255,200,80' : '120,200,255') + ',0.8)'; for (i = 0; i < Math.floor(h / 46); i++) { var cy = y0 + 23 + i * 46, ax = -th * 0.5 + ((t / 8) % 30); ctx.beginPath(); ctx.moveTo(ax + 14, cy); ctx.lineTo(ax - 6, cy - 10); ctx.lineTo(ax - 6, cy + 10); ctx.closePath(); ctx.fill(); }
        return;
      }
      var g = ctx.createLinearGradient(-th, 0, 0, 0);
      if (lava) { g.addColorStop(0, 'rgba(255,106,26,0.35)'); g.addColorStop(1, 'rgba(255,170,40,0.95)'); } else { g.addColorStop(0, 'rgba(40,150,170,0.3)'); g.addColorStop(1, 'rgba(70,190,200,0.95)'); }
      ctx.fillStyle = (window.G && G.fg) ? G.fg(g, lava ? 'rgba(255,140,34,0.7)' : 'rgba(55,170,185,0.65)') : g; ctx.fillRect(-th, y0, th, h);
      ctx.beginPath(); ctx.moveTo(0, y0); for (var yy = y0; yy <= y1; yy += 8) ctx.lineTo(Math.sin(yy / 9 + t / 120) * 5, yy); ctx.lineTo(-10, y1); ctx.lineTo(-10, y0); ctx.closePath();
      ctx.strokeStyle = lava ? '#ffe45a' : '#e8fffa'; ctx.lineWidth = 4; ctx.stroke();
      ctx.fillStyle = lava ? 'rgba(255,230,120,0.7)' : 'rgba(232,255,250,0.75)'; for (i = 0; i < Math.floor(h / 22); i++) { var by2 = y0 + 11 + i * 22; ctx.beginPath(); ctx.arc(-4 - ((i * 7 + t / 20) % 24), by2 + Math.sin(i + t / 200) * 4, 3, 0, TAU); ctx.fill(); }
    });
    ctx.restore();
  };

  // ===================================================================== ARENA
  var patCache = {};
  function lavaPattern(ctx, f) { return patCache[f] || (patCache[f] = ctx.createPattern(A.sprite('fx_lava_tile', f), 'repeat')); }
  function lavaFill(ctx, path, t, a, edgeGlow) {
    ctx.save(); ctx.globalAlpha = a == null ? 1 : a; ctx.fillStyle = lavaPattern(ctx, Math.floor(t / 260) % 4); ctx.fill(path, 'evenodd');
    ctx.fillStyle = 'rgba(70,12,0,0.2)'; ctx.fill(path, 'evenodd'); ctx.restore();
  }
  A.drawLavaFlood = function (ctx, rect, islands, t, a) {
    var path = new Path2D(); path.rect(rect.x, rect.y, rect.w, rect.h); (islands || []).forEach(function (c) { path.moveTo(c.x + c.r, c.y); path.arc(c.x, c.y, c.r, 0, TAU, true); });
    lavaFill(ctx, path, t, a);
    ctx.save(); ctx.globalAlpha = a == null ? 1 : a; ctx.strokeStyle = '#ffe45a'; ctx.lineWidth = 4; (islands || []).forEach(function (c) { ctx.beginPath(); ctx.arc(c.x, c.y, c.r + 2, 0, TAU); ctx.stroke(); });
    ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = 'rgba(255,120,30,0.10)'; ctx.fill(path, 'evenodd'); ctx.restore();
  };
  A.drawLavaEdge = function (ctx, rect, margin, t, a) {
    var path = new Path2D(); path.rect(rect.x, rect.y, rect.w, rect.h); path.rect(rect.x + margin, rect.y + margin, rect.w - margin * 2, rect.h - margin * 2);
    lavaFill(ctx, path, t, a);
    ctx.save(); ctx.globalAlpha = a == null ? 1 : a; ctx.strokeStyle = '#ffe45a'; ctx.lineWidth = 3; ctx.beginPath(); ctx.rect(rect.x + margin, rect.y + margin, rect.w - margin * 2, rect.h - margin * 2); ctx.stroke();
    ctx.strokeStyle = 'rgba(20,8,10,0.55)'; ctx.lineWidth = 8; ctx.beginPath(); ctx.rect(rect.x + margin - 5, rect.y + margin - 5, rect.w - margin * 2 + 10, rect.h - margin * 2 + 10); ctx.stroke(); ctx.restore();
  };
  A.drawLavaPool = function (ctx, x, y, r, t, o) { o = o || {}; var sp = A.sprite('fx_lava_pool', Math.floor(t / 200) % 4), sz = sp.width * r / 70; ctx.save(); ctx.globalAlpha = o.alpha == null ? 1 : o.alpha; ctx.drawImage(sp, x - sz / 2, y - sz / 2, sz, sz); ctx.restore(); };
  A.drawWaterPool = function (ctx, x, y, r, t, o) { o = o || {}; var acid = !!o.acid, sp = A.sprite(acid ? 'fx_acid_puddle' : 'fx_water_pool', Math.floor(t / 300) % 3), sz = sp.width * r / (acid ? 50 : 90); ctx.save(); ctx.globalAlpha = o.alpha == null ? 1 : o.alpha; ctx.drawImage(sp, x - sz / 2, y - sz / 2, sz, sz); ctx.restore(); };
  A.drawIsland = function (ctx, x, y, r, o) {
    o = o || {}; var sz = 256 * r / 120; ctx.save(); ctx.globalAlpha = o.alpha == null ? 1 : o.alpha;
    ctx.drawImage(A.sprite('fx_island_stone', o.crack ? 2 : 0), x - sz / 2, y - sz / 2, sz, sz);
    if (o.lit > 0) { ctx.globalAlpha = clamp(o.lit, 0, 1) * (o.alpha == null ? 1 : o.alpha) * (0.6 + 0.4 * Math.sin((o.t || 0) / 140)); ctx.drawImage(A.sprite('fx_island_stone', 1), x - sz / 2, y - sz / 2, sz, sz); }
    ctx.restore();
  };
  A.drawEmberPatch = function (ctx, x, y, r, t, a) { var sp = A.sprite('fx_ember_patch', [0, 1, 2, 1][Math.floor(t / 200) % 4]), sz = sp.width * r / 30; ctx.save(); ctx.globalAlpha = a == null ? 1 : a; ctx.drawImage(sp, x - sz / 2, y - sz / 2, sz, sz); ctx.restore(); };
  // pilar: kind 'bone' | 'crystal'; (x,y) = centro del circulo de colision. o: {hp:0..1, rebuild:0..1, struck:bool, alpha, t}
  A.drawPillar = function (ctx, kind, x, y, o) {
    o = o || {}; var hp = o.hp == null ? 1 : o.hp, bone = kind !== 'crystal', nm = bone ? 'obs_bone_pillar' : 'obs_crystal_pillar', ax = bone ? 30 : 26, ay = bone ? 66 : 78, f = hp > 0.5 ? 0 : (hp > 0 ? 1 : 2);
    ctx.save(); ctx.globalAlpha = o.alpha == null ? 1 : o.alpha;
    if (f === 2 && o.rebuild > 0) { ctx.drawImage(A.sprite(nm, 2), x - ax, y - ay); ctx.globalAlpha *= clamp(o.rebuild, 0, 1); ctx.drawImage(A.sprite(nm, bone ? 3 : 0), x - ax, y - ay); }
    else ctx.drawImage(A.sprite(nm, o.struck && !bone ? 3 : f), x - ax, y - ay);
    ctx.restore();
  };
  // rayo del cielo en (x,y): p 0..1 (aparece, destella y se desvanece)
  A.drawLightning = function (ctx, x, y, p, o) {
    o = o || {}; p = clamp(p, 0, 1); var t = o.t != null ? o.t : performance.now(), al = p < 0.12 ? p / 0.12 : (p > 0.55 ? clamp(1 - (p - 0.55) / 0.45, 0, 1) : 1), sp = A.sprite('fx_lightning_strike', Math.floor(t / 70) % 3), sc = o.scale || 1;
    ctx.save(); ctx.globalAlpha = al; ctx.drawImage(sp, x - 48 * sc, y - 312 * sc, sp.width * sc, sp.height * sc);
    ctx.globalCompositeOperation = 'lighter'; glowAt(ctx, x, y, 70 * sc, '255,240,150', 0.6 * al); ctx.strokeStyle = 'rgba(255,248,190,' + (0.7 * al).toFixed(2) + ')'; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(x, y, (o.r || 45) * (0.5 + p * 0.6), 0, TAU); ctx.stroke(); ctx.restore();
  };

  // ===================================================================== API PUBLICA (envuelve la del Pastor; los ids viejos siguen igual)
  var BOSSES = A.BOSS, B2 = {
    karceron: {
      id: 'karceron', name: 'Karceron', title: 'El Carcelero de Brasa', r: 90, gy: KGY, w: 256, h: 260, deathMs: KDEATH, windups: KNAMES,
      phases: ['Despertar', 'La Fragua', 'Marea de lava'], despair: 'Réquiem de Fuego', parts: { maza: { r: 34 }, grillete: { r: 34 }, nucleo: { r: 34 } },
      render: renderKarceron, shadow: kShadow, aura: kAura, front: kFront
    },
    letea: {
      id: 'letea', name: 'Letea', title: 'La Hidra del Olvido', r: 80, gy: LGY, w: 300, h: 330, deathMs: LDEATH, windups: LNAMES,
      phases: ['Tres memorias', 'Marea', 'Antídoto'], despair: 'Coro del Olvido', parts: { acid: { r: 26 }, ice: { r: 26 }, bolt: { r: 26 } },
      render: renderLetea, shadow: lShadow, aura: lAura, front: lFront
    }
  };
  BOSSES.karceron = B2.karceron; BOSSES.letea = B2.letea;
  var oldDraw = A.drawBoss, oldRender = A.renderBoss, oldShadow = A.drawBossShadow, oldAnch = A.bossAnchors, oldNames = A.bossPoseNames;
  A.drawBoss = function (id, ctx, x, y, s) {
    var B = B2[id]; if (!B) return oldDraw.apply(A, arguments);
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
  A.renderBoss = function (id, s) { var B = B2[id]; return B ? B.render(s || {}) : oldRender.apply(A, arguments); };
  A.drawBossShadow = function (ctx, x, y, s) { var id = s && s.id; if (id && B2[id]) return B2[id].shadow(ctx, x, y, s); return oldShadow.apply(A, arguments); };
  A.bossPoseNames = function (id) { return id === 'karceron' ? KNAMES.slice() : id === 'letea' ? LNAMES.slice() : oldNames(); };
  function rd(v) { return Math.round(v * 10) / 10; }
  function pt(p, r) { return { x: rd(p.x), y: rd(p.y), r: r || 0 }; }
  A.bossAnchors = function (id, s) {
    s = s || {};
    if (id === 'karceron') {
      var P = kPoseFor(s), L = kLayout(P, s), br = s.broken || {}, by = P.by;
      return {
        body: pt({ x: 0, y: 0 }, 90), skull: pt(L.skull, 30), maza: br.maza ? pt({ x: L.sR.x + 20, y: L.sR.y + 30 }, 34) : pt(L.mh, 34), grillete: br.grillete ? pt({ x: L.sL.x - 20, y: L.sL.y + 30 }, 34) : pt(L.lh, 34), nucleo: pt(L.core, 34),
        mouth: pt(L.mouth, 10), chest: pt(L.chest, 0), shoulderR: pt(L.sR, 10), shoulderL: pt(L.sL, 10), elbowR: pt(L.eR, 16), elbowL: pt(L.eL, 16),
        feet: { x: 0, y: KGY, r: 0 }, groundShadow: { x: 0, y: KGY + 8, r: 130 }
      };
    }
    if (id === 'letea') {
      var Q = lPose(s), o = { body: pt({ x: 0, y: Q.by * 0.5 + Q.sunkB * 0.5 }, 80), tail: pt(Q.tail.tip, 30), feet: { x: 0, y: LGY, r: 0 }, groundShadow: { x: 0, y: LGY + 8, r: 170 } };
      for (var k = 0; k < 3; k++) {
        var h = Q.heads[k], key = LKEYS[k];
        o[key] = pt(h, 26); o['mouth_' + key] = pt({ x: h.x + Math.cos(h.ha) * 26, y: h.y + Math.sin(h.ha) * 26 }, 8); o['neckBase_' + key] = pt({ x: LBASE[k][0], y: LBASE[k][1] + Q.by + Q.sunkB }, 0);
      }
      return o;
    }
    return oldAnch.apply(A, arguments);
  };
})();
