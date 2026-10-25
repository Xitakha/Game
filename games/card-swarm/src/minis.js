/* minis.js - Minijefes por bioma (fase P4.5, DESIGN-v6-minijefes.md): 2 por bioma (slot 1 a 3:30 = presión, slot 2 a 5:30 = control).
   Aquí vive el NÚCLEO: tabla G.B.minis (datos de los 8 minijefes + 2 reservas del Panal), director (cola de slots), motor de IA basado en datos
   (bolsa de ataques, telegrafía -> acción -> recuperación, enrage al 50 %, ventanas de exposición), parte rompible genérica (G.Minis.onHit),
   botín / Insignias, barra grande de guardián, dibujo (sprite por pose + fallback teñido) y depuración. Los 25 ataques viven en minis_atk.js.
   URL: ?minis=0 (guardián legado de v5: mini_bulwark / mini_hive, idéntico a v5) | ?minis=1 (por defecto) | ?mini=<id> (salta a ese minijefe: carnero, tejedora, alcaide, centinela, hidra, planidera, yeti_mayor, ventisquero).
   Reglas comunes: telegrafía >= 400 ms y >= 250 + 1000 x salida / 190 (+220 en la Tundra), >= 800 ms si el golpe hace >= 25, HIT_CAP 32, máx. 3 adds por minijefe, nunca dos a la vez ni dentro de MINI_LAST. */
