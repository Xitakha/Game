/* kits.js - G.Kit: kits semanales del reto diario (DESIGN-v10-retencion.md 1.10). El Portal presta a todos el mismo equipo durante una semana (lunes 00:00 UTC):
   2 etiquetas, 1 ancla, 4 piezas de armadura, nodos del árbol por tramos de PF, plato. El bioma del día fija la potencia (tier y refuerzo de la armadura, presupuesto de PF).
   NADA del kit se escribe en el guardado: begin() instala capas en memoria (Armor.kitOvr, Tree.fx, rangos por Save.rank, anclas, plato) y end() las quita (Tree.sync()).
   Datos puros en KITS (ids reales de armor_data.js, tree.js, cards.js, fusion.js y del Cook de panels.js). Versión del catálogo KV ('k1'): si se retocan kits, se sube a 'k2'.
   Calibración: los valores son los del diseño SIN calibrar (pendiente de balance-designer, fases A-D de 1.10.6). Parámetro de prueba: ?dev=1&kit=<id> (el intento es PRUEBA). */
(function () {
  'use strict';
  var G = window.G, K = G.Kit = {};
  K.KV = 'k1';
  // Potencia por bioma (1.10.3): tier y refuerzo de la armadura nivelada y presupuesto de PF del árbol
  K.POWER = { bosque: { tier: 1, ref: 0, pf: 6 }, cripta: { tier: 2, ref: 1, pf: 9 }, asfodelo: { tier: 3, ref: 1, pf: 12 }, tundra: { tier: 4, ref: 1, pf: 15 }, panal: { tier: 5, ref: 1, pf: 18 } };
  // Catálogo (1.10.4). nodes: [id, elección A/B] en el orden de los tramos; el kit toma nodos hasta que el siguiente no cabe en el presupuesto del bioma
  K.KITS = [
    { id: 'fragua', name: 'Fragua', tags: ['fire', 'steel'], fusion: 'forja', anchor: 'spark', dish: 'caldo', motto: 'Hachas al rojo, escudos que no ceden.', color: '#ff8a2a',
      armor: ['car_helm', 'car_chest', 'car_greaves', 'car_talis'],
      nodes: [['F1', 'B'], ['A1', 'A'], ['F4'], ['A4'], ['F7'], ['ASH'], ['F3', 'A'], ['A7'], ['A10'], ['F10'], ['A3', 'A']] },
    { id: 'ventisca', name: 'Ventisca', tags: ['ice', 'lightning'], fusion: 'tormenta', anchor: 'shard', dish: 'pan', motto: 'Congela y remata con rayos.', color: '#8fe0ff',
      armor: ['gla_helm', 'gla_chest', 'gla_greaves', 'gla_talis'],
      nodes: [['H1', 'B'], ['Z2', 'A'], ['H4'], ['Z4'], ['H3', 'B'], ['ASH'], ['Z6'], ['H6'], ['H10'], ['Z10'], ['Z9', 'A']] },
    { id: 'pantano', name: 'Pantano', tags: ['poison', 'ice'], fusion: 'escarcha', anchor: 'dart', dish: 'estofado', motto: 'Frena y envenena.', color: '#a8e86a',
      armor: ['esc_helm', 'esc_chest', 'esc_greaves', 'esc_talis'],
      nodes: [['V1', 'A'], ['H1', 'B'], ['V4'], ['H4'], ['V3', 'A'], ['ASH'], ['V6'], ['H7'], ['V10'], ['H3', 'B'], ['V9', 'B']] },
    { id: 'carmesi', name: 'Carmesí', tags: ['blood', 'lightning'], fusion: 'zancada', anchor: 'fang', dish: 'sopa', motto: 'Entra, corta, cúrate, sal.', color: '#ff6a7a',
      armor: ['jal_helm', 'jal_chest', 'jal_greaves', 'jal_talis'],
      nodes: [['S1', 'A'], ['Z2', 'B'], ['S4'], ['Z4'], ['S3', 'B'], ['ASH'], ['S6'], ['Z7'], ['S10'], ['Z10'], ['Z9', 'B']] },
    { id: 'lana', name: 'Lana y Hierro', tags: ['steel', 'blood'], fusion: 'sed', anchor: 'dagger', dish: 'asado', motto: 'Aguanta y devuelve cada golpe.', color: '#d02048',
      armor: ['esq_helm', 'esq_chest', 'esq_greaves', 'esq_talis'],
      nodes: [['A1', 'B'], ['S1', 'B'], ['A4'], ['S4'], ['A3', 'A'], ['ASH'], ['A6'], ['S7'], ['A10'], ['S3', 'A'], ['A9', 'A']] },
    { id: 'tempestad', name: 'Tempestad', tags: ['lightning', 'fire'], fusion: 'plasma', anchor: 'zap', dish: 'te', motto: 'Lo que el rayo toca, arde.', color: '#ffb347',
      armor: ['bra_helm', 'bra_chest', 'bra_greaves', 'mn_cripta'],
      nodes: [['Z2', 'A'], ['F1', 'A'], ['Z4'], ['F4'], ['Z6'], ['ASH'], ['F3', 'B'], ['F6'], ['Z10'], ['F10'], ['Z9', 'A']] },
    { id: 'alquimia', name: 'Alquimia', tags: ['poison', 'blood'], fusion: 'hemo', anchor: 'bleed', dish: 'estofado', motto: 'Marca a la manada y déjala caer.', color: '#b0206a',
      armor: ['esc_helm', 'jal_chest', 'esc_greaves', 'mn_asfodelo'],
      nodes: [['V1', 'B'], ['S1', 'A'], ['V4'], ['S4'], ['V3', 'B'], ['ASH'], ['S6'], ['V7'], ['V10'], ['S3', 'A'], ['V9', 'A']] },
    { id: 'hogar', name: 'Hogar', tags: ['fire', 'ice'], fusion: 'vapor', anchor: 'ember', dish: 'sopa', motto: 'Con lo puesto: chispa y escarcha.', color: '#bfeaff',
      armor: ['ald_helm', 'ald_chest', 'ald_boots', 'ald_amulet'],
      nodes: [['F1', 'A'], ['H1', 'A'], ['F4'], ['H4'], ['H3', 'A'], ['ASH'], ['F7'], ['H7'], ['F10'], ['F3', 'A'], ['H10']] }
  ];
  var BY = {}; K.KITS.forEach(function (k) { BY[k.id] = k; });
  K.get = function (id) { return BY[id] || null; };
  K.ORDER = K.KITS.map(function (k) { return k.id; });
  // Cartas de cada etiqueta (baraja del día, 1.1 paso 4) y pasivas de etiqueta
  K.TAG_CARDS = { fire: ['spark', 'ember', 'ring'], ice: ['shard', 'nova', 'blizzard'], lightning: ['zap', 'storm', 'coil'], poison: ['dart', 'pool', 'cloud'], blood: ['fang', 'bleed', 'bat'], steel: ['dagger', 'axe', 'thorns'] };
  K.TAG_PASSIVE = { fire: 'mantle', ice: 'frost', lightning: 'bell', poison: 'bile', steel: 'whet' };
  K.NEUTRALS = ['heart', 'hourglass', 'hooves', 'magnet', 'satchel'];   // Lana, Reloj, Pezuñas, Imán, Alforja (3 de 5 por día)
  K.TAGS = ['fire', 'ice', 'lightning', 'poison', 'blood', 'steel'];

  function H() { return G.util.hash; } function R() { return G.util.rng; }
  function shuffle(a, r) { for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(r() * (i + 1)), t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
  // ---- Rotación semanal (1.10.5): bolsa de 8 por ciclo; nunca el mismo kit dos semanas seguidas
  function cycleOrder(cy) { return shuffle(K.ORDER.slice(), R()(H()('SH-kit|' + cy + '|' + K.KV))); }
  K.order = function (cy) {
    var o = cycleOrder(cy);
    if (cy > 0) { var prev = cycleOrder(cy - 1); if (o[0] === prev[prev.length - 1]) { var t = o[0]; o[0] = o[1]; o[1] = t; } }
    return o;
  };
  K.ofWeek = function (week) { var n = K.ORDER.length, cy = Math.floor(week / n); return K.order(cy)[((week % n) + n) % n]; };
  K.forced = function () { var m = /[?&]kit=(\w+)/.exec(Dev.search); return m && BY[m[1]] ? m[1] : null; };   // ?dev=1&kit=<id> (parámetro cerrado)

  // ---- Armado del kit para un bioma (sin tiradas: depende solo de kit y bioma)
  function nodeCost(id) { var n = G.Tree.node(id); return n ? G.Tree.cost(n).pf : 99; }
  K.hasFire = function (k) { return k.tags.indexOf('fire') >= 0; };
  K.build = function (kitId, biome) {
    var k = BY[kitId] || K.KITS[0], pw = K.POWER[biome] || K.POWER.bosque, AD = G.ArmorData, i;
    var fx = {}, rank = {}, used = 0, active = [], later = [];
    for (i = 0; i < k.nodes.length; i++) {
      var nd = k.nodes[i], n = G.Tree.node(nd[0]), c = nodeCost(nd[0]);
      if (!n || active.length < i || used + c > pw.pf) { later.push(nd); continue; }   // en cuanto uno no cabe, el resto queda para biomas más duros
      used += c; active.push(nd);
      if (n.type === 'M') { if (n.ch[nd[1]]) fx[n.ch[nd[1]].fx] = true; if (n.card) rank[n.card] = 2; }
      else if (n.fx) fx[n.fx] = true;
    }
    var cnt = function (sid) { return k.armor.filter(function (id) { var p = AD.BY[id]; return p && p.set === sid; }).length; };
    var prov = [], dish = k.dish;
    if (biome === 'tundra') { fx.crampones = true; prov.push('RT1'); if (!(cnt('glacial') >= 2 || k.armor.indexOf('mn_tundra') >= 0)) dish = 'caldobrasa'; }   // R1
    if (biome === 'panal') { fx.ahumador = true; prov.push('RT4'); if (!(cnt('jalea') >= 2 || k.armor.indexOf('mn_panal') >= 0)) dish = 'tostada'; }     // R2 (R3: solo si falta)
    var eq = [null, null, null, null], ref = {};
    k.armor.forEach(function (id) { var p = AD.BY[id]; if (p) { eq[p.slot] = id; ref[id] = pw.ref; } });
    return { id: k.id, kv: K.KV, kit: k, biome: biome, tier: pw.tier, ref: pw.ref, pf: pw.pf, pfSpent: used, nodes: active, later: later, fx: fx, rank: rank,
      armor: { eq: eq, ref: ref, tier: pw.tier }, dish: dish, prov: prov, anchor: k.anchor, deck: [] };
  };

  // ---- Instalar / quitar (1.10.8). Nunca toca Save.data
  K.cur = null;
  var prev = null;
  K.begin = function (b, deck) {
    if (K.cur) K.end();
    b.deck = (deck || []).slice(); if (b.deck.indexOf(b.anchor) < 0) b.deck.push(b.anchor);
    for (var i = 0; i < b.deck.length; i++) if (!b.rank[b.deck[i]]) b.rank[b.deck[i]] = 1;
    prev = { slots: G.B.anchorSlots };
    K.cur = b;
    G.Tree.fx = b.fx; G.B.anchorSlots = 1;   // (no se llama a Tree.sync durante el reto: recortaría las anclas de la cuenta)
    if (G.Armor) G.Armor.setKit(b.armor);
  };
  K.applyDish = function () {
    var b = K.cur; if (!b) return;
    var d = G.Cook && G.Cook.def(b.dish); G.runBuff.dish = d ? d.id : null; G.runBuff.fx = d ? d.fx : {};
  };
  K.end = function () {
    if (!K.cur) return;
    K.cur = null;
    if (G.Armor) G.Armor.setKit(null);
    G.B.anchorSlots = prev ? prev.slots : 1; prev = null;
    G.Tree.sync();   // T.fx y ranuras de ancla de la cuenta
  };
  K.inDeck = function (id) { return !!K.cur && K.cur.deck.indexOf(id) >= 0; };
  // Rango de forja prestado: las cartas de la baraja a Rango I (II si el kit sube la carta con un nodo de mejora dentro del presupuesto)
  (function () {
    var S = G.Save, orig = S.rank;
    S.rank = function (id) { return K.cur ? (K.cur.rank[id] || 0) : orig(id); };
  })();

  // ---- Datos de la ficha VER KIT (1.10.7)
  K.tagName = function (t) { return (G.TAGS[t] && G.TAGS[t].name) || t; };
  K.view = function (b) {
    var AD = G.ArmorData, A = G.Armor, k = b.kit;
    var m = A ? A.calc(b.armor.eq, function (id) { return b.armor.ref[id] != null ? b.armor.ref[id] : -1; }, function () { return b.tier; }) : null;
    var sets = {}; k.armor.forEach(function (id) { var p = AD.BY[id]; if (p && !AD.SETS[p.set].noSet) sets[p.set] = (sets[p.set] || 0) + 1; });
    var bonus = []; Object.keys(sets).forEach(function (sid) { var s = AD.SETS[sid]; if (sets[sid] >= 2 && s.t2) bonus.push(s.name + ' (2): ' + s.t2); if (sets[sid] >= 4 && s.b4) bonus.push(s.name + ' (4): ' + s.t4); });
    var nodeTxt = function (nd) { var n = G.Tree.node(nd[0]); if (!n) return { name: nd[0], desc: '' }; if (n.type === 'M' && n.ch[nd[1]]) return { name: n.name + ': ' + n.ch[nd[1]].name, desc: n.ch[nd[1]].desc }; return { name: n.name, desc: n.desc }; };
    var dish = G.Cook && G.Cook.def(b.dish), rec = G.Fusion && G.Fusion.recipe(k.fusion);
    return { name: k.name, motto: k.motto, tags: k.tags, anchor: k.anchor, pieces: k.armor.map(function (id) { return AD.BY[id]; }).filter(Boolean), stats: m, bonus: bonus,
      active: b.nodes.map(nodeTxt), later: b.later.map(nodeTxt), pfSpent: b.pfSpent, pf: b.pf, prov: b.prov.map(function (id) { var n = G.Tree.node(id); return n ? n.name : id; }),
      dish: dish ? dish.name : '', dishDesc: dish ? dish.desc : '', fusion: rec ? rec.name : k.fusion, fusionDesc: rec ? rec.desc : '' };
  };
})();
