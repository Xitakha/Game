/* sfx_minis.js - Audio de los 8 minijefes (P4.5; DESIGN-v6-minijefes.md seccion 8). Script clasico, tras sfx_yarlak.js. Solo audio, sin tocar logica ni lo existente.
   Contexto WebAudio propio (como sfx_fam1/2/3 y sfx_yarlak) que sigue desbloqueo, mute, volumen y suspend de Assets. <= 4 voces por nombre, pitch +-10 %, separacion minima (min, ms).
   kind: 'tele' = aviso (sube y se sostiene, ataque suave y ~6 dB menos que el golpe; nunca un golpe seco), 'impact' = golpe (ataque rapido, grave + ruido),
   'move' = movimiento/ambiente, 'stinger' = jingle de evento. Firmas (ataque F) +3 dB. Un solo rugido a la vez (mini_spawn_roar, mini_enrage_roar, yetim_roar, vent_howl se bloquean entre si).
   Timbres: bosque = lana/madera/viento; cripta = metal/cadenas/magma; asfodelo = agua/almas/olvido; tundra = hielo/viento.
   Los 4 stingers tambien en G.Snd.V: stg_mini_spawn / stg_mini_enrage / stg_mini_part / stg_mini_die (y como Assets.sfx con el mismo nombre). */
