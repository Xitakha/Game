/* tundra.js - TUNDRA (DESIGN-v5-biomas.md B.1, fase P3): el mundo de hielo.
   Todo lo que solo existe en la Tundra vive aquí y se activa con G.Tundra.on (bioma 'tundra'); en los demás biomas nada de esto se ejecuta:
   - FÍSICA DEL HIELO (B.1.2) para el jugador y los enemigos terrestres: aceleración con tau, fricción lambda, nieve firme = movimiento de siempre. Datos en G.B.biomes.tundra.ice
   - MEDIDOR DE FRÍO (B.1.4): G.cold (0-100). Sube en hielo / ventisca, baja en nieve firme y hogueras; lo mitigan Fuego, Sangre, Hielo, platos y nodos
   - HOGUERAS (zonas de calor con luz), ESTALAGMITAS (obstáculos de 300 HP que bloquean proyectiles enemigos), nieve firme y grietas (suelo prerrenderizado)
   - VENTISCA (B.1.3): capa de pantalla con recorte despejado de r 330 y bruma hasta alpha 0,55; las telegrafías se dibujan DESPUÉS (main.js, 2.ª pasada)
   - HUD del Frío (barra + icono + escarcha en las esquinas)
   Parámetros de URL: ?biome=tundra  &nobos=1 (sin jefe: modo de depuración; también es el comportamiento hasta la P4)  &ice=0 (sin física de hielo)  &cold=0 (sin Frío)
   &softice=1 ("Hielo suave", accesibilidad)  &lightstorm=1 ("Ventisca ligera", +80 px de visión)  &patch=70 (radio de la nieve firme por fase: 110 F1-F2, 90 F3, 70 F4)  &gust=1 (ráfaga permanente, pruebas). */
