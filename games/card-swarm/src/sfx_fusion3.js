/* sfx_fusion3.js - SFX procedurales de las fusiones 13-15 (prototipo Fusión). Requiere sfx.js; cargar tras sfx_fusion2.js.
   Poderes (id): cristal (ward), zancada (dash), virote (bolt).
   Por poder: fx_<id> (lanzamiento), fx_<id>_hit, fx_<id>_zone (loop ~450 ms), fx_<id>_ready, fx_<id>_fuse (ROOT propio).
   fx_virote_zone es un eco suave de _hit (no hay campo). Atajo: G.Snd.fx2(id, tipo, pitch) (definido en sfx_fusion2.js). Volumen max 0,22. */
(function () {
  'use strict';
  var G = window.G, S = G.Snd, V = S.V, tone = S.tone, hiss = S.hiss;
  if (!V || !tone) return;
  function arp(fs, type, dur, vol, step, k) { fs.forEach(function (f, i) { tone(type, f * k, f * k * 1.004, dur, vol, i * step); }); }

  // ---- lanzamiento
  V.fx_cristal  = function (p) { tone('triangle', 1600 * p, 2400 * p, 0.3, 0.07); tone('sine', 2000 * p, 3000 * p, 0.25, 0.03, 0.05); tone('sine', 90 * p, 60, 0.4, 0.15); hiss('highpass', 6000, 4000, 0.3, 0.06, 0.04); };
  V.fx_zancada  = function (p) { hiss('bandpass', 1500, 4000, 0.25, 0.14); tone('sawtooth', 1800 * p, 90, 0.22, 0.08, 0.02); tone('sine', 110 * p, 55, 0.3, 0.18, 0.04); };
  V.fx_virote   = function (p) { tone('triangle', 300 * p, 120, 0.1, 0.1); hiss('bandpass', 2500, 900, 0.3, 0.09, 0.04); tone('sine', 140 * p, 70, 0.2, 0.12, 0.1); tone('square', 520 * p, 260, 0.06, 0.04, 0.1); };

  // ---- impacto
  V.fx_cristal_hit = function (p) {
    hiss('highpass', 6000, 3000, 0.3, 0.13);
    [2200, 2900, 3500, 1900].forEach(function (f, i) { tone('triangle', f * p, f * p * 0.7, 0.08, 0.05, i * 0.05); });
    tone('sine', 100 * p, 45, 0.3, 0.18);
  };
  V.fx_zancada_hit = function (p) { tone('sawtooth', 1600 * p, 400, 0.05, 0.05); hiss('lowpass', 600, 200, 0.1, 0.12); tone('sine', 140 * p, 70, 0.09, 0.1); };
  V.fx_virote_hit  = function (p) { tone('triangle', 900 * p, 400, 0.18, 0.1); hiss('lowpass', 1400, 300, 0.25, 0.09, 0.03); tone('sine', 120 * p, 60, 0.1, 0.1); };

  // ---- zona / loop corto
  V.fx_cristal_zone = function (p) { tone('sine', 2800 * p, 2800 * p, 0.3, 0.02); tone('sine', 70 * p, 62 * p, 0.1, 0.07); tone('sine', 70 * p, 62 * p, 0.1, 0.05, 0.16); };
  V.fx_zancada_zone = function (p) { hiss('highpass', 4500, 3000, 0.25, 0.03); tone('square', 800 * p, 500, 0.04, 0.025); tone('square', 1100 * p, 600, 0.04, 0.025, 0.12); };
  V.fx_virote_zone  = function (p) { hiss('lowpass', 1400, 400, 0.15, 0.03); tone('triangle', 900 * p, 500, 0.08, 0.025); };

  // ---- listo y fusión (mismo motivo que sfx_fusion2.js)
  var ROOT = { cristal: 1.26, zancada: 0.95, virote: 0.67 };
  Object.keys(ROOT).forEach(function (id) {
    var k = ROOT[id];
    V['fx_' + id + '_ready'] = function () { tone('triangle', 880 * k, 1320 * k, 0.09, 0.07); tone('sine', 1760 * k, 1760 * k, 0.12, 0.05, 0.06); tone('sine', 2640 * k, 2640 * k, 0.1, 0.025, 0.12); };
    V['fx_' + id + '_fuse'] = function () {
      arp([330, 440, 550, 660, 880, 1100], 'square', 0.2, 0.045, 0.065, k);
      arp([660, 880, 1100, 1320, 1760, 2200], 'triangle', 0.3, 0.035, 0.065, k);
      tone('sine', 110 * k, 220 * k, 0.6, 0.18); hiss('highpass', 6000, 2500, 0.5, 0.06, 0.3);
      V['fx_' + id](1);
    };
  });

  var re = /^fx_(cristal|zancada|virote)/;
  S.fx3names = Object.keys(V).filter(function (n) { return re.test(n); });
  S.fx2names = (S.fx2names || []).concat(S.fx3names);
})();
