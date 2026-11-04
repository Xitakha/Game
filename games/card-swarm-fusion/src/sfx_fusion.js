/* sfx_fusion.js - SFX procedurales mínimos de los poderes activos (prototipo Fusión). Se registran en G.Snd.V y suenan con G.Snd.play(nombre, pitch).
   fx_vapor (siseo), fx_plasma (zumbido de rayo, corto: se repite en la canalización), fx_gas (granada + burbujeo), fx_gas_boom (detonación),
   fx_sed (tres filos), fx_ready (poder listo), fx_deny (no hay objetivo), fx_fusion (confirmación de fusión), fx_btn (pulsación del botón). */
(function () {
  'use strict';
  var G = window.G, S = G.Snd, V = S.V, tone = S.tone, hiss = S.hiss;
  if (!V || !tone) return;
  V.fx_vapor    = function (p) { hiss('bandpass', 2200 * p, 700, 0.5, 0.22); hiss('highpass', 5000, 2500, 0.3, 0.08, 0.05); tone('sine', 300 * p, 180, 0.35, 0.08); };
  V.fx_plasma   = function (p) { tone('sawtooth', 90 * p, 60, 0.3, 0.1); tone('square', 640 * p, 320, 0.25, 0.04); hiss('bandpass', 1800, 900, 0.3, 0.1); };
  V.fx_gas      = function (p) { tone('triangle', 520 * p, 180, 0.18, 0.1); hiss('lowpass', 900, 200, 0.2, 0.12, 0.2); [0, 1, 2].forEach(function (i) { tone('sine', 200 * p * (1 + i * 0.3), 420 * p, 0.09, 0.07, 0.35 + i * 0.07); }); };
  V.fx_gas_boom = function (p) { hiss('lowpass', 1800, 100, 0.45, 0.4); tone('sine', 130 * p, 38, 0.4, 0.34); tone('sawtooth', 300 * p, 70, 0.25, 0.1); };
  V.fx_sed      = function (p) { [0, 0.07, 0.14].forEach(function (d, i) { tone('triangle', (1300 + i * 220) * p, 800, 0.1, 0.08, d); hiss('bandpass', 4500, 3000, 0.05, 0.07, d); }); tone('sine', 110 * p, 60, 0.3, 0.12); };
  V.fx_ready    = function () { tone('triangle', 880, 1320, 0.09, 0.07); tone('sine', 1760, 1760, 0.12, 0.05, 0.06); };
  V.fx_deny     = function () { tone('square', 180, 120, 0.12, 0.06); };
  V.fx_fusion   = function () { [330, 495, 660, 990, 1320].forEach(function (f, i) { tone('square', f, f * 1.005, 0.22, 0.05, i * 0.07); tone('triangle', f * 2, f * 2, 0.3, 0.04, i * 0.07 + 0.02); }); tone('sine', 110, 220, 0.6, 0.2); hiss('highpass', 6000, 2500, 0.5, 0.07, 0.3); };
  V.fx_btn      = function () { tone('triangle', 500, 700, 0.05, 0.05); };
})();
