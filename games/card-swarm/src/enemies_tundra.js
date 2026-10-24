/* enemies_tundra.js - Familia de la TUNDRA (DESIGN-v5-biomas.md B.3, fase P3): IA, telegrafías, animaciones y dibujo de los 9 monstruos de la manada de Yarlak.
   Se carga tras enemies.js y tundra.js. Las IA se registran en E.TAI (las usa E.update cuando e.tai); los demás roles reutilizan la IA de enemies.js
   (Lobezno = gusano, Cazador = arquero con aviso de 700 ms, Chamán = brujo con aura de Frío).
   Regla de esquiva del HIELO: tele >= 250 + 220 + 1000 x salida / 190 (G.B.tele, families.js). Los terrestres se mueven con inercia (tau 300 ms, tundra.js); los que CARGAN
   (Lobo, Oso) tienen perfil propio: e.noSlide + velocidad propia con aceleración y derrape. */
(function () {
  'use strict';
  var G = window.G, B = G.B, E = G.Enemies, fx = G.fx, T = G.Tundra, H = E.H, DEG = Math.PI / 180;
  var moveTo = H.moveTo, contact = H.contact, kite = H.kite, inFan = H.inFan, fsfx = H.fsfx, RED = H.RED, thinLine = H.thinLine, tdisc = H.tdisc, lane = H.lane, disc = H.disc;

  // Constantes (B.3; los tiempos de aviso viven en G.B.tele)
  var WF = { ring: 200, gap: 1200, spd: 300, slide: 140, lenMin: 120, lenMax: 260, rec: 600, expMul: 1.25, turn: 0.45 };   // Lobo de escarcha: rodea a 200 px, un ataque cada 1,2 s, lance 300 px/s + derrape 140 px
  var BR = { rect: 70, len: 300, slide: 180, spd: 420, accel: 600, stun: 900, gap: [2200, 3200], range: 300 };             // Oso polar: acelera a 420 px/s en 600 ms, tras acabar patina 180 px
  var YT = { reach: 50, kb: 2, rec: 400, gap: 4000 };                                                                      // Yeti: abanico 90 grados alcance 50, empuje 120 px
  var BT = { spd: 350, lenMin: 160, lenMax: 380, rec: 500, gap: 2500, expMul: 1.3 };                                       // Murciélago: picado a 350 px/s, espera 2,5 s
  var SG = { wake: 120, ring: 40, crawl: 28, rearm: 5000, rest: 300 };                                                     // Estalagmita viva
  var SP = { dist: 55, whirlR: 36, whirlSlow: [0.25, 2000], reach: 50, push: 100 / 60, rec: 700, gap: 3500 };              // Espíritu de nieve

  // ---------------------------------------------------------------- Inicialización por enemigo (la llama E.spawn solo en la Tundra)
  E.tunInit = function (e, d, fe) {
    e.sf = T.slipAt(e.x, e.y); e.vx = e.vy = 0; e.mvx = e.mvy = 0;
    if (fe && fe.bat) e.fly = true;           // voladores: sin inercia de hielo ni choque con estalagmitas
    else e.slide = true;
    if (!fe || !fe.tun) return;
    e.tai = !!E.TAI[e.type];
    switch (e.type) {
      case 'frostwolf': e.st = 'surround'; e.cdT = G.rnd(600, 1800); e.rot = Math.random() * 6.283; break;
      case 'boar': e.atkT = G.rnd(1500, 3000); break;
      case 'shield': e.plateHp = fe.plate; e.bashT = G.rnd(2000, 4000); if (B.mat.on) e.mat = 'escarcha'; break;   // placa de hielo: cuenta como Escarcha hasta que se derrite con 30 de Fuego
      case 'moth': e.shootT = G.rnd(1500, 3000); break;
      case 'sower': e.st = 'dormant'; e.untarget = true; e.fixed = true; e.noSlide = true; e.rearm = 0; e.t = 0; break;
      case 'blinker': e.atkT = G.rnd(2500, 4200); break;
    }
  };

  // ---------------------------------------------------------------- Lobo de escarcha: IA de MANADA (rodea a 200 px y se turnan para atacar)
  var PK = { stamp: -1, t: 0, list: [], rot: 0 };
  function packTick(dt) {
    if (PK.stamp === G.time) return;
    PK.stamp = G.time; PK.t -= dt; PK.rot += dt / 1000 * WF.turn; PK.list.length = 0;
    for (var i = 0; i < G.enemies.length; i++) { var q = G.enemies[i]; if (q.type === 'frostwolf' && !q.dead && q.spawnT <= 0) PK.list.push(q); }
  }
  E.packOf = function () { return PK; };
  function wolfEnd(e) { e.st = 'surround'; e.noSlide = false; e.cdT = 400; e.t = 0; }
  function ai_wolf(e, dt, s, p, d, a) {
    packTick(dt);
    var st = e.st, m = G.WALL + e.r + 6;
    if (st === 'surround') {
      var n = PK.list.length || 1, k = PK.list.indexOf(e), ang = PK.rot + (k < 0 ? 0 : k) * 6.283 / n;
      var tx = G.clamp(p.x + Math.cos(ang) * WF.ring, m, G.AW - m), ty = G.clamp(p.y + Math.sin(ang) * WF.ring, m, G.AH - m);
      var dd = Math.hypot(tx - e.x, ty - e.y);
      if (dd > 8) moveTo(e, Math.atan2(ty - e.y, tx - e.x), e.spd * Math.min(1.4, 0.5 + dd / 120), s);
      if (e.hitCd > 0) e.hitCd -= dt; else if (!p.dead && d < e.r + p.r + 3) { G.Player.hurt(p, e.dmg * 0.5, e.x, e.y, { src: 'frostwolf' }); e.hitCd = 900; }   // el roce pesa la mitad: el golpe fuerte es el lance
      if (e.cdT > 0) e.cdT -= dt;
      else if (PK.t <= 0 && d > 90 && d < 380 && dd < 90) {   // le toca: agacha 700 ms
        PK.t = WF.gap; e.st = 'howl'; e.t = 0; e.ang = a; e.len = G.clamp(d + 20, WF.lenMin, WF.lenMax); fsfx(e, 'tele', { vol: 0.8 });
      }
    } else if (st === 'howl') {
      e.t += dt; e.face = Math.cos(e.ang) >= 0 ? 1 : -1;
      if (e.t < B.tele.wolf.ms - 150) { e.ang = a; e.len = G.clamp(d + 20, WF.lenMin, WF.lenMax); }   // el rumbo se fija en los últimos 150 ms (contorno sólido)
      if (e.t >= B.tele.wolf.ms) { e.st = 'lunge'; e.t = 0; e.noSlide = true; e.trav = 0; e.hitDone = false; e.lsp = WF.spd; fsfx(e, 'lunge', { vol: 0.85 }); }
    } else if (st === 'lunge' || st === 'skid') {
      e.t += dt; var step = e.lsp * s;
      e.x += Math.cos(e.ang) * step; e.y += Math.sin(e.ang) * step; e.trav += step;
      if (!e.hitDone && !p.dead && d < e.r + p.r + 2) { if (G.Player.hurt(p, e.dmg, e.x, e.y, { src: 'frostwolf' }) || G.god) e.hitDone = true; }
      var hit = e.x <= m || e.x >= G.AW - m || e.y <= m || e.y >= G.AH - m, bx = e.x, by = e.y; T.collide(e, e.r); if (Math.hypot(e.x - bx, e.y - by) > 0.5) hit = true;
      if (st === 'lunge' && (e.trav >= e.len || hit)) { e.st = 'skid'; e.t = 0; e.lsp = hit ? 0 : WF.spd; if (!hit) fx.dust(e.x, e.y + 6, 4); }   // derrape de 140 px: v0 / lambda con lambda = v0 / 140
      else if (st === 'skid') { e.lsp *= Math.exp(-WF.spd / WF.slide * s); if (e.lsp < 25) { e.st = 'rec'; e.t = 0; e.expT = WF.rec; e.expMul = WF.expMul; } }
    } else if (st === 'rec') {
      e.t += dt; if (e.expT > 0) e.expT -= dt;
      if (e.t >= WF.rec) wolfEnd(e);
    }
  }

  // ---------------------------------------------------------------- Oso polar: embestida con inercia (acelera 600 ms hasta 420 px/s) y derrape de 180 px
  function bearBlocked(e) { var bx = e.x, by = e.y; T.collide(e, e.r); var m = G.WALL + e.r + 1; return Math.hypot(e.x - bx, e.y - by) > 0.5 || e.x <= m || e.x >= G.AW - m || e.y <= m || e.y >= G.AH - m; }
  function ai_bear(e, dt, s, p, d, a) {
    var st = e.st;
    if (st === 'move') {
      moveTo(e, a, e.spd, s); contact(e, dt, p, d, 900, 'boar');
      e.atkT -= dt;
      if (e.atkT <= 0 && d < BR.range) { e.st = 'wind'; e.t = 0; e.ang = a; fsfx(e, 'tele', { vol: 0.9 }); }
    } else if (st === 'wind') {
      e.t += dt; var ms = B.tele.bear.ms;
      if (e.t < ms * 0.7) e.ang = a;   // el último 30 % de la telegrafía deja el contorno sólido y fijo (regla del hielo)
      if (e.t >= ms) { e.st = 'charge'; e.t = 0; e.noSlide = true; e.trav = 0; e.cv = 0; e.hitDone = false; fsfx(e, 'charge', { vol: 0.9 }); }
    } else if (st === 'charge' || st === 'slide') {
      e.t += dt;
      if (st === 'charge') e.cv = BR.spd * Math.min(1, e.t / BR.accel); else e.cv *= Math.exp(-BR.spd / BR.slide * s);
      var step = e.cv * s; e.x += Math.cos(e.ang) * step; e.y += Math.sin(e.ang) * step; e.trav += step;
      if (Math.random() < 0.4) fx.dust(e.x - Math.cos(e.ang) * 18, e.y + 14, 1);
      if (!e.hitDone && !p.dead && e.cv > 80 && d < e.r + p.r) { e.hitDone = true; G.Player.hurt(p, e.dmg, e.x, e.y, { src: 'boar', kb: 1.2 }); }
      var blk = bearBlocked(e);
      if (blk) { e.st = 'stun'; e.t = 0; fx.shake(4, 120); fx.dust(e.x, e.y, 6); fsfx(e, 'slide', { vol: 0.6 }); }
      else if (st === 'charge' && e.trav >= BR.len) { e.st = 'slide'; e.t = 0; fsfx(e, 'slide', { vol: 0.7 }); }
      else if (st === 'slide' && e.cv < 25) { e.st = 'stun'; e.t = 0; }
    } else if (st === 'stun') {   // vulnerable (Combat.deal: x1,5 en stun)
      e.t += dt;
      if (e.t >= BR.stun) { e.st = 'move'; e.noSlide = false; e.vx = e.vy = 0; e.atkT = G.rnd(BR.gap[0], BR.gap[1]); }
    }
  }

  // ---------------------------------------------------------------- Yeti: empellón (800 ms) con empuje de 120 px que patina; placa de hielo que se derrite con Fuego
  E.plateHit = function (e, dmg) {
    if (!(e.plateHp > 0)) return;
    e.plateHp -= dmg; e.plateFlash = 90;
    if (e.plateHp > 0) return;
    e.plateHp = 0; e.shield = 0; e.shieldDown = false; if (e.mat && e.fe) e.mat = e.fe.mat;
    fx.burst(e.x + Math.cos(e.fa || 0) * e.r, e.y + Math.sin(e.fa || 0) * e.r, 12, '#bfeaff', 200, 500, 3, { add: true }); fx.ring(e.x, e.y, 8, 40, 300, '#ffb347', 3);
    G.sfx('ice_break', { vol: 0.7 }); fx.num(e.x, e.y - e.r - 18, '¡PLACA DERRETIDA!', '#ffb347', true);
  };
  function ai_yeti(e, dt, s, p, d, a) {
    var st = e.st, reach = e.r + p.r + YT.reach;
    if (e.plateFlash > 0) e.plateFlash -= dt;
    if (st === 'move') {
      e.fa = a; moveTo(e, a, e.spd, s); contact(e, dt, p, d, 900, 'shield');
      if ((e.stepT = (e.stepT || 0) - dt) <= 0) { e.stepT = G.rnd(900, 1500); if (d < 380) fsfx(e, 'step', { vol: 0.4 }); }
      e.bashT -= dt;
      if (e.bashT <= 0 && d < reach + 14) { e.st = 'wind'; e.t = 0; fsfx(e, 'tele', { vol: 0.8 }); }
    } else if (st === 'wind') {
      e.t += dt;
      if (e.t < B.tele.yeti.ms - 150) e.fa = a;
      moveTo(e, e.fa + Math.PI, 12, s);   // retrocede un poco al armar el golpe
      if (e.t >= B.tele.yeti.ms) {
        e.st = 'bash'; e.t = 0; fx.shake(3, 100); G.sfx('hit_heavy', { vol: 0.5 }); fsfx(e, 'bash', { vol: 0.8 });
        if (!p.dead && inFan(e, p, e.fa, 45 * DEG, reach)) G.Player.hurt(p, e.dmg, e.x, e.y, { src: 'shield', kb: YT.kb });
        fx.ring(e.x + Math.cos(e.fa) * e.r, e.y + Math.sin(e.fa) * e.r, 4, 40, 220, '#ffffff', 3);
      }
    } else if (st === 'bash') {
      e.t += dt; if (e.t >= 150) { e.st = 'rec'; e.t = 0; e.shieldDown = true; }
    } else if (st === 'rec') {   // 400 ms vulnerable (placa abajo)
      e.t += dt; if (e.t >= YT.rec) { e.st = 'move'; e.shieldDown = false; e.bashT = YT.gap; }
    }
  }

  // ---------------------------------------------------------------- Murciélago de hielo: vuelo errático y picado
  function ai_bat(e, dt, s, p, d, a) {
    var st = e.st;
    if (st === 'move') {
      kite(e, a, d, 150, 230, s, Math.sin(e.anim / 330) * 0.9);
      contact(e, dt, p, d, 900, 'moth');
      if ((e.flapT = (e.flapT || 0) - dt) <= 0) { e.flapT = G.rnd(1800, 3200); if (d < 420) fsfx(e, 'flap', { vol: 0.3 }); }
      e.shootT -= dt;
      if (e.shootT <= 0 && d < 400) { e.st = 'aim'; e.t = 0; e.ang = a; fsfx(e, 'tele', { vol: 0.8 }); }
      else if (e.shootT <= 0) e.shootT = 600;
    } else if (st === 'aim') {
      e.t += dt; e.face = Math.cos(e.ang) >= 0 ? 1 : -1;
      if (e.t < B.tele.bat.ms - 150) { e.ang = a; e.len = G.clamp(d + 60, BT.lenMin, BT.lenMax); }
      if (e.t >= B.tele.bat.ms) { e.st = 'dive'; e.t = 0; e.trav = 0; e.hitDone = false; fsfx(e, 'dive', { vol: 0.9 }); }
    } else if (st === 'dive') {
      e.t += dt; var step = BT.spd * s; e.x += Math.cos(e.ang) * step; e.y += Math.sin(e.ang) * step; e.trav += step; e.face = Math.cos(e.ang) >= 0 ? 1 : -1;
      if (!e.hitDone && !p.dead && d < e.r + p.r + 2) { if (G.Player.hurt(p, e.dmg, e.x, e.y, { src: 'moth' }) || G.god) { e.hitDone = true; T.coldAdd(e.fe.cold); } }   // 6 + 8 de Frío
      var m = G.WALL + e.r + 1;
      if (e.trav >= e.len || e.x <= m || e.x >= G.AW - m || e.y <= m || e.y >= G.AH - m) { e.st = 'rec'; e.t = 0; e.expT = BT.rec; e.expMul = BT.expMul; }
    } else if (st === 'rec') {
      e.t += dt; if (e.expT > 0) e.expT -= dt;
      if (e.t >= BT.rec) { e.st = 'move'; e.shootT = BT.gap; }
    }
  }

  // ---------------------------------------------------------------- Estalagmita viva: trampa camuflada
  function stalagHit(e, p) { return !p.dead && G.dist(e.x, e.y, p.x, p.y) <= SG.ring + p.r * 0.6; }
  function ai_stalag(e, dt, s, p, d, a) {
    var st = e.st;
    if (st === 'dormant' || st === 'crawl') {
      if (st === 'crawl') { moveTo(e, a, SG.crawl, s); contact(e, dt, p, d, 1200, 'sower'); e.rearm -= dt; }
      if (!p.dead && d < SG.wake + p.r && (st === 'dormant' || e.rearm <= 0)) { e.st = 'tele'; e.t = 0; fsfx(e, 'tele', { vol: 0.9 }); }
    } else if (st === 'tele') {
      e.t += dt; if (Math.random() < 0.2) fx.dot(e.x + G.rnd(-10, 10), e.y + 8, G.rnd(-20, 20), -30, 400, '#bfeaff', 2, { drag: 1 });
      if (e.t >= B.tele.stalag.ms) {
        e.st = 'erupt'; e.t = 0; fx.shake(4, 140); fx.ring(e.x, e.y, 8, SG.ring + 8, 260, '#ffffff', 3); fx.burst(e.x, e.y, 10, '#bfeaff', 200, 400, 3, { add: true }); fsfx(e, 'erupt', { vol: 0.9 });
        if (stalagHit(e, p)) G.Player.hurt(p, e.dmg, e.x, e.y, { src: 'sower' });
        e.untarget = false; e.fixed = false; e.noSlide = false;   // ya despierta: se puede dañar
      }
    } else if (st === 'erupt') {
      e.t += dt; if (e.t >= SG.rest) { e.st = 'crawl'; e.t = 0; e.rearm = SG.rearm; }
    }
  }

  // ---------------------------------------------------------------- Espíritu de nieve: remolino de nieve + tajo que empuja 100 px
  function ai_spirit(e, dt, s, p, d, a) {
    var st = e.st;
    if (st === 'move') {
      kite(e, a, d, 190, 230, s);
      e.atkT -= dt;
      if (e.atkT <= 0) {
        e.st = 'fade'; e.t = 0; e.immune = true; fsfx(e, 'tele', { vol: 0.8 });
        var an = G.rnd(0, 6.283), mm = G.WALL + 24;
        e.tx = G.clamp(p.x + Math.cos(an) * SP.dist, mm, G.AW - mm); e.ty = G.clamp(p.y + Math.sin(an) * SP.dist, mm, G.AH - mm);
        e.whirl = E.zone({ kind: 'whirl', x: e.tx, y: e.ty, r: SP.whirlR, arm: 0, life: B.tele.spirit.ms - 350 + 2000, dmg: 0, tick: 300, slow: SP.whirlSlow[0], slowMs: SP.whirlSlow[1], owner: e, src: 'whirl' });   // remolino r 36: ralentiza 25 % durante 2 s
        fx.puff(e.x, e.y, 1);
      }
    } else if (st === 'fade') {
      e.t += dt;
      if (e.t >= B.tele.spirit.ms - 350) {   // 600 ms de desvanecimiento
        e.immune = false; fx.puff(e.x, e.y, 1); e.x = e.tx; e.y = e.ty; fx.puff(e.x, e.y, 2); fx.burst(e.x, e.y, 8, '#e8f4ff', 140, 400, 3, { add: true });
        e.st = 'slash'; e.t = 0; e.ang = Math.atan2(p.y - e.y, p.x - e.x);
      }
    } else if (st === 'slash') {
      e.t += dt; if (e.t < 200) e.ang = a;
      if (e.t >= 350) {
        fx.slash(e.x, e.y, e.ang, 1.1, '#e8f4ff'); G.sfx('hit_heavy', { pitch: 1.3, vol: 0.5 }); fsfx(e, 'slash', { vol: 0.8 });
        if (!p.dead && inFan(e, p, e.ang, 50 * DEG, SP.reach + p.r)) G.Player.hurt(p, e.dmg, e.x, e.y, { src: 'blinker', kb: SP.push });
        e.st = 'rec'; e.t = 0;
      }
    } else if (st === 'rec') {
      e.t += dt; if (e.t >= SP.rec) { e.st = 'move'; e.atkT = SP.gap; }
    }
  }

  E.TAI.frostwolf = ai_wolf; E.TAI.boar = ai_bear; E.TAI.shield = ai_yeti; E.TAI.moth = ai_bat; E.TAI.sower = ai_stalag; E.TAI.blinker = ai_spirit;
  // (archer = AI.archer con teleKey 'hunter'; worm = AI.worm; warlock = AI.warlock con castMs 600: Chamán del aullido; el aura de Frío la aplica tundra.js)

  // ---------------------------------------------------------------- Telegrafías (dibujo en el suelo; se pintan por encima de la bruma: contorno oscuro en todas)
  function fanO(c, x, y, r, ang, half, f) {   // abanico con contorno oscuro
    c.save(); c.beginPath(); c.moveTo(x, y); c.arc(x, y, r, ang - half, ang + half); c.closePath();
    c.strokeStyle = 'rgba(8,4,14,0.7)'; c.lineWidth = 6; c.stroke();
    c.fillStyle = RED(0.1 + 0.28 * f); c.fill(); c.strokeStyle = 'rgba(255,110,100,0.95)'; c.lineWidth = 2.5; c.stroke(); c.restore();
  }
  function dotted(c, x, y, ang, from, to, col) {   // tramo de derrape punteado
    c.save(); c.translate(x, y); c.rotate(ang);
    c.strokeStyle = 'rgba(8,4,14,0.65)'; c.lineWidth = 6; c.beginPath(); c.moveTo(from, 0); c.lineTo(to, 0); c.stroke();
    c.strokeStyle = col || 'rgba(190,225,255,0.95)'; c.lineWidth = 3; c.setLineDash([4, 7]); c.beginPath(); c.moveTo(from, 0); c.lineTo(to, 0); c.stroke(); c.restore();
  }
  E.tunTele = function (c, e, p) {
    var st = e.st, ty = e.type, u, hw = e.r + p.r, tk;
    if (ty === 'archer' && st === 'aim') {   // línea roja y parpadeo; SIEMPRE visible (también dentro de la bruma)
      tk = B.tele.hunter.ms; u = e.t / tk;
      thinLine(c, e.x, e.y, e.ang, 300, 'rgba(255,80,80,' + (0.5 + 0.45 * u) + ')', e.t >= tk - 150 ? 2.5 : 1.8, e.t >= tk - 150 ? null : [6, 4]);
      if (Math.floor(e.t / 90) % 2) { c.save(); c.strokeStyle = 'rgba(255,226,122,0.9)'; c.lineWidth = 2; c.beginPath(); c.arc(e.x, e.y, e.r + 5, 0, 6.283); c.stroke(); c.restore(); }
    } else if (ty === 'frostwolf' && (st === 'howl' || st === 'lunge' || st === 'skid')) {
      u = st === 'howl' ? e.t / B.tele.wolf.ms : 1;
      var rem = st === 'howl' ? e.len : Math.max(0, e.len - e.trav);
      if (st !== 'skid') lane(c, e.x, e.y, e.ang, rem + e.r, hw * 2, u, st !== 'howl' || e.t >= B.tele.wolf.ms - 150);
      dotted(c, e.x, e.y, e.ang, st === 'skid' ? 0 : rem + e.r, (st === 'skid' ? 0 : rem + e.r) + (st === 'skid' ? Math.max(0, e.lsp / (WF.spd / WF.slide)) : WF.slide));   // derrape de 140 px, punteado
      if (st === 'howl') tdisc(c, e.x, e.y, 20 + 3 * Math.sin(e.t / 45), RED(0.08 + 0.2 * u), 'rgba(255,100,90,0.95)', 2);
    } else if (ty === 'boar' && (st === 'wind' || st === 'charge' || st === 'slide')) {   // rectángulo 70 x 300 + tramo punteado de derrape de 180 px
      u = st === 'wind' ? e.t / B.tele.bear.ms : 1; var fixed = st !== 'wind' || e.t >= B.tele.bear.ms * 0.7;
      var done = st === 'wind' ? 0 : e.trav, left = Math.max(0, BR.len - done);
      c.save(); c.translate(e.x, e.y); c.rotate(e.ang);
      if (left > 0) { c.strokeStyle = 'rgba(8,4,14,0.7)'; c.lineWidth = 6; c.strokeRect(0, -BR.rect / 2, left, BR.rect); c.fillStyle = RED(0.1 + 0.26 * u); c.fillRect(0, -BR.rect / 2, left, BR.rect); c.strokeStyle = fixed ? 'rgba(255,110,90,0.97)' : 'rgba(255,90,90,0.6)'; c.lineWidth = fixed ? 3 : 1.6; c.strokeRect(0, -BR.rect / 2, left, BR.rect); }
      c.restore();
      var s0 = st === 'slide' ? 0 : left, s1 = st === 'slide' ? Math.max(0, e.cv / (BR.spd / BR.slide)) : left + BR.slide;
      dotted(c, e.x, e.y, e.ang, s0, s1);
    } else if (ty === 'shield' && st === 'wind') {   // abanico de 90 grados, alcance 50
      fanO(c, e.x, e.y, e.r + p.r + YT.reach, e.fa, 45 * DEG, e.t / B.tele.yeti.ms);
    } else if (ty === 'moth' && st === 'aim') {   // línea fina roja de 700 ms hasta el punto de picado
      tk = B.tele.bat.ms; u = e.t / tk;
      thinLine(c, e.x, e.y, e.ang, e.len, 'rgba(255,80,80,' + (0.5 + 0.45 * u) + ')', e.t >= tk - 150 ? 2.5 : 1.6, e.t >= tk - 150 ? null : [5, 4]);
    } else if (ty === 'sower' && st === 'tele') {   // fisuras + anillo rojo r 40 durante 800 ms
      u = e.t / B.tele.stalag.ms; tdisc(c, e.x, e.y, SG.ring, RED(0.08 + 0.28 * u), 'rgba(255,100,90,0.97)', 2.5);
      c.save(); c.strokeStyle = 'rgba(255,210,150,0.85)'; c.lineWidth = 2; c.beginPath(); c.arc(e.x, e.y, SG.ring * (1 - 0.8 * u), 0, 6.283); c.stroke();
      c.strokeStyle = 'rgba(8,18,44,0.85)'; c.lineWidth = 2; for (var k = 0; k < 5; k++) { var fa = k * 1.2566 + 0.4; c.beginPath(); c.moveTo(e.x, e.y + 8); c.lineTo(e.x + Math.cos(fa) * SG.ring * 0.9 * u, e.y + 8 + Math.sin(fa) * SG.ring * 0.5 * u); c.stroke(); }
      c.restore();
    } else if (ty === 'blinker' && st === 'fade') {   // anillo donde reaparece (el remolino de nieve ya marca el sitio)
      u = e.t / (B.tele.spirit.ms - 350); c.save();
      c.strokeStyle = 'rgba(8,4,14,0.65)'; c.lineWidth = 5; c.beginPath(); c.arc(e.tx, e.ty, 22 - 6 * u, 0, 6.283); c.stroke();
      c.strokeStyle = 'rgba(232,244,255,0.95)'; c.lineWidth = 2; c.beginPath(); c.arc(e.tx, e.ty, 22 - 6 * u, 0, 6.283); c.stroke(); c.restore();
    } else if (ty === 'blinker' && st === 'slash') {
      fanO(c, e.x, e.y, SP.reach + p.r, e.ang, 50 * DEG, e.t / 350);
    } else if (ty === 'warlock' && st === 'cast') {   // invocación = morado
      u = e.t / (e.fe.castMs || 600); c.save(); c.strokeStyle = 'rgba(8,4,14,0.6)'; c.lineWidth = 6; c.beginPath(); c.arc(e.x, e.y, 12 + 38 * u, 0, 6.283); c.stroke();
      c.strokeStyle = 'rgba(200,140,255,0.95)'; c.lineWidth = 3; c.beginPath(); c.arc(e.x, e.y, 12 + 38 * u, 0, 6.283); c.stroke(); c.restore();
    }
  };
  // aura de Frío del Chamán (suelo, no aviso): r 200, la ganancia de Frío se duplica dentro
  E.tunAura = function (c, e) {
    var R = B.biomes.tundra.cold.shamanR, t = G.time / 1000;
    c.save(); c.fillStyle = 'rgba(150,205,255,0.07)'; c.beginPath(); c.arc(e.x, e.y, R, 0, 6.283); c.fill();
    c.strokeStyle = 'rgba(8,4,14,0.4)'; c.lineWidth = 4; c.beginPath(); c.arc(e.x, e.y, R, 0, 6.283); c.stroke();
    c.strokeStyle = 'rgba(170,220,255,' + (0.45 + 0.15 * Math.sin(t * 3)) + ')'; c.lineWidth = 2; c.setLineDash([3, 9]); c.lineDashOffset = t * 16; c.beginPath(); c.arc(e.x, e.y, R, 0, 6.283); c.stroke(); c.restore();
  };

  // ---------------------------------------------------------------- Animación, tinte y dibujo
  // Nombres de animación según el reparto de frames de B.3 / C.4 (assets_fam3.js; ver ASSETS_API.md 'Tundra P3'); si no existe la anim, safeSpr usa un frame suelto
  E.tunAnim = function (e) {
    var w = Math.floor(e.anim / 110), st = e.st;
    switch (e.type) {
      case 'worm': return 'walk:' + w;
      case 'archer': return st === 'aim' ? 'aim' : e.flT > 0 ? 'shoot:' + (e.flT > 110 ? 0 : 1) : 'walk:' + w;
      case 'frostwolf': return st === 'howl' ? (e.t < 350 ? 'howl' : 'crouch') : (st === 'lunge' || st === 'skid') ? 'lunge:' + Math.floor(e.t / 90) % 2 : 'walk:' + Math.floor(e.anim / 90);
      case 'boar': return st === 'wind' ? 'wind' : st === 'charge' ? 'charge:' + Math.floor(e.t / 90) % 2 : st === 'slide' ? 'slide' : st === 'stun' ? 'idle:0' : 'walk:' + Math.floor(e.anim / 200);
      case 'shield': return st === 'wind' ? 'bash:0' : st === 'bash' ? 'bash:1' : st === 'rec' ? 'bash:2' : 'walk:' + w;
      case 'moth': return st === 'aim' ? 'dive:0' : st === 'dive' ? 'dive:1' : 'flap:' + Math.floor(e.anim / 70);
      case 'sower': return st === 'dormant' ? 'dormant' : st === 'tele' ? 'wake:' + (e.t < 400 ? 0 : 1) : st === 'erupt' ? 'erupt:' + (e.t < 150 ? 0 : 1) : 'crawl:' + Math.floor(e.anim / 250);
      case 'blinker': return st === 'fade' ? 'fade:' + Math.min(3, Math.floor(e.t / 150)) : st === 'slash' ? 'slash:' + (e.t < 200 ? 0 : 1) : 'idle:' + Math.floor(e.anim / 200);
      case 'warlock': return st === 'cast' ? 'howl:' + Math.floor(e.t / 160) % 2 : e.spd > 5 ? 'walk:' + Math.floor(e.anim / 250) : 'idle:' + Math.floor(e.anim / 250);
    }
    return 0;
  };
  E.tunTint = function (e, o) {
    var st = e.st, ty = e.type;
    if (ty === 'boar' && st === 'wind') { o.tint = '#ff6a5a'; o.tintA = 0.2 + 0.3 * (e.t / B.tele.bear.ms); }
    else if (ty === 'boar' && st === 'stun') { o.tint = '#ffff80'; o.tintA = 0.25 + 0.15 * Math.sin(e.t / 60); }
    else if (ty === 'frostwolf' && st === 'howl') { o.tint = '#ff6a5a'; o.tintA = 0.2 + 0.3 * (e.t / B.tele.wolf.ms); }
    else if (ty === 'frostwolf' && st === 'rec') { o.tint = '#ffff80'; o.tintA = 0.2; }
    else if (ty === 'shield' && st === 'wind') { o.tint = '#ffffff'; o.tintA = 0.25 + 0.35 * Math.sin(e.t / 40); }
    else if (ty === 'moth' && st === 'aim') { o.tint = '#ff6a5a'; o.tintA = 0.25 + 0.3 * Math.sin(e.t / 45); }
    else if (ty === 'archer' && st === 'aim') { o.tint = '#ffe27a'; o.tintA = 0.35 + 0.3 * Math.sin(e.t / 25); }
    else if (ty === 'sower' && st === 'tele') { o.tint = '#ff6a5a'; o.tintA = 0.2 + 0.3 * (e.t / B.tele.stalag.ms); }
    else if (ty === 'warlock' && st === 'cast') { o.tint = '#b070ff'; o.tintA = 0.25; }
    if (ty === 'blinker' && st === 'fade') o.alpha = 0.2 + 0.25 * Math.sin(e.t / 40);
    else if (e.immune) o.alpha = 0.25 + 0.1 * Math.sin(e.t / 40);
  };
  E.tunBob = function (e) { return Math.sin(e.anim / 200) * 3; };
  // Estalagmita viva sin sprite propio: como una estalagmita de la arena pero con ojos rojizos tenues
  E.tunStalag = function (c, e) {
    var a = e.spawnT > 0 ? 0.25 + 0.4 * (1 - e.spawnT / (e.spawnMax || B.spawnTelegraph)) : 1;
    if (e.flash > 0) a = 1;
    var wob = e.st === 'crawl' ? Math.sin(e.anim / 180) * 1.5 : e.st === 'tele' ? (Math.random() - 0.5) * 3 : 0;
    T.drawPillar(c, e.x + wob, e.y - 10, { r: 22, eyes: true, t: e.anim, alpha: a, h: e.st === 'erupt' ? 66 : 58 });
    if (e.flash > 0) { c.save(); c.globalAlpha = 0.5; T.drawPillar(c, e.x, e.y - 10, { r: 22, alpha: 0.5, h: 58 }); c.restore(); }
    if (e.spawnT <= 0 && e.hp < e.maxHp && !e.untarget) { var w = 22, bx = Math.round(e.x - w / 2), by = Math.round(e.y - 52); c.fillStyle = '#1a0a12'; c.fillRect(bx - 1, by - 1, w + 2, 5); c.fillStyle = '#e04050'; c.fillRect(bx, by, Math.max(0, w * e.hp / e.maxHp), 3); }
  };
  // Sobre el sprite: placa de hielo del Yeti (fx_ice_slab o procedural) delante del cuerpo
  E.tunDraw = function (c, e, o) {
    if (e.type === 'shield' && e.plateHp > 0 && e.spawnT <= 0) {
      var fa = e.fa || 0, px = e.x + Math.cos(fa) * (e.r + 3), py = e.y + Math.sin(fa) * (e.r + 3) * 0.6 - 4;
      c.save();
      if (G.hasSpr('fx_ice_slab')) { var sl = Assets.sprite('fx_ice_slab', 0); c.globalAlpha = e.plateFlash > 0 ? 1 : 0.95; c.translate(Math.round(px), Math.round(py)); if (Math.cos(fa) < 0) c.scale(-1, 1); c.drawImage(sl, -sl.width / 2, -sl.height / 2); }
      else {
        c.translate(px, py); c.rotate(fa); c.fillStyle = e.plateFlash > 0 ? '#ffffff' : 'rgba(150,210,250,0.88)'; c.strokeStyle = '#1b1124'; c.lineWidth = 2;
        c.beginPath(); c.moveTo(2, -13); c.lineTo(8, -4); c.lineTo(8, 5); c.lineTo(2, 13); c.lineTo(-3, 6); c.lineTo(-3, -6); c.closePath(); c.fill(); c.stroke();
        c.strokeStyle = 'rgba(240,252,255,0.9)'; c.lineWidth = 1.2; c.beginPath(); c.moveTo(3, -8); c.lineTo(5, 2); c.stroke();
      }
      c.restore();
    }
  };
})();
