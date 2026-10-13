/*!
 * assets.js - Generador de recursos 100% originales para "Ember Flock" (survival-lamb).
 * Sin dependencias, sin ficheros externos: sprites pixel-art por codigo (canvas) y audio WebAudio.
 * Script clasico (sin modulos). Expone `window.Assets`. Licencia: propia/libre (ver studio/assets/ASSETS.md).
 *
 * ---------------------------------------------------------------- SPRITES
 * Todos se dibujan a resolucion "base" y se escalan x2 (Assets.scale) con nearest-neighbor.
 * Tamaños abajo = pixeles FINALES (base x2). Los personajes miran a la DERECHA (hay que voltear/rotar en el juego).
 * Assets.sprite(name, frame) -> HTMLCanvasElement.  frame = numero (cicla) | 'anim' | 'anim:n'.
 *
 *  name        tam final   frames (anims)
 *  player      48x48       0-1 idle | 2-5 walk | 6-8 attack (windup, golpe, recuperacion) | 9-12 roll | 13 hurt
 *  worm        32x32       0-1 walk                                   (Gusano)
 *  archer      40x40       0-1 walk | 2 shoot                         (Cultista arquero)
 *  boar        48x36       0-1 walk | 2 charge                        (Jabali)
 *  bomb        32x32       0-1 walk | 2-3 lit (parpadeo)              (Bomba)
 *  warlock     40x48       0-1 idle | 2 cast                          (Brujo)
 *  boss        96x96       0-1 idle | 2 swing (cayado) | 3 slam       (Pastor Corrupto)
 *  arrow       24x10       0-1 flecha magica del arquero
 *  thorn       20x10       0   espina del jefe
 *  fireball    20x20       0-1 proyectil de fuego del jugador
 *  slash       44x64       0-2 arco del tajo (origen = centro del jugador: x=4/44, y=50%)
 *  explosion   64x64       0-2 explosion de la bomba
 *  spark 6x6 (0-1) | ember 6x6 (0-1) | smoke 16x16 (0-2) | dust 12x12 (0-1) | flame 16x20 (0-2) | shadow 28x12 (0)
 *  ground0..ground5  32x32 tiles de suelo oscuro de bosque (repetibles, sin costuras)
 *  rock0 (28x22) rock1 (36x26) rock2 (18x14) | grass0..grass2 (16x16) | mushroom (16x16) | rune0, rune1 (32x32)
 *  ritual_circle 128x128   circulo ritual central (semitransparente)
 *
 * Otras: Assets.list() -> [{name,w,h,frames,anims}] | Assets.info(name) | Assets.frames(name) -> n
 *        Assets.animFrame(name, anim, tMs) -> canvas segun fps | Assets.addToPhaser(scene.textures) (claves "name:frame")
 *
 * ---------------------------------------------------------------- AUDIO (WebAudio, estilo sfxr)
 * Assets.unlock()  -> Promise<bool>; llamar en un gesto del usuario (tambien se auto-engancha a pointerdown/keydown).
 * Assets.sfx(name, {pitch, vol})  nombres: hit, hit_heavy, roll, hurt, enemy_die, pickup, card_select, special,
 *                                 boss_roar, wave_start  (extras: shoot, explosion, game_over)
 * Assets.music.start() / stop() / setIntensity(0|1 jefe) ; Assets.setVolume({master,sfx,music}) ; Assets.setMuted(bool)
 * Detalle completo en games/survival-lamb/ASSETS_API.md
 */
