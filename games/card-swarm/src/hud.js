/* hud.js - HUD de Swarm Hand: mano, combos, banner de combo, barras, contador de partes y pausa (título y fin de run: base.js). */
(function () {
  'use strict';
  var G = window.G, B = G.B, H = G.Hud = {};
  var bn = { text: '', t: 0, max: 1, color: '#fff', combo: null };

  H.banner = function (text, ms, color, combo) { bn.text = text; bn.t = ms; bn.max = ms; bn.color = color || '#fff'; bn.combo = combo || null; };

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
    if (G.state === 'cards') { G.Cards.draw(c); return; }
    if (G.state === 'gameover') { G.Base.drawEnd(c); return; }
    // vida
    bar(c, 16, 14, 220, 18, p.hp / p.maxHp, p.hp / p.maxHp > 0.3 ? '#e0405a' : '#ff2a2a', '#3a1020');
    G.txt(c, 'HP ' + Math.ceil(p.hp) + '/' + p.maxHp, 126, 24, 13, '#fff', 'center');
    // tiempo y jefe
    G.txt(c, G.fmtTime(G.runT), G.W / 2, 20, 22, G.Boss.active ? '#8a7f96' : '#ffd27a', 'center');   // el reloj de la run se congela con el jefe vivo
    var boss = G.Enemies.boss();
    if (!G.Waves.bossSpawned) G.txt(c, 'Jefe en ' + G.fmtTime(Math.max(0, G.BOSS_T - G.runT)), G.W / 2, 42, 12, G.BOSS_T - G.runT < 30000 ? '#ff6a6a' : '#9a8fb0', 'center');
    // kills, ceniza
    G.txt(c, 'Kills ' + G.kills, G.W - 16, 18, 15, '#fff', 'right');
    c.fillStyle = '#ff9a3c'; c.beginPath(); c.moveTo(G.W - 100, 38); c.lineTo(G.W - 95, 44); c.lineTo(G.W - 100, 50); c.lineTo(G.W - 105, 44); c.closePath(); c.fill();
    G.txt(c, 'Ceniza ' + p.ash, G.W - 16, 44, 15, '#ff9a3c', 'right');
    // contador de partes recogidas en la expedición
    var LR = G.Loot.run;
    G.UI.part(c, 'thread', G.W - 105, 68, 7); G.txt(c, 'Partes ' + LR.total, G.W - 16, 68, 15, '#e8dcb0', 'right');
    if (LR.rare) { G.UI.part(c, 'rare', G.W - 105, 88, 7); G.txt(c, 'Rara x' + LR.rare, G.W - 16, 88, 13, '#e0a8ff', 'right'); }
    drawCombosList(c);
    var qt = G.Quests.hudText();
    if (qt) {
      var qy = LR.rare ? 108 : 88, tgt = G.Quests.target();
      G.txt(c, 'Encargo', G.W - 16, qy, 11, '#9a8fb0', 'right');
      G.txt(c, qt, G.W - 16, qy + 17, 14, tgt ? '#ffe9a0' : '#9dffb4', 'right');
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
    G.Boss.drawHud(c);   // barra del jefe, intro cinematográfica (barras de cine sobre la mano), viñeta de ataque firma (boss.js)
    if (G.state === 'paused') drawPause(c);
    if (p.hurtT > 300) { c.fillStyle = 'rgba(255,0,0,' + (0.18 * (p.hurtT - 300) / 300) + ')'; c.fillRect(0, 0, G.W, G.H); }
  };

  function drawPause(c) {
    c.fillStyle = 'rgba(8,4,14,0.72)'; c.fillRect(0, 0, G.W, G.H);
    G.txt(c, 'PAUSA', G.W / 2, 200, 52, '#ffd27a', 'center');
    G.txt(c, 'Pulsa P o Esc para continuar', G.W / 2, 262, 18, '#d8cfe8', 'center');
    G.txt(c, 'WASD / flechas: mover. Las cartas atacan solas.', G.W / 2, 300, 14, '#9a8fb0', 'center');
    G.txt(c, 'B: abandonar la expedición (conservas las partes recogidas)', G.W / 2, 330, 14, '#ffb347', 'center');
  }
})();
