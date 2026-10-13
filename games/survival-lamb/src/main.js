/* main.js - Ember Flock: núcleo, balance, entrada, bucle de paso fijo y render. Canvas 2D puro. */
(function () {
  'use strict';
  var G = window.G = {};
  G.W = 960; G.H = 540;          // viewport
  G.AW = 1440; G.AH = 810;       // arena (la cámara sigue al jugador)
  G.WALL = 28;                   // margen de pared
  G.STEP = 1000 / 60;            // paso fijo en ms

  // ---------------------------------------------------------------- Balance (único objeto)
  G.B = {
    player: { hp: 100, speed: 190, atkSlow: 0.4, r: 10, invuln: 600, kb: 60, crit: 0.10, healWave: 15, healBoss: 30 },
    combo: [
      { dmg: 10, wind: 80, act: 80, rec: 120, adv: 14, kb: 50, range: 44, arc: 100 },
      { dmg: 10, wind: 70, act: 80, rec: 120, adv: 14, kb: 50, range: 44, arc: 100 },
      { dmg: 18, wind: 110, act: 100, rec: 260, adv: 30, kb: 120, range: 52, arc: 140 }
    ],
    chainWindow: 250, comboReset: 400, buffer: 150,
    roll: { dur: 280, dist: 110, iframes: 200, cd: 700 },
    special: { r: 90, dmg: 35, wind: 200, rec: 150, cd: 8000, kb: 100, burnDps: 5, burnT: 3000 },
    enemy: {
      worm:    { hp: 20, spd: 80,  dmg: 8,  r: 10, cost: 2, from: 1, w: 50, spr: 'worm' },
      archer:  { hp: 15, spd: 70,  dmg: 10, r: 11, cost: 3, from: 3, w: 25, spr: 'archer' },
      boar:    { hp: 40, spd: 60,  dmg: 18, r: 15, cost: 5, from: 4, w: 15, spr: 'boar' },
      bomb:    { hp: 12, spd: 110, dmg: 25, r: 10, cost: 3, from: 6, w: 10, spr: 'bomb' },
      warlock: { hp: 30, spd: 50,  dmg: 0,  r: 12, cost: 6, from: 8, w: 5,  spr: 'warlock' },
      boss:    { hp: 400, spd: 70, dmg: 20, r: 24, cost: 0, from: 5, w: 0,  spr: 'boss' }
    },
    spawnTelegraph: 500,
    budget: function (n) { return 6 + 3 * n + Math.floor(Math.pow(n, 1.5) / 2); },
    maxSim: function (n) { return Math.min(8 + n, 30); },
    hpMult: function (n) { return Math.min(2.5, 1 + 0.06 * (n - 1)); },
    dmgMult: function (n) { return Math.min(2.0, 1 + 0.04 * (n - 1)); }
  };

  // ---------------------------------------------------------------- Utilidades
  G.rnd = function (a, b) { return a + Math.random() * (b - a); };
  G.clamp = function (v, a, b) { return v < a ? a : v > b ? b : v; };
  G.dist = function (ax, ay, bx, by) { return Math.hypot(bx - ax, by - ay); };
  G.angDiff = function (a, b) { var d = (a - b) % (Math.PI * 2); if (d > Math.PI) d -= Math.PI * 2; if (d < -Math.PI) d += Math.PI * 2; return d; };
  G.sfx = function (n, o) { try { if (window.Assets) Assets.sfx(n, o); } catch (e) { /* audio opcional */ } };
  G.txt = function (c, s, x, y, size, color, align, stroke) {
    c.font = 'bold ' + size + 'px "Courier New", monospace';
    c.textAlign = align || 'left'; c.textBaseline = 'middle';
    c.lineWidth = Math.max(2, size / 5); c.strokeStyle = stroke || '#0a0610'; c.lineJoin = 'round';
    c.strokeText(s, x, y); c.fillStyle = color || '#fff'; c.fillText(s, x, y);
  };

  // ---------------------------------------------------------------- Entrada
  var inp = G.input = { keys: {}, pressed: {}, mouse: { x: 480, y: 270 }, lock: 0 };
  inp.held = function () { for (var i = 0; i < arguments.length; i++) if (inp.keys[arguments[i]]) return true; return false; };
  inp.hit = function () { for (var i = 0; i < arguments.length; i++) if (inp.pressed[arguments[i]]) return true; return false; };
  var canvas, ctx;

  function bindInput() {
    window.addEventListener('keydown', function (e) {
      inp.keys[e.code] = true;
      if (!e.repeat) inp.pressed[e.code] = true;
      if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].indexOf(e.code) >= 0) e.preventDefault();
    });
    window.addEventListener('keyup', function (e) { inp.keys[e.code] = false; });
    window.addEventListener('blur', function () { inp.keys = {}; if (G.state === 'play') G.state = 'paused'; });
    function mpos(e) {
      var r = canvas.getBoundingClientRect();
      inp.mouse.x = (e.clientX - r.left) * G.W / r.width;
      inp.mouse.y = (e.clientY - r.top) * G.H / r.height;
    }
    canvas.addEventListener('mousemove', mpos);
    canvas.addEventListener('mousedown', function (e) {
      mpos(e); inp.keys['Mouse' + e.button] = true; inp.pressed['Mouse' + e.button] = true; e.preventDefault();
    });
    window.addEventListener('mouseup', function (e) { inp.keys['Mouse' + e.button] = false; });
    canvas.addEventListener('contextmenu', function (e) { e.preventDefault(); });
  }

  // ---------------------------------------------------------------- Mundo
  G.cam = { x: 0, y: 0 };
  G.state = 'title';   // title | play | paused | cards | gameover
  G.time = 0; G.kills = 0;

  G.reset = function () {
    G.time = 0; G.kills = 0; G.deadT = 0;
    G.player = G.Player.create();
    G.enemies = []; G.projectiles = []; G.zones = [];
    G.fx.clear();
    G.Cards.reset();
    G.Waves.reset();
    G.cam.x = G.clamp(G.player.x - G.W / 2, 0, G.AW - G.W);
    G.cam.y = G.clamp(G.player.y - G.H / 2, 0, G.AH - G.H);
  };

  G.startGame = function () {
    try { Assets.unlock(); } catch (e) { /* sin audio */ }
    G.reset();
    G.state = 'play';
    inp.lock = 250;
    try { Assets.music.setIntensity(0); Assets.music.start(); } catch (e) { /* sin audio */ }
    G.Waves.start(1);
  };

  G.gameOver = function () {
    if (G.state === 'gameover') return;
    G.state = 'gameover';
    G.sfx('game_over');
    try { Assets.music.stop(); } catch (e) { /* sin audio */ }
  };

  // ---------------------------------------------------------------- Actualización
  function updateWorld(dt) {
    G.time += dt;
    G.Player.update(G.player, dt);
    G.Enemies.update(dt);
    G.Waves.update(dt);
    G.fx.update(dt);
    var p = G.player;
    var tx = G.clamp(p.x - G.W / 2, 0, G.AW - G.W), ty = G.clamp(p.y - G.H / 2, 0, G.AH - G.H);
    G.cam.x += (tx - G.cam.x) * 0.15; G.cam.y += (ty - G.cam.y) * 0.15;
    if (p.dead) {
      G.deadT += dt;
      if (G.deadT > 900) G.gameOver();
    }
  }

  function step() {
    var dt = G.STEP;
    if (inp.lock > 0) inp.lock -= dt;
    switch (G.state) {
      case 'title':
        if (inp.hit('Enter', 'Space', 'Mouse0', 'KeyJ')) G.startGame();
        break;
      case 'play':
        if (inp.hit('KeyP', 'Escape')) { G.state = 'paused'; break; }
        if (G.fx.hitstop > 0) { G.fx.hitstop -= dt; G.fx.updateShake(dt); break; }
        updateWorld(dt);
        break;
      case 'paused':
        if (inp.hit('KeyP', 'Escape')) G.state = 'play';
        break;
      case 'cards':
        G.fx.updateShake(dt);
        G.Cards.update(dt);
        break;
      case 'gameover':
        G.fx.update(dt);
        if (inp.hit('KeyR', 'Enter') || (inp.hit('Mouse0') && G.Hud.inRetry(inp.mouse.x, inp.mouse.y))) G.startGame();
        break;
    }
    inp.pressed = {};
  }

  // ---------------------------------------------------------------- Render
  function buildGround() {
    var c = document.createElement('canvas'); c.width = G.AW; c.height = G.AH;
    var g = c.getContext('2d'); g.imageSmoothingEnabled = false;
    var seed = 12345;
    function r() { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; }
    var x, y, i;
    for (y = 0; y < G.AH; y += 32) for (x = 0; x < G.AW; x += 32) {
      var k = r() < 0.72 ? 0 : 1 + Math.floor(r() * 9);
      g.drawImage(Assets.sprite('ground' + k, 0), x, y);
    }
    g.drawImage(Assets.sprite('ritual_circle', 0), G.AW / 2 - 128, G.AH / 2 - 128, 256, 256);
    for (i = 0; i < 70; i++) {
      var nm = ['grass0', 'grass1', 'grass2', 'mushroom'][Math.floor(r() * 4)];
      g.drawImage(Assets.sprite(nm, 0), 40 + r() * (G.AW - 80), 40 + r() * (G.AH - 80));
    }
    for (i = 0; i < 14; i++) {
      g.globalAlpha = 0.7;
      g.drawImage(Assets.sprite('rune' + Math.floor(r() * 2), 0), 60 + r() * (G.AW - 120), 60 + r() * (G.AH - 120));
    }
    g.globalAlpha = 1;
    // borde oscuro + rocas
    var grad;
    g.fillStyle = 'rgba(8,5,14,0.82)';
    g.fillRect(0, 0, G.AW, G.WALL - 6); g.fillRect(0, G.AH - G.WALL + 6, G.AW, G.WALL);
    g.fillRect(0, 0, G.WALL - 6, G.AH); g.fillRect(G.AW - G.WALL + 6, 0, G.WALL, G.AH);
    var edge = 'rgba(8,5,14,0.5)';
    grad = g.createLinearGradient(0, 0, 0, 90); grad.addColorStop(0, edge); grad.addColorStop(1, 'rgba(8,5,14,0)');
    g.fillStyle = grad; g.fillRect(0, 0, G.AW, 90);
    grad = g.createLinearGradient(0, G.AH, 0, G.AH - 90); grad.addColorStop(0, edge); grad.addColorStop(1, 'rgba(8,5,14,0)');
    g.fillStyle = grad; g.fillRect(0, G.AH - 90, G.AW, 90);
    grad = g.createLinearGradient(0, 0, 90, 0); grad.addColorStop(0, edge); grad.addColorStop(1, 'rgba(8,5,14,0)');
    g.fillStyle = grad; g.fillRect(0, 0, 90, G.AH);
    grad = g.createLinearGradient(G.AW, 0, G.AW - 90, 0); grad.addColorStop(0, edge); grad.addColorStop(1, 'rgba(8,5,14,0)');
    g.fillStyle = grad; g.fillRect(G.AW - 90, 0, 90, G.AH);
    for (x = 0; x < G.AW; x += 30) {
      var rk = 'rock' + Math.floor(r() * 3);
      g.drawImage(Assets.sprite(rk, 0), x + r() * 10, 2 + r() * 8);
      g.drawImage(Assets.sprite(rk, 0), x + r() * 10, G.AH - 28 + r() * 6);
    }
    for (y = 20; y < G.AH; y += 30) {
      var rk2 = 'rock' + Math.floor(r() * 3);
      g.drawImage(Assets.sprite(rk2, 0), 0 + r() * 6, y + r() * 8);
      g.drawImage(Assets.sprite(rk2, 0), G.AW - 30 + r() * 6, y + r() * 8);
    }
    G.torches = Assets.decorate(g, G.AW, G.AH, { seed: 777, wall: G.WALL, torches: 6 }).torches;
    return c;
  }

  function draw() {
    ctx.imageSmoothingEnabled = false;
    ctx.fillStyle = '#0d0a14'; ctx.fillRect(0, 0, G.W, G.H);
    var off = G.fx.offset();
    ctx.save();
    ctx.translate(-Math.round(G.cam.x + off.x), -Math.round(G.cam.y + off.y));
    ctx.drawImage(G.ground, 0, 0);
    G.Enemies.drawGround(ctx);
    G.fx.drawCorpses(ctx);
    var items = G.enemies.slice(); items.push(G.player);
    items.sort(function (a, b) { return a.y - b.y; });
    for (var i = 0; i < items.length; i++) {
      if (items[i] === G.player) G.Player.draw(ctx, G.player); else G.Enemies.draw(ctx, items[i]);
    }
    G.Enemies.drawProjectiles(ctx);
    G.fx.draw(ctx);
    var tt = performance.now();
    for (var ti = 0; ti < G.torches.length; ti++) Assets.drawTorchFire(ctx, G.torches[ti].x, G.torches[ti].y, tt);
    Assets.drawFog(ctx, G.AW, G.AH, tt, { alpha: 0.5, layers: 2 });
    ctx.restore();
    ctx.drawImage(Assets.vignette(G.W, G.H, { strength: 0.65 }), 0, 0);
    G.Hud.draw(ctx);
  }

  // ---------------------------------------------------------------- Bucle
  var last = 0, acc = 0;
  function frame(t) {
    var d = Math.min(100, t - last); last = t; acc += d;
    var n = 0;
    while (acc >= G.STEP && n < 6) { step(); acc -= G.STEP; n++; }
    if (n === 6) acc = 0;
    draw();
    requestAnimationFrame(frame);
  }

  G.init = function () {
    canvas = document.getElementById('game'); ctx = canvas.getContext('2d');
    G.ctx = ctx; canvas.focus();
    bindInput();
    var bq = /[?&]biome=(\w+)/.exec(location.search); if (bq) Assets.setBiome(bq[1]);
    G.ground = buildGround();
    G.reset();
    requestAnimationFrame(function (t) { last = t; frame(t); });
  };
})();
