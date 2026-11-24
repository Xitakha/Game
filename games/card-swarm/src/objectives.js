/* objectives.js - G.Obj: objetivos diarios y semanales y racha amable "Hoguera de Rescoldo" (T-F1-06, DESIGN-v10-retencion.md sección 2).
   - 3 diarios (fácil, medio, difícil) y 2 semanales (normal, difícil). Se abren tras la 1.ª expedición. Avanzan solos en expedición, cacería, Asalto y reto (la práctica no)
     y se cobran solos al cumplirse. 1 cambio gratis al día. Rotan por semilla de calendario (UTC) solo en la aldea o el título: una salida cuenta para el día en que empezó.
   - Tope semanal duro OBJ_WEEK_CAP (360 Brasas, 130 partes, 1 Esencia): si un pago lo superase, se recorta y se anota en wpaid.trim.
   - Racha: +1 por día con una salida de 60 s o más (también práctica) o un reto. El primer día perdido de un hueco es gratis; cada día más gasta 1 Leña (máx. 2, +1 cada 5 días jugados);
     sin Leña la racha baja a la mitad (nunca a cero). 15 días o más fuera: mitad y bienvenida. Recompensas de racha solo cosméticas (farolillos, guirnalda, chispas, hoguera mayor).
   - Nada de esto toca la simulación (G.rng, director, daño). Estado en Save.data.daily.obj / .streak (save.js v13). Apagado: ?dev=1&obj=0. */
