/* assets_ui.js - Iconos de partes y componentes de UI (paneles, botones) dibujados por código, con el mismo estilo que los glifos de cartas:
   relleno plano + contorno oscuro #0c0814. No toca assets.js. API: G.UI.part(c, id, x, y, s), G.UI.button(...), G.UI.panel(...), G.UI.inR(r, m). */
(function () {
  'use strict';
  var G = window.G, U = G.UI = {};
  var OUT = '#0c0814';

  U.inR = function (r, m) { return m.x >= r.x && m.x <= r.x + r.w && m.y >= r.y && m.y <= r.y + r.h; };
  U.roman = function (n) { return ['', 'I', 'II', 'III'][n] || String(n); };

  // Icono de parte centrado en (x,y); s = radio aproximado en px
  U.part = function (c, id, x, y, s) {
    var P = G.Loot.part(id), col = P ? P.color : '#fff', t = Date.now() / 1000;
    c.save(); c.translate(x, y); c.lineJoin = 'round'; c.lineCap = 'round';
    c.fillStyle = col; c.strokeStyle = OUT; c.lineWidth = Math.max(1.5, s * 0.14);
    function fs() { c.fill(); c.stroke(); }
    switch (id) {
      case 'thread':   // ovillo de hebra
        c.beginPath(); c.arc(0, 0, s * 0.8, 0, 6.283); fs();
        c.strokeStyle = '#a89868'; c.lineWidth = Math.max(1, s * 0.1);
        for (var i = -1; i <= 1; i++) { c.beginPath(); c.arc(0, i * s * 0.35, s * 0.6, 0.2, Math.PI - 0.2); c.stroke(); }
        break;
      case 'feather':
        c.rotate(-0.7); c.beginPath(); c.moveTo(0, -s); c.quadraticCurveTo(s * 0.7, -s * 0.2, 0, s * 0.8); c.quadraticCurveTo(-s * 0.7, -s * 0.2, 0, -s); fs();
        c.strokeStyle = '#8a7a60'; c.lineWidth = Math.max(1, s * 0.12); c.beginPath(); c.moveTo(0, -s * 0.8); c.lineTo(0, s * 1.05); c.stroke();
        break;
      case 'spine':
        for (var k = -1; k <= 1; k++) { c.beginPath(); c.moveTo(k * s * 0.5 - s * 0.22, s * 0.8); c.lineTo(k * s * 0.5, -s * (k === 0 ? 1 : 0.7)); c.lineTo(k * s * 0.5 + s * 0.22, s * 0.8); c.closePath(); fs(); }
        break;
      case 'fang':
        c.beginPath(); c.moveTo(-s * 0.55, -s * 0.8); c.quadraticCurveTo(s * 0.8, -s * 0.7, s * 0.2, s); c.quadraticCurveTo(-s * 0.1, -s * 0.05, -s * 0.55, -s * 0.8); c.fillStyle = '#f4ecd8'; fs();
        c.fillStyle = col; c.beginPath(); c.arc(-s * 0.35, -s * 0.55, s * 0.18, 0, 6.283); c.fill();
        break;
      case 'plate':
        c.beginPath(); c.moveTo(-s * 0.8, -s * 0.7); c.lineTo(s * 0.8, -s * 0.7); c.lineTo(s * 0.8, s * 0.2); c.lineTo(0, s); c.lineTo(-s * 0.8, s * 0.2); c.closePath(); fs();
        c.fillStyle = '#eef2f8'; [[-0.5, -0.4], [0.5, -0.4], [0, 0.4]].forEach(function (q) { c.beginPath(); c.arc(q[0] * s, q[1] * s, s * 0.14, 0, 6.283); c.fill(); });
        break;
      case 'wick':   // mecha con chispa
        c.strokeStyle = OUT; c.lineWidth = s * 0.45; c.beginPath(); c.moveTo(-s * 0.7, s * 0.8); c.quadraticCurveTo(-s * 0.1, s * 0.2, s * 0.2, -s * 0.3); c.stroke();
        c.strokeStyle = '#c8a070'; c.lineWidth = s * 0.28; c.stroke();
        c.fillStyle = '#ffd24a'; c.beginPath();
        for (var j = 0; j < 8; j++) { var r = j % 2 ? s * 0.25 : s * 0.6, a = j * Math.PI / 4 + t * 2; c.lineTo(s * 0.25 + Math.cos(a) * r, -s * 0.4 + Math.sin(a) * r); }
        c.closePath(); fs();
        break;
      case 'frost':   // cristal de escarcha
        c.beginPath(); c.moveTo(0, -s); c.lineTo(s * 0.6, 0); c.lineTo(0, s); c.lineTo(-s * 0.6, 0); c.closePath(); fs();
        c.fillStyle = '#eaf8ff'; c.beginPath(); c.moveTo(0, -s * 0.8); c.lineTo(s * 0.2, 0); c.lineTo(0, s * 0.3); c.lineTo(-s * 0.2, 0); c.closePath(); c.fill();
        break;
      case 'static':   // jirón de rayo
        c.beginPath(); c.moveTo(s * 0.35, -s); c.lineTo(-s * 0.6, s * 0.1); c.lineTo(-s * 0.05, s * 0.15); c.lineTo(-s * 0.35, s); c.lineTo(s * 0.65, -s * 0.2); c.lineTo(s * 0.05, -s * 0.2); c.closePath(); fs();
        break;
      case 'rare':   // gema facetada que brilla
        c.beginPath(); c.moveTo(-s * 0.6, -s * 0.3); c.lineTo(-s * 0.3, -s * 0.9); c.lineTo(s * 0.3, -s * 0.9); c.lineTo(s * 0.6, -s * 0.3); c.lineTo(0, s); c.closePath(); fs();
        c.fillStyle = 'rgba(255,255,255,0.45)'; c.beginPath(); c.moveTo(-s * 0.3, -s * 0.9); c.lineTo(0, -s * 0.3); c.lineTo(s * 0.3, -s * 0.9); c.closePath(); c.fill();
        c.fillStyle = '#fff'; c.globalAlpha = 0.5 + 0.5 * Math.sin(t * 5); c.fillRect(s * 0.35, -s * 0.55, 2, 2);
        break;
      case 'brasa':   // moneda: Brasas
        c.fillStyle = '#ff9a3c'; c.beginPath(); c.moveTo(0, -s); c.lineTo(s * 0.75, 0); c.lineTo(0, s); c.lineTo(-s * 0.75, 0); c.closePath(); fs();
        c.fillStyle = '#ffe9a0'; c.beginPath(); c.arc(0, 0, s * 0.28, 0, 6.283); c.fill();
        break;
      default: c.beginPath(); c.arc(0, 0, s * 0.7, 0, 6.283); fs();
    }
    c.restore();
  };

  // Panel con borde y fondo degradado oscuro (como las cartas)
  U.panel = function (c, x, y, w, h, o) {
    o = o || {};
    c.save();
    c.fillStyle = 'rgba(0,0,0,0.45)'; c.fillRect(x + 3, y + 4, w, h);
    var g = c.createLinearGradient(x, y, x, y + h); g.addColorStop(0, o.top || '#241a32'); g.addColorStop(1, '#130d1c');
    c.fillStyle = g; c.fillRect(x, y, w, h);
    c.strokeStyle = o.border || '#4a3a66'; c.lineWidth = 3; c.strokeRect(x + 1.5, y + 1.5, w - 3, h - 3);
    c.restore();
  };

  // Botón grande. o: { color, hot (hover), off (deshabilitado), size, sub }
  U.button = function (c, r, label, o) {
    o = o || {};
    var hov = U.inR(r, G.input.mouse) && !o.off;
    c.save();
    c.fillStyle = o.off ? '#2c2433' : (hov ? o.hot || '#ff9a3c' : o.color || '#c4601c');
    c.fillRect(r.x, r.y, r.w, r.h);
    c.fillStyle = 'rgba(255,255,255,0.14)'; c.fillRect(r.x, r.y, r.w, Math.max(3, r.h / 4));
    c.strokeStyle = o.off ? '#5a4a64' : (o.border || '#ffd27a'); c.lineWidth = 3; c.strokeRect(r.x + 1.5, r.y + 1.5, r.w - 3, r.h - 3);
    if (o.sub) {
      G.txt(c, label, r.x + r.w / 2, r.y + r.h * 0.38, o.size || 18, o.off ? '#8a7f96' : '#fff', 'center');
      G.txt(c, o.sub, r.x + r.w / 2, r.y + r.h * 0.74, Math.max(10, (o.size || 18) - 6), o.off ? '#7a7086' : '#ffe9a0', 'center');
    } else G.txt(c, label, r.x + r.w / 2, r.y + r.h / 2, o.size || 18, o.off ? '#8a7f96' : '#fff', 'center');
    c.restore();
    return hov;
  };

  U.wrap = function (c, text, maxW, size) {
    c.font = 'bold ' + size + 'px "Courier New", monospace';
    var words = text.split(' '), lines = [], line = '';
    for (var i = 0; i < words.length; i++) {
      var tst = line ? line + ' ' + words[i] : words[i];
      if (c.measureText(tst).width > maxW && line) { lines.push(line); line = words[i]; } else line = tst;
    }
    if (line) lines.push(line);
    return lines;
  };
})();
