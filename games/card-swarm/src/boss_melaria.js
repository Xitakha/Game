/* boss_melaria.js - Jefes v5 (fase P6): MELARIA, LA REINA ABEJA (Panal). DESIGN-v5-biomas.md B.0, B.4, B.5 y B.7.
   Reina colosal que FLOTA (60 / 70 / 80 px/s, 40 px de vuelo + `lift` extra en el picado). 3 fases (Corte real, Enjambre, Reina furiosa) + desesperado (Zumbido Mortal), 8 ataques con la regla de esquiva
   estándar (telegrafía >= 250 + 1000 x salida / 190 ms, suelo de 800 ms si el daño es >= 25), 3 partes (Alas, Aguijón, Corona de jalea real) con efecto y trofeo, debilidades Fuego e Hielo,
   Veneno inmune a estados (x0,5 directo) y Rayo x0,8. Usa el mundo del Panal (panal.js): celdas de miel (P.openCell / P.honeyAt), nidos, humo (interrumpe la Jalea real), pilares de cera y el Polinizador
   (cura a la Reina 1 % por pulso). Engancha en el motor genérico de boss.js (DEFS.melaria.h). Arte: assets_boss4.js (Assets.drawBoss('melaria'), con dibujo de reserva aquí). Audio: sfx_melaria.js. */
