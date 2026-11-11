/* sfx_armor2.js - SFX procedurales de armadura v8 (sets Letea/Yarlak/Melaria/Cenizar, talisman de minijefe, boton EQUIPO, logro).
   Requiere sfx.js y, para armor2 junto a armor(), cargar tras sfx_armor.js. No modifica nada existente; solo anade G.Snd.V.a2_* y G.Snd.armor2.
   Nombres: a2_equip_<set>, a2_upgrade_<set>_1..3, a2_set_<set>, a2_talisman_mini, a2_hit_<mat>, a2_equipo_open, a2_equipo_close, a2_equipo_try, a2_achv
   set = letea|yarlak|melaria|cenizar ; mat = leather|metal|charm|letea|yarlak|melaria|cenizar. */
(function () {
  'use strict';
  var G = window.G, S = G && G.Snd, V = S && S.V, tone = S && S.tone, hiss = S && S.hiss;
  if (!V || !tone || !hiss) return;
  function j(a) { return 1 + (Math.random() * 2 - 1) * (a || 0.04); }
  function arp(fs, type, dur, vol, step, k, t0) { fs.forEach(function (f, i) { tone(type, f * k, f * k * 1.003, dur, vol, (t0 || 0) + i * step); }); }
  var SETS = ['letea', 'yarlak', 'melaria', 'cenizar'];

  // ---- "textura" base de cada set (equipar): letea=burbujas de pantano, yarlak=cristal de hielo, melaria=cera/miel viscosa, cenizar=brasa y ceniza
  var tex = {
    letea: function (p, v) { // burbujas que suben + siseo acido
      v = v || 1; hiss('lowpass', 700, 300, 0.12, 0.08 * v);
      for (var i = 0; i < 3; i++) tone('sine', (260 + i * 90) * p * j(0.08), (520 + i * 140) * p, 0.07, 0.07 * v, i * 0.045);
      tone('triangle', 180 * p, 130 * p, 0.16, 0.04 * v, 0.02);
    },
    yarlak: function (p, v) { // cristal: tintineo agudo + crujido
      v = v || 1; hiss('highpass', 5500, 3500, 0.07, 0.07 * v);
      tone('sine', 2093 * p, 2090 * p, 0.28, 0.045 * v); tone('sine', 3136 * p * j(0.02), 3120 * p, 0.22, 0.03 * v, 0.03); tone('sine', 2637 * p, 2630 * p, 0.2, 0.025 * v, 0.07);
      tone('sine', 120 * p, 70, 0.08, 0.07 * v);
    },
    melaria: function (p, v) { // cera blanda: golpe sordo + glissando "gooey" + zumbido
      v = v || 1; tone('sine', 140 * p, 85, 0.14, 0.11 * v); hiss('lowpass', 900, 350, 0.14, 0.06 * v);
      tone('triangle', 320 * p, 190 * p, 0.2, 0.05 * v, 0.03); tone('sawtooth', 210 * p, 205 * p, 0.18, 0.02 * v, 0.05);
    },
    cenizar: function (p, v) { // ceniza: crepitar de brasa + golpe grave ronco
      v = v || 1; tone('sine', 90 * p, 50, 0.18, 0.14 * v); hiss('bandpass', 1800, 700, 0.16, 0.08 * v);
      for (var i = 0; i < 4; i++) hiss('highpass', 5500, 4000, 0.025, 0.06 * v, 0.03 + i * 0.04 + Math.random() * 0.02);
      tone('triangle', 240 * p, 150 * p, 0.2, 0.04 * v, 0.02);
    }
  };
  // tema melodico por set (notas para mejora y set completo)
  var scale = {
    letea:   [330, 392, 466, 554],   // menor disminuido, inquietante
    yarlak:  [523, 659, 784, 1047],  // mayor frio y cristalino
    melaria: [392, 494, 587, 740],   // calido, redondo
    cenizar: [294, 349, 440, 587]    // grave, ardiente
  };
  var wave = { letea: 'triangle', yarlak: 'sine', melaria: 'triangle', cenizar: 'sawtooth' };
  var wv = { letea: 1, yarlak: 1, melaria: 1, cenizar: 0.55 };   // el diente de sierra suena mas fuerte: atenuar

  SETS.forEach(function (s) {
    V['a2_equip_' + s] = function (p) { tex[s](p, 1); };
    [1, 2, 3].forEach(function (lv) {
      V['a2_upgrade_' + s + '_' + lv] = function (p) {
        tex[s](p, 0.8);
        var notes = scale[s].slice(0, lv + 1);
        arp(notes, wave[s], 0.22, 0.06 * wv[s], 0.075, p, 0.1);
        arp(notes.map(function (f) { return f * 2; }), 'sine', 0.3, 0.03, 0.075, p, 0.1);
        if (lv === 3) { hiss('highpass', 6000, 3000, 0.4, 0.05, 0.3); tone('sine', 110 * p, 220 * p, 0.45, 0.1, 0.1); tone('sine', notes[3] * p, notes[3] * p, 0.3, 0.025, 0.45); }
      };
    });
    // set completo: stinger propio (~0.8 s)
    V['a2_set_' + s] = function (p) {
      var n = scale[s];
      arp([n[0], n[1], n[2], n[3], n[3] * 2], wave[s], 0.3, 0.055 * wv[s], 0.085, p);
      arp([n[0] * 2, n[2] * 2, n[3] * 2], 'sine', 0.4, 0.03, 0.085, p, 0.08);
      tone('sine', 100 * p, 200 * p, 0.6, 0.12, 0.05);
      tex[s](p, 0.7);
      if (s === 'letea') { for (var i = 0; i < 5; i++) tone('sine', (300 + i * 70) * p, (700 + i * 90) * p, 0.07, 0.05, 0.35 + i * 0.07); }
      else if (s === 'yarlak') { for (var k = 0; k < 6; k++) tone('sine', (2600 + Math.random() * 2400) * p, 2000, 0.1, 0.035, 0.3 + k * 0.06); hiss('highpass', 6500, 3000, 0.5, 0.05, 0.3); }
      else if (s === 'melaria') { tone('triangle', 330 * p, 250 * p, 0.5, 0.045, 0.4); tone('sine', 165 * p, 165 * p, 0.6, 0.05, 0.4); }   // zumbido caliente
      else { hiss('bandpass', 1500, 600, 0.6, 0.07, 0.3); tone('sine', 55 * p, 45, 0.5, 0.14, 0.35); for (var m = 0; m < 6; m++) hiss('highpass', 5500, 4000, 0.025, 0.05, 0.4 + m * 0.06); }
    };
  });

  // ---- talisman de minijefe: campanilla mistica + pulso grave + estrella ascendente (~0.7 s)
  V.a2_talisman_mini = function (p) {
    p = p * j(0.02);
    tone('sine', 1319 * p, 1319 * p, 0.35, 0.05); tone('sine', 1760 * p, 1760 * p, 0.35, 0.045, 0.07); tone('sine', 2637 * p, 2637 * p, 0.45, 0.04, 0.14);
    tone('sine', 98 * p, 196 * p, 0.4, 0.11, 0.02); tone('triangle', 659 * p, 1319 * p, 0.3, 0.03, 0.05);
    hiss('highpass', 7000, 4500, 0.35, 0.04, 0.12); tone('sine', 3520 * p, 3500 * p, 0.3, 0.02, 0.3);
  };

  // ---- golpe amortiguado por material (acompana a hurt)
  var hit = {
    leather: function (p) { tone('sine', 115 * p, 60, 0.1, 0.1); hiss('lowpass', 1200, 350, 0.09, 0.09); },
    metal:   function (p) { tone('sine', 105 * p, 55, 0.12, 0.12); hiss('bandpass', 2400, 1000, 0.07, 0.08); tone('triangle', 1000 * p, 940 * p, 0.2, 0.05); tone('sine', 2750 * p, 2650 * p, 0.14, 0.025); },
    charm:   function (p) { tone('sine', 130 * p, 70, 0.08, 0.07); tone('sine', 1760 * p, 1700 * p, 0.2, 0.04); tone('sine', 2349 * p, 2300 * p, 0.15, 0.025, 0.02); },
    letea:   function (p) { tone('sine', 110 * p, 60, 0.1, 0.1); tone('sine', 300 * p, 140 * p, 0.12, 0.06); hiss('lowpass', 900, 300, 0.12, 0.07); },
    yarlak:  function (p) { tone('sine', 110 * p, 60, 0.1, 0.1); hiss('highpass', 4500, 2500, 0.08, 0.07); tone('sine', 2400 * p, 2300 * p, 0.18, 0.04); },
    melaria: function (p) { tone('sine', 100 * p, 50, 0.16, 0.12); hiss('lowpass', 700, 250, 0.14, 0.07); tone('triangle', 260 * p, 150 * p, 0.14, 0.04); },
    cenizar: function (p) { tone('sine', 90 * p, 45, 0.16, 0.13); hiss('bandpass', 1600, 600, 0.12, 0.08); hiss('highpass', 5500, 4000, 0.03, 0.05, 0.04); }
  };
  Object.keys(hit).forEach(function (m) { V['a2_hit_' + m] = function (p) { hit[m](p * j(0.03)); }; });

  // ---- boton EQUIPO: abrir (barrido ascendente + hebilla), cerrar (descendente), probar (equipar/desequipar rapido de prueba)
  V.a2_equipo_open  = function (p) { hiss('bandpass', 1200, 2200, 0.15, 0.08); tone('triangle', 260 * p, 480 * p, 0.14, 0.06); tone('triangle', 1700 * p, 1900 * p, 0.05, 0.035, 0.08); tone('sine', 880 * p, 1320 * p, 0.14, 0.035, 0.1); };
  V.a2_equipo_close = function (p) { hiss('bandpass', 1800, 700, 0.12, 0.07); tone('triangle', 480 * p, 240 * p, 0.12, 0.05); tone('sine', 110 * p, 70, 0.1, 0.08, 0.05); };
  V.a2_equipo_try   = function (p) { tone('sine', 120 * p, 80, 0.07, 0.09); tone('triangle', 1400 * p, 1500 * p, 0.05, 0.04, 0.03); tone('sine', 988 * p, 1175 * p, 0.12, 0.04, 0.08); tone('sine', 1319 * p, 1319 * p, 0.14, 0.03, 0.14); };

  // ---- logro de armadura: fanfarria corta (~0.9 s)
  V.a2_achv = function (p) {
    hiss('bandpass', 3500, 2000, 0.05, 0.08); tone('sine', 120 * p, 60, 0.1, 0.12);
    arp([523, 659, 784, 1047], 'triangle', 0.25, 0.06, 0.09, p, 0.04);
    arp([1047, 1319, 1568, 2093], 'sine', 0.35, 0.03, 0.09, p, 0.04);
    tone('triangle', 1047 * p, 1047 * p, 0.5, 0.05, 0.4); tone('sine', 523 * p, 523 * p, 0.55, 0.05, 0.4); tone('sine', 2093 * p, 2093 * p, 0.5, 0.025, 0.4);
    hiss('highpass', 6500, 3500, 0.4, 0.045, 0.4);
  };

  // Atajo: armor2('equip'|'set', set) ; armor2('upgrade', set | 'set:lvl' | {set,lvl}, pitch) ; armor2('hit', material) ;
  //        armor2('talisman') ; armor2('open'|'close'|'try') (boton EQUIPO) ; armor2('achv')
  function parseSet(a) {
    var s = a, lv = 1;
    if (a && typeof a === 'object') { s = a.set; lv = a.lvl || a.level || 1; }
    else if (typeof a === 'string' && a.indexOf(':') > 0) { var t = a.split(':'); s = t[0]; lv = +t[1] || 1; }
    return { set: SETS.indexOf(s) >= 0 ? s : 'letea', lvl: Math.max(1, Math.min(3, lv | 0)) };
  }
  S.armor2 = function (kind, arg, pitch) {
    var n;
    if (kind === 'equip') n = 'a2_equip_' + parseSet(arg).set;
    else if (kind === 'set') n = 'a2_set_' + parseSet(arg).set;
    else if (kind === 'upgrade') { var o = parseSet(arg); n = 'a2_upgrade_' + o.set + '_' + o.lvl; }
    else if (kind === 'hit') n = 'a2_hit_' + (hit[arg] ? arg : 'metal');
    else if (kind === 'talisman') n = 'a2_talisman_mini';
    else if (kind === 'open' || kind === 'close' || kind === 'try') n = 'a2_equipo_' + kind;
    else if (kind === 'achv') n = 'a2_achv';
    else return;
    S.play(n, pitch);
  };
  S.armor2names = Object.keys(V).filter(function (n) { return /^a2_/.test(n); });
  // registrar tambien en armornames (si existe) sin alterar lo previo
  if (S.armornames && S.armornames.concat) S.armornames = S.armornames.concat(S.armor2names.filter(function (n) { return S.armornames.indexOf(n) < 0; }));
})();
