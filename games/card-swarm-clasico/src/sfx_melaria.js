/* sfx_melaria.js - Audio de Melaria, la Reina Abeja (P6; DESIGN-v5-biomas.md B.5 / C.5). Script clasico, tras sfx_fam4.js (y sfx_yarlak.js). Solo audio, sin tocar logica ni lo existente.
   Contexto WebAudio propio (como sfx_fam1-4 / sfx_yarlak) que sigue desbloqueo, mute, volumen y suspend de Assets. <= 4 voces por nombre, pitch +-10 %, separacion minima (min, ms).
   kind: 'tele' = telegrafia (zumbido/tono que SUBE y se sostiene, ataque suave, nunca un golpe seco), 'impact' = golpe (grave + ruido corto), 'move' = movimiento/ambiente, 'stinger' = jingle de evento.
   Pista procedural 'boss_melaria' (124 BPM) con 3 capas por fase + variante desesperada: Assets.music.setTrack('boss_melaria'), Assets.music.setPhase(1..3), Assets.music.setDespair(bool).
   Los stingers tambien se registran en G.Snd.V como stg_melaria_<intro|p2|p3|despair|part_wings|part_stinger|part_crown|window|death|victory> (+ alias stg_reina_<intro|p2|p3|despair> de DESIGN B.5). */
