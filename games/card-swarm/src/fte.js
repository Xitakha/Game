/* fte.js - G.Fte: primera sesión (T-F1-02, studio/docs/SPEC-T-F1-02-04.md). Solo UI y estado del guardado: NUNCA toca G.rng ni la simulación.
   - Estado en Save.data.flags.fte = { v, step: ''|'run1'|'village'|'done', runs (salidas contadas), ann (salida ya anunciada en la aldea), hints{}, seen{}, priv, introTry, legacy }.
     save.js lo crea al cargar: cuentas con progreso = legacy (aldea completa, nada de esto). step '' = cuenta nueva que aún no ha pasado por la intro de este flujo.
   - Flujo: título -> intro completa -> tarjeta "Antes de salir" (aviso de privacidad, dos botones del mismo peso, los dos lanzan la 1.ª expedición) -> expedición -> fin -> aldea por pasos.
   - Avisos de combate (move, gems, pick, power): una línea cada uno, se cierran al hacer la acción, una vez por cuenta.
   - Interruptor: G.B.fte = false o ?fte=0 (con ?dev=1) devuelven el flujo antiguo. Las cuentas que no entran por la intro (bots, ?cine=0, ?direct=1) nunca quedan "enganchadas". */
(function () {
  'use strict';
  var G = window.G, F = G.Fte = {}, D = window.Dev || { on: false, search: location.search };
  var SEARCH = D.search || location.search || '';
  if (G.B && G.B.fte == null) G.B.fte = !(D.on && /[?&]fte=0/.test(SEARCH));
  F.nextFrom = null;

  function d() {
    var fl = G.Save.data.flags;
    if (!fl.fte || typeof fl.fte !== 'object') fl.fte = { v: 1, step: '', runs: 0, ann: 0, hints: {}, seen: {} };
    var f = fl.fte; if (!f.hints) f.hints = {}; if (!f.seen) f.seen = {}; if (typeof f.runs !== 'number') f.runs = 0; if (typeof f.ann !== 'number') f.ann = 0; if (typeof f.step !== 'string') f.step = '';
    return f;
  }
  F.data = d;
  F.enabled = function () { return !!(G.B && G.B.fte !== false); };
  // ¿Cuenta dentro del flujo nuevo? (tras la intro y hasta la 4.ª salida)
  F.engaged = function () { var f = d(); return F.enabled() && !f.legacy && (f.step === 'run1' || f.step === 'village'); };
  F.from = function () { var v = F.nextFrom || 'portal'; return v; };
  function firstRun() { var f = d(); return F.engaged() && f.step === 'run1' && f.runs === 0 && G.mode === 'run' && !G.bossUrl && !G.huntUrl; }
  F.isFirst = firstRun;
  function track(n, p) { try { if (G.Track) G.Track(n, p); } catch (e) { /* analítica opcional */ } }
  function save() { try { G.Save.save(); } catch (e) { /* sin guardado */ } }

  // ------------------------------------------------------------- Intro: segundo intento saltable
  F.introTried = function () { return !!d().introTry; };
  F.markIntroTry = function () { var f = d(); if (!f.introTry) { f.introTry = 1; save(); } };

  // ------------------------------------------------------------- Tras la intro: tarjeta "Antes de salir" y salida directa
  // Devuelve true si toma el control (la aldea no se muestra). next = gancho de arranque de G.init (?direct, ?boss...): si lo hay con URL de prueba, no se interviene.
  F.shouldStart = function () {
    var f = d();
    if (!F.enabled() || f.legacy || f.step !== '' || G.Save.data.runs > 0) return false;
    if (G.bossUrl || G.huntUrl || /[?&](direct|assault)=1/.test(SEARCH)) return false;
    return true;
  };
  F.start = function () {
    if (!F.shouldStart()) return false;
    var f = d(), T = G.Track, due = false;
    try { due = !!(T && T.noticeDue && T.noticeDue() && G.TrackUI); } catch (e) { due = false; }
    G.state = 'aldea';
    if (due) G.TrackUI.open(function (yes) { f.priv = yes ? 'on' : 'off'; F.launchFirst(); }, { fte: true });
    else F.launchFirst();
    return true;
  };
  F.launchFirst = function () {
    var f = d(); f.step = 'run1'; f.runs = 0; save();
    G.launchReq = null; F.nextFrom = 'fte';
    G.Base.launch();
  };

  // ------------------------------------------------------------- Avisos de combate
  var HINT = {
    move: { ms: 12000, text: function () { return G.hint('Muévete con WASD o las flechas', 'Arrastra el pulgar a la izquierda para moverte'); } },
    gems: { ms: 15000, text: function () { return 'Recoge las gemas: llenan tu barra de nivel'; } },
    power: { ms: 10000, text: function () { return G.hint('Tu poder está listo: pulsa ' + (powerKey() || 'Q'), 'Tu poder está listo: tócalo (abajo a la derecha)'); } }
  };
  var PKEYS = ['Q', 'E', 'R', 'Espacio'];
  function powerSlot() { var a = (G.player && G.player.actives) || []; for (var i = 0; i < a.length; i++) if (a[i]) return i; return -1; }
  function powerKey() { var i = powerSlot(); return i >= 0 ? PKEYS[i] : ''; }
  var cur = null, mv = 0, gemN = 0, lastXP = null, since = 0, regems = false, ended = false;
  F.beginRun = function () { cur = null; mv = 0; gemN = 0; lastXP = null; since = 0; regems = false; ended = false; };
  function totalXP(p) { var s = p.xp || 0, L; for (L = 1; L < p.level; L++) s += G.B.xpNeed(L); return s; }
  function show(id) { var h = d().hints; h[id] = 1; cur = { id: id, t: 0 }; save(); track('hint_shown', { id: id }); }
  function done(by) { if (!cur) return; track('hint_done', { id: cur.id, ms: Math.round(cur.t), by: by }); cur = null; }
  F.current = function () { return cur && cur.id; };
  F.xpBig = function () { return !!cur && cur.id === 'gems'; };
  F.tick = function (dt) {   // desde G.Hud.update (solo estado de UI)
    if (!firstRun()) { cur = null; return; }
    var p = G.player, h = d().hints, inp = G.input;
    since += dt;
    var tx = totalXP(p); if (lastXP != null && tx > lastXP + 1e-6) gemN++; lastXP = tx;
    var moving = (inp.joy && inp.joy.active && Math.hypot(inp.joy.x, inp.joy.y) > 0.12) || inp.held('KeyW', 'KeyA', 'KeyS', 'KeyD', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight');
    if (moving) mv += dt;
    if (cur) {
      cur.t += dt;
      var H = HINT[cur.id];
      if (cur.id === 'move' && mv >= 1500) done('action');
      else if (cur.id === 'gems' && gemN >= 3) done('action');
      else if (cur.id === 'power' && ((p.actives || []).some(function (a) { return a && a.uses > 0; }) || (G.Fusion && G.Fusion.auto))) done('action');
      else if (H && cur.t >= H.ms) done('timeout');
      return;
    }
    if (!h.move) { show('move'); return; }
    var hasGem = (G.gems || []).some(function (g) { return g.kind === 'xp'; });
    if (!h.gems && (hasGem || gemN > 0) && gemN < 3) { show('gems'); return; }
    if (h.gems && !regems && since > 25000 && p.level <= 1 && gemN < 3) { regems = true; cur = { id: 'gems', t: 0 }; track('hint_shown', { id: 'gems' }); return; }   // reaparece una vez
    if (!h.power && powerSlot() >= 0 && G.state === 'play') { show('power'); return; }
  };
  // Subtítulo de la 1.ª oferta de nivel (cards.js): devuelve el texto o null
  F.pickHint = function (O) {
    if (!O || O.mode !== 'level' || !firstRun()) return null;
    var h = d().hints;
    if (!O.fteHint) { if (h.pick) return null; h.pick = 1; O.fteHint = 1; O.fteT = Date.now(); save(); track('hint_shown', { id: 'pick' }); }
    return 'Elige una carta. Si pone FUSIÓN, crea un poder con tu mano';
  };
  F.onPick = function (O) { if (O && O.fteHint && !O.fteDone) { O.fteDone = 1; track('hint_done', { id: 'pick', ms: Date.now() - (O.fteT || Date.now()), by: 'action' }); } };

  function fade(t) { return Math.min(1, t / 200); }
  F.draw = function (c) {   // banda de aviso y anillo del botón de poder (Hud.draw, estado 'play')
    if (!cur || G.state !== 'play') return;
    var H = HINT[cur.id]; if (!H) return;
    var calm = !!(G.Cine && G.Cine.cfg && G.Cine.cfg().calm), w = 580, h = 44, x = G.W / 2 - w / 2, y = 74;
    c.save(); c.globalAlpha = calm ? 1 : fade(cur.t);
    c.fillStyle = 'rgba(10,6,18,0.82)'; c.fillRect(x, y, w, h); c.strokeStyle = '#ffd27a'; c.lineWidth = 2; c.strokeRect(x + 1, y + 1, w - 2, h - 2);
    var ix = x + 26, iy = y + h / 2;   // icono de 28 px
    c.fillStyle = '#ffd27a'; c.strokeStyle = '#ffd27a'; c.lineWidth = 3;
    if (cur.id === 'gems') { c.fillStyle = '#4dd870'; c.beginPath(); c.moveTo(ix, iy - 13); c.lineTo(ix + 10, iy); c.lineTo(ix, iy + 13); c.lineTo(ix - 10, iy); c.closePath(); c.fill(); }
    else if (cur.id === 'move') { c.beginPath(); c.arc(ix, iy, 11, 0, 6.283); c.stroke(); c.beginPath(); c.moveTo(ix - 7, iy); c.lineTo(ix + 7, iy); c.moveTo(ix - 7, iy); c.lineTo(ix - 1, iy - 6); c.moveTo(ix - 7, iy); c.lineTo(ix - 1, iy + 6); c.stroke(); }
    else { c.beginPath(); c.arc(ix, iy, 12, 0, 6.283); c.fill(); c.fillStyle = '#0a0610'; c.beginPath(); c.arc(ix, iy, 5, 0, 6.283); c.fill(); }
    G.txt(c, H.text(), x + w / 2 + 20, y + h / 2, 16, '#ffffff', 'center');
    c.restore();
    if (cur.id === 'power') {
      var si = powerSlot(), b = G.Fusion && G.Fusion.BTN && G.Fusion.BTN[si];
      if (b) { c.save(); c.strokeStyle = '#ffd27a'; c.lineWidth = 4; c.beginPath(); c.arc(b.x, b.y, b.r + 8 + (calm ? 0 : 2 * Math.sin(G.time / 180)), 0, 6.283); c.stroke(); c.restore(); }
    }
  };

  // ------------------------------------------------------------- Fin de expedición y aldea por pasos
  // Llamado desde Loot.endRun (antes de contar). Devuelve true si esta era la 1.ª expedición. Cuenta la salida si dura >= 60 s (o gana); el abandono rápido no adelanta NPC.
  F.onRunEnd = function (won, secs) {
    var f = d(), first = firstRun();
    if (!F.engaged() || G.mode !== 'run' || G.bossUrl) return first;
    if (won || secs >= 60) { f.runs++; f.step = f.runs >= 4 ? 'done' : 'village'; }
    else if (f.step === 'run1' && f.runs === 0) f.step = 'run1';
    save(); return first;
  };
  var ORDER = { lanudo: 1, grum: 2, vesper: 2, ulalume: 3, rufo: 3, castana: 4 };
  F.npcVisible = function (id) {
    if (!F.engaged() || !(id in ORDER)) return true;
    var k = (G.Save.data.bossKills) || {}; if (Object.keys(k).some(function (b) { return k[b] > 0; })) return true;
    return d().runs >= ORDER[id];
  };
  F.visibleCount = function () { return Object.keys(ORDER).filter(F.npcVisible).length; };
  F.isNew = function (id) { return F.engaged() && id in ORDER && F.npcVisible(id) && !d().seen[id]; };
  F.met = function (id) { if (!(id in ORDER)) return; var f = d(); if (!f.seen[id]) { f.seen[id] = 1; save(); track('npc_intro', { id: id }); } };
  var ARRIVE = {
    1: 'Lanudo quiere hablar contigo.',
    2: 'Grum ha encendido la forja. Vesper tiene un encargo para ti.',
    3: 'Ulalume abre su carpa. Rufo ha vuelto con mercancía.',
    4: 'Tía Castaña tiene la olla al fuego.'
  };
  // Al abrir la aldea tras una salida: texto de llegada (una sola vez por paso) o null
  F.arrival = function () {
    var f = d(); if (!F.enabled() || f.legacy) return null;
    if (F.engaged()) track('aldea_open', { n_run: f.runs, npcs: F.visibleCount() });
    if (f.runs > f.ann) { var t = ARRIVE[Math.min(4, f.runs)]; f.ann = f.runs; save(); return t || null; }
    if (f.runs === 0 && f.step === 'run1') return 'Entra al Portal para salir otra vez.';
    return null;
  };
  F.lanudoWelcome = function () { var f = d(); return F.engaged() && f.runs >= 1 && !f.seen.lanudo ? 'Has vuelto entero. Eso ya es mucho. Las Brasas que traes sirven para forjar; pronto te presento a Grum.' : null; };
})();
