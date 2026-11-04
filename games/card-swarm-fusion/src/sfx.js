/* sfx.js - SFX procedurales propios de Swarm Hand (por etiqueta, stinger de combo, fusión, reroll...).
   WebAudio sin muestras. Máx. 4 voces por tipo y separación mínima para que 10 disparos/s no saturen. */
(function () {
  'use strict';
  var G = window.G, S = G.Snd = {};
  var ac = null, master = null, noise = null, active = {}, lastT = {};

  S.unlock = function () {
    if (!ac) {
      try {
        ac = new (window.AudioContext || window.webkitAudioContext)();
        master = ac.createGain(); master.gain.value = S.muted ? 0 : 0.55; master.connect(ac.destination);
        var n = ac.sampleRate * 0.5, b = ac.createBuffer(1, n, ac.sampleRate), d = b.getChannelData(0);
        for (var i = 0; i < n; i++) d[i] = Math.random() * 2 - 1;
        noise = b;
      } catch (e) { ac = null; }
    }
    if (ac && ac.state !== 'running') { try { ac.resume(); } catch (e2) { /* audio */ } }
  };

  // Móvil: el contexto se suspende al ocultar la página y se reanuda con el primer toque (iOS lo deja en 'interrupted')
  S.suspend = function () { try { if (ac && ac.state === 'running') ac.suspend(); } catch (e) { /* audio */ } };
  S.resume = function () { try { if (ac && ac.state !== 'running') ac.resume(); } catch (e) { /* audio */ } };
  S.setMuted = function (m) { S.muted = !!m; if (master) master.gain.value = S.muted ? 0 : 0.55; };
  S.state = function () { return ac ? ac.state : 'none'; };

  function tone(type, f0, f1, dur, vol, delay) {
    var t = ac.currentTime + (delay || 0), o = ac.createOscillator(), g = ac.createGain();
    o.type = type; o.frequency.setValueAtTime(f0, t); o.frequency.exponentialRampToValueAtTime(Math.max(20, f1), t + dur);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + 0.008); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(master); o.start(t); o.stop(t + dur + 0.02);
  }
  function hiss(ftype, f0, f1, dur, vol, delay) {
    var t = ac.currentTime + (delay || 0), s = ac.createBufferSource(), f = ac.createBiquadFilter(), g = ac.createGain();
    s.buffer = noise; f.type = ftype; f.frequency.setValueAtTime(f0, t); f.frequency.exponentialRampToValueAtTime(Math.max(30, f1), t + dur);
    g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    s.connect(f); f.connect(g); g.connect(master); s.start(t); s.stop(t + dur + 0.02);
  }

  var V = {
    fire:      function (p) { hiss('lowpass', 900 * p, 200, 0.14, 0.16); tone('sine', 140 * p, 70, 0.1, 0.12); },
    ice:       function (p) { tone('sine', 1900 * p, 1300, 0.11, 0.07); tone('triangle', 2800 * p, 2200, 0.06, 0.03); },
    lightning: function (p) { tone('sawtooth', 1100 * p, 120, 0.1, 0.07); hiss('highpass', 3000, 1500, 0.07, 0.07); },
    poison:    function (p) { tone('sine', 220 * p, 460, 0.09, 0.1); tone('sine', 160 * p, 340, 0.07, 0.07, 0.04); },
    blood:     function (p) { tone('sine', 120 * p, 55, 0.13, 0.16); hiss('lowpass', 500, 150, 0.08, 0.1); },
    steel:     function (p) { tone('triangle', 1600 * p, 900, 0.07, 0.07); hiss('bandpass', 4500, 3000, 0.05, 0.08); },
    neutral:   function (p) { tone('triangle', 600 * p, 400, 0.08, 0.06); },
    hurt:      function () { tone('sawtooth', 200, 60, 0.18, 0.18); },
    gem:       function (p) { tone('sine', 1100 * p, 1700 * p, 0.06, 0.05); },
    flip:      function () { hiss('highpass', 4000, 1500, 0.07, 0.15); tone('sine', 500, 650, 0.05, 0.05); },
    reroll:    function () { hiss('bandpass', 2500, 900, 0.12, 0.18); tone('triangle', 400, 800, 0.1, 0.07, 0.05); },
    fuse:      function () { [660, 880, 1320].forEach(function (f, i) { tone('triangle', f, f * 1.01, 0.2, 0.1, i * 0.06); }); tone('sine', 220, 330, 0.3, 0.12); },
    discard:   function () { hiss('lowpass', 1200, 200, 0.18, 0.16); tone('sine', 300, 100, 0.15, 0.08); },
    levelup:   function () { [392, 523, 659, 784, 1047].forEach(function (f, i) { tone('triangle', f, f, 0.16, 0.09, i * 0.07); }); },
    boom:      function (p) { hiss('lowpass', 1400, 90, 0.35, 0.35); tone('sine', 110 * p, 35, 0.3, 0.3); },
    win:       function () { [523, 659, 784, 1047, 784, 1047, 1319].forEach(function (f, i) { tone('square', f, f, 0.2, 0.06, i * 0.11); }); },
    // Stinger de combo: el sonido de marca. Arpegio ascendente brillante; p varía por combo.
    combo:     function (p) {
      [523, 659, 784, 1047, 1319, 1568].forEach(function (f, i) {
        tone('square', f * p, f * p, 0.14, 0.05, i * 0.055);
        tone('triangle', f * p * 2, f * p * 2, 0.3, 0.04, i * 0.055 + 0.02);
      });
      tone('sine', 130 * p, 260 * p, 0.5, 0.2); hiss('highpass', 6000, 2500, 0.45, 0.07, 0.25);
    }
  };
  S.V = V; S.tone = tone; S.hiss = hiss;   // J3: assets_peligro.js registra stingers de jefe en V
  var MIN = { fire: 70, ice: 70, lightning: 70, poison: 70, blood: 70, steel: 70, neutral: 70, gem: 35, hurt: 100, stg_part: 250 };

  S.play = function (name, p) {
    if (!ac || ac.state !== 'running' || !V[name]) return;
    var now = performance.now();
    if (now - (lastT[name] || 0) < (MIN[name] || 0)) return;
    if ((active[name] || 0) >= 4) return;
    lastT[name] = now; active[name] = (active[name] || 0) + 1;
    setTimeout(function () { active[name]--; }, 160);
    try { V[name](p || 1); } catch (e) { /* audio opcional */ }
  };
})();
