/* track.js - G.Track: analítica con consentimiento (T-F1-01; studio/docs/SPEC-T-F1-01.md y REVISION-PRIVACIDAD.md).
   NUNCA toca la simulación ni G.rng (solo Math.random para el id de sesión y el muestreo). Nada sale del dispositivo ni se escribe en localStorage antes de aceptar el aviso.
   Por defecto el adaptador es 'none': sin red y sin cola. Para ACTIVAR el envío basta cambiar CFG (adapter 'posthog' + host + key pública phc_...) o construir con
   `node tools/build/build.js --track=posthog --track-host=<host UE> --track-key=phc_...`; no hace falta tocar más código.
   API: G.Track(name, props)  .consent(true|false, where)  .state()  .flush(force)  .wipe()  .prompt(cb)  .noticeDue()  .log (con ?dev=1&track=log)
   Parámetros: ?track=0 apaga; con ?dev=1: ?track=log (adaptador sin red, para pruebas) | ?track=on (fuerza el envío real aunque sea bot/localhost; host y clave por ?trackhost= ?trackkey=),
   ?tracktz=<zona> (simula la zona horaria), ?trackdate=AAAA-MM-DD (simula el día UTC). */
(function () {
  'use strict';
  var G = window.G, D = window.Dev || { on: false }, LS_KEY = 'swarmhand.fusion.track';
  var T = G.Track = function (name, props) { try { enqueue(name, props); } catch (e) { /* la analítica nunca rompe el juego */ } };
  T.PV = '2026-11-14a';   // versión del aviso (prueba del consentimiento): cambiar el texto del aviso = cambiar esto = volver a preguntar
  T.SV = 1;               // versión del esquema de eventos
  T.CFG = { adapter: 'none', host: '', key: '', sample: 1 };   // <- único ajuste para activar el envío (clave PÚBLICA phc_...; nunca una phx_...)
  T.CFG.sessionCap = 200; T.CFG.queueMax = 300; T.CFG.bytesMax = 96 * 1024; T.CFG.batch = 50; T.CFG.flushMs = 30000; T.CFG.maxAgeMs = 7 * 86400000;
  T.log = [];

  // ---------------------------------------------------------------- Esquema (una tabla única; las pruebas la usan)
  var B = { s: 'string', n: 'number', b: 'boolean' };
  T.SCHEMA = {
    first_open: { has_save: B.b }, session_start: { sess_n: B.s, bg_return: B.b, ls: B.b }, day_return: {},
    intro_end: { watched_s: B.n, skipped: B.b, first: B.b },
    run_start: { biome: B.s, peril: B.n, mode: B.s, dur: B.n, run_n: B.s, from: B.s },
    run_end: { biome: B.s, peril: B.n, mode: B.s, result: B.s, cause: B.s, dur_s: B.n, level: B.n, kills: B.s, boss_reached: B.b, first_card_s: B.n, fusions: B.n, powers: B.s, run_n: B.s },
    boss_start: { boss: B.s, peril: B.n, run_s: B.n, hp_pct: B.n }, boss_end: { boss: B.s, peril: B.n, result: B.s, fight_s: B.n, hp_pct: B.n, parts: B.n },
    fusion: { id: B.s, replaced: B.s, run_s: B.n, first: B.b }, power_first_use: { id: B.s, run_s: B.n },
    shop_buy: { where: B.s, item: B.s, cur: B.s, cost: B.s, run_n: B.s }, manual_open: { from: B.s, open_s: B.n },
    settings_quality: { from: B.s, to: B.s, auto: B.b }, error: { kind: B.s, msg: B.s, src: B.s, line: B.n, state: B.s },
    session_end: { dur_s: B.n, play_s: B.n, runs: B.n, state: B.s }, analytics_on: { where: B.s, at: B.s },
    // T-F1-02 / T-F1-04 (primera sesión y pantalla de fin): sin datos personales, solo ids de la tabla y cifras
    hint_shown: { id: B.s }, hint_done: { id: B.s, ms: B.n, by: B.s }, npc_intro: { id: B.s }, aldea_open: { n_run: B.n, npcs: B.n },
    end_screen: { kind: B.s, record_new: B.b, ms_on_screen: B.n, choice: B.s, goal_ids: B.s }
  };
  T.COMMON = { sv: B.n, pv: B.s, build: B.s, plat: B.s, dev: B.s, q: B.s, god: B.b, lang: B.s, cohort: B.s, day_n: B.n, t: B.s };
  var KEEP = { first_open: 1, day_return: 1, run_end: 1, boss_end: 1 }, LATE_OK = { run_end: 1, boss_end: 1, session_end: 1 };
  // Devuelve [] si el evento es válido; si no, la lista de problemas (sin datos personales: solo claves y tipos)
  T.validate = function (ev) {
    var bad = [], sc = T.SCHEMA[ev && ev.e], k;
    if (!sc) return ['evento desconocido: ' + (ev && ev.e)];
    for (k in ev.p) {
      var ty = sc[k] || T.COMMON[k];
      if (!ty) bad.push('propiedad no permitida: ' + k); else if (typeof ev.p[k] !== ty) bad.push(k + ' debe ser ' + ty);
    }
    for (k in T.COMMON) if (k !== 'cohort' && k !== 'day_n' && !(k in ev.p)) bad.push('falta ' + k);
    return bad;
  };

  // ---------------------------------------------------------------- Estado
  function qs(n) { var m = new RegExp('[?&]' + n + '=([^&]*)').exec(location.search); return m ? decodeURIComponent(m[1]) : null; }
  function dq(n) { return D.on ? qs(n) : null; }   // parámetros de prueba: solo con ?dev=1
  var tp = qs('track'), forced = !!D.on && (tp === 'log' || tp === 'on'), mode = 'none';   // mode: adaptador efectivo
  var A = { avail: false, reason: '' };             // ¿se puede ofrecer el aviso / enviar en este dispositivo?
  var S = null, known = false, consent = null, Q = [], sid = '', sessMs0 = 0, sessCount = 0, sessErrs = 0, errSeen = {}, sampled = true, sessRuns = 0, playS = 0, visMs = 0, visT0 = 0, hiddenAt = 0;
  var sending = null, timer = 0, saveTimer = 0, fails = 0, lastQ = '', inited = false, adapter = null, R = null;

  var EU = /^(Europe\/|Atlantic\/(Canary|Madeira|Azores|Faroe|Reykjavik)$|Arctic\/Longyearbyen$)/;
  T.isEurope = function (tz) { return EU.test(tz || ''); };
  function tzName() { var z = dq('tracktz'); if (z) return z; try { return Intl.DateTimeFormat().resolvedOptions().timeZone || ''; } catch (e) { return ''; } }
  function store() { try { return window.localStorage || null; } catch (e) { return null; } }
  function now() { return new Date(); }
  function today() { var d = dq('trackdate'); return d && /^\d{4}-\d\d-\d\d$/.test(d) ? d : now().toISOString().slice(0, 10); }
  function dayN(c) { return c ? Math.max(0, Math.round((Date.parse(today()) - Date.parse(c)) / 86400000)) : 0; }
  function rid() { var a = new Uint8Array(8), s = '', i; try { crypto.getRandomValues(a); } catch (e) { for (i = 0; i < 8; i++) a[i] = Math.floor(Math.random() * 256); } for (i = 0; i < 8; i++) s += (a[i] < 16 ? '0' : '') + a[i].toString(16); return s; }
  function bucket(n, edges, names) { for (var i = 0; i < edges.length; i++) if (n <= edges[i]) return names[i]; return names[names.length - 1]; }
  function sessB(n) { return bucket(n, [1, 2, 3, 5, 10], ['1', '2', '3', '4-5', '6-10', '11+']); }
  function killB(n) { return bucket(n, [0, 9, 49, 99, 249, 499], ['0', '1-9', '10-49', '50-99', '100-249', '250-499', '500+']); }
  function costB(n) { return bucket(n, [0, 10, 50, 200, 1000], ['0', '1-10', '11-50', '51-200', '201-1000', '1000+']); }
  function plat() {
    var h = location.hostname || '';
    if (/(^|\.)itch\.(io|zone)$/.test(h) || /itch/.test(document.referrer || '')) return 'itch';
    try { if ((window.matchMedia && matchMedia('(display-mode: standalone)').matches) || navigator.standalone) return 'pwa'; } catch (e) { /* sin matchMedia */ }
    return 'pages';
  }
  function devClass() {
    var coarse = false; try { coarse = !!(window.matchMedia && matchMedia('(pointer: coarse)').matches); } catch (e) { /* nada */ }
    var m = Math.min(screen.width || 9999, screen.height || 9999);
    return coarse ? (m < 600 ? 'movil' : 'tablet') : 'pc';
  }
  function lang() { var l = String(navigator.language || '').slice(0, 2).toLowerCase(); return l === 'es' || l === 'en' ? l : 'otro'; }
  function stateName() {
    var s = G.state;
    if (s === 'title') return 'titulo'; if (s === 'cine') return 'intro'; if (s === 'paused') return 'pausa'; if (s === 'gameover') return 'fin';
    if (s === 'play' || s === 'cards') return G.Boss && G.Boss.active ? 'jefe' : 'expedicion';
    return 'aldea';
  }
  function combat() { return G.state === 'play' || G.state === 'cards' || G.state === 'paused'; }
  function runS() { return Math.round(Math.max(0, (G.time || 0) - (G.t0 || 0)) / 1000); }
  function tIso() { return now().toISOString(); }

  // ---------------------------------------------------------------- Persistencia (solo con consentimiento; la elección "no" guarda solo la elección)
  function persistNow() {
    clearTimeout(saveTimer); saveTimer = 0;
    var ls = store(); if (!ls || !known || consent === null) return;
    try {
      if (consent !== true) { ls.setItem(LS_KEY, JSON.stringify({ v: 1, pv: T.PV, consent: consent, at: S.at })); return; }
      var o = JSON.parse(JSON.stringify(S)), s;   // copia: la cola se recorta por tamaño sin tocar la de memoria
      o.q = Q.slice(); s = JSON.stringify(o);
      while (s.length > T.CFG.bytesMax && o.q.length) { dropOne(o.q); s = JSON.stringify(o); }
      ls.setItem(LS_KEY, s);
    } catch (e) { /* sin espacio: se queda en memoria */ }
  }
  function persistSoon() { if (!saveTimer && consent === true) saveTimer = setTimeout(persistNow, 10000); }
  function dropOne(arr) { for (var i = 0; i < arr.length; i++) if (!KEEP[arr[i].e]) { arr.splice(i, 1); return; } arr.shift(); }
  function load() {
    var ls = store(), raw = null; if (!ls) return;
    try { raw = ls.getItem(LS_KEY); } catch (e) { return; }
    if (!raw) return;
    try {
      var o = JSON.parse(raw); if (!o || typeof o !== 'object') return;
      known = true; S = o;
      if (o.pv !== T.PV || typeof o.consent !== 'boolean') { consent = null; S = null; return; }   // otra versión del aviso: se vuelve a preguntar
      consent = o.consent;
      if (consent === true) {
        S.firstUse = S.firstUse || {}; S.sessions = Array.isArray(S.sessions) ? S.sessions.slice(-10) : [];
        Q = Array.isArray(o.q) ? o.q.filter(function (e) { return e && T.SCHEMA[e.e]; }) : []; delete S.q;
      }
    } catch (e) { known = false; S = null; consent = null; }
  }

  // ---------------------------------------------------------------- Cola
  function active() { return A.avail && consent !== false && mode !== 'none' && sampled; }
  function enqueue(name, props, opt) {
    if (!inited || !active() || !T.SCHEMA[name]) return;
    if (sessCount >= T.CFG.sessionCap && !LATE_OK[name]) return;
    sessCount++;
    var p = { sv: T.SV, pv: T.PV, build: (window.Diag && Diag.build) || 'dev', plat: plat(), dev: devClass(), q: (G.Q && G.Q.level) || 'alta', god: !!G.god, lang: lang(), t: tIso() }, k;
    if (S && S.cohort) { p.cohort = S.cohort; p.day_n = dayN(S.cohort); }
    if (props) for (k in props) { var v = props[k]; if (v !== undefined && v !== null) p[k] = v; }
    Q.push({ e: name, p: p, sid: sid });
    if (Q.length > T.CFG.queueMax) dropOne(Q);
    if (consent === true) persistSoon();
    if (opt && opt.flush) schedule(500);
  }

  // ---------------------------------------------------------------- Adaptadores: { name, send(batch) -> Promise<bool> }
  function sanitizeP(p) { var o = {}, k; for (k in p) o[k] = p[k]; return o; }
  var ADAPTERS = {
    none: { name: 'none', send: function () { return Promise.resolve(false); } },
    log: { name: 'log', send: function (batch) { batch.forEach(function (ev) { T.log.push({ e: ev.e, p: sanitizeP(ev.p), sid: ev.sid }); }); return Promise.resolve(true); } },
    portal: { name: 'portal', send: function (batch) {   // solo hitos de juego al SDK del portal (G.Platform, T-F3-02); nada a terceros
      try { if (G.Platform && G.Platform.track) batch.forEach(function (ev) { if (ev.e === 'run_start' || ev.e === 'run_end') G.Platform.track(ev.e, ev.p); }); } catch (e) { /* sin plataforma */ }
      return Promise.resolve(true); } },
    posthog: { name: 'posthog', send: function (batch) {
      var C = T.CFG, url = String(C.host).replace(/\/+$/, '') + '/batch/';
      var body = JSON.stringify({ api_key: C.key, batch: batch.map(function (ev) {
        var pr = sanitizeP(ev.p); pr.$process_person_profile = false; pr.$geoip_disable = true; pr.$lib = 'swarm-track';
        return { event: ev.e, distinct_id: ev.sid, timestamp: ev.p.t, properties: pr };
      }) });
      return fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: body, keepalive: true, credentials: 'omit', referrerPolicy: 'no-referrer', mode: 'cors' })
        .then(function (r) { return !!r.ok; }, function () {
          try { if (navigator.sendBeacon && navigator.sendBeacon(url, new Blob([body], { type: 'text/plain' }))) return true; } catch (e) { /* sin beacon */ }
          return false; });
    } }
  };

  // ---------------------------------------------------------------- Envío (fuera del bucle; nunca en combate salvo al cerrar)
  function schedule(ms) {
    clearTimeout(timer);
    timer = setTimeout(function () { var run = function () { T.flush(false); }; if (window.requestIdleCallback) requestIdleCallback(run, { timeout: 2000 }); else run(); }, ms);
  }
  T.flush = function (force) {
    try {
      if (!inited || consent !== true || mode === 'none' || !A.avail || !Q.length) return Promise.resolve(false);
      if (sending) return sending;
      if (!force && combat()) { schedule(T.CFG.flushMs); return Promise.resolve(false); }
      if (!force && navigator.onLine === false) { schedule(T.CFG.flushMs); return Promise.resolve(false); }
      var cut = Date.now() - T.CFG.maxAgeMs;
      Q = Q.filter(function (e) { var t = Date.parse(e.p.t); return !(t < cut); });
      if (!Q.length) return Promise.resolve(false);
      var batch = Q.slice(0, T.CFG.batch), p;
      try { p = adapter.send(batch); } catch (e) { p = Promise.resolve(false); }
      sending = p.then(function (ok) {
        sending = null;
        if (ok) { Q = Q.filter(function (e) { return batch.indexOf(e) < 0; }); fails = 0; persistSoon(); if (Q.length) schedule(force ? 200 : 2000); else schedule(T.CFG.flushMs); }
        else { fails++; schedule(Math.min(30 * 60000, 30000 * Math.pow(2, fails - 1))); }
        return !!ok;
      }, function () { sending = null; fails++; schedule(Math.min(30 * 60000, 30000 * Math.pow(2, fails - 1))); return false; });
      return sending;
    } catch (e) { sending = null; return Promise.resolve(false); }
  };

  // ---------------------------------------------------------------- Consentimiento
  T.noticeDue = function () { return inited && A.avail && consent === null; };
  T.consent = function (v, where) {
    try {
      if (!inited || !A.avail) return false;
      v = !!v; where = where || 'ajustes';
      if (v === (consent === true) && consent !== null) return true;
      if (!v) {   // rechazar o retirar: se vacía la cola y solo se guarda la elección
        consent = false; Q = []; S = { v: 1, pv: T.PV, consent: false, at: today() }; known = true; clearTimeout(timer); sending = null; persistNow(); return true;
      }
      var late = where !== 'aviso' || known;   // aceptar más tarde (Ajustes) no cuenta para la retención
      S = { v: 1, pv: T.PV, consent: true, at: today(), cohort: today(), lastDay: today(), sessN: 1, runN: 0, late: !!late, sampled: sampled, firstUse: {}, openRun: null, sessions: [sid] };
      consent = true; known = true;
      Q.forEach(function (ev) { ev.p.cohort = S.cohort; ev.p.day_n = 0; });   // lo que esperaba en memoria recibe ahora la cohorte
      if (late) Q = Q.filter(function (e) { return e.e !== 'first_open'; });
      enqueue('analytics_on', { where: where, at: today() });
      persistNow(); if (Q.length) schedule(2000);
      return true;
    } catch (e) { return false; }
  };
  T.wipe = function () {
    try { var ls = store(); if (ls) ls.removeItem(LS_KEY); } catch (e) { /* nada */ }
    S = null; known = false; consent = null; Q = []; fails = 0; clearTimeout(timer); clearTimeout(saveTimer); saveTimer = 0; sending = null; R = null;
  };
  T.state = function () {
    return { consent: consent, enabled: consent === true && mode !== 'none', adapter: mode, available: !!A.avail, reason: A.reason, queued: Q.length, sid: sid,
      cohort: S && S.cohort || null, day_n: S && S.cohort ? dayN(S.cohort) : 0, pv: T.PV, sessions: S && S.sessions ? S.sessions.slice() : [] };
  };
  T.recent = function (n) { return Q.slice(-(n || 12)).map(function (e) { return { e: e.e, p: e.p }; }); };   // "Ver qué se envía" (solo lo que hay en cola; local)
  T.prompt = function (cb) {   // muestra el aviso si hace falta y llama a cb(elección) al elegir; si no hace falta, cb() ya
    if (T.noticeDue() && G.TrackUI) G.TrackUI.open(cb); else if (cb) cb(consent);
  };

  // ---------------------------------------------------------------- Sesión
  function newSession(bg) {
    sid = rid(); sessCount = 0; sessErrs = 0; errSeen = {}; sessRuns = 0; playS = 0; visMs = 0; visT0 = Date.now(); sessMs0 = visT0;
    if (consent === true) {
      S.sessN = (S.sessN || 0) + 1; S.sessions.push(sid); if (S.sessions.length > 10) S.sessions.shift();
      var td = today();
      if (S.lastDay !== td) { if (dayN(S.cohort) >= 1 && !S.late) enqueue('day_return'); S.lastDay = td; }
    }
    enqueue('session_start', { sess_n: sessB(S && S.sessN || 1), bg_return: !!bg, ls: !!store() });
    if (consent === true) persistNow();
  }
  function hide() {
    if (hiddenAt) return;
    hiddenAt = Date.now(); visMs += hiddenAt - visT0;
    var d = Math.round(visMs / 1000);
    if (d > 5) enqueue('session_end', { dur_s: d, play_s: playS, runs: sessRuns, state: stateName() });
    if (consent === true) persistNow();
    T.flush(true);
  }
  function show() {
    if (!hiddenAt) return;
    var away = Date.now() - hiddenAt; hiddenAt = 0; visT0 = Date.now();
    if (away > 30 * 60000) newSession(true);
  }

  // ---------------------------------------------------------------- Enganches al juego (solo se instalan con adaptador activo; el resto del código no cambia)
  function wrap(obj, name, fn) {
    if (!obj || typeof obj[name] !== 'function') return;
    var orig = obj[name];
    obj[name] = function () { var self = this, args = arguments, pre = null; try { pre = fn.pre ? fn.pre.apply(self, args) : null; } catch (e) { /* nunca rompe */ }
      var r = orig.apply(self, args); try { if (fn.post) fn.post.call(self, r, pre, args); } catch (e2) { /* nunca rompe */ } return r; };
  }
  function bt(fn) { return { post: fn }; }
  function peril() { return G.mode === 'practice' ? 1 : Math.round(G.peligro || 1); }
  var MODE = { run: 'normal', hunt: 'caceria', practice: 'practica' };
  function firstUse(k) { var fu = S ? S.firstUse : (T._fu = T._fu || {}); if (fu[k]) return false; fu[k] = 1; return true; }
  function cleanMsg(m) {
    return String(m == null ? '' : m).replace(/https?:\/\/\S+/gi, '').replace(/[\w.+-]+@[\w-]+\.[\w.-]+/g, '').replace(/(?:[A-Za-z]:)?[\\\/][\w.\-\\\/]+/g, '').replace(/\d{5,}/g, '#').replace(/\s+/g, ' ').trim().slice(0, 120);
  }
  function installHooks() {
    var C = G.Cine, Dg = window.Diag;
    if (C && C.playIntro) {   // onEnd propio: playIntro lo recibe dentro de opts
      var pi = C.playIntro;
      C.playIntro = function (o) {
        o = o || {}; var first = !o.replay && !C.introSeen(), t0 = Date.now(), inner = o.onEnd, o2 = {}, k;
        for (k in o) o2[k] = o[k];
        o2.onEnd = function (reason) { try { enqueue('intro_end', { watched_s: Math.round((Date.now() - t0) / 1000), skipped: reason === 'skip', first: first }); } catch (e) { /* nada */ } if (inner) inner(reason); };
        return pi.call(C, o2);
      };
    }
    wrap(G, 'startGame', bt(function () {
      if (G.state !== 'play' && G.state !== 'cards') return;
      sessRuns++; if (S) { S.runN = (S.runN || 0) + 1; }
      var rn = sessB(S ? S.runN : sessRuns);
      R = { t0: G.time, biome: G.curBiome || 'bosque', peril: peril(), mode: MODE[G.mode] || 'normal', dur: Math.round(G.RUN_LEN / 60000), rn: rn, boss: null, card: null };
      if (S) S.openRun = { biome: R.biome, peril: R.peril, mode: R.mode, dur: R.dur, at: Date.now(), rn: rn };
      enqueue('run_start', { biome: R.biome, peril: R.peril, mode: R.mode, dur: R.dur, run_n: rn, from: String((G.Fte && G.Fte.from && G.Fte.from()) || 'portal') });
      if (consent === true) persistNow();
    }));
    wrap(G.Cards, 'open', bt(function (r, p, a) { if (R && R.card == null && a[0] === 'level') R.card = runS(); }));
    wrap(G.Boss, 'spawn', bt(function () {
      if (!R || R.boss) return;
      var pl = G.player || {}; R.boss = { t0: G.time, id: G.bossId || (G.Boss.e && G.Boss.e.id) || 'jefe' };
      enqueue('boss_start', { boss: String(R.boss.id), peril: peril(), run_s: runS(), hp_pct: pl.maxHp ? Math.round(pl.hp / pl.maxHp * 10) * 10 : 0 });
    }));
    wrap(G, 'finish', { pre: function (won) {
      if (G.state === 'gameover' || !R) return null;
      var pl = G.player || {}, won0 = !!won, dead = !!pl.dead, bs = G.Loot && G.Loot.run && G.Loot.run.boss, res = won0 ? 'win' : dead ? 'death' : 'quit';
      if (R.boss) enqueue('boss_end', { boss: String(R.boss.id), peril: peril(), result: bs && bs.won ? 'win' : dead ? 'death' : 'quit', fight_s: Math.round((G.time - R.boss.t0) / 1000), hp_pct: pl.maxHp ? Math.round(pl.hp / pl.maxHp * 10) * 10 : 0, parts: bs && bs.parts ? bs.parts.length : 0 });
      var cause = res === 'win' ? 'win' : res === 'quit' ? 'quit' : (G.Boss && G.Boss.active && G.bossId) ? String(G.bossId) : String(G.lastHurtSrc || 'desconocido');
      var pw = (pl.actives || []).filter(Boolean).map(function (a) { return a.id + ':' + (a.uses || 0); }).join(',');
      enqueue('run_end', { biome: R.biome, peril: R.peril, mode: R.mode, result: res, cause: cause, dur_s: runS(), level: pl.level || 1, kills: killB(G.kills || 0), boss_reached: !!R.boss,
        first_card_s: R.card == null ? -1 : R.card, fusions: (G.Fusion && G.Fusion.fused) || 0, powers: pw, run_n: R.rn });
      R = null; if (S) { S.openRun = null; persistNow(); }
      schedule(1500);
      return null;
    } });
    if (G.Fusion) {
      wrap(G.Fusion, 'fuse', { pre: function () { return G.Fusion.fused; }, post: function (r, n0, a) {
        if (G.Fusion.fused > n0) enqueue('fusion', { id: String(a[0] && a[0].id || ''), replaced: '', run_s: runS(), first: firstUse('fusion') });
      } });
      wrap(G.Fusion, 'fire', bt(function (r, p, a) {
        if (!r) return; var s = G.player && G.player.actives && G.player.actives[a[0]];
        if (s && firstUse('p_' + s.id)) enqueue('power_first_use', { id: String(s.id), run_s: runS() });
      }));
    }
    if (G.Manual) {
      var mt = 0, mf = 'otro';
      wrap(G.Manual, 'open', bt(function () { mt = Date.now(); mf = G.state === 'paused' ? 'pausa' : G.state === 'aldea' ? 'aldea' : 'otro'; }));
      wrap(G.Manual, 'close', bt(function () { if (mt) { enqueue('manual_open', { from: mf, open_s: Math.round((Date.now() - mt) / 1000) }); mt = 0; } }));
    }
    if (G.Sys && G.Sys.setQuality) wrap(G.Sys, 'setQuality', { pre: function () { return G.Q && G.Q.level; }, post: function (r, from, a) { if (!a[1] && G.Q && G.Q.level !== from) { lastQ = G.Q.level; enqueue('settings_quality', { from: from, to: G.Q.level, auto: false }); } } });
    if (G.Tree) wrap(G.Tree, 'buy', { pre: function (id) { return id; }, post: function (r, id) {
      if (r && r.ok) enqueue('shop_buy', { where: 'arbol', item: String(id), cur: 'mixto', cost: costB(0), run_n: sessB(S ? S.runN || 0 : sessRuns) });
    } });
    if (G.Armor) wrap(G.Armor, 'craft', bt(function (r, p, a) { if (r) enqueue('shop_buy', { where: 'herrero', item: String(a[0]), cur: 'mixto', cost: costB(0), run_n: sessB(S ? S.runN || 0 : sessRuns) }); }));
    if (G.Quests) wrap(G.Quests, 'claim', { pre: function () { var a = G.Quests.active && G.Quests.active(); return a && a.id; }, post: function (r, id) { if (r && id) enqueue('shop_buy', { where: 'tablon', item: String(id), cur: 'brasas', cost: costB(0), run_n: sessB(S ? S.runN || 0 : sessRuns) }); } });
    if (Dg && Dg.log) {
      var dl = Dg.log;
      Dg.log = function (msg, o) {
        var r = dl.apply(this, arguments);
        try {
          o = o || {}; var m = cleanMsg(msg);
          if (sessErrs < 3 && !errSeen[m]) { errSeen[m] = 1; sessErrs++; enqueue('error', { kind: String(o.kind || 'error').slice(0, 20), msg: m, src: String(o.src || '').replace(/^.*\/(?=[^\/]+$)/, '').replace(/[?#].*$/, '').slice(0, 40), line: o.line || 0, state: stateName() }); }
        } catch (e) { /* nada */ }
        return r;
      };
    }
  }

  // ---------------------------------------------------------------- Arranque (desde G.init)
  T.init = function () {
    if (inited) return;
    try {
      var tz = tzName(), off = tp === '0' || tp === 'off', st = store();
      if (off) A.reason = 'apagado'; else if (navigator.webdriver && !forced) A.reason = 'bot'; else if (D.on && !forced) A.reason = 'dev'; else if (T.isEurope(tz)) A.reason = 'europa'; else if (!st || (G.Save && G.Save.ok === false)) A.reason = 'sinalmacen';
      A.avail = !A.reason;
      var C = T.CFG, name = C.adapter;
      if (D.on && tp === 'log') name = 'log';
      else if (D.on && tp === 'on') { name = 'posthog'; C = T.CFG = { adapter: 'posthog', host: dq('trackhost') || C.host, key: dq('trackkey') || C.key, sample: 1, sessionCap: C.sessionCap, queueMax: C.queueMax, bytesMax: C.bytesMax, batch: C.batch, flushMs: C.flushMs, maxAgeMs: C.maxAgeMs }; }
      else if (/^(localhost|127\.0\.0\.1|\[::1\])$/.test(location.hostname)) name = 'none';
      if (!ADAPTERS[name] || (name === 'posthog' && (!C.host || !/^phc_/.test(C.key || '')))) name = 'none';
      mode = A.avail ? name : 'none'; adapter = ADAPTERS[mode];
      if (A.avail) load();
      sampled = S && typeof S.sampled === 'boolean' ? S.sampled : Math.random() < (C.sample == null ? 1 : C.sample);
      inited = true;
      if (!A.avail) return;
      sid = rid(); visT0 = Date.now(); sessMs0 = visT0;
      if (consent === true) {
        S.sessN = (S.sessN || 0) + 1; S.sessions.push(sid); if (S.sessions.length > 10) S.sessions.shift();
        if (S.openRun) {   // la expedición de la sesión anterior se cerró sin terminar
          var o = S.openRun; S.openRun = null;
          enqueue('run_end', { biome: o.biome, peril: o.peril, mode: o.mode, result: 'abandon', cause: 'quit', dur_s: Math.max(0, Math.round(((S.lastSeen || o.at) - o.at) / 1000)), level: 1, kills: '0', boss_reached: false, first_card_s: -1, fusions: 0, powers: '', run_n: o.rn });
        }
        var td = today();
        if (S.lastDay !== td) { if (dayN(S.cohort) >= 1 && !S.late) enqueue('day_return'); S.lastDay = td; }
        enqueue('session_start', { sess_n: sessB(S.sessN), bg_return: false, ls: true });
        persistNow(); schedule(5000);
      } else if (consent === null) {
        if (!known) enqueue('first_open', { has_save: !!(G.Save && G.Save.data && G.Save.data.runs > 0) });
        enqueue('session_start', { sess_n: '1', bg_return: false, ls: true });
      }
      if (mode !== 'none') {
        installHooks();
        document.addEventListener('visibilitychange', function () { if (document.hidden) hide(); else show(); });
        window.addEventListener('pagehide', function () { if (S) S.lastSeen = Date.now(); hide(); });
        setInterval(function () {   // 1 vez por segundo: tiempo jugado y cambio automático de calidad
          if (document.hidden) return;
          if (G.state === 'play') playS++;
          var ql = G.Q && G.Q.level; if (!lastQ) lastQ = ql; else if (ql && ql !== lastQ) { var f = lastQ; lastQ = ql; enqueue('settings_quality', { from: f, to: ql, auto: true }); }
        }, 1000);
      }
    } catch (e) { A.avail = false; mode = 'none'; }
  };
})();
