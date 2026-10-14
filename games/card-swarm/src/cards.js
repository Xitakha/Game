/* cards.js - Catálogo de cartas (26), combos por etiquetas (12), mano de 5 slots, fusión, Ceniza, reroll, descarte,
   sesgo de sinergia en la oferta y el dibujo de cartas (marco por etiqueta, iconos, barrido de cooldown). */
(function () {
  'use strict';
  var G = window.G, C = G.Cards = {};
  var SLOTS = 5, LVS = [0, 1, 1.5, 2];

  // ------------------------------------------------------------- Datos
  C.defs = [
    // --- Ataque
    { id: 'spark', name: 'Chispa', short: 'Chispa', tag: 'fire', type: 'attack', kind: 'proj', proj: 'spark', icon: 'flame', cd: 800, dmg: 12, speed: 420, burn: 3, desc: 'Proyectil al enemigo más cercano. 12 de daño + quemadura.' },
    { id: 'ember', name: 'Bola de brasa', short: 'Brasa', tag: 'fire', type: 'attack', kind: 'lob', icon: 'burst', cd: 1800, dmg: 22, speed: 160, boomR: 40, desc: 'Bola lenta que explota en radio 40. 22 de daño.' },
    { id: 'ring', name: 'Anillo ardiente', short: 'Anillo', tag: 'fire', type: 'attack', kind: 'orbital', icon: 'ring', n: 2, orbR: 60, omega: 3.2, bodyR: 10, tick: 400, dmg: 7, burn: 3, desc: '2 llamas orbitan a tu alrededor. 7 de daño por contacto. Permanente.' },
    { id: 'shard', name: 'Esquirla', short: 'Esquirla', tag: 'ice', type: 'attack', kind: 'proj', proj: 'shard', icon: 'flake', cd: 1000, dmg: 10, speed: 460, slow: [0.35, 2000], desc: 'Proyectil de 10 de daño que ralentiza 2 s.' },
    { id: 'nova', name: 'Nova helada', short: 'Nova', tag: 'ice', type: 'attack', kind: 'pulse', icon: 'nova', cd: 3500, dmg: 8, pulseR: 85, slow: [0.4, 2500], desc: 'Pulso de radio 85 a tu alrededor. 8 de daño y ralentiza.' },
    { id: 'blizzard', name: 'Ventisca', short: 'Ventisca', tag: 'ice', type: 'attack', kind: 'aura', icon: 'snow', auraR: 70, dps: 4, slow: [0.25, 500], desc: 'Aura de radio 70: 4 dps y ralentiza 25%. Permanente.' },
    { id: 'zap', name: 'Chispazo', short: 'Chispazo', tag: 'lightning', type: 'attack', kind: 'chain', icon: 'bolt', cd: 1400, dmg: 14, jumps: 3, desc: 'Rayo que salta entre 3 enemigos. 14 de daño (-20% por salto).' },
    { id: 'storm', name: 'Tormenta', short: 'Tormenta', tag: 'lightning', type: 'attack', kind: 'strike', icon: 'storm', cd: 2200, dmg: 32, boomR: 30, desc: 'Cae un rayo en un enemigo visible al azar. 32 de daño en área.' },
    { id: 'dart', name: 'Dardo tóxico', short: 'Dardo', tag: 'poison', type: 'attack', kind: 'proj', proj: 'dart', icon: 'dart', cd: 900, dmg: 6, speed: 380, poison: true, desc: 'Proyectil de 6 de daño + veneno (apila x3).' },
    { id: 'pool', name: 'Charco', short: 'Charco', tag: 'poison', type: 'attack', kind: 'pool', icon: 'pool', cd: 3500, poolR: 40, dps: 6, desc: 'Charco de 5 s bajo el enemigo más cercano. 6 dps + veneno.' },
    { id: 'cloud', name: 'Nube pútrida', short: 'Nube', tag: 'poison', type: 'attack', kind: 'aura', icon: 'cloud', auraR: 60, dps: 3, poison: true, desc: 'Aura de radio 60: 3 dps + veneno. Permanente.' },
    { id: 'fang', name: 'Colmillo', short: 'Colmillo', tag: 'blood', type: 'attack', kind: 'slash', icon: 'fang', cd: 1100, dmg: 18, range: 55, desc: 'Tajo en arco de 90 grados. 18 de daño; matar cura 1 HP.' },
    { id: 'bleed', name: 'Sangría', short: 'Sangría', tag: 'blood', type: 'attack', kind: 'mark', icon: 'drop', cd: 2000, dmg: 2, desc: 'Marca a 3 enemigos cercanos: sangrado 5 dps durante 3 s.' },
    { id: 'dagger', name: 'Daga', short: 'Daga', tag: 'steel', type: 'attack', kind: 'fan', icon: 'dagger', cd: 1200, dmg: 9, speed: 460, desc: 'Lanza 3 dagas en abanico. 9 de daño cada una.' },
    { id: 'axe', name: 'Hacha giratoria', short: 'Hacha', tag: 'steel', type: 'attack', kind: 'boomerang', icon: 'axe', cd: 2000, dmg: 22, speed: 300, desc: 'Boomerang que atraviesa. 22 de daño, ida y vuelta.' },
    { id: 'thorns', name: 'Escudo de púas', short: 'Púas', tag: 'steel', type: 'attack', kind: 'orbital', icon: 'shield', n: 3, orbR: 45, omega: 3.8, bodyR: 9, tick: 450, dmg: 6, kb: 40, desc: '3 escudos orbitan a radio 45. 6 de daño y empuje. Permanente.' },
    // --- Pasivas
    { id: 'mantle', name: 'Manto de ceniza', short: 'Manto', tag: 'fire', type: 'passive', icon: 'mantle', desc: 'Las cartas FUEGO hacen +25% de daño.' },
    { id: 'frost', name: 'Cristal de escarcha', short: 'Escarcha', tag: 'ice', type: 'passive', icon: 'flake', desc: 'Ralentizaciones: +15 puntos de intensidad y +1 s de duración.' },
    { id: 'bell', name: 'Cascabel conductor', short: 'Cascabel', tag: 'lightning', type: 'passive', icon: 'bell', desc: 'Las cartas RAYO: -20% de cooldown y +1 salto.' },
    { id: 'bile', name: 'Frasco de bilis', short: 'Bilis', tag: 'poison', type: 'passive', icon: 'flask', desc: 'Veneno +50% de daño y apila hasta 5.' },
    { id: 'heart', name: 'Corazón de lana', short: 'Lana', tag: 'blood', type: 'passive', icon: 'heart', desc: '+30 vida máxima y cura 30 al instante.' },
    { id: 'whet', name: 'Piedra de afilar', short: 'Afilar', tag: 'steel', type: 'passive', icon: 'whet', desc: 'Las cartas ACERO: +25% de daño y +10% de crítico (x2).' },
    { id: 'hourglass', name: 'Reloj de arena', short: 'Reloj', tag: 'neutral', type: 'passive', icon: 'hourglass', desc: 'Todos los cooldowns -10%. Sin etiqueta: no hace combo.' },
    { id: 'hooves', name: 'Pezuñas veloces', short: 'Pezuñas', tag: 'neutral', type: 'passive', icon: 'boots', desc: '+12% de velocidad de movimiento. Sin etiqueta.' },
    { id: 'magnet', name: 'Imán de brasas', short: 'Imán', tag: 'neutral', type: 'passive', icon: 'magnet', desc: 'Radio de recogida x2 y +20% de XP. Sin etiqueta.' },
    { id: 'satchel', name: 'Alforja de ceniza', short: 'Alforja', tag: 'neutral', type: 'passive', icon: 'bag', desc: '+50% de Ceniza y rerolls 5 más baratos. Sin etiqueta.' }
  ];
  var BYID = {}; C.defs.forEach(function (d) { d.id && (BYID[d.id] = d); });
  C.def = function (id) { return BYID[id]; };
  var ORB = { ring: 1, thorns: 1 };
  C.ORB = ORB;

  C.combos = [
    { k: 'vapor', name: 'VAPOR', a: 'fire', b: 'ice', desc: 'FUEGO +50% contra ralentizados y deja nube de vapor.' },
    { k: 'gas', name: 'GAS EXPLOSIVO', a: 'fire', b: 'poison', desc: 'Los envenenados explotan al morir (25, radio 50).' },
    { k: 'freeze', name: 'CONGELACIÓN', a: 'ice', b: 'lightning', desc: 'Rayo sobre ralentizado: aturde 0,8 s y x1,5 de daño.' },
    { k: 'overload', name: 'SOBRECARGA', a: 'lightning', b: 'fire', desc: 'Cada 6.º disparo de Rayo/Fuego lanza plasma (45, radio 60).' },
    { k: 'bloodpoison', name: 'SANGRE ENVENENADA', a: 'blood', b: 'poison', desc: 'Los envenenados sangran (+3 dps); 15 kills curan 4 HP.' },
    { k: 'frenzy', name: 'FRENESÍ', a: 'blood', b: 'steel', desc: 'Tras cada kill, 1,5 s de +30% velocidad de ataque.' },
    { k: 'edge_elec', name: 'FILO ELÉCTRICO', a: 'steel', b: 'lightning', desc: 'Proyectiles de ACERO encadenan 2 saltos de rayo.' },
    { k: 'edge_ice', name: 'FILO GÉLIDO', a: 'ice', b: 'steel', desc: 'ACERO contra ralentizados: crítico garantizado (x2).' },
    { k: 'forge', name: 'FORJA', a: 'fire', b: 'steel', desc: 'Los proyectiles de ACERO queman.' },
    { k: 'plague', name: 'PLAGA CONGELADA', a: 'poison', b: 'ice', desc: 'Veneno +3 s en ralentizados; al morir se propaga a 3.' },
    { k: 'pact', name: 'PACTO ARDIENTE', a: 'blood', b: 'fire', desc: 'Matar con FUEGO cura 2 HP; +20% de daño con HP < 50%.' },
    { k: 'discharge', name: 'DESCARGA TÓXICA', a: 'poison', b: 'lightning', desc: 'Un rayo consume el veneno: 8 de daño por stack.' }
  ];
  C.combos.forEach(function (c, i) { c.pitch = 0.8 + (i % 6) * 0.1; });

  C.active = {}; C.flash = {};
  C.mods = {};
  C.off = null;

  // ------------------------------------------------------------- Mano y modificadores
  function hand() { return G.player.hand; }
  C.slotOf = function (id) { var h = hand(); for (var i = 0; i < h.length; i++) if (h[i] && h[i].id === id) return h[i]; return null; };
  C.hasTag = function (tag) { var h = hand(); for (var i = 0; i < h.length; i++) if (h[i] && C.def(h[i].id).tag === tag) return true; return false; };
  C.count = function () { var n = 0, h = hand(); for (var i = 0; i < h.length; i++) if (h[i]) n++; return n; };
  function lv(id) { var s = C.slotOf(id); return s ? LVS[s.lvl] : 0; }

  C.reset = function () {
    G.player.hand = []; for (var i = 0; i < SLOTS; i++) G.player.hand.push(null);
    C.active = {}; C.flash = {}; C.off = null; C.recalc(false);
  };

  // Recalcula modificadores y combos activos; con announce=true anuncia los nuevos (banner, stinger, línea)
  C.recalc = function (announce) {
    var m = C.mods, p = G.player;
    m.fireDmg = 1 + 0.25 * lv('mantle'); m.slowAdd = 0.15 * lv('frost'); m.slowDur = 1000 * lv('frost');
    m.lightSpd = 1 / (1 - Math.min(0.6, 0.2 * lv('bell'))); m.lightJumps = Math.round(lv('bell'));
    m.poisonDmg = 1 + 0.5 * lv('bile'); m.poisonMax = lv('bile') > 0 ? 5 : 3;
    m.steelDmg = 1 + 0.25 * lv('whet'); m.steelCrit = 0.1 * lv('whet');
    m.cdMul = 1 - 0.1 * lv('hourglass'); m.speed = 1 + 0.12 * lv('hooves');
    m.magnet = lv('magnet') > 0 ? 2 : 1; m.xpMul = 1 + 0.2 * lv('magnet');
    m.ashMul = 1 + 0.5 * lv('satchel'); m.rerollDisc = lv('satchel') > 0 ? 5 : 0;
    p.maxHp = G.B.player.hp + 30 * lv('heart'); p.hp = Math.min(p.hp, p.maxHp);
    var prev = C.active, now = {}, idx = 0;
    C.combos.forEach(function (c, i) {
      if (C.hasTag(c.a) && C.hasTag(c.b)) {
        now[c.k] = true;
        if (announce && !prev[c.k]) {
          G.Hud.banner(c.name + '!', 2000, '#ffe9a0', c);
          G.Snd.play('combo', c.pitch);
          C.flash[c.k] = 1800; idx = i;
          G.fx.ring(p.x, p.y, 10, 120, 500, G.TAGS[c.a].color, 6); G.fx.ring(p.x, p.y, 6, 90, 400, G.TAGS[c.b].color, 4);
          G.fx.burst(p.x, p.y, 24, G.TAGS[c.b].color, 260, 600, 4, { add: true });
          G.fx.burst(p.x, p.y, 24, G.TAGS[c.a].color, 200, 600, 4, { add: true });
        }
      }
    });
    C.active = now;
  };

  C.snapshot = function () {
    return { hand: hand().map(function (s) { return s ? { id: s.id, lvl: s.lvl } : null; }),
      combos: C.combos.filter(function (c) { return C.active[c.k]; }) };
  };

  // Añade una carta: devuelve { fused, slot } o null si la mano está llena
  C.add = function (id) {
    var h = hand(), ex = C.slotOf(id);
    if (ex) { ex.lvl = Math.min(3, ex.lvl + 1); ex.cd = 0; return { fused: true, slot: h.indexOf(ex) }; }
    var e = h.indexOf(null);
    if (e < 0) return null;
    h[e] = { id: id, lvl: 1, cd: 300, cdMax: 300, flash: 0, ang: 0 };
    return { fused: false, slot: e };
  };

  // ------------------------------------------------------------- Oferta
  function pool() { return C.defs.filter(function (d) { var s = C.slotOf(d.id); return !s || s.lvl < 3; }); }
  function rndOf(a) { return a[Math.floor(Math.random() * a.length)]; }
  // combos que se activarían al tener una carta de esta etiqueta
  C.newCombos = function (tag) {
    if (tag === 'neutral' || C.hasTag(tag)) return [];
    return C.combos.filter(function (c) { return (c.a === tag && C.hasTag(c.b)) || (c.b === tag && C.hasTag(c.a)); });
  };

  C.makeOffer = function (mode) {
    if (mode === 'start' && !C.off.rerolls) return ['spark', 'shard', 'dart'];
    var P = pool(), out = [], full = C.count() >= SLOTS;
    if (mode === 'start') P = P.filter(function (d) { return d.type === 'attack'; });
    if (mode !== 'start') {
      var syn = P.filter(function (d) { return !C.slotOf(d.id) && C.newCombos(d.tag).length > 0 && (d.type === 'attack' || !full || true); });
      if (Math.random() < 0.7 && syn.length) out.push(rndOf(syn).id);
      var dups = P.filter(function (d) { return C.slotOf(d.id) && out.indexOf(d.id) < 0; });
      if (dups.length && Math.random() < (full ? 0.7 : 0.25)) out.push(rndOf(dups).id);
    }
    var guard = 0;
    while (out.length < 3 && guard++ < 200) {
      var cand = P.filter(function (d) { return out.indexOf(d.id) < 0; });
      if (!cand.length) break;
      var ws = cand.map(function (d) {
        var w = d.type === 'attack' ? 3 : 1.4;
        if (full && !C.slotOf(d.id)) w *= 0.5;
        if (C.count() < 3 && d.type === 'passive') w *= 0.4;
        return w;
      });
      var tot = ws.reduce(function (a, b) { return a + b; }, 0), r = Math.random() * tot, k = 0;
      for (var i = 0; i < ws.length; i++) { r -= ws[i]; if (r <= 0) { k = i; break; } }
      out.push(cand[k].id);
    }
    for (var j = out.length - 1; j > 0; j--) { var q = Math.floor(Math.random() * (j + 1)), t = out[j]; out[j] = out[q]; out[q] = t; }
    return out;
  };

  C.rerollCost = function () { return Math.max(5, 15 * (C.off.rerolls + 1) - C.mods.rerollDisc); };

  C.open = function (mode) {
    C.off = { mode: mode, cards: [], rerolls: 0, replacing: null, t: 0, rt: 0, msg: '', msgT: 0 };
    C.off.cards = C.makeOffer(mode);
    G.Snd.play('flip');
  };

  function msg(t) { C.off.msg = t; C.off.msgT = 1800; }

  function close() {
    var O = C.off;
    if (O.mode === 'level') G.pendingLevels = Math.max(0, G.pendingLevels - 1);
    C.off = null; G.state = 'play'; G.input.lock = 200;
  }

  function finish(res, id) {
    var d = C.def(id), p = G.player;
    C.recalc(true);
    if (id === 'heart') G.Player.heal(p, 30);
    if (res.fused) {
      var s = C.slotOf(id);
      G.Hud.banner('¡FUSIÓN! ' + d.name + ' Nv' + s.lvl, 1600, '#ffd24a');
      G.Snd.play('fuse'); G.fx.ring(p.x, p.y, 8, 70, 400, '#ffd24a', 5); G.fx.burst(p.x, p.y, 18, '#ffd24a', 200, 600, 4, { add: true });
    } else { G.sfx('card_select', { vol: 0.6 }); }
    close();
  }

  C.pick = function (i) {
    var O = C.off, id = O.cards[i]; if (!id) return;
    if (C.slotOf(id) || C.count() < SLOTS) { finish(C.add(id), id); return; }
    O.replacing = id; G.Snd.play('flip'); msg('Mano llena: elige el slot a reemplazar (1-5 o clic). Esc cancela.');
  };
  C.replace = function (slot) {
    var O = C.off, h = hand(), id = O.replacing; if (!id || !h[slot]) return;
    h[slot] = null; G.player.ash += 10; G.Snd.play('discard');
    O.replacing = null; finish(C.add(id), id);
  };
  C.discard = function (slot) {
    var h = hand(); if (!h[slot]) return;
    h[slot] = null; G.player.ash += 10; G.Snd.play('discard'); C.recalc(false);
    G.fx.num(G.player.x, G.player.y - 30, '+10 Ceniza', '#ff9a3c');
    msg('Carta descartada: +10 Ceniza.');
    if (C.off.replacing) { var id = C.off.replacing; C.off.replacing = null; finish(C.add(id), id); }
  };
  // Omitir: sin penalización, +B.skipAsh Ceniza. Solo en subidas de nivel (la elección inicial es obligatoria). close() consume 1 subida pendiente.
  C.skip = function () {
    var O = C.off; if (!O || O.mode !== 'level') return;
    G.player.ash += G.B.skipAsh; G.Snd.play('discard');
    G.fx.num(G.player.x, G.player.y - 30, '+' + G.B.skipAsh + ' Ceniza', '#ff9a3c');
    close();
  };
  C.reroll = function () {
    var O = C.off, cost = C.rerollCost(), p = G.player;
    if (p.ash < cost) { msg('Ceniza insuficiente (' + cost + ').'); return; }
    p.ash -= cost; O.rerolls++; O.cards = C.makeOffer(O.mode); O.rt = 0; O.replacing = null; G.Snd.play('reroll');
  };

  // ------------------------------------------------------------- Geometría
  var OFF = { w: 220, h: 252, gap: 22, y: 52 };
  C.offerRect = function (i) { var x0 = (G.W - (3 * OFF.w + 2 * OFF.gap)) / 2; return { x: x0 + i * (OFF.w + OFF.gap), y: OFF.y, w: OFF.w, h: OFF.h }; };
  C.slotRect = function (i, big) {
    if (big === 'end') return { x: 202 + i * 114, y: 176, w: 100, h: 132 };
    if (big) return { x: 110 + i * 86, y: 350, w: 76, h: 100 };
    return { x: 280 + i * 82, y: 428, w: 72, h: 96 };
  };
  C.skipRect = { x: 580, y: 440, w: 250, h: 26 };
  C.rerollRect = { x: 580, y: 360, w: 250, h: 46 };
  function inR(r, m) { return m.x >= r.x && m.x <= r.x + r.w && m.y >= r.y && m.y <= r.y + r.h; }

  C.update = function (dt) {
    var O = C.off, inp = G.input, m = inp.mouse, i;
    if (!O) { G.state = 'play'; return; }
    O.t += dt; O.rt += dt; if (O.msgT > 0) O.msgT -= dt;
    if (O.t < 250) return;
    var shift = inp.held('ShiftLeft', 'ShiftRight');
    if (O.replacing) {
      if (inp.hit('Escape')) { O.replacing = null; msg(''); return; }
      for (i = 0; i < SLOTS; i++) {
        if (inp.hit('Digit' + (i + 1), 'Numpad' + (i + 1)) || (inp.hit('Mouse0') && inR(C.slotRect(i, true), m))) { C.replace(i); return; }
      }
      return;
    }
    for (i = 0; i < SLOTS; i++) {
      if (shift && inp.hit('Digit' + (i + 1))) { C.discard(i); return; }
      if (inp.hit('Mouse2') && inR(C.slotRect(i, true), m)) { C.discard(i); return; }
    }
    if (O.mode === 'level' && (inp.hit('Digit4', 'Numpad4', 'Space') || (inp.hit('Mouse0') && inR(C.skipRect, m)))) { C.skip(); return; }
    if (inp.hit('KeyR') || (inp.hit('Mouse0') && inR(C.rerollRect, m))) { C.reroll(); return; }
    for (i = 0; i < O.cards.length; i++) {
      if (!shift && inp.hit('Digit' + (i + 1), 'Numpad' + (i + 1))) { C.pick(i); return; }
      if (inp.hit('Mouse0') && inR(C.offerRect(i), m)) { C.pick(i); return; }
    }
  };

  // ------------------------------------------------------------- Iconos
  function glyph(c, name, cx, cy, s, col) {
    c.save(); c.translate(cx, cy); c.lineJoin = 'round'; c.lineCap = 'round';
    c.fillStyle = col; c.strokeStyle = '#0c0814'; c.lineWidth = Math.max(1.5, s * 0.12);
    var t = G.time / 1000;
    function fs() { c.fill(); c.stroke(); }
    switch (name) {
      case 'flame': case 'mantle':
        c.beginPath(); c.moveTo(0, -s); c.bezierCurveTo(s * 0.3, -s * 0.5, s * 0.85, -s * 0.2, s * 0.65, s * 0.4); c.bezierCurveTo(s * 0.5, s * 0.95, -s * 0.5, s * 0.95, -s * 0.65, s * 0.4);
        c.bezierCurveTo(-s * 0.8, -s * 0.1, -s * 0.2, -s * 0.4, 0, -s); fs();
        c.fillStyle = '#ffe9a0'; c.beginPath(); c.moveTo(0, -s * 0.1); c.bezierCurveTo(s * 0.4, s * 0.3, s * 0.3, s * 0.75, 0, s * 0.75); c.bezierCurveTo(-s * 0.3, s * 0.75, -s * 0.4, s * 0.3, 0, -s * 0.1); c.fill(); break;
      case 'burst':
        c.beginPath(); for (var i = 0; i < 16; i++) { var r = i % 2 ? s * 0.5 : s, a = i * Math.PI / 8; c.lineTo(Math.cos(a) * r, Math.sin(a) * r); } c.closePath(); fs();
        c.fillStyle = '#ffe9a0'; c.beginPath(); c.arc(0, 0, s * 0.3, 0, 6.283); c.fill(); break;
      case 'ring':
        c.lineWidth = s * 0.2; c.strokeStyle = col; c.globalAlpha = 0.5; c.beginPath(); c.arc(0, 0, s * 0.7, 0, 6.283); c.stroke(); c.globalAlpha = 1;
        for (var k = 0; k < 2; k++) { var aa = t * 3 + k * Math.PI; c.fillStyle = col; c.strokeStyle = '#0c0814'; c.lineWidth = 1.5; c.beginPath(); c.arc(Math.cos(aa) * s * 0.7, Math.sin(aa) * s * 0.7, s * 0.28, 0, 6.283); fs(); } break;
      case 'flake': case 'snow': case 'nova':
        c.strokeStyle = col; c.lineWidth = s * 0.16;
        for (var q = 0; q < 3; q++) { var an = q * Math.PI / 3 + (name === 'snow' ? t : 0); c.beginPath(); c.moveTo(Math.cos(an) * s, Math.sin(an) * s); c.lineTo(-Math.cos(an) * s, -Math.sin(an) * s); c.stroke(); }
        c.fillStyle = '#eaf8ff'; c.beginPath(); c.arc(0, 0, s * 0.22, 0, 6.283); c.fill();
        if (name === 'nova') { c.strokeStyle = col; c.lineWidth = 2; c.globalAlpha = 0.6; c.beginPath(); c.arc(0, 0, s * 1.05, 0, 6.283); c.stroke(); } break;
      case 'bolt': case 'bell':
        if (name === 'bell') { c.beginPath(); c.moveTo(-s * 0.7, s * 0.5); c.quadraticCurveTo(-s * 0.7, -s * 0.8, 0, -s * 0.8); c.quadraticCurveTo(s * 0.7, -s * 0.8, s * 0.7, s * 0.5); c.closePath(); fs(); c.fillStyle = '#fff6a8'; c.beginPath(); c.arc(0, s * 0.75, s * 0.2, 0, 6.283); c.fill(); break; }
        c.beginPath(); c.moveTo(s * 0.25, -s); c.lineTo(-s * 0.55, s * 0.15); c.lineTo(-s * 0.05, s * 0.15); c.lineTo(-s * 0.3, s); c.lineTo(s * 0.6, -s * 0.25); c.lineTo(s * 0.05, -s * 0.25); c.closePath(); fs(); break;
      case 'storm':
        c.fillStyle = '#8a8fa8'; c.beginPath(); c.arc(-s * 0.35, -s * 0.35, s * 0.4, 0, 6.283); c.arc(s * 0.15, -s * 0.5, s * 0.5, 0, 6.283); c.arc(s * 0.5, -s * 0.15, s * 0.35, 0, 6.283); fs();
        c.fillStyle = col; c.beginPath(); c.moveTo(s * 0.2, -s * 0.1); c.lineTo(-s * 0.35, s * 0.4); c.lineTo(0, s * 0.4); c.lineTo(-s * 0.2, s); c.lineTo(s * 0.4, s * 0.15); c.lineTo(s * 0.05, s * 0.15); c.closePath(); fs(); break;
      case 'drop': case 'flask':
        if (name === 'flask') { c.beginPath(); c.moveTo(-s * 0.2, -s); c.lineTo(s * 0.2, -s); c.lineTo(s * 0.2, -s * 0.3); c.lineTo(s * 0.7, s * 0.7); c.lineTo(-s * 0.7, s * 0.7); c.lineTo(-s * 0.2, -s * 0.3); c.closePath(); fs(); break; }
        c.beginPath(); c.moveTo(0, -s); c.bezierCurveTo(s * 0.9, s * 0.1, s * 0.6, s * 0.9, 0, s * 0.9); c.bezierCurveTo(-s * 0.6, s * 0.9, -s * 0.9, s * 0.1, 0, -s); fs();
        c.fillStyle = 'rgba(255,255,255,0.5)'; c.beginPath(); c.arc(-s * 0.25, s * 0.25, s * 0.15, 0, 6.283); c.fill(); break;
      case 'heart':
        c.beginPath(); c.moveTo(0, s * 0.85); c.bezierCurveTo(-s * 1.2, s * 0.1, -s * 0.7, -s * 0.9, 0, -s * 0.3); c.bezierCurveTo(s * 0.7, -s * 0.9, s * 1.2, s * 0.1, 0, s * 0.85); fs(); break;
      case 'dart':
        c.beginPath(); c.moveTo(s, 0); c.lineTo(-s * 0.6, -s * 0.5); c.lineTo(-s * 0.3, 0); c.lineTo(-s * 0.6, s * 0.5); c.closePath(); c.rotate(-0.6); fs(); break;
      case 'pool':
        c.beginPath(); c.ellipse(0, s * 0.2, s, s * 0.55, 0, 0, 6.283); fs();
        c.fillStyle = '#c8ff9a'; for (var b = 0; b < 3; b++) { c.beginPath(); c.arc(-s * 0.4 + b * s * 0.4, s * 0.1 - ((t * 20 + b * 7) % 10), s * 0.14, 0, 6.283); c.fill(); } break;
      case 'cloud':
        c.beginPath(); c.arc(-s * 0.45, s * 0.1, s * 0.42, 0, 6.283); c.arc(0, -s * 0.25, s * 0.55, 0, 6.283); c.arc(s * 0.5, s * 0.15, s * 0.4, 0, 6.283); fs();
        c.fillRect(-s * 0.45, s * 0.1, s * 0.95, s * 0.42); break;
      case 'fang':
        c.beginPath(); c.moveTo(-s * 0.6, -s * 0.8); c.quadraticCurveTo(s * 0.7, -s * 0.7, s * 0.25, s); c.quadraticCurveTo(-s * 0.1, -s * 0.05, -s * 0.6, -s * 0.8); fs(); break;
      case 'dagger': case 'whet':
        c.rotate(0.7); c.beginPath(); c.moveTo(0, -s); c.lineTo(s * 0.22, s * 0.25); c.lineTo(-s * 0.22, s * 0.25); c.closePath(); c.fillStyle = '#e6ecf5'; fs();
        c.fillStyle = '#7a5a3a'; c.fillRect(-s * 0.45, s * 0.25, s * 0.9, s * 0.16); c.fillRect(-s * 0.1, s * 0.4, s * 0.2, s * 0.5); break;
      case 'axe':
        c.rotate(0.5); c.fillStyle = '#7a5a3a'; c.fillRect(-s * 0.08, -s, s * 0.16, s * 2);
        c.fillStyle = '#c9d2de'; c.beginPath(); c.moveTo(s * 0.08, -s * 0.9); c.quadraticCurveTo(s * 1.0, -s * 0.6, s * 0.8, s * 0.1); c.lineTo(s * 0.08, -s * 0.1); c.closePath(); fs(); break;
      case 'shield':
        c.beginPath(); c.moveTo(0, -s); c.lineTo(s * 0.8, -s * 0.6); c.lineTo(s * 0.7, s * 0.3); c.lineTo(0, s); c.lineTo(-s * 0.7, s * 0.3); c.lineTo(-s * 0.8, -s * 0.6); c.closePath(); fs();
        c.fillStyle = '#eef2f8'; c.beginPath(); c.moveTo(0, -s * 0.55); c.lineTo(s * 0.3, s * 0.1); c.lineTo(-s * 0.3, s * 0.1); c.closePath(); c.fill(); break;
      case 'hourglass':
        c.beginPath(); c.moveTo(-s * 0.6, -s); c.lineTo(s * 0.6, -s); c.lineTo(0, 0); c.lineTo(s * 0.6, s); c.lineTo(-s * 0.6, s); c.lineTo(0, 0); c.closePath(); fs();
        c.fillStyle = '#f0d890'; c.beginPath(); c.moveTo(-s * 0.3, s * 0.85); c.lineTo(s * 0.3, s * 0.85); c.lineTo(0, s * 0.3); c.fill(); break;
      case 'boots':
        for (var z = 0; z < 2; z++) { c.beginPath(); c.moveTo(-s * 0.7 + z * s * 0.5, -s * 0.7); c.lineTo(s * 0.1 + z * s * 0.5, 0); c.lineTo(-s * 0.7 + z * s * 0.5, s * 0.7); c.lineWidth = s * 0.28; c.strokeStyle = col; c.stroke(); } break;
      case 'magnet':
        c.lineWidth = s * 0.4; c.strokeStyle = '#d04050'; c.beginPath(); c.arc(0, s * 0.1, s * 0.6, Math.PI, 0); c.lineTo(s * 0.6, s * 0.8); c.moveTo(-s * 0.6, s * 0.1); c.lineTo(-s * 0.6, s * 0.8); c.stroke();
        c.strokeStyle = '#e8e8f0'; c.beginPath(); c.moveTo(-s * 0.6, s * 0.8); c.lineTo(-s * 0.6, s * 0.55); c.moveTo(s * 0.6, s * 0.8); c.lineTo(s * 0.6, s * 0.55); c.stroke(); break;
      case 'bag':
        c.beginPath(); c.moveTo(-s * 0.3, -s * 0.8); c.lineTo(s * 0.3, -s * 0.8); c.quadraticCurveTo(s * 0.4, -s * 0.3, s * 0.8, s * 0.3); c.quadraticCurveTo(s * 0.8, s, 0, s); c.quadraticCurveTo(-s * 0.8, s, -s * 0.8, s * 0.3); c.quadraticCurveTo(-s * 0.4, -s * 0.3, -s * 0.3, -s * 0.8); fs();
        c.fillStyle = '#ffd27a'; c.beginPath(); c.arc(0, s * 0.35, s * 0.25, 0, 6.283); c.fill(); break;
      default: c.beginPath(); c.arc(0, 0, s * 0.7, 0, 6.283); fs();
    }
    c.restore();
  }
  C.glyph = glyph;

  // Carta completa. slot: {id,lvl,cd,cdMax,flash} o {id,lvl} ; o: {key, glow, dim, big}
  C.drawCard = function (c, slot, x, y, w, h, o) {
    o = o || {};
    var d = C.def(slot.id), tc = G.TAGS[d.tag].color, f = w / 72, t = G.time / 1000;
    c.save();
    // sombra y fondo
    c.fillStyle = 'rgba(0,0,0,0.5)'; c.fillRect(x + 3, y + 4, w, h);
    var g = c.createLinearGradient(x, y, x, y + h); g.addColorStop(0, '#2a1d3a'); g.addColorStop(1, '#130d1c');
    c.fillStyle = g; c.fillRect(x, y, w, h);
    c.globalAlpha = 0.22; c.fillStyle = tc; c.fillRect(x, y, w, h * 0.3); c.globalAlpha = 1;
    var gold = slot.lvl >= 3;
    if (o.glow) { c.shadowColor = o.glow; c.shadowBlur = 14 + 6 * Math.sin(t * 8); }
    c.strokeStyle = gold ? '#ffd24a' : tc; c.lineWidth = gold ? 4 : 3; c.strokeRect(x + 1.5, y + 1.5, w - 3, h - 3);
    c.shadowBlur = 0;
    // icono
    var gy = y + h * 0.42;
    c.fillStyle = 'rgba(0,0,0,0.35)'; c.beginPath(); c.arc(x + w / 2, gy, w * 0.33, 0, 6.283); c.fill();
    glyph(c, d.icon, x + w / 2, gy, w * 0.24, tc);
    if (d.type === 'passive') { c.fillStyle = '#ffd24a'; c.fillRect(x + w - 15 * f, gy + w * 0.14, 9 * f, 3 * f); c.fillRect(x + w - 12 * f, gy + w * 0.14 - 3 * f, 3 * f, 9 * f); }
    if (ORB[d.id] || d.kind === 'aura') { c.strokeStyle = tc; c.globalAlpha = 0.7; c.lineWidth = 2; c.setLineDash([4, 5]); c.lineDashOffset = -t * 20; c.beginPath(); c.arc(x + w / 2, gy, w * 0.37, 0, 6.283); c.stroke(); c.setLineDash([]); c.globalAlpha = 1; }
    // etiqueta (punto de color) y estrellas de nivel
    c.fillStyle = tc; c.strokeStyle = '#0c0814'; c.lineWidth = 1.5; c.beginPath(); c.arc(x + 9 * f, y + 9 * f, 5 * f, 0, 6.283); c.fill(); c.stroke();
    for (var i = 0; i < slot.lvl; i++) {
      var sx = x + w - 9 * f - i * 9 * f, sy = y + 9 * f;
      c.fillStyle = gold ? '#ffd24a' : '#e8dcc0'; c.beginPath();
      for (var k = 0; k < 10; k++) { var r = k % 2 ? 2.2 * f : 4.6 * f, a = -Math.PI / 2 + k * Math.PI / 5; c.lineTo(sx + Math.cos(a) * r, sy + Math.sin(a) * r); }
      c.closePath(); c.fill();
    }
    // nombre
    G.txt(c, d.short, x + w / 2, y + h - 11 * f, Math.round(10 * f), '#fff', 'center');
    // cooldown (barrido)
    if (!o.nocd && d.type === 'attack' && slot.cdMax && !ORB[d.id] && d.kind !== 'aura' && slot.cd > 0) {
      var fr = G.clamp(slot.cd / slot.cdMax, 0, 1);
      c.save(); c.beginPath(); c.rect(x, y, w, h); c.clip();
      c.fillStyle = 'rgba(8,4,14,0.62)'; c.beginPath(); c.moveTo(x + w / 2, gy); c.arc(x + w / 2, gy, w * 1.2, -Math.PI / 2, -Math.PI / 2 + 6.283 * fr); c.closePath(); c.fill();
      c.restore();
    }
    if (slot.flash > 0) { c.fillStyle = 'rgba(255,255,255,' + 0.5 * slot.flash / 140 + ')'; c.fillRect(x, y, w, h); }
    if (o.dim) { c.fillStyle = 'rgba(8,4,14,0.55)'; c.fillRect(x, y, w, h); }
    if (o.key) { G.txt(c, o.key, x + 8 * f, y + h - 28 * f, Math.round(11 * f), '#ffd27a', 'center'); }
    c.restore();
  };

  C.drawEmptySlot = function (c, x, y, w, h, key) {
    c.save(); c.fillStyle = 'rgba(12,8,20,0.55)'; c.fillRect(x, y, w, h);
    c.strokeStyle = 'rgba(160,140,190,0.35)'; c.lineWidth = 2; c.setLineDash([5, 5]); c.strokeRect(x + 1.5, y + 1.5, w - 3, h - 3); c.setLineDash([]);
    if (key) G.txt(c, key, x + w / 2, y + h / 2, 16, 'rgba(180,160,210,0.5)', 'center');
    c.restore();
  };

  // Línea brillante entre las cartas de cada combo activo (slotRect elegido por el llamador)
  C.drawComboLines = function (c, big) {
    var h = hand(), t = G.time / 1000, n = 0;
    C.combos.forEach(function (cb) {
      if (!C.active[cb.k]) return;
      var ia = -1, ib = -1, i;
      for (i = 0; i < h.length; i++) if (h[i]) { var tg = C.def(h[i].id).tag; if (tg === cb.a && ia < 0) ia = i; if (tg === cb.b && ib < 0) ib = i; }
      if (ia < 0 || ib < 0) return;
      var ra = C.slotRect(ia, big), rb = C.slotRect(ib, big);
      var x1 = ra.x + ra.w / 2, y1 = ra.y, x2 = rb.x + rb.w / 2, y2 = rb.y, lift = big === 'end' ? 8 + Math.abs(ia - ib) * 3 + n * 3 : Math.min(big ? 30 : 70, 12 + Math.abs(ia - ib) * 6 + n * 3);
      var fl = (C.flash[cb.k] || 0) / 1800;
      var gr = c.createLinearGradient(x1, 0, x2 + 0.01, 0); gr.addColorStop(0, G.TAGS[cb.a].color); gr.addColorStop(1, G.TAGS[cb.b].color);
      c.save(); c.lineCap = 'round';
      c.globalCompositeOperation = 'lighter'; c.strokeStyle = gr; c.globalAlpha = 0.35 + 0.35 * fl; c.lineWidth = 9 + 6 * fl;
      c.beginPath(); c.moveTo(x1, y1); c.quadraticCurveTo((x1 + x2) / 2, y1 - lift * 2, x2, y2); c.stroke();
      c.globalAlpha = 1; c.lineWidth = 3; c.stroke();
      c.strokeStyle = '#fff'; c.lineWidth = 1.2; c.setLineDash([6, 8]); c.lineDashOffset = -t * 60; c.stroke(); c.setLineDash([]);
      c.restore();
      n++;
    });
  };

  function wrap(c, text, maxW, size) {
    c.font = 'bold ' + size + 'px "Courier New", monospace';
    var words = text.split(' '), lines = [], line = '';
    for (var i = 0; i < words.length; i++) {
      var tst = line ? line + ' ' + words[i] : words[i];
      if (c.measureText(tst).width > maxW && line) { lines.push(line); line = words[i]; } else line = tst;
    }
    if (line) lines.push(line);
    return lines;
  }

  // ------------------------------------------------------------- Pantalla de oferta
  C.draw = function (c) {
    var O = C.off; if (!O) return;
    var p = G.player, m = G.input.mouse, i, k;
    c.save();
    c.fillStyle = 'rgba(8,4,14,0.82)'; c.fillRect(0, 0, G.W, G.H);
    var title = O.mode === 'start' ? 'ELIGE TU PRIMERA CARTA' : '¡NIVEL ' + p.level + '!  ELIGE UNA CARTA';
    G.txt(c, title, G.W / 2, 28, 26, '#ffd27a', 'center');
    var hoverIdx = -1;
    for (i = 0; i < O.cards.length; i++) if (inR(C.offerRect(i), m) && !O.replacing) hoverIdx = i;
    // tags de la mano que se iluminarían con la carta señalada
    var hi = {};
    for (i = 0; i < O.cards.length; i++) {
      if (hoverIdx >= 0 && i !== hoverIdx) continue;
      var dd = C.def(O.cards[i]); C.newCombos(dd.tag).forEach(function (cb) { hi[cb.a === dd.tag ? cb.b : cb.a] = cb; });
    }
    for (i = 0; i < O.cards.length; i++) {
      var d = C.def(O.cards[i]), r = C.offerRect(i), tc = G.TAGS[d.tag].color, hov = i === hoverIdx;
      var u = G.clamp((O.rt - i * 110) / 260, 0, 1); if (u <= 0) continue;
      var owned = C.slotOf(d.id), y = r.y + (hov ? -8 : 0), nc = C.newCombos(d.tag);
      c.save(); c.translate(r.x + r.w / 2, y + r.h / 2); c.scale(u, 1); c.translate(-r.w / 2, -r.h / 2);
      c.fillStyle = 'rgba(0,0,0,0.5)'; c.fillRect(4, 5, r.w, r.h);
      var gg = c.createLinearGradient(0, 0, 0, r.h); gg.addColorStop(0, hov ? '#35254a' : '#2a1d3a'); gg.addColorStop(1, '#130d1c');
      c.fillStyle = gg; c.fillRect(0, 0, r.w, r.h);
      c.globalAlpha = 0.25; c.fillStyle = tc; c.fillRect(0, 0, r.w, 32); c.globalAlpha = 1;
      if (nc.length) { c.shadowColor = '#ffe9a0'; c.shadowBlur = 16 + 6 * Math.sin(G.time / 120); }
      c.strokeStyle = tc; c.lineWidth = hov ? 5 : 3; c.strokeRect(1.5, 1.5, r.w - 3, r.h - 3); c.shadowBlur = 0;
      G.txt(c, G.TAGS[d.tag].name + '  -  ' + (d.type === 'attack' ? (ORB[d.id] || d.kind === 'aura' ? 'PERMANENTE' : 'ATAQUE') : 'PASIVA'), r.w / 2 + 10, 16, 12, tc, 'center');
      c.fillStyle = 'rgba(0,0,0,0.35)'; c.beginPath(); c.arc(r.w / 2, 78, 36, 0, 6.283); c.fill();
      glyph(c, d.icon, r.w / 2, 78, 26, tc);
      G.txt(c, d.name, r.w / 2, 128, 17, '#fff', 'center');
      var lines = wrap(c, d.desc, r.w - 22, 12);
      for (k = 0; k < lines.length && k < 4; k++) G.txt(c, lines[k], r.w / 2, 152 + k * 15, 12, '#d8cfe8', 'center');
      G.txt(c, '[' + (i + 1) + ']', 17, 16, 14, '#ffd27a', 'center');
      var by = r.h - 50;
      if (owned) {
        c.fillStyle = 'rgba(255,210,74,0.2)'; c.fillRect(22, by - 11, r.w - 44, 22);
        G.txt(c, 'FUSIÓN  Nv' + owned.lvl + ' > Nv' + (owned.lvl + 1), r.w / 2, by, 13, '#ffd24a', 'center');
      } else if (C.count() >= SLOTS) {
        G.txt(c, 'reemplaza un slot', r.w / 2, by, 12, '#9a8fb0', 'center');
      }
      if (nc.length) {
        c.fillStyle = 'rgba(255,233,160,' + (0.18 + 0.1 * Math.sin(G.time / 150)) + ')'; c.fillRect(6, r.h - 31, r.w - 12, 22);
        G.txt(c, 'COMBO: ' + nc[0].name, r.w / 2, r.h - 20, 13, '#ffe9a0', 'center');
      }
      c.restore();
    }
    // mano debajo
    var h = hand();
    G.txt(c, 'TU MANO', 110, 337, 13, '#9a8fb0', 'left');
    for (i = 0; i < SLOTS; i++) {
      var sr = C.slotRect(i, true);
      if (h[i]) {
        var tg = C.def(h[i].id).tag;
        C.drawCard(c, h[i], sr.x, sr.y, sr.w, sr.h, { nocd: true, key: String(i + 1), glow: hi[tg] ? '#ffe9a0' : (O.replacing && inR(sr, m) ? '#ff6a6a' : null) });
      } else C.drawEmptySlot(c, sr.x, sr.y, sr.w, sr.h, String(i + 1));
    }
    C.drawComboLines(c, true);
    // reroll
    var rr = C.rerollRect, cost = C.rerollCost(), can = p.ash >= cost, rh = inR(rr, m);
    c.fillStyle = can ? (rh ? '#d97a2a' : '#a85a1a') : '#3a2f3d'; c.fillRect(rr.x, rr.y, rr.w, rr.h);
    c.strokeStyle = can ? '#ffd27a' : '#6a5a70'; c.lineWidth = 3; c.strokeRect(rr.x, rr.y, rr.w, rr.h);
    G.txt(c, 'REROLL (R)  -  ' + cost + ' Ceniza', rr.x + rr.w / 2, rr.y + rr.h / 2, 16, can ? '#fff' : '#9a8fa0', 'center');
    G.txt(c, 'Ceniza: ' + p.ash, rr.x + rr.w / 2, rr.y + rr.h + 20, 16, '#ff9a3c', 'center');
    if (O.mode === 'level') {
      var sk = C.skipRect, sh = inR(sk, m);
      c.fillStyle = sh ? '#4a6a4a' : '#324a38'; c.fillRect(sk.x, sk.y, sk.w, sk.h);
      c.strokeStyle = '#9be59b'; c.lineWidth = 3; c.strokeRect(sk.x, sk.y, sk.w, sk.h);
      G.txt(c, 'OMITIR (4 / Espacio)  +' + G.B.skipAsh + ' Ceniza', sk.x + sk.w / 2, sk.y + sk.h / 2, 14, '#fff', 'center');
    }
    // ayuda
    G.txt(c, '1 / 2 / 3 o clic: elegir     4 / Espacio: omitir     R: reroll', G.W / 2, 474, 13, '#d8cfe8', 'center');
    G.txt(c, 'Descartar: Shift+1..5 o clic derecho en el slot (+10 Ceniza)', G.W / 2, 494, 13, '#d8cfe8', 'center');
    if (O.msgT > 0 && O.msg) G.txt(c, O.msg, G.W / 2, 522, 14, O.replacing ? '#ff8a8a' : '#ffd27a', 'center');
    c.restore();
  };
})();
