/* enemies_panal.js - Familia del PANAL (DESIGN-v5-biomas.md B.6, fase P5): IA, telegrafías, animaciones y dibujo de los 9 monstruos de la colmena de Melaria.
   Se carga tras enemies.js y panal.js. Las IA se registran en E.PAI (E.update las usa cuando e.pai); Obrera y Larva reutilizan la IA base (gusano / bomba).
   Vuelo (e.fly): Aguijonera, Zángano, Polinizador, Avispa y Nodriza ignoran la miel y los pilares; Obrera, Larva, Guardia y Babosa son terrestres (la Babosa es inmune a la miel).
   SEDACIÓN por humo (B.4.3): los insectos dentro de una nube van -40 % más lentos, no atacan (se pausan sus temporizadores y se abortan los avisos aún sin daño) y no reciben la cura del Polinizador.
   Telegrafías en G.B.tele (families.js; regla de esquiva normal 250 + 1000 x salida / 190). */
(function () {
  'use strict';
  var G = window.G, B = G.B, E = G.Enemies, fx = G.fx, P = G.Panal, H = E.H, DEG = Math.PI / 180, TAU = 6.2832;
  var moveTo = H.moveTo, contact = H.contact, kite = H.kite, inFan = H.inFan, fsfx = H.fsfx, RED = H.RED, thinLine = H.thinLine, tdisc = H.tdisc, lane = H.lane;

  var DR = { rect: 60, len: 300, spd: 360, stunWall: 1000, stunMiss: 900, gap: [2200, 3200], range: 300, pillarHit: 150 };   // Zángano
  var SL = { every: 60, trailR: 26, trailMs: 3500, spitMs: 4000, globR: 34, globMs: 6000, kiteLo: 150, kiteHi: 230 };            // Babosa
  var PO = { gap: 3500, keepLo: 280, keepHi: 340 };                                                                              // Polinizador
  var WS = { fade: 500, slash: 350, reach: 50, half: 50 * DEG, dist: 55, rec: 700, gap: 3500 };                                  // Avispa
  var NU = { gap: 6000, max: 4 };                                                                                                // Nodriza

  // ---------------------------------------------------------------- Inicialización por enemigo (la llama E.spawn solo en el Panal)
  E.panInit = function (e, d, fe) {
    e.pai = !!E.PAI[e.type];
    if (fe.fly) e.fly = true;
    if (fe.slug) e.honeyImmune = true;
    e.spitT = G.rnd(1500, 3000); e.pulseT = G.rnd(1500, 3500);
    if (e.type === 'boar') e.atkT = G.rnd(1500, 3000);
    if (fe.wax) e.plateHp = fe.plate;   // escudo de cera: se funde con 40 de daño de Fuego (E.plateHit)
  };

  // ---------------------------------------------------------------- Sedación: envoltorio común
  var TIMERS = ['shootT', 'atkT', 'sumT', 'bashT', 'pulseT', 'spitT'], ABORT = { aim: 1, wind: 1, cast: 1, spit: 1, pulse: 1 };
  function wrap(fn) {
    return function (e, dt, s, p, d, a) {
      var sed = P.sedated(e), i, k, pre = null;
      if (sed && !e.sed) { e.sedAt = G.time; P.sfx('smoke_hiss', null, { vol: 0.5 }); }
      e.sed = sed;
      if (sed) {
        if (ABORT[e.st]) { e.st = 'move'; e.t = 0; for (i = 0; i < TIMERS.length; i++) if (typeof e[TIMERS[i]] === 'number') e[TIMERS[i]] = Math.max(e[TIMERS[i]], 1500); }
        e.spd *= B.biomes.panal.smoke.sedSpd; if (e.hitCd < 150) e.hitCd = 150;
        if (e.st === 'move') {
          pre = {};
          for (i = 0; i < TIMERS.length; i++) { k = TIMERS[i]; if (typeof e[k] === 'number') { if (e[k] < dt + 2) e[k] = dt + 2; pre[k] = e[k]; } }
        }
      }
      fn(e, dt, s, p, d, a);
      if (pre && e.st === 'move') for (k in pre) e[k] = pre[k];   // los temporizadores de ataque no avanzan mientras está sedado
    };
  }
  // rebota el sentido del giro al pegarse a un muro diagonal (kite solo conoce los lados rectos)
  function kiteP(e, a, d, lo, hi, s, wob) {
    kite(e, a, d, lo, hi, s, wob);
    if (P.wallDist(e.x, e.y) < 28 + e.r + 16 && (e.tw = (e.tw || 0)) < G.time) { e.strafe *= -1; e.tw = G.time + 600; }
  }

  // ---------------------------------------------------------------- Abeja aguijonera: tirador volador (aviso 400 ms, aguijón recto a 230 px/s)
  function ai_sting(e, dt, s, p, d, a) {
    if (e.st === 'move') {
      kiteP(e, a, d, 200, 260, s, Math.sin(e.anim / 330) * 0.5);
      e.shootT -= dt;
      if (e.shootT <= 0) { e.st = 'aim'; e.t = 0; e.ang = a; fsfx(e, 'tele', { vol: 0.8 }); }
      if (e.flT > 0) e.flT -= dt;
    } else if (e.st === 'aim') {
      e.t += dt; var ms = B.tele.archer.ms;
      if (e.t < ms - 150) e.ang = a;   // el apunte se fija en los últimos 150 ms
      if (e.t >= ms) {
        E.shoot('e', e.x, e.y, e.ang, e.fe.pspd || 230, e.dmg, e.fe.proj, { r: 6, src: 'archer', fb: e.fe.fb, sfxHit: e.fe.sfx.hit });
        fsfx(e, 'shoot', { vol: 0.6 }); e.flT = 220; e.st = 'move'; e.shootT = 2400;
      }
    }
  }

  // ---------------------------------------------------------------- Larva explosiva: bomba con mecha de 700 ms; deja un charco de miel (E.H.explode)
  function ai_larva(e, dt, s, p, d, a) {
    var was = e.st;
    E.AI.bomb(e, dt, s, p, d, a);
    if (was === 'move' && e.st === 'lit') fsfx(e, 'tele', { vol: 0.8 });
  }

  // ---------------------------------------------------------------- Zángano: embestida voladora (60 x 300, 600 ms de aviso); aturdido 1 s si choca con un pilar o muro (los pilares se dañan)
  function ai_drone(e, dt, s, p, d, a) {
    var st = e.st;
    if (st === 'move') {
      moveTo(e, a, e.spd, s);
      e.atkT -= dt;
      if (e.atkT <= 0 && d < DR.range && d > 80) { e.st = 'wind'; e.t = 0; e.ang = a; e.face = Math.cos(a) >= 0 ? 1 : -1; fsfx(e, 'tele', { vol: 0.9 }); }
      else if (e.atkT <= 0) e.atkT = 400;
    } else if (st === 'wind') {
      e.t += dt; var ms = B.tele.drone.ms;
      if (e.t < ms - 200) { e.ang = a; e.face = Math.cos(a) >= 0 ? 1 : -1; }
      if (e.t >= ms) { e.st = 'charge'; e.t = 0; e.trav = 0; e.hitDone = false; fsfx(e, 'charge', { vol: 0.8 }); }
    } else if (st === 'charge') {
      e.t += dt; var step = DR.spd * s; e.x += Math.cos(e.ang) * step; e.y += Math.sin(e.ang) * step; e.trav += step;
      if (!e.hitDone && !p.dead && d < e.r + p.r) { e.hitDone = true; G.Player.hurt(p, e.dmg, e.x, e.y, { src: 'boar', kb: 1.2 }); }
      var pil = P.pillarAt(e.x, e.y, e.r * 0.8), m = G.WALL + e.r + 1, wall = e.x <= m || e.x >= G.AW - m || e.y <= m || e.y >= G.AH - m || P.wallDist(e.x, e.y) <= 28 + e.r + 1;
      if (pil || wall) {
        if (pil) P.hitPillar(pil.i, DR.pillarHit);
        e.st = 'stun'; e.t = 0; e.stunMs = DR.stunWall; fx.shake(4, 120); fx.dust(e.x, e.y, 6); fsfx(e, 'crash', { vol: 0.8 });
      } else if (e.trav >= DR.len) { e.st = 'stun'; e.t = 0; e.stunMs = DR.stunMiss; }
    } else if (st === 'stun') {   // vulnerable (Combat.deal: x1,5 en stun)
      e.t += dt; if (e.t >= (e.stunMs || DR.stunMiss)) { e.st = 'move'; e.atkT = G.rnd(DR.gap[0], DR.gap[1]); }
    }
  }

  // ---------------------------------------------------------------- Guardia de cera: Escudero con escudo frontal de cera que se funde con 40 de Fuego
  function ai_guard(e, dt, s, p, d, a) {
    if (e.plateFlash > 0) e.plateFlash -= dt;
    if (e.meltT > 0) e.meltT -= dt;
    var was = e.st; E.AI.shield(e, dt, s, p, d, a);
    if (was === 'move' && e.st === 'wind') fsfx(e, 'tele', { vol: 0.8 });
  }

  // ---------------------------------------------------------------- Babosa de miel: zonificador lento (rastro de miel cada 60 px, escupitajo cada 4 s)
  function ai_slug(e, dt, s, p, d, a) {
    var st = e.st;
    if (e.lx == null) { e.lx = e.x; e.ly = e.y; }
    if (st === 'move') {
      kiteP(e, a, d, SL.kiteLo, SL.kiteHi, s);
      contact(e, dt, p, d, 900, 'honeyslug');
      if (Math.hypot(e.x - e.lx, e.y - e.ly) >= SL.every) { P.puddle(e.x, e.y + 4, SL.trailR, SL.trailMs, { owner: e }); e.lx = e.x; e.ly = e.y; }
      if ((e.crawlT = (e.crawlT || 0) - dt) <= 0) { e.crawlT = 550; if (d < 380) fsfx(e, 'crawl', { vol: 0.4 }); }
      e.spitT -= dt;
      if (e.spitT <= 0 && d < 330 && d > 60) { e.st = 'spit'; e.t = 0; e.tx = p.x; e.ty = p.y; e.face = e.tx >= e.x ? 1 : -1; fsfx(e, 'tele', { vol: 0.8 }); }
      else if (e.spitT <= 0) e.spitT = 500;
    } else if (st === 'spit') {
      e.t += dt;
      if (e.t >= B.tele.slug.ms) { P.spitGlob(e, e.tx, e.ty, { r: SL.globR, life: SL.globMs }); e.st = 'rec'; e.t = 0; }
    } else if (st === 'rec') {
      e.t += dt; if (e.t >= 300) { e.st = 'move'; e.spitT = SL.spitMs; }
    }
  }

  // ---------------------------------------------------------------- Polinizador: curandero volador. Mantiene 280 px y huye; cada 3,5 s pulso de 500 ms (anillo verde con cruz) que cura a los aliados en r 120
  function ai_pollen(e, dt, s, p, d, a) {
    if (e.st === 'move') {
      kiteP(e, a, d, PO.keepLo, PO.keepHi, s, Math.sin(e.anim / 400) * 0.4);
      e.pulseT -= dt;
      if (e.pulseT <= 0) { e.st = 'pulse'; e.t = 0; fsfx(e, 'tele', { vol: 0.8 }); }
    } else if (e.st === 'pulse') {
      e.t += dt;
      if (e.t >= B.tele.pollen.ms) {
        var n = P.healPulse(e, e.x, e.y);
        fx.ring(e.x, e.y, 10, B.biomes.panal.heal.r, 400, '#b8ff9a', 4); fx.burst(e.x, e.y, 8, '#b8ff9a', 120, 500, 3, { add: true });
        fsfx(e, 'pulse', { vol: 0.7 }); e.st = 'move'; e.pulseT = PO.gap; e.healed = n;
      }
    }
  }

  // ---------------------------------------------------------------- Avispa: asesina rápida (IA del Espectro): borrón de 500 ms, reaparece a 55 px y tajo de 350 ms (arco 100 grados)
  function ai_wasp(e, dt, s, p, d, a) {
    var st = e.st;
    if (st === 'move') {
      kiteP(e, a, d, 190, 220, s, Math.sin(e.anim / 250) * 0.6);
      e.atkT -= dt;
      if (e.atkT <= 0) {
        e.st = 'fade'; e.t = 0; e.immune = true; fsfx(e, 'tele', { vol: 0.8 });
        var an = G.rnd(0, TAU), q = P.clampPt(p.x + Math.cos(an) * WS.dist, p.y + Math.sin(an) * WS.dist, 20);
        e.tx = q[0]; e.ty = q[1]; fx.puff(e.x, e.y, 1);
      }
    } else if (st === 'fade') {
      e.t += dt;
      if (e.t >= WS.fade) {
        e.immune = false; fx.puff(e.x, e.y, 1); e.x = e.tx; e.y = e.ty; fx.burst(e.x, e.y, 8, '#f3a31f', 140, 400, 3, { add: true });
        e.st = 'slash'; e.t = 0; e.ang = Math.atan2(p.y - e.y, p.x - e.x); fsfx(e, 'blink', { vol: 0.6 });
      }
    } else if (st === 'slash') {
      e.t += dt; if (e.t < 200) e.ang = a;
      if (e.t >= WS.slash) {
        fx.slash(e.x, e.y, e.ang, 1.1, '#f3a31f'); fsfx(e, 'slash', { vol: 0.8 });
        if (!p.dead && inFan(e, p, e.ang, WS.half, WS.reach + p.r)) G.Player.hurt(p, e.dmg, e.x, e.y, { src: 'blinker' });
        e.st = 'rec'; e.t = 0;
      }
    } else if (st === 'rec') {
      e.t += dt; if (e.t >= WS.rec) { e.st = 'move'; e.atkT = WS.gap; }
    }
  }

  // ---------------------------------------------------------------- Nodriza: invocadora voladora. Aviso 500 ms y 2 Larvas explosivas cada 6 s (máx. 4 vivas); matarla las disipa
  function ai_nurse(e, dt, s, p, d, a) {
    if (e.st === 'move') {
      if (d < 260) {
        var fa = a + Math.PI, nx = e.x + Math.cos(fa) * 30, ny = e.y + Math.sin(fa) * 30, m = G.WALL + 40;
        if (nx < m || nx > G.AW - m || ny < m || ny > G.AH - m || !P.inside(nx, ny, 30)) fa += (e.strafe > 0 ? 1 : -1) * Math.PI / 2;
        moveTo(e, fa, e.spd, s);
      }
      e.sumT -= dt;
      if (e.sumT <= 0) { e.st = 'cast'; e.t = 0; fsfx(e, 'tele', { vol: 0.8 }); }
    } else if (e.st === 'cast') {
      e.t += dt;
      if (e.t >= B.tele.nurse.ms) {
        var alive = 0; G.enemies.forEach(function (o) { if (!o.dead && o.owner === e) alive++; });
        for (var i = 0; i < 2 && alive < NU.max; i++, alive++) {
          var q = P.clampPt(e.x + G.rnd(-34, 34), e.y + G.rnd(-24, 24) + 14, 16), w = E.spawn('bomb', q[0], q[1], { summoned: true }); w.owner = e;
          fx.bolt(e.x, e.y - 6, w.x, w.y, '#b060ff', 2);
        }
        fx.ring(e.x, e.y, 5, 40, 300, '#a060ff', 3); fsfx(e, 'summon', { vol: 0.6 });
        e.st = 'move'; e.sumT = NU.gap;
      }
    }
  }

  E.PAI.worm = wrap(E.AI.worm); E.PAI.archer = wrap(ai_sting); E.PAI.bomb = wrap(ai_larva); E.PAI.boar = wrap(ai_drone); E.PAI.shield = wrap(ai_guard);
  E.PAI.honeyslug = wrap(ai_slug); E.PAI.pollinator = wrap(ai_pollen); E.PAI.blinker = wrap(ai_wasp); E.PAI.warlock = wrap(ai_nurse);

  // ---------------------------------------------------------------- Telegrafías (suelo): rojo = daño directo, morado = invocación, verde pálido con cruz = cura enemiga, ámbar = miel
  E.panTele = function (c, e, p) {
    var st = e.st, ty = e.type, u, hw = e.r + p.r;
    if (ty === 'archer' && st === 'aim') {
      u = e.t / B.tele.archer.ms; thinLine(c, e.x, e.y, e.ang, 260, 'rgba(255,226,122,' + (0.35 + 0.5 * u) + ')', 1.5, e.t >= 250 ? null : [5, 5]);
    } else if (ty === 'bomb' && st === 'lit') {
      c.save(); c.fillStyle = 'rgba(255,90,40,' + (0.12 + 0.18 * (e.t / 700)) + ')'; c.strokeStyle = 'rgba(40,10,4,0.7)'; c.lineWidth = 6; c.beginPath(); c.arc(e.x, e.y, 60, 0, TAU); c.stroke();
      c.strokeStyle = 'rgba(255,120,60,0.9)'; c.lineWidth = 2.5; c.beginPath(); c.arc(e.x, e.y, 60, 0, TAU); c.fill(); c.stroke(); c.restore();
    } else if (ty === 'boar' && (st === 'wind' || st === 'charge')) {
      u = st === 'wind' ? e.t / B.tele.drone.ms : 1; var left = st === 'wind' ? DR.len : Math.max(0, DR.len - e.trav);
      lane(c, e.x, e.y, e.ang, left + e.r, DR.rect, u, st === 'charge' || e.t >= B.tele.drone.ms - 200);
    } else if (ty === 'shield' && st === 'wind') {
      H.fan(c, e.x, e.y, e.r + p.r + 40, e.fa, 45 * DEG, e.t / 500);
    } else if (ty === 'honeyslug' && st === 'spit') {
      u = e.t / B.tele.slug.ms; c.save(); c.beginPath(); c.arc(e.tx, e.ty, SL.globR, 0, TAU); c.fillStyle = 'rgba(201,122,20,' + (0.08 + 0.22 * u) + ')'; c.fill();
      c.strokeStyle = 'rgba(40,20,6,0.8)'; c.lineWidth = 6; c.stroke(); c.strokeStyle = '#e8a53a'; c.lineWidth = 3; c.setLineDash([6, 6]); c.lineDashOffset = -G.time / 40; c.stroke(); c.restore();
    } else if (ty === 'pollinator' && st === 'pulse') {
      u = e.t / B.tele.pollen.ms; var R = B.biomes.panal.heal.r;
      c.save(); c.beginPath(); c.arc(e.x, e.y, R, 0, TAU); c.fillStyle = 'rgba(184,255,154,' + (0.05 + 0.12 * u) + ')'; c.fill();
      c.strokeStyle = 'rgba(8,24,8,0.6)'; c.lineWidth = 6; c.stroke(); c.strokeStyle = 'rgba(184,255,154,0.95)'; c.lineWidth = 2.5; c.setLineDash([8, 6]); c.lineDashOffset = -G.time / 30; c.stroke(); c.setLineDash([]);
      c.lineWidth = 4; c.beginPath(); c.moveTo(e.x - 12, e.y - 26); c.lineTo(e.x + 12, e.y - 26); c.moveTo(e.x, e.y - 38); c.lineTo(e.x, e.y - 14); c.stroke(); c.restore();
    } else if (ty === 'blinker' && st === 'fade') {
      u = e.t / WS.fade; c.save(); c.strokeStyle = 'rgba(8,4,14,0.65)'; c.lineWidth = 5; c.beginPath(); c.arc(e.tx, e.ty, 22 - 6 * u, 0, TAU); c.stroke();
      c.strokeStyle = 'rgba(243,163,31,0.95)'; c.fillStyle = 'rgba(243,163,31,' + (0.1 + 0.2 * u) + ')'; c.lineWidth = 2; c.beginPath(); c.arc(e.tx, e.ty, 22 - 6 * u, 0, TAU); c.fill(); c.stroke(); c.restore();
    } else if (ty === 'blinker' && st === 'slash') {
      H.fan(c, e.x, e.y, WS.reach + p.r, e.ang, WS.half, e.t / WS.slash);
    } else if (ty === 'warlock' && st === 'cast') {
      u = e.t / B.tele.nurse.ms; c.save(); c.strokeStyle = 'rgba(8,4,14,0.6)'; c.lineWidth = 6; c.beginPath(); c.arc(e.x, e.y, 12 + 38 * u, 0, TAU); c.stroke();
      c.strokeStyle = 'rgba(200,140,255,0.95)'; c.lineWidth = 3; c.beginPath(); c.arc(e.x, e.y, 12 + 38 * u, 0, TAU); c.stroke(); c.restore();
    }
    if (e.sed && e.spawnT <= 0) {   // sedado: aro gris de volutas
      c.save(); c.strokeStyle = 'rgba(154,143,132,0.8)'; c.lineWidth = 2; c.setLineDash([3, 5]); c.lineDashOffset = G.time / 40; c.beginPath(); c.arc(e.x, e.y, e.r + 6, 0, TAU); c.stroke(); c.restore();
    }
  };

  // ---------------------------------------------------------------- Animación, tinte y dibujo (nombres de anim: assets_fam4.js / ASSETS_API.md 'Panal P5')
  E.panAnim = function (e) {
    var w = Math.floor(e.anim / 110), st = e.st, name = e.spr || '';
    if (!/^enemy_pan_/.test(name)) {   // sprite existente teñido mientras no haya arte propio
      if (name === 'enemy_moth') return e.st === 'pulse' ? 'charge' : 'fly:' + Math.floor(e.anim / 70);
      if (name === 'enemy_shield' || name === 'enemy_blinker') return H.newAnim(e);
      return H.oldAnim(name, e);
    }
    switch (e.type) {
      case 'worm': return 'walk:' + w;
      case 'archer': return st === 'aim' ? 'aim' : e.flT > 0 ? 'shoot:' + (e.flT > 110 ? 0 : 1) : 'fly:' + Math.floor(e.anim / 70);
      case 'bomb': return st === 'lit' ? (e.t > 550 ? 'prime' : 'lit:' + Math.floor(e.t / 100)) : 'crawl:' + w;
      case 'boar': return st === 'wind' ? 'wind' : st === 'charge' ? 'charge:' + Math.floor(e.t / 80) : st === 'stun' ? 'stun' : 'fly:' + Math.floor(e.anim / 70);
      case 'shield':
        if (e.plateHp > 0) return st === 'wind' ? 'wind' : st === 'bash' ? 'bash:1' : st === 'rec' ? 'rec' : 'walk:' + w;
        if (e.meltT > 0) return 'melt';
        return st === 'wind' ? 'wind_np' : st === 'bash' ? 'bash_np:1' : st === 'rec' ? 'rec_np' : e.spd > 5 ? 'walk_np:' + w : 'idle_np:' + w;
      case 'honeyslug': return st === 'spit' || st === 'rec' ? 'spit:' + (e.t < 250 ? 0 : 1) : 'crawl:' + Math.floor(e.anim / 160);
      case 'pollinator': return e.sed ? 'sedated:' + Math.floor(e.anim / 500) : st === 'pulse' ? 'pulse:' + (e.t < 250 ? 0 : 1) : 'fly:' + Math.floor(e.anim / 80);
      case 'blinker': return st === 'fade' ? 'fade:' + Math.floor(e.t / 120) : st === 'slash' ? 'sting:' + (e.t < 200 ? 0 : 1) : 'fly:' + Math.floor(e.anim / 66);
      case 'warlock': return st === 'cast' ? 'cast:' + (e.t < 250 ? 0 : 1) : 'fly:' + Math.floor(e.anim / 77);
    }
    return 0;
  };
  E.panTint = function (e, o) {
    var st = e.st, ty = e.type;
    if (e.sed) { o.tint = '#9a8f84'; o.tintA = 0.38; }
    else if (ty === 'boar' && st === 'wind') { o.tint = '#ff6a5a'; o.tintA = 0.2 + 0.3 * (e.t / B.tele.drone.ms); }
    else if (ty === 'boar' && st === 'stun') { o.tint = '#ffff80'; o.tintA = 0.25 + 0.15 * Math.sin(e.t / 60); }
    else if (ty === 'archer' && st === 'aim') { o.tint = '#ffe27a'; o.tintA = 0.35 + 0.3 * Math.sin(e.t / 25); }
    else if (ty === 'bomb' && st === 'lit' && Math.floor(e.t / 80) % 2) { o.tint = '#ff3030'; o.tintA = 0.55; }
    else if (ty === 'shield' && st === 'wind') { o.tint = '#ffffff'; o.tintA = 0.25 + 0.35 * Math.sin(e.t / 40); }
    else if (ty === 'honeyslug' && st === 'spit') { o.tint = '#e8a53a'; o.tintA = 0.2 + 0.3 * (e.t / 500); }
    else if (ty === 'pollinator' && st === 'pulse') { o.tint = '#b8ff9a'; o.tintA = 0.3 + 0.2 * Math.sin(e.t / 40); }
    else if (ty === 'blinker' && st === 'slash') { o.tint = '#ff6a5a'; o.tintA = 0.3; }
    else if (ty === 'warlock' && st === 'cast') { o.tint = '#b070ff'; o.tintA = 0.25; }
    if (ty === 'blinker' && st === 'fade') o.alpha = 0.2 + 0.25 * Math.sin(e.t / 40);
    else if (e.immune) o.alpha = 0.25 + 0.1 * Math.sin(e.t / 40);
  };
  E.panBob = function (e) { return -12 + Math.sin(e.anim / 220 + e.x * 0.01) * 3; };
})();
