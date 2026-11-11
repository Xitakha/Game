/* sfx_armor.js - SFX procedurales del taller de Carapa (v8 Herrero). Requiere sfx.js (G.Snd.V/tone/hiss); cargar tras sfx_fusion2.js.
   Todo suena con G.Snd.play(nombre, pitch). Atajo: G.Snd.armor(tipo, arg) (ver ASSETS_API.md, seccion "Armadura").
   Nombres: smith_hammer1..3, smith_hammer, smith_sparks, smith_quench, smith_open, smith_close, smith_voice1..3, smith_voice,
   armor_anvil, armor_stitch, armor_equip_leather|metal|charm, armor_equip_light|heavy, armor_unequip_leather|metal|charm,
   armor_upgrade1|2|3, armor_upgrade, armor_craft, armor_set2, armor_set4, armor_deny, armor_hit_soft|hit|hit_heavy, workshop_amb. */
(function () {
  'use strict';
  var G = window.G, S = G.Snd, V = S.V, tone = S.tone, hiss = S.hiss;
  if (!V || !tone) return;
  function j(a) { return 1 + (Math.random() * 2 - 1) * (a || 0.04); }   // variacion aleatoria de tono
  function arp(fs, type, dur, vol, step, k) { fs.forEach(function (f, i) { tone(type, f * k, f * k * 1.003, dur, vol, i * step); }); }

  // ---- yunque / martillo (3 variaciones + una aleatoria)
  function hammer(p, f, ring) {
    p = p * j(0.03);
    tone('sine', 120 * p, 55, 0.1, 0.16);                                  // cuerpo del golpe
    hiss('bandpass', 3500, 1800, 0.05, 0.1);                               // chasquido
    tone('triangle', f * p, f * p * 0.985, ring, 0.07);                    // campana del yunque
    tone('sine', f * p * 2.76, f * p * 2.7, ring * 0.6, 0.035);            // parcial inarmonico metalico
  }
  V.smith_hammer1 = function (p) { hammer(p, 1250, 0.32); };
  V.smith_hammer2 = function (p) { hammer(p, 1050, 0.28); };
  V.smith_hammer3 = function (p) { hammer(p, 1480, 0.36); hiss('highpass', 5000, 3000, 0.08, 0.05, 0.02); };
  V.smith_hammer  = function (p) { V['smith_hammer' + (1 + Math.floor(Math.random() * 3))](p); };
  V.armor_anvil   = function (p) { // ligero y agudo, dos golpes (distinto del de Grum)
    p = p * j(0.02);
    tone('sine', 140 * p, 70, 0.08, 0.12); tone('triangle', 1500 * p, 1480 * p, 0.26, 0.07); tone('sine', 4100 * p, 4000 * p, 0.16, 0.03);
    tone('sine', 150 * p, 75, 0.08, 0.12, 0.17); tone('triangle', 1800 * p, 1780 * p, 0.34, 0.07, 0.17); tone('sine', 4900 * p, 4800 * p, 0.2, 0.03, 0.17);
    hiss('bandpass', 4000, 2500, 0.04, 0.08); hiss('bandpass', 4500, 2800, 0.04, 0.08, 0.17);
  };
  V.smith_sparks = function (p) { for (var i = 0; i < 6; i++) { tone('sine', (3000 + Math.random() * 3500) * p, 1800, 0.04, 0.05, i * 0.03 + Math.random() * 0.02); } hiss('highpass', 6500, 4000, 0.25, 0.08); };
  V.smith_quench = function (p) { hiss('highpass', 3000, 6000, 0.7, 0.1); hiss('bandpass', 1800, 900, 0.5, 0.06, 0.05); tone('sine', 300 * p, 90, 0.3, 0.05); }; // siseo de templar
  V.smith_open   = function (p) { hiss('bandpass', 1400, 900, 0.14, 0.09); tone('triangle', 300 * p, 520 * p, 0.12, 0.06); tone('sine', 1200 * p, 1250 * p, 0.12, 0.03, 0.06); };
  V.smith_close  = function (p) { hiss('bandpass', 1100, 600, 0.12, 0.08); tone('triangle', 520 * p, 280 * p, 0.12, 0.06); tone('sine', 110 * p, 70, 0.1, 0.08, 0.04); };
  V.armor_stitch = function (p) { for (var i = 0; i < 4; i++) { hiss('bandpass', 2600, 1800, 0.035, 0.13, i * 0.06); tone('sine', (900 + i * 60) * p, 700, 0.03, 0.05, i * 0.06); } hiss('lowpass', 900, 300, 0.12, 0.05, 0.25); };

  // ---- voz de Carapa: tick-tick de caparazon, 3 variantes
  function ticks(p, n, f, gap) { for (var i = 0; i < n; i++) { tone('square', f * p * (1 + i * 0.05), f * p * 0.6, 0.03, 0.07, i * gap); hiss('bandpass', 3200, 2200, 0.025, 0.09, i * gap); } }
  V.smith_voice1 = function (p) { ticks(p, 2, 1400, 0.055); };
  V.smith_voice2 = function (p) { ticks(p, 3, 1100, 0.045); };
  V.smith_voice3 = function (p) { ticks(p, 2, 1700, 0.07); tone('triangle', 500 * p, 420 * p, 0.05, 0.03, 0.04); };
  V.smith_voice  = function (p) { V['smith_voice' + (1 + Math.floor(Math.random() * 3))](p); };

  // ---- equipar / desequipar por slot
  V.armor_equip_leather = function (p) { hiss('lowpass', 1400, 500, 0.12, 0.12); tone('sine', 150 * p, 90, 0.1, 0.1); tone('triangle', 1700 * p, 1500, 0.05, 0.04, 0.07); tone('triangle', 2000 * p, 1700, 0.05, 0.03, 0.1); }; // cuero y hebilla
  V.armor_equip_metal   = function (p) { tone('sine', 110 * p, 60, 0.12, 0.15); hiss('bandpass', 3000, 1500, 0.07, 0.1); tone('triangle', 900 * p, 880 * p, 0.2, 0.06, 0.02); tone('sine', 2480 * p, 2400 * p, 0.14, 0.03, 0.02); };
  V.armor_equip_charm   = function (p) { tone('sine', 1760 * p, 1760 * p, 0.2, 0.05); tone('sine', 2349 * p, 2349 * p, 0.25, 0.045, 0.06); hiss('highpass', 6500, 5000, 0.08, 0.025); tone('sine', 220 * p, 180, 0.1, 0.05); };
  V.armor_equip_light   = V.armor_equip_leather;
  V.armor_equip_heavy   = V.armor_equip_metal;
  V.armor_unequip_leather = function (p) { hiss('lowpass', 1000, 400, 0.1, 0.09); tone('triangle', 1600 * p, 1900, 0.04, 0.03); tone('sine', 140 * p, 80, 0.08, 0.07, 0.04); };
  V.armor_unequip_metal   = function (p) { hiss('bandpass', 2500, 1200, 0.06, 0.08); tone('triangle', 700 * p, 650 * p, 0.14, 0.05); tone('sine', 100 * p, 60, 0.1, 0.1, 0.03); };
  V.armor_unequip_charm   = function (p) { tone('sine', 2349 * p, 2349 * p, 0.12, 0.04); tone('sine', 1760 * p, 1700 * p, 0.18, 0.035, 0.05); };

  // ---- mejora +1/+2/+3: golpe + campanilla ascendente (+3 con eco)
  function upgrade(p, notes, echo) {
    hammer(p, 1250, 0.2);
    notes.forEach(function (f, i) {
      var t = 0.1 + i * 0.075;
      tone('triangle', f * p, f * p, 0.22, 0.06, t); tone('sine', f * p * 2, f * p * 2, 0.3, 0.03, t);
      if (echo) { tone('sine', f * p, f * p, 0.25, 0.025, t + 0.17); tone('sine', f * p * 2, f * p * 2, 0.3, 0.012, t + 0.34); }
    });
  }
  V.armor_upgrade1 = function (p) { upgrade(p, [784, 1175], false); };
  V.armor_upgrade2 = function (p) { upgrade(p, [784, 988, 1319], false); };
  V.armor_upgrade3 = function (p) { upgrade(p, [784, 988, 1319, 1760], true); hiss('highpass', 6000, 3000, 0.45, 0.05, 0.3); tone('sine', 110 * p, 220 * p, 0.5, 0.1, 0.1); };
  V.armor_upgrade  = V.armor_upgrade1;

  // ---- fabricar pieza (jingle corto: martillazo + tres notas)
  V.armor_craft = function (p) { hammer(p, 1500, 0.2); arp([523, 659, 880], 'triangle', 0.2, 0.06, 0.07, p); tone('sine', 1760 * p, 1760 * p, 0.3, 0.025, 0.25); };

  // ---- bonos de set (stingers cortos)
  V.armor_set2 = function (p) { arp([440, 660], 'triangle', 0.25, 0.07, 0.09, p); arp([880, 1320], 'sine', 0.3, 0.035, 0.09, p); hiss('highpass', 6000, 3500, 0.2, 0.04, 0.08); };
  V.armor_set4 = function (p) {
    arp([440, 554, 659, 880], 'triangle', 0.26, 0.06, 0.075, p); arp([880, 1108, 1319, 1760], 'sine', 0.35, 0.035, 0.075, p);
    tone('sine', 110 * p, 220 * p, 0.55, 0.12, 0.05); tone('square', 660 * p, 660 * p, 0.4, 0.025, 0.3); hiss('highpass', 6000, 2500, 0.45, 0.05, 0.28);
  };

  // ---- error / sin material: dos pulsos graves apagados, sin estridencia
  V.armor_deny = function (p) { tone('square', 220 * p, 180 * p, 0.09, 0.04); tone('square', 165 * p, 130 * p, 0.14, 0.04, 0.1); tone('sine', 90 * p, 60, 0.2, 0.08); hiss('lowpass', 700, 200, 0.1, 0.04); };

  // ---- golpe amortiguado por armadura (se mezcla con hurt): suave / normal / fuerte segun reduccion
  V.armor_hit_soft  = function (p) { tone('sine', 120 * p, 60, 0.1, 0.09); hiss('lowpass', 1500, 400, 0.07, 0.07); tone('triangle', 800 * p, 700, 0.1, 0.03); };
  V.armor_hit       = function (p) { tone('sine', 110 * p, 55, 0.13, 0.12); hiss('bandpass', 2200, 900, 0.08, 0.08); tone('triangle', 950 * p, 880 * p, 0.16, 0.045); tone('sine', 2600 * p, 2500 * p, 0.1, 0.02, 0.01); };
  V.armor_hit_heavy = function (p) { tone('sine', 95 * p, 45, 0.18, 0.16); hiss('lowpass', 2000, 250, 0.12, 0.1); tone('triangle', 700 * p, 640 * p, 0.24, 0.06); tone('sine', 1930 * p, 1850 * p, 0.2, 0.03, 0.01); };

  // ---- ambiente de taller (~1,6 s, volumen bajo; repetir cada ~1,8 s mientras la camara este cerca): fuelle, tic de martillo lejano y brasa
  V.workshop_amb = function (p) {
    hiss('lowpass', 500, 250, 0.7, 0.06); hiss('lowpass', 300, 600, 0.6, 0.05, 0.8);          // fuelle
    tone('triangle', 1200 * p, 1180 * p, 0.12, 0.03, 0.35); tone('triangle', 1200 * p, 1180 * p, 0.12, 0.025, 0.95);   // martillo lejano
    hiss('highpass', 5500, 4500, 0.05, 0.05, 0.6); hiss('highpass', 5500, 4500, 0.04, 0.04, 1.2);                   // chasquido de brasa
  };

  // Atajo: S.armor('hammer'|'anvil'|'sparks'|'quench'|'open'|'close'|'stitch'|'voice'|'craft'|'set2'|'set4'|'deny'|'amb')
  //        S.armor('equip'|'unequip', 'leather'|'metal'|'charm'), S.armor('upgrade', 1|2|3), S.armor('hit', reduccion 0..1)
  S.armor = function (kind, arg, pitch) {
    var n;
    if (kind === 'equip' || kind === 'unequip') n = 'armor_' + kind + '_' + (/^(leather|metal|charm)$/.test(arg) ? arg : 'metal');
    else if (kind === 'upgrade') n = 'armor_upgrade' + Math.max(1, Math.min(3, arg | 0 || 1));
    else if (kind === 'hit') n = arg >= 0.4 ? 'armor_hit_heavy' : (arg >= 0.2 ? 'armor_hit' : 'armor_hit_soft');
    else if (kind === 'hammer' || kind === 'voice' || kind === 'sparks' || kind === 'quench' || kind === 'open' || kind === 'close') n = 'smith_' + kind;
    else if (kind === 'amb') n = 'workshop_amb';
    else n = 'armor_' + kind;
    S.play(n, pitch);
  };
  S.armornames = Object.keys(V).filter(function (n) { return /^(smith_|armor_|workshop_amb)/.test(n); });
})();
