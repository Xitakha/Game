/* daily.js - G.Daily: reto del día (T-F1-05, DESIGN-v10-retencion.md secciones 1 y 3.3). Una partida igual para todos cada día UTC, con el kit de la semana (kits.js).
   - Día = fecha UTC (como el Tablón). Semilla de reglas hash('SH-reto|AAAA-MM-DD|r1') y de la simulación hash('SH-reto|AAAA-MM-DD|s1'): flujos separados.
   - Se abre tras la 3.ª expedición (runs >= 3). 1 intento con premio al día (se gasta al pulsar EMPEZAR); reintentos ilimitados sin premio con la misma semilla.
   - Siempre mortal (decisión del dueño): G.god = false durante el reto, también con ?dev=1&god=1; al terminar se restaura.
   - Premio: solo Brasas, partes y (con Oro) 1 Esencia. Sin PF, trofeos ni insignias. No cambia runs, wins, bossKills, Peligro, encargos ni la tienda.
   - Punto de control cada 15 s (daily.reto.live): si el juego se cierra a mitad, en la siguiente visita a la aldea el intento se cierra con lo guardado y se paga su medalla una vez.
   - ?dev=1 con cualquier parámetro cerrado (src/dev.js) = intento PRUEBA: paga (para probar el flujo) pero no gasta el intento, ni guarda marca, historial o medallero.
     Las pruebas fuerzan el intento oficial con G.Daily.forceOfficial = true. Fecha simulada: ?dev=1&today=AAAA-MM-DD o G.Daily.setNow(ms). Apagado: ?dev=1&reto=0.
   - Textos en G.Daily.TXT (tabla única, preparada para la capa de traducción de T-F2). */