(function () {
  'use strict';
  var G = window.G, B = G.B, E = G.Enemies, fx = G.fx, H = E.H, DEG = Math.PI / 180;
  var M = G.Minis = {};
  var q1 = /[?&]minis=(\d)/.exec(location.search);
  M.on = !(q1 && q1[1] === '0');                       // ?minis=0 -> guardián legado
  G.miniUrl = (/[?&]mini=(\w+)/.exec(location.search) || [])[1] || null;
  M.HIT_CAP = 32; M.MAX_ADDS = 3;
  M.ATK = {};                                          // M.ATK[id][nombre] = ataque (minis_atk.js)

  // ================================================================= DATOS
  // pct = fracción del HP máximo que aguanta la parte. mode: 'share' (fracción `share` de TODO el daño recibido), 'frontal' (daño frontal bloqueado; fire:true = también cualquier Fuego),
  // 'core' (solo con el pecho abierto, daño base x2), 'head' (cabeza de la Hidra: x1,15 del daño recibido mientras la cabeza existe).
  var D = {
    carnero: { id: 'carnero', name: 'CARNERO MAYOR', sub: 'Morueco del Pastor', role: 'PRESIÓN', biome: 'bosque', slot: 1, hp: 2500, spd: 48, spdE: 62, r: 26, dmg: 22, foot: 26, shadow: 1.9, gap: 1000, gapE: 650, expMul: 1.4,
      mat: 'lana', contact: 0.5, part: { key: 'cuernos', name: 'CUERNOS', pct: 0.24, mode: 'share', share: 0.45 }, bag: ['cornada', 'balido', 'embestida'],
      guaranteed: { static: 3, plate: 2, thread: 2 }, bonus: { static: 2 }, ins: { id: 'trophy_mini_carnero', name: 'Insignia de Cuerno' }, xp: 30, ash: 20, spr: 'enemy_mini_carnero',
      fb: { spr: 'enemy_mini_bulwark', tint: '#e8e4d4', a: 0.45, kind: 'sol', sc: 1.1 }, lore: 'El morueco más viejo del rebaño. El Pastor le dejó los cuernos de hierro negro para que le abra camino.' },
    tejedora: { id: 'tejedora', name: 'TEJEDORA DE ZARZAS', sub: 'Tejedora del Bosque quemado', role: 'CONTROL', biome: 'bosque', slot: 2, hp: 3000, spd: 34, spdE: 42, r: 24, dmg: 14, foot: 28, shadow: 2, gap: 2200, gapE: 1500, expMul: 1.4,
      mat: 'vegetal', kite: [200, 280], contact: 0.4, part: { key: 'raiz', name: 'RAÍZ MADRE', pct: 0.22, mode: 'share', share: 0.40 }, bag: ['raices', 'floracion', 'maranya'],
      guaranteed: { frost: 3, thread: 3, feather: 1 }, bonus: { frost: 2 }, ins: { id: 'trophy_mini_tejedora', name: 'Insignia de Raíz' }, xp: 40, ash: 25, spr: 'enemy_mini_tejedora',
      noSpawn: ['sower'], fb: { spr: 'enemy_mini_hive', tint: '#3a5a2a', a: 0.55, kind: 'flo', sc: 1 }, lore: 'Hiló su red con las espinas del bosque quemado; lo que se enreda en ella alimenta a las zarzas.' },
    alcaide: { id: 'alcaide', name: 'ALCAIDE DE HIERRO', sub: 'Guardián de las celdas vacías', role: 'PRESIÓN', biome: 'cripta', slot: 1, hp: 2600, spd: 44, spdE: 59, r: 24, dmg: 22, foot: 30, shadow: 1.9, gap: 1000, gapE: 600, expMul: 1.5,
      mat: 'metal', contact: 0.5, shield: true, part: { key: 'escudo', name: 'ESCUDO-REJA', pct: 0.30, mode: 'frontal' }, bag: ['reja', 'llavero', 'grilletes'],
      guaranteed: { spine: 3, plate: 2, thread: 2 }, bonus: { plate: 2 }, ins: { id: 'trophy_mini_alcaide', name: 'Llave del Alcaide' }, xp: 30, ash: 20, spr: 'enemy_mini_alcaide', escort: { role: 'shield', n: 2 }, noSpawn: ['shield'],
      fb: { spr: 'enemy_mini_bulwark', tint: '#7d8aa8', a: 0.3, kind: 'sol', sc: 1 }, lore: 'Guardó las llaves de mil celdas; ahora las lleva al cinto y no le pesan: las celdas están vacías.' },
    centinela: { id: 'centinela', name: 'CENTINELA DE BRASA', sub: 'Soldado de guardia encendido', role: 'CONTROL', biome: 'cripta', slot: 2, hp: 2900, spd: 40, spdE: 52, r: 24, dmg: 22, foot: 30, shadow: 1.9, gap: 1400, gapE: 900, expMul: 1.5,
      mat: 'magma', contact: 0.5, part: { key: 'nucleo', name: 'NÚCLEO', pct: 0.20, mode: 'core' }, bag: ['arremetida', 'abanico', 'erupcion'],
      guaranteed: { frost: 3, feather: 2, thread: 2 }, bonus: { frost: 2 }, ins: { id: 'trophy_mini_centinela', name: 'Brasa Latente' }, xp: 40, ash: 25, spr: 'enemy_mini_centinela',
      fb: { spr: 'enemy_mini_bulwark', tint: '#c4501a', a: 0.62, kind: 'sol', sc: 1 }, lore: 'Soldado de guardia que no se enteró de que su fuego se apagó; el magma le sale por las juntas.' },
    hidra: { id: 'hidra', name: 'HIDRA JOVEN', sub: 'Cría de Letea', role: 'PRESIÓN', biome: 'asfodelo', slot: 1, hp: 2400, spd: 52, spdE: 68, r: 24, dmg: 20, foot: 22, shadow: 2, gap: 1100, gapE: 700, expMul: 1.3,
      mat: 'pantano', mx: { fire: 1.25 }, contact: 0.4, part: { key: 'cabeza', name: 'CABEZA', pct: 0.25, mode: 'head' }, bag: ['mordisco', 'escupitajo', 'sumersion', 'coletazo'],
      guaranteed: { plate: 3, feather: 2, thread: 2 }, bonus: { plate: 1 }, ins: { id: 'trophy_mini_hidra', name: 'Escama Joven' }, xp: 30, ash: 20, spr: 'enemy_mini_hidra', noSpawn: ['leech', 'headlet'],
      fb: { spr: 'enemy_mini_hive', tint: '#2f6f6a', a: 0.6, kind: 'flo', sc: 1 }, lore: 'Una cría de Letea que mordió antes de aprender a nadar; sus cuellos aún no saben cuántos son.' },
    planidera: { id: 'planidera', name: 'PLAÑIDERA ANEGADA', sub: 'Llorona del río', role: 'CONTROL', biome: 'asfodelo', slot: 2, hp: 3000, spd: 38, spdE: 46, r: 24, dmg: 14, foot: 28, shadow: 2, gap: 2600, gapE: 1900, expMul: 1.4,
      mat: 'espectro', kite: [150, 230], contact: 0.4, part: { key: 'velo', name: 'VELO', pct: 0.28, mode: 'share', share: 0.55 }, bag: ['lluvia', 'marea', 'coro'],
      guaranteed: { static: 3, feather: 2, thread: 2 }, bonus: { static: 2 }, ins: { id: 'trophy_mini_planidera', name: 'Velo Anegado' }, xp: 40, ash: 25, spr: 'enemy_mini_planidera',
      fb: { spr: 'enemy_mini_hive', tint: '#2f9a9a', a: 0.62, kind: 'flo', sc: 1 }, lore: 'Lloró tanto en el río que el río la lloró de vuelta; ahora llora por todos los que olvidan.' },
    yeti_mayor: { id: 'yeti_mayor', name: 'YETI MAYOR', sub: 'El más viejo de la manada', role: 'PRESIÓN', biome: 'tundra', slot: 1, hp: 2500, spd: 46, spdE: 62, r: 28, dmg: 22, foot: 30, shadow: 1.9, gap: 1000, gapE: 650, expMul: 1.5, vsc: 1.25,
      mat: 'escarcha', contact: 0.5, shield: true, ice: true, part: { key: 'placa', name: 'PLACA DE HIELO', pct: 0.30, mode: 'frontal', fire: true }, bag: ['empellon', 'pisoton', 'derrape'],
      guaranteed: { wick: 3, plate: 2, thread: 2 }, bonus: { wick: 2 }, ins: { id: 'trophy_mini_yeti_mayor', name: 'Garra del Yeti Mayor' }, xp: 30, ash: 20, spr: 'enemy_mini_yeti', escort: { role: 'worm', n: 2 }, noSpawn: ['shield'],
      fb: { spr: 'enemy_mini_bulwark', tint: '#9fd8ff', a: 0.5, kind: 'sol', sc: 1 }, lore: 'El yeti más viejo de la manada; su placa de hielo es un casco que lleva puesto desde el último invierno.' },
    ventisquero: { id: 'ventisquero', name: 'VENTISQUERO', sub: 'Copo de viento viejo', role: 'CONTROL', biome: 'tundra', slot: 2, hp: 2800, spd: 38, spdE: 46, r: 24, dmg: 14, foot: 28, shadow: 2, gap: 2600, gapE: 1900, expMul: 1.4,
      mat: 'escarcha', kite: [150, 230], ice: true, contact: 0.4, part: { key: 'corazon', name: 'CORAZÓN DE HIELO', pct: 0.28, mode: 'share', share: 0.55 }, bag: ['carambanos', 'ventisca', 'ola'],
      guaranteed: { spine: 3, feather: 2, thread: 2 }, bonus: { spine: 2 }, ins: { id: 'trophy_mini_ventisquero', name: 'Esquirla de Corazón' }, xp: 40, ash: 25, spr: 'enemy_mini_ventisquero',
      fb: { spr: 'enemy_mini_hive', tint: '#bfe4ff', a: 0.4, kind: 'flo', sc: 1 }, lore: 'Un copo de viento viejo que olvidó cómo caer; allí donde pasa, el invierno se queda un rato más.' },
    // ---- Reserva del Panal (P5/P6): SOLO datos inactivos, no se registran como tipos ni se programan
    avispon: { id: 'avispon', reserve: true, name: 'AVISPÓN REAL', sub: 'Guardaespaldas de Melaria', role: 'PRESIÓN', biome: 'panal', slot: 1, hp: 2300, spd: 78, spdE: 100, r: 22, dmg: 24, mat: 'insecto', part: { key: 'aguijon', name: 'AGUIJÓN', pct: 0.24, mode: 'share', share: 0.45 },
      guaranteed: { spine: 3, thread: 2, feather: 2 }, bonus: { spine: 2 }, ins: { id: 'trophy_mini_avispon', name: 'Aguijón Real' }, spr: 'enemy_mini_avispon' },
    reina_joven: { id: 'reina_joven', reserve: true, name: 'REINA JOVEN', sub: 'Crisálida de Melaria', role: 'CONTROL', biome: 'panal', slot: 2, hp: 2900, spd: 38, spdE: 46, r: 24, dmg: 14, mat: 'insecto', part: { key: 'abdomen', name: 'ABDOMEN', pct: 0.28, mode: 'share', share: 0.40 },
      guaranteed: { frost: 3, thread: 3, feather: 1 }, bonus: { thread: 2 }, ins: { id: 'trophy_mini_reina_joven', name: 'Corona de Cera' }, spr: 'enemy_mini_reina_joven' }
  };
  var AT = { 1: 210000, 2: 330000 };
  B.minis = {
    bosque:   { ready: true,  slot1: { id: 'carnero',   at: AT[1] }, slot2: { id: 'tejedora',    at: AT[2] } },
    cripta:   { ready: true,  slot1: { id: 'alcaide',   at: AT[1] }, slot2: { id: 'centinela',   at: AT[2] } },
    asfodelo: { ready: true,  slot1: { id: 'hidra',     at: AT[1] }, slot2: { id: 'planidera',   at: AT[2] } },
    tundra:   { ready: true,  slot1: { id: 'yeti_mayor', at: AT[1] }, slot2: { id: 'ventisquero', at: AT[2] } },
    panal:    { ready: false, slot1: { id: 'avispon',   at: AT[1] }, slot2: { id: 'reina_joven', at: AT[2] } },   // reserva P5/P6: ready:false = guardián legado
    def: D
  };
  M.IDS = Object.keys(D).filter(function (k) { return !D[k].reserve; });
  M.BIOME_OF = {}; M.IDS.forEach(function (k) { M.BIOME_OF[k] = D[k].biome; });

  // Se registran como tipos élite 'mini_<id>' (from: Infinity, w: 0: el director normal nunca los elige; waves.js los salta por .mini)
  M.IDS.forEach(function (id) {
    var d = D[id];
    B.enemy['mini_' + id] = { hp: d.hp, spd: d.spd, dmg: d.dmg, r: d.r, cost: 0, from: Infinity, w: 0, spr: d.spr, xp: d.xp, ash: d.ash, elite: true, mini: true, mid: id, slot: d.slot, at: AT[d.slot], name: d.name };
  });
  // Vaina de esporas de la Tejedora (add): no la elige el director (famOnly + from Infinity)
  B.enemy.mini_pod = { hp: 90, spd: 0, dmg: 0, r: 14, cost: 0, from: Infinity, w: 0, spr: 'enemy_mini_pod', xp: 0, ash: 0, maxAlive: 2, famOnly: true };

  // Botín y bonus por romper la parte: por tipo (loot.js los lee por e.type)
  M.IDS.forEach(function (id) {
    var d = D[id], L = G.Loot;
    L.GUARANTEED['mini_' + id] = { parts: d.guaranteed, rare: 0.35 };
    L.MINI_PART_BONUS['mini_' + id] = d.bonus;
  });

  // ================================================================= UTILIDADES
  var sfxSet = null, sfxN = -1;
  function hasSfx(n) { try { var l = Assets.sfxNames(); if (l.length !== sfxN) { sfxN = l.length; sfxSet = {}; l.forEach(function (k) { sfxSet[k] = 1; }); } return !!sfxSet[n]; } catch (x) { return false; } }
  // sonido del minijefe con respaldo: si el SFX nuevo aún no existe se usa el genérico
  M.snd = function (n, fb, o) { if (hasSfx(n)) G.sfx(n, o); else if (fb) G.sfx(fb, o); };
  M.stg = function (n) { try { if (hasSfx(n)) G.Snd.play(n, 1); } catch (x) { /* audio opcional */ } };
  function atkLog(e, n) { if (G.dbg) { var A = G.dbg.atk || (G.dbg.atk = {}), k = 'mini_' + e.mid + ':' + n; A[k] = (A[k] || 0) + 1; } }
  function shuffle(a) { for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)), t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
  M.hurt = function (e, p, dmg, name, kb, o) {
    if (p.dead) return false;
    dmg = Math.min(M.HIT_CAP, dmg);
    return G.Player.hurt(p, dmg, e.x, e.y, Object.assign({ src: 'mini_' + e.mid + '_' + name, kb: kb == null ? 1 : kb }, o || {}));
  };
  M.addsAlive = function (e) { var n = 0; for (var i = 0; i < G.enemies.length; i++) { var q = G.enemies[i]; if (!q.dead && q.mown === e) n++; } return n; };
  // add del minijefe (tope de 3 vivos). Devuelve el enemigo o null si el tope se alcanzó (el ataque sigue haciendo su efecto sin spawn)
  M.addAdd = function (e, role, x, y, o) {
    if (M.addsAlive(e) >= M.MAX_ADDS) return null;
    if (role !== 'mini_pod' && !B.has(role)) role = 'worm';
    var m = G.WALL + 20, q = E.spawn(role, G.clamp(x, m, G.AW - m), G.clamp(y, m, G.AH - m), Object.assign({ summoned: true, src: e, spawnT: 450 }, o || {}));
    q.mown = e; return q;
  };
  M.expose = function (e, ms, mul) {
    e.expT = Math.max(e.expT || 0, ms); e.expMul = mul; e.expMax = Math.max(e.expMax || 0, ms);
    fx.ring(e.x, e.y, 10, e.r + 26, 350, '#ffe27a', 3); M.snd('mini_expose_chime', 'card_select', { pitch: 1.6, vol: 0.5 });
  };
  function miniHeart(e) { G.Combat.dropGem(e.x + 20, e.y + 14, 'heart', B.player.heal); }
  function clampArena(x, y, m) { return [G.clamp(x, G.WALL + m, G.AW - G.WALL - m), G.clamp(y, G.WALL + m, G.AH - G.WALL - m)]; }
  M.clampArena = clampArena;

  // ================================================================= INICIALIZACIÓN (la llama E.spawn para los tipos .mini)
  M.init = function (e, d) {
    var De = D[d.mid]; e.D = De; e.mid = De.id; e.mini = true; e.big = true; e.slot = De.slot;
    e.spawnT = e.spawnMax = 900; e.atkT = 1800; e.bag = []; e.cd = {}; e.enraged = false; e.expT = 0; e.expMul = 1; e.expMax = 0; e.age = 0; e.stage = 0;
    e.foot = De.foot; e.shadow = De.shadow; e.vsc = De.vsc || 1; e.hitCd = 0; e.pvx = 0; e.pvy = 0; e.dmgIn = 1; e.spdMul = 1; e.recDur = 0;
    var P = De.part; e.part = { key: P.key, name: P.name, mode: P.mode, max: P.pct * e.maxHp, hp: P.pct * e.maxHp, broken: false, flash: 0, cracked: 0 };
    if (De.shield) { e.shield = 70 * DEG; e.fa = 0; e.shieldDown = false; }
    if (B.mat.on && De.mat) { e.mat = De.mat; e.mx = De.mx || null; }
    if (De.ice) e.tau = 300;
    if (De.init) De.init(e);
    return e;
  };

  // ================================================================= DIRECTOR (cola de slots)
  // El slot k entra con vt >= at_k (o adelantado por el encargo activo a 2:30), sin otro minijefe vivo, con el slot anterior ya salido y >= 10 s muerto,
  // y antes de BOSS_T - MINI_LAST (si no, se omite). W.elitesDone guarda 'mini1' / 'mini2'.
  M.cfg = function () { var c = B.minis[G.curBiome]; return c && c.ready && !c.slot1.reserve ? c : null; };
  M.active = function () { return M.on && !!M.cfg(); };
  M.reset = function () { M.deadAt = -1e9; M.forced = false; M.spawned = {}; };
  M.reset();
  M.direct = function (dt, vt, qt) {
    var W = G.Waves, cfg = M.cfg(), k, key, sl;
    if (G.miniUrl && !M.forced) {   // ?mini=<id>: sale ese minijefe nada más empezar
      M.forced = true; W.elitesDone.mini1 = W.elitesDone.mini2 = true;
      if (D[G.miniUrl] && !D[G.miniUrl].reserve) M.spawn(G.miniUrl);
      return;
    }
    for (k = 1; k <= 2; k++) {
      key = 'mini' + k; if (W.elitesDone[key]) continue;
      sl = cfg['slot' + k];
      if (vt < (qt === 'slot' + k ? Math.min(sl.at, G.Quests.EARLY) : sl.at)) return;
      if (G.runT >= G.BOSS_T - W.MINI_LAST) { W.elitesDone[key] = 'omitido'; continue; }
      if (E.minis().length) return;
      if (k === 2 && G.time - M.deadAt < 10000) return;    // el banner, la cura y la recogida del botín no se solapan
      M.spawn(sl.id); return;
    }
  };
  M.spawn = function (id, pos) {
    var d = D[id], W = G.Waves; if (!d) return null;
    W.elitesDone['mini' + d.slot] = true; M.spawned[id] = true;
    pos = pos || W.spawnPos();
    var e = E.spawn('mini_' + id, pos[0], pos[1]);
    if (d.escort) for (var i = 0; i < d.escort.n; i++) {   // escoltas de entrada: cuentan para el tope de 3 adds (no son 'summoned': sueltan botín como siempre)
      var role = B.has(d.escort.role) ? d.escort.role : 'worm', q = E.spawn(role, pos[0] + (i ? -45 : 45), pos[1] + 20); q.mown = e; q.src = e;
    }
    e.banner = 2000;
    G.Hud.banner('¡GUARDIÁN: ' + d.name + '!', 2000, '#ffb347');
    M.snd('mini_spawn_roar', 'boss_roar', { pitch: 1.3, vol: 0.6 }); M.stg('stg_mini_spawn');
    W.eliteBoost = 25000;
    return e;
  };
  // los roles normales que se suspenden mientras vive (noSpawn)
  M.suppressed = function (role) {
    for (var i = 0; i < G.enemies.length; i++) { var q = G.enemies[i]; if (!q.dead && q.mini && q.D.noSpawn && q.D.noSpawn.indexOf(role) >= 0) return true; }
    return false;
  };
  // ?mini=<id> sin ?biome=: el bioma sale del minijefe
  M.urlBiome = function () { return G.miniUrl && M.BIOME_OF[G.miniUrl] ? M.BIOME_OF[G.miniUrl] : null; };

  // ================================================================= MOTOR DE IA
  var X = { p: null, d: 0, a: 0, s: 0, dt: 0 };
  M.X = X;
  function atkOf(e, n) { return (M.ATK[e.mid] || {})[n]; }
  function val(v, e) { return typeof v === 'function' ? v(e) : v; }
  function pickAtk(e) {
    if (e.force) { var f = e.force; e.force = null; var A0 = atkOf(e, f); if (A0) { e.lastAtk = f; return A0; } }
    var names = e.D.bag, i, n, A;
    if (!e.bag.length) e.bag = shuffle(names.slice());
    for (i = 0; i < e.bag.length; i++) {
      n = e.bag[i]; A = atkOf(e, n);
      if (!A || (A.off && A.off(e))) { e.bag.splice(i, 1); i--; continue; }
      if ((n === e.lastAtk && e.bag.length > 1) || e.cd[n] > 0 || (A.ok && !A.ok(e, X.d))) continue;
      e.bag.splice(i, 1); e.lastAtk = n; return A;
    }
    return null;
  }
  M.begin = function (e, A) {
    e.atk = A; e.stage = 0; e.st = 'tele'; e.t = 0; e.hitDone = false; e.trav = 0;
    e.cd[A.name] = val(A.cd, e) || 0; e.nAtk = (e.nAtk || 0) + 1; atkLog(e, A.name);
    if (A.start) A.start(e, X);
    e.teleMs = A.tele(e);
    if (A.sT) M.snd(A.sT[0], A.sT[1], { vol: 0.9 });
  };
  // segunda telegrafía (enrage: ataques dobles): vuelve al estado 'tele' con su propio tiempo
  M.restage = function (e) {
    e.stage++; e.st = 'tele'; e.t = 0; e.hitDone = false; e.teleMs = e.atk.tele(e);
    if (e.atk.start2) e.atk.start2(e, X); else if (e.atk.start) e.atk.start(e, X);
    if (e.atk.sT) M.snd(e.atk.sT[0], e.atk.sT[1], { vol: 0.9 });
  };
  // fin del ataque: recuperación (ms) con ventana opcional (expose = [ms, mul]); pose = animación de la recuperación
  M.endAtk = function (e, recMs, expose, pose) {
    var D0 = e.D;
    e.st = 'rec'; e.t = 0; e.recDur = recMs * (e.enraged ? (D0.recE || 0.7) : 1); e.recPose = pose || null; e.noSlide = false; if (e.slide) { e.vx = e.vy = 0; }
    if (expose) { e.shieldDown = true; M.expose(e, expose[0], expose[1]); e.recDur = Math.max(e.recDur, expose[0]); }
    if (e.atk && e.atk.cancel) e.atk.cancel(e);
  };
  function cancelAtk(e) { if (e.atk && e.atk.cancel) e.atk.cancel(e); e.atk = null; e.noSlide = false; }
  M.cancel = cancelAtk;
  function startEnrage(e) {
    var De = e.D; atkLog(e, 'enrage'); e.enraged = true; e.st = 'enrage'; e.t = 0; cancelAtk(e); e.shieldDown = false;
    fx.shake(9, 400); fx.ring(e.x, e.y, 20, 180, 600, '#ff4030', 6); fx.flames(e.x, e.y, 10, 30);
    M.snd('mini_enrage_roar', 'boss_roar', { pitch: 0.9, vol: 0.8 }); M.stg('stg_mini_enrage');
    G.Hud.banner('¡' + De.name + ' SE ENFURECE!', 1800, '#ff6a3a');
    if (De.onEnrage) De.onEnrage(e);
  }
  function walk(e) {
    var De = e.D, p = X.p, d = X.d, sp = e.spd * (e.enraged ? De.spdE / De.spd : 1) * e.spdMul;
    e.fa = X.a;
    if (De.kite) { var sv = e.spd; e.spd = sp; H.kite(e, X.a, d, De.kite[0], De.kite[1], X.s); e.spd = sv; }
    else if (d > e.r + p.r + 8) H.moveTo(e, X.a, sp, X.s);
    if (e.hitCd > 0) e.hitCd -= X.dt;
    else if (!p.dead && d < e.r + p.r + 3) { M.hurt(e, p, De.dmg * De.contact, 'contacto', 0.8); e.hitCd = 1000; }
  }
  function ai(e, dt, s, p, d, a) {
    var De = e.D, P = e.part, k;
    X.p = p; X.d = d; X.a = a; X.s = s; X.dt = dt;
    e.age += dt; if (e.banner > 0) e.banner -= dt;
    if (e.expT > 0) { e.expT -= dt; if (e.expT <= 0) e.expMul = 1; }
    if (P.flash > 0) P.flash -= dt;
    for (k in e.cd) if (e.cd[k] > 0) e.cd[k] -= dt;
    if (p.dead) return;
    // velocidad del jugador (para apuntar a su trayectoria)
    if (e.lpx != null && dt > 0) { e.pvx = (p.x - e.lpx) / dt * 1000; e.pvy = (p.y - e.lpy) / dt * 1000; } e.lpx = p.x; e.lpy = p.y;
    if (De.tick) De.tick(e, X);
    var st = e.st;
    if (st === 'move') {
      if (!e.enraged && e.hp <= e.maxHp * 0.5) { startEnrage(e); return; }
      walk(e);
      e.atkT -= dt;
      if (e.atkT <= 0) { var A = pickAtk(e); if (A) M.begin(e, A); else e.atkT = 250; }
    } else if (st === 'enrage') {
      e.t += dt; if (e.t >= 900) { e.st = 'move'; e.atkT = 400; if (De.afterEnrage) De.afterEnrage(e); }
    } else if (st === 'tele') {
      var A1 = e.atk, fix = A1.fix ? val(A1.fix, e) : 0;
      e.t += dt;
      if (A1.move) A1.move(e, X);
      if (e.t < e.teleMs - fix && A1.aim) A1.aim(e, X);
      if (e.t >= e.teleMs) { A1.fire(e, X); if (e.st === 'tele' && !e.restaged) { /* fire decidió quedarse */ } }
    } else if (st === 'run') {
      var A2 = e.atk; e.t += dt;
      if (A2.run) A2.run(e, dt, X);
    } else if (st === 'rec') {
      e.t += dt;
      if (e.atk && e.atk.recTick) e.atk.recTick(e, X);
      if (e.t >= e.recDur) { e.st = 'move'; e.shieldDown = false; e.atkT = (e.enraged ? De.gapE : De.gap) * (e.part.broken ? 0.85 : 1); if (e.atk && e.atk.recEnd) e.atk.recEnd(e); e.stunned = false; }
    }
  }
  E.AI.mini_hidra = E.AI.mini_carnero = E.AI.mini_tejedora = E.AI.mini_alcaide = E.AI.mini_centinela = E.AI.mini_planidera = E.AI.mini_yeti_mayor = E.AI.mini_ventisquero = ai;
  // pruebas / capturas: forceMini(e, 'embestida') encola ese ataque en el siguiente ciclo
  M.force = function (e, name) { e.force = name; e.atkT = 0; };

  // ================================================================= PARTE ROMPIBLE
  // Se llama desde Combat.deal / Combat.dot tras restar el HP. dmg = daño final recibido, pre = daño antes de reducirlo por el escudo (solo 'frontal'), blocked = golpe frontal bloqueado
  M.onHit = function (e, dmg, pre, blocked, tag) {
    if (e.isPod) { if (tag === 'fire') e.hp = 0; return; }
    var P = e.part, De = e.D, fill = 0;
    if (De.id === 'hidra' && e.wound && !e.wound.done && tag === 'fire') M.cauterHit(e, dmg);
    if (!P || P.broken || e.spawnT > 0) return;
    switch (P.mode) {
      case 'share': fill = dmg * (De.shareNow ? De.shareNow(e) : De.part.share); break;
      case 'frontal': fill = (blocked || (De.part.fire && tag === 'fire')) ? pre : 0; break;
      case 'core': fill = e.coreOpen ? dmg / (e.expMul || 1) * 2 : 0; break;
      case 'head': fill = dmg * 1.15; break;
    }
    if (fill <= 0) return;
    P.hp -= fill; P.flash = 90;
    var fr = P.hp / P.max;
    if (fr < 0.66 && P.cracked < 1) { P.cracked = 1; M.snd('yetim_plate_crack', null, { vol: 0.6 }); }
    if (fr < 0.33 && P.cracked < 2) { P.cracked = 2; M.snd('yetim_plate_crack', null, { vol: 0.7 }); }
    if (P.hp <= 0) M.breakPart(e);
    else if (blocked && De.shield && (!e.shSnd || G.time - e.shSnd > 160)) { e.shSnd = G.time; M.snd('warden_shield_hit', null, { vol: 0.4 }); }
  };
  M.breakPart = function (e) {
    var P = e.part, De = e.D; if (P.broken) return;
    P.broken = true; P.hp = 0; P.cracked = 3; P.flash = 0; e.coreOpen = false; e.shieldDown = false;
    cancelAtk(e); e.stage = 0;
    atkLog(e, 'parte_rota');
    fx.hit(80); fx.shake(8, 250); fx.burst(e.x, e.y, 16, De.fb.tint, 260, 600, 4, { add: true }); fx.ring(e.x, e.y, 10, 90, 400, '#ffd27a', 5);
    M.snd(De.sBreak || 'mini_part_break', 'boss_roar', { pitch: 1.7, vol: 0.6 }); M.stg('stg_mini_part');
    G.Hud.banner('¡' + P.name + ' ' + (/A$/.test(P.name.split(' ')[0]) ? 'ROTA' : 'ROTO') + '!', 1500, '#ffd27a');
    miniHeart(e); G.Loot.onMiniPart(e);
    M.dropInsignia(e);
    try { G.Quests.onMiniPart(e); } catch (x) { /* meta opcional */ }
    if (De.onBreak) De.onBreak(e);
  };

  // ================================================================= INSIGNIAS (trofeo menor, no cuenta como Esencia)
  M.dropInsignia = function (e) {
    if (G.mode === 'practice' || e.insDropped) return;
    e.insDropped = true;
    G.Combat.dropGem(e.x - 18, e.y + 10, 'insignia', 1); var g = G.gems[G.gems.length - 1]; g.ins = e.D.ins.id; g.mid = e.mid;
    M.snd('mini_insignia', null, { vol: 0.7 });
  };
  M.collectInsignia = function (g) {
    var S = G.Save.data; S.insignias = S.insignias || {};
    var id = g.ins, De = D[g.mid]; if (!De) return;
    var first = !S.insignias[g.mid]; S.insignias[g.mid] = (S.insignias[g.mid] || 0) + 1;
    try { var R = G.Loot.run; (R.insignias = R.insignias || []).push(g.mid); } catch (x) { /* run */ }
    try { G.Snd.play('gem', 2.2); G.Hud.banner('INSIGNIA: ' + De.ins.name.toUpperCase() + (first ? '  (¡NUEVA!)' : ''), 1800, '#e0c8ff'); } catch (x2) { /* hud */ }
    G.Save.save(); try { G.Ach.check(); } catch (x3) { /* logros */ }
  };
  M.insigniaCount = function () { var S = G.Save.data.insignias || {}, n = 0; M.IDS.forEach(function (k) { if (S[k]) n++; }); return n; };

  // ================================================================= MUERTE
  M.onDie = function (e, silent) {
    if (e.isPod) { if (!silent && e.rot == null) M.snd('weaver_pod_pop', 'hit', { vol: 0.5 }); return; }
    if (!silent) {
      M.deadAt = G.time;
      M.snd('mini_die', 'boss_roar', { pitch: 1.2, vol: 0.7 }); M.stg('stg_mini_die');
      var De = e.D; if (De && De.sDie) M.snd(De.sDie, null, { vol: 0.8 });
    }
    for (var i = 0; i < G.enemies.length; i++) { var q = G.enemies[i]; if (!q.dead && q.isPod && q.mown === e) q.rot = 2000; }   // las vainas se pudren en 2 s
  };

  // ================================================================= DIBUJO
  var FBK = {
    sol: function (base, idx) { return base === 'walk' || base === 'idle' || base === 'float' ? 'walk:' + idx : base === 'rec' || base === 'stun' ? 'rec:0' : base === 'roar' || base === 'thorn' || base === 'stomp' || base === 'core' ? 'stomp:' + (idx % 2) : 'bash:' + (idx % 2); },
    flo: function (base, idx) { return base === 'walk' || base === 'idle' || base === 'float' || base === 'rec' ? 'float:' + idx : base === 'roar' || base === 'burst' || base === 'wave' ? 'swell:' + (idx % 2) : base === 'rain' || base === 'roots' ? 'spit:0' : 'acid:0'; }
  };
  function poseOf(e) {
    var st = e.st, w = Math.floor(e.anim / 150), A = e.atk, z;
    if (st === 'enrage') return 'roar:0';
    if ((st === 'tele' || st === 'run') && A && A.pz) { z = st === 'tele' ? A.pz[0] : (A.pz[1] || A.pz[0]); return typeof z === 'function' ? z(e) : z; }
    if (st === 'rec') return e.recPose ? val(e.recPose, e) : 'idle:' + Math.floor(e.anim / 300);
    if (e.D.poseMove) { var pm = e.D.poseMove(e); if (pm) return pm; }
    return 'walk:' + w;
  }
  function animOK(name, an) { try { return Assets.hasAnim(name, an); } catch (x) { return false; } }
  function safe(name, pose) { try { return Assets.sprite(name, pose); } catch (x) { try { return Assets.sprite(name, 0); } catch (y) { return Assets.sprite('worm', 0); } } }
  M.visual = function (e) {
    var De = e.D, pose = poseOf(e), pp = pose.split(':'), base = pp[0], idx = parseInt(pp[1], 10) || 0, name = De.spr;
    if (G.hasSpr(name)) {
      if (e.part && e.part.broken && animOK(name, base + '_np')) base += '_np';
      else if (base === 'walk' && !animOK(name, 'walk') && animOK(name, 'float')) base = 'float';
      if (!animOK(name, base)) { base = base.replace('_np', ''); if (!animOK(name, base)) base = animOK(name, 'walk') ? 'walk' : 'idle'; }
      return { cv: safe(name, base + ':' + idx), sc: 1, fb: null };
    }
    var fb = De.fb;   // sprite existente teñido hasta que llegue el arte
    var ps = (animOK(fb.spr, pp[0]) ? pose : FBK[fb.kind](pp[0], idx));
    return { cv: safe(fb.spr, ps), sc: fb.sc || 1, fb: { tint: fb.tint, alpha: 1 } };
  };
  // tinte por estado: [color, alfa, escala]
  M.tint = function (e) {
    var st = e.st, A = e.atk, u;
    if (st === 'enrage') return ['#ff3a2a', 0.35 + 0.25 * Math.sin(e.t / 40)];
    if (st === 'tele' && A) { u = e.t / e.teleMs; return [A.sig ? '#ffe27a' : '#ff6a5a', 0.12 + 0.3 * u]; }
    if (e.expT > 0) return ['#ffe27a', 0.14 + 0.1 * Math.sin(G.time / 60)];
    if (e.enraged) return ['#ff3a1a', 0.12];
    if (e.part && e.part.flash > 0) return ['#ffffff', 0.35];
    return null;
  };
  // telegrafías y efectos persistentes en el suelo (E.drawGround, capa de telegrafías)
  M.drawTele = function (c, e, p) {
    if (e.dead) return;
    var A = e.atk;
    if ((e.st === 'tele' || e.st === 'run') && A && A.draw) A.draw(c, e, p, e.st);
    if (e.D.drawExtra) e.D.drawExtra(c, e, p);
    if (e.expT > 0) { c.save(); c.strokeStyle = 'rgba(255,226,122,' + (0.6 + 0.3 * Math.sin(G.time / 60)) + ')'; c.lineWidth = 3; c.beginPath(); c.arc(e.x, e.y, e.r + 12, 0, 6.283); c.stroke(); c.restore(); }
    if (e.shieldDown && !e.part.broken) { c.save(); c.strokeStyle = 'rgba(255,230,120,0.9)'; c.lineWidth = 3; c.setLineDash([6, 4]); c.beginPath(); c.arc(e.x, e.y, e.r + 8, 0, 6.283); c.stroke(); c.restore(); }
    if (e.enraged) { c.save(); c.globalAlpha = 0.14 + 0.08 * Math.sin(G.time / 90); c.fillStyle = '#ff3010'; c.beginPath(); c.arc(e.x, e.y, e.r + 6, 0, 6.283); c.fill(); c.restore(); }
  };
  // dibujo sobre el sprite (cuerno, cuello, grietas): lo llama E.draw tras el sprite
  M.drawOver = function (c, e, o) { if (e.D.drawOver) e.D.drawOver(c, e, o); };

  // ---- Barra grande de guardián (520 x 16 en y = 64): nombre y rol, chips de debilidad, medidor de la parte, línea de estado, ventana de exposición y banner de entrada
  var TAGCOL = { fire: '#ff7a2a', steel: '#b8c0cc', poison: '#7be34a', ice: '#6ac8ff', lightning: '#ffe45a', blood: '#d02048' }, TAGTXT = { fire: 'FUE', steel: 'ACE', poison: 'VEN', ice: 'HIE', lightning: 'RAY', blood: 'SAN' };
  M.weakness = function (e) {   // { weak: [tags], resist: [tags] } desde la tabla de materiales (A.8) con las excepciones del minijefe
    var out = { weak: [], resist: [] }; if (!B.mat.on || !e.mat) return out;
    B.mat.tags.forEach(function (tg) { var v = B.matMul(e, tg); if (v > 1.02) out.weak.push(tg); else if (v < 0.98) out.resist.push(tg); });
    return out;
  };
  M.drawBar = function (c, m) {
    var bw = 520, bh = 16, bx = (G.W - bw) / 2, by = 64, fr = G.clamp(m.hp / m.maxHp, 0, 1), De = m.D, t = G.time, P = m.part;
    var nm = De.name;
    G.txt(c, nm, bx, by - 10, 15, m.enraged ? '#ff8a5a' : '#ffd27a', 'left');
    var wk = M.weakness(m), cx = bx + c.measureText(nm).width + 14;
    wk.weak.slice(0, 2).concat([]).forEach(function (tg) { cx = chip(c, cx, by - 10, TAGTXT[tg], TAGCOL[tg], true); });
    wk.resist.slice(0, 1).forEach(function (tg) { cx = chip(c, cx, by - 10, TAGTXT[tg], '#9a9aa8', false); });
    G.txt(c, (m.enraged ? 'ENFURECIDO - ' : 'GUARDIÁN - ') + De.role, bx + bw, by - 10, 12, m.enraged ? '#ff6a3a' : '#c8b8e8', 'right');
    c.fillStyle = '#07040c'; c.fillRect(bx - 3, by - 3, bw + 6, bh + 6); c.fillStyle = '#2a1020'; c.fillRect(bx, by, bw, bh);
    var ex = m.expT > 0;
    c.fillStyle = ex ? (Math.floor(t / 120) % 2 ? '#ffd24a' : '#ffb82a') : m.enraged ? '#ff5a30' : '#d8741a'; c.fillRect(bx, by, bw * fr, bh);
    c.fillStyle = 'rgba(255,255,255,0.2)'; c.fillRect(bx, by, bw * fr, 4);
    c.fillStyle = m.enraged ? 'rgba(80,70,90,0.9)' : '#ffffff'; c.fillRect(Math.round(bx + bw * 0.5) - 1, by - 3, 3, bh + 6);
    c.strokeStyle = ex ? '#ffd24a' : '#8a6a30'; c.lineWidth = 2; c.strokeRect(bx - 2, by - 2, bw + 4, bh + 4);
    G.txt(c, Math.ceil(m.hp) + ' / ' + Math.round(m.maxHp), bx + bw / 2, by + bh / 2, 10, '#ffffff', 'center');
    // medidor de la parte (120 x 8): dorado cuando es el objetivo (núcleo abierto)
    var pm = P.broken ? 0 : P.hp / P.max, gold = m.coreOpen || (P.mode === 'head' && false);
    c.fillStyle = '#1a0a12'; c.fillRect(bx, by + bh + 5, 120, 8);
    c.fillStyle = P.flash > 0 ? '#fff' : gold ? '#ffd24a' : '#8fb4e8'; c.fillRect(bx + 1, by + bh + 6, 118 * pm, 6);
    G.txt(c, P.broken ? P.name + ' ROTO' + (P.mode === 'head' && m.cauterized ? ' (CAUTERIZADA)' : '') : P.name, bx + 128, by + bh + 9, 10, P.broken ? '#ffd27a' : '#d8cfe8', 'left');
    var ln = De.statusLine ? De.statusLine(m) : null;
    if (ln) G.txt(c, ln, bx + bw / 2, by + bh + 22, 11, '#ffe9a0', 'center');
    if (ex) {
      var wf = G.clamp(m.expT / (m.expMax || 1), 0, 1);
      c.fillStyle = 'rgba(255,210,58,0.9)'; c.fillRect(bx + bw - bw * 0.35 * wf, by + bh + 3, bw * 0.35 * wf, 3);
      G.txt(c, 'x' + (+m.expMul.toFixed(2)) + ' EXPUESTO', bx + bw, by + bh + 14, 11, '#ffd24a', 'right');
    } else m.expMax = 0;
    if (m.banner > 0 && m.age < 2600) {   // subtítulo del banner de entrada
      G.txt(c, De.sub, G.W / 2, 128, 14, '#d8cfe8', 'center');
    }
  };
  function chip(c, x, y, txt, col, weak) {
    c.save(); c.font = 'bold 10px "Courier New", monospace'; var w = c.measureText(txt).width + 22;
    c.fillStyle = 'rgba(10,6,18,0.85)'; c.fillRect(x, y - 8, w, 15); c.strokeStyle = col; c.lineWidth = 1.5; c.strokeRect(x + 0.5, y - 7.5, w - 1, 14); c.restore();
    try { c.drawImage(Assets.sprite(weak ? 'icon_weak' : 'icon_resist', 0), x + 3, y - 5, 10, 10); } catch (e) { /* sin icono */ }
    G.txt(c, txt, x + 14 + (w - 14) / 2 - 2, y, 10, col, 'center');
    return x + w + 4;
  }

  // ================================================================= DEPURACIÓN / AUDITORÍA
  M.info = function () {
    return E.minis().map(function (e) { return { id: e.mid, hp: Math.round(e.hp), max: Math.round(e.maxHp), st: e.st, atk: e.atk && e.atk.name, stage: e.stage, enraged: e.enraged, part: { hp: Math.round(e.part.hp), max: Math.round(e.part.max), broken: e.part.broken }, exp: Math.round(e.expT), adds: M.addsAlive(e), x: Math.round(e.x), y: Math.round(e.y), foot: e.foot, mat: e.mat }; });
  };
  // Auditoría de telegrafías: cada ataque declara dmg, exit (px de salida; número o lista), ice y sus tiempos (tele por etapa). Reglas: tele >= 400, tele >= 250 + (hielo 220) + 1000 x salida / 190,
  // >= 800 ms si el golpe es >= 25 (las 2.as telegrafías del enrage lo muestran ya en pantalla y solo exigen la regla de esquiva) y ningún golpe > HIT_CAP.
  M.teleAudit = function () {
    var out = [];
    M.IDS.forEach(function (id) {
      var De = D[id], list = M.ATK[id] || {};
      Object.keys(list).forEach(function (n) {
        var A = list[n], ice = !!De.ice;
        [0, 1].forEach(function (st) {
          var fk = { atk: A, stage: st, enraged: st === 1, part: { broken: false }, D: De, mid: id, maxHp: 1, hp: 1 };
          if (st === 1 && !A.double) return;
          var ms = A.tele(fk), ex = [].concat(A.exit == null ? 0 : A.exit), mx = Math.max.apply(null, ex), need = Math.round(250 + (ice ? 220 : 0) + 1000 * mx / 190), dm = A.dmg || 0;
          var ok = ms >= 400 && (mx === 0 || ms >= need) && (dm < 25 || ms >= 800 || st === 1) && dm <= M.HIT_CAP;
          out.push({ mini: id, atk: n + (st ? ' (2.ª)' : ''), ms: ms, exit: mx, need: need, dmg: dm, ok: ok });
        });
        if (A.dmgBroken != null || A.teleBroken != null) {
          var fb2 = { atk: A, stage: 0, enraged: false, part: { broken: true }, D: De, mid: id, maxHp: 1, hp: 1 };
          var ms2 = A.tele(fb2), mx2 = Math.max.apply(null, [].concat(A.exitBroken != null ? A.exitBroken : A.exit || 0)), need2 = Math.round(250 + (ice ? 220 : 0) + 1000 * mx2 / 190), dm2 = A.dmgBroken != null ? A.dmgBroken : A.dmg || 0;
          out.push({ mini: id, atk: n + ' (parte rota)', ms: ms2, exit: mx2, need: need2, dmg: dm2, ok: ms2 >= 400 && (mx2 === 0 || ms2 >= need2) && (dm2 < 25 || ms2 >= 800) && dm2 <= M.HIT_CAP });
        }
      });
    });
    return out;
  };
  B.minis.teleAudit = M.teleAudit;
  M.state = { ai: ai };
  M.D = D;
})();
