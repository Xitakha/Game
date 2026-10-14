/* fx.js - "Juice": hit-stop, screen shake, partículas (sprites y de color por etiqueta), rayos, tajos, números de daño, anillos y tintes. */
(function () {
  'use strict';
  var G = window.G;
  var fx = G.fx = { hitstop: 0, shakeAmp: 0, shakeT: 0, shakeMax: 1, parts: [], nums: [], rings: [], corpses: [], cps: [], bolts: [], slashes: [], _tint: new Map() };

  fx.clear = function () { fx.hitstop = 0; fx.shakeT = 0; fx.parts.length = 0; fx.nums.length = 0; fx.rings.length = 0; fx.corpses.length = 0; fx.cps.length = 0; fx.bolts.length = 0; fx.slashes.length = 0; };

  // Hit-stop: congela la simulación unos ms
  fx.hit = function (ms) { if (ms > fx.hitstop) fx.hitstop = ms; };

  // Shake: amplitud en px y duración en ms; se queda con el más fuerte
  fx.shake = function (amp, ms) {
    amp = Math.min(12, amp * (G.shakeMul != null ? G.shakeMul : 1));   // tope 12 px; G.shakeMul = 1/3 para la opción de accesibilidad "reducir sacudidas"
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
      g: o.g || 0, drag: o.drag || 0, sc: o.sc || 1, grow: o.grow || 0, add: !!o.add, anim: !!o.anim, rot: o.rot || 0 });
  }
  fx.part = part;
  // VFX nuevos (animados): chispa de impacto, onda de choque, humo grande, llama de maldicion, cadaver con animacion de muerte
  fx.hitspark = function (x, y, sc) { part('hitspark', x, y, 0, 0, 160, { sc: sc || 1.2, add: true, anim: true, rot: G.rnd(0, 6.28) }); };
  fx.shockwave = function (x, y, r) { part('shockwave', x, y, 0, 0, 380, { sc: (r || 90) / 48, add: true, anim: true }); };
  fx.puff = function (x, y, n) { for (var i = 0; i < n; i++) part('smoke_big', x + G.rnd(-8, 8), y + G.rnd(-8, 8), G.rnd(-25, 25), G.rnd(-45, -10), G.rnd(500, 800), { drag: 1.5, anim: true, sc: 1.1 }); };
  fx.curse = function (x, y, n, rad) { for (var i = 0; i < n; i++) { var a = G.rnd(0, 6.28), d = G.rnd(0, rad || 10); part('curse_flame', x + Math.cos(a) * d, y + Math.sin(a) * d, Math.cos(a) * 40, Math.sin(a) * 40 - 40, G.rnd(350, 650), { drag: 3, sc: 1.3, add: true, anim: true }); } };
  fx.corpse = function (spr, x, y, flip) { if (Assets.hasAnim(spr, 'die')) fx.corpses.push({ spr: spr, x: x, y: y, t: 0, flip: flip }); };
  fx.drawCorpses = function (c) {
    for (var i = 0; i < fx.corpses.length; i++) {
      var p = fx.corpses[i], cv = Assets.animFrame(p.spr, 'die', p.t), dur = Assets.animDuration(p.spr, 'die');
      G.Proj.up(c, p.x, p.y);
      fx.spr(c, Assets.sprite('shadow', 0), p.x, p.y + cv.height / 2 - 6, { alpha: Math.max(0, 0.6 * (1 - p.t / (dur + 300))) });
      fx.spr(c, cv, p.x, p.y, { flip: p.flip, alpha: p.t > dur ? Math.max(0, 1 - (p.t - dur) / 300) : 1 });
      G.Proj.down(c);
    }
  };
  fx.spark = function (x, y, n, ang) {
    fx.hitspark(x, y, 1.1);
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
  // Partícula de color (cuadradito) para las etiquetas
  fx.dot = function (x, y, vx, vy, life, color, size, o) {
    if (fx.cps.length > 500) return;
    o = o || {};
    fx.cps.push({ x: x, y: y, vx: vx, vy: vy, life: life, max: life, color: color, size: size || 3, add: !!o.add, g: o.g || 0, drag: o.drag || 3 });
  };
  fx.burst = function (x, y, n, color, spd, life, size, o) {
    for (var i = 0; i < n; i++) { var a = G.rnd(0, 6.283), s = G.rnd(spd * 0.3, spd); fx.dot(x, y, Math.cos(a) * s, Math.sin(a) * s, G.rnd(life * 0.6, life), color, size, o); }
  };
  // Rayo zigzagueante entre dos puntos
  fx.bolt = function (x1, y1, x2, y2, color, w) {
    var d = Math.hypot(x2 - x1, y2 - y1), n = Math.max(2, Math.floor(d / 14)), pts = [[x1, y1]];
    var nx = -(y2 - y1) / (d || 1), ny = (x2 - x1) / (d || 1);
    for (var i = 1; i < n; i++) { var u = i / n, j = G.rnd(-9, 9); pts.push([x1 + (x2 - x1) * u + nx * j, y1 + (y2 - y1) * u + ny * j]); }
    pts.push([x2, y2]);
    fx.bolts.push({ pts: pts, t: 0, max: 220, color: color || '#ffe45a', w: w || 3 });
  };
  // Tajo en arco (usa el sprite de tajo del juego teñido)
  fx.slash = function (x, y, ang, sc, color) { fx.slashes.push({ x: x, y: y, ang: ang, sc: sc, color: color, t: 0, max: 220, flip: Math.random() < 0.5 }); };
  fx.num = function (x, y, text, color, big) {
    if (fx.nums.length > 70 && !big) return;
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
    for (i = fx.corpses.length - 1; i >= 0; i--) {
      p = fx.corpses[i]; p.t += dt;
      if (p.t > Assets.animDuration(p.spr, 'die') + 300) fx.corpses.splice(i, 1);
    }
    for (i = fx.cps.length - 1; i >= 0; i--) {
      p = fx.cps[i]; p.life -= dt;
      if (p.life <= 0) { fx.cps.splice(i, 1); continue; }
      var kk = Math.exp(-p.drag * s); p.vx *= kk; p.vy = p.vy * kk + p.g * s; p.x += p.vx * s; p.y += p.vy * s;
    }
    for (i = fx.bolts.length - 1; i >= 0; i--) { fx.bolts[i].t += dt; if (fx.bolts[i].t >= fx.bolts[i].max) fx.bolts.splice(i, 1); }
    for (i = fx.slashes.length - 1; i >= 0; i--) { fx.slashes[i].t += dt; if (fx.slashes[i].t >= fx.slashes[i].max) fx.slashes.splice(i, 1); }
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
      var cv = Assets.sprite(p.name, p.anim ? Math.min(Assets.frames(p.name) - 1, Math.floor((1 - p.life / p.max) * Assets.frames(p.name))) : p.f);
      var ground = p.name === 'shockwave';   // la onda de choque es de suelo (se aplasta); el resto de partículas están de pie
      if (!ground) G.Proj.up(c, p.x, p.y);
      c.save();
      if (p.add) c.globalCompositeOperation = 'lighter';
      c.globalAlpha = Math.max(0, Math.min(1, p.life / p.max));
      c.translate(Math.round(p.x), Math.round(p.y)); if (p.rot) c.rotate(p.rot); c.scale(p.sc, p.sc);
      c.drawImage(cv, -cv.width / 2, -cv.height / 2);
      c.restore();
      if (!ground) G.Proj.down(c);
    }
    for (i = 0; i < fx.slashes.length; i++) {
      p = fx.slashes[i]; u = p.t / p.max;
      var sl = Assets.sprite('slash_1', Math.min(3, Math.floor(u * 4)));
      c.save(); c.translate(Math.round(p.x), Math.round(p.y)); c.rotate(p.ang); c.scale(p.sc, (p.flip ? -1 : 1) * p.sc);
      c.globalAlpha = Math.max(0, 1 - u * 0.7); c.drawImage(sl, -4, -32);
      c.globalAlpha *= 0.75; c.drawImage(fx.tint(sl, p.color), -4, -32);
      c.restore();
    }
    for (i = 0; i < fx.cps.length; i++) {
      p = fx.cps[i];
      c.save(); if (p.add) c.globalCompositeOperation = 'lighter';
      c.globalAlpha = Math.max(0, Math.min(1, p.life / p.max * 1.5)); c.fillStyle = p.color;
      var sz = p.size * (0.5 + 0.5 * p.life / p.max);
      c.fillRect(Math.round(p.x - sz / 2), Math.round(p.y - sz / 2), Math.ceil(sz), Math.ceil(sz)); c.restore();
    }
    for (i = 0; i < fx.bolts.length; i++) {
      p = fx.bolts[i]; u = p.t / p.max;
      c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = 1 - u; c.lineJoin = 'round'; c.lineCap = 'round';
      for (var pass = 0; pass < 2; pass++) {
        c.strokeStyle = pass ? '#ffffff' : p.color; c.lineWidth = pass ? 1.5 : p.w * 2.2;
        c.beginPath(); c.moveTo(p.pts[0][0], p.pts[0][1]);
        for (var k = 1; k < p.pts.length; k++) c.lineTo(p.pts[k][0], p.pts[k][1]);
        c.stroke();
      }
      c.restore();
    }
    for (i = 0; i < fx.nums.length; i++) {
      p = fx.nums[i]; u = p.t / p.max;
      G.Proj.up(c, p.x, p.y);   // los números de daño nunca se aplastan: siguen a la entidad proyectada
      c.save(); c.globalAlpha = u < 0.7 ? 1 : 1 - (u - 0.7) / 0.3;
      G.txt(c, p.text, Math.round(p.x), Math.round(p.y), p.size, p.color, 'center');
      c.restore();
      G.Proj.down(c);
    }
  };
})();
