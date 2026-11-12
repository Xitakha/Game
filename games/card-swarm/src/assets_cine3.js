/*!
 * assets_cine3.js - FASE 3 de arte de las cinematicas v9 (DESIGN-v9-cinematicas.md, seccion 6: cierre, aldea y arte): EPILOGO en el Hogar (6 vinetas con capas y
 * parallax), PANTALLA DE CREDITOS (Xitakha Studio + el equipo) y sistema de ALDEA RECONSTRUIDA por nivel 0..6 (un overlay sobre Assets.drawVillage).
 * Tono: cuento junto al fuego OSCURO con esperanza al final. Todo procedural (canvas 2D), sin librerias; fondos en capas cacheadas (LRU de 2 escenas,
 * recorte vertical y baja resolucion en las lejanas) y luces/fuego/personajes en vivo. Contrato: ASSETS_API.md ("Cinematicas v9 - epilogo, creditos y aldea").
 * Cargar DESPUES de assets.js, assets_village.js y assets_armor.js (Carapa); opcional assets_cine.js (logo SWARM HAND). Seguro: nunca lanza y no toca G ni el DOM.
 */
(function () {
  'use strict';
  var A = window.Assets;
  if (!A) { if (window.console) console.warn('assets_cine3: falta Assets'); return; }
  var TAU = Math.PI * 2, VH = 540, OL = '#0c0710', FONT = '"Courier New", monospace';
  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  function sm(a, b, v) { var u = clamp((v - a) / (b - a), 0, 1); return u * u * (3 - 2 * u); }
  function lerp(a, b, u) { return a + (b - a) * u; }
  function mk(w, h) { var c = document.createElement('canvas'); c.width = Math.max(1, Math.ceil(w)); c.height = Math.max(1, Math.ceil(h)); return c; }
  function rng(seed) { var s = seed >>> 0; return function () { s = (s + 0x6D2B79F5) >>> 0; var t = s; t = Math.imul(t ^ t >>> 15, t | 1); t ^= t + Math.imul(t ^ t >>> 7, t | 61); return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
  function hex(h) { return [1, 3, 5].map(function (i) { return parseInt(h.substr(i, 2), 16); }); }
  function mixc(a, b, u) { var p = hex(a), q = hex(b); return 'rgb(' + Math.round(lerp(p[0], q[0], u)) + ',' + Math.round(lerp(p[1], q[1], u)) + ',' + Math.round(lerp(p[2], q[2], u)) + ')'; }

  // ------------------------------------------------------------------ brillos y fuego
  var GL = {};
  function glowImg(col) {
    if (GL[col]) return GL[col];
    var c = mk(128, 128), g = c.getContext('2d'), r = g.createRadialGradient(64, 64, 0, 64, 64, 64);
    r.addColorStop(0, 'rgba(' + col + ',1)'); r.addColorStop(0.3, 'rgba(' + col + ',0.5)'); r.addColorStop(0.65, 'rgba(' + col + ',0.14)'); r.addColorStop(1, 'rgba(' + col + ',0)');
    g.fillStyle = r; g.fillRect(0, 0, 128, 128); return (GL[col] = c);
  }
  function glow(c, col, x, y, r, a, sy) {
    if (a <= 0.002 || r <= 0.5) return; var pg = c.globalAlpha, po = c.globalCompositeOperation;
    c.globalCompositeOperation = 'lighter'; c.globalAlpha = a > 1 ? 1 : a; c.drawImage(glowImg(col), x - r, y - r * (sy || 1), 2 * r, 2 * r * (sy || 1));
    c.globalCompositeOperation = po; c.globalAlpha = pg;
  }
  function flick(t, calm, ph) {
    ph = ph || 0;
    if (calm) return 0.93 + 0.07 * Math.sin(t / 900 + ph);
    return 0.86 + 0.08 * Math.sin(t / 97 + ph) + 0.06 * Math.sin(t / 53 + ph * 2.3) + 0.04 * Math.sin(t / 31 + ph * 5);
  }
  var PAL_FIRE = ['#5a1408', '#c4380f', '#ff8a24', '#ffd060', '#fff2c0'];
  function palOf(col) { return [mixc(col, '#000000', 0.62), mixc(col, '#000000', 0.25), col, mixc(col, '#ffffff', 0.5), '#fff6dc']; }
  function flame(c, x, y, sz, t, calm, ph, pal) {
    if (sz < 2) return;
    var f = flick(t, calm, ph || 0), sway = calm ? 0.4 : Math.sin(t / 160 + (ph || 0)) * sz * 0.05, h = sz * f, i, sc = [1, 0.82, 0.6, 0.4, 0.2]; pal = pal || PAL_FIRE;
    c.save(); c.translate(x, y);
    for (i = 0; i < 5; i++) {
      var w = sz * 0.34 * sc[i], hh = h * (0.62 + 0.38 * sc[i]) * (i === 0 ? 1.05 : 1), sw = sway * (1 - sc[i] * 0.4);
      c.fillStyle = pal[i]; c.beginPath(); c.moveTo(-w, 0);
      c.bezierCurveTo(-w * 1.25, -hh * 0.4, -w * 0.4 + sw * 0.4, -hh * 0.7, sw, -hh);
      c.bezierCurveTo(w * 0.4 + sw * 0.4, -hh * 0.65, w * 1.25, -hh * 0.4, w, 0); c.closePath(); c.fill();
    }
    c.restore();
  }
  function embers(c, x, y, spread, rise, n, t, calm, o) {
    o = o || {}; var sp = (calm ? 0.45 : 1) * (o.speed || 1), i, u, px, py, a, sz, col = o.col || '255,170,70', seed = o.seed || 1, k;
    if (calm) n = Math.ceil(n * 0.6);
    c.save(); c.globalCompositeOperation = 'lighter';
    for (i = 0; i < n; i++) {
      k = (i * 0.6180339 + seed * 0.31) % 1; u = ((t / 1000) * sp * (0.07 + k * 0.09) + k * 7.3) % 1;
      px = x + (k - 0.5) * spread + Math.sin(u * 9 + i * 1.7) * spread * 0.18 * u; py = y - u * rise * (0.55 + k * 0.45);
      a = (u < 0.1 ? u * 10 : 1 - (u - 0.1) / 0.9) * (0.55 + 0.45 * Math.sin(t / 130 + i * 3.1) * (calm ? 0.2 : 1)); sz = 1.3 + k * 2.4 * (1 - u * 0.5);
      c.globalAlpha = clamp(a, 0, 1) * (o.alpha == null ? 1 : o.alpha); c.fillStyle = 'rgb(' + col + ')'; c.fillRect(px, py, sz, sz);
    }
    c.restore();
  }

  // ------------------------------------------------------------------ actores (sprites reales con grado oscuro y luz calida, cacheados por fotograma)
  var GR = {}, GRN = 0;
  function graded(src, side, k) {
    var id = src._c3id || (src._c3id = ++GRN), key = id + '|' + side + '|' + Math.round(k * 10);
    if (GR[key]) return GR[key];
    var c = mk(src.width, src.height), g = c.getContext('2d'), w = c.width, h = c.height;
    g.drawImage(src, 0, 0); g.globalCompositeOperation = 'source-atop'; g.fillStyle = 'rgba(' + Math.round(34 - 12 * k) + ',20,52,' + (0.5 - 0.4 * k).toFixed(2) + ')'; g.fillRect(0, 0, w, h);
    var gr = g.createLinearGradient(side > 0 ? w : 0, 0, side > 0 ? 0 : w, 0);
    gr.addColorStop(0, 'rgba(255,150,60,' + (0.4 * k).toFixed(2) + ')'); gr.addColorStop(0.55, 'rgba(120,50,30,0.04)'); gr.addColorStop(1, 'rgba(6,3,14,' + (0.5 - 0.35 * k).toFixed(2) + ')');
    g.fillStyle = gr; g.fillRect(0, 0, w, h);
    GR[key] = c; if (GRN > 500) { GR = {}; GRN = 0; }
    return c;
  }
  function actor(c, name, x, y, t, o) {
    o = o || {}; var sc = o.scale || 2, flip = !!o.flip, fr, k = o.lit == null ? 1 : o.lit, side = o.side == null ? 1 : o.side;
    try { fr = name === 'marlo' ? A.animFrame('player', o.anim || 'idle', t) : A.animFrame('npc_' + name, o.anim || 'idle', t + (o.tOff || 0)); } catch (e) { fr = null; }
    c.save(); c.globalAlpha = (o.alpha == null ? 1 : o.alpha);
    c.fillStyle = 'rgba(4,2,8,0.5)'; c.beginPath(); c.ellipse(x, y - 1, 24 * sc * 0.9, 6 * sc * 0.8, 0, 0, TAU); c.fill();
    if (fr) {
      var anc = name === 'marlo' ? { x: 24 * sc, y: 42 * sc } : { x: 40 * sc, y: 80 * sc };
      c.translate(x, y); if (flip) c.scale(-1, 1); c.imageSmoothingEnabled = true; c.drawImage(graded(fr, flip ? -side : side, k), -anc.x, -anc.y, fr.width * sc, fr.height * sc);
    } else { c.fillStyle = '#1a1020'; c.beginPath(); c.ellipse(x, y - 30 * sc, 14 * sc, 28 * sc, 0, 0, TAU); c.fill(); }
    c.restore();
  }
  function heart(t, calm) { if (calm) return 0.7 + 0.2 * Math.sin(t / 700); var u = (t % 1400) / 1400; return clamp(Math.max(Math.exp(-Math.pow((u - 0.1) * 11, 2)), 0.7 * Math.exp(-Math.pow((u - 0.28) * 10, 2))) + 0.18, 0, 1); }
  // Marlo + halo de la brasa mansa (bufanda). show=false: la brasa ya no esta en la bufanda
  function marlo(c, x, y, t, o) {
    o = o || {}; var sc = o.scale || 2.5, b = heart(t, !!o.calm);
    actor(c, 'marlo', x, y, t, { scale: sc, flip: !!o.flip, anim: o.anim || 'idle', lit: o.lit, side: o.side, alpha: o.alpha });
    var nx = x + (o.flip ? 1 : -1) * sc, ny = y - 12 * sc;
    if (o.show !== false) { glow(c, '255,176,70', nx, ny, 9 * sc * (0.8 + 0.4 * b), 0.55 * b * (o.glow == null ? 1 : o.glow)); glow(c, '255,230,150', nx, ny, 3 * sc, 0.5 * b); }
    return { x: nx, y: ny };
  }

  // ------------------------------------------------------------------ infraestructura de capas (cache LRU de 2 escenas)
  var CACHE = [], MAXC = 2;
  function entry(key) { var i; for (i = 0; i < CACHE.length; i++) if (CACHE[i].key === key) { var e = CACHE.splice(i, 1)[0]; CACHE.push(e); return e; } return null; }
  function layers(id, w, h, o, defs) {
    var key = id + '|' + w + 'x' + h + '|' + (o && o.lite ? 1 : 0), e = entry(key);
    if (e && e.L) return e;
    var s = h / VH, VW = w / s, V = { s: s, VW: VW, pad: Math.round(VW * 0.14) }, q = o && o.lite ? 0.6 : 1, n, d, lw, lh, c, g, sc;
    e = { key: key, V: V, L: {} }; CACHE.push(e); while (CACHE.length > MAXC) { var old = CACHE.shift(); old.L = null; }
    for (n in defs) {
      d = defs[n]; lw = VW + V.pad * 2; lh = VH - (d.y0 || 0); sc = s * q * (d.q || 1);
      c = mk(lw * sc, lh * sc); g = c.getContext('2d'); g.scale(sc, sc); g.translate(V.pad, -(d.y0 || 0));
      try { d.paint(g, V); } catch (er) { if (window.console) console.warn('assets_cine3 paint ' + id + '/' + n, er); }
      e.L[n] = { c: c, w: lw, h: lh, y0: d.y0 || 0 };
    }
    return e;
  }
  function put(c, E, name, depth, p, alpha) {
    var L = E.L[name], V = E.V; if (!L) return;
    var pa = c.globalAlpha; if (alpha != null) c.globalAlpha = pa * alpha;
    c.drawImage(L.c, -V.pad + (0.5 - p) * 2 * V.pad * depth, L.y0, L.w, L.h); c.globalAlpha = pa;
  }
  var VIG = null;
  function vignette(c, w, h, st) {
    if (!VIG) {
      VIG = mk(160, 90); var g = VIG.getContext('2d'), r = g.createRadialGradient(80, 45, 12, 80, 45, 100);
      r.addColorStop(0, 'rgba(8,3,10,0)'); r.addColorStop(0.45, 'rgba(8,3,10,0.18)'); r.addColorStop(0.8, 'rgba(8,3,10,0.78)'); r.addColorStop(1, 'rgba(8,3,10,0.96)'); g.fillStyle = r; g.fillRect(0, 0, 160, 90);
    }
    c.save(); c.globalAlpha = clamp(st, 0, 1); c.imageSmoothingEnabled = true; c.drawImage(VIG, 0, 0, w, h); c.restore();
  }
  function fade(c, w, h, a, col) { if (a <= 0.003) return; c.save(); c.globalAlpha = clamp(a, 0, 1); c.fillStyle = col || '#040206'; c.fillRect(0, 0, w, h); c.restore(); }
  function darkness(c, V, x, y, r, a) {
    var g = c.createRadialGradient(x, y, r * 0.12, x, y, r); g.addColorStop(0, 'rgba(6,3,12,0)'); g.addColorStop(0.5, 'rgba(6,3,12,' + (a * 0.45).toFixed(2) + ')'); g.addColorStop(1, 'rgba(6,3,12,' + a.toFixed(2) + ')');
    c.fillStyle = g; c.fillRect(-V.pad - 40, -40, V.VW + V.pad * 2 + 80, VH + 80);
  }
  function skyGrad(c, V, stops) { var g = c.createLinearGradient(0, 0, 0, VH), i; for (i = 0; i < stops.length; i += 2) g.addColorStop(stops[i], stops[i + 1]); c.fillStyle = g; c.fillRect(-V.pad, 0, V.VW + V.pad * 2, VH); }
  function stars(c, V, n, seed, ymax) { var r = rng(seed), i; for (i = 0; i < n; i++) { c.fillStyle = 'rgba(255,230,200,' + (0.15 + r() * 0.5).toFixed(2) + ')'; c.fillRect(-V.pad + r() * (V.VW + V.pad * 2), r() * ymax, r() < 0.15 ? 2.4 : 1.4, 1.6); } }
  function ridge(c, V, base, amp, col, seed, freq) {
    var r = rng(seed), p1 = r() * 6, p2 = r() * 6, p3 = r() * 6, x, x0 = -V.pad, x1 = V.VW + V.pad;
    c.fillStyle = col; c.beginPath(); c.moveTo(x0, VH);
    for (x = x0; x <= x1; x += 8) c.lineTo(x, base - amp * (0.55 * Math.sin(x * freq + p1) + 0.3 * Math.sin(x * freq * 2.3 + p2) + 0.15 * Math.sin(x * freq * 5.1 + p3)));
    c.lineTo(x1, VH); c.closePath(); c.fill();
  }
  function groundGrad(c, V, y0, top, bot) { var g = c.createLinearGradient(0, y0, 0, VH); g.addColorStop(0, top); g.addColorStop(1, bot); c.fillStyle = g; c.fillRect(-V.pad, y0, V.VW + V.pad * 2, VH - y0); }
  function pillars(c, V, col) { var x0 = -V.pad, x1 = V.VW + V.pad; c.fillStyle = col; c.fillRect(x0, 0, 40 + V.pad * 0.5, VH); c.fillRect(x1 - 40 - V.pad * 0.5, 0, 40 + V.pad * 0.5, VH); }

  // ------------------------------------------------------------------ el Hogar (sala): st 0 = en ruinas, 1 = reconstruido
  var HY = 440;   // suelo
  function wallPaint(c, V, st) {
    var x0 = -V.pad, w = V.VW + V.pad * 2, cx = V.VW / 2, r = rng(st ? 11 : 5), i, j, g;
    g = c.createLinearGradient(0, 0, 0, HY); g.addColorStop(0, st ? '#3b2a2c' : '#0f0d16'); g.addColorStop(1, st ? '#563c36' : '#1d1820'); c.fillStyle = g; c.fillRect(x0, 0, w, HY + 4);
    // sillares
    for (j = 0; j < 15; j++) {
      var yy = 40 + j * 27, off = (j % 2) * 30;
      for (i = -1; i < w / 60 + 1; i++) { c.fillStyle = 'rgba(0,0,0,' + (0.04 + r() * 0.14).toFixed(2) + ')'; c.fillRect(x0 + i * 60 + off, yy, 58, 25); }
      c.fillStyle = 'rgba(0,0,0,0.28)'; c.fillRect(x0, yy + 25, w, 2);
    }
    // ventanas arqueadas
    var wx = [cx - 290, cx + 290], k;
    for (k = 0; k < 2; k++) {
      var X = wx[k]; c.fillStyle = st ? '#2a1c1a' : '#07050a'; c.beginPath(); c.moveTo(X - 44, 270); c.lineTo(X - 44, 170); c.quadraticCurveTo(X, 100, X + 44, 170); c.lineTo(X + 44, 270); c.closePath(); c.fill();
      if (st) { c.fillStyle = '#d08a3a'; c.beginPath(); c.moveTo(X - 36, 266); c.lineTo(X - 36, 172); c.quadraticCurveTo(X, 112, X + 36, 172); c.lineTo(X + 36, 266); c.closePath(); c.fill(); c.fillStyle = '#4a2c1a'; c.fillRect(X - 2, 120, 4, 146); c.fillRect(X - 36, 200, 72, 4); }
      else { c.fillStyle = '#0a1020'; c.beginPath(); c.moveTo(X - 36, 266); c.lineTo(X - 36, 172); c.quadraticCurveTo(X - 10, 130, X + 6, 150); c.lineTo(X - 6, 200); c.lineTo(X + 8, 266); c.closePath(); c.fill(); c.fillStyle = '#05030a'; c.fillRect(X + 20, 210, 6, 56); }
    }
    // chimenea: campana y hogar
    c.fillStyle = st ? '#6a5040' : '#2b2228'; c.beginPath(); c.moveTo(cx - 150, 250); c.lineTo(cx - 70, 0); c.lineTo(cx + 70, 0); c.lineTo(cx + 150, 250); c.closePath(); c.fill();
    c.fillStyle = st ? '#563f31' : '#221a20'; c.fillRect(cx - 140, 236, 280, 22); c.fillRect(cx - 120, 258, 34, HY - 258); c.fillRect(cx + 86, 258, 34, HY - 258);
    c.fillStyle = '#06040a'; c.beginPath(); c.moveTo(cx - 86, HY); c.lineTo(cx - 86, 300); c.quadraticCurveTo(cx, 250, cx + 86, 300); c.lineTo(cx + 86, HY); c.closePath(); c.fill();
    g = c.createLinearGradient(0, 260, 0, HY); g.addColorStop(0, 'rgba(0,0,0,0.6)'); g.addColorStop(1, st ? 'rgba(60,20,10,0.5)' : 'rgba(10,10,18,0.4)'); c.fillStyle = g; c.fillRect(cx - 86, 270, 172, HY - 270);
    c.fillStyle = st ? '#8a6a48' : '#3a3038'; c.fillRect(cx - 150, 232, 300, 8);   // repisa
    if (st) {
      // vigas del techo, estandartes, estantes, tazas
      c.fillStyle = '#4a2e1c'; c.fillRect(x0, 0, w, 40); c.fillStyle = '#35200f'; c.fillRect(x0, 36, w, 6);
      for (i = -4; i <= 4; i++) { c.fillStyle = '#3d2615'; c.beginPath(); c.moveTo(cx + i * 150 - 14, 42); c.lineTo(cx + i * 150 + 14, 42); c.lineTo(cx + i * 150 + 40, 100); c.lineTo(cx + i * 150 - 40, 100); c.closePath(); c.fill(); }
      [cx - 190, cx + 190].forEach(function (bx) { c.fillStyle = '#7a4a2a'; c.fillRect(bx - 22, 60, 44, 4); c.fillStyle = '#b8321c'; c.beginPath(); c.moveTo(bx - 20, 64); c.lineTo(bx + 20, 64); c.lineTo(bx + 20, 190); c.lineTo(bx, 172); c.lineTo(bx - 20, 190); c.closePath(); c.fill(); c.fillStyle = '#ffb04a'; c.beginPath(); c.arc(bx, 108, 9, 0, TAU); c.fill(); c.fillStyle = '#b8321c'; c.beginPath(); c.arc(bx, 110, 5, 0, TAU); c.fill(); });
      c.fillStyle = '#5a3a22'; c.fillRect(cx - 120, 205, 240, 6); for (i = 0; i < 6; i++) { c.fillStyle = ['#c8602c', '#6aa8a0', '#e8c070'][i % 3]; c.fillRect(cx - 100 + i * 36, 192, 12, 13); }
    } else {
      // viga rota, agujero en el techo con cielo, estandarte hecho jirones, grietas
      c.fillStyle = '#1a1210'; c.beginPath(); c.moveTo(x0, 0); c.lineTo(cx - 420, 0); c.lineTo(cx - 400, 40); c.lineTo(cx - 330, 26); c.lineTo(cx - 280, 70); c.lineTo(cx - 230, 40); c.lineTo(cx - 170, 90); c.lineTo(cx - 120, 0); c.lineTo(cx - 40, 0); c.lineTo(cx - 30, 30); c.lineTo(cx + 120, 30); c.lineTo(cx + 140, 0); c.lineTo(x0 + w, 0); c.lineTo(x0 + w, 44); c.lineTo(x0, 44); c.closePath(); c.fill();
      var sg = c.createLinearGradient(0, 0, 0, 90); sg.addColorStop(0, '#0b1230'); sg.addColorStop(1, '#1c2446'); c.fillStyle = sg; c.beginPath(); c.moveTo(cx - 400, 0); c.lineTo(cx - 120, 0); c.lineTo(cx - 170, 90); c.lineTo(cx - 230, 40); c.lineTo(cx - 280, 70); c.lineTo(cx - 330, 26); c.lineTo(cx - 400, 40); c.closePath(); c.fill();
      c.fillStyle = 'rgba(255,240,220,0.7)'; for (i = 0; i < 9; i++) c.fillRect(cx - 390 + r() * 250, 4 + r() * 40, 2, 2);
      c.fillStyle = '#1b1114'; c.save(); c.translate(cx - 190, 60); c.rotate(0.55); c.fillRect(-14, 0, 28, 330); c.restore();   // viga caida
      c.fillStyle = '#4a1814'; c.beginPath(); c.moveTo(cx + 170, 64); c.lineTo(cx + 210, 64); c.lineTo(cx + 206, 120); c.lineTo(cx + 196, 108); c.lineTo(cx + 192, 170); c.lineTo(cx + 180, 130); c.lineTo(cx + 170, 150); c.closePath(); c.fill();
      c.strokeStyle = 'rgba(0,0,0,0.6)'; c.lineWidth = 2.4; for (i = 0; i < 6; i++) { var gx = cx - 460 + i * 190 + r() * 60, gy = 60 + r() * 200; c.beginPath(); c.moveTo(gx, gy); c.lineTo(gx + 12, gy + 30); c.lineTo(gx - 6, gy + 60); c.lineTo(gx + 8, gy + 100); c.stroke(); }
      c.fillStyle = 'rgba(16,26,60,0.28)'; c.fillRect(x0, 0, w, HY);   // frio
    }
  }
  function floorPaint(c, V, st) {
    var x0 = -V.pad, w = V.VW + V.pad * 2, cx = V.VW / 2, r = rng(st ? 21 : 9), i, g = c.createLinearGradient(0, HY, 0, VH);
    g.addColorStop(0, st ? '#4a3022' : '#17121a'); g.addColorStop(1, st ? '#2c1a14' : '#0a070c'); c.fillStyle = g; c.fillRect(x0, HY, w, VH - HY);
    c.fillStyle = 'rgba(0,0,0,0.35)'; c.fillRect(x0, HY, w, 5);
    for (i = 0; i < 9; i++) { var yy = HY + 10 + i * i * 1.3 + i * 6; c.fillStyle = 'rgba(0,0,0,0.3)'; c.fillRect(x0, yy, w, 2); }
    for (i = -30; i < 30; i++) { c.strokeStyle = 'rgba(0,0,0,0.22)'; c.lineWidth = 2; c.beginPath(); c.moveTo(cx + i * 40, HY + 4); c.lineTo(cx + i * 110, VH); c.stroke(); }
    if (st) {
      c.fillStyle = '#8a2a1c'; c.beginPath(); c.ellipse(cx, HY + 64, 230, 40, 0, 0, TAU); c.fill(); c.fillStyle = '#c8602c'; c.beginPath(); c.ellipse(cx, HY + 64, 190, 30, 0, 0, TAU); c.fill(); c.fillStyle = '#8a2a1c'; c.beginPath(); c.ellipse(cx, HY + 64, 140, 20, 0, 0, TAU); c.fill();
    } else {
      c.fillStyle = 'rgba(120,120,130,0.16)'; for (i = 0; i < 40; i++) { c.beginPath(); c.ellipse(x0 + r() * w, HY + 20 + r() * 90, 8 + r() * 24, 2 + r() * 6, 0, 0, TAU); c.fill(); }   // ceniza/nieve
      c.fillStyle = '#0b080d'; for (i = 0; i < 22; i++) { var rx = x0 + r() * w, ry = HY + 14 + r() * 90, rs = 6 + r() * 16; c.beginPath(); c.moveTo(rx - rs, ry + 4); c.lineTo(rx - rs * 0.3, ry - rs * 0.7); c.lineTo(rx + rs * 0.5, ry - rs * 0.5); c.lineTo(rx + rs, ry + 4); c.closePath(); c.fill(); }
      c.fillStyle = '#1b1114'; c.save(); c.translate(cx + 150, HY + 70); c.rotate(-0.1); c.fillRect(-90, -8, 180, 16); c.restore();
    }
  }
  function fgRoom(c, V, st) {
    pillars(c, V, st ? '#1a0e0a' : '#050308');
    if (!st) { c.fillStyle = '#050308'; c.save(); c.translate(V.VW - 40, VH + 10); c.rotate(-0.8); c.fillRect(-12, -330, 24, 330); c.restore(); }
    else { var cxx = [60, V.VW - 60]; cxx.forEach(function (x) { c.strokeStyle = '#0c0608'; c.lineWidth = 2; c.beginPath(); c.moveTo(x, 0); c.lineTo(x, 70); c.stroke(); c.fillStyle = '#1a0e0a'; c.fillRect(x - 12, 70, 24, 28); c.fillStyle = '#e8a040'; c.fillRect(x - 8, 74, 16, 20); }); }
  }
  function hearthFire(c, V, t, size, calm, a, ph) {
    var cx = V.VW / 2, y = HY - 6, f = flick(t, calm, ph || 0);
    if (a <= 0) return;
    glow(c, '255,130,40', cx, y - size * 0.55, size * 2.9 + 40, 0.3 * a * f, 0.9);
    // troncos
    c.fillStyle = '#2a170d'; c.save(); c.translate(cx, y); c.rotate(0.14); c.fillRect(-64, -12, 128, 18); c.restore(); c.save(); c.translate(cx, y); c.rotate(-0.14); c.fillRect(-64, -12, 128, 18); c.restore();
    c.fillStyle = '#17090a'; c.beginPath(); c.ellipse(cx, y + 2, 76, 7, 0, 0, TAU); c.fill();
    if (size > 2) { flame(c, cx, y - 4, size, t, calm, 1.3); flame(c, cx - size * 0.26, y - 4, size * 0.6, t, calm, 2.6); flame(c, cx + size * 0.28, y - 4, size * 0.66, t, calm, 4.1); }
    glow(c, '255,190,90', cx, y - 6, 26 + size * 0.5, 0.4 * a);
    if (size > 20) embers(c, cx, y - 20, size * 0.9, size * 2.2, Math.round(4 + size / 12), t, calm, { seed: 3 });
  }
  function lightShaft(c, V, t, calm, a) {
    var cx = V.VW / 2, g = c.createLinearGradient(0, 0, 0, HY + 40), i;
    g.addColorStop(0, 'rgba(140,170,255,' + (0.2 * a).toFixed(3) + ')'); g.addColorStop(1, 'rgba(140,170,255,0)');
    c.save(); c.globalCompositeOperation = 'lighter'; c.fillStyle = g; c.beginPath(); c.moveTo(cx - 400, 0); c.lineTo(cx - 140, 0); c.lineTo(cx + 30, HY + 40); c.lineTo(cx - 190, HY + 40); c.closePath(); c.fill();
    c.fillStyle = 'rgb(200,220,255)'; for (i = 0; i < 26; i++) { var k = (i * 0.618) % 1, u = ((t / 1000) * (calm ? 0.012 : 0.03) * (0.5 + k) + k * 3) % 1, y = u * HY, x = cx - 270 + y * 0.5 + (k - 0.5) * 220 + Math.sin(u * 7 + i) * 8; c.globalAlpha = a * (0.1 + 0.4 * k) * Math.sin(u * Math.PI); c.fillRect(x, y, 1.8, 1.8); }
    c.restore();
  }
  function ashFall(c, V, t, calm, n, a) {
    var i; c.save(); c.fillStyle = 'rgb(210,196,190)';
    for (i = 0; i < n; i++) { var k = (i * 0.618) % 1, u = ((t / 1000) * (calm ? 0.02 : 0.05) * (0.6 + k) + k * 5) % 1; c.globalAlpha = a * (0.15 + 0.35 * k); c.fillRect(-V.pad + ((k * 977) % 1) * (V.VW + V.pad * 2) + Math.sin(u * 8 + i) * 12, u * VH, 2, 2); }
    c.restore();
  }

  // ================================================================== VINETAS DEL EPILOGO
  var SC = {};
  function runScene(id, c, w, h, t, o) {
    o = o || {}; var S = SC[id]; if (!S) return false;
    var E = layers(id, w, h, o, S.layers), V = E.V, p = o.p != null ? clamp(o.p, 0, 1) : clamp(t / S.dur, 0, 1), calm = !!o.calm;
    c.save(); c.beginPath(); c.rect(0, 0, w, h); c.clip(); c.scale(V.s, V.s);
    var z = 1 + (S.zoom || 0) * sm(0, 1, p), f = S.focus ? S.focus(V, p) : { x: V.VW / 2, y: VH / 2 };
    c.translate(f.x, f.y); c.scale(z, z); c.translate(-f.x, -f.y);
    S.draw(c, E, t, p, calm, o, V);
    c.restore();
    if (o.vignette !== false) vignette(c, w, h, o.vig == null ? 1 : o.vig);
    if (o.bars) { var bh = Math.round(h * 0.1 * clamp(o.bars, 0, 1)); c.fillStyle = '#040206'; c.fillRect(0, 0, w, bh); c.fillRect(0, h - bh, w, bh); }
    if (o.fade !== false) { fade(c, w, h, 1 - sm(0, 0.07, p)); fade(c, w, h, sm(0.94, 1, p) * (S.fadeOut == null ? 0 : S.fadeOut)); }
    return true;
  }

  // ---- 1. VICTORIA: la ultima llama (Cenizar) se apaga; las seis llamas desfallecen una a una; queda una brasa
  var JC = ['#c090ff', '#ff9a3c', '#5fd6c8', '#bfeaff', '#f3a31f'];
  SC.victoria = {
    name: 'La ultima llama', dur: 6000, zoom: 0.07,
    layers: {
      sky: { q: 0.6, paint: function (c, V) { skyGrad(c, V, [0, '#07040a', 0.5, '#1c0c12', 0.85, '#3a1710', 1, '#4a1e10']); stars(c, V, 40, 71, 200);
        var r = rng(3), i; for (i = 0; i < 7; i++) { c.fillStyle = 'rgba(40,16,16,0.5)'; c.beginPath(); c.ellipse(-V.pad + r() * (V.VW + V.pad * 2), 120 + r() * 200, 120 + r() * 120, 18 + r() * 20, 0, 0, TAU); c.fill(); } } },
      far: { y0: 240, q: 0.8, paint: function (c, V) { ridge(c, V, 400, 60, '#1a0b0d', 51, 0.007); var r = rng(8), i, x; c.fillStyle = '#12080b';
        for (i = 0; i < 9; i++) { x = -V.pad + i * ((V.VW + V.pad * 2) / 8) + r() * 40; c.fillRect(x - 6, 330 - r() * 40, 12, 80); c.beginPath(); c.moveTo(x - 14, 330); c.lineTo(x, 300 - r() * 30); c.lineTo(x + 14, 330); c.closePath(); c.fill(); } } },
      ground: { y0: 380, paint: function (c, V) { groundGrad(c, V, 424, '#1d0e10', '#08040a'); var r = rng(14), i, x, y; c.lineWidth = 2;
        for (i = 0; i < 26; i++) { x = -V.pad + r() * (V.VW + V.pad * 2); y = 436 + r() * 90; c.strokeStyle = 'rgba(255,' + Math.round(80 + r() * 60) + ',30,' + (0.12 + r() * 0.25).toFixed(2) + ')'; c.beginPath(); c.moveTo(x, y); c.lineTo(x + 20 + r() * 50, y + (r() - 0.4) * 14); c.lineTo(x + 50 + r() * 80, y + (r() - 0.5) * 24); c.stroke(); } } },
      fg: { y0: 330, paint: function (c, V) { pillars(c, V, '#030205'); var r = rng(19), i; c.fillStyle = '#030205'; for (i = 0; i < 10; i++) { var x = -V.pad + r() * (V.VW + V.pad * 2); c.beginPath(); c.moveTo(x - 20 - r() * 20, VH + 4); c.lineTo(x - 8, 500 - r() * 40); c.lineTo(x + 20 + r() * 20, VH + 4); c.closePath(); c.fill(); } } }
    },
    draw: function (c, E, t, p, calm, o, V) {
      var cx = V.VW / 2 + (0.5 - p) * V.pad * 0.3, gy = 430, i;
      put(c, E, 'sky', 0.1, p); put(c, E, 'far', 0.3, p); put(c, E, 'ground', 0.7, p);
      // corona de Cenizar (cinco puas) que se deshace
      var ca = 1 - sm(0.1, 0.62, p); if (ca > 0.01) {
        c.save(); c.globalAlpha = ca * 0.9; c.fillStyle = '#060306'; c.beginPath(); c.moveTo(cx - 120, 250);
        for (i = 0; i < 5; i++) { var sx = cx - 120 + i * 60; c.lineTo(sx + 12, 182 - (i % 2 ? 0 : 26)); c.lineTo(sx + 30, 250); }
        c.lineTo(cx + 120, 300); c.lineTo(cx - 120, 300); c.closePath(); c.fill(); c.restore();
      }
      // luz del conjunto de llamas
      var big = (1 - sm(0.04, 0.74, p)) * 330 + 10, fl = flick(t, calm, 0);
      darkness(c, V, cx, 400, V.VW * 0.8, 0.2 + 0.5 * sm(0, 0.8, p));
      glow(c, '255,150,60', cx, gy - big * 0.5, big * 2.4 + 60, 0.3 * (1 - sm(0.5, 0.95, p)) * fl, 0.9);
      // cinco llamas de color en arco (una por rescoldo) + la blanca grande
      var offs = [-190, -105, 105, 190, 0], k;
      for (k = 0; k < 5; k++) {
        var x = cx + (k === 4 ? -0 : offs[k]), out = 0.16 + 0.1 * k, sz = 130 * (1 - sm(0.02, out + 0.22, p)) * (k === 4 ? 0.0 : 1);
        if (k === 4) continue;
        var yy = gy + 14 - Math.abs(offs[k]) * 0.12;
        glow(c, hex(JC[k]).join(','), x, yy - sz * 0.5, sz * 1.6 + 10, 0.3 * (sz / 130), 0.9);
        flame(c, x, yy, sz, t, calm, k * 1.7, palOf(JC[k]));
        if (sz < 40 && p > 0.1) { var u = clamp((p - out) / 0.3, 0, 1); glow(c, '200,190,190', x + Math.sin(t / 700 + k) * 8 * u, yy - 20 - u * 90, 18 + u * 30, 0.16 * (1 - u)); }   // hilo de humo
      }
      flame(c, cx, gy + 18, big, t, calm, 2.2); flame(c, cx - big * 0.22, gy + 18, big * 0.55, t, calm, 4); flame(c, cx + big * 0.24, gy + 18, big * 0.6, t, calm, 5.5);
      if (big > 60) embers(c, cx, gy - 40, big * 0.9, big * 2.2, 18, t, calm, { seed: 2, speed: 1.2 });
      // brasa final que asciende (esperanza)
      if (p > 0.72) {
        var u2 = (p - 0.72) / 0.28, ex = cx + Math.sin(u2 * 3) * 30 + u2 * 70, ey = gy - 10 - u2 * 230, ea = Math.min(1, u2 * 5) * (1 - sm(0.85, 1, u2));
        glow(c, '255,220,150', ex, ey, 26 + 14 * heart(t, calm), 0.75 * ea); glow(c, '255,250,230', ex, ey, 8, 0.9 * ea);
      }
      ashFall(c, V, t, calm, 44, 0.9);
      put(c, E, 'fg', 1.1, p); darkness(c, V, cx, 360, V.VW * 0.9, 0.35);
    }
  };

  // ---- 2. EL HOGAR APAGADO: sala en ruinas, frio, haz de luna con polvo; Marlo entra al final
  SC.apagado = {
    name: 'El Hogar apagado', dur: 5000, zoom: 0.12, focus: function (V) { return { x: V.VW / 2, y: 330 }; },
    layers: {
      wall: { y0: 0, q: 0.9, paint: function (c, V) { wallPaint(c, V, 0); } },
      floor: { y0: HY - 4, paint: function (c, V) { floorPaint(c, V, 0); } },
      fg: { y0: 0, q: 0.8, paint: function (c, V) { fgRoom(c, V, 0); } }
    },
    draw: function (c, E, t, p, calm, o, V) {
      var cx = V.VW / 2;
      put(c, E, 'wall', 0.12, p); lightShaft(c, V, t, calm, 1); put(c, E, 'floor', 0.5, p);
      // una sola ascua casi muerta en las cenizas del hogar (apenas un punto)
      glow(c, '120,40,20', cx, HY - 8, 22, 0.1 + 0.06 * (calm ? 0 : Math.sin(t / 900)), 0.5);
      ashFall(c, V, t, calm, 26, 0.7);
      if (p > 0.5) { var u = sm(0.5, 1, p); marlo(c, cx - 520 + u * 200, 505, t, { scale: 2.5, anim: 'walk', lit: 0.1, calm: calm, glow: 0.7, show: true }); }
      put(c, E, 'fg', 1.15, p); darkness(c, V, cx, 380, V.VW * 0.85, 0.5);
    }
  };

  // ---- 3. MARLO Y LA BRASA MANSA: la brasa sale de la bufanda y viaja al hogar (sin destello: halo calido)
  function bez(a, b, cc, u) { var v = 1 - u; return v * v * a + 2 * v * u * b + u * u * cc; }
  SC.brasa = {
    name: 'La brasa mansa', dur: 7000, zoom: 0.1, focus: function (V) { return { x: V.VW / 2 - 40, y: 400 }; },
    layers: SC_room(0),
    draw: function (c, E, t, p, calm, o, V) {
      var cx = V.VW / 2, mx = lerp(cx - 320, cx - 210, sm(0, 0.3, p)), my = 505, anim = p < 0.3 ? 'walk' : 'idle', sc = 2.5;
      put(c, E, 'wall', 0.12, p); lightShaft(c, V, t, calm, 0.7); put(c, E, 'floor', 0.5, p);
      var land = sm(0.8, 0.92, p), eu = clamp((p - 0.38) / 0.45, 0, 1), eus = eu * eu * (3 - 2 * eu);
      var lit = 0.12 + 0.5 * glowLevel(p), M = marlo(c, mx, my, t, { scale: sc, anim: anim, lit: lit, side: 1, calm: calm, show: eu <= 0, glow: 1 + 0.5 * sm(0.28, 0.4, p) });
      if (p < 0.38 && p > 0.25) glow(c, '255,190,90', M.x, M.y, 40 * sm(0.25, 0.38, p) + 12, 0.35, 0.8);   // la brasa late fuerte en la bufanda
      if (eu > 0) {   // trayectoria: sube, arquea y cae sobre los troncos
        var ex = bez(M.x, (M.x + cx) / 2, cx, eus), ey = bez(M.y, M.y - 230, HY - 12, eus), a = 1;
        for (var k = 6; k >= 1; k--) { var uu = Math.max(0, eus - k * 0.03), tx = bez(M.x, (M.x + cx) / 2, cx, uu), ty = bez(M.y, M.y - 230, HY - 12, uu); glow(c, '255,160,60', tx, ty, 10 - k, 0.3 * (1 - k / 7) * a); }
        glow(c, '255,200,110', ex, ey, 34 + 8 * heart(t, calm), 0.55); glow(c, '255,244,210', ex, ey, 9, 0.95);
      }
      // hogar: ascua en los troncos y halo que crece suavemente
      var rest = p > 0.8 ? land : 0;
      if (rest > 0) { hearthFire(c, V, t, 5 + 10 * rest, calm, 0.6 + 0.4 * rest, 0); glow(c, '255,190,100', cx, HY - 14, 60 + 70 * rest, 0.3 * rest + 0.15 * heart(t, calm) * rest); }
      else hearthFire(c, V, t, 0, calm, 0.3, 0);
      ashFall(c, V, t, calm, 20, 0.6);
      put(c, E, 'fg', 1.15, p); darkness(c, V, lerp(cx - 100, cx, p), 400, V.VW * (0.85 - 0.25 * glowLevel(p)), 0.5 - 0.15 * glowLevel(p));
    }
  };
  function glowLevel(p) { return sm(0.35, 0.95, p); }
  function SC_room(st) {
    return {
      wall: { y0: 0, q: 0.9, paint: function (c, V) { wallPaint(c, V, st); } },
      floor: { y0: HY - 4, paint: function (c, V) { floorPaint(c, V, st); } },
      fg: { y0: 0, q: 0.8, paint: function (c, V) { fgRoom(c, V, st); } }
    };
  }

  // ---- 4. EL FUEGO RENACE: la ascua prende, la llama crece y la casa se recompone (ruina -> nueva en fundido, con luz que sube)
  SC.renace = {
    name: 'El fuego renace', dur: 6000, zoom: 0.08, focus: function (V) { return { x: V.VW / 2, y: 340 }; },
    layers: { wall: { y0: 0, q: 0.9, paint: function (c, V) { wallPaint(c, V, 0); } }, wallN: { y0: 0, q: 0.9, paint: function (c, V) { wallPaint(c, V, 1); } },
      floor: { y0: HY - 4, paint: function (c, V) { floorPaint(c, V, 0); } }, floorN: { y0: HY - 4, paint: function (c, V) { floorPaint(c, V, 1); } },
      fg: { y0: 0, q: 0.8, paint: function (c, V) { fgRoom(c, V, 1); } } },
    draw: function (c, E, t, p, calm, o, V) {
      var cx = V.VW / 2, grow = sm(0.0, 0.62, p), size = 8 + 150 * grow, rec = sm(0.3, 0.88, p), f = flick(t, calm, 1), sc = 2.5;
      put(c, E, 'wall', 0.12, p); put(c, E, 'wallN', 0.12, p, rec);
      lightShaft(c, V, t, calm, 0.6 * (1 - rec));
      put(c, E, 'floor', 0.5, p); put(c, E, 'floorN', 0.5, p, rec);
      // luz calida de las ventanas al reconstruirse
      [cx - 290, cx + 290].forEach(function (X, i) { glow(c, '255,170,70', X, 190, 120 * rec, 0.4 * rec * flick(t, calm, i * 2)); });
      hearthFire(c, V, t, size, calm, 1, 1);
      glow(c, '255,160,60', cx, 380, 520 * (0.3 + 0.7 * grow), 0.2 * grow * f, 0.55);
      // chispas de reconstruccion: motas doradas que suben por las paredes
      embers(c, cx, 430, V.VW * 0.8, 360, Math.round(24 * rec), t, calm, { seed: 9, speed: 0.6, col: '255,210,110', alpha: 0.7 * rec });
      marlo(c, cx - 250, 505, t, { scale: sc, anim: 'idle', lit: 0.2 + 0.8 * grow, side: 1, calm: calm, show: false });
      ashFall(c, V, t, calm, 20, 0.5 * (1 - rec));
      put(c, E, 'fg', 1.15, p); darkness(c, V, cx, 400, V.VW * (0.7 + 0.5 * grow), 0.5 - 0.35 * grow);
    }
  };

  // ---- 5. LOS AMIGOS REUNIDOS (con Carapa y Rufo) alrededor del fuego
  SC.reunidos = {
    name: 'Reunidos junto al fuego', dur: 7000, zoom: 0.05, focus: function (V) { return { x: V.VW / 2, y: 380 }; },
    layers: SC_room(1),
    draw: function (c, E, t, p, calm, o, V) {
      var cx = V.VW / 2, k = Math.min(1, V.VW / 960), f = flick(t, calm, 2), i;
      put(c, E, 'wall', 0.12, p);
      [cx - 290, cx + 290].forEach(function (X, j) { glow(c, '255,170,70', X, 190, 120, 0.35 * flick(t, calm, j * 2)); });
      put(c, E, 'floor', 0.5, p);
      hearthFire(c, V, t, 150, calm, 1, 1);
      glow(c, '255,160,60', cx, 380, 600, 0.22 * f, 0.55);
      // fila trasera (de pie) y delantera (sentados cerca del fuego). Carapa y Rufo incluidos
      var back = [['grum', -390, 'work'], ['carapa', -300, 'idle'], ['castana', -210, 'idle'], ['ulalume', 210, 'idle'], ['vesper', 300, 'idle'], ['rufo', 390, 'idle']], sp = Math.floor(p * 6) % 6;
      for (i = 0; i < back.length; i++) {
        var b = back[i], x = cx + b[1] * k, side = b[1] < 0 ? 1 : -1, an = (i === sp && p > 0.1) ? 'talk' : (p > 0.45 && (i === 0 || i === 5) ? 'happy' : (i === 1 ? 'work' : 'idle'));
        if (b[0] === 'grum') an = p > 0.5 ? 'happy' : 'idle';
        actor(c, b[0], x, 482, t, { scale: 1.95, flip: b[1] > 0, anim: an, tOff: i * 520, lit: 0.9, side: side });
      }
      actor(c, 'lanudo', cx + 135 * k, 518, t, { scale: 2.15, flip: true, anim: 'talk', lit: 1, side: -1 });
      marlo(c, cx - 140 * k, 518, t, { scale: 2.5, anim: 'idle', lit: 1, side: 1, calm: calm, show: false });
      // brasa mansa: Marlo ya no la lleva; un hilo de brasas sube del hogar
      embers(c, cx, 430, 90, 300, 12, t, calm, { seed: 5 });
      // luz de ventana/estandartes: motas doradas
      embers(c, cx, 460, V.VW * 0.9, 380, 14, t, calm, { seed: 12, speed: 0.4, col: '255,214,130', alpha: 0.5 });
      put(c, E, 'fg', 1.15, p); darkness(c, V, cx, 390, V.VW * 1.0, 0.32);
    }
  };

  // ---- 6. LA ALDEA AL AMANECER: la aldea real (drawVillage) con todas las mejoras (nivel 6), sol saliendo y Marlo junto al brasero
  function sunrise(c, w, h, p, calm, t) {
    c.save(); c.globalCompositeOperation = 'lighter';
    var g = c.createLinearGradient(0, h * 0.1, 0, h * 0.75); g.addColorStop(0, 'rgba(255,150,70,0)'); g.addColorStop(1, 'rgba(255,170,80,' + (0.16 + 0.1 * p).toFixed(3) + ')'); c.fillStyle = g; c.fillRect(0, 0, w, h);
    var sx = w * (0.74 - 0.04 * p), sy = h * (0.36 - 0.1 * p), r = h * 0.55;
    glow(c, '255,190,110', sx, sy, r, 0.5 + 0.2 * p); glow(c, '255,240,200', sx, sy, r * 0.25, 0.7);
    if (!calm) { var i; c.globalAlpha = 0.07; c.fillStyle = 'rgb(255,200,120)'; for (i = 0; i < 5; i++) { var a = 1.7 + i * 0.22 + Math.sin(t / 3000 + i) * 0.02; c.beginPath(); c.moveTo(sx, sy); c.lineTo(sx + Math.cos(a) * h * 1.4, sy + Math.sin(a) * h * 1.4); c.lineTo(sx + Math.cos(a + 0.07) * h * 1.4, sy + Math.sin(a + 0.07) * h * 1.4); c.closePath(); c.fill(); } }
    c.restore();
  }
  SC.amanecer = {
    name: 'Amanece en Rescoldo', dur: 5000, noLayers: true, fadeOut: 0,
    layers: {},
    draw: function (c, E, t, p, calm, o, V) {
      // se dibuja en el espacio de la aldea (960x540) con "cover" y un lento travelling
      var vw = V.VW, sc = Math.max(vw / 960, 1) * (1.12 - 0.12 * sm(0, 1, p)), tx = (vw - 960 * sc) / 2 + (0.5 - p) * 40, ty = (VH - 540 * sc) * (0.7 - 0.3 * p);
      c.save(); c.translate(tx, ty); c.scale(sc, sc);
      try {
        var npcs = C3.villageNpcs ? C3.villageNpcs(6, t) : true;
        A.drawVillage(c, t, { time: 0.2, light: false, vignette: false, fireflies: !calm, npcs: npcs, actors: [{ y: 432, draw: function (g) { marlo(g, 520, 432, t, { scale: 1.5, anim: 'idle', lit: 1, calm: calm, glow: 1.2 }); } }] });
        C3.villageRebuild(c, 6, t, { calm: calm, time: 0.2 });
      } catch (e) { c.fillStyle = '#3a2a30'; c.fillRect(0, 0, 960, 540); }
      c.restore();
      c.save(); c.scale(1, 1); sunrise(c, vw, VH, p, calm, t); c.restore();
    }
  };

  // ================================================================== ALDEA RECONSTRUIDA (overlay sobre drawVillage, coords 960x540)
  var FL = (function () { var r = rng(404), a = [], i; for (i = 0; i < 36; i++) { var x, y; if (i % 3 === 0) { x = 30 + r() * 900; y = 486 + r() * 20; } else if (i % 3 === 1) { x = 20 + r() * 920; y = 324 + r() * 26; } else { x = 40 + r() * 880; y = 456 + r() * 30; } a.push({ x: x, y: y, c: ['#ff7aa0', '#ffd23a', '#fff0f0', '#9ad0ff', '#ff9a3c'][i % 5], s: 0.8 + r() * 0.7, ph: r() * 6 }); } return a; })();
  var FL_N = [0, 8, 8, 20, 20, 30, 36], FL_LV = [0, 1, 1, 3, 3, 5, 6];
  function flowerLv(i) { return i < 8 ? 1 : i < 20 ? 3 : i < 30 ? 5 : 6; }
  function flowerAt(c, f, k, t, calm) {
    var sw = calm ? 0 : Math.sin(t / 900 + f.ph) * 1.2, s = f.s * k, x = f.x, y = f.y, i;
    if (s <= 0.02) return;
    c.strokeStyle = '#2f7a2a'; c.lineWidth = 1.6 * s; c.beginPath(); c.moveTo(x, y); c.lineTo(x + sw, y - 9 * s); c.stroke();
    c.fillStyle = f.c; for (i = 0; i < 5; i++) { var a = i * TAU / 5; c.beginPath(); c.arc(x + sw + Math.cos(a) * 2.6 * s, y - 9 * s + Math.sin(a) * 2.6 * s, 1.9 * s, 0, TAU); c.fill(); }
    c.fillStyle = '#ffe070'; c.beginPath(); c.arc(x + sw, y - 9 * s, 1.5 * s, 0, TAU); c.fill();
  }
  function roofTiles(c, poly, rows, col1, col2, y0, y1, ridge) {
    c.save(); c.beginPath(); c.moveTo(poly[0][0], poly[0][1]); for (var i = 1; i < poly.length; i++) c.lineTo(poly[i][0], poly[i][1]); c.closePath(); c.clip();
    c.fillStyle = col1; c.fillRect(0, y0, 960, y1 - y0);
    var j, x, rh = (y1 - y0) / rows;
    for (j = 0; j < rows; j++) { var yy = y0 + j * rh; c.fillStyle = col2; for (x = -40 + (j % 2) * 9; x < 1000; x += 18) { c.beginPath(); c.arc(x + 9, yy + rh * 0.42, 9, 0, Math.PI); c.fill(); } c.fillStyle = 'rgba(40,10,10,0.35)'; c.fillRect(0, yy + rh - 1.5, 960, 1.5); }
    c.restore();
    c.save(); c.strokeStyle = ridge; c.lineWidth = 4; c.lineCap = 'round'; c.beginPath(); c.moveTo(poly[poly.length - 2][0], poly[poly.length - 2][1]); c.lineTo(poly[poly.length - 1][0], poly[poly.length - 1][1]); c.stroke(); c.restore();
  }
  function lanternString(c, x0, y0, x1, y1, sag, n, t, calm, k, amt) {
    var i; c.save(); c.strokeStyle = 'rgba(30,14,18,' + (0.9 * k).toFixed(2) + ')'; c.lineWidth = 1.6; c.beginPath();
    for (i = 0; i <= 20; i++) { var u = i / 20, x = lerp(x0, x1, u), y = lerp(y0, y1, u) + Math.sin(u * Math.PI) * sag; if (i) c.lineTo(x, y); else c.moveTo(x, y); } c.stroke();
    for (i = 1; i <= n; i++) {
      var u2 = i / (n + 1), lx = lerp(x0, x1, u2), ly = lerp(y0, y1, u2) + Math.sin(u2 * Math.PI) * sag + (calm ? 0 : Math.sin(t / 700 + i) * 1.2), fl = calm ? 1 : 0.9 + 0.1 * Math.sin(t / 130 + i * 2);
      c.globalAlpha = k; c.fillStyle = '#2a1418'; c.fillRect(lx - 1, ly, 2, 4);
      c.fillStyle = ['#ffb347', '#ff7a4a', '#ffd870'][i % 3]; c.beginPath(); c.ellipse(lx, ly + 10, 5.5, 7, 0, 0, TAU); c.fill(); c.strokeStyle = '#2a1418'; c.lineWidth = 1.4; c.stroke();
      glow(c, '255,190,90', lx, ly + 10, 22 * k, (0.22 + 0.18 * amt) * fl);
    }
    c.restore();
  }
  function banner(c, x, y, h, t, calm, k) {
    var wv = calm ? 0 : Math.sin(t / 600 + x) * 2.4, w = 26;
    c.save(); c.globalAlpha = k; c.fillStyle = '#3a2418'; c.fillRect(x - 2, y - 8, w + 6, 4);
    c.fillStyle = '#c4301c'; c.beginPath(); c.moveTo(x, y - 4); c.lineTo(x + w, y - 4); c.lineTo(x + w + wv, y + h * 0.5); c.lineTo(x + w * 0.5 + wv * 1.4, y + h); c.lineTo(x + wv, y + h * 0.5); c.closePath(); c.fill();
    c.strokeStyle = '#1b1124'; c.lineWidth = 1.6; c.stroke();
    c.fillStyle = '#ffb04a'; c.beginPath(); c.arc(x + w / 2 + wv * 0.4, y + h * 0.34, 5.5, 0, TAU); c.fill(); c.fillStyle = '#c4301c'; c.beginPath(); c.arc(x + w / 2 + wv * 0.4, y + h * 0.37, 3, 0, TAU); c.fill();
    c.restore();
  }
  function smokeCol(c, x, y, t, n, rise, calm, a) {
    for (var i = 0; i < n; i++) { var ph = ((t / (calm ? 5200 : 3800)) + i / n) % 1, al = a * (1 - ph) * Math.min(1, ph * 5), r = 4 + ph * 11; c.fillStyle = 'rgba(224,212,214,' + al.toFixed(3) + ')'; c.beginPath(); c.arc(x + ph * 20 + Math.sin(ph * 6 + i * 2) * 3, y - ph * rise, r, 0, TAU); c.fill(); }
  }
  function emote(c, x, y, kind, t, calm, k) {
    var by = calm ? 0 : Math.sin(t / 500 + x) * 2; c.save(); c.globalAlpha = k * (0.75 + 0.25 * Math.sin(t / 900 + x));
    if (kind === 'heart') { c.fillStyle = '#ee4a64'; c.beginPath(); c.moveTo(x, y + 5 + by); c.bezierCurveTo(x - 9, y - 2 + by, x - 5, y - 9 + by, x, y - 4 + by); c.bezierCurveTo(x + 5, y - 9 + by, x + 9, y - 2 + by, x, y + 5 + by); c.fill(); c.strokeStyle = '#7a1a2a'; c.lineWidth = 1; c.stroke(); }
    else { c.fillStyle = '#ffd870'; c.beginPath(); c.ellipse(x, y + 3 + by, 3.4, 2.6, -0.4, 0, TAU); c.fill(); c.strokeStyle = '#ffd870'; c.lineWidth = 1.6; c.beginPath(); c.moveTo(x + 3, y + 2 + by); c.lineTo(x + 3, y - 7 + by); c.lineTo(x + 8, y - 5 + by); c.stroke(); }
    c.restore();
  }
  var EMO = [['castana', 'heart', 538, 352], ['vesper', 'note', 352, 348], ['grum', 'note', 108, 340], ['rufo', 'heart', 744, 436], ['ulalume', 'note', 772, 352]];
  function lv(level, n, fresh) { return level > n ? 1 : level === n ? fresh : 0; }   // cantidad (0..1) con la que aparece la mejora del nivel n

  function villageRebuild(c, level, t, o) {
    o = o || {}; level = clamp(Math.round(level || 0), 0, 6); t = t || 0;
    var calm = !!o.calm, fresh = o.fresh == null ? 1 : clamp(o.fresh, 0, 1), tm = A.villageTime ? A.villageTime(o.time == null ? 'ocaso' : o.time) : 0.5, amt = 0.3 + 0.7 * clamp(tm * 1.2, 0, 1), i, k;
    if (level <= 0) return true;
    c.save();
    // N1: tejados nuevos (herreria y tablon), veleta y primeras flores
    if ((k = lv(level, 1, fresh)) > 0) {
      c.globalAlpha = k;
      roofTiles(c, [[31, 224], [230, 224], [172, 175], [92, 175]], 4, '#b8452c', '#d8683c', 175, 224, '#ffcf70');
      roofTiles(c, [[235, 212], [365, 212], [300, 172]], 3, '#2f7a86', '#4fa0a8', 172, 212, '#ffcf70');
      c.globalAlpha = k; c.strokeStyle = '#1b1124'; c.lineWidth = 2; c.beginPath(); c.moveTo(300, 172); c.lineTo(300, 154); c.stroke();
      var wv = calm ? 0 : Math.sin(t / 900) * 0.3; c.fillStyle = '#ffb04a'; c.beginPath(); c.moveTo(300, 156); c.lineTo(316 + wv * 6, 160); c.lineTo(300, 166); c.closePath(); c.fill(); c.stroke();
      c.globalAlpha = 1;
    }
    // flores y pasto (por tandas)
    for (i = 0; i < FL.length; i++) { var fl = flowerLv(i), kk = level >= fl ? (level === fl ? fresh : 1) : 0; if (kk > 0) flowerAt(c, FL[i], kk, t, calm); }
    // N2: el brasero crece (aro de piedras, llama grande, mas luz) y la forja echa mas humo
    if (level >= 2) {
      k = lv(level, 2, fresh); var bg = (level - 1) / 5, bx = 480, by = 402;
      c.save(); c.fillStyle = '#6a5c66'; c.strokeStyle = '#1b1124'; c.lineWidth = 1.6;
      for (i = 0; i < 9; i++) { var a = i / 9 * TAU, rx = bx + Math.cos(a) * 36, ry = by + 5 + Math.sin(a) * 11; c.globalAlpha = k; c.beginPath(); c.ellipse(rx, ry, 6, 4.5, 0, 0, TAU); c.fill(); c.stroke(); }
      c.restore();
      var fs = (22 + 34 * bg) * k, ff = flick(t, calm, 3);
      glow(c, '255,150,60', bx, by - 20, (60 + 70 * bg) * k, (0.18 + 0.2 * bg) * ff * amt, 0.9);
      flame(c, bx, by - 4, fs, t, calm, 1, PAL_FIRE); if (level >= 4) flame(c, bx + 14, by - 2, fs * 0.6, t, calm, 3, PAL_FIRE);
      if (level >= 6) embers(c, bx, by - 30, 40, 150, 10, t, calm, { seed: 6, col: '255,210,110' });
      smokeCol(c, 176, 150, t + 800, 4, 70, calm, 0.3 * k);
    }
    // N3: guirnaldas de farolillos y macetas con flores en las ventanas
    if ((k = level >= 3 ? (level === 3 ? fresh : 1) : 0) > 0) {
      lanternString(c, 232, 160, 366, 188, 16, 4, t, calm, k, amt);   // forja -> tablon (por encima de la guirnalda de banderines)
      lanternString(c, 366, 186, 598, 176, 26, 6, t, calm, k, amt);
      lanternString(c, 598, 176, 668, 170, 12, 3, t, calm, k, amt);
      c.save(); c.globalAlpha = k; c.fillStyle = '#6a3a22'; c.fillRect(262, 252, 44, 7); c.fillStyle = '#2a7a32'; c.fillRect(262, 246, 44, 7);
      for (i = 0; i < 6; i++) { c.fillStyle = ['#ff7aa0', '#ffd23a', '#fff0f0'][i % 3]; c.beginPath(); c.arc(266 + i * 7.5, 246, 3, 0, TAU); c.fill(); } c.restore();
    }
    // N4: estandartes rojo-ambar (torre y plaza) + chimenea nueva con humo en el tablon
    if ((k = level >= 4 ? (level === 4 ? fresh : 1) : 0) > 0) {
      banner(c, 676, 170, 74, t, calm, k); banner(c, 750, 168, 66, t, calm, k * 0.9);
      c.save(); c.globalAlpha = k; c.fillStyle = '#7a3c2a'; c.strokeStyle = '#1b1124'; c.lineWidth = 1.6; c.fillRect(326, 156, 16, 24); c.strokeRect(326, 156, 16, 24); c.fillStyle = '#3a1c18'; c.fillRect(323, 152, 22, 6); c.restore();
      smokeCol(c, 334, 150, t, 5, 60, calm, 0.45 * k);
      c.save(); c.globalAlpha = k; c.fillStyle = '#3a2418'; c.fillRect(424, 270, 4, 70); c.restore(); banner(c, 400, 270, 52, t, calm, k);
    }
    // N5: aldeanos mas animados (emotes) + mariposas
    if ((k = level >= 5 ? (level === 5 ? fresh : 1) : 0) > 0) {
      for (i = 0; i < EMO.length; i++) { if (i % 2 === 1 && level < 6 && false) continue; emote(c, EMO[i][2] + (i % 2 ? 14 : -10), EMO[i][3] - 98, EMO[i][1], t + i * 400, calm, k); }
      if (!calm) { for (i = 0; i < 5; i++) { var bxx = 120 + i * 190 + Math.sin(t / 1300 + i * 2) * 36, byy = 400 + Math.cos(t / 1700 + i) * 22 + (i % 2) * 40, fl2 = Math.sin(t / 90 + i * 3); c.fillStyle = ['#ffd23a', '#ff9ad0', '#9ad0ff'][i % 3]; c.beginPath(); c.ellipse(bxx - 2, byy, 3, 4 * Math.abs(fl2) + 0.5, 0.4, 0, TAU); c.ellipse(bxx + 2, byy, 3, 4 * Math.abs(fl2) + 0.5, -0.4, 0, TAU); c.fill(); } }
    }
    // N6: aldea completa - remates dorados, luz calida y petalos al viento
    if ((k = level >= 6 ? fresh : 0) > 0) {
      c.save(); c.globalAlpha = k; c.strokeStyle = '#ffcf70'; c.lineWidth = 3; c.lineCap = 'round';
      c.beginPath(); c.moveTo(660, 120); c.lineTo(716, 110); c.lineTo(772, 120); c.stroke();
      c.fillStyle = '#ffcf70'; c.beginPath(); c.moveTo(716, 110); c.lineTo(716, 96); c.lineTo(728, 100); c.lineTo(716, 104); c.closePath(); c.fill();
      c.restore();
      glow(c, '255,190,100', 480, 330, 360 * k, 0.1 * amt, 0.6);
      c.save(); c.globalAlpha = 0.8 * k; for (i = 0; i < 14; i++) { var u = ((t / (calm ? 14000 : 9000)) + i / 14) % 1, px = u * 1000 - 20 + Math.sin(u * 9 + i) * 24, py = 120 + ((i * 53) % 330) + u * 40 + Math.sin(u * 7 + i * 2) * 14; c.fillStyle = i % 2 ? '#ffb0c8' : '#ffd0a0'; c.save(); c.translate(px, py); c.rotate(u * 8 + i); c.beginPath(); c.ellipse(0, 0, 3.2, 1.8, 0, 0, TAU); c.fill(); c.restore(); } c.restore();
    }
    c.restore();
    return true;
  }
  // animaciones de aldeanos por nivel: devuelve un mapa {nombre:{anim}} para pasar como opts.npcs de drawVillage (fusionar con el tuyo)
  function villageNpcs(level, t) {
    level = clamp(Math.round(level || 0), 0, 6); t = t || 0; var m = {}, i;
    if (level <= 0) return m;
    var names = ['grum', 'castana', 'vesper', 'rufo', 'ulalume', 'lanudo'], from = [2, 2, 3, 4, 5, 5];
    for (i = 0; i < names.length; i++) {
      if (level < from[i]) continue;
      var cyc = ((t / 1000) + i * 2.3) % 8, an = 'idle';
      if (names[i] === 'grum') an = 'work'; else if (names[i] === 'castana') an = cyc < 5 ? 'work' : 'idle'; else if (cyc < 3) an = 'talk'; else if (level >= 6 && cyc < 5) an = 'happy';
      m[names[i]] = { anim: an };
    }
    return m;
  }

  // ================================================================== CREDITOS
  // logo del estudio: una X de brasa (dos hojas cruzadas) con llama en la punta + "XITAKHA STUDIO"
  function xitakhaLogo(c, cx, cy, w, t, calm, p) {
    var s = w / 420, b = calm ? 0.85 : 0.8 + 0.2 * Math.sin(t / 420), a = clamp(p == null ? 1 : p, 0, 1);
    c.save(); c.globalAlpha = a; c.translate(cx, cy); c.scale(s, s);
    glow(c, '255,150,60', 0, -40, 130, 0.4 * b);
    c.lineCap = 'round'; c.lineJoin = 'round';
    var g = c.createLinearGradient(0, -110, 0, 30); g.addColorStop(0, '#ffd27a'); g.addColorStop(0.55, '#ff8a24'); g.addColorStop(1, '#b8321c');
    c.strokeStyle = OL; c.lineWidth = 36; c.beginPath(); c.moveTo(-58, -100); c.lineTo(58, 20); c.moveTo(58, -100); c.lineTo(-58, 20); c.stroke();
    c.strokeStyle = g; c.lineWidth = 24; c.beginPath(); c.moveTo(-58, -100); c.lineTo(58, 20); c.moveTo(58, -100); c.lineTo(-58, 20); c.stroke();
    c.strokeStyle = 'rgba(255,246,210,0.65)'; c.lineWidth = 5; c.beginPath(); c.moveTo(-50, -92); c.lineTo(-6, -46); c.moveTo(50, -92); c.lineTo(6, -46); c.stroke();
    flame(c, 0, -34, 40 * (0.9 + 0.1 * b), t, calm, 1);
    c.fillStyle = OL; c.fillRect(-190, 52, 380, 3);
    c.font = 'bold 54px ' + FONT; c.textAlign = 'center'; c.textBaseline = 'middle'; c.lineJoin = 'round';
    if (c.letterSpacing !== undefined) c.letterSpacing = '8px';
    c.lineWidth = 9; c.strokeStyle = OL; c.strokeText('XITAKHA', 4, 94); c.fillStyle = '#ffe3a0'; c.fillText('XITAKHA', 4, 94);
    c.font = 'bold 22px ' + FONT; if (c.letterSpacing !== undefined) c.letterSpacing = '16px'; c.lineWidth = 6; c.strokeText('STUDIO', 8, 138); c.fillStyle = '#ff9a3c'; c.fillText('STUDIO', 8, 138);
    if (c.letterSpacing !== undefined) c.letterSpacing = '0px';
    c.restore();
  }
  var CRED_DUR = 25000;
  // bloques: [tipo, texto, texto2, alto]; alto en unidades virtuales (540). Se colocan en secuencia: no se solapan por construccion
  var CRED = [
    ['logo', '', '', 270], ['small', 'presenta', '', 44], ['title', '', '', 190], ['gap', '', '', 36],
    ['head', 'EL MANDAMAS', '', 38], ['name', 'Don Cetro Mandón', '', 40], ['joke', 'convoca reuniones que podían ser un mensaje', '', 40], ['gap', '', '', 26],
    ['head', 'REGLAS Y CARTAS', '', 38], ['name', 'Dulcinea Reglasdetres', '', 40], ['joke', 'inventó la brasa mansa un martes', '', 40], ['gap', '', '', 26],
    ['head', 'PROGRAMACIÓN', '', 38], ['name', 'Bugo Parches', '', 40], ['joke', 'arregla lo que él mismo rompió (con cariño)', '', 40], ['gap', '', '', 26],
    ['head', 'HERRAMIENTAS Y FORJA', '', 38], ['name', 'Tuerca Martillazo', '', 40], ['joke', 'forja utilidades; el yunque nunca la perdona', '', 40], ['gap', '', '', 26],
    ['head', 'ARTE', '', 38], ['name', 'Pixela Pincelloco', '', 40], ['joke', 'lo dibuja todo con código y sin un solo pincel', '', 40], ['gap', '', '', 26],
    ['head', 'MÚSICA Y SONIDO', '', 38], ['name', 'Sonia Pitidos', '', 40], ['joke', 'sintetiza hasta el crepitar de una brasa', '', 40], ['gap', '', '', 26],
    ['head', 'PRUEBAS', '', 38], ['name', 'Pepe Rompetodo', '', 40], ['joke', 'encontró la misma pared invisible tres veces', '', 40], ['gap', '', '', 26],
    ['head', 'MERCADO Y OLFATO', '', 38], ['name', 'Marta Encuestas y Rastro Buscatesoros', '', 40], ['joke', 'ella pregunta a todos; él huele recursos a tres reinos', '', 40], ['gap', '', '', 26],
    ['head', 'EL DUEÑO DEL ESTUDIO', '', 38], ['name', 'Nuestro jefe supremo', '', 40], ['joke', 'por no despedirnos tras el tercer bug', '', 40], ['gap', '', '', 30],
    ['head', 'GRACIAS ESPECIALES', '', 38], ['name', 'Lanudo, por contar el cuento (otra vez)', '', 40], ['joke', 'Grum, Carapa, Vesper, Ulalume, Castaña y Rufo', '', 34], ['joke', 'por guardarnos un sitio junto al fuego', '', 40], ['gap', '', '', 40],
    ['final', 'Y a ti, Marlo,', 'que apagaste las seis llamas.', 74], ['gap', '', '', 12], ['big', 'GRACIAS POR JUGAR', '', 64]
  ];
  var CRED_FIX = { 'inventó la brasa mansa un martes': 'inventó la brasa mansa un martes' };
  function fitText(c, txt, maxW, size, weight) {
    c.font = (weight || 'bold') + ' ' + size + 'px ' + FONT; var w = c.measureText(txt).width; if (w > maxW) { size = Math.max(11, Math.floor(size * maxW / w)); c.font = (weight || 'bold') + ' ' + size + 'px ' + FONT; } return size;
  }
  function credText(c, txt, x, y, size, fill, maxW, bold, a) {
    if (!txt) return; c.save(); c.globalAlpha *= a; size = fitText(c, txt, maxW, size, bold === false ? 'normal' : 'bold'); c.textAlign = 'center'; c.textBaseline = 'middle'; c.lineJoin = 'round';
    c.lineWidth = Math.max(3, size * 0.24); c.strokeStyle = 'rgba(8,3,12,0.95)'; c.strokeText(txt, x, y); c.fillStyle = fill; c.fillText(txt, x, y); c.restore();
  }
  var CBG = {};
  function credBg(w, h, lite) {   // fondo cacheado a media resolucion: amanecer con la aldea reconstruida en silueta
    var key = w + 'x' + h + (lite ? 'l' : ''); if (CBG[key]) return CBG[key];
    CBG = {}; var q = lite ? 0.35 : 0.5, c = mk(w * q, h * q), g = c.getContext('2d'), s = h / VH * q, VW = w / h * VH, i, r = rng(77);
    g.scale(s, s); var sky = g.createLinearGradient(0, 0, 0, VH); sky.addColorStop(0, '#171540'); sky.addColorStop(0.42, '#5a3060'); sky.addColorStop(0.7, '#c0585a'); sky.addColorStop(0.86, '#ffb468'); sky.addColorStop(1, '#ffd890'); g.fillStyle = sky; g.fillRect(0, 0, VW, VH);
    for (i = 0; i < 70; i++) { g.fillStyle = 'rgba(255,240,220,' + (0.1 + r() * 0.5).toFixed(2) + ')'; g.fillRect(r() * VW, r() * 250, 1.6, 1.6); }
    var V = { VW: VW, pad: 0 };
    ridge(g, V, 430, 50, '#5a3050', 12, 0.006); ridge(g, V, 470, 36, '#2e1a34', 23, 0.009);
    var x; g.fillStyle = '#1a0e22';
    for (x = 20; x < VW; x += 70 + r() * 40) { var hw = 44 + r() * 30, hh = 36 + r() * 26; g.fillRect(x, 500 - hh, hw, hh); g.beginPath(); g.moveTo(x - 6, 500 - hh); g.lineTo(x + hw / 2, 500 - hh - hw * 0.45); g.lineTo(x + hw + 6, 500 - hh); g.closePath(); g.fill(); g.fillStyle = 'rgba(255,190,90,0.9)'; g.fillRect(x + hw * 0.25, 500 - hh * 0.6, 7, 9); g.fillRect(x + hw * 0.6, 500 - hh * 0.6, 7, 9); g.fillStyle = '#1a0e22'; }
    g.fillRect(0, 500, VW, 40); CBG[key] = c; return c;
  }
  function credits(c, w, h, t, o) {
    o = o || {}; var dur = o.dur || CRED_DUR, p = o.p != null ? clamp(o.p, 0, 1) : clamp(t / dur, 0, 1), calm = !!o.calm, s = h / VH, VW = w / s, i, cx = VW / 2;
    c.save(); c.beginPath(); c.rect(0, 0, w, h); c.clip();
    if (o.bg !== false) {
      c.imageSmoothingEnabled = true; c.drawImage(credBg(w, h, o.lite), 0, 0, w, h);
      c.save(); c.scale(s, s);
      var sp = 0.5 + 0.5 * sm(0, 0.8, p); glow(c, '255,200,120', VW * 0.5, 470 - 40 * sp, 300, 0.45 * sp); glow(c, '255,244,214', VW * 0.5, 470 - 40 * sp, 60, 0.6 * sp);
      if (!calm || !o.lite) embers(c, VW / 2, 500, VW * 0.9, 300, o.lite ? 8 : 16, t, calm, { seed: 4, speed: 0.5, alpha: 0.6 });
      c.restore();
      c.fillStyle = 'rgba(6,3,12,0.16)'; c.fillRect(0, 0, w, h);
    }
    c.save(); c.scale(s, s);
    // columna de texto: placa suave detras para legibilidad
    var colW = Math.min(VW * 0.9, 640), pg = c.createLinearGradient(cx - colW / 2 - 60, 0, cx + colW / 2 + 60, 0); pg.addColorStop(0, 'rgba(8,3,14,0)'); pg.addColorStop(0.18, 'rgba(8,3,14,0.5)'); pg.addColorStop(0.82, 'rgba(8,3,14,0.5)'); pg.addColorStop(1, 'rgba(8,3,14,0)');
    c.fillStyle = pg; c.fillRect(cx - colW / 2 - 60, 0, colW + 120, VH);
    var tot = 0, ys = []; for (i = 0; i < CRED.length; i++) { ys.push(tot); tot += CRED[i][3]; }
    var last = CRED.length - 1, lastC = ys[last] + CRED[last][3] / 2, hold = 0.88, u = clamp(p / hold, 0, 1), e = u;   // scroll lineal hasta centrar el cierre; el ultimo 12 % se queda quieto
    var top0 = VH - 130, top1 = VH * 0.5 - lastC - 22, top = lerp(top0, top1, e);
    for (i = 0; i < CRED.length; i++) {
      var b = CRED[i], yc = top + ys[i] + b[3] / 2, kind = b[0];
      if (yc < -120 || yc > VH + 120 || kind === 'gap') continue;
      var edge = clamp(Math.min(yc - 6, VH - yc - 6) / 70, 0, 1), ae = i === last || i === last - 2 ? clamp((VH - yc) / 70, 0, 1) : edge;
      if (kind === 'logo') { c.save(); c.globalAlpha = ae; xitakhaLogo(c, cx, yc - 22, Math.min(colW * 0.7, 380), t, calm, 1); c.restore(); }
      else if (kind === 'title') { c.save(); c.globalAlpha = ae; var lg = A.cine && A.cine.logo; if (lg) { lg(c, cx, yc + 6, Math.min(colW * 0.7, 380), t, { p: 1, sub: false, calm: calm }); } else credText(c, 'SWARM HAND', cx, yc, 44, '#ffd27a', colW, true, 1); c.restore(); }
      else if (kind === 'small') credText(c, b[1], cx, yc, 17, '#d8c4e8', colW, false, ae);
      else if (kind === 'head') credText(c, b[1], cx, yc, 20, '#ffb04a', colW, true, ae);
      else if (kind === 'name') credText(c, b[1], cx, yc, 30, '#fff2dc', colW, true, ae);
      else if (kind === 'joke') credText(c, b[1], cx, yc, 17, '#cdbbe0', colW, false, ae);
      else if (kind === 'final') { credText(c, b[1], cx, yc - 16, 28, '#fff2dc', colW, true, ae); credText(c, b[2], cx, yc + 16, 28, '#fff2dc', colW, true, ae); }
      else if (kind === 'big') credText(c, b[1], cx, yc, 40, '#ffd27a', colW, true, ae);
    }
    c.restore();
    // vineta suave y fundidos
    vignette(c, w, h, 0.7); c.restore();
    fade(c, w, h, 1 - sm(0, 0.05, p)); fade(c, w, h, sm(0.96, 1, p) * (o.fadeOut == null ? 1 : o.fadeOut));
    return true;
  }

  // ================================================================== API publica
  var list = [], ORDER = ['victoria', 'apagado', 'brasa', 'renace', 'reunidos', 'amanecer'], k;
  SC.brasa.fadeOut = 0;
  var DUR = { victoria: 6000, apagado: 5000, brasa: 7000, renace: 6000, reunidos: 7000, amanecer: 5000 };
  for (k = 0; k < ORDER.length; k++) { SC[ORDER[k]].dur = DUR[ORDER[k]]; list.push({ id: ORDER[k], name: SC[ORDER[k]].name, dur: DUR[ORDER[k]] }); }
  var C3 = A.cine3 = {
    list: list, ids: ORDER.slice(),
    dur: function (id) { return id === 'credits' ? CRED_DUR : (SC[id] ? SC[id].dur : 0); },
    total: (function () { var s = 0, i; for (i = 0; i < ORDER.length; i++) s += DUR[ORDER[i]]; return s; })(),
    creditsDur: CRED_DUR,
    // vineta `id` a pantalla completa (0,0,w,h). t = ms desde el inicio de la vineta. opts: {p, calm, lite, vignette, vig, bars, fade}
    epilogue: function (id, ctx, w, h, t, opts) { try { return runScene(id, ctx, w, h, t || 0, opts); } catch (e) { if (window.console) console.warn('assets_cine3.epilogue', id, e); try { ctx.restore(); } catch (x) { /* */ } return false; } },
    preload: function (id, w, h, opts) { try { var S = SC[id]; if (S) { layers(id, w, h, opts || {}, S.layers); return true; } } catch (e) { /* */ } return false; },
    credits: function (ctx, w, h, t, opts) { try { return credits(ctx, w, h, t || 0, opts); } catch (e) { if (window.console) console.warn('assets_cine3.credits', e); try { ctx.restore(); } catch (x) { /* */ } return false; } },
    logo: function (ctx, cx, cy, w, t, opts) { opts = opts || {}; try { xitakhaLogo(ctx, cx, cy, w, t || 0, !!opts.calm, opts.p); return true; } catch (e) { return false; } },
    villageRebuild: function (ctx, level, t, opts) { try { ctx.save(); var r = villageRebuild(ctx, level, t, opts); ctx.restore(); return r; } catch (e) { if (window.console) console.warn('assets_cine3.villageRebuild', e); try { ctx.restore(); } catch (x) { /* */ } return false; } },
    villageNpcs: function (level, t) { try { return villageNpcs(level, t); } catch (e) { return {}; } },
    maxLevel: 6,
    free: function () { CACHE.length = 0; GR = {}; GRN = 0; CBG = {}; }
  };
  C3.villageRebuildLevels = ['Rescoldo (sin jefes)', 'Pastor: tejados nuevos y flores', 'Karceron: brasero que crece', 'Letea: farolillos y macetas', 'Yarlak: estandartes y chimenea', 'Melaria: aldeanos animados', 'Cenizar: aldea completa'];
})();
