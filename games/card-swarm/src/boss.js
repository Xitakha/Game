/* boss.js - Jefes v4 (fase J1): infraestructura de jefes + El Pastor Corrupto rediseñado (DESIGN-v4-jefes.md 3.2 y 5).
   Qué hay aquí: datos del jefe (fases, ataques, partes, debilidades, Peligro), máquina de fases con puerta inmune de 3 s, máquina de ataques
   (telegrafía -> acción -> recuperación) con hitboxes por parte (Assets.bossAnchors), partes rompibles con trofeo, ventanas de daño, Furia,
   ataque desesperado, tope de adds y proyectiles, arena con troncos, zarzal (F2) y perímetro ardiente (F3), intro de 3,5 s, barra de vida grande,
   cámara/zoom y gancho para el bot (G.Boss.hazards()). El arte viene de Assets.drawBoss / bossAnchors / drawBossTele / drawBossWave (assets_boss.js).
   El jefe vive en G.enemies (type 'boss') y sus partes son entidades hijas (type 'bosspart', e.partOf): así Combat.nearest/inRange/chain funcionan sin cambios.
   Reloj: G.time sigue corriendo (temporizadores); G.runT es el reloj de la RUN y se congela mientras el jefe vive. */
(function () {
  'use strict';
  var G = window.G, B = G.B, fx = G.fx, E = G.Enemies, S = G.Boss = {};
  var DEG = Math.PI / 180, TAU = Math.PI * 2;

  function PL() { return G.player; }
  function ease(u) { u = G.clamp(u, 0, 1); return u * u * (3 - 2 * u); }
  function angTo(e, p) { return Math.atan2(p.y - e.y, p.x - e.x); }
  function shuffle(a) { for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)), t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
  function sfx(n, o) { G.sfx(n, o); }

  // ================================================================= TABLAS
  var ATKS = {     // tele = telegrafía (ms) antes del Peligro; dmg = daño base; sig = ataque firma (>= 25 de daño: doble contorno + viñeta)
    barrido:   { name: 'Barrido de cayado',  tele: 800,  cd: 5000,  dmg: 24, phases: [1, 2, 3] },
    embestida: { name: 'Embestida del carnero', tele: 900, cd: 9000, dmg: 30, phases: [1, 2, 3], sig: true },
    pisoton:   { name: 'Pisotón sísmico',    tele: 700,  cd: 8000,  dmg: 20, phases: [1, 2, 3] },
    salto:     { name: 'Salto aplastante',   tele: 1000, cd: 10000, dmg: 30, phases: [1, 2, 3], sig: true },
    abanico:   { name: 'Abanico de espinas', tele: 600,  cd: 6000,  dmg: 10, phases: [1, 2, 3] },
    llamada:   { name: 'Llamada del rebaño', tele: 800,  cd: 22000, dmg: 0,  phases: [1, 2, 3] },
    esporas:   { name: 'Esporas del Rebaño', tele: 1000, cd: 12000, dmg: 8,  phases: [2, 3] },
    estampida: { name: 'Estampida',          tele: 700,  cd: 14000, dmg: 24, phases: [3], sig: true }
  };
  var DEFS = S.DEFS = {
    pastor: {
      id: 'pastor', name: 'El Pastor Corrupto', title: 'Bestia del Rebaño', hp: 6000, r: 74,
      phases: [   // thr = umbral de HP (fracción) para pasar a la siguiente; cad = pausa entre ataques; spd = velocidad de paso
        { n: 'El Rebaño',      thr: 0.65, cad: 2800, spd: 65, music: 0.55, spawn: { mul: 0.25, allow: { worm: 1, archer: 1, bomb: 1 }, cap: 15 } },
        { n: 'La Corrupción',  thr: 0.30, cad: 2300, spd: 80, music: 0.78, spawn: { mul: 0.25, allow: { worm: 1, archer: 1, fanner: 1 }, cap: 15 } },
        { n: 'Cenizas',        thr: 0,    cad: 1900, spd: 95, music: 1.0,  spawn: { mul: 0, allow: {}, cap: 0 } }
      ],
      despairAt: 0.08, despair: 'Éxtasis del Rebaño',
      parts: {   // pct = medidor de rotura como fracción del HP del jefe; hz = multiplicador de daño a la parte
        cuernos: { name: 'Cuernos', pct: 0.09, hz: 1.15, trophy: 'horn',   r: 30 },
        cayado:  { name: 'Cayado',  pct: 0.08, hz: 1.15, trophy: 'staff',  r: 26 },
        vellon:  { name: 'Vellón',  pct: 0.11, hz: 1.15, trophy: 'fleece', r: 34 }
      },
      weak: [{ tag: 'fire', mul: 1.25, phases: [1, 2] }, { tag: 'steel', mul: 1.25, phases: [3] }],
      resist: [{ tag: 'poison', mul: 0.8 }],
      hpCal: 1,   // calibración con el bot: la fórmula del doc (6000) supone DPS_ref 80; el DPS real medido es mayor (ver README, sección Jefes)
      brasas: 150, brasasPart: 40, pf: 2, pfFirst: 3
    }
  };
  var TROPHY = S.TROPHY = {   // trofeo -> sprite (Assets) y nombre; cada trofeo cuenta como 1 Esencia (parts.rare)
    horn:   { spr: 'trophy_pastor_horn',   name: 'Cuerno del Pastor' },
    staff:  { spr: 'trophy_pastor_staff',  name: 'Cayado Astillado' },
    fleece: { spr: 'trophy_pastor_fleece', name: 'Vellón Calcinado' }
  };
  // Peligro I-V (tabla preparada; en J1 solo Peligro I está activo en la UI, ?peligro=n la fuerza para pruebas). Ver DESIGN 4.3.
  var PEL = S.PELIGRO = [null,
    { hp: 1.00, dmg: 1.00, tele: 1.00, adds: 0, cap: 4, fury: 150000, part: 1.0, brasas: 1.00 },
    { hp: 1.15, dmg: 1.10, tele: 0.90, adds: 1, cap: 4, fury: 150000, part: 1.0, brasas: 1.25 },
    { hp: 1.30, dmg: 1.20, tele: 0.90, adds: 1, cap: 4, fury: 150000, part: 1.0, brasas: 1.50 },
    { hp: 1.50, dmg: 1.30, tele: 0.90, adds: 1, cap: 4, fury: 120000, part: 1.3, brasas: 1.75 },
    { hp: 1.75, dmg: 1.40, tele: 0.90, adds: 1, cap: 6, fury: 120000, part: 1.3, brasas: 2.00 }];
  function pel() { return PEL[G.clamp(Math.round(G.peligro || 1), 1, 5)]; }
  S.durMul = function () {
    var m = G.RUN_LEN / 60000;
    if (m <= 7) return 0.75; if (m >= 10) return 1.1;
    return m <= 9 ? 0.75 + 0.25 * (m - 7) / 2 : 1 + 0.1 * (m - 9);
  };
  S.bossHp = function (id) { return Math.round(DEFS[id].hp * (G.dbgHpCal || DEFS[id].hpCal || 1) * S.durMul() * pel().hp); };
  S.bossFor = function (biome) { return 'pastor'; };   // J1: todos los biomas usan al Pastor (Karceron y Letea llegan en J2)
  function teleMs(name) {
    var d = ATKS[name], big = d.dmg >= 25;
    return Math.round(Math.max(d.tele * pel().tele, Math.min(d.tele, big ? 600 : 400)));
  }

  var LOGS = [[520, 260], [920, 260], [360, 450], [1080, 450], [560, 620], [880, 620]];
  var BRIERS = [[110, 100], [1330, 100], [110, 710], [1330, 710], [720, 74], [720, 736], [74, 405], [1366, 405]];

  // ================================================================= ESTADO
  S.reset = function () {
    S.e = null; S.active = false; S.dying = null; S.intro = null; S.defeated = false;
    S.obs = []; S.rubble = []; S.waves = []; S.briers = []; S.spikes = []; S.cracks = [];
    S.inset = 0; S.insetOn = false; S.insetT = 0; S.burnTk = 0; S.brierTk = 0;
    S.cds = {}; S.combatT = 0; S.fury = 1; S.furyStep = 0;
    S.flash = 0; S.tint = 0; S.ghost = 1; S.ghostT = 0; S.barFill = 1; S.noHurt = 0; S.sigP = 0; S.lastFull = 0; S.title = 0;
    G.frozen = false; G.cam.zoom = 1;
  };
  S.reset();

  // ================================================================= SPAWN
  S.spawn = function (id) {
    var D = DEFS[id] || DEFS.pastor, p = PL(), P = pel();
    S.reset();
    var hp = S.bossHp(D.id), x = G.AW / 2, y = G.AH / 2 - 40;
    if (G.dist(x, y, p.x, p.y) < 260) x = G.AW / 2 + (p.x < G.AW / 2 ? 260 : -260);
    var e = E.spawn('boss', x, y, { hp: hp });
    e.x = x; e.y = y; e.r = D.r; e.hp = e.maxHp = hp; e.spawnT = 0; e.spawnMax = 1;
    e.def = D; e.id = D.id; e.immune = true; e.phase = 1; e.mode = 'intro'; e.bst = 'idle'; e.face = p.x >= x ? 1 : -1;
    e.broken = { cuernos: false, cayado: false, vellon: false }; e.parts = {}; e.exps = []; e.lift = 700; e.alpha = 0; e.roar = 0;
    e.cadT = 1500; e.atk = null; e.bag = []; e.last = null; e.lastHit = {}; e.moveAmt = 0; e.curSpd = 0; e.stagT = 0; e.gateT = 0; e.despDone = false;
    e.sortY = y + 88; e.partsBroken = []; e.despT = 0; e.enrageSaid = false;
    Object.keys(D.parts).forEach(function (k) {
      var pd = D.parts[k], m = pd.pct * hp * P.part;
      var pe = { type: 'bosspart', partOf: e, key: k, x: x, y: y, r: pd.r, hp: 1e9, maxHp: 1e9, dead: false, spawnT: 0, flash: 0, meter: m, meterMax: m, hz: pd.hz,
        kx: 0, ky: 0, face: 1, anim: 0, numAcc: 0, numT: 0, dotAcc: 0, dotT: 0, burnT: 0, poisonT: 0, poisonN: 0, bleedT: 0, slowT: 0, stunT: 0, vaporCd: 0, acc: { fire: 0, poison: 0, blood: 0 }, boomDepth: 0, lastTag: 'neutral' };
      e.parts[k] = pe; G.enemies.push(pe);
    });
    LOGS.forEach(function (l) { S.obs.push({ x: l[0], y: l[1], r: 28, dead: false, shake: 0, sortY: l[1] + 6 }); });
    S.obs.forEach(function (o) { S.pushOutOne(o, p, p.r); });
    S.e = e; S.active = true; G.frozen = true;
    if (G.Loot.run) G.Loot.run.boss = { id: D.id, won: false, parts: [] };
    S.intro = { t: 0, landed: false, roared: false, music: false, seen: !!(G.Save.data.bossSeen && G.Save.data.bossSeen[D.id]) && !G.noSeen, skipped: false };
    if (G.nointro) { S.intro.t = 3490; S.intro.seen = true; S.intro.landed = S.intro.roared = S.intro.music = true; e.lift = 0; e.alpha = 1; }
    try { Assets.music.setIntensity(0.3); } catch (x1) { /* audio */ }
    return e;
  };

  // ================================================================= OBSTÁCULOS
  S.pushOutOne = function (o, who, r) {   // saca a `who` (x,y) del círculo o
    if (o.dead) return;
    var dx = who.x - o.x, dy = who.y - o.y, d = Math.hypot(dx, dy), min = o.r + r;
    if (d < min) { if (d < 0.01) { dx = 1; dy = 0; d = 1; } who.x = o.x + dx / d * min; who.y = o.y + dy / d * min; }
  };
  S.collide = function (who, r) { for (var i = 0; i < S.obs.length; i++) S.pushOutOne(S.obs[i], who, r); };
  S.blocks = function (x, y, r) {
    for (var i = 0; i < S.obs.length; i++) { var o = S.obs[i]; if (!o.dead && Math.hypot(o.x - x, o.y - y) < o.r + r * 0.5) { o.shake = 120; return true; } }
    return false;
  };
  function destroyLog(o) {
    o.dead = true; S.rubble.push({ x: o.x, y: o.y });
    fx.puff(o.x, o.y, 4); fx.dust(o.x, o.y, 10); fx.burst(o.x, o.y, 14, '#8a5a30', 220, 600, 4, { g: 260 });
    fx.ring(o.x, o.y, 10, 70, 300, '#c89060', 4); fx.shake(8, 250); sfx('explosion', { pitch: 0.9, vol: 0.7 });
  }

  // ================================================================= UTILIDADES DE COMBATE
  function dmgMul() { return pel().dmg * S.fury; }
  function hurt(e, base, src, o) {
    var p = PL(); if (p.dead || S.noHurt > 0) return false;
    return G.Player.hurt(p, base * dmgMul(), e.x, e.y, o ? (o.src = src, o) : { src: src });
  }
  S.shoot = function (x, y, ang, speed, dmg) {
    var n = 0, L = G.projectiles;
    for (var i = 0; i < L.length; i++) if (L[i].team === 'e') n++;
    if (n >= 60) return false;
    E.shoot('e', x, y, ang, speed, dmg * dmgMul(), 'proj_boss_thorn', { r: 7, life: 3600, fb: 'thorn', src: 'boss_abanico' });
    return true;
  };
  function addsAlive() { var n = 0; for (var i = 0; i < G.enemies.length; i++) if (!G.enemies[i].dead && G.enemies[i].bossAdd) n++; return n; }
  function normalsAlive() { var n = 0; for (var i = 0; i < G.enemies.length; i++) { var q = G.enemies[i]; if (!q.dead && q.type !== 'boss' && q.type !== 'bosspart' && !q.bossAdd) n++; } return n; }
  S.addsAlive = addsAlive;
  function anchors(e) { return Assets.bossAnchors('pastor', S.stateOf(e)); }

  // exposición (ventana de daño / derribo / aturdido): gana el mayor multiplicador activo
  function expose(e, mul, ms, kind) {
    e.exps.push({ mul: mul, t: ms, max: ms, kind: kind });
    if (kind !== 'stun' && kind !== 'derribo') { sfx('card_select', { pitch: 1.6, vol: 0.6 }); }
  }
  S.expo = function (e) {
    var best = { mul: 1, t: 0, max: 1, kind: null };
    for (var i = 0; i < e.exps.length; i++) { var x = e.exps[i]; if (x.mul > best.mul || (x.mul === best.mul && x.t > best.t)) best = x; }
    return best;
  };

  // ================================================================= DAÑO RECIBIDO (hooks de combat.js)
  // Multiplicadores del jefe: puerta de fase, debilidades/resistencias, Vellón, ventanas. Devuelve el daño real a HP (con deduplicado de área cuerpo+parte).
  S.mulIn = function (e, dmg, tag, o) {
    if (e.immune || e.dying || e.mode === 'intro') { S.lastFull = 0; return 0; }
    var D = e.def, m = 1, i;
    for (i = 0; i < D.weak.length; i++) if (D.weak[i].tag === tag && D.weak[i].phases.indexOf(e.phase) >= 0) m *= D.weak[i].mul;
    for (i = 0; i < D.resist.length; i++) if (D.resist[i].tag === tag) m *= D.resist[i].mul;
    if (!e.broken.vellon && !(o && o.viaPart)) m *= 0.8;          // lana gruesa
    m *= S.expo(e).mul;
    var full = dmg * m; S.lastFull = full;
    if (o && !o.proj && !o.dot) {                                  // golpes de área/aura/orbital: cuerpo + parte cuentan una sola vez
      var key = o.id || tag, last = e.lastHit[key];
      if (last != null && G.time - last < 120) return 0;
      e.lastHit[key] = G.time;
    }
    return full;
  };
  S.dealPart = function (pe, base, o) {
    var e = pe.partOf;
    if (!e || e.dead || pe.dead || e.immune || e.mode === 'intro') return 0;
    var o2 = {}, k; for (k in o) o2[k] = o[k];
    o2.viaPart = pe;
    var dealt = G.Combat.deal(e, base, o2);
    pe.meter -= S.lastFull * pe.hz; pe.flash = 80;
    if (pe.meter <= 0 && !pe.dead && !e.dead) S.breakPart(e, pe);
    return dealt;
  };
  // Suelo de HP en los umbrales de fase (la transición dispara la puerta inmune) y disparo del ataque desesperado
  S.afterHit = function (e) {
    if (e.dying || e.mode === 'intro') return;
    var D = e.def, flo;
    if (e.phase < 3 && e.mode !== 'gate') {
      flo = D.phases[e.phase - 1].thr * e.maxHp;
      if (e.hp <= flo) { e.hp = flo; S.startGate(e); }
    } else if (e.phase === 3 && !e.despDone && e.mode === 'fight') {
      flo = D.despairAt * e.maxHp;
      if (e.hp <= flo) { e.hp = flo; S.startDespair(e); }
    }
  };

  // ================================================================= PARTES
  S.breakPart = function (e, pe) {
    var D = e.def, pd = D.parts[pe.key];
    pe.dead = true; e.broken[pe.key] = true; e.partsBroken.push(pe.key);
    fx.part('fx_part_break', pe.x, pe.y, 0, 0, 420, { anim: true, sc: 1, add: true });
    fx.burst(pe.x, pe.y, 12, '#ffd27a', 240, 600, 4, { add: true }); fx.ember(pe.x, pe.y, 6, 14);
    fx.hit(80); fx.shake(6, 200); sfx('boss_roar', { pitch: 1.7, vol: 0.55 }); sfx('hit_heavy', { pitch: 0.8 });
    G.Hud.banner('¡' + pd.name.toUpperCase() + ' ROTO!', 1500, '#ffd27a');
    // corazón + trofeo (cuenta como Esencia)
    G.Combat.dropGem(pe.x, pe.y, 'heart', B.player.heal);
    G.Combat.dropGem(pe.x, pe.y, 'part', 1); var g = G.gems[G.gems.length - 1]; g.part = 'rare'; g.trophy = pd.trophy;
    var R = G.Loot.run; if (R) { if (!R.boss) R.boss = { id: e.id, won: false, parts: [] }; R.boss.parts.push(pe.key); }
    expose(e, 1.3, 3000, 'derribo');                                  // derribo: x1,3 durante 3 s y el jefe se tambalea
    if (e.atk && e.atk.name === 'salto') e.lift = 0;
    e.atk = null; e.bst = 'idle'; e.stagT = 1200; e.cadT = D.phases[e.phase - 1].cad * 0.6; e.lift = 0;
    if (pe.key === 'vellon') fx.flames(e.x, e.y - 40, 8, 30);
  };
  function updParts(e) {
    var a = anchors(e), D = e.def;
    for (var k in e.parts) {
      var pe = e.parts[k]; if (pe.dead) continue;
      var an = a[k]; pe.x = e.x + an.x; pe.y = e.y + an.y; pe.r = D.parts[k].r;
      if (pe.flash > 0) pe.flash -= 16.7;
    }
  }

  // ================================================================= FASES
  S.startGate = function (e) {
    var D = e.def, P = pel();
    e.mode = 'gate'; e.gateT = 3000; e.immune = true; e.atk = null; e.bst = 'idle'; e.lift = 0; e.stagT = 0;
    e.phase++; e.exps.length = 0;
    clearHazards();
    fx.shake(10, 600); sfx('boss_roar'); fx.ring(e.x, e.y, 20, 300, 600, '#ffffff', 6); fx.ring(e.x, e.y, 10, 200, 500, '#a060ff', 4); fx.flash && fx.flash(0.2);
    S.flash = 0.25;
    G.Hud.banner('FASE ' + ['I', 'II', 'III'][e.phase - 1] + ' - ' + D.phases[e.phase - 1].n.toUpperCase(), 2200, e.phase === 2 ? '#c090ff' : '#ff9a3c');
    var p = PL();   // salvavidas: 2 corazones
    for (var i = 0; i < 2; i++) G.Combat.dropGem(p.x + (i ? 50 : -50), p.y + 20, 'heart', B.player.heal);
    try { Assets.music.setIntensity(D.phases[e.phase - 1].music); } catch (x) { /* audio */ }
    if (e.phase === 2) { BRIERS.forEach(function (b) { S.briers.push({ x: b[0], y: b[1], r: 46, t: Math.random() * 3000 }); }); }
    if (e.phase === 3) { S.insetOn = true; S.insetT = 0; }
    for (var j = 0; j < G.enemies.length; j++) { var q = G.enemies[j]; if (!q.dead && q.type !== 'boss' && q.type !== 'bosspart' && !q.bossAdd) { q.noSpawnAdd = true; } }
  };
  function clearHazards() {
    S.waves.length = 0; S.spikes.length = 0;
    for (var i = G.zones.length - 1; i >= 0; i--) if (G.zones[i].team === 'e' && String(G.zones[i].src).indexOf('boss') === 0) G.zones.splice(i, 1);
  }
  S.startDespair = function (e) {
    e.mode = 'despair'; e.despDone = true; e.despT = 0; e.despN = 0; e.atk = null; e.bst = 'idle'; e.lift = 0; e.stagT = 0;
    clearHazards();
    for (var i = 0; i < G.enemies.length; i++) { var q = G.enemies[i]; if (!q.dead && q.bossAdd) E.kill(q, true); }
    fx.shake(10, 700); sfx('boss_roar', { pitch: 0.8 }); fx.ring(e.x, e.y, 20, 260, 700, '#c060ff', 6);
    G.Hud.banner(e.def.despair.toUpperCase(), 2400, '#c060ff');
    expose(e, 1.25, 9500, 'despair');
    e.despAng = Math.random() * TAU;
    try { Assets.music.setIntensity(1); } catch (x) { /* audio */ }
  };

  // ================================================================= ATAQUES
  var ATK = {};

  // ---- 1. Barrido de cayado (con el Cayado roto: golpe de puño corto)
  ATK.barrido = {
    start: function (e, A) {
      A.fist = e.broken.cayado; A.reach = A.fist ? 110 : 190; A.inner = A.fist ? 0 : 40; A.arc = (A.fist ? 100 : 180) * DEG;
      A.dmg = A.fist ? 18 : 24; A.aim = angTo(e, PL()); A.pose = 'barrido'; A.fixAt = 0.625; A.actMs = 300; A.rec = 650;
      if (A.fist) A.tele = Math.round(A.tele * 0.8);
    },
    tele: function (e, A) { if (A.t < A.tele * A.fixAt) { A.aim = angTo(e, PL()); e.face = Math.cos(A.aim) >= 0 ? 1 : -1; } },
    go: function (e, A) {
      var p = PL(), d = G.dist(e.x, e.y, p.x, p.y);
      fx.shake(6, 180); sfx('hit_heavy', { vol: 0.8 });
      fx.slash(e.x, e.y, A.aim, A.reach / 40, '#ff4040'); fx.ring(e.x + Math.cos(A.aim) * A.reach * 0.6, e.y + Math.sin(A.aim) * A.reach * 0.6, 10, 60, 250, '#ffcf7a', 4);
      if (!p.dead && d <= A.reach + p.r * 0.5 && d >= A.inner && Math.abs(G.angDiff(angTo(e, p), A.aim)) <= A.arc / 2) hurt(e, A.dmg, 'boss_barrido', { kb: 1.3 });
    },
    act: function (e, A) { return A.t >= A.actMs; },
    draw: function (c, e, A) { Assets.drawBossTele(c, 'arc', e.x, e.y, { r: A.reach, inner: A.inner, arc: A.arc, a: A.aim, p: A.t / A.tele, fix: A.t >= A.tele * A.fixAt, t: G.time }); },
    haz: function (e, A, out) { if (A.step === 'tele') out.push({ k: 'arc', x: e.x, y: e.y, r: A.reach, inner: A.inner, a: A.aim, arc: A.arc, t0: A.tele - A.t, t1: A.tele - A.t + 150 }); }
  };

  // ---- 2. Embestida del carnero (y base de la Estampida)
  function chargeMove(e, A, dt) {   // mueve al jefe en la carga; devuelve 'wall' | 'log' | 'end' | null
    var s = A.spd * dt / 1000, p = PL(), res = null, i;
    e.x += Math.cos(A.aim) * s; e.y += Math.sin(A.aim) * s; A.trav += s;
    if (Math.random() < 0.5) fx.dust(e.x - Math.cos(A.aim) * 50, e.y + 80, 1);
    if (!A.hit && !p.dead && G.dist(e.x, e.y, p.x, p.y) < 45 + p.r) { A.hit = true; hurt(e, A.dmg, 'boss_embestida', { kb: 1.6 }); }
    for (i = 0; i < S.obs.length; i++) { var o = S.obs[i]; if (!o.dead && Math.hypot(o.x - e.x, o.y - e.y) < 62 + o.r) { destroyLog(o); res = 'log'; } }
    var m = G.WALL + e.r + 1, miny = G.WALL + 110;
    if (e.x <= m || e.x >= G.AW - m || e.y <= miny || e.y >= G.AH - m) { e.x = G.clamp(e.x, m, G.AW - m); e.y = G.clamp(e.y, miny, G.AH - m); if (!res) res = 'wall'; }
    if (!res && A.trav >= A.len) res = 'end';
    return res;
  }
  function chargeStun(e, A, res, ms) {   // ms de aturdimiento; con los Cuernos rotos solo aturde contra tronco
    var stun = res === 'log' || (res === 'wall' && !e.broken.cuernos);
    if (stun) { A.stunned = true; A.rec = ms; expose(e, 1.35, ms, 'stun'); fx.shake(9, 300); fx.hit(60); sfx('hit_heavy', { pitch: 0.7 }); fx.ring(e.x, e.y, 20, 160, 350, '#ffe45a', 5); G.Hud.banner('¡ATURDIDO!', 1000, '#ffe45a'); }
    else A.rec = 800;
    return stun;
  }
  ATK.embestida = {
    start: function (e, A) { A.aim = angTo(e, PL()); A.len = 520; A.spd = e.broken.cuernos ? 430 : 520; A.dmg = 30; A.trav = 0; A.pose = 'embestida'; A.fixAt = A.tele - 300; A.actMs = 1000; },
    tele: function (e, A) { if (A.t < A.fixAt) { A.aim = angTo(e, PL()); e.face = Math.cos(A.aim) >= 0 ? 1 : -1; } },
    go: function (e, A) { A.hit = false; sfx('whoosh', { pitch: 0.5, vol: 0.8 }); sfx('boss_roar', { pitch: 1.5, vol: 0.5 }); fx.shake(3, 90); e.face = Math.cos(A.aim) >= 0 ? 1 : -1; },
    act: function (e, A, dt) {
      var r = chargeMove(e, A, dt);
      if (r) { chargeStun(e, A, r, 2400); return true; }
      return false;
    },
    draw: function (c, e, A) { Assets.drawBossTele(c, 'lane', e.x, e.y, { w: 90, len: 520, a: A.aim, p: A.t / A.tele, fix: A.t >= A.fixAt, sig: true, t: G.time }); },
    haz: function (e, A, out) {
      if (A.step === 'tele') out.push({ k: 'lane', x: e.x, y: e.y, a: A.aim, w: 90, len: A.len, t0: A.tele - A.t, t1: A.tele - A.t + A.len / A.spd * 1000 });
      else if (A.step === 'act') out.push({ k: 'lane', x: e.x, y: e.y, a: A.aim, w: 90, len: A.len - A.trav, t0: 0, t1: (A.len - A.trav) / A.spd * 1000 });
    }
  };

  // ---- 3. Pisotón sísmico: dos ondas anulares con hueco de 60 grados
  ATK.pisoton = {
    start: function (e, A) {
      var a = angTo(e, PL()), sgn = Math.random() < 0.5 ? -1 : 1;
      A.ga = a + sgn * G.rnd(35, 95) * DEG; A.pose = 'pisoton'; A.actMs = 500; A.rec = 800; A.dmg = 20;
    },
    tele: function (e, A) { e.face = Math.cos(angTo(e, PL())) >= 0 ? 1 : -1; },
    go: function (e, A) {
      fx.shake(8, 220); sfx('shockwave', { vol: 0.9 }); fx.dust(e.x, e.y + 80, 10); fx.part('fx_boss_crack', e.x, e.y + 70, 0, 0, 500, { anim: true, sc: 1.2 });
      for (var i = 0; i < 2; i++) S.waves.push({ x: e.x, y: e.y, r: 20, v: 200, th: 24, gaps: [{ a: A.ga, w: 60 * DEG }], dmg: 20, delay: i * 400, hit: false, maxR: 360, style: 0, src: 'boss_pisoton', ref: A });
    },
    act: function (e, A) { return A.t >= A.actMs; },
    draw: function (c, e, A) { Assets.drawBossTele(c, 'ring', e.x, e.y, { r: 300, th: 24, gap: 60 * DEG, a: A.ga, p: A.t / A.tele, t: G.time }); },
    haz: function (e, A, out) { if (A.step === 'tele') for (var i = 0; i < 2; i++) out.push({ k: 'wave', x: e.x, y: e.y, r: 20, v: 200, th: 24, gaps: [{ a: A.ga, w: 60 * DEG }], t0: A.tele - A.t + i * 400, t1: A.tele - A.t + i * 400 + 1700 }); }
  };

  // ---- 4. Salto aplastante
  ATK.salto = {
    start: function (e, A) {
      var p = PL(); A.sx = e.x; A.sy = e.y; A.tx = p.x; A.ty = p.y; A.r = 120; A.dmg = 30; A.pose = 'salto'; A.fixAt = A.tele - 250; A.actMs = 350; A.rec = 650;
      A.flyAt = A.tele - 600;
    },
    tele: function (e, A, dt) {
      var p = PL(), m = G.WALL + e.r, miny = G.WALL + 110;
      if (A.t < A.fixAt) {   // la sombra persigue al jugador, pero más lenta que él (150 px/s): se puede salir
        var dx = p.x - A.tx, dy = p.y - A.ty, d = Math.hypot(dx, dy), st = Math.min(d, 150 * dt / 1000);
        if (d > 0.5) { A.tx += dx / d * st; A.ty += dy / d * st; }
      }
      A.tx = G.clamp(A.tx, m, G.AW - m); A.ty = G.clamp(A.ty, miny, G.AH - m);
      var u = ease((A.t - A.flyAt) / 600);
      e.x = A.sx + (A.tx - A.sx) * u; e.y = A.sy + (A.ty - A.sy) * u; e.lift = A.t > A.flyAt ? 120 * Math.sin(u * Math.PI) : 0;
      if (A.t > A.flyAt) e.face = A.tx >= A.sx ? 1 : -1;
    },
    go: function (e, A) {
      var p = PL(); e.x = A.tx; e.y = A.ty; e.lift = 0;
      fx.shake(8, 220); fx.hit(40); sfx('explosion', { pitch: 0.7, vol: 0.9 }); fx.dust(e.x, e.y + 80, 14); fx.shockwave(e.x, e.y + 60, 260);
      fx.part('fx_boss_crack', e.x, e.y + 60, 0, 0, 600, { anim: true, sc: 1.6 });
      if (!p.dead && G.dist(e.x, e.y, p.x, p.y) <= A.r) hurt(e, A.dmg, 'boss_salto', { kb: 1.5 });
      var n = e.phase === 1 ? 6 : 6;
      for (var i = 0; i < n; i++) { var an = i / n * TAU + 0.4; S.spikes.push({ x: e.x + Math.cos(an) * (92 + (i % 2) * 20), y: e.y + 66 + Math.sin(an) * 60, t: 0, life: 3000, hurts: e.phase >= 2, tk: 0 }); }
      expose(e, 1.25, 1500, 'window');
    },
    act: function (e, A) { return A.t >= A.actMs; },
    draw: function (c, e, A) { Assets.drawBossTele(c, 'circle', A.tx, A.ty + 4, { r: A.r, p: A.t / A.tele, fix: A.t >= A.fixAt, sig: true, t: G.time }); },
    haz: function (e, A, out) { if (A.step === 'tele') out.push({ k: 'circle', x: A.tx, y: A.ty, r: A.r, t0: A.tele - A.t, t1: A.tele - A.t + 150, fixIn: Math.max(0, A.fixAt - A.t) }); }
  };

  // ---- 5. Abanico de espinas
  ATK.abanico = {
    start: function (e, A) {
      A.aim = angTo(e, PL()); A.n = [7, 9, 11][e.phase - 1] - (e.broken.vellon ? 2 : 0); A.vol = e.phase === 3 ? 3 : 1; A.vi = 0; A.dmg = 10; A.pose = 'abanico'; A.rec = 550;
      A.actMs = (A.vol - 1) * 170 + 150;
    },
    tele: function (e, A) { if (A.t < 400) { A.aim = angTo(e, PL()); e.face = Math.cos(A.aim) >= 0 ? 1 : -1; } },
    go: function (e, A) { A.vi = 0; ATK.abanico.fire(e, A); },
    fire: function (e, A) {
      var mo = anchors(e).mouth, ox = e.x + mo.x, oy = e.y + mo.y, spread = 70 * DEG, k = A.vi, step = spread / (A.n - 1);
      var off = (k % 2) * 0.5 * step;
      for (var j = 0; j < A.n; j++) S.shoot(ox, oy, A.aim - spread / 2 + step * j + (k % 2 ? off - step * 0.25 : 0), 220, A.dmg);
      sfx('shoot', { pitch: 0.7, vol: 0.7 }); fx.shake(3, 90); A.vi++;
    },
    act: function (e, A) { while (A.vi < A.vol && A.t >= A.vi * 170) ATK.abanico.fire(e, A); return A.t >= A.actMs; },
    draw: function (c, e, A) { Assets.drawBossTele(c, 'cone', e.x, e.y, { r: 420, arc: 70 * DEG, a: A.aim, p: A.t / A.tele, fix: A.t >= 400, t: G.time }); },
    haz: function (e, A, out) { if (A.step === 'tele') out.push({ k: 'arc', x: e.x, y: e.y, r: 420, inner: 0, a: A.aim, arc: 70 * DEG, t0: A.tele - A.t, t1: A.tele - A.t + 700 }); }
  };

  // ---- 6. Llamada del rebaño
  ATK.llamada = {
    ok: function (e) { return addsAlive() < pel().cap - 0; },
    start: function (e, A) {
      var P = pel(), room = P.cap - addsAlive(), p = PL(), worms = e.broken.cayado;
      var n = (e.phase === 3 ? 3 : 2) + P.adds; if (worms) n += 2; n = Math.min(n, room);
      var pool = worms ? ['worm'] : ['fanner', 'shield', 'moth'];
      A.pose = 'llamada'; A.actMs = 300; A.rec = 600; A.spots = [];
      for (var i = 0; i < n; i++) {
        var ty = pool[Math.floor(Math.random() * pool.length)], a0 = Math.random() * TAU, cx, cy, tries = 0;
        do { a0 += 1.1; cx = e.x + Math.cos(a0) * 130; cy = e.y + Math.sin(a0) * 120; tries++; } while (G.dist(cx, cy, p.x, p.y) < 90 && tries < 8);
        cx = G.clamp(cx, G.WALL + 30, G.AW - G.WALL - 30); cy = G.clamp(cy, G.WALL + 30, G.AH - G.WALL - 30);
        var ad = E.spawn(ty, cx, cy, { summoned: true, spawnT: A.tele }); ad.bossAdd = true; A.spots.push({ x: cx, y: cy });
      }
      sfx('wave_start', { pitch: 0.7, vol: 0.8 });
    },
    go: function (e, A) { fx.ring(e.x, e.y, 10, 130, 500, '#a060ff', 5); fx.shake(4, 150); sfx('hit_heavy', { pitch: 0.6, vol: 0.6 }); },
    act: function (e, A) { return A.t >= A.actMs; },
    draw: function (c, e, A) { Assets.drawBossTele(c, 'summon', e.x, e.y, { r: 110, p: A.t / A.tele, t: G.time }); },
    haz: function () { }
  };

  // ---- 7. Esporas del Rebaño (F2-F3)
  ATK.esporas = {
    start: function (e, A) {
      var p = PL(), a0 = Math.random() * TAU; A.pose = 'esporas'; A.actMs = 200; A.rec = 500; A.spots = [];
      for (var i = 0; i < 3; i++) {
        var a = a0 + i * TAU / 3, d = G.rnd(140, 200), x = G.clamp(p.x + Math.cos(a) * d, G.WALL + 60, G.AW - G.WALL - 60), y = G.clamp(p.y + Math.sin(a) * d, G.WALL + 60, G.AH - G.WALL - 60);
        A.spots.push({ x: x, y: y });
        var z = E.zone({ kind: 'spore', x: x, y: y, r: 60, arm: A.tele, life: 6000, dmg: 8 * dmgMul(), tick: 500, slow: 0.15, owner: e, src: 'boss_spore' });
        z.noArmDraw = true;
      }
    },
    go: function (e, A) { sfx('wave_start', { pitch: 1.4, vol: 0.5 }); fx.shake(3, 100); },
    act: function (e, A) { return A.t >= A.actMs; },
    draw: function (c, e, A) { for (var i = 0; i < A.spots.length; i++) Assets.drawBossTele(c, 'spore', A.spots[i].x, A.spots[i].y, { r: 60, p: A.t / A.tele, t: G.time }); },
    haz: function () { }
  };

  // ---- 8. Estampida (F3): 3 embestidas encadenadas, la última deja al jefe aturdido
  ATK.estampida = {
    start: function (e, A) { A.aim = angTo(e, PL()); A.len = 420; A.spd = e.broken.cuernos ? 430 : 520; A.dmg = 24; A.k = 0; A.n = 3; A.sub = 'tele'; A.pose = 'estampida'; A.fixAt = A.tele - 250; A.trav = 0; A.actMs = 99999; },
    tele: function (e, A) { if (A.t < A.fixAt) { A.aim = angTo(e, PL()); e.face = Math.cos(A.aim) >= 0 ? 1 : -1; } },
    go: function (e, A) { A.sub = 'charge'; A.trav = 0; A.hit = false; sfx('whoosh', { pitch: 0.5, vol: 0.8 }); sfx('boss_roar', { pitch: 1.6, vol: 0.45 }); e.face = Math.cos(A.aim) >= 0 ? 1 : -1; },
    act: function (e, A, dt) {
      if (A.sub === 'aim') {
        A.subT += dt; if (A.subT < 250) { A.aim = angTo(e, PL()); e.face = Math.cos(A.aim) >= 0 ? 1 : -1; }
        if (A.subT >= 500) { A.sub = 'charge'; A.trav = 0; A.hit = false; sfx('whoosh', { pitch: 0.55, vol: 0.7 }); e.face = Math.cos(A.aim) >= 0 ? 1 : -1; }
        return false;
      }
      var r = chargeMove(e, A, dt);
      if (!r) return false;
      A.k++;
      if (A.k >= A.n) { chargeStun(e, A, 'log', 2000); A.stunned = true; A.rec = 2000; return true; }
      A.sub = 'aim'; A.subT = 0; A.aim = angTo(e, PL()); fx.shake(4, 100);
      return false;
    },
    draw: function (c, e, A) {
      if (A.step === 'tele') Assets.drawBossTele(c, 'lane', e.x, e.y, { w: 90, len: 420, a: A.aim, p: A.t / A.tele, fix: A.t >= A.fixAt, sig: true, t: G.time });
      else if (A.sub === 'aim') Assets.drawBossTele(c, 'lane', e.x, e.y, { w: 90, len: 420, a: A.aim, p: A.subT / 500, fix: A.subT >= 250, sig: true, t: G.time });
    },
    haz: function (e, A, out) {
      if (A.step === 'tele') out.push({ k: 'lane', x: e.x, y: e.y, a: A.aim, w: 90, len: A.len, t0: A.tele - A.t, t1: A.tele - A.t + A.len / A.spd * 1000 });
      else if (A.sub === 'aim') out.push({ k: 'lane', x: e.x, y: e.y, a: A.aim, w: 90, len: A.len, t0: 500 - A.subT, t1: 500 - A.subT + A.len / A.spd * 1000 });
      else if (A.sub === 'charge') out.push({ k: 'lane', x: e.x, y: e.y, a: A.aim, w: 90, len: A.len - A.trav, t0: 0, t1: (A.len - A.trav) / A.spd * 1000 });
    }
  };

  // ================================================================= MÁQUINA DE ATAQUES
  function okNow(e, name) {
    var d = G.dist(e.x, e.y, PL().x, PL().y);
    switch (name) {
      case 'barrido': return d < (e.broken.cayado ? 190 : 260);
      case 'embestida': return d > 200 && d < 650;
      case 'pisoton': return d < 380;
      case 'salto': return d > 170;
      case 'abanico': return d > 130;
      case 'llamada': return ATK.llamada.ok(e);
      case 'estampida': return d > 150 && d < 650;
      default: return true;
    }
  }
  function pickAttack(e) {
    var allowed = Object.keys(ATKS).filter(function (n) { return ATKS[n].phases.indexOf(e.phase) >= 0; });
    if (!e.bag.length) e.bag = shuffle(allowed.slice());
    var i, n, pass;
    for (pass = 0; pass < 2; pass++) {   // 1.ª pasada: respeta posición; 2.ª: solo cooldown
      for (i = 0; i < e.bag.length; i++) {
        n = e.bag[i];
        if (n === e.last || (S.cds[n] || 0) > 0 || allowed.indexOf(n) < 0) continue;
        if (n === 'llamada' && !ATK.llamada.ok(e)) continue;
        if (pass === 0 && !okNow(e, n)) continue;
        e.bag.splice(i, 1); return n;
      }
      // el saco no ofrece nada: prueba con el resto de ataques de la fase
      for (i = 0; i < allowed.length; i++) {
        n = allowed[i];
        if (n === e.last || (S.cds[n] || 0) > 0) continue;
        if (n === 'llamada' && !ATK.llamada.ok(e)) continue;
        if (pass === 0 && !okNow(e, n)) continue;
        return n;
      }
    }
    return null;
  }
  function startAttack(e, name) {
    var d = ATKS[name], H = ATK[name], A = { name: name, def: d, t: 0, step: 'tele', tele: teleMs(name), sig: !!d.sig, rec: 600, actMs: 300, ticks: 0 };
    S.cds[name] = d.cd * (name === 'llamada' && e.broken.cayado ? 30 / 22 : 1);
    e.atk = A; e.bst = 'atk';
    H.start(e, A);
    sfx(d.sig ? 'hit_heavy' : 'whoosh', { pitch: d.sig ? 0.55 : 0.6, vol: 0.5 });
  }
  function endAtk(e) {
    var A = e.atk; e.last = A.name; e.atk = null; e.bst = 'idle'; e.lift = 0;
    e.cadT = e.def.phases[e.phase - 1].cad;
  }
  function runAtk(e, dt) {
    var A = e.atk, H = ATK[A.name];
    A.t += dt;
    if (A.step === 'tele') {
      if (H.tele) H.tele(e, A, dt);
      if (A.sig) {   // aviso ascendente (400 -> 1200 Hz aprox.) en 3 pasos
        var pr = A.t / A.tele; if (pr > 0.4 && A.ticks < 1) { A.ticks = 1; sfx('whoosh', { pitch: 1.0, vol: 0.35 }); }
        if (pr > 0.7 && A.ticks < 2) { A.ticks = 2; sfx('whoosh', { pitch: 1.4, vol: 0.4 }); }
        if (pr > 0.9 && A.ticks < 3) { A.ticks = 3; sfx('whoosh', { pitch: 1.9, vol: 0.45 }); }
      }
      if (A.t >= A.tele) { A.step = 'act'; A.t = 0; H.go(e, A); }
    } else if (A.step === 'act') {
      if (H.act(e, A, dt)) { A.step = 'rec'; A.t = 0; }
    } else if (A.t >= A.rec) endAtk(e);
  }

  // ================================================================= ONDAS (Pisotón y Éxtasis)
  function updWaves(dt) {
    var p = PL(), s = dt / 1000;
    for (var i = S.waves.length - 1; i >= 0; i--) {
      var w = S.waves[i];
      if (w.delay > 0) { w.delay -= dt; if (w.delay <= 0) { sfx('shockwave', { vol: 0.5, pitch: 1.2 }); fx.shake(4, 120); } continue; }
      w.r += w.v * s;
      if (w.r > w.maxR) { S.waves.splice(i, 1); continue; }
      if (!w.hit && !p.dead && S.noHurt <= 0) {
        var d = G.dist(w.x, w.y, p.x, p.y);
        if (Math.abs(d - w.r) <= w.th / 2 + p.r * 0.6) {
          var ang = Math.atan2(p.y - w.y, p.x - w.x), safe = false;
          for (var g = 0; g < w.gaps.length; g++) if (Math.abs(G.angDiff(ang, w.gaps[g].a)) <= w.gaps[g].w / 2) safe = true;
          if (!safe) { w.hit = true; hurt({ x: w.x, y: w.y }, w.dmg, w.src, { kb: 1 }); }
        }
      }
    }
  }
  function drawWave(c, w) {
    if (w.delay > 0) return;
    var al = 1 - Math.max(0, w.r - 280) / 120;
    if (w.gaps.length === 1) Assets.drawBossWave(c, w.x, w.y, w.r, { th: w.th, gap: w.gaps[0].w, a: w.gaps[0].a, style: w.style, alpha: al });
    else {   // dos huecos opuestos: dos arcos
      var g0 = w.gaps[0], arcW = Math.PI - g0.w;
      for (var k = 0; k < 2; k++) { var ca = g0.a + Math.PI / 2 + k * Math.PI; Assets.drawBossWave(c, w.x, w.y, w.r, { th: w.th, gap: TAU - arcW, a: ca + Math.PI, style: w.style, alpha: al }); }
    }
  }

  // ================================================================= EVENTOS DE ARENA
  function updArena(e, dt) {
    var p = PL(), i;
    for (i = 0; i < S.obs.length; i++) if (S.obs[i].shake > 0) S.obs[i].shake -= dt;
    for (i = S.spikes.length - 1; i >= 0; i--) {
      var sp = S.spikes[i]; sp.t += dt;
      if (sp.t > sp.life) { S.spikes.splice(i, 1); continue; }
      if (sp.hurts && !p.dead && S.noHurt <= 0) { sp.tk -= dt; if (sp.tk <= 0 && G.dist(sp.x, sp.y, p.x, p.y) < 16 + p.r) { sp.tk = 600; hurt(e, 8, 'boss_espina', { soft: true }); } }
    }
    if (S.briers.length) {   // zarzal de borde (F2): ralentiza 20 % y hiere poco
      S.brierTk -= dt;
      for (i = 0; i < S.briers.length; i++) {
        var b = S.briers[i]; b.t += dt;
        if (!p.dead && G.dist(b.x, b.y, p.x, p.y) < b.r + p.r * 0.5) { G.Player.slow(p, 0.2, 350); if (S.brierTk <= 0) { S.brierTk = 600; hurt(e, 4, 'boss_zarzal', { soft: true }); } }
      }
    }
    if (S.insetOn) {     // perímetro ardiente (F3): el área jugable se reduce ~15 % en 20 s
      S.insetT += dt; S.inset = 44 * G.clamp(S.insetT / 20000, 0, 1); S.burnTk -= dt;
      var m = G.WALL + S.inset;
      if (!p.dead && S.burnTk <= 0 && (p.x < m || p.x > G.AW - m || p.y < m || p.y > G.AH - m)) { S.burnTk = 400; hurt(e, 10, 'boss_perimetro', { soft: true }); }
    }
  }

  // ================================================================= CICLO PRINCIPAL
  function furyUpdate(e) {
    var P = pel(), t = S.combatT, f = 1;
    if (t >= P.fury) f = Math.min(2, 1.25 + 0.1 * Math.floor((t - P.fury) / 15000));
    if (f > S.fury) {
      var first = S.fury === 1; S.fury = f;
      fx.shake(8, 300); sfx('boss_roar', { pitch: 1.1 });
      G.Hud.banner(first ? '¡FURIA DEL PASTOR!' : 'FURIA +' + Math.round((f - 1) * 100) + ' %', 1600, '#ff3030');
    }
  }
  S.update = function (dt) {
    var e = S.e;
    if (S.dying) { updDying(dt); return; }
    if (!e || e.dead) return;
    if (S.noHurt > 0) S.noHurt -= dt;
    if (S.flash > 0) S.flash -= dt / 400;
    // barra fantasma
    var fr = e.hp / e.maxHp;
    if (S.ghost > fr) { S.ghostT -= dt; if (S.ghostT <= 0) S.ghost = Math.max(fr, S.ghost - dt / 1000 * 0.35); } else S.ghost = fr;
    if (e.lastFr == null || fr < e.lastFr - 0.0005) S.ghostT = 400;
    e.lastFr = fr;
    if (e.mode === 'intro') { updIntro(e, dt); return; }
    S.combatT += dt;
    furyUpdate(e);
    for (var i = e.exps.length - 1; i >= 0; i--) { e.exps[i].t -= dt; if (e.exps[i].t <= 0) e.exps.splice(i, 1); }
    for (var k in S.cds) if (S.cds[k] > 0) S.cds[k] -= dt;
    if (e.roar > 0 && e.mode !== 'gate') e.roar = Math.max(0, e.roar - dt / 400);
    updWaves(dt); updArena(e, dt);
    if (e.mode === 'gate') {
      e.gateT -= dt; e.roar = e.gateT > 2100 ? Math.min(1, (3000 - e.gateT) / 200) : Math.max(0, (e.gateT - 1500) / 600);
      if (e.gateT <= 0) { e.mode = 'fight'; e.immune = false; e.cadT = 1300; e.roar = 0; G.Hud.banner('¡' + e.def.phases[e.phase - 1].n.toUpperCase() + '!', 1000, '#ffd27a'); }
    } else if (e.mode === 'despair') updDespair(e, dt);
    else updFight(e, dt);
    updParts(e);
    e.sortY = e.y + 88 - (e.lift || 0) * 0.3;
    S.sigP = (e.atk && e.atk.sig && e.atk.step === 'tele') ? Math.min(1, e.atk.t / e.atk.tele) : 0;
  };

  function moveToward(e, tx, ty, spd, dt) {
    var dx = tx - e.x, dy = ty - e.y, d = Math.hypot(dx, dy);
    if (d < 1) return;
    var st = Math.min(d, spd * dt / 1000);
    e.x += dx / d * st; e.y += dy / d * st;
    S.collide(e, 60);
    e.x = G.clamp(e.x, G.WALL + e.r, G.AW - G.WALL - e.r); e.y = G.clamp(e.y, G.WALL + 110, G.AH - G.WALL - e.r);
  }
  function updFight(e, dt) {
    var p = PL(), PH = e.def.phases[e.phase - 1];
    if (e.stagT > 0) { e.stagT -= dt; e.moveAmt = 0; return; }
    if (e.bst === 'atk') { e.moveAmt = 0; runAtk(e, dt); return; }
    // desplazamiento hacia el jugador
    var d = G.dist(e.x, e.y, p.x, p.y), spd = PH.spd * (e.slowT > 0 ? 1 - e.slowPct : 1);
    if (!p.dead && d > 90) { moveToward(e, p.x, p.y, spd, dt); e.moveAmt = 1; e.curSpd = spd; } else e.moveAmt = 0;
    if (!p.dead && Math.abs(p.x - e.x) > 4) e.face = p.x >= e.x ? 1 : -1;
    e.cadT -= dt * S.fury;
    if (e.cadT <= 0 && !p.dead) {
      var n = pickAttack(e);
      if (n) startAttack(e, n); else e.cadT = 350;
    }
  }
  function updDespair(e, dt) {   // Éxtasis del Rebaño: arena morada, oleadas de anillos con 2 huecos de 45 grados, jefe quieto y vulnerable x1,25
    e.despT += dt; e.moveAmt = 0;
    S.tint = Math.min(1, e.despT / 800);
    var total = 9000 * (pel() === PEL[4] || pel() === PEL[5] ? 12 / 9 : 1);
    if (e.despT >= 1000 + e.despN * 1300 && e.despN < Math.floor((total - 1000) / 1300) + 1) {
      var a = e.despAng + e.despN * 20 * DEG;
      S.waves.push({ x: e.x, y: e.y, r: 60, v: 170, th: 22, gaps: [{ a: a, w: 45 * DEG }, { a: a + Math.PI, w: 45 * DEG }], dmg: 10, delay: 0, hit: false, maxR: 1000, style: 1, src: 'boss_extasis' });
      e.despN++; sfx('shockwave', { vol: 0.45, pitch: 1.3 }); fx.shake(3, 120);
    }
    if (e.despT >= total) {
      e.mode = 'fight'; e.cadT = 1500; S.tint = 0; G.Hud.banner('El éxtasis termina...', 1300, '#c090ff');
    }
  }

  // ================================================================= INTRO (3,5 s)
  function cullHorde() {   // el rugido dispersa al rebaño: quedan como mucho 15 normales (los más cercanos)
    var p = PL(), list = [];
    G.enemies.forEach(function (q) { if (!q.dead && q.type !== 'boss' && q.type !== 'bosspart' && !q.bossAdd) list.push(q); });
    list.sort(function (a, b) { return G.dist(a.x, a.y, p.x, p.y) - G.dist(b.x, b.y, p.x, p.y); });
    for (var i = 12; i < list.length; i++) { fx.puff(list[i].x, list[i].y, 1); E.kill(list[i], true); }
    for (var j = G.projectiles.length - 1; j >= 0; j--) if (G.projectiles[j].team === 'e') G.projectiles.splice(j, 1);
    for (var z = G.zones.length - 1; z >= 0; z--) if (G.zones[z].team === 'e') G.zones.splice(z, 1);
  }
  function updIntro(e, dt) {
    var I = S.intro; I.t += dt;
    if (I.seen && I.t > 1000 && I.t < 3490 && !I.skipped && Object.keys(G.input.pressed).length) { I.skipped = true; I.t = 3500; }
    var t = I.t;
    e.alpha = G.clamp(t / 250, 0, 1);
    if (!I.landed) e.lift = 640 * (1 - Math.pow(G.clamp(t / 800, 0, 1), 2));
    if (t >= 800 && !I.landed) {
      I.landed = true; e.lift = 0; I.landT = t;
      fx.shake(8, 220); fx.shockwave(e.x, e.y + 70, 300); fx.dust(e.x, e.y + 80, 16); fx.ring(e.x, e.y + 70, 20, 280, 500, '#ffd27a', 5); sfx('shockwave', { vol: 0.9 });
      fx.part('fx_boss_crack', e.x, e.y + 60, 0, 0, 700, { anim: true, sc: 1.8 });
    }
    if (t >= 1800 && !I.roared) {
      I.roared = true; fx.shake(10, 600); fx.hit(80); sfx('boss_roar'); S.flash = 0.5;
      fx.ring(e.x, e.y, 30, 420, 700, '#ffffff', 6); fx.ring(e.x, e.y, 10, 300, 600, '#ff9a2a', 4);
      cullHorde();
    }
    if (t >= 1800 && t < 2500) { var u = (t - 1800) / 700; e.roar = u < 0.2 ? u / 0.2 : u > 0.75 ? (1 - u) / 0.25 : 1; } else e.roar = 0;
    S.barFill = I.roared ? G.clamp((t - 1800) / 600, 0, 1) : 0;
    if (t >= 2400 && !I.music) { I.music = true; try { Assets.music.setTrack('boss'); Assets.music.setIntensity(e.def.phases[0].music); } catch (x) { /* audio */ } sfx('special', { vol: 0.6 }); }
    if (t >= 3500) {
      S.intro = null; e.mode = 'fight'; e.immune = false; e.lift = 0; e.alpha = 1; e.roar = 0; G.frozen = false; S.barFill = 1; e.cadT = 1200;
      if (!I.music) { try { Assets.music.setTrack('boss'); Assets.music.setIntensity(e.def.phases[0].music); } catch (x2) { /* audio */ } }
      G.Save.data.bossSeen = G.Save.data.bossSeen || {}; G.Save.data.bossSeen[e.id] = 1; G.Save.save();
      if (G.dbgPhase > 1) { e.hp = e.maxHp * (G.dbgPhase === 2 ? 0.65 : 0.30); for (var gi = 1; gi < G.dbgPhase; gi++) S.startGate(e); }
      if (G.dbgHp) e.hp = e.maxHp * G.dbgHp;
    }
  }
  // peso de cámara hacia el jefe y zoom durante la intro
  S.camTarget = function (tx, ty) {
    var I = S.intro, e = S.e;
    if (!I || !e) { G.cam.zoom = 1; return { x: tx, y: ty }; }
    var t = I.t, w = t < 800 ? ease(t / 800) : t < 2400 ? 1 : 1 - ease((t - 2400) / 900);
    G.cam.zoom = 1 + 0.15 * (1 - ease(t / 800)) * (t < 2400 ? 1 : 0);
    var bx = G.clamp(e.x - G.W / 2, 0, G.AW - G.W), by = G.clamp(e.y - 40 - G.H / 2, 0, G.AH - G.H);
    return { x: tx + (bx - tx) * w, y: ty + (by - ty) * w };
  };

  // ================================================================= MUERTE
  S.onDeath = function (e) {
    S.active = false; S.defeated = true;
    var wasDespair = e.mode === 'despair';
    S.dying = { t: 0, hold: wasDespair ? 400 : 0, dt: 0, x: e.x, y: e.y, face: e.face, phase: e.phase, broken: { cuernos: e.broken.cuernos, cayado: e.broken.cayado, vellon: e.broken.vellon } };
    e.dying = true; e.immune = true; S.noHurt = 1e9; G.frozen = false; S.tint = 0; S.sigP = 0;
    Object.keys(e.parts).forEach(function (k) { e.parts[k].dead = true; });
    S.waves.length = 0; S.spikes.length = 0;
    fx.hit(120); fx.shake(12, 900); sfx('boss_die'); S.flash = 0.6;
    G.Hud.banner('¡' + e.def.name.toUpperCase() + ' DERROTADO!', 2800, '#ffd24a');
    var R = G.Loot.run; if (R) { if (!R.boss) R.boss = { id: e.id, won: true, parts: [] }; R.boss.won = true; R.boss.time = S.combatT; }
    try { Assets.music.setIntensity(0.25); } catch (x) { /* audio */ }
  };
  function updDying(dt) {
    var D = S.dying; D.t += dt;
    if (D.hold > 0) { D.hold -= dt; return; }
    D.dt += dt;
    if (D.dt < 1800 && Math.random() < 0.4) fx.ember(D.x, D.y, 1, 50);
    if (D.dt > 1800 && D.dt < 3200 && Math.random() < 0.7) { fx.ember(D.x, D.y, 2, 60); fx.flames(D.x, D.y + 20, 1, 50); }
    if (S.flash > 0) S.flash -= dt / 500;
  }

  // ================================================================= ESTADO PARA EL DIBUJO + DIBUJO
  S.stateOf = function (e) {
    var A = e.atk, ex = S.expo(e);
    var st = { t: e.anim, facing: e.face, phase: e.phase, moving: e.bst === 'idle' && e.moveAmt > 0 ? 1 : 0, speed: e.curSpd || 0, hurt: e.flash > 0 ? 0.55 : 0,
      broken: e.broken, lift: e.lift || 0, enraged: S.fury > 1, desperate: e.mode === 'despair', exposed: ex.mul > 1 && ex.kind !== 'stun', stun: false,
      immune: e.immune && e.mode !== 'intro' && !e.dying, roar: e.roar || 0, alpha: e.alpha == null ? 1 : e.alpha };
    if (e.stagT > 0) { st.hurt = 0.8; st.stun = false; }
    if (A) {
      var pose = A.pose;
      if (A.step === 'tele') { st.windup = pose; st.wp = G.clamp(A.t / A.tele, 0, 0.999); }
      else if (A.step === 'act') {
        if (A.name === 'estampida' && A.sub === 'aim') { st.windup = pose; st.wp = G.clamp(A.subT / 500, 0, 0.999); }
        else { st.strike = pose; st.sp = G.clamp(A.t / (A.name === 'embestida' || A.name === 'estampida' ? 600 : (A.actMs || 300)), 0, 0.999); }
        if (pose === 'embestida' || pose === 'estampida') st.speed = A.spd;
      } else if (A.stunned) st.stun = true;
      else if (A.t < 300) { st.strike = pose; st.sp = G.clamp(0.7 + A.t / 1000, 0, 0.999); }
    }
    return st;
  };
  S.draw = function (c, e) {
    if (e.dying) return;
    var st = S.stateOf(e);
    Assets.drawBoss('pastor', c, e.x, e.y, st);
    // barras flotantes de las partes dañadas (solo mientras lo están)
    for (var k in e.parts) {
      var pe = e.parts[k]; if (pe.dead || pe.meter >= pe.meterMax - 0.5) continue;
      var f = G.clamp(pe.meter / pe.meterMax, 0, 1), bx = Math.round(pe.x - 24), by = Math.round(pe.y - pe.r - 12);
      c.fillStyle = '#1a0a12'; c.fillRect(bx - 1, by - 1, 50, 6); c.fillStyle = pe.flash > 0 ? '#fff' : '#ffb347'; c.fillRect(bx, by, 48 * f, 4);
    }
    if (G.dbg && G.dbgHit) { for (var k2 in e.parts) { var q = e.parts[k2]; if (q.dead) continue; c.strokeStyle = '#0f0'; c.beginPath(); c.arc(q.x, q.y, q.r, 0, TAU); c.stroke(); } c.strokeStyle = '#f00'; c.beginPath(); c.arc(e.x, e.y, e.r, 0, TAU); c.stroke(); }
  };
  S.drawGhost = function (c) {
    var D = S.dying; if (!D || D.dt >= 3200) return;
    Assets.drawBoss('pastor', c, D.x, D.y, { t: G.time, facing: D.face, phase: D.phase, broken: D.broken, dying: true, dt: D.dt });
  };
  // elementos que se ordenan en profundidad con el resto (troncos, fantasma de la muerte)
  S.items = function (list) {
    for (var i = 0; i < S.obs.length; i++) { var o = S.obs[i]; if (!o.dead) list.push({ y: o.y + 8, draw: drawLog, o: o }); }
    if (S.dying && S.dying.dt < 3200) list.push({ y: S.dying.y + 88, draw: S.drawGhost });
  };
  function drawLog(c, it) {
    var o = it.o, cv = Assets.sprite('obs_log', 0), sh = o.shake > 0 ? (Math.random() * 2 - 1) * 2 : 0;
    c.drawImage(cv, Math.round(o.x - 32 + sh), Math.round(o.y - 40));
  }
  S.drawGround = function (c) {
    var i, e = S.e, t = G.time, cam = G.cam;
    for (i = 0; i < S.rubble.length; i++) { var rb = S.rubble[i]; c.drawImage(Assets.sprite('obs_log', 2), Math.round(rb.x - 32), Math.round(rb.y - 40)); }
    for (i = 0; i < S.briers.length; i++) {
      var b = S.briers[i], sp = Assets.sprite('fx_thorn_patch', [0, 1, 2, 1][Math.floor(b.t / 330) % 4]), w = b.r * 2.6, h = w * 0.7;
      c.drawImage(sp, Math.round(b.x - w / 2), Math.round(b.y - h * 0.68), w, h);
    }
    if (S.insetOn && S.inset > 1) drawInset(c);
    for (i = 0; i < S.spikes.length; i++) {
      var s = S.spikes[i], fr = s.t < 250 ? Math.floor(s.t / 85) : s.t > s.life - 300 ? 3 : 2;
      c.save(); c.globalAlpha = s.t > s.life - 300 ? (s.life - s.t) / 300 : 1;
      c.drawImage(Assets.sprite('fx_boss_spike', Math.min(3, fr)), Math.round(s.x - 14), Math.round(s.y - 42)); c.restore();
    }
    for (i = 0; i < S.waves.length; i++) drawWave(c, S.waves[i]);
    if (e && e.atk && e.atk.step !== 'rec') {
      var A = e.atk, H = ATK[A.name];
      if (H.draw && (A.step === 'tele' || A.name === 'estampida')) H.draw(c, e, A);
    }
  };
  function drawInset(c) {
    var m = G.WALL, band = S.inset, a = G.cam, i, n, fr;
    var pulse = 0.5 + 0.2 * Math.sin(G.time / 150);
    c.save();
    c.fillStyle = 'rgba(255,90,20,' + (0.18 * pulse + 0.1) + ')';
    c.fillRect(m, m, G.AW - 2 * m, band); c.fillRect(m, G.AH - m - band, G.AW - 2 * m, band); c.fillRect(m, m + band, band, G.AH - 2 * m - 2 * band); c.fillRect(G.AW - m - band, m + band, band, G.AH - 2 * m - 2 * band);
    var T = 44, sprOk = G.hasSpr('fx_fire_cell');
    function tile(x, y, k) { if (x + T < a.x || x > a.x + G.W || y + T < a.y || y > a.y + G.H) return; if (sprOk) c.drawImage(Assets.sprite('fx_fire_cell', Math.floor(G.time / 110 + k) % 3), Math.round(x), Math.round(y), T, T); }
    for (i = 0, n = Math.ceil((G.AW - 2 * m) / T); i < n; i++) { tile(m + i * T, m + band - T * 0.85, i); tile(m + i * T, G.AH - m - band - T * 0.15, i + 3); }
    for (i = 0, n = Math.ceil((G.AH - 2 * m) / T); i < n; i++) { tile(m + band - T * 0.85, m + i * T, i + 1); tile(G.AW - m - band - T * 0.15, m + i * T, i + 5); }
    c.restore();
  }

  // ================================================================= BOT / PRUEBAS: amenazas actuales
  S.hazards = function () {
    var out = [], e = S.e;
    if (e && !e.dead && e.atk && ATK[e.atk.name].haz) { ATK[e.atk.name].haz(e, e.atk, out); for (var j = 0; j < out.length; j++) out[j].ref = e.atk; }
    for (var i = 0; i < S.waves.length; i++) { var w = S.waves[i]; out.push({ ref: w.ref || w, k: 'wave', x: w.x, y: w.y, r: w.r, v: w.v, th: w.th, gaps: w.gaps, t0: Math.max(0, w.delay || 0), t1: (w.delay || 0) + Math.max(0, (w.maxR - w.r) / w.v * 1000), live: !(w.delay > 0) });
    }
    return out;
  };

  // ================================================================= DIRECTOR / PUERTAS DE EXTERIOR
  S.spawnMode = function () {
    var e = S.e; if (!e || e.dead) return null;
    if (e.mode === 'intro' || e.mode === 'gate' || e.mode === 'despair' || e.dying) return { mul: 0, allow: {}, cap: 0 };
    if (e.atk && e.atk.sig) return { mul: 0, allow: {}, cap: 0 };      // ataque firma (telegrafía + ejecución): pausa total
    return e.def.phases[e.phase - 1].spawn;
  };
  S.noHurtNow = function () { return S.noHurt > 0 || (S.intro && true); };

  // ================================================================= HUD
  var WEAKCOL = { fire: '#ff7a2a', steel: '#b8c0cc', poison: '#7be34a', ice: '#6ac8ff', lightning: '#ffe45a', blood: '#d02048' };
  var WEAKTXT = { fire: 'FUE', steel: 'ACE', poison: 'VEN', ice: 'HIE', lightning: 'RAY', blood: 'SAN' };
  var PARTSPR = { cuernos: 'trophy_pastor_horn', cayado: 'trophy_pastor_staff', vellon: 'trophy_pastor_fleece' };
  S.drawHud = function (c) {
    var e = S.e, W = G.W, H = G.H, I = S.intro;
    if (S.tint > 0.01) Assets.drawBossArenaTint(c, W, H, G.time, S.tint);
    if (S.sigP > 0.01) Assets.drawBossVignette(c, W, H, 0.5 + 0.5 * S.sigP * (S.sigP > 0.8 ? 1 + 0.3 * Math.sin(G.time / 40) : 1) * 1.6, '255,30,20');
    if (S.flash > 0) { c.fillStyle = 'rgba(255,255,255,' + Math.min(0.5, S.flash * 0.4) + ')'; c.fillRect(0, 0, W, H); }
    if (e && !e.dead && !e.dying) drawBar(c, e);
    if (I) drawIntro(c, e, I);
  };
  function drawBar(c, e) {
    var bw = 640, bh = 22, bx = (W() - bw) / 2, by = 52, D = e.def, fr = G.clamp(e.hp / e.maxHp, 0, 1), ex = S.expo(e), t = G.time;
    var fill = S.barFill == null ? 1 : S.barFill; if (e.mode === 'intro' && !(S.intro && S.intro.roared)) return;
    var ph = D.phases[e.phase - 1];
    // nombre y fase
    G.txt(c, D.name.toUpperCase(), bx, by - 11, 18, e.phase === 3 ? '#ff9a3c' : '#ffd27a', 'left');
    G.txt(c, 'Fase ' + ['I', 'II', 'III'][e.phase - 1] + ' - ' + (e.mode === 'despair' ? D.despair : ph.n), bx + bw, by - 11, 14, e.mode === 'despair' ? '#d090ff' : '#c8b8e8', 'right');
    // marco + fondo
    c.fillStyle = '#07040c'; c.fillRect(bx - 4, by - 4, bw + 8, bh + 8);
    c.fillStyle = '#2a1020'; c.fillRect(bx, by, bw, bh);
    var win = ex.mul > 1 && ex.kind !== 'stun' || ex.kind === 'stun';
    var col = e.phase === 1 ? '#c03a8a' : e.phase === 2 ? '#b02a50' : '#ff6a1a';
    if (e.mode === 'despair') col = '#9a40d0';
    // fantasma (daño reciente) y relleno
    c.fillStyle = '#ffe9d0'; c.fillRect(bx, by, bw * G.clamp(S.ghost, 0, 1) * fill, bh);
    c.fillStyle = (ex.mul > 1) ? (Math.floor(t / 120) % 2 ? '#ffd24a' : '#ffb82a') : col; c.fillRect(bx, by, bw * fr * fill, bh);
    c.fillStyle = 'rgba(255,255,255,0.2)'; c.fillRect(bx, by, bw * fr * fill, 6);
    // muescas de fase (65 % / 30 % / 8 %)
    var th = [D.phases[0].thr, D.phases[1].thr, D.despairAt], tc = ['#c8b8e8', '#ff9a3c', '#d090ff'];
    for (var i = 0; i < th.length; i++) {
      var passed = (i === 0 && e.phase > 1) || (i === 1 && e.phase > 2) || (i === 2 && e.despDone);
      c.fillStyle = passed ? 'rgba(80,70,90,0.9)' : tc[i]; c.fillRect(Math.round(bx + bw * th[i]) - 1, by - 3, 3, bh + 6);
    }
    c.strokeStyle = ex.mul > 1 ? '#ffd24a' : '#8a6a30'; c.lineWidth = 2; c.strokeRect(bx - 2, by - 2, bw + 4, bh + 4);
    if (e.immune && e.mode === 'gate') G.txt(c, 'INMUNE ' + Math.max(0, e.gateT / 1000).toFixed(1) + 's', bx + bw / 2, by + bh / 2, 14, '#bfeaff', 'center');
    if (e.mode !== 'gate') G.txt(c, Math.ceil(e.hp) + ' / ' + Math.round(e.maxHp), bx + bw / 2, by + bh / 2, 11, '#ffffff', 'center');
    // ventana de daño: arco fino que se acorta
    if (ex.mul > 1 && ex.max > 0) {
      var wf = G.clamp(ex.t / ex.max, 0, 1);
      c.fillStyle = 'rgba(255,210,58,0.9)'; c.fillRect(bx + bw / 2 - bw * 0.3 * wf, by + bh + 3, bw * 0.6 * wf, 3);
      G.txt(c, 'x' + ex.mul.toFixed(2).replace(/0$/, '') + ' ' + (ex.kind === 'stun' ? 'ATURDIDO' : ex.kind === 'derribo' ? 'DERRIBO' : ex.kind === 'despair' ? 'EXPUESTO' : 'VENTANA'), bx + bw / 2, by + bh + 14, 11, '#ffd24a', 'center');
    }
    // marcas de partes (bajo la barra, a la izquierda)
    var px = bx + 4, py = by + bh + 10, names = ['cuernos', 'cayado', 'vellon'];
    for (var j = 0; j < names.length; j++) {
      var k = names[j], pe = e.parts[k], broken = e.broken[k], x = px + j * 44;
      var sp = Assets.sprite(PARTSPR[k], broken ? 1 : 0);
      c.drawImage(sp, x, py, 16, 16);
      if (!broken) { var mf = G.clamp(pe.meter / pe.meterMax, 0, 1); c.fillStyle = '#1a0a12'; c.fillRect(x + 18, py + 5, 20, 5); c.fillStyle = pe.flash > 0 ? '#fff' : '#ffb347'; c.fillRect(x + 19, py + 6, 18 * mf, 3); }
      else { c.strokeStyle = '#ff3030'; c.lineWidth = 2; c.beginPath(); c.moveTo(x - 1, py + 1); c.lineTo(x + 17, py + 15); c.moveTo(x + 17, py + 1); c.lineTo(x - 1, py + 15); c.stroke(); }
    }
    // debilidades / resistencias (bajo la barra, a la derecha)
    var items = [], k2;
    D.weak.forEach(function (w) { items.push({ tag: w.tag, weak: true, on: w.phases.indexOf(e.phase) >= 0, mul: w.mul }); });
    D.resist.forEach(function (r) { items.push({ tag: r.tag, weak: false, on: true, mul: r.mul }); });
    var rx = bx + bw - items.length * 52;
    for (k2 = 0; k2 < items.length; k2++) {
      var it = items[k2], xx = rx + k2 * 52;
      c.save(); c.globalAlpha = it.on ? 1 : 0.35;
      c.fillStyle = it.weak ? WEAKCOL[it.tag] : '#6a6a78'; c.fillRect(xx, py, 22, 16);
      c.strokeStyle = '#0c0814'; c.lineWidth = 1.5; c.strokeRect(xx + 0.5, py + 0.5, 21, 15);
      G.txt(c, WEAKTXT[it.tag], xx + 11, py + 8, 9, it.weak ? '#1a0a00' : '#e8e8f0', 'center', 'rgba(0,0,0,0)');
      var ic = Assets.sprite(it.weak ? 'icon_weak' : 'icon_resist', 0); c.drawImage(ic, xx + 24, py + 2, 12, 12);
      G.txt(c, 'x' + it.mul, xx + 38, py + 22, 9, it.weak ? '#9dffb4' : '#9a9aa8', 'left');
      c.restore();
    }
  }
  function W() { return G.W; }
  function drawIntro(c, e, I) {
    var t = I.t, Wd = G.W, Hd = G.H, bar = 48;
    var inB = G.clamp(t / 300, 0, 1), outB = t > 2400 ? G.clamp((t - 2400) / 400, 0, 1) : 0, b = bar * (ease(inB) * (1 - ease(outB)));
    c.fillStyle = '#000'; c.fillRect(0, 0, Wd, b); c.fillRect(0, Hd - b, Wd, b);
    if (t >= 800 && t < 2600) {
      var u = G.clamp((t - 800) / 350, 0, 1), fade = t > 2200 ? 1 - (t - 2200) / 400 : 1, D = e.def;
      c.save(); c.globalAlpha = G.clamp(fade, 0, 1);
      var wBar = 520 * ease(u), cy = 142;
      c.fillStyle = 'rgba(6,2,10,0.82)'; c.fillRect(Wd / 2 - wBar / 2, cy - 44, wBar, 92);
      c.fillStyle = '#c8941a'; c.fillRect(Wd / 2 - wBar / 2, cy - 44, wBar, 2); c.fillRect(Wd / 2 - wBar / 2, cy + 46, wBar, 2);
      if (u > 0.6) {
        Assets.drawBossPortrait(D.id, c, Wd / 2 - 250, cy - 40, { size: 80, mood: t > 1800 ? 1 : 0 });
        G.txt(c, D.name.toUpperCase(), Wd / 2 + 40, cy - 14, 28, '#ffd27a', 'center');
        G.txt(c, D.name + ' - ' + D.title, Wd / 2 + 40, cy + 22, 14, '#d8cfe8', 'center');
      }
      c.restore();
    }
    if (I.seen && t > 1000 && t < 3400) G.txt(c, 'Pulsa para saltar', Wd - 20, Hd - b - 12, 11, '#9a8fb0', 'right');
  }
  S.hudBars = function () { return 0; };

  // ================================================================= UTILIDAD PARA DEPURAR
  S.info = function () {
    var e = S.e; if (!e) return null;
    return { mode: e.mode, phase: e.phase, hp: Math.round(e.hp), maxHp: Math.round(e.maxHp), atk: e.atk && e.atk.name, step: e.atk && e.atk.step, broken: e.broken, fury: S.fury,
      adds: addsAlive(), combatT: Math.round(S.combatT), bst: e.bst, x: Math.round(e.x), y: Math.round(e.y), exp: S.expo(e).mul };
  };
  S.normalsAlive = normalsAlive;
})();
