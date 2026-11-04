/* assets_fusion.js - Arte procedural mínimo de los poderes activos (prototipo Fusión). Todo se dibuja por código en el lienzo, sin imágenes.
   API: G.FusionArt.icon(c, id, x, y, s)   icono centrado en (x,y), s = radio (vapor | plasma | gas | sed)
        G.FusionArt.cloud(c, x, y, r, t, kind, alpha)   nube (kind 'vapor' | 'gas'); t en segundos
        G.FusionArt.beam(c, x0, y0, x1, y1, w, t)       rayo de plasma continuo
        G.FusionArt.dagger(c, x, y, ang)                daga orbital de Sed de hierro
        G.FusionArt.nade(c, x, y, ang)                  granada de Gas inflamable
   Mismo estilo que los glifos de cartas: relleno plano + contorno oscuro #0c0814. */
(function () {
  'use strict';
  var G = window.G, A = G.FusionArt = {};
  var OUT = '#0c0814';

  A.icon = function (c, id, cx, cy, s) {
    var t = G.time / 1000;
    c.save(); c.translate(cx, cy); c.lineJoin = 'round'; c.lineCap = 'round'; c.strokeStyle = OUT; c.lineWidth = Math.max(1.5, s * 0.12);
    switch (id) {
      case 'vapor':   // nube blanca con gotas y una llama pequeña
        c.fillStyle = '#e8f6ff'; c.beginPath(); c.arc(-s * 0.45, s * 0.05, s * 0.42, 0, 6.283); c.arc(0, -s * 0.3, s * 0.55, 0, 6.283); c.arc(s * 0.5, s * 0.1, s * 0.4, 0, 6.283); c.fill(); c.stroke();
        c.fillRect(-s * 0.45, s * 0.05, s * 0.95, s * 0.4);
        c.fillStyle = '#6ac8ff'; for (var i = 0; i < 3; i++) { c.beginPath(); c.arc(-s * 0.4 + i * s * 0.4, s * 0.62 + ((t * 8 + i * 5) % 6) * 0.3, s * 0.09, 0, 6.283); c.fill(); }
        c.fillStyle = '#ff7a2a'; c.beginPath(); c.moveTo(0, -s * 0.2); c.quadraticCurveTo(s * 0.28, s * 0.1, 0, s * 0.3); c.quadraticCurveTo(-s * 0.28, s * 0.1, 0, -s * 0.2); c.fill();
        break;
      case 'plasma':  // rayo ardiente: centro brillante y 3 rayos
        c.fillStyle = '#ff7a2a'; c.beginPath(); c.arc(0, 0, s * 0.45, 0, 6.283); c.fill(); c.stroke();
        c.fillStyle = '#fff6a8'; c.beginPath(); c.arc(0, 0, s * 0.22, 0, 6.283); c.fill();
        c.strokeStyle = '#ffe45a'; c.lineWidth = Math.max(2, s * 0.16);
        for (var k = 0; k < 3; k++) { var a = -0.5 + k * 0.5 + Math.sin(t * 6 + k) * 0.05; c.beginPath(); c.moveTo(Math.cos(a) * s * 0.5, Math.sin(a) * s * 0.5); c.lineTo(Math.cos(a - 0.1) * s * 0.8, Math.sin(a - 0.1) * s * 0.8); c.lineTo(Math.cos(a + 0.05) * s * 0.9, Math.sin(a + 0.05) * s * 0.9); c.lineTo(Math.cos(a) * s * 1.05, Math.sin(a) * s * 1.05); c.stroke(); }
        break;
      case 'gas':     // granada verde con nube
        c.fillStyle = '#7be34a'; c.globalAlpha = 0.55; c.beginPath(); c.arc(-s * 0.5, -s * 0.35, s * 0.4, 0, 6.283); c.arc(s * 0.1, -s * 0.6, s * 0.35, 0, 6.283); c.fill(); c.globalAlpha = 1;
        c.fillStyle = '#4a6a30'; c.beginPath(); c.arc(0, s * 0.2, s * 0.62, 0, 6.283); c.fill(); c.stroke();
        c.fillStyle = '#9bff5a'; c.beginPath(); c.arc(-s * 0.2, s * 0.05, s * 0.18, 0, 6.283); c.fill();
        c.fillStyle = '#8a8fa8'; c.fillRect(-s * 0.15, -s * 0.6, s * 0.3, s * 0.25); c.strokeRect(-s * 0.15, -s * 0.6, s * 0.3, s * 0.25);
        c.fillStyle = '#ff7a2a'; c.beginPath(); c.arc(s * 0.3, -s * 0.7, s * 0.14 + Math.sin(t * 20) * s * 0.03, 0, 6.283); c.fill();
        break;
      case 'sed':     // 3 dagas en aro rojo
        c.strokeStyle = '#d02048'; c.lineWidth = Math.max(2, s * 0.14); c.globalAlpha = 0.7; c.beginPath(); c.arc(0, 0, s * 0.72, 0, 6.283); c.stroke(); c.globalAlpha = 1; c.strokeStyle = OUT; c.lineWidth = Math.max(1.5, s * 0.1);
        for (var q = 0; q < 3; q++) { c.save(); c.rotate(t * 2 + q * 2.094); c.translate(s * 0.72, 0); c.rotate(Math.PI / 2);
          c.fillStyle = '#e6ecf5'; c.beginPath(); c.moveTo(0, -s * 0.42); c.lineTo(s * 0.14, s * 0.12); c.lineTo(-s * 0.14, s * 0.12); c.closePath(); c.fill(); c.stroke();
          c.fillStyle = '#d02048'; c.fillRect(-s * 0.2, s * 0.12, s * 0.4, s * 0.1); c.restore(); }
        c.fillStyle = '#d02048'; c.beginPath(); c.arc(0, 0, s * 0.2, 0, 6.283); c.fill(); c.stroke();
        break;
      default: c.fillStyle = '#ffd24a'; c.beginPath(); c.arc(0, 0, s * 0.6, 0, 6.283); c.fill(); c.stroke();
    }
    c.restore();
  };

  // Nube de bolas superpuestas que respira. kind 'vapor' (blanco azulado) | 'gas' (verde); alpha 0..1
  A.cloud = function (c, x, y, r, t, kind, alpha) {
    var rgb = kind === 'gas' ? '110,220,70' : '225,240,255';
    c.save(); c.globalAlpha = Math.max(0, Math.min(1, alpha));
    var g = c.createRadialGradient(x, y, r * 0.15, x, y, r);
    g.addColorStop(0, 'rgba(' + rgb + ',0.5)'); g.addColorStop(1, 'rgba(' + rgb + ',0.06)');
    c.fillStyle = G.fg ? G.fg(g, 'rgba(' + rgb + ',0.28)') : g; c.beginPath(); c.ellipse(x, y, r, r * 0.8, 0, 0, 6.283); c.fill();
    for (var i = 0; i < 7; i++) {
      var a = i * 0.9 + t * (0.3 + (i % 3) * 0.1), rr = r * (0.35 + 0.35 * ((i * 37) % 10) / 10), px = x + Math.cos(a) * rr, py = y + Math.sin(a) * rr * 0.8;
      c.fillStyle = 'rgba(' + rgb + ',' + (0.14 + 0.08 * Math.sin(t * 2 + i)) + ')'; c.beginPath(); c.arc(px, py, r * (0.2 + 0.06 * Math.sin(t * 3 + i)), 0, 6.283); c.fill();
    }
    c.globalAlpha = Math.max(0, Math.min(1, alpha)) * 0.7; c.strokeStyle = kind === 'gas' ? '#9aff6a' : '#ffffff'; c.lineWidth = 2; c.setLineDash([8, 8]); c.lineDashOffset = -t * 20;
    c.beginPath(); c.ellipse(x, y, r * (0.96 + 0.03 * Math.sin(t * 4)), r * 0.77, 0, 0, 6.283); c.stroke(); c.setLineDash([]);
    c.restore();
  };

  // Rayo continuo: resplandor aditivo + núcleo blanco + zigzag
  A.beam = function (c, x0, y0, x1, y1, w, t) {
    var dx = x1 - x0, dy = y1 - y0, L = Math.hypot(dx, dy) || 1, nx = -dy / L, ny = dx / L;
    c.save(); c.lineCap = 'round'; c.globalCompositeOperation = 'lighter';
    c.strokeStyle = 'rgba(255,110,30,0.35)'; c.lineWidth = w * 2.2; c.beginPath(); c.moveTo(x0, y0); c.lineTo(x1, y1); c.stroke();
    c.strokeStyle = 'rgba(255,200,60,0.7)'; c.lineWidth = w; c.stroke();
    c.globalCompositeOperation = 'source-over'; c.strokeStyle = '#fff6c8'; c.lineWidth = Math.max(2, w * 0.35); c.beginPath(); c.moveTo(x0, y0);
    var n = Math.max(4, Math.round(L / 22));
    for (var i = 1; i < n; i++) { var u = i / n, j = Math.sin(t * 40 + i * 2.3) * w * 0.35; c.lineTo(x0 + dx * u + nx * j, y0 + dy * u + ny * j); }
    c.lineTo(x1, y1); c.stroke();
    c.restore();
  };

  A.dagger = function (c, x, y, ang) {
    c.save(); c.translate(Math.round(x), Math.round(y)); c.rotate(ang);
    c.globalCompositeOperation = 'lighter'; c.globalAlpha = 0.3; c.fillStyle = '#d02048'; c.beginPath(); c.arc(0, 0, 13, 0, 6.283); c.fill();
    c.globalCompositeOperation = 'source-over'; c.globalAlpha = 1; c.fillStyle = '#e6ecf5'; c.strokeStyle = OUT; c.lineWidth = 1.5;
    c.beginPath(); c.moveTo(11, 0); c.lineTo(-3, -4); c.lineTo(-6, 0); c.lineTo(-3, 4); c.closePath(); c.fill(); c.stroke();
    c.fillStyle = '#d02048'; c.fillRect(-9, -2, 4, 4);
    c.restore();
  };

  A.nade = function (c, x, y, ang) {
    c.save(); c.translate(Math.round(x), Math.round(y)); c.rotate(ang);
    c.fillStyle = '#4a6a30'; c.strokeStyle = OUT; c.lineWidth = 1.5; c.beginPath(); c.arc(0, 0, 8, 0, 6.283); c.fill(); c.stroke();
    c.fillStyle = '#9bff5a'; c.beginPath(); c.arc(-2, -2, 2.5, 0, 6.283); c.fill();
    c.fillStyle = '#ff7a2a'; c.beginPath(); c.arc(6, -7, 3, 0, 6.283); c.fill();
    c.restore();
  };
})();
