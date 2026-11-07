// Bot de balance (se inyecta en la página con ?dbg=1 &god=1). Kitea al enjambre, recoge gemas, elige cartas (fusiona primero)
// y registra por minuto REAL de la expedición: nivel, cartas Lv3, velocidad media de los enemigos normales, curación, partes.
window.installBalanceBot = function (opts) {
  opts = Object.assign({ pickGems: 1, noLevel: false, bossDist: 230 }, opts || {});
  var M = window.__m = { min: [], pick: 0, buildT: null, full5T: null, sp: {}, heal0: null, err: null, bossSeenT: null, elites: {}, fusedT: [] };
  var tr = 0, mvDir = { x: 0, y: 0 }, lastDec = -1e9, simT = 0, frame = 0;
  function mins() { return (G.time - G.t0) / 60000; }   // minutos reales de partida (G.time sigue corriendo durante el jefe)
  function lv3() { return G.player.hand.filter(function (s) { return s && s.lvl >= 3; }).length; }
  function lvSum() { return G.player.hand.reduce(function (a, s) { return a + (s ? s.lvl : 0); }, 0); }
  function snap(m) {
    var h = G.dbg && G.dbg.heal || {}, tot = 0; for (var k in h) if (k !== 'gem') tot += h[k];
    M.min.push({ m: m, lvl: G.player.level, lv3: lv3(), lvSum: lvSum(), cards: G.player.hand.filter(Boolean).length, picks: M.pick, kills: G.kills,
      healRaw: Math.round(tot * 10) / 10, healGem: Math.round((h.gem || 0) * 10) / 10, parts: G.Loot.run.total, ash: G.player.ash });
  }
  M.mini = {};   // TTK de los minijefes: spawn y muerte en minutos de partida
  var oSp = G.Enemies.spawn, oKi = G.Enemies.kill;
  G.Enemies.spawn = function (type, x, y, o) { var e = oSp.apply(G.Enemies, arguments); if (type === 'mini_bulwark' || type === 'mini_hive') M.mini[type] = { sp: +mins().toFixed(2), lv3: lv3(), lvSum: lvSum(), lvl: G.player.level, hand: G.player.hand.map(function (s) { return s ? s.id + s.lvl : '-'; }).join(',') }; return e; };
  G.Enemies.kill = function (e, silent, tag) { if ((e.type === 'mini_bulwark' || e.type === 'mini_hive') && M.mini[e.type] && !silent && !e.dead) { var m = M.mini[e.type]; m.die = +mins().toFixed(2); m.ttk = Math.round((m.die - m.sp) * 60); m.broke = e.shieldBroken || e.sacBroken || false; m.enraged = !!e.enraged; } return oKi.apply(G.Enemies, arguments); };
  var origPick = G.Cards.pick;
  var origUpd = G.Player.update, origEU = G.Enemies.update;
  G.Enemies.update = function (dt) {
    origEU.call(G.Enemies, dt);
    if (++frame % 6) return;
    var mn = Math.floor(mins()), S = M.sp[mn] || (M.sp[mn] = { n: 0, r: 0, a: 0 });
    for (var i = 0; i < G.enemies.length; i++) {
      var e = G.enemies[i], d = G.B.enemy[e.type];
      if (e.dead || e.partOf || e.type === 'boss' || d.elite || e.spawnT > 0 || e.summoned) continue;
      var f = e.slowT > 0 ? 1 - e.slowPct : 1;
      S.n++; S.r += e.spd / f / d.spd; S.a += e.spd / f;
    }
  };
  function decide() {
    var p = G.player, best = { x: 0, y: 0 }, vx = 0, vy = 0, boss = G.Enemies.boss(), i;
    for (i = 0; i < G.enemies.length; i++) {
      var e = G.enemies[i]; if (e.dead || e.partOf || e.spawnT > 0) continue;
      var dx = p.x - e.x, dy = p.y - e.y, d = Math.hypot(dx, dy) || 1;
      if (e.type === 'boss') { var want = opts.bossDist, k = (d - want) / 200; vx -= dx / d * k * 2; vy -= dy / d * k * 2; vx += -dy / d * 0.6; vy += dx / d * 0.6; continue; }
      var R = e.big ? 170 : 120;
      if (d < R) { var w = (R - d) / R; w = w * w * 3; vx += dx / d * w; vy += dy / d * w; }
    }
    // gemas
    if (opts.pickGems) {
      var bd = 1e9, bg = null;
      for (i = 0; i < G.gems.length; i++) { var g = G.gems[i], gd = Math.hypot(g.x - p.x, g.y - p.y); var pr = (g.kind === 'part' || g.kind === 'xp') ? 0.7 : 1; if (gd * pr < bd && gd < 320) { bd = gd * pr; bg = g; } }
      if (bg) { var gx = bg.x - p.x, gy = bg.y - p.y, gl = Math.hypot(gx, gy) || 1; vx += gx / gl * 0.9; vy += gy / gl * 0.9; }
    }
    var m = G.WALL + 90;   // paredes
    if (p.x < m) vx += (m - p.x) / 60; if (p.x > G.AW - m) vx -= (p.x - (G.AW - m)) / 60;
    if (p.y < m) vy += (m - p.y) / 60; if (p.y > G.AH - m) vy -= (p.y - (G.AH - m)) / 60;
    // empuje suave hacia el centro + giro para no quedarse en una esquina
    vx += (G.AW / 2 - p.x) / 3000; vy += (G.AH / 2 - p.y) / 3000; tr += 0.01; vx += Math.cos(tr) * 0.12; vy += Math.sin(tr) * 0.12;
    var l = Math.hypot(vx, vy) || 1; mvDir = { x: vx / l, y: vy / l };
  }
  G.Player.update = function (p, dt) {
    simT += dt;
    if (G.state === 'play') {
      if (simT - lastDec >= 120) { lastDec = simT; try { decide(); } catch (err) { M.err = String(err.stack || err); } }
      G.input.joy = { active: true, id: 1, ox: 0, oy: 0, x: mvDir.x, y: mvDir.y };
      if (opts.noLevel) { p.xp = 0; G.pendingLevels = 0; }
      if (opts.hpBoost && p.hp < opts.hpBoost * 0.5) { p.maxHp = p.hp = opts.hpBoost; }   // jugador casi inmortal pero SIN god: Player.hurt sí cuenta el daño por fuente
      var mm = mins();
      if (M.min.length <= Math.floor(mm) && Math.floor(mm) > 0 || (M.min.length === 0 && mm >= 0)) { if (M.min.length === 0) snap(0); else snap(M.min.length); }
      if (M.buildT == null && lvSum() >= 13 && G.player.hand.filter(Boolean).length === 5) M.buildT = Math.round(mm * 100) / 100;
      if (M.full5T == null && lv3() >= 5) M.full5T = Math.round(mm * 100) / 100;
      if (G.Boss.e && M.bossSeenT == null) M.bossSeenT = Math.round(mm * 100) / 100;
    }
    origUpd.call(G.Player, p, dt);
  };
  setInterval(function () { if (G.state !== 'play' && G.input.joy && G.input.joy.active) G.input.joy = { active: false, id: null, ox: 0, oy: 0, x: 0, y: 0 }; }, 40);   // sin joystick fantasma fuera de la expedición (aldea)
  setInterval(function () {
    if (G.state !== 'cards' || !G.Cards.off) return;
    var O = G.Cards.off, C = G.Cards, i, best = -1, bs = -1;
    if (O.replacing) { var slot = 0, ww = 1e9; G.player.hand.forEach(function (s, k) { if (s) { var w = s.lvl * 10 + (C.def(s.id).type === 'attack' ? 5 : 0); if (w < ww) { ww = w; slot = k; } } }); C.replace(slot); return; }
    var full = C.count() >= 5;
    for (i = 0; i < O.cards.length; i++) {
      var id = O.cards[i], d = C.def(id), has = C.slotOf(id), sc = 0;
      if (has) sc = 100 + (d.type === 'attack' ? 20 : 0) - has.lvl;
      else if (!full) sc = d.type === 'attack' ? 50 : 20;
      else sc = 0;
      if (O.mode === 'start') sc = d.type === 'attack' ? 50 : 0;
      if (sc > bs) { bs = sc; best = i; }
    }
    if (best >= 0 && (bs >= 20 || O.mode === 'start')) { M.pick++; C.pick(best); } else if (O.mode === 'level') C.skip(); else { M.pick++; C.pick(0); }
  }, 25);
};
// Simulador de compras sobre el guardado actual (tras endRun): cuántas cartas / talentos puede pagar con el botín de UNA run, "lo más barato primero".
window.craftSim = function () {
  var L = G.Loot, T = G.Tree, S0 = JSON.stringify(G.Save.data), out = { cards: 0, talents: 0, cardIds: [], nodeIds: [] }, g, guard;
  function cheapestCard() {
    var best = null, bc = 1e9;
    G.Cards.defs.forEach(function (d) {
      if (!d.id || !L.classic(d.id) || !L.canForge(d.id)) return;
      var r = L.recipe(d.id, L.nextRank(d.id)), c = r.brasas / 40; for (var k in r.parts) c += r.parts[k];
      if (c < bc) { bc = c; best = d.id; }
    });
    return best;
  }
  for (guard = 0; guard < 40; guard++) { var id = cheapestCard(); if (!id) break; var nr = L.nextRank(id); L.forge(id); out.cards++; out.cardIds.push(id + nr); }
  G.Save.data = JSON.parse(S0); T.sync();
  for (guard = 0; guard < 40; guard++) {
    var bn = null, bc2 = 1e9;
    T.NODES.forEach(function (n) {
      if (n.type === 'root' || T.status(n) !== 'avail' || T.afford(n)) return;
      var c = T.cost(n), t = c.pf * 10 + c.brasas / 20; for (var k in c.parts) t += c.parts[k];
      if (t < bc2) { bc2 = t; bn = n; }
    });
    if (!bn) break;
    var r2 = T.buy(bn.id, 'A'); if (!r2.ok) break; out.talents++; out.nodeIds.push(bn.id);
  }
  G.Save.data = JSON.parse(S0); T.sync();
  return out;
};
