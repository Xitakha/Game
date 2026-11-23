/* hud.js - HUD de Swarm Hand: mano, combos, banner de combo, barras, contador de partes y pausa (título y fin de run: base.js). */
(function () {
  'use strict';
  var G = window.G, B = G.B, H = G.Hud = {};
  var bn = { text: '', t: 0, max: 1, color: '#fff', combo: null };

  H.banner = function (text, ms, color, combo) { bn.text = text; bn.t = ms; bn.max = ms; bn.color = color || '#fff'; bn.combo = combo || null; };

  H.update = function (dt) {
    if (bn.t > 0) bn.t -= dt;
    if (G.Fte) G.Fte.tick(dt);   // T-F1-02: avisos de la 1.ª expedición (solo estado de UI)
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
      G.txt(c, cb.desc, G.W / 2, 196, G.hudWide() ? 15 : 12, '#d8cfe8', 'center');
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
      if (h[i]) G.Cards.drawCard(c, h[i], r.x, r.y, r.w, r.h, G.hudWide() ? { ns: 15 } : {});
      else G.Cards.drawEmptySlot(c, r.x, r.y, r.w, r.h, '');
    }
    G.Cards.drawComboLines(c, false);
  }

  // M9 (A.5): icono de RELOJ ROTO a la izquierda de la mano mientras las cartas recargan más lento (zona del Lirio del olvido); el aro se vacía con los 2 s de gracia
  H.drawCdSlow = function (c, p) {
    if (!(p.cdSlowT > 0) || p.dead) return;
    var wide = G.hudWide(), A = wide ? G.anchor() : null, x = wide ? A.L + 5 * 84 + 22 : 424, y = wide ? A.B - 64 : 470, r = 16, pulse = 0.75 + 0.25 * Math.sin(G.time / 120), u = Math.min(1, p.cdSlowT / 2000);
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
    G.txt(c, '-' + Math.round(Math.min(0.4, p.cdSlowPct) * 100) + '%', x, y + r + 14, wide ? 15 : 11, '#7fffe0', 'center');
  };

  function drawCombosList(c) {
    var y = 64 + (G.Tundra.on ? 16 : 0), any = false, t = G.time / 1000;   // Tundra: el medidor de Frío y su etiqueta ocupan hasta y 68
    var wide = G.hudWide(), L = 16, dy = 18, s1 = 12, s2 = 13;
    if (wide) { var A = G.anchor(); L = A.L; y = A.T + 44 + (G.Tundra.on ? 34 : 0) + (G.mode === 'practice' ? 0 : 0); dy = 22; s1 = 15; s2 = 15; }   // T-F1-08: bajo la barra de vida, filas de 22, letra 15 (>= 10 px reales a 740x360)
    G.Cards.combos.forEach(function (cb) {
      if (!G.Cards.active[cb.k]) return;
      if (!any) { G.txt(c, 'COMBOS', L, y, s1, '#9a8fb0', 'left'); y += dy; any = true; }
      var fl = (G.Cards.flash[cb.k] || 0) > 0 && Math.floor(G.time / 120) % 2;
      c.fillStyle = G.TAGS[cb.a].color; c.beginPath(); c.arc(L + 6, y, 5, 0, 6.283); c.fill();
      c.fillStyle = G.TAGS[cb.b].color; c.beginPath(); c.arc(L + 16, y, 5, 0, 6.283); c.fill();
      G.txt(c, cb.name, L + 28, y, s2, fl ? '#ffffff' : '#ffe9a0', 'left');
      y += dy;
    });
  }
  // T-F1-08: línea de duración y botín (en combate solo con el ancho clásico; con la pantalla ancha va en la pausa)
  function durLine() {
    var DU = G.Loot.dur();   // duración elegida y multiplicadores aplicados (tabla G.Loot.DUR)
    return DU.name.toUpperCase() + ' ' + DU.min + ' min  -  botín x' + String(DU.parts).replace('.', ',') + (DU.pf !== 1 ? '  PF x' + String(DU.pf).replace('.', ',') : '') + (DU.rare !== 1 ? '  Esencia x' + String(DU.rare).replace('.', ',') : '') + (DU.bossHp !== 1 ? '  jefe +' + Math.round((G.Boss.durMul() * DU.bossHp - 1) * 100) + ' % HP' : '');
  }
  // T-F1-08 fase 2: ancho de media barra de jefe / guardián visible (para que la columna derecha no la pise)
  function bossBarHalf() {
    var e = G.Boss.e; if (e && !e.dead && !e.dying && G.Boss.active) return 320;
    var gm = G.Enemies.minis && G.Enemies.minis()[0]; return gm && gm.spawnT <= 0 ? 260 : 0;
  }
  // Parte superior del HUD anclada (vida, reloj, contadores, encargo) y ayuda inicial en la franja superior central
  var colLeft = 1e9;
  function drawTopWide(c, p) {
    var A = G.anchor(), L = A.L, R = A.R, T = A.T, CX = A.CX, LR = G.Loot.run, half = bossBarHalf();
    var hw = half ? G.clamp(CX - half - 14 - L, 170, 240) : 240;   // con barra de jefe (nombre arriba a la izquierda de la barra) la de vida se acorta para no tocarla
    bar(c, L, T, hw, 22, p.hp / p.maxHp, p.hp / p.maxHp > 0.3 ? '#e0405a' : '#ff2a2a', '#3a1020');
    G.txt(c, 'HP ' + Math.ceil(p.hp) + '/' + p.maxHp, L + hw / 2, T + 12, 16, '#fff', 'center');
    G.Tundra.drawHud(c);
    if (G.mode !== 'run') {
      G.txt(c, G.mode === 'practice' ? 'PRÁCTICA  -  intento ' + (G.practiceTries || 1) : (G.final ? 'ASALTO AL CRÁTER  -  Peligro ' : 'CACERÍA  -  Peligro ') + G.Boss.ROMAN[G.clamp(Math.round(G.peligro || 1), 1, 5)], CX, T + 12, 18, G.mode === 'practice' ? '#9dffb4' : '#6ac8ff', 'center');
      if (G.mode === 'practice' && !G.Boss.active) G.txt(c, G.Sys.isTouch() ? 'sin recompensas  -  pausa y REINICIAR' : 'sin recompensas  -  P y luego R: reiniciar', CX, T + 36, 15, '#9a8fb0', 'center');
    } else {
      if (bossBarHalf()) G.txt(c, G.fmtTime(G.runT), CX, T + 2, 22, G.Boss.active ? '#8a7f96' : '#ffd27a', 'center');   // con la barra del jefe (nombre a y 41) el reloj se encoge para no pisarla
      else G.txt(c, G.fmtTime(G.runT), CX, T + 12, 26, '#ffd27a', 'center');
      if (G.Tundra.noBoss()) G.txt(c, 'Tundra: prueba sin jefe  -  fin a ' + G.fmtTime(G.RUN_LEN), CX, T + 38, 15, '#9fd8ff', 'center');
      else if (G.Panal.noBoss()) G.txt(c, 'Panal: prueba sin jefa  -  fin a ' + G.fmtTime(G.RUN_LEN), CX, T + 38, 15, '#f3a31f', 'center');
      else if (!G.Waves.bossSpawned) G.txt(c, 'Jefe en ' + G.fmtTime(Math.max(0, G.BOSS_T - G.runT)), CX, T + 38, 15, G.BOSS_T - G.runT < 30000 ? '#ff6a6a' : '#9a8fb0', 'center');
    }
    // columna derecha: a la izquierda de silencio y pausa; si no cabe (pantalla de 960 o barra de jefe ancha), apilada bajo los botones
    var cx = R - 144, y = T + 10;
    if (G.W < 1100 || (half && CX + half + 10 > cx - 112)) { cx = R; y = Math.max(T + 64 + 18, half ? 116 : 0); }   // apilada: bajo los botones (y bajo las marcas de la barra del jefe, hasta y ~104)
    colLeft = cx === R ? R - 136 : cx - 112;   // borde izquierdo de lo que hay arriba a la derecha (botones o columna): la ayuda central no lo pisa
    G.txt(c, 'Bajas ' + G.kills, cx, y, 16, '#fff', 'right');
    c.fillStyle = '#ff9a3c'; c.beginPath(); c.moveTo(cx - 100, y + 16); c.lineTo(cx - 95, y + 22); c.lineTo(cx - 100, y + 28); c.lineTo(cx - 105, y + 22); c.closePath(); c.fill();
    G.txt(c, 'Ceniza ' + p.ash, cx, y + 22, 16, '#ff9a3c', 'right');
    G.UI.part(c, 'thread', cx - 105, y + 44, 7); G.txt(c, 'Partes ' + LR.total, cx, y + 44, 16, '#e8dcb0', 'right');
    var ny = y + 66;
    if (LR.rare) { G.UI.part(c, 'rare', cx - 105, ny, 7); G.txt(c, 'Rara x' + LR.rare, cx, ny, 16, '#e0a8ff', 'right'); ny += 22; }
    var qt = G.Quests.hudText();
    if (qt) {
      var qy = cx === R ? ny + 4 : Math.max(T + 80, ny - 22 + 4), tgt = G.Quests.target();   // bajo la columna (o bajo los botones, a la derecha)
      G.txt(c, 'Encargo', R, qy, 15, '#9a8fb0', 'right');
      G.txt(c, qt, R, qy + 21, 15, tgt ? '#ffe9a0' : '#9dffb4', 'right');
    }
    drawCombosList(c);
  }
  function drawHelpWide(c) {   // ayuda inicial: franja superior central bajo el reloj, ancho máx. 640, partida en líneas
    var A = G.anchor(), y = A.T + 62, i, mw = Math.min(640, 2 * (colLeft - A.CX - 10)), L1 = G.Sys.isTouch() ? 'Mueve el dedo en la mitad izquierda: tu ataque básico dispara solo' : 'Muévete con WASD / flechas: tu ataque básico dispara solo';
    L1 = G.Cine.wrap(c, L1, mw, 16);
    var L2 = G.Cine.wrap(c, 'Las cartas son infusiones. Fusiona dos etiquetas distintas para crear un PODER (hasta 4: ' + G.hint('botones o Q E R Espacio', 'usa sus botones') + ').', mw, 15);
    for (i = 0; i < L1.length; i++) { G.txt(c, L1[i], A.CX, y, 16, '#ffffff', 'center'); y += 21; }
    for (i = 0; i < L2.length; i++) { G.txt(c, L2[i], A.CX, y + 1, 15, '#d8cfe8', 'center'); y += 20; }
  }

  H.draw = function (c) {
    var p = G.player, i;
    if (G.state === 'cards') { G.column(c, function () { G.Cards.draw(c); }, 'rgba(8,4,14,0.82)'); return; }   // T-F1-08: menús en la columna de 960 (franjas con el mismo velo)
    if (G.state === 'gameover') { G.Base.drawEnd(c); return; }
    var wide = G.hudWide();
    if (wide) drawTopWide(c, p);
    else {
    // vida
    bar(c, 16, 14, 220, 18, p.hp / p.maxHp, p.hp / p.maxHp > 0.3 ? '#e0405a' : '#ff2a2a', '#3a1020');
    G.txt(c, 'HP ' + Math.ceil(p.hp) + '/' + p.maxHp, 126, 24, 13, '#fff', 'center');
    G.Tundra.drawHud(c);   // P3: medidor de Frío bajo la barra de vida (solo en la Tundra)
    // tiempo y jefe
    var boss = G.Enemies.boss();
    if (G.mode !== 'run') {   // cacería / práctica: sin reloj de run
      G.txt(c, G.mode === 'practice' ? 'PRÁCTICA  -  intento ' + (G.practiceTries || 1) : (G.final ? 'ASALTO AL CRÁTER  -  Peligro ' : 'CACERÍA  -  Peligro ') + G.Boss.ROMAN[G.clamp(Math.round(G.peligro || 1), 1, 5)], G.W / 2, 20, 18, G.mode === 'practice' ? '#9dffb4' : '#6ac8ff', 'center');
      if (G.mode === 'practice') G.txt(c, G.Sys.isTouch() ? 'sin recompensas  -  pausa y REINICIAR' : 'sin recompensas  -  P y luego R: reiniciar', 16, 47, 10, '#9a8fb0', 'left');
    } else {
    G.txt(c, G.fmtTime(G.runT), G.W / 2, 20, 22, G.Boss.active ? '#8a7f96' : '#ffd27a', 'center');   // el reloj de la run se congela con el jefe vivo
    if (G.Tundra.noBoss()) G.txt(c, 'Tundra: prueba sin jefe  -  fin a ' + G.fmtTime(G.RUN_LEN), G.W / 2, 42, 12, '#9fd8ff', 'center');
    else if (G.Panal.noBoss()) G.txt(c, 'Panal: prueba sin jefa  -  fin a ' + G.fmtTime(G.RUN_LEN), G.W / 2, 42, 12, '#f3a31f', 'center');
    else if (!G.Waves.bossSpawned) G.txt(c, 'Jefe en ' + G.fmtTime(Math.max(0, G.BOSS_T - G.runT)), G.W / 2, 42, 12, G.BOSS_T - G.runT < 30000 ? '#ff6a6a' : '#9a8fb0', 'center');
    if (!G.daily) G.txt(c, durLine(), G.W / 2, 60, 12, '#8a7f96', 'center');   // (en el reto, el chip del reto ocupa esta línea)
    }
    // kills, ceniza
    G.txt(c, 'Bajas ' + G.kills, G.W - 16, 18, 15, '#fff', 'right');
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
    }
    // mano y XP
    drawHand(c);
    G.Fusion.drawHud(c);   // FUSION: botones de poderes activos con enfriamiento
    H.drawCdSlow(c, p);
    var need = B.xpNeed(p.level);
    var xh = G.Fte && G.Fte.xpBig() ? 12 : 8;   // barra de experiencia legible (antes 4 px = 2,9 px reales); más alta mientras el aviso de gemas está activo
    c.fillStyle = 'rgba(10,6,18,0.85)'; c.fillRect(0, G.H - xh - 2, G.W, xh + 2);
    c.fillStyle = '#4dd870'; c.fillRect(0, G.H - xh - 1, G.W * G.clamp(p.xp / need, 0, 1), xh);
    if (wide) { var AN = G.anchor(); G.txt(c, 'NV ' + p.level, AN.L + 5 * 84 + 6, AN.B - 12, 17, '#9dffb4', 'left'); }   // T-F1-08: a la derecha de la mano anclada
    else G.txt(c, 'NV ' + p.level, 408, G.H - 20, 15, '#9dffb4', 'left');   // FUSION: la mano ocupa la esquina inferior izquierda
    // ayuda inicial
    var since = G.time - G.t0;
    if (G.Fte && G.Fte.engaged()) G.Fte.draw(c);   // T-F1-02: cuatro avisos de una línea en la 1.ª expedición (sustituyen la ayuda de dos líneas)
    else if (since < 9000 && G.state === 'play' && !G.daily) {
      c.save(); c.globalAlpha = since > 7000 ? (9000 - since) / 2000 : 1;
      if (wide) { drawHelpWide(c); c.restore(); } else {
      G.txt(c, G.Sys.isTouch() ? 'Mueve el dedo en la mitad izquierda: tu ataque básico dispara solo' : 'Muévete con WASD / flechas: tu ataque básico dispara solo', G.W / 2, 300, 16, '#ffffff', 'center');
      G.txt(c, 'Las cartas son infusiones. Fusiona dos etiquetas distintas para crear un PODER (hasta 4: ' + G.hint('botones o Q E R Espacio', 'usa sus botones') + ').', G.W / 2, 322, 13, '#d8cfe8', 'center');
      c.restore();
      }
    }
    try { G.Quests.tick(); G.Cook.drawHud(c); } catch (e0) { /* encargo de racha sin daño y chip del plato (Fase 2b) */ }
    if (G.daily && G.RetoUI) G.RetoUI.drawHud(c);   // v10: chip del reto diario
    drawBanner(c);
    G.Boss.drawHud(c);   // barra del jefe, intro cinematográfica (barras de cine sobre la mano), viñeta de ataque firma (boss.js)
    if (G.state === 'paused') { G.minFont = G.MIN_UI; G.column(c, function () { drawPause(c); if (H.eqOpen) G.Smith.draw(c); if (G.Manual.isOpen()) G.Manual.draw(c); }, H.eqOpen || G.Manual.isOpen() ? '#08040e' : 'rgba(8,4,14,0.9)'); }
    if (p.hurtT > 300) { c.fillStyle = 'rgba(255,0,0,' + (0.18 * (p.hurtT - 300) / 300) + ')'; c.fillRect(0, 0, G.W, G.H); }
  };

  // Menú de pausa (táctil y ratón): CONTINUAR, CALIDAD, SONIDO, REINICIAR (práctica) y ABANDONAR con confirmación explícita (se pulsa dos veces)
  // T-F1-08 fase 3: botones de 66 de alto (44 px reales a 740x360) y letra mínima 17; GRÁFICOS / SONIDO / MANUAL en una fila de tres con el valor debajo.
  var PB = {
    go:   { x: 300, y: 106, w: 360, h: 66 },
    qual: { x: 120, y: 180, w: 236, h: 66 },
    snd:  { x: 362, y: 180, w: 236, h: 66 },
    man:  { x: 604, y: 180, w: 236, h: 66 },
    redo: { x: 300, y: 254, w: 360, h: 66 },
    quit: { x: 300, y: 328, w: 360, h: 66 }
  };
  var quitAsk = 0;
  H.eqOpen = false;   // v8.1: botón EQUIPO de la pausa (panel de Carapa en solo lectura)
  function eqRect() { return G.mode === 'practice' ? { x: 120, y: 254, w: 356, h: 66 } : { x: 300, y: 254, w: 360, h: 66 }; }
  function redoRect() { return G.mode === 'practice' ? { x: 484, y: 254, w: 356, h: 66 } : PB.redo; }
  H.pauseOpen = function () { quitAsk = 0; H.eqOpen = false; };
  H.pauseClick = function (m) {
    var U = G.UI, now = performance.now();
    if (G.Armor && G.Armor.smithOn() && U.inR(eqRect(), m)) { H.eqOpen = true; G.Smith.open(true); G.Armor.snd2('open') || G.Armor.snd('open'); return; }
    if (U.inR(PB.man, m)) { G.Manual.open('pause'); G.sfx('flip', { vol: 0.5 }); return; }
    if (U.inR(PB.go, m)) { G.state = 'play'; G.input.lock = 150; G.resetClock(); }
    else if (U.inR(PB.qual, m)) { G.Sys.cycleQuality(); }
    else if (U.inR(PB.snd, m)) { G.Sys.toggleMute(); }
    else if (G.mode === 'practice' && U.inR(redoRect(), m)) { G.Base.retryPractice(); }
    else if (U.inR(PB.quit, m)) {
      if (quitAsk > now) { quitAsk = 0; G.finish(false); }
      else { quitAsk = now + 3500; }
    } else quitAsk = 0;
  };
  function drawPause(c) {
    var U = G.UI, now = performance.now();
    c.fillStyle = 'rgba(8,4,14,0.9)'; c.fillRect(0, 0, G.W, G.H);
    G.txt(c, 'PAUSA', G.W / 2, 46, 44, '#ffd27a', 'center');
    if (G.hudWide() && G.mode === 'run' && !G.daily) G.txt(c, durLine(), G.W / 2, 86, 17, '#b8aec8', 'center');   // T-F1-08: la línea de duración y botín sale del combate y se ve aquí
    U.button(c, PB.go, 'CONTINUAR', { size: 26, color: '#2a8a4a', hot: '#3aba66', border: '#9dffb4' });
    U.button(c, PB.qual, 'GRÁFICOS', { size: 18, color: '#4a3a66', hot: '#6a5a86', border: '#8a7aa6', sub: G.Sys.qualityLabel() });
    U.button(c, PB.snd, 'SONIDO', { size: 18, color: G.Sys.muted ? '#7a3a3a' : '#4a3a66', hot: '#6a5a86', border: '#8a7aa6', sub: G.Sys.muted ? 'NO' : 'SÍ' });
    U.button(c, PB.man, 'MANUAL', { size: 18, color: '#6a4a2a', hot: '#9a6a3a', border: '#ffd27a', sub: 'cartas y fusiones' });
    if (G.Armor && G.Armor.smithOn()) U.button(c, eqRect(), 'EQUIPO', { size: 18, color: '#2a6a74', hot: '#3a9aaa', border: '#a8e8f0', sub: G.Armor.OFF ? 'apagado' : 'DEF ' + Math.round(G.Armor.get().def) });
    if (G.mode === 'practice') U.button(c, redoRect(), G.Sys.isTouch() ? 'REINICIAR' : 'REINICIAR PRÁCTICA', { size: 18, color: '#2a6aa8', hot: '#3a8ad0', border: '#bfeaff' });
    var ask = quitAsk > now;
    U.button(c, PB.quit, ask ? 'SEGURO? TOCA OTRA VEZ' : G.daily ? G.Daily.t('quit') : 'ABANDONAR EXPEDICIÓN', { size: ask ? 20 : 18, color: ask ? '#a02030' : '#3a2f48', hot: '#c03040', border: ask ? '#ff8a8a' : '#8a6a8a', sub: !ask && G.daily ? G.Daily.t('quitSub') : null });
    if (G.Armor && !G.Armor.OFF && G.Armor.get().any) { var am = G.Armor.get(); G.txt(c, 'DEF ' + Math.round(am.def) + '  =  ' + Math.round(am.rd * 1000) / 10 + ' % de reducción   HP +' + am.hp + '   Aplomo ' + Math.round(am.apl * 100) + ' %', G.W / 2, 410, 17, '#6ac8d8', 'center'); }
    G.txt(c, G.daily ? G.Daily.t('confirm2') : 'Conservas las partes recogidas', G.W / 2, 434, 17, '#ffb347', 'center');
    if (G.Sys.isTouch()) {
      G.txt(c, 'El ataque básico es automático: esquiva y usa los poderes', G.W / 2, 468, 17, '#d8cfe8', 'center');
      G.txt(c, 'Mueve el pulgar en la mitad izquierda para andar', G.W / 2, 492, 17, '#9a8fb0', 'center');
    } else {
      G.txt(c, 'P o Esc: continuar   WASD: mover   Q E R Espacio (o 1-4): poderes   F: auto', G.W / 2, 468, 17, '#d8cfe8', 'center');
      G.txt(c, 'B: abandonar' + (G.mode === 'practice' ? '     R: reiniciar práctica' : ''), G.W / 2, 492, 17, '#9a8fb0', 'center');
    }
  }
})();
