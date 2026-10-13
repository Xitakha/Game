/*!
 * assets.js - Generador de recursos 100% originales para "Ember Flock" (survival-lamb).
 * Sin dependencias, sin ficheros externos: sprites pixel-art por codigo (canvas) y audio WebAudio.
 * Script clasico (sin modulos). Expone `window.Assets`. Licencia: propia/libre (ver studio/assets/ASSETS.md).
 * Documentacion completa (nombres, frames, animaciones, audio, biomas, VFX): games/survival-lamb/ASSETS_API.md
 *
 * Resumen: Assets.sprite(name, frame|'anim:n') | animFrame(name, anim, tMs) | list/info/frames | addToPhaser
 *          Assets.setBiome('bosque'|'cripta') | vignette | drawFog | drawTorch | decorate
 *          Assets.sfx(name,{pitch,vol,vary}) | music.start/stop/setIntensity(0..1)/setTrack('normal'|'boss')
 *          Assets.exportSfxWav / exportMusicWav (OfflineAudioContext)
 * Los personajes miran a la DERECHA. Todo sprite se dibuja a resolucion base y se escala x2 (nearest-neighbor).
 * Los frames ya existentes conservan su indice; las mejoras se anaden al final (los nuevos frames/anims/nombres son aditivos).
 */
