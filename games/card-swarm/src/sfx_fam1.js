/* sfx_fam1.js - SFX procedurales de las familias P1 (Bosque del Pastor y Cripta de Karceron). Script clasico, tras assets.js.
   Se engancha a Assets.sfx / sfxNames / renderSfx SIN cambiar los SFX existentes: los nombres propios los atiende este archivo
   (contexto WebAudio propio que sigue el desbloqueo, mute, volumen y suspend de Assets). <= 4 voces por tipo, pitch +-10 %.
   Convencion: kind 'tele' = telegrafia (bajo y distintivo, nunca confundible con un impacto), 'impact' = golpe/danio, 'move' = movimiento/ambiente. */
(function () {
  'use strict';
  var A = window.Assets;
  if (!A || A._fam1) return;
  A._fam1 = true;

  function T(t, f0, f1, d, v, o) { var L = { t: t, f: [f0, f1], d: d, v: v }; if (o) for (var k in o) L[k] = o[k]; return L; }
  function N(type, f0, f1, d, v, q, o) { var L = { n: 1, d: d, v: v, flt: { t: type, f: [f0, f1], q: q || 1 } }; if (o) for (var k in o) L[k] = o[k]; return L; }
  function th(f0, f1, d, v, o) { return T('sine', f0, f1, d, v, o || {}); }
  function bursts(n, step, mk) { var r = []; for (var i = 0; i < n; i++) r.push(mk(i, i * step + (i % 2) * step * 0.18)); return r; }

  // kind: tele | impact | move ; fam: bosque | cripta ; min: separacion minima en ms
  var DEFS = {
    // ---------------- BOSQUE
    lamb_bleat:  { kind: 'move', fam: 'bosque', min: 140, L: [  // balido corrupto: dos voces desafinadas
      T('sawtooth', 400, 290, 0.34, 0.12, { a: 0.03, vib: [26, 130], flt: { t: 'bandpass', f: [950, 700], q: 3 } }),
      T('square', 212, 150, 0.34, 0.06, { a: 0.03, vib: [31, 90] }), N('bandpass', 1500, 900, 0.3, 0.05, 2, { a: 0.04 })] },
    thorn_shot:  { kind: 'impact', fam: 'bosque', min: 60, L: [
      N('highpass', 3500, 6000, 0.05, 0.2, 1), T('triangle', 1500, 480, 0.1, 0.16), th(260, 120, 0.06, 0.12)] },
    moth_flutter:{ kind: 'move', fam: 'bosque', min: 120, L: bursts(6, 0.045, function (i, dl) {
      return N('bandpass', 2600 - i * 150, 1800, 0.05, 0.1 * (1 - i * 0.12), 2.5, { delay: dl, a: 0.01 }); }).concat([T('sine', 520, 700, 0.3, 0.025)]) },
    wool_puff:   { kind: 'impact', fam: 'bosque', min: 80, L: [
      N('lowpass', 1800, 300, 0.2, 0.22, 0.7, { a: 0.01 }), th(320, 170, 0.14, 0.1), T('sine', 1500, 1250, 0.12, 0.03, { delay: 0.03 })] },
    spore_puff:  { kind: 'tele', fam: 'bosque', min: 150, L: [
      N('lowpass', 650, 180, 0.28, 0.1, 1, { a: 0.04 }),
      th(300, 560, 0.07, 0.07, { delay: 0.03 }), th(380, 720, 0.07, 0.06, { delay: 0.12 }), th(260, 480, 0.08, 0.06, { delay: 0.2 })] },
    zampona_pipe:{ kind: 'tele', fam: 'bosque', min: 300, L: [
      T('triangle', 392, 392, 0.55, 0.1, { a: 0.09, sus: 0.7, vib: [6, 28] }),
      T('square', 588, 588, 0.55, 0.025, { a: 0.1, vib: [6, 25] }), T('triangle', 415, 415, 0.5, 0.05, { a: 0.1, vib: [5, 30] })] },
    dog_bark:    { kind: 'tele', fam: 'bosque', min: 300, L: [
      T('sawtooth', 340, 170, 0.13, 0.2, { flt: { t: 'bandpass', f: [900, 600], q: 2.5 } }), N('bandpass', 1100, 500, 0.1, 0.12, 2),
      T('sawtooth', 380, 190, 0.13, 0.2, { delay: 0.2, flt: { t: 'bandpass', f: [1000, 650], q: 2.5 } }), N('bandpass', 1200, 550, 0.1, 0.12, 2, { delay: 0.2 })] },
    dog_dash:    { kind: 'move', fam: 'bosque', min: 150, L: [
      N('bandpass', 400, 2400, 0.24, 0.2, 1.2, { a: 0.05 }), th(150, 70, 0.1, 0.22, { delay: 0.04 }),
      N('highpass', 3000, 3000, 0.03, 0.08, 1, { delay: 0.12 }), N('highpass', 3000, 3000, 0.03, 0.07, 1, { delay: 0.18 })] },

    // ---------------- CRIPTA
    bone_rattle: { kind: 'move', fam: 'cripta', min: 130, L: [0, 0.035, 0.06, 0.105, 0.13, 0.19].map(function (dl, i) {
      return N('bandpass', 3000 + (i % 3) * 500, 2400, 0.03, 0.14, 7, { delay: dl, a: 0.001 }); }).concat([T('triangle', 1700, 1100, 0.04, 0.05, { delay: 0.04 })]) },
    bone_arrow:  { kind: 'impact', fam: 'cripta', min: 70, L: [
      N('highpass', 1500, 4500, 0.1, 0.14, 1, { a: 0.02 }), T('triangle', 700, 1500, 0.08, 0.1), N('bandpass', 3500, 3000, 0.02, 0.16, 6, { delay: 0.01, a: 0.001 })] },
    skull_explode:{ kind: 'impact', fam: 'cripta', min: 90, L: [
      N('lowpass', 2800, 150, 0.36, 0.5, 1), th(120, 35, 0.3, 0.6, { a: 0.002 }), T('square', 230, 60, 0.18, 0.18),
      N('bandpass', 3200, 2200, 0.03, 0.2, 6, { delay: 0.02 }), N('bandpass', 3800, 2600, 0.03, 0.18, 6, { delay: 0.06 }), N('bandpass', 2900, 2000, 0.03, 0.16, 6, { delay: 0.1 })] },
    skull_roll:  { kind: 'tele', fam: 'cripta', min: 200, L: [
      N('lowpass', 320, 520, 0.5, 0.14, 1.5, { a: 0.1 }), T('sawtooth', 62, 105, 0.5, 0.07, { a: 0.1, vib: [24, 400] }), N('bandpass', 1400, 1400, 0.04, 0.08, 4, { delay: 0.2 })] },
    skull_bounce:{ kind: 'impact', fam: 'cripta', min: 80, L: [
      th(170, 60, 0.13, 0.5, { a: 0.002 }), N('bandpass', 2500, 1600, 0.05, 0.22, 3), T('triangle', 520, 300, 0.1, 0.1)] },
    chain_rattle:{ kind: 'tele', fam: 'cripta', min: 160, L: bursts(6, 0.05, function (i, dl) {
      return N('bandpass', 5200 - (i % 2) * 900, 4200, 0.04, 0.07, 9, { delay: dl, a: 0.001 }); }).concat(
      bursts(3, 0.09, function (i, dl) { return T('triangle', 3100 + i * 180, 2800, 0.05, 0.025, { delay: dl }); })) },
    chain_throw: { kind: 'move', fam: 'cripta', min: 120, L: [
      N('highpass', 1000, 5000, 0.18, 0.13, 1, { a: 0.04 }), T('sawtooth', 300, 900, 0.15, 0.07),
      N('bandpass', 4800, 4000, 0.04, 0.1, 9, { delay: 0.05 }), N('bandpass', 4200, 3600, 0.04, 0.09, 9, { delay: 0.11 })] },
    chain_hit:   { kind: 'impact', fam: 'cripta', min: 120, L: [
      T('triangle', 880, 860, 0.26, 0.18), T('triangle', 1320, 1290, 0.22, 0.12), T('triangle', 1990, 1960, 0.18, 0.07),
      th(110, 50, 0.14, 0.4, { a: 0.002 }), N('bandpass', 4000, 3000, 0.05, 0.14, 4), T('sine', 650, 300, 0.3, 0.09, { delay: 0.06 })] },
    shield_bash: { kind: 'impact', fam: 'cripta', min: 120, L: [
      th(100, 40, 0.22, 0.7, { a: 0.002 }), T('triangle', 520, 505, 0.24, 0.16), T('triangle', 790, 770, 0.2, 0.1), N('bandpass', 1500, 800, 0.09, 0.3, 1.5)] },
    ember_crackle:{ kind: 'move', fam: 'cripta', min: 100, L: [0, 0.03, 0.07, 0.12, 0.14, 0.21, 0.27].map(function (dl, i) {
      return N('highpass', 4500 + (i % 3) * 700, 5000, 0.015, 0.1 + (i % 2) * 0.05, 1, { delay: dl, a: 0.001 }); }).concat([N('lowpass', 700, 350, 0.32, 0.05, 1)]) },
    lava_trail_hiss:{ kind: 'move', fam: 'cripta', min: 150, L: [
      N('bandpass', 3000, 1400, 0.32, 0.1, 1.2, { a: 0.05 }), N('highpass', 5500, 4000, 0.25, 0.04, 1, { a: 0.06 })] },
    lava_pool:   { kind: 'tele', fam: 'cripta', min: 160, L: [
      th(120, 270, 0.08, 0.16), th(150, 310, 0.08, 0.14, { delay: 0.09 }), th(105, 240, 0.09, 0.15, { delay: 0.2 }), th(140, 290, 0.08, 0.12, { delay: 0.3 }),
      N('lowpass', 420, 250, 0.5, 0.08, 1, { a: 0.05 }), N('highpass', 5000, 3500, 0.2, 0.03, 1, { delay: 0.1 })] },
    soul_whisper:{ kind: 'tele', fam: 'cripta', min: 250, L: [
      N('bandpass', 1800, 3500, 0.55, 0.12, 5, { a: 0.22 }), T('sine', 880, 1320, 0.55, 0.035, { a: 0.2, vib: [7, 60] }), T('sine', 933, 1400, 0.55, 0.03, { a: 0.2, vib: [6, 70] })] },
    soul_blink:  { kind: 'move', fam: 'cripta', min: 150, L: [
      T('sine', 1800, 300, 0.16, 0.15), N('highpass', 6000, 3000, 0.09, 0.1), T('sine', 300, 1700, 0.14, 0.12, { delay: 0.16, a: 0.05 }), N('bandpass', 2500, 5000, 0.12, 0.06, 3, { delay: 0.16 })] }
  };
  var GAIN = { moth_flutter: 4, bone_rattle: 3.5, chain_rattle: 4, lamb_bleat: 2, wool_puff: 2, bone_arrow: 2, thorn_shot: 1.7, lava_trail_hiss: 2, spore_puff: 1.6, chain_throw: 1.5 };
  Object.keys(DEFS).forEach(function (n) { DEFS[n].gain = GAIN[n] || 1; });
  var names = Object.keys(DEFS);

  // ---- motor propio (misma sintesis que Assets: osc/ruido + filtro + envolvente)
  var ac = null, chain = null, muted = false, active = {}, lastT = {};
  function mkNoise(c) { var b = c.createBuffer(1, c.sampleRate, c.sampleRate), d = b.getChannelData(0); for (var i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1; return b; }
  function mkChain(c, dest, master) {
    var k = { noise: mkNoise(c), g: c.createGain(), comp: c.createDynamicsCompressor() };
    k.g.gain.value = master; k.g.connect(k.comp); k.comp.connect(dest); return k;
  }
  function layer(L, st, pitch, vm, c, k) {
    var d = L.d, end = st + d, g = c.createGain(), a = L.a == null ? 0.003 : L.a, pk = Math.max(L.v * vm, 0.0002), src, node;
    g.gain.setValueAtTime(0.0001, st); g.gain.linearRampToValueAtTime(pk, st + a);
    if (L.sus) g.gain.setValueAtTime(pk, st + d * L.sus);
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
    node.connect(g); g.connect(k.g); src.stop(end + 0.03);
  }
  function build(def, st, pitch, vm, c, k) { for (var i = 0; i < def.L.length; i++) layer(def.L[i], st + (def.L[i].delay || 0), pitch, vm * def.gain * (1 + (Math.random() - 0.5) * 0.14), c, k); }
  function dur(def) { var m = 0; def.L.forEach(function (L) { m = Math.max(m, (L.delay || 0) + L.d); }); return m; }

  function ensure() {
    if (ac) return ac;
    var AC = window.AudioContext || window.webkitAudioContext; if (!AC) return null;
    try { ac = new AC(); chain = mkChain(ac, ac.destination, 0.7); } catch (e) { ac = null; }
    return ac;
  }
  function applyVol() { if (!ac) return; var v = A.getVolume(); chain.g.gain.value = muted ? 0 : v.master * v.sfx * 0.85; }

  var origSfx = A.sfx, origNames = A.sfxNames, origRender = A.renderSfx;
  var origMute = A.setMuted, origVol = A.setVolume, origSusp = A.suspendAudio, origRes = A.resumeAudio;
  A.setMuted = function (m) { muted = !!m; origMute(m); applyVol(); };
  A.setVolume = function (v) { origVol(v); applyVol(); };
  A.suspendAudio = function () { origSusp(); try { if (ac && ac.state === 'running') ac.suspend(); } catch (e) { /* audio */ } };
  A.resumeAudio = function () { origRes(); try { if (ac && ac.state !== 'running') ac.resume(); } catch (e) { /* audio */ } };

  A.sfx = function (name, o) {
    var def = DEFS[name];
    if (!def) return origSfx.apply(this, arguments);
    o = o || {};
    if (muted || !A.isUnlocked() || !ensure()) return false;
    if (ac.state !== 'running') { try { ac.resume(); } catch (e) { /* audio */ } return false; }
    var now = performance.now();
    if (now - (lastT[name] || 0) < def.min) return false;           // separacion minima: con muchos enemigos no satura
    if ((active[name] || 0) >= 4) return false;                       // <= 4 voces por tipo
    lastT[name] = now; active[name] = (active[name] || 0) + 1;
    setTimeout(function () { active[name]--; }, Math.round(dur(def) * 1000) + 40);
    applyVol();
    var vary = o.vary == null ? 0.1 : o.vary, pitch = (o.pitch || 1) * (1 + (Math.random() * 2 - 1) * vary);
    build(def, ac.currentTime + 0.005, pitch, o.vol == null ? 1 : o.vol, ac, chain);
    return true;
  };
  A.sfxNames = function () { return origNames().concat(names); };
  A.renderSfx = function (name, o) {
    var def = DEFS[name];
    if (!def) return origRender.apply(this, arguments);
    o = o || {};
    var OC = window.OfflineAudioContext || window.webkitOfflineAudioContext;
    if (!OC) return Promise.reject(new Error('OfflineAudioContext no disponible'));
    var oc = new OC(2, Math.ceil((dur(def) + 0.5) * 44100), 44100), k = mkChain(oc, oc.destination, 1);
    build(def, 0.005, (o.pitch || 1) * (1 + (Math.random() * 2 - 1) * (o.vary || 0)), o.vol == null ? 1 : o.vol, oc, k);
    return oc.startRendering();
  };
  // Metadatos para herramientas: { nombre: {kind:'tele'|'impact'|'move', fam:'bosque'|'cripta', min:ms} }
  A.sfxFam1 = {};
  names.forEach(function (n) { A.sfxFam1[n] = { kind: DEFS[n].kind, fam: DEFS[n].fam, min: DEFS[n].min }; });
})();
