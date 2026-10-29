/* boss_cenizar.js - P6.5: CENIZAR, el Incendio Primero (jefe final, Cráter del Hogar Quemado). DESIGN-v7-jefe-final.md.
   7 fases (F1 propia; F2-F6 el ataque más fuerte de cada jefe anterior con una mecánica nueva y una Reliquia; F7 Rosario del Incendio = cadena), 6 puertas de 3 s,
   desesperado "Cadena Final" (< 6 %). Engancha en el motor genérico de boss.js (DEFS.cenizar.h). Este archivo: datos, helpers, motor de eventos de zona (S.cz), arena, partes,
   Furia por fase, F1-F2, dibujo. F3-F6 en boss_cenizar_b.js; cadena, F7 y desesperado en boss_cenizar_chain.js; guardado/final en ending.js.
   Arte: assets_boss5.js (Assets.drawBoss('cenizar'), con dibujo de reserva aquí). Audio: sfx_cenizar.js (todo con try/catch). */
(function () {
  'use strict';
  var G = window.G, S = G.Boss, fx = G.fx, E = G.Enemies, U = S && S.u, B = G.B;
  if (!S || !U) return;
  var ATKS = S.ATKS, ATK = S.ATK, TAU = Math.PI * 2, DEG = Math.PI / 180;
  var ease = U.ease, angTo = U.angTo, sfx = U.sfx, pel = U.pel, expose = U.expose;
  var Z = S.cz = {};
  var OUT = '#1b1124';
  function qn(name, def) { var m = new RegExp('[?&]' + name + '=([\\d.]+)').exec(location.search); return m ? parseFloat(m[1]) : def; }
  function PL() { return G.player; }
  function A() { return S.A; }
  function ART() { try { return !!(Assets.drawBoss && Assets.bossIds().indexOf('cenizar') >= 0 && G.hasSpr('boss_cenizar_torso')); } catch (x) { return false; } }
  function snd(n) { try { G.Snd.play(n); } catch (x) { /* audio opcional */ } }
  Z.snd = snd;

  var NOSP = { mul: 0, allow: {}, cap: 0 };
  S.DEFS.cenizar = {
    id: 'cenizar', name: 'Cenizar, el Incendio Primero', title: 'Rey de Ceniza', furia: 'DE CENIZAR', hp: 36000, r: 96, gy: 100, deathMs: 6000,
    phases: [   // music = intensidad de la pista boss_cenizar (fase = floor(v x 7) + 1; evita 0,55 / 0,78 / 1,0)
      { n: 'Rescoldo',               thr: 0.90, cad: 2600, spd: 40, music: 0.07, spawn: NOSP },
      { n: 'Éxtasis de Cenizas',     thr: 0.76, cad: 2400, spd: 50, music: 0.21, spawn: NOSP },
      { n: 'Réquiem Abrasador',      thr: 0.62, cad: 2200, spd: 60, music: 0.36, spawn: NOSP },
      { n: 'Coro de los Tres Ríos',  thr: 0.47, cad: 2200, spd: 65, music: 0.50, spawn: NOSP },
      { n: 'Invierno de Ceniza',     thr: 0.33, cad: 2000, spd: 70, music: 0.64, spawn: NOSP },
      { n: 'Enjambre de Brasas',     thr: 0.18, cad: 1900, spd: 75, music: 0.79, spawn: NOSP },
      { n: 'El Incendio Primero',    thr: 0,    cad: 1600, spd: 85, music: 0.93, spawn: NOSP }
    ],
    despairAt: 0.06, despair: 'Cadena Final',
    barCol: ['#c0501a', '#9a40d0', '#e0701a', '#2fb8a0', '#6aa8e0', '#e0a020', '#ff8a2a'],
    gateCol: ['#ff9a3c', '#c090ff', '#ff9a3c', '#7fe0d0', '#bfeaff', '#ffc440', '#fff2b0'],
    nameCol: '#fff2b0', winCol: ['#fff2b0', '#ffc94a'], roarSfx: 'cenizar_roar',
    parts: {
      cayado:   { name: 'Cayado',            phase: 2, pct: 0.035, hz: 1.15, trophy: 'cz_cay',  r: 30 },
      nucleo:   { name: 'Núcleo',            phase: 3, pct: 0.035, hz: 1.15, trophy: 'cz_nuc',  r: 32 },
      ojo:      { name: 'Ojo del Olvido',    phase: 4, pct: 0.035, hz: 1.15, trophy: 'cz_ojo',  r: 26 },
      colmillo: { name: 'Colmillo glacial',  phase: 5, pct: 0.035, hz: 1.15, trophy: 'cz_col',  r: 28 },
      corona:   { name: 'Corona de cera',    phase: 6, pct: 0.035, hz: 1.15, trophy: 'cz_cor',  r: 28, fem: true },
      corazon:  { name: 'Corazón de Ceniza', phase: 7, pct: 0.04,  hz: 1.15, trophy: 'cz_cora', r: 30, derr: { mul: 1.5, ms: 5000 } }
    },
    weak: [], resist: [],   // se rellenan por fase (applyTable)
    hpCal: 3.6, dmgK: 1.0, teleK: qn('ctele', 1.2), cadK: qn('ccadk', 1.2), pelHp: [null, 1.0, 1.1, 1.2, 1.3, 1.4], gateHearts: 3, sigHeart: qn('csh', 1) > 0,
    geo: { zarpazo: 1, barra: 1, martillo: 0.7, coro: 1, invierno: 1, estocada: 1.4, zumbido: 1, chain: 1.3 },   // zonas de peligro (calibración con el bot; ?cgeo= las multiplica todas)
    brasas: 20, brasasPart: 5, pf: 2, pfFirst: 3,
    guaranteed: { plate: 2, wick: 2, thread: 2, static: 1, frost: 1, spine: 1, fang: 1 },
    h: { camW: 0.4, noIntensity: true }
  };
  var D = S.DEFS.cenizar, H = D.h;
  D.gateHearts = qn('cheart', D.gateHearts); D.hpCal = D.hpCal;
  Z.D = D; Z.H = H;
  function geo(k) { return (D.geo[k] || 1) * qn('cgeo', 1); }
  Z.geo = geo; Z.qn = qn;
  Z.dmgK = function () { return qn('cdmg', D.dmgK || 1); };
  Object.keys(D.parts).forEach(function (k) { D.parts[k].hz *= qn('cpz', 1); });
  [['cz_cay', 'cayado', 'Cayado de Ceniza'], ['cz_nuc', 'nucleo', 'Núcleo Ceniciento'], ['cz_ojo', 'ojo', 'Ojo Anegado'], ['cz_col', 'colmillo', 'Colmillo de Ceniza'], ['cz_cor', 'corona', 'Corona de Ceniza'], ['cz_cora', 'corazon', 'Corazón de Ceniza']].forEach(function (t) {
    Object.defineProperty(S.TROPHY, t[0], { enumerable: true, configurable: true, get: function () { var sp = 'trophy_cenizar_' + t[1]; return { spr: G.hasSpr(sp) ? sp : 'trophy_pastor_horn', name: t[2] }; } });
  });

  // ---- debilidades / resistencias por fase (DESIGN 5): se reescriben D.weak / D.resist en cada puerta (la barra las dibuja y S.mulIn las aplica)
  var TABLE = [
    { w: [['ice', 1.25], ['steel', 1.1]], r: [['fire', 0.8]] },
    { w: [['steel', 1.25], ['ice', 1.1]], r: [['poison', 0.8]] },
    { w: [['ice', 1.25], ['lightning', 1.25]], r: [['fire', 0.6]] },
    { w: [['poison', 1.25], ['blood', 1.25], ['lightning', 1.1]], r: [['ice', 0.8]] },
    { w: [['fire', 1.25], ['lightning', 1.25]], r: [['ice', 0.6]] },
    { w: [['fire', 1.25], ['ice', 1.25]], r: [['poison', 0.5, true], ['lightning', 0.8]] },
    { w: [['ice', 1.1], ['steel', 1.1], ['lightning', 1.1], ['poison', 1.1], ['blood', 1.1]], r: [['fire', 0.8]] }
  ];
  Z.TABLE = TABLE;
  function applyTable(ph) {
    var t = TABLE[ph - 1], all = [1, 2, 3, 4, 5, 6, 7];
    D.weak = t.w.map(function (x) { return { tag: x[0], mul: x[1], phases: all }; });
    D.resist = t.r.map(function (x) { return { tag: x[0], mul: x[1], immune: !!x[2] }; });
    D.noPoison = ph === 6;
  }

  // ---- salidas (px) para la regla de esquiva tele >= 250 + 1000 x salida / 190 (+100 de margen del motor); DESIGN secciones 6 y 8
  var X = S.EXIT;
  X.c_zarpazo = 95; X.c_cometas = 35; X.c_barra = 110; X.c_extasis = 55; X.c_martillo = 100; X.c_lluvia = 65; X.c_mordisco = 35; X.c_coletazo = 75;
  X.c_ventisca = 140; X.c_cornada = 80; X.c_estocada = 99; X.c_zumbido = 80;
  Z.EXIT = X;
  // telegrafía de un evento suelto (cadena / voces): misma fórmula que teleMs para que el Peligro no baje de la regla
  Z.evTele = function (base, exit, noK) { var t = Math.max(base * pel().tele, Math.min(base, 250 + 1000 * exit / 190 + 100)); return Math.round(noK ? t : t * (D.teleK || 1)); };

  function def(name, o) { o.b = 'cenizar'; ATKS[name] = o; }
  def('c_zarpazo',  { name: 'Zarpazo de Rescoldo',   tele: 850,  cd: 6000,  dmg: 24, phases: [1, 2] });
  def('c_cometas',  { name: 'Cometas de Ceniza',     tele: 700,  cd: 7000,  dmg: 10, phases: [1, 2] });
  def('c_barra',    { name: 'Barra de Rescoldo',     tele: 1000, cd: 10000, dmg: 22, phases: [1, 2] });
  def('c_llamada',  { name: 'Llamada de Cenizas',    tele: 800,  cd: 20000, dmg: 0,  phases: [1] });
  def('c_extasis',  { name: 'Éxtasis de Cenizas',    tele: 1200, cd: 30000, dmg: 10, phases: [2, 7], sig: true });
  def('c_requiem',  { name: 'Réquiem Abrasador',     tele: 2000, cd: 32000, dmg: 12, phases: [3, 7], sig: true });
  def('c_martillo', { name: 'Martillazo de Cenizar', tele: 900,  cd: 9000,  dmg: 28, phases: [3] });
  def('c_lluvia',   { name: 'Lluvia de brasas',      tele: 900,  cd: 9000,  dmg: 18, phases: [3] });
  def('c_coro',     { name: 'Coro de los Tres Ríos', tele: 1000, cd: 28000, dmg: 14, phases: [4, 7], sig: true });
  def('c_mordisco', { name: 'Mordisco en picado',    tele: 700,  cd: 5000,  dmg: 22, phases: [4] });
  def('c_coletazo', { name: 'Coletazo',              tele: 800,  cd: 8000,  dmg: 24, phases: [4] });
  def('c_invierno', { name: 'Invierno de Ceniza',    tele: 1300, cd: 30000, dmg: 10, phases: [5, 7], sig: true });
  def('c_ventisca', { name: 'Ventisca blanca',       tele: 1250, cd: 24000, dmg: 14, phases: [5] });
  def('c_cornada',  { name: 'Cornada de ceniza',     tele: 950,  cd: 7000,  dmg: 24, phases: [5] });
  def('c_zumbido',  { name: 'Zumbido de Ceniza',     tele: 1000, cd: 30000, dmg: 18, phases: [6, 7], sig: true });
  def('c_estocada', { name: 'Estocada de Cenizar',   tele: 900,  cd: 6000,  dmg: 26, phases: [6] });
  def('c_enjambre', { name: 'Llamada del enjambre',  tele: 800,  cd: 20000, dmg: 0,  phases: [6] });
  def('c_chain',    { name: 'Rosario del Incendio',  tele: 1500, cd: 16000, dmg: 24, phases: [7], sig: true, noTeleK: true });

  // ---- utilidades
  function hurtC(e, base, src, o) { return U.hurt(e, Math.min(32, base * Z.dmgK()), src, o); }
  Z.hurt = hurtC;
  function gnd(e) { return { x: e.x, y: e.y + 30 }; }
  Z.gnd = gnd;
  function faceTo(e, ang) { e.face = Math.cos(ang) >= 0 ? 1 : -1; }
  Z.faceTo = faceTo;
  function clampX(x, m) { return G.clamp(x, G.WALL + (m || 30), G.AW - G.WALL - (m || 30)); }
  function clampY(y, m) { return G.clamp(y, G.WALL + (m || 30), G.AH - G.WALL - (m || 30)); }
  Z.clampX = clampX; Z.clampY = clampY;
  function addsCap(e) { return pel().cap; }
  function spawnAdd(type, x, y, spawnT) {
    var ty = B.enemy[type] && !B.enemy[type].famOnly ? type : 'worm', ad = E.spawn(ty, clampX(x), clampY(y), { summoned: true, spawnT: spawnT });
    ad.bossAdd = true; return ad;
  }
  Z.spawnAdd = spawnAdd;
  function phaseName(e) { return D.phases[e.phase - 1].n; }

  // ================================================================= MOTOR DE EVENTOS DE ZONA
  // Un evento = una zona de peligro con telegrafía y un instante de impacto. Lo usan las voces del Coro, los meteoros, las brasas de hoguera, los anillos y TODA la cadena.
  //   k: circle | lane | cones | donut | hex ; t0 = reloj en el que empieza a telegrafiarse; tele; dur = ventana de daño (ms); fixAt = reloj a partir del cual la geometría se fija
  //   (antes, ev.upd(ev, a) puede reorientarla hacia el jugador); ghost = se dibuja tenue desde la creación (vista previa); glyph = número sobre la zona.
  Z.add = function (o) {
    var a = A(), ev = o;
    ev.t0 = a.clk + (o.delay || 0); ev.tele = o.tele || 900; ev.at = ev.t0 + ev.tele; ev.dur = o.dur == null ? 160 : o.dur; ev.fixAt = o.fixAt == null ? ev.at - ev.tele * 0.3 : ev.t0 + o.fixAt;
    ev.src = ev.src || 'boss_cz'; ev.dmg = ev.dmg == null ? 10 : ev.dmg; ev.fired = false; ev.hit = false; ev.alive = true;
    a.evs.push(ev); return ev;
  };
  function wrapA(x) { return G.angDiff(x, 0); }
  Z.inside = function (ev, x, y, pr) {
    var dx = x - ev.x, dy = y - ev.y, d = Math.hypot(dx, dy), i;
    switch (ev.k) {
      case 'circle': return d <= ev.r + pr * 0.4;
      case 'lane': { var ca = Math.cos(ev.a), sa = Math.sin(ev.a), al = dx * ca + dy * sa, la = -dx * sa + dy * ca; return al > -20 && al < ev.len + 20 && Math.abs(la) < ev.w / 2 + pr * 0.45; }
      case 'cones': {
        if (d > ev.reach + pr * 0.4) return false;
        var an = Math.atan2(dy, dx);
        for (i = 0; i < ev.angs.length; i++) if (Math.abs(G.angDiff(an, ev.angs[i])) <= ev.half + Math.atan2(pr * 0.4, Math.max(d, 20))) return true;
        return false;
      }
      case 'donut': return d >= ev.inner && d <= ev.r + pr * 0.4;
      case 'hex': {
        var hn = Math.max(Math.abs(dy), Math.abs(dx * 0.8660254 + dy * 0.5), Math.abs(dx * 0.8660254 - dy * 0.5));
        if (Math.abs(hn - ev.apo) > ev.th / 2 + pr * 0.5) return false;
        var ha = Math.atan2(dy, dx);
        for (i = 0; i < ev.gaps.length; i++) if (Math.abs(G.angDiff(ha, ev.gaps[i])) < ev.gh) return false;
        return true;
      }
    }
    return false;
  };
  function evTest(e, ev) {
    var p = PL(); if (p.dead || S.noHurt > 0 || ev.hit) return;
    if (Z.inside(ev, p.x, p.y, p.r)) {
      ev.hit = true;
      if (hurtC(e, ev.dmg, ev.src, { kb: ev.kb == null ? 1 : ev.kb })) { if (ev.slow) G.Player.slow(p, ev.slow[0], ev.slow[1]); a_hurtN(); if (ev.link) A().chainHurts = (A().chainHurts || 0) + 1; }
    }
  }
  function a_hurtN() { var a = A(); a.hurts = (a.hurts || 0) + 1; }
  Z.tickEvs = function (e, dt) {
    var a = A(), i, ev;
    a.clk += dt;
    for (i = a.evs.length - 1; i >= 0; i--) {
      ev = a.evs[i];
      if (!ev.fired && a.clk >= ev.fixAt && ev.upd && !ev.fixed) { ev.fixed = true; }
      if (!ev.fired && a.clk < ev.fixAt && ev.upd) ev.upd(ev, a);
      if (!ev.fired && a.clk >= ev.at) {
        ev.fired = true; if (ev.onGo) ev.onGo(ev);
        if (!ev.silent) { fx.ring(ev.x, ev.y, 6, ev.k === 'circle' ? ev.r : 60, 220, '#ffb070', 3); }
      }
      if (ev.fired && a.clk < ev.at + ev.dur) evTest(e, ev);
      if (a.clk > ev.at + ev.dur + 260) { if (ev.onEnd) ev.onEnd(ev); a.evs.splice(i, 1); }
    }
  };
  // ---- dibujo de eventos
  var COL = { red: '#ff7a6a', purple: '#c090ff', orange: '#ffb050', turq: '#5ff0d0', blue: '#bfeaff', amber: '#ffd070', white: '#ffffff', ash: '#d8cfe8' };
  function path(c, ev, grow) {
    var i, g = grow || 0;
    c.beginPath();
    switch (ev.k) {
      case 'circle': c.arc(ev.x, ev.y, Math.max(1, ev.r * (g || 1)), 0, TAU); break;
      case 'lane': {
        var ca = Math.cos(ev.a), sa = Math.sin(ev.a), h = ev.w / 2, L = ev.len * (g || 1), x = ev.x, y = ev.y;
        c.moveTo(x - sa * h, y + ca * h); c.lineTo(x - sa * h + ca * L, y + ca * h + sa * L); c.lineTo(x + sa * h + ca * L, y - ca * h + sa * L); c.lineTo(x + sa * h, y - ca * h); c.closePath(); break;
      }
      case 'cones': for (i = 0; i < ev.angs.length; i++) { c.moveTo(ev.x, ev.y); c.arc(ev.x, ev.y, ev.reach * (g || 1), ev.angs[i] - ev.half, ev.angs[i] + ev.half); c.closePath(); } break;
      case 'donut': c.arc(ev.x, ev.y, ev.r * (g || 1), 0, TAU); c.moveTo(ev.x + ev.inner, ev.y); c.arc(ev.x, ev.y, ev.inner, 0, TAU, true); break;
    }
  }
  function hexPoly(c, cx, cy, apo) {   // hexágono de vértices en +-30 grados (apotema vertical, como los anillos de Melaria)
    var R = apo / 0.8660254;
    for (var i = 0; i < 6; i++) { var an = i * Math.PI / 3 + Math.PI / 2 + Math.PI / 6 * 0; c.lineTo(cx + Math.cos(an) * R, cy + Math.sin(an) * R); }
    c.closePath();
  }
  function drawHex(c, ev, apo, alpha, solid, col) {
    var th = ev.th, far = 1800, i;
    c.save();
    c.beginPath(); c.rect(ev.x - far, ev.y - far, far * 2, far * 2);
    for (i = 0; i < ev.gaps.length; i++) { var g = ev.gaps[i], gh = ev.gh; c.moveTo(ev.x, ev.y); c.lineTo(ev.x + Math.cos(g - gh) * far, ev.y + Math.sin(g - gh) * far); c.lineTo(ev.x + Math.cos(g + gh) * far, ev.y + Math.sin(g + gh) * far); c.closePath(); }
    c.clip('evenodd');
    c.beginPath(); hexPoly(c, ev.x, ev.y, apo + th / 2); hexPoly(c, ev.x, ev.y, Math.max(1, apo - th / 2));
    c.globalAlpha = alpha; c.fillStyle = 'rgba(255,60,40,' + (solid ? 0.55 : 0.22) + ')'; c.fill('evenodd');
    c.strokeStyle = col; c.lineWidth = solid ? 3 : 2; c.stroke();
    c.restore();
  }
  Z.drawEv = function (c, ev, clk) {
    var tt = G.time, p, col = COL[ev.col] || COL.red, mode, fix;
    if (clk < ev.t0) { if (!ev.ghost) return; mode = 'ghost'; p = 0; }
    else if (clk < ev.at) { mode = 'tele'; p = G.clamp((clk - ev.t0) / ev.tele, 0, 1); }
    else if (clk < ev.at + ev.dur) { mode = 'hit'; p = 1; }
    else if (clk < ev.at + ev.dur + 260) { mode = 'fade'; p = 1; }
    else return;
    fix = clk >= ev.fixAt;
    c.save(); c.lineJoin = 'round';
    var al = mode === 'ghost' ? 0.25 : mode === 'fade' ? 1 - (clk - ev.at - ev.dur) / 260 : 1;
    c.globalAlpha = al;
    if (ev.echo) c.globalAlpha = al * 0.8;
    if (ev.k === 'hex') {
      var ap = ev.apo0 != null && mode !== 'hit' ? ev.apo0 + (ev.apo - ev.apo0) * ease(mode === 'ghost' ? 0 : p) : ev.apo;
      drawHex(c, ev, ap, c.globalAlpha, mode === 'hit', col);
    } else {
      path(c, ev, 0);
      if (mode === 'hit') { c.fillStyle = 'rgba(255,170,60,0.75)'; c.fill('evenodd'); }
      else if (mode !== 'ghost') {
        c.fillStyle = 'rgba(255,60,40,' + (0.10 + 0.30 * p) + ')'; c.fill('evenodd');
        c.fillStyle = 'rgba(255,60,40,0.20)'; path(c, ev, Math.max(0.02, p)); c.fill('evenodd'); path(c, ev, 0);
      }
      if (ev.sig && mode === 'tele') { c.strokeStyle = 'rgba(255,255,255,0.28)'; c.lineWidth = 8; c.stroke(); }
      c.strokeStyle = col; c.lineWidth = mode === 'ghost' ? 2 : fix ? 3.4 : 2.4;
      if (!fix || mode === 'ghost' || ev.echo) { c.setLineDash([10, 8]); c.lineDashOffset = -tt / 40; }
      c.stroke(); c.setLineDash([]);
    }
    if (ev.glyph != null && mode !== 'fade') {
      var gx = ev.gx != null ? ev.gx : ev.x, gy = ev.gy != null ? ev.gy : ev.y;
      c.globalAlpha = mode === 'ghost' ? 0.55 : 1;
      c.fillStyle = 'rgba(14,6,20,0.8)'; c.beginPath(); c.arc(gx, gy, 12, 0, TAU); c.fill(); c.strokeStyle = col; c.lineWidth = 2; c.stroke();
      G.txt(c, String(ev.glyph), gx, gy + 1, 15, '#ffffff', 'center');
    }
    c.restore();
  };
  Z.hazEv = function (ev, out) {
    var a = A(), t0 = ev.at - a.clk, t1 = t0 + ev.dur + 40, fixIn = Math.max(0, ev.fixAt - a.clk);
    if (t1 < 0 || ev.hit) return;
    switch (ev.k) {
      case 'circle': out.push({ ref: ev, k: 'circle', x: ev.x, y: ev.y, r: ev.r, t0: t0, t1: t1, fixIn: fixIn }); break;
      case 'lane': out.push({ ref: ev, k: 'lane', x: ev.x, y: ev.y, a: ev.a, w: ev.w, len: ev.len, t0: t0, t1: t1 }); break;
      case 'cones': for (var i = 0; i < ev.angs.length; i++) out.push({ ref: ev, k: 'arc', x: ev.x, y: ev.y, r: ev.reach, inner: 0, a: ev.angs[i], arc: ev.half * 2, t0: t0, t1: t1 }); break;
      case 'donut': out.push({ ref: ev, k: 'arc', x: ev.x, y: ev.y, r: ev.r, inner: ev.inner, a: 0, arc: TAU + 0.2, t0: t0, t1: t1 }); break;
      case 'hex': out.push({ ref: ev, k: 'hexring', x: ev.x, y: ev.y, apo: ev.apo, th: ev.th, gh: ev.gh, gaps: ev.gaps, t0: t0, t1: t1 }); break;
    }
  };

  // ================================================================= HOOKS DEL MOTOR
  var PILLARS = [[470, 300], [970, 300], [330, 520], [1110, 520], [590, 640], [850, 640]];
  function drawPillar(c, it) {
    var o = it.o, sh = o.shake > 0 ? (Math.random() * 2 - 1) * 2 : 0;
    if (typeof Assets.drawAshPillar === 'function' && G.hasSpr('obs_ash_pillar')) { Assets.drawAshPillar(c, Math.round(o.x + sh), Math.round(o.y), { hp: 1, struck: o.shake > 0 }); return; }
    c.save(); c.translate(Math.round(o.x + sh), Math.round(o.y)); c.lineJoin = 'round'; c.strokeStyle = OUT; c.lineWidth = 3;
    c.fillStyle = '#3a3440'; c.beginPath(); c.moveTo(-20, 10); c.lineTo(-16, -40); c.lineTo(-6, -50); c.lineTo(10, -42); c.lineTo(20, 10); c.closePath(); c.fill(); c.stroke();
    c.fillStyle = '#5c5468'; c.fillRect(-12, -34, 6, 38);
    c.fillStyle = '#ff6a1a'; c.fillRect(2, -20, 4, 6); c.fillRect(-4, -6, 5, 4);
    c.restore();
  }
  Z.breakPillarsNear = function (x, y, r) {
    if (S.e && S.e.phase === 7) return;
    S.obs.forEach(function (o) { if (!o.dead && o.kind === 'ash' && Math.hypot(o.x - x, o.y - y) < r + o.r) { o.dead = true; o.rebuild = 40000; S.rubble.length = S.rubble.length; fx.puff(o.x, o.y, 3); fx.burst(o.x, o.y, 10, '#5c5468', 200, 500, 4, { g: 240 }); sfx('explosion', { pitch: 1.1, vol: 0.5 }); } });
  };
  Z.breakPillarsLane = function (ev) {
    S.obs.forEach(function (o) {
      if (o.dead || o.kind !== 'ash') return;
      var ca = Math.cos(ev.a), sa = Math.sin(ev.a), dx = o.x - ev.x, dy = o.y - ev.y, al = dx * ca + dy * sa, la = -dx * sa + dy * ca;
      if (al > -20 && al < ev.len + 20 && Math.abs(la) < ev.w / 2 + o.r) Z.breakPillarsNear(o.x, o.y, 1);
    });
  };

  H.pos = function () { return { x: 720, y: 330 }; };
  H.setup = function (e) {
    var a = A();
    a.clk = 0; a.evs = []; a.phT = 0; a.lastCT = 0; a.noFury = false; a.coreT = 0; a.hurts = 0; a.orbs = []; a.bands = []; a.rr = {};
    a.lava = null; a.fires = null; a.coro = null; a.rain = []; a.winT = -1e9; a.ch = null; a.des = null; a.sol = 0; a.hover = 0; a.glow = {};
    e.cadMul = 1 / qn('ccad', D.cadK || 1); e.rise = 1; e.foot = D.gy; e.fly = true;
    S.obs.length = 0;
    PILLARS.forEach(function (l) { S.obs.push({ x: l[0], y: l[1], r: 28, dead: false, shake: 0, sortY: l[1] + 6, kind: 'ash', draw: drawPillar, rebuild: 0 }); });
    applyTable(1);
    D.noPoison = false;
    S.cds.c_llamada = 6000; S.cds.c_barra = 3000;
    try { Assets.music.setTrack('boss_cenizar'); Assets.music.setPhase(1); Assets.music.setChain && Assets.music.setChain(0); } catch (x) { /* audio */ }
  };
  H.move = function (e, dt) {
    var p = PL(), PH = D.phases[e.phase - 1], d = G.dist(e.x, e.y, p.x, p.y), spd = PH.spd * (e.slowT > 0 ? 1 - e.slowPct : 1);
    // el jefe se queda cerca del centro de la cráter (el jugador lo rodea): así no arrincona al jugador contra el muro (calibración con el bot)
    var tx = 720 + (p.x - 720) * 0.3, ty = 360 + (p.y - 405) * 0.3, dc = G.dist(e.x, e.y, tx, ty);
    if (!p.dead && dc > 30) { U.moveToward(e, tx, ty, spd, dt); e.moveAmt = 1; e.curSpd = spd; } else e.moveAmt = 0;
    if (!p.dead && Math.abs(p.x - e.x) > 4) e.face = p.x >= e.x ? 1 : -1;
  };
  H.okNow = function (e, name, d) {
    switch (name) {
      case 'c_zarpazo': return d < 330;
      case 'c_cometas': return d > 140;
      case 'c_barra': return d < 520;
      case 'c_llamada': return addsAlive() <= addsCap(e) - 2;
      case 'c_martillo': return d < 460;
      case 'c_lluvia': return d > 100 && d < 720;
      case 'c_mordisco': return d > 140;
      case 'c_coletazo': return d < 320;
      case 'c_cornada': return d < 320;
      case 'c_estocada': return d < 520;
      case 'c_enjambre': return addsAlive() <= addsCap(e) - 2;
      default: return true;
    }
  };
  function addsAlive() { return U.addsAlive(); }
  H.keepAtk = function () { return false; };
  H.partActive = function (e, k) {
    var pd = D.parts[k], a = A();
    if (e.mode === 'gate' || e.mode === 'intro' || e.dying) return false;
    if (k === 'corazon') return a.coreT > 0;
    return pd.phase === e.phase;
  };
  var FALL = { cayado: [96, 8], nucleo: [0, 16], ojo: [0, -70], colmillo: [-72, -46], corona: [0, -118], corazon: [0, 20] };
  H.anchors = function (e) {
    var f = e.face || 1;
    if (ART()) { try { var an = Assets.bossAnchors('cenizar', artState(e)); if (an && an.cayado && an.nucleo) return an; } catch (x) { /* reserva */ } }
    var o = {}; Object.keys(FALL).forEach(function (k) { o[k] = { x: f * FALL[k][0], y: FALL[k][1], r: D.parts[k].r }; });
    return o;
  };
  H.partMul = function (e, pe) { return pe.key === 'corazon' ? 2.0 : 1; };   // Corazón de Ceniza: x2,0 durante la ventana
  H.mulExtra = function (e, tag, o) { var a = A(); return (a.coreT > 0 && e.phase === 7) ? 1.5 : 1; };   // Sol agotado: cuerpo x1,5
  H.onBreak = function (e, pe) {
    var k = pe.key, a = A();
    a.shards = a.shards || []; a.shards.push({ x: pe.x, y: pe.y, t0: G.time, k: k });
    sfx('relic_break', { vol: 0.9 });
    if (k === 'cayado') G.Hud.banner('ÉXTASIS ACORTADO', 1600, '#c090ff');
    else if (k === 'nucleo') G.Hud.banner('LAS ISLAS SE QUEDAN QUIETAS', 1600, '#ff9a3c');
    else if (k === 'ojo') G.Hud.banner('EL CORO YA NO TIENE ECO', 1600, '#7fe0d0');
    else if (k === 'colmillo') G.Hud.banner('EL INVIERNO PIERDE SU FILO', 1600, '#bfeaff');
    else if (k === 'corona') G.Hud.banner('EL ENJAMBRE CALLA', 1600, '#ffc440');
    else if (k === 'corazon') { G.Hud.banner('¡EL CORAZÓN SE APAGA!', 1800, '#fff2b0'); e.cadMul = 1 / qn('ccad', D.cadK || 1) * 1.2; a.coreT = 0; }
    var R = G.Loot.run; if (R) R.relics = (R.relics || 0) + (k === 'corazon' ? 0 : 1);
    if (k !== 'corazon' && R && R.relics >= 5 && G.mode !== 'practice') { G.Save.data.flags.all_relics = 1; G.Save.save(); }
    S.cz.win();
  };
  H.partStinger = function (e, pe) { snd('stg_cenizar_part'); };
  Z.win = function () { var a = A(); if (G.time - a.winT < 900) return; a.winT = G.time; snd('stg_cenizar_window'); };

  H.clear = function (e) {   // puertas y desesperado: limpia zonas, eventos, adds y mutaciones de arena
    var a = A(); if (!a || !a.evs) return;
    a.evs.length = 0; a.orbs.length = 0; a.bands.length = 0; a.rain.length = 0; a.lava = null; a.fires = null; a.coro = null; a.rr = {}; a.sol = 0; a.coreT = 0; a.noFury = false;
    if (a.ch && !a.ch.final) a.ch = null;
    for (var i = G.zones.length - 1; i >= 0; i--) if (G.zones[i].team === 'e' && String(G.zones[i].src).indexOf('boss') === 0) G.zones.splice(i, 1);
    for (var j = 0; j < G.projectiles.length; j++) if (G.projectiles[j].team === 'e') G.projectiles[j].life = 0;
  };
  H.onGate = function (e) {
    var a = A();
    applyTable(e.phase);
    for (var i = 0; i < G.enemies.length; i++) { var q = G.enemies[i]; if (!q.dead && q.bossAdd) E.kill(q, true); }
    a.phT = 0; a.lastCT = S.combatT;
    try { Assets.music.setPhase(e.phase); Assets.music.setChain && Assets.music.setChain(0); } catch (x) { /* audio */ }
    sfx('gate_thud', { vol: 0.9 }); sfx('relic_glow', { vol: 0.7 });
    var BN = [null, 'LA CEBA DE LAS CENIZAS', 'EL FUEGO DE KARCERON', 'EL RÍO DEL OLVIDO', 'EL FRÍO DE YARLAK', 'EL ZUMBIDO DE LA REINA', 'EL INCENDIO PRIMERO'];
    if (BN[e.phase - 1]) G.Hud.banner(BN[e.phase - 1], 2400, D.gateCol[e.phase - 1]);
    if (e.phase === 7) { S.cds.c_chain = 11000; G.Hud.banner('LAS CINCO LLAMAS ARDEN A LA VEZ', 2600, '#fff2b0'); }
    if (e.phase === 4) S.cds.c_coro = 5000;
    if (e.phase === 3) S.cds.c_requiem = 4000;
    if (e.phase === 5) S.cds.c_invierno = 5000;
    if (e.phase === 6) S.cds.c_zumbido = 5000;
    if (e.phase === 2) S.cds.c_extasis = 3000;
    if (e.phase === 7) { S.cds.c_extasis = 20000; S.cds.c_requiem = 26000; S.cds.c_coro = 17000; S.cds.c_invierno = 23000; S.cds.c_zumbido = 14000; }
    // en el resto de fases el desbloqueo de ataques viejos: F2 mantiene Zarpazo/Cometas/Barra
  };

  // ---- Furia por fase (150 s dentro de una misma fase; 120 s en Peligro IV-V) y global (14 min): DESIGN 9.3
  H.furyCalc = function (e) {
    var a = A(), P = pel(), dt = S.combatT - (a.lastCT || 0); a.lastCT = S.combatT;
    if ((e.mode === 'fight' || e.mode === 'despair') && !a.noFury) a.phT += dt;
    var F = P.fury, f1 = a.phT >= F ? Math.min(2, 1.25 + 0.1 * Math.floor((a.phT - F) / 15000)) : 1, g = 1;
    if (S.combatT >= 840000) g = Math.min(1.5, 1 + 0.1 * (1 + Math.floor((S.combatT - 840000) / 15000)));
    var f = Math.min(2.4, f1 * g);
    if (f > S.fury + 0.001) {
      fx.shake(8, 300); sfx('cenizar_roar', { pitch: 1.2 });
      G.Hud.banner(S.fury === 1 ? '¡FURIA ' + D.furia + '!' : 'FURIA +' + Math.round((f - 1) * 100) + ' %', 1600, '#ff3030');
    }
    S.fury = f;
  };
  Z.furyLeft = function (e) { var a = A(), F = pel().fury; return Math.max(0, F - a.phT); };

  // ---- tick: reloj de eventos, órbitas, ceniza, reconstrucción de pilares
  H.tick = function (e, dt) {
    var a = A(), i;
    if (e.mode === 'intro') return;
    Z.tickEvs(e, dt);
    if (a.coreT > 0) { a.coreT -= dt; if (a.coreT <= 0) { a.coreT = 0; if (!a.ch && e.mode !== 'despair') { /* ventana cerrada */ } } }
    for (i = 0; i < S.obs.length; i++) { var o = S.obs[i]; if (o.dead && o.rebuild > 0 && e.phase !== 7) { o.rebuild -= dt; if (o.rebuild <= 0) { o.dead = false; fx.dust(o.x, o.y, 6); } } }
    if (a.shards) for (i = a.shards.length - 1; i >= 0; i--) if (G.time - a.shards[i].t0 > 900) a.shards.splice(i, 1);
    if ((a.hover -= dt) <= 0) { a.hover = 650; sfx('cenizar_hover', { pitch: 1 + 0.02 * e.phase, vol: 0.5 }); }
    if (Z.tickB) Z.tickB(e, dt);
    if (Z.tickChain) Z.tickChain(e, dt);
    // adornos: brasas del cuerpo
    if (Math.random() < 0.25 * (G.Q && G.Q.level === 'baja' ? 0.3 : 1)) fx.ember(e.x + G.rnd(-70, 70), e.y + G.rnd(-60, 60), 1, 20);
  };

  // ================================================================= ASH (Ceniza viva)
  Z.ash = function (x, y, r) {
    var n = 0, oldest = -1, i;
    for (i = 0; i < G.zones.length; i++) { var q = G.zones[i]; if (q.team === 'e' && q.kind === 'ash') { n++; if (oldest < 0) oldest = i; } }
    if (n >= 14 && oldest >= 0) G.zones.splice(oldest, 1);
    var z = E.zone({ kind: 'ash', x: x, y: y, r: r || 36, arm: 0, life: 5000, dmg: 5 * U.dmgMul(), tick: 400, slow: 0.15, slowMs: 350, owner: S.e, src: 'boss_ceniza' });
    z.draw = drawAsh; sfx('ash_puddle', { vol: 0.4 });
    return z;
  };
  function drawAsh(c, z) {
    var a = Math.min(1, z.life / 600) * Math.min(1, z.t / 200 + 0.3);
    c.globalAlpha = a; c.fillStyle = 'rgba(92,84,104,0.55)'; c.beginPath(); c.arc(z.x, z.y, z.r, 0, TAU); c.fill();
    c.strokeStyle = 'rgba(160,150,176,0.9)'; c.lineWidth = 2; c.setLineDash([5, 5]); c.lineDashOffset = -G.time / 50; c.stroke(); c.setLineDash([]);
    if (G.hasSpr('fx_ash_puddle')) { var sp = Assets.sprite('fx_ash_puddle', Math.floor(z.t / 200) % 3); c.drawImage(sp, Math.round(z.x - z.r), Math.round(z.y - z.r), z.r * 2, z.r * 2); }
    c.fillStyle = 'rgba(255,106,26,0.5)'; for (var i = 0; i < 3; i++) { var an = z.x * 3 + i * 2.1; c.fillRect(Math.round(z.x + Math.cos(an) * z.r * 0.5), Math.round(z.y + Math.sin(an) * z.r * 0.4), 3, 3); }
    c.globalAlpha = 1;
  }

  // ================================================================= F1-F2
  ATK.c_zarpazo = {
    start: function (e, A0) {
      A0.reach = 210 * geo('zarpazo'); A0.inner = 50; A0.arc = 120 * DEG; A0.aim = angTo(e, PL()); A0.fixAt = A0.tele * 0.625; A0.actMs = 300; A0.rec = 650; A0.pose = 'zarpazo'; faceTo(e, A0.aim);
    },
    tele: function (e, A0) { if (A0.t < A0.fixAt) { A0.aim = angTo(e, PL()); faceTo(e, A0.aim); } },
    go: function (e, A0) {
      var p = PL(), g = gnd(e), d = G.dist(g.x, g.y, p.x, p.y);
      fx.shake(6, 180); sfx('hit_heavy', { vol: 0.8 }); fx.slash(g.x, g.y, A0.aim, A0.reach / 40, '#ff8a3c');
      if (!p.dead && d <= A0.reach + p.r * 0.4 && d >= A0.inner && Math.abs(G.angDiff(angTo(g, p), A0.aim)) <= A0.arc / 2) hurtC(e, 24, 'boss_zarpazo', { kb: 1.3 });
    },
    act: function (e, A0) { return A0.t >= A0.actMs; },
    draw: function (c, e, A0) { var g = gnd(e); Assets.drawBossTele(c, 'arc', g.x, g.y, { r: A0.reach, inner: A0.inner, arc: A0.arc, a: A0.aim, p: A0.t / A0.tele, fix: A0.t >= A0.fixAt, color: 'orange', t: G.time }); },
    haz: function (e, A0, out) { var g = gnd(e); if (A0.step === 'tele') out.push({ k: 'arc', x: g.x, y: g.y, r: A0.reach, inner: A0.inner, a: A0.aim, arc: A0.arc, t0: A0.tele - A0.t, t1: A0.tele - A0.t + 150 }); }
  };
  ATK.c_cometas = {
    start: function (e, A0) { A0.aim = angTo(e, PL()); A0.pose = 'cometas'; A0.actMs = 250; A0.rec = 600; A0.fixAt = A0.tele * 0.5; faceTo(e, A0.aim); },
    tele: function (e, A0) { if (A0.t < A0.fixAt) { A0.aim = angTo(e, PL()); faceTo(e, A0.aim); } },
    go: function (e, A0) {
      var g = gnd(e), n = 5, sp = 60 * DEG; sfx('ash_fall', { vol: 0.7 }); fx.shake(3, 100);
      for (var i = 0; i < n; i++) {
        var an = A0.aim - sp / 2 + sp * i / (n - 1), ox = g.x + Math.cos(an) * 60, oy = g.y - 20 + Math.sin(an) * 60;
        U.shootBoss(ox, oy, an, 210, 10, 'proj_boss_ember', { r: 8, life: 1900, fb: 'thorn', src: 'boss_cometa', onEnd: function (q) { Z.ash(q.x, q.y, 34); fx.burst(q.x, q.y, 6, '#ff6a1a', 120, 350, 3, { add: true }); } });
      }
    },
    act: function (e, A0) { return A0.t >= A0.actMs; },
    draw: function (c, e, A0) { var g = gnd(e); Assets.drawBossTele(c, 'cone', g.x, g.y, { r: 400, arc: 60 * DEG, a: A0.aim, p: A0.t / A0.tele, fix: A0.t >= A0.fixAt, color: 'orange', t: G.time }); },
    haz: function (e, A0, out) { var g = gnd(e); if (A0.step === 'tele') out.push({ k: 'arc', x: g.x, y: g.y, r: 400, inner: 0, a: A0.aim, arc: 60 * DEG, t0: A0.tele - A0.t, t1: A0.tele - A0.t + 600 }); }
  };
  ATK.c_barra = {   // rectángulo 60 x 520 que gira 100 grados en 1,4 s desde el jefe
    start: function (e, A0) {
      A0.aim = angTo(e, PL()); A0.sgn = Math.random() < 0.5 ? -1 : 1; A0.sw = 100 * DEG; A0.len = 520 * geo('barra'); A0.w = 60 * geo('barra'); A0.fixAt = A0.tele * 0.5; A0.actMs = 1400; A0.rec = 600; A0.pose = 'barra'; A0.hit = false; A0.ashN = 0; A0.drawAct = true; faceTo(e, A0.aim);
    },
    tele: function (e, A0) { if (A0.t < A0.fixAt) { A0.aim = angTo(e, PL()); faceTo(e, A0.aim); } },
    cur: function (A0, t) { return A0.aim + A0.sgn * A0.sw * G.clamp(t / A0.actMs, 0, 1); },   // la barra EMPIEZA donde estaba el jugador al fijarse y barre 100 grados en el sentido de la flecha: retroceder (contra el giro) la esquiva; seguir el giro no
    mid: function (A0) { return A0.aim + A0.sgn * A0.sw / 2; },
    go: function (e, A0) { sfx('lane_charge', { vol: 0.7 }); fx.shake(4, 150); },
    act: function (e, A0) {
      var p = PL(), g = gnd(e), an = ATK.c_barra.cur(A0, A0.t), ca = Math.cos(an), sa = Math.sin(an), dx = p.x - g.x, dy = p.y - g.y, al = dx * ca + dy * sa, la = -dx * sa + dy * ca;
      if (!A0.hit && !p.dead && al > 0 && al < A0.len && Math.abs(la) < A0.w / 2 + p.r * 0.45) { A0.hit = true; hurtC(e, 22, 'boss_barra', { kb: 1.2 }); }
      if (A0.t / 280 > A0.ashN && A0.ashN < 5) { A0.ashN++; var dd = G.rnd(150, A0.len - 30); Z.ash(g.x + ca * dd, g.y + sa * dd, 30); }
      if (Math.random() < 0.6) fx.burst(g.x + ca * G.rnd(60, A0.len), g.y + sa * G.rnd(60, A0.len), 1, '#ffb070', 60, 250, 3, { add: true });
      return A0.t >= A0.actMs;
    },
    draw: function (c, e, A0) {
      var g = gnd(e);
      if (A0.step === 'tele') {
        Assets.drawBossTele(c, 'arc', g.x, g.y, { r: A0.len, inner: 0, arc: A0.sw + 12 * DEG, a: ATK.c_barra.mid(A0), p: A0.t / A0.tele, fix: A0.t >= A0.fixAt, color: 'orange', t: G.time });
        Assets.drawBossTele(c, 'lane', g.x, g.y, { w: A0.w, len: A0.len, a: A0.aim, p: 1, fix: true, color: 'red', t: G.time });
        var ea = A0.aim + A0.sgn * A0.sw * 0.6; c.save(); c.fillStyle = 'rgba(255,230,160,0.9)'; c.beginPath(); c.moveTo(g.x + Math.cos(ea) * 200 + Math.cos(ea + A0.sgn * 1.57) * 16, g.y + Math.sin(ea) * 200 + Math.sin(ea + A0.sgn * 1.57) * 16); c.lineTo(g.x + Math.cos(ea) * 200 - Math.cos(ea + A0.sgn * 1.57) * 8 + Math.cos(ea) * 10, g.y + Math.sin(ea) * 200 - Math.sin(ea + A0.sgn * 1.57) * 8 + Math.sin(ea) * 10); c.lineTo(g.x + Math.cos(ea) * 200 - Math.cos(ea) * 10 - Math.cos(ea + A0.sgn * 1.57) * 8, g.y + Math.sin(ea) * 200 - Math.sin(ea) * 10 - Math.sin(ea + A0.sgn * 1.57) * 8); c.closePath(); c.fill(); c.restore();
      } else Assets.drawBossTele(c, 'lane', g.x, g.y, { w: A0.w, len: A0.len, a: ATK.c_barra.cur(A0, A0.t), p: 1, fix: true, sig: true, color: 'red', t: G.time });
    },
    haz: function (e, A0, out) {
      var g = gnd(e);
      if (A0.step === 'tele') out.push({ k: 'arc', x: g.x, y: g.y, r: A0.len, inner: 0, a: ATK.c_barra.mid(A0), arc: A0.sw + 12 * DEG, t0: A0.tele - A0.t, t1: A0.tele - A0.t + A0.actMs });
      else if (A0.step === 'act') out.push({ k: 'arc', x: g.x, y: g.y, r: A0.len, inner: 0, a: ATK.c_barra.mid(A0), arc: A0.sw + 12 * DEG, t0: 0, t1: A0.actMs - A0.t });
    }
  };
  ATK.c_llamada = {
    ok: function (e) { return addsAlive() <= addsCap(e) - 2; },
    start: function (e, A0) {
      var P = pel(), room = addsCap(e) - addsAlive(), p = PL(), n = Math.min(2 + P.adds, room); A0.pose = 'llamada'; A0.actMs = 300; A0.rec = 600; A0.spots = [];
      for (var i = 0; i < n; i++) {
        var a0 = Math.random() * TAU, cx, cy, tries = 0;
        do { a0 += 1.1; cx = e.x + Math.cos(a0) * 190; cy = e.y + 30 + Math.sin(a0) * 150; tries++; } while (G.dist(cx, cy, p.x, p.y) < 100 && tries < 8);
        var ad = spawnAdd('scorcher', cx, cy, A0.tele); A0.spots.push({ x: ad.x, y: ad.y });
      }
      sfx('wave_start', { pitch: 0.7, vol: 0.8 });
    },
    go: function (e) { fx.ring(e.x, e.y + 30, 10, 170, 500, '#a060ff', 5); fx.shake(4, 150); sfx('hit_heavy', { pitch: 0.6, vol: 0.6 }); },
    act: function (e, A0) { return A0.t >= A0.actMs; },
    draw: function (c, e, A0) { var g = gnd(e); Assets.drawBossTele(c, 'summon', g.x, g.y, { r: 130, p: A0.t / A0.tele, t: G.time }); },
    haz: function () { }
  };

  // ---- F2: Éxtasis de Cenizas (firma). 7 oleadas de anillos de espinas (v 170, 2 huecos de 45 grados, 1,3 s); giro +20 grados x3 y luego -35 (se avisa con la flecha de los faros);
  //      entre la 4.a y la 5.a cruza un carril 90 x 1440 (tele 900). Jefe quieto y expuesto x1,25. Cayado roto: 6 s, 5 oleadas, sin carril. Peligro III: carril doble. En F7 (cita) dura 5 oleadas.
  function waveAng(A0, k) { var s = A0.a0, i; for (i = 1; i <= k; i++) s += (i <= 2 ? 20 : -35) * DEG; return s; }
  ATK.c_extasis = {
    start: function (e, A0) {
      var br = e.broken.cayado;
      A0.n = br ? 5 : (e.phase === 7 ? 5 : 7); A0.lane = !br; A0.a0 = Math.random() * TAU; A0.wi = 0; A0.pose = 'extasis'; A0.drawAct = true; A0.lanes = 0;
      A0.t1 = 700; A0.actMs = 700 + (A0.n - 1) * 1300 + 1300; A0.rec = 2600; A0.fixAt = A0.tele * 0.7;
      A0.cx = e.x; A0.cy = e.y + 30; faceTo(e, angTo(e, PL())); sfx('lane_charge', { vol: 0.5 });
    },
    tele: function () { },
    go: function (e, A0) {
      expose(e, 1.25, A0.actMs, 'window'); A().noFury = true; fx.shake(5, 200); sfx('spike_ring', { vol: 0.6 });
      A0.cx = e.x; A0.cy = e.y + 30;
    },
    act: function (e, A0, dt) {
      var P = pel();
      while (A0.wi < A0.n && A0.t >= 700 + A0.wi * 1300) {
        var an = waveAng(A0, A0.wi);
        S.waves.push({ x: A0.cx, y: A0.cy, r: 60, v: 170, th: 22, gaps: [{ a: an, w: 45 * DEG }, { a: an + Math.PI, w: 45 * DEG }], dmg: 10, delay: 0, hit: false, maxR: 1000, style: 1, src: 'boss_extasis' });
        sfx('spike_ring', { vol: 0.55 }); sfx('ember_wave', { vol: 0.4 }); fx.shake(3, 120); A0.wi++;
      }
      // carril de embestida tras la 4.a oleada (y un 2.º en Peligro III+)
      var want = A0.lane ? (P.v3 ? 2 : 1) : 0;
      while (A0.lanes < want && A0.t >= 700 + 3 * 1300 + 200 + A0.lanes * 700) {
        var p = PL(), base = angTo({ x: A0.cx, y: A0.cy }, p) + Math.PI / 2 + A0.lanes * Math.PI / 2, ln = 1440, tl = Z.evTele(900, 55);
        var ev = Z.add({ k: 'lane', x: p.x - Math.cos(base) * ln / 2, y: p.y - Math.sin(base) * ln / 2, a: base, w: 90, len: ln, tele: tl, dur: 220, dmg: 24, src: 'boss_carril', col: 'purple', sig: true, glyph: null, silent: true, fixAt: tl - 300, kb: 1.6,
          upd: function (v, a) { var pp = PL(); v.x = pp.x - Math.cos(v.a) * v.len / 2; v.y = pp.y - Math.sin(v.a) * v.len / 2; },
          onGo: function (v) { Z.breakPillarsLane(v); fx.shake(6, 200); sfx('lane_charge', { vol: 0.8 }); } });
        A0.lanes++; sfx('lane_charge', { vol: 0.7 });
      }
      return A0.t >= A0.actMs;
    },
    draw: function (c, e, A0) {
      var gx = A0.cx != null ? A0.cx : e.x, gy = A0.cy != null ? A0.cy : e.y + 30, k, i;
      // cayado clavado y faros: marcan los huecos de la próxima oleada (la flecha avisa la inversión 700 ms antes)
      c.save();
      var nk = A0.step === 'tele' ? 0 : A0.wi, an = waveAng(A0, Math.min(nk, A0.n - 1));
      for (i = 0; i < 2; i++) {
        var ag = an + i * Math.PI, fxp = gx + Math.cos(ag) * 150, fyp = gy + Math.sin(ag) * 150;
        c.strokeStyle = '#e8dcff'; c.lineWidth = 3; c.setLineDash([]); c.beginPath(); c.moveTo(gx + Math.cos(ag) * 80, gy + Math.sin(ag) * 80); c.lineTo(gx + Math.cos(ag) * 230, gy + Math.sin(ag) * 230); c.stroke();
        c.fillStyle = '#c090ff'; c.beginPath(); c.arc(fxp, fyp, 7, 0, TAU); c.fill(); c.strokeStyle = OUT; c.lineWidth = 2; c.stroke();
      }
      var nextT = 700 + A0.wi * 1300;
      if (A0.step === 'act' && A0.wi === 3 && A0.t > nextT - 700 && A0.t < nextT) {   // inversión: flecha curva y último 30 % sólido
        var u = (A0.t - (nextT - 700)) / 700; c.globalAlpha = 0.6 + 0.4 * Math.sin(G.time / 60);
        G.txt(c, u > 0.7 ? '<<  INVIERTE  >>' : '<< invierte >>', gx, gy - 150, u > 0.7 ? 18 : 15, '#ffd0ff', 'center');
      }
      c.restore();
      if (A0.step === 'tele') Assets.drawBossTele(c, 'ring', gx, gy, { r: 260, th: 22, gap: 45 * DEG, a: an, p: A0.t / A0.tele, fix: A0.t >= A0.fixAt, color: 'purple', sig: true, t: G.time });
    },
    haz: function (e, A0, out) {   // los faros avisan la próxima oleada (y la inversión): se ofrece como oleada que aún no ha salido
      var k = A0.step === 'tele' ? 0 : A0.wi; if (k >= A0.n) return;
      var an = waveAng(A0, k), t0 = A0.step === 'tele' ? A0.tele - A0.t + 700 : 700 + k * 1300 - A0.t;
      out.push({ k: 'wave', x: A0.cx, y: A0.cy, r: 60, v: 170, th: 22, gaps: [{ a: an, w: 45 * DEG }, { a: an + Math.PI, w: 45 * DEG }], t0: Math.max(0, t0), t1: Math.max(0, t0) + 5200, live: false });
    }
  };
  Z.waveAng = waveAng;

  // ================================================================= INTRO / MUERTE / DIBUJO
  H.intro = function (e, I, t) {
    e.alpha = G.clamp((t - 200) / 600, 0, 1); e.rise = 1; e.moveAmt = 0;
    e.lift = t < 1200 ? 40 * (1 - ease(t / 1200)) : 0;
    if (t >= 100 && !I.z0) { I.z0 = true; fx.ring(720, 520, 10, 120, 700, '#ff6a1a', 6); sfx('ash_fall', { vol: 0.8 }); }
    if (t >= 600 && !I.z1) { I.z1 = true; sfx('cenizar_hover', { vol: 0.8 }); }
    for (var i = 0; i < 5; i++) if (t >= 2000 + i * 150 && !I['c' + i]) { I['c' + i] = true; var an = -Math.PI / 2 + (i - 2) * 0.5; fx.burst(e.x + Math.cos(an) * 80, e.y - 100 + Math.sin(an) * 20, 8, '#ffb070', 160, 450, 4, { add: true }); sfx('card_select', { pitch: 1 + i * 0.12, vol: 0.5 }); }
    if (t >= 1000 && !I.z2) { I.z2 = true; fx.shake(6, 180); fx.shockwave(e.x, e.y + 60, 300); fx.dust(e.x, e.y + 80, 12); }
  };
  H.onDeath = function (e) {
    var a = A(); a.evs.length = 0; a.ch = null; a.lava = null; a.fires = null; a.coro = null; a.bands.length = 0; a.rain.length = 0; a.des = null;
    for (var i = G.zones.length - 1; i >= 0; i--) if (G.zones[i].team === 'e') G.zones.splice(i, 1);
    try { Assets.music.setDespair(false); Assets.music.stop(); } catch (x) { /* audio */ }
    snd('stg_cenizar_death');
    if (G.mode !== 'practice' && (a.chainHurts || 0) === 0) G.Save.data.flags.no_chain_hit = 1;
    G.cenizarFinal = { t: G.time, first: (G.Save.data.bossKills.cenizar || 0) === 0 && G.mode !== 'practice' };
  };
  function artState(e) {
    var A0 = e.atk, ex = S.expo(e), a = A(), br = e.broken, st = {
      t: G.time, id: 'cenizar', facing: e.face || 1, phase: e.phase, hurt: e.hurtT > 0 ? 0.6 : 0, enraged: S.fury > 1, desperate: e.mode === 'despair',
      exposed: ex.mul > 1 && ex.kind !== 'stun' && ex.kind !== 'derribo', stun: ex.kind === 'derribo' || e.stagT > 0, immune: e.immune && e.mode !== 'intro' && !e.dying,
      noFx: G.Q && G.Q.level === 'baja', roar: e.roar || 0, alpha: e.alpha == null ? 1 : e.alpha, lift: e.lift || 0, open: a.coreT > 0 ? 1 : 0,
      broken: { cayado: !!br.cayado, nucleo: !!br.nucleo, ojo: !!br.ojo, colmillo: !!br.colmillo, corona: !!br.corona, core: !!br.corazon }
    };
    if (a.ch) st.chain = { links: a.ch.links, done: Math.max(0, a.ch.n), announce: G.clamp((a.ch.t + 1500) / 1400, 0, 1) };
    if (a.coro) st.voice = ((A0 && A0.vi != null ? Math.max(0, A0.vi - 1) : 0)) % 3;
    if (A0) {
      if (A0.step === 'tele') { st.windup = A0.pose; st.wp = G.clamp(A0.t / A0.tele, 0, 0.999); }
      else if (A0.step === 'act') { st.strike = A0.pose; st.sp = G.clamp(A0.t / (A0.actMs || 400), 0, 0.999); }
      if (A0.aim != null) st.aim = A0.aim;
    }
    return st;
  }
  Z.artState = artState;
  function drawFallback(c, e) {
    var f = e.face || 1, x = e.x, y = e.y - 40 - (e.lift || 0), t = G.time, al = e.alpha == null ? 1 : e.alpha, br = e.broken, eyeC = ['#ffa04a', '#c88aff', '#ff9a3a', '#4ff0d0', '#bfeaff', '#ffc440', '#fff2b0'][e.phase - 1];
    c.save(); c.globalAlpha = al; c.lineJoin = 'round'; c.strokeStyle = OUT; c.lineWidth = 4;
    c.fillStyle = 'rgba(0,0,0,0.35)'; c.beginPath(); c.ellipse(x, e.y + 100, 100, 24, 0, 0, TAU); c.fill();
    // capa de humo
    c.fillStyle = '#2e2936'; c.beginPath(); c.moveTo(x - 90, y + 20); c.quadraticCurveTo(x - 110 + Math.sin(t / 300) * 10, y + 120, x - 70, y + 150); c.lineTo(x + 70, y + 150); c.quadraticCurveTo(x + 110 + Math.sin(t / 300 + 1) * 10, y + 120, x + 90, y + 20); c.closePath(); c.fill(); c.stroke();
    // torso de ceniza con costillas de brasa
    c.fillStyle = e.hurtT > 0 ? '#fff' : '#3a3440'; c.beginPath(); c.ellipse(x, y + 20, 70, 84, 0, 0, TAU); c.fill(); c.stroke();
    c.strokeStyle = '#ff6a1a'; c.lineWidth = 4; for (var i = 0; i < 4; i++) { c.beginPath(); c.arc(x, y + 6 + i * 18, 40 - i * 4, Math.PI * 1.1, Math.PI * 1.9); c.stroke(); }
    c.strokeStyle = OUT; c.lineWidth = 4;
    // cabeza y corona de cinco puntas
    c.fillStyle = '#4a4352'; c.beginPath(); c.arc(x, y - 80, 30, 0, TAU); c.fill(); c.stroke();
    c.fillStyle = eyeC; c.fillRect(x - 15, y - 86, 10, 6); c.fillRect(x + 5, y - 86, 10, 6);
    for (var k = 0; k < 5; k++) { var ang = -Math.PI / 2 + (k - 2) * 0.42, bx = x + Math.cos(ang) * 28, by = y - 80 + Math.sin(ang) * 28; c.fillStyle = k < e.phase - 1 ? '#fff2b0' : '#ff6a1a'; c.beginPath(); c.moveTo(bx - 5, by); c.lineTo(bx + Math.cos(ang) * 6, by - 24 + Math.abs(k - 2) * 5); c.lineTo(bx + 5, by); c.closePath(); c.fill(); c.stroke(); }
    // brazos
    c.fillStyle = '#3a3440'; c.beginPath(); c.ellipse(x - f * 82, y + 30, 18, 46, 0.3 * f, 0, TAU); c.fill(); c.stroke(); c.beginPath(); c.ellipse(x + f * 82, y + 30, 18, 46, -0.3 * f, 0, TAU); c.fill(); c.stroke();
    // reliquias: encendidas las pendientes, apagadas las rotas
    var rel = { cayado: [96, 8, '#c090ff'], nucleo: [0, 16, '#ff9a3c'], ojo: [0, -70, '#4ff0d0'], colmillo: [-72, -46, '#bfeaff'], corona: [0, -118, '#ffc440'] };
    Object.keys(rel).forEach(function (k2) {
      var r = rel[k2], rx = x + f * r[0], ry = e.y + r[1] - (e.lift || 0), on = !br[k2], act = D.parts[k2].phase === e.phase;
      c.fillStyle = !on ? '#2a2430' : act ? r[2] : '#8a8294'; c.beginPath(); c.arc(rx, ry, act ? 13 : 10, 0, TAU); c.fill(); c.stroke();
      if (on && act) { c.strokeStyle = '#fff'; c.lineWidth = 2; c.beginPath(); c.arc(rx, ry, 17 + Math.sin(t / 120) * 2, 0, TAU); c.stroke(); c.strokeStyle = OUT; c.lineWidth = 4; }
    });
    if (A().coreT > 0) { c.fillStyle = '#fff2b0'; c.beginPath(); c.arc(x, y + 40, 14 + Math.sin(t / 80) * 2, 0, TAU); c.fill(); c.stroke(); }
    c.restore();
  }
  H.draw = function (c, e) {
    var a = A(), t0 = performance.now();
    if (ART()) Assets.drawBoss('cenizar', c, e.x, e.y, artState(e)); else drawFallback(c, e);
    if (a.shards && Assets.drawCenizarShards) for (var i = 0; i < a.shards.length; i++) { var s = a.shards[i]; try { Assets.drawCenizarShards(c, s.x, s.y, G.clamp((G.time - s.t0) / 800, 0, 1), { kind: s.k === 'corazon' ? 'core' : s.k, n: G.Q && G.Q.level === 'baja' ? 4 : 8 }); } catch (x) { /* arte opcional */ } }
    else if (a.shards) for (var j = 0; j < a.shards.length; j++) { var sh = a.shards[j], u = G.clamp((G.time - sh.t0) / 800, 0, 1); c.save(); c.globalAlpha = 1 - u; c.strokeStyle = '#ffd27a'; c.lineWidth = 3; c.beginPath(); c.arc(sh.x, sh.y, 10 + 40 * u, 0, TAU); c.stroke(); c.restore(); }
    if (Z.drawOverBoss) Z.drawOverBoss(c, e);
    var dm = performance.now() - t0; a.drawMs = a.drawMs == null ? dm : a.drawMs * 0.97 + dm * 0.03; if (dm > (a.drawMax || 0)) a.drawMax = dm; a.drawN = (a.drawN || 0) + 1;
  };
  H.drawGhost = function (c, Dd) {
    if (ART()) { Assets.drawBoss('cenizar', c, Dd.x, Dd.y, { t: G.time, id: 'cenizar', facing: Dd.face, phase: 7, broken: Dd.broken, dying: true, dt: Dd.dt }); return; }
    drawFallback(c, { x: Dd.x, y: Dd.y + G.clamp(Dd.dt / 4000, 0, 1) * 40, face: Dd.face, alpha: 1 - G.clamp(Dd.dt / 5800, 0, 1), broken: Dd.broken, hurtT: 0, phase: 7, lift: 0 });
  };
  H.drawGround = function (c, e) {
    var a = A(), i, clk = a.clk;
    if (Z.drawGroundB) Z.drawGroundB(c, e);
    for (i = 0; i < a.evs.length; i++) Z.drawEv(c, a.evs[i], clk);
    if (Z.drawGroundChain) Z.drawGroundChain(c, e);
  };
  H.items = function () { };
  H.hazards = function (e, out) {
    var a = A(), i; if (!a.evs) return;
    for (i = 0; i < a.evs.length; i++) Z.hazEv(a.evs[i], out);
    if (Z.hazB) Z.hazB(e, out);
    if (Z.hazChain) Z.hazChain(e, out);
  };
  H.force = function (e, name) { if (e.mode !== 'fight' || e.atk) return false; U.startAttack(e, name); return true; };
  H.hud = function (c, e) {
    if (e.mode === 'intro' || e.mode === 'gate') return;
    var bw = 640, bx = (G.W - bw) / 2, by = 52, left = Z.furyLeft(e);
    var tx = S.fury > 1 ? 'FURIA x' + S.fury.toFixed(2).replace('.', ',') : 'Furia en ' + G.fmtTime(left);
    G.txt(c, tx, bx + bw, by - 29, 10, S.fury > 1 ? '#ff5a4a' : left < 30000 ? '#ffb070' : '#7a7086', 'right');
    if (Z.hudChain) Z.hudChain(c, e, bx, by, bw);
  };

  // ================================================================= SUELO DEL CRÁTER (procedural; si el arte registra el bioma 'crater' con arena propia se usa esa)
  Z.buildGround = function () {
    try { if (Assets.getBiome && Assets.getBiome() === 'crater' && Assets.arena) { var AR = Assets.arena(G.AW, G.AH, { seed: 777, wall: G.WALL }); if (AR && AR.canvas) { G.torches = AR.torches || []; G.ritual = AR.ritual || null; return AR.canvas; } } } catch (x0) { /* reserva por código */ }
    var cv = document.createElement('canvas'); cv.width = G.AW; cv.height = G.AH; var c = cv.getContext('2d'), i, j, seed = 4242;
    function rnd() { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; }
    c.fillStyle = '#17121d'; c.fillRect(0, 0, G.AW, G.AH);
    for (i = 0; i < 2600; i++) { var shade = rnd(); c.fillStyle = shade < 0.5 ? 'rgba(42,34,52,0.55)' : 'rgba(10,6,14,0.5)'; c.fillRect(rnd() * G.AW, rnd() * G.AH, 2 + rnd() * 10, 2 + rnd() * 6); }
    c.lineCap = 'round'; c.lineJoin = 'round';
    for (i = 0; i < 46; i++) {   // vetas de brasa en el vidrio volcánico
      var x = rnd() * G.AW, y = rnd() * G.AH, an = rnd() * 6.283, pts = [[x, y]], n = 6 + Math.floor(rnd() * 8);
      for (j = 0; j < n; j++) { an += (rnd() - 0.5) * 1.1; x += Math.cos(an) * (24 + rnd() * 36); y += Math.sin(an) * (24 + rnd() * 36); pts.push([x, y]); }
      [[7, 'rgba(255,106,26,0.10)'], [3, 'rgba(255,106,26,0.35)'], [1.2, 'rgba(255,200,110,0.7)']].forEach(function (st) { c.lineWidth = st[0]; c.strokeStyle = st[1]; c.beginPath(); pts.forEach(function (q, k) { if (k) c.lineTo(q[0], q[1]); else c.moveTo(q[0], q[1]); }); c.stroke(); });
    }
    // ruinas del hogar (decorado sin colisión): chimenea, mesa y silla quemadas
    var cx = 720, cy = 405;
    c.fillStyle = 'rgba(0,0,0,0.35)'; c.beginPath(); c.ellipse(cx, cy + 40, 150, 40, 0, 0, 6.283); c.fill();
    c.strokeStyle = OUT; c.lineWidth = 3;
    c.fillStyle = '#2a2230'; c.fillRect(cx - 38, cy - 70, 76, 100); c.strokeRect(cx - 38, cy - 70, 76, 100);
    c.fillStyle = '#0c0810'; c.fillRect(cx - 22, cy - 20, 44, 50); c.fillStyle = 'rgba(255,106,26,0.5)'; c.fillRect(cx - 14, cy + 8, 28, 22);
    c.fillStyle = '#1e1824'; for (i = 0; i < 5; i++) c.fillRect(cx - 38 + (i % 2) * 6, cy - 66 + i * 18, 70, 3);
    c.fillStyle = '#2a2024'; c.fillRect(cx + 70, cy + 4, 70, 12); c.fillRect(cx + 74, cy + 16, 6, 24); c.fillRect(cx + 130, cy + 16, 6, 24); c.strokeRect(cx + 70, cy + 4, 70, 12);
    c.fillRect(cx - 120, cy + 14, 28, 8); c.fillRect(cx - 118, cy + 22, 5, 16); c.fillRect(cx - 98, cy + 22, 5, 16);
    var g = c.createRadialGradient(cx, cy, 20, cx, cy, 320); g.addColorStop(0, 'rgba(255,106,26,0.14)'); g.addColorStop(1, 'rgba(255,106,26,0)'); c.fillStyle = g; c.fillRect(0, 0, G.AW, G.AH);
    // borde: muro de roca negra
    var W = G.WALL;
    c.fillStyle = '#0b080f'; c.fillRect(0, 0, G.AW, W); c.fillRect(0, G.AH - W, G.AW, W); c.fillRect(0, 0, W, G.AH); c.fillRect(G.AW - W, 0, W, G.AH);
    for (i = 0; i < 90; i++) { c.fillStyle = '#1a1420'; var bx = rnd() * G.AW; c.beginPath(); c.arc(bx, W - 2 + rnd() * 6, 6 + rnd() * 10, 0, 6.283); c.fill(); c.beginPath(); c.arc(bx, G.AH - W + 2 - rnd() * 6, 6 + rnd() * 10, 0, 6.283); c.fill(); }
    var vg = c.createLinearGradient(0, W, 0, W + 70); vg.addColorStop(0, 'rgba(0,0,0,0.5)'); vg.addColorStop(1, 'rgba(0,0,0,0)'); c.fillStyle = vg; c.fillRect(W, W, G.AW - 2 * W, 70);
    return cv;
  };

  S.cenizarInfo = function () { var a = A(), e = S.e; return { clk: a.clk, evs: a.evs ? a.evs.length : 0, phT: a.phT, fury: S.fury, coreT: a.coreT, hurts: a.hurts, drawMs: a.drawMs, drawMax: a.drawMax, ch: a.ch ? { n: a.ch.n, t: a.ch.t, end: a.ch.end } : null, lava: a.lava ? a.lava.state : null }; };
  S.cenizarTable = TABLE;
  S.weakView = function (id) { if (id !== 'cenizar') return null; var t = TABLE[0]; return { weak: t.w.map(function (x) { return { tag: x[0], mul: x[1] }; }), resist: t.r.map(function (x) { return { tag: x[0], mul: x[1] }; }) }; };   // tarjeta de Cacería: tabla de la F1 (cambia en cada fase)
})();
