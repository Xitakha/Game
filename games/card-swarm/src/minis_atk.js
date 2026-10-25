/* minis_atk.js - Los ataques de los 8 minijefes de la P4.5 (DESIGN-v6-minijefes.md s.4): 2 propios + 1 firma cada uno (+ enrage y modo degradado al romper la parte).
   Cada ataque es un objeto { name, cd, ok, off, tele(e), fix, exit, dmg, start, aim, fire, run, draw, pz, sig, double }:
     tele(e) = ms de telegrafía (según e.stage / e.enraged / parte rota), fix = últimos ms con el rumbo fijo, exit = px de salida para la regla de esquiva (auditoría G.Minis.teleAudit).
   Colores: rojo = daño directo, naranja + borde amarillo = lava, verde ácido = zona, turquesa = olvido, azul hielo = Frío, morado = invocación, verde pálido con cruz = cura. Firma = doble contorno. */
(function () {
  'use strict';
  var G = window.G, B = G.B, E = G.Enemies, fx = G.fx, H = E.H, M = G.Minis, DEG = Math.PI / 180, TAU = 6.283;
  var A = M.ATK, hurt = M.hurt, snd = M.snd;
  function R() { return H.RED; }
  function ang2(e, p) { return Math.atan2(p.y - e.y, p.x - e.x); }
  function inLane(x0, y0, ang, len, w, p) {
    var dx = p.x - x0, dy = p.y - y0, c = Math.cos(ang), s = Math.sin(ang), u = dx * c + dy * s, v = -dx * s + dy * c;
    return u >= -p.r && u <= len + p.r && Math.abs(v) <= w / 2 + p.r * 0.6;
  }
  function inRing(x, y, r, p, th) { return Math.abs(G.dist(x, y, p.x, p.y) - r) <= (th || 9) + p.r * 0.6; }
  function clampPt(x, y, m) { return M.clampArena(x, y, m); }
  function rnd(a, b) { return G.rnd(a, b); }
  function zoneCount(e, kind) { var n = 0; for (var i = 0; i < G.zones.length; i++) { var z = G.zones[i]; if (z.team === 'e' && z.owner === e && z.kind === kind) n++; } return n; }
  function dropOldest(e, kind, max) {
    var n = zoneCount(e, kind);
    for (var i = 0; i < G.zones.length && n >= max; i++) { var z = G.zones[i]; if (z.team === 'e' && z.owner === e && z.kind === kind) { G.zones.splice(i, 1); i--; n--; } }
  }
  function blockedNow(e) {
    if (G.Tundra.on) { var bx = e.x, by = e.y; G.Tundra.collide(e, e.r); if (Math.hypot(e.x - bx, e.y - by) > 0.5) return true; }
    return !!(G.Boss.obs && G.Boss.obs.length && G.Boss.blocks(e.x, e.y, e.r));
  }
  // punto de parada de una carga (recortado por las paredes): e.clen, e.tx, e.ty, e.clipped
  function chargeEnd(e, len) {
    var mg = G.WALL + e.r + 2, dx = Math.cos(e.ang), dy = Math.sin(e.ang), tm = len;
    if (dx > 1e-3) tm = Math.min(tm, (G.AW - mg - e.x) / dx); else if (dx < -1e-3) tm = Math.min(tm, (mg - e.x) / dx);
    if (dy > 1e-3) tm = Math.min(tm, (G.AH - mg - e.y) / dy); else if (dy < -1e-3) tm = Math.min(tm, (mg - e.y) / dy);
    e.clipped = tm < len - 1; e.clen = Math.max(0, tm); e.tx = e.x + dx * e.clen; e.ty = e.y + dy * e.clen;
  }
  // carga genérica: o = { spd, slide (px de derrape), dmg, name, ringR, ringDmg, done(e, wall) }
  function charge(e, dt, X, o) {
    var p = X.p, s = X.s;
    if (e.ph !== 'ring') {
      var f = o.slide ? Math.max(0.3, Math.min(1, (e.clen - e.trav) / o.slide)) : 1, stp = Math.min(o.spd * s * f, e.clen - e.trav);
      e.x += Math.cos(e.ang) * stp; e.y += Math.sin(e.ang) * stp; e.trav += stp;
      if (Math.random() < 0.5) fx.dust(e.x - Math.cos(e.ang) * 20, e.y + 16, 1);
      if (!e.hitDone && !p.dead && G.dist(e.x, e.y, p.x, p.y) < e.r + p.r + 4) { e.hitDone = true; hurt(e, p, o.dmg, o.name, 1.6); }
      var blk = blockedNow(e);
      if (e.trav >= e.clen - 0.01 || blk) {
        e.ph = 'ring'; e.t = 0; e.ringHit = false; e.wall = blk || e.clipped; fx.shake(8, 220); fx.dust(e.x, e.y + 14, 10);
        if (o.ringR) snd(o.sCrash || 'ram_charge_crash', 'explosion', { pitch: 0.6, vol: 0.8 });
        if (!o.ringR) o.done(e, e.wall);
      }
    } else {
      var rr = 18 + (o.ringR - 18) * G.clamp(e.t / 380, 0, 1);
      if (!e.ringHit && !p.dead && inRing(e.x, e.y, rr, p)) { e.ringHit = true; hurt(e, p, o.ringDmg, o.name + '_onda', 1); }
      if (e.t >= 380) o.done(e, e.wall);
    }
  }
  // ---- dibujo
  function circ(c, x, y, r, u, o) {
    o = o || {}; var f = o.fill || '255,40,40', st = o.stroke || '255,110,100';
    H.tdisc(c, x, y, r, 'rgba(' + f + ',' + (0.07 + 0.22 * u) + ')', 'rgba(' + st + ',0.95)', 2.5);
    c.save();
    if (o.sig) { c.strokeStyle = 'rgba(255,236,160,0.95)'; c.lineWidth = 1.8; c.beginPath(); c.arc(x, y, r + 5, 0, TAU); c.stroke(); }
    if (o.close !== false) { c.strokeStyle = 'rgba(255,215,160,0.85)'; c.lineWidth = 2; c.beginPath(); c.arc(x, y, r * (1 - 0.8 * u), 0, TAU); c.stroke(); }
    if (o.cross) { c.strokeStyle = 'rgba(184,255,154,0.95)'; c.lineWidth = 3; c.beginPath(); c.moveTo(x - r * 0.45, y); c.lineTo(x + r * 0.45, y); c.moveTo(x, y - r * 0.45); c.lineTo(x, y + r * 0.45); c.stroke(); }
    c.restore();
  }
  function lane(c, x, y, ang, len, w, u, fixed, sig) {
    if (sig) { c.save(); c.translate(x, y); c.rotate(ang); c.strokeStyle = 'rgba(255,236,160,0.9)'; c.lineWidth = 1.8; c.strokeRect(-3, -w / 2 - 4, len + 6, w + 8); c.restore(); }
    H.lane(c, x, y, ang, len, w, u, fixed);
  }
  function sector(c, x, y, r0, r1, ang, half, u, o) {
    o = o || {}; c.save();
    function path() { c.beginPath(); c.arc(x, y, r1, ang - half, ang + half); if (half >= Math.PI - 0.01) { c.moveTo(x + r0, y); } c.arc(x, y, r0, ang + half, ang - half, true); c.closePath(); }
    path(); c.strokeStyle = 'rgba(8,4,14,0.7)'; c.lineWidth = 6; c.stroke();
    c.fillStyle = 'rgba(255,40,40,' + (0.08 + 0.24 * u) + ')'; c.fill('evenodd'); c.strokeStyle = 'rgba(255,100,90,0.95)'; c.lineWidth = 2.2; c.stroke();
    if (o.sig) { c.beginPath(); c.arc(x, y, r1 + 5, ang - half, ang + half); c.arc(x, y, Math.max(0, r0 - 5), ang + half, ang - half, true); c.closePath(); c.strokeStyle = 'rgba(255,236,160,0.95)'; c.lineWidth = 1.6; c.stroke(); }
    c.restore();
  }
  function fanSh(c, x, y, r, ang, half, u, sig) { H.fan(c, x, y, r, ang, half, u); if (sig) { c.save(); c.strokeStyle = 'rgba(255,236,160,0.9)'; c.lineWidth = 1.6; c.beginPath(); c.arc(x, y, r + 5, ang - half, ang + half); c.stroke(); c.restore(); } }
  function thin(c, x, y, ang, len, u, fixed) { H.thinLine(c, x, y, ang, len, 'rgba(255,90,90,' + (0.5 + 0.45 * u) + ')', fixed ? 2.5 : 1.5, fixed ? null : [6, 4]); }
  function ghostKey(c, x, y, a, al) { c.save(); c.globalAlpha = al; E.shieldBit(c, x, y, a, 0); c.restore(); }

  // ================================================================= 1. CARNERO MAYOR (Bosque, presión)
  var CA = A.carnero = {};
  function cornReach(e) { return e.part.broken ? 80 : 120; }
  CA.cornada = { name: 'cornada', cd: 4500, exit: 70, dmg: 22, dmgBroken: 16, fix: 160, sT: ['ram_snort', 'whoosh'], pz: ['horn:0', 'horn:1'], recPose: 'idle',
    ok: function (e, d) { return d < cornReach(e); }, tele: function () { return 650; },
    start: function (e, X) { e.ang = X.a; }, aim: function (e, X) { e.ang = X.a; e.fa = X.a; },
    fire: function (e, X) {
      var p = X.p; if (!p.dead && H.inFan(e, p, e.ang, 35 * DEG, cornReach(e) + p.r)) hurt(e, p, e.part.broken ? 16 : 22, e.part.broken ? 'coz' : 'cornada', 1.2);
      fx.ring(e.x, e.y, 20, cornReach(e), 250, '#ffcf7a', 4); fx.shake(5, 150); snd('ram_horn_scrape', 'hit_heavy', { pitch: e.part.broken ? 0.8 : 1 }); M.endAtk(e, 500, null, 'idle');
    },
    draw: function (c, e, p, st) { if (st === 'tele') fanSh(c, e.x, e.y, cornReach(e) + p.r, e.ang, 35 * DEG, e.t / e.teleMs); } };
  CA.balido = { name: 'balido', cd: function (e) { return e.part.broken ? 20000 : 14000; }, exit: 0, dmg: 0, sT: ['ram_bleat', 'wave_start'], pz: ['call:0', 'call:0'],
    tele: function () { return 800; },
    start: function (e, X) {
      e.pts = []; var back = X.a + Math.PI, n = e.enraged ? 3 : 2;
      for (var i = 0; i < n; i++) { var a = back + (i - (n - 1) / 2) * 0.7; e.pts.push(clampPt(e.x + Math.cos(a) * 70, e.y + Math.sin(a) * 70, 20)); }
    },
    fire: function (e) {
      for (var i = 0; i < e.pts.length; i++) M.addAdd(e, 'worm', e.pts[i][0], e.pts[i][1], {});
      fx.ring(e.x, e.y, 10, 90, 400, '#b060ff', 5); M.endAtk(e, 400, null, 'idle');
    },
    draw: function (c, e, p, st) {
      var u = e.t / e.teleMs; c.save(); c.strokeStyle = 'rgba(176,96,255,0.9)'; c.fillStyle = 'rgba(176,96,255,' + (0.06 + 0.12 * u) + ')'; c.lineWidth = 2.5;
      c.beginPath(); c.arc(e.x, e.y, 30 + 60 * u, 0, TAU); c.fill(); c.stroke(); c.restore();
      for (var i = 0; i < e.pts.length; i++) circ(c, e.pts[i][0], e.pts[i][1], 20, u, { fill: '176,96,255', stroke: '200,140,255' });
    } };
  CA.embestida = { name: 'embestida', sig: true, double: true, cd: 9000, exit: [50, 100], dmg: 28, dmgBroken: 18, fix: 250, sT: ['ram_charge_wind', 'hit'], pz: ['charge_wind', 'charge'],
    ok: function (e, d) { return d >= 130 && d <= 430; },
    tele: function (e) { return e.stage ? 780 : 900; },
    start: function (e, X) { e.ang = X.a; e.fa = X.a; chargeEnd(e, 420); },
    aim: function (e, X) { e.ang = X.a; e.fa = X.a; chargeEnd(e, 420); },
    fire: function (e) { e.st = 'run'; e.t = 0; e.ph = 'go'; e.trav = 0; e.hitDone = false; e.noSlide = true; },
    run: function (e, dt, X) {
      var br = e.part.broken;
      charge(e, dt, X, { spd: 400, dmg: br ? 18 : 28, name: br ? 'testa' : 'embestida', ringR: br ? 0 : 100, ringDmg: 16,
        done: function (e2, wall) {
          if (br) { M.endAtk(e2, 1000, [1000, 1.25], 'idle'); return; }
          if (wall) { e2.stunned = true; snd('ram_stun', null, { vol: 0.8 }); fx.burst(e2.x, e2.y, 10, '#c8b8a0', 200, 500, 3); M.endAtk(e2, 1600, [1600, 1.5], 'stun'); return; }
          if (e2.enraged && e2.stage < 1) { e2.ph = null; M.restage(e2); return; }
          M.endAtk(e2, 1400, [1400, 1.4], 'idle');
        } });
    },
    draw: function (c, e, p, st) {
      var u = st === 'run' ? 1 : e.t / e.teleMs, len = st === 'run' ? Math.max(0, e.clen - e.trav) : e.clen;
      if (e.ph === 'ring') { var rr = 18 + 82 * G.clamp(e.t / 380, 0, 1); c.save(); c.strokeStyle = 'rgba(255,70,50,0.9)'; c.lineWidth = 10; c.beginPath(); c.arc(e.x, e.y, rr, 0, TAU); c.stroke(); c.restore(); return; }
      lane(c, e.x, e.y, e.ang, len, 80, u, st === 'run' || e.t >= e.teleMs - 250, true);
      if (!e.part.broken) circ(c, e.tx, e.ty, 100, u, { sig: true, close: false });
    } };
  M.D.carnero.shareNow = function (e) { return (e.st === 'rec' && e.atk && e.atk.name === 'embestida') ? 1 : 0.45; };
  M.D.carnero.sBreak = 'ram_horn_break';
  M.D.carnero.onBreak = function (e) {   // derribo 3 s x1,5; Embestida a testa, Coz y Balido más lento (los lee cada ataque por e.part.broken)
    e.st = 'rec'; e.t = 0; e.recDur = 3000; e.recPose = 'stun:0'; M.expose(e, 3000, 1.5);
    for (var i = 0; i < 8; i++) fx.part(G.hasSpr('fx_horn_shard') ? 'fx_horn_shard' : 'spark', e.x + rnd(-10, 10), e.y - 10, rnd(-160, 160), rnd(-200, -40), 700, { anim: true, sc: 0.8 });
  };
  M.D.carnero.drawOver = function (c, e) { crack(c, e, 'fx_mini_crack_carnero'); };
  function crack(c, e, spr) {
    if (e.part.broken || !e.part.cracked || !G.hasSpr(spr) || e.spawnT > 0) return;
    var cv = Assets.sprite(spr, e.part.cracked >= 2 ? 1 : 0), sc = (e.vsc || 1);
    G.fx.spr(c, cv, e.x, e.y + (e.fb ? 0 : 0), { flip: e.face < 0, sx: sc, sy: sc });
  }

  // ================================================================= 2. TEJEDORA DE ZARZAS (Bosque, control)
  var TE = A.tejedora = {};
  function rootN(e) { return e.part.broken ? 2 : e.enraged ? 6 : 4; }
  TE.raices = { name: 'raices', cd: 6000, exit: 25, dmg: 16, fix: 225, sT: ['weaver_root_tele', 'wave_start'], pz: ['roots:0', 'roots:1'],
    tele: function () { return 900; },
    start: function (e, X) { TE.raices.aim(e, X); },
    aim: function (e, X) {
      var p = X.p, a = X.a, n = rootN(e), la = Math.atan2(p.y + e.pvy * 0.8 - e.y, p.x + e.pvx * 0.8 - e.x), L = [];
      if (n === 2) L = [a, la];
      else {
        var base = n === 4 ? [-0.38, 0, 0.38] : [-0.76, -0.38, 0, 0.38, 0.76];
        base.forEach(function (o) { L.push(a + o); });
        var cand = la; if (L.some(function (x) { return Math.abs(G.angDiff(x, cand)) < 0.16; })) cand = la + 0.19;
        L.push(cand);
      }
      e.lines = L; e.fa = a;
    },
    fire: function (e) { e.st = 'run'; e.t = 0; e.hit = {}; e.fired = {}; },
    run: function (e, dt, X) {
      var p = X.p, n = e.lines.length, i;
      for (i = 0; i < n; i++) {
        var te = 250 * i;
        if (e.t >= te && !e.fired[i]) { e.fired[i] = true; snd('weaver_root_erupt', 'hit', { vol: 0.7 }); fx.dust(e.x + Math.cos(e.lines[i]) * 130, e.y + Math.sin(e.lines[i]) * 130, 4);
          if (!p.dead && inLane(e.x, e.y, e.lines[i], 260, 26, p)) { if (hurt(e, p, 16, 'raices', 0.6)) G.Player.slow(p, 0.45, 1500); } }
      }
      if (e.t >= 250 * (n - 1) + 700) M.endAtk(e, 400, null, 'idle');
    },
    draw: function (c, e, p, st) {
      var u = st === 'tele' ? e.t / e.teleMs : 1, fixed = st === 'run' || e.t >= e.teleMs - 225, i;
      for (i = 0; i < e.lines.length; i++) {
        if (st === 'run') {
          var age = e.t - 250 * i; if (age < 0) { lane(c, e.x, e.y, e.lines[i], 260, 26, 1, true); continue; }
          if (age > 700) continue;
          var sp = G.hasSpr('fx_root_spike') ? Assets.sprite('fx_root_spike', age < 250 ? Math.floor(age / 125) : age > 600 ? 3 : 2) : null;
          if (sp) for (var k = 40; k < 260; k += 50) { c.save(); c.translate(e.x + Math.cos(e.lines[i]) * k, e.y + Math.sin(e.lines[i]) * k); c.drawImage(sp, -sp.width / 4, -sp.height / 2 + 6, sp.width / 2, sp.height / 2); c.restore(); }
          else { c.save(); c.translate(e.x, e.y); c.rotate(e.lines[i]); c.fillStyle = 'rgba(70,120,40,0.75)'; c.strokeStyle = '#1b1124'; c.lineWidth = 2; c.fillRect(0, -9, 260, 18); c.strokeRect(0, -9, 260, 18); c.restore(); }
        } else H.thinLine(c, e.x, e.y, e.lines[i], 260, 'rgba(255,90,90,' + (0.5 + 0.45 * u) + ')', fixed ? 3 : 1.8, fixed ? null : [6, 4]);
      }
    } };
  TE.floracion = { name: 'floracion', cd: 16000, exit: 0, dmg: 0, sT: ['weaver_bloom', 'wave_start'], pz: ['bloom:0', 'bloom:1'],
    off: function (e) { return e.part.broken; },
    ok: function (e) { return podCount(e) < 2; },
    tele: function () { return 800; },
    start: function (e, X) {
      e.pts = []; for (var i = 0; i < 2; i++) { var a = rnd(0, TAU), d = rnd(120, 200); e.pts.push(clampPt(e.x + Math.cos(a) * d, e.y + Math.sin(a) * d, 30)); }
    },
    fire: function (e) {
      for (var i = 0; i < e.pts.length; i++) if (podCount(e) < 2) { var q = M.addAdd(e, 'mini_pod', e.pts[i][0], e.pts[i][1], { hp: 90, spawnT: 300 }); if (q) { setPod(q, e); snd('weaver_pod_pop', null, { pitch: 0.8, vol: 0.5 }); } }
      M.endAtk(e, 500, null, 'idle');
    },
    draw: function (c, e, p, st) { var u = e.t / e.teleMs; for (var i = 0; i < e.pts.length; i++) circ(c, e.pts[i][0], e.pts[i][1], 40, u, { fill: '184,255,154', stroke: '184,255,154', cross: true }); } };
  TE.maranya = { name: 'maranya', sig: true, cd: 12000, exit: 65, dmg: 7, sT: ['weaver_thorn_arm', 'wave_start'], pz: ['thorn:0', 'thorn:1'],
    tele: function () { return 1000; },
    start: function (e, X) {
      var n = e.enraged ? 7 : 5, a0 = rnd(0, TAU); e.pts = [];
      for (var i = 0; i < n; i++) { var a = a0 + i * TAU / n, d = rnd(120, 180); e.pts.push(clampPt(X.p.x + Math.cos(a) * d, X.p.y + Math.sin(a) * d, 60)); }
      e.zr = e.part.broken ? 44 : 55;
    },
    fire: function (e) {
      dropOldest(e, 'spore', 3);
      for (var i = 0; i < e.pts.length; i++) E.zone({ kind: 'spore', x: e.pts[i][0], y: e.pts[i][1], r: e.zr, arm: 0, life: e.part.broken ? 3500 : 6000, dmg: 7, tick: 500, slow: 0.2, slowMs: 400, owner: e, src: 'mini_tejedora_maranya' });
      snd('weaver_root_erupt', 'hit', { pitch: 0.8 }); M.endAtk(e, 600, null, 'idle');
    },
    draw: function (c, e, p, st) { var u = e.t / e.teleMs; for (var i = 0; i < e.pts.length; i++) circ(c, e.pts[i][0], e.pts[i][1], e.zr, u, { sig: true, fill: '123,227,74', stroke: '155,255,74' }); } };
  TE.estallido = { name: 'estallido', cd: 1e9, exit: 150, dmg: 18, sT: ['weaver_burst', 'boss_roar'], pz: ['burst:0', 'burst:1'],
    ok: function () { return true; }, tele: function () { return 1150; },
    fire: function (e, X) {
      var p = X.p; if (!p.dead && X.d <= 140 + p.r * 0.5) hurt(e, p, 18, 'estallido', 1.8);
      fx.shake(8, 250); fx.ring(e.x, e.y, 20, 140, 400, '#9bff4a', 7); fx.shockwave(e.x, e.y, 280); M.endAtk(e, 2200, [2200, 1.4], 'rec');
    },
    draw: function (c, e, p) { circ(c, e.x, e.y, 140, e.t / e.teleMs, {}); } };
  function podCount(e) { var n = 0; for (var i = 0; i < G.enemies.length; i++) { var q = G.enemies[i]; if (!q.dead && q.isPod && q.mown === e) n++; } return n; }
  function setPod(q, owner) {
    q.isPod = true; q.nosep = true; q.pt = 1500; q.draw = drawPod; q.noQuest = true; q.big = false; q.mown = owner;
  }
  E.AI.mini_pod = function (e, dt) {
    if (e.rot != null) { e.rot -= dt; if (e.rot <= 0) { e.dead = true; fx.burst(e.x, e.y, 5, '#9bb04a', 100, 400, 3); return; } }
    e.pt -= dt; var o = e.mown;
    if (e.pt <= 0) {
      e.pt = 1500;
      if (o && !o.dead && o.part && !o.part.broken && G.dist(e.x, e.y, o.x, o.y) <= 220) {
        var h = o.maxHp * 0.012; o.hp = Math.min(o.maxHp, o.hp + h); e.pulse = 300;
        fx.num(o.x, o.y - 36, '+' + Math.round(h), '#b8ff9a'); snd('weaver_pod_pulse', null, { vol: 0.5 });
      }
    }
    if (e.pulse > 0) e.pulse -= dt;
  };
  function drawPod(c, e) {
    var o = e.mown, hh = 14;
    if (o && !o.dead && G.dist(e.x, e.y, o.x, o.y) <= 220 && e.spawnT <= 0) { c.save(); c.globalAlpha = 0.5; c.strokeStyle = '#b8ff9a'; c.lineWidth = 1.5; c.beginPath(); c.moveTo(e.x, e.y); c.lineTo(o.x, o.y); c.stroke(); c.restore(); }
    G.fx.spr(c, Assets.sprite('shadow', 0), e.x, e.y + 8, { alpha: 0.5, sx: 0.8 });
    var o2 = { alpha: e.spawnT > 0 ? 0.4 : 1 }; if (e.flash > 0) { o2.tint = '#fff'; o2.tintA = 1; }
    if (G.hasSpr('enemy_mini_pod')) G.fx.spr(c, Assets.sprite('enemy_mini_pod', e.pulse > 0 ? 'pulse:' + Math.floor(e.anim / 100) : 'idle:' + Math.floor(e.anim / 330)), e.x, e.y, o2);
    else { c.save(); c.fillStyle = e.pulse > 0 ? '#e8ff9a' : '#c8e85a'; c.strokeStyle = '#1b1124'; c.lineWidth = 2; c.beginPath(); c.arc(e.x, e.y, 10 + (e.pulse > 0 ? 3 : 0), 0, TAU); c.fill(); c.stroke(); c.restore(); }
    if (e.hp < e.maxHp) { c.fillStyle = '#1a0a12'; c.fillRect(e.x - 12, e.y - hh - 6, 24, 4); c.fillStyle = '#b8ff9a'; c.fillRect(e.x - 11, e.y - hh - 5, 22 * e.hp / e.maxHp, 2); }
  }
  M.D.tejedora.sBreak = 'weaver_rootmother_break';
  M.D.tejedora.onBreak = function (e) { e.st = 'rec'; e.t = 0; e.recDur = 3500; e.recPose = 'idle'; e.stage = 0; M.expose(e, 3500, 1.4); for (var i = 0; i < G.enemies.length; i++) { var q = G.enemies[i]; if (q.isPod && q.mown === e) q.rot = 2000; } };
  M.D.tejedora.onEnrage = function () { };
  M.D.tejedora.afterEnrage = function (e) { e.force = 'estallido'; e.atkT = 0; };
  M.D.tejedora.drawOver = function (c, e) { crack(c, e, 'fx_mini_crack_tejedora'); };
  M.D.tejedora.statusLine = function (e) { var n = podCount(e); return n ? 'VAINAS ' + n : null; };

  // ================================================================= 3. ALCAIDE DE HIERRO (Cripta, presión)
  var AL = A.alcaide = {};
  AL.reja = { name: 'reja', cd: 4000, exit: 60, dmg: 22, dmgBroken: 18, fix: 200, sT: ['warden_chain_wind', 'whoosh'], pz: ['bash:0', 'bash:1'],
    ok: function (e, d) { return d < (e.part.broken ? 85 : 100); },
    tele: function (e) { return e.part.broken ? 600 : 700; },
    start: function (e, X) { e.ang = X.a; }, aim: function (e, X) { e.ang = X.a; e.fa = X.a; },
    fire: function (e, X) {
      var br = e.part.broken, p = X.p, reach = br ? 85 : 105, half = (br ? 35 : 45) * DEG;
      if (!p.dead && H.inFan(e, p, e.ang, half, reach + p.r)) hurt(e, p, br ? 18 : 22, br ? 'punyetazo' : 'reja', br ? 1 : 1.4);
      fx.shake(6, 180); snd('warden_bash', 'hit_heavy'); fx.ring(e.x, e.y, 20, reach, 250, '#ffcf7a', 4); M.endAtk(e, 500, null, 'idle');
    },
    draw: function (c, e, p, st) { var br = e.part.broken; if (st === 'tele') fanSh(c, e.x, e.y, (br ? 85 : 105) + p.r, e.ang, (br ? 35 : 45) * DEG, e.t / e.teleMs); } };
  function keyPos(e, i) { var a = e.oa + i * TAU / e.orbN; return { x: e.x + Math.cos(a) * 80, y: e.y + Math.sin(a) * 80, a: a }; }
  AL.llavero = { name: 'llavero', cd: 11000, exit: 23, dmg: 12, sT: ['warden_key_jingle', 'wave_start'], pz: ['keys:0', 'keys:1'],
    ok: function (e, d) { return d < 340; }, tele: function () { return 650; },
    start: function (e) { e.orbN = e.enraged ? 4 : 3; e.oa = Math.random() * TAU; e.odir = Math.random() < 0.5 ? -1 : 1; e.ph = 'tele'; },
    move: function (e, X) { if (X.d > e.r + X.p.r + 8) H.moveTo(e, X.a, e.spd * 0.4, X.s); },
    fire: function (e) { e.st = 'run'; e.t = 0; e.ph = 'orbit'; snd('warden_key_orbit', 'whoosh', { vol: 0.6 }); },
    run: function (e, dt, X) {
      var p = X.p, i, dur = e.part.broken ? 2400 : 3200;
      if (e.ph === 'orbit') {
        e.oa += e.odir * 2.4 * X.s; if (X.d > e.r + p.r + 8) H.moveTo(e, X.a, e.spd * 0.5, X.s);
        for (i = 0; i < e.orbN; i++) { var ob = keyPos(e, i); if (!p.dead && G.dist(ob.x, ob.y, p.x, p.y) < 12 + p.r - 1) hurt(e, p, 12, 'llavero', 0.8); }
        if (!e.kSnd || e.t - e.kSnd > 1400) { e.kSnd = e.t; snd('warden_key_orbit', null, { vol: 0.5 }); }
        if (e.t >= dur) { e.ph = 'launch'; e.t = 0; e.kSnd = 0; snd('warden_key_launch', 'hit', { pitch: 1.4, vol: 0.5 }); }
      } else if (e.ph === 'launch') {
        if (e.t >= 500) {
          for (i = 0; i < e.orbN; i++) { var o2 = keyPos(e, i); E.shoot('e', o2.x, o2.y, o2.a, 250, 12, 'proj_mini_key', { r: 12, life: 1500, src: 'mini_alcaide_llavero', kind: 'shieldbit' }); }
          snd('warden_shield_hit', 'shoot', { vol: 0.4 }); fx.shake(4, 120); M.endAtk(e, 500, null, 'idle');
        }
      }
    },
    draw: function (c, e, p, st) {
      if (st === 'tele') {
        var u = e.t / e.teleMs; circ(c, e.x, e.y, 96, u, { close: false });
        for (var i = 0; i < e.orbN; i++) { var q = keyPos(e, i); ghostKey(c, q.x, q.y, q.a + Math.PI / 2, 0.35 + 0.4 * u); }
      } else {
        c.save(); c.setLineDash([6, 8]); c.lineDashOffset = -G.time / 50; c.strokeStyle = 'rgba(255,110,90,0.55)'; c.lineWidth = 1.5; c.beginPath(); c.arc(e.x, e.y, 80, 0, TAU); c.stroke(); c.restore();
        var lf = e.ph === 'launch' ? e.t / 500 : 0;
        for (var j = 0; j < e.orbN; j++) { var o = keyPos(e, j); if (e.ph === 'launch') lane(c, o.x, o.y, o.a, 330, 26, lf, e.t >= 200); E.shieldBit(c, o.x, o.y, o.a + (e.ph === 'launch' ? 0 : Math.PI / 2), e.ph === 'launch' ? 0.5 + 0.5 * Math.sin(e.t / 30) : 0); }
      }
    },
    cancel: function (e) { e.ph = null; } };
  AL.grilletes = { name: 'grilletes', sig: true, double: true, cd: 9000, exit: [100, 80], dmg: 26, fix: 250, sT: ['warden_chain_wind', 'whoosh'], pz: ['chain:0', 'chain:1'],
    ok: function (e, d) { return d < 330; },
    tele: function (e) { return e.stage ? 720 : 1000; },
    start: function (e, X) { e.ang = e.stage ? e.ang0 + Math.PI : X.a; if (!e.stage) e.ang0 = X.a; },
    aim: function (e, X) { if (!e.stage) { e.ang = X.a; e.ang0 = X.a; e.fa = X.a; } },
    fire: function (e, X) {
      var p = X.p; e.st = 'run'; e.t = 0;
      var d = X.d, inA = Math.abs(G.angDiff(Math.atan2(p.y - e.y, p.x - e.x), e.ang)) <= 60 * DEG;
      if (!p.dead && d >= 70 && d <= 230 + p.r && inA) hurt(e, p, 26, 'grilletes', 1.2);
      fx.shake(8, 250); snd('warden_chain_sweep', 'explosion', { pitch: 0.8 });
    },
    run: function (e) {
      if (e.t >= 350) {
        if (e.enraged && e.stage < 1) { M.restage(e); return; }
        snd('warden_chain_pin', 'hit_heavy'); M.endAtk(e, 1400, [1400, 1.4], 'rec');
      }
    },
    draw: function (c, e, p, st) {
      var u = st === 'tele' ? e.t / e.teleMs : 1;
      sector(c, e.x, e.y, 70, 230 + p.r, e.ang, 60 * DEG, u, { sig: true });
      if (st === 'run') { var k = e.t / 350; c.save(); c.strokeStyle = '#aab4c8'; c.lineWidth = 4; c.setLineDash([6, 4]); var aa = e.ang - 60 * DEG + 120 * DEG * k; c.beginPath(); c.moveTo(e.x, e.y); c.lineTo(e.x + Math.cos(aa) * 225, e.y + Math.sin(aa) * 225); c.stroke(); c.restore(); }
    } };
  M.D.alcaide.sBreak = 'warden_shield_break';
  M.D.alcaide.onBreak = function (e) { e.st = 'rec'; e.t = 0; e.recDur = 3000; e.recPose = 'rec'; e.shield = 0; M.expose(e, 3000, 1.5); };
  M.D.alcaide.drawOver = function () { };

  // ================================================================= 4. CENTINELA DE BRASA (Cripta, control)
  var CE = A.centinela = {};
  function puddle(e, x, y, r, life) {
    var br = e.part.broken; dropOldest(e, 'fire', 8);
    E.zone({ kind: 'fire', x: x, y: y, r: br ? r * 0.7 : r, arm: 600, life: br ? 1500 : life, dmg: 6, tick: 400, owner: e, src: 'mini_centinela_charco' });
    snd('sentinel_puddle_hiss', null, { vol: 0.4 });
  }
  CE.arremetida = { name: 'arremetida', double: true, cd: 9000, exit: [42, 105], dmg: 24, fix: 300, sT: ['sentinel_ember_charge', 'wave_start'], pz: ['charge:0', 'charge:1'],
    ok: function (e, d) { return d >= 130 && d <= 430; },
    tele: function (e) { return e.stage ? 600 : 800; },
    start: function (e, X) { if (!e.stage) { e.shortC = e.short; e.short = false; } e.ang = X.a; e.fa = X.a; chargeEnd(e, e.shortC ? 180 : 300); },
    aim: function (e, X) { e.ang = X.a; e.fa = X.a; chargeEnd(e, e.shortC ? 180 : 300); },
    fix2: 330,
    fire: function (e) { e.st = 'run'; e.t = 0; e.ph = 'go'; e.trav = 0; e.hitDone = false; e.noSlide = true; snd('sentinel_dash', 'boss_roar', { pitch: 1.3, vol: 0.6 }); },
    run: function (e, dt, X) {
      charge(e, dt, X, { spd: 340, dmg: 24, name: 'arremetida', ringR: 95, ringDmg: 16, sCrash: 'sentinel_core_pulse',
        done: function (e2) {
          puddle(e2, e2.x, e2.y, 55, 4000);
          if (e2.enraged && e2.stage < 1 && !e2.shortC) { e2.ph = null; M.restage(e2); return; }
          e2.shortC = false; M.endAtk(e2, 1600, [1600, 1.5], 'rec');
        } });
    },
    draw: function (c, e, p, st) {
      if (e.ph === 'ring') { var rr = 18 + 77 * G.clamp(e.t / 380, 0, 1); c.save(); c.strokeStyle = 'rgba(255,70,50,0.9)'; c.lineWidth = 10; c.beginPath(); c.arc(e.x, e.y, rr, 0, TAU); c.stroke(); c.restore(); return; }
      var u = st === 'run' ? 1 : e.t / e.teleMs;
      lane(c, e.x, e.y, e.ang, st === 'run' ? Math.max(0, e.clen - e.trav) : e.clen, 64, u, st === 'run' || e.t >= e.teleMs - (e.stage ? 330 : 300));
      circ(c, e.tx, e.ty, 95, u, { close: false });
    } };
  CE.arremetida.fix = function (e) { return e.stage ? 330 : 300; };
  function fanN(e) { return e.part.broken ? 3 : e.enraged ? 7 : 5; }
  CE.abanico = { name: 'abanico', double: true, cd: 6000, exit: 40, dmg: 12, sT: ['sentinel_fan_wind', 'wave_start'], pz: ['fan:0', 'fan:1'],
    tele: function (e) { return e.stage ? 600 : 750; }, fix: function (e) { return e.stage ? 500 : 250; },
    start: function (e, X) { e.fanOff = e.stage ? (e.enraged ? 10 * DEG : 9 * DEG) : 0; CE.abanico.aim(e, X); },
    aim: function (e, X) { e.ang = X.a; e.fa = X.a; },
    fire: function (e) {
      var n = fanN(e), sp = (e.enraged ? 20 : 18) * DEG, br = e.part.broken;
      for (var i = 0; i < n; i++) {
        var a = e.ang + e.fanOff + (i - (n - 1) / 2) * sp;
        E.shoot('e', e.x, e.y, a, 230, 12, 'proj_magma_glob', { r: 8, life: 1435, src: 'mini_centinela_abanico', fb: 'fireball', onEnd: function (q) { puddle(e, q.x, q.y, 26, 3000); } });
      }
      snd('sentinel_fan_spit', 'shoot', { vol: 0.6, pitch: 0.8 });
      if (e.enraged && e.stage < 1) { M.restage(e); return; }
      M.endAtk(e, 500, null, 'idle');
    },
    draw: function (c, e, p, st) {
      var n = fanN(e), sp = (e.enraged ? 20 : 18) * DEG, u = e.t / e.teleMs, fixed = e.t >= e.teleMs - (e.stage ? 500 : 250);
      for (var i = 0; i < n; i++) thin(c, e.x, e.y, e.ang + e.fanOff + (i - (n - 1) / 2) * sp, 330, u, fixed);
    } };
  CE.erupcion = { name: 'erupcion', sig: true, cd: 20000, exit: 170, dmg: 22, sT: ['sentinel_core_open', 'wave_start'], pz: ['core:0', 'core:1'],
    off: function (e) { return e.part.broken; }, tele: function () { return 1200; },
    fire: function (e, X) {
      var p = X.p; if (!p.dead && X.d <= 200 + p.r * 0.5) hurt(e, p, 22, 'erupcion', 1.4);
      fx.shake(9, 300); fx.ring(e.x, e.y, 20, 200, 450, '#ff6a1a', 8); fx.shockwave(e.x, e.y, 400); snd('sentinel_core_pulse', 'explosion', { pitch: 0.8 });
      e.coreOpen = true; M.endAtk(e, 4000, [4000, 1.6], 'core:1');
    },
    recEnd: function (e) { e.coreOpen = false; e.force = 'arremetida'; e.short = true; e.atkT = 300; },
    cancel: function (e) { },
    draw: function (c, e, p) { circ(c, e.x, e.y, 200, e.t / e.teleMs, { sig: true, close: false }); } };
  CE.erupcion.cancel = null;
  M.D.centinela.sBreak = 'sentinel_core_break';
  M.D.centinela.onBreak = function (e) { e.st = 'rec'; e.t = 0; e.recDur = 4000; e.recPose = 'rec'; e.spdMul = 0.8; e.atk = null; M.expose(e, 4000, 1.6); };
  M.D.centinela.statusLine = function (e) { return e.coreOpen ? 'NÚCLEO ABIERTO' : null; };
  M.D.centinela.drawOver = function (c, e) { if (e.coreOpen) { c.save(); c.globalCompositeOperation = 'lighter'; c.fillStyle = 'rgba(255,154,42,' + (0.5 + 0.3 * Math.sin(G.time / 80)) + ')'; c.beginPath(); c.arc(e.x, e.y - 6, 16, 0, TAU); c.fill(); c.restore(); } };

  // ================================================================= 5. HIDRA JOVEN (Asfódelo, presión) - plan B del diseño: la cabeza es parte visual + medidor (no hija hurtable)
  var HI = A.hidra = {};
  function headOn(e) { return !e.part.broken; }
  HI.mordisco = { name: 'mordisco', double: true, cd: 3500, exit: 40, dmg: 20, fix: 250, sT: ['hydra_lunge_wind', 'wave_start'], pz: ['dive:0', 'tail:0'],
    off: function (e) { return !headOn(e); },
    ok: function (e, d) { return d >= 80 && d <= 300; },
    tele: function (e) { return e.stage ? 500 : 700; },
    start: function (e, X) { e.ang = X.a; e.fa = X.a; e.hd = 0; },
    aim: function (e, X) { e.ang = X.a; e.fa = X.a; },
    fire: function (e) { e.st = 'run'; e.t = 0; e.ph = 'out'; e.hd = 0; e.hitDone = false; snd('hydra_lunge', 'hit_heavy', { vol: 0.8 }); },
    run: function (e, dt, X) {
      var p = X.p, v = 460 * X.s;
      if (e.ph === 'out') { e.hd += v; if (e.hd >= 300) { e.hd = 300; e.ph = 'back'; } } else { e.hd -= v; if (e.hd <= 0) { e.hd = 0; HI.mordisco.done(e); return; } }
      var hx = e.x + Math.cos(e.ang) * e.hd, hy = e.y + Math.sin(e.ang) * e.hd - 10;
      if (!e.hitDone && !p.dead && G.dist(hx, hy, p.x, p.y) < 14 + p.r + 4) { e.hitDone = true; hurt(e, p, 20, 'mordisco', 1.2); fx.burst(hx, hy, 6, '#7be34a', 160, 350, 3); }
    },
    done: function (e) {
      if (e.enraged && e.stage < 1) { M.restage(e); return; }
      if (!e.hitDone) M.endAtk(e, 300, [1200, 1.3], 'idle'); else M.endAtk(e, 400, null, 'idle');
    },
    draw: function (c, e, p, st) { if (st === 'tele') lane(c, e.x, e.y, e.ang, 300, 60, e.t / e.teleMs, e.t >= e.teleMs - 250); } };
  HI.escupitajo = { name: 'escupitajo', cd: 9000, exit: 50, dmg: 7, sT: ['hydra_spit_wind', 'wave_start'], pz: ['tail:0', 'tail:0'],
    off: function (e) { return !headOn(e); }, tele: function () { return 900; },
    start: function (e, X) {
      var n = e.enraged ? 5 : 3; e.pts = [clampPt(X.p.x, X.p.y, 45)];
      for (var i = 1; i < n; i++) { var a = rnd(0, TAU), d = rnd(55, 120); e.pts.push(clampPt(X.p.x + Math.cos(a) * d, X.p.y + Math.sin(a) * d, 45)); }
    },
    fire: function (e) {
      dropOldest(e, 'acid', 4);
      for (var i = 0; i < e.pts.length; i++) E.zone({ kind: 'acid', x: e.pts[i][0], y: e.pts[i][1], r: 42, arm: 0, life: 4000, dmg: 7, tick: 500, slow: 0.15, owner: e, src: 'mini_hidra_escupitajo' });
      snd('hydra_spit', 'shoot', { vol: 0.6 }); M.endAtk(e, 500, null, 'idle');
    },
    draw: function (c, e) { var u = e.t / e.teleMs; for (var i = 0; i < e.pts.length; i++) circ(c, e.pts[i][0], e.pts[i][1], 42, u, { fill: '123,227,74', stroke: '155,255,74' }); } };
  HI.sumersion = { name: 'sumersion', sig: true, cd: 14000, exit: 110, dmg: 26, fix: 250, sT: ['hydra_dive', 'wave_start'], pz: ['dive:0', 'dive:1'],
    tele: function () { return 1000; },
    start: function (e, X) { e.mark = clampPt(X.p.x, X.p.y, 60); },
    aim: function (e, X) { e.mark = clampPt(X.p.x, X.p.y, 60); },
    fire: function (e) { e.st = 'run'; e.t = 0; e.ph = 'sink'; e.untarget = true; e.hide = true; fx.ring(e.x, e.y, 10, 60, 400, '#9fe8d8', 4); fx.burst(e.x, e.y, 10, '#bfeaff', 120, 500, 3, { add: true }); },
    run: function (e, dt, X) {
      if (e.ph === 'sink' && e.t >= 1600) {
        var p = X.p; e.x = e.mark[0]; e.y = e.mark[1]; e.untarget = false; e.hide = false; e.ph = null;
        if (!p.dead && G.dist(e.x, e.y, p.x, p.y) <= 110 + p.r * 0.5) hurt(e, p, 26, 'sumersion', 1.6);
        fx.shake(8, 260); fx.ring(e.x, e.y, 10, 110, 400, '#9fe8d8', 7); fx.shockwave(e.x, e.y, 220); snd('hydra_emerge', 'explosion', { pitch: 1.2 });
        if (e.enraged) fx.ring(e.x, e.y, 10, 70, 600, '#7be34a', 6);
        M.endAtk(e, 300, [1500, 1.3], 'emerge:0');
      }
    },
    cancel: function (e) { e.untarget = false; e.hide = false; },
    draw: function (c, e, p, st) {
      var u = st === 'tele' ? e.t / e.teleMs : 1; circ(c, e.mark[0], e.mark[1], 110, u, { sig: true, close: st === 'tele' });
      c.save(); c.strokeStyle = 'rgba(190,240,230,0.8)'; c.lineWidth = 2; for (var i = 0; i < 3; i++) { c.beginPath(); c.arc(e.x + Math.sin(G.time / 200 + i * 2) * 14, e.y - 6 - ((G.time / 14 + i * 20) % 40), 3 + i, 0, TAU); c.stroke(); } c.restore();
    } };
  HI.coletazo = { name: 'coletazo', cd: 5000, exit: 60, dmg: 22, sT: ['hydra_lunge_wind', 'wave_start'], pz: ['tail:0', 'tail:1'],
    off: function (e) { return headOn(e); }, tele: function () { return 800; },
    fire: function (e, X) {
      var p = X.p; if (!p.dead && X.d >= 60 && X.d <= 170 + p.r) hurt(e, p, 22, 'coletazo', 1.2);
      fx.shake(6, 200); fx.ring(e.x, e.y, 20, 170, 300, '#9fe8d8', 6); snd('hydra_lunge', 'hit_heavy'); M.endAtk(e, 500, null, 'idle');
    },
    draw: function (c, e, p) { sector(c, e.x, e.y, 60, 170 + p.r, 0, Math.PI, e.t / e.teleMs, {}); } };
  var HD = M.D.hidra;
  HD.tick = function (e, X) {
    var w = e.wound; if (!w || w.done || w.perm) return;
    w.t -= X.dt;
    if (w.t <= 700 && !w.warn) { w.warn = true; snd('hydra_regrow', null, { vol: 0.7 }); }
    if (w.t <= 0) {   // rebrota con el 50 % del medidor
      e.part.broken = false; e.part.hp = e.part.max * 0.5; e.part.cracked = 0; e.regN = (e.regN || 0) + 1; e.dmgIn = 1; e.wound = null;
      fx.ring(e.x, e.y, 10, 60, 500, '#7be34a', 5); fx.burst(e.x, e.y, 10, '#7be34a', 140, 500, 3, { add: true });
    }
  };
  HD.sBreak = 'hydra_sever';
  HD.onBreak = function (e) {
    e.st = 'rec'; e.t = 0; e.recDur = 3000; e.recPose = 'tail:0'; e.dmgIn = 1.3; e.stage = 0; e.untarget = false; e.hide = false;
    e.wound = { t: 12000, fire: 0, done: false, perm: (e.regN || 0) >= 2 };
    if (e.wound.perm) e.wound.t = 0;
  };
  M.cauterHit = function (e, dmg) {
    var w = e.wound; if (!w || w.done || w.perm) return;
    w.fire += dmg;
    if (w.fire >= 60) {
      w.done = true; e.cauterized = true; fx.flames(e.x, e.y, 10, 22); fx.ring(e.x, e.y, 8, 50, 400, '#ff9a3c', 4);
      snd('hydra_sizzle', null, { vol: 0.8 }); G.Hud.banner('¡CABEZA CAUTERIZADA!', 1400, '#ff9a3c');
      try { G.Quests.onMiniCaut(e); } catch (x1) { /* encargo */ }
      try { G.Loot.dropPart(e, 'plate', G.Loot.scaleN(1, G.Loot.dur().parts)); } catch (x) { /* botín */ }
    }
  };
  HD.statusLine = function (e) {
    var w = e.wound; if (!w) return null;
    if (w.done) return 'CAUTERIZADA';
    if (w.perm) return 'SIN CABEZA';
    return 'REBROTE EN ' + Math.max(0, Math.ceil(w.t / 1000)) + ' s - ¡QUÉMALA! ' + Math.min(60, Math.round(w.fire)) + '/60';
  };
  HD.drawOver = function (c, e) {   // cuello de 3 segmentos y cabeza (visual; el medidor de la cabeza se llena con el daño al cuerpo)
    if (e.spawnT > 0 || e.hide) return;
    var broken = e.part.broken, fa = e.fa || 0, st = e.st, hx, hy, an = 'idle', i;
    var ax = e.x + Math.cos(fa) * 18 * (e.face || 1) * 0 + (e.face >= 0 ? 12 : -12), ay = e.y - 10;
    if (broken) { if (e.wound && e.wound.warn && !e.wound.done) { c.save(); c.strokeStyle = 'rgba(123,227,74,0.9)'; c.lineWidth = 3; c.setLineDash([5, 4]); c.beginPath(); c.arc(ax, ay, 14 + 4 * Math.sin(G.time / 60), 0, TAU); c.stroke(); c.restore(); }
      if (e.wound && !e.wound.done && !e.wound.perm) { var fr = G.clamp(e.wound.fire / 60, 0, 1); c.save(); c.strokeStyle = '#ff9a3c'; c.lineWidth = 3; c.beginPath(); c.arc(ax, ay, 18, -1.57, -1.57 + TAU * fr); c.stroke(); c.restore(); }
      return; }
    if (st === 'run' && e.atk && e.atk.name === 'mordisco') { hx = e.x + Math.cos(e.ang) * (e.hd + 50); hy = e.y + Math.sin(e.ang) * (e.hd + 50) - 10; an = 'lunge:1'; }
    else if (st === 'tele' && e.atk && e.atk.name === 'mordisco') { hx = e.x - Math.cos(e.ang) * 20 + (e.face >= 0 ? 30 : -30); hy = e.y - 36; an = 'lunge:0'; }
    else if (st === 'tele' && e.atk && e.atk.name === 'escupitajo') { hx = e.x + (e.face >= 0 ? 44 : -44); hy = e.y - 36; an = 'spit:0'; }
    else { hx = e.x + (e.face >= 0 ? 50 : -50) + 6 * Math.sin(e.anim / 300); hy = e.y - 34 + 4 * Math.cos(e.anim / 260); if (e.expT > 0) an = 'exposed'; }
    var hasN = G.hasSpr('enemy_mini_hidra_neck'), hasH = G.hasSpr('enemy_mini_hidra_head');
    for (i = 1; i <= 3; i++) {
      var nx = ax + (hx - ax) * i / 4, ny = ay + (hy - ay) * i / 4;
      if (hasN) c.drawImage(Assets.sprite('enemy_mini_hidra_neck', 0), Math.round(nx - 12), Math.round(ny - 12)); else { c.fillStyle = '#2f6f6a'; c.strokeStyle = '#1b1124'; c.lineWidth = 2; c.beginPath(); c.arc(nx, ny, 7, 0, TAU); c.fill(); c.stroke(); }
    }
    if (hasH) { var sp = Assets.sprite('enemy_mini_hidra_head', an), fl = e.st === 'run' && e.atk && e.atk.name === 'mordisco' ? Math.cos(e.ang) < 0 : e.face < 0; c.save(); c.translate(hx, hy); if (fl) c.scale(-1, 1); c.drawImage(sp, -24, -24); c.restore(); }
    else { c.fillStyle = '#7be34a'; c.strokeStyle = '#1b1124'; c.lineWidth = 2; c.beginPath(); c.arc(hx, hy, 12, 0, TAU); c.fill(); c.stroke(); c.fillStyle = '#ffe45a'; c.fillRect(hx + 2, hy - 4, 4, 4); }
  };

  // ================================================================= 6. PLAÑIDERA ANEGADA (Asfódelo, control)
  var PL = A.planidera = {};
  function rainPts(e, p, n) {
    var pts = [clampPt(p.x, p.y, 30)], tries = 0;
    while (pts.length < n && tries++ < 60) {
      var a = rnd(0, TAU), d = rnd(45, 150), q = clampPt(p.x + Math.cos(a) * d, p.y + Math.sin(a) * d, 30), ok = true;
      for (var k = 0; k < pts.length; k++) if (G.dist(q[0], q[1], pts[k][0], pts[k][1]) < 66) ok = false;
      if (ok) pts.push(q);
    }
    return pts;
  }
  PL.lluvia = { name: 'lluvia', cd: 8000, exit: 36, dmg: 14, sT: ['weeper_wail_wind', 'wave_start'], pz: ['rain:0', 'rain:1'],
    off: function (e) { return e.part.broken; }, tele: function () { return 750; },
    start: function (e, X) { e.pts = rainPts(e, X.p, e.enraged ? 7 : 5); },
    fire: function (e, X) {
      var p = X.p, i;
      for (i = 0; i < e.pts.length; i++) {
        var r = e.pts[i]; fx.ring(r.x === undefined ? r[0] : r[0], r[1], 4, 34, 250, '#7fffe0', 4);
        if (!p.dead && G.dist(r[0], r[1], p.x, p.y) <= 26 + p.r * 0.6) hurt(e, p, 14, 'lluvia', 0.8);
        M.addAdd(e, 'worm', r[0], r[1], {});
      }
      snd('weeper_soul_rain', 'hit_heavy', { pitch: 1.4, vol: 0.5 }); fx.shake(4, 120); M.endAtk(e, 500, null, 'idle');
    },
    draw: function (c, e) { var u = e.t / e.teleMs; for (var i = 0; i < e.pts.length; i++) circ(c, e.pts[i][0], e.pts[i][1], 26, u, {}); } };
  PL.marea = { name: 'marea', cd: 12000, exit: 60, dmg: 4, sT: ['weeper_zone_hum', 'wave_start'], pz: ['tide:0', 'tide:1'],
    tele: function () { return 1000; },
    start: function (e, X) {
      var n = e.enraged ? 5 : 4, a0 = rnd(0, TAU), br = e.part.broken; dropOldest(e, 'olvido', 5 - n);
      for (var i = 0; i < n; i++) { var a = a0 + i * TAU / n, q = clampPt(X.p.x + Math.cos(a) * 115, X.p.y + Math.sin(a) * 115, 55);
        E.zone({ kind: 'olvido', x: q[0], y: q[1], r: br ? 42 : 50, arm: 1000, life: 5500, dmg: br ? 3 : 4, tick: 500, cd: true, cdPct: br ? 0.25 : 0.4, owner: e, src: 'mini_planidera_marea' }); }
    },
    fire: function (e) { M.endAtk(e, 600, null, 'idle'); }, draw: function () { } };
  PL.coro = { name: 'coro', sig: true, cd: function (e) { return e.enraged ? 14000 : e.part.broken ? 27000 : 18000; }, exit: 0, dmg: 0, sT: ['weeper_choir', 'wave_start'], pz: ['choir:0', 'choir:1'],
    tele: function () { return 800; },
    start: function (e, X) { e.pts = []; for (var i = 0; i < 2; i++) { var a = rnd(0, TAU), d = rnd(140, 220); e.pts.push(clampPt(X.p.x + Math.cos(a) * d, X.p.y + Math.sin(a) * d, 30)); } },
    fire: function (e) { for (var i = 0; i < e.pts.length; i++) { var q = M.addAdd(e, 'moth', e.pts[i][0], e.pts[i][1], {}); if (q) fx.ring(q.x, q.y, 6, 34, 350, '#b060ff', 4); } M.endAtk(e, 500, null, 'idle'); },
    draw: function (c, e) { var u = e.t / e.teleMs; for (var i = 0; i < e.pts.length; i++) circ(c, e.pts[i][0], e.pts[i][1], 30, u, { sig: true, fill: '176,96,255', stroke: '200,140,255' }); } };
  PL.estallido = { name: 'estallido', cd: 1e9, exit: 160, dmg: 14, sT: ['weeper_burst', 'boss_roar'], pz: ['burst:0', 'burst:1'], ok: function () { return true; }, tele: function () { return 1150; },
    fire: function (e, X) {
      var p = X.p; if (!p.dead && X.d <= 150 + p.r * 0.5) hurt(e, p, 14, 'estallido', 1.4);
      fx.shake(8, 250); fx.ring(e.x, e.y, 20, 150, 400, '#7fffe0', 7);
      for (var i = 0; i < 3; i++) { var a = i * 2.094 + rnd(0, 1); M.addAdd(e, 'worm', e.x + Math.cos(a) * 70, e.y + Math.sin(a) * 70, {}); }
      M.endAtk(e, 2200, [2200, 1.4], 'rec');
    },
    draw: function (c, e) { circ(c, e.x, e.y, 150, e.t / e.teleMs, {}); } };
  M.D.planidera.sBreak = 'weeper_veil_tear';
  M.D.planidera.onBreak = function (e) {
    e.st = 'rec'; e.t = 0; e.recDur = 3500; e.recPose = 'idle'; M.expose(e, 3500, 1.4);
    for (var i = 0; i < 3; i++) { var a = i * 2.094; M.addAdd(e, 'worm', e.x + Math.cos(a) * 60, e.y + Math.sin(a) * 60, {}); }
  };
  M.D.planidera.afterEnrage = function (e) { e.force = 'estallido'; e.atkT = 0; };
  M.D.planidera.drawOver = function (c, e) { crack(c, e, 'fx_mini_crack_planidera'); };

  // ================================================================= 7. YETI MAYOR (Tundra, presión; regla del hielo +220 ms)
  var YE = A.yeti_mayor = {};
  function cold(n) { try { G.Tundra.coldAdd(n); } catch (x) { /* sin Tundra */ } }
  YE.empellon = { name: 'empellon', double: true, cd: 4000, exit: 60, dmg: 22, fix: 240, sT: ['yar_charge_tele', 'whoosh'], pz: ['bash:0', 'bash:1'],
    ok: function (e, d) { return d < 100; }, tele: function () { return 800; },
    start: function (e, X) { e.ang = X.a; }, aim: function (e, X) { e.ang = X.a; e.fa = X.a; },
    fire: function (e, X) {
      var p = X.p; if (!p.dead && H.inFan(e, p, e.ang, 45 * DEG, 100 + p.r)) { if (hurt(e, p, 22, 'empellon', 1.6)) cold(6); }
      fx.shake(6, 180); snd('yetim_bash', 'hit_heavy'); fx.ring(e.x, e.y, 20, 100, 250, '#bfeaff', 4);
      if (e.enraged && e.stage < 1) { M.restage(e); return; }
      M.endAtk(e, 500, null, 'idle');
    },
    draw: function (c, e, p, st) { if (st === 'tele') fanSh(c, e.x, e.y, 100 + p.r, e.ang, 45 * DEG, e.t / e.teleMs); } };
  YE.pisoton = { name: 'pisoton', cd: 10000, exit: 125, dmg: 16, fix: 345, sT: ['yar_stomp_tele', 'wave_start'], pz: ['stomp:0', 'stomp:1'],
    ok: function (e, d) { return d < 190; }, tele: function () { return 1150; },
    start: function (e, X) { e.gap = X.a; }, aim: function (e, X) { e.gap = X.a; e.fa = X.a; },
    fire: function (e) { e.st = 'run'; e.t = 0; e.hit = [false, false, false]; snd('yetim_stomp', 'explosion', { pitch: 0.8 }); fx.shake(7, 220); },
    run: function (e, dt, X) {
      var p = X.p, i;
      for (i = 0; i < 3; i++) {
        var t = e.t - 250 * i; if (t < 0 || t > 553) continue;
        var rr = 20 + 190 * t / 1000;
        if (!e.hit[i] && !p.dead && Math.abs(X.d - rr) <= 12 + p.r * 0.6 && Math.abs(G.angDiff(Math.atan2(p.y - e.y, p.x - e.x), e.gap)) > 35 * DEG) { e.hit[i] = true; if (hurt(e, p, 16, 'pisoton', 0.8)) cold(4); }
      }
      if (e.t >= 553 + 500 + 20) M.endAtk(e, 500, null, 'idle');
    },
    draw: function (c, e, p, st) {
      if (st === 'tele') {
        var u = e.t / e.teleMs; sector(c, e.x, e.y, 0, 125, e.gap + Math.PI, Math.PI - 35 * DEG, u, {});
        c.save(); c.strokeStyle = 'rgba(180,255,200,0.9)'; c.lineWidth = 3; c.beginPath(); c.arc(e.x, e.y, 125, e.gap - 35 * DEG, e.gap + 35 * DEG); c.stroke(); c.restore();
      } else {
        c.save(); c.strokeStyle = 'rgba(190,235,255,0.95)'; c.lineWidth = 9;
        for (var i = 0; i < 3; i++) { var t = e.t - 250 * i; if (t < 0 || t > 553) continue; c.globalAlpha = 1 - t / 553 * 0.6; c.beginPath(); c.arc(e.x, e.y, 20 + 190 * t / 1000, e.gap + 35 * DEG, e.gap + TAU - 35 * DEG); c.stroke(); }
        c.restore();
      }
    } };
  function derrapeLen(e) { return e.part.broken ? 120 : 220; }
  YE.derrape = { name: 'derrape', sig: true, double: true, cd: 9000, exit: [45, 100], dmg: 28, fix: function (e) { return Math.round((e.stage ? 720 : 850) * 0.3); }, sT: ['yetim_charge_wind', 'whoosh'], pz: ['charge:0', 'charge:1'],
    ok: function (e, d) { return d >= 130 && d <= 430; },
    tele: function (e) { return e.stage ? 720 : 850; },
    start: function (e, X) { e.ang = X.a; e.fa = X.a; chargeEnd(e, 360 + derrapeLen(e)); },
    aim: function (e, X) { e.ang = X.a; e.fa = X.a; chargeEnd(e, 360 + derrapeLen(e)); },
    fire: function (e) { e.st = 'run'; e.t = 0; e.ph = 'go'; e.trav = 0; e.hitDone = false; e.noSlide = true; snd('yetim_slide', 'ice_slide', { pitch: 1 }); },
    run: function (e, dt, X) {
      var rr = e.part.broken ? 60 : 100;
      charge(e, dt, X, { spd: 380, slide: derrapeLen(e), dmg: 28, name: 'derrape', ringR: rr, ringDmg: 16, sCrash: 'yetim_ring',
        done: function (e2) { if (e2.enraged && e2.stage < 1) { e2.ph = null; M.restage(e2); return; } M.endAtk(e2, 1600, [1600, 1.5], 'rec'); } });
    },
    draw: function (c, e, p, st) {
      var rr = e.part.broken ? 60 : 100;
      if (e.ph === 'ring') { var q = 18 + (rr - 18) * G.clamp(e.t / 380, 0, 1); c.save(); c.strokeStyle = 'rgba(255,70,50,0.9)'; c.lineWidth = 10; c.beginPath(); c.arc(e.x, e.y, q, 0, TAU); c.stroke(); c.restore(); return; }
      var u = st === 'run' ? 1 : e.t / e.teleMs, len = st === 'run' ? Math.max(0, e.clen - e.trav) : e.clen, dl = Math.min(derrapeLen(e), len);
      lane(c, e.x, e.y, e.ang, len, 70, u, st === 'run' || e.t >= e.teleMs * 0.7, true);
      c.save(); c.translate(e.x, e.y); c.rotate(e.ang); c.strokeStyle = 'rgba(190,230,255,0.95)'; c.lineWidth = 3; c.setLineDash([5, 7]); c.beginPath(); c.moveTo(len - dl, 0); c.lineTo(len, 0); c.stroke(); c.restore();
      circ(c, e.tx, e.ty, rr, u, { sig: true, close: false });
    } };
  var YD = M.D.yeti_mayor;
  YD.sBreak = 'yetim_plate_break';
  YD.onBreak = function (e) { e.st = 'rec'; e.t = 0; e.recDur = 3000; e.recPose = 'rec'; e.shield = 0; e.tau = 360; if (e.mat) e.mat = 'pelaje'; fx.burst(e.x, e.y, 12, '#bfeaff', 200, 500, 3, { add: true }); M.expose(e, 3000, 1.5); };
  YD.init = function (e) { if (B.mat.on) e.mat = 'escarcha'; };

  // ================================================================= 8. VENTISQUERO (Tundra, control)
  var VE = A.ventisquero = {};
  VE.carambanos = { name: 'carambanos', cd: 8000, exit: 36, dmg: 14, sT: ['icicle_fall', 'wave_start'], pz: ['spit:0', 'spit:0'],
    off: function (e) { return e.part.broken; }, tele: function () { return 750; },
    start: function (e, X) { e.pts = rainPts(e, X.p, e.enraged ? 7 : 5); },
    fire: function (e, X) {
      var p = X.p;
      for (var i = 0; i < e.pts.length; i++) {
        var r = e.pts[i]; fx.ring(r[0], r[1], 4, 34, 250, '#bfeaff', 4);
        if (!p.dead && G.dist(r[0], r[1], p.x, p.y) <= 26 + p.r * 0.6) hurt(e, p, 14, 'carambanos', 0.8);
        M.addAdd(e, 'worm', r[0], r[1], {});
      }
      snd('icicle_hit', 'hit_heavy', { pitch: 1.4, vol: 0.5 }); fx.shake(4, 120); M.endAtk(e, 500, null, 'idle');
    },
    draw: function (c, e) { var u = e.t / e.teleMs; for (var i = 0; i < e.pts.length; i++) circ(c, e.pts[i][0], e.pts[i][1], 26, u, {}); } };
  VE.ventisca = { name: 'ventisca', cd: 12000, exit: 60, dmg: 4, sT: ['vent_zone_hum', 'wave_start'], pz: ['acid:0', 'acid:0'],
    tele: function () { return 1000; },
    start: function (e, X) {
      var n = e.enraged ? 5 : 4, a0 = rnd(0, TAU); dropOldest(e, 'blizz', 5 - n);
      for (var i = 0; i < n; i++) { var a = a0 + i * TAU / n, q = clampPt(X.p.x + Math.cos(a) * 115, X.p.y + Math.sin(a) * 115, 55);
        E.zone({ kind: 'blizz', x: q[0], y: q[1], r: 50, arm: 1000, life: 5500, dmg: 4, tick: 500, slow: 0.15, cold: e.part.broken ? 6 : 14, owner: e, src: 'mini_ventisquero_ventisca' }); }
    },
    fire: function (e) { M.endAtk(e, 600, null, 'idle'); }, draw: function () { } };
  // olas: e.wv = { dir, lat, anchor, g, gw, n, t0 }
  function waveInit(e, p, n, delay) {
    var dirs = [[1, 0], [-1, 0], [0, 1], [0, -1]], d = dirs[Math.floor(Math.random() * 4)];
    e.wv = { dx: d[0], dy: d[1], lx: -d[1], ly: d[0], ax: p.x, ay: p.y, g: rnd(-100, 100), gw: e.part.broken ? 180 : 140, n: n, delay: delay || 0, hit: {} };
  }
  function wavePos(e, i, t) { return -240 + 260 * (t - e.wv.delay - 1200 * i) / 1000; }
  function waveRun(e, p, t) {
    var W = e.wv, i;
    for (i = 0; i < W.n; i++) {
      var pos = wavePos(e, i, t); if (pos < -250 || pos > 250) continue;
      var u = (p.x - W.ax) * W.dx + (p.y - W.ay) * W.dy, v = (p.x - W.ax) * W.lx + (p.y - W.ay) * W.ly;
      if (!W.hit[i] && !p.dead && Math.abs(u - pos) <= 50 + p.r * 0.6 && Math.abs(v) <= 260 && Math.abs(v - W.g) > W.gw / 2 - 4) {
        W.hit[i] = true; if (hurt(e, p, 14, 'ola', 0)) { cold(10); p.kx = W.dx * 1080; p.ky = W.dy * 1080; }
      }
    }
    return t >= W.delay + 1200 * (W.n - 1) + 1900;
  }
  function waveDraw(c, e, t, u) {
    var W = e.wv, i; if (!W) return;
    for (i = 0; i < W.n; i++) {
      var pos = wavePos(e, i, t); if (pos > 255) continue; var pp = Math.max(-240, pos);
      var cx = W.ax + W.dx * pp, cy = W.ay + W.dy * pp, ang = Math.atan2(W.dy, W.dx);
      [[-260, W.g - W.gw / 2], [W.g + W.gw / 2, 260]].forEach(function (seg) {
        if (seg[1] - seg[0] < 4) return;
        var mx = cx + W.lx * seg[0], my = cy + W.ly * seg[0]; c.save(); c.translate(mx, my); c.rotate(Math.atan2(W.ly, W.lx));
        c.fillStyle = 'rgba(255,40,40,' + (0.12 + 0.2 * u) + ')'; c.fillRect(0, -50, seg[1] - seg[0], 100);
        if (G.hasSpr('fx_blizz_wave')) { var tl = Assets.sprite('fx_blizz_wave', Math.floor(G.time / 100) % 4); c.globalAlpha = 0.5; for (var tx = 0; tx < seg[1] - seg[0]; tx += 64) for (var ty = -50; ty < 50; ty += 64) c.drawImage(tl, tx, ty, Math.min(64, seg[1] - seg[0] - tx), Math.min(64, 50 - ty)); c.globalAlpha = 1; }
        c.strokeStyle = 'rgba(8,4,14,0.7)'; c.lineWidth = 6; c.strokeRect(0, -50, seg[1] - seg[0], 100); c.strokeStyle = 'rgba(255,110,100,0.95)'; c.lineWidth = 2.2; c.strokeRect(0, -50, seg[1] - seg[0], 100);
        c.restore();
      });
      c.save(); c.translate(cx + W.lx * W.g, cy + W.ly * W.g); c.rotate(ang); c.fillStyle = 'rgba(255,255,255,0.85)'; c.strokeStyle = '#1b1124'; c.lineWidth = 2; c.beginPath(); c.moveTo(18, 0); c.lineTo(-6, -11); c.lineTo(-6, 11); c.closePath(); c.fill(); c.stroke(); c.font = 'bold 12px monospace'; c.restore();
    }
  }
  VE.ola = { name: 'ola', sig: true, cd: 14000, exit: 120, dmg: 14, sT: ['vent_wave_wind', 'wave_start'], pz: ['wave:0', 'wave:1'],
    tele: function () { return 1150; },
    start: function (e, X) { waveInit(e, X.p, e.enraged ? 3 : 2, 0); },
    aim: function (e, X) { if (e.wv) { e.wv.ax = X.p.x; e.wv.ay = X.p.y; } }, fix: 288,
    fire: function (e) { e.st = 'run'; e.t = 0; snd('vent_wave', 'wind_gust', { vol: 0.7 }); },
    run: function (e, dt, X) { if (waveRun(e, X.p, e.t)) M.endAtk(e, 600, null, 'idle'); },
    draw: function (c, e, p, st) { waveDraw(c, e, st === 'tele' ? 0 : e.t, st === 'tele' ? e.t / e.teleMs : 1); } };
  VE.estallido = { name: 'estallido', cd: 1e9, exit: 140, dmg: 14, sT: ['vent_burst', 'boss_roar'], pz: ['wave:0', 'wave:1'], ok: function () { return true; }, tele: function () { return 1250; },
    start: function (e, X) { waveInit(e, X.p, 2, 600); },
    aim: function (e, X) { if (e.wv) { e.wv.ax = X.p.x; e.wv.ay = X.p.y; } }, fix: 375,
    fire: function (e, X) {
      var p = X.p; if (!p.dead && X.d <= 130 + p.r * 0.5) { if (hurt(e, p, 14, 'estallido', 1.4)) cold(20); }
      fx.shake(8, 250); fx.ring(e.x, e.y, 20, 130, 400, '#bfeaff', 7); fx.shockwave(e.x, e.y, 260); e.st = 'run'; e.t = 0; e.ph = 'wv';
    },
    run: function (e, dt, X) { if (waveRun(e, X.p, e.t)) M.endAtk(e, 300, [2200, 1.4], 'rec'); },
    draw: function (c, e, p, st) { if (st === 'tele') circ(c, e.x, e.y, 130, e.t / e.teleMs, {}); waveDraw(c, e, st === 'tele' ? 0 : e.t, st === 'tele' ? e.t / e.teleMs : 1); } };
  var VD = M.D.ventisquero;
  VD.sBreak = 'vent_heart_crack';
  VD.onBreak = function (e) { e.st = 'rec'; e.t = 0; e.recDur = 3500; e.recPose = 'idle'; M.expose(e, 3500, 1.4); };
  VD.afterEnrage = function (e) { e.force = 'estallido'; e.atkT = 0; };
})();
