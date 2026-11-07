/* sfx_fusion2.js - SFX procedurales de los 8 poderes restantes (prototipo Fusión). Requiere sfx.js (G.Snd.V/tone/hiss); cargar tras sfx_fusion.js.
   Poderes (id): tormenta, toxica, pacto, iman, forja, filo, hemo, descarga.
   Por poder: fx_<id> (lanzamiento), fx_<id>_hit (impacto), fx_<id>_zone (loop corto, repetir cada ~450 ms), fx_<id>_ready (cooldown listo, tono propio),
   fx_<id>_fuse (fusión conseguida, tonalidad propia). Genéricos: fx_replace (reemplazo de poder), fx_btn_ready (botón activo listo), fx_btn_cancel (cooldown cancelado).
   Atajo: G.Snd.fx2(id, tipo, pitch) con tipo 'cast'|'hit'|'zone'|'ready'|'fuse'. Suenan con G.Snd.play(nombre, pitch). */
(function () {
  'use strict';
  var G = window.G, S = G.Snd, V = S.V, tone = S.tone, hiss = S.hiss;
  if (!V || !tone) return;
  function arp(fs, type, dur, vol, step, k) { fs.forEach(function (f, i) { tone(type, f * k, f * k * 1.004, dur, vol, i * step); }); }

  // ---- lanzamiento
  V.fx_tormenta = function (p) { tone('sine', 1500 * p, 500, 0.4, 0.07); hiss('highpass', 4000, 1500, 0.3, 0.1); tone('sawtooth', 900 * p, 90, 0.18, 0.07, 0.12); tone('sine', 90 * p, 45, 0.4, 0.14, 0.15); };
  V.fx_toxica   = function (p) { [0, 0.07, 0.14].forEach(function (d, i) { tone('sine', (260 + i * 90) * p, (600 + i * 120) * p, 0.1, 0.08, d); hiss('bandpass', 2500, 1500, 0.06, 0.07, d); }); tone('triangle', 1800 * p, 1200, 0.2, 0.04, 0.2); };
  V.fx_pacto    = function (p) { tone('sine', 150 * p, 40, 0.5, 0.22); tone('sawtooth', 220 * p, 80, 0.35, 0.09); hiss('lowpass', 2200, 120, 0.5, 0.28, 0.04); tone('sine', 60, 55, 0.25, 0.1, 0.02); };
  V.fx_iman     = function (p) { tone('sawtooth', 120 * p, 520 * p, 0.45, 0.08); tone('square', 80 * p, 360 * p, 0.45, 0.04); hiss('bandpass', 700, 3000, 0.4, 0.1); tone('sawtooth', 1200 * p, 200, 0.12, 0.07, 0.45); hiss('highpass', 3500, 1500, 0.1, 0.07, 0.45); };
  V.fx_forja    = function (p) { tone('sine', 100 * p, 50, 0.35, 0.2); hiss('lowpass', 2500, 300, 0.35, 0.2); tone('triangle', 700 * p, 300, 0.3, 0.1, 0.03); tone('triangle', 1500 * p, 1000, 0.3, 0.05, 0.03); };
  V.fx_filo     = function (p) { for (var i = 0; i < 7; i++) { tone('triangle', (2400 + i * 160) * p, 1500, 0.08, 0.04, i * 0.018); } hiss('highpass', 5500, 3500, 0.2, 0.09); tone('sine', 400 * p, 250, 0.15, 0.06); };
  V.fx_hemo     = function (p) { tone('sine', 110 * p, 55, 0.3, 0.16); [0, 0.09, 0.18].forEach(function (d) { tone('sine', 220 * p, 140, 0.12, 0.08, d); hiss('lowpass', 800, 200, 0.08, 0.08, d); }); tone('sine', 330 * p, 480 * p, 0.25, 0.05, 0.25); };
  V.fx_descarga = function (p) { hiss('highpass', 3000, 800, 0.5, 0.14); tone('sawtooth', 1800 * p, 70, 0.4, 0.1); tone('square', 120 * p, 50, 0.5, 0.12, 0.05); tone('sine', 60, 40, 0.5, 0.18, 0.08); hiss('lowpass', 500, 80, 0.4, 0.15, 0.1); };

  // ---- impacto (corto, para ticks y golpes; ya limitado por el tope de voces de S.play)
  V.fx_tormenta_hit = function (p) { tone('sawtooth', 2000 * p, 150, 0.09, 0.07); hiss('highpass', 5000, 2500, 0.06, 0.08); tone('sine', 90 * p, 50, 0.12, 0.1); };
  V.fx_toxica_hit   = function (p) { hiss('lowpass', 1400, 300, 0.14, 0.14); tone('sine', 500 * p, 160, 0.14, 0.1); tone('sine', 260 * p, 520, 0.08, 0.06, 0.05); };
  V.fx_pacto_hit    = function (p) { hiss('lowpass', 1600, 100, 0.3, 0.25); tone('sine', 120 * p, 40, 0.3, 0.22); tone('sawtooth', 260 * p, 90, 0.15, 0.06); };
  V.fx_iman_hit     = function (p) { tone('square', 1500 * p, 300, 0.06, 0.06); hiss('highpass', 4000, 2000, 0.07, 0.09); tone('sawtooth', 700 * p, 120, 0.1, 0.07); };
  V.fx_forja_hit    = function (p) { tone('triangle', 900 * p, 400, 0.16, 0.1); hiss('bandpass', 3500, 1500, 0.1, 0.12); tone('sine', 110 * p, 60, 0.15, 0.14); };
  V.fx_filo_hit     = function (p) { tone('triangle', 2600 * p, 1800, 0.07, 0.06); hiss('highpass', 6000, 4000, 0.05, 0.08); tone('sine', 3400 * p, 2400, 0.1, 0.03, 0.02); };
  V.fx_hemo_hit     = function (p) { tone('sine', 140 * p, 60, 0.12, 0.14); hiss('lowpass', 600, 150, 0.08, 0.1); tone('sine', 200 * p, 380 * p, 0.1, 0.05, 0.05); };
  V.fx_descarga_hit = function (p) { tone('sawtooth', 1400 * p, 100, 0.12, 0.08); hiss('highpass', 3500, 1200, 0.1, 0.1); tone('sine', 220 * p, 110, 0.1, 0.08); };

  // ---- zona / loop corto (~0,4 s, volumen bajo para que repetirlo no sature)
  V.fx_tormenta_zone = function (p) { hiss('bandpass', 2500, 1800, 0.4, 0.045); tone('sine', 60 * p, 50, 0.4, 0.05); tone('sawtooth', 1700 * p, 300, 0.05, 0.03, 0.18); };
  V.fx_toxica_zone   = function (p) { hiss('lowpass', 700, 400, 0.4, 0.05); [0, 0.15, 0.28].forEach(function (d, i) { tone('sine', (180 + i * 40) * p, (360 + i * 60) * p, 0.08, 0.04, d); }); };
  V.fx_pacto_zone    = function (p) { tone('sine', 70 * p, 66 * p, 0.4, 0.07); tone('triangle', 140 * p, 150 * p, 0.4, 0.03); hiss('lowpass', 500, 300, 0.4, 0.04); };
  V.fx_iman_zone     = function (p) { tone('sawtooth', 100 * p, 130 * p, 0.4, 0.045); tone('sine', 400 * p, 600 * p, 0.4, 0.03); hiss('bandpass', 1500, 2200, 0.4, 0.035); };
  V.fx_forja_zone    = function (p) { tone('sawtooth', 300 * p, 220 * p, 0.35, 0.04); hiss('bandpass', 1200, 700, 0.35, 0.06); tone('sine', 90 * p, 70, 0.3, 0.05); };
  V.fx_filo_zone     = function (p) { hiss('highpass', 6000, 4500, 0.3, 0.035); tone('sine', 2800 * p, 2600, 0.3, 0.02); };
  V.fx_hemo_zone     = function (p) { tone('sine', 70 * p, 60, 0.18, 0.09); tone('sine', 70 * p, 60, 0.18, 0.07, 0.22); hiss('lowpass', 400, 200, 0.4, 0.03); };
  V.fx_descarga_zone = function (p) { hiss('highpass', 4500, 2500, 0.3, 0.04); tone('square', 800 * p, 400, 0.05, 0.025); tone('square', 1100 * p, 500, 0.05, 0.025, 0.17); };

  // ---- listo (cooldown) y fusión: tono propio por poder, a partir del mismo motivo
  var ROOT = { tormenta: 1.0, toxica: 0.89, pacto: 0.75, iman: 0.84, forja: 0.8, filo: 1.19, hemo: 0.7, descarga: 1.12 };
  Object.keys(ROOT).forEach(function (id) {
    var k = ROOT[id];
    V['fx_' + id + '_ready'] = function () { tone('triangle', 880 * k, 1320 * k, 0.09, 0.07); tone('sine', 1760 * k, 1760 * k, 0.12, 0.05, 0.06); tone('sine', 2640 * k, 2640 * k, 0.1, 0.025, 0.12); };
    V['fx_' + id + '_fuse'] = function () {
      arp([330, 440, 550, 660, 880, 1100], 'square', 0.2, 0.045, 0.065, k);
      arp([660, 880, 1100, 1320, 1760, 2200], 'triangle', 0.3, 0.035, 0.065, k);
      tone('sine', 110 * k, 220 * k, 0.6, 0.18); hiss('highpass', 6000, 2500, 0.5, 0.06, 0.3);
      V['fx_' + id](1); // el propio sonido de lanzamiento cierra el acorde
    };
  });

  // ---- genéricos
  V.fx_replace    = function () { hiss('bandpass', 3000, 800, 0.2, 0.14); tone('sawtooth', 600, 120, 0.2, 0.07); tone('triangle', 330, 495, 0.14, 0.07, 0.18); tone('triangle', 495, 660, 0.14, 0.07, 0.26); };
  V.fx_btn_ready  = function () { tone('sine', 1320, 1320, 0.07, 0.06); tone('triangle', 1980, 1980, 0.12, 0.05, 0.05); hiss('highpass', 7000, 5000, 0.08, 0.025, 0.04); };
  V.fx_btn_cancel = function () { tone('square', 420, 160, 0.14, 0.05); tone('sine', 300, 100, 0.16, 0.08); hiss('lowpass', 1200, 200, 0.1, 0.06); };

  S.fx2 = function (id, kind, pitch) { S.play('fx_' + id + (kind && kind !== 'cast' ? '_' + kind : ''), pitch); };
  S.fx2names = Object.keys(V).filter(function (n) { return /^fx_(tormenta|toxica|pacto|iman|forja|filo|hemo|descarga)|^fx_(replace|btn_ready|btn_cancel)$/.test(n); });
})();
