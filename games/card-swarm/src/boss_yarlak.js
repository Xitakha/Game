/* boss_yarlak.js - Jefes v5 (fase P4): YARLAK, EL COLOSO GÉLIDO (Tundra). DESIGN-v5-biomas.md B.2 y B.7.
   Mamut-glaciar que camina (55 / 65 / 75 / 85 px/s) y carga con inercia sobre hielo. 4 fases + desesperado (Invierno Eterno), 8 ataques con la regla del hielo
   (telegrafía >= 250 + 220 + 1000 x salida / 190; ATKS[..].ice = true en boss.js), 3 partes (Colmillos, Armadura de hielo, Corazón helado = ventana),
   debilidades Fuego / Rayo y resistencia Hielo x0,6. Usa el hielo de la Tundra (tundra.js): estalagmitas (T.pillars), nieve firme (T.setPatchR), hogueras (T.setHeatR),
   ventisca (T.bz.boss, BZ.clearR) y Frío (T.coldAdd). Engancha en el motor genérico de boss.js (DEFS[id].h). Arte: assets_boss3.js (con dibujo de reserva aquí). */
(function () {
  'use strict';
  var G = window.G, S = G.Boss, fx = G.fx, E = G.Enemies, U = S && S.u, T = G.Tundra;
  if (!S || !U) return;
  var ATKS = S.ATKS, ATK = S.ATK, TAU = Math.PI * 2, DEG = Math.PI / 180, B = G.B;
  var ease = U.ease, angTo = U.angTo, sfx = U.sfx, pel = U.pel, expose = U.expose;
  // Calibración con el bot (README, Yarlak P4): el bot esquiva casi todo, así que el daño por golpe lleva un multiplicador propio (D.dmgK; ?ydmg=1.4 para probar). Nunca pasa de HIT_CAP 32
  function dmgK() { var m = /[?&]ydmg=([\d.]+)/.exec(location.search); return m ? +m[1] : (S.DEFS.yarlak.dmgK || 1); }
  function hurt(e, base, src, o) { return U.hurt(e, src === 'boss_embestida' ? base : Math.min(32, base * dmgK()), src, o); }
  function PL() { return G.player; }
  function A() { return S.A; }
  function ART() { try { return !!(Assets.drawBossBand !== undefined && Assets.bossIds().indexOf('yarlak') >= 0 && G.hasSpr('boss_yarlak_body')); } catch (x) { return false; } }
  var BZ = B.biomes.tundra.blizzard; if (BZ.clearR0 == null) BZ.clearR0 = BZ.clearR;
  var CRACKS = B.biomes.tundra.cracks;
  var OUT = '#1b1124';

  S.DEFS.yarlak = {
    id: 'yarlak', name: 'Yarlak, el Coloso Gélido', title: 'El invierno que camina', furia: 'DE YARLAK', hp: 8500, r: 96, gy: 100, deathMs: 3500, noFire: true,
    phases: [   // music = intensidad para el audio de Yarlak: 0,25 / 0,5 / 0,75 / 1,0 -> fases 1-4 de la pista 'boss_yarlak'
      { n: 'Primera nevada',  thr: 0.70, cad: 3000, spd: 55, music: 0.25, spawn: { mul: 0.25, allow: { worm: 1, archer: 1 }, cap: 15 } },
      { n: 'La manada',       thr: 0.45, cad: 2600, spd: 65, music: 0.5,  spawn: { mul: 0.25, allow: { worm: 1, archer: 1, frostwolf: 1 }, cap: 15 } },
      { n: 'Corazón helado',  thr: 0.20, cad: 2200, spd: 75, music: 0.75, spawn: { mul: 0.15, allow: { worm: 1 }, cap: 8 } },
      { n: 'Invierno eterno', thr: 0,    cad: 1900, spd: 85, music: 1.0,  spawn: { mul: 0, allow: {}, cap: 0 } }
    ],
    despairAt: 0.08, despair: 'Invierno Eterno',
    barCol: ['#5a9ad8', '#4a86d0', '#5fd0f0', '#bfeaff'], gateCol: ['#9fd8ff', '#9fd8ff', '#5ff0ff', '#fff3a0'], nameCol: '#bfeaff', winCol: ['#e8f6ff', '#8fd0ff'], roarSfx: 'boss_roar_yarlak',
    parts: {
      colmillos: { name: 'Colmillos',          pct: 0.09, hz: 1.15, trophy: 'ytusk',  r: 30 },
      armadura:  { name: 'Armadura de hielo',  pct: 0.11, hz: 1.0,  trophy: 'yplate', r: 44, fem: true },
      corazon:   { name: 'Corazón helado',     pct: 0.08, hz: 1.0,  trophy: 'yheart', r: 26, derr: { mul: 1.5, ms: 5000 }, stag: 0 }
    },
    weak: [{ tag: 'fire', mul: 1.25, phases: [1, 2, 3, 4] }, { tag: 'lightning', mul: 1.25, phases: [3, 4] }],
    resist: [{ tag: 'ice', mul: 0.6 }, { tag: 'poison', mul: 0.8 }],
    hpCal: 3.5, dmgK: 1.3,   // calibración con el bot (README, Yarlak P4): 3,0 del doc daba 98 % de victorias; 3,5 deja el p50 en ~140 s (límite 150 s)
    brasas: 14, brasasPart: 4, pf: 2, pfFirst: 3,
    guaranteed: { static: 2, wick: 2, thread: 1 },
    h: { camW: 0.35 }
  };
  var D = S.DEFS.yarlak, H = D.h;
  [['ytusk', 'trophy_yarlak_tusk', 'Colmillo de Yarlak'], ['yplate', 'trophy_yarlak_plate', 'Placa Glaciar'], ['yheart', 'trophy_yarlak_heart', 'Corazón de Escarcha']].forEach(function (t) {
    Object.defineProperty(S.TROPHY, t[0], { enumerable: true, configurable: true, get: function () { return { spr: G.hasSpr(t[1]) ? t[1] : 'trophy_pastor_horn', name: t[2] }; } });
  });
  S.EXIT.y_pisoton = 110; S.EXIT.y_embestida = 60; S.EXIT.y_cornada = 80; S.EXIT.y_aliento = 120; S.EXIT.y_alud = 60; S.EXIT.y_latido = 130; S.EXIT.y_ventisca = 140;

  // ------------------------------------------------------------------ utilidades
  function clampX(x, m) { return G.clamp(x, G.WALL + (m || 30), G.AW - G.WALL - (m || 30)); }
  function clampY(y, m) { return G.clamp(y, G.WALL + (m || 30), G.AH - G.WALL - (m || 30)); }
  function def(name, o) { o.b = 'yarlak'; o.ice = true; ATKS[name] = o; }
  def('y_pisoton',   { name: 'Pisotón de glaciar',   tele: 1100, cd: 8000,  dmg: 22, phases: [1, 2, 3, 4] });
  def('y_embestida', { name: 'Embestida glaciar',    tele: 1200, cd: 9000,  dmg: 30, phases: [1, 2, 3, 4], sig: true });
  def('y_cornada',   { name: 'Cornada ascendente',   tele: 950,  cd: 7000,  dmg: 24, phases: [1, 2, 3, 4] });
  def('y_aliento',   { name: 'Aliento polar',        tele: 1150, cd: 11000, dmg: 7,  phases: [1, 2, 3, 4] });
  def('y_llamada',   { name: 'Llamada de la manada', tele: 900,  cd: 20000, dmg: 0,  phases: [2, 3, 4] });
  def('y_alud',      { name: 'Alud',                 tele: 1000, cd: 14000, dmg: 18, phases: [2, 3, 4] });
  def('y_latido',    { name: 'Latido gélido',        tele: 1300, cd: 22000, dmg: 20, phases: [1, 2, 3, 4], sig: true });
  def('y_ventisca',  { name: 'Ventisca blanca',      tele: 1250, cd: 24000, dmg: 14, phases: [3, 4] });

  function pillarsOf() { return T.pillars; }
  function segBlocked(ox, oy, p) {   // ¿una estalagmita / bloque tapa el trayecto jefe -> jugador? (cobertura contra el Aliento)
    var dx = p.x - ox, dy = p.y - oy, l2 = dx * dx + dy * dy, i, o, list = pillarsOf().concat(S.obs);
    for (i = 0; i < list.length; i++) {
      o = list[i]; if (o.dead) continue;
      var t = l2 ? G.clamp(((o.x - ox) * dx + (o.y - oy) * dy) / l2, 0, 1) : 0;
      if (Math.hypot(ox + dx * t - o.x, oy + dy * t - o.y) < o.r + 4) return true;
    }
    return false;
  }
  function breakObs(o) {   // estalagmita del jefe / bloque de hielo
    if (o.dead) return; o.dead = true;
    fx.burst(o.x, o.y, 12, '#bfeaff', 220, 600, 4, { g: 260 }); fx.ring(o.x, o.y, 10, 60, 300, '#bfeaff', 4); sfx('ice_break', { vol: 0.6 });
  }
  function hitPillarsIn(fn) {   // aplica fn a cada obstáculo (T.pillars y S.obs) -> true si pare
    var i, o;
    for (i = 0; i < T.pillars.length; i++) { o = T.pillars[i]; if (!o.dead && fn(o, i, true)) return true; }
    for (i = 0; i < S.obs.length; i++) { o = S.obs[i]; if (!o.dead && fn(o, i, false)) return true; }
    return false;
  }
  function setChest(e, open) {
    var a = A(), h = e.parts.corazon; a.open = open;
    if (h && !h.dead) h.spawnT = open ? 0 : 99999;   // el Corazón solo se puede apuntar con el pecho abierto
  }
  function setBz(v) { T.bz.boss = v; }
  function addCold(n) { try { T.coldAdd(n); } catch (x) { /* sin Tundra */ } }
  function walls(e) { return G.WALL + e.r + 1; }

  // ------------------------------------------------------------------ ganchos del motor
  H.pos = function () { return { x: 720, y: 150 }; };
  H.setup = function (e, p) {
    var a = A();
    a.open = false; a.openU = 0; a.cracks = []; a.warns = []; a.bands = []; a.gust = 0; a.stepT = 0; a.coldK = pel().n >= 4 ? 1.3 : 1; a.des = null; a.fires = null; a.hitCool = 0;
    BZ.clearR = BZ.clearR0 * (pel().n >= 4 ? 300 / 330 : 1);   // Peligro IV: ventisca de r 300
    setBz(0);
    a.cad0 = (/[?&]ycad=([\d.]+)/.exec(location.search) || [0, D.cadK || 1])[1] * 1; e.cadMul = a.cad0; e.rise = 1; e.foot = D.gy;   // ?ycad=1.2 = calibración (más / menos cadencia)
    e.parts.corazon.spawnT = 99999;
    S.cds.y_latido = 9000; S.cds.y_ventisca = 6000; S.cds.y_alud = 5000; S.cds.y_llamada = 4000; S.cds.y_aliento = 2500;
    S.obs.length = 0;   // Yarlak no usa los troncos del Pastor: sus obstáculos son las estalagmitas de la Tundra
  };
  var FALL = { colmillos: { x: 125, y: 28, r: 30 }, armadura: { x: -40, y: -62, r: 46 }, corazon: { x: 12, y: -2, r: 26 } };
  H.anchors = function (e) {
    var f = e.face || 1;
    if (ART()) { try { var an = Assets.bossAnchors('yarlak', artState(e)); if (an && an.colmillos) return an; } catch (x) { /* reserva */ } }
    return { colmillos: { x: f * FALL.colmillos.x, y: FALL.colmillos.y, r: 30 }, armadura: { x: -f * 40, y: -62, r: 46 }, corazon: { x: f * 12, y: -2, r: 26 } };
  };
  H.move = function (e, dt) {
    var p = PL(), PH = D.phases[e.phase - 1], d = G.dist(e.x, e.y, p.x, p.y), spd = PH.spd * (e.slowT > 0 ? 1 - e.slowPct : 1), a = A();
    if (!p.dead && d > 150) { U.moveToward(e, p.x, p.y, spd, dt); T.collide(e, 66); e.moveAmt = 1; e.curSpd = spd; } else e.moveAmt = 0;
    if (!p.dead && Math.abs(p.x - e.x) > 4) e.face = p.x >= e.x ? 1 : -1;
    if (e.moveAmt) { a.stepT -= dt; if (a.stepT <= 0) { a.stepT = 560 - spd * 2; sfx('mammoth_step', { pitch: 1 + (spd - 55) / 300, vol: 0.5 }); fx.shake(1.2, 70); } }
  };
  H.okNow = function (e, name, d) {
    switch (name) {
      case 'y_pisoton': return d < 420;
      case 'y_embestida': return d > 180 && d < 760;
      case 'y_cornada': return d < 300;
      case 'y_aliento': return d > 120 && d < 560;
      default: return true;
    }
  };
  H.keepAtk = function () { return false; };
  H.partMul = function (e, pe) {   // Corazón: x2,0 total (la ventana ya multiplica el cuerpo)
    if (pe.key !== 'corazon') return 1;
    return 2.0 / Math.max(1, S.expo(e).mul);
  };
  H.mulExtra = function (e, tag, o) {   // Armadura entera: el cuerpo recibe x0,75 (los golpes a las partes no)
    return !e.broken.armadura && !(o && o.viaPart) ? 0.75 : 1;
  };
  var lastReflect = 0;
  H.bodyHit = function (e, full, o, tag) {
    var a = A(), ar = e.parts.armadura, he = e.parts.corazon;
    if (!e.broken.armadura && !(o && o.viaPart) && !(o && o.dot) && ar && !ar.dead) {   // la Armadura se desgasta con el 30 % del daño al cuerpo (x1,5 si es Fuego: derrite)
      ar.meter -= full * 0.30 * (tag === 'fire' ? 1.5 : 1); ar.flash = 60;
      if (tag === 'ice' && o && !o.proj && G.time - lastReflect > 400) { lastReflect = G.time; addCold(1); }   // reflexión de Frío mientras está entera
      if (ar.meter <= 0 && !ar.dead) S.breakPart(e, ar);
    }
    if (a.open && he && !he.dead && !(o && o.viaPart) && !(o && o.dot)) { he.meter -= full * 0.5; he.flash = 80; if (he.meter <= 0 && !he.dead) S.breakPart(e, he); }   // con el pecho abierto el cuerpo también llena el medidor del Corazón
  };
  H.onBreak = function (e, pe) {
    var k = pe.key;
    if (k === 'colmillos') G.Hud.banner('SIN COLMILLOS: SIN CORNADA', 1800, '#f1ead2');
    else if (k === 'armadura') G.Hud.banner('LA ARMADURA CEDE: SE VE EL CORAZÓN', 1800, '#9fd8ff');
    else if (k === 'corazon') {
      setChest(e, false); e.exps = e.exps.filter(function (x) { return x.kind !== 'window' && x.kind !== 'despair' || x.mul >= 1.5; });
      e.cadMul = A().cad0 * 1.2;   // modo Invierno profundo
      G.Hud.banner('¡INVIERNO PROFUNDO! +20 % CADENCIA', 1800, '#5ff0ff'); fx.shake(9, 300);
    }
  };
  H.partStinger = function (e, pe) { try { G.Snd.play('stg_yarlak_' + ({ colmillos: 'part_tusk', armadura: 'part_armor', corazon: 'part_heart' })[pe.key]); } catch (x) { /* audio */ } };
  H.clear = function (e) {
    var a = A(); a.bands.length = 0; a.warns.length = 0;
    if (a.open) { setChest(e, false); e.exps = e.exps.filter(function (x) { return x.kind !== 'window'; }); }
  };
  H.onGate = function (e) {
    var a = A();
    try { Assets.music.setPhase(e.phase); } catch (x) { /* audio */ }
    if (e.phase === 2) G.Hud.banner('LAS GRIETAS SE ABREN', 2200, '#6ac8ff');
    if (e.phase === 3) { T.setPatchR(90); setBz(0.25); G.Hud.banner('LA COSTRA SE AGRIETA: SE VE EL CORAZÓN', 2400, '#5ff0ff'); }
    if (e.phase === 4) { T.setPatchR(70); setBz(0.35); G.Hud.banner('LA NIEVE FIRME SE ENCOGE', 2400, '#fff3a0'); }
    for (var k = 0; k < G.enemies.length; k++) { var q = G.enemies[k]; if (!q.dead && q.type === 'bosspart') continue; }
    a.warns.length = 0;
  };

  // ------------------------------------------------------------------ arena viva: grietas, avisos de estalagmita, olas, ventisca
  function crackSeg(i) { var k = CRACKS[i], x0 = k[0] - k[2] / 2; return { x0: x0, y0: k[1], x1: x0 + k[2], y1: k[1] + k[2] * k[3] }; }
  function distSeg(px, py, s) {
    var dx = s.x1 - s.x0, dy = s.y1 - s.y0, l2 = dx * dx + dy * dy, t = G.clamp(((px - s.x0) * dx + (py - s.y0) * dy) / l2, 0, 1);
    return Math.hypot(px - (s.x0 + dx * t), py - (s.y0 + dy * t));
  }
  function openCrack(e, x, y) {
    var a = A(), best = -1, bd = 120;
    for (var i = 0; i < CRACKS.length; i++) { var d = distSeg(x, y, crackSeg(i)); if (d < bd) { bd = d; best = i; } }
    if (best < 0) return;
    for (var j = 0; j < a.cracks.length; j++) if (a.cracks[j].i === best) { a.cracks[j].t = 8000; return; }
    a.cracks.push({ i: best, t: 8000 }); sfx('yar_chasm', { vol: 0.7 }); fx.shake(4, 150);
    var s = crackSeg(best); for (var k = 0; k < 8; k++) fx.burst(s.x0 + (s.x1 - s.x0) * k / 7, s.y0 + (s.y1 - s.y0) * k / 7, 3, '#bfeaff', 120, 400, 3, { add: true });
  }
  function addStal(x, y) {
    var n = 0, i, first = -1;
    for (i = 0; i < S.obs.length; i++) if (S.obs[i].kind === 'bstal' && !S.obs[i].dead) { n++; if (first < 0) first = i; }
    if (n >= 6) breakObs(S.obs[first]);
    var o = { x: x, y: y, r: 22, hp: 300, dead: false, shake: 0, sortY: y + 8, kind: 'bstal', born: G.time, draw: drawStal };
    S.obs.push(o); S.pushOutOne(o, PL(), PL().r); return o;
  }
  H.tick = function (e, dt) {
    var a = A(), p = PL(), i, k, w;
    a.openU += ((a.open ? 1 : 0) - a.openU) * Math.min(1, dt / 160);
    if (a.hitCool > 0) a.hitCool -= dt;
    // limpieza de obstáculos del jefe (estalagmitas 20 s, bloques de hielo 6 s)
    for (i = S.obs.length - 1; i >= 0; i--) {
      var o = S.obs[i]; if (o.dead) { S.obs.splice(i, 1); continue; }
      if (o.kind === 'bstal' && G.time - o.born > 20000) breakObs(o);
      else if (o.kind === 'iceblock' && G.time - o.born > 6000) breakObs(o);
    }
    // grietas abiertas: agua helada (ralentiza 40 %, +6 de Frío/s, sin daño)
    for (i = a.cracks.length - 1; i >= 0; i--) {
      var c = a.cracks[i]; c.t -= dt; if (c.t <= 0) { a.cracks.splice(i, 1); continue; }
      if (!p.dead && distSeg(p.x, p.y, crackSeg(c.i)) < 24) { G.Player.slow(p, 0.4, 250); addCold(6 * dt / 1000); }
    }
    // avisos de estalagmita (Pisotón): círculo rojo r 26 y erupción a los 900 ms
    for (i = a.warns.length - 1; i >= 0; i--) {
      w = a.warns[i]; w.t += dt;
      if (w.t >= w.imp) {
        a.warns.splice(i, 1);
        sfx('yar_spike', { vol: 0.6 }); fx.burst(w.x, w.y, 10, '#bfeaff', 200, 500, 4, { add: true }); fx.shake(3, 100);
        if (!p.dead && G.dist(w.x, w.y, p.x, p.y) <= w.r + p.r * 0.5) hurt(e, 12, 'boss_estalagmita', { kb: 1.4 });
        addStal(w.x, w.y);
      }
    }
    // olas de la Ventisca blanca
    for (i = a.bands.length - 1; i >= 0; i--) {
      var b = a.bands[i]; b.x += b.dir * b.v * dt / 1000;
      if (!p.dead && Math.abs(p.x - b.x) < b.w / 2 + p.r * 0.5) {
        if (Math.abs(p.y - b.gap) > 70 - p.r * 0.3) {
          p.x += b.dir * b.v * 0.45 * dt / 1000;   // empuja en su dirección
          if (!b.hit && S.noHurt <= 0) { b.hit = true; hurt(e, 14, 'boss_ventisca', { kb: 0.5 }); p.kx = (p.kx || 0) + b.dir * 320; }
        }
      }
      if ((b.dir > 0 && b.x > G.AW + 90) || (b.dir < 0 && b.x < -90)) a.bands.splice(i, 1);
    }
    // ventisca: ráfaga de 6 s tras la Ventisca blanca (alpha 0,45)
    if (a.gust > 0) { a.gust -= dt; setBz(Math.max(a.gust > 0 ? 0.45 : 0, e.mode === 'despair' ? 0.6 : e.phase === 3 ? 0.25 : e.phase === 4 ? 0.35 : 0)); }
    e.face = p.x >= e.x ? 1 : -1;
    if (e.mode === 'fight' && a.gust <= 0 && !a.des) setBz(e.phase === 3 ? 0.25 : e.phase === 4 ? 0.35 : 0);
  };

  // ------------------------------------------------------------------ ATAQUES
  // ---- 1. Pisotón de glaciar: círculo r 130 + anillo de hielo con hueco de 70 grados + 3 estalagmitas avisadas
  ATK.y_pisoton = {
    start: function (e, A0) {
      var sgn = Math.random() < 0.5 ? -1 : 1; A0.ga = angTo(e, PL()) + sgn * G.rnd(25, 65) * DEG; A0.pose = 'pisoton'; A0.actMs = 450; A0.rec = 800; A0.dmg = 22; A0.cr = 130;
      A0.st = []; var a0 = Math.random() * TAU;
      for (var i = 0; i < 3; i++) { var an = a0 + i * TAU / 3 + G.rnd(-0.4, 0.4), d = G.rnd(160, 220); A0.st.push({ x: clampX(e.x + Math.cos(an) * d, 40), y: clampY(e.y + Math.sin(an) * d, 40) }); }
      sfx('yar_stomp_tele', { vol: 0.9 });
    },
    tele: function (e, A0) { e.face = Math.cos(angTo(e, PL())) >= 0 ? 1 : -1; },
    go: function (e, A0) {
      var p = PL(), a = A();
      fx.shake(8, 220); sfx('yar_stomp', { vol: 0.9 }); sfx('yar_ring', { vol: 0.7 }); fx.dust(e.x, e.y + 80, 10); fx.ring(e.x, e.y + 60, 20, A0.cr, 350, '#ffffff', 5);
      if (!p.dead && G.dist(e.x, e.y, p.x, p.y) <= A0.cr) hurt(e, A0.dmg, 'boss_pisoton', { kb: 1.3 });
      S.waves.push({ x: e.x, y: e.y, r: A0.cr, v: 190, th: 24, gaps: [{ a: A0.ga, w: 70 * DEG }], dmg: A0.dmg, delay: 0, hit: false, maxR: 640, style: ART() ? 3 : 0, src: 'boss_pisoton', ref: A0 });
      if (e.phase >= 2) openCrack(e, e.x, e.y);
      A0.st.forEach(function (s) { a.warns.push({ x: s.x, y: s.y, r: 26, t: 0, imp: 900 }); });
      sfx('yar_spike_tele', { vol: 0.5 });
    },
    act: function (e, A0) { return A0.t >= A0.actMs; },
    draw: function (c, e, A0) {
      Assets.drawBossTele(c, 'circle', e.x, e.y + 20, { r: A0.cr, p: A0.t / A0.tele, fix: A0.t >= A0.tele * 0.7, t: G.time });
      Assets.drawBossTele(c, 'ring', e.x, e.y + 20, { r: 330, th: 24, gap: 70 * DEG, a: A0.ga, p: A0.t / A0.tele, fix: A0.t >= A0.tele * 0.7, color: 'blue', t: G.time });
    },
    haz: function (e, A0, out) {
      if (A0.step !== 'tele') return;
      out.push({ k: 'circle', x: e.x, y: e.y, r: A0.cr, t0: A0.tele - A0.t, t1: A0.tele - A0.t + 150 });
      out.push({ k: 'wave', x: e.x, y: e.y, r: A0.cr, v: 190, th: 24, gaps: [{ a: A0.ga, w: 70 * DEG }], t0: A0.tele - A0.t, t1: A0.tele - A0.t + (640 - A0.cr) / 190 * 1000 });
    }
  };

  // ---- 2. Embestida glaciar (firma): acelera 0 -> 460 px/s en 750 ms, recorre 560 px y derrapa 220 px; choque = aturdido 2,4 s x1,35
  ATK.y_embestida = {
    start: function (e, A0) {
      A0.aim = angTo(e, PL()); A0.len = 560; A0.skid = 220; A0.w = e.broken.colmillos ? 90 : 110; A0.v = 0; A0.trav = 0; A0.fixAt = A0.tele - 350; A0.pose = 'embestida'; A0.actMs = 99999; A0.rec = 1200; A0.hit = false; A0.skidding = false;
      sfx('yar_charge_tele', { vol: 0.9 });
    },
    tele: function (e, A0) { if (A0.t < A0.fixAt) { A0.aim = angTo(e, PL()); e.face = Math.cos(A0.aim) >= 0 ? 1 : -1; } },
    go: function (e, A0) { sfx('yar_charge_go', { vol: 0.9 }); fx.shake(3, 90); e.face = Math.cos(A0.aim) >= 0 ? 1 : -1; },
    act: function (e, A0, dt) {
      var p = PL(), s, step, res = null, ca = Math.cos(A0.aim), sa = Math.sin(A0.aim);
      if (!A0.skidding) A0.v = Math.min(460, 460 * A0.t / 750);
      else { A0.v *= Math.exp(-460 / A0.skid * dt / 1000); }
      step = A0.v * dt / 1000; e.x += ca * step; e.y += sa * step; A0.trav += step;
      if (Math.random() < 0.5) fx.dust(e.x - ca * 60, e.y + 80, 1);
      if (!A0.hit && !p.dead && G.dist(e.x, e.y, p.x, p.y) < A0.w / 2 + 6 + p.r) { A0.hit = true; hurt(e, 30, 'boss_embestida', { kb: 1.6 }); }
      var tough = e.broken.colmillos;
      hitPillarsIn(function (o, i, isT) {
        if (Math.hypot(o.x - e.x, o.y - e.y) < 62 + o.r) { if (!tough) { if (isT) T.breakPillar(i); else breakObs(o); } res = 'pillar'; return true; }
        return false;
      });
      var m = walls(e), miny = G.WALL + 110;
      if (e.x <= m || e.x >= G.AW - m || e.y <= miny || e.y >= G.AH - m) { e.x = G.clamp(e.x, m, G.AW - m); e.y = G.clamp(e.y, miny, G.AH - m); res = res || 'wall'; }
      if (res) {
        A0.stunned = true; A0.rec = 2400; expose(e, 1.35, 2400, 'stun'); fx.shake(9, 300); fx.hit(60); sfx('tusk_crash', { vol: 1 }); fx.ring(e.x, e.y, 20, 160, 350, '#ffffff', 5); G.Hud.banner('¡ATURDIDO!', 1000, '#bfeaff');
        return true;
      }
      if (!A0.skidding && A0.trav >= A0.len) { A0.skidding = true; sfx('yar_skid', { vol: 0.8 }); }
      if (A0.skidding && A0.v < 8) { A0.rec = 1200; expose(e, 1.1, 1200, 'window'); return true; }
      return false;
    },
    draw: function (c, e, A0) {
      if (ART()) { Assets.drawBossTele(c, 'skidlane', e.x, e.y + 20, { w: A0.w, len: A0.len, skid: A0.skid, a: A0.aim, p: A0.t / A0.tele, fix: A0.t >= A0.fixAt, sig: true, t: G.time }); return; }
      Assets.drawBossTele(c, 'lane', e.x, e.y + 20, { w: A0.w, len: A0.len, a: A0.aim, p: A0.t / A0.tele, fix: A0.t >= A0.fixAt, sig: true, t: G.time });
      // tramo de derrape: punteado y más claro
      c.save(); c.translate(e.x, e.y + 20); c.rotate(A0.aim); c.fillStyle = 'rgba(190,225,255,0.20)'; c.fillRect(A0.len, -A0.w / 2, A0.skid, A0.w);
      c.strokeStyle = 'rgba(220,240,255,0.95)'; c.lineWidth = 3; c.setLineDash([6, 8]); c.lineDashOffset = -G.time / 40; c.strokeRect(A0.len, -A0.w / 2, A0.skid, A0.w); c.restore();
    },
    haz: function (e, A0, out) {
      if (A0.step === 'tele') out.push({ k: 'lane', x: e.x, y: e.y, a: A0.aim, w: A0.w, len: A0.len + A0.skid, t0: A0.tele - A0.t, t1: A0.tele - A0.t + 2400 });
      else if (A0.step === 'act') out.push({ k: 'lane', x: e.x, y: e.y, a: A0.aim, w: A0.w, len: Math.max(60, A0.len + A0.skid - A0.trav), t0: 0, t1: 1500 });
    }
  };

  // ---- 3. Cornada ascendente (requiere Colmillos): cono 90 grados, alcance 220, empuje 90 px; rompe estalagmitas
  ATK.y_cornada = {
    avail: function (e) { return !e.broken.colmillos; },
    start: function (e, A0) { A0.aim = angTo(e, PL()); A0.reach = 220; A0.arc = 90 * DEG; A0.fixAt = A0.tele * 0.7; A0.pose = 'cornada'; A0.actMs = 200; A0.rec = 700; sfx('yar_gore_tele', { vol: 0.9 }); },
    tele: function (e, A0) { if (A0.t < A0.fixAt) { A0.aim = angTo(e, PL()); e.face = Math.cos(A0.aim) >= 0 ? 1 : -1; } },
    go: function (e, A0) {
      var p = PL(); fx.shake(6, 180); sfx('yar_gore', { vol: 0.9 }); fx.slash(e.x, e.y, A0.aim, A0.reach / 40, '#bfeaff');
      if (!p.dead && G.dist(e.x, e.y, p.x, p.y) <= A0.reach + p.r * 0.5 && Math.abs(G.angDiff(angTo(e, p), A0.aim)) <= A0.arc / 2) hurt(e, 24, 'boss_cornada', { kb: 1.5 });
      hitPillarsIn(function (o, i, isT) { if (G.dist(e.x, e.y, o.x, o.y) <= A0.reach + o.r && Math.abs(G.angDiff(Math.atan2(o.y - e.y, o.x - e.x), A0.aim)) <= A0.arc / 2 + 0.2) { if (isT) T.breakPillar(i); else breakObs(o); } return false; });
    },
    act: function (e, A0) { return A0.t >= A0.actMs; },
    draw: function (c, e, A0) { Assets.drawBossTele(c, 'cone', e.x, e.y + 20, { r: A0.reach, arc: A0.arc, a: A0.aim, p: A0.t / A0.tele, fix: A0.t >= A0.fixAt, t: G.time }); },
    haz: function (e, A0, out) { if (A0.step === 'tele') out.push({ k: 'arc', x: e.x, y: e.y, r: A0.reach, inner: 0, a: A0.aim, arc: A0.arc, t0: A0.tele - A0.t, t1: A0.tele - A0.t + 150 }); }
  };

  // ---- 4. Aliento polar: cono azul 50 grados, alcance 480, barre 30 grados en 1,2 s (Peligro III: ida y vuelta); 7 de daño cada 250 ms y +5 de Frío
  function breathOrigin(e, aim) {   // origen del aliento = punta de la trompa (ancla `breath` del arte); sin arte, el centro del cuerpo
    if (ART()) { try { var st = artState(e); st.windup = 'aliento'; st.wp = 1; st.strike = null; st.aim = aim; var an = Assets.bossAnchors('yarlak', st); if (an && an.breath) return { x: e.x + an.breath.x, y: e.y + an.breath.y }; } catch (x) { /* reserva */ } }
    return { x: e.x, y: e.y + 20 };
  }
  function setOrigin(e, A0, aim) { var o = breathOrigin(e, aim); A0.ox = o.x; A0.oy = o.y; }
  function breathAim(A0) {
    var u = A0.sweepMs ? G.clamp(A0.t / A0.sweepMs, 0, 1) : 0;
    if (A0.back) u = u < 0.5 ? u * 2 : (1 - u) * 2;   // ida y vuelta
    return A0.base + A0.dirS * (u - 0.5) * 30 * DEG;
  }
  function breathTick(e, A0, dt, aim) {
    var p = PL(); A0.tk = (A0.tk || 0) - dt;
    if (Math.random() < 0.9) { var d = G.rnd(60, A0.reach), an = aim + G.rnd(-0.4, 0.4); fx.burst(A0.ox + Math.cos(an) * d, A0.oy + Math.sin(an) * d, 1, '#e8f6ff', 60, 400, 3, { add: true }); }
    if (A0.tk > 0) return;
    A0.tk = 250;
    var d2 = G.dist(A0.ox, A0.oy, p.x, p.y);
    if (!p.dead && d2 <= A0.reach + p.r && Math.abs(G.angDiff(Math.atan2(p.y - A0.oy, p.x - A0.ox), aim)) <= A0.half && !segBlocked(A0.ox, A0.oy, p)) {
      if (hurt(e, 7, 'boss_aliento', { soft: true })) { addCold(5); sfx('yar_breath_tick', { vol: 0.5 }); }
    }
  }
  ATK.y_aliento = {
    start: function (e, A0) {
      A0.base = angTo(e, PL()); setOrigin(e, A0, A0.base); A0.reach = 480; A0.half = 25 * DEG; A0.dirS = Math.random() < 0.5 ? -1 : 1; A0.back = !!pel().v3; A0.sweepMs = A0.back ? 2400 : 1200; A0.actMs = A0.sweepMs; A0.fixAt = A0.tele * 0.7; A0.pose = 'aliento'; A0.rec = 600; A0.drawAct = true; A0.tk = 0;
      sfx('yar_breath_tele', { vol: 0.9 });
    },
    tele: function (e, A0) { if (A0.t < A0.fixAt) { A0.base = angTo(e, PL()); e.face = Math.cos(A0.base) >= 0 ? 1 : -1; } setOrigin(e, A0, A0.base); },
    go: function (e, A0) { sfx('ice_breath', { vol: 0.8 }); fx.shake(2, 200); },
    act: function (e, A0, dt) { var aim = breathAim(A0); setOrigin(e, A0, aim); breathTick(e, A0, dt, aim); return A0.t >= A0.actMs; },
    draw: function (c, e, A0) {
      if (A0.step === 'tele') Assets.drawBossTele(c, ART() ? 'polar' : 'cone', A0.ox, A0.oy, { r: A0.reach, arc: ART() ? 50 * DEG : 80 * DEG, sweep: 30 * DEG, a: A0.base, p: A0.t / A0.tele, fix: A0.t >= A0.fixAt, color: 'blue', t: G.time });
      else if (A0.step === 'act' && !ART()) Assets.drawBossTele(c, 'cone', A0.ox, A0.oy, { r: A0.reach, arc: 50 * DEG, a: breathAim(A0), p: 1, fix: true, color: 'blue', t: G.time });
    },
    haz: function (e, A0, out) {
      if (A0.step === 'tele') out.push({ k: 'arc', x: A0.ox, y: A0.oy, r: A0.reach, inner: 0, a: A0.base, arc: 80 * DEG, t0: A0.tele - A0.t, t1: A0.tele - A0.t + A0.actMs });
      else if (A0.step === 'act') out.push({ k: 'arc', x: A0.ox, y: A0.oy, r: A0.reach, inner: 0, a: A0.base, arc: 80 * DEG, t0: 0, t1: A0.actMs - A0.t });
    }
  };

  // ---- 5. Llamada de la manada: 2 / 3 Lobos de escarcha (+1 por Peligro), en F4 +1 Cazador
  ATK.y_llamada = {
    ok: function (e) { return U.addsAlive() < pel().cap - 1; },
    start: function (e, A0) {
      var P = pel(), room = P.cap - U.addsAlive(), p = PL(), n = (e.phase === 2 ? 2 : 3) + P.adds, list = [], i;
      n = Math.max(0, Math.min(n, room)); for (i = 0; i < n; i++) list.push(B.has('frostwolf') ? 'frostwolf' : 'worm');
      if (e.phase === 4 && list.length < room && B.has('archer')) list.push('archer');
      A0.pose = 'llamada'; A0.actMs = 300; A0.rec = 600; A0.spots = []; var a0 = Math.random() * TAU;
      list.forEach(function (ty, k) {
        var cx, cy, tries = 0, an = a0 + k * 1.3;
        do { an += 1.1; cx = e.x + Math.cos(an) * 170; cy = e.y + Math.sin(an) * 150; tries++; } while (G.dist(cx, cy, p.x, p.y) < 110 && tries < 8);
        cx = clampX(cx, 40); cy = clampY(cy, 40);
        var ad = E.spawn(ty, cx, cy, { summoned: true, spawnT: A0.tele }); ad.bossAdd = true; A0.spots.push({ x: cx, y: cy });
      });
      sfx('yar_call_tele', { vol: 0.9 });
    },
    go: function (e) { fx.ring(e.x, e.y, 10, 150, 500, '#a060ff', 5); fx.shake(4, 150); sfx('yar_call', { vol: 0.9 }); },
    act: function (e, A0) { return A0.t >= A0.actMs; },
    draw: function (c, e, A0) { Assets.drawBossTele(c, 'summon', e.x, e.y + 20, { r: 120, p: A0.t / A0.tele, t: G.time }); },
    haz: function () { }
  };

  // ---- 6. Alud: 8 bloques (12 en Peligro III+) caen cada 220 ms; los 3 primeros sobre la trayectoria del jugador; dejan bloques de hielo 6 s
  ATK.y_alud = {
    start: function (e, A0) {
      var p = PL(), n = pel().v3 ? 12 : 8, i, ang = Math.atan2(p.vy || 0, p.vx || 0), mv = Math.hypot(p.vx || 0, p.vy || 0) > 40, sp = [];
      if (!mv) ang = Math.random() * TAU;
      for (i = 0; i < 3; i++) sp.push({ x: clampX(p.x + (p.vx || 0) * (0.35 + 0.25 * i) + G.rnd(-12, 12), 50), y: clampY(p.y + (p.vy || 0) * (0.35 + 0.25 * i) + G.rnd(-12, 12), 50) });
      var last = sp[2], line = ang + (Math.random() < 0.5 ? 1 : -1) * 70 * DEG;
      for (i = 3; i < n; i++) sp.push({ x: clampX(last.x + Math.cos(line) * (i - 2) * (n > 8 ? 85 : 110), 50), y: clampY(last.y + Math.sin(line) * (i - 2) * (n > 8 ? 85 : 110), 50) });
      sp.forEach(function (s, k) { s.imp = k * 220; s.done = false; });
      A0.spots = sp; A0.pose = 'alud'; A0.actMs = (n - 1) * 220 + 250; A0.rec = 700; A0.drawAct = true; A0.r = 50;
      sfx('yar_slide_tele', { vol: 0.9 });
    },
    go: function () { fx.shake(3, 100); },
    act: function (e, A0) {
      var p = PL();
      A0.spots.forEach(function (s) {
        if (s.done || A0.t < s.imp) return;
        s.done = true; fx.shake(4, 120); sfx('yar_block', { vol: 0.6, pitch: G.rnd(0.9, 1.1) }); fx.burst(s.x, s.y, 8, '#e8f6ff', 220, 500, 4, { g: 200 }); fx.ring(s.x, s.y, 8, A0.r, 250, '#ffffff', 4);
        if (!p.dead && G.dist(s.x, s.y, p.x, p.y) <= A0.r) hurt(e, 18, 'boss_alud', { kb: 1.2 });
        var o = { x: s.x, y: s.y, r: 22, hp: 1, dead: false, shake: 0, sortY: s.y + 8, kind: 'iceblock', born: G.time, draw: drawBlock }; S.obs.push(o); S.pushOutOne(o, p, p.r);
        hitPillarsIn(function (q, i, isT) { if (isT && G.dist(q.x, q.y, s.x, s.y) < 60) T.hitPillar(i, 150); return false; });
      });
      return A0.t >= A0.actMs;
    },
    draw: function (c, e, A0) {
      var el = A0.step === 'tele' ? A0.t : A0.tele + A0.t;
      A0.spots.forEach(function (s) { if (!s.done) Assets.drawBossTele(c, ART() ? 'block' : 'circle', s.x, s.y + 4, { r: A0.r, p: G.clamp(el / (A0.tele + s.imp), 0, 1), fix: el >= A0.tele + s.imp - 300, t: G.time }); });
    },
    haz: function (e, A0, out) {
      A0.spots.forEach(function (s) { if (s.done) return; var rem = (A0.step === 'tele' ? A0.tele - A0.t : -A0.t) + s.imp; out.push({ k: 'circle', x: s.x, y: s.y, r: A0.r, t0: rem, t1: rem + 150 }); });
    }
  };

  // ---- 7. Latido gélido (firma, ventana): rosquilla 100-280 (pegado al cuerpo = seguro), +20 Frío; luego pecho abierto 4 s (5,5 con la Armadura rota): Corazón x2,0, cuerpo x1,35
  ATK.y_latido = {
    avail: function (e) { return !e.broken.corazon; },
    start: function (e, A0) {
      A0.in = 100; A0.out = 280; A0.openMs = e.broken.armadura ? 5500 : 4000; A0.pose = 'latido'; A0.actMs = A0.openMs + 1300; A0.rec = 700; A0.drawAct = true; A0.fin = false; A0.bt = 0; A0.pj = 0;
      sfx('yar_pulse_tele', { vol: 1 });
    },
    go: function (e, A0) {
      var p = PL(), d = G.dist(e.x, e.y, p.x, p.y);
      fx.shake(9, 300); fx.hit(50); sfx('yar_pulse', { vol: 1 }); fx.shockwave(e.x, e.y + 20, 560); fx.ring(e.x, e.y + 20, 40, A0.out, 450, '#bfeaff', 6);
      if (!p.dead && d >= A0.in && d <= A0.out + p.r * 0.5) { if (hurt(e, 20, 'boss_latido', { kb: 1.2 })) addCold(20); }
      setChest(e, true); expose(e, 1.35, A0.openMs, 'window'); try { G.Snd.play('stg_yarlak_window'); } catch (x) { /* audio */ }
      G.Hud.banner('¡CORAZÓN EXPUESTO!', 1400, '#bfeaff');
    },
    act: function (e, A0, dt) {
      A0.pj -= dt; if (!A0.fin && A0.pj <= 0) { A0.pj = 600; sfx('yar_window_loop', { vol: 0.6 }); }
      if (!A0.fin && A0.t >= A0.openMs) { A0.fin = true; A0.bt = 0; setChest(e, false); A0.aim = angTo(e, PL()); setOrigin(e, A0, A0.aim); A0.reach = 480; A0.half = 25 * DEG; A0.tk = 0; sfx('yar_breath_tele', { vol: 0.8 }); }
      if (A0.fin) {
        A0.bt += dt;
        if (A0.bt < 490) A0.aim = Math.atan2(PL().y - A0.oy, PL().x - A0.ox);
        setOrigin(e, A0, A0.aim);
        if (A0.bt >= 700) { if (A0.bt - dt < 700) sfx('ice_breath', { vol: 0.7 }); breathTick(e, A0, dt, A0.aim); }
        return A0.bt >= 1300;
      }
      return false;
    },
    draw: function (c, e, A0) {
      if (A0.step === 'tele') Assets.drawBossTele(c, ART() ? 'heartbeat' : 'donut', e.x, e.y + 20, { r: A0.out, inner: A0.in, cd: Math.max(0, (A0.tele - A0.t) / 1000), p: A0.t / A0.tele, fix: A0.t >= A0.tele * 0.7, sig: true, t: G.time });
      else if (A0.fin) Assets.drawBossTele(c, 'cone', A0.ox, A0.oy, { r: 480, arc: 50 * DEG, a: A0.aim, p: A0.bt < 700 ? A0.bt / 700 : 1, fix: A0.bt >= 490, color: 'blue', t: G.time });
    },
    haz: function (e, A0, out) {
      if (A0.step === 'tele') out.push({ k: 'arc', x: e.x, y: e.y, r: A0.out, inner: A0.in, a: 0, arc: TAU + 0.2, t0: A0.tele - A0.t, t1: A0.tele - A0.t + 150 });
      else if (A0.step === 'act' && A0.fin) out.push({ k: 'arc', x: A0.ox, y: A0.oy, r: 480, inner: 0, a: A0.aim, arc: 50 * DEG, t0: 700 - A0.bt, t1: 1300 - A0.bt });
    }
  };

  // ---- 8. Ventisca blanca (F3-F4): 3 olas de 120 px cada 1,5 s a 260 px/s con 1 hueco de 140 px; empujan; ráfaga de 6 s
  ATK.y_ventisca = {
    start: function (e, A0) {
      A0.dir = Math.random() < 0.5 ? 1 : -1; A0.x0 = A0.dir > 0 ? G.WALL - 60 : G.AW - G.WALL + 60; A0.w = 120; A0.v = 260; A0.gaps = [];
      var y = G.rnd(170, G.AH - 170);
      for (var i = 0; i < 3; i++) { A0.gaps.push(y); y = G.clamp(y + (Math.random() < 0.5 ? -1 : 1) * G.rnd(120, 220), 150, G.AH - 150); }
      A0.pose = 'ventisca'; A0.actMs = 3300; A0.rec = 500; A0.drawAct = true; A0.sent = 0; sfx('yar_blizz_tele', { vol: 0.9 });
    },
    go: function () { A().gust = 6000; setBz(0.45); },
    act: function (e, A0) {
      while (A0.sent < 3 && A0.t >= A0.sent * 1500) { A().bands.push({ x: A0.x0, dir: A0.dir, v: A0.v, w: A0.w, gap: A0.gaps[A0.sent], hit: false }); A0.sent++; sfx('yar_blizz_wave', { vol: 0.8 }); fx.shake(3, 150); }
      return A0.t >= A0.actMs;
    },
    draw: function (c, e, A0) {
      var x = A0.x0, w = A0.w, pr = A0.step === 'tele' ? A0.t / A0.tele : 1, i;
      if (A0.step === 'tele' && ART()) { for (i = 0; i < 3; i++) { drawIceBand(c, x + A0.dir * i * 34, A0.dir, w, A0.gaps[i], pr, true); G.txt(c, String(i + 1), x + A0.dir * (i * 34 + w / 2 + 14), A0.gaps[i], 16, '#ffffff', 'center'); } }
      else if (A0.step === 'tele') {
        for (i = 0; i < 3; i++) {
          var gy = A0.gaps[i], y0 = G.WALL, y1 = G.AH - G.WALL, xx = x + A0.dir * i * 34;
          c.save(); c.fillStyle = 'rgba(255,60,60,' + (0.10 + 0.22 * pr) + ')'; c.fillRect(xx - w / 2, y0, w, gy - 70 - y0); c.fillRect(xx - w / 2, gy + 70, w, y1 - gy - 70);
          c.strokeStyle = 'rgba(255,150,140,0.9)'; c.lineWidth = 3; c.strokeRect(xx - w / 2, y0, w, gy - 70 - y0); c.strokeRect(xx - w / 2, gy + 70, w, y1 - gy - 70);
          c.fillStyle = '#bfeaff'; c.beginPath(); for (var yy = y0 + 30; yy < y1; yy += 70) { if (Math.abs(yy - gy) < 80) continue; var ax = xx + A0.dir * (w / 2 + 24); c.moveTo(ax, yy); c.lineTo(ax - A0.dir * 18, yy - 12); c.lineTo(ax - A0.dir * 18, yy + 12); } c.fill();
          G.txt(c, String(i + 1), xx + A0.dir * (w / 2 + 14), gy, 16, '#ffffff', 'center');
          c.restore();
        }
      }
    },
    haz: function (e, A0, out) {
      if (A0.step === 'tele') for (var i = 0; i < 3; i++) out.push({ k: 'band', x: A0.x0, dir: A0.dir, v: A0.v, w: A0.w, gaps: [A0.gaps[i]], t0: A0.tele - A0.t + i * 1500, t1: A0.tele - A0.t + i * 1500 + (G.AW + 160) / A0.v * 1000 });
      else if (A0.step === 'act') for (var j = A0.sent; j < 3; j++) out.push({ k: 'band', x: A0.x0, dir: A0.dir, v: A0.v, w: A0.w, gaps: [A0.gaps[j]], t0: j * 1500 - A0.t, t1: j * 1500 - A0.t + (G.AW + 160) / A0.v * 1000 });
    }
  };

  // ------------------------------------------------------------------ ataque desesperado: Invierno Eterno (10 s)
  H.onDespair = function (e) {
    var a = A(), second = e.despLeft === 0 && !!pel().x2;
    a.des = { n: 0, rot: Math.random() * TAU, fx: e.x, fy: e.y, second: second };
    a.bands.length = 0; a.warns.length = 0;
    T.setPatchR(70); T.setHeatR(120); setBz(0.6); BZ.clearR = 260;
    if (!a.fires) {
      a.fires = T.fires.slice();
      if (second) T.fires.length = 3;   // Peligro V: el 2.º Invierno con solo 3 hogueras
      else B.biomes.tundra.ledges.forEach(function (l, i) { T.fires.push({ x: l[0], y: l[1], i: 5 + i, temp: true }); });   // B.2: siempre hay una hoguera a <= 215 px del borde: las 2 repisas de nieve firme (arriba y abajo) se encienden durante el Invierno
    }
    setChest(e, true); expose(e, 1.25, 10600, 'despair');
    try { Assets.music.setPhase(4); Assets.music.setDespair(true); } catch (x) { /* audio */ }
    G.Hud.banner('LAS HOGUERAS CRECEN: ¡A LA LUMBRE!', 2400, '#ffb347');
  };
  H.updDespair = function (e, dt) {
    var a = A(), p = PL(), ds = a.des;
    e.despT += dt; e.moveAmt = 0;
    var u = ease(e.despT / 1000); e.x = ds.fx + (G.AW / 2 - ds.fx) * u; e.y = ds.fy + (G.AH / 2 - 40 - ds.fy) * u; e.roar = e.despT < 2000 ? 1 : 0;
    while (ds.n < 7 && e.despT >= 1000 + ds.n * 1400) {   // oleada de 12 carámbanos con 2 huecos de 45 grados, rotando 18 grados por oleada
      var g0 = ds.rot + ds.n * 18 * DEG, i, k;
      for (k = 0; k < 2; k++) for (i = 0; i < 6; i++) {
        var an = g0 + k * Math.PI + 22.5 * DEG + (i + 0.5) * (135 * DEG / 6);
        U.shootBoss(e.x + Math.cos(an) * 100, e.y + 10 + Math.sin(an) * 100, an, 170, 10, 'proj_icicle', { r: 8, life: 5200, fb: 'arrow', src: 'boss_carambano' });
      }
      ds.n++; sfx('icicle_rain', { vol: 0.8 }); fx.shake(3, 120);
    }
    if (!p.dead && !T.nearHeat(p)) addCold(6 * dt / 1000);   // fuera de las hogueras el Frío sube a +6 %/s
    if (e.despT >= 10000) {
      e.mode = 'fight'; e.cadT = 1500; e.roar = 0;
      T.setHeatR(64); BZ.clearR = BZ.clearR0 * (pel().n >= 4 ? 300 / 330 : 1); setBz(0.35);
      if (a.fires) { T.fires.length = 0; a.fires.forEach(function (f) { T.fires.push(f); }); a.fires = null; }
      setChest(e, false); e.exps = e.exps.filter(function (x) { return x.kind !== 'despair'; }); a.des = null;
      try { Assets.music.setDespair(false); } catch (x) { /* audio */ }
      G.Hud.banner('El invierno cede...', 1300, '#bfeaff');
    }
  };
  H.onDeath = function (e) {
    var a = A(); a.bands.length = 0; a.warns.length = 0; a.open = false;
    if (a.fires) { T.fires.length = 0; a.fires.forEach(function (f) { T.fires.push(f); }); a.fires = null; }
    T.setHeatR(64); BZ.clearR = BZ.clearR0; setBz(0);
    try { Assets.music.setDespair(false); Assets.music.stop(); G.Snd.play('stg_yarlak_death'); } catch (x) { /* audio */ }
  };

  // ------------------------------------------------------------------ intro (3,5 s): asoma entre la ventisca, tres pasos pesados, onda de nieve sin daño
  H.intro = function (e, I, t) {
    e.alpha = G.clamp(t / 500, 0, 1); e.lift = 0; e.rise = 1; e.y = 150 + 135 * ease(t / 1800); e.moveAmt = t < 1800 ? 1 : 0; e.curSpd = 55;
    var steps = [[600, 3, 90], [1100, 6, 180], [1700, 8, 220]];
    steps.forEach(function (s, k) {
      if (t >= s[0] && !I['s' + k]) {
        I['s' + k] = true; fx.shake(s[1], s[2]); sfx(k === 2 ? 'yar_step_big' : 'mammoth_step', { vol: 0.8 }); fx.dust(e.x, e.y + 90, 8);
        if (k === 2) { fx.shockwave(e.x, e.y + 90, 320); fx.ring(e.x, e.y + 90, 20, 280, 500, '#ffffff', 5); I.landed = true; }
      }
    });
    if (t < 2400) setBz(0.45 * (1 - t / 2400)); else setBz(0);
  };

  // ------------------------------------------------------------------ DIBUJO
  function artState(e) {
    var A0 = e.atk, ex = S.expo(e), a = A(), st = { t: G.time, phase: e.phase, facing: e.face || 1, hurt: e.hurtT > 0 ? 0.6 : 0, enraged: S.fury > 1, desperate: e.mode === 'despair',
      exposed: ex.mul > 1 && ex.kind !== 'stun' && ex.kind !== 'derribo', stun: ex.kind === 'derribo' || ex.kind === 'stun' || e.stagT > 0, immune: e.immune && e.mode !== 'intro' && !e.dying,
      roar: e.roar || 0, alpha: e.alpha == null ? 1 : e.alpha, broken: e.broken, open: a.openU || 0, moving: e.moveAmt > 0 && !e.atk, speed: e.curSpd || 0, id: 'yarlak', armor: e.parts && e.parts.armadura && !e.broken.armadura ? G.clamp(e.parts.armadura.meter / e.parts.armadura.meterMax, 0, 1) : 0 };
    if (A0) {
      var nm = A0.pose;
      if (A0.step === 'tele') { st.windup = nm; st.wp = G.clamp(A0.t / A0.tele, 0, 0.999); }
      else if (A0.step === 'act') { st.strike = nm; st.sp = G.clamp(A0.t / (A0.actMs > 5000 ? 1500 : (A0.actMs || 400)), 0, 0.999); if (nm === 'embestida') st.speed = A0.v; }
      if (A0.aim != null) st.aim = A0.aim; else if (A0.base != null) st.aim = A0.base;
      if (nm === 'embestida' && A0.skidding) st.skid = 1;
      if (nm === 'aliento' && A0.step === 'act') st.aim = breathAim(A0);
    }
    return st;
  }
  function drawY(c, e) {
    var f = e.face || 1, x = e.x, y = e.y, t = G.time, al = e.alpha == null ? 1 : e.alpha, a = A(), mv = e.moveAmt > 0 ? t / 160 : 0, ph = e.phase, open = a.openU || 0;
    c.save(); c.globalAlpha = al;
    c.fillStyle = 'rgba(8,16,40,0.45)'; c.beginPath(); c.ellipse(x, y + 96, 120, 26, 0, 0, TAU); c.fill();
    c.lineJoin = 'round'; c.strokeStyle = OUT; c.lineWidth = 4;
    // patas
    for (var i = 0; i < 4; i++) { var lx = x + (i - 1.5) * 52 * 1, bob = Math.sin(mv + i * 1.6) * 8 * (e.moveAmt > 0 ? 1 : 0); c.fillStyle = i % 2 ? '#8fa4bf' : '#a9bad2'; c.fillRect(lx - 16, y + 30, 32, 66 + bob * 0.3); c.strokeRect(lx - 16, y + 30, 32, 66 + bob * 0.3); }
    // cuerpo
    c.fillStyle = e.hurtT > 0 ? '#ffffff' : '#e8eef5'; c.beginPath(); c.ellipse(x - f * 8, y - 6, 112, 80, 0, 0, TAU); c.fill(); c.stroke();
    c.fillStyle = '#8fa4bf'; c.beginPath(); c.ellipse(x - f * 8, y + 30, 100, 40, 0, 0, Math.PI); c.fill();
    // armadura de hielo (lomo)
    if (!e.broken.armadura) { c.fillStyle = '#9fd8ff'; c.strokeStyle = OUT; for (var k = 0; k < 4; k++) { var px = x - f * (60 - k * 18); c.beginPath(); c.moveTo(px - 18, y - 56 + k * 3); c.lineTo(px, y - 96 + k * 6 + (k % 2) * -8); c.lineTo(px + 18, y - 56 + k * 3); c.closePath(); c.fill(); c.stroke(); } }
    // cabeza y trompa
    var hx = x + f * 104, hy = y - 8; c.fillStyle = '#e8eef5'; c.strokeStyle = OUT; c.beginPath(); c.ellipse(hx, hy, 50, 46, 0, 0, TAU); c.fill(); c.stroke();
    var tr = e.roar > 0 ? -50 : 20; c.lineWidth = 16; c.strokeStyle = OUT; c.beginPath(); c.moveTo(hx + f * 30, hy + 6); c.quadraticCurveTo(hx + f * 62, hy + tr + 10, hx + f * 54, hy + tr + 52); c.stroke(); c.lineWidth = 9; c.strokeStyle = '#a9bad2'; c.stroke();
    // colmillos
    if (!e.broken.colmillos) { c.lineWidth = 12; c.strokeStyle = OUT; c.beginPath(); c.moveTo(hx + f * 20, hy + 20); c.quadraticCurveTo(hx + f * 66, hy + 70, hx + f * 40, hy + 8 - 30 + 62); c.stroke(); c.lineWidth = 7; c.strokeStyle = '#f1ead2'; c.stroke(); }
    // ojo
    c.fillStyle = ['#8fdcff', '#ffffff', '#5ff0ff', '#fff3a0'][ph - 1]; c.beginPath(); c.arc(hx + f * 14, hy - 12, 6, 0, TAU); c.fill();
    // corazón helado en el pecho
    var hb = 0.4 + 0.3 * Math.sin(t / (ph >= 3 ? 300 : 600)) + open * 0.6, show = ph >= 3 || open > 0.1 || e.broken.armadura;
    if (!e.broken.corazon && show) { c.fillStyle = 'rgba(95,240,255,' + Math.min(1, 0.35 + hb) + ')'; c.strokeStyle = OUT; c.lineWidth = 3; c.beginPath(); c.arc(x + f * 12, y - 2, 16 + open * 6, 0, TAU); c.fill(); c.stroke(); }
    if (open > 0.2 || (ph === 4 && e.mode === 'despair')) { c.strokeStyle = 'rgba(232,246,255,' + (0.6 + 0.3 * Math.sin(t / 100)) + ')'; c.lineWidth = 4; c.beginPath(); c.ellipse(x, y + 96, 130, 32, 0, 0, TAU); c.stroke(); }
    if (e.immune && e.mode === 'gate') { c.strokeStyle = 'rgba(160,220,255,0.8)'; c.lineWidth = 4; c.setLineDash([8, 8]); c.lineDashOffset = -t / 30; c.beginPath(); c.ellipse(x, y + 20, 150, 110, 0, 0, TAU); c.stroke(); c.setLineDash([]); }
    c.restore();
  }
  H.draw = function (c, e) {
    if (ART()) Assets.drawBoss('yarlak', c, e.x, e.y, artState(e)); else drawY(c, e);
    if (!ART() && e.mode === 'fight' && e.exps.length && S.expo(e).kind === 'window') { c.save(); c.strokeStyle = 'rgba(232,246,255,' + (0.6 + 0.3 * Math.sin(G.time / 90)) + ')'; c.lineWidth = 4; c.beginPath(); var p = e.parts.corazon; if (p && !p.dead) c.arc(p.x, p.y, p.r + 10, 0, TAU); c.stroke(); c.restore(); }
  };
  H.drawGhost = function (c, Dd) {
    if (ART()) { Assets.drawBoss('yarlak', c, Dd.x, Dd.y, { t: G.time, id: 'yarlak', facing: Dd.face, phase: 4, broken: Dd.broken, armor: 0, dying: true, dt: Dd.dt }); return; }
    var u = G.clamp(Dd.dt / 2600, 0, 1), fake = { x: Dd.x, y: Dd.y + u * 40, face: Dd.face, alpha: 1 - u, roar: 0, moveAmt: 0, phase: 4, broken: Dd.broken, exps: [], mode: 'dead', hurtT: 0, immune: false };
    drawY(c, fake);
  };
  function drawStal(c, it) { var o = it.o; if (ART() && Assets.drawYarlakSpike) { Assets.drawYarlakSpike(c, o.x, o.y, G.clamp((G.time - o.born) / 350, 0, 1), { sink: G.time - o.born > 19000 ? (G.time - o.born - 19000) / 1000 : 0 }); return; } T.drawPillar(c, o.x, o.y, { shake: o.shake, r: o.r, alpha: o.born && G.time - o.born < 250 ? (G.time - o.born) / 250 : 1 }); }
  function drawBlock(c, it) {
    var o = it.o, age = G.time - o.born, al = age > 5000 ? Math.max(0.2, (6000 - age) / 1000) : 1;
    c.save(); c.globalAlpha = al;
    if (G.hasSpr('fx_ice_block')) c.drawImage(Assets.sprite('fx_ice_block', Math.floor(age / 120) % 3), Math.round(o.x - 22), Math.round(o.y - 30), 44, 44);
    else { c.fillStyle = '#9fd8ff'; c.strokeStyle = OUT; c.lineWidth = 3; c.fillRect(o.x - 20, o.y - 22, 40, 40); c.strokeRect(o.x - 20, o.y - 22, 40, 40); }
    c.restore();
  }
  function drawIceBand(c, x, dir, w, gap, p, tele) {   // (x,y) = centro del borde delantero; con dir < 0 el marco local va girado 180 grados: se espejan los huecos (como Letea)
    var y0 = G.WALL, y1 = G.AH - G.WALL, len = y1 - y0, s0 = gap - 70 - y0, s1 = gap + 70 - y0;
    Assets.drawBossBand(c, x + dir * w / 2, (y0 + y1) / 2, dir > 0 ? 0 : Math.PI, len, w, { gaps: [dir > 0 ? [s0, s1] : [len - s1, len - s0]], style: tele ? 'water' : 'ice', p: p, tele: !!tele, t: G.time, alpha: 1 });
  }
  H.drawGround = function (c, e) {
    var a = A(), t = G.time, i;
    for (i = 0; i < a.cracks.length; i++) {   // grietas abiertas: agua helada (ralentiza)
      var cr = a.cracks[i], s = crackSeg(cr.i); c.save(); c.globalAlpha = Math.min(1, cr.t / 500);
      c.strokeStyle = '#0f2a5a'; c.lineWidth = 22; c.lineCap = 'round'; c.beginPath(); c.moveTo(s.x0, s.y0); c.lineTo(s.x1, s.y1); c.stroke();
      c.strokeStyle = 'rgba(95,200,255,' + (0.5 + 0.2 * Math.sin(t / 200)) + ')'; c.lineWidth = 14; c.stroke();
      c.strokeStyle = '#e8f6ff'; c.lineWidth = 2; c.setLineDash([6, 8]); c.lineDashOffset = -t / 40; c.stroke(); c.restore();
    }
    for (i = 0; i < a.warns.length; i++) { var w = a.warns[i]; Assets.drawBossTele(c, ART() ? 'stalag' : 'circle', w.x, w.y, { r: w.r, p: w.t / w.imp, fix: w.t > w.imp * 0.7, t: t }); }
    for (i = 0; i < a.bands.length; i++) {   // olas vivas
      var b = a.bands[i], y0 = G.WALL, y1 = G.AH - G.WALL;
      if (ART()) { drawIceBand(c, b.x, b.dir, b.w, b.gap, 1, false); continue; }
      c.save(); c.fillStyle = 'rgba(210,235,255,0.55)'; c.fillRect(b.x - b.w / 2, y0, b.w, b.gap - 70 - y0); c.fillRect(b.x - b.w / 2, b.gap + 70, b.w, y1 - b.gap - 70);
      c.strokeStyle = 'rgba(255,255,255,0.95)'; c.lineWidth = 3; c.strokeRect(b.x - b.w / 2, y0, b.w, b.gap - 70 - y0); c.strokeRect(b.x - b.w / 2, b.gap + 70, b.w, y1 - b.gap - 70); c.restore();
    }
    if (e.atk && e.atk.step !== 'rec') { var A0 = e.atk, Hh = ATK[A0.name]; if (Hh.draw && (A0.step === 'tele' || A0.drawAct)) Hh.draw(c, e, A0); }
  };
  H.items = function () { };
  H.hazards = function (e, out) {
    var a = A(), i;
    for (i = 0; i < a.warns.length; i++) { var w = a.warns[i]; out.push({ ref: w, k: 'circle', x: w.x, y: w.y, r: w.r, t0: w.imp - w.t, t1: w.imp - w.t + 150 }); }
    for (i = 0; i < a.bands.length; i++) { var b = a.bands[i]; out.push({ ref: b, k: 'band', x: b.x, dir: b.dir, v: b.v, w: b.w, gaps: [b.gap], t0: 0, t1: (b.dir > 0 ? G.AW + 80 - b.x : b.x + 80) / b.v * 1000, live: true }); }
  };
  H.force = function (e, name) { if (e.mode !== 'fight' || e.atk) return false; U.startAttack(e, name); return true; };
  S.yarlakInfo = function () { var a = A(); return { open: a.open, cracks: a.cracks.length, warns: a.warns.length, bands: a.bands.length, stal: S.obs.filter(function (o) { return o.kind === 'bstal'; }).length, blocks: S.obs.filter(function (o) { return o.kind === 'iceblock'; }).length, des: !!a.des }; };
})();
