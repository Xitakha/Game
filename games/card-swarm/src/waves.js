/* waves.js - Director de spawn continuo por presupuesto (sin oleadas) + aparición del jefe a los 5:00. */
(function () {
  'use strict';
  var G = window.G, B = G.B, W = G.Waves = {};

  W.reset = function () { W.t = 0; W.budget = 0; W.bossSpawned = false; W.bossWarn = false; };
  W.reset();

  // Posición en anillo fuera de cámara (cae dentro de la arena)
  function spawnPos() {
    var p = G.player, m = G.WALL + 30, x, y, tries = 0;
    do {
      var a = G.rnd(0, 6.283), r = G.rnd(500, 580);
      x = p.x + Math.cos(a) * r; y = p.y + Math.sin(a) * r * 0.8; tries++;
    } while ((x < m || x > G.AW - m || y < m || y > G.AH - m) && tries < 20);
    if (tries >= 20) {  // jugador cerca de una pared: cualquier punto lejano
      do { x = G.rnd(m, G.AW - m); y = G.rnd(m, G.AH - m); tries++; } while (G.dist(x, y, p.x, p.y) < 320 && tries < 60);
    }
    return [x, y];
  }

  function spawnBoss() {
    W.bossSpawned = true;
    var p = G.player, x = G.AW / 2, y = G.WALL + 120;
    if (G.dist(x, y, p.x, p.y) < 260) y = G.AH - G.WALL - 120;
    G.Enemies.spawn('boss', x, y);
    G.Hud.banner('¡JEFE: EL PASTOR CORRUPTO!', 2200, '#ff5a5a');
    G.sfx('boss_roar');
    try { Assets.music.setTrack('boss'); Assets.music.setIntensity(1); } catch (e) { /* audio */ }
  }

  W.update = function (dt) {
    var m = G.time / 60000, boss = G.Enemies.boss();
    if (!W.bossSpawned && G.time >= G.BOSS_T) spawnBoss();
    try { if (!W.bossSpawned) Assets.music.setIntensity(Math.min(0.9, 0.15 + 0.16 * m)); } catch (e) { /* audio */ }
    W.t += dt;
    if (W.t < 1500) return;
    W.t -= 1500;
    var bp = B.bp(m) * (boss ? 0.4 : 1);
    W.budget = Math.min(W.budget + bp, bp * 2.5);
    var cap = B.cap(m), alive = G.enemies.length;
    var types = [];
    Object.keys(B.enemy).forEach(function (k) { if (k !== 'boss' && B.enemy[k].from <= G.time) types.push(k); });
    var guard = 0;
    while (guard++ < 60 && alive < cap) {
      var opts = types.filter(function (k) { return B.enemy[k].cost <= W.budget; });
      if (!opts.length) break;
      var tot = 0; opts.forEach(function (k) { tot += B.enemy[k].w; });
      var r = Math.random() * tot, pick = opts[0];
      for (var i = 0; i < opts.length; i++) { r -= B.enemy[opts[i]].w; if (r <= 0) { pick = opts[i]; break; } }
      var pos = spawnPos();
      G.Enemies.spawn(pick, pos[0], pos[1]);
      W.budget -= B.enemy[pick].cost; alive++;
    }
  };
})();
