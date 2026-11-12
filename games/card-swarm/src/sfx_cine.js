/* sfx_cine.js - Audio de las cinematicas v9 (DESIGN-v9-cinematicas.md): intro de cuento junto al fuego, pero oscuro. Script clasico; cargar DESPUES de sfx_cenizar.js (encadena Assets.music como este).
   Solo audio procedural (WebAudio), contexto propio que sigue desbloqueo, mute, volumen y suspend de Assets. No usa G.rng ni toca la simulacion.
   Pistas: Assets.music.setTrack('cine_intro') (~25 s: crepitar, drone, melodia triste, crescendo oscuro; tras 25 s queda un lecho de brasas) y 'cine_title' (bucle suave de 8 compases con brasas).
   SFX: G.Snd.cine(tipo, arg, pitch)  tipo = blip | title | tap | trans | next | spark | skip   (ver ASSETS_API.md, seccion "Audio de cinematicas"). */
(function () {
  'use strict';
  var A = window.Assets;
  if (!A || A._cine) return;
  A._cine = true;

  function T(t, f0, f1, d, v, o) { var L = { t: t, f: [f0, f1], d: d, v: v }; if (o) for (var k in o) L[k] = o[k]; return L; }
  function N(type, f0, f1, d, v, q, o) { var L = { n: 1, d: d, v: v, flt: { t: type, f: [f0, f1], q: q || 1 } }; if (o) for (var k in o) L[k] = o[k]; return L; }
  function th(f0, f1, d, v, o) { return T('sine', f0, f1, d, v, o || {}); }
  function cat() { var r = []; for (var i = 0; i < arguments.length; i++) r = r.concat(arguments[i]); return r; }
  function hash(n) { var x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); }
  function mtof(m) { return 440 * Math.pow(2, (m - 69) / 12); }
  function bell(f, v, d, dl) { return [th(f, f, d, v, { delay: dl || 0, a: 0.003 }), th(f * 2.76, f * 2.76, d * 0.5, v * 0.3, { delay: dl || 0, a: 0.003 }), th(f * 5.4, f * 5.4, d * 0.2, v * 0.1, { delay: dl || 0, a: 0.003 })]; }
  function crackle(n, span, v, dl0, seed) { var r = []; for (var i = 0; i < n; i++) { var h = hash((seed || 1) * 17 + i * 3.7); r.push(N('bandpass', 1800 + h * 4200, 900 + h * 1500, 0.012 + h * 0.02, v * (0.4 + h * 0.6), 5, { delay: (dl0 || 0) + hash(i * 9.1 + (seed || 1)) * span, a: 0.0006 })); } return r; }
  function boom(v, dl, f) { f = f || 1; return [th(64 * f, 24, 0.9, 0.9 * v, { delay: dl, a: 0.004 }), th(42 * f, 30, 1.6, 0.5 * v, { delay: dl, a: 0.01 }), N('lowpass', 900, 90, 0.6, 0.3 * v, 0.8, { delay: dl, a: 0.002 })]; }

  // ---------------- SFX
  var DEFS = {
    cine_blip_lanudo: { min: 28, L: [   // narrador: viejo carnero, tono calido y grave (triangulo + soplo); variar con pitch 0.9-1.15
      T('triangle', 150, 138, 0.06, 0.2, { a: 0.004, flt: { t: 'lowpass', f: [900, 500], q: 1 } }), T('square', 75, 69, 0.06, 0.05, { a: 0.004, flt: { t: 'lowpass', f: [400, 300], q: 1 } }), N('bandpass', 2400, 1500, 0.02, 0.05, 3, { a: 0.0008 })] },
    cine_blip_neutro: { min: 28, L: [   // resto de personajes: tecla de maquina, cuadrada corta
      T('square', 330, 310, 0.04, 0.09, { a: 0.002, flt: { t: 'lowpass', f: [2200, 1200], q: 1 } }), N('bandpass', 3000, 2000, 0.015, 0.06, 4, { a: 0.0006 })] },
    cine_title: { min: 800, L: cat(   // golpe de titulo/logo (~3 s): impacto grave, campana oscura y estallido de brasas
      boom(1.1, 0), [N('highpass', 3500, 7000, 0.5, 0.1, 1, { delay: 0.01, a: 0.002 }), N('bandpass', 400, 120, 1.2, 0.12, 1, { a: 0.01 })], bell(220, 0.1, 2.6, 0.02), bell(329.6, 0.06, 2.4, 0.04), bell(440, 0.05, 2.8, 0.45), crackle(18, 1.8, 0.09, 0.15, 7)) },
    cine_tap: { min: 150, L: cat(   // TOCA PARA JUGAR: confirmacion calida ascendente + chispa
      [th(220, 330, 0.12, 0.2, { a: 0.003 }), th(55, 40, 0.3, 0.4, { a: 0.003 }), T('triangle', 440, 660, 0.18, 0.08, { delay: 0.05, a: 0.004 })], bell(660, 0.07, 0.8, 0.09), bell(990, 0.05, 0.9, 0.17), crackle(5, 0.25, 0.08, 0.05, 3)) },
    cine_trans_in: { min: 200, L: cat(   // entra una vineta: soplo suave de humo + brasa
      [N('bandpass', 300, 1400, 0.7, 0.12, 1.2, { a: 0.35 }), th(90, 140, 0.6, 0.1, { a: 0.3 })], crackle(3, 0.5, 0.06, 0.2, 5)) },
    cine_trans_out: { min: 200, L: cat(   // sale una vineta: soplo que se apaga
      [N('bandpass', 1400, 250, 0.7, 0.1, 1.2, { a: 0.1 }), th(140, 70, 0.6, 0.1, { a: 0.05 })], crackle(2, 0.4, 0.05, 0.05, 6)) },
    cine_trans_cut: { min: 200, L: [   // corte seco entre viñetas: golpe de lena + soplo corto
      th(110, 45, 0.22, 0.35, { a: 0.003 }), N('lowpass', 1800, 200, 0.18, 0.15, 0.8, { a: 0.002 }), N('highpass', 4000, 7000, 0.1, 0.05, 1, { a: 0.002 })] },
    cine_next: { min: 80, L: [   // toque: completa/avanza linea (tic de madera)
      N('bandpass', 1800, 900, 0.05, 0.14, 5, { a: 0.0008 }), th(300, 160, 0.06, 0.12, { a: 0.002 })] },
    cine_spark: { min: 60, L: cat(bell(659.3, 0.07, 0.9, 0), [N('highpass', 5000, 8000, 0.06, 0.05, 1, { a: 0.001 })]) },   // chispa/nota del leitmotiv (pitch = nota; ver arg)
    cine_skip: { min: 400, L: cat(   // stinger de salto: barrido descendente + golpe seco y brasas
      [T('sawtooth', 500, 70, 0.45, 0.06, { a: 0.01, flt: { t: 'lowpass', f: [2400, 200], q: 2 } }), N('bandpass', 3000, 300, 0.4, 0.1, 1.5, { a: 0.01 }), th(90, 36, 0.3, 0.5, { delay: 0.18, a: 0.003 })], crackle(5, 0.4, 0.07, 0.1, 9)) }
  };
  Object.keys(DEFS).forEach(function (n) { DEFS[n].fam = 'cine'; });
  var names = Object.keys(DEFS);
  function dur(def) { var m = 0; def.L.forEach(function (L) { m = Math.max(m, (L.delay || 0) + L.d); }); return m; }

  // ---------------- motor propio (como sfx_cenizar)
  var ac = null, chain = null, muted = false, lastT = {}, cinePlaying = false;
  function mkNoise(c, secs) { var n = Math.floor(c.sampleRate * (secs || 1)), b = c.createBuffer(1, n, c.sampleRate), d = b.getChannelData(0); for (var i = 0; i < n; i++) d[i] = Math.random() * 2 - 1; return b; }
  function mkChain(c, dest, master) {
    var k = { noise: mkNoise(c), g: c.createGain(), comp: c.createDynamicsCompressor(), mg: c.createGain(), echoIn: c.createGain() };
    k.g.gain.value = master; k.g.connect(k.comp); k.comp.connect(dest); k.mg.gain.value = 0; k.mg.connect(k.comp);
    var dl = c.createDelay(1.5), fb = c.createGain(), lp = c.createBiquadFilter();
    dl.delayTime.value = 0.45; fb.gain.value = 0.42; lp.type = 'lowpass'; lp.frequency.value = 2200; k.echoIn.gain.value = 0.5;
    k.echoIn.connect(dl); dl.connect(lp); lp.connect(fb); fb.connect(dl); lp.connect(k.mg);
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
    if (L.trem) {
      var tg = c.createGain(), tl = c.createOscillator(), tlg = c.createGain(), dep = Math.min(0.95, L.trem[1]);
      tg.gain.value = 1 - dep * 0.5; tl.frequency.value = L.trem[0]; tlg.gain.value = dep * 0.5; tl.connect(tlg); tlg.connect(tg.gain); tl.start(st); tl.stop(end + 0.05);
      g.connect(tg); node = tg;
    }
    node.connect(dest || k.g); if (send) node.connect(k.echoIn); src.stop(end + 0.03);
  }
  function build(def, st, pitch, vm, c, k) { for (var i = 0; i < def.L.length; i++) layer(def.L[i], st + (def.L[i].delay || 0), pitch, vm * (1 + (Math.random() - 0.5) * 0.1), c, k); }

  function ensure() {
    if (ac) return ac;
    var AC = window.AudioContext || window.webkitAudioContext; if (!AC) return null;
    try { ac = new AC(); chain = mkChain(ac, ac.destination, 0.7); } catch (e) { ac = null; }
    return ac;
  }
  function applyVol() {
    if (!ac) return; var v = A.getVolume();
    chain.g.gain.value = muted ? 0 : v.master * v.sfx * 0.85;
    chain.mg.gain.value = muted || !cinePlaying ? 0 : v.master * v.music;
  }
  var origMute = A.setMuted, origVol = A.setVolume, origSusp = A.suspendAudio, origRes = A.resumeAudio;
  A.setMuted = function (m) { muted = !!m; origMute(m); applyVol(); };
  A.setVolume = function (v) { origVol(v); applyVol(); };
  A.suspendAudio = function () { origSusp(); try { if (ac && ac.state === 'running') ac.suspend(); } catch (e) { /* audio */ } };
  A.resumeAudio = function () { origRes(); try { if (ac && ac.state !== 'running') ac.resume(); } catch (e) { /* audio */ } };

  // pitch por personaje; el parametro 'pitch' multiplica (p. ej. 0.9-1.2 para dar vida a la frase)
  function play(name, pitch, vol) {
    var def = DEFS[name]; if (!def || muted || !ensure()) return false;
    if (ac.state !== 'running') { try { ac.resume(); } catch (e) { /* audio */ } if (name.indexOf('blip') > 0) return false; }
    var now = performance.now(); if (now - (lastT[name] || 0) < def.min) return false; lastT[name] = now;
    applyVol(); build(def, ac.currentTime + 0.005, pitch || 1, vol == null ? 1 : vol, ac, chain); return true;
  }
  function cine(tipo, arg, pitch) {
    try {
      pitch = +pitch > 0 ? +pitch : 1;
      switch (tipo) {
        case 'blip': {   // arg = id de personaje ('lanudo' = narrador; cualquier otro = neutro). Variacion aleatoria +-8 % x pitch.
          var who = arg === 'lanudo' || arg === 'narrador' ? 'lanudo' : 'neutro';
          return play('cine_blip_' + who, pitch * (1 + (Math.random() * 2 - 1) * 0.08), 1);
        }
        case 'title': return play('cine_title', pitch, 1);
        case 'tap': {   // DEBE llamarse dentro del gesto del usuario: desbloquea Assets y el contexto propio
          try { A.unlock(); } catch (e) { /* audio */ }
          if (!ensure()) return false;
          try { ac.resume(); } catch (e2) { /* audio */ }
          return play('cine_tap', pitch, 1);
        }
        case 'trans': return play(arg === 'out' ? 'cine_trans_out' : arg === 'cut' ? 'cine_trans_cut' : 'cine_trans_in', pitch, 1);
        case 'next': return play('cine_next', pitch, 1);
        case 'spark': return play('cine_spark', pitch * Math.pow(2, [0, 3, 5, 8, 12][Math.max(0, Math.min(4, Math.round(+arg) || 0))] / 12), 1);   // arg 0..4 = las 5 notas del leitmotiv
        case 'skip': return play('cine_skip', pitch, 1);
      }
    } catch (e3) { /* audio */ }
    return false;
  }
  var S = window.G && window.G.Snd;
  if (S) S.cine = cine;
  A.cine = cine;
  A.sfxCine = {}; names.forEach(function (n) { A.sfxCine[n] = { fam: 'cine', min: DEFS[n].min, dur: dur(DEFS[n]) }; });

  // ================= Musica
  // 'cine_intro': 60 BPM (semicorchea = 0,25 s), 100 pasos = 25 s. La menor: bordon A1, melodia triste (caja de musica), crescendo oscuro de 17 a 25 s (tritono, latido que se acelera, rugido).
  // Despues de 25 s queda un lecho de brasas y bordon (la logica puede dejarlo o pararlo).
  var INTRO_LEN = 100;
  var MEL = [[3, 76, 1.4], [4.5, 72, 1.4], [6, 74, 1.4], [7.5, 69, 2.6], [10.5, 76, 1.4], [12, 72, 1.4], [13.5, 74, 1.4], [15, 77, 3], [18.5, 76, 2.5], [21, 75, 3.5]];   // [seg, midi, dur]
  function iStep(step, t, c, k) {
    var sec = step * 0.25, s16 = step % 16, cres = Math.max(0, Math.min(1, (sec - 16.5) / 8.5)), tail = step >= INTRO_LEN;
    function mv(L, send, v) { layer(L, t + (L.delay || 0), 1, v == null ? 1 : v, c, k, k.mg, send); }
    if (!tail) {
      if (s16 === 0) {   // bordon (compases de 4 s)
        mv(th(55, 55, 4.2, 0.2 * (1 + cres * 0.8), { a: 1.2, sus: 0.8 }));
        mv(T('sawtooth', 55, 55 * (1 + cres * 0.02), 4.2, 0.035 * (1 + cres * 1.5), { a: 1.6, sus: 0.8, flt: { t: 'lowpass', f: [150 + cres * 300, 260 + cres * 900], q: 2 } }));
        mv(N('lowpass', 500, 300 + cres * 600, 4.2, 0.03 + cres * 0.05, 0.8, { a: 1.5, sus: 0.7 }));
      }
      if (sec < 2 && s16 === 0) mv(N('lowpass', 600, 900, 3, 0.05, 0.8, { a: 1.5 }));   // aire de la noche al abrir
      if (sec >= 8 && step % 16 === 8) mv(T('triangle', 110, 110, 4, 0.03, { a: 1.4, sus: 0.6, vib: [3, 12], flt: { t: 'lowpass', f: [600, 400], q: 1 } }), true);   // cuerda baja (La) sostiene
      if (sec >= 12 && step % 16 === 8 && cres < 0.3) mv(T('triangle', 130.8, 130.8, 4, 0.025, { a: 1.4, sus: 0.6, vib: [3, 12], flt: { t: 'lowpass', f: [600, 400], q: 1 } }), true);
      for (var i = 0; i < MEL.length; i++) if (Math.round(MEL[i][0] * 4) === step) {   // melodia: caja de musica + octava debil
        var f = mtof(MEL[i][1]), md = MEL[i][2], mvv = 1 + cres * 0.4;
        bell(f, 0.08 * mvv, md + 0.8, 0).forEach(function (L) { mv(L, true); });
        mv(T('triangle', f / 2, f / 2 * 1.004, md, 0.035, { a: 0.08, vib: [4.5, 14], flt: { t: 'lowpass', f: [700, 500], q: 1 } }), true);
      }
      if (cres > 0) {   // crescendo oscuro: tritono, rugido que sube y latido acelerado
        if (s16 === 0 || s16 === 8) mv(T('sawtooth', mtof(45 + 12 + 6 * (s16 === 8 ? 1 : 0)), mtof(45 + 12 + 6 * (s16 === 8 ? 1 : 0)) * 1.012, 2.1, 0.03 * cres, { a: 0.8, sus: 0.7, vib: [5, 25], flt: { t: 'bandpass', f: [500 + cres * 400, 900 + cres * 900], q: 3 } }), true);
        var every = cres < 0.4 ? 8 : cres < 0.75 ? 4 : 2;
        if (step % every === 0) mv(th(66 + cres * 14, 28, 0.28, 0.35 + cres * 0.45, { a: 0.003 }));
        if (cres > 0.5 && step % 2 === 1) mv(N('highpass', 5500 + cres * 3000, 8500, 0.04, 0.02 + cres * 0.05, 1, { a: 0.003 }));
        if (step === 70 || step === 82) mv(N('bandpass', 200, 2200, 2.5, 0.12, 1.2, { a: 2.2, sus: 0.8 }));
      }
      if (step === INTRO_LEN - 1) { mv(th(55, 24, 2.6, 0.9, { delay: 0.25, a: 0.004 })); mv(N('lowpass', 1800, 80, 2.2, 0.35, 0.8, { delay: 0.25, a: 0.002 })); }   // corte final (la intro enlaza con el titulo)
    } else if (s16 === 0 && step % 32 === 0) {
      mv(th(55, 55, 8.2, 0.1, { a: 2, sus: 0.8 }));
    }
    // crepitar de fogata (siempre): chasquidos con densidad variable, ligeramente mas intenso al inicio y en el crescendo
    var dens = tail ? 0.25 : 0.38 + cres * 0.2;
    if (hash(step * 3.3 + 1) < dens) mv(N('bandpass', 1800 + hash(step) * 4200, 900 + hash(step + 1) * 900, 0.012 + hash(step + 2) * 0.025, 0.07 + hash(step + 4) * 0.07, 5, { delay: hash(step + 9) * 0.2, a: 0.0006 }));
    if (step % 8 === 0) mv(N('lowpass', 900, 400, 2.2, 0.025, 0.8, { a: 0.6, sus: 0.5 }));   // lecho de llama
    return 0.25;
  }

  // 'cine_title': 72 BPM, 8 compases (Am, F, Dm, E; luego Am, F, C, E), brasas y arpegio de caja de musica suave. Bucle indefinido.
  var TB = { prog: [45, 41, 38, 40, 45, 41, 36, 40], third: [3, 4, 3, 4, 3, 4, 4, 4] };
  function tStep(step, t, c, k) {
    var spb = 60 / 72 / 4, bar16 = spb * 16, bar = Math.floor(step / 16) % 8, s = step % 16, root = TB.prog[bar];
    function mv(L, send, v) { layer(L, t + (L.delay || 0), 1, v == null ? 1 : v, c, k, k.mg, send); }
    if (s === 0) {
      mv(th(mtof(root - 12), mtof(root - 12), bar16 * 1.05, 0.16, { a: 0.6, sus: 0.85 }));
      mv(T('triangle', mtof(root), mtof(root) * 1.004, bar16, 0.035, { a: bar16 * 0.3, sus: 0.8, vib: [3.5, 12], flt: { t: 'lowpass', f: [700, 500], q: 1 } }), true);
      mv(T('triangle', mtof(root + 7), mtof(root + 7) * 0.997, bar16, 0.025, { a: bar16 * 0.35, sus: 0.8, vib: [4, 12], flt: { t: 'lowpass', f: [700, 500], q: 1 } }), true);
      mv(N('lowpass', 600, 380, bar16, 0.025, 0.8, { a: bar16 * 0.4, sus: 0.7 }));
    }
    if (s % 4 === 0 && hash(step * 1.7 + bar) < 0.85) {   // arpegio lento de caja de musica
      var an = [0, TB.third[bar], 7, 12][(s / 4 + (bar % 2)) % 4], af = mtof(root + 24 + an);
      bell(af, 0.045, 1.5, 0).forEach(function (L) { mv(L, true); });
    }
    if (s === 0 && bar % 4 === 3) mv(th(58, 30, 0.4, 0.28, { a: 0.01 }));   // latido al cerrar la frase
    if (hash(step * 2.9 + 4) < 0.22) mv(N('bandpass', 1800 + hash(step) * 4200, 1000, 0.012 + hash(step + 2) * 0.025, 0.05 + hash(step + 4) * 0.05, 5, { delay: hash(step + 7) * spb, a: 0.0006 }));   // brasas
    return spb;
  }

  var TRACKS = ['cine_intro', 'cine_title'];
  var CS = { timer: null, step: 0, next: 0 }, trk = null, want = false;
  var M0 = A.music, p = { start: M0.start, stop: M0.stop, setTrack: M0.setTrack, getTrack: M0.getTrack, tracks: M0.tracks, isPlaying: M0.isPlaying };
  function oneStep(step, t, c, k) { return trk === 'cine_intro' ? iStep(step, t, c, k) : tStep(step, t, c, k); }
  function cSched() {
    if (!ac || ac.state !== 'running') return;
    while (CS.next < ac.currentTime + 0.2) { CS.next += oneStep(CS.step, CS.next, ac, chain); CS.step++; }
  }
  function cStart() {
    if (cinePlaying || !trk || !want) return;
    if (!A.isUnlocked() || !ensure()) { setTimeout(cStart, 400); return; }
    if (ac.state !== 'running') { try { ac.resume(); } catch (e) { /* audio */ } setTimeout(cStart, 300); return; }
    cinePlaying = true; CS.step = 0; CS.next = ac.currentTime + 0.1;
    var v = A.getVolume(); chain.mg.gain.cancelScheduledValues(ac.currentTime); chain.mg.gain.setValueAtTime(0.0001, ac.currentTime);
    chain.mg.gain.linearRampToValueAtTime(muted ? 0 : v.master * v.music, ac.currentTime + (trk === 'cine_intro' ? 0.8 : 1.5));
    CS.timer = setInterval(cSched, 30);
  }
  function cStop() {
    if (!cinePlaying) return; cinePlaying = false; clearInterval(CS.timer); CS.timer = null;
    try { chain.mg.gain.cancelScheduledValues(ac.currentTime); chain.mg.gain.setValueAtTime(chain.mg.gain.value, ac.currentTime); chain.mg.gain.linearRampToValueAtTime(0.0001, ac.currentTime + 0.4); } catch (e) { /* audio */ }
  }
  M0.start = function () { want = true; if (trk) cStart(); else p.start(); };
  M0.stop = function () { want = false; cStop(); p.stop(); };
  M0.setTrack = function (name) {
    if (TRACKS.indexOf(name) >= 0) { if (trk === name && cinePlaying) return; var was = cinePlaying; if (trk) cStop(); else p.stop(); trk = name; if (want) { if (was) setTimeout(cStart, 450); else cStart(); } return; }
    if (trk) { trk = null; cStop(); p.setTrack(name); if (want) p.start(); return; }
    p.setTrack(name);
  };
  M0.getTrack = function () { return trk || p.getTrack(); };
  M0.tracks = function () { return p.tracks().concat(TRACKS); };
  M0.isPlaying = function () { return trk ? cinePlaying : p.isPlaying(); };
  A.cineMusicTime = function () { return cinePlaying && trk === 'cine_intro' ? CS.step * 0.25 : 0; };   // segundos de intro sonados (aprox., para sincronizar vinetas)

  var origRM = A.renderMusic;
  A.renderMusic = function (o) {
    o = o || {};
    if (TRACKS.indexOf(o.track) < 0) return origRM.apply(this, arguments);
    var OC = window.OfflineAudioContext || window.webkitOfflineAudioContext;
    if (!OC) return Promise.reject(new Error('OfflineAudioContext no disponible'));
    var intro = o.track === 'cine_intro', steps = intro ? (o.steps || INTRO_LEN + 8) : (o.bars || 8) * 16, spb = intro ? 0.25 : 60 / 72 / 4;
    var oc = new OC(2, Math.ceil((steps * spb + 3) * 44100), 44100), k = mkChain(oc, oc.destination, 1);
    k.mg.gain.value = 0.8;
    for (var i = 0; i < steps; i++) { if (intro) iStep(i, 0.05 + i * spb, oc, k); else tStep(i, 0.05 + i * spb, oc, k); }
    return oc.startRendering();
  };
  A.renderSfx = (function (orig) {
    return function (name, o) {
      var def = DEFS[name]; if (!def) return orig.apply(this, arguments);
      var OC = window.OfflineAudioContext || window.webkitOfflineAudioContext;
      if (!OC) return Promise.reject(new Error('OfflineAudioContext no disponible'));
      var oc = new OC(2, Math.ceil((dur(def) + 0.6) * 44100), 44100), k = mkChain(oc, oc.destination, 1);
      build(def, 0.005, (o && o.pitch) || 1, 1, oc, k); return oc.startRendering();
    };
  })(A.renderSfx);
})();
