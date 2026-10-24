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

  // M9 (A.5): icono de RELOJ ROTO a la izquierda de la mano mientras las cartas recargan más lento (zona del Lirio del olvido); el aro se vacía con los 2 s de gracia
  H.drawCdSlow = function (c, p) {
    if (!(p.cdSlowT > 0) || p.dead) return;
    var x = 250, y = 476, r = 16, pulse = 0.75 + 0.25 * Math.sin(G.time / 120), u = Math.min(1, p.cdSlowT / 2000);
    c.save(); c.globalAlpha = pulse;
    c.fillStyle = 'rgba(8,4,14,0.8)'; c.beginPath(); c.arc(x, y, r + 4, 0, 6.283); c.fill();
    if (G.hasSpr('icon_olvido')) { var ic = Assets.sprite('icon_olvido', Math.floor(G.time / 500) % 2); c.drawImage(ic, Math.round(x - ic.width / 2), Math.round(y - ic.height / 2)); }   // arte P2: reloj roto turquesa (32x32)
    else {
      c.fillStyle = '#0f3f3a'; c.strokeStyle = '#7fffe0'; c.lineWidth = 3; c.beginPath(); c.arc(x, y, r, 0, 6.283); c.fill(); c.stroke();
      c.strokeStyle = '#d8fff4'; c.lineWidth = 2; c.beginPath(); c.moveTo(x, y); c.lineTo(x + 1, y - 10); c.moveTo(x, y); c.lineTo(x + 8, y + 3); c.stroke();
      c.strokeStyle = '#ff4a4a'; c.lineWidth = 2.5; c.beginPath(); c.moveTo(x - 4, y - r - 1); c.lineTo(x + 1, y - 5); c.lineTo(x - 3, y + 1); c.lineTo(x + 3, y + 7); c.lineTo(x + 1, y + r + 1); c.stroke();
    }
    c.strokeStyle = '#7fffe0'; c.lineWidth = 3; c.beginPath(); c.arc(x, y, r + 7, -Math.PI / 2, -Math.PI / 2 + 6.283 * u); c.stroke();
    c.restore();
    G.txt(c, '-' + Math.round(Math.min(0.4, p.cdSlowPct) * 100) + '%', x, y + r + 14, 11, '#7fffe0', 'center');
  };

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
    G.Tundra.drawHud(c);   // P3: medidor de Frío bajo la barra de vida (solo en la Tundra)
    // tiempo y jefe
    var boss = G.Enemies.boss();
    if (G.mode !== 'run') {   // cacería / práctica: sin reloj de run
      G.txt(c, G.mode === 'practice' ? 'PRÁCTICA  -  intento ' + (G.practiceTries || 1) : 'CACERÍA  -  Peligro ' + G.Boss.ROMAN[G.clamp(Math.round(G.peligro || 1), 1, 5)], G.W / 2, 20, 18, G.mode === 'practice' ? '#9dffb4' : '#6ac8ff', 'center');
      if (G.mode === 'practice') G.txt(c, G.Sys.isTouch() ? 'sin recompensas  -  pausa y REINICIAR' : 'sin recompensas  -  P y luego R: reiniciar', 16, 47, 10, '#9a8fb0', 'left');
    } else {
    G.txt(c, G.fmtTime(G.runT), G.W / 2, 20, 22, G.Boss.active ? '#8a7f96' : '#ffd27a', 'center');   // el reloj de la run se congela con el jefe vivo
    if (G.Tundra.noBoss()) G.txt(c, 'Tundra: prueba sin jefe  -  fin a ' + G.fmtTime(G.RUN_LEN), G.W / 2, 42, 12, '#9fd8ff', 'center');
    else if (!G.Waves.bossSpawned) G.txt(c, 'Jefe en ' + G.fmtTime(Math.max(0, G.BOSS_T - G.runT)), G.W / 2, 42, 12, G.BOSS_T - G.runT < 30000 ? '#ff6a6a' : '#9a8fb0', 'center');
    var DU = G.Loot.dur();   // duración elegida y multiplicadores aplicados (tabla G.Loot.DUR)
    G.txt(c, DU.name.toUpperCase() + ' ' + DU.min + ' min  -  botín x' + String(DU.parts).replace('.', ',') + (DU.pf !== 1 ? '  PF x' + String(DU.pf).replace('.', ',') : '') + (DU.rare !== 1 ? '  Esencia x' + String(DU.rare).replace('.', ',') : '') + (DU.bossHp !== 1 ? '  jefe +' + Math.round((G.Boss.durMul() * DU.bossHp - 1) * 100) + ' % HP' : ''), G.W / 2, 58, 10, '#8a7f96', 'center');
    }
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
    H.drawCdSlow(c, p);
    var need = B.xpNeed(p.level);
    c.fillStyle = 'rgba(10,6,18,0.85)'; c.fillRect(0, G.H - 7, G.W, 7);
    c.fillStyle = '#4dd870'; c.fillRect(0, G.H - 6, G.W * G.clamp(p.xp / need, 0, 1), 4);
    G.txt(c, 'NV ' + p.level, 16, G.H - 20, 15, '#9dffb4', 'left');
    // ayuda inicial
    var since = G.time - G.t0;
    if (since < 9000 && G.state === 'play') {
      c.save(); c.globalAlpha = since > 7000 ? (9000 - since) / 2000 : 1;
      G.txt(c, G.Sys.isTouch() ? 'Mueve el dedo en la mitad izquierda: las cartas atacan solas' : 'Muévete con WASD / flechas: las cartas atacan solas', G.W / 2, 380, 16, '#ffffff', 'center');
      G.txt(c, 'Sube de nivel para conseguir cartas. Haz que sus etiquetas se toquen.', G.W / 2, 402, 13, '#d8cfe8', 'center');
      c.restore();
    }
    try { G.Quests.tick(); G.Cook.drawHud(c); } catch (e0) { /* encargo de racha sin daño y chip del plato (Fase 2b) */ }
    drawBanner(c);
    G.Boss.drawHud(c);   // barra del jefe, intro cinematográfica (barras de cine sobre la mano), viñeta de ataque firma (boss.js)
    if (G.state === 'paused') drawPause(c);
    if (p.hurtT > 300) { c.fillStyle = 'rgba(255,0,0,' + (0.18 * (p.hurtT - 300) / 300) + ')'; c.fillRect(0, 0, G.W, G.H); }
  };

  // Menú de pausa (táctil y ratón): CONTINUAR, CALIDAD, SONIDO, REINICIAR (práctica) y ABANDONAR con confirmación explícita (se pulsa dos veces)
  var PB = {
    go:   { x: 300, y: 128, w: 360, h: 56 },
    qual: { x: 300, y: 194, w: 176, h: 50 },
    snd:  { x: 484, y: 194, w: 176, h: 50 },
    redo: { x: 300, y: 254, w: 360, h: 50 },
    quit: { x: 300, y: 314, w: 360, h: 56 }
  };
  var quitAsk = 0;
  H.pauseOpen = function () { quitAsk = 0; };
  H.pauseClick = function (m) {
    var U = G.UI, now = performance.now();
    if (U.inR(PB.go, m)) { G.state = 'play'; G.input.lock = 150; G.resetClock(); }
    else if (U.inR(PB.qual, m)) { G.Sys.cycleQuality(); }
    else if (U.inR(PB.snd, m)) { G.Sys.toggleMute(); }
    else if (G.mode === 'practice' && U.inR(PB.redo, m)) { G.Base.retryPractice(); }
    else if (U.inR(PB.quit, m)) {
      if (quitAsk > now) { quitAsk = 0; G.finish(false); }
      else { quitAsk = now + 3500; }
    } else quitAsk = 0;
  };
  function drawPause(c) {
    var U = G.UI, now = performance.now();
    c.fillStyle = 'rgba(8,4,14,0.8)'; c.fillRect(0, 0, G.W, G.H);
    G.txt(c, 'PAUSA', G.W / 2, 82, 44, '#ffd27a', 'center');
    U.button(c, PB.go, 'CONTINUAR', { size: 24, color: '#2a8a4a', hot: '#3aba66', border: '#9dffb4' });
    U.button(c, PB.qual, 'GRÁFICOS: ' + G.Sys.qualityLabel(), { size: 13, color: '#4a3a66', hot: '#6a5a86', border: '#8a7aa6' });
    U.button(c, PB.snd, G.Sys.muted ? 'SONIDO: NO' : 'SONIDO: SÍ', { size: 14, color: G.Sys.muted ? '#7a3a3a' : '#4a3a66', hot: '#6a5a86', border: '#8a7aa6' });
    if (G.mode === 'practice') U.button(c, PB.redo, 'REINICIAR PRÁCTICA', { size: 18, color: '#2a6aa8', hot: '#3a8ad0', border: '#bfeaff' });
    var ask = quitAsk > now;
    U.button(c, PB.quit, ask ? 'SEGURO? TOCA OTRA VEZ' : 'ABANDONAR EXPEDICIÓN', { size: ask ? 20 : 18, color: ask ? '#a02030' : '#3a2f48', hot: '#c03040', border: ask ? '#ff8a8a' : '#8a6a8a' });
    G.txt(c, 'Conservas las partes recogidas', G.W / 2, 388, 12, '#ffb347', 'center');
    if (G.Sys.isTouch()) {
      G.txt(c, 'Las cartas atacan solas: tú solo esquiva', G.W / 2, 424, 14, '#d8cfe8', 'center');
      G.txt(c, 'Mueve el pulgar en la mitad izquierda para andar', G.W / 2, 446, 13, '#9a8fb0', 'center');
    } else {
      G.txt(c, 'P o Esc: continuar     WASD / flechas: mover', G.W / 2, 424, 14, '#d8cfe8', 'center');
      G.txt(c, 'B: abandonar' + (G.mode === 'practice' ? '     R: reiniciar práctica' : ''), G.W / 2, 446, 13, '#9a8fb0', 'center');
    }
  }
})();
