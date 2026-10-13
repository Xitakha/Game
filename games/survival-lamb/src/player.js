/* player.js - El corderito: movimiento, combo x3, roll con i-frames y Llama Sagrada. */
(function () {
  'use strict';
  var G = window.G, B = G.B, P = G.Player = {};

  P.create = function () {
    return {
      x: G.AW / 2, y: G.AH / 2 + 70, r: B.player.r, hp: B.player.hp, maxHp: B.player.hp,
      kx: 0, ky: 0,                 // velocidad de empuje
      aim: 0, dirx: 1, lastDir: 0,  // ángulo de apuntado / orientación
      state: 'free', t: 0, step: 0, nextStep: 0, comboT: 0, hit: null, dead: false,
      atkBuf: 0, rollBuf: 0, spBuf: 0, atkAng: 0, atkFlip: false, comboSwing: 0, strike: false, cometPending: false,
      hurtT: 0, rollCd: 0, rollDx: 0, rollDy: 0, rollTrail: 0, perfT: 0,
      charges: 1, spCd: 0, kills: 0, squash: 0, moving: false, animT: 0, cometT: 0, killsCdr: 0,
      cards: {},
      stats: { dmg: 1, speed: 1, rollCd: B.roll.cd, crit: B.player.crit, killCdr: 0, heavy: false, smoke: false,
               novaR: 1, novaDmg: 0, lifesteal: 0, maxCharges: 1, comet: false }
    };
  };

  function easeOut(u) { return 1 - (1 - u) * (1 - u); }
  function wallClamp(p) {
    var m = G.WALL + p.r;
    p.x = G.clamp(p.x, m, G.AW - m); p.y = G.clamp(p.y, m, G.AH - m);
  }

  // ------------------------------------------------------------- Daño recibido
  // Devuelve true si el daño se aplicó. Roll con i-frames = esquiva (y roll perfecto).
  P.hurt = function (p, dmg, sx, sy) {
    if (p.dead || p.hurtT > 0) return false;
    if (p.state === 'roll' && p.t < p.iframes) {
      if (p.perfT <= 0) {
        p.perfT = 300;
        G.fx.num(p.x, p.y - 20, '!', '#ffe27a', true);
        P.reduceCd(B.special.cd * 0.15);
        G.fx.spark(p.x, p.y, 5);
        G.sfx('pickup');
      }
      return false;
    }
    p.hp -= dmg; p.hurtT = B.player.invuln;
    var a = Math.atan2(p.y - sy, p.x - sx), k = 12;
    p.kx = Math.cos(a) * B.player.kb * k; p.ky = Math.sin(a) * B.player.kb * k;
    if (p.state === 'attack' || p.state === 'cast') { p.state = 'free'; p.t = 0; }
    G.fx.shake(8, 200); G.fx.hit(50);
    G.fx.num(p.x, p.y - 18, Math.round(dmg), '#ff5a5a', true);
    G.fx.spark(p.x, p.y, 6, a);
    G.sfx('hurt');
    if (p.hp <= 0) { p.hp = 0; p.dead = true; p.state = 'dead'; G.fx.hit(120); G.fx.smoke(p.x, p.y, 8); }
    return true;
  };

  P.heal = function (p, n) {
    var before = p.hp; p.hp = Math.min(p.maxHp, p.hp + n);
    if (p.hp > before) G.fx.num(p.x, p.y - 22, '+' + Math.round(p.hp - before), '#7dff9a');
  };

  P.reduceCd = function (ms) {
    var p = G.player;
    if (p.charges >= p.stats.maxCharges) return;
    p.spCd -= ms;
    while (p.spCd <= 0 && p.charges < p.stats.maxCharges) {
      p.charges++;
      p.spCd += (p.charges < p.stats.maxCharges) ? B.special.cd : 0;
      if (p.charges >= p.stats.maxCharges) { p.spCd = 0; }
    }
  };

  // ------------------------------------------------------------- Acciones
  function startAttack(p, viaKey) {
    p.step = (p.comboT > 0) ? p.nextStep : 0;
    p.state = 'attack'; p.t = 0; p.hit = new Set(); p.atkBuf = 0; p.strike = false; p.cometPending = false;
    p.atkAng = viaKey ? p.lastDir : p.aim;
    p.dirx = Math.cos(p.atkAng) >= 0 ? 1 : -1;
    p.atkFlip = (p.step === 1);
    p.squash = 80;
    if (p.step === 0 && p.stats.comet && p.cometT <= 0) { p.cometPending = true; p.cometT = 3000; }
    G.sfx('roll', { pitch: 1.6 + p.step * 0.2, vol: 0.4 });
  }

  function startRoll(p, mx, my) {
    var dx = mx, dy = my;
    if (!dx && !dy) { dx = -Math.cos(p.aim); dy = -Math.sin(p.aim); }
    var l = Math.hypot(dx, dy) || 1; p.rollDx = dx / l; p.rollDy = dy / l;
    p.state = 'roll'; p.t = 0; p.rollBuf = 0; p.hit = null;
    p.iframes = B.roll.iframes + (p.stats.smoke ? 60 : 0);
    p.rollCd = p.stats.rollCd; p.rollTrail = 0;
    p.dirx = p.rollDx >= 0 ? 1 : -1;
    G.fx.dust(p.x, p.y + 10, 6); G.sfx('roll');
  }

  function startCast(p) {
    p.state = 'cast'; p.t = 0; p.spBuf = 0; p.nova = false;
    p.charges--; if (p.spCd <= 0) p.spCd = B.special.cd;
    p.squash = 80;
  }

  function doNova(p) {
    var S = B.special, st = p.stats, R = S.r * st.novaR, dmg = S.dmg + st.novaDmg;
    G.fx.shockwave(p.x, p.y, R * 2.3); G.fx.curse(p.x, p.y, 14, R * 0.8); G.sfx('shockwave'); G.fx.ring(p.x, p.y, 10, R, 350, '#ff8a3c', 6); G.fx.ring(p.x, p.y, 5, R * 0.7, 280, '#ffd27a', 3);
    G.fx.flames(p.x, p.y, 26, R * 0.9); G.fx.ember(p.x, p.y, 14, R * 0.6);
    G.fx.shake(10, 250); G.sfx('special');
    var list = G.enemies.slice();
    for (var i = 0; i < list.length; i++) {
      var e = list[i];
      if (e.dead || e.spawnT > 0) continue;
      if (G.dist(p.x, p.y, e.x, e.y) <= R + e.r) {
        var ang = Math.atan2(e.y - p.y, e.x - p.x);
        G.Enemies.damage(e, dmg * st.dmg, { kb: S.kb, ang: ang, burn: { dps: S.burnDps, t: S.burnT }, heavy: true, special: true });
      }
    }
    G.fx.hit(60);
  }

  function swingHit(p) {
    var c = B.combo[p.step], st = p.stats;
    var heavy = (p.step === 2 && st.heavy);
    var range = c.range, arc = c.arc * Math.PI / 180;
    if (heavy) arc = 160 * Math.PI / 180;
    var list = G.enemies;
    for (var i = 0; i < list.length; i++) {
      var e = list[i];
      if (e.dead || e.spawnT > 0 || p.hit.has(e)) continue;
      var d = G.dist(p.x, p.y, e.x, e.y);
      if (d - e.r > range) continue;
      var a = Math.atan2(e.y - p.y, e.x - p.x);
      if (d > e.r + 6 && Math.abs(G.angDiff(a, p.atkAng)) > arc / 2) continue;
      p.hit.add(e);
      var dmg = c.dmg * st.dmg * (heavy ? 1.5 : 1);
      var crit = Math.random() < st.crit; if (crit) dmg *= 2;
      var dealt = G.Enemies.damage(e, dmg, { kb: c.kb, ang: a, crit: crit, heavy: p.step === 2 });
      if (dealt > 0) {
        G.fx.hit(p.step === 2 || crit ? 80 : 50);
        if (p.step === 2) G.fx.shake(6, 150); else G.fx.shake(3, 80);
        G.fx.spark(e.x, e.y, G.rnd(6, 8) | 0, a);
        G.sfx(p.step === 2 ? 'hit_heavy' : 'hit', { pitch: 1 + 0.15 * p.step });
        if (st.lifesteal > 0) P.heal(p, Math.max(1, Math.round(dealt * st.lifesteal)));
      }
    }
  }

  // ------------------------------------------------------------- Update
  P.update = function (p, dt) {
    var s = dt / 1000, inp = G.input, st = p.stats;
    p.animT += dt;
    if (p.hurtT > 0) p.hurtT -= dt;
    if (p.rollCd > 0) p.rollCd -= dt;
    if (p.perfT > 0) p.perfT -= dt;
    if (p.comboT > 0) p.comboT -= dt;
    if (p.cometT > 0) p.cometT -= dt;
    if (p.squash > 0) p.squash -= dt;
    ['atkBuf', 'rollBuf', 'spBuf'].forEach(function (k) { if (p[k] > 0) p[k] -= dt; });
    // recarga de maldición
    if (p.charges < st.maxCharges) {
      p.spCd -= dt;
      if (p.spCd <= 0) { p.charges++; p.spCd = p.charges < st.maxCharges ? B.special.cd : 0; if (p.charges >= 1) G.sfx('pickup', { vol: 0.4 }); }
    }
    // empuje
    if (p.kx || p.ky) {
      p.x += p.kx * s; p.y += p.ky * s;
      var k = Math.exp(-12 * s); p.kx *= k; p.ky *= k;
      if (Math.abs(p.kx) + Math.abs(p.ky) < 4) p.kx = p.ky = 0;
    }
    if (p.dead) { wallClamp(p); return; }

    // apuntado
    var mx = inp.mouse.x + G.cam.x, my = inp.mouse.y + G.cam.y;
    p.aim = Math.atan2(my - p.y, mx - p.x);
    var ix = (inp.held('KeyD', 'ArrowRight') ? 1 : 0) - (inp.held('KeyA', 'ArrowLeft') ? 1 : 0);
    var iy = (inp.held('KeyS', 'ArrowDown') ? 1 : 0) - (inp.held('KeyW', 'ArrowUp') ? 1 : 0);
    var il = Math.hypot(ix, iy);
    if (il > 0) { ix /= il; iy /= il; p.lastDir = Math.atan2(iy, ix); } else if (!p.lastDir) p.lastDir = p.aim;
    p.moving = il > 0;

    // entradas con buffer (bloqueo breve tras cerrar menús)
    var locked = inp.lock > 0, viaKey = false;
    if (!locked) {
      if (inp.hit('Mouse0')) { p.atkBuf = B.buffer; p.viaKey = false; }
      else if (inp.hit('KeyJ')) { p.atkBuf = B.buffer; p.viaKey = true; }
      else if (inp.held('Mouse0') && p.atkBuf <= 0) { p.atkBuf = 60; p.viaKey = false; }
      else if (inp.held('KeyJ') && p.atkBuf <= 0) { p.atkBuf = 60; p.viaKey = true; }
      if (inp.hit('Space')) p.rollBuf = B.buffer;
      if (inp.hit('Mouse2', 'KeyK')) p.spBuf = B.buffer;
    }
    viaKey = p.viaKey;

    var spd = B.player.speed * st.speed;
    if (p.state === 'free') {
      p.dirx = Math.cos(p.aim) >= 0 ? 1 : -1;
      p.x += ix * spd * s; p.y += iy * spd * s;
      if (p.rollBuf > 0 && p.rollCd <= 0) startRoll(p, ix, iy);
      else if (p.spBuf > 0 && p.charges > 0) startCast(p);
      else if (p.atkBuf > 0) startAttack(p, viaKey);
    } else if (p.state === 'attack') {
      var c = B.combo[p.step], total = c.wind + c.act + c.rec;
      p.t += dt;
      var sp = spd * B.player.atkSlow;
      p.x += ix * sp * s; p.y += iy * sp * s;
      if (p.t < c.wind + c.act) { // avance
        var v = c.adv / ((c.wind + c.act) / 1000);
        p.x += Math.cos(p.atkAng) * v * s; p.y += Math.sin(p.atkAng) * v * s;
      }
      if (p.t >= c.wind && p.t < c.wind + c.act) {
        if (!p.strike) {
          p.strike = true;
          p.slashT = 0;
          if (p.cometPending) { p.cometPending = false; G.Enemies.shootComet(p, p.atkAng); }
        }
        swingHit(p);
      }
      if (p.t >= c.wind + c.act) { // recuperación: roll cancela, encadenado
        if (p.rollBuf > 0 && p.rollCd <= 0) startRoll(p, ix, iy);
        else if (p.atkBuf > 0 && p.step < 2 && p.t >= total - B.chainWindow) {
          p.comboT = 1; p.nextStep = p.step + 1; startAttack(p, viaKey);
        }
      }
      if (p.state === 'attack' && p.t >= total) {
        p.state = 'free';
        if (p.step < 2) { p.nextStep = p.step + 1; p.comboT = B.comboReset; } else { p.nextStep = 0; p.comboT = 0; }
      }
    } else if (p.state === 'roll') {
      p.t += dt;
      var R = B.roll, u = Math.min(1, p.t / R.dur);
      var vr = R.dist * 2 * (1 - u) / (R.dur / 1000);
      p.x += p.rollDx * vr * s; p.y += p.rollDy * vr * s;
      if (Math.random() < 0.3) G.fx.dust(p.x, p.y + 10, 1);
      if (st.smoke) {
        p.rollTrail -= dt;
        if (p.rollTrail <= 0) { p.rollTrail = 40; G.zones.push({ x: p.x, y: p.y + 4, r: 14, life: 1500, max: 1500 }); }
      }
      if (p.t >= R.dur) { p.state = 'free'; p.t = 0; }
    } else if (p.state === 'cast') {
      p.t += dt;
      if (!p.nova && p.t >= B.special.wind) { p.nova = true; doNova(p); }
      if (p.t >= B.special.wind + B.special.rec) { p.state = 'free'; p.t = 0; }
    }
    wallClamp(p);
    if (p.state === 'free' && p.moving && Math.random() < 0.06) G.fx.dust(p.x, p.y + 12, 1);
  };

  // ------------------------------------------------------------- Dibujo
  P.draw = function (c, p) {
    var shadow = Assets.sprite('shadow', 0);
    G.fx.spr(c, shadow, p.x, p.y + 14, { alpha: 0.6 });
    var frame;
    if (p.dead) frame = 'die:' + Math.floor((G.deadT || 0) / 110);
    else if (p.hurtT > 400 && p.state === 'free') frame = 13;
    else if (p.state === 'attack') {
      var cb = B.combo[p.step];
      frame = p.t < cb.wind ? 6 : (p.t < cb.wind + cb.act ? 7 : 8);
    } else if (p.state === 'cast') frame = p.t < B.special.wind ? 6 : 7;
    else if (p.state === 'roll') frame = 9 + Math.min(3, Math.floor(p.t / B.roll.dur * 4));
    else if (p.moving) frame = 'walk:' + Math.floor(p.animT / 80);
    else frame = 'idle:' + Math.floor(p.animT / 166);
    var cv = Assets.sprite('player', frame);
    var sq = p.squash > 0 ? 1 + 0.15 * (p.squash / 80) : 1;
    var alpha = 1;
    if (p.hurtT > 0 && !p.dead) alpha = (Math.floor(p.hurtT / 60) % 2) ? 0.45 : 1;
    if (p.state === 'roll' && p.t < p.iframes) alpha = 0.7;
    var o = { flip: p.dirx < 0, sx: sq, sy: 2 - sq, alpha: alpha };
    if (p.hurtT > 450) { o.tint = '#ff2020'; o.tintA = 0.7; }
    else if (p.state === 'cast') { o.tint = '#ffb347'; o.tintA = 0.35 + 0.3 * Math.sin(p.t / 30); }
    G.fx.spr(c, cv, p.x, p.y, o);
    // tajo
    if (p.state === 'attack' && p.t >= B.combo[p.step].wind - 10) {
      var cc = B.combo[p.step], u = (p.t - cc.wind) / (cc.act + 80);
      if (u >= 0 && u <= 1.2) {
        var sl = Assets.sprite('slash_' + (p.step + 1), Math.min(3, Math.floor(u * 4)));
        var sc = cc.range / 44;
        c.save(); c.translate(Math.round(p.x), Math.round(p.y)); c.rotate(p.atkAng);
        c.scale(sc, (p.atkFlip ? -1 : 1) * (p.step === 2 && p.stats.heavy ? sc * 1.3 : sc));
        c.globalAlpha = Math.max(0, 1.1 - u * 0.6);
        c.drawImage(sl, -4, -32);
        c.restore();
      }
    }
    if (p.state === 'cast') { // carga de la maldición
      c.save(); c.globalAlpha = 0.4 + 0.4 * (p.t / B.special.wind); c.strokeStyle = '#ff9a3c'; c.lineWidth = 2;
      c.beginPath(); c.arc(p.x, p.y, 30 * (1 - Math.min(1, p.t / B.special.wind)) + 12, 0, 6.283); c.stroke(); c.restore();
    }
  };
})();
