/* panal.js - PANAL (DESIGN-v5-biomas.md B.4, fase P5): el mundo de cera, miel y humo. Todo lo que solo existe en el Panal vive aquí y se activa con G.Panal.on (bioma 'panal');
   en los demás biomas nada de esto se ejecuta (los ganchos de main/player/enemies/combat/weapons/waves comprueban G.Panal.on).
   - ARENA HEXAGONAL (B.4.1): hexágono plano de vértices (180,0) (1260,0) (1440,405) (1260,810) (180,810) (0,405) dentro de la arena 1440 x 810. Los 4 muros diagonales son semiplanos de colisión
     (jugador y enemigos no los cruzan, los proyectiles mueren al tocarlos). Suelo de ~150 celdas de cera (radio 48) prerrenderizado una vez. 4 pilares de cera (r 28, 300 HP, bloquean proyectiles,
     se reconstruyen a los 40 s) y 6 nidos fijos en anillo de r 330 (de ellos salen las Larvas explosivas del director).
   - CELDAS que se abren y se cierran (B.4.2): cera -> aviso 1100 ms (contorno marrón punteado que se llena de ámbar) -> abierta 600 ms (sin efecto) -> MIEL 10 s -> sellado con fundido de 1 s.
     Miel: ralentiza 45 % al jugador y 35 % a los terrestres (los voladores y la Babosa, no); no apila con otras ralentizaciones. Invariantes (los valida G.Panal.validate()): <= 24 celdas de miel a la vez
     (36 en F3, x1,5 en Peligro IV: G.Panal.setCap), >= 55 % de la arena libre de miel y siempre un camino sin miel hasta cualquier punto. Contrajuego: un impacto de FUEGO sobre una celda de miel la carameliza
     y sella al instante (máx. 2 por segundo). Los charcos libres (Larva explosiva r 36 / 5 s, Babosa r 34 / 6 s y rastro r 26) ralentizan igual y también se carameliza con Fuego.
   - HUMO (B.4.3): cada impacto de Fuego sobre un monstruo del Panal o sobre una celda crea una nube (r 36, 1,8 s, gris cálido, máx. 6). Los insectos dentro quedan SEDADOS: -40 % de velocidad, no atacan
     (enemies_panal.js pausa sus temporizadores y aborta los avisos), no reciben la cura del Polinizador.
   - Cura de aliados del Polinizador (HoT: 20 % del HP máx. en 2 s, 1 % por pulso a los minijefes), globos de miel de la Babosa, polen / tinte / rayos de luz ambientales y zumbido.
   Parámetros de URL: ?biome=panal  &nobos=1 (sin jefa: el Panal no tiene a Melaria hasta la P6, así que es el comportamiento hasta entonces)  &env=0 (sin celdas del entorno)  &honey=0 (sin ralentización). */