(function () {
  'use strict';
  var SCALE = 2;
  var reg = {};          // sprites compartidos: name -> {w,h,frames:[canvas],anims}
  var order = [];
  var biomes = { bosque: {}, cripta: {} }, bnames = [], curBiome = 'bosque';

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

  // Paleta cohesiva: fondos violeta-negro, lana crema, acentos rojo/naranja (cultista tierno vs horror)
  var C = {
    ol: '#120c1a',
    wool: '#f5f0e8', woolS: '#c9bfd8', woolH: '#ffffff',
    face: '#6b5478', faceS: '#4a3a58', ear: '#e58fa0', eye: '#1a1224', nose: '#7a3b4e',
    cape: '#d1342c', capeD: '#8f1d28', capeH: '#f05a45',
    steel: '#dfe8f2', steelS: '#8fa0b8', gold: '#f0b238', goldS: '#b87a22',
    leg: '#3b2f48', hoof: '#221a2c',
    ember: '#ff8a2a', fire: '#ffc83d', hot: '#fff0a8'
  };

  // Genera frames de muerte a partir de una funcion de dibujo: destello -> caida/aplastado -> disolucion en brasas -> ceniza.
  // o: {rot:[...5 angulos], sy:[...], dis:[...5 umbrales de disolucion 0..1], ash:bool}
  function dyingFrames(srcDraw, w, h, srcOpt, o) {
    o = o || {};
    var n = 5, out = [];
    var sxs = o.sx || [1.12, 1.15, 1.2, 1.2, 1.1], sys = o.sy || [0.95, 0.78, 0.6, 0.45, 0.3];
    var rots = o.rot || [0, 0.05, 0.1, 0.12, 0.1], dis = o.dis || [0, 0.04, 0.3, 0.6, 0.9];
    var dy = o.dy || [0, 0, 0, 0, 0];
    function make(k) {
      return function (g) {
        var b = baseFrame(w, h, srcDraw, srcOpt);
        var t = mkCanvas(w, h), tx = t.getContext('2d', { willReadFrequently: true }), by = h - 2;
        tx.imageSmoothingEnabled = false; tx.translate(w / 2 + (o.dx ? o.dx[k] : 0), by + dy[k]); tx.rotate(rots[k]); tx.scale(sxs[k], sys[k]); tx.drawImage(b, -w / 2, -by);
        var im = tx.getImageData(0, 0, w, h), d = im.data, rr = rng(97 + k * 13 + w), x, y, i;
        var nz = rng(555 + w * 3 + h), noise = [];
        for (i = 0; i < w * h; i++) noise.push(nz());
        function A(a, bb) { return a < 0 || bb < 0 || a >= w || bb >= h ? 0 : d[(bb * w + a) * 4 + 3]; }
        var gone = [];
        for (y = 0; y < h; y++) for (x = 0; x < w; x++) {
          i = (y * w + x); var q = noise[i] * 0.72 + (1 - y / h) * 0.28;
          gone.push(q < dis[k] ? 1 : 0);
        }
        var res = new Uint8ClampedArray(d);
        for (y = 0; y < h; y++) for (x = 0; x < w; x++) {
          i = (y * w + x); var p = i * 4;
          if (d[p + 3] < 20) continue;
          if (gone[i]) { res[p + 3] = 0; continue; }
          // flash blanco al inicio, rojizo despues
          if (k === 0) { res[p] = d[p] + (255 - d[p]) * 0.6; res[p + 1] = d[p + 1] + (255 - d[p + 1]) * 0.6; res[p + 2] = d[p + 2] + (255 - d[p + 2]) * 0.6; }
          else if (k === 1) { res[p] = Math.min(255, d[p] * 1.1 + 60); res[p + 1] = d[p + 1] * 0.55; res[p + 2] = d[p + 2] * 0.55; }
          else if (k >= 3 && o.ash !== false) { var l = (d[p] + d[p + 1] + d[p + 2]) / 3; res[p] = l * 0.55 + 24; res[p + 1] = l * 0.5 + 20; res[p + 2] = l * 0.6 + 30; }
          // borde de disolucion: brasa naranja
          if (k >= 2) {
            var edge = false, nb = [[1, 0], [-1, 0], [0, 1], [0, -1]];
            for (var m = 0; m < 4; m++) { var nx = x + nb[m][0], ny = y + nb[m][1]; if (nx < 0 || ny < 0 || nx >= w || ny >= h || gone[ny * w + nx]) { edge = true; break; } }
            if (edge && A(x, y) > 100 && rr() < 0.55) { var cc = rr() < 0.5 ? [255, 138, 42] : [255, 200, 61]; res[p] = cc[0]; res[p + 1] = cc[1]; res[p + 2] = cc[2]; }
          }
        }
        im.data.set(res); tx.putImageData(im, 0, 0);
        // brasas que suben
        var ctx2 = tx; ctx2.fillStyle = '#ffc83d';
        if (k >= 2) for (i = 0; i < 3 + k * 2; i++) { ctx2.fillStyle = rr() < 0.5 ? '#ff8a2a' : '#ffc83d'; ctx2.fillRect((rr() * w) | 0, (h * 0.15 + rr() * h * (0.9 - k * 0.12)) | 0, 1, 1); }
        g.ctx.drawImage(t, 0, 0);
      };
    }
    for (var k = 0; k < n; k++) { var fn = make(k); fn.noPost = true; out.push(fn); }
    return out;
  }
  var DIE_OPT = { outline: false, shade: false };
  var DIE_ANIM = function (idx) { return { f: idx, fps: 9, loop: false }; };

  // ------------------------------------------------------------------ helpers de animacion
  var PH = []; for (var pk = 0; pk < 6; pk++) PH.push(pk * Math.PI / 3);   // 6 fases de caminar
  // Orden de fases en las animaciones: indices originales (fase 0 y fase 3 = frames 0/1 del ciclo antiguo)
  function walkSeq(f) { return f; }

  // ------------------------------------------------------------------ JUGADOR
  function sword(g, hx, hy, tx, ty) {
    g.ln(hx, hy, tx, ty, C.steel);
    var dx = tx - hx, dy = ty - hy, len = Math.sqrt(dx * dx + dy * dy) || 1, ux = dx / len, uy = dy / len;
    g.px(hx + ux * 2, hy + uy * 2, C.steelS);
    g.px(hx + ux * 4, hy + uy * 4, C.steelS);
    g.px(tx, ty, C.hot);
    var gx = hx + ux * 1.2, gy = hy + uy * 1.2;
    g.px(gx - uy * 1.5, gy + ux * 1.5, C.gold); g.px(gx, gy, C.gold); g.px(gx + uy * 1.5, gy - ux * 1.5, C.gold);
    g.px(hx - ux, hy - uy, C.goldS);
  }
  function lamb(g, o) {
    var by = o.by || 0, L = o.legs || [0, 0], fl = o.fl || 0, lf = o.lift || [0, 0];
    // patas
    for (var li = 0; li < 2; li++) {
      var lx = (li ? 13 : 8) + L[li];
      g.r(lx, 17 + by, 2, 3 - Math.max(0, by) - lf[li], C.leg);
      g.r(lx, 19 - lf[li], 2, 1, C.hoof);
    }
    // capa (atras)
    g.d(7, 12 + by, 4, C.cape);
    g.r(2, 10 + by + fl, 5, 5, C.cape); g.r(1, 11 + by + fl, 2, 4, C.capeD);
    g.r(3, 14 + by + fl, 4, 1, C.capeD); g.r(4, 9 + by, 3, 1, C.capeH);
    g.px(1, 15 + by + fl, C.capeD); g.px(4, 15 + by + fl, C.capeD);
    // lana: sombra primero (1px abajo), luego color
    var tufts = [[8, 10, 3], [11, 8, 3], [12, 13, 3], [8, 14, 3], [13, 11, 3], [10, 11, 3]];
    var i;
    for (i = 0; i < tufts.length; i++) g.d(tufts[i][0], tufts[i][1] + by + 1, tufts[i][2], C.woolS);
    for (i = 0; i < tufts.length; i++) g.d(tufts[i][0], tufts[i][1] + by, tufts[i][2], C.wool);
    g.px(9, 8 + by, C.woolH); g.px(12, 6 + by, C.woolH); g.px(10, 9 + by, C.woolH); g.px(7, 11 + by, C.woolS); g.px(11, 15 + by, C.woolS);
    g.px(9, 13 + by, C.woolS); g.px(12, 15 + by, C.woolS);
    // bufanda de la capa
    g.r(13, 9 + by, 2, 5, C.cape); g.px(13, 9 + by, C.capeH); g.r(13, 13 + by, 2, 1, C.capeD);
    // cabeza (orejas caidas un pixel con "ear")
    var ea = o.ear || 0;
    g.r(15, 7 + by + ea, 2, 3, C.ear); g.r(18, 7 + by + ea, 2, 2, C.ear);
    g.d(17, 11 + by, 3, C.face);
    g.px(17, 14 + by, C.faceS); g.px(18, 14 + by, C.faceS); g.px(15, 12 + by, C.faceS);
    if (o.hurt) { g.px(18, 10 + by, C.eye); g.px(19, 11 + by, C.eye); g.px(18, 11 + by, C.eye); g.px(19, 10 + by, C.eye); g.px(18, 13 + by, C.eye); }
    else if (o.blink) { g.r(18, 11 + by, 2, 1, C.eye); g.px(17, 11 + by, C.faceS); }
    else if (o.fury) { g.r(18, 10 + by, 2, 2, '#ff9a3c'); g.px(19, 11 + by, C.eye); g.px(18, 9 + by, C.eye); g.px(19, 9 + by, C.eye); }
    else { g.r(18, 10 + by, 2, 2, '#ffd36a'); g.px(19, 11 + by, C.eye); g.px(18, 10 + by, '#fff6d0'); }
    g.px(19, 13 + by, C.ear); g.px(20, 12 + by, '#c98b9a');
    // espada + pezuña
    if (o.sword) { var s = o.sword; sword(g, s[0], s[1], s[2], s[3]); g.r(s[0] - 1, s[1], 2, 2, C.face); }
  }
  function ball(k) {
    return function (g) {
      var cx = 11, cy = 12, a = k * Math.PI / 2;
      function patch(an, rr, rad, col) { g.d(cx + Math.cos(an) * rr, cy + Math.sin(an) * rr, rad, col); }
      g.d(cx, cy + 1, 6, C.woolS); g.d(cx, cy, 6, C.wool);
      g.px(cx - 2, cy - 4, C.woolH); g.px(cx + 3, cy - 3, C.woolH);
      patch(a, 4, 2, C.cape); patch(a + 0.55, 4.6, 1, C.capeD); patch(a - 0.5, 4.5, 1, C.capeH);
      patch(a + 2.2, 4.4, 2, C.face); patch(a + 2.2, 4.4, 0, C.eye);
      patch(a + 4.1, 5, 1, C.steel); patch(a + 4.1, 6, 0, C.gold);
    };
  }
  // fase de caminar k (0..5) -> opciones de pose
  function walkPose(k) {
    var p = PH[k], c = Math.round(1.3 * Math.cos(p)), s = Math.sin(p), by = Math.abs(s) > 0.8 ? -1 : 0;
    return { by: by, legs: [-c, c], lift: [s > 0.5 ? 1 : 0, s < -0.5 ? 1 : 0], fl: [0, 1, 1, 0, -1, -1][k], ear: by ? 0 : 1 };
  }
  function plWalk(k) { var o = walkPose(k); o.sword = [20, 16 + o.by, 23, 8 + o.by]; return function (g) { lamb(g, o); }; }
  var plDraw = {
    hurt: function (g) { lamb(g, { by: 1, hurt: true, sword: [16, 16, 18, 10], fl: -1 }); }
  };
  var pl = [];
  pl.push(function (g) { lamb(g, { by: 0, sword: [20, 16, 23, 8] }); });                                         // 0 idle
  pl.push(function (g) { lamb(g, { by: 1, sword: [20, 17, 23, 9], legs: [0, 0], ear: 1 }); });                   // 1 idle (respira)
  pl.push(plWalk(0)); pl.push(plWalk(1)); pl.push(plWalk(3)); pl.push(plWalk(4));                                // 2-5 walk
  pl.push(function (g) { lamb(g, { by: 0, legs: [0, 1], sword: [14, 11, 10, 1], fl: -1 }); });                  // 6 windup
  pl.push(function (g) { lamb(g, { by: 0, legs: [-1, 2], sword: [17, 13, 23, 13], fl: 2, fury: true }); });     // 7 golpe
  pl.push(function (g) { lamb(g, { by: 1, legs: [-1, 1], sword: [17, 15, 22, 20], fl: 1 }); });                  // 8 recuperacion
  for (var ri = 0; ri < 4; ri++) pl.push(ball(ri));                                                              // 9-12 roll
  pl.push(plDraw.hurt);                                                                                          // 13 hurt
  pl.push(plWalk(2)); pl.push(plWalk(5));                                                                        // 14-15 walk
  pl.push(function (g) { lamb(g, { by: 1, legs: [1, -1], sword: [13, 12, 7, 3], fl: -2, ear: 1 }); });           // 16 anticipacion
  pl.push(function (g) { lamb(g, { by: 0, legs: [0, 1], sword: [19, 17, 21, 23], fl: 0 }); });                   // 17 estela / retorno
  pl.push(function (g) { lamb(g, { by: 0, blink: true, sword: [20, 16, 23, 8] }); });                            // 18 parpadeo
  var plDie0 = pl.length;
  dyingFrames(plDraw.hurt, 24, 24, null, {
    rot: [-0.1, -0.55, -1.25, -1.5, -1.55], sx: [1, 1, 1, 1, 1], sy: [1, 0.96, 0.92, 0.9, 0.85], dx: [0, 2, 7, 11, 11], dy: [0, 0, 0, 0, 0],
    dis: [0, 0, 0, 0.3, 0.75], ash: false
  }).forEach(function (f) { pl.push(f); });                                                                      // 19-23 muerte
  var idleSeq = []; (function () { var i; for (i = 0; i < 24; i++) idleSeq.push(i < 12 ? 0 : (i < 23 ? 1 : 18)); idleSeq[5] = 1; idleSeq[17] = 0; idleSeq[10] = 18; }());
  add('player', 24, 24, pl, null, {
    idle: { f: [0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 18, 0, 0, 1, 1, 1, 1, 1, 1, 0], fps: 6 },
    walk: { f: [2, 3, 14, 4, 5, 15], fps: 12 },
    attack: { f: [16, 6, 7, 8, 17], fps: 18 }, attack_hit: { f: [7], fps: 1 },
    roll: { f: [9, 10, 11, 12], fps: 14 }, hurt: { f: [13], fps: 1 },
    die: DIE_ANIM([13, plDie0, plDie0 + 1, plDie0 + 2, plDie0 + 3, plDie0 + 4])
  });

  // ------------------------------------------------------------------ ENEMIGOS
  // --- Gusano (16x16) ---
  function worm(ph, o) {
    o = o || {};
    return function (g) {
      var cols = ['#44662a', '#5a8236', '#6f9a3c', '#86b64a'];
      var seg = [[3, 0], [6, 1], [9, 2], [12, 3]], hx = o.hx || 0, hy = o.hy || 0;
      for (var i = 0; i < 4; i++) {
        var s = seg[i], oy = Math.round(Math.sin(ph + i * 1.3) * 1.4), r = i === 3 ? 3 : 2 + (i > 0 ? 1 : 0);
        var sx = s[0] + (i === 3 ? hx : (i === 2 ? Math.round(hx / 2) : 0)); oy += (i === 3 ? hy : (i === 2 ? Math.round(hy / 2) : 0));
        g.d(sx, 10 + oy, r, cols[i]);
        g.px(sx - 1, 8 + oy, '#a9d46a'); g.px(sx + 1, 12 + oy, '#8a5ab0'); // brillo + mancha corrupta
        if (i === 3) {
          g.px(sx + 1, 8 + oy, '#ff3b30'); g.px(sx + 2, 8 + oy, '#ffd36a');
          if (o.open) { g.r(sx + 1, 10 + oy, 3, 3, '#5a1a2a'); g.px(sx + 2, 10 + oy, '#ffffff'); g.px(sx + 2, 12 + oy, '#ffffff'); g.px(sx + 1, 11 + oy, '#ff5a6a'); }
          else { g.px(sx + 2, 11 + oy, '#ffffff'); g.px(sx, 12 + oy, '#ffffff'); g.px(sx + 1, 12 + oy, '#5a1a2a'); }
        }
      }
    };
  }
  var wF = [worm(PH[0]), worm(PH[3]), worm(PH[1]), worm(PH[2]), worm(PH[4]), worm(PH[5]),
    worm(PH[0], { hx: -2, hy: -3 }), worm(PH[0], { hx: 2, hy: 1, open: true }), worm(PH[3], { hx: 0, hy: 1 })];
  var wDie = wF.length;
  dyingFrames(worm(PH[0]), 16, 16).forEach(function (f) { wF.push(f); });
  add('worm', 16, 16, wF, null, {
    walk: { f: [0, 2, 3, 1, 4, 5], fps: 9 }, attack: { f: [6, 7, 8], fps: 10 },
    die: DIE_ANIM([wDie, wDie + 1, wDie + 2, wDie + 3, wDie + 4])
  });

  // --- Arquero (20x20) ---
  function archer(o) {
    return function (g) {
      var by = o.by || 0, robe = '#5b3a82', robeD = '#3c2459', hh = o.hem || 0;
      for (var y = 8; y <= 18; y++) {
        var hw = 2 + Math.floor((y - 8) * 0.5);
        g.r(9 - hw + (y > 16 ? hh : 0), y + by, hw * 2 + 1, 1, y > 14 ? robeD : robe);
      }
      g.r(6, 13 + by, 7, 1, '#e0a63a'); // cinturon
      g.px(9, 13 + by, '#fff0a8');
      g.r(9, 8 + by, 1, 9, '#7a56a8'); // pliegue
      // capucha
      g.d(9, 6 + by, 4, robe); g.d(10, 7 + by, 2, '#0c0814'); g.r(12, 5 + by, 1, 4, robeD);
      var eyeC = o.blink ? '#3c2459' : '#ff9a2a';
      g.px(10, 6 + by, eyeC); g.px(12, 6 + by, eyeC); if (!o.blink) g.px(11, 6 + by, '#ffd36a');
      g.px(7, 3 + by, '#7a56a8'); g.px(8, 2 + by, '#7a56a8');
      // arco
      var bx = o.draw ? 15 : 16;
      g.ln(14, 4 + by, 17, 8 + by, '#a0693a'); g.ln(17, 8 + by, 17, 12 + by, '#a0693a'); g.ln(17, 12 + by, 14, 16 + by, '#a0693a');
      if (o.rel) { g.ln(14, 4 + by, 14, 16 + by, '#e8e0f0'); g.px(18, 7 + by, '#ffd36a'); g.px(19, 10 + by, '#fff0a8'); g.px(18, 13 + by, '#ffd36a'); }
      else {
        g.ln(14, 4 + by, o.draw ? 12 : (o.nock ? 13 : 14), o.draw ? 10 + by : (o.nock ? 10 + by : 4 + by), '#e8e0f0');
        g.ln(o.draw ? 12 : (o.nock ? 13 : 14), o.draw ? 10 + by : (o.nock ? 10 + by : 16 + by), 14, 16 + by, '#e8e0f0');
      }
      if (o.draw) { g.ln(12, 10 + by, 19, 10 + by, '#d9b0ff'); g.px(19, 10 + by, '#ff9a2a'); g.px(18, 9 + by, '#ffd36a'); g.px(18, 11 + by, '#ffd36a'); }
      if (o.nock) { g.ln(13, 10 + by, 17, 10 + by, '#d9b0ff'); g.px(16, 9 + by, '#7a56a8'); }
      g.px(bx - 3, 10 + by, robe); g.r(11, 10 + by, 3, 2, '#3c2459');
    };
  }
  function arWalk(k) { var c = (1 - Math.cos(PH[k])) / 2; return archer({ by: -Math.round(c), hem: Math.round(c) }); }
  var aF = [archer({ by: 0, hem: 0 }), archer({ by: -1, hem: 1 }), archer({ by: 0, draw: true }),
    arWalk(1), arWalk(2), arWalk(4), arWalk(5), archer({ nock: true }), archer({ rel: true, by: 0 }), archer({ by: 1, hem: 0 }), archer({ blink: true })];
  var aDie = aF.length;
  dyingFrames(archer({ by: 0 }), 20, 20).forEach(function (f) { aF.push(f); });
  add('archer', 20, 20, aF, null, {
    walk: { f: [0, 3, 4, 1, 5, 6], fps: 8 }, shoot: { f: [7, 2, 8, 9], fps: 10 }, aim: { f: [2], fps: 1 },
    idle: { f: [0, 0, 0, 1, 1, 1, 10], fps: 4 },
    die: DIE_ANIM([aDie, aDie + 1, aDie + 2, aDie + 3, aDie + 4])
  });

  // --- Jabali (24x18) ---
  function boar(o) {
    return function (g) {
      var by = o.by || 0, body = '#7a4a32', dark = '#563222', light = '#97613f', hy = (o.low ? 2 : 0) + (o.hy || 0);
      var lg = o.legs || [0, 0, 0, 0], lx = [5, 8, 14, 17], rs = o.raise || [0, 0, 0, 0];
      for (var i = 0; i < 4; i++) { g.r(lx[i] + lg[i], 13 + by - rs[i], 2, 3 - (i % 2 ? 0 : 0), i % 2 ? dark : '#3d2418'); g.px(lx[i] + lg[i], 15 - rs[i], '#1a0f0a'); }
      g.e(11, 9 + by, 8, 5, body); g.e(11, 11 + by, 7, 3, dark); g.e(11, 7 + by, 6, 2, light);
      for (var k = 0; k < 7; k++) { g.px(5 + k * 2, 3 + by + (k % 2), '#2b1810'); g.px(5 + k * 2, 4 + by, '#3d2418'); }
      g.d(18, 9 + by + hy, 3, light); g.r(20, 10 + by + hy, 3, 3, '#c98b86'); g.px(22, 10 + by + hy, '#3a1a1f'); g.px(22, 12 + by + hy, '#3a1a1f');
      g.px(20, 8 + by + hy, o.rage || o.angry ? '#ff3b30' : (o.blink ? '#563222' : '#ffe08a')); g.px(19, 8 + by + hy, '#14101c');
      g.px(21, 13 + by + hy, '#ffffff'); g.px(21, 14 + by + hy, '#ffffff'); g.px(19, 13 + by + hy, '#ffffff');
      g.r(16, 5 + by + hy, 2, 3, dark); g.px(16, 5 + by + hy, '#c98b86');
      if (o.rage) { g.r(0, 6 + by, 3, 1, 'rgba(255,200,120,0.7)'); g.r(1, 10 + by, 3, 1, 'rgba(255,200,120,0.6)'); }
      if (o.hit) { g.px(23, 9 + by + hy, '#ffffff'); g.px(23, 14 + by + hy, '#ffd36a'); g.px(22, 8 + by + hy, '#ffd36a'); }
      if (o.paw) { g.px(18, 17, '#6b5a50'); g.px(20, 16, '#6b5a50'); g.px(16, 17, '#6b5a50'); }
    };
  }
  function boWalk(k) {
    var cs = Math.cos(PH[k]), c = Math.round(cs), by = -Math.round((1 + cs) / 2) * 0 - (Math.abs(Math.sin(PH[k])) > 0.8 ? 1 : 0);
    return boar({ by: by, legs: [-c, c, c, -c] });
  }
  var bF = [boar({ by: 0, legs: [-1, 1, 1, -1] }), boar({ by: -1, legs: [1, -1, -1, 1] }), boar({ by: 1, low: true, rage: true, legs: [-2, 2, 2, -2] }),
    boWalk(1), boWalk(2), boWalk(4), boWalk(5),
    boar({ by: 1, low: true, angry: true, legs: [0, 0, 1, -1], raise: [0, 0, 0, 1], paw: true }),            // 7 escarba (anticipacion)
    boar({ by: 0, low: false, hy: -1, rage: true, legs: [-2, 2, 2, -2], hit: true }),                         // 8 impacto
    boar({ by: 0, legs: [0, 0, 0, 0], angry: true }),                                                          // 9 recuperacion
    boar({ by: 0, legs: [-1, 1, 1, -1], blink: true })];                                                       // 10 parpadeo
  var bDie = bF.length;
  dyingFrames(boar({ by: 0, legs: [-1, 1, 1, -1] }), 24, 18, null, { dx: [0, 0, 0, 0, 0] }).forEach(function (f) { bF.push(f); });
  add('boar', 24, 18, bF, null, {
    walk: { f: [0, 3, 4, 1, 5, 6], fps: 10 }, charge: { f: [2], fps: 1 }, attack: { f: [7, 7, 2, 8, 9], fps: 10 },
    idle: { f: [0, 0, 0, 0, 10], fps: 4 },
    die: DIE_ANIM([bDie, bDie + 1, bDie + 2, bDie + 3, bDie + 4])
  });

  // --- Bomba (16x16) ---
  function bomb(o) {
    return function (g) {
      var by = o.by || 0, lit = o.lit, rad = o.big ? 7 : 6;
      var b = lit ? (o.lit === 2 ? '#ff6a2a' : '#c8281e') : '#2f2b3f', b2 = lit ? '#8f1414' : '#1f1b2c', hi = lit ? '#ffd36a' : '#6a6488';
      g.r(4 + (o.f || 0), 13, 2, 2, '#14101c'); g.r(10 - (o.f || 0), 13, 2, 2, '#14101c');
      g.d(8, 9 + by, rad, b2); g.d(8, 8 + by, rad, b); g.d(5, 6 + by, 1, hi);
      g.px(4, 8 + by, hi);
      g.r(5, 8 + by, 2, 2, lit ? '#ffffff' : '#ffd36a'); g.r(9, 8 + by, 2, 2, lit ? '#ffffff' : '#ffd36a');
      g.px(5, 7 + by, C.ol); g.px(6, 7 + by, C.ol); g.px(10, 7 + by, C.ol); g.px(11, 7 + by, C.ol);
      g.r(6, 12 + by, 4, 1, lit ? '#fff0a8' : '#8a8498');
      g.r(7, 3 + by, 2, 2, '#6a4a2a'); g.ln(8, 3 + by, 11, 1, '#a0693a');
      g.px(12, 0, lit ? '#ffffff' : '#ff9a2a'); g.px(11, 1, '#ffd36a'); if (lit) { g.px(13, 1, '#ff9a2a'); g.px(12, 2, '#ff9a2a'); g.px(11, 0, '#ffd36a'); }
      if (o.big) { g.px(13, 0, '#ffffff'); g.px(10, 2, '#ff9a2a'); g.px(14, 2, '#ffd36a'); g.px(8, 0, '#ffd36a'); }
    };
  }
  function bmWalk(k) { var c = Math.cos(PH[k]); return bomb({ f: Math.round(c), by: -(Math.abs(Math.sin(PH[k])) > 0.8 ? 1 : 0) }); }
  var mF = [bomb({ f: 1 }), bomb({ f: -1, by: -1 }), bomb({ lit: 1 }), bomb({ lit: 2, by: -1 }), bmWalk(1), bmWalk(2), bmWalk(4), bmWalk(5),
    bomb({ lit: 1, big: true, by: -1 }), bomb({ lit: 2, big: true, by: -1 })];
  var mDie = mF.length;
  dyingFrames(bomb({ f: 1 }), 16, 16).forEach(function (f) { mF.push(f); });
  add('bomb', 16, 16, mF, null, {
    walk: { f: [0, 4, 5, 1, 6, 7], fps: 11 }, lit: { f: [2, 3], fps: 8 }, prime: { f: [2, 3, 2, 8, 3, 9], fps: 14 },
    die: DIE_ANIM([mDie, mDie + 1, mDie + 2, mDie + 3, mDie + 4])
  });

  // --- Brujo (20x24) ---
  function warlock(o) {
    return function (g) {
      var by = o.by || 0, rb = '#2f5d58', rbD = '#1f3f3f';
      for (var y = 9; y <= 21; y++) { var hw = 2 + Math.floor((y - 9) * 0.45); g.r(9 - hw, y + by, hw * 2 + 1, 1, y > 17 ? rbD : rb); }
      g.r(6, 14 + by, 7, 1, '#6a3a82'); g.px(9, 14 + by, '#b980d6');
      g.r(4, 8 + by, 11, 2, '#2a1f4a'); g.r(6, 5 + by, 7, 3, '#2a1f4a'); g.r(8, 2 + by, 4, 3, '#2a1f4a'); g.r(10, 0 + by, 2, 2, '#2a1f4a');
      g.r(6, 7 + by, 7, 1, '#b980d6');
      g.r(7, 10 + by, 5, 3, '#0c0814');
      if (o.blink) { g.px(8, 11 + by, '#2f5d58'); g.px(11, 11 + by, '#2f5d58'); } else { g.px(8, 11 + by, '#8cff6a'); g.px(11, 11 + by, '#8cff6a'); }
      var arm = o.arm != null ? o.arm : (o.cast ? -3 : 0), orb = o.orb != null ? o.orb : (o.cast ? 3 : 2);
      g.ln(16, 8 + by + arm, 16, 20 + by, '#7a5230');
      g.d(16, 6 + by + arm, orb, '#4fd04a'); g.px(15, 5 + by + arm, '#d6ffb0'); g.px(16, 6 + by + arm, '#8cff6a');
      g.r(13, 12 + by + arm / 2, 3, 2, rbD);
      if (o.cast) { g.px(11, 2, '#8cff6a'); g.px(19, 1, '#8cff6a'); g.px(13, 0, '#d6ffb0'); g.px(18, 5 + by, '#8cff6a'); g.px(14, 1, '#8cff6a'); }
      if (o.wind) { g.px(13, 3 + by + arm, '#8cff6a'); g.px(19, 4 + by + arm, '#8cff6a'); g.px(16, 2 + by + arm, '#d6ffb0'); }
    };
  }
  var kF = [warlock({}), warlock({ by: 1 }), warlock({ cast: true }), warlock({ arm: -1, orb: 2, wind: true, by: 1 }), warlock({ arm: -2, orb: 2 }), warlock({ blink: true })];
  var kDie = kF.length;
  dyingFrames(warlock({}), 20, 24).forEach(function (f) { kF.push(f); });
  add('warlock', 20, 24, kF, null, {
    idle: { f: [0, 0, 0, 1, 1, 1, 0, 0, 0, 1, 1, 5], fps: 4 }, cast: { f: [3, 2, 2, 4], fps: 8 }, cast_hold: { f: [2], fps: 1 },
    die: DIE_ANIM([kDie, kDie + 1, kDie + 2, kDie + 3, kDie + 4])
  });

  // ------------------------------------------------------------------ JEFE: PASTOR CORRUPTO (48x48 base)
  function boss(o) {
    return function (g) {
      var by = o.by || 0, rb = '#3b2850', rbD = '#241638', rbH = '#58407a', veins = '#6dff7a', sw = o.sway || 0;
      var lift = o.slam ? (o.lift != null ? o.lift : -6) : (o.lift || 0);
      g.e(21, 29 + by + lift / 2, 16, 14, rbD); g.e(21, 27 + by + lift / 2, 16, 14, rb);
      g.e(17, 22 + by + lift / 2, 8, 6, rbH);
      for (var i = 0; i < 9; i++) { g.r(7 + i * 3.5 + (i % 2 ? sw : -sw), 40 + by + lift / 2 + (i % 2) * 2, 3, 3 - (i % 2), rbD); }
      g.ln(12, 30 + by, 17, 34 + by, veins); g.ln(17, 34 + by, 19, 40 + by, veins); g.ln(25, 24 + by, 29, 31 + by, veins);
      g.ln(29, 31 + by, 27, 38 + by, veins); g.ln(13, 22 + by, 10, 28 + by, '#41c05a');
      g.px(24, 35 + by, '#b6ffbe'); g.px(15, 31 + by, '#b6ffbe');
      var wl = [[30, 21], [27, 24], [31, 25], [26, 19], [29, 28], [34, 24]];
      for (var j = 0; j < wl.length; j++) g.d(wl[j][0], wl[j][1] + by + lift, 3, '#8f8aa0');
      for (var j2 = 0; j2 < wl.length; j2++) g.d(wl[j2][0], wl[j2][1] + by + lift - 1, 2, '#bdb6cc');
      var hy = 14 + by + lift;
      g.ln(31, hy - 2, 26, hy - 7, '#9c8a5e'); g.ln(26, hy - 7, 28, hy - 11, '#9c8a5e'); g.ln(28, hy - 11, 32, hy - 11, '#9c8a5e'); g.px(32, hy - 10, '#d6c690');
      g.ln(33, hy - 3, 33, hy - 9, '#7d6c46'); g.ln(33, hy - 9, 37, hy - 11, '#7d6c46'); g.px(38, hy - 10, '#d6c690');
      g.ln(36, hy - 2, 41, hy - 5, '#b8a674');
      g.e(34, hy + 1, 7, 6, '#e8dcc2'); g.e(35, hy + 3, 6, 4, '#d3c5a4');
      g.r(39, hy + 2, 6, 4, '#e8dcc2'); g.r(42, hy + 5, 3, 2, '#bba98a'); g.px(44, hy + 3, '#2a1f1a'); g.px(44, hy + 5, '#2a1f1a');
      g.r(32, hy - 1, 3, 3, '#14101c'); g.r(37, hy - 1, 3, 3, '#14101c');
      var eye = o.flare ? '#ffffff' : (o.rage ? '#ff3b30' : '#ff9a2a');
      g.px(33, hy, eye); g.px(38, hy, eye); g.px(34, hy, '#ffe08a'); g.px(39, hy, '#ffe08a');
      if (o.flare) { g.px(33, hy + 1, '#ff9a2a'); g.px(38, hy + 1, '#ff9a2a'); g.px(32, hy - 2, '#ff6a2a'); g.px(40, hy - 2, '#ff6a2a'); }
      g.px(31, hy + 4, '#8a7a5a'); g.px(30, hy + 2, '#8a7a5a');
      var s = o.staff;
      g.ln(s[0], s[1] + by, s[2], s[3] + by, '#8b5a30'); g.ln(s[0] + 1, s[1] + by, s[2] + 1, s[3] + by, '#5c381d');
      var tx = s[2], ty = s[3] + by;
      if (o.hook === 'up') { g.d(tx - 2, ty - 2, 3, '#8b5a30'); g.d(tx - 2, ty - 2, 1, C.ol); g.r(tx - 1, ty, 2, 4, '#8b5a30'); }
      g.d(s[0], s[1] + by, 2, '#2b1f3a');
      g.px(s[0] + 1, s[1] + by - 1, '#6dff7a');
      if (o.orb) g.d(tx - 3, ty - 3, 1, '#6dff7a');
      if (o.glow) { g.px(tx - 3, ty - 5, '#b6ffbe'); g.px(tx + 1, ty - 4, '#6dff7a'); g.px(tx - 5, ty - 2, '#6dff7a'); }
    };
  }
  var sF = [
    boss({ staff: [40, 44, 42, 8], hook: 'up', by: 0 }),
    boss({ staff: [40, 44, 42, 9], hook: 'up', by: 1, orb: true }),
    boss({ staff: [34, 26, 46, 34], rage: true, by: 0 }),
    boss({ staff: [38, 30, 40, 2], hook: 'up', slam: true, rage: true, by: 0 }),
    boss({ staff: [40, 44, 42, 8], hook: 'up', by: 0, sway: 1, orb: true }),                                  // 4 balanceo
    boss({ staff: [40, 44, 42, 9], hook: 'up', by: 1, flare: true, glow: true }),                              // 5 ojos brillan
    boss({ staff: [30, 28, 23, 5], hook: 'up', by: 1, lift: -2, rage: true, glow: true }),                    // 6 anticipacion del golpe
    boss({ staff: [38, 36, 45, 42], by: 1, rage: true }),                                                      // 7 recuperacion
    boss({ staff: [38, 24, 40, 1], hook: 'up', slam: true, lift: -10, rage: true, flare: true, glow: true }),  // 8 anticipacion del aplastamiento
    boss({ staff: [38, 40, 40, 46], slam: true, lift: 2, by: 2, rage: true })                                  // 9 recuperacion del aplastamiento
  ];
  var sDie = sF.length;
  dyingFrames(boss({ staff: [40, 44, 42, 8], hook: 'up', by: 0 }), 48, 48, null, { sy: [0.97, 0.85, 0.7, 0.5, 0.3], dis: [0, 0.03, 0.25, 0.55, 0.85] }).forEach(function (f) { sF.push(f); });
  add('boss', 48, 48, sF, null, {
    idle: { f: [0, 4, 1, 4, 0, 4, 1, 5], fps: 3 }, swing: { f: [6, 6, 2, 7], fps: 8 }, swing_hit: { f: [2], fps: 1 },
    slam: { f: [8, 8, 3, 9], fps: 8 }, slam_hit: { f: [3], fps: 1 },
    die: { f: [sDie, sDie + 1, sDie + 2, sDie + 3, sDie + 4], fps: 6, loop: false }
  });

  // ------------------------------------------------------------------ PROYECTILES / EFECTOS (VFX)
  add('arrow', 12, 5, [
    function (g) { g.ln(1, 2, 9, 2, '#e8e0f0'); g.px(10, 2, '#ff9a2a'); g.px(9, 1, '#ffd36a'); g.px(9, 3, '#ffd36a'); g.px(11, 2, '#fff0a8'); g.px(0, 1, '#b980d6'); g.px(0, 3, '#b980d6'); g.px(1, 1, '#7a56a8'); g.px(1, 3, '#7a56a8'); },
    function (g) { g.ln(1, 2, 9, 2, '#d9b0ff'); g.px(10, 2, '#ffd36a'); g.px(9, 1, '#ff9a2a'); g.px(9, 3, '#ff9a2a'); g.px(11, 2, '#ffffff'); g.px(0, 1, '#b980d6'); g.px(0, 3, '#b980d6'); g.px(1, 1, '#7a56a8'); g.px(1, 3, '#7a56a8'); }
  ], { outline: false }, { fly: { f: [0, 1], fps: 12 } });
  add('thorn', 10, 5, [
    function (g) { g.ln(0, 2, 7, 2, '#e8dcc2'); g.r(1, 1, 4, 3, '#cdbf9c'); g.px(7, 2, '#6dff7a'); g.px(8, 2, '#b6ffbe'); g.px(2, 0, '#8b7a56'); g.px(2, 4, '#8b7a56'); g.px(0, 2, '#5c381d'); }
  ], null);
  add('fireball', 10, 10, [
    function (g) { g.d(5, 5, 4, '#ff6a2a'); g.d(5, 5, 3, '#ff8a2a'); g.d(5, 5, 2, '#ffc83d'); g.d(5, 5, 1, '#fff0a8'); g.px(0, 4, '#ff6a2a'); g.px(1, 6, '#ff6a2a'); },
    function (g) { g.d(5, 5, 4, '#e0501f'); g.d(5, 5, 3, '#ff7a28'); g.d(5, 5, 2, '#ffd34d'); g.d(5, 5, 1, '#ffffff'); g.px(0, 6, '#ff6a2a'); g.px(1, 3, '#ff6a2a'); }
  ], { outline: false }, { fly: { f: [0, 1], fps: 12 } });

  // --- Tajos ---
  var D = Math.PI / 180;
  function slashFrame(a0, a1, r0, r1, alpha) { // (original, se conserva)
    return function (g) {
      var cx = 2, cy = 16;
      for (var y = 0; y < 32; y++) for (var x = 0; x < 22; x++) {
        var dx = x - cx, dy = y - cy, r = Math.sqrt(dx * dx + dy * dy), a = Math.atan2(dy, dx);
        if (r >= r0 && r <= r1 && a >= a0 && a <= a1) {
          var t = (r - r0) / (r1 - r0);
          var col = t > 0.72 ? 'rgba(255,250,235,' + alpha + ')' : t > 0.4 ? 'rgba(255,200,90,' + alpha * 0.9 + ')' : 'rgba(255,110,40,' + alpha * 0.7 + ')';
          g.px(x, y, col);
        }
      }
    };
  }
  add('slash', 22, 32, [slashFrame(-40 * D, 22 * D, 11, 18, 1), slashFrame(-58 * D, 58 * D, 10, 19, 1), slashFrame(-58 * D, 58 * D, 15, 19, 0.45)],
    { outline: false }, { swing: { f: [0, 1, 2], fps: 24 } });
  // Estela en media luna con cola afilada. o: a0,a1 (rad), R (radio exterior), T (grosor), dir (+1 baja / -1 sube), head, tail, alpha
  function crescent(o) {
    return function (g) {
      var cx = 2, cy = 16, x, y;
      for (y = 0; y < 32; y++) for (x = 0; x < 22; x++) {
        var dx = x + 0.5 - cx, dy = y + 0.5 - cy, r = Math.sqrt(dx * dx + dy * dy), a = Math.atan2(dy, dx);
        if (a < o.a0 || a > o.a1 || r > o.R) continue;
        var s = (a - o.a0) / (o.a1 - o.a0); if (o.dir < 0) s = 1 - s;
        if (s > o.head || s < o.tail) continue;
        var vs = (s - o.tail) / Math.max(0.001, o.head - o.tail);
        var thick = o.T * Math.pow(Math.sin(Math.PI * Math.min(1, Math.max(0, vs * 0.96 + 0.02))), 0.62);
        if (r < o.R - thick) continue;
        var d = (o.R - r) / Math.max(0.5, thick), al = o.alpha * (0.5 + 0.5 * vs);
        var col = d < 0.2 ? '255,255,255' : d < 0.45 ? '255,243,196' : d < 0.75 ? '255,196,92' : '255,110,40';
        g.px(x, y, 'rgba(' + col + ',' + al.toFixed(2) + ')');
      }
      if (o.sparks) for (var k = 0; k < o.sparks.length; k++) g.px(o.sparks[k][0], o.sparks[k][1], 'rgba(255,230,170,' + o.alpha.toFixed(2) + ')');
    };
  }
  function slashSet(base) {
    var ph = [{ head: 0.45, tail: 0, alpha: 1 }, { head: 1, tail: 0, alpha: 1 }, { head: 1, tail: 0.3, alpha: 0.8 }, { head: 1, tail: 0.65, alpha: 0.45 }];
    return ph.map(function (p) {
      var o = {}, k; for (k in base) o[k] = base[k]; for (k in p) o[k] = p[k];
      if (base.extra) {
        var o2 = {}; for (k in base.extra) o2[k] = base.extra[k]; for (k in p) o2[k] = p[k]; o2.alpha = p.alpha * 0.7;
        var f1 = crescent(o), f2 = crescent(o2);
        return function (g) { f2(g); f1(g); };
      }
      return crescent(o);
    });
  }
  // slash_1: tajo descendente rapido | slash_2: tajo de vuelta (ascendente) | slash_3: remate pesado, ancho, doble arco con chispas
  add('slash_1', 22, 32, slashSet({ a0: -62 * D, a1: 34 * D, R: 19, T: 10, dir: 1 }), { outline: false }, { swing: { f: [0, 1, 2, 3], fps: 28 } });
  add('slash_2', 22, 32, slashSet({ a0: -34 * D, a1: 62 * D, R: 19, T: 10, dir: -1 }), { outline: false }, { swing: { f: [0, 1, 2, 3], fps: 28 } });
  add('slash_3', 22, 32, slashSet({ a0: -78 * D, a1: 78 * D, R: 20, T: 13, dir: 1, sparks: [[20, 3], [21, 29], [19, 16], [17, 1], [18, 31]], extra: { a0: -70 * D, a1: 70 * D, R: 14, T: 4, dir: 1 } }),
    { outline: false }, { swing: { f: [0, 1, 2, 3], fps: 22 } });

  // --- Onda de choque (48x48 -> 96x96), centrada ---
  add('shockwave', 48, 48, [5, 11, 16, 20, 23].map(function (R, k) {
    var T = [5, 4.5, 3.5, 2.5, 1.5][k], al = [1, 0.95, 0.8, 0.55, 0.3][k];
    return function (g) {
      var rr = rng(40 + k), x, y;
      for (y = 0; y < 48; y++) for (x = 0; x < 48; x++) {
        var d = Math.hypot(x + 0.5 - 24, y + 0.5 - 24);
        if (d < R - T) { if (k < 3 && d > R - T - 5) g.px(x, y, 'rgba(255,110,40,' + (0.13 * (1 - (R - T - d) / 5) * al).toFixed(2) + ')'); continue; }
        if (d > R + 0.6) continue;
        if (k >= 2 && rr() > 0.9 - k * 0.09 && d < R - 0.8) continue;      // anillo roto
        var u = (R - d) / T;
        var c = u < 0.18 ? '255,250,235' : u < 0.5 ? '255,205,110' : '255,106,42';
        g.px(x, y, 'rgba(' + c + ',' + al.toFixed(2) + ')');
      }
      for (var i = 0; i < 6 + k * 2; i++) { var a = rr() * 6.283, rd = R + 1.5 + rr() * (2 + k * 1.2); g.px(24 + Math.cos(a) * rd, 24 + Math.sin(a) * rd, 'rgba(255,200,120,' + (al * 0.8).toFixed(2) + ')'); }
    };
  }), { outline: false }, { boom: { f: [0, 1, 2, 3, 4], fps: 18 } });

  // --- Chispas de impacto (16x16, centrado) ---
  add('hitspark', 16, 16, [0, 1, 2, 3].map(function (k) {
    var gap = [0, 1.5, 3.5, 5], len = [4, 7, 7.5, 6.5], core = [3, 2, 1, 0], cols = [['#ffffff', '#fff0a8'], ['#fff0a8', '#ffc83d'], ['#ffc83d', '#ff8a2a'], ['#ff8a2a', '#c8281e']][k];
    return function (g) {
      var i, a;
      for (i = 0; i < 8; i++) {
        a = i * Math.PI / 4 + 0.2; var l = len[k] * (i % 2 ? 0.6 : 1);
        if (l > gap[k]) g.ln(8 + Math.cos(a) * gap[k], 8 + Math.sin(a) * gap[k], 8 + Math.cos(a) * l, 8 + Math.sin(a) * l, cols[i % 2]);
      }
      if (core[k] > 0) { g.d(8, 8, core[k], '#ffffff'); }
    };
  }), { outline: false }, { burst: { f: [0, 1, 2, 3], fps: 30 } });

  add('explosion', 32, 32, [
    function (g) { g.d(16, 16, 8, '#ff8a2a'); g.d(16, 16, 6, '#ffc83d'); g.d(16, 16, 3, '#ffffff'); },
    function (g) { g.d(16, 16, 14, 'rgba(255,90,30,0.85)'); g.d(16, 16, 11, '#ff8a2a'); g.d(16, 16, 7, '#ffd34d'); g.d(16, 16, 3, '#fff0a8'); },
    function (g) {
      var rr = rng(7);
      for (var y = 0; y < 32; y++) for (var x = 0; x < 32; x++) {
        var d = Math.hypot(x - 16, y - 16);
        if (d > 11 && d < 15.5 && rr() < 0.75) g.px(x, y, d > 13.5 ? 'rgba(90,40,50,0.55)' : 'rgba(255,100,40,0.6)');
      }
    },
    function (g) {
      var rr = rng(9);
      for (var y = 0; y < 32; y++) for (var x = 0; x < 32; x++) {
        var d = Math.hypot(x - 16, y - 16);
        if (d > 7 && d < 15 && rr() < 0.5) g.px(x, y, d > 12 ? 'rgba(60,40,62,0.5)' : 'rgba(120,70,60,0.45)');
        else if (d <= 7 && rr() < 0.35) g.px(x, y, 'rgba(255,150,60,0.5)');
      }
    },
    function (g) {
      var rr = rng(11);
      for (var y = 0; y < 32; y++) for (var x = 0; x < 32; x++) { var d = Math.hypot(x - 16, y - 15); if (d < 14 && rr() < 0.22) g.px(x, y, 'rgba(70,60,86,0.35)'); }
    }
  ], { outline: false }, { boom: { f: [0, 1, 2, 3, 4], fps: 14 } });

  add('spark', 3, 3, [
    function (g) { g.r(0, 1, 3, 1, '#ffffff'); g.r(1, 0, 1, 3, '#ffffff'); },
    function (g) { g.r(0, 1, 3, 1, '#ffc83d'); g.r(1, 0, 1, 3, '#ff8a2a'); }
  ], { outline: false });
  add('ember', 3, 3, [
    function (g) { g.r(0, 0, 2, 2, '#ff8a2a'); g.px(1, 1, '#ffd34d'); },
    function (g) { g.r(1, 1, 2, 2, '#c8281e'); g.px(1, 1, '#ff6a2a'); }
  ], { outline: false });
  add('smoke', 8, 8, [
    function (g) { g.d(4, 4, 2, 'rgba(70,64,86,0.8)'); },
    function (g) { g.d(4, 4, 3, 'rgba(70,64,86,0.55)'); },
    function (g) { g.d(4, 4, 3, 'rgba(70,64,86,0.28)'); g.px(2, 2, 'rgba(70,64,86,0.2)'); }
  ], { outline: false }, { puff: { f: [0, 1, 2], fps: 6 } });
  // humo grande, 3 tonos (luz arriba-izquierda, sombra violeta abajo-derecha) que se disipa
  add('smoke_big', 16, 16, [0, 1, 2, 3, 4].map(function (k) {
    var R = [3, 4.5, 5.8, 6.8, 7.4][k], al = [0.85, 0.75, 0.55, 0.35, 0.16][k];
    return function (g) {
      var rr = rng(300 + k), b = [[0, 0, 1], [-2.2, 0.8, 0.7], [2.2, 1, 0.65], [-0.5, -2, 0.7], [1.5, -1.6, 0.55]];
      b.forEach(function (p, i) {
        if (i > 0 && k === 0) return;
        var cx = 8 + p[0] * (0.6 + k * 0.2), cy = 8 + p[1] * (0.6 + k * 0.2) - k * 0.4, rad = Math.max(1, Math.round(R * p[2]));
        g.d(cx + 0.5, cy + 1, rad, 'rgba(46,40,64,' + al.toFixed(2) + ')');
        g.d(cx, cy, rad, 'rgba(74,66,92,' + al.toFixed(2) + ')');
        g.d(cx - 1, cy - 1, Math.max(0, rad - 2), 'rgba(110,100,134,' + (al * 0.9).toFixed(2) + ')');
      });
      for (var i = 0; i < k * 4; i++) { var a = rr() * 6.283, d = rr() * R * 1.3; g.px(8 + Math.cos(a) * d, 8 + Math.sin(a) * d, 'rgba(0,0,0,0)'); }
    };
  }), { outline: false }, { puff: { f: [0, 1, 2, 3, 4], fps: 7 } });
  add('dust', 6, 6, [
    function (g) { g.d(3, 3, 1, 'rgba(150,130,120,0.8)'); g.px(1, 2, 'rgba(150,130,120,0.6)'); },
    function (g) { g.d(3, 3, 2, 'rgba(150,130,120,0.4)'); }
  ], { outline: false }, { puff: { f: [0, 1], fps: 8 } });

  // --- Llamas animadas ---
  // flameGen: llama con ondulacion, 4 tonos de calor (borde->nucleo), punta con brasas
  function flameGen(w, h, k, pal, seed, wisp) {
    return function (g) {
      var rr = rng(seed * 31 + k * 7 + 1), t = k * 1.05 + seed, y, x;
      for (y = 0; y < h; y++) {
        var u = y / (h - 1), prof = Math.pow(Math.sin(Math.PI * (0.1 + 0.85 * u)), 0.8);
        var hw = (w * 0.42) * prof * (1 + 0.2 * Math.sin(t * 1.3 + y * 0.6));
        var cx = (w - 1) / 2 + Math.sin(t + y * 0.35) * (1 - u) * (w * 0.16);
        for (x = 0; x < w; x++) {
          var dist = Math.abs(x - cx);
          if (dist > hw + 0.2) continue;
          if (u < 0.22 && rr() < 0.3) continue;
          var heat = (1 - dist / Math.max(0.5, hw)) * 0.7 + u * 0.45;
          g.px(x, y, heat > 0.88 ? pal[3] : heat > 0.6 ? pal[2] : heat > 0.33 ? pal[1] : pal[0]);
        }
      }
      if (wisp) for (var i = 0; i < 3; i++) g.px(((w - 1) / 2 + Math.sin(t * 2 + i * 2) * w * 0.25) | 0, (rr() * h * 0.25) | 0, wisp);
    };
  }
  var PAL_FIRE = ['#a31f22', '#ff5a22', '#ffa534', '#fff0a8'], PAL_CURSE = ['#3a1f4a', '#b01e32', '#ff6a2a', '#ffd56a'];
  add('flame', 8, 10, [0, 2, 4].map(function (k) { return flameGen(8, 10, k, PAL_FIRE, 1); }), { outline: false }, { burn: { f: [0, 1, 2, 1], fps: 12 } });
  add('curse_flame', 10, 14, [0, 1, 2, 3, 4, 5].map(function (k) { return flameGen(10, 14, k * 1.3, PAL_CURSE, 2, '#8a3fa8'); }), { outline: false }, { burn: { f: [0, 1, 2, 3, 4, 5], fps: 14 } });
  add('torch_flame', 8, 12, [0, 1, 2, 3, 4, 5].map(function (k) { return flameGen(8, 12, k * 1.4, PAL_FIRE, 3, '#ffc83d'); }), { outline: false }, { burn: { f: [0, 1, 2, 3, 4, 5], fps: 12 } });

  // --- Sombra suave (3 capas de alfa -> borde difuso) ---
  add('shadow', 14, 6, [function (g) { g.e(7, 3, 6, 2, 'rgba(8,4,16,0.16)'); g.e(7, 3, 5, 2, 'rgba(8,4,16,0.16)'); g.e(7, 3, 3, 1, 'rgba(8,4,16,0.2)'); g.e(7, 3, 6, 1, 'rgba(8,4,16,0.1)'); }], { outline: false });

  // --- Luz de antorcha (halo radial; usar con 'lighter') ---
  add('torch_light', 32, 32, [15, 16, 14.2].map(function (R) {
    return function (g) {
      for (var y = 0; y < 32; y++) for (var x = 0; x < 32; x++) {
        var d = Math.hypot(x + 0.5 - 16, y + 0.5 - 16) / R;
        if (d < 1) { var a = Math.pow(1 - d, 2) * 0.55; g.px(x, y, 'rgba(255,' + Math.round(150 - d * 40) + ',60,' + a.toFixed(3) + ')'); }
      }
    };
  }), { outline: false }, { flicker: { f: [0, 1, 2, 1], fps: 9 } });

  // ------------------------------------------------------------------ ESCENARIO POR BIOMAS ('bosque' | 'cripta')
  function dots(g, rr, n, cols, x0, y0, x1, y1) { for (var i = 0; i < n; i++) g.px(x0 + ((rr() * (x1 - x0)) | 0), y0 + ((rr() * (y1 - y0)) | 0), cols[(rr() * cols.length) | 0]); }

  // --- BOSQUE: suelo oscuro con musgo, raices, hojas rojizas y grietas con brasas
  function groundBosque(seed, kind) {
    return function (g) {
      var rr = rng(seed * 9973 + 11), x, y, i;
      var base = ['#1e2a25', '#202c27', '#1c2823'][seed % 3];
      g.r(0, 0, 16, 16, base);
      dots(g, rr, 70, ['#18221e', '#26352d'], 0, 0, 16, 16);
      dots(g, rr, 5, ['#2a2438'], 0, 0, 16, 16);
      if (kind === 'dirt' || kind === 'both') dots(g, rr, 14, ['#2c2622', '#352c25'], 0, 0, 16, 16);
      if (kind === 'grass' || kind === 'both') {
        for (i = 0; i < 3; i++) {
          x = 1 + ((rr() * 14) | 0); y = 2 + ((rr() * 12) | 0);
          g.px(x, y, '#3a5a40'); g.px(x, y - 1, '#4a7550'); if (rr() < 0.5) g.px(x + 1, y, '#34513a');
        }
      }
      if (kind === 'pebble') { x = 3 + ((rr() * 9) | 0); y = 3 + ((rr() * 9) | 0); g.px(x, y, '#4a4658'); g.px(x + 1, y, '#3a3648'); g.px(x, y + 1, '#2a2634'); }
      if (kind === 'moss') { for (i = 0; i < 4; i++) { x = 2 + ((rr() * 11) | 0); y = 2 + ((rr() * 11) | 0); g.d(x, y, 1, '#2c4a38'); g.px(x - 1, y - 1, '#3e6445'); g.px(x + 1, y, '#243d2f'); } }
      if (kind === 'roots') {
        x = 2 + ((rr() * 4) | 0); y = 3 + ((rr() * 8) | 0);
        for (i = 0; i < 9; i++) { g.px(x + i, y + Math.round(Math.sin(i * 0.7 + seed) * 1.5), '#33271e'); g.px(x + i, y + 1 + Math.round(Math.sin(i * 0.7 + seed) * 1.5), '#241a14'); }
        g.px(x + 4, y + 3, '#33271e'); g.px(x + 5, y + 4, '#241a14'); g.px(x + 6, y - 2, '#33271e');
      }
      if (kind === 'leaves') { for (i = 0; i < 6; i++) { x = (rr() * 15) | 0; y = (rr() * 15) | 0; g.px(x, y, rr() < 0.5 ? '#5a2a24' : '#7a3a22'); g.px(x + 1, y, '#3a1c1c'); } }
      if (kind === 'cracked') {
        x = 3 + ((rr() * 3) | 0); y = 3;
        for (i = 0; i < 10; i++) { g.px(x, y, '#120c10'); if (i % 3 === 1) x += (rr() < 0.5 ? 1 : -1); y++; if (i === 4) g.px(x, y, '#ff8a2a'); }
        g.px(x + 1, 9, '#c8281e'); g.px(x - 2, 6, '#120c10');
      }
    };
  }
  var gk = ['plain', 'grass', 'dirt', 'both', 'pebble', 'grass', 'moss', 'roots', 'leaves', 'cracked'];
  for (var gi = 0; gi < 10; gi++) addB('bosque', 'ground' + gi, 16, 16, [groundBosque(gi, gk[gi])], { outline: false });

  // --- CRIPTA: losas con aparejo, grietas, sangre, runas grabadas
  function groundCripta(seed, kind) {
    return function (g) {
      var rr = rng(seed * 7919 + 3), x, y, i;
      g.r(0, 0, 16, 16, ['#231e2d', '#252030', '#211c2b'][seed % 3]);
      dots(g, rr, 60, ['#1c1825', '#2c2638'], 0, 0, 16, 16);
      // juntas (aparejo a soga, siempre encajan al repetir)
      g.r(0, 0, 16, 1, '#120e19'); g.r(0, 8, 16, 1, '#120e19'); g.r(0, 0, 1, 8, '#120e19'); g.r(8, 8, 1, 8, '#120e19');
      g.r(1, 1, 15, 1, '#322b40'); g.r(9, 9, 7, 1, '#322b40'); g.r(1, 1, 1, 7, '#2e2839'); g.r(9, 9, 1, 7, '#2e2839');
      g.r(1, 7, 15, 1, '#1a1522'); g.r(9, 15, 7, 1, '#1a1522'); g.r(0, 15, 8, 1, '#1a1522');
      if (kind === 'cracked') { x = 3 + ((rr() * 4) | 0); y = 2; for (i = 0; i < 6; i++) { g.px(x, y, '#0e0a14'); y++; if (rr() < 0.5) x += rr() < 0.5 ? 1 : -1; } g.px(x + 1, y, '#0e0a14'); }
      if (kind === 'moss') { for (i = 0; i < 4; i++) { x = 2 + ((rr() * 12) | 0); y = 2 + ((rr() * 12) | 0); g.px(x, y, '#3a3556'); g.px(x + 1, y, '#2c2842'); g.px(x, y + 1, '#4a4468'); } }
      if (kind === 'blood') { x = 5 + ((rr() * 5) | 0); y = 4 + ((rr() * 5) | 0); g.d(x, y, 2, '#4a1620'); g.px(x - 1, y - 1, '#6a1e2a'); g.px(x + 2, y + 1, '#4a1620'); g.px(x, y + 3, '#3a1018'); }
      if (kind === 'rune') { g.ln(5, 11, 11, 11, 'rgba(255,138,42,0.35)'); g.ln(8, 10, 8, 14, 'rgba(255,138,42,0.35)'); g.px(8, 12, 'rgba(255,200,120,0.6)'); }
      if (kind === 'bones') { g.px(10, 4, '#a89e8c'); g.px(11, 4, '#c9c0ac'); g.px(12, 5, '#a89e8c'); g.px(4, 12, '#8a8070'); g.px(5, 12, '#a89e8c'); }
      if (kind === 'water') { g.r(3, 11, 5, 2, '#1a2a40'); g.px(4, 11, '#2f4a6a'); g.px(6, 12, '#2f4a6a'); }
    };
  }
  var ck = ['plain', 'cracked', 'plain', 'moss', 'blood', 'rune', 'bones', 'cracked', 'water', 'plain'];
  for (var ci = 0; ci < 10; ci++) addB('cripta', 'ground' + ci, 16, 16, [groundCripta(ci, ck[ci])], { outline: false });

  // --- rocas
  function rock(w, h, seed, pal, mossy) {
    return function (g) {
      var rr = rng(seed);
      var cx = w / 2 - 0.5, cy = h / 2 + 1, rx = w / 2 - 1.5, ry = h / 2 - 2;
      g.e(cx, cy + 1, rx, ry, pal[0]);
      g.e(cx, cy, rx, ry, pal[1]);
      g.e(cx - 1, cy - 2, Math.max(2, rx - 3), Math.max(1, ry - 3), pal[2]);
      for (var i = 0; i < w; i++) if (rr() < 0.25) g.px(2 + ((rr() * (w - 4)) | 0), 2 + ((rr() * (h - 4)) | 0), pal[4]);
      g.px(Math.round(cx - 2), Math.round(cy - ry + 1), pal[3]);
      if (mossy) { for (var k = 0; k < 5; k++) g.px(Math.round(cx - 3 + k * 1.5), Math.round(cy - ry + 1 + (k % 2)), mossy[0]); g.px(Math.round(cx), Math.round(cy - ry), mossy[1]); }
    };
  }
  var ROCK_B = ['#3b3548', '#625b74', '#7a738d', '#a59fb8', '#4a4459'], ROCK_C = ['#2c2638', '#4a4458', '#5c566e', '#8a849c', '#3a3446'];
  addB('bosque', 'rock0', 14, 11, [rock(14, 11, 3, ROCK_B, ['#4a7550', '#6a9a62'])], { ol: C.ol });
  addB('bosque', 'rock1', 18, 13, [rock(18, 13, 5, ROCK_B, null)], { ol: C.ol });
  addB('bosque', 'rock2', 9, 7, [rock(9, 7, 8, ROCK_B, ['#4a7550', '#6a9a62'])], { ol: C.ol });
  addB('cripta', 'rock0', 14, 11, [rock(14, 11, 3, ROCK_C, ['#5a4a78', '#7a68a0'])], { ol: C.ol });
  addB('cripta', 'rock1', 18, 13, [rock(18, 13, 5, ROCK_C, null)], { ol: C.ol });
  addB('cripta', 'rock2', 9, 7, [rock(9, 7, 8, ROCK_C, ['#5a4a78', '#7a68a0'])], { ol: C.ol });

  // --- hierba / hongos
  function grassB(seed) {
    return function (g) {
      var rr = rng(seed * 31 + 5), cols = ['#2f5a3c', '#3f7a4a', '#5aa05a', '#264a33'];
      for (var i = 0; i < 6; i++) {
        var x = 1 + ((i * 1.2 + rr() * 1.2) | 0), h = 2 + ((rr() * 4) | 0), lean = ((rr() * 3) | 0) - 1;
        g.ln(x, 6, x + lean, 6 - h, cols[(rr() * 4) | 0]);
      }
      g.r(1, 6, 6, 1, '#1f3a2c');
    };
  }
  function grassC(seed) { // hierba seca y espinosa de cripta
    return function (g) {
      var rr = rng(seed * 17 + 9), cols = ['#5a5040', '#7a6e52', '#8f8264', '#40382c'];
      for (var i = 0; i < 5; i++) {
        var x = 1 + ((i * 1.4 + rr()) | 0), h = 2 + ((rr() * 4) | 0), lean = ((rr() * 3) | 0) - 1;
        g.ln(x, 6, x + lean * 2, 6 - h, cols[(rr() * 4) | 0]);
      }
      g.r(1, 6, 6, 1, '#2c261e');
    };
  }
  for (var hi = 1; hi <= 3; hi++) { addB('bosque', 'grass' + (hi - 1), 8, 8, [grassB(hi)], { ol: '#0f1c14' }); addB('cripta', 'grass' + (hi - 1), 8, 8, [grassC(hi)], { ol: '#17120e' }); }
  addB('bosque', 'mushroom', 8, 8, [function (g) {
    g.r(3, 4, 2, 3, '#d8cfe0'); g.e(4, 3, 3, 2, '#8a3fa8'); g.r(1, 4, 6, 1, '#6a2a88'); g.px(3, 2, '#e9b3ff'); g.px(5, 3, '#e9b3ff'); g.px(4, 1, '#c880e6');
  }], { ol: C.ol });
  addB('cripta', 'mushroom', 8, 8, [function (g) {
    g.r(3, 4, 2, 3, '#b8d0d8'); g.e(4, 3, 3, 2, '#2f7f9a'); g.r(1, 4, 6, 1, '#1f5f78'); g.px(3, 2, '#b8f0ff'); g.px(5, 3, '#8ad8f0'); g.px(4, 1, '#6ac0dc');
  }], { ol: C.ol });

  // --- arbustos (14x10)
  function bush(seed, dead) {
    return function (g) {
      var rr = rng(seed * 101 + 7), i;
      if (!dead) {
        var bl = [[4, 6, 3], [8, 5, 4], [11, 6, 3], [6, 4, 3], [9, 3, 2]];
        bl.forEach(function (b) { g.d(b[0], b[1] + 1, b[2], '#16301f'); });
        bl.forEach(function (b) { g.d(b[0], b[1], b[2], '#24472f'); });
        bl.forEach(function (b) { g.d(b[0] - 1, b[1] - 1, Math.max(1, b[2] - 2), '#3a7048'); });
        dots(g, rr, 8, ['#4f9058', '#2f5a3c'], 2, 1, 12, 8);
        g.px(5, 6, '#d1342c'); g.px(9, 4, '#d1342c'); g.px(11, 7, '#8f1d28'); g.px(4, 3, '#f05a45');
      } else {
        for (i = 0; i < 7; i++) {
          var x0 = 3 + i * 1.3, a = -1.2 + i * 0.4 + rr() * 0.3, L = 4 + rr() * 4;
          g.ln(x0, 9, x0 + Math.cos(a - 1.57) * L * 0.8 + (i - 3) * 0.6, 9 - L, i % 2 ? '#3a3042' : '#5a4a52');
          g.px(x0 + (i - 3) * 0.6, 9 - L, '#8a7a82');
        }
        g.px(6, 3, '#ff8a2a'); g.px(10, 5, '#c8281e');
      }
    };
  }
  addB('bosque', 'bush0', 14, 10, [bush(1, false)], { ol: '#0f1c14' }); addB('bosque', 'bush1', 14, 10, [bush(2, false)], { ol: '#0f1c14' });
  addB('cripta', 'bush0', 14, 10, [bush(1, true)], { ol: C.ol }); addB('cripta', 'bush1', 14, 10, [bush(2, true)], { ol: C.ol });

  // --- huesos (iguales en ambos biomas)
  var BONE = '#d8cfc0', BONE_S = '#a89e8c';
  var boneFns = {
    bones0: [12, 9, function (g) { // costillar
      g.ln(2, 1, 2, 7, BONE_S);
      for (var i = 0; i < 4; i++) { g.ln(2, 1 + i * 2, 8 - i % 2, 2 + i * 2 - (i === 0 ? 0 : 0), BONE); g.px(8 - i % 2, 2 + i * 2, BONE_S); }
      g.px(1, 0, BONE); g.px(3, 0, BONE_S);
    }],
    bones1: [8, 7, function (g) { // craneo de cordero
      g.e(4, 3, 3, 2, BONE); g.r(2, 5, 5, 2, BONE_S); g.px(3, 3, '#14101c'); g.px(5, 3, '#14101c'); g.px(4, 5, '#14101c');
      g.px(1, 1, BONE_S); g.px(0, 2, BONE); g.px(7, 1, BONE_S); g.px(8, 2, BONE); g.px(3, 1, '#ffffff');
    }],
    bones2: [12, 6, function (g) { // huesos sueltos
      g.ln(1, 1, 8, 3, BONE); g.px(0, 1, BONE_S); g.px(0, 0, BONE_S); g.px(9, 3, BONE_S); g.px(9, 4, BONE_S);
      g.ln(3, 5, 10, 4, BONE_S); g.px(2, 5, BONE); g.px(11, 4, BONE);
    }]
  };
  Object.keys(boneFns).forEach(function (n) { ['bosque', 'cripta'].forEach(function (b) { addB(b, n, boneFns[n][0], boneFns[n][1], [boneFns[n][2]], { ol: C.ol }); }); });

  // --- tocones (bosque) / columnas rotas (cripta)
  function stump(w, h, seed) {
    return function (g) {
      var rr = rng(seed), cx = w / 2 - 0.5;
      g.r(1, 4, w - 2, h - 5, '#4a3222'); g.r(w - 4, 4, 3, h - 5, '#33231a');
      g.px(0, h - 1, '#33231a'); g.px(w - 1, h - 1, '#33231a'); g.px(1, h - 1, '#4a3222');
      for (var y = 4; y < h - 1; y += 2) g.px(2 + ((rr() * (w - 5)) | 0), y, '#5c4230');
      g.e(cx, 3.5, w / 2 - 1.5, 2.5, '#7a5a3a'); g.e(cx, 3.5, w / 2 - 3, 1, '#9a7a52'); g.px(cx, 3.5, '#6a4a2e');
      g.px(2, 5, '#5aa05a'); g.px(3, 6, '#3f7a4a');
    };
  }
  function pillar(w, h, seed) {
    return function (g) {
      var rr = rng(seed), cx = w / 2 - 0.5;
      g.r(1, 3, w - 2, h - 4, '#5c566e'); g.r(w - 4, 3, 3, h - 4, '#443e56'); g.r(2, 4, 2, h - 6, '#7a738d');
      g.r(0, h - 2, w, 2, '#4a4458'); g.r(0, 2, w, 1, '#6c6682');
      g.e(cx, 2.5, w / 2 - 1.5, 2, '#847d9a'); g.px(cx - 1, 2, '#a59fb8');
      g.ln(4, h - 3, 6, 5, '#2c2638'); g.px(5, 7, '#2c2638');
      for (var i = 0; i < 4; i++) g.px(1 + ((rr() * (w - 2)) | 0), 4 + ((rr() * (h - 8)) | 0), '#7a6aa0');
    };
  }
  addB('bosque', 'stump0', 12, 10, [stump(12, 10, 1)], { ol: C.ol }); addB('bosque', 'stump1', 9, 8, [stump(9, 8, 2)], { ol: C.ol });
  addB('cripta', 'stump0', 12, 10, [pillar(12, 10, 1)], { ol: C.ol }); addB('cripta', 'stump1', 9, 8, [pillar(9, 8, 2)], { ol: C.ol });

  // --- tumba / marcador
  addB('bosque', 'grave', 10, 14, [function (g) {
    g.r(4, 0, 2, 13, '#5c4230'); g.r(1, 3, 8, 2, '#5c4230'); g.r(5, 0, 1, 13, '#7a5a3a'); g.r(1, 3, 8, 1, '#7a5a3a');
    g.r(3, 12, 4, 1, '#2c2638'); g.px(2, 12, '#3f7a4a'); g.px(7, 12, '#4a7550'); g.px(4, 6, '#d1342c');
  }], { ol: C.ol });
  addB('cripta', 'grave', 10, 14, [function (g) {
    g.r(1, 4, 8, 9, '#5c566e'); g.e(5, 4, 4, 3, '#5c566e'); g.r(7, 5, 2, 8, '#443e56'); g.r(2, 4, 2, 8, '#7a738d');
    g.px(5, 4, '#14101c'); g.px(4, 5, '#14101c'); g.px(6, 5, '#14101c'); g.px(5, 7, '#14101c'); g.px(4, 8, '#14101c'); g.px(6, 8, '#14101c');
    g.r(0, 12, 10, 2, '#3a3446'); g.px(3, 6, '#ff8a2a'); g.px(8, 3, '#a59fb8');
  }], { ol: C.ol });

  // --- runas de suelo (4 variantes)
  function runeFn(v, pal) {
    return function (g) {
      var c1 = pal[0], c2 = pal[1];
      g.d(8, 8, 6, pal[2]);
      if (v === 0) { g.ln(8, 3, 8, 13, c1); g.ln(8, 5, 4, 9, c1); g.ln(8, 5, 12, 9, c1); g.ln(5, 12, 11, 12, c2); }
      else if (v === 1) { g.ln(4, 4, 12, 12, c1); g.ln(12, 4, 4, 12, c1); g.ln(8, 2, 8, 14, c2); g.px(8, 8, 'rgba(255,230,160,0.95)'); }
      else if (v === 2) { for (var a = 0; a < 16; a++) g.px(8 + Math.cos(a / 16 * 6.283) * 5, 8 + Math.sin(a / 16 * 6.283) * 5, a % 2 ? c1 : c2); g.px(8, 8, c1); g.ln(8, 6, 8, 10, c2); }
      else { g.ln(4, 12, 8, 3, c1); g.ln(8, 3, 12, 12, c1); g.ln(4, 12, 12, 12, c2); g.ln(6, 8, 10, 8, c2); g.px(8, 10, 'rgba(255,230,160,0.9)'); }
    };
  }
  var RP_B = ['rgba(255,138,42,0.75)', 'rgba(185,128,214,0.55)', 'rgba(255,100,40,0.10)'], RP_C = ['rgba(200,120,255,0.75)', 'rgba(255,138,42,0.6)', 'rgba(150,80,220,0.10)'];
  for (var rv = 0; rv < 4; rv++) { addB('bosque', 'rune' + rv, 16, 16, [runeFn(rv, RP_B)], { outline: false }); addB('cripta', 'rune' + rv, 16, 16, [runeFn(rv, RP_C)], { outline: false }); }

  // --- antorcha (poste/brasero). La llama es el sprite 'torch_flame' y el halo 'torch_light'
  addB('bosque', 'torch', 8, 16, [function (g) {
    g.r(3, 5, 2, 10, '#5c4230'); g.r(3, 5, 1, 10, '#7a5a3a'); g.r(2, 14, 4, 2, '#33231a');
    g.r(1, 3, 6, 3, '#2c2638'); g.r(2, 2, 4, 1, '#3a3446'); g.px(2, 3, '#6a6488'); g.r(2, 5, 4, 1, '#9a4a22');
    g.px(3, 4, '#ff8a2a'); g.px(4, 4, '#c8281e');
  }], { ol: C.ol });
  addB('cripta', 'torch', 8, 16, [function (g) {
    g.r(3, 6, 2, 9, '#2c2638'); g.r(3, 6, 1, 9, '#4a4458'); g.r(1, 14, 6, 2, '#1a1522'); g.px(2, 13, '#4a4458');
    g.r(0, 3, 8, 2, '#3a3446'); g.r(1, 5, 6, 1, '#2c2638'); g.r(2, 6, 4, 1, '#2c2638'); g.px(1, 3, '#7a738d'); g.px(0, 2, '#4a4458'); g.px(7, 2, '#4a4458');
    g.px(3, 4, '#ff8a2a'); g.px(5, 4, '#c8281e');
  }], { ol: C.ol });

  // --- niebla (capas suaves, translucidas; dibujar desplazando lentamente)
  function fogFn(seed, tint) {
    return function (g) {
      var rr = rng(seed), x, y;
      for (y = 0; y < 24; y++) for (x = 0; x < 48; x++) {
        var dx = (x - 23.5) / 23.5, dy = (y - 11.5) / 11.5, d = dx * dx + dy * dy;
        if (d >= 1) continue;
        var n = 0.5 + 0.5 * Math.sin(x * 0.45 + seed) * Math.cos(y * 0.6 - seed) + (rr() - 0.5) * 0.35;
        var a = Math.max(0, (1 - d)) * 0.16 * (0.4 + n);
        if (a > 0.012) g.px(x, y, 'rgba(' + tint + ',' + a.toFixed(3) + ')');
      }
    };
  }
  addB('bosque', 'fog0', 48, 24, [fogFn(1, '120,150,140')], { outline: false }); addB('bosque', 'fog1', 48, 24, [fogFn(2, '110,130,130')], { outline: false });
  addB('cripta', 'fog0', 48, 24, [fogFn(1, '130,110,170')], { outline: false }); addB('cripta', 'fog1', 48, 24, [fogFn(2, '110,100,150')], { outline: false });

  add('ritual_circle', 64, 64, [function (g) {
    var cx = 31.5, cy = 31.5, c1 = 'rgba(255,138,42,0.30)', c2 = 'rgba(185,128,214,0.26)', c3 = 'rgba(255,200,120,0.5)';
    var x, y, d, a;
    for (y = 0; y < 64; y++) for (x = 0; x < 64; x++) {
      d = Math.hypot(x - cx, y - cy); a = Math.atan2(y - cy, x - cx);
      if (Math.abs(d - 30) < 0.7 || Math.abs(d - 22) < 0.6) g.px(x, y, c1);
      else if (Math.abs(d - 27) < 0.5 && ((Math.floor((a + Math.PI) / (Math.PI * 2) * 48)) % 2 === 0)) g.px(x, y, c2);
      else if (d < 22 && Math.abs(d - 10) < 0.5) g.px(x, y, c2);
    }
    for (var k = 0; k < 5; k++) {
      var a0 = -Math.PI / 2 + k * 2 * Math.PI / 5, a1 = -Math.PI / 2 + ((k + 2) % 5) * 2 * Math.PI / 5;
      g.ln(cx + Math.cos(a0) * 21, cy + Math.sin(a0) * 21, cx + Math.cos(a1) * 21, cy + Math.sin(a1) * 21, c1);
    }
    for (var m = 0; m < 10; m++) {
      var an = m * Math.PI / 5, rx = cx + Math.cos(an) * 26, ry = cy + Math.sin(an) * 26;
      g.d(rx, ry, 2, 'rgba(255,120,40,0.18)');
      g.px(rx, ry, c3); g.px(rx + 1, ry - 1, c3); g.px(rx - 1, ry + 1, c3);
      if (m % 2) g.px(rx - 1, ry - 1, c3);
    }
    g.d(cx, cy, 2, 'rgba(255,170,70,0.35)'); g.px(cx, cy, c3);
  }], { outline: false });

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
    bosque: { label: 'Bosque corrupto', vignette: '8,4,16', fog: '120,150,140', light: '255,150,60', bg: '#0d0a14' },
    cripta: { label: 'Cripta ritual', vignette: '6,3,18', fog: '130,110,170', light: '255,130,70', bg: '#0b0912' }
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
    biomeInfo: function (name) { var i = BIOME_INFO[name || curBiome]; return i && { name: name || curBiome, label: i.label, bg: i.bg, decor: ['rock0', 'rock1', 'rock2', 'grass0', 'grass1', 'grass2', 'mushroom', 'bush0', 'bush1', 'bones0', 'bones1', 'bones2', 'stump0', 'stump1', 'grave', 'rune0', 'rune1', 'rune2', 'rune3', 'torch'], tiles: 10 }; }
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
    g.addColorStop(0, 'rgba(' + tint + ',0)'); g.addColorStop(0.7, 'rgba(' + tint + ',' + (st * 0.55).toFixed(2) + ')'); g.addColorStop(1, 'rgba(' + tint + ',' + st.toFixed(2) + ')');
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
    if (o.light !== false) Assets.drawLight(ctx2, x, y - 34, tMs, o.lightScale || 3.4);
    ctx2.drawImage(f, Math.round(x - f.width / 2), Math.round(y - 32 + 10 - f.height));
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
    var crypt = curBiome === 'cripta';
    put(['bush0', 'bush1'], crypt ? 10 : 22, 14);
    put(['bones0', 'bones1', 'bones2'], crypt ? 22 : 12, 10);
    put(['stump0', 'stump1'], crypt ? 12 : 10, 16);
    put(['grave'], crypt ? 9 : 4, 20);
    put(['rune2', 'rune3'], 10, 24);
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

  window.Assets = Assets;
})();
