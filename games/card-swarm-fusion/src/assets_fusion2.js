/* assets_fusion2.js - Arte procedural de los 8 poderes restantes + iconos de botón, infusión y estados (prototipo Fusión).
   Cargar DESPUÉS de assets_fusion.js. Contrato completo en ../ASSETS_FUSION.md. Todo por código, sin imágenes.
   Ids de poder: tormenta | escarcha | pacto | iman | forja | filo | hemo | descarga  (+ vapor | plasma | gas | sed de assets_fusion.js)
   Etiquetas: fire ice lightning poison blood steel. Estados: blind slow burn poison bleed stun mark freeze.
   Toda función es segura: hace save/restore y traga errores (si algo falla, no dibuja y no rompe el frame).
   Además envuelve G.FusionArt.icon para que los 8 ids nuevos funcionen con las llamadas existentes. */
(function () {
  'use strict';
  var G = window.G; if (!G) return;
  var A1 = G.FusionArt || (G.FusionArt = {});
  var B = G.FusionArt2 = {}, OLD = A1.icon;   // icono original (4 poderes de v0)
  var OUT = '#0c0814', TAU = 6.283185;
  var NEW = { tormenta: 1, escarcha: 1, pacto: 1, iman: 1, forja: 1, filo: 1, hemo: 1, descarga: 1 };
  var COL = { vapor: '#8fd8ff', plasma: '#ffb02a', gas: '#7be34a', sed: '#d02048', tormenta: '#8fe0ff', escarcha: '#a8e86a', pacto: '#ff4a2a',
    iman: '#b0b8ff', forja: '#ff8a2a', filo: '#bfefff', hemo: '#b0206a', descarga: '#c8ff4a',
    fire: '#ff7a2a', ice: '#6ac8ff', lightning: '#ffe45a', poison: '#7be34a', blood: '#d02048', steel: '#c8d0e0' };
  B.COLORS = COL;
  function rnd(i) { var x = Math.sin(i * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); }
  function T() { return (G.time || 0) / 1000; }
  function cl(v) { return v < 0 ? 0 : v > 1 ? 1 : v; }
  function circ(c, x, y, r) { c.beginPath(); c.arc(x, y, Math.max(0.1, r), 0, TAU); }
  function glow(c, x, y, r, rgb, a) {   // resplandor aditivo (degradado o plano según calidad)
    c.save(); c.globalCompositeOperation = 'lighter';
    var g = c.createRadialGradient(x, y, 0, x, y, r); g.addColorStop(0, 'rgba(' + rgb + ',' + a + ')'); g.addColorStop(1, 'rgba(' + rgb + ',0)');
    c.fillStyle = G.fg ? G.fg(g, 'rgba(' + rgb + ',' + (a * 0.4) + ')') : g; circ(c, x, y, r); c.fill(); c.restore();
  }
  function zig(c, x0, y0, x1, y1, amp, seed, n) {   // trazo en zigzag (rayo)
    var dx = x1 - x0, dy = y1 - y0, L = Math.hypot(dx, dy) || 1, nx = -dy / L, ny = dx / L; n = n || Math.max(3, Math.round(L / 18));
    c.beginPath(); c.moveTo(x0, y0);
    for (var i = 1; i < n; i++) { var u = i / n, j = (rnd(seed + i) - 0.5) * 2 * amp; c.lineTo(x0 + dx * u + nx * j, y0 + dy * u + ny * j); }
    c.lineTo(x1, y1); c.stroke();
  }
  function bolt(c, x0, y0, x1, y1, w, seed, rgb) {
    c.lineCap = 'round'; c.lineJoin = 'round'; c.globalCompositeOperation = 'lighter';
    c.strokeStyle = 'rgba(' + rgb + ',0.35)'; c.lineWidth = w * 3; zig(c, x0, y0, x1, y1, w * 2, seed);
    c.globalCompositeOperation = 'source-over'; c.strokeStyle = '#ffffff'; c.lineWidth = Math.max(1.5, w); zig(c, x0, y0, x1, y1, w * 2, seed);
  }
  function spike(c, x, y, ang, len, w) { c.save(); c.translate(x, y); c.rotate(ang); c.beginPath(); c.moveTo(len, 0); c.lineTo(0, -w); c.lineTo(-len * 0.25, 0); c.lineTo(0, w); c.closePath(); c.restore(); }

  /* ---------- ICONOS (centrados en x,y; s = radio) ---------- */
  function icon(c, id, cx, cy, s) {
    var t = T(); c.translate(cx, cy); c.lineJoin = 'round'; c.lineCap = 'round'; c.strokeStyle = OUT; c.lineWidth = Math.max(1.5, s * 0.12);
    var i, a;
    switch (id) {
      case 'tormenta':   // nube de tormenta con rayo y copo
        c.fillStyle = '#9fb8d8'; c.beginPath(); c.arc(-s * 0.4, -s * 0.15, s * 0.38, 0, TAU); c.arc(s * 0.05, -s * 0.4, s * 0.48, 0, TAU); c.arc(s * 0.5, -s * 0.1, s * 0.36, 0, TAU); c.fill(); c.stroke();
        c.fillRect(-s * 0.4, -s * 0.15, s * 0.9, s * 0.35);
        c.fillStyle = '#ffe45a'; c.beginPath(); c.moveTo(s * 0.12, s * 0.0); c.lineTo(-s * 0.22, s * 0.5); c.lineTo(0, s * 0.5); c.lineTo(-s * 0.14, s * 0.95); c.lineTo(s * 0.3, s * 0.3); c.lineTo(s * 0.08, s * 0.3); c.closePath(); c.fill(); c.stroke();
        c.fillStyle = '#e8f6ff'; for (i = 0; i < 2; i++) { circ(c, -s * 0.55 + i * s * 0.12, s * 0.5 + ((t * 7 + i * 3) % 5) * 0.4, s * 0.07); c.fill(); }
        break;
      case 'escarcha':   // espora verde con cristal de hielo
        glow(c, 0, 0, s * 1.1, '123,227,74', 0.25);
        c.fillStyle = '#a8e86a'; circ(c, 0, 0, s * 0.55); c.fill(); c.stroke();
        c.strokeStyle = '#e8f6ff'; c.lineWidth = Math.max(1.5, s * 0.1);
        for (i = 0; i < 6; i++) { a = i * 1.0472 + t * 0.5; c.beginPath(); c.moveTo(Math.cos(a) * s * 0.15, Math.sin(a) * s * 0.15); c.lineTo(Math.cos(a) * s * 0.95, Math.sin(a) * s * 0.95); c.stroke(); }
        c.fillStyle = '#6ac8ff'; circ(c, 0, 0, s * 0.2); c.fill();
        break;
      case 'pacto':      // corazón en llamas con gota
        c.fillStyle = '#d02048'; c.beginPath(); c.moveTo(0, s * 0.85); c.bezierCurveTo(-s * 1.0, s * 0.2, -s * 0.8, -s * 0.6, 0, -s * 0.2); c.bezierCurveTo(s * 0.8, -s * 0.6, s * 1.0, s * 0.2, 0, s * 0.85); c.fill(); c.stroke();
        c.fillStyle = '#ff7a2a'; var fl = Math.sin(t * 12) * s * 0.05; c.beginPath(); c.moveTo(0, -s * 1.0 + fl); c.quadraticCurveTo(s * 0.4, -s * 0.5, s * 0.1, -s * 0.1); c.quadraticCurveTo(-s * 0.35, -s * 0.4, 0, -s * 1.0 + fl); c.fill(); c.stroke();
        c.fillStyle = '#ffe45a'; c.beginPath(); c.moveTo(0, -s * 0.65); c.quadraticCurveTo(s * 0.15, -s * 0.4, 0, -s * 0.25); c.quadraticCurveTo(-s * 0.15, -s * 0.4, 0, -s * 0.65); c.fill();
        break;
      case 'iman':       // herradura-imán con rayo
        c.strokeStyle = OUT; c.lineWidth = Math.max(5, s * 0.55); c.beginPath(); c.arc(0, s * 0.05, s * 0.6, Math.PI, 0); c.lineTo(s * 0.6, s * 0.7); c.moveTo(-s * 0.6, s * 0.05); c.lineTo(-s * 0.6, s * 0.7); c.stroke();
        c.strokeStyle = '#c8d0e0'; c.lineWidth = Math.max(3, s * 0.38); c.beginPath(); c.arc(0, s * 0.05, s * 0.6, Math.PI, 0); c.lineTo(s * 0.6, s * 0.7); c.moveTo(-s * 0.6, s * 0.05); c.lineTo(-s * 0.6, s * 0.7); c.stroke();
        c.fillStyle = '#d02048'; c.fillRect(-s * 0.8, s * 0.45, s * 0.4, s * 0.3); c.fillStyle = '#e8f6ff'; c.fillRect(s * 0.4, s * 0.45, s * 0.4, s * 0.3);
        c.strokeStyle = '#ffe45a'; c.lineWidth = Math.max(1.5, s * 0.12); c.beginPath(); c.moveTo(-s * 0.1, -s * 0.95); c.lineTo(s * 0.12, -s * 0.7 + Math.sin(t * 20) * 2); c.lineTo(-s * 0.08, -s * 0.5); c.lineTo(s * 0.1, -s * 0.3); c.stroke();
        break;
      case 'forja':      // hacha incandescente
        c.strokeStyle = OUT; c.lineWidth = Math.max(3, s * 0.2); c.beginPath(); c.moveTo(-s * 0.55, s * 0.85); c.lineTo(s * 0.35, -s * 0.7); c.stroke();
        c.strokeStyle = '#8a5a3a'; c.lineWidth = Math.max(2, s * 0.12); c.stroke(); c.strokeStyle = OUT; c.lineWidth = Math.max(1.5, s * 0.12);
        c.fillStyle = '#ff8a2a'; c.beginPath(); c.moveTo(s * 0.3, -s * 0.8); c.quadraticCurveTo(s * 1.1, -s * 0.8, s * 0.95, s * 0.0); c.quadraticCurveTo(s * 0.4, -s * 0.2, s * 0.05, -s * 0.3); c.closePath(); c.fill(); c.stroke();
        c.fillStyle = '#fff6a8'; c.beginPath(); c.moveTo(s * 0.5, -s * 0.6); c.quadraticCurveTo(s * 0.85, -s * 0.5, s * 0.8, -s * 0.15); c.quadraticCurveTo(s * 0.55, -s * 0.3, s * 0.5, -s * 0.6); c.fill();
        c.fillStyle = '#ffe45a'; for (i = 0; i < 3; i++) { circ(c, -s * 0.2 + i * s * 0.25 + Math.sin(t * 9 + i) * 2, s * 0.35 - ((t * 20 + i * 7) % 12), s * 0.06); c.fill(); }
        break;
      case 'filo':       // abanico de 3 lanzas de hielo
        for (i = -1; i <= 1; i++) { c.save(); c.rotate(-1.5708 + i * 0.5); c.translate(s * 0.15, 0); c.fillStyle = i === 0 ? '#e8f8ff' : '#9fdcff'; c.beginPath(); c.moveTo(s * 0.95, 0); c.lineTo(0, -s * 0.2); c.lineTo(-s * 0.15, 0); c.lineTo(0, s * 0.2); c.closePath(); c.fill(); c.stroke(); c.restore(); }
        c.fillStyle = '#6ac8ff'; circ(c, 0, s * 0.45, s * 0.2); c.fill(); c.stroke();
        break;
      case 'hemo':       // gota de sangre con calavera verde / marca
        c.fillStyle = '#d02048'; c.beginPath(); c.moveTo(0, -s * 0.95); c.bezierCurveTo(s * 0.9, 0, s * 0.8, s * 0.85, 0, s * 0.85); c.bezierCurveTo(-s * 0.8, s * 0.85, -s * 0.9, 0, 0, -s * 0.95); c.fill(); c.stroke();
        c.fillStyle = '#7be34a'; circ(c, 0, s * 0.1, s * 0.34); c.fill(); c.stroke();
        c.fillStyle = OUT; circ(c, -s * 0.13, s * 0.05, s * 0.07); c.fill(); circ(c, s * 0.13, s * 0.05, s * 0.07); c.fill(); c.fillRect(-s * 0.1, s * 0.22, s * 0.2, s * 0.06);
        break;
      case 'descarga':   // rayo vertical sobre gota verde
        glow(c, 0, 0, s * 1.1, '200,255,74', 0.22);
        c.fillStyle = '#7be34a'; c.beginPath(); c.moveTo(0, -s * 0.2); c.bezierCurveTo(s * 0.8, s * 0.5, s * 0.5, s * 0.95, 0, s * 0.95); c.bezierCurveTo(-s * 0.5, s * 0.95, -s * 0.8, s * 0.5, 0, -s * 0.2); c.fill(); c.stroke();
        c.fillStyle = '#ffe45a'; c.beginPath(); c.moveTo(s * 0.25, -s * 1.0); c.lineTo(-s * 0.3, s * 0.1); c.lineTo(-s * 0.02, s * 0.1); c.lineTo(-s * 0.25, s * 0.85); c.lineTo(s * 0.4, -s * 0.15); c.lineTo(s * 0.1, -s * 0.15); c.closePath(); c.fill(); c.stroke();
        break;
      default:
        c.fillStyle = '#ffd24a'; circ(c, 0, 0, s * 0.6); c.fill(); c.stroke();
    }
  }

  // Infusión por etiqueta (icono de carta pequeño): fire ice lightning poison blood steel; lvl 1-3 pinta puntos
  function infuse(c, tag, cx, cy, s, lvl) {
    var t = T(), col = COL[tag] || '#ffd24a';
    c.translate(cx, cy); c.lineJoin = 'round'; c.lineCap = 'round'; c.strokeStyle = OUT; c.lineWidth = Math.max(1.5, s * 0.12);
    c.fillStyle = 'rgba(12,8,20,0.55)'; circ(c, 0, 0, s); c.fill(); c.strokeStyle = col; c.lineWidth = Math.max(1.5, s * 0.1); c.stroke(); c.strokeStyle = OUT; c.lineWidth = Math.max(1.2, s * 0.1);
    c.fillStyle = col; var k = s * 0.62, i;
    switch (tag) {
      case 'fire': c.beginPath(); c.moveTo(0, -k); c.quadraticCurveTo(k * 0.9, -k * 0.1, k * 0.35, k * 0.6); c.quadraticCurveTo(0, k * 0.9, -k * 0.4, k * 0.55); c.quadraticCurveTo(-k * 0.8, -k * 0.1, 0, -k); c.fill(); c.stroke(); c.fillStyle = '#ffe45a'; circ(c, 0, k * 0.35, k * 0.25 + Math.sin(t * 10) * 0.5); c.fill(); break;
      case 'ice': for (i = 0; i < 3; i++) { c.save(); c.rotate(i * 1.0472); c.fillRect(-k * 0.09, -k, k * 0.18, k * 2); c.restore(); } c.fillStyle = '#e8f6ff'; circ(c, 0, 0, k * 0.22); c.fill(); break;
      case 'lightning': c.beginPath(); c.moveTo(k * 0.3, -k); c.lineTo(-k * 0.5, k * 0.15); c.lineTo(-k * 0.05, k * 0.15); c.lineTo(-k * 0.3, k); c.lineTo(k * 0.55, -k * 0.2); c.lineTo(k * 0.1, -k * 0.2); c.closePath(); c.fill(); c.stroke(); break;
      case 'poison': c.beginPath(); c.moveTo(0, -k); c.bezierCurveTo(k, 0, k * 0.7, k, 0, k); c.bezierCurveTo(-k * 0.7, k, -k, 0, 0, -k); c.fill(); c.stroke(); c.fillStyle = '#e8ffd0'; circ(c, -k * 0.25, k * 0.25, k * 0.15); c.fill(); break;
      case 'blood': c.beginPath(); c.moveTo(0, -k); c.bezierCurveTo(k, -k * 0.1, k * 0.8, k, 0, k); c.bezierCurveTo(-k * 0.8, k, -k, -k * 0.1, 0, -k); c.fill(); c.stroke(); c.fillStyle = '#ffd0d8'; c.fillRect(-k * 0.08, -k * 0.1, k * 0.16, k * 0.5); c.fillRect(-k * 0.25, k * 0.07, k * 0.5, k * 0.16); break;
      case 'steel': c.beginPath(); c.moveTo(0, -k); c.lineTo(k * 0.35, k * 0.3); c.lineTo(0, k * 0.55); c.lineTo(-k * 0.35, k * 0.3); c.closePath(); c.fill(); c.stroke(); c.fillStyle = '#7a4a2a'; c.fillRect(-k * 0.08, k * 0.55, k * 0.16, k * 0.4); c.fillStyle = '#ffd24a'; c.fillRect(-k * 0.45, k * 0.35, k * 0.9, k * 0.14); break;
      default: circ(c, 0, 0, k * 0.5); c.fill(); c.stroke();
    }
    lvl = lvl | 0; c.fillStyle = '#ffd24a'; for (i = 0; i < lvl && i < 3; i++) { circ(c, (i - (Math.min(lvl, 3) - 1) / 2) * s * 0.34, s * 1.18, s * 0.11); c.fill(); }
  }

  // Botón de poder. state: 'ready' | 'cd' (cdFrac 0..1 = fracción RESTANTE) | 'off' (sin poder) | 'active' (en curso) | 'press'
  function btn(c, id, cx, cy, r, state, cdFrac, auto) {
    var t = T(), col = COL[id] || '#ffd24a'; state = state || 'ready';
    c.translate(cx, cy);
    c.globalAlpha = state === 'off' ? 0.35 : 1;
    var pr = state === 'press' ? 0.92 : 1; c.scale(pr, pr);
    c.fillStyle = 'rgba(12,8,20,0.72)'; circ(c, 0, 0, r); c.fill();
    if (state === 'ready') { var p = 0.5 + 0.5 * Math.sin(t * 5); glow(c, 0, 0, r * 1.5, '255,210,74', 0.18 + 0.2 * p); }
    if (state === 'active') glow(c, 0, 0, r * 1.5, '255,255,255', 0.25);
    if (state !== 'off') { if (!NEW[id] && OLD) OLD(c, id, 0, -r * 0.04, r * 0.55); else icon(c, id, 0, -r * 0.04, r * 0.55); }
    if (state === 'cd') {   // barrido radial oscuro de lo que falta
      var f = cl(cdFrac == null ? 1 : cdFrac); c.fillStyle = 'rgba(12,8,20,0.66)'; c.beginPath(); c.moveTo(0, 0); c.arc(0, 0, r - 1, -1.5708, -1.5708 + TAU * f); c.closePath(); c.fill();
    }
    c.lineWidth = Math.max(2, r * 0.07); c.strokeStyle = state === 'ready' ? '#ffd24a' : state === 'active' ? '#ffffff' : (state === 'off' ? '#555' : col);
    circ(c, 0, 0, r); c.stroke(); c.lineWidth = 1.5; c.strokeStyle = OUT; circ(c, 0, 0, r + 1.5); c.stroke();
    if (auto) { c.fillStyle = '#ffd24a'; circ(c, r * 0.7, -r * 0.7, r * 0.17); c.fill(); c.strokeStyle = OUT; c.stroke(); }
  }

  // Estados sobre un enemigo (x,y = centro, s = radio del enemigo). kind: blind slow burn poison bleed stun mark freeze
  function status(c, kind, x, y, s, t) {
    t = t == null ? T() : t; c.translate(x, y); c.lineJoin = 'round'; c.lineCap = 'round'; var i, a;
    switch (kind) {
      case 'blind': c.fillStyle = '#e8f6ff'; c.strokeStyle = OUT; c.lineWidth = 1.5; c.beginPath(); c.ellipse(0, -s - 8, 7, 4, 0, 0, TAU); c.fill(); c.stroke(); c.strokeStyle = '#d02048'; c.lineWidth = 2; c.beginPath(); c.moveTo(-8, -s - 12); c.lineTo(8, -s - 4); c.stroke(); break;
      case 'slow': c.strokeStyle = 'rgba(140,210,255,0.85)'; c.lineWidth = 2; c.beginPath(); c.arc(0, 0, s + 3, 0.3 + t, 2.4 + t); c.stroke(); c.fillStyle = '#e8f6ff'; for (i = 0; i < 3; i++) { circ(c, Math.cos(t * 2 + i * 2.1) * (s + 2), Math.sin(t * 2 + i * 2.1) * (s + 2), 1.8); c.fill(); } break;
      case 'freeze': c.fillStyle = 'rgba(190,235,255,0.55)'; c.strokeStyle = '#e8f8ff'; c.lineWidth = 2; c.beginPath(); c.moveTo(0, -s - 5); c.lineTo(s + 4, -s * 0.3); c.lineTo(s * 0.8, s + 3); c.lineTo(-s * 0.8, s + 3); c.lineTo(-s - 4, -s * 0.3); c.closePath(); c.fill(); c.stroke(); break;
      case 'burn': for (i = 0; i < 3; i++) { var fx = (i - 1) * s * 0.5, h = 5 + 3 * Math.sin(t * 14 + i * 2); c.fillStyle = i === 1 ? '#ffe45a' : '#ff7a2a'; c.beginPath(); c.moveTo(fx - 3, -s * 0.2); c.quadraticCurveTo(fx, -s - h, fx + 3, -s * 0.2); c.fill(); } break;
      case 'poison': c.fillStyle = 'rgba(123,227,74,0.8)'; for (i = 0; i < 3; i++) { circ(c, (i - 1) * s * 0.55, -s * 0.6 - ((t * 14 + i * 5) % 12), 2 + (i % 2)); c.fill(); } break;
      case 'bleed': c.fillStyle = '#d02048'; for (i = 0; i < 3; i++) { var yy = ((t * 18 + i * 6) % 14); circ(c, (i - 1) * s * 0.4, s * 0.1 + yy, 2); c.fill(); } break;
      case 'stun': c.fillStyle = '#ffe45a'; c.strokeStyle = OUT; c.lineWidth = 1; for (i = 0; i < 3; i++) { a = t * 5 + i * 2.094; circ(c, Math.cos(a) * (s * 0.8), -s - 5 + Math.sin(a) * 3, 2.6); c.fill(); c.stroke(); } break;
      case 'mark': c.strokeStyle = '#ff2a7a'; c.lineWidth = 2; var m = s + 5 + Math.sin(t * 6) * 1.5; c.beginPath(); c.arc(0, 0, m, 0, TAU); c.stroke(); for (i = 0; i < 4; i++) { a = i * 1.5708; c.beginPath(); c.moveTo(Math.cos(a) * (m - 4), Math.sin(a) * (m - 4)); c.lineTo(Math.cos(a) * (m + 5), Math.sin(a) * (m + 5)); c.stroke(); } break;
    }
  }

  /* ---------- VFX DE ZONA / LANZAMIENTO / IMPACTO (u = progreso 0..1 salvo indicación) ---------- */
  // Tormenta de escarcha: zona nevada que sigue al jugador. t en segundos, alpha 0..1
  function storm(c, x, y, r, t, alpha) {
    c.globalAlpha = cl(alpha);
    var g = c.createRadialGradient(x, y, r * 0.2, x, y, r); g.addColorStop(0, 'rgba(170,225,255,0.3)'); g.addColorStop(1, 'rgba(120,180,240,0.05)');
    c.fillStyle = G.fg ? G.fg(g, 'rgba(150,210,255,0.2)') : g; c.beginPath(); c.ellipse(x, y, r, r * 0.8, 0, 0, TAU); c.fill();
    c.fillStyle = '#ffffff'; for (var i = 0; i < 16; i++) { var a = rnd(i) * TAU + t * 0.4, rr = Math.sqrt(rnd(i + 40)) * r, py = y + Math.sin(a) * rr * 0.8, px = x + Math.cos(a) * rr + Math.sin(t * 2 + i) * 4, fall = ((t * 40 + i * 13) % 20) - 10; circ(c, px, py + fall, 1.6); c.fill(); }
    c.strokeStyle = 'rgba(200,240,255,0.85)'; c.lineWidth = 2; c.setLineDash([6, 8]); c.lineDashOffset = t * 24; c.beginPath(); c.ellipse(x, y, r, r * 0.8, 0, 0, TAU); c.stroke(); c.setLineDash([]);
    c.globalAlpha = 1;
  }
  // Rayo que cae del cielo sobre (x,y); u 0..1 (se desvanece). big = rayo global (Descarga)
  function strike(c, x, y, u, big) {
    var a = cl(1 - u), top = y - (big ? 420 : 240), w = big ? 4 : 2.5; c.globalAlpha = a;
    bolt(c, x + (big ? 20 : 12), top, x, y, w, Math.floor(x * 7 + y) % 997, big ? '200,255,74' : '140,220,255');
    glow(c, x, y, (big ? 46 : 30) * (0.6 + u * 0.6), big ? '200,255,74' : '170,230,255', 0.8);
    c.globalAlpha = a; c.strokeStyle = '#fff'; c.lineWidth = 2; c.beginPath(); c.ellipse(x, y, (big ? 34 : 22) * (0.4 + u), (big ? 34 : 22) * (0.4 + u) * 0.6, 0, 0, TAU); c.stroke();
  }
  // Espora de Escarcha tóxica en vuelo/espera (t seg) y su explosión (u 0..1, r radio)
  function spore(c, x, y, t, s) {
    s = s || 8; var p = 1 + 0.12 * Math.sin(t * 8);
    glow(c, x, y, s * 2.4, '160,255,120', 0.4);
    c.fillStyle = '#a8e86a'; c.strokeStyle = OUT; c.lineWidth = 1.5; circ(c, x, y, s * p); c.fill(); c.stroke();
    c.strokeStyle = '#e8f8ff'; c.lineWidth = 1.5; for (var i = 0; i < 6; i++) { var a = i * 1.0472 + t; c.beginPath(); c.moveTo(x + Math.cos(a) * s * p, y + Math.sin(a) * s * p); c.lineTo(x + Math.cos(a) * (s * p + 4), y + Math.sin(a) * (s * p + 4)); c.stroke(); }
    c.fillStyle = '#6ac8ff'; circ(c, x - 2, y - 2, s * 0.3); c.fill();
  }
  function sporeBurst(c, x, y, r, u) {
    var a = cl(1 - u), e = 1 - (1 - u) * (1 - u); c.globalAlpha = a;
    glow(c, x, y, r * (0.5 + e), '150,255,150', 0.6);
    c.strokeStyle = '#d8ffe8'; c.lineWidth = 3 * a + 1; c.beginPath(); c.arc(x, y, r * e, 0, TAU); c.stroke();
    for (var i = 0; i < 10; i++) { var an = i * 0.628 + rnd(i) * 0.3, d = r * (0.3 + 0.8 * e); c.fillStyle = i % 2 ? '#e8f8ff' : '#7be34a'; circ(c, x + Math.cos(an) * d, y + Math.sin(an) * d, 2.5 * a + 0.5); c.fill(); }
  }
  // Nova genérica. kind 'pact' (rojo-naranja) | 'ice' | 'magnet' | 'toxic'
  function nova(c, x, y, r, u, kind) {
    var rgb = kind === 'ice' ? '170,230,255' : kind === 'magnet' ? '180,190,255' : kind === 'toxic' ? '150,255,100' : '255,90,40', a = cl(1 - u), e = 1 - (1 - u) * (1 - u);
    glow(c, x, y, r * (0.4 + e * 0.7), rgb, 0.7 * a);
    c.globalAlpha = a; c.strokeStyle = '#fff6c8'; c.lineWidth = 6 * a + 1; c.beginPath(); c.arc(x, y, r * e, 0, TAU); c.stroke();
    c.strokeStyle = 'rgba(' + rgb + ',0.9)'; c.lineWidth = 3; c.beginPath(); c.arc(x, y, r * e * 0.8, 0, TAU); c.stroke();
    if (kind === 'pact' || !kind) for (var i = 0; i < 12; i++) { var an = i * 0.5236 + rnd(i) * 0.2; c.fillStyle = i % 2 ? '#ffe45a' : '#ff4a2a'; spike(c, x + Math.cos(an) * r * e, y + Math.sin(an) * r * e, an, 8 * a + 2, 3); c.fill(); }
  }
  // Aura del buff de Pacto ardiente sobre el jugador
  function aura(c, x, y, t, alpha, r) {
    r = r || 26; c.globalAlpha = cl(alpha); glow(c, x, y, r * 1.6, '255,90,40', 0.35);
    for (var i = 0; i < 6; i++) { var a = i * 1.0472 + t * 1.5, px = x + Math.cos(a) * r * 0.9, py = y + Math.sin(a) * r * 0.7, h = 8 + 4 * Math.sin(t * 12 + i); c.fillStyle = i % 2 ? '#ff7a2a' : '#ffb02a'; c.beginPath(); c.moveTo(px - 3, py); c.quadraticCurveTo(px, py - h - 4, px + 3, py); c.fill(); }
  }
  // Campo de Imán: líneas que se pliegan hacia el centro. u 0..1 de la duración, r radio
  function magnet(c, x, y, r, t, alpha) {
    c.globalAlpha = cl(alpha); var g = c.createRadialGradient(x, y, 0, x, y, r); g.addColorStop(0, 'rgba(180,190,255,0.35)'); g.addColorStop(1, 'rgba(180,190,255,0.03)');
    c.fillStyle = G.fg ? G.fg(g, 'rgba(180,190,255,0.14)') : g; c.beginPath(); c.ellipse(x, y, r, r * 0.8, 0, 0, TAU); c.fill();
    c.strokeStyle = 'rgba(220,225,255,0.85)'; c.lineWidth = 2;
    for (var i = 0; i < 8; i++) { var a = i * 0.7854, k = 1 - ((t * 0.9 + i * 0.125) % 1), r0 = r * (0.25 + 0.75 * k); c.beginPath(); c.arc(x, y, r0, a, a + 0.5); c.stroke(); c.save(); c.translate(x + Math.cos(a + 0.25) * r0, y + Math.sin(a + 0.25) * r0 * 0.8); c.rotate(a + 0.25 + Math.PI); c.fillStyle = '#fff'; c.beginPath(); c.moveTo(5, 0); c.lineTo(-3, -3); c.lineTo(-3, 3); c.fill(); c.restore(); }
    c.strokeStyle = 'rgba(255,255,255,0.6)'; c.setLineDash([5, 7]); c.lineDashOffset = -t * 20; c.beginPath(); c.ellipse(x, y, r, r * 0.8, 0, 0, TAU); c.stroke(); c.setLineDash([]);
  }
  // Cadena eléctrica por puntos [{x,y},...]; t seg
  function chain(c, pts, t, rgb) {
    if (!pts || pts.length < 2) return; rgb = rgb || '200,210,255';
    for (var i = 1; i < pts.length; i++) bolt(c, pts[i - 1].x, pts[i - 1].y, pts[i].x, pts[i].y, 2, Math.floor(t * 30) * 13 + i * 7, rgb);
    for (i = 0; i < pts.length; i++) glow(c, pts[i].x, pts[i].y, 14, rgb, 0.6);
  }
  // Hacha de Forja en vuelo: ang dirección, t seg (gira), sc escala (1 = Nv1, r30)
  function axe(c, x, y, t, sc) {
    sc = sc || 1; c.translate(Math.round(x), Math.round(y)); c.scale(sc, sc); c.rotate(t * 14);
    glow(c, 0, 0, 44, '255,130,40', 0.55);
    c.lineJoin = 'round'; c.fillStyle = '#7a4a2a'; c.strokeStyle = OUT; c.lineWidth = 2; c.fillRect(-3, -4, 6, 30); c.strokeRect(-3, -4, 6, 30);
    c.fillStyle = '#ff8a2a'; c.beginPath(); c.moveTo(-3, 0); c.quadraticCurveTo(-8, -34, 26, -28); c.quadraticCurveTo(30, -4, 3, 4); c.closePath(); c.fill(); c.stroke();
    c.fillStyle = '#fff6a8'; c.beginPath(); c.moveTo(4, -6); c.quadraticCurveTo(10, -24, 22, -24); c.quadraticCurveTo(22, -10, 4, -6); c.fill();
    c.fillStyle = '#ffe45a'; for (var i = 0; i < 3; i++) { circ(c, 18 + Math.cos(t * 30 + i) * 5, -22 + Math.sin(t * 30 + i * 2) * 5, 1.8); c.fill(); }
  }
  // Lanza de hielo (Filo gélido) en vuelo; crit=true la pinta dorada-blanca
  function lance(c, x, y, ang, crit) {
    c.translate(Math.round(x), Math.round(y)); c.rotate(ang); c.lineJoin = 'round';
    c.globalCompositeOperation = 'lighter'; c.globalAlpha = 0.35; c.fillStyle = crit ? '#ffe45a' : '#6ac8ff'; c.beginPath(); c.ellipse(-6, 0, 14, 5, 0, 0, TAU); c.fill();
    c.globalCompositeOperation = 'source-over'; c.globalAlpha = 1; c.fillStyle = crit ? '#fff6c8' : '#d8f4ff'; c.strokeStyle = OUT; c.lineWidth = 1.5;
    c.beginPath(); c.moveTo(14, 0); c.lineTo(-6, -4); c.lineTo(-10, 0); c.lineTo(-6, 4); c.closePath(); c.fill(); c.stroke();
    c.fillStyle = '#6ac8ff'; c.fillRect(-5, -1, 8, 2);
  }
  // Telegrafía/lanzamiento del abanico: cono desde (x,y), ang centro, ancho total spread (rad), alcance range; u 0..1
  function fan(c, x, y, ang, spread, range, u) {
    var a = cl(1 - u); c.globalAlpha = a * 0.8;
    var g = c.createRadialGradient(x, y, 10, x, y, range); g.addColorStop(0, 'rgba(200,240,255,0.5)'); g.addColorStop(1, 'rgba(160,220,255,0)');
    c.fillStyle = G.fg ? G.fg(g, 'rgba(180,230,255,0.25)') : g; c.beginPath(); c.moveTo(x, y); c.arc(x, y, range * (0.5 + 0.5 * u), ang - spread / 2, ang + spread / 2); c.closePath(); c.fill();
    c.strokeStyle = '#e8f8ff'; c.lineWidth = 2; for (var i = 0; i < 5; i++) { var aa = ang - spread / 2 + spread * i / 4; c.beginPath(); c.moveTo(x + Math.cos(aa) * 20, y + Math.sin(aa) * 20); c.lineTo(x + Math.cos(aa) * range * (0.4 + 0.6 * u), y + Math.sin(aa) * range * (0.4 + 0.6 * u)); c.stroke(); }
  }
  // Marca de Hemotoxina + hilo de sangre hacia el jugador (opcional). t seg
  function mark(c, x, y, s, t) { status(c, 'mark', x, y, s || 12, t); }
  function drain(c, x0, y0, x1, y1, u) {   // gota/hilo del marcado que muere hacia el jugador; u 0..1
    var a = cl(1 - u * u); c.globalAlpha = a; c.strokeStyle = 'rgba(208,32,72,0.5)'; c.lineWidth = 3; c.beginPath(); c.moveTo(x0, y0); c.quadraticCurveTo((x0 + x1) / 2, Math.min(y0, y1) - 40, x1, y1); c.stroke();
    var px = x0 + (x1 - x0) * u, py = y0 + (y1 - y0) * u - Math.sin(u * Math.PI) * 40; c.fillStyle = '#d02048'; c.strokeStyle = OUT; c.lineWidth = 1.5; circ(c, px, py, 5); c.fill(); c.stroke();
  }
  // Destello de lanzamiento sobre el jugador para cualquier poder
  function cast(c, id, x, y, u) {
    var rgb = { tormenta: '140,220,255', escarcha: '160,255,120', pacto: '255,90,40', iman: '180,190,255', forja: '255,140,40', filo: '190,240,255', hemo: '208,32,72', descarga: '200,255,74', vapor: '170,225,255', plasma: '255,170,40', gas: '123,227,74', sed: '208,32,72' }[id] || '255,210,74', a = cl(1 - u);
    glow(c, x, y, 20 + 40 * u, rgb, 0.8 * a); c.globalAlpha = a; c.strokeStyle = 'rgba(' + rgb + ',1)'; c.lineWidth = 3; c.beginPath(); c.arc(x, y, 12 + 38 * u, 0, TAU); c.stroke();
  }
  // Impacto pequeño por poder sobre un enemigo
  function impact(c, id, x, y, u, s) {
    s = s || 14; var a = cl(1 - u), e = 1 - (1 - u) * (1 - u), col = COL[id] || '#ffd24a'; c.globalAlpha = a;
    glow(c, x, y, s * (1 + e), id === 'descarga' ? '200,255,74' : id === 'hemo' ? '208,32,72' : '255,255,255', 0.5);
    c.fillStyle = col; for (var i = 0; i < 6; i++) { var an = i * 1.0472 + rnd(i + (x | 0)) * 0.6, d = s * (0.4 + e * 1.1); circ(c, x + Math.cos(an) * d, y + Math.sin(an) * d, 2.4 * a + 0.4); c.fill(); }
    if (id === 'filo' || id === 'forja') { c.strokeStyle = '#fff'; c.lineWidth = 2; c.beginPath(); c.moveTo(x - s * e, y - s * e); c.lineTo(x + s * e, y + s * e); c.moveTo(x + s * e, y - s * e); c.lineTo(x - s * e, y + s * e); c.stroke(); }
  }

  // ---------- Exportación segura ----------
  var API = { icon: icon, infuse: infuse, btn: btn, status: status, storm: storm, strike: strike, spore: spore, sporeBurst: sporeBurst, nova: nova, aura: aura,
    magnet: magnet, chain: chain, axe: axe, lance: lance, fan: fan, mark: mark, drain: drain, cast: cast, impact: impact };
  Object.keys(API).forEach(function (k) {
    var f = API[k];
    B[k] = function (c) { if (!c) return; c.save(); try { f.apply(null, arguments); } catch (e) { B.lastError = e; } c.restore(); };
  });
  var iconNew = B.icon; B.icon = function (c, id, x, y, s) { if (!c) return; if (!NEW[id] && OLD) { c.save(); try { OLD(c, id, x, y, s); } catch (e) { B.lastError = e; } c.restore(); } else iconNew(c, id, x, y, s); };
  B.ids = ['vapor', 'plasma', 'gas', 'sed', 'tormenta', 'escarcha', 'pacto', 'iman', 'forja', 'filo', 'hemo', 'descarga'];
  B.tags = ['fire', 'ice', 'lightning', 'poison', 'blood', 'steel'];
  B.states = ['blind', 'slow', 'freeze', 'burn', 'poison', 'bleed', 'stun', 'mark'];

  // Los ids nuevos funcionan con G.FusionArt.icon existente; ids antiguos siguen en la función original.
  var old = OLD;
  A1.icon = function (c, id, x, y, s) { if (!c) return; if (NEW[id] || !old) return B.icon(c, id, x, y, s); return old.apply(A1, arguments); };
  A1.btn = A1.btn || B.btn;
})();
