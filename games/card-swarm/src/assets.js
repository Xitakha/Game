/*!
 * assets.js - Generador de recursos 100% originales para "Ember Flock" (survival-lamb).
 * Sin dependencias, sin ficheros externos: sprites vectoriales dibujados por codigo (canvas, trazo grueso estilo cuaderno) y audio WebAudio.
 * Script clasico (sin modulos). Expone `window.Assets`. Licencia: propia/libre (ver studio/assets/ASSETS.md).
 * Documentacion completa (nombres, frames, animaciones, audio, biomas, VFX): games/survival-lamb/ASSETS_API.md
 *
 * Resumen: Assets.sprite(name, frame|'anim:n') | animFrame(name, anim, tMs) | list/info/frames | addToPhaser
 *          Assets.setBiome('bosque'|'cripta'|'asfodelo') | arena(w,h) | drawFireflies | drawRitualGlow | vignette | drawFog | drawTorch | decorate
 *          Assets.sfx(name,{pitch,vol,vary}) | music.start/stop/setIntensity(0..1)/setTrack('normal'|'boss')
 *          Assets.exportSfxWav / exportMusicWav (OfflineAudioContext)
 * Los personajes miran a la DERECHA. Todo sprite se dibuja con coordenadas base y se rasteriza a x2 (contorno oscuro grueso, 1 sombra + 1 brillo, v3).
 * Los frames ya existentes conservan su indice; las mejoras se anaden al final (los nuevos frames/anims/nombres son aditivos).
 */
