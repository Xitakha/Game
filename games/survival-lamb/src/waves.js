/* waves.js - Oleadas con presupuesto de amenaza, jefe cada 5 y ciclo entre oleadas. */
(function () {
  'use strict';
  var G = window.G, B = G.B, W = G.Waves = {};

  W.reset = function () {
    W.n = 0; W.phase = 'idle'; W.queue = []; W.t = 0; W.spawnT = 0; W.isBoss = false; W.bossT = 0; W.total = 0; W.lastBoss = false;
  };
  W.reset();

  // Construye la cola de enemigos con el presupuesto P(n)
  W.build = function (n) {
    var budget = B.budget(n), list = [], types = [];
    Object.keys(B.enemy).forEach(function (k) { if (k !== 'boss' && B.enemy[k].from <= n) types.push(k); });
    var warlocks = 0, maxWarlocks = Math.floor(budget / 8);
    while (true) {
      var opts = types.filter(function (k) { return B.enemy[k].cost <= budget && !(k === 'warlock' && warlocks >= maxWarlocks); });
      if (!opts.length) break;
      var tot = 0; opts.forEach(function (k) { tot += B.enemy[k].w; });
      var r = Math.random() * tot, pick = opts[0];
      for (var i = 0; i < opts.length; i++) { r -= B.enemy[opts[i]].w; if (r <= 0) { pick = opts[i]; break; } }
      list.push(pick); budget -= B.enemy[pick].cost; if (pick === 'warlock') warlocks++;
    }
    return list;
  };

  W.start = function (n) {
    W.n = n; W.phase = 'countdown'; W.t = n === 1 ? 1500 : 2000;
    W.isBoss = (n % 5 === 0);
    W.queue = W.isBoss ? ['boss'] : W.build(n);
    W.total = W.queue.length; W.spawnT = 0; W.bossT = 15000;
    G.Hud.banner(W.isBoss ? '¡JEFE!' : 'OLEADA ' + n, W.t, W.isBoss ? '#ff5a5a' : '#ffd27a');
    if (W.isBoss) { G.sfx('boss_roar'); try { Assets.music.setTrack('boss'); Assets.music.setIntensity(1); } catch (e) { /* audio */ } }
    else { G.sfx('wave_start'); try { Assets.music.setIntensity(Math.min(0.9, 0.2 + 0.09 * n)); } catch (e) { /* audio */ } }
  };

  W.remaining = function () { return W.queue.length + G.Enemies.aliveCount(); };

  function spawnPos() {
    var p = G.player, x, y, tries = 0, m = G.WALL + 40;
    do { x = G.rnd(m, G.AW - m); y = G.rnd(m, G.AH - m); tries++; } while (G.dist(x, y, p.x, p.y) < 220 && tries < 30);
    return [x, y];
  }

  W.update = function (dt) {
    if (W.phase === 'countdown') {
      W.t -= dt;
      if (W.t <= 0) W.phase = 'combat';
    } else if (W.phase === 'combat') {
      var alive = G.Enemies.aliveCount(), max = B.maxSim(W.n);
      // jefe: gusanos extra cada 15 s
      if (W.isBoss && G.Enemies.boss()) {
        W.bossT -= dt;
        if (W.bossT <= 0) { W.bossT = 15000; for (var k = 0; k < 2; k++) { var q = spawnPos(); G.Enemies.spawn('worm', q[0], q[1]); } }
      }
      if (W.queue.length) {
        W.spawnT -= dt;
        if (W.spawnT <= 0) {
          W.spawnT = 1200;
          var free = max - alive;
          while (free > 0 && W.queue.length) {
            var type = W.queue.shift(), pos = type === 'boss' ? [G.AW / 2, G.WALL + 120] : spawnPos();
            G.Enemies.spawn(type, pos[0], pos[1]); free--;
          }
        }
      } else if (alive === 0) {
        W.phase = 'clear'; W.t = 1500; W.lastBoss = W.isBoss;
        G.Hud.banner('Oleada superada', 1500, '#9dff9d');
        G.Player.heal(G.player, W.isBoss ? B.player.healBoss : B.player.healWave);
        G.sfx('pickup');
        if (W.isBoss) { try { Assets.music.setTrack('normal'); Assets.music.setIntensity(0.3); } catch (e) { /* audio */ } }
      }
    } else if (W.phase === 'clear') {
      W.t -= dt;
      if (W.t <= 0) { W.phase = 'cards'; G.state = 'cards'; G.Cards.open(W.lastBoss); }
    }
  };

  // Llamado por Cards tras elegir
  W.next = function () { W.start(W.n + 1); };
})();
