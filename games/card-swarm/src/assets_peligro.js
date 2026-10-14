/* assets_peligro.js - Jefes J3: stingers de música/SFX por jefe y fase, hechos por código (WebAudio) sobre el motor de sfx.js (G.Snd).
   El audio de música (Assets.music) solo tiene las pistas 'normal' y 'boss' con capas por intensidad; aquí se añade el "color" propio de cada jefe en cada cambio de fase:
   Pastor (zampoña disonante y tambor de marcha, 96 BPM), Karceron (yunque, cadenas y sirena, 70 BPM), Letea (arpegio acuático con eco, 110 BPM).
   Nombres: stg_<jefe>_<intro|p2|p3|despair>, stg_part (rotura de parte), stg_prep (preparación de cacería), stg_peligro (Peligro >= IV al empezar). Se reproducen con G.Boss.stinger(). */
(function () {
  'use strict';
  var G = window.G, S = G.Snd;
  if (!S || !S.V || !S.tone) return;
  var V = S.V, tone = S.tone, hiss = S.hiss;
  function pair(type, f, dur, vol, d, det) { tone(type, f, f, dur, vol, d); tone(type, f * (det || 1.012), f * (det || 1.012), dur, vol * 0.8, d); }

  // ---- Pastor: flauta disonante (tritono) + tambor de marcha; F2 coro grave; F3 percusión rápida
  V.stg_pastor_intro = function () { pair('triangle', 293.7, 0.5, 0.07, 0); pair('triangle', 415.3, 0.5, 0.07, 0.25); pair('triangle', 277.2, 0.7, 0.07, 0.5); tone('sine', 80, 50, 0.3, 0.2, 0); tone('sine', 80, 50, 0.3, 0.2, 0.5); };
  V.stg_pastor_p2 = function () { [98, 110, 98, 82.4].forEach(function (f, i) { tone('sawtooth', f, f * 0.98, 0.45, 0.07, i * 0.3); tone('sine', f * 2, f * 2, 0.45, 0.05, i * 0.3); }); hiss('lowpass', 600, 150, 0.5, 0.18, 0); };
  V.stg_pastor_p3 = function () { for (var i = 0; i < 8; i++) { tone('sine', 120, 55, 0.12, 0.2, i * 0.09); hiss('bandpass', 1800, 700, 0.05, 0.1, i * 0.09 + 0.045); } pair('triangle', 392, 0.5, 0.06, 0.4, 1.03); };
  V.stg_pastor_despair = function () { tone('sawtooth', 70, 300, 1.2, 0.12, 0); tone('sawtooth', 73, 310, 1.2, 0.1, 0); [0, 0.3, 0.6, 0.9].forEach(function (d) { tone('sine', 90, 45, 0.25, 0.25, d); }); hiss('highpass', 1500, 4000, 0.9, 0.08, 0.2); };

  // ---- Karceron: yunque + cadenas; F2 ritmo de fragua; F3 sirena de lava
  V.stg_karceron_intro = function () { tone('square', 523, 500, 0.5, 0.06, 0); tone('square', 1046, 1000, 0.5, 0.04, 0); hiss('highpass', 5000, 2500, 0.3, 0.08, 0); tone('sine', 55, 40, 0.7, 0.3, 0); tone('sine', 55, 40, 0.7, 0.3, 0.6); tone('square', 523, 500, 0.5, 0.06, 0.6); };
  V.stg_karceron_p2 = function () { for (var i = 0; i < 6; i++) { tone('square', i % 2 ? 392 : 523, 380, 0.14, 0.05, i * 0.17); hiss('highpass', 6000, 3000, 0.07, 0.09, i * 0.17); } tone('sine', 50, 38, 0.6, 0.28, 0); };
  V.stg_karceron_p3 = function () { tone('sawtooth', 300, 700, 0.9, 0.08, 0); tone('sawtooth', 700, 300, 0.9, 0.08, 0.9); hiss('lowpass', 900, 200, 1.4, 0.2, 0); tone('sine', 45, 35, 1, 0.3, 0); };
  V.stg_karceron_despair = function () { for (var i = 0; i < 5; i++) { tone('sawtooth', 220, 700, 0.5, 0.06, i * 0.4); tone('sawtooth', 700, 220, 0.5, 0.06, i * 0.4 + 0.2); } hiss('lowpass', 1200, 100, 2, 0.25, 0); tone('sine', 60, 30, 1.5, 0.3, 0); };

  // ---- Letea: arpegio acuático con eco; F2 oleaje; F3 rayos y disonancia
  function arp(notes, step, type, vol) { notes.forEach(function (f, i) { tone(type || 'sine', f, f, 0.4, vol || 0.07, i * step); tone(type || 'sine', f, f, 0.4, (vol || 0.07) * 0.45, i * step + 0.2); }); }
  V.stg_letea_intro = function () { arp([440, 523, 659, 880, 659], 0.11); hiss('bandpass', 900, 400, 0.6, 0.06, 0); };
  V.stg_letea_p2 = function () { hiss('bandpass', 400, 1600, 0.9, 0.14, 0); hiss('bandpass', 1600, 300, 0.9, 0.12, 0.9); arp([392, 494, 587, 784], 0.12); };
  V.stg_letea_p3 = function () { arp([440, 466, 659, 698], 0.1, 'triangle', 0.07); hiss('highpass', 4000, 1500, 0.15, 0.2, 0.3); hiss('highpass', 4000, 1500, 0.15, 0.2, 0.7); tone('sawtooth', 1200, 200, 0.2, 0.08, 0.3); };
  V.stg_letea_despair = function () { for (var i = 0; i < 3; i++) { arp([330, 392, 494], 0.08, 'sine', 0.08); tone('sawtooth', 1100, 120, 0.15, 0.07, i * 0.5 + 0.2); } hiss('bandpass', 500, 2000, 1.5, 0.1, 0); };

  // ---- comunes
  V.stg_part = function () { tone('triangle', 880, 1320, 0.12, 0.06, 0); tone('triangle', 1320, 1760, 0.14, 0.05, 0.08); hiss('highpass', 5000, 2500, 0.1, 0.09, 0); };
  V.stg_prep = function () { [392, 523, 659].forEach(function (f, i) { tone('triangle', f, f, 0.25, 0.07, i * 0.09); }); tone('sine', 98, 98, 0.5, 0.12, 0); };
  V.stg_peligro = function () { tone('sawtooth', 110, 55, 0.8, 0.12, 0); tone('square', 220, 110, 0.5, 0.05, 0); hiss('lowpass', 800, 100, 0.7, 0.18, 0); };
})();
