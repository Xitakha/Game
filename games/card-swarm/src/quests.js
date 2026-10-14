/* quests.js - Encargos de Vesper (Fase 2b) y logros de Lanudo.
   Hay un pool de 20 encargos de 8 tipos: cazar enemigos (hunt), matar minijefes (mini), bajas totales (kills), romper partes de jefes (part, hook Q.onBossPart),
   ganar con una etiqueta (wintag), sobrevivir sin recibir daño N s (clean) y ganar con la duración de 7 min (win7). El Tablón muestra 3 ofertas que ROTAN con el día y con
   cada expedición (una fácil, una media y una de condición; Q.offers) y, aparte, el encargo activo. Solo hay uno activo; el progreso persiste entre expediciones.
   El director (waves.js) lee Q.target(): el tipo objetivo de un encargo hunt/mini pesa x2,5 y entra como mucho a los 2:30 virtuales (Q.WEIGHT / Q.EARLY).
   Recompensas escalonadas por tier (1 fácil, 2 medio, 3 difícil): partes + Brasas + PF (+ 1 Esencia rara la primera vez en los de condición difíciles).
   Datos de guardado en Save.data.quest ({ active, prog, done }) y Save.data.flags.qseen (última rotación vista, para el "!" de Vesper). Logros: G.Ach al final. */
