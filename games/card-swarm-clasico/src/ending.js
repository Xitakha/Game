/* ending.js - P6.5: final de la historia. Cinemática procedural (en el canvas, ~50 s) al vencer a Cenizar por primera vez: el brasero de la plaza vuelve a arder, diálogo final de
   Lanudo, Vesper, Castaña, Grum y Ulalume, amanecer con la aldea "reconstruida" (3 detalles: tejado nuevo, farolillos y estandarte) y créditos cortos. Se puede saltar tras 1,5 s
   (Espacio / Enter / toque). Al terminar marca Save.data.endingSeen y pasa a la pantalla de botín. Música: cenizar_ending / cenizar_credits (sfx_cenizar.js; si faltan, silencio). */
(function () {
  'use strict';
  var G = window.G, En = G.Ending = {}, TAU = Math.PI * 2;
  var T_LIGHT = 5000, T_DIAL = 16500, DIAL_MS = 2600, T_DAWN = 25200, T_CRED = 33000, T_END = 58000, T_SCENE = 36000;   // cinemática ~33 s + créditos ~25 s (el arte usa p = t / 36000)
  var LINES = [
    ['LANUDO', '#e8dcb0', 'El fuego se ha apagado... y las cenizas, al fin, descansan.'],
    ['VESPER', '#ffb08a', 'Sabía que no me equivocaba contigo. La apuesta la he perdido encantado.'],
    ['CASTAÑA', '#ffd0dc', 'Ven, cielo, que hay caldo caliente. Y esta vez no huele a humo.'],
    ['GRUM', '#c8d0d8', 'Reconstruir lleva tiempo, chaval. Pero ya hay un hogar donde clavar el primer clavo.'],
    ['ULALUME', '#c8a8ff', 'Las cartas lo dicen, Marlo: la mano ganadora eres tú.']
  ];
  var CREDITS = ['SWARM HAND', '', 'Un juego del Mini Estudio', '', 'Dirección y visión', 'el dueño del estudio', '', 'Diseño de juego', 'game-designer', '', 'Programación', 'programmer', '',
    'Arte', 'artist y tools-engineer (todo dibujado por código)', '', 'Música y sonido', 'audio-designer (todo sintetizado en el navegador)', '', 'Pruebas', 'qa-tester', '',
    'Y a ti, Marlo,', 'que apagaste las seis llamas.', '', 'GRACIAS POR JUGAR'];
  var st = null;

  En.begin = function () {
    st = { t: 0, sparks: [], lit: false, skipped: false };
    G.state = 'ending';
    try { Assets.music.stop(); } catch (x) { /* audio */ }
    try { Assets.music.setTrack('cenizar_ending'); Assets.music.start(); G.Snd.play('stg_cenizar_ending'); } catch (x2) { /* audio */ }
  };
  function finish() {
    var S = G.Save.data; S.endingSeen = true; G.Save.save();
    try { Assets.music.stop(); } catch (x) { /* audio */ }
    st = null; G.state = 'gameover';
  }
  En.update = function (dt) {
    if (!st) { G.state = 'gameover'; return; }
    st.t += dt;
    var inp = G.input;
    if (st.t > 1500 && inp.hit('Space', 'Enter', 'KeyE', 'Mouse0', 'Escape')) {
      if (st.t < T_CRED) { st.t = T_CRED; credTrack(); } else { finish(); return; }
    }
    if (st.t >= T_LIGHT && !st.lit) { st.lit = true; G.sfx('ending_hearth', { vol: 0.9 }); }
    if (st.t >= T_CRED && !st.cred) credTrack();
    if (st.lit && Math.random() < 0.5) st.sparks.push({ x: 480 + (Math.random() - 0.5) * 30, y: 380, vx: (Math.random() - 0.5) * 30, vy: -40 - Math.random() * 50, l: 1 });
    for (var i = st.sparks.length - 1; i >= 0; i--) { var s = st.sparks[i]; s.x += s.vx * dt / 1000; s.y += s.vy * dt / 1000; s.l -= dt / 1800; if (s.l <= 0) st.sparks.splice(i, 1); }
    if (st.t >= T_END) finish();
  };
  function credTrack() { if (st.cred) return; st.cred = true; try { Assets.music.setTrack('cenizar_credits'); Assets.music.start(); } catch (x) { /* audio */ } }
  function mix(a, b, u) { return Math.round(a + (b - a) * u); }
  function house(c, x, y, w, h, roof, newRoof, u) {
    c.save(); c.strokeStyle = '#1b1124'; c.lineWidth = 3;
    c.fillStyle = '#3a3040'; c.fillRect(x, y, w, h); c.strokeRect(x, y, w, h);
    c.fillStyle = newRoof ? 'rgb(' + mix(60, 190, u) + ',' + mix(50, 90, u) + ',' + mix(60, 60, u) + ')' : roof;
    c.beginPath(); c.moveTo(x - 8, y); c.lineTo(x + w / 2, y - h * 0.55); c.lineTo(x + w + 8, y); c.closePath(); c.fill(); c.stroke();
    c.fillStyle = 'rgba(255,200,100,' + (0.25 + 0.6 * u) + ')'; c.fillRect(x + w * 0.2, y + h * 0.35, w * 0.2, h * 0.3); c.fillRect(x + w * 0.6, y + h * 0.35, w * 0.2, h * 0.3);
    c.restore();
  }
  function figure(c, x, y, col, hot, who) {
    c.save(); c.strokeStyle = '#1b1124'; c.lineWidth = 3; c.fillStyle = col;
    c.beginPath(); c.ellipse(x, y, 17, 26, 0, 0, TAU); c.fill(); c.stroke();
    c.fillStyle = '#e8c8a0'; c.beginPath(); c.arc(x, y - 30, 11, 0, TAU); c.fill(); c.stroke();
    c.fillStyle = col; if (who === 'CASTAÑA') { c.fillRect(x - 12, y - 44, 24, 8); } else if (who === 'VESPER') { c.beginPath(); c.moveTo(x - 14, y - 38); c.lineTo(x, y - 54); c.lineTo(x + 14, y - 38); c.closePath(); c.fill(); c.stroke(); } else if (who === 'ULALUME') { c.beginPath(); c.arc(x, y - 38, 12, Math.PI, 0); c.fill(); c.stroke(); } else if (who === 'GRUM') { c.fillRect(x - 12, y - 42, 24, 6); }
    if (hot) { c.globalAlpha = 0.5 + 0.3 * Math.sin(G.time / 120); c.strokeStyle = '#fff2b0'; c.lineWidth = 2; c.beginPath(); c.arc(x, y - 6, 40, 0, TAU); c.stroke(); }
    c.restore();
  }
  En.draw = function (c) {
    if (!st) return;
    var W = G.W, H = G.H, t = st.t, dawn = Math.max(0, Math.min(1, (t - T_DAWN) / 5000)), i, art = typeof Assets.drawEndingScene === 'function';
    if (art) {   // escena del arte (assets_boss5.js): brasa, hogar que se recompone, amigos y amanecer; el diálogo, los créditos y las marcas van encima
      try { Assets.drawEndingScene(c, W, H, Math.min(1, t / T_SCENE), { t: t }); } catch (e0) { art = false; }
    }
    if (art) {
      var di0 = Math.floor((t - T_DIAL) / DIAL_MS), cur0 = (t >= T_DIAL && di0 >= 0 && di0 < LINES.length && t < T_DAWN) ? di0 : -1;
      if (cur0 >= 0) {
        var u0 = (t - T_DIAL - di0 * DIAL_MS) / DIAL_MS, al0 = Math.min(1, u0 * 6, (1 - u0) * 6);
        c.save(); c.globalAlpha = Math.max(0, al0); c.fillStyle = 'rgba(8,4,14,0.85)'; c.fillRect(80, 440, 800, 70); c.strokeStyle = LINES[cur0][1]; c.lineWidth = 2; c.strokeRect(80, 440, 800, 70);
        G.txt(c, LINES[cur0][0], 100, 458, 15, LINES[cur0][1], 'left'); G.txt(c, LINES[cur0][2], 100, 484, 14, '#f0e8d8', 'left'); c.restore();
      }
      if (t < 3000) { c.fillStyle = 'rgba(0,0,0,' + (1 - t / 3000) + ')'; c.fillRect(0, 0, W, H); G.txt(c, 'Cenizar se apaga...', W / 2, 270, 22, 'rgba(255,200,140,' + Math.min(1, t / 800) + ')', 'center'); }
      if (t >= T_DAWN && t < T_CRED) G.txt(c, 'Amanece en Rescoldo.', W / 2, 90, 26, 'rgba(255,240,200,' + Math.min(1, (t - T_DAWN) / 1200) + ')', 'center');
      if (t >= T_CRED) {
        c.fillStyle = 'rgba(6,3,12,' + Math.min(0.8, (t - T_CRED) / 1500) + ')'; c.fillRect(0, 0, W, H);
        var done = false; try { done = Assets.drawCredits(c, W, H, t - T_CRED, CREDITS, { speed: 32 }); } catch (e1) { done = false; }
      }
      if (t > 1500 && t < T_END) G.txt(c, 'Espacio / toque: ' + (t < T_CRED ? 'saltar a los créditos' : 'continuar'), W - 16, H - 12, 10, 'rgba(200,190,220,0.6)', 'right');
      return;
    }
    var sky = c.createLinearGradient(0, 0, 0, H * 0.7);
    sky.addColorStop(0, 'rgb(' + mix(6, 70, dawn) + ',' + mix(4, 60, dawn) + ',' + mix(14, 110, dawn) + ')'); sky.addColorStop(1, 'rgb(' + mix(22, 255, dawn) + ',' + mix(12, 170, dawn) + ',' + mix(30, 110, dawn) + ')');
    c.fillStyle = sky; c.fillRect(0, 0, W, H);
    if (dawn < 1) { c.fillStyle = 'rgba(255,255,255,' + (0.7 * (1 - dawn)) + ')'; for (i = 0; i < 60; i++) c.fillRect((i * 97) % W, (i * 53) % 220, 2, 2); }
    c.fillStyle = '#1a1420'; c.fillRect(0, 370, W, H - 370);
    c.fillStyle = '#2a2230'; c.fillRect(0, 372, W, 6);
    house(c, 90, 260, 150, 110, '#2a2028', true, dawn); house(c, 720, 250, 170, 120, '#2a2028', true, dawn); house(c, 330, 290, 110, 80, '#2a2028', dawn > 0.2, dawn);
    if (dawn > 0.1) {   // detalles de la aldea reconstruida: farolillos, estandarte y vallado nuevo
      c.save(); c.globalAlpha = dawn;
      for (i = 0; i < 5; i++) { var lx = 140 + i * 170, ly = 300 + Math.sin(t / 400 + i) * 3; c.strokeStyle = '#1b1124'; c.lineWidth = 2; c.beginPath(); c.moveTo(lx, 250); c.lineTo(lx, ly); c.stroke(); c.fillStyle = '#ffb347'; c.beginPath(); c.arc(lx, ly + 8, 9, 0, TAU); c.fill(); c.stroke(); }
      c.fillStyle = '#c4301c'; c.fillRect(600, 232, 8, 140); c.fillStyle = '#ff9a3c'; c.beginPath(); c.moveTo(608, 236); c.lineTo(660, 252); c.lineTo(608, 280); c.closePath(); c.fill(); c.strokeStyle = '#1b1124'; c.stroke();
      c.fillStyle = '#8a5a30'; for (i = 0; i < 14; i++) c.fillRect(20 + i * 70, 350, 8, 24);
      c.restore();
    }
    // brasero
    var bx = 480, by = 392;
    c.save(); c.strokeStyle = '#1b1124'; c.lineWidth = 3; c.fillStyle = '#4a4352';
    c.beginPath(); c.moveTo(bx - 34, by - 20); c.lineTo(bx + 34, by - 20); c.lineTo(bx + 22, by + 8); c.lineTo(bx - 22, by + 8); c.closePath(); c.fill(); c.stroke();
    c.fillRect(bx - 5, by + 8, 10, 22); c.strokeRect(bx - 5, by + 8, 10, 22);
    if (st.lit) {
      var fl = Math.min(1, (t - T_LIGHT) / 1500), fh = (50 + Math.sin(t / 90) * 6 + Math.sin(t / 53) * 4) * fl;
      var g = c.createRadialGradient(bx, by - 30, 6, bx, by - 30, 220 * fl); g.addColorStop(0, 'rgba(255,190,90,0.55)'); g.addColorStop(1, 'rgba(255,106,26,0)'); c.fillStyle = g; c.fillRect(0, 150, W, 300);
      c.fillStyle = '#ff6a1a'; c.beginPath(); c.moveTo(bx - 24, by - 20); c.quadraticCurveTo(bx - 10, by - 20 - fh, bx, by - 30 - fh); c.quadraticCurveTo(bx + 10, by - 20 - fh * 0.6, bx + 24, by - 20); c.closePath(); c.fill(); c.stroke();
      c.fillStyle = '#fff2b0'; c.beginPath(); c.moveTo(bx - 10, by - 20); c.quadraticCurveTo(bx, by - 28 - fh * 0.7, bx + 10, by - 20); c.closePath(); c.fill();
      if (t < T_LIGHT + 300) { c.fillStyle = 'rgba(255,240,200,' + (1 - (t - T_LIGHT) / 300) + ')'; c.fillRect(0, 0, W, H); }
    } else { c.fillStyle = 'rgba(255,106,26,0.35)'; c.fillRect(bx - 18, by - 22, 36, 4); }
    c.restore();
    for (i = 0; i < st.sparks.length; i++) { var sp = st.sparks[i]; c.fillStyle = 'rgba(255,200,90,' + Math.max(0, sp.l) + ')'; c.fillRect(Math.round(sp.x), Math.round(sp.y - 20), 3, 3); }
    // personajes
    var di = Math.floor((t - T_DIAL) / DIAL_MS), cur = (t >= T_DIAL && di >= 0 && di < LINES.length) ? di : -1, fx0 = [270, 360, 600, 690, 780];
    for (i = 0; i < 5; i++) figure(c, fx0[i], 372 + (i % 2) * 6, LINES[i][1], cur === i, LINES[i][0]);
    figure(c, 520, 378, '#6aa8e0', false, 'MARLO');
    if (cur >= 0 && t < T_DAWN) {
      var u = (t - T_DIAL - di * DIAL_MS) / DIAL_MS, al = Math.min(1, u * 6, (1 - u) * 6);
      c.save(); c.globalAlpha = Math.max(0, al); c.fillStyle = 'rgba(8,4,14,0.85)'; c.fillRect(80, 440, 800, 70); c.strokeStyle = LINES[cur][1]; c.lineWidth = 2; c.strokeRect(80, 440, 800, 70);
      G.txt(c, LINES[cur][0], 100, 458, 15, LINES[cur][1], 'left'); G.txt(c, LINES[cur][2], 100, 484, 14, '#f0e8d8', 'left'); c.restore();
    }
    if (t < 3000) { c.fillStyle = 'rgba(0,0,0,' + (1 - t / 3000) + ')'; c.fillRect(0, 0, W, H); G.txt(c, 'Cenizar se apaga...', W / 2, 270, 22, 'rgba(255,200,140,' + Math.min(1, t / 800) + ')', 'center'); }
    if (t >= T_DAWN && t < T_CRED) G.txt(c, 'Amanece en Rescoldo.', W / 2, 90, 26, 'rgba(255,240,200,' + Math.min(1, (t - T_DAWN) / 1200) + ')', 'center');
    if (t >= T_CRED) {   // créditos: se desplazan de abajo arriba sobre la aldea
      c.fillStyle = 'rgba(6,3,12,' + Math.min(0.78, (t - T_CRED) / 1500) + ')'; c.fillRect(0, 0, W, H);
      var speed = 22, y0 = H + 20 - (t - T_CRED) / 1000 * speed;
      for (i = 0; i < CREDITS.length; i++) {
        var yy = y0 + i * 30, big = i === 0 || i === CREDITS.length - 1;
        if (yy > -30 && yy < H + 30 && CREDITS[i]) G.txt(c, CREDITS[i], W / 2, yy, big ? 30 : (CREDITS[i - 1] === '' || i === 1 ? 16 : 13), big ? '#ffd27a' : (CREDITS[i - 1] === '' || i === 1 ? '#c8b8e8' : '#f0e8d8'), 'center');
      }
    }
    if (t > 1500 && t < T_END) G.txt(c, 'Espacio / toque: ' + (t < T_CRED ? 'saltar a los créditos' : 'continuar'), W - 16, H - 12, 10, 'rgba(200,190,220,0.6)', 'right');
  };
  En.active = function () { return !!st; };
})();
