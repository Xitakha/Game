/* sfx_cenizar.js - Audio de Cenizar, el Incendio Primero (jefe final; DESIGN-v7-jefe-final.md sec. 14). Script clasico, tras sfx_melaria.js. Solo audio, sin tocar logica ni lo existente.
   Contexto WebAudio propio (como sfx_fam1-4 / yarlak / melaria) que sigue desbloqueo, mute, volumen y suspend de Assets. <= 4 voces por nombre, pitch +-10 %, separacion minima (min, ms), un solo rugido a la vez.
   kind: 'tele' = telegrafia (tono/rumor que SUBE y se sostiene; los firmas llevan un aviso ascendente 400 -> 1200 Hz; nunca en el impacto), 'impact' = golpe, 'move' = movimiento/ambiente, 'stinger' = jingle de evento.
   Pista procedural 'boss_cenizar' (96 BPM, 132 BPM en F7; Mi frigio) con 4 capas por fase (7 fases) + desesperado + cadena:
     Assets.music.setTrack('boss_cenizar'), setPhase(1..7), setDespair(bool), setChain(0..6).
   Pistas extra de cinematica final: 'cenizar_ending' (66 BPM, el tema del fuego en mayor) y 'cenizar_credits' (84 BPM).
   Los stingers tambien se registran en G.Snd.V como stg_cenizar_<intro|p2..p7|chain|despair|win|part|window|death|ending>. */