(function () {
  'use strict';
  var SCALE = 2;
  var reg = {};          // name -> {w,h,frames:[canvas],anims,fps}
  var order = [];

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

  function outline(x, w, h, col) {
    var im = x.getImageData(0, 0, w, h), d = im.data, out = [];
    var rgb = col;
    function a(xx, yy) { return xx < 0 || yy < 0 || xx >= w || yy >= h ? 0 : d[(yy * w + xx) * 4 + 3]; }
    for (var yy = 0; yy < h; yy++) for (var xx = 0; xx < w; xx++) {
      if (a(xx, yy) < 40 && (a(xx - 1, yy) > 100 || a(xx + 1, yy) > 100 || a(xx, yy - 1) > 100 || a(xx, yy + 1) > 100)) out.push(xx, yy);
    }
    x.fillStyle = rgb;
    for (var i = 0; i < out.length; i += 2) x.fillRect(out[i], out[i + 1], 1, 1);
  }

  // Dibuja un frame a escala base y lo devuelve escalado con nearest-neighbor.
  function frame(w, h, draw, opt) {
    opt = opt || {};
    var c = mkCanvas(w, h), x = c.getContext('2d'), g = makeG(x);
    draw(g, w, h);
    if (opt.outline !== false) outline(x, w, h, opt.ol || C.ol);
    var s = mkCanvas(w * SCALE, h * SCALE), sx = s.getContext('2d');
    sx.imageSmoothingEnabled = false;
    sx.drawImage(c, 0, 0, w * SCALE, h * SCALE);
    return s;
  }
  function add(name, w, h, drawFns, opt, anims, fps) {
    var fr = [];
    for (var i = 0; i < drawFns.length; i++) fr.push(frame(w, h, drawFns[i], opt));
    reg[name] = { name: name, w: w * SCALE, h: h * SCALE, frames: fr, anims: anims || null };
    order.push(name);
  }

  var C = {
    ol: '#14101c',
    wool: '#f5f0e8', woolS: '#c9bfd8', woolH: '#ffffff',
    face: '#6b5478', faceS: '#4a3a58', ear: '#e58fa0', eye: '#1a1224', nose: '#7a3b4e',
    cape: '#d1342c', capeD: '#8f1d28', capeH: '#f05a45',
    steel: '#dfe8f2', steelS: '#8fa0b8', gold: '#f0b238', goldS: '#b87a22',
    leg: '#3b2f48', hoof: '#221a2c',
    ember: '#ff8a2a', fire: '#ffc83d', hot: '#fff0a8'
  };

  // ------------------------------------------------------------------ JUGADOR
  function sword(g, hx, hy, tx, ty) {
    g.ln(hx, hy, tx, ty, C.steel);
    var dx = tx - hx, dy = ty - hy, len = Math.sqrt(dx * dx + dy * dy) || 1, ux = dx / len, uy = dy / len;
    // sombra del filo y punta
    g.px(hx + ux * 2 - uy * 0.0, hy + uy * 2, C.steelS);
    g.px(tx, ty, C.hot);
    // guarda (perpendicular) y empuñadura
    var gx = hx + ux * 1.2, gy = hy + uy * 1.2;
    g.px(gx - uy * 1.5, gy + ux * 1.5, C.gold); g.px(gx, gy, C.gold); g.px(gx + uy * 1.5, gy - ux * 1.5, C.gold);
    g.px(hx - ux, hy - uy, C.goldS);
  }
  function lamb(g, o) {
    var by = o.by || 0, L = o.legs || [0, 0], fl = o.fl || 0;
    // patas
    g.r(8 + L[0], 17 + by, 2, 3 - Math.max(0, by), C.leg); g.r(13 + L[1], 17 + by, 2, 3 - Math.max(0, by), C.leg);
    g.r(8 + L[0], 19, 2, 1, C.hoof); g.r(13 + L[1], 19, 2, 1, C.hoof);
    // capa (atras)
    g.d(7, 12 + by, 4, C.cape);
    g.r(2, 10 + by + fl, 5, 5, C.cape); g.r(1, 11 + by + fl, 2, 4, C.capeD);
    g.r(3, 14 + by + fl, 4, 1, C.capeD); g.r(4, 9 + by, 3, 1, C.capeH);
    // lana: sombra primero (1px abajo), luego color
    var tufts = [[8, 10, 3], [11, 8, 3], [12, 13, 3], [8, 14, 3], [13, 11, 3], [10, 11, 3]];
    var i;
    for (i = 0; i < tufts.length; i++) g.d(tufts[i][0], tufts[i][1] + by + 1, tufts[i][2], C.woolS);
    for (i = 0; i < tufts.length; i++) g.d(tufts[i][0], tufts[i][1] + by, tufts[i][2], C.wool);
    g.px(9, 8 + by, C.woolH); g.px(12, 6 + by, C.woolH); g.px(10, 9 + by, C.woolH); g.px(7, 11 + by, C.woolS); g.px(11, 15 + by, C.woolS);
    // bufanda de la capa
    g.r(13, 9 + by, 2, 5, C.cape); g.px(13, 9 + by, C.capeH); g.r(13, 13 + by, 2, 1, C.capeD);
    // cabeza
    g.r(15, 7 + by, 2, 3, C.ear); g.r(18, 7 + by, 2, 2, C.ear);
    g.d(17, 11 + by, 3, C.face);
    g.px(17, 14 + by, C.faceS); g.px(18, 14 + by, C.faceS); g.px(15, 12 + by, C.faceS);
    if (o.hurt) { g.px(18, 10 + by, C.eye); g.px(19, 11 + by, C.eye); g.px(18, 11 + by, C.eye); g.px(19, 10 + by, C.eye); g.px(18, 13 + by, C.eye); }
    else { g.r(18, 10 + by, 2, 2, '#ffd36a'); g.px(19, 11 + by, C.eye); }
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
  var pl = [];
  pl.push(function (g) { lamb(g, { by: 0, sword: [20, 16, 23, 8] }); });
  pl.push(function (g) { lamb(g, { by: 1, sword: [20, 17, 23, 9], legs: [0, 0] }); });
  var wb = [0, -1, 0, -1], wl = [[-1, 1], [0, 0], [1, -1], [0, 0]], wf = [0, 1, 0, -1];
  for (var wi = 0; wi < 4; wi++) (function (i) {
    pl.push(function (g) { lamb(g, { by: wb[i], legs: wl[i], fl: wf[i], sword: [20, 16 + wb[i], 23, 8 + wb[i]] }); });
  })(wi);
  pl.push(function (g) { lamb(g, { by: 0, legs: [0, 1], sword: [14, 11, 10, 1], fl: -1 }); });                  // windup
  pl.push(function (g) { lamb(g, { by: 0, legs: [-1, 2], sword: [17, 13, 23, 13], fl: 2 }); });                  // golpe
  pl.push(function (g) { lamb(g, { by: 1, legs: [-1, 1], sword: [17, 15, 22, 20], fl: 1 }); });                  // recuperacion
  for (var ri = 0; ri < 4; ri++) pl.push(ball(ri));
  pl.push(function (g) { lamb(g, { by: 1, hurt: true, sword: [16, 16, 18, 10], fl: -1 }); });
  add('player', 24, 24, pl, null, {
    idle: { f: [0, 1], fps: 3 }, walk: { f: [2, 3, 4, 5], fps: 10 }, attack: { f: [6, 7, 8], fps: 14 },
    roll: { f: [9, 10, 11, 12], fps: 14 }, hurt: { f: [13], fps: 1 }
  });

  // ------------------------------------------------------------------ ENEMIGOS
  function worm(ph) {
    return function (g) {
      var cols = ['#44662a', '#5a8236', '#6f9a3c', '#86b64a'];
      var seg = [[3, 0], [6, 1], [9, 2], [12, 3]];
      for (var i = 0; i < 4; i++) {
        var s = seg[i], oy = Math.round(Math.sin(ph + i * 1.3) * 1.4), r = i === 3 ? 3 : 2 + (i > 0 ? 1 : 0);
        g.d(s[0], 10 + oy, r, cols[i]);
        g.px(s[0] - 1, 8 + oy, '#a9d46a'); g.px(s[0] + 1, 12 + oy, '#8a5ab0'); // brillo + mancha corrupta
        if (i === 3) {
          g.px(13, 8 + oy, '#ff3b30'); g.px(14, 8 + oy, '#ffd36a');
          g.px(14, 11 + oy, '#ffffff'); g.px(12, 12 + oy, '#ffffff'); g.px(13, 12 + oy, '#5a1a2a');
        }
      }
    };
  }
  add('worm', 16, 16, [worm(0), worm(Math.PI)], null, { walk: { f: [0, 1], fps: 6 } });

  function archer(o) {
    return function (g) {
      var by = o.by || 0, robe = '#5b3a82', robeD = '#3c2459', hh = o.hem || 0;
      // faldon
      for (var y = 8; y <= 18; y++) {
        var hw = 2 + Math.floor((y - 8) * 0.5);
        g.r(9 - hw + (y > 16 ? hh : 0), y + by, hw * 2 + 1, 1, y > 14 ? robeD : robe);
      }
      g.r(6, 13 + by, 7, 1, '#e0a63a'); // cinturon
      g.px(9, 13 + by, '#fff0a8');
      g.r(9, 8 + by, 1, 9, '#7a56a8'); // pliegue
      // capucha
      g.d(9, 6 + by, 4, robe); g.d(10, 7 + by, 2, '#0c0814'); g.r(12, 5 + by, 1, 4, robeD);
      g.px(10, 6 + by, '#ff9a2a'); g.px(12, 6 + by, '#ff9a2a'); g.px(11, 6 + by, '#ffd36a');
      g.px(7, 3 + by, '#7a56a8'); g.px(8, 2 + by, '#7a56a8');
      // arco
      var bx = o.draw ? 15 : 16;
      g.ln(14, 4 + by, 17, 8 + by, '#a0693a'); g.ln(17, 8 + by, 17, 12 + by, '#a0693a'); g.ln(17, 12 + by, 14, 16 + by, '#a0693a');
      g.ln(14, 4 + by, o.draw ? 12 : 14, o.draw ? 10 + by : 4 + by, '#e8e0f0');
      g.ln(o.draw ? 12 : 14, o.draw ? 10 + by : 16 + by, 14, 16 + by, '#e8e0f0');
      if (o.draw) { g.ln(12, 10 + by, 19, 10 + by, '#d9b0ff'); g.px(19, 10 + by, '#ff9a2a'); g.px(18, 9 + by, '#ffd36a'); g.px(18, 11 + by, '#ffd36a'); }
      g.px(bx - 3, 10 + by, robe); g.r(11, 10 + by, 3, 2, '#3c2459');
    };
  }
  add('archer', 20, 20, [archer({ by: 0, hem: 0 }), archer({ by: -1, hem: 1 }), archer({ by: 0, draw: true })], null, { walk: { f: [0, 1], fps: 5 }, shoot: { f: [2], fps: 1 } });

  function boar(o) {
    return function (g) {
      var by = o.by || 0, body = '#7a4a32', dark = '#563222', light = '#97613f', hy = o.low ? 2 : 0;
      var lg = o.legs || [0, 0, 0, 0], lx = [5, 8, 14, 17];
      for (var i = 0; i < 4; i++) { g.r(lx[i] + lg[i], 13 + by, 2, 3, i % 2 ? dark : '#3d2418'); g.px(lx[i] + lg[i], 15, '#1a0f0a'); }
      g.e(11, 9 + by, 8, 5, body); g.e(11, 11 + by, 7, 3, dark); g.e(11, 7 + by, 6, 2, light);
      // lomo erizado
      for (var k = 0; k < 7; k++) { g.px(5 + k * 2, 3 + by + (k % 2), '#2b1810'); g.px(5 + k * 2, 4 + by, '#3d2418'); }
      // cabeza
      g.d(18, 9 + by + hy, 3, light); g.r(20, 10 + by + hy, 3, 3, '#c98b86'); g.px(22, 10 + by + hy, '#3a1a1f'); g.px(22, 12 + by + hy, '#3a1a1f');
      g.px(20, 8 + by + hy, o.rage ? '#ff3b30' : '#ffe08a'); g.px(19, 8 + by + hy, '#14101c');
      g.px(21, 13 + by + hy, '#ffffff'); g.px(21, 14 + by + hy, '#ffffff'); g.px(19, 13 + by + hy, '#ffffff'); // colmillos
      g.r(16, 5 + by + hy, 2, 3, dark); g.px(16, 5 + by + hy, '#c98b86'); // oreja
      if (o.rage) { g.r(0, 6 + by, 3, 1, 'rgba(255,200,120,0.7)'); g.r(1, 10 + by, 3, 1, 'rgba(255,200,120,0.6)'); }
    };
  }
  add('boar', 24, 18, [
    boar({ by: 0, legs: [-1, 1, 1, -1] }), boar({ by: -1, legs: [1, -1, -1, 1] }), boar({ by: 1, low: true, rage: true, legs: [-2, 2, 2, -2] })
  ], null, { walk: { f: [0, 1], fps: 6 }, charge: { f: [2], fps: 1 } });

  function bomb(o) {
    return function (g) {
      var by = o.by || 0, lit = o.lit;
      var b = lit ? (o.lit === 2 ? '#ff6a2a' : '#c8281e') : '#2f2b3f', b2 = lit ? '#8f1414' : '#1f1b2c', hi = lit ? '#ffd36a' : '#6a6488';
      g.r(4 + (o.f || 0), 13, 2, 2, '#14101c'); g.r(10 - (o.f || 0), 13, 2, 2, '#14101c');
      g.d(8, 9 + by, 6, b2); g.d(8, 8 + by, 6, b); g.d(5, 6 + by, 1, hi);
      g.px(4, 8 + by, hi);
      g.r(5, 8 + by, 2, 2, lit ? '#ffffff' : '#ffd36a'); g.r(9, 8 + by, 2, 2, lit ? '#ffffff' : '#ffd36a');
      g.px(5, 7 + by, C.ol); g.px(6, 7 + by, C.ol); g.px(10, 7 + by, C.ol); g.px(11, 7 + by, C.ol); // cejas enfadadas
      g.r(6, 12 + by, 4, 1, lit ? '#fff0a8' : '#8a8498');
      g.r(7, 3 + by, 2, 2, '#6a4a2a'); g.ln(8, 3 + by, 11, 1, '#a0693a');
      g.px(12, 0, lit ? '#ffffff' : '#ff9a2a'); g.px(11, 1, '#ffd36a'); if (lit) { g.px(13, 1, '#ff9a2a'); g.px(12, 2, '#ff9a2a'); g.px(11, 0, '#ffd36a'); }
    };
  }
  add('bomb', 16, 16, [bomb({ f: 1 }), bomb({ f: -1, by: -1 }), bomb({ lit: 1 }), bomb({ lit: 2, by: -1 })], null,
    { walk: { f: [0, 1], fps: 7 }, lit: { f: [2, 3], fps: 8 } });

  function warlock(o) {
    return function (g) {
      var by = o.by || 0, rb = '#2f5d58', rbD = '#1f3f3f';
      for (var y = 9; y <= 21; y++) { var hw = 2 + Math.floor((y - 9) * 0.45); g.r(9 - hw, y + by, hw * 2 + 1, 1, y > 17 ? rbD : rb); }
      g.r(6, 14 + by, 7, 1, '#6a3a82'); g.px(9, 14 + by, '#b980d6');
      // sombrero de pico
      g.r(4, 8 + by, 11, 2, '#2a1f4a'); g.r(6, 5 + by, 7, 3, '#2a1f4a'); g.r(8, 2 + by, 4, 3, '#2a1f4a'); g.r(10, 0 + by, 2, 2, '#2a1f4a');
      g.r(6, 7 + by, 7, 1, '#b980d6');
      g.r(7, 10 + by, 5, 3, '#0c0814'); g.px(8, 11 + by, '#8cff6a'); g.px(11, 11 + by, '#8cff6a');
      // baston + orbe
      var arm = o.cast ? -3 : 0;
      g.ln(16, 8 + by + arm, 16, 20 + by, '#7a5230');
      g.d(16, 6 + by + arm, o.cast ? 3 : 2, '#4fd04a'); g.px(15, 5 + by + arm, '#d6ffb0'); g.px(16, 6 + by + arm, '#8cff6a');
      g.r(13, 12 + by + arm / 2, 3, 2, rbD);
      if (o.cast) { g.px(11, 2, '#8cff6a'); g.px(19, 1, '#8cff6a'); g.px(13, 0, '#d6ffb0'); g.px(18, 5 + by, '#8cff6a'); g.px(14, 1, '#8cff6a'); }
    };
  }
  add('warlock', 20, 24, [warlock({}), warlock({ by: 1 }), warlock({ cast: true })], null, { idle: { f: [0, 1], fps: 3 }, cast: { f: [2], fps: 1 } });

  // ------------------------------------------------------------------ JEFE: PASTOR CORRUPTO (48x48 base)
  function boss(o) {
    return function (g) {
      var by = o.by || 0, rb = '#3b2850', rbD = '#241638', rbH = '#58407a', veins = '#6dff7a';
      var lift = o.slam ? -6 : 0;
      // faldon con jirones
      g.e(21, 29 + by + lift / 2, 16, 14, rbD); g.e(21, 27 + by + lift / 2, 16, 14, rb);
      g.e(17, 22 + by + lift / 2, 8, 6, rbH);
      for (var i = 0; i < 9; i++) { g.r(7 + i * 3.5, 40 + by + lift / 2 + (i % 2) * 2, 3, 3 - (i % 2), rbD); }
      // venas corruptas
      g.ln(12, 30 + by, 17, 34 + by, veins); g.ln(17, 34 + by, 19, 40 + by, veins); g.ln(25, 24 + by, 29, 31 + by, veins);
      g.ln(29, 31 + by, 27, 38 + by, veins); g.ln(13, 22 + by, 10, 28 + by, '#41c05a');
      g.px(24, 35 + by, '#b6ffbe'); g.px(15, 31 + by, '#b6ffbe');
      // cuello de lana sucia
      var wl = [[30, 21], [27, 24], [31, 25], [26, 19], [29, 28], [34, 24]];
      for (var j = 0; j < wl.length; j++) g.d(wl[j][0], wl[j][1] + by + lift, 3, '#8f8aa0');
      for (var j2 = 0; j2 < wl.length; j2++) g.d(wl[j2][0], wl[j2][1] + by + lift - 1, 2, '#bdb6cc');
      // cabeza: craneo de carnero
      var hy = 14 + by + lift;
      // cuernos retorcidos
      g.ln(31, hy - 2, 26, hy - 7, '#9c8a5e'); g.ln(26, hy - 7, 28, hy - 11, '#9c8a5e'); g.ln(28, hy - 11, 32, hy - 11, '#9c8a5e'); g.px(32, hy - 10, '#d6c690');
      g.ln(33, hy - 3, 33, hy - 9, '#7d6c46'); g.ln(33, hy - 9, 37, hy - 11, '#7d6c46'); g.px(38, hy - 10, '#d6c690');
      g.ln(36, hy - 2, 41, hy - 5, '#b8a674');
      g.e(34, hy + 1, 7, 6, '#e8dcc2'); g.e(35, hy + 3, 6, 4, '#d3c5a4');
      g.r(39, hy + 2, 6, 4, '#e8dcc2'); g.r(42, hy + 5, 3, 2, '#bba98a'); g.px(44, hy + 3, '#2a1f1a'); g.px(44, hy + 5, '#2a1f1a');
      g.r(32, hy - 1, 3, 3, '#14101c'); g.r(37, hy - 1, 3, 3, '#14101c');
      var eye = o.rage ? '#ff3b30' : '#ff9a2a';
      g.px(33, hy, eye); g.px(38, hy, eye); g.px(34, hy, '#ffe08a'); g.px(39, hy, '#ffe08a');
      g.px(31, hy + 4, '#8a7a5a'); g.px(30, hy + 2, '#8a7a5a');
      // brazo + baston (cayado)
      var s = o.staff;
      g.ln(s[0], s[1] + by, s[2], s[3] + by, '#8b5a30'); g.ln(s[0] + 1, s[1] + by, s[2] + 1, s[3] + by, '#5c381d');
      var tx = s[2], ty = s[3] + by;
      if (o.hook === 'up') { g.d(tx - 2, ty - 2, 3, '#8b5a30'); g.d(tx - 2, ty - 2, 1, C.ol); g.r(tx - 1, ty, 2, 4, '#8b5a30'); }
      g.d(s[0], s[1] + by, 2, '#2b1f3a'); // mano
      g.px(s[0] + 1, s[1] + by - 1, '#6dff7a'); // brillo corrupto
      if (o.orb) g.d(tx - 3, ty - 3, 1, '#6dff7a');
    };
  }
  add('boss', 48, 48, [
    boss({ staff: [40, 44, 42, 8], hook: 'up', by: 0 }),
    boss({ staff: [40, 44, 42, 9], hook: 'up', by: 1, orb: true }),
    boss({ staff: [34, 26, 46, 34], rage: true, by: 0 }),
    boss({ staff: [38, 30, 40, 2], hook: 'up', slam: true, rage: true, by: 0 })
  ], null, { idle: { f: [0, 1], fps: 2 }, swing: { f: [2], fps: 1 }, slam: { f: [3], fps: 1 } });

  // ------------------------------------------------------------------ PROYECTILES / EFECTOS
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

  function slashFrame(a0, a1, r0, r1, alpha) {
    return function (g) {
      var cx = 2, cy = 16;
      for (var y = 0; y < 32; y++) for (var x = 0; x < 22; x++) {
        var dx = x - cx, dy = y - cy, r = Math.sqrt(dx * dx + dy * dy), a = Math.atan2(dy, dx);
        if (r >= r0 && r <= r1 && a >= a0 && a <= a1) {
          var t = (r - r0) / (r1 - r0);
          // gradiente: borde exterior casi blanco, interior naranja
          var col = t > 0.72 ? 'rgba(255,250,235,' + alpha + ')' : t > 0.4 ? 'rgba(255,200,90,' + alpha * 0.9 + ')' : 'rgba(255,110,40,' + alpha * 0.7 + ')';
          g.px(x, y, col);
        }
      }
    };
  }
  var D = Math.PI / 180;
  add('slash', 22, 32, [slashFrame(-40 * D, 22 * D, 11, 18, 1), slashFrame(-58 * D, 58 * D, 10, 19, 1), slashFrame(-58 * D, 58 * D, 15, 19, 0.45)],
    { outline: false }, { swing: { f: [0, 1, 2], fps: 24 } });

  add('explosion', 32, 32, [
    function (g) { g.d(16, 16, 8, '#ff8a2a'); g.d(16, 16, 6, '#ffc83d'); g.d(16, 16, 3, '#ffffff'); },
    function (g) { g.d(16, 16, 14, 'rgba(255,90,30,0.85)'); g.d(16, 16, 11, '#ff8a2a'); g.d(16, 16, 7, '#ffd34d'); g.d(16, 16, 3, '#fff0a8'); },
    function (g) {
      var rr = rng(7);
      for (var y = 0; y < 32; y++) for (var x = 0; x < 32; x++) {
        var d = Math.hypot(x - 16, y - 16);
        if (d > 11 && d < 15.5 && rr() < 0.75) g.px(x, y, d > 13.5 ? 'rgba(90,40,50,0.55)' : 'rgba(255,100,40,0.6)');
      }
    }
  ], { outline: false }, { boom: { f: [0, 1, 2], fps: 14 } });

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
  add('dust', 6, 6, [
    function (g) { g.d(3, 3, 1, 'rgba(150,130,120,0.8)'); g.px(1, 2, 'rgba(150,130,120,0.6)'); },
    function (g) { g.d(3, 3, 2, 'rgba(150,130,120,0.4)'); }
  ], { outline: false }, { puff: { f: [0, 1], fps: 8 } });
  function flame(seed, h) {
    return function (g) {
      var rr = rng(seed);
      for (var y = 0; y < 10; y++) {
        var t = y / 9, hw = Math.round(Math.sin(Math.min(1, (y + 1) / 8) * Math.PI * 0.9) * 3 + 0.3);
        if (y < 10 - h) continue;
        for (var x = -hw; x <= hw; x++) {
          var core = Math.abs(x) <= hw - 1 && y > 3;
          var col = y > 7 ? (core ? '#fff0a8' : '#ffc83d') : y > 4 ? (core ? '#ffc83d' : '#ff8a2a') : (rr() < 0.7 ? '#ff6a2a' : '#c8281e');
          g.px(4 + x, y, col);
        }
      }
    };
  }
  add('flame', 8, 10, [flame(1, 10), flame(2, 9), flame(3, 8)], { outline: false }, { burn: { f: [0, 1, 2, 1], fps: 12 } });
  add('shadow', 14, 6, [function (g) { g.e(7, 3, 6, 2, 'rgba(8,4,16,0.38)'); }], { outline: false });

  // ------------------------------------------------------------------ SUELO Y DECORADO
  function ground(seed, kind) {
    return function (g) {
      var rr = rng(seed * 9973 + 11), x, y;
      var base = ['#1e2a25', '#202c27', '#1c2823'][seed % 3];
      g.r(0, 0, 16, 16, base);
      for (var i = 0; i < 70; i++) { x = (rr() * 16) | 0; y = (rr() * 16) | 0; g.px(x, y, rr() < 0.5 ? '#18221e' : '#26352d'); }
      for (var j = 0; j < 5; j++) { x = (rr() * 16) | 0; y = (rr() * 16) | 0; g.px(x, y, '#2a2438'); } // motas violetas
      if (kind === 'dirt' || kind === 'both') {
        for (var k = 0; k < 14; k++) { x = (rr() * 16) | 0; y = (rr() * 16) | 0; g.px(x, y, rr() < 0.5 ? '#2c2622' : '#352c25'); }
      }
      if (kind === 'grass' || kind === 'both') {
        for (var m = 0; m < 3; m++) {
          x = 1 + ((rr() * 14) | 0); y = 2 + ((rr() * 12) | 0);
          g.px(x, y, '#3a5a40'); g.px(x, y - 1, '#4a7550'); if (rr() < 0.5) g.px(x + 1, y, '#34513a');
        }
      }
      if (kind === 'pebble') { x = 3 + ((rr() * 9) | 0); y = 3 + ((rr() * 9) | 0); g.px(x, y, '#4a4658'); g.px(x + 1, y, '#3a3648'); g.px(x, y + 1, '#2a2634'); }
    };
  }
  add('ground', 16, 16, [], { outline: false });
  (function () {
    var kinds = ['plain', 'grass', 'dirt', 'both', 'pebble', 'grass'], dr = [];
    for (var i = 0; i < 6; i++) { reg.ground.frames.push(frame(16, 16, ground(i, kinds[i]), { outline: false })); }
    // Los tiles se exponen como ground0..ground5
    for (var n = 0; n < 6; n++) {
      reg['ground' + n] = { name: 'ground' + n, w: 32, h: 32, frames: [reg.ground.frames[n]], anims: null };
      order.push('ground' + n);
    }
    delete reg.ground; order.splice(order.indexOf('ground'), 1);
  })();

  function rock(w, h, seed, mossy) {
    return function (g) {
      var rr = rng(seed);
      var cx = w / 2 - 0.5, cy = h / 2 + 1, rx = w / 2 - 1.5, ry = h / 2 - 2;
      g.e(cx, cy + 1, rx, ry, '#3b3548');
      g.e(cx, cy, rx, ry, '#625b74');
      g.e(cx - 1, cy - 2, Math.max(2, rx - 3), Math.max(1, ry - 3), '#7a738d');
      for (var i = 0; i < w; i++) if (rr() < 0.25) g.px(2 + ((rr() * (w - 4)) | 0), 2 + ((rr() * (h - 4)) | 0), '#4a4459');
      g.px(Math.round(cx - 2), Math.round(cy - ry + 1), '#a59fb8');
      if (mossy) { for (var k = 0; k < 5; k++) g.px(Math.round(cx - 3 + k * 1.5), Math.round(cy - ry + 1 + (k % 2)), '#4a7550'); g.px(Math.round(cx), Math.round(cy - ry), '#6a9a62'); }
    };
  }
  add('rock0', 14, 11, [rock(14, 11, 3, true)], { ol: '#0f0c16' });
  add('rock1', 18, 13, [rock(18, 13, 5, false)], { ol: '#0f0c16' });
  add('rock2', 9, 7, [rock(9, 7, 8, true)], { ol: '#0f0c16' });

  function grass(seed) {
    return function (g) {
      var rr = rng(seed * 31 + 5);
      var cols = ['#2f5a3c', '#3f7a4a', '#5aa05a', '#264a33'];
      for (var i = 0; i < 6; i++) {
        var x = 1 + ((i * 1.2 + rr() * 1.2) | 0), h = 2 + ((rr() * 4) | 0), lean = ((rr() * 3) | 0) - 1;
        g.ln(x, 6, x + lean, 6 - h, cols[(rr() * 4) | 0]);
      }
      g.r(1, 6, 6, 1, '#1f3a2c');
    };
  }
  add('grass0', 8, 8, [grass(1)], { ol: '#0f1c14' }); add('grass1', 8, 8, [grass(2)], { ol: '#0f1c14' }); add('grass2', 8, 8, [grass(3)], { ol: '#0f1c14' });
  add('mushroom', 8, 8, [function (g) {
    g.r(3, 4, 2, 3, '#d8cfe0'); g.e(4, 3, 3, 2, '#8a3fa8'); g.r(1, 4, 6, 1, '#6a2a88'); g.px(3, 2, '#e9b3ff'); g.px(5, 3, '#e9b3ff'); g.px(4, 1, '#c880e6');
  }], { ol: '#0f0c16' });
  function runeFn(v) {
    return function (g) {
      var c1 = 'rgba(255,138,42,0.75)', c2 = 'rgba(185,128,214,0.55)';
      g.d(8, 8, 6, 'rgba(255,100,40,0.10)');
      if (v === 0) { g.ln(8, 3, 8, 13, c1); g.ln(8, 5, 4, 9, c1); g.ln(8, 5, 12, 9, c1); g.ln(5, 12, 11, 12, c2); }
      else { g.ln(4, 4, 12, 12, c1); g.ln(12, 4, 4, 12, c1); g.ln(8, 2, 8, 14, c2); g.px(8, 8, 'rgba(255,230,160,0.95)'); }
    };
  }
  add('rune0', 16, 16, [runeFn(0)], { outline: false }); add('rune1', 16, 16, [runeFn(1)], { outline: false });

  add('ritual_circle', 64, 64, [function (g) {
    var cx = 31.5, cy = 31.5, c1 = 'rgba(255,138,42,0.30)', c2 = 'rgba(185,128,214,0.26)', c3 = 'rgba(255,200,120,0.5)';
    var x, y, d, a;
    for (y = 0; y < 64; y++) for (x = 0; x < 64; x++) {
      d = Math.hypot(x - cx, y - cy); a = Math.atan2(y - cy, x - cx);
      if (Math.abs(d - 30) < 0.7 || Math.abs(d - 22) < 0.6) g.px(x, y, c1);
      else if (Math.abs(d - 27) < 0.5 && ((Math.floor((a + Math.PI) / (Math.PI * 2) * 48)) % 2 === 0)) g.px(x, y, c2);
      else if (d < 22 && Math.abs(d - 10) < 0.5) g.px(x, y, c2);
    }
    for (var k = 0; k < 5; k++) { // pentagrama
      var a0 = -Math.PI / 2 + k * 2 * Math.PI / 5, a1 = -Math.PI / 2 + ((k + 2) % 5) * 2 * Math.PI / 5;
      g.ln(cx + Math.cos(a0) * 21, cy + Math.sin(a0) * 21, cx + Math.cos(a1) * 21, cy + Math.sin(a1) * 21, c1);
    }
    for (var m = 0; m < 10; m++) { // runas del borde
      var an = m * Math.PI / 5, rx = cx + Math.cos(an) * 26, ry = cy + Math.sin(an) * 26;
      g.d(rx, ry, 2, 'rgba(255,120,40,0.18)');
      g.px(rx, ry, c3); g.px(rx + 1, ry - 1, c3); g.px(rx - 1, ry + 1, c3);
      if (m % 2) g.px(rx - 1, ry - 1, c3);
    }
    g.d(cx, cy, 2, 'rgba(255,170,70,0.35)'); g.px(cx, cy, c3);
  }], { outline: false });

  // ------------------------------------------------------------------ API SPRITES
  function resolve(name, f) {
    var e = reg[name];
    if (!e) throw new Error('Assets: sprite desconocido "' + name + '"');
    if (typeof f === 'string') {
      var p = f.split(':'), an = e.anims && e.anims[p[0]];
      if (!an) throw new Error('Assets: animacion desconocida "' + f + '" en ' + name);
      var idx = p.length > 1 ? (parseInt(p[1], 10) || 0) : 0;
      return e.frames[an.f[((idx % an.f.length) + an.f.length) % an.f.length]];
    }
    var n = e.frames.length, i = ((f | 0) % n + n) % n;
    return e.frames[i];
  }
  var Assets = {
    scale: SCALE,
    sprite: function (name, f) { return resolve(name, f || 0); },
    frames: function (name) { return reg[name].frames.length; },
    info: function (name) { var e = reg[name]; return e && { name: name, w: e.w, h: e.h, frames: e.frames.length, anims: e.anims }; },
    list: function () { return order.map(function (n) { return Assets.info(n); }); },
    animFrame: function (name, anim, tMs) {
      var an = reg[name].anims[anim], i = Math.floor((tMs || 0) / 1000 * an.fps) % an.f.length;
      return reg[name].frames[an.f[i]];
    },
    addToPhaser: function (textures) {
      order.forEach(function (n) {
        reg[n].frames.forEach(function (c, i) { var k = n + ':' + i; if (!textures.exists(k)) textures.addCanvas(k, c); });
      });
    }
  };

  // ================================================================== AUDIO
  var ctx = null, master, comp, sfxGain, musicGain, noiseBuf = null;
  var vol = { master: 0.8, sfx: 0.9, music: 0.45 }, muted = false;

  function ensureCtx() {
    if (ctx) return ctx;
    var AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
    master = ctx.createGain(); comp = ctx.createDynamicsCompressor();
    sfxGain = ctx.createGain(); musicGain = ctx.createGain();
    sfxGain.connect(master); musicGain.connect(master); master.connect(comp); comp.connect(ctx.destination);
    applyVol();
    var len = ctx.sampleRate, b = ctx.createBuffer(1, len, ctx.sampleRate), d = b.getChannelData(0);
    for (var i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    noiseBuf = b;
    return ctx;
  }
  function applyVol() {
    if (!ctx) return;
    master.gain.value = muted ? 0 : vol.master;
    sfxGain.gain.value = vol.sfx;
    if (!M.fading) musicGain.gain.value = vol.music;
  }
  var distCurve = null;
  function dist() {
    if (distCurve) return distCurve;
    var n = 256, c = new Float32Array(n);
    for (var i = 0; i < n; i++) { var x = i * 2 / n - 1; c[i] = Math.tanh(x * 4); }
    return (distCurve = c);
  }

  // Emite una capa (oscilador o ruido) con envolvente. L: {t,f:[a,b],n,d,v,a,delay,flt:{t,f:[a,b],q},vib:[hz,cents],dist}
  function emit(L, st, pitch, vmul, dest) {
    var d = L.d, end = st + d, g = ctx.createGain(), a = L.a == null ? 0.003 : L.a, pk = (L.v == null ? 0.5 : L.v) * vmul, src, node;
    g.gain.setValueAtTime(0.0001, st);
    g.gain.linearRampToValueAtTime(Math.max(pk, 0.0002), st + a);
    if (L.sus) g.gain.setValueAtTime(Math.max(pk, 0.0002), st + d * L.sus);
    g.gain.exponentialRampToValueAtTime(0.0001, end);
    if (L.n) {
      src = ctx.createBufferSource(); src.buffer = noiseBuf; src.loop = true;
      src.start(st, Math.random() * 0.4);
    } else {
      src = ctx.createOscillator(); src.type = L.t || 'square';
      src.frequency.setValueAtTime(L.f[0] * pitch, st);
      if (L.f[1] != null && L.f[1] !== L.f[0]) src.frequency.exponentialRampToValueAtTime(Math.max(18, L.f[1] * pitch), end);
      if (L.vib) {
        var lfo = ctx.createOscillator(), lg = ctx.createGain();
        lfo.frequency.value = L.vib[0]; lg.gain.value = L.vib[1];
        lfo.connect(lg); lg.connect(src.detune); lfo.start(st); lfo.stop(end + 0.05);
      }
      src.start(st);
    }
    node = src;
    if (L.flt) {
      var bq = ctx.createBiquadFilter(); bq.type = L.flt.t; bq.Q.value = L.flt.q || 1;
      bq.frequency.setValueAtTime(L.flt.f[0], st);
      if (L.flt.f[1]) bq.frequency.exponentialRampToValueAtTime(L.flt.f[1], end);
      node.connect(bq); node = bq;
    }
    if (L.dist) { var ws = ctx.createWaveShaper(); ws.curve = dist(); node.connect(ws); node = ws; }
    node.connect(g); g.connect(dest);
    src.stop(end + 0.03);
  }

  // Definiciones de efectos (estilo sfxr). Cada uno es una lista de capas.
  function arp(notes, step, dur, t, v) {
    return notes.map(function (f, i) { return { t: t || 'square', f: [f, f], d: dur, v: v || 0.3, delay: i * step }; });
  }
  var SFX = {
    hit: [{ t: 'square', f: [260, 90], d: 0.09, v: 0.4 }, { n: 1, d: 0.07, v: 0.5, flt: { t: 'highpass', f: [1500, 3000] } }, { t: 'sine', f: [120, 50], d: 0.1, v: 0.5 }],
    hit_heavy: [{ t: 'sine', f: [150, 38], d: 0.28, v: 0.9 }, { n: 1, d: 0.22, v: 0.7, flt: { t: 'lowpass', f: [3000, 200] } },
      { t: 'square', f: [110, 45], d: 0.18, v: 0.4 }, { n: 1, d: 0.05, v: 0.6, flt: { t: 'highpass', f: [2500, 4000] } }],
    roll: [{ n: 1, d: 0.24, v: 0.45, a: 0.06, flt: { t: 'bandpass', f: [350, 1900], q: 1.2 } }, { n: 1, d: 0.06, v: 0.2, delay: 0.17, flt: { t: 'highpass', f: [3000] } }],
    hurt: [{ t: 'sawtooth', f: [420, 100], d: 0.3, v: 0.45, vib: [30, 60] }, { n: 1, d: 0.12, v: 0.4, flt: { t: 'lowpass', f: [2500, 400] } }, { t: 'square', f: [200, 60], d: 0.2, v: 0.3 }],
    enemy_die: [{ t: 'square', f: [340, 50], d: 0.32, v: 0.35, vib: [18, 120] }, { n: 1, d: 0.3, v: 0.5, flt: { t: 'lowpass', f: [2800, 150] } }, { t: 'sine', f: [90, 35], d: 0.25, v: 0.6 }],
    pickup: arp([660, 880, 1320], 0.06, 0.12, 'square', 0.28).concat([{ t: 'triangle', f: [1760, 1760], d: 0.25, v: 0.25, delay: 0.18 }]),
    card_select: [{ t: 'triangle', f: [440, 880], d: 0.09, v: 0.5 }, { t: 'square', f: [660, 990], d: 0.1, v: 0.18, delay: 0.05 }, { t: 'triangle', f: [1320, 1320], d: 0.2, v: 0.35, delay: 0.09 }, { n: 1, d: 0.03, v: 0.15, flt: { t: 'highpass', f: [6000] } }],
    special: [{ n: 1, d: 0.6, v: 0.8, a: 0.05, flt: { t: 'lowpass', f: [200, 5000], q: 2 } }, { t: 'sawtooth', f: [70, 420], d: 0.5, v: 0.4, a: 0.1, dist: 1 },
      { t: 'sine', f: [90, 30], d: 0.7, v: 0.95, delay: 0.16 }, { n: 1, d: 0.5, v: 0.5, delay: 0.16, flt: { t: 'bandpass', f: [900, 200], q: 0.8 } }],
    boss_roar: [{ t: 'sawtooth', f: [95, 48], d: 1.1, v: 0.6, a: 0.08, sus: 0.5, vib: [22, 160], dist: 1 }, { t: 'square', f: [48, 36], d: 1.2, v: 0.55, a: 0.1 },
      { n: 1, d: 1.0, v: 0.5, a: 0.1, flt: { t: 'lowpass', f: [900, 150], q: 3 } }, { t: 'sawtooth', f: [140, 60], d: 0.8, v: 0.25, delay: 0.1, vib: [35, 200], dist: 1 }],
    wave_start: arp([220, 220, 330, 440], 0.1, 0.16, 'square', 0.3).concat([
      { t: 'sawtooth', f: [110, 110], d: 0.7, v: 0.35, a: 0.02 }, { t: 'sawtooth', f: [165, 165], d: 0.7, v: 0.25, a: 0.02 },
      { t: 'sine', f: [80, 40], d: 0.5, v: 0.7 }, { n: 1, d: 0.15, v: 0.2, flt: { t: 'highpass', f: [4000] }, delay: 0.4 }]),
    shoot: [{ t: 'square', f: [900, 300], d: 0.12, v: 0.25 }, { n: 1, d: 0.1, v: 0.25, flt: { t: 'bandpass', f: [2500, 900], q: 2 } }],
    explosion: [{ n: 1, d: 0.55, v: 0.9, flt: { t: 'lowpass', f: [3500, 120] } }, { t: 'sine', f: [110, 28], d: 0.5, v: 0.9 }, { t: 'sawtooth', f: [90, 30], d: 0.4, v: 0.3, dist: 1 }],
    game_over: arp([330, 262, 220, 165], 0.22, 0.4, 'triangle', 0.4).concat([{ t: 'sine', f: [80, 40], d: 1.0, v: 0.6, delay: 0.7 }])
  };

  Assets.sfx = function (name, o) {
    o = o || {};
    if (!ctx || ctx.state !== 'running' || muted) return false;
    var def = SFX[name];
    if (!def) { if (window.console) console.warn('Assets.sfx: desconocido "' + name + '"'); return false; }
    var t0 = ctx.currentTime + 0.005, pitch = o.pitch || 1, vm = o.vol == null ? 1 : o.vol;
    for (var i = 0; i < def.length; i++) emit(def[i], t0 + (def[i].delay || 0), pitch, vm, sfxGain);
    return true;
  };
  Assets.sfxNames = function () { return Object.keys(SFX); };

  // ---------------------------------------------------------------- Musica procedural (loop oscuro de combate)
  var M = { playing: false, pending: false, timer: null, step: 0, next: 0, intensity: 0, fading: false };
  // Progresion de 8 compases: Am Am F E | Am Dm F E  (tonica A, con dominante mayor = tension)
  var PROG = [[45, [0, 3, 7]], [45, [0, 3, 7]], [41, [0, 4, 7]], [40, [0, 4, 7]], [45, [0, 3, 7]], [38, [0, 3, 7]], [41, [0, 4, 7]], [40, [0, 4, 7]]];
  function mtof(m) { return 440 * Math.pow(2, (m - 69) / 12); }
  function mv(L, t) { emit(L, t, 1, 1, musicGain); }

  function playStep(step, t) {
    var bar = Math.floor(step / 16) % 8, s = step % 16, ch = PROG[bar], root = ch[0], tri = ch[1], hard = M.intensity > 0.5;
    var spb = 60 / (hard ? 128 : 108) / 4;
    // pad oscuro al inicio del compas
    if (s === 0) {
      for (var i = 0; i < 3; i++) mv({ t: 'sawtooth', f: [mtof(root + 12 + tri[i]), mtof(root + 12 + tri[i])], d: spb * 16, v: 0.035, a: 0.25, sus: 0.7, flt: { t: 'lowpass', f: [700, 500], q: 2 } }, t);
    }
    // bajo (corcheas con octava sincopada)
    if (s % 2 === 0) {
      var bn = root + ((s === 6 || s === 14) ? 12 : 0) + (s === 10 && bar % 2 ? 7 : 0);
      mv({ t: 'sawtooth', f: [mtof(bn), mtof(bn) * 0.99], d: spb * 1.8, v: 0.20, a: 0.004, flt: { t: 'lowpass', f: [500, 220], q: 4 } }, t);
      mv({ t: 'sine', f: [mtof(bn - 12), mtof(bn - 12)], d: spb * 1.8, v: 0.25, a: 0.004 }, t);
    }
    // bombo
    var kicks = hard ? [0, 4, 8, 12] : [0, 6, 8, 11];
    if (kicks.indexOf(s) >= 0) mv({ t: 'sine', f: [150, 40], d: 0.18, v: 0.75, a: 0.001 }, t), mv({ n: 1, d: 0.02, v: 0.25, flt: { t: 'lowpass', f: [900] } }, t);
    // caja (ruido + cuerpo)
    if (s === 4 || s === 12) {
      mv({ n: 1, d: 0.16, v: 0.34, flt: { t: 'bandpass', f: [1900, 1400], q: 0.8 } }, t);
      mv({ t: 'triangle', f: [220, 130], d: 0.1, v: 0.3 }, t);
    } else if (hard && (s === 7 || s === 15)) mv({ n: 1, d: 0.06, v: 0.16, flt: { t: 'bandpass', f: [1900], q: 1 } }, t);
    // charles
    if (s % 2 === 0 || hard) mv({ n: 1, d: s === 14 ? 0.12 : 0.03, v: s % 4 === 2 ? 0.1 : 0.06, flt: { t: 'highpass', f: [7500] } }, t);
    // timbales rituales en el ultimo compas de cada 4
    if (bar % 4 === 3 && s >= 12) mv({ t: 'sine', f: [mtof(root + 12 + (s - 12) * -3 + 7), mtof(root - 5 + (s - 12) * -3)], d: 0.22, v: 0.5 }, t);
    // arpegio menor (16avos), mas presente en la segunda mitad
    var pat = [0, 2, 1, 2, 0, 2, 1, 2, 0, 1, 2, 1, 0, 2, 1, 2];
    var an = root + 24 + tri[pat[s]] + (hard && s % 4 === 3 ? 12 : 0);
    if (!(bar % 4 === 3 && s >= 12)) mv({ t: s % 8 < 4 ? 'triangle' : 'square', f: [mtof(an), mtof(an)], d: spb * 1.3, v: bar < 2 ? 0.05 : 0.075, flt: { t: 'lowpass', f: [2600, 1200], q: 1 } }, t);
    return spb;
  }
  function sched() {
    if (!ctx) return;
    while (M.next < ctx.currentTime + 0.15) {
      var spb = playStep(M.step, M.next);
      M.next += spb; M.step++;
    }
  }
  Assets.music = {
    start: function () {
      if (!ctx || ctx.state !== 'running') { M.pending = true; return; }
      M.pending = false;
      if (M.playing) return;
      M.playing = true; M.fading = false; M.step = 0; M.next = ctx.currentTime + 0.08;
      musicGain.gain.cancelScheduledValues(ctx.currentTime);
      musicGain.gain.setValueAtTime(0.0001, ctx.currentTime);
      musicGain.gain.linearRampToValueAtTime(vol.music, ctx.currentTime + 0.4);
      M.timer = setInterval(sched, 30);
    },
    stop: function () {
      M.pending = false;
      if (!M.playing) return;
      M.playing = false; clearInterval(M.timer); M.timer = null;
      if (ctx) {
        M.fading = true;
        musicGain.gain.cancelScheduledValues(ctx.currentTime);
        musicGain.gain.setValueAtTime(musicGain.gain.value, ctx.currentTime);
        musicGain.gain.linearRampToValueAtTime(0.0001, ctx.currentTime + 0.25);
      }
    },
    setIntensity: function (v) { M.intensity = v ? 1 : 0; },
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
  Assets.setMuted = function (m) { muted = !!m; applyVol(); };

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