(function () {
  'use strict';
  var G = window.G, Dl = G.Daily = {}, DAY = 864e5;
  Dl.RV = 'r1';
  Dl.ON = !(Dev.on && /[?&]reto=0/.test(Dev.search));
  Dl.OPEN_RUNS = 3;
  Dl.forceOfficial = false;

  // ------------------------------------------------------------- Textos (español). t('clave', a, b...) sustituye {0}, {1}...
  Dl.TXT = {
    tab: 'RETO', title: 'RETO DEL DÍA', motto: 'Igual para todos hoy. Un intento con premio.', next: 'Nuevo reto en {0}', dest: 'DESTINO', soft: 'Reto suave: Peligro II hasta que venzas a este jefe.',
    muts: 'MUTADORES', deck: 'BARAJA: {0} cartas  ·  Ancla: {1}', kitHead: 'KIT DE LA SEMANA', kitChange: 'Cambia en {0}', lent: 'Equipo prestado: tu progreso no cuenta aquí.',
    seeKit: 'VER KIT', kitArmor: 'ARMADURA', kitForge: 'FORJA', kitHand: 'MANO', back: 'VOLVER', leveled: 'Nivelada a {0}: DEF {1}', activeNodes: 'Activos hoy ({0} PF)', harder: 'En biomas más duros:',
    sigFusion: 'Fusión firma: {0}', dishL: 'Plato: {0}', provT: 'Provisión de Tundra: Crampones y Caldo de brasa.', provP: 'Provisión de Panal: Ahumador y Tostada de miel.', provT2: 'Provisión de Tundra: Crampones.', provP2: 'Provisión de Panal: Ahumador.',
    lentTag: 'PRESTADO', manualLent: 'Lo viste prestado en el reto.', newKit: 'Kit de la semana: {0}',
    prizeHead: 'PREMIO (solo el intento con premio)', prize1: 'Participar 40  ·  Bronce 90', prize2: 'Plata 130  ·  Oro 180 Brasas', prize3: 'Oro: +1 Esencia. Bronce: llega al jefe.', prize4: 'Plata: rompe una parte o media vida.',
    best: 'Tu mejor marca: {0} ({1}, {2})', noBest: 'Aún no tienes marca. Hoy puede ser el día.', medalsLine: 'Oros {0}  ·  Platas {1}  ·  Bronces {2}',
    go: 'EMPEZAR RETO', goSub: 'intento con premio: 1 de 1', again: 'REINTENTAR (SIN PREMIO)', againSub: 'hoy: {0}, {1}', againSubTest: 'modo prueba: sin marca', closed: 'El reto del día se abre tras tu 3.ª expedición.', off: 'El reto diario está apagado.',
    confirm: '¿Empiezas tu intento con premio?', confirm2: 'Si sales o cierras el juego, cuenta lo que lleves.', yes: 'EMPEZAR', no: 'AÚN NO',
    mortal: 'Reto sin inmortalidad: aquí se juega de verdad.', test: 'Modo prueba: este reto no guarda marca.', chip: 'RETO  {0}', chipTest: 'RETO (PRUEBA)  {0}',
    bronzeOk: '¡BRONCE ASEGURADO!', silverOk: '¡PLATA ASEGURADA!', quit: 'TERMINAR INTENTO', quitSub: 'cuenta lo que llevas',
    won: 'RETO SUPERADO', ended: 'RETO TERMINADO', medal0: 'PARTICIPACIÓN', medal1: 'BRONCE', medal2: 'PLATA', medal3: 'ORO',
    rTime: 'Tiempo', rKills: 'Bajas', rGuard: 'Guardianes', rBoss: 'Jefe', rWin: 'Victoria', rMul: 'Peligro y mutadores  x{0}', rTotal: 'TOTAL  {0}', newRecord: '¡NUEVO RÉCORD!', yourBest: 'Tu mejor: {0}',
    pay: 'Premio: +{0} Brasas, +{1} partes', payRare: 'Premio: +{0} Brasas, +{1} partes, +1 Esencia', retryNo: 'Reintento: sin premio. Habrías sacado {0}.', testPay: 'Prueba: +{0} Brasas (sin marca)',
    objLine: 'Objetivos: {0}/{1} de hoy cumplidos', againBtn: 'REINTENTAR (SIN PREMIO)', againBtnSub: 'misma semilla', toVillage: 'IR A LA ALDEA', toVillageSub: 'objetivos y racha',
    share: 'COMPARTIR', copied: 'Resultado copiado.', noCopy: 'No se pudo copiar el resultado.', cut: 'Tu intento se cortó. Cuenta lo que llevabas: {0} ({1}).',
    firstOpen: 'Nuevo en el Portal: el reto del día.', lanudo: 'Dicen que el Portal guarda un reto distinto cada día. Igual para todos.', clockBack: 'La fecha del dispositivo ha ido hacia atrás. Lo de hoy ya está cobrado.',
    chipAldea: 'RETO DEL DÍA', chipReady: 'listo', chipDone: 'hoy: {0}', menuBtn: 'RETO Y OBJETIVOS', menuSub: 'reto del día, objetivos y racha', hand: 'TU MANO FINAL', powers: 'PODERES',
    sub: '{0}  ·  {1}  ·  Peligro {2}', kitLine: '{0}  ·  {1} y {2}  ·  Ancla: {3}', mut_sincambio_msg: 'Sin cambios: hoy no se puede cambiar la oferta.',
    hist: 'ÚLTIMOS RETOS', notReached: 'sin llegar al jefe', kitNew: 'NUEVO'
  };
  Dl.t = function (k) { var s = Dl.TXT[k] != null ? Dl.TXT[k] : k, a = arguments; return s.replace(/\{(\d)\}/g, function (m, i) { var v = a[+i + 1]; return v == null ? '' : String(v); }); };
  Dl.MEDAL_K = ['medal0', 'medal1', 'medal2', 'medal3'];
  Dl.medalName = function (m) { return Dl.t(Dl.MEDAL_K[m] || 'medal0'); };
  Dl.fmtN = function (n) { n = Math.round(n || 0); var s = String(Math.abs(n)), out = ''; while (s.length > 3) { out = '.' + s.slice(-3) + out; s = s.slice(0, -3); } return (n < 0 ? '-' : '') + s + out; };
  var MES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
  Dl.shortDate = function (day) { var d = new Date(day * DAY); return d.getUTCDate() + ' ' + MES[d.getUTCMonth()]; };
  Dl.hm = function (ms) { var m = Math.max(0, Math.ceil(ms / 60000)), h = Math.floor(m / 60); return h > 0 ? h + ' h ' + (m % 60) + ' min' : (m % 60) + ' min'; };
  Dl.dh = function (ms) { var h = Math.max(0, Math.floor(ms / 3600000)), d = Math.floor(h / 24); return d > 0 ? d + ' d ' + (h % 24) + ' h' : Dl.hm(ms); };

  // ------------------------------------------------------------- Reloj (UTC). Única fuente de fecha del reto, los objetivos y la racha
  var nowOv = null;
  Dl.setNow = function (ms) { nowOv = ms == null ? null : ms; };   // pruebas
  Dl.now = function () {
    if (nowOv != null) return nowOv;
    var m = /[?&]today=(\d{4})-(\d\d)-(\d\d)/.exec(Dev.search);
    return m ? Date.UTC(+m[1], +m[2] - 1, +m[3]) + (Date.now() % DAY) : Date.now();
  };
  Dl.dayIndex = function (t) { return Math.floor((t == null ? Dl.now() : t) / DAY); };
  Dl.dayKey = function (idx) { return new Date(idx * DAY).toISOString().slice(0, 10); };
  Dl.weekOf = function (idx) { return Math.floor((idx + 3) / 7); };   // la semana empieza el lunes 00:00 UTC (el día 0 fue jueves)
  Dl.msToNextDay = function () { var t = Dl.now(); return (Math.floor(t / DAY) + 1) * DAY - t; };
  Dl.msToNextWeek = function () { var d = Dl.dayIndex(), w = Dl.weekOf(d), first = w * 7 - 3 + 7; return first * DAY - Dl.now(); };
  function SV() { return G.Save.data; }
  function DD() { return SV().daily; }
  // Día efectivo (3.3): reloj atrás 1-2 días -> el mayor visto (nada se repite); más de 2 -> el reloj manda y maxDay se reajusta. Devuelve { day, back }
  Dl.eff = function () {
    var d = Dl.dayIndex(), D = DD(), mx = D.maxDay || 0;
    if (d >= mx) { D.maxDay = d; return { day: d, back: false }; }
    if (mx - d <= 2) return { day: mx, back: true };
    D.maxDay = d; return { day: d, back: false };
  };
  Dl.today = function () { return Dl.eff().day; };

  // ------------------------------------------------------------- Mutadores (1.2). fam: horda | jugador | mano | jefe; w: peso para el presupuesto. mvp: activos en el MVP
  Dl.MUT = [
    { id: 'veloz', name: 'Enjambre veloz', eff: 'enemigos +15 % de velocidad.', fam: 'horda', w: 1, mvp: true },
    { id: 'marea', name: 'Marea', eff: '+15 % de enemigos.', fam: 'horda', w: 1, mvp: true },
    { id: 'duros', name: 'Pellejo duro', eff: 'enemigos +20 % de vida.', fam: 'horda', w: 1, mvp: true },
    { id: 'sincor', name: 'Sin corazones', eff: 'los enemigos no sueltan corazones.', fam: 'jugador', w: 1, mvp: true },
    { id: 'bolsillo', name: 'Bolsillos cortos', eff: 'radio de recogida -40 %.', fam: 'jugador', w: 0.5, mvp: true },
    { id: 'cristal', name: 'Piel de cristal', eff: 'recibes +20 % de daño.', fam: 'jugador', w: 1, mvp: true },
    { id: 'dos', name: 'Dos etiquetas', eff: 'la baraja solo trae las 2 etiquetas del kit.', fam: 'mano', w: 1, mvp: true },
    { id: 'sincambio', name: 'Sin cambios', eff: 'no se puede pagar para cambiar la oferta.', fam: 'mano', w: 0.5, mvp: true },
    { id: 'curtidos', name: 'Guardianes curtidos', eff: 'guardianes +35 % de vida.', fam: 'jefe', w: 1, mvp: true },
    { id: 'furia', name: 'Furia temprana', eff: 'el jefe entra en furia 30 s antes.', fam: 'jefe', w: 1, mvp: false },
    { id: 'pesados', name: 'Poderes pesados', eff: 'enfriamiento de poderes +20 %.', fam: 'mano', w: 1, mvp: false },
    { id: 'cortamano', name: 'Mano corta', eff: '4 huecos de mano en vez de 5.', fam: 'mano', w: 1.5, mvp: false }
  ];
  var MBY = {}; Dl.MUT.forEach(function (m) { MBY[m.id] = m; });
  Dl.mut = function (id) { return MBY[id]; };
  var INCOMPAT = { dos: ['cortamano'], cortamano: ['dos'], marea: ['veloz'], veloz: ['marea'] };
  Dl.BIOMES = ['bosque', 'cripta', 'asfodelo', 'tundra', 'panal'];   // el Cráter no entra (es un Asalto, sin horda)
  var BUDGET = { 2: 2, 3: 1.5, 4: 1 };
  function weakTags(boss) { var d = G.Boss.DEFS[boss], out = []; ((d && d.weak) || []).forEach(function (w) { if (out.indexOf(w.tag) < 0) out.push(w.tag); }); return out; }

  // ------------------------------------------------------------- Reglas del día (1.1): puras y deterministas. acct = { unlocked: [biomas], kills: { jefe: n } }
  // Todas las tiradas se hacen siempre, en el mismo orden y número (4 + 1 + 11 + 3 + 2), sea cual sea la cuenta; los filtros se aplican después.
  Dl.rules = function (day, acct, kitId) {
    var H = G.util.hash, key = Dl.dayKey(day), r = G.util.rng(H('SH-reto|' + key + '|' + Dl.RV)), i, j, t;
    acct = acct || { unlocked: G.Quests.unlockedBiomes(), kills: SV().bossKills || {} };
    var perm = Dl.BIOMES.slice(); for (i = perm.length - 1; i > 0; i--) { j = Math.floor(r() * (i + 1)); t = perm[i]; perm[i] = perm[j]; perm[j] = t; }   // 1. bioma (4 tiradas)
    var u = r(), pel0 = u < 0.35 ? 2 : u < 0.80 ? 3 : 4;                                                                                                // 2. Peligro (1)
    var mt = Dl.MUT.map(function (m) { return m.id; }); for (i = mt.length - 1; i > 0; i--) { j = Math.floor(r() * (i + 1)); t = mt[i]; mt[i] = mt[j]; mt[j] = t; }   // 3. mutadores (11)
    var week = Dl.weekOf(day), kid = kitId || K().forced() || K().ofWeek(week), kit = K().get(kid);
    var other = K().TAGS.filter(function (tg) { return kit.tags.indexOf(tg) < 0; }); for (i = other.length - 1; i > 0; i--) { j = Math.floor(r() * (i + 1)); t = other[i]; other[i] = other[j]; other[j] = t; }   // 4. acompañamiento (3)
    var neu = K().NEUTRALS.slice(); neu.splice(Math.floor(r() * neu.length), 1); neu.splice(Math.floor(r() * neu.length), 1);                         // 5. 3 de 5 neutrales (2)
    // ---- filtros de la cuenta: primer bioma abierto de la permutación y excepción de novato
    var un = acct.unlocked || ['bosque'], biome = perm.filter(function (b) { return un.indexOf(b) >= 0; })[0] || 'bosque';
    var boss = G.Boss.bossFor(biome), novato = !((acct.kills || {})[boss] > 0), peligro = novato ? Math.min(2, pel0) : pel0;
    var needFire = (biome === 'tundra' || biome === 'panal') && !K().hasFire(kit);
    // ---- mutadores: hasta 2, familias distintas, compatibles y dentro del presupuesto (R5: 'dos' fuera si el bioma pide Fuego y el kit no lo trae)
    var mut = [], fams = {}, wsum = 0, bud = BUDGET[peligro] || 1;
    for (i = 0; i < mt.length && mut.length < 2; i++) {
      var m = MBY[mt[i]]; if (!m.mvp || fams[m.fam] || wsum + m.w > bud + 1e-9) continue;
      if (m.id === 'dos' && needFire) continue;
      if (mut.some(function (x) { return (INCOMPAT[x] || []).indexOf(m.id) >= 0; })) continue;
      mut.push(m.id); fams[m.fam] = 1; wsum += m.w;
    }
    var dos = mut.indexOf('dos') >= 0, comp = dos ? [] : other.slice(0, 2);
    if (!dos && needFire && comp.indexOf('fire') < 0) comp[1] = 'fire';                                                   // R4
    var wk = weakTags(boss);
    if (!dos && wk.length && !comp.some(function (tg) { return wk.indexOf(tg) >= 0; })) {                                // R6
      var rep = other.filter(function (tg) { return wk.indexOf(tg) >= 0 && comp.indexOf(tg) < 0; })[0];
      if (rep) { var ri = comp[0] === 'fire' && needFire ? 1 : 0; comp[ri] = rep; }
    }
    var tags = kit.tags.concat(comp), deck = [];
    tags.forEach(function (tg) { K().TAG_CARDS[tg].forEach(function (id) { deck.push(id); }); if (K().TAG_PASSIVE[tg]) deck.push(K().TAG_PASSIVE[tg]); });
    neu.forEach(function (id) { if (deck.indexOf(id) < 0) deck.push(id); });
    var mul = Math.round((1 + 0.2 * (peligro - 1) + 0.1 * wsum) * 100) / 100;
    return { rv: Dl.RV, day: day, key: key, simSeed: H('SH-reto|' + key + '|s1'), perm: perm, biome: biome, boss: boss, pelRoll: pel0, peligro: peligro, novato: novato && pel0 > 2,
      mut: mut, mutW: wsum, kit: kit.id, kv: K().KV, week: week, comp: comp, tags: tags, deck: deck, anchor: kit.anchor, mul: mul };
  };
  function K() { return G.Kit; }

  // ------------------------------------------------------------- Estado
  Dl.isOpen = function () { return Dl.ON && (SV().runs || 0) >= Dl.OPEN_RUNS; };
  var TESTRE = null;
  Dl.isTest = function () {   // ?dev=1 con cualquier parámetro cerrado (o today / kit): intento PRUEBA
    if (Dl.forceOfficial || !Dev.on) return false;
    if (!TESTRE) TESTRE = new RegExp('[?&](' + Dev.closed.concat(['today', 'kit', 'god', 'reto']).join('|') + ')=');
    return TESTRE.test(location.search);
  };
  Dl.claimed = function (day) { return !!(DD().claims || {})[day == null ? Dl.today() : day]; };
  Dl.canOfficial = function () { return Dl.isOpen() && !Dl.claimed() && !Dl.isTest(); };
  Dl.todayRules = function () { return Dl.rules(Dl.today()); };
  Dl.officialToday = function () { var o = DD().reto.official; return o && o.dayN === Dl.today() ? o : null; };

  // ------------------------------------------------------------- Lanzar (desde la pestaña RETO)
  Dl.start = function (official) {
    if (!Dl.isOpen()) return false;
    var R = Dl.todayRules();
    G.launchReq = { daily: true, official: !!official && Dl.canOfficial(), rules: R };
    G.Base.launch();
    return true;
  };
  Dl.retry = function () { Dl.start(false); };
  var st = null;   // estado de la partida en curso (memoria)
  Dl.endRes = null;
  Dl.prepare = function (rq) {
    Dl.endRes = null;
    if (!rq) { if (st) restore(); G.daily = null; return; }
    if (st) restore();
    var R = rq.rules, test = Dl.isTest(), D = DD();
    st = { prevGod: G.god, prevSeed: G.seed, prevT0: G.t0, official: !!rq.official && !test, test: test, R: R, cpT: 0, reached: false, silver: false, bossFrac: 0, dRew: 0, minis: 0, medal: 0 };
    G.god = false;   // decisión del dueño: el reto se juega SIEMPRE sin inmortalidad
    G.t0 = 0;
    G.rngSeed(R.simSeed);   // semilla del día (después se restaura la anterior)
    var b = G.Kit.build(R.kit, R.biome); G.Kit.begin(b, R.deck);
    var has = function (id) { return R.mut.indexOf(id) >= 0; };
    G.daily = { rules: R, official: st.official, test: test, biome: R.biome, boss: R.boss, peligro: R.peligro, heartMul: has('sincor') ? 0 : 1, pickMul: has('bolsillo') ? 0.6 : 1,
      dmgTaken: has('cristal') ? 1.2 : 1, noReroll: has('sincambio'), guardMul: has('curtidos') ? 1.35 : 1 };
    D.reto.seenDay = R.day;
    SV().stats.dailyRuns = (SV().stats.dailyRuns || 0) + 1;
    if (st.official) {
      D.claims[R.day] = 1; pruneClaims(D);
      D.reto.live = { day: R.day, rv: R.rv, score: 0, medal: 0, t: 0, kit: R.kit };
    }
    G.Save.save();
    try { G.Track('daily_start', { official: st.official ? 1 : 0, test: test ? 1 : 0, kit: R.kit, biome: R.biome, peligro: R.peligro, mut: R.mut.join(',') }); } catch (e) { /* analítica */ }
    try { G.Hud.banner(test ? Dl.t('test') : Dl.t('mortal'), 2600, test ? '#c8b8e8' : '#ffb08a'); } catch (e2) { /* hud */ }
  };
  function restore() {
    if (!st) return;
    G.Kit.end();
    G.god = st.prevGod; G.t0 = st.prevT0; G.rngSeed(st.prevSeed);
    st = null;
  }
  function pruneClaims(D) { var ks = Object.keys(D.claims).map(Number).sort(function (a, b) { return a - b; }); while (ks.length > 60) delete D.claims[ks.shift()]; }
  Dl.applyD = function (D) {
    var R = G.daily && G.daily.rules; if (!R) return;
    if (R.mut.indexOf('veloz') >= 0) D.s *= 1.15;
    if (R.mut.indexOf('marea') >= 0) D.n *= 1.15;
    if (R.mut.indexOf('duros') >= 0) D.h *= 1.2;
  };

  // ------------------------------------------------------------- Puntuación (1.4): todo sale del estado de la simulación
  Dl.onKill = function (e) {
    if (!st) return;
    st.dRew += e.dRew || 1;
    var d = G.B.enemy[e.type]; if (e.mini || (d && d.elite)) st.minis++;
  };
  function bossInfo() {
    var R = G.Loot.run, bs = R && R.boss, e = G.Boss.e;
    var won = !!(bs && bs.won), frac = won ? 1 : e && e.maxHp ? G.clamp(1 - e.hp / e.maxHp, 0, 1) : 0;
    if (st) { st.bossFrac = Math.max(st.bossFrac, frac); frac = st.bossFrac; }
    return { won: won, frac: frac, parts: bs && bs.parts ? bs.parts.length : 0 };
  }
  Dl.score = function (won) {
    var b = bossInfo(), R = G.Loot.run || {}, p = G.player;
    var tm = Math.min(1080, Math.floor(2 * Math.max(0, G.runT - G.t0) / 1000)), kills = Math.floor((st ? st.dRew : G.kills) + 1e-9);
    var guard = 200 * (st ? st.minis : 0) + 50 * (R.miniParts || 0), boss = Math.min(1000, Math.floor(b.frac * 100) * 10) + 150 * b.parts;
    var win = won ? 1000 + 5 * Math.max(0, Math.ceil(p.hp)) : 0, base = tm + kills + guard + boss + win, mul = G.daily ? G.daily.rules.mul : 1;
    var medal = won ? 3 : (b.parts >= 1 || b.frac >= 0.5) ? 2 : (st && st.reached) ? 1 : 0;
    var bs = R.boss; return { time: tm, kills: kills, guard: guard, boss: boss, win: win, base: base, mul: mul, total: Math.round(base * mul), medal: medal, bossFrac: b.frac, parts: b.parts, bt: won ? ((bs && bs.time) || G.Boss.combatT || 0) : 0 };
  };
  Dl.live = function () { return G.daily ? Dl.score(false) : null; };
  Dl.tick = function () {
    if (!st || !G.player) return;
    var p = G.player;
    if (!st.reached && (G.Waves.bossSpawned || G.Boss.active) && !p.dead) { st.reached = true; st.medal = Math.max(st.medal, 1); try { G.Hud.banner(Dl.t('bronzeOk'), 2000, '#e8a860'); } catch (e) { /* hud */ } }
    var b = bossInfo();
    if (!st.silver && (b.parts >= 1 || b.frac >= 0.5)) { st.silver = true; st.medal = Math.max(st.medal, 2); try { G.Hud.banner(Dl.t('silverOk'), 2000, '#d8e0ec'); } catch (e2) { /* hud */ } }
    if (st.official && G.time - st.cpT >= 15000) {   // punto de control
      st.cpT = G.time; var sc = Dl.score(false), D = DD();
      D.reto.live = { day: st.R.day, rv: st.R.rv, score: sc.total, base: sc.base, medal: sc.medal, t: Math.round(G.runT), kills: G.kills, kit: st.R.kit, bossFrac: Math.round(sc.bossFrac * 100) / 100, parts: sc.parts };
      G.Save.save();
    }
  };

  // ------------------------------------------------------------- Premio por medalla (1.6): reparto de partes con la mezcla de L.EXPECT (mayor resto)
  Dl.PRIZE = [{ brasas: 40, parts: 10, rare: 0 }, { brasas: 90, parts: 25, rare: 0 }, { brasas: 130, parts: 35, rare: 0 }, { brasas: 180, parts: 45, rare: 1 }];
  Dl.split = function (n) {
    var E = G.Loot.EXPECT, ks = ['thread', 'feather', 'spine', 'fang', 'plate', 'wick', 'frost', 'static'], tot = 0, out = {}, rest = [], used = 0;
    ks.forEach(function (k) { tot += E[k]; });
    ks.forEach(function (k) { var v = n * E[k] / tot, f = Math.floor(v); out[k] = f; used += f; rest.push([k, v - f]); });
    rest.sort(function (a, b) { return b[1] - a[1] || ks.indexOf(a[0]) - ks.indexOf(b[0]); });
    for (var i = 0; used < n; i++, used++) out[rest[i % rest.length][0]]++;
    return out;
  };
  function pay(medal) {
    var P = Dl.PRIZE[medal] || Dl.PRIZE[0], S = SV(), sp = Dl.split(P.parts);
    S.brasas += P.brasas; for (var k in sp) if (sp[k]) G.Save.add(k, sp[k]); if (P.rare) G.Save.add('rare', P.rare);
    return { brasas: P.brasas, parts: P.parts, rare: P.rare, split: sp };
  }
  Dl.pay = pay;
  function entryOf(R, sc, won, t, kills, dev) {
    var key = R.key || Dl.dayKey(R.day);
    return { rv: R.rv, day: key, dayN: R.day, biome: R.biome, boss: R.boss, peligro: R.peligro, mut: (R.mut || []).slice(), deckId: G.util.hash((R.deck || []).join(',')) % 1e6, kit: R.kit, kv: R.kv || G.Kit.KV,
      score: sc.total, base: sc.base, mul: sc.mul, medal: sc.medal, won: !!won, t: t, kills: kills, bt: Math.round(sc.bt || 0), bossFrac: Math.round((sc.bossFrac || 0) * 100) / 100, parts: sc.parts || 0, dq: (G.D && G.D.id) || 'alta', build: (G.PWA && G.PWA.build) || '', dev: dev ? 1 : 0 };
  }
  // Registra un intento oficial: historial (30), récord, medallero. Devuelve { isNew }
  function record(e) {
    var D = DD().reto, isNew = !D.best || e.score > D.best.score;
    D.official = e; D.hist.push(e); while (D.hist.length > 30) D.hist.shift();
    if (isNew) D.best = { score: e.score, day: e.dayN, medal: e.medal };
    var mk = ['part', 'bronce', 'plata', 'oro'][e.medal]; D.medals[mk] = (D.medals[mk] || 0) + 1;
    D.live = null;
    return { isNew: isNew };
  }
  // Fin del reto (G.finish). Sustituye a L.endRun: no toca la campaña
  Dl.finish = function (won) {
    var S = SV(), D = DD(), R = st ? st.R : G.daily.rules;
    for (var i = G.gems.length - 1; i >= 0; i--) if (G.gems[i].kind === 'part' || G.gems[i].kind === 'insignia') G.gems.splice(i, 1);   // nada del botín del suelo
    var sc = Dl.score(won), e = entryOf(R, sc, won, Math.round(G.runT), G.kills, st && st.test), res = { entry: e, sc: sc, official: !!(st && st.official), test: !!(st && st.test), pay: null, isNew: false, rules: R };
    if (res.official) { res.pay = pay(sc.medal); res.isNew = record(e).isNew; }
    else if (res.test) res.pay = pay(sc.medal);
    else { var rt = D.reto.retry; if (rt.day !== R.day) { rt.day = R.day; rt.best = 0; rt.medal = 0; } if (sc.total > rt.best) { rt.best = sc.total; rt.medal = sc.medal; } }
    var R0 = G.Loot.run || {};
    if (G.Obj) res.obj = G.Obj.runEnd({ daily: true, official: res.official, medal: sc.medal, won: !!won, reached: !!(st && st.reached), runSecs: Math.max(0, G.runT / 1000), bossWon: !!won, peligro: R.peligro, parts: sc.parts, minis: st ? st.minis : 0, total: 0 });
    var hand = G.finalHand ? G.finalHand.hand.filter(Boolean).map(function (h) { return h.id; }) : [];
    G.Loot.summary = { daily: true, practice: false, parts: {}, total: 0, brasas: res.pay ? res.pay.brasas : 0, rare: res.pay ? res.pay.rare : 0, newCards: [], won: won, kills: G.kills, quest: null, pfGained: 0,
      boss: R0.boss ? { id: R.boss, name: (G.Boss.DEFS[R.boss] || {}).name || R.boss, won: !!won, parts: (R0.boss.parts || []).slice(), brasas: 0, pf: 0, trophies: [], time: G.Boss.combatT || 0, hpFrac: 1 - sc.bossFrac, peligro: R.peligro, mode: 'run' } : null, hand: hand };
    try { G.Track('daily_end', { official: res.official ? 1 : 0, test: res.test ? 1 : 0, medal: sc.medal, score: sc.total, dq: e.dq, god: 0, kit: R.kit }); } catch (x) { /* analítica */ }
    restore();
    Dl.endRes = res;
    G.Save.save();
    return res;
  };
  // Al volver a la aldea (o al cargar): cierra un intento cortado y avisa de lo que toque. Devuelve los avisos (textos) para la aldea
  Dl.onAldea = function () {
    var out = [], D = DD();
    if (st) restore();
    G.daily = null; Dl.endRes = null;
    var ef = Dl.eff();
    if (ef.back && Dl.claimed(ef.day) && !Dl._backWarned) { Dl._backWarned = true; out.push(Dl.t('clockBack')); }
    var lv = D.reto.live;
    if (lv && typeof lv.day === 'number') {
      var R = { rv: lv.rv || Dl.RV, day: lv.day, key: Dl.dayKey(lv.day), biome: '', boss: '', peligro: 2, mut: [], deck: [], kit: lv.kit || '' };
      try { var rr = Dl.rules(lv.day); R.biome = rr.biome; R.boss = rr.boss; R.peligro = rr.peligro; R.mut = rr.mut; R.deck = rr.deck; R.kit = lv.kit || rr.kit; } catch (e0) { /* reglas */ }
      var sc = { total: lv.score || 0, base: lv.base || 0, mul: 1, medal: G.clamp(lv.medal || 0, 0, 2), bossFrac: lv.bossFrac || 0, parts: lv.parts || 0 };
      var e = entryOf(R, sc, false, lv.t || 0, lv.kills || 0, false);
      pay(sc.medal); record(e); D.live = null;
      if (G.Obj) G.Obj.runEnd({ daily: true, official: true, medal: sc.medal, won: false, reached: sc.medal >= 1, runSecs: (lv.t || 0) / 1000, bossWon: false, peligro: R.peligro, parts: sc.parts, minis: 0, total: 0, day: lv.day });
      out.push(Dl.t('cut', Dl.fmtN(sc.total), Dl.medalName(sc.medal).toLowerCase().replace(/^./, function (x) { return x.toUpperCase(); })));
      G.Save.save();
    }
    if (Dl.isOpen() && !D.reto.firstSeen) { D.reto.firstSeen = 1; out.push(Dl.t('firstOpen')); G.Save.save(); }
    return out;
  };
  // Texto para compartir (4.C, 5 líneas exactas)
  Dl.shareText = function (e) {
    var BN = (G.EndInfo && G.EndInfo.BIOME) || {}, rom = G.Boss.ROMAN;
    var l3 = e.mut.map(function (id) { return MBY[id] ? MBY[id].name : id; }).join(' + ');
    var l5 = e.won ? 'Jefe vencido en ' + G.fmtTime(e.bt || 0).replace(/^0(\d)/, '$1') + ' - ' + Dl.fmtN(e.kills) + ' bajas' : 'Jefe al ' + Math.round((1 - (e.bossFrac || 0)) * 100) + ' % - ' + Dl.fmtN(e.kills) + ' bajas';
    return ['Swarm Hand - Reto ' + e.day, (BN[e.biome] || e.biome) + ', Peligro ' + rom[e.peligro], l3, Dl.medalName(e.medal) + ' - ' + Dl.fmtN(e.score) + ' puntos', l5].join('\n');
  };
  Dl.share = function (cb) {
    var r = Dl.endRes; if (!r) return;
    var txt = Dl.shareText(r.entry), done = function (ok) { if (cb) cb(ok ? Dl.t('copied') : Dl.t('noCopy')); };
    try {
      if (navigator.share) { navigator.share({ text: txt }).then(function () { done(true); }, function () { done(false); }); return; }
      if (navigator.clipboard && navigator.clipboard.writeText) { navigator.clipboard.writeText(txt).then(function () { done(true); }, function () { done(false); }); return; }
    } catch (e) { /* sin API */ }
    done(false);
  };
})();
