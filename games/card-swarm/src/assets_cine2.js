/*!
 * assets_cine2.js - Arte de las ENTRADAS DE JEFE y del PRERROLLO DE CENIZAR (DESIGN-v9-cinematicas.md, FASE 2 de arte). Cuento oscuro: carteles con
 * nombre + epiteto + lore, "presagios" (sombra, grietas, niebla, escarcha, cera, ceniza) y la toma de aparicion sobre el sprite real del jefe
 * (Assets.drawBoss). Todo procedural (canvas 2D), sin librerias, SIN offscreen grandes (solo un brillo 64x64 por color y la geometria de grietas en
 * arrays): casi 0 MB. Sin shadowBlur ni filter. Contrato: ASSETS_API.md ("Cinematicas v9 - entradas de jefe"). Cargar DESPUES de assets_boss5.js
 * (necesita Assets.drawBoss y Assets.BOSS; sin ellos dibuja solo el presagio). Seguro: nunca lanza y no toca G ni el DOM.
 */
(function () {
  'use strict';
  var A = window.Assets;
  if (!A) { if (window.console) console.warn('assets_cine2: falta Assets'); return; }
  var TAU = Math.PI * 2, OL = '#1b1124', DUR_LONG = 4500, DUR_SHORT = 1600, DUR_PRE = 6000;
  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  function sm(a, b, v) { var u = clamp((v - a) / (b - a), 0, 1); return u * u * (3 - 2 * u); }
  function mk(w, h) { var c = document.createElement('canvas'); c.width = w; c.height = h; return c; }
  function hash(n) { var s = Math.sin(n * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); }

  // ------------------------------------------------------------------ datos por jefe
  var BOSS = {
    pastor:   { name: 'EL PASTOR CORRUPTO', epi: 'Bestia del Rebaño', lore: 'El Pastor era el mejor de nosotros.', col: '#c090ff', col2: '#5a3a8a', k: 0.8,
                bg: ['#0b0712', '#231536', '#120b1a'] },
    karceron: { name: 'KARCERON', epi: 'Coloso de Huesos y Magma', lore: 'Despertó entre sus propios grilletes.', col: '#ff9a3c', col2: '#8a2a0a', k: 0.82,
                bg: ['#0c0507', '#2a0e0c', '#140706'] },
    letea:    { name: 'LETEA', epi: 'la Hidra del Asfódelo', lore: 'El río del olvido tiene tres voces.', col: '#5fd6c8', col2: '#2f6f6a', k: 0.82,
                bg: ['#050b0e', '#0d2a2c', '#081618'] },
    yarlak:   { name: 'YARLAK', epi: 'El invierno que camina', lore: 'Guardaba la última hoguera del norte.', col: '#bfeaff', col2: '#5c88a8', k: 0.82,
                bg: ['#070b14', '#1b2c44', '#0e1726'] },
    melaria:  { name: 'MELARIA', epi: 'la Reina Abeja', lore: 'Devoró la jalea de sus hermanas.', col: '#f3a31f', col2: '#8a5a0a', k: 0.85,
                bg: ['#0e0804', '#33200a', '#1a0f05'] },
    cenizar:  { name: 'CENIZAR', epi: 'El Incendio Primero', lore: 'Nació de la primera brasa que nadie apagó.', col: '#fff2b0', col2: '#a8561e', k: 0.68,
                bg: ['#0a0506', '#2a1410', '#150a0a'] }
  };
  var IDS = ['pastor', 'karceron', 'letea', 'yarlak', 'melaria', 'cenizar'];
  var SEAL_COLS = ['#c090ff', '#ff9a3c', '#5fd6c8', '#bfeaff', '#f3a31f'];   // los cinco jefes: pastor, karceron, letea, yarlak, melaria
  var HEAD_COLS = ['#9bff4a', '#9fe7ff', '#ffe84a'];                         // Letea: acido, hielo, rayo

  function rgb(hex) { var n = parseInt(hex.slice(1), 16); return (n >> 16 & 255) + ',' + (n >> 8 & 255) + ',' + (n & 255); }

  // ------------------------------------------------------------------ brillo (sprite 64x64 cacheado por color)
  var GL = {};
  function glowImg(col) {
    if (GL[col]) return GL[col];
    var c = mk(64, 64), g = c.getContext('2d'), r = g.createRadialGradient(32, 32, 0, 32, 32, 32), k = rgb(col);
    r.addColorStop(0, 'rgba(' + k + ',1)'); r.addColorStop(0.35, 'rgba(' + k + ',0.45)'); r.addColorStop(1, 'rgba(' + k + ',0)');
    g.fillStyle = r; g.fillRect(0, 0, 64, 64); return (GL[col] = c);
  }
  function glow(c, col, x, y, r, a, sy) {
    if (a <= 0.004 || r < 1) return; var pa = c.globalAlpha, po = c.globalCompositeOperation;
    c.globalCompositeOperation = 'lighter'; c.globalAlpha = a > 1 ? 1 : a; c.drawImage(glowImg(col), x - r, y - r * (sy || 1), 2 * r, 2 * r * (sy || 1));
    c.globalCompositeOperation = po; c.globalAlpha = pa;
  }

  // ------------------------------------------------------------------ geometria de grietas (arrays cacheados por semilla; sin canvas)
  var CK = {};
  function crackSet(seed, n, len, branchy) {
    var key = seed + ':' + n + ':' + len; if (CK[key]) return CK[key];
    var out = [], i, j, a, x, y, pts, k;
    for (i = 0; i < n; i++) {
      a = (i + hash(seed + i * 3.1) * 0.7) * TAU / n; x = 0; y = 0; pts = [[0, 0]];
      var L = len * (0.6 + 0.4 * hash(seed + i * 7.7)), steps = 7;
      for (j = 1; j <= steps; j++) {
        a += (hash(seed * 3 + i * 11 + j) - 0.5) * 0.7; x += Math.cos(a) * L / steps; y += Math.sin(a) * L / steps; pts.push([x, y]);
        if (branchy && j > 2 && j < steps && hash(seed + i * 5 + j * 13) > 0.55) {
          var b = a + (hash(seed + j * 19 + i) > 0.5 ? 1 : -1) * (0.7 + hash(seed + i + j) * 0.5), bx = x, by = y, bp = [[x, y]];
          for (k = 1; k <= 3; k++) { bx += Math.cos(b) * L * 0.07; by += Math.sin(b) * L * 0.07; bp.push([bx, by]); }
          out.push(bp);
        }
      }
      out.push(pts);
    }
    return (CK[key] = out);
  }
  // pinta grietas desde (cx,cy) con aspecto de suelo (sy), crecimiento g 0..1; glowCol = luz interior
  function drawCracks(c, set, cx, cy, sc, sy, g, col, a, wd) {
    var i, j, pts, n, m, f, w = Math.max(1.2, wd || 2.4);
    c.save(); c.translate(cx, cy); c.scale(sc, sc * sy); c.lineJoin = 'round'; c.lineCap = 'round';
    for (var pass = 0; pass < 2; pass++) {
      c.strokeStyle = pass ? col : OL; c.globalAlpha = pass ? a : Math.min(1, a * 1.2); c.lineWidth = (pass ? w * 0.55 : w * 1.6) / sc;
      c.beginPath();
      for (i = 0; i < set.length; i++) {
        pts = set[i]; n = pts.length - 1; m = g * n; c.moveTo(pts[0][0], pts[0][1]);
        for (j = 1; j <= n && j - 1 < m; j++) {
          f = Math.min(1, m - (j - 1)); c.lineTo(pts[j - 1][0] + (pts[j][0] - pts[j - 1][0]) * f, pts[j - 1][1] + (pts[j][1] - pts[j - 1][1]) * f);
        }
      }
      c.stroke();
    }
    c.restore();
  }

  // ------------------------------------------------------------------ utilidades de capa
  function vig(c, w, h, a, col) {
    if (a <= 0.01) return; var g = c.createRadialGradient(w / 2, h * 0.52, h * 0.25, w / 2, h * 0.52, Math.max(w, h) * 0.75);
    g.addColorStop(0, 'rgba(' + (col || '4,2,6') + ',0)'); g.addColorStop(1, 'rgba(' + (col || '4,2,6') + ',' + clamp(a, 0, 1).toFixed(3) + ')');
    c.fillStyle = g; c.fillRect(0, 0, w, h);
  }
  function darken(c, w, h, a) { if (a > 0.01) { c.fillStyle = 'rgba(4,2,8,' + clamp(a, 0, 1).toFixed(3) + ')'; c.fillRect(0, 0, w, h); } }
  // niebla: n bandas elipticas que derivan (t ms); deterministas
  function mist(c, w, h, t, a, col, y0, y1, n, calm) {
    var i, x, y, r, s = calm ? 0.3 : 1, k = rgb(col);
    for (i = 0; i < n; i++) {
      x = ((hash(i * 3.3) * 1.4 - 0.2) * w + t * (0.012 + hash(i) * 0.02) * s * (i % 2 ? 1 : -1) + w * 2) % (w * 1.4) - w * 0.2;
      y = y0 + (y1 - y0) * hash(i * 5.1); r = h * (0.18 + hash(i * 9.9) * 0.18);
      c.globalAlpha = a * (0.5 + 0.5 * hash(i * 1.7)); c.drawImage(glowImg(col), x - r * 1.8, y - r * 0.5, r * 3.6, r);
    }
    c.globalAlpha = 1; return k;
  }
  // particulas que suben/caen: dir=-1 sube, +1 cae
  function motes(c, w, h, t, n, col, a, dir, speed, size, calm, y0, y1) {
    var i, x, y, ph, s = calm ? 0.4 : 1, sz;
    c.fillStyle = col;
    for (i = 0; i < n; i++) {
      ph = (hash(i * 2.9) + t * speed * s * (0.5 + hash(i * 6.1))) % 1;
      x = hash(i * 7.3) * w + (calm ? 0 : Math.sin(t / 700 + i) * 8); y = dir > 0 ? y0 + (y1 - y0) * ph : y1 - (y1 - y0) * ph;
      c.globalAlpha = a * Math.sin(ph * Math.PI); sz = size * (0.5 + hash(i * 4.4));
      c.fillRect(x, y, sz, sz);
    }
    c.globalAlpha = 1;
  }

  // ================================================================== PRESAGIOS (omen): q 0..1 = intensidad creciente; fade = 1..0 al final (ambiente)
  // Todos se pintan sobre el suelo en gy, con la escala u = h/540, centrados en cx. Devuelven nada.
  var OM = {};
  OM.pastor = function (c, w, h, q, t, o, u, gy, cx) {
    // oscurece el claro, cono de luz cenital, el rebano (siluetas) se aparta y una sombra crece en el suelo
    var col = BOSS.pastor.col, i, bx, dir, sx;
    glow(c, col, cx, gy, h * 0.55 * q, 0.5 * q, 0.35);
    var g = c.createLinearGradient(0, 0, 0, gy); g.addColorStop(0, 'rgba(' + rgb(col) + ',' + (0.38 * q).toFixed(3) + ')'); g.addColorStop(1, 'rgba(' + rgb(col) + ',0)');
    c.fillStyle = g; c.beginPath(); c.moveTo(cx - 26 * u, 0); c.lineTo(cx + 26 * u, 0); c.lineTo(cx + (60 + 140 * q) * u, gy); c.lineTo(cx - (60 + 140 * q) * u, gy); c.closePath(); c.fill();
    c.fillStyle = 'rgba(2,1,4,' + (0.7 * q).toFixed(3) + ')'; c.beginPath(); c.ellipse(cx, gy, (30 + 110 * q * q) * u, (8 + 22 * q * q) * u, 0, 0, TAU); c.fill();
    for (i = 0; i < 7; i++) {   // ovejas: blobs oscuros que se alejan del centro
      dir = i % 2 ? 1 : -1; sx = (60 + 40 * hash(i * 2.2)) * u; bx = cx + dir * (sx + q * (120 + 60 * hash(i)) * u + i * 14 * u * dir);
      var by = gy + (8 + 18 * hash(i * 6.6)) * u; c.fillStyle = 'rgba(8,4,12,0.85)'; c.beginPath(); c.ellipse(bx, by - 8 * u, 15 * u, 10 * u, 0, 0, TAU); c.ellipse(bx + dir * 11 * u, by - 12 * u, 6 * u, 5 * u, 0, 0, TAU); c.fill();
      c.fillRect(bx - 8 * u, by - 4 * u, 2.5 * u, 6 * u); c.fillRect(bx + 5 * u, by - 4 * u, 2.5 * u, 6 * u);
    }
    glow(c, '#fff2b0', cx + 70 * u, gy - 190 * u, 16 * u * q, 0.8 * q * (o.calm ? 0.7 : 0.7 + 0.3 * Math.sin(t / 90)));   // la 1.ª brasa del cayado
  };
  OM.karceron = function (c, w, h, q, t, o, u, gy, cx) {
    var col = BOSS.karceron.col, i, set = crackSet(11, 9, 360, true);
    glow(c, '#ff6a1a', cx, gy, 220 * u * (0.3 + q), 0.55 * q, 0.35);
    drawCracks(c, set, cx, gy, u, 0.32, sm(0, 0.8, q), col, 0.95, 3 * u);
    glow(c, col, cx, gy, 90 * u * q, 0.7 * q, 0.4);
    // cadenas que caen desde arriba (eslabones)
    for (i = 0; i < 5; i++) {
      var x = cx + (i - 2) * 80 * u + (hash(i) - 0.5) * 30 * u, L = (gy - 40 * u) * sm(0.05 + i * 0.07, 0.6 + i * 0.05, q), j;
      c.strokeStyle = '#05030a'; c.lineWidth = 5 * u;
      for (j = 0; j * 16 * u < L; j++) { c.save(); c.translate(x, j * 16 * u + 6 * u); c.beginPath(); c.ellipse(0, 0, j % 2 ? 2.5 * u : 5 * u, 8 * u, 0, 0, TAU); c.stroke(); c.restore(); }
    }
    motes(c, w, h, t, o.lite ? 10 : 22, '#ffae52', 0.8 * q, -1, 0.0004, 2.6 * u, o.calm, gy - 250 * u, gy + 20 * u);
  };
  OM.letea = function (c, w, h, q, t, o, u, gy, cx) {
    var col = BOSS.letea.col, i, k, rr, ph;
    mist(c, w, h, t, 0.55 * q, '47,111,106', gy - 190 * u, gy + 10 * u, o.lite ? 4 : 7, o.calm);
    // ondas del estanque: anillos concentricos; tres focos con el color de cada cabeza
    for (k = 0; k < 3; k++) {
      var ox = cx + (k - 1) * 100 * u, appear = sm(0.18 + k * 0.2, 0.5 + k * 0.2, q);
      for (i = 0; i < 3; i++) {
        ph = ((t / 1400 * (o.calm ? 0.5 : 1)) + i / 3 + k * 0.31) % 1; rr = (14 + 70 * ph) * u;
        c.strokeStyle = HEAD_COLS[k]; c.globalAlpha = 0.6 * appear * (1 - ph); c.lineWidth = 2 * u; c.beginPath(); c.ellipse(ox, gy + 4 * u, rr, rr * 0.28, 0, 0, TAU); c.stroke();
      }
      glow(c, HEAD_COLS[k], ox, gy - 6 * u, 40 * u * appear, 0.45 * appear, 0.5);
    }
    c.globalAlpha = 1;
    // tres sombras alargadas bajo el agua, el reflejo
    c.fillStyle = 'rgba(2,10,10,' + (0.5 * q).toFixed(3) + ')'; c.beginPath(); c.ellipse(cx, gy + 6 * u, 150 * u * q, 22 * u * q, 0, 0, TAU); c.fill();
    motes(c, w, h, t, o.lite ? 8 : 16, '#bff5ee', 0.5 * q, -1, 0.00012, 2.4 * u, o.calm, gy - 220 * u, gy);
  };
  OM.yarlak = function (c, w, h, q, t, o, u, gy, cx) {
    var i, a;
    // escarcha que avanza desde los bordes de la pantalla
    a = 0.5 * q; var g, side;
    for (side = 0; side < 2; side++) {
      g = c.createLinearGradient(side ? w : 0, 0, side ? w - w * 0.3 * q - 20 : w * 0.3 * q + 20, 0); g.addColorStop(0, 'rgba(210,240,255,' + a.toFixed(3) + ')'); g.addColorStop(1, 'rgba(210,240,255,0)');
      c.fillStyle = g; c.fillRect(0, 0, w, h);
    }
    drawCracks(c, crackSet(23, 12, 300, true), cx, gy + 6 * u, u, 0.28, sm(0, 0.9, q), '#d8f4ff', 0.75, 2 * u);
    mist(c, w, h, t, 0.6 * q, '200,230,255', gy - 150 * u, gy + 10 * u, o.lite ? 5 : 9, o.calm);
    // ventisca: rayas de nieve en diagonal
    c.strokeStyle = 'rgba(235,248,255,0.6)'; c.lineWidth = Math.max(1, 1.4 * u);
    var n = o.lite ? 24 : 48, s = o.calm ? 0.35 : 1; c.globalAlpha = 0.7 * q; c.beginPath();
    for (i = 0; i < n; i++) {
      var ph = (hash(i * 1.9) + t * 0.0009 * s * (0.6 + hash(i))) % 1, x = (hash(i * 8.8) * 1.3 - 0.15) * w - ph * 90 * u, y = ph * h;
      c.moveTo(x, y); c.lineTo(x - 12 * u, y + 6 * u);
    }
    c.stroke(); c.globalAlpha = 1;
    // huellas: dos marcas azuladas que se hunden
    c.fillStyle = 'rgba(120,170,210,' + (0.5 * sm(0.4, 0.9, q)).toFixed(3) + ')'; c.beginPath(); c.ellipse(cx - 50 * u, gy + 10 * u, 22 * u, 7 * u, 0, 0, TAU); c.ellipse(cx + 54 * u, gy + 14 * u, 22 * u, 7 * u, 0, 0, TAU); c.fill();
  };
  OM.melaria = function (c, w, h, q, t, o, u, gy, cx) {
    var col = BOSS.melaria.col, i;
    glow(c, col, cx, gy * 0.45, h * 0.6, 0.3 * q, 0.9);
    // cera / miel que gotea del techo
    for (i = 0; i < 9; i++) {
      var x = (i + 0.5) / 9 * w + (hash(i * 3.3) - 0.5) * 30 * u, L = (30 + 150 * hash(i * 2.7)) * u * sm(0.05 + hash(i) * 0.3, 0.8, q), wob = o.calm ? 0 : Math.sin(t / 400 + i) * 1.5 * u;
      c.fillStyle = i % 2 ? '#c88a14' : '#f3a31f'; c.globalAlpha = 0.85; c.beginPath(); c.moveTo(x - 7 * u, 0); c.lineTo(x + 7 * u, 0); c.lineTo(x + 3 * u + wob, L); c.arc(x + wob, L, 4.2 * u, 0, Math.PI); c.lineTo(x - 3 * u, L * 0.9); c.closePath(); c.fill();
      c.fillStyle = 'rgba(255,230,150,0.5)'; c.fillRect(x - 2 * u, 0, 1.6 * u, L * 0.8);
      var dp = (t / 900 * (o.calm ? 0.4 : 1) + hash(i)) % 1;   // gota que cae
      if (q > 0.4) { c.fillStyle = '#f3a31f'; c.beginPath(); c.arc(x, L + dp * (gy - L), 3 * u, 0, TAU); c.fill(); }
    }
    c.globalAlpha = 1;
    // charco de miel que crece
    c.fillStyle = 'rgba(160,90,8,' + (0.6 * q).toFixed(3) + ')'; c.beginPath(); c.ellipse(cx, gy + 8 * u, 150 * u * q, 20 * u * q, 0, 0, TAU); c.fill();
    // avispas: puntos oscuros que orbitan (zumbido visual)
    var nb = o.lite ? 5 : 10; c.fillStyle = '#1a0f05';
    for (i = 0; i < nb; i++) {
      var an = t / (o.calm ? 1200 : 420) + i * TAU / nb, rr = (110 + 40 * hash(i)) * u;
      c.globalAlpha = 0.9 * q; c.beginPath(); c.ellipse(cx + Math.cos(an) * rr, gy - 120 * u + Math.sin(an * 1.3) * 50 * u, 4 * u, 2.6 * u, an, 0, TAU); c.fill();
    }
    c.globalAlpha = 1;
  };
  OM.cenizar = function (c, w, h, q, t, o, u, gy, cx) {
    var i, col = BOSS.cenizar.col;
    glow(c, '#ff7a28', cx, gy - 60 * u, 260 * u * (0.3 + q), 0.5 * q, 0.7);
    drawCracks(c, crackSet(31, 10, 380, true), cx, gy, u, 0.3, sm(0, 0.8, q), '#ff9a3c', 0.9, 2.6 * u);
    motes(c, w, h, t, o.lite ? 18 : 40, '#c9bfb4', 0.55 * q, 1, 0.00022, 2.8 * u, o.calm, -10, gy + 20 * u);   // ceniza que cae
    motes(c, w, h, t, o.lite ? 8 : 18, '#ffb860', 0.9 * q, -1, 0.0004, 2.4 * u, o.calm, gy - 300 * u, gy);        // brasas que suben
    // las cinco chispas de la corona, una a una, con el color de cada jefe anterior
    for (i = 0; i < 5; i++) {
      var f = sm(0.25 + i * 0.1, 0.45 + i * 0.1, q), an = -Math.PI / 2 + (i - 2) * 0.42;
      glow(c, SEAL_COLS[i], cx + Math.cos(an) * 120 * u, gy - 330 * u + Math.sin(an) * 70 * u + 40 * u, 26 * u * f, 0.85 * f, 1);
    }
    glow(c, col, cx, gy - 100 * u, 70 * u * q, 0.35 * q, 1);
  };

  // ------------------------------------------------------------------ telon de fondo simple por jefe (solo si opts.bg !== false)
  function backdrop(c, w, h, id, gy, t, o) {
    var B = BOSS[id], g = c.createLinearGradient(0, 0, 0, h); g.addColorStop(0, B.bg[0]); g.addColorStop(0.62, B.bg[1]); g.addColorStop(1, B.bg[2]);
    c.fillStyle = g; c.fillRect(0, 0, w, h);
    // suelo: banda mas oscura bajo la linea de pies, con borde de luz
    var f = c.createLinearGradient(0, gy - 6, 0, h); f.addColorStop(0, 'rgba(0,0,0,0.05)'); f.addColorStop(1, 'rgba(0,0,0,0.6)'); c.fillStyle = f; c.fillRect(0, gy - 6, w, h - gy + 6);
    glow(c, B.col2.charAt(0) === '#' ? B.col2 : '#888888', w / 2, gy, h * 0.6, 0.18, 0.4);
  }

  // ------------------------------------------------------------------ TOMA DE APARICION
  // linea de tiempo (fracciones de p): omen -> aparece -> rugido -> reposo
  function tl(short) { return short ? { om: 0.22, a0: 0.1, a1: 0.38, roar: 0.4 } : { om: 0.28, a0: 0.24, a1: 0.52, roar: 0.54 }; }
  function bossGy(id) { var b = A.BOSS && A.BOSS[id]; return (b && b.gy) || 88; }
  function drawBossShadow(c, cx, gy, u, a, k) {
    c.fillStyle = 'rgba(0,0,0,' + (0.5 * a).toFixed(3) + ')'; c.beginPath(); c.ellipse(cx, gy + 4 * u, 95 * u * k, 17 * u * k, 0, 0, TAU); c.fill();
  }
  function entry(id, c, w, h, p, o) {
    var B = BOSS[id]; if (!B) return false; o = o || {}; p = clamp(p || 0, 0, 1);
    var short = !!o.short, calm = !!o.calm, T = tl(short), dur = short ? DUR_SHORT : DUR_LONG, t = p * dur;
    var u = h / 540, gy = h * (o.gy || 0.72), cx = w / 2, q = sm(0, T.om, p), amb = 1 - sm(T.a1, 1, p) * 0.45;
    var ap = sm(T.a0, T.a1, p);                                   // aparicion 0..1
    c.save();
    if (o.bg !== false) backdrop(c, w, h, id, gy, t, o);
    // oscurece segun el presagio (la arena "se queda sin luz") y se aclara al aparecer
    if (o.bg === false) darken(c, w, h, 0.55 * q * (1 - ap * 0.5));
    // zoom (push-in lento + pulso de rugido) y sacudida acotada
    var rr = p > T.roar ? Math.exp(-(p - T.roar) * (short ? 14 : 9)) : 0, z = 1 + 0.12 * sm(0, 1, p) + (calm ? 0.015 : 0.05) * rr;
    var sh = calm ? 0 : Math.min(6 * u, 9) * rr * (p > T.roar ? 1 : 0), sx = sh * Math.sin(t * 0.09), sy = sh * Math.cos(t * 0.13);
    c.translate(cx + sx, gy + sy); c.scale(z, z); c.translate(-cx, -gy);
    OM[id](c, w, h, q, t, o, u, gy, cx);
    if (o.boss !== false && A.drawBoss && ap > 0.002) {
      var k = u * B.k * 1.25, st = { t: t, id: id, facing: o.facing || -1, phase: 1, roar: clamp(rr * 1.6, 0, 1), noShadow: true, enraged: false }, dy = 0, al = ap;
      drawBossShadow(c, cx, gy, u * B.k * 1.2, ap, 1);
      c.save(); c.beginPath(); c.rect(-w, -h, w * 3, gy + h + 4 * u + (id === 'pastor' || id === 'melaria' ? h : 0)); c.clip();
      if (id === 'pastor') { dy = -(1 - ap) * (1 - ap) * 340 * u; }                      // cae del cielo
      else if (id === 'melaria') { dy = -(1 - ap) * (1 - ap) * 300 * u; st.lift = 0; }   // baja del techo
      else if (id === 'yarlak') { dy = (1 - ap) * 30 * u; al = sm(0, 0.7, ap); }         // asoma entre la ventisca
      else { dy = (1 - ap) * 330 * u; }                                                  // karceron, letea, cenizar: surgen del suelo
      c.translate(cx, gy + dy); c.scale(k, k);
      if (id === 'yarlak' && !calm) c.translate(0, Math.abs(Math.sin(p * 9)) * -3 * (1 - ap) * 0 + (ap < 1 ? Math.sin(p * 18) * 2 : 0));
      c.globalAlpha = al;
      try { A.drawBoss(id, c, 0, -bossGy(id), st); } catch (e) { /* sprite no disponible */ }
      c.restore();
    }
    c.restore();
    // velo de presagio, viñeta y destello (destello omitido con calm)
    vig(c, w, h, 0.55 + 0.25 * q * amb);
    if (!calm && rr > 0.02) { c.fillStyle = 'rgba(' + rgb(B.col) + ',' + (0.3 * rr).toFixed(3) + ')'; c.fillRect(0, 0, w, h); }
    else if (calm && rr > 0.02) glow(c, B.col, w / 2, gy - 120 * u, h * 0.6, 0.18 * rr, 1);
    if (p < 0.04 && o.bg !== false) { c.fillStyle = 'rgba(2,1,4,' + (1 - p / 0.04).toFixed(3) + ')'; c.fillRect(0, 0, w, h); }   // entra desde negro
    return true;
  }
  // solo el presagio (para pintarlo SOBRE el mundo real, sin fondo ni sprite)
  function omen(id, c, w, h, p, o) {
    var B = BOSS[id]; if (!B) return false; o = o || {}; p = clamp(p || 0, 0, 1);
    var short = !!o.short, T = tl(short), t = p * (short ? DUR_SHORT : DUR_LONG), u = h / 540, q = sm(0, T.om, p) * (1 - sm(T.a1, 1, p) * 0.6);
    c.save(); darken(c, w, h, 0.5 * q); OM[id](c, w, h, sm(0, T.om, p), t, o, u, h * (o.gy || 0.72), o.cx != null ? o.cx : w / 2); c.restore(); return true;
  }

  // ================================================================== CARTEL
  function rr(c, x, y, w, h, r) { c.beginPath(); c.moveTo(x + r, y); c.lineTo(x + w - r, y); c.quadraticCurveTo(x + w, y, x + w, y + r); c.lineTo(x + w, y + h - r); c.quadraticCurveTo(x + w, y + h, x + w - r, y + h); c.lineTo(x + r, y + h); c.quadraticCurveTo(x, y + h, x, y + h - r); c.lineTo(x, y + r); c.quadraticCurveTo(x, y, x + r, y); c.closePath(); }
  function ls(c, px) { try { c.letterSpacing = px + 'px'; } catch (e) { /* sin letterSpacing */ } }
  function txt(c, s, x, y, col, size, weight, style, ls0, a) {
    c.font = (style || '') + ' ' + (weight || 'bold') + ' ' + Math.round(size) + 'px "Trebuchet MS",Georgia,serif'; ls(c, ls0 || 0); c.textAlign = 'center'; c.textBaseline = 'middle';
    c.lineJoin = 'round'; c.lineWidth = Math.max(3, size * 0.2); c.strokeStyle = 'rgba(10,4,14,0.92)'; c.globalAlpha = a; c.strokeText(s, x, y); c.fillStyle = col; c.fillText(s, x, y);
  }
  function card(id, c, w, h, p, o) {
    var B = BOSS[id]; if (!B) return false; o = o || {}; p = clamp(p || 0, 0, 1);
    var short = !!o.short, calm = !!o.calm, u = h / 540, name = o.name || B.name, epi = o.epi || B.epi, lore = o.lore === false || short && o.lore == null ? '' : (o.lore || B.lore);
    var inn = sm(0, short ? 0.3 : 0.18, p), out = 1 - sm(short ? 0.82 : 0.86, 1, p), a = inn * out; if (a <= 0.003) return true;
    var pw = Math.min(w * 0.86, (short ? 440 : 600) * u * 1.15), ph = (lore ? 132 : short ? 88 : 108) * u, cx = w / 2, cy = h * (o.y || 0.8) + (1 - inn) * 14 * u, x = cx - pw / 2, y = cy - ph / 2;
    var ink = o.color || B.col, k = rgb(ink);
    c.save(); c.globalAlpha = a;
    // placa: fondo casi negro con borde doble y esquinas "de hierro"; la linea de luz crece desde el centro
    rr(c, x, y, pw, ph, 8 * u); c.fillStyle = 'rgba(10,5,14,0.86)'; c.fill(); c.lineWidth = 3 * u; c.strokeStyle = OL; c.stroke();
    var g = c.createLinearGradient(0, y, 0, y + ph); g.addColorStop(0, 'rgba(' + k + ',0.13)'); g.addColorStop(1, 'rgba(' + k + ',0)'); rr(c, x + 3 * u, y + 3 * u, pw - 6 * u, ph - 6 * u, 6 * u); c.fillStyle = g; c.fill();
    rr(c, x + 6 * u, y + 6 * u, pw - 12 * u, ph - 12 * u, 5 * u); c.lineWidth = 1.4 * u; c.strokeStyle = 'rgba(' + k + ',0.55)'; c.stroke();
    var i, cs = [[x + 6 * u, y + 6 * u, 1, 1], [x + pw - 6 * u, y + 6 * u, -1, 1], [x + 6 * u, y + ph - 6 * u, 1, -1], [x + pw - 6 * u, y + ph - 6 * u, -1, -1]];
    c.fillStyle = ink; for (i = 0; i < 4; i++) { c.beginPath(); c.moveTo(cs[i][0], cs[i][1]); c.lineTo(cs[i][0] + 12 * u * cs[i][2], cs[i][1]); c.lineTo(cs[i][0], cs[i][1] + 12 * u * cs[i][3]); c.closePath(); c.fill(); }
    var ty = y + ph * (lore ? 0.27 : 0.38), ns = (short ? 30 : 36) * u;
    var ful = ('' + name).length; ns = Math.min(ns, pw * 0.9 / (ful * 0.74));
    txt(c, name, cx, ty, '#f4ead8', ns, 'bold', '', Math.round(ns * 0.1), 1);
    // brillo de color tras el nombre (parpadea suave; calm: estable)
    glow(c, ink, cx, ty, pw * 0.34, 0.16 * (calm ? 1 : 0.8 + 0.2 * Math.sin(p * 40)), 0.28);
    var ly = ty + ns * 0.78, lw = (pw * 0.8) * sm(0.04, short ? 0.35 : 0.3, p);   // filete con rombo central
    c.strokeStyle = ink; c.globalAlpha = a * 0.8; c.lineWidth = 1.6 * u; c.beginPath(); c.moveTo(cx - lw / 2, ly); c.lineTo(cx - 8 * u, ly); c.moveTo(cx + 8 * u, ly); c.lineTo(cx + lw / 2, ly); c.stroke();
    c.globalAlpha = a; c.fillStyle = ink; c.beginPath(); c.moveTo(cx, ly - 5 * u); c.lineTo(cx + 5 * u, ly); c.lineTo(cx, ly + 5 * u); c.lineTo(cx - 5 * u, ly); c.closePath(); c.fill();
    var es = (short ? 17 : 19) * u; txt(c, epi, cx, ly + es * 1.05, ink, es, 'bold', 'italic', 1, a * sm(0.1, 0.4, p));
    if (lore) { var os = 14.5 * u; txt(c, '"' + lore + '"', cx, ly + es * 1.05 + os * 1.9, '#cdbfae', os, 'normal', 'italic', 0, a * sm(0.3, 0.6, p)); }
    ls(c, 0); c.restore(); return true;
  }

  // ================================================================== PRERROLLO DE CENIZAR (6 s)
  // 0-2 s: el Hogar Quemado desde arriba, ruinas, la camara entra por el techo roto
  // 2-4 s: el brasero y el suelo de brasas; las grietas del crater se iluminan una a una en los cinco colores (pentagono = Assets.CRATER.seals)
  // 4-6 s: corte a negro y cartel CENIZAR - El Incendio Primero (la intro estandar arranca justo despues)
  function ruins(c, w, h, u, cx, cy, zoom, t, o) {
    // suelo de losas oscuras en perspectiva cenital + vigas caidas + escombros (deterministas)
    var g = c.createRadialGradient(cx, cy, 20 * u, cx, cy, Math.max(w, h) * 0.8 * zoom); g.addColorStop(0, '#2a1612'); g.addColorStop(0.5, '#140b0c'); g.addColorStop(1, '#050304');
    c.fillStyle = g; c.fillRect(0, 0, w, h);
    c.strokeStyle = 'rgba(0,0,0,0.55)'; c.lineWidth = 2 * u; c.beginPath(); var i, s = 70 * u * zoom;
    for (i = -8; i <= 8; i++) { c.moveTo(cx + i * s, 0); c.lineTo(cx + i * s, h); c.moveTo(0, cy + i * s * 0.7); c.lineTo(w, cy + i * s * 0.7); } c.stroke();
    for (i = 0; i < 10; i++) {   // vigas caidas
      var a = hash(i * 4.1) * Math.PI, x = cx + (hash(i * 2.3) - 0.5) * w * 0.9 * zoom, y = cy + (hash(i * 6.7) - 0.5) * h * 0.9 * zoom, L = (90 + 120 * hash(i * 9.1)) * u * zoom;
      c.save(); c.translate(x, y); c.rotate(a); c.fillStyle = '#0a0506'; c.fillRect(-L / 2, -6 * u * zoom, L, 12 * u * zoom); c.fillStyle = 'rgba(255,120,40,0.18)'; c.fillRect(-L / 2, -6 * u * zoom, L, 2.2 * u * zoom); c.restore();
    }
    for (i = 0; i < 22; i++) { c.fillStyle = 'rgba(6,3,4,0.9)'; c.beginPath(); c.ellipse(cx + (hash(i * 3.9) - 0.5) * w * 1.1 * zoom, cy + (hash(i * 1.3) - 0.5) * h * 1.1 * zoom, (8 + 14 * hash(i)) * u * zoom, (5 + 8 * hash(i + 1)) * u * zoom, hash(i) * 3, 0, TAU); c.fill(); }
  }
  function prelude(c, w, h, p, o) {
    o = o || {}; p = clamp(p || 0, 0, 1); var calm = !!o.calm, t = p * DUR_PRE, u = h / 540, cx = w / 2, cy = h * 0.5;
    var seals = (A.CRATER && A.CRATER.seals) || null, cc = (A.CRATER && A.CRATER.center) || [720, 405];
    var zoom = 1.35 - 0.35 * sm(0, 0.34, p) + 0.08 * sm(0.34, 0.66, p);
    c.save(); c.fillStyle = '#000'; c.fillRect(0, 0, w, h);
    var vis = 1 - sm(0.62, 0.7, p);   // el corte a negro: de 3,7 s a 4,2 s
    if (vis > 0.001) {
      c.save(); c.globalAlpha = vis;
      ruins(c, w, h, u, cx, cy, zoom, t, o);
      // 0-2 s: haz de luz por el techo roto que se abre (iris) y polvo en el haz
      var beam = 1 - sm(0.2, 0.42, p);
      if (beam > 0.01) {
        var g = c.createLinearGradient(0, 0, 0, h); g.addColorStop(0, 'rgba(200,170,140,' + (0.3 * beam).toFixed(3) + ')'); g.addColorStop(1, 'rgba(200,170,140,0)');
        c.fillStyle = g; c.beginPath(); c.moveTo(cx - 60 * u, 0); c.lineTo(cx + 60 * u, 0); c.lineTo(cx + 190 * u, h); c.lineTo(cx - 190 * u, h); c.closePath(); c.fill();
        motes(c, w, h, t, o.lite ? 14 : 30, '#e8d8c0', 0.5 * beam, 1, 0.0001, 2.4 * u, calm, 0, h);
      }
      // 2-4 s: brasero (la brasa mansa) y grietas hacia los cinco sellos, uno a uno
      var br = sm(0.28, 0.42, p), fl = calm ? 1 : 0.88 + 0.12 * Math.sin(t / 80) * Math.sin(t / 37);
      var sc = u * 0.62, ox = cx - (cc[0]) * sc * zoom * 0.5 * 0, i;
      var base = [cx, cy + 14 * u];                              // centro del crater en pantalla
      function sealPos(k) { var s0 = seals ? seals[k] : [cc[0] + Math.cos(-Math.PI / 2 + k * TAU / 5) * 300, cc[1] + Math.sin(-Math.PI / 2 + k * TAU / 5) * 180]; return [base[0] + (s0[0] - cc[0]) * sc * zoom * 1.25, base[1] + (s0[1] - cc[1]) * sc * zoom * 1.25]; }
      for (i = 0; i < 5; i++) {
        var f = sm(0.4 + i * 0.045, 0.49 + i * 0.045, p), sp = sealPos(i), col = SEAL_COLS[i];
        if (f <= 0) continue;
        // grieta: de la brasa al sello, con quiebros deterministas; progreso f
        var set = [[[0, 0], [(sp[0] - base[0]) * 0.3, (sp[1] - base[1]) * 0.3 + (hash(i) - 0.5) * 20 * u], [(sp[0] - base[0]) * 0.62, (sp[1] - base[1]) * 0.62 + (hash(i + 4) - 0.5) * 24 * u], [sp[0] - base[0], sp[1] - base[1]]]];
        drawCracks(c, set, base[0], base[1], 1, 1, f, col, 0.95, 3.4 * u);
        glow(c, col, sp[0], sp[1], 62 * u * f, 0.8 * f * fl, 0.6);
        // sello: anillo con el color del jefe
        c.strokeStyle = col; c.globalAlpha = vis * f * 0.9; c.lineWidth = 2.4 * u; c.beginPath(); c.ellipse(sp[0], sp[1], 24 * u, 14 * u, 0, 0, TAU); c.stroke(); c.globalAlpha = vis;
      }
      glow(c, '#ff7a28', base[0], base[1], 130 * u * br * fl, 0.65 * br, 0.62);
      glow(c, '#fff2b0', base[0], base[1] - 4 * u, 30 * u * br * fl, 0.9 * br, 0.8);
      c.fillStyle = '#12090a'; c.beginPath(); c.ellipse(base[0], base[1] + 6 * u, 26 * u, 10 * u, 0, 0, TAU); c.fill();       // cuenco del brasero
      c.fillStyle = 'rgba(255,170,70,' + (0.95 * br).toFixed(3) + ')'; c.beginPath(); c.ellipse(base[0], base[1] + 2 * u, 14 * u, 5.5 * u, 0, 0, TAU); c.fill();
      motes(c, w, h, t, o.lite ? 8 : 18, '#ffb860', 0.9 * br, -1, 0.00045, 2.6 * u, calm, 0, base[1]);
      c.restore();
      vig(c, w, h, 0.7);
      darken(c, w, h, 0.55 * (1 - sm(0, 0.12, p)) + 0.0);          // entra desde oscuro
    }
    // cartel final (4,2-6 s): fundido sobre negro
    var cp = clamp((p - 0.7) / 0.3, 0, 1);
    if (cp > 0) {
      glow(c, '#ff8a30', w / 2, h * 0.76, h * 0.5, 0.12 * sm(0, 0.3, cp) * (1 - sm(0.85, 1, cp)), 0.3);
      card('cenizar', c, w, h, cp, { calm: calm, y: o.y || 0.5, short: false });
    }
    c.restore(); return true;
  }

  // ================================================================== API publica
  var list = [], k;
  for (k = 0; k < IDS.length; k++) list.push({ id: IDS[k], name: BOSS[IDS[k]].name, epi: BOSS[IDS[k]].epi, lore: BOSS[IDS[k]].lore, color: BOSS[IDS[k]].col, dur: DUR_LONG, durShort: DUR_SHORT });
  A.cine2 = {
    list: list, ids: IDS.slice(),
    dur: function (id, short) { return id === 'prelude' ? DUR_PRE : short ? DUR_SHORT : DUR_LONG; },
    info: function (id) { return BOSS[id] ? { id: id, name: BOSS[id].name, epi: BOSS[id].epi, lore: BOSS[id].lore, color: BOSS[id].col } : null; },
    entry: function (id, ctx, w, h, p, opts) { try { return entry(id, ctx, w, h, p, opts); } catch (e) { if (window.console) console.warn('assets_cine2.entry', id, e); try { ctx.restore(); } catch (x) { /* */ } return false; } },
    omen: function (id, ctx, w, h, p, opts) { try { return omen(id, ctx, w, h, p, opts); } catch (e) { try { ctx.restore(); } catch (x) { /* */ } return false; } },
    card: function (id, ctx, w, h, p, opts) { try { return card(id, ctx, w, h, p, opts); } catch (e) { if (window.console) console.warn('assets_cine2.card', id, e); try { ctx.restore(); } catch (x) { /* */ } return false; } },
    prelude: function (ctx, w, h, p, opts) { try { return prelude(ctx, w, h, p, opts); } catch (e) { if (window.console) console.warn('assets_cine2.prelude', e); try { ctx.restore(); } catch (x) { /* */ } return false; } },
    free: function () { GL = {}; CK = {}; }
  };
})();
