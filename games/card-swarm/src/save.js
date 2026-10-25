/* save.js - Guardado local de Swarm Hand (localStorage con try/catch y versión de esquema).
   v7 (P6, Panal + Melaria): peligro.melaria; el Panal se abre al vencer a Yarlak (bossKills.yarlak). Migración v6 -> v7 con copia en swarmhand.save.v6; quien ya venció a Yarlak ve el Panal abierto.
   v6 (P4.5, minijefes): insignias { id: n } (trofeo menor de cada minijefe) y elites por SLOT (mini_slot1 / mini_slot2 en vez de mini_bulwark / mini_hive). Migración v5 -> v6 con copia en swarmhand.save.v5.
   v5 (P4, Tundra + Yarlak): peligro.yarlak; la Tundra se abre al vencer a Letea (bossKills.letea). Migración v4 -> v5 con copia en swarmhand.save.v4; quien ya venció a Letea ve la Tundra abierta.
   v4 (Jefes J3): Peligro por jefe (peligro[id] = máximo desbloqueado, peligroSel[id] = elegido en el Portal), victorias por Peligro (pelWins), cacería (hunts[id][P] = { wins, tries, best }),
   intentos de práctica (practice[id]). Migración v3 -> v4 con copia de seguridad en swarmhand.save.v3: quien ya había vencido a un jefe parte con el Peligro II abierto.
   v3 (Aldea 2b): loadouts (3 slots de Ulalume), plato de Tía Castaña (pending.dish / shop.dish), logros (ach), combos vistos (combosSeen), racha de derrotas (lossStreak).
   Migración v2 -> v3 sin perder nada (copia de seguridad del guardado antiguo en swarmhand.save.v2 y try/catch).
   v2 (Aldea): partes, Brasas, rango de forja por carta (0 = bloqueada), anclas, duración, runs, pity de rara, Puntos de Forja (pf),
   nodos del árbol (nodes), encargos (quest), cupos de Rufo (shop), compras pendientes (pending) y flags de diálogo (flags).
   Migración v1 -> v2 sin perder progreso (se conservan partes, Brasas, rangos y anclas; +2 PF de compensación).
   URL: ?reset=1 borra el guardado · ?give=wick:20,frost:5,brasas:100 (o all:30) añade partes · ?pf=<n> añade Puntos de Forja. */
