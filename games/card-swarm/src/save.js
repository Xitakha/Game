/* save.js - Guardado local de Swarm Hand (localStorage con try/catch y versión de esquema).
   Datos: partes, Brasas, rango de forja por carta (0 = bloqueada), anclas, duración elegida, runs y pity de rara.
   URL: ?reset=1 borra el guardado · ?give=wick:20,frost:5,brasas:100 (o all:30) añade partes para depurar. */
(function () {
  'use strict';
  var G = window.G, S = G.Save = {};
  var KEY = 'swarmhand.save', VERSION = 1;
  var STARTERS = ['spark', 'shard', 'dart', 'dagger', 'fang', 'hourglass'];   // set básico desbloqueado (Rango I)
  S.STARTERS = STARTERS;
  S.ok = true;   // false si localStorage no está disponible (se juega igual, sin persistir)

  function fresh() {
    var cards = {}; STARTERS.forEach(function (id) { cards[id] = 1; });
    return { v: VERSION, parts: {}, brasas: 0, cards: cards, anchors: ['spark', 'dart'], len: 9, runs: 0, wins: 0, pity: 0, firstBuildRuns: null };
  }

  S.save = function () {
    try { localStorage.setItem(KEY, JSON.stringify(S.data)); S.ok = true; } catch (e) { S.ok = false; }
  };

  S.load = function () {
    var d = null;
    try { var raw = localStorage.getItem(KEY); if (raw) d = JSON.parse(raw); } catch (e) { d = null; S.ok = false; }
    // esquema: si la versión no coincide o está corrupto, se descarta (sin migraciones en Fase 1)
    if (!d || d.v !== VERSION || typeof d.parts !== 'object' || typeof d.cards !== 'object') d = fresh();
    var f = fresh();
    for (var k in f) if (d[k] == null) d[k] = f[k];
    STARTERS.forEach(function (id) { if (!d.cards[id]) d.cards[id] = 1; });
    S.data = d;
    return d;
  };

  S.reset = function () {
    try { localStorage.removeItem(KEY); } catch (e) { /* sin storage */ }
    S.data = fresh(); S.save();
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
      S.save();
    }
    if ((m = /[?&]len=(\d+)/.exec(q))) G.lenOverride = G.clamp(parseInt(m[1], 10), 2, 20);
  };
})();
