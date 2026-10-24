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

  W.reset = function () { G.Combat.reset(); G.bossDead = false; W.turrets = []; W.timers = []; W.echoN = 0; W.eraT = 60000; W.ojoT = 10000; };
  W.turrets = []; W.timers = [];
  W.later = function (ms, fn) { W.timers.push({ t: ms, fn: fn }); };

  // ------------------------------------------------------------- Proyectiles del jugador
  function spawnProj(o) {
    if (G.projectiles.length > G.Q.projCap * 1.5) return;
    G.projectiles.push({ team: 'p', x: o.x, y: o.y, vx: Math.cos(o.ang) * o.speed, vy: Math.sin(o.ang) * o.speed, ang: o.ang, dmg: o.dmg,
      tag: o.tag, id: o.id, kind: o.kind, r: o.r || 6, life: o.life || 1600, pierce: !!o.pierce, explode: o.explode || 0,
      o: o.o || {}, hit: new Set(), t: 0, rot: 0, back: false, speed: o.speed, bounce: o.bounce || 0 });
  }

  // Explosión de un proyectil (Bola de brasa). Mejoras de Fuego: Metralla (3 fragmentos de 8) y Napalm (suelo ardiente 2 s, 4 dps, radio 40)
  function explodeProj(q) {
    C().boom(q.x, q.y, q.explode, q.dmg, q.tag, { id: q.id, burn: 3, kb: 50 });
    if (q.id !== 'ember') return;
    var tf = G.Tree.fx;
    if (tf.metralla) for (var k = 0; k < 3; k++) spawnProj({ x: q.x, y: q.y, ang: G.rnd(0, 6.283), speed: 300, dmg: 8, tag: 'fire', id: 'ember', kind: 'spark', r: 5, life: 520 });
    if (tf.napalm) C().zone({ kind: 'napalm', x: q.x, y: q.y, r: 40, life: 2000, dps: 4, tag: 'fire', id: 'ember', interval: 500 });
  }

  // Murciélago (Sangre): persigue a un enemigo, pica (daño + sangrado) y rebota a otro; q.tgt = objetivo, q.bounces = rebotes restantes
  function updateBat(q, dt, s) {
    q.t += dt; q.life -= dt;
    var e = q.tgt;
    if (!e || e.dead) { e = q.tgt = C().nearest(q.x, q.y, 300, Array.from(q.hit)); if (!e) return true; }
    var dx = e.x - q.x, dy = e.y - q.y, d = Math.hypot(dx, dy) || 1, a = Math.atan2(dy, dx);
    q.ang = a; q.x += dx / d * q.speed * s + Math.sin(q.t / 60) * 24 * s; q.y += dy / d * q.speed * s + Math.cos(q.t / 70) * 24 * s;
    if (Math.random() < 0.3) fx.dot(q.x, q.y, G.rnd(-15, 15), G.rnd(-15, 15), 260, '#8a1030', 2);
    if (d < e.r + 9) {
      q.hit.add(e);
      C().deal(e, q.dmg, { tag: 'blood', id: 'bat', ang: a, kb: 20, bleed: true, proj: true, sx: q.x - Math.cos(a) * 30, sy: q.y - Math.sin(a) * 30 });
      if (--q.bounces < 0) return true;
      q.tgt = C().nearest(q.x, q.y, 190, Array.from(q.hit)); if (!q.tgt) return true;
    }
    return q.life <= 0;
  }

  // Devuelve true si hay que eliminar el proyectil
  W.updateProj = function (q, dt, s) {
    var p = G.player, i, e, L = G.enemies;
    if (q.kind === 'bat') return updateBat(q, dt, s);
    q.t += dt; q.life -= dt;
    if (q.kind === 'axe') {
      q.rot += dt * 0.025;
      if (!q.back && q.t > (G.Tree.fx.tormentaAcero ? 1000 : 520)) { q.back = true; q.hit.clear(); }   // Tormenta de acero: el Hacha dobla su arco
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
      if (e.dead || e.spawnT > 0 || e.untarget || q.hit.has(e)) continue;
      if (Math.hypot(q.x - e.x, q.y - e.y) < q.r + e.r) {
        q.hit.add(e);
        if (q.explode) { explodeProj(q); return true; }
        var oo = { tag: q.tag, id: q.id, ang: q.ang, kb: 30, proj: true, sx: q.x - Math.cos(q.ang) * 30, sy: q.y - Math.sin(q.ang) * 30 };   // sx/sy: origen del golpe (escudo frontal)
        for (var k in q.o) oo[k] = q.o[k];
        C().deal(e, q.dmg, oo);
        if (!q.pierce) {
          if (q.bounce > 0) {   // Tormenta de acero (maestría): las dagas rebotan una vez hacia otro enemigo
            var nx = C().nearest(q.x, q.y, 180, Array.from(q.hit));
            if (nx) { q.bounce--; q.ang = Math.atan2(nx.y - q.y, nx.x - q.x); q.vx = Math.cos(q.ang) * q.speed; q.vy = Math.sin(q.ang) * q.speed; q.life = Math.max(q.life, 500); fx.hitspark(q.x, q.y, 0.8); return false; }
          }
          return true;
        }
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
      case 'bat': {
        var fl = Math.sin(q.t / 45) * 0.7, dirx = Math.cos(q.ang) < 0 ? -1 : 1;
        c.scale(dirx, 1); c.fillStyle = '#2a0e24'; c.strokeStyle = '#0c0814'; c.lineWidth = 1.5;
        c.beginPath(); c.moveTo(0, 0); c.quadraticCurveTo(-4, -9 * (1 + fl * 0.5), -12, -4 - fl * 4); c.lineTo(-7, 0); c.lineTo(-9, 5); c.lineTo(-3, 2); c.lineTo(0, 6);
        c.lineTo(3, 2); c.lineTo(9, 5); c.lineTo(7, 0); c.lineTo(12, -4 - fl * 4); c.quadraticCurveTo(4, -9 * (1 + fl * 0.5), 0, 0); c.closePath(); c.fill(); c.stroke();
        c.fillStyle = '#ff4060'; c.fillRect(-3, -2, 2, 2); c.fillRect(1, -2, 2, 2); break;
      }
      case 'axe':
        c.rotate(q.rot); if (q.r > 14) c.scale(q.r / 12, q.r / 12); c.globalCompositeOperation = 'lighter'; c.globalAlpha = 0.3; c.fillStyle = '#dfe6f0'; c.beginPath(); c.arc(0, 0, 15, 0, 6.283); c.fill();
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
      var spec = {}, tf = G.Tree.fx, dm = d.dmg * L.dmg;
      if (d.burn) spec.burn = d.burn;
      if (d.slow) { var hz = d.id === 'shard' && tf.helada; spec.slow = [d.slow[0] + (hz ? 0.15 : 0), d.slow[1] + (hz ? 1000 : 0)]; }   // Esquirla II-B (Hielo): ralentiza +15 puntos y +1 s
      if (d.poison) spec.poison = (d.id === 'dart' && tf.dosisDoble) ? 2 : true;                                                         // Dardo II-A (Veneno): 2 stacks por impacto
      if (d.id === 'dart' && tf.puntaAfilada) dm *= 2;                                                                                   // Dardo II-B: daño inicial x2
      spawnProj({ x: p.x, y: p.y - 4, ang: a, speed: d.speed, dmg: dm, tag: d.tag, id: d.id, kind: d.proj, o: spec, r: 6, pierce: d.id === 'shard' && tf.perfora });   // Esquirla II-A: atraviesa
      return true;
    },
    lob: function (s, d, L, p) {
      var t = C().nearest(p.x, p.y, RANGE); if (!t) return false;
      spawnProj({ x: p.x, y: p.y - 4, ang: Math.atan2(t.y - p.y, t.x - p.x), speed: d.speed, dmg: d.dmg * L.dmg, tag: d.tag, id: d.id, kind: 'lob', r: 9, life: 3200, explode: d.boomR * L.area });
      return true;
    },
    fan: function (s, d, L, p) {
      var t = C().nearest(p.x, p.y, RANGE); if (!t) return false;
      var a = Math.atan2(t.y - p.y, t.x - p.x), tf = G.Tree.fx, n = tf.quintuple ? 5 : 3, half = (n - 1) / 2, dm = d.dmg * L.dmg * (tf.quintuple ? 0.8 : 1);   // Daga II-A: 5 dagas (80 % de daño c/u)
      for (var i = 0; i < n; i++) spawnProj({ x: p.x, y: p.y - 4, ang: a + (i - half) * (n === 5 ? 0.2 : 0.26), speed: d.speed, dmg: dm, tag: d.tag, id: d.id, kind: 'dagger', r: 6, life: 1100, pierce: !!tf.perforante, bounce: tf.tormentaAcero ? 1 : 0 });   // II-B: perforante
      return true;
    },
    boomerang: function (s, d, L, p) {
      var t = C().nearest(p.x, p.y, RANGE); if (!t) return false;
      spawnProj({ x: p.x, y: p.y - 4, ang: Math.atan2(t.y - p.y, t.x - p.x), speed: d.speed, dmg: d.dmg * L.dmg, tag: d.tag, id: d.id, kind: 'axe', r: 12 * L.area * (G.Tree.fx.hojaAncha ? 1.5 : 1), life: 3200, pierce: true });
      return true;
    },
    pulse: function (s, d, L, p) {
      var tf = G.Tree.fx, R = d.pulseR * L.area * (tf.novaAncha ? 1.25 : 1);   // Nova II-A: radio +25 %
      if (!C().nearest(p.x, p.y, R + 50)) return false;
      var pulse = function (mul) {
        var q = G.player;
        fx.ring(q.x, q.y, 10, R, 380, col(d.tag), 5); fx.ring(q.x, q.y, 4, R * 0.7, 300, '#ffffff', 2); fx.shockwave(q.x, q.y, R * 2.1);
        fx.burst(q.x, q.y, 16, '#bfeaff', R * 1.6, 450, 4, { add: true });
        var list = C().inRange(q.x, q.y, R);
        for (var i = 0; i < list.length; i++) C().deal(list[i], d.dmg * L.dmg * mul, { tag: d.tag, id: d.id, ang: Math.atan2(list[i].y - q.y, list[i].x - q.x), kb: 25, slow: [d.slow[0], d.slow[1]] });
      };
      pulse(1);
      if (tf.novaDoble) W.later(380, function () { if (!G.player.dead) pulse(0.7); });   // Nova II-B: segundo pulso (70 %) 0,38 s después
      return true;
    },
    chain: function (s, d, L, p) {
      var t = C().nearest(p.x, p.y, 320); if (!t) return false;
      var tf = G.Tree.fx, jumps = d.jumps + G.Cards.mods.lightJumps + (tf.cadenaLarga ? 1 : 0) - (tf.unRayo ? 1 : 0);
      // Cadena larga: +1 salto y alcance 150; Un rayo: x2 de daño y -1 salto; Chispazo II-B: sin pérdida de daño por salto
      C().chain(p.x, p.y - 6, t, Math.max(1, jumps), d.dmg * L.dmg * (tf.unRayo ? 2 : 1), tf.sinPerdida ? 1 : 0.8, tf.cadenaLarga ? 150 : 110, d.tag, { id: d.id });
      return true;
    },
    strike: function (s, d, L, p) {
      var list = G.enemies.filter(function (e) { return !e.dead && e.spawnT <= 0 && !e.untarget && e.x > G.cam.x && e.x < G.cam.x + G.W && e.y > G.cam.y && e.y < G.cam.y + G.VH; });
      if (!list.length) return false;
      var tf = G.Tree.fx, ia = Math.floor(Math.random() * list.length), e = list[ia];
      function bolt(e2, mul) {
        fx.bolt(e2.x + G.rnd(-20, 20), e2.y - 260, e2.x, e2.y, col(d.tag), 5);
        C().boom(e2.x, e2.y, d.boomR * L.area * (tf.rayoAncho ? 1.5 : 1), d.dmg * L.dmg * mul * (tf.rayoAncho ? 1.1 : 1), d.tag, { id: d.id, kb: 30 });   // Tormenta II-B: área x1,5 y +10 %
      }
      bolt(e, 1);
      if (tf.dobleRayo && list.length > 1) bolt(list[(ia + 1 + Math.floor(Math.random() * (list.length - 1))) % list.length], 0.6);   // Tormenta II-A: segundo rayo (60 %)
      fx.shake(2, 80);
      return true;
    },
    slash: function (s, d, L, p) {
      var tf = G.Tree.fx, R = d.range * L.area, t = C().nearest(p.x, p.y, R + 25); if (!t) return false;
      var a = Math.atan2(t.y - p.y, t.x - p.x), list = C().inRange(p.x, p.y, R);
      fx.slash(p.x, p.y, a, R / 44 * 1.1, '#d02048');
      for (var i = 0; i < list.length; i++) {
        var e = list[i], ea = Math.atan2(e.y - p.y, e.x - p.x), dd = Math.hypot(e.x - p.x, e.y - p.y);
        if (dd > e.r + 8 && Math.abs(G.angDiff(ea, a)) > Math.PI / (tf.arcoAmplio ? 3 : 4)) continue;   // Colmillo II-B: arco de 120 grados
        C().deal(e, d.dmg * L.dmg, { tag: d.tag, id: d.id, ang: ea, kb: 35, lifesteal: G.B.heal.fang * (tf.hemorragia ? 2 : 1), sx: p.x, sy: p.y });   // II-A: la cura se duplica
      }
      return true;
    },
    mark: function (s, d, L, p) {
      var list = C().inRange(p.x, p.y, 280); if (!list.length) return false;
      for (var i = list.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)), x = list[i]; list[i] = list[j]; list[j] = x; }
      for (var k = 0; k < Math.min(3 + (G.Tree.fx.cuatroMarcas ? 1 : 0), list.length); k++) {   // Sangría II-A: 4 marcas
        var e = list[k];
        fx.bolt(p.x, p.y - 6, e.x, e.y, '#d02048', 2);
        C().deal(e, d.dmg * L.dmg, { tag: d.tag, id: d.id, bleed: true });
      }
      return true;
    },
    pool: function (s, d, L, p) {
      var t = C().nearest(p.x, p.y, 320); if (!t) return false;
      var tf = G.Tree.fx;   // Charco II-A "Pantano": dura 8 s; II-B "Charco amplio": radio +30 %
      C().zone({ kind: 'pool', x: t.x, y: t.y, r: d.poolR * L.area * (tf.charcoAncho ? 1.3 : 1), life: tf.pantano ? 8000 : 5000, dps: d.dps * L.dmg, tag: d.tag, id: d.id, poison: true, interval: 500 });
      fx.burst(t.x, t.y, 8, '#7be34a', 100, 500, 4);
      return true;
    },
    // Bobina (Rayo): torreta de 5 s que dispara al más cercano; máx. 3 a la vez
    turret: function (s, d, L, p) {
      var t = C().nearest(p.x, p.y, 320); if (!t) return false;
      var a = Math.atan2(t.y - p.y, t.x - p.x);
      if (W.turrets.length >= 3) W.turrets.shift();
      W.turrets.push({ x: p.x + Math.cos(a) * 34, y: p.y + Math.sin(a) * 34, life: d.life, max: d.life, tk: 150, dmg: d.dmg * L.dmg, tick: d.tick, range: d.range, tag: d.tag, id: d.id, born: G.time });
      fx.burst(p.x + Math.cos(a) * 34, p.y + Math.sin(a) * 34, 8, '#fff6a8', 120, 350, 3, { add: true });
      return true;
    },
    // Murciélago (Sangre): persigue, pica y rebota (2 rebotes a Nv3)
    bat: function (s, d, L, p) {
      var t = C().nearest(p.x, p.y, RANGE); if (!t) return false;
      spawnProj({ x: p.x, y: p.y - 8, ang: Math.atan2(t.y - p.y, t.x - p.x), speed: d.speed, dmg: d.dmg * L.dmg, tag: d.tag, id: d.id, kind: 'bat', r: 8, life: 2800 });
      var q = G.projectiles[G.projectiles.length - 1]; q.tgt = t; q.bounces = 1 + (s.lvl >= 3 ? 1 : 0);
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
    var n = d.n + (s.lvl >= 3 ? 1 : 0) + (ring && tf.corona ? 1 : 0) + (d.id === 'thorns' && tf.cuatroEscudos ? 1 : 0), R = d.orbR * L.area * (ring && tf.cometa ? 1.25 : 1); s.bodies = [];
    for (var i = 0; i < n; i++) {
      var a = s.ang + i * 6.283 / n, x = p.x + Math.cos(a) * R, y = p.y - 2 + Math.sin(a) * R;
      s.bodies.push({ x: x, y: y, a: a });
      var list = C().inRange(x, y, d.bodyR * L.area);
      for (var j = 0; j < list.length; j++) {
        var e = list[j];
        if (!tickEnemy(e, d.id, d.tick)) continue;
        var o = { tag: d.tag, id: d.id, ang: a + Math.PI / 2, kb: (d.kb || 0) * (d.id === 'thorns' && tf.empuje ? 2 : 1) };   // Púas II-B: empuje x2
        if (d.burn) o.burn = d.burn;
        C().deal(e, d.dmg * L.dmg * (ring && tf.cometa ? 1.2 : 1), o);
        C().shot(d.tag);
      }
    }
    if (Math.random() < 0.3 && s.bodies.length) { var b = s.bodies[0]; G.Snd.play(d.tag, 1.2); fx.dot(b.x, b.y, 0, -20, 250, col(d.tag), 2, { add: true }); }
  }
  // Mejoras de aura: Ventisca II (A radio +30 % / B dps +40 %) y Nube II (A radio +30 % / B Miasma dps x1,5)
  function auraMul(d) {
    var tf = G.Tree.fx;
    if (d.id === 'cloud') return { r: tf.nubeAncha ? 1.3 : 1, d: tf.miasma ? 1.5 : 1 };
    if (d.id === 'blizzard') return { r: tf.ventAncha ? 1.3 : 1, d: tf.ventDura ? 1.4 : 1 };
    return { r: 1, d: 1 };
  }
  function updateAura(s, d, L, dt, p) {
    s.tk = (s.tk || 0) - dt;
    s.ang = (s.ang || 0) + dt * 0.001;
    if (s.tk > 0) return;
    s.tk = d.poison ? 500 : 250;
    var am = auraMul(d), R = d.auraR * L.area * am.r, list = C().inRange(p.x, p.y, R);
    for (var j = 0; j < list.length; j++) {
      var o = { tag: d.tag, id: d.id, quiet: true };
      if (d.slow) o.slow = [d.slow[0], 500];
      if (d.poison) o.poison = true;
      C().deal(list[j], d.dps * L.dmg * am.d * s.tk / 1000, o);
    }
    if (list.length) G.Snd.play(d.tag, 0.8);
  }

  // ------------------------------------------------------------- Bucle
  // Maestrías de Hielo y Rayo con temporizador (Era glacial cada 60 s; Ojo de la tormenta cada 10 s) y torretas de la Bobina
  function updateExtras(dt, p) {
    var tf = G.Tree.fx, i, e;
    for (i = W.timers.length - 1; i >= 0; i--) { W.timers[i].t -= dt; if (W.timers[i].t <= 0) { var fn = W.timers[i].fn; W.timers.splice(i, 1); fn(); } }
    for (i = W.turrets.length - 1; i >= 0; i--) {
      var tu = W.turrets[i]; tu.life -= dt; tu.tk -= dt;
      if (tu.life <= 0) { fx.burst(tu.x, tu.y, 6, '#fff6a8', 90, 300, 3, { add: true }); W.turrets.splice(i, 1); continue; }
      if (tu.tk <= 0) {
        var t = C().nearest(tu.x, tu.y, tu.range);
        if (t) { tu.tk = tu.tick; fx.bolt(tu.x, tu.y - 16, t.x, t.y, col(tu.tag), 2); C().deal(t, tu.dmg, { tag: tu.tag, id: tu.id, quiet: true, noChain: true, ang: Math.atan2(t.y - tu.y, t.x - tu.x), kb: 5 }); C().shot(tu.tag); G.Snd.play(tu.tag, 1.3); }
        else tu.tk = 120;
      }
    }
    if (tf.eraGlacial) {
      W.eraT -= dt;
      if (W.eraT <= 0) {
        W.eraT = 60000;
        fx.ring(p.x, p.y, 10, 760, 700, '#bfeaff', 10); fx.shockwave(p.x, p.y, 900); fx.shake(5, 300);
        G.Hud.banner('¡ERA GLACIAL!', 1600, '#bfeaff');
        C().inRange(p.x, p.y, 1100).forEach(function (en) {
          if (en.x < G.cam.x - 40 || en.x > G.cam.x + G.W + 40 || en.y < G.cam.y - 40 || en.y > G.cam.y + G.VH + 40) return;
          C().stun(en, 2000); C().slow(en, 0.6, 3000); fx.burst(en.x, en.y, 5, '#e8f6ff', 100, 400, 3, { add: true });
        });
      }
    }
    if (tf.ojoTormenta) {
      W.ojoT -= dt;
      if (W.ojoT <= 0) {
        W.ojoT = 10000;
        G.enemies.forEach(function (en) {   // cada 10 s cae un rayo sobre cada élite y jefe
          if (en.dead || en.spawnT > 0 || !(en.big || en.type === 'boss') || en.partOf) return;
          fx.bolt(en.x + G.rnd(-20, 20), en.y - 300, en.x, en.y, col('lightning'), 6);
          C().boom(en.x, en.y, 40, 150, 'lightning', { id: 'ojo', kb: 0 }); fx.shake(4, 120);
        });
      }
    }
  }

  W.update = function (dt) {
    var p = G.player; if (p.dead) return;
    updateExtras(dt, p);
    var m = G.Cards.mods, base = (1 / m.cdMul) * (p.frenzyT > 0 ? 1.3 : 1) * (p.cdSlowT > 0 ? 1 - Math.min(0.4, p.cdSlowPct) : 1);   // M9 (Lirio del olvido): recarga más lenta, tope 40 %
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
          if (d.tag === 'lightning' && m.set4.lightning && (d.kind === 'chain' || d.kind === 'strike') && ++W.echoN % 8 === 0) FIRE[d.kind](s, d, L, p);   // Eco (set Rayo 4+): cada 8.º rayo se repite solo
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
      var R = d.auraR * LV[s.lvl].area * auraMul(d).r, k = d.tag === 'ice' ? '120,200,255' : '110,220,70';
      c.save();
      var g = c.createRadialGradient(p.x, p.y, R * 0.3, p.x, p.y, R);
      g.addColorStop(0, 'rgba(' + k + ',0.04)'); g.addColorStop(1, 'rgba(' + k + ',0.28)');
      c.fillStyle = G.fg(g, 'rgba(' + k + ',0.14)'); c.beginPath(); c.arc(p.x, p.y, R, 0, 6.283); c.fill();
      c.strokeStyle = 'rgba(' + k + ',0.7)'; c.lineWidth = 2; c.setLineDash([8, 10]); c.lineDashOffset = -t * 30;
      c.beginPath(); c.arc(p.x, p.y, R * (0.97 + 0.03 * Math.sin(t * 4)), 0, 6.283); c.stroke(); c.restore();
      if (Math.random() < 0.25) { var a = G.rnd(0, 6.283), r = G.rnd(0.2, 1) * R; fx.dot(p.x + Math.cos(a) * r, p.y + Math.sin(a) * r, 0, d.tag === 'ice' ? 10 : -25, 600, d.tag === 'ice' ? '#d8f2ff' : '#7be34a', 3, { drag: 1 }); }
    }
  };
  W.drawAir = function (c) {
    var p = G.player, tt = G.time / 1000;
    for (var ti = 0; ti < W.turrets.length; ti++) {   // torretas de la Bobina
      var tu = W.turrets[ti], fade = Math.min(1, tu.life / 400, (G.time - tu.born) / 200 + 0.2);
      G.Proj.up(c, tu.x, tu.y); c.save(); c.globalAlpha = fade;
      c.strokeStyle = 'rgba(255,228,90,0.25)'; c.lineWidth = 1.5; c.setLineDash([5, 6]); c.beginPath(); c.arc(tu.x, tu.y, tu.range * 0.5, 0, 6.283); c.stroke(); c.setLineDash([]);
      c.fillStyle = '#6a6f88'; c.strokeStyle = '#0c0814'; c.lineWidth = 2; c.beginPath(); c.moveTo(tu.x - 9, tu.y + 8); c.lineTo(tu.x - 4, tu.y - 10); c.lineTo(tu.x + 4, tu.y - 10); c.lineTo(tu.x + 9, tu.y + 8); c.closePath(); c.fill(); c.stroke();
      c.globalCompositeOperation = 'lighter'; c.fillStyle = 'rgba(255,228,90,' + (0.35 + 0.25 * Math.sin(tt * 18 + ti)) + ')'; c.beginPath(); c.arc(tu.x, tu.y - 14, 11, 0, 6.283); c.fill(); c.globalCompositeOperation = 'source-over';
      c.fillStyle = '#ffe45a'; c.strokeStyle = '#0c0814'; c.beginPath(); c.arc(tu.x, tu.y - 14, 6, 0, 6.283); c.fill(); c.stroke();
      c.restore(); G.Proj.down(c);
    }
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
