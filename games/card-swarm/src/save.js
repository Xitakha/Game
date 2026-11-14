/* save.js - Guardado local de Swarm Hand (localStorage con try/catch y versión de esquema).
   T-F1-11 (guardado a prueba de pérdidas, sin cambiar la versión: sigue en v12): suma de comprobación "_sum" en el texto guardado, validación de forma y rangos
   (al cargar se corrige; al importar se rechaza), escritura segura (la versión anterior pasa a la copia .reciente y se comprueba leyendo; con la cuota llena se libera
   lo prescindible y se reintenta; si no se puede, se sigue en memoria y se avisa), copias rotativas .reciente / .dia / .semana, segunda copia en IndexedDB,
   recuperación automática al arrancar (principal ausente, truncado o dañado -> la copia válida más nueva) con aviso (pwa.js), guardado de una versión futura
   intacto (no se escribe) y navigator.storage.persist(). Otro dominio (portal, itch, TWA): cada origen tiene su localStorage e IndexedDB, así que el guardado
   no viaja solo; el camino es Exportar (texto SWARM1: o archivo) en el origen viejo e Importar en el nuevo. Si algún día hay servidor, el mismo texto sellado
   sirve como formato de subida (G.Platform.saveSync en T-F3-02).
   v12 (v9 cinemáticas): cine { introSeen, introVer, entrySeen{}, epilogueSeen, creditsSeen } y settings.cine { calm (Reducir destellos; null = según prefers-reduced-motion), textSpeed, soundCaps }. Migración v11 -> v12 con copia en swarmhand.fusion.save.v11: las cuentas con progreso (runs, bossKills, bossSeen, PF o final visto) reciben la intro como vista.
   v11 (v8.1 sets nuevos): sin campos nuevos; regala el Peto de Escama / Pelaje / Jalea / Brasa por jefe ya vencido (Letea, Yarlak, Melaria, Cenizar) y equipa el de mayor tier. Migración v10 -> v11 con copia en swarmhand.fusion.save.v10.
   v10 (v8 Herrero): armor { owned, equipped, seen, stats, ped }, trophiesEver / insigniasEver (acumulado: Ruta, logros y Archivo; trophies / insignias pasan a ser saldo gastable), loadouts[i].armor, stats.playMs, flags.smithMet / smithGift. Migración v9 -> v10 con copia en swarmhand.fusion.save.v9: regala set Aldeano + Peto de cada jefe vencido.
   v9 (P7, Integración): portalSeen { destino: 1 } (destinos ya vistos abiertos en el Portal: los recién desbloqueados se marcan 'NUEVO'); la rama 'Ruta' del árbol usa nodos normales (nodes) y los trofeos ya guardados (trophies);
   los platos nuevos y las misiones nuevas no necesitan datos propios (shop.dish / pending.dish / quest). Migración v8 -> v9 con copia en swarmhand.save.v8: los destinos que ya tenías abiertos salen como vistos.
   v8 (P6.5, Cenizar): peligro.cenizar, endingSeen (cinemática final vista), trofeos de Cenizar; el Cráter se abre al vencer a los 5 jefes. Migración v7 -> v8 con copia en swarmhand.save.v7.
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
  var KEY = 'swarmhand.fusion.save', VERSION = 12;
  var STARTERS = ['spark', 'shard', 'dart', 'dagger', 'fang', 'hourglass'];   // set básico desbloqueado (Rango I)
  S.STARTERS = STARTERS;
  S.VERSION = VERSION;
  S.ok = true;   // false si localStorage no está disponible (se juega igual, sin persistir)

  function fresh() {
    var cards = {}; STARTERS.forEach(function (id) { cards[id] = 1; });
    return { v: VERSION, parts: {}, brasas: 0, cards: cards, anchors: ['spark'], len: 9, runs: 0, wins: 0, pity: 0, firstBuildRuns: null,
      pf: { earned: 1 },                       // 1 PF de regalo
      nodes: {},                               // id -> { c: elección ('1' | 'A' | 'B'), free: 1 si es heredado/gratis, r: 1 si dio +1 rango }
      ever: {}, mile: 0,                       // nodos comprados alguna vez (hitos "Maestría de oficio") y hitos ya cobrados
      respecFree: 1,                           // el primer reespecializado es gratis
      elites: {},                              // primer élite abatido de cada SLOT (+1 PF; v6: mini_slot1 / mini_slot2)
      insignias: {},                           // v6: Insignias de los minijefes (id -> veces)
      quest: { active: null, prog: {}, done: {} },
      shop: { trade: 0, tonic: 0, magnet: 0, part: 0, dish: 0 }, pending: { tonic: 0, magnet: 0, dish: null },
      flags: {},
      trophiesEver: {}, insigniasEver: {}, stats: { playMs: 0 }, armor: freshArmor(),
      bossKills: {}, trophies: {}, bossSeen: {}, biome: 'bosque',
      loadouts: [null, null, null],            // v3: { name, anchors: [ids], dish: id|null, len: 7|9|10 }
      ach: {}, combosSeen: {}, manualSeen: {}, cooked: 0, lossStreak: 0,
      peligro: { pastor: 1, karceron: 1, letea: 1, yarlak: 1, melaria: 1, cenizar: 1 }, endingSeen: false, cine: freshCine(), portalSeen: { bosque: 1 }, peligroSel: {}, pelWins: {}, hunts: {}, practice: {} };   // v4 (J3)   // v4: jefes vencidos por id, trofeos acumulados, intro ya vista, destino elegido en el Portal
  }

  function freshCine() { return { introSeen: false, introVer: 1, entrySeen: {}, epilogueSeen: false, creditsSeen: false }; }
  function freshArmor() { return { owned: {}, equipped: [null, null, null, null], seen: {}, stats: { blocked: 0, crafts: 0 }, ped: {} }; }
  // ================================================================ Guardado a prueba de pérdidas (T-F1-11)
  // Claves (todas empiezan por swarmhand.fusion.): principal KEY; copias rotativas .reciente (la versión anterior, un guardado por detrás),
  // .dia (>= 1 día) y .semana (>= 1 día, se renueva cada 7); .copias (índice con la fecha de cada una); copias de migración .vN (sin tocar);
  // .danado (el principal tal cual estaba cuando no se pudo leer, para diagnóstico); .antes-de-importar y .antes-de-borrar (solo se restauran a mano).
  // Además hay una segunda copia en IndexedDB ('swarmhand.fusion', almacén 'save', clave 'main') que se escribe con retardo.
  // Suma de comprobación: el texto guardado es el JSON del guardado con un último campo "_sum":"<fnv1a>.<longitud>" sobre el JSON sin ese campo.
  // Un guardado viejo sin "_sum" se acepta (solo se valida la forma). Nunca se ejecuta nada del texto: solo JSON.parse y copia campo a campo.
  var K = { rec: KEY + '.reciente', day: KEY + '.dia', week: KEY + '.semana', idx: KEY + '.copias', bad: KEY + '.danado', imp: KEY + '.antes-de-importar', del: KEY + '.antes-de-borrar' };
  var DAY = 864e5, WEEK = 7 * DAY, MAX_RAW = 512 * 1024, MAX_STR = 200;
  S.KEYS = K; S.KEY = KEY;
  S.hold = false;        // true si el principal es de una versión más nueva del juego: no se escribe para no estropearlo
  S.recovered = null;    // { from: 'reciente' | 'dia' | 'semana' | 'v11' | 'idb' | null, t, reason: 'dañado' | 'ausente' | 'futuro' } si el arranque no usó el principal
  S.repairs = [];        // campos corregidos al cargar (valores fuera de rango en un guardado por lo demás sano)
  S.boot = '';           // 'principal' | 'nuevo' | 'recuperado' | 'sin-almacen'
  S.lastError = '';      // '' | 'quota' | 'blocked' | 'verify' | 'futuro'

  function store() { try { return window.localStorage || null; } catch (e) { return null; } }   // con el almacenamiento bloqueado, leer window.localStorage ya lanza
  function lsGet(k) { var s = store(); if (!s) return null; try { return s.getItem(k); } catch (e) { return null; } }
  function isQuota(e) { return !!e && (e.name === 'QuotaExceededError' || e.name === 'NS_ERROR_DOM_QUOTA_REACHED' || e.code === 22 || e.code === 1014); }
  // Escribe y comprueba leyendo: '' si quedó bien; 'quota', 'blocked' o 'verify' si no
  function lsSet(k, v) {
    var s = store(); if (!s) return 'blocked';
    try { s.setItem(k, v); } catch (e) { return isQuota(e) ? 'quota' : 'blocked'; }
    try { return s.getItem(k) === v ? '' : 'verify'; } catch (e2) { return 'verify'; }
  }
  function lsDel(k) { var s = store(); if (s) try { s.removeItem(k); } catch (e) { /* sin storage */ } }
  function readIdx() { try { var o = JSON.parse(lsGet(K.idx) || '{}'); return o && typeof o === 'object' && !Array.isArray(o) ? o : {}; } catch (e) { return {}; } }
  function writeIdx(o) { var r = {}; ['main', 'reciente', 'dia', 'semana', 'antes-de-importar', 'antes-de-borrar'].forEach(function (k) { if (typeof o[k] === 'number' && isFinite(o[k])) r[k] = o[k]; }); lsSet(K.idx, JSON.stringify(r)); }

  // ---- Suma de comprobación (detecta texto truncado o alterado; no es una firma: en el cliente no hay secretos)
  function fnv(s) { var h = 0x811c9dc5; for (var i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 0x01000193); } return (h >>> 0).toString(36); }
  function seal(json) { return json.slice(0, -1) + (json.length > 2 ? ',' : '') + '"_sum":"' + fnv(json) + '.' + json.length.toString(36) + '"}'; }
  var SEAL_RE = /,?"_sum":"([0-9a-z]+)\.([0-9a-z]+)"\}$/;
  function unseal(raw) {
    var m = SEAL_RE.exec(raw); if (!m) return { json: raw, sealed: false, okSum: true };
    var json = raw.slice(0, m.index) + '}';
    return { json: json, sealed: true, okSum: fnv(json) === m[1] && json.length.toString(36) === m[2] };
  }
  S.serialize = function (d) { return seal(JSON.stringify(d)); };

  // ---- Validación: copia campo a campo (sin __proto__ / constructor / prototype, textos y listas acotados, sin '<' '>' ni controles) y rangos por campo
  var BAD_KEY = /^(__proto__|constructor|prototype)$/, KEY_OK = /^[^\u0000-\u001f\u007f<>]{1,64}$/;
  function clean(v, depth, bad, path) {
    if (v === null) return null;
    var t = typeof v;
    if (t === 'boolean') return v;
    if (t === 'number') { if (isFinite(v)) return v; bad.push(path + ' (no finito)'); return undefined; }
    if (t === 'string') { if (v.length > MAX_STR) { bad.push(path + ' (texto de ' + v.length + ')'); return undefined; } return v.replace(/[<>\u0000-\u001f\u007f]/g, ''); }
    if (t !== 'object') { bad.push(path); return undefined; }
    if (depth > 8) { bad.push(path + ' (demasiado anidado)'); return undefined; }
    if (Array.isArray(v)) {
      if (v.length > 64) { bad.push(path + ' (lista de ' + v.length + ')'); return undefined; }
      return v.map(function (x, i) { var c = clean(x, depth + 1, bad, path + '[' + i + ']'); return c === undefined ? null : c; });
    }
    var o = {}, ks = Object.keys(v);
    if (ks.length > 1000) { bad.push(path + ' (' + ks.length + ' claves)'); return undefined; }
    for (var i = 0; i < ks.length; i++) {
      var k = ks[i];
      if (BAD_KEY.test(k) || !KEY_OK.test(k)) { bad.push(path + '.' + k.slice(0, 20)); continue; }
      var c = clean(v[k], depth + 1, bad, path ? path + '.' + k : k); if (c !== undefined) o[k] = c;
    }
    return o;
  }
  function isObj(o) { return !!o && typeof o === 'object' && !Array.isArray(o); }
  function rules(d, bad) {
    var L = G.Loot || {}, BIG = 1e9, HUGE = 1e13;
    function num(o, k, lo, hi, p) {
      if (!isObj(o) || o[k] == null) return; var v = o[k];
      if (typeof v === 'number' && v >= lo && v <= hi) return;
      bad.push((p || '') + k); o[k] = typeof v === 'number' ? Math.min(hi, Math.max(lo, v)) : lo;
    }
    function map(o, k, lo, hi, p) {
      if (!isObj(o) || o[k] == null) return; var m = o[k];
      if (!isObj(m)) { bad.push((p || '') + k); delete o[k]; return; }
      for (var id in m) { var v = m[id]; if (typeof v === 'boolean' || (typeof v === 'number' && v >= lo && v <= hi)) continue; bad.push((p || '') + k + '.' + id); if (typeof v === 'number') m[id] = Math.min(hi, Math.max(lo, v)); else delete m[id]; }
    }
    function obj(o, k, p) { if (isObj(o) && o[k] != null && !isObj(o[k])) { bad.push((p || '') + k); delete o[k]; } }   // adopt() pone el valor por defecto
    ['brasas', 'runs', 'wins', 'cooked', 'lossStreak', 'mile'].forEach(function (k) { num(d, k, 0, BIG); });
    num(d, 'pity', 0, L.PITY_MAX || 1); num(d, 'respecFree', 0, 1); num(d, 'len', 1, 30); num(d, 'firstBuildRuns', 0, BIG);
    map(d, 'parts', 0, BIG); map(d, 'cards', 0, L.MAXRANK || 3);
    ['bossKills', 'trophies', 'trophiesEver', 'insignias', 'insigniasEver', 'elites', 'bossSeen', 'ach', 'combosSeen', 'manualSeen', 'portalSeen', 'ever'].forEach(function (k) { map(d, k, 0, HUGE); });
    map(d, 'peligro', 1, 5); map(d, 'peligroSel', 0, 5);
    ['pf', 'nodes', 'quest', 'shop', 'pending', 'flags', 'pelWins', 'hunts', 'practice', 'stats', 'armor', 'cine', 'settings'].forEach(function (k) { obj(d, k); });
    if (isObj(d.pf)) { num(d.pf, 'earned', 0, L.PF_CAP || 24, 'pf.'); num(d.pf, 'frag', 0, BIG, 'pf.'); }
    if (isObj(d.stats)) num(d.stats, 'playMs', 0, HUGE, 'stats.');
    if (isObj(d.shop)) for (var sk in d.shop) num(d.shop, sk, 0, BIG, 'shop.');
    if (isObj(d.settings)) ['master', 'music', 'sfx'].forEach(function (k) { num(d.settings, k, 0, 1, 'settings.'); });
    if (isObj(d.armor)) { map(d.armor, 'owned', 0, 50, 'armor.'); if (isObj(d.armor.stats)) { num(d.armor.stats, 'blocked', 0, HUGE, 'armor.stats.'); num(d.armor.stats, 'crafts', 0, BIG, 'armor.stats.'); } }
    if (isObj(d.hunts)) for (var hb in d.hunts) { if (!isObj(d.hunts[hb])) { bad.push('hunts.' + hb); delete d.hunts[hb]; continue; } for (var hp in d.hunts[hb]) { var h = d.hunts[hb][hp]; if (!isObj(h)) { bad.push('hunts.' + hb + '.' + hp); delete d.hunts[hb][hp]; continue; } ['wins', 'tries', 'best'].forEach(function (k) { num(h, k, 0, HUGE, 'hunts.' + hb + '.' + hp + '.'); }); } }
    if (d.anchors != null && (!Array.isArray(d.anchors) || d.anchors.length > 8 || d.anchors.some(function (a) { return typeof a !== 'string'; }))) { bad.push('anchors'); d.anchors = null; }
    if (Array.isArray(d.loadouts)) d.loadouts.forEach(function (l, i) {
      if (!isObj(l)) return;
      if (l.name != null && (typeof l.name !== 'string' || l.name.length > 24)) { bad.push('loadouts[' + i + '].name'); l.name = 'LOADOUT ' + (i + 1); }
      if (typeof l.name === 'string') l.name = l.name.toUpperCase().replace(/[^A-Z0-9 ÁÉÍÓÚÑ-]/g, '').slice(0, 12) || 'LOADOUT ' + (i + 1);   // mismo filtro que al renombrar (panels.js)
    });
  }
  // obj: resultado de JSON.parse. strict (importar): cualquier valor raro rechaza; sin strict (cargar): se corrige y se anota en fixes
  S.validate = function (obj, strict) {
    if (!isObj(obj)) return { err: 'forma' };
    if (typeof obj.v !== 'number' || obj.v < 1 || Math.floor(obj.v) !== obj.v) return { err: 'forma' };
    if (obj.v > VERSION) return { err: 'futuro', future: obj.v };
    var bad = [], d = clean(obj, 0, bad, '');
    delete d._sum;
    if (!isObj(d.parts) || !isObj(d.cards)) return { err: 'forma' };
    rules(d, bad);
    if (strict && bad.length) return { err: 'rango', bad: bad };
    return { d: d, fixes: bad };
  };
  // Texto guardado -> { d, fixes, sealed } o { err: 'vacio' | 'grande' | 'json' | 'suma' | 'forma' | 'futuro' | 'rango' }
  function readRaw(raw, strict) {
    if (typeof raw !== 'string' || !raw) return { err: 'vacio' };
    if (raw.length > MAX_RAW) return { err: 'grande' };
    var u = unseal(raw), obj;
    try { obj = JSON.parse(u.json); } catch (e) { return { err: 'json' }; }
    var r = S.validate(obj, strict); r.sealed = u.sealed;
    if (!u.okSum) return { err: 'suma', salvage: r.d || null };   // se lee, pero solo se usa si no hay ninguna copia buena
    return r;
  }
  S.readRaw = readRaw;
  function prevValid(raw) { var r = readRaw(raw, false); return !!r.d; }
  function hasProgress(d) { return !!d && ((d.runs || 0) > 0 || (d.brasas || 0) > 0 || Object.keys(d.parts || {}).length > 0 || ((d.pf && d.pf.earned) || 0) > 1 || !!(d.cine && d.cine.introSeen)); }
  S.hasProgress = hasProgress;

  // ---- Avisos (el primero de cada tipo; si aún no hay toasts, se guarda para que pwa.js lo enseñe al arrancar)
  var warned = {};
  S.pendingWarn = null;
  function warn(kind, text) {
    if (warned[kind]) return; warned[kind] = 1;
    if (G.PWA && G.PWA.started && G.Sys && G.Sys.toast) G.Sys.toast(text, { close: true, ms: 9000 }); else S.pendingWarn = text;
  }
  function fail(kind) {
    S.ok = false; S.lastError = kind;
    if (kind === 'quota') warn('quota', 'No queda espacio para guardar en este navegador. Tu progreso sigue en memoria: exporta tu guardado en Ajustes.');
    else warn('blocked', 'El navegador no deja guardar el progreso. Exporta tu guardado en Ajustes.');
  }
  // Libera lo prescindible si la cuota está llena (nunca el principal, la copia reciente ni las de migración)
  function freeSpace() { [K.bad, K.del, K.week, K.day, K.imp].forEach(lsDel); }

  // ---- Escritura segura: 1) la versión anterior (si es válida) pasa a la copia reciente y, si toca, a la del día / la semana;
  // 2) se escribe el principal y se comprueba leyendo; si falla por cuota se libera espacio y se reintenta; si nada funciona, se sigue en memoria.
  S.save = function () {
    if (!S.data) return false;
    var raw = S.serialize(S.data);
    idbQueue(raw);
    if (S.hold) { S.ok = false; S.lastError = 'futuro'; return false; }
    if (!store()) { fail('blocked'); return false; }
    var prev = lsGet(KEY);
    if (prev === raw) { S.ok = true; S.lastError = ''; return true; }
    var now = Date.now(), idx = readIdx();
    if (prev && prevValid(prev)) {
      var tPrev = idx.main || now;
      if (!idx.dia || now - idx.dia > DAY) {
        var oldDay = lsGet(K.day);
        if (oldDay && idx.dia && (!idx.semana || now - idx.semana > WEEK) && !lsSet(K.week, oldDay)) idx.semana = idx.dia;
        if (!lsSet(K.day, prev)) idx.dia = tPrev;
      }
      var er = lsSet(K.rec, prev);
      if (er === 'quota') { freeSpace(); er = lsSet(K.rec, prev); }
      if (!er) idx.reciente = tPrev;
    }
    var e = lsSet(KEY, raw);
    if (e === 'quota') { freeSpace(); e = lsSet(KEY, raw); }
    if (e === 'verify') e = lsSet(KEY, raw);
    if (e) { if (e === 'verify' && prev) lsSet(KEY, prev); fail(e); return false; }
    idx.main = now; writeIdx(idx);
    S.ok = true; S.lastError = '';
    return true;
  };

  // ---- Segunda copia en IndexedDB (asíncrona, con retardo; no se escribe hasta que el arranque haya mirado si hacía falta recuperarla)
  var IDB = { db: null, failed: false, pending: null, timer: 0, ready: false, name: 'swarmhand.fusion', store: 'save' };
  function idbOpen(cb) {
    if (IDB.db) return cb(IDB.db);
    if (IDB.failed) return cb(null);
    try {
      var rq = window.indexedDB.open(IDB.name, 1);
      rq.onupgradeneeded = function () { try { rq.result.createObjectStore(IDB.store); } catch (e) { /* ya existe */ } };
      rq.onsuccess = function () { IDB.db = rq.result; cb(IDB.db); };
      rq.onerror = function () { IDB.failed = true; cb(null); };
      rq.onblocked = function () { cb(null); };
    } catch (e) { IDB.failed = true; cb(null); }
  }
  function idbTx(mode, fn, cb) {
    idbOpen(function (db) {
      if (!db) { if (cb) cb(null); return; }
      try { var tx = db.transaction(IDB.store, mode), rq = fn(tx.objectStore(IDB.store)); tx.oncomplete = function () { if (cb) cb(rq && rq.result); }; tx.onerror = tx.onabort = function () { if (cb) cb(null); }; }
      catch (e) { if (cb) cb(null); }
    });
  }
  function idbQueue(raw) { IDB.pending = raw; if (IDB.ready && !IDB.timer) IDB.timer = setTimeout(S.flushIdb, 1500); }
  S.flushIdb = function (cb) {
    clearTimeout(IDB.timer); IDB.timer = 0;
    var raw = IDB.pending; if (!raw || !IDB.ready) { if (cb) cb(false); return; }
    IDB.pending = null;
    idbTx('readwrite', function (st) { return st.put({ raw: raw, t: Date.now(), v: VERSION }, 'main'); }, function (r) { if (cb) cb(r != null); });
  };
  S.idbRead = function (cb) { idbTx('readonly', function (st) { return st.get('main'); }, function (r) { cb(r && typeof r.raw === 'string' ? r : null); }); };
  function idbDel() { IDB.pending = null; clearTimeout(IDB.timer); IDB.timer = 0; idbTx('readwrite', function (st) { return st.delete('main'); }); }
  function idbReady() { IDB.ready = true; if (IDB.pending && !IDB.timer) IDB.timer = setTimeout(S.flushIdb, 1500); }
  try { document.addEventListener('visibilitychange', function () { if (document.hidden) S.flushIdb(); }); window.addEventListener('pagehide', function () { S.flushIdb(); }); } catch (e) { /* sin DOM */ }
  // Al arrancar: si no se pudo usar el principal (no había, estaba dañado o venía de una copia más vieja), mira la copia de IndexedDB
  // y la adopta si es válida y más nueva. cb(info) solo si adoptó algo.
  S.checkIdb = function (cb) {
    if (S.boot === 'principal') { idbReady(); return; }
    var t0 = S.recovered && S.recovered.t || 0, boot = S.boot, done = false, runs0 = S.data && S.data.runs, br0 = S.data && S.data.brasas;
    var finish = function () { if (!done) { done = true; idbReady(); } };
    setTimeout(finish, 4000);   // si IndexedDB no contesta, no se bloquea la copia
    S.idbRead(function (rec) {
      if (done) return;
      var r = rec && readRaw(rec.raw, false), d = r && r.d ? migrate(r.d) : null;
      var use = d && (boot === 'recuperado' ? rec.t > t0 : hasProgress(d)) && S.boot === boot && S.data.runs === runs0 && S.data.brasas === br0;   // si ya jugó algo desde el arranque, no se pisa
      if (use) {
        S.adopt(d); S.recovered = { from: 'idb', t: rec.t, reason: (S.recovered && S.recovered.reason) || 'ausente' }; S.boot = 'recuperado';
        S.save();
      }
      finish();
      if (use && cb) cb(S.recovered);
    });
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
    if (d.v === 7) {   // P6.5: Cenizar (Cráter). Solo se añade su Peligro y la marca de final visto; el desbloqueo del Cráter sale de los 5 bossKills
      d.v = 8; d.peligro = (d.peligro && typeof d.peligro === 'object') ? d.peligro : {}; if (!d.peligro.cenizar) d.peligro.cenizar = 1; if (d.endingSeen == null) d.endingSeen = false;
      d.flags = (d.flags && typeof d.flags === 'object') ? d.flags : {}; d.flags.migrated8 = 1;
    }
    if (d.v === 8) {   // P7: destinos vistos del Portal (los ya abiertos no se marcan como nuevos)
      d.v = 9; var bk8 = (d.bossKills && typeof d.bossKills === 'object') ? d.bossKills : {};
      d.portalSeen = { bosque: 1 }; if (bk8.pastor > 0) d.portalSeen.cripta = 1; if (bk8.karceron > 0) d.portalSeen.asfodelo = 1; if (bk8.letea > 0) d.portalSeen.tundra = 1; if (bk8.yarlak > 0) d.portalSeen.panal = 1;
      if (['pastor', 'karceron', 'letea', 'yarlak', 'melaria'].every(function (b) { return bk8[b] > 0; })) d.portalSeen.crater = 1;
      d.flags = (d.flags && typeof d.flags === 'object') ? d.flags : {}; d.flags.migrated9 = 1;
    }
    if (d.v === 9) {   // v8 Herrero: trofeos / insignias acumulados, armadura vacía y regalo de bienvenida (Aldeano + Peto por jefe vencido)
      d.v = 10; var cp = function (o) { var r = {}; if (o && typeof o === 'object') for (var k in o) r[k] = o[k]; return r; };
      d.trophiesEver = cp(d.trophies); d.insigniasEver = cp(d.insignias); d.stats = { playMs: 0 }; d.armor = freshArmor();
      d.flags = (d.flags && typeof d.flags === 'object') ? d.flags : {}; d.flags.migrated10 = 1;
      var bk9 = (d.bossKills && typeof d.bossKills === 'object') ? d.bossKills : {};
      if (bk9.pastor > 0) {
        var a = d.armor, SETS = [['aldeano', null, 0], ['esquila', 'pastor', 1], ['carcelero', 'karceron', 2]];
        ['ald_helm', 'ald_chest', 'ald_boots', 'ald_amulet'].forEach(function (id) { a.owned[id] = 0; });
        a.equipped = ['ald_helm', 'ald_chest', 'ald_boots', 'ald_amulet'];
        SETS.forEach(function (st) { if (st[1] && bk9[st[1]] > 0) { var pid = st[0] === 'esquila' ? 'esq_chest' : 'car_chest'; a.owned[pid] = 0; a.equipped[1] = pid; } });
        d.flags.smithGift = 1;
      }
    }
    if (d.v === 10) {   // v8.1: Peto de los sets nuevos por jefe ya vencido
      d.v = 11; d.flags = (d.flags && typeof d.flags === 'object') ? d.flags : {}; d.flags.migrated11 = 1;
      var bk10 = (d.bossKills && typeof d.bossKills === 'object') ? d.bossKills : {}, AD = G.ArmorData;
      if (!d.armor || typeof d.armor !== 'object') d.armor = freshArmor();
      if (!d.armor.owned || typeof d.armor.owned !== 'object') d.armor.owned = {};
      if (!Array.isArray(d.armor.equipped) || d.armor.equipped.length !== 4) d.armor.equipped = [null, null, null, null];
      if (AD && bk10.pastor > 0) {
        AD.SET_ORDER.forEach(function (sid) {
          var st = AD.SETS[sid], pe = st.boss && AD.peto(sid);
          if (pe && bk10[st.boss] > 0 && d.armor.owned[pe.id] == null) {
            d.armor.owned[pe.id] = 0;
            var cur = d.armor.equipped[1], ct = cur && AD.BY[cur] ? AD.tierOf(AD.BY[cur]) : -1;
            if (st.tier > ct) d.armor.equipped[1] = pe.id;
          }
        });
      }
    }
    if (d.v === 11) {   // v9: cinemáticas. Sin pérdida: solo se añaden campos
      d.v = 12; d.flags = (d.flags && typeof d.flags === 'object') ? d.flags : {}; d.flags.migrated12 = 1;
      var bk11 = (d.bossKills && typeof d.bossKills === 'object') ? d.bossKills : {}, bs11 = (d.bossSeen && typeof d.bossSeen === 'object') ? d.bossSeen : {};
      var prog = (d.runs > 0) || Object.keys(bk11).some(function (k) { return bk11[k] > 0; }) || Object.keys(bs11).some(function (k) { return bs11[k]; }) || !!(d.pf && d.pf.earned > 1) || !!d.endingSeen;
      d.cine = freshCine(); d.cine.introSeen = !!prog; d.cine.epilogueSeen = d.cine.creditsSeen = !!d.endingSeen;
      Object.keys(bs11).forEach(function (k) { if (bs11[k]) d.cine.entrySeen[k] = 1; });
    }
    return d.v === VERSION ? d : null;
  }

  // Candidatas para recuperar, de la más nueva a la más vieja: copias rotativas (por fecha) y después las de migración (por versión)
  function candidates() {
    var idx = readIdx(), out = [];
    [['reciente', K.rec], ['dia', K.day], ['semana', K.week]].forEach(function (c) { out.push({ name: c[0], key: c[1], t: idx[c[0]] || 0 }); });
    out.sort(function (a, b) { return b.t - a.t; });
    for (var v = VERSION - 1; v >= 1; v--) out.push({ name: 'v' + v, key: KEY + '.v' + v, t: 0 });
    return out;
  }
  function fromBackups() {
    var cs = candidates();
    for (var i = 0; i < cs.length; i++) {
      var raw = lsGet(cs[i].key); if (!raw) continue;
      var r = readRaw(raw, false), d = r.d ? migrate(r.d) : null;
      if (d) return { d: d, name: cs[i].name, t: cs[i].t };
    }
    return null;
  }
  S.load = function () {
    var d = null, raw = null, r = null;
    S.recovered = null; S.repairs = []; S.hold = false;
    if (!store()) { S.ok = false; S.boot = 'sin-almacen'; S.adopt(null); return S.data; }
    raw = lsGet(KEY);
    if (raw) {
      r = readRaw(raw, false);
      if (r.d) {
        if (r.d.v < VERSION) lsSet(KEY + '.v' + r.d.v, raw);   // copia de seguridad antes de migrar
        d = migrate(r.d);
        if (d) S.repairs = r.fixes;
      }
    }
    if (d) S.boot = 'principal';
    else {
      var reason = !raw ? 'ausente' : (r && r.err === 'futuro') ? 'futuro' : 'dañado';
      if (reason === 'futuro') { S.hold = true; S.lastError = 'futuro'; lsSet(KEY + '.v' + r.future, raw); }   // se conserva y no se pisa: lo abrirá la versión nueva
      else if (raw) lsSet(K.bad, raw);   // el texto dañado se guarda aparte (diagnóstico) si cabe
      var b = fromBackups();
      var sv = !b && r && r.err === 'suma' && r.salvage ? migrate(r.salvage) : null;
      if (b) { d = b.d; S.recovered = { from: b.name, t: b.t, reason: reason }; S.boot = 'recuperado'; }
      else if (sv) { d = sv; S.recovered = { from: 'principal', t: readIdx().main || 0, reason: reason }; S.boot = 'recuperado'; }   // sin copias: lo que se pudo leer del dañado
      else { S.recovered = raw ? { from: null, t: 0, reason: reason } : null; S.boot = raw ? 'recuperado' : 'nuevo'; }
    }
    S.adopt(d);
    if (S.recovered && !S.hold) S.save();   // lo recuperado pasa a ser el principal (la versión dañada queda en .danado)
    return S.data;
  };

  // Rellena los campos que falten con los valores por defecto y lo deja como guardado actual (lo usa también la importación)
  S.adopt = function (d) {
    if (!d) d = fresh();
    var f = fresh();
    for (var k in f) if (d[k] == null) d[k] = f[k];
    ['pf', 'nodes', 'ever', 'elites', 'quest', 'shop', 'pending', 'flags', 'bossKills', 'trophies', 'bossSeen', 'ach', 'combosSeen', 'manualSeen', 'peligro', 'peligroSel', 'pelWins', 'hunts', 'practice', 'insignias', 'portalSeen', 'trophiesEver', 'insigniasEver', 'stats', 'armor', 'cine'].forEach(function (key) { if (typeof d[key] !== 'object' || !d[key]) d[key] = f[key]; });
    var ar = d.armor; ['owned', 'seen', 'stats', 'ped'].forEach(function (k) { if (!ar[k] || typeof ar[k] !== 'object') ar[k] = freshArmor()[k]; });
    if (!Array.isArray(ar.equipped) || ar.equipped.length !== 4) ar.equipped = [null, null, null, null];
    if (typeof ar.stats.blocked !== 'number') ar.stats.blocked = 0; if (typeof ar.stats.crafts !== 'number') ar.stats.crafts = 0;
    if (typeof d.stats.playMs !== 'number') d.stats.playMs = 0;
    if (!Array.isArray(d.loadouts)) d.loadouts = [null, null, null];
    while (d.loadouts.length < 3) d.loadouts.push(null);
    d.loadouts = d.loadouts.slice(0, 3).map(function (l) { return l && typeof l === 'object' && Array.isArray(l.anchors) ? l : null; });
    if (!d.peligro.yarlak) d.peligro.yarlak = 1;
    if (!d.peligro.melaria) d.peligro.melaria = 1;
    if (!d.peligro.cenizar) d.peligro.cenizar = 1;
    d.endingSeen = !!d.endingSeen;
    var ci = d.cine, fc = freshCine(); for (var ck in fc) if (ci[ck] == null) ci[ck] = fc[ck];
    ci.introSeen = !!ci.introSeen; ci.epilogueSeen = !!ci.epilogueSeen; ci.creditsSeen = !!ci.creditsSeen; if (!ci.entrySeen || typeof ci.entrySeen !== 'object') ci.entrySeen = {};
    if (d.settings && typeof d.settings === 'object' && (!d.settings.cine || typeof d.settings.cine !== 'object')) d.settings.cine = { calm: null, textSpeed: 1, soundCaps: true };
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

  // Exportar / importar como texto (copia de seguridad que sobrevive a limpiar el navegador o cambiar de móvil).
  // Formato: 'SWARM1:' + base64(JSON utf-8 con "_sum"). También se acepta el JSON tal cual y los textos exportados antes de T-F1-11 (sin "_sum").
  S.exportText = function () {
    if (S.data && S.data.flags) S.data.flags.expAt = S.data.runs || 0;   // recordatorio de exportar (pwa.js)
    S.save();
    return 'SWARM1:' + btoa(unescape(encodeURIComponent(S.serialize(S.data))));
  };
  var IMP_ERR = {
    vacio: 'Ese texto no es un guardado de Swarm Hand.', json: 'Ese texto no es un guardado de Swarm Hand.', forma: 'Guardado no reconocido.',
    grande: 'El texto es demasiado grande para ser un guardado de Swarm Hand.', suma: 'El guardado está incompleto o dañado (falla la comprobación). Cópialo entero otra vez.',
    futuro: 'El guardado es de una versión más nueva del juego.'
  };
  function replaceWith(d, backupKey, idxName) {
    var cur = lsGet(KEY);
    if (cur && prevValid(cur)) { if (!lsSet(backupKey, cur)) { var ix = readIdx(); ix[idxName] = Date.now(); writeIdx(ix); } }
    S.hold = false; S.recovered = null;
    S.adopt(d);
    return S.save();
  }
  S.importText = function (txt) {
    txt = String(txt == null ? '' : txt);
    if (txt.length > MAX_RAW * 1.5) return { ok: false, err: IMP_ERR.grande };
    txt = txt.trim();
    var json;
    if (/^SWARM1:/.test(txt)) {
      var b64 = txt.slice(7).replace(/\s+/g, '');
      if (!/^[A-Za-z0-9+\/]*={0,2}$/.test(b64)) return { ok: false, err: IMP_ERR.json };
      try { json = decodeURIComponent(escape(atob(b64))); } catch (e) { return { ok: false, err: IMP_ERR.json }; }
    } else if (txt.charAt(0) === '{') json = txt;
    else return { ok: false, err: IMP_ERR.json };
    var r = readRaw(json, true);
    if (r.err === 'rango') return { ok: false, err: 'El guardado tiene valores imposibles (' + r.bad.slice(0, 3).join(', ') + (r.bad.length > 3 ? '...' : '') + '): no se importa.', bad: r.bad };
    if (r.err) return { ok: false, err: IMP_ERR[r.err] || IMP_ERR.forma };
    var d = migrate(r.d);
    if (!d) return { ok: false, err: IMP_ERR.forma };
    var saved = replaceWith(d, K.imp, 'antes-de-importar');
    return { ok: true, saved: saved };
  };
  // Copias disponibles (Ajustes > Copias de seguridad) y restaurar una a mano (el guardado actual pasa a .antes-de-importar)
  S.backups = function () {
    var idx = readIdx(), list = [['main', KEY, 'Guardado actual'], ['reciente', K.rec, 'Copia reciente'], ['dia', K.day, 'Copia de ayer'], ['semana', K.week, 'Copia de la semana'],
      ['antes-de-importar', K.imp, 'Antes de importar / restaurar'], ['antes-de-borrar', K.del, 'Antes de borrar el progreso']];
    for (var v = VERSION - 1; v >= 1; v--) list.push(['v' + v, KEY + '.v' + v, 'Copia de migración v' + v]);
    var out = [];
    list.forEach(function (c) {
      var raw = lsGet(c[1]); if (!raw) return;
      var r = readRaw(raw, false), d = r.d;
      out.push({ name: c[0], label: c[2], t: idx[c[0]] || 0, ok: !!d, v: d ? d.v : 0, runs: d ? d.runs || 0 : 0, brasas: d ? Math.floor(d.brasas || 0) : 0, size: raw.length });
    });
    return out;
  };
  S.restore = function (name) {
    var c = S.backups().filter(function (b) { return b.name === name && b.ok && name !== 'main'; })[0]; if (!c) return { ok: false, err: 'Esa copia no existe o está dañada.' };
    var key = { reciente: K.rec, dia: K.day, semana: K.week, 'antes-de-importar': K.imp, 'antes-de-borrar': K.del }[name] || KEY + '.' + name;
    var r = readRaw(lsGet(key), false), d = r.d ? migrate(r.d) : null; if (!d) return { ok: false, err: 'Esa copia no existe o está dañada.' };
    return { ok: true, saved: replaceWith(d, K.imp, 'antes-de-importar') };
  };
  // Pide al navegador que no borre los datos del sitio por falta de espacio o inactividad (Chrome decide solo; Firefox puede preguntar)
  // ask = false: solo consulta el estado (S.persisted) sin pedir nada
  S.persist = function (cb, ask) {
    try {
      var st = navigator.storage; if (!st || !st.persist || !st.persisted) { if (cb) cb(null); return; }
      st.persisted().then(function (p) { return p || ask === false ? p : st.persist(); }).then(function (p) { S.persisted = !!p; if (cb) cb(S.persisted); }, function () { if (cb) cb(null); });
    } catch (e) { if (cb) cb(null); }
  };

  S.reset = function () {
    var cur = lsGet(KEY);
    if (cur && prevValid(cur) && !lsSet(K.del, cur)) { var ix = readIdx(); ix['antes-de-borrar'] = Date.now(); writeIdx(ix); }
    [KEY, K.rec, K.day, K.week, K.bad, K.imp].forEach(lsDel);
    var ix2 = readIdx(); writeIdx({ 'antes-de-borrar': ix2['antes-de-borrar'] });
    idbDel(); S.hold = false; S.recovered = null;
    S.data = fresh(); S.save();
    try { G.Tree.sync(); } catch (e) { /* árbol aún no cargado */ }
  };

  // ---- Peligro (J3): máximo desbloqueado por jefe y nivel elegido en el Portal
  S.BOSSES = ['pastor', 'karceron', 'letea', 'yarlak', 'melaria', 'cenizar'];
  S.FIVE = ['pastor', 'karceron', 'letea', 'yarlak', 'melaria'];
  S.craterOpen = function () { var k = (S.data && S.data.bossKills) || {}; return S.FIVE.every(function (b) { return (k[b] || 0) > 0; }) || /[?&](biome|boss|hunt)=(crater|cenizar)/.test(Dev.search); };   // P6.5: se abre al vencer a los 5 jefes
  S.pelMax = function (id) { return G.clamp(Math.round((S.data.peligro && S.data.peligro[id]) || 1), 1, 5); };
  S.pelSel = function (id) { return Math.min(S.pelMax(id), G.clamp(Math.round((S.data.peligroSel && S.data.peligroSel[id]) || 1), 1, 5)); };
  S.setPelSel = function (id, n) { S.data.peligroSel[id] = G.clamp(n, 1, S.pelMax(id)); S.save(); };
  S.hunt = function (id, P) { var h = S.data.hunts; h[id] = h[id] || {}; h[id][P] = h[id][P] || { wins: 0, tries: 0, best: 0 }; return h[id][P]; };
  S.add = function (part, n) { S.data.parts[part] = (S.data.parts[part] || 0) + n; };
  S.rank = function (id) { return S.data.cards[id] || 0; };

  // Parámetros de URL de depuración (se aplican tras cargar)
  S.applyUrl = function () {
    var q = Dev.search, m;
    if (/[?&]reset=1/.test(q)) S.reset();
    S.load();
    if ((m = /[?&]give=([^&]+)/.exec(q))) {
      decodeURIComponent(m[1]).split(',').forEach(function (kv) {
        var a = kv.split(':'), id = a[0], n = parseInt(a[1], 10) || 1;
        if (id === 'brasas') S.data.brasas += n;
        else if (id === 'all') G.Loot.PARTS.forEach(function (p) { S.add(p.id, n); });
        else if (G.Loot.part(id)) S.add(id, n);
        else if (G.Boss.TROPHY[id]) { S.data.trophies[id] = (S.data.trophies[id] || 0) + n; S.data.trophiesEver[id] = (S.data.trophiesEver[id] || 0) + n; }   // v8: ?give=horn:3
        else if (G.Minis && G.Minis.D[id]) { S.data.insignias[id] = (S.data.insignias[id] || 0) + n; S.data.insigniasEver[id] = (S.data.insigniasEver[id] || 0) + n; }
      });
    }
    if ((m = /[?&]pf=(\d+)/.exec(q))) S.data.pf.earned = Math.min(G.Loot.PF_CAP, S.data.pf.earned + parseInt(m[1], 10));
    S.save();
    if ((m = /[?&]len=(\d+)/.exec(q))) G.lenOverride = G.clamp(parseInt(m[1], 10), 2, 20);
  };
})();