(function () {
  'use strict';
  var G = window.G, B = G.B, P = G.Panal = { on: false };

  function qnum(name, def) { var m = new RegExp('[?&]' + name + '=([\\d.]+)').exec(location.search); return m ? parseFloat(m[1]) : def; }
  var SQ3 = Math.sqrt(3), TAU = 6.2832;

  // ================================================================= DATOS (B.4; todo ajustable aquí)
  B.biomes = B.biomes || {};
  var D = B.biomes.panal = {
    verts: [[180, 0], [1260, 0], [1440, 405], [1260, 810], [180, 810], [0, 405]],   // hexágono plano (~75 % del área)
    wallD: 28,                                      // distancia mínima del centro de un cuerpo al muro diagonal (+ su radio): igual que G.WALL en los lados rectos
    cellR: 48, origin: [720, 405],                  // celdas de cera de radio 48; la celda (0,0) está en el centro de la arena
    pillars: [[480, 300], [960, 300], [480, 510], [960, 510]], pillarR: 28, pillarHp: 300, pillarRegrow: 40000,
    nestRing: 330, nests: 6,
    honey: { player: 0.45, enemy: 0.35, life: 10000, tele: 1100, arm: 600, seal: 1000, cap: 24, freeMin: 0.55, caramelPerSec: 2, caramel: 450 },
    smoke: { r: 36, life: 1800, max: 6, sedSpd: 0.6 },
    puddleMax: 28,
    heal: { pct: 0.2, ms: 2000, r: 120, mini: 0.01 },
    env: { first: 25000, every: [16000, 26000], minEvery: 9000, n: [1, 3], dist: [150, 380] }
  };
  var CR = D.cellR, OX = D.origin[0], OY = D.origin[1], WD = D.wallD;

  // ================================================================= GEOMETRÍA: semiplanos de los 4 muros diagonales
  var HP = [];
  [[1, 2], [2, 3], [4, 5], [5, 0]].forEach(function (e) {
    var a = D.verts[e[0]], b = D.verts[e[1]], dx = b[0] - a[0], dy = b[1] - a[1], l = Math.hypot(dx, dy), nx = dy / l, ny = -dx / l;
    if ((OX - a[0]) * nx + (OY - a[1]) * ny < 0) { nx = -nx; ny = -ny; }   // normal hacia el interior
    HP.push({ ax: a[0], ay: a[1], nx: nx, ny: ny });
  });
  P.walls = HP;
  // distancia con signo al muro diagonal más cercano (> 0 dentro)
  P.wallDist = function (x, y) {
    var m = 1e9, i, d;
    for (i = 0; i < 4; i++) { d = (x - HP[i].ax) * HP[i].nx + (y - HP[i].ay) * HP[i].ny; if (d < m) m = d; }
    return m;
  };
  // ¿Dentro del hexágono con margen m (px, ya contando el muro)? Incluye los lados rectos (G.WALL)
  P.inside = function (x, y, m) {
    m = m || 0;
    return x >= G.WALL + m && x <= G.AW - G.WALL - m && y >= G.WALL + m && y <= G.AH - G.WALL - m && P.wallDist(x, y) >= WD + m;
  };
  // Proyectiles: mueren al tocar un muro diagonal (el rectángulo ya lo comprueba cada módulo)
  P.outside = function (x, y) { return P.wallDist(x, y) < 6; };
  // Empuja un cuerpo (con .x .y) hacia dentro de los muros diagonales; true si lo movió
  P.pushIn = function (o, r) {
    var moved = false, i, d, need;
    for (i = 0; i < 4; i++) {
      d = (o.x - HP[i].ax) * HP[i].nx + (o.y - HP[i].ay) * HP[i].ny; need = WD + (r || 0);
      if (d < need) { o.x += HP[i].nx * (need - d); o.y += HP[i].ny * (need - d); moved = true; }
    }
    return moved;
  };
  // Punto corregido [x, y] dentro del hexágono (lo usan los minijefes para sus puntos de ataque)
  P.clampPt = function (x, y, m) {
    var o = { x: G.clamp(x, G.WALL + m, G.AW - G.WALL - m), y: G.clamp(y, G.WALL + m, G.AH - G.WALL - m) };
    P.pushIn(o, m); o.x = G.clamp(o.x, G.WALL + m, G.AW - G.WALL - m); o.y = G.clamp(o.y, G.WALL + m, G.AH - G.WALL - m);
    return [o.x, o.y];
  };
  P.hexArea = function () { var s = 0, v = D.verts, i; for (i = 0; i < 6; i++) { var a = v[i], b = v[(i + 1) % 6]; s += a[0] * b[1] - b[0] * a[1]; } return Math.abs(s) / 2; };

  // ================================================================= CELDAS (rejilla hexagonal plana, coordenadas axiales q, r)
  // x = OX + CR * 1,5 q ; y = OY + CR * sqrt(3) * (r + q / 2)
  var cells = [], byKey = {}, nests = [], act = [];
  function key(q, r) { return (q + 24) * 100 + (r + 24); }
  function buildCells() {
    var q, r, x, y, c;
    for (q = -14; q <= 14; q++) for (r = -14; r <= 14; r++) {
      x = OX + CR * 1.5 * q; y = OY + CR * SQ3 * (r + q / 2);
      if (!P.inside(x, y, 22) || P.wallDist(x, y) < WD + 22) continue;
      c = { i: cells.length, q: q, r: r, x: x, y: y, st: 0, t: 0, nest: false, life: 0, nb: [], hatch: 0 };
      cells.push(c); byKey[key(q, r)] = c;
    }
    var dirs = [[1, 0], [1, -1], [0, -1], [-1, 0], [-1, 1], [0, 1]];
    cells.forEach(function (c2) { dirs.forEach(function (d) { var n = byKey[key(c2.q + d[0], c2.r + d[1])]; if (n) c2.nb.push(n); }); });
    // nidos: 6 celdas fijas en anillo de r 330 alrededor del centro
    for (var k = 0; k < D.nests; k++) {
      var a = k * TAU / D.nests, nx = OX + Math.cos(a) * D.nestRing, ny = OY + Math.sin(a) * D.nestRing, best = null, bd = 1e9;
      cells.forEach(function (c3) { var dd = Math.hypot(c3.x - nx, c3.y - ny); if (dd < bd && !c3.nest) { bd = dd; best = c3; } });
      if (best) { best.nest = true; nests.push(best); }
    }
  }
  function cellAt(x, y) {
    var px = x - OX, py = y - OY, qf = 2 / 3 * px / CR, rf = (-px / 3 + SQ3 / 3 * py) / CR, yf = -qf - rf;
    var rx = Math.round(qf), ry = Math.round(yf), rz = Math.round(rf), dx = Math.abs(rx - qf), dy = Math.abs(ry - yf), dz = Math.abs(rz - rf);
    if (dx > dy && dx > dz) rx = -ry - rz; else if (dy > dz) ry = -rx - rz; else rz = -rx - ry;
    return byKey[key(rx, rz)] || null;
  }
  P.cells = cells; P.nests = nests; P.cellAt = cellAt;
  buildCells();

  // estados de celda: 0 cera | 1 aviso (tele) | 2 abierta sin efecto (arm) | 3 MIEL | 4 sellando (fundido) | 5 caramelo
  var ST_WAX = 0, ST_TELE = 1, ST_ARM = 2, ST_HONEY = 3, ST_SEAL = 4, ST_CARAMEL = 5;
  var dirty = true, honeyCv = null, honeyG = null, capBase = D.honey.cap, capMul = 1, envOn = true, honeyOn = true, caramelLog = [];

  P.maxHoney = function () { return Math.round(capBase * capMul); };
  P.setCap = function (n, mul) { if (n != null) capBase = n; if (mul != null) capMul = mul; };   // F3 36, Peligro IV x1,5 (P6)
  P.honeyCount = function () { return act.length; };
  P.activeCells = function () { return act; };
  function addAct(c) { if (act.indexOf(c) < 0) act.push(c); }
  function dropAct(c) { var i = act.indexOf(c); if (i >= 0) act.splice(i, 1); }

  // ¿Quedan todos los caminos? Cada celda de cera / nido debe seguir conectada con la del jugador por celdas sin miel. block = celda que se piensa abrir.
  function connectedWithout(block, extra) {
    var p = G.player, start = cellAt(p.x, p.y), i, c, n, seen = {}, q, cnt = 0, open = 0;
    function free(c2) { return c2 !== block && (extra ? extra.indexOf(c2) < 0 : true) && (c2.st === ST_WAX || c2.nest); }
    for (i = 0; i < cells.length; i++) if (free(cells[i])) open++;
    if (!start || !free(start)) {   // el jugador está sobre miel / fuera: parte de la celda libre más cercana
      var bd = 1e9; start = null;
      for (i = 0; i < cells.length; i++) { c = cells[i]; if (!free(c)) continue; var dd = Math.hypot(c.x - p.x, c.y - p.y); if (dd < bd) { bd = dd; start = c; } }
      if (!start) return false;
    }
    q = [start]; seen[start.i] = 1; cnt = 1;
    while (q.length) { c = q.pop(); for (i = 0; i < c.nb.length; i++) { n = c.nb[i]; if (!seen[n.i] && free(n)) { seen[n.i] = 1; cnt++; q.push(n); } } }
    return cnt === open;
  }
  // Abre una celda (aviso de 1000-1200 ms). Devuelve true si la abrió: respeta el tope, el 55 % de arena libre y la conexión
  P.openCell = function (c, o) {
    o = o || {};
    if (!P.on || !c || c.nest || c.st !== ST_WAX) return false;
    if (act.length >= P.maxHoney()) return false;
    var area = 2.598 * CR * CR;
    if ((act.length + 1) * area > (1 - D.honey.freeMin) * P.hexArea()) return false;
    if (!connectedWithout(c)) return false;
    c.st = ST_TELE; c.t = o.tele || D.honey.tele; c.life = o.life || D.honey.life; c.src = o.src || 'env'; addAct(c);
    pSfx('cell_open', null, { vol: 0.5, pitch: 0.9 });
    return true;
  };
  // Abre la celda que cubre (x, y) y hasta n - 1 vecinas de cera. Devuelve cuántas abrió
  P.openHoney = function (x, y, n, o) {
    var c = cellAt(x, y), k = 0, i, list;
    if (!c) return 0;
    if (P.openCell(c, o)) k++;
    list = c.nb.slice(); for (i = list.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)), t = list[i]; list[i] = list[j]; list[j] = t; }
    for (i = 0; i < list.length && k < (n || 1); i++) if (P.openCell(list[i], o)) k++;
    return k;
  };
  P.sealCell = function (c) { if (c.st === ST_HONEY || c.st === ST_ARM || c.st === ST_TELE) { c.st = ST_SEAL; c.t = D.honey.seal; dirty = true; } };

  // Carameliza (Fuego): sella al instante la celda de miel que cubre (x, y) y los charcos cuyo borde toque el punto. Máx. 2 por segundo.
  function caramelBudget() {
    var now = G.time; while (caramelLog.length && now - caramelLog[0] > 1000) caramelLog.shift();
    return caramelLog.length < D.honey.caramelPerSec;
  }
  P.caramelize = function (x, y, r) {
    var did = false, c = cellAt(x, y), i;
    if (c && (c.st === ST_HONEY || c.st === ST_ARM) && caramelBudget()) {
      c.st = ST_CARAMEL; c.t = D.honey.caramel; dirty = true; caramelLog.push(G.time); did = true;
      G.fx.burst(c.x, c.y, 6, '#e8a53a', 120, 380, 3, { add: true }); pSfx('smoke_hiss', null, { vol: 0.5 });
      P.smoke(c.x, c.y);
    }
    for (i = puddles.length - 1; i >= 0 && !did; i--) {
      var q = puddles[i];
      if (Math.hypot(q.x - x, q.y - y) <= q.r + (r || 0) && caramelBudget()) { caramelLog.push(G.time); q.life = Math.min(q.life, 300); G.fx.burst(q.x, q.y, 5, '#e8a53a', 100, 350, 3, { add: true }); P.smoke(q.x, q.y); did = true; }
    }
    return did;
  };
  // Impacto de Fuego en (x, y): carameliza la miel bajo el impacto y, si golpeó a un insecto / minijefe del Panal, levanta humo
  P.fireHit = function (x, y, e) {
    if (e && ((e.fe && e.fe.insect) || (e.mini && e.D && e.D.sedable))) P.smoke(x, y);
    P.caramelize(x, y, 6);
  };
  P.fireArea = function (x, y, r) {
    if (!(r > 0)) return;
    var i, c;
    for (i = 0; i < act.length; i++) { c = act[i]; if (c.st !== ST_HONEY && c.st !== ST_ARM) continue; if (Math.hypot(c.x - x, c.y - y) <= r + CR * 0.7) { if (!P.caramelize(c.x, c.y, 0)) break; } }
    for (i = 0; i < puddles.length; i++) if (Math.hypot(puddles[i].x - x, puddles[i].y - y) <= r + puddles[i].r) { if (!P.caramelize(puddles[i].x, puddles[i].y, 0)) break; }
  };

  // ================================================================= CHARCOS LIBRES de miel (Larva explosiva, Babosa, Reina Joven)
  var puddles = [];
  P.puddles = puddles;
  P.puddle = function (x, y, r, ms, o) {
    if (!P.on) return null;
    var m = P.clampPt(x, y, 4);
    if (puddles.length >= D.puddleMax) puddles.shift();
    var q = { x: m[0], y: m[1], r: r, life: ms, max: ms, t: 0, owner: (o && o.owner) || null, ph: Math.random() * 6 };
    puddles.push(q); return q;
  };

  // ¿Hay miel activa bajo (x, y)? (celda de miel o charco)
  P.honeyAt = function (x, y) {
    var c = cellAt(x, y), i;
    if (c && c.st === ST_HONEY) return true;
    for (i = 0; i < puddles.length; i++) { var q = puddles[i]; if (q.life > 250 && (x - q.x) * (x - q.x) + (y - q.y) * (y - q.y) <= q.r * q.r) return true; }
    return false;
  };
  // Multiplicador de velocidad de un enemigo por la miel (1 = nada). Voladores y Babosa: inmunes
  P.enemySlow = function (e) {
    if (!honeyOn || e.fly || e.honeyImmune || e.big && e.mini && e.fly) return 1;
    return P.honeyAt(e.x, e.y) ? 1 - D.honey.enemy : 1;
  };

  // ================================================================= HUMO (B.4.3)
  var clouds = [];
  P.clouds = clouds;
  P.smoke = function (x, y) {
    if (!P.on) return;
    var S = D.smoke, tf = G.Tree && G.Tree.fx || {}, life = S.life * (tf.ahumador ? 1.4 : 1), r = S.r * (tf.ahumador ? 50 / 36 : 1), i, q;
    for (i = 0; i < clouds.length; i++) { q = clouds[i]; if (Math.hypot(q.x - x, q.y - y) < 22) { q.life = life; q.max = life; return; } }   // un impacto sobre una nube existente la refresca (no se apila)
    if (clouds.length >= S.max) clouds.shift();
    clouds.push({ x: x, y: y, r: r, life: life, max: life, ph: Math.random() * 6 });
    pSfx('smoke_hiss', null, { vol: 0.35 });
  };
  P.inSmoke = function (x, y, pad) {
    for (var i = 0; i < clouds.length; i++) { var q = clouds[i]; if (Math.hypot(q.x - x, q.y - y) <= q.r + (pad || 0)) return true; }
    return false;
  };
  // ¿Está sedado este insecto? (dentro de una nube de humo)
  P.sedated = function (e) { return !!(e.fe && e.fe.insect) && clouds.length > 0 && P.inSmoke(e.x, e.y, e.r * 0.4); };

  // ================================================================= CURA DEL POLINIZADOR (HoT)
  // Pulso: los aliados en r 120 reciben un 20 % de su HP máx. repartido en 2 s (minijefes: 1 % de su HP máx.). No apila: refresca. src no se cura a sí mismo.
  P.healPulse = function (src, x, y) {
    var H = D.heal, n = 0;
    for (var i = 0; i < G.enemies.length; i++) {
      var e = G.enemies[i]; if (e.dead || e === src || e.spawnT > 0 || e.type === 'boss' || e.hp >= e.maxHp || e.partOf || e.isPod) continue;
      if (Math.hypot(e.x - x, e.y - y) > H.r + e.r * 0.5) continue;
      var amt = e.maxHp * (e.mini ? H.mini : H.pct);
      e.hot = { left: H.ms, rate: Math.max(e.hot ? e.hot.rate : 0, amt / H.ms), acc: e.hot ? e.hot.acc : 0, shown: e.hot ? e.hot.shown : 0 };
      n++;
    }
    return n;
  };
  function tickHot(e, dt) {
    var h = e.hot; if (!h) return;
    if (e.dead || e.hp >= e.maxHp) { e.hot = null; return; }
    if (e.fe && e.fe.insect && P.sedated(e)) return;                   // sedado: la cura se pausa
    var g = Math.min(dt, h.left) * h.rate; e.hp = Math.min(e.maxHp, e.hp + g); h.left -= dt; h.acc += g;
    if (h.acc >= 3 && G.time - h.shown > 700) { G.fx.num(e.x, e.y - e.r - 12, '+' + Math.round(h.acc), '#b8ff9a', false, { size: 12 }); h.acc = 0; h.shown = G.time; }
    if (h.left <= 0) e.hot = null;
  }

  // ================================================================= GLÓBULOS de miel (Babosa): vuelan hacia donde estaba el jugador y dejan un charco
  var globs = [];
  P.globs = globs;
  P.spitGlob = function (src, tx, ty, o) {
    o = o || {};
    var d = Math.hypot(tx - src.x, ty - src.y), dur = G.clamp(d / 140 * 1000, 600, 2000);
    globs.push({ x0: src.x, y0: src.y - 6, tx: tx, ty: ty, t: 0, dur: dur, r: o.r || 34, dmg: src.dmg, life: o.life || 6000, src: src, tele: 500 });
    pSfx('honey_squelch', null, { vol: 0.5 });
  };
  function landGlob(g) {
    var p = G.player;
    G.fx.ring(g.tx, g.ty, 4, g.r + 6, 260, '#c97a14', 4); G.fx.burst(g.tx, g.ty, 8, '#c97a14', 130, 420, 3);
    if (!p.dead && G.dist(g.tx, g.ty, p.x, p.y) <= g.r + p.r * 0.5) G.Player.hurt(p, 3, g.tx, g.ty, { src: 'honeyslug', soft: true });
    P.puddle(g.tx, g.ty, g.r, g.life, { owner: g.src });
    pSfx('honey_drip', null, { vol: 0.5 });
  }

  // ================================================================= PILARES de cera (obstáculos de 300 HP)
  var pillars = [];
  P.pillars = pillars;
  function pillarsReset() { pillars.length = 0; D.pillars.forEach(function (q, i) { pillars.push({ x: q[0], y: q[1], r: D.pillarR, hp: D.pillarHp, max: D.pillarHp, dead: false, t: 0, shake: 0, i: i }); }); }
  pillarsReset();
  // Colisión con cuerpos terrestres (el jugador y los enemigos que no vuelan)
  P.collide = function (who, r) {
    for (var i = 0; i < pillars.length; i++) {
      var o = pillars[i]; if (o.dead) continue;
      var dx = who.x - o.x, dy = who.y - o.y, d = Math.hypot(dx, dy), min = o.r + r;
      if (d < min) { if (d < 0.01) { dx = 1; dy = 0; d = 1; } who.x = o.x + dx / d * min; who.y = o.y + dy / d * min; }
    }
  };
  P.pillarAt = function (x, y, r) { for (var i = 0; i < pillars.length; i++) { var o = pillars[i]; if (!o.dead && Math.hypot(o.x - x, o.y - y) < o.r + r) return o; } return null; };
  // Los proyectiles enemigos mueren al tocar un pilar
  P.blocks = function (x, y, r) { var o = P.pillarAt(x, y, r * 0.5); if (o) { o.shake = 120; return true; } return false; };
  P.breakPillar = function (i) {
    var o = pillars[i]; if (!o || o.dead) return;
    o.dead = true; o.t = 0; G.fx.burst(o.x, o.y, 14, '#f0d98a', 220, 600, 4, { g: 260 }); G.fx.ring(o.x, o.y, 10, 60, 300, '#c9a850', 4); pSfx('wax_shield_hit', 'hit_heavy', { vol: 0.7 });
  };
  P.hitPillar = function (i, dmg) { var o = pillars[i]; if (!o || o.dead) return; o.hp -= dmg; o.shake = 140; if (o.hp <= 0) P.breakPillar(i); };

  // ================================================================= NIDOS: de ellos sale la Larva explosiva que pide el director
  var nestUse = 0;
  // Elige el nido más cercano a `pos` que esté a >= 200 px del jugador y descansado; null si ninguno
  P.nestFor = function (pos) {
    var p = G.player, best = null, bd = 1e9, i, n, d;
    for (i = 0; i < nests.length; i++) {
      n = nests[i]; if (G.time - (n.lastUse || -1e9) < 3000 || Math.hypot(n.x - p.x, n.y - p.y) < 200) continue;
      d = Math.hypot(n.x - pos[0], n.y - pos[1]); if (d < bd) { bd = d; best = n; }
    }
    return best;
  };
  P.spawnLarva = function (pos) {
    var n = P.nestFor(pos), E = G.Enemies, e;
    if (!n) return E.spawn('bomb', pos[0], pos[1]);
    n.lastUse = G.time; n.hatch = 900; e = E.spawn('bomb', n.x, n.y, { spawnT: 900 }); e.fromNest = true;
    pSfx('cell_open', null, { vol: 0.45, pitch: 1.2 });
    return e;
  };

  // ================================================================= ESTADO / CICLO DE VIDA
  var hum = { t: 0, lvl: -1 }, envT = 0, nobosEnded = false;
  P.opts = { env: true };
  P.nobos = false;
  P.begin = function (biome) {
    P.on = biome === 'panal'; nobosEnded = false; P.nobos = false;
    cells.forEach(function (c) { c.st = ST_WAX; c.t = 0; c.hatch = 0; c.lastUse = -1e9; });
    act.length = 0; puddles.length = 0; clouds.length = 0; globs.length = 0; caramelLog.length = 0; dirty = true; pillarsReset(); capBase = D.honey.cap; capMul = 1;
    if (!P.on) return;
    envOn = qnum('env', 1) > 0; honeyOn = qnum('honey', 1) > 0; envT = D.env.first;
    P.nobos = qnum('nobos', 0) > 0 || (!G.bossUrl && !(G.Boss.DEFS && G.Boss.DEFS.melaria));   // sin Melaria hasta la P6
    hum.t = 0; hum.lvl = -1;
  };
  P.end = function () { try { if (Assets.hum) Assets.hum(0); } catch (e) { /* sin audio */ } };
  P.noBoss = function () { return P.on && P.nobos && !G.bossUrl; };

  function pSfx(n, fb, o) {   // SFX propio con respaldo (sfx_fam4.js); sin audio / sin el nombre: silencio o el genérico
    try { var l = Assets.sfxNames(); if (l.indexOf(n) >= 0) { G.sfx(n, o); return; } if (fb) G.sfx(fb, o); } catch (e) { /* audio opcional */ }
  }
  P.sfx = pSfx;

  function stepCells(dt) {
    var i, c;
    for (i = act.length - 1; i >= 0; i--) {
      c = act[i]; c.t -= dt;
      if (c.t > 0) continue;
      if (c.st === ST_TELE) { c.st = ST_ARM; c.t = D.honey.arm; dirty = true; G.fx.puff && G.fx.puff(c.x, c.y, 1); pSfx('honey_drip', null, { vol: 0.4 }); }
      else if (c.st === ST_ARM) { c.st = ST_HONEY; c.t = c.life; dirty = true; }
      else if (c.st === ST_HONEY) { c.st = ST_SEAL; c.t = D.honey.seal; dirty = true; pSfx('cell_close', null, { vol: 0.4 }); }
      else if (c.st === ST_SEAL || c.st === ST_CARAMEL) { c.st = ST_WAX; c.t = 0; act.splice(i, 1); dirty = true; }
    }
    for (i = 0; i < nests.length; i++) if (nests[i].hatch > 0) nests[i].hatch -= dt;
  }

  P.update = function (dt) {
    if (!P.on) return;
    var p = G.player, i, q, e, s = dt / 1000;
    stepCells(dt);
    for (i = puddles.length - 1; i >= 0; i--) { q = puddles[i]; q.life -= dt; q.t += dt; if (q.life <= 0) puddles.splice(i, 1); }
    for (i = clouds.length - 1; i >= 0; i--) { q = clouds[i]; q.life -= dt; if (q.life <= 0) clouds.splice(i, 1); }
    for (i = globs.length - 1; i >= 0; i--) { q = globs[i]; q.t += dt; if (q.t >= q.dur) { landGlob(q); globs.splice(i, 1); } }
    // pilares: sacudida y reconstrucción a los 40 s (aviso con anillo en los últimos 3 s)
    for (i = 0; i < pillars.length; i++) {
      q = pillars[i]; if (q.shake > 0) q.shake -= dt;
      if (q.dead) { q.t += dt; if (q.t >= D.pillarRegrow) { q.dead = false; q.hp = q.max; G.fx.ring(q.x, q.y, 6, 40, 400, '#f0d98a', 3); P.collide(p, p.r); } }
    }
    // jugador sobre miel: ralentiza 45 % (no apila: Player.slow se queda con el mayor)
    if (p.honeyT > 0) p.honeyT -= dt;
    if (!p.dead && honeyOn && P.honeyAt(p.x, p.y)) {
      var pct = (G.Tree && G.Tree.fx && G.Tree.fx.guantes) ? 0.25 : D.honey.player;   // 'Guantes de apicultor' (Ruta, P7): 25 %
      if (G.runBuff && G.runBuff.fx && G.runBuff.fx.honey) pct *= 1 - G.runBuff.fx.honey;   // 'Tostada de miel' (P7): -50 %
      if (!(p.honeyT > 0)) pSfx('honey_squelch', null, { vol: 0.35 });
      G.Player.slow(p, pct, 140); p.honeyT = 140;
    }
    for (i = 0; i < G.enemies.length; i++) { e = G.enemies[i]; if (e.hot) tickHot(e, dt); }
    // celdas del entorno (B.4.2: "la Reina y el entorno abren y cierran celdas")
    if (envOn && P.opts.env && G.state === 'play' && !p.dead) {
      envT -= dt;
      if (envT <= 0) {
        var m = G.vt() / 60000; envT = Math.max(D.env.minEvery, G.rnd(D.env.every[0], D.env.every[1]) - 1200 * m);
        if (m >= 1) P.envEvent();
      }
    }
    // zumbido ambiente: sube con el nº de abejas vivas
    if ((hum.t -= dt) <= 0) {
      hum.t = 500; var n = 0; for (i = 0; i < G.enemies.length; i++) if (!G.enemies[i].dead && G.enemies[i].fe && G.enemies[i].fe.insect) n++;
      var lv = G.state === 'play' ? Math.min(1, 0.15 + n / 30) : 0; try { if (Assets.hum) Assets.hum(lv); } catch (e2) { /* sin audio */ }
    }
    if (P.nobos && !nobosEnded && G.runT >= G.RUN_LEN && G.mode === 'run' && !p.dead) { nobosEnded = true; G.Hud.banner('FIN DE LA PRUEBA (SIN JEFA)', 2500, '#f3a31f'); G.finish(true); }
  };
  // Evento del entorno: abre 1-3 celdas contiguas a 150-380 px del jugador (con aviso de 1100 ms)
  P.envEvent = function () {
    var p = G.player, a = G.rnd(0, TAU), d = G.rnd(D.env.dist[0], D.env.dist[1]), x = p.x + Math.cos(a) * d, y = p.y + Math.sin(a) * d, c = cellAt(x, y);
    if (!c || Math.hypot(c.x - p.x, c.y - p.y) < 70) return 0;
    return P.openHoney(c.x, c.y, Math.round(G.rnd(D.env.n[0], D.env.n[1])), { src: 'env' });
  };

  // Invariantes de justicia (B.4.2): tope de celdas, >= 55 % libre y camino sin miel; para pruebas y para la jefa (P6)
  P.validate = function () {
    var n = act.length, area = 2.598 * CR * CR, hexA = P.hexArea(), open = 0, free = 1 - (n * area) / hexA;
    return { honey: n, max: P.maxHoney(), freeFrac: free, ok: n <= P.maxHoney() && free >= D.honey.freeMin, connected: connectedWithout(null) };
  };
  P.info = function () { return { cells: cells.length, nests: nests.length, honey: act.length, puddles: puddles.length, clouds: clouds.length, pillars: pillars.filter(function (o) { return !o.dead; }).length, hexArea: Math.round(P.hexArea()) }; };

  // ================================================================= DIBUJO
  function cv(w, h) { var c = document.createElement('canvas'); c.width = w; c.height = h; return c; }
  function hexPath(g, x, y, r) { g.beginPath(); for (var k = 0; k < 6; k++) { var a = k * Math.PI / 3; g[k ? 'lineTo' : 'moveTo'](x + Math.cos(a) * r, y + Math.sin(a) * r); } g.closePath(); }
  function hash(q, r) { var h = (q * 73856093) ^ (r * 19349663); h = (h ^ (h >>> 13)) * 1274126177; return ((h ^ (h >>> 16)) >>> 0) / 4294967296; }
  function polyPath(g) { var v = D.verts; g.beginPath(); g.moveTo(v[0][0], v[0][1]); for (var i = 1; i < 6; i++) g.lineTo(v[i][0], v[i][1]); g.closePath(); }
  function artOK(n) { return typeof Assets !== 'undefined' && G.hasSpr(n); }
  // Suelo: celdas de cera (#f0d98a, bordes marrones #7a4a14) dentro del hexágono; fuera, panal oscuro. Se hornea una sola vez por run
  P.buildGround = function () {
    var W = G.AW, H = G.AH, c = cv(W, H), g = c.getContext('2d'), q, r, x, y, k, i;
    g.fillStyle = '#2b1706'; g.fillRect(0, 0, W, H);
    g.save(); polyPath(g); g.clip();
    var tile = artOK('tile_hex_wax');
    for (q = -14; q <= 14; q++) for (r = -14; r <= 14; r++) {
      x = OX + CR * 1.5 * q; y = OY + CR * SQ3 * (r + q / 2);
      if (x < -60 || x > W + 60 || y < -60 || y > H + 60) continue;
      var hv = hash(q, r);
      if (tile) { var sp = Assets.sprite('tile_hex_wax', Math.floor(hv * 4) % 4); g.drawImage(sp, Math.round(x - sp.width / 2), Math.round(y - sp.height / 2)); continue; }
      hexPath(g, x, y, CR - 1); g.fillStyle = 'hsl(' + (44 + Math.round(hv * 4)) + ',' + (62 + Math.round(hv * 8)) + '%,' + (73 + Math.round(hv * 6)) + '%)'; g.fill();
      g.strokeStyle = '#7a4a14'; g.lineWidth = 3; g.stroke();
      hexPath(g, x, y, CR - 8); g.strokeStyle = 'rgba(255,243,200,0.35)'; g.lineWidth = 2; g.stroke();
      if (hv > 0.75) { g.fillStyle = 'rgba(160,110,30,0.16)'; hexPath(g, x, y, CR - 9); g.fill(); }
    }
    // nidos: celda abierta, hueco oscuro con una larva dormida (fx_nest_cell si el arte lo trae)
    nests.forEach(function (n) {
      var sp = artOK('fx_nest_cell') ? Assets.sprite('fx_nest_cell', 0) : null;
      if (sp) { g.drawImage(sp, Math.round(n.x - sp.width / 2), Math.round(n.y - sp.height / 2)); return; }
      hexPath(g, n.x, n.y, CR - 4); g.fillStyle = '#4a2a0c'; g.fill(); g.strokeStyle = '#2a1608'; g.lineWidth = 4; g.stroke();
      hexPath(g, n.x, n.y, CR - 14); g.fillStyle = '#1e1006'; g.fill();
      g.fillStyle = '#f6ecd0'; g.strokeStyle = '#1b1124'; g.lineWidth = 2; g.beginPath(); g.ellipse(n.x, n.y + 2, 14, 8, 0.2, 0, TAU); g.fill(); g.stroke();
      g.fillStyle = '#d2bc86'; for (k = -1; k <= 1; k++) { g.beginPath(); g.moveTo(n.x + k * 7, n.y - 5); g.lineTo(n.x + k * 7, n.y + 9); g.stroke(); }
    });
    g.restore();
    // muros diagonales y lados: banda de panal oscuro de WD px por dentro del hexágono (el mismo margen de colisión)
    g.save(); g.lineJoin = 'miter'; g.miterLimit = 6;
    polyPath(g); g.strokeStyle = '#3a2008'; g.lineWidth = WD * 2; g.stroke();
    g.save(); polyPath(g); g.clip();
    for (q = -14; q <= 14; q++) for (r = -14; r <= 14; r++) {   // textura: celdas oscuras en la banda del muro
      x = OX + CR * 1.5 * q; y = OY + CR * SQ3 * (r + q / 2);
      if (x < -60 || x > W + 60 || y < -60 || y > H + 60) continue;
      if (P.wallDist(x, y) > WD + CR + 6 && x > 120 && x < W - 120 && y > 70 && y < H - 70) continue;
      hexPath(g, x, y, CR * 0.5); g.strokeStyle = 'rgba(122,74,20,0.55)'; g.lineWidth = 2; g.stroke();
    }
    g.restore();
    polyPath(g); g.strokeStyle = 'rgba(255,200,90,0.55)'; g.lineWidth = 2; g.save(); g.translate(0, 0); g.setLineDash([]); g.stroke(); g.restore();
    g.restore();
    return c;
  };

  // Capa de miel (celdas en estado MIEL): se repinta solo cuando cambia un estado
  function repaintHoney() {
    if (!honeyCv) { honeyCv = cv(G.AW, G.AH); honeyG = honeyCv.getContext('2d'); }
    var g = honeyG, i, c;
    g.clearRect(0, 0, G.AW, G.AH);
    for (i = 0; i < act.length; i++) { c = act[i]; if (c.st !== ST_HONEY) continue; honeyCell(g, c, 1, false); }
    dirty = false;
  }
  function honeyCell(g, c, alpha, bright) {
    g.save(); g.globalAlpha = alpha;
    if (artOK('fx_honey_cell')) { var sp = Assets.sprite('fx_honey_cell', Math.floor(hash(c.q, c.r) * 4) % 4); g.drawImage(sp, Math.round(c.x - sp.width / 2), Math.round(c.y - sp.height / 2)); g.restore(); return; }
    hexPath(g, c.x, c.y, CR - 3);
    var gr = g.createRadialGradient(c.x - 8, c.y - 10, 4, c.x, c.y, CR);
    gr.addColorStop(0, bright ? '#e8a53a' : '#d98a1a'); gr.addColorStop(1, '#c97a14');
    g.fillStyle = gr; g.fill(); g.strokeStyle = '#7a4a14'; g.lineWidth = 3.5; g.stroke();
    // burbujas (patrón: la miel se distingue de la cera lisa por las burbujas y el borde marrón)
    var h = hash(c.q + 5, c.r + 9), k;
    for (k = 0; k < 4; k++) {
      var a = h * 6 + k * 1.7, d = 8 + ((h * 97 + k * 31) % 22), bx = c.x + Math.cos(a) * d, by = c.y + Math.sin(a) * d * 0.8, br = 2.5 + (k % 3);
      g.fillStyle = 'rgba(255,205,110,0.75)'; g.beginPath(); g.arc(bx, by, br, 0, TAU); g.fill(); g.fillStyle = 'rgba(255,240,200,0.8)'; g.beginPath(); g.arc(bx - br * 0.3, by - br * 0.3, br * 0.35, 0, TAU); g.fill();
    }
    g.restore();
  }
  function inView(x, y, m) { return x > G.cam.x - m && x < G.cam.x + G.W + m && y > G.cam.y - m && y < G.cam.y + G.VH + m; }

  P.drawGround = function (c) {
    if (dirty) repaintHoney();
    var t = G.time / 1000, i, k, q;
    if (act.length) c.drawImage(honeyCv, 0, 0);
    for (i = 0; i < act.length; i++) {
      k = act[i]; if (!inView(k.x, k.y, 70)) continue;
      if (k.st === ST_TELE) {   // contorno marrón punteado que se llena de ámbar
        var u = 1 - k.t / D.honey.tele;
        c.save(); hexPath(c, k.x, k.y, CR - 5); c.fillStyle = 'rgba(201,122,20,' + (0.08 + 0.4 * u) + ')'; c.fill();
        c.strokeStyle = 'rgba(40,20,6,0.8)'; c.lineWidth = 6; c.stroke();
        c.strokeStyle = '#7a4a14'; c.lineWidth = 3; c.setLineDash([7, 6]); c.lineDashOffset = -t * 22; c.stroke(); c.setLineDash([]);
        hexPath(c, k.x, k.y, (CR - 8) * (1 - 0.75 * u)); c.strokeStyle = 'rgba(255,205,110,0.75)'; c.lineWidth = 2; c.stroke();
        c.restore();
      } else if (k.st === ST_ARM) { honeyCell(c, k, 0.55 + 0.35 * (1 - k.t / D.honey.arm), true); }
      else if (k.st === ST_SEAL) { honeyCell(c, k, G.clamp(k.t / D.honey.seal, 0, 1), false); }
      else if (k.st === ST_CARAMEL) {
        var cu = G.clamp(k.t / D.honey.caramel, 0, 1);
        c.save(); c.globalAlpha = cu; hexPath(c, k.x, k.y, CR - 3); c.fillStyle = '#9a5a10'; c.fill(); c.strokeStyle = '#ffe9a0'; c.lineWidth = 3; c.stroke();
        c.fillStyle = 'rgba(255,233,160,0.5)'; hexPath(c, k.x, k.y, (CR - 12) * cu); c.fill(); c.restore();
      }
    }
    // nidos eclosionando
    for (i = 0; i < nests.length; i++) {
      k = nests[i]; if (!(k.hatch > 0) || !inView(k.x, k.y, 70)) continue;
      var hu = 1 - k.hatch / 900;
      c.save(); hexPath(c, k.x, k.y, CR - 4); c.strokeStyle = 'rgba(255,205,110,' + (0.4 + 0.5 * hu) + ')'; c.lineWidth = 4; c.stroke();
      c.strokeStyle = 'rgba(40,20,6,0.7)'; c.lineWidth = 2; hexPath(c, k.x, k.y, (CR - 10) * (0.5 + 0.5 * hu)); c.stroke(); c.restore();
    }
    // charcos libres de miel
    for (i = 0; i < puddles.length; i++) {
      q = puddles[i]; if (!inView(q.x, q.y, q.r + 20)) continue;
      var a = Math.min(1, q.life / 500, q.t / 200 + 0.3);
      c.save(); c.globalAlpha = a;
      if (artOK('fx_honey_puddle')) { var sp = Assets.sprite('fx_honey_puddle', Math.floor(q.t / 220 + i) % 3); c.drawImage(sp, Math.round(q.x - q.r), Math.round(q.y - q.r), q.r * 2, q.r * 2); }
      else {
        var gr = c.createRadialGradient(q.x - q.r * 0.25, q.y - q.r * 0.3, q.r * 0.15, q.x, q.y, q.r);
        gr.addColorStop(0, '#dc9020'); gr.addColorStop(1, '#c97a14');
        c.fillStyle = G.fg ? G.fg(gr, '#c97a14') : gr; c.beginPath(); c.arc(q.x, q.y, q.r, 0, TAU); c.fill();
        c.strokeStyle = '#7a4a14'; c.lineWidth = 3; c.stroke();
        for (k = 0; k < 3; k++) { var ba = q.ph + k * 2.1, bd = q.r * (0.25 + 0.2 * k), bu = 0.5 + 0.5 * Math.sin(t * 2 + q.ph + k); c.fillStyle = 'rgba(255,215,130,0.8)'; c.beginPath(); c.arc(q.x + Math.cos(ba) * bd, q.y + Math.sin(ba) * bd * 0.8, 1.6 + 1.8 * bu, 0, TAU); c.fill(); }
      }
      c.restore();
    }
    // círculos de aterrizaje de los glóbulos (ámbar punteado)
    for (i = 0; i < globs.length; i++) {
      q = globs[i]; var gu = G.clamp(1 - (q.dur - q.t) / q.tele, 0, 1);
      c.save(); c.beginPath(); c.arc(q.tx, q.ty, q.r, 0, TAU); c.fillStyle = 'rgba(201,122,20,' + (0.08 + 0.22 * gu) + ')'; c.fill();
      c.strokeStyle = 'rgba(40,20,6,0.8)'; c.lineWidth = 6; c.stroke(); c.strokeStyle = '#e8a53a'; c.lineWidth = 3; c.setLineDash([6, 6]); c.lineDashOffset = -t * 20; c.stroke(); c.setLineDash([]);
      c.strokeStyle = 'rgba(255,215,130,0.85)'; c.lineWidth = 2; c.beginPath(); c.arc(q.tx, q.ty, q.r * (1 - 0.8 * gu), 0, TAU); c.stroke(); c.restore();
    }
    // nubes de humo: volutas grises (patrón de volutas, no de esporas)
    for (i = 0; i < clouds.length; i++) {
      q = clouds[i]; if (!inView(q.x, q.y, q.r + 20)) continue;
      var su = G.clamp(q.life / 500, 0, 1), sp2 = artOK('fx_smoke_puff') ? Assets.sprite('fx_smoke_puff', Math.floor(t * 5 + i) % 4) : null;
      c.save(); c.globalAlpha = su * 0.8;
      if (sp2) c.drawImage(sp2, Math.round(q.x - q.r), Math.round(q.y - q.r), q.r * 2, q.r * 2);
      else {
        for (k = 0; k < 4; k++) {
          var sa = q.ph + k * 1.6 + t * 0.7, sd = q.r * 0.35, rr = q.r * (0.5 + 0.12 * Math.sin(t * 2 + k)), sx = q.x + Math.cos(sa) * sd, sy = q.y + Math.sin(sa) * sd * 0.8 - (t * 6 % 6);
          c.fillStyle = 'rgba(154,143,132,0.35)'; c.beginPath(); c.arc(sx, sy, rr, 0, TAU); c.fill();
        }
        c.strokeStyle = 'rgba(90,80,72,0.5)'; c.lineWidth = 2; c.setLineDash([5, 7]); c.lineDashOffset = t * 12; c.beginPath(); c.arc(q.x, q.y, q.r, 0, TAU); c.stroke();
      }
      c.restore();
    }
  };
  // Glóbulos de miel en vuelo (por encima de los sprites)
  P.drawAir = function (c) {
    for (var i = 0; i < globs.length; i++) {
      var g = globs[i], u = G.clamp(g.t / g.dur, 0, 1), x = g.x0 + (g.tx - g.x0) * u, y = g.y0 + (g.ty - g.y0) * u - Math.sin(u * Math.PI) * 46;
      G.Proj.up(c, x, y + 20);
      c.save();
      if (artOK('proj_honey_glob')) { var sp = Assets.sprite('proj_honey_glob', Math.floor(g.t / 100) % 2); c.drawImage(sp, Math.round(x - sp.width / 2), Math.round(y - sp.height / 2)); }
      else { c.fillStyle = '#c97a14'; c.strokeStyle = '#1b1124'; c.lineWidth = 2; c.beginPath(); c.arc(x, y, 7, 0, TAU); c.fill(); c.stroke(); c.fillStyle = 'rgba(255,215,130,0.85)'; c.beginPath(); c.arc(x - 2, y - 2, 2, 0, TAU); c.fill(); }
      c.restore(); G.Proj.down(c);
    }
  };

  // Pilares (ordenados por y con el resto)
  function drawPillarItem(c, it) {
    var o = it.o, sh = o.shake > 0 ? (Math.random() * 2 - 1) * 2 : 0;
    if (typeof Assets.drawWaxPillar === 'function') { Assets.drawWaxPillar(c, o.x, o.y, { hp: o.dead ? 0 : o.hp / o.max, rebuild: o.dead ? G.clamp(o.t / D.pillarRegrow, 0, 1) : 0, struck: o.shake > 0 }); return; }
    if (artOK('obs_wax_pillar') && !o.dead) { var sp = Assets.sprite('obs_wax_pillar', o.hp < o.max * 0.5 ? 2 : o.shake > 0 ? 1 : 0); c.drawImage(sp, Math.round(o.x - sp.width / 2 + sh), Math.round(o.y + 12 - sp.height)); return; }
    if (o.dead) {   // aviso de reconstrucción: anillo punteado en los últimos 3 s
      var left = D.pillarRegrow - o.t;
      if (left < 3000) { c.save(); c.strokeStyle = 'rgba(240,217,138,' + (0.4 + 0.4 * Math.sin(G.time / 90)) + ')'; c.lineWidth = 3; c.setLineDash([5, 5]); c.beginPath(); c.arc(o.x, o.y, o.r, 0, TAU); c.stroke(); c.restore(); }
      return;
    }
    var bx = o.x + sh, by = o.y + 10, w = o.r * 1.1, h = 52;
    c.save();
    c.fillStyle = 'rgba(40,20,6,0.4)'; c.beginPath(); c.ellipse(bx, by - 2, w * 1.1, w * 0.42, 0, 0, TAU); c.fill();
    c.lineJoin = 'round'; c.lineWidth = 3; c.strokeStyle = '#1b1124';
    c.fillStyle = '#d9b85a'; c.beginPath(); c.rect(bx - w, by - h, w * 2, h); c.fill(); c.stroke();
    c.fillStyle = '#f0d98a'; c.fillRect(bx - w + 3, by - h + 3, w * 0.7, h - 6);
    c.strokeStyle = '#7a4a14'; c.lineWidth = 2; c.beginPath(); c.moveTo(bx - w * 0.3, by - h); c.lineTo(bx - w * 0.3, by); c.moveTo(bx + w * 0.4, by - h); c.lineTo(bx + w * 0.4, by); c.stroke();
    c.fillStyle = '#f7e6a8'; c.strokeStyle = '#1b1124'; c.lineWidth = 3; c.beginPath(); c.ellipse(bx, by - h, w, w * 0.4, 0, 0, TAU); c.fill(); c.stroke();
    if (o.hp < o.max * 0.6) { c.strokeStyle = '#4a2a0c'; c.lineWidth = 2; c.beginPath(); c.moveTo(bx - 4, by - h + 4); c.lineTo(bx + 2, by - h * 0.55); c.lineTo(bx - 3, by - h * 0.25); c.stroke(); }
    c.restore();
  }
  P.items = function (list) {
    var i, o, cx = G.cam.x, cy = G.cam.y, vw = G.W, vh = G.VH;
    for (i = 0; i < pillars.length; i++) {
      o = pillars[i]; if (o.x < cx - 60 || o.x > cx + vw + 60 || o.y < cy - 80 || o.y > cy + vh + 100) continue;
      if (o.dead && D.pillarRegrow - o.t >= 3000) continue;
      list.push({ y: o.y + 8, ux: o.x, uy: o.y, draw: drawPillarItem, o: o });
    }
  };

  // Ambiente: tinte ámbar 0,06, motas de polen (24 / 12 / 0) y rayos de luz cálidos. Se dibuja en el mundo (coordenadas de arena)
  P.drawAmbient = function (c, tt) {
    var Q = G.Q, lv = Q.level, n = lv === 'baja' ? 0 : lv === 'media' ? 12 : 24, t = tt / 1000, i, x0 = G.cam.x, y0 = G.cam.y, W = G.W, H = G.VH;
    c.save();
    c.fillStyle = 'rgba(255,170,40,0.06)'; c.fillRect(x0 - 2, y0 - 2, W + 4, H + 4);
    if (lv === 'alta') {
      for (i = 0; i < 3; i++) {
        var rx = x0 + ((i * 0.37 + 0.12 + 0.015 * Math.sin(t * 0.3 + i)) % 1) * W, g = c.createLinearGradient(rx, y0, rx + 120, y0 + H);
        g.addColorStop(0, 'rgba(255,214,120,0.10)'); g.addColorStop(1, 'rgba(255,214,120,0)');
        c.fillStyle = g; c.beginPath(); c.moveTo(rx, y0); c.lineTo(rx + 90, y0); c.lineTo(rx + 260, y0 + H); c.lineTo(rx + 150, y0 + H); c.closePath(); c.fill();
      }
    }
    for (i = 0; i < n; i++) {
      var sx = ((i * 0.6180339 + t * (0.006 + (i % 5) * 0.0015)) % 1), sy = ((i * 0.3819660 + t * (0.004 + (i % 3) * 0.002)) % 1);
      var x = x0 + sx * W + Math.sin(t * 0.8 + i) * 12, y = y0 + sy * H + Math.cos(t * 0.6 + i * 2) * 8;
      c.fillStyle = 'rgba(255,230,140,' + (0.35 + 0.25 * Math.sin(t * 2 + i)) + ')'; c.fillRect(Math.round(x), Math.round(y), i % 3 ? 2 : 3, i % 3 ? 2 : 3);
    }
    c.restore();
  };
})();
