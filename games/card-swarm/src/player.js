/* player.js - El corderito de Swarm Hand: solo se mueve. Sin ataque manual ni roll; su defensa es el cuerpo y la mano. */
(function () {
  'use strict';
  var G = window.G, B = G.B, P = G.Player = {};

  P.create = function () {
    return {
      x: G.AW / 2, y: G.AH / 2 + 70, r: B.player.r, hp: B.player.hp, maxHp: B.player.hp,
      kx: 0, ky: 0, dirx: 1, moving: false, animT: 0, hurtT: 0, dead: false, squash: 0,
      level: 1, xp: 0, ash: 15 + G.Tree.startAsh(), revived: false, kills: 0, frenzyT: 0, poisonKills: 0, lastKillT: 0, trailT: 0, slowT: 0, slowPct: 0
    };
  };

  function wallClamp(p) {
    var m = G.WALL + p.r;
    p.x = G.clamp(p.x, m, G.AW - m); p.y = G.clamp(p.y, m, G.AH - m);
  }

  // Ralentiza al jugador (no apila: se queda con el mayor % y refresca la duración al máximo)
  P.slow = function (p, pct, ms) {
    if (p.dead) return;
    p.slowPct = Math.max(p.slowT > 0 ? p.slowPct : 0, pct); p.slowT = Math.max(p.slowT, ms);
  };

  // Devuelve true si el daño se aplicó. o: { kb (multiplicador de empuje), slow:[pct,ms], soft (daño de zona: sin empuje y casi sin hitstop), src (tipo, para depurar) }
  P.hurt = function (p, dmg, sx, sy, o) {
    o = o || {};
    if (p.dead || p.hurtT > 0) return false;
    if (G.Boss.noHurt > 0 || G.Boss.intro) return false;   // intro del jefe y victoria: invulnerable
    if (o.slow) P.slow(p, o.slow[0], o.slow[1]);
    var a = Math.atan2(p.y - sy, p.x - sx), k = 12 * (o.kb != null ? o.kb : 1);
    if (G.dbg) { var D = G.dbg.dmg; D[o.src || '?'] = (D[o.src || '?'] || 0) + dmg; }
    if (G.god) { p.hurtT = 300; return false; }
    // Fase 2b: Bastión (Acero, -10 %), platos de Tía Castaña (resistencia por familia de enemigo), escudo de Sed (set Sangre)
    if (G.Tree.fx.bastion) dmg *= 0.9;
    var rs = G.runBuff && G.runBuff.fx && G.runBuff.fx.res; if (rs) { var fam = P.family(o.src); if (rs[fam]) dmg *= 1 - rs[fam]; }
    try { G.Loot.noteHit(o.src); } catch (e) { /* racha sin daño */ }
    if (p.shield > 0) { var ab = Math.min(p.shield, dmg); p.shield -= ab; dmg -= ab; if (dmg <= 0.01) { p.hurtT = o.soft ? 250 : 400; G.fx.num(p.x, p.y - 18, 'escudo', '#ff9aa8', true); G.sfx('hit', { pitch: 1.6, vol: 0.5 }); return false; } }
    p.hp -= dmg; p.hurtT = o.soft ? 250 : B.player.invuln;
    if (!o.soft) { p.kx = Math.cos(a) * B.player.kb * k; p.ky = Math.sin(a) * B.player.kb * k; G.fx.shake(7, 200); G.fx.hit(40); }
    else G.fx.shake(2, 80);
    G.fx.num(p.x, p.y - 18, Math.round(dmg), '#ff5a5a', true);
    G.fx.spark(p.x, p.y, o.soft ? 2 : 6, a);
    G.sfx('hurt');
    if (p.hp <= 0 && G.Tree.fx.heart && !p.revived) {   // Corazón de brasa (Fuego, maestría): revive una vez por expedición
      p.revived = true; p.hp = Math.round(p.maxHp * 0.4); p.hurtT = 1500;
      G.Combat.boom(p.x, p.y, 120, 60, 'fire', { big: true, kb: 120 });
      G.Hud.banner('¡CORAZÓN DE BRASA!', 1800, '#ff9a3c'); G.fx.shake(10, 300);
      return true;
    }
    if (p.hp <= 0) { p.hp = 0; p.dead = true; G.fx.hit(120); G.fx.smoke(p.x, p.y, 8); }
    return true;
  };

  // Familia de enemigo de una fuente de daño (platos de resistencia): ranged (proyectiles), blast (explosivos y fuego), big (élites y jefes), melee (el resto)
  P.family = function (src) {
    src = src || '';
    if (/^(archer|fanner|moth|sower|proj|thorn|arrow|chainer)/.test(src)) return 'ranged';
    if (/^(bomb|scorcher|salamander)/.test(src)) return 'blast';
    if (/^(boss|bulwark|hive)/.test(src)) return 'big';
    return 'melee';
  };

  // src: etiqueta de origen para ?dbg=1 (G.dbg.heal acumula la cura bruta por fuente)
  P.heal = function (p, n, src) {
    if (G.dbg) { var H = G.dbg.heal || (G.dbg.heal = {}); H[src || '?'] = (H[src || '?'] || 0) + n; }
    var before = p.hp; p.hp = Math.min(p.maxHp, p.hp + n);
    if (p.hp > before) G.fx.num(p.x, p.y - 22, '+' + Math.round(p.hp - before), '#7dff9a');
  };

  P.update = function (p, dt) {
    var s = dt / 1000, inp = G.input;
    p.animT += dt;
    if (p.hurtT > 0) p.hurtT -= dt;
    if (p.squash > 0) p.squash -= dt;
    if (p.frenzyT > 0) p.frenzyT -= dt;
    if (p.pactT > 0) p.pactT -= dt;
    var rg = G.runBuff && G.runBuff.fx && G.runBuff.fx.regen;   // Sopa de hebra (Castaña): cura pasiva leve, sin cifras flotantes
    if (rg && !p.dead && p.hp < p.maxHp) p.hp = Math.min(p.maxHp, p.hp + rg * dt / 1000);
    if (p.slowT > 0) { p.slowT -= dt; if (p.slowT <= 0) p.slowPct = 0; }
    if (p.kx || p.ky) {
      p.x += p.kx * s; p.y += p.ky * s;
      var k = Math.exp(-12 * s); p.kx *= k; p.ky *= k;
      if (Math.abs(p.kx) + Math.abs(p.ky) < 4) p.kx = p.ky = 0;
    }
    if (p.dead) { wallClamp(p); return; }
    var ix = (inp.held('KeyD', 'ArrowRight') ? 1 : 0) - (inp.held('KeyA', 'ArrowLeft') ? 1 : 0);
    var iy = (inp.held('KeyS', 'ArrowDown') ? 1 : 0) - (inp.held('KeyW', 'ArrowUp') ? 1 : 0);
    if (inp.joy && inp.joy.active) { ix += inp.joy.x; iy += inp.joy.y; }   // joystick táctil
    var il = Math.hypot(ix, iy);
    if (il > 1) { ix /= il; iy /= il; il = 1; }
    p.moving = il > 0;
    if (ix !== 0) p.dirx = ix > 0 ? 1 : -1;
    var spd = B.player.speed * G.Cards.mods.speed * (p.slowT > 0 ? 1 - p.slowPct : 1);
    p.x += ix * spd * s; p.y += iy * spd * s;
    G.Boss.collide(p, p.r);   // troncos de la arena del jefe
    wallClamp(p);
    if (p.moving && Math.random() < 0.06) G.fx.dust(p.x, p.y + 12, 1);
  };

  P.draw = function (c, p) {
    G.fx.spr(c, Assets.sprite('shadow', 0), p.x, p.y + 14, { alpha: 0.6 });
    if (p.slowT > 0 && !p.dead) { // aro de hielo bajo los pies
      var rs = G.hasSpr('fx_freeze_ring') ? Assets.sprite('fx_freeze_ring', Math.floor(p.animT / 200) % 2) : null;
      if (rs) G.fx.spr(c, rs, p.x, p.y + 12, { alpha: Math.min(1, p.slowT / 300) });
      else {
        c.save(); c.globalAlpha = Math.min(1, p.slowT / 300) * 0.8; c.strokeStyle = '#7fd4ff'; c.fillStyle = 'rgba(127,212,255,0.22)'; c.lineWidth = 2;
        c.beginPath(); c.ellipse(p.x, p.y + 12, 17, 7, 0, 0, 6.283); c.fill(); c.stroke();
        c.setLineDash([4, 5]); c.lineDashOffset = -p.animT / 40; c.beginPath(); c.ellipse(p.x, p.y + 12, 12, 5, 0, 0, 6.283); c.stroke(); c.restore();
      }
    }
    var frame;
    if (p.dead) frame = 'die:' + Math.floor((G.deadT || 0) / 110);
    else if (p.hurtT > 400) frame = 13;
    else if (p.moving) frame = 'walk:' + Math.floor(p.animT / 80);
    else frame = 'idle:' + Math.floor(p.animT / 166);
    var cv = Assets.sprite('player', frame), alpha = 1;
    if (p.hurtT > 0 && !p.dead) alpha = (Math.floor(p.hurtT / 60) % 2) ? 0.45 : 1;
    var o = { flip: p.dirx < 0, alpha: alpha };
    if (p.hurtT > 450) { o.tint = '#ff2020'; o.tintA = 0.7; }
    else if (p.slowT > 0) { o.tint = '#7fd4ff'; o.tintA = 0.35; }
    else if (p.frenzyT > 0) { o.tint = '#ff3050'; o.tintA = 0.25 + 0.15 * Math.sin(p.animT / 40); }
    G.fx.spr(c, cv, p.x, p.y, o);
  };
})();