(function () {
  'use strict';
  var G = window.G, B = G.B, T = G.Tundra = { on: false };

  function qnum(name, def) { var m = new RegExp('[?&]' + name + '=([\\d.]+)').exec(location.search); return m ? parseFloat(m[1]) : def; }

  // ================================================================= DATOS (B.1.1 - B.1.4; todo ajustable aquí)
  B.biomes = B.biomes || {};
  B.biomes.tundra = {
    // ---- Física del hielo (B.1.2). tau = constante de tiempo de la aceleración (ms); lambda = fricción sin entrada (s^-1): la velocidad decae como v * e^(-lambda dt); derrape = v0 / lambda
    ice: {
      tau: 220, lambda: 2.2, kb: 1.6, kbCap: 100,                // hielo: 95 % de la velocidad en 660 ms; derrape 86 px desde 190 px/s; retroceso x1,6 con tope de 100 px
      firmLambda: 40,                                             // nieve firme: "infinita" (para en seco); en transición se interpola el tiempo de frenado 1/lambda
      blend: 120,                                                 // ms que tarda la transición entre superficies
      cramp: { tau: 140, lambda: 3.2, kb: 1.2 },                  // nodo "Crampones" de Ruta (Tree.fx.crampones) y opción de accesibilidad "Hielo suave"
      frost: { tau: 300, lambda: 1.8, spd: 0.65, kb: 1.6 },       // estado Escarcha (Frío 100 %)
      helado: { spd: 0.85, tauAdd: 60 },                          // Frío >= 70 %
      enemyTau: 300                                               // enemigos terrestres: tau genérica 300 ms (los que cargan tienen perfil propio, enemies_tundra.js)
    },
    // ---- Arena (B.1.1): 5 parches de nieve firme con hoguera + 2 repisas pequeñas (sin hoguera) arriba y abajo en el centro: sin ellas, desde (620, 28) a la nieve firme hay 280 px (> 260)
    patches: [[270, 200], [1170, 200], [720, 405], [270, 610], [1170, 610]], patchR: 110, ledges: [[720, 70, 60], [720, 740, 60]], edge: 24,
    campfireR: 64, campfireRate: -10,
    pillars: [[480, 280], [960, 280], [480, 530], [960, 530], [720, 240], [720, 570], [300, 405], [1140, 405]], pillarR: 22, pillarHp: 300, pillarRegrow: 45000,
    cracks: [[495, 200, 200, 0.1], [945, 200, 200, -0.1], [495, 610, 220, -0.08], [945, 610, 220, 0.08], [720, 92, 240, 0]],
    // ---- Frío (B.1.4). Valores en %/s salvo indicación
    cold: {
      base: 1.5, gustMul: 1.5,                                    // ganancia base en hielo y x1,5 durante las ráfagas
      firmRest: -3,                                               // en nieve firme (fuera de hoguera) el Frío remite lentamente (a mitad de ritmo con ráfaga)
      fire: 0.35, blood: 0.20, ice: 0.15, maxCards: 3,            // pasivo por carta en la mano (máx. 3 por etiqueta): Fuego -0,35, Sangre -0,20, Hielo -0,15
      fireKill: 0.8, fireKillCap: 4,                              // -0,8 por baja con Fuego (máx. -4 por segundo)
      shamanR: 200, shamanMul: 2,                                 // dentro de 200 px de un Chamán del aullido la ganancia se duplica
      warn: 40, helado: 70, frozenMs: 5000, frozenTo: 55, immuneMs: 8000, cdMul: 0.75,
      bossStart: 20, huntMul: 0.8
    },
    // ---- Ventisca (B.1.3)
    blizzard: { clearR: 330, edgeR: 520, edgeA: 0.55, calmMs: 25000, gustMs: 8000, calmA: 0.15, gustA: 0.45, tilt: 20, lightR: 80, ramp: [0.8, 1.0] }
  };
  var D = B.biomes.tundra, ICE = D.ice, CD = D.cold, BZ = D.blizzard;

  // ================================================================= ESTADO
  G.cold = { v: 0, frozenT: 0, immuneT: 0, rate: 0, warned: false, kWin: 0, kT: 0, hearth: false, gain: 0, shaman: false, frozenN: 0, peak: 0, tIce: 0, tFirm: 0, tHeat: 0 };
  var BZS = { t: 0, gust: false, a: 0.15, k: 0, windT: 0, force: qnum('gust', 0) > 0, boss: 0 };
  T.bz = BZS;
  var pillars = [], fires = [], patchR = D.patchR, ledgeR = null, iceOn = true, coldOn = true, hand = { fire: 0, blood: 0, ice: 0, t: 0 };
  T.pillars = pillars; T.fires = fires;
  T.opts = { soft: false, light: false };
  T.nobos = false;

  T.tau = function () { return ICE.tau; };
  T.settingOn = function (k) { var s = G.Save && G.Save.data && G.Save.data.settings; return !!(s && s[k]); };

  T.begin = function (biome) {
    T.on = biome === 'tundra'; T.nobos = false; T.ended = false;
    if (!T.on) { G.cold.v = 0; G.cold.frozenT = 0; G.cold.immuneT = 0; return; }
    iceOn = qnum('ice', 1) > 0; coldOn = qnum('cold', 1) > 0;
    patchR = qnum('patch', D.patchR); ledgeR = null;
    T.opts.soft = qnum('softice', 0) > 0 || T.settingOn('softIce'); T.opts.light = qnum('lightstorm', 0) > 0 || T.settingOn('lightStorm');
    T.nobos = qnum('nobos', 0) > 0 || (!G.bossUrl && !(G.Boss.DEFS && G.Boss.DEFS.yarlak));   // sin jefe hasta la P4
    pillars.length = 0; D.pillars.forEach(function (q, i) { pillars.push({ x: q[0], y: q[1], r: D.pillarR, hp: D.pillarHp, max: D.pillarHp, dead: false, t: 0, shake: 0, i: i }); });
    fires.length = 0; D.patches.forEach(function (q, i) { fires.push({ x: q[0], y: q[1], i: i }); });
    var c = G.cold; c.v = 0; c.frozenT = 0; c.immuneT = 0; c.rate = 0; c.warned = false; c.kWin = 0; c.kT = 0; c.frozenN = 0; c.peak = 0; c.tIce = c.tFirm = c.tHeat = 0;
    BZS.t = 0; BZS.gust = false; BZS.a = BZS.force ? BZ.gustA : BZ.calmA; BZS.k = 0; BZS.windT = 0; BZS.boss = 0;
    hand.t = 0; hand.fire = hand.blood = hand.ice = 0;
    sfxT.step = sfxT.slide = sfxT.fire = 0;
  };
  T.end = function () { try { Assets.wind(0); } catch (e) { /* sin audio */ } };
  // Fin de la prueba sin jefe: el jefe de la Tundra (Yarlak) llega en la P4. Hasta entonces solo se llega con ?biome=tundra
  T.noBoss = function () { return T.on && T.nobos && !G.bossUrl; };

  // ================================================================= SUPERFICIE: nieve firme (0) o hielo (1)
  function mainR() { return patchR; }
  // 0 = nieve firme dentro del parche, 1 = hielo; rampa de 24 px en el borde
  T.slipAt = function (x, y) {
    var best = 1, i, q, d, R = patchR, E = D.edge;
    for (i = 0; i < D.patches.length; i++) { q = D.patches[i]; d = Math.hypot(x - q[0], y - q[1]) - R; if (d < E) { d = d <= 0 ? 0 : d / E; if (d < best) best = d; } }
    for (i = 0; i < D.ledges.length; i++) { q = D.ledges[i]; d = Math.hypot(x - q[0], y - q[1]) - q[2]; if (d < E) { d = d <= 0 ? 0 : d / E; if (d < best) best = d; } }
    return best;
  };
  T.onFirm = function (x, y) { return T.slipAt(x, y) < 0.5; };
  // Distancia desde (x, y) hasta el borde de la nieve firme más cercana (0 dentro)
  T.distToFirm = function (x, y) {
    var best = 1e9, i, q, d;
    for (i = 0; i < D.patches.length; i++) { q = D.patches[i]; d = Math.hypot(x - q[0], y - q[1]) - patchR; if (d < best) best = d; }
    for (i = 0; i < D.ledges.length; i++) { q = D.ledges[i]; d = Math.hypot(x - q[0], y - q[1]) - q[2]; if (d < best) best = d; }
    return Math.max(0, best);
  };
  // Invariante de justicia (B.1.1): desde cualquier punto jugable hay nieve firme a <= 260 px del borde de algún parche (rejilla de `step` px)
  T.iceCoverage = function (r, step) {
    var old = patchR; if (r) patchR = r; step = step || 8;
    var mx = 0, mxp = null, x, y, d, m = G.WALL;
    for (x = m; x <= G.AW - m; x += step) for (y = m; y <= G.AH - m; y += step) { d = T.distToFirm(x, y); if (d > mx) { mx = d; mxp = [x, y]; } }
    patchR = old; return { max: Math.round(mx * 10) / 10, at: mxp };
  };
  T.setPatchR = function (r) { patchR = r; G.ground = T.buildGround(); };   // F3 90, F4 y desesperado 70 (P4); reconstruye el suelo

  // ================================================================= FÍSICA DEL JUGADOR
  // Parámetros efectivos {tau (ms en hielo), lambda, spd (multiplicador), kb} según Escarcha / Helado / Crampones / Hielo suave
  T.params = function () {
    var tf = G.Tree && G.Tree.fx || {}, c = G.cold, P = ICE, o = { tau: P.tau, lambda: P.lambda, spd: 1, kb: P.kb };
    if (T.opts.soft || tf.crampones) { o.tau = P.cramp.tau; o.lambda = P.cramp.lambda; o.kb = P.cramp.kb; }
    if (c.frozenT > 0) { o.tau = Math.max(o.tau, P.frost.tau); o.lambda = Math.min(o.lambda, P.frost.lambda); o.spd = P.frost.spd; o.kb = Math.max(o.kb, P.frost.kb); }
    else if (c.v >= CD.helado && coldOn) { o.spd = P.helado.spd; o.tau += P.helado.tauAdd; }
    return o;
  };
  var sfxT = { step: 0, slide: 0, fire: 0 };
  T.movePlayer = function (p, ix, iy, spd, s, dt) {
    var il = Math.hypot(ix, iy), q = T.params(), tgt = iceOn ? T.slipAt(p.x, p.y) : 0, st = dt / ICE.blend;
    p.sf += G.clamp(tgt - p.sf, -st, st);
    spd *= q.spd;
    var tx = ix * spd, ty = iy * spd, sf = p.sf;
    if (il > 0) {
      var tau = q.tau * sf;
      if (tau < 3) { p.vx = tx; p.vy = ty; }
      else { var k = 1 - Math.exp(-dt / tau); p.vx += (tx - p.vx) * k; p.vy += (ty - p.vy) * k; }
    } else if (sf < 0.02) { p.vx = p.vy = 0; }   // nieve firme: se para en seco
    else {
      var inv = (1 - sf) / ICE.firmLambda + sf / q.lambda, k2 = Math.exp(-s / inv);   // tiempo de frenado 1/lambda interpolado (en distancia, no en lambda)
      p.vx *= k2; p.vy *= k2;
      if (Math.abs(p.vx) + Math.abs(p.vy) < 2) p.vx = p.vy = 0;
    }
    p.x += p.vx * s; p.y += p.vy * s;
    var sp = Math.hypot(p.vx, p.vy);
    if (sp > 20) p.moving = true;
    // sonido: pasos distintos en hielo y nieve; siseo de derrape al soltar el mando a toda velocidad
    var now = G.time;
    if (sp > 60 && now - sfxT.step > 300) { sfxT.step = now; G.sfx(sf > 0.5 ? 'ice_step' : 'snow_step', { vol: 0.35 }); }
    if (il === 0 && sf > 0.5 && sp > 110 && now - sfxT.slide > 380) { sfxT.slide = now; G.sfx('ice_slide', { vol: 0.5, pitch: 0.8 + sp / 190 * 0.4 }); }
  };
  T.afterWall = function (p) {
    var m = G.WALL + p.r;
    if ((p.x <= m + 0.01 && p.vx < 0) || (p.x >= G.AW - m - 0.01 && p.vx > 0)) p.vx = 0;
    if ((p.y <= m + 0.01 && p.vy < 0) || (p.y >= G.AH - m - 0.01 && p.vy > 0)) p.vy = 0;
  };
  // Retroceso en hielo: x1,6 con tope de 100 px contando el derrape que ya llevaba (el derrape + retroceso nunca pasa de ~100 px, B.1.2 anti-frustración 2)
  T.hurtKb = function (p) {
    var q = T.params(), m = 1 + (q.kb - 1) * p.sf, drift = Math.hypot(p.vx, p.vy) / q.lambda * p.sf;
    p.kx *= m; p.ky *= m;
    var cap = Math.max(25, ICE.kbCap - drift) * 12, mag = Math.hypot(p.kx, p.ky);   // distancia total del retroceso = velocidad / 12
    if (mag > cap) { p.kx *= cap / mag; p.ky *= cap / mag; }
    p.vx *= 0.4; p.vy *= 0.4;
  };

  // ================================================================= ESTALAGMITAS (obstáculos) y colisión
  T.collide = function (who, r) {
    for (var i = 0; i < pillars.length; i++) {
      var o = pillars[i]; if (o.dead) continue;
      var dx = who.x - o.x, dy = who.y - o.y, d = Math.hypot(dx, dy), min = o.r + r;
      if (d < min) { if (d < 0.01) { dx = 1; dy = 0; d = 1; } who.x = o.x + dx / d * min; who.y = o.y + dy / d * min; }
    }
  };
  T.blocks = function (x, y, r) {
    for (var i = 0; i < pillars.length; i++) { var o = pillars[i]; if (!o.dead && Math.hypot(o.x - x, o.y - y) < o.r + r * 0.5) { o.shake = 120; return true; } }
    return false;
  };
  // Para el jefe (P4): romper una estalagmita (la Embestida, la Cornada y el Alud); se reconstruye a los 45 s
  T.breakPillar = function (i) {
    var o = pillars[i]; if (!o || o.dead) return;
    o.dead = true; o.t = 0; G.fx.burst(o.x, o.y, 14, '#bfeaff', 220, 600, 4, { g: 260 }); G.fx.ring(o.x, o.y, 10, 60, 300, '#bfeaff', 4); G.sfx('ice_break', { vol: 0.8 });
  };
  T.hitPillar = function (i, dmg) { var o = pillars[i]; if (!o || o.dead) return; o.hp -= dmg; o.shake = 120; if (o.hp <= 0) T.breakPillar(i); };

  // ================================================================= ENEMIGOS: inercia (tau 300 ms) y choque con estalagmitas
  T.slideEnemy = function (e, dt, s) {
    if (e.noSlide) { e.vx = e.vy = 0; T.collide(e, e.r); return; }
    var tgt = iceOn ? T.slipAt(e.x, e.y) : 0, st = dt / ICE.blend;
    e.sf += G.clamp(tgt - e.sf, -st, st);
    var tau = (e.tau || ICE.enemyTau) * e.sf;
    if (tau < 3) { e.vx = e.mvx; e.vy = e.mvy; }
    else { var k = 1 - Math.exp(-dt / tau); e.vx += (e.mvx - e.vx) * k; e.vy += (e.mvy - e.vy) * k; }
    e.x += e.vx * s; e.y += e.vy * s;
    if (!e.fixed) T.collide(e, e.r);
  };
  T.farAlpha = function (e) {
    if (BZS.k <= 0.01 || e.big) return 1;
    var p = G.player, d = Math.hypot(e.x - p.x, e.y - p.y), cr = BZ.clearR + (T.opts.light ? BZ.lightR : 0);
    if (d <= cr) return 1;
    return 1 - 0.35 * Math.min(1, (d - cr) / (BZ.edgeR - BZ.clearR)) * BZS.k;
  };

  // ================================================================= MEDIDOR DE FRÍO
  function handCount() {
    var h = G.player.hand, t = G.time;
    if (t - hand.t < 250) return hand;
    hand.t = t; hand.fire = hand.blood = hand.ice = 0;
    for (var i = 0; i < h.length; i++) { if (!h[i]) continue; var tg = G.Cards.def(h[i].id).tag; if (tg === 'fire' || tg === 'blood' || tg === 'ice') hand[tg]++; }
    return hand;
  }
  T.passive = function () {   // %/s que restan las cartas de la mano
    var hc = handCount(), M = CD.maxCards, tf = G.Tree && G.Tree.fx || {};
    return Math.min(M, hc.fire) * (tf.brasaPecho ? CD.fire + 0.15 : CD.fire) + Math.min(M, hc.blood) * CD.blood + Math.min(M, hc.ice) * CD.ice;
  };
  T.coldMul = function () {
    var tf = G.Tree && G.Tree.fx || {}, rb = G.runBuff && G.runBuff.fx || {};
    return (rb.cold ? 1 - rb.cold : 1) * (tf.abrigo ? 0.7 : 1);   // Caldo de brasa -35 %, Abrigo de escarcha -30 % de ganancia
  };
  T.coldAdd = function (n) {   // golpes de Frío (flecha, picado, ventisca local): respetan la inmunidad de la Escarcha y las mitigaciones de ganancia
    if (!T.on || !coldOn || n <= 0) return;
    var c = G.cold; if (c.immuneT > 0 || c.frozenT > 0) return;
    c.v = Math.min(100, c.v + n * T.coldMul());
    if (c.v >= 100) freeze();
  };
  T.fireKill = function () {
    var c = G.cold; if (!coldOn) return;
    if (G.time - c.kT > 1000) { c.kT = G.time; c.kWin = 0; }
    if (c.kWin + CD.fireKill <= CD.fireKillCap) { c.kWin += CD.fireKill; c.v = Math.max(0, c.v - CD.fireKill); }
  };
  function freeze() {
    var c = G.cold; c.v = CD.frozenTo; c.frozenT = CD.frozenMs; c.immuneT = CD.immuneMs; c.frozenN++; c.warned = false;
    G.Hud.banner('¡ESCARCHA!', 1600, '#bfeaff'); G.sfx('cold_freeze', { vol: 0.9 }); G.fx.shake(4, 160);
    G.fx.burst(G.player.x, G.player.y, 16, '#e8f6ff', 200, 700, 4, { add: true });
  }
  T.onBoss = function () { if (T.on) G.cold.v = CD.bossStart; };   // al aparecer el jefe el medidor pasa a 20 %
  T.state = function () { var c = G.cold; return c.frozenT > 0 ? 'escarcha' : c.v >= CD.helado ? 'helado' : c.v >= CD.warn ? 'frio' : 'ok'; };

  function nearHeat(p) {
    var tf = G.Tree && G.Tree.fx || {}, R = D.campfireR * (tf.brasaPecho ? 1.3 : 1);
    for (var i = 0; i < fires.length; i++) if (Math.hypot(p.x - fires[i].x, p.y - fires[i].y) <= R + p.r * 0.3) return fires[i];
    return null;
  }
  T.nearHeat = nearHeat;
  function shamanNear(p) {
    for (var i = 0; i < G.enemies.length; i++) { var e = G.enemies[i]; if (e.fe && e.fe.shaman && !e.dead && e.spawnT <= 0 && Math.hypot(e.x - p.x, e.y - p.y) <= CD.shamanR) return true; }
    return false;
  }
  var shT = 0, shV = false;
  T.coldUpdate = function (dt) {
    var c = G.cold, p = G.player, s = dt / 1000;
    if (c.frozenT > 0) c.frozenT -= dt;
    if (c.immuneT > 0) c.immuneT -= dt;
    if (!coldOn || p.dead) { c.rate = 0; return; }
    var fire = nearHeat(p), firm = !fire && p.sf < 0.5 && iceOn, gust = BZS.k, dur = G.Loot.dur(), rate;
    c.hearth = !!fire;
    if ((shT -= dt) <= 0) { shT = 250; shV = shamanNear(p); }
    c.shaman = shV;
    if (fire) { rate = D.campfireRate; c.tHeat += dt; }
    else if (firm) { rate = CD.firmRest * (1 - 0.5 * Math.min(1, gust / 1)); c.tFirm += dt; }
    else {
      var gm = 1 + (CD.gustMul - 1) * Math.min(1, gust);
      rate = CD.base * (dur.cold || 1) * gm * (G.mode === 'hunt' ? CD.huntMul : 1) * (shV ? CD.shamanMul : 1) * T.coldMul();
      if (c.immuneT > 0 || c.frozenT > 0) rate = 0;
      c.tIce += dt;
    }
    rate -= T.passive();
    c.rate = rate; c.v += rate * s;
    if (c.v < 0) c.v = 0;
    if (c.v >= 100) freeze();
    if (c.v > c.peak) c.peak = c.v;
    if (c.v >= CD.helado && !c.warned) { c.warned = true; G.sfx('cold_warn', { vol: 0.8 }); }
    else if (c.v < CD.helado - 10) c.warned = false;
  };

  // ================================================================= VENTISCA: ciclo calma / ráfaga
  T.blizzardK = function () {   // multiplicador por minuto (la ventisca se espesa a lo largo de la run: 0,8 -> 1,0 a los 6 min virtuales)
    var m = G.vt() / 60000, r = BZ.ramp; return r[0] + (r[1] - r[0]) * G.clamp(m / 6, 0, 1);
  };
  T.update = function (dt) {
    if (!T.on) return;
    var p = G.player, i, o;
    // ciclo de la ventisca: calma 25 s -> ráfaga 8 s (P4: Yarlak fuerza ráfagas por fase con T.bz.boss)
    BZS.t += dt;
    if (!BZS.force) {
      if (!BZS.gust && BZS.t >= BZ.calmMs) { BZS.gust = true; BZS.t = 0; G.sfx('wind_gust', { vol: 0.7 }); }
      else if (BZS.gust && BZS.t >= BZ.gustMs) { BZS.gust = false; BZS.t = 0; }
    } else BZS.gust = true;
    var ta = (BZS.gust ? BZ.gustA : BZ.calmA) * T.blizzardK(); if (BZS.boss > ta) ta = BZS.boss;
    BZS.a += (ta - BZS.a) * Math.min(1, dt / 700);
    BZS.k = G.clamp((BZS.a - BZ.calmA * 0.5) / (BZ.gustA - BZ.calmA * 0.5), 0, 1);   // 0 = calma, 1 = ráfaga completa
    if ((BZS.windT -= dt) <= 0) { BZS.windT = 400; try { Assets.wind(G.state === 'play' ? 0.12 + 0.55 * BZS.k : 0); } catch (e) { /* sin audio */ } }
    if (G.state === 'play') T.coldUpdate(dt);
    // estalagmitas: sacudida y reconstrucción a los 45 s (aviso con anillo)
    for (i = 0; i < pillars.length; i++) {
      o = pillars[i]; if (o.shake > 0) o.shake -= dt;
      if (o.dead) { o.t += dt; if (o.t >= D.pillarRegrow) { o.dead = false; o.hp = o.max; G.fx.ring(o.x, o.y, 6, 40, 400, '#bfeaff', 3); G.sfx('ice_crack', { vol: 0.5 }); T.collide(p, p.r); } }
    }
    if (G.time - sfxT.fire > 1800) { sfxT.fire = G.time; for (i = 0; i < fires.length; i++) if (Math.hypot(p.x - fires[i].x, p.y - fires[i].y) < 240) { G.sfx('campfire_crackle', { vol: 0.35 }); break; } }
    // fin de la prueba sin jefe (modo de depuración): al llegar a la duración de la run
    if (T.nobos && !T.ended && G.runT >= G.RUN_LEN && G.mode === 'run' && !p.dead) { T.ended = true; G.Hud.banner('FIN DE LA PRUEBA (SIN JEFE)', 2500, '#bfeaff'); G.finish(true); }
  };

  // ================================================================= DIBUJO: suelo prerrenderizado (hielo negro, nieve firme, grietas)
  function rng(seed) { return function () { seed |= 0; seed = seed + 0x6D2B79F5 | 0; var t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
  function cv(w, h) { var c = document.createElement('canvas'); c.width = w; c.height = h; return c; }
  T.buildGround = function () {
    var W = G.AW, H = G.AH, c = cv(W, H), g = c.getContext('2d'), r = rng(31337), i, j, q;
    // hielo negro
    var bg = g.createLinearGradient(0, 0, W, H); bg.addColorStop(0, '#2a4f8a'); bg.addColorStop(0.5, '#27497f'); bg.addColorStop(1, '#223f72');
    g.fillStyle = bg; g.fillRect(0, 0, W, H);
    for (i = 0; i < 70; i++) {   // manchas más oscuras y más claras (hielo profundo)
      var bx = r() * W, by = r() * H, br = 40 + r() * 110, bgd = g.createRadialGradient(bx, by, 0, bx, by, br);
      bgd.addColorStop(0, r() < 0.5 ? 'rgba(18,36,76,0.35)' : 'rgba(110,170,230,0.12)'); bgd.addColorStop(1, 'rgba(0,0,0,0)');
      g.fillStyle = bgd; g.fillRect(bx - br, by - br, br * 2, br * 2);
    }
    // brillos en DIAGONAL (el hielo se distingue por el patrón: líneas; la nieve por puntos)
    g.lineCap = 'round';
    for (i = 0; i < 1100; i++) {
      var x = r() * W, y = r() * H, l = 10 + r() * 34;
      g.strokeStyle = r() < 0.7 ? 'rgba(159,216,255,' + (0.1 + r() * 0.2) + ')' : 'rgba(225,244,255,' + (0.14 + r() * 0.22) + ')'; g.lineWidth = r() < 0.2 ? 2 : 1;
      g.beginPath(); g.moveTo(x, y); g.lineTo(x + l * 0.7, y - l * 0.7); g.stroke();
    }
    // grietas (decoración segura de cruzar)
    D.cracks.forEach(function (k) {
      var x0 = k[0] - k[2] / 2, y0 = k[1], len = k[2], sl = k[3], px = x0, py = y0, seg = 9, n, bx2;
      g.lineJoin = 'round';
      function path(ox, oy) { g.beginPath(); g.moveTo(x0 + ox, y0 + oy); var cx = x0, cy = y0, rr = rng(k[0] * 7 + k[1]); for (n = 1; n <= seg; n++) { cx = x0 + len * n / seg; cy = y0 + len * sl * n / seg + (rr() - 0.5) * 12; g.lineTo(cx + ox, cy + oy); } g.stroke(); }
      g.strokeStyle = 'rgba(8,18,44,0.8)'; g.lineWidth = 5; path(0, 0);
      g.strokeStyle = 'rgba(190,230,255,0.45)'; g.lineWidth = 1.5; path(0, -2);
      g.strokeStyle = 'rgba(8,18,44,0.55)'; g.lineWidth = 2; g.beginPath(); bx2 = x0 + len * 0.4; g.moveTo(bx2, y0 + len * sl * 0.4); g.lineTo(bx2 + 18, y0 + len * sl * 0.4 + 22); g.moveTo(x0 + len * 0.7, y0 + len * sl * 0.7); g.lineTo(x0 + len * 0.7 - 14, y0 + len * sl * 0.7 - 20); g.stroke();
    });
    // nieve firme: disco crema con puntos y borde de transición de 24 px
    function snow(cx, cy, R) {
      var E = D.edge, gr = g.createRadialGradient(cx, cy, Math.max(1, R - 8), cx, cy, R + E);
      gr.addColorStop(0, 'rgba(206,220,238,0.97)'); gr.addColorStop(1, 'rgba(206,220,238,0)');
      g.fillStyle = gr; g.beginPath(); g.arc(cx, cy, R + E, 0, 6.2832); g.fill();
      g.fillStyle = 'rgba(206,220,238,0.97)'; g.beginPath(); g.arc(cx, cy, R, 0, 6.2832); g.fill();
      var nd = Math.round(R * R / 38);
      for (j = 0; j < nd; j++) {   // puntos crema
        var a = r() * 6.2832, d = Math.sqrt(r()) * (R + E * 0.6); g.fillStyle = r() < 0.5 ? 'rgba(232,238,245,0.95)' : 'rgba(255,255,255,0.8)';
        g.beginPath(); g.arc(cx + Math.cos(a) * d, cy + Math.sin(a) * d, 1 + r() * 1.6, 0, 6.2832); g.fill();
        if (j % 5 === 0) { g.fillStyle = 'rgba(150,175,205,0.5)'; g.beginPath(); g.arc(cx + Math.cos(a + 1) * d * 0.9, cy + Math.sin(a + 1) * d * 0.9, 1.2, 0, 6.2832); g.fill(); }
      }
      g.strokeStyle = 'rgba(70,100,150,0.55)'; g.lineWidth = 2; g.beginPath(); g.arc(cx, cy, R + 1, 0, 6.2832); g.stroke();
    }
    D.patches.forEach(function (k) { snow(k[0], k[1], patchR); });
    D.ledges.forEach(function (k) { snow(k[0], k[1], k[2]); });
    // pared: roca helada oscura con capa de nieve
    var m = G.WALL;
    g.fillStyle = '#0f1d38'; g.fillRect(0, 0, W, m); g.fillRect(0, H - m, W, m); g.fillRect(0, 0, m, H); g.fillRect(W - m, 0, m, H);
    for (i = 0; i < 260; i++) {
      var side = Math.floor(r() * 4), t = r(), px2, py2, rr2 = 4 + r() * 9;
      px2 = side < 2 ? t * W : (side === 2 ? r() * m : W - r() * m); py2 = side >= 2 ? t * H : (side === 0 ? r() * m : H - r() * m);
      g.fillStyle = r() < 0.55 ? 'rgba(232,238,245,0.85)' : 'rgba(90,130,190,0.6)'; g.beginPath(); g.ellipse(px2, py2, rr2, rr2 * 0.55, 0, 0, 6.2832); g.fill();
    }
    g.strokeStyle = 'rgba(190,225,255,0.55)'; g.lineWidth = 2; g.strokeRect(m, m, W - 2 * m, H - 2 * m);
    return c;
  };

  // ---- Dibujo dinámico del suelo (en el mundo, antes de los sprites): anillo de calor de las hogueras
  T.drawGround = function (c) {
    var t = G.time / 1000, i, f, p = G.player, tf = G.Tree && G.Tree.fx || {}, R = D.campfireR * (tf.brasaPecho ? 1.3 : 1);
    for (i = 0; i < fires.length; i++) {
      f = fires[i]; if (f.x < G.cam.x - 140 || f.x > G.cam.x + G.W + 140 || f.y < G.cam.y - 140 || f.y > G.cam.y + G.VH + 140) continue;
      var inn = Math.hypot(p.x - f.x, p.y - f.y) <= R + p.r * 0.3;
      c.save();
      var gr = c.createRadialGradient(f.x, f.y, 6, f.x, f.y, R); gr.addColorStop(0, 'rgba(255,170,70,' + (inn ? 0.30 : 0.2) + ')'); gr.addColorStop(1, 'rgba(255,120,40,0)');
      c.fillStyle = G.fg(gr, 'rgba(255,150,60,0.16)'); c.beginPath(); c.arc(f.x, f.y, R, 0, 6.2832); c.fill();
      c.strokeStyle = 'rgba(8,4,14,0.5)'; c.lineWidth = 5; c.beginPath(); c.arc(f.x, f.y, R, 0, 6.2832); c.stroke();
      c.strokeStyle = 'rgba(255,190,100,' + (inn ? 0.95 : 0.7) + ')'; c.lineWidth = 2; c.setLineDash([7, 6]); c.lineDashOffset = -t * 14; c.beginPath(); c.arc(f.x, f.y, R, 0, 6.2832); c.stroke();
      c.restore();
    }
  };

  // ---- Items ordenados por y: estalagmitas y hogueras
  function drawPillar(c, x, y, o) {
    o = o || {};
    var sh = o.shake > 0 ? (Math.random() * 2 - 1) * 2 : 0, h = o.h || 58, w = (o.r || 22) * 1.15, bx = x + sh, by = y + 10, al = o.alpha == null ? 1 : o.alpha;
    c.save(); c.globalAlpha = al;
    c.fillStyle = 'rgba(8,16,40,0.45)'; c.beginPath(); c.ellipse(x, by - 2, w * 1.05, w * 0.42, 0, 0, 6.2832); c.fill();
    c.lineJoin = 'round'; c.lineWidth = 3; c.strokeStyle = '#1b1124';
    // masa principal + dos picos laterales
    c.fillStyle = '#4a8fd0';
    c.beginPath(); c.moveTo(bx - w, by); c.lineTo(bx - w * 0.78, by - h * 0.46); c.lineTo(bx - w * 0.3, by - h * 0.78); c.lineTo(bx + w * 0.05, by - h); c.lineTo(bx + w * 0.42, by - h * 0.7); c.lineTo(bx + w * 0.82, by - h * 0.4); c.lineTo(bx + w, by); c.closePath(); c.fill(); c.stroke();
    c.fillStyle = '#7fc4f0'; c.beginPath(); c.moveTo(bx - w * 0.78, by - h * 0.46); c.lineTo(bx - w * 0.3, by - h * 0.78); c.lineTo(bx + w * 0.05, by - h); c.lineTo(bx - w * 0.04, by - h * 0.3); c.lineTo(bx - w * 0.5, by - h * 0.05); c.closePath(); c.fill();
    c.fillStyle = '#d8f0ff'; c.beginPath(); c.moveTo(bx - w * 0.3, by - h * 0.78); c.lineTo(bx + w * 0.05, by - h); c.lineTo(bx - w * 0.06, by - h * 0.5); c.closePath(); c.fill();
    c.strokeStyle = 'rgba(232,248,255,0.8)'; c.lineWidth = 1.2; c.beginPath(); c.moveTo(bx + w * 0.2, by - h * 0.55); c.lineTo(bx + w * 0.34, by - h * 0.1); c.stroke();
    if (o.eyes) {   // Estalagmita viva: ojos rojizos TENUES (las inertes del jefe tendrán un brillo azul liso)
      var pu = 0.45 + 0.2 * Math.sin((o.t || 0) / 380);
      c.fillStyle = 'rgba(255,70,60,' + pu + ')'; c.beginPath(); c.arc(bx - 5, by - h * 0.34, 2.2, 0, 6.2832); c.arc(bx + 6, by - h * 0.34, 2.2, 0, 6.2832); c.fill();
    }
    c.restore();
  }
  T.drawPillar = drawPillar;
  function drawPillarItem(c, it) { var o = it.o; drawPillar(c, o.x, o.y, { shake: o.shake, r: o.r }); }
  function drawFireItem(c, it) {
    var f = it.o, t = performance.now(), x = f.x, y = f.y + 6;
    c.save();
    c.fillStyle = 'rgba(8,4,14,0.4)'; c.beginPath(); c.ellipse(x, y + 4, 22, 8, 0, 0, 6.2832); c.fill();
    c.lineWidth = 3; c.strokeStyle = '#1b1124'; c.lineCap = 'round';
    for (var k = 0; k < 3; k++) { var a = -0.5 + k * 0.5 + 3.14 * (k % 2); c.save(); c.translate(x, y); c.rotate(a * 0.55); c.fillStyle = k === 1 ? '#6b4426' : '#7a4f2a'; c.fillRect(-15, -3, 30, 6); c.strokeRect(-15, -3, 30, 6); c.restore(); }
    c.restore();
    try { Assets.drawTorchFire(c, x, y + 4, t, { scale: 1.5, lightScale: 4.6 }); } catch (e) { /* sin llama */ }
  }
  T.items = function (list) {
    var i, o, cx = G.cam.x, cy = G.cam.y, vw = G.W, vh = G.VH;
    for (i = 0; i < pillars.length; i++) { o = pillars[i]; if (o.dead || o.x < cx - 60 || o.x > cx + vw + 60 || o.y < cy - 80 || o.y > cy + vh + 100) continue; list.push({ y: o.y + 8, ux: o.x, uy: o.y, draw: drawPillarItem, o: o }); }
    for (i = 0; i < fires.length; i++) { o = fires[i]; if (o.x < cx - 100 || o.x > cx + vw + 100 || o.y < cy - 100 || o.y > cy + vh + 100) continue; list.push({ y: o.y + 6, ux: o.x, uy: o.y, draw: drawFireItem, o: o }); }
  };

  // ================================================================= VENTISCA: bruma de pantalla (se dibuja tras el mundo y ANTES de las telegrafías)
  var tileCache = {}, edgeCache = null;
  function snowTile(n) {
    if (tileCache[n]) return tileCache[n];
    var c = cv(256, 256), g = c.getContext('2d'), r = rng(900 + n), i; g.lineCap = 'round';
    for (i = 0; i < n; i++) {
      var x = r() * 256, y = r() * 256, l = 14 + r() * 26; g.strokeStyle = 'rgba(240,248,255,' + (0.35 + r() * 0.4) + ')'; g.lineWidth = r() < 0.25 ? 2 : 1;
      for (var wx = -256; wx <= 256; wx += 256) for (var wy = -256; wy <= 256; wy += 256) { g.beginPath(); g.moveTo(x + wx, y + wy); g.lineTo(x + wx - l * 0.5, y + wy + l * 0.86); g.stroke(); }
    }
    tileCache[n] = c; return c;
  }
  function edgeCanvas() {   // Baja calidad: degradado estático en los bordes (cero partículas)
    if (edgeCache) return edgeCache;
    var c = cv(G.W, G.H), g = c.getContext('2d'), gr = g.createRadialGradient(G.W / 2, G.H / 2, 200, G.W / 2, G.H / 2, 600);
    gr.addColorStop(0, 'rgba(225,238,255,0)'); gr.addColorStop(1, 'rgba(225,238,255,' + BZ.edgeA + ')'); g.fillStyle = gr; g.fillRect(0, 0, G.W, G.H);
    edgeCache = c; return c;
  }
  T.hazeAlpha = function () { return BZS.a; };
  T.drawHaze = function (c) {
    var Q = G.Q, p = G.player, K = G.Proj.K, sx = p.x - G.cam.x, sy = (p.y - G.cam.y) * K, W = G.W, H = G.H, a = BZS.a, cr = BZ.clearR + (T.opts.light ? BZ.lightR : 0);
    var t = G.time / 1000;
    if (Q.level === 'baja') { c.save(); c.globalAlpha = Math.min(1, a / BZ.edgeA); c.drawImage(edgeCanvas(), 0, 0); c.restore(); return; }
    c.save();
    // bruma: transparente dentro de cr, sube hasta edgeA a edgeR (+80 con "Ventisca ligera")
    var gr = c.createRadialGradient(sx, sy, cr, sx, sy, BZ.edgeR + (cr - BZ.clearR));
    gr.addColorStop(0, 'rgba(225,238,255,0)'); gr.addColorStop(1, 'rgba(225,238,255,' + a.toFixed(3) + ')');
    c.fillStyle = gr; c.fillRect(0, 0, W, H);
    // rayas de nieve en diagonal (loseta desplazándose); inclinación del viento de 20 grados durante las ráfagas
    var n = Q.level === 'media' ? 6 : 15, tile = snowTile(n), pat = c.createPattern(tile, 'repeat');
    if (pat) {
      var tilt = BZ.tilt * Math.PI / 180 * BZS.k, sp = 90 + 260 * BZS.k, ox = (t * sp * 0.5) % 256, oy = (t * sp * 0.86) % 256;
      for (var ring = 0; ring < (Q.level === 'media' ? 1 : 2); ring++) {
        c.save(); c.beginPath(); c.rect(0, 0, W, H); c.arc(sx, sy, cr + ring * 95, 0, 6.2832, true); c.clip('evenodd');
        c.translate(W / 2, H / 2); c.rotate(tilt); c.translate(ox - W / 2 - 256, oy - H / 2 - 256);   // la loseta baja y a la izquierda
        c.globalAlpha = Math.min(1, a * (Q.level === 'media' ? 1.9 : 1.1)); c.fillStyle = pat; c.fillRect(-700, -700, W + 1400, H + 1400);
        c.restore();
      }
    }
    c.restore();
  };

  // ================================================================= VIÑETA DE FRÍO + HUD
  var frostCache = null;
  function frostCanvas() {
    if (frostCache) return frostCache;
    var c = cv(G.W, G.H), g = c.getContext('2d'), r = rng(555), W = G.W, H = G.H;
    var corners = [[0, 0], [W, 0], [0, H], [W, H]];
    corners.forEach(function (q) {
      var gr = g.createRadialGradient(q[0], q[1], 10, q[0], q[1], 330); gr.addColorStop(0, 'rgba(225,244,255,0.95)'); gr.addColorStop(0.5, 'rgba(160,210,250,0.4)'); gr.addColorStop(1, 'rgba(120,180,240,0)');
      g.fillStyle = gr; g.fillRect(0, 0, W, H);
    });
    // cristales de escarcha en las esquinas
    for (var i = 0; i < 130; i++) {
      var q2 = corners[i % 4], a = r() * 6.2832, d = r() * 260, x = q2[0] + Math.cos(a) * d * (q2[0] ? -1 : 1) * Math.abs(Math.cos(a)), y = q2[1] + Math.sin(a) * d * (q2[1] ? -1 : 1) * Math.abs(Math.sin(a)), l = 8 + r() * 22;
      g.strokeStyle = 'rgba(245,252,255,' + (0.35 + r() * 0.5) + ')'; g.lineWidth = 1 + r(); g.beginPath();
      for (var k = 0; k < 3; k++) { var aa = a + k * 1.0472; g.moveTo(x - Math.cos(aa) * l, y - Math.sin(aa) * l); g.lineTo(x + Math.cos(aa) * l, y + Math.sin(aa) * l); }
      g.stroke();
    }
    frostCache = c; return c;
  }
  var vigCache = null;
  T.drawVignette = function (c) {
    var Q = G.Q, v = G.cold.v, a;
    if (Q.vig) { if (!vigCache) { vigCache = cv(G.W, G.H); var g = vigCache.getContext('2d'), gr = g.createRadialGradient(G.W / 2, G.H / 2, 220, G.W / 2, G.H / 2, 620); gr.addColorStop(0, 'rgba(6,14,36,0)'); gr.addColorStop(1, 'rgba(6,14,36,0.62)'); g.fillStyle = gr; g.fillRect(0, 0, G.W, G.H); } c.drawImage(vigCache, 0, 0); }
    // escarcha en las esquinas: >= 40 % empieza, 100 % cubre (la Escarcha mantiene un mínimo visible)
    a = G.cold.frozenT > 0 ? 0.85 : G.clamp((v - CD.warn) / (100 - CD.warn), 0, 1) * 0.75;
    if (a > 0.02) { c.save(); c.globalAlpha = a; c.drawImage(frostCanvas(), 0, 0); c.restore(); }
  };
  T.drawHud = function (c) {
    if (!T.on || !coldOn) return;
    var k = G.cold, x = 16, y = 42, w = 140, h = 10, f = G.clamp(k.v / 100, 0, 1), st = T.state();
    c.fillStyle = 'rgba(10,6,18,0.8)'; c.fillRect(x - 3 + 22, y - 3, w + 6, h + 6);
    c.fillStyle = '#12243f'; c.fillRect(x + 22, y, w, h);
    var gr = c.createLinearGradient(x + 22, 0, x + 22 + w, 0); gr.addColorStop(0, '#6ac8ff'); gr.addColorStop(0.7, '#bfeaff'); gr.addColorStop(1, '#ffffff');
    c.fillStyle = st === 'escarcha' ? '#e8f6ff' : st === 'helado' ? '#d8f0ff' : G.fg(gr, '#9fd8ff'); c.fillRect(x + 22, y, w * f, h);
    c.fillStyle = 'rgba(255,255,255,0.2)'; c.fillRect(x + 22, y, w * f, 3);
    c.fillStyle = 'rgba(10,6,18,0.9)'; c.fillRect(x + 22 + w * CD.warn / 100 - 1, y - 2, 2, h + 4); c.fillRect(x + 22 + w * CD.helado / 100 - 1, y - 2, 2, h + 4);   // marcas de 40 % y 70 %
    // icono (arte: icon_frio) + número
    if (G.hasSpr('icon_frio')) { var ic = Assets.sprite('icon_frio', 0), is = 20; c.drawImage(ic, x, y + h / 2 - is / 2, is, is); }
    else { c.strokeStyle = '#bfeaff'; c.lineWidth = 2; c.beginPath(); for (var q = 0; q < 3; q++) { var a = q * 1.0472; c.moveTo(x + 10 + Math.cos(a) * 8, y + 5 + Math.sin(a) * 8); c.lineTo(x + 10 - Math.cos(a) * 8, y + 5 - Math.sin(a) * 8); } c.stroke(); }
    var warm = k.hearth, lab = st === 'escarcha' ? 'ESCARCHA ' + Math.ceil(k.frozenT / 1000) + 's' : st === 'helado' ? 'HELADO' : warm ? 'CALOR' : '';
    G.txt(c, Math.round(k.v) + '%', x + 22 + w + 8, y + 6, 12, st === 'ok' ? '#d8f0ff' : '#ffffff', 'left');
    if (lab) G.txt(c, lab, x + 22, y + 22, 10, st === 'escarcha' ? '#bfeaff' : warm ? '#ffb347' : '#9fd8ff', 'left');
  };
})();
