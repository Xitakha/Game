/* sfx_cine2.js - Audio de las entradas de jefe v9 (FASE 2, DESIGN-v9-cinematicas.md sec. 5 y 8). Script clasico; cargar DESPUES de sfx_cine.js.
   Solo audio procedural (WebAudio), contexto propio que sigue desbloqueo, mute, volumen y suspend de Assets. No usa G.rng ni toca la simulacion. Tono oscuro.
   API: G.Snd.cine2(tipo, bossId, opts, pitch)  (tambien Assets.cine2)
     tipo 'appear' : presagio/aparicion del jefe. opts.short=true -> ~1,6 s (resto de veces); si no ~4,5 s (1.a vez). Pensado para lanzarse en t=0 de la intro.
     tipo 'plate'  : golpe de cartel con el nombre (~1,4 s con cola), un tono por jefe.
     tipo 'preroll': prerrollo de Cenizar (~6 s). bossId se ignora.
     tipo 'stop'   : corta lo que suene con fundido de 150 ms (al saltar).
   bossId = pastor | karceron | letea | yarlak | melaria | cenizar. Devuelve true si sono. */
(function () {
  'use strict';
  var A = window.Assets;
  if (!A || A._cine2 || !A.cine) return;
  A._cine2 = true;

  var BOSSES = ['pastor', 'karceron', 'letea', 'yarlak', 'melaria', 'cenizar'];
  function T(t, f0, f1, d, v, o) { var L = { t: t, f: [f0, f1], d: d, v: v }; if (o) for (var k in o) L[k] = o[k]; return L; }
  function N(type, f0, f1, d, v, q, o) { var L = { n: 1, d: d, v: v, flt: { t: type, f: [f0, f1], q: q || 1 } }; if (o) for (var k in o) L[k] = o[k]; return L; }
  function th(f0, f1, d, v, o) { return T('sine', f0, f1, d, v, o || {}); }
  function cat() { var r = []; for (var i = 0; i < arguments.length; i++) r = r.concat(arguments[i]); return r; }
  function hash(n) { var x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); }
  function mtof(m) { return 440 * Math.pow(2, (m - 69) / 12); }
  function bell(f, v, d, dl, o) { o = o || {}; return [th(f, f, d, v, { delay: dl || 0, a: 0.003, send: 1, pan: o.pan }), th(f * 2.76, f * 2.76, d * 0.5, v * 0.3, { delay: dl || 0, a: 0.003, pan: o.pan }), th(f * 5.4, f * 5.4, d * 0.2, v * 0.1, { delay: dl || 0, a: 0.003 })]; }
  function boom(v, dl, f) { f = f || 1; return [th(64 * f, 24, 0.9, 0.9 * v, { delay: dl, a: 0.004 }), th(42 * f, 30, 1.6, 0.5 * v, { delay: dl, a: 0.01 }), N('lowpass', 900, 90, 0.6, 0.3 * v, 0.8, { delay: dl, a: 0.002 })]; }
  function thud(v, dl, f) { f = f || 1; return [th(80 * f, 30, 0.35, 0.8 * v, { delay: dl, a: 0.003 }), N('lowpass', 500, 80, 0.25, 0.3 * v, 0.8, { delay: dl, a: 0.002 })]; }
  function crack(n, t0, span, v, seed) { var r = []; for (var i = 0; i < n; i++) { var h = hash((seed || 1) * 17 + i * 3.7); r.push(N('bandpass', 1500 + h * 4000, 700 + h * 1200, 0.012 + h * 0.025, v * (0.4 + h * 0.6), 5, { delay: t0 + hash(i * 9.1 + (seed || 1)) * span, a: 0.0006 })); } return r; }
  function swell(f0, f1, d, v, dl) { return [th(f0, f1, d, v, { delay: dl || 0, a: d * 0.7, sus: 0.8 }), N('lowpass', 200, 700, d, v * 0.3, 0.8, { delay: dl || 0, a: d * 0.7, sus: 0.8 })]; }
  function heart(dl, v) { return [th(70, 30, 0.2, 0.55 * v, { delay: dl, a: 0.003 }), th(58, 28, 0.2, 0.4 * v, { delay: dl + 0.2, a: 0.003 })]; }

  // ---- Presagio/aparicion (segundos sobre la version larga de 4,5 s; la corta escala los tiempos).
  // Hitos (fracciones de len, como boss.js): aterrizaje ~0.23, rugido 0.51 (2,3 s), la pista de combate entra a 0.69 (3,1 s): despues solo cola baja (<0.1).
  var LEN = 4.5;
  function base(v) { return cat(swell(46, 56, 2.4, 0.3 * v, 0), boom(1.1 * v, 2.3), [N('highpass', 3000, 6000, 0.5, 0.08 * v, 1, { delay: 2.3, a: 0.003 }), th(55, 38, 1.6, 0.1 * v, { delay: 2.8, a: 0.2 }), N('lowpass', 400, 120, 1.4, 0.05 * v, 0.8, { delay: 2.8, a: 0.3 })]); }
  var APPEAR = {
    pastor: function () { return cat(base(1),   // cae del cielo: silbido de caida, impacto, zampona disonante (2.a menor) y cencerros torcidos
      [N('bandpass', 1800, 180, 1.0, 0.16, 1.5, { a: 0.9 }), T('sawtooth', 220, 60, 1.0, 0.03, { a: 0.9, flt: { t: 'lowpass', f: [1600, 200], q: 1 } })], thud(1.1, 1.0, 0.9),
      [T('sawtooth', 146.8, 146.8, 1.9, 0.05, { delay: 0.4, a: 0.7, sus: 0.7, vib: [5, 22], flt: { t: 'lowpass', f: [500, 900], q: 2 } }), T('sawtooth', 155.6, 155.6 * 0.99, 1.9, 0.05, { delay: 0.4, a: 0.7, sus: 0.7, vib: [4.2, 28], flt: { t: 'lowpass', f: [500, 900], q: 2 } }), T('sawtooth', 293, 277, 0.8, 0.05, { delay: 2.3, a: 0.05, flt: { t: 'bandpass', f: [900, 500], q: 3 } })],
      bell(196, 0.07, 1.6, 1.2), bell(207.7, 0.06, 1.6, 1.7), bell(185, 0.06, 1.6, 2.1), crack(3, 1.0, 0.3, 0.05, 2)); },
    karceron: function () { return cat(base(1.1),   // surge del suelo: rumor, lava, cadenas, yunque
      [N('lowpass', 120, 500, 2.3, 0.25, 1, { a: 1.6, sus: 0.8 }), th(35, 70, 2.3, 0.3, { a: 1.5, sus: 0.8 })], crack(14, 0.3, 1.9, 0.08, 3),
      [th(90, 140, 0.18, 0.12, { delay: 0.7, a: 0.01 }), th(110, 70, 0.2, 0.12, { delay: 1.15, a: 0.01 }), th(80, 130, 0.2, 0.12, { delay: 1.6, a: 0.01 })],
      [0.95, 1.35, 1.7, 2.0].reduce(function (r, t, i) { var f = 1250 + i * 170; return r.concat([th(f, f, 0.35, 0.06, { delay: t, a: 0.001, send: 1 }), th(f * 1.51, f * 1.51, 0.2, 0.04, { delay: t, a: 0.001 }), N('bandpass', 4200, 2600, 0.05, 0.05, 6, { delay: t, a: 0.0008 })]); }, []),
      [th(220, 220, 1.4, 0.06, { delay: 2.3, a: 0.002, send: 1 }), th(587, 587, 1.0, 0.04, { delay: 2.3, a: 0.002 }), T('sawtooth', 110, 55, 0.7, 0.07, { delay: 2.3, a: 0.01, flt: { t: 'lowpass', f: [1200, 150], q: 2 } })]); },
    letea: function () { return cat(base(0.9),   // tres cabezas emergen una tras otra (notas de un acorde disminuido), chapoteo y siseo
      [N('bandpass', 400, 1200, 1.6, 0.06, 1.5, { a: 0.8 })],
      [0.2, 0.55, 0.8, 1.7, 2.0].reduce(function (r, t, i) { return r.concat([th(1100 - i * 90, 380, 0.14, 0.07, { delay: t, a: 0.002, send: 1 })]); }, []),
      [0.9, 1.2, 1.5].reduce(function (r, t, i) { var f = [220, 261.6, 311.1][i] * (i === 2 ? 1 : 1); return r.concat([N('bandpass', 700, 300, 0.4, 0.12, 1.2, { delay: t, a: 0.01 }), T('triangle', f, f * 0.985, 1.6, 0.06, { delay: t, a: 0.15, vib: [4, 14], send: 1, flt: { t: 'lowpass', f: [900, 500], q: 1 } })], bell(f * 2, 0.04, 1.4, t + 0.05)); }, []),
      [N('highpass', 5000, 3000, 1.3, 0.08, 1, { delay: 2.3, a: 0.05 }), T('sawtooth', 700, 380, 1.2, 0.025, { delay: 2.3, a: 0.05, flt: { t: 'bandpass', f: [2500, 1200], q: 4 } })]); },
    yarlak: function () { return cat(base(1),   // ventisca, tres pasos pesados con crujido de nieve, vaho y campana de hielo
      [N('bandpass', 300, 900, 2.4, 0.18, 1.2, { a: 1.4, sus: 0.8 }), N('highpass', 1500, 3500, 2.4, 0.05, 1, { a: 1.4, sus: 0.8 })],
      thud(0.9, 0.8), thud(1.05, 1.4), thud(1.25, 2.0, 0.85), [0.8, 1.4, 2.0].reduce(function (r, t) { return r.concat([N('highpass', 2000, 800, 0.3, 0.1, 1, { delay: t + 0.03, a: 0.004 })]); }, []),
      [N('bandpass', 600, 350, 0.7, 0.08, 2, { delay: 1.05, a: 0.3 }), N('bandpass', 600, 350, 0.7, 0.09, 2, { delay: 1.75, a: 0.3 })],
      bell(523.3, 0.05, 2.0, 2.3), bell(784, 0.03, 2.0, 2.45)); },
    melaria: function () { return cat(base(0.9),   // enjambre: zumbido en estereo que crece, cera que gotea, descenso
      [T('sawtooth', 180, 230, 2.4, 0.04, { a: 1.2, sus: 0.8, pan: -0.6, trem: [34, 0.7], vib: [6, 30], flt: { t: 'bandpass', f: [500, 1100], q: 3 } }), T('sawtooth', 188, 250, 2.4, 0.04, { a: 1.2, sus: 0.8, pan: 0.6, trem: [41, 0.7], vib: [7, 30], flt: { t: 'bandpass', f: [500, 1100], q: 3 } }), N('bandpass', 900, 2400, 2.4, 0.08, 4, { a: 1.5, sus: 0.8, trem: [38, 0.8] })],
      [0.6, 1.1, 1.55, 1.9].reduce(function (r, t, i) { return r.concat([th(760 - i * 60, 260, 0.12, 0.08, { delay: t, a: 0.002, send: 1, pan: i % 2 ? 0.5 : -0.5 })]); }, []),
      [T('sawtooth', 320, 90, 0.9, 0.05, { delay: 0.7, a: 0.4, flt: { t: 'lowpass', f: [1500, 300], q: 1 } }), T('sawtooth', 260, 300, 0.7, 0.07, { delay: 2.3, a: 0.02, trem: [30, 0.8], flt: { t: 'bandpass', f: [900, 600], q: 3 } })]); },
    cenizar: function () { return cat(base(1.2),   // 5 chispas = 5 notas (Mi Sol La Do Mi) sobre un rescoldo que respira; la 5.a es el rugido
      [N('bandpass', 250, 900, 2.3, 0.1, 1, { a: 1.5, sus: 0.8 }), th(41.2, 41.2, 3.2, 0.2, { a: 1.4, sus: 0.8 })],
      [0.5, 0.95, 1.4, 1.85].reduce(function (r, t, i) { return r.concat(bell(mtof([64, 67, 69, 72][i] + 12), 0.07 + i * 0.01, 1.8, t), crack(2, t, 0.05, 0.1, i + 5)); }, []),
      bell(mtof(88), 0.09, 2.4, 2.3),
      [164.8, 196, 220, 261.6].map(function (f) { return T('sawtooth', f, f * 1.01, 1.5, 0.03, { delay: 2.3, a: 0.05, flt: { t: 'lowpass', f: [1400, 300], q: 1 } }); }), crack(10, 2.3, 0.8, 0.08, 11)); }
  };

  // ---- Cartel con el nombre: golpe + tono propio del jefe (pitch fino por jefe) + cola
  var PLATE = {
    pastor: function () { return cat(boom(0.8, 0), bell(196, 0.1, 1.4, 0.01), bell(207.7, 0.05, 1.2, 0.01), [T('sawtooth', 293, 277, 0.5, 0.04, { delay: 0.02, a: 0.02, flt: { t: 'bandpass', f: [900, 500], q: 3 } })]); },
    karceron: function () { return cat(boom(1.1, 0, 0.8), [th(220, 220, 1.2, 0.07, { a: 0.002, send: 1 }), th(587, 587, 0.9, 0.05, { a: 0.002 }), th(1250, 1250, 0.5, 0.04, { a: 0.001 }), N('bandpass', 4000, 2200, 0.06, 0.06, 6, { a: 0.0008 })]); },
    letea: function () { return cat(boom(0.6, 0, 1.2), [N('bandpass', 800, 250, 0.35, 0.12, 1.2, { a: 0.01 }), th(1100, 380, 0.15, 0.08, { delay: 0.05, a: 0.002, send: 1 })], bell(261.6, 0.09, 1.5, 0.02), bell(311.1, 0.06, 1.5, 0.12), bell(220, 0.06, 1.6, 0.22)); },
    yarlak: function () { return cat(boom(0.9, 0, 0.9), [N('highpass', 2500, 900, 0.3, 0.1, 1, { a: 0.003 }), N('bandpass', 500, 300, 1.2, 0.07, 2, { delay: 0.1, a: 0.3 })], bell(523.3, 0.09, 2.0, 0.02), bell(784, 0.05, 2.0, 0.1)); },
    melaria: function () { return cat(boom(0.8, 0, 1.1), [T('sawtooth', 220, 260, 0.6, 0.06, { a: 0.02, pan: -0.5, trem: [36, 0.7], flt: { t: 'bandpass', f: [900, 600], q: 3 } }), T('sawtooth', 233, 277, 0.6, 0.06, { a: 0.02, pan: 0.5, trem: [43, 0.7], flt: { t: 'bandpass', f: [900, 600], q: 3 } }), th(700, 240, 0.15, 0.07, { delay: 0.1, a: 0.002, send: 1 })], bell(233, 0.06, 1.4, 0.02)); },
    cenizar: function () { return cat(boom(1.3, 0, 0.85), bell(mtof(64), 0.1, 2.4, 0.01), bell(mtof(67), 0.07, 2.4, 0.01), bell(mtof(69), 0.06, 2.4, 0.01), bell(mtof(76), 0.06, 2.6, 0.2), [N('highpass', 3500, 7000, 0.5, 0.09, 1, { a: 0.003 }), th(41.2, 41.2, 2.2, 0.15, { a: 0.3 })], crack(10, 0.1, 0.9, 0.08, 13)); }
  };
  var PLATE_FREQ = { pastor: 1, karceron: 1, letea: 1, yarlak: 1, melaria: 1, cenizar: 1 };

  // ---- Prerrollo de Cenizar (6 s): 0-2 silencio y latido lejano; 2-4 cinco grietas (timbre de cada jefe) con latido y crescendo; 4,0 succion y corte a negro; 4,1 golpe de cartel; cola que muere a 6 s (la intro estandar entra despues)
  function preroll() {
    var L = cat(
      [N('lowpass', 150, 260, 2.2, 0.05, 0.8, { a: 1.6 }), th(36, 38, 2.2, 0.06, { a: 1.6 })],      // aire del Hogar Quemado
      heart(0.9, 0.35), heart(1.9, 0.5),
      [N('lowpass', 300, 1800, 2.0, 0.12, 1, { delay: 2.0, a: 1.6 }), th(41.2, 49, 2.0, 0.15, { delay: 2.0, a: 1.5 })],   // crescendo del cráter
      heart(2.6, 0.6), heart(3.1, 0.7), heart(3.5, 0.8), heart(3.8, 0.9));
    var T0 = 2.0, ST = 0.38;
    // grietas en orden de la intro: Pastor, Karceron, Letea, Yarlak, Melaria
    L.push(T('sawtooth', 146.8, 150, 0.7, 0.06, { delay: T0, a: 0.05, vib: [5, 25], flt: { t: 'bandpass', f: [900, 500], q: 3 } }), T('sawtooth', 155.6, 150, 0.7, 0.06, { delay: T0, a: 0.05, flt: { t: 'bandpass', f: [900, 500], q: 3 } }), N('bandpass', 2500, 900, 0.1, 0.12, 5, { delay: T0, a: 0.001 }));
    L.push(th(220, 220, 0.8, 0.08, { delay: T0 + ST, a: 0.002, send: 1 }), th(587, 587, 0.5, 0.05, { delay: T0 + ST, a: 0.001 }), th(1250, 1250, 0.3, 0.05, { delay: T0 + ST, a: 0.001 }), N('lowpass', 500, 90, 0.3, 0.2, 1, { delay: T0 + ST, a: 0.002 }), N('bandpass', 3500, 1800, 0.08, 0.1, 5, { delay: T0 + ST, a: 0.001 }));
    L.push(th(1100, 380, 0.14, 0.09, { delay: T0 + 2 * ST, a: 0.002, send: 1 }), T('triangle', 261.6, 258, 0.8, 0.07, { delay: T0 + 2 * ST, a: 0.1, send: 1, flt: { t: 'lowpass', f: [900, 500], q: 1 } }), N('bandpass', 700, 300, 0.25, 0.1, 1.2, { delay: T0 + 2 * ST, a: 0.01 }));
    L.push.apply(L, bell(523.3, 0.07, 1.4, T0 + 3 * ST)); L.push(N('highpass', 2500, 900, 0.25, 0.1, 1, { delay: T0 + 3 * ST, a: 0.003 }), N('bandpass', 500, 300, 0.7, 0.05, 2, { delay: T0 + 3 * ST, a: 0.2 }));
    L.push(T('sawtooth', 190, 230, 0.8, 0.05, { delay: T0 + 4 * ST, a: 0.1, pan: -0.5, trem: [36, 0.7], flt: { t: 'bandpass', f: [600, 1000], q: 3 } }), T('sawtooth', 200, 240, 0.8, 0.05, { delay: T0 + 4 * ST, a: 0.1, pan: 0.5, trem: [43, 0.7], flt: { t: 'bandpass', f: [600, 1000], q: 3 } }), th(700, 260, 0.12, 0.08, { delay: T0 + 4 * ST, a: 0.002, send: 1 }));
    for (var i = 0; i < 5; i++) L.push.apply(L, crack(3, T0 + i * ST, 0.12, 0.08, 20 + i));   // chisporroteo de cada grieta
    // 3,9: sucesion del cráter (barrido inverso) y corte a negro; 4,1 cartel
    L.push(N('bandpass', 300, 5000, 0.4, 0.2, 1.5, { delay: 3.5, a: 0.38 }), T('sawtooth', 60, 480, 0.4, 0.05, { delay: 3.5, a: 0.38, flt: { t: 'lowpass', f: [300, 3000], q: 2 } }));
    L.push.apply(L, PLATE.cenizar().map(function (l) { var c = {}; for (var k in l) c[k] = l[k]; c.delay = (l.delay || 0) + 4.1; return c; }));
    L.push(th(55, 40, 1.8, 0.08, { delay: 4.4, a: 0.3 }));
    return L;
  }

  // ---- escalado (version corta) y definiciones
  function scaled(L, len) {
    var s = len / LEN, dk = 0.35 + 0.65 * s;
    return L.map(function (l) { var c = {}; for (var k in l) c[k] = l[k]; c.delay = (l.delay || 0) * s; if (!c.n || c.d > 0.3) { c.d = Math.max(0.03, l.d * (l.d > 0.5 ? dk : 1)); if (l.a != null && l.a > 0.05) c.a = l.a * dk; } c.d = Math.max(0.03, Math.min(c.d, len * 1.2 - c.delay)); return c; });
  }
  function dur(L) { var m = 0; L.forEach(function (l) { m = Math.max(m, (l.delay || 0) + l.d); }); return m; }
  var DEFS = {};
  BOSSES.forEach(function (id) {
    DEFS['cine2_appear_' + id + '_long'] = { len: 4.5, L: APPEAR[id]().filter(Boolean) };
    DEFS['cine2_appear_' + id + '_short'] = { len: 1.6, L: scaled(APPEAR[id]().filter(Boolean), 1.6) };
    DEFS['cine2_plate_' + id] = { len: 1.4, L: PLATE[id]() };
  });
  DEFS.cine2_preroll_cenizar = { len: 6, L: preroll() };
  var names = Object.keys(DEFS);

  // ---------------- motor propio (como sfx_cine)
  var ac = null, chain = null, muted = false, lastT = {}, buses = [];
  function mkNoise(c, secs) { var n = Math.floor(c.sampleRate * (secs || 1)), b = c.createBuffer(1, n, c.sampleRate), d = b.getChannelData(0); for (var i = 0; i < n; i++) d[i] = Math.random() * 2 - 1; return b; }
  function mkChain(c, dest, master) {
    var k = { noise: mkNoise(c), g: c.createGain(), comp: c.createDynamicsCompressor(), echoIn: c.createGain() };
    k.g.gain.value = master; k.g.connect(k.comp); k.comp.connect(dest);
    var dl = c.createDelay(1.5), fb = c.createGain(), lp = c.createBiquadFilter();
    dl.delayTime.value = 0.4; fb.gain.value = 0.4; lp.type = 'lowpass'; lp.frequency.value = 2000; k.echoIn.gain.value = 0.5;
    k.echoIn.connect(dl); dl.connect(lp); lp.connect(fb); fb.connect(dl); lp.connect(k.g);
    return k;
  }
  function layer(L, st, pitch, vm, c, k, dest) {
    var d = L.d, end = st + d, g = c.createGain(), a = L.a == null ? 0.003 : L.a, pk = Math.max(L.v * vm, 0.0002), src, node;
    if (a > d * 0.95) a = d * 0.95;
    g.gain.setValueAtTime(0.0001, st); g.gain.linearRampToValueAtTime(pk, st + a);
    if (L.sus) g.gain.setValueAtTime(pk, st + Math.max(a, d * L.sus));
    g.gain.exponentialRampToValueAtTime(0.0001, end);
    if (L.n) { src = c.createBufferSource(); src.buffer = k.noise; src.loop = true; src.start(st, Math.random() * 0.4); }
    else {
      src = c.createOscillator(); src.type = L.t; src.frequency.setValueAtTime(L.f[0] * pitch, st);
      if (L.f[1] !== L.f[0]) src.frequency.exponentialRampToValueAtTime(Math.max(18, L.f[1] * pitch), end);
      if (L.vib) { var lfo = c.createOscillator(), lg = c.createGain(); lfo.frequency.value = L.vib[0]; lg.gain.value = L.vib[1]; lfo.connect(lg); lg.connect(src.detune); lfo.start(st); lfo.stop(end + 0.05); }
      src.start(st);
    }
    node = src;
    if (L.flt) {
      var bq = c.createBiquadFilter(); bq.type = L.flt.t; bq.Q.value = L.flt.q || 1; bq.frequency.setValueAtTime(L.flt.f[0], st);
      if (L.flt.f[1] !== L.flt.f[0]) bq.frequency.exponentialRampToValueAtTime(L.flt.f[1], end);
      node.connect(bq); node = bq;
    }
    node.connect(g); node = g;
    if (L.trem) {
      var tg = c.createGain(), tl = c.createOscillator(), tlg = c.createGain(), dep = Math.min(0.95, L.trem[1]);
      tg.gain.value = 1 - dep * 0.5; tl.frequency.value = L.trem[0]; tlg.gain.value = dep * 0.5; tl.connect(tlg); tlg.connect(tg.gain); tl.start(st); tl.stop(end + 0.05);
      g.connect(tg); node = tg;
    }
    if (L.pan && c.createStereoPanner) { var pn = c.createStereoPanner(); pn.pan.value = L.pan; node.connect(pn); node = pn; }
    node.connect(dest); if (L.send) node.connect(k.echoIn); src.stop(end + 0.03);
  }
  function build(def, st, pitch, vm, c, k, bus) { for (var i = 0; i < def.L.length; i++) layer(def.L[i], st + (def.L[i].delay || 0), pitch, vm * (1 + (Math.random() - 0.5) * 0.08), c, k, bus || k.g); }
  function ensure() {
    if (ac) return ac;
    var AC = window.AudioContext || window.webkitAudioContext; if (!AC) return null;
    try { ac = new AC(); chain = mkChain(ac, ac.destination, 0.7); } catch (e) { ac = null; }
    return ac;
  }
  function applyVol() { if (!ac) return; var v = A.getVolume(); chain.g.gain.value = muted ? 0 : v.master * v.sfx * 0.85; }
  var origMute = A.setMuted, origVol = A.setVolume, origSusp = A.suspendAudio, origRes = A.resumeAudio;
  A.setMuted = function (m) { muted = !!m; origMute(m); applyVol(); };
  A.setVolume = function (v) { origVol(v); applyVol(); };
  A.suspendAudio = function () { origSusp(); try { if (ac && ac.state === 'running') ac.suspend(); } catch (e) { /* audio */ } };
  A.resumeAudio = function () { origRes(); try { if (ac && ac.state !== 'running') ac.resume(); } catch (e) { /* audio */ } };

  function stopAll() {
    if (!ac) return; var t = ac.currentTime;
    buses.forEach(function (b) { try { b.g.gain.cancelScheduledValues(t); b.g.gain.setValueAtTime(b.g.gain.value, t); b.g.gain.linearRampToValueAtTime(0.0001, t + 0.15); } catch (e) { /* audio */ } });
    buses = [];
  }
  function play(name, pitch, vol) {
    var def = DEFS[name]; if (!def || muted || !ensure()) return false;
    if (ac.state !== 'running') { try { ac.resume(); } catch (e) { /* audio */ } }
    var now = performance.now(); if (now - (lastT[name] || 0) < 300) return false; lastT[name] = now;
    applyVol();
    var bus = ac.createGain(); bus.gain.value = 1; bus.connect(chain.g);
    var rec = { g: bus }; buses.push(rec); if (buses.length > 6) buses.shift();
    build(def, ac.currentTime + 0.005, pitch || 1, vol == null ? 1 : vol, ac, chain, bus);
    // el eco de la cadena alimenta chain.g directamente: se acota en el tiempo por la propia cola (max ~2 s)
    return true;
  }
  function cine2(tipo, bossId, opts, pitch) {
    try {
      if (tipo === 'stop') { stopAll(); return true; }
      pitch = +pitch > 0 ? +pitch : 1;
      var id = BOSSES.indexOf(bossId) >= 0 ? bossId : 'pastor', short = !!(opts && opts.short);
      if (tipo === 'appear') return play('cine2_appear_' + id + (short ? '_short' : '_long'), pitch, 1);
      if (tipo === 'plate') return play('cine2_plate_' + id, pitch * PLATE_FREQ[id], 1);
      if (tipo === 'preroll') return play('cine2_preroll_cenizar', pitch, 1);
    } catch (e) { /* audio */ }
    return false;
  }
  var S = window.G && window.G.Snd;
  if (S) S.cine2 = cine2;
  A.cine2 = cine2;
  A.sfxCine2 = {}; names.forEach(function (n) { A.sfxCine2[n] = { fam: 'cine2', len: DEFS[n].len, dur: dur(DEFS[n].L) }; });

  A.renderSfx = (function (orig) {
    return function (name, o) {
      var def = DEFS[name]; if (!def) return orig.apply(this, arguments);
      var OC = window.OfflineAudioContext || window.webkitOfflineAudioContext;
      if (!OC) return Promise.reject(new Error('OfflineAudioContext no disponible'));
      var oc = new OC(2, Math.ceil((Math.max(def.len, dur(def.L)) + 1.5) * 44100), 44100), k = mkChain(oc, oc.destination, 1);
      build(def, 0.005, (o && o.pitch) || 1, 1, oc, k); return oc.startRendering();
    };
  })(A.renderSfx);
})();