(function () {
  'use strict';
  var G = window.G, O = G.Obj = {};
  O.ON = !(Dev.on && /[?&]obj=0/.test(Dev.search));
  O.OPEN_RUNS = 1;
  O.WEEK_CAP = { brasas: 360, parts: 130, rare: 1 };
  O.MILES = [3, 7, 14, 21, 28];
  O.TXT = {
    tab: 'DIARIO', title: 'DIARIO  -  Vesper', today: 'HOY  ·  cambian en {0}', week: 'ESTA SEMANA  ·  cambian el lunes', done: 'CUMPLIDO  ·  cobrado', reroll: 'CAMBIAR', rerollSub: '1 gratis al día', rerollUsed: 'mañana',
    fireHead: 'HOGUERA DE RESCOLDO', fireState: 'Racha {0} días  ·  mejor {1}  ·  Leña {2}/2', fireHelp: 'Un día sin jugar no apaga nada. Más días gastan Leña.', nextMile: 'Próximo farolillo: día {0}', top: 'Hoguera mayor encendida. La racha sigue contando.',
    chipOn: 'hoy encendida', chipOff: 'juega una salida hoy', chipName: 'RACHA {0}', vesper: 'Hoy tengo tres recados cortos. Mira la pestaña DIARIO.', closed: 'Los objetivos se abren tras tu primera expedición.',
    objDone: '¡OBJETIVO! +{0} Brasas', objWeek: '¡OBJETIVO SEMANAL! +{0} Brasas', objWeekRare: '¡OBJETIVO SEMANAL! +{0} Brasas, +1 Esencia', up: 'Racha: {0} días', mile: '¡Se enciende un farolillo en Rescoldo!',
    grace: 'Ayer descansaste. Tu racha sigue: {0}.', wood: 'La Leña mantuvo la hoguera. Te queda {0}.', half: 'La hoguera se templó: racha {0} -> {1}. ¡A por ella!', welcome: '¡Has vuelto! La hoguera te guardó la mitad: racha {0}.',
    cap: 'Tope semanal de objetivos alcanzado.', tabObj: 'OBJETIVOS', tabFire: 'HOGUERA', diff1: 'FÁCIL', diff2: 'MEDIO', diff3: 'DIFÍCIL', wdiff1: 'SEMANAL', wdiff2: 'SEMANAL DIFÍCIL',
    mile3: 'Primer farolillo junto a la hoguera', mile7: 'Segundo farolillo y título "Vecino de Rescoldo"', mile14: 'Guirnalda de farolillos entre las casas', mile21: 'Chispas doradas en la hoguera', mile28: 'Hoguera mayor', got: 'conseguido', woodTxt: 'Leña: {0}/2  (+1 cada 5 días jugados)',
    rerolled: 'Objetivo cambiado.', rerollNo: 'El cambio gratis de hoy ya está usado.'
  };
  function t(k) { var s = O.TXT[k] != null ? O.TXT[k] : k, a = arguments; s = s.replace(/\{(\d)\}/g, function (m, i) { var v = a[+i + 1]; return v == null ? '' : String(v); }); return G.Res ? G.Res.fix(s) : s; }   // T-F1-07: "1 Esencia" = "1 parte rara" hasta el Rango III
  O.t = t;

  // ------------------------------------------------------------- Catálogos (2.2, 2.3). ev: contador del informe de la salida; kind sum (se suma en el día / semana) o max (mejor de una salida)
  O.DAILY = [
    { id: 'd_kills', d: 1, goal: 300, ev: 'kills', kind: 'sum', txt: 'Derrota a 300 enemigos' },
    { id: 'd_runs', d: 1, goal: 2, ev: 'runs', kind: 'sum', txt: 'Termina 2 salidas' },
    { id: 'd_level', d: 1, goal: 10, ev: 'level', kind: 'max', txt: 'Llega a nivel 10' },
    { id: 'd_fuse', d: 1, goal: 1, ev: 'fuses', kind: 'sum', txt: 'Crea una fusión' },
    { id: 'd_parts', d: 1, goal: 25, ev: 'parts', kind: 'sum', txt: 'Recoge 25 partes' },
    { id: 'd_reto', d: 1, goal: 1, ev: 'reto', kind: 'sum', txt: 'Juega el reto del día', need: 'reto' },
    { id: 'd_mini', d: 2, goal: 1, ev: 'minis', kind: 'sum', txt: 'Derrota a un guardián' },
    { id: 'd_reach', d: 2, goal: 1, ev: 'reach', kind: 'sum', txt: 'Llega al jefe' },
    { id: 'd_power', d: 2, goal: 20, ev: 'uses', kind: 'max', txt: 'Usa poderes 20 veces' },
    { id: 'd_clean30', d: 2, goal: 30, ev: 'clean', kind: 'max', txt: 'Aguanta 30 s sin daño' },
    { id: 'd_fuse2', d: 2, goal: 2, ev: 'fuseKinds', kind: 'max', txt: 'Crea 2 fusiones distintas en una salida' },
    { id: 'd_part', d: 2, goal: 1, ev: 'bparts', kind: 'sum', txt: 'Rompe una parte de jefe' },
    { id: 'd_win', d: 3, goal: 1, ev: 'wins', kind: 'sum', txt: 'Vence a un jefe' },
    { id: 'd_mini2', d: 3, goal: 2, ev: 'minis', kind: 'max', txt: 'Derrota a los 2 guardianes en una salida' },
    { id: 'd_clean60', d: 3, goal: 60, ev: 'clean', kind: 'max', txt: 'Aguanta 60 s sin daño' },
    { id: 'd_wintag', d: 3, goal: 1, ev: 'wintag', kind: 'sum', txt: 'Gana con 3 cartas de una etiqueta' },
    { id: 'd_pel2', d: 3, goal: 1, ev: 'winPel2', kind: 'sum', txt: 'Vence a un jefe en Peligro II o más', need: 'pel2' },
    { id: 'd_parts3', d: 3, goal: 3, ev: 'bparts', kind: 'max', txt: 'Rompe 3 partes de jefe en una salida' }
  ];
  O.WEEKLY = [
    { id: 'w_days', d: 1, goal: 4, ev: 'days', kind: 'days', txt: 'Juega 4 días distintos' },
    { id: 'w_kills', d: 1, goal: 2000, ev: 'kills', kind: 'sum', txt: 'Derrota a 2.000 enemigos' },
    { id: 'w_boss3', d: 1, goal: 3, ev: 'wins', kind: 'sum', txt: 'Vence a 3 jefes' },
    { id: 'w_mini6', d: 1, goal: 6, ev: 'minis', kind: 'sum', txt: 'Derrota a 6 guardianes' },
    { id: 'w_medal3', d: 1, goal: 3, ev: 'medal1', kind: 'sum', txt: 'Saca 3 Bronces o mejor en el reto', need: 'reto' },
    { id: 'w_fuse8', d: 1, goal: 8, ev: 'wfuse', kind: 'wfuse', txt: 'Crea 8 fusiones distintas' },
    { id: 'w_oro', d: 2, goal: 1, ev: 'oro', kind: 'sum', txt: 'Saca un Oro en el reto', need: 'reto' },
    { id: 'w_pelup', d: 2, goal: 1, ev: 'pelup', kind: 'sum', txt: 'Sube un Peligro', need: 'pelup' },
    { id: 'w_parts8', d: 2, goal: 8, ev: 'bparts', kind: 'sum', txt: 'Rompe 8 partes de jefe' }
  ];
  var BYD = {}; O.DAILY.concat(O.WEEKLY).forEach(function (o) { BYD[o.id] = o; });
  O.def = function (id) { return BYD[id]; };
  O.CYCLE = ['wick', 'frost', 'static', 'spine', 'fang', 'plate'];   // parte escasa del día (Mecha, Escarcha, Jirón, Púa, Colmillo, Placa)
  O.reward = function (o, day) {
    var c = O.CYCLE, k = ((day % 6) + 6) % 6, p = {};
    if (o.id.charAt(0) === 'w') {
      if (o.d === 1) return { brasas: 30, parts: { thread: 6, feather: 4 }, rare: 0 };
      p.thread = 9; p[c[(k + 1) % 6]] = (p[c[(k + 1) % 6]] || 0) + 3; p[c[(k + 2) % 6]] = (p[c[(k + 2) % 6]] || 0) + 3; return { brasas: 50, parts: p, rare: 1 };
    }
    if (o.d === 1) return { brasas: 8, parts: { thread: 3 }, rare: 0 };
    if (o.d === 2) return { brasas: 12, parts: { thread: 2, feather: 2 }, rare: 0 };
    p.thread = 3; p[c[k]] = 3; return { brasas: 18, parts: p, rare: 0 };
  };
  O.rewardText = function (o, day) { var r = O.reward(o, day), L = G.Loot; return '+' + r.brasas + ' Brasas' + Object.keys(r.parts).map(function (k) { return ', ' + r.parts[k] + ' ' + L.part(k).short; }).join('') + (r.rare ? ', ' + (G.Res ? G.Res.fix('1 Esencia') : '1 Esencia') : ''); };

  function SV() { return G.Save.data; }
  function DD() { return SV().daily; }
  function Dl() { return G.Daily; }
  O.isOpen = function () { return O.ON && (SV().runs || 0) >= O.OPEN_RUNS && (!G.Res || G.Res.objOpen()); };   // T-F1-07 (SPEC 3.6): en el flujo nuevo, el Diario llega con Vesper
  function avail(o) {
    if (o.need === 'reto') return Dl().isOpen();
    if (o.need === 'pel2') return G.Save.BOSSES.some(function (b) { return G.Save.pelMax(b) >= 2; });
    if (o.need === 'pelup') return G.Save.BOSSES.some(function (b) { return G.Save.pelMax(b) < 5; });
    return true;
  }
  function shuffled(list, seed) { var r = G.util.rng(seed), a = list.slice(); for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(r() * (i + 1)), x = a[i]; a[i] = a[j]; a[j] = x; } return a; }
  function pick(cat, diff, seed, avoid) {
    var c = cat.filter(function (o) { return o.d === diff && avail(o); }), s = shuffled(c, seed);
    return s.filter(function (o) { return avoid.indexOf(o.id) < 0; })[0] || s[0] || null;
  }
  function entry(o) { return { id: o.id, goal: o.goal, prog: 0, done: 0, paid: 0 }; }
  // Genera o rota la lista del día y de la semana. Solo en la aldea o el título (nunca en partida)
  O.ensure = function () {
    if (!O.isOpen()) return false;
    var D = DD(), ob = D.obj, day = Dl().today(), wk = Dl().weekOf(day), H = G.util.hash, ch = false;
    if (ob.day < day || !ob.list.length) {
      var y = ob.list.map(function (e) { return e.id; }), key = Dl().dayKey(day);
      ob.yday = y; ob.list = [];
      [1, 2, 3].forEach(function (d) { var o = pick(O.DAILY, d, H('SH-obj|' + key + '|' + d), y); if (o) ob.list.push(entry(o)); });
      ob.day = day; ch = true;
    }
    if (ob.week < wk || !ob.wlist.length) {
      var wp = ob.wlist.map(function (e) { return e.id; });
      ob.wprev = wp; ob.wlist = [];
      [1, 2].forEach(function (d) { var o = pick(O.WEEKLY, d, H('SH-obj-sem|' + wk + '|' + d), wp); if (o) ob.wlist.push(entry(o)); });
      ob.week = wk; ob.wpaid = { brasas: 0, parts: 0, rare: 0, trim: 0 }; ob.wdays = {}; ob.wfuse = {}; ch = true;
      var sl = DD().streak.last; if (sl && Dl().weekOf(sl) === wk) ob.wdays[sl] = 1;   // el día ya jugado de esta semana cuenta
      daysProg();
    }
    if (ch) G.Save.save();
    return ch;
  };
  O.rerollUsed = function () { return DD().obj.rerollDay === Dl().today(); };
  O.reroll = function (i) {
    var ob = DD().obj, e = ob.list[i]; if (!e || e.done) return { ok: false };
    if (O.rerollUsed()) return { ok: false, msg: t('rerollNo') };
    var o = O.def(e.id), cur = ob.list.map(function (x) { return x.id; });
    var c = shuffled(O.DAILY.filter(function (x) { return x.d === o.d && avail(x); }), G.util.hash('SH-obj|' + Dl().dayKey(ob.day) + '|' + o.d + '|re')).filter(function (x) { return cur.indexOf(x.id) < 0 && ob.yday.indexOf(x.id) < 0; });
    if (!c.length) c = O.DAILY.filter(function (x) { return x.d === o.d && avail(x) && cur.indexOf(x.id) < 0; });
    if (!c.length) return { ok: false };
    ob.list[i] = entry(c[0]); ob.rerollDay = Dl().today(); G.Save.save();
    return { ok: true, msg: t('rerolled') };
  };

  // ------------------------------------------------------------- Pago con tope semanal
  function say(text, inRun) { try { if (inRun && (G.state === 'play' || G.state === 'cards' || G.state === 'paused')) G.Hud.banner(text, 2200, '#ffd27a'); else O.notes.push(text); } catch (e) { /* hud */ } }
  O.notes = [];
  function payObj(e, weekly, day) {
    var o = O.def(e.id), r = O.reward(o, day), ob = DD().obj, W = ob.wpaid, C = O.WEEK_CAP, S = SV(), k;
    var br = Math.max(0, Math.min(r.brasas, C.brasas - W.brasas)), pn = 0, ptot = 0; for (k in r.parts) ptot += r.parts[k];
    var room = Math.max(0, C.parts - W.parts), rare = Math.max(0, Math.min(r.rare, C.rare - W.rare)), trimmed = br < r.brasas || ptot > room || rare < r.rare;
    S.brasas += br; W.brasas += br;
    for (k in r.parts) { var n = Math.min(r.parts[k], room - pn); if (n > 0) { G.Save.add(k, n); pn += n; } }
    W.parts += pn; if (rare) { G.Save.add('rare', rare); W.rare += rare; }
    if (trimmed) { W.trim = (W.trim || 0) + 1; say(t('cap'), true); }
    e.paid = 1;
    try { G.Track('obj_done', { id: e.id, weekly: weekly ? 1 : 0 }); } catch (x) { /* analítica */ }
    say(weekly ? (rare ? t('objWeekRare', br) : t('objWeek', br)) : t('objDone', br), true);
    try { G.sfx('card_select', { vol: 0.8 }); } catch (x2) { /* audio */ }
  }
  function bump(e, v, kind, weekly, day) {
    if (!e || e.done) return;
    var nv = kind === 'max' ? Math.max(e.prog, v) : kind === 'set' ? v : e.prog + v;
    e.prog = Math.min(e.goal, nv);
    if (e.prog >= e.goal) { e.done = 1; if (!e.paid) payObj(e, weekly, day); }
  }
  // Aplica un informe { ev: n } a las listas (sum: suma; max: mejor de la salida). live: solo contadores que se suman en vivo (bajas, guardianes)
  function apply(rep) {
    var ob = DD().obj, day = ob.day;
    ob.list.forEach(function (e) { var o = O.def(e.id); if (o && rep[o.ev] != null && rep[o.ev] > 0) bump(e, rep[o.ev], o.kind, false, day); });
    ob.wlist.forEach(function (e) { var o = O.def(e.id); if (!o) return; if (o.kind === 'wfuse' || o.kind === 'days') return; if (rep[o.ev] != null && rep[o.ev] > 0) bump(e, rep[o.ev], o.kind, true, day); });
  }
  O.debugApply = apply;   // pruebas
  // ---- en partida
  var run = null;
  O.beginRun = function () { run = { day: Dl().today(), kills: 0, minis: 0 }; };
  O.onKill = function (e) {
    if (!run || G.mode === 'practice' || !O.isOpen() || !DD().obj.list.length) return;
    var d = G.B.enemy[e.type], mini = e.mini || (d && d.elite);
    run.kills++; if (mini) run.minis++;
    apply(mini ? { kills: 1, minis: 1 } : { kills: 1 });   // (d_mini2 es "max": recibe el total de la salida al terminar)
  };
  // Fin de cualquier salida (Loot.endRun / Daily.finish / Loot.endPractice). info: { daily, official, medal, won, bossWon, peligro, parts (de jefe), runSecs, total (partes), practice, firstP, hand }
  O.runEnd = function (info) {
    var day = info.day != null ? info.day : run ? run.day : Dl().today(), secs = info.runSecs || 0;
    if (info.daily || secs >= 60) O.played(day);
    if (info.practice || !O.isOpen()) { run = null; return null; }
    var ob = DD().obj; if (!ob.list.length) { run = null; return null; }
    var F = G.Fusion, fz = (F && F.stats && F.stats.fusions) || [], kinds = {}, uses = 0, k;
    if (!info.recovered) { fz.forEach(function (f) { kinds[f.id] = 1; }); if (F && F.stats) for (k in F.stats.uses) uses += F.stats.uses[k]; }
    var hand = info.hand || (G.finalHand ? G.finalHand.hand.filter(Boolean).map(function (h) { return h.id; }) : []), tn = {};
    hand.forEach(function (id) { var c = G.Cards.def(id); if (c && c.tag !== 'neutral') tn[c.tag] = (tn[c.tag] || 0) + 1; });
    var tag3 = Object.keys(tn).some(function (x) { return tn[x] >= 3; }), won = !!info.bossWon;
    var minis = run ? run.minis : (info.minis || 0);
    var rep = { runs: 1, level: G.player ? G.player.level : 0, fuses: fz.length, parts: info.total || 0, reto: info.daily && info.official ? 1 : 0, reach: info.reached ? 1 : 0, uses: uses,
      clean: Math.floor((G.Loot.run && G.Loot.run.clean ? G.Loot.run.clean : 0) / 1000), fuseKinds: Object.keys(kinds).length, bparts: info.parts || 0, wins: won ? 1 : 0, wintag: won && tag3 ? 1 : 0,
      winPel2: won && (info.peligro || 1) >= 2 ? 1 : 0, medal1: info.daily && info.official && info.medal >= 1 ? 1 : 0, oro: info.daily && info.official && info.medal >= 3 ? 1 : 0, pelup: info.firstP && won ? 1 : 0 };
    if (info.recovered) { rep.level = 0; rep.clean = 0; }
    // d_mini2 / d_clean / d_level / d_power / d_fuse2 / d_parts3: "max" de la salida; las bajas y los guardianes ya se sumaron en vivo (solo d_mini2 recibe el total de la salida)
    ob.list.forEach(function (e) { var o = O.def(e.id); if (o && o.id === 'd_mini2' && minis > 0) bump(e, minis, 'max', false, ob.day); });
    var r2 = {}; for (k in rep) if (k !== 'kills' && k !== 'minis') r2[k] = rep[k];
    apply(r2);
    fz.forEach(function (f) { ob.wfuse[f.id] = 1; });
    ob.wlist.forEach(function (e) { var o = O.def(e.id); if (o && o.kind === 'wfuse') bump(e, Object.keys(ob.wfuse).length, 'set', true, ob.day); });
    run = null;
    G.Save.save();
    return O.summary();
  };
  O.summary = function () { var ob = DD().obj; return { done: ob.list.filter(function (e) { return e.done; }).length, n: ob.list.length }; };

  // ------------------------------------------------------------- Racha amable (2.5)
  function daysProg() {
    var ob = DD().obj, n = Object.keys(ob.wdays || {}).length;
    ob.wlist.forEach(function (e) { var o = O.def(e.id); if (o && o.kind === 'days') bump(e, n, 'set', true, ob.day); });
  }
  O.played = function (day) {
    var s = DD().streak, msgs = [];
    if (s.last === day) return [];
    if (s.last && day < s.last) { s.last = day; return []; }   // reloj hacia atrás: ni sube ni baja
    var old = s.n;
    if (!s.last || !s.n) s.n = 1;
    else {
      var gap = day - s.last - 1;
      if (gap <= 0) s.n++;
      else if (gap >= 15) { s.n = Math.max(1, Math.floor(s.n / 2)); msgs.push(t('welcome', s.n)); }
      else if (gap - 1 <= s.wood) { s.wood -= gap - 1; s.n++; msgs.push(gap === 1 ? t('grace', s.n) : t('wood', s.wood)); }
      else { s.wood = 0; s.n = Math.max(1, Math.floor(s.n / 2)); msgs.push(t('half', old, s.n)); }
    }
    s.n = Math.min(99, s.n); s.last = day; s.best = Math.max(s.best || 0, s.n);
    s.woodAcc = (s.woodAcc || 0) + 1; if (s.woodAcc >= 5) { s.woodAcc = 0; s.wood = Math.min(2, (s.wood || 0) + 1); }
    if (s.n > old && !msgs.length) msgs.push(t('up', s.n));
    O.MILES.forEach(function (m) { if (s.n >= m && !s.miles[m]) { s.miles[m] = 1; msgs.push(t('mile')); } });
    var ob = DD().obj; if (ob.week === Dl().weekOf(day)) { ob.wdays[day] = 1; if (O.isOpen()) daysProg(); }
    try { G.Track('streak', { n: s.n, best: s.best, wood: s.wood }); } catch (e) { /* analítica */ }
    msgs.forEach(function (m) { O.notes.push(m); });
    G.Save.save();
    return msgs;
  };
  O.playedToday = function () { return DD().streak.last === Dl().today(); };
  O.nextMile = function () { var n = DD().streak.n; for (var i = 0; i < O.MILES.length; i++) if (n < O.MILES[i]) return O.MILES[i]; return 0; };
  O.unseen = function () { return O.isOpen() && (SV().flags.dseen || 0) !== DD().obj.day && DD().obj.list.length > 0; };
  O.markSeen = function () { SV().flags.dseen = DD().obj.day; G.Save.save(); };
  O.takeNotes = function () { var n = O.notes; O.notes = []; return n; };
})();
