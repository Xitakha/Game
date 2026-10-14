/* enemies.js - 11 enemigos (gusano, arquero, espinoso, jabalí, escudero, bomba, polilla, sembrador, espectro, ascua, brujo), 2 élites
   (Coloso Escudero, Madre Colmena) y el jefe Pastor Corrupto, con estados, telegrafía, zonas de daño (G.zones team 'e') y escalado por minuto. */
(function () {
  'use strict';
  var G = window.G, B = G.B, fx = G.fx, E = G.Enemies = {};

  function mins() { return G.time / 60000; }
  function PL() { return G.player; }

  // ------------------------------------------------------------- Creación
  var DEG = Math.PI / 180;
  E.spawn = function (type, x, y, o) {
    o = o || {};
    var d = B.enemy[type], m = mins(), hp, dmg;
    if (type === 'boss' || d.elite) { hp = d.hp; dmg = d.dmg; }       // jefe y élites no escalan por minuto
    else { hp = d.hp * B.hpMult(m); dmg = d.dmg * B.dmgMult(m); }
    if (o.hp) hp = o.hp;
    var sc = o.scale || 1, r = d.r * sc, mg = G.WALL + r;
    var e = {
      type: type, x: G.clamp(x, mg, G.AW - mg), y: G.clamp(y, mg, G.AH - mg), r: r, hp: hp, maxHp: hp, spd: d.spd, dmg: dmg, sc: sc,
      spawnT: o.spawnT != null ? o.spawnT : B.spawnTelegraph, flash: 0, kx: 0, ky: 0, dead: false, st: 'move', t: 0, face: 1, anim: Math.random() * 1000,
      hitCd: 0, burnT: 0, burnDps: 0, poisonT: 0, poisonN: 0, bleedT: 0, slowT: 0, slowPct: 0, stunT: 0, vaporCd: 0,
      acc: { fire: 0, poison: 0, blood: 0 }, numAcc: 0, numT: 0, dotAcc: 0, dotT: 0, boomDepth: 0, lastTag: 'neutral', summoned: !!o.summoned, src: o.src || null,
      shootT: G.rnd(1200, 2600), sumT: G.rnd(2500, 6000), atkT: 2000, ai: 0, strafe: Math.random() < 0.5 ? 1 : -1, fa: 0
    };
    e.spawnMax = e.spawnT;
    switch (type) {
      case 'boss': e.spawnT = e.spawnMax = 900; e.sumT = 12000; e.atkT = 1500; e.callT = 14000; e.sporeT = 8000; e.age = 0; break;
      case 'fanner': e.shootT = G.rnd(1500, 3000); break;
      case 'shield': e.shield = 70 * DEG; e.bashT = G.rnd(2000, 4000); break;
      case 'moth': e.shootT = G.rnd(1500, 3500); break;
      case 'sower': e.sumT = G.rnd(2500, 4500); break;
      case 'blinker': e.atkT = G.rnd(2500, 4200); break;
      case 'scorcher': e.atkT = G.rnd(1000, 3000); break;
      case 'mini_bulwark': e.big = true; e.shield = 70 * DEG; e.atkT = 2000; e.spawnT = e.spawnMax = 900; break;
      case 'mini_hive': e.big = true; e.atkT = 2500; e.ecT = 9000; e.spawnT = e.spawnMax = 900; break;
    }
    G.enemies.push(e);
    return e;
  };
  E.countType = function (type) { var n = 0; for (var i = 0; i < G.enemies.length; i++) if (!G.enemies[i].dead && G.enemies[i].type === type) n++; return n; };

  // ------------------------------------------------------------- Zonas de daño en el suelo (G.zones, team 'e')
  // Fases: arm (telegrafía, sin daño, ms) y activa (life ms). kind: 'spore' / 'acid' (verde ácido) o 'fire' (rastro del Ascua).
  E.zone = function (o) {
    var z = { team: 'e', kind: o.kind, x: o.x, y: o.y, r: o.r, arm: o.arm || 0, armMax: o.arm || 0, life: o.life, max: o.life,
      dmg: o.dmg, tick: o.tick || 500, tk: 0, slow: o.slow || 0, owner: o.owner || null, src: o.src || o.kind, t: 0 };
    G.zones.push(z);
    return z;
  };
  E.zonesOf = function (owner, kind) { var n = 0; for (var i = 0; i < G.zones.length; i++) if (G.zones[i].team === 'e' && G.zones[i].owner === owner && G.zones[i].kind === kind) n++; return n; };

  function updateZones(dt) {
    var p = PL();
    for (var i = G.zones.length - 1; i >= 0; i--) {
      var z = G.zones[i]; if (z.team !== 'e') continue;
      z.t += dt;
      if (z.arm > 0) { z.arm -= dt; if (z.arm <= 0) { z.arm = 0; if (z.kind !== 'fire') fx.ring(z.x, z.y, z.r * 0.4, z.r, 250, '#9bff4a', 3); } continue; }
      z.life -= dt;
      if (z.life <= 0) { G.zones.splice(i, 1); continue; }
      if (z.kind !== 'fire' && Math.random() < 0.1) fx.dot(z.x + G.rnd(-z.r, z.r) * 0.7, z.y + G.rnd(-z.r, z.r) * 0.7, 0, -30, 600, '#9bff4a', 3, { drag: 1 });
      if (z.kind === 'fire' && Math.random() < 0.08) fx.dot(z.x + G.rnd(-8, 8), z.y, 0, -40, 400, '#ff9a3c', 3, { add: true });
      if (p.dead) continue;
      if (G.dist(z.x, z.y, p.x, p.y) <= z.r) {
        if (z.slow) G.Player.slow(p, z.slow, 400);
        z.tk -= dt;
        if (z.tk <= 0) { z.tk = z.tick; G.Player.hurt(p, z.dmg, z.x, z.y, { soft: true, src: z.src }); }
      } else z.tk = Math.min(z.tk, 0);
    }
  }

  E.aliveCount = function () { var n = 0; for (var i = 0; i < G.enemies.length; i++) if (!G.enemies[i].dead) n++; return n; };
  E.boss = function () { for (var i = 0; i < G.enemies.length; i++) if (G.enemies[i].type === 'boss' && !G.enemies[i].dead) return G.enemies[i]; return null; };

  // ------------------------------------------------------------- Daño y muerte
  // El daño de las cartas pasa por G.Combat.deal; aquí solo la explosión de la bomba y la muerte.
  function explode(e) {
    fx.ring(e.x, e.y, 8, 60, 300, '#ff6a2a', 5);
    fx.part('explosion', e.x, e.y, 0, 0, 350, { sc: 1.1, add: true, anim: true }); fx.shockwave(e.x, e.y, 130);
    fx.flames(e.x, e.y, 10, 40); fx.shake(7, 180); G.sfx('explosion');
    var p = PL();
    if (!p.dead && G.dist(e.x, e.y, p.x, p.y) <= 60 + p.r) G.Player.hurt(p, e.dmg, e.x, e.y, { src: 'bomb' });
  }

  E.kill = function (e, silent, tag) {
    if (e.dead) return;
    e.dead = true;
    if (silent) { fx.smoke(e.x, e.y, 4); return; }
    var p = PL(), i;
    fx.corpse(B.enemy[e.type].spr, e.x, e.y, e.face < 0); fx.puff(e.x, e.y, 2);
    fx.smoke(e.x, e.y, 5); fx.ember(e.x, e.y, 3, 10);
    var now = performance.now(); if (now - (E._dieSfx || 0) > 70) { E._dieSfx = now; G.sfx('enemy_die', { vol: 0.5 }); }
    if (e.type === 'bomb' && e.st === 'lit') explode(e);
    G.kills++; p.kills++;
    if (e.type === 'warlock') {   // matar al invocador disipa a sus gusanos
      for (i = 0; i < G.enemies.length; i++) { var w = G.enemies[i]; if (!w.dead && w.owner === e) { w.dead = true; fx.puff(w.x, w.y, 1); fx.burst(w.x, w.y, 6, '#a060ff', 120, 400, 3, { add: true }); } }
    }
    if (e.type === 'sower') E.zone({ kind: 'spore', x: e.x, y: e.y, r: 30, arm: 400, life: 2000, dmg: e.dmg, tick: 500, slow: 0.15, owner: null, src: 'sower' });
    if (e.type === 'mini_hive') {   // se divide en 3 gusanos grandes
      for (i = 0; i < 3; i++) { var an = i * 2.094 + 0.5; E.spawn('worm', e.x + Math.cos(an) * 30, e.y + Math.sin(an) * 30, { summoned: true, hp: 40, scale: 1.3, spawnT: 500 }); }
      fx.ring(e.x, e.y, 10, 80, 400, '#ffb73a', 5);
    }
    if (B.enemy[e.type].elite) { fx.hit(80); fx.shake(8, 300); fx.ring(e.x, e.y, 10, 120, 500, '#ffd27a', 6); fx.flames(e.x, e.y, 18, 36); G.sfx('boss_roar', { pitch: 1.2, vol: 0.7 }); }
    if (e.type === 'boss') {
      fx.hit(120); fx.shake(10, 350); fx.ring(e.x, e.y, 10, 150, 500, '#ffd27a', 6);
      fx.flames(e.x, e.y, 30, 50); G.sfx('boss_roar');
      G.bossDead = true;
      for (i = 0; i < G.enemies.length; i++) if (!G.enemies[i].dead) E.kill(G.enemies[i], true);
      for (i = G.zones.length - 1; i >= 0; i--) if (G.zones[i].team === 'e') G.zones.splice(i, 1);
    }
    G.Combat.onKill(e, tag || e.lastTag);
  };

  // ------------------------------------------------------------- Proyectiles
  // o: { r, life, hp (destructible por golpes de carta), slow:[pct,ms], fb (sprite alternativo si no existe spr), src }
  E.shoot = function (team, x, y, ang, speed, dmg, spr, o) {
    o = o || {};
    if (!G.hasSpr(spr)) spr = o.fb || null;
    G.projectiles.push({ team: team, x: x, y: y, vx: Math.cos(ang) * speed, vy: Math.sin(ang) * speed, ang: ang, dmg: dmg,
      spr: spr, r: o.r || 7, life: o.life || 4000, pierce: !!o.pierce, hit: new Set(), t: 0, hp: o.hp || 0, slow: o.slow || null, src: o.src || 'proj', orb: !!o.orb });
  };

  function updateProjectiles(dt) {
    var s = dt / 1000, p = PL(), hand = p.hand || [];
    for (var i = G.projectiles.length - 1; i >= 0; i--) {
      var q = G.projectiles[i];
      if (q.team === 'p') { if (G.Weapons.updateProj(q, dt, s)) G.projectiles.splice(i, 1); continue; }
      q.x += q.vx * s; q.y += q.vy * s; q.life -= dt; q.t += dt;
      var dead = q.life <= 0 || q.x < G.WALL || q.y < G.WALL || q.x > G.AW - G.WALL || q.y > G.AH - G.WALL;
      if (!dead && q.hp) {   // el orbe de hielo se destruye con cualquier golpe de carta (proyectil u orbital)
        var j, o2;
        for (j = 0; j < G.projectiles.length && !dead; j++) {
          o2 = G.projectiles[j];
          if (o2.team === 'p' && o2.life > 0 && Math.hypot(o2.x - q.x, o2.y - q.y) < q.r + (o2.r || 6)) { dead = true; if (!o2.pierce) o2.life = 0; }
        }
        for (j = 0; j < hand.length && !dead; j++) {
          var bodies = hand[j] && hand[j].bodies;
          if (bodies) for (var k = 0; k < bodies.length; k++) if (Math.hypot(bodies[k].x - q.x, bodies[k].y - q.y) < q.r + 12) { dead = true; break; }
        }
        if (dead) { fx.burst(q.x, q.y, 8, '#bfeaff', 140, 350, 3, { add: true }); fx.ring(q.x, q.y, 3, 18, 200, '#7fd4ff', 2); G.sfx('hit', { pitch: 1.8, vol: 0.4 }); G.projectiles.splice(i, 1); continue; }
      }
      if (!dead && !p.dead && G.dist(q.x, q.y, p.x, p.y) < q.r + p.r - 2) {
        if (G.Player.hurt(p, q.dmg, q.x - q.vx, q.y - q.vy, { slow: q.slow, src: q.src }) || G.god) dead = true;
      }
      if (dead) G.projectiles.splice(i, 1);
    }
  }

  // ------------------------------------------------------------- Comportamientos
  function moveTo(e, ang, spd, s) { e.x += Math.cos(ang) * spd * s; e.y += Math.sin(ang) * spd * s; }

  function ai_worm(e, dt, s, p, d, a) {
    moveTo(e, a, e.spd, s);
    if (e.hitCd > 0) e.hitCd -= dt;
    else if (!p.dead && d < e.r + p.r + 3) { G.Player.hurt(p, e.dmg, e.x, e.y, { src: 'worm' }); e.hitCd = 700; }
  }

  function ai_archer(e, dt, s, p, d, a) {
    if (e.st === 'move') {
      if (d < 200) moveTo(e, a + Math.PI, e.spd, s);
      else if (d > 260) moveTo(e, a, e.spd, s);
      else moveTo(e, a + e.strafe * Math.PI / 2, e.spd * 0.4, s);
      // si está contra una pared, cambia el sentido del giro
      if (e.x < G.WALL + 20 || e.x > G.AW - G.WALL - 20 || e.y < G.WALL + 20 || e.y > G.AH - G.WALL - 20) e.strafe *= -1;
      e.shootT -= dt;
      if (e.shootT <= 0) { e.st = 'aim'; e.t = 0; }
    } else if (e.st === 'aim') {
      e.t += dt;
      if (e.t >= 400) {
        E.shoot('e', e.x, e.y, Math.atan2(p.y - e.y, p.x - e.x), 220, e.dmg, 'arrow', { r: 6, src: 'archer' });
        G.sfx('shoot', { vol: 0.6 });
        e.st = 'move'; e.shootT = 2400;
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
      if (!e.hitDone && !p.dead && d < e.r + p.r) { e.hitDone = true; G.Player.hurt(p, e.dmg, e.x, e.y, { src: 'boar' }); }
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
        var alive = 0; G.enemies.forEach(function (o) { if (!o.dead && o.owner && o.owner.type === 'warlock') alive++; });
        for (var i = 0; i < 2 && alive < 6; i++, alive++) {
          var w = E.spawn('worm', e.x + G.rnd(-30, 30), e.y + G.rnd(-30, 30), { summoned: true }); w.owner = e;
          fx.bolt(e.x, e.y - 6, w.x, w.y, '#a060ff', 2);   // hilo de luz hacia cada invocado
        }
        fx.ring(e.x, e.y, 5, 40, 300, '#a060ff', 3); G.sfx('wave_start', { vol: 0.5 });
        e.st = 'move'; e.sumT = 6000;
      }
    }
  }

  // ---------------------------------------------------------------- Enemigos nuevos
  function contact(e, dt, p, d, cd, src) {
    if (e.hitCd > 0) { e.hitCd -= dt; return; }
    if (!p.dead && d < e.r + p.r + 3) { G.Player.hurt(p, e.dmg, e.x, e.y, { src: src || e.type }); e.hitCd = cd; }
  }
  // mantiene distancia [lo,hi]; fuera de ese rango se acerca / aleja; dentro rodea despacio
  function kite(e, a, d, lo, hi, s, wob) {
    var w = wob || 0;
    if (d < lo) moveTo(e, a + Math.PI + w, e.spd, s);
    else if (d > hi) moveTo(e, a + w, e.spd, s);
    else moveTo(e, a + e.strafe * Math.PI / 2, e.spd * 0.4, s);
    if (e.x < G.WALL + 20 || e.x > G.AW - G.WALL - 20 || e.y < G.WALL + 20 || e.y > G.AH - G.WALL - 20) e.strafe *= -1;
  }
  function inFan(e, p, ang, half, reach) {
    return G.dist(e.x, e.y, p.x, p.y) <= reach && Math.abs(G.angDiff(Math.atan2(p.y - e.y, p.x - e.x), ang)) <= half;
  }

  // Espinoso: abanico de 3 espinas con cono rojo
  function ai_fanner(e, dt, s, p, d, a) {
    if (e.st === 'move') {
      kite(e, a, d, 180, 240, s);
      e.shootT -= dt;
      if (e.shootT <= 0) { e.st = 'aim'; e.t = 0; e.ang = a; G.sfx('hit', { pitch: 1.6, vol: 0.3 }); }
    } else if (e.st === 'aim') {
      e.t += dt;
      if (e.t < 350) e.ang = a;                       // se fija en los últimos 150 ms
      if (e.t >= 500) {
        for (var k = -1; k <= 1; k++) E.shoot('e', e.x, e.y, e.ang + k * 14 * DEG, 190, e.dmg, 'proj_thorn_small', { r: 5, life: 3500, fb: 'thorn', src: 'fanner' });
        G.sfx('shoot', { pitch: 1.3, vol: 0.5 });
        e.st = 'rec'; e.t = 0;
      }
    } else if (e.st === 'rec') {
      e.t += dt;
      if (e.t >= 300) { e.st = 'move'; e.shootT = 2700; }
    }
  }

  // Escudero: escudo frontal (e.fa) y empellón telegrafiado
  var SH_REACH = 40;
  function ai_shield(e, dt, s, p, d, a) {
    if (e.st === 'move') {
      e.fa = a; moveTo(e, a, e.spd, s);
      contact(e, dt, p, d, 900, 'shield');
      e.bashT -= dt;
      if (e.bashT <= 0 && d < e.r + p.r + SH_REACH) { e.st = 'wind'; e.t = 0; }
    } else if (e.st === 'wind') {
      e.t += dt;
      if (e.t < 350) e.fa = a;
      moveTo(e, e.fa + Math.PI, 12, s);               // retrocede ~6 px
      if (e.t >= 500) {
        e.st = 'bash'; e.t = 0; fx.shake(3, 100); G.sfx('hit_heavy', { vol: 0.5 });
        if (!p.dead && inFan(e, p, e.fa, 45 * DEG, e.r + p.r + SH_REACH)) G.Player.hurt(p, e.dmg, e.x, e.y, { src: 'shield', kb: 1 });
        fx.ring(e.x + Math.cos(e.fa) * e.r, e.y + Math.sin(e.fa) * e.r, 4, 36, 200, '#ffffff', 3);
      }
    } else if (e.st === 'bash') {
      e.t += dt;
      if (e.t >= 150) { e.st = 'rec'; e.t = 0; e.shieldDown = true; }
    } else if (e.st === 'rec') {                     // escudo bajo: ventana de vulnerabilidad
      e.t += dt;
      if (e.t >= 400) { e.st = 'move'; e.shieldDown = false; e.bashT = 4000; }
    }
  }

  // Polilla gélida: vuelo errático y orbe de hielo
  function ai_moth(e, dt, s, p, d, a) {
    if (e.st === 'move') {
      var w = Math.sin(e.anim / 330) * 0.9;
      kite(e, a, d, 150, 190, s, w);
      contact(e, dt, p, d, 900, 'moth');
      e.shootT -= dt;
      if (e.shootT <= 0) { e.st = 'charge'; e.t = 0; e.ang = a; }
    } else if (e.st === 'charge') {
      e.t += dt; e.ang = a;
      if (e.t >= 450) {
        E.shoot('e', e.x, e.y - 4, e.ang, 150, e.dmg, 'proj_frost_orb', { r: 8, life: 4500, hp: 1, slow: [0.35, 2000], orb: true, src: 'moth' });
        G.sfx('shoot', { pitch: 1.8, vol: 0.4 });
        e.st = 'throw'; e.t = 0;
      }
    } else if (e.st === 'throw') {
      e.t += dt;
      if (e.t >= 250) { e.st = 'move'; e.shootT = 3050; }
    }
  }

  // Sembrador: planta zonas de esporas donde está el jugador
  function ai_sower(e, dt, s, p, d, a) {
    if (e.st === 'move') {
      kite(e, a, d, 200, 280, s);
      contact(e, dt, p, d, 900, 'sower');
      e.sumT -= dt;
      if (e.sumT <= 0 && E.zonesOf(e, 'spore') < 5) { e.st = 'sow'; e.t = 0; }
      else if (e.sumT <= 0) e.sumT = 1000;
    } else if (e.st === 'sow') {
      e.t += dt;
      if (e.t >= 500) {
        E.zone({ kind: 'spore', x: p.x, y: p.y, r: 42, arm: 900, life: 4000, dmg: e.dmg, tick: 500, slow: 0.15, owner: e, src: 'sower' });
        G.sfx('wave_start', { pitch: 1.6, vol: 0.35 });
        e.st = 'move'; e.sumT = 4000;
      }
    }
  }

  // Espectro: se desvanece, reaparece a 55 px del jugador y tajea
  var BL_REACH = 50;
  function ai_blinker(e, dt, s, p, d, a) {
    if (e.st === 'move') {
      kite(e, a, d, 190, 220, s);
      e.atkT -= dt;
      if (e.atkT <= 0) {
        e.st = 'fade'; e.t = 0; e.immune = true;
        var an = G.rnd(0, 6.283), m = G.WALL + 20;
        e.tx = G.clamp(p.x + Math.cos(an) * 55, m, G.AW - m); e.ty = G.clamp(p.y + Math.sin(an) * 55, m, G.AH - m);
        fx.puff(e.x, e.y, 1);
      }
    } else if (e.st === 'fade') {
      e.t += dt;
      if (e.t >= 500) {
        e.immune = false; fx.puff(e.x, e.y, 1);
        e.x = e.tx; e.y = e.ty; fx.puff(e.x, e.y, 2); fx.burst(e.x, e.y, 8, '#a98aff', 140, 400, 3, { add: true });
        e.st = 'slash'; e.t = 0; e.ang = Math.atan2(p.y - e.y, p.x - e.x);
      }
    } else if (e.st === 'slash') {
      e.t += dt;
      if (e.t < 200) e.ang = a;                      // se fija en los últimos 150 ms
      if (e.t >= 350) {
        fx.slash(e.x, e.y, e.ang, 1.1, '#ff4040'); G.sfx('hit_heavy', { pitch: 1.3, vol: 0.5 });
        if (!p.dead && inFan(e, p, e.ang, 50 * DEG, BL_REACH + p.r)) G.Player.hurt(p, e.dmg, e.x, e.y, { src: 'blinker' });
        e.st = 'rec'; e.t = 0;
      }
    } else if (e.st === 'rec') {
      e.t += dt;
      if (e.t >= 700) { e.st = 'move'; e.atkT = 3500; }
    }
  }

  // Ascua: carga con rastro de fuego
  function ai_scorcher(e, dt, s, p, d, a) {
    if (e.st === 'move') {
      moveTo(e, a, e.spd, s);
      contact(e, dt, p, d, 900, 'scorcher');
      e.atkT -= dt;
      if (e.atkT <= 0 && d < 320) { e.st = 'wind'; e.t = 0; e.ang = a; e.face = Math.cos(a) >= 0 ? 1 : -1; }
    } else if (e.st === 'wind') {
      e.t += dt;
      if (e.t < 450) { e.ang = a; e.face = Math.cos(a) >= 0 ? 1 : -1; }
      if (e.t % 120 < dt && Math.random() < 0.8) fx.smoke(e.x, e.y, 1);
      if (e.t >= 600) { e.st = 'dash'; e.t = 0; e.hitDone = false; e.trailT = 0; G.sfx('boss_roar', { pitch: 2, vol: 0.3 }); }
    } else if (e.st === 'dash') {
      e.t += dt; e.trailT -= dt;
      moveTo(e, e.ang, 300, s);
      if (e.trailT <= 0) { e.trailT = 60; E.zone({ kind: 'fire', x: e.x, y: e.y, r: 11, arm: 0, life: 2500, dmg: e.dmg * 5 / 12, tick: 400, src: 'scorcher_trail' }); }
      if (!e.hitDone && !p.dead && d < e.r + p.r) { e.hitDone = true; G.Player.hurt(p, e.dmg, e.x, e.y, { src: 'scorcher' }); }
      var m = G.WALL + e.r + 1;
      if (e.t >= 500 || e.x <= m || e.x >= G.AW - m || e.y <= m || e.y >= G.AH - m) { e.st = 'rec'; e.t = 0; fx.dust(e.x, e.y, 4); }
    } else if (e.st === 'rec') {
      e.t += dt;
      if (e.t >= 700) { e.st = 'move'; e.atkT = 3500; }
    }
  }

  // ---- Élite: Coloso Escudero
  function afterAttack(e) {                          // cada 3 ataques, ventana larga con el escudo bajo
    e.ai++;
    if (e.ai % 3 === 0) { e.st = 'rec'; e.t = 0; e.recDur = 1200; e.shieldDown = true; fx.ring(e.x, e.y, 10, 40, 400, '#ffe27a', 3); }
    else { e.st = 'rec'; e.t = 0; e.recDur = 500; }
  }
  function ai_bulwark(e, dt, s, p, d, a) {
    var BASH_R = 100;
    if (e.st === 'move') {
      e.fa = a;
      if (d > e.r + p.r + 8) moveTo(e, a, e.spd, s);
      contact(e, dt, p, d, 1000, 'bulwark');
      e.atkT -= dt;
      var kind = e.ai % 2 === 0 ? 'bash' : 'stomp';
      if (e.atkT <= 0 && ((kind === 'bash' && d < BASH_R) || (kind === 'stomp' && d < 190))) {
        e.kind = kind; e.t = 0; e.st = kind === 'bash' ? 'wind' : 'swind'; e.ang = a;
      }
    } else if (e.st === 'wind') {
      e.t += dt;
      if (e.t < 500) { e.fa = a; e.ang = a; }
      if (e.t >= 700) {
        e.st = 'strike'; e.t = 0; fx.shake(6, 180); G.sfx('hit_heavy');
        if (!p.dead && inFan(e, p, e.ang, 45 * DEG, BASH_R + p.r)) G.Player.hurt(p, e.dmg, e.x, e.y, { src: 'bulwark', kb: 1.4 });
        fx.ring(e.x, e.y, 20, BASH_R, 250, '#ffcf7a', 4);
      }
    } else if (e.st === 'strike') {
      e.t += dt;
      if (e.t >= 150) afterAttack(e);
    } else if (e.st === 'swind') {
      e.t += dt;
      if (e.t >= 700) { e.st = 'swave'; e.t = 0; e.waves = [{ t: 0, hit: false }, { t: -250, hit: false }, { t: -500, hit: false }]; fx.shake(7, 220); G.sfx('explosion', { pitch: 0.7 }); }
    } else if (e.st === 'swave') {
      e.t += dt;
      for (var i = 0; i < e.waves.length; i++) {
        var w = e.waves[i]; w.t += dt;
        if (w.t < 0 || w.t > 450) continue;
        w.r = 20 + 105 * (w.t / 450);
        if (!w.hit && !p.dead && Math.abs(d - w.r) <= 9 + p.r * 0.6) { w.hit = true; G.Player.hurt(p, e.dmg * 16 / 22, e.x, e.y, { src: 'bulwark', kb: 0.8 }); }
      }
      if (e.t >= 950) afterAttack(e);
    } else if (e.st === 'rec') {
      e.t += dt;
      if (e.t >= e.recDur) { e.st = 'move'; e.shieldDown = false; e.atkT = 1000; }
    }
  }

  // ---- Élite: Madre Colmena
  function ai_hive(e, dt, s, p, d, a) {
    if (e.st === 'move') {
      kite(e, a, d, 150, 230, s);
      contact(e, dt, p, d, 1000, 'hive');
      e.atkT -= dt; e.ecT -= dt;
      if (e.ecT <= 0) { e.st = 'swell'; e.t = 0; }
      else if (e.atkT <= 0) {
        if (e.ai++ % 2 === 0) {
          e.st = 'spit'; e.t = 0; e.land = [];
          for (var k = -1; k <= 1; k++) { var an = a + k * 0.5; e.land.push({ x: G.clamp(e.x + Math.cos(an) * 90, G.WALL + 12, G.AW - G.WALL - 12), y: G.clamp(e.y + Math.sin(an) * 90, G.WALL + 12, G.AH - G.WALL - 12) }); }
        } else {
          e.st = 'acid'; e.t = 0;
          E.zone({ kind: 'acid', x: p.x, y: p.y, r: 55, arm: 900, life: 4000, dmg: B.enemy.worm.dmg * B.dmgMult(mins()) * 1.2, tick: 500, slow: 0.15, owner: e, src: 'hive' });
          G.sfx('wave_start', { pitch: 0.8, vol: 0.4 });
        }
      }
    } else if (e.st === 'spit') {
      e.t += dt;
      if (e.t >= 500) {
        for (var i = 0; i < e.land.length; i++) E.spawn('worm', e.land[i].x, e.land[i].y, { summoned: true, spawnT: 120 });
        G.sfx('shoot', { pitch: 0.7, vol: 0.5 }); e.st = 'move'; e.atkT = 3000; e.land = null;
      }
    } else if (e.st === 'acid') {
      e.t += dt;
      if (e.t >= 500) { e.st = 'move'; e.atkT = 3000; }
    } else if (e.st === 'swell') {
      e.t += dt;
      if (e.t >= 800) {
        for (var j = 0; j < 6; j++) { var aa = j * 1.047 + G.rnd(-0.2, 0.2); E.spawn('worm', e.x + Math.cos(aa) * 60, e.y + Math.sin(aa) * 60, { summoned: true }); }
        fx.ring(e.x, e.y, 10, 90, 400, '#ffb73a', 5); fx.shake(5, 200); G.sfx('boss_roar', { pitch: 1.5, vol: 0.4 });
        e.st = 'move'; e.ecT = 15000; e.atkT = 2500;
      }
    }
  }

  // ---- Jefe: Pastor Corrupto
  function ai_boss(e, dt, s, p, d, a) {
    if (!e.rage && e.hp < e.maxHp * 0.5) {
      e.rage = true; fx.shake(8, 300); G.sfx('boss_roar'); fx.ring(e.x, e.y, 10, 120, 500, '#ff3030', 6);
      G.Hud.banner('¡EL PASTOR ENFURECE!', 1400, '#ff5a5a');
    }
    e.age += dt;
    if (!e.fury && e.age > 120000) {   // Furia: si sigue vivo a los 2 min, +50% daño y velocidad de ataque
      e.fury = true; e.dmg *= 1.5; fx.shake(8, 300); G.sfx('boss_roar'); G.Hud.banner('¡FURIA DEL PASTOR!', 1600, '#ff3030');
    }
    var rate = (e.rage ? 1.25 : 1) * (e.fury ? 1.5 : 1);
    e.callT -= dt;
    if (e.callT <= 0) {   // llamada del rebaño: 2 enemigos ya desbloqueados, con aviso de 600 ms
      e.callT = 20000;
      var pool = ['fanner', 'shield', 'moth'].filter(function (k) { return B.enemy[k].from <= G.time; });
      if (pool.length) {
        for (var c2 = 0; c2 < 2; c2++) {
          var ty = pool[Math.floor(Math.random() * pool.length)], ca = G.rnd(0, 6.283), cx = e.x + Math.cos(ca) * 90, cy = e.y + Math.sin(ca) * 90;
          if (G.dist(cx, cy, p.x, p.y) < 90) { cx = e.x - Math.cos(ca) * 90; cy = e.y - Math.sin(ca) * 90; }
          E.spawn(ty, cx, cy, { summoned: true, spawnT: 600 });
        }
        fx.ring(e.x, e.y, 10, 100, 500, '#a060ff', 5); G.sfx('wave_start', { pitch: 0.7 }); G.Hud.banner('¡LLAMADA DEL REBAÑO!', 1100, '#c090ff');
      }
    }
    if (e.rage) {
      e.sporeT -= dt;
      if (e.sporeT <= 0) {   // fase 2: 2 zonas de esporas a ~140 px del jugador
        e.sporeT = 10000;
        for (var sp = 0; sp < 2; sp++) {
          var sa = G.rnd(0, 6.283), mg = G.WALL + 40;
          E.zone({ kind: 'spore', x: G.clamp(p.x + Math.cos(sa) * 140, mg, G.AW - mg), y: G.clamp(p.y + Math.sin(sa) * 140, mg, G.AH - mg), r: 42, arm: 900, life: 4000, dmg: 10, tick: 500, slow: 0.15, src: 'boss_spore' });
        }
      }
    }
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
          if (ok && !p.dead) G.Player.hurt(p, e.dmg, e.x, e.y, { src: 'boss' });
        } else if (e.kind === 'slam') {
          fx.shake(8, 220); fx.dust(e.x, e.y, 14); fx.ring(e.x, e.y, 10, 70, 300, '#ff6a2a', 5); G.sfx('explosion', { pitch: 0.8 });
          if (!p.dead && G.dist(e.x, e.y, p.x, p.y) <= 70 + p.r) G.Player.hurt(p, e.dmg * 1.25, e.x, e.y, { src: 'boss' });
        } else {
          var n = e.rage ? 7 : 5, spread = Math.PI / 3;
          for (var k = 0; k < n; k++) E.shoot('e', e.x, e.y, e.ang - spread / 2 + spread * k / (n - 1), 200, e.dmg * 0.5, 'thorn', { r: 6, life: 5000, src: 'boss' });
          G.sfx('shoot', { pitch: 0.7 });
        }
        e.st = 'rec'; e.t = 0;
      }
    } else if (e.st === 'rec') {
      e.t += dt;
      if (e.t >= 400) { e.st = 'move'; e.atkT = 2500; }
    }
  }

  var AI = { worm: ai_worm, archer: ai_archer, boar: ai_boar, bomb: ai_bomb, warlock: ai_warlock, boss: ai_boss, fanner: ai_fanner, shield: ai_shield, moth: ai_moth,
    sower: ai_sower, blinker: ai_blinker, scorcher: ai_scorcher, mini_bulwark: ai_bulwark, mini_hive: ai_hive };

  // ------------------------------------------------------------- Update
  E.update = function (dt) {
    var s = dt / 1000, p = PL(), list = G.enemies, i, j, e;
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
      // estados (quemado, veneno, sangrado...) y ralentización
      if (G.Combat.tickStatus(e, dt)) continue;
      var slowF = e.slowT > 0 ? 1 - e.slowPct : 1;
      e.spd = B.enemy[e.type].spd * slowF;
      if (e.stunT > 0) { e.anim += 0; continue; }
      var dx = p.x - e.x, dy = p.y - e.y, d = Math.hypot(dx, dy), a = Math.atan2(dy, dx);
      if (Math.abs(dx) > 2 && !((e.type === 'boar' || e.type === 'scorcher') && (e.st === 'charge' || e.st === 'wind' || e.st === 'dash'))) e.face = dx >= 0 ? 1 : -1;
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
          var push = (min - dd2) / 2, wA = A.type === 'boss' ? 0 : A.big ? 0.25 : 1, wC = C.type === 'boss' ? 0 : C.big ? 0.25 : 1;
          if (wA + wC === 0) continue;
          var ta = wA / (wA + wC), tc = wC / (wA + wC);
          A.x -= ox / dd2 * push * 2 * ta; A.y -= oy / dd2 * push * 2 * ta;
          C.x += ox / dd2 * push * 2 * tc; C.y += oy / dd2 * push * 2 * tc;
        }
      }
    }
    for (i = list.length - 1; i >= 0; i--) if (list[i].dead) list.splice(i, 1);
    updateZones(dt);
    updateProjectiles(dt);
  };

  // ------------------------------------------------------------- Dibujo
  // Colores de peligro: rojo = daño directo; azul #7fd4ff = hielo; verde ácido #9bff4a = zonas persistentes; morado = invocación / teletransporte
  function RED(a) { return 'rgba(255,40,40,' + a + ')'; }
  function fan(c, x, y, r, ang, half, f) {
    c.save(); c.fillStyle = RED(0.12 + 0.25 * f); c.strokeStyle = 'rgba(255,90,90,0.8)'; c.lineWidth = 2;
    c.beginPath(); c.moveTo(x, y); c.arc(x, y, r, ang - half, ang + half); c.closePath(); c.fill(); c.stroke(); c.restore();
  }
  function disc(c, x, y, r, fill, stroke, lw) {
    c.beginPath(); c.arc(x, y, r, 0, 6.283); if (fill) { c.fillStyle = fill; c.fill(); } if (stroke) { c.strokeStyle = stroke; c.lineWidth = lw || 2; c.stroke(); }
  }

  function drawZone(c, z, i) {
    var t = G.time / 1000;
    c.save();
    if (z.kind === 'fire') {
      var a = Math.min(1, z.life / 400);
      if (G.hasSpr('fx_fire_cell')) {
        c.globalAlpha = a; var cv = Assets.sprite('fx_fire_cell', Math.floor(z.t / 110 + i) % 3); c.drawImage(cv, Math.round(z.x - z.r - 2), Math.round(z.y - z.r - 2), z.r * 2 + 4, z.r * 2 + 4);
      } else {
        c.globalAlpha = a; disc(c, z.x, z.y, z.r, 'rgba(255,70,20,' + (0.45 + 0.15 * Math.sin(z.t / 60 + i)) + ')', 'rgba(255,150,60,0.9)', 1.5);
        disc(c, z.x, z.y - 1, z.r * 0.5, 'rgba(255,220,90,0.7)');
      }
    } else if (z.arm > 0) {            // telegrafía: de rojo claro a verde, anillo punteado que se cierra
      var u = 1 - z.arm / z.armMax, rr = Math.round(255 + (155 - 255) * u), gg = Math.round(110 + (255 - 110) * u), bb = Math.round(100 + (74 - 100) * u);
      disc(c, z.x, z.y, z.r, 'rgba(' + rr + ',' + gg + ',' + bb + ',' + (0.1 + 0.16 * u) + ')');
      c.strokeStyle = 'rgba(' + rr + ',' + gg + ',' + bb + ',0.9)'; c.lineWidth = 2; c.setLineDash([6, 6]); c.lineDashOffset = -t * 20;
      c.beginPath(); c.arc(z.x, z.y, z.r, 0, 6.283); c.stroke(); c.setLineDash([]);
      c.globalAlpha = 0.7; c.beginPath(); c.arc(z.x, z.y, z.r * u, 0, 6.283); c.stroke();
    } else {
      var fa = Math.min(1, z.life / 500);
      c.globalAlpha = fa;
      var g = c.createRadialGradient(z.x, z.y, z.r * 0.2, z.x, z.y, z.r);
      g.addColorStop(0, 'rgba(155,255,74,0.42)'); g.addColorStop(1, 'rgba(155,255,74,0.2)');
      disc(c, z.x, z.y, z.r, g, '#9bff4a', 2);
      if (G.hasSpr('fx_spore_zone')) { var sp = Assets.sprite('fx_spore_zone', 1 + Math.floor(z.t / 250) % 2); c.globalAlpha = fa * 0.8; c.drawImage(sp, z.x - z.r, z.y - z.r, z.r * 2, z.r * 2); }
      else { c.globalAlpha = fa * 0.5; c.strokeStyle = '#d8ff9a'; c.lineWidth = 1.5; c.beginPath(); c.arc(z.x, z.y, z.r * (0.6 + 0.08 * Math.sin(t * 5 + i)), 0, 6.283); c.stroke(); }
    }
    c.restore();
  }

  E.drawGround = function (c) {
    var i, e, p = PL(), u;
    for (i = 0; i < G.zones.length; i++) if (G.zones[i].team === 'e') drawZone(c, G.zones[i], i);
    for (i = 0; i < G.enemies.length; i++) {
      e = G.enemies[i];
      if (e.dead) continue;
      if (e.spawnT > 0) { // telegrafía de aparición (morado si es una invocación)
        u = 1 - e.spawnT / (e.spawnMax || B.spawnTelegraph);
        var big = e.type === 'boss' || e.big, sm = e.summoned, ca = sm ? '176,96,255' : '255,60,60';
        c.save(); c.strokeStyle = sm ? '#b060ff' : '#ff4040'; c.fillStyle = 'rgba(' + ca + ',' + (0.15 + 0.2 * u) + ')'; c.lineWidth = 2;
        c.beginPath(); c.arc(e.x, e.y, (big ? 40 : 18) * (0.5 + 0.5 * u), 0, 6.283); c.fill(); c.stroke(); c.restore();
        continue;
      }
      if (e.type === 'boar' && e.st === 'wind') {
        var len = 171 + e.r, w = e.r * 2, f = e.t / 600;
        c.save(); c.translate(e.x, e.y); c.rotate(e.ang);
        c.fillStyle = 'rgba(255,40,40,' + (0.12 + 0.25 * f) + ')'; c.fillRect(0, -w / 2, len, w);
        c.strokeStyle = 'rgba(255,80,80,0.7)'; c.lineWidth = 1; c.strokeRect(0, -w / 2, len, w); c.restore();
      }
      if (e.type === 'scorcher' && e.st === 'wind') {   // línea de carga: la longitud real es 150 px de dash + cuerpos
        var sl = 150 + e.r + p.r, sw = e.r * 2, sf = e.t / 600;
        c.save(); c.translate(e.x, e.y); c.rotate(e.ang);
        c.fillStyle = RED(0.12 + 0.28 * sf); c.fillRect(0, -sw / 2, sl, sw);
        c.strokeStyle = 'rgba(255,120,60,0.9)'; c.lineWidth = 1.5; c.strokeRect(0, -sw / 2, sl, sw); c.restore();
      }
      if (e.type === 'bomb' && e.st === 'lit') {
        c.save(); c.fillStyle = 'rgba(255,90,40,' + (0.12 + 0.18 * (e.t / 700)) + ')'; c.strokeStyle = 'rgba(255,120,60,0.7)';
        c.beginPath(); c.arc(e.x, e.y, 60, 0, 6.283); c.fill(); c.stroke(); c.restore();
      }
      if (e.type === 'fanner' && e.st === 'aim') {
        fan(c, e.x, e.y, 260, e.ang, 20 * DEG, e.t / 500);
        if (e.t >= 350) {   // carriles definitivos de las 3 espinas
          c.save(); c.strokeStyle = 'rgba(255,120,100,0.85)'; c.lineWidth = 1;
          for (var k = -1; k <= 1; k++) { c.beginPath(); c.moveTo(e.x, e.y); c.lineTo(e.x + Math.cos(e.ang + k * 14 * DEG) * 260, e.y + Math.sin(e.ang + k * 14 * DEG) * 260); c.stroke(); }
          c.restore();
        }
      }
      if (e.type === 'shield') {
        if (e.st === 'wind') fan(c, e.x, e.y, e.r + p.r + SH_REACH, e.fa, 45 * DEG, e.t / 500);
        if (e.shieldDown) { c.save(); c.strokeStyle = 'rgba(255,230,120,0.9)'; c.lineWidth = 2; c.beginPath(); c.arc(e.x, e.y, e.r + 6, 0, 6.283); c.stroke(); c.restore(); }
      }
      if (e.type === 'moth' && e.st === 'charge') {
        u = e.t / 450;
        c.save(); c.strokeStyle = 'rgba(127,212,255,' + (0.3 + 0.4 * u) + ')'; c.lineWidth = 1.5; c.setLineDash([5, 5]);
        c.beginPath(); c.moveTo(e.x, e.y); c.lineTo(e.x + Math.cos(e.ang) * 320, e.y + Math.sin(e.ang) * 320); c.stroke(); c.setLineDash([]);
        c.globalCompositeOperation = 'lighter'; disc(c, e.x, e.y - 6, 3 + 8 * u, 'rgba(127,212,255,0.6)', '#e8f8ff', 1.5); c.restore();
      }
      if (e.type === 'sower' && e.st === 'sow') {
        c.save(); c.strokeStyle = 'rgba(155,255,74,0.8)'; c.lineWidth = 2; c.setLineDash([4, 4]); c.beginPath(); c.arc(e.x, e.y, e.r + 6 + 4 * Math.sin(e.t / 50), 0, 6.283); c.stroke(); c.restore();
      }
      if (e.type === 'blinker') {
        if (e.st === 'fade') {   // anillo morado donde va a reaparecer
          u = e.t / 500; c.save();
          if (G.hasSpr('fx_blink_ring')) { var br = Assets.sprite('fx_blink_ring', Math.floor(e.t / 120) % 2); c.globalAlpha = 0.6 + 0.4 * u; c.drawImage(br, e.tx - br.width / 2, e.ty - br.height / 2); }
          c.strokeStyle = 'rgba(169,138,255,0.95)'; c.fillStyle = 'rgba(138,106,224,' + (0.1 + 0.2 * u) + ')'; c.lineWidth = 2;
          c.beginPath(); c.arc(e.tx, e.ty, 20 - 6 * u, 0, 6.283); c.fill(); c.stroke();
          c.setLineDash([3, 5]); c.beginPath(); c.arc(e.tx, e.ty, 26, 0, 6.283); c.stroke(); c.restore();
        } else if (e.st === 'slash') fan(c, e.x, e.y, BL_REACH + p.r, e.ang, 50 * DEG, e.t / 350);
      }
      if (e.type === 'warlock') {   // halo morado permanente + anillo de invocación
        c.save(); c.strokeStyle = 'rgba(176,96,255,' + (0.3 + 0.15 * Math.sin(e.anim / 200)) + ')'; c.fillStyle = 'rgba(176,96,255,0.07)'; c.lineWidth = 2;
        c.beginPath(); c.ellipse(e.x, e.y + 8, 24, 10, 0, 0, 6.283); c.fill(); c.stroke();
        if (e.st === 'cast') { u = e.t / 500; c.strokeStyle = 'rgba(200,140,255,0.9)'; c.lineWidth = 3; c.beginPath(); c.arc(e.x, e.y, 12 + 38 * u, 0, 6.283); c.stroke(); }
        c.restore();
      }
      if (e.type === 'mini_bulwark') {
        if (e.st === 'wind') fan(c, e.x, e.y, 100 + p.r, e.ang, 45 * DEG, e.t / 700);
        else if (e.st === 'swind') {
          u = e.t / 700; c.save(); c.fillStyle = RED(0.1 + 0.2 * u); c.strokeStyle = 'rgba(255,90,90,0.85)'; c.lineWidth = 2;
          disc(c, e.x, e.y, 125, c.fillStyle, c.strokeStyle, 2); c.setLineDash([6, 6]);
          [50, 85].forEach(function (rr) { c.beginPath(); c.arc(e.x, e.y, rr, 0, 6.283); c.stroke(); });
          c.setLineDash([]); c.globalAlpha = 0.7; c.beginPath(); c.arc(e.x, e.y, 125 * u, 0, 6.283); c.stroke(); c.restore();
        } else if (e.st === 'swave') {
          c.save(); c.strokeStyle = 'rgba(255,70,50,0.9)'; c.lineWidth = 9;
          for (var wi = 0; wi < e.waves.length; wi++) { var wv = e.waves[wi]; if (wv.t < 0 || wv.t > 450) continue; c.globalAlpha = 1 - wv.t / 450 * 0.6; c.beginPath(); c.arc(e.x, e.y, wv.r, 0, 6.283); c.stroke(); }
          c.restore();
        }
        if (e.shieldDown) { c.save(); c.strokeStyle = 'rgba(255,230,120,0.9)'; c.lineWidth = 3; c.setLineDash([6, 4]); c.beginPath(); c.arc(e.x, e.y, e.r + 8, 0, 6.283); c.stroke(); c.restore(); }
      }
      if (e.type === 'mini_hive') {
        if (e.st === 'spit' && e.land) {
          u = e.t / 500; c.save();
          for (var li = 0; li < e.land.length; li++) { disc(c, e.land[li].x, e.land[li].y, 18, RED(0.12 + 0.25 * u), 'rgba(255,90,90,0.85)', 2); }
          c.restore();
        } else if (e.st === 'swell') {
          u = e.t / 800; c.save(); c.strokeStyle = 'rgba(255,183,58,' + (0.5 + 0.4 * Math.sin(e.t / 40)) + ')'; c.lineWidth = 3;
          c.beginPath(); c.arc(e.x, e.y, 20 + 50 * u, 0, 6.283); c.stroke(); c.restore();
        }
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

  // ---- Sprites. Los sprites de los enemigos nuevos viven en assets_enemies2.js; si aún no existen se usa un sprite viejo teñido.
  var FB = {
    enemy_fanner:       { spr: 'archer',  tint: '#2f8f5a' },
    enemy_shield:       { spr: 'boar',    tint: '#8fa0b8' },
    enemy_moth:         { spr: 'worm',    tint: '#4aa8ff' },
    enemy_sower:        { spr: 'warlock', tint: '#9a2a78' },
    enemy_blinker:      { spr: 'warlock', tint: '#8a6ae0', alpha: 0.85 },
    enemy_scorcher:     { spr: 'boar',    tint: '#ff7a1a' },
    enemy_mini_bulwark: { spr: 'boss',    tint: '#5a6478', sc: 0.67 },
    enemy_mini_hive:    { spr: 'boss',    tint: '#7a3aa8', sc: 0.67 }
  };

  // animación de los sprites originales (worm, archer, boar, bomb, warlock, boss)
  function oldAnim(base, e) {
    var w = Math.floor(e.anim / 110), st = e.st;
    switch (base) {
      case 'worm': return 'walk:' + w;
      case 'archer': return st === 'aim' ? 2 : 'walk:' + w;
      case 'boar': return (st === 'wind' || st === 'dash') ? 'attack:' + Math.min(1, Math.floor(e.t / 250)) : st === 'charge' ? 2 : 'walk:' + w;
      case 'bomb': return st === 'lit' ? 2 + Math.floor(e.t / 90) % 2 : 'walk:' + w;
      case 'warlock': return (st === 'cast' || st === 'sow') ? 2 : 'idle:' + Math.floor(e.anim / 250);
      case 'boss':
        if (e.type === 'boss') {
          if (e.st === 'tele' && e.kind === 'slam') return (e.t > e.dur - 300) ? 3 : 0;
          if (e.st === 'tele' && e.kind !== 'slam') return e.t > e.dur * 0.55 ? 2 : 0;
          if (e.st === 'rec') return e.kind === 'slam' ? 3 : 2;
        } else {
          if (e.st === 'strike' || e.st === 'swave' || e.st === 'spit') return 3;
          if (e.st === 'wind' || e.st === 'swind' || e.st === 'swell') return 2;
        }
        return 'idle:' + Math.floor(e.anim / 330);
    }
    return 0;
  }

  // animación de los sprites nuevos (nombres de anim en ASSETS_API.md / assets_enemies2.js)
  function newAnim(e) {
    var w = Math.floor(e.anim / 110), st = e.st;
    switch (e.type) {
      case 'fanner': return st === 'aim' ? 'aim' : st === 'rec' ? 'shoot:0' : 'walk:' + w;
      case 'shield': return st === 'wind' ? 'bash:0' : st === 'bash' ? 'bash:1' : st === 'rec' ? 'bash:2' : 'walk:' + w;
      case 'moth': return st === 'charge' ? 'charge' : st === 'throw' ? 'throw:0' : 'fly:' + Math.floor(e.anim / 70);
      case 'sower': return st === 'sow' ? 'sow:' + (e.t < 250 ? 0 : 1) : 'walk:' + w;
      case 'blinker': return st === 'fade' ? 'fade:' + Math.floor(e.t / 100) : st === 'slash' ? 'slash:' + (e.t < 200 ? 0 : 1) : 'idle:' + Math.floor(e.anim / 200);
      case 'scorcher': return st === 'wind' ? 'charge:0' : st === 'dash' ? 'charge:1' : st === 'rec' ? 'rec:0' : 'walk:' + w;
      case 'mini_bulwark': return st === 'wind' ? 'bash:0' : st === 'strike' ? 'bash:1' : st === 'swind' ? 'stomp:0' : st === 'swave' ? 'stomp:1' : st === 'rec' ? 'rec:0' : 'walk:' + Math.floor(e.anim / 160);
      case 'mini_hive': return st === 'spit' ? 'spit:0' : st === 'acid' ? 'acid:0' : st === 'swell' ? 'swell:' + Math.floor(e.t / 100) : 'float:' + Math.floor(e.anim / 140);
    }
    return 0;
  }

  // Devuelve { cv, sc, fb } con el canvas actual del enemigo
  function visual(e) {
    var name = B.enemy[e.type].spr, fb = FB[name];
    if (!fb) return { cv: Assets.sprite(name, oldAnim(name, e)), sc: 1, fb: null };
    if (G.hasSpr(name)) { try { return { cv: Assets.sprite(name, newAnim(e)), sc: 1, fb: null }; } catch (x) { /* anim desconocida: usa el reemplazo */ } }
    return { cv: Assets.sprite(fb.spr, oldAnim(fb.spr, e)), sc: fb.sc || 1, fb: fb };
  }

  // Tinte por estado: si hay varios se alternan para que los combos se lean
  function statusTint(e) {
    var l = [];
    if (e.slowT > 0) l.push('#4aa8ff');
    if (e.poisonT > 0) l.push('#5be03a');
    if (e.burnT > 0) l.push('#ff7a1a');
    if (e.bleedT > 0) l.push('#e01030');
    if (!l.length) return null;
    return l[Math.floor(e.anim / 260) % l.length];
  }

  var SHADOW = { boss: 2.5, boar: 1.4, shield: 1.2, scorcher: 1.5, mini_bulwark: 1.9, mini_hive: 2 };

  E.draw = function (c, e) {
    var v = visual(e), cv = v.cv, sc = v.sc * (e.sc || 1);
    var jump = e.jump || 0, hh = cv.height * sc;
    G.fx.spr(c, Assets.sprite('shadow', 0), e.x, e.y + hh / 2 - 6, { alpha: 0.6, sx: SHADOW[e.type] || (e.sc || 1) });
    var o = { flip: e.face < 0, sx: sc, sy: sc };
    if (e.spawnT > 0) { o.alpha = 0.25 + 0.4 * (1 - e.spawnT / (e.spawnMax || B.spawnTelegraph)); }
    else if (e.flash > 0) { o.tint = '#ffffff'; o.tintA = 1; }
    else if (e.stunT > 0) { o.tint = '#ffffaa'; o.tintA = 0.5; }
    else if (statusTint(e)) { var stt = statusTint(e); o.tint = stt; o.tintA = 0.38; }
    else if (e.type === 'archer' && e.st === 'aim') { o.tint = '#ffe27a'; o.tintA = 0.35 + 0.3 * Math.sin(e.t / 25); }
    else if (e.type === 'fanner' && e.st === 'aim') { o.tint = '#ff9a2a'; o.tintA = 0.2 + 0.3 * (e.t / 500); o.sx = sc * (1 + 0.1 * e.t / 500); }
    else if (e.type === 'shield' && e.st === 'wind') { o.tint = '#ffffff'; o.tintA = 0.25 + 0.35 * Math.sin(e.t / 40); }
    else if (e.type === 'moth' && e.st === 'charge') { o.tint = '#bfeaff'; o.tintA = 0.3 + 0.3 * Math.sin(e.t / 40); }
    else if (e.type === 'sower' && e.st === 'sow') { o.tint = '#9bff4a'; o.tintA = 0.3; }
    else if (e.type === 'scorcher' && (e.st === 'wind' || e.st === 'dash')) { o.tint = '#ffd23a'; o.tintA = 0.25 + 0.25 * Math.sin(e.t / 50); }
    else if (e.type === 'bomb' && e.st === 'lit' && Math.floor(e.t / 80) % 2) { o.tint = '#ff3030'; o.tintA = 0.6; }
    else if (e.type === 'boar' && e.st === 'stun') { o.tint = '#ffff80'; o.tintA = 0.25 + 0.15 * Math.sin(e.t / 60); }
    else if (e.type === 'mini_hive' && e.st === 'swell') { o.tint = '#ffb73a'; o.tintA = 0.3 + 0.3 * Math.sin(e.t / 40); o.sx = sc * (1 + 0.15 * e.t / 800); o.sy = o.sx; }
    else if (e.type === 'boss' && e.rage) { o.tint = e.fury ? '#ff0000' : '#ff2020'; o.tintA = 0.25 + 0.1 * Math.sin(e.anim / 100); }
    else if (v.fb) { o.tint = v.fb.tint; o.tintA = 0.5; }
    if (v.fb && v.fb.alpha && o.alpha == null) o.alpha = v.fb.alpha;
    if (e.immune) { o.alpha = 0.25 + 0.1 * Math.sin(e.t / 40); }
    if (e.type === 'boss' && e.st === 'tele' && e.kind !== 'slam') { o.sx = 1 + 0.05 * Math.sin(e.t / 40); }
    G.fx.spr(c, cv, e.x, e.y - jump, o);
    if (e.spawnT <= 0 && e.type !== 'boss') {
      var elite = B.enemy[e.type].elite;
      if (elite) {
        var bw = 52, bx2 = Math.round(e.x - bw / 2), by2 = Math.round(e.y - hh / 2 - 12);
        var blink = e.st === 'swell' && Math.floor(e.t / 80) % 2;
        c.fillStyle = '#1a0a12'; c.fillRect(bx2 - 1, by2 - 1, bw + 2, 7);
        c.fillStyle = blink ? '#ffffff' : '#ffb347'; c.fillRect(bx2, by2, Math.max(0, bw * e.hp / e.maxHp), 5);
      } else if (e.hp < e.maxHp) {
        var w = 22, bx = Math.round(e.x - w / 2), by = Math.round(e.y - hh / 2 - 6);
        c.fillStyle = '#1a0a12'; c.fillRect(bx - 1, by - 1, w + 2, 5);
        c.fillStyle = '#e04050'; c.fillRect(bx, by, Math.max(0, w * e.hp / e.maxHp), 3);
      }
    }
  };

  E.drawProjectiles = function (c) {
    for (var i = 0; i < G.projectiles.length; i++) {
      var q = G.projectiles[i];
      if (q.team === 'p') { G.Weapons.drawProj(c, q); continue; }
      if (q.orb) {   // orbe de hielo: halo procedural + sprite si existe
        c.save(); c.globalCompositeOperation = 'lighter'; c.fillStyle = 'rgba(127,212,255,' + (0.35 + 0.1 * Math.sin(q.t / 60)) + ')';
        c.beginPath(); c.arc(Math.round(q.x), Math.round(q.y), q.r + 5, 0, 6.283); c.fill(); c.restore();
        if (!q.spr) { c.save(); c.fillStyle = '#bfeaff'; c.strokeStyle = '#4aa8ff'; c.lineWidth = 2; c.beginPath(); c.arc(Math.round(q.x), Math.round(q.y), q.r - 1, 0, 6.283); c.fill(); c.stroke(); c.fillStyle = '#fff'; c.beginPath(); c.arc(q.x - 1, q.y - 1, 3, 0, 6.283); c.fill(); c.restore(); continue; }
      }
      if (!q.spr) continue;
      var cv = Assets.sprite(q.spr, Math.floor(q.t / 100) % 2);
      G.fx.spr(c, cv, q.x, q.y, { rot: q.orb ? 0 : q.ang });
    }
  };
})();