(function () {
  'use strict';
  var A = window.Assets;
  if (!A || A._melaria) return;
  A._melaria = true;

  function T(t, f0, f1, d, v, o) { var L = { t: t, f: [f0, f1], d: d, v: v }; if (o) for (var k in o) L[k] = o[k]; return L; }
  function N(type, f0, f1, d, v, q, o) { var L = { n: 1, d: d, v: v, flt: { t: type, f: [f0, f1], q: q || 1 } }; if (o) for (var k in o) L[k] = o[k]; return L; }
  function th(f0, f1, d, v, o) { return T('sine', f0, f1, d, v, o || {}); }
  function cat() { var r = []; for (var i = 0; i < arguments.length; i++) r = r.concat(arguments[i]); return r; }
  function bursts(n, step, mk) { var r = []; for (var i = 0; i < n; i++) r.push(mk(i, i * step + (i % 2) * step * 0.18)); return r; }
  function buzz(f0, f1, d, v, o, rate, dep) { var L = T('sawtooth', f0, f1, d, v, { trem: [rate || 38, dep == null ? 0.55 : dep], flt: { t: 'lowpass', f: [f0 * 5, f1 * 5], q: 1.4 } }); if (o) for (var k in o) L[k] = o[k]; return L; }
  function pop(v, dl, f) { f = f || 1; return [th(520 * f, 170 * f, 0.09, 0.6 * v, { delay: dl, a: 0.002 }), N('bandpass', 1800 * f, 700, 0.04, 0.2 * v, 3, { delay: dl, a: 0.001 })]; }
  function squelch(v, dl, f) { f = f || 1; return [th(230 * f, 80 * f, 0.15, 0.5 * v, { delay: dl, a: 0.004, vib: [22, 160] }), N('bandpass', 520 * f, 200, 0.15, 0.18 * v, 3, { delay: dl, a: 0.004 }), th(700 * f, 360 * f, 0.06, 0.12 * v, { delay: dl + 0.05, a: 0.002 })]; }
  function drip(v, dl, f) { f = f || 1; return [th(1000 * f, 420 * f, 0.07, 0.3 * v, { delay: dl, a: 0.002 }), th(1500 * f, 800 * f, 0.04, 0.1 * v, { delay: dl, a: 0.001 })]; }
  function thud(v, dl, f) { f = f || 1; return [th(90 * f, 34, 0.28, 0.9 * v, { delay: dl, a: 0.003 }), N('lowpass', 1200, 140, 0.18, 0.3 * v, 0.8, { delay: dl, a: 0.001 })]; }
  function wax(v, dl) { return [N('bandpass', 1500, 600, 0.1, 0.35 * v, 4, { delay: dl, a: 0.001 }), th(260, 110, 0.12, 0.4 * v, { delay: dl, a: 0.002 }), th(1900, 1700, 0.06, 0.05 * v, { delay: dl })]; }
  function mar(f, v, d, dl) { dl = dl || 0; d = d || 0.4; return [th(f, f, d, v, { delay: dl, a: 0.002 }), th(f * 3.93, f * 3.93, d * 0.22, v * 0.3, { delay: dl, a: 0.001 }), N('bandpass', f * 5, f * 5, 0.025, v * 0.5, 3, { delay: dl, a: 0.001 })]; }
  function chime(f, v, d, dl) { return [th(f, f, d, v, { delay: dl || 0, a: 0.004 }), th(f * 2.01, f * 2.01, d * 0.6, v * 0.35, { delay: dl || 0, a: 0.004 }), th(f * 3.02, f * 3.02, d * 0.3, v * 0.12, { delay: dl || 0, a: 0.004 })]; }
  function ticks(n, step, f, v, dl0) { return bursts(n, step, function (i, dl) { return N('bandpass', f + i * 200, f + 300, 0.02, v, 8, { delay: (dl0 || 0) + dl, a: 0.0008 }); }); }
  function zips(n, step, v, dl0) { return bursts(n, step, function (i, dl) { return th(2300 - (i % 3) * 200, 900, 0.09, v, { delay: (dl0 || 0) + dl, a: 0.002 }); }); }

  var DEFS = {
    // ---------------- Cuerpo: alas, entrada, caida
    mel_wing_buzz: { kind: 'move', min: 420, L: [   // zumbido de alas del jefe (llamar cada ~0.5 s mientras vuela; pitch 1.0 / 1.08 / 1.16 en F1/F2/F3)
      buzz(165, 150, 0.6, 0.1, { a: 0.1, sus: 0.6 }, 34, 0.6), buzz(172, 158, 0.6, 0.07, { a: 0.1, sus: 0.6 }, 41, 0.6), th(82, 76, 0.55, 0.12, { a: 0.1 }), N('bandpass', 1200, 1700, 0.55, 0.035, 2, { a: 0.1, trem: [34, 0.7] })] },
    boss_roar_reina: { kind: 'tele', min: 1500, roar: 1, L: [   // rugido zumbante regio (entrada y arranque del desesperado). Un solo rugido a la vez
      T('sawtooth', 70, 140, 2, 0.14, { a: 0.3, sus: 0.6, vib: [16, 45], trem: [20, 0.45], flt: { t: 'lowpass', f: [380, 1100], q: 3 } }), T('square', 52, 88, 2, 0.05, { a: 0.35, flt: { t: 'lowpass', f: [240, 420], q: 1 } }),
      th(40, 62, 2, 0.24, { a: 0.35 }), N('bandpass', 500, 1300, 2, 0.07, 1.5, { a: 0.35, sus: 0.6 }), buzz(230, 420, 1.2, 0.05, { delay: 0.25, a: 0.25 }, 46), buzz(420, 190, 0.9, 0.045, { delay: 1.15, a: 0.05 }, 50),
      N('highpass', 5000, 8000, 0.5, 0.04, 1, { delay: 1.5, a: 0.2 })] },
    mel_land:    { kind: 'impact', min: 600, L: cat(thud(1, 0, 0.7), wax(0.6, 0.02), [buzz(180, 60, 0.7, 0.06, { delay: 0.1, a: 0.01, vib: [7, 120] }, 14), N('lowpass', 1400, 120, 0.5, 0.2, 1, { delay: 0.05, a: 0.01 })]) },   // aterriza aturdida (alas rotas, Zumbido en picado sobre miel, fin del desesperado)
    mel_hover_down: { kind: 'tele', min: 700, L: [   // desciende (entrada: 700 ms de zumbido; cae del techo del panal)
      buzz(320, 120, 0.7, 0.1, { a: 0.1 }, 36), N('bandpass', 2400, 500, 0.7, 0.1, 1.2, { a: 0.1 }), th(70, 50, 0.7, 0.2, { a: 0.1 })] },
    // ---------------- 1 Estocada real (tele 900; estoca 380 px/s; expuesta 1,0 s)
    mel_stab_tele: { kind: 'tele', min: 500, L: [   // aguijon que se afila: zumbido tenso que sube y un hilo agudo; la ultima parte queda fija
      buzz(210, 540, 0.9, 0.08, { a: 0.6 }, 46, 0.6), th(1000, 2600, 0.85, 0.03, { a: 0.6, vib: [8, 40] }), N('bandpass', 1500, 4400, 0.9, 0.04, 5, { a: 0.6 }), th(75, 150, 0.9, 0.1, { a: 0.55 })] },
    mel_stab_dash: { kind: 'move', min: 300, L: [   // se echa hacia atras (150 ms) y se lanza: succion + latigazo
      N('bandpass', 500, 2200, 0.15, 0.14, 2, { a: 0.03 }), buzz(200, 480, 0.15, 0.06, {}, 50), N('bandpass', 3800, 700, 0.3, 0.2, 1.2, { delay: 0.15, a: 0.004 }), buzz(420, 170, 0.3, 0.08, { delay: 0.15, a: 0.004 }, 55)] },
    mel_stab:    { kind: 'impact', min: 200, L: [   // AGUIJONAZO (26): pinchazo agudo, crujido de armadura y golpe pesado
      N('highpass', 3000, 7000, 0.08, 0.34, 1, { a: 0.0008 }), th(2600, 700, 0.12, 0.13, { a: 0.001 }), th(150, 48, 0.28, 0.85, { a: 0.002 }), N('lowpass', 1600, 150, 0.2, 0.3, 1, { a: 0.001 }), th(900, 600, 0.3, 0.04, { delay: 0.04 })] },
    mel_exposed: { kind: 'move', min: 600, L: [   // fallo: queda expuesta 1,0 s, el zumbido se descompone
      buzz(300, 110, 0.7, 0.07, { a: 0.02, vib: [9, 150] }, 22), N('bandpass', 1600, 500, 0.6, 0.06, 2, { a: 0.02 }), th(1300, 1300, 0.5, 0.025, { delay: 0.08, a: 0.01 })] },
    // ---------------- 2 Zumbido en picado (firma; tele 1000; cae; atrapada 2,4 s en la miel)
    mel_dive_tele: { kind: 'tele', min: 700, L: cat([   // asciende: zumbido grave que sube a un silbido + sombra que crece (firma)
      buzz(120, 380, 1, 0.1, { a: 0.7 }, 30, 0.6), th(65, 160, 1, 0.14, { a: 0.7 }), N('bandpass', 300, 2600, 1, 0.1, 1.5, { a: 0.75 }), th(900, 2200, 0.9, 0.02, { a: 0.75, vib: [9, 60] })],
      bursts(4, 0.2, function (i, dl) { return th(110 + i * 12, 100 + i * 12, 0.07, 0.12 + i * 0.03, { delay: 0.2 + dl, a: 0.004 }); })) },
    mel_dive:    { kind: 'impact', min: 400, L: cat(thud(1.2, 0, 0.75), [   // cae (28): estampido + onda de aire + cera crujiendo
      N('bandpass', 400, 4500, 0.7, 0.22, 1, { a: 0.02 }), th(42, 24, 0.7, 0.55, { a: 0.01 })], wax(0.8, 0.03), ticks(6, 0.05, 2200, 0.1, 0.06)) },
    mel_trapped: { kind: 'impact', min: 800, L: cat(squelch(1.1, 0, 0.55), squelch(0.7, 0.17, 0.7), [   // aterriza en MIEL: queda atrapada 2,4 s (aturdida, ventana x1,35)
      buzz(220, 90, 1.4, 0.06, { delay: 0.2, a: 0.05, vib: [6, 130] }, 12, 0.8)], drip(0.4, 0.5), drip(0.3, 0.8, 0.9), chime(1175, 0.05, 1.2, 0.35)) },
    mel_rise:    { kind: 'move', min: 500, L: [   // se eleva en 0,8 s (si no cayo en miel)
      buzz(110, 300, 0.8, 0.09, { a: 0.1 }, 32), N('bandpass', 400, 1800, 0.8, 0.08, 1.2, { a: 0.15 }), th(60, 110, 0.7, 0.12, { a: 0.1 })] },
    // ---------------- 3 Lluvia de aguijones (tele 600; cono 80 grados; 9/11/13 x 9)
    mel_stingrain_tele: { kind: 'tele', min: 400, L: [   // cono: aguijones que se cargan, tintineo agudo que sube
      buzz(280, 640, 0.6, 0.07, { a: 0.4 }, 56, 0.7), th(1400, 3000, 0.58, 0.025, { a: 0.4, vib: [12, 50] }), N('bandpass', 2600, 5000, 0.6, 0.03, 5, { a: 0.4 })] },
    mel_stingrain: { kind: 'move', min: 400, L: cat([N('bandpass', 2400, 900, 0.5, 0.12, 1.5, { a: 0.02 }), buzz(260, 180, 0.35, 0.05, {}, 60)], zips(9, 0.045, 0.09, 0.0), [th(110, 55, 0.18, 0.4, { a: 0.003 })]) },
    // ---------------- 4 Llamada del enjambre (tele 800; anillo morado + zumbido)
    mel_call_tele: { kind: 'tele', min: 500, L: [   // cuerno zumbante grave + coro que sube
      buzz(110, 210, 0.8, 0.09, { a: 0.5 }, 22, 0.6), T('triangle', 320, 560, 0.8, 0.05, { a: 0.5, vib: [6, 40], flt: { t: 'lowpass', f: [1300, 1000], q: 2 } }), th(55, 90, 0.8, 0.2, { a: 0.5 }), N('bandpass', 600, 1700, 0.8, 0.05, 2, { a: 0.5, trem: [18, 0.6] })] },
    mel_call:    { kind: 'move', min: 600, L: cat([   // acuden los adds: enjambre que llega + golpe
      buzz(160, 260, 0.7, 0.09, { a: 0.06 }, 30), buzz(200, 300, 0.7, 0.06, { delay: 0.05, a: 0.1 }, 38), N('bandpass', 900, 2200, 0.7, 0.07, 2, { a: 0.05, trem: [30, 0.7] }), th(75, 40, 0.3, 0.6, { a: 0.003 })], pop(0.5, 0.15), pop(0.4, 0.25, 1.2)) },
    // ---------------- 5 Panal abierto (tele 1200; 7-9 celdas + nidos; la miel cae)
    mel_comb_tele: { kind: 'tele', min: 700, L: cat([   // las celdas se tensan: cera que cruje (mas denso que cell_tele) + latidos de nido
      T('triangle', 140, 340, 1.2, 0.07, { a: 0.75, flt: { t: 'lowpass', f: [420, 1200], q: 2 } }), N('bandpass', 500, 2000, 1.2, 0.05, 2, { a: 0.75 }), buzz(90, 150, 1.2, 0.04, { a: 0.8 }, 16)],
      bursts(7, 0.15, function (i, dl) { return N('bandpass', 1200 + i * 200, 900, 0.035, 0.07, 6, { delay: 0.15 + dl, a: 0.004 }); }),
      [th(70, 50, 0.12, 0.25, { delay: 0.6, a: 0.005 }), th(75, 52, 0.12, 0.3, { delay: 0.9, a: 0.005 }), th(80, 54, 0.12, 0.35, { delay: 1.1, a: 0.005 })]) },
    mel_comb_open: { kind: 'move', min: 500, L: cat(bursts(8, 0.045, function (i, dl) { return pop(0.55 + (i % 3) * 0.1, dl, 0.8 + (i % 4) * 0.12); }).reduce(function (a, b) { return a.concat(b); }, []), squelch(0.6, 0.1, 0.7), [N('lowpass', 900, 200, 0.5, 0.08, 1, { delay: 0.05, a: 0.05 })]) },   // se abren las celdas y se llenan
    mel_comb_fall: { kind: 'impact', min: 500, L: cat(thud(1, 0, 0.7), wax(0.9, 0.01), wax(0.5, 0.09), squelch(0.9, 0.05, 0.6), drip(0.5, 0.3), drip(0.4, 0.45, 0.85), ticks(5, 0.06, 2000, 0.1, 0.05)) },   // panal que cae: bloque de cera + miel que salpica
    // ---------------- 6 Torbellino alado (tele 1100; rosquilla; viento empuja)
    mel_whirl_tele: { kind: 'tele', min: 700, L: [   // rosquilla: zumbido que empieza a girar y acelera (tremolo que sube)
      buzz(150, 360, 1.1, 0.09, { a: 0.7 }, 18, 0.7), N('bandpass', 300, 2400, 1.1, 0.1, 1.3, { a: 0.75, trem: [3, 0.7] }), th(75, 140, 1.1, 0.12, { a: 0.7 }), th(800, 2000, 1, 0.02, { a: 0.75, vib: [10, 60] })] },
    mel_whirl:   { kind: 'move', min: 800, L: [   // gira y empuja: viento + zumbido con Doppler rapido
      N('bandpass', 700, 1500, 1.3, 0.2, 0.9, { a: 0.1, sus: 0.7, trem: [7, 0.6] }), buzz(240, 210, 1.3, 0.09, { a: 0.1, sus: 0.7, vib: [3.5, 200] }, 36), N('highpass', 4000, 2500, 1.2, 0.04, 1, { a: 0.15 }), th(80, 70, 1.2, 0.12, { a: 0.1 })] },
    mel_whirl_hit: { kind: 'impact', min: 200, L: [   // golpe de la rosquilla (18)
      N('bandpass', 3000, 900, 0.1, 0.25, 1.5, { a: 0.002 }), th(210, 80, 0.16, 0.5, { a: 0.002 }), buzz(300, 150, 0.12, 0.06, {}, 60)] },
    // ---------------- 7 Jalea real (canal 1600 con cruz verde-blanca; interrumpible; Corona)
    mel_jelly_channel: { kind: 'tele', min: 800, L: cat([   // curacion: aura brillante y limpia que sube (distinta del resto: sin zumbido agresivo)
      T('triangle', 392, 523, 1.6, 0.07, { a: 0.8, vib: [5, 25], flt: { t: 'lowpass', f: [1400, 2400], q: 1 } }), T('triangle', 587, 784, 1.6, 0.05, { a: 0.9, vib: [6, 25] }), th(196, 262, 1.6, 0.09, { a: 0.8 }),
      N('highpass', 5500, 9000, 1.6, 0.025, 1, { a: 1 }), buzz(98, 130, 1.6, 0.03, { a: 0.9 }, 10, 0.5)],
      bursts(4, 0.35, function (i, dl) { return th(1568 + i * 200, 1568 + i * 200, 0.4, 0.025, { delay: 0.3 + dl, a: 0.01 }); })) },
    mel_jelly_heal: { kind: 'move', min: 800, L: cat(chime(784, 0.07, 0.7, 0), chime(988, 0.07, 0.7, 0.09), chime(1319, 0.07, 0.8, 0.18), chime(1568, 0.06, 1.1, 0.28), [N('highpass', 6500, 9000, 0.5, 0.03, 1, { delay: 0.1, a: 0.1 })]) },   // se cura el 2,5 %
    mel_jelly_break: { kind: 'impact', min: 500, L: cat([   // interrumpida: el canal se rompe, vuelve desafinado y queda aturdida 1 s
      N('highpass', 3000, 7000, 0.22, 0.25, 1, { a: 0.001 }), th(120, 45, 0.3, 0.6, { a: 0.003 }), buzz(400, 100, 0.6, 0.07, { a: 0.01, vib: [8, 180] }, 18),
      th(1568, 740, 0.5, 0.05, { a: 0.004 })], wax(0.7, 0.03), ticks(5, 0.05, 3200, 0.1, 0.05)) },
    // ---------------- 8 Eclosion masiva (tele 1200; abdomen hinchado; 4-6 larvas)
    mel_hatch_tele: { kind: 'tele', min: 700, L: cat([   // abdomen se hincha: latido humedo que se acelera + zumbido grave que sube
      th(55, 100, 1.2, 0.3, { a: 0.8, vib: [4, 40] }), buzz(80, 190, 1.2, 0.08, { a: 0.8 }, 14, 0.6), N('lowpass', 300, 1400, 1.2, 0.09, 1.5, { a: 0.8 })],
      [th(66, 46, 0.12, 0.25, { delay: 0.1, a: 0.005 }), th(68, 46, 0.12, 0.3, { delay: 0.45, a: 0.005 }), th(70, 48, 0.12, 0.35, { delay: 0.72, a: 0.005 }), th(72, 48, 0.12, 0.4, { delay: 0.92, a: 0.005 }), th(74, 50, 0.12, 0.45, { delay: 1.08, a: 0.005 })],
      squelch(0.3, 0.6, 0.6)) },
    mel_hatch:   { kind: 'impact', min: 600, L: cat(thud(1, 0, 0.8), squelch(1, 0.02, 0.6), pop(0.7, 0.08), pop(0.6, 0.15, 1.2), pop(0.6, 0.22, 0.9), pop(0.55, 0.3, 1.3), [N('highpass', 2500, 5000, 0.14, 0.14, 1, { a: 0.001 })], drip(0.5, 0.3), drip(0.4, 0.42, 1.2)) },   // suelta las larvas (18 c/u al explotar)
    // ---------------- Desesperado: Zumbido Mortal (10 s; 5 anillos cada 1,3 s; 900 ms en rojo, 200 ms de dano)
    mel_ring_tele: { kind: 'tele', min: 250, L: [   // cada anillo hexagonal se enciende: zumbido electrico que sube (900 ms)
      buzz(180, 700, 0.9, 0.08, { a: 0.6 }, 64, 0.8), th(1100, 3000, 0.85, 0.025, { a: 0.65, vib: [14, 80] }), N('bandpass', 2000, 5000, 0.9, 0.035, 5, { a: 0.65 })] },
    mel_ring:    { kind: 'impact', min: 250, L: [   // anillo que hiere (18, 200 ms): descarga zumbante
      N('highpass', 2500, 6000, 0.22, 0.25, 1, { a: 0.001 }), buzz(500, 250, 0.22, 0.12, { a: 0.002 }, 70, 0.9), th(110, 45, 0.25, 0.6, { a: 0.002 }), th(1800, 900, 0.15, 0.05)] },

    // ---------------- Stingers (kind 'stinger'; 1 vez por evento)
    mel_stg_intro: { kind: 'stinger', min: 2000, L: cat([   // el techo del panal se abre: cera que cruje, enjambre que baja, golpe y fanfarria zumbante
      buzz(400, 110, 1.4, 0.1, { a: 0.1, sus: 0.6 }, 36), N('bandpass', 1500, 400, 1.4, 0.1, 1.2, { a: 0.1 }), T('sawtooth', 55, 55.4, 2.6, 0.09, { delay: 1.1, a: 0.4, sus: 0.6, trem: [9, 0.5], flt: { t: 'lowpass', f: [220, 500], q: 3 } }),
      th(36, 32, 2.6, 0.35, { delay: 1.1, a: 0.3 })], wax(0.5, 0.1), wax(0.4, 0.3), wax(0.4, 0.5), thud(0.9, 1.2, 0.8), squelch(0.4, 1.3, 0.6), mar(220, 0.08, 1, 1.5), mar(330, 0.07, 1, 1.75), mar(440, 0.07, 1.4, 2.0)) },
    mel_stg_p2:  { kind: 'stinger', min: 1000, L: cat([   // F2 Enjambre: pizzicato de enjambre + golpe
      buzz(140, 320, 1.4, 0.09, { a: 0.5 }, 26), N('bandpass', 800, 2400, 1.3, 0.07, 2, { a: 0.5, trem: [30, 0.7] }), th(46, 40, 1.6, 0.3, { a: 0.2 })], thud(0.8), bursts(8, 0.07, function (i, dl) { return T('triangle', 660 + i * 110, 660 + i * 110, 0.1, 0.07, { delay: 0.3 + dl, a: 0.002 }); }), mar(440, 0.07, 1, 1.0)) },
    mel_stg_p3:  { kind: 'stinger', min: 1000, L: cat([   // F3 Reina furiosa: coro disonante + percusion
      buzz(110, 110.5, 1.8, 0.09, { a: 0.5 }, 18), buzz(155.6, 156, 1.8, 0.07, { a: 0.5 }, 22), buzz(207, 208, 1.8, 0.06, { a: 0.5 }, 26), th(36, 30, 1.8, 0.3, { a: 0.3 })],
      thud(0.9, 0.0, 0.9), thud(0.7, 0.25, 1), thud(1, 0.5, 0.9), thud(0.8, 0.75, 1), thud(1, 1.0, 0.85), ticks(6, 0.07, 3000, 0.09, 1.0), mar(880, 0.05, 1, 1.1)) },
    mel_stg_despair: { kind: 'stinger', min: 2000, L: cat([   // Zumbido Mortal (<8 %): sirena de enjambre que sube + tritono + golpes frenéticos
      T('sawtooth', 70, 150, 3, 0.15, { a: 0.4, sus: 0.7, vib: [16, 50], trem: [18, 0.5], flt: { t: 'lowpass', f: [300, 1200], q: 3 } }), buzz(98, 210, 3, 0.1, { a: 0.5 }, 24), th(34, 50, 3, 0.35, { a: 0.4 }),
      N('bandpass', 400, 6000, 3, 0.16, 1, { a: 1.6, trem: [22, 0.5] }), buzz(500, 1700, 2.4, 0.04, { delay: 0.6, a: 1.2 }, 70, 0.8)],
      thud(1, 0), thud(0.9, 0.35, 0.95), thud(0.9, 0.7, 0.9), thud(0.85, 1.0), thud(0.85, 1.25, 1.05), thud(0.85, 1.5, 1.1), thud(0.95, 1.7, 1.15), ticks(10, 0.1, 3400, 0.1, 1.8)) },
    mel_stg_part_wings: { kind: 'stinger', min: 250, L: cat([   // Alas rotas: desgarro membranoso + zumbido que se atasca + caida
      N('bandpass', 4200, 900, 0.18, 0.35, 2, { a: 0.001 }), N('highpass', 3000, 7000, 0.2, 0.18, 1, { a: 0.001 }), buzz(380, 90, 0.7, 0.09, { a: 0.01, vib: [8, 160] }, 40), th(130, 40, 0.3, 0.7, { delay: 0.3, a: 0.002 })], thud(0.7, 0.35, 0.8), chime(988, 0.05, 0.8, 0.15)) },
    mel_stg_part_stinger: { kind: 'stinger', min: 250, L: cat([   // Aguijon roto: crac seco de quitina + campana
      N('bandpass', 2600, 1100, 0.1, 0.4, 5, { a: 0.0008 }), th(320, 80, 0.22, 0.7, { a: 0.002 }), N('lowpass', 1500, 150, 0.2, 0.3, 1, { a: 0.001 }), th(1500, 1400, 0.4, 0.05, { delay: 0.05 })], chime(1175, 0.05, 0.8, 0.12), ticks(4, 0.05, 3000, 0.1, 0.1)) },
    mel_stg_part_crown: { kind: 'stinger', min: 250, L: cat([   // Corona rota: cera quebrada + gota de jalea que tintinea (cura 20 HP)
      th(110, 40, 0.3, 0.6, { a: 0.002 })], wax(1, 0), wax(0.6, 0.06), ticks(5, 0.05, 2800, 0.1, 0.06), squelch(0.5, 0.2, 0.8), chime(1319, 0.06, 1, 0.3), chime(1760, 0.05, 1.2, 0.42)) },
    mel_stg_window: { kind: 'stinger', min: 300, L: cat(   // ventana de dano (aturdida / expuesta / hinchada): arpegio claro ascendente + latido de cera
      chime(784, 0.07, 0.8, 0), chime(1047, 0.07, 0.8, 0.08), chime(1568, 0.07, 1, 0.16), [th(1318, 1318, 0.5, 0.025, { delay: 0.2 }), N('highpass', 6000, 9000, 0.3, 0.04, 1, { a: 0.1 })], wax(0.5, 0), thud(0.5, 0.17, 1.2)) },
    mel_stg_death: { kind: 'stinger', min: 4000, L: cat([   // muerte (5 s): el zumbido se apaga, el panal se desmorona, miel que cae, ultimo latido
      th(70, 18, 3.5, 1, { a: 0.005 }), N('lowpass', 1800, 80, 5, 0.3, 0.8, { a: 0.05, sus: 0.3 }), buzz(300, 38, 4, 0.12, { a: 0.05, vib: [9, 100] }, 20, 0.6),
      N('bandpass', 700, 150, 4.5, 0.1, 1.2, { a: 0.4 }), th(30, 20, 4, 0.5, { delay: 0.5, a: 0.05 })],
      thud(1, 0.9, 0.8), thud(0.8, 1.7, 0.7), thud(0.6, 2.6, 0.6), thud(0.45, 3.8, 0.55), wax(1, 0.3), wax(0.8, 1.2), wax(0.7, 2.1), wax(0.5, 3.1),
      squelch(0.8, 1.0, 0.55), squelch(0.6, 2.0, 0.6), squelch(0.5, 3.0, 0.65), bursts(10, 0.35, function (i, dl) { return drip(0.35, 0.8 + dl, 0.8 + (i % 3) * 0.2); }).reduce(function (a, b) { return a.concat(b); }, []),
      chime(440, 0.06, 1.8, 4.0)) },
    mel_stg_victory: { kind: 'stinger', min: 2000, L: cat([   // victoria: marimba calida y campanas de jalea sobre quinta abierta; el panal respira
      T('triangle', 110, 110, 3.4, 0.1, { a: 0.4, sus: 0.6, flt: { t: 'lowpass', f: [700, 450], q: 1 } }), T('triangle', 165, 165, 3.4, 0.08, { a: 0.5, sus: 0.6, flt: { t: 'lowpass', f: [700, 450], q: 1 } }), th(55, 55, 3.4, 0.2, { a: 0.4 }),
      buzz(220, 200, 3, 0.02, { a: 1, sus: 0.3 }, 6, 0.8)],
      mar(440, 0.1, 1.2, 0.1), mar(554, 0.1, 1.2, 0.35), mar(659, 0.1, 1.2, 0.6), mar(880, 0.1, 1.6, 0.85), chime(1319, 0.06, 2, 1.2), chime(1760, 0.05, 2.2, 1.6), [N('highpass', 7000, 9000, 1, 0.03, 1, { delay: 1, a: 0.1 })]) }
  };
  var GAIN = { mel_wing_buzz: 0.78, boss_roar_reina: 0.79, mel_land: 1.4, mel_hover_down: 1.06, mel_stab_tele: 1.02, mel_stab_dash: 1.21, mel_stab: 1.28, mel_exposed: 4.27, mel_dive_tele: 0.77, mel_dive: 1.11, mel_trapped: 1.01, mel_rise: 1.31, mel_stingrain_tele: 2.51, mel_stingrain: 1.57, mel_call_tele: 0.62, mel_call: 0.59, mel_comb_tele: 0.79, mel_comb_open: 0.42, mel_comb_fall: 1.09, mel_whirl_tele: 0.9, mel_whirl: 0.85, mel_whirl_hit: 2.13, mel_jelly_channel: 1.08, mel_jelly_heal: 1.34, mel_jelly_break: 1.38, mel_hatch_tele: 0.38, mel_hatch: 0.7, mel_ring_tele: 2.19, mel_ring: 1.54, mel_stg_intro: 1.1, mel_stg_p2: 2.05, mel_stg_p3: 0.84, mel_stg_despair: 0.77, mel_stg_part_wings: 1.08, mel_stg_part_stinger: 1.93, mel_stg_part_crown: 1.61, mel_stg_window: 1.29, mel_stg_death: 0.75, mel_stg_victory: 1.69 };
  Object.keys(DEFS).forEach(function (n) { DEFS[n].fam = 'melaria'; DEFS[n].gain = GAIN[n] || 1; });
  var names = Object.keys(DEFS);

  // ---- motor propio (igual que sfx_fam4: tremolo de amplitud opcional L.trem = [Hz, profundidad])
  var ac = null, chain = null, muted = false, active = {}, lastT = {};
  function mkNoise(c, secs) { var n = Math.floor(c.sampleRate * (secs || 1)), b = c.createBuffer(1, n, c.sampleRate), d = b.getChannelData(0); for (var i = 0; i < n; i++) d[i] = Math.random() * 2 - 1; return b; }
  function mkChain(c, dest, master) {
    var k = { noise: mkNoise(c), g: c.createGain(), comp: c.createDynamicsCompressor(), mg: c.createGain(), echoIn: c.createGain() };
    k.g.gain.value = master; k.g.connect(k.comp); k.comp.connect(dest); k.mg.gain.value = 0; k.mg.connect(k.comp);
    var dl = c.createDelay(1.5), fb = c.createGain(), lp = c.createBiquadFilter();
    dl.delayTime.value = 0.29; fb.gain.value = 0.38; lp.type = 'lowpass'; lp.frequency.value = 2400; k.echoIn.gain.value = 0.5;
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
  var melPlaying = false;
  function applyVol() {
    if (!ac) return; var v = A.getVolume();
    chain.g.gain.value = muted ? 0 : v.master * v.sfx * 0.85;
    chain.mg.gain.value = muted || !melPlaying ? 0 : v.master * v.music;
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
  A.sfxMelaria = {};
  names.forEach(function (n) { A.sfxMelaria[n] = { kind: DEFS[n].kind, fam: 'melaria', min: DEFS[n].min, dur: dur(DEFS[n]) }; });

  // Stingers en G.Snd.V (los dispara G.Boss.stinger: 'stg_melaria_<intro|p2|p3|despair>') + extras + alias B.5 'stg_reina_*'.
  (function () {
    var S = window.G && window.G.Snd; if (!S || !S.V) return;
    ['intro', 'p2', 'p3', 'despair', 'part_wings', 'part_stinger', 'part_crown', 'window', 'death', 'victory'].forEach(function (k) { S.V['stg_melaria_' + k] = function () { A.sfx('mel_stg_' + k, { vary: 0 }); }; });
    ['intro', 'p2', 'p3', 'despair'].forEach(function (k) { S.V['stg_reina_' + k] = S.V['stg_melaria_' + k]; });
  })();

  // ================= Musica 'boss_melaria' (124 BPM, La frigio dominante). Sierra detonada con tremolo (zumbido) + marimba de cera.
  // F1 ostinato de marimba + bordon; F2 + pizzicato de enjambre; F3 + coro disonante y percusion; desesperado = F3 + tritono, sirena y bombo a corcheas.
  var MB = { bpm: 124, prog: [45, 45, 46, 45, 45, 43, 46, 44], scale: [0, 1, 4, 5, 7, 8, 10] };
  function mtof(m) { return 440 * Math.pow(2, (m - 69) / 12); }
  function hash(n) { var x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); }
  var PH = 1, DES = false;
  function mStep(step, t, ph, des, c, k) {
    var spb = 60 / MB.bpm / 4, bar = Math.floor(step / 16) % MB.prog.length, s = step % 16, root = MB.prog[bar], cyc = Math.floor(step / 16) % 8, bar16 = spb * 16;
    function mv(L, send, v) { layer(L, t + (L.delay || 0), 1, v == null ? 1 : v, c, k, k.mg, send); }
    if (s === 0) {   // siempre: sierra detonada con tremolo (zumbido) + bajo
      mv(T('sawtooth', mtof(root - 12), mtof(root - 12), bar16, 0.06, { a: 0.2, sus: 0.8, trem: [des ? 20 : 9 + ph * 2, 0.7], flt: { t: 'lowpass', f: [300 + ph * 60, 420 + ph * 80], q: 3 } }));
      mv(T('sawtooth', mtof(root - 12) * 1.017, mtof(root - 12) * 1.017, bar16, 0.05, { a: 0.3, sus: 0.8, trem: [des ? 23 : 11 + ph * 2, 0.7], flt: { t: 'lowpass', f: [300 + ph * 60, 420 + ph * 80], q: 3 } }));
      mv(th(mtof(root - 24), mtof(root - 24), bar16, 0.2, { a: 0.1, sus: 0.8 }));
      mv(N('bandpass', 500 + ph * 120, 900 + ph * 220, bar16, 0.05 + ph * 0.015 + (des ? 0.05 : 0), 1.2, { a: bar16 * 0.4, sus: 0.7, trem: [24 + ph * 4, 0.7] }));
    }
    if (s === 0 || s === 6 || s === 10) {   // bajo sincopado
      var bn = s === 10 ? root + 7 - 12 : root - 12, bd = spb * 3.5;
      mv(T('triangle', mtof(bn), mtof(bn), bd, 0.18, { a: 0.008, flt: { t: 'lowpass', f: [800, 300], q: 1 } }));
    }
    // F1: ostinato de marimba de cera
    var pat = [0, 3, 6, 8, 11, 14];
    if (pat.indexOf(s) >= 0) {
      var deg = MB.scale[(s * 3 + cyc * 2 + (bar % 3)) % 7], f = mtof(root + 12 + deg);
      mar(f, 0.09, 0.45, 0).forEach(function (L) { mv(L, true); });
    }
    if (s === 0) mv(th(78, 32, 0.3, 0.4, { a: 0.003 }));   // golpe de cera en el 1
    // F2: pizzicato de enjambre (notas altas rapidas) + rafagas de zumbido
    if (ph >= 2) {
      if (s % 2 === 1 && hash(step * 3 + 1) < 0.55) { var pf = mtof(root + 24 + MB.scale[Math.floor(hash(step + 2) * 7)]); mv(T('triangle', pf, pf, 0.08, 0.055, { a: 0.002 }), true); }
      if (s === 4 || s === 12) mv(N('bandpass', 1200, 2000, spb * 3, 0.06, 2, { a: spb, trem: [30, 0.8] }));
      if (s === 8 || s === 14) mv(th(70, 28, 0.2, 0.45, { a: 0.003 }));
    }
    // F3: coro disonante + percusion (bombo 4x4, caja, hats)
    if (ph >= 3) {
      if (s === 0) { [0, 6, 10].forEach(function (iv, i) { mv(T('sawtooth', mtof(root + iv), mtof(root + iv) * (1.004 + i * 0.002), bar16, 0.04, { a: 0.6, sus: 0.7, vib: [4, 18], trem: [14, 0.5], flt: { t: 'lowpass', f: [800, 600], q: 1.5 } }), true); }); }
      if (s % 4 === 0) mv(th(66, 30, 0.2, 0.7, { a: 0.003 }));
      if (s === 4 || s === 12) mv(N('bandpass', 1900, 1100, 0.1, 0.16, 2, { a: 0.001 }));
      if (s % 2 === 0) mv(N('highpass', 7000, 8500, 0.03, 0.04, 1, { a: 0.001 }));
    }
    // Desesperado: tritono, sirena ascendente por compas, bombo a corcheas
    if (des) {
      if (s % 2 === 0) mv(th(84 + (s % 4) * 6, 30, 0.13, 0.4, { a: 0.003 }));
      if (s === 0 || s === 8) mv(T('sawtooth', mtof(root + 6), mtof(root + 6) * 1.01, spb * 8, 0.045, { a: 0.3, trem: [20, 0.6], flt: { t: 'lowpass', f: [800, 600], q: 4 } }));
      if (s === 0) mv(T('sawtooth', mtof(root + 12), mtof(root + 12) * 1.8, bar16, 0.03, { a: bar16 * 0.6, trem: [30, 0.8], flt: { t: 'bandpass', f: [900, 2600], q: 3 } }));
      if (s % 4 === 1) mv(N('highpass', 6500, 8500, 0.05, 0.07, 1, { a: 0.002 }));
      if (s % 4 === 2 && hash(step) < 0.6) mar(mtof(root + 30 + (s % 3)), 0.06, 0.6, 0).forEach(function (L) { mv(L, true); });
    }
    return spb;
  }
  function phaseOf(v) { return v < 0.4 ? 1 : v < 0.7 ? 2 : 3; }

  var MS = { timer: null, step: 0, next: 0 }, mel = false, want = false;
  var M0 = A.music, p = { start: M0.start, stop: M0.stop, setTrack: M0.setTrack, getTrack: M0.getTrack, tracks: M0.tracks, isPlaying: M0.isPlaying, setIntensity: M0.setIntensity, setPhase: M0.setPhase, getPhase: M0.getPhase, setDespair: M0.setDespair };
  function mSched() {
    if (!ac || ac.state !== 'running') return;
    while (MS.next < ac.currentTime + 0.2) { MS.next += mStep(MS.step, MS.next, PH, DES, ac, chain); MS.step++; }
  }
  function mStart() {
    if (melPlaying || !mel || !want) return;
    if (!A.isUnlocked() || !ensure()) { setTimeout(mStart, 400); return; }
    if (ac.state !== 'running') { try { ac.resume(); } catch (e) { /* audio */ } setTimeout(mStart, 300); return; }
    melPlaying = true; MS.step = 0; MS.next = ac.currentTime + 0.1;
    var v = A.getVolume(); chain.mg.gain.cancelScheduledValues(ac.currentTime); chain.mg.gain.setValueAtTime(0.0001, ac.currentTime);
    chain.mg.gain.linearRampToValueAtTime(muted ? 0 : v.master * v.music, ac.currentTime + 0.5);
    MS.timer = setInterval(mSched, 30);
  }
  function mStop() {
    if (!melPlaying) return; melPlaying = false; clearInterval(MS.timer); MS.timer = null;
    try { chain.mg.gain.cancelScheduledValues(ac.currentTime); chain.mg.gain.setValueAtTime(chain.mg.gain.value, ac.currentTime); chain.mg.gain.linearRampToValueAtTime(0.0001, ac.currentTime + 0.4); } catch (e) { /* audio */ }
  }
  M0.start = function () { want = true; if (mel) mStart(); else p.start(); };
  M0.stop = function () { want = false; mStop(); p.stop(); };
  M0.setIntensity = function (v) { if (mel) PH = phaseOf(Math.max(0, Math.min(1, typeof v === 'boolean' ? (v ? 1 : 0) : (+v || 0)))); p.setIntensity(v); };
  // setPhase/setDespair: con boss_melaria activa gobiernan esta pista; si no, delegan en la pista anterior (boss_yarlak)
  M0.setPhase = function (n) { if (mel) PH = Math.max(1, Math.min(3, Math.round(+n) || 1)); else if (p.setPhase) p.setPhase(n); };
  M0.setDespair = function (b) { if (mel) DES = !!b; else if (p.setDespair) p.setDespair(b); };
  M0.getPhase = function () { return mel ? PH : (p.getPhase ? p.getPhase() : 1); };
  M0.setTrack = function (name) {
    if (name === 'boss_melaria') { if (mel) return; mel = true; PH = 1; DES = false; p.stop(); if (want) mStart(); return; }
    if (mel) { mel = false; mStop(); p.setTrack(name); if (want) p.start(); return; }
    p.setTrack(name);
  };
  M0.getTrack = function () { return mel ? 'boss_melaria' : p.getTrack(); };
  M0.tracks = function () { return p.tracks().concat(['boss_melaria']); };
  M0.isPlaying = function () { return mel ? melPlaying : p.isPlaying(); };

  var origRM = A.renderMusic;
  A.renderMusic = function (o) {
    o = o || {};
    if (o.track !== 'boss_melaria') return origRM.apply(this, arguments);
    var OC = window.OfflineAudioContext || window.webkitOfflineAudioContext;
    if (!OC) return Promise.reject(new Error('OfflineAudioContext no disponible'));
    var bars = o.bars || 8, spb = 60 / MB.bpm / 4, ph = o.phase || (o.intensity == null ? 3 : phaseOf(o.intensity));
    var oc = new OC(2, Math.ceil((bars * 16 * spb + 3) * 44100), 44100), k = mkChain(oc, oc.destination, 1);
    k.mg.gain.value = 0.8;
    for (var i = 0; i < bars * 16; i++) mStep(i, 0.05 + i * spb, ph, !!o.despair, oc, k);
    return oc.startRendering();
  };
})();
