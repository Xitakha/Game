/* boss_cenizar_b.js - P6.5: Cenizar F3-F6 (Réquiem Abrasador, Coro de los Tres Ríos, Invierno de Ceniza, Enjambre de Brasas). DESIGN-v7 secciones 6.3-6.6.
   Reinterpretaciones de los ataques más fuertes de Karceron, Letea, Yarlak y Melaria sobre el motor de eventos de zona de boss_cenizar.js (S.cz). Sin dependencias de los mundos
   de esos jefes (lava, Tundra, Panal): la mutación de arena de cada fase vive aquí y se limpia en cada puerta (H.clear). */
(function () {
  'use strict';
  var G = window.G, S = G.Boss, fx = G.fx, E = G.Enemies, U = S && S.u, Z = S && S.cz, B = G.B;
  if (!S || !U || !Z) return;
  var ATKS = S.ATKS, ATK = S.ATK, TAU = Math.PI * 2, DEG = Math.PI / 180, D = Z.D, H = Z.H;
  var ease = U.ease, angTo = U.angTo, sfx = U.sfx, pel = U.pel, expose = U.expose, hurtC = Z.hurt, gnd = Z.gnd, geo = Z.geo, faceTo = Z.faceTo;
  function PL() { return G.player; }
  function A() { return S.A; }
  function nowAdds() { return U.addsAlive(); }

  // ================================================================= F3: Réquiem Abrasador (islas que giran)
  // Lava en toda la arena salvo 3 islas (orbitan 30 px a 25 px/s, r 130 -> 100 en 8 s). Núcleo roto: quietas y r 110. Doc: r 120 -> 80 con cobertura <= 280; con 3 islas el rectángulo
  // jugable no se cubre a 280 con r 80 (mín. medido 355), así que r 130 -> 100 (cobertura 308-328 px) y la regla se cumple con la telegrafía de 2000 ms (1750 ms x 190 = 332 px).
  var ANCH = [[270, 410], [720, 400], [1170, 410]], ORB = 30, ORB_V = 25;
  Z.ISLANDS = ANCH;
  Z.islands = function (l) {
    var a = A(), out = [], t = l.t, br = (S.e && S.e.broken.nucleo), r = br ? 110 : 130 - 30 * G.clamp(t / 8000, 0, 1);
    for (var i = 0; i < 3; i++) {
      var w = ORB_V / ORB, ph = i * 2.1 + l.ph, ox = br ? 0 : Math.cos(w * t / 1000 + ph) * ORB, oy = br ? 0 : Math.sin(w * t / 1000 + ph) * ORB;
      out.push({ x: ANCH[i][0] + ox, y: ANCH[i][1] + oy, r: r });
    }
    return out;
  };
  Z.onIsland = function (x, y, pr) { var a = A(); if (!a.lava || a.lava.state !== 'on') return true; var is = Z.islands(a.lava); for (var i = 0; i < is.length; i++) if (Math.hypot(x - is[i].x, y - is[i].y) <= is[i].r - (pr || 0) * 0.3) return true; return false; };
  Z.islandCoverage = function (r, orbit) {   // mayor distancia (px) de un punto jugable al borde de la isla más cercana (prueba)
    var m = 0; r = r || 100; orbit = orbit == null ? ORB : orbit;
    for (var x = G.WALL + 30; x <= G.AW - G.WALL - 30; x += 24) for (var y = G.WALL + 30; y <= G.AH - G.WALL - 30; y += 24) {
      var b = 1e9; for (var i = 0; i < 3; i++) b = Math.min(b, Math.hypot(x - ANCH[i][0], y - ANCH[i][1]) - r + orbit); m = Math.max(m, b);
    }
    return m;
  };
  ATK.c_requiem = {
    start: function (e, A0) {
      var a = A(), short = e.phase === 7; A0.dur = short ? 8000 : 12000; A0.pose = 'requiem'; A0.actMs = A0.dur; A0.rec = 800; A0.drawAct = true; A0.mt = 0;
      a.lava = { state: 'tele', t: 0, ph: Math.random() * TAU, dur: A0.dur, fade: 0 };
      sfx('lava_rise', { vol: 0.8 }); faceTo(e, angTo(e, PL()));
    },
    tele: function (e, A0) { var l = A().lava; if (l) l.t = A0.t; },
    go: function (e, A0) {
      var l = A().lava; l.state = 'on'; l.t = 0; l.tk = 0; fx.shake(7, 300); sfx('lava_rise', { vol: 1, pitch: 1.2 }); G.Hud.banner('¡A LAS ISLAS!', 1400, '#ff9a3c');
    },
    act: function (e, A0, dt) {
      var a = A(), l = a.lava, p = PL();
      l.t = A0.t;
      if ((l.snd = (l.snd || 0) - dt) <= 0) { l.snd = 1200; if (!(e.broken.nucleo)) sfx('island_rotate', { vol: 0.5 }); }
      // brasas: r 50 cada 1 s con 900 ms de aviso sobre las islas
      A0.mt += dt;
      while (A0.mt >= 1000 && A0.t < A0.dur - 900) {
        A0.mt -= 1000;
        var is = Z.islands(l), tgt, onI = Z.onIsland(p.x, p.y, p.r) && !p.dead;
        if (onI && Math.random() < 0.65) tgt = { x: p.x + G.rnd(-50, 50), y: p.y + G.rnd(-50, 50) };
        else { var k = is[Math.floor(Math.random() * 3)], an = Math.random() * TAU, rr = Math.random() * (k.r - 40); tgt = { x: k.x + Math.cos(an) * rr, y: k.y + Math.sin(an) * rr }; }
        Z.add({ k: 'circle', x: tgt.x, y: tgt.y, r: 50, tele: Z.evTele(900, 50), dmg: 18, src: 'boss_brasa', col: 'orange', ghost: false, fixAt: 0, silent: true, onGo: function (v) { fx.burst(v.x, v.y, 10, '#ff9a3c', 200, 450, 4, { add: true }); fx.shake(3, 100); sfx('ash_fall', { vol: 0.5 }); } });
      }
      return A0.t >= A0.dur;
    },
    draw: function () { },
    haz: function () { }
  };
  H.afterAtk = function (e, A0) {
    if (A0.name === 'c_requiem') { var a = A(); if (a.lava) { a.lava.state = 'fade'; a.lava.fade = 0; } }
    if (A0.name === 'c_invierno') { var a2 = A(); if (a2.fires) a2.fires.fade = 0.001; }
    if (A0.name === 'c_extasis') A().noFury = false;
    if (A0.name === 'c_coro') { A().coro = null; }
  };

  // ---- Martillazo de Cenizar: círculo r 90 fijo al empezar; deja la maza clavada 1,2 s (ventana x1,25). Peligro III: triple (3 círculos seguidos)
  ATK.c_martillo = {
    start: function (e, A0) {
      var p = PL(); A0.pose = 'martillo'; A0.r = 90 * geo('martillo'); A0.actMs = 400; A0.rec = 700; A0.k = 0; A0.n = pel().v3 ? 3 : 1; A0.drawAct = false; faceTo(e, angTo(e, p));
      Z.add({ k: 'circle', x: p.x, y: p.y, r: A0.r, tele: A0.tele, dmg: 28, src: 'boss_martillo', col: 'orange', sig: true, fixAt: 0, kb: 1.5, onGo: function (v) { fx.shake(8, 220); fx.shockwave(v.x, v.y, 220); sfx('hit_heavy', { pitch: 0.7, vol: 0.9 }); expose(S.e, 1.25, 1200, 'window'); Z.win(); } });
      A0.k = 1;
    },
    go: function () { },
    act: function (e, A0) {
      if (A0.k < A0.n && A0.t >= 450 * (A0.k - 0)) { var p = PL(); A0.k++; Z.add({ k: 'circle', x: p.x, y: p.y, r: A0.r, tele: A0.tele, dmg: 28, src: 'boss_martillo', col: 'orange', sig: true, fixAt: 0, kb: 1.5, onGo: function (v) { fx.shake(8, 220); fx.shockwave(v.x, v.y, 220); sfx('hit_heavy', { pitch: 0.7, vol: 0.9 }); } }); A0.actMs = 450 * (A0.n - 1) + A0.tele + 300; }
      return A0.t >= A0.actMs;
    },
    draw: function () { }, haz: function () { }
  };
  // ---- Lluvia de brasas: 6 meteoros cada 250 ms (r 55, aviso 900 ms cada uno, 18)
  ATK.c_lluvia = {
    start: function (e, A0) {
      var p = PL(); A0.pose = 'lluvia'; A0.actMs = 6 * 250 + 400; A0.rec = 600; faceTo(e, angTo(e, p));
      for (var i = 0; i < 6; i++) {
        var an = Math.random() * TAU, d = i === 0 ? 0 : G.rnd(60, 230);
        Z.add({ k: 'circle', x: Z.clampX(p.x + Math.cos(an) * d, 40), y: Z.clampY(p.y + Math.sin(an) * d, 40), r: 55, delay: i * 250, tele: A0.tele, dmg: 18, src: 'boss_meteoro', col: 'orange', fixAt: 0, ghost: i > 0 && false, silent: true,
          onGo: function (v) { fx.burst(v.x, v.y, 8, '#ff9a3c', 180, 400, 4, { add: true }); fx.shake(2, 80); sfx('ash_fall', { vol: 0.4 }); } });
      }
      sfx('ash_fall', { vol: 0.6 });
    },
    go: function () { }, act: function (e, A0) { return A0.t >= A0.actMs; }, draw: function () { }, haz: function () { }
  };

  // ================================================================= F4: Coro de los Tres Ríos (Eco retardado)
  // 3 bocas a 120 grados cantan una voz cada 1,5 s (ácido / cono helado / rayos); cada voz deja un Eco: repite su patrón 2,0 s después desde la posición espejo, con contorno punteado
  // desde que suena la voz y aviso completo de 900 ms. Ojo roto: sin Eco y voces cada 1,8 s. Peligro III: Eco de 3 s. Cuerpo expuesto x1,25 mientras canta.
  function mouth(e, k) { var c = A().coro, g = gnd(e), an = c.m0 + k * 120 * DEG; return { x: g.x + Math.cos(an) * 110, y: g.y + Math.sin(an) * 70 - 10, a: an }; }
  function mirror(e, x, y) { var g = gnd(e); return { x: Z.clampX(2 * g.x - x, 30), y: Z.clampY(2 * g.y - y, 30) }; }
  function acidAt(x, y, arm) {
    var z = E.zone({ kind: 'acid', x: x, y: y, r: 65 * geo('coro'), arm: arm, life: 6000, dmg: 8 * U.dmgMul(), tick: 500, owner: S.e, src: 'boss_acido' }); z.noArmDraw = arm > 0 && false; return z;
  }
  function voice(e, A0, idx) {
    var a = A(), p = PL(), type = idx % 3, m = mouth(e, type), echoMs = pel().v3 ? 3000 : 2000, eco = !e.broken.ojo, tele = Z.evTele(900, 60), i, an, x, y;
    sfx('echo_ping', { vol: 0.5, pitch: 0.9 + type * 0.15 }); fx.ring(m.x, m.y, 4, 40, 400, ['#7be34a', '#bfeaff', '#fff6a8'][type], 4);
    if (type === 0) {   // ácido: 3 charcos r 65 (6 s) alrededor del jugador
      var a0 = Math.random() * TAU;
      for (i = 0; i < 3; i++) {
        an = a0 + i * TAU / 3; x = Z.clampX(p.x + Math.cos(an) * G.rnd(80, 130)); y = Z.clampY(p.y + Math.sin(an) * G.rnd(80, 130));
        acidAt(x, y, tele);
        if (eco) { var mq = mirror(e, x, y); Z.add({ k: 'circle', x: mq.x, y: mq.y, r: 65 * geo('coro'), delay: echoMs - tele, tele: tele, dmg: 0, ghost: true, echo: true, col: 'turq', fixAt: 0, silent: true, onGo: function (v) { acidAt(v.x, v.y, 0); sfx('echo_ping', { vol: 0.4, pitch: 1.3 }); } }); }
      }
    } else if (type === 1) {   // cono helado 40 grados, alcance 420, ralentiza 35 % 2 s
      var aim = Math.atan2(p.y - m.y, p.x - m.x);
      Z.add({ k: 'cones', x: m.x, y: m.y, angs: [aim], half: 20 * DEG, reach: 420 * geo('coro'), tele: tele, dmg: 14, slow: [0.35, 2000], src: 'boss_hielo', col: 'blue', fixAt: 0, silent: true, onGo: function (v) { sfx('ice_creak', { vol: 0.6 }); } });
      if (eco) { var mq2 = mirror(e, m.x, m.y); Z.add({ k: 'cones', x: mq2.x, y: mq2.y, angs: [aim + Math.PI], half: 20 * DEG, reach: 420 * geo('coro'), delay: echoMs - tele, tele: tele, dmg: 14, slow: [0.35, 2000], src: 'boss_hielo', ghost: true, echo: true, col: 'blue', fixAt: 0, silent: true }); }
    } else {   // rayos: 4 círculos r 58 secuenciales
      for (i = 0; i < 4; i++) {
        x = Z.clampX(p.x + G.rnd(-130, 130)); y = Z.clampY(p.y + G.rnd(-110, 110)); if (i === 0) { x = p.x; y = p.y; }
        Z.add({ k: 'circle', x: x, y: y, r: 58 * geo('coro'), delay: i * 200, tele: tele, dmg: 22, src: 'boss_rayo', col: 'amber', fixAt: 0, silent: true, onGo: function (v) { fx.burst(v.x, v.y, 8, '#fff6a8', 220, 260, 3, { add: true }); sfx('hit', { pitch: 1.6, vol: 0.4 }); } });
        if (eco) { var mq3 = mirror(e, x, y); Z.add({ k: 'circle', x: mq3.x, y: mq3.y, r: 58 * geo('coro'), delay: echoMs - tele + i * 200, tele: tele, dmg: 22, src: 'boss_rayo', ghost: true, echo: true, col: 'amber', fixAt: 0, silent: true }); }
      }
    }
  }
  ATK.c_coro = {
    start: function (e, A0) {
      var a = A(); A0.pose = 'coro'; A0.short = e.phase === 7; A0.iv = e.broken.ojo ? 1800 : 1500; A0.n = Math.floor(((A0.short ? 8000 : 12000) - 1000) / A0.iv) + 1; A0.vi = 0;
      A0.actMs = (A0.n - 1) * A0.iv + 1500; A0.rec = 1000; A0.drawAct = true;
      a.coro = { m0: Math.random() * TAU, open: 0, t: 0 }; faceTo(e, angTo(e, PL())); sfx('echo_ping', { vol: 0.7 });
    },
    tele: function (e, A0) { A().coro.open = A0.t / A0.tele; },
    go: function (e, A0) { A().coro.open = 1; expose(e, 1.25, A0.actMs, 'window'); fx.shake(4, 160); },
    act: function (e, A0, dt) {
      while (A0.vi < A0.n && A0.t >= A0.vi * A0.iv) { voice(e, A0, A0.vi); A0.vi++; }
      return A0.t >= A0.actMs;
    },
    draw: function (c, e, A0) {
      var co = A().coro; if (!co) return;
      for (var k = 0; k < 3; k++) {
        var m = mouth(e, k), col = ['#7be34a', '#bfeaff', '#fff6a8'][k], op = G.clamp(co.open, 0, 1);
        c.save(); c.globalAlpha = 0.9; c.fillStyle = '#120a1a'; c.beginPath(); c.ellipse(m.x, m.y, 20 * op + 2, 12 * op + 2, m.a, 0, TAU); c.fill(); c.strokeStyle = col; c.lineWidth = 3; c.stroke(); c.restore();
      }
    },
    haz: function () { }
  };
  // ---- Mordisco en picado (de una voz): carril 70 x 320 desde una boca, fijo los últimos 480 ms
  ATK.c_mordisco = {
    start: function (e, A0) {
      var g = gnd(e), k = Math.floor(Math.random() * 3), an = Math.random() * TAU + k * 2.1, ox = g.x + Math.cos(an) * 110, oy = g.y + Math.sin(an) * 70 - 10, p = PL();
      A0.pose = 'mordisco'; A0.actMs = 300; A0.rec = 650; faceTo(e, angTo(e, p));
      Z.add({ k: 'lane', x: ox, y: oy, a: Math.atan2(p.y - oy, p.x - ox), w: 70, len: 320, tele: A0.tele, dmg: 22, src: 'boss_mordisco', col: 'turq', fixAt: Math.max(0, A0.tele - 480), kb: 1.3,
        upd: function (v) { var pp = PL(); v.a = Math.atan2(pp.y - v.y, pp.x - v.x); }, onGo: function (v) { fx.shake(5, 150); sfx('hit_heavy', { vol: 0.7, pitch: 1.2 }); } });
    },
    go: function () { }, act: function (e, A0) { return A0.t >= A0.actMs; }, draw: function () { }, haz: function () { }
  };
  // ---- Coletazo: rosquilla 110-240 (pegado o lejos es seguro)
  ATK.c_coletazo = {
    start: function (e, A0) {
      var g = gnd(e); A0.pose = 'coletazo'; A0.actMs = 300; A0.rec = 650;
      Z.add({ k: 'donut', x: g.x, y: g.y, r: 240, inner: 110, tele: A0.tele, dmg: 24, src: 'boss_coletazo', col: 'turq', fixAt: 0, kb: 1.2, onGo: function (v) { fx.shake(6, 180); fx.shockwave(v.x, v.y, 260); sfx('hit_heavy', { vol: 0.8, pitch: 0.9 }); } });
    },
    go: function () { }, act: function (e, A0) { return A0.t >= A0.actMs; }, draw: function () { }, haz: function () { }
  };

  // ================================================================= F5: Invierno de Ceniza (hielo y brasa alternos)
  // Sin la Tundra (hielo, Frío, bruma): 5 hogueras que crecen a r 120 durante el ataque; 7 oleadas de 12 carámbanos (v 170, 2 huecos de 45 grados, giro 18 grados, cada 1,4 s) que
  // MUEREN al entrar en una hoguera; cada 2,8 s las hogueras se encienden en brasa (aviso 900 ms, 16): reloj posicional (la hoguera protege pero arde). Colmillo roto: hogueras
  // permanentes sin brasas alternas. Peligro IV: la regla de la Tundra (claro/Frío) no aplica.
  var FIRES = [[330, 240], [1110, 240], [720, 410], [330, 590], [1110, 590]];
  ATK.c_invierno = {
    start: function (e, A0) {
      var a = A(); A0.short = e.phase === 7; A0.n = A0.short ? 5 : 7; A0.pose = 'invierno'; A0.actMs = 1000 + (A0.n - 1) * 1400 + 1800; A0.rec = 1200; A0.wi = 0; A0.fi = 0; A0.rot = Math.random() * TAU; A0.drawAct = true;
      a.fires = FIRES.map(function (f) { return { x: f[0], y: f[1], r: 64, tgt: 120 * geo('invierno'), fl: 0 }; }); a.fires.fade = 0; sfx('ice_creak', { vol: 0.7 }); faceTo(e, angTo(e, PL()));
    },
    tele: function (e, A0) { var u = ease(A0.t / A0.tele); A().fires.forEach(function (f) { f.r = 64 + (f.tgt - 64) * u; }); },
    go: function (e, A0) { A().fires.forEach(function (f) { f.r = f.tgt; }); expose(e, 1.25, A0.actMs, 'window'); fx.shake(5, 200); },
    act: function (e, A0, dt) {
      var a = A(), g = gnd(e), i, k;
      while (A0.wi < A0.n && A0.t >= 600 + A0.wi * 1400) {   // 12 carámbanos: dos arcos de 135 grados con huecos de 45
        var g0 = A0.rot + A0.wi * 18 * DEG;
        for (k = 0; k < 2; k++) for (i = 0; i < 6; i++) {
          var an = g0 + k * Math.PI + 22.5 * DEG + (i + 0.5) * (135 * DEG / 6);
          U.shootBoss(g.x + Math.cos(an) * 100, g.y - 20 + Math.sin(an) * 100, an, 170, 10, 'proj_icicle', { r: 8, life: 5200, fb: 'arrow', src: 'boss_carambano' });
        }
        A0.wi++; sfx('ember_wave', { vol: 0.5 }); fx.shake(3, 120);
      }
      if (!e.broken.colmillo) {
        while (A0.fi < 4 && A0.t >= 1900 + A0.fi * 2800 - 900 + 0) {   // brasa de hogueras: aviso 900 ms, impacto en 1900 + n x 2800 - 900 + 900
          if (A0.t < 1000 + A0.fi * 2800) break;
          A0.fi++;
          a.fires.forEach(function (f) {
            Z.add({ k: 'circle', x: f.x, y: f.y, r: f.tgt, tele: Z.evTele(900, 130), dmg: 16, src: 'boss_brasa', col: 'orange', fixAt: 0, silent: true,
              onGo: function (v) { fx.burst(v.x, v.y, 14, '#ff6a1a', 240, 500, 4, { add: true }); fx.flames(v.x, v.y, 6, 60); sfx('ember_flare', { vol: 0.6 }); } });
          });
          sfx('ember_flare', { vol: 0.4, pitch: 0.8 });
        }
      }
      return A0.t >= A0.actMs;
    },
    draw: function () { }, haz: function () { }
  };
  // ---- Ventisca blanca: 3 olas de 120 px a 260 px/s cada 1,5 s con 1 hueco de 140 px; empujan (14)
  Z.addBand = function (o) { var a = A(); o.hit = false; o.w = o.w || 120; o.v = o.v || 260; o.gapH = o.gapH || 140; a.bands.push(o); sfx('ember_wave', { vol: 0.6 }); return o; };
  ATK.c_ventisca = {
    start: function (e, A0) {
      A0.dir = Math.random() < 0.5 ? 1 : -1; A0.x0 = A0.dir > 0 ? G.WALL - 60 : G.AW - G.WALL + 60; A0.gaps = []; A0.pose = 'ventisca'; A0.actMs = 3300; A0.rec = 600; A0.sent = 0; A0.drawAct = true;
      var y = G.rnd(190, G.AH - 190); for (var i = 0; i < 3; i++) { A0.gaps.push(y); y = G.clamp(y + (Math.random() < 0.5 ? -1 : 1) * G.rnd(120, 220), 170, G.AH - 170); }
      sfx('ice_creak', { vol: 0.8 }); faceTo(e, A0.dir > 0 ? 0 : Math.PI);
    },
    go: function () { },
    act: function (e, A0) {
      while (A0.sent < 3 && A0.t >= A0.sent * 1500) { Z.addBand({ x: A0.x0, dir: A0.dir, gap: A0.gaps[A0.sent], dmg: 14, col: '#bfeaff', src: 'boss_ventisca' }); A0.sent++; fx.shake(3, 150); }
      return A0.t >= A0.actMs;
    },
    draw: function (c, e, A0) { if (A0.step === 'tele') for (var i = 0; i < 3; i++) Z.drawBand(c, { x: A0.x0 + A0.dir * i * 34, dir: A0.dir, gap: A0.gaps[i], w: 120, gapH: 140, glyph: i + 1 }, 0.25 + 0.5 * A0.t / A0.tele, true); },
    haz: function (e, A0, out) {
      if (A0.step === 'tele') for (var i = 0; i < 3; i++) out.push({ k: 'band', x: A0.x0, dir: A0.dir, v: 260, w: 120, gaps: [A0.gaps[i]], t0: A0.tele - A0.t + i * 1500, t1: A0.tele - A0.t + i * 1500 + (G.AW + 160) / 260 * 1000 });
      else if (A0.step === 'act') for (var j = A0.sent; j < 3; j++) out.push({ k: 'band', x: A0.x0, dir: A0.dir, v: 260, w: 120, gaps: [A0.gaps[j]], t0: j * 1500 - A0.t, t1: j * 1500 - A0.t + (G.AW + 160) / 260 * 1000 });
    }
  };
  ATK.c_cornada = {
    start: function (e, A0) { A0.aim = angTo(e, PL()); A0.reach = 220; A0.arc = 90 * DEG; A0.fixAt = A0.tele * 0.7; A0.actMs = 300; A0.rec = 650; A0.pose = 'cornada'; faceTo(e, A0.aim); },
    tele: function (e, A0) { if (A0.t < A0.fixAt) { A0.aim = angTo(e, PL()); faceTo(e, A0.aim); } },
    go: function (e, A0) {
      var p = PL(), g = gnd(e), d = G.dist(g.x, g.y, p.x, p.y); fx.shake(6, 180); sfx('hit_heavy', { vol: 0.8 }); fx.slash(g.x, g.y, A0.aim, 5, '#bfeaff');
      if (!p.dead && d <= A0.reach + p.r * 0.4 && Math.abs(G.angDiff(angTo(g, p), A0.aim)) <= A0.arc / 2) { if (hurtC(e, 24, 'boss_cornada', { kb: 2.2 })) { /* empuje 90 px */ } }
    },
    act: function (e, A0) { return A0.t >= A0.actMs; },
    draw: function (c, e, A0) { var g = gnd(e); Assets.drawBossTele(c, 'cone', g.x, g.y, { r: A0.reach, arc: A0.arc, a: A0.aim, p: A0.t / A0.tele, fix: A0.t >= A0.fixAt, color: 'blue', t: G.time }); },
    haz: function (e, A0, out) { var g = gnd(e); if (A0.step === 'tele') out.push({ k: 'arc', x: g.x, y: g.y, r: A0.reach, inner: 0, a: A0.aim, arc: A0.arc, t0: A0.tele - A0.t, t1: A0.tele - A0.t + 150 }); }
  };

  // ================================================================= F6: Enjambre de Brasas (anillos bidireccionales)
  // 5 anillos hexagonales (R = k x 83, grosor 32, 2 huecos de ~150 px) de fuera hacia dentro cada 1,3 s: los impares CONTRAEN y los pares EXPANDEN hasta su radio (el daño llega al
  // final del aviso de 900 ms, 18). Corona rota: todos contraen. Doc 12 s: aquí ~8 s (5 anillos).
  function ringEv(c0, k, i, e, short) {
    var R = k * 83, g0 = Math.random() * TAU, gh = Math.min(0.95, Math.atan(75 / R)), contract = e.broken.corona ? true : (k % 2 === 1), tl = Z.evTele(1000, 80);
    return Z.add({ k: 'hex', x: c0.x, y: c0.y, apo: R * 0.8660254, apo0: (R + (contract ? 83 : -83)) * 0.8660254, th: 32 * geo('zumbido'), gaps: [g0, g0 + Math.PI + G.rnd(-0.5, 0.5)], gh: gh, delay: i * 1300, tele: tl, dmg: 18, src: 'boss_zumbido', col: 'amber', fixAt: tl * 0.7, glyph: i + 1,
      gx: c0.x + Math.cos(g0) * R * 0.97, gy: c0.y + Math.sin(g0) * R * 0.97, silent: true, ghost: i < 2,
      onGo: function (v) { fx.shake(3, 100); sfx(contract ? 'hex_ring_in' : 'hex_ring_out', { vol: 0.6 }); } });
  }
  ATK.c_zumbido = {
    start: function (e, A0) {
      var g = gnd(e), n = e.phase === 7 ? 4 : 5; A0.pose = 'zumbido'; A0.actMs = (n - 1) * 1300 + 1800; A0.rec = 900; A0.c0 = { x: g.x, y: g.y };
      for (var i = 0; i < n; i++) ringEv(A0.c0, 5 - i, i, e);
      sfx('hex_ring_in', { vol: 0.7 }); faceTo(e, angTo(e, PL()));
    },
    go: function () { }, act: function (e, A0) { return A0.t >= A0.actMs; }, draw: function () { }, haz: function () { }
  };
  ATK.c_estocada = {   // carril 168 x 420 desde el cuerpo, fijo los últimos 300 ms; si falla, ventana de 1 s x1,25
    start: function (e, A0) {
      var g = gnd(e), p = PL(); A0.pose = 'estocada'; A0.actMs = 300; A0.rec = 700; faceTo(e, angTo(e, p));
      Z.add({ k: 'lane', x: g.x, y: g.y, a: Math.atan2(p.y - g.y, p.x - g.x), w: 105 * geo('estocada'), len: 420, tele: A0.tele, dmg: 26, src: 'boss_estocada', col: 'amber', sig: true, fixAt: Math.max(0, A0.tele - 300), kb: 1.6,
        upd: function (v) { var pp = PL(), gg = gnd(S.e); v.x = gg.x; v.y = gg.y; v.a = Math.atan2(pp.y - v.y, pp.x - v.x); },
        onGo: function (v) { Z.breakPillarsLane(v); fx.shake(6, 160); sfx('hit_heavy', { vol: 0.9 }); A0.fired = v; },
        onEnd: function (v) { if (!v.hit && S.e && S.e.mode === 'fight') { expose(S.e, 1.25, 1000, 'window'); Z.win(); } } });
    },
    go: function () { }, act: function (e, A0) { return A0.t >= A0.actMs; }, draw: function () { }, haz: function () { }
  };
  ATK.c_enjambre = {
    ok: function (e) { return nowAdds() <= pel().cap - 2; },
    avail: function (e) { return !e.broken.corona; },
    start: function (e, A0) {
      var P = pel(), room = pel().cap - nowAdds(), p = PL(), list = ['blinker', 'blinker'], i; for (i = 0; i < P.adds; i++) list.push('blinker');
      if (B.enemy.pollinator && !G.enemies.some(function (q) { return !q.dead && q.type === 'pollinator' && q.bossAdd; })) list.push('pollinator');
      list = list.slice(0, Math.max(0, room)); A0.pose = 'enjambre'; A0.actMs = 300; A0.rec = 600;
      list.forEach(function (ty, k) {
        var cx, cy, tries = 0, an = Math.random() * TAU + k * 1.3;
        do { an += 1.1; cx = e.x + Math.cos(an) * 200; cy = e.y + 30 + Math.sin(an) * 160; tries++; } while (G.dist(cx, cy, p.x, p.y) < 110 && tries < 8);
        Z.spawnAdd(ty, cx, cy, A0.tele);
      });
      sfx('wave_start', { pitch: 0.8, vol: 0.8 });
    },
    go: function (e) { fx.ring(e.x, e.y + 30, 10, 180, 500, '#ffc440', 5); fx.shake(4, 150); sfx('hit_heavy', { pitch: 0.7, vol: 0.6 }); },
    act: function (e, A0) { return A0.t >= A0.actMs; },
    draw: function (c, e, A0) { var g = gnd(e); Assets.drawBossTele(c, 'summon', g.x, g.y, { r: 150, p: A0.t / A0.tele, t: G.time }); },
    haz: function () { }
  };

  // ================================================================= tick / dibujo / bot de lo persistente (lava, hogueras, olas)
  Z.tickB = function (e, dt) {
    var a = A(), p = PL(), i, l = a.lava, s = dt / 1000;
    if (l) {
      if (l.state === 'on') {
        l.tk = (l.tk || 0) - dt;
        if (l.tk <= 0) { l.tk = 400; if (!p.dead && !Z.onIsland(p.x, p.y, p.r)) hurtC(e, 12, 'boss_lava', { soft: true }); }
        if (Math.random() < 0.3) { var is = Z.islands(l); }
      } else if (l.state === 'fade') { l.fade += dt; if (l.fade > 700) a.lava = null; }
    }
    if (a.fires) {
      if (a.fires.fade > 0) { a.fires.fade += dt; if (a.fires.fade > 700) a.fires = null; }
      else for (i = G.projectiles.length - 1; i >= 0; i--) {
        var q = G.projectiles[i]; if (q.team !== 'e' || q.src !== 'boss_carambano') continue;
        for (var j = 0; j < a.fires.length; j++) if (Math.hypot(q.x - a.fires[j].x, q.y - a.fires[j].y) < a.fires[j].r - 4) { fx.burst(q.x, q.y, 5, '#ffb070', 100, 250, 3, { add: true }); fx.puff(q.x, q.y, 1); G.projectiles.splice(i, 1); break; }
      }
    }
    for (i = a.bands.length - 1; i >= 0; i--) {
      var b = a.bands[i]; b.x += b.dir * b.v * s;
      if (!b.hit && !p.dead && S.noHurt <= 0 && Math.abs(p.x - b.x) < b.w / 2 + p.r * 0.5 && Math.abs(p.y - b.gap) > b.gapH / 2 - p.r * 0.3) {
        b.hit = true; if (hurtC(e, b.dmg || 14, b.src || 'boss_ventisca', { kb: 1 })) { p.x += b.dir * 60; p.x = G.clamp(p.x, G.WALL + p.r, G.AW - G.WALL - p.r); }
      }
      if ((b.dir > 0 && b.x > G.AW + 100) || (b.dir < 0 && b.x < -100)) a.bands.splice(i, 1);
    }
  };
  Z.drawBand = function (c, b, alpha, ghost) {
    var w = b.w, gh = b.gapH || 140, y0 = G.WALL, y1 = G.AH - G.WALL, col = b.col || '#bfeaff';
    c.save(); c.globalAlpha = ghost ? Math.min(alpha, 0.5) : 1;
    c.fillStyle = ghost ? 'rgba(255,60,60,' + (0.10 + 0.2 * alpha) + ')' : 'rgba(210,235,255,0.55)';
    c.fillRect(b.x - w / 2, y0, w, b.gap - gh / 2 - y0); c.fillRect(b.x - w / 2, b.gap + gh / 2, w, y1 - b.gap - gh / 2);
    c.strokeStyle = ghost ? 'rgba(255,170,160,0.9)' : col; c.lineWidth = 3; c.strokeRect(b.x - w / 2, y0, w, b.gap - gh / 2 - y0); c.strokeRect(b.x - w / 2, b.gap + gh / 2, w, y1 - b.gap - gh / 2);
    c.fillStyle = col; c.beginPath(); for (var yy = y0 + 30; yy < y1; yy += 70) { if (Math.abs(yy - b.gap) < gh / 2 + 10) continue; var ax = b.x + b.dir * (w / 2 + 22); c.moveTo(ax, yy); c.lineTo(ax - b.dir * 18, yy - 12); c.lineTo(ax - b.dir * 18, yy + 12); } c.fill();
    if (b.glyph != null) G.txt(c, String(b.glyph), b.x + b.dir * (w / 2 + 14), b.gap, 16, '#ffffff', 'center');
    c.restore();
  };
  Z.drawGroundB = function (c, e) {
    var a = A(), i, t = G.time, l = a.lava;
    if (l) {
      var is = Z.islands(l), al = l.state === 'tele' ? 0 : l.state === 'fade' ? 1 - l.fade / 700 : G.clamp(l.t / 600, 0, 1);
      if (al > 0.01) {
        c.save(); c.globalAlpha = al * 0.62;
        c.beginPath(); c.rect(G.WALL, G.WALL, G.AW - 2 * G.WALL, G.AH - 2 * G.WALL);
        for (i = 0; i < is.length; i++) { c.moveTo(is[i].x + is[i].r, is[i].y); c.arc(is[i].x, is[i].y, is[i].r, 0, TAU, true); }
        c.fillStyle = (Math.floor(t / 200) % 2) ? '#e0501a' : '#ff6a1a'; c.fill('evenodd'); c.restore();
      }
      for (i = 0; i < is.length; i++) {
        var s = is[i];
        c.save(); c.fillStyle = l.state === 'tele' ? 'rgba(255,255,255,' + (0.18 + 0.12 * Math.sin(t / 90)) + ')' : 'rgba(58,52,64,0.9)'; c.beginPath(); c.arc(s.x, s.y, s.r, 0, TAU); c.fill();
        c.strokeStyle = l.state === 'tele' ? '#ffffff' : '#8a8294'; c.lineWidth = 4; c.stroke();
        c.strokeStyle = '#ff6a1a'; c.lineWidth = 2; c.setLineDash([6, 8]); c.lineDashOffset = -t / 40; c.beginPath(); c.arc(s.x, s.y, s.r - 8, 0, TAU); c.stroke(); c.setLineDash([]); c.restore();
      }
    }
    if (a.fires) for (i = 0; i < a.fires.length; i++) {
      var f = a.fires[i], fa = a.fires.fade > 0 ? 1 - a.fires.fade / 700 : 1;
      c.save(); c.globalAlpha = fa; var gr = c.createRadialGradient(f.x, f.y, 6, f.x, f.y, f.r);
      gr.addColorStop(0, 'rgba(255,200,90,0.45)'); gr.addColorStop(1, 'rgba(255,106,26,0.08)'); c.fillStyle = G.fg ? G.fg(gr, 'rgba(255,150,50,0.2)') : gr; c.beginPath(); c.arc(f.x, f.y, f.r, 0, TAU); c.fill();
      c.strokeStyle = '#ffc080'; c.lineWidth = 2; c.setLineDash([8, 6]); c.lineDashOffset = -t / 50; c.stroke(); c.setLineDash([]);
      c.fillStyle = '#ff9a3c'; c.beginPath(); c.moveTo(f.x - 9, f.y + 8); c.quadraticCurveTo(f.x, f.y - 24 - Math.sin(t / 80 + i) * 4, f.x + 9, f.y + 8); c.closePath(); c.fill(); c.strokeStyle = '#1b1124'; c.lineWidth = 2; c.stroke();
      c.restore();
    }
    for (i = 0; i < a.bands.length; i++) Z.drawBand(c, a.bands[i], 1, false);
  };
  Z.hazB = function (e, out) {
    var a = A(), l = a.lava, i;
    if (l && (l.state === 'tele' || l.state === 'on')) {
      var is = Z.islands(l), isl = is.map(function (q) { return [q.x, q.y]; });
      out.push({ ref: l, k: 'flood', islands: isl, R: is[0].r, t0: l.state === 'tele' ? Math.max(0, 2000 - l.t) : 0, t1: l.state === 'tele' ? 2000 - l.t + 13000 : Math.max(0, l.dur - l.t) + 40, live: l.state === 'on' });
    }
    for (i = 0; i < a.bands.length; i++) { var b = a.bands[i]; out.push({ ref: b, k: 'band', x: b.x, dir: b.dir, v: b.v, w: b.w, gaps: [b.gap], t0: 0, t1: (b.dir > 0 ? G.AW + 80 - b.x : b.x + 80) / b.v * 1000, live: true }); }
  };
})();
