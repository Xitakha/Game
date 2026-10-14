/* weapons.js - Sistema de armas auto-fire: proyectiles, orbitales, auras, pulsos, rayos, tajos, charcos, boomerang.
   Cada carta de ataque de la mano actúa sola con su cooldown. Los datos de cada carta están en cards.js. */
(function () {
  'use strict';
  var G = window.G, fx = G.fx, W = G.Weapons = {};
  var LV = [null, { dmg: 1, cd: 1, area: 1 }, { dmg: 1.6, cd: 0.85, area: 1.1 }, { dmg: 2.5, cd: 0.7, area: 1.2 }];
  W.LV = LV;
  var RANGE = 440;

  function C() { return G.Combat; }
  function col(t) { return G.TAGS[t].color; }

  W.reset = function () { G.Combat.reset(); G.bossDead = false; };

  // ------------------------------------------------------------- Proyectiles del jugador
  function spawnProj(o) {
    G.projectiles.push({ team: 'p', x: o.x, y: o.y, vx: Math.cos(o.ang) * o.speed, vy: Math.sin(o.ang) * o.speed, ang: o.ang, dmg: o.dmg,
      tag: o.tag, id: o.id, kind: o.kind, r: o.r || 6, life: o.life || 1600, pierce: !!o.pierce, explode: o.explode || 0,
      o: o.o || {}, hit: new Set(), t: 0, rot: 0, back: false, speed: o.speed });
  }

  // Explosión de un proyectil (Bola de brasa). Mejoras de Fuego: Metralla (3 fragmentos de 8) y Napalm (suelo ardiente 2 s, 4 dps, radio 40)
  function explodeProj(q) {
    C().boom(q.x, q.y, q.explode, q.dmg, q.tag, { id: q.id, burn: 3, kb: 50 });
    if (q.id !== 'ember') return;
    var tf = G.Tree.fx;
    if (tf.metralla) for (var k = 0; k < 3; k++) spawnProj({ x: q.x, y: q.y, ang: G.rnd(0, 6.283), speed: 300, dmg: 8, tag: 'fire', id: 'ember', kind: 'spark', r: 5, life: 520 });
    if (tf.napalm) C().zone({ kind: 'napalm', x: q.x, y: q.y, r: 40, life: 2000, dps: 4, tag: 'fire', id: 'ember', interval: 500 });
  }

  // Devuelve true si hay que eliminar el proyectil
  W.updateProj = function (q, dt, s) {
    var p = G.player, i, e, L = G.enemies;
    q.t += dt; q.life -= dt;
    if (q.kind === 'axe') {
      q.rot += dt * 0.025;
      if (!q.back && q.t > 520) { q.back = true; q.hit.clear(); }
      if (q.back) {
        var dx = p.x - q.x, dy = p.y - q.y, d = Math.hypot(dx, dy) || 1;
        if (d < 16) return true;
        var sp = Math.min(520, 300 + (q.t - 520) * 0.4); q.vx = dx / d * sp; q.vy = dy / d * sp; q.ang = Math.atan2(dy, dx);
      }
    }
    if (q.kind === 'dagger' || q.kind === 'shard') q.rot = q.ang;
    q.x += q.vx * s; q.y += q.vy * s;
    var out = q.life <= 0 || q.x < G.WALL || q.y < G.WALL || q.x > G.AW - G.WALL || q.y > G.AH - G.WALL;
    // estela por etiqueta
    if (Math.random() < 0.6) {
      if (q.tag === 'fire') fx.dot(q.x, q.y, G.rnd(-20, 20), G.rnd(-40, -5), 320, Math.random() < 0.5 ? '#ff9a3c' : '#ffd27a', 3, { add: true });
      else if (q.tag === 'ice') fx.dot(q.x, q.y, G.rnd(-15, 15), G.rnd(-15, 15), 300, '#bfeaff', 2, { add: true });
      else if (q.tag === 'poison') fx.dot(q.x, q.y, G.rnd(-10, 10), -20, 380, '#7be34a', 3, { drag: 1 });
      else if (q.tag === 'steel' && q.kind === 'axe') fx.dot(q.x, q.y, 0, 0, 200, '#dfe6f0', 2, { add: true });
    }
    if (out) { if (q.explode) explodeProj(q); return true; }
    for (i = 0; i < L.length; i++) {
      e = L[i];
      if (e.dead || e.spawnT > 0 || q.hit.has(e)) continue;
      if (Math.hypot(q.x - e.x, q.y - e.y) < q.r + e.r) {
        q.hit.add(e);
        if (q.explode) { explodeProj(q); return true; }
        var oo = { tag: q.tag, id: q.id, ang: q.ang, kb: 30, proj: true, sx: q.x - Math.cos(q.ang) * 30, sy: q.y - Math.sin(q.ang) * 30 };   // sx/sy: origen del golpe (escudo frontal)
        for (var k in q.o) oo[k] = q.o[k];
        C().deal(e, q.dmg, oo);
        if (!q.pierce) return true;
      }
    }
    return false;
  };

  W.drawProj = function (c, q) {
    c.save(); c.translate(Math.round(q.x), Math.round(q.y));
    switch (q.kind) {
      case 'spark': case 'lob': {
        var sc = q.kind === 'lob' ? 1.5 : 0.8;
        c.globalCompositeOperation = 'lighter'; c.globalAlpha = 0.5; c.fillStyle = '#ff7a2a'; c.beginPath(); c.arc(0, 0, 11 * sc, 0, 6.283); c.fill();
        c.globalCompositeOperation = 'source-over'; c.globalAlpha = 1;
        c.drawImage(Assets.sprite('fireball', Math.floor(q.t / 100) % 2), -10 * sc, -10 * sc, 20 * sc, 20 * sc); break;
      }
      case 'shard':
        c.rotate(G.Proj.ang(q.ang)); c.globalCompositeOperation = 'lighter'; c.globalAlpha = 0.4; c.fillStyle = '#6ac8ff'; c.beginPath(); c.arc(0, 0, 10, 0, 6.283); c.fill();
        c.globalCompositeOperation = 'source-over'; c.globalAlpha = 1; c.fillStyle = '#aee6ff'; c.strokeStyle = '#1c4a78'; c.lineWidth = 1.5;
        c.beginPath(); c.moveTo(10, 0); c.lineTo(0, -4.5); c.lineTo(-7, 0); c.lineTo(0, 4.5); c.closePath(); c.fill(); c.stroke();
        c.fillStyle = '#fff'; c.fillRect(-1, -1, 5, 2); break;
      case 'dart':
        c.rotate(G.Proj.ang(q.ang)); c.globalCompositeOperation = 'lighter'; c.globalAlpha = 0.35; c.fillStyle = '#7be34a'; c.beginPath(); c.arc(0, 0, 8, 0, 6.283); c.fill();
        c.globalCompositeOperation = 'source-over'; c.globalAlpha = 1; c.fillStyle = '#9bff5a'; c.strokeStyle = '#15380e'; c.lineWidth = 1.5;
        c.beginPath(); c.moveTo(9, 0); c.lineTo(-5, -3.5); c.lineTo(-3, 0); c.lineTo(-5, 3.5); c.closePath(); c.fill(); c.stroke(); break;
      case 'dagger':
        c.rotate(G.Proj.ang(q.ang)); c.fillStyle = '#e6ecf5'; c.strokeStyle = '#2a2f3a'; c.lineWidth = 1.5;
        c.beginPath(); c.moveTo(11, 0); c.lineTo(-2, -3); c.lineTo(-6, 0); c.lineTo(-2, 3); c.closePath(); c.fill(); c.stroke();
        c.fillStyle = '#7a5a3a'; c.fillRect(-9, -1.5, 4, 3); break;
      case 'axe':
        c.rotate(q.rot); c.globalCompositeOperation = 'lighter'; c.globalAlpha = 0.3; c.fillStyle = '#dfe6f0'; c.beginPath(); c.arc(0, 0, 15, 0, 6.283); c.fill();
        c.globalCompositeOperation = 'source-over'; c.globalAlpha = 1;
        c.fillStyle = '#7a5a3a'; c.fillRect(-2, -12, 4, 24);
        c.fillStyle = '#c9d2de'; c.strokeStyle = '#2a2f3a'; c.lineWidth = 1.5;
        c.beginPath(); c.moveTo(2, -11); c.quadraticCurveTo(15, -8, 13, 1); c.lineTo(2, 0); c.closePath(); c.fill(); c.stroke();
        c.beginPath(); c.moveTo(-2, 11); c.quadraticCurveTo(-15, 8, -13, -1); c.lineTo(-2, 0); c.closePath(); c.fill(); c.stroke(); break;
    }
    c.restore();
  };

  // ------------------------------------------------------------- Disparo de cada tipo de carta
  var FIRE = {
    proj: function (s, d, L, p) {
      var t = C().nearest(p.x, p.y, RANGE); if (!t) return false;
      var a = Math.atan2(t.y - p.y, t.x - p.x);
      var spec = {};
      if (d.burn) spec.burn = d.burn;
      if (d.slow) spec.slow = [d.slow[0], d.slow[1]];
      if (d.poison) spec.poison = true;
      spawnProj({ x: p.x, y: p.y - 4, ang: a, speed: d.speed, dmg: d.dmg * L.dmg, tag: d.tag, id: d.id, kind: d.proj, o: spec, r: 6 });
      return true;
    },
    lob: function (s, d, L, p) {
      var t = C().nearest(p.x, p.y, RANGE); if (!t) return false;
      spawnProj({ x: p.x, y: p.y - 4, ang: Math.atan2(t.y - p.y, t.x - p.x), speed: d.speed, dmg: d.dmg * L.dmg, tag: d.tag, id: d.id, kind: 'lob', r: 9, life: 3200, explode: d.boomR * L.area });
      return true;
    },
    fan: function (s, d, L, p) {
      var t = C().nearest(p.x, p.y, RANGE); if (!t) return false;
      var a = Math.atan2(t.y - p.y, t.x - p.x);
      for (var i = -1; i <= 1; i++) spawnProj({ x: p.x, y: p.y - 4, ang: a + i * 0.26, speed: d.speed, dmg: d.dmg * L.dmg, tag: d.tag, id: d.id, kind: 'dagger', r: 6, life: 1100 });
      return true;
    },
    boomerang: function (s, d, L, p) {
      var t = C().nearest(p.x, p.y, RANGE); if (!t) return false;
      spawnProj({ x: p.x, y: p.y - 4, ang: Math.atan2(t.y - p.y, t.x - p.x), speed: d.speed, dmg: d.dmg * L.dmg, tag: d.tag, id: d.id, kind: 'axe', r: 12 * L.area, life: 3200, pierce: true });
      return true;
    },
    pulse: function (s, d, L, p) {
      var R = d.pulseR * L.area;
      if (!C().nearest(p.x, p.y, R + 50)) return false;
      fx.ring(p.x, p.y, 10, R, 380, col(d.tag), 5); fx.ring(p.x, p.y, 4, R * 0.7, 300, '#ffffff', 2); fx.shockwave(p.x, p.y, R * 2.1);
      fx.burst(p.x, p.y, 16, '#bfeaff', R * 1.6, 450, 4, { add: true });
      var list = C().inRange(p.x, p.y, R);
      for (var i = 0; i < list.length; i++) C().deal(list[i], d.dmg * L.dmg, { tag: d.tag, id: d.id, ang: Math.atan2(list[i].y - p.y, list[i].x - p.x), kb: 25, slow: [d.slow[0], d.slow[1]] });
      return true;
    },
    chain: function (s, d, L, p) {
      var t = C().nearest(p.x, p.y, 320); if (!t) return false;
      C().chain(p.x, p.y - 6, t, d.jumps + G.Cards.mods.lightJumps, d.dmg * L.dmg, 0.8, 110, d.tag, { id: d.id });
      return true;
    },
    strike: function (s, d, L, p) {
      var list = G.enemies.filter(function (e) { return !e.dead && e.spawnT <= 0 && e.x > G.cam.x && e.x < G.cam.x + G.W && e.y > G.cam.y && e.y < G.cam.y + G.VH; });
      if (!list.length) return false;
      var e = list[Math.floor(Math.random() * list.length)];
      fx.bolt(e.x + G.rnd(-20, 20), e.y - 260, e.x, e.y, col(d.tag), 5);
      C().boom(e.x, e.y, d.boomR * L.area, d.dmg * L.dmg, d.tag, { id: d.id, kb: 30 });
      fx.shake(2, 80);
      return true;
    },
    slash: function (s, d, L, p) {
      var R = d.range * L.area, t = C().nearest(p.x, p.y, R + 25); if (!t) return false;
      var a = Math.atan2(t.y - p.y, t.x - p.x), list = C().inRange(p.x, p.y, R);
      fx.slash(p.x, p.y, a, R / 44 * 1.1, '#d02048');
      for (var i = 0; i < list.length; i++) {
        var e = list[i], ea = Math.atan2(e.y - p.y, e.x - p.x), dd = Math.hypot(e.x - p.x, e.y - p.y);
        if (dd > e.r + 8 && Math.abs(G.angDiff(ea, a)) > Math.PI / 4) continue;
        C().deal(e, d.dmg * L.dmg, { tag: d.tag, id: d.id, ang: ea, kb: 35, lifesteal: G.B.heal.fang, sx: p.x, sy: p.y });
      }
      return true;
    },
    mark: function (s, d, L, p) {
      var list = C().inRange(p.x, p.y, 280); if (!list.length) return false;
      for (var i = list.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)), x = list[i]; list[i] = list[j]; list[j] = x; }
      for (var k = 0; k < Math.min(3, list.length); k++) {
        var e = list[k];
        fx.bolt(p.x, p.y - 6, e.x, e.y, '#d02048', 2);
        C().deal(e, d.dmg * L.dmg, { tag: d.tag, id: d.id, bleed: true });
      }
      return true;
    },
    pool: function (s, d, L, p) {
      var t = C().nearest(p.x, p.y, 320); if (!t) return false;
      C().zone({ kind: 'pool', x: t.x, y: t.y, r: d.poolR * L.area, life: 5000, dps: d.dps * L.dmg, tag: d.tag, id: d.id, poison: true, interval: 500 });
      fx.burst(t.x, t.y, 8, '#7be34a', 100, 500, 4);
      return true;
    }
  };

  // ------------------------------------------------------------- Permanentes
  function tickEnemy(e, id, ms) {
    var tk = e.tk || (e.tk = {});
    if ((tk[id] || 0) > G.time) return false;
    tk[id] = G.time + ms; return true;
  }
  function updateOrbital(s, d, L, dt, p) {
    s.ang = (s.ang || 0) + d.omega * dt / 1000;
    var tf = G.Tree.fx, ring = d.id === 'ring';
    var n = d.n + (s.lvl >= 3 ? 1 : 0) + (ring && tf.corona ? 1 : 0), R = d.orbR * L.area * (ring && tf.cometa ? 1.25 : 1); s.bodies = [];
    for (var i = 0; i < n; i++) {
      var a = s.ang + i * 6.283 / n, x = p.x + Math.cos(a) * R, y = p.y - 2 + Math.sin(a) * R;
      s.bodies.push({ x: x, y: y, a: a });
      var list = C().inRange(x, y, d.bodyR * L.area);
      for (var j = 0; j < list.length; j++) {
        var e = list[j];
        if (!tickEnemy(e, d.id, d.tick)) continue;
        var o = { tag: d.tag, id: d.id, ang: a + Math.PI / 2, kb: d.kb || 0 };
        if (d.burn) o.burn = d.burn;
        C().deal(e, d.dmg * L.dmg * (ring && tf.cometa ? 1.2 : 1), o);
        C().shot(d.tag);
      }
    }
    if (Math.random() < 0.3 && s.bodies.length) { var b = s.bodies[0]; G.Snd.play(d.tag, 1.2); fx.dot(b.x, b.y, 0, -20, 250, col(d.tag), 2, { add: true }); }
  }
  function updateAura(s, d, L, dt, p) {
    s.tk = (s.tk || 0) - dt;
    s.ang = (s.ang || 0) + dt * 0.001;
    if (s.tk > 0) return;
    s.tk = d.poison ? 500 : 250;
    var R = d.auraR * L.area, list = C().inRange(p.x, p.y, R);
    for (var j = 0; j < list.length; j++) {
      var o = { tag: d.tag, id: d.id, quiet: true };
      if (d.slow) o.slow = [d.slow[0], 500];
      if (d.poison) o.poison = true;
      C().deal(list[j], d.dps * L.dmg * s.tk / 1000, o);
    }
    if (list.length) G.Snd.play(d.tag, 0.8);
  }

  // ------------------------------------------------------------- Bucle
  W.update = function (dt) {
    var p = G.player; if (p.dead) return;
    var m = G.Cards.mods, base = (1 / m.cdMul) * (p.frenzyT > 0 ? 1.3 : 1);
    for (var i = 0; i < p.hand.length; i++) {
      var s = p.hand[i]; if (!s) continue;
      var d = G.Cards.def(s.id); if (d.type !== 'attack') continue;
      var L = LV[s.lvl], rm = G.Loot.rm(s.id);
      if (rm !== 1) L = { dmg: L.dmg * rm, cd: L.cd, area: L.area };   // Rango de forja: +8 % de daño por rango (por carta), se combina con cardDmgMul en Combat.deal
      if (s.flash > 0) s.flash -= dt;
      if (d.kind === 'orbital') { updateOrbital(s, d, L, dt, p); continue; }
      if (d.kind === 'aura') { updateAura(s, d, L, dt, p); continue; }
      s.cd -= dt * base * (d.tag === 'lightning' ? m.lightSpd : 1);
      if (s.cd <= 0) {
        if (FIRE[d.kind](s, d, L, p)) {
          s.cd = s.cdMax = d.cd * L.cd * G.Tree.cdMul(d.id); s.flash = 140;
          G.Snd.play(d.tag, 1 + (i - 2) * 0.03);
          C().shot(d.tag);
        } else s.cd = 0;
      }
    }
  };

  // ------------------------------------------------------------- Dibujo
  W.drawGround = function (c) {
    var p = G.player, t = G.time / 1000;
    for (var i = 0; i < p.hand.length; i++) {
      var s = p.hand[i]; if (!s) continue;
      var d = G.Cards.def(s.id); if (d.kind !== 'aura') continue;
      var R = d.auraR * LV[s.lvl].area, k = d.tag === 'ice' ? '120,200,255' : '110,220,70';
      c.save();
      var g = c.createRadialGradient(p.x, p.y, R * 0.3, p.x, p.y, R);
      g.addColorStop(0, 'rgba(' + k + ',0.04)'); g.addColorStop(1, 'rgba(' + k + ',0.28)');
      c.fillStyle = g; c.beginPath(); c.arc(p.x, p.y, R, 0, 6.283); c.fill();
      c.strokeStyle = 'rgba(' + k + ',0.7)'; c.lineWidth = 2; c.setLineDash([8, 10]); c.lineDashOffset = -t * 30;
      c.beginPath(); c.arc(p.x, p.y, R * (0.97 + 0.03 * Math.sin(t * 4)), 0, 6.283); c.stroke(); c.restore();
      if (Math.random() < 0.25) { var a = G.rnd(0, 6.283), r = G.rnd(0.2, 1) * R; fx.dot(p.x + Math.cos(a) * r, p.y + Math.sin(a) * r, 0, d.tag === 'ice' ? 10 : -25, 600, d.tag === 'ice' ? '#d8f2ff' : '#7be34a', 3, { drag: 1 }); }
    }
  };
  W.drawAir = function (c) {
    var p = G.player;
    for (var i = 0; i < p.hand.length; i++) {
      var s = p.hand[i]; if (!s || !s.bodies) continue;
      var d = G.Cards.def(s.id); if (d.kind !== 'orbital') continue;
      for (var j = 0; j < s.bodies.length; j++) {
        var b = s.bodies[j]; G.Proj.up(c, b.x, b.y);
        if (d.tag === 'fire') {
          c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = 0.5; c.fillStyle = '#ff7a2a'; c.beginPath(); c.arc(b.x, b.y, 14, 0, 6.283); c.fill(); c.restore();
          fx.spr(c, Assets.sprite('flame', Math.floor(G.time / 110 + j) % 3), b.x, b.y - 3, { sx: 1.5, sy: 1.5 });
          if (Math.random() < 0.4) fx.dot(b.x, b.y, G.rnd(-15, 15), G.rnd(-30, -5), 300, '#ffb347', 3, { add: true });
        } else {
          c.save(); c.translate(Math.round(b.x), Math.round(b.y)); c.rotate(G.Proj.ang(b.a));
          c.globalCompositeOperation = 'lighter'; c.globalAlpha = 0.25; c.fillStyle = '#dfe6f0'; c.beginPath(); c.arc(0, 0, 13, 0, 6.283); c.fill();
          c.globalCompositeOperation = 'source-over'; c.globalAlpha = 1;
          c.fillStyle = '#aab4c2'; c.strokeStyle = '#2a2f3a'; c.lineWidth = 1.5;
          c.beginPath(); c.moveTo(9, 0); c.lineTo(-5, -7); c.lineTo(-2, 0); c.lineTo(-5, 7); c.closePath(); c.fill(); c.stroke();
          c.fillStyle = '#f2f6fc'; c.fillRect(-1, -1, 7, 2); c.restore();
        }
        G.Proj.down(c);
      }
    }
  };
})();