(function () {
  'use strict';
  var A = window.Assets;
  if (!A || A._cenizar) return;
  A._cenizar = true;

  function T(t, f0, f1, d, v, o) { var L = { t: t, f: [f0, f1], d: d, v: v }; if (o) for (var k in o) L[k] = o[k]; return L; }
  function N(type, f0, f1, d, v, q, o) { var L = { n: 1, d: d, v: v, flt: { t: type, f: [f0, f1], q: q || 1 } }; if (o) for (var k in o) L[k] = o[k]; return L; }
  function th(f0, f1, d, v, o) { return T('sine', f0, f1, d, v, o || {}); }
  function cat() { var r = []; for (var i = 0; i < arguments.length; i++) r = r.concat(arguments[i]); return r; }
  function bursts(n, step, mk) { var r = []; for (var i = 0; i < n; i++) r.push(mk(i, i * step + (i % 2) * step * 0.18)); return r; }
  function hash(n) { var x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); }
  function mtof(m) { return 440 * Math.pow(2, (m - 69) / 12); }
  function bell(f, v, d, dl) { return [th(f, f, d, v, { delay: dl || 0, a: 0.003 }), th(f * 2.76, f * 2.76, d * 0.5, v * 0.3, { delay: dl || 0, a: 0.003 }), th(f * 5.4, f * 5.4, d * 0.2, v * 0.1, { delay: dl || 0, a: 0.003 })]; }
  function thud(v, dl, f) { f = f || 1; return [th(70 * f, 26, 0.34, 0.9 * v, { delay: dl, a: 0.003 }), N('lowpass', 1100, 120, 0.2, 0.3 * v, 0.8, { delay: dl, a: 0.001 })]; }
  function ticks(n, step, f, v, dl0) { return bursts(n, step, function (i, dl) { return N('bandpass', f + i * 250, f + 350, 0.02, v, 8, { delay: (dl0 || 0) + dl, a: 0.0008 }); }); }
  function crackle(n, span, v, dl0, seed) { var r = []; for (var i = 0; i < n; i++) { var h = hash((seed || 1) * 17 + i * 3.7); r.push(N('bandpass', 1800 + h * 4200, 900 + h * 1500, 0.012 + h * 0.02, v * (0.4 + h * 0.6), 5, { delay: (dl0 || 0) + hash(i * 9.1 + (seed || 1)) * span, a: 0.0006 })); } return r; }
  function anvil(v, dl) { dl = dl || 0; return [N('bandpass', 3200, 2400, 0.07, 0.3 * v, 5, { delay: dl, a: 0.0008 }), th(1180, 1170, 0.55, 0.1 * v, { delay: dl, a: 0.001 }), th(3260, 3240, 0.35, 0.06 * v, { delay: dl, a: 0.001 }), th(215, 205, 0.3, 0.12 * v, { delay: dl, a: 0.001 })]; }
  function warn(d, v, dl) { return [th(400, 1200, d, v, { delay: dl || 0, a: d * 0.7 })]; }   // aviso ascendente 400 -> 1200 Hz de los firmas
  function brass(f, d, v, dl) { return T('sawtooth', f, f * 1.01, d, v, { delay: dl || 0, a: 0.08, flt: { t: 'lowpass', f: [f * 2, f * 5], q: 2 } }); }

  var DEFS = {
    // ---------------- Voz, cuerpo, reliquias
    cenizar_roar: { kind: 'tele', min: 1800, roar: true, L: cat([   // rugido de brasa: grave que crepita y se alza (~2,4 s); intro y arranque del desesperado
      T('sawtooth', 44, 78, 2.4, 0.15, { a: 0.35, sus: 0.6, vib: [16, 45], flt: { t: 'lowpass', f: [240, 800], q: 3 } }), T('square', 33, 52, 2.4, 0.07, { a: 0.4, flt: { t: 'lowpass', f: [200, 360], q: 1 } }),
      th(30, 44, 2.4, 0.3, { a: 0.4 }), N('bandpass', 300, 1500, 2.4, 0.1, 1.2, { a: 0.4, sus: 0.6 }), N('highpass', 3500, 7500, 1.2, 0.05, 1, { delay: 1, a: 0.5 }),
      T('sawtooth', 160, 330, 1.2, 0.04, { delay: 0.5, a: 0.3, vib: [7, 50], flt: { t: 'bandpass', f: [500, 1100], q: 3 } })], crackle(14, 2, 0.08, 0.3, 3)) },
    cenizar_hover: { kind: 'move', min: 450, L: [   // flota a ras: cuerpo de humo y brasa (llamar cada ~0,6 s, pitch 1.0 -> 1.12 segun fase, vol 0.5)
      N('lowpass', 500, 220, 0.6, 0.12, 0.8, { a: 0.15 }), th(54, 46, 0.6, 0.2, { a: 0.15 }), T('triangle', 108, 96, 0.55, 0.04, { a: 0.2, vib: [5, 20] }), N('bandpass', 2600, 1800, 0.3, 0.025, 4, { a: 0.1 })] },
    relic_glow: { kind: 'tele', min: 700, L: cat([   // la Reliquia de la fase se enciende / es apuntable: brillo que sube y vibra
      th(520, 1040, 0.9, 0.07, { a: 0.5, vib: [7, 20] }), th(780, 1560, 0.9, 0.04, { a: 0.55 }), N('highpass', 5000, 8000, 0.8, 0.03, 1, { a: 0.5 })], bell(1568, 0.04, 0.7, 0.55), bell(2093, 0.03, 0.7, 0.65)) },
    relic_break: { kind: 'impact', min: 250, L: cat([   // Reliquia rota: crac de piedra y brasa + cascada de cristal (acompanar de stg_cenizar_part)
      th(110, 34, 0.45, 0.85, { a: 0.002 }), N('lowpass', 2400, 160, 0.3, 0.4, 0.8, { a: 0.001 }), N('bandpass', 2200, 700, 0.12, 0.3, 4, { a: 0.0008 }), N('highpass', 3000, 7500, 0.5, 0.16, 1, { a: 0.001 })],
      ticks(8, 0.05, 3200, 0.09, 0.08), crackle(8, 0.5, 0.1, 0.1, 5), bell(784, 0.05, 1, 0.15)) },

    // ---------------- F1 Rescoldo (Ceniza viva)
    ash_fall: { kind: 'move', min: 250, L: cat([   // cae la ceniza de Cometas/Barra: soplo suave y granos
      N('lowpass', 1800, 300, 0.4, 0.14, 0.8, { a: 0.03 }), th(150, 70, 0.22, 0.3, { a: 0.004 })], ticks(5, 0.04, 2400, 0.05, 0.02)) },
    ash_puddle: { kind: 'move', min: 400, L: cat([   // charco de ceniza viva (5 s): siseo gris con brasas sueltas
      N('bandpass', 900, 500, 0.8, 0.07, 1.2, { a: 0.1, sus: 0.5 }), N('highpass', 4500, 3500, 0.7, 0.025, 1, { a: 0.1 })], crackle(5, 0.7, 0.06, 0.05, 8)) },

    // ---------------- F2 Exstasis de Cenizas (Pastor)
    ember_wave: { kind: 'move', min: 500, L: cat([   // oleada de brasas / anillos del Extasis (cada 1,3 s) y del Invierno: soplo con chispas
      N('bandpass', 500, 2600, 0.8, 0.16, 1.5, { a: 0.1 }), th(120, 70, 0.5, 0.2, { a: 0.02 }), N('highpass', 4800, 3200, 0.5, 0.05, 1, { a: 0.15 })], crackle(6, 0.5, 0.07, 0.1, 11)) },
    spike_ring: { kind: 'impact', min: 120, L: [   // anillo de espinas que sale (7 oleadas): pop seco + raspon de espinas
      th(150, 52, 0.22, 0.6, { a: 0.002 }), N('bandpass', 2800, 1200, 0.1, 0.22, 3, { a: 0.001 }), N('highpass', 4200, 8000, 0.1, 0.1, 1, { a: 0.001 }), th(1800, 900, 0.08, 0.04)] },
    lane_charge: { kind: 'tele', min: 600, L: cat([   // carril de embestida / estampida (FIRMA): resoplido que sube 400 -> 1200 Hz y se sostiene
      T('sawtooth', 64, 130, 0.95, 0.1, { a: 0.5, vib: [18, 35], flt: { t: 'lowpass', f: [240, 900], q: 3 } }), th(46, 76, 0.95, 0.25, { a: 0.5 }), N('bandpass', 400, 1800, 0.95, 0.1, 1.5, { a: 0.55 })], warn(0.95, 0.045)) },

    // ---------------- F3 Requiem Abrasador (Karceron)
    island_rotate: { kind: 'move', min: 900, L: cat([   // islas que giran (llamar cada ~1,2 s mientras giran): roca que roza + engranaje
      N('lowpass', 700, 260, 1.1, 0.14, 1.5, { a: 0.2, sus: 0.6 }), th(48, 40, 1.1, 0.25, { a: 0.2 }), T('sawtooth', 70, 62, 1.1, 0.04, { a: 0.3, vib: [4, 25], flt: { t: 'lowpass', f: [260, 200], q: 3 } })], ticks(5, 0.2, 1500, 0.05, 0.1)) },
    lava_rise: { kind: 'move', min: 900, L: cat([   // sube la lava (12 s; llamar al empezar): borboteo grave que crece
      N('lowpass', 250, 900, 1.8, 0.2, 1.5, { a: 0.9 }), th(38, 60, 1.8, 0.35, { a: 0.9 }), N('bandpass', 700, 2200, 1.6, 0.06, 2, { a: 0.9 })], bursts(6, 0.25, function (i, dl) { return th(180 + i * 40, 90, 0.12, 0.2, { delay: 0.2 + dl, a: 0.002 }); })) },

    // ---------------- F4 Coro de los Tres Rios (Letea)
    echo_ping: { kind: 'tele', min: 250, L: cat([   // Eco retardado: la voz suena y su contorno punteado se enciende (aviso 900 ms antes de danar)
      th(660, 880, 0.35, 0.06, { a: 0.02 }), th(1320, 1760, 0.25, 0.025, { a: 0.02 })], bell(988, 0.04, 0.6, 0.35), bell(988, 0.025, 0.6, 0.7)) },

    // ---------------- F5 Invierno de Ceniza (Yarlak)
    ice_creak: { kind: 'move', min: 500, L: cat([   // hielo que cruje bajo la ceniza (hoguera crece / blanquea el suelo)
      N('bandpass', 2600, 900, 0.5, 0.1, 6, { a: 0.02 }), th(90, 50, 0.5, 0.14, { a: 0.03 })], ticks(5, 0.09, 3200, 0.07, 0.05)) },
    ember_flare: { kind: 'impact', min: 200, L: cat([   // la hoguera se enciende en brasa (cada 2,8 s, 16 de dano): estallido de llama
      th(95, 36, 0.3, 0.7, { a: 0.003 }), N('bandpass', 900, 3200, 0.3, 0.2, 1.3, { a: 0.01 }), N('highpass', 3500, 7500, 0.25, 0.08, 1, { a: 0.002 })], crackle(6, 0.3, 0.07, 0.04, 14)) },

    // ---------------- F6 Enjambre de Brasas (Melaria)
    hex_ring_in: { kind: 'move', min: 300, L: [   // anillo hexagonal que CONTRAE: zumbido que baja
      T('sawtooth', 900, 250, 0.7, 0.05, { a: 0.05, trem: [34, 0.6], flt: { t: 'lowpass', f: [3000, 900], q: 1.4 } }), N('bandpass', 2400, 600, 0.65, 0.09, 2, { a: 0.05 }), th(260, 130, 0.5, 0.08, { a: 0.03 })] },
    hex_ring_out: { kind: 'move', min: 300, L: [   // anillo hexagonal que EXPANDE: zumbido que sube
      T('sawtooth', 250, 900, 0.7, 0.05, { a: 0.05, trem: [34, 0.6], flt: { t: 'lowpass', f: [900, 3000], q: 1.4 } }), N('bandpass', 600, 2400, 0.65, 0.09, 2, { a: 0.05 }), th(130, 260, 0.5, 0.08, { a: 0.03 })] },

    // ---------------- F7 Rosario del Incendio (cadena) y Sol de Cenizar
    chain_announce: { kind: 'tele', min: 1200, L: cat([   // Anuncio de 1500 ms con los glifos 1-6 (FIRMA): aviso 400 -> 1200 Hz + un ping por glifo
      T('sawtooth', 70, 150, 1.5, 0.07, { a: 0.8, flt: { t: 'lowpass', f: [240, 1100], q: 3 } }), N('bandpass', 400, 2400, 1.5, 0.07, 2, { a: 0.9 })], warn(1.5, 0.05),
      bursts(6, 0.22, function (i, dl) { return th(mtof(76 + [0, 3, 5, 7, 10, 12][i]), mtof(76 + [0, 3, 5, 7, 10, 12][i]), 0.18, 0.06, { delay: dl + 0.05, a: 0.002 }); })) },
    chain_tick: { kind: 'move', min: 60, L: [   // marca de eslabon (G.Snd lo usa setChain; tambien se puede llamar a mano con pitch 1.0 -> 1.5)
      th(880, 880, 0.12, 0.12, { a: 0.002 }), th(1760, 1760, 0.06, 0.04, { a: 0.002 }), th(80, 40, 0.14, 0.4, { a: 0.002 })] },
    chain_hit: { kind: 'impact', min: 120, L: cat([   // un eslabon ejecuta su impacto: golpe seco + eslabon metalico
      th(105, 34, 0.3, 0.8, { a: 0.002 }), N('lowpass', 2000, 160, 0.2, 0.34, 0.8, { a: 0.001 }), N('bandpass', 3400, 2600, 0.08, 0.2, 6, { a: 0.0008 })], anvil(0.35, 0.02)) },
    sol_charge: { kind: 'tele', min: 900, L: cat([   // Sol de Cenizar (FIRMA, 1300 ms): sol que se concentra, 400 -> 1200 Hz
      T('sawtooth', 55, 160, 1.3, 0.1, { a: 0.75, flt: { t: 'lowpass', f: [200, 1400], q: 4 } }), th(40, 90, 1.3, 0.25, { a: 0.7 }), N('bandpass', 300, 4000, 1.3, 0.09, 2, { a: 0.8 })], warn(1.3, 0.05), thud(0.4, 0.7, 1.1), thud(0.5, 1.0, 1.2)) },
    sol_pulse: { kind: 'impact', min: 500, L: cat([   // onda de rosquilla r 330 + jefe agotado: estallido, barrido y campana grave
      th(52, 18, 1, 1, { a: 0.003 }), N('lowpass', 3000, 90, 0.7, 0.45, 0.8, { a: 0.002 }), N('bandpass', 300, 6000, 0.9, 0.17, 1, { a: 0.02 }), T('sawtooth', 110, 55, 0.7, 0.08, { a: 0.01, flt: { t: 'lowpass', f: [1500, 200], q: 2 } })], bell(220, 0.07, 1.8, 0.1), crackle(10, 0.8, 0.07, 0.1, 21)) },
    gate_thud: { kind: 'impact', min: 600, L: cat([   // puerta de fase (inmune 3 s, shake 10/600): golpe de piedra con rescoldo
      th(60, 20, 0.8, 1, { a: 0.003 }), N('lowpass', 1900, 90, 0.5, 0.42, 0.8, { a: 0.001 }), th(40, 24, 0.9, 0.5, { delay: 0.2, a: 0.01 })], crackle(6, 0.6, 0.06, 0.1, 31)) },

    // ---------------- Final
    ending_hearth: { kind: 'move', min: 2000, L: cat([   // el brasero vuelve a arder (cinematica): chasquido de lena, calido y largo (~5 s)
      N('lowpass', 900, 500, 5, 0.06, 0.8, { a: 1.2, sus: 0.6 }), th(55, 55, 5, 0.12, { a: 1.2, sus: 0.6 }), T('triangle', 164.8, 164.8, 4.5, 0.03, { a: 1.5, sus: 0.6, flt: { t: 'lowpass', f: [700, 500], q: 1 } })],
      crackle(26, 4.2, 0.1, 0.2, 41), bell(659, 0.05, 2.2, 1.0), bell(784, 0.05, 2.2, 1.5), bell(988, 0.05, 2.4, 2.0)) },

    // ---------------- Stingers (kind 'stinger'; 1 vez por evento)
    cen_stg_intro: { kind: 'stinger', min: 3000, L: cat([   // 5 chispas = 5 notas; la 5.a es el tema (acorde del fuego Mi-Sol-La-Do)
      T('sawtooth', 41, 52, 3.4, 0.12, { a: 0.9, sus: 0.7, flt: { t: 'lowpass', f: [160, 480], q: 3 } }), th(30, 28, 3.4, 0.35, { a: 0.5 }), N('bandpass', 300, 900, 2.6, 0.06, 1.5, { a: 1.1 })],
      thud(0.9, 0.02, 0.9), crackle(10, 1.6, 0.06, 0.1, 1),
      bell(mtof(76), 0.07, 1.2, 0.5), bell(mtof(79), 0.07, 1.2, 0.85), bell(mtof(81), 0.07, 1.2, 1.2), bell(mtof(84), 0.07, 1.4, 1.55),
      bell(mtof(88), 0.09, 2.4, 1.95), bell(mtof(79), 0.06, 2.4, 1.95), bell(mtof(76), 0.06, 2.4, 1.95), thud(1, 1.95, 0.8)) },
    cen_stg_p2: { kind: 'stinger', min: 1200, L: cat([   // F2: zampona disonante del Pastor + tambor
      T('sawtooth', 311, 330, 1.6, 0.05, { a: 0.2, vib: [6, 40], flt: { t: 'bandpass', f: [900, 1200], q: 4 } }), T('sawtooth', 330, 349, 1.6, 0.05, { a: 0.2, vib: [7, 40], flt: { t: 'bandpass', f: [900, 1200], q: 4 } }), th(46, 40, 1.4, 0.3, { a: 0.2 })],
      thud(0.9), thud(0.7, 0.35), thud(0.9, 0.7), bell(659, 0.04, 1, 0.9)) },
    cen_stg_p3: { kind: 'stinger', min: 1200, L: cat([   // F3: yunque, cadenas y sirena de Karceron
      T('sawtooth', 220, 440, 1.8, 0.06, { a: 1.2, flt: { t: 'lowpass', f: [500, 1600], q: 3 } }), th(40, 34, 1.8, 0.3, { a: 0.4 })], anvil(1, 0), anvil(0.8, 0.45), anvil(1, 0.9), thud(1, 0.9, 0.9), ticks(12, 0.06, 2000, 0.09, 0.2)) },
    cen_stg_p4: { kind: 'stinger', min: 1200, L: cat([   // F4: arpegio acuatico con eco de Letea
      th(110, 110, 2.2, 0.15, { a: 0.5 })], bursts(8, 0.11, function (i, dl) { var f = mtof(64 + [0, 3, 7, 10, 12, 15, 19, 22][i]); return th(f, f, 0.5, 0.06, { delay: dl, a: 0.004 }); }), bell(1319, 0.04, 1.4, 0.95), bell(1319, 0.025, 1.4, 1.3), bell(1319, 0.015, 1.4, 1.65)) },
    cen_stg_p5: { kind: 'stinger', min: 1200, L: cat([   // F5: viento, campana y cuerdas heladas de Yarlak
      N('bandpass', 300, 6000, 1.9, 0.2, 1.2, { a: 1.2 }), N('highpass', 2000, 8000, 1.9, 0.07, 1, { a: 1.2 }),
      T('triangle', 293.7, 293.7 * 1.004, 2.6, 0.04, { a: 0.9, sus: 0.7, vib: [4, 12] }), T('triangle', 440, 441.8, 2.6, 0.03, { a: 1, sus: 0.7, vib: [5, 14] })], bell(587, 0.06, 1.8, 1.0), thud(0.9, 1.6, 0.85)) },
    cen_stg_p6: { kind: 'stinger', min: 1200, L: cat([   // F6: enjambre sintetizado de Melaria que crece y se corta
      T('sawtooth', 120, 420, 1.8, 0.07, { a: 1.2, trem: [30, 0.7], flt: { t: 'lowpass', f: [500, 2400], q: 1.4 } }), T('sawtooth', 124, 440, 1.8, 0.05, { a: 1.2, trem: [37, 0.7], flt: { t: 'lowpass', f: [500, 2400], q: 1.4 } }), N('bandpass', 800, 3000, 1.8, 0.08, 2, { a: 1.2, trem: [28, 0.7] })], thud(1, 1.75, 0.8), bell(880, 0.05, 1.2, 1.8)) },
    cen_stg_p7: { kind: 'stinger', min: 2000, L: cat([   // F7 El Incendio Primero: collage de los cinco motivos + tema a pleno
      T('sawtooth', 41, 82, 3, 0.14, { a: 0.9, sus: 0.7, vib: [14, 45], flt: { t: 'lowpass', f: [200, 1200], q: 3 } }), th(30, 50, 3, 0.4, { a: 0.5 }), N('bandpass', 300, 5000, 3, 0.16, 1, { a: 1.6 }),
      T('sawtooth', 311, 330, 1, 0.04, { delay: 0.1, a: 0.1, vib: [6, 40], flt: { t: 'bandpass', f: [900, 1200], q: 4 } }), T('sawtooth', 120, 400, 1.2, 0.04, { delay: 0.9, a: 0.5, trem: [30, 0.7], flt: { t: 'lowpass', f: [500, 2000], q: 1.4 } })],
      anvil(0.7, 0.2), bursts(5, 0.1, function (i, dl) { return th(mtof(72 + i * 4), mtof(72 + i * 4), 0.4, 0.05, { delay: 0.5 + dl, a: 0.003 }); }), thud(1, 0), thud(0.9, 0.45, 0.9), thud(1, 0.9, 0.85), thud(1, 1.9, 0.8),
      bell(mtof(88), 0.09, 2.6, 2.0), bell(mtof(79), 0.06, 2.6, 2.0), bell(mtof(76), 0.06, 2.6, 2.0), crackle(14, 2, 0.07, 1, 7)) },
    cen_stg_chain: { kind: 'stinger', min: 1500, L: cat([   // arranca el Rosario: seis golpes ascendentes que se aceleran
      th(60, 30, 1.8, 0.2, { a: 0.4 }), N('bandpass', 500, 3500, 1.6, 0.09, 1.5, { a: 1.2 })], bursts(6, 0.2, function (i, dl) { return th(mtof(52 + [0, 3, 5, 7, 10, 12][i]), mtof(52 + [0, 3, 5, 7, 10, 12][i]) * 0.5, 0.2, 0.55, { delay: dl * (1 - i * 0.04), a: 0.003 }); }),
      bursts(6, 0.2, function (i, dl) { return th(mtof(88 + [0, 3, 5, 7, 10, 12][i]), mtof(88 + [0, 3, 5, 7, 10, 12][i]), 0.3, 0.03, { delay: dl * (1 - i * 0.04), a: 0.002 }); })) },
    cen_stg_despair: { kind: 'stinger', min: 2500, L: cat([   // Cadena Final (< 6 %): rugido, coro sintetico y golpes frenéticos
      T('sawtooth', 46, 100, 3.4, 0.14, { a: 0.5, sus: 0.7, vib: [16, 50], flt: { t: 'lowpass', f: [250, 1100], q: 3 } }), T('sawtooth', 65, 140, 3.4, 0.07, { a: 0.6, vib: [14, 50], flt: { t: 'lowpass', f: [300, 1200], q: 3 } }),
      th(32, 50, 3.4, 0.38, { a: 0.4 }), N('bandpass', 400, 7000, 3.4, 0.18, 1, { a: 1.8 }),
      T('sawtooth', 330, 700, 3, 0.04, { delay: 0.3, a: 1, vib: [6, 45], flt: { t: 'bandpass', f: [800, 1300], q: 5 } }), T('sawtooth', 392, 830, 3, 0.04, { delay: 0.3, a: 1, vib: [7, 45], flt: { t: 'bandpass', f: [800, 1300], q: 5 } }), T('sawtooth', 466, 990, 3, 0.04, { delay: 0.3, a: 1, vib: [5, 45], flt: { t: 'bandpass', f: [800, 1300], q: 5 } })],
      bursts(10, 0.2, function (i, dl) { return th(70 - i, 26, 0.3, 0.9, { delay: dl * (1 - i * 0.03), a: 0.003 }); }), anvil(0.8, 1.2), anvil(0.8, 2.0), crackle(18, 3, 0.07, 0.5, 9)) },
    cen_stg_win: { kind: 'stinger', min: 4000, L: cat([   // victoria: fanfarria de 4 compases (metales sobre Mi mayor) + silencio + brasa del hogar
      T('triangle', 82.4, 82.4, 4.2, 0.12, { a: 0.1, sus: 0.7, flt: { t: 'lowpass', f: [900, 500], q: 1 } }), th(41.2, 41.2, 4.2, 0.3, { a: 0.1 })],
      [brass(329.6, 0.9, 0.06, 0.0), brass(415.3, 0.9, 0.05, 0.0), brass(493.9, 0.9, 0.05, 0.0), brass(440, 0.9, 0.06, 1.0), brass(554.4, 0.9, 0.05, 1.0), brass(659.3, 0.9, 0.05, 1.0), brass(493.9, 0.9, 0.06, 2.0), brass(622.3, 0.9, 0.05, 2.0), brass(740, 0.9, 0.05, 2.0), brass(659.3, 1.8, 0.07, 3.0), brass(830.6, 1.8, 0.06, 3.0), brass(987.8, 1.8, 0.06, 3.0)],
      thud(0.8, 0), thud(0.7, 1.0), thud(0.8, 2.0), thud(1, 3.0, 0.9), bell(1319, 0.06, 2, 3.0), bell(mtof(76), 0.07, 2.4, 6.4), bell(mtof(79 + 1), 0.06, 2.4, 6.8), crackle(18, 2.6, 0.09, 6.2, 51)) },
    cen_stg_part: { kind: 'stinger', min: 300, L: cat([   // Reliquia rota (junto con relic_break): crac y campana
      N('bandpass', 1800, 800, 0.1, 0.4, 5, { a: 0.0008 }), th(280, 80, 0.25, 0.7, { a: 0.002 }), N('lowpass', 1500, 150, 0.2, 0.3, 1, { a: 0.001 })], bell(659, 0.05, 1, 0.1), bell(988, 0.04, 1.1, 0.2), crackle(6, 0.4, 0.07, 0.1, 6)) },
    cen_stg_window: { kind: 'stinger', min: 300, L: cat(   // ventana de dano (derribo, Corazon de Ceniza, Sol agotado): arpegio claro + latido
      bell(784, 0.07, 0.8, 0), bell(1047, 0.07, 0.8, 0.08), bell(1568, 0.07, 1, 0.16), thud(0.7, 0, 1.2), thud(0.5, 0.17, 1.3)) },
    cen_stg_death: { kind: 'stinger', min: 4000, L: cat([   // Cenizar se apaga (~6 s): estampido, derrumbe, brasas que se enfrian, ultimo latido
      th(58, 16, 3.5, 1, { a: 0.005 }), N('lowpass', 2000, 80, 5.5, 0.35, 0.8, { a: 0.05, sus: 0.3 }), N('bandpass', 700, 150, 5, 0.12, 1.2, { a: 0.5 }), T('sawtooth', 60, 28, 3.4, 0.12, { a: 0.05, vib: [14, 40], flt: { t: 'lowpass', f: [500, 120], q: 2 } })],
      thud(1, 0.9, 0.8), thud(0.8, 1.8, 0.7), thud(0.6, 2.8, 0.6), thud(0.4, 4.0, 0.5), crackle(30, 5, 0.1, 0.3, 61), anvil(0.5, 0.6), bell(164.8, 0.07, 2, 4.2)) },
    cen_stg_ending: { kind: 'stinger', min: 6000, L: cat([   // jingle de la cinematica final (~9 s): el tema del fuego en mayor, calido, sobre el brasero
      th(82.4, 82.4, 9, 0.16, { a: 1.0, sus: 0.8 }), T('triangle', 164.8, 164.8, 9, 0.05, { a: 1.5, sus: 0.7, vib: [3, 10], flt: { t: 'lowpass', f: [800, 500], q: 1 } }), T('triangle', 207.7, 208.5, 9, 0.04, { a: 1.8, sus: 0.7, vib: [3, 12], flt: { t: 'lowpass', f: [800, 500], q: 1 } }), T('triangle', 246.9, 247.8, 9, 0.04, { a: 2, sus: 0.7, vib: [3, 12], flt: { t: 'lowpass', f: [800, 500], q: 1 } })],
      bell(mtof(76), 0.07, 2.2, 0.6), bell(mtof(80), 0.07, 2.2, 1.6), bell(mtof(81), 0.07, 2.2, 2.6), bell(mtof(84), 0.07, 2.2, 3.6),
      bell(mtof(88), 0.08, 3, 4.8), bell(mtof(83), 0.05, 3, 4.8), bell(mtof(80), 0.05, 3, 4.8), bell(mtof(76), 0.07, 3.4, 6.2), crackle(30, 8, 0.07, 0.3, 71)) }
  };
  var GAIN = { ash_fall: 1.6, ash_puddle: 2, ember_wave: 1.3, spike_ring: 1.4, echo_ping: 2, ice_creak: 1.8, hex_ring_in: 1.6, hex_ring_out: 1.6, chain_tick: 1.4, cenizar_hover: 1.5, relic_glow: 1.6, cen_stg_part: 2, ending_hearth: 1.5 };
  Object.keys(DEFS).forEach(function (n) { DEFS[n].fam = 'cenizar'; DEFS[n].gain = GAIN[n] || 1; });
  var names = Object.keys(DEFS);

  // ---- motor propio (igual que sfx_melaria: tremolo de amplitud opcional L.trem = [Hz, profundidad])
  var ac = null, chain = null, muted = false, active = {}, lastT = {};
  function mkNoise(c, secs) { var n = Math.floor(c.sampleRate * (secs || 1)), b = c.createBuffer(1, n, c.sampleRate), d = b.getChannelData(0); for (var i = 0; i < n; i++) d[i] = Math.random() * 2 - 1; return b; }
  function mkChain(c, dest, master) {
    var k = { noise: mkNoise(c), g: c.createGain(), comp: c.createDynamicsCompressor(), mg: c.createGain(), echoIn: c.createGain() };
    k.g.gain.value = master; k.g.connect(k.comp); k.comp.connect(dest); k.mg.gain.value = 0; k.mg.connect(k.comp);
    var dl = c.createDelay(1.5), fb = c.createGain(), lp = c.createBiquadFilter();
    dl.delayTime.value = 0.42; fb.gain.value = 0.4; lp.type = 'lowpass'; lp.frequency.value = 2600; k.echoIn.gain.value = 0.5;
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
  function build(def, st, pitch, vm, c, k) { for (var i = 0; i < def.L.length; i++) layer(def.L[i], st + (def.L[i].delay || 0), pitch, vm * def.gain * (1 + (Math.random() - 0.5) * 0.14), c, k); }
  function dur(def) { var m = 0; def.L.forEach(function (L) { m = Math.max(m, (L.delay || 0) + L.d); }); return m; }

  function ensure() {
    if (ac) return ac;
    var AC = window.AudioContext || window.webkitAudioContext; if (!AC) return null;
    try { ac = new AC(); chain = mkChain(ac, ac.destination, 0.7); } catch (e) { ac = null; }
    return ac;
  }
  var cenPlaying = false;
  function applyVol() {
    if (!ac) return; var v = A.getVolume();
    chain.g.gain.value = muted ? 0 : v.master * v.sfx * 0.85;
    chain.mg.gain.value = muted || !cenPlaying ? 0 : v.master * v.music;
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
    if (def.roar) { if (now < (A._roarUntil || 0)) return false; A._roarUntil = now + dur(def) * 1000; }
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
  A.sfxCenizar = {};
  names.forEach(function (n) { A.sfxCenizar[n] = { kind: DEFS[n].kind, fam: 'cenizar', min: DEFS[n].min, dur: dur(DEFS[n]) }; });

  // Stingers en G.Snd.V (los dispara G.Boss.stinger: 'stg_cenizar_<intro|p2..p7|chain|despair|win>') + extras.
  (function () {
    var S = window.G && window.G.Snd; if (!S || !S.V) return;
    ['intro', 'p2', 'p3', 'p4', 'p5', 'p6', 'p7', 'chain', 'despair', 'win', 'part', 'window', 'death', 'ending'].forEach(function (k) { S.V['stg_cenizar_' + k] = function () { A.sfx('cen_stg_' + k, { vary: 0 }); }; });
  })();

  // ================= Musica 'boss_cenizar' (96 BPM -> 132 BPM en F7; Mi frigio). 4 capas por fase (siete fases) + desesperado + cadena.
  // Siempre: bordon grave + tambor de guerra + cuerda frotada + tema del fuego (4 notas: Mi-Sol-La-Do) cada 4 compases.
  // F2 zampona disonante + tambor; F3 yunque, cadenas, sirena; F4 arpegio acuatico con eco; F5 viento, campana, cuerdas heladas; F6 enjambre; F7 collage de todo + tema a pleno + 132 BPM.
  var CB = { prog: [40, 40, 41, 40, 43, 41, 39, 40], theme: [0, 3, 5, 8], chainN: [0, 3, 5, 7, 10, 12] };
  var LAY = { 1: 'D', 2: 'DR', 3: 'DRA', 4: 'DRAQ', 5: 'DRAQW', 6: 'DRAQWZ', 7: 'DRAQWZ' };   // capas acumuladas (D base, R zampona, A yunque, Q arpegio, W hielo, Z enjambre)
  function cStep(step, t, ph, des, chn, c, k) {
    var f7 = ph >= 7, bpm = f7 ? 132 : 96, spb = 60 / bpm / 4, bar16 = spb * 16;
    var bar = Math.floor(step / 16) % CB.prog.length, s = step % 16, root = CB.prog[bar], cyc = Math.floor(step / 16) % 8, lay = LAY[ph] || 'D', w = f7 ? 0.7 : 1;
    function has(x) { return lay.indexOf(x) >= 0; }
    function mv(L, send, v) { layer(L, t + (L.delay || 0), 1, (v == null ? 1 : v) * (0.85 + ph * 0.03), c, k, k.mg, send); }
    if (s === 0) {   // bordon + cuerda frotada
      mv(th(mtof(root - 12), mtof(root - 12), bar16, 0.2, { a: 0.3, sus: 0.8 }));
      mv(T('sawtooth', mtof(root - 12), mtof(root - 12), bar16, 0.05, { a: 0.4, sus: 0.8, flt: { t: 'lowpass', f: [170, 280], q: 2 } }));
      mv(T('sawtooth', mtof(root), mtof(root) * 1.006, bar16, 0.035, { a: bar16 * 0.35, sus: 0.8, vib: [4.5, 14], flt: { t: 'lowpass', f: [500 + ph * 60, 700 + ph * 80], q: 2 } }));
      mv(T('sawtooth', mtof(root + 7), mtof(root + 7) * 0.994, bar16, 0.025, { a: bar16 * 0.4, sus: 0.8, vib: [5, 14], flt: { t: 'lowpass', f: [500 + ph * 60, 700 + ph * 80], q: 2 } }));
      mv(N('bandpass', 300 + ph * 60, 700 + ph * 110, bar16, 0.04 + ph * 0.008 + (des ? 0.05 : 0), 0.9, { a: bar16 * 0.4, sus: 0.7 }));
    }
    // tambor de guerra: F1 en 1 y 3; con F2+ en negras
    var kick = ph >= 2 ? (s % 4 === 0) : (s === 0 || s === 8);
    if (kick) mv(th(72, 28, 0.32, 0.55 * w, { a: 0.003 }));
    if (ph === 1 && s === 6) mv(th(60, 28, 0.2, 0.3, { a: 0.003 }));
    // tema del fuego: 4 notas en los pulsos del compas 1 de cada 4 (en F7 y desesperado, cada compas y mas fuerte)
    var showTheme = (bar % 4 === 0) || f7 || des;
    if (showTheme && s % 4 === 0) {
      var tn = CB.theme[s / 4], tf = mtof(root + 24 + tn), tv = (f7 || des ? 0.1 : 0.06) + (s === 12 ? 0.02 : 0);
      bell(tf, tv, s === 12 ? 1.6 : 0.9, 0).forEach(function (L) { mv(L, true); });
      if (f7 || des) mv(T('sawtooth', mtof(root + 12 + tn), mtof(root + 12 + tn), spb * 3.5, 0.045, { a: 0.03, flt: { t: 'lowpass', f: [900, 500], q: 2 } }));
    }
    // F2: zampona disonante (segunda menor) + tambor extra
    if (has('R')) {
      if (s === 0 && cyc % 2 === 1) { mv(T('sawtooth', mtof(root + 12), mtof(root + 12), bar16 * 0.9, 0.04 * w, { a: 0.5, sus: 0.8, vib: [6, 28], flt: { t: 'bandpass', f: [800, 1100], q: 4 } })); mv(T('sawtooth', mtof(root + 13), mtof(root + 13), bar16 * 0.9, 0.04 * w, { a: 0.5, sus: 0.8, vib: [7, 28], flt: { t: 'bandpass', f: [800, 1100], q: 4 } }), true); }
      if (s === 6 || s === 14) mv(th(58, 26, 0.22, 0.4 * w, { a: 0.003 }));
    }
    // F3: yunque, cadenas, sirena lenta
    if (has('A')) {
      if (s === 4 || s === 12) anvil(0.5 * w, 0).forEach(function (L) { mv(L); });
      if (s % 4 === 3 && hash(step * 5 + 2) < 0.4) mv(N('bandpass', 3800, 3000, 0.05, 0.06 * w, 7, { a: 0.001 }));
      if (s === 0 && bar % 4 === 2) mv(T('sawtooth', mtof(root + 12), mtof(root + 24), bar16, 0.03 * w, { a: bar16 * 0.6, flt: { t: 'lowpass', f: [500, 1200], q: 2 } }));
    }
    // F4: arpegio acuatico con eco
    if (has('Q') && s % 2 === 0) {
      var an = [0, 3, 7, 10, 12, 10, 7, 3][(s / 2 + bar) % 8], af = mtof(root + 24 + an);
      mv(th(af, af, 0.35, 0.045 * w, { a: 0.004 }), true);
    }
    // F5: viento, campana, cuerdas heladas
    if (has('W')) {
      if (s === 0) { mv(N('bandpass', 800 + (cyc % 4) * 300, 2400 + (cyc % 4) * 400, bar16, 0.06 * w, 1.5, { a: bar16 * 0.6 })); mv(T('triangle', mtof(root + 19), mtof(root + 19) * 1.005, bar16, 0.03 * w, { a: 0.7, sus: 0.7, vib: [4, 14] }), true); }
      if (s % 4 === 2 && hash(step * 7 + 3) < 0.3) bell(mtof(root + 36 + [0, 1, 5, 7][Math.floor(hash(step) * 4)]), 0.05 * w, 1.6, 0).forEach(function (L) { mv(L, true); });
    }
    // F6: enjambre sintetizado
    if (has('Z')) {
      if (s === 0) mv(T('sawtooth', mtof(root + 12), mtof(root + 12) * 1.04, bar16, 0.035 * w, { a: bar16 * 0.5, trem: [26 + (cyc % 4) * 3, 0.7], flt: { t: 'lowpass', f: [900, 2200], q: 1.4 } }));
      if (s % 2 === 1 && hash(step * 3 + 1) < 0.4) mv(T('triangle', mtof(root + 31), mtof(root + 31), 0.06, 0.04 * w, { a: 0.002 }));
    }
    // F7: percusion plena (caja, hats) sobre el collage
    if (f7) {
      if (s === 4 || s === 12) mv(N('bandpass', 1800, 1100, 0.1, 0.14, 2, { a: 0.001 }));
      if (s % 2 === 0) mv(N('highpass', 7000, 8500, 0.03, 0.04, 1, { a: 0.001 }));
      if (s === 0) mv(th(mtof(root - 24), mtof(root - 24), bar16, 0.18, { a: 0.1, sus: 0.8 }));
    }
    // Desesperado (Cadena Final): tritono, bombo a corcheas, sirena y coro sintetico
    if (des) {
      if (s % 2 === 0) mv(th(84 + (s % 4) * 6, 30, 0.14, 0.45, { a: 0.003 }));
      if (s === 0) {
        [0, 3, 7].forEach(function (iv, i) { mv(T('sawtooth', mtof(root + 12 + iv), mtof(root + 12 + iv) * (1 + i * 0.004), bar16, 0.04, { a: 0.4, sus: 0.7, vib: [5 + i, 20], flt: { t: 'bandpass', f: [800 + i * 150, 1100 + i * 150], q: 3 } }), true); });
        mv(T('sawtooth', mtof(root + 6), mtof(root + 6) * 1.01, bar16, 0.04, { a: 0.3, flt: { t: 'lowpass', f: [700, 500], q: 4 } }));
        mv(T('sawtooth', mtof(root + 12), mtof(root + 12) * 1.8, bar16, 0.03, { a: bar16 * 0.6, flt: { t: 'bandpass', f: [900, 2600], q: 3 } }));
      }
      if (s % 4 === 1) mv(N('highpass', 6500, 8500, 0.05, 0.07, 1, { a: 0.002 }));
    }
    // Cadena (F7): un tono por eslabon que sube + un tambor mas por eslabon
    if (chn > 0) {
      var cn = Math.min(6, chn);
      if (s % 4 === 0) {
        var cf = mtof(root + 24 + CB.chainN[cn - 1]);
        mv(th(cf, cf, 0.18, 0.08, { a: 0.002 }), true); mv(th(cf * 2.01, cf * 2.01, 0.1, 0.025, { a: 0.002 }));
        mv(th(66 + cn * 4, 28, 0.2, 0.55, { a: 0.003 }));
      }
      if (cn >= 2 && s % 4 === 2) mv(th(88, 36, 0.14, 0.4, { a: 0.003 }));
      if (cn >= 3 && s % 2 === 1) mv(th(120, 55, 0.08, 0.22, { a: 0.002 }));
      if (cn >= 4 && (s === 4 || s === 12)) mv(N('bandpass', 2200, 1200, 0.09, 0.14, 2, { a: 0.001 }));
      if (cn >= 5) mv(N('highpass', 7500, 9000, 0.025, 0.05, 1, { a: 0.001 }));
      if (cn >= 6 && s === 0) mv(T('sawtooth', mtof(root), mtof(root + 12), bar16, 0.05, { a: bar16 * 0.7, flt: { t: 'lowpass', f: [400, 2000], q: 2 } }));
    }
    return spb;
  }

  // ---- Cinematica final: 'cenizar_ending' (66 BPM) y creditos 'cenizar_credits' (84 BPM). El tema del fuego en mayor (Mi-Sol#-La-Do#).
  var EB = { ending: { bpm: 66, prog: [40, 45, 47, 40, 45, 43, 47, 40] }, credits: { bpm: 84, prog: [40, 45, 49, 47, 40, 45, 47, 40] } };
  function eStep(step, t, mode, c, k) {
    var E = EB[mode], spb = 60 / E.bpm / 4, bar16 = spb * 16, bar = Math.floor(step / 16) % E.prog.length, s = step % 16, root = E.prog[bar], cyc = Math.floor(step / 16) % 8, cr = mode === 'credits';
    function mv(L, send, v) { layer(L, t + (L.delay || 0), 1, v == null ? 1 : v, c, k, k.mg, send); }
    if (s === 0) {   // bordon calido + acorde mayor suave
      mv(th(mtof(root - 12), mtof(root - 12), bar16, 0.18, { a: 0.5, sus: 0.85 }));
      [0, 4, 7].forEach(function (iv, i) { mv(T('triangle', mtof(root + iv), mtof(root + iv) * (1 + i * 0.003), bar16, 0.04, { a: bar16 * 0.4, sus: 0.8, vib: [3, 10], flt: { t: 'lowpass', f: [800, 600], q: 1 } }), true); });
      mv(N('lowpass', 700, 450, bar16, 0.03, 0.8, { a: bar16 * 0.5, sus: 0.7 }));
    }
    // el brasero: chasquidos de lena
    if (hash(step * 3.3 + (cr ? 7 : 1)) < (cr ? 0.12 : 0.28)) mv(N('bandpass', 1800 + hash(step) * 4000, 1000, 0.015 + hash(step + 2) * 0.02, 0.06 + hash(step + 4) * 0.05, 5, { a: 0.0006 }));
    // tema del fuego en mayor, lento (ending) o en marimba-campana (creditos)
    if (s % 4 === 0 && (cr || bar % 2 === 0)) {
      var tn = [0, 4, 7, 11][(s / 4 + (cr ? bar : 0)) % 4], f = mtof(root + 24 + tn);
      bell(f, cr ? 0.07 : 0.06, cr ? 1 : 1.6, 0).forEach(function (L) { mv(L, true); });
    }
    if (!cr && s === 0 && bar % 2 === 1) bell(mtof(root + 36), 0.04, 2.4, 0.1).forEach(function (L) { mv(L, true); });
    if (cr) {   // creditos: latido suave + escobillas y arpegio
      if (s % 8 === 0) mv(th(72, 32, 0.28, 0.4, { a: 0.004 }));
      if (s % 4 === 2) mv(N('highpass', 6500, 8500, 0.04, 0.035, 1, { a: 0.002 }));
      if (s % 2 === 0 && cyc >= 2) { var af = mtof(root + 12 + [0, 4, 7, 12][(s / 2) % 4]); mv(th(af, af, 0.25, 0.04, { a: 0.003 }), true); }
    } else if (s === 0 && bar % 4 === 3) {
      mv(th(60, 32, 0.4, 0.3, { a: 0.01 }));   // latido del hogar al cerrar la frase
    }
    return spb;
  }

  function phaseOf(v) { return Math.max(1, Math.min(7, Math.floor(v * 7) + 1)); }

  var CS = { timer: null, step: 0, next: 0 }, trk = null, want = false, PH = 1, DES = false, CHN = 0;
  var M0 = A.music, p = { start: M0.start, stop: M0.stop, setTrack: M0.setTrack, getTrack: M0.getTrack, tracks: M0.tracks, isPlaying: M0.isPlaying, setIntensity: M0.setIntensity, setPhase: M0.setPhase, getPhase: M0.getPhase, setDespair: M0.setDespair };
  function oneStep(step, t, c, k) {
    if (trk === 'boss_cenizar') return cStep(step, t, PH, DES, CHN, c, k);
    return eStep(step, t, trk === 'cenizar_credits' ? 'credits' : 'ending', c, k);
  }
  function cSched() {
    if (!ac || ac.state !== 'running') return;
    while (CS.next < ac.currentTime + 0.2) { CS.next += oneStep(CS.step, CS.next, ac, chain); CS.step++; }
  }
  function cStart() {
    if (cenPlaying || !trk || !want) return;
    if (!A.isUnlocked() || !ensure()) { setTimeout(cStart, 400); return; }
    if (ac.state !== 'running') { try { ac.resume(); } catch (e) { /* audio */ } setTimeout(cStart, 300); return; }
    cenPlaying = true; CS.step = 0; CS.next = ac.currentTime + 0.1;
    var v = A.getVolume(); chain.mg.gain.cancelScheduledValues(ac.currentTime); chain.mg.gain.setValueAtTime(0.0001, ac.currentTime);
    chain.mg.gain.linearRampToValueAtTime(muted ? 0 : v.master * v.music, ac.currentTime + 0.5);
    CS.timer = setInterval(cSched, 30);
  }
  function cStop() {
    if (!cenPlaying) return; cenPlaying = false; clearInterval(CS.timer); CS.timer = null;
    try { chain.mg.gain.cancelScheduledValues(ac.currentTime); chain.mg.gain.setValueAtTime(chain.mg.gain.value, ac.currentTime); chain.mg.gain.linearRampToValueAtTime(0.0001, ac.currentTime + 0.4); } catch (e) { /* audio */ }
  }
  var TRACKS = ['boss_cenizar', 'cenizar_ending', 'cenizar_credits'];
  M0.start = function () { want = true; if (trk) cStart(); else p.start(); };
  M0.stop = function () { want = false; cStop(); p.stop(); };
  M0.setIntensity = function (v) { if (trk === 'boss_cenizar') PH = phaseOf(Math.max(0, Math.min(1, typeof v === 'boolean' ? (v ? 1 : 0) : (+v || 0)))); p.setIntensity(v); };
  // setPhase/setDespair/setChain: con boss_cenizar activa gobiernan esta pista; si no, delegan en la pista anterior (boss_melaria, boss_yarlak)
  M0.setPhase = function (n) { if (trk === 'boss_cenizar') { PH = Math.max(1, Math.min(7, Math.round(+n) || 1)); if (PH < 7) CHN = 0; } else if (p.setPhase) p.setPhase(n); };
  M0.setDespair = function (b) { if (trk === 'boss_cenizar') DES = !!b; else if (p.setDespair) p.setDespair(b); };
  M0.getPhase = function () { return trk === 'boss_cenizar' ? PH : (p.getPhase ? p.getPhase() : 1); };
  M0.setChain = function (n) {
    n = Math.max(0, Math.min(6, Math.round(+n) || 0));
    if (trk !== 'boss_cenizar') { CHN = 0; return n; }
    var prev = CHN; CHN = n;
    if (n > 0 && n !== prev) A.sfx('chain_tick', { pitch: Math.pow(2, CB.chainN[n - 1] / 12), vary: 0, vol: 0.8 });   // sonido inmediato del eslabon (sin esperar al siguiente pulso)
    return n;
  };
  M0.getChain = function () { return trk === 'boss_cenizar' ? CHN : 0; };
  M0.setTrack = function (name) {
    if (TRACKS.indexOf(name) >= 0) { if (trk === name) return; var wasPlaying = cenPlaying; if (trk) cStop(); else p.stop(); trk = name; PH = 1; DES = false; CHN = 0; if (want) { if (wasPlaying) setTimeout(cStart, 450); else cStart(); } return; }
    if (trk) { trk = null; cStop(); p.setTrack(name); if (want) p.start(); return; }
    p.setTrack(name);
  };
  M0.getTrack = function () { return trk || p.getTrack(); };
  M0.tracks = function () { return p.tracks().concat(TRACKS); };
  M0.isPlaying = function () { return trk ? cenPlaying : p.isPlaying(); };

  var origRM = A.renderMusic;
  A.renderMusic = function (o) {
    o = o || {};
    if (TRACKS.indexOf(o.track) < 0) return origRM.apply(this, arguments);
    var OC = window.OfflineAudioContext || window.webkitOfflineAudioContext;
    if (!OC) return Promise.reject(new Error('OfflineAudioContext no disponible'));
    var boss = o.track === 'boss_cenizar', bars = o.bars || 8;
    var ph = o.phase || (o.intensity == null ? 7 : phaseOf(o.intensity)), mode = o.track === 'cenizar_credits' ? 'credits' : 'ending';
    var spb = 60 / (boss ? (ph >= 7 ? 132 : 96) : EB[mode].bpm) / 4;
    var oc = new OC(2, Math.ceil((bars * 16 * spb + 3) * 44100), 44100), k = mkChain(oc, oc.destination, 1);
    k.mg.gain.value = 0.8;
    for (var i = 0; i < bars * 16; i++) { if (boss) cStep(i, 0.05 + i * spb, ph, !!o.despair, o.chain || 0, oc, k); else eStep(i, 0.05 + i * spb, mode, oc, k); }
    return oc.startRendering();
  };
})();
