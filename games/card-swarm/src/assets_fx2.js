/* assets_fx2.js - Arte FX 2 (Director de arte): escudo del Cristal en perspectiva (dos pasadas), hielo facetado, impactos/explosiones con
   particulas, estelas y estados sobre enemigos. Cargar DESPUES de assets_fusion3.js (y antes de fusion.js). Contrato en ../ASSETS_API.md (seccion "FX 2").
   Tecnicas inspiradas en la web de efectos pixelfx (MIT) reescritas aqui en canvas 2D suave: SIN lectura/escritura de pixeles por CPU,
   sprites cacheados offscreen (x2), gradientes/formas, pool de particulas acotado por G.Q.partCap, azar cosmetico solo con Math.random/G.rndFx
   (nunca G.rng) y sin tocar la simulacion. ?fx2=0 desactiva todo y devuelve el arte anterior (comparaciones y mediciones A/B).
   Reducir destellos (G.Cine.cfg().calm): sin flares, brillos <= 25 %, menos chispas. Reducir sacudidas no aplica (no hay sacudidas aqui). */
(function () {
  'use strict';
  var G = window.G; if (!G || !G.FusionArt2) return;
  var B = G.FusionArt2, A1 = G.FusionArt || {}, TAU = 6.283185, OUT = '#0c0814', S2 = 2;
  var FX2 = G.Fx2 = { on: !/[?&]fx2=0(&|$)/.test(location.search), prof: /[?&]fx2prof=1(&|$)/.test(location.search) ? {} : null, old: {}, version: 1 };
  var PR = G.Proj;

  function cl(v) { return v < 0 ? 0 : v > 1 ? 1 : v; }
  function T() { return (G.time || 0) / 1000; }
  function rnd(i) { var x = Math.sin(i * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); }
  function rf(a, b) { return G.rndFx ? G.rndFx(a, b) : a + Math.random() * (b - a); }
  function calm() { try { return !!(G.Cine && G.Cine.cfg && G.Cine.cfg().calm); } catch (e) { return false; } }
  function K() { return PR && PR.iso ? PR.K : 1; }
  function begin(c) { var k = K(); c.save(); if (k !== 1) c.scale(1, 1 / k); return k; }   // espacio de PANTALLA: un punto de suelo (x,y) va en (x, y*K)

  /* ---------- sprites cacheados offscreen (x2) ---------- */
  var CA = {};
  function cache(key, w, h, fn) {
    var e = CA[key]; if (e) return e;
    var cv = document.createElement('canvas'); cv.width = Math.ceil(w * S2); cv.height = Math.ceil(h * S2);
    var g = cv.getContext('2d'); g.scale(S2, S2); g.translate(w / 2, h / 2); g.lineJoin = 'round'; g.lineCap = 'round'; fn(g, w, h);
    cv.lw = w; cv.lh = h; CA[key] = cv; return cv;
  }
  function put(c, cv, x, y, sc, rot, alpha) {   // dibuja un sprite cacheado centrado en (x,y)
    sc = sc || 1; if (alpha != null) c.globalAlpha = alpha;
    if (rot) { c.save(); c.translate(x, y); c.rotate(rot); c.drawImage(cv, -cv.lw * sc / 2, -cv.lh * sc / 2, cv.lw * sc, cv.lh * sc); c.restore(); }
    else c.drawImage(cv, x - cv.lw * sc / 2, y - cv.lh * sc / 2, cv.lw * sc, cv.lh * sc);
  }
  function glowSpr(rgb) {
    return cache('gl' + rgb, 64, 64, function (g) {
      var gr = g.createRadialGradient(0, 0, 0, 0, 0, 32); gr.addColorStop(0, 'rgba(' + rgb + ',1)'); gr.addColorStop(0.35, 'rgba(' + rgb + ',0.45)'); gr.addColorStop(1, 'rgba(' + rgb + ',0)');
      g.fillStyle = gr; g.fillRect(-32, -32, 64, 64);
    });
  }
  function glowAt(c, x, y, r, rgb, a) {   // resplandor aditivo con sprite (sin crear gradientes por frame)
    var ga = c.globalAlpha; c.globalCompositeOperation = 'lighter'; put(c, glowSpr(rgb), x, y, r / 32, 0, ga * (calm() ? Math.min(a, 0.25) : a)); c.globalCompositeOperation = 'source-over'; c.globalAlpha = ga;
  }
  // Flare de 8 rayos de longitud decreciente (cardinales largos, diagonales cortos, y cada grupo mas corto que el anterior)
  var RAYL = [1, 0.5, 0.82, 0.42, 0.66, 0.36, 0.5, 0.3];
  function flareSpr(rgb) {
    return cache('fl' + rgb, 96, 96, function (g) {
      var i, a, L, w;
      var gr = g.createRadialGradient(0, 0, 0, 0, 0, 22); gr.addColorStop(0, 'rgba(255,255,255,0.95)'); gr.addColorStop(0.3, 'rgba(' + rgb + ',0.55)'); gr.addColorStop(1, 'rgba(' + rgb + ',0)'); g.fillStyle = gr; g.fillRect(-48, -48, 96, 96);
      for (i = 0; i < 8; i++) {
        a = i * 0.7854; L = 46 * RAYL[i]; w = 3.6 * (0.55 + 0.45 * RAYL[i]);
        g.save(); g.rotate(a); g.fillStyle = 'rgba(' + rgb + ',0.75)'; g.beginPath(); g.moveTo(L, 0); g.lineTo(0, -w); g.lineTo(-L * 0.18, 0); g.lineTo(0, w); g.closePath(); g.fill();
        g.fillStyle = 'rgba(255,255,255,0.9)'; g.beginPath(); g.moveTo(L * 0.8, 0); g.lineTo(0, -w * 0.4); g.lineTo(0, w * 0.4); g.closePath(); g.fill(); g.restore();
      }
    });
  }

  /* ---------- paletas de 3 tonos (luz, medio, sombra) ---------- */
  var TONE = {
    ice: ['#e8fbff', '#82cff2', '#3f7fc4'], pink: ['#ffd2e4', '#e0749e', '#8c2c5e'], hot: ['#ffe2a0', '#e8782a', '#7a2a14'],
    metal: ['#eef2fa', '#9aa4b8', '#4a5268'], char: ['#b8bca8', '#6a7060', '#2e322a'], green: ['#dfffb0', '#8ad03a', '#3e7a20'], stone: ['#d8c8b8', '#9a8470', '#52443a']
  };

  /* =====================================================================================
     (2) HIELO: cristal facetado, lanza, escarcha de suelo, copos
     ===================================================================================== */
  // Cristal prismatico de pie (24 x 48 logicos). tone: 'ice' | 'pink'
  function crystalSpr(tone) {
    return cache('cr' + tone, 28, 54, function (g) {
      var t = TONE[tone] || TONE.ice, tip = [1, -24], L = [-10, -9], R = [10, -8], BL = [-8, 22], BR = [8, 22], M1 = [-3, -10], M2 = [4, -9], B1 = [-3, 22], B2 = [4, 22];
      function poly(p, col) { g.fillStyle = col; g.beginPath(); g.moveTo(p[0][0], p[0][1]); for (var i = 1; i < p.length; i++) g.lineTo(p[i][0], p[i][1]); g.closePath(); g.fill(); }
      poly([tip, L, BL, B1, M1], t[0]); poly([tip, M1, B1, B2, M2], t[1]); poly([tip, M2, B2, BR, R], t[2]);
      var gr = g.createLinearGradient(0, -24, 0, 22); gr.addColorStop(0, 'rgba(255,255,255,0.55)'); gr.addColorStop(0.5, 'rgba(255,255,255,0.05)'); gr.addColorStop(1, 'rgba(10,30,80,0.3)');
      g.fillStyle = gr; g.beginPath(); g.moveTo(tip[0], tip[1]); g.lineTo(L[0], L[1]); g.lineTo(BL[0], BL[1]); g.lineTo(BR[0], BR[1]); g.lineTo(R[0], R[1]); g.closePath(); g.fill();
      g.strokeStyle = 'rgba(255,255,255,0.85)'; g.lineWidth = 1; g.beginPath(); g.moveTo(M1[0], M1[1]); g.lineTo(tip[0], tip[1]); g.lineTo(M2[0], M2[1]); g.moveTo(M1[0], M1[1]); g.lineTo(B1[0], B1[1]); g.moveTo(M2[0], M2[1]); g.lineTo(B2[0], B2[1]); g.stroke();
      g.strokeStyle = OUT; g.lineWidth = 1.6; g.beginPath(); g.moveTo(tip[0], tip[1]); g.lineTo(L[0], L[1]); g.lineTo(BL[0], BL[1]); g.lineTo(BR[0], BR[1]); g.lineTo(R[0], R[1]); g.closePath(); g.stroke();
      g.fillStyle = 'rgba(255,255,255,0.8)'; g.beginPath(); g.moveTo(-7, -4); g.lineTo(-5, -4); g.lineTo(-5, 10); g.lineTo(-7, 8); g.closePath(); g.fill();   // reflejo vertical fijo
    });
  }
  // Lanza de hielo apuntando a +x (36 x 16 logicos)
  function lanceSpr(crit) {
    return cache('ln' + (crit ? 1 : 0), 40, 18, function (g) {
      var A = crit ? ['#fffbe0', '#ffe58a', '#d99a2a'] : TONE.ice;
      function poly(p, col) { g.fillStyle = col; g.beginPath(); g.moveTo(p[0][0], p[0][1]); for (var i = 1; i < p.length; i++) g.lineTo(p[i][0], p[i][1]); g.closePath(); g.fill(); }
      poly([[18, 0], [-1, -5.5], [-14, 0]], A[0]); poly([[18, 0], [-1, 5.5], [-14, 0]], A[2]);
      poly([[18, 0], [3, -2], [-14, 0], [3, 2]], A[1]);
      g.fillStyle = A[2]; g.beginPath(); g.moveTo(-6, 0); g.lineTo(-13, -7); g.lineTo(-10, 0); g.lineTo(-13, 7); g.closePath(); g.fill();   // aletas de cristal
      g.strokeStyle = '#fff'; g.lineWidth = 1; g.beginPath(); g.moveTo(18, 0); g.lineTo(-14, 0); g.stroke();
      g.strokeStyle = OUT; g.lineWidth = 1.4; g.beginPath(); g.moveTo(18, 0); g.lineTo(-1, -5.5); g.lineTo(-6, -2); g.lineTo(-13, -7); g.lineTo(-10, 0); g.lineTo(-13, 7); g.lineTo(-6, 2); g.lineTo(-1, 5.5); g.closePath(); g.stroke();
    });
  }
  // Escarcha de suelo: disco palido con dendritas de 6 ejes (128 x 128 logicos)
  function frostSpr() {
    return cache('frost', 128, 128, function (g) {
      var gr = g.createRadialGradient(0, 0, 4, 0, 0, 62); gr.addColorStop(0, 'rgba(225,245,255,0.55)'); gr.addColorStop(0.7, 'rgba(180,225,250,0.28)'); gr.addColorStop(1, 'rgba(160,215,250,0)');
      g.fillStyle = gr; g.beginPath(); g.arc(0, 0, 62, 0, TAU); g.fill();
      g.strokeStyle = 'rgba(240,252,255,0.8)'; g.lineWidth = 1.4;
      var i, j, a, L, bx, by;
      for (i = 0; i < 6; i++) {
        a = i * 1.0472 + 0.2; g.beginPath(); g.moveTo(0, 0); g.lineTo(Math.cos(a) * 54, Math.sin(a) * 54); g.stroke();
        for (j = 1; j <= 3; j++) {
          L = 9 + j * 3; bx = Math.cos(a) * j * 15; by = Math.sin(a) * j * 15;
          g.beginPath(); g.moveTo(bx, by); g.lineTo(bx + Math.cos(a + 0.9) * L, by + Math.sin(a + 0.9) * L); g.moveTo(bx, by); g.lineTo(bx + Math.cos(a - 0.9) * L, by + Math.sin(a - 0.9) * L); g.stroke();
        }
      }
      g.fillStyle = 'rgba(255,255,255,0.85)'; for (i = 0; i < 14; i++) { a = rnd(i) * TAU; L = 14 + rnd(i + 7) * 40; g.beginPath(); g.moveTo(Math.cos(a) * L, Math.sin(a) * L - 2.2); g.lineTo(Math.cos(a) * L + 1.6, Math.sin(a) * L); g.lineTo(Math.cos(a) * L, Math.sin(a) * L + 2.2); g.lineTo(Math.cos(a) * L - 1.6, Math.sin(a) * L); g.closePath(); g.fill(); }
    });
  }
  // Escarcha en el suelo: x,y logicos, r radio, a alfa. En iso se aplasta sola (se dibuja en espacio de suelo).
  function frost(c, x, y, r, a, rot) {
    var cv = frostSpr(); c.save(); c.translate(x, y); if (rot) c.rotate(rot); c.globalAlpha = cl(a) * (calm() ? 0.8 : 1);
    c.drawImage(cv, -r, -r, r * 2, r * 2); c.restore();   // en espacio de suelo: en iso el contexto ya esta aplastado
  }
  // Copo de 6 brazos (x,y pantalla; s tamano)
  function flake(c, x, y, s, rot) {
    c.save(); c.translate(x, y); c.rotate(rot); c.beginPath();
    for (var i = 0; i < 3; i++) { var a = i * 1.0472, ca = Math.cos(a) * s, sa = Math.sin(a) * s; c.moveTo(-ca, -sa); c.lineTo(ca, sa); }
    c.stroke(); c.restore();
  }
  // Destello barrido sobre un cristal: franja diagonal blanca que cruza de izquierda a derecha cada ciclo (cx,cy centro, h altura)
  function glintBar(c, cx, cy, h, w, ph) {   // ph 0..1
    if (ph > 0.5) return; var u = ph / 0.5, a = Math.sin(u * 3.1416) * (calm() ? 0.25 : 0.9), x0 = cx - w + u * w * 2;
    c.globalCompositeOperation = 'lighter'; c.fillStyle = 'rgba(255,255,255,' + a + ')'; c.beginPath(); c.moveTo(x0 - 1.5, cy - h * 0.4); c.lineTo(x0 + 2.5, cy - h * 0.4); c.lineTo(x0 + 0.5, cy + h * 0.35); c.lineTo(x0 - 3.5, cy + h * 0.35); c.closePath(); c.fill(); c.globalCompositeOperation = 'source-over';
  }

  /* =====================================================================================
     (1) ESCUDO del Cristal de sangre: anillo inclinado, mitad lejana DETRAS y cercana DELANTE
     ===================================================================================== */
  var BLUE = TONE.ice, PINK = TONE.pink;
  function tonePick(k, off) { var i = Math.round((1 - k) * 2) + off; return i < 0 ? 0 : i > 2 ? 2 : i; }
  function shard(c, px, py, a, s, pink, glint, crack, u, blood) {
    var w = (2.6 + 4.6 * Math.abs(Math.sin(a))) * s, hT = 17 * s, hB = 11 * s, hM = -2 * s, T = pink ? PINK : BLUE, k = 0.5 + 0.5 * Math.cos(a - 2.4), li = tonePick(k, 0), ri = li >= 2 ? 1 : Math.min(2, li + 1);
    c.fillStyle = T[li]; c.beginPath(); c.moveTo(px, py - hT); c.lineTo(px - w, py + hM); c.lineTo(px, py + hM * 0.2); c.closePath(); c.fill();
    c.fillStyle = T[ri]; c.beginPath(); c.moveTo(px, py - hT); c.lineTo(px + w, py + hM); c.lineTo(px, py + hM * 0.2); c.closePath(); c.fill();
    c.fillStyle = T[Math.min(2, li + 1)]; c.beginPath(); c.moveTo(px - w, py + hM); c.lineTo(px, py + hB); c.lineTo(px, py + hM * 0.2); c.closePath(); c.fill();
    c.fillStyle = T[Math.min(2, ri + 1)]; c.beginPath(); c.moveTo(px + w, py + hM); c.lineTo(px, py + hB); c.lineTo(px, py + hM * 0.2); c.closePath(); c.fill();
    if (blood) { c.fillStyle = 'rgba(208,32,72,0.85)'; c.beginPath(); c.moveTo(px, py - 4 * s); c.quadraticCurveTo(px + 2.2 * s, py, px, py + 3 * s); c.quadraticCurveTo(px - 2.2 * s, py, px, py - 4 * s); c.fill(); }
    if (glint > 0) { c.fillStyle = 'rgba(255,255,255,' + (0.7 * glint) + ')'; c.beginPath(); c.moveTo(px, py - hT); c.lineTo(px - w, py + hM); c.lineTo(px, py + hM * 0.2); c.closePath(); c.fill(); }
    c.strokeStyle = OUT; c.lineWidth = 1.3; c.beginPath(); c.moveTo(px, py - hT); c.lineTo(px + w, py + hM); c.lineTo(px, py + hB); c.lineTo(px - w, py + hM); c.closePath(); c.stroke();
    c.strokeStyle = 'rgba(255,255,255,0.75)'; c.lineWidth = 0.9; c.beginPath(); c.moveTo(px, py - hT + 1); c.lineTo(px, py + hB - 1); c.moveTo(px - w + 1, py + hM); c.lineTo(px + w - 1, py + hM); c.stroke();
    if (crack && u < 0.6) { c.strokeStyle = '#fff'; c.lineWidth = 1; c.beginPath(); c.moveTo(px - w * 0.5, py - hT * 0.4 - (1 - u) * 2); c.lineTo(px + w * 0.1, py); c.lineTo(px - w * 0.2, py + hB * 0.6); c.stroke(); if (u < 0.3) { c.strokeStyle = '#d02048'; c.beginPath(); c.moveTo(px + w * 0.6, py - hT * 0.3); c.lineTo(px, py + 2 * s); c.stroke(); } }
  }
  function wardPass(c, x, y, r, t, alpha, u, front) {
    u = u == null ? 1 : cl(u);
    var n = u > 0.5 ? 8 : 6, blink = u < 0.2 ? (Math.sin(t * 22) > 0 ? 1 : 0.3) : 1, k = begin(c), cy = y * k - 6, rx = r * 0.95, ry = rx * 0.34, s = Math.max(0.8, r / 56), i, a, sn, px, py, g = (t * 1.7) % TAU, d, gl, pass = [];
    c.globalAlpha = cl(alpha) * blink;
    if (!front) {   // fondo: escarcha de suelo bajo los pies + resplandor + arco lejano
      c.save(); c.translate(x, y * k + 14); c.scale(1, 0.55); c.globalAlpha = cl(alpha) * blink * 0.38 * (0.4 + 0.6 * u); c.drawImage(frostSpr(), -rx * 1.15, -rx * 1.15, rx * 2.3, rx * 2.3); c.restore();
      glowAt(c, x, cy, r * 1.05, '140,170,255', 0.26 * (0.5 + 0.5 * u) * cl(alpha) * blink);
    }
    c.lineCap = 'round';
    c.strokeStyle = 'rgba(216,106,152,' + ((front ? 0.75 : 0.4) * (0.5 + 0.5 * u)) + ')'; c.lineWidth = front ? 2.6 : 2; c.beginPath(); c.ellipse(x, cy, rx, ry, 0, front ? 0 : Math.PI, front ? Math.PI : TAU); c.stroke();
    c.strokeStyle = 'rgba(190,235,255,' + (front ? 0.6 : 0.3) + ')'; c.lineWidth = 1; c.beginPath(); c.ellipse(x, cy - 3, rx, ry, 0, front ? 0 : Math.PI, front ? Math.PI : TAU); c.stroke();
    a = Math.max(g - 0.35, front ? 0 : Math.PI), d = Math.min(g + 0.35, front ? Math.PI : TAU);   // brillo que barre el anillo
    if (a < d) { c.globalCompositeOperation = 'lighter'; c.strokeStyle = 'rgba(255,255,255,' + (calm() ? 0.2 : 0.85) + ')'; c.lineWidth = 1.8; c.beginPath(); c.ellipse(x, cy, rx, ry, 0, a, d); c.stroke(); c.globalCompositeOperation = 'source-over'; }
    for (i = 0; i < n; i++) {   // orden de dibujo: de lo mas lejano a lo mas cercano de esta mitad
      a = t * 0.7 + i * TAU / n; sn = Math.sin(a); if ((sn >= 0) !== front) continue; pass.push([sn, a, i]);
    }
    pass.sort(function (p, q) { return p[0] - q[0]; });
    for (i = 0; i < pass.length; i++) {
      a = pass[i][1]; px = x + Math.cos(a) * rx; py = cy + Math.sin(a) * ry;
      d = (((a - g) % TAU) + TAU) % TAU; if (d > Math.PI) d = TAU - d; gl = Math.max(0, 1 - d / 0.55); if (calm()) gl *= 0.3;
      c.globalAlpha = cl(alpha) * blink * (front ? 1 : 0.8);
      shard(c, px, py, a, s, pass[i][2] % 2 === 1, gl, true, u, pass[i][2] % 3 === 0);
      if (gl > 0.55 && !calm()) { c.globalAlpha = cl(alpha) * blink; c.globalCompositeOperation = 'lighter'; put(c, flareSpr('200,235,255'), px, py - 9 * s, 0.32 * gl + 0.1, t * 0.6); c.globalCompositeOperation = 'source-over'; }
    }
    c.restore();
  }
  function wardBack(c, x, y, r, t, alpha, u) { wardPass(c, x, y, r, t, alpha, u, false); }
  function wardFront(c, x, y, r, t, alpha, u) { wardPass(c, x, y, r, t, alpha, u, true); }
  function wardBoth(c, x, y, r, t, alpha, u) { wardPass(c, x, y, r, t, alpha, u, false); wardPass(c, x, y, r, t, alpha, u, true); }
  function wardBackAuto(c) {   // lo llama fusion.js drawGround (mitad lejana, ANTES de pintar al personaje): busca el poder 'cristal' activo
    var p = G.player; if (!p || !(p.ward > 0) || !p.actives) return;
    for (var i = 0; i < p.actives.length; i++) { var s = p.actives[i]; if (s && s.id === 'cristal' && s.st && s.st.t > 0) { wardBack(c, p.x, p.y, s.lvl > 1 ? 66 : 56, T(), 1, Math.max(0, p.ward / (s.st.max || 1))); return; } }
  }

  /* =====================================================================================
     (3) Particulas: chispas con gravedad y rebote, escombros de 3 tonos, fuego->humo, estelas, flares
     ===================================================================================== */
  var NP = 72, pool = [], i0, lastT = 0, spawnBudget = 0, lastBudgetT = 0, onceMap = {}, onceN = 0;
  for (i0 = 0; i0 < NP; i0++) pool.push({ k: 0, x: 0, y: 0, z: 0, vx: 0, vy: 0, vz: 0, life: 0, max: 1, rot: 0, vr: 0, sz: 1, c1: '', c2: '', tone: null, sh: 0, bn: 0, hx: [0, 0, 0, 0, 0], hy: [0, 0, 0, 0, 0], hT: 0, g: 0 });
  function cap() { var Q = G.Q || {}, q = Math.floor((Q.partCap || 100) * 0.22); return Math.max(10, Math.min(NP, q)); }
  function alloc(k) {
    var cp = cap(), i, n = 0, p;
    for (i = 0; i < NP; i++) if (pool[i].k) n++;
    if (n >= cp) return null;
    for (i = 0; i < NP; i++) if (!pool[i].k) { p = pool[i]; p.k = k; p.bn = 0; p.hT = 0; p.sh = 0; for (n = 0; n < 5; n++) { p.hx[n] = p.hy[n] = 0; } return p; }
    return null;
  }
  function once(key, ms) { var t = G.time || 0; if (t - (onceMap[key] || -1e9) < ms) return false; onceMap[key] = t; if (++onceN > 200) { onceMap = {}; onceN = 0; } return true; }
  function live() { return G.state === 'play' && !(G.Manual && G.Manual.isOpen && G.Manual.isOpen()); }   // el azar de las particulas solo corre en combate real: la demo del Manual sigue siendo determinista
  function budgetOk(cost) {   // como mucho ~ 2 explosiones por 100 ms (el resto se descarta): topes de rendimiento en combates densos
    var t = G.time || 0; if (t - lastBudgetT > 100) { lastBudgetT = t; spawnBudget = 0; } if (spawnBudget >= 2) return false; spawnBudget += cost || 1; return true;
  }
  function spark(x, y, z, ang, sp, col, life) {
    var p = alloc(1); if (!p) return; p.x = x; p.y = y; p.z = z; p.vx = Math.cos(ang) * sp; p.vy = Math.sin(ang) * sp * 0.6; p.vz = rf(60, 220); p.life = p.max = life || rf(450, 800); p.c1 = col; p.sz = rf(2.2, 3.6);
    for (var i = 0; i < 5; i++) { p.hx[i] = x; p.hy[i] = y * K() - z; }
  }
  function debris(x, y, tone, sp, sz) {
    var p = alloc(2); if (!p) return; var a = rf(0, TAU); p.x = x; p.y = y; p.z = rf(2, 10); p.vx = Math.cos(a) * sp; p.vy = Math.sin(a) * sp * 0.6; p.vz = rf(110, 260); p.life = p.max = rf(700, 1100);
    p.rot = rf(0, TAU); p.vr = rf(-9, 9); p.sz = sz * rf(0.7, 1.3); p.tone = tone; p.sh = (Math.random() * 3) | 0;
  }
  function ember(x, y, big) {
    var p = alloc(3); if (!p) return; var a = rf(0, TAU), d = rf(0, 9); p.x = x + Math.cos(a) * d; p.y = y + Math.sin(a) * d * 0.6; p.z = rf(2, 8); p.vx = rf(-14, 14); p.vy = rf(-6, 6); p.vz = rf(22, 52); p.life = p.max = rf(560, 900); p.sz = (big ? 12 : 8) * rf(0.8, 1.2);
  }
  function flare(x, y, z, sz, rgb) { var p = alloc(4); if (!p) return; p.x = x; p.y = y; p.z = z; p.life = p.max = 240; p.sz = sz; p.rot = rf(0, 1); p.c1 = rgb; }
  var PAL = {
    fire: { sp: ['#fff2a8', '#ffb040', '#ff7a2a'], deb: TONE.hot, rgb: '255,190,80', smoke: true },
    plasma: { sp: ['#ffffff', '#ffe08a', '#ff9a3a'], deb: null, rgb: '255,180,70', smoke: true },
    forja: { sp: ['#ffe8a0', '#ffb347', '#ff7a2a'], deb: TONE.hot, rgb: '255,150,50', smoke: true },
    descarga: { sp: ['#f4ffb0', '#c8ff4a', '#8aff6a'], deb: TONE.char, rgb: '200,255,90', smoke: false },
    ice: { sp: ['#ffffff', '#bfeaff', '#6ac8ff'], deb: TONE.ice, rgb: '170,230,255', smoke: false },
    cristal: { sp: ['#ffffff', '#ffc0d8', '#6ac8ff'], deb: TONE.pink, rgb: '230,150,200', smoke: false },
    gas: { sp: ['#e8ffb0', '#9bff5a', '#5ad03a'], deb: null, rgb: '150,255,90', smoke: true }
  };
  // Explosion generica: n chispas, m escombros, e brasas que acaban en humo, flare central
  function explode(x, y, pal, n, m, e, fl) {
    var P = PAL[pal]; if (!P || !FX2.on || !live() || !budgetOk(1)) return; var cm = calm(), i;
    if (cm) { n = n >> 1; fl = 0; }
    for (i = 0; i < n; i++) spark(x, y, rf(0, 8), rf(0, TAU), rf(60, 190), P.sp[i % 3]);
    if (P.deb) for (i = 0; i < m; i++) debris(x, y, P.deb, rf(40, 130), rf(4, 6.5));
    for (i = 0; i < e; i++) ember(x, y, fl > 1);
    if (fl) flare(x, y, 6, fl * 1.6, P.rgb);
  }
  function stepPool(dt) {
    var i, p, ds = dt / 1000;
    for (i = 0; i < NP; i++) {
      p = pool[i]; if (!p.k) continue; p.life -= dt; if (p.life <= 0) { p.k = 0; continue; }
      if (p.k === 1 || p.k === 2) {
        p.vz -= (p.k === 1 ? 560 : 620) * ds; p.z += p.vz * ds; p.x += p.vx * ds; p.y += p.vy * ds; if (p.k === 2) p.rot += p.vr * ds;
        if (p.z < 0) { p.z = 0; if (p.vz < -50 && p.bn < 3) { p.vz = -p.vz * 0.46; p.vx *= 0.7; p.vy *= 0.7; p.bn++; if (p.k === 2) p.vr *= 0.6; } else { p.vz = 0; p.vx *= 0.82; p.vy *= 0.82; p.vr *= 0.8; if (p.k === 1) p.life -= dt * 2; } }
        if (p.k === 1) { p.hT -= dt; if (p.hT <= 0) { p.hT = 22; for (var h = 4; h > 0; h--) { p.hx[h] = p.hx[h - 1]; p.hy[h] = p.hy[h - 1]; } p.hx[0] = p.x; p.hy[0] = p.y * K() - p.z; } }
      } else if (p.k === 3) { p.x += p.vx * ds; p.y += p.vy * ds; p.z += p.vz * ds; p.vx *= 1 - 1.2 * ds; p.vz *= 1 - 0.8 * ds; }
    }
  }
  function lerp(a, b, u) { return a + (b - a) * u; }
  function drawPool(c) {
    var k = K(), i, p, u, sc, sn, cs, j, nx, ny, L, ax, ay, bx, by, sy;
    c.save(); if (k !== 1) c.scale(1, 1 / k);
    // sombras de escombros
    c.fillStyle = 'rgba(8,4,14,0.28)';
    for (i = 0; i < NP; i++) { p = pool[i]; if (p.k === 2 && p.life > 80) { c.beginPath(); c.ellipse(p.x, p.y * k + 2, p.sz * 1.4, p.sz * 0.6, 0, 0, TAU); c.fill(); } }
    // humo (normal) debajo del fuego: bocanada suave con sprite
    for (i = 0; i < NP; i++) {
      p = pool[i]; if (p.k !== 3) continue; u = 1 - p.life / p.max; if (u < 0.4) continue;
      put(c, glowSpr('84,80,92'), p.x, p.y * k - p.z, p.sz * (1.1 + 1.2 * u) / 32 * 1.6, 0, 0.55 * (1 - (u - 0.4) / 0.6) * (calm() ? 0.7 : 1));
    }
    c.globalAlpha = 1;
    // escombros: triangulo / cuadrilatero rotando con 3 tonos
    for (i = 0; i < NP; i++) {
      p = pool[i]; if (p.k !== 2) continue; sy = p.y * k - p.z; sc = p.sz; cs = Math.cos(p.rot); sn = Math.sin(p.rot); u = p.life < 220 ? p.life / 220 : 1; c.globalAlpha = u;
      var Pt = p.sh === 0 ? [[1.2, 0], [-0.8, -1], [-0.6, 0.9]] : p.sh === 1 ? [[1, -0.6], [0.6, 0.9], [-1, 0.7], [-0.8, -0.8]] : [[0.2, -1.2], [1.1, 0.5], [-1, 0.6]];
      var q = [], T3 = p.tone; for (j = 0; j < Pt.length; j++) q.push([p.x + (Pt[j][0] * cs - Pt[j][1] * sn) * sc, sy + (Pt[j][0] * sn + Pt[j][1] * cs) * sc]);
      c.fillStyle = T3[1]; c.beginPath(); c.moveTo(q[0][0], q[0][1]); for (j = 1; j < q.length; j++) c.lineTo(q[j][0], q[j][1]); c.closePath(); c.fill();
      c.fillStyle = T3[0]; c.beginPath(); c.moveTo(q[0][0], q[0][1]); c.lineTo(q[1][0], q[1][1]); c.lineTo(p.x, sy); c.closePath(); c.fill();   // cara iluminada
      c.fillStyle = T3[2]; c.beginPath(); c.moveTo(q[q.length - 1][0], q[q.length - 1][1]); c.lineTo(q[q.length - 2][0], q[q.length - 2][1]); c.lineTo(p.x, sy); c.closePath(); c.fill();   // cara en sombra
      c.strokeStyle = 'rgba(12,8,20,0.85)'; c.lineWidth = 1; c.beginPath(); c.moveTo(q[0][0], q[0][1]); for (j = 1; j < q.length; j++) c.lineTo(q[j][0], q[j][1]); c.closePath(); c.stroke();
    }
    c.globalAlpha = 1; c.globalCompositeOperation = 'lighter';
    // fuego (brasas que se enfrian: amarillo -> naranja -> rojo, luego pasan a humo)
    for (i = 0; i < NP; i++) {
      p = pool[i]; if (p.k !== 3) continue; u = 1 - p.life / p.max; if (u >= 0.5) continue; var f = u / 0.5;
      put(c, glowSpr(f < 0.35 ? '255,215,90' : f < 0.7 ? '255,135,40' : '200,50,25'), p.x, p.y * k - p.z, p.sz * (1.25 - 0.4 * f) / 32 * 1.5, 0, (calm() ? 0.5 : 0.95) * (1 - f * 0.4));
    }
    // chispas con cola de 5 puntos (poligono ahusado, 1 relleno por chispa)
    for (i = 0; i < NP; i++) {
      p = pool[i]; if (p.k !== 1) continue; u = p.life < 200 ? p.life / 200 : 1; c.globalAlpha = (calm() ? 0.4 : 1) * u; c.fillStyle = p.c1;
      ax = p.x; ay = p.y * k - p.z; var hxs = [ax], hys = [ay]; for (j = 0; j < 5; j++) { hxs.push(p.hx[j]); hys.push(p.hy[j]); }
      var Ls = [], Rs = [];
      for (j = 0; j < 6; j++) {
        var jx0 = hxs[Math.max(0, j - 1)], jy0 = hys[Math.max(0, j - 1)], jx1 = hxs[Math.min(5, j + 1)], jy1 = hys[Math.min(5, j + 1)], dx = jx1 - jx0, dy = jy1 - jy0, ll = Math.hypot(dx, dy) || 1, w = p.sz * 0.8 * (1 - j / 6);
        Ls.push([hxs[j] - dy / ll * w, hys[j] + dx / ll * w]); Rs.push([hxs[j] + dy / ll * w, hys[j] - dx / ll * w]);
      }
      c.beginPath(); c.moveTo(Ls[0][0], Ls[0][1]); for (j = 1; j < 6; j++) c.lineTo(Ls[j][0], Ls[j][1]); for (j = 5; j >= 0; j--) c.lineTo(Rs[j][0], Rs[j][1]); c.closePath(); c.fill();
      c.beginPath(); c.arc(ax, ay, p.sz * 0.75, 0, TAU); c.fill();
    }
    // flares de 8 rayos
    for (i = 0; i < NP; i++) {
      p = pool[i]; if (p.k !== 4) continue; u = 1 - p.life / p.max; put(c, flareSpr(p.c1), p.x, p.y * k - p.z, p.sz / 46 * (0.5 + 0.7 * Math.sin(Math.min(1, u * 1.6) * 1.5708)), p.rot + u * 0.5, 1 - u * u);
    }
    c.restore(); c.globalAlpha = 1; c.globalCompositeOperation = 'source-over';
  }

  /* ---------- Estelas con cola de N puntos (hasta 4 cuerpos a la vez; se asocian por cercania) ---------- */
  var TR = [], TN = 8;
  function trailPts(x, y) {
    var t = G.time || 0, i, b = null, bd = 80 * 80, tr;
    for (i = 0; i < TR.length; i++) { tr = TR[i]; if (t - tr.t > 260) { TR.splice(i--, 1); continue; } var dx = tr.x - x, dy = tr.y - y, d = dx * dx + dy * dy; if (d < bd) { bd = d; b = tr; } }
    if (!b) { if (TR.length >= 4) return null; b = { x: x, y: y, t: t, xs: [], ys: [], push: 0 }; TR.push(b); }
    b.x = x; b.y = y; b.t = t;
    if (t - b.push >= 28 || !b.xs.length) { b.push = t; b.xs.unshift(x); b.ys.unshift(y); if (b.xs.length > TN) { b.xs.pop(); b.ys.pop(); } }
    return b;
  }
  function tailDraw(c, tr, rgb, w0, a0) {   // cola ahusada de N puntos (un solo relleno)
    var n = tr.xs.length, j, L = [], R = []; if (n < 2) return; var k = K();
    for (j = 0; j < n; j++) {
      var a = Math.max(0, j - 1), b = Math.min(n - 1, j + 1), dx = tr.xs[b] - tr.xs[a], dy = (tr.ys[b] - tr.ys[a]) * k, ll = Math.hypot(dx, dy) || 1, w = w0 * (1 - j / n) * 0.5, x = tr.xs[j], y = tr.ys[j] * k;
      L.push([x - dy / ll * w, y + dx / ll * w]); R.push([x + dy / ll * w, y - dx / ll * w]);
    }
    begin(c); c.globalCompositeOperation = 'lighter'; c.globalAlpha = a0 * (calm() ? 0.4 : 1); c.fillStyle = 'rgba(' + rgb + ',0.55)';
    c.beginPath(); c.moveTo(L[0][0], L[0][1]); for (j = 1; j < n; j++) c.lineTo(L[j][0], L[j][1]); for (j = n - 1; j >= 0; j--) c.lineTo(R[j][0], R[j][1]); c.closePath(); c.fill(); c.restore();
  }

  /* =====================================================================================
     (4) Estados sobre enemigos (quemado, helado, envenenado, corroido): lectura sin tapar el sprite
     ===================================================================================== */
  function flameSpr(i) {
    return cache('fm' + i, 18, 26, function (g) {
      g.translate(0, 12); var lean = (i - 1) * 2.2;
      g.fillStyle = '#ff7a1a'; g.beginPath(); g.moveTo(-6, 0); g.quadraticCurveTo(-7 + lean, -12, 0 + lean * 1.6, -22); g.quadraticCurveTo(7 + lean, -10, 6, 0); g.quadraticCurveTo(0, 5, -6, 0); g.fill();
      g.fillStyle = '#ffc03a'; g.beginPath(); g.moveTo(-3.6, 0); g.quadraticCurveTo(-4 + lean * 0.6, -8, lean, -14); g.quadraticCurveTo(4 + lean * 0.6, -7, 3.6, 0); g.quadraticCurveTo(0, 3, -3.6, 0); g.fill();
      g.fillStyle = '#fff4b8'; g.beginPath(); g.moveTo(-1.8, 0); g.quadraticCurveTo(-1.8 + lean * 0.3, -4, lean * 0.4, -7); g.quadraticCurveTo(1.8, -3, 1.8, 0); g.closePath(); g.fill();
    });
  }
  function shellSpr() {   // caparazon de hielo facetado, 40 x 44
    return cache('shell', 44, 48, function (g) {
      var pts = [[0, -22], [14, -14], [19, 4], [10, 20], [-10, 20], [-19, 4], [-14, -14]], i;
      g.fillStyle = 'rgba(150,215,255,0.34)'; g.beginPath(); g.moveTo(pts[0][0], pts[0][1]); for (i = 1; i < 7; i++) g.lineTo(pts[i][0], pts[i][1]); g.closePath(); g.fill();
      g.fillStyle = 'rgba(235,250,255,0.5)'; g.beginPath(); g.moveTo(0, -22); g.lineTo(14, -14); g.lineTo(2, -4); g.lineTo(-14, -14); g.closePath(); g.fill();   // faceta superior
      g.fillStyle = 'rgba(60,120,200,0.32)'; g.beginPath(); g.moveTo(19, 4); g.lineTo(10, 20); g.lineTo(0, 20); g.lineTo(2, -4); g.closePath(); g.fill();   // lado en sombra
      g.strokeStyle = 'rgba(255,255,255,0.9)'; g.lineWidth = 1.2; g.beginPath(); g.moveTo(2, -4); g.lineTo(0, -22); g.moveTo(2, -4); g.lineTo(14, -14); g.moveTo(2, -4); g.lineTo(-14, -14); g.moveTo(2, -4); g.lineTo(0, 20); g.stroke();
      g.strokeStyle = 'rgba(40,90,170,0.9)'; g.lineWidth = 1.5; g.beginPath(); g.moveTo(pts[0][0], pts[0][1]); for (i = 1; i < 7; i++) g.lineTo(pts[i][0], pts[i][1]); g.closePath(); g.stroke();
    });
  }
  // Sprites compuestos para el radio de referencia 14 (centrados en el cuerpo del enemigo): 1-3 drawImage por estado y enemigo
  function chillSpr() {
    return cache('stChill', 64, 64, function (g) {
      g.save(); g.translate(0, 9); g.globalAlpha = 0.6; g.drawImage(frostSpr(), -21, -6.5, 42, 13); g.restore();
      g.save(); g.translate(-11, 10); g.rotate(-0.25); g.scale(0.5, 0.5); g.drawImage(crystalSpr('ice'), -14, -27, 28, 54); g.restore();
      g.save(); g.translate(12, 11); g.rotate(0.3); g.scale(0.42, 0.42); g.drawImage(crystalSpr('ice'), -14, -27, 28, 54); g.restore();
    });
  }
  function burnSpr(i) {
    return cache('stBurn' + i, 56, 48, function (g) {
      var j, off = [[-8, -4], [0, -9], [8, -4]], ph = [i, (i + 1) % 3, (i + 2) % 3];
      for (j = 0; j < 3; j++) { g.save(); g.translate(off[j][0], off[j][1] - 1); g.scale(0.9 + 0.12 * ((i + j) % 3), 0.9 + 0.12 * ((i + j) % 3)); g.drawImage(flameSpr(ph[j]), -9, -13, 18, 26); g.restore(); }
    });
  }
  function poisonSpr() {
    return cache('stPois', 48, 40, function (g) {
      g.fillStyle = 'rgba(123,227,74,0.4)'; g.beginPath(); g.ellipse(0, 11, 11, 3.2, 0, 0, TAU); g.fill();
      g.fillStyle = 'rgba(190,255,130,0.45)'; g.beginPath(); g.ellipse(-2, 10.5, 5, 1.4, 0, 0, TAU); g.fill();
    });
  }
  function bubSpr() {
    return cache('stBub', 10, 10, function (g) {
      g.fillStyle = 'rgba(123,227,74,0.8)'; g.strokeStyle = 'rgba(30,90,30,0.95)'; g.lineWidth = 1; g.beginPath(); g.arc(0, 0, 3.4, 0, TAU); g.fill(); g.stroke();
      g.fillStyle = 'rgba(255,255,255,0.9)'; g.beginPath(); g.arc(-1.2, -1.2, 1, 0, TAU); g.fill();
    });
  }
  function rustSpr() {
    return cache('stRust', 40, 36, function (g) {
      var j, pp = [[-5.6, -4.2], [6.3, 1.4]];
      for (j = 0; j < 2; j++) {
        var px = pp[j][0], py = pp[j][1], pr = 4.8;
        g.fillStyle = '#9a4a1a'; g.beginPath(); g.moveTo(px - pr, py); g.lineTo(px - pr * 0.3, py - pr); g.lineTo(px + pr, py - pr * 0.4); g.lineTo(px + pr * 0.6, py + pr * 0.7); g.lineTo(px - pr * 0.5, py + pr * 0.8); g.closePath(); g.fill();
        g.fillStyle = '#d2782a'; g.beginPath(); g.moveTo(px - pr * 0.6, py); g.lineTo(px - pr * 0.2, py - pr * 0.6); g.lineTo(px + pr * 0.5, py - pr * 0.2); g.lineTo(px, py + pr * 0.2); g.closePath(); g.fill();
        g.strokeStyle = 'rgba(70,40,10,0.9)'; g.lineWidth = 1; g.stroke();
      }
    });
  }
  function drawStatuses(c) {
    var Ql = (G.Q && G.Q.level) || 'alta', NMAX = Ql === 'baja' ? 6 : Ql === 'media' ? 14 : 22, es = G.enemies, n = 0, ns, i, e, t = T(), k = K(), cam = G.cam, r, sc, x, y, j, ph, cx0, cx1, cy0, cy1;
    if (!es || !cam) return; cx0 = cam.x - 30; cx1 = cam.x + G.W + 30; cy0 = cam.y - 30; cy1 = cam.y + (G.VH || G.H) + 30;
    begin(c);
    for (i = 0; i < es.length && n < NMAX; i++) {
      e = es[i]; if (e.dead || e.partOf || e.hidden || e.hide || e.spawnT > 0) continue;
      if (!(e.burnT > 0 || e.slowT > 0 || e.poisonT > 0 || e.corrodeT > 0)) continue;
      if (e.x < cx0 || e.x > cx1 || e.y < cy0 || e.y > cy1) continue;
      n++; ns = 0; r = Math.max(8, Math.min(40, e.r || 12)); sc = r / 14; x = e.x; y = e.y * k; ph = i * 0.37; c.globalAlpha = 1;
      if (e.burnT > 0 && ns++ < 2) {   // fuego: 3 lenguas animadas + brasas que suben
        put(c, burnSpr((Math.floor(t * 9 + ph * 3)) % 3), x, y - r * 0.5, sc);
        c.globalCompositeOperation = 'lighter'; c.fillStyle = '#ffd060'; var eu = (t * 1.2 + ph) % 1; c.globalAlpha = 1 - eu; c.fillRect(x + Math.sin(t * 4 + ph) * r * 0.6 - 1, y - r * 0.8 - eu * r * 1.6, 2.2, 2.2); c.globalCompositeOperation = 'source-over'; c.globalAlpha = 1;
      }
      if (e.slowT > 0 && ns++ < 2) {   // helado: escarcha + cristales a los pies; >= 55 % de lentitud: caparazon facetado con destello
        put(c, chillSpr(), x, y, sc);
        if (e.slowPct >= 0.55) { put(c, shellSpr(), x, y - 1, Math.max(0.5, r / 14)); glintBar(c, x, y, r * 2.2, r * 0.9, ((t * 0.55 + ph) % 1)); }
        else if (((t * 0.7 + ph) % 1) < 0.16) { c.globalAlpha = 0.9; c.globalCompositeOperation = 'lighter'; put(c, flareSpr('200,235,255'), x - r * 0.8, y + r * 0.2, 0.22, t); c.globalCompositeOperation = 'source-over'; c.globalAlpha = 1; }
      }
      if (e.poisonT > 0 && ns++ < 2) {   // veneno: charquito + burbujas que suben y revientan
        put(c, poisonSpr(), x, y, sc);
        for (j = 0; j < 2; j++) {
          var bu = (t * 0.9 + j * 0.5 + ph) % 1, bs = bu > 0.88 ? 1.7 : 1;
          put(c, bubSpr(), x + (j ? 0.5 : -0.5) * r + Math.sin(t * 3 + j + ph) * 2, y + r * 0.3 - bu * r * 1.7, sc * bs, 0, bu > 0.88 ? (1 - bu) * 8 : 1);
        }
        c.globalAlpha = 1;
      }
      if (e.corrodeT > 0 && ns++ < 2) {   // corrosion: placas oxidadas con borde y escamas que caen
        put(c, rustSpr(), x, y, sc, 0, 0.9);
        var fu = (t * 0.8 + ph) % 1; c.globalAlpha = 1 - fu; c.fillStyle = (i & 1) ? '#d2782a' : '#8ad03a'; c.fillRect(x + (i % 3 - 1) * r * 0.6 - 1, y + r * 0.2 + fu * r * 1.2, 2.2, 2.2); c.globalAlpha = 1;
      }
    }
    c.restore(); c.globalAlpha = 1;
  }

  /* =====================================================================================
     Envolturas (cada una cae al arte anterior con ?fx2=0 y traga errores)
     ===================================================================================== */
  function guard(name, f) {
    var old = B[name]; FX2.old[name] = old;
    B[name] = function (c) {
      if (!c) return; if (!FX2.on || !f) return old && old.apply(B, arguments);
      var t0 = FX2.prof ? performance.now() : 0;
      c.save(); try { f.apply(null, arguments); } catch (e) { B.lastError = e; } c.restore();
      if (t0) FX2.prof[name] = (FX2.prof[name] || 0) + performance.now() - t0;
    };
  }

  function lanceTail(c, crit) {   // cola de 6 puntos ahusada hacia atras, con ondulacion suave (en el sistema local de la lanza)
    var tt = T() * 9, j, up = [], dn = []; c.globalCompositeOperation = 'lighter'; c.fillStyle = crit ? 'rgba(255,228,120,0.45)' : 'rgba(150,215,255,0.45)';
    for (j = 0; j < 6; j++) { var xx = -10 - j * 7, ww = 5 * (1 - j / 6.5), wob = Math.sin(tt + j * 1.3) * 1.6 * (j / 5); up.push([xx, -ww + wob]); dn.push([xx, ww + wob]); }
    c.beginPath(); c.moveTo(-8, -4); for (j = 0; j < 6; j++) c.lineTo(up[j][0], up[j][1]); for (j = 5; j >= 0; j--) c.lineTo(dn[j][0], dn[j][1]); c.lineTo(-8, 4); c.closePath(); c.fill(); c.globalCompositeOperation = 'source-over';
  }
  // Lanza (Filo gelido): sprite facetado con cola de hielo y brillo que barre
  guard('lance', function (c, x, y, ang, crit) {
    c.translate(Math.round(x), Math.round(y)); c.rotate(ang); lanceTail(c, crit);
    c.globalCompositeOperation = 'lighter'; put(c, glowSpr(crit ? '255,228,120' : '120,200,255'), -4, 0, 0.55, 0, 0.7); c.globalCompositeOperation = 'source-over';
    put(c, lanceSpr(crit), 0, 0, 1, 0, 1);
    var ph = (T() * 1.4 + (x + y) * 0.01) % 1; if (ph < 0.3) { c.globalCompositeOperation = 'lighter'; c.fillStyle = 'rgba(255,255,255,' + (Math.sin(ph / 0.3 * 3.1416) * (calm() ? 0.25 : 0.85)) + ')'; var gx = 14 - ph / 0.3 * 24; c.beginPath(); c.moveTo(gx, -2); c.lineTo(gx + 3, -2); c.lineTo(gx + 1, 2); c.lineTo(gx - 2, 2); c.closePath(); c.fill(); }
  });
  guard('fan', function (c, x, y, ang, spread, range, u) {   // abanico del Filo: el cono previo + escarcha en el suelo
    FX2.old.fan.apply(B, arguments);
    frost(c, x + Math.cos(ang) * range * 0.45, y + Math.sin(ang) * range * 0.45, range * 0.5 * (0.5 + 0.5 * u), cl(1 - u) * 0.6, ang);
  });
  guard('storm', function (c, x, y, r, t, alpha) {   // Tormenta de escarcha: escarcha en el suelo, copos y cristales en el borde
    c.globalAlpha = cl(alpha) * 0.7; c.drawImage(frostSpr(), x - r, y - r * 0.8, r * 2, r * 1.6); c.globalAlpha = 1;
    FX2.old.storm.apply(B, [c, x, y, r, t, alpha]);
    var k = begin(c), i; c.strokeStyle = 'rgba(235,250,255,0.9)'; c.lineWidth = 1; c.globalAlpha = cl(alpha);
    for (i = 0; i < 8; i++) { var a = rnd(i + 3) * TAU + t * 0.3, rr = Math.sqrt(rnd(i + 70)) * r * 0.95, fy = ((t * 26 + i * 17) % 40) - 28; flake(c, x + Math.cos(a) * rr, (y + Math.sin(a) * rr * 0.8) * k + fy * 0.6, 3 + (i % 3), t * 1.2 + i); }
    for (i = 0; i < 5; i++) { var a2 = i * 1.2566 + 0.3; put(c, crystalSpr('ice'), x + Math.cos(a2) * r * 0.98, (y + Math.sin(a2) * r * 0.8) * k, 0.38, Math.cos(a2) * 0.2, 0.95); }
    c.restore();
  });
  guard('nova', function (c, x, y, r, u, kind) {
    if (kind === 'shatter') return shatterNew(c, x, y, r, u);
    if (kind === 'ice') { FX2.old.nova.apply(B, arguments); frost(c, x, y, r * (0.6 + 0.4 * u), cl(1 - u), 0.3); return; }
    FX2.old.nova.apply(B, arguments);
    if (u < 0.12 && once('nv' + kind + (x | 0), 300)) explode(x, y, kind === 'toxic' ? 'gas' : kind === 'pact' || !kind ? 'fire' : 'ice', 14, 5, kind === 'pact' || !kind ? 6 : 0, 1.3);
  });
  function shatterNew(c, x, y, r, u) {   // rotura del Cristal: onda rosa->azul, fragmentos facetados que vuelan y escarcha que se queda
    var a = cl(1 - u), e = 1 - (1 - u) * (1 - u), i, an, d, rr = Math.round(208 - 102 * u), gg = Math.round(32 + 168 * u), bb = Math.round(72 + 183 * u), k;
    frost(c, x, y, r * (0.55 + 0.45 * e), a * 0.9, 0.5);
    c.save(); c.globalAlpha = 1; glowAt(c, x, y, r * (0.4 + e * 0.7), rr + ',' + gg + ',' + bb, 0.6 * a); c.restore();
    c.globalAlpha = a; c.strokeStyle = '#e8f8ff'; c.lineWidth = 5 * a + 1; c.beginPath(); c.arc(x, y, r * e, 0, TAU); c.stroke();
    c.strokeStyle = 'rgb(' + rr + ',' + gg + ',' + bb + ')'; c.lineWidth = 3; c.beginPath(); c.arc(x, y, r * e * 0.8, 0, TAU); c.stroke();
    k = begin(c);
    for (i = 0; i < 14; i++) {
      an = i * 0.4488 + rnd(i) * 0.25; d = r * e * (0.55 + 0.45 * rnd(i + 9));
      put(c, crystalSpr(i % 2 ? 'pink' : 'ice'), x + Math.cos(an) * d, (y + Math.sin(an) * d) * k - 10 * Math.sin(u * 3.1416) * (1 + rnd(i + 2)), (0.22 + 0.2 * rnd(i + 3)) * (0.5 + a * 0.5), an + u * 6 * (i % 2 ? 1 : -1), a);
    }
    c.restore();
    if (u < 0.1 && once('sh' + (x | 0), 400)) explode(x, y, 'cristal', 18, 10, 0, 2);
  }
  guard('strike', function (c, x, y, u, big) {
    FX2.old.strike.apply(B, arguments);
    if (u < 0.15 && once('st' + (x | 0) + '_' + (y | 0), 250)) explode(x, y, big ? 'descarga' : 'ice', big ? 12 : 6, big ? 4 : 2, 0, big ? 1.5 : 0.9);
  });
  guard('impact', function (c, id, x, y, u, s) {
    FX2.old.impact.apply(B, arguments);
    if (u < 0.2 && once('im' + id + ((x / 14) | 0) + '_' + ((y / 14) | 0), 260)) {
      var pal = id === 'plasma' ? 'plasma' : id === 'forja' ? 'forja' : id === 'descarga' ? 'descarga' : id === 'filo' ? 'ice' : id === 'cristal' ? 'cristal' : id === 'gas' || id === 'virote' ? 'gas' : id === 'pacto' ? 'fire' : null;
      if (pal) explode(x, y, pal, pal === 'forja' ? 9 : 6, pal === 'forja' || pal === 'ice' || pal === 'descarga' ? 3 : 0, pal === 'forja' || pal === 'plasma' || pal === 'fire' ? 3 : 0, pal === 'forja' ? 1 : 0.8);
    }
    if (id === 'filo' && u < 0.5) { c.save(); begin(c); put(c, crystalSpr('ice'), x, y * K() - 3, 0.32 * (1 - u), 0, 1 - u); c.restore(); }
  });
  guard('axe', function (c, x, y, t, sc) {   // hacha de Forja: cola de 8 puntos + chispas calientes que caen y rebotan
    var tr = trailPts(x, y); if (tr) tailDraw(c, tr, '255,150,50', 26, 0.85);
    FX2.old.axe.apply(B, arguments);
    if (live() && once('axs' + ((x / 40) | 0), 70)) { var P = PAL.forja; if (budgetOk(0.5)) { spark(x, y, 10, rf(0, TAU), rf(30, 100), P.sp[(Math.random() * 3) | 0]); if (!calm()) spark(x, y, 10, rf(0, TAU), rf(30, 100), P.sp[1]); } }
  });
  // Cristal: icono (el del boton) con destello barrido
  guard('icon', function (c, id, cx, cy, s) {
    FX2.old.icon.apply(B, arguments);
    if (id === 'cristal') { var ph = (T() * 0.7) % 1; c.save(); c.translate(cx, cy); glintBar(c, 0, 0, s * 1.6, s * 0.7, ph); c.restore(); }
  });

  // API nueva
  B.wardBack = function (c, x, y, r, t, alpha, u) { if (!c || !FX2.on) return; c.save(); try { wardBack(c, x, y, r, t, alpha, u); } catch (e) { B.lastError = e; } c.restore(); };
  B.wardFront = function (c, x, y, r, t, alpha, u) { if (!c) return; if (!FX2.on) return B.__wardOld && B.__wardOld(c, x, y, r, t, alpha, u); var t0 = FX2.prof ? performance.now() : 0; c.save(); try { wardFront(c, x, y, r, t, alpha, u); } catch (e) { B.lastError = e; } c.restore(); if (t0) FX2.prof.wardFront = (FX2.prof.wardFront || 0) + performance.now() - t0; };
  B.wardBackAuto = function (c) { if (!c || !FX2.on) return; var t0 = FX2.prof ? performance.now() : 0; c.save(); try { wardBackAuto(c); } catch (e) { B.lastError = e; } c.restore(); if (t0) FX2.prof.wardBack = (FX2.prof.wardBack || 0) + performance.now() - t0; };
  B.__wardOld = B.ward;   // 'ward' completo anterior (se usa con ?fx2=0)
  var wardOld = B.ward;
  B.ward = function (c, x, y, r, t, alpha, u) { if (!c) return; if (!FX2.on) return wardOld.apply(B, arguments); c.save(); try { wardBoth(c, x, y, r, t, alpha, u); } catch (e) { B.lastError = e; } c.restore(); };
  // Dibujo por frame de particulas y estados (lo llama fusion.js drawAir, tras los poderes)
  B.fx2Draw = function (c) {
    if (!c || !FX2.on) return;
    try {
      var t = G.time || 0, dt = t - lastT; lastT = t; if (dt < 0) { dt = 0; B.fx2Clear(); } else if (dt > 200) dt = 16;
      if (dt > 0) stepPool(Math.min(dt, 50));
      var t1 = FX2.prof ? performance.now() : 0;
      c.save(); drawPool(c); c.restore();
      var t2 = FX2.prof ? performance.now() : 0;
      c.save(); drawStatuses(c); c.restore();
      if (t1) { FX2.prof.pool = (FX2.prof.pool || 0) + t2 - t1; FX2.prof.status = (FX2.prof.status || 0) + performance.now() - t2; FX2.prof.frames = (FX2.prof.frames || 0) + 1; }
    } catch (e) { B.lastError = e; }
  };
  B.fx2Clear = function () { for (var i = 0; i < NP; i++) pool[i].k = 0; TR.length = 0; };
  FX2.explode = explode; FX2.frost = frost; FX2.crystal = function (c, x, y, sc, tone, rot) { c.save(); put(c, crystalSpr(tone || 'ice'), x, y, sc || 1, rot || 0, 1); c.restore(); };
  FX2.flare = function (c, x, y, sc, rgb, rot) { c.save(); c.globalCompositeOperation = 'lighter'; put(c, flareSpr(rgb || '255,220,150'), x, y, sc || 1, rot || 0, 1); c.restore(); };
  FX2.pool = pool; FX2.spark = spark; FX2.debris = debris; FX2.ember = ember; FX2.flareP = flare; FX2.step = stepPool; FX2.draw = function (c) { c.save(); drawPool(c); c.restore(); };
  FX2.cap = cap; FX2.TONE = TONE;
})();
