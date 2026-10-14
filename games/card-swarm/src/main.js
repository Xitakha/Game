/* main.js - Swarm Hand: núcleo, balance, entrada, bucle de paso fijo y render. Canvas 2D puro.
   Parámetros de depuración por URL: ?speed=4 (acelera el tiempo), ?god=1 (invulnerable), ?t=240 (empieza en el segundo indicado), ?biome=cripta,
   ?pf=<n> (Puntos de Forja), ?give=, ?len=, ?reset=1, ?dbg=1. Entrada táctil: toque = clic (al soltar), joystick flotante en la mitad izquierda, deslizar = cambiar pestaña. */
(function () {
  'use strict';
  var G = window.G = {};
  G.W = 960; G.H = 540;          // viewport
  G.AW = 1440; G.AH = 810;       // arena (la cámara sigue al jugador)
  G.WALL = 28;                   // margen de pared
  G.STEP = 1000 / 60;            // paso fijo en ms
  G.RUN_LEN = 9 * 60000;         // duración prevista de la run (9:00); G.setLen() la cambia (7 / 9 / 10 min, selector de la Base o ?len=)
  G.BOSS_T = 7.5 * 60000;        // el Pastor aparece a los 7:30 (margen de 1:30 para matarlo); escala con la duración
  G.tk = 1;                      // factor de tiempo del director: 9 / minutos de la run. G.vt() = tiempo "virtual" en la escala de 9:00
  G.setLen = function (min) { G.RUN_LEN = min * 60000; G.BOSS_T = G.RUN_LEN * 7.5 / 9; G.tk = 9 / min; };
  G.runT = 0;                    // reloj de la RUN: se congela mientras el jefe vive (v4). G.time sigue corriendo (temporizadores, animaciones)
  G.vt = function () { return G.runT * G.tk; };

  function qnum(name, def) { var m = new RegExp('[?&]' + name + '=([\\d.]+)').exec(location.search); return m ? parseFloat(m[1]) : def; }
  G.speed = qnum('speed', 1); G.god = qnum('god', 0) > 0; G.t0 = qnum('t', 0) * 1000;
  // Jefes v4: ?boss=pastor salta a la pelea, ?peligro=<n> (1-5), ?phase=2|3, ?hp=0.3, ?nointro=1, ?hand=spark:3,ember:2 (mano de prueba)
  G.bossUrl = (/[?&]boss=(\w+)/.exec(location.search) || [])[1] || null; G.peligro = qnum('peligro', 1);
  G.dbgHpCal = qnum('hpcal', 0); G.dbgPhase = qnum('phase', 0); G.dbgHp = qnum('hp', 0); G.nointro = qnum('nointro', 0) > 0;

  // ---------------------------------------------------------------- Balance (único objeto)
  G.B = {
    player: { hp: 100, speed: 190, r: 10, invuln: 600, kb: 60, pickup: 60, heartP: 0.02, heal: 12 },
    anchorSlots: 2,                // cartas ancla con las que parte la expedición (de 5 slots); cambiar a 3 es trivial
    // maxAlive = tope simultáneo por tipo; elite = lo genera el director en un instante fijo (no por presupuesto)
    enemy: {
      worm:    { hp: 14,  spd: 70, dmg: 6,  r: 10, cost: 1, from: 0,      w: 55, spr: 'worm',    xp: 1, ash: 1, maxAlive: 40 },
      archer:  { hp: 10,  spd: 60, dmg: 8,  r: 11, cost: 3, from: 45000,  w: 20, spr: 'archer',  xp: 2, ash: 1, maxAlive: 10 },
      fanner:  { hp: 16,  spd: 55, dmg: 6,  r: 11, cost: 4, from: 90000,  w: 14, spr: 'enemy_fanner',  xp: 3, ash: 1, maxAlive: 8 },
      boar:    { hp: 45,  spd: 55, dmg: 14, r: 15, cost: 5, from: 120000, w: 10, spr: 'boar',    xp: 4, ash: 3, maxAlive: 8 },
      shield:  { hp: 40,  spd: 48, dmg: 10, r: 13, cost: 5, from: 165000, w: 9,  spr: 'enemy_shield',  xp: 5, ash: 3, maxAlive: 6 },
      bomb:    { hp: 8,   spd: 105, dmg: 20, r: 10, cost: 2, from: 210000, w: 10, spr: 'bomb',    xp: 2, ash: 1, maxAlive: 8 },
      moth:    { hp: 14,  spd: 80, dmg: 5,  r: 10, cost: 4, from: 240000, w: 10, spr: 'enemy_moth',    xp: 3, ash: 1, maxAlive: 5 },
      sower:   { hp: 22,  spd: 45, dmg: 6,  r: 12, cost: 5, from: 270000, w: 7,  spr: 'enemy_sower',   xp: 5, ash: 3, maxAlive: 3 },
      blinker: { hp: 18,  spd: 65, dmg: 16, r: 11, cost: 6, from: 315000, w: 7,  spr: 'enemy_blinker', xp: 6, ash: 3, maxAlive: 4 },
      scorcher:{ hp: 30,  spd: 60, dmg: 12, r: 12, cost: 6, from: 360000, w: 6,  spr: 'enemy_scorcher',xp: 6, ash: 3, maxAlive: 3 },
      warlock: { hp: 30,  spd: 50, dmg: 0,  r: 13, cost: 8, from: 405000, w: 5,  spr: 'warlock', xp: 6, ash: 5, maxAlive: 2 },
      mini_bulwark: { hp: 420, spd: 42, dmg: 22, r: 22, cost: 0, from: Infinity, w: 0, spr: 'enemy_mini_bulwark', xp: 30, ash: 20, elite: true, at: 210000, name: 'COLOSO ESCUDERO' },
      mini_hive:    { hp: 520, spd: 38, dmg: 14, r: 24, cost: 0, from: Infinity, w: 0, spr: 'enemy_mini_hive',    xp: 40, ash: 25, elite: true, at: 330000, name: 'MADRE COLMENA' },
      boss:    { hp: 1400, spd: 60, dmg: 20, r: 24, cost: 0, from: Infinity, w: 0, spr: 'boss',   xp: 60, ash: 30 }
    },
    // Curva del director: multiplicador de PESO de spawn y de TOPE (maxAlive) por tier y minuto (interpolación lineal entre filas).
    // Lo débil sale y lo fuerte entra, con presupuesto total (bp/cap) intacto. Suelo 'floor' = mínimo para no perder variedad.
    // tier 0: worm  1: archer fanner bomb  2: boar shield moth  3: sower blinker scorcher warlock  (cada tipo tiene su 'tier' en B.tier)
    tier: { worm: 0, archer: 1, fanner: 1, bomb: 1, boar: 2, shield: 2, moth: 2, sower: 3, blinker: 3, scorcher: 3, warlock: 3 },
    tierCurve: [   // [minuto, mult tier0, tier1, tier2, tier3]
      [0, 1.0, 1.0, 1.0, 1.0],
      [2, 0.85, 0.85, 1.0, 1.0],
      [3, 0.55, 0.6, 0.9, 1.1],
      [4, 0.35, 0.4, 0.75, 1.3],
      [5, 0.2, 0.25, 0.6, 1.6],
      [6, 0.14, 0.15, 0.45, 1.9],
      [7, 0.12, 0.12, 0.35, 2.2],
      [9, 0.12, 0.12, 0.3, 2.4]
    ],
    tierFloor: 0.12,
    tierMul: function (type, m) {
      var t = G.B.tier[type]; if (t == null) return 1;
      var c = G.B.tierCurve, i = 1;
      if (m <= c[0][0]) return c[0][t + 1];
      while (i < c.length - 1 && m > c[i][0]) i++;
      var a = c[i - 1], b = c[i], u = G.clamp((m - a[0]) / (b[0] - a[0]), 0, 1);
      return Math.max(G.B.tierFloor, a[t + 1] + (b[t + 1] - a[t + 1]) * u);
    },
    light: { worm: 1, archer: 1, fanner: 1, bomb: 1, moth: 1 },   // únicos tipos que el director permite con el jefe vivo
    // Multiplicador GLOBAL de daño de cartas (armas, combos, zonas, estados). Aplicado en G.Combat.deal y G.Combat.dot. No afecta a enemigos. 0.98 = -2 %.
    cardDmgMul: 0.98,
    skipAsh: 5,                                                      // Ceniza que da omitir la elección de carta al subir de nivel
    spawnTelegraph: 400,
    // presupuesto por pulso de 1,5 s; el factor tras el min 3 compensa que los enemigos fuertes cuestan más (densidad total similar)
    bp: function (m) { return (2 + 1.6 * m) * (1 + 0.07 * Math.max(0, m - 3)); },
    cap: function (m) { return Math.min(30 + 10 * m, 110); },       // tope de enemigos
    hpMult: function (m) { return Math.min(3.2, 1 + 0.22 * m); },
    dmgMult: function (m) { return 1 + 0.06 * m; },
    xpNeed: function (L) { return L === 1 ? 8 : 8 + 6 * L; }   // la 1.ª subida llega pronto (~0:15)
  };

  // ---------------------------------------------------------------- Utilidades
  G.rnd = function (a, b) { return a + Math.random() * (b - a); };
  G.clamp = function (v, a, b) { return v < a ? a : v > b ? b : v; };
  G.dist = function (ax, ay, bx, by) { return Math.hypot(bx - ax, by - ay); };
  G.angDiff = function (a, b) { var d = (a - b) % (Math.PI * 2); if (d > Math.PI) d -= Math.PI * 2; if (d < -Math.PI) d += Math.PI * 2; return d; };
  G.hasSpr = function (n) { try { return !!Assets.info(n); } catch (e) { return false; } };   // los sprites nuevos pueden no existir aún
  G.dbg = /[?&]dbg=1/.test(location.search) ? { dmg: {} } : null;   // ?dbg=1 cuenta el daño recibido por fuente (window.G.dbg.dmg)
  G.sfx = function (n, o) { try { if (window.Assets) Assets.sfx(n, o); } catch (e) { /* audio opcional */ } };
  G.txt = function (c, s, x, y, size, color, align, stroke) {
    c.font = 'bold ' + size + 'px "Courier New", monospace';
    c.textAlign = align || 'left'; c.textBaseline = 'middle';
    c.lineWidth = Math.max(2, size / 5); c.strokeStyle = stroke || '#0a0610'; c.lineJoin = 'round';
    c.strokeText(s, x, y); c.fillStyle = color || '#fff'; c.fillText(s, x, y);
  };
  G.fmtTime = function (ms) { var s = Math.floor(ms / 1000), m = Math.floor(s / 60); s %= 60; return (m < 10 ? '0' : '') + m + ':' + (s < 10 ? '0' : '') + s; };

  // ---------------------------------------------------------------- Entrada
  var inp = G.input = { keys: {}, pressed: {}, mouse: { x: 480, y: 270 }, lock: 0 };
  inp.held = function () { for (var i = 0; i < arguments.length; i++) if (inp.keys[arguments[i]]) return true; return false; };
  inp.hit = function () { for (var i = 0; i < arguments.length; i++) if (inp.pressed[arguments[i]]) return true; return false; };
  var canvas, ctx;

  function bindInput() {
    window.addEventListener('keydown', function (e) {
      inp.keys[e.code] = true;
      if (!e.repeat) inp.pressed[e.code] = true;
      if (e.shiftKey) inp.pressed['ShiftDigit' + (e.code.replace('Digit', ''))] = !e.repeat && /^Digit/.test(e.code);
      try { G.Snd.unlock(); } catch (x) { /* sin audio */ }
      if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Tab'].indexOf(e.code) >= 0) e.preventDefault();
    });
    window.addEventListener('keyup', function (e) { inp.keys[e.code] = false; });
    window.addEventListener('blur', function () { inp.keys = {}; inp.joy = null; if (G.state === 'play') G.state = 'paused'; });
    function mpos(e) {
      var r = canvas.getBoundingClientRect();
      inp.mouse.x = (e.clientX - r.left) * G.W / r.width;
      inp.mouse.y = (e.clientY - r.top) * G.H / r.height;
    }
    canvas.addEventListener('mousemove', mpos);
    canvas.addEventListener('mousedown', function (e) {
      mpos(e); inp.keys['Mouse' + e.button] = true; inp.pressed['Mouse' + e.button] = true; e.preventDefault();
      try { G.Snd.unlock(); } catch (x) { /* sin audio */ }
    });
    window.addEventListener('mouseup', function (e) { inp.keys['Mouse' + e.button] = false; });
    canvas.addEventListener('contextmenu', function (e) { e.preventDefault(); });
    bindTouch();
  }

  // Táctil: toque corto = clic (al soltar, en coordenadas del juego); joystick flotante con un toque que empieza en la mitad izquierda
  // (solo en la aldea caminando o en la expedición); deslizar horizontal = inp.swipe (-1 izquierda / +1 derecha, un paso).
  function bindTouch() {
    var tc = {};
    inp.joy = { active: false, id: null, ox: 0, oy: 0, x: 0, y: 0 };
    function pt(e, t) {
      var r = canvas.getBoundingClientRect();
      return { x: (t.clientX - r.left) * G.W / r.width, y: (t.clientY - r.top) * G.H / r.height };
    }
    function joyOK(p) {
      if (p.x >= 400) return false;
      if (G.state === 'play') return true;
      return G.state === 'aldea' && G.Aldea.joyOK();
    }
    canvas.addEventListener('touchstart', function (e) {
      e.preventDefault(); try { G.Snd.unlock(); } catch (x) { /* audio */ }
      for (var i = 0; i < e.changedTouches.length; i++) {
        var t = e.changedTouches[i], p = pt(e, t);
        tc[t.identifier] = { x0: p.x, y0: p.y, t0: performance.now(), x: p.x, y: p.y, joy: false };
        inp.mouse.x = p.x; inp.mouse.y = p.y;
        if (!inp.joy.active && joyOK(p)) { tc[t.identifier].joy = true; inp.joy = { active: true, id: t.identifier, ox: p.x, oy: p.y, x: 0, y: 0 }; }
      }
    }, { passive: false });
    canvas.addEventListener('touchmove', function (e) {
      e.preventDefault();
      for (var i = 0; i < e.changedTouches.length; i++) {
        var t = e.changedTouches[i], p = pt(e, t), o = tc[t.identifier]; if (!o) continue;
        o.x = p.x; o.y = p.y; inp.mouse.x = p.x; inp.mouse.y = p.y;
        if (o.joy) {
          var dx = p.x - inp.joy.ox, dy = p.y - inp.joy.oy, d = Math.hypot(dx, dy), R = 50;
          if (d > R) { inp.joy.ox += dx / d * (d - R); inp.joy.oy += dy / d * (d - R); dx = p.x - inp.joy.ox; dy = p.y - inp.joy.oy; d = R; }
          inp.joy.x = d > 8 ? dx / R : 0; inp.joy.y = d > 8 ? dy / R : 0;
        }
      }
    }, { passive: false });
    function end(e) {
      e.preventDefault();
      for (var i = 0; i < e.changedTouches.length; i++) {
        var t = e.changedTouches[i], p = pt(e, t), o = tc[t.identifier]; if (!o) continue;
        delete tc[t.identifier];
        var moved = Math.hypot(p.x - o.x0, p.y - o.y0), dur = performance.now() - o.t0;
        if (o.joy) inp.joy = { active: false, id: null, ox: 0, oy: 0, x: 0, y: 0 };
        inp.mouse.x = p.x; inp.mouse.y = p.y;
        if (moved < 18 && dur < 600) inp.pressed.Mouse0 = true;
        else if (Math.abs(p.x - o.x0) > 90 && Math.abs(p.y - o.y0) < 60 && dur < 700 && !o.joy) inp.swipe = p.x > o.x0 ? 1 : -1;
      }
    }
    canvas.addEventListener('touchend', end, { passive: false });
    canvas.addEventListener('touchcancel', end, { passive: false });
  }

  // ---------------------------------------------------------------- Mundo
  G.cam = { x: 0, y: 0 };
  G.state = 'aldea';   // aldea | play | paused | cards | gameover
  G.time = 0; G.kills = 0; G.won = false;

  G.reset = function () {
    G.time = G.t0; G.runT = G.t0; G.kills = 0; G.deadT = 0; G.won = false; G.pendingLevels = 0; G.endT = 0;
    G.enemies = []; G.projectiles = []; G.zones = []; G.gems = [];
    G.fx.clear();
    G.player = G.Player.create();
    G.Cards.reset();
    G.Weapons.reset();
    G.Waves.reset();
    G.Boss.reset();
    G.cam.x = G.clamp(G.player.x - G.W / 2, 0, G.AW - G.W);
    G.cam.y = G.clamp(G.player.y - G.H / 2, 0, G.AH - G.H);
  };

  G.startGame = function () {
    try { Assets.unlock(); } catch (e) { /* sin audio */ }
    G.setLen(G.lenOverride || G.Save.data.len || 9);
    var pd = G.Save.data.pending;   // compras de Rufo (Tónico / Imán): valen para ESTA expedición
    G.runBuff = { tonic: !!pd.tonic, magnet: !!pd.magnet }; pd.tonic = 0; pd.magnet = 0; G.Save.save();
    G.Loot.beginRun();
    G.reset();
    // Destino (bioma) y jefe: el bioma elegido en el Portal decide el jefe (J1: siempre el Pastor)
    var biome = G.biomeUrl || G.Save.data.biome || 'bosque';
    if (biome !== 'bosque' && !G.biomeUrl && !G.Save.data.bossKills.pastor) biome = 'bosque';
    G.curBiome = biome; try { Assets.setBiome(biome); } catch (e2) { /* sin bioma */ }
    if (G.groundBiome !== biome) { G.ground = buildGround(); G.groundBiome = biome; }
    G.bossId = G.Boss.bossFor(biome);
    if (G.bossUrl) { G.bossId = G.bossUrl; G.time = G.runT = G.BOSS_T - 100; }
    var hq = /[?&]hand=([^&]+)/.exec(location.search);
    if (hq) { decodeURIComponent(hq[1]).split(',').forEach(function (kv) { var a = kv.split(':'), n = parseInt(a[1], 10) || 1; for (var i = 0; i < n; i++) G.Cards.add(a[0]); }); G.Cards.recalc(false); }
    // Las anclas ya están en la mano (Cards.reset). Si no hay ningún arma, primera decisión: 1 de 3 cartas iniciales
    var armed = G.player.hand.some(function (s) { return s && G.Cards.def(s.id).type === 'attack'; });
    if (armed) G.state = 'play';
    else { G.state = 'cards'; G.Cards.open('start'); }
    inp.lock = 250;
    try { Assets.music.setTrack('normal'); Assets.music.setIntensity(0.1); Assets.music.start(); } catch (e) { /* sin audio */ }
  };

  G.finish = function (won) {
    if (G.state === 'gameover') return;
    G.won = won; G.state = 'gameover';
    G.finalHand = G.Cards.snapshot();
    G.Loot.endRun(won);
    G.sfx(won ? 'boss_die' : 'game_over');
    if (won) { try { G.Snd.play('win'); } catch (e) { /* audio */ } }
    try { Assets.music.stop(); } catch (e) { /* sin audio */ }
  };

  // ---------------------------------------------------------------- Actualización
  function updateWorld(dt) {
    G.time += dt;
    if (!(G.Boss.active || G.Boss.defeated)) G.runT += dt;   // el reloj de la run se congela mientras el jefe vive
    G.Player.update(G.player, dt);
    G.Weapons.update(dt);
    G.Enemies.update(dt);
    G.Combat.update(dt);
    G.Waves.update(dt);
    G.Hud.update(dt);
    G.fx.update(dt);
    var p = G.player;
    var tx = G.clamp(p.x - G.W / 2, 0, G.AW - G.W), ty = G.clamp(p.y - G.H / 2, 0, G.AH - G.H);
    var ct = G.Boss.camTarget(tx, ty);   // la intro del jefe desplaza la cámara y hace zoom
    G.cam.x += (ct.x - G.cam.x) * 0.15; G.cam.y += (ct.y - G.cam.y) * 0.15;
    if (p.dead) { G.deadT += dt; if (G.deadT > 900) G.finish(false); return; }
    if (G.bossDead) { G.endT += dt; if (G.endT > 3000) G.finish(true); return; }
    if (G.pendingLevels > 0) { G.state = 'cards'; G.Cards.open('level'); }
  }

  function step() {
    var dt = G.STEP;
    if (inp.lock > 0) inp.lock -= dt;
    switch (G.state) {
      case 'aldea':
        G.Aldea.update(dt);
        break;
      case 'play':
        if (inp.hit('KeyP', 'Escape')) { G.state = 'paused'; break; }
        if (G.fx.hitstop > 0) { G.fx.hitstop -= dt; G.fx.updateShake(dt); break; }
        updateWorld(dt);
        break;
      case 'paused':
        if (inp.hit('KeyP', 'Escape')) G.state = 'play';
        else if (inp.hit('KeyB')) G.finish(false);   // abandonar: conserva las partes recogidas y va al botín
        break;
      case 'cards':
        G.fx.updateShake(dt);
        G.Cards.update(dt);
        break;
      case 'gameover':
        G.fx.update(dt);
        G.Base.updateEnd();
        break;
    }
    inp.pressed = {}; inp.swipe = 0;
  }

  // ---------------------------------------------------------------- Render
  function buildGround() {
    var A = Assets.arena(G.AW, G.AH, { seed: 777, wall: G.WALL });
    G.torches = A.torches; G.ritual = A.ritual;
    return A.canvas;
  }

  function drawJoy(c) {
    var j = inp.joy; if (!j || !j.active) return;
    c.save(); c.globalAlpha = 0.5; c.lineWidth = 4; c.strokeStyle = '#ffe9a0'; c.fillStyle = 'rgba(255,233,160,0.12)';
    c.beginPath(); c.arc(j.ox, j.oy, 52, 0, 6.283); c.fill(); c.stroke();
    c.fillStyle = '#ffe9a0'; c.beginPath(); c.arc(j.ox + j.x * 40, j.oy + j.y * 40, 22, 0, 6.283); c.fill(); c.restore();
  }

  function draw() {
    ctx.imageSmoothingEnabled = false;
    if (G.state === 'aldea') { G.Aldea.draw(ctx); drawJoy(ctx); return; }
    ctx.fillStyle = '#0d0a14'; ctx.fillRect(0, 0, G.W, G.H);
    var off = G.fx.offset();
    ctx.save();
    var zm = G.cam.zoom || 1;
    if (zm !== 1) { ctx.translate(G.W / 2, G.H / 2); ctx.scale(zm, zm); ctx.translate(-G.W / 2, -G.H / 2); }
    ctx.translate(-Math.round(G.cam.x + off.x), -Math.round(G.cam.y + off.y));
    ctx.drawImage(G.ground, 0, 0);
    G.Combat.drawZones(ctx);
    G.Weapons.drawGround(ctx);
    G.Enemies.drawGround(ctx);
    G.Boss.drawGround(ctx);
    G.fx.drawCorpses(ctx);
    G.Combat.drawGems(ctx);
    var items = G.enemies.filter(function (q) { return q.type !== 'bosspart'; }); items.push(G.player); G.Boss.items(items);
    items.sort(function (a, b) { return (a.sortY != null ? a.sortY : a.y) - (b.sortY != null ? b.sortY : b.y); });
    for (var i = 0; i < items.length; i++) {
      if (items[i] === G.player) G.Player.draw(ctx, G.player); else if (items[i].draw) items[i].draw(ctx, items[i]); else G.Enemies.draw(ctx, items[i]);
    }
    G.Weapons.drawAir(ctx);
    G.Enemies.drawProjectiles(ctx);
    G.fx.draw(ctx);
    var tt = performance.now();
    if (G.ritual) Assets.drawRitualGlow(ctx, G.ritual.x, G.ritual.y, tt, G.ritual.r);
    for (var ti = 0; ti < G.torches.length; ti++) Assets.drawTorchFire(ctx, G.torches[ti].x, G.torches[ti].y, tt, G.torches[ti].o);
    Assets.drawFireflies(ctx, G.AW, G.AH, tt, { count: 60, view: { x: G.cam.x, y: G.cam.y, w: G.W, h: G.H } });
    Assets.drawFog(ctx, G.AW, G.AH, tt, { alpha: 0.4, layers: 2 });
    ctx.restore();
    ctx.drawImage(Assets.vignette(G.W, G.H, { strength: 0.8 }), 0, 0);
    G.Hud.draw(ctx);
    drawJoy(ctx);
  }

  // ---------------------------------------------------------------- Bucle
  var last = 0, acc = 0;
  function frame(t) {
    var d = Math.min(100, t - last); last = t; acc += d * G.speed;
    var n = 0, maxN = Math.ceil(6 * G.speed);
    while (acc >= G.STEP && n < maxN) { step(); acc -= G.STEP; n++; }
    if (n === maxN) acc = 0;
    draw();
    requestAnimationFrame(frame);
  }

  G.init = function () {
    canvas = document.getElementById('game'); ctx = canvas.getContext('2d');
    G.ctx = ctx; canvas.focus();
    bindInput();
    G.Save.applyUrl();
    G.Tree.sync();
    var bq = /[?&]biome=(\w+)/.exec(location.search); if (bq) { Assets.setBiome(bq[1]); G.biomeUrl = bq[1]; }
    else if (G.Save.data.biome) Assets.setBiome(G.Save.data.biome);
    G.ground = buildGround(); G.groundBiome = Assets.getBiome();
    G.reset();
    G.Aldea.open(false);
    if (G.bossUrl) G.startGame();   // ?boss=pastor: salta directo a la pelea
    requestAnimationFrame(function (t) { last = t; frame(t); });
  };
})();
