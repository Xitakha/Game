/*!
 * assets_cine.js - Arte de la INTRO y la PANTALLA DE TITULO (DESIGN-v9-cinematicas.md). Cuento junto al fuego pero OSCURO: paleta calida y baja de luz,
 * sombras profundas, brasas, bordes casi negros. Todo procedural (canvas 2D), sin librerias. Fondos en CAPAS cacheadas en offscreen (parallax) y
 * luces/fuego/brasas/personajes dibujados en vivo (baratos). Cache LRU de 2 escenas + titulo; Assets.cine.free() la vacia. Contrato: ASSETS_API.md
 * ("Cinematicas v9 - intro y titulo"). Cargar DESPUES de assets.js y assets_village.js. Seguro: nunca lanza (try/catch) y no toca G ni el DOM.
 */
(function () {
  'use strict';
  var A = window.Assets;
  if (!A) { if (window.console) console.warn('assets_cine: falta Assets'); return; }
  var TAU = Math.PI * 2, VH = 540, OL = '#0c0710';
  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  function sm(a, b, v) { var u = clamp((v - a) / (b - a), 0, 1); return u * u * (3 - 2 * u); }
  function lerp(a, b, u) { return a + (b - a) * u; }
  function mk(w, h) { var c = document.createElement('canvas'); c.width = Math.max(1, Math.ceil(w)); c.height = Math.max(1, Math.ceil(h)); return c; }
  function rng(seed) { var s = seed >>> 0; return function () { s = (s + 0x6D2B79F5) >>> 0; var t = s; t = Math.imul(t ^ t >>> 15, t | 1); t ^= t + Math.imul(t ^ t >>> 7, t | 61); return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }

  // ------------------------------------------------------------------ brillos (sprite de resplandor cacheado por color) y luz
  var GL = {};
  function glowImg(col) {
    if (GL[col]) return GL[col];
    var c = mk(128, 128), g = c.getContext('2d'), r = g.createRadialGradient(64, 64, 0, 64, 64, 64);
    r.addColorStop(0, 'rgba(' + col + ',1)'); r.addColorStop(0.3, 'rgba(' + col + ',0.5)'); r.addColorStop(0.65, 'rgba(' + col + ',0.14)'); r.addColorStop(1, 'rgba(' + col + ',0)');
    g.fillStyle = r; g.fillRect(0, 0, 128, 128); return (GL[col] = c);
  }
  function glow(c, col, x, y, r, a, sy) {
    if (a <= 0.002) return; var pg = c.globalAlpha, po = c.globalCompositeOperation;
    c.globalCompositeOperation = 'lighter'; c.globalAlpha = a > 1 ? 1 : a; c.drawImage(glowImg(col), x - r, y - r * (sy || 1), 2 * r, 2 * r * (sy || 1));
    c.globalCompositeOperation = po; c.globalAlpha = pg;
  }
  // parpadeo de llama: 0..1 alrededor de 1; calm lo reduce a un latido lento
  function flick(t, calm, ph) {
    ph = ph || 0;
    if (calm) return 0.93 + 0.07 * Math.sin(t / 900 + ph);
    return 0.86 + 0.08 * Math.sin(t / 97 + ph) + 0.06 * Math.sin(t / 53 + ph * 2.3) + 0.04 * Math.sin(t / 31 + ph * 5);
  }

  // ------------------------------------------------------------------ primitivas de paisaje (para capas)
  function skyGrad(c, x0, w, stops) {
    var g = c.createLinearGradient(0, 0, 0, VH), i; for (i = 0; i < stops.length; i += 2) g.addColorStop(stops[i], stops[i + 1]);
    c.fillStyle = g; c.fillRect(x0, 0, w, VH);
  }
  function stars(c, x0, w, n, seed, ymax, big) {
    var r = rng(seed), i, x, y, a;
    for (i = 0; i < n; i++) {
      x = x0 + r() * w; y = r() * ymax; a = 0.15 + r() * 0.5;
      c.fillStyle = 'rgba(255,230,200,' + a.toFixed(2) + ')'; c.fillRect(x, y, big && r() < 0.15 ? 2.4 : 1.4, big && r() < 0.15 ? 2.4 : 1.4);
    }
  }
  function ridge(c, x0, x1, base, amp, col, seed, freq, bottom) {
    var r = rng(seed), p1 = r() * 6, p2 = r() * 6, p3 = r() * 6, x;
    c.fillStyle = col; c.beginPath(); c.moveTo(x0, bottom || VH);
    for (x = x0; x <= x1; x += 8) c.lineTo(x, base - amp * (0.55 * Math.sin(x * freq + p1) + 0.3 * Math.sin(x * freq * 2.3 + p2) + 0.15 * Math.sin(x * freq * 5.1 + p3)));
    c.lineTo(x1, bottom || VH); c.closePath(); c.fill();
  }
  function pine(c, x, y, h, col) {
    var w = h * 0.34, i; c.fillStyle = col;
    for (i = 0; i < 4; i++) { var yy = y - h * (0.18 + i * 0.22), ww = w * (1 - i * 0.2); c.beginPath(); c.moveTo(x - ww, yy); c.lineTo(x, yy - h * 0.34); c.lineTo(x + ww, yy); c.closePath(); c.fill(); }
    c.fillRect(x - 3, y - h * 0.18, 6, h * 0.18);
  }
  function houseSil(c, x, y, w, h, col, winCol, o) {
    o = o || {};
    c.fillStyle = col; c.fillRect(x - w / 2, y - h, w, h);
    c.beginPath(); if (o.burnt) { c.moveTo(x - w / 2 - 8, y - h); c.lineTo(x - w * 0.1, y - h - h * 0.55); c.lineTo(x + w * 0.02, y - h - h * 0.3); c.lineTo(x + w * 0.2, y - h - h * 0.12); c.lineTo(x + w / 2 + 8, y - h); }
    else { c.moveTo(x - w / 2 - 8, y - h); c.lineTo(x, y - h - h * 0.6); c.lineTo(x + w / 2 + 8, y - h); }
    c.closePath(); c.fill();
    if (winCol) { c.fillStyle = winCol; c.fillRect(x - w * 0.3, y - h * 0.62, w * 0.2, h * 0.26); if (!o.one) c.fillRect(x + w * 0.1, y - h * 0.62, w * 0.2, h * 0.26); }
  }
  // figura-silueta (personajes del Hogar): tipo = grum|castana|vesper|ulalume|pastor
  function figSil(c, x, y, s, type, col) {
    c.fillStyle = col; c.beginPath(); c.ellipse(x, y - 24 * s, 17 * s * (type === 'grum' ? 1.25 : 1), 26 * s, 0, 0, TAU); c.fill();
    c.beginPath(); c.arc(x, y - 58 * s, 11 * s, 0, TAU); c.fill();
    if (type === 'castana') { c.fillRect(x - 11 * s, y - 76 * s, 22 * s, 9 * s); }
    else if (type === 'vesper') { c.beginPath(); c.moveTo(x - 10 * s, y - 64 * s); c.lineTo(x - 7 * s, y - 84 * s); c.lineTo(x - 1 * s, y - 67 * s); c.lineTo(x + 3 * s, y - 84 * s); c.lineTo(x + 10 * s, y - 64 * s); c.closePath(); c.fill(); }
    else if (type === 'ulalume') { c.beginPath(); c.moveTo(x - 14 * s, y - 62 * s); c.lineTo(x, y - 86 * s); c.lineTo(x + 14 * s, y - 62 * s); c.closePath(); c.fill(); }
    else if (type === 'grum') { c.beginPath(); c.arc(x - 9 * s, y - 68 * s, 5 * s, 0, TAU); c.arc(x + 9 * s, y - 68 * s, 5 * s, 0, TAU); c.fill(); }
  }

  // ------------------------------------------------------------------ siluetas de los cinco rescoldos (jefes) - c en coords locales, (x,y)=pies, s=escala
  function bossSil(c, id, x, y, s, col, lit, t, calm) {
    c.save(); c.translate(x, y); c.scale(s, s); c.fillStyle = col; c.strokeStyle = col; c.lineCap = 'round';
    var b = calm ? 0 : Math.sin(t / 700) * 2;
    if (id === 'pastor') {
      c.beginPath(); c.moveTo(-34, 0); c.quadraticCurveTo(-40, -90, -16, -140); c.lineTo(16, -140); c.quadraticCurveTo(40, -90, 34, 0); c.closePath(); c.fill();
      c.beginPath(); c.arc(0, -156 + b, 22, 0, TAU); c.fill(); c.beginPath(); c.moveTo(-26, -150); c.lineTo(0, -196 + b); c.lineTo(26, -150); c.closePath(); c.fill();
      c.lineWidth = 6; c.beginPath(); c.moveTo(58, 0); c.lineTo(58, -190); c.stroke(); c.lineWidth = 6; c.beginPath(); c.arc(70, -196, 16, Math.PI * 0.9, Math.PI * 2.1); c.stroke();
      c.lineWidth = 12; c.beginPath(); c.moveTo(30, -110); c.lineTo(56, -120); c.stroke();
      if (lit) { c.fillStyle = lit; c.fillRect(-9, -160 + b, 6, 4); c.fillRect(4, -160 + b, 6, 4); }
    } else if (id === 'karceron') {
      c.fillRect(-52, -110, 104, 100); c.fillRect(-40, -10, 30, 10); c.fillRect(10, -10, 30, 10);
      c.beginPath(); c.moveTo(-34, -110); c.lineTo(-30, -160); c.lineTo(0, -178 + b); c.lineTo(30, -160); c.lineTo(34, -110); c.closePath(); c.fill();
      c.fillRect(-78, -118, 34, 22); c.fillRect(44, -118, 34, 22); c.fillRect(-84, -100, 22, 70); c.fillRect(62, -100, 22, 70);
      c.lineWidth = 3; c.beginPath(); c.moveTo(-84, -40); c.quadraticCurveTo(-110, -10, -96, 0); c.moveTo(84, -40); c.quadraticCurveTo(112, -8, 98, 0); c.stroke();
      if (lit) { c.fillStyle = lit; c.fillRect(-18, -150 + b, 36, 5); c.globalAlpha = 0.6; c.fillRect(-60, -4, 120, 4); c.globalAlpha = 1; }
    } else if (id === 'letea') {
      c.beginPath(); c.ellipse(0, -18, 62, 22, 0, 0, TAU); c.fill(); c.lineWidth = 15;
      var k, hx = [-48, 0, 48], hy = [-120, -160, -118];
      for (k = 0; k < 3; k++) { c.beginPath(); c.moveTo(hx[k] * 0.5, -22); c.bezierCurveTo(hx[k] * 1.5, -40, hx[k] * 0.4 + (k - 1) * 20, hy[k] + 50, hx[k], hy[k] + b * (k % 2 ? -1 : 1)); c.stroke(); c.beginPath(); c.ellipse(hx[k] + 4, hy[k] + b * (k % 2 ? -1 : 1), 15, 9, 0.3, 0, TAU); c.fill(); }
      if (lit) { c.fillStyle = lit; for (k = 0; k < 3; k++) c.fillRect(hx[k] + 6, hy[k] - 3 + b * (k % 2 ? -1 : 1), 5, 3); }
    } else if (id === 'yarlak') {
      c.beginPath(); c.moveTo(-70, 0); c.bezierCurveTo(-96, -100, -60, -170, -20, -176); c.lineTo(34, -170); c.bezierCurveTo(80, -150, 94, -80, 72, 0); c.closePath(); c.fill();
      c.beginPath(); c.arc(-6, -186 + b, 26, 0, TAU); c.fill(); c.lineWidth = 8; c.beginPath(); c.moveTo(-26, -196); c.quadraticCurveTo(-52, -214, -46, -240); c.moveTo(14, -198); c.quadraticCurveTo(40, -216, 34, -242); c.stroke();
      c.fillRect(-100, -120, 28, 100); c.fillRect(72, -112, 28, 100);
      if (lit) { c.fillStyle = lit; c.fillRect(-16, -190 + b, 8, 4); c.fillRect(4, -190 + b, 8, 4); }
    } else if (id === 'melaria') {
      c.beginPath(); c.ellipse(0, -52, 34, 52, 0, 0, TAU); c.fill(); c.beginPath(); c.ellipse(0, -128 + b, 22, 24, 0, 0, TAU); c.fill();
      c.beginPath(); c.moveTo(-22, -140); c.lineTo(-16, -166); c.lineTo(-6, -150); c.lineTo(0, -172); c.lineTo(6, -150); c.lineTo(16, -166); c.lineTo(22, -140); c.closePath(); c.fill();
      c.beginPath(); c.ellipse(-62, -108, 46, 20, -0.5, 0, TAU); c.ellipse(62, -108, 46, 20, 0.5, 0, TAU); c.fill();
      c.beginPath(); c.moveTo(-14, -2); c.lineTo(-30, 12); c.moveTo(14, -2); c.lineTo(30, 12); c.lineWidth = 4; c.stroke();
      if (lit) { c.fillStyle = lit; c.fillRect(-12, -130 + b, 6, 4); c.fillRect(6, -130 + b, 6, 4); }
    }
    c.restore();
  }

  // ------------------------------------------------------------------ fuego, brasas, humo (en vivo)
  function flame(c, x, y, sz, t, calm, ph) {
    var f = flick(t, calm, ph || 0), sway = calm ? 0.4 : Math.sin(t / 160 + (ph || 0)) * 3, h = sz * f, i,
      cols = ['#5a1408', '#c4380f', '#ff8a24', '#ffd060', '#fff2c0'], sc = [1, 0.82, 0.6, 0.4, 0.2];
    c.save(); c.translate(x, y);
    for (i = 0; i < cols.length; i++) {
      var w = sz * 0.34 * sc[i], hh = h * (0.62 + 0.38 * sc[i]) * (i === 0 ? 1.05 : 1), sw = sway * (1 - sc[i] * 0.4);
      c.fillStyle = cols[i]; c.beginPath(); c.moveTo(-w, 0);
      c.bezierCurveTo(-w * 1.25, -hh * 0.4, -w * 0.4 + sw * 0.4, -hh * 0.7, sw, -hh);
      c.bezierCurveTo(w * 0.4 + sw * 0.4, -hh * 0.65, w * 1.25, -hh * 0.4, w, 0); c.closePath(); c.fill();
    }
    c.restore();
  }
  // brasas deterministas ascendentes: n particulas, (x,y) origen, ancho de dispersion, altura, color rgb
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
  function smoke(c, x, y, rise, n, t, col, a0, calm) {
    var i, u, k;
    for (i = 0; i < n; i++) {
      k = (i * 0.7548776) % 1; u = ((t / 1000) * (calm ? 0.05 : 0.08) + k) % 1;
      glow(c, col, x + Math.sin(u * 5 + i) * 14 * u + (u * 24), y - u * rise, 14 + u * 40, a0 * (1 - u) * Math.min(1, u * 8));
    }
  }

  // ------------------------------------------------------------------ sprites reales de Marlo y Lanudo/NPC con "grado" oscuro y luz de fogata (cacheados por fotograma)
  var GR = {}, GRN = 0;
  function graded(src, side, k) {
    var id = src._cid || (src._cid = ++GRN), key = id + '|' + side + '|' + Math.round(k * 10);
    if (GR[key]) return GR[key];
    var c = mk(src.width, src.height), g = c.getContext('2d'), w = c.width, h = c.height;
    g.drawImage(src, 0, 0); g.globalCompositeOperation = 'source-atop'; g.fillStyle = 'rgba(' + Math.round(34 - 12 * k) + ',20,52,' + (0.52 - 0.14 * k).toFixed(2) + ')'; g.fillRect(0, 0, w, h);
    g.globalCompositeOperation = 'source-atop';
    var gr = g.createLinearGradient(side > 0 ? w : 0, 0, side > 0 ? 0 : w, 0);   // side>0: luz a la derecha
    gr.addColorStop(0, 'rgba(255,150,60,' + (0.42 * k).toFixed(2) + ')'); gr.addColorStop(0.55, 'rgba(120,50,30,0.06)'); gr.addColorStop(1, 'rgba(6,3,14,0.55)');
    g.fillStyle = gr; g.fillRect(0, 0, w, h);
    var gv = g.createLinearGradient(0, 0, 0, h); gv.addColorStop(0, 'rgba(0,0,0,0)'); gv.addColorStop(1, 'rgba(8,3,10,0.28)'); g.fillStyle = gv; g.fillRect(0, 0, w, h);
    GR[key] = c; if (GRN > 400) { GR = {}; GRN = 0; }
    return c;
  }
  // actor generico: name npc ('lanudo','grum',...) o 'marlo'; (x,y)=pies
  function actor(c, name, x, y, t, o) {
    o = o || {}; var sc = o.scale || 2, flip = !!o.flip, fr, w, h, k = o.lit == null ? 1 : o.lit, side = o.side == null ? (flip ? -1 : 1) : o.side;
    try {
      if (name === 'marlo') fr = A.animFrame('player', o.anim || 'idle', t); else fr = A.animFrame('npc_' + name, o.anim || 'idle', t + (o.tOff || 0));
    } catch (e) { fr = null; }
    c.save(); c.globalAlpha = (o.alpha == null ? 1 : o.alpha);
    c.fillStyle = 'rgba(4,2,8,0.5)'; c.beginPath(); c.ellipse(x, y - 1, 26 * sc * 0.9, 6 * sc * 0.8, 0, 0, TAU); c.fill();
    if (fr) {
      w = fr.width * sc; h = fr.height * sc;
      var anc = name === 'marlo' ? { x: 24 * sc, y: 42 * sc } : { x: 40 * sc, y: 80 * sc };
      c.translate(x, y); if (o.tilt) c.rotate(o.tilt); if (flip) c.scale(-1, 1);
      c.imageSmoothingEnabled = true; c.drawImage(graded(fr, flip ? -side : side, k), -anc.x, -anc.y, w, h);
    } else { c.fillStyle = '#1a1020'; c.beginPath(); c.ellipse(x, y - 30 * sc, 14 * sc, 28 * sc, 0, 0, TAU); c.fill(); }
    c.restore();
  }

  // ------------------------------------------------------------------ Marlo: poses 'idle'|'walk'|'look'|'scarf' (sprite real + halo de la brasa mansa en la bufanda)
  function marlo(c, pose, x, y, t, o) {
    o = o || {}; var sc = o.scale || 2.4, calm = !!o.calm; pose = pose || 'idle';
    var anim = pose === 'walk' ? 'walk' : 'idle', tilt = pose === 'look' ? -0.1 + Math.sin(t / 900) * 0.02 : 0, flip = !!o.flip;
    actor(c, 'marlo', x, y, t, { scale: sc, flip: flip, anim: anim, tilt: tilt, lit: o.lit, side: o.side, alpha: o.alpha });
    var beat = pose === 'scarf' ? heart(t, calm) : (0.55 + 0.25 * heart(t, calm)), nx = x + (flip ? 1 : -1) * 1 * sc, ny = y - 12 * sc;
    glow(c, '255,176,70', nx, ny, 9 * sc * (0.8 + 0.4 * beat), 0.55 * beat);
    glow(c, '255,230,150', nx, ny, 3 * sc, 0.5 * beat);
  }
  function heart(t, calm) { if (calm) return 0.6 + 0.4 * Math.sin(t / 700) * 0.5 + 0.2; var u = (t % 1400) / 1400; return clamp(Math.max(Math.exp(-Math.pow((u - 0.1) * 11, 2)), 0.7 * Math.exp(-Math.pow((u - 0.28) * 10, 2))) + 0.18, 0, 1); }
  // Lanudo: 'idle'|'talk'|'point' (gesticula)
  function lanudo(c, pose, x, y, t, o) {
    o = o || {}; pose = pose || 'idle';
    actor(c, 'lanudo', x, y, t, { scale: o.scale || 2, flip: !!o.flip, anim: pose === 'talk' ? 'talk' : pose === 'point' ? 'work' : 'idle', lit: o.lit, side: o.side, alpha: o.alpha });
  }

  // ------------------------------------------------------------------ infraestructura de cache por escena
  var CACHE = [], MAXC = 2, LY0 = { far: 230, mid: 200, ground: 380, house: 100 }, LQ = { sky: 0.6, back: 0.6, far: 0.8, wall: 0.8 };   // recorte vertical y escala de calidad por capa (memoria movil)
  function entry(key) { var i; for (i = 0; i < CACHE.length; i++) if (CACHE[i].key === key) { var e = CACHE.splice(i, 1)[0]; CACHE.push(e); return e; } return null; }
  function addEntry(e) { CACHE.push(e); while (CACHE.length > MAXC) { var o = CACHE.shift(); o.L = null; } }
  function view(w, h, o) {
    var s = h / VH, VW = w / s, q = o && o.lite ? 0.6 : 1;
    return { s: s, VW: VW, pad: Math.round(VW * 0.14), q: q };
  }
  // construye (si no existe) las capas de una escena; defs: {name:{w,h,pad,paint}}
  function layers(id, w, h, o, defs) {
    var key = id + '|' + w + 'x' + h + '|' + (o && o.lite ? 1 : 0), e = entry(key);
    if (e && e.L) return e;
    var V = view(w, h, o); e = { key: key, V: V, L: {} }; addEntry(e);
    var n, d, lw, lh, c, g, y0, sc, qq;
    for (n in defs) {
      d = defs[n]; lw = d.w ? d.w(V) : V.VW + V.pad * 2; y0 = d.h ? 0 : (LY0[n] || 0); lh = (d.h || VH) - y0; qq = LQ[n] || 1; sc = V.s * V.q * qq;
      c = mk(lw * sc, lh * sc); g = c.getContext('2d'); g.scale(sc, sc); g.translate(0, -y0);
      if (d.pad !== false && !d.w) g.translate(V.pad, 0);
      try { d.paint(g, V, lw, lh + y0); } catch (er) { if (window.console) console.warn('assets_cine paint ' + id + '/' + n, er); }
      e.L[n] = { c: c, w: lw, h: lh, y0: y0, pad: d.pad !== false && !d.w };
    }
    return e;
  }
  function put(c, E, name, depth, p, x, y) {   // dibuja una capa con parallax horizontal (depth 0..1)
    var L = E.L[name], V = E.V, sh = (0.5 - p) * 2 * V.pad * depth; if (!L) return;
    c.drawImage(L.c, (x == null ? (L.pad ? -V.pad : 0) : x) + (L.pad ? sh : 0), (y || 0) + L.y0, L.w, L.h);
  }
  var VIG = {};
  function vignette(c, w, h, o) {
    o = o || {}; var st = o.strength == null ? 1 : o.strength, key = o.tint || '8,3,10', im = VIG[key];
    if (!im) {
      im = VIG[key] = mk(160, 90); var g = im.getContext('2d'), r = g.createRadialGradient(80, 45, 12, 80, 45, 100);
      r.addColorStop(0, 'rgba(' + key + ',0)'); r.addColorStop(0.45, 'rgba(' + key + ',0.18)'); r.addColorStop(0.8, 'rgba(' + key + ',0.78)'); r.addColorStop(1, 'rgba(' + key + ',0.96)');
      g.fillStyle = r; g.fillRect(0, 0, 160, 90);
    }
    c.save(); c.globalAlpha = clamp(st, 0, 1); c.imageSmoothingEnabled = true; c.drawImage(im, 0, 0, w, h); if (st > 1) { c.globalAlpha = st - 1; c.drawImage(im, 0, 0, w, h); } c.restore();
  }
  function letterbox(c, w, h, p, o) {
    o = o || {}; p = p == null ? 1 : p; var bh = Math.round(h * (o.size || 0.1) * clamp(p, 0, 1)); if (bh <= 0) return;
    c.fillStyle = o.color || '#040206'; c.fillRect(0, 0, w, bh); c.fillRect(0, h - bh, w, bh);
  }
  function fade(c, w, h, a, col) { if (a <= 0.003) return; c.save(); c.globalAlpha = clamp(a, 0, 1); c.fillStyle = col || '#040206'; c.fillRect(0, 0, w, h); c.restore(); }

  // luz calida como "agujero" en la oscuridad: oscurece todo salvo alrededor de (x,y) (coords virtuales)
  function darkness(c, V, x, y, r, a, col) {
    var g = c.createRadialGradient(x, y, r * 0.12, x, y, r); g.addColorStop(0, 'rgba(' + (col || '6,3,12') + ',0)'); g.addColorStop(0.5, 'rgba(' + (col || '6,3,12') + ',' + (a * 0.45).toFixed(2) + ')'); g.addColorStop(1, 'rgba(' + (col || '6,3,12') + ',' + a + ')');
    c.fillStyle = g; c.fillRect(-V.pad - 40, -40, V.VW + V.pad * 2 + 80, VH + 80);
  }
  function ground(c, V, y0, top, bot) { var g = c.createLinearGradient(0, y0, 0, VH); g.addColorStop(0, top); g.addColorStop(1, bot); c.fillStyle = g; c.fillRect(-V.pad, y0, V.VW + V.pad * 2, VH - y0); }
  function edgePines(c, V, col, seed, h0, n) {   // pinos oscuros en los bordes (primer plano)
    var r = rng(seed), i, W = V.VW;
    for (i = 0; i < (n || 4); i++) { pine(c, -V.pad + 10 + i * 46 + r() * 20, VH + 20 - r() * 20, (h0 || 360) * (0.7 + r() * 0.6), col); pine(c, W + V.pad - 10 - i * 46 - r() * 20, VH + 20 - r() * 20, (h0 || 360) * (0.7 + r() * 0.6), col); }
  }
  function grassBlades(c, V, col, seed, y, n) { var r = rng(seed), i, x; c.strokeStyle = col; c.lineWidth = 2.2; for (i = 0; i < n; i++) { x = -V.pad + r() * (V.VW + V.pad * 2); c.beginPath(); c.moveTo(x, y); c.quadraticCurveTo(x + (r() - 0.5) * 12, y - 16, x + (r() - 0.5) * 18, y - 22 - r() * 22); c.stroke(); } }

  // ================================================================== ESCENAS
  var SC = {};
  // dibujado comun: transforma al espacio virtual, aplica zoom/foco, llama draw(c,E,t,p,o) y cierra con viñeta
  function runScene(id, c, w, h, t, o) {
    o = o || {}; var S = SC[id]; if (!S) return false;
    var E = layers(id, w, h, o, S.layers), V = E.V, p = o.p != null ? clamp(o.p, 0, 1) : clamp(t / S.dur, 0, 1), calm = !!o.calm;
    c.save(); c.beginPath(); c.rect(0, 0, w, h); c.clip(); c.scale(V.s, V.s);
    var z = 1 + (S.zoom || 0) * (S.zoomEase ? sm(0, 1, p) : p), f = S.focus ? S.focus(V, p) : { x: V.VW / 2, y: VH / 2 };
    c.translate(f.x, f.y); c.scale(z, z); c.translate(-f.x, -f.y);
    S.draw(c, E, t, p, calm, o, V);
    c.restore();
    if (o.vignette !== false) vignette(c, w, h, { strength: (o.vig == null ? 1 : o.vig) });
    if (o.bars) letterbox(c, w, h, o.bars);
    return true;
  }
  function pushShadow(c, V) { var g = c.createLinearGradient(0, VH - 90, 0, VH); g.addColorStop(0, 'rgba(4,2,8,0)'); g.addColorStop(1, 'rgba(4,2,8,0.55)'); c.fillStyle = g; c.fillRect(-V.pad, VH - 90, V.VW + V.pad * 2, 90); }

  // ---- 1. FOGATA: aldea de noche, Lanudo y Marlo junto al fuego
  SC.fogata = {
    name: 'Fogata de Rescoldo', dur: 5000, zoom: 0.32, focus: function (V) { return { x: V.VW / 2 - 90, y: 400 }; },
    layers: {
      sky: { paint: function (c, V) { skyGrad(c, -V.pad, V.VW + V.pad * 2, [0, '#05040b', 0.5, '#120b1e', 0.8, '#26172a', 1, '#33201f']); stars(c, -V.pad, V.VW + V.pad * 2, 120, 7, 300, true); glow(c, '200,190,230', V.VW * 0.8, 96, 90, 0.18); c.fillStyle = '#cfc6dc'; c.globalAlpha = 0.8; c.beginPath(); c.arc(V.VW * 0.8, 96, 14, 0, TAU); c.fill(); c.globalAlpha = 1; } },
      far: { paint: function (c, V) { ridge(c, -V.pad, V.VW + V.pad, 330, 50, '#120b1a', 11, 0.007); ridge(c, -V.pad, V.VW + V.pad, 360, 32, '#0d0814', 23, 0.011); var r = rng(5), i; c.fillStyle = 'rgba(255,170,80,0.5)'; for (i = 0; i < 9; i++) c.fillRect(-V.pad + r() * (V.VW + V.pad * 2), 345 + r() * 16, 2, 2.4); } },
      mid: { paint: function (c, V) { var r = rng(9), i, x; for (i = 0; i < 7; i++) { x = -V.pad + 40 + i * ((V.VW + V.pad * 2 - 80) / 6) + r() * 30; if (i % 2) pine(c, x, 410, 130 + r() * 50, '#0a0610'); else houseSil(c, x, 410, 70 + r() * 20, 50 + r() * 16, '#0c0711', r() < 0.7 ? '#a8581c' : null, { one: true }); } } },
      ground: { paint: function (c, V) { ground(c, V, 396, '#17101a', '#07040a'); var i, r = rng(3), cx = V.VW / 2; c.fillStyle = '#0d0810'; c.beginPath(); c.ellipse(cx, 448, 96, 22, 0, 0, TAU); c.fill(); c.fillStyle = '#2a2026'; for (i = 0; i < 14; i++) { var a = i / 14 * TAU; c.beginPath(); c.ellipse(cx + Math.cos(a) * 74, 448 + Math.sin(a) * 15, 13, 8, 0, 0, TAU); c.fill(); }
        c.save(); c.translate(cx - 56, 452); c.rotate(-0.25); c.fillStyle = '#1a0f0c'; c.fillRect(-4, -9, 72, 12); c.restore(); c.save(); c.translate(cx + 20, 460); c.rotate(0.28); c.fillStyle = '#1a0f0c'; c.fillRect(-4, -9, 70, 12); c.restore();
        // tronco de Lanudo (hay uno ya en su sprite); hierba
        grassBlades(c, V, '#0d0912', 4, 470, 60); } },
      fg: { paint: function (c, V) { edgePines(c, V, '#040206', 21, 420); grassBlades(c, V, '#040208', 6, VH + 4, 50); } }
    },
    draw: function (c, E, t, p, calm, o, V) {
      var cx = V.VW / 2, fl = flick(t, calm, 1), i, tw;
      put(c, E, 'sky', 0.1, p); if (!calm) { c.fillStyle = '#fff4dc'; for (i = 0; i < 7; i++) { tw = (Math.sin(t / 600 + i * 2.1) + 1) / 2; c.globalAlpha = 0.15 + tw * 0.5; c.fillRect(-60 + ((i * 197) % (V.VW + 120)), 40 + (i * 53) % 220, 2, 2); } c.globalAlpha = 1; }
      put(c, E, 'far', 0.3, p); put(c, E, 'mid', 0.5, p);
      glow(c, '255,120,40', cx, 430, 340, 0.20 * fl, 0.55);
      put(c, E, 'ground', 0.75, p);
      glow(c, '255,140,50', cx, 452, 230, 0.34 * fl, 0.28);
      var gx = (0.5 - p) * 2 * V.pad * 0.75;
      lanudo(c, p > 0.18 ? 'talk' : 'idle', cx - 150 + gx, 462, t, { scale: 2.0, flip: false, lit: 1, side: 1 });
      marlo(c, 'idle', cx + 150 + gx, 466, t, { scale: 2.7, flip: true, calm: calm, side: -1 });
      c.save(); c.translate(cx + gx, 458); flame(c, 0, 0, 92, t, calm, 0); flame(c, -22, 4, 54, t, calm, 2.1); flame(c, 24, 4, 48, t, calm, 4.2); c.restore();
      glow(c, '255,210,120', cx + gx, 424, 46, 0.42 * fl);
      embers(c, cx + gx, 420, 60, 320, 38, t, calm, { seed: 1 });
      darkness(c, V, cx + gx, 440, V.VW * 0.62, 0.6);
      put(c, E, 'fg', 1, p); pushShadow(c, V);
    }
  };

  // ---- 2. HOGAR de antes: flashback ambar, casa grande con chimenea, siluetas, el Pastor fuera
  SC.hogar = {
    name: 'El Hogar de antes', dur: 6000, zoom: 0.0,
    layers: {
      sky: { paint: function (c, V) { skyGrad(c, -V.pad, V.VW + V.pad * 2, [0, '#150a10', 0.5, '#3a1a14', 0.85, '#6a3216', 1, '#7a4018']); stars(c, -V.pad, V.VW + V.pad * 2, 40, 3, 180, false); } },
      far: { paint: function (c, V) { ridge(c, -V.pad, V.VW + V.pad, 360, 40, '#2a120e', 41, 0.008); ridge(c, -V.pad, V.VW + V.pad, 392, 26, '#1a0b0a', 45, 0.013); } },
      house: { paint: function (c, V) {
        var cx = V.VW / 2, y = 430, w = 330, h = 170, x = cx - w / 2;
        c.fillStyle = '#1a0d0c'; c.fillRect(x, y - h, w, h);
        c.fillStyle = '#100808'; c.beginPath(); c.moveTo(x - 24, y - h); c.lineTo(cx, y - h - 120); c.lineTo(x + w + 24, y - h); c.closePath(); c.fill();
        c.fillStyle = '#0e0707'; c.fillRect(cx + 70, y - h - 100, 36, 90);   // chimenea
        c.fillStyle = '#2a1410'; c.fillRect(cx + 66, y - h - 108, 44, 12);
        var ws = [[x + 24, 40], [x + 100, 40], [x + 204, 40], [x + 266, 40]], i;
        for (i = 0; i < ws.length; i++) { c.fillStyle = '#ffb04a'; c.fillRect(ws[i][0], y - h + 50, 40, 52); c.fillStyle = '#ffe098'; c.fillRect(ws[i][0] + 4, y - h + 54, 32, 44); c.fillStyle = '#1a0d0c'; c.fillRect(ws[i][0] + 18, y - h + 50, 4, 52); c.fillRect(ws[i][0], y - h + 74, 40, 4); }
        c.fillStyle = '#0a0506'; c.fillRect(cx - 24, y - 74, 48, 74); c.fillStyle = '#ffb04a'; c.fillRect(cx - 22, y - 28, 44, 3);
      } },
      ground: { paint: function (c, V) { ground(c, V, 430, '#2a130e', '#0a0505'); var i, r = rng(8); c.fillStyle = '#1e0e0a'; for (i = 0; i < 30; i++) c.fillRect(-V.pad + r() * (V.VW + V.pad * 2), 440 + r() * 90, 20 + r() * 30, 2);
        c.strokeStyle = '#120807'; c.lineWidth = 4; var x; for (x = V.VW / 2 + 190; x < V.VW + V.pad; x += 36) { c.beginPath(); c.moveTo(x, 440); c.lineTo(x, 480); c.stroke(); } c.beginPath(); c.moveTo(V.VW / 2 + 180, 452); c.lineTo(V.VW + V.pad, 452); c.moveTo(V.VW / 2 + 180, 470); c.lineTo(V.VW + V.pad, 470); c.stroke(); } },
      fg: { paint: function (c, V) { edgePines(c, V, '#050203', 33, 440); } }
    },
    draw: function (c, E, t, p, calm, o, V) {
      var cx = V.VW / 2, fl = flick(t, calm, 3), gx = (0.5 - p) * 2 * V.pad * 0.8, i, W = ['#ffb04a'];
      put(c, E, 'sky', 0.1, p); put(c, E, 'far', 0.3, p);
      glow(c, '255,140,50', cx, 330, 380, 0.22 * fl, 0.6);
      put(c, E, 'house', 0.7, p); put(c, E, 'ground', 0.8, p);
      var hx = cx + gx, y = 430, x = hx - 165, sil = ['grum', 'castana', 'vesper', 'ulalume'], bx = [x + 44, x + 120, x + 224, x + 286];
      for (i = 0; i < 4; i++) { c.save(); c.beginPath(); c.rect(bx[i] - 20, y - 120, 40, 52); c.clip(); figSil(c, bx[i] + (calm ? 0 : Math.sin(t / 900 + i) * 2), y - 38 + 14, 0.78, sil[i], '#120706'); c.restore(); }
      for (i = 0; i < 4; i++) glow(c, '255,176,70', bx[i], y - 94, 70, (0.28 + 0.1 * Math.sin(t / 180 + i)) * (calm ? 0.9 : fl));
      glow(c, '255,160,60', hx, y - 18, 120, 0.2 * fl, 0.5);
      smoke(c, hx + 88, y - 290, 120, 7, t, '120,70,50', 0.22, calm);
      var px = cx + 330 + gx, py = 470;   // el Pastor y su rebaño (aun bueno: sin brasa)
      c.save(); bossSil(c, 'pastor', px, py, 0.62, '#0e0608', null, t, calm); c.restore();
      for (i = 0; i < 3; i++) { c.fillStyle = '#150a0a'; c.beginPath(); c.ellipse(px - 70 - i * 46, py + 8 + (i % 2) * 10, 15, 11, 0, 0, TAU); c.fill(); c.beginPath(); c.arc(px - 82 - i * 46, py + 4 + (i % 2) * 10, 6, 0, TAU); c.fill(); }
      glow(c, '255,170,70', px + 40, py - 118, 20, 0.35 * fl);
      embers(c, hx + 88, y - 300, 24, 140, 16, t, calm, { seed: 4 });
      darkness(c, V, cx + gx * 0.5, 340, V.VW * 0.72, 0.62, '8,3,6');
      put(c, E, 'fg', 1, p); pushShadow(c, V);
    }
  };

  // ---- 3. LA BRASA: primer plano de la chimenea; una brasa se niega a apagarse (ambar -> naranja sucio)
  SC.brasa = {
    name: 'La brasa', dur: 6000, zoom: 0.55, zoomEase: true, focus: function (V, p) { return { x: V.VW / 2, y: lerp(360, 250, sm(0.2, 0.8, p)) }; },
    layers: {
      wall: { paint: function (c, V) { c.fillStyle = '#0d0709'; c.fillRect(-V.pad, 0, V.VW + V.pad * 2, VH); var r = rng(14), x, y, ro = 0; for (y = 0; y < VH; y += 46) { for (x = -V.pad - (ro % 2) * 40; x < V.VW + V.pad; x += 80) { var sh = 8 + r() * 10; c.fillStyle = 'rgb(' + (20 + sh) + ',' + (13 + sh * 0.6) + ',' + (14 + sh * 0.6) + ')'; c.fillRect(x + 2, y + 2, 76, 42); } ro++; } } },
      frame: { paint: function (c, V) {
        var cx = V.VW / 2, i, g;
        c.fillStyle = '#110a0c'; c.fillRect(cx - 250, 130, 500, 410);   // repisa y jambas
        c.fillStyle = '#1e1214'; c.fillRect(cx - 270, 112, 540, 26); c.fillStyle = '#0a0506'; c.fillRect(cx - 270, 138, 540, 4);
        c.fillStyle = '#050304'; c.beginPath(); c.moveTo(cx - 175, 540); c.lineTo(cx - 175, 270); c.quadraticCurveTo(cx - 175, 190, cx, 190); c.quadraticCurveTo(cx + 175, 190, cx + 175, 270); c.lineTo(cx + 175, 540); c.closePath(); c.fill();
        g = c.createLinearGradient(0, 190, 0, 540); g.addColorStop(0, 'rgba(0,0,0,0.9)'); g.addColorStop(1, 'rgba(40,12,6,0.4)'); c.fillStyle = g; c.fill();
                c.fillStyle = '#080506'; c.beginPath(); c.ellipse(cx, 478, 170, 20, 0, 0, TAU); c.fill();
        c.save(); c.translate(cx - 70, 470); c.rotate(-0.06); c.fillStyle = '#150b09'; c.fillRect(-60, -16, 130, 22); c.restore(); c.save(); c.translate(cx + 34, 466); c.rotate(0.08); c.fillStyle = '#120a08'; c.fillRect(-44, -14, 110, 20); c.restore();
      } }
    },
    draw: function (c, E, t, p, calm, o, V) {
      var cx = V.VW / 2, fl = flick(t, calm, 2), fireA = 1 - sm(0.18, 0.6, p) * 0.88, i;
      put(c, E, 'wall', 0.15, p); put(c, E, 'frame', 0.5, p);
      var gx = (0.5 - p) * 2 * V.pad * 0.5, hx = cx + gx;
      glow(c, '255,130,40', hx, 440, 230, 0.4 * fireA * fl, 0.6);
      // llamas moribundas
      c.save(); c.globalAlpha = fireA; c.translate(hx, 470); flame(c, -44, 0, 64 * fireA + 8, t, calm, 0.5); flame(c, 18, 2, 84 * fireA + 8, t, calm, 2); flame(c, 62, 0, 48 * fireA + 6, t, calm, 4); c.restore();
      // ascuas del lecho
      c.save(); c.globalCompositeOperation = 'lighter'; for (i = 0; i < 12; i++) { var k = (i * 0.37) % 1, a = 0.35 + 0.35 * Math.sin(t / 400 + i * 2.3) * (calm ? 0.3 : 1); c.globalAlpha = a * (0.4 + fireA * 0.6); c.fillStyle = '#d4521a'; c.fillRect(hx - 120 + k * 240 + Math.sin(i) * 10, 462 + (i % 3) * 5, 6 + (i % 4) * 2, 3); } c.restore();
      // la brasa: sale del lecho, salta y se queda flotando (naranja sucio)
      var a1 = sm(0.2, 0.5, p), a2 = sm(0.5, 0.78, p), bx, by;
      bx = hx + 10 + lerp(0, -4, a1) + Math.sin(t / 700) * 5 * a2; by = lerp(466, 330, a1) - Math.sin(a1 * Math.PI) * 60 - a2 * 40 + Math.sin(t / 500) * 4 * a2;
      var dirt = sm(0.35, 1, p), col = Math.round(lerp(255, 205, dirt)) + ',' + Math.round(lerp(176, 84, dirt)) + ',' + Math.round(lerp(60, 26, dirt));
      var beat = calm ? 0.8 : 0.8 + 0.2 * Math.sin(t / 220), rr = lerp(16, 64, a2) * beat;
      glow(c, col, bx, by, rr * 3.2, lerp(0.35, 0.7, a2));
      glow(c, col, bx, by, rr * 1.4, 0.8);
      glow(c, '255,225,150', bx, by, rr * 0.55, 0.9 * (1 - dirt * 0.5));
      c.fillStyle = '#ffd890'; c.beginPath(); c.arc(bx, by, 3 + a2 * 4, 0, TAU); c.fill();
      embers(c, bx, by + 10, 40 + 60 * a2, 150, 18, t, calm, { col: col, seed: 6, speed: 1.4, alpha: 0.4 + a2 * 0.6 });
      if (a2 > 0.1) { // anillo de ceniza que se extiende: "devorarlo todo"
        c.save(); c.globalCompositeOperation = 'lighter'; c.strokeStyle = 'rgba(' + col + ',' + (0.18 * a2).toFixed(2) + ')'; c.lineWidth = 3; c.beginPath(); c.arc(bx, by, 80 + (t / 12 % 120) * a2, 0, TAU); c.stroke(); c.restore();
      }
      smoke(c, bx, by - 20, 200, 6, t, '60,40,40', 0.25 * a1, calm);
      // el cuarto se oscurece segun se aleja la luz buena
      c.fillStyle = 'rgba(4,1,4,' + (0.0 + 0.45 * sm(0.2, 0.9, p)).toFixed(2) + ')'; c.fillRect(-V.pad, 0, V.VW + V.pad * 2, VH);
      glow(c, col, bx, by, rr * 2.4, 0.35 * a2);
      darkness(c, V, hx, 360, V.VW * 0.62, 0.7, '4,1,5');
    }
  };

  // ---- 4. LOS CINCO RESCOLDOS: panel que se desplaza, una silueta + color por panel, chispa al encenderse
  var RES = [
    { id: 'pastor', col: '170,110,255', hex: '#b06bff', bg: ['#0e0716', '#241036'], name: 'El Pastor' },
    { id: 'karceron', col: '255,130,40', hex: '#ff8a28', bg: ['#120707', '#33120a'], name: 'Karceron' },
    { id: 'letea', col: '60,220,200', hex: '#3cdcc8', bg: ['#04100f', '#0a2a28'], name: 'Letea' },
    { id: 'yarlak', col: '170,220,255', hex: '#aadcff', bg: ['#0a1018', '#1c2e42'], name: 'Yarlak' },
    { id: 'melaria', col: '255,190,50', hex: '#ffbe32', bg: ['#140d03', '#3a2606'], name: 'Melaria' }
  ];
  var PW = 300, PH = 390, PG = 30;
  function panelDefs() {
    var d = { back: { paint: function (c, V) { skyGrad(c, -V.pad, V.VW + V.pad * 2, [0, '#040307', 1, '#0d0710']); stars(c, -V.pad, V.VW + V.pad * 2, 70, 19, 540, false); } } }, i;
    RES.forEach(function (R, i) {
      d['p' + i] = { w: function () { return PW; }, h: PH, pad: false, paint: function (c) {
        var g = c.createLinearGradient(0, 0, 0, PH); g.addColorStop(0, R.bg[0]); g.addColorStop(1, R.bg[1]); c.fillStyle = g; c.fillRect(0, 0, PW, PH);
        var r = rng(70 + i), k;
        if (R.id === 'pastor') { c.fillStyle = '#12091c'; for (k = 0; k < 8; k++) c.fillRect(10 + k * 38, 230 + r() * 10, 3, 120); ridge(c, 0, PW, 300, 22, '#0b0612', 3, 0.02, PH); }
        else if (R.id === 'karceron') { c.fillStyle = '#0a0404'; for (k = 0; k < 6; k++) c.fillRect(k * 56 - 4, 0, 30, PH); c.fillStyle = '#3a1208'; c.fillRect(0, 330, PW, 60); }
        else if (R.id === 'letea') { c.fillStyle = '#041412'; c.fillRect(0, 290, PW, 100); c.strokeStyle = '#0d3a36'; c.lineWidth = 2; for (k = 0; k < 6; k++) { c.beginPath(); c.ellipse(150, 320 + k * 12, 70 + k * 20, 5 + k, 0, 0, TAU); c.stroke(); } }
        else if (R.id === 'yarlak') { ridge(c, 0, PW, 280, 50, '#16243a', 5, 0.02, PH); ridge(c, 0, PW, 320, 26, '#0c1624', 7, 0.03, PH); c.fillStyle = '#d6ecff'; for (k = 0; k < 50; k++) c.fillRect(r() * PW, r() * 340, 2, 2); }
        else { c.strokeStyle = '#4a3008'; c.lineWidth = 2; var x, y; for (y = 0; y < PH + 30; y += 26) for (x = ((y / 26) % 2) * 22; x < PW + 40; x += 44) { c.beginPath(); for (k = 0; k < 6; k++) { var an = k / 6 * TAU + 0.52; c.lineTo(x + Math.cos(an) * 14, y + Math.sin(an) * 14); } c.closePath(); c.stroke(); } c.fillStyle = '#0a0602'; c.fillRect(0, 340, PW, 50); }
        bossSil(c, R.id, 150, 338, R.id === 'yarlak' ? 0.92 : 1.12, '#030204', null, 0, true);
      } };
    });
    return d;
  }
  SC.rescoldos = {
    name: 'Los cinco rescoldos', dur: 9000,
    layers: panelDefs(),
    draw: function (c, E, t, p, calm, o, V) {
      var i, cx = V.VW / 2, step = PW + PG, a = clamp(p * 5, 0, 4.999), act = Math.floor(a), fr = a - act;
      var cam = (act + sm(0.72, 1, fr) * (act < 4 ? 1 : 0)) * step;
      put(c, E, 'back', 0.1, p);
      glow(c, RES[act].col, cx, 300, 380, 0.07 + 0.08 * sm(0, 0.3, fr));
      for (i = 0; i < 5; i++) {
        var px = cx - PW / 2 + i * step - cam, d = Math.abs(i * step - cam) / step, sc = 1 - Math.min(0.14, d * 0.1), lit = i < act || (i === act && fr > 0.12), sp = i === act ? sm(0.05, 0.3, fr) : 1;
        var R = RES[i], py = 270 - PH / 2 * sc;
        c.save(); c.translate(px + PW / 2, 270); c.scale(sc, sc); c.translate(-PW / 2, -PH / 2);
        c.drawImage(E.L['p' + i].c, 0, 0, PW, PH);
        if (lit) {   // color del rescoldo: aura detras de la silueta y ojos encendidos
          var fl = flick(t, calm, i * 2);
          glow(c, R.col, 150, 250, 210, (0.32 * sp) * fl, 0.9);
          c.save(); bossSil(c, R.id, 150, 338, R.id === 'yarlak' ? 0.92 : 1.12, 'rgba(0,0,0,0)', R.hex, t, calm); c.restore();
          glow(c, R.col, 150, R.id === 'letea' ? 232 : 140, 42, 0.5 * sp);
        }
        c.lineWidth = 4; c.strokeStyle = lit ? 'rgba(' + R.col + ',' + (0.55 * sp + 0.12).toFixed(2) + ')' : 'rgba(60,40,70,0.5)'; c.strokeRect(0, 0, PW, PH);
        c.fillStyle = 'rgba(3,2,6,' + (lit ? 0.0 : 0.62) + ')'; c.fillRect(0, 0, PW, PH);
        if (i === act && fr < 0.5) { var fa = 1 - fr * 2; c.fillStyle = 'rgba(3,2,6,' + (0.7 * fa * (fr < 0.12 ? 1 : 0.3)).toFixed(2) + ')'; c.fillRect(0, 0, PW, PH); }
        c.restore();
      }
      // chispa del leitmotiv: salta al encenderse el panel activo (calm: sin destello, solo brillo suave)
      if (fr < 0.35) { var u = fr / 0.35, a2 = (1 - u) * (calm ? 0.6 : 1); glow(c, RES[act].col, cx, 270 - 70 - u * 40, 40 + u * 60, a2); }
      embers(c, cx, 440, 360, 320, 26, t, calm, { col: RES[act].col, seed: 8, alpha: 0.7 });
      darkness(c, V, cx, 270, V.VW * 0.65, 0.58);
    }
  };

  // ---- 5. RESCOLDO EN RUINAS: la aldea que queda (Grum, Vesper, Ulalume, Castaña, Rufo con luz de brasas)
  SC.ruinas = {
    name: 'Rescoldo, lo que queda', dur: 7000,
    layers: {
      sky: { paint: function (c, V) { skyGrad(c, -V.pad, V.VW + V.pad * 2, [0, '#08060c', 0.55, '#1c1216', 0.9, '#33201c', 1, '#3a2620']); stars(c, -V.pad, V.VW + V.pad * 2, 50, 31, 220, false);
        var r = rng(2), i; for (i = 0; i < 4; i++) { var x = -V.pad + r() * (V.VW + V.pad * 2); c.fillStyle = 'rgba(30,20,22,0.5)'; c.beginPath(); c.ellipse(x, 300, 24, 120, 0, 0, TAU); c.fill(); } } },
      far: { paint: function (c, V) { ridge(c, -V.pad, V.VW + V.pad, 350, 36, '#140c10', 51, 0.009); var r = rng(61), i, x; for (i = 0; i < 9; i++) { x = -V.pad + i * ((V.VW + V.pad * 2) / 8); houseSil(c, x, 378, 50 + r() * 20, 34 + r() * 16, '#0f090c', null, { burnt: true }); } } },
      mid: { paint: function (c, V) { var r = rng(62), i, x; for (i = 0; i < 6; i++) { x = -V.pad + 70 + i * ((V.VW + V.pad * 2 - 140) / 5); houseSil(c, x, 420, 100 + r() * 30, 80 + r() * 30, '#150d10', r() < 0.4 ? '#7a3a14' : null, { burnt: true, one: true }); c.fillStyle = '#0a0608'; c.fillRect(x + 20, 420 - 90, 4, 90); } } },
      ground: { paint: function (c, V) { ground(c, V, 410, '#1c1214', '#07040a'); var cx = V.VW / 2;
        c.fillStyle = '#10090c'; c.beginPath(); c.ellipse(cx, 452, 150, 26, 0, 0, TAU); c.fill();
        // brasero apagado (plaza): cuenco agrietado sin llama
        c.fillStyle = '#241a1e'; c.beginPath(); c.moveTo(cx - 34, 404); c.lineTo(cx + 34, 404); c.lineTo(cx + 22, 440); c.lineTo(cx - 22, 440); c.closePath(); c.fill(); c.fillStyle = '#0a0608'; c.beginPath(); c.ellipse(cx, 404, 34, 7, 0, 0, TAU); c.fill(); c.fillStyle = '#241a1e'; c.fillRect(cx - 6, 440, 12, 24); c.strokeStyle = '#0a0608'; c.lineWidth = 2; c.beginPath(); c.moveTo(cx + 10, 408); c.lineTo(cx + 4, 424); c.lineTo(cx + 12, 436); c.stroke();
        var r = rng(77), i; c.fillStyle = '#0d080b'; for (i = 0; i < 26; i++) { c.beginPath(); c.ellipse(-V.pad + r() * (V.VW + V.pad * 2), 470 + r() * 60, 6 + r() * 12, 3 + r() * 5, 0, 0, TAU); c.fill(); }
        c.fillStyle = '#0c070a'; c.fillRect(cx + 150, 440, 56, 14); c.fillRect(cx + 162, 454, 32, 10); } },
      fg: { paint: function (c, V) { edgePines(c, V, '#040207', 88, 300, 2); var r = rng(91), i, x; c.fillStyle = '#040207'; for (i = 0; i < 10; i++) { x = -V.pad + r() * (V.VW + V.pad * 2); c.save(); c.translate(x, VH + 4); c.rotate((r() - 0.5) * 0.9); c.fillRect(-5, -60 - r() * 60, 10, 90); c.restore(); } } }
    },
    draw: function (c, E, t, p, calm, o, V) {
      var cx = V.VW / 2, gx = (0.5 - p) * 2 * V.pad * 0.8, i, fl = flick(t, calm, 5);
      put(c, E, 'sky', 0.1, p); put(c, E, 'far', 0.3, p); put(c, E, 'mid', 0.55, p);
      glow(c, '255,120,40', cx + gx, 440, 300, 0.12 * fl, 0.5);
      put(c, E, 'ground', 0.8, p);
      // luces de brasa pequeñas: yunque de Grum, olla de Castaña, vela de Vesper
      var spots = [[cx - 300, 456], [cx + 300, 456], [cx - 150, 462]];
      for (i = 0; i < spots.length; i++) glow(c, '255,130,50', spots[i][0] + gx, spots[i][1] - 20, 150, 0.16 * flick(t, calm, i * 1.7), 0.5);
      var R = [['grum', cx - 300, 'work', false, 1.7], ['vesper', cx - 150, 'work', false, 1.65], ['ulalume', cx - 20 + 40, 'work', false, 1.65], ['castana', cx + 170, 'work', true, 1.6], ['rufo', cx + 300, 'work', true, 1.65]];
      var ys = [470, 480, 484, 478, 472];
      for (i = 0; i < R.length; i++) actor(c, R[i][0], R[i][1] + gx, ys[i], t, { scale: R[i][4], flip: R[i][3], anim: R[i][2], tOff: i * 400, lit: 0.8, side: i < 2 ? 1 : -1 });
      // yunque de Grum con chispas, olla de Castaña con fuego pequeño
      c.fillStyle = '#1a1216'; c.fillRect(cx - 202 + gx, 452, 50, 20); c.fillStyle = '#2c2228'; c.fillRect(cx - 208 + gx, 446, 62, 10);
      embers(c, cx - 184 + gx, 446, 30, 70, 8, t, calm, { seed: 12, speed: 1.8 });
      flame(c, cx + 242 + gx, 484, 28, t, calm, 1); glow(c, '255,160,60', cx + 242 + gx, 466, 50, 0.4 * fl);
      // ceniza que cae
      c.fillStyle = 'rgba(200,180,170,0.6)'; for (i = 0; i < 30; i++) { var k = (i * 0.618) % 1, u = ((t / 1000) * (calm ? 0.02 : 0.05) * (0.6 + k) + k * 5) % 1; c.globalAlpha = 0.15 + 0.35 * k; c.fillRect(-V.pad + ((k * 977) % 1) * (V.VW + V.pad * 2) + Math.sin(u * 8 + i) * 12, u * VH, 2, 2); } c.globalAlpha = 1;
      darkness(c, V, cx + gx * 0.4, 440, V.VW * 0.75, 0.46);
      put(c, E, 'fg', 1, p); pushShadow(c, V);
    }
  };

  // ---- 6. LA BUFANDA: primer plano de Marlo; la brasa mansa late en su bufanda; Lanudo señala
  function marloBust(c, x, y, s) {
    c.save(); c.translate(x, y); c.scale(s, s);
    c.fillStyle = '#0d0a14'; c.beginPath(); c.moveTo(-190, 150); c.quadraticCurveTo(-170, 50, -80, 30); c.lineTo(80, 30); c.quadraticCurveTo(170, 50, 190, 150); c.closePath(); c.fill();   // hombros
    c.fillStyle = '#1b1b25'; c.beginPath(); c.moveTo(-84, -60); c.lineTo(-112, -40); c.lineTo(-86, -34); c.lineTo(-100, -14); c.lineTo(-70, -16); c.lineTo(-56, 6); c.lineTo(56, 6); c.lineTo(70, -16); c.lineTo(100, -14); c.lineTo(86, -34); c.lineTo(112, -40); c.lineTo(84, -60); c.closePath(); c.fill();   // mofletes
    c.beginPath(); c.ellipse(0, -66, 88, 74, 0, 0, TAU); c.fill();   // cabeza
    c.beginPath(); c.arc(-62, -128, 28, 0, TAU); c.arc(62, -128, 28, 0, TAU); c.fill(); c.fillStyle = '#0c0a12'; c.beginPath(); c.arc(-62, -126, 14, 0, TAU); c.arc(62, -126, 14, 0, TAU); c.fill(); c.fillStyle = '#1b1b25';   // orejas
    c.fillStyle = '#0a080f'; c.beginPath(); c.moveTo(-92, -88); c.lineTo(-60, -98); c.lineTo(0, -84); c.lineTo(60, -98); c.lineTo(92, -88); c.lineTo(74, -48); c.quadraticCurveTo(40, -66, 0, -58); c.quadraticCurveTo(-40, -66, -74, -48); c.closePath(); c.fill();   // antifaz
    c.fillStyle = '#ddd2ae'; c.beginPath(); c.ellipse(-34, -72, 10, 12, 0, 0, TAU); c.ellipse(34, -72, 10, 12, 0, 0, TAU); c.fill(); c.fillStyle = '#05030a'; c.beginPath(); c.arc(-31, -70, 6, 0, TAU); c.arc(37, -70, 6, 0, TAU); c.fill();
    c.fillStyle = '#34343f'; c.beginPath(); c.moveTo(-30, -46); c.quadraticCurveTo(0, -60, 30, -46); c.quadraticCurveTo(24, -6, 0, -4); c.quadraticCurveTo(-24, -6, -30, -46); c.closePath(); c.fill(); c.fillStyle = '#05030a'; c.beginPath(); c.ellipse(0, -44, 9, 6, 0, 0, TAU); c.fill();
    c.restore();
  }
  SC.bufanda = {
    name: 'La bufanda', dur: 6000, zoom: 0.25, focus: function (V) { return { x: V.VW / 2 + 90, y: 300 }; },
    layers: {
      back: { paint: function (c, V) { skyGrad(c, -V.pad, V.VW + V.pad * 2, [0, '#060409', 0.6, '#150b12', 1, '#241210']); stars(c, -V.pad, V.VW + V.pad * 2, 60, 77, 300, false); ridge(c, -V.pad, V.VW + V.pad, 400, 40, '#0b060d', 83, 0.008); } },
      bust: { paint: function (c, V) { marloBust(c, V.VW / 2 + 100, 330, 1.2); } }
    },
    draw: function (c, E, t, p, calm, o, V) {
      var cx = V.VW / 2, gx = (0.5 - p) * 2 * V.pad * 0.7, hb = heart(t, calm), fl = flick(t, calm, 2);
      put(c, E, 'back', 0.1, p);
      var sx = cx + 100 + gx, sy = 330 + 30;   // bufanda
      glow(c, '255,150,50', sx, sy, 380, 0.2 * (0.5 + hb * 0.5), 0.8);
      put(c, E, 'bust', 0.75, p);
      c.save(); c.translate(cx + 100 + gx, 330); c.scale(1.2, 1.2); c.lineCap = 'round';
      var i; c.strokeStyle = '#7a2a0c'; c.lineWidth = 40; c.beginPath(); c.ellipse(0, 6, 104, 12, 0, 0.0, Math.PI); c.stroke();
      c.strokeStyle = '#b03c12'; c.lineWidth = 26; c.beginPath(); c.ellipse(0, 10, 104, 12, 0, 0.0, Math.PI); c.stroke();
      c.strokeStyle = 'rgba(255,190,90,' + (0.2 + 0.5 * hb).toFixed(2) + ')'; c.lineWidth = 3; c.beginPath(); c.ellipse(0, 14, 104, 12, 0, 0.1, Math.PI - 0.1); c.stroke();
      c.fillStyle = '#8a300e'; c.beginPath(); c.moveTo(34, 36); c.lineTo(78, 120); c.lineTo(44, 128); c.lineTo(10, 46); c.closePath(); c.fill();
      c.restore();
      // la brasa mansa: nucleo en el pliegue, late con el pulso; luz calida sobre la cara y el hombro
      var bx = cx + 100 + gx + 30, by = sy + 30;
      glow(c, '255,170,60', bx, by, 90 + 40 * hb, 0.5 + 0.35 * hb); glow(c, '255,236,170', bx, by, 24 + 10 * hb, 0.8 + 0.2 * hb);
      glow(c, '255,160,70', cx + 100 + gx, 250, 180, 0.12 + 0.12 * hb, 0.9);
      embers(c, bx, by, 60, 160, 14, t, calm, { col: '255,200,90', seed: 5, speed: 0.7, alpha: 0.8 });
      // Lanudo señala desde el borde izquierdo
      var lx = cx - 250 + gx;
      lanudo(c, 'point', lx, 500, t, { scale: 2.6, side: 1, lit: 0.9 });
      glow(c, '255,160,70', lx + 40, 420, 150, 0.14 * (0.5 + hb * 0.5), 0.8);
      darkness(c, V, bx - 60, 330, V.VW * 0.6, 0.66);
      pushShadow(c, V);
    }
  };

  // ---- 7. EL PORTAL: arco de piedra que se enciende; Marlo camina; las seis llamas lejanas (cinco de color + una blanca)
  var SIX = [['170,110,255', '#b06bff'], ['255,130,40', '#ff8a28'], ['60,220,200', '#3cdcc8'], ['170,220,255', '#aadcff'], ['255,190,50', '#ffbe32'], ['255,250,240', '#ffffff']];
  SC.portal = {
    name: 'El Portal', dur: 6000, zoom: 0.18, focus: function (V) { return { x: V.VW / 2 + 130, y: 330 }; },
    layers: {
      sky: { paint: function (c, V) { skyGrad(c, -V.pad, V.VW + V.pad * 2, [0, '#030208', 0.55, '#0c0716', 0.85, '#1a1020', 1, '#26141c']); stars(c, -V.pad, V.VW + V.pad * 2, 90, 101, 260, true); } },
      far: { paint: function (c, V) { ridge(c, -V.pad, V.VW + V.pad, 300, 50, '#100a1a', 111, 0.007); ridge(c, -V.pad, V.VW + V.pad, 350, 36, '#0b0712', 113, 0.011); } },
      mid: { paint: function (c, V) { var r = rng(120), i, x; for (i = 0; i < 9; i++) { x = -V.pad + r() * (V.VW + V.pad * 2); c.strokeStyle = '#08050c'; c.lineWidth = 5; c.beginPath(); c.moveTo(x, 420); c.lineTo(x + (r() - 0.5) * 20, 420 - 80 - r() * 50); c.stroke(); c.lineWidth = 3; c.beginPath(); c.moveTo(x, 360); c.lineTo(x + 20 + r() * 20, 330); c.moveTo(x, 380); c.lineTo(x - 20 - r() * 14, 346); c.stroke(); } } },
      arch: { paint: function (c, V) {
        var cx = V.VW / 2 + 130, i; c.fillStyle = '#17101f'; c.fillRect(cx - 120, 200, 44, 250); c.fillRect(cx + 76, 200, 44, 250);
        c.beginPath(); c.moveTo(cx - 128, 210); c.quadraticCurveTo(cx, 80, cx + 128, 210); c.lineTo(cx + 120, 250); c.quadraticCurveTo(cx, 130, cx - 120, 250); c.closePath(); c.fill();
        c.strokeStyle = '#1c1426'; c.lineWidth = 2; for (i = 0; i < 6; i++) { c.beginPath(); c.moveTo(cx - 120, 240 + i * 36); c.lineTo(cx - 76, 240 + i * 36); c.moveTo(cx + 76, 240 + i * 36); c.lineTo(cx + 120, 240 + i * 36); c.stroke(); }
        c.fillStyle = '#04020a'; c.fillRect(cx - 76, 215, 152, 235);
      } },
      ground: { paint: function (c, V) { ground(c, V, 430, '#150c16', '#06030a'); var cx = V.VW / 2 + 130, i; c.fillStyle = '#1e1422'; for (i = 0; i < 7; i++) { c.beginPath(); c.ellipse(cx - 20 - i * 70, 470 + (i % 2) * 8, 26 + i * 4, 6, 0, 0, TAU); c.fill(); } c.fillStyle = '#100a14'; c.beginPath(); c.ellipse(cx, 450, 110, 14, 0, 0, TAU); c.fill(); } },
      fg: { paint: function (c, V) { edgePines(c, V, '#030106', 131, 380); grassBlades(c, V, '#030106', 133, VH + 4, 40); } }
    },
    draw: function (c, E, t, p, calm, o, V) {
      var cx = V.VW / 2 + 130, gx = (0.5 - p) * 2 * V.pad * 0.8, ax = cx + gx, i, fl = flick(t, calm, 4), ign = sm(0.35, 0.62, p), si = sm(0.55, 0.92, p);
      put(c, E, 'sky', 0.1, p);
      // las seis llamas lejanas
      for (i = 0; i < 6; i++) { var FX = [-400, -290, -180, 190, 270, 0], FY = [230, 190, 215, 215, 185, 62], lx = cx + FX[i] + gx * 0.3, ly = FY[i], a = si * (i === 5 ? 1 : 0.9), pu = calm ? 1 : 0.85 + 0.15 * Math.sin(t / 260 + i * 1.7);
        if (a > 0.01) { glow(c, SIX[i][0], lx, ly, (i === 5 ? 70 : 48) * pu, 0.5 * a); c.save(); c.globalAlpha = a; c.translate(lx, ly + 10); c.scale(0.5, 0.5); flame(c, 0, 0, 40, t, calm, i); c.restore(); glow(c, SIX[i][0], lx, ly, 14, 0.8 * a); } }
      put(c, E, 'far', 0.3, p); put(c, E, 'mid', 0.5, p);
      glow(c, '150,90,230', ax, 340, 300, 0.08 + 0.18 * ign, 0.7);
      put(c, E, 'arch', 0.8, p);
      // el portal: remolino de brasas en el hueco
      c.save(); c.beginPath(); c.rect(ax - 76, 215, 152, 235); c.clip();
      var pr = 0.25 + 0.75 * ign; c.fillStyle = 'rgb(' + Math.round(8 + 30 * ign) + ',' + Math.round(4 + 10 * ign) + ',' + Math.round(12 + 40 * ign) + ')'; c.fillRect(ax - 76, 215, 152, 235);
      glow(c, '255,150,60', ax, 335, 170 * pr, 0.6 * pr * fl); glow(c, '255,230,160', ax, 335, 50 * pr, 0.8 * pr);
      c.globalCompositeOperation = 'lighter'; var n = Math.round(60 * pr), k, ang, rad;
      for (k = 0; k < n; k++) { var q = (k * 0.618) % 1; ang = (t / (calm ? 2600 : 1400)) * (1 + q) + k * 2.399; rad = (0.2 + q * 0.8) * 90 * (0.7 + 0.3 * Math.sin(t / 900 + k)); c.fillStyle = k % 3 ? 'rgba(255,150,60,' + (0.7 * pr).toFixed(2) + ')' : 'rgba(255,230,170,' + (0.8 * pr).toFixed(2) + ')'; c.fillRect(ax + Math.cos(ang) * rad * 0.8, 335 + Math.sin(ang) * rad * 1.15, 2.4, 2.4); }
      c.restore();
      glow(c, '255,150,60', ax, 335, 220, 0.18 * ign * fl, 0.8);
      put(c, E, 'ground', 0.8, p);
      // Marlo camina hacia el arco (se va haciendo pequeño)
      var u = sm(0.05, 0.85, p), mx = lerp(cx - 330, cx - 22, u) + gx, my = lerp(500, 462, u), ms = lerp(2.8, 1.5, u);
      marlo(c, u < 0.98 ? 'walk' : 'idle', mx, my, t, { scale: ms, side: 1, lit: 0.4 + ign * 0.6, calm: calm, alpha: 1 - sm(0.9, 1, p) * 0.0 });
      glow(c, '255,150,60', ax, 455, 200, 0.18 * ign * fl, 0.3);
      embers(c, ax, 440, 220, 300, 30, t, calm, { seed: 9, alpha: ign });
      darkness(c, V, ax, 340, V.VW * 0.68, 0.6);
      put(c, E, 'fg', 1, p); pushShadow(c, V);
    }
  };

  // ================================================================== LOGO y TITULO
  var LOGO = {};
  function logoImg(w) {
    var W = Math.round(w), key = 'L' + W; if (LOGO[key]) return LOGO[key];
    var sw = W, sh = Math.round(W * 0.42), c = mk(sw, sh), g = c.getContext('2d'), fs1 = sw * 0.2, fs2 = sw * 0.16;
    var font = '900 %px "Arial Black","Impact","Trebuchet MS",Arial,sans-serif';
    function txt(s, y, fs) {
      g.font = font.replace('%', Math.round(fs)); g.textAlign = 'center'; g.textBaseline = 'alphabetic';
      try { g.letterSpacing = Math.round(fs * 0.06) + 'px'; } catch (e) { /* sin letterSpacing */ }
      g.lineJoin = 'round'; g.lineWidth = fs * 0.2; g.strokeStyle = OL; g.strokeText(s, sw / 2, y);
      g.lineWidth = fs * 0.07; g.strokeStyle = '#4a0c06'; g.strokeText(s, sw / 2, y);
      var gr = g.createLinearGradient(0, y - fs * 0.78, 0, y); gr.addColorStop(0, '#fff0b0'); gr.addColorStop(0.28, '#ffc040'); gr.addColorStop(0.62, '#f06a1c'); gr.addColorStop(1, '#8a1a0a');
      g.fillStyle = gr; g.fillText(s, sw / 2, y);
      // grietas de brasa: lineas oscuras irregulares encima
      g.save(); g.globalCompositeOperation = 'source-atop'; var r = rng(s.length * 31), i; g.strokeStyle = 'rgba(70,10,4,0.55)'; g.lineWidth = Math.max(1, fs * 0.018);
      for (i = 0; i < 9; i++) { var x = sw * 0.12 + r() * sw * 0.76, yy = y - fs * (0.15 + r() * 0.5); g.beginPath(); g.moveTo(x, yy); g.lineTo(x + (r() - 0.5) * fs * 0.3, yy + fs * 0.16); g.lineTo(x + (r() - 0.5) * fs * 0.3, yy + fs * 0.3); g.stroke(); }
      g.restore();
    }
    txt('SWARM', sh * 0.5, fs1); txt('HAND', sh * 0.5 + fs2 * 0.95, fs2);
    return (LOGO[key] = c);
  }
  // logo: (cx,cy)=centro, w=ancho. t en ms. opts: p (aparicion 0..1, def 1), calm
  function logo(c, cx, cy, w, t, o) {
    o = o || {}; var p = o.p == null ? 1 : clamp(o.p, 0, 1), im = logoImg(w), calm = !!o.calm, fl = flick(t || 0, calm, 7), h = im.height;
    if (p <= 0) return;
    c.save(); c.globalAlpha = p; c.translate(cx, cy);
    glow(c, '255,110,30', 0, 0, w * 0.62, (0.2 + 0.1 * p) * fl, 0.5);
    var s = 1 + (1 - p) * 0.06; c.scale(s, s);
    c.imageSmoothingEnabled = true; c.drawImage(im, -im.width / 2, -h / 2);
    c.globalCompositeOperation = 'lighter'; c.globalAlpha = p * (0.1 + 0.08 * (calm ? 0.5 : Math.sin((t || 0) / 300))); c.drawImage(im, -im.width / 2, -h / 2);   // la brasa respira
    c.restore();
    embers(c, cx, cy + h * 0.3, w * 0.8, h * 1.3, 22, t || 0, calm, { seed: 3, alpha: p });
    if (o.sub !== false) {
      c.save(); c.globalAlpha = p * sm(0.5, 1, p); c.font = 'italic ' + Math.round(w * 0.05) + 'px Georgia,"Times New Roman",serif'; c.textAlign = 'center'; c.textBaseline = 'middle';
      c.fillStyle = '#e8c890'; c.shadowColor = '#000'; c.shadowBlur = 0; c.fillText(o.sub || 'Apaga las seis llamas.', cx, cy + h * 0.62); c.restore();
    }
  }
  var TIT = null;
  function title(c, w, h, t, o) {
    o = o || {}; var calm = !!o.calm, V = view(w, h, o), s = V.s, e = layers('title', w, h, o, {
      sky: { paint: function (g, Vv) { skyGrad(g, -Vv.pad, Vv.VW + Vv.pad * 2, [0, '#040309', 0.5, '#0e0817', 0.85, '#241426', 1, '#331c1c']); stars(g, -Vv.pad, Vv.VW + Vv.pad * 2, 130, 211, 330, true); } },
      far: { paint: function (g, Vv) { ridge(g, -Vv.pad, Vv.VW + Vv.pad, 380, 50, '#110a18', 213, 0.007); ridge(g, -Vv.pad, Vv.VW + Vv.pad, 420, 34, '#0b0712', 217, 0.011); var r = rng(8), i, x; for (i = 0; i < 6; i++) { x = -Vv.pad + 60 + i * ((Vv.VW + Vv.pad * 2 - 120) / 5) + r() * 24; if (i % 2) pine(g, x, 450, 120 + r() * 40, '#08050c'); else houseSil(g, x, 452, 66, 46, '#0a060e', '#9a4c18', { one: true }); } } },
      ground: { paint: function (g, Vv) { ground(g, Vv, 450, '#120b14', '#05030a'); grassBlades(g, Vv, '#0b0710', 5, 500, 50); } },
      fg: { paint: function (g, Vv) { edgePines(g, Vv, '#030106', 219, 400); } }
    }), p = 0.5 + Math.sin(t / 9000) * 0.5 * (calm ? 0.3 : 1), cx = V.VW / 2, fl = flick(t, calm, 6), i;
    c.save(); c.beginPath(); c.rect(0, 0, w, h); c.clip(); c.scale(s, s);
    put(c, e, 'sky', 0.1, p); put(c, e, 'far', 0.3, p);
    glow(c, '255,110,40', cx, 470, V.VW * 0.5, 0.12 * fl, 0.4);
    put(c, e, 'ground', 0.6, p);
    // fogata pequeña abajo: luz de la portada
    var fx = cx + (0.5 - p) * V.pad * 1.2; flame(c, fx, 496, 40, t, calm, 0); flame(c, fx - 12, 498, 26, t, calm, 2); glow(c, '255,170,70', fx, 480, 90, 0.35 * fl, 0.7);
    embers(c, fx, 480, 80, 460, 44, t, calm, { seed: 2 });
    if (!calm) { c.fillStyle = '#fff4dc'; for (i = 0; i < 8; i++) { var tw = (Math.sin(t / 700 + i * 2.7) + 1) / 2; c.globalAlpha = 0.1 + tw * 0.45; c.fillRect(((i * 211) % (V.VW + 40)) - 20, 30 + (i * 61) % 250, 2, 2); } c.globalAlpha = 1; }
    var lp = o.logoP == null ? sm(300, 1900, t) : o.logoP;
    logo(c, cx, 180, Math.min(420, V.VW * 0.46), t, { p: lp, calm: calm, sub: o.sub });
    c.restore();
    // brasas grandes de primer plano (cruzan el logo, desenfocadas)
    c.save(); c.scale(s, s); embers(c, cx, VH + 10, V.VW * 0.9, VH * 1.1, 14, t, calm, { seed: 7, alpha: 0.5, speed: 0.7 }); c.restore();
    c.save(); c.scale(s, s); put(c, e, 'fg', 1, p); c.restore();
    vignette(c, w, h, { strength: o.vig == null ? 1 : o.vig });
    if (o.prompt !== false) {
      var txt = o.text || 'TOCA PARA JUGAR', ta = calm ? 0.62 + 0.38 * (0.5 + 0.5 * Math.sin(t / 700)) : (Math.floor(t / 520) % 2 ? 0.35 : 1);   // calm: pulso suave, sin parpadeo duro
      ta *= sm(1800, 2600, t);
      if (ta > 0.01) {
        c.save(); c.globalAlpha = ta; c.font = 'bold ' + Math.round(Math.max(15, h * 0.046)) + 'px "Trebuchet MS",Arial,sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle';
        try { c.letterSpacing = Math.round(h * 0.008) + 'px'; } catch (er) { /* sin letterSpacing */ }
        c.lineJoin = 'round'; c.lineWidth = Math.max(4, h * 0.012); c.strokeStyle = 'rgba(8,3,10,0.9)'; c.strokeText(txt, w / 2, h * 0.79); c.fillStyle = '#ffe2a0'; c.fillText(txt, w / 2, h * 0.79); c.restore();
      }
    }
    if (o.fadeIn !== false) fade(c, w, h, 1 - sm(0, 900, t));
    return true;
  }

  // ================================================================== API publica
  var list = [], k;
  var ORDER = ['fogata', 'hogar', 'brasa', 'rescoldos', 'ruinas', 'bufanda', 'portal'];
  for (k = 0; k < ORDER.length; k++) list.push({ id: ORDER[k], name: SC[ORDER[k]].name, dur: SC[ORDER[k]].dur });
  A.cine = {
    list: list,
    ids: ORDER.slice(),
    dur: function (id) { return SC[id] ? SC[id].dur : 0; },
    // dibuja la escena `id` a pantalla completa (0,0,w,h) en ctx. t = ms desde el inicio de la viñeta. opts: {p, calm, lite, vignette, vig, bars}
    scene: function (id, ctx, w, h, t, opts) { try { return runScene(id, ctx, w, h, t || 0, opts); } catch (e) { if (window.console) console.warn('assets_cine.scene', id, e); try { ctx.restore(); } catch (x) { /* */ } return false; } },
    // precalcula las capas (llamar durante la viñeta anterior para evitar el tiron al cambiar)
    preload: function (id, w, h, opts) { try { var S = SC[id]; if (id === 'title') { return true; } if (S) { layers(id, w, h, opts || {}, S.layers); return true; } } catch (e) { /* */ } return false; },
    title: function (ctx, w, h, t, opts) { try { return title(ctx, w, h, t || 0, opts); } catch (e) { if (window.console) console.warn('assets_cine.title', e); return false; } },
    logo: function (ctx, cx, cy, w, t, opts) { try { logo(ctx, cx, cy, w, t, opts); } catch (e) { /* */ } },
    marlo: function (ctx, pose, x, y, t, opts) { try { marlo(ctx, pose, x, y, t || 0, opts); } catch (e) { /* */ } },
    lanudo: function (ctx, pose, x, y, t, opts) { try { lanudo(ctx, pose, x, y, t || 0, opts); } catch (e) { /* */ } },
    silhouette: function (ctx, bossId, x, y, s, opts) { opts = opts || {}; try { bossSil(ctx, bossId, x, y, s || 1, opts.color || '#030204', opts.eye || null, opts.t || 0, !!opts.calm); } catch (e) { /* */ } },
    vignette: function (ctx, w, h, opts) { try { vignette(ctx, w, h, opts); } catch (e) { /* */ } },
    letterbox: function (ctx, w, h, p, opts) { letterbox(ctx, w, h, p, opts); },
    fade: function (ctx, w, h, a, color) { fade(ctx, w, h, a, color); },
    free: function () { CACHE.length = 0; GR = {}; GRN = 0; LOGO = {}; }
  };
})();
