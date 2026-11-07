/* sfx_fam2.js - SFX procedurales de la familia P2 (Asfodelo del Olvido, DESIGN-v5-biomas.md A.5 / C.5). Script clasico, tras sfx_fam1.js.
   Mismo patron que sfx_fam1.js: contexto WebAudio propio que sigue desbloqueo, mute, volumen y suspend de Assets; no cambia los SFX existentes.
   <= 4 voces por nombre, pitch +-10 %, separacion minima (min, ms). kind: 'tele' = telegrafia (bajo, tono distintivo, nunca en el impacto),
   'impact' = golpe/danio, 'move' = movimiento/ambiente. Timbres: charco = burbujas sinusoidales ascendentes; hielo = tonos agudos cristalinos;
   olvido = turquesa, tono que BAJA; anguila = chasquido seco y corto (sin el crepitar largo de rayos de cartas). */
(function () {
  'use strict';
  var A = window.Assets;
  if (!A || A._fam2) return;
  A._fam2 = true;

  function T(t, f0, f1, d, v, o) { var L = { t: t, f: [f0, f1], d: d, v: v }; if (o) for (var k in o) L[k] = o[k]; return L; }
  function N(type, f0, f1, d, v, q, o) { var L = { n: 1, d: d, v: v, flt: { t: type, f: [f0, f1], q: q || 1 } }; if (o) for (var k in o) L[k] = o[k]; return L; }
  function th(f0, f1, d, v, o) { return T('sine', f0, f1, d, v, o || {}); }
  function bursts(n, step, mk) { var r = []; for (var i = 0; i < n; i++) r.push(mk(i, i * step + (i % 2) * step * 0.18)); return r; }
  // burbujas: pitidos sinusoidales que suben rapido (gota en agua)
  function bubbles(n, step, base, v, d0) { return bursts(n, step, function (i, dl) {
    var f = base * (1 + ((i * 37) % 7) * 0.13); return th(f, f * 2.1, 0.05 + (i % 3) * 0.012, v, { delay: (d0 || 0) + dl, a: 0.004 }); }); }

  var DEFS = {
    // ---------------- Alma errante / Sanguijuela
    pond_swim:   { kind: 'move', min: 160, L: [   // ondas suaves de charco
      N('bandpass', 500, 1100, 0.3, 0.09, 1.6, { a: 0.1 }), th(210, 150, 0.28, 0.05, { a: 0.1, vib: [9, 60] }),
      th(700, 980, 0.05, 0.04, { delay: 0.1 }), th(620, 900, 0.05, 0.035, { delay: 0.2 })] },
    pond_bubble: { kind: 'tele', min: 200, L: bubbles(7, 0.06, 330, 0.09).concat([   // emboscada: burbujas + zumbido grave creciente
      T('triangle', 90, 150, 0.45, 0.06, { a: 0.15 }), N('lowpass', 500, 300, 0.45, 0.05, 1, { a: 0.1 })]) },
    leech_lunge: { kind: 'move', min: 110, L: [   // lance: chasquido humedo y siseo corto
      N('bandpass', 700, 3200, 0.14, 0.2, 1.4, { a: 0.02 }), th(420, 130, 0.14, 0.14), N('bandpass', 1500, 700, 0.07, 0.12, 2.5, { delay: 0.12 })] },
    // ---------------- Rana acida
    frog_crouch: { kind: 'tele', min: 200, L: [   // se agacha: croar grave que comprime
      T('triangle', 160, 95, 0.4, 0.1, { a: 0.1, vib: [22, 110], flt: { t: 'lowpass', f: [700, 350], q: 2 } }),
      th(330, 210, 0.35, 0.04, { a: 0.1, vib: [24, 90] })] },
    frog_hop:    { kind: 'move', min: 120, L: [   // despegue: "boing" corto
      th(180, 520, 0.14, 0.16, { a: 0.01 }), T('triangle', 360, 900, 0.1, 0.07), N('bandpass', 800, 1800, 0.08, 0.06, 1.5)] },
    frog_land:   { kind: 'impact', min: 100, L: [   // aterrizaje: golpe blando y humedo
      th(140, 48, 0.2, 0.55, { a: 0.002 }), N('lowpass', 1600, 250, 0.14, 0.22, 0.8), th(480, 260, 0.08, 0.1, { delay: 0.01 })] },
    frog_splash: { kind: 'impact', min: 110, L: [   // chapoteo acido: ruido chispeante + burbujas
      N('highpass', 2500, 5500, 0.22, 0.2, 0.8, { a: 0.01 }), N('bandpass', 1200, 500, 0.2, 0.15, 1.2)].concat(bubbles(4, 0.04, 520, 0.08, 0.04)) },
    // ---------------- Cabeza menor
    head_emerge: { kind: 'tele', min: 220, L: bubbles(5, 0.07, 240, 0.09).concat([   // brota: burbujas + gorgoteo ascendente
      T('sawtooth', 70, 190, 0.5, 0.07, { a: 0.18, flt: { t: 'lowpass', f: [300, 800], q: 1 } }), N('lowpass', 400, 900, 0.5, 0.07, 1, { a: 0.2 })]) },
    head_bite:   { kind: 'impact', min: 90, L: [   // mordisco: golpe seco de dientes
      N('bandpass', 2600, 1800, 0.04, 0.28, 5, { a: 0.001 }), th(200, 70, 0.14, 0.4, { a: 0.002 }), N('bandpass', 3100, 2400, 0.03, 0.2, 6, { delay: 0.05, a: 0.001 }),
      T('sawtooth', 160, 90, 0.12, 0.08, { delay: 0.02 })] },
    head_regrow: { kind: 'tele', min: 250, L: bursts(5, 0.09, function (i, dl) {   // rebrote: borboteo creciente + tono que sube
      return th(150 + i * 55, 260 + i * 80, 0.09, 0.09, { delay: dl, a: 0.01 }); }).concat([
      T('triangle', 220, 520, 0.6, 0.05, { a: 0.2, vib: [7, 40] }), N('lowpass', 500, 1400, 0.6, 0.06, 1, { a: 0.25 })]) },
    head_burn:   { kind: 'impact', min: 100, L: [   // cauterizacion: chisporroteo de fuego y siseo
      N('highpass', 4500, 6500, 0.4, 0.16, 1, { a: 0.01 }), N('bandpass', 2200, 900, 0.4, 0.1, 1.2, { a: 0.03 }),
      th(900, 200, 0.18, 0.1)].concat([0.02, 0.07, 0.11, 0.17, 0.24, 0.31].map(function (dl, i) {
        return N('highpass', 5000 + (i % 3) * 600, 5200, 0.015, 0.2, 1, { delay: dl, a: 0.001 }); })) },
    // ---------------- Medusa helada
    medusa_charge:{ kind: 'tele', min: 220, L: [   // carga de hielo: campanilla cristalina que sube
      th(1500, 2400, 0.45, 0.06, { a: 0.2, vib: [11, 25] }), th(2250, 3600, 0.45, 0.03, { a: 0.2 }), N('highpass', 5500, 7500, 0.45, 0.025, 1, { a: 0.25 })] },
    medusa_throw:{ kind: 'move', min: 110, L: [
      N('bandpass', 3000, 1200, 0.18, 0.12, 1.5, { a: 0.02 }), th(1900, 900, 0.16, 0.1), T('triangle', 2800, 1400, 0.1, 0.05)] },
    orb_shatter: { kind: 'impact', min: 80, L: [   // rotura de orbe: cristal
      N('highpass', 4000, 8000, 0.14, 0.2, 1, { a: 0.001 }), th(2600, 2500, 0.2, 0.1), th(3500, 3400, 0.16, 0.08, { delay: 0.015 }),
      th(4700, 4600, 0.12, 0.05, { delay: 0.03 }), N('bandpass', 6000, 4000, 0.03, 0.18, 7, { delay: 0.06, a: 0.001 })] },
    // ---------------- Lirio del olvido (turquesa, tiempo ralentizado: baja)
    olvido_sow:  { kind: 'move', min: 140, L: [
      th(1400, 700, 0.2, 0.09, { a: 0.01 }), N('bandpass', 2400, 1000, 0.16, 0.07, 2.5, { a: 0.02 }), th(300, 190, 0.12, 0.08, { delay: 0.05 })] },
    olvido_chime:{ kind: 'tele', min: 260, L: [   // aviso del arm: campana que se arrastra hacia abajo
      th(1320, 660, 0.7, 0.09, { a: 0.01 }), th(1980, 990, 0.6, 0.04, { a: 0.01 }), th(990, 495, 0.7, 0.05, { delay: 0.04, a: 0.01 })] },
    olvido_hum:  { kind: 'move', min: 400, L: [   // zumbido de la zona: tono lento que baja y se desafina
      T('sine', 440, 220, 0.9, 0.08, { a: 0.2, vib: [3, 45] }), T('sine', 452, 222, 0.9, 0.06, { a: 0.2, vib: [2.5, 60] }), T('triangle', 880, 430, 0.9, 0.02, { a: 0.25 })] },
    // ---------------- Anguila electrica (seco y corto)
    eel_charge:  { kind: 'tele', min: 200, L: [   // carga: zumbido agudo en escalera, sin ruido blanco largo
      T('square', 600, 1800, 0.65, 0.035, { a: 0.3, flt: { t: 'bandpass', f: [1500, 3000], q: 4 } }),
      th(1200, 3600, 0.65, 0.035, { a: 0.35 }), N('bandpass', 4200, 6000, 0.03, 0.08, 8, { delay: 0.35, a: 0.001 }), N('bandpass', 4600, 6000, 0.03, 0.09, 8, { delay: 0.5, a: 0.001 })] },
    eel_zap:     { kind: 'impact', min: 90, L: [   // rayo instantaneo: "tac" seco, 150 ms
      N('highpass', 3500, 7000, 0.035, 0.45, 1, { a: 0.0005 }), T('square', 2400, 300, 0.09, 0.2, { a: 0.0005 }), th(110, 55, 0.12, 0.35, { a: 0.002 })] },
    eel_dash:    { kind: 'move', min: 130, L: [
      N('bandpass', 500, 2200, 0.22, 0.14, 1.2, { a: 0.04 }), T('sawtooth', 120, 70, 0.2, 0.08), N('bandpass', 5000, 4200, 0.02, 0.1, 8, { delay: 0.08, a: 0.001 })] },
    // ---------------- Sacerdotisa ahogada
    priestess_chant:{ kind: 'tele', min: 350, L: [   // cantico: tres voces sinusoidales/triangulo en tercera menor, vibrato lento
      T('triangle', 220, 220, 0.7, 0.07, { a: 0.18, sus: 0.7, vib: [5, 30] }), T('triangle', 262, 262, 0.7, 0.06, { a: 0.2, sus: 0.7, vib: [5.5, 28] }),
      T('sine', 330, 311, 0.7, 0.05, { a: 0.22, sus: 0.7, vib: [6, 35] }), N('bandpass', 900, 700, 0.7, 0.04, 4, { a: 0.25 })] },
    priestess_summon:{ kind: 'impact', min: 150, L: [   // invocacion: remolino de agua + golpe grave morado
      th(110, 40, 0.3, 0.45, { a: 0.003 }), N('bandpass', 300, 2200, 0.3, 0.14, 1.5, { a: 0.1 }), T('sawtooth', 160, 480, 0.3, 0.06, { a: 0.1 })].concat(bubbles(3, 0.05, 420, 0.07, 0.1)) },
    // ---------------- Alma errante
    drown_whisper:{ kind: 'tele', min: 260, L: [   // susurro: ruido filtrado que respira
      N('bandpass', 1400, 900, 0.6, 0.1, 3, { a: 0.25 }), N('bandpass', 2200, 1600, 0.6, 0.05, 5, { a: 0.3 }), th(520, 400, 0.6, 0.02, { a: 0.3, vib: [5, 50] })] },
    drown_wail:  { kind: 'move', min: 300, L: [   // lamento: glissando descendente con vibrato
      T('sine', 640, 330, 0.75, 0.07, { a: 0.1, vib: [6, 45] }), T('triangle', 655, 340, 0.75, 0.035, { a: 0.1, vib: [5, 55] }), N('bandpass', 1200, 600, 0.6, 0.03, 4, { a: 0.2 })] }
  };
  var GAIN = { pond_swim: 2.2, leech_lunge: 2.4, frog_hop: 1.6, medusa_throw: 3, eel_dash: 4, olvido_sow: 1.8, frog_splash: 1.4, olvido_chime: 1.4, head_burn: 1.5, medusa_charge: 1.6, orb_shatter: 1.3, olvido_hum: 1.3, eel_charge: 1.6, drown_whisper: 1.8, pond_bubble: 1.5, head_emerge: 1.5 };
  Object.keys(DEFS).forEach(function (n) { DEFS[n].fam = 'asfodelo'; DEFS[n].gain = GAIN[n] || 1; });
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
  // Metadatos para herramientas: { nombre: {kind:'tele'|'impact'|'move', fam:'asfodelo', min:ms} }
  A.sfxFam2 = {};
  names.forEach(function (n) { A.sfxFam2[n] = { kind: DEFS[n].kind, fam: DEFS[n].fam, min: DEFS[n].min }; });
})();
