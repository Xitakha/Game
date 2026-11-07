/* fusion.js - PROTOTIPO v1 "Fusión" (ver games/card-swarm-fusion-DESIGN.md). G.Fusion.
   - Ataque básico automático del jugador (10 de daño cada 650 ms al enemigo más cercano) + INFUSIONES: las cartas de ataque de la mano mejoran el básico
     (+20 / +35 / +50 % por Nv de carta y un efecto de su etiqueta). Las cartas que no son proyectil (orbitales, auras, Bobina, Murciélago, Nova...) conservan
     además su arma original como AUXILIAR (más lenta y más débil: AUX.dmg / AUX.cd; ?aux=0 las apaga) y dan solo la mitad del bono al básico.
   - FUSIÓN: dos cartas de etiquetas distintas con receta = PODER ACTIVO (máx. 4 slots). 12 recetas (las 12 parejas de combos pasivos del original; 3 parejas sin receta).
     Se dispara a mano (botón táctil, Q / E / R / Espacio o 1-4) o en modo AUTO (F). Re-fusionar la misma receta = Nv2. La 1.ª fusión es ayudada: la carta inicial se conserva.
   - La interfaz de la oferta (modal "FUSIONAR YA / A LA MANO", botón FUSIONAR, chips de poderes) vive en cards.js y usa estas funciones.
   Parámetros URL: ?actives=vapor,plasma,forja2 (poderes de inicio; sufijo 2 = Nv2)  ?fuseAsh=<n>  ?bosscap=<frac>  ?cmul= (daño global)  ?aux=0  ?auxmul=<f>  ?auxcd=<f>. */
