/* sfx_yarlak.js - Audio de Yarlak, el Coloso Gelido (P4; DESIGN-v5-biomas.md B.2 / C.5). Script clasico, tras sfx_fam3.js. Solo audio, sin tocar logica ni lo existente.
   Contexto WebAudio propio (como sfx_fam1/2/3) que sigue desbloqueo, mute, volumen y suspend de Assets. <= 4 voces por nombre, pitch +-10 %, separacion minima (min, ms).
   kind: 'tele' = telegrafia (tono/rumor que SUBE y se sostiene; nunca en el impacto), 'impact' = golpe (grave + ruido corto), 'move' = movimiento/ambiente, 'stinger' = jingle de evento.
   Pista procedural 'boss_yarlak' (78 BPM) con 4 capas por fase + variante desesperada: Assets.music.setTrack('boss_yarlak'), Assets.music.setPhase(1..4), Assets.music.setDespair(bool).
   Los stingers tambien se registran en G.Snd.V como stg_yarlak_<intro|p2|p3|p4|despair> (los dispara G.Boss.stinger sin cambios) y stg_yarlak_<part|window|death|victory>. */
(function () {
  'use strict';
  var A = window.Assets;
  if (!A || A._yarlak) return;
  A._yarlak = true;

  function T(t, f0, f1, d, v, o) { var L = { t: t, f: [f0, f1], d: d, v: v }; if (o) for (var k in o) L[k] = o[k]; return L; }
  function N(type, f0, f1, d, v, q, o) { var L = { n: 1, d: d, v: v, flt: { t: type, f: [f0, f1], q: q || 1 } }; if (o) for (var k in o) L[k] = o[k]; return L; }
  function th(f0, f1, d, v, o) { return T('sine', f0, f1, d, v, o || {}); }
  function bursts(n, step, mk) { var r = []; for (var i = 0; i < n; i++) r.push(mk(i, i * step + (i % 2) * step * 0.18)); return r; }
  function bell(f, v, d, dl) { return [th(f, f, d, v, { delay: dl || 0, a: 0.003 }), th(f * 2.76, f * 2.76, d * 0.5, v * 0.3, { delay: dl || 0, a: 0.003 })]; }
  function cat() { var r = []; for (var i = 0; i < arguments.length; i++) r = r.concat(arguments[i]); return r; }
  function thud(v, dl, f) { f = f || 1; return [th(70 * f, 26, 0.34, 0.9 * v, { delay: dl, a: 0.003 }), N('lowpass', 1100, 120, 0.2, 0.3 * v, 0.8, { delay: dl, a: 0.001 })]; }
  function shatter(v, dl) { dl = dl || 0; return [N('highpass', 2500, 8000, 0.3, 0.22 * v, 1, { delay: dl, a: 0.001 }), th(3000, 2900, 0.25, 0.06 * v, { delay: dl }), th(4400, 4300, 0.2, 0.04 * v, { delay: dl + 0.03 }), th(3500, 3400, 0.18, 0.04 * v, { delay: dl + 0.08 }), N('bandpass', 6200, 3600, 0.08, 0.14 * v, 7, { delay: dl + 0.12, a: 0.001 })]; }
  function ticks(n, step, f, v, dl0) { return bursts(n, step, function (i, dl) { return N('bandpass', f + i * 300, f + 400, 0.02, v, 8, { delay: (dl0 || 0) + dl, a: 0.0008 }); }); }

  var DEFS = {
    // ---------------- Voz y pisadas
    boss_roar_yarlak: { kind: 'tele', min: 1500, L: cat([   // rugido de mamut: cuerpo grave + trompa que sube y cae + hielo
      T('sawtooth', 52, 84, 1.9, 0.16, { a: 0.25, sus: 0.6, vib: [18, 40], flt: { t: 'lowpass', f: [260, 700], q: 3 } }),
      T('square', 38, 62, 1.9, 0.07, { a: 0.3, flt: { t: 'lowpass', f: [200, 380], q: 1 } }), th(34, 46, 1.9, 0.25, { a: 0.3 }),
      N('bandpass', 500, 1000, 1.9, 0.07, 1.5, { a: 0.3, sus: 0.6 }),
      T('sawtooth', 190, 360, 0.9, 0.05, { delay: 0.25, a: 0.12, vib: [8, 60], flt: { t: 'bandpass', f: [700, 1300], q: 3 } }),
      T('sawtooth', 360, 150, 0.8, 0.045, { delay: 1.15, a: 0.05, vib: [8, 60], flt: { t: 'bandpass', f: [1300, 600], q: 3 } }),
      N('highpass', 4500, 8000, 0.5, 0.05, 1, { delay: 1.4, a: 0.2 })]) },
    mammoth_step: { kind: 'move', min: 240, L: [   // pisada pesada sobre nieve/hielo
      th(62, 26, 0.32, 0.8, { a: 0.004 }), th(40, 27, 0.4, 0.45, { a: 0.006 }), N('lowpass', 900, 110, 0.24, 0.3, 1, { a: 0.003 }), N('bandpass', 2500, 1400, 0.12, 0.07, 1.2, { delay: 0.03, a: 0.003 })] },
    yar_step_big: { kind: 'impact', min: 300, L: cat([   // tercer paso de la entrada (shake 8/220): mas hondo, con hielo que cruje
      th(52, 22, 0.6, 1, { a: 0.004 }), th(34, 24, 0.7, 0.6, { a: 0.006 }), N('lowpass', 1000, 90, 0.4, 0.4, 1, { a: 0.002 })], shatter(0.4, 0.04)) },

    // ---------------- 1 Pisoton de glaciar (tele 1100 ms; onda anular; estalagmitas)
    yar_stomp_tele: { kind: 'tele', min: 500, L: [   // levanta la pata: rumor grave que sube + crujido de hielo
      T('sawtooth', 48, 95, 1.1, 0.1, { a: 0.5, flt: { t: 'lowpass', f: [180, 520], q: 3 } }), th(40, 70, 1.1, 0.25, { a: 0.5 }),
      N('bandpass', 800, 2400, 1.1, 0.06, 2, { a: 0.55 }), th(900, 1900, 1, 0.025, { a: 0.5, vib: [6, 40] })] },
    yar_stomp: { kind: 'impact', min: 200, L: cat(thud(1.1, 0, 0.9), [th(40, 24, 0.5, 0.5, { a: 0.004 })], shatter(0.35, 0.02)) },
    yar_ring: { kind: 'move', min: 200, L: [   // anillo de hielo que se expande
      N('bandpass', 1200, 4200, 0.7, 0.14, 2.5, { a: 0.05 }), th(300, 120, 0.6, 0.07, { a: 0.03 }), N('highpass', 5000, 3000, 0.5, 0.04, 1, { a: 0.1 })] },
    yar_spike_tele: { kind: 'tele', min: 200, L: [   // aviso 900 ms de estalagmita: zumbido de roca que sube
      th(120, 220, 0.8, 0.09, { a: 0.4 }), N('lowpass', 500, 1400, 0.8, 0.06, 1, { a: 0.4 })].concat(ticks(4, 0.15, 3400, 0.1, 0.1)) },
    yar_spike: { kind: 'impact', min: 80, L: [   // brota estalagmita
      th(95, 38, 0.28, 0.7, { a: 0.002 }), N('lowpass', 2600, 300, 0.2, 0.3, 0.8, { a: 0.001 }), N('highpass', 3500, 7000, 0.12, 0.16, 1, { a: 0.001 }), th(2000, 900, 0.1, 0.05)] },

    // ---------------- 2 Embestida glaciar (tele 1200 ms; acelera 750 ms; derrape 220 px; choque)
    yar_charge_tele: { kind: 'tele', min: 600, L: [   // resoplido y raspar de colmillos: sube y se mantiene
      T('sawtooth', 60, 125, 1.2, 0.11, { a: 0.5, vib: [20, 35], flt: { t: 'lowpass', f: [220, 800], q: 3 } }), th(44, 74, 1.2, 0.25, { a: 0.5 }),
      N('bandpass', 400, 1800, 1.2, 0.1, 1.5, { a: 0.55 }), T('triangle', 700, 1500, 1.1, 0.025, { a: 0.5, vib: [9, 50] })].concat(thud(0.35, 0.6, 0.9)).concat(thud(0.35, 0.9, 1)) },
    yar_charge_go: { kind: 'move', min: 400, L: [   // arranque con inercia: patadas que se aceleran + soplido
      N('bandpass', 300, 2000, 0.75, 0.16, 1, { a: 0.1 }), th(60, 36, 0.2, 0.8, { a: 0.003 }), th(56, 34, 0.18, 0.7, { delay: 0.2, a: 0.003 }),
      th(54, 33, 0.16, 0.6, { delay: 0.35, a: 0.003 }), th(52, 32, 0.15, 0.55, { delay: 0.47, a: 0.003 }), th(50, 32, 0.14, 0.5, { delay: 0.57, a: 0.003 }), th(48, 30, 0.14, 0.5, { delay: 0.66, a: 0.003 })] },
    yar_skid: { kind: 'move', min: 500, L: [   // derrape de 220 px: raspado de hielo que baja
      N('bandpass', 2200, 450, 0.7, 0.2, 1.4, { a: 0.03 }), N('highpass', 5200, 2400, 0.6, 0.06, 1, { a: 0.03 }), th(90, 45, 0.65, 0.2, { a: 0.03 }), T('sawtooth', 160, 70, 0.6, 0.04, { a: 0.05, flt: { t: 'lowpass', f: [900, 200], q: 1 } })] },
    tusk_crash: { kind: 'impact', min: 300, L: cat([   // choque contra pared/estalagmita: aturdido
      th(60, 20, 0.7, 1, { a: 0.003 }), N('lowpass', 1800, 100, 0.45, 0.45, 0.8, { a: 0.001 }), T('sawtooth', 130, 50, 0.3, 0.12, { a: 0.002 }),
      th(800, 500, 0.3, 0.07, { delay: 0.02 })], shatter(0.8, 0.02), [th(48, 22, 0.8, 0.5, { delay: 0.25, a: 0.01 })]) },

    // ---------------- 3 Cornada ascendente (tele 950 ms; barrido de colmillos)
    yar_gore_tele: { kind: 'tele', min: 400, L: [   // colmillos que rozan el hielo mientras se agacha
      N('bandpass', 1200, 3400, 0.95, 0.09, 4, { a: 0.5, sus: 0.7 }), T('triangle', 220, 520, 0.95, 0.06, { a: 0.5, flt: { t: 'lowpass', f: [800, 1800], q: 2 } }),
      th(50, 86, 0.95, 0.22, { a: 0.5 }), th(1400, 2200, 0.9, 0.02, { a: 0.5, vib: [8, 40] })] },
    yar_gore: { kind: 'impact', min: 140, L: [   // barrido ascendente del colmillo + golpe
      N('bandpass', 700, 4800, 0.22, 0.28, 1.5, { a: 0.01 }), th(180, 480, 0.2, 0.1, { a: 0.01 }), th(75, 28, 0.3, 0.85, { delay: 0.12, a: 0.002 }), N('lowpass', 1400, 120, 0.2, 0.3, 1, { delay: 0.12, a: 0.001 }), th(2400, 2000, 0.1, 0.05, { delay: 0.12 })] },
    yar_trunk: { kind: 'impact', min: 140, L: [   // golpe de trompa: latigazo carnoso + bocina corta
      N('bandpass', 2400, 600, 0.12, 0.3, 1.2, { a: 0.002 }), th(110, 36, 0.28, 0.8, { delay: 0.04, a: 0.002 }), T('sawtooth', 340, 200, 0.28, 0.07, { delay: 0.05, a: 0.01, flt: { t: 'bandpass', f: [900, 600], q: 3 } }), N('lowpass', 1200, 150, 0.18, 0.25, 1, { delay: 0.04, a: 0.001 })] },

    // ---------------- 4 Aliento polar (tele 1150 ms; cono que barre 1,2 s; tick cada 250 ms)
    yar_breath_tele: { kind: 'tele', min: 500, L: [   // inhala: succion de aire frio que sube + silbido
      N('bandpass', 250, 2200, 1.15, 0.16, 1.2, { a: 0.65 }), N('bandpass', 1200, 3600, 1.15, 0.06, 6, { a: 0.65 }), th(70, 120, 1.15, 0.16, { a: 0.6 }), th(1800, 2900, 1.1, 0.02, { a: 0.6, vib: [7, 50] })] },
    ice_breath: { kind: 'move', min: 1000, L: [   // aliento sostenido (1,2 s): soplido helado con cristales
      N('bandpass', 1400, 900, 1.25, 0.22, 0.9, { a: 0.1, sus: 0.8 }), N('highpass', 5200, 4000, 1.25, 0.07, 1, { a: 0.12, sus: 0.8 }), N('bandpass', 3000, 2200, 1.25, 0.06, 5, { a: 0.1, vib: [6, 40] }), th(90, 70, 1.25, 0.12, { a: 0.1 })].concat(ticks(6, 0.2, 4000, 0.06, 0.05)) },
    yar_breath_tick: { kind: 'impact', min: 120, L: [   // tick de 7 de dano + Frio (cada 250 ms; usar vol 0.5)
      N('highpass', 4000, 6500, 0.07, 0.2, 1, { a: 0.001 }), th(2500, 2000, 0.09, 0.07), th(120, 70, 0.08, 0.25, { a: 0.002 })] },

    // ---------------- 5 Llamada de la manada (tele 900 ms)
    yar_call_tele: { kind: 'tele', min: 600, L: [   // cuerno de mamut + coro de aullidos que se alzan
      T('sawtooth', 120, 210, 0.9, 0.09, { a: 0.35, vib: [6, 40], flt: { t: 'lowpass', f: [600, 1200], q: 3 } }),
      T('triangle', 330, 600, 0.9, 0.07, { a: 0.3, vib: [5, 40], flt: { t: 'lowpass', f: [1700, 1200], q: 2 } }), T('triangle', 380, 690, 0.9, 0.05, { delay: 0.08, a: 0.3, vib: [6, 50], flt: { t: 'lowpass', f: [1800, 1300], q: 2 } }),
      th(50, 80, 0.9, 0.2, { a: 0.35 })] },
    yar_call: { kind: 'move', min: 600, L: [   // los lobos responden (invoca)
      T('triangle', 420, 700, 0.5, 0.07, { a: 0.1, vib: [6, 40], flt: { t: 'lowpass', f: [1700, 1200], q: 2 } }), T('triangle', 360, 560, 0.55, 0.06, { delay: 0.1, a: 0.1, vib: [5, 40], flt: { t: 'lowpass', f: [1500, 1000], q: 2 } }),
      T('triangle', 500, 800, 0.45, 0.05, { delay: 0.2, a: 0.1, vib: [7, 40] }), N('highpass', 3500, 6000, 0.3, 0.08, 1, { a: 0.02 }), th(75, 40, 0.3, 0.5, { a: 0.003 })] },

    // ---------------- 6 Alud (tele 1000 ms; 8 bloques cada 220 ms; bloque de hielo 6 s)
    yar_slide_tele: { kind: 'tele', min: 600, L: [   // retumbar de nieve en la montana: crece sin golpe
      N('lowpass', 250, 1100, 1, 0.3, 1.5, { a: 0.7 }), th(36, 62, 1, 0.3, { a: 0.7 }), N('bandpass', 700, 2200, 1, 0.08, 2, { a: 0.7, sus: 0.6 })].concat(ticks(5, 0.16, 2600, 0.07, 0.2)) },
    yar_block_tele: { kind: 'tele', min: 90, L: [   // sombra de cada bloque: silbido descendente corto
      th(1500, 700, 0.3, 0.06, { a: 0.1 }), N('bandpass', 2500, 900, 0.3, 0.06, 3, { a: 0.1 })] },
    yar_block: { kind: 'impact', min: 90, L: cat([   // bloque cae y se astilla
      th(80, 32, 0.28, 0.8, { a: 0.002 }), N('lowpass', 2200, 200, 0.2, 0.35, 0.8, { a: 0.001 }), N('highpass', 3000, 7000, 0.14, 0.14, 1, { a: 0.001 }), th(2200, 1600, 0.1, 0.05)]) },

    // ---------------- 7 Latido gelido (tele 1300 ms; pulso con zona segura; pecho abierto)
    yar_pulse_tele: { kind: 'tele', min: 700, L: cat([   // cuenta atras: latidos que se aceleran sobre un zumbido ascendente (firma)
      T('sawtooth', 55, 140, 1.3, 0.09, { a: 0.7, flt: { t: 'lowpass', f: [200, 900], q: 4 } }), th(1000, 2800, 1.3, 0.03, { a: 0.8, vib: [10, 70] }), N('bandpass', 500, 3500, 1.3, 0.07, 2, { a: 0.8 })],
      thud(0.5, 0.05, 1.1), thud(0.5, 0.4, 1.1), thud(0.55, 0.7, 1.15), thud(0.6, 0.95, 1.2), thud(0.65, 1.15, 1.25)) },
    yar_pulse: { kind: 'impact', min: 400, L: cat([   // onda gelida de 280 px: estallido + barrido de aire + campana grave
      th(48, 18, 0.9, 1, { a: 0.004 }), N('lowpass', 2500, 100, 0.6, 0.4, 0.8, { a: 0.002 }), N('bandpass', 400, 6000, 0.9, 0.16, 1, { a: 0.02 }), th(2200, 900, 1, 0.05, { a: 0.01 })], shatter(0.55, 0.05)) },
    yar_window_loop: { kind: 'move', min: 380, L: cat([   // pecho abierto: latido cristalino (llamar cada ~0.6 s mientras dure la ventana)
      th(78, 42, 0.14, 0.6, { a: 0.003 }), th(1500, 1500, 0.4, 0.04, { a: 0.003 }), th(3100, 3100, 0.25, 0.02, { a: 0.003 })], thud(0.4, 0.17, 1.05)) },

    // ---------------- 8 Ventisca blanca (tele 1250 ms; 3 olas cada 1,5 s)
    yar_blizz_tele: { kind: 'tele', min: 700, L: [   // viento que sube a silbido con flecha de aire
      N('bandpass', 200, 1800, 1.25, 0.22, 1, { a: 0.7 }), N('bandpass', 800, 3000, 1.25, 0.08, 7, { a: 0.7 }), th(160, 330, 1.25, 0.05, { a: 0.65, vib: [4, 40] }), th(1400, 2500, 1.2, 0.02, { a: 0.65, vib: [8, 70] })] },
    yar_blizz_wave: { kind: 'move', min: 600, L: [   // ola de ventisca que cruza la arena (1,5 s)
      N('bandpass', 400, 1600, 1.5, 0.3, 0.8, { a: 0.35, sus: 0.5 }), N('bandpass', 1100, 2900, 1.5, 0.1, 6, { a: 0.4, sus: 0.5 }), N('highpass', 5500, 3000, 1.4, 0.05, 1, { a: 0.4 }), th(90, 60, 1.4, 0.1, { a: 0.3 })] },

    // ---------------- Desesperado (Invierno Eterno) y grieta
    icicle_rain: { kind: 'move', min: 800, L: cat([   // oleada de 12 caramanos que sale de el (cada 1,4 s)
      N('bandpass', 5000, 2200, 0.7, 0.07, 2, { a: 0.02 }), N('highpass', 4000, 7000, 0.35, 0.06, 1, { a: 0.01 }), th(95, 50, 0.3, 0.45, { a: 0.003 })],
      bursts(8, 0.07, function (i, dl) { return th(3600 + i * 260, 2600 + i * 120, 0.2, 0.05, { delay: dl + 0.02, a: 0.002 }); })) },
    yar_chasm: { kind: 'impact', min: 400, L: cat([   // grieta de hielo que se abre (F2+)
      N('bandpass', 3000, 900, 0.8, 0.12, 6, { a: 0.02 }), th(70, 30, 0.9, 0.55, { a: 0.02 }), N('lowpass', 900, 120, 0.8, 0.2, 1, { a: 0.05 })], ticks(7, 0.09, 3000, 0.12, 0.03)) },

    // ---------------- Stingers (kind 'stinger'; 1 vez por evento)
    yar_stg_intro: { kind: 'stinger', min: 2000, L: cat([   // entrada: bajo de cuernos + hielo + campanas frias
      T('sawtooth', 46, 58, 2.6, 0.14, { a: 0.7, sus: 0.7, flt: { t: 'lowpass', f: [180, 520], q: 3 } }), th(34, 30, 2.6, 0.35, { a: 0.5 }), N('bandpass', 400, 900, 2, 0.06, 1.5, { a: 0.8 })],
      thud(0.8, 0.02, 0.9), thud(0.9, 1.0, 0.85), shatter(0.4, 1.05), bell(293.7, 0.06, 1.8, 1.4), bell(440, 0.05, 1.8, 1.8)) },
    yar_stg_p2: { kind: 'stinger', min: 1000, L: cat([   // F2 La manada: aullidos en coro + golpes
      T('triangle', 300, 520, 1.3, 0.08, { a: 0.3, vib: [5, 40], flt: { t: 'lowpass', f: [1500, 1100], q: 2 } }), T('triangle', 360, 640, 1.3, 0.06, { delay: 0.15, a: 0.3, vib: [6, 40] }),
      T('triangle', 250, 400, 1.2, 0.05, { delay: 0.3, a: 0.3, vib: [5, 50] }), th(46, 40, 1.6, 0.3, { a: 0.2 })], thud(0.8), thud(0.8, 0.45), bell(440, 0.05, 1.4, 0.9)) },
    yar_stg_p3: { kind: 'stinger', min: 1000, L: cat([   // F3 Corazon helado: latido que crece + coro
      th(146.8, 146.8, 1.7, 0.07, { a: 0.5 }), th(220, 220, 1.7, 0.05, { a: 0.6 }), T('triangle', 293.7, 293.7 * 1.003, 1.6, 0.03, { a: 0.7, vib: [4, 12] })],
      thud(0.7, 0, 1), thud(0.5, 0.17, 1.1), thud(0.85, 0.5, 1.05), thud(0.6, 0.67, 1.15), thud(1, 1.0, 1.1), thud(0.7, 1.17, 1.2), ticks(5, 0.1, 3600, 0.1, 1.2), bell(587, 0.05, 1.2, 1.25)) },
    yar_stg_p4: { kind: 'stinger', min: 1200, L: cat([   // F4 Invierno eterno: ventisca ascendente + coro grave + estallido
      N('bandpass', 300, 7000, 1.7, 0.22, 1.2, { a: 1.2 }), N('highpass', 2000, 8000, 1.7, 0.08, 1, { a: 1.2 }),
      T('sawtooth', 73.4, 73.4, 2.6, 0.07, { a: 0.8, sus: 0.7, flt: { t: 'lowpass', f: [250, 600], q: 2 } }), T('sawtooth', 110, 110.6, 2.6, 0.05, { a: 0.9, sus: 0.7, flt: { t: 'lowpass', f: [250, 600], q: 2 } }),
      T('sawtooth', 87.3, 87.6, 2.6, 0.045, { a: 0.9, sus: 0.7, flt: { t: 'lowpass', f: [250, 600], q: 2 } }), th(36, 30, 2.6, 0.4, { a: 0.8 })], thud(1, 1.6, 0.85), shatter(0.7, 1.62)) },
    yar_stg_despair: { kind: 'stinger', min: 2000, L: cat([   // Invierno Eterno (<8 %): rugido + triton + golpes frenticos
      T('sawtooth', 48, 100, 3, 0.15, { a: 0.4, sus: 0.7, vib: [16, 50], flt: { t: 'lowpass', f: [250, 1000], q: 3 } }), T('sawtooth', 68, 140, 3, 0.07, { a: 0.5, vib: [14, 50], flt: { t: 'lowpass', f: [300, 1100], q: 3 } }),
      th(34, 50, 3, 0.35, { a: 0.4 }), N('bandpass', 400, 6000, 3, 0.18, 1, { a: 1.6 }), T('sawtooth', 900, 2600, 2.4, 0.03, { delay: 0.6, a: 1.2, vib: [20, 90], flt: { t: 'bandpass', f: [1500, 3500], q: 3 } })],
      thud(1, 0), thud(0.9, 0.35, 0.95), thud(0.9, 0.7, 0.9), thud(0.85, 1.0, 1), thud(0.85, 1.25, 1.05), thud(0.85, 1.5, 1.1), thud(0.95, 1.7, 1.15), shatter(0.6, 2.2), shatter(0.5, 2.7)) },
    yar_stg_part_tusk: { kind: 'stinger', min: 250, L: cat([   // colmillo roto: crac seco de marfil + eco claro
      N('bandpass', 1800, 900, 0.1, 0.4, 5, { a: 0.0008 }), th(300, 80, 0.22, 0.7, { a: 0.002 }), th(1250, 1200, 0.5, 0.05, { delay: 0.05 }), N('lowpass', 1500, 150, 0.2, 0.3, 1, { a: 0.001 })], bell(880, 0.04, 0.7, 0.12)) },
    yar_stg_part_armor: { kind: 'stinger', min: 250, L: cat([   // armadura de hielo rota: estallido grande + cascada de cristales
      th(100, 36, 0.4, 0.8, { a: 0.002 })], shatter(1, 0), shatter(0.6, 0.15), ticks(8, 0.06, 3500, 0.1, 0.25), bell(1174, 0.04, 0.9, 0.3)) },
    yar_stg_part_heart: { kind: 'stinger', min: 250, L: cat([   // corazon helado roto: cristal que se quiebra + latido que se apaga + campana
      N('bandpass', 5200, 2200, 0.18, 0.32, 6, { a: 0.001 }), N('highpass', 3500, 8000, 0.5, 0.18, 1, { a: 0.001 }), th(2700, 2600, 0.8, 0.07)],
      thud(0.9, 0.1, 1), thud(0.6, 0.42, 0.8), thud(0.35, 0.8, 0.65), bell(659, 0.06, 1.4, 0.5), bell(988, 0.05, 1.4, 0.65)) },
    yar_stg_window: { kind: 'stinger', min: 300, L: cat(   // ventana de dano abierta: arpegio cristalino ascendente + latido
      bell(784, 0.07, 0.8, 0), bell(1047, 0.07, 0.8, 0.08), bell(1568, 0.07, 1, 0.16), [th(1318, 1318, 0.5, 0.025, { delay: 0.2 }), N('highpass', 6000, 9000, 0.3, 0.05, 1, { a: 0.1 })], thud(0.7, 0, 1.2), thud(0.5, 0.17, 1.3)) },
    yar_stg_death: { kind: 'stinger', min: 4000, L: cat([   // desmoronamiento largo (6 s): gran estampido, derrumbe, cristales, ultimo latido y viento
      th(60, 18, 3.5, 1, { a: 0.005 }), N('lowpass', 1800, 80, 5.5, 0.35, 0.8, { a: 0.05, sus: 0.3 }), N('bandpass', 600, 150, 5, 0.12, 1.2, { a: 0.5 }),
      T('sawtooth', 62, 30, 3.2, 0.12, { a: 0.05, vib: [14, 40], flt: { t: 'lowpass', f: [500, 120], q: 2 } }), th(30, 20, 4, 0.5, { delay: 0.5, a: 0.05 })],
      thud(1, 0.9, 0.8), thud(0.8, 1.7, 0.7), thud(0.6, 2.6, 0.6), thud(0.45, 3.8, 0.55), shatter(1, 0.3), shatter(0.7, 1.2), shatter(0.7, 2.1), shatter(0.5, 3.1), shatter(0.4, 4.3),
      ticks(18, 0.2, 3000, 0.1, 0.4), [N('bandpass', 500, 1500, 2, 0.1, 1, { delay: 4, a: 1, sus: 0.3 })], bell(293.7, 0.06, 1.8, 4.2)) },
    yar_stg_victory: { kind: 'stinger', min: 2000, L: cat([   // victoria: campanas claras sobre quinta abierta; el viento se calma
      T('triangle', 146.8, 146.8, 3.2, 0.1, { a: 0.4, sus: 0.6, flt: { t: 'lowpass', f: [900, 500], q: 1 } }), T('triangle', 220, 220, 3.2, 0.08, { a: 0.5, sus: 0.6, flt: { t: 'lowpass', f: [900, 500], q: 1 } }),
      th(73.4, 73.4, 3.2, 0.2, { a: 0.4 }), N('bandpass', 700, 300, 3, 0.07, 1, { a: 0.3 })],
      bell(587, 0.08, 1.8, 0.1), bell(740, 0.08, 1.8, 0.4), bell(880, 0.08, 1.8, 0.7), bell(1175, 0.09, 2.2, 1.0), bell(1480, 0.05, 2, 1.5), [N('highpass', 7000, 9000, 1, 0.04, 1, { delay: 1, a: 0.1 })]) }
  };
  var GAIN = { yar_ring: 3, yar_block_tele: 3, yar_breath_tick: 3, yar_spike_tele: 2.2, icicle_rain: 2.5, yar_blizz_tele: 2.5, yar_call: 2, yar_skid: 2, yar_stg_part_tusk: 2.5, yar_stg_part_armor: 2, yar_spike: 1.5, yar_block: 1.3, yar_chasm: 1.5, yar_blizz_wave: 1.4, yar_charge_go: 0.8, yar_gore: 0.8 };
  Object.keys(DEFS).forEach(function (n) { DEFS[n].fam = 'yarlak'; DEFS[n].gain = GAIN[n] || 1; });
  var names = Object.keys(DEFS);

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
  var yarPlaying = false;
  function applyVol() {
    if (!ac) return; var v = A.getVolume();
    chain.g.gain.value = muted ? 0 : v.master * v.sfx * 0.85;
    chain.mg.gain.value = muted || !yarPlaying ? 0 : v.master * v.music;
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
  A.sfxYarlak = {};
  names.forEach(function (n) { A.sfxYarlak[n] = { kind: DEFS[n].kind, fam: 'yarlak', min: DEFS[n].min, dur: dur(DEFS[n]) }; });

  // Stingers en el sistema de G.Snd.V (los dispara G.Boss.stinger: 'stg_yarlak_<intro|p2|p3|p4|despair>'). Delegan en los de Assets.
  (function () {
    var S = window.G && window.G.Snd; if (!S || !S.V) return;
    ['intro', 'p2', 'p3', 'p4', 'despair'].forEach(function (k) { S.V['stg_yarlak_' + k] = function () { A.sfx('yar_stg_' + k, { vary: 0 }); }; });
    ['part_tusk', 'part_armor', 'part_heart', 'window', 'death', 'victory'].forEach(function (k) { S.V['stg_yarlak_' + k] = function () { A.sfx('yar_stg_' + k, { vary: 0 }); }; });
  })();

  // ================= Musica 'boss_yarlak' (78 BPM, Re menor frigio). 4 capas por fase + variante desesperada.
  var YB = { bpm: 78, prog: [38, 38, 34, 36, 38, 38, 41, 33] };
  function mtof(m) { return 440 * Math.pow(2, (m - 69) / 12); }
  function hash(n) { var x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); }
  var PH = 1, DES = false;
  function yStep(step, t, ph, des, c, k) {
    var spb = 60 / YB.bpm / 4, bar = Math.floor(step / 16) % YB.prog.length, s = step % 16, root = YB.prog[bar], cyc = Math.floor(step / 16) % 8;
    function mv(L, send, v) { layer(L, t + (L.delay || 0), 1, v == null ? 1 : v, c, k, k.mg, send); }
    var bar16 = spb * 16;
    if (s === 0) {   // siempre: bajo grave + viento + bordon de quinta fria
      mv(th(mtof(root - 12), mtof(root - 12), bar16, 0.2, { a: 0.3, sus: 0.8 }));
      mv(T('sawtooth', mtof(root - 12), mtof(root - 12), bar16, 0.05, { a: 0.4, sus: 0.8, flt: { t: 'lowpass', f: [160, 260], q: 2 } }));
      mv(N('bandpass', 380 + ph * 80, 700 + ph * 140, bar16, 0.07 + ph * 0.02 + (des ? 0.06 : 0), 0.8, { a: bar16 * 0.4, sus: 0.7 }));
      mv(T('triangle', mtof(root), mtof(root) * 1.004, bar16, 0.035, { a: 0.7, sus: 0.7, vib: [3, 12], flt: { t: 'lowpass', f: [600, 400], q: 1 } }));
    }
    // F1: ostinato grave de cuernos + golpe de hielo en tiempos fuertes
    var horns = [0, 6, 10];
    if (horns.indexOf(s) >= 0 || (ph >= 3 && s === 14)) {
      var hn = s === 10 ? root + 7 - 12 : root - 12, hd = spb * (s === 0 ? 5 : 3.5);
      mv(T('sawtooth', mtof(hn + 12), mtof(hn + 12), hd, 0.07, { a: 0.05, flt: { t: 'lowpass', f: [450, 280], q: 3 } }));
      mv(th(mtof(hn), mtof(hn), hd, 0.1, { a: 0.05 }));
    }
    if (s === 0 || (s === 8 && ph >= 1)) {   // golpe de hielo: tom grave + crujido cristalino
      mv(th(78, 30, 0.35, 0.55, { a: 0.003 })); mv(N('bandpass', 4200, 3000, 0.06, 0.07, 6, { a: 0.001 }), false); mv(th(2400, 2000, 0.25, 0.012, { a: 0.002 }), true);
    }
    if (ph === 1 && s % 4 === 2 && hash(step * 3 + 1) < 0.2) { var f1 = mtof(root + 24 + [0, 1, 5, 7][Math.floor(hash(step) * 4)]); bell(f1, 0.07, 2, 0).forEach(function (L) { mv(L, true); }); }
    // F2: aullidos de manada (seno con glissando) + mas golpes
    if (ph >= 2) {
      if (s === 0 && cyc % 2 === 1) { var hf = mtof(root + 12 + (cyc % 4 === 1 ? 7 : 3)); mv(T('sine', hf, hf * 1.6, spb * 8, 0.06, { a: 0.5, vib: [5, 35] }), true); mv(T('sine', hf * 1.01, hf * 1.5, spb * 8, 0.04, { delay: 0.2, a: 0.5, vib: [6, 40] }), true); }
      if (s === 6 || s === 14) mv(th(70, 28, 0.25, 0.4, { a: 0.003 }));
      if (s % 2 === 0 && hash(step * 3 + 1) < 0.28) { var f2 = mtof(root + 24 + [0, 1, 5, 7, 8][Math.floor(hash(step + 2) * 5)]); bell(f2, 0.07, 2, 0).forEach(function (L) { mv(L, true); }); }
    }
    // F3: bombo al latido del Corazon (dum-dum), coro de quintas y crujidos
    if (ph >= 3) {
      if (s === 0 || s === 8) { mv(th(62, 30, 0.2, 0.7, { a: 0.003 })); mv(th(50, 30, 0.14, 0.4, { delay: spb * 1.5, a: 0.003 })); }
      if (s === 0) { [0, 7, 12].forEach(function (iv, i) { mv(T('triangle', mtof(root + iv), mtof(root + iv) * (1.005 + i * 0.002), bar16, 0.045, { a: 0.8, sus: 0.7, vib: [4, 14], flt: { t: 'lowpass', f: [900, 600], q: 1 } }), true); }); }
      if (s % 4 === 3 && hash(step * 5 + 2) < 0.35) mv(N('bandpass', 4600, 3800, 0.04, 0.06, 7, { a: 0.001 }));
    }
    // F4: ventisca ascendente (barrido de ruido cada 8 compases), coro grave, golpes en negras
    if (ph >= 4) {
      if (s % 4 === 0) mv(th(66, 28, 0.2, 0.5, { a: 0.003 }));
      if (s % 2 === 1 && hash(step * 7) < 0.4) mv(N('bandpass', 5200, 3800, 0.04, 0.05, 7, { a: 0.001 }), true);
      if (s === 0) {
        mv(N('bandpass', 300 + cyc * 200, 900 + cyc * 500, bar16, 0.09 + cyc * 0.01, 1.2, { a: bar16 * 0.8 }));
        [-12, -5, 0].forEach(function (iv, i) { mv(T('sawtooth', mtof(root + iv + 12), mtof(root + iv + 12) * (1 + i * 0.003), bar16, 0.035, { a: 0.7, sus: 0.7, flt: { t: 'lowpass', f: [320, 480], q: 3 } })); });
      }
    }
    // Desesperado: triton disonante, golpes en corcheas, ventisca al maximo
    if (des) {
      if (s % 2 === 0) mv(th(80 + (s % 4) * 6, 30, 0.14, 0.45, { a: 0.003 }));
      if (s === 0 || s === 8) { mv(T('sawtooth', mtof(root + 6), mtof(root + 6) * 1.01, spb * 8, 0.045, { a: 0.3, flt: { t: 'lowpass', f: [700, 500], q: 4 } })); mv(T('triangle', mtof(root + 18), mtof(root + 18) * 1.5, spb * 8, 0.03, { a: 0.5, vib: [10, 60] }), true); }
      if (s % 4 === 1) mv(N('highpass', 6500, 8500, 0.05, 0.07, 1, { a: 0.002 }));
      if (s % 4 === 2 && hash(step) < 0.6) bell(mtof(root + 30 + (s % 3)), 0.06, 1.2, 0).forEach(function (L) { mv(L, true); });
    }
    return spb;
  }
  function phaseOf(v) { return v < 0.375 ? 1 : v < 0.625 ? 2 : v < 0.875 ? 3 : 4; }

  var YS = { timer: null, step: 0, next: 0 }, yar = false, want = false;
  var M0 = A.music, p = { start: M0.start, stop: M0.stop, setTrack: M0.setTrack, getTrack: M0.getTrack, tracks: M0.tracks, isPlaying: M0.isPlaying, setIntensity: M0.setIntensity };
  function ySched() {
    if (!ac || ac.state !== 'running') return;
    while (YS.next < ac.currentTime + 0.2) { YS.next += yStep(YS.step, YS.next, PH, DES, ac, chain); YS.step++; }
  }
  function yStart() {
    if (yarPlaying || !yar || !want) return;
    if (!A.isUnlocked() || !ensure()) { setTimeout(yStart, 400); return; }
    if (ac.state !== 'running') { try { ac.resume(); } catch (e) { /* audio */ } setTimeout(yStart, 300); return; }
    yarPlaying = true; YS.step = 0; YS.next = ac.currentTime + 0.1;
    var v = A.getVolume(); chain.mg.gain.cancelScheduledValues(ac.currentTime); chain.mg.gain.setValueAtTime(0.0001, ac.currentTime);
    chain.mg.gain.linearRampToValueAtTime(muted ? 0 : v.master * v.music, ac.currentTime + 0.5);
    YS.timer = setInterval(ySched, 30);
  }
  function yStop() {
    if (!yarPlaying) return; yarPlaying = false; clearInterval(YS.timer); YS.timer = null;
    try { chain.mg.gain.cancelScheduledValues(ac.currentTime); chain.mg.gain.setValueAtTime(chain.mg.gain.value, ac.currentTime); chain.mg.gain.linearRampToValueAtTime(0.0001, ac.currentTime + 0.4); } catch (e) { /* audio */ }
  }
  M0.start = function () { want = true; if (yar) yStart(); else p.start(); };
  M0.stop = function () { want = false; yStop(); p.stop(); };
  M0.setIntensity = function (v) { if (yar) PH = phaseOf(Math.max(0, Math.min(1, typeof v === 'boolean' ? (v ? 1 : 0) : (+v || 0)))); p.setIntensity(v); };
  M0.setPhase = function (n) { PH = Math.max(1, Math.min(4, Math.round(+n) || 1)); };
  M0.setDespair = function (b) { DES = !!b; };
  M0.getPhase = function () { return PH; };
  M0.setTrack = function (name) {
    if (name === 'boss_yarlak') { if (yar) return; yar = true; PH = 1; DES = false; p.stop(); if (want) yStart(); return; }
    if (yar) { yar = false; yStop(); p.setTrack(name); if (want) p.start(); return; }
    p.setTrack(name);
  };
  M0.getTrack = function () { return yar ? 'boss_yarlak' : p.getTrack(); };
  M0.tracks = function () { return p.tracks().concat(['boss_yarlak']); };
  M0.isPlaying = function () { return yar ? yarPlaying : p.isPlaying(); };

  var origRM = A.renderMusic;
  A.renderMusic = function (o) {
    o = o || {};
    if (o.track !== 'boss_yarlak') return origRM.apply(this, arguments);
    var OC = window.OfflineAudioContext || window.webkitOfflineAudioContext;
    if (!OC) return Promise.reject(new Error('OfflineAudioContext no disponible'));
    var bars = o.bars || 8, spb = 60 / YB.bpm / 4, ph = o.phase || (o.intensity == null ? 4 : phaseOf(o.intensity));
    var oc = new OC(2, Math.ceil((bars * 16 * spb + 3) * 44100), 44100), k = mkChain(oc, oc.destination, 1);
    k.mg.gain.value = 0.8;
    for (var i = 0; i < bars * 16; i++) yStep(i, 0.05 + i * spb, ph, !!o.despair, oc, k);
    return oc.startRendering();
  };
})();
