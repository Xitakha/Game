/* sfx_cine3.js - Audio del cierre v9 (FASE 3, DESIGN-v9-cinematicas.md sec. 6 y 8). Script clasico; cargar DESPUES de sfx_cine2.js (encadena Assets.music como sfx_cine.js).
   Solo audio procedural (WebAudio), contexto propio que sigue desbloqueo, mute, volumen y suspend de Assets. No usa G.rng ni toca la simulacion. Tono oscuro con esperanza al final.
   Pistas: 'cine_epilogo' (35 s, de ceniza a calidez; despues queda un lecho suave) y 'cine_creditos' (25,6 s con cierre; despues queda un lecho suave).
   SFX: G.Snd.cine3(tipo, arg, pitch)  tipo = victory | fire | village | blip | stop   (ver ASSETS_API.md, seccion "Audio del cierre v9"). */
(function () {
  'use strict';
  var A = window.Assets;
  if (!A || A._cine3 || !A.music) return;
  A._cine3 = true;

  function T(t, f0, f1, d, v, o) { var L = { t: t, f: [f0, f1], d: d, v: v }; if (o) for (var k in o) L[k] = o[k]; return L; }
  function N(type, f0, f1, d, v, q, o) { var L = { n: 1, d: d, v: v, flt: { t: type, f: [f0, f1], q: q || 1 } }; if (o) for (var k in o) L[k] = o[k]; return L; }
  function th(f0, f1, d, v, o) { return T('sine', f0, f1, d, v, o || {}); }
  function cat() { var r = []; for (var i = 0; i < arguments.length; i++) r = r.concat(arguments[i]); return r; }
  function hash(n) { var x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); }
  function mtof(m) { return 440 * Math.pow(2, (m - 69) / 12); }
  function bell(f, v, d, dl, o) { o = o || {}; return [th(f, f, d, v, { delay: dl || 0, a: 0.003, send: o.send == null ? 1 : o.send }), th(f * 2.76, f * 2.76, d * 0.5, v * 0.3, { delay: dl || 0, a: 0.003 }), th(f * 5.4, f * 5.4, d * 0.2, v * 0.1, { delay: dl || 0, a: 0.003 })]; }
  function pad(f, v, d, dl, a) { return [T('triangle', f, f * 1.004, d, v, { delay: dl || 0, a: a == null ? d * 0.35 : a, sus: 0.7, vib: [3.2, 10], flt: { t: 'lowpass', f: [900, 650], q: 1 }, send: 1 })]; }
  function crack(n, t0, span, v, seed) { var r = []; for (var i = 0; i < n; i++) { var h = hash((seed || 1) * 17 + i * 3.7); r.push(N('bandpass', 1500 + h * 4000, 700 + h * 1200, 0.012 + h * 0.025, v * (0.4 + h * 0.6), 5, { delay: t0 + hash(i * 9.1 + (seed || 1)) * span, a: 0.0006 })); } return r; }
  function heart(dl, v) { return [th(66, 30, 0.22, 0.5 * v, { delay: dl, a: 0.004 }), th(56, 28, 0.2, 0.36 * v, { delay: dl + 0.22, a: 0.004 })]; }

  // ---------------- SFX
  var NOTE = { e4: 64, g4: 67, gs4: 68, b4: 71, e5: 76, gs5: 80, b5: 83, e6: 88, fs5: 78, a5: 81, cs6: 85 };
  function hope(v) { return cat(bell(mtof(NOTE.e5), 0.1 * v, 2.2, 0), bell(mtof(NOTE.gs5), 0.07 * v, 2.2, 0.01), bell(mtof(NOTE.b5), 0.06 * v, 2.2, 0.02)); }
  var VIC = cat(   // victoria sobre Cenizar (6,0 s): latido, vacio que respira, notas de caja de musica Mi-Si-(Sol natural -> Sol#: llega la esperanza) y acorde de Mi mayor con cola que muere a 6 s
    heart(0.0, 0.7),
    [th(41.2, 41.2, 5.6, 0.2, { delay: 0.1, a: 2.2, sus: 0.5 }), N('lowpass', 250, 600, 5, 0.04, 0.8, { delay: 0.2, a: 2.2, sus: 0.5 })],
    bell(mtof(64), 0.1, 2.4, 0.6), bell(mtof(71), 0.08, 2.4, 1.5), bell(mtof(67), 0.07, 2.2, 2.4),   // E4, B4, G4 (menor: la herida)
    bell(mtof(68), 0.09, 2.4, 3.1), bell(mtof(76), 0.08, 2.2, 3.5),   // G#4 (mayor: la esperanza) y E5
    pad(mtof(52), 0.04, 2.4, 3.0, 1.2), pad(mtof(56), 0.035, 2.4, 3.0, 1.2), pad(mtof(59), 0.035, 2.4, 3.0, 1.2),   // sostenido mayor suave hasta ~5,4 s
    bell(mtof(88), 0.04, 1.8, 3.9, { send: 0 }), crack(5, 3.0, 1.2, 0.04, 31), crack(3, 0.8, 1.6, 0.03, 32));
  var FIRE = cat(   // reencendido del fuego (4,2 s): chispa de pedernal, brasa que respira, rugido calido que sube, crepitar creciente, campana mansa
    [N('bandpass', 4200, 2800, 0.05, 0.12, 6, { a: 0.0008 }), th(1800, 900, 0.1, 0.05, { a: 0.001 })],
    [N('bandpass', 250, 1800, 1.8, 0.1, 1.2, { delay: 0.3, a: 1.4 }), th(80, 110, 1.8, 0.1, { delay: 0.3, a: 1.4 }), N('lowpass', 300, 1500, 2.2, 0.09, 0.8, { delay: 0.5, a: 1.5, sus: 0.7 })],
    [th(41.2, 41.2, 3.6, 0.14, { delay: 0.8, a: 1.2, sus: 0.6 }), T('triangle', 164.8, 165.5, 3, 0.04, { delay: 1.2, a: 1.2, sus: 0.7, flt: { t: 'lowpass', f: [500, 900], q: 1 }, send: 1 })],
    crack(4, 0.2, 0.6, 0.06, 41), crack(10, 0.9, 1.6, 0.08, 42), crack(14, 2.0, 1.8, 0.07, 43),
    [th(110, 55, 0.3, 0.3, { delay: 1.6, a: 0.004 }), N('highpass', 3500, 6500, 0.35, 0.05, 1, { delay: 1.6, a: 0.003 })],   // el fuego prende
    bell(mtof(76), 0.07, 2.2, 1.7), bell(mtof(80), 0.05, 2.0, 1.95), bell(mtof(83), 0.04, 1.9, 2.2));
  // nivel de aldea 1..6: 1,5 s. Cada nivel anade una nota/capa; 1-2 aun con matiz menor, 3+ mayor
  var VSCALE = [[64, 71], [64, 67, 71], [64, 68, 71, 76], [64, 68, 71, 76, 80], [64, 68, 71, 76, 80, 83], [64, 68, 71, 76, 80, 83, 88]];
  function village(lv) {
    var sc = VSCALE[lv - 1], r = [], sp = lv < 6 ? 0.1 : 0.085;
    sc.forEach(function (m, i) { r.push.apply(r, bell(mtof(m + 12), 0.075 + lv * 0.004, 0.9 + (i === sc.length - 1 ? 0.3 : 0), i * sp, { send: 0 })); });
    r.push(th(mtof(40), mtof(40), 1.2, 0.1 + lv * 0.02, { a: 0.02 }));   // bordon de Mi
    r.push.apply(r, crack(2 + lv, 0, 0.5 + lv * 0.1, 0.05, 50 + lv));
    if (lv >= 3) r.push.apply(r, pad(mtof(52), 0.03 + lv * 0.004, 1.1, 0.1, 0.25).map(function (L) { L.send = 0; return L; }));
    if (lv >= 4) r.push(th(mtof(56), mtof(56), 1.3, 0.03, { delay: 0.2, a: 0.25 }), th(mtof(59), mtof(59), 1.3, 0.03, { delay: 0.2, a: 0.25 }));
    if (lv >= 5) r.push(N('bandpass', 400, 1600, 0.9, 0.06, 1.2, { delay: 0.1, a: 0.6 }));
    if (lv >= 6) r.push(th(90, 40, 0.3, 0.35, { delay: 0.55, a: 0.004 }), N('highpass', 4500, 8000, 0.4, 0.05, 1, { delay: 0.55, a: 0.003 }), th(mtof(64), mtof(64), 1.2, 0.04, { delay: 0.6, a: 0.05 }));
    return r;
  }
  var DEFS = {
    cine3_victory: { len: 6, min: 1500, L: VIC },
    cine3_fire: { len: 4.2, min: 1000, L: FIRE },
    cine3_blip_carapa: { len: 0.1, min: 28, L: [   // Carapa: yunque pequeno, metalico y claro
      T('triangle', 880, 840, 0.07, 0.1, { a: 0.001, flt: { t: 'lowpass', f: [4500, 2500], q: 1 } }), th(880 * 2.76, 880 * 2.76, 0.05, 0.04, { a: 0.001 }), N('bandpass', 5200, 3800, 0.015, 0.05, 6, { a: 0.0005 })] },
    cine3_blip_rufo: { len: 0.05, min: 20, L: [   // Rufo: rapido y charlatan, cuadrada aguda y corta
      T('square', 520, 600, 0.03, 0.07, { a: 0.001, flt: { t: 'lowpass', f: [3200, 1800], q: 1 } }), N('bandpass', 3400, 2400, 0.012, 0.04, 4, { a: 0.0005 })] }
  };
  for (var lv = 1; lv <= 6; lv++) DEFS['cine3_village_' + lv] = { len: 1.5, min: 400, L: village(lv) };
  Object.keys(DEFS).forEach(function (n) { DEFS[n].fam = 'cine3'; });
  var names = Object.keys(DEFS);
  function dur(def) { var m = 0; def.L.forEach(function (L) { m = Math.max(m, (L.delay || 0) + L.d); }); return m; }

  // ---------------- motor propio
  var ac = null, chain = null, muted = false, lastT = {}, buses = [], playing = false;
  function mkNoise(c, secs) { var n = Math.floor(c.sampleRate * (secs || 1)), b = c.createBuffer(1, n, c.sampleRate), d = b.getChannelData(0); for (var i = 0; i < n; i++) d[i] = Math.random() * 2 - 1; return b; }
  function echo(c, into, time, fbk, cut) {
    var inn = c.createGain(), dl = c.createDelay(1.5), fb = c.createGain(), lp = c.createBiquadFilter();
    dl.delayTime.value = time; fb.gain.value = fbk; lp.type = 'lowpass'; lp.frequency.value = cut; inn.gain.value = 0.5;
    inn.connect(dl); dl.connect(lp); lp.connect(fb); fb.connect(dl); lp.connect(into); return inn;
  }
  function mkChain(c, dest, master) {   // g = SFX, mg = musica; dos ecos separados (el de SFX con realimentacion corta para que la cola muera pronto)
    var k = { noise: mkNoise(c), g: c.createGain(), comp: c.createDynamicsCompressor(), mg: c.createGain() };
    k.g.gain.value = master; k.g.connect(k.comp); k.comp.connect(dest); k.mg.gain.value = 0; k.mg.connect(k.comp);
    k.echoS = echo(c, k.g, 0.38, 0.32, 2200); k.echoM = echo(c, k.mg, 0.45, 0.42, 2200);
    return k;
  }
  function layer(L, st, pitch, vm, c, k, dest, send) {
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
    if (L.pan && c.createStereoPanner) { var pn = c.createStereoPanner(); pn.pan.value = L.pan; node.connect(pn); node = pn; }
    node.connect(dest || k.g); if (send) node.connect(dest === k.mg ? k.echoM : k.echoS); src.stop(end + 0.03);
  }
  function build(def, st, pitch, vm, c, k, bus) { for (var i = 0; i < def.L.length; i++) layer(def.L[i], st + (def.L[i].delay || 0), pitch, vm * (1 + (Math.random() - 0.5) * 0.08), c, k, bus || k.g, def.L[i].send); }
  function ensure() {
    if (ac) return ac;
    var AC = window.AudioContext || window.webkitAudioContext; if (!AC) return null;
    try { ac = new AC(); chain = mkChain(ac, ac.destination, 0.7); } catch (e) { ac = null; }
    return ac;
  }
  function applyVol() {
    if (!ac) return; var v = A.getVolume();
    chain.g.gain.value = muted ? 0 : v.master * v.sfx * 0.85;
    chain.mg.gain.value = muted || !playing ? 0 : v.master * v.music;
  }
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
    if (ac.state !== 'running') { try { ac.resume(); } catch (e) { /* audio */ } if (name.indexOf('blip') > 0) return false; }
    var now = performance.now(); if (now - (lastT[name] || 0) < def.min) return false; lastT[name] = now;
    applyVol();
    var bus = ac.createGain(); bus.gain.value = 1; bus.connect(chain.g);
    if (name.indexOf('blip') < 0) { buses.push({ g: bus }); if (buses.length > 6) buses.shift(); }
    build(def, ac.currentTime + 0.005, pitch || 1, vol == null ? 1 : vol, ac, chain, bus);
    return true;
  }
  function cine3(tipo, arg, pitch) {
    try {
      pitch = +pitch > 0 ? +pitch : 1;
      switch (tipo) {
        case 'stop': stopAll(); return true;
        case 'victory': return play('cine3_victory', pitch, 1);
        case 'fire': return play('cine3_fire', pitch, 1);
        case 'village': return play('cine3_village_' + Math.max(1, Math.min(6, Math.round(+arg) || 1)), pitch, 1);
        case 'blip': return play(arg === 'rufo' ? 'cine3_blip_rufo' : 'cine3_blip_carapa', pitch * (1 + (Math.random() * 2 - 1) * 0.08), 1);
      }
    } catch (e) { /* audio */ }
    return false;
  }
  var S = window.G && window.G.Snd;
  if (S) S.cine3 = cine3;
  A.sfxCine3 = {}; names.forEach(function (n) { A.sfxCine3[n] = { fam: 'cine3', len: DEFS[n].len, min: DEFS[n].min, dur: dur(DEFS[n]) }; });

  // ================= Musica
  // 'cine_epilogo': 60 BPM (semicorchea 0,25 s), 140 pasos = 35 s. 0-16 s ceniza (viento, crepitar escaso, caja de musica que duda en Mi frigio); 16 s = el fuego prende (tema del fuego Mi-Sol#-La-Do#, acordes mayores);
  // 24-35 s crescendo suave (cuerda, octava) y acorde de Mi mayor a 32 s. Despues: lecho de brasas y bordon.
  var EP_LEN = 140, FIRE_STEP = 64;
  var EMEL = [[5, 76, 1], [7, 79, 1], [9, 83, 1], [11, 77, 1], [13, 76, 1.4], [14.5, 71, 1.6],   // ceniza: dudas (Fa natural frigio)
    [16.5, 76, 1], [17.5, 80, 1], [18.5, 81, 1], [19.5, 85, 1.6], [21.5, 83, 1], [22.5, 81, 1], [23.5, 80, 1.6],   // el tema del fuego en mayor
    [25, 76, 1], [26, 80, 1], [27, 83, 1], [28, 88, 1.8], [30, 85, 1], [31, 83, 1]];
  var EPROG = [[16, 40, [0, 4, 7]], [20, 45, [0, 4, 7]], [24, 37, [0, 3, 7]], [28, 47, [0, 4, 7]], [32, 40, [0, 4, 7]]];
  function eStep(step, t, c, k) {
    var sec = step * 0.25, s16 = step % 16, fire = step >= FIRE_STEP, warm = Math.max(0, Math.min(1, (sec - 16) / 19)), tail = step >= EP_LEN, i;
    function mv(L, send, v) { layer(L, t + (L.delay || 0), 1, v == null ? 1 : v, c, k, k.mg, send); }
    if (!fire && s16 === 0) mv(N('lowpass', 220 + sec * 10, 380 + sec * 12, 4.3, 0.035 + sec * 0.0015, 0.8, { a: 2, sus: 0.6 }));   // viento sobre las cenizas
    if (!fire && sec >= 6 && s16 === 0) mv(th(41.2, 41.2, 4.3, 0.04 + (sec - 6) * 0.006, { a: 2.2, sus: 0.7 }));   // bordon apenas audible que crece
    if (step === FIRE_STEP) { mv(N('bandpass', 250, 1800, 2.2, 0.1, 1.2, { a: 1.6, sus: 0.7 })); mv(th(110, 55, 0.3, 0.3, { a: 0.004 })); }
    if (fire && !tail) {
      for (i = 0; i < EPROG.length; i++) if (step === EPROG[i][0] * 4) {
        var P = EPROG[i], root = P[1], len = i === 4 ? 6 : 4.3, vv = 0.8 + warm * 0.6;
        mv(th(mtof(root - 12), mtof(root - 12), len, 0.16 * vv, { a: 0.9, sus: 0.8 }));
        P[2].forEach(function (iv, j) { mv(T('triangle', mtof(root + iv), mtof(root + iv) * (1 + j * 0.003), len, 0.04 * vv, { a: len * 0.35, sus: 0.8, vib: [3, 10], flt: { t: 'lowpass', f: [800, 650], q: 1 } }), true); });
        mv(N('lowpass', 700, 450, len, 0.02 + warm * 0.03, 0.8, { a: len * 0.4, sus: 0.7 }));
        if (sec >= 24) [0, 7].forEach(function (iv, j) { mv(T('sawtooth', mtof(root + 12 + iv), mtof(root + 12 + iv) * 1.006, len, 0.014 + warm * 0.014, { a: len * 0.55, sus: 0.8, vib: [4.5, 14], flt: { t: 'lowpass', f: [700, 1300], q: 1 } }), true); });
      }
    }
    for (i = 0; i < EMEL.length; i++) if (Math.round(EMEL[i][0] * 4) === step) {   // caja de musica
      var f = mtof(EMEL[i][1]), md = EMEL[i][2] + 1.2, mvv = fire ? 1 + warm * 0.5 : 0.8;
      bell(f, 0.07 * mvv, md, 0).forEach(function (L) { mv(L, true); });
      if (sec >= 24 && fire) bell(f / 2, 0.035, md, 0.05).forEach(function (L) { mv(L, true); });
    }
    if (step === 128) {   // acorde final de Mi mayor (32 s)
      [64, 68, 71, 76, 80].forEach(function (m, j) { bell(mtof(m + (j > 2 ? 12 : 0)), 0.06, 4.5, j * 0.06).forEach(function (L) { mv(L, true); }); });
    }
    // crepitar: casi nada antes del fuego, crece con la llama
    var dens = tail ? 0.2 : fire ? 0.22 + warm * 0.3 : 0.05;
    if (hash(step * 3.3 + 11) < dens) mv(N('bandpass', 1800 + hash(step) * 4200, 900 + hash(step + 1) * 900, 0.012 + hash(step + 2) * 0.025, (fire ? 0.05 + warm * 0.07 : 0.03) + hash(step + 4) * 0.05, 5, { delay: hash(step + 9) * 0.2, a: 0.0006 }));
    if (tail && step % 32 === 0) mv(th(41.2, 41.2, 8.2, 0.1, { a: 2, sus: 0.8 }));
    if (tail && step % 16 === 8) mv(T('triangle', 164.8, 164.8, 4.5, 0.025, { a: 1.5, sus: 0.7, flt: { t: 'lowpass', f: [700, 500], q: 1 }, vib: [3, 10] }), true);
    return 0.25;
  }

  // 'cine_creditos': 75 BPM (semicorchea 0,2 s), 8 compases = 25,6 s. Calido y esperanzado: Mi, La, Si, Do#m, Mi, La, Si, Mi. Cierre en Mi mayor en el compas 8 y despues lecho de brasas.
  var CRL = 128, CPROG = [[40, 0], [45, 0], [47, 0], [49, 3], [40, 0], [45, 0], [47, 0], [40, 0]];
  var CPENT = [0, 2, 4, 7, 9, 12, 14, 16];
  function cStepFn(step, t, c, k) {
    var spb = 0.2, bar = Math.floor(step / 16), s = step % 16, tail = step >= CRL, P = CPROG[Math.min(7, bar)], root = P[0], third = P[1] === 3 ? 3 : 4;
    function mv(L, send, v) { layer(L, t + (L.delay || 0), 1, v == null ? 1 : v, c, k, k.mg, send); }
    if (tail) {
      if (step % 32 === 0) mv(th(41.2, 41.2, 8.2, 0.1, { a: 2, sus: 0.8 }));
      if (step % 16 === 8) mv(T('triangle', 164.8, 164.8, 4.5, 0.025, { a: 1.5, sus: 0.7, flt: { t: 'lowpass', f: [700, 500], q: 1 }, vib: [3, 10] }), true);
      if (hash(step * 3.3 + 5) < 0.18) mv(N('bandpass', 1800 + hash(step) * 4200, 1000, 0.012 + hash(step + 2) * 0.02, 0.04 + hash(step + 4) * 0.04, 5, { delay: hash(step + 9) * 0.2, a: 0.0006 }));
      return spb;
    }
    var vv = 0.6 + Math.min(1, bar / 3) * 0.4;
    if (s === 0) {
      mv(th(mtof(root - 12), mtof(root - 12), spb * 16 * 1.05, 0.17 * vv, { a: 0.4, sus: 0.85 }));
      [0, third, 7].forEach(function (iv, j) { mv(T('triangle', mtof(root + iv), mtof(root + iv) * (1 + j * 0.003), spb * 16, 0.04 * vv, { a: 1.0, sus: 0.8, vib: [3, 10], flt: { t: 'lowpass', f: [900, 650], q: 1 } }), true); });
    }
    if (bar >= 1 && s % 8 === 0) mv(th(70, 32, 0.28, 0.32 * vv, { a: 0.004 }));   // latido calido
    if (bar >= 2 && s % 4 === 2) mv(N('highpass', 6500, 8500, 0.04, 0.03, 1, { a: 0.002 }));
    if (s % 2 === 0 && bar >= 1 && bar < 7) {   // arpegio de marimba/campana
      var idx = (s / 2 + bar * 3) % 8, iv2 = idx % 2 && bar % 4 === 3 && P[1] === 3 ? CPENT[idx] - 1 : CPENT[idx], f = mtof(root + 24 + iv2);
      if (hash(step * 1.9 + 2) < 0.82) bell(f, 0.045 + (bar >= 4 ? 0.015 : 0), bar >= 4 ? 1.1 : 0.8, 0).forEach(function (L) { mv(L, true); });
    }
    if (bar >= 4 && bar < 7 && s % 4 === 0) { var mf = mtof(root + 36 + [0, 4, 7, 4][(s / 4) % 4]); mv(T('triangle', mf, mf, 0.5, 0.025, { a: 0.01 }), true); }
    if (bar === 0 && s === 4) bell(mtof(76), 0.06, 2, 0).forEach(function (L) { mv(L, true); });
    if (bar === 7 && s === 0) [64, 68, 71, 76, 80, 83].forEach(function (m, j) { bell(mtof(m), 0.055, 4.5, j * 0.07).forEach(function (L) { mv(L, true); }); });
    if (hash(step * 3.3 + 7) < 0.12) mv(N('bandpass', 1800 + hash(step) * 4200, 1000, 0.015 + hash(step + 2) * 0.02, 0.04 + hash(step + 4) * 0.04, 5, { delay: hash(step + 9) * 0.2, a: 0.0006 }));
    return spb;
  }

  var TRACKS = ['cine_epilogo', 'cine_creditos'];
  var CS = { timer: null, step: 0, next: 0 }, trk = null, want = false;
  var M0 = A.music, p = { start: M0.start, stop: M0.stop, setTrack: M0.setTrack, getTrack: M0.getTrack, tracks: M0.tracks, isPlaying: M0.isPlaying };
  function oneStep(step, t, c, k) { return trk === 'cine_epilogo' ? eStep(step, t, c, k) : cStepFn(step, t, c, k); }
  function cSched() {
    if (!ac || ac.state !== 'running') return;
    while (CS.next < ac.currentTime + 0.2) { CS.next += oneStep(CS.step, CS.next, ac, chain); CS.step++; }
  }
  function cStart() {
    if (playing || !trk || !want) return;
    if (!A.isUnlocked() || !ensure()) { setTimeout(cStart, 400); return; }
    if (ac.state !== 'running') { try { ac.resume(); } catch (e) { /* audio */ } setTimeout(cStart, 300); return; }
    playing = true; CS.step = 0; CS.next = ac.currentTime + 0.1;
    var v = A.getVolume(); chain.mg.gain.cancelScheduledValues(ac.currentTime); chain.mg.gain.setValueAtTime(0.0001, ac.currentTime);
    chain.mg.gain.linearRampToValueAtTime(muted ? 0 : v.master * v.music, ac.currentTime + (trk === 'cine_epilogo' ? 1.5 : 0.8));
    CS.timer = setInterval(cSched, 30);
  }
  function cStop() {
    if (!playing) return; playing = false; clearInterval(CS.timer); CS.timer = null;
    try { chain.mg.gain.cancelScheduledValues(ac.currentTime); chain.mg.gain.setValueAtTime(chain.mg.gain.value, ac.currentTime); chain.mg.gain.linearRampToValueAtTime(0.0001, ac.currentTime + 0.4); } catch (e) { /* audio */ }
  }
  M0.start = function () { want = true; if (trk) cStart(); else p.start(); };
  M0.stop = function () { want = false; cStop(); p.stop(); };
  M0.setTrack = function (name) {
    if (TRACKS.indexOf(name) >= 0) { if (trk === name && playing) return; var was = playing; if (trk) cStop(); else p.stop(); trk = name; if (want) { if (was) setTimeout(cStart, 450); else cStart(); } return; }
    if (trk) { trk = null; cStop(); p.setTrack(name); if (want) p.start(); return; }
    p.setTrack(name);
  };
  M0.getTrack = function () { return trk || p.getTrack(); };
  M0.tracks = function () { return p.tracks().concat(TRACKS); };
  M0.isPlaying = function () { return trk ? playing : p.isPlaying(); };
  A.cineMusicTime3 = function () { return playing ? CS.step * (trk === 'cine_epilogo' ? 0.25 : 0.2) : 0; };   // segundos sonados de la pista actual de cine3 (0 si no suena)

  var origRM = A.renderMusic;
  A.renderMusic = function (o) {
    o = o || {};
    if (TRACKS.indexOf(o.track) < 0) return origRM.apply(this, arguments);
    var OC = window.OfflineAudioContext || window.webkitOfflineAudioContext;
    if (!OC) return Promise.reject(new Error('OfflineAudioContext no disponible'));
    var ep = o.track === 'cine_epilogo', spb = ep ? 0.25 : 0.2, steps = o.steps || (ep ? EP_LEN : CRL) + 12;
    var oc = new OC(2, Math.ceil((steps * spb + 4) * 44100), 44100), k = mkChain(oc, oc.destination, 1);
    k.mg.gain.value = 0.8;
    for (var i = 0; i < steps; i++) { if (ep) eStep(i, 0.05 + i * spb, oc, k); else cStepFn(i, 0.05 + i * spb, oc, k); }
    return oc.startRendering();
  };
  A.renderSfx = (function (orig) {
    return function (name, o) {
      var def = DEFS[name]; if (!def) return orig.apply(this, arguments);
      var OC = window.OfflineAudioContext || window.webkitOfflineAudioContext;
      if (!OC) return Promise.reject(new Error('OfflineAudioContext no disponible'));
      var oc = new OC(2, Math.ceil((Math.max(def.len, dur(def)) + 1.5) * 44100), 44100), k = mkChain(oc, oc.destination, 1);
      build(def, 0.005, (o && o.pitch) || 1, 1, oc, k); return oc.startRendering();
    };
  })(A.renderSfx);
})();
