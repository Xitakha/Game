/* player.js - El corderito de Swarm Hand: solo se mueve. Sin ataque manual ni roll; su defensa es el cuerpo y la mano. */
(function () {
  'use strict';
  var G = window.G, B = G.B, P = G.Player = {};

  P.create = function () {
    return {
      x: G.AW / 2, y: G.AH / 2 + 70, r: B.player.r, hp: B.player.hp, maxHp: B.player.hp,
      kx: 0, ky: 0, dirx: 1, moving: false, animT: 0, hurtT: 0, dead: false, squash: 0,
      level: 1, xp: 0, ash: 15, kills: 0, frenzyT: 0, poisonKills: 0, lastKillT: 0, trailT: 0
    };
  };

  function wallClamp(p) {
    var m = G.WALL + p.r;
    p.x = G.clamp(p.x, m, G.AW - m); p.y = G.clamp(p.y, m, G.AH - m);
  }

  // Devuelve true si el daño se aplicó.
  P.hurt = function (p, dmg, sx, sy) {
    if (p.dead || p.hurtT > 0) return false;
    var a = Math.atan2(p.y - sy, p.x - sx), k = 12;
    if (G.god) { p.hurtT = 300; return false; }
    p.hp -= dmg; p.hurtT = B.player.invuln;
    p.kx = Math.cos(a) * B.player.kb * k; p.ky = Math.sin(a) * B.player.kb * k;
    G.fx.shake(7, 200); G.fx.hit(40);
    G.fx.num(p.x, p.y - 18, Math.round(dmg), '#ff5a5a', true);
    G.fx.spark(p.x, p.y, 6, a);
    G.sfx('hurt');
    if (p.hp <= 0) { p.hp = 0; p.dead = true; G.fx.hit(120); G.fx.smoke(p.x, p.y, 8); }
    return true;
  };

  P.heal = function (p, n) {
    var before = p.hp; p.hp = Math.min(p.maxHp, p.hp + n);
    if (p.hp > before) G.fx.num(p.x, p.y - 22, '+' + Math.round(p.hp - before), '#7dff9a');
  };

  P.update = function (p, dt) {
    var s = dt / 1000, inp = G.input;
    p.animT += dt;
    if (p.hurtT > 0) p.hurtT -= dt;
    if (p.squash > 0) p.squash -= dt;
    if (p.frenzyT > 0) p.frenzyT -= dt;
    if (p.kx || p.ky) {
      p.x += p.kx * s; p.y += p.ky * s;
      var k = Math.exp(-12 * s); p.kx *= k; p.ky *= k;
      if (Math.abs(p.kx) + Math.abs(p.ky) < 4) p.kx = p.ky = 0;
    }
    if (p.dead) { wallClamp(p); return; }
    var ix = (inp.held('KeyD', 'ArrowRight') ? 1 : 0) - (inp.held('KeyA', 'ArrowLeft') ? 1 : 0);
    var iy = (inp.held('KeyS', 'ArrowDown') ? 1 : 0) - (inp.held('KeyW', 'ArrowUp') ? 1 : 0);
    var il = Math.hypot(ix, iy);
    if (il > 0) { ix /= il; iy /= il; }
    p.moving = il > 0;
    if (ix !== 0) p.dirx = ix > 0 ? 1 : -1;
    var spd = B.player.speed * G.Cards.mods.speed;
    p.x += ix * spd * s; p.y += iy * spd * s;
    wallClamp(p);
    if (p.moving && Math.random() < 0.06) G.fx.dust(p.x, p.y + 12, 1);
  };

  P.draw = function (c, p) {
    G.fx.spr(c, Assets.sprite('shadow', 0), p.x, p.y + 14, { alpha: 0.6 });
    var frame;
    if (p.dead) frame = 'die:' + Math.floor((G.deadT || 0) / 110);
    else if (p.hurtT > 400) frame = 13;
    else if (p.moving) frame = 'walk:' + Math.floor(p.animT / 80);
    else frame = 'idle:' + Math.floor(p.animT / 166);
    var cv = Assets.sprite('player', frame), alpha = 1;
    if (p.hurtT > 0 && !p.dead) alpha = (Math.floor(p.hurtT / 60) % 2) ? 0.45 : 1;
    var o = { flip: p.dirx < 0, alpha: alpha };
    if (p.hurtT > 450) { o.tint = '#ff2020'; o.tintA = 0.7; }
    else if (p.frenzyT > 0) { o.tint = '#ff3050'; o.tintA = 0.25 + 0.15 * Math.sin(p.animT / 40); }
    G.fx.spr(c, cv, p.x, p.y, o);
  };
})();
