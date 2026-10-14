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
  // v3 (hotfix de economía): 12-15 % (antes 30-35 %). Ver DESIGN-v3-aldea.md sección C.
  // v5 (economía): TODAS estas probabilidades se multiplican por L.DROP_MUL (abajo). Meta: una expedición de 7 min = 1 craft de carta O 1 mejora de talento
  // (no ambas); 9-10 min = 1 craft + medio extra (ver README, tabla "Economía v5").
  L.DROP_MUL = 0.70;
  L.DROPS = {
    worm: ['thread', 0.12], warlock: ['thread', 0.14], archer: ['feather', 0.13], fanner: ['spine', 0.14], sower: ['spine', 0.14],
    boar: ['fang', 0.14], shield: ['plate', 0.14], bomb: ['wick', 0.13], scorcher: ['wick', 0.15], moth: ['frost', 0.14], blinker: ['static', 0.15]
  };
  // Garantía de élites y jefe (partes fijas) + probabilidad de Esencia rara (el jefe da 1 de trofeo seguro)
  // v5: los minijefes son ahora un reto real (más HP, partes rompibles, ataques nuevos) y su botín garantizado sube (antes plate 2 + feather 1 / spine 2 + thread 2, rare 20 %).
  // Romper su parte (Escudo / Saco) suelta además L.MINI_PART_BONUS. Además dan PF: ver Tree.onElite (L.PF_SOURCES.miniFrag).
  L.GUARANTEED = {
    mini_bulwark: { parts: { plate: 3, feather: 2, thread: 2 }, rare: 0.35 },
    mini_hive:    { parts: { spine: 3, thread: 3, feather: 1 }, rare: 0.35 },
    boss:         { parts: { fang: 2, thread: 2, feather: 1 }, rare: 1.0 }
  };
  L.RARE_P = 0.008;          // Esencia rara: 0,8 % por muerte de enemigo de coste >= 6 (Espectro, Ascua, Brujo; no élites)
  L.RARE_MIN_COST = 6;
  L.PITY_STEP = 0.004;       // +0,4 % por run sin rara (tope +4 %); se reinicia al conseguir una
  L.PITY_MAX = 0.04;
  L.MINI_PART_BONUS = { mini_bulwark: { plate: 2 }, mini_hive: { thread: 2 } };   // extra por romper la parte del minijefe (Escudo / Saco de larvas)
  // Brasas v5 (antes 12 % / 10 por min / 40 / jefe 150+40 por parte): una run de 7 min pasa de ~540 a ~340 Brasas; los crafts cuestan x1,5, así que
  // 1 craft ~ 20-25 % de las Brasas de una run (el resto: Tónico 80, Imán 120, partes de Rufo 24, reespecializar).
  L.BRASAS_ASH = 0.015;      // Brasas = 1,5 % de la Ceniza sobrante...
  L.BRASAS_MIN = 18;         // ... + 18 por minuto de run (reloj de la run, se congela con el jefe) ...
  L.BRASAS_GROW = 0.08;      // ... con un 8 % más por cada minuto acumulado: Brasas(m) = MIN * (m + GROW/2 * m^2); las runs largas rinden más que proporcionalmente
  L.BRASAS_WIN = 0;         // bonus por derrotar al Pastor
  // Jefes v4: Brasas y PF salen de la tabla del jefe (G.Boss.DEFS: 150 Brasas + 40 por parte rota; PF 2, 3 la 1.ª vez), x Peligro. Cada trofeo cuenta como 1 Esencia (parts.rare).
  // Coste de recetas y nodos (v5): multiplicadores GLOBALES sobre la tabla de abajo (L.COST / L.RANKCOST / L.NODE_TIER / costes fijos del Tronco). Las Esencias raras no se escalan.
  L.COST_MUL = { recipe: { parts: 1.25, brasas: 3.9 }, node: { parts: 0.8, brasas: 5.0 } };
  L.RANK_MUL = [1, 1, 1.08, 1.16];   // multiplicador por rango de forja (0 bloqueada, I, II, III): +8 % por rango
  L.MAXRANK = 3;

  // v5: L.EXPECT sigue siendo la ESCALA de las recetas (suministro v3); el suministro real ahora es x0,70 (DROP_MUL) y los costes llevan L.COST_MUL. Medido v5 (bot, 8 runs):
  //   7 min: 99 partes/run (Mecha 6,9), 175 Brasas, ~1,0 crafts o talentos por run; 9 min: 123 partes, 226 Brasas, ~1,4; 10 min: 137 partes, 254 Brasas, ~1,6 (README "Economía v5").
  // Suministro ESPERADO de cada parte por expedición estándar de 9:00 (v3: valores originales x0,42, ver DESIGN-v3-aldea.md C.3). Las recetas planas ("Clásica")
  // se expresan como fracción de este suministro; los nodos del árbol usan L.NODE_TIER (cifras absolutas).
  // MEDIDO con el bot (?speed=25 ?god=1, jugador que recoge partes y mata al jefe; 16 runs de 7 min, 10 de 9 min, política "build mínima primero"):
  //   7 min: ~119 partes/run, Mecha 9,5 (objetivo 8-12), Hebra 52, Esencia ~2,1 (el Pastor da 1 segura), Brasas ~254.
  //   9 min: ~148 partes/run, Mecha 12,8, Hebra 66, Esencia ~2,2, Brasas ~314. Un jugador real (se muere antes, recoge menos) saca ~x0,7.
  //   Build mínima de Fuego (Chispa II, Bola de brasa, Rango II, Manto, Bola II = 6 PF, 52 Mecha): completa tras la 5.ª expedición del bot (6-7 con jugador real).
  //   Árbol de Fuego completo (20 PF, ~170 Mecha): 15.ª expedición. Brasas sobran en esta fase (solo hay un árbol); Esencias tampoco limitan.
  L.EXPECT = { thread: 67, feather: 15, spine: 18, fang: 9, plate: 6, wick: 13, frost: 5.5, static: 7.6, rare: 1 };

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
    parts[main] = Math.max(3, Math.ceil(t.main * rc.k * L.EXPECT[main] * L.COST_MUL.recipe.parts));
    if (sec !== main) parts[sec] = Math.max(2, Math.ceil(t.sec * rc.k * L.EXPECT[sec] * L.COST_MUL.recipe.parts));
    var rare = L.RARE_NEED[toRank][L.TIER[id] || 'c'];
    if (rare) parts.rare = rare;
    return { parts: parts, brasas: Math.round(t.brasas * rc.b * L.COST_MUL.recipe.brasas), rare: rare };
  };
  // ----------------------------------------------------------------- Constantes del árbol, trueque y tienda (Fase 2a)
  L.NODE_TIER = { T1: { pf: 1, main: 10, sec: 5, brasas: 30 }, T2: { pf: 2, main: 16, sec: 7, brasas: 60 },
    T3: { pf: 3, main: 24, sec: 9, brasas: 100, rare: 1 }, T4: { pf: 4, main: 34, sec: 12, brasas: 150, rare: 2 } };
  L.PF_CAP = 24;                                        // techo de Puntos de Forja ganados (builds duras)
  L.TRADE = { ratio: 3, hebraRatio: 6, cupo: 4 };       // 3 partes comunes -> 1 (Hebra 6:1); 4 trueques por expedición
  L.SELL = 3; L.SELL_THREAD = 1;                        // Brasas por parte vendida
  L.BUY = { tonic: 80, magnet: 120, part: 24, partCupo: 3 };
  L.RESPEC = { brasasPerPF: 60, tree: 400, refund: 0.5 };   // reespecializar (v5, antes 40 / 250): 60 Brasas por PF devuelto o 400 el árbol; devuelve el 50 % de las partes
  L.PF_SOURCES = { gift: 1, migrate: 2, firstElite: 1, milestoneEvery: 4, miniFrag: 2 };   // miniFrag: cada minijefe abatido da 1 fragmento; 2 fragmentos = 1 PF (matar los dos en una run = +1 PF)
  // Cartas que se obtienen por el árbol (no por la receta plana "Clásica"): las de Fuego y las neutras del Tronco
  L.TREE_CARDS = { spark: 1, ember: 1, ring: 1, mantle: 1, hooves: 1, magnet: 1, satchel: 1 };
  L.classic = function (id) { return !L.TREE_CARDS[id]; };

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
    G.Cards.defs.forEach(function (d) { if (d.id && L.classic(d.id) && !L.unlocked(d.id) && L.canForge(d.id)) out[d.id] = true; });
    return out;
  };

  // ----------------------------------------------------------------- Drops en la run
  L.resetRun = function () { L.run = { parts: {}, total: 0, rare: 0, kills: {}, pf: 0, trophies: [], boss: null }; };
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
    try { G.Quests.onKill(t); if (B.enemy[t].elite) G.Tree.onElite(t, e); } catch (x) { /* meta opcional */ }
    var pityP = L.RARE_P + (G.Save.data.pity || 0);
    var gt = L.GUARANTEED[t];
    if (gt) {
      for (var k in gt.parts) drop(e, k, gt.parts[k]);
      if (Math.random() < gt.rare) drop(e, 'rare', 1);
      return;
    }
    var d = L.DROPS[t]; if (!d) return;
    if (Math.random() < d[1] * L.DROP_MUL) drop(e, d[0], 1);
    if (B.enemy[t].cost >= L.RARE_MIN_COST && Math.random() < pityP) drop(e, 'rare', 1);
  };
  // Parte rota de un minijefe (Escudo / Saco): botín extra garantizado
  L.onMiniPart = function (e) {
    var b = L.MINI_PART_BONUS[e.type]; if (!b) return;
    for (var k in b) drop(e, k, b[k]);
  };
  L.collect = function (part, trophy) {
    var R = L.run; R.parts[part] = (R.parts[part] || 0) + 1; R.total++;
    if (part === 'rare') R.rare++;
    if (trophy) R.trophies.push(trophy);
  };

  // Fin de expedición: auto-recoge lo que quede en el suelo, calcula Brasas, aplica pity, guarda y prepara el resumen
  L.endRun = function (won) {
    var i, g, S = G.Save.data, R = L.run, p = G.player;
    for (i = G.gems.length - 1; i >= 0; i--) { g = G.gems[i]; if (g.kind === 'part') { L.collect(g.part, g.trophy); G.gems.splice(i, 1); } }
    var mins = Math.max(0, (G.runT - G.t0) / 60000);
    var brasas = Math.round(p.ash * L.BRASAS_ASH + L.BRASAS_MIN * (mins + L.BRASAS_GROW / 2 * mins * mins) + (won ? L.BRASAS_WIN : 0));
    for (var k in R.parts) G.Save.add(k, R.parts[k]);
    // jefe (v4): Brasas por parte rota siempre; las del jefe, los PF y el récord solo si cae
    var bs = R.boss, binfo = null;
    if (bs && G.Boss.DEFS[bs.id]) {
      var BD = G.Boss.DEFS[bs.id], bm = G.Boss.PELIGRO[G.clamp(Math.round(G.peligro || 1), 1, 5)].brasas, be = G.Boss.e;
      var bb = Math.round(((bs.won ? BD.brasas : 0) + BD.brasasPart * bs.parts.length) * bm), bpf = 0;
      if (bs.won) {
        var kn = S.bossKills[bs.id] || 0; S.bossKills[bs.id] = kn + 1;
        bpf = G.Tree.addPF(kn === 0 ? BD.pfFirst : BD.pf); R.pf = (R.pf || 0) + bpf;
      }
      brasas += bb;
      R.trophies.forEach(function (tr) { S.trophies[tr] = (S.trophies[tr] || 0) + 1; });
      binfo = { id: bs.id, name: BD.name, won: !!bs.won, parts: bs.parts.slice(), brasas: bb, pf: bpf, time: bs.time || (be ? G.Boss.combatT : 0), hpFrac: bs.won ? 0 : (be ? Math.max(0, be.hp / be.maxHp) : 1), trophies: R.trophies.slice(), first: bs.won && bpf >= BD.pfFirst };
    }
    S.brasas += brasas; S.runs++; if (won) S.wins++;
    S.pity = R.rare > 0 ? 0 : Math.min(L.PITY_MAX, (S.pity || 0) + L.PITY_STEP);
    S.shop = { trade: 0, tonic: 0, magnet: 0, part: 0 };   // cupos de Rufo: se reinician al volver de una salida
    G.Save.save();
    var aff = L.affordable(), fresh = [];
    for (var id in aff) if (!L.startAff[id]) fresh.push(id);
    var q = null; try { q = G.Quests.statusLine(); } catch (x) { /* sin encargos */ }
    L.summary = { parts: R.parts, total: R.total, brasas: brasas, rare: R.rare, newCards: fresh, won: won, kills: G.kills, quest: q, pfGained: R.pf || 0, boss: binfo };
  };
  L.beginRun = function () { L.resetRun(); L.startAff = L.affordable(); L.summary = null; };
})();
