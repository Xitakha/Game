// Bot esquivador (se inyecta en la página). Lee las telegrafías vía G.Boss.hazards() + zonas + proyectiles, igual que un jugador las ve.
// opts: { react: ms (reacción humana), every: ms (decisión), horizon: ms, mistakes: prob (0-1), godUntilBoss: bool, tag: string }
window.installBot = function (opts) {
  opts = Object.assign({ inattn: 0, hp0: 100, react: 250, every: 100, horizon: 1600, mistakes: 0.1, godUntilBoss: true, dist: 250 }, opts || {});
  var seen = new Map(), simT = 0, lastDec = -1e9, dir = { x: 0, y: 0 }, rng = Math.random;
  var st = window.__bot = { dmgBoss: 0, firstBossT: null, log: [], minHp: 100, sampleT: 0, ticks: 0, deaths: 0, hurtsBy: {} };
  if (opts.godUntilBoss) G.god = true;
  var origUpd = G.Player.update;
  var origHurt = G.Player.hurt;
  G.Player.hurt = function (p, dmg, sx, sy, o) { var hp0 = p.hp, r = origHurt.call(G.Player, p, dmg, sx, sy, o); if (r && !G.god) { var k = (o && o.src) || '?'; st.hurtsBy[k] = (st.hurtsBy[k] || 0) + (hp0 - p.hp); st.log.push([Math.round(G.Boss.combatT / 100) / 10, k, Math.round(hp0 - p.hp), Math.round(p.hp), Math.round(p.x), Math.round(p.y), G.Boss.e ? Math.round(G.Boss.e.x) : 0, G.Boss.e ? Math.round(G.Boss.e.y) : 0, Math.round(G.Boss.inset||0)]); } return r; };
  function react(ref) { var t = seen.get(ref); if (t == null) { seen.set(ref, simT); return false; } return simT - t >= opts.react; }
  function dangerAt(x, y, pr, hz, zs, pj, tau) {
    var d = 0, i, h;
    for (i = 0; i < hz.length; i++) {
      h = hz[i]; if (!h.vis) continue;
      if (tau < h.t0 - 80 || tau > h.t1 + 40) continue;
      if (h.k === 'circle') { if (Math.hypot(x - h.x, y - h.y) < h.r + pr) d += 10; }
      else if (h.k === 'arc') {
        var dd = Math.hypot(x - h.x, y - h.y);
        if (dd <= h.r + pr && dd >= h.inner - 4 && Math.abs(G.angDiff(Math.atan2(y - h.y, x - h.x), h.a)) <= h.arc / 2 + 0.05) d += 10;
      } else if (h.k === 'lane') {
        var ca = Math.cos(h.a), sa = Math.sin(h.a), dx = x - h.x, dy = y - h.y, al = dx * ca + dy * sa, la = -dx * sa + dy * ca;
        if (al > -40 && al < h.len + 40 && Math.abs(la) < h.w / 2 + pr + 8) d += 10;
      } else if (h.k === 'band') {   // Marea de Letea: ola vertical de w px que cruza la arena; los huecos (gaps = y centrales, 100 px) son seguros
        var bx = h.x + h.dir * h.v * Math.max(0, tau - h.t0) / 1000;
        if (Math.abs(x - bx) < h.w / 2 + pr + 10) { var inGap = false; for (var gi = 0; gi < h.gaps.length; gi++) if (Math.abs(y - h.gaps[gi]) <= 44 - pr * 0.3) inGap = true; if (!inGap) d += 10; }
      } else if (h.k === 'flood') {   // Marea / Réquiem de Karceron: peligroso todo salvo el radio h.R alrededor de cada isla
        var safe = false; for (var ii = 0; ii < h.islands.length; ii++) if (Math.hypot(x - h.islands[ii][0], y - h.islands[ii][1]) <= h.R - 6) safe = true;
        if (!safe) d += 10;
      } else if (h.k === 'frame') {   // borde de lava (F2 de Karceron)
        if (x < h.m + 4 || x > G.AW - h.m - 4 || y < h.m + 4 || y > G.AH - h.m - 4) d += 4;
      } else if (h.k === 'wave') {
        var rr = h.r + h.v * Math.max(0, tau - h.t0) / 1000, dw = Math.hypot(x - h.x, y - h.y);
        if (Math.abs(dw - rr) < h.th / 2 + pr + 10) {
          var ang = Math.atan2(y - h.y, x - h.x), safe = false;
          for (var g = 0; g < h.gaps.length; g++) if (Math.abs(G.angDiff(ang, h.gaps[g].a)) <= h.gaps[g].w / 2 - 0.04) safe = true;
          if (!safe) d += 10;
        }
      }
    }
    for (i = 0; i < zs.length; i++) { var z = zs[i]; if (tau + 50 >= (z.arm || 0) && Math.hypot(x - z.x, y - z.y) < z.r + pr) d += z.arm > 0 ? 3 : 2; }
    for (i = 0; i < pj.length; i++) {
      var q = pj[i], qx = q.x + q.vx * tau / 1000, qy = q.y + q.vy * tau / 1000;
      if (Math.hypot(x - qx, y - qy) < q.r + pr + 6) d += 6;
    }
    return d;
  }
  function decide() {
    var p = G.player, e = G.Boss.e, B = G.Boss;
    var pr = p.r, spd = 190 * G.Cards.mods.speed * (p.slowT > 0 ? 1 - p.slowPct : 1);
    var blind = rng() < opts.inattn;   // lapso de atención: este paso ignora las telegrafías
    var hz = blind ? [] : B.hazards().map(function (h) { h.vis = react(h.ref || h); return h; });   // la reacción cuenta desde que se ve la telegrafía
    var zs = blind ? [] : G.zones.filter(function (z) { return z.team === 'e'; }).map(function (z) { return { x: z.x, y: z.y, r: z.r, arm: z.arm > 0 ? z.arm : 0 }; });
    var pj = blind ? [] : G.projectiles.filter(function (q) { return q.team === 'e'; });
    var best = null, bestC = 1e9, cand = [{ x: 0, y: 0 }], k, i;
    for (k = 0; k < 16; k++) cand.push({ x: Math.cos(k * Math.PI / 8), y: Math.sin(k * Math.PI / 8) });
    var hearts = G.gems.filter(function (g) { return g.kind === 'heart' || g.kind === 'part'; });
    for (i = 0; i < cand.length; i++) {
      var c = cand[i], cost = 0, dmax = 0;
      for (var tau = 0; tau <= opts.horizon; tau += 100) {
        var x = p.x + c.x * spd * tau / 1000, y = p.y + c.y * spd * tau / 1000;
        var m = G.WALL + pr; if (x < m || x > G.AW - m || y < m || y > G.AH - m) { x = G.clamp(x, m, G.AW - m); y = G.clamp(y, m, G.AH - m); cost += 0.4; }
        cost += dangerAt(x, y, pr, hz, zs, pj, tau) * (tau < 400 ? 2 : 1);
        if (B.obs) for (var o = 0; o < B.obs.length; o++) if (!B.obs[o].dead && Math.hypot(x - B.obs[o].x, y - B.obs[o].y) < B.obs[o].r + pr) cost += 1.5;
        if (e) for (var kk = 0; kk < B.briers.length; kk++) if (Math.hypot(x - B.briers[kk].x, y - B.briers[kk].y) < B.briers[kk].r) cost += 0.6;
      }
      var fx = p.x + c.x * spd * 0.6, fy = p.y + c.y * spd * 0.6;
      if (B.insetOn) { var mi = G.WALL + B.inset + 22; if (fx < mi || fx > G.AW - mi || fy < mi || fy > G.AH - mi) cost += 2; }
      // posicionamiento: orbitar al jefe a ~opts.dist (las cartas de proyectil alcanzan 440)
      if (e && !e.dead) {
        var db = Math.hypot(fx - e.x, fy - e.y);
        cost += Math.abs(db - opts.dist) / 120;
        if (db < 90) cost += 1.2;
      }
      // enemigos normales: no pegarse
      for (var n = 0; n < G.enemies.length; n++) { var en = G.enemies[n]; if (en.dead || en.type === 'boss' || en.type === 'bosspart' || en.spawnT > 0) continue; var dn = Math.hypot(fx - en.x, fy - en.y); if (dn < 70) cost += (70 - dn) / 35; }
      // recoger corazones / trofeos si no hay peligro
      if (hearts.length && p.hp < p.maxHp) { var hb = 1e9; hearts.forEach(function (g) { hb = Math.min(hb, Math.hypot(fx - g.x, fy - g.y)); }); cost += hb / 400 * (p.hp < p.maxHp * 0.7 ? 1.5 : 0.6); }
      else { var tr = G.gems.filter(function (g) { return g.trophy; }); if (tr.length) { var tb = 1e9; tr.forEach(function (g) { tb = Math.min(tb, Math.hypot(fx - g.x, fy - g.y)); }); cost += tb / 500; } }
      if (c.x === 0 && c.y === 0) cost += 0.25;
      if (cost < bestC) { bestC = cost; best = c; }
    }
    if (rng() < opts.mistakes && bestC < 5) { best = cand[1 + Math.floor(rng() * 16)]; }
    dir = best;
  }
  var lastP = 0;
  G.Player.update = function (p, dt) {
    simT += dt;
    var inp = G.input;
    if (G.state === 'play') {
      if (simT - lastDec >= opts.every) { lastDec = simT; try { decide(); } catch (err) { st.err = String(err.stack || err); } }
      inp.joy = { active: true, id: 1, ox: 0, oy: 0, x: dir.x, y: dir.y };
      if (opts.godUntilBoss) G.god = !(G.Boss.e && G.Boss.e.mode !== 'intro') ;
      if (G.Boss.e && st.firstBossT == null) { st.firstBossT = simT; p.hp = Math.min(p.maxHp, Math.round(opts.hp0 === 'rand' ? 60 + 40 * rng() : opts.hp0)); }
      st.minHp = Math.min(st.minHp, p.hp);
      if (opts.noLevel) { p.xp = 0; G.pendingLevels = 0; }
    }
    origUpd.call(G.Player, p, dt);
  };
  // elección de cartas: fusiona si puede; si no, ataques nuevos; si no, omite
  setInterval(function () {
    if (G.state !== 'cards' || !G.Cards.off) return;
    var O = G.Cards.off, C = G.Cards, i, best = -1, bs = -1;
    if (O.replacing) { var slot = 0, ww = 1e9; G.player.hand.forEach(function (s, k) { if (s) { var w = s.lvl * 10 + (C.def(s.id).type === 'attack' ? 5 : 0); if (w < ww) { ww = w; slot = k; } } }); C.replace(slot); return; }
    var full = C.count() >= 5;
    for (i = 0; i < O.cards.length; i++) {
      var id = O.cards[i], d = C.def(id), has = C.slotOf(id), sc = 0;
      if (has) sc = 100 + (d.type === 'attack' ? 20 : 0) - has.lvl;
      else if (!full) sc = d.type === 'attack' ? 50 : 20;
      else sc = d.type === 'attack' ? 5 : 0;
      if (O.mode === 'start') sc = d.type === 'attack' ? 50 : 0;
      if (sc > bs) { bs = sc; best = i; }
    }
    if (best >= 0 && (bs >= 20 || O.mode === 'start')) C.pick(best); else if (O.mode === 'level') C.skip(); else C.pick(0);
  }, 30);
};
