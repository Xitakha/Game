/* enemies.js - Gusano, Arquero, Jabalí, Bomba, Brujo y el jefe Pastor Corrupto + proyectiles y zonas de fuego. */
(function () {
  'use strict';
  var G = window.G, B = G.B, fx = G.fx, E = G.Enemies = {};

  function wave() { return (G.Waves && G.Waves.n) || 1; }
  function PL() { return G.player; }

  // ------------------------------------------------------------- Creación
  E.spawn = function (type, x, y, o) {
    o = o || {};
    var d = B.enemy[type], n = wave(), hp, dmg;
    if (type === 'boss') {
      var k = Math.max(1, n / 5);
      hp = 400 + 300 * (k - 1); dmg = d.dmg * (1 + 0.15 * (k - 1));
    } else { hp = d.hp * B.hpMult(n); dmg = d.dmg * B.dmgMult(n); }
    var m = G.WALL + d.r;
    var e = {
      type: type, x: G.clamp(x, m, G.AW - m), y: G.clamp(y, m, G.AH - m), r: d.r, hp: hp, maxHp: hp, spd: d.spd, dmg: dmg,
      spawnT: B.spawnTelegraph, flash: 0, kx: 0, ky: 0, dead: false, st: 'move', t: 0, face: 1, anim: Math.random() * 1000,
      hitCd: 0, burnT: 0, burnDps: 0, burnAcc: 0, burnNum: 0, summoned: !!o.summoned,
      shootT: G.rnd(900, 2000), sumT: G.rnd(2500, 6000), atkT: 2000, ai: 0, strafe: Math.random() < 0.5 ? 1 : -1
    };
    if (type === 'boss') { e.spawnT = 900; e.sumT = 12000; }
    G.enemies.push(e);
    return e;
  };

  E.aliveCount = function () { var n = 0; for (var i = 0; i < G.enemies.length; i++) if (!G.enemies[i].dead) n++; return n; };
  E.boss = function () { for (var i = 0; i < G.enemies.length; i++) if (G.enemies[i].type === 'boss' && !G.enemies[i].dead) return G.enemies[i]; return null; };

  // ------------------------------------------------------------- Daño y muerte
  E.damage = function (e, dmg, o) {
    o = o || {};
    if (e.dead || e.spawnT > 0) return 0;
    if (e.type === 'boar' && e.st === 'stun') dmg *= 1.5;
    dmg = Math.max(1, Math.round(dmg));
    e.hp -= dmg; e.flash = 80;
    fx.num(e.x, e.y - e.r - 8, dmg, o.crit ? '#ffe14a' : '#ffffff', o.crit);
    if (o.burn) { e.burnDps = o.burn.dps; e.burnT = o.burn.t; }
    var armor = e.type === 'boss' || (e.type === 'boar' && e.st === 'charge');
    if (o.kb && !armor) { var k = 12; e.kx = Math.cos(o.ang) * o.kb * k; e.ky = Math.sin(o.ang) * o.kb * k; }
    if (e.type === 'archer' && e.st === 'aim' && o.kb) { e.st = 'move'; e.shootT = 1200; }
    if (e.hp <= 0) E.kill(e);
    return dmg;
  };

  function explode(e) {
    fx.ring(e.x, e.y, 8, 60, 300, '#ff6a2a', 5);
    fx.part('explosion', e.x, e.y, 0, 0, 350, { sc: 1.1, add: true, anim: true }); fx.shockwave(e.x, e.y, 130);
    fx.flames(e.x, e.y, 10, 40); fx.shake(7, 180); G.sfx('explosion');
    var p = PL();
    if (!p.dead && G.dist(e.x, e.y, p.x, p.y) <= 60 + p.r) G.Player.hurt(p, e.dmg, e.x, e.y);
  }

  E.kill = function (e, silent) {
    if (e.dead) return;
    e.dead = true;
    if (silent) { fx.smoke(e.x, e.y, 4); return; }
    var p = PL();
    fx.corpse(B.enemy[e.type].spr, e.x, e.y, e.face < 0); fx.puff(e.x, e.y, 2);
    fx.smoke(e.x, e.y, 6); fx.ember(e.x, e.y, 5, 10); G.sfx('enemy_die');
    if (e.type === 'bomb' && e.st === 'lit') explode(e);
    G.kills++; p.kills++;
    if (p.stats.killCdr > 0) G.Player.reduceCd(p.stats.killCdr * 1000);
    if (e.type === 'boss') {
      fx.hit(120); fx.shake(10, 350); fx.ring(e.x, e.y, 10, 150, 500, '#ffd27a', 6);
      fx.flames(e.x, e.y, 30, 50); G.sfx('boss_roar');
      for (var i = 0; i < G.enemies.length; i++) if (!G.enemies[i].dead) E.kill(G.enemies[i], true);
    }
  };

  // ------------------------------------------------------------- Proyectiles
  E.shoot = function (team, x, y, ang, speed, dmg, spr, o) {
    o = o || {};
    G.projectiles.push({ team: team, x: x, y: y, vx: Math.cos(ang) * speed, vy: Math.sin(ang) * speed, ang: ang, dmg: dmg,
      spr: spr, r: o.r || 7, life: o.life || 4000, pierce: !!o.pierce, hit: new Set(), t: 0 });
  };
  E.shootComet = function (p, ang) {
    E.shoot('p', p.x, p.y, ang, 420, 12 * p.stats.dmg, 'fireball', { pierce: true, life: 900, r: 10 });
    G.sfx('special', { pitch: 1.5, vol: 0.5 });
  };

  function updateProjectiles(dt) {
    var s = dt / 1000, p = PL();
    for (var i = G.projectiles.length - 1; i >= 0; i--) {
      var q = G.projectiles[i];
      q.x += q.vx * s; q.y += q.vy * s; q.life -= dt; q.t += dt;
      var dead = q.life <= 0 || q.x < G.WALL || q.y < G.WALL || q.x > G.AW - G.WALL || q.y > G.AH - G.WALL;
      if (!dead) {
        if (q.team === 'e') {
          if (!p.dead && G.dist(q.x, q.y, p.x, p.y) < q.r + p.r - 2) { if (G.Player.hurt(p, q.dmg, q.x - q.vx, q.y - q.vy)) dead = true; }
        } else {
          for (var j = 0; j < G.enemies.length; j++) {
            var e = G.enemies[j];
            if (e.dead || e.spawnT > 0 || q.hit.has(e)) continue;
            if (G.dist(q.x, q.y, e.x, e.y) < q.r + e.r) {
              q.hit.add(e);
              var dealt = E.damage(e, q.dmg, { kb: 30, ang: q.ang });
              if (dealt) { fx.spark(e.x, e.y, 5, q.ang); G.sfx('hit', { pitch: 1.4, vol: 0.5 }); fx.shake(2, 60); }
              if (!q.pierce) { dead = true; break; }
            }
          }
        }
      }
      if (q.team === 'p' && Math.random() < 0.5) fx.ember(q.x, q.y, 1, 3);
      if (dead) G.projectiles.splice(i, 1);
    }
  }

  // ------------------------------------------------------------- Comportamientos
  function moveTo(e, ang, spd, s) { e.x += Math.cos(ang) * spd * s; e.y += Math.sin(ang) * spd * s; }

  function ai_worm(e, dt, s, p, d, a) {
    moveTo(e, a, e.spd, s);
    if (e.hitCd > 0) e.hitCd -= dt;
    else if (!p.dead && d < e.r + p.r + 3) { G.Player.hurt(p, e.dmg, e.x, e.y); e.hitCd = 800; }
  }

  function ai_archer(e, dt, s, p, d, a) {
    if (e.st === 'move') {
      if (d < 220) moveTo(e, a + Math.PI, e.spd, s);
      else if (d > 300) moveTo(e, a, e.spd, s);
      else moveTo(e, a + e.strafe * Math.PI / 2, e.spd * 0.4, s);
      // si está contra una pared, cambia el sentido del giro
      if (e.x < G.WALL + 20 || e.x > G.AW - G.WALL - 20 || e.y < G.WALL + 20 || e.y > G.AH - G.WALL - 20) e.strafe *= -1;
      e.shootT -= dt;
      if (e.shootT <= 0) { e.st = 'aim'; e.t = 0; }
    } else if (e.st === 'aim') {
      e.t += dt;
      if (e.t >= 400) {
        E.shoot('e', e.x, e.y, Math.atan2(p.y - e.y, p.x - e.x), 220, e.dmg, 'arrow', { r: 6 });
        G.sfx('shoot', { vol: 0.6 });
        e.st = 'move'; e.shootT = 2000;
      }
    }
  }

  function ai_boar(e, dt, s, p, d, a) {
    if (e.st === 'move') {
      moveTo(e, a, e.spd, s);
      if (d < 250) { e.st = 'wind'; e.t = 0; e.ang = a; }
    } else if (e.st === 'wind') {
      e.t += dt;
      if (e.t < 400) e.ang = a;                 // sigue al jugador y se fija en los últimos 200 ms
      if (e.t >= 600) { e.st = 'charge'; e.t = 0; e.hitDone = false; G.sfx('boss_roar', { pitch: 1.8, vol: 0.4 }); }
    } else if (e.st === 'charge') {
      e.t += dt;
      moveTo(e, e.ang, 380, s);
      if (!e.hitDone && !p.dead && d < e.r + p.r) { e.hitDone = true; G.Player.hurt(p, e.dmg, e.x, e.y); }
      var m = G.WALL + e.r + 1;
      if (e.x <= m || e.x >= G.AW - m || e.y <= m || e.y >= G.AH - m) { e.st = 'stun'; e.t = 0; fx.shake(4, 120); fx.dust(e.x, e.y, 6); }
      else if (e.t >= 450) { e.st = 'stun'; e.t = 0; }
    } else if (e.st === 'stun') {
      e.t += dt;
      if (e.t >= 900) { e.st = 'move'; e.t = 0; }
    }
  }

  function ai_bomb(e, dt, s, p, d, a) {
    if (e.st === 'move') {
      moveTo(e, a, e.spd, s);
      if (d < 40) { e.st = 'lit'; e.t = 0; G.sfx('hit', { pitch: 2, vol: 0.4 }); }
    } else if (e.st === 'lit') {
      e.t += dt;
      moveTo(e, a, e.spd * 0.25, s);
      if (e.t >= 700) { e.dead = true; explode(e); }
    }
  }

  function ai_warlock(e, dt, s, p, d, a) {
    if (e.st === 'move') {
      if (d < 260) {
        var fa = a + Math.PI;
        // evita quedar atrapado en una pared: desliza en tangente
        var nx = e.x + Math.cos(fa) * 30, ny = e.y + Math.sin(fa) * 30, m = G.WALL + 40;
        if (nx < m || nx > G.AW - m || ny < m || ny > G.AH - m) fa += (e.strafe > 0 ? 1 : -1) * Math.PI / 2;
        moveTo(e, fa, e.spd, s);
      }
      e.sumT -= dt;
      if (e.sumT <= 0) { e.st = 'cast'; e.t = 0; }
    } else if (e.st === 'cast') {
      e.t += dt;
      if (e.t >= 500) {
        var alive = 0; G.enemies.forEach(function (o) { if (!o.dead && o.summoned && o.type === 'worm') alive++; });
        for (var i = 0; i < 2 && alive < 6; i++, alive++) E.spawn('worm', e.x + G.rnd(-30, 30), e.y + G.rnd(-30, 30), { summoned: true });
        fx.ring(e.x, e.y, 5, 40, 300, '#a060ff', 3); G.sfx('wave_start', { vol: 0.5 });
        e.st = 'move'; e.sumT = 6000;
      }
    }
  }

  // ---- Jefe: Pastor Corrupto
  function ai_boss(e, dt, s, p, d, a) {
    if (!e.rage && e.hp < e.maxHp * 0.5) {
      e.rage = true; fx.shake(8, 300); G.sfx('boss_roar'); fx.ring(e.x, e.y, 10, 120, 500, '#ff3030', 6);
      G.Hud.banner('¡EL PASTOR ENFURECE!', 1400, '#ff5a5a');
    }
    var rate = e.rage ? 1.25 : 1;
    if (e.rage) {
      e.sumT -= dt;
      if (e.sumT <= 0) { e.sumT = 12000; for (var i = 0; i < 4; i++) { var ang = i * Math.PI / 2 + 0.7; E.spawn('worm', e.x + Math.cos(ang) * 50, e.y + Math.sin(ang) * 50, { summoned: true }); } }
    }
    if (e.st === 'move') {
      if (d > 50) moveTo(e, a, e.spd, s);
      e.atkT -= dt * rate;
      if (e.atkT <= 0) {
        var pick = e.ai++ % 3;
        e.kind = pick === 0 ? (d < 150 ? 'staff' : 'slam') : pick === 1 ? 'slam' : 'thorns';
        e.st = 'tele'; e.t = 0; e.ang = a; e.dur = e.kind === 'slam' ? 800 : 700;
        e.sx = e.x; e.sy = e.y; e.tx = p.x; e.ty = p.y;
        G.sfx('hit_heavy', { pitch: 0.6, vol: 0.4 });
      }
    } else if (e.st === 'tele') {
      e.t += dt * rate;
      if (e.kind === 'staff' && e.t < e.dur * 0.5) e.ang = a;
      if (e.kind === 'thorns') e.ang = a;
      if (e.kind === 'slam') {
        var jstart = e.dur - 300;
        if (e.t > jstart) { var u = Math.min(1, (e.t - jstart) / 300); e.x = e.sx + (e.tx - e.sx) * u; e.y = e.sy + (e.ty - e.sy) * u; e.jump = Math.sin(u * Math.PI) * 50; }
      }
      if (e.t >= e.dur) {
        e.jump = 0;
        if (e.kind === 'staff') {
          fx.shake(4, 120); fx.ring(e.x, e.y, 20, 80, 220, '#ffcf7a', 4); G.sfx('hit_heavy');
          var ok = d <= 80 + p.r && Math.abs(G.angDiff(Math.atan2(p.y - e.y, p.x - e.x), e.ang)) <= Math.PI / 3;
          if (ok && !p.dead) G.Player.hurt(p, e.dmg, e.x, e.y);
        } else if (e.kind === 'slam') {
          fx.shake(8, 220); fx.dust(e.x, e.y, 14); fx.ring(e.x, e.y, 10, 70, 300, '#ff6a2a', 5); G.sfx('explosion', { pitch: 0.8 });
          if (!p.dead && G.dist(e.x, e.y, p.x, p.y) <= 70 + p.r) G.Player.hurt(p, e.dmg * 1.25, e.x, e.y);
        } else {
          var n = e.rage ? 7 : 5, spread = Math.PI / 3;
          for (var k = 0; k < n; k++) E.shoot('e', e.x, e.y, e.ang - spread / 2 + spread * k / (n - 1), 200, e.dmg * 0.5, 'thorn', { r: 6, life: 5000 });
          G.sfx('shoot', { pitch: 0.7 });
        }
        e.st = 'rec'; e.t = 0;
      }
    } else if (e.st === 'rec') {
      e.t += dt;
      if (e.t >= 400) { e.st = 'move'; e.atkT = 2500; }
    }
  }

  var AI = { worm: ai_worm, archer: ai_archer, boar: ai_boar, bomb: ai_bomb, warlock: ai_warlock, boss: ai_boss };

  // ------------------------------------------------------------- Update
  E.update = function (dt) {
    var s = dt / 1000, p = PL(), list = G.enemies, i, j, e;
    // zonas de fuego (Roll de humo)
    for (i = G.zones.length - 1; i >= 0; i--) {
      var z = G.zones[i]; z.life -= dt;
      if (Math.random() < 0.15) fx.flames(z.x, z.y, 1, z.r * 0.6);
      for (j = 0; j < list.length; j++) {
        e = list[j];
        if (!e.dead && e.spawnT <= 0 && G.dist(z.x, z.y, e.x, e.y) < z.r + e.r) { if (e.burnT < 500) { e.burnT = 600; e.burnDps = 5; } }
      }
      if (z.life <= 0) G.zones.splice(i, 1);
    }
    for (i = 0; i < list.length; i++) {
      e = list[i];
      if (e.dead) continue;
      if (e.flash > 0) e.flash -= dt;
      e.anim += dt;
      if (e.spawnT > 0) { e.spawnT -= dt; continue; }
      // empuje
      if (e.kx || e.ky) {
        e.x += e.kx * s; e.y += e.ky * s;
        var k = Math.exp(-12 * s); e.kx *= k; e.ky *= k;
        if (Math.abs(e.kx) + Math.abs(e.ky) < 4) e.kx = e.ky = 0;
      }
      // quemadura
      if (e.burnT > 0) {
        e.burnT -= dt; e.burnAcc += e.burnDps * s; e.burnNum += dt;
        if (Math.random() < 0.12) fx.flames(e.x, e.y - 4, 1, e.r * 0.6);
        if (e.burnAcc >= 1) {
          var dd = Math.floor(e.burnAcc); e.burnAcc -= dd; e.hp -= dd;
          if (e.burnNum > 500) { e.burnNum = 0; fx.num(e.x, e.y - e.r - 8, dd, '#ff9a3c'); }
          if (e.hp <= 0) { E.kill(e); continue; }
        }
      }
      var dx = p.x - e.x, dy = p.y - e.y, d = Math.hypot(dx, dy), a = Math.atan2(dy, dx);
      if (Math.abs(dx) > 2 && !(e.type === 'boar' && (e.st === 'charge' || e.st === 'wind'))) e.face = dx >= 0 ? 1 : -1;
      if (!p.dead) AI[e.type](e, dt, s, p, d, a); else if (e.type !== 'boss') { /* sin jugador, quietos */ }
      var m = G.WALL + e.r;
      e.x = G.clamp(e.x, m, G.AW - m); e.y = G.clamp(e.y, m, G.AH - m);
    }
    // separación entre enemigos
    for (i = 0; i < list.length; i++) {
      var A = list[i]; if (A.dead || A.spawnT > 0) continue;
      for (j = i + 1; j < list.length; j++) {
        var C = list[j]; if (C.dead || C.spawnT > 0) continue;
        var ox = C.x - A.x, oy = C.y - A.y, dd2 = Math.hypot(ox, oy), min = (A.r + C.r) * 0.85;
        if (dd2 < min && dd2 > 0.01) {
          var push = (min - dd2) / 2, wA = A.type === 'boss' ? 0 : 1, wC = C.type === 'boss' ? 0 : 1;
          if (wA + wC === 0) continue;
          var ta = wA / (wA + wC), tc = wC / (wA + wC);
          A.x -= ox / dd2 * push * 2 * ta; A.y -= oy / dd2 * push * 2 * ta;
          C.x += ox / dd2 * push * 2 * tc; C.y += oy / dd2 * push * 2 * tc;
        }
      }
    }
    for (i = list.length - 1; i >= 0; i--) if (list[i].dead) list.splice(i, 1);
    updateProjectiles(dt);
  };

  // ------------------------------------------------------------- Dibujo
  E.drawGround = function (c) {
    var i, e, p = PL();
    for (i = 0; i < G.zones.length; i++) {
      var z = G.zones[i];
      c.save(); c.globalAlpha = 0.25 * Math.min(1, z.life / 400); c.fillStyle = '#ff6a2a';
      c.beginPath(); c.arc(z.x, z.y, z.r, 0, 6.283); c.fill(); c.restore();
      fx.spr(c, Assets.sprite('curse_flame', Math.floor((z.life / 80)) % 6), z.x, z.y - 6, { alpha: Math.min(1, z.life / 400), sx: 1.3, sy: 1.3 });
    }
    for (i = 0; i < G.enemies.length; i++) {
      e = G.enemies[i];
      if (e.dead) continue;
      if (e.spawnT > 0) { // telegrafía de aparición
        var u = 1 - e.spawnT / (e.type === 'boss' ? 900 : B.spawnTelegraph);
        c.save(); c.strokeStyle = '#ff4040'; c.fillStyle = 'rgba(255,60,60,' + (0.15 + 0.2 * u) + ')'; c.lineWidth = 2;
        c.beginPath(); c.arc(e.x, e.y, (e.type === 'boss' ? 40 : 18) * (0.5 + 0.5 * u), 0, 6.283); c.fill(); c.stroke(); c.restore();
        continue;
      }
      if (e.type === 'boar' && e.st === 'wind') {
        var len = 171 + e.r, w = e.r * 2, f = e.t / 600;
        c.save(); c.translate(e.x, e.y); c.rotate(e.ang);
        c.fillStyle = 'rgba(255,40,40,' + (0.12 + 0.25 * f) + ')'; c.fillRect(0, -w / 2, len, w);
        c.strokeStyle = 'rgba(255,80,80,0.7)'; c.lineWidth = 1; c.strokeRect(0, -w / 2, len, w); c.restore();
      }
      if (e.type === 'bomb' && e.st === 'lit') {
        c.save(); c.fillStyle = 'rgba(255,90,40,' + (0.12 + 0.18 * (e.t / 700)) + ')'; c.strokeStyle = 'rgba(255,120,60,0.7)';
        c.beginPath(); c.arc(e.x, e.y, 60, 0, 6.283); c.fill(); c.stroke(); c.restore();
      }
      if (e.type === 'boss' && e.st === 'tele') {
        var f2 = Math.min(1, e.t / e.dur);
        c.save(); c.fillStyle = 'rgba(255,40,40,' + (0.12 + 0.28 * f2) + ')'; c.strokeStyle = 'rgba(255,90,90,0.8)'; c.lineWidth = 2;
        if (e.kind === 'staff') {
          c.beginPath(); c.moveTo(e.x, e.y); c.arc(e.x, e.y, 80, e.ang - Math.PI / 3, e.ang + Math.PI / 3); c.closePath(); c.fill(); c.stroke();
        } else if (e.kind === 'slam') {
          c.beginPath(); c.arc(e.tx, e.ty, 70, 0, 6.283); c.fill(); c.stroke();
          c.beginPath(); c.arc(e.tx, e.ty, 70 * f2, 0, 6.283); c.stroke();
        } else {
          c.beginPath(); c.moveTo(e.x, e.y); c.arc(e.x, e.y, 220, e.ang - Math.PI / 6, e.ang + Math.PI / 6); c.closePath(); c.globalAlpha = 0.5; c.fill(); c.stroke();
        }
        c.restore();
      }
    }
  };

  function frameOf(e) {
    var t = e.anim, w = Math.floor(t / 180) % 2;
    switch (e.type) {
      case 'worm': return w;
      case 'archer': return e.st === 'aim' ? 2 : w;
      case 'boar': return (e.st === 'wind' || e.st === 'charge') ? 2 : w;
      case 'bomb': return e.st === 'lit' ? 2 + Math.floor(e.t / 90) % 2 : w;
      case 'warlock': return e.st === 'cast' ? 2 : w;
      case 'boss':
        if (e.st === 'tele' && e.kind === 'slam') return (e.t > e.dur - 300) ? 3 : 0;
        if (e.st === 'tele' && e.kind !== 'slam') return e.t > e.dur * 0.55 ? 2 : 0;
        if (e.st === 'rec') return e.kind === 'slam' ? 3 : 2;
        return w;
    }
    return 0;
  }

  // frame animado con mas fases (caminar a 6 frames, idle con parpadeo) cuando existen
  function animOf(e) {
    var s = B.enemy[e.type].spr, w = Math.floor(e.anim / 110);
    if (e.type === 'worm' && e.st === 'move') return 'walk:' + w;
    if ((e.type === 'archer' || e.type === 'boar' || e.type === 'bomb') && e.st === 'move') return 'walk:' + w;
    if (e.type === 'warlock' && e.st !== 'cast') return 'idle:' + Math.floor(e.anim / 250);
    if (e.type === 'boss' && (e.st === 'move' || e.st === 'idle')) return 'idle:' + Math.floor(e.anim / 330);
    if (e.type === 'boar' && e.st === 'wind') return 'attack:' + Math.min(1, Math.floor(e.t / 250));
    return frameOf(e);
  }

  E.draw = function (c, e) {
    var cv = Assets.sprite(B.enemy[e.type].spr, frameOf(e));
    var jump = e.jump || 0;
    G.fx.spr(c, Assets.sprite('shadow', 0), e.x, e.y + cv.height / 2 - 6, { alpha: 0.6, sx: e.type === 'boss' ? 2.5 : (e.type === 'boar' ? 1.4 : 1) });
    var o = { flip: e.face < 0 };
    cv = Assets.sprite(B.enemy[e.type].spr, animOf(e));
    if (e.spawnT > 0) { o.alpha = 0.25 + 0.4 * (1 - e.spawnT / B.spawnTelegraph); }
    else if (e.flash > 0) { o.tint = '#ffffff'; o.tintA = 1; }
    else if (e.type === 'archer' && e.st === 'aim') { o.tint = '#ffe27a'; o.tintA = 0.35 + 0.3 * Math.sin(e.t / 25); }
    else if (e.type === 'bomb' && e.st === 'lit' && Math.floor(e.t / 80) % 2) { o.tint = '#ff3030'; o.tintA = 0.6; }
    else if (e.type === 'boar' && e.st === 'stun') { o.tint = '#ffff80'; o.tintA = 0.25 + 0.15 * Math.sin(e.t / 60); }
    else if (e.type === 'boss' && e.rage) { o.tint = '#ff2020'; o.tintA = 0.25 + 0.1 * Math.sin(e.anim / 100); }
    if (e.type === 'boss' && e.st === 'tele' && e.kind !== 'slam') { o.sx = 1 + 0.05 * Math.sin(e.t / 40); }
    G.fx.spr(c, cv, e.x, e.y - jump, o);
    if (e.spawnT <= 0 && e.type !== 'boss' && e.hp < e.maxHp) {
      var w = 22, bx = Math.round(e.x - w / 2), by = Math.round(e.y - cv.height / 2 - 6);
      c.fillStyle = '#1a0a12'; c.fillRect(bx - 1, by - 1, w + 2, 5);
      c.fillStyle = '#e04050'; c.fillRect(bx, by, Math.max(0, w * e.hp / e.maxHp), 3);
    }
  };

  E.drawProjectiles = function (c) {
    for (var i = 0; i < G.projectiles.length; i++) {
      var q = G.projectiles[i];
      var cv = Assets.sprite(q.spr, Math.floor(q.t / 100) % 2);
      G.fx.spr(c, cv, q.x, q.y, { rot: q.spr === 'fireball' ? 0 : q.ang });
    }
  };
})();
