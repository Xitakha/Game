// BOT CON HIELO (P3, B.7 "calibración y bot"): capa SOBRE el bot de balance (bot_page.js). Intercepta G.input.joy (el bot base lo reasigna cada frame) y corrige la dirección con:
//  (1) modelo de movimiento con inercia: el jugador tarda tau = 220 ms en alcanzar el rumbo y derrapa 86 px al soltar, así que la esquiva se planifica con la posición PREDICHA (p + v / lambda * 0.5);
//  (2) esquiva de lo que avisa: flechas heladas (cierre de distancia en <= 0,9 s), lance del Lobo, embestida del Oso, picado del Murciélago, empellón del Yeti y erupción de la Estalagmita:
//      se sale del carril por el lado más corto con una latencia de reacción configurable (opts.react ms) y sin pisar estalagmitas;
//  (3) lectura del Frío: a partir del 55 % busca la hoguera / nieve firme más cercana (si hay una a < 380 px) y se queda dentro hasta bajar al 25 %.
// uso: window.installIceBot({ react: 200, cold: 1, dodge: 1 })  (después de installBalanceBot)
window.installIceBot = function (opts) {
  opts = Object.assign({ react: 200, cold: 1, dodge: 1 }, opts || {});
  var T = G.Tundra, cur = { active: false, id: null, ox: 0, oy: 0, x: 0, y: 0 }, warm = false, seen = {}, M = window.__ice = { dodges: 0, warmT: 0, frames: 0 };
  function laneDist(e, p) {   // distancia lateral al carril de un ataque lineal y posición a lo largo; null si no aplica
    var len, ang = e.ang, w = e.r + p.r + 14;
    if (e.type === 'frostwolf' && (e.st === 'howl' || e.st === 'lunge')) len = (e.len || 200) + 160;
    else if (e.type === 'boar' && e.fe && e.fe.bear && (e.st === 'wind' || e.st === 'charge' || e.st === 'slide')) { len = 480; w = 50; }
    else if (e.type === 'moth' && e.st === 'aim') len = (e.len || 240) + 20;
    else return null;
    var dx = p.x - e.x, dy = p.y - e.y, ca = Math.cos(ang), sa = Math.sin(ang), along = dx * ca + dy * sa, perp = -dx * sa + dy * ca;
    if (along < -20 || along > len || Math.abs(perp) > w + 30) return null;
    return { perp: perp, ca: ca, sa: sa, w: w };
  }
  function adjust(j) {
    var p = G.player, vx = j.x, vy = j.y, i, n = 0, e, q;
    M.frames++;
    var sp = Math.hypot(p.vx || 0, p.vy || 0), px = p.x + (p.vx || 0) * 0.25, py = p.y + (p.vy || 0) * 0.25;   // posición predicha 250 ms
    if (opts.dodge) {
      var ax = 0, ay = 0;
      for (i = 0; i < G.projectiles.length; i++) {   // flechas y esquirlas enemigas
        q = G.projectiles[i]; if (q.team !== 'e' || q.orb) continue;
        var rx = px - q.x, ry = py - q.y, v2 = q.vx * q.vx + q.vy * q.vy; if (v2 < 100) continue;
        var tt = (rx * q.vx + ry * q.vy) / v2; if (tt < 0 || tt > 1.1) continue;
        var cx = q.x + q.vx * tt - px, cy = q.y + q.vy * tt - py, d = Math.hypot(cx, cy);
        if (d < q.r + p.r + 22) { var nl = Math.hypot(q.vx, q.vy), nx = -q.vy / nl, ny = q.vx / nl, side = (cx * nx + cy * ny) > 0 ? -1 : 1; ax += nx * side * 2.2; ay += ny * side * 2.2; n++; }
      }
      for (i = 0; i < G.enemies.length; i++) {
        e = G.enemies[i]; if (e.dead || e.spawnT > 0) continue;
        var ld = laneDist(e, p);
        if (ld) { var side2 = ld.perp >= 0 ? 1 : -1; if (Math.abs(ld.perp) < 6) side2 = (p.x < G.AW / 2 ? 1 : -1); ax += -ld.sa * side2 * 2.6; ay += ld.ca * side2 * 2.6; n++; }
        else if (e.type === 'shield' && e.st === 'wind') { var dx2 = p.x - e.x, dy2 = p.y - e.y, dd = Math.hypot(dx2, dy2) || 1; if (dd < 120) { ax += dx2 / dd * 2.4; ay += dy2 / dd * 2.4; n++; } }
        else if (e.type === 'sower' && e.st === 'tele') { var dx3 = p.x - e.x, dy3 = p.y - e.y, d3 = Math.hypot(dx3, dy3) || 1; if (d3 < 75) { ax += dx3 / d3 * 2.4; ay += dy3 / d3 * 2.4; n++; } }
        else if (e.type === 'sower' && e.st === 'dormant') { var dx4 = p.x - e.x, dy4 = p.y - e.y, d4 = Math.hypot(dx4, dy4) || 1; if (d4 < 150) { ax += dx4 / d4 * 1.2; ay += dy4 / d4 * 1.2; } }   // no pasar cerca de las estalagmitas dormidas
        else if (e.type === 'frostwolf' && e.st === 'surround') { /* el bot base ya se aleja */ }
      }
      if (n) { M.dodges++; vx += ax; vy += ay; }
    }
    if (opts.cold) {
      var c = G.cold;
      if (!warm && c.v >= 55) warm = true; else if (warm && c.v <= 25) warm = false;
      if (warm) {
        var best = null, bd = 1e9;
        T.fires.forEach(function (f) { var d = Math.hypot(f.x - p.x, f.y - p.y); if (d < bd) { bd = d; best = f; } });
        if (best && bd < 380 && bd > 18) { var k = c.v >= 80 ? 1.6 : 0.9; vx += (best.x - p.x) / bd * k; vy += (best.y - p.y) / bd * k; M.warmT++; }
      }
    }
    var l = Math.hypot(vx, vy) || 1; if (l > 1) { vx /= l; vy /= l; }
    // estalagmitas: no empujar contra ellas
    T.pillars.forEach(function (o) { if (o.dead) return; var dx = p.x - o.x, dy = p.y - o.y, d = Math.hypot(dx, dy); if (d < 70 && d > 1) { var dot = vx * -dx / d + vy * -dy / d; if (dot > 0.3) { vx += dx / d * dot * 1.2; vy += dy / d * dot * 1.2; } } });
    l = Math.hypot(vx, vy) || 1; if (l > 1) { vx /= l; vy /= l; }
    return { active: j.active, id: j.id, ox: j.ox, oy: j.oy, x: vx, y: vy };
  }
  Object.defineProperty(G.input, 'joy', { configurable: true, get: function () { return cur; }, set: function (v) { cur = v && v.active && G.state === 'play' && T.on ? adjust(v) : v; } });
};
