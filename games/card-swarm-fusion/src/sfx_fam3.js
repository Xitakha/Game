/* sfx_fam3.js - SFX procedurales de la familia P3 (Tundra / Yarlak, DESIGN-v5-biomas.md B.1 / B.3 / C.5). Script clasico, tras sfx_fam2.js.
   Mismo patron que sfx_fam1/2: contexto WebAudio propio que sigue desbloqueo, mute, volumen y suspend de Assets; no cambia los SFX existentes.
   <= 4 voces por nombre, pitch +-10 %, separacion minima (min, ms). kind: 'tele' = telegrafia (tono sostenido/ascendente, nunca en el impacto),
   'impact' = golpe/danio (corto, ruido + golpe grave), 'move' = movimiento/ambiente (bajo y sutil).
   Timbres Tundra: viento = ruido filtrado; hielo = cristalino agudo y seco; pelaje/bestias = formantes graves; telegrafia = glissando que SUBE y se mantiene.
   Extras: Assets.wind(intensity) (bucle de ventisca, 0 = apagado), pista de musica 'tundra' (Assets.music.setTrack('tundra'), sin tocar assets.js). */
(function () {
  'use strict';
  var A = window.Assets;
  if (!A || A._fam3) return;
  A._fam3 = true;

  function T(t, f0, f1, d, v, o) { var L = { t: t, f: [f0, f1], d: d, v: v }; if (o) for (var k in o) L[k] = o[k]; return L; }
  function N(type, f0, f1, d, v, q, o) { var L = { n: 1, d: d, v: v, flt: { t: type, f: [f0, f1], q: q || 1 } }; if (o) for (var k in o) L[k] = o[k]; return L; }
  function th(f0, f1, d, v, o) { return T('sine', f0, f1, d, v, o || {}); }
  function bursts(n, step, mk) { var r = []; for (var i = 0; i < n; i++) r.push(mk(i, i * step + (i % 2) * step * 0.18)); return r; }
  // crujidos: chasquidos de ruido muy cortos con tono de lumbre
  function crackles(n, span, f, v, d0) { return bursts(n, span / n, function (i, dl) {
    return N('highpass', f + (i * 773) % 2400, f + 2600, 0.012 + (i % 3) * 0.006, v * (0.5 + ((i * 29) % 7) / 8), 1, { delay: (d0 || 0) + dl, a: 0.001 }); }); }
  function bell(f, v, d, dl) { return [th(f, f, d, v, { delay: dl || 0, a: 0.003 }), th(f * 2.76, f * 2.76, d * 0.5, v * 0.3, { delay: dl || 0, a: 0.003 })]; }

  var DEFS = {
    // ---------------- Hielo y nieve (jugador y enemigos): subtiles
    ice_slide:   { kind: 'move', min: 260, L: [   // derrape: siseo cristalino suave (pitch segun velocidad)
      N('bandpass', 2600, 1700, 0.3, 0.06, 1.2, { a: 0.08 }), N('highpass', 5200, 4200, 0.3, 0.025, 0.8, { a: 0.1 }), th(180, 140, 0.3, 0.015, { a: 0.1 })] },
    ice_brake:   { kind: 'move', min: 220, L: [   // frenada: raspado que baja, seco y corto
      N('bandpass', 3600, 1100, 0.2, 0.1, 1.6, { a: 0.01 }), N('highpass', 5000, 3000, 0.1, 0.04, 1, { a: 0.005 }), th(260, 110, 0.12, 0.05)] },
    snow_step:   { kind: 'move', min: 140, L: [   // nieve firme: crunch apagado y grave
      N('lowpass', 1800, 500, 0.08, 0.12, 0.7, { a: 0.004 }), N('bandpass', 2800, 1800, 0.04, 0.05, 1.2, { a: 0.002 }), th(120, 70, 0.07, 0.05)] },
    ice_step:    { kind: 'move', min: 140, L: [   // hielo: tic agudo y duro, sin crunch (se distingue de la nieve)
      N('bandpass', 4600, 3600, 0.035, 0.1, 5, { a: 0.0008 }), th(2100, 1700, 0.07, 0.035, { a: 0.001 }), th(140, 90, 0.05, 0.04)] },
    ice_crack:   { kind: 'tele', min: 220, L: [   // crujido que avanza (fisuras antes de romperse)
      N('bandpass', 3000, 6000, 0.35, 0.05, 6, { a: 0.1 }), th(900, 2400, 0.3, 0.025, { a: 0.1 })].concat(bursts(4, 0.08, function (i, dl) {
        return N('bandpass', 3800 + i * 500, 4200, 0.02, 0.12, 8, { delay: dl, a: 0.0008 }); })) },
    ice_break:   { kind: 'impact', min: 90, L: [   // rotura de hielo: estallido + cristales cayendo
      N('highpass', 2500, 7500, 0.18, 0.28, 1, { a: 0.0008 }), th(120, 45, 0.2, 0.4, { a: 0.002 }), th(2800, 2700, 0.16, 0.06), th(4100, 4000, 0.14, 0.04, { delay: 0.02 }),
      th(3300, 3200, 0.1, 0.04, { delay: 0.07 }), N('bandpass', 6000, 3500, 0.04, 0.15, 7, { delay: 0.1, a: 0.001 })] },
    // ---------------- Ambiente: ventisca, Frio, hoguera
    wind_gust:   { kind: 'tele', min: 600, L: [   // aviso de rafaga: soplo que sube y silba
      N('bandpass', 300, 1500, 1.4, 0.2, 1.3, { a: 0.55 }), N('bandpass', 900, 2600, 1.4, 0.07, 6, { a: 0.6, sus: 0.6 }), th(180, 300, 1.4, 0.04, { a: 0.5, vib: [4, 40] })] },
    cold_warn:   { kind: 'tele', min: 700, L: [   // 70 %: tiritona (castanetear de dientes + tono tembloroso)
      th(740, 700, 0.6, 0.05, { a: 0.03, vib: [14, 60] })].concat(bursts(7, 0.07, function (i, dl) {
        return N('bandpass', 2800 + (i % 3) * 300, 2400, 0.022, 0.14, 7, { delay: dl, a: 0.0008 }); })) },
    cold_freeze: { kind: 'impact', min: 800, L: [   // 100 %: congelacion, golpe de cristal + barrido grave
      th(70, 38, 0.6, 0.5, { a: 0.003 }), N('highpass', 4500, 8000, 0.35, 0.18, 1, { a: 0.002 }), th(2400, 1500, 0.9, 0.07, { a: 0.003 }), th(3600, 2300, 0.7, 0.04, { a: 0.003 }),
      N('lowpass', 800, 150, 0.7, 0.15, 1, { a: 0.02 })] },
    cold_slow:   { kind: 'move', min: 500, L: [   // ralentizado: tono que baja lento y se apaga
      T('triangle', 420, 190, 0.7, 0.07, { a: 0.05, flt: { t: 'lowpass', f: [1400, 300], q: 1 } }), th(210, 100, 0.7, 0.07, { a: 0.05 }), N('lowpass', 900, 200, 0.6, 0.05, 1, { a: 0.1 })] },
    heart_beat:  { kind: 'move', min: 380, L: [   // latido: dos golpes sordos
      th(75, 40, 0.14, 0.7, { a: 0.004 }), th(55, 38, 0.1, 0.35, { a: 0.004 }),
      th(68, 36, 0.16, 0.55, { delay: 0.16, a: 0.004 }), N('lowpass', 300, 100, 0.12, 0.08, 1, { delay: 0.16 })] },
    campfire_crackle:{ kind: 'move', min: 500, L: [   // hoguera: base de llama + chasquidos (llamar cada ~1 s dentro de 250 px)
      N('lowpass', 1200, 700, 0.9, 0.06, 0.7, { a: 0.1 }), N('bandpass', 5000, 4000, 0.9, 0.03, 0.8, { a: 0.1 })].concat(crackles(9, 0.85, 2500, 0.16), [th(95, 85, 0.9, 0.03, { a: 0.2 })]) },
    // ---------------- Lobo de escarcha / lobezno
    wolf_howl:   { kind: 'tele', min: 350, L: [   // aullido: glissando que sube y cae, vibrato
      T('triangle', 330, 560, 0.55, 0.11, { a: 0.18, vib: [5, 30], flt: { t: 'lowpass', f: [1600, 1100], q: 2 } }),
      T('sine', 340, 330, 0.3, 0.09, { delay: 0.5, a: 0.04, vib: [6, 40] }), th(660, 1120, 0.55, 0.03, { a: 0.2, vib: [5, 40] }), N('bandpass', 1500, 1000, 0.8, 0.02, 3, { a: 0.3 })] },
    wolf_lunge:  { kind: 'move', min: 110, L: [   // lance: soplido rapido + gruñido corto
      N('bandpass', 600, 2600, 0.14, 0.16, 1.3, { a: 0.02 }), T('sawtooth', 190, 110, 0.16, 0.07, { flt: { t: 'lowpass', f: [800, 400], q: 2 } }), th(130, 70, 0.1, 0.12)] },
    wolf_run:    { kind: 'move', min: 160, L: [   // carrera: dos patadas suaves sobre nieve
      N('lowpass', 1400, 400, 0.05, 0.1, 0.8, { a: 0.003 }), th(110, 65, 0.06, 0.07), N('lowpass', 1300, 400, 0.05, 0.08, 0.8, { delay: 0.09, a: 0.003 }), th(100, 60, 0.06, 0.05, { delay: 0.09 })] },
    // ---------------- Yeti
    yeti_wind:   { kind: 'tele', min: 300, L: [   // empellon: resoplido grave creciente (bufido)
      T('sawtooth', 70, 115, 0.7, 0.07, { a: 0.4, flt: { t: 'lowpass', f: [250, 600], q: 3 } }), N('lowpass', 400, 900, 0.7, 0.12, 1.2, { a: 0.45 }), th(55, 80, 0.7, 0.14, { a: 0.4 })] },
    yeti_bash:   { kind: 'impact', min: 110, L: [   // golpe: porrazo grave pesado
      th(100, 32, 0.28, 0.75, { a: 0.002 }), N('lowpass', 1500, 150, 0.2, 0.3, 0.8, { a: 0.001 }), N('bandpass', 3000, 1500, 0.05, 0.1, 2, { a: 0.001 }), T('sawtooth', 120, 55, 0.2, 0.1)] },
    yeti_step:   { kind: 'move', min: 240, L: [   // pisada pesada
      th(80, 38, 0.18, 0.5, { a: 0.003 }), N('lowpass', 700, 150, 0.12, 0.15, 1, { a: 0.002 })] },
    // ---------------- Murcielago de hielo
    bat_flap:    { kind: 'move', min: 120, L: [   // aleteo: soplos cortos con trino agudo
      N('bandpass', 1400, 700, 0.09, 0.08, 1.2, { a: 0.015 }), N('bandpass', 1500, 800, 0.09, 0.07, 1.2, { delay: 0.1, a: 0.015 }), th(2100, 1800, 0.04, 0.02, { delay: 0.05 })] },
    bat_screech: { kind: 'tele', min: 250, L: [   // chillido agudo que sube (inicio de la pica)
      T('sawtooth', 2400, 4200, 0.45, 0.045, { a: 0.1, vib: [30, 90], flt: { t: 'bandpass', f: [3600, 4600], q: 3 } }), th(3100, 5200, 0.45, 0.04, { a: 0.1, vib: [24, 80] }), N('highpass', 6000, 8000, 0.45, 0.025, 1, { a: 0.15 })] },
    bat_dive:    { kind: 'impact', min: 110, L: [   // impacto de la pica: mordisco helado
      N('highpass', 3500, 6000, 0.05, 0.22, 1, { a: 0.0008 }), th(1900, 700, 0.12, 0.1), th(150, 70, 0.1, 0.3, { a: 0.002 })] },
    // ---------------- Estalagmita viva
    stalag_crack:{ kind: 'tele', min: 250, L: [   // fisuras: crujidos secos en cadena + zumbido de roca que sube
      th(110, 160, 0.8, 0.12, { a: 0.4 }), N('lowpass', 500, 1200, 0.8, 0.07, 1, { a: 0.4 })].concat(bursts(6, 0.12, function (i, dl) {
        return N('bandpass', 3200 + i * 350, 3600, 0.025, 0.14, 8, { delay: dl + 0.05, a: 0.0008 }); })) },
    stalag_erupt:{ kind: 'impact', min: 110, L: [   // brote de puas: estallido de roca y hielo
      th(90, 35, 0.3, 0.7, { a: 0.002 }), N('lowpass', 2500, 300, 0.22, 0.3, 0.8, { a: 0.001 }), N('highpass', 3500, 7000, 0.12, 0.15, 1, { a: 0.001 }), th(1800, 900, 0.1, 0.05, { delay: 0.01 })] },
    // ---------------- Espiritu de nieve
    snow_whisper:{ kind: 'tele', min: 260, L: [   // susurro de remolino: soplo con voz fantasmal que gira
      N('bandpass', 1800, 2800, 0.6, 0.1, 4, { a: 0.3, sus: 0.6 }), N('bandpass', 2600, 1700, 0.6, 0.06, 6, { a: 0.35 }), th(640, 760, 0.6, 0.03, { a: 0.3, vib: [7, 60] }), th(960, 1140, 0.6, 0.015, { a: 0.3, vib: [6, 50] })] },
    snow_slash:  { kind: 'impact', min: 100, L: [   // tajo: aire cortado + golpe sordo (empuja)
      N('bandpass', 5000, 1500, 0.14, 0.26, 1.5, { a: 0.003 }), th(240, 90, 0.14, 0.3, { a: 0.002 })] },
    // ---------------- Cazador de la ventisca
    hunter_aim:  { kind: 'tele', min: 250, L: [   // apunta: cuerda de arco que se tensa (crujido + tono que sube fino)
      T('triangle', 280, 520, 0.65, 0.07, { a: 0.35, flt: { t: 'lowpass', f: [900, 1800], q: 3 } }), th(1100, 1560, 0.65, 0.025, { a: 0.4, vib: [9, 30] }),
      N('bandpass', 2200, 3600, 0.65, 0.04, 5, { a: 0.4 })] },
    hunter_shot: { kind: 'move', min: 120, L: [   // disparo: cuerda y silbido de la flecha helada
      N('bandpass', 1500, 600, 0.05, 0.22, 3, { a: 0.0008 }), th(330, 150, 0.1, 0.12), th(2600, 1200, 0.2, 0.05, { delay: 0.02 }), N('highpass', 5000, 3000, 0.16, 0.05, 1, { delay: 0.03, a: 0.01 })] },
    // ---------------- Oso polar
    bear_roar:   { kind: 'tele', min: 400, L: [   // rugido grave sostenido (telegrafia de la embestida)
      T('sawtooth', 85, 130, 0.9, 0.12, { a: 0.3, sus: 0.7, vib: [22, 45], flt: { t: 'lowpass', f: [450, 800], q: 3 } }), T('square', 60, 95, 0.9, 0.05, { a: 0.3, flt: { t: 'lowpass', f: [300, 500], q: 1 } }),
      N('bandpass', 700, 1200, 0.9, 0.07, 1.5, { a: 0.35 }), th(45, 62, 0.9, 0.2, { a: 0.3 })] },
    bear_charge: { kind: 'move', min: 140, L: [   // embestida: arranque con patadas y resoplido
      th(75, 40, 0.2, 0.5, { a: 0.003 }), N('bandpass', 400, 1500, 0.3, 0.14, 1, { a: 0.05 }), th(70, 38, 0.18, 0.4, { delay: 0.14, a: 0.003 }), th(65, 36, 0.18, 0.35, { delay: 0.28, a: 0.003 })] },
    bear_slide:  { kind: 'move', min: 200, L: [   // patina al acabar: raspado grave de hielo
      N('bandpass', 1200, 500, 0.45, 0.12, 1.2, { a: 0.03 }), N('highpass', 3800, 2500, 0.35, 0.04, 1, { a: 0.03 }), th(90, 55, 0.4, 0.12, { a: 0.03 })] },
    // ---------------- Carambano
    icicle_fall: { kind: 'tele', min: 200, L: [   // silbido agudo descendente + tintineo (cae)
      th(3600, 1500, 0.5, 0.06, { a: 0.1 }), N('bandpass', 5500, 2500, 0.5, 0.05, 3, { a: 0.15 }), th(5200, 5200, 0.12, 0.025, { delay: 0.02 })] },
    icicle_hit:  { kind: 'impact', min: 80, L: [   // impacto: clavado y cristal
      N('highpass', 3000, 7000, 0.12, 0.25, 1, { a: 0.0008 }), th(2900, 2800, 0.16, 0.08), th(4300, 4200, 0.12, 0.05, { delay: 0.01 }), th(140, 60, 0.12, 0.35, { a: 0.002 })] }
  };
  var GAIN = { ice_slide: 1.5, ice_brake: 3, snow_step: 3.6, ice_step: 4.5, ice_crack: 2.4, ice_break: 1.5, wind_gust: 1.6, cold_warn: 3.2, wolf_lunge: 3.6, wolf_run: 2.1, bat_flap: 3.6, bat_screech: 2.7, hunter_shot: 3.3, snow_whisper: 2, snow_slash: 2.2, icicle_fall: 2.1, bear_slide: 1.4, heart_beat: 0.6, bear_charge: 0.65, bear_roar: 0.8, yeti_wind: 0.8, bat_dive: 1.6, cold_slow: 1.3, hunter_aim: 1.3 };
  Object.keys(DEFS).forEach(function (n) { DEFS[n].fam = 'tundra'; DEFS[n].gain = GAIN[n] || 1; });
  var names = Object.keys(DEFS);

  // ---- motor propio (misma sintesis que Assets: osc/ruido + filtro + envolvente)
  var ac = null, chain = null, muted = false, active = {}, lastT = {};
  function mkNoise(c, secs) { var n = Math.floor(c.sampleRate * (secs || 1)), b = c.createBuffer(1, n, c.sampleRate), d = b.getChannelData(0), l = 0; for (var i = 0; i < n; i++) { d[i] = Math.random() * 2 - 1; } return b; }
  function mkChain(c, dest, master) {
    var k = { noise: mkNoise(c), g: c.createGain(), comp: c.createDynamicsCompressor(), mg: c.createGain(), wg: c.createGain(), echoIn: c.createGain() };
    k.g.gain.value = master; k.g.connect(k.comp); k.comp.connect(dest);
    k.mg.gain.value = 0; k.mg.connect(k.comp); k.wg.gain.value = 0; k.wg.connect(k.comp);
    var dl = c.createDelay(1.5), fb = c.createGain(), lp = c.createBiquadFilter();   // eco frio para campanas
    dl.delayTime.value = 0.47; fb.gain.value = 0.42; lp.type = 'lowpass'; lp.frequency.value = 2600; k.echoIn.gain.value = 0.55;
    k.echoIn.connect(dl); dl.connect(lp); lp.connect(fb); fb.connect(dl); lp.connect(k.mg);
    return k;
  }
  function layer(L, st, pitch, vm, c, k, dest, send) {
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
    node.connect(g); g.connect(dest || k.g); if (send) g.connect(k.echoIn); src.stop(end + 0.03);
  }
  function build(def, st, pitch, vm, c, k) { for (var i = 0; i < def.L.length; i++) layer(def.L[i], st + (def.L[i].delay || 0), pitch, vm * def.gain * (1 + (Math.random() - 0.5) * 0.14), c, k); }
  function dur(def) { var m = 0; def.L.forEach(function (L) { m = Math.max(m, (L.delay || 0) + L.d); }); return m; }

  function ensure() {
    if (ac) return ac;
    var AC = window.AudioContext || window.webkitAudioContext; if (!AC) return null;
    try { ac = new AC(); chain = mkChain(ac, ac.destination, 0.7); } catch (e) { ac = null; }
    return ac;
  }
  var windLvl = 0, tunPlaying = false;
  function applyVol() {
    if (!ac) return; var v = A.getVolume();
    chain.g.gain.value = muted ? 0 : v.master * v.sfx * 0.85;
    chain.wg.gain.value = muted ? 0 : v.master * v.sfx * 0.85;
    chain.mg.gain.value = muted || !tunPlaying ? 0 : v.master * v.music;
  }

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
  A.sfxFam3 = {};
  names.forEach(function (n) { A.sfxFam3[n] = { kind: DEFS[n].kind, fam: DEFS[n].fam, min: DEFS[n].min }; });

  // ================= Ventisca ambiental: Assets.wind(intensity 0..1). 0 = apagado. Se puede llamar cada frame.
  var W = null;
  function windStart() {
    var c = ac, nb = mkNoise(c, 4), s1 = c.createBufferSource(), s2 = c.createBufferSource();
    s1.buffer = nb; s1.loop = true; s2.buffer = nb; s2.loop = true;
    var b1 = c.createBiquadFilter(), b2 = c.createBiquadFilter(), g1 = c.createGain(), g2 = c.createGain(), out = c.createGain();
    b1.type = 'bandpass'; b1.frequency.value = 520; b1.Q.value = 0.7; b2.type = 'bandpass'; b2.frequency.value = 1700; b2.Q.value = 5;
    g1.gain.value = 1; g2.gain.value = 0.28; out.gain.value = 0;
    var l1 = c.createOscillator(), l1g = c.createGain(), l2 = c.createOscillator(), l2g = c.createGain(), l3 = c.createOscillator(), l3g = c.createGain();
    l1.frequency.value = 0.11; l1g.gain.value = 0.35; l1.connect(l1g); l1g.connect(g1.gain);      // rachas
    l2.frequency.value = 0.07; l2g.gain.value = 260; l2.connect(l2g); l2g.connect(b1.frequency);   // el tono barre
    l3.frequency.value = 0.19; l3g.gain.value = 700; l3.connect(l3g); l3g.connect(b2.frequency);   // silbido
    s1.connect(b1); b1.connect(g1); g1.connect(out); s2.connect(b2); b2.connect(g2); g2.connect(out); out.connect(chain.wg);
    var t = c.currentTime; s1.start(t, Math.random() * 3); s2.start(t, Math.random() * 3); l1.start(t); l2.start(t); l3.start(t);
    W = { out: out, srcs: [s1, s2, l1, l2, l3], off: null };
  }
  function windStop() {
    if (!W) return; var w = W; W = null;
    try { w.out.gain.setTargetAtTime(0, ac.currentTime, 0.4); } catch (e) { /* audio */ }
    setTimeout(function () { w.srcs.forEach(function (s) { try { s.stop(); } catch (e) { /* audio */ } }); try { w.out.disconnect(); } catch (e2) { /* audio */ } }, 2500);
  }
  A.wind = function (intensity) {
    var v = Math.max(0, Math.min(1, +intensity || 0)); windLvl = v;
    if (v <= 0.001) { windStop(); return false; }
    if (!A.isUnlocked() || !ensure() || ac.state !== 'running') return false;
    applyVol(); if (!W) windStart();
    W.out.gain.setTargetAtTime(0.05 + v * 0.3, ac.currentTime, 0.6);
    return true;
  };
  A.windLevel = function () { return windLvl; };

  // ================= Musica 'tundra' (fria, escasa: campanas/cristales + bajo grave). assets.js no se toca: se intercepta setTrack.
  var TUN = { bpm: 62, prog: [38, 38, 34, 36, 38, 41, 34, 33], scale: [0, 3, 5, 7, 10] };
  function mtof(m) { return 440 * Math.pow(2, (m - 69) / 12); }
  function sstep(a, b, x) { var t = Math.max(0, Math.min(1, (x - a) / (b - a || 1))); return t * t * (3 - 2 * t); }
  function hash(n) { var x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); }
  function tunStep(step, t, inten, c, k) {
    var spb = 60 / TUN.bpm / 4, bar = Math.floor(step / 16) % TUN.prog.length, s = step % 16, root = TUN.prog[bar], mv = function (L, send, v) { layer(L, t + (L.delay || 0), 1, v == null ? 1 : v, c, k, k.mg, send); };
    if (s === 0) {   // bajo grave + pad helado: siempre
      mv(th(mtof(root), mtof(root), spb * 16, 0.26, { a: 0.5, sus: 0.7 }));
      mv(th(mtof(root - 12), mtof(root - 12), spb * 16, 0.2, { a: 0.6, sus: 0.8 }));
      mv(T('triangle', mtof(root + 12), mtof(root + 12) * 1.004, spb * 16, 0.035, { a: 0.9, sus: 0.6, vib: [3, 14], flt: { t: 'lowpass', f: [700, 450], q: 1 } }));
      mv(th(mtof(root + 19), mtof(root + 19), spb * 16, 0.025, { a: 1.1, sus: 0.6 }));
    }
    if (s === 8 && bar % 2) mv(th(mtof(root + 7 - 12), mtof(root + 7 - 12), spb * 6, 0.12, { a: 0.3 }));
    var lb = sstep(0.12, 0.35, inten);
    if (lb > 0.02 && s % 2 === 0 && hash(step * 3 + 1) < 0.27 + inten * 0.15) {   // campanas escasas (pentatonica menor)
      var deg = TUN.scale[Math.floor(hash(step) * 5)], oct = hash(step + 7) < 0.3 ? 24 : 12, f = mtof(root + oct + 12 + deg);
      bell(f, 0.09, 2.2).forEach(function (L) { mv(L, true, lb); });
    }
    var lc = sstep(0.4, 0.65, inten);
    if (lc > 0.02 && s % 4 === 2 && hash(step * 5 + 2) < 0.3) {   // cristales: ticks agudos
      var cf = mtof(root + 48 + TUN.scale[Math.floor(hash(step + 3) * 5)]);
      mv(th(cf, cf, 0.35, 0.035, { a: 0.002 }), true, lc);
    }
    var lp = sstep(0.6, 0.85, inten);
    if (lp > 0.02 && (s === 0 || s === 10)) mv(th(95, 40, 0.3, 0.3, { a: 0.003 }), false, lp);   // pulso de corazon
    if (lp > 0.02 && s === 6) mv(N('highpass', 7000, 6000, 0.08, 0.035, 1, { a: 0.02 }), false, lp);   // soplo
    return spb;
  }
  var TS = { timer: null, step: 0, next: 0 }, cur = { track: 'normal' }, tun = false, want = false, inten = 0;
  var M0 = A.music, o0 = { start: M0.start, stop: M0.stop, setTrack: M0.setTrack, getTrack: M0.getTrack, tracks: M0.tracks, isPlaying: M0.isPlaying, setIntensity: M0.setIntensity };
  function tunSched() {
    if (!ac || ac.state !== 'running') return;
    while (TS.next < ac.currentTime + 0.2) { TS.next += tunStep(TS.step, TS.next, inten, ac, chain); TS.step++; }
  }
  function tunStart() {
    if (tunPlaying || !tun || !want) return;
    if (!A.isUnlocked() || !ensure()) { setTimeout(tunStart, 400); return; }
    if (ac.state !== 'running') { try { ac.resume(); } catch (e) { /* audio */ } setTimeout(tunStart, 300); return; }
    tunPlaying = true; TS.step = 0; TS.next = ac.currentTime + 0.1;
    var v = A.getVolume(); chain.mg.gain.cancelScheduledValues(ac.currentTime); chain.mg.gain.setValueAtTime(0.0001, ac.currentTime);
    chain.mg.gain.linearRampToValueAtTime(muted ? 0 : v.master * v.music, ac.currentTime + 0.8);
    TS.timer = setInterval(tunSched, 30);
  }
  function tunStop() {
    if (!tunPlaying) return; tunPlaying = false; clearInterval(TS.timer); TS.timer = null;
    try { chain.mg.gain.cancelScheduledValues(ac.currentTime); chain.mg.gain.setValueAtTime(chain.mg.gain.value, ac.currentTime); chain.mg.gain.linearRampToValueAtTime(0.0001, ac.currentTime + 0.4); } catch (e) { /* audio */ }
  }
  M0.start = function () { want = true; if (tun) tunStart(); else o0.start(); };
  M0.stop = function () { want = false; tunStop(); o0.stop(); };
  M0.setIntensity = function (v) { inten = Math.max(0, Math.min(1, typeof v === 'boolean' ? (v ? 1 : 0) : (+v || 0))); o0.setIntensity(v); };
  M0.setTrack = function (name) {
    if (name === 'tundra') { if (tun) return; tun = true; o0.stop(); if (want) tunStart(); return; }
    if (tun) { tun = false; tunStop(); o0.setTrack(name); if (want) o0.start(); return; }
    o0.setTrack(name);
  };
  M0.getTrack = function () { return tun ? 'tundra' : o0.getTrack(); };
  M0.tracks = function () { return o0.tracks().concat(['tundra']); };
  M0.isPlaying = function () { return tun ? tunPlaying : o0.isPlaying(); };

  var origRM = A.renderMusic;
  A.renderMusic = function (o) {
    o = o || {};
    if (o.track !== 'tundra') return origRM.apply(this, arguments);
    var OC = window.OfflineAudioContext || window.webkitOfflineAudioContext;
    if (!OC) return Promise.reject(new Error('OfflineAudioContext no disponible'));
    var bars = o.bars || 8, spb = 60 / TUN.bpm / 4, it = o.intensity == null ? 1 : o.intensity;
    var oc = new OC(2, Math.ceil((bars * 16 * spb + 3) * 44100), 44100), k = mkChain(oc, oc.destination, 1);
    k.mg.gain.value = 0.9;
    for (var i = 0; i < bars * 16; i++) tunStep(i, 0.05 + i * spb, it, oc, k);
    return oc.startRendering();
  };
})();