(function () {
  'use strict';
  var G = window.G, S = G.Save = {};
  var KEY = 'swarmhand.save', VERSION = 7;
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
      elites: {},                              // primer élite abatido de cada SLOT (+1 PF; v6: mini_slot1 / mini_slot2)
      insignias: {},                           // v6: Insignias de los minijefes (id -> veces)
      quest: { active: null, prog: {}, done: {} },
      shop: { trade: 0, tonic: 0, magnet: 0, part: 0, dish: 0 }, pending: { tonic: 0, magnet: 0, dish: null },
      flags: {},
      bossKills: {}, trophies: {}, bossSeen: {}, biome: 'bosque',
      loadouts: [null, null, null],            // v3: { name, anchors: [ids], dish: id|null, len: 7|9|10 }
      ach: {}, combosSeen: {}, cooked: 0, lossStreak: 0,
      peligro: { pastor: 1, karceron: 1, letea: 1, yarlak: 1, melaria: 1 }, peligroSel: {}, pelWins: {}, hunts: {}, practice: {} };   // v4 (J3)   // v4: jefes vencidos por id, trofeos acumulados, intro ya vista, destino elegido en el Portal
  }

  var warned = false;
  S.save = function () {
    try { localStorage.setItem(KEY, JSON.stringify(S.data)); S.ok = true; }
    catch (e) {
      S.ok = false;   // modo privado, cuota llena o almacenamiento bloqueado: se sigue jugando en memoria y se avisa una vez
      if (!warned && G.Sys && G.Sys.toast) { warned = true; G.Sys.toast('El navegador no deja guardar el progreso. Exporta tu guardado en Ajustes.', { close: true, ms: 9000 }); }
    }
  };

  function migrate(d) {
    if (!d || typeof d !== 'object' || typeof d.parts !== 'object' || typeof d.cards !== 'object' || !d.parts || !d.cards) return null;
    if (d.v === 1) {   // Fase 1 -> Aldea: se conserva todo; compensación de 2 PF además del regalo
      d.v = 2; d.pf = { earned: 1 + 2 }; d.flags = { migrated: 1 };
    }
    if (d.v === 2) {   // Aldea 2a -> 2b: solo se añaden campos (load() rellena los que faltan con los valores por defecto)
      d.v = 3; d.flags = (d.flags && typeof d.flags === 'object') ? d.flags : {}; d.flags.migrated3 = 1;
    }
    if (d.v === 3) {   // Jefes J3: Peligro por jefe, cacería y práctica. Todas las victorias anteriores fueron en Peligro I -> Peligro II abierto
      d.v = 4; d.peligro = { pastor: 1, karceron: 1, letea: 1 }; d.pelWins = {}; d.hunts = {}; d.practice = {}; d.peligroSel = {};
      var bk = (d.bossKills && typeof d.bossKills === 'object') ? d.bossKills : {};
      ['pastor', 'karceron', 'letea'].forEach(function (id) { if ((bk[id] || 0) > 0) { d.peligro[id] = 2; d.pelWins[id] = { 1: bk[id] }; } });
      d.flags = (d.flags && typeof d.flags === 'object') ? d.flags : {}; d.flags.migrated4 = 1;
    }
    if (d.v === 4) {   // P4: Yarlak (Tundra). Solo se añade su Peligro; el desbloqueo de la Tundra sale de bossKills.letea
      d.v = 5; d.peligro = (d.peligro && typeof d.peligro === 'object') ? d.peligro : {}; if (!d.peligro.yarlak) d.peligro.yarlak = 1;
      d.flags = (d.flags && typeof d.flags === 'object') ? d.flags : {}; d.flags.migrated5 = 1;
    }
    if (d.v === 5) {   // P4.5: elites por slot (mini_bulwark -> mini_slot1, mini_hive -> mini_slot2) e insignias
      d.v = 6; var el = (d.elites && typeof d.elites === 'object') ? d.elites : {}; d.elites = {};
      Object.keys(el).forEach(function (k) { d.elites[k === 'mini_bulwark' ? 'mini_slot1' : k === 'mini_hive' ? 'mini_slot2' : k] = el[k]; });
      d.insignias = {}; d.flags = (d.flags && typeof d.flags === 'object') ? d.flags : {}; d.flags.migrated6 = 1;
    }
    if (d.v === 6) {   // P6: Melaria (Panal). Solo se añade su Peligro; el desbloqueo del Panal sale de bossKills.yarlak
      d.v = 7; d.peligro = (d.peligro && typeof d.peligro === 'object') ? d.peligro : {}; if (!d.peligro.melaria) d.peligro.melaria = 1;
      d.flags = (d.flags && typeof d.flags === 'object') ? d.flags : {}; d.flags.migrated7 = 1;
    }
    return d.v === VERSION ? d : null;
  }

  S.load = function () {
    var d = null;
    try {
      var raw = localStorage.getItem(KEY);
      if (raw) {
        var parsed = JSON.parse(raw);
        if (parsed && parsed.v && parsed.v < VERSION) { try { localStorage.setItem(KEY + '.v' + parsed.v, raw); } catch (e2) { /* sin espacio */ } }   // copia de seguridad antes de migrar
        d = migrate(parsed);
      }
    } catch (e) { d = null; S.ok = false; }
    return S.adopt(d);
  };

  // Rellena los campos que falten con los valores por defecto y lo deja como guardado actual (lo usa también la importación)
  S.adopt = function (d) {
    if (!d) d = fresh();
    var f = fresh();
    for (var k in f) if (d[k] == null) d[k] = f[k];
    ['pf', 'nodes', 'ever', 'elites', 'quest', 'shop', 'pending', 'flags', 'bossKills', 'trophies', 'bossSeen', 'ach', 'combosSeen', 'peligro', 'peligroSel', 'pelWins', 'hunts', 'practice', 'insignias'].forEach(function (key) { if (typeof d[key] !== 'object' || !d[key]) d[key] = f[key]; });
    if (!Array.isArray(d.loadouts)) d.loadouts = [null, null, null];
    while (d.loadouts.length < 3) d.loadouts.push(null);
    d.loadouts = d.loadouts.slice(0, 3).map(function (l) { return l && typeof l === 'object' && Array.isArray(l.anchors) ? l : null; });
    if (!d.peligro.yarlak) d.peligro.yarlak = 1;
    if (!d.peligro.melaria) d.peligro.melaria = 1;
    if (typeof d.pending.dish === 'undefined') d.pending.dish = null;
    if (typeof d.shop.dish !== 'number') d.shop.dish = 0;
    if (typeof d.lossStreak !== 'number') d.lossStreak = 0;
    if (d.len !== 7 && d.len !== 9 && d.len !== 10) d.len = 9;   // última duración elegida (L.DUR): valor desconocido o ausente -> Normal
    ['prog', 'done'].forEach(function (key) { if (!d.quest[key] || typeof d.quest[key] !== 'object') d.quest[key] = {}; });
    if (typeof d.pf.earned !== 'number') d.pf.earned = 1;
    if (!Array.isArray(d.anchors)) d.anchors = f.anchors;
    STARTERS.forEach(function (id) { if (!d.cards[id]) d.cards[id] = 1; });
    S.data = d;
    return d;
  };

  // Exportar / importar como texto (copia de seguridad que sobrevive a limpiar el navegador o cambiar de móvil). Formato: 'SWARM1:' + base64(JSON utf-8)
  S.exportText = function () {
    S.save();
    return 'SWARM1:' + btoa(unescape(encodeURIComponent(JSON.stringify(S.data))));
  };
  S.importText = function (txt) {
    txt = String(txt || '').trim();
    var d;
    try {
      var json = /^SWARM1:/.test(txt) ? decodeURIComponent(escape(atob(txt.slice(7).replace(/\s+/g, '')))) : txt;
      d = JSON.parse(json);
    } catch (e) { return { ok: false, err: 'Ese texto no es un guardado de Swarm Hand.' }; }
    if (d && d.v > VERSION) return { ok: false, err: 'El guardado es de una versión más nueva del juego.' };
    d = migrate(d);
    if (!d) return { ok: false, err: 'Guardado no reconocido.' };
    try { var cur = localStorage.getItem(KEY); if (cur) localStorage.setItem(KEY + '.antes-de-importar', cur); } catch (e2) { /* sin storage */ }
    S.adopt(d); S.save();
    return { ok: true };
  };

  S.reset = function () {
    try { localStorage.removeItem(KEY); } catch (e) { /* sin storage */ }
    S.data = fresh(); S.save();
    try { G.Tree.sync(); } catch (e) { /* árbol aún no cargado */ }
  };

  // ---- Peligro (J3): máximo desbloqueado por jefe y nivel elegido en el Portal
  S.BOSSES = ['pastor', 'karceron', 'letea', 'yarlak', 'melaria'];
  S.pelMax = function (id) { return G.clamp(Math.round((S.data.peligro && S.data.peligro[id]) || 1), 1, 5); };
  S.pelSel = function (id) { return Math.min(S.pelMax(id), G.clamp(Math.round((S.data.peligroSel && S.data.peligroSel[id]) || 1), 1, 5)); };
  S.setPelSel = function (id, n) { S.data.peligroSel[id] = G.clamp(n, 1, S.pelMax(id)); S.save(); };
  S.hunt = function (id, P) { var h = S.data.hunts; h[id] = h[id] || {}; h[id][P] = h[id][P] || { wins: 0, tries: 0, best: 0 }; return h[id][P]; };
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