(function () {
  'use strict';
  var G = window.G, S = G.Boss, fx = G.fx, E = G.Enemies, U = S && S.u, PN = G.Panal;
  if (!S || !U) return;
  var ATKS = S.ATKS, ATK = S.ATK, TAU = Math.PI * 2, DEG = Math.PI / 180, B = G.B;
  var ease = U.ease, angTo = U.angTo, sfx = U.sfx, pel = U.pel, expose = U.expose;
  var OUT = '#1b1124', COS30 = Math.cos(Math.PI / 6);
  // Calibración con el bot (README, Melaria P6): el daño por golpe lleva un multiplicador propio (D.dmgK; ?mdmg=1.4 para probar). Nunca pasa de HIT_CAP 32
  function dmgK() { var m = /[?&]mdmg=([\d.]+)/.exec(location.search); return m ? +m[1] : (S.DEFS.melaria.dmgK || 1); }
  function hurt(e, base, src, o) { return U.hurt(e, Math.min(32, base * dmgK()), src, o); }
  function PL() { return G.player; }
  function A() { return S.A; }
  function ART() { try { return !!(Assets.drawBoss && Assets.bossIds().indexOf('melaria') >= 0 && G.hasSpr('boss_reina_thorax')); } catch (x) { return false; } }
  function winSt() { var a = A(); if (G.time - (a.winT || -1e9) < 900) return; a.winT = G.time; try { G.Snd.play('stg_melaria_window'); } catch (x) { /* audio */ } }
  function qn(name, def) { var m = new RegExp('[?&]' + name + '=([\\d.]+)').exec(location.search); return m ? parseFloat(m[1]) : def; }

  S.DEFS.melaria = {
    id: 'melaria', name: 'Melaria, la Reina Abeja', title: 'La que devoró a sus hermanas', furia: 'DE MELARIA', hp: 7200, r: 70, gy: 84, deathMs: 3500, noFire: true,
    phases: [   // music = intensidad para la pista 'boss_melaria' (< 0,4 F1, < 0,7 F2, si no F3): 0,25 / 0,55 / 0,85
      { n: 'Corte real',      thr: 0.65, cad: 3000, spd: 60, music: 0.25, spawn: { mul: 0.25, allow: { worm: 1, archer: 1 }, cap: 15 } },
      { n: 'Enjambre',        thr: 0.30, cad: 2500, spd: 70, music: 0.55, spawn: { mul: 0.25, allow: { worm: 1, archer: 1, bomb: 1 }, cap: 15 } },
      { n: 'Reina furiosa',   thr: 0,    cad: 2000, spd: 80, music: 0.85, spawn: { mul: 0, allow: {}, cap: 0 } }
    ],
    despairAt: 0.08, despair: 'Zumbido Mortal',
    barCol: ['#e0a020', '#f0a828', '#ffd070'], gateCol: ['#e9f4ff', '#ffc440', '#ffe6f2'], nameCol: '#ffe0a0', winCol: ['#e6f7ff', '#9fd8f0'], roarSfx: 'boss_roar_reina',
    parts: {
      alas:    { name: 'Alas',                 pct: 0.09, hz: 1.0,  trophy: 'mwing',  r: 52, fem: true },
      aguijon: { name: 'Aguijón',              pct: 0.09, hz: 1.15, trophy: 'msting', r: 24 },
      corona:  { name: 'Corona de jalea real', pct: 0.10, hz: 1.15, trophy: 'mjelly', r: 24, fem: true }
    },
    weak: [{ tag: 'fire', mul: 1.25, phases: [1, 2, 3] }, { tag: 'ice', mul: 1.25, phases: [2, 3] }],
    resist: [{ tag: 'poison', mul: 0.5, immune: true }, { tag: 'lightning', mul: 0.8 }],   // Veneno: inmune a los estados (Combat.poison) y x0,5 directo
    noPoison: true,
    hpCal: 3.5, dmgK: 1.3, geo: { estocada: 2, picado: 1.4, lluvia: 1.25, torbellino: 1.6 },   // calibración con el bot (README, Melaria P6)
    brasas: 14, brasasPart: 4, pf: 2, pfFirst: 3,
    guaranteed: { wick: 2, frost: 2, thread: 2 },
    h: { camW: 0.4 }
  };
  var D = S.DEFS.melaria, H = D.h;
  // Geometría de calibración (README, Melaria P6): factor sobre las zonas del doc (carril 70, picado r 100, cono 80 grados, rosquilla 100-260). El doc deja mucha holgura en la regla de esquiva
  // (Estocada 900 ms frente a 513; Picado 1000 frente a 776...), así que se agrandan las zonas SIN tocar la telegrafía; la regla se sigue cumpliendo con la salida nueva (S.EXIT se recalcula aquí).
  function geo(k) { return (D.geo[k] || 1) * qn('mgeo', 1); }
  Object.keys(D.parts).forEach(function (k) { D.parts[k].hz *= qn('mpz', 1); });   // calibración: ?mpz=<k> multiplica el desgaste de las partes
  [['mwing', 'trophy_reina_wing', 'Ala de Reina'], ['msting', 'trophy_reina_sting', 'Aguijón Real'], ['mjelly', 'trophy_reina_jelly', 'Jalea Real']].forEach(function (t) {
    Object.defineProperty(S.TROPHY, t[0], { enumerable: true, configurable: true, get: function () { return { spr: G.hasSpr(t[1]) ? t[1] : 'trophy_pastor_horn', name: t[2] }; } });
  });
  // salida (px) para librarse de cada ataque (doc B.5): la telegrafía mínima sale de la regla 250 + 1000 x salida / 190 (+100 de margen del motor)
  S.EXIT.m_estocada = Math.round(35 * geo('estocada') + 15); S.EXIT.m_picado = Math.round(100 * geo('picado')); S.EXIT.m_lluvia = Math.round(30 * geo('lluvia')); S.EXIT.m_torbellino = Math.round(90 * geo('torbellino')); S.EXIT.m_eclosion = 60; S.EXIT.m_alazo = 40;

  function def(name, o) { o.b = 'melaria'; ATKS[name] = o; }
  def('m_estocada',   { name: 'Estocada real',        tele: 900,  cd: 6000,  dmg: 26, phases: [1, 2, 3], sig: true });
  def('m_picado',     { name: 'Zumbido en picado',    tele: 1000, cd: 10000, dmg: 28, phases: [1, 2, 3], sig: true });
  def('m_lluvia',     { name: 'Lluvia de aguijones',  tele: 600,  cd: 6000,  dmg: 9,  phases: [1, 2, 3] });
  def('m_llamada',    { name: 'Llamada del enjambre', tele: 800,  cd: 20000, dmg: 0,  phases: [1, 2, 3] });
  def('m_panal',      { name: 'Panal abierto',        tele: 1200, cd: 14000, dmg: 0,  phases: [2, 3] });
  def('m_torbellino', { name: 'Torbellino alado',     tele: 1100, cd: 12000, dmg: 18, phases: [2, 3] });
  def('m_jalea',      { name: 'Jalea real',           tele: 1600, cd: 24000, dmg: 0,  phases: [1, 2, 3] });
  def('m_eclosion',   { name: 'Eclosión masiva',      tele: 1200, cd: 18000, dmg: 18, phases: [3] });
  def('m_alazo',      { name: 'Golpe de ala',         tele: 600,  cd: 4500,  dmg: 18, phases: [1, 2, 3] });

  // ------------------------------------------------------------------ utilidades
  function gnd(e) { return { x: e.x, y: e.y + 24 }; }                          // punto del suelo bajo el cuerpo (centro de las telegrafías)
  function clampE(x, y) { return PN.clampPt(x, y, 72); }                      // posición válida para el centro de la Reina (r 70 + muros diagonales)
  function addsLoad() { var n = 0; for (var i = 0; i < G.enemies.length; i++) { var q = G.enemies[i]; if (!q.dead && q.bossAdd) n += q.type === 'bomb' ? 0.5 : 1; } return n; }   // las Larvas cuentan 0,5
  function addCap(e) { return pel().cap - (e.broken.corona ? 2 : 0); }
  S.addsLoad = addsLoad;
  function spawnAdd(type, x, y, spawnT) {
    var m = PN.clampPt(x, y, 30), ty = B.has(type) ? type : 'worm', ad = E.spawn(ty, m[0], m[1], { summoned: true, spawnT: spawnT });
    ad.bossAdd = true; return ad;
  }
  function faceTo(e, ang) { e.face = Math.cos(ang) >= 0 ? 1 : -1; }
  function setCaps(e) { PN.setCap([12, 24, 36][e.phase - 1] || 36, pel().n >= 4 ? 1.5 : 1); }   // celdas de miel: 12 / 24 / 36 (x1,5 en Peligro IV)
  function breakPillarsNear(x, y, r) { for (var i = 0; i < PN.pillars.length; i++) { var o = PN.pillars[i]; if (!o.dead && Math.hypot(o.x - x, o.y - y) < r + o.r) PN.hitPillar(i, 400); } }

  // ------------------------------------------------------------------ estado para el dibujo y anclas
  function artState(e) {
    var A0 = e.atk, ex = S.expo(e), a = A(), br = e.broken, stuck = a.stuckT > 0;
    var st = { t: G.time, phase: e.phase, facing: e.face || 1, hurt: e.hurtT > 0 ? 0.6 : 0, enraged: S.fury > 1, desperate: e.mode === 'despair' && !a.land2,
      exposed: ex.mul > 1 && ex.kind !== 'stun' && ex.kind !== 'derribo', stun: (ex.kind === 'stun' || ex.kind === 'derribo' || e.stagT > 0 || !!a.land2) && !stuck, stuck: stuck,
      immune: e.immune && e.mode !== 'intro' && !e.dying, noFx: G.Q && G.Q.level === 'baja', roar: e.roar || 0, alpha: e.alpha == null ? 1 : e.alpha, broken: br, lift: (e.lift || 0) + (a.dip || 0), swollen: a.swollenT > 0 ? 1 : 0, id: 'melaria' };
    if (A0) {
      var nm = A0.pose;
      if (A0.step === 'tele') { st.windup = nm; st.wp = G.clamp(A0.t / A0.tele, 0, 0.999); }
      else if (A0.step === 'act') { st.strike = nm; st.sp = G.clamp(A0.t / (A0.actMs || 400), 0, 0.999); }
      if (A0.sub === 'aim') { st.strike = null; st.windup = nm; st.wp = G.clamp(A0.subT / 600, 0, 0.999); }
      if (A0.aim != null) st.aim = A0.aim;
    }
    return st;
  }
  var FALL = { alas: { x: 4, y: -115, r: 52 }, aguijon: { x: -173, y: 53, r: 24 }, corona: { x: 69, y: -88, r: 24 } };
  H.anchors = function (e) {
    var f = e.face || 1;
    if (ART()) { try { var an = Assets.bossAnchors('melaria', artState(e)); if (an && an.alas) return an; } catch (x) { /* reserva */ } }
    return { alas: { x: f * FALL.alas.x, y: FALL.alas.y, r: 52 }, aguijon: { x: f * FALL.aguijon.x, y: FALL.aguijon.y, r: 24 }, corona: { x: f * FALL.corona.x, y: FALL.corona.y, r: 24 },
      stingTip: { x: f * -173, y: 53, r: 8, a: f > 0 ? 2.62 : Math.PI - 2.62 } };
  };
  function stingTip(e, aim) {   // origen y ángulo real del aguijón (anchors.stingTip.a), con la pose de la telegrafía
    var st = artState(e), an = null, f = e.face || 1;
    if (aim != null) st.aim = aim;
    if (ART()) { try { an = Assets.bossAnchors('melaria', st); } catch (x) { an = null; } }
    var t = an && (an.stingTip || an.aguijon);
    if (!t) return { x: e.x - f * 173, y: e.y + 53, a: aim != null ? aim : (f > 0 ? 2.62 : Math.PI - 2.62) };
    return { x: e.x + t.x, y: e.y + t.y, a: t.a != null ? t.a : (aim || 0) };
  }

  // ------------------------------------------------------------------ ganchos del motor
  H.pos = function () { return { x: 720, y: 300 }; };
  H.setup = function (e) {
    var a = A();
    a.dip = 0; a.stuckT = 0; a.swollenT = 0; a.hatch = []; a.shards = []; a.buzzT = 0; a.des = null; a.land2 = false; a.winT = -1e9; a.jhit = 0;
    e.cadMul = qn('mcad', D.cadK || 1); e.rise = 1; e.foot = D.gy; e.fly = true;
    S.cds.m_jalea = 12000; S.cds.m_panal = 6000; S.cds.m_eclosion = 5000; S.cds.m_llamada = 4000; S.cds.m_torbellino = 7000;
    S.obs.length = 0;
    setCaps(e);
  };
  H.move = function (e, dt) {
    var p = PL(), PH = D.phases[e.phase - 1], a = A(), d = G.dist(e.x, e.y, p.x, p.y), spd = PH.spd * (e.slowT > 0 ? 1 - e.slowPct : 1);
    if (e.broken.alas && PN.honeyAt(e.x, e.y + 30)) spd *= 0.55;   // aterrizada: la miel la frena un 45 %
    if (a.stuckT > 0) { e.moveAmt = 0; return; }
    if (!p.dead && d > 175) { U.moveToward(e, p.x, p.y, spd, dt); e.moveAmt = 1; e.curSpd = spd; } else e.moveAmt = 0;
    if (!p.dead && Math.abs(p.x - e.x) > 4) e.face = p.x >= e.x ? 1 : -1;
  };
  H.okNow = function (e, name, d) {
    switch (name) {
      case 'm_estocada': return d < 520;
      case 'm_picado': return d > 100;
      case 'm_lluvia': return d > 120 && d < 600;
      case 'm_torbellino': return d < 420;
      case 'm_eclosion': return d < 650;
      case 'm_alazo': return d < 190;
      default: return true;
    }
  };
  H.keepAtk = function () { return false; };
  H.onBreak = function (e, pe) {
    var k = pe.key, a = A();
    a.shards.push({ kind: k === 'alas' ? 'wing' : k === 'aguijon' ? 'sting' : 'crown', x: pe.x, y: pe.y, t0: G.time });
    if (k === 'alas') { G.Hud.banner('ALAS ROTAS: ATERRIZA', 1800, '#e6f7ff'); sfx('mel_land', { vol: 0.9 }); a.dip = 0; fx.dust(e.x, e.y + 60, 10); e.fly = false; }
    else if (k === 'aguijon') G.Hud.banner('SIN AGUIJÓN: SOLO GOLPES DE ALA', 1800, '#ffd27a');
    else if (k === 'corona') {
      G.Hud.banner('LA CORONA CAE: SIN JALEA REAL', 1800, '#eafff0');
      G.Combat.dropGem(pe.x + 20, pe.y + 10, 'heart', 20); var gg = G.gems[G.gems.length - 1]; if (gg) gg.jelly = true;   // gota de jalea: cura 20 HP (1 vez)
      sfx('mel_jelly_break', { vol: 0.8 });
    }
    winSt();
  };
  H.partStinger = function (e, pe) { try { G.Snd.play('stg_melaria_' + ({ alas: 'part_wings', aguijon: 'part_stinger', corona: 'part_crown' })[pe.key]); } catch (x) { /* audio */ } };
  H.clear = function (e) { var a = A(); a.stuckT = 0; a.swollenT = 0; a.dip = 0; };
  H.onGate = function (e) {
    try { Assets.music.setPhase(e.phase); } catch (x) { /* audio */ }
    setCaps(e);
    if (e.phase === 2) G.Hud.banner('EL ENJAMBRE DESPIERTA: PANAL ABIERTO Y TORBELLINO', 2200, '#ffc440');
    if (e.phase === 3) G.Hud.banner('LA REINA BRILLA: ECLOSIÓN MASIVA', 2400, '#ffe6f2');
  };

  // ------------------------------------------------------------------ arena viva: nidos que eclosionan, zumbido de alas
  H.tick = function (e, dt) {
    var a = A(), i, h;
    if (a.stuckT > 0) a.stuckT -= dt;
    if (a.swollenT > 0) a.swollenT -= dt;
    if (!(a.stuckT > 0) && a.dip < 0) a.dip = Math.min(0, a.dip + dt * 0.05);   // se eleva en 0,8 s
    e.fly = !(e.broken.alas || a.stuckT > 0 || a.land2);
    for (i = a.hatch.length - 1; i >= 0; i--) {
      h = a.hatch[i]; h.t -= dt;
      if (h.t <= 0) {
        a.hatch.splice(i, 1);
        if (addsLoad() + 0.5 <= addCap(e) + 1e-6 && e.mode === 'fight') { spawnAdd('bomb', h.x, h.y, 350); PN.sfx('larva_hatch', null, { vol: 0.7 }); fx.burst(h.x, h.y, 8, '#f0d98a', 140, 400, 3); }
      }
    }
    for (i = a.shards.length - 1; i >= 0; i--) if (G.time - a.shards[i].t0 > 900) a.shards.splice(i, 1);
    if (!e.fly || e.mode === 'intro') return;
    if ((a.buzzT -= dt) <= 0) { a.buzzT = 520; sfx('mel_wing_buzz', { pitch: 1 + 0.08 * (e.phase - 1), vol: 0.6 + 0.15 * (e.phase - 1) }); }
  };

  // ------------------------------------------------------------------ ATAQUES
  // ---- 1. Estocada real (requiere Aguijón): carril 70 x 420 desde la punta del aguijón; se echa atrás 150 ms y estoca a 380 px/s. Si falla queda expuesta 1,0 s (x1,25)
  function laneOrigin(e, A0, track) {
    var p = PL(), tip = stingTip(e, A0.aim);
    if (track) { A0.aim = Math.atan2(p.y - tip.y, p.x - tip.x); tip = stingTip(e, A0.aim); }
    A0.ox = tip.x; A0.oy = tip.y; A0.dir = tip.a;
  }
  ATK.m_estocada = {
    avail: function (e) { return !e.broken.aguijon; },
    start: function (e, A0) {
      A0.pose = 'estocada'; A0.len = 420; A0.w = 70 * geo('estocada'); A0.v = 380; A0.fixAt = A0.tele - 300; A0.actMs = 99999; A0.rec = 700; A0.hit = false; A0.s = 0; A0.back = 20; A0.drawAct = true;
      A0.aim = angTo(e, PL()); faceTo(e, A0.aim); laneOrigin(e, A0, true); sfx('mel_stab_tele', { vol: 0.9 });
    },
    tele: function (e, A0) { if (A0.t < A0.fixAt) { faceTo(e, angTo(e, PL())); laneOrigin(e, A0, true); } else laneOrigin(e, A0, false); },
    go: function (e, A0) { sfx('mel_stab_dash', { vol: 0.9 }); A0.t0x = e.x; A0.t0y = e.y; },
    act: function (e, A0, dt) {
      var p = PL(), ca = Math.cos(A0.dir), sa = Math.sin(A0.dir), step = dt / 1000;
      if (A0.t < 150) { e.x -= ca * 130 * step; e.y -= sa * 130 * step; A0.s = -A0.back * A0.t / 150; }
      else { var st = A0.v * step; e.x += ca * st; e.y += sa * st; A0.s += st; }
      var m = clampE(e.x, e.y); e.x = m[0]; e.y = m[1];
      var tx = A0.ox + ca * A0.s, ty = A0.oy + sa * A0.s;   // punta que avanza por el carril
      if (Math.random() < 0.4) fx.burst(tx, ty, 1, '#ffe9a0', 60, 300, 3, { add: true });
      if (!A0.hit && !p.dead && G.dist(tx, ty, p.x, p.y) < A0.w / 2 + p.r * 0.45) { A0.hit = true; hurt(e, 26, 'boss_estocada', { kb: 1.6 }); sfx('mel_stab', { vol: 1 }); fx.shake(6, 160); }
      breakPillarsNear(e.x, e.y + 20, 70);
      if (A0.s >= A0.len) {
        if (!A0.hit) { expose(e, 1.25, 1000, 'window'); sfx('mel_exposed', { vol: 0.8 }); winSt(); G.Hud.banner('¡EXPUESTA!', 900, '#e6f7ff'); }
        return true;
      }
      return false;
    },
    draw: function (c, e, A0) {
      var ex = A0.step === 'act' ? Math.max(0, A0.s) : 0;
      Assets.drawBossTele(c, 'stinglane', A0.ox + Math.cos(A0.dir) * ex, A0.oy + Math.sin(A0.dir) * ex, { w: A0.w, len: A0.len - ex, a: A0.dir, p: A0.step === 'tele' ? A0.t / A0.tele : 1, fix: A0.step !== 'tele' || A0.t >= A0.fixAt, sig: true, t: G.time });
    },
    haz: function (e, A0, out) {
      if (A0.step === 'tele') out.push({ k: 'lane', x: A0.ox, y: A0.oy, a: A0.dir, w: A0.w, len: A0.len, t0: A0.tele - A0.t, t1: A0.tele - A0.t + 1300 });
      else if (A0.step === 'act') out.push({ k: 'lane', x: A0.ox + Math.cos(A0.dir) * Math.max(0, A0.s), y: A0.oy + Math.sin(A0.dir) * Math.max(0, A0.s), a: A0.dir, w: A0.w, len: Math.max(40, A0.len - Math.max(0, A0.s)), t0: 0, t1: 1100 });
    }
  };

  // ---- 2. Zumbido en picado (firma): sombra creciente r 100; cae donde estaba el jugador; sobre miel queda atrapada 2,4 s (x1,35); si no, se eleva en 0,8 s. Alas rotas: Salto corto (sin ascenso). Peligro III: picado doble
  function diveTarget(e, A0) {
    var p = PL(), tx = p.x, ty = p.y - 24;
    if (A0.short) { var dx = tx - e.x, dy = ty - e.y, dd = Math.hypot(dx, dy); if (dd > 300) { tx = e.x + dx / dd * 300; ty = e.y + dy / dd * 300; } }
    var m = clampE(tx, ty); A0.tx = m[0]; A0.ty = m[1];
  }
  function diveImpact(e, A0) {
    var p = PL(), g = { x: A0.tx, y: A0.ty + 24 };
    e.x = A0.tx; e.y = A0.ty; e.lift = 0; A0.landed = true;
    fx.shake(8, 220); fx.hit(40); fx.dust(g.x, g.y, 14); fx.shockwave(g.x, g.y, 260); fx.ring(g.x, g.y, 20, 180, 350, '#fff3d6', 5);
    if (!p.dead && G.dist(g.x, g.y, p.x, p.y) <= A0.r + p.r * 0.4) hurt(e, 28, 'boss_picado', { kb: 1.5 });
    breakPillarsNear(g.x, g.y, 110);
    var a = A();
    if (!A0.short && PN.honeyAt(g.x, g.y)) {   // aterriza sobre miel: atrapada
      a.stuckT = 2400; a.dip = -40; A0.trapped = true; A0.rec = 2400; expose(e, 1.35, 2400, 'stun');
      sfx('mel_trapped', { vol: 1 }); G.Hud.banner('¡ATRAPADA EN LA MIEL!', 1400, '#e6f7ff'); winSt(); fx.burst(g.x, g.y, 14, '#c97a14', 200, 600, 4, { g: 200 });
    } else { a.dip = -40; A0.rec = 800; sfx('mel_dive', { vol: 1 }); }
  }
  ATK.m_picado = {
    start: function (e, A0) {
      A0.pose = 'picado'; A0.short = !!e.broken.alas; A0.r = 100 * geo('picado'); A0.sx = e.x; A0.sy = e.y; A0.n = pel().v3 && !A0.short ? 2 : 1; A0.k = 0; A0.sub = 'tele'; A0.lift0 = A0.short ? 0 : 170;
      A0.actMs = 450; A0.rec = 800; A0.fixAt = A0.tele - 250; A0.drawAct = true; diveTarget(e, A0); sfx('mel_dive_tele', { vol: 1 });
    },
    tele: function (e, A0) {
      var u = ease(A0.t / (A0.tele - 120)), gl = ease((A0.t - (A0.tele - 700)) / 700);
      e.lift = A0.lift0 * u; e.x = A0.sx + (A0.tx - A0.sx) * gl; e.y = A0.sy + (A0.ty - A0.sy) * gl; e.face = A0.tx >= A0.sx ? 1 : -1;
    },
    go: function (e, A0) { A0.sub = 'fall'; A0.hitDone = false; A0.landed = false; A0.liftF = e.lift; },
    act: function (e, A0, dt) {
      if (A0.sub === 'aim') {   // 2.º picado (Peligro III): re-aim de 600 ms, 300 ms de línea fija
        A0.subT += dt;
        if (A0.subT < 300) diveTarget(e, A0);
        var u = ease(A0.subT / 600); e.lift = A0.lift0 * u; e.x = A0.ax + (A0.tx - A0.ax) * u; e.y = A0.ay + (A0.ty - A0.ay) * u;
        if (A0.subT >= 600) { A0.sub = 'fall'; A0.t = 0; A0.hitDone = false; A0.liftF = e.lift; sfx('mel_dive_tele', { vol: 0.6, pitch: 1.2 }); }
        return false;
      }
      var F = A0.fallMs || 130; e.lift = (A0.liftF || 0) * (1 - G.clamp(A0.t / F, 0, 1));
      if (A0.t >= F && !A0.hitDone) {
        A0.hitDone = true; diveImpact(e, A0); A0.k++;
        if (A0.trapped) return true;
      }
      if (A0.t >= A0.actMs + F - 130 && A0.hitDone) {
        if (A0.k < A0.n) { A0.sub = 'aim'; A0.subT = 0; A0.ax = e.x; A0.ay = e.y; A0.r = Math.max(70, A0.r * 0.7); A0.fallMs = 300; diveTarget(e, A0);   // el 2.º picado: r x0,7 (mín. 70) y caída de 300 ms: tras los 300 ms de línea fija el jugador aún corre 600 ms = 114 px
 fx.shake(3, 100); sfx('mel_rise', { vol: 0.7 }); return false; }
        return true;
      }
      return false;
    },
    draw: function (c, e, A0) {
      if (A0.step === 'act' && A0.sub !== 'aim') return;
      var p = A0.step === 'tele' ? A0.t / A0.tele : A0.subT / 600, fix = A0.step === 'tele' ? A0.t >= A0.fixAt : A0.subT >= 300;
      Assets.drawBossTele(c, 'dive', A0.tx, A0.ty + 24, { r: A0.r, p: G.clamp(p, 0, 1), fix: fix, sig: true, t: G.time });
    },
    haz: function (e, A0, out) {
      if (A0.step === 'tele') out.push({ k: 'circle', x: A0.tx, y: A0.ty + 24, r: A0.r, t0: A0.tele - A0.t, t1: A0.tele - A0.t + 280, fixIn: Math.max(0, A0.fixAt - A0.t) });
      else if (A0.step === 'act' && A0.sub === 'aim') out.push({ k: 'circle', x: A0.tx, y: A0.ty + 24, r: A0.r, t0: 600 - A0.subT + 300, t1: 600 - A0.subT + 560, fixIn: Math.max(0, 300 - A0.subT) });
      else if (A0.step === 'act' && !A0.hitDone) out.push({ k: 'circle', x: A0.tx, y: A0.ty + 24, r: A0.r, t0: Math.max(0, 130 - A0.t), t1: 300 });
    }
  };

  // ---- 3. Lluvia de aguijones (requiere Aguijón): cono 80 grados desde la punta, 9 / 11 / 13 aguijones (F1-F3) a 230 px/s
  ATK.m_lluvia = {
    avail: function (e) { return !e.broken.aguijon; },
    start: function (e, A0) {
      A0.pose = 'lluvia'; A0.n = [9, 11, 13][e.phase - 1]; A0.arc = 80 * DEG * geo('lluvia'); A0.reach = 420; A0.fixAt = A0.tele * 0.6; A0.actMs = 250; A0.rec = 650;
      A0.aim = angTo(e, PL()); faceTo(e, A0.aim); laneOrigin(e, A0, true); sfx('mel_stingrain_tele', { vol: 0.9 });
    },
    tele: function (e, A0) { if (A0.t < A0.fixAt) { faceTo(e, angTo(e, PL())); laneOrigin(e, A0, true); } else laneOrigin(e, A0, false); },
    go: function (e, A0) {
      sfx('mel_stingrain', { vol: 0.9 }); fx.shake(3, 100);
      for (var i = 0; i < A0.n; i++) U.shootBoss(A0.ox, A0.oy, A0.dir - A0.arc / 2 + A0.arc * i / (A0.n - 1), 230, Math.min(32, 9 * dmgK()), 'proj_boss_quill', { r: 7, life: 2100, fb: 'arrow', src: 'boss_lluvia' });
    },
    act: function (e, A0) { return A0.t >= A0.actMs; },
    draw: function (c, e, A0) { Assets.drawBossTele(c, 'quills', A0.ox, A0.oy, { r: A0.reach, arc: A0.arc, n: A0.n, a: A0.dir, p: A0.t / A0.tele, fix: A0.t >= A0.fixAt, t: G.time }); },
    haz: function (e, A0, out) { if (A0.step === 'tele') out.push({ k: 'arc', x: A0.ox, y: A0.oy, r: A0.reach, inner: 0, a: A0.dir, arc: A0.arc, t0: A0.tele - A0.t, t1: A0.tele - A0.t + 200 }); }
  };

  // ---- 4. Llamada del enjambre: F1 2 Obreras; F2 2 + 1 Zángano (+1 Polinizador, máx. 1); F3 3 + 1; Corona rota: solo Obreras. Tope de adds 4 (6 en Peligro V), las Larvas cuentan 0,5
  ATK.m_llamada = {
    ok: function (e) { return addCap(e) - addsLoad() >= 2; },
    start: function (e, A0) {
      var P = pel(), room = addCap(e) - addsLoad(), p = PL(), list = [], i, nw = (e.phase === 3 ? 3 : 2) + P.adds;
      for (i = 0; i < nw; i++) list.push('worm');
      if (!e.broken.corona) {
        if (e.phase >= 2) list.push('boar');
        if (e.phase >= 2 && B.has('pollinator') && !G.enemies.some(function (q) { return !q.dead && q.type === 'pollinator' && q.bossAdd; })) list.push('pollinator');
      }
      var uniq = [], used = 0; list.forEach(function (ty) { if (used + 1 <= room + 1e-6) { uniq.push(ty); used++; } });
      A0.pose = 'llamada'; A0.actMs = 300; A0.rec = 600; A0.spots = []; var a0 = Math.random() * TAU;
      uniq.forEach(function (ty, k) {
        var cx, cy, tries = 0, an = a0 + k * 1.3;
        do { an += 1.1; cx = e.x + Math.cos(an) * 170; cy = e.y + 24 + Math.sin(an) * 150; tries++; } while (G.dist(cx, cy, p.x, p.y) < 110 && tries < 8);
        var ad = spawnAdd(ty, cx, cy, A0.tele); A0.spots.push({ x: ad.x, y: ad.y });
      });
      sfx('mel_call_tele', { vol: 0.9 });
    },
    go: function (e) { fx.ring(e.x, e.y + 24, 10, 160, 500, '#a060ff', 5); fx.shake(4, 150); sfx('mel_call', { vol: 0.9 }); },
    act: function (e, A0) { return A0.t >= A0.actMs; },
    draw: function (c, e, A0) { var g = gnd(e); Assets.drawBossTele(c, 'swarm', g.x, g.y, { r: 150, p: A0.t / A0.tele, t: G.time }); },
    haz: function () { }
  };

  // ---- 5. Panal abierto (F2-F3): 7-9 celdas en torno al jugador se llenan de miel (10 s) y 2-3 son nidos que eclosionan una Larva explosiva a los 1,5 s
  ATK.m_panal = {
    start: function (e, A0) {
      var p = PL(), cand = PN.cells.filter(function (c) { return c.st === 0 && !c.nest && G.dist(c.x, c.y, p.x, p.y) < 270; }), n = 7 + Math.floor(Math.random() * 3), opened = [], i;
      cand.sort(function (a, b) { return (G.dist(a.x, a.y, p.x, p.y) + Math.random() * 160) - (G.dist(b.x, b.y, p.x, p.y) + Math.random() * 160); });
      for (i = 0; i < cand.length && opened.length < n; i++) if (PN.openCell(cand[i], { tele: 1200, life: 10000, src: 'melaria' })) opened.push(cand[i]);
      var nn = Math.min(opened.length, 2 + Math.floor(Math.random() * 2)); A0.nests = [];
      var far = opened.slice().sort(function (a, b) { return G.dist(b.x, b.y, p.x, p.y) - G.dist(a.x, a.y, p.x, p.y); });   // los nidos, lejos del jugador (la Larva no nace encima)
      for (i = 0; i < nn; i++) A0.nests.push({ x: far[i].x, y: far[i].y, nest: true });
      A0.pose = 'panal'; A0.actMs = 450; A0.rec = 700; sfx('mel_comb_tele', { vol: 0.9 });
    },
    go: function (e, A0) {
      sfx('mel_comb_open', { vol: 0.9 }); fx.shake(3, 120); var a = A();
      A0.nests.forEach(function (n) { a.hatch.push({ x: n.x, y: n.y, t: 1500, t0: 1500 }); });
    },
    act: function (e, A0) { if (!A0.fell && A0.t > 250) { A0.fell = true; sfx('mel_comb_fall', { vol: 0.6 }); } return A0.t >= A0.actMs; },
    draw: function (c, e, A0) { if (A0.nests.length) Assets.drawBossTele(c, 'honeycells', 0, 0, { cells: A0.nests, r: 44, p: A0.t / A0.tele, fix: A0.t >= A0.tele * 0.7, t: G.time }); },
    haz: function () { }
  };

  // ---- 6. Torbellino alado (F2-F3, requiere Alas): rosquilla 100-260; el viento empuja hacia fuera; zona segura pegada al cuerpo
  ATK.m_torbellino = {
    avail: function (e) { return !e.broken.alas; },
    start: function (e, A0) { A0.pose = 'torbellino'; A0.in = 100 / geo('torbellino'); A0.out = 260 * geo('torbellino'); A0.actMs = 1200; A0.rec = 700; A0.hit = false; A0.drawAct = false; faceTo(e, angTo(e, PL())); sfx('mel_whirl_tele', { vol: 0.9 }); },
    go: function (e, A0) {
      var p = PL(), g = gnd(e), d = G.dist(g.x, g.y, p.x, p.y);
      sfx('mel_whirl', { vol: 0.9 }); fx.shake(4, 200);
      if (!p.dead && d >= A0.in && d <= A0.out + p.r * 0.4) { A0.hit = true; if (hurt(e, 18, 'boss_torbellino', { kb: 0.8 })) sfx('mel_whirl_hit', { vol: 0.9 }); }
    },
    act: function (e, A0, dt) {
      var p = PL(), g = gnd(e), d = G.dist(g.x, g.y, p.x, p.y), s = dt / 1000;
      if (!p.dead && d > A0.in && d < A0.out + 60) { var an = Math.atan2(p.y - g.y, p.x - g.x); p.x += Math.cos(an) * 170 * s; p.y += Math.sin(an) * 170 * s; if (PN.on) PN.pushIn(p, p.r); }   // viento: empuja hacia fuera
      if (Math.random() < 0.5) fx.burst(g.x + Math.cos(A0.t / 60) * 170, g.y + Math.sin(A0.t / 60) * 120, 1, '#ffe9a0', 80, 300, 3, { add: true });
      return A0.t >= A0.actMs;
    },
    draw: function (c, e, A0) { var g = gnd(e); Assets.drawBossTele(c, 'whirl', g.x, g.y, { r: A0.out, inner: A0.in, p: A0.t / A0.tele, fix: A0.t >= A0.tele * 0.7, t: G.time }); },
    haz: function (e, A0, out) { var g = gnd(e); if (A0.step === 'tele') out.push({ k: 'arc', x: g.x, y: g.y, r: A0.out, inner: A0.in, a: 0, arc: TAU + 0.2, t0: A0.tele - A0.t, t1: A0.tele - A0.t + 150 }); }
  };

  // ---- 7. Jalea real (requiere Corona): canal de 1600 ms; cura el 2,5 % del HP máx.; se interrumpe con >= 1,2 % de daño en el canal (o humo encima) o al romperse la Corona: aturdida 1 s (x1,25)
  var JTHR = 0.012;
  ATK.m_jalea = {
    avail: function (e) { return !e.broken.corona; },
    ok: function (e) { return e.hp < e.maxHp * 0.97; },
    start: function (e, A0) {
      A0.pose = 'jalea'; A0.tele = 1600; A0.actMs = 350; A0.rec = 700; A0.acc = 0; A0.lastHp = e.hp; A0.cut = false; A0.smoked = false; faceTo(e, angTo(e, PL())); sfx('mel_jelly_channel', { vol: 0.9 });
    },
    tele: function (e, A0) {
      var d = A0.lastHp - e.hp; if (d > 0) A0.acc += d; A0.lastHp = e.hp;
      if (!A0.smoked && PN.on && PN.inSmoke(e.x, e.y + 24, e.r + 20)) { A0.smoked = true; A0.acc += JTHR * e.maxHp * 0.5; }   // un golpe de humo durante el canal cuenta como daño
      if (A0.acc >= JTHR * e.maxHp && !A0.cut) { A0.cut = true; A0.tele = A0.t; }
    },
    go: function (e, A0) {
      if (A0.cut) {
        expose(e, 1.25, 1000, 'stun'); sfx('mel_jelly_break', { vol: 1 }); fx.shake(5, 160); fx.burst(e.x + 60, e.y - 60, 10, '#eafff0', 180, 500, 3, { add: true });
        G.Hud.banner('¡JALEA INTERRUMPIDA!', 1200, '#eafff0'); A0.rec = 1000; winSt(); A0.stunned = true; A0.actMs = 0; return;
      }
      var h = e.maxHp * 0.025; e.hp = Math.min(e.maxHp, e.hp + h); sfx('mel_jelly_heal', { vol: 0.9 });
      fx.ring(e.x + 60, e.y - 60, 10, 130, 500, '#eafff0', 5); fx.num(e.x, e.y - 100, '+' + Math.round(h), '#b8ff9a', true);
    },
    act: function (e, A0) { return A0.t >= A0.actMs; },
    draw: function (c, e, A0) { var g = gnd(e); Assets.drawBossTele(c, 'jelly', g.x, g.y, { r: 130, p: A0.t / 1600, hit: A0.acc / (JTHR * e.maxHp), t: G.time }); },
    haz: function () { }
  };

  // ---- 8. Eclosión masiva (F3): 4 Larvas explosivas en anillo (6 en Peligro V); luego el abdomen queda hinchado 3 s (x1,3)
  ATK.m_eclosion = {
    ok: function (e) { return addsLoad() + (pel().n >= 5 ? 3 : 2) <= addCap(e) + 1e-6; },
    start: function (e, A0) {
      var g = gnd(e), n = pel().n >= 5 ? 6 : 4, a0 = Math.random() * TAU; A0.pose = 'eclosion'; A0.actMs = 400; A0.rec = 700; A0.pts = [];
      for (var i = 0; i < n; i++) {
        var an = a0 + i * TAU / n, m = PN.clampPt(g.x + Math.cos(an) * 170, g.y + Math.sin(an) * 150, 40), ad = spawnAdd('bomb', m[0], m[1], A0.tele + 80); A0.pts.push({ x: ad.x, y: ad.y });
      }
      sfx('mel_hatch_tele', { vol: 0.9 });
    },
    go: function (e) {
      sfx('mel_hatch', { vol: 1 }); fx.shake(6, 200); fx.ring(e.x - 60, e.y, 10, 150, 500, '#c97a14', 5);
      A().swollenT = 3000; expose(e, 1.3, 3000, 'window'); winSt(); G.Hud.banner('¡ABDOMEN HINCHADO!', 1200, '#e6f7ff');
    },
    act: function (e, A0) { return A0.t >= A0.actMs; },
    draw: function (c, e, A0) { Assets.drawBossTele(c, 'larvae', 0, 0, { pts: A0.pts, r: 46, p: A0.t / A0.tele, t: G.time }); },
    haz: function () { }
  };

  // ---- (Aguijón roto) Golpe de ala: alcance 110, arco 140 grados, 18 de daño
  ATK.m_alazo = {
    avail: function (e) { return e.broken.aguijon; },
    start: function (e, A0) { A0.pose = 'alazo'; A0.aim = angTo(e, PL()); A0.reach = 110; A0.arc = 140 * DEG; A0.fixAt = A0.tele * 0.7; A0.actMs = 250; A0.rec = 600; faceTo(e, A0.aim); sfx('mel_stab_tele', { vol: 0.6, pitch: 1.3 }); },
    tele: function (e, A0) { if (A0.t < A0.fixAt) { A0.aim = angTo(e, PL()); faceTo(e, A0.aim); } },
    go: function (e, A0) {
      var p = PL(), g = gnd(e); fx.shake(4, 120); sfx('hit_heavy', { vol: 0.7, pitch: 1.2 }); fx.slash(g.x, g.y, A0.aim, A0.reach / 40, '#fff3d6');
      if (!p.dead && G.dist(g.x, g.y, p.x, p.y) <= A0.reach + p.r * 0.4 && Math.abs(G.angDiff(Math.atan2(p.y - g.y, p.x - g.x), A0.aim)) <= A0.arc / 2) hurt(e, 18, 'boss_alazo', { kb: 1.3 });
    },
    act: function (e, A0) { return A0.t >= A0.actMs; },
    draw: function (c, e, A0) { var g = gnd(e); Assets.drawBossTele(c, 'arc', g.x, g.y, { r: A0.reach, inner: 0, arc: A0.arc, a: A0.aim, p: A0.t / A0.tele, fix: A0.t >= A0.fixAt, t: G.time }); },
    haz: function (e, A0, out) { var g = gnd(e); if (A0.step === 'tele') out.push({ k: 'arc', x: g.x, y: g.y, r: A0.reach, inner: 0, a: A0.aim, arc: A0.arc, t0: A0.tele - A0.t, t1: A0.tele - A0.t + 150 }); }
  };

  // ------------------------------------------------------------------ ataque desesperado: Zumbido Mortal (10 s)
  // 5 anillos hexagonales concéntricos (R = k x 83 al vértice); cada 1,3 s uno (de fuera hacia dentro) se enciende 900 ms y hiere 18 durante 200 ms; 2 huecos de ~2 celdas por anillo, avisados. Sin miel. Últimos 2 s: aterriza aturdida
  var RC = { x: 720, y: 405 };
  function hexNorm(dx, dy) { return Math.max(Math.abs(dy), Math.abs(dx * COS30 + dy * 0.5), Math.abs(dx * COS30 - dy * 0.5)); }
  function ringContact(rg, x, y, pr) {
    var dx = x - RC.x, dy = y - RC.y;
    if (Math.abs(hexNorm(dx, dy) - rg.apo) > rg.th / 2 + pr * 0.5) return false;
    var ang = Math.atan2(dy, dx);
    for (var g = 0; g < rg.gaps.length; g++) if (Math.abs(G.angDiff(ang, rg.gaps[g])) < rg.gh) return false;
    return true;
  }
  S.melariaRingContact = ringContact;
  H.onDespair = function (e) {
    var a = A(), second = e.despLeft === 0 && !!pel().x2, rings = [], k, n = 0;
    for (k = 5; k >= 1; k--) {
      var R = k * 83, g0 = Math.random() * TAU;
      rings.push({ k: k, R: R, apo: R * COS30, th: 26, gh: Math.min(0.95, Math.atan(75 / R)), gaps: [g0, g0 + Math.PI + G.rnd(-0.5, 0.5)], at: 1000 + 1300 * n, state: 'idle', done: false, tg: 0 }); n++;
    }
    a.des = { rings: rings, fx: e.x, fy: e.y, second: second }; a.land2 = false; a.hatch.length = 0;
    PN.setCap(0, 1); for (var i = PN.activeCells().length - 1; i >= 0; i--) PN.sealCell(PN.activeCells()[i]);   // sin miel en estos 10 s
    expose(e, 1.25, 10600, 'despair'); winSt();
    try { Assets.music.setPhase(3); Assets.music.setDespair(true); } catch (x) { /* audio */ }
    G.Hud.banner('LOS ANILLOS SE ENCIENDEN: BUSCA LOS HUECOS', 2400, '#ffe6f2');
  };
  H.updDespair = function (e, dt) {
    var a = A(), p = PL(), ds = a.des, t, i, rg;
    e.despT += dt; e.moveAmt = 0; t = e.despT;
    var u = ease(t / 1000); e.x = ds.fx + (RC.x - ds.fx) * u; e.y = ds.fy + (RC.y - 24 - ds.fy) * u; e.roar = t < 2000 ? 1 : 0; e.lift = 0;
    for (i = 0; i < ds.rings.length; i++) {
      rg = ds.rings[i]; var w = t - rg.at;
      rg.state = w < 0 ? 'idle' : w < 900 ? 'warn' : w < 1100 ? 'hit' : 'done'; rg.p = G.clamp(w / 900, 0, 1);
      if (w >= 0 && !rg.tg) { rg.tg = 1; sfx('mel_ring_tele', { vol: 0.8 }); }
      if (rg.state === 'hit' && !rg.done) {
        if (!rg.snd) { rg.snd = 1; sfx('mel_ring', { vol: 0.9 }); fx.shake(3, 120); }
        if (!p.dead && ringContact(rg, p.x, p.y, p.r)) { rg.done = true; hurt(e, 18, 'boss_zumbido', { kb: 0.8 }); }
      }
    }
    if (t >= 8000 && !a.land2) { a.land2 = true; sfx('mel_land', { vol: 1 }); fx.shake(7, 220); fx.dust(e.x, e.y + 70, 12); }
    if (t >= 10000) {
      e.mode = 'fight'; e.cadT = 1500; e.roar = 0; a.land2 = false; a.des = null; a.dip = 0;
      e.exps = e.exps.filter(function (x) { return x.kind !== 'despair'; }); setCaps(e);
      try { Assets.music.setDespair(false); } catch (x) { /* audio */ }
      G.Hud.banner('El zumbido cede...', 1300, '#ffe0a0');
    }
  };
  H.onDeath = function (e) {
    var a = A(); a.des = null; a.hatch.length = 0; a.land2 = false; PN.setCap(24, 1);
    try { Assets.music.setDespair(false); Assets.music.stop(); G.Snd.play('stg_melaria_death'); } catch (x) { /* audio */ }
  };

  // ------------------------------------------------------------------ intro (3,5 s): el techo del panal se abre, desciende con 700 ms de zumbido, sacude y llama
  H.intro = function (e, I, t) {
    e.alpha = G.clamp(t / 400, 0, 1); e.rise = 1; e.moveAmt = 0;
    e.lift = t < 300 ? 160 : t < 1000 ? 160 * (1 - ease((t - 300) / 700)) : 0;
    if (t >= 100 && !I.m0) { I.m0 = true; fx.ring(720, 330, 20, 240, 600, '#fff3d6', 5); }
    if (t >= 300 && !I.m1) { I.m1 = true; sfx('mel_hover_down', { vol: 0.9 }); }
    if (t >= 1000 && !I.m2) { I.m2 = true; fx.shake(6, 180); fx.shockwave(e.x, e.y + 24, 300); fx.dust(e.x, e.y + 60, 12); fx.ring(e.x, e.y + 24, 20, 260, 500, '#f3a31f', 5); }
  };

  // ------------------------------------------------------------------ DIBUJO
  function drawFallback(c, e) {
    var f = e.face || 1, x = e.x, y = e.y - 40, t = G.time, al = e.alpha == null ? 1 : e.alpha, br = e.broken;
    c.save(); c.globalAlpha = al; c.lineJoin = 'round'; c.strokeStyle = OUT; c.lineWidth = 4;
    c.fillStyle = 'rgba(40,24,6,0.35)'; c.beginPath(); c.ellipse(x, e.y + 88, 90, 22, 0, 0, TAU); c.fill();
    c.fillStyle = '#e9f4ff'; if (!br.alas) { c.globalAlpha = al * 0.6; c.beginPath(); c.ellipse(x - f * 10, y - 70 + Math.sin(t / 40) * 6, 70, 30, -0.4 * f, 0, TAU); c.fill(); c.stroke(); c.globalAlpha = al; }
    c.fillStyle = e.hurtT > 0 ? '#fff' : '#f3a31f'; c.beginPath(); c.ellipse(x - f * 70, y + 8, 80, 34, 0.3 * f, 0, TAU); c.fill(); c.stroke();
    c.beginPath(); c.ellipse(x, y, 46, 42, 0, 0, TAU); c.fill(); c.stroke();
    c.fillStyle = '#2a1b10'; c.fillRect(x - 24, y - 10, 48, 8); c.beginPath(); c.arc(x + f * 64, y - 10, 28, 0, TAU); c.fillStyle = '#f3a31f'; c.fill(); c.stroke();
    if (!br.corona) { c.fillStyle = '#fff3d6'; c.fillRect(x + f * 56, y - 52, 16, 14); c.strokeRect(x + f * 56, y - 52, 16, 14); }
    if (!br.aguijon) { c.strokeStyle = OUT; c.lineWidth = 8; c.beginPath(); c.moveTo(x - f * 140, y + 20); c.lineTo(x - f * 176, y + 52); c.stroke(); }
    c.restore();
  }
  H.draw = function (c, e) {   // el arte de Melaria cuesta ~ como Yarlak: se mide (S.melariaInfo().drawMs) y en calidad Baja se pinta sin efectos (noFx)
    var a = A(), t0 = performance.now();
    if (ART()) Assets.drawBoss('melaria', c, e.x, e.y, artState(e)); else drawFallback(c, e);
    if (a.shards && Assets.drawMelariaShards) for (var i = 0; i < a.shards.length; i++) { var s = a.shards[i]; Assets.drawMelariaShards(c, s.x, s.y, G.clamp((G.time - s.t0) / 800, 0, 1), { kind: s.kind, n: G.Q && G.Q.level === 'baja' ? 4 : 8 }); }
    var dm = performance.now() - t0; a.drawMs = a.drawMs == null ? dm : a.drawMs * 0.97 + dm * 0.03; if (dm > (a.drawMax || 0)) a.drawMax = dm; a.drawN = (a.drawN || 0) + 1;
  };
  H.drawGhost = function (c, Dd) {
    if (ART()) { Assets.drawBoss('melaria', c, Dd.x, Dd.y, { t: G.time, id: 'melaria', facing: Dd.face, phase: 3, broken: Dd.broken, dying: true, dt: Dd.dt }); return; }
    drawFallback(c, { x: Dd.x, y: Dd.y + G.clamp(Dd.dt / 2600, 0, 1) * 40, face: Dd.face, alpha: 1 - G.clamp(Dd.dt / 3300, 0, 1), broken: Dd.broken, hurtT: 0 });
  };
  H.drawGround = function (c, e) {
    var a = A(), i, t = G.time;
    // nidos pendientes (Panal abierto): marcas rojas con la Larva hasta que eclosionan
    if (a.hatch.length && !(e.atk && e.atk.name === 'm_panal' && e.atk.step === 'tele')) Assets.drawBossTele(c, 'honeycells', 0, 0, { cells: a.hatch.map(function (h) { return { x: h.x, y: h.y, nest: true }; }), r: 44, p: 1 - a.hatch[0].t / a.hatch[0].t0, fix: true, t: t });
    if (a.des) {   // anillos hexagonales del Zumbido Mortal
      for (i = 0; i < a.des.rings.length; i++) {
        var rg = a.des.rings[i]; if (rg.state === 'done') continue;
        Assets.drawMelariaRing(c, RC.x, RC.y, rg.R, { state: rg.state, p: rg.p, gaps: rg.gaps, gapHalf: rg.gh, th: rg.th, t: t, alpha: rg.state === 'idle' ? 0.85 : 1 });
      }
    }
    if (e.atk && e.atk.step !== 'rec') { var A0 = e.atk, Hh = ATK[A0.name]; if (Hh.draw && (A0.step === 'tele' || A0.drawAct)) Hh.draw(c, e, A0); }
  };
  H.items = function () { };
  H.spawnMode = function (e) {   // calibración: ?msp=<k> multiplica el spawn normal de F1-F2 (doc B.5: x0,25)
    var k = qn('msp', D.spK || 1); if (k === 1 || e.phase >= 3) return null; var ph = D.phases[e.phase - 1].spawn; return { mul: ph.mul * k, allow: ph.allow, cap: ph.cap };
  };
  H.hazards = function (e, out) {
    var a = A(), i;
    if (a.des) for (i = 0; i < a.des.rings.length; i++) {
      var rg = a.des.rings[i], w = rg.at - e.despT; if (rg.state === 'done' || w > 2400) continue;
      out.push({ ref: rg, k: 'hexring', x: RC.x, y: RC.y, apo: rg.apo, th: rg.th, gh: rg.gh, gaps: rg.gaps, t0: Math.max(0, w + 900), t1: Math.max(0, w + 900) + 260 });
    }
  };
  H.force = function (e, name) { if (e.mode !== 'fight' || e.atk) return false; U.startAttack(e, name); return true; };
  S.melariaInfo = function () { var a = A(), e = S.e; return { stuckT: a.stuckT, swollenT: a.swollenT, hatch: a.hatch ? a.hatch.length : 0, rings: a.des ? a.des.rings.length : 0, load: addsLoad(), cap: e ? addCap(e) : 0, honey: PN.honeyCount ? PN.honeyCount() : 0, fly: e && e.fly, dip: a.dip, drawMs: a.drawMs, drawMax: a.drawMax, drawN: a.drawN }; };
})();
