/* assets_manual.js - Arte procedural del Manual de cartas y combinaciones (src/manual.js). G.ManualArt.
   Todo por código (sin imágenes). Las funciones reciben el tiempo del DEMO (segundos, reloj propio del Manual), nunca G.time ni G.rng.
     G.ManualArt.player(c, x, y, t)          el cazador (sprite del juego; círculo si no existiera), pies en (x, y)
     G.ManualArt.enemy(c, x, y, t, tint, sc) gusano de la horda (sprite del juego), pies en (x, y); tint = color de estado opcional
     G.ManualArt.icon(c, kind, x, y, s)      'book' | 'search' | 'lock' | 'arrow' (dir: 'l' | 'r') | 'play' | 'pause'
     G.ManualArt.shot(c, x, y, ang, col, r)  disparo del ataque básico con estela */
(function () {
  'use strict';
  var G = window.G, M = G.ManualArt = {}, TAU = 6.283185;
  function spr(name, anim) { try { return Assets.sprite(name, anim); } catch (e) { return null; } }
  var TC = {};
  function tinted(cv, key, tint) {   // copia con el color de estado (solo sobre los píxeles del sprite)
    var o = TC[key]; if (o) return o;
    o = document.createElement('canvas'); o.width = cv.width; o.height = cv.height; var x = o.getContext('2d');
    x.drawImage(cv, 0, 0); x.globalCompositeOperation = 'source-atop'; x.globalAlpha = 0.4; x.fillStyle = tint; x.fillRect(0, 0, o.width, o.height);
    x.globalCompositeOperation = 'destination-in'; x.globalAlpha = 1; x.drawImage(cv, 0, 0);
    return (TC[key] = o);
  }
  function draw(c, name, anim, x, y, flip, tint) {
    var cv = spr(name, anim);
    if (!cv) return false;
    c.save(); c.translate(x, y); if (flip) c.scale(-1, 1);
    c.fillStyle = 'rgba(0,0,0,0.35)'; c.beginPath(); c.ellipse(0, 0, cv.width * 0.32, cv.width * 0.11, 0, 0, TAU); c.fill();
    c.drawImage(cv, -cv.width / 2, -cv.height + 4);
    if (tint) { var tc = tinted(cv, name + '|' + anim + '|' + tint, tint); c.drawImage(tc, -cv.width / 2, -cv.height + 4); }
    c.restore(); return true;
  }
  M.player = function (c, x, y, t) {
    if (!draw(c, 'player', 'idle:' + Math.floor(t * 6), x, y, false)) { c.fillStyle = '#e8c48a'; c.beginPath(); c.arc(x, y - 12, 10, 0, TAU); c.fill(); }
  };
  M.enemy = function (c, x, y, t, tint, sc) {
    c.save(); c.translate(x, y); if (sc && sc !== 1) c.scale(sc, sc);
    if (!draw(c, 'worm', 'walk:' + Math.floor(t * 9), 0, 0, true, tint)) { c.fillStyle = tint || '#9a6a8a'; c.beginPath(); c.arc(0, -9, 9, 0, TAU); c.fill(); }
    c.restore();
  };
  M.shot = function (c, x, y, ang, col, r) {
    r = r || 5; c.save(); c.translate(x, y); c.rotate(ang);
    var g = c.createLinearGradient(-r * 5, 0, 0, 0); g.addColorStop(0, 'rgba(255,255,255,0)'); g.addColorStop(1, col);
    c.globalAlpha = 0.7; c.fillStyle = g; c.fillRect(-r * 5, -r * 0.6, r * 5, r * 1.2); c.globalAlpha = 1;
    c.fillStyle = col; c.beginPath(); c.arc(0, 0, r, 0, TAU); c.fill(); c.fillStyle = '#fff'; c.beginPath(); c.arc(0, 0, r * 0.45, 0, TAU); c.fill();
    c.restore();
  };
  M.icon = function (c, kind, x, y, s) {
    c.save(); c.translate(x, y); c.lineJoin = 'round'; c.lineCap = 'round'; c.strokeStyle = '#0c0814'; c.lineWidth = Math.max(2, s * 0.14);
    if (kind === 'book') {
      c.fillStyle = '#8a4a2a'; c.fillRect(-s * 0.8, -s * 0.7, s * 1.6, s * 1.4); c.strokeRect(-s * 0.8, -s * 0.7, s * 1.6, s * 1.4);
      c.fillStyle = '#f0e0b0'; c.fillRect(-s * 0.6, -s * 0.55, s * 1.2, s * 1.1); c.fillStyle = '#c8a060'; c.fillRect(-s * 0.05, -s * 0.55, s * 0.1, s * 1.1);
      c.fillStyle = '#7a4a1a'; for (var i = 0; i < 3; i++) { c.fillRect(-s * 0.5, -s * 0.35 + i * s * 0.3, s * 0.35, s * 0.08); c.fillRect(s * 0.15, -s * 0.35 + i * s * 0.3, s * 0.35, s * 0.08); }
    } else if (kind === 'search') {
      c.strokeStyle = '#e8dff8'; c.lineWidth = Math.max(2, s * 0.2); c.beginPath(); c.arc(-s * 0.15, -s * 0.15, s * 0.5, 0, TAU); c.stroke();
      c.beginPath(); c.moveTo(s * 0.22, s * 0.22); c.lineTo(s * 0.8, s * 0.8); c.stroke();
    } else if (kind === 'lock') {
      c.fillStyle = '#6a5f78'; c.fillRect(-s * 0.55, -s * 0.1, s * 1.1, s * 0.8); c.strokeRect(-s * 0.55, -s * 0.1, s * 1.1, s * 0.8);
      c.beginPath(); c.arc(0, -s * 0.1, s * 0.38, Math.PI, 0); c.stroke();
    } else if (kind === 'arrow') {
      c.fillStyle = '#fff'; c.beginPath(); c.moveTo(s * 0.5, -s * 0.7); c.lineTo(-s * 0.5, 0); c.lineTo(s * 0.5, s * 0.7); c.closePath(); c.fill(); c.stroke();
    } else if (kind === 'play') { c.fillStyle = '#fff'; c.beginPath(); c.moveTo(-s * 0.4, -s * 0.6); c.lineTo(s * 0.6, 0); c.lineTo(-s * 0.4, s * 0.6); c.closePath(); c.fill(); c.stroke(); }
    else if (kind === 'pause') { c.fillStyle = '#fff'; c.fillRect(-s * 0.5, -s * 0.6, s * 0.35, s * 1.2); c.fillRect(s * 0.15, -s * 0.6, s * 0.35, s * 1.2); }
    c.restore();
  };
})();
