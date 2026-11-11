/* assets_fusion3.js - Arte procedural de Cristal de sangre, Zancada carmesi y Virote corrosivo (fusiones 13-15).
   Cargar DESPUES de assets_fusion2.js. Contrato en ../ASSETS_FUSION.md (seccion "Fusiones 13-15") y DESIGN-fusion.md 14.6.
   Extiende G.FusionArt2: icon, btn, cast, impact, nova('shatter'), status('corrode') + ward, shatter, trail, dashGhost, virote.
   Todo seguro (save/restore, traga errores en G.FusionArt2.lastError), por codigo, G.time para animar, G.fg para calidad plana. */
(function () {
  'use strict';
  var G = window.G; if (!G || !G.FusionArt2) return;
  var A1 = G.FusionArt || (G.FusionArt = {}), B = G.FusionArt2;
  var P = { icon: B.icon, btn: B.btn, cast: B.cast, impact: B.impact, nova: B.nova, status: B.status };   // versiones de assets_fusion2.js
  var OUT = '#0c0814', TAU = 6.283185, COL = B.COLORS || (B.COLORS = {});
  var NEW3 = { cristal: 1, zancada: 1, virote: 1 };
  COL.cristal = '#d86a98'; COL.zancada = '#ff6a7a'; COL.virote = '#9ad05a';
  var RGB = { cristal: '216,106,152', zancada: '255,106,122', virote: '154,208,90' };

  function rnd(i) { var x = Math.sin(i * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); }
  function T() { return (G.time || 0) / 1000; }
  function cl(v) { return v < 0 ? 0 : v > 1 ? 1 : v; }
  function circ(c, x, y, r) { c.beginPath(); c.arc(x, y, Math.max(0.1, r), 0, TAU); }
  function glow(c, x, y, r, rgb, a) {
    c.save(); c.globalCompositeOperation = 'lighter';
    var g = c.createRadialGradient(x, y, 0, x, y, r); g.addColorStop(0, 'rgba(' + rgb + ',' + a + ')'); g.addColorStop(1, 'rgba(' + rgb + ',0)');
    c.fillStyle = G.fg ? G.fg(g, 'rgba(' + rgb + ',' + (a * 0.4) + ')') : g; circ(c, x, y, r); c.fill(); c.restore();
  }
  function zig(c, x0, y0, x1, y1, amp, seed, n) {
    var dx = x1 - x0, dy = y1 - y0, L = Math.hypot(dx, dy) || 1, nx = -dy / L, ny = dx / L; n = n || Math.max(3, Math.round(L / 18));
    c.beginPath(); c.moveTo(x0, y0);
    for (var i = 1; i < n; i++) { var u = i / n, j = (rnd(seed + i) - 0.5) * 2 * amp; c.lineTo(x0 + dx * u + nx * j, y0 + dy * u + ny * j); }
    c.lineTo(x1, y1); c.stroke();
  }
  function drop(c, x, y, k) {   // gota apuntando arriba, k = tamano
    c.beginPath(); c.moveTo(x, y - k); c.bezierCurveTo(x + k * 0.9, y - k * 0.1, x + k * 0.7, y + k * 0.8, x, y + k * 0.8); c.bezierCurveTo(x - k * 0.7, y + k * 0.8, x - k * 0.9, y - k * 0.1, x, y - k); c.fill();
  }
  function hex(c, r, rot) {
    c.beginPath(); for (var i = 0; i < 6; i++) { var a = rot + i * 1.0472; if (i) c.lineTo(Math.cos(a) * r, Math.sin(a) * r); else c.moveTo(Math.cos(a) * r, Math.sin(a) * r); } c.closePath();
  }

  /* ---------- ICONOS ---------- */
  function icon(c, id, cx, cy, s) {
    var t = T(), i; c.translate(cx, cy); c.lineJoin = 'round'; c.lineCap = 'round'; c.strokeStyle = OUT; c.lineWidth = Math.max(1.5, s * 0.12);
    if (id === 'cristal') {   // gota de sangre en cristal hexagonal azul hielo
      glow(c, 0, 0, s * 1.2, '106,200,255', 0.22 + 0.08 * Math.sin(t * 3));
      c.fillStyle = '#6ac8ff'; hex(c, s * 0.98, 1.5708); c.fill(); c.stroke();
      c.fillStyle = '#b8e6ff'; c.beginPath(); c.moveTo(0, -s * 0.98); c.lineTo(s * 0.85, -s * 0.49); c.lineTo(0, 0); c.lineTo(-s * 0.85, -s * 0.49); c.closePath(); c.fill();   // faceta superior
      c.strokeStyle = '#ffffff'; c.lineWidth = Math.max(1, s * 0.07);   // aristas blancas
      c.beginPath(); c.moveTo(-s * 0.85, -s * 0.49); c.lineTo(0, 0); c.lineTo(s * 0.85, -s * 0.49); c.moveTo(0, 0); c.lineTo(0, s * 0.98); c.stroke();
      c.fillStyle = '#d02048'; c.strokeStyle = OUT; c.lineWidth = Math.max(1.2, s * 0.09); drop(c, 0, s * 0.18, s * 0.42); c.stroke(); drop(c, 0, s * 0.18, s * 0.42);
      c.fillStyle = '#ffd0d8'; circ(c, -s * 0.14, s * 0.2, s * 0.07); c.fill();
    } else if (id === 'zancada') {   // silueta corriendo con estela en zigzag
      c.strokeStyle = 'rgba(255,228,90,0.95)'; c.lineWidth = Math.max(1.5, s * 0.13); c.beginPath(); c.moveTo(-s * 0.2, -s * 0.5); c.lineTo(-s * 0.55, -s * 0.3); c.lineTo(-s * 0.4, -s * 0.05); c.lineTo(-s * 0.95, s * 0.15); c.stroke();
      c.strokeStyle = '#d02048'; c.beginPath(); c.moveTo(-s * 0.15, s * 0.1); c.lineTo(-s * 0.6, s * 0.3); c.lineTo(-s * 0.45, s * 0.5); c.lineTo(-s * 0.95, s * 0.65); c.stroke();
      c.save(); c.translate(s * 0.2, 0); c.strokeStyle = OUT; c.lineWidth = Math.max(3, s * 0.34);   // contorno del cuerpo
      for (i = 0; i < 2; i++) {
        c.beginPath(); c.moveTo(s * 0.05, -s * 0.15); c.lineTo(s * 0.55, -s * 0.5 + i * s * 0.1); c.moveTo(0, s * 0.05); c.lineTo(i ? s * 0.45 : -s * 0.15, i ? s * 0.4 : s * 0.7); c.lineTo(i ? s * 0.5 : -s * 0.1, s * 0.95); c.stroke();
      }
      c.beginPath(); c.moveTo(s * 0.1, -s * 0.5); c.lineTo(-s * 0.05, s * 0.1); c.stroke();
      c.strokeStyle = '#ff3a58'; c.lineWidth = Math.max(1.8, s * 0.2);
      c.beginPath(); c.moveTo(s * 0.1, -s * 0.5); c.lineTo(-s * 0.05, s * 0.1); c.moveTo(s * 0.05, -s * 0.15); c.lineTo(s * 0.55, -s * 0.5); c.moveTo(s * 0.05, -s * 0.15); c.lineTo(-s * 0.3, -s * 0.3);
      c.moveTo(-s * 0.05, s * 0.1); c.lineTo(s * 0.45, s * 0.4); c.lineTo(s * 0.5, s * 0.95); c.moveTo(-s * 0.05, s * 0.1); c.lineTo(-s * 0.15, s * 0.7); c.lineTo(-s * 0.1, s * 0.95); c.stroke();
      c.fillStyle = '#ff3a58'; c.strokeStyle = OUT; c.lineWidth = Math.max(1.2, s * 0.1); circ(c, s * 0.18, -s * 0.72, s * 0.22); c.fill(); c.stroke(); c.restore();
      c.fillStyle = '#d02048'; for (i = 0; i < 2; i++) { drop(c, -s * 0.2 + i * s * 0.35, s * 0.85 + ((t * 8 + i * 3) % 3) * 0.3, s * 0.13); }
    } else if (id === 'virote') {   // virote horizontal con punta metalica y gotas verdes
      glow(c, s * 0.3, 0, s * 0.9, '123,227,74', 0.15);
      c.fillStyle = '#7a4a2a'; c.fillRect(-s * 0.95, -s * 0.08, s * 1.35, s * 0.16); c.strokeRect(-s * 0.95, -s * 0.08, s * 1.35, s * 0.16);
      c.fillStyle = '#e8f6ff'; c.beginPath(); c.moveTo(-s * 0.95, 0); c.lineTo(-s * 0.7, -s * 0.3); c.lineTo(-s * 0.5, -s * 0.3); c.lineTo(-s * 0.4, 0); c.lineTo(-s * 0.5, s * 0.3); c.lineTo(-s * 0.7, s * 0.3); c.closePath(); c.fill(); c.stroke();   // plumas
      c.fillStyle = '#c8d0e0'; c.beginPath(); c.moveTo(s * 1.0, 0); c.lineTo(s * 0.4, -s * 0.26); c.lineTo(s * 0.3, 0); c.lineTo(s * 0.4, s * 0.26); c.closePath(); c.fill(); c.stroke();
      c.fillStyle = '#7be34a'; circ(c, s * 0.62, 0, s * 0.07); c.fill();
      for (i = 0; i < 2; i++) { drop(c, s * (0.1 + i * 0.5), s * 0.45 + ((t * 7 + i * 4) % 6) * s * 0.06, s * 0.17); }
      c.fillStyle = '#9ad05a'; for (i = 0; i < 3; i++) { circ(c, s * (0.4 + i * 0.22), -s * 0.45, s * 0.04); c.fill(); }
    }
  }

  /* ---------- VFX ---------- */
  // Escudo de cristal en orbita alrededor del jugador. r 56/66, t seg, alpha 0..1, u = escudo restante 0..1
  function ward(c, x, y, r, t, alpha, u) {
    u = u == null ? 1 : cl(u); var n = u > 0.5 ? 8 : 6, blink = u < 0.2 ? (Math.sin(t * 22) > 0 ? 1 : 0.3) : 1, i, a, px, py;
    c.globalAlpha = cl(alpha) * blink;
    glow(c, x, y, r * 1.1, '120,150,255', 0.22 * (0.5 + 0.5 * u));
    c.strokeStyle = 'rgba(216,106,152,' + (0.35 + 0.3 * u) + ')'; c.lineWidth = 2; c.setLineDash([5, 7]); c.lineDashOffset = -t * 18; c.beginPath(); c.ellipse(x, y, r, r * 0.8, 0, 0, TAU); c.stroke(); c.setLineDash([]);
    c.lineJoin = 'round';
    for (i = 0; i < n; i++) {
      a = t * 0.7 + i * TAU / n; px = x + Math.cos(a) * r; py = y + Math.sin(a) * r * 0.8;
      c.save(); c.translate(px, py); c.rotate(a + 1.5708);
      c.fillStyle = i % 2 ? '#d86a98' : '#6ac8ff'; c.strokeStyle = OUT; c.lineWidth = 1.5;
      c.beginPath(); c.moveTo(0, -11); c.lineTo(5, 0); c.lineTo(0, 8); c.lineTo(-5, 0); c.closePath(); c.fill(); c.stroke();
      c.fillStyle = 'rgba(255,255,255,0.7)'; c.beginPath(); c.moveTo(0, -9); c.lineTo(2, -1); c.lineTo(0, 0); c.closePath(); c.fill();
      if (u < 0.6) { c.strokeStyle = '#fff'; c.lineWidth = 1; c.beginPath(); c.moveTo(-3, -4 - (1 - u) * 2); c.lineTo(1, 0); c.lineTo(-1, 5); c.stroke(); if (u < 0.3) { c.strokeStyle = '#d02048'; c.beginPath(); c.moveTo(4, -5); c.lineTo(0, 1); c.stroke(); } }
      c.restore();
    }
  }
  // Onda de rotura (~450 ms). r 100/120, u 0..1
  function shatter(c, x, y, r, u) {
    var a = cl(1 - u), e = 1 - (1 - u) * (1 - u), i, an, d, rr = Math.round(208 - 102 * u), gg = Math.round(32 + 168 * u), bb = Math.round(72 + 183 * u), col = 'rgb(' + rr + ',' + gg + ',' + bb + ')';
    glow(c, x, y, r * (0.4 + e * 0.7), rr + ',' + gg + ',' + bb, 0.6 * a);
    c.globalAlpha = a; c.strokeStyle = '#e8f8ff'; c.lineWidth = 5 * a + 1; c.beginPath(); c.arc(x, y, r * e, 0, TAU); c.stroke();
    c.strokeStyle = col; c.lineWidth = 3; c.beginPath(); c.arc(x, y, r * e * 0.8, 0, TAU); c.stroke();
    c.lineJoin = 'round'; c.fillStyle = col; c.strokeStyle = 'rgba(255,255,255,0.8)'; c.lineWidth = 1;
    for (i = 0; i < 16; i++) {
      an = i * 0.3927 + rnd(i) * 0.25; d = r * e * (0.65 + 0.4 * rnd(i + 9));
      c.save(); c.translate(x + Math.cos(an) * d, y + Math.sin(an) * d); c.rotate(an + u * 3 * (i % 2 ? 1 : -1));
      var k = (4 + 5 * rnd(i + 3)) * (0.5 + a * 0.5); c.beginPath(); c.moveTo(k * 1.6, 0); c.lineTo(0, -k * 0.6); c.lineTo(-k, 0); c.lineTo(0, k * 0.6); c.closePath(); c.fill(); c.stroke(); c.restore();
    }
  }
  // Estela de la Zancada: de (x0,y0) a (x1,y1), u = edad 0..1 (~2,5 s)
  function trail(c, x0, y0, x1, y1, u) {
    var a = cl(1 - u), t = T(), dx = x1 - x0, dy = y1 - y0, L = Math.hypot(dx, dy) || 1, i, k, px, py, nx = -dy / L, ny = dx / L, sd = Math.floor(t * 12);
    c.globalAlpha = a; c.lineCap = 'round';
    c.strokeStyle = 'rgba(208,32,72,0.28)'; c.lineWidth = 30; c.beginPath(); c.moveTo(x0, y0); c.lineTo(x1, y1); c.stroke();
    c.strokeStyle = 'rgba(255,228,90,0.35)'; c.lineWidth = 12; c.beginPath(); c.moveTo(x0, y0); c.lineTo(x1, y1); c.stroke();
    c.globalCompositeOperation = 'lighter'; c.strokeStyle = 'rgba(255,228,90,0.5)'; c.lineWidth = 6; zig(c, x0, y0, x1, y1, 7, sd * 7);
    c.globalCompositeOperation = 'source-over'; c.strokeStyle = '#fff6c8'; c.lineWidth = 1.5; zig(c, x0, y0, x1, y1, 7, sd * 7);
    var n = Math.max(3, (L / 20) | 0);
    for (i = 0; i < n; i++) {
      k = (i + 0.5) / n; px = x0 + dx * k + nx * (rnd(i + 5) - 0.5) * 22; py = y0 + dy * k + ny * (rnd(i + 5) - 0.5) * 22;
      if (i % 2) { c.fillStyle = '#d02048'; circ(c, px, py + ((t * 10 + i) % 4), 2.2); c.fill(); }
      else if (((sd + i) % 3) !== 0) { c.fillStyle = '#ffe45a'; circ(c, px + Math.sin(t * 20 + i) * 2, py, 1.6); c.fill(); }
    }
  }
  // Postimagenes de la embestida (~250 ms). x,y = posicion actual, ang = direccion, u 0..1
  function dashGhost(c, x, y, ang, u) {
    var a = cl(1 - u), ca = Math.cos(ang), sa = Math.sin(ang), i, d;
    for (i = 0; i < 3; i++) {
      d = (i + 1) * 16 + u * 18; c.globalAlpha = a * (0.6 - i * 0.15);
      c.save(); c.translate(x - ca * d, y - sa * d); c.rotate(ang); c.fillStyle = i ? '#b01838' : '#ff3a58';
      c.beginPath(); c.ellipse(0, 0, 14 + i * 2, 9, 0, 0, TAU); c.fill(); c.restore();
    }
    c.globalAlpha = a; c.strokeStyle = 'rgba(255,228,90,0.8)'; c.lineWidth = 2; c.beginPath(); c.moveTo(x - ca * 14, y - sa * 14 - 6); c.lineTo(x - ca * 60, y - sa * 60 - 6); c.moveTo(x - ca * 14, y - sa * 14 + 6); c.lineTo(x - ca * 52, y - sa * 52 + 6); c.stroke();
  }
  // Virote en vuelo (40 x 8, ~180 ms). u 0..1 solo modula el rastro
  function virote(c, x, y, ang, u) {
    u = u == null ? 0 : cl(u); c.translate(Math.round(x), Math.round(y)); c.rotate(ang); c.lineJoin = 'round';
    c.globalCompositeOperation = 'lighter'; c.fillStyle = 'rgba(123,227,74,0.28)'; c.beginPath(); c.ellipse(-26, 0, 22 + 6 * u, 3.5, 0, 0, TAU); c.fill(); c.fillStyle = 'rgba(200,255,150,0.25)'; c.beginPath(); c.ellipse(-14, 0, 12, 2, 0, 0, TAU); c.fill(); c.globalCompositeOperation = 'source-over';
    glow(c, 8, 0, 20, '123,227,74', 0.45);
    c.strokeStyle = OUT; c.lineWidth = 1.5;
    c.fillStyle = '#7a4a2a'; c.fillRect(-20, -1.5, 28, 3); c.strokeRect(-20, -1.5, 28, 3);
    c.fillStyle = '#e8f6ff'; c.beginPath(); c.moveTo(-20, 0); c.lineTo(-16, -4); c.lineTo(-10, -4); c.lineTo(-8, 0); c.lineTo(-10, 4); c.lineTo(-16, 4); c.closePath(); c.fill(); c.stroke();
    c.fillStyle = '#c8d0e0'; c.beginPath(); c.moveTo(20, 0); c.lineTo(7, -4); c.lineTo(5, 0); c.lineTo(7, 4); c.closePath(); c.fill(); c.stroke();
    c.fillStyle = '#7be34a'; circ(c, 11, 0, 1.6); c.fill();
  }
  // Marca de Corrosion sobre el enemigo (s = radio, t seg, bucle)
  function corrode(c, x, y, s, t) {
    var i, yy; c.translate(x, y); c.lineCap = 'round';
    c.fillStyle = '#7be34a'; c.strokeStyle = OUT; c.lineWidth = 1;
    for (i = 0; i < 3; i++) { yy = (t * 14 + i * 5) % 14; c.globalAlpha = 1 - yy / 16; c.beginPath(); c.moveTo((i - 1) * s * 0.55, -s * 0.2 + yy - 3); c.quadraticCurveTo((i - 1) * s * 0.55 + 2.6, -s * 0.2 + yy + 1, (i - 1) * s * 0.55, -s * 0.2 + yy + 3); c.quadraticCurveTo((i - 1) * s * 0.55 - 2.6, -s * 0.2 + yy + 1, (i - 1) * s * 0.55, -s * 0.2 + yy - 3); c.fill(); }
    c.globalAlpha = 0.9; c.strokeStyle = '#d2782a'; c.lineWidth = 2; c.setLineDash([2, 4]); c.lineDashOffset = -t * 8; c.beginPath(); c.moveTo(-s - 2, s * 0.9); c.lineTo(s + 2, s * 0.9); c.stroke(); c.setLineDash([]);
    c.fillStyle = '#9ad05a'; c.globalAlpha = 0.8; for (i = 0; i < 3; i++) { circ(c, (rnd(i + 2) - 0.5) * s * 1.4, s * 0.9 + 3 + ((t * 6 + i * 2) % 5), 1.1); c.fill(); }
  }
  // Destello de lanzamiento (ids nuevos); el resto va a la version previa
  function castNew(c, id, x, y, u) {
    var rgb = RGB[id], a = cl(1 - u), i;
    glow(c, x, y, 20 + 40 * u, rgb, 0.8 * a); c.globalAlpha = a; c.strokeStyle = 'rgba(' + rgb + ',1)'; c.lineWidth = 3; c.beginPath(); c.arc(x, y, 12 + 38 * u, 0, TAU); c.stroke();
    c.fillStyle = id === 'virote' ? '#c8d0e0' : id === 'zancada' ? '#ffe45a' : '#e8f8ff';
    for (i = 0; i < 4; i++) { var an = i * 1.5708 + 0.4; circ(c, x + Math.cos(an) * (14 + 30 * u), y + Math.sin(an) * (14 + 30 * u), 2.4 * a + 0.4); c.fill(); }
  }
  function impactNew(c, id, x, y, u, s) {
    s = s || 14; var a = cl(1 - u), e = 1 - (1 - u) * (1 - u), i, an, d; c.globalAlpha = a;
    glow(c, x, y, s * (1 + e), RGB[id], 0.5);
    for (i = 0; i < 7; i++) {
      an = i * 0.8976 + rnd(i + (x | 0)) * 0.6; d = s * (0.4 + e * 1.1);
      c.fillStyle = id === 'virote' ? (i % 2 ? '#7be34a' : '#9aa4b8') : id === 'cristal' ? (i % 2 ? '#6ac8ff' : '#d86a98') : (i % 2 ? '#ffe45a' : '#ff6a7a');
      circ(c, x + Math.cos(an) * d, y + Math.sin(an) * d, 2.4 * a + 0.4); c.fill();
    }
    if (id === 'virote') { c.strokeStyle = '#c8d0e0'; c.lineWidth = 2; c.beginPath(); c.moveTo(x - s * e, y - s * e * 0.6); c.lineTo(x + s * e, y + s * e * 0.6); c.stroke(); }
  }
  // Boton: replica de assets_fusion2.btn pero con los iconos nuevos (btn interno de F2 no los conoce)
  function btnNew(c, id, cx, cy, r, state, cdFrac, auto) {
    var t = T(), col = COL[id] || '#ffd24a'; state = state || 'ready';
    c.translate(cx, cy); c.globalAlpha = state === 'off' ? 0.35 : 1;
    var pr = state === 'press' ? 0.92 : 1; c.scale(pr, pr);
    c.fillStyle = 'rgba(12,8,20,0.72)'; circ(c, 0, 0, r); c.fill();
    if (state === 'ready') glow(c, 0, 0, r * 1.5, '255,210,74', 0.18 + 0.2 * (0.5 + 0.5 * Math.sin(t * 5)));
    if (state === 'active') glow(c, 0, 0, r * 1.5, '255,255,255', 0.25);
    if (state !== 'off') { c.save(); icon(c, id, 0, -r * 0.04, r * 0.55); c.restore(); }
    if (state === 'cd') { var f = cl(cdFrac == null ? 1 : cdFrac); c.fillStyle = 'rgba(12,8,20,0.66)'; c.beginPath(); c.moveTo(0, 0); c.arc(0, 0, r - 1, -1.5708, -1.5708 + TAU * f); c.closePath(); c.fill(); }
    c.lineWidth = Math.max(2, r * 0.07); c.strokeStyle = state === 'ready' ? '#ffd24a' : state === 'active' ? '#ffffff' : (state === 'off' ? '#555' : col);
    circ(c, 0, 0, r); c.stroke(); c.lineWidth = 1.5; c.strokeStyle = OUT; circ(c, 0, 0, r + 1.5); c.stroke();
    if (auto) { c.fillStyle = '#ffd24a'; circ(c, r * 0.7, -r * 0.7, r * 0.17); c.fill(); c.strokeStyle = OUT; c.stroke(); }
  }

  // ---------- Exportacion segura (envuelve las funciones previas) ----------
  function safe(f) { return function (c) { if (!c) return; c.save(); try { f.apply(null, arguments); } catch (e) { B.lastError = e; } c.restore(); }; }
  B.ward = safe(ward); B.shatter = safe(shatter); B.trail = safe(trail); B.dashGhost = safe(dashGhost); B.virote = safe(virote);
  var sIcon = safe(icon), sBtn = safe(btnNew), sCast = safe(castNew), sImp = safe(impactNew), sShat = safe(shatter), sCor = safe(function (c, k, x, y, s, t) { corrode(c, x, y, s, t == null ? T() : t); });
  B.icon = function (c, id) { return NEW3[id] ? sIcon.apply(null, arguments) : P.icon.apply(null, arguments); };
  B.btn = function (c, id) { return NEW3[id] ? sBtn.apply(null, arguments) : P.btn.apply(null, arguments); };
  B.cast = function (c, id) { return NEW3[id] ? sCast.apply(null, arguments) : P.cast.apply(null, arguments); };
  B.impact = function (c, id) { return NEW3[id] ? sImp.apply(null, arguments) : P.impact.apply(null, arguments); };
  B.nova = function (c, x, y, r, u, kind) { return kind === 'shatter' ? sShat(c, x, y, r, u) : P.nova.apply(null, arguments); };
  B.status = function (c, kind) { return kind === 'corrode' ? sCor.apply(null, arguments) : P.status.apply(null, arguments); };
  B.ids = B.ids.concat(['cristal', 'zancada', 'virote']);
  B.states = B.states.concat(['corrode']);
  var oldA1 = A1.icon;
  A1.icon = function (c, id) { if (NEW3[id]) return B.icon.apply(B, arguments); return oldA1 ? oldA1.apply(A1, arguments) : B.icon.apply(B, arguments); };
  A1.btn = A1.btn || B.btn;
})();