(function () {
  'use strict';
  var G = window.G, Q = G.Quests = {};

  Q.WEIGHT = 2.5;            // multiplicador de peso del enemigo objetivo en el director
  Q.REPEAT_MUL = 0.5;        // al repetir un encargo las partes y Brasas valen la mitad (el PF se queda en pfRepeat; la Esencia solo la primera vez)
  Q.EARLY = 150000;          // entrada adelantada (2:30 en tiempo virtual)
  var TAGN = { fire: 'Fuego', ice: 'Hielo', lightning: 'Rayo', poison: 'Veneno', blood: 'Sangre', steel: 'Acero' };
  var TAGPART = { fire: 'wick', ice: 'frost', lightning: 'static', poison: 'spine', blood: 'fang', steel: 'plate' };

  // tier 1/2/3; cat A = caza fácil, B = caza media / minijefes, C = condición.
  var DEFS = [
    { id: 'bombs', cat: 'A', tier: 1, kind: 'hunt', name: 'Huele a chamusquina', tutorial: true, target: 'bomb', goal: 20, label: 'Bombas',
      desc: 'Revienta 20 Bombas antes de que lleguen a ti.', rewardParts: { wick: 6 }, brasas: 40, pf: 1, pfRepeat: 1 },
    { id: 'moths', cat: 'A', tier: 1, kind: 'hunt', name: 'Caza 40 Polillas gélidas', target: 'moth', goal: 40, label: 'Polillas',
      desc: 'Abate 40 Polillas gélidas. Cuidado con sus orbes.', rewardParts: { frost: 12 }, brasas: 60, pf: 1, pfRepeat: 1 },
    { id: 'worms', cat: 'A', tier: 1, kind: 'hunt', name: 'Plaga de gusanos', target: 'worm', goal: 150, label: 'Gusanos',
      desc: 'Aplasta 150 Gusanos: hay de sobra, pero no se acaban solos.', rewardParts: { thread: 20 }, brasas: 40, pf: 1, pfRepeat: 1 },
    { id: 'archers', cat: 'A', tier: 1, kind: 'hunt', name: 'Cazaarqueros', target: 'archer', goal: 30, label: 'Arqueros',
      desc: 'Derriba 30 Arqueros antes de que te claven una flecha.', rewardParts: { feather: 7 }, brasas: 50, pf: 1, pfRepeat: 1 },
    { id: 'slaughter', cat: 'A', tier: 1, kind: 'kills', name: 'Masacre menor', goal: 400, label: 'Bajas',
      desc: 'Acaba con 400 enemigos de cualquier clase (suma entre expediciones).', rewardParts: { thread: 15 }, brasas: 50, pf: 1, pfRepeat: 1 },
    { id: 'boars', cat: 'B', tier: 2, kind: 'hunt', name: 'Rodeo de jabalíes', target: 'boar', goal: 25, label: 'Jabalíes',
      desc: 'Frena 25 Jabalíes: esquiva la embestida y remata.', rewardParts: { fang: 7 }, brasas: 90, pf: 1, pfRepeat: 1 },
    { id: 'shields', cat: 'B', tier: 2, kind: 'hunt', name: 'Rompe-escudos', target: 'shield', goal: 20, label: 'Escuderos',
      desc: 'Derriba 20 Escuderos. Su escudo frontal frena casi todo: flanquea.', rewardParts: { plate: 6 }, brasas: 90, pf: 1, pfRepeat: 1 },
    { id: 'specters', cat: 'B', tier: 2, kind: 'hunt', name: 'Cacería de espectros', target: 'blinker', goal: 15, label: 'Espectros',
      desc: 'Abate 15 Espectros: se desvanecen y reaparecen a tu espalda.', rewardParts: { static: 7 }, brasas: 100, pf: 1, pfRepeat: 1 },
    { id: 'scorchers', cat: 'B', tier: 3, kind: 'hunt', name: 'Apaga las Ascuas', target: 'scorcher', goal: 12, label: 'Ascuas',
      desc: 'Apaga 12 Ascuas. Cargan con rastro de fuego: no te quedes en su línea.', rewardParts: { wick: 9 }, brasas: 150, pf: 2, pfRepeat: 1 },
    { id: 'colossus', cat: 'B', tier: 2, kind: 'mini', name: 'Mata al Coloso Escudero', target: 'mini_bulwark', goal: 1, label: 'Coloso', elite: true,
      desc: 'Derriba al Coloso Escudero: flanquéalo o usa área.', rewardParts: { plate: 8 }, brasas: 100, pf: 2, pfRepeat: 1 },
    { id: 'hive', cat: 'B', tier: 3, kind: 'mini', name: 'Quema la Colmena', target: 'mini_hive', goal: 1, label: 'Colmena', elite: true,
      desc: 'Acaba con la Madre Colmena: rompe su saco de larvas y no te quedes quieto.', rewardParts: { spine: 8 }, brasas: 150, pf: 2, pfRepeat: 1 },
    { id: 'parts3', cat: 'C', tier: 3, kind: 'part', name: 'Rompe-partes', goal: 3, label: 'Partes de jefe', rare: 1,
      desc: 'Rompe 3 partes de jefe (suman entre expediciones, aunque pierdas). Mira los medidores de la barra.', rewardParts: { thread: 10 }, brasas: 170, pf: 2, pfRepeat: 1 },
    { id: 'horn', cat: 'C', tier: 2, kind: 'partkey', key: 'cuernos', name: 'Rompe el cuerno', goal: 1, label: 'Cuernos del Pastor',
      desc: 'Rompe los Cuernos del Pastor Corrupto (aunque pierdas, cuenta). Apunta a su cabeza.', rewardParts: { fang: 5 }, brasas: 110, pf: 1, pfRepeat: 1 },
    { id: 'nojump', cat: 'C', tier: 3, kind: 'nojump', name: 'Sin Salto aplastante', goal: 1, label: 'Sin Salto', rare: 1,
      desc: 'Derrota al Pastor Corrupto sin que te alcance su Salto aplastante: su sombra avisa 1 s.', rewardParts: { feather: 8 }, brasas: 170, pf: 2, pfRepeat: 1 },
    { id: 'clean45', cat: 'C', tier: 2, kind: 'clean', name: 'Intocable', goal: 45, label: 'Sin daño', unit: ' s',
      desc: 'Aguanta 45 segundos seguidos sin recibir daño en una expedición.', rewardParts: { feather: 7 }, brasas: 90, pf: 1, pfRepeat: 1 },
    { id: 'clean90', cat: 'C', tier: 3, kind: 'clean', name: 'Fantasma de Rescoldo', goal: 90, label: 'Sin daño', unit: ' s', rare: 1,
      desc: 'Aguanta 90 segundos seguidos sin recibir daño en una expedición.', rewardParts: { feather: 10 }, brasas: 170, pf: 2, pfRepeat: 1 },
    { id: 'win7', cat: 'C', tier: 2, kind: 'win7', name: 'Corto y dulce', goal: 1, label: 'Victoria en 7 min',
      desc: 'Vence al jefe en una expedición de 7 minutos (selector del Portal).', rewardParts: { thread: 12, feather: 4 }, brasas: 110, pf: 1, pfRepeat: 1 }
  ];
  // Una variante "gana con una etiqueta" por etiqueta: victoria con 3 o más cartas de esa etiqueta en la mano final
  Object.keys(TAGN).forEach(function (tg) {
    var rp = {}; rp[TAGPART[tg]] = 8;
    DEFS.push({ id: 'win_' + tg, cat: 'C', tier: 3, kind: 'wintag', tag: tg, name: 'Mano de ' + TAGN[tg], goal: 1, label: 'Gana con ' + TAGN[tg], rare: 1,
      desc: 'Gana una expedición con 3 o más cartas de ' + TAGN[tg].toUpperCase() + ' en tu mano final.', rewardParts: rp, brasas: 160, pf: 2, pfRepeat: 1 });
  });
  Q.DEFS = DEFS;
  var BY = {}; DEFS.forEach(function (d) { BY[d.id] = d; });
  Q.def = function (id) { return BY[id]; };
  Q.TAGN = TAGN;

  function S() { return G.Save.data.quest; }
  Q.active = function () { var a = S().active; return a ? BY[a] || null : null; };
  Q.progress = function (id) { return S().prog[id] || 0; };
  Q.times = function (id) { return S().done[id] || 0; };
  Q.isReady = function () { var d = Q.active(); return !!d && Q.progress(d.id) >= d.goal; };
  Q.target = function () { var d = Q.active(); return d && (d.kind === 'hunt' || d.kind === 'mini') && Q.progress(d.id) < d.goal ? d.target : null; };

  Q.accept = function (id) {
    if (!BY[id] || Q.active()) return false;
    S().active = id; G.Save.save(); return true;
  };
  Q.abandon = function () {
    var d = Q.active(); if (!d) return false;
    S().prog[d.id] = 0; S().active = null; G.Save.save(); return true;
  };

  // ------------------------------------------------------------- Rotación del Tablón
  // Semilla = día (UTC) + nº de expediciones: el Tablón cambia al volver de cada salida y también un día después. ?quests=a,b,c fuerza las ofertas (pruebas).
  function hash(str) { var h = 2166136261; for (var i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
  function rng(seed) { return function () { seed |= 0; seed = seed + 0x6D2B79F5 | 0; var t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
  Q.dayIndex = function () { return Math.floor(Date.now() / 86400000); };
  Q.boardKey = function () { return Q.dayIndex() + ':' + G.Save.data.runs; };
  var cache = { key: null, list: null };
  Q.offers = function () {
    var key = Q.boardKey() + ':' + Q.times('bombs');
    if (cache.key === key) return cache.list;
    var forced = (/[?&]quests=([\w,]+)/.exec(location.search) || [])[1], out = [];
    if (forced) forced.split(',').forEach(function (id) { if (BY[id]) out.push(BY[id]); });
    else {
      var r = rng(hash(Q.boardKey()));
      ['A', 'B', 'C'].forEach(function (cat) {
        var pool = DEFS.filter(function (d) { return d.cat === cat; });
        if (cat === 'A' && !Q.times('bombs')) { out.push(BY.bombs); return; }   // el tutorial siempre se ofrece mientras no lo hayas hecho
        if (pool.length) out.push(pool[Math.floor(r() * pool.length)]);
      });
    }
    cache.key = key; cache.list = out;
    return out;
  };
  // Filas del Tablón: el encargo activo (si no está entre las ofertas) y las ofertas
  Q.board = function () {
    var act = Q.active(), list = Q.offers().slice();
    if (act && list.indexOf(act) < 0) list.unshift(act);
    return list;
  };

  // ------------------------------------------------------------- Progreso
  function done(d) {
    try { G.Hud.banner('¡ENCARGO LISTO! Vuelve con Vesper', 2400, '#9dffb4'); G.sfx('card_select', { vol: 0.8 }); } catch (e) { /* hud */ }
    G.Save.save();
  }
  function inc(d, n) {
    var p = Q.progress(d.id); if (p >= d.goal) return;
    S().prog[d.id] = Math.min(d.goal, p + (n || 1));
    if (S().prog[d.id] >= d.goal) done(d);
  }
  Q.onKill = function (type) {
    if (G.mode === 'practice') return;
    var d = Q.active(); if (!d || Q.progress(d.id) >= d.goal) return;
    if ((d.kind === 'hunt' || d.kind === 'mini') && d.target === type) inc(d);
    else if (d.kind === 'kills') inc(d);
    else if (d.kind === 'clean') Q.tick();
  };
  // Hook para romper partes de jefes: lo llama Q.onRunEnd por cada parte rota de la expedición; el sistema de jefes puede llamarlo en vivo si prefiere
  Q.onBossPart = function (bossId, key) { var d = Q.active(); if (d && d.kind === 'part') inc(d); };
  // Racha sin daño en vivo (el HUD lo llama cada frame mientras hay run)
  Q.tick = function () {
    var d = Q.active(); if (!d || d.kind !== 'clean' || Q.progress(d.id) >= d.goal) return;
    var s = Math.floor(G.Loot.cleanSecs());
    if (s > Q.progress(d.id)) { S().prog[d.id] = Math.min(d.goal, s); if (s >= d.goal) done(d); }
  };
  // Fin de expedición: info = { won, parts: [claves de partes de jefe rotas], hand: [ids], clean: segundos, lenMin }
  Q.onRunEnd = function (info) {
    var d = Q.active(); if (!d || Q.progress(d.id) >= d.goal) return null;
    if (d.kind === 'part') (info.parts || []).forEach(function (k) { Q.onBossPart(info.bossId, k); });
    else if (d.kind === 'clean') { var s = Math.floor(info.clean || 0); if (s > Q.progress(d.id)) { S().prog[d.id] = Math.min(d.goal, s); } }
    else if (d.kind === 'partkey') { if ((info.parts || []).indexOf(d.key) >= 0) S().prog[d.id] = 1; }
    else if (d.kind === 'nojump') { if (info.won && info.bossId === 'pastor' && !((info.hitBy || {}).boss_salto > 0)) S().prog[d.id] = 1; }
    else if (d.kind === 'win7') { if (info.won && info.lenMin === 7) S().prog[d.id] = 1; }
    else if (d.kind === 'wintag') {
      var n = (info.hand || []).filter(function (id) { var c = G.Cards.def(id); return c && c.tag === d.tag; }).length;
      if (info.won && n >= 3) S().prog[d.id] = 1;
    }
    G.Save.save();
    return Q.isReady() ? d : null;
  };

  // ------------------------------------------------------------- Entrega y textos
  function partsText(rp) { return Object.keys(rp).map(function (p) { return rp[p] + ' ' + G.Loot.part(p).short; }).join(', '); }
  Q.claim = function () {
    var d = Q.active(); if (!d || !Q.isReady()) return null;
    var Sv = G.Save.data, first = Q.times(d.id) === 0, pf = first ? d.pf : d.pfRepeat, k, mul = first ? 1 : Q.REPEAT_MUL, rp = {}, br = Math.round(d.brasas * mul);
    for (k in d.rewardParts) { rp[k] = Math.max(1, Math.round(d.rewardParts[k] * mul)); G.Save.add(k, rp[k]); }
    if (d.rare && first) { rp.rare = d.rare; G.Save.add('rare', d.rare); }
    Sv.brasas += br;
    var got = G.Tree.addPF(pf);
    Sv.quest.done[d.id] = Q.times(d.id) + 1; Sv.quest.prog[d.id] = 0; Sv.quest.active = null;
    G.Save.save();
    try { G.Ach.check(); } catch (e) { /* logros */ }
    return { text: partsText(rp) + ', ' + br + ' Brasas' + (got ? ', +' + got + ' PF' : ' (PF al tope)'), first: first };
  };

  Q.hudText = function () {
    var d = Q.active(); if (!d) return null;
    if (d.kind === 'clean') return d.label + ' ' + Math.min(d.goal, Math.max(Q.progress(d.id), Math.floor(G.Loot.cleanSecs()))) + '/' + d.goal + ' s';
    if (d.kind === 'wintag') return d.label + ' ' + Math.min(3, (G.Cards.mods.tagN || {})[d.tag] || 0) + '/3';
    if (d.kind === 'win7') return d.label + (G.RUN_LEN === 7 * 60000 ? '' : ' (elige 7 min)');
    if (d.kind === 'nojump') return d.label + (G.Boss.active ? ' - ¡cuidado!' : '');
    return d.label + ' ' + Math.min(d.goal, Q.progress(d.id)) + '/' + d.goal;
  };
  Q.progText = function (d) {
    var p = Q.progress(d.id);
    if (d.kind === 'clean') return 'mejor racha ' + p + '/' + d.goal + ' s';
    if (d.kind === 'wintag' || d.kind === 'win7' || d.kind === 'partkey' || d.kind === 'nojump') return p >= d.goal ? 'cumplido' : 'por cumplir';
    return p + '/' + d.goal + ' ' + d.label;
  };
  Q.statusLine = function () {
    var d = Q.active(); if (!d) return null;
    var p = Math.min(d.goal, Q.progress(d.id));
    return d.name + ': ' + (d.kind === 'wintag' || d.kind === 'win7' || d.kind === 'partkey' || d.kind === 'nojump' ? (p >= d.goal ? 'cumplido' : 'sin cumplir') : p + '/' + d.goal + (d.unit || '')) + (Q.isReady() ? '  (¡entrégalo a Vesper!)' : '');
  };
  // Marca "!" sobre Vesper: 'ready' (verde: entregable), 'new' (dorado: Tablón rotado desde la última visita y sin encargo activo) o null
  Q.seen = function () { G.Save.data.flags.qseen = Q.boardKey(); G.Save.save(); };
  Q.mark = function () {
    if (Q.isReady()) return 'ready';
    if (!Q.active() && G.Save.data.flags.qseen !== Q.boardKey()) return 'new';
    return null;
  };
  Q.rewardText = function (d, first) {
    if (first == null) first = Q.times(d.id) === 0;
    var mul = first ? 1 : Q.REPEAT_MUL, rp = {};
    for (var k in d.rewardParts) rp[k] = Math.max(1, Math.round(d.rewardParts[k] * mul));
    return Object.keys(rp).map(function (p) { return rp[p] + ' ' + G.Loot.part(p).short; }).join(' + ') + (d.rare && first ? ' + 1 Esencia' : '') + ' + ' + Math.round(d.brasas * mul) + ' Brasas + ' + (first ? d.pf : d.pfRepeat) + ' PF';
  };
  Q.tierName = function (t) { return t === 1 ? 'FÁCIL' : t === 2 ? 'MEDIO' : 'DIFÍCIL'; };
  Q.totalDone = function () { var n = 0, d = G.Save.data.quest.done; for (var k in d) n += d[k]; return n; };

  // =============================================================== LOGROS (Abuelo Lanudo)
  // Cada logro desbloquea un recuerdo que Lanudo cuenta. Sin recompensa material (la economía no cambia).
  var A = G.Ach = {};
  A.DEFS = [
    { id: 'first', name: 'Primera salida', desc: 'Termina tu primera expedición.', ok: function (s) { return s.runs >= 1; },
      lore: 'Tu primera salida... Yo volví de la mía sin la mitad del bigote. Tú pareces entero.' },
    { id: 'win', name: 'Mano ganadora', desc: 'Gana una expedición.', ok: function (s) { return s.wins >= 1; },
      lore: 'Una mano ganadora, y yo sin apostar. Mi abuela decía que las cartas eligen a quien las escucha.' },
    { id: 'pastor', name: 'Cazador del Pastor', desc: 'Vence al Pastor Corrupto.', ok: function (s) { return (s.bossKills.pastor || 0) > 0; },
      lore: 'Derribaste al Pastor... Era el mejor de nosotros. Cuando cayó, sentí que por fin descansaba.' },
    { id: 'karceron', name: 'Rompe-cadenas', desc: 'Vence a Karceron, el Carcelero.', ok: function (s) { return (s.bossKills.karceron || 0) > 0; },
      lore: 'Karceron guardaba la cripta desde antes que yo tuviera cuernos. Nadie le hizo ni cosquillas. Hasta ti.' },
    { id: 'letea', name: 'Memoria de Letea', desc: 'Vence a Letea, la Hidra del Olvido.', ok: function (s) { return (s.bossKills.letea || 0) > 0; },
      lore: 'Letea se comía los recuerdos, ¿sabes? Por eso olvidé tantas cosas. Gracias por devolverme alguna.' },
    { id: 'combos5', name: 'Alquimista', desc: 'Activa 5 combos distintos.', ok: function (s) { return Object.keys(s.combosSeen).length >= 5; },
      lore: 'Cinco mezclas distintas ya. Dos fuegos y un hielo hacen vapor, decía mi abuela. Y tenía razón.' },
    { id: 'combos12', name: 'Maestro de mezclas', desc: 'Activa los 12 combos.', ok: function (s) { return Object.keys(s.combosSeen).length >= 12; },
      lore: 'Los doce, nada menos. Ya no necesitas mis consejos, aunque seguiré dándotelos.' },
    { id: 'forja8', name: 'Aprendiz de Grum', desc: 'Forja 8 nodos distintos.', ok: function (s) { return Object.keys(s.ever).length >= 8; },
      lore: 'Grum casi sonríe cuando forjas. Casi. Es lo más cerca que le he visto.' },
    { id: 'arbol', name: 'Maestro de oficio', desc: 'Completa un árbol de forja entero.', ok: function () { return G.Tree.TABS.some(function (t) { return t.id !== 'trunk' && G.Tree.complete(t.id); }); },
      lore: 'Un oficio entero. Se dice que quien domina un camino ve los otros con otros ojos.' },
    { id: 'encargos', name: 'Mano derecha de Vesper', desc: 'Entrega 10 encargos.', ok: function () { return Q.totalDone() >= 10; },
      lore: 'Diez encargos... Vesper no confiaba en nadie, y mira ahora: te guarda los mejores.' },
    { id: 'plato', name: 'Buen diente', desc: 'Come 3 platos de Tía Castaña.', ok: function (s) { return (s.cooked || 0) >= 3; },
      lore: 'Castaña te da de comer como a un nieto. Aprovecha: su sopa cura más que mis historias.' }
  ];
  A.fresh = [];
  A.check = function () {
    var s = G.Save.data, out = [];
    A.DEFS.forEach(function (a) {
      if (s.ach[a.id]) return;
      var ok = false; try { ok = a.ok(s); } catch (e) { ok = false; }
      if (ok) { s.ach[a.id] = s.runs + 1; out.push(a); A.fresh.push(a); }
    });
    if (out.length) G.Save.save();
    return out;
  };
  A.count = function () { return A.DEFS.filter(function (a) { return G.Save.data.ach[a.id]; }).length; };
  A.unseen = function () { var f = G.Save.data.flags; return A.DEFS.filter(function (a) { return G.Save.data.ach[a.id] && !f['achseen_' + a.id]; }); };
  A.markSeen = function () { var f = G.Save.data.flags; A.DEFS.forEach(function (a) { if (G.Save.data.ach[a.id]) f['achseen_' + a.id] = 1; }); G.Save.save(); };
})();