(function () {
  'use strict';
  var SCALE = 2;
  var reg = {};          // sprites compartidos: name -> {w,h,frames:[canvas],anims}
  var order = [];
  var biomes = { bosque: {}, cripta: {}, asfodelo: {} }, bnames = [], curBiome = 'bosque';

  // ------------------------------------------------------------------ utilidades
  function rng(seed) { // mulberry32
    var a = seed >>> 0;
    return function () {
      a |= 0; a = (a + 0x6D2B79F5) | 0;
      var t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  function mkCanvas(w, h) { var c = document.createElement('canvas'); c.width = w; c.height = h; return c; }
  function hex(h) { return [parseInt(h.substr(1, 2), 16), parseInt(h.substr(3, 2), 16), parseInt(h.substr(5, 2), 16)]; }

  function makeG(x) {
    var g = {
      px: function (a, b, c) { x.fillStyle = c; x.fillRect(Math.round(a), Math.round(b), 1, 1); },
      r: function (a, b, w, h, c) { x.fillStyle = c; x.fillRect(Math.round(a), Math.round(b), w, h); },
      d: function (cx, cy, rad, c) {
        x.fillStyle = c;
        for (var yy = -rad; yy <= rad; yy++) for (var xx = -rad; xx <= rad; xx++)
          if (xx * xx + yy * yy <= rad * rad + rad * 0.45) x.fillRect(Math.round(cx) + xx, Math.round(cy) + yy, 1, 1);
      },
      e: function (cx, cy, rx, ry, c) {
        x.fillStyle = c;
        for (var yy = -ry; yy <= ry; yy++) for (var xx = -rx; xx <= rx; xx++)
          if ((xx * xx) / (rx * rx) + (yy * yy) / (ry * ry) <= 1.08) x.fillRect(Math.round(cx) + xx, Math.round(cy) + yy, 1, 1);
      },
      ln: function (x0, y0, x1, y1, c) {
        x0 = Math.round(x0); y0 = Math.round(y0); x1 = Math.round(x1); y1 = Math.round(y1);
        var dx = Math.abs(x1 - x0), dy = -Math.abs(y1 - y0), sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1, er = dx + dy;
        for (;;) {
          g.px(x0, y0, c);
          if (x0 === x1 && y0 === y1) break;
          var e2 = 2 * er;
          if (e2 >= dy) { er += dy; x0 += sx; }
          if (e2 <= dx) { er += dx; y0 += sy; }
        }
      },
      ctx: x
    };
    return g;
  }

  // Contorno oscuro consistente (1 px, 4 vecinos) en el color C.ol
  function outline(x, w, h, col) {
    var im = x.getImageData(0, 0, w, h), d = im.data, out = [];
    function a(xx, yy) { return xx < 0 || yy < 0 || xx >= w || yy >= h ? 0 : d[(yy * w + xx) * 4 + 3]; }
    for (var yy = 0; yy < h; yy++) for (var xx = 0; xx < w; xx++) {
      if (a(xx, yy) < 40 && (a(xx - 1, yy) > 100 || a(xx + 1, yy) > 100 || a(xx, yy - 1) > 100 || a(xx, yy + 1) > 100)) out.push(xx, yy);
    }
    x.fillStyle = col;
    for (var i = 0; i < out.length; i += 2) x.fillRect(out[i], out[i + 1], 1, 1);
  }

  // Shading automatico a 4 tonos (base, luz calida arriba-izquierda, sombra violeta abajo-derecha, sombra profunda
  // en el borde inferior) + degradado de forma. Da cohesion a toda la paleta: sombras violetas, luces ember.
  var HL = [255, 226, 190], SH = [58, 34, 88], DEEP = [26, 12, 42];
  function mixc(r, g, b, t, k) { return [r + (t[0] - r) * k, g + (t[1] - g) * k, b + (t[2] - b) * k]; }
  function shade(x, w, h, amt) {
    amt = amt == null ? 1 : amt;
    var im = x.getImageData(0, 0, w, h), d = im.data, o = new Uint8ClampedArray(d), y0 = h, y1 = 0, xx, yy;
    function A(a, b) { return a < 0 || b < 0 || a >= w || b >= h ? 0 : d[(b * w + a) * 4 + 3]; }
    for (yy = 0; yy < h; yy++) for (xx = 0; xx < w; xx++) if (d[(yy * w + xx) * 4 + 3] > 200) { if (yy < y0) y0 = yy; if (yy > y1) y1 = yy; }
    var span = Math.max(1, y1 - y0 + 1);
    for (yy = 0; yy < h; yy++) for (xx = 0; xx < w; xx++) {
      var i = (yy * w + xx) * 4;
      if (d[i + 3] < 250) continue;
      var up = A(xx, yy - 1) < 128, lf = A(xx - 1, yy) < 128, dn = A(xx, yy + 1) < 128, rt = A(xx + 1, yy) < 128;
      var t = (yy - y0) / span, c = [d[i], d[i + 1], d[i + 2]];
      if (t < 0.28) c = mixc(c[0], c[1], c[2], HL, 0.07 * amt);
      else if (t > 0.68) c = mixc(c[0], c[1], c[2], SH, 0.17 * amt);
      if (up) c = mixc(c[0], c[1], c[2], HL, 0.32 * amt);
      else if (lf) c = mixc(c[0], c[1], c[2], HL, 0.18 * amt);
      if (dn) c = mixc(c[0], c[1], c[2], DEEP, 0.5 * amt);
      else if (rt) c = mixc(c[0], c[1], c[2], SH, 0.36 * amt);
      o[i] = c[0]; o[i + 1] = c[1]; o[i + 2] = c[2];
    }
    im.data.set(o); x.putImageData(im, 0, 0);
  }

  // Dibuja un frame a resolucion base (con shading y contorno). Devuelve canvas base (sin escalar).
  function baseFrame(w, h, draw, opt) {
    opt = opt || {};
    var c = mkCanvas(w, h), x = c.getContext('2d', { willReadFrequently: true }), g = makeG(x);
    draw(g, w, h);
    var solid = opt.outline !== false;
    if (opt.shade != null ? opt.shade : solid) shade(x, w, h, opt.shadeAmt);
    if (solid) outline(x, w, h, opt.ol || C.ol);
    return c;
  }
  function scaleUp(c, w, h) {
    var s = mkCanvas(w * SCALE, h * SCALE), sx = s.getContext('2d');
    sx.imageSmoothingEnabled = false;
    sx.drawImage(c, 0, 0, w * SCALE, h * SCALE);
    return s;
  }
  function frame(w, h, draw, opt) { return scaleUp(baseFrame(w, h, draw, opt), w, h); }
  function mk(name, w, h, drawFns, opt, anims) {
    var fr = [];
    for (var i = 0; i < drawFns.length; i++) fr.push(frame(w, h, drawFns[i], drawFns[i].noPost ? DIE_OPT : opt));
    return { name: name, w: w * SCALE, h: h * SCALE, frames: fr, anims: anims || null };
  }
  function add(name, w, h, drawFns, opt, anims) { reg[name] = mk(name, w, h, drawFns, opt, anims); order.push(name); return reg[name]; }
  // Sprite especifico de bioma (mismo nombre en todos los biomas; Assets.setBiome elige cual se usa)
  function addB(biome, name, w, h, drawFns, opt, anims) {
    biomes[biome][name] = mk(name, w, h, drawFns, opt, anims);
    if (bnames.indexOf(name) < 0) bnames.push(name);
  }

  // ================================================================== v3: DIBUJO VECTORIAL ESTILO "CUADERNO" (trazo grueso, colores planos, 1 sombra + 1 brillo)
  // Cada sprite se dibuja en un canvas (w*2 x h*2) con ctx.scale(2): las coordenadas siguen siendo las "base" de siempre.
  var OLC = '#1b1124';
  var C = { ol: OLC };
  function rrand(seed) { return rng(seed * 2654435761 >>> 0); }
  // --- trazados (funciones que anaden un subpath cerrado al path actual)
  function Pclosed(pts) {           // curva suave cerrada por los puntos
    return function (c) {
      var n = pts.length, m = [(pts[n - 1][0] + pts[0][0]) / 2, (pts[n - 1][1] + pts[0][1]) / 2], i;
      c.moveTo(m[0], m[1]);
      for (i = 0; i < n; i++) { var p = pts[i], q = pts[(i + 1) % n]; c.quadraticCurveTo(p[0], p[1], (p[0] + q[0]) / 2, (p[1] + q[1]) / 2); }
      c.closePath();
    };
  }
  function Ppoly(pts) { return function (c) { c.moveTo(pts[0][0], pts[0][1]); for (var i = 1; i < pts.length; i++) c.lineTo(pts[i][0], pts[i][1]); c.closePath(); }; }
  // elipse irregular "a mano"
  function Pblob(cx, cy, rx, ry, seed, jit, n, rot) {
    jit = jit == null ? 0.05 : jit; n = n || 9; var r = rrand(seed || 1), pts = [], i, co = Math.cos(rot || 0), si = Math.sin(rot || 0);
    for (i = 0; i < n; i++) {
      var a = i / n * 6.2832, k = 1.07 + (r() * 2 - 1) * jit, px = Math.cos(a) * rx * k, py = Math.sin(a) * ry * k;
      pts.push([cx + px * co - py * si, cy + px * si + py * co]);
    }
    return Pclosed(pts);
  }
  function Prr(x, y, w, h, rad) {
    return function (c) {
      rad = Math.min(rad, w / 2, h / 2);
      c.moveTo(x + rad, y); c.lineTo(x + w - rad, y); c.quadraticCurveTo(x + w, y, x + w, y + rad); c.lineTo(x + w, y + h - rad);
      c.quadraticCurveTo(x + w, y + h, x + w - rad, y + h); c.lineTo(x + rad, y + h); c.quadraticCurveTo(x, y + h, x, y + h - rad);
      c.lineTo(x, y + rad); c.quadraticCurveTo(x, y, x + rad, y); c.closePath();
    };
  }
  function Pcirc(cx, cy, r) { return function (c) { c.moveTo(cx + r, cy); c.arc(cx, cy, r, 0, 6.2832); c.closePath(); }; }
  var BIG = 2000;

  function V(x) {
    var v = { ctx: x, lw: 1.7, ol: OLC };
    v.path = function (p) { x.beginPath(); p(x); };
    // relleno plano con 1 sombra (abajo-derecha) y 1 brillo (arriba-izquierda), sin contorno
    v.flat = function (p, base, o) {
      o = o || {};
      var so = o.so == null ? 0.9 : o.so;
      x.save(); x.beginPath(); p(x); x.clip();
      if (o.sh) {
        x.fillStyle = o.sh; x.fillRect(-BIG, -BIG, BIG * 2, BIG * 2);
        x.fillStyle = base; x.save(); x.translate(-so * 0.8, -so); x.beginPath(); p(x); x.fill(); x.restore();
      } else { x.fillStyle = base; x.fillRect(-BIG, -BIG, BIG * 2, BIG * 2); }
      x.restore();
      if (o.hi) { // crescent de brillo: forma original menos la forma desplazada
        x.save(); x.beginPath(); p(x); x.clip(); x.fillStyle = o.hi;
        x.beginPath(); x.rect(-BIG, -BIG, BIG * 2, BIG * 2); x.save(); x.translate(so * 0.55, so * 0.65); p(x); x.restore(); x.fill('evenodd');
        x.restore();
      }
    };
    // parte con contorno grueso irregular
    v.part = function (p, base, o) {
      o = o || {};
      var lw = o.lw == null ? v.lw : o.lw, ol = o.ol || v.ol;
      if (lw > 0) v.outline(p, lw, ol);
      v.flat(p, base, o);
      return v;
    };
    v.outline = function (p, lw, ol) {
      x.strokeStyle = ol; x.lineWidth = lw; x.beginPath(); p(x); x.stroke();
      x.save(); x.translate(0.13, 0.1); x.lineWidth = lw * 0.82; x.beginPath(); p(x); x.stroke(); x.restore();
    };
    // varias formas que comparten un unico contorno exterior (nubes de lana, matas)
    v.cluster = function (ps, base, o) {
      o = o || {};
      var lw = o.lw == null ? v.lw : o.lw, i;
      for (i = 0; i < ps.length; i++) { x.fillStyle = o.ol || v.ol; v.outline(ps[i], lw, o.ol || v.ol); x.beginPath(); ps[i](x); x.fill(); }
      for (i = 0; i < ps.length; i++) v.flat(ps[i], base, o);
    };
    v.line = function (x0, y0, x1, y1, w, col) { x.strokeStyle = col; x.lineWidth = w; x.beginPath(); x.moveTo(x0, y0); x.lineTo(x1, y1); x.stroke(); };
    // trazo grueso con contorno (cuernos, ramas, palos)
    v.stick = function (pts, w, col, o) {
      o = o || {}; var lw = o.lw == null ? v.lw : o.lw, i;
      function tr() { x.beginPath(); x.moveTo(pts[0][0], pts[0][1]); if (o.curve) { for (i = 1; i < pts.length - 1; i++) x.quadraticCurveTo(pts[i][0], pts[i][1], (pts[i][0] + pts[i + 1][0]) / 2, (pts[i][1] + pts[i + 1][1]) / 2); x.lineTo(pts[pts.length - 1][0], pts[pts.length - 1][1]); } else for (i = 1; i < pts.length; i++) x.lineTo(pts[i][0], pts[i][1]); }
      x.strokeStyle = o.ol || v.ol; x.lineWidth = w + lw; tr(); x.stroke();
      x.strokeStyle = col; x.lineWidth = w; tr(); x.stroke();
      if (o.hi) { x.save(); x.translate(-w * 0.18, -w * 0.18); x.strokeStyle = o.hi; x.lineWidth = Math.max(0.3, w * 0.28); tr(); x.stroke(); x.restore(); }
    };
    v.dot = function (cx, cy, r, col) { x.fillStyle = col; x.beginPath(); x.arc(cx, cy, r, 0, 6.2832); x.fill(); };
    v.circ = function (cx, cy, r, base, o) { return v.part(Pcirc(cx, cy, r), base, o); };
    // ojo grande y expresivo: blanco con contorno, pupila que mira a (lx,ly)
    v.eye = function (cx, cy, r, o) {
      o = o || {};
      v.part(Pblob(cx, cy, r, r * (o.sy || 1), cx * 7 + 3, 0.03, 8), o.white || '#fffdf2', { lw: o.lw == null ? 0.55 : o.lw, sh: o.sh === false ? null : (o.shc || '#d8d2c4'), so: 0.4 });
      if (o.closed) { x.strokeStyle = v.ol; x.lineWidth = 0.7; x.beginPath(); x.arc(cx, cy - r * 0.1, r * 0.7, 0.15, 3.0); x.stroke(); return; }
      var lx = o.lx == null ? 0.35 : o.lx, ly = o.ly || 0, pr = r * (o.pr || 0.52);
      v.dot(cx + lx * r * 0.5, cy + ly * r * 0.5, pr, o.pc || v.ol);
      if (!o.nohl) v.dot(cx + lx * r * 0.5 - pr * 0.3, cy + ly * r * 0.5 - pr * 0.35, pr * 0.32, '#ffffff');
    };
    return v;
  }
  function vframe(w, h, draw, opt) {
    opt = opt || {};
    var c = mkCanvas(w * SCALE, h * SCALE), x = c.getContext('2d', { willReadFrequently: true });
    x.scale(SCALE, SCALE); x.lineJoin = 'round'; x.lineCap = 'round';
    var v = V(x); v.lw = opt.lw || 1.7; v.ol = opt.ol || OLC; v.w = w; v.h = h;
    draw(v, w, h);
    return c;
  }
  function vmk(name, w, h, fns, opt, anims) {
    var fr = [], i;
    for (i = 0; i < fns.length; i++) fr.push(vframe(w, h, fns[i], opt));
    return { name: name, w: w * SCALE, h: h * SCALE, frames: fr, anims: anims || null };
  }
  function addV(name, w, h, fns, opt, anims) { reg[name] = vmk(name, w, h, fns, opt, anims); order.push(name); return reg[name]; }
  var add2 = addV;
  function addBV(biome, name, w, h, fns, opt, anims) {
    var bl = biome === '*' ? ['bosque', 'cripta', 'asfodelo'] : (Array.isArray(biome) ? biome : [biome]);
    bl.forEach(function (b) { biomes[b][name] = vmk(name, w, h, fns, opt, anims); });
    if (bnames.indexOf(name) < 0) bnames.push(name);
  }

  // Frames de muerte: render vectorial del frame fuente -> caida/aplastado -> disolucion en brasas (a resolucion final)
  function dyingFrames(srcDraw, w, h, srcOpt, o) {
    o = o || {};
    var out = [], S = SCALE, W = w * S, H = h * S, srcC = null;
    var sxs = o.sx || [1.12, 1.15, 1.2, 1.2, 1.1], sys = o.sy || [0.95, 0.78, 0.6, 0.45, 0.3];
    var rots = o.rot || [0, 0.05, 0.1, 0.12, 0.1], dis = o.dis || [0, 0.04, 0.3, 0.6, 0.9], dy = o.dy || [0, 0, 0, 0, 0];
    var cw = Math.ceil(W / 2), nz = rng(555 + w * 3 + h), noise = [], i;
    for (i = 0; i < cw * Math.ceil(H / 2); i++) noise.push(nz());
    function make(k) {
      return function (g) {
        if (!srcC) srcC = vframe(w, h, srcDraw, srcOpt);
        var t = mkCanvas(W, H), tx = t.getContext('2d', { willReadFrequently: true }), by = (h - 2) * S;
        tx.translate(W / 2 + (o.dx ? o.dx[k] : 0) * S, by + dy[k] * S); tx.rotate(rots[k]); tx.scale(sxs[k], sys[k]); tx.drawImage(srcC, -W / 2, -by);
        var im = tx.getImageData(0, 0, W, H), d = im.data, rr = rng(97 + k * 13 + w), x, y, p;
        var gone = new Uint8Array(W * H);
        for (y = 0; y < H; y++) for (x = 0; x < W; x++) { var q = noise[(y >> 1) * cw + (x >> 1)] * 0.72 + (1 - y / H) * 0.28; gone[y * W + x] = q < dis[k] ? 1 : 0; }
        var res = new Uint8ClampedArray(d);
        for (y = 0; y < H; y++) for (x = 0; x < W; x++) {
          p = (y * W + x) * 4;
          if (d[p + 3] < 20) continue;
          if (gone[y * W + x]) { res[p + 3] = 0; continue; }
          if (k === 0) { res[p] = d[p] + (255 - d[p]) * 0.6; res[p + 1] = d[p + 1] + (255 - d[p + 1]) * 0.6; res[p + 2] = d[p + 2] + (255 - d[p + 2]) * 0.6; }
          else if (k === 1) { res[p] = Math.min(255, d[p] * 1.1 + 60); res[p + 1] = d[p + 1] * 0.55; res[p + 2] = d[p + 2] * 0.55; }
          else if (k >= 3 && o.ash !== false) { var l = (d[p] + d[p + 1] + d[p + 2]) / 3; res[p] = l * 0.55 + 24; res[p + 1] = l * 0.5 + 20; res[p + 2] = l * 0.6 + 30; }
          if (k >= 2 && d[p + 3] > 100) {
            var edge = false, nb = [[2, 0], [-2, 0], [0, 2], [0, -2]];
            for (var m = 0; m < 4; m++) { var nx = x + nb[m][0], ny = y + nb[m][1]; if (nx < 0 || ny < 0 || nx >= W || ny >= H || gone[ny * W + nx]) { edge = true; break; } }
            if (edge && ((x >> 1) * 7 + (y >> 1) * 13 + k) % 9 < 5) { var cc = ((x >> 1) + (y >> 1)) % 2 ? [255, 138, 42] : [255, 200, 61]; res[p] = cc[0]; res[p + 1] = cc[1]; res[p + 2] = cc[2]; }
          }
        }
        im.data.set(res); tx.putImageData(im, 0, 0);
        if (k >= 2) for (i = 0; i < 3 + k * 2; i++) { tx.fillStyle = rr() < 0.5 ? '#ff8a2a' : '#ffc83d'; tx.fillRect(((rr() * W) | 0) & ~1, ((H * 0.15 + rr() * H * (0.9 - k * 0.12)) | 0) & ~1, 2, 2); }
        g.ctx.drawImage(t, 0, 0, w, h);
      };
    }
    for (var k = 0; k < 5; k++) out.push(make(k));
    return out;
  }
  var DIE_ANIM = function (idx) { return { f: idx, fps: 9, loop: false }; };
  var PH = []; for (var pk = 0; pk < 6; pk++) PH.push(pk * Math.PI / 3);

  // ------------------------------------------------------------------ JUGADOR (Marlo, el Tahur: mapache con chaleco teal y baraja)
  var K = {
    fur: '#7f8fa6', furS: '#586579', furH: '#aab8cc', dark: '#2a2c3a', darkS: '#181a24',
    cream: '#e8e4d4', creamS: '#b9b4a0', vest: '#1fa8a0', vestS: '#126a70', vestH: '#58d6c8',
    jade: '#2ec27e', jadeB: '#1a6a46', jadeH: '#9bf0c8', amber: '#f3a31f', amberS: '#b46c10'
  };
  var SUITS = ['#e8433a', '#3a7be8', '#f2c133', '#3ac86a'];
  // naipe centrado en (cx,cy), rotado rot (rad), w x h, con marca de color
  function pcard(v, cx, cy, rot, w, h, mark) {
    var x = v.ctx;
    x.save(); x.translate(cx, cy); x.rotate(rot);
    if (mark === 'back') { // reverso teal con rombo ambar
      v.part(Prr(-w / 2, -h / 2, w, h, 0.5), K.vest, { lw: 0.75, sh: K.vestS, hi: K.vestH, so: 0.35 });
      v.part(Ppoly([[0, -h * 0.26], [w * 0.24, 0], [0, h * 0.26], [-w * 0.24, 0]]), K.amber, { lw: 0, sh: null });
    } else {
      v.part(Prr(-w / 2, -h / 2, w, h, 0.5), K.cream, { lw: 0.75, sh: K.creamS, so: 0.35 });
      v.dot(0, -h * 0.12, w * 0.2, mark || K.amber);
      v.dot(-w * 0.28, -h * 0.34, 0.28, mark || K.amber);
    }
    x.restore();
  }
  // carta en la mano delantera: hx,hy = mano; tx,ty = hacia donde apunta (misma ancla que la antigua espada)
  function cardHand(v, hx, hy, tx, ty, fly) {
    var dx = tx - hx, dy = ty - hy, len = Math.sqrt(dx * dx + dy * dy) || 1, ux = dx / len, uy = dy / len, rot = Math.atan2(dy, dx) + Math.PI / 2;
    if (fly) { // lanzamiento: lineas de movimiento detras
      v.line(hx - ux * 3 - uy * 2.6, hy - uy * 3 + ux * 2.6, hx - ux * 6.4 - uy * 2.6, hy - uy * 6.4 + ux * 2.6, 0.6, 'rgba(255,255,255,0.85)');
      v.line(hx - ux * 2.4 + uy * 2.6, hy - uy * 2.4 - ux * 2.6, hx - ux * 5.8 + uy * 2.6, hy - uy * 5.8 - ux * 2.6, 0.6, 'rgba(255,255,255,0.85)');
    }
    pcard(v, hx + ux * 3.1, hy + uy * 3.1, rot, 3.1, 4.8, K.amber);
    // puno + manguito
    v.part(Pblob(hx - ux * 0.6, hy - uy * 0.6, 1.4, 1.35, 7), K.dark, { sh: K.darkS, so: 0.4, lw: 0.9 });
  }
  function racoon(v, o) {
    var x = v.ctx, by = o.by || 0, L = o.legs || [0, 0], fl = o.fl || 0, lf = o.lift || [0, 0], ea = o.ear || 0, i;
    // 1. cola alta y rayada (detras)
    var tl = fl * 0.6, tw = o.hurt ? 4.4 : 3.5;
    var tp = o.hurt ? [[7.6, 17.8 + by], [4.6, 15.2 + by], [3.6, 10.4 + by], [3.4, 5.6 + by], [4.2, 2.4 + by]]
      : [[7.6, 17.8 + by], [4.8, 16.2 + by], [3.8, 12 + by], [4 + tl * 0.5, 7.6 + by], [5 + tl, 4.4 + by]];
    v.stick(tp, tw, K.fur, { lw: 1.5, hi: K.furH });
    var segs = [], tot = 0, s;
    for (i = 0; i < tp.length - 1; i++) { var d = Math.hypot(tp[i + 1][0] - tp[i][0], tp[i + 1][1] - tp[i][1]); segs.push(d); tot += d; }
    [0.2, 0.4, 0.6, 0.8].forEach(function (f) {
      var dist = f * tot, k = 0; while (k < segs.length - 1 && dist > segs[k]) { dist -= segs[k]; k++; }
      var t = dist / segs[k], px = tp[k][0] + (tp[k + 1][0] - tp[k][0]) * t, py = tp[k][1] + (tp[k + 1][1] - tp[k][1]) * t;
      var ux = (tp[k + 1][0] - tp[k][0]) / segs[k], uy = (tp[k + 1][1] - tp[k][1]) / segs[k], hw = tw / 2 - 0.55;
      v.line(px - uy * hw, py + ux * hw, px + uy * hw, py - ux * hw, o.hurt ? 1.5 : 1.15, K.dark);
    });
    var te = tp[tp.length - 1]; v.dot(te[0], te[1], tw / 2 - 0.15, K.cream);
    v.part(Pblob(te[0] + 0.2, te[1] - tw / 2 - 0.1, 1.15, 1.15, 5, 0.05, 6), '#ff8a2a', { lw: 0.6, sh: '#c8501c', so: 0.2 }); // ficha de ceniza
    // 2. patas
    for (i = 0; i < 2; i++) v.part(Prr((i ? 14 : 8.8) + L[i], 19.3 - lf[i], 2.7, 3.7, 1.2), K.dark, { sh: K.darkS, so: 0.6, lw: 1.2 });
    // 3. abanico de cartas a la cintura + brazo trasero
    var pv = [6.9, 17.6 + by];
    var ang = o.hurt ? [128, 156, 184] : [122, 146, 170, 194];
    for (i = ang.length - 1; i >= 0; i--) {
      var a = ang[i] * Math.PI / 180;
      pcard(v, pv[0] + Math.cos(a) * 2.9, pv[1] + Math.sin(a) * 2.9, a + Math.PI / 2, 2.6, 4.2, 'back');
    }
    v.part(Pblob(6.8, 16.6 + by, 1.7, 1.6, 4), K.dark, { sh: K.darkS, so: 0.5, lw: 1 });
    // 4. cuerpo + chaleco
    v.part(Pblob(12, 15.5 + by, 5.2, 5.4, 3, 0.03, 10), K.fur, { sh: K.furS, hi: K.furH, so: 0.9, lw: 1.5 });
    v.part(Pclosed([[8.3, 12.6 + by], [10.8, 12.1 + by], [12.5, 13.8 + by], [14.2, 12.1 + by], [16.6, 12.6 + by], [16.6, 18 + by], [12.5, 20.4 + by], [8.4, 18 + by]]), K.vest, { sh: K.vestS, hi: K.vestH, so: 0.8, lw: 1 });
    v.flat(Ppoly([[10.5, 12.4 + by], [14.6, 12.4 + by], [12.5, 15.6 + by]]), K.cream, { sh: K.creamS, so: 0.3 });
    v.line(10.5, 12.4 + by, 12.5, 15.6 + by, 0.5, OLC); v.line(14.6, 12.4 + by, 12.5, 15.6 + by, 0.5, OLC);
    v.part(Pcirc(12.5, 17.4 + by, 0.95), K.amber, { lw: 0.5, sh: K.amberS, so: 0.3 });
    // brazo delantero (antes de la cabeza)
    var c = o.card, hx = c ? c[0] : 20, hy = c ? c[1] : 16;
    v.stick([[15.4, 14.8 + by], [(15.4 + hx) / 2 + 0.2, (14.8 + by + hy) / 2 + 0.8], [hx, hy]], 2.2, K.dark, { lw: 0.9, curve: true });
    // 5. orejas
    [8.4, 15.8].forEach(function (ex, k) {
      v.part(Pcirc(ex, 5.2 + by + ea, 1.95), K.fur, { sh: K.furS, so: 0.4, lw: 1.1 });
      v.part(Pcirc(ex + (k ? -0.15 : 0.15), 5.5 + by + ea, 0.95), K.dark, { lw: 0 });
    });
    // 6. cabeza + antifaz + hocico
    v.part(Pblob(12.6, 9.2 + by, 5.6, 4.4, 12, 0.025, 10), K.fur, { sh: K.furS, hi: K.furH, so: 0.8, lw: 1.5 });
    v.part(Pclosed([[8.6, 9.1 + by], [9.8, 7.3 + by], [12, 8.2 + by], [14.2, 7 + by], [17.2, 8 + by], [17.6, 10.6 + by], [14.6, 11.6 + by], [11.4, 11.8 + by], [8.8, 10.8 + by]]), K.dark, { sh: K.darkS, so: 0.4, lw: 0.7 });
    v.part(Pblob(16.8, 11.5 + by, 2.7, 1.9, 6), K.cream, { sh: K.creamS, so: 0.4, lw: 0.9 });
    v.dot(19.2, 10.9 + by, 0.85, K.dark);
    v.line(18.4, 12.2 + by, 21.6, 11.6 + by, 0.35, 'rgba(255,255,255,0.8)'); v.line(18.4, 12.6 + by, 21.4, 13.2 + by, 0.35, 'rgba(255,255,255,0.8)');
    // 7. ojos
    var ey = 9.5 + by, e1 = 11.4, e2 = 15.1;
    if (o.hurt) {
      [e1, e2].forEach(function (ex) { v.line(ex - 1.2, ey - 1.2, ex + 1.2, ey + 1.2, 0.85, K.amber); v.line(ex + 1.2, ey - 1.2, ex - 1.2, ey + 1.2, 0.85, K.amber); });
    } else if (o.blink) {
      [e1, e2].forEach(function (ex) { v.line(ex - 1.5, ey, ex + 1.5, ey, 0.85, K.amber); });
    } else {
      var wc = o.fury ? '#ffd23a' : K.amber;
      v.eye(e1, ey, 1.75, { white: wc, pc: K.dark, lx: 0.5, pr: 0.5, lw: 0.35, sh: false }); v.eye(e2, ey, 1.75, { white: wc, pc: K.dark, lx: 0.5, pr: 0.5, lw: 0.35, sh: false });
      if (o.fury) { v.line(e1 - 2, ey - 2.5, e1 + 1.8, ey - 1.5, 0.9, OLC); v.line(e2 + 2, ey - 2.5, e2 - 1.8, ey - 1.5, 0.9, OLC); }
    }
    // 8. visera de crupier (verde jade translucida)
    x.save();
    if (o.hurt) { x.translate(12.6, 6.4 + by); x.rotate(0.26); x.translate(-12.6, -6.4 - by); }
    x.globalAlpha = 0.92;
    v.part(Prr(7.4, 5.1 + by, 10.4, 2.2, 0.9), K.jade, { sh: K.jadeB, hi: K.jadeH, so: 0.5, lw: 0.9 });
    v.part(Ppoly([[16, 5.5 + by], [20.6, 6.6 + by], [16.2, 7.5 + by]]), K.jade, { sh: K.jadeB, hi: K.jadeH, so: 0.3, lw: 0.8 });
    x.restore();
    // 9. boca
    if (o.hurt) { v.part(Pblob(17, 12.9 + by, 1.2, 1.1, 8), '#ff6a8a', { lw: 0.5, sh: '#c8344c', so: 0.2 }); }
    else if (o.fury) { x.strokeStyle = OLC; x.lineWidth = 0.7; x.beginPath(); x.moveTo(15.2, 12.3 + by); x.quadraticCurveTo(17.2, 14.2 + by, 19, 12.1 + by); x.stroke(); v.dot(17.2, 13.2 + by, 0.4, '#fff'); }
    else { x.strokeStyle = OLC; x.lineWidth = 0.6; x.beginPath(); x.moveTo(15.8, 12.4 + by); x.quadraticCurveTo(17.2, 13.4 + by, 18.6, 12.1 + by); x.stroke(); }
    // 10. carta en mano delantera
    if (c) cardHand(v, c[0], c[1], c[2], c[3], o.fly);
    if (o.flying) pcard(v, 19.6, 3.8, 0.5, 3.6, 5.2, '#e8433a');
  }
  function ball(k) {
    return function (v) {
      var x = v.ctx, cx = 12, cy = 12.5, a = k * Math.PI / 2;
      function at(an, rr) { return [cx + Math.cos(an) * rr, cy + Math.sin(an) * rr]; }
      // cola envolvente como anillo exterior rayado
      x.save(); x.lineCap = 'butt';
      x.strokeStyle = OLC; x.lineWidth = 5.2; x.beginPath(); x.arc(cx, cy, 7.4, 0, 6.2832); x.stroke();
      x.strokeStyle = K.fur; x.lineWidth = 3.6; x.stroke();
      x.strokeStyle = K.dark; x.lineWidth = 3.6; x.setLineDash([1.4, 2.5]); x.lineDashOffset = -k * 2; x.stroke(); x.setLineDash([]);
      x.restore();
      var tp = at(a + 3.6, 7.4); v.dot(tp[0], tp[1], 1.9, K.cream);
      v.part(Pcirc(cx, cy, 5.5), K.fur, { sh: K.furS, hi: K.furH, so: 0.8, lw: 1.4 });
      var p = at(a + 1.9, 4.2); // vientre con chaleco
      v.part(Pblob(p[0], p[1], 2.7, 2.2, 3, 0.05, 8, a + 1.9), K.vest, { sh: K.vestS, hi: K.vestH, lw: 0.8, so: 0.5 });
      p = at(a + 4.4, 4.6); pcard(v, p[0], p[1], a + 4.4 + 1.57, 3, 4.4, SUITS[k % 4]);
      p = at(a - 0.9, 5.6); v.part(Pcirc(p[0], p[1], 1.5), K.fur, { sh: K.furS, lw: 0.9, so: 0.3 }); v.dot(p[0], p[1], 0.6, K.dark);
      // cabeza con antifaz mirando hacia fuera
      p = at(a, 4.6);
      x.save(); x.translate(p[0], p[1]); x.rotate(a);
      v.part(Pblob(0, 0, 3.3, 3.1, 9, 0.03, 8), K.fur, { sh: K.furS, hi: K.furH, so: 0.5, lw: 1 });
      v.part(Prr(0.1, -2.7, 2.6, 5.4, 1), K.dark, { sh: K.darkS, lw: 0.5, so: 0.3 });
      v.part(Pblob(2.7, 0, 1.5, 1.2, 10), K.cream, { sh: K.creamS, lw: 0.6, so: 0.3 });
      v.dot(3.9, 0, 0.5, K.dark); v.dot(1.5, -1.3, 0.55, K.amber); v.dot(1.5, 1.3, 0.55, K.amber);
      x.restore();
    };
  }
  function walkPose(k) {
    var p = PH[k], c = Math.round(1.3 * Math.cos(p)), s = Math.sin(p), by = Math.abs(s) > 0.8 ? -1 : 0;
    return { by: by, legs: [-c, c], lift: [s > 0.5 ? 1 : 0, s < -0.5 ? 1 : 0], fl: [0, 1, 1, 0, -1, -1][k], ear: by ? 0 : 1 };
  }
  function plWalk(k) { var o = walkPose(k); o.card = [20, 16 + o.by, 23, 8 + o.by]; return function (g) { racoon(g, o); }; }
  var plDraw = { hurt: function (g) { racoon(g, { by: 1, hurt: true, card: [18, 16.5, 21, 21], fl: -1, flying: true }); } };
  var pl = [];
  pl.push(function (g) { racoon(g, { by: 0, card: [20, 16, 23, 8] }); });
  pl.push(function (g) { racoon(g, { by: 1, card: [20, 17, 23, 9], legs: [0, 0], ear: 1, fl: 1 }); });
  pl.push(plWalk(0)); pl.push(plWalk(1)); pl.push(plWalk(3)); pl.push(plWalk(4));
  pl.push(function (g) { racoon(g, { by: 0, legs: [0, 1], card: [20.5, 13.5, 22, 3], fl: -1 }); });                       // 6 carta arriba
  pl.push(function (g) { racoon(g, { by: 0, legs: [-1, 2], card: [17.5, 14.8, 23.5, 14.8], fl: 2, fury: true, fly: true }); }); // 7 lanzamiento
  pl.push(function (g) { racoon(g, { by: 1, legs: [-1, 1], card: [19, 17, 22, 22], fl: 1 }); });                           // 8 recogida
  for (var ri = 0; ri < 4; ri++) pl.push(ball(ri));
  pl.push(plDraw.hurt);
  pl.push(plWalk(2)); pl.push(plWalk(5));
  pl.push(function (g) { racoon(g, { by: 1, legs: [1, -1], card: [14.5, 16.5, 9.5, 11.5], fl: -2, ear: 1 }); });             // 16 anticipacion
  pl.push(function (g) { racoon(g, { by: 0, legs: [0, 1], card: [19, 17, 21, 22], fl: 2 }); });                              // 17 seguimiento (cola arriba)
  pl.push(function (g) { racoon(g, { by: 0, blink: true, card: [20, 16, 23, 8] }); });
  var plDie0 = pl.length;
  dyingFrames(plDraw.hurt, 24, 24, null, { rot: [-0.1, -0.55, -1.25, -1.5, -1.55], sx: [1, 1, 1, 1, 1], sy: [1, 0.96, 0.92, 0.9, 0.85], dx: [0, 2, 7, 11, 11], dy: [0, 0, 0, 0, 0], dis: [0, 0, 0, 0.3, 0.75], ash: false }).forEach(function (f) { pl.push(f); });
  addV('player', 24, 24, pl, null, {
    idle: { f: [0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 18, 0, 0, 1, 1, 1, 1, 1, 1, 0], fps: 6 },
    walk: { f: [2, 3, 14, 4, 5, 15], fps: 12 },
    attack: { f: [16, 6, 7, 8, 17], fps: 18 }, attack_hit: { f: [7], fps: 1 },
    roll: { f: [9, 10, 11, 12], fps: 14 }, hurt: { f: [13], fps: 1 },
    die: DIE_ANIM([13, plDie0, plDie0 + 1, plDie0 + 2, plDie0 + 3, plDie0 + 4])
  });

  // ------------------------------------------------------------------ ENEMIGOS (formas blandas, ojos grandes, colores vivos)
  // --- Gusano: larva morada con cuernitos rojos (16x16)
  function worm(ph, o) {
    o = o || {};
    return function (v) {
      var hx = o.hx || 0, hy = o.hy || 0, pos = [[3.4, 11], [6.6, 10.6], [9.6, 10.4]], i;
      for (i = 0; i < 3; i++) {
        var oy = Math.round(Math.sin(ph + i * 1.3) * 1.2) + (i === 2 ? hy * 0.5 : 0), sx = pos[i][0] + (i === 2 ? hx * 0.5 : 0), r = 2.5 + i * 0.35;
        v.part(Pblob(sx, pos[i][1] + oy, r, r * 0.95, 20 + i), '#9a58e0', { sh: '#6230a8', hi: '#c394f5', so: 0.7, lw: 1.3 });
        v.line(sx - 0.2, pos[i][1] + oy - r * 0.5, sx + 0.5, pos[i][1] + oy + r * 0.5, 0.5, '#d9c1ff');
      }
      var hxx = 12.2 + hx, hyy = 9.2 + hy + Math.round(Math.sin(ph + 3.9) * 0.8);
      v.part(Ppoly([[hxx - 2.6, hyy - 2.8], [hxx - 3.4, hyy - 5.8], [hxx - 1, hyy - 3.6]]), '#ff4a3a', { sh: '#b0202a', lw: 0.9, so: 0.3 });
      v.part(Ppoly([[hxx + 1.2, hyy - 3.4], [hxx + 2.6, hyy - 6.2], [hxx + 3.2, hyy - 2.8]]), '#ff4a3a', { sh: '#b0202a', lw: 0.9, so: 0.3 });
      v.part(Pblob(hxx, hyy, 4.1, 3.7, 25), '#a866ee', { sh: '#6a34b0', hi: '#cfa4fb', so: 0.8, lw: 1.4 });
      v.eye(hxx - 0.4, hyy - 0.8, 1.55, { lx: 0.7, pr: 0.55, lw: 0.4 }); v.eye(hxx + 2.8, hyy - 0.8, 1.55, { lx: 0.7, pr: 0.55, lw: 0.4 });
      if (o.open) { v.part(Pblob(hxx + 1.8, hyy + 2, 1.6, 1.2, 8), '#5a0e22', { lw: 0.5 }); v.dot(hxx + 1.2, hyy + 1.2, 0.4, '#fff'); v.dot(hxx + 2.5, hyy + 1.2, 0.4, '#fff'); }
      else v.line(hxx + 0.2, hyy + 2.1, hxx + 2.4, hyy + 2.1, 0.6, OLC);
    };
  }
  var wF = [worm(PH[0]), worm(PH[3]), worm(PH[1]), worm(PH[2]), worm(PH[4]), worm(PH[5]),
    worm(PH[0], { hx: -2, hy: -3 }), worm(PH[0], { hx: 2, hy: 1, open: true }), worm(PH[3], { hx: 0, hy: 1 })];
  var wDie = wF.length;
  dyingFrames(worm(PH[0]), 16, 16).forEach(function (f) { wF.push(f); });
  addV('worm', 16, 16, wF, { lw: 1.4 }, {
    walk: { f: [0, 2, 3, 1, 4, 5], fps: 9 }, attack: { f: [6, 7, 8], fps: 10 },
    die: DIE_ANIM([wDie, wDie + 1, wDie + 2, wDie + 3, wDie + 4])
  });

  // --- Arquero: cultista azul encapuchado con cuernitos (20x20)
  function archer(o) {
    return function (v) {
      var x = v.ctx, by = o.by || 0, hh = o.hem || 0, rb = '#2f74dc', rbS = '#1c3f9a', rbH = '#6aa4ff';
      v.part(Pclosed([[6.4, 9 + by], [11.6, 9 + by], [14.4, 15.5 + by], [13.4 + hh, 18.4], [9, 17.4], [4.8 + hh, 18.4], [3.8, 15.5 + by]]), rb, { sh: rbS, hi: rbH, so: 1.1, lw: 1.4 });
      v.part(Prr(4.4, 12.6 + by, 9.2, 1.5, 0.7), '#f2c133', { lw: 0.6, sh: '#b8801e', so: 0.3 });
      x.strokeStyle = '#f7f1e0'; x.lineWidth = 0.55;
      for (var i = 0; i < 3; i++) { x.beginPath(); x.moveTo(7.3, 14.4 + by + i * 1.0); x.lineTo(10.7, 14.4 + by + i * 1.0); x.stroke(); }
      v.line(9, 13.8 + by, 9, 17 + by, 0.5, '#f7f1e0');
      // arco
      var bw = o.draw ? 15 : 16.4;
      x.strokeStyle = OLC; x.lineWidth = 2.6; x.beginPath(); x.moveTo(13.6, 3 + by); x.quadraticCurveTo(bw + 4.4, 10 + by, 13.6, 17 + by); x.stroke();
      x.strokeStyle = '#c4712c'; x.lineWidth = 1.2; x.stroke();
      x.strokeStyle = '#f7f1e0'; x.lineWidth = 0.45; x.beginPath(); x.moveTo(13.6, 3 + by);
      if (o.draw) x.lineTo(11.4, 10 + by); else if (o.nock) x.lineTo(12.4, 10 + by);
      if (o.draw || o.nock) x.lineTo(13.6, 17 + by); else x.lineTo(13.6, 17 + by); x.stroke();
      if (o.rel) { v.dot(18.6, 6.8 + by, 0.7, '#ffd34a'); v.dot(19, 10.4 + by, 0.8, '#fff3b0'); v.dot(18.4, 13.2 + by, 0.7, '#ffd34a'); }
      if (o.draw) { v.line(11.4, 10 + by, 18.6, 10 + by, 1.5, OLC); v.line(11.8, 10 + by, 18.4, 10 + by, 0.7, '#e8dcff'); v.part(Ppoly([[18.2, 8.8 + by], [19.9, 10 + by], [18.2, 11.2 + by]]), '#ff9a2a', { lw: 0.5 }); }
      if (o.nock) { v.line(12.4, 10 + by, 17.2, 10 + by, 1.5, OLC); v.line(12.6, 10 + by, 17, 10 + by, 0.7, '#e8dcff'); }
      v.part(Pblob(11.8, 10.2 + by, 1.5, 1.4, 6), '#1c3f9a', { lw: 0.9, so: 0.4 });
      // capucha + cuernitos
      v.part(Ppoly([[4.4, 3.4 + by], [3.2, 0.4 + by], [6.2, 2.4 + by]]), '#f4e8c8', { sh: '#c9b78e', lw: 0.9, so: 0.3 });
      v.part(Ppoly([[12.6, 3.4 + by], [14.2, 0.2 + by], [10.8, 2.2 + by]]), '#f4e8c8', { sh: '#c9b78e', lw: 0.9, so: 0.3 });
      v.part(Pblob(8.6, 6.6 + by, 5, 4.6, 31, 0.03), rb, { sh: rbS, hi: rbH, so: 0.9, lw: 1.4 });
      v.part(Pblob(9.8, 7.1 + by, 3.4, 3, 32, 0.03), '#150c2a', { lw: 0.5 });
      var ec = o.blink ? '#2a2a66' : '#ffd23a';
      if (o.blink) { v.line(8, 7 + by, 9.6, 7 + by, 0.6, ec); v.line(10.8, 7 + by, 12.4, 7 + by, 0.6, ec); }
      else { v.eye(8.7, 6.9 + by, 1.2, { white: '#ffe45a', lx: 0.8, pr: 0.5, lw: 0.1, sh: false, nohl: true }); v.eye(11.5, 6.9 + by, 1.2, { white: '#ffe45a', lx: 0.8, pr: 0.5, lw: 0.1, sh: false, nohl: true }); }
    };
  }
  function arWalk(k) { var c = (1 - Math.cos(PH[k])) / 2; return archer({ by: -Math.round(c), hem: Math.round(c) }); }
  var aF = [archer({ by: 0, hem: 0 }), archer({ by: -1, hem: 1 }), archer({ by: 0, draw: true }),
    arWalk(1), arWalk(2), arWalk(4), arWalk(5), archer({ nock: true }), archer({ rel: true, by: 0 }), archer({ by: 1, hem: 0 }), archer({ blink: true })];
  var aDie = aF.length;
  dyingFrames(archer({ by: 0 }), 20, 20).forEach(function (f) { aF.push(f); });
  addV('archer', 20, 20, aF, { lw: 1.4 }, {
    walk: { f: [0, 3, 4, 1, 5, 6], fps: 8 }, shoot: { f: [7, 2, 8, 9], fps: 10 }, aim: { f: [2], fps: 1 },
    idle: { f: [0, 0, 0, 1, 1, 1, 10], fps: 4 },
    die: DIE_ANIM([aDie, aDie + 1, aDie + 2, aDie + 3, aDie + 4])
  });

  // --- Jabali: naranja con cuernos y colmillos (24x18)
  function boar(o) {
    return function (v) {
      var x = v.ctx, by = o.by || 0, body = '#f08030', dark = '#b04a1c', light = '#ffae5a', hy = (o.low ? 2 : 0) + (o.hy || 0);
      var lg = o.legs || [0, 0, 0, 0], lx = [5.4, 8.4, 14.2, 17], rs = o.raise || [0, 0, 0, 0];
      for (var i = 0; i < 4; i++) v.part(Prr(lx[i] + lg[i], 13 + by - rs[i], 2.4, 3.6 + rs[i] * 0 - (by > 0 ? 0 : 0), 1), i % 2 ? '#8a3a18' : '#a8481c', { sh: '#5a2210', lw: 1, so: 0.4 });
      // cresta
      v.part(Ppoly([[4.5, 6 + by], [5.4, 1.8 + by], [7.4, 4.6 + by], [9, 0.8 + by], [11, 4.2 + by], [13.2, 1 + by], [14.4, 5 + by], [15.5, 6.5 + by]]), '#7a1a2a', { sh: '#4a0e1c', lw: 1.1, so: 0.3 });
      v.part(Pblob(10.6, 9.6 + by, 8.6, 5.7, 41, 0.03), body, { sh: dark, hi: light, so: 1.2, lw: 1.5 });
      v.part(Pblob(7.5, 10.5 + by, 3, 2, 42), '#ffc890', { lw: 0, so: 0.2 });
      // cabeza
      v.part(Ppoly([[15.6, 5 + by + hy], [16.4, 1.6 + by + hy], [18.6, 5 + by + hy]]), '#f6e6b8', { sh: '#c9b078', lw: 0.9, so: 0.3 });
      v.part(Pblob(18, 9.4 + by + hy, 4.3, 4, 43, 0.03), body, { sh: dark, hi: light, so: 0.9, lw: 1.4 });
      v.part(Pblob(21.2, 11 + by + hy, 2.6, 2.2, 44), '#ffc7a0', { sh: '#d98a68', so: 0.5, lw: 1.1 });
      v.dot(21.4, 10.3 + by + hy, 0.4, OLC); v.dot(22.4, 11.5 + by + hy, 0.4, OLC);
      x.strokeStyle = OLC; x.lineWidth = 2.2; x.beginPath(); x.moveTo(19.4, 12.6 + by + hy); x.quadraticCurveTo(19.2, 15.4 + by + hy, 20.8, 15.2 + by + hy); x.stroke();
      x.strokeStyle = '#fbf3df'; x.lineWidth = 1; x.stroke();
      var ang = o.rage || o.angry;
      if (o.blink) v.line(17.4, 8.4 + by + hy, 19.8, 8.4 + by + hy, 0.7, OLC);
      else { v.eye(18.4, 8.3 + by + hy, 1.6, { lx: 0.8, pr: 0.55, lw: 0.45, white: ang ? '#ffe9d0' : '#fffdf2' }); if (ang) v.line(16.4, 6 + by + hy, 20, 7.2 + by + hy, 1, '#5a1010'); }
      if (o.rage) { v.line(0.6, 6 + by, 3.4, 6 + by, 0.8, 'rgba(255,220,150,0.9)'); v.line(1.4, 10 + by, 4, 10 + by, 0.8, 'rgba(255,220,150,0.8)'); }
      if (o.hit) { v.dot(23.2, 9 + by + hy, 0.7, '#fff'); v.dot(22.6, 14.4 + by + hy, 0.6, '#ffd36a'); v.dot(21.6, 7.4 + by + hy, 0.6, '#ffd36a'); }
      if (o.paw) { v.dot(18, 17.2, 0.6, '#8a7a90'); v.dot(20.4, 16.4, 0.5, '#8a7a90'); v.dot(16, 17.2, 0.5, '#8a7a90'); }
    };
  }
  function boWalk(k) { var cs = Math.cos(PH[k]), c = Math.round(cs), by = -(Math.abs(Math.sin(PH[k])) > 0.8 ? 1 : 0); return boar({ by: by, legs: [-c, c, c, -c] }); }
  var bF = [boar({ by: 0, legs: [-1, 1, 1, -1] }), boar({ by: -1, legs: [1, -1, -1, 1] }), boar({ by: 1, low: true, rage: true, legs: [-2, 2, 2, -2] }),
    boWalk(1), boWalk(2), boWalk(4), boWalk(5),
    boar({ by: 1, low: true, angry: true, legs: [0, 0, 1, -1], raise: [0, 0, 0, 1], paw: true }),
    boar({ by: 0, low: false, hy: -1, rage: true, legs: [-2, 2, 2, -2], hit: true }),
    boar({ by: 0, legs: [0, 0, 0, 0], angry: true }),
    boar({ by: 0, legs: [-1, 1, 1, -1], blink: true })];
  var bDie = bF.length;
  dyingFrames(boar({ by: 0, legs: [-1, 1, 1, -1] }), 24, 18, null, { dx: [0, 0, 0, 0, 0] }).forEach(function (f) { bF.push(f); });
  addV('boar', 24, 18, bF, { lw: 1.5 }, {
    walk: { f: [0, 3, 4, 1, 5, 6], fps: 10 }, charge: { f: [2], fps: 1 }, attack: { f: [7, 7, 2, 8, 9], fps: 10 },
    idle: { f: [0, 0, 0, 0, 10], fps: 4 },
    die: DIE_ANIM([bDie, bDie + 1, bDie + 2, bDie + 3, bDie + 4])
  });

  // --- Bomba: criatura roja con cuernitos y mecha (16x16)
  function bomb(o) {
    return function (v) {
      var by = o.by || 0, lit = o.lit, rad = o.big ? 6.8 : 6, f = o.f || 0;
      var b = lit ? (o.lit === 2 ? '#ffb02a' : '#ff6a22') : '#d8302e', bs = lit ? '#c8341c' : '#8a1428', bh = lit ? '#fff0a0' : '#ff6a58';
      v.part(Prr(4 + f, 13, 2.6, 2.4, 1), '#5a1428', { lw: 1, sh: '#38081a', so: 0.3 }); v.part(Prr(9.4 - f, 13, 2.6, 2.4, 1), '#5a1428', { lw: 1, sh: '#38081a', so: 0.3 });
      v.part(Ppoly([[2.6, 6 + by], [1.6, 2.4 + by], [5, 4.2 + by]]), '#2c2234', { lw: 0.9, sh: '#120a18', so: 0.3 });
      v.part(Ppoly([[13.4, 6 + by], [14.4, 2.4 + by], [11, 4.2 + by]]), '#2c2234', { lw: 0.9, sh: '#120a18', so: 0.3 });
      v.part(Pblob(8, 8.8 + by, rad, rad * 0.94, 51, 0.03), b, { sh: bs, hi: bh, so: 1, lw: 1.4 });
      // mecha
      v.stick([[8, 3.2 + by], [8.8, 1.6 + by], [11.2, 1.2 + by]], 0.9, '#a0693a', { lw: 0.8 });
      var fx = 11.8, fy = 1 + (o.big ? -0.2 : 0);
      v.part(Pblob(fx, fy, 1.5, 1.9, 7), lit ? '#fff2a8' : '#ff9a2a', { lw: 0.6, sh: '#ff5a22', so: 0.4 });
      v.dot(fx, fy + 0.3, 0.5, '#fff'); if (lit) v.dot(fx + 1.8, fy - 1, 0.4, '#ffd34a');
      v.eye(5.7, 8 + by, 1.9, { lx: 0.4, pr: 0.55, lw: 0.45, white: lit ? '#ffffff' : '#fffdf2' }); v.eye(10.3, 8 + by, 1.9, { lx: 0.4, pr: 0.55, lw: 0.45, white: lit ? '#ffffff' : '#fffdf2' });
      v.part(Pblob(8, 12 + by, 2.4, 1.1, 8), '#2a0a14', { lw: 0.4 }); v.line(6.8, 11.3 + by, 6.8, 12.4 + by, 0.5, '#fff'); v.line(9.2, 11.3 + by, 9.2, 12.4 + by, 0.5, '#fff');
    };
  }
  function bmWalk(k) { var c = Math.cos(PH[k]); return bomb({ f: Math.round(c), by: -(Math.abs(Math.sin(PH[k])) > 0.8 ? 1 : 0) }); }
  var mF = [bomb({ f: 1 }), bomb({ f: -1, by: -1 }), bomb({ lit: 1 }), bomb({ lit: 2, by: -1 }), bmWalk(1), bmWalk(2), bmWalk(4), bmWalk(5),
    bomb({ lit: 1, big: true, by: -1 }), bomb({ lit: 2, big: true, by: -1 })];
  var mDie = mF.length;
  dyingFrames(bomb({ f: 1 }), 16, 16).forEach(function (f) { mF.push(f); });
  addV('bomb', 16, 16, mF, { lw: 1.4 }, {
    walk: { f: [0, 4, 5, 1, 6, 7], fps: 11 }, lit: { f: [2, 3], fps: 8 }, prime: { f: [2, 3, 2, 8, 3, 9], fps: 14 },
    die: DIE_ANIM([mDie, mDie + 1, mDie + 2, mDie + 3, mDie + 4])
  });

  // --- Brujo: ciervo amarillo con astas y tunica morada (20x24)
  function warlock(o) {
    return function (v) {
      v.ctx.translate(0, 1.4);
      var x = v.ctx, by = o.by || 0, rb = '#8a3fd0', rbS = '#55218f', rbH = '#b574f0';
      var arm = o.arm != null ? o.arm : (o.cast ? -3 : 0), orb = o.orb != null ? o.orb : (o.cast ? 3 : 2);
      // baston + orbe
      v.stick([[16.4, 20.6 + by], [16.4, 7 + by + arm]], 1.1, '#9a5a2c', { lw: 0.9 });
      v.part(Pblob(16.4, 5.4 + by + arm, orb + 1.2, orb + 1.2, 61), '#ff5a2a', { sh: '#b82418', hi: '#ffb35a', so: 0.7, lw: 1 });
      v.dot(16.4 - 0.2, 5.4 + by + arm + 0.2, orb * 0.5, '#ffe27a');
      v.part(Pclosed([[6.6, 10 + by], [12.4, 10 + by], [15.2, 17.5 + by], [14.6, 21.4 + by], [9.5, 20.4 + by], [4.4, 21.4 + by], [3.8, 17.5 + by]]), rb, { sh: rbS, hi: rbH, so: 1.2, lw: 1.4 });
      v.part(Prr(4.6, 16.6 + by, 9.8, 1.4, 0.6), '#f2c133', { lw: 0.5, sh: '#b8801e', so: 0.3 });
      v.line(9.5, 11 + by, 9.5, 16 + by, 0.5, '#f7f1e0');
      v.part(Pblob(14, 13.4 + by + arm * 0.4, 1.5, 1.4, 9), '#f4c92e', { lw: 0.9, sh: '#c9941a', so: 0.4 });
      // astas
      v.stick([[6.4, 5 + by], [4.6, 2.2 + by], [3.2, 0.6 + by]], 1.2, '#d99a46', { lw: 0.9, hi: '#ffd48a' });
      v.stick([[4.6, 2.2 + by], [2.2, 2.6 + by]], 0.9, '#d99a46', { lw: 0.8 });
      v.stick([[12.4, 5 + by], [14.2, 2.2 + by], [15.4, 0.4 + by]], 1.2, '#d99a46', { lw: 0.9, hi: '#ffd48a' });
      v.stick([[14.2, 2.2 + by], [16.6, 2.8 + by]], 0.9, '#d99a46', { lw: 0.8 });
      // orejas y cabeza
      v.part(Pblob(4.8, 7.6 + by, 2.1, 1.1, 62, 0.04, 8, 0.5), '#f6cf3e', { sh: '#c9941a', lw: 0.9, so: 0.3 });
      v.part(Pblob(14.2, 7.6 + by, 2.1, 1.1, 63, 0.04, 8, -0.5), '#f6cf3e', { sh: '#c9941a', lw: 0.9, so: 0.3 });
      v.part(Pblob(9.4, 8.6 + by, 4.9, 4.3, 64, 0.03), '#f9d444', { sh: '#d79c1a', hi: '#fff09a', so: 0.9, lw: 1.4 });
      v.part(Pblob(10.6, 10.9 + by, 2.4, 1.6, 65), '#fff0c0', { sh: '#e0c78a', lw: 0.8, so: 0.3 }); v.dot(11.6, 10.5 + by, 0.55, OLC);
      if (o.blink) { v.line(6.4, 8 + by, 8.2, 8 + by, 0.7, OLC); v.line(10.2, 8 + by, 12, 8 + by, 0.7, OLC); }
      else { v.eye(7.3, 8 + by, 1.6, { lx: 0.7, pr: 0.55, lw: 0.4 }); v.eye(11.2, 8 + by, 1.6, { lx: 0.7, pr: 0.55, lw: 0.4 }); }
      if (o.cast) { v.dot(11, 1.4, 0.55, '#ffc83d'); v.dot(19, 1.2, 0.55, '#ff8a2a'); v.dot(18.6, 8.4 + by, 0.55, '#ffc83d'); v.dot(13.6, 0.4, 0.45, '#fff0a8'); }
      if (o.wind) { v.dot(13.4, 2.6 + by + arm, 0.5, '#ffc83d'); v.dot(19.2, 3.4 + by + arm, 0.5, '#ff8a2a'); }
    };
  }
  var kF = [warlock({}), warlock({ by: 1 }), warlock({ cast: true }), warlock({ arm: -1, orb: 2, wind: true, by: 1 }), warlock({ arm: -2, orb: 2 }), warlock({ blink: true })];
  var kDie = kF.length;
  dyingFrames(warlock({}), 20, 24).forEach(function (f) { kF.push(f); });
  addV('warlock', 20, 24, kF, { lw: 1.4 }, {
    idle: { f: [0, 0, 0, 1, 1, 1, 0, 0, 0, 1, 1, 5], fps: 4 }, cast: { f: [3, 2, 2, 4], fps: 8 }, cast_hold: { f: [2], fps: 1 },
    die: DIE_ANIM([kDie, kDie + 1, kDie + 2, kDie + 3, kDie + 4])
  });

  // ------------------------------------------------------------------ JEFE: PASTOR CORRUPTO (48x48 base)
  function boss(o) {
    return function (v) {
      v.ctx.translate(0, 1.5);
      var x = v.ctx, by = o.by || 0, rb = '#7a34b8', rbS = '#44166e', rbH = '#a468dc', sw = o.sway || 0;
      var lift = o.slam ? (o.lift != null ? o.lift : -6) : (o.lift || 0), hy = 14 + by + lift;
      var s = o.staff, tx = s[2], ty = s[3] + by, i;
      // baston (detras)
      v.stick([[s[0], s[1] + by], [s[2], s[3] + by]], 2.4, '#b8742e', { lw: 1.5, hi: '#e8a455' });
      if (o.hook === 'up') {
        x.strokeStyle = OLC; x.lineWidth = 4.2; x.beginPath(); x.arc(tx - 3, ty - 1, 3.6, Math.PI * 0.05, Math.PI * 1.2, true); x.stroke();
        x.strokeStyle = '#b8742e'; x.lineWidth = 2.4; x.stroke();
      }
      if (o.orb || o.glow) v.part(Pcirc(tx - 3, ty - 6, 2.4), '#ff4a3a', { sh: '#a31824', hi: '#ffb06a', lw: 1, so: 0.6 });
      // tunica
      v.part(Pblob(21, 29 + by + lift / 2, 16.5, 14.6, 71, 0.03, 12), rb, { sh: rbS, hi: rbH, so: 2, lw: 2 });
      for (i = 0; i < 8; i++) v.part(Ppoly([[7 + i * 4 + (i % 2 ? sw : -sw), 40 + by + lift / 2], [9 + i * 4 + (i % 2 ? sw : -sw), 45.6 + by + lift / 2 - (i % 2) * 1.6], [11 + i * 4 + (i % 2 ? sw : -sw), 40 + by + lift / 2]]), rbS, { lw: 1.3, so: 0.3 });
      v.part(Pblob(21, 29 + by + lift / 2, 15, 12.8, 73, 0.02, 12), rb, { sh: rbS, hi: rbH, so: 2, lw: 0 });
      // banda roja con simbolo
      v.part(Ppoly([[9, 22 + by], [14, 21 + by], [30, 40 + by], [24, 41.5 + by]]), '#d6302b', { sh: '#8e1a28', hi: '#ff6350', lw: 1.3, so: 1 });
      v.circ(20, 32 + by, 2.4, '#fbf3df', { lw: 0.8, sh: '#c9b78e', so: 0.5 }); v.dot(20, 32 + by, 0.9, '#a31824');
      // lana raida del cuello
      var wl = [[29, 21], [26, 25], [31, 26], [25, 19.6], [28.6, 29], [34, 24.4]];
      v.cluster(wl.map(function (p) { return Pcirc(p[0], p[1] + by + lift, 3.6); }), '#efe7d4', { sh: '#bdb09a', hi: '#fff', lw: 1.5, so: 1 });
      // astas de carnero
      function horn(p0, p1, p2, p3) { v.stick([p0, p1, p2, p3], 4.2, '#e9d9b2', { lw: 1.6, curve: true, hi: '#fffbe8' }); }
      horn([31, hy - 2], [24, hy - 9], [21.4, hy - 2], [26.5, hy + 1.5]);
      horn([37, hy - 3], [41.4, hy - 12], [47, hy - 6], [43.6, hy - 2]);
      // cabeza: craneo de carnero
      v.part(Pblob(35, hy + 1.6, 8.2, 7.4, 74, 0.02, 11), '#f2e6c8', { sh: '#c6b48a', hi: '#fffbe8', so: 1.3, lw: 1.8 });
      v.part(Pblob(41, hy + 5, 4.6, 3.6, 75), '#e6d6b2', { sh: '#b8a47a', so: 0.8, lw: 1.5 });
      v.dot(42.8, hy + 4.4, 0.7, OLC); v.dot(44.6, hy + 5.2, 0.7, OLC); v.line(40, hy + 7, 44, hy + 7.4, 0.6, OLC);
      v.part(Pblob(32, hy + 0.2, 2.7, 2.6, 76), '#1a0e24', { lw: 0.8 }); v.part(Pblob(38.4, hy + 0.2, 2.7, 2.6, 77), '#1a0e24', { lw: 0.8 });
      var eye = o.flare ? '#ffffff' : (o.rage ? '#ff3b30' : '#ffb02a');
      v.dot(32.5, hy + 0.2, 1.5, eye); v.dot(38.9, hy + 0.2, 1.5, eye); v.dot(33, hy - 0.2, 0.55, '#fff');  v.dot(39.4, hy - 0.2, 0.55, '#fff');
      if (o.flare) { v.dot(32, hy - 3, 0.7, '#ff9a2a'); v.dot(40.4, hy - 3, 0.7, '#ff6a2a'); v.dot(35, hy - 5, 0.6, '#ffd36a'); }
      v.line(31, hy - 2.6, 34.2, hy - 1.4, 0.9, o.rage ? '#a31824' : OLC); v.line(40.2, hy - 2.6, 37, hy - 1.4, 0.9, o.rage ? '#a31824' : OLC);
      v.part(Pcirc(s[0], s[1] + by, 2.4), '#2c2234', { lw: 1, sh: '#120a18', so: 0.5 });
      if (o.glow) { v.dot(tx - 6, ty - 8, 0.8, '#ffd36a'); v.dot(tx - 0.4, ty - 8.5, 0.7, '#ff9a2a'); v.dot(tx - 8, ty - 4, 0.7, '#ff9a2a'); }
    };
  }
  var sF = [
    boss({ staff: [40, 44, 42, 8], hook: 'up', by: 0 }),
    boss({ staff: [40, 44, 42, 9], hook: 'up', by: 1, orb: true }),
    boss({ staff: [34, 26, 46, 34], rage: true, by: 0 }),
    boss({ staff: [38, 30, 40, 2], hook: 'up', slam: true, rage: true, by: 0 }),
    boss({ staff: [40, 44, 42, 8], hook: 'up', by: 0, sway: 1, orb: true }),
    boss({ staff: [40, 44, 42, 9], hook: 'up', by: 1, flare: true, glow: true }),
    boss({ staff: [30, 28, 23, 5], hook: 'up', by: 1, lift: -2, rage: true, glow: true }),
    boss({ staff: [38, 36, 45, 42], by: 1, rage: true }),
    boss({ staff: [38, 24, 40, 1], hook: 'up', slam: true, lift: -10, rage: true, flare: true, glow: true }),
    boss({ staff: [38, 40, 40, 46], slam: true, lift: 2, by: 2, rage: true })
  ];
  var sDie = sF.length;
  dyingFrames(boss({ staff: [40, 44, 42, 8], hook: 'up', by: 0 }), 48, 48, null, { sy: [0.97, 0.85, 0.7, 0.5, 0.3], dis: [0, 0.03, 0.25, 0.55, 0.85] }).forEach(function (f) { sF.push(f); });
  addV('boss', 48, 48, sF, { lw: 2 }, {
    idle: { f: [0, 4, 1, 4, 0, 4, 1, 5], fps: 3 }, swing: { f: [6, 6, 2, 7], fps: 8 }, swing_hit: { f: [2], fps: 1 },
    slam: { f: [8, 8, 3, 9], fps: 8 }, slam_hit: { f: [3], fps: 1 },
    die: { f: [sDie, sDie + 1, sDie + 2, sDie + 3, sDie + 4], fps: 6, loop: false }
  });

  // ------------------------------------------------------------------ PROYECTILES / VFX (trazo grueso, naranja/blanco, contorno rojo oscuro)
  var FO = '#7a1424'; // contorno de fuego
  add2('arrow', 12, 5, [0, 1].map(function (k) {
    return function (v) {
      v.line(1.4, 2.5, 8.6, 2.5, 2.6, OLC); v.line(1.6, 2.5, 8.6, 2.5, 1.1, k ? '#d9c4ff' : '#f4ecff');
      v.part(Ppoly([[8.2, 0.6], [11.6, 2.5], [8.2, 4.4]]), k ? '#ffd34a' : '#ff8a2a', { lw: 0.8, sh: '#c8341c', so: 0.3 });
      v.part(Ppoly([[0.4, 0.4], [2.4, 2.5], [0.4, 4.6], [1.2, 2.5]]), '#b574f0', { lw: 0.7, sh: '#6a34b0', so: 0.2 });
    };
  }), { lw: 0.7 }, { fly: { f: [0, 1], fps: 12 } });
  add2('thorn', 10, 5, [function (v) {
    v.part(Ppoly([[0.6, 0.8], [7.6, 2.5], [0.6, 4.2], [1.8, 2.5]]), '#f2e8c8', { lw: 0.8, sh: '#bfae82', so: 0.3 });
    v.part(Ppoly([[6, 1.2], [9.4, 2.5], [6, 3.8]]), '#e8283a', { lw: 0.7, sh: '#8e1a28', so: 0.2 });
  }], { lw: 0.7 });
  function flamePath(cx, by, w, h, k, ph) {   // gota de fuego ondulante: base en by, punta arriba
    var t = k * 1.05 + ph, tip = Math.sin(t) * w * 0.28, sd = Math.cos(t * 1.3) * w * 0.12;
    return Pclosed([[cx - w * 0.5, by - h * 0.18], [cx - w * 0.52 + sd, by - h * 0.55], [cx - w * 0.2 + tip * 0.5, by - h * 0.82], [cx + tip, by - h], [cx + w * 0.22 + tip * 0.5, by - h * 0.74], [cx + w * 0.52 - sd, by - h * 0.5], [cx + w * 0.5, by - h * 0.2], [cx, by + h * 0.04]]);
  }
  function flameV(w, h, k, pal, ph, extra) {
    return function (v) {
      var cx = w / 2, by = h - 0.6, tw = w * 0.9, th = h * 0.92;
      if (extra) v.part(flamePath(cx + w * 0.22, by, w * 0.46, h * 0.62, k + 2, ph + 1), pal[0], { lw: v.lw * 0.7, ol: pal[4], sh: pal[1], so: 0.3 });
      v.part(flamePath(cx, by, tw, th, k, ph), pal[0], { ol: pal[4], sh: pal[1], so: Math.max(0.3, h * 0.07) });
      v.flat(flamePath(cx, by - h * 0.04, tw * 0.62, th * 0.66, k + 1, ph), pal[2], { sh: pal[1], so: 0.2 });
      v.flat(flamePath(cx, by - h * 0.07, tw * 0.3, th * 0.38, k + 2, ph), pal[3]);
    };
  }
  var PAL_FIRE = ['#ff4a1e', '#ff7a22', '#ffb830', '#fff3b0', '#7a1424'], PAL_CURSE = ['#e0283c', '#ff5a28', '#ff9a30', '#ffe27a', '#4a0e2c'];
  var PAL_GREEN = ['#2fd04a', '#6ae83a', '#b8ff6a', '#f2ffd0', '#0e4a2a'];
  add2('flame', 8, 10, [0, 2, 4].map(function (k) { return flameV(8, 10, k, PAL_FIRE, 1, true); }), { lw: 0.8 }, { burn: { f: [0, 1, 2, 1], fps: 12 } });
  add2('curse_flame', 10, 14, [0, 1, 2, 3, 4, 5].map(function (k) { return flameV(10, 14, k * 1.3, PAL_CURSE, 2, true); }), { lw: 0.9 }, { burn: { f: [0, 1, 2, 3, 4, 5], fps: 14 } });
  var TF = { bosque: PAL_FIRE, cripta: ['#ff5a1a', '#ff8a22', '#ffc83d', '#fff3b0', '#6a1420'], asfodelo: PAL_GREEN };
  Object.keys(TF).forEach(function (b) {
    addBV(b, 'torch_flame', 10, 14, [0, 1, 2, 3, 4, 5].map(function (k) { return flameV(10, 14, k * 1.4, TF[b], 3, true); }), { lw: 0.9 }, { burn: { f: [0, 1, 2, 3, 4, 5], fps: 12 } });
  });
  add2('fireball', 10, 10, [0, 1].map(function (k) {
    return function (v) {
      var x = v.ctx;
      v.part(Ppoly([[0.4, 5 + (k ? 1.2 : -1)], [4, 2.8], [4, 7.4]]), '#ff5a22', { lw: 0.8, ol: FO, sh: '#c8281e', so: 0.2 });
      v.part(Ppoly([[0.2, 5 + (k ? -1.5 : 1.6)], [4, 4.2], [4, 6.4]]), '#ff8a2a', { lw: 0, sh: null });
      v.part(Pblob(6, 5, 3.8, 3.8, 90 + k), '#ff6a22', { lw: 1, ol: FO, sh: '#d03a1a', hi: '#ffb35a', so: 0.7 });
      v.dot(6.2, 5.2, 1.9, '#ffc83d'); v.dot(6.4, 5.2, 1, '#fff3b0');
    };
  }), { lw: 1 }, { fly: { f: [0, 1], fps: 12 } });

  // --- Tajos: media luna gruesa, naranja con nucleo blanco, contorno rojo oscuro, chispas y lineas de velocidad
  var D = Math.PI / 180;
  function crescentPts(o, R, T, hf) {
    var N = 22, outer = [], inner = [], i;
    for (i = 0; i <= N; i++) {
      var s = o.tail + (o.head - o.tail) * i / N, vs = i / N;
      var th = T * Math.pow(Math.sin(Math.PI * Math.min(1, Math.max(0, vs * 0.94 + 0.03))), 0.6) * hf;
      var sa = o.dir < 0 ? 1 - s : s, a = o.a0 + (o.a1 - o.a0) * sa;
      outer.push([2 + Math.cos(a) * R, 16 + Math.sin(a) * R]); inner.push([2 + Math.cos(a) * (R - th), 16 + Math.sin(a) * (R - th)]);
    }
    return outer.concat(inner.reverse());
  }
  function crescentV(o) {
    return function (v) {
      var x = v.ctx; x.globalAlpha = o.alpha;
      var pts = crescentPts(o, o.R, o.T, 1);
      v.part(Ppoly(pts), '#ff8a2a', { lw: 1.1, ol: '#b02a1c', sh: '#e8501e', hi: '#ffd04a', so: 0.9 });
      v.flat(Ppoly(crescentPts(o, o.R - o.T * 0.12, o.T, 0.52)), '#fff4d8');
      if (o.extra) { v.part(Ppoly(crescentPts({ a0: o.extra.a0, a1: o.extra.a1, head: o.head, tail: o.tail, dir: o.dir }, o.extra.R, o.extra.T, 1)), '#ffb02a', { lw: 0.8, ol: '#b02a1c' }); }
      var k;
      if (o.sparks) for (k = 0; k < o.sparks.length; k++) { v.dot(o.sparks[k][0], o.sparks[k][1], 0.7, k % 2 ? '#fff4d8' : '#ffb02a'); }
      if (o.lines) for (k = 0; k < o.lines.length; k++) { var l = o.lines[k]; v.line(l[0], l[1], l[2], l[3], 0.55, 'rgba(26,16,34,' + (0.8 * o.alpha).toFixed(2) + ')'); }
      x.globalAlpha = 1;
    };
  }
  function slashSet(base) {
    var ph = [{ head: 0.45, tail: 0, alpha: 1 }, { head: 1, tail: 0, alpha: 1 }, { head: 1, tail: 0.3, alpha: 0.85 }, { head: 1, tail: 0.65, alpha: 0.5 }];
    return ph.map(function (p) { var o = {}, k; for (k in base) o[k] = base[k]; for (k in p) o[k] = p[k]; return crescentV(o); });
  }
  add2('slash', 22, 32, [{ a0: -40 * D, a1: 22 * D, R: 19, T: 7, head: 1, tail: 0, alpha: 1, dir: 1 }, { a0: -58 * D, a1: 58 * D, R: 19, T: 8, head: 1, tail: 0, alpha: 1, dir: 1 }, { a0: -58 * D, a1: 58 * D, R: 19, T: 4, head: 1, tail: 0.3, alpha: 0.5, dir: 1 }].map(crescentV), { lw: 0 }, { swing: { f: [0, 1, 2], fps: 24 } });
  add2('slash_1', 22, 32, slashSet({ a0: -56 * D, a1: 32 * D, R: 18, T: 11, dir: 1, lines: [[16, 2, 21, 6], [18, 29, 21, 25]] }), { lw: 0 }, { swing: { f: [0, 1, 2, 3], fps: 28 } });
  add2('slash_2', 22, 32, slashSet({ a0: -32 * D, a1: 56 * D, R: 18, T: 11, dir: -1, lines: [[16, 30, 21, 26], [18, 3, 21, 7]] }), { lw: 0 }, { swing: { f: [0, 1, 2, 3], fps: 28 } });
  add2('slash_3', 22, 32, slashSet({ a0: -62 * D, a1: 62 * D, R: 18.4, T: 13, dir: 1, sparks: [[20, 3], [21, 29], [19.4, 16], [17, 1], [18, 31]], extra: { a0: -55 * D, a1: 55 * D, R: 12, T: 4 }, lines: [[12, 3, 19, 5], [12, 29, 19, 27]] }), { lw: 0 }, { swing: { f: [0, 1, 2, 3], fps: 22 } });

  // --- Onda de choque (48x48 -> 96x96), centrada: anillo grueso naranja/blanco
  add2('shockwave', 48, 48, [5, 11, 16, 20, 23].map(function (R, k) {
    var T = [5, 4.6, 3.8, 2.8, 1.8][k], al = [1, 0.95, 0.85, 0.6, 0.35][k];
    return function (v) {
      var x = v.ctx, rr = rrand(40 + k), i; x.globalAlpha = al;
      if (k < 3) { var gr = x.createRadialGradient(24, 24, 0, 24, 24, R); gr.addColorStop(0, 'rgba(255,110,40,0)'); gr.addColorStop(1, 'rgba(255,110,40,0.35)'); x.fillStyle = gr; x.beginPath(); x.arc(24, 24, R, 0, 6.2832); x.fill(); }
      function ring(r, w, col, dash) { x.strokeStyle = col; x.lineWidth = w; x.setLineDash(dash || []); x.beginPath(); x.arc(24, 24, r, 0, 6.2832); x.stroke(); x.setLineDash([]); }
      var dash = k >= 2 ? [R * 0.9, 2 + k] : null;
      ring(R, T + 1.6, '#7a1424', dash); ring(R, T, '#ff8a2a', dash); ring(R - T * 0.05, T * 0.5, '#fff1c8', dash);
      for (i = 0; i < 6 + k * 2; i++) { var a = rr() * 6.283, rd = R + 2 + rr() * (2 + k * 1.2); v.dot(24 + Math.cos(a) * rd, 24 + Math.sin(a) * rd, 0.8, i % 2 ? '#ffb02a' : '#fff1c8'); }
      x.globalAlpha = 1;
    };
  }), { lw: 0 }, { boom: { f: [0, 1, 2, 3, 4], fps: 18 } });

  // --- Chispas de impacto (16x16, centrado): estrella de picos gruesos
  add2('hitspark', 16, 16, [0, 1, 2, 3].map(function (k) {
    var gap = [0, 1.5, 3.2, 4.6], len = [4.4, 7.4, 7.6, 6.8], core = [3, 2.2, 1.2, 0], cols = [['#ffffff', '#fff0a8'], ['#fff3b0', '#ffc83d'], ['#ffc83d', '#ff8a2a'], ['#ff8a2a', '#c8281e']][k];
    return function (v) {
      var i;
      for (i = 0; i < 8; i++) {
        var a = i * Math.PI / 4 + 0.2, l = len[k] * (i % 2 ? 0.58 : 1), w = i % 2 ? 0.42 : 0.55;
        if (l <= gap[k]) continue;
        var ca = Math.cos(a), sa = Math.sin(a), px = -sa, py = ca;
        v.part(Ppoly([[8 + ca * gap[k] + px * w * 2.2, 8 + sa * gap[k] + py * w * 2.2], [8 + ca * l, 8 + sa * l], [8 + ca * gap[k] - px * w * 2.2, 8 + sa * gap[k] - py * w * 2.2]]), cols[i % 2], { lw: 0.6, ol: '#a8281e' });
      }
      if (core[k] > 0) v.part(Pcirc(8, 8, core[k]), '#ffffff', { lw: 0.6, ol: '#e8501e' });
    };
  }), { lw: 0.6 }, { burst: { f: [0, 1, 2, 3], fps: 30 } });

  function puff(v, pts, al, pal) {
    v.ctx.globalAlpha = al;
    v.cluster(pts.map(function (p) { return Pcirc(p[0], p[1], p[2]); }), pal[0], { sh: pal[1], hi: pal[2], lw: v.lw, ol: pal[3], so: 0.9 });
    v.ctx.globalAlpha = 1;
  }
  add2('explosion', 32, 32, [
    function (v) { puff(v, [[16, 16, 7]], 1, ['#ffc83d', '#ff8a2a', '#fff3b0', '#a8281e']); v.dot(16, 16, 3, '#ffffff'); },
    function (v) { puff(v, [[16, 16, 12], [9, 12, 5], [23, 11, 5], [10, 22, 5], [22, 22, 5]], 1, ['#ff8a2a', '#e8501e', '#ffd34a', '#7a1424']); v.circ(16, 16, 6.5, '#ffd34a', { lw: 0, sh: '#ff9a2a', hi: '#fff3b0' }); v.dot(16, 16, 3, '#fff6c0'); },
    function (v) { puff(v, [[16, 16, 13], [7, 13, 6], [25, 12, 6], [9, 24, 6], [24, 24, 6], [16, 6, 5]], 0.92, ['#e8501e', '#a8281e', '#ff8a2a', '#4a0e1c']); v.circ(16, 16, 7, '#ff9a2a', { lw: 0, sh: '#e8501e', hi: '#ffd34a' }); },
    function (v) { puff(v, [[16, 15, 12], [7, 12, 6], [25, 11, 6], [9, 23, 6], [23, 23, 6]], 0.8, ['#7a5a6e', '#4e3a58', '#a0869a', '#2a1c34']); },
    function (v) { puff(v, [[16, 14, 10], [8, 12, 5], [24, 11, 5], [10, 21, 5]], 0.4, ['#6a5a78', '#4a3c5c', '#8c7ca0', '#2a1c34']); }
  ], { lw: 1.2 }, { boom: { f: [0, 1, 2, 3, 4], fps: 14 } });

  add2('spark', 3, 3, [
    function (v) { v.part(Ppoly([[1.5, 0], [2, 1], [3, 1.5], [2, 2], [1.5, 3], [1, 2], [0, 1.5], [1, 1]]), '#ffffff', { lw: 0.4, ol: '#ff8a2a' }); },
    function (v) { v.part(Ppoly([[1.5, 0], [2, 1], [3, 1.5], [2, 2], [1.5, 3], [1, 2], [0, 1.5], [1, 1]]), '#ffc83d', { lw: 0.4, ol: '#c8281e' }); }
  ], { lw: 0.4 });
  add2('ember', 3, 3, [
    function (v) { v.part(Pblob(1.5, 1.5, 1, 1, 3, 0.1, 6), '#ff8a2a', { lw: 0.4, ol: '#a8281e' }); v.dot(1.5, 1.5, 0.4, '#ffd34a'); },
    function (v) { v.part(Pblob(1.5, 1.5, 1, 1, 4, 0.1, 6), '#e8321e', { lw: 0.4, ol: '#5a0e1a' }); v.dot(1.5, 1.5, 0.35, '#ff7a2a'); }
  ], { lw: 0.4 });
  add2('smoke', 8, 8, [[2.4, 0.85], [3.2, 0.6], [3.4, 0.3]].map(function (p, k) { return function (v) { puff(v, k === 0 ? [[4, 4, p[0]]] : [[4, 4, p[0]], [2.6, 3, 1.6], [5.4, 3.2, 1.5]], p[1], ['#6a5f82', '#4a4062', '#9a8fb4', '#2a1f3a']); }; }), { lw: 0.8 }, { puff: { f: [0, 1, 2], fps: 6 } });
  add2('smoke_big', 16, 16, [0, 1, 2, 3, 4].map(function (k) {
    var R = [3, 4.4, 5.6, 6.4, 7][k], al = [0.9, 0.85, 0.65, 0.42, 0.2][k];
    return function (v) {
      var b = [[0, 0, 1], [-2.6, 1, 0.7], [2.6, 1, 0.66], [-0.6, -2.4, 0.7], [1.8, -2, 0.56]], pts = [];
      b.forEach(function (p, i) { if (i > 0 && k === 0) return; pts.push([8 + p[0] * (0.6 + k * 0.2), 8 + p[1] * (0.6 + k * 0.2) - k * 0.3, Math.max(1, R * p[2])]); });
      puff(v, pts, al, ['#6e6286', '#4a4062', '#a094bc', '#2a1f3a']);
    };
  }), { lw: 0.9 }, { puff: { f: [0, 1, 2, 3, 4], fps: 7 } });
  add2('dust', 6, 6, [
    function (v) { puff(v, [[3, 3.4, 1.6], [1.8, 3.8, 1.1], [4.2, 3.8, 1.1]], 0.85, ['#b09a8c', '#8a7468', '#d8c8b8', '#3a2c34']); },
    function (v) { puff(v, [[3, 3, 2.2], [1.4, 3.6, 1.2], [4.6, 3.6, 1.2]], 0.45, ['#b09a8c', '#8a7468', '#d8c8b8', '#3a2c34']); }
  ], { lw: 0.5 }, { puff: { f: [0, 1], fps: 8 } });
  add2('shadow', 14, 6, [function (v) {
    var x = v.ctx, g = x.createRadialGradient(7, 3, 0.5, 7, 3, 7);
    g.addColorStop(0, 'rgba(8,4,16,0.55)'); g.addColorStop(0.65, 'rgba(8,4,16,0.4)'); g.addColorStop(1, 'rgba(8,4,16,0)');
    x.save(); x.translate(7, 3); x.scale(1, 0.43); x.translate(-7, -3); x.fillStyle = g; x.fillRect(0, -4, 14, 14); x.restore();
  }], { lw: 0 });
  // halo de luz de fuego (aditivo), por bioma
  var LC = { bosque: '255,150,60', cripta: '255,130,50', asfodelo: '110,255,120' };
  Object.keys(LC).forEach(function (b) {
    addBV(b, 'torch_light', 32, 32, [15, 16, 14.2].map(function (R) {
      return function (v) {
        var x = v.ctx, g = x.createRadialGradient(16, 16, 0, 16, 16, R);
        g.addColorStop(0, 'rgba(' + LC[b] + ',0.6)'); g.addColorStop(0.35, 'rgba(' + LC[b] + ',0.28)'); g.addColorStop(1, 'rgba(' + LC[b] + ',0)');
        x.fillStyle = g; x.fillRect(0, 0, 32, 32);
      };
    }), { lw: 0 }, { flicker: { f: [0, 1, 2, 1], fps: 9 } });
  });
  // vela (decoracion): cera, goteo y mecha; la llama se anima en runtime
  add2('candle', 6, 10, [function (v) {
    v.part(Prr(1.2, 3.2, 3.6, 5.4, 1), '#f7efd8', { lw: 0.9, sh: '#cdbd9c', hi: '#ffffff', so: 0.5 });
    v.part(Pblob(3, 8.7, 2.6, 1, 4), '#e6d8b8', { lw: 0.7, sh: '#b8a680', so: 0.2 });
    v.line(3, 3.2, 3, 2, 0.5, OLC);
  }], { lw: 0.9 });

  // ------------------------------------------------------------------ ESCENARIO POR BIOMAS
  // bosque = claro de piedra musgosa (Cult of the Lamb) | cripta = inframundo de huesos, brasas y lava (Hades) | asfodelo = losas esmeralda y fuegos verdes
  var BP = {
    bosque: { floor: '#586079', floorH: '#6f7894', floorS: '#40465c', gap: '#33364d', moss: '#4f8f5a', mossH: '#82bd6c', mossS: '#2e6446', acc: '#ee2a3c', accG: 'rgba(255,40,60,0.9)',
      rock: '#7c8399', rockH: '#a0a8bf', rockS: '#555b72', grass: '#2e6a56', grassH: '#58a878', grassS: '#1c4440', bone: '#f1e8d0', boneS: '#c2b490', boneH: '#ffffff',
      stone: '#a39d90', stoneH: '#cfc8b8', stoneS: '#746e66', out: '#150e22', label: 'Claro del bosque corrupto' },
    cripta: { floor: '#45304a', floorH: '#62445c', floorS: '#2a1a30', gap: '#1d1020', moss: '#6a4a3a', mossH: '#8a6450', mossS: '#3e281e', acc: '#ff6a22', accG: 'rgba(255,110,30,0.9)',
      rock: '#6a4a5a', rockH: '#8c6678', rockS: '#3e2a3c', grass: '#8a6a58', grassH: '#b08c70', grassS: '#4e382e', bone: '#ecd5a0', boneS: '#b08e5c', boneH: '#fff2cc',
      stone: '#5a4258', stoneH: '#7c5c78', stoneS: '#352236', out: '#0e0610', label: 'Inframundo de huesos' },
    asfodelo: { floor: '#2f6258', floorH: '#438472', floorS: '#1d4040', gap: '#123533', moss: '#3aa08a', mossH: '#7ae0b0', mossS: '#1e6458', acc: '#6ae83a', accG: 'rgba(110,255,70,0.9)',
      rock: '#3e7468', rockH: '#62a894', rockS: '#25504c', grass: '#2fb878', grassH: '#8affb0', grassS: '#16704c', bone: '#d8f0dc', boneS: '#9cc4aa', boneH: '#ffffff',
      stone: '#4a7a70', stoneH: '#78b4a0', stoneS: '#2a5250', out: '#06141a', label: 'Asfodelo esmeralda' }
  };
  var BIOS = ['bosque', 'cripta', 'asfodelo'];
  function mixh(h, t, k) { var a = hex(h), b = t === 'w' ? [255, 255, 255] : t === 'k' ? [0, 0, 0] : hex(t); return 'rgb(' + Math.round(a[0] + (b[0] - a[0]) * k) + ',' + Math.round(a[1] + (b[1] - a[1]) * k) + ',' + Math.round(a[2] + (b[2] - a[2]) * k) + ')'; }
  function glow(x, col, blur, fn) { x.save(); x.shadowColor = col; x.shadowBlur = blur; fn(); x.restore(); }

  // --- tiles de suelo 16x16 base (32x32), sin costuras
  function groundFn(b, k) {
    var P = BP[b], kinds = { bosque: ['plain', 'crack', 'moss', 'pebbles', 'rune', 'grass', 'moss', 'crack', 'leaves', 'crack'], cripta: ['plain', 'crack', 'bits', 'pebbles', 'rune', 'cones', 'blood', 'crack', 'bits', 'ember'], asfodelo: ['plain', 'crack', 'moss', 'pebbles', 'rune', 'grass', 'moss', 'crack', 'pebbles', 'crack'] }[b][k];
    return function (v) {
      var x = v.ctx, r = rrand(k * 131 + b.length * 17 + 5), tr = rrand(k * 71 + b.length), i, j;
      x.fillStyle = P.gap; x.fillRect(0, 0, 16, 16);
      function tone(c) { var t = (tr() * 2 - 1) * 0.09; return t > 0 ? mixh(c, 'w', t) : mixh(c, 'k', -t); }
      if (b === 'bosque') {
        [[0, 0, 10, 8], [10, 0, 6, 8], [0, 8, 5, 8], [5, 8, 11, 8]].forEach(function (s, n) {
          var g = rrand(n + 3);
          v.flat(Prr(s[0] + 0.55, s[1] + 0.55, s[2] - 1.1, s[3] - 1.1, 1.3), tone(P.floor), { sh: P.floorS, hi: P.floorH, so: 0.7 });
          for (i = 0; i < 3; i++) v.dot(s[0] + 1.5 + g() * (s[2] - 3), s[1] + 1.5 + g() * (s[3] - 3), 0.28, P.floorS);
        });
      } else if (b === 'cripta') {
        [[4, 4, 0], [12, 4, 1], [0, 12, 2], [8, 12, 3]].forEach(function (c, n) {
          var g = rrand(n * 13 + 9), rx = 3.7 + g() * 0.5, ry = 3.3 + g() * 0.4, col = tone(P.floor);
          [-16, 0, 16].forEach(function (dx) { if (c[0] + dx > -5 && c[0] + dx < 21) v.flat(Pblob(c[0] + dx, c[1], rx, ry, 100 + n, 0.07, 9), col, { sh: P.floorS, hi: P.floorH, so: 0.8 }); });
        });
      } else {
        [[0, 0], [8, 0], [0, 8], [8, 8]].forEach(function (s) {
          v.flat(Prr(s[0] + 0.5, s[1] + 0.5, 7, 7, 0.8), tone(P.floor), { sh: P.floorS, hi: P.floorH, so: 0.7 });
          v.flat(Prr(s[0] + 1.6, s[1] + 1.6, 4.8, 4.8, 0.6), tone(P.floor), { sh: P.floorH, hi: null, so: 0.3 });
        });
      }
      var cx = 4 + r() * 8, cy = 4 + r() * 8;
      if (kinds === 'crack' || kinds === 'ember') {
        var px = cx - 3 + r() * 2, py = 2 + r() * 2, pts = [[px, py]];
        for (i = 0; i < 6; i++) { px += (r() - 0.5) * 3; py += 1.8 + r(); pts.push([Math.max(1.2, Math.min(14.8, px)), Math.min(14.8, py)]); }
        if (kinds === 'ember') glow(x, 'rgba(255,110,30,1)', 5, function () { x.strokeStyle = 'rgba(255,120,30,0.9)'; x.lineWidth = 0.7; x.beginPath(); pts.forEach(function (p, n) { n ? x.lineTo(p[0], p[1]) : x.moveTo(p[0], p[1]); }); x.stroke(); });
        x.strokeStyle = P.gap; x.lineWidth = 0.75; x.beginPath(); pts.forEach(function (p, n) { n ? x.lineTo(p[0], p[1]) : x.moveTo(p[0], p[1]); }); x.stroke();
        x.beginPath(); x.moveTo(pts[3][0], pts[3][1]); x.lineTo(pts[3][0] + 2.5, pts[3][1] + 1); x.lineWidth = 0.5; x.stroke();
      } else if (kinds === 'moss') {
        for (i = 0; i < 2; i++) { var mx = 3.5 + r() * 9, my = 3.5 + r() * 9; v.flat(Pblob(mx, my, 2 + r() * 1.2, 1.4 + r(), 200 + i, 0.15, 8), P.moss, { sh: P.mossS, hi: P.mossH, so: 0.6 }); v.dot(mx + 1.2, my - 1, 0.3, P.mossH); }
      } else if (kinds === 'pebbles') {
        for (i = 0; i < 3; i++) v.part(Pblob(3.5 + r() * 9, 3.5 + r() * 9, 1 + r() * 0.6, 0.8 + r() * 0.4, 300 + i, 0.1, 7), P.rock, { lw: 0.5, sh: P.rockS, hi: P.rockH, so: 0.4, ol: P.gap });
      } else if (kinds === 'rune') {
        x.globalAlpha = 0.55; glow(x, P.accG, 6, function () {
          x.strokeStyle = P.acc; x.lineWidth = 0.75; x.beginPath(); x.arc(8, 8, 3.3, 0, 6.2832); x.moveTo(8, 3.8); x.lineTo(8, 12.2); x.moveTo(5.2, 6.4); x.lineTo(10.8, 9.6); x.moveTo(10.8, 6.4); x.lineTo(5.2, 9.6); x.stroke();
        }); x.globalAlpha = 1;
      } else if (kinds === 'grass') {
        for (i = 0; i < 4; i++) { var gx = 3 + r() * 10, gy = 6 + r() * 6; x.strokeStyle = i % 2 ? P.grassH : P.grass; x.lineWidth = 0.6; x.beginPath(); x.moveTo(gx, gy); x.quadraticCurveTo(gx + (r() - 0.5) * 1.6, gy - 1.6, gx + (r() - 0.5) * 2, gy - 3.4); x.stroke(); }
      } else if (kinds === 'leaves') {
        for (i = 0; i < 4; i++) v.part(Pblob(2.5 + r() * 11, 2.5 + r() * 11, 0.9, 0.55, 400 + i, 0.1, 6, r() * 3), i % 2 ? '#c8402a' : '#e8803a', { lw: 0.35, ol: P.gap });
      } else if (kinds === 'cones') {
        for (i = 0; i < 3; i++) { var kx = 4 + r() * 8, ky = 7 + r() * 5, kh = 2 + r() * 1.6; v.part(Ppoly([[kx - 0.9, ky], [kx, ky - kh], [kx + 0.9, ky]]), P.rock, { lw: 0.4, ol: P.gap, sh: P.rockS, hi: P.rockH, so: 0.3 }); }
      } else if (kinds === 'bits') {
        for (i = 0; i < 4; i++) { var bx = 3 + r() * 10, by = 3 + r() * 10, ba = r() * 3; v.line(bx, by, bx + Math.cos(ba) * 1.6, by + Math.sin(ba) * 1.6, 1.2, P.gap); v.line(bx, by, bx + Math.cos(ba) * 1.6, by + Math.sin(ba) * 1.6, 0.6, P.bone); }
      } else if (kinds === 'blood') {
        for (i = 0; i < 6; i++) v.dot(4 + r() * 8, 4 + r() * 8, 0.35 + r() * 0.9, i % 2 ? '#a81830' : '#d6283a');
      }
    };
  }
  BIOS.forEach(function (b) { for (var gi = 0; gi < 10; gi++) addBV(b, 'ground' + gi, 16, 16, [groundFn(b, gi)], { lw: 0 }); });

  // --- rocas redondeadas (musgo en bosque)
  function rockFn(b, w, h, seed, moss) {
    var P = BP[b];
    return function (v) {
      v.part(Pblob(w / 2, h / 2 + 0.8, w / 2 - 1.1, h / 2 - 1.4, seed, 0.07, 9), P.rock, { sh: P.rockS, hi: P.rockH, so: 1, lw: 1.3 });
      v.line(w * 0.4, h * 0.55, w * 0.52, h * 0.78, 0.45, P.rockS); v.line(w * 0.52, h * 0.78, w * 0.64, h * 0.72, 0.45, P.rockS);
      if (moss && b !== 'cripta') { v.flat(Pblob(w * 0.42, h * 0.3, w * 0.28, h * 0.17, seed + 5, 0.15, 8), P.moss, { sh: P.mossS, hi: P.mossH, so: 0.4 }); v.dot(w * 0.3, h * 0.4, 0.4, P.moss); }
    };
  }
  BIOS.forEach(function (b) {
    addBV(b, 'rock0', 14, 11, [rockFn(b, 14, 11, 3, true)], { lw: 1.3 });
    addBV(b, 'rock1', 18, 13, [rockFn(b, 18, 13, 5, false)], { lw: 1.4 });
    addBV(b, 'rock2', 9, 7, [rockFn(b, 9, 7, 8, true)], { lw: 1 });
  });

  // --- hierba / conos / brotes (8x8) y hongos
  function tuft(b, seed) {
    var P = BP[b];
    return function (v) {
      var x = v.ctx, r = rrand(seed * 31 + 5), i;
      if (b === 'cripta') {
        [[2.4, 7, 2.4], [4.6, 7.2, 3.8], [6.2, 7, 2.2]].forEach(function (c, n) { v.part(Ppoly([[c[0] - 1.1, c[1]], [c[0] + (n - 1) * 0.2, c[1] - c[2] - (seed % 2)], [c[0] + 1.1, c[1]]]), P.grass, { lw: 0.6, sh: P.grassS, hi: P.grassH, so: 0.35 }); });
        return;
      }
      for (i = 0; i < 6; i++) {
        var bx = 1.2 + i * 1.1, hh = 3 + r() * 3.4, lean = (r() - 0.5) * 2.6;
        x.strokeStyle = P.out; x.lineWidth = 1.5; x.beginPath(); x.moveTo(bx, 7.4); x.quadraticCurveTo(bx + lean * 0.3, 7.4 - hh * 0.6, bx + lean, 7.4 - hh); x.stroke();
        x.strokeStyle = i % 3 === 0 ? P.grassH : P.grass; x.lineWidth = 0.8; x.stroke();
        if (b === 'asfodelo') v.dot(bx + lean, 7.4 - hh, 0.45, '#d8ffc0');
      }
    };
  }
  BIOS.forEach(function (b) { for (var hi = 1; hi <= 3; hi++) addBV(b, 'grass' + (hi - 1), 8, 8, [tuft(b, hi)], { lw: 0.6 }); });
  var MUSH = { bosque: ['#a85ad8', '#6a2aa0', '#e0a8ff'], cripta: ['#d8b078', '#9a7448', '#f4dcae'], asfodelo: ['#38e0d0', '#1c8a90', '#c8fff4'] };
  BIOS.forEach(function (b) {
    var m = MUSH[b];
    addBV(b, 'mushroom', 8, 8, [function (v) {
      v.part(Prr(3.1, 4, 1.9, 3.2, 0.8), '#f1e8d0', { lw: 0.8, sh: '#c2b490', so: 0.3 });
      v.part(Pblob(4, 3.6, 3.2, 2.1, 7, 0.05, 8), m[0], { lw: 0.9, sh: m[1], hi: m[2], so: 0.5 });
      v.dot(3, 3.2, 0.35, m[2]); v.dot(5, 3.9, 0.3, m[2]);
    }], { lw: 0.9 });
  });

  // --- matas altas (bosque) / costillas (cripta) / helechos (asfodelo): 14x10
  function bushFn(b, seed) {
    var P = BP[b];
    return function (v) {
      var x = v.ctx, r = rrand(seed * 101 + 7), i;
      if (b === 'cripta') {
        for (i = 0; i < 4; i++) { var rx = 3 + i * 2.6; x.strokeStyle = P.out; x.lineWidth = 2.4; x.beginPath(); x.moveTo(rx, 9.4); x.quadraticCurveTo(rx - 1 + seed, 0.8 + (i % 2) * 1.6, rx + 3.2, 1.8 + (i % 2)); x.stroke(); x.strokeStyle = i % 2 ? P.bone : P.boneS; x.lineWidth = 1.3; x.stroke(); }
        v.part(Pblob(7, 9.2, 5.6, 1.1, seed, 0.05, 8), P.boneS, { lw: 0.8, sh: '#6a4a38', so: 0.3 });
        return;
      }
      for (i = 0; i < 11; i++) {
        var bx = 1.8 + i * 1.05 + r() * 0.5, hh = 4.4 + r() * 5, lean = (r() - 0.5) * 4;
        x.strokeStyle = P.out; x.lineWidth = 1.8; x.beginPath(); x.moveTo(bx, 9.4); x.quadraticCurveTo(bx + lean * 0.2, 9.4 - hh * 0.55, bx + lean, 9.4 - hh); x.stroke();
        x.strokeStyle = i % 4 === 0 ? P.grassH : (i % 2 ? P.grass : P.grassS); x.lineWidth = 1.05; x.stroke();
        if (b === 'asfodelo' && i % 3 === 0) v.dot(bx + lean, 9.4 - hh, 0.55, '#d8ffc0');
      }
      if (b === 'bosque') { v.dot(4.5, 4.6, 0.7, '#e8283a'); v.dot(9.6, 3.8, 0.6, '#ff6a58'); }
    };
  }
  BIOS.forEach(function (b) { addBV(b, 'bush0', 14, 10, [bushFn(b, 1)], { lw: 0 }); addBV(b, 'bush1', 14, 10, [bushFn(b, 2)], { lw: 0 }); });

  // --- huesos (costillar, craneo, sueltos)
  BIOS.forEach(function (b) {
    var P = BP[b];
    function bone(v, x0, y0, x1, y1, wd) { v.line(x0, y0, x1, y1, wd + 1.1, OLC); v.line(x0, y0, x1, y1, wd, P.bone); v.dot(x0, y0, wd * 0.8, P.bone); v.dot(x1, y1, wd * 0.8, P.bone); }
    function boneKnob(v, x0, y0, x1, y1, wd) { // contorno primero, luego relleno -> sin costuras
      v.dot(x0, y0, wd * 0.8 + 0.55, OLC); v.dot(x1, y1, wd * 0.8 + 0.55, OLC); v.line(x0, y0, x1, y1, wd + 1.1, OLC);
      v.line(x0, y0, x1, y1, wd, P.bone); v.dot(x0, y0, wd * 0.8, P.bone); v.dot(x1, y1, wd * 0.8, P.bone);
    }
    addBV(b, 'bones0', 12, 9, [function (v) {
      var x = v.ctx, i; v.stick([[2.4, 0.8], [2.4, 7.6]], 1.2, P.boneS, { lw: 0.9 });
      for (i = 0; i < 4; i++) { x.strokeStyle = OLC; x.lineWidth = 2; x.beginPath(); x.moveTo(2.6, 1.4 + i * 1.9); x.quadraticCurveTo(9, 0.6 + i * 1.9, 9.4 - (i % 2), 3 + i * 1.8); x.stroke(); x.strokeStyle = P.bone; x.lineWidth = 0.95; x.stroke(); }
    }], { lw: 0.9 });
    addBV(b, 'bones1', 8, 7, [function (v) {
      v.part(Pblob(4, 3, 3.3, 2.7, 5, 0.04, 8), P.bone, { lw: 0.9, sh: P.boneS, hi: P.boneH, so: 0.5 });
      v.part(Prr(2.4, 4.8, 3.2, 1.8, 0.6), P.boneS, { lw: 0.7, sh: '#7a6244', so: 0.2 });
      v.dot(2.9, 3.3, 0.8, '#1a0c14'); v.dot(5.1, 3.3, 0.8, '#1a0c14'); v.dot(4, 4.6, 0.35, '#1a0c14');
      v.line(3.2, 5.6, 3.2, 6.3, 0.35, OLC); v.line(4.8, 5.6, 4.8, 6.3, 0.35, OLC);
    }], { lw: 0.9 });
    addBV(b, 'bones2', 12, 6, [function (v) { boneKnob(v, 1.8, 1.6, 8.6, 2.8, 0.9); boneKnob(v, 3.4, 4.6, 10.2, 4, 0.8); }], { lw: 0.8 });
  });

  // --- columnas con hiedra (bosque) / urnas y totems de hueso (cripta) / pedestales (asfodelo)
  function ivy(v, pts, col, colH) {
    pts.forEach(function (p, i) { v.part(Pblob(p[0], p[1], 1.5, 0.95, 60 + i, 0.1, 7, p[2] || 0.6), i % 2 ? col : colH, { lw: 0.5, sh: BP.bosque.mossS, so: 0.3, ol: '#143020' }); });
  }
  addBV('bosque', 'stump0', 12, 10, [function (v) {
    var P = BP.bosque;
    v.part(Prr(1.4, 3, 9.2, 6.4, 1), P.stone, { lw: 1.2, sh: P.stoneS, hi: P.stoneH, so: 0.9 });
    v.part(Pblob(6, 3, 4.8, 1.8, 3, 0.04, 8), P.stoneH, { lw: 1.1, sh: P.stone, so: 0.5 });
    v.line(4, 5.4, 4, 8.8, 0.4, P.stoneS); v.line(7.4, 4.6, 7.4, 8.4, 0.4, P.stoneS);
    ivy(v, [[3.2, 5.2], [4.4, 7], [2.8, 8.4], [9.2, 6], [8.2, 4.4]], P.moss, P.mossH);
  }], { lw: 1.2 });
  addBV('bosque', 'stump1', 9, 8, [function (v) {
    var P = BP.bosque;
    v.part(Prr(1.2, 3, 6.6, 4.4, 0.9), P.stone, { lw: 1.1, sh: P.stoneS, hi: P.stoneH, so: 0.7 });
    v.part(Pblob(4.5, 3, 3.3, 1.3, 4, 0.04, 8), P.stoneH, { lw: 1, so: 0.4 });
    ivy(v, [[2.6, 5.2], [3.6, 6.8], [6.8, 5.4]], P.moss, P.mossH);
  }], { lw: 1.1 });
  addBV('cripta', 'stump0', 12, 10, [function (v) { // urna
    var P = BP.cripta, x = v.ctx;
    v.part(Pclosed([[4.6, 1.2], [7.4, 1.2], [8.2, 3], [10.6, 5], [9.8, 8.4], [6, 9.6], [2.2, 8.4], [1.4, 5], [3.8, 3]]), '#e4d4b8', { lw: 1.2, sh: '#a89478', hi: '#fff6e0', so: 1 });
    v.part(Prr(4.2, 0.4, 3.6, 1.3, 0.5), '#f1e4cc', { lw: 0.9, sh: '#bba88a', so: 0.3 });
    x.strokeStyle = '#3a6aa8'; x.lineWidth = 0.9; x.beginPath(); x.moveTo(2, 5.6); x.quadraticCurveTo(6, 6.6, 10, 5.6); x.stroke();
    v.line(3, 7.2, 9, 7.2, 0.5, '#3a6aa8'); v.dot(6, 6.2, 0.6, '#3a6aa8');
  }], { lw: 1.2 });
  addBV('cripta', 'stump1', 9, 8, [function (v) { // craneo sobre pedestal
    var P = BP.cripta;
    v.part(Prr(1.4, 4.6, 6.2, 3, 0.7), P.stone, { lw: 1, sh: P.stoneS, hi: P.stoneH, so: 0.6 });
    v.part(Pblob(4.5, 2.8, 2.8, 2.4, 5, 0.04, 8), P.bone, { lw: 0.9, sh: P.boneS, hi: P.boneH, so: 0.5 });
    v.dot(3.5, 2.9, 0.65, '#1a0c14'); v.dot(5.5, 2.9, 0.65, '#1a0c14');
  }], { lw: 1 });
  addBV('asfodelo', 'stump0', 12, 10, [function (v) {
    var P = BP.asfodelo;
    v.part(Prr(1.4, 3, 9.2, 6.4, 1), P.stone, { lw: 1.2, sh: P.stoneS, hi: P.stoneH, so: 0.9 });
    v.part(Pblob(6, 3, 4.8, 1.8, 3, 0.04, 8), P.stoneH, { lw: 1.1, so: 0.5 });
    for (var i = 0; i < 3; i++) v.line(3.4 + i * 2.6, 5, 3.4 + i * 2.6, 8.8, 0.45, P.stoneS);
    v.dot(6, 2.6, 0.6, '#b8ff8a');
  }], { lw: 1.2 });
  addBV('asfodelo', 'stump1', 9, 8, [function (v) {
    var P = BP.asfodelo;
    v.part(Prr(1.2, 3, 6.6, 4.4, 0.9), P.stone, { lw: 1.1, sh: P.stoneS, hi: P.stoneH, so: 0.7 });
    v.part(Pblob(4.5, 3, 3.3, 1.3, 4, 0.04, 8), P.stoneH, { lw: 1, so: 0.4 });
  }], { lw: 1.1 });

  // --- lapidas con simbolo
  BIOS.forEach(function (b) {
    var P = BP[b];
    addBV(b, 'grave', 10, 14, [function (v) {
      var x = v.ctx, base = b === 'cripta' ? '#4a3a52' : P.rock;
      v.part(Pclosed([[1.2, 13], [1.2, 5.4], [2, 2.6], [5, 0.8], [8, 2.6], [8.8, 5.4], [8.8, 13]]), base, { lw: 1.3, sh: P.rockS, hi: P.rockH, so: 1 });
      v.part(Pblob(5, 13, 5, 1, 2, 0.05, 8), P.rockS, { lw: 0.8, so: 0.2 });
      if (b === 'cripta') {
        v.part(Pblob(5, 5.4, 1.9, 1.7, 4, 0.04, 8), P.bone, { lw: 0.6, sh: P.boneS, so: 0.3 }); v.dot(4.3, 5.4, 0.45, '#1a0c14'); v.dot(5.7, 5.4, 0.45, '#1a0c14'); v.line(4.2, 6.9, 5.8, 6.9, 0.4, '#1a0c14');
        glow(x, P.accG, 4, function () { x.strokeStyle = P.acc; x.lineWidth = 0.6; x.beginPath(); x.moveTo(5, 8.8); x.lineTo(5, 11.8); x.moveTo(3.6, 10); x.lineTo(6.4, 10); x.stroke(); });
      } else {
        glow(x, P.accG, 5, function () {
          x.strokeStyle = P.acc; x.lineWidth = 0.7; x.beginPath(); x.ellipse(5, 6.2, 2, 1.4, 0, 0, 6.2832); x.moveTo(5, 8.2); x.lineTo(5, 11.4); x.moveTo(3.2, 10.2); x.lineTo(6.8, 10.2); x.stroke();
          x.fillStyle = P.acc; x.beginPath(); x.arc(5, 6.2, 0.6, 0, 6.2832); x.fill();
        });
        if (b === 'bosque') v.flat(Pblob(3, 2.4, 2.4, 1.1, 8, 0.15, 7), P.moss, { sh: P.mossS, hi: P.mossH, so: 0.3 });
      }
    }], { lw: 1.3 });
  });

  // --- runas del suelo (4 variantes, brillantes)
  BIOS.forEach(function (b) {
    var P = BP[b];
    for (var rv = 0; rv < 4; rv++) addBV(b, 'rune' + rv, 16, 16, [(function (rv) { return function (v) {
      var x = v.ctx, a;
      glow(x, P.accG, 7, function () {
        x.strokeStyle = P.acc; x.lineWidth = 0.9; x.beginPath();
        if (rv === 0) { x.moveTo(8, 3); x.lineTo(8, 13); x.moveTo(8, 5); x.lineTo(4, 9); x.moveTo(8, 5); x.lineTo(12, 9); x.moveTo(5, 12); x.lineTo(11, 12); }
        else if (rv === 1) { x.moveTo(4, 4); x.lineTo(12, 12); x.moveTo(12, 4); x.lineTo(4, 12); x.moveTo(8, 2); x.lineTo(8, 14); }
        else if (rv === 2) { x.arc(8, 8, 5, 0, 6.2832); x.moveTo(8, 6); x.lineTo(8, 10); x.moveTo(6, 8); x.lineTo(10, 8); }
        else { x.moveTo(4, 12); x.lineTo(8, 3); x.lineTo(12, 12); x.closePath(); x.moveTo(6, 8); x.lineTo(10, 8); x.ellipse(8, 10, 1, 0.8, 0, 0, 6.2832); }
        x.stroke();
      });
      x.globalAlpha = 0.5; v.dot(8, 8, 1, '#fff4d0'); x.globalAlpha = 1;
    }; })(rv)], { lw: 0 });
  });

  // --- antorchas/braseros: poste (base en el centro inferior). La llama es 'torch_flame' y el halo 'torch_light'
  addBV('bosque', 'torch', 8, 16, [function (v) {
    v.part(Prr(2.9, 6, 2.2, 9.4, 0.8), '#7a4a2a', { lw: 1.1, sh: '#4a2a18', hi: '#b07a48', so: 0.5 });
    v.part(Prr(1.4, 13.6, 5.2, 2.2, 1), '#4a4a5e', { lw: 1, sh: '#2a2a3a', so: 0.3 });
    v.part(Pclosed([[0.6, 3.6], [7.4, 3.6], [6.4, 6.8], [4, 7.4], [1.6, 6.8]]), '#3a3a4e', { lw: 1.1, sh: '#1e1e2c', hi: '#6a6a82', so: 0.6 });
  }], { lw: 1.1 });
  addBV('cripta', 'torch', 8, 16, [function (v) { // columna de huesos con cuenco dorado
    var P = BP.cripta;
    v.part(Prr(1.6, 13.4, 4.8, 2.4, 0.9), P.stone, { lw: 1, sh: P.stoneS, hi: P.stoneH, so: 0.4 });
    for (var i = 0; i < 3; i++) { v.part(Prr(2.7, 6.4 + i * 2.4, 2.6, 2.6, 1), P.bone, { lw: 0.9, sh: P.boneS, hi: P.boneH, so: 0.4 }); }
    v.part(Pclosed([[0.4, 3.4], [7.6, 3.4], [6.6, 6.2], [4, 7], [1.4, 6.2]]), '#c98a2a', { lw: 1.1, sh: '#7a4a1a', hi: '#ffd070', so: 0.6 });
  }], { lw: 1.1 });
  addBV('asfodelo', 'torch', 8, 16, [function (v) { // poste con serpiente
    var P = BP.asfodelo, x = v.ctx;
    v.part(Prr(1.6, 13.4, 4.8, 2.4, 0.9), P.stone, { lw: 1, sh: P.stoneS, hi: P.stoneH, so: 0.4 });
    v.part(Prr(2.9, 6, 2.2, 8, 0.8), P.stone, { lw: 1.1, sh: P.stoneS, hi: P.stoneH, so: 0.5 });
    x.strokeStyle = OLC; x.lineWidth = 1.9; x.beginPath(); x.moveTo(2, 8); x.quadraticCurveTo(6, 9.4, 2.4, 11); x.quadraticCurveTo(6, 12.4, 3, 13.6); x.stroke(); x.strokeStyle = '#2a8a5a'; x.lineWidth = 0.9; x.stroke();
    v.part(Pclosed([[0.4, 3.4], [7.6, 3.4], [6.6, 6.2], [4, 7], [1.4, 6.2]]), '#2e4a4a', { lw: 1.1, sh: '#16282c', hi: '#5a8a80', so: 0.6 });
  }], { lw: 1.1 });

  // --- niebla (capas suaves, translucidas)
  var FOGC = { bosque: ['120,150,170', '110,130,160'], cripta: ['200,90,50', '150,70,70'], asfodelo: ['90,200,160', '70,160,150'] };
  BIOS.forEach(function (b) {
    [0, 1].forEach(function (n) {
      addBV(b, 'fog' + n, 48, 24, [function (v) {
        var x = v.ctx, r = rrand(n + 3), i;
        for (i = 0; i < 5; i++) {
          var cx = 8 + r() * 32, cy = 7 + r() * 10, rr = 7 + r() * 9, g = x.createRadialGradient(cx, cy, 0, cx, cy, rr);
          g.addColorStop(0, 'rgba(' + FOGC[b][n] + ',0.09)'); g.addColorStop(1, 'rgba(' + FOGC[b][n] + ',0)');
          x.fillStyle = g; x.fillRect(0, 0, 48, 24);
        }
      }], { lw: 0 });
    });
  });

  // --- circulo ritual (independiente de la resolucion: se dibuja en cualquier ctx con radio R)
  var RING = { bosque: ['#8a92aa', '#5c6480', '#2e5a52'], cripta: ['#5e4258', '#3a2638', '#1a0c18'], asfodelo: ['#4a8a7c', '#2c5a58', '#0f3a38'] };
  function ritual(x, cx, cy, R, b, haloR) {
    var P = BP[b], u = R / 100, r = rrand(11), k, a;
    x.save(); x.translate(cx, cy); x.lineJoin = 'round'; x.lineCap = 'round';
    // halo rojo detras
    haloR = haloR || R * 1.45; var hg = x.createRadialGradient(0, 0, R * 0.6, 0, 0, haloR); hg.addColorStop(0, P.accG.replace('0.9', '0.34')); hg.addColorStop(1, P.accG.replace('0.9', '0'));
    x.fillStyle = hg; x.beginPath(); x.arc(0, 0, haloR, 0, 6.2832); x.fill();
    // anillo de piedra
    x.fillStyle = P.out; x.beginPath(); x.arc(0, 0, R + 3.2 * u, 0, 6.2832); x.fill();
    var lg = x.createLinearGradient(-R, -R, R, R); lg.addColorStop(0, RING[b][0]); lg.addColorStop(1, RING[b][1]);
    x.fillStyle = lg; x.beginPath(); x.arc(0, 0, R, 0, 6.2832); x.fill();
    x.strokeStyle = P.gap; x.lineWidth = 1.5 * u;
    for (k = 0; k < 22; k++) { a = k / 22 * 6.2832 + (r() - 0.5) * 0.05; x.beginPath(); x.moveTo(Math.cos(a) * 70 * u, Math.sin(a) * 70 * u); x.lineTo(Math.cos(a + (r() - 0.5) * 0.04) * R, Math.sin(a) * R); x.stroke(); }
    // brillo del borde superior-izquierdo
    x.strokeStyle = 'rgba(255,255,255,0.18)'; x.lineWidth = 3 * u; x.beginPath(); x.arc(0, 0, R - 2 * u, Math.PI * 0.95, Math.PI * 1.55); x.stroke();
    // disco interior
    x.fillStyle = P.out; x.beginPath(); x.arc(0, 0, 71 * u, 0, 6.2832); x.fill();
    x.fillStyle = RING[b][2]; x.beginPath(); x.arc(0, 0, 67.5 * u, 0, 6.2832); x.fill();
    var ig = x.createRadialGradient(0, 0, 0, 0, 0, 67 * u); ig.addColorStop(0, 'rgba(0,0,0,0)'); ig.addColorStop(1, 'rgba(0,0,0,0.35)'); x.fillStyle = ig; x.beginPath(); x.arc(0, 0, 67.5 * u, 0, 6.2832); x.fill();
    // musgo (bosque/asfodelo) o craneos incrustados (cripta)
    for (k = 0; k < 11; k++) {
      a = r() * 6.2832; var rd = (b === 'cripta' ? 85 : (r() < 0.5 ? 92 : 72)) * u, mx = Math.cos(a) * rd, my = Math.sin(a) * rd, s = (7 + r() * 9) * u;
      if (b === 'cripta') { if (k > 7) continue; a = k / 8 * 6.2832; mx = Math.cos(a) * 85 * u; my = Math.sin(a) * 85 * u; x.fillStyle = P.out; x.beginPath(); x.arc(mx, my, 7.4 * u, 0, 6.2832); x.fill(); x.fillStyle = P.bone; x.beginPath(); x.arc(mx, my, 5.6 * u, 0, 6.2832); x.fill(); x.fillStyle = '#1a0c14'; x.beginPath(); x.arc(mx - 2 * u, my - 0.5 * u, 1.5 * u, 0, 6.2832); x.arc(mx + 2 * u, my - 0.5 * u, 1.5 * u, 0, 6.2832); x.fill(); glow(x, P.accG, 4 * u, function () { x.fillStyle = P.acc; x.beginPath(); x.arc(mx - 2 * u, my - 0.5 * u, 0.7 * u, 0, 6.2832); x.arc(mx + 2 * u, my - 0.5 * u, 0.7 * u, 0, 6.2832); x.fill(); }); continue; }
      x.fillStyle = P.out; x.beginPath(); x.ellipse(mx, my, s + 1.4 * u, s * 0.62 + 1.4 * u, a, 0, 6.2832); x.fill();
      x.fillStyle = P.moss; x.beginPath(); x.ellipse(mx, my, s, s * 0.62, a, 0, 6.2832); x.fill();
      x.fillStyle = P.mossH; x.beginPath(); x.ellipse(mx - s * 0.2, my - s * 0.2, s * 0.55, s * 0.28, a, 0, 6.2832); x.fill();
    }
    // pentagrama rojo brillante
    var pr = 54 * u, pts = [];
    for (k = 0; k < 5; k++) pts.push([Math.cos(-Math.PI / 2 + k * 1.2566) * pr, Math.sin(-Math.PI / 2 + k * 1.2566) * pr]);
    var draw5 = function (col, lw) {
      x.strokeStyle = col; x.lineWidth = lw; x.beginPath(); x.arc(0, 0, pr, 0, 6.2832); x.stroke(); x.beginPath(); x.arc(0, 0, pr * 1.13, 0, 6.2832); x.lineWidth = lw * 0.45; x.stroke(); x.lineWidth = lw;
      x.beginPath(); for (k = 0; k < 6; k++) { var p = pts[(k * 2) % 5]; k ? x.lineTo(p[0], p[1]) : x.moveTo(p[0], p[1]); } x.stroke();
    };
    glow(x, P.accG, 14 * u, function () { draw5(P.acc, 3 * u); });
    draw5(mixh(P.acc, 'w', 0.35), 1.1 * u);
    // lineas que salen de las puntas hacia el anillo
    x.strokeStyle = P.acc; x.globalAlpha = 0.85; x.lineWidth = 1.5 * u;
    for (k = 0; k < 5; k++) { x.beginPath(); x.moveTo(pts[k][0] * 1.13, pts[k][1] * 1.13); x.lineTo(pts[k][0] * 1.82, pts[k][1] * 1.82); x.stroke(); }
    x.globalAlpha = 1;
    // pozo central
    var pg = x.createRadialGradient(0, 0, 0, 0, 0, 20 * u); pg.addColorStop(0, '#12000a'); pg.addColorStop(0.55, 'rgba(120,6,24,0.95)'); pg.addColorStop(1, P.accG.replace('0.9', '0'));
    x.fillStyle = pg; x.beginPath(); x.arc(0, 0, 20 * u, 0, 6.2832); x.fill();
    x.restore();
  }
  BIOS.forEach(function (b) { addBV(b, 'ritual_circle', 64, 64, [function (v) { ritual(v.ctx, 32, 32, 29.5, b, 31.8); }], { lw: 0 }); });

  // --- columna grande (28x44): bosque = hiedra, cripta = totem de huesos, asfodelo = columna griega
  BIOS.forEach(function (b) {
    var P = BP[b];
    addBV(b, 'column', 28, 44, [function (v) {
      var x = v.ctx, i;
      if (b === 'cripta') {
        v.part(Prr(4, 36, 20, 7, 1.5), P.stone, { lw: 1.6, sh: P.stoneS, hi: P.stoneH, so: 1 });
        v.part(Prr(8, 14, 12, 24, 1.5), '#4a3248', { lw: 1.6, sh: '#2a1a2c', hi: '#7a5a78', so: 1.2 });
        glow(x, P.accG, 6, function () { x.strokeStyle = P.acc; x.lineWidth = 1; x.beginPath(); x.moveTo(14, 18); x.lineTo(14, 34); x.moveTo(11, 24); x.lineTo(17, 24); x.stroke(); });
        for (i = 0; i < 2; i++) { var sx = i ? 1 : -1; x.strokeStyle = OLC; x.lineWidth = 4.6; x.beginPath(); x.moveTo(14 + sx * 4, 16); x.quadraticCurveTo(14 + sx * 13, 14, 14 + sx * 11, 26); x.stroke(); x.strokeStyle = P.bone; x.lineWidth = 2.6; x.stroke(); }
        v.part(Pblob(14, 9, 7, 6.2, 5, 0.04, 10), P.bone, { lw: 1.5, sh: P.boneS, hi: P.boneH, so: 1 });
        v.part(Prr(10, 12, 8, 4, 1.2), P.boneS, { lw: 1, sh: '#7a5a38', so: 0.4 });
        v.part(Pblob(11, 8.6, 1.9, 1.7, 3), '#1a0c14', { lw: 0.5 }); v.part(Pblob(17, 8.6, 1.9, 1.7, 4), '#1a0c14', { lw: 0.5 });
        glow(x, P.accG, 5, function () { v.dot(11, 8.6, 0.8, P.acc); v.dot(17, 8.6, 0.8, P.acc); });
        return;
      }
      var st = b === 'bosque' ? [P.stone, P.stoneS, P.stoneH] : [P.stone, P.stoneS, P.stoneH];
      v.part(Prr(3, 37, 22, 6.4, 1.4), st[0], { lw: 1.6, sh: st[1], hi: st[2], so: 1 });
      v.part(Prr(6, 9, 16, 29, 1.3), st[0], { lw: 1.6, sh: st[1], hi: st[2], so: 1.4 });
      v.line(10, 12, 10, 36, 0.5, st[1]); v.line(14, 12, 14, 36, 0.5, st[1]); v.line(18, 12, 18, 36, 0.5, st[1]);
      v.part(Prr(2.4, 3.4, 23.2, 6.6, 1.6), st[0], { lw: 1.6, sh: st[1], hi: st[2], so: 1 });
      if (b === 'asfodelo') { v.part(Pcirc(5.4, 6.6, 2.2), st[2], { lw: 1, sh: st[0], so: 0.4 }); v.part(Pcirc(22.6, 6.6, 2.2), st[2], { lw: 1, sh: st[0], so: 0.4 }); glow(x, P.accG, 8, function () { v.dot(14, 0.8, 1.1, '#b8ff8a'); }); return; }
      // grietas + hiedra
      v.line(17, 14, 15, 20, 0.5, '#3a3430'); v.line(15, 20, 18, 26, 0.5, '#3a3430');
      var pts = [[7, 12], [8.4, 16], [6.6, 20], [8, 25], [7, 30], [9.4, 34], [20, 14], [21.4, 20], [19.6, 27], [4.6, 5], [9, 4.4], [16, 4], [22, 5.4], [5, 38], [11, 40]];
      pts.forEach(function (p, n) { v.part(Pblob(p[0], p[1], 2.4, 1.5, 20 + n, 0.1, 7, n * 0.9), n % 3 ? P.moss : P.mossH, { lw: 0.7, sh: P.mossS, so: 0.4, ol: '#143020' }); });
      x.strokeStyle = '#143020'; x.lineWidth = 0.6; x.beginPath(); x.moveTo(7, 10); x.quadraticCurveTo(9, 24, 7, 36); x.stroke();
    }], { lw: 1.6 });
  });
  // --- piezas de borde grandes (40x28): bosque = muro en ruinas con hiedra, cripta = costillas gigantes, asfodelo = muro con greca
  BIOS.forEach(function (b) {
    var P = BP[b];
    [0, 1].forEach(function (n) {
      addBV(b, 'edge' + n, 40, 28, [function (v) {
        var x = v.ctx, i;
        if (b === 'cripta') {
          for (i = 0; i < (n ? 4 : 5); i++) { var bx = 4 + i * 7.4, hh = 18 + ((i * 7) % 5); v.part(Pclosed([[bx, 27], [bx + 0.6, 27 - hh], [bx + 3.6, 27 - hh - 2.2], [bx + 6.4, 27 - hh + 1.2], [bx + 6, 27]]), '#d8b078', { lw: 1.6, sh: '#8a5e36', hi: '#fff0c8', so: 1.3 }); v.line(bx + 2, 25, bx + 2.4, 27 - hh + 3, 0.5, '#8a5e36'); }
          v.part(Pblob(20, 27, 19, 1.6, 4, 0.05, 10), '#2a1a2c', { lw: 1.2, so: 0.2 });
          if (n) { v.part(Pblob(33.4, 8, 4.6, 4, 5, 0.04, 9), P.bone, { lw: 1.3, sh: P.boneS, hi: P.boneH, so: 0.8 }); v.dot(32, 8, 1.2, '#1a0c14'); v.dot(35, 8, 1.2, '#1a0c14'); }
          return;
        }
        var blocks = n ? [[2, 14, 12, 12], [14, 14, 10, 12], [26, 17, 11, 9], [6, 3, 11, 11], [19, 7, 9, 7]] : [[1, 15, 13, 11], [14, 15, 12, 11], [26, 15, 13, 11], [3, 4, 12, 11], [15, 4, 13, 11], [28, 6, 10, 9]];
        blocks.forEach(function (bk) { v.part(Prr(bk[0], bk[1], bk[2], bk[3], 2), P.stone, { lw: 1.4, sh: P.stoneS, hi: P.stoneH, so: 1 }); });
        if (b === 'asfodelo') { glow(x, P.accG, 5, function () { x.strokeStyle = P.acc; x.lineWidth = 0.6; x.beginPath(); for (i = 0; i < 12; i++) { x.moveTo(3 + i * 3, 20); x.lineTo(3 + i * 3, 23); x.lineTo(5 + i * 3, 23); } x.stroke(); }); return; }
        [[4, 14], [11, 14.4], [20, 14], [30, 15], [9, 5], [22, 5.4], [32, 7]].forEach(function (p, k) { v.part(Pblob(p[0], p[1], 3, 1.6, 40 + k, 0.1, 7, k), k % 2 ? P.moss : P.mossH, { lw: 0.8, sh: P.mossS, so: 0.4, ol: '#143020' }); });
      }], { lw: 1.4 });
    });
  });
  // ------------------------------------------------------------------ API SPRITES
  function ent(name) { return biomes[curBiome][name] || reg[name]; }
  function pickFrame(e, name, f) {
    if (!e) throw new Error('Assets: sprite desconocido "' + name + '"');
    if (typeof f === 'string') {
      var p = f.split(':'), an = e.anims && e.anims[p[0]];
      if (!an) throw new Error('Assets: animacion desconocida "' + f + '" en ' + name);
      var idx = p.length > 1 ? (parseInt(p[1], 10) || 0) : 0, n = an.f.length;
      idx = an.loop === false ? Math.max(0, Math.min(n - 1, idx)) : ((idx % n) + n) % n;
      return e.frames[an.f[idx]];
    }
    var m = e.frames.length, i = ((f | 0) % m + m) % m;
    return e.frames[i];
  }
  var BIOME_INFO = {
    bosque: { label: 'Bosque corrupto (claro de piedra musgosa)', vignette: '6,6,34', fog: '120,150,170', light: '255,150,60', bg: '#0a0920' },
    cripta: { label: 'Cripta: inframundo de huesos y lava', vignette: '34,6,12', fog: '200,90,50', light: '255,130,50', bg: '#1a0a14' },
    asfodelo: { label: 'Asfodelo esmeralda', vignette: '2,20,18', fog: '90,200,160', light: '110,255,120', bg: '#05100f' }
  };
  var Assets = {
    scale: SCALE,
    sprite: function (name, f) { return pickFrame(ent(name), name, f || 0); },
    frames: function (name) { return ent(name).frames.length; },
    info: function (name) { var e = ent(name); return e && { name: name, w: e.w, h: e.h, frames: e.frames.length, anims: e.anims }; },
    list: function () { return order.concat(bnames).map(function (n) { return Assets.info(n); }); },
    animFrame: function (name, anim, tMs) {
      var an = ent(name).anims[anim], i = Math.floor((tMs || 0) / 1000 * an.fps);
      i = an.loop === false ? Math.min(i, an.f.length - 1) : i % an.f.length;
      return ent(name).frames[an.f[i]];
    },
    // duracion (ms) de una animacion de una pasada
    animDuration: function (name, anim) { var an = ent(name).anims[anim]; return an.f.length / an.fps * 1000; },
    // true si el sprite tiene esa animacion
    hasAnim: function (name, anim) { var e = ent(name); return !!(e && e.anims && e.anims[anim]); },
    addToPhaser: function (textures) {
      function reg1(k, c) { if (textures.exists(k)) textures.remove(k); textures.addCanvas(k, c); }
      order.forEach(function (n) { reg[n].frames.forEach(function (c, i) { var k = n + ':' + i; if (!textures.exists(k)) textures.addCanvas(k, c); }); });
      bnames.forEach(function (n) {
        Object.keys(biomes).forEach(function (b) { biomes[b][n].frames.forEach(function (c, i) { reg1(n + '@' + b + ':' + i, c); }); });
        biomes[curBiome][n].frames.forEach(function (c, i) { reg1(n + ':' + i, c); });
      });
    },

    // ---- biomas
    biomes: function () { return Object.keys(biomes); },
    getBiome: function () { return curBiome; },
    setBiome: function (name) { if (!biomes[name]) return false; curBiome = name; vigCache = {}; return true; },
    biomeInfo: function (name) { var i = BIOME_INFO[name || curBiome]; return i && { name: name || curBiome, label: i.label, bg: i.bg, decor: ['rock0', 'rock1', 'rock2', 'grass0', 'grass1', 'grass2', 'mushroom', 'bush0', 'bush1', 'bones0', 'bones1', 'bones2', 'stump0', 'stump1', 'grave', 'rune0', 'rune1', 'rune2', 'rune3', 'torch', 'column', 'edge0', 'edge1'], tiles: 10 }; }
  };

  // ---- ambiente: vineta, niebla, antorchas con luz animada
  var vigCache = {};
  // Vineta oscura (canvas cacheado). o: {strength 0..1 (0.6), inner 0..1 (0.45), tint 'r,g,b'}
  Assets.vignette = function (w, h, o) {
    o = o || {};
    var st = o.strength == null ? 0.6 : o.strength, inn = o.inner == null ? 0.45 : o.inner, tint = o.tint || BIOME_INFO[curBiome].vignette;
    var key = [w, h, st, inn, tint].join('|');
    if (vigCache[key]) return vigCache[key];
    var c = mkCanvas(w, h), x = c.getContext('2d'), R = Math.hypot(w, h) / 2;
    var g = x.createRadialGradient(w / 2, h / 2, R * inn, w / 2, h / 2, R);
    g.addColorStop(0, 'rgba(' + tint + ',0)'); g.addColorStop(0.5, 'rgba(' + tint + ',' + (st * 0.3).toFixed(2) + ')'); g.addColorStop(0.78, 'rgba(' + tint + ',' + (st * 0.72).toFixed(2) + ')'); g.addColorStop(1, 'rgba(' + tint + ',' + Math.min(1, st * 1.12).toFixed(2) + ')');
    x.fillStyle = g; x.fillRect(0, 0, w, h);
    vigCache[key] = c;
    return c;
  };
  // Niebla a la deriva sobre un area w x h. o: {alpha 0.8, layers 2, speed 12 (px/s)}
  Assets.drawFog = function (ctx2, w, h, tMs, o) {
    o = o || {};
    var layers = o.layers || 2, sp = o.speed || 12, al = o.alpha == null ? 0.8 : o.alpha, t = (tMs || 0) / 1000;
    ctx2.save();
    ctx2.imageSmoothingEnabled = true;
    for (var l = 0; l < layers; l++) {
      var cv = Assets.sprite('fog' + (l % 2)), sc = 2.6 + l * 0.9, sw = cv.width * sc, sh = cv.height * sc, off = (t * sp * (l + 1) * (l % 2 ? -1 : 1)) % (sw * 0.85);
      var cols = Math.ceil(w / (sw * 0.85)) + 2, rows = Math.ceil(h / (sh * 0.7)) + 1;
      for (var j = 0; j < rows; j++) for (var i = -1; i < cols; i++) {
        var hsh = Math.sin((i + l * 7) * 12.9898 + j * 78.233) * 43758.5453; hsh -= Math.floor(hsh);
        ctx2.globalAlpha = al * (0.45 + 0.55 * hsh);
        ctx2.drawImage(cv, i * sw * 0.85 + off + (hsh - 0.5) * 40, j * sh * 0.7 + (l * 37) % 50 - sh * 0.2, sw, sh);
      }
    }
    ctx2.restore();
  };
  // Halo de luz de fuego (aditivo) centrado en (x,y); scale 1 = ~64px de diametro x 3
  Assets.drawLight = function (ctx2, x, y, tMs, scale) {
    var cv = Assets.animFrame('torch_light', 'flicker', (tMs || 0) + (x * 13 + y * 7) % 400), s = (scale || 3) * (1 + 0.05 * Math.sin((tMs || 0) / 90 + x));
    ctx2.save(); ctx2.globalCompositeOperation = 'lighter'; ctx2.imageSmoothingEnabled = true;
    ctx2.drawImage(cv, x - cv.width * s / 2, y - cv.height * s / 2, cv.width * s, cv.height * s);
    ctx2.restore();
  };
  // Llama + luz de una antorcha cuya base (centro del poste) esta en (x,y)
  Assets.drawTorchFire = function (ctx2, x, y, tMs, o) {
    o = o || {};
    var f = Assets.animFrame('torch_flame', 'burn', (tMs || 0) + (x * 31 + y * 17) % 500);
    if (o.candle) { // vela: llama pequena sobre la mecha (base de la vela en x,y)
      var cs = o.scale || 0.55, fw = f.width * cs, fh = f.height * cs, wob = Math.sin((tMs || 0) / 120 + x) * 0.6;
      Assets.drawLight(ctx2, x, y - 26, tMs, o.lightScale || 1.7);
      ctx2.drawImage(f, Math.round(x - fw / 2 + wob), Math.round(y - 25 - fh + 3), fw, fh);
      return;
    }
    var sc = o.scale || 1, fw = f.width * sc, fh = f.height * sc;
    if (o.light !== false) Assets.drawLight(ctx2, x, y - 34 * sc, tMs, o.lightScale || 3.4);
    ctx2.drawImage(f, Math.round(x - fw / 2), Math.round(y - 22 * sc - fh), fw, fh);
  };
  // Antorcha completa (poste + llama + luz) con base en (x,y)
  Assets.drawTorch = function (ctx2, x, y, tMs, o) {
    var p = Assets.sprite('torch'); ctx2.drawImage(p, Math.round(x - p.width / 2), Math.round(y - p.height));
    Assets.drawTorchFire(ctx2, x, y, tMs, o);
  };
  // Esparce decoracion del bioma actual sobre un canvas ya pintado (suelo). Devuelve {torches:[{x,y}]} para animarlas luego.
  // o: {seed, wall (margen), avoid [{x,y,r}] (defecto: centro r=150), torches (6), density (1)}
  Assets.decorate = function (g, w, h, o) {
    o = o || {};
    var rr = rng(o.seed || 4242), wall = o.wall == null ? 28 : o.wall, dens = o.density == null ? 1 : o.density;
    var avoid = o.avoid || [{ x: w / 2, y: h / 2, r: 150 }], items = [], i;
    function ok(x, y) { for (var a = 0; a < avoid.length; a++) if (Math.hypot(x - avoid[a].x, y - avoid[a].y) < avoid[a].r) return false; return true; }
    function put(names, n, margin) {
      for (var k = 0; k < Math.round(n * dens); k++) {
        var x = wall + margin + rr() * (w - 2 * (wall + margin)), y = wall + margin + rr() * (h - 2 * (wall + margin));
        if (ok(x, y)) items.push({ n: names[(rr() * names.length) | 0], x: x, y: y });
      }
    }
    var crypt = curBiome !== 'bosque', hell = curBiome === 'cripta';
    put(['bush0', 'bush1'], crypt ? 9 : 26, 14);
    put(['rock0', 'rock1', 'rock2'], 18, 12);
    put(['grass0', 'grass1', 'grass2'], crypt ? 40 : 30, 8);
    put(['mushroom'], hell ? 10 : 14, 8);
    put(['bones0', 'bones1', 'bones2'], hell ? 26 : 8, 10);
    put(['stump0', 'stump1'], crypt ? 14 : 6, 16);
    put(['grave'], crypt ? 8 : 5, 20);
    put(['rune2', 'rune3'], crypt ? 6 : 3, 24);
    items.sort(function (a, b) { return a.y - b.y; });
    for (i = 0; i < items.length; i++) {
      var it = items[i], cv = Assets.sprite(it.n);
      g.save(); if (it.n.indexOf('rune') === 0) g.globalAlpha = 0.7;
      g.drawImage(cv, Math.round(it.x - cv.width / 2), Math.round(it.y - cv.height)); g.restore();
      if (it.n.indexOf('rune') !== 0) { var sh = Assets.sprite('shadow'); g.globalAlpha = 0.5; g.drawImage(sh, Math.round(it.x - sh.width / 2 * Math.min(1, cv.width / 28 + 0.4)), Math.round(it.y - sh.height / 2 - 2), sh.width * Math.min(1, cv.width / 28 + 0.4), sh.height); g.globalAlpha = 1; }
    }
    var tn = o.torches == null ? 6 : o.torches, torches = [], pts = [[0.18, 0.2], [0.82, 0.2], [0.18, 0.8], [0.82, 0.8], [0.5, 0.12], [0.5, 0.9], [0.06, 0.5], [0.94, 0.5]];
    for (i = 0; i < Math.min(tn, pts.length); i++) {
      var tx = Math.round(w * pts[i][0]), ty = Math.round(h * pts[i][1]), tc = Assets.sprite('torch');
      g.drawImage(Assets.sprite('shadow'), tx - 14, ty - 6);
      g.drawImage(tc, tx - tc.width / 2, ty - tc.height);
      torches.push({ x: tx, y: ty });
    }
    return { torches: torches, items: items.length };
  };

    // ================================================================== ARENA (fondo completo del nivel) + AMBIENTE
  // Assets.arena(w,h,{seed,wall}) -> {canvas, torches:[{x,y,o}]}: claro de piedra con circulo ritual central, decoracion y bordes que enmarcan el combate.
  function bigBlob(cx, cy, rx, ry, seed, n) {
    var pts = [], r = rrand(seed), p1 = r() * 6, p2 = r() * 6, p3 = r() * 6, i;
    for (i = 0; i < n; i++) {
      var a = i / n * 6.2832, ca = Math.cos(a), sa = Math.sin(a), w = 1 + 0.018 * Math.sin(5 * a + p1) + 0.012 * Math.sin(9 * a + p2) + 0.008 * Math.sin(17 * a + p3);
      pts.push([cx + (ca < 0 ? -1 : 1) * Math.pow(Math.abs(ca), 0.42) * rx * w, cy + (sa < 0 ? -1 : 1) * Math.pow(Math.abs(sa), 0.42) * ry * w]);
    }
    return pts;
  }
  function ptsPath(pts) { return function (c) { c.moveTo(pts[0][0], pts[0][1]); for (var i = 1; i < pts.length; i++) c.lineTo(pts[i][0], pts[i][1]); c.closePath(); }; }
  function handFn(x, hx, hy, s, rot, col) {
    x.save(); x.translate(hx, hy); x.rotate(rot); x.scale(s, s); x.fillStyle = col; x.strokeStyle = col; x.lineCap = 'round'; x.lineJoin = 'round';
    x.beginPath(); x.ellipse(0, 0, 9, 11, 0, 0, 6.2832); x.fill();
    var i, fa = [-0.55, -0.2, 0.15, 0.5];
    for (i = 0; i < 4; i++) { x.lineWidth = 4.2; x.beginPath(); x.moveTo(Math.sin(fa[i]) * 6, -8); x.quadraticCurveTo(Math.sin(fa[i]) * 11, -17, Math.sin(fa[i]) * 14 + (i - 1.5) * 1.5, -26 + Math.abs(i - 1.5) * 3); x.stroke(); }
    x.lineWidth = 4.4; x.beginPath(); x.moveTo(-7, 2); x.quadraticCurveTo(-17, -4, -18, -13); x.stroke();
    x.restore();
  }
  Assets.arena = function (w, h, o) {
    o = o || {};
    var b = curBiome, P = BP[b], rr = rrand(o.seed || 777), wall = o.wall == null ? 28 : o.wall, torches = [], i, j, k;
    var c = mkCanvas(w, h), x = c.getContext('2d'), v = V(x), cx = w / 2, cy = h / 2;
    x.lineJoin = 'round'; x.lineCap = 'round'; v.lw = 3; v.ol = P.out;
    function R(a, bb) { return a + rr() * (bb - a); }
    var inset = b === 'bosque' ? 14 : 30, rx = w / 2 - inset, ry = h / 2 - inset + (b === 'bosque' ? 2 : 0);
    var pts = bigBlob(cx, cy, rx, ry, 5, 120), plat = ptsPath(pts);
    function dnorm(px, py) { return Math.pow(Math.pow(Math.abs(px - cx) / rx, 2.4) + Math.pow(Math.abs(py - cy) / ry, 2.4), 1 / 2.4); }
    function sprite(n, px, py, sc, al) { // base en (px,py)
      var s = Assets.sprite(n), sh = Assets.sprite('shadow'); sc = sc || 1;
      x.save(); x.imageSmoothingEnabled = true;
      x.globalAlpha = 0.55; x.drawImage(sh, px - sh.width * sc * 0.55, py - sh.height * sc * 0.5 - 2, sh.width * sc * 1.1, sh.height * sc);
      x.globalAlpha = al == null ? 1 : al; x.drawImage(s, px - s.width * sc / 2, py - s.height * sc, s.width * sc, s.height * sc); x.restore();
    }
    // ---------- 1. exterior
    var g;
    if (b === 'bosque') {
      g = x.createLinearGradient(0, 0, 0, h); g.addColorStop(0, '#0f0c34'); g.addColorStop(1, '#070622'); x.fillStyle = g; x.fillRect(0, 0, w, h);
      for (i = 0; i < 700; i++) {
        var gx = R(0, w), gy = R(0, h), hh = R(24, 56), lean = R(-14, 14);
        x.strokeStyle = '#080a22'; x.lineWidth = 5; x.beginPath(); x.moveTo(gx, gy); x.quadraticCurveTo(gx + lean * 0.3, gy - hh * 0.6, gx + lean, gy - hh); x.stroke();
        x.strokeStyle = i % 5 === 0 ? '#2a7a7a' : (i % 2 ? '#14385a' : '#1b4d62'); x.lineWidth = 2.6; x.stroke();
      }
    } else if (b === 'cripta') {
      g = x.createLinearGradient(0, 0, w, h); g.addColorStop(0, '#d8340c'); g.addColorStop(0.5, '#ff7a1a'); g.addColorStop(1, '#c82a0a'); x.fillStyle = g; x.fillRect(0, 0, w, h);
      for (i = 0; i < 90; i++) { x.fillStyle = ['rgba(255,214,70,0.28)', 'rgba(150,20,10,0.35)', 'rgba(255,150,30,0.3)'][i % 3]; x.beginPath(); x.ellipse(R(0, w), R(0, h), R(30, 130), R(10, 40), R(-0.4, 0.4), 0, 6.2832); x.fill(); }
      x.strokeStyle = 'rgba(70,10,6,0.55)'; x.lineWidth = 6;
      for (i = 0; i < 40; i++) { var lx = R(0, w), ly = R(0, h); x.beginPath(); x.moveTo(lx, ly); x.quadraticCurveTo(lx + R(20, 60), ly - R(8, 20), lx + R(60, 140), ly + R(-6, 6)); x.stroke(); }
      for (i = 0; i < 14; i++) handFn(x, R(0, w), R(0, h), R(0.9, 1.6), R(-0.5, 0.5), 'rgba(110,16,10,0.35)');
    } else {
      g = x.createLinearGradient(0, 0, w, h); g.addColorStop(0, '#4a0812'); g.addColorStop(1, '#7a0e1c'); x.fillStyle = g; x.fillRect(0, 0, w, h);
      for (i = 0; i < 40; i++) handFn(x, R(0, w), R(0, h), R(0.9, 1.7), R(-0.6, 0.6), 'rgba(240,40,56,' + R(0.35, 0.65).toFixed(2) + ')');
    }
    // ---------- 2. plataforma: cara de acantilado + suelo de losas
    if (b !== 'bosque') { x.save(); x.translate(0, 18); x.fillStyle = b === 'cripta' ? '#1c0f1e' : '#0c2224'; x.strokeStyle = P.out; x.lineWidth = 12; x.beginPath(); plat(x); x.stroke(); x.fill(); x.restore(); }
    x.fillStyle = P.out; x.strokeStyle = P.out; x.lineWidth = 16; x.beginPath(); plat(x); x.stroke(); x.fill();
    x.save(); x.beginPath(); plat(x); x.clip(); x.imageSmoothingEnabled = false;
    x.fillStyle = P.gap; x.fillRect(0, 0, w, h);
    for (j = 0; j < h; j += 32) for (i = 0; i < w; i += 32) { var kk = rr() < 0.5 ? 0 : 1 + Math.floor(rr() * 9); x.drawImage(Assets.sprite('ground' + kk), i, j); }
    x.imageSmoothingEnabled = true;
    // parches grandes: musgo (bosque/asfodelo) o sombras calidas (cripta)
    for (i = 0; i < 26; i++) {
      var mx = R(0, w), my = R(0, h), dn = dnorm(mx, my), edge = dn > 0.78;
      if (b === 'cripta') { var gg = x.createRadialGradient(mx, my, 0, mx, my, 150); gg.addColorStop(0, i % 3 ? 'rgba(8,2,12,0.3)' : 'rgba(255,120,40,0.08)'); gg.addColorStop(1, 'rgba(0,0,0,0)'); x.fillStyle = gg; x.fillRect(mx - 150, my - 150, 300, 300); continue; }
      if (!edge && i % 2) continue;
      v.lw = 2.4; v.part(Pblob(mx, my, R(22, 60), R(12, 28), i, 0.12, 11), P.moss, { sh: P.mossS, hi: P.mossH, so: 3 });
      if (i % 3 === 0) { v.dot(mx + 10, my - 4, 3, P.mossH); }
    }
    // grietas largas
    for (i = 0; i < 14; i++) {
      var px = R(60, w - 60), py = R(60, h - 60), cp = [[px, py]];
      for (j = 0; j < 7; j++) { px += R(-26, 26); py += R(10, 30); cp.push([px, py]); }
      if (b === 'cripta') { x.strokeStyle = 'rgba(255,100,20,0.35)'; x.lineWidth = 7; x.beginPath(); cp.forEach(function (p, n) { n ? x.lineTo(p[0], p[1]) : x.moveTo(p[0], p[1]); }); x.stroke(); }
      x.strokeStyle = P.out; x.lineWidth = 2.6; x.beginPath(); cp.forEach(function (p, n) { n ? x.lineTo(p[0], p[1]) : x.moveTo(p[0], p[1]); }); x.stroke();
    }
    // resplandor calido/frio del borde
    var edgeCol = b === 'bosque' ? 'rgba(10,20,50,0.5)' : (b === 'cripta' ? 'rgba(255,90,20,0.30)' : 'rgba(90,255,150,0.18)');
    for (i = 1; i <= 9; i++) { x.strokeStyle = edgeCol; x.lineWidth = i * 14; x.globalAlpha = 0.16; x.beginPath(); plat(x); x.stroke(); } x.globalAlpha = 1;
    x.restore();
    // borde de piedra de la plataforma
    x.strokeStyle = P.out; x.lineWidth = 14; x.beginPath(); plat(x); x.stroke();
    x.strokeStyle = b === 'cripta' ? '#6a4a5e' : (b === 'bosque' ? '#7f87a0' : '#4a8a7c'); x.lineWidth = 7; x.beginPath(); plat(x); x.stroke();
    x.strokeStyle = 'rgba(255,255,255,0.22)'; x.lineWidth = 2; x.save(); x.translate(-1.5, -1.5); x.beginPath(); plat(x); x.stroke(); x.restore();
    if (b === 'asfodelo') { // greca verde brillante a lo largo del borde
      glow(x, P.accG, 8, function () { x.strokeStyle = P.acc; x.lineWidth = 1.6; x.setLineDash([10, 5, 3, 5]); x.save(); x.scale(0.985, 0.975); x.translate(cx * 0.015 / 0.985, cy * 0.025 / 0.975); x.beginPath(); plat(x); x.stroke(); x.restore(); x.setLineDash([]); });
    }
    // musgo que rebosa el borde (bosque)
    if (b === 'bosque') for (i = 0; i < 70; i++) { var q = pts[(rr() * pts.length) | 0]; v.lw = 2; v.part(Pblob(q[0] + R(-8, 8), q[1] + R(-8, 8), R(10, 26), R(6, 13), i + 40, 0.15, 9), P.moss, { sh: P.mossS, hi: P.mossH, so: 2 }); }
    // ---------- 3. circulo ritual central
    var RR = Math.min(200, ry * 0.52);
    ritual(x, cx, cy, RR, b);
    // velas (bosque) alrededor del anillo
    if (b === 'bosque') {
      for (i = 0; i < 12; i++) {
        var ca = i / 12 * 6.2832 + 0.26, ex = cx + Math.cos(ca) * RR * 1.2, ey = cy + Math.sin(ca) * RR * 1.2 * 0.98 + 10;
        var gl = x.createRadialGradient(ex, ey - 22, 0, ex, ey - 22, 60); gl.addColorStop(0, 'rgba(255,170,70,0.28)'); gl.addColorStop(1, 'rgba(255,170,70,0)'); x.fillStyle = gl; x.fillRect(ex - 60, ey - 82, 120, 120);
        sprite('candle', ex, ey, 1.35); torches.push({ x: ex, y: ey, o: { candle: true, scale: 0.6, lightScale: 1.8 } });
      }
    }
    // ---------- 4. decoracion enmarcando el combate
    function onEdge(n, sc, count, dmin, dmax, ymin, ymax) {
      for (var t = 0, tries = 0; t < count && tries < count * 40; tries++) {
        var px2 = R(wall + 30, w - wall - 30), py2 = R(ymin == null ? wall + 20 : ymin, ymax == null ? h - wall : ymax), dd = dnorm(px2, py2);
        if (dd < dmin || dd > dmax) continue;
        if (Math.hypot(px2 - cx, py2 - cy) < RR * 1.45) continue;
        sprite(Array.isArray(n) ? n[(rr() * n.length) | 0] : n, px2, py2, sc); t++;
      }
    }
    var dec = [];
    if (b === 'bosque') {
      // ruinas con columnas con hiedra + lapidas con simbolo rojo
      [[0.09, 0.2], [0.91, 0.2], [0.28, 0.12], [0.72, 0.12], [0.06, 0.62], [0.94, 0.62]].forEach(function (p) { dec.push(['column', w * p[0], h * p[1] + 70, 1.15]); });
      [[0.18, 0.3], [0.82, 0.3], [0.42, 0.1], [0.6, 0.1], [0.12, 0.8], [0.88, 0.8], [0.3, 0.9], [0.7, 0.9]].forEach(function (p) { dec.push(['grave', w * p[0], h * p[1] + 20, 1.6]); });
      [[0.36, 0.1], [0.5, 0.1], [0.2, 0.9], [0.6, 0.92]].forEach(function (p) { dec.push([rr() < 0.5 ? 'edge0' : 'edge1', w * p[0], h * p[1] + 20, 1.5]); });
    } else if (b === 'cripta') {
      for (i = 0; i < 9; i++) dec.push(['grave', w * (0.08 + i * 0.105) + R(-12, 12), 110 + R(-10, 14) + (i % 2) * 18, 1.9]);  // muro de lapidas al fondo
      [[0.05, 0.3], [0.95, 0.3], [0.5, 0.075]].forEach(function (p) { dec.push(['column', w * p[0], h * p[1] + 80, 1.35]); });
      for (i = 0; i < 6; i++) dec.push(['edge' + (i % 2), w * (0.08 + i * 0.17) + R(-20, 20), h - 18 + R(-6, 10), 1.9]);       // costillas gigantes abajo
      for (i = 0; i < 3; i++) { dec.push(['edge' + (i % 2), 70 + R(-6, 6), h * (0.4 + i * 0.22), 1.6]); dec.push(['edge' + (i % 2), w - 70 + R(-6, 6), h * (0.4 + i * 0.22), 1.6]); }
      for (i = 0; i < 6; i++) dec.push(['stump0', w * (0.14 + i * 0.145), 142 + R(-8, 8), 1.7]);          // urnas
    } else {
      [[0.06, 0.18], [0.94, 0.18], [0.3, 0.1], [0.7, 0.1], [0.05, 0.7], [0.95, 0.7], [0.5, 0.08]].forEach(function (p) { dec.push(['column', w * p[0], h * p[1] + 80, 1.3]); });
      for (i = 0; i < 6; i++) dec.push(['edge' + (i % 2), w * (0.1 + i * 0.16), h - 18, 1.8]);
      for (i = 0; i < 6; i++) dec.push(['stump0', w * (0.16 + i * 0.13), 150 + R(-6, 6), 1.6]);
    }
    dec.sort(function (a, c2) { return a[2] - c2[2]; });
    dec.forEach(function (d) { sprite(d[0], d[1], d[2], d[3]); });
    // hierba alta oscura en los bordes (bosque y asfodelo), conos y costillas (cripta)
    if (b === 'bosque' || b === 'asfodelo') {
      var gb = [];
      for (i = 0, k = 0; i < 4000 && k < (b === 'bosque' ? 330 : 190); i++) { var gx2 = R(0, w), gy2 = R(0, h), d2 = dnorm(gx2, gy2); if (d2 < 0.9 || (d2 < 0.98 && rr() < 0.5)) continue; gb.push([gx2, gy2]); k++; }
      gb.sort(function (a, c2) { return a[1] - c2[1]; });
      gb.forEach(function (p) { var s = Assets.sprite('bush' + ((rr() * 2) | 0)); x.save(); x.imageSmoothingEnabled = true; x.drawImage(s, p[0] - s.width * 0.8, p[1] - s.height * 1.6, s.width * 1.6, s.height * 1.6); x.restore(); });
    } else { onEdge(['bush0', 'bush1'], 1.5, 16, 0.86, 1.2); }
    // decoracion pequena de suelo (rocas, huesos, setas...) fuera del circulo
    Assets.decorate(x, w, h, { seed: o.seed || 777, wall: wall, torches: 0, density: 0.85, avoid: [{ x: cx, y: cy, r: RR * 1.5 }] });
    // antorchas altas con llama animada (cripta / asfodelo)
    if (b !== 'bosque') {
      [[0.17, 0.2], [0.83, 0.2], [0.12, 0.62], [0.88, 0.62], [0.33, 0.84], [0.67, 0.84], [0.35, 0.12], [0.65, 0.12]].forEach(function (p) {
        var tx = Math.round(w * p[0]), ty = Math.round(h * p[1]) + 20; sprite('torch', tx, ty, 1.6); torches.push({ x: tx, y: ty, o: { scale: 1.6, lightScale: 4.6, big: true } });
      });
    }
    // ---------- 5. oscurecimiento exterior (azul/morado muy oscuro)
    x.save(); x.translate(cx, cy); x.scale(1, h / w);
    var tint = BIOME_INFO[b].vignette, vg = x.createRadialGradient(0, 0, w * 0.34, 0, 0, w * 0.64);
    vg.addColorStop(0, 'rgba(' + tint + ',0)'); vg.addColorStop(0.7, 'rgba(' + tint + ',' + (b === 'bosque' ? 0.55 : 0.42) + ')'); vg.addColorStop(1, 'rgba(' + tint + ',' + (b === 'bosque' ? 0.9 : 0.7) + ')');
    x.fillStyle = vg; x.fillRect(-w, -w, w * 2, w * 2); x.restore();
    return { canvas: c, torches: torches, ritual: { x: cx, y: cy, r: RR } };
  };

  // ---------- luciernagas / brasas flotantes (en coordenadas del mundo; o.view = camara para recortar)
  var ffSpr = {};
  function ffSprite(col) {
    if (ffSpr[col]) return ffSpr[col];
    var c = mkCanvas(24, 24), x = c.getContext('2d'), g = x.createRadialGradient(12, 12, 0, 12, 12, 12);
    g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(0.18, col); g.addColorStop(1, 'rgba(0,0,0,0)');
    x.fillStyle = g; x.fillRect(0, 0, 24, 24); ffSpr[col] = c; return c;
  }
  Assets.drawFireflies = function (ctx2, w, h, tMs, o) {
    o = o || {};
    var n = o.count || 90, t = (tMs || 0) / 1000, cols = { bosque: ['rgba(214,255,120,0.9)', 'rgba(255,250,220,0.9)', 'rgba(150,255,200,0.9)'], cripta: ['rgba(255,150,40,0.9)', 'rgba(255,210,80,0.9)'], asfodelo: ['rgba(140,255,170,0.9)', 'rgba(210,255,190,0.9)'] }[curBiome], i;
    var vw = o.view || { x: 0, y: 0, w: w, h: h };
    ctx2.save(); ctx2.globalCompositeOperation = 'lighter'; ctx2.imageSmoothingEnabled = true;
    for (i = 0; i < n; i++) {
      var h1 = Math.sin(i * 12.9898) * 43758.5453; h1 -= Math.floor(h1); var h2 = Math.sin(i * 78.233 + 1.7) * 24634.6345; h2 -= Math.floor(h2);
      var px = h1 * w, py = h2 * h, sp = 0.4 + h1 * 0.8;
      if (curBiome === 'bosque') { px += Math.sin(t * 0.5 * sp + i) * 46; py += Math.cos(t * 0.37 * sp + i * 2) * 32; }
      else { px += Math.sin(t * 0.6 * sp + i) * 22; py = ((py - t * (14 + h1 * 22)) % h + h) % h; }
      if (px < vw.x - 20 || px > vw.x + vw.w + 20 || py < vw.y - 20 || py > vw.y + vw.h + 20) continue;
      var al = 0.35 + 0.65 * (0.5 + 0.5 * Math.sin(t * (1.2 + h2 * 2.4) + i * 3.1)), sz = (curBiome === 'bosque' ? 9 : 7) + h2 * 5;
      ctx2.globalAlpha = al; ctx2.drawImage(ffSprite(cols[i % cols.length]), px - sz / 2, py - sz / 2, sz, sz);
    }
    ctx2.restore();
  };
  // pulso rojo/naranja/verde sobre el circulo ritual (aditivo)
  Assets.drawRitualGlow = function (ctx2, x, y, tMs, r) {
    var t = (tMs || 0) / 1000, k = 0.5 + 0.5 * Math.sin(t * 2.2), col = { bosque: '255,40,60', cripta: '255,110,30', asfodelo: '110,255,80' }[curBiome];
    r = r || 190;
    ctx2.save(); ctx2.globalCompositeOperation = 'lighter';
    var g = ctx2.createRadialGradient(x, y, r * 0.15, x, y, r * (1.05 + 0.05 * k));
    g.addColorStop(0, 'rgba(' + col + ',' + (0.07 + 0.07 * k).toFixed(3) + ')'); g.addColorStop(0.55, 'rgba(' + col + ',' + (0.03 + 0.03 * k).toFixed(3) + ')'); g.addColorStop(1, 'rgba(' + col + ',0)');
    ctx2.fillStyle = g; ctx2.fillRect(x - r * 1.4, y - r * 1.4, r * 2.8, r * 2.8);
    ctx2.restore();
  };


  // ================================================================== AUDIO
  var ctx = null, chain = null, M;
  var vol = { master: 0.8, sfx: 0.9, music: 0.45 }, muted = false;

  function mkNoise(c) {
    var len = c.sampleRate, b = c.createBuffer(1, len, c.sampleRate), d = b.getChannelData(0);
    for (var i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    return b;
  }
  // Reverb de convolucion simple (impulso de ruido con caida exponencial y oscurecido), compartida por SFX y musica
  function mkImpulse(c) {
    var sr = c.sampleRate, len = Math.floor(sr * 1.5), b = c.createBuffer(2, len, sr);
    for (var ch = 0; ch < 2; ch++) {
      var d = b.getChannelData(ch), lp = 0;
      for (var i = 0; i < len; i++) { lp += ((Math.random() * 2 - 1) * Math.pow(1 - i / len, 2.6) - lp) * (0.55 - 0.4 * i / len); d[i] = lp * 1.6; }
    }
    return b;
  }
  // Cadena comun: sfx/music -> master -> compresor -> salida ; reverb (sfx/mus) -> master
  function mkChain(c, dest) {
    var k = { c: c, noise: mkNoise(c) };
    k.master = c.createGain(); k.comp = c.createDynamicsCompressor(); k.sfx = c.createGain(); k.music = c.createGain();
    k.conv = c.createConvolver(); k.conv.buffer = mkImpulse(c);
    k.wet = c.createGain(); k.wet.gain.value = 0.55; k.revSfx = c.createGain(); k.revMus = c.createGain();
    k.revSfx.connect(k.conv); k.revMus.connect(k.conv); k.conv.connect(k.wet); k.wet.connect(k.master);
    k.sfx.connect(k.master); k.music.connect(k.master); k.master.connect(k.comp); k.comp.connect(dest);
    return k;
  }
  function ensureCtx() {
    if (ctx) return ctx;
    var AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
    chain = mkChain(ctx, ctx.destination);
    M.layers = {};
    ['pad', 'bass', 'perc', 'arp', 'melody'].forEach(function (n) { var g = ctx.createGain(); g.gain.value = 0; g.connect(chain.music); M.layers[n] = g; });
    applyVol(); applyLayers(true);
    return ctx;
  }
  function applyVol() {
    if (!ctx) return;
    chain.master.gain.value = muted ? 0 : vol.master;
    chain.sfx.gain.value = vol.sfx;
    chain.revSfx.gain.value = vol.sfx;
    chain.revMus.gain.value = vol.music;
    if (!M.fading) chain.music.gain.value = vol.music;
  }
  var distCurve = null;
  function dist() {
    if (distCurve) return distCurve;
    var n = 256, c = new Float32Array(n);
    for (var i = 0; i < n; i++) { var x = i * 2 / n - 1; c[i] = Math.tanh(x * 4); }
    return (distCurve = c);
  }

  // Emite una capa (oscilador o ruido) con envolvente.
  // L: {t,f:[a,b],n,d,v,a,sus,flt:{t,f:[a,b],q},vib:[hz,cents],dist, rev (envio a reverb 0..1)}
  function emit(L, st, pitch, vmul, c, noise, dest, rev, wet) {
    var d = L.d, end = st + d, g = c.createGain(), a = L.a == null ? 0.003 : L.a, pk = (L.v == null ? 0.5 : L.v) * vmul, src, node;
    g.gain.setValueAtTime(0.0001, st);
    g.gain.linearRampToValueAtTime(Math.max(pk, 0.0002), st + a);
    if (L.sus) g.gain.setValueAtTime(Math.max(pk, 0.0002), st + d * L.sus);
    g.gain.exponentialRampToValueAtTime(0.0001, end);
    if (L.n) {
      src = c.createBufferSource(); src.buffer = noise; src.loop = true;
      src.start(st, Math.random() * 0.4);
    } else {
      src = c.createOscillator(); src.type = L.t || 'square';
      src.frequency.setValueAtTime(L.f[0] * pitch, st);
      if (L.f[1] != null && L.f[1] !== L.f[0]) src.frequency.exponentialRampToValueAtTime(Math.max(18, L.f[1] * pitch), end);
      if (L.vib) {
        var lfo = c.createOscillator(), lg = c.createGain();
        lfo.frequency.value = L.vib[0]; lg.gain.value = L.vib[1];
        lfo.connect(lg); lg.connect(src.detune); lfo.start(st); lfo.stop(end + 0.05);
      }
      src.start(st);
    }
    node = src;
    if (L.flt) {
      var bq = c.createBiquadFilter(); bq.type = L.flt.t; bq.Q.value = L.flt.q || 1;
      bq.frequency.setValueAtTime(L.flt.f[0], st);
      if (L.flt.f[1] && L.flt.f[1] !== L.flt.f[0]) bq.frequency.exponentialRampToValueAtTime(L.flt.f[1], end);
      node.connect(bq); node = bq;
    }
    if (L.dist) { var ws = c.createWaveShaper(); ws.curve = dist(); node.connect(ws); node = ws; }
    node.connect(g); g.connect(dest);
    var w = L.rev != null ? L.rev : wet;
    if (w > 0 && rev) { var sd = c.createGain(); sd.gain.value = w; g.connect(sd); sd.connect(rev); }
    src.stop(end + 0.03);
  }

  // --- constructores de capas (golpe grave + chasquido + ruido filtrado = mas cuerpo)
  function thump(f0, f1, d, v, o) { return ext({ t: 'sine', f: [f0, f1], d: d, v: v, a: 0.002 }, o); }
  function snap(d, v, hp, o) { return ext({ n: 1, d: d, v: v, a: 0.001, flt: { t: 'highpass', f: [hp, hp * 1.5] } }, o); }
  function nz(d, v, type, f0, f1, q, o) { return ext({ n: 1, d: d, v: v, flt: { t: type, f: [f0, f1], q: q || 1 } }, o); }
  function osc(t, f0, f1, d, v, o) { return ext({ t: t, f: [f0, f1], d: d, v: v }, o); }
  function ext(L, o) { if (o) for (var k in o) L[k] = o[k]; return L; }
  function arp(notes, step, dur, t, v) {
    return notes.map(function (f, i) { return { t: t || 'square', f: [f, f], d: dur, v: v || 0.3, delay: i * step }; });
  }
  function S(rev, layers) { layers.rev = rev; return layers; }

  var SFX = {
    hit: S(0.12, [thump(180, 50, 0.12, 0.65), snap(0.035, 0.5, 3200), nz(0.09, 0.3, 'bandpass', 2600, 700, 1.4), osc('square', 300, 110, 0.07, 0.2)]),
    hit_1: S(0.1, [thump(190, 55, 0.1, 0.55), snap(0.03, 0.45, 3600), nz(0.08, 0.28, 'bandpass', 3000, 900, 1.4), osc('square', 320, 120, 0.06, 0.18)]),
    hit_2: S(0.12, [thump(170, 48, 0.13, 0.65), snap(0.035, 0.5, 3000), nz(0.1, 0.32, 'bandpass', 2400, 600, 1.4), osc('square', 280, 100, 0.08, 0.22), osc('triangle', 900, 700, 0.1, 0.08)]),
    hit_3: S(0.2, [thump(140, 38, 0.22, 0.85), snap(0.05, 0.6, 2600), nz(0.16, 0.45, 'lowpass', 4000, 300, 1), osc('square', 200, 70, 0.14, 0.32), osc('triangle', 820, 560, 0.16, 0.14, { delay: 0.005 })]),
    hit_heavy: S(0.28, [thump(130, 30, 0.45, 1), nz(0.3, 0.7, 'lowpass', 4000, 150, 1), osc('square', 100, 40, 0.2, 0.4), snap(0.05, 0.6, 2500),
      osc('triangle', 700, 480, 0.18, 0.14, { delay: 0.01 }), nz(0.5, 0.22, 'bandpass', 500, 120, 0.8, { delay: 0.05 })]),
    whoosh: S(0.1, [nz(0.2, 0.32, 'bandpass', 500, 2600, 1.5, { a: 0.07 }), osc('sine', 400, 900, 0.15, 0.07)]),
    roll: S(0.1, [nz(0.26, 0.42, 'bandpass', 350, 1900, 1.2, { a: 0.06 }), nz(0.06, 0.2, 'highpass', 3000, 3000, 1, { delay: 0.17 }), thump(95, 60, 0.1, 0.2, { delay: 0.02 })]),
    hurt: S(0.2, [osc('sawtooth', 420, 100, 0.3, 0.42, { vib: [30, 60] }), nz(0.12, 0.4, 'lowpass', 2500, 400), osc('square', 200, 60, 0.2, 0.3), thump(120, 42, 0.2, 0.7), snap(0.03, 0.3, 2800)]),
    enemy_die: S(0.22, [osc('square', 340, 50, 0.32, 0.32, { vib: [18, 120] }), nz(0.3, 0.5, 'lowpass', 2800, 150), thump(100, 32, 0.28, 0.65), snap(0.04, 0.3, 3000), nz(0.18, 0.18, 'highpass', 5000, 6500, 1, { delay: 0.06 })]),
    pickup: S(0.3, arp([660, 880, 1320], 0.06, 0.12, 'square', 0.25).concat([osc('triangle', 1760, 1760, 0.3, 0.25, { delay: 0.18 }), osc('sine', 3520, 3520, 0.25, 0.08, { delay: 0.18 })])),
    card_select: S(0.25, [osc('triangle', 440, 880, 0.09, 0.45), osc('square', 660, 990, 0.1, 0.16, { delay: 0.05 }), osc('triangle', 1320, 1320, 0.22, 0.32, { delay: 0.09 }), nz(0.03, 0.15, 'highpass', 6000, 6000), thump(110, 70, 0.1, 0.3)]),
    special: S(0.5, [nz(0.6, 0.8, 'lowpass', 200, 5000, 2, { a: 0.05 }), osc('sawtooth', 70, 420, 0.5, 0.4, { a: 0.1, dist: 1 }),
      thump(90, 30, 0.7, 0.95, { delay: 0.16 }), nz(0.5, 0.5, 'bandpass', 900, 200, 0.8, { delay: 0.16 }), snap(0.06, 0.5, 3000, { delay: 0.16 })]),
    shockwave: S(0.45, [thump(100, 26, 0.65, 1, { delay: 0.02 }), nz(0.5, 0.55, 'lowpass', 2500, 100, 1), osc('sawtooth', 200, 40, 0.4, 0.28, { dist: 1 }), snap(0.05, 0.6, 2800), nz(0.45, 0.2, 'bandpass', 1500, 300, 1, { delay: 0.05 })]),
    flame: S(0.3, [nz(0.5, 0.4, 'bandpass', 800, 3000, 1, { a: 0.15 }), osc('sawtooth', 90, 180, 0.4, 0.13, { a: 0.1 }), nz(0.12, 0.2, 'highpass', 4000, 6000, 1, { delay: 0.2 })]),
    boss_roar: S(0.5, [osc('sawtooth', 95, 48, 1.1, 0.55, { a: 0.08, sus: 0.5, vib: [22, 160], dist: 1 }), osc('square', 48, 36, 1.2, 0.5, { a: 0.1 }),
      nz(1.0, 0.5, 'lowpass', 900, 150, 3, { a: 0.1 }), osc('sawtooth', 140, 60, 0.8, 0.22, { delay: 0.1, vib: [35, 200], dist: 1 }), thump(70, 30, 0.8, 0.7)]),
    boss_die: S(0.6, [osc('sawtooth', 120, 30, 1.6, 0.5, { a: 0.05, vib: [14, 200], dist: 1 }), nz(1.4, 0.6, 'lowpass', 3000, 100, 2), thump(80, 24, 1.2, 1), nz(0.8, 0.35, 'bandpass', 2000, 300, 1, { delay: 0.3 })]),
    wave_start: S(0.35, arp([220, 220, 330, 440], 0.1, 0.16, 'square', 0.3).concat([
      osc('sawtooth', 110, 110, 0.7, 0.33, { a: 0.02 }), osc('sawtooth', 165, 165, 0.7, 0.23, { a: 0.02 }), thump(80, 40, 0.5, 0.7), nz(0.15, 0.2, 'highpass', 4000, 4000, 1, { delay: 0.4 })])),
    shoot: S(0.15, [osc('square', 900, 300, 0.12, 0.22), nz(0.1, 0.25, 'bandpass', 2500, 900, 2), thump(220, 90, 0.08, 0.3), snap(0.02, 0.25, 4000)]),
    explosion: S(0.4, [nz(0.6, 0.85, 'lowpass', 3500, 120), thump(110, 26, 0.6, 0.95), osc('sawtooth', 90, 30, 0.45, 0.3, { dist: 1 }), snap(0.05, 0.6, 2500), nz(0.5, 0.3, 'bandpass', 700, 150, 1, { delay: 0.08 })]),
    game_over: S(0.5, arp([330, 262, 220, 165], 0.22, 0.4, 'triangle', 0.4).concat([thump(80, 36, 1.0, 0.6, { delay: 0.7 }), osc('sawtooth', 82, 55, 1.2, 0.18, { delay: 0.7, a: 0.1 })])),
    step: S(0.04, [thump(120, 70, 0.05, 0.25), nz(0.04, 0.12, 'bandpass', 1200, 600, 1)])
  };
  function sfxDuration(def) { var m = 0; def.forEach(function (L) { m = Math.max(m, (L.delay || 0) + L.d); }); return m; }

  Assets.sfx = function (name, o) {
    o = o || {};
    if (!ctx || ctx.state !== 'running' || muted) return false;
    var def = SFX[name];
    if (!def) { if (window.console) console.warn('Assets.sfx: desconocido "' + name + '"'); return false; }
    var vary = o.vary == null ? 0.07 : o.vary;                       // variacion aleatoria de pitch por llamada
    var t0 = ctx.currentTime + 0.005, pitch = (o.pitch || 1) * (1 + (Math.random() * 2 - 1) * vary), vm = o.vol == null ? 1 : o.vol;
    for (var i = 0; i < def.length; i++) emit(def[i], t0 + (def[i].delay || 0), pitch, vm * (1 + (Math.random() - 0.5) * 0.16), ctx, chain.noise, chain.sfx, chain.revSfx, def.rev || 0);
    return true;
  };
  Assets.sfxNames = function () { return Object.keys(SFX); };

  // ---------------------------------------------------------------- Musica procedural en capas
  // Capas: pad, bass, perc (bombo+caja+charles), arp, melody. intensity 0..1 las activa progresivamente.
  // Pistas: 'normal' (La menor, 108 BPM) y 'boss' (Re menor, 142 BPM, bombo doble, cromatismos).
  var SC_LAYERS = { pad: [0, 0.02], bass: [0, 0.08], perc: [0.18, 0.38], arp: [0.42, 0.62], melody: [0.66, 0.86] };
  var LAYER_VOL = { pad: 1, bass: 1, perc: 1, arp: 1, melody: 1 };
  var TRACKS = {
    normal: {
      bpm: 108,
      prog: [[45, [0, 3, 7]], [45, [0, 3, 7]], [41, [0, 4, 7]], [40, [0, 4, 7]], [45, [0, 3, 7]], [38, [0, 3, 7]], [41, [0, 4, 7]], [40, [0, 4, 7]]],
      melBase: 69,
      mel: [[[0, 0, 6], [6, 3, 2], [8, 7, 8]], [[0, 5, 4], [4, 3, 4], [8, 0, 8]], [[0, 3, 6], [6, 0, 2], [8, -4, 8]], [[0, 2, 4], [4, -1, 4], [8, -5, 6], [14, -1, 2]],
        [[0, 7, 6], [6, 5, 2], [8, 3, 4], [12, 0, 4]], [[0, 5, 4], [4, 8, 4], [8, 5, 4], [12, 0, 4]], [[0, 8, 6], [6, 7, 2], [8, 3, 8]], [[0, 7, 4], [4, 2, 4], [8, -1, 4], [12, 2, 2], [14, -1, 2]]]
    },
    boss: {
      bpm: 142,
      prog: [[38, [0, 3, 7]], [34, [0, 4, 7]], [33, [0, 4, 7]], [38, [0, 3, 7]], [38, [0, 3, 7]], [31, [0, 3, 7]], [34, [0, 4, 7]], [37, [0, 4, 7]]],
      melBase: 62,
      mel: [[[0, 7, 2], [2, 8, 2], [4, 7, 2], [6, 3, 2], [8, 0, 8]], [[0, 12, 4], [4, 8, 4], [8, 3, 4], [12, 8, 4]], [[0, 11, 4], [4, 14, 4], [8, 11, 2], [10, 7, 2], [12, 11, 4]],
        [[0, 12, 2], [2, 10, 2], [4, 8, 2], [6, 7, 2], [8, 3, 8]], [[0, 7, 2], [2, 8, 2], [4, 7, 2], [6, 3, 2], [8, 7, 4], [12, 10, 4]], [[0, 12, 4], [4, 8, 4], [8, 5, 4], [12, 8, 4]],
        [[0, 15, 4], [4, 12, 4], [8, 8, 4], [12, 12, 4]], [[0, 13, 2], [2, 12, 2], [4, 13, 2], [6, 12, 2], [8, 7, 4], [12, 8, 2], [14, 7, 2]]]
    }
  };
  M = { playing: false, pending: false, timer: null, step: 0, next: 0, intensity: 0, fading: false, track: 'normal', layers: null, tgt: {} };
  function mtof(m) { return 440 * Math.pow(2, (m - 69) / 12); }
  function sstep(a, b, x) { var t = Math.max(0, Math.min(1, (x - a) / (b - a || 1))); return t * t * (3 - 2 * t); }
  function effInt(inten, trk) { return trk === 'boss' ? Math.max(inten, 0.9) : inten; }
  function layerLevel(n, inten, trk) { return sstep(SC_LAYERS[n][0], SC_LAYERS[n][1], effInt(inten, trk)) * LAYER_VOL[n]; }
  function applyLayers(instant) {
    if (!ctx || !M.layers) return;
    for (var n in M.layers) {
      var v = layerLevel(n, M.intensity, M.track); M.tgt[n] = v;
      if (instant) M.layers[n].gain.setValueAtTime(v, ctx.currentTime);
      else M.layers[n].gain.setTargetAtTime(v, ctx.currentTime, 0.35);
    }
  }

  // V: {mv(layer, L, t, wet), on(layer)->bool}. Devuelve la duracion del paso (s).
  function playStep(step, t, tr, V) {
    var T = TRACKS[tr], boss = tr === 'boss', bar = Math.floor(step / 16) % T.prog.length, s = step % 16, ch = T.prog[bar], root = ch[0], tri = ch[1];
    var spb = 60 / T.bpm / 4, i;
    // --- pad: acorde oscuro sostenido (+ quinta desafinada y voz "coral" en el jefe)
    if (s === 0 && V.on('pad')) {
      for (i = 0; i < 3; i++) V.mv('pad', { t: 'sawtooth', f: [mtof(root + 12 + tri[i]), mtof(root + 12 + tri[i])], d: spb * 16, v: boss ? 0.045 : 0.035, a: 0.25, sus: 0.7, flt: { t: 'lowpass', f: [700, 500], q: 2 } }, t, 0.35);
      V.mv('pad', { t: 'sine', f: [mtof(root), mtof(root)], d: spb * 16, v: 0.09, a: 0.3, sus: 0.8 }, t, 0.2);
      if (boss) V.mv('pad', { t: 'triangle', f: [mtof(root + 24 + tri[1]), mtof(root + 24 + tri[1]) * 1.01], d: spb * 16, v: 0.05, a: 0.4, sus: 0.7, vib: [5, 25] }, t, 0.5);
    }
    // --- bajo
    if (V.on('bass')) {
      if (!boss && s % 2 === 0) {
        var bn = root + ((s === 6 || s === 14) ? 12 : 0) + (s === 10 && bar % 2 ? 7 : 0);
        V.mv('bass', { t: 'sawtooth', f: [mtof(bn), mtof(bn) * 0.99], d: spb * 1.8, v: 0.20, a: 0.004, flt: { t: 'lowpass', f: [500, 220], q: 4 } }, t, 0);
        V.mv('bass', { t: 'sine', f: [mtof(bn - 12), mtof(bn - 12)], d: spb * 1.8, v: 0.25, a: 0.004 }, t, 0);
      } else if (boss) { // galope de semicorcheas con octavas
        var bb = root + ((s % 8 === 6) ? 12 : 0) + (s === 11 ? 7 : 0) + (s === 15 && bar % 2 ? 1 : 0);
        V.mv('bass', { t: 'sawtooth', f: [mtof(bb), mtof(bb) * 0.985], d: spb * 0.9, v: s % 4 === 0 ? 0.22 : 0.14, a: 0.003, flt: { t: 'lowpass', f: [s % 4 === 0 ? 900 : 520, 200], q: 5 }, dist: s % 4 === 0 ? 1 : 0 }, t, 0);
        if (s % 4 === 0) V.mv('bass', { t: 'sine', f: [mtof(bb - 12), mtof(bb - 12)], d: spb * 3, v: 0.28, a: 0.004 }, t, 0);
      }
    }
    // --- percusion
    if (V.on('perc')) {
      var kicks = boss ? [0, 3, 4, 8, 11, 12, 14] : [0, 6, 8, 11];
      if (!boss && M.intensity > 0.75) kicks = [0, 4, 8, 12];
      if (kicks.indexOf(s) >= 0) { V.mv('perc', { t: 'sine', f: [150, 40], d: 0.18, v: 0.75, a: 0.001 }, t, 0); V.mv('perc', { n: 1, d: 0.02, v: 0.25, flt: { t: 'lowpass', f: [900, 900] } }, t, 0); }
      if (s === 4 || s === 12) {
        V.mv('perc', { n: 1, d: 0.16, v: 0.34, flt: { t: 'bandpass', f: [1900, 1400], q: 0.8 } }, t, 0.2);
        V.mv('perc', { t: 'triangle', f: [220, 130], d: 0.1, v: 0.3 }, t, 0.2);
      } else if ((boss || M.intensity > 0.7) && (s === 7 || s === 15)) V.mv('perc', { n: 1, d: 0.06, v: 0.16, flt: { t: 'bandpass', f: [1900, 1900], q: 1 } }, t, 0);
      if (s % 2 === 0 || boss) V.mv('perc', { n: 1, d: s === 14 ? 0.12 : 0.03, v: s % 4 === 2 ? 0.1 : 0.06, flt: { t: 'highpass', f: [7500, 7500] } }, t, 0);
      if (bar % 4 === 3 && s >= 12) V.mv('perc', { t: 'sine', f: [mtof(root + 12 + (s - 12) * -3 + 7), mtof(root - 5 + (s - 12) * -3)], d: 0.22, v: 0.5 }, t, 0.2);
    }
    // --- arpegio
    if (V.on('arp') && !(bar % 4 === 3 && s >= 12)) {
      var pat = boss ? [0, 1, 2, 1, 0, 1, 2, 1, 0, 2, 1, 2, 0, 1, 2, 2] : [0, 2, 1, 2, 0, 2, 1, 2, 0, 1, 2, 1, 0, 2, 1, 2];
      var an = root + 24 + tri[pat[s]] + ((boss || M.intensity > 0.8) && s % 4 === 3 ? 12 : 0);
      V.mv('arp', { t: s % 8 < 4 ? 'triangle' : 'square', f: [mtof(an), mtof(an)], d: spb * 1.3, v: bar < 2 ? 0.05 : 0.075, flt: { t: 'lowpass', f: [2600, 1200], q: 1 } }, t, 0.25);
    }
    // --- melodia (motivo de 8 compases sobre la progresion)
    if (V.on('melody')) {
      var notes = T.mel[bar % T.mel.length];
      for (i = 0; i < notes.length; i++) if (notes[i][0] === s) {
        var f = mtof(T.melBase + notes[i][1]), dd = spb * notes[i][2] * 0.95;
        V.mv('melody', { t: 'square', f: [f, f], d: dd, v: 0.07, a: 0.012, sus: 0.6, vib: [5.5, 14], flt: { t: 'lowpass', f: [2600, 1500], q: 1 } }, t, 0.4);
        V.mv('melody', { t: 'triangle', f: [f / 2, f / 2], d: dd, v: 0.09, a: 0.012, sus: 0.6 }, t, 0.3);
      }
    }
    return spb;
  }
  var liveV = {
    mv: function (layer, L, t, wet) { emit(L, t, 1, 1, ctx, chain.noise, M.layers[layer], chain.revMus, wet || 0); },
    on: function (layer) { return (M.tgt[layer] || 0) > 0.02; }
  };
  function sched() {
    if (!ctx) return;
    while (M.next < ctx.currentTime + 0.15) {
      var spb = playStep(M.step, M.next, M.track, liveV);
      M.next += spb; M.step++;
    }
  }
  Assets.music = {
    start: function () {
      if (!ctx || ctx.state !== 'running') { M.pending = true; return; }
      M.pending = false;
      if (M.playing) return;
      M.playing = true; M.fading = false; M.step = 0; M.next = ctx.currentTime + 0.08;
      applyLayers(true);
      chain.music.gain.cancelScheduledValues(ctx.currentTime);
      chain.music.gain.setValueAtTime(0.0001, ctx.currentTime);
      chain.music.gain.linearRampToValueAtTime(vol.music, ctx.currentTime + 0.4);
      M.timer = setInterval(sched, 30);
    },
    stop: function () {
      M.pending = false;
      if (!M.playing) return;
      M.playing = false; clearInterval(M.timer); M.timer = null;
      if (ctx) {
        M.fading = true;
        chain.music.gain.cancelScheduledValues(ctx.currentTime);
        chain.music.gain.setValueAtTime(chain.music.gain.value, ctx.currentTime);
        chain.music.gain.linearRampToValueAtTime(0.0001, ctx.currentTime + 0.25);
      }
    },
    // 0..1: activa capas progresivamente (pad+bajo -> percusion -> arpegio -> melodia). true/false = 1/0.
    setIntensity: function (v) { M.intensity = Math.max(0, Math.min(1, typeof v === 'boolean' ? (v ? 1 : 0) : (+v || 0))); applyLayers(false); },
    getIntensity: function () { return M.intensity; },
    // 'normal' | 'boss' (pista propia del jefe: Re menor, 142 BPM, todas las capas activas)
    setTrack: function (name) {
      if (!TRACKS[name] || M.track === name) return;
      M.track = name; M.step = 0;
      if (ctx && M.playing) M.next = Math.max(M.next, ctx.currentTime + 0.05);
      applyLayers(false);
    },
    getTrack: function () { return M.track; },
    tracks: function () { return Object.keys(TRACKS); },
    layers: function () { return Object.keys(SC_LAYERS); },
    isPlaying: function () { return M.playing; }
  };

  Assets.unlock = function () {
    var c = ensureCtx();
    if (!c) return Promise.resolve(false);
    var p = c.state === 'running' ? Promise.resolve() : c.resume();
    return p.then(function () {
      var ok = c.state === 'running';
      if (ok && M.pending) Assets.music.start();
      return ok;
    }, function () { return false; });
  };
  Assets.isUnlocked = function () { return !!ctx && ctx.state === 'running'; };
  Assets.setVolume = function (v) { for (var k in v) if (k in vol) vol[k] = Math.max(0, Math.min(1, v[k])); applyVol(); };
  Assets.getVolume = function () { return { master: vol.master, sfx: vol.sfx, music: vol.music }; };
  Assets.setMuted = function (m) { muted = !!m; applyVol(); };

  // ---------------------------------------------------------------- Render offline (para exportar a WAV)
  function offline(seconds) {
    var OC = window.OfflineAudioContext || window.webkitOfflineAudioContext;
    if (!OC) return null;
    var sr = 44100, oc = new OC(2, Math.ceil(seconds * sr), sr), k = mkChain(oc, oc.destination);
    k.master.gain.value = 1; k.sfx.gain.value = 1; k.revSfx.gain.value = 1; k.revMus.gain.value = 1; k.music.gain.value = 0.9;
    return { oc: oc, k: k };
  }
  // -> Promise<AudioBuffer>. o: {pitch=1, vol=1, vary=0}
  Assets.renderSfx = function (name, o) {
    o = o || {};
    var def = SFX[name];
    if (!def) return Promise.reject(new Error('sfx desconocido: ' + name));
    var r = offline(sfxDuration(def) + 1.6);
    if (!r) return Promise.reject(new Error('OfflineAudioContext no disponible'));
    var pitch = (o.pitch || 1) * (1 + (Math.random() * 2 - 1) * (o.vary || 0)), vm = o.vol == null ? 1 : o.vol;
    for (var i = 0; i < def.length; i++) emit(def[i], 0.005 + (def[i].delay || 0), pitch, vm, r.oc, r.k.noise, r.k.sfx, r.k.revSfx, def.rev || 0);
    return r.oc.startRendering();
  };
  // Renderiza la musica: o: {bars=8, intensity=1, track='normal'|'boss'}
  Assets.renderMusic = function (o) {
    o = o || {};
    var tr = TRACKS[o.track] ? o.track : 'normal', T = TRACKS[tr], bars = o.bars || T.prog.length, inten = o.intensity == null ? 1 : o.intensity;
    var spb = 60 / T.bpm / 4, r = offline(bars * 16 * spb + 2.5);
    if (!r) return Promise.reject(new Error('OfflineAudioContext no disponible'));
    var lay = {}, saveI = M.intensity;
    Object.keys(SC_LAYERS).forEach(function (n) { var g = r.oc.createGain(); g.gain.value = layerLevel(n, inten, tr); g.connect(r.k.music); lay[n] = g; });
    M.intensity = inten;   // playStep consulta M.intensity para variaciones
    var V = { mv: function (layer, L, t, wet) { emit(L, t, 1, 1, r.oc, r.k.noise, lay[layer], r.k.revMus, wet || 0); }, on: function (layer) { return layerLevel(layer, inten, tr) > 0.02; } };
    for (var s = 0; s < bars * 16; s++) playStep(s, 0.05 + s * spb, tr, V);
    M.intensity = saveI;
    return r.oc.startRendering();
  };
  // AudioBuffer -> Blob WAV (PCM 16 bit)
  Assets.audioBufferToWav = function (buf) {
    var nc = buf.numberOfChannels, len = buf.length, sr = buf.sampleRate, bytes = 44 + len * nc * 2, ab = new ArrayBuffer(bytes), v = new DataView(ab), i, c, o = 0;
    function str(s) { for (var k = 0; k < s.length; k++) v.setUint8(o++, s.charCodeAt(k)); }
    str('RIFF'); v.setUint32(o, bytes - 8, true); o += 4; str('WAVEfmt '); v.setUint32(o, 16, true); o += 4; v.setUint16(o, 1, true); o += 2; v.setUint16(o, nc, true); o += 2;
    v.setUint32(o, sr, true); o += 4; v.setUint32(o, sr * nc * 2, true); o += 4; v.setUint16(o, nc * 2, true); o += 2; v.setUint16(o, 16, true); o += 2; str('data'); v.setUint32(o, len * nc * 2, true); o += 4;
    var ch = []; for (c = 0; c < nc; c++) ch.push(buf.getChannelData(c));
    for (i = 0; i < len; i++) for (c = 0; c < nc; c++) { var x = Math.max(-1, Math.min(1, ch[c][i])); v.setInt16(o, x < 0 ? x * 32768 : x * 32767, true); o += 2; }
    return new Blob([ab], { type: 'audio/wav' });
  };
  Assets.exportSfxWav = function (name, o) { return Assets.renderSfx(name, o).then(Assets.audioBufferToWav); };
  Assets.exportMusicWav = function (o) { return Assets.renderMusic(o).then(Assets.audioBufferToWav); };

  // Auto-desbloqueo con el primer gesto del usuario (el audio nunca arranca sin gesto).
  var evs = ['pointerdown', 'keydown', 'touchstart', 'mousedown'];
  function onGesture() {
    Assets.unlock().then(function (ok) {
      if (ok) evs.forEach(function (e) { window.removeEventListener(e, onGesture, true); });
    });
  }
  evs.forEach(function (e) { window.addEventListener(e, onGesture, true); });

  // Kit de dibujo para extensiones (src/assets_enemies2.js)
  Assets._h = { addV: addV, V: V, Pclosed: Pclosed, Ppoly: Ppoly, Pblob: Pblob, Prr: Prr, Pcirc: Pcirc, dyingFrames: dyingFrames, DIE_ANIM: DIE_ANIM, PH: PH, OLC: OLC, rrand: rrand, puff: puff, mkCanvas: mkCanvas };
  window.Assets = Assets;
})();
