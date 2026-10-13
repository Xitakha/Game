/* fx.js - "Juice": hit-stop, screen shake, partículas, números de daño, anillos y tintes. */
(function () {
  'use strict';
  var G = window.G;
  var fx = G.fx = { hitstop: 0, shakeAmp: 0, shakeT: 0, shakeMax: 1, parts: [], nums: [], rings: [], _tint: new Map() };

  fx.clear = function () { fx.hitstop = 0; fx.shakeT = 0; fx.parts.length = 0; fx.nums.length = 0; fx.rings.length = 0; };

  // Hit-stop: congela la simulación unos ms
  fx.hit = function (ms) { if (ms > fx.hitstop) fx.hitstop = ms; };

  // Shake: amplitud en px y duración en ms; se queda con el más fuerte
  fx.shake = function (amp, ms) {
    var cur = fx.shakeT > 0 ? fx.shakeAmp * (fx.shakeT / fx.shakeMax) : 0;
    if (amp >= cur) { fx.shakeAmp = amp; fx.shakeT = ms; fx.shakeMax = ms; }
  };
  fx.offset = function () {
    if (fx.shakeT <= 0) return { x: 0, y: 0 };
    var a = fx.shakeAmp * (fx.shakeT / fx.shakeMax);
    return { x: (Math.random() * 2 - 1) * a, y: (Math.random() * 2 - 1) * a };
  };
  fx.updateShake = function (dt) { if (fx.shakeT > 0) fx.shakeT -= dt; };

  // Tinte: devuelve una silueta del sprite en un color (cacheada)
  fx.tint = function (cv, color) {
    var m = fx._tint.get(cv);
    if (!m) { m = {}; fx._tint.set(cv, m); }
    if (!m[color]) {
      var c = document.createElement('canvas'); c.width = cv.width; c.height = cv.height;
      var g = c.getContext('2d'); g.drawImage(cv, 0, 0);
      g.globalCompositeOperation = 'source-atop'; g.fillStyle = color; g.fillRect(0, 0, c.width, c.height);
      m[color] = c;
    }
    return m[color];
  };

  // Dibuja un sprite centrado. o: {flip, rot, sx, sy, alpha, tint, tintA, ox, oy}
  fx.spr = function (c, cv, x, y, o) {
    o = o || {};
    c.save();
    c.translate(Math.round(x), Math.round(y));
    if (o.rot) c.rotate(o.rot);
    c.scale((o.flip ? -1 : 1) * (o.sx || 1), o.sy || 1);
    if (o.alpha != null) c.globalAlpha = o.alpha;
    var ox = o.ox != null ? o.ox : cv.width / 2, oy = o.oy != null ? o.oy : cv.height / 2;
    c.drawImage(cv, -ox, -oy);
    if (o.tint) { c.globalAlpha = (o.alpha != null ? o.alpha : 1) * (o.tintA != null ? o.tintA : 1); c.drawImage(fx.tint(cv, o.tint), -ox, -oy); }
    c.restore();
  };

  // Partícula genérica con sprite
  function part(name, x, y, vx, vy, life, o) {
    o = o || {};
    fx.parts.push({ name: name, f: Math.floor(Math.random() * 3), x: x, y: y, vx: vx, vy: vy, life: life, max: life,
      g: o.g || 0, drag: o.drag || 0, sc: o.sc || 1, grow: o.grow || 0, add: !!o.add });
  }
  fx.part = part;
  fx.spark = function (x, y, n, ang) {
    for (var i = 0; i < n; i++) {
      var a = ang != null ? ang + G.rnd(-0.9, 0.9) : G.rnd(0, 6.28), s = G.rnd(80, 240);
      part('spark', x, y, Math.cos(a) * s, Math.sin(a) * s, G.rnd(180, 320), { drag: 4, sc: 1.3, add: true });
    }
  };
  fx.dust = function (x, y, n) {
    for (var i = 0; i < n; i++) part('dust', x + G.rnd(-4, 4), y + G.rnd(-2, 6), G.rnd(-40, 40), G.rnd(-30, 10), G.rnd(250, 450), { drag: 3, grow: 0.8 });
  };
  fx.smoke = function (x, y, n) {
    for (var i = 0; i < n; i++) part('smoke', x + G.rnd(-6, 6), y + G.rnd(-6, 6), G.rnd(-30, 30), G.rnd(-60, -15), G.rnd(450, 800), { drag: 1.5, grow: 0.6 });
  };
  fx.ember = function (x, y, n, spread) {
    spread = spread || 20;
    for (var i = 0; i < n; i++) part('ember', x + G.rnd(-spread, spread), y + G.rnd(-spread, spread), G.rnd(-50, 50), G.rnd(-90, -20), G.rnd(400, 800), { sc: 1.2, add: true });
  };
  fx.flames = function (x, y, n, rad) {
    for (var i = 0; i < n; i++) {
      var a = G.rnd(0, 6.28), d = G.rnd(0, rad || 10);
      part('flame', x + Math.cos(a) * d, y + Math.sin(a) * d, Math.cos(a) * 60, Math.sin(a) * 60 - 30, G.rnd(300, 600), { drag: 3, sc: 1.4, add: true });
    }
  };
  fx.ring = function (x, y, r0, r1, ms, color, width) {
    fx.rings.push({ x: x, y: y, r0: r0, r1: r1, t: 0, max: ms, color: color || '#ff8a3c', w: width || 4 });
  };
  fx.num = function (x, y, text, color, big) {
    fx.nums.push({ x: x + G.rnd(-6, 6), y: y - 14, t: 0, max: 600, text: String(text), color: color || '#fff', size: big ? 20 : 14 });
  };

  fx.update = function (dt) {
    fx.updateShake(dt);
    var s = dt / 1000, i, p;
    for (i = fx.parts.length - 1; i >= 0; i--) {
      p = fx.parts[i]; p.life -= dt;
      if (p.life <= 0) { fx.parts.splice(i, 1); continue; }
      p.vy += p.g * s; var k = Math.exp(-p.drag * s); p.vx *= k; p.vy *= k;
      p.x += p.vx * s; p.y += p.vy * s; p.sc += p.grow * s;
    }
    for (i = fx.nums.length - 1; i >= 0; i--) {
      p = fx.nums[i]; p.t += dt; p.y -= 40 * s;
      if (p.t >= p.max) fx.nums.splice(i, 1);
    }
    for (i = fx.rings.length - 1; i >= 0; i--) {
      p = fx.rings[i]; p.t += dt;
      if (p.t >= p.max) fx.rings.splice(i, 1);
    }
  };

  fx.draw = function (c) {
    var i, p, u;
    for (i = 0; i < fx.rings.length; i++) {
      p = fx.rings[i]; u = p.t / p.max;
      c.save(); c.globalAlpha = 1 - u; c.strokeStyle = p.color; c.lineWidth = p.w * (1 - u * 0.6);
      c.beginPath(); c.arc(p.x, p.y, p.r0 + (p.r1 - p.r0) * (1 - (1 - u) * (1 - u)), 0, 6.283); c.stroke(); c.restore();
    }
    for (i = 0; i < fx.parts.length; i++) {
      p = fx.parts[i];
      var cv = Assets.sprite(p.name, p.f);
      c.save();
      if (p.add) c.globalCompositeOperation = 'lighter';
      c.globalAlpha = Math.max(0, Math.min(1, p.life / p.max));
      c.translate(Math.round(p.x), Math.round(p.y)); c.scale(p.sc, p.sc);
      c.drawImage(cv, -cv.width / 2, -cv.height / 2);
      c.restore();
    }
    for (i = 0; i < fx.nums.length; i++) {
      p = fx.nums[i]; u = p.t / p.max;
      c.save(); c.globalAlpha = u < 0.7 ? 1 : 1 - (u - 0.7) / 0.3;
      G.txt(c, p.text, Math.round(p.x), Math.round(p.y), p.size, p.color, 'center');
      c.restore();
    }
  };
})();