(function () {
  'use strict';
  var A = window.Assets;
  if (!A || A._minis) return;
  A._minis = true;

  function T(t, f0, f1, d, v, o) { var L = { t: t, f: [f0, f1], d: d, v: v }; if (o) for (var k in o) L[k] = o[k]; return L; }
  function N(type, f0, f1, d, v, q, o) { var L = { n: 1, d: d, v: v, flt: { t: type, f: [f0, f1], q: q || 1 } }; if (o) for (var k in o) L[k] = o[k]; return L; }
  function th(f0, f1, d, v, o) { return T('sine', f0, f1, d, v, o || {}); }
  function cat() { var r = []; for (var i = 0; i < arguments.length; i++) r = r.concat(arguments[i]); return r; }
  function bursts(n, step, mk) { var r = []; for (var i = 0; i < n; i++) r.push(mk(i, i * step + (i % 2) * step * 0.18)); return r; }
  function bell(f, v, d, dl) { return [th(f, f, d, v, { delay: dl || 0, a: 0.003 }), th(f * 2.76, f * 2.76, d * 0.5, v * 0.3, { delay: dl || 0, a: 0.003 })]; }
  function thud(v, dl, f) { f = f || 1; return [th(70 * f, 26, 0.34, 0.9 * v, { delay: dl, a: 0.003 }), N('lowpass', 1100, 120, 0.2, 0.3 * v, 0.8, { delay: dl, a: 0.001 })]; }
  function ticks(n, step, f, v, dl0) { return bursts(n, step, function (i, dl) { return N('bandpass', f + i * 300, f + 400, 0.02, v, 8, { delay: (dl0 || 0) + dl, a: 0.0008 }); }); }
  function shatter(v, dl) { dl = dl || 0; return [N('highpass', 2500, 8000, 0.3, 0.22 * v, 1, { delay: dl, a: 0.001 }), th(3000, 2900, 0.25, 0.06 * v, { delay: dl }), th(4400, 4300, 0.2, 0.04 * v, { delay: dl + 0.03 }), N('bandpass', 6200, 3600, 0.08, 0.14 * v, 7, { delay: dl + 0.12, a: 0.001 })]; }
  // --- bosque: madera / lana / viento
  function wood(v, dl, f) { f = f || 1; return [th(210 * f, 80 * f, 0.16, 0.8 * v, { delay: dl, a: 0.002 }), N('bandpass', 900 * f, 400, 0.1, 0.35 * v, 3, { delay: dl, a: 0.001 }), th(480 * f, 300 * f, 0.08, 0.2 * v, { delay: dl, a: 0.001 })]; }
  function crack(v, dl) { return [N('bandpass', 2200, 700, 0.09, 0.45 * v, 4, { delay: dl, a: 0.0008 }), N('bandpass', 1300, 500, 0.12, 0.3 * v, 3, { delay: dl + 0.03, a: 0.0008 }), th(260, 90, 0.2, 0.5 * v, { delay: dl, a: 0.002 })]; }
  function windUp(d, v, f0, f1) { return N('bandpass', f0, f1, d, v, 1.4, { a: d * 0.65 }); }
  function bleat(f, d, v, dl) { return [T('sawtooth', f, f * 0.8, d, v, { delay: dl || 0, a: 0.04, vib: [26, 90], flt: { t: 'bandpass', f: [1100, 800], q: 4 } }), T('triangle', f * 2, f * 1.6, d, v * 0.4, { delay: dl || 0, a: 0.04, vib: [30, 60] })]; }
  // --- cripta: metal / cadenas / magma
  function clang(f, v, d, dl) { dl = dl || 0; d = d || 0.5; return [T('square', f, f * 0.99, d * 0.5, 0.05 * v, { delay: dl, a: 0.001, flt: { t: 'bandpass', f: [f * 2, f * 1.8], q: 6 } }), th(f * 1.51, f * 1.5, d, 0.1 * v, { delay: dl, a: 0.001 }), th(f * 2.76, f * 2.75, d * 0.6, 0.06 * v, { delay: dl, a: 0.001 }), N('highpass', 4500, 7000, 0.06, 0.12 * v, 1, { delay: dl, a: 0.0005 })]; }
  function links(n, step, v, dl0, f) { return bursts(n, step, function (i, dl) { return N('bandpass', (f || 3200) + (i % 3) * 420, (f || 3200) - 600, 0.05, v, 9, { delay: (dl0 || 0) + dl, a: 0.0006 }); }).concat(bursts(n, step, function (i, dl) { return th(1500 + (i % 4) * 230, 1400, 0.07, v * 0.25, { delay: (dl0 || 0) + dl, a: 0.0008 }); })); }
  function magma(d, v, dl) { return [N('lowpass', 420, 160, d, 0.28 * v, 2, { delay: dl || 0, a: d * 0.2 }), th(52, 38, d, 0.3 * v, { delay: dl || 0, a: d * 0.2 })].concat(bursts(Math.max(2, Math.round(d * 7)), d / Math.max(2, Math.round(d * 7)), function (i, dl2) { return th(110 + (i % 3) * 50, 55, 0.09, 0.2 * v, { delay: (dl || 0) + dl2, a: 0.004 }); })); }
  function hiss(d, v, dl, a) { return N('highpass', 3500, 6500, d, 0.2 * v, 1, { delay: dl || 0, a: a == null ? 0.02 : a }); }
  // --- asfodelo: agua / almas / olvido
  function bubbles(n, step, v, dl0, f) { return bursts(n, step, function (i, dl) { var b = (f || 320) * (1 + (i % 4) * 0.35); return th(b, b * 2.4, 0.09, v, { delay: (dl0 || 0) + dl, a: 0.004 }); }); }
  function drop(f, v, dl) { return [th(f * 1.8, f * 0.9, 0.16, v, { delay: dl, a: 0.002 }), N('bandpass', f * 5, f * 3, 0.04, v * 0.4, 4, { delay: dl, a: 0.001 })]; }
  function soul(f0, f1, d, v, dl, o) { var q = { delay: dl || 0, a: d * 0.4, vib: [5, 30], flt: { t: 'lowpass', f: [1500, 900], q: 1 } }; if (o) for (var k in o) q[k] = o[k]; return T('triangle', f0, f1, d, v, q); }
  function splash(v, dl) { return [N('bandpass', 1400, 500, 0.3, 0.3 * v, 0.9, { delay: dl, a: 0.004 }), th(150, 55, 0.3, 0.7 * v, { delay: dl, a: 0.003 })].concat(bubbles(4, 0.05, 0.08 * v, dl + 0.03)); }
  // --- tundra: hielo / viento
  function gust(d, v, f0, f1, o) { return N('bandpass', f0, f1, d, v, 0.9, o || { a: d * 0.35 }); }

  var DEFS = {
    // ======================= COMUNES
    mini_spawn_roar: { kind: 'tele', min: 1200, roar: 1, L: cat([   // rugido grave de entrada: cuerpo + capa de aire (menos largo que el de jefe)
      T('sawtooth', 70, 112, 1.5, 0.15, { a: 0.18, sus: 0.6, vib: [16, 40], flt: { t: 'lowpass', f: [280, 760], q: 3 } }), th(42, 58, 1.5, 0.28, { a: 0.2 }),
      N('bandpass', 500, 1100, 1.5, 0.07, 1.5, { a: 0.25, sus: 0.6 }), T('sawtooth', 210, 330, 0.7, 0.04, { delay: 0.2, a: 0.1, vib: [8, 60], flt: { t: 'bandpass', f: [800, 1300], q: 3 } }),
      T('sawtooth', 330, 170, 0.6, 0.035, { delay: 0.9, a: 0.05, vib: [8, 60], flt: { t: 'bandpass', f: [1300, 700], q: 3 } })]) },
    mini_enrage_roar: { kind: 'tele', min: 1200, roar: 1, L: cat([   // enrage: mas agudo y rasposo, sube y se queda (distinto del de entrada)
      T('sawtooth', 96, 170, 1.3, 0.14, { a: 0.1, sus: 0.7, vib: [24, 55], flt: { t: 'lowpass', f: [380, 1100], q: 4 } }), T('square', 48, 85, 1.3, 0.06, { a: 0.1, flt: { t: 'lowpass', f: [240, 480], q: 1 } }),
      th(46, 66, 1.3, 0.28, { a: 0.1 }), N('bandpass', 900, 2400, 1.3, 0.09, 2, { a: 0.2, sus: 0.7 }), T('sawtooth', 520, 880, 0.9, 0.035, { delay: 0.1, a: 0.3, vib: [14, 80], flt: { t: 'bandpass', f: [1200, 2200], q: 3 } })]) },
    mini_part_break: { kind: 'impact', min: 250, L: cat(crack(1, 0), [th(140, 40, 0.35, 0.8, { a: 0.002 }), N('lowpass', 1600, 150, 0.25, 0.3, 1, { a: 0.001 })], bell(988, 0.07, 1, 0.1), bell(1480, 0.04, 0.8, 0.16)) },
    mini_expose_chime: { kind: 'move', min: 300, L: cat(bell(1319, 0.07, 0.9, 0), bell(1760, 0.07, 1.1, 0.09), [N('highpass', 6000, 9000, 0.25, 0.03, 1, { delay: 0.1, a: 0.08 })]) },
    mini_die: { kind: 'impact', min: 1500, L: cat([th(70, 22, 1.8, 0.95, { a: 0.004 }), N('lowpass', 1500, 80, 1.6, 0.3, 0.8, { a: 0.02, sus: 0.3 }), T('sawtooth', 120, 40, 1.2, 0.1, { a: 0.02, vib: [12, 40], flt: { t: 'lowpass', f: [600, 120], q: 2 } }), N('bandpass', 700, 200, 1.4, 0.09, 1.2, { a: 0.1 })],
      thud(0.7, 0.55, 0.85), thud(0.5, 1.05, 0.7), crack(0.5, 0.05), bell(392, 0.04, 1.4, 0.8)) },
    mini_insignia: { kind: 'move', min: 400, L: cat(bell(1568, 0.06, 0.5, 0), bell(2093, 0.06, 0.5, 0.07), bell(2637, 0.05, 0.7, 0.14), [N('highpass', 7000, 9000, 0.2, 0.03, 1, { delay: 0.12, a: 0.04 })]) },

    // ======================= CARNERO MAYOR (bosque: lana, madera, viento)
    ram_snort: { kind: 'tele', min: 400, L: [   // resoplido (aviso de la cornada, 650 ms): aire de nariz que sube + cuernos que rascan
      windUp(0.65, 0.2, 300, 1800), th(80, 120, 0.65, 0.2, { a: 0.4 }), N('bandpass', 1500, 3200, 0.65, 0.05, 5, { a: 0.45 }), T('triangle', 160, 210, 0.65, 0.05, { a: 0.4, vib: [9, 30] })] },
    ram_horn_scrape: { kind: 'impact', min: 160, L: cat([N('bandpass', 1800, 600, 0.22, 0.28, 2.5, { a: 0.01 }), T('sawtooth', 300, 140, 0.2, 0.05, { a: 0.01, flt: { t: 'bandpass', f: [900, 500], q: 4 } })], wood(0.9, 0.1, 0.8), thud(0.5, 0.12, 1.1)) },
    ram_charge_wind: { kind: 'tele', min: 600, L: [   // patas traseras hundidas + vapor (900 ms): rumor que sube con latidos de pezunas
      T('sawtooth', 55, 110, 0.9, 0.1, { a: 0.5, vib: [18, 30], flt: { t: 'lowpass', f: [220, 700], q: 3 } }), th(46, 80, 0.9, 0.22, { a: 0.5 }), windUp(0.9, 0.13, 350, 1900),
      N('bandpass', 2400, 3400, 0.9, 0.03, 6, { a: 0.6 })].concat(bursts(4, 0.18, function (i, dl) { return N('lowpass', 500, 160, 0.08, 0.14 + i * 0.03, 1, { delay: 0.1 + dl, a: 0.002 }); })) },
    ram_charge_crash: { kind: 'impact', min: 300, L: cat(thud(1.1, 0, 0.85), wood(1, 0, 0.7), crack(0.8, 0.01), [N('lowpass', 1800, 100, 0.4, 0.4, 0.8, { a: 0.001 }), th(55, 22, 0.7, 0.55, { delay: 0.2, a: 0.01 })], bursts(5, 0.06, function (i, dl) { return N('bandpass', 1000 + i * 150, 500, 0.06, 0.15, 4, { delay: 0.12 + dl, a: 0.001 }); })) },
    ram_horn_break: { kind: 'impact', min: 300, L: cat(crack(1, 0), crack(0.7, 0.07), thud(0.8, 0.02, 1.2), bursts(6, 0.045, function (i, dl) { return N('bandpass', 2600 + i * 200, 1400, 0.05, 0.16, 6, { delay: 0.1 + dl, a: 0.001 }); }), bell(440, 0.05, 0.7, 0.12)) },
    ram_bleat: { kind: 'tele', min: 700, L: cat(bleat(300, 0.45, 0.1, 0), bleat(340, 0.4, 0.09, 0.4), [th(70, 90, 0.8, 0.12, { a: 0.3 }), N('bandpass', 400, 1100, 0.8, 0.04, 1.2, { a: 0.4 })], bell(520, 0.025, 0.5, 0.45)) },   // balido del rebano (800 ms): 2 balidos + notas
    ram_stun: { kind: 'move', min: 500, L: cat([T('triangle', 420, 160, 0.9, 0.08, { a: 0.01, vib: [7, 130], flt: { t: 'lowpass', f: [1200, 400], q: 2 } })], wood(0.5, 0, 0.7), bursts(3, 0.22, function (i, dl) { return th(900 - i * 150, 420 - i * 80, 0.14, 0.06, { delay: 0.3 + dl, a: 0.004, vib: [30, 60] }); })) },

    // ======================= TEJEDORA DE ZARZAS (bosque)
    weaver_root_tele: { kind: 'tele', min: 700, L: [   // 4 lineas bajo tierra (900 ms): crujido de raices que se estiran + tierra que se mueve
      T('sawtooth', 70, 150, 0.9, 0.08, { a: 0.5, flt: { t: 'lowpass', f: [200, 600], q: 3 } }), N('lowpass', 250, 900, 0.9, 0.2, 1.5, { a: 0.6 }), th(55, 85, 0.9, 0.2, { a: 0.5 }),
      N('bandpass', 1400, 2600, 0.9, 0.05, 5, { a: 0.5 })].concat(ticks(5, 0.15, 1800, 0.07, 0.2)) },
    weaver_root_erupt: { kind: 'impact', min: 100, L: cat([N('lowpass', 2200, 250, 0.22, 0.4, 0.9, { a: 0.001 }), th(110, 42, 0.26, 0.75, { a: 0.002 }), N('bandpass', 2800, 1200, 0.1, 0.2, 3, { a: 0.001 })], crack(0.5, 0.02), [T('sawtooth', 200, 420, 0.18, 0.04, { delay: 0.03, a: 0.01, flt: { t: 'bandpass', f: [800, 1600], q: 3 } })]) },
    weaver_bloom: { kind: 'tele', min: 600, L: cat([N('bandpass', 500, 2200, 0.8, 0.07, 1.5, { a: 0.5 }), th(180, 360, 0.8, 0.07, { a: 0.5, vib: [5, 25] })], bubbles(5, 0.12, 0.05, 0.1, 500), bell(660, 0.03, 0.6, 0.5), bell(880, 0.03, 0.6, 0.62)) },   // floracion: petalos que se abren, tintineo verde
    weaver_pod_pulse: { kind: 'move', min: 500, L: [th(190, 130, 0.35, 0.18, { a: 0.02 }), th(285, 200, 0.3, 0.07, { a: 0.02, vib: [9, 25] }), N('bandpass', 1600, 900, 0.3, 0.05, 2, { a: 0.03 })] },   // pulso de cura: latido blando
    weaver_pod_pop: { kind: 'impact', min: 80, L: cat([th(260, 90, 0.14, 0.6, { a: 0.002 }), N('bandpass', 1800, 700, 0.12, 0.3, 1.5, { a: 0.001 }), N('highpass', 4000, 6500, 0.08, 0.1, 1, { a: 0.001 })], bubbles(2, 0.03, 0.06, 0.03, 700)) },
    weaver_thorn_arm: { kind: 'tele', min: 700, L: cat([   // maranya de espinas (firma, 1000 ms): zarzas que se cierran, chasquidos de espinas, viento
      N('bandpass', 600, 2800, 1, 0.1, 2, { a: 0.6 }), T('sawtooth', 90, 200, 1, 0.07, { a: 0.6, vib: [11, 40], flt: { t: 'lowpass', f: [300, 900], q: 3 } }), th(60, 100, 1, 0.2, { a: 0.55 })], ticks(8, 0.1, 2400, 0.09, 0.15)) },
    weaver_burst: { kind: 'impact', min: 400, L: cat([th(90, 30, 0.7, 0.9, { a: 0.003 }), N('lowpass', 2200, 150, 0.5, 0.4, 0.9, { a: 0.001 }), N('bandpass', 700, 3500, 0.5, 0.12, 1.2, { a: 0.02 })], crack(0.8, 0.02), crack(0.5, 0.12), bursts(7, 0.07, function (i, dl) { return th(500 + i * 120, 250, 0.2, 0.05, { delay: 0.1 + dl, a: 0.002 }); }), bell(330, 0.04, 1, 0.25)) },   // estallido final de zarzas (muerte)
    weaver_rootmother_break: { kind: 'impact', min: 300, L: cat(crack(1, 0), [th(100, 34, 0.6, 0.85, { a: 0.003 }), N('lowpass', 1600, 120, 0.4, 0.35, 1, { a: 0.001 }), N('bandpass', 400, 1400, 0.45, 0.1, 1.5, { delay: 0.05, a: 0.05 })], bubbles(6, 0.06, 0.08, 0.1, 280), bell(523, 0.05, 1, 0.2)) },

    // ======================= ALCAIDE DE HIERRO (cripta: metal, cadenas, magma)
    warden_bash: { kind: 'impact', min: 160, L: cat(clang(180, 1, 0.55, 0), thud(0.95, 0, 0.85), [N('lowpass', 1400, 120, 0.2, 0.3, 1, { a: 0.001 })], links(3, 0.05, 0.1, 0.05, 2600)) },
    warden_key_jingle: { kind: 'tele', min: 450, L: cat([N('highpass', 5000, 7000, 0.65, 0.04, 1, { a: 0.4 }), th(900, 1500, 0.65, 0.03, { a: 0.45, vib: [8, 40] })], links(9, 0.065, 0.08, 0.02, 3600), bell(1760, 0.03, 0.6, 0.1), bell(2349, 0.025, 0.6, 0.3)) },   // llavero (650 ms): manojo de llaves que tintinea y sube
    warden_key_orbit: { kind: 'move', min: 500, L: cat([N('bandpass', 700, 1500, 1.4, 0.05, 2, { a: 0.4, sus: 0.7 }), th(480, 560, 1.4, 0.03, { a: 0.5, vib: [3.2, 40] })], links(14, 0.1, 0.05, 0.05, 3000)) },   // llaves giran 3,2 s: iniciarlo una vez (1,4 s) o cada 1,4 s
    warden_key_launch: { kind: 'tele', min: 350, L: cat([T('triangle', 700, 1900, 0.5, 0.05, { a: 0.35, flt: { t: 'bandpass', f: [1200, 3000], q: 3 } }), N('highpass', 4000, 7500, 0.5, 0.05, 1, { a: 0.35 })], links(5, 0.06, 0.06, 0.15, 3800)) },   // aviso de lanzamiento 500 ms (sube; el disparo = warden_shield_hit vol 0.4 o sentinel_fan_spit)
    warden_chain_wind: { kind: 'tele', min: 700, L: cat([   // grilletes (firma, 1000 ms): cadena que se arrastra y tensa, rumor grave que sube
      N('bandpass', 900, 3000, 1, 0.08, 3, { a: 0.6 }), T('sawtooth', 62, 125, 1, 0.09, { a: 0.55, flt: { t: 'lowpass', f: [200, 650], q: 3 } }), th(48, 80, 1, 0.2, { a: 0.55 })], links(10, 0.09, 0.07, 0.05, 2600)) },
    warden_chain_sweep: { kind: 'impact', min: 400, L: cat([N('bandpass', 500, 3500, 0.55, 0.3, 1.2, { a: 0.02 }), th(60, 30, 0.45, 0.9, { delay: 0.08, a: 0.003 }), N('lowpass', 1500, 120, 0.3, 0.35, 1, { delay: 0.08, a: 0.001 })], links(14, 0.035, 0.12, 0, 2400), clang(220, 0.9, 0.7, 0.1)) },
    warden_chain_pin: { kind: 'impact', min: 300, L: cat(thud(1, 0, 0.8), clang(160, 1.2, 0.8, 0), links(8, 0.04, 0.1, 0.1, 2200), [th(150, 90, 0.5, 0.1, { delay: 0.3, a: 0.05, vib: [8, 30] })]) },
    warden_shield_hit: { kind: 'impact', min: 90, L: cat(clang(520, 0.8, 0.4, 0), [th(120, 60, 0.12, 0.4, { a: 0.002 })]) },
    warden_shield_break: { kind: 'impact', min: 300, L: cat(clang(260, 1.3, 0.9, 0), clang(390, 0.9, 0.8, 0.08), thud(0.9, 0, 1), shatter(0.7, 0.04), links(8, 0.05, 0.12, 0.15, 2800), bell(440, 0.04, 0.8, 0.3)) },

    // ======================= CENTINELA DE BRASA (cripta)
    sentinel_ember_charge: { kind: 'tele', min: 600, L: cat([   // arremetida (800 ms): brasas que crepitan, fragua que sube
      T('sawtooth', 60, 130, 0.8, 0.09, { a: 0.5, vib: [14, 40], flt: { t: 'lowpass', f: [220, 800], q: 3 } }), N('lowpass', 300, 1500, 0.8, 0.2, 1.4, { a: 0.55 }), th(48, 80, 0.8, 0.22, { a: 0.5 })], ticks(9, 0.075, 2000, 0.06, 0.05), links(4, 0.12, 0.05, 0.3, 2800)) },
    sentinel_dash: { kind: 'move', min: 500, L: cat([N('bandpass', 400, 2200, 0.55, 0.2, 1, { a: 0.08 }), N('lowpass', 1500, 300, 0.55, 0.15, 1, { a: 0.05 }), th(54, 34, 0.5, 0.5, { a: 0.01 })], bursts(5, 0.09, function (i, dl) { return th(70 - i * 4, 38, 0.1, 0.55, { delay: dl, a: 0.003 }); }), hiss(0.5, 0.5, 0, 0.1)) },
    sentinel_fan_wind: { kind: 'tele', min: 500, L: cat([   // abanico (750 ms): magma que borbotea y se carga
      N('lowpass', 250, 1100, 0.75, 0.2, 1.5, { a: 0.5 }), T('sawtooth', 110, 230, 0.75, 0.05, { a: 0.5, flt: { t: 'lowpass', f: [400, 1200], q: 4 } }), th(60, 90, 0.75, 0.15, { a: 0.5 })], bursts(6, 0.1, function (i, dl) { return th(140 + i * 25, 70, 0.08, 0.1, { delay: 0.05 + dl, a: 0.004 }); })) },
    sentinel_fan_spit: { kind: 'impact', min: 55, L: cat([N('bandpass', 1500, 400, 0.14, 0.3, 1.5, { a: 0.002 }), th(220, 80, 0.14, 0.55, { a: 0.002 }), N('highpass', 3500, 6000, 0.1, 0.1, 1, { a: 0.001 })], bubbles(2, 0.04, 0.06, 0.02, 200)) },
    sentinel_puddle_hiss: { kind: 'move', min: 300, L: cat([hiss(0.9, 0.7, 0, 0.05), N('bandpass', 3000, 1500, 0.9, 0.06, 2, { a: 0.05 })], magma(0.8, 0.5)) },
    sentinel_core_open: { kind: 'tele', min: 700, L: cat([   // erupcion del nucleo (firma, 1200 ms): pecho de metal que se abre, calor que sube, latidos que se aceleran
      T('sawtooth', 50, 120, 1.2, 0.1, { a: 0.7, flt: { t: 'lowpass', f: [200, 900], q: 4 } }), N('lowpass', 300, 2200, 1.2, 0.22, 1.5, { a: 0.75 }), th(1200, 2600, 1.2, 0.025, { a: 0.8, vib: [10, 60] })],
      links(6, 0.1, 0.06, 0.1, 2200), thud(0.4, 0.2, 1.1), thud(0.45, 0.65, 1.15), thud(0.5, 0.95, 1.2)) },
    sentinel_core_pulse: { kind: 'impact', min: 350, L: cat([th(50, 18, 0.9, 1, { a: 0.004 }), N('lowpass', 2400, 100, 0.6, 0.4, 0.8, { a: 0.002 }), N('bandpass', 300, 4500, 0.8, 0.14, 1, { a: 0.02 })], hiss(0.6, 0.6, 0.05), magma(0.6, 0.7, 0.1), clang(150, 0.8, 0.8, 0.02)) },
    sentinel_core_break: { kind: 'impact', min: 300, L: cat(clang(330, 1.2, 1, 0), clang(500, 0.8, 0.8, 0.07), thud(1, 0, 1), crack(0.6, 0.02), hiss(0.5, 0.8, 0.05, 0.005), magma(0.5, 0.6, 0.1), bell(587, 0.04, 0.9, 0.25)) },

    // ======================= HIDRA JOVEN (asfodelo: agua, almas)
    hydra_lunge_wind: { kind: 'tele', min: 450, L: cat([   // cabeza atras (700 ms): inhalacion humeda que sube + burbujeo
      N('bandpass', 250, 1800, 0.7, 0.14, 1.2, { a: 0.5 }), T('sawtooth', 100, 190, 0.7, 0.05, { a: 0.5, vib: [10, 40], flt: { t: 'lowpass', f: [400, 1100], q: 3 } }), th(70, 110, 0.7, 0.15, { a: 0.5 })], bubbles(4, 0.12, 0.05, 0.1)) },
    hydra_lunge: { kind: 'impact', min: 140, L: cat([N('bandpass', 600, 3800, 0.2, 0.28, 1.5, { a: 0.01 }), th(150, 60, 0.3, 0.8, { delay: 0.1, a: 0.002 }), T('sawtooth', 340, 190, 0.2, 0.06, { delay: 0.08, a: 0.01, flt: { t: 'bandpass', f: [1000, 600], q: 3 } })], splash(0.6, 0.1)) },
    hydra_spit_wind: { kind: 'tele', min: 500, L: cat([   // acido (900 ms): gorgoteo que sube y silba
      N('bandpass', 400, 2600, 0.9, 0.1, 2, { a: 0.6 }), th(120, 260, 0.9, 0.09, { a: 0.55, vib: [7, 40] }), th(1800, 3000, 0.9, 0.02, { a: 0.6, vib: [9, 60] })], bubbles(7, 0.11, 0.06, 0.05, 260)) },
    hydra_spit: { kind: 'impact', min: 90, L: cat([N('bandpass', 2400, 700, 0.16, 0.3, 1.5, { a: 0.003 }), th(300, 90, 0.18, 0.5, { a: 0.002 }), hiss(0.3, 0.5, 0.05)], splash(0.5, 0.06)) },
    hydra_dive: { kind: 'tele', min: 700, L: cat([   // sumersion (firma, 1000 ms): se hunde, burbujas que suben, rumor del agua
      N('lowpass', 1800, 220, 1, 0.2, 1, { a: 0.1, sus: 0.6 }), th(180, 55, 1, 0.2, { a: 0.15 }), N('bandpass', 700, 2000, 1, 0.05, 2, { a: 0.5 })], bubbles(11, 0.085, 0.07, 0.1, 240), splash(0.45, 0.02)) },
    hydra_emerge: { kind: 'impact', min: 400, L: cat([th(60, 22, 0.8, 1, { a: 0.004 }), N('lowpass', 2400, 120, 0.6, 0.4, 0.8, { a: 0.002 }), N('bandpass', 400, 3800, 0.7, 0.2, 1, { a: 0.03 })], splash(1, 0), splash(0.6, 0.12), bursts(6, 0.04, function (i, dl) { return N('highpass', 3500, 7000, 0.06, 0.1, 1, { delay: 0.1 + dl, a: 0.001 }); }), [T('sawtooth', 180, 90, 0.5, 0.06, { delay: 0.05, a: 0.02, vib: [10, 40], flt: { t: 'lowpass', f: [900, 300], q: 2 } })]) },
    hydra_sever: { kind: 'impact', min: 300, L: cat([N('bandpass', 3000, 700, 0.14, 0.4, 2, { a: 0.001 }), th(200, 60, 0.3, 0.8, { delay: 0.03, a: 0.002 }), N('lowpass', 1400, 120, 0.25, 0.3, 1, { delay: 0.03, a: 0.001 })], splash(0.8, 0.04), soul(500, 220, 0.8, 0.05, 0.1), bell(392, 0.03, 0.7, 0.2)) },
    hydra_sizzle: { kind: 'move', min: 400, L: cat([hiss(1.1, 0.9, 0, 0.03), N('bandpass', 4200, 2200, 1.1, 0.07, 3, { a: 0.05 })], bursts(10, 0.1, function (i, dl) { return N('bandpass', 4500, 2500, 0.02, 0.1, 8, { delay: dl, a: 0.0006 }); }), bubbles(3, 0.15, 0.05, 0.2, 400)) },
    hydra_regrow: { kind: 'move', min: 600, L: cat([N('bandpass', 200, 1100, 1.1, 0.12, 1.5, { a: 0.6 }), th(110, 220, 1.1, 0.12, { a: 0.6, vib: [5, 20] }), N('lowpass', 500, 900, 1.1, 0.12, 2, { a: 0.5 })], bubbles(9, 0.1, 0.05, 0.05, 200), soul(300, 600, 0.8, 0.04, 0.2), [th(90, 60, 0.15, 0.5, { delay: 1.05, a: 0.005 })]) },

    // ======================= PLANIDERA ANEGADA (asfodelo: agua, almas, olvido)
    weeper_wail_wind: { kind: 'tele', min: 450, L: cat([   // lluvia de almas (750 ms): lamento que sube + goteo
      soul(260, 640, 0.75, 0.09, 0, { a: 0.35, vib: [6, 45] }), soul(390, 960, 0.75, 0.05, 0.05, { a: 0.35, vib: [5, 55] }), N('bandpass', 800, 3000, 0.75, 0.05, 4, { a: 0.5 }), th(70, 100, 0.75, 0.1, { a: 0.5 })], drop(500, 0.04, 0.2), drop(650, 0.04, 0.4), drop(800, 0.04, 0.58)) },
    weeper_soul_rain: { kind: 'impact', min: 60, L: cat([th(240, 90, 0.16, 0.55, { a: 0.002 }), N('bandpass', 1500, 600, 0.12, 0.28, 2, { a: 0.001 }), soul(520, 300, 0.3, 0.04, 0.02, { a: 0.01 })], drop(420, 0.1, 0.01)) },
    weeper_zone_hum: { kind: 'tele', min: 600, L: [   // marea del olvido (1000 ms): zumbido de agua turbia que sube con campanas rotas
      th(150, 230, 1, 0.12, { a: 0.6, vib: [3, 25] }), T('triangle', 300, 465, 1, 0.05, { a: 0.6, vib: [4, 30], flt: { t: 'lowpass', f: [900, 1500], q: 1 } }), N('lowpass', 400, 1600, 1, 0.1, 1.5, { a: 0.6 }),
      th(1180, 1240, 0.6, 0.02, { delay: 0.3, a: 0.2 }), th(883, 850, 0.7, 0.02, { delay: 0.55, a: 0.2 })] },
    weeper_choir: { kind: 'tele', min: 600, L: cat([   // coro de plaideras (firma, 800 ms): voces de almas en acorde menor que se alzan
      soul(262, 330, 0.8, 0.07, 0, { a: 0.3 }), soul(311, 392, 0.8, 0.06, 0.05, { a: 0.3 }), soul(392, 494, 0.8, 0.05, 0.1, { a: 0.3 }), soul(523, 622, 0.8, 0.03, 0.12, { a: 0.3 }),
      th(65, 82, 0.8, 0.18, { a: 0.35 }), N('bandpass', 1500, 3800, 0.8, 0.03, 6, { a: 0.5 })], bubbles(3, 0.2, 0.04, 0.1, 400)) },
    weeper_veil_tear: { kind: 'impact', min: 300, L: cat([N('bandpass', 4000, 800, 0.4, 0.3, 1.4, { a: 0.003 }), th(180, 55, 0.4, 0.7, { a: 0.003 }), N('highpass', 3000, 6000, 0.35, 0.1, 1, { a: 0.003 })], splash(0.7, 0.05), soul(700, 260, 0.9, 0.06, 0.05, { a: 0.02 }), bell(587, 0.04, 1, 0.12)) },
    weeper_burst: { kind: 'impact', min: 400, L: cat([th(70, 22, 1.1, 0.9, { a: 0.004 }), N('lowpass', 2000, 100, 0.7, 0.35, 0.8, { a: 0.003 }), N('bandpass', 300, 3500, 0.9, 0.14, 1, { a: 0.04 })], splash(1, 0), splash(0.6, 0.15), soul(800, 200, 1.4, 0.06, 0.05, { a: 0.03 }), soul(600, 150, 1.4, 0.05, 0.2, { a: 0.03 }), bubbles(8, 0.07, 0.05, 0.1, 300), bell(349, 0.04, 1.4, 0.3)) },   // estallido de almas (muerte)

    // ======================= YETI MAYOR (tundra: hielo, viento)
    yetim_roar: { kind: 'tele', min: 1200, roar: 1, L: cat([   // rugido de yeti: gutural y nevado (no compite con el de Yarlak)
      T('sawtooth', 80, 140, 1.4, 0.15, { a: 0.15, sus: 0.6, vib: [20, 45], flt: { t: 'lowpass', f: [320, 900], q: 3 } }), th(48, 66, 1.4, 0.25, { a: 0.2 }), N('bandpass', 700, 1500, 1.4, 0.09, 1.5, { a: 0.2, sus: 0.6 }),
      T('sawtooth', 260, 420, 0.6, 0.04, { delay: 0.15, a: 0.1, vib: [9, 60], flt: { t: 'bandpass', f: [900, 1500], q: 3 } }), gust(0.9, 0.06, 2500, 5000, { delay: 0.5, a: 0.3 })]) },
    yetim_bash: { kind: 'impact', min: 160, L: cat(thud(1, 0, 0.9), [N('bandpass', 2200, 700, 0.12, 0.28, 1.3, { a: 0.002 }), N('highpass', 3500, 6500, 0.14, 0.1, 1, { delay: 0.02, a: 0.001 })], shatter(0.3, 0.03)) },
    yetim_stomp: { kind: 'impact', min: 200, L: cat(thud(1.1, 0, 0.8), [th(44, 24, 0.5, 0.5, { a: 0.004 })], shatter(0.55, 0.02), [th(2400, 1600, 0.3, 0.03, { delay: 0.1 })]) },
    yetim_charge_wind: { kind: 'tele', min: 600, L: cat([   // embestida (850 ms): resoplido helado + raspar de pezunas en el hielo
      T('sawtooth', 58, 115, 0.85, 0.1, { a: 0.5, vib: [18, 30], flt: { t: 'lowpass', f: [220, 750], q: 3 } }), th(44, 74, 0.85, 0.22, { a: 0.5 }), gust(0.85, 0.12, 400, 2200, { a: 0.55 }), T('triangle', 800, 1700, 0.8, 0.02, { a: 0.5, vib: [9, 50] })], ticks(5, 0.12, 3200, 0.06, 0.15)) },
    yetim_slide: { kind: 'move', min: 450, L: [   // carga + derrape: raspado que baja (pitch segun velocidad)
      N('bandpass', 2400, 500, 0.8, 0.2, 1.4, { a: 0.03 }), N('highpass', 5500, 2400, 0.7, 0.06, 1, { a: 0.03 }), th(80, 42, 0.75, 0.2, { a: 0.03 }), T('sawtooth', 150, 65, 0.65, 0.04, { a: 0.05, flt: { t: 'lowpass', f: [900, 200], q: 1 } })] },
    yetim_ring: { kind: 'impact', min: 200, L: cat(thud(0.8, 0, 0.9), [N('bandpass', 1200, 4200, 0.6, 0.15, 2.5, { a: 0.04 }), th(300, 130, 0.5, 0.07, { a: 0.03 })], shatter(0.35, 0.04)) },
    yetim_plate_crack: { kind: 'impact', min: 200, L: cat([N('bandpass', 4200, 2000, 0.1, 0.35, 6, { a: 0.0008 }), th(2900, 2800, 0.5, 0.05), th(200, 80, 0.2, 0.5, { a: 0.002 })], crack(0.4, 0.02)) },
    yetim_plate_break: { kind: 'impact', min: 300, L: cat(thud(0.9, 0, 1), shatter(1, 0), shatter(0.6, 0.12), ticks(7, 0.06, 3500, 0.1, 0.2), bell(1047, 0.04, 0.9, 0.25), crack(0.5, 0.02)) },

    // ======================= VENTISQUERO (tundra)
    vent_howl: { kind: 'tele', min: 1200, roar: 1, L: cat([   // aullido de ventisca: viento con voz, sin gutural
      gust(1.5, 0.22, 200, 2000, { a: 0.5, sus: 0.6 }), N('bandpass', 900, 3200, 1.5, 0.07, 7, { a: 0.5, sus: 0.6 }),
      T('sawtooth', 190, 400, 1.4, 0.05, { a: 0.4, vib: [5, 50], flt: { t: 'bandpass', f: [700, 1500], q: 4 } }), T('sawtooth', 400, 210, 0.9, 0.04, { delay: 0.9, a: 0.1, vib: [6, 50], flt: { t: 'bandpass', f: [1500, 700], q: 4 } }), th(70, 100, 1.4, 0.15, { a: 0.4 })]) },
    vent_zone_hum: { kind: 'tele', min: 600, L: [   // ventisca local (1000 ms): zumbido helado que sube + silbido
      gust(1, 0.2, 300, 1800, { a: 0.65 }), N('bandpass', 1500, 3800, 1, 0.05, 8, { a: 0.65 }), th(200, 310, 1, 0.07, { a: 0.6, vib: [4, 30] }), th(1500, 2300, 0.95, 0.018, { a: 0.65, vib: [8, 60] })] },
    vent_wave_wind: { kind: 'tele', min: 700, L: [   // ola de ventisca (firma, 1150 ms): succion y viento que se alza con una flecha de aire
      gust(1.15, 0.22, 200, 2400, { a: 0.7 }), N('bandpass', 900, 3600, 1.15, 0.09, 7, { a: 0.7 }), th(130, 280, 1.15, 0.07, { a: 0.65, vib: [4, 40] }), th(1400, 2700, 1.1, 0.022, { a: 0.65, vib: [8, 70] }), T('sawtooth', 70, 110, 1.15, 0.06, { a: 0.7, flt: { t: 'lowpass', f: [200, 500], q: 2 } })] },
    vent_wave: { kind: 'move', min: 500, L: cat([gust(1.4, 0.3, 350, 1500, { a: 0.3, sus: 0.5 }), N('bandpass', 1100, 3100, 1.4, 0.1, 6, { a: 0.35, sus: 0.5 }), N('highpass', 5500, 3000, 1.3, 0.05, 1, { a: 0.35 }), th(80, 55, 1.3, 0.12, { a: 0.25 })], thud(0.35, 0.05, 1.1)) },
    vent_heart_crack: { kind: 'impact', min: 300, L: cat([N('bandpass', 5200, 2200, 0.18, 0.34, 6, { a: 0.001 }), N('highpass', 3500, 8000, 0.5, 0.18, 1, { a: 0.001 }), th(2700, 2600, 0.8, 0.07)], thud(0.8, 0.08, 1.1), thud(0.4, 0.4, 0.8), bell(784, 0.05, 1.2, 0.2), bell(1175, 0.04, 1.2, 0.32)) },
    vent_burst: { kind: 'impact', min: 400, L: cat([th(66, 20, 1, 0.95, { a: 0.004 }), N('lowpass', 2200, 100, 0.7, 0.35, 0.8, { a: 0.002 }), gust(1.2, 0.16, 400, 5000, { a: 0.05 })], shatter(1, 0.02), shatter(0.6, 0.2), ticks(10, 0.07, 3200, 0.09, 0.3), bell(587, 0.04, 1.4, 0.3)) },   // estallido de hielo (muerte)

    // ======================= STINGERS
    stg_mini_spawn: { kind: 'stinger', min: 1000, L: cat([   // aparece un minijefe: corno grave + golpe + campana de alerta (corto, no tapa la musica)
      T('sawtooth', 58, 74, 1.5, 0.11, { a: 0.35, sus: 0.6, flt: { t: 'lowpass', f: [200, 520], q: 3 } }), th(40, 36, 1.5, 0.28, { a: 0.3 })], thud(0.9, 0.55, 0.9), crack(0.4, 0.55), bell(392, 0.06, 1.2, 0.6), bell(523, 0.05, 1.2, 0.85)) },
    stg_mini_enrage: { kind: 'stinger', min: 800, L: cat([   // enrage al 50 %: tritono que sube + dos golpes
      T('sawtooth', 110, 220, 1.1, 0.09, { a: 0.5, vib: [10, 50], flt: { t: 'lowpass', f: [400, 1400], q: 3 } }), T('sawtooth', 155, 311, 1.1, 0.07, { a: 0.5, flt: { t: 'lowpass', f: [400, 1400], q: 3 } }), th(40, 55, 1.1, 0.3, { a: 0.4 }), N('bandpass', 400, 4500, 1.1, 0.12, 1, { a: 0.8 })], thud(1, 0.9, 0.85), thud(0.8, 1.1, 0.95), shatter(0.3, 0.92)) },
    stg_mini_part: { kind: 'stinger', min: 250, L: cat(crack(0.8, 0), [th(120, 36, 0.4, 0.8, { a: 0.002 })], bell(784, 0.06, 0.9, 0.08), bell(1175, 0.05, 0.9, 0.14), bell(1568, 0.04, 1, 0.2)) },
    stg_mini_die: { kind: 'stinger', min: 2500, L: cat([   // muerte: caida grave, eco y resolucion de campanas limpia
      th(62, 20, 2.4, 0.9, { a: 0.005 }), N('lowpass', 1500, 80, 2.2, 0.25, 0.8, { a: 0.05, sus: 0.3 }), T('sawtooth', 100, 45, 1.6, 0.08, { a: 0.05, flt: { t: 'lowpass', f: [500, 120], q: 2 } })], thud(0.7, 0.7, 0.8), shatter(0.4, 0.05), bell(392, 0.07, 1.8, 1), bell(494, 0.07, 1.8, 1.25), bell(587, 0.07, 2.2, 1.5), bell(784, 0.05, 2.2, 1.8)) }
  };
  // Mapa nombre -> bioma (timbre) para la vista previa y el registro
  var BIOME = { mini: 'comun', ram: 'bosque', weaver: 'bosque', warden: 'cripta', sentinel: 'cripta', hydra: 'asfodelo', weeper: 'asfodelo', yetim: 'tundra', vent: 'tundra', stg: 'comun' };
  // Reglas de mezcla: tele ~6 dB mas suave que el golpe; firmas +3 dB; ajustes por timbre
  var SIG = { ram_charge_wind: 1, ram_charge_crash: 1, weaver_thorn_arm: 1, warden_chain_wind: 1, warden_chain_sweep: 1, sentinel_core_open: 1, sentinel_core_pulse: 1, hydra_dive: 1, hydra_emerge: 1, weeper_choir: 1, yetim_charge_wind: 1, yetim_slide: 1, vent_wave_wind: 1, vent_wave: 1 };
  var GAIN = { ram_snort: 1.5, ram_horn_scrape: 1.2, weaver_pod_pulse: 1.8, weaver_pod_pop: 1.5, warden_key_jingle: 2.2, warden_key_orbit: 1.8, warden_key_launch: 2, sentinel_fan_spit: 1.6, sentinel_puddle_hiss: 2, hydra_sizzle: 1.8, weeper_soul_rain: 1.6, weeper_zone_hum: 1.4, weeper_wail_wind: 1.3, yetim_ring: 1.3, yetim_plate_crack: 1.8, vent_zone_hum: 1.4, vent_wave_wind: 1.2, mini_insignia: 2, mini_expose_chime: 1.5, stg_mini_part: 1.2, weaver_bloom: 1.5, hydra_regrow: 1.6 };
  var names = Object.keys(DEFS);
  names.forEach(function (n) {
    var d = DEFS[n], p = n.split('_')[0];
    d.fam = 'minis'; d.biome = BIOME[p] || 'comun';
    d.gain = (GAIN[n] || 1) * (d.kind === 'tele' ? 0.62 : 1) * (SIG[n] ? 1.4 : 1);
  });
  var roarUntil = 0;

  // ---- motor propio (misma sintesis que sfx_fam3)
  var ac = null, chain = null, muted = false, active = {}, lastT = {};
  function mkNoise(c, secs) { var n = Math.floor(c.sampleRate * (secs || 1)), b = c.createBuffer(1, n, c.sampleRate), d = b.getChannelData(0); for (var i = 0; i < n; i++) d[i] = Math.random() * 2 - 1; return b; }
  function mkChain(c, dest, master) {
    var k = { noise: mkNoise(c), g: c.createGain(), comp: c.createDynamicsCompressor(), mg: c.createGain(), echoIn: c.createGain() };
    k.g.gain.value = master; k.g.connect(k.comp); k.comp.connect(dest); k.mg.gain.value = 0; k.mg.connect(k.comp);
    var dl = c.createDelay(1.5), fb = c.createGain(), lp = c.createBiquadFilter();
    dl.delayTime.value = 0.55; fb.gain.value = 0.45; lp.type = 'lowpass'; lp.frequency.value = 2400; k.echoIn.gain.value = 0.5;
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
  function applyVol() {
    if (!ac) return; var v = A.getVolume();
    chain.g.gain.value = muted ? 0 : v.master * v.sfx * 0.85;
    chain.mg.gain.value = 0;
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
    if (now - (lastT[name] || 0) < def.min) return false;
    if ((active[name] || 0) >= 4) return false;
    if (def.roar && now < roarUntil) return false;   // un unico rugido a la vez
    if (def.roar) roarUntil = now + dur(def) * 1000;
    lastT[name] = now; active[name] = (active[name] || 0) + 1;
    setTimeout(function () { active[name]--; }, Math.round(dur(def) * 1000) + 40);
    applyVol();
    var vary = o.vary == null ? 0.1 : o.vary, pitch = (o.pitch || 1) * (1 + (Math.random() * 2 - 1) * Math.min(vary, 0.1));
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
    var oc = new OC(2, Math.ceil((dur(def) + 0.6) * 44100), 44100), k = mkChain(oc, oc.destination, 1);
    build(def, 0.005, (o.pitch || 1) * (1 + (Math.random() * 2 - 1) * (o.vary || 0)), o.vol == null ? 1 : o.vol, oc, k);
    return oc.startRendering();
  };
  A.sfxMinis = {};
  names.forEach(function (n) { A.sfxMinis[n] = { kind: DEFS[n].kind, fam: 'minis', biome: DEFS[n].biome, min: DEFS[n].min, dur: dur(DEFS[n]) }; });

  // Stingers en G.Snd.V (stg_mini_spawn / enrage / part / die): se llaman con G.Snd.play('stg_mini_...') o Assets.sfx('stg_mini_...')
  (function () {
    var S = window.G && window.G.Snd; if (!S || !S.V) return;
    ['spawn', 'enrage', 'part', 'die'].forEach(function (k) { S.V['stg_mini_' + k] = function () { A.sfx('stg_mini_' + k, { vary: 0 }); }; });
  })();
})();
