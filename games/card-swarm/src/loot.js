/* loot.js - Botín, partes y forja de Swarm Hand. TODA LA TABLA DE BALANCE DE LA META ESTÁ EN ESTE ARCHIVO (sección BALANCE).
   Fase 1: 8 partes comunes (una por familia de enemigo) + 1 parte rara universal, drops por enemigo/élite/jefe, Brasas,
   recetas de desbloqueo y Rango de forja I-III permanente (+8 % por rango, multiplicador por carta). */
(function () {
  'use strict';
  var G = window.G, B = G.B, L = G.Loot = {};

  // ================================================================= BALANCE
  L.PARTS = [
    { id: 'thread',  name: 'Hebra de larva',      short: 'Hebra',   color: '#e8dcb0', tag: 'neutral' },
    { id: 'feather', name: 'Pluma emplumada',     short: 'Pluma',   color: '#f2efe6', tag: 'neutral' },
    { id: 'spine',   name: 'Púa de erizo',        short: 'Púa',     color: '#7be34a', tag: 'poison' },
    { id: 'fang',    name: 'Colmillo de jabalí',  short: 'Colmillo', color: '#e8486a', tag: 'blood' },
    { id: 'plate',   name: 'Placa de pavés',      short: 'Placa',   color: '#b8c0cc', tag: 'steel' },
    { id: 'wick',    name: 'Mecha chamuscada',    short: 'Mecha',   color: '#ff7a2a', tag: 'fire' },
    { id: 'frost',   name: 'Polvo de escarcha',   short: 'Escarcha', color: '#6ac8ff', tag: 'ice' },
    { id: 'static',  name: 'Jirón estático',      short: 'Jirón',   color: '#ffe45a', tag: 'lightning' },
    { id: 'rare',    name: 'Esencia rara',        short: 'Esencia', color: '#c070ff', tag: 'neutral', rare: true }
  ];
  var PBY = {}; L.PARTS.forEach(function (p) { PBY[p.id] = p; });
  L.part = function (id) { return PBY[id]; };

  // Parte común que suelta cada enemigo normal y probabilidad (comunes 30-35 %). Los invocados (summoned) no sueltan.
  L.DROPS = {
    worm: ['thread', 0.30], warlock: ['thread', 0.35], archer: ['feather', 0.32], fanner: ['spine', 0.33], sower: ['spine', 0.35],
    boar: ['fang', 0.33], shield: ['plate', 0.33], bomb: ['wick', 0.30], scorcher: ['wick', 0.35], moth: ['frost', 0.33], blinker: ['static', 0.35]
  };
  // Garantía de élites y jefe (partes fijas) + probabilidad de Esencia rara (el jefe da 1 de trofeo seguro)
  L.GUARANTEED = {
    mini_bulwark: { parts: { plate: 3, feather: 1 }, rare: 0.35 },
    mini_hive:    { parts: { spine: 3, thread: 2 }, rare: 0.35 },
    boss:         { parts: { fang: 2, thread: 3, feather: 2 }, rare: 1.0 }
  };
  L.RARE_P = 0.035;          // Esencia rara: 3,5 % por muerte de enemigo de coste >= 6 (Espectro, Ascua, Brujo; no élites)
  L.RARE_MIN_COST = 6;
  L.PITY_STEP = 0.015;       // +1,5 % por run sin rara; se reinicia al conseguir una
  L.BRASAS_ASH = 0.20;       // Brasas = 20 % de la Ceniza sobrante...
  L.BRASAS_MIN = 15;         // ... + 15 por minuto sobrevivido
  L.BRASAS_WIN = 40;         // bonus por derrotar al Pastor
  L.RANK_MUL = [1, 1, 1.08, 1.16];   // multiplicador por rango de forja (0 bloqueada, I, II, III): +8 % por rango
  L.MAXRANK = 3;

  // Suministro ESPERADO de cada parte por expedición estándar de 9:00, medido con el bot de pruebas (16 runs, ?speed=25 ?god=1, jugador que
  // llega al jefe y lo mata; ~350 partes/run: 7 min = 78 %, 10 min = 110 %). La receta se expresa como fracción de ese suministro.
  L.EXPECT = { thread: 160, feather: 35, spine: 43, fang: 21, plate: 15, wick: 30, frost: 13, static: 18, rare: 5 };
  // CUENTA ESPERADA (por qué salen 3-4 runs). La build "Tormenta tóxica" (Chispazo c + Tormenta e + Nube r + Bilis r + Cascabel r, todas por forjar)
  // pide Jirón (static) 56 = 3.1 x el suministro de 18/run y Púa 93 = 2.2 x 43/run, más Hebra y Esencia sueltas: la parte limitante manda,
  // ~3.1-3.5 runs medias + dispersión de los drops. Medido con el bot completo (forjando en el bucle, 24 builds): 5 forjas = 3.61 runs de media
  // (todas entre 3 y 4), 4 forjas = 2.67. Brasas (~460/run) y Esencia (~5/run) NO limitan; limitan Jirón, Mecha, Placa y Púa según la build.
  // Una run de 7 min da ~78 % de ese suministro y una de 10 min ~110 %. Un jugador que muera antes del jefe saca bastante menos (ver README).

  // Rareza de cada carta (c común, r rara, e épica). Las 6 iniciales (set básico) son gratis y solo cuestan sus mejoras de rango.
  L.TIER = {
    spark: 'c', dart: 'c', shard: 'c', dagger: 'c', fang: 'c', hourglass: 'c',
    ember: 'c', nova: 'c', zap: 'c', pool: 'c', bleed: 'c', hooves: 'c', heart: 'c', thorns: 'c',
    mantle: 'r', frost: 'r', bell: 'r', bile: 'r', whet: 'r', magnet: 'r', satchel: 'r', cloud: 'r',
    ring: 'e', blizzard: 'e', storm: 'e', axe: 'e'
  };
  // Parte principal y secundaria según etiqueta
  L.MAIN = { fire: 'wick', ice: 'frost', lightning: 'static', poison: 'spine', blood: 'fang', steel: 'plate', neutral: 'thread' };
  L.SEC = { fire: 'thread', ice: 'feather', lightning: 'thread', poison: 'thread', blood: 'feather', steel: 'feather', neutral: 'feather' };
  // Coste por tier: fracción del suministro/run de la parte principal y secundaria, Brasas y Esencias raras
  L.COST = {
    c: { main: 0.68, sec: 0.34, brasas: 40 },
    r: { main: 1.08, sec: 0.47, brasas: 75 },
    e: { main: 1.35, sec: 0.60, brasas: 120 }
  };
  // Multiplicador de coste por rango destino (1 = desbloquear)
  L.RANKCOST = { 1: { k: 1.0, b: 1.0 }, 2: { k: 0.9, b: 1.3 }, 3: { k: 1.5, b: 2.0 } };
  // Esencias raras por rango destino y rareza de carta (solo épicas al desbloquear; rango III de rara/épica)
  L.RARE_NEED = { 1: { c: 0, r: 0, e: 1 }, 2: { c: 0, r: 0, e: 0 }, 3: { c: 0, r: 1, e: 2 } };

  // ----------------------------------------------------------------- Recetas
  // Devuelve { parts: {id: n}, brasas, rare } para pasar a `toRank` (1 = desbloquear). Máximo 3 tipos de parte.
  L.recipe = function (id, toRank) {
    var d = G.Cards.def(id), t = L.COST[L.TIER[id] || 'c'], rc = L.RANKCOST[toRank], parts = {}, main = L.MAIN[d.tag], sec = L.SEC[d.tag];
    parts[main] = Math.max(3, Math.ceil(t.main * rc.k * L.EXPECT[main]));
    if (sec !== main) parts[sec] = Math.max(2, Math.ceil(t.sec * rc.k * L.EXPECT[sec]));
    var rare = L.RARE_NEED[toRank][L.TIER[id] || 'c'];
    if (rare) parts.rare = rare;
    return { parts: parts, brasas: Math.round(t.brasas * rc.b), rare: rare };
  };
  L.nextRank = function (id) { var r = G.Save.rank(id); return r >= L.MAXRANK ? 0 : r + 1; };
  L.canForge = function (id) {
    var nr = L.nextRank(id); if (!nr) return false;
    var r = L.recipe(id, nr), S = G.Save.data;
    if (S.brasas < r.brasas) return false;
    for (var k in r.parts) if ((S.parts[k] || 0) < r.parts[k]) return false;
    return true;
  };
  L.forge = function (id) {
    if (!L.canForge(id)) return false;
    var nr = L.nextRank(id), r = L.recipe(id, nr), S = G.Save.data;
    for (var k in r.parts) S.parts[k] -= r.parts[k];
    S.brasas -= r.brasas; S.cards[id] = nr;
    G.Save.save();
    return nr;
  };
  L.unlocked = function (id) { return G.Save.rank(id) > 0; };
  L.rm = function (id) { return L.RANK_MUL[G.Save.rank(id)] || 1; };
  L.affordable = function () {
    var out = {};
    G.Cards.defs.forEach(function (d) { if (d.id && !L.unlocked(d.id) && L.canForge(d.id)) out[d.id] = true; });
    return out;
  };

  // ----------------------------------------------------------------- Drops en la run
  L.resetRun = function () { L.run = { parts: {}, total: 0, rare: 0, kills: {} }; };
  L.resetRun();

  function drop(e, part, n) {
    for (var i = 0; i < n; i++) {
      G.Combat.dropGem(e.x, e.y, 'part', 1);
      G.gems[G.gems.length - 1].part = part;
    }
  }
  L.onKill = function (e) {
    if (e.summoned) return;
    var t = e.type, R = L.run; R.kills[t] = (R.kills[t] || 0) + 1;
    var pityP = L.RARE_P + (G.Save.data.pity || 0);
    var gt = L.GUARANTEED[t];
    if (gt) {
      for (var k in gt.parts) drop(e, k, gt.parts[k]);
      if (Math.random() < gt.rare) drop(e, 'rare', 1);
      return;
    }
    var d = L.DROPS[t]; if (!d) return;
    if (Math.random() < d[1]) drop(e, d[0], 1);
    if (B.enemy[t].cost >= L.RARE_MIN_COST && Math.random() < pityP) drop(e, 'rare', 1);
  };
  L.collect = function (part) {
    var R = L.run; R.parts[part] = (R.parts[part] || 0) + 1; R.total++;
    if (part === 'rare') R.rare++;
  };

  // Fin de expedición: auto-recoge lo que quede en el suelo, calcula Brasas, aplica pity, guarda y prepara el resumen
  L.endRun = function (won) {
    var i, g, S = G.Save.data, R = L.run, p = G.player;
    for (i = G.gems.length - 1; i >= 0; i--) { g = G.gems[i]; if (g.kind === 'part') { L.collect(g.part); G.gems.splice(i, 1); } }
    var mins = Math.max(0, (G.time - G.t0) / 60000);
    var brasas = Math.round(p.ash * L.BRASAS_ASH + L.BRASAS_MIN * mins + (won ? L.BRASAS_WIN : 0));
    for (var k in R.parts) G.Save.add(k, R.parts[k]);
    S.brasas += brasas; S.runs++; if (won) S.wins++;
    S.pity = R.rare > 0 ? 0 : Math.min(1, (S.pity || 0) + L.PITY_STEP);
    G.Save.save();
    var aff = L.affordable(), fresh = [];
    for (var id in aff) if (!L.startAff[id]) fresh.push(id);
    L.summary = { parts: R.parts, total: R.total, brasas: brasas, rare: R.rare, newCards: fresh, won: won, kills: G.kills };
  };
  L.beginRun = function () { L.resetRun(); L.startAff = L.affordable(); L.summary = null; };
})();