(function () {
  'use strict';
  var G = window.G, B = G.B, C = G.Cards, CB = G.Combat, W = G.Weapons, fx = G.fx, inp = G.input, F = G.Fusion = {};
  function qnum(name, def) { var m = new RegExp('[?&]' + name + '=([\\d.]+)').exec(location.search); return m ? parseFloat(m[1]) : def; }
  function A2() { return G.FusionArt2 || null; }

  var NS = 4;   // slots de poderes
  var P = F.P = { basicDmg: qnum('bdmg', 10), basicCd: qnum('bcd', 500), speed: 440, fuseAsh: qnum('fuseAsh', 0), replaceAsh: 20, bossCap: qnum('bosscap', 0.03), perTargetCap: 400, lvHeal: qnum('lvheal', 0.20), fuseHeal: qnum('fuseheal', 25), pmul: qnum('pmul', 3), pcd: qnum('pcd', 0.6), vpow: qnum('vpow', 2), pinf: qnum('pinf', 0.25), infmul: qnum('infmul', 0.7), vstep: qnum('vstep', 4), vmax: qnum('vmax', 3), vdmg: qnum('vdmg', 0.8), maxFields: 4, slots: NS };
  var AUX = F.AUX = { on: qnum('aux', 1) > 0, dmg: qnum('auxmul', 0.4), cd: qnum('auxcd', 1.5), bonus: 0.5 };
  var BONUS = [0.2, 0.35, 0.5];            // daño del básico por infusión según el Nv de la carta
  var RANGE = 440, uid = 0;
  var KEYS = ['KeyQ', 'KeyE', 'KeyR', 'Space'], KEYL = ['Q', 'E', 'R', '_'], DIGS = ['Digit1', 'Digit2', 'Digit3', 'Digit4'];

  // ------------------------------------------------------------- Pool: todas las cartas (el desbloqueo lo decide Loot.unlocked / la forja)
  F.inPool = function () { return true; };
  G.fusionAll = /[?&]all=1/.test(location.search);   // ?all=1: todas las cartas desbloqueadas (pruebas / bots con cuenta vacía)
  F.unlockedCard = function (id) { return !!C.def(id) && (G.fusionAll || G.Loot.unlocked(id)); };
  var INF_TXT = {
    fire: 'Quema (3 dps). Nv3: el impacto explota.', ice: 'Ralentiza 25 %. Nv3: congela 0,5 s la 1.ª vez.', lightning: 'Encadena 1 salto (-20 %). Nv3: 2 saltos.',
    poison: 'Aplica 1 stack de veneno (apila 3).', blood: '20 % de curar 1 HP al impactar. Nv3: sangrado.', steel: 'Atraviesa 1 enemigo y 10 % de crítico. Nv3: atraviesa 2.'
  };
  C.defs.forEach(function (d) {
    if (d.type === 'attack' && INF_TXT[d.tag]) {
      if (d.kind === 'proj') d.desc = '+20 % al básico. ' + INF_TXT[d.tag];
      else d.desc = '+10 % al básico. ' + INF_TXT[d.tag] + ' Arma propia al ' + Math.round(AUX.dmg * 100) + ' %.';
    }
    if (d.id === 'hourglass') d.desc = 'Cooldown de los poderes -6 % (tope global -25 %) y básico más rápido.';
  });

  // ------------------------------------------------------------- Recetas / poderes (2 niveles). desc = frase corta para la ventana de fusión. sfx = id de audio
  var R = F.recipes = [
    { id: 'vapor', name: 'Vapor', short: 'Vapor', a: 'fire', b: 'ice', color: '#bfeaff', kind: 'cloud', sfx: 'vapor',
      desc: 'Nube en el grupo más denso: ciega y ralentiza, con ticks de daño.',
      lv: [{ r: 90, dur: 4000, dmg: 6, cd: 14000 }, { r: 110, dur: 5000, dmg: 8, cd: 12000 }] },
    { id: 'plasma', name: 'Plasma', short: 'Plasma', a: 'fire', b: 'lightning', color: '#ffb347', kind: 'beam', sfx: 'plasma',
      desc: 'Rayo continuo perforante que gira 180 grados/s durante 2,5 s.',
      lv: [{ dur: 2500, w: 14, len: 260, dmg: 10, cd: 12000 }, { dur: 3500, w: 20, len: 260, dmg: 12, cd: 12000 }] },
    { id: 'gas', name: 'Gas inflamable', short: 'Gas', a: 'fire', b: 'poison', color: '#9bff5a', kind: 'gas', sfx: 'gas',
      desc: 'Granada de gas venenoso; al acabar la nube detona.',
      lv: [{ r: 80, dur: 5000, det: 45, cd: 13000 }, { r: 100, dur: 5000, det: 70, perStack: 6, cd: 13000 }] },
    { id: 'sed', name: 'Sed de hierro', short: 'Sed', a: 'blood', b: 'steel', color: '#d02048', kind: 'orbit', sfx: 'sed',
      desc: '3 dagas orbitan 6 s, tu básico dispara +40 % y cada 5 golpes curas 1 HP.',
      lv: [{ dur: 6000, dmg: 8, heal: 6, cd: 18000 }, { dur: 8000, dmg: 8, heal: 10, cd: 18000 }] },
    { id: 'tormenta', name: 'Tormenta de escarcha', short: 'Tormenta', a: 'ice', b: 'lightning', color: '#8fe0ff', kind: 'storm', sfx: 'tormenta',
      desc: 'Zona que te sigue: cada 0,5 s cae un rayo (x1,5 sobre ralentizados) y aturde.',
      lv: [{ r: 110, dur: 5000, dmg: 18, cd: 15000 }, { r: 130, dur: 7000, dmg: 24, cd: 15000 }] },
    { id: 'escarcha', name: 'Escarcha tóxica', short: 'Tóxica', a: 'ice', b: 'poison', color: '#a8e86a', kind: 'spores', sfx: 'toxica',
      desc: '3 esporas heladas explotan: ralentizan, envenenan (+3 s) y el veneno salta al morir.',
      lv: [{ n: 3, dmg: 14, stacks: 2, r: 50, cd: 12000 }, { n: 5, dmg: 18, stacks: 2, r: 50, cd: 12000 }] },
    { id: 'pacto', name: 'Pacto ardiente', short: 'Pacto', a: 'blood', b: 'fire', color: '#ff4a2a', kind: 'pact', sfx: 'pacto',
      desc: 'Pagas 12 % de tu vida (nunca bajas de 20) y estallas en nova; +25 % de daño 6 s.',
      lv: [{ pay: 0.12, dmg: 30, mul: 0.8, r: 120, dur: 6000, cd: 16000 }, { pay: 0.10, dmg: 45, mul: 0.8, r: 120, dur: 8000, cd: 16000 }] },
    { id: 'iman', name: 'Imán', short: 'Imán', a: 'steel', b: 'lightning', color: '#b0b8ff', kind: 'magnet', sfx: 'iman',
      desc: 'Tira de los enemigos pequeños, destruye flechas y descarga una cadena.',
      lv: [{ r: 150, pull: 1200, dur: 3000, jumps: 3, dmg: 20, cd: 14000 }, { r: 190, pull: 1800, dur: 3000, jumps: 5, dmg: 20, cd: 14000 }] },
    { id: 'forja', name: 'Forja', short: 'Forja', a: 'fire', b: 'steel', color: '#ff8a2a', kind: 'axe', sfx: 'forja',
      desc: 'Hacha incandescente gigante, ida y vuelta: perfora, ignora el escudo frontal y rompe placas.',
      lv: [{ n: 1, dmg: 35, dur: 3000, cd: 11000 }, { n: 2, dmg: 45, dur: 3000, cd: 11000 }] },
    { id: 'filo', name: 'Filo gélido', short: 'Filo', a: 'ice', b: 'steel', color: '#bfefff', kind: 'fan', sfx: 'filo',
      desc: 'Abanico de 7 lanzas de hielo; crítico x2 contra ralentizados.',
      lv: [{ n: 7, dmg: 16, range: 220, cd: 10000 }, { n: 12, dmg: 20, range: 220, cd: 10000 }] },
    { id: 'hemo', name: 'Hemotoxina', short: 'Hemotox.', a: 'blood', b: 'poison', color: '#b0206a', kind: 'mark', sfx: 'hemo',
      desc: 'Marca hasta 6 enemigos: sangrado + veneno; al morir curan y propagan el veneno.',
      lv: [{ n: 6, dur: 6000, heal: 2, cd: 13000 }, { n: 9, dur: 6000, heal: 3, cd: 13000 }] },
    { id: 'descarga', name: 'Descarga tóxica', short: 'Descarga', a: 'poison', b: 'lightning', color: '#c8ff4a', kind: 'discharge', sfx: 'descarga',
      desc: 'Rayo sobre todos los envenenados visibles: consume el veneno (8 por stack).',
      lv: [{ base: 12, per: 8, cd: 12000 }, { base: 12, per: 12, cd: 12000 }] }
  ];
  var RBY = {}, RKEY = {};
  R.forEach(function (r) { RBY[r.id] = r; RKEY[[r.a, r.b].sort().join('+')] = r; });
  F.onLevel = function () {   // sostén: el original curaba ~200-400 PV por partida con los combos pasivos Pacto / Sangre envenenada; aquí, cura al subir de nivel
    var p = G.player; if (p.dead || P.lvHeal <= 0) return;
    G.Player.heal(p, Math.round(p.maxHp * P.lvHeal), 'nivel');
  };
  F.recipe = function (id) { return RBY[id]; };
  F.recipeFor = function (t1, t2) { return RKEY[[t1, t2].sort().join('+')] || null; };
  // C.combos (solo informativo para la Base / Archivo: ya no se activan como pasivos)
  C.combos = R.map(function (r, i) { return { k: r.id, name: r.name.toUpperCase(), a: r.a, b: r.b, desc: r.desc, pitch: 0.8 + (i % 6) * 0.1 }; });

  // ------------------------------------------------------------- Sonido (con throttle) y arte (con fallback)
  var sndT = {};
  function snd(name, ms, pitch) {
    var n = performance.now(); if (ms && n - (sndT[name] || 0) < ms) return; sndT[name] = n;
    try { G.Snd.play(name, pitch || 1); } catch (e) { /* audio */ }
  }
  function sfx(r, kind, ms, pitch) { snd('fx_' + r.sfx + (kind ? '_' + kind : ''), ms || 0, pitch); }
  function sfxFallback(r, kind, fb) { var n = 'fx_' + r.sfx + '_' + kind; if (G.Snd.V && G.Snd.V[n]) snd(n, 0); else snd(fb, 0); }
  function art(fn) { var a = A2(); if (a && a[fn]) { var args = Array.prototype.slice.call(arguments, 1); a[fn].apply(a, args); return true; } return false; }

  // ------------------------------------------------------------- Estado
  F.fused = 0; F.auto = false; F.fields = []; F.fxs = []; F.timers = []; F.axes = []; F.stats = { fusions: [], uses: {}, dmg: {}, firstFusionT: null, basicShots: 0 };
  var bT = 300, hitN = 0;
  function hand() { return G.player.hand; }
  F.reset = function () {
    var p = G.player; p.actives = []; for (var i = 0; i < NS; i++) p.actives.push(null);
    F.fused = 0; F.auto = false; F.fields = []; F.fxs = []; F.timers = []; F.axes = []; bT = 300; hitN = 0;
    F.stats = { fusions: [], uses: {}, dmg: {}, firstFusionT: null, basicShots: 0 };
    var u = /[?&]actives=([\w,]+)/.exec(location.search);
    if (u) u[1].split(',').slice(0, NS).forEach(function (k) { var m = /^([a-z]+?)(2)?$/.exec(k); if (m && RBY[m[1]]) F.grant(m[1], m[2] ? 2 : 1); });
  };
  F.grant = function (id, lvl) {   // prueba / ?actives=: da un poder sin fusionar
    var p = G.player, i = p.actives.indexOf(null); if (i < 0) i = NS - 1; var r = RBY[id];
    p.actives[i] = newSlot(r, lvl || 1);
  };
  function newSlot(r, lvl) { var L = r.lv[lvl - 1]; return { id: r.id, lvl: lvl, cd: Math.min(3000, L.cd), cdMax: L.cd, flash: 0, st: null, use: {}, dmg: 0, uses: 0, readyT: 0, used: false, press: 0 }; }
  F.activeCount = function () { var n = 0; G.player.actives.forEach(function (a) { if (a) n++; }); return n; };
  function activeOf(id) { var a = G.player.actives; for (var i = 0; i < NS; i++) if (a[i] && a[i].id === id) return i; return -1; }
  function canUse(r) { var i = activeOf(r.id); return !(i >= 0 && G.player.actives[i].lvl >= 2); }

  // ------------------------------------------------------------- Opciones de fusión desde la mano
  F.optionsFor = function (tag) {   // recetas que completa una carta ofrecida de esta etiqueta con una carta de ataque de la mano
    var h = hand(), out = [], seen = {};
    for (var i = 0; i < h.length; i++) {
      var s = h[i]; if (!s) continue;
      var d = C.def(s.id); if (d.type !== 'attack' || d.tag === tag) continue;
      var r = F.recipeFor(tag, d.tag);
      if (r && canUse(r) && !seen[r.id]) { seen[r.id] = 1; out.push({ recipe: r, slot: i }); }
    }
    return out;
  };
  F.handPairs = function () {
    var h = hand(), out = [], seen = {};
    for (var i = 0; i < h.length; i++) for (var j = i + 1; j < h.length; j++) {
      if (!h[i] || !h[j]) continue;
      var a = C.def(h[i].id), b = C.def(h[j].id); if (a.type !== 'attack' || b.type !== 'attack' || a.tag === b.tag) continue;
      var r = F.recipeFor(a.tag, b.tag);
      if (r && canUse(r) && !seen[r.id]) { seen[r.id] = 1; out.push({ recipe: r, slot: i, slot2: j }); }
    }
    return out;
  };

  // Fusiona. slotA: carta de la mano; slotB: segunda carta de la mano (o null si la segunda es la carta ofrecida offeredId). done() al terminar.
  F.fuse = function (r, slotA, slotB, offeredId, done) {
    var h = hand(), p = G.player;
    function finish(replaceIdx) {
      var ex = activeOf(r.id), free = p.actives.indexOf(null), lvlUp = false;
      if (P.fuseAsh > 0) { if (p.ash < P.fuseAsh) { C.msg('Necesitas ' + P.fuseAsh + ' Ceniza para fusionar.'); return; } p.ash -= P.fuseAsh; }
      // cartas que se consumen: 1.ª fusión ayudada = la carta inicial se conserva; después se consumen las dos
      var drop = [];
      if (offeredId) { if (F.fused > 0) drop.push(slotA); }
      else { [slotA, slotB].forEach(function (k) { if (!(F.fused === 0 && h[k].starter)) drop.push(k); }); }
      drop.forEach(function (k) { h[k] = null; });
      if (ex >= 0) { p.actives[ex].lvl = 2; var L2 = r.lv[1]; p.actives[ex].cdMax = L2.cd; p.actives[ex].cd = Math.min(p.actives[ex].cd, 2000); lvlUp = true; }
      else {
        var at = replaceIdx != null ? replaceIdx : free;
        if (replaceIdx != null) { p.ash += P.replaceAsh; fx.num(p.x, p.y - 30, '+' + P.replaceAsh + ' Ceniza', '#ff9a3c'); snd('fx_replace', 0); }
        p.actives[at] = newSlot(r, 1);
      }
      try { G.Save.data.combosSeen[r.id] = 1; G.Save.save(); } catch (e0) { /* sin guardado */ }
      F.fused++; F.stats.fusions.push({ id: r.id, lvl: lvlUp ? 2 : 1, t: Math.round(G.runT) }); if (F.stats.firstFusionT == null) F.stats.firstFusionT = Math.round(G.runT);
      C.recalc(false);
      if (P.fuseHeal > 0 && !p.dead) G.Player.heal(p, P.fuseHeal, 'fusion');
      G.Hud.banner('¡FUSIÓN! ' + r.name + (lvlUp ? ' Nv2' : ''), 2400, '#ffd24a', { a: r.a, b: r.b, name: '¡' + r.name.toUpperCase() + '!', desc: r.desc });
      sfxFallback(r, 'fuse', 'fx_fusion'); snd('fuse', 0);
      fx.ring(p.x, p.y, 10, 120, 500, G.TAGS[r.a].color, 6); fx.ring(p.x, p.y, 6, 90, 400, G.TAGS[r.b].color, 4);
      fx.burst(p.x, p.y, 24, G.TAGS[r.a].color, 260, 600, 4, { add: true }); fx.burst(p.x, p.y, 24, G.TAGS[r.b].color, 200, 600, 4, { add: true });
      if (done) done();
    }
    if (activeOf(r.id) < 0 && p.actives.indexOf(null) < 0) {   // 4 poderes ya: hay que elegir cuál reemplazar (con confirmación)
      var btns = p.actives.map(function (a, i) { return { label: 'REEMPLAZAR ' + RBY[a.id].name.toUpperCase() + ' Nv' + a.lvl + '   (+' + P.replaceAsh + ' Ceniza)', col: '#8a2030', fn: function () { finish(i); } }; });
      btns.push({ label: 'CANCELAR (no se consume nada)', col: '#3a2f48', fn: function () { snd('fx_btn_cancel', 0); } });
      C.modal('YA TIENES 4 PODERES', 'Para crear ' + r.name + ' hay que sustituir uno. Esto no se puede deshacer.', btns);
      return;
    }
    finish(null);
  };

  // ------------------------------------------------------------- Infusiones y etiqueta dinámica
  F.infusion = function () {
    var inf = {}, h = hand();
    for (var i = 0; i < h.length; i++) {
      var s = h[i]; if (!s) continue; var d = C.def(s.id); if (d.type !== 'attack') continue;
      var o = inf[d.tag] || (inf[d.tag] = { bonus: 0, lv: 0, n: 0 });
      o.bonus += BONUS[s.lvl - 1] * P.infmul * (d.kind === 'proj' ? 1 : AUX.bonus) * G.Loot.rm(s.id) * (d.id === 'dart' && G.Tree.fx.puntaAfilada ? 2 : 1); o.lv = Math.max(o.lv, s.lvl); o.n++; o.lvSum = (o.lvSum || 0) + s.lvl;
    }
    return inf;
  };
  var oldRecalc = C.recalc;
  C.recalc = function (a) { oldRecalc(a); C.mods.steelCrit = Math.max(C.mods.steelCrit, F.infusion().steel ? 0.1 : 0); };   // infusión de Acero: 10 % de crítico
  function mulFor(e, tag) {
    var m = 1, r = e.partOf || e;
    if (e.mat && B.matMul) m *= B.matMul(e, tag);
    if (r.type === 'boss' && r.def) {
      var D = r.def, i;
      for (i = 0; i < D.weak.length; i++) if (D.weak[i].tag === tag && D.weak[i].phases.indexOf(r.phase) >= 0) m *= D.weak[i].mul;
      for (i = 0; i < D.resist.length; i++) if (D.resist[i].tag === tag) m *= D.resist[i].mul;
    }
    return m;
  }
  // De las etiquetas dadas, la que mejor multiplica contra este objetivo (un híbrido nunca es peor que su mejor mitad)
  function pickTag(e, tags) {
    if (!tags || !tags.length) return 'neutral';
    var best = tags[0], bm = -1;
    for (var i = 0; i < tags.length; i++) { var m = mulFor(e, tags[i]); if (m > bm + 1e-6) { bm = m; best = tags[i]; } }
    return best;
  }
  F.pickTag = pickTag;

  // ------------------------------------------------------------- Ataque básico
  function slotsActive(id) { var a = G.player.actives; for (var i = 0; i < NS; i++) if (a[i] && a[i].id === id && a[i].st) return a[i]; return null; }
  function volleyN(inf) {   // disparos extra del básico: +1 por cada P.vstep niveles de infusión sumados (tope P.vmax)
    var sum = 0; for (var tg in inf) sum += inf[tg].lvSum || 0;
    G.player.actives.forEach(function (a) { if (a) sum += P.vpow * a.lvl; });   // ?vpow: cada poder activo cuenta como vpow niveles de infusión
    return P.vstep > 0 ? Math.min(P.vmax, Math.floor(sum / P.vstep)) : 0;
  }
  function basicShot(p) {
    var t = CB.nearest(p.x, p.y, RANGE); if (!t) return false;
    var inf = F.infusion(), mul = 1, tags = [], dom = null, best = 0;
    for (var tg in inf) { mul += inf[tg].bonus; tags.push(tg); if (inf[tg].bonus > best) { best = inf[tg].bonus; dom = tg; } }
    G.player.actives.forEach(function (a) { if (a) mul += P.pinf * a.lvl; });   // ?pinf: cada poder activo mejora el básico (compensa las cartas consumidas)
    var targets = [t], extra = volleyN(inf);
    if (extra > 0) {   // extra: a otros objetivos distintos, primero los enemigos a distancia (arqueros...) y luego los más cercanos
      var cand = CB.inRange(p.x, p.y, RANGE).filter(function (e) { return e !== t && !e.partOf; });
      cand.sort(function (a, b) { var ra = (a.type === 'archer' || a.type === 'warlock') ? -400 : 0, rb = (b.type === 'archer' || b.type === 'warlock') ? -400 : 0; return (Math.hypot(a.x - p.x, a.y - p.y) + ra) - (Math.hypot(b.x - p.x, b.y - p.y) + rb); });
      for (var i = 0; i < cand.length && targets.length < 1 + extra; i++) targets.push(cand[i]);
    }
    var fired = false;
    for (var k = 0; k < targets.length; k++) {
      var tt = targets[k], a = Math.atan2(tt.y - p.y, tt.x - p.x);
      var q = W.spawnProj({ x: p.x, y: p.y - 4, ang: a, speed: P.speed, dmg: P.basicDmg * mul * (k ? P.vdmg : 1), tag: dom || 'neutral', id: 'basic', kind: 'basic', r: 6, life: 1300 });
      if (!q) continue;
      q.fus = { tags: tags, inf: inf };
      q.pierceN = inf.steel ? (inf.steel.lv >= 3 ? 2 : 1) : 0;
      if (inf.ice && G.Tree.fx.perfora) q.pierceN = 99;   // talento Esquirla II-A: atraviesa
      F.stats.basicShots++; fired = true;
    }
    if (fired) G.Snd.play(dom || 'neutral', 1);
    return fired;
  }
  F.basicHit = function (e, q, oo) {   // antes del daño: etiqueta dinámica + estados de las infusiones
    var inf = q.fus.inf;
    oo.tag = pickTag(e, q.fus.tags);
    if (inf.fire) oo.burn = 3;
    var tf = G.Tree.fx;   // talentos de las cartas proyectil (Chispa / Esquirla / Dardo) trasladados a sus infusiones
    if (inf.ice) oo.slow = tf.helada ? [0.4, 2500] : [0.25, 1500];
    if (inf.poison) oo.poison = tf.dosisDoble ? 2 : true;
    if (inf.blood) { oo.lifesteal = 1; if (inf.blood.lv >= 3) oo.bleed = true; }
  };
  F.basicAfter = function (e, q) {    // después del daño: cadena, explosión, congelación y cuenta de golpes de Sed de hierro
    var inf = q.fus.inf, p = G.player;
    if (inf.fire && G.Tree.fx.pavesa) CB.burn(e, 3.9, 4000);   // talento Chispa II-A
    if (inf.lightning) { var nx = CB.nearest(e.x, e.y, 110, [e]); if (nx) CB.chain(e.x, e.y, nx, inf.lightning.lv >= 3 ? 2 : 1, q.dmg * 0.8, 0.8, 110, 'lightning', { exclude: [e], id: 'basic' }); }
    if (inf.fire && inf.fire.lv >= 3) CB.boom(e.x, e.y, 30, q.dmg * 0.4, 'fire', { id: 'basic', kb: 10 });
    if (inf.ice && inf.ice.lv >= 3 && !e.frozeOnce) { e.frozeOnce = true; CB.stun(e, 500); }
    var sed = slotsActive('sed');
    if (sed && ++hitN % 5 === 0 && sed.st.healed < sed.st.L.heal && !p.dead) { sed.st.healed++; G.Player.heal(p, 1, 'sed'); }
  };
  F.drawBasic = function (c, q) {
    var col = G.TAGS[q.tag] ? G.TAGS[q.tag].color : '#e8dcff';
    c.globalCompositeOperation = 'lighter'; c.globalAlpha = 0.55; c.fillStyle = col; c.beginPath(); c.arc(0, 0, 10, 0, 6.283); c.fill();
    c.globalCompositeOperation = 'source-over'; c.globalAlpha = 1; c.fillStyle = '#fff'; c.beginPath(); c.arc(0, 0, 4.5, 0, 6.283); c.fill();
    c.strokeStyle = col; c.lineWidth = 2; c.beginPath(); c.arc(0, 0, 5.5, 0, 6.283); c.stroke();
  };

  // ------------------------------------------------------------- Armas auxiliares de las cartas que no son proyectil (orbitales, auras, Nova, Bobina, Murciélago...)
  function auxUpdate(dt, base, p) {
    if (!AUX.on) return;
    var h = p.hand, m = C.mods;
    for (var i = 0; i < h.length; i++) {
      var s = h[i]; if (!s) continue;
      var d = C.def(s.id); if (d.type !== 'attack' || d.kind === 'proj') continue;
      var L0 = W.LV[s.lvl], L = { dmg: L0.dmg * G.Loot.rm(s.id) * AUX.dmg, cd: L0.cd, area: L0.area };
      if (s.flash > 0) s.flash -= dt;
      if (d.kind === 'orbital') { W.updateOrbital(s, d, L, dt, p); continue; }
      if (d.kind === 'aura') { W.updateAura(s, d, L, dt, p); continue; }
      s.cd -= dt * base * (d.tag === 'lightning' ? m.lightSpd : 1);
      if (s.cd <= 0) {
        if (W.FIRE[d.kind](s, d, L, p)) {
          s.cd = s.cdMax = d.cd * L.cd * AUX.cd * G.Tree.cdMul(d.id); s.flash = 140;
          G.Snd.play(d.tag, 1 + (i - 2) * 0.03);
        } else s.cd = 0;
      }
    }
  }

  // ------------------------------------------------------------- Cegado (Vapor): el enemigo persigue un punto al azar
  F.blindTarget = function (e, p, dt) {
    e.blindT -= dt;
    if (!e.blindP) { e.blindP = Object.create(p); e.blindR = 0; }
    if ((e.blindR -= dt) <= 0) { e.blindR = 1100; var a = Math.random() * 6.283, d = 120 + Math.random() * 140; e.blindP.x = e.x + Math.cos(a) * d; e.blindP.y = e.y + Math.sin(a) * d; }
    return e.blindP;
  };

  // ------------------------------------------------------------- Daño de poderes con topes por uso
  function hitE(e, slot, dmg, o, tags) {
    var r = e.partOf || e; if (!r.fid) r.fid = ++uid;
    dmg *= P.pmul;   // ?pmul: multiplicador de daño de los poderes
    var used = slot.use[r.fid] || 0, cap = r.type === 'boss' ? P.bossCap * r.maxHp : P.perTargetCap;
    if (used >= cap) return 0;
    slot.use[r.fid] = used + dmg;
    o.tag = pickTag(e, tags); o.id = o.id || slot.id; o.zone = true;
    var d = CB.deal(e, dmg, o) || 0; slot.dmg += d;
    F.stats.dmg[slot.id] = (F.stats.dmg[slot.id] || 0) + d;
    return d;
  }
  function tickEnemy(e, key, ms) { var tk = e.tk || (e.tk = {}); if ((tk[key] || 0) > G.time) return false; tk[key] = G.time + ms; return true; }
  function visible(e) { return e.x > G.cam.x - 20 && e.x < G.cam.x + G.W + 20 && e.y > G.cam.y - 20 && e.y < G.cam.y + G.VH + 20; }
  function densest(p, range, rad) {   // enemigo con más vecinos en rad (centro de la nube / granada)
    var list = CB.inRange(p.x, p.y, range), best = null, bn = -1;
    for (var i = 0; i < list.length; i++) {
      var e = list[i]; if (e.partOf) continue;
      var n = 0; for (var j = 0; j < list.length; j++) if (Math.hypot(list[j].x - e.x, list[j].y - e.y) <= rad) n++;
      if (n > bn) { bn = n; best = e; }
    }
    return best ? { x: best.x, y: best.y, n: bn } : null;
  }
  function later(ms, fn) { F.timers.push({ t: ms, fn: fn }); }
  function addField(f) { f.max = f.life; f.tk = 0; f.snd = 0; F.fields.push(f); while (F.fields.length > P.maxFields) F.fields.shift(); }
  function addFx(o) { o.t = 0; F.fxs.push(o); while (F.fxs.length > 80) F.fxs.shift(); }
  function shuffle(a) { for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)), x = a[i]; a[i] = a[j]; a[j] = x; } return a; }
  function normalFoes(list) { return list.filter(function (e) { return !e.partOf && !e.dead; }); }

  // ------------------------------------------------------------- Lanzamiento de cada poder (devuelve false si no hay objetivo útil)
  var CAST = {
    cloud: function (slot, r, L, p) {
      var t = densest(p, 440, L.r); if (!t) return false;
      addField({ kind: 'cloud', x: t.x, y: t.y, r: L.r, life: L.dur, interval: 250, slot: slot, L: L, r0: r });
      fx.ring(t.x, t.y, 10, L.r, 450, '#e8f6ff', 6); fx.burst(t.x, t.y, 14, '#e8f6ff', 120, 600, 5, { add: true, drag: 1 });
      return true;
    },
    gas: function (slot, r, L, p) {
      var t = densest(p, 440, L.r); if (!t) return false;
      addFx({ kind: 'nade', x0: p.x, y0: p.y - 8, x1: t.x, y1: t.y, dur: 450 });
      later(450, function () {
        addField({ kind: 'gas', x: t.x, y: t.y, r: L.r, life: L.dur, interval: 500, slot: slot, L: L, r0: r });
        fx.burst(t.x, t.y, 16, '#9bff5a', 140, 600, 5, { drag: 1 }); fx.ring(t.x, t.y, 8, L.r, 400, '#9bff5a', 5);
      });
      return true;
    },
    beam: function (slot, r, L, p) {
      var t = CB.nearest(p.x, p.y, 520); if (!t) return false;
      slot.st = { t: L.dur, dur: L.dur, ang: Math.atan2(t.y - p.y, t.x - p.x), tk: 0, snd: 0, L: L };
      return true;
    },
    orbit: function (slot, r, L, p) {
      if (!CB.nearest(p.x, p.y, 420)) return false;
      slot.st = { t: L.dur, dur: L.dur, ang: 0, healed: 0, bodies: [], L: L };
      fx.ring(p.x, p.y, 8, 70, 400, '#d02048', 5);
      return true;
    },
    storm: function (slot, r, L, p) {
      if (!CB.nearest(p.x, p.y, L.r + 200)) return false;
      addField({ kind: 'storm', x: p.x, y: p.y, r: L.r, life: L.dur, interval: 500, slot: slot, L: L, r0: r }); fx.ring(p.x, p.y, 10, L.r, 450, '#8fe0ff', 5);
      return true;
    },
    spores: function (slot, r, L, p) {
      var list = shuffle(normalFoes(CB.inRange(p.x, p.y, 420))).slice(0, L.n); if (!list.length) return false;
      list.forEach(function (e, i) {
        var sx = e.x + G.rnd(-14, 14), sy = e.y + G.rnd(-10, 10);
        addFx({ kind: 'spore', x: sx, y: sy, dur: 650 + i * 120 });
        later(650 + i * 120, function () {
          if (slot !== G.player.actives[G.player.actives.indexOf(slot)]) return;
          addFx({ kind: 'sporeBurst', x: sx, y: sy, r: L.r, dur: 320 });
          var near = CB.inRange(sx, sy, L.r);
          for (var k = 0; k < near.length; k++) {
            var en = near[k]; en.fusPlague = true;
            hitE(en, slot, L.dmg, { slow: [0.5, 2500], noChain: true, kb: 0 }, ['ice', 'poison']);
            if (!en.partOf) CB.poison(en, L.stacks);
          }
          fx.burst(sx, sy, 10, '#a8e86a', 120, 400, 4, { add: true }); sfx(r, 'hit', 90);
        });
      });
      return true;
    },
    pact: function (slot, r, L, p) {
      if (!CB.nearest(p.x, p.y, 300) && !G.Enemies.boss()) return false;
      var pay = Math.max(0, Math.min(Math.round(p.hp * L.pay), Math.floor(p.hp - 20)));
      if (pay > 0) { p.hp -= pay; fx.num(p.x, p.y - 20, '-' + pay + ' HP', '#ff5a5a', true); }
      var dmg = L.dmg + L.mul * pay, near = CB.inRange(p.x, p.y, L.r);
      for (var i = 0; i < near.length; i++) hitE(near[i], slot, dmg, { burn: 3, kb: 70, ang: Math.atan2(near[i].y - p.y, near[i].x - p.x) }, ['blood', 'fire']);
      p.fusBuffT = L.dur; p.fusBuffMul = 1.25;
      addFx({ kind: 'nova', x: p.x, y: p.y, r: L.r, dur: 450, nk: 'pact' });
      fx.shake(5, 160); fx.burst(p.x, p.y, 20, '#ff7a2a', 240, 500, 4, { add: true });
      return true;
    },
    magnet: function (slot, r, L, p) {
      var list = CB.inRange(p.x, p.y, L.r); if (!list.length && !G.projectiles.some(function (q) { return q.team === 'e' && Math.hypot(q.x - p.x, q.y - p.y) < L.r; })) return false;
      addField({ kind: 'magnet', x: p.x, y: p.y, r: L.r, life: L.dur, interval: 999999, slot: slot, L: L, r0: r, done: false, elapsed: 0 });
      fx.ring(p.x, p.y, 10, L.r, 400, '#b0b8ff', 5);
      return true;
    },
    axe: function (slot, r, L, p) {
      var t = CB.nearest(p.x, p.y, 460); if (!t) return false;
      var a = Math.atan2(t.y - p.y, t.x - p.x);
      for (var i = 0; i < L.n; i++) F.axes.push({ ang: a + (L.n > 1 ? (i ? 0.45 : -0.45) : 0), t: 0, dur: L.dur, dist: 260, slot: slot, L: L, i: i, x: p.x, y: p.y, snd: 0 });
      return true;
    },
    fan: function (slot, r, L, p) {
      var t = CB.nearest(p.x, p.y, L.range + 40); if (!t) return false;
      var a = Math.atan2(t.y - p.y, t.x - p.x), n = L.n, spread = 2.094, list = CB.inRange(p.x, p.y, L.range + 20);
      var hit = {};
      for (var i = 0; i < n; i++) {
        var la = a - spread / 2 + i * spread / (n - 1), cx = Math.cos(la), cy = Math.sin(la);
        for (var k = 0; k < list.length; k++) {
          var e = list[k], dx = e.x - p.x, dy = e.y - p.y, u = dx * cx + dy * cy;
          if (u < 0 || u > L.range + e.r) continue;
          if (Math.abs(-dx * cy + dy * cx) > e.r + 5) continue;
          var crit = e.slowT > 0;
          hitE(e, slot, L.dmg * (crit ? 2 : 1), { slow: [0.35, 2000], noChain: true, kb: 12, ang: la }, ['ice', 'steel']);
          hit[k] = 1;
        }
      }
      addFx({ kind: 'fan', x: p.x, y: p.y - 4, ang: a, n: n, spread: spread, range: L.range, dur: 380 }); fx.shake(2, 80);
      return true;
    },
    mark: function (slot, r, L, p) {
      var list = normalFoes(CB.inRange(p.x, p.y, 200)); if (!list.length) return false;
      list.sort(function (a, b) { return Math.hypot(a.x - p.x, a.y - p.y) - Math.hypot(b.x - p.x, b.y - p.y); });
      list = list.slice(0, L.n);
      slot.st = { t: L.dur, dur: L.dur, healed: 0, L: L, marks: list };
      list.forEach(function (e) { e.hemoT = L.dur; e.hemoSlot = slot; CB.bleed(e); CB.poison(e, 3); });
      return true;
    },
    discharge: function (slot, r, L, p) {
      var vis = normalFoes(G.enemies).filter(function (e) { return e.spawnT <= 0 && !e.untarget && visible(e); });
      var pz = vis.filter(function (e) { return e.poisonN > 0; });
      if (pz.length) {
        pz.forEach(function (e) {
          var n = e.poisonN; hitE(e, slot, L.base + L.per * n, { noChain: true, kb: 0 }, ['poison', 'lightning']);
          e.poisonN = 0; e.poisonT = 0;
          addFx({ kind: 'strike', x: e.x, y: e.y, dur: 380, big: true });
        });
        sfx(r, 'hit', 0);
      } else {
        if (!vis.length) return false;
        vis.sort(function (a, b) { return Math.hypot(a.x - p.x, a.y - p.y) - Math.hypot(b.x - p.x, b.y - p.y); });
        vis.slice(0, 5).forEach(function (e) { CB.poison(e, 1); addFx({ kind: 'strike', x: e.x, y: e.y, dur: 380, big: true }); });
      }
      fx.shake(3, 100);
      return true;
    }
  };

  F.hemoDeath = function (e) {   // enemigo marcado por Hemotoxina que muere: cura (con tope por uso) y propaga el veneno
    var s = e.hemoSlot, p = G.player; e.hemoT = 0;
    if (!s || !s.st || p.dead) return;
    if (s.st.healed < s.st.L.heal) { s.st.healed++; G.Player.heal(p, 1, 'hemo'); }
    addFx({ kind: 'drain', x: e.x, y: e.y, dur: 450 });
    var n = 0, near = CB.inRange(e.x, e.y, 90);
    for (var i = 0; i < near.length && n < 3; i++) if (near[i] !== e && !near[i].partOf) { CB.poison(near[i], 2); n++; }
  };

  function cdMul() { var hg = (1 - C.mods.cdMul) / 0.1; return Math.max(0.75, 1 - 0.06 * hg); }   // Reloj de arena: -6 % por nivel, tope global -25 %
  F.fire = function (i, auto) {
    var p = G.player, s = p.actives[i]; if (!s || p.dead || G.state !== 'play') return false;
    s.press = 160;
    if (s.cd > 0 || s.st) { if (!auto) snd('fx_btn_cancel', 120); return false; }
    var r = RBY[s.id], L = r.lv[s.lvl - 1];
    s.use = {};
    if (!CAST[r.kind](s, r, L, p)) { if (!auto) { fx.num(p.x, p.y - 34, 'sin objetivo', '#9a8fb0'); snd('fx_btn_cancel', 120); } return false; }
    s.cdMax = Math.round(L.cd * cdMul() * P.pcd); s.cd = s.cdMax; s.flash = 220; s.uses++; s.used = true;
    F.stats.uses[s.id] = (F.stats.uses[s.id] || 0) + 1;
    sfx(r, '', 0, 1); fx.shake(3, 100);
    if (r.sfx !== r.id || ['tormenta', 'pacto', 'iman', 'forja', 'filo', 'hemo', 'descarga'].indexOf(r.id) >= 0) addFx({ kind: 'cast', id: r.id, dur: 320 });
    return true;
  };
  function autoOK(s, r, p) {   // modo AUTO: dispara cuando hay objetivo útil
    var near = CB.inRange(p.x, p.y, 280), n = near.length, boss = G.Enemies.boss && G.Enemies.boss(), k = r.kind;
    if (k === 'cloud' || k === 'gas' || k === 'storm') return n >= 3 || (boss && n >= 1);
    if (k === 'beam' || k === 'axe') return CB.inRange(p.x, p.y, 240).length >= 1;
    if (k === 'orbit') return CB.inRange(p.x, p.y, 150).length >= 2;
    if (k === 'spores') return n >= 2 || !!boss;
    if (k === 'pact') return p.hp >= p.maxHp * 0.4 && (n >= 3 || !!boss);
    if (k === 'magnet') return CB.inRange(p.x, p.y, r.lv[s.lvl - 1].r).length >= 4 || (p.hp < p.maxHp * 0.6 && n >= 2);
    if (k === 'fan') return CB.inRange(p.x, p.y, 200).length >= 2 || (boss && CB.inRange(p.x, p.y, 220).length >= 1);
    if (k === 'mark') return CB.inRange(p.x, p.y, 200).length >= 2 || (boss && CB.inRange(p.x, p.y, 200).length >= 1);
    if (k === 'discharge') { var pz = 0; for (var i = 0; i < G.enemies.length; i++) { var e = G.enemies[i]; if (!e.dead && e.poisonN > 0 && !e.partOf && visible(e)) pz++; } return pz >= 2 || (boss && boss.poisonN > 0); }
    return false;
  }

  // ------------------------------------------------------------- Bucle
  function updateSlot(s, dt, p) {
    var r = RBY[s.id];
    if (s.flash > 0) s.flash -= dt;
    if (s.press > 0) s.press -= dt;
    if (s.readyT > 0) s.readyT -= dt;
    if (s.cd > 0) { s.cd -= dt; if (s.cd <= 0) { s.cd = 0; if (s.used) { s.readyT = 700; sfxFallback(r, 'ready', 'fx_ready'); snd('fx_btn_ready', 200); } } }
    var st = s.st; if (!st) return;
    st.t -= dt;
    if (r.kind === 'beam') {
      st.ang += Math.PI * dt / 1000;   // 180 grados por segundo
      st.tk -= dt; st.snd -= dt;
      st.x0 = p.x; st.y0 = p.y - 6; st.x1 = st.x0 + Math.cos(st.ang) * st.L.len; st.y1 = st.y0 + Math.sin(st.ang) * st.L.len;
      if (st.snd <= 0) { st.snd = 420; sfx(r, '', 0, 1); }
      if (st.tk <= 0) {
        st.tk = 140;
        var list = CB.inRange(p.x, p.y, st.L.len + 30), hits = [], dx = st.x1 - st.x0, dy = st.y1 - st.y0, ll = dx * dx + dy * dy;
        for (var i = 0; i < list.length; i++) {
          var e = list[i], u = Math.max(0, Math.min(1, ((e.x - st.x0) * dx + (e.y - st.y0) * dy) / ll)), d = Math.hypot(e.x - (st.x0 + dx * u), e.y - (st.y0 + dy * u));
          if (d <= st.L.w / 2 + e.r) hits.push({ e: e, u: u });
        }
        hits.sort(function (a, b) { return a.u - b.u; });
        for (var k = 0; k < hits.length && k < 12; k++) hitE(hits[k].e, s, st.L.dmg, { burn: 3, noChain: true, kb: 0 }, ['fire', 'lightning']);
        if (Math.random() < 0.7) fx.dot(st.x1, st.y1, G.rnd(-60, 60), G.rnd(-60, 60), 300, '#ffb347', 3, { add: true });
      }
    } else if (r.kind === 'orbit') {
      st.ang += 4.2 * dt / 1000; st.bodies = [];
      for (var b = 0; b < 3; b++) {
        var a = st.ang + b * 2.094, bx = p.x + Math.cos(a) * 55, by = p.y - 2 + Math.sin(a) * 55;
        st.bodies.push({ x: bx, y: by, a: a });
        var near = CB.inRange(bx, by, 11);
        for (var j = 0; j < near.length; j++) { if (tickEnemy(near[j], 'sed', 450)) hitE(near[j], s, st.L.dmg, { bleed: true, kb: 20, ang: a + Math.PI / 2 }, ['blood', 'steel']); }
      }
    } else if (r.kind === 'mark') {
      st.tk = (st.tk || 0) - dt;
      if (st.tk <= 0) { st.tk = 500; st.marks.forEach(function (e) { if (e.dead || !(e.hemoT > 0)) return; e.hemoT = Math.max(e.hemoT, st.t); CB.bleed(e); if (!(e.poisonT > 600)) e.poisonT = 900; }); }
    }
    if (st.t <= 0) {
      if (r.kind === 'mark') st.marks.forEach(function (e) { e.hemoT = 0; });
      s.st = null;
    }
  }
  function updateAxes(dt, p) {
    for (var i = F.axes.length - 1; i >= 0; i--) {
      var a = F.axes[i]; a.t += dt; a.snd -= dt;
      var u = a.t / a.dur, rr = a.dist * Math.sin(Math.PI * Math.min(1, u));
      a.x = p.x + Math.cos(a.ang) * rr; a.y = p.y + Math.sin(a.ang) * rr;
      var near = CB.inRange(a.x, a.y, 30);
      for (var k = 0; k < near.length; k++) {
        var e = near[k]; if (!tickEnemy(e, 'forja' + a.i, 420)) continue;
        hitE(e, a.slot, a.L.dmg, { burn: 4, kb: 25, noChain: true, ang: a.ang }, ['fire', 'steel']);   // sin sx/sy: ignora el escudo frontal; el Fuego rompe placas
        addFx({ kind: 'impact', id: 'forja', x: e.x, y: e.y, dur: 220 }); sfx(RBY.forja, 'hit', 110);
      }
      if (G.projectiles.length) { /* la hacha no desvía proyectiles */ }
      if (u >= 1) F.axes.splice(i, 1);
    }
  }
  function updateFields(dt, p) {
    for (var i = F.fields.length - 1; i >= 0; i--) {
      var f = F.fields[i]; f.life -= dt; f.tk -= dt; f.snd -= dt;
      var r = f.r0, list, j, e;
      if (f.kind === 'storm') { f.x = p.x; f.y = p.y; }
      if (f.snd <= 0 && f.kind !== 'gas') { f.snd = 450; sfx(r, 'zone', 0); }
      if (f.kind === 'magnet') {
        f.elapsed += dt;
        var pulling = f.elapsed < f.L.pull;
        list = CB.inRange(f.x, f.y, f.r);
        if (pulling) for (j = 0; j < list.length; j++) {
          e = list[j]; if (e.big || e.type === 'boss' || e.partOf || e.fixed) continue;
          var dx = f.x - e.x, dy = f.y - e.y, d = Math.hypot(dx, dy); if (d > 30) { var st = Math.min(d - 30, 300 * dt / 1000); e.x += dx / d * st; e.y += dy / d * st; }
        }
        for (j = 0; j < G.projectiles.length; j++) { var q = G.projectiles[j]; if (q.team === 'e' && Math.hypot(q.x - f.x, q.y - f.y) < f.r) { q.life = 0; if (Math.random() < 0.3) fx.burst(q.x, q.y, 3, '#b0b8ff', 80, 250, 2, { add: true }); } }
        if (!f.done && !pulling) {   // fin del tirón: cadena de rayos y aturdimiento breve
          f.done = true;
          var cand = list.slice().sort(function (a, b) { return Math.hypot(a.x - f.x, a.y - f.y) - Math.hypot(b.x - f.x, b.y - f.y); }), used = [], n = 0;
          for (j = 0; j < cand.length && n < 3; j++) {
            if (used.indexOf(cand[j]) >= 0 || cand[j].partOf) continue;
            var key = cand[j].partOf || cand[j]; if (!key.fid) key.fid = ++uid;
            var capLeft = key.type === 'boss' ? P.bossCap * key.maxHp - (f.slot.use[key.fid] || 0) : 1;
            if (capLeft <= 0) continue;
            n++; f.slot.use[key.fid] = (f.slot.use[key.fid] || 0) + f.L.dmg * f.L.jumps;
            CB.chain(f.x, f.y - 6, cand[j], f.L.jumps, f.L.dmg, 1, 110, 'lightning', { id: 'iman', exclude: used.slice() }); used.push(cand[j]);
            F.stats.dmg.iman = (F.stats.dmg.iman || 0) + f.L.dmg * f.L.jumps;
          }
          for (j = 0; j < list.length; j++) CB.stun(list[j], 400);
          addFx({ kind: 'nova', x: f.x, y: f.y, r: f.r, dur: 400, nk: 'magnet' }); sfx(r, 'hit', 0); fx.shake(3, 100);
        }
        if (f.life <= 0) F.fields.splice(i, 1);
        continue;
      }
      if (f.tk <= 0) {
        f.tk = f.interval;
        list = CB.inRange(f.x, f.y, f.r);
        if (f.kind === 'storm') {
          var sl = list.filter(function (en) { return en.slowT > 0 && !en.partOf; }), pool = sl.length ? sl : normalFoes(list);
          for (j = 0; j < list.length; j++) CB.slow(list[j], 0.4, 800);
          if (pool.length) {
            e = pool[Math.floor(Math.random() * pool.length)];
            hitE(e, f.slot, f.L.dmg * (e.slowT > 0 ? 1.5 : 1), { noChain: true, kb: 0, stun: 500 }, ['ice', 'lightning']);
            addFx({ kind: 'strike', x: e.x, y: e.y, dur: 300, big: false }); sfx(r, 'hit', 100);
          }
          continue;
        }
        for (j = 0; j < list.length; j++) {
          e = list[j];
          if (f.kind === 'cloud') {
            var big = e.big || e.type === 'boss' || e.partOf;
            if (!big) e.blindT = Math.max(e.blindT || 0, f.interval + 300);
            hitE(e, f.slot, f.L.dmg * (big ? 1.2 : 1), { slow: [0.3, 600], noChain: true, kb: 0 }, ['fire', 'ice']);   // jefes / élites: sin ceguera, +20 % de daño recibido
          } else {
            if (!e.partOf) CB.poison(e, 1);
            hitE(e, f.slot, 2, { noChain: true, kb: 0 }, ['poison', 'fire']);
          }
        }
        if (Math.random() < 0.6) fx.dot(f.x + G.rnd(-f.r, f.r) * 0.6, f.y + G.rnd(-f.r, f.r) * 0.4, 0, -30, 600, f.kind === 'gas' ? '#9aff6a' : '#e8f6ff', 3, { drag: 1 });
      }
      if (f.life <= 0) {
        if (f.kind === 'gas') {
          var L = f.L, all = CB.inRange(f.x, f.y, f.r);
          if (L.perStack) all.forEach(function (en) { if (en.poisonN > 0 && !en.partOf) hitE(en, f.slot, L.perStack * en.poisonN, { noChain: true, kb: 0 }, ['fire']); });
          CB.boom(f.x, f.y, f.r, L.det, 'fire', { id: 'gas', burn: 3, big: true, kb: 60, color: '#b8ff40' });
          sfx(r, 'boom', 0); snd('fx_gas_boom', 0); fx.shake(5, 160);
        }
        F.fields.splice(i, 1);
      }
    }
  }
  F.update = function (dt, base) {
    var p = G.player; if (p.dead) return;
    var i, s;
    for (i = F.timers.length - 1; i >= 0; i--) { F.timers[i].t -= dt; if (F.timers[i].t <= 0) { var fn = F.timers[i].fn; F.timers.splice(i, 1); fn(); } }
    for (i = F.fxs.length - 1; i >= 0; i--) { F.fxs[i].t += dt; if (F.fxs[i].t > F.fxs[i].dur) F.fxs.splice(i, 1); }
    if (p.fusBuffT > 0) p.fusBuffT -= dt;
    // ataque básico (Sed de hierro: +40 % de cadencia)
    var rate = base * (slotsActive('sed') ? 1.4 : 1);
    bT -= dt * rate;
    if (bT <= 0) { if (basicShot(p)) bT = P.basicCd * (G.Tree.fx.rafaga && C.hasTag('fire') ? 0.85 : 1); else bT = 0; }   // talento Chispa II-B: -15 % de cooldown
    auxUpdate(dt, base, p);
    for (i = 0; i < NS; i++) { s = p.actives[i]; if (s) updateSlot(s, dt, p); }
    updateFields(dt, p); updateAxes(dt, p);
    // entrada
    for (i = 0; i < NS; i++) if (inp.hit(KEYS[i], DIGS[i])) F.fire(i);
    if (inp.hit('KeyF')) { F.auto = !F.auto; fx.num(p.x, p.y - 34, 'AUTO ' + (F.auto ? 'SÍ' : 'NO'), '#ffe9a0'); snd('fx_btn', 0); }
    if (F.auto) for (i = 0; i < NS; i++) { s = p.actives[i]; if (s && s.cd <= 0 && !s.st && autoOK(s, RBY[s.id], p)) F.fire(i, true); }
  };

  // ------------------------------------------------------------- Botones táctiles / ratón: zona del pulgar derecho (el joystick flotante solo nace en x < 480)
  // 844x390 (canvas 960x540 con escala 0,72): radio 38 = 55 px CSS. Arco en la esquina inferior derecha; AUTO a la izquierda del arco; pausa / silencio están arriba a la izquierda.
  var BTN = [{ x: 906, y: 486, r: 38 }, { x: 826, y: 496, r: 38 }, { x: 892, y: 404, r: 38 }, { x: 810, y: 414, r: 38 }], AUTO = { x: 700, y: 488, w: 88, h: 38 };
  F.BTN = BTN; F.AUTO = AUTO;
  F.press = function (m, type) {
    if (G.Sys) G.Sys.touchActive = type !== 'mouse';
    if (m.x >= AUTO.x && m.x <= AUTO.x + AUTO.w && m.y >= AUTO.y && m.y <= AUTO.y + AUTO.h) { F.auto = !F.auto; snd('fx_btn', 0); return true; }
    for (var i = 0; i < NS; i++) if (Math.hypot(m.x - BTN[i].x, m.y - BTN[i].y) <= BTN[i].r + 6) { if (G.player.actives[i]) F.fire(i); else snd('fx_btn_cancel', 150); return true; }
    return false;
  };

  // ------------------------------------------------------------- Dibujo
  F.drawGround = function (c) {
    var t = G.time / 1000, a2 = A2();
    for (var i = 0; i < F.fields.length; i++) {
      var f = F.fields[i], u = Math.min(1, f.life / 400, (f.max - f.life) / 250 + 0.2);
      if (f.kind === 'storm') { if (!art('storm', c, f.x, f.y, f.r, t, u)) G.FusionArt.cloud(c, f.x, f.y, f.r, t, 'vapor', u * 0.6); }
      else if (f.kind === 'magnet') { if (!art('magnet', c, f.x, f.y, f.r, t, u)) G.FusionArt.cloud(c, f.x, f.y, f.r, t, 'vapor', u * 0.5); }
      else {
        G.FusionArt.cloud(c, f.x, f.y, f.r, t, f.kind === 'gas' ? 'gas' : 'vapor', u);
        if (f.kind === 'gas' && f.life < 1000 && Math.floor(f.life / 120) % 2) { c.save(); c.strokeStyle = '#ff7a2a'; c.lineWidth = 4; c.globalAlpha = 0.8; c.beginPath(); c.ellipse(f.x, f.y, f.r, f.r * 0.8, 0, 0, 6.283); c.stroke(); c.restore(); }   // aviso de detonación
      }
    }
    if (a2) for (var k = 0; k < F.fxs.length; k++) {
      var o = F.fxs[k], uu = o.t / o.dur;
      if (o.kind === 'nova') a2.nova(c, o.x, o.y, o.r, uu, o.nk);
      else if (o.kind === 'sporeBurst') a2.sporeBurst(c, o.x, o.y, o.r, uu);
    }
  };
  F.drawAir = function (c) {
    var p = G.player, i, j, a2 = A2();
    for (i = 0; i < F.fxs.length; i++) {   // efectos en vuelo
      var o = F.fxs[i], u = o.t / o.dur;
      if (o.kind === 'nade') { var x = o.x0 + (o.x1 - o.x0) * u, y = o.y0 + (o.y1 - o.y0) * u - Math.sin(u * Math.PI) * 60; G.FusionArt.nade(c, x, y, u * 12); }
      else if (!a2) continue;
      else if (o.kind === 'cast') a2.cast(c, o.id, p.x, p.y, u);
      else if (o.kind === 'strike') a2.strike(c, o.x, o.y, u, o.big);
      else if (o.kind === 'spore') a2.spore(c, o.x, o.y, o.t / 1000, 8);
      else if (o.kind === 'impact') a2.impact(c, o.id, o.x, o.y, u, 14);
      else if (o.kind === 'drain') a2.drain(c, o.x, o.y, p.x, p.y - 8, u);
      else if (o.kind === 'fan') {
        a2.fan(c, o.x, o.y, o.ang, o.spread, o.range, u);
        for (j = 0; j < o.n; j++) { var la = o.ang - o.spread / 2 + j * o.spread / (o.n - 1), d = o.range * Math.min(1, u * 2.2); a2.lance(c, o.x + Math.cos(la) * d, o.y + Math.sin(la) * d, la, false); }
      }
    }
    for (i = 0; i < NS; i++) {
      var s = p.actives && p.actives[i]; if (!s || !s.st) continue;
      var st = s.st;
      if (RBY[s.id].kind === 'beam') G.FusionArt.beam(c, st.x0, st.y0, st.x1, st.y1, st.L.w, G.time / 1000);
      else if (RBY[s.id].kind === 'orbit') for (j = 0; j < st.bodies.length; j++) G.FusionArt.dagger(c, st.bodies[j].x, st.bodies[j].y, st.bodies[j].a + Math.PI / 2);
      else if (RBY[s.id].kind === 'mark' && a2) for (j = 0; j < st.marks.length; j++) { var e = st.marks[j]; if (!e.dead && e.hemoT > 0) a2.mark(c, e.x, e.y, e.r + 4, G.time / 1000); }
    }
    for (i = 0; i < F.axes.length; i++) { var ax = F.axes[i]; if (a2) a2.axe(c, ax.x, ax.y, ax.t / 1000, 1); else { c.fillStyle = '#ff8a2a'; c.beginPath(); c.arc(ax.x, ax.y, 18, 0, 6.283); c.fill(); } }
    if (p.fusBuffT > 0 && a2) a2.aura(c, p.x, p.y, G.time / 1000, Math.min(1, p.fusBuffT / 500), 26);
  };
  function sweep(c, x, y, r, frac) {
    c.fillStyle = 'rgba(8,4,14,0.72)'; c.beginPath(); c.moveTo(x, y); c.arc(x, y, r, -Math.PI / 2, -Math.PI / 2 + 6.283 * frac); c.closePath(); c.fill();
  }
  F.drawHud = function (c) {
    var p = G.player, t = G.time / 1000, touch = G.Sys.isTouch(), a2 = A2();
    for (var i = 0; i < NS; i++) {
      var b = BTN[i], s = p.actives[i], r = s && RBY[s.id], ready = s && s.cd <= 0 && !s.st;
      c.save();
      if (!s) {
        c.fillStyle = 'rgba(10,6,18,0.6)'; c.beginPath(); c.arc(b.x, b.y, b.r, 0, 6.283); c.fill();
        c.strokeStyle = 'rgba(160,140,190,0.4)'; c.lineWidth = 3; c.setLineDash([6, 6]); c.beginPath(); c.arc(b.x, b.y, b.r - 2, 0, 6.283); c.stroke(); c.setLineDash([]);
        G.txt(c, touch ? String(i + 1) : KEYL[i] === '_' ? 'ESP' : KEYL[i], b.x, b.y, 14, 'rgba(180,160,210,0.6)', 'center');
        c.restore(); continue;
      }
      var st = s.press > 0 ? 'press' : s.st ? 'active' : s.cd > 0 ? 'cd' : 'ready';
      if (a2 && a2.btn) a2.btn(c, s.id, b.x, b.y, b.r, st, s.cd > 0 ? Math.min(1, s.cd / s.cdMax) : 0, F.auto);
      else {
        c.fillStyle = 'rgba(10,6,18,0.85)'; c.beginPath(); c.arc(b.x, b.y, b.r, 0, 6.283); c.fill();
        c.save(); c.beginPath(); c.arc(b.x, b.y, b.r - 3, 0, 6.283); c.clip(); G.FusionArt.icon(c, s.id, b.x, b.y - 2, b.r * 0.55);
        if (s.cd > 0) sweep(c, b.x, b.y, b.r * 1.5, Math.min(1, s.cd / s.cdMax)); c.restore();
        c.lineWidth = ready ? 5 : 3; c.strokeStyle = ready ? '#ffd24a' : '#6a5a86'; c.beginPath(); c.arc(b.x, b.y, b.r - 1.5, 0, 6.283); c.stroke();
      }
      if (s.st) { c.strokeStyle = r.color; c.lineWidth = 4; c.beginPath(); c.arc(b.x, b.y, b.r + 4, -Math.PI / 2, -Math.PI / 2 + 6.283 * (s.st.t / s.st.dur)); c.stroke(); }
      if (s.readyT > 0) { c.strokeStyle = 'rgba(255,233,160,' + s.readyT / 700 + ')'; c.lineWidth = 3; c.beginPath(); c.arc(b.x, b.y, b.r + 4 + (700 - s.readyT) / 700 * 16, 0, 6.283); c.stroke(); }
      if (s.cd > 0) G.txt(c, (s.cd >= 10000 ? Math.ceil(s.cd / 1000) : (s.cd / 1000).toFixed(1)), b.x, b.y + 2, 20, '#fff', 'center');
      G.txt(c, r.short + (s.lvl > 1 ? ' II' : ''), b.x, b.y + b.r - 11, 10, ready ? '#ffe9a0' : '#d8cfe8', 'center');
      if (!touch) { c.fillStyle = '#0c0814'; c.fillRect(b.x - b.r + 4, b.y - b.r + 4, 24, 20); G.txt(c, KEYL[i] === '_' ? 'ESP' : KEYL[i], b.x - b.r + 16, b.y - b.r + 14, 12, '#ffd27a', 'center'); }
      c.restore();
    }
    var a = AUTO; c.save(); c.fillStyle = F.auto ? '#2a8a4a' : 'rgba(10,6,18,0.8)'; c.fillRect(a.x, a.y, a.w, a.h); c.strokeStyle = F.auto ? '#9dffb4' : '#6a5a86'; c.lineWidth = 2; c.strokeRect(a.x + 1, a.y + 1, a.w - 2, a.h - 2);
    G.txt(c, 'AUTO ' + (F.auto ? 'SI' : 'NO') + (touch ? '' : ' (F)'), a.x + a.w / 2, a.y + a.h / 2, 12, '#fff', 'center'); c.restore();
  };
  F.chipRects = function () { var out = []; for (var i = 0; i < NS; i++) out.push({ x: 8 + i * 84, y: 8, w: 80, h: 34 }); return out; };
  F.drawChips = function (c) {   // pantalla de oferta: panel PODERES arriba a la derecha (4 slots)
    var p = G.player, rc = F.chipRects();
    G.txt(c, 'PODERES', 8, 51, 10, '#9a8fb0', 'left');
    for (var i = 0; i < NS; i++) {
      var s = p.actives[i], q = rc[i];
      c.save(); c.fillStyle = 'rgba(12,8,20,0.7)'; c.fillRect(q.x, q.y, q.w, q.h); c.strokeStyle = s ? RBY[s.id].color : 'rgba(160,140,190,0.35)'; c.lineWidth = 2; c.strokeRect(q.x + 1, q.y + 1, q.w - 2, q.h - 2);
      if (s) { G.FusionArt.icon(c, s.id, q.x + 17, q.y + 17, 11); G.txt(c, RBY[s.id].short, q.x + 55, q.y + 12, 10, '#fff', 'center'); G.txt(c, 'Nv' + s.lvl, q.x + 55, q.y + 25, 11, '#ffd24a', 'center'); }
      else G.txt(c, 'libre', q.x + q.w / 2, q.y + q.h / 2, 11, 'rgba(180,160,210,0.5)', 'center');
      c.restore();
    }
  };
  F.endText = function () {
    var p = G.player, a = (p.actives || []).filter(Boolean);
    if (!a.length) return 'Sin poderes: fusiona dos cartas de etiquetas distintas';
    return 'PODERES: ' + a.map(function (s) { return RBY[s.id].short + ' Nv' + s.lvl + ' (' + s.uses + ')'; }).join('  -  ');
  };

  // Estado resumido para pruebas (fusion_tests.js / bots)
  F.snapshot = function () {
    var p = G.player;
    return { actives: p.actives.map(function (s) { return s && { id: s.id, lvl: s.lvl, cd: Math.round(s.cd), uses: s.uses, dmg: Math.round(s.dmg), on: !!s.st }; }), fused: F.fused, auto: F.auto, stats: F.stats, hand: p.hand.map(function (h) { return h && h.id + ':' + h.lvl; }) };
  };
})();
