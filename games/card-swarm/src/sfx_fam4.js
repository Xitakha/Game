/* sfx_fam4.js - Audio del PANAL (P5; DESIGN-v5-biomas.md B.4 / B.6 / C.5 y DESIGN-v6-minijefes.md 5 y 8). Script clasico, tras sfx_minis.js. Solo audio, sin tocar logica ni lo existente.
   Mismo patron que sfx_fam1/2/3: contexto WebAudio propio que sigue desbloqueo, mute, volumen y suspend de Assets. <= 4 voces por nombre, pitch +-10 %, separacion minima (min, ms).
   kind: 'tele' = telegrafia (zumbido/tono que SUBE y se sostiene, ataque suave, ~6 dB menos que el golpe; nunca un golpe seco), 'impact' = golpe/danio (corto, ruido + golpe),
   'move' = movimiento/ambiente (bajo y sutil). Timbres: insectos = sierra con tremolo rapido (alas) ; cera = golpes sordos y crujidos ; miel = chapoteo/gotas ; polen = campanitas suaves.
   Extras: Assets.hum(intensity) (zumbido ambiente del enjambre, 0 = apagado) y pista de musica 'panal' (Assets.music.setTrack('panal'), sin tocar assets.js). */
(function () {
  'use strict';
  var A = window.Assets;
  if (!A || A._fam4) return;
  A._fam4 = true;

  function T(t, f0, f1, d, v, o) { var L = { t: t, f: [f0, f1], d: d, v: v }; if (o) for (var k in o) L[k] = o[k]; return L; }
  function N(type, f0, f1, d, v, q, o) { var L = { n: 1, d: d, v: v, flt: { t: type, f: [f0, f1], q: q || 1 } }; if (o) for (var k in o) L[k] = o[k]; return L; }
  function th(f0, f1, d, v, o) { return T('sine', f0, f1, d, v, o || {}); }
  function cat() { var r = []; for (var i = 0; i < arguments.length; i++) r = r.concat(arguments[i]); return r; }
  function bursts(n, step, mk) { var r = []; for (var i = 0; i < n; i++) r.push(mk(i, i * step + (i % 2) * step * 0.18)); return r; }
  // zumbido de alas: sierra con tremolo rapido y filtro (el timbre del Panal)
  function buzz(f0, f1, d, v, o, rate, dep) { var L = T('sawtooth', f0, f1, d, v, { trem: [rate || 38, dep == null ? 0.55 : dep], flt: { t: 'lowpass', f: [f0 * 5, f1 * 5], q: 1.4 } }); if (o) for (var k in o) L[k] = o[k]; return L; }
  // pop de cera: golpecito hueco + chasquido suave
  function pop(v, dl, f) { f = f || 1; return [th(520 * f, 170 * f, 0.09, 0.6 * v, { delay: dl, a: 0.002 }), N('bandpass', 1800 * f, 700, 0.04, 0.2 * v, 3, { delay: dl, a: 0.001 })]; }
  // chapoteo de miel: burbuja grave + gorgoteo
  function squelch(v, dl, f) { f = f || 1; return [th(230 * f, 80 * f, 0.15, 0.5 * v, { delay: dl, a: 0.004, vib: [22, 160] }), N('bandpass', 520 * f, 200, 0.15, 0.18 * v, 3, { delay: dl, a: 0.004 }), th(700 * f, 360 * f, 0.06, 0.12 * v, { delay: dl + 0.05, a: 0.002 })]; }
  function drip(v, dl, f) { f = f || 1; return [th(1000 * f, 420 * f, 0.07, 0.3 * v, { delay: dl, a: 0.002 }), th(1500 * f, 800 * f, 0.04, 0.1 * v, { delay: dl, a: 0.001 })]; }
  function thud(v, dl, f) { f = f || 1; return [th(90 * f, 34, 0.26, 0.85 * v, { delay: dl, a: 0.003 }), N('lowpass', 1200, 140, 0.16, 0.28 * v, 0.8, { delay: dl, a: 0.001 })]; }
  function wax(v, dl) { return [N('bandpass', 1500, 600, 0.1, 0.35 * v, 4, { delay: dl, a: 0.001 }), th(260, 110, 0.12, 0.4 * v, { delay: dl, a: 0.002 }), th(1900, 1700, 0.06, 0.05 * v, { delay: dl })]; }
  function mar(f, v, d, dl) { dl = dl || 0; d = d || 0.4; return [th(f, f, d, v, { delay: dl, a: 0.002 }), th(f * 3.93, f * 3.93, d * 0.22, v * 0.3, { delay: dl, a: 0.001 }), N('bandpass', f * 5, f * 5, 0.025, v * 0.5, 3, { delay: dl, a: 0.001 })]; }
  function chime(f, v, d, dl) { return [th(f, f, d, v, { delay: dl || 0, a: 0.004 }), th(f * 2.01, f * 2.01, d * 0.6, v * 0.35, { delay: dl || 0, a: 0.004 }), th(f * 3.02, f * 3.02, d * 0.3, v * 0.12, { delay: dl || 0, a: 0.004 })]; }
  function ticks(n, step, f, v, dl0) { return bursts(n, step, function (i, dl) { return N('bandpass', f + i * 200, f + 300, 0.02, v, 8, { delay: (dl0 || 0) + dl, a: 0.0008 }); }); }
  // mecha que se acelera
  function fuse(d, v) { var r = [], t = 0.04, k = 0; while (t < d - 0.03) { r.push(N('highpass', 3000 + (k % 4) * 500, 6000, 0.018, v * (0.5 + 0.5 * t / d), 1, { delay: t, a: 0.0008 })); t += Math.max(0.035, 0.14 - 0.1 * (t / d)); k++; } return r; }

  var DEFS = {
    // ---------------- Celdas, miel y humo (B.4)
    cell_tele:   { kind: 'tele', min: 250, L: cat([   // 1000-1200 ms: la cera se tensa y cruje antes de abrirse
      T('triangle', 150, 320, 1.1, 0.07, { a: 0.7, flt: { t: 'lowpass', f: [450, 1100], q: 2 } }), N('bandpass', 600, 1800, 1.1, 0.05, 2, { a: 0.7 })],
      bursts(4, 0.22, function (i, dl) { return N('bandpass', 1300 + i * 250, 900, 0.035, 0.07, 6, { delay: 0.15 + dl, a: 0.004 }); })) },
    cell_open:   { kind: 'move', min: 70, L: cat(pop(1, 0, 1), [th(130, 70, 0.22, 0.2, { delay: 0.03, a: 0.01 })], drip(0.4, 0.12)) },
    cell_close:  { kind: 'move', min: 90, L: [   // sellado: succion que sube y un golpe sordo de cera
      th(140, 330, 0.14, 0.2, { a: 0.02 }), N('bandpass', 400, 900, 0.14, 0.1, 2, { a: 0.03 }), th(150, 60, 0.2, 0.45, { delay: 0.14, a: 0.003 }), N('lowpass', 800, 150, 0.18, 0.15, 1, { delay: 0.14, a: 0.002 })] },
    honey_squelch:{ kind: 'move', min: 280, L: cat(squelch(0.9, 0, 1), squelch(0.4, 0.13, 1.25)) },   // pasos del jugador / terrestres en miel (pitch 0.9-1.1)
    honey_drip:  { kind: 'move', min: 450, L: cat(drip(1, 0, 1), drip(0.55, 0.19, 1.3)) },
    caramel_seal:{ kind: 'impact', min: 350, L: cat([   // Fuego sobre miel: caramelizacion, costra que cruje
      N('highpass', 3500, 7500, 0.2, 0.2, 1, { a: 0.001 }), th(95, 50, 0.16, 0.45, { a: 0.003 }), N('bandpass', 4200, 2600, 0.5, 0.06, 2, { a: 0.02 })], ticks(6, 0.04, 3200, 0.14, 0.03), chime(1568, 0.04, 0.5, 0.05)) },
    smoke_puff:  { kind: 'move', min: 200, L: [   // nace una nube de humo (max 6)
      N('lowpass', 2200, 300, 0.35, 0.22, 0.8, { a: 0.02 }), th(130, 60, 0.18, 0.25, { a: 0.003 }), N('bandpass', 900, 400, 0.3, 0.1, 1, { a: 0.02 })] },
    smoke_hiss:  { kind: 'move', min: 450, L: [   // los insectos dentro del humo: siseo blando (sedados)
      N('highpass', 3600, 2400, 0.7, 0.08, 1, { a: 0.1 }), N('bandpass', 1500, 900, 0.7, 0.07, 1.2, { a: 0.12 }), buzz(130, 90, 0.6, 0.03, { a: 0.1 }, 12, 0.7)] },
    swarm_pass:  { kind: 'move', min: 800, L: [   // nube de insectos que cruza (enjambre del jefe / packs)
      buzz(150, 175, 1.3, 0.06, { a: 0.5, sus: 0.5 }, 30), buzz(158, 188, 1.3, 0.045, { a: 0.55, sus: 0.5 }, 36), N('bandpass', 1400, 2000, 1.3, 0.05, 2, { a: 0.55, trem: [24, 0.6] })] },
    // ---------------- Obrera y Abeja aguijonera
    worker_buzz: { kind: 'move', min: 220, L: [buzz(210, 175, 0.2, 0.05, { a: 0.02 }, 44), N('bandpass', 1300, 900, 0.14, 0.03, 2, { a: 0.02 })] },
    bee_aim:     { kind: 'tele', min: 250, L: [   // aim 400 ms: aguijon que se tensa (fino, sube)
      buzz(300, 520, 0.4, 0.05, { a: 0.25 }, 55), th(1200, 2100, 0.38, 0.018, { a: 0.28, vib: [10, 40] }), N('bandpass', 2000, 3400, 0.38, 0.02, 5, { a: 0.28 })] },
    bee_sting:   { kind: 'move', min: 110, L: [   // disparo del aguijon (vel 230): pew corto con zumbido
      th(2100, 900, 0.13, 0.12, { a: 0.002 }), N('bandpass', 3200, 1400, 0.09, 0.14, 3, { a: 0.001 }), buzz(260, 200, 0.12, 0.03, {}, 60)] },
    stinger_hit: { kind: 'impact', min: 80, L: [   // aguijon que alcanza (8 de dano)
      N('highpass', 3000, 5500, 0.05, 0.22, 1, { a: 0.0008 }), th(1500, 600, 0.09, 0.1), th(160, 80, 0.1, 0.3, { a: 0.002 })] },
    // ---------------- Larva explosiva
    larva_fuse:  { kind: 'tele', min: 250, L: cat([   // mecha 700 ms: chisporroteo que se acelera + silbido ascendente
      T('triangle', 330, 980, 0.7, 0.04, { a: 0.5, flt: { t: 'lowpass', f: [1200, 2400], q: 2 } }), N('bandpass', 900, 3000, 0.7, 0.05, 2, { a: 0.5 })], fuse(0.7, 0.1)) },
    larva_burst: { kind: 'impact', min: 90, L: cat(squelch(0.8, 0, 0.8), [   // explosion r 55 (18): reventon humedo + golpe grave
      th(110, 36, 0.3, 0.8, { a: 0.002 }), N('lowpass', 2200, 200, 0.22, 0.32, 0.8, { a: 0.001 }), N('highpass', 2500, 5000, 0.1, 0.12, 1, { a: 0.001 })], drip(0.5, 0.15), drip(0.3, 0.22, 1.2)) },
    larva_hatch: { kind: 'move', min: 160, L: cat([   // eclosiona de un nido: cascaron que cruje + chillido pequeno
      N('bandpass', 2600, 1800, 0.05, 0.2, 5, { a: 0.001 }), th(900, 1500, 0.1, 0.06, { delay: 0.05, a: 0.01 })], pop(0.7, 0.06, 0.8), squelch(0.4, 0.12, 1.4)) },
    // ---------------- Zangano
    drone_wind:  { kind: 'tele', min: 300, L: [   // wind 600 ms: motor grave que sube
      buzz(70, 170, 0.6, 0.1, { a: 0.4 }, 26, 0.6), th(55, 100, 0.6, 0.12, { a: 0.4 }), N('bandpass', 400, 1400, 0.6, 0.06, 1.5, { a: 0.4 })] },
    drone_charge:{ kind: 'move', min: 350, L: [   // carga 360 px/s: pasada que baja de tono (Doppler)
      buzz(190, 90, 0.55, 0.1, { a: 0.03 }, 30), N('bandpass', 2200, 400, 0.5, 0.2, 1.2, { a: 0.04 }), th(80, 50, 0.4, 0.2, { a: 0.03 })] },
    drone_crash: { kind: 'impact', min: 250, L: cat(thud(1, 0, 0.85), wax(0.7, 0.01), [   // choca con pilar/muro: aturdido, zumbido que se apaga
      buzz(170, 60, 0.5, 0.05, { delay: 0.1, a: 0.01, vib: [9, 120] }, 16)]) },
    // ---------------- Guardia de cera
    guard_shove_tele: { kind: 'tele', min: 280, L: [   // empellon 500 ms: raspado de cera que sube
      N('bandpass', 500, 1500, 0.5, 0.08, 3, { a: 0.35 }), T('triangle', 110, 190, 0.5, 0.08, { a: 0.35, flt: { t: 'lowpass', f: [400, 800], q: 2 } }), th(70, 110, 0.5, 0.12, { a: 0.35 })] },
    wax_shield_hit: { kind: 'impact', min: 80, L: cat(wax(1, 0), [th(2300, 2200, 0.1, 0.04, { delay: 0.02 })]) },   // impacto en el escudo frontal x0,2
    wax_shield_melt:{ kind: 'move', min: 300, L: cat([   // el Fuego derrite el escudo (40 de dano para destruirlo)
      N('highpass', 3500, 2200, 0.6, 0.07, 1, { a: 0.03 }), N('lowpass', 900, 300, 0.6, 0.08, 1, { a: 0.05 }), th(180, 100, 0.5, 0.06, { a: 0.1 })], drip(0.7, 0.15, 0.9), drip(0.5, 0.35, 0.8)) },
    wax_shield_break:{ kind: 'impact', min: 150, L: cat(wax(1, 0), wax(0.7, 0.07), [th(100, 40, 0.3, 0.6, { a: 0.003 }), N('lowpass', 2200, 300, 0.2, 0.25, 1, { a: 0.001 })], ticks(5, 0.05, 2400, 0.12, 0.08)) },
    // ---------------- Babosa de miel
    slug_crawl:  { kind: 'move', min: 420, L: [   // arrastre humedo y lento
      N('bandpass', 420, 240, 0.35, 0.1, 2.5, { a: 0.08, trem: [12, 0.5] }), th(95, 70, 0.3, 0.1, { a: 0.08, vib: [10, 90] })] },
    honey_glob_tele: { kind: 'tele', min: 350, L: cat([   // escupitajo: gorgoteo que sube (circulo ambar 500 ms)
      T('triangle', 140, 320, 0.5, 0.08, { a: 0.3, vib: [18, 120], flt: { t: 'lowpass', f: [500, 1000], q: 2 } }), N('bandpass', 400, 900, 0.5, 0.05, 3, { a: 0.3 })],
      bursts(4, 0.1, function (i, dl) { return th(300 + i * 90, 600 + i * 120, 0.05, 0.06, { delay: 0.05 + dl, a: 0.004 }); })) },
    honey_spit:  { kind: 'move', min: 200, L: [th(260, 700, 0.1, 0.35, { a: 0.003 }), N('bandpass', 700, 1600, 0.1, 0.15, 2, { a: 0.003 }), th(520, 260, 0.1, 0.15, { delay: 0.08 })] },
    honey_splat: { kind: 'impact', min: 120, L: cat(squelch(1, 0, 0.75), [N('lowpass', 1600, 200, 0.16, 0.25, 1, { a: 0.002 }), th(90, 45, 0.2, 0.4, { a: 0.003 })], drip(0.4, 0.18)) },   // aterriza y deja miel r 34
    // ---------------- Polinizador (curacion)
    pollen_tele: { kind: 'tele', min: 350, L: [   // pulse 500 ms: campanilla suave que sube con brillo verde
      th(660, 1180, 0.5, 0.06, { a: 0.3, vib: [7, 30] }), th(990, 1760, 0.5, 0.03, { a: 0.3, vib: [6, 30] }), N('bandpass', 3000, 5200, 0.5, 0.015, 4, { a: 0.35 })] },
    pollen_chime:{ kind: 'move', min: 220, L: cat(chime(784, 0.07, 0.6, 0), chime(988, 0.07, 0.6, 0.09), chime(1319, 0.07, 0.9, 0.18), [N('highpass', 6500, 9000, 0.3, 0.025, 1, { delay: 0.1, a: 0.08 })]) },   // la cura (HoT 2 s) llega a los aliados
    // ---------------- Avispa
    wasp_fade:   { kind: 'tele', min: 250, L: [   // fade 500 ms: zumbido que se vuelve borron y sube
      buzz(260, 620, 0.5, 0.07, { a: 0.3 }, 62, 0.75), th(900, 1900, 0.5, 0.02, { a: 0.35, vib: [14, 60] }), N('bandpass', 1500, 3500, 0.5, 0.03, 4, { a: 0.35 })] },
    wasp_zip:    { kind: 'move', min: 120, L: [   // reaparece: salto seco y brillante
      th(1800, 400, 0.1, 0.12, { a: 0.002 }), N('bandpass', 4000, 1200, 0.1, 0.2, 2, { a: 0.002 }), buzz(330, 240, 0.12, 0.04, {}, 70)] },
    wasp_slash:  { kind: 'impact', min: 110, L: [   // tajo 14 (arco 100 grados)
      N('bandpass', 4800, 1600, 0.12, 0.25, 1.5, { a: 0.003 }), th(280, 100, 0.12, 0.3, { a: 0.002 }), th(1700, 900, 0.07, 0.05)] },
    // ---------------- Nodriza (invocadora)
    nurse_cast:  { kind: 'tele', min: 350, L: [   // cast 500 ms: coro zumbante que sube
      buzz(130, 240, 0.5, 0.07, { a: 0.3 }, 20), T('triangle', 260, 480, 0.5, 0.05, { a: 0.3, vib: [6, 30], flt: { t: 'lowpass', f: [900, 1500], q: 1 } }), N('bandpass', 600, 1500, 0.5, 0.04, 2, { a: 0.3 })] },
    // ---------------- Reina Joven (guardian 5:30)
    reinaj_spit_tele:{ kind: 'tele', min: 400, L: [   // Escupitajo: gorgoteo grave que sube
      T('triangle', 90, 220, 0.7, 0.1, { a: 0.5, vib: [14, 100], flt: { t: 'lowpass', f: [400, 900], q: 2 } }), N('bandpass', 300, 800, 0.7, 0.07, 3, { a: 0.5 }), buzz(100, 160, 0.7, 0.04, { a: 0.5 }, 18)] },
    reinaj_honey_squelch:{ kind: 'move', min: 160, L: cat(squelch(1, 0, 0.6), squelch(0.6, 0.12, 0.8), [N('lowpass', 800, 150, 0.3, 0.08, 1, { a: 0.02 })]) },   // charcos de miel (reservado v6)
    reinaj_swell:{ kind: 'tele', min: 600, L: [   // abdomen se hincha antes del Estallido/Eclosion: latido humedo que sube
      th(55, 90, 1, 0.3, { a: 0.6, vib: [5, 40] }), buzz(80, 160, 1, 0.07, { a: 0.6 }, 14, 0.6), N('lowpass', 300, 1200, 1, 0.08, 1.5, { a: 0.6 })] },
    reinaj_hatch:{ kind: 'move', min: 250, L: cat([   // Eclosion (reservado v6): el saco revienta y salen larvas
      th(100, 40, 0.3, 0.7, { a: 0.003 }), N('lowpass', 2000, 200, 0.2, 0.3, 0.8, { a: 0.001 })], squelch(0.8, 0.02, 0.7), pop(0.6, 0.12), pop(0.5, 0.2, 1.2), pop(0.45, 0.27, 0.9), drip(0.4, 0.35)) },
    reinaj_burst:{ kind: 'impact', min: 250, L: cat(thud(1, 0, 0.8), squelch(1, 0.02, 0.6), [N('highpass', 2000, 4500, 0.12, 0.14, 1, { a: 0.001 })], drip(0.5, 0.2)) },
    reinaj_roar: { kind: 'tele', min: 900, roar: 1, L: [   // entrada: rugido zumbante de crisalida (un solo rugido a la vez)
      T('sawtooth', 75, 130, 1.4, 0.13, { a: 0.3, sus: 0.6, vib: [15, 40], trem: [22, 0.4], flt: { t: 'lowpass', f: [380, 900], q: 3 } }), th(45, 70, 1.4, 0.22, { a: 0.3 }), N('bandpass', 500, 1200, 1.4, 0.07, 1.5, { a: 0.3, sus: 0.6 }), buzz(190, 320, 1, 0.04, { delay: 0.2, a: 0.2 }, 40)] },
    // ---------------- Avispon Real (guardian 3:30)
    avispon_buzz:{ kind: 'tele', min: 350, L: [   // Picado (tele 650): zumba antes de que lo veas, sube y se mantiene
      buzz(190, 420, 0.65, 0.09, { a: 0.4 }, 52, 0.7), th(95, 210, 0.65, 0.1, { a: 0.4 }), N('bandpass', 1200, 3000, 0.65, 0.035, 4, { a: 0.45 })] },
    avispon_charge:{ kind: 'move', min: 300, L: [   // picado / carga: pasada rapida que cae
      buzz(430, 160, 0.4, 0.1, { a: 0.02 }, 58), N('bandpass', 3000, 500, 0.35, 0.22, 1.3, { a: 0.03 }), th(110, 60, 0.3, 0.2, { a: 0.02 })] },
    avispon_sting:{ kind: 'impact', min: 120, L: [   // aguijonazo (24 / 26): pinchazo agudo + golpe seco
      N('highpass', 3200, 6500, 0.07, 0.3, 1, { a: 0.0008 }), th(2400, 800, 0.1, 0.12, { a: 0.001 }), th(170, 60, 0.18, 0.55, { a: 0.002 }), N('lowpass', 1400, 150, 0.12, 0.2, 1, { a: 0.001 })] },
    avispon_sting_tele:{ kind: 'tele', min: 500, L: [   // Estocada real (firma, tele 900): zumbido agudo tenso + tono de aguijon que se afila
      buzz(220, 520, 0.9, 0.08, { a: 0.55 }, 48, 0.6), th(1000, 2400, 0.85, 0.03, { a: 0.6, vib: [8, 40] }), N('bandpass', 1500, 4200, 0.9, 0.04, 5, { a: 0.6 }), th(80, 140, 0.9, 0.1, { a: 0.55 })] },
    avispon_orbit_tele:{ kind: 'tele', min: 400, L: [   // Zumbido envolvente (tele 600): empieza a girar
      buzz(200, 360, 0.6, 0.08, { a: 0.4 }, 34), N('bandpass', 700, 1800, 0.6, 0.05, 2, { a: 0.4, trem: [9, 0.7] }), th(100, 180, 0.6, 0.08, { a: 0.4 })] },
    avispon_orbit:{ kind: 'move', min: 800, L: [   // orbita 2 s a 160 px: zumbido que gira (Doppler lento)
      buzz(250, 210, 1.6, 0.07, { a: 0.1, sus: 0.7, vib: [1.2, 260] }, 50), N('bandpass', 1300, 1000, 1.6, 0.04, 2, { a: 0.1, trem: [1.2, 0.8] })] },
    avispon_stun:{ kind: 'impact', min: 250, L: cat(thud(0.9, 0, 0.8), wax(0.6, 0.01), [buzz(190, 70, 0.6, 0.05, { delay: 0.1, a: 0.01, vib: [8, 140] }, 14)]) }
  };
  var GAIN = { cell_tele: 2.16, cell_open: 0.98, cell_close: 0.41, honey_squelch: 0.66, honey_drip: 0.52, caramel_seal: 2.1, smoke_puff: 1.68, smoke_hiss: 0.96, swarm_pass: 1.44, worker_buzz: 6.0, bee_aim: 3.66, bee_sting: 3.99, stinger_hit: 1.87, larva_fuse: 2.68, larva_burst: 1.14, larva_hatch: 0.64, drone_wind: 0.91, drone_charge: 1.35, drone_crash: 1.4, guard_shove_tele: 0.96, wax_shield_hit: 2.71, wax_shield_melt: 0.75, wax_shield_break: 1.18, slug_crawl: 1.36, honey_glob_tele: 1.95, honey_spit: 1.65, honey_splat: 1.66, pollen_tele: 2.07, pollen_chime: 1.27, wasp_fade: 2.83, wasp_zip: 2.95, wasp_slash: 3.08, nurse_cast: 2.44, reinaj_spit_tele: 1.53, reinaj_honey_squelch: 0.66, reinaj_swell: 0.48, reinaj_hatch: 0.57, reinaj_burst: 1.16, reinaj_roar: 0.85, avispon_buzz: 1.3, avispon_charge: 1.42, avispon_sting: 2.39, avispon_sting_tele: 1.06, avispon_orbit_tele: 1.51, avispon_orbit: 2.18, avispon_stun: 1.42 };
  Object.keys(DEFS).forEach(function (n) { DEFS[n].fam = 'panal'; DEFS[n].gain = GAIN[n] || 1; });
  var names = Object.keys(DEFS);

  // ---- motor propio (misma sintesis que sfx_fam3, con tremolo de amplitud opcional L.trem = [Hz, profundidad])
  var ac = null, chain = null, muted = false, active = {}, lastT = {};
  function mkNoise(c, secs) { var n = Math.floor(c.sampleRate * (secs || 1)), b = c.createBuffer(1, n, c.sampleRate), d = b.getChannelData(0); for (var i = 0; i < n; i++) d[i] = Math.random() * 2 - 1; return b; }
  function mkChain(c, dest, master) {
    var k = { noise: mkNoise(c), g: c.createGain(), comp: c.createDynamicsCompressor(), mg: c.createGain(), wg: c.createGain(), echoIn: c.createGain() };
    k.g.gain.value = master; k.g.connect(k.comp); k.comp.connect(dest);
    k.mg.gain.value = 0; k.mg.connect(k.comp); k.wg.gain.value = 0; k.wg.connect(k.comp);
    var dl = c.createDelay(1.5), fb = c.createGain(), lp = c.createBiquadFilter();   // eco calido para marimba
    dl.delayTime.value = 0.33; fb.gain.value = 0.36; lp.type = 'lowpass'; lp.frequency.value = 2200; k.echoIn.gain.value = 0.5;
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
    if (L.trem) {   // tremolo de amplitud (aleteo)
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
  var humLvl = 0, panPlaying = false;
  function applyVol() {
    if (!ac) return; var v = A.getVolume();
    chain.g.gain.value = muted ? 0 : v.master * v.sfx * 0.85;
    chain.wg.gain.value = muted ? 0 : v.master * v.sfx * 0.85;
    chain.mg.gain.value = muted || !panPlaying ? 0 : v.master * v.music;
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
    if (def.roar) { if (now < (A._roarUntil || 0)) return false; A._roarUntil = now + dur(def) * 1000; }   // un unico rugido a la vez
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
  A.sfxFam4 = {};
  names.forEach(function (n) { A.sfxFam4[n] = { kind: DEFS[n].kind, fam: 'panal', min: DEFS[n].min, dur: dur(DEFS[n]) }; });

  // ================= Zumbido ambiente: Assets.hum(intensity 0..1). 0 = apagado. Se puede llamar cada frame.
  // intensity = f(n de abejas vivas): sube volumen, brillo y rapidez del tremolo (retroalimentacion sonora del enjambre).
  var H = null;
  function humStart() {
    var c = ac, o1 = c.createOscillator(), o2 = c.createOscillator(), o3 = c.createOscillator(), ns = c.createBufferSource();
    o1.type = 'sawtooth'; o1.frequency.value = 118; o2.type = 'sawtooth'; o2.frequency.value = 124.7; o3.type = 'sine'; o3.frequency.value = 59;
    ns.buffer = mkNoise(c, 3); ns.loop = true;
    var lp = c.createBiquadFilter(), bp = c.createBiquadFilter(), g1 = c.createGain(), g2 = c.createGain(), g3 = c.createGain(), gn = c.createGain(), tg = c.createGain(), out = c.createGain();
    lp.type = 'lowpass'; lp.frequency.value = 420; lp.Q.value = 1.2; bp.type = 'bandpass'; bp.frequency.value = 760; bp.Q.value = 2.2;
    g1.gain.value = 0.5; g2.gain.value = 0.4; g3.gain.value = 0.7; gn.gain.value = 0.12; tg.gain.value = 0.8; out.gain.value = 0;
    var lf = c.createOscillator(), lg = c.createGain(), lf2 = c.createOscillator(), lg2 = c.createGain();
    lf.frequency.value = 6; lg.gain.value = 0.2; lf.connect(lg); lg.connect(tg.gain);      // tremolo de las alas (sube con la intensidad)
    lf2.frequency.value = 0.13; lg2.gain.value = 4; lf2.connect(lg2); lg2.connect(o2.frequency);   // el batido de las dos sierras deriva
    o1.connect(g1); g1.connect(lp); o2.connect(g2); g2.connect(lp); o3.connect(g3); g3.connect(lp); ns.connect(bp); bp.connect(gn); gn.connect(lp);
    lp.connect(tg); tg.connect(out); out.connect(chain.wg);
    var t = c.currentTime; [o1, o2, o3, lf, lf2].forEach(function (s) { s.start(t); }); ns.start(t, Math.random() * 2);
    H = { out: out, lp: lp, lf: lf, lg: lg, tg: tg, gn: gn, srcs: [o1, o2, o3, ns, lf, lf2] };
  }
  function humStop() {
    if (!H) return; var h = H; H = null;
    try { h.out.gain.setTargetAtTime(0, ac.currentTime, 0.4); } catch (e) { /* audio */ }
    setTimeout(function () { h.srcs.forEach(function (s) { try { s.stop(); } catch (e) { /* audio */ } }); try { h.out.disconnect(); } catch (e2) { /* audio */ } }, 2500);
  }
  A.hum = function (intensity) {
    var v = Math.max(0, Math.min(1, +intensity || 0)); humLvl = v;
    if (v <= 0.001) { humStop(); return false; }
    if (!A.isUnlocked() || !ensure() || ac.state !== 'running') return false;
    applyVol(); if (!H) humStart();
    var t = ac.currentTime;
    H.out.gain.setTargetAtTime(0.06 + v * 0.34, t, 0.6);
    H.lp.frequency.setTargetAtTime(330 + v * 650, t, 0.6);
    H.lf.frequency.setTargetAtTime(5 + v * 9, t, 0.6);           // 5 -> 14 Hz
    H.lg.gain.setTargetAtTime(0.1 + v * 0.5, t, 0.6);
    H.tg.gain.setTargetAtTime(0.9 - v * 0.3, t, 0.6);
    H.gn.gain.setTargetAtTime(0.06 + v * 0.3, t, 0.6);
    return true;
  };
  A.humLevel = function () { return humLvl; };

  // ================= Musica 'panal' (calida y resonante: bordon de sierras, marimba de cera, bajo redondo, enjambre). 96 BPM, La dorico.
  var PAN = { bpm: 96, prog: [45, 45, 50, 45, 47, 45, 50, 43], scale: [0, 2, 3, 7, 9] };
  function mtof(m) { return 440 * Math.pow(2, (m - 69) / 12); }
  function sstep(a, b, x) { var t = Math.max(0, Math.min(1, (x - a) / (b - a || 1))); return t * t * (3 - 2 * t); }
  function hash(n) { var x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); }
  function panStep(step, t, inten, c, k) {
    var spb = 60 / PAN.bpm / 4, bar = Math.floor(step / 16) % PAN.prog.length, s = step % 16, root = PAN.prog[bar], bar16 = spb * 16;
    function mv(L, send, v) { layer(L, t + (L.delay || 0), 1, v == null ? 1 : v, c, k, k.mg, send); }
    if (s === 0) {   // siempre: bordon de zumbido (dos sierras batiendo) + bajo redondo
      mv(T('sawtooth', mtof(root), mtof(root), bar16, 0.045, { a: 0.5, sus: 0.8, trem: [5.5, 0.6], flt: { t: 'lowpass', f: [420, 520], q: 2 } }));
      mv(T('sawtooth', mtof(root) * 1.011, mtof(root) * 1.011, bar16, 0.04, { a: 0.6, sus: 0.8, trem: [6.2, 0.6], flt: { t: 'lowpass', f: [400, 500], q: 2 } }));
      mv(th(mtof(root - 12), mtof(root - 12), bar16, 0.2, { a: 0.1, sus: 0.8 }));
    }
    if (s === 0 || s === 6 || s === 10) {   // bajo calido sincopado
      var bn = s === 10 ? root + 7 - 12 : root - 12, bd = spb * 3;
      mv(T('triangle', mtof(bn), mtof(bn) * 0.99, bd, 0.2, { a: 0.01, flt: { t: 'lowpass', f: [700, 300], q: 1 } }));
      mv(th(mtof(bn - 12), mtof(bn - 12), bd, 0.15, { a: 0.01 }));
    }
    var lb = sstep(0.08, 0.3, inten);
    if (lb > 0.02 && s % 2 === 0 && hash(step * 3 + 1) < 0.3 + inten * 0.2) {   // marimba de cera (pentatonica dorica)
      var f = mtof(root + 12 + PAN.scale[Math.floor(hash(step) * 5)] + (hash(step + 7) < 0.3 ? 12 : 0));
      mar(f, 0.1, 0.5, 0).forEach(function (L) { mv(L, true, lb); });
    }
    var lc = sstep(0.35, 0.6, inten);
    if (lc > 0.02) {   // enjambre: rafagas de zumbido y pizzicato
      if (s === 4 || s === 12) mv(N('bandpass', 1100, 1700, spb * 3, 0.05, 2, { a: spb, trem: [26, 0.8] }), false, lc);
      if (s % 4 === 3 && hash(step * 5 + 2) < 0.4) { var pf = mtof(root + 24 + PAN.scale[Math.floor(hash(step + 3) * 5)]); mv(T('triangle', pf, pf, 0.1, 0.05, { a: 0.002 }), true, lc); }
    }
    var lp = sstep(0.6, 0.85, inten);
    if (lp > 0.02) {   // pulso: bombo suave y chasquido de cera
      if (s % 4 === 0) mv(th(88, 38, 0.2, 0.4, { a: 0.003 }), false, lp);
      if (s === 8) mv(N('bandpass', 1400, 800, 0.07, 0.12, 4, { a: 0.001 }), false, lp);
    }
    return spb;
  }
  var PS = { timer: null, step: 0, next: 0 }, pan = false, want = false, inten = 0;
  var M0 = A.music, o0 = { start: M0.start, stop: M0.stop, setTrack: M0.setTrack, getTrack: M0.getTrack, tracks: M0.tracks, isPlaying: M0.isPlaying, setIntensity: M0.setIntensity };
  function panSched() {
    if (!ac || ac.state !== 'running') return;
    while (PS.next < ac.currentTime + 0.2) { PS.next += panStep(PS.step, PS.next, inten, ac, chain); PS.step++; }
  }
  function panStart() {
    if (panPlaying || !pan || !want) return;
    if (!A.isUnlocked() || !ensure()) { setTimeout(panStart, 400); return; }
    if (ac.state !== 'running') { try { ac.resume(); } catch (e) { /* audio */ } setTimeout(panStart, 300); return; }
    panPlaying = true; PS.step = 0; PS.next = ac.currentTime + 0.1;
    var v = A.getVolume(); chain.mg.gain.cancelScheduledValues(ac.currentTime); chain.mg.gain.setValueAtTime(0.0001, ac.currentTime);
    chain.mg.gain.linearRampToValueAtTime(muted ? 0 : v.master * v.music, ac.currentTime + 0.8);
    PS.timer = setInterval(panSched, 30);
  }
  function panStop() {
    if (!panPlaying) return; panPlaying = false; clearInterval(PS.timer); PS.timer = null;
    try { chain.mg.gain.cancelScheduledValues(ac.currentTime); chain.mg.gain.setValueAtTime(chain.mg.gain.value, ac.currentTime); chain.mg.gain.linearRampToValueAtTime(0.0001, ac.currentTime + 0.4); } catch (e) { /* audio */ }
  }
  M0.start = function () { want = true; if (pan) panStart(); else o0.start(); };
  M0.stop = function () { want = false; panStop(); o0.stop(); };
  M0.setIntensity = function (v) { inten = Math.max(0, Math.min(1, typeof v === 'boolean' ? (v ? 1 : 0) : (+v || 0))); o0.setIntensity(v); };
  M0.setTrack = function (name) {
    if (name === 'panal') { if (pan) return; pan = true; o0.stop(); if (want) panStart(); return; }
    if (pan) { pan = false; panStop(); o0.setTrack(name); if (want) o0.start(); return; }
    o0.setTrack(name);
  };
  M0.getTrack = function () { return pan ? 'panal' : o0.getTrack(); };
  M0.tracks = function () { return o0.tracks().concat(['panal']); };
  M0.isPlaying = function () { return pan ? panPlaying : o0.isPlaying(); };

  var origRM = A.renderMusic;
  A.renderMusic = function (o) {
    o = o || {};
    if (o.track !== 'panal') return origRM.apply(this, arguments);
    var OC = window.OfflineAudioContext || window.webkitOfflineAudioContext;
    if (!OC) return Promise.reject(new Error('OfflineAudioContext no disponible'));
    var bars = o.bars || 8, spb = 60 / PAN.bpm / 4, it = o.intensity == null ? 1 : o.intensity;
    var oc = new OC(2, Math.ceil((bars * 16 * spb + 3) * 44100), 44100), k = mkChain(oc, oc.destination, 1);
    k.mg.gain.value = 0.9;
    for (var i = 0; i < bars * 16; i++) panStep(i, 0.05 + i * spb, it, oc, k);
    return oc.startRendering();
  };
})();
