/* boss_karceron.js - Jefes v4 (fase J2): KARCERON, EL CARCELERO DE BRASA (cripta). DESIGN-v4-jefes.md 3.3.
   Coloso de huesos y magma casi inmóvil: se arrastra entre 3 anclajes a 25 px/s y la arena se juega a su alrededor.
   Arena: 4 pilares de hueso (cobertura contra proyectiles; sus brazos los rompen y se reconstruyen a los 40 s), 2 charcos de lava fijos, borde de lava en la
   fase 2 (margen 100 px), Marea de lava en la fase 3 y 3 islas de piedra seguras. Ataques: Martillazo, Barrido de grilletes, Lluvia de brasas, Aliento de magma,
   Estallido de costillas, Erupción del núcleo (ventana de pecho abierto), Penitentes, Marea de lava, Muñón (con el brazo-maza roto). Ataque desesperado: Réquiem de Fuego.
   Se engancha al motor genérico de boss.js (DEFS[id].h = ganchos) y reutiliza sus utilidades (G.Boss.u). El arte final lo pone assets_boss2.js; aquí hay un dibujo de
   reserva por código (drawK) que se usa mientras Assets.bossIds() no incluya 'karceron'. */
(function () {
  'use strict';
  var G = window.G, S = G.Boss, fx = G.fx, E = G.Enemies, U = S && S.u;
  if (!S || !U) return;
  var ATKS = S.ATKS, ATK = S.ATK, TAU = Math.PI * 2, DEG = Math.PI / 180;
  var ease = U.ease, angTo = U.angTo, sfx = U.sfx, hurt = U.hurt, pel = U.pel, expose = U.expose;
  function PL() { return G.player; }
  function A() { return S.A; }
  function ART() { try { return !!(Assets.drawBossBand && Assets.bossIds().indexOf('karceron') >= 0 && G.hasSpr('boss_karceron_torso')); } catch (x) { return false; } }   // arte de assets_boss2.js disponible

  // ------------------------------------------------------------------ geometría de la arena (1440 x 810)
  var ANCH = [[720, 262], [540, 290], [900, 290]];                      // anclajes del cuerpo
  var ISLANDS = [[300, 340], [1140, 340], [720, 500]], ISL_R = 120;     // islas seguras (cualquier punto jugable queda a < 280 px de borde de isla: ver README)
  var PILLARS = [[500, 470], [940, 470], [330, 610], [1110, 610]];      // pilares de hueso (r 30)
  var POOLS = [[470, 620], [970, 620]];                                 // charcos de lava fijos (r 70)
  var MAREA_SAFE = 165;                                                 // radio seguro alrededor del centro de cada isla en la Marea (~60 % de la arena inundada)
  S.K_ISLANDS = ISLANDS; S.K_ISL_R = ISL_R;

  S.DEFS.karceron = {
    id: 'karceron', name: 'Karceron, el Carcelero de Brasa', title: 'Coloso de Huesos y Magma', short: 'DE KARCERON', furia: 'DE KARCERON', hp: 7500, r: 90, gy: (window.Assets && Assets.BOSS && Assets.BOSS.karceron) ? Assets.BOSS.karceron.gy : 96,
    phases: [
      { n: 'Despertar',     thr: 0.65, cad: 3000, spd: 25, music: 0.55, spawn: { mul: 0.25, allow: { worm: 1, archer: 1, bomb: 1 }, cap: 15 } },
      { n: 'La Fragua',     thr: 0.30, cad: 2400, spd: 25, music: 0.78, spawn: { mul: 0.25, allow: { worm: 1, archer: 1, fanner: 1 }, cap: 15 } },
      { n: 'Marea de lava', thr: 0,    cad: 2000, spd: 25, music: 1.0,  spawn: { mul: 0, allow: {}, cap: 0 } }
    ],
    despairAt: 0.08, despair: 'Réquiem de Fuego',
    barCol: ['#d8741a', '#e0501a', '#ff8a1a'],
    parts: {
      maza:     { name: 'Brazo-Maza',      pct: 0.10, hz: 1.15, trophy: 'mace',    r: 36 },
      grillete: { name: 'Brazo-Grillete',  pct: 0.09, hz: 1.15, trophy: 'shackle', r: 36 },
      nucleo:   { name: 'Núcleo de Lava',  pct: 0.08, hz: 1.0,  trophy: 'core',    r: 34, derr: { mul: 1.5, ms: 5000 }, stag: 0 }
    },
    weak: [{ tag: 'ice', mul: 1.25, phases: [1, 2] }, { tag: 'lightning', mul: 1.25, phases: [3] }],
    resist: [{ tag: 'fire', mul: 0.6 }, { tag: 'poison', mul: 0.5 }],
    hpCal: 2.6, // calibrado con el bot (README, Jefes v4 J2): 7500 x 2,6 = 19500 a 9 min; p50 aislado ~115 s, partida completa (con horda) ~135 s. Karceron resiste Fuego x0,6 y Veneno x0,5 y las manos de prueba (Chispa/Dardo) los usan: con Hielo/Rayo cae mucho antes
    brasas: 13, brasasPart: 4, pf: 2, pfFirst: 3,
    guaranteed: { plate: 2, wick: 2, static: 1 },
    h: { camW: 0.75 }
  };
  var D = S.DEFS.karceron, H = D.h;
  [['mace', 'trophy_karceron_mace', 'Nudillo de Magma'], ['shackle', 'trophy_karceron_shackle', 'Grillete Ardiente'], ['core', 'trophy_karceron_core', 'Núcleo Latente']].forEach(function (t) {
    Object.defineProperty(S.TROPHY, t[0], { enumerable: true, configurable: true, get: function () { return { spr: G.hasSpr(t[1]) ? t[1] : 'trophy_pastor_horn', name: t[2] }; } });
  });

  // ------------------------------------------------------------------ utilidades de arena
  function clampX(x, m) { return G.clamp(x, G.WALL + (m || 30), G.AW - G.WALL - (m || 30)); }
  function clampY(y, m) { return G.clamp(y, G.WALL + (m || 30), G.AH - G.WALL - (m || 30)); }
  function blockedByPillar(ox, oy, p) {   // ¿hay un pilar entre (ox,oy) y el jugador? (cobertura contra cono / aliento)
    for (var i = 0; i < S.obs.length; i++) {
      var o = S.obs[i]; if (o.dead || o.kind !== 'bone') continue;
      var dx = p.x - ox, dy = p.y - oy, l2 = dx * dx + dy * dy, t = l2 ? G.clamp(((o.x - ox) * dx + (o.y - oy) * dy) / l2, 0, 1) : 0;
      if (Math.hypot(ox + dx * t - o.x, oy + dy * t - o.y) < o.r + 4) return true;
    }
    return false;
  }
  function breakPillar(o) {
    if (o.dead) return;
    o.dead = true; o.deadAt = G.time; o.warn = false;
    fx.puff(o.x, o.y, 3); fx.dust(o.x, o.y, 8); fx.burst(o.x, o.y, 12, '#d8cfae', 200, 600, 4, { g: 260 }); fx.shake(5, 150); sfx('explosion', { pitch: 1.1, vol: 0.5 });
    A().rub.push({ x: o.x, y: o.y, t: G.time });
  }
  function pillarsInArc(e, cx, cy, r0, r1, a, arc, fn) {
    for (var i = 0; i < S.obs.length; i++) {
      var o = S.obs[i]; if (o.dead || o.kind !== 'bone') continue;
      var d = Math.hypot(o.x - cx, o.y - cy);
      if (d + o.r >= r0 && d - o.r <= r1 && (arc >= TAU - 0.01 || Math.abs(G.angDiff(Math.atan2(o.y - cy, o.x - cx), a)) <= arc / 2 + 0.25)) fn(o);
    }
  }
  function nearestIsland(x, y) {
    var b = 0, bd = 1e9;
    for (var i = 0; i < ISLANDS.length; i++) { var d = Math.hypot(x - ISLANDS[i][0], y - ISLANDS[i][1]); if (d < bd) { bd = d; b = i; } }
    return b;
  }
  function inSafe(x, y, R) {
    for (var i = 0; i < ISLANDS.length; i++) if (Math.hypot(x - ISLANDS[i][0], y - ISLANDS[i][1]) <= R) return true;
    return false;
  }
  function floodR() { var a = A(); return a.flood.req ? a.islR : MAREA_SAFE; }
  function setChest(e, open) {
    var a = A(), core = e.parts.nucleo; a.open = open;
    if (core && !core.dead) core.spawnT = open ? 0 : 99999;   // el Núcleo solo se puede apuntar con el pecho abierto
  }
  function gemTrophyOnce() { /* los trofeos los suelta el motor al romper cada parte */ }

  // ------------------------------------------------------------------ ganchos del motor
  H.pos = function () { return { x: ANCH[0][0], y: ANCH[0][1] }; };
  H.setup = function (e, p) {
    var a = A();
    a.margin = 0; a.marginTo = 0; a.lava = POOLS.map(function (q) { return { x: q[0], y: q[1], r: 70, t: Math.random() * 2000 }; });
    a.puddles = []; a.rain = []; a.rub = []; a.cracks = []; a.mace = null; a.open = false; a.ai = 0; a.moveWait = 4000; a.tk = 0; a.islR = ISL_R; a.islShow = 0;
    a.flood = { state: 'off', t: 0, dur: 0, req: false };
    PILLARS.forEach(function (q) { S.obs.push({ x: q[0], y: q[1], r: 30, hp: 300, dead: false, shake: 0, sortY: q[1] + 6, kind: 'bone', draw: drawPillar }); });
    e.cadMul = 1; e.rise = 0; e.foot = D.gy;
    e.parts.nucleo.spawnT = 99999;
    S.cds.k_marea = 3000;
  };
  var POSE = { k_martillo: 'martillazo', k_munon: 'martillazo', k_grilletes: 'barrido', k_brasas: 'brasas', k_aliento: 'aliento', k_costillas: 'costillas', k_erupcion: 'erupcion', k_penitentes: 'penitentes', k_marea: 'marea' };
  function artStateK(e) {   // estado para Assets.drawBoss('karceron') (contrato en ASSETS_API.md, Jefes v4 J2)
    var A0 = e.atk, a = A(), ex = S.expo(e), p = PL(), st = { t: G.time, phase: e.phase, facing: p.x >= e.x ? 1 : -1, hurt: e.hurtT > 0 ? 0.6 : 0, enraged: S.fury > 1, desperate: e.mode === 'despair',
      exposed: ex.mul > 1 && ex.kind !== 'stun' && ex.kind !== 'derribo', stun: ex.kind === 'derribo' || ex.kind === 'stun' || e.stagT > 0, immune: e.immune && e.mode !== 'intro' && !e.dying,
      roar: e.roar || 0, alpha: e.alpha == null ? 1 : e.alpha, broken: e.broken, open: a.openU || 0, sunk: a.sunk || 0, emerge: e.rise == null ? 1 : e.rise, hungry: e.cadMul > 1,
      moving: e.moveAmt > 0, speed: e.curSpd || 0 };
    if (a.mace) { st.tx = a.mace.x - e.x; st.ty = a.mace.y - e.y; st.stuck = true; }
    if (A0) {
      var nm = POSE[A0.name]; st.aim = A0.name === 'k_aliento' && A0.step === 'act' ? A0.ang : (A0.aim != null ? A0.aim : A0.a0);
      if (A0.name === 'k_martillo') { st.tx = A0.tx - e.x; st.ty = A0.ty - e.y; st.stuck = A0.step === 'rec'; }
      if (A0.name === 'k_munon') { st.tx = Math.cos(A0.aim) * 190; st.ty = Math.sin(A0.aim) * 190; }
      if (A0.step === 'tele') { st.windup = nm; st.wp = G.clamp(A0.t / A0.tele, 0, 0.999); }
      else if (A0.step === 'act') { st.strike = nm; st.sp = G.clamp(A0.t / (A0.name === 'k_brasas' ? 1300 : A0.name === 'k_erupcion' ? 700 : (A0.actMs || 400)), 0, 0.999); }
    }
    return st;
  }
  H.anchors = function (e) {
    var a = A(), m = a.mace;
    if (ART()) {
      var an = Assets.bossAnchors('karceron', artStateK(e));
      return { maza: m ? { x: m.x - e.x, y: m.y - e.y, r: 34 } : { x: an.maza.x, y: an.maza.y, r: 36 }, grillete: { x: an.grillete.x, y: an.grillete.y, r: 36 }, nucleo: { x: an.nucleo.x, y: an.nucleo.y, r: 34 } };
    }
    return {
      maza: m ? { x: m.x - e.x, y: m.y - e.y, r: 34 } : { x: 138, y: 34, r: 36 },
      grillete: { x: -138, y: 34, r: 36 },
      nucleo: { x: 0, y: -8, r: 34 }
    };
  };
  H.move = function (e, dt) {   // se arrastra entre sus 3 anclajes
    var a = A(), t = ANCH[a.ai], d = Math.hypot(t[0] - e.x, t[1] - e.y), p = PL();
    e.moveAmt = 0; e.face = p.x >= e.x ? 1 : -1;
    a.moveWait -= dt;
    if (a.moveWait > 0) return;
    if (d < 3) { var n; do { n = Math.floor(Math.random() * 3); } while (n === a.ai); a.ai = n; a.moveWait = 6500; return; }
    var st = Math.min(d, 25 * dt / 1000);
    e.x += (t[0] - e.x) / d * st; e.y += (t[1] - e.y) / d * st; e.moveAmt = 1; e.curSpd = 25;
  };
  H.okNow = function (e, name, d) {
    var fl = A().flood.state !== 'off';
    if (fl && name !== 'k_martillo' && name !== 'k_costillas' && name !== 'k_munon') return false;   // durante la Marea solo ataques que se esquivan desde una isla
    switch (name) {
      case 'k_martillo': return d < 700;
      case 'k_munon': return d < 420;
      case 'k_grilletes': return d < 470;
      case 'k_aliento': return d > 150 && d < 560;
      case 'k_costillas': return true;
      case 'k_erupcion': return !fl;
      case 'k_marea': return A().flood.state === 'off';
      default: return true;
    }
  };
  H.keepAtk = function () { return false; };
  H.afterAtk = function (e, A0) { if (A0.name === 'k_martillo') A().mace = null; };
  H.clear = function (e) {
    var a = A(); a.mace = null; a.rain.length = 0; a.puddles.length = 0;
    a.flood = { state: 'off', t: 0, dur: 0, req: false }; a.islR = ISL_R;
    if (a.open) { setChest(e, false); e.exps = e.exps.filter(function (x) { return x.kind !== 'window'; }); }
  };
  H.onGate = function (e) {
    var a = A();
    if (e.phase === 2) { a.marginTo = 100; G.Hud.banner('LA LAVA SUBE POR LOS BORDES', 2200, '#ff8a2a'); }
    if (e.phase === 3) { S.cds.k_marea = 4000; a.islShow = 1; G.Hud.banner('LAS ISLAS EMERGEN', 2200, '#ffe45a'); }
  };
  H.onBreak = function (e, pe) {
    var a = A(), k = pe.key;
    if (k === 'maza') {
      var m = a.mace; a.mace = null;
      var mx = m ? m.x : e.x + 150, my = m ? m.y : e.y + 60;
      S.obs.push({ x: mx, y: my, r: 30, hp: 99999, dead: false, shake: 0, sortY: my + 6, kind: 'arm', draw: drawFallenArm });   // el brazo cae y forma cobertura
      S.obs.forEach(function (o) { if (o.kind === 'arm') S.pushOutOne(o, PL(), PL().r); });
      fx.dust(mx, my, 12); fx.shake(7, 220);
    } else if (k === 'grillete') {
      a.lava.push({ x: e.x - 150, y: e.y + 70, r: 45, t: 0, fresh: true });   // cae una zona de lava pequeña bajo el brazo
      fx.burst(e.x - 150, e.y + 70, 14, '#ff6a1a', 200, 600, 4, { add: true });
    } else if (k === 'nucleo') {
      setChest(e, false); e.exps = e.exps.filter(function (x) { return x.kind !== 'window' && x.kind !== 'despair'; });
      e.cadMul = 1.2;   // modo hambriento: +20 % cadencia
      G.Hud.banner('¡MODO HAMBRIENTO!', 1800, '#ff5a2a'); fx.shake(9, 300);
    }
  };
  H.bodyHit = function (e, full) {   // con el pecho abierto el daño al torso va al Núcleo
    var a = A(), core = e.parts.nucleo;
    if (!a.open || core.dead) return;
    core.meter -= full; core.flash = 80;
    if (core.meter <= 0 && !core.dead) S.breakPart(e, core);
  };

  // ------------------------------------------------------------------ arena viva (lava, pilares, marea, lluvia)
  H.tick = function (e, dt) {
    var a = A(), p = PL(), i, fl = a.flood;
    if (a.mace && !(e.atk && e.atk.name === 'k_martillo')) a.mace = null;   // la maza se libera si el ataque se interrumpe
    // pilares: reconstrucción a los 40 s con aviso
    for (i = 0; i < S.obs.length; i++) {
      var o = S.obs[i]; if (o.kind !== 'bone') continue;
      if (o.dead) {
        var age = G.time - o.deadAt; o.warn = age > 38500;
        if (age >= 40000) { o.dead = false; o.warn = false; S.pushOutOne(o, p, p.r); fx.puff(o.x, o.y, 2); fx.dust(o.x, o.y, 8); sfx('hit_heavy', { pitch: 0.6, vol: 0.4 }); }
      }
    }
    if (a.margin < a.marginTo) a.margin = Math.min(a.marginTo, a.margin + 40 * dt / 1000);
    a.openU = (a.openU || 0) + ((a.open ? 1 : 0) - (a.openU || 0)) * Math.min(1, dt / 160);
    a.sunk = e.mode === 'despair' ? 0.5 * (e.despT < 1500 ? ease(e.despT / 700) : 1 - ease((e.despT - 1500) / 700)) : 0;
    a.tk -= dt;
    for (i = 0; i < a.lava.length; i++) a.lava[i].t += dt;
    for (i = a.puddles.length - 1; i >= 0; i--) { a.puddles[i].t += dt; if (a.puddles[i].t > a.puddles[i].life) a.puddles.splice(i, 1); }
    for (i = a.cracks.length - 1; i >= 0; i--) if (G.time - a.cracks[i].t > 2000) a.cracks.splice(i, 1);
    // Marea de lava
    if (fl.state !== 'off') {
      fl.t += dt;
      if (fl.state === 'tele' && fl.t >= 2000) { fl.state = 'on'; fl.t = 0; fx.shake(8, 400); sfx('shockwave', { vol: 0.8, pitch: 0.7 }); }
      else if (fl.state === 'on' && !fl.req && fl.t >= fl.dur) { fl.state = 'off'; fl.t = 0; }
    }
    if (a.islShow < 1 && e.phase >= 3) a.islShow = 1;
    // daño del suelo
    if (!p.dead && S.noHurt <= 0 && a.tk <= 0 && !S.intro) {
      var dmg = 0, src = '';
      for (i = 0; i < a.lava.length; i++) if (Math.hypot(a.lava[i].x - p.x, a.lava[i].y - p.y) < a.lava[i].r + p.r * 0.2) { dmg = 10; src = 'boss_lava'; }
      for (i = 0; i < a.puddles.length; i++) if (Math.hypot(a.puddles[i].x - p.x, a.puddles[i].y - p.y) < a.puddles[i].r + p.r * 0.2) { dmg = Math.max(dmg, 6); src = src || 'boss_brasa_charco'; }
      var mg = G.WALL + a.margin;
      if (a.margin > 6 && (p.x < mg || p.x > G.AW - mg || p.y < mg || p.y > G.AH - mg) && a.margin >= 30) { dmg = Math.max(dmg, 10); src = 'boss_borde_lava'; }
      if (fl.state === 'on' && !inSafe(p.x, p.y, floodR())) { dmg = Math.max(dmg, 12); src = 'boss_marea'; }
      if (dmg) { a.tk = 400; hurt(e, dmg, src, { soft: true }); }
    }
    // lluvia de brasas independiente (Réquiem)
    for (i = a.rain.length - 1; i >= 0; i--) {
      var m = a.rain[i]; m.t += dt;
      if (m.t >= m.imp) { impact(e, m); a.rain.splice(i, 1); }
    }
  };
  function impact(e, m) {   // un meteoro cae
    var p = PL(), a = A();
    fx.part('explosion', m.x, m.y, 0, 0, 380, { sc: 1.2, add: true, anim: true }); fx.shockwave(m.x, m.y, m.r * 2);
    if (G.hasSpr('fx_lava_splash')) fx.part('fx_lava_splash', m.x, m.y - 10, 0, 0, 400, { sc: m.r / 30, anim: true }); fx.shake(4, 140); sfx('explosion', { vol: 0.5, pitch: 1.1 });
    fx.burst(m.x, m.y, 8, '#ffb040', 220, 500, 4, { add: true });
    if (!p.dead && Math.hypot(p.x - m.x, p.y - m.y) <= m.r + 2) hurt(e, m.dmg, 'boss_brasas', { kb: 1.1 });
    if (m.puddles) a.puddles.push({ x: m.x, y: m.y, r: 26, t: 0, life: 3000 });
  }

  // ------------------------------------------------------------------ ataques
  function def(name, o) { o.b = 'karceron'; ATKS[name] = o; }
  def('k_martillo',   { name: 'Martillazo de cadenas',  tele: 900,  cd: 6000,  dmg: 28, phases: [1, 2, 3], sig: true });
  def('k_munon',      { name: 'Barrido con muñón',      tele: 800,  cd: 6000,  dmg: 22, phases: [1, 2, 3] });
  def('k_grilletes',  { name: 'Barrido de grilletes',   tele: 1000, cd: 9000,  dmg: 26, phases: [1, 2, 3], sig: true });
  def('k_brasas',     { name: 'Lluvia de brasas',       tele: 900,  cd: 7000,  dmg: 18, phases: [1, 2, 3] });
  def('k_aliento',    { name: 'Aliento de magma',       tele: 1100, cd: 12000, dmg: 8,  phases: [2, 3] });
  def('k_costillas',  { name: 'Estallido de costillas', tele: 700,  cd: 8000,  dmg: 12, phases: [1, 2, 3] });
  def('k_erupcion',   { name: 'Erupción del núcleo',    tele: 1200, cd: 20000, dmg: 20, phases: [1, 2, 3], sig: true });
  def('k_penitentes', { name: 'Liberar Penitentes',     tele: 800,  cd: 18000, dmg: 0,  phases: [2, 3] });
  def('k_marea',      { name: 'Marea de lava',          tele: 2000, cd: 25000, dmg: 12, phases: [3], cdMul: function () { return pel().regrow ? 0.8 : 1; } });

  // ---- Martillazo de cadenas
  ATK.k_martillo = {
    avail: function (e) { return !e.broken.maza; },
    start: function (e, A0) { var p = PL(); A0.tx = clampX(p.x); A0.ty = clampY(p.y); A0.r = 90; A0.pose = 'martillo'; A0.actMs = 300; A0.rec = 1200; },
    tele: function (e, A0) { e.face = A0.tx >= e.x ? 1 : -1; },
    go: function (e, A0) {
      var p = PL(), a = A();
      fx.shake(8, 220); fx.hit(40); sfx('hit_heavy', { pitch: 0.55, vol: 0.9 }); sfx('explosion', { pitch: 0.8, vol: 0.6 });
      fx.dust(A0.tx, A0.ty, 12); fx.shockwave(A0.tx, A0.ty, 200); if (G.hasSpr('fx_lava_splash')) fx.part('fx_lava_splash', A0.tx, A0.ty - 10, 0, 0, 450, { sc: 3.2, anim: true }); fx.burst(A0.tx, A0.ty, 10, '#ff8a2a', 200, 500, 4, { add: true });
      a.cracks.push({ x: A0.tx, y: A0.ty, t: G.time, r: A0.r }); a.mace = { x: A0.tx, y: A0.ty };
      if (!p.dead && Math.hypot(p.x - A0.tx, p.y - A0.ty) <= A0.r) hurt(e, A0.def.dmg, 'boss_martillo', { kb: 1.5 });
      pillarsInArc(e, A0.tx, A0.ty, 0, A0.r + 30, 0, TAU, breakPillar);
      expose(e, 1.25, 1200, 'window');
    },
    act: function (e, A0) { return A0.t >= A0.actMs; },
    draw: function (c, e, A0) { Assets.drawBossTele(c, ART() ? 'mace' : 'circle', A0.tx, A0.ty, { r: A0.r, p: A0.t / A0.tele, sig: true, t: G.time }); },
    haz: function (e, A0, out) { if (A0.step === 'tele') out.push({ k: 'circle', x: A0.tx, y: A0.ty, r: A0.r, t0: A0.tele - A0.t, t1: A0.tele - A0.t + 150 }); }
  };

  // ---- Barrido con muñón (el brazo-maza roto)
  ATK.k_munon = {
    avail: function (e) { return e.broken.maza; },
    start: function (e, A0) { A0.aim = angTo(e, PL()); A0.reach = 200; A0.inner = 90; A0.arc = 120 * DEG; A0.pose = 'munon'; A0.actMs = 300; A0.rec = 700; },
    tele: function (e, A0) { if (A0.t < A0.tele * 0.6) A0.aim = angTo(e, PL()); },
    go: function (e, A0) {
      var p = PL(), d = Math.hypot(p.x - e.x, p.y - e.y);
      fx.shake(6, 180); sfx('hit_heavy', { vol: 0.8, pitch: 0.7 }); fx.slash(e.x, e.y, A0.aim, 5, '#ff7a3a');
      if (!p.dead && d <= A0.reach + p.r * 0.5 && d >= A0.inner && Math.abs(G.angDiff(angTo(e, p), A0.aim)) <= A0.arc / 2) hurt(e, 22, 'boss_munon', { kb: 1.3 });
      pillarsInArc(e, e.x, e.y, A0.inner, A0.reach, A0.aim, A0.arc, breakPillar);
    },
    act: function (e, A0) { return A0.t >= A0.actMs; },
    draw: function (c, e, A0) { Assets.drawBossTele(c, 'arc', e.x, e.y, { r: A0.reach, inner: A0.inner, arc: A0.arc, a: A0.aim, p: A0.t / A0.tele, fix: A0.t >= A0.tele * 0.6, t: G.time }); },
    haz: function (e, A0, out) { if (A0.step === 'tele') out.push({ k: 'arc', x: e.x, y: e.y, r: A0.reach, inner: A0.inner, a: A0.aim, arc: A0.arc, t0: A0.tele - A0.t, t1: A0.tele - A0.t + 150 }); }
  };

  // ---- Barrido de grilletes: rosquilla (zona segura interior pegado al torso y exterior)
  ATK.k_grilletes = {
    avail: function (e) { return !e.broken.grillete; },
    start: function (e, A0) { A0.aim = angTo(e, PL()); A0.inner = 110; A0.outer = 340; A0.arc = 140 * DEG; A0.pose = 'grilletes'; A0.actMs = 450; A0.rec = 700; },
    tele: function (e, A0) { if (A0.t < A0.tele * 0.6) A0.aim = angTo(e, PL()); e.face = Math.cos(A0.aim) >= 0 ? 1 : -1; },
    go: function (e, A0) {
      var p = PL(), d = Math.hypot(p.x - e.x, p.y - e.y);
      fx.shake(8, 240); sfx('hit_heavy', { pitch: 0.6, vol: 0.9 }); sfx('whoosh', { pitch: 0.5, vol: 0.7 });
      fx.slash(e.x, e.y, A0.aim, 8, '#ff6a2a'); fx.ring(e.x, e.y, A0.inner, A0.outer, 350, '#ffcf7a', 5);
      if (!p.dead && d >= A0.inner && d <= A0.outer + p.r * 0.5 && Math.abs(G.angDiff(angTo(e, p), A0.aim)) <= A0.arc / 2) hurt(e, A0.def.dmg, 'boss_grilletes', { kb: 1.5 });
      pillarsInArc(e, e.x, e.y, A0.inner, A0.outer, A0.aim, A0.arc, breakPillar);
    },
    act: function (e, A0) { return A0.t >= A0.actMs; },
    draw: function (c, e, A0) { Assets.drawBossTele(c, 'arc', e.x, e.y, { r: A0.outer, inner: A0.inner, arc: A0.arc, a: A0.aim, p: A0.t / A0.tele, fix: A0.t >= A0.tele * 0.6, sig: true, t: G.time }); },
    haz: function (e, A0, out) { if (A0.step === 'tele') out.push({ k: 'arc', x: e.x, y: e.y, r: A0.outer, inner: A0.inner, a: A0.aim, arc: A0.arc, t0: A0.tele - A0.t, t1: A0.tele - A0.t + 150 }); }
  };

  // ---- Lluvia de brasas: 6 meteoros escalonados cada 250 ms (3 sobre el jugador y su trayectoria, 3 al azar), telegrafía de 900 ms por impacto
  function metTick(e, A0, dt) {
    var p = PL(), i, m;
    if (A0.pp) { A0.vx = (p.x - A0.pp.x) / Math.max(1, dt) * 1000; A0.vy = (p.y - A0.pp.y) / Math.max(1, dt) * 1000; }
    A0.pp = { x: p.x, y: p.y }; A0.abs += dt;
    for (i = 0; i < A0.mets.length; i++) {
      m = A0.mets[i];
      if (m.st === 0 && A0.abs >= m.at) {
        m.st = 1;
        if (i < A0.nAim) { m.x = clampX(p.x + (A0.vx || 0) * 0.45 + G.rnd(-14, 14)); m.y = clampY(p.y + (A0.vy || 0) * 0.45 + G.rnd(-14, 14)); }
        else { var an = Math.random() * TAU, dd = G.rnd(70, 300); m.x = clampX(p.x + Math.cos(an) * dd); m.y = clampY(p.y + Math.sin(an) * dd); }
        m.imp = A0.abs + 900;
      }
      if (m.st === 1 && A0.abs >= m.imp) { m.st = 2; impact(e, { x: m.x, y: m.y, r: 55, dmg: 18, puddles: i < 2 }); }   // deja 2 charcos de brasas en total (los de los 2 primeros impactos)
    }
  }
  ATK.k_brasas = {
    start: function (e, A0) {
      var n = pel().mets || 6; A0.pose = 'brasas'; A0.rec = 500; A0.drawAct = true; A0.mets = []; A0.nAim = Math.round(n / 2);
      for (var i = 0; i < n; i++) A0.mets.push({ at: i * 250, st: 0, x: 0, y: 0, imp: 0 });
      A0.lastAt = (n - 1) * 250 + 900 + 80;
    },
    tele: function (e, A0, dt) { metTick(e, A0, dt); },
    go: function (e, A0) { sfx('wave_start', { pitch: 0.6, vol: 0.5 }); },
    act: function (e, A0, dt) { metTick(e, A0, dt); return A0.abs >= A0.lastAt; },
    draw: function (c, e, A0) {
      for (var i = 0; i < A0.mets.length; i++) { var m = A0.mets[i]; if (m.st !== 1) continue; Assets.drawBossTele(c, ART() ? 'meteor' : 'circle', m.x, m.y, { r: 55, p: G.clamp(1 - (m.imp - A0.abs) / 900, 0, 1), color: 'orange', t: G.time }); }
    },
    haz: function (e, A0, out) {
      for (var i = 0; i < A0.mets.length; i++) { var m = A0.mets[i]; if (m.st === 1) out.push({ k: 'circle', x: m.x, y: m.y, r: 55, t0: m.imp - A0.abs, t1: m.imp - A0.abs + 150 }); }
    }
  };

  // ---- Aliento de magma: cono de 50 grados que barre 40 grados a 30 grados/s; los pilares lo bloquean
  ATK.k_aliento = {
    start: function (e, A0) {
      A0.a0 = angTo(e, PL()); A0.sgn = Math.random() < 0.5 ? -1 : 1; A0.sweep = 40 * DEG; A0.half = 25 * DEG; A0.reach = 560; A0.pose = 'aliento'; A0.actMs = 1330; A0.rec = 700; A0.drawAct = true; A0.tk = 0; A0.ang = A0.a0;
    },
    tele: function (e, A0) { if (A0.t < A0.tele * 0.45) { A0.a0 = angTo(e, PL()); A0.ang = A0.a0; } e.face = Math.cos(A0.a0) >= 0 ? 1 : -1; },
    go: function (e, A0) { sfx('flame', { vol: 0.7, pitch: 0.7 }); fx.shake(3, 200); },
    act: function (e, A0, dt) {
      var p = PL();
      A0.ang = A0.a0 + A0.sgn * A0.sweep * G.clamp(A0.t / A0.actMs, 0, 1);
      var ox = e.x + Math.cos(A0.ang) * 70, oy = e.y + Math.sin(A0.ang) * 70;
      if (Math.random() < 0.9) fx.flames(ox + Math.cos(A0.ang) * G.rnd(60, 420), oy + Math.sin(A0.ang) * G.rnd(60, 420), 1, 30);
      A0.tk -= dt;
      if (A0.tk <= 0 && !p.dead) {
        var d = Math.hypot(p.x - e.x, p.y - e.y);
        if (d <= A0.reach + p.r && Math.abs(G.angDiff(angTo(e, p), A0.ang)) <= A0.half + 0.05 && !blockedByPillar(e.x, e.y, p)) { A0.tk = 200; hurt(e, 8, 'boss_aliento', { soft: true }); }
      }
      return A0.t >= A0.actMs;
    },
    draw: function (c, e, A0) {
      var a = A0.step === 'tele' ? A0.a0 : A0.ang;
      if (A0.step === 'tele') {   // sector completo que va a barrer, tenue, y flecha de sentido
        var lo = Math.min(A0.a0 - A0.half, A0.a0 + A0.sgn * A0.sweep - A0.half), hi = Math.max(A0.a0 + A0.half, A0.a0 + A0.sgn * A0.sweep + A0.half);
        c.save(); c.fillStyle = 'rgba(255,120,30,0.10)'; c.strokeStyle = 'rgba(255,200,80,0.45)'; c.lineWidth = 2; c.setLineDash([8, 8]);
        c.beginPath(); c.moveTo(e.x, e.y); c.arc(e.x, e.y, A0.reach, lo, hi); c.closePath(); c.fill(); c.stroke(); c.restore();
      }
      Assets.drawBossTele(c, 'cone', e.x, e.y, { r: A0.reach, arc: 2 * A0.half, a: a, p: A0.step === 'tele' ? A0.t / A0.tele : 1, fix: A0.step !== 'tele' || A0.t >= A0.tele * 0.45, t: G.time });
    },
    haz: function (e, A0, out) {
      var ctr = A0.a0 + A0.sgn * A0.sweep / 2;
      if (A0.step === 'tele') out.push({ k: 'arc', x: e.x, y: e.y, r: A0.reach, inner: 0, a: ctr, arc: A0.sweep + 2 * A0.half, t0: A0.tele - A0.t, t1: A0.tele - A0.t + A0.actMs + 100 });
      else if (A0.step === 'act') out.push({ k: 'arc', x: e.x, y: e.y, r: A0.reach, inner: 0, a: ctr, arc: A0.sweep + 2 * A0.half, t0: 0, t1: A0.actMs - A0.t + 100 });
    }
  };

  // ---- Estallido de costillas: 12 púas radiales (desde el borde del torso: pegarse al cuerpo es seguro); F2 x2 con giro de 15 grados; F3 x3
  function ribFire(e, A0, idx) {
    var a0 = A0.a0 + idx * 15 * DEG, cx = e.x, cy = e.y - 10;
    for (var j = 0; j < 12; j++) {
      var an = a0 + j * 30 * DEG;
      U.shootBoss(cx + Math.cos(an) * 85, cy + Math.sin(an) * 85, an, 250, 12, 'proj_bone_spike', { r: 6, life: 3200, fb: 'thorn', src: 'boss_costillas' });
    }
    sfx('shoot', { pitch: 0.6, vol: 0.7 }); fx.shake(4, 120); fx.ring(cx, cy, 60, 130, 250, '#ffe9c0', 4);
  }
  function ribRays(c, e, a0, p, w) {
    for (var j = 0; j < 12; j++) { var an = a0 + j * 30 * DEG; Assets.drawBossTele(c, 'lane', e.x + Math.cos(an) * 85, e.y - 10 + Math.sin(an) * 85, { w: w || 12, len: 460, a: an, p: p, fix: p > 0.7, t: G.time }); }
  }
  function ribsHaz(e, a0, t0, out) {
    for (var j = 0; j < 12; j++) { var an = a0 + j * 30 * DEG; out.push({ k: 'lane', x: e.x + Math.cos(an) * 85, y: e.y - 10 + Math.sin(an) * 85, a: an, w: 26, len: 460, t0: t0, t1: t0 + 150 }); }
  }
  ATK.k_costillas = {
    start: function (e, A0) {
      var ang = angTo(e, PL()), a0 = Math.random() * 30 * DEG, off = ((ang - a0) % (30 * DEG) + 30 * DEG) % (30 * DEG);
      if (Math.min(off, 30 * DEG - off) < 7 * DEG) a0 += 15 * DEG;
      A0.a0 = a0; A0.vol = [1, 2, 3][e.phase - 1]; A0.k = 0; A0.pose = 'costillas'; A0.rec = 500; A0.drawAct = true; A0.gap = 600;
    },
    go: function (e, A0) { ribFire(e, A0, 0); A0.k = 1; A0.t0 = 0; },
    act: function (e, A0) {
      if (A0.k < A0.vol && A0.t >= A0.k * A0.gap) { ribFire(e, A0, A0.k); A0.k++; }
      return A0.k >= A0.vol && A0.t >= (A0.vol - 1) * A0.gap + 250;
    },
    draw: function (c, e, A0) {
      if (A0.step === 'tele') ribRays(c, e, A0.a0, A0.t / A0.tele);
      else if (A0.step === 'act' && A0.k < A0.vol) ribRays(c, e, A0.a0 + A0.k * 15 * DEG, G.clamp((A0.t - (A0.k - 1) * A0.gap) / A0.gap, 0, 1));
    },
    haz: function (e, A0, out) {
      if (A0.step === 'tele') ribsHaz(e, A0.a0, A0.tele - A0.t, out);
      else if (A0.step === 'act' && A0.k < A0.vol) ribsHaz(e, A0.a0 + A0.k * 15 * DEG, A0.k * A0.gap - A0.t, out);
    }
  };

  // ---- Erupción del núcleo: pulso (r 250) y pecho abierto 4 s (5,5 s sin el brazo-grillete): el Núcleo recibe x2 y la barra se pone dorada
  ATK.k_erupcion = {
    avail: function (e) { return !e.broken.nucleo; },
    start: function (e, A0) { A0.r = 250; if (Math.hypot(PL().x - e.x, PL().y - e.y) < 120) A0.tele = Math.round(1650 * (pel().tele || 1));   // pegado al torso hay que correr 250 px: regla de esquiva 250 + 1000 x 260 / 190 -> telegrafía larga
      A0.openMs = e.broken.grillete ? 5500 : 4000; A0.pose = 'erupcion'; A0.rec = 900; A0.drawAct = true; A0.fin = false; A0.actMs = A0.openMs; A0.a0 = Math.random() * 30 * DEG; },
    go: function (e, A0) {
      var p = PL();
      fx.shake(9, 300); fx.hit(50); sfx('boss_roar', { pitch: 0.7, vol: 0.7 }); fx.shockwave(e.x, e.y, 520); fx.ring(e.x, e.y, 40, 250, 450, '#ffcf7a', 6);
      if (!p.dead && Math.hypot(p.x - e.x, p.y - e.y) <= A0.r) hurt(e, A0.def.dmg, 'boss_erupcion', { kb: 1.4 });
      setChest(e, true); expose(e, 2.0, A0.openMs, 'window');
      G.Hud.banner('¡NÚCLEO EXPUESTO!', 1400, '#ffd24a');
    },
    act: function (e, A0) {
      if (A0.t >= A0.openMs && !A0.fin) { A0.fin = true; ribFire(e, A0, 0); setChest(e, false); }
      return A0.fin;
    },
    draw: function (c, e, A0) {
      if (A0.step === 'tele') Assets.drawBossTele(c, ART() ? 'erupt' : 'circle', e.x, e.y, { r: A0.r, p: A0.t / A0.tele, sig: true, t: G.time });
      else if (A0.step === 'act' && A0.t >= A0.openMs - 700) ribRays(c, e, A0.a0, G.clamp((A0.t - (A0.openMs - 700)) / 700, 0, 1));
    },
    haz: function (e, A0, out) {
      if (A0.step === 'tele') out.push({ k: 'circle', x: e.x, y: e.y, r: A0.r, t0: A0.tele - A0.t, t1: A0.tele - A0.t + 150 });
      else if (A0.step === 'act' && A0.t >= A0.openMs - 700) ribsHaz(e, A0.a0, A0.openMs - A0.t, out);
    }
  };

  // ---- Liberar Penitentes: 2 Ascuas (F2) o 2 Ascuas + 1 Espectro (F3); tope de adds
  ATK.k_penitentes = {
    ok: function () { return U.addsAlive() < pel().cap; },
    start: function (e, A0) {
      var P = pel(), room = P.cap - U.addsAlive(), p = PL(), list = ['scorcher', 'scorcher'];
      if (e.phase === 3) list.push('blinker');
      for (var k = 0; k < P.adds; k++) list.push('scorcher');
      list = list.slice(0, Math.max(0, room)); A0.pose = 'penitentes'; A0.actMs = 300; A0.rec = 600; A0.spots = [];
      var a0 = Math.random() * TAU;
      for (var i = 0; i < 4; i++) {   // 4 círculos de aparición alrededor del Carcelero; se usan tantos como adds
        var an = a0 + i * TAU / 4, x = clampX(e.x + Math.cos(an) * 230), y = clampY(e.y + Math.sin(an) * 190);
        if (Math.hypot(x - p.x, y - p.y) < 100) { x = clampX(x + (x < p.x ? -120 : 120)); }
        A0.spots.push({ x: x, y: y });
      }
      list.forEach(function (ty, i2) { var sp = A0.spots[i2 % 4], ad = E.spawn(ty, sp.x, sp.y, { summoned: true, spawnT: A0.tele }); ad.bossAdd = true; });
      sfx('wave_start', { pitch: 0.7, vol: 0.8 });
    },
    go: function (e) { fx.ring(e.x, e.y, 10, 130, 500, '#a060ff', 5); fx.shake(4, 150); sfx('hit_heavy', { pitch: 0.6, vol: 0.6 }); },
    act: function (e, A0) { return A0.t >= A0.actMs; },
    draw: function (c, e, A0) { for (var i = 0; i < A0.spots.length; i++) Assets.drawBossTele(c, 'summon', A0.spots[i].x, A0.spots[i].y, { r: 46, p: A0.t / A0.tele, t: G.time }); },
    haz: function () { }
  };

  // ---- Marea de lava (F3): el suelo se agrieta 2 s (las 3 islas se iluminan) y se inunda 8 s; solo las islas (y su orilla) son seguras
  ATK.k_marea = {
    ok: function () { return A().flood.state === 'off'; },
    start: function (e, A0) { var fl = A().flood; fl.state = 'tele'; fl.t = 0; fl.dur = pel().regrow ? 8000 : 8000; fl.req = false; A0.pose = 'marea'; A0.actMs = 400; A0.rec = 600; sfx('shockwave', { pitch: 0.5, vol: 0.7 }); fx.shake(5, 600); },
    go: function (e) { fx.shake(6, 300); },
    act: function (e, A0) { return A0.t >= A0.actMs; },
    draw: function () { },
    haz: function () { }
  };

  // ------------------------------------------------------------------ ataque desesperado: Réquiem de Fuego
  H.onDespair = function (e) {
    var a = A();
    a.flood = { state: 'tele', t: 0, dur: 1e9, req: true }; a.islR = ISL_R; a.islShow = 1; a.rainT = 0;
    setChest(e, true); expose(e, 2.0, 10600, 'despair');
    G.Hud.banner('LA ARENA SE INUNDA: ¡A LAS ISLAS!', 2400, '#ffcf3a');
  };
  H.updDespair = function (e, dt) {
    var a = A(), p = PL(); e.despT += dt; e.moveAmt = 0;
    if (e.despT >= 2000) {
      a.islR = ISL_R - 50 * G.clamp((e.despT - 2000) / 8000, 0, 1);   // las islas se encogen hasta r 70
      a.rainT += dt;
      if (a.rainT >= 1000) {   // un impacto por segundo sobre las islas (r 50, telegrafía de 900 ms)
        a.rainT -= 1000;
        var ii = Math.random() < 0.6 ? nearestIsland(p.x, p.y) : Math.floor(Math.random() * 3), an = Math.random() * TAU, rr = Math.random() * a.islR * 0.8;
        a.rain.push({ x: ISLANDS[ii][0] + Math.cos(an) * rr, y: ISLANDS[ii][1] + Math.sin(an) * rr, r: 50, dmg: 18, t: 0, imp: 900, puddles: false });
      }
    }
    if (e.despT >= 10500) {
      a.flood = { state: 'off', t: 0, dur: 0, req: false }; a.islR = ISL_R; a.rain.length = 0;
      setChest(e, false); e.exps = e.exps.filter(function (x) { return x.kind !== 'despair'; });
      e.mode = 'fight'; e.cadT = 1800; G.Hud.banner('El Carcelero se recompone...', 1400, '#ffb070');
    }
  };
  H.onDeath = function (e) {
    var a = A(); a.flood = { state: 'off', t: 0, dur: 0, req: false }; a.rain.length = 0; a.mace = null; a.open = false;
  };

  // ------------------------------------------------------------------ intro: surge del suelo (lava que se abre, 4 grietas, sube el torso)
  H.intro = function (e, I, t) {
    e.alpha = 1; e.lift = 0;
    while ((I.cr || 0) < 4 && t >= (I.cr || 0) * 170) {
      var k = I.cr || 0, an = k * TAU / 4 + 0.6;
      fx.part('fx_boss_crack', e.x + Math.cos(an) * 90, e.y + 70 + Math.sin(an) * 40, 0, 0, 900, { anim: true, sc: 1.4 });
      fx.shake(4, 150); sfx('hit_heavy', { pitch: 0.5, vol: 0.5 }); I.cr = k + 1;
    }
    if (t < 700 && Math.random() < 0.12) fx.ember(e.x + G.rnd(-90, 90), e.y + 90, 2, 20);
    e.rise = t < 700 ? 0 : ease((t - 700) / 900);
    if (t >= 700 && !I.landed) {
      I.landed = true; fx.shake(9, 300); fx.shockwave(e.x, e.y + 90, 360); fx.burst(e.x, e.y + 90, 26, '#ff6a1a', 260, 700, 5, { add: true }); fx.flames(e.x, e.y + 90, 12, 90); sfx('shockwave', { vol: 0.9, pitch: 0.7 });
    }
  };

  // ------------------------------------------------------------------ DIBUJO
  function ringGlow(c, x, y, rx, ry, col, a) { c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = a; c.fillStyle = col; c.beginPath(); c.ellipse(x, y, rx, ry, 0, 0, TAU); c.fill(); c.restore(); }
  var OUT = '#1b1124', BONE = '#d8cfae', BONE2 = '#a89c78';
  function bone(c, path, w) { c.fillStyle = BONE; c.strokeStyle = OUT; c.lineWidth = w || 4; c.lineJoin = 'round'; path(); c.fill(); c.stroke(); }
  function limb(c, x0, y0, x1, y1, w) {
    c.strokeStyle = OUT; c.lineWidth = w + 6; c.lineCap = 'round'; c.beginPath(); c.moveTo(x0, y0); c.lineTo(x1, y1); c.stroke();
    c.strokeStyle = BONE; c.lineWidth = w; c.beginPath(); c.moveTo(x0, y0); c.lineTo(x1, y1); c.stroke();
    c.strokeStyle = BONE2; c.lineWidth = Math.max(2, w * 0.25); c.beginPath(); c.moveTo(x0 + 3, y0 + 3); c.lineTo(x1 + 3, y1 + 3); c.stroke();
  }
  // Dibujo de reserva por código: o = {x,y,t,rise,open,broken,roar,exposed,immune,pose,pp,mace,phase,alpha,hurt}
  function drawK(c, o) {
    var x = o.x, y = o.y, t = o.t, gy = D.gy, rise = o.rise == null ? 1 : o.rise, al = o.alpha == null ? 1 : o.alpha, pulse = 0.5 + 0.5 * Math.sin(t / 220);
    c.save(); c.globalAlpha = al;
    // charco de magma bajo el cuerpo
    var g = c.createRadialGradient(x, y + gy, 10, x, y + gy, 170);
    g.addColorStop(0, 'rgba(255,210,58,0.95)'); g.addColorStop(0.5, 'rgba(255,106,26,0.85)'); g.addColorStop(1, 'rgba(120,30,10,0)');
    c.fillStyle = g; c.beginPath(); c.ellipse(x, y + gy, 175, 54, 0, 0, TAU); c.fill();
    if (o.exposed) { c.strokeStyle = 'rgba(255,224,110,' + (0.55 + 0.35 * pulse) + ')'; c.lineWidth = 4; c.beginPath(); c.ellipse(x, y + gy, 150, 46, 0, 0, TAU); c.stroke(); }
    if (o.immune) { c.strokeStyle = 'rgba(160,220,255,0.7)'; c.lineWidth = 3; c.setLineDash([6, 8]); c.lineDashOffset = -t / 30; c.beginPath(); c.ellipse(x, y + gy, 160, 50, 0, 0, TAU); c.stroke(); c.setLineDash([]); }
    c.save();
    c.beginPath(); c.rect(x - 260, y - 260, 520, 260 + gy + 6); c.clip();   // lo que está bajo la línea del charco queda oculto (emerge / se hunde)
    c.translate(x, y + (1 - rise) * 230 + Math.sin(t / 600) * 2);
    var sh = o.shake ? (Math.random() - 0.5) * 4 : 0; c.translate(sh, 0);
    var br = o.broken || {}, rz = o.roar || 0;
    // brazo izquierdo (grillete)
    var lx = -150, ly = 52;
    if (!br.grillete) { limb(c, -92, -52, lx, ly, 34); c.strokeStyle = '#6b7385'; c.lineWidth = 8; c.beginPath(); c.arc(lx, ly - 4, 20, 0, TAU); c.stroke(); c.lineWidth = 4; c.beginPath(); c.moveTo(lx - 10, ly + 14); c.lineTo(lx - 22, ly + 52); c.lineTo(lx - 6, ly + 70); c.stroke(); }
    else { limb(c, -92, -52, -128, -8, 34); c.fillStyle = '#ff6a1a'; c.beginPath(); c.arc(-128, -4, 12, 0, TAU); c.fill(); }
    // torso: caja torácica
    bone(c, function () { c.beginPath(); c.moveTo(-84, -78); c.lineTo(84, -78); c.lineTo(100, 8); c.lineTo(64, 86); c.lineTo(-64, 86); c.lineTo(-100, 8); c.closePath(); });
    c.strokeStyle = BONE2; c.lineWidth = 5;
    for (var r = 0; r < 4; r++) { var ry = -48 + r * 30, w = 76 - Math.abs(r - 1.2) * 6; c.beginPath(); c.moveTo(-w, ry); c.quadraticCurveTo(0, ry + 12, w, ry); c.stroke(); }
    // cavidad y núcleo
    c.fillStyle = '#201a2e'; c.beginPath(); c.ellipse(0, 6, 46, 54, 0, 0, TAU); c.fill(); c.strokeStyle = OUT; c.lineWidth = 3; c.stroke();
    var gl = o.open ? 1 : 0.35 + 0.2 * pulse;
    var cg = c.createRadialGradient(0, 4, 2, 0, 4, 40); cg.addColorStop(0, 'rgba(255,240,150,' + gl + ')'); cg.addColorStop(0.5, 'rgba(255,106,26,' + gl * 0.9 + ')'); cg.addColorStop(1, 'rgba(255,60,10,0)');
    c.fillStyle = cg; c.beginPath(); c.arc(0, 4, 40, 0, TAU); c.fill();
    if (br.nucleo) { c.fillStyle = '#3a2418'; c.beginPath(); c.arc(0, 4, 16, 0, TAU); c.fill(); }
    else { c.fillStyle = o.open ? '#fff2a8' : '#ff9a2a'; c.beginPath(); c.arc(0, 4, (o.open ? 20 : 12) + pulse * 3, 0, TAU); c.fill(); c.strokeStyle = OUT; c.lineWidth = 2.5; c.stroke(); }
    if (!o.open && !br.nucleo) {   // costillas cerradas sobre el núcleo
      c.strokeStyle = BONE; c.lineWidth = 8; c.lineCap = 'round';
      for (var q = -2; q <= 2; q++) { c.beginPath(); c.moveTo(q * 18, -42); c.lineTo(q * 14, 54); c.stroke(); }
      c.strokeStyle = OUT; c.lineWidth = 2; for (var q2 = -2; q2 <= 2; q2++) { c.beginPath(); c.moveTo(q2 * 18 + 4, -42); c.lineTo(q2 * 14 + 4, 54); c.stroke(); }
    }
    // cráneo con corona de cuernos pequeños
    var sy = -104 - rz * 8;
    c.fillStyle = BONE; c.strokeStyle = OUT; c.lineWidth = 4;
    for (var h = -2; h <= 2; h++) { c.beginPath(); c.moveTo(h * 17 - 7, sy - 26); c.lineTo(h * 19, sy - 52 + Math.abs(h) * 6); c.lineTo(h * 17 + 7, sy - 26); c.closePath(); c.fill(); c.stroke(); }
    bone(c, function () { c.beginPath(); c.arc(0, sy, 38, 0, TAU); });
    bone(c, function () { c.beginPath(); c.rect(-22, sy + 24, 44, 22 + rz * 14); });
    c.fillStyle = '#201a2e'; c.beginPath(); c.arc(-15, sy - 2, 11, 0, TAU); c.arc(15, sy - 2, 11, 0, TAU); c.fill();
    c.fillStyle = o.phase >= 3 ? '#fff2a8' : '#ff8a1a'; c.beginPath(); c.arc(-15, sy - 2, 5, 0, TAU); c.arc(15, sy - 2, 5, 0, TAU); c.fill();
    c.strokeStyle = OUT; c.lineWidth = 3; for (var tq = -2; tq <= 2; tq++) { c.beginPath(); c.moveTo(tq * 8, sy + 26); c.lineTo(tq * 8, sy + 42 + rz * 12); c.stroke(); }
    // brazo derecho (maza)
    var rx = 150, ry2 = 52;
    if (!br.maza) {
      if (o.pose === 'martillo' && o.pp != null && !o.mace) { var lift = o.pp; rx = 130 + 10 * lift; ry2 = 52 - 220 * Math.min(1, lift * 1.2); }
      if (o.mace) { rx = o.mace.x - x; ry2 = o.mace.y - y - 8; }
      limb(c, 92, -52, rx, ry2, 36);
      c.fillStyle = '#7a7488'; c.strokeStyle = OUT; c.lineWidth = 4;
      c.beginPath(); c.moveTo(rx - 26, ry2 - 14); c.lineTo(rx + 26, ry2 - 14); c.lineTo(rx + 30, ry2 + 28); c.lineTo(rx - 30, ry2 + 28); c.closePath(); c.fill(); c.stroke();
      c.fillStyle = '#ff6a1a'; c.fillRect(rx - 18, ry2 - 6, 36, 8);
    } else { limb(c, 92, -52, 126, -8, 36); c.fillStyle = '#ff6a1a'; c.beginPath(); c.arc(126, -4, 13, 0, TAU); c.fill(); }
    c.restore();
    if (o.hurt) ringGlow(c, x, y - 20, 110, 130, '#ffffff', 0.25);
    c.restore();
  }
  function stateK(e) {
    var A0 = e.atk, a = A(), ex = S.expo(e);
    return { x: e.x, y: e.y, t: G.time, rise: e.rise, open: a.open, broken: e.broken, roar: e.roar || 0, exposed: ex.mul > 1 && ex.kind !== 'stun', immune: e.immune && e.mode !== 'intro' && !e.dying,
      pose: A0 && A0.pose, pp: A0 && A0.name === 'k_martillo' && A0.step === 'tele' ? G.clamp(A0.t / A0.tele, 0, 1) : null, mace: a.mace, phase: e.phase, alpha: e.alpha == null ? 1 : e.alpha, hurt: e.hurtT > 0, shake: e.hurtT > 0 };
  }
  H.draw = function (c, e) {
    if (ART()) Assets.drawBoss('karceron', c, e.x, e.y, artStateK(e)); else drawK(c, stateK(e));
  };
  H.drawGhost = function (c, Dd) {
    if (ART()) { Assets.drawBoss('karceron', c, Dd.x, Dd.y, { t: G.time, phase: 3, dying: true, dt: Dd.dt, broken: Dd.broken, facing: 0 }); return; }
    var u = G.clamp(Dd.dt / 2400, 0, 1);
    drawK(c, { x: Dd.x, y: Dd.y, t: G.time, rise: 1 - ease(u), open: true, broken: Dd.broken, roar: 1, phase: 3, alpha: 1 - Math.max(0, u - 0.7) / 0.3 });
  };

  function drawPillar(c, it) {
    var o = it.o, sh = o.shake > 0 ? (Math.random() * 2 - 1) * 2 : 0, x = Math.round(o.x + sh), y = o.y;
    if (ART()) { Assets.drawPillar(c, 'bone', x, y, { hp: 1, t: G.time }); return; }
    c.save(); c.fillStyle = 'rgba(0,0,0,0.3)'; c.beginPath(); c.ellipse(x, y + 18, 34, 12, 0, 0, TAU); c.fill();
    c.fillStyle = BONE; c.strokeStyle = OUT; c.lineWidth = 4; c.lineJoin = 'round';
    c.beginPath(); c.moveTo(x - 22, y + 20); c.lineTo(x - 16, y - 56); c.lineTo(x + 16, y - 56); c.lineTo(x + 22, y + 20); c.closePath(); c.fill(); c.stroke();
    c.beginPath(); c.arc(x - 12, y - 58, 11, 0, TAU); c.arc(x + 12, y - 58, 11, 0, TAU); c.fill(); c.stroke();
    c.strokeStyle = BONE2; c.lineWidth = 3; for (var i = 0; i < 3; i++) { c.beginPath(); c.moveTo(x - 14, y - 36 + i * 20); c.lineTo(x + 14, y - 40 + i * 20); c.stroke(); }
    c.fillStyle = '#201a2e'; c.beginPath(); c.arc(x - 4, y - 14, 5, 0, TAU); c.fill();
    c.restore();
  }
  function drawFallenArm(c, it) {
    var o = it.o, x = Math.round(o.x), y = Math.round(o.y);
    if (G.hasSpr('obs_karceron_arm')) { var cv = Assets.sprite('obs_karceron_arm', 0); c.drawImage(cv, x - cv.width / 2, y - cv.height / 2); return; }
    c.save(); limb(c, x - 34, y + 10, x + 20, y - 6, 28);
    c.fillStyle = '#7a7488'; c.strokeStyle = OUT; c.lineWidth = 4; c.fillRect(x + 12, y - 28, 34, 34); c.strokeRect(x + 12, y - 28, 34, 34);
    c.restore();
  }

  var lavaPat = null;
  function lavaFill(c) {
    if (G.hasSpr('fx_lava_tile')) {
      if (!lavaPat) { try { lavaPat = c.createPattern(Assets.sprite('fx_lava_tile', 0), 'repeat'); } catch (x) { lavaPat = null; } }
      if (lavaPat) return lavaPat;
    }
    return null;
  }
  function lavaDisc(c, x, y, r, t, fresh) {
    var g = c.createRadialGradient(x, y, r * 0.15, x, y, r);
    g.addColorStop(0, 'rgba(255,230,110,0.95)'); g.addColorStop(0.55, 'rgba(255,106,26,0.9)'); g.addColorStop(1, 'rgba(190,50,10,0.85)');
    c.fillStyle = g; c.beginPath(); c.ellipse(x, y, r, r * 0.8, 0, 0, TAU); c.fill();
    c.strokeStyle = 'rgba(255,230,90,' + (0.7 + 0.2 * Math.sin(t / 200)) + ')'; c.lineWidth = 3; c.stroke();
    c.fillStyle = 'rgba(255,240,150,0.5)'; for (var i = 0; i < 3; i++) { var an = t / 700 + i * 2.1; c.beginPath(); c.arc(x + Math.cos(an) * r * 0.45, y + Math.sin(an) * r * 0.35, r * 0.1, 0, TAU); c.fill(); }
  }
  function islandDisc(c, x, y, r, lit, t) {
    if (G.hasSpr('fx_island_stone')) { var cv = Assets.sprite('fx_island_stone', 0), w = r * 2.1, h = w * cv.height / cv.width; c.drawImage(cv, x - w / 2, y - h / 2, w, h); }
    else {
      c.fillStyle = '#4a4458'; c.strokeStyle = OUT; c.lineWidth = 4; c.beginPath(); c.ellipse(x, y, r, r * 0.78, 0, 0, TAU); c.fill(); c.stroke();
      c.fillStyle = '#625a74'; c.beginPath(); c.ellipse(x - r * 0.12, y - r * 0.1, r * 0.78, r * 0.55, 0, 0, TAU); c.fill();
      c.strokeStyle = '#2c2638'; c.lineWidth = 2; c.beginPath(); c.moveTo(x - r * 0.5, y); c.lineTo(x - r * 0.1, y + r * 0.2); c.lineTo(x + r * 0.3, y - r * 0.1); c.stroke();
    }
    if (lit) { c.strokeStyle = 'rgba(255,255,255,' + (0.6 + 0.3 * Math.sin(t / 110)) + ')'; c.lineWidth = 4; c.beginPath(); c.ellipse(x, y, r + 4, (r + 4) * 0.78, 0, 0, TAU); c.stroke(); }
  }
  function drawGroundArt(c, e) {
    var a = A(), t = G.time, i, fl = a.flood, rect = { x: G.WALL, y: G.WALL, w: G.AW - 2 * G.WALL, h: G.AH - 2 * G.WALL };
    for (i = 0; i < S.obs.length; i++) {   // escombros y reconstrucción de pilares
      var o = S.obs[i]; if (o.kind === 'bone' && o.dead) Assets.drawPillar(c, 'bone', o.x, o.y, { hp: 0, rebuild: o.warn ? (G.time - o.deadAt - 38500) / 1500 : 0, t: t });
    }
    if (a.margin > 2) Assets.drawLavaEdge(c, rect, a.margin, t, 1);
    for (i = 0; i < a.lava.length; i++) Assets.drawLavaPool(c, a.lava[i].x, a.lava[i].y, a.lava[i].r, t + i * 300);
    for (i = 0; i < a.puddles.length; i++) Assets.drawEmberPatch(c, a.puddles[i].x, a.puddles[i].y, a.puddles[i].r, t, Math.min(1, (a.puddles[i].life - a.puddles[i].t) / 400));
    for (i = 0; i < a.cracks.length; i++) {
      var cr = a.cracks[i], u = (t - cr.t) / 2000;
      if (G.hasSpr('fx_boss_crack_lava')) { var cv = Assets.sprite('fx_boss_crack_lava', Math.min(2, Math.floor(u * 8))), w = cr.r * 2.2; c.save(); c.globalAlpha = 1 - u * u; c.drawImage(cv, cr.x - w / 2, cr.y - w / 2, w, w); c.restore(); }
    }
    var showIsl = e.phase >= 3 || fl.state !== 'off';
    if (showIsl) for (i = 0; i < ISLANDS.length; i++) Assets.drawIsland(c, ISLANDS[i][0], ISLANDS[i][1], a.islR, { lit: fl.state === 'tele' ? 1 : 0, crack: fl.req && fl.state === 'on' && a.islR < 100, t: t });
    if (fl.state !== 'off') {
      var isl = ISLANDS.map(function (q) { return { x: q[0], y: q[1], r: floodR() }; });
      if (fl.state === 'tele') Assets.drawBossTele(c, 'flood', G.AW / 2, G.AH / 2, { rect: rect, islands: isl, p: G.clamp(fl.t / 2000, 0, 1), t: t });
      else Assets.drawLavaFlood(c, rect, isl, t, 0.9);
    }
  }
  H.drawGround = function (c, e) {
    if (ART()) return drawGroundArt(c, e);
    var a = A(), t = G.time, i, fl = a.flood;
    // escombros de pilares
    for (i = 0; i < a.rub.length; i++) { var rb = a.rub[i]; c.fillStyle = '#8a8068'; c.strokeStyle = OUT; c.lineWidth = 2; c.beginPath(); c.ellipse(rb.x, rb.y + 6, 26, 10, 0, 0, TAU); c.fill(); c.stroke(); }
    for (i = 0; i < S.obs.length; i++) {   // aviso de reconstrucción
      var o = S.obs[i]; if (o.kind === 'bone' && o.dead && o.warn) { c.strokeStyle = 'rgba(255,230,120,' + (0.5 + 0.4 * Math.sin(t / 90)) + ')'; c.lineWidth = 3; c.beginPath(); c.arc(o.x, o.y, o.r + 8, 0, TAU); c.stroke(); }
    }
    // borde de lava (fase 2: margen de 100 px)
    if (a.margin > 2) {
      var m = G.WALL + a.margin, pulse = 0.5 + 0.2 * Math.sin(t / 220);
      c.save(); c.fillStyle = 'rgba(255,90,20,' + (0.5 + 0.1 * pulse) + ')';
      c.beginPath(); c.rect(G.WALL, G.WALL, G.AW - 2 * G.WALL, G.AH - 2 * G.WALL); c.rect(m, m, G.AW - 2 * m, G.AH - 2 * m); c.fill('evenodd');
      c.strokeStyle = 'rgba(255,224,90,0.9)'; c.lineWidth = 3; c.strokeRect(m, m, G.AW - 2 * m, G.AH - 2 * m);
      c.globalCompositeOperation = 'lighter'; c.fillStyle = 'rgba(255,170,40,' + (0.12 * pulse) + ')'; c.beginPath(); c.rect(G.WALL, G.WALL, G.AW - 2 * G.WALL, G.AH - 2 * G.WALL); c.rect(m, m, G.AW - 2 * m, G.AH - 2 * m); c.fill('evenodd'); c.restore();
    }
    // charcos fijos y charcos de brasas
    for (i = 0; i < a.lava.length; i++) lavaDisc(c, a.lava[i].x, a.lava[i].y, a.lava[i].r, t + i * 300, a.lava[i].fresh);
    for (i = 0; i < a.puddles.length; i++) { var pd = a.puddles[i]; c.save(); c.globalAlpha = Math.min(1, (pd.life - pd.t) / 400); lavaDisc(c, pd.x, pd.y, pd.r, t, false); c.restore(); }
    // grietas
    for (i = 0; i < a.cracks.length; i++) {
      var cr = a.cracks[i], u = (t - cr.t) / 2000;
      c.save(); c.globalAlpha = 1 - u; c.strokeStyle = '#ff6a1a'; c.lineWidth = 3; c.lineCap = 'round';
      for (var k = 0; k < 7; k++) { var an = k * TAU / 7 + cr.x; c.beginPath(); c.moveTo(cr.x, cr.y); c.lineTo(cr.x + Math.cos(an) * cr.r * 0.9, cr.y + Math.sin(an) * cr.r * 0.75); c.stroke(); }
      c.strokeStyle = 'rgba(30,10,20,0.8)'; c.lineWidth = 1.5; c.beginPath(); c.arc(cr.x, cr.y, cr.r * 0.5, 0, TAU); c.stroke(); c.restore();
    }
    // islas (visibles desde la fase 3 y durante la Marea / el Réquiem)
    var showIsl = e.phase >= 3 || fl.state !== 'off';
    if (showIsl) for (i = 0; i < ISLANDS.length; i++) islandDisc(c, ISLANDS[i][0], ISLANDS[i][1], a.islR, fl.state === 'tele', t);
    // inundación: lava sobre toda la arena menos las islas (y su orilla en la Marea)
    if (fl.state !== 'off') {
      var R = floodR() + (fl.req ? 0 : 0), tele = fl.state === 'tele', pu = 0.5 + 0.5 * Math.sin(t / 130);
      c.save();
      var pat = lavaFill(c);
      c.beginPath(); c.rect(G.WALL, G.WALL, G.AW - 2 * G.WALL, G.AH - 2 * G.WALL);
      for (i = 0; i < ISLANDS.length; i++) { c.moveTo(ISLANDS[i][0] + R, ISLANDS[i][1]); c.arc(ISLANDS[i][0], ISLANDS[i][1], R, 0, TAU, true); }
      var grow = tele ? G.clamp(fl.t / 2000, 0, 1) : 1;
      if (tele) { c.fillStyle = 'rgba(255,100,20,' + (0.10 + 0.14 * grow + 0.06 * pu) + ')'; c.fill('evenodd'); c.strokeStyle = 'rgba(255,230,90,' + (0.4 + 0.4 * pu) + ')'; c.lineWidth = 3; c.setLineDash([10, 8]); c.stroke(); c.setLineDash([]); }
      else {
        c.fillStyle = pat || ('rgba(255,96,20,' + (0.62 + 0.06 * pu) + ')'); c.globalAlpha = pat ? 0.85 : 1; c.fill('evenodd'); c.globalAlpha = 1;
        c.globalCompositeOperation = 'lighter'; c.fillStyle = 'rgba(255,190,60,' + (0.10 + 0.05 * pu) + ')'; c.fill('evenodd'); c.globalCompositeOperation = 'source-over';
        c.strokeStyle = 'rgba(255,230,90,0.95)'; c.lineWidth = 4; c.stroke();
      }
      c.restore();
      if (tele) {   // grietas animadas hacia las islas + cuenta atrás
        c.save(); c.strokeStyle = 'rgba(255,130,30,' + (0.5 * grow) + ')'; c.lineWidth = 4; c.lineCap = 'round';
        for (i = 0; i < 14; i++) { var sx = G.WALL + ((i * 977) % (G.AW - 2 * G.WALL)), sy = G.WALL + ((i * 613) % (G.AH - 2 * G.WALL)); c.beginPath(); c.moveTo(sx, sy); c.lineTo(sx + 50 * Math.cos(i), sy + 50 * Math.sin(i * 2)); c.lineTo(sx + 90 * Math.cos(i + 1) * grow, sy + 60 * Math.sin(i)); c.stroke(); }
        c.restore();
      }
    }
  };
  H.items = function (list, e) { /* el cuerpo ya está en G.enemies; pilares y brazo caído van por S.obs */ };

  // ------------------------------------------------------------------ amenazas para el bot / pruebas
  H.hazards = function (e, out) {
    var a = A(), i, fl = a.flood;
    if (!a.__ref) a.__ref = { lava: {}, flood: {}, band: {} };
    for (i = 0; i < a.lava.length; i++) out.push({ ref: a.lava[i], k: 'circle', x: a.lava[i].x, y: a.lava[i].y, r: a.lava[i].r + 4, t0: 0, t1: 1e9, live: true, perm: true });
    for (i = 0; i < a.puddles.length; i++) out.push({ ref: a.puddles[i], k: 'circle', x: a.puddles[i].x, y: a.puddles[i].y, r: a.puddles[i].r, t0: 0, t1: a.puddles[i].life - a.puddles[i].t, live: true, perm: true });
    for (i = 0; i < a.rain.length; i++) out.push({ ref: a.rain[i], k: 'circle', x: a.rain[i].x, y: a.rain[i].y, r: a.rain[i].r, t0: a.rain[i].imp - a.rain[i].t, t1: a.rain[i].imp - a.rain[i].t + 150 });
    if (a.margin >= 30) out.push({ ref: a.__ref.band, k: 'frame', m: G.WALL + a.margin, t0: 0, t1: 1e9, live: true, perm: true });
    if (fl.state !== 'off') {
      var tl = fl.state === 'tele' ? 2000 - fl.t : 0, tend = fl.state === 'tele' ? 2000 - fl.t + (fl.req ? 1e9 : fl.dur) : (fl.req ? 1e9 : fl.dur - fl.t);
      out.push({ ref: fl, k: 'flood', islands: ISLANDS, R: floodR(), t0: tl, t1: tend + 40 });
    }
  };
  H.sigNow = function (e) { return false; };
  S.karceronInfo = function () { var a = A(); return { open: a.open, flood: a.flood, margin: a.margin, islR: a.islR, pillars: S.obs.filter(function (o) { return o.kind === 'bone'; }).map(function (o) { return o.dead ? 0 : 1; }), mace: a.mace }; };
  // cobertura de islas: distancia máxima de cualquier punto jugable (dentro del margen de lava) al borde de la isla más cercana (README: < 280 px)
  S.karceronCoverage = function () {
    var worst = 0, wx = 0, wy = 0, x, y, d, i, m = G.WALL + 100;
    for (x = m; x <= G.AW - m; x += 12) for (y = m; y <= G.AH - m; y += 12) {
      var best = 1e9; for (i = 0; i < ISLANDS.length; i++) best = Math.min(best, Math.hypot(x - ISLANDS[i][0], y - ISLANDS[i][1]) - ISL_R);
      if (best > worst) { worst = best; wx = x; wy = y; }
    }
    var fl = 0, tot = 0; for (x = m; x <= G.AW - m; x += 12) for (y = m; y <= G.AH - m; y += 12) { tot++; if (!inSafe(x, y, MAREA_SAFE)) fl++; }
    return { maxEdgeDist: Math.round(worst), at: [wx, wy], marea: Math.round(100 * fl / tot) + ' % inundado' };
  };
})();
