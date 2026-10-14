/* save.js - Guardado local de Swarm Hand (localStorage con try/catch y versión de esquema).
   v2 (Aldea): partes, Brasas, rango de forja por carta (0 = bloqueada), anclas, duración, runs, pity de rara, Puntos de Forja (pf),
   nodos del árbol (nodes), encargos (quest), cupos de Rufo (shop), compras pendientes (pending) y flags de diálogo (flags).
   Migración v1 -> v2 sin perder progreso (se conservan partes, Brasas, rangos y anclas; +2 PF de compensación).
   URL: ?reset=1 borra el guardado · ?give=wick:20,frost:5,brasas:100 (o all:30) añade partes · ?pf=<n> añade Puntos de Forja. */
(function () {
  'use strict';
  var G = window.G, S = G.Save = {};
  var KEY = 'swarmhand.save', VERSION = 2;
  var STARTERS = ['spark', 'shard', 'dart', 'dagger', 'fang', 'hourglass'];   // set básico desbloqueado (Rango I)
  S.STARTERS = STARTERS;
  S.VERSION = VERSION;
  S.ok = true;   // false si localStorage no está disponible (se juega igual, sin persistir)

  function fresh() {
    var cards = {}; STARTERS.forEach(function (id) { cards[id] = 1; });
    return { v: VERSION, parts: {}, brasas: 0, cards: cards, anchors: ['spark', 'dart'], len: 9, runs: 0, wins: 0, pity: 0, firstBuildRuns: null,
      pf: { earned: 1 },                       // 1 PF de regalo
      nodes: {},                               // id -> { c: elección ('1' | 'A' | 'B'), free: 1 si es heredado/gratis, r: 1 si dio +1 rango }
      ever: {}, mile: 0,                       // nodos comprados alguna vez (hitos "Maestría de oficio") y hitos ya cobrados
      respecFree: 1,                           // el primer reespecializado es gratis
      elites: {},                              // primer élite abatido de cada tipo (+1 PF)
      quest: { active: null, prog: {}, done: {} },
      shop: { trade: 0, tonic: 0, magnet: 0, part: 0 }, pending: { tonic: 0, magnet: 0 },
      flags: {},
      bossKills: {}, trophies: {}, bossSeen: {}, biome: 'bosque' };   // v4: jefes vencidos por id, trofeos acumulados, intro ya vista, destino elegido en el Portal
  }

  S.save = function () {
    try { localStorage.setItem(KEY, JSON.stringify(S.data)); S.ok = true; } catch (e) { S.ok = false; }
  };

  function migrate(d) {
    if (!d || typeof d !== 'object' || typeof d.parts !== 'object' || typeof d.cards !== 'object' || !d.parts || !d.cards) return null;
    if (d.v === 1) {   // Fase 1 -> Aldea: se conserva todo; compensación de 2 PF además del regalo
      d.v = 2; d.pf = { earned: 1 + 2 }; d.flags = { migrated: 1 };
    }
    return d.v === VERSION ? d : null;
  }

  S.load = function () {
    var d = null;
    try { var raw = localStorage.getItem(KEY); if (raw) d = migrate(JSON.parse(raw)); } catch (e) { d = null; S.ok = false; }
    if (!d) d = fresh();
    var f = fresh();
    for (var k in f) if (d[k] == null) d[k] = f[k];
    ['pf', 'nodes', 'ever', 'elites', 'quest', 'shop', 'pending', 'flags', 'bossKills', 'trophies', 'bossSeen'].forEach(function (key) { if (typeof d[key] !== 'object' || !d[key]) d[key] = f[key]; });
    ['prog', 'done'].forEach(function (key) { if (!d.quest[key] || typeof d.quest[key] !== 'object') d.quest[key] = {}; });
    if (typeof d.pf.earned !== 'number') d.pf.earned = 1;
    if (!Array.isArray(d.anchors)) d.anchors = f.anchors;
    STARTERS.forEach(function (id) { if (!d.cards[id]) d.cards[id] = 1; });
    S.data = d;
    return d;
  };

  S.reset = function () {
    try { localStorage.removeItem(KEY); } catch (e) { /* sin storage */ }
    S.data = fresh(); S.save();
    try { G.Tree.sync(); } catch (e) { /* árbol aún no cargado */ }
  };

  S.add = function (part, n) { S.data.parts[part] = (S.data.parts[part] || 0) + n; };
  S.rank = function (id) { return S.data.cards[id] || 0; };

  // Parámetros de URL de depuración (se aplican tras cargar)
  S.applyUrl = function () {
    var q = location.search, m;
    if (/[?&]reset=1/.test(q)) S.reset();
    S.load();
    if ((m = /[?&]give=([^&]+)/.exec(q))) {
      decodeURIComponent(m[1]).split(',').forEach(function (kv) {
        var a = kv.split(':'), id = a[0], n = parseInt(a[1], 10) || 1;
        if (id === 'brasas') S.data.brasas += n;
        else if (id === 'all') G.Loot.PARTS.forEach(function (p) { S.add(p.id, n); });
        else if (G.Loot.part(id)) S.add(id, n);
      });
    }
    if ((m = /[?&]pf=(\d+)/.exec(q))) S.data.pf.earned = Math.min(G.Loot.PF_CAP, S.data.pf.earned + parseInt(m[1], 10));
    S.save();
    if ((m = /[?&]len=(\d+)/.exec(q))) G.lenOverride = G.clamp(parseInt(m[1], 10), 2, 20);
  };
})();
