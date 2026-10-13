/* hud.js - HUD, avisos, título, pausa y game over. */
(function () {
  'use strict';
  var G = window.G, B = G.B, H = G.Hud = {};
  var bn = { text: '', t: 0, max: 1, color: '#fff' };
  var RETRY = { x: 380, y: 400, w: 200, h: 50 };

  H.banner = function (text, ms, color) { bn.text = text; bn.t = ms; bn.max = ms; bn.color = color || '#fff'; };
  H.inRetry = function (x, y) { return x >= RETRY.x && x <= RETRY.x + RETRY.w && y >= RETRY.y && y <= RETRY.y + RETRY.h; };

  function fmtTime(ms) { var s = Math.floor(ms / 1000), m = Math.floor(s / 60); s %= 60; return m + ':' + (s < 10 ? '0' : '') + s; }

  function ring(c, x, y, r, frac, color, label, key, extra) {
    c.save();
    c.fillStyle = 'rgba(10,6,18,0.8)'; c.beginPath(); c.arc(x, y, r, 0, 6.283); c.fill();
    c.strokeStyle = '#3a2f4d'; c.lineWidth = 5; c.beginPath(); c.arc(x, y, r - 3, 0, 6.283); c.stroke();
    c.strokeStyle = frac >= 1 ? color : '#8a7fa0'; c.lineWidth = 5;
    c.beginPath(); c.arc(x, y, r - 3, -Math.PI / 2, -Math.PI / 2 + 6.283 * Math.max(0.001, frac)); c.stroke();
    if (label === 'flame') G.fx.spr(c, Assets.sprite('flame', Math.floor(G.time / 150) % 3), x, y - 1, { alpha: frac >= 1 ? 1 : 0.4, sx: 1.2, sy: 1.2 });
    else G.fx.spr(c, Assets.sprite('dust', Math.floor(G.time / 200) % 2), x, y, { alpha: frac >= 1 ? 1 : 0.4, sx: 1.8, sy: 1.8 });
    G.txt(c, key, x, y + r + 10, 11, '#d8cfe8', 'center');
    if (extra) G.txt(c, extra, x + r - 4, y - r + 6, 13, '#ffd27a', 'center');
    c.restore();
  }

  H.draw = function (c) {
    var p = G.player, W = G.Waves;
    if (G.state === 'title') { drawTitle(c); return; }
    // vida
    var x = 16, y = 14, w = 220;
    c.fillStyle = 'rgba(10,6,18,0.8)'; c.fillRect(x - 3, y - 3, w + 6, 24);
    c.fillStyle = '#3a1020'; c.fillRect(x, y, w, 18);
    var f = Math.max(0, p.hp / p.maxHp);
    c.fillStyle = f > 0.3 ? '#e0405a' : '#ff2a2a'; c.fillRect(x, y, w * f, 18);
    c.fillStyle = 'rgba(255,255,255,0.18)'; c.fillRect(x, y, w * f, 6);
    G.txt(c, 'HP ' + Math.ceil(p.hp) + '/' + p.maxHp, x + w / 2, y + 10, 13, '#fff', 'center');
    // oleada
    G.txt(c, 'OLEADA ' + W.n, G.W / 2, 22, 20, W.isBoss ? '#ff6a6a' : '#ffd27a', 'center');
    if (W.phase === 'combat' || W.phase === 'clear') G.txt(c, W.isBoss ? 'Jefe' : 'Quedan ' + W.remaining(), G.W / 2, 44, 14, '#d8cfe8', 'center');
    // kills y tiempo
    G.txt(c, 'Kills ' + G.kills, G.W - 16, 22, 15, '#fff', 'right');
    G.txt(c, fmtTime(G.time), G.W - 16, 42, 15, '#d8cfe8', 'right');
    // habilidades
    var S = B.special;
    var frac = p.charges >= 1 ? 1 : 1 - Math.max(0, p.spCd) / S.cd;
    if (p.stats.maxCharges > 1) frac = p.charges >= p.stats.maxCharges ? 1 : (p.charges >= 1 ? 1 : frac);
    ring(c, 44, G.H - 54, 26, frac, '#ff9a3c', 'flame', 'K / ClkDer', p.stats.maxCharges > 1 ? 'x' + p.charges : '');
    var rf = p.rollCd > 0 ? 1 - p.rollCd / p.stats.rollCd : 1;
    ring(c, 130, G.H - 54, 26, rf, '#9ad0ff', 'roll', 'Espacio');
    // mejoras activas
    var ids = Object.keys(p.cards), ix = G.W / 2 - ids.length * 17;
    for (var i = 0; i < ids.length; i++) {
      var def = G.Cards.defs.filter(function (d) { return d.id === ids[i]; })[0];
      var bx = ix + i * 34, by = G.H - 30;
      c.fillStyle = 'rgba(10,6,18,0.8)'; c.strokeStyle = G.Cards.RAR[def.rar].color; c.lineWidth = 2;
      c.fillRect(bx - 14, by - 14, 28, 28); c.strokeRect(bx - 14, by - 14, 28, 28);
      G.Cards.drawIcon(c, def.icon, bx, by, 20);
      if (p.cards[ids[i]] > 1) G.txt(c, 'x' + p.cards[ids[i]], bx + 10, by + 12, 11, '#ffd27a', 'center');
    }
    // barra del jefe
    var boss = G.Enemies.boss();
    if (boss && boss.spawnT <= 0) {
      var bw = 460, bx2 = (G.W - bw) / 2, by2 = G.H - 92;
      G.txt(c, 'EL PASTOR CORRUPTO', G.W / 2, by2 - 12, 15, boss.rage ? '#ff6a6a' : '#ffd27a', 'center');
      c.fillStyle = 'rgba(10,6,18,0.85)'; c.fillRect(bx2 - 3, by2 - 3, bw + 6, 20);
      c.fillStyle = '#3a1020'; c.fillRect(bx2, by2, bw, 14);
      c.fillStyle = boss.rage ? '#ff3030' : '#c03a8a'; c.fillRect(bx2, by2, bw * Math.max(0, boss.hp / boss.maxHp), 14);
    }
    // aviso grande
    if (bn.t > 0) {
      bn.t -= 16.7;
      var u = bn.t / bn.max, a = u > 0.8 ? (1 - u) / 0.2 : u < 0.25 ? u / 0.25 : 1;
      c.save(); c.globalAlpha = Math.max(0, Math.min(1, a));
      G.txt(c, bn.text, G.W / 2, 130, 44 + (u > 0.8 ? (u - 0.8) * 40 : 0), bn.color, 'center');
      if (W.phase === 'countdown' && W.t > 0) G.txt(c, String(Math.ceil(W.t / 1000)), G.W / 2, 185, 28, '#fff', 'center');
      c.restore();
    }
    if (G.state === 'cards') G.Cards.draw(c);
    if (G.state === 'paused') drawPause(c);
    if (G.state === 'gameover') drawOver(c);
    // vignette de daño
    if (p.hurtT > 300) { c.fillStyle = 'rgba(255,0,0,' + (0.18 * (p.hurtT - 300) / 300) + ')'; c.fillRect(0, 0, G.W, G.H); }
  };

  function drawTitle(c) {
    c.fillStyle = 'rgba(8,4,14,0.72)'; c.fillRect(0, 0, G.W, G.H);
    G.fx.spr(c, Assets.sprite('player', Math.floor(Date.now() / 450) % 2), G.W / 2, 190, { sx: 3, sy: 3 });
    G.fx.spr(c, Assets.sprite('flame', Math.floor(Date.now() / 120) % 3), G.W / 2 + 70, 205, { sx: 2.5, sy: 2.5 });
    G.txt(c, 'EMBER FLOCK', G.W / 2, 290, 58, '#ff9a3c', 'center');
    G.txt(c, 'Un corderito, una llama sagrada y un claro maldito', G.W / 2, 335, 16, '#d8cfe8', 'center');
    var blink = Math.floor(Date.now() / 500) % 2;
    if (blink) G.txt(c, 'Pulsa ENTER o haz click para jugar', G.W / 2, 400, 22, '#ffd27a', 'center');
    G.txt(c, 'WASD mover  |  Click/J atacar (combo x3)  |  Espacio rodar  |  K/ClickDer Llama Sagrada  |  P pausa', G.W / 2, 470, 13, '#9a8fb0', 'center');
  }

  function drawPause(c) {
    c.fillStyle = 'rgba(8,4,14,0.7)'; c.fillRect(0, 0, G.W, G.H);
    G.txt(c, 'PAUSA', G.W / 2, 220, 52, '#ffd27a', 'center');
    G.txt(c, 'Pulsa P o Esc para continuar', G.W / 2, 280, 18, '#d8cfe8', 'center');
  }

  function drawOver(c) {
    c.fillStyle = 'rgba(20,0,6,0.78)'; c.fillRect(0, 0, G.W, G.H);
    G.txt(c, 'HAS CAÍDO', G.W / 2, 130, 54, '#ff5a5a', 'center');
    G.txt(c, 'Oleada alcanzada: ' + G.Waves.n, G.W / 2, 210, 22, '#fff', 'center');
    G.txt(c, 'Enemigos derrotados: ' + G.kills, G.W / 2, 250, 22, '#fff', 'center');
    G.txt(c, 'Tiempo: ' + fmtTime(G.time), G.W / 2, 290, 22, '#fff', 'center');
    var m = G.input.mouse, hov = H.inRetry(m.x, m.y);
    c.fillStyle = hov ? '#ff9a3c' : '#c4601c'; c.fillRect(RETRY.x, RETRY.y, RETRY.w, RETRY.h);
    c.strokeStyle = '#ffd27a'; c.lineWidth = 3; c.strokeRect(RETRY.x, RETRY.y, RETRY.w, RETRY.h);
    G.txt(c, 'Reintentar (R)', RETRY.x + RETRY.w / 2, RETRY.y + RETRY.h / 2, 20, '#fff', 'center');
  }
})();
