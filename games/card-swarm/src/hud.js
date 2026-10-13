/* hud.js - HUD de Swarm Hand: mano, combos, banner de combo, barras, título, pausa y pantalla final con la mano. */
(function () {
  'use strict';
  var G = window.G, B = G.B, H = G.Hud = {};
  var bn = { text: '', t: 0, max: 1, color: '#fff', combo: null };
  var RETRY = { x: 380, y: 452, w: 200, h: 46 };

  H.banner = function (text, ms, color, combo) { bn.text = text; bn.t = ms; bn.max = ms; bn.color = color || '#fff'; bn.combo = combo || null; };
  H.inRetry = function (x, y) { return x >= RETRY.x && x <= RETRY.x + RETRY.w && y >= RETRY.y && y <= RETRY.y + RETRY.h; };

  H.update = function (dt) {
    if (bn.t > 0) bn.t -= dt;
    var f = G.Cards.flash;
    for (var k in f) if (f[k] > 0) f[k] -= dt;
  };

  function bar(c, x, y, w, h, frac, fill, back) {
    c.fillStyle = 'rgba(10,6,18,0.8)'; c.fillRect(x - 3, y - 3, w + 6, h + 6);
    c.fillStyle = back; c.fillRect(x, y, w, h);
    c.fillStyle = fill; c.fillRect(x, y, w * G.clamp(frac, 0, 1), h);
    c.fillStyle = 'rgba(255,255,255,0.18)'; c.fillRect(x, y, w * G.clamp(frac, 0, 1), Math.max(2, h / 3));
  }

  function drawBanner(c) {
    if (bn.t <= 0) return;
    var e = 1 - bn.t / bn.max, u = bn.t / bn.max;
    var a = u < 0.25 ? u / 0.25 : 1, pop = 1 + 0.6 * Math.max(0, 1 - e * 7);
    c.save(); c.globalAlpha = Math.max(0, Math.min(1, a));
    if (bn.combo) {
      var cb = bn.combo, ca = G.TAGS[cb.a].color, cbb = G.TAGS[cb.b].color;
      var gy = c.createLinearGradient(0, 0, G.W, 0);
      gy.addColorStop(0, 'rgba(0,0,0,0)'); gy.addColorStop(0.2, 'rgba(8,4,14,0.8)'); gy.addColorStop(0.8, 'rgba(8,4,14,0.8)'); gy.addColorStop(1, 'rgba(0,0,0,0)');
      c.fillStyle = gy; c.fillRect(0, 96, G.W, 110);
      c.strokeStyle = ca; c.lineWidth = 3; c.beginPath(); c.moveTo(120, 98); c.lineTo(G.W - 120, 98); c.stroke();
      c.strokeStyle = cbb; c.beginPath(); c.moveTo(120, 204); c.lineTo(G.W - 120, 204); c.stroke();
      c.save(); c.translate(G.W / 2, 140); c.scale(pop, pop);
      c.font = 'bold 54px "Courier New", monospace'; c.textAlign = 'center'; c.textBaseline = 'middle';
      var tw = c.measureText(bn.text).width / 2, gr = c.createLinearGradient(-tw, 0, tw, 0); gr.addColorStop(0, ca); gr.addColorStop(0.5, '#ffffff'); gr.addColorStop(1, cbb);
      c.lineWidth = 9; c.strokeStyle = '#0a0610'; c.lineJoin = 'round'; c.strokeText(bn.text, 0, 0);
      c.shadowColor = ca; c.shadowBlur = 24; c.fillStyle = gr; c.fillText(bn.text, 0, 0); c.restore();
      G.txt(c, G.TAGS[cb.a].name + '  +  ' + G.TAGS[cb.b].name, G.W / 2, 178, 16, '#ffe9a0', 'center');
      G.txt(c, cb.desc, G.W / 2, 196, 12, '#d8cfe8', 'center');
      // destello inicial
      if (e < 0.08) { c.fillStyle = 'rgba(255,255,255,' + 0.25 * (1 - e / 0.08) + ')'; c.fillRect(0, 0, G.W, G.H); }
    } else {
      G.txt(c, bn.text, G.W / 2, 140, Math.round(40 * pop), bn.color, 'center');
    }
    c.restore();
  }

  function drawHand(c) {
    var p = G.player, h = p.hand, i;
    for (i = 0; i < h.length; i++) {
      var r = G.Cards.slotRect(i, false);
      if (h[i]) G.Cards.drawCard(c, h[i], r.x, r.y, r.w, r.h, {});
      else G.Cards.drawEmptySlot(c, r.x, r.y, r.w, r.h, '');
    }
    G.Cards.drawComboLines(c, false);
  }

  function drawCombosList(c) {
    var y = 64, any = false, t = G.time / 1000;
    G.Cards.combos.forEach(function (cb) {
      if (!G.Cards.active[cb.k]) return;
      if (!any) { G.txt(c, 'COMBOS', 16, y, 12, '#9a8fb0', 'left'); y += 18; any = true; }
      var fl = (G.Cards.flash[cb.k] || 0) > 0 && Math.floor(G.time / 120) % 2;
      c.fillStyle = G.TAGS[cb.a].color; c.beginPath(); c.arc(22, y, 5, 0, 6.283); c.fill();
      c.fillStyle = G.TAGS[cb.b].color; c.beginPath(); c.arc(32, y, 5, 0, 6.283); c.fill();
      G.txt(c, cb.name, 44, y, 13, fl ? '#ffffff' : '#ffe9a0', 'left');
      y += 18;
    });
  }

  H.draw = function (c) {
    var p = G.player, i;
    if (G.state === 'title') { drawTitle(c); return; }
    if (G.state === 'cards') { G.Cards.draw(c); return; }
    if (G.state === 'gameover') { drawOver(c); return; }
    // vida
    bar(c, 16, 14, 220, 18, p.hp / p.maxHp, p.hp / p.maxHp > 0.3 ? '#e0405a' : '#ff2a2a', '#3a1020');
    G.txt(c, 'HP ' + Math.ceil(p.hp) + '/' + p.maxHp, 126, 24, 13, '#fff', 'center');
    // tiempo y jefe
    G.txt(c, G.fmtTime(G.time), G.W / 2, 20, 22, '#ffd27a', 'center');
    var boss = G.Enemies.boss();
    if (!G.Waves.bossSpawned) G.txt(c, 'Jefe en ' + G.fmtTime(Math.max(0, G.BOSS_T - G.time)), G.W / 2, 42, 12, G.BOSS_T - G.time < 30000 ? '#ff6a6a' : '#9a8fb0', 'center');
    // kills, ceniza
    G.txt(c, 'Kills ' + G.kills, G.W - 16, 18, 15, '#fff', 'right');
    c.fillStyle = '#ff9a3c'; c.beginPath(); c.moveTo(G.W - 100, 38); c.lineTo(G.W - 95, 44); c.lineTo(G.W - 100, 50); c.lineTo(G.W - 105, 44); c.closePath(); c.fill();
    G.txt(c, 'Ceniza ' + p.ash, G.W - 16, 44, 15, '#ff9a3c', 'right');
    drawCombosList(c);
    // barra del jefe
    if (boss && boss.spawnT <= 0) {
      var bw = 460, bx = (G.W - bw) / 2, by = 72;
      G.txt(c, 'EL PASTOR CORRUPTO', G.W / 2, by - 11, 14, boss.rage ? '#ff6a6a' : '#ffd27a', 'center');
      bar(c, bx, by, bw, 14, boss.hp / boss.maxHp, boss.rage ? '#ff3030' : '#c03a8a', '#3a1020');
    }
    // mano y XP
    drawHand(c);
    var need = B.xpNeed(p.level);
    c.fillStyle = 'rgba(10,6,18,0.85)'; c.fillRect(0, G.H - 7, G.W, 7);
    c.fillStyle = '#4dd870'; c.fillRect(0, G.H - 6, G.W * G.clamp(p.xp / need, 0, 1), 4);
    G.txt(c, 'NV ' + p.level, 16, G.H - 20, 15, '#9dffb4', 'left');
    // ayuda inicial
    var since = G.time - G.t0;
    if (since < 9000 && G.state === 'play') {
      c.save(); c.globalAlpha = since > 7000 ? (9000 - since) / 2000 : 1;
      G.txt(c, 'Muévete con WASD / flechas: las cartas atacan solas', G.W / 2, 380, 16, '#ffffff', 'center');
      G.txt(c, 'Sube de nivel para conseguir cartas. Haz que sus etiquetas se toquen.', G.W / 2, 402, 13, '#d8cfe8', 'center');
      c.restore();
    }
    drawBanner(c);
    if (G.state === 'paused') drawPause(c);
    if (p.hurtT > 300) { c.fillStyle = 'rgba(255,0,0,' + (0.18 * (p.hurtT - 300) / 300) + ')'; c.fillRect(0, 0, G.W, G.H); }
  };

  function drawTitle(c) {
    c.fillStyle = 'rgba(8,4,14,0.74)'; c.fillRect(0, 0, G.W, G.H);
    G.fx.spr(c, Assets.sprite('player', Math.floor(Date.now() / 450) % 2), G.W / 2, 120, { sx: 2.4, sy: 2.4 });
    G.txt(c, 'SWARM HAND', G.W / 2, 205, 62, '#ffd27a', 'center');
    G.txt(c, 'Tu mano de cartas dispara sola. Haz que se toquen.', G.W / 2, 252, 17, '#d8cfe8', 'center');
    // demo de combo
    var ids = ['spark', 'shard', 'zap'], t = Date.now() / 1000;
    var xs = [310, 400, 490];
    c.save(); c.globalCompositeOperation = 'lighter'; c.lineWidth = 6; c.globalAlpha = 0.6 + 0.3 * Math.sin(t * 5);
    var gr = c.createLinearGradient(xs[0] + 36, 0, xs[1] + 36, 0); gr.addColorStop(0, G.TAGS.fire.color); gr.addColorStop(1, G.TAGS.ice.color);
    c.strokeStyle = gr; c.beginPath(); c.moveTo(xs[0] + 36, 326); c.quadraticCurveTo((xs[0] + xs[1]) / 2 + 36, 292, xs[1] + 36, 326); c.stroke(); c.restore();
    for (var i = 0; i < 3; i++) G.Cards.drawCard(c, { id: ids[i], lvl: 1 }, xs[i] + (i === 2 ? 70 : 0), 326, 72, 96, {});
    G.txt(c, 'VAPOR!', 400 - 10, 296, 20, '#ffe9a0', 'center');
    if (Math.floor(Date.now() / 500) % 2) G.txt(c, 'Pulsa ENTER o haz clic para jugar', G.W / 2, 452, 22, '#ffd27a', 'center');
    G.txt(c, 'WASD / flechas: mover   1-3: elegir carta   R: reroll   P: pausa', G.W / 2, 482, 13, '#9a8fb0', 'center');
    G.txt(c, 'Sobrevive 5 minutos y derrota al Pastor Corrupto', G.W / 2, 504, 13, '#9a8fb0', 'center');
  }

  function drawPause(c) {
    c.fillStyle = 'rgba(8,4,14,0.72)'; c.fillRect(0, 0, G.W, G.H);
    G.txt(c, 'PAUSA', G.W / 2, 200, 52, '#ffd27a', 'center');
    G.txt(c, 'Pulsa P o Esc para continuar', G.W / 2, 262, 18, '#d8cfe8', 'center');
    G.txt(c, 'WASD / flechas: mover. Las cartas atacan solas.', G.W / 2, 300, 14, '#9a8fb0', 'center');
  }

  function drawOver(c) {
    var won = G.won, p = G.player;
    c.fillStyle = won ? 'rgba(20,14,0,0.9)' : 'rgba(20,0,6,0.9)'; c.fillRect(0, 0, G.W, G.H);
    G.txt(c, won ? 'MANO GANADORA' : 'HAS CAÍDO', G.W / 2, 56, 52, won ? '#ffd24a' : '#ff5a5a', 'center');
    G.txt(c, 'Tiempo ' + G.fmtTime(G.time) + '   -   Kills ' + G.kills + '   -   Nivel ' + p.level, G.W / 2, 96, 18, '#fff', 'center');
    var h = p.hand, i;
    for (i = 0; i < h.length; i++) {
      var r = G.Cards.slotRect(i, 'end');
      if (h[i]) G.Cards.drawCard(c, { id: h[i].id, lvl: h[i].lvl }, r.x, r.y, r.w, r.h, { nocd: true });
      else G.Cards.drawEmptySlot(c, r.x, r.y, r.w, r.h, '');
    }
    G.Cards.drawComboLines(c, 'end');
    var names = G.Cards.combos.filter(function (cb) { return G.Cards.active[cb.k]; });
    if (names.length) {
      G.txt(c, 'COMBOS ACTIVOS', G.W / 2, 340, 13, '#9a8fb0', 'center');
      names.forEach(function (cb, k) {
        var col = k % 3, row = Math.floor(k / 3), x = G.W / 2 + (col - 1) * 230, y = 364 + row * 22;
        c.fillStyle = G.TAGS[cb.a].color; c.beginPath(); c.arc(x - 90, y, 5, 0, 6.283); c.fill();
        c.fillStyle = G.TAGS[cb.b].color; c.beginPath(); c.arc(x - 79, y, 5, 0, 6.283); c.fill();
        G.txt(c, cb.name, x - 66, y, 13, '#ffe9a0', 'left');
      });
    } else G.txt(c, 'Sin combos: la próxima vez junta etiquetas distintas', G.W / 2, 350, 14, '#9a8fb0', 'center');
    var m = G.input.mouse, hov = H.inRetry(m.x, m.y);
    c.fillStyle = hov ? '#ff9a3c' : '#c4601c'; c.fillRect(RETRY.x, RETRY.y, RETRY.w, RETRY.h);
    c.strokeStyle = '#ffd27a'; c.lineWidth = 3; c.strokeRect(RETRY.x, RETRY.y, RETRY.w, RETRY.h);
    G.txt(c, 'Una más (R)', RETRY.x + RETRY.w / 2, RETRY.y + RETRY.h / 2, 20, '#fff', 'center');
  }
})();
