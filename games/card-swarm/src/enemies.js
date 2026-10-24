/* enemies.js - 11 enemigos (gusano, arquero, espinoso, jabalí, escudero, bomba, polilla, sembrador, espectro, ascua, brujo) + 3 de las familias v5 P1
   (dog = Perro pastor, salamander = Salamandra de lava, chainer = Guardián de cadenas; solo existen con la familia de su bioma, ver families.js), 2 élites
   (Coloso Escudero, Madre Colmena) y el jefe Pastor Corrupto, con estados, telegrafía, zonas de daño (G.zones team 'e') y escalado por minuto. */
(function () {
  'use strict';
  var G = window.G, B = G.B, fx = G.fx, E = G.Enemies = {};

  function mins() { return G.vt() / 60000; }   // minutos en la escala de 9:00 (se comprime con la duración elegida)
  function PL() { return G.player; }

  // ------------------------------------------------------------- Creación
  var DEG = Math.PI / 180;
  E.spawn = function (type, x, y, o) {
    o = o || {};
    var d = B.enemy[type], m = mins(), hp, dmg;
    if (type === 'boss' || d.elite) { hp = d.hp * (d.elite ? G.Loot.dur().guardHp : 1); dmg = d.dmg; }   // guardianes: x guardHp de la duración (L.DUR)       // jefe y élites no escalan por minuto
    else { hp = d.hp * B.hpMult(m); dmg = d.dmg * B.dmgMult(m); }
    // Familia del bioma activo (families.js): piel, multiplicadores hp/spd/dmg y material. o.nofam = sin familia. Sin familia ready, fe = null (roster legado).
    var fe = (type === 'boss' || d.elite || o.nofam) ? null : B.entry(type), spdK = 1, spr = d.spr, fbSkin = null;
    if (fe) {
      hp *= fe.hp || 1; dmg *= fe.dmg || 1; spdK = fe.spd || 1;
      if (fe.spr && G.hasSpr(fe.spr)) spr = fe.spr;   // sprite propio de la familia; si no existe, el sprite actual del rol
      else if (fe.fbSpr && G.hasSpr(fe.fbSpr)) { spr = fe.fbSpr; fbSkin = fe.fbSkin || null; }   // P2: sprite existente teñido mientras no haya arte propio
    }
    if (!G.hasSpr(spr)) spr = 'worm';   // un rol nuevo sin arte nunca rompe el dibujo
    if (o.hp) hp = o.hp;
    var sc = o.scale || (fe && fe.sc) || 1, r = d.r * sc, mg = G.WALL + r;
    var e = {
      type: type, x: G.clamp(x, mg, G.AW - mg), y: G.clamp(y, mg, G.AH - mg), r: r, hp: hp, maxHp: hp, spd: d.spd, dmg: dmg, sc: sc,
      spawnT: o.spawnT != null ? o.spawnT : B.spawnTelegraph, spdBase: d.spd * spdK, spr: spr, skin: fbSkin || (fe && fe.skin) || null, fe: fe || null, flash: 0, kx: 0, ky: 0, dead: false, st: 'move', t: 0, face: 1, anim: Math.random() * 1000,
      hitCd: 0, burnT: 0, burnDps: 0, poisonT: 0, poisonN: 0, bleedT: 0, slowT: 0, slowPct: 0, stunT: 0, vaporCd: 0,
      acc: { fire: 0, poison: 0, blood: 0 }, numAcc: 0, numT: 0, dotAcc: 0, dotT: 0, boomDepth: 0, lastTag: 'neutral', summoned: !!o.summoned, src: o.src || null,
      shootT: G.rnd(1200, 2600), sumT: G.rnd(2500, 6000), atkT: 2000, ai: 0, strafe: Math.random() < 0.5 ? 1 : -1, fa: 0
    };
    e.spawnMax = e.spawnT; if (fe && fe.nosep) e.nosep = true;
    if (B.mat.on && !o.nofam && type !== 'boss' && !d.elite) { var me = B.matEntry(type); if (me && me.mat) { e.mat = me.mat; e.mx = me.mx || null; } }   // material para G.B.matMul (A.8)
    switch (type) {
      case 'boss': e.spawnT = e.spawnMax = 900; e.sumT = 12000; e.atkT = 1500; e.callT = 14000; e.sporeT = 8000; e.age = 0; break;
      case 'worm': e.sndT = G.rnd(3000, 12000); break;
      case 'fanner': e.shootT = G.rnd(1500, 3000); break;
      case 'shield': e.shield = 70 * DEG; e.bashT = G.rnd(2000, 4000); break;
      case 'moth': e.shootT = G.rnd(1500, 3500); break;
      case 'sower': e.sumT = G.rnd(2500, 4500); break;
      case 'blinker': e.atkT = G.rnd(2500, 4200); break;
      case 'scorcher': e.atkT = G.rnd(1000, 3000); break;
      case 'dog': e.orbT = G.rnd(600, 1400); e.orR = G.rnd(170, 200); break;
      case 'salamander': e.lx = null; break;
      case 'chainer': e.atkT = G.rnd(2500, 4200); break;
      case 'leech': if (fe) {
        e.coolT = G.rnd(800, 2200); e.tgtT = G.rnd(500, 2500);
        if (o.inPond || !G.ponds.length) { e.st = 'hidden'; e.hidden = e.untarget = true; placeInPond(e, 'leech'); }   // pack Pantano / pruebas: ya oculta en su charco
        else { e.st = 'flee'; e.crawl = true; e.pond = nearestPond({ x: e.x, y: e.y }, e); if (!e.pond) placeInPond(e, 'leech'); }   // director: llega arrastrándose (visible y vulnerable) desde fuera de pantalla al charco más cercano a ella
      } break;
      case 'headlet': if (fe) { e.st = 'emerge'; e.t = 0; e.fixed = true; e.regrowN = 0; e.biteT = 0; e.untarget = true; e.immune = true; placeInPond(e, 'headlet'); } break;
      case 'boar': if (fe && fe.hop) e.hopT = G.rnd(300, 1400); break;
      case 'mini_bulwark': e.big = true; e.shield = 70 * DEG; e.atkT = 2000; e.spawnT = e.spawnMax = 900; e.shieldHp = e.shieldMax = B.mini.bulwark.shieldPct * hp; e.shieldBroken = false;
        e.enraged = false; e.expT = 0; e.expMul = 1; e.bag = []; e.orbs = null; e.cn = 0; e.partName = 'ESCUDO'; break;
      case 'mini_hive': e.big = true; e.atkT = 2500; e.ecT = 9000; e.spawnT = e.spawnMax = 900; e.sacHp = e.sacMax = B.mini.hive.sacPct * hp; e.sacBroken = false;
        e.enraged = false; e.expT = 0; e.expMul = 1; e.bag = []; e.rain = null; e.partName = 'SACO'; break;
    }
    G.enemies.push(e);
    return e;
  };
  E.countType = function (type) { var n = 0; for (var i = 0; i < G.enemies.length; i++) if (!G.enemies[i].dead && G.enemies[i].type === type) n++; return n; };

  // ------------------------------------------------------------- Charcos fijos (M5, A.5): 6 charcos r 36 repartidos por la arena del Asfódelo (G.ponds).
  // Decorado + lugar donde brotan las Cabezas menores y donde se esconden las Sanguijuelas (enemigo oculto: e.hidden / e.untarget, ver ai_leech / ai_headlet).
  var POND_R = 36, POND_POS = [[250, 180], [1190, 180], [180, 430], [1260, 430], [300, 690], [1140, 690]];
  G.ponds = [];
  E.initPonds = function () {
    var f = B.famOf(), n = f && f.ponds || 0;
    G.ponds = POND_POS.slice(0, n).map(function (q, i) { return { x: q[0], y: q[1], r: POND_R, i: i }; });
  };
  function pondCount(pd, type, except) { var n = 0; for (var i = 0; i < G.enemies.length; i++) { var q = G.enemies[i]; if (!q.dead && q !== except && q.pond === pd && q.type === type) n++; } return n; }
  // coloca al enemigo en un charco: no repite tipo si hay hueco (máx. 2 sanguijuelas / 1 cabeza por charco) y prefiere los que están a >= 220 px del jugador
  function placeInPond(e, type) {
    var ps = G.ponds, p = PL(), lim = type === 'headlet' ? 1 : 2, c = [], i, pd;
    if (!ps.length) { e.pond = null; e.hidden = e.untarget = false; e.fixed = false; if (e.type === 'headlet') e.st = 'idle'; return; }
    for (i = 0; i < ps.length; i++) { pd = ps[i]; if (pondCount(pd, type, e) < lim) c.push({ pd: pd, far: G.dist(pd.x, pd.y, p.x, p.y) }); }
    if (!c.length) c = ps.map(function (q) { return { pd: q, far: G.dist(q.x, q.y, p.x, p.y) }; });
    // prefiere los charcos a 200-650 px del jugador (lo bastante lejos para no brotar encima y lo bastante cerca para que importen); si no hay, el más cercano a >= 120 px
    var far = c.filter(function (q) { return q.far >= 200 && q.far <= 650; }), pick = far.length ? far[Math.floor(Math.random() * far.length)] : c.filter(function (q) { return q.far >= 120; }).sort(function (a, b) { return a.far - b.far; })[0] || c[0];
    e.pond = pick.pd; e.x = pick.pd.x + G.rnd(-8, 8); e.y = pick.pd.y + G.rnd(-4, 4);
  }
  function nearestPond(p, e) {   // charco más cercano al jugador con hueco para esta sanguijuela
    var best = null, bd = 1e9;
    for (var i = 0; i < G.ponds.length; i++) { var pd = G.ponds[i], d = G.dist(pd.x, pd.y, p.x, p.y); if (d < bd && (pd === e.pond || pondCount(pd, e.type, e) < 2)) { bd = d; best = pd; } }
    return best;
  }

  // ------------------------------------------------------------- Zonas de daño en el suelo (G.zones, team 'e')
  // Fases: arm (telegrafía, sin daño, ms) y activa (life ms). kind: 'spore' / 'acid' (verde ácido) o 'fire' (rastro del Ascua).
  E.zone = function (o) {
    var z = { team: 'e', kind: o.kind, x: o.x, y: o.y, r: o.r, arm: o.arm || 0, armMax: o.arm || 0, life: o.life, max: o.life,
      dmg: o.dmg, tick: o.tick || 500, tk: 0, slow: o.slow || 0, cd: !!o.cd, owner: o.owner || null, src: o.src || o.kind, t: 0 };
    G.zones.push(z);
    return z;
  };
  E.zonesOf = function (owner, kind) { var n = 0; for (var i = 0; i < G.zones.length; i++) if (G.zones[i].team === 'e' && G.zones[i].owner === owner && G.zones[i].kind === kind) n++; return n; };

  var CDSLOW = [0.4, 2000];   // M9 (A.5): p.cdSlow = [fracción que se resta a la velocidad de recarga (tope 40 %), ms que dura tras salir (tope 2 s)]
  function updateZones(dt) {
    var p = PL();
    for (var i = G.zones.length - 1; i >= 0; i--) {
      var z = G.zones[i]; if (!z || z.team !== 'e') continue;
      z.t += dt;
      if (z.arm > 0) { z.arm -= dt; if (z.arm <= 0) { z.arm = 0; if (z.kind !== 'fire') fx.ring(z.x, z.y, z.r * 0.4, z.r, 250, z.kind === 'olvido' ? '#7fffe0' : '#9bff4a', 3); } continue; }
      z.life -= dt;
      if (z.life <= 0) { G.zones.splice(i, 1); continue; }
      if (z.kind !== 'fire' && Math.random() < 0.1) fx.dot(z.x + G.rnd(-z.r, z.r) * 0.7, z.y + G.rnd(-z.r, z.r) * 0.7, 0, -30, 600, z.kind === 'olvido' ? '#7fffe0' : '#9bff4a', 3, { drag: 1 });
      if (z.kind === 'fire' && Math.random() < 0.08) fx.dot(z.x + G.rnd(-8, 8), z.y, 0, -40, 400, '#ff9a3c', 3, { add: true });
      if (p.dead) continue;
      if (G.dist(z.x, z.y, p.x, p.y) <= z.r) {
        if (z.slow) G.Player.slow(p, z.slow, 400);
        if (z.cd) { G.Player.cdSlow(p, CDSLOW[0], CDSLOW[1]); var hn = performance.now(); if (hn - (E._hum || 0) > 1600) { E._hum = hn; G.sfx('olvido_hum', { vol: 0.5 }); } }   // M9: las cartas recargan más lento mientras estés dentro (+2 s al salir)
        z.tk -= dt;
        if (z.tk <= 0) { z.tk = z.tick; G.Player.hurt(p, z.dmg, z.x, z.y, { soft: true, src: z.src }); }
      } else z.tk = Math.min(z.tk, 0);
    }
  }

  E.aliveCount = function () { var n = 0; for (var i = 0; i < G.enemies.length; i++) if (!G.enemies[i].dead) n++; return n; };
  E.boss = function () { for (var i = 0; i < G.enemies.length; i++) if (G.enemies[i].type === 'boss' && !G.enemies[i].dead) return G.enemies[i]; return null; };

  // SFX propio de la familia (families.js, campo sfx de la entrada); sin familia no suena nada extra (el roster legado queda idéntico)
  function fsfx(e, k, o) { var n = e.fe && e.fe.sfx && e.fe.sfx[k]; if (n) G.sfx(n, o); }
  // ------------------------------------------------------------- Daño y muerte
  // El daño de las cartas pasa por G.Combat.deal; aquí solo la explosión de la bomba y la muerte.
  function explode(e) {
    fx.ring(e.x, e.y, 8, 60, 300, '#ff6a2a', 5);
    fx.part('explosion', e.x, e.y, 0, 0, 350, { sc: 1.1, add: true, anim: true }); fx.shockwave(e.x, e.y, 130);
    fx.flames(e.x, e.y, 10, 40); fx.shake(7, 180); G.sfx('explosion'); fsfx(e, 'boom', { vol: 0.9 });
    var p = PL();
    if (!p.dead && G.dist(e.x, e.y, p.x, p.y) <= 60 + p.r) G.Player.hurt(p, e.dmg, e.x, e.y, { src: 'bomb' });
  }

  E.kill = function (e, silent, tag) {
    if (e.dead) return;
    if (tag) e.lastTag = tag;   // M7: último golpe recibido (etiqueta); la cauterización de la Cabeza menor lo lee
    var regrown = false;
    if (e.type === 'headlet' && e.fe && !silent) {   // M7 rebrote / cauterización
      if (e.lastTag === 'fire' || e.burnT > 0) { e.cauterized = true; fx.flames(e.x, e.y, 10, 22); fx.ring(e.x, e.y, 8, 40, 350, '#ff9a3c', 4); fsfx(e, 'burn', { vol: 0.9 }); }
      else if ((e.regrowN || 0) < e.fe.regrow.max) { stumpHead(e, tag); return; }
      regrown = !!e.rewarded;   // ya cobró XP / Ceniza / botín en su primera muerte
    }
    e.dead = true;
    if (silent) { fx.smoke(e.x, e.y, 4); return; }
    var p = PL(), i;
    if (e.type !== 'boss') fx.corpse(e.spr || B.enemy[e.type].spr, e.x, e.y, e.face < 0);
    fx.puff(e.x, e.y, 2);
    fx.smoke(e.x, e.y, 5); fx.ember(e.x, e.y, 3, 10);
    var now = performance.now(); if (now - (E._dieSfx || 0) > 70) { E._dieSfx = now; G.sfx('enemy_die', { vol: 0.5 }); }
    if (e.fe && e.fe.sfx && e.fe.sfx.die && Math.random() < 0.15) G.sfx(e.fe.sfx.die, { vol: 0.35 });   // P2: lamento ocasional del Alma errante al disiparse
    if (e.type === 'bomb' && e.st === 'lit') explode(e);
    if (!regrown) { G.kills++; p.kills++; }
    if (e.type === 'warlock') {   // matar al invocador disipa a sus gusanos
      for (i = 0; i < G.enemies.length; i++) { var w = G.enemies[i]; if (!w.dead && w.owner === e) { w.dead = true; fx.puff(w.x, w.y, 1); fx.burst(w.x, w.y, 6, '#a060ff', 120, 400, 3, { add: true }); } }
    }
    if (e.type === 'salamander') E.zone({ kind: 'fire', x: e.x, y: e.y, r: 30, arm: 400, life: 2000, dmg: e.dmg * 5 / 8, tick: 400, owner: null, src: 'salamander_pool' });   // al morir deja un charco r 30 de 2 s
    if (e.type === 'sower') E.zone(e.fe && e.fe.olvido ? { kind: 'olvido', x: e.x, y: e.y, r: 30, arm: 400, life: 2000, dmg: e.dmg, tick: 500, cd: true, owner: null, src: 'olvido' } : { kind: 'spore', x: e.x, y: e.y, r: 30, arm: 400, life: 2000, dmg: e.dmg, tick: 500, slow: 0.15, owner: null, src: 'sower' });
    if (e.type === 'mini_hive') {   // se divide en 3 gusanos grandes
      for (i = 0; i < 3; i++) { var an = i * 2.094 + 0.5; E.spawn('worm', e.x + Math.cos(an) * 30, e.y + Math.sin(an) * 30, { summoned: true, hp: 40, scale: 1.3, spawnT: 500 }); }
      fx.ring(e.x, e.y, 10, 80, 400, '#ffb73a', 5);
    }
    if (B.enemy[e.type].elite) { fx.hit(80); fx.shake(8, 300); fx.ring(e.x, e.y, 10, 120, 500, '#ffd27a', 6); fx.flames(e.x, e.y, 18, 36); G.sfx('boss_roar', { pitch: 1.2, vol: 0.7 }); }
    if (e.type === 'boss') {
      G.Boss.onDeath(e);   // muerte espectacular, recompensas y limpieza (boss.js)
      fx.ring(e.x, e.y, 10, 150, 500, '#ffd27a', 6); fx.flames(e.x, e.y, 30, 50);
      G.bossDead = true;
      for (i = 0; i < G.enemies.length; i++) if (!G.enemies[i].dead) E.kill(G.enemies[i], true);
      for (i = G.zones.length - 1; i >= 0; i--) if (G.zones[i].team === 'e') G.zones.splice(i, 1);
    }
    if (regrown) { try { G.Quests.onKill('headlet', e); } catch (x) { /* meta opcional */ } }   // solo el encargo; nada de XP / Ceniza / botín
    else G.Combat.onKill(e, tag || e.lastTag);
  };

  // ------------------------------------------------------------- Proyectiles
  // o: { r, life, hp (destructible por golpes de carta), slow:[pct,ms], fb (sprite alternativo si no existe spr), src }
  E.shoot = function (team, x, y, ang, speed, dmg, spr, o) {
    o = o || {};
    if (!G.hasSpr(spr)) spr = o.fb || null;
    if (G.projectiles.length > G.Q.projCap && !o.orb) return;   // calidad adaptativa: tope de proyectiles en pantalla
    G.projectiles.push({ team: team, x: x, y: y, vx: Math.cos(ang) * speed, vy: Math.sin(ang) * speed, ang: ang, dmg: dmg,
      spr: spr, r: o.r || 7, life: o.life || 4000, pierce: !!o.pierce, hit: new Set(), t: 0, hp: o.hp || 0, slow: o.slow || null, src: o.src || 'proj', orb: !!o.orb, kind: o.kind || null, ox: o.ox, oy: o.oy, sfxHit: o.sfxHit || null, sfxBrk: o.sfxBrk || null });
  };

  function updateProjectiles(dt, onlyPlayer) {
    var s = dt / 1000, p = PL(), hand = p.hand || [];
    for (var i = G.projectiles.length - 1; i >= 0; i--) {
      var q = G.projectiles[i]; if (!q) continue;
      if (q.team === 'p') { if (G.Weapons.updateProj(q, dt, s)) G.projectiles.splice(i, 1); continue; }
      if (onlyPlayer) continue;   // intro del jefe: los proyectiles enemigos quedan congelados
      q.x += q.vx * s; q.y += q.vy * s; q.life -= dt; q.t += dt;
      var dead = q.life <= 0 || q.x < G.WALL || q.y < G.WALL || q.x > G.AW - G.WALL || q.y > G.AH - G.WALL;
      if (!dead && G.Boss.obs.length && G.Boss.blocks(q.x, q.y, q.r)) { fx.burst(q.x, q.y, 4, '#c89060', 100, 250, 3); dead = true; }   // los troncos de la arena frenan proyectiles
      if (!dead && q.hp) {   // el orbe de hielo se destruye con cualquier golpe de carta (proyectil u orbital)
        var j, o2;
        for (j = 0; j < G.projectiles.length && !dead; j++) {
          o2 = G.projectiles[j];
          if (o2.team === 'p' && o2.life > 0 && Math.hypot(o2.x - q.x, o2.y - q.y) < q.r + (o2.r || 6)) { dead = true; if (!o2.pierce) o2.life = 0; }
        }
        for (j = 0; j < hand.length && !dead; j++) {
          var bodies = hand[j] && hand[j].bodies;
          if (bodies) for (var k = 0; k < bodies.length; k++) if (Math.hypot(bodies[k].x - q.x, bodies[k].y - q.y) < q.r + 12) { dead = true; break; }
        }
        if (dead) { fx.burst(q.x, q.y, 8, '#bfeaff', 140, 350, 3, { add: true }); fx.ring(q.x, q.y, 3, 18, 200, '#7fd4ff', 2); if (q.sfxBrk) G.sfx(q.sfxBrk, { vol: 0.6 }); else G.sfx('hit', { pitch: 1.8, vol: 0.4 }); G.projectiles.splice(i, 1); continue; }
      }
      if (!dead && !p.dead && G.dist(q.x, q.y, p.x, p.y) < q.r + p.r - 2) {
        if (G.Player.hurt(p, q.dmg, q.x - q.vx, q.y - q.vy, { slow: q.slow, src: q.src }) || G.god) { dead = true; if (q.sfxHit) { G.sfx(q.sfxHit, { vol: 0.8 }); if (q.kind === 'chain') fx.ring(p.x, p.y, 4, 26, 260, '#7fd4ff', 3); } }
      }
      if (dead) G.projectiles.splice(i, 1);
    }
  }

  // ------------------------------------------------------------- Comportamientos
  function moveTo(e, ang, spd, s) { e.x += Math.cos(ang) * spd * s; e.y += Math.sin(ang) * spd * s; }

  function ai_worm(e, dt, s, p, d, a) {
    moveTo(e, a, e.spd, s);
    if (e.fe && (e.sndT -= dt) <= 0) { e.sndT = G.rnd(6000, 14000); if (d < 420) fsfx(e, 'spawn', { vol: 0.4 }); }   // Cordero / Esqueleto: sonido ambiental esporádico
    if (e.hitCd > 0) e.hitCd -= dt;
    else if (!p.dead && d < e.r + p.r + 3) { G.Player.hurt(p, e.dmg, e.x, e.y, { src: 'worm' }); e.hitCd = 700; }
  }

  function ai_archer(e, dt, s, p, d, a) {
    if (e.st === 'move') {
      if (d < 200) moveTo(e, a + Math.PI, e.spd, s);
      else if (d > 260) moveTo(e, a, e.spd, s);
      else moveTo(e, a + e.strafe * Math.PI / 2, e.spd * 0.4, s);
      // si está contra una pared, cambia el sentido del giro
      if (e.x < G.WALL + 20 || e.x > G.AW - G.WALL - 20 || e.y < G.WALL + 20 || e.y > G.AH - G.WALL - 20) e.strafe *= -1;
      e.shootT -= dt;
      if (e.shootT <= 0) { e.st = 'aim'; e.t = 0; e.ang = a; }
      if (e.flT > 0) e.flT -= dt;
    } else if (e.st === 'aim') {
      e.t += dt;
      var fe = e.fe;
      if (fe && e.t < 250) e.ang = a;   // familia: el apunte se fija en los últimos 150 ms (la línea fina del aviso es la trayectoria real)
      if (e.t >= B.tele.archer.ms) {
        if (fe) { E.shoot('e', e.x, e.y, e.ang, 220, e.dmg, fe.proj, { r: 6, src: 'archer', fb: fe.fb }); fsfx(e, 'shoot', { vol: 0.6 }); e.flT = 220; }
        else { E.shoot('e', e.x, e.y, Math.atan2(p.y - e.y, p.x - e.x), 220, e.dmg, 'arrow', { r: 6, src: 'archer' }); G.sfx('shoot', { vol: 0.6 }); }
        e.st = 'move'; e.shootT = 2400;
      }
    }
  }

  function ai_boar(e, dt, s, p, d, a) {
    if (e.fe && e.fe.roll) return ai_skull(e, dt, s, p, d, a);   // Calavera rodante (M2)
    if (e.fe && e.fe.hop) return ai_frog(e, dt, s, p, d, a);     // Rana ácida (M6)
    if (e.st === 'move') {
      moveTo(e, a, e.spd, s);
      if (d < 250) { e.st = 'wind'; e.t = 0; e.ang = a; }
    } else if (e.st === 'wind') {
      e.t += dt;
      if (e.t < 400) e.ang = a;                 // sigue al jugador y se fija en los últimos 200 ms
      if (e.t >= 600) { e.st = 'charge'; e.t = 0; e.hitDone = false; G.sfx('boss_roar', { pitch: 1.8, vol: 0.4 }); }
    } else if (e.st === 'charge') {
      e.t += dt;
      moveTo(e, e.ang, 380, s);
      if (!e.hitDone && !p.dead && d < e.r + p.r) { e.hitDone = true; G.Player.hurt(p, e.dmg, e.x, e.y, { src: 'boar' }); }
      var m = G.WALL + e.r + 1;
      if (e.x <= m || e.x >= G.AW - m || e.y <= m || e.y >= G.AH - m) { e.st = 'stun'; e.t = 0; fx.shake(4, 120); fx.dust(e.x, e.y, 6); }
      else if (e.t >= 450) { e.st = 'stun'; e.t = 0; }
    } else if (e.st === 'stun') {
      e.t += dt;
      if (e.t >= 900) { e.st = 'move'; e.t = 0; }
    }
  }

  function ai_bomb(e, dt, s, p, d, a) {
    if (e.st === 'move') {
      moveTo(e, a, e.spd, s);
      if (d < 40) { e.st = 'lit'; e.t = 0; G.sfx('hit', { pitch: 2, vol: 0.4 }); }
    } else if (e.st === 'lit') {
      e.t += dt;
      moveTo(e, a, e.spd * 0.25, s);
      if (e.t >= 700) { e.dead = true; explode(e); }
    }
  }

  function ai_warlock(e, dt, s, p, d, a) {
    if (e.st === 'move') {
      if (d < 260) {
        var fa = a + Math.PI;
        // evita quedar atrapado en una pared: desliza en tangente
        var nx = e.x + Math.cos(fa) * 30, ny = e.y + Math.sin(fa) * 30, m = G.WALL + 40;
        if (nx < m || nx > G.AW - m || ny < m || ny > G.AH - m) fa += (e.strafe > 0 ? 1 : -1) * Math.PI / 2;
        moveTo(e, fa, e.spd, s);
      }
      e.sumT -= dt;
      if (e.sumT <= 0) { e.st = 'cast'; e.t = 0; fsfx(e, 'tele', { vol: 0.8 }); }
    } else if (e.st === 'cast') {
      e.t += dt;
      if (e.t >= 500) {
        var alive = 0; G.enemies.forEach(function (o) { if (!o.dead && o.owner && o.owner.type === 'warlock') alive++; });
        for (var i = 0; i < 2 && alive < 6; i++, alive++) {
          var w = E.spawn('worm', e.x + G.rnd(-30, 30), e.y + G.rnd(-30, 30), { summoned: true }); w.owner = e;
          fx.bolt(e.x, e.y - 6, w.x, w.y, '#a060ff', 2);   // hilo de luz hacia cada invocado
        }
        fx.ring(e.x, e.y, 5, 40, 300, '#a060ff', 3); G.sfx('wave_start', { vol: 0.5 }); fsfx(e, 'summon', { vol: 0.7 });
        e.st = 'move'; e.sumT = 6000;
      }
    }
  }

  // ---------------------------------------------------------------- Enemigos nuevos
  function contact(e, dt, p, d, cd, src) {
    if (e.hitCd > 0) { e.hitCd -= dt; return; }
    if (!p.dead && d < e.r + p.r + 3) { G.Player.hurt(p, e.dmg, e.x, e.y, { src: src || e.type }); e.hitCd = cd; }
  }
  // mantiene distancia [lo,hi]; fuera de ese rango se acerca / aleja; dentro rodea despacio
  function kite(e, a, d, lo, hi, s, wob) {
    var w = wob || 0;
    if (d < lo) moveTo(e, a + Math.PI + w, e.spd, s);
    else if (d > hi) moveTo(e, a + w, e.spd, s);
    else moveTo(e, a + e.strafe * Math.PI / 2, e.spd * 0.4, s);
    if (e.x < G.WALL + 20 || e.x > G.AW - G.WALL - 20 || e.y < G.WALL + 20 || e.y > G.AH - G.WALL - 20) e.strafe *= -1;
  }
  function inFan(e, p, ang, half, reach) {
    return G.dist(e.x, e.y, p.x, p.y) <= reach && Math.abs(G.angDiff(Math.atan2(p.y - e.y, p.x - e.x), ang)) <= half;
  }

  // Espinoso: abanico de 3 espinas con cono rojo
  function ai_fanner(e, dt, s, p, d, a) {
    if (e.st === 'move') {
      kite(e, a, d, 180, 240, s);
      e.shootT -= dt;
      if (e.shootT <= 0) { e.st = 'aim'; e.t = 0; e.ang = a; G.sfx('hit', { pitch: 1.6, vol: 0.3 }); }
    } else if (e.st === 'aim') {
      e.t += dt;
      if (e.t < 350) e.ang = a;                       // se fija en los últimos 150 ms
      if (e.t >= 500) {
        for (var k = -1; k <= 1; k++) E.shoot('e', e.x, e.y, e.ang + k * 14 * DEG, 190, e.dmg, 'proj_thorn_small', { r: 5, life: 3500, fb: 'thorn', src: 'fanner' });
        G.sfx('shoot', { pitch: 1.3, vol: 0.5 }); fsfx(e, 'shoot', { vol: 0.6 });
        e.st = 'rec'; e.t = 0;
      }
    } else if (e.st === 'rec') {
      e.t += dt;
      if (e.t >= 300) { e.st = 'move'; e.shootT = 2700; }
    }
  }

  // Escudero: escudo frontal (e.fa) y empellón telegrafiado
  var SH_REACH = 40;
  function ai_shield(e, dt, s, p, d, a) {
    if (e.st === 'move') {
      e.fa = a; moveTo(e, a, e.spd, s);
      contact(e, dt, p, d, 900, 'shield');
      e.bashT -= dt;
      if (e.bashT <= 0 && d < e.r + p.r + SH_REACH) { e.st = 'wind'; e.t = 0; }
    } else if (e.st === 'wind') {
      e.t += dt;
      if (e.t < 350) e.fa = a;
      moveTo(e, e.fa + Math.PI, 12, s);               // retrocede ~6 px
      if (e.t >= 500) {
        e.st = 'bash'; e.t = 0; fx.shake(3, 100); G.sfx('hit_heavy', { vol: 0.5 }); fsfx(e, 'bash', { vol: 0.7 });
        if (!p.dead && inFan(e, p, e.fa, 45 * DEG, e.r + p.r + SH_REACH)) G.Player.hurt(p, e.dmg, e.x, e.y, { src: 'shield', kb: 1 });
        fx.ring(e.x + Math.cos(e.fa) * e.r, e.y + Math.sin(e.fa) * e.r, 4, 36, 200, '#ffffff', 3);
      }
    } else if (e.st === 'bash') {
      e.t += dt;
      if (e.t >= 150) { e.st = 'rec'; e.t = 0; e.shieldDown = true; }
    } else if (e.st === 'rec') {                     // escudo bajo: ventana de vulnerabilidad
      e.t += dt;
      if (e.t >= 400) { e.st = 'move'; e.shieldDown = false; e.bashT = 4000; }
    }
  }

  // Polilla gélida: vuelo errático y orbe de hielo
  function ai_moth(e, dt, s, p, d, a) {
    if (e.st === 'move') {
      var w = Math.sin(e.anim / 330) * 0.9;
      kite(e, a, d, 150, 190, s, w);
      contact(e, dt, p, d, 900, 'moth');
      e.shootT -= dt;
      if (e.shootT <= 0) { e.st = 'charge'; e.t = 0; e.ang = a; fsfx(e, 'move', { vol: 0.5 }); }
    } else if (e.st === 'charge') {
      e.t += dt; e.ang = a;
      if (e.t >= B.tele.moth.ms) {
        var mf = e.fe;   // familia: orbe de lana (anillo azul claro = ralentiza 30 % durante 2 s); legado: orbe de hielo 35 %
        E.shoot('e', e.x, e.y - 4, e.ang, 150, e.dmg, mf && mf.proj || 'proj_frost_orb', { r: 8, life: 4500, hp: 1, slow: mf && mf.orbSlow || [0.35, 2000], orb: true, src: 'moth', sfxBrk: mf && mf.sfx && mf.sfx.brk });
        G.sfx('shoot', { pitch: 1.8, vol: 0.4 }); fsfx(e, 'shoot', { vol: 0.6 });
        e.st = 'throw'; e.t = 0;
      }
    } else if (e.st === 'throw') {
      e.t += dt;
      if (e.t >= 250) { e.st = 'move'; e.shootT = 3050; }
    }
  }

  // Sembrador: planta zonas de esporas donde está el jugador
  function ai_sower(e, dt, s, p, d, a) {
    if (e.st === 'move') {
      kite(e, a, d, 200, 280, s);
      contact(e, dt, p, d, 900, 'sower');
      e.sumT -= dt;
      if (e.sumT <= 0 && E.zonesOf(e, e.fe && e.fe.olvido ? 'olvido' : 'spore') < 5) { e.st = 'sow'; e.t = 0; }
      else if (e.sumT <= 0) e.sumT = 1000;
    } else if (e.st === 'sow') {
      e.t += dt;
      if (e.t >= 500) {
        if (e.fe && e.fe.olvido) E.zone({ kind: 'olvido', x: p.x, y: p.y, r: 42, arm: B.tele.sower.ms, life: 4000, dmg: e.dmg, tick: 500, slow: 0, cd: true, owner: e, src: 'olvido' });   // M9: zona turquesa, 3 de daño/500 ms + cdSlow
        else E.zone({ kind: 'spore', x: p.x, y: p.y, r: 42, arm: B.tele.sower.ms, life: 4000, dmg: e.dmg, tick: 500, slow: 0.15, owner: e, src: 'sower' });
        G.sfx('wave_start', { pitch: 1.6, vol: 0.35 }); fsfx(e, 'tele', { vol: 0.7 });
        e.st = 'move'; e.sumT = 4000;
      }
    }
  }

  // Espectro: se desvanece, reaparece a 55 px del jugador y tajea
  var BL_REACH = 50;
  function ai_blinker(e, dt, s, p, d, a) {
    if (e.st === 'move') {
      kite(e, a, d, 190, 220, s);
      e.atkT -= dt;
      if (e.atkT <= 0) {
        e.st = 'fade'; e.t = 0; e.immune = true; if (e.fe) G.sfx('soul_whisper', { vol: 0.8 });
        var an = G.rnd(0, 6.283), m = G.WALL + 20;
        e.tx = G.clamp(p.x + Math.cos(an) * 55, m, G.AW - m); e.ty = G.clamp(p.y + Math.sin(an) * 55, m, G.AH - m);
        fx.puff(e.x, e.y, 1);
      }
    } else if (e.st === 'fade') {
      e.t += dt;
      if (e.t >= 500) {
        e.immune = false; fx.puff(e.x, e.y, 1);
        e.x = e.tx; e.y = e.ty; fx.puff(e.x, e.y, 2); fx.burst(e.x, e.y, 8, '#a98aff', 140, 400, 3, { add: true });
        e.st = 'slash'; e.t = 0; e.ang = Math.atan2(p.y - e.y, p.x - e.x); if (e.fe) G.sfx('soul_blink', { vol: 0.6 });
      }
    } else if (e.st === 'slash') {
      e.t += dt;
      if (e.t < 200) e.ang = a;                      // se fija en los últimos 150 ms
      if (e.t >= 350) {
        fx.slash(e.x, e.y, e.ang, 1.1, '#ff4040'); G.sfx('hit_heavy', { pitch: 1.3, vol: 0.5 });
        if (!p.dead && inFan(e, p, e.ang, 50 * DEG, BL_REACH + p.r)) G.Player.hurt(p, e.dmg, e.x, e.y, { src: 'blinker' });
        e.st = 'rec'; e.t = 0;
      }
    } else if (e.st === 'rec') {
      e.t += dt;
      if (e.t >= 700) { e.st = 'move'; e.atkT = 3500; }
    }
  }

  // Ascua: carga con rastro de fuego
  function ai_scorcher(e, dt, s, p, d, a) {
    if (e.fe && e.fe.eel) return ai_eel(e, dt, s, p, d, a);   // Anguila eléctrica (M8)
    if (e.st === 'move') {
      moveTo(e, a, e.spd, s);
      if (e.hitCd > 0) e.hitCd -= dt; else if (!p.dead && d < e.r + p.r + 3) { G.Player.hurt(p, e.dmg * 0.5, e.x, e.y, { src: 'scorcher' }); e.hitCd = 1000; }   // el roce pesa la mitad: el golpe fuerte es la carga
      e.atkT -= dt;
      if (e.atkT <= 0 && d < 320) { e.st = 'wind'; e.t = 0; e.ang = a; e.face = Math.cos(a) >= 0 ? 1 : -1; }
    } else if (e.st === 'wind') {
      e.t += dt;
      if (e.t < 450) { e.ang = a; e.face = Math.cos(a) >= 0 ? 1 : -1; }
      if (e.t % 120 < dt && Math.random() < 0.8) fx.smoke(e.x, e.y, 1);
      if (e.t >= B.tele.scorcher.ms) { e.st = 'dash'; e.t = 0; e.hitDone = false; e.trailT = 0; G.sfx('boss_roar', { pitch: 2, vol: 0.3 }); if (e.fe) G.sfx('lava_trail_hiss', { vol: 0.6 }); }
    } else if (e.st === 'dash') {
      e.t += dt; e.trailT -= dt;
      moveTo(e, e.ang, 300, s);
      if (e.trailT <= 0) { e.trailT = 60; E.zone({ kind: 'fire', x: e.x, y: e.y, r: 11, arm: 0, life: 2500, dmg: e.dmg * 5 / 12, tick: 400, src: 'scorcher_trail' }); }
      if (!e.hitDone && !p.dead && d < e.r + p.r) { e.hitDone = true; G.Player.hurt(p, e.dmg, e.x, e.y, { src: 'scorcher' }); }
      var m = G.WALL + e.r + 1;
      if (e.t >= 500 || e.x <= m || e.x >= G.AW - m || e.y <= m || e.y >= G.AH - m) { e.st = 'rec'; e.t = 0; fx.dust(e.x, e.y, 4); }
    } else if (e.st === 'rec') {
      e.t += dt;
      if (e.t >= 700) { e.st = 'move'; e.atkT = 3500; }
    }
  }

  // ---------------------------------------------------------------- Familias v5 P1: mecánicas nuevas (DESIGN-v5-biomas.md A.6, M1-M4)
  // Tiempos de aviso: G.B.tele (families.js). El resto de números de abajo son los del doc (A.3 / A.4).
  var DG = { w: 1.1, orbMs: [1300, 1900], dashSpd: 320, dashMin: 250, dashMax: 700, push: 55, rec: 600, ring: 28 };   // Perro pastor
  var SK = { len: 280, spd: 300, len2: 200, stun1: 400, stun: 900 };                                                    // Calavera rodante
  var SL = { every: 70, r: 22, life: 5000, max: 6, dmg: 5 / 8 };                                                       // Salamandra: un charco cada 70 px, máx. 6, daño 5/400 ms (= dmg x 5/8)
  var CH = { range: 300, spd: 420, slow: [0.45, 1800], gap: 5000, fix: 300 };                                           // Guardián de cadenas
  function centerPush(p) {   // punto de origen tal que el empuje de Player.hurt aleje al jugador del punto y lo mande hacia el centro de la arena
    var cx = G.AW / 2 - p.x, cy = G.AH / 2 - p.y, l = Math.hypot(cx, cy) || 1;
    return [p.x - cx / l * 10, p.y - cy / l * 10];
  }

  // M1 Perro pastor: órbita a 170-200 px (w 1,1 rad/s) -> ladrido 450 ms (anillo r 28 + línea al punto de arreo, el rumbo se fija en los últimos 150 ms) -> arreo a 320 px/s
  // (250-700 ms según la distancia: llega hasta donde estaba el jugador) -> 8 de daño y empuje de 55 px hacia el CENTRO de la arena -> descansa 600 ms (vulnerable).
  function dogPath(e, d) { return G.clamp(d + 20, 80, DG.dashMax * DG.dashSpd / 1000); }
  function ai_dog(e, dt, s, p, d, a) {
    if (e.st === 'move') {   // órbita
      e.orbT -= dt;
      if (d > e.orR + 50) moveTo(e, a, e.spd * 1.3, s);   // aún lejos: se acerca hasta su radio de órbita
      else {
        var rr = d + G.clamp(e.orR - d, -e.spd * s, e.spd * s), th = Math.atan2(e.y - p.y, e.x - p.x) + e.strafe * Math.min(DG.w, e.spd * 1.6 / rr) * s;
        var nx = p.x + Math.cos(th) * rr, ny = p.y + Math.sin(th) * rr, m = G.WALL + e.r + 12;
        if (nx < m || nx > G.AW - m || ny < m || ny > G.AH - m) { e.strafe *= -1; moveTo(e, a, e.spd * 0.6, s); }   // pared: cambia el sentido del giro
        else { e.x = nx; e.y = ny; }
      }
      if (e.orbT <= 0 && d < 330) { e.st = 'bark'; e.t = 0; e.ang = a; e.bk2 = false; G.sfx('dog_bark', { vol: 0.9 }); }
      else if (e.orbT <= 0) e.orbT = 500;
    } else if (e.st === 'bark') {
      e.t += dt;
      if (e.t < B.tele.dog.ms - 150) e.ang = a;
      e.face = Math.cos(e.ang) >= 0 ? 1 : -1;
      if (!e.bk2 && e.t >= 220) { e.bk2 = true; G.sfx('dog_bark', { vol: 0.7, pitch: 1.15 }); }   // dos ladridos
      if (e.t >= B.tele.dog.ms) {
        e.st = 'dash'; e.t = 0; e.hitDone = false; e.dashMs = G.clamp((dogPath(e, d)) / DG.dashSpd * 1000, DG.dashMin, DG.dashMax);
        G.sfx('dog_dash', { vol: 0.8 });
      }
    } else if (e.st === 'dash') {
      e.t += dt; moveTo(e, e.ang, DG.dashSpd, s); e.face = Math.cos(e.ang) >= 0 ? 1 : -1;
      if (!e.hitDone && !p.dead && d < e.r + p.r + 2) {
        e.hitDone = true; var o = centerPush(p);
        G.Player.hurt(p, e.dmg, o[0], o[1], { src: 'dog', kb: DG.push / 60 });
        fx.ring(p.x, p.y, 4, 30, 220, '#d8cfae', 3); e.st = 'rec'; e.t = 0;
      } else if (e.t >= e.dashMs) { e.st = 'rec'; e.t = 0; fx.dust(e.x, e.y, 3); }
    } else if (e.st === 'rec') {
      e.t += dt;
      if (e.t >= DG.rec) { e.st = 'move'; e.orbT = G.rnd(DG.orbMs[0], DG.orbMs[1]); e.orR = G.rnd(170, 200); e.strafe = Math.random() < 0.5 ? 1 : -1; }
    }
  }

  // M2 Calavera rodante: aviso 600 ms (carril rojo hacia el jugador, fijo en los últimos 200 ms), rueda 300 px/s hasta 280 px. Si choca con pared / pilar REBOTA una vez:
  // se aturde 400 ms (ventana x1,3) y muestra una flecha roja de 400 ms hacia el segundo tramo (200 px); si no choca, descansa aturdida 900 ms (como el Jabalí).
  function skullBounce(e) {   // true si choca con pared o pilar (y refleja la dirección)
    var m = G.WALL + e.r + 1, nx = 0, ny = 0, i, ob = G.Boss.obs;
    if (e.x <= m) nx = 1; else if (e.x >= G.AW - m) nx = -1;
    if (e.y <= m) ny = 1; else if (e.y >= G.AH - m) ny = -1;
    for (i = 0; i < ob.length; i++) { var o = ob[i]; if (!o.dead && Math.hypot(o.x - e.x, o.y - e.y) < o.r + e.r * 0.8) { var dx = e.x - o.x, dy = e.y - o.y, l = Math.hypot(dx, dy) || 1; nx = dx / l; ny = dy / l; break; } }
    if (!nx && !ny) return false;
    var nl = Math.hypot(nx, ny); nx /= nl; ny /= nl;
    var vx = Math.cos(e.ang), vy = Math.sin(e.ang), dp = vx * nx + vy * ny;
    if (dp < 0) { vx -= 2 * dp * nx; vy -= 2 * dp * ny; e.ang = Math.atan2(vy, vx); }
    return true;
  }
  function ai_skull(e, dt, s, p, d, a) {
    var st = e.st;
    if (e.expT > 0) e.expT -= dt;
    if (st === 'move') {
      moveTo(e, a, e.spd, s);
      if (d < 250) { e.st = 'wind'; e.t = 0; e.ang = a; G.sfx('skull_roll', { vol: 0.9 }); }
    } else if (st === 'wind') {
      e.t += dt;
      if (e.t < B.tele.roll.ms - 200) e.ang = a;
      if (e.t >= B.tele.roll.ms) { e.st = 'roll'; e.t = 0; e.trav = 0; e.hitDone = false; e.len = SK.len; e.face = Math.cos(e.ang) >= 0 ? 1 : -1; }
    } else if (st === 'roll' || st === 'roll2') {
      e.t += dt; var step = SK.spd * s; moveTo(e, e.ang, SK.spd, s); e.trav += step;
      if (Math.random() < 0.3) fx.dust(e.x, e.y + 10, 1);
      if (!e.hitDone && !p.dead && d < e.r + p.r) { e.hitDone = true; G.Player.hurt(p, e.dmg, e.x, e.y, { src: 'boar' }); }
      var hit = skullBounce(e);
      if (hit && st === 'roll' && e.trav < e.len) {   // rebote: aturdida con el aviso del segundo tramo
        e.st = 'bounce'; e.t = 0; e.expT = SK.stun1; e.expMul = 1.3; fx.shake(5, 150); fx.dust(e.x, e.y, 6); G.sfx('skull_bounce', { vol: 0.9 }); G.sfx('skull_roll', { vol: 0.6, pitch: 1.2 });
        e.x = G.clamp(e.x, G.WALL + e.r + 2, G.AW - G.WALL - e.r - 2); e.y = G.clamp(e.y, G.WALL + e.r + 2, G.AH - G.WALL - e.r - 2);
      } else if (hit || e.trav >= e.len) {
        e.st = 'stun'; e.t = 0; if (hit) { fx.shake(4, 120); fx.dust(e.x, e.y, 6); G.sfx('skull_bounce', { vol: 0.8 }); }
      }
    } else if (st === 'bounce') {
      e.t += dt;
      if (e.t >= B.tele.bounce.ms) { e.st = 'roll2'; e.t = 0; e.trav = 0; e.hitDone = false; e.len = SK.len2; e.face = Math.cos(e.ang) >= 0 ? 1 : -1; }
    } else if (st === 'stun') {
      e.t += dt;
      if (e.t >= SK.stun) { e.st = 'move'; e.t = 0; }
    }
  }

  // M3 Salamandra de lava: camina hacia el jugador y deja un charco cada 70 px (r 22: aviso naranja punteado 600 ms sin daño, 5 s activo, 5 de daño / 400 ms); máx. 6 por salamandra
  function layPool(e) {
    var n = 0, i, oldest = -1;
    for (i = 0; i < G.zones.length; i++) { var z = G.zones[i]; if (z.team === 'e' && z.owner === e && z.kind === 'fire') { n++; if (oldest < 0) oldest = i; } }
    if (n >= SL.max && oldest >= 0) G.zones.splice(oldest, 1);   // se apaga el más viejo
    E.zone({ kind: 'fire', x: e.x, y: e.y + 4, r: SL.r, arm: B.tele.salamander.ms, life: SL.life, dmg: e.dmg * SL.dmg, tick: 400, owner: e, src: 'salamander_pool' });
    var now = performance.now(); if (now - (E._poolSfx || 0) > 180) { E._poolSfx = now; G.sfx('lava_pool', { vol: 0.5 }); }
  }
  function ai_salamander(e, dt, s, p, d, a) {
    if (e.lx == null) { e.lx = e.x; e.ly = e.y; }
    moveTo(e, a, e.spd, s);
    contact(e, dt, p, d, 900, 'salamander');
    if (Math.hypot(e.x - e.lx, e.y - e.ly) >= SL.every) { layPool(e); e.lx = e.x; e.ly = e.y; }
  }

  // M4 Guardián de cadenas: mantiene distancia; cada 5 s apunta 700 ms (línea fina naranja, fija los últimos 300 ms) y lanza una cadena a 420 px/s, alcance 300:
  // 6 de daño y ralentiza 45 % durante 1,8 s. No se puede interceptar con cartas, solo esquivar.
  function ai_chainer(e, dt, s, p, d, a) {
    if (e.st === 'move') {
      kite(e, a, d, 180, 260, s);
      contact(e, dt, p, d, 900, 'chainer');
      e.atkT -= dt;
      if (e.atkT <= 0 && d < CH.range + 50) { e.st = 'wind'; e.t = 0; e.ang = a; G.sfx('chain_rattle', { vol: 0.9 }); }
    } else if (e.st === 'wind') {
      e.t += dt;
      if (e.t < B.tele.chainer.ms - CH.fix) e.ang = a;
      e.face = Math.cos(e.ang) >= 0 ? 1 : -1;
      if (e.t >= B.tele.chainer.ms) {
        E.shoot('e', e.x, e.y - 4, e.ang, CH.spd, e.dmg, 'proj_chain', { r: 9, life: CH.range / CH.spd * 1000, slow: CH.slow, src: 'chainer', kind: 'chain', ox: e.x, oy: e.y - 4, sfxHit: 'chain_hit' });
        G.sfx('chain_throw', { vol: 0.8 }); e.st = 'throw'; e.t = 0;
      }
    } else if (e.st === 'throw') {
      e.t += dt;
      if (e.t >= 300) { e.st = 'move'; e.atkT = CH.gap; }
    }
  }

  // ---------------------------------------------------------------- Familia P2 (Asfódelo): mecánicas M5-M10 (DESIGN-v5-biomas.md A.5 / A.6). Tiempos de aviso: G.B.tele
  var LE = { range: 150, swim: 80, crawl: 80, flee: 110, lungeMin: 140, lungeMax: 220, lungeMs: 330, expMs: 1200, expMul: 1.3, cool: 3000, ring: 30 };   // Sanguijuela
  var FR = { jump: 220, min: 60, r: 24, hitK: 0.6, air: 400, arc: 46, gap: 1000, rest: 700, restMul: 1.3, poolR: 28, poolArm: 600, poolLife: 3000, poolDmg: 0.6 };   // Rana ácida
  var HL = { bite: 70, ring: 32, rest: 1200, regrowTele: 600 };                                                     // Cabeza menor
  var EL = { len: 300, w: 18, zap: 150, dash: 500, dashSpd: 300, rest: 800, restMul: 1.3, gap: 3500, contact: 10 / 14 };   // Anguila eléctrica

  // M5 Sanguijuela: oculta en un charco (solo se ven las ondas; no es objetivo de nada). Si el jugador pasa a < 150 px: burbujas + anillo rojo r 30 + línea al jugador 500 ms,
  // lance recto de 140-220 px en 330 ms (9 de daño), queda EXPUESTA 1,2 s (x1,3) y huye al charco. Mientras no hay nadie cerca nada hacia el charco más cercano al jugador (80 px/s).
  function ai_leech(e, dt, s, p, d, a) {
    if (!e.pond) return ai_worm(e, dt, s, p, d, a);
    var st = e.st, dx, dy, dd;
    if (st === 'hidden') {
      e.hidden = e.untarget = true;
      if (e.coolT > 0) e.coolT -= dt;
      e.tgtT -= dt;
      if (e.tgtT <= 0) { e.tgtT = 2500; var np = nearestPond(p, e); if (np) e.pond = np; }
      dx = e.pond.x - e.x; dy = e.pond.y - e.y; dd = Math.hypot(dx, dy);
      if (dd > 5) {
        moveTo(e, Math.atan2(dy, dx), LE.swim, s);
        if (d < 520 && (e.swimT = (e.swimT || 0) - dt) <= 0) { e.swimT = G.rnd(2500, 5000); fsfx(e, 'swim', { vol: 0.3 }); }
      }
      if (!p.dead && e.coolT <= 0 && d < LE.range) { e.st = 'amb'; e.t = 0; e.ang = a; e.ambSnd = false; fsfx(e, 'tele', { vol: 0.8 }); }
    } else if (st === 'amb') {
      e.t += dt;
      if (e.t < B.tele.leech.ms - 200) e.ang = a;   // el rumbo se fija en los últimos 200 ms
      e.face = Math.cos(e.ang) >= 0 ? 1 : -1;
      if (Math.random() < 0.25) fx.dot(e.x + G.rnd(-12, 12), e.y + G.rnd(-6, 6), 0, -45, 500, '#cfeff0', 3, { drag: 1 });
      if (e.t >= B.tele.leech.ms) {
        e.st = 'lunge'; e.t = 0; e.hidden = false; e.untarget = false; e.hitDone = false; e.len = G.clamp(d + 20, LE.lungeMin, LE.lungeMax);
        fx.ring(e.x, e.y, 6, 30, 260, '#bfeaff', 3); fsfx(e, 'lunge', { vol: 0.8 });
      }
    } else if (st === 'lunge') {
      e.t += dt; moveTo(e, e.ang, e.len / (LE.lungeMs / 1000), s);
      if (!e.hitDone && !p.dead && d < e.r + p.r + 3) { if (G.Player.hurt(p, e.dmg, e.x, e.y, { src: 'leech' }) || G.god) e.hitDone = true; }
      if (e.t >= LE.lungeMs) { e.st = 'exposed'; e.t = 0; e.expT = LE.expMs; e.expMul = LE.expMul; }
    } else if (st === 'exposed') {
      e.t += dt; if (e.expT > 0) e.expT -= dt;
      if (e.t >= LE.expMs) { e.st = 'flee'; e.t = 0; }
    } else if (st === 'flee') {
      dx = e.pond.x - e.x; dy = e.pond.y - e.y; dd = Math.hypot(dx, dy);
      moveTo(e, Math.atan2(dy, dx), e.crawl ? LE.crawl : LE.flee, s); e.face = dx >= 0 ? 1 : -1;
      if (dd < 8) { e.st = 'hidden'; e.hidden = e.untarget = true; e.coolT = e.crawl ? 1500 : LE.cool; e.crawl = false; e.tgtT = G.rnd(500, 2000); fx.ring(e.x, e.y, 4, 26, 300, '#9fd8d0', 2); }
    }
  }

  // M5/M7 Cabeza menor: brota de un charco (burbujas + anillo r 32, 700 ms; hiere si estás encima), queda fija y muerde en un radio de 70 px (aviso 500 ms).
  // Si muere sin quemarse (último golpe distinto de Fuego y sin quemadura) deja un muñón y REBROTA a los 8 s con el 60 % de la vida (máx. 2 veces); XP/Ceniza/botín solo la 1.ª vez.
  function ai_headlet(e, dt, s, p, d, a) {
    var st = e.st, RG = e.fe && e.fe.regrow || { ms: 8000, hp: 0.6, max: 2 };
    if (st === 'emerge' || st === 'regrow') {
      if (e.t === 0) fsfx(e, st === 'emerge' ? 'tele' : 'regrow', { vol: 0.8 });
      e.t += dt; if (Math.random() < 0.3) fx.dot(e.x + G.rnd(-14, 14), e.y + G.rnd(-6, 6), 0, -50, 500, '#cfeff0', 3, { drag: 1 });
      if (e.t >= (st === 'emerge' ? B.tele.emerge.ms : HL.regrowTele)) {
        if (st === 'regrow') e.hp = e.maxHp * RG.hp;
        e.st = 'idle'; e.t = 0; e.untarget = false; e.immune = false; e.biteT = 600; e.face = 1;
        fx.ring(e.x, e.y, 6, HL.ring + 6, 260, '#bfeaff', 3); fx.dust(e.x, e.y, 3);
        if (!p.dead && d <= HL.ring + p.r * 0.6) G.Player.hurt(p, e.dmg, e.x, e.y, { src: 'headlet' });
      }
    } else if (st === 'idle') {
      if (e.biteT > 0) e.biteT -= dt;
      if (!p.dead && e.biteT <= 0 && d < HL.bite) { e.st = 'wind'; e.t = 0; fsfx(e, 'tele', { vol: 0.5 }); }
    } else if (st === 'wind') {
      e.t += dt;
      if (e.t >= B.tele.headlet.ms) {
        if (!p.dead && d <= HL.bite) G.Player.hurt(p, e.dmg, e.x, e.y, { src: 'headlet' });
        fx.ring(e.x, e.y, 10, HL.bite, 220, '#ffffff', 3); fsfx(e, 'bite', { vol: 0.8 }); e.st = 'bite'; e.t = 0;
      }
    } else if (st === 'bite') {
      e.t += dt; if (e.t >= 300) { e.st = 'idle'; e.t = 0; e.biteT = HL.rest; }
    } else if (st === 'stump') {
      e.t += dt;
      if (e.t >= RG.ms - HL.regrowTele) { e.st = 'regrow'; e.t = 0; }
    }
  }
  // muñón (la cabeza no ha sido cauterizada): vive en G.enemies 8 s; no es objetivo; XP/Ceniza/botín solo la primera vez
  function stumpHead(e, tag) {
    var p = PL(), first = !e.rewarded;
    e.regrowN = (e.regrowN || 0) + 1; e.st = 'stump'; e.t = 0; e.untarget = true; e.immune = true;
    e.burnT = e.poisonT = e.bleedT = e.slowT = e.stunT = e.expT = 0; e.poisonN = 0; e.hp = e.maxHp * e.fe.regrow.hp; e.kx = e.ky = 0;
    fx.puff(e.x, e.y, 2); fx.smoke(e.x, e.y, 4); fx.ring(e.x, e.y, 6, 34, 300, '#2f9a8a', 3);
    var now = performance.now(); if (now - (E._dieSfx || 0) > 70) { E._dieSfx = now; G.sfx('enemy_die', { vol: 0.5 }); }
    if (first) { e.rewarded = true; e.noQuest = true; G.kills++; p.kills++; G.Combat.onKill(e, tag || e.lastTag); }
  }

  // M6 Rana ácida: salto balístico. Se agacha 500 ms (círculo rojo r 24 en el punto de aterrizaje, fijado al empezar), salta 400 ms (arco), aterriza (10 de daño si estás dentro),
  // deja un charco ácido r 28 (aviso 600 ms, 3 s, 6 / 500 ms) y descansa 700 ms (x1,3). Ciclo ~2,6 s.
  function ai_frog(e, dt, s, p, d, a) {
    var st = e.st;
    if (st === 'move') {
      moveTo(e, a, e.spd, s);
      e.hopT -= dt;
      if (e.hopT <= 0) {
        if (!p.dead && d < 300 && d > 40) {
          var jd = G.clamp(d, FR.min, FR.jump), mg = G.WALL + 24;
          e.st = 'crouch'; e.t = 0; e.fx0 = e.x; e.fy0 = e.y;
          e.lx = G.clamp(e.x + Math.cos(a) * jd, mg, G.AW - mg); e.ly = G.clamp(e.y + Math.sin(a) * jd, mg, G.AH - mg);
          e.face = Math.cos(a) >= 0 ? 1 : -1; fsfx(e, 'tele', { vol: 0.8 });
        } else e.hopT = 300;
      }
    } else if (st === 'crouch') {
      e.t += dt; if (e.t >= B.tele.frog.ms) { e.st = 'air'; e.t = 0; fsfx(e, 'hop', { vol: 0.7 }); }
    } else if (st === 'air') {
      e.t += dt; var u = Math.min(1, e.t / FR.air);
      e.x = e.fx0 + (e.lx - e.fx0) * u; e.y = e.fy0 + (e.ly - e.fy0) * u; e.jump = Math.sin(u * Math.PI) * FR.arc;
      if (u >= 1) {
        e.jump = 0; e.st = 'rest'; e.t = 0; e.expT = FR.rest; e.expMul = FR.restMul;
        fx.ring(e.x, e.y, 6, FR.r + 8, 240, '#9bff4a', 4); fx.dust(e.x, e.y + 6, 5); fx.shake(2, 80); fsfx(e, 'land', { vol: 0.8 }); fsfx(e, 'splash', { vol: 0.6 });
        if (!p.dead && G.dist(p.x, p.y, e.lx, e.ly) <= FR.r + p.r * FR.hitK) G.Player.hurt(p, e.dmg, e.lx, e.ly, { src: 'frog' });
        E.zone({ kind: 'acid', x: e.lx, y: e.ly, r: FR.poolR, arm: FR.poolArm, life: FR.poolLife, dmg: e.dmg * FR.poolDmg, tick: 500, slow: 0, owner: e, src: 'frog_pool' });
      }
    } else if (st === 'rest') {
      e.t += dt; if (e.expT > 0) e.expT -= dt;
      if (e.t >= FR.rest) { e.st = 'move'; e.t = 0; e.hopT = FR.gap; }
    }
  }

  // M8 Anguila eléctrica: carril rojo 18 x 300 (aviso 700 ms, fijo los últimos 300), RAYO INSTANTÁNEO de 150 ms sobre todo el carril (14 de daño; sin rastro persistente),
  // luego carga de 300 px/s (contacto 10) y descansa 800 ms (x1,3).
  function eelLaneHit(e, p) {
    var ca = Math.cos(e.ang), sa = Math.sin(e.ang), rx = p.x - e.x, ry = p.y - e.y, along = rx * ca + ry * sa, perp = Math.abs(-rx * sa + ry * ca);
    return along >= -p.r && along <= EL.len && perp <= EL.w / 2 + p.r - 1;
  }
  function ai_eel(e, dt, s, p, d, a) {
    var st = e.st;
    if (st === 'move') {
      moveTo(e, a, e.spd, s);
      if (e.hitCd > 0) e.hitCd -= dt; else if (!p.dead && d < e.r + p.r + 3) { G.Player.hurt(p, e.dmg * EL.contact, e.x, e.y, { src: 'eel' }); e.hitCd = 1000; }
      e.atkT -= dt;
      if (e.atkT <= 0 && d < EL.len - 40) { e.st = 'wind'; e.t = 0; e.ang = a; e.face = Math.cos(a) >= 0 ? 1 : -1; fsfx(e, 'tele', { vol: 0.8 }); }
    } else if (st === 'wind') {
      e.t += dt;
      if (e.t < B.tele.eel.ms - 300) { e.ang = a; e.face = Math.cos(a) >= 0 ? 1 : -1; }
      if (Math.random() < 0.3) fx.spark(e.x, e.y - 4, 1, e.ang);
      if (e.t >= B.tele.eel.ms) {
        e.st = 'zap'; e.t = 0; e.hitDone = false; fsfx(e, 'zap', { vol: 0.9 }); fx.shake(3, 100);
        var ca = Math.cos(e.ang), sa = Math.sin(e.ang);
        for (var k = 0; k < 3; k++) fx.bolt(e.x + ca * (k * 100), e.y + sa * (k * 100) - 3, e.x + ca * (k * 100 + 100), e.y + sa * (k * 100 + 100) - 3, '#fff6a8', 3);
      }
    } else if (st === 'zap') {
      e.t += dt;
      if (!e.hitDone && !p.dead && eelLaneHit(e, p)) { if (G.Player.hurt(p, e.dmg, e.x, e.y, { src: 'eel' }) || G.god) e.hitDone = true; }
      if (e.t >= EL.zap) { e.st = 'dash'; e.t = 0; e.hitDone2 = false; fsfx(e, 'dash', { vol: 0.6 }); }
    } else if (st === 'dash') {
      e.t += dt; moveTo(e, e.ang, EL.dashSpd, s);
      if (!e.hitDone2 && !p.dead && d < e.r + p.r) { if (G.Player.hurt(p, e.dmg * EL.contact, e.x, e.y, { src: 'eel' }) || G.god) e.hitDone2 = true; }
      var m = G.WALL + e.r + 1;
      if (e.t >= EL.dash || e.x <= m || e.x >= G.AW - m || e.y <= m || e.y >= G.AH - m) { e.st = 'rec'; e.t = 0; e.expT = EL.rest; e.expMul = EL.restMul; fx.dust(e.x, e.y, 4); }
    } else if (st === 'rec') {
      e.t += dt; if (e.expT > 0) e.expT -= dt;
      if (e.t >= EL.rest) { e.st = 'move'; e.atkT = EL.gap; }
    }
  }

  // ---- Minijefes v5 (Coloso Escudero y Madre Colmena): bolsa de ataques, enrage al 50 %, parte rompible y ventanas de exposición.
  function shuffleBag(a) { for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)), t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
  // exposición: el golpe de cualquier ángulo hace x mul durante ms (la lee Combat.deal)
  E.expose = function (e, ms, mul) { e.expT = Math.max(e.expT || 0, ms); e.expMul = mul; fx.ring(e.x, e.y, 10, e.r + 26, 350, '#ffe27a', 3); G.sfx('card_select', { pitch: 1.6, vol: 0.5 }); };
  function miniHeart(e) { G.Combat.dropGem(e.x + 20, e.y + 14, 'heart', B.player.heal); }

  var MB = B.mini.bulwark, BASH_R = 100;
  function setRec(e, ms, expose) {
    e.st = 'rec'; e.t = 0; e.recDur = ms * (e.enraged ? MB.recMul : 1);
    if (expose) { e.shieldDown = true; E.expose(e, e.recDur, MB.expMul); }
  }
  function afterAttack(e) {                          // cada 3 ataques, ventana larga con el escudo bajo (x1,5 desde cualquier ángulo)
    e.ai++;
    if (e.ai % 3 === 0) setRec(e, 1200, true); else setRec(e, 500, false);
  }
  function atkLog(t, n) { if (G.dbg) { var A = G.dbg.atk || (G.dbg.atk = {}); A[t + ':' + n] = (A[t + ':' + n] || 0) + 1; } return n; }   // ?dbg=1: cuenta los ataques usados
  function bulwarkOk(n, d) { return n === 'bash' ? d < BASH_R : n === 'stomp' ? d < 190 : n === 'charge' ? (d >= 130 && d <= 430) : d < 340; }
  // Guardianes de bioma (J3, ligeros): mismo motor y misma parte rompible, pero solo 2 ataques y otro nombre/color. Cripta: Centinela de Brasa (Embestida con onda + Escudos giratorios);
  // Asfodelo: Plañidera Anegada (Lluvia de larvas + Marea ácida). Se reconocen por e.variant ('warden' | 'wraith'); el tipo sigue siendo mini_bulwark / mini_hive (botín, encargos y PF iguales).
  E.VARIANTS = { warden: { name: 'CENTINELA DE BRASA', part: 'PETO', tint: '#c4501a' }, wraith: { name: 'PLAÑIDERA ANEGADA', part: 'BOLSA', tint: '#2f9a9a' } };
  E.variant = function (e, v) { var d = E.VARIANTS[v]; if (!d || !e) return; e.variant = v; e.partName = d.part; e.vname = d.name; };
  function bulwarkNext(e, d) {
    if (e.force) { var f = e.force; e.force = null; return atkLog('bulwark', f); }
    if (!e.bag.length) e.bag = shuffleBag(e.variant === 'warden' ? ['charge', 'shields'] : ['bash', 'stomp', 'charge', 'shields']);
    for (var i = 0; i < e.bag.length; i++) { var n = e.bag[i]; if (n === e.lastAtk || !bulwarkOk(n, d)) continue; e.bag.splice(i, 1); e.lastAtk = n; return atkLog('bulwark', n); }
    return null;
  }
  function chargeEnd(e) {   // punto de parada de la embestida (recortado por las paredes)
    var mg = G.WALL + e.r + 2, dx = Math.cos(e.ang), dy = Math.sin(e.ang), tm = MB.chargeLen;
    if (dx > 1e-3) tm = Math.min(tm, (G.AW - mg - e.x) / dx); else if (dx < -1e-3) tm = Math.min(tm, (mg - e.x) / dx);
    if (dy > 1e-3) tm = Math.min(tm, (G.AH - mg - e.y) / dy); else if (dy < -1e-3) tm = Math.min(tm, (mg - e.y) / dy);
    e.clen = Math.max(0, tm); e.tx = e.x + dx * e.clen; e.ty = e.y + dy * e.clen;
  }
  function orbPos(e, i) { var n = e.orbN, a = e.oa + i * 6.283 / n; return { x: e.x + Math.cos(a) * MB.orbR, y: e.y + Math.sin(a) * MB.orbR, a: a }; }
  function startEnrageB(e) {
    atkLog('bulwark', 'enrage'); e.enraged = true; e.st = 'enrage'; e.t = 0; e.orbs = null; e.shieldDown = false;
    fx.shake(9, 400); fx.ring(e.x, e.y, 20, 180, 600, '#ff4030', 6); fx.flames(e.x, e.y, 10, 30); G.sfx('boss_roar', { pitch: 0.9, vol: 0.8 });
    G.Hud.banner(e.vname ? '¡' + e.vname + ' SE ENFURECE!' : '¡EL COLOSO SE ENFURECE!', 1800, '#ff6a3a');
  }
  // Escudo rompible: el daño frontal bloqueado (antes de reducirlo) gasta el medidor; al llegar a 0 el escudo cae para siempre
  E.shieldHit = function (e, pre) {
    if (e.shieldBroken || !(e.shieldHp > 0)) return;
    e.shieldHp -= pre; e.shieldFlash = 90;
    if (e.shieldHp > 0) return;
    e.shieldBroken = true; e.shield = 0; e.shieldDown = false; e.orbs = null;
    e.st = 'rec'; e.t = 0; e.recDur = MB.breakExp; E.expose(e, MB.breakExp, MB.expMul);
    fx.hit(80); fx.shake(8, 250); fx.burst(e.x, e.y, 16, '#dfe6f0', 260, 600, 4, { add: true }); fx.ring(e.x, e.y, 10, 90, 400, '#ffd27a', 5); G.sfx('hit_heavy', { pitch: 0.8 }); G.sfx('boss_roar', { pitch: 1.7, vol: 0.5 });
    G.Hud.banner('¡' + e.partName + ' ROTO!', 1500, '#ffd27a');
    miniHeart(e); G.Loot.onMiniPart(e);
  };

  function ai_bulwark(e, dt, s, p, d, a) {
    var M = MB, i, sp = e.spd * (e.enraged ? M.enrageSpd : 1);
    if (e.expT > 0) e.expT -= dt;
    if (e.shieldFlash > 0) e.shieldFlash -= dt;
    if (!e.enraged && e.hp <= e.maxHp * M.enrageAt) startEnrageB(e);
    if (e.st === 'move') {
      e.fa = a;
      if (d > e.r + p.r + 8) moveTo(e, a, sp, s);
      contact(e, dt, p, d, 1000, 'bulwark');
      e.atkT -= dt;
      if (e.atkT <= 0) {
        var n = bulwarkNext(e, d);
        if (n === 'bash') { e.st = 'wind'; e.t = 0; e.ang = a; }
        else if (n === 'stomp') { e.st = 'swind'; e.t = 0; e.ang = a; }
        else if (n === 'charge') { e.st = 'cwind'; e.t = 0; e.ang = a; e.cn = 0; chargeEnd(e); G.sfx('hit', { pitch: 0.6, vol: 0.5 }); }
        else if (n === 'shields') { e.st = 'owind'; e.t = 0; e.orbN = e.enraged ? M.orbN2 : M.orbN; e.oa = Math.random() * 6.283; e.odir = Math.random() < 0.5 ? -1 : 1; G.sfx('wave_start', { pitch: 0.7, vol: 0.5 }); }
      }
    } else if (e.st === 'enrage') {
      e.t += dt; if (e.t >= 900) { e.st = 'move'; e.atkT = 500; }
    } else if (e.st === 'wind') {
      e.t += dt;
      if (e.t < 500) { e.fa = a; e.ang = a; }
      if (e.t >= 700) {
        e.st = 'strike'; e.t = 0; fx.shake(6, 180); G.sfx('hit_heavy');
        if (!p.dead && inFan(e, p, e.ang, 45 * DEG, BASH_R + p.r)) G.Player.hurt(p, e.dmg, e.x, e.y, { src: 'bulwark', kb: 1.4 });
        fx.ring(e.x, e.y, 20, BASH_R, 250, '#ffcf7a', 4);
      }
    } else if (e.st === 'strike') {
      e.t += dt;
      if (e.t >= 150) afterAttack(e);
    } else if (e.st === 'swind') {
      e.t += dt;
      if (e.t >= 700) {
        var nw = e.enraged ? 4 : 3;
        e.st = 'swave'; e.t = 0; e.waves = []; for (i = 0; i < nw; i++) e.waves.push({ t: -250 * i, hit: false });
        fx.shake(7, 220); G.sfx('explosion', { pitch: 0.7 });
      }
    } else if (e.st === 'swave') {
      e.t += dt;
      for (i = 0; i < e.waves.length; i++) {
        var w = e.waves[i]; w.t += dt;
        if (w.t < 0 || w.t > 450) continue;
        w.r = 20 + 105 * (w.t / 450);
        if (!w.hit && !p.dead && Math.abs(d - w.r) <= 9 + p.r * 0.6) { w.hit = true; G.Player.hurt(p, e.dmg * 16 / 22, e.x, e.y, { src: 'bulwark', kb: 0.8 }); }
      }
      if (e.t >= 450 + 250 * (e.waves.length - 1) + 20) afterAttack(e);
    // ---- Embestida con onda de choque: carril rojo + círculo de impacto; al llegar estalla un anillo; al final queda expuesta
    } else if (e.st === 'cwind') {
      var tele = e.cn ? M.chargeTele2 : M.chargeTele, fix = e.cn ? M.chargeFix2 : M.chargeFix;
      e.t += dt;
      if (e.t < fix) { e.ang = a; e.fa = a; chargeEnd(e); }
      if (e.t >= tele) { e.st = 'charge'; e.t = 0; e.trav = 0; e.hitDone = false; G.sfx('boss_roar', { pitch: 1.3, vol: 0.6 }); }
    } else if (e.st === 'charge') {
      e.t += dt; var stp = Math.min(M.chargeSpd * s, e.clen - e.trav);
      e.x += Math.cos(e.ang) * stp; e.y += Math.sin(e.ang) * stp; e.trav += stp;
      if (Math.random() < 0.5) fx.dust(e.x - Math.cos(e.ang) * 20, e.y + 16, 1);
      if (!e.hitDone && !p.dead && d < e.r + p.r + 4) { e.hitDone = true; G.Player.hurt(p, e.dmg * M.chargeDmg, e.x, e.y, { src: 'bulwark_charge', kb: 1.6 }); }
      if (e.trav >= e.clen - 0.01) { e.st = 'cring'; e.t = 0; e.ringHit = false; fx.shake(8, 220); G.sfx('explosion', { pitch: 0.6 }); fx.dust(e.x, e.y + 14, 10); }
    } else if (e.st === 'cring') {
      e.t += dt; var rr = 18 + (M.ringR - 18) * G.clamp(e.t / M.ringMs, 0, 1);
      if (!e.ringHit && !p.dead && Math.abs(d - rr) <= 9 + p.r * 0.6) { e.ringHit = true; G.Player.hurt(p, e.dmg * M.ringDmg, e.x, e.y, { src: 'bulwark_ring', kb: 1 }); }
      if (e.t >= M.ringMs) {
        e.cn++;
        if (e.enraged && e.cn < 2) { e.st = 'cwind'; e.t = 0; e.ang = a; chargeEnd(e); G.sfx('hit', { pitch: 0.6, vol: 0.5 }); }
        else { e.ai++; e.recDur = M.chargeExp; e.st = 'rec'; e.t = 0; e.shieldDown = true; E.expose(e, M.chargeExp, M.expMul); }
      }
    // ---- Escudos giratorios: aparecen, giran (dañan al tocarlos) y salen disparados en línea recta tras un aviso
    } else if (e.st === 'owind') {
      e.t += dt; if (d > e.r + p.r + 8) moveTo(e, a, sp * 0.4, s);
      if (e.t >= M.orbTele) { e.st = 'orbit'; e.t = 0; e.orbs = true; G.sfx('whoosh', { pitch: 0.7, vol: 0.6 }); }
    } else if (e.st === 'orbit') {
      e.t += dt; e.oa += e.odir * M.orbOmega * s; if (d > e.r + p.r + 8) moveTo(e, a, sp * 0.5, s);
      for (i = 0; i < e.orbN; i++) {
        var ob = orbPos(e, i);
        if (!p.dead && G.dist(ob.x, ob.y, p.x, p.y) < 13 + p.r - 1) G.Player.hurt(p, e.dmg * M.orbDmg, ob.x, ob.y, { src: 'bulwark_orb', kb: 0.8 });
      }
      if (e.t >= M.orbDur) { e.st = 'olaunch'; e.t = 0; G.sfx('hit', { pitch: 1.4, vol: 0.5 }); }
    } else if (e.st === 'olaunch') {
      e.t += dt;
      if (e.t >= M.orbLaunch) {
        for (i = 0; i < e.orbN; i++) { var ob2 = orbPos(e, i); E.shoot('e', ob2.x, ob2.y, ob2.a, M.bitSpd, e.dmg * M.orbDmg, null, { r: 12, life: 1500, src: 'bulwark_orb', kind: 'shieldbit' }); }
        G.sfx('shoot', { pitch: 0.7, vol: 0.7 }); fx.shake(4, 120); e.orbs = null;
        afterAttack(e);
      }
    } else if (e.st === 'rec') {
      e.t += dt;
      if (e.t >= e.recDur) { e.st = 'move'; e.shieldDown = false; e.atkT = (e.enraged ? M.enrageGap : M.atkGap) * (e.shieldBroken ? 0.8 : 1); }
    }
  }

  // ---- Madre Colmena v5
  var MH = B.mini.hive;
  function hiveKids(e) { var n = 0; for (var i = 0; i < G.enemies.length; i++) { var q = G.enemies[i]; if (!q.dead && q.src === e) n++; } return n; }
  function hiveNext(e) {
    if (e.force) { var f = e.force; e.force = null; return atkLog('hive', f); }
    if (!e.bag.length) e.bag = shuffleBag(e.variant === 'wraith' ? (e.sacBroken ? ['spit', 'tide'] : ['rain', 'tide']) : e.sacBroken ? ['spit', 'acid', 'tide'] : ['spit', 'acid', 'rain', 'tide']);
    for (var i = 0; i < e.bag.length; i++) { var n = e.bag[i]; if (n === e.lastAtk || (n === 'rain' && e.sacBroken)) continue; e.bag.splice(i, 1); e.lastAtk = n; return atkLog('hive', n); }
    e.bag = []; return atkLog('hive', 'spit');
  }
  function hiveDmg() { return B.enemy.worm.dmg * B.dmgMult(mins()) * 1.2; }
  E.sacHit = function (e, dmg) {
    if (e.sacBroken || !(e.sacHp > 0)) return;
    e.sacHp -= dmg * MH.sacShare; e.sacFlash = 90;
    if (e.sacHp > 0) return;
    e.sacBroken = true; e.rain = null; e.st = 'stag'; e.t = 0; E.expose(e, MH.breakExp, MH.expMul);
    fx.hit(80); fx.shake(8, 250); fx.burst(e.x, e.y, 18, '#ffb73a', 260, 600, 4, { add: true }); fx.ring(e.x, e.y, 10, 100, 400, '#ffd27a', 5); G.sfx('boss_roar', { pitch: 1.7, vol: 0.5 });
    G.Hud.banner(e.variant ? '¡' + e.partName + ' ROTA!' : '¡SACO DE LARVAS ROTO!', 1500, '#ffd27a');
    for (var j = 0; j < 6; j++) { var an = j * 1.047 + G.rnd(-0.2, 0.2); E.spawn('worm', e.x + Math.cos(an) * 40, e.y + Math.sin(an) * 40, { summoned: true, hp: 12, scale: 0.85, spawnT: 400, src: e }); }
    miniHeart(e); G.Loot.onMiniPart(e);
  };
  function ai_hive(e, dt, s, p, d, a) {
    var i, M = MH;
    if (e.expT > 0) e.expT -= dt;
    if (e.sacFlash > 0) e.sacFlash -= dt;
    if (!e.enraged && e.hp <= e.maxHp * M.enrageAt && e.st !== 'burst') {   // Estallido de enjambre: se hincha 1,15 s (círculo rojo) y revienta
      e.enraged = true; e.st = 'burst'; e.t = 0; e.rain = null; atkLog('hive', 'burst');
      fx.shake(7, 300); G.sfx('boss_roar', { pitch: 1.5, vol: 0.7 }); G.Hud.banner(e.vname ? '¡' + e.vname + ' ESTALLA!' : '¡LA COLMENA ESTALLA!', 1800, '#ffb73a');
    }
    if (e.enraged) e.spd *= M.enrageSpd;
    if (e.st === 'move') {
      kite(e, a, d, 150, 230, s);
      contact(e, dt, p, d, 1000, 'hive');
      e.atkT -= dt; e.ecT -= dt;
      if (e.ecT <= 0) { e.st = 'swell'; e.t = 0; atkLog('hive', 'swell'); }
      else if (e.atkT <= 0) {
        var n = hiveNext(e);
        if (n === 'spit') {
          e.st = 'spit'; e.t = 0; e.land = [];
          for (var k = -1; k <= 1; k++) { var an = a + k * 0.5; e.land.push({ x: G.clamp(e.x + Math.cos(an) * 90, G.WALL + 12, G.AW - G.WALL - 12), y: G.clamp(e.y + Math.sin(an) * 90, G.WALL + 12, G.AH - G.WALL - 12) }); }
        } else if (n === 'acid') {
          e.st = 'acid'; e.t = 0;
          E.zone({ kind: 'acid', x: p.x, y: p.y, r: 55, arm: 900, life: 4000, dmg: hiveDmg(), tick: 500, slow: 0.15, owner: e, src: 'hive' });
          G.sfx('wave_start', { pitch: 0.8, vol: 0.4 });
        } else if (n === 'rain') {   // Lluvia de larvas: 5 (7 enrage) círculos rojos fijos; al caer dañan y dejan una larva
          e.st = 'rwind'; e.t = 0; e.rain = [{ x: p.x, y: p.y }];
          var cnt = e.enraged ? M.rainN2 : M.rainN, tries = 0;
          while (e.rain.length < cnt && tries++ < 60) {
            var ra = G.rnd(0, 6.283), rd = G.rnd(45, 150), cx = G.clamp(p.x + Math.cos(ra) * rd, G.WALL + 30, G.AW - G.WALL - 30), cy = G.clamp(p.y + Math.sin(ra) * rd, G.WALL + 30, G.AH - G.WALL - 30), ok = true;
            for (var q = 0; q < e.rain.length; q++) if (G.dist(cx, cy, e.rain[q].x, e.rain[q].y) < M.rainR * 2 + 14) ok = false;
            if (ok) e.rain.push({ x: cx, y: cy });
          }
          G.sfx('wave_start', { pitch: 1.1, vol: 0.5 });
        } else if (n === 'tide') {   // Marea ácida: 4 (5 enrage) charcos de ácido en anillo alrededor del jugador (se arman en 1 s)
          e.st = 'twind'; e.t = 0;
          var tn = e.enraged ? M.tideN2 : M.tideN, a0 = Math.random() * 6.283;
          for (var z = 0; z < tn; z++) {
            var za = a0 + z * 6.283 / tn, zx = G.clamp(p.x + Math.cos(za) * 115, G.WALL + 55, G.AW - G.WALL - 55), zy = G.clamp(p.y + Math.sin(za) * 115, G.WALL + 55, G.AH - G.WALL - 55);
            E.zone({ kind: 'acid', x: zx, y: zy, r: M.tideR, arm: M.tideTele, life: 5500, dmg: hiveDmg(), tick: 500, slow: 0.15, owner: e, src: 'hive' });
          }
          G.sfx('wave_start', { pitch: 0.6, vol: 0.6 });
        }
      }
    } else if (e.st === 'spit') {
      e.t += dt;
      if (e.t >= 500) {
        for (i = 0; i < e.land.length; i++) E.spawn('worm', e.land[i].x, e.land[i].y, { summoned: true, spawnT: 120, src: e });
        G.sfx('shoot', { pitch: 0.7, vol: 0.5 }); e.st = 'move'; e.atkT = e.enraged ? M.enrageGap : M.atkGap; e.land = null;
      }
    } else if (e.st === 'acid') {
      e.t += dt;
      if (e.t >= 500) { e.st = 'move'; e.atkT = e.enraged ? M.enrageGap : M.atkGap; }
    } else if (e.st === 'twind') {
      e.t += dt;
      if (e.t >= 600) { e.st = 'move'; e.atkT = e.enraged ? M.enrageGap : M.atkGap; }
    } else if (e.st === 'rwind') {
      e.t += dt;
      if (e.t >= M.rainTele) {
        var kids = hiveKids(e);
        for (i = 0; i < e.rain.length; i++) {
          var r = e.rain[i];
          fx.ring(r.x, r.y, 4, M.rainR + 8, 250, '#ffb73a', 4); fx.dust(r.x, r.y, 3);
          if (!p.dead && G.dist(r.x, r.y, p.x, p.y) <= M.rainR + p.r * 0.6) G.Player.hurt(p, e.dmg * M.rainDmg, r.x, r.y, { src: 'hive_rain', kb: 0.8 });
          if (kids < M.kidsMax) { E.spawn('worm', r.x, r.y, { summoned: true, spawnT: 300, src: e }); kids++; }
        }
        G.sfx('hit_heavy', { pitch: 1.4, vol: 0.5 }); fx.shake(4, 120);
        e.st = 'move'; e.rain = null; e.atkT = e.enraged ? M.enrageGap : M.atkGap;
      }
    } else if (e.st === 'burst') {
      e.t += dt;
      if (e.t >= M.burstTele) {
        fx.shake(9, 300); fx.ring(e.x, e.y, 20, M.burstR, 400, '#ffb73a', 7); fx.shockwave(e.x, e.y, M.burstR * 2); G.sfx('explosion', { pitch: 0.8 });
        if (!p.dead && d <= M.burstR + p.r * 0.5) G.Player.hurt(p, e.dmg, e.x, e.y, { src: 'hive_burst', kb: 1.2 });
        var kb = hiveKids(e);
        for (i = 0; i < M.burstN && kb < M.kidsMax + 4; i++, kb++) { var aa = i * 6.283 / M.burstN + G.rnd(-0.2, 0.2); E.spawn('worm', e.x + Math.cos(aa) * 70, e.y + Math.sin(aa) * 70, { summoned: true, src: e }); }
        E.expose(e, M.burstExp, M.expMul);
        e.st = 'move'; e.ecT = M.swellGap2; e.atkT = 1200;
      }
    } else if (e.st === 'stag') {
      e.t += dt; if (e.t >= 800) { e.st = 'move'; e.atkT = 1500; }
    } else if (e.st === 'swell') {
      e.t += dt;
      if (e.t >= 800) {
        var sn = e.enraged ? 8 : 6;
        for (var j = 0; j < sn; j++) { var aj = j * 6.283 / sn + G.rnd(-0.2, 0.2); E.spawn('worm', e.x + Math.cos(aj) * 60, e.y + Math.sin(aj) * 60, { summoned: true, src: e }); }
        fx.ring(e.x, e.y, 10, 90, 400, '#ffb73a', 5); fx.shake(5, 200); G.sfx('boss_roar', { pitch: 1.5, vol: 0.4 });
        e.st = 'move'; e.ecT = e.enraged ? M.swellGap2 : M.swellGap; e.atkT = 2500;
      }
    }
  }
  // pruebas / capturas: E.forceMini(e, 'charge') encola un ataque concreto en el siguiente ciclo de ataque
  E.forceMini = function (e, name) { e.force = name; e.atkT = 0; };
  E.minis = function () { return G.enemies.filter(function (q) { return !q.dead && (q.type === 'mini_bulwark' || q.type === 'mini_hive'); }); };

  // ---- Jefe: la IA vive en boss.js (G.Boss.update se llama al principio de E.update)
  function ai_boss() { }

  var AI = { worm: ai_worm, archer: ai_archer, boar: ai_boar, bomb: ai_bomb, warlock: ai_warlock, boss: ai_boss, fanner: ai_fanner, shield: ai_shield, moth: ai_moth,
    sower: ai_sower, blinker: ai_blinker, scorcher: ai_scorcher, dog: ai_dog, salamander: ai_salamander, chainer: ai_chainer, leech: ai_leech, headlet: ai_headlet, mini_bulwark: ai_bulwark, mini_hive: ai_hive };

  // ------------------------------------------------------------- Update
  E.update = function (dt) {
    var s = dt / 1000, p = PL(), list = G.enemies, i, j, e;
    G.Boss.update(dt);
    var speedMul = B.speedMul(mins());
    if (G.frozen) { updateProjectiles(dt, true); return; }   // intro del jefe: el mundo enemigo se congela
    for (i = 0; i < list.length; i++) {
      e = list[i];
      if (e.dead || e.partOf) continue;
      if (e.flash > 0) e.flash -= dt;
      e.anim += dt;
      if (e.spawnT > 0) { e.spawnT -= dt; continue; }
      // empuje
      if (e.kx || e.ky) {
        e.x += e.kx * s; e.y += e.ky * s;
        var k = Math.exp(-12 * s); e.kx *= k; e.ky *= k;
        if (Math.abs(e.kx) + Math.abs(e.ky) < 4) e.kx = e.ky = 0;
      }
      // estados (quemado, veneno, sangrado...) y ralentización
      if (G.Combat.tickStatus(e, dt)) continue;
      var slowF = e.slowT > 0 ? 1 - e.slowPct : 1;
      e.spd = e.spdBase * slowF * ((e.type === 'boss' || B.enemy[e.type].elite || e.bossAdd) ? 1 : speedMul);   // velocidad creciente (B.speedRamp)
      if (e.stunT > 0) { e.anim += 0; continue; }
      var dx = p.x - e.x, dy = p.y - e.y, d = Math.hypot(dx, dy), a = Math.atan2(dy, dx);
      if (Math.abs(dx) > 2 && e.type !== 'boss' && !((e.type === 'boar' || e.type === 'scorcher') && (e.st === 'charge' || e.st === 'wind' || e.st === 'dash' || e.st === 'roll' || e.st === 'roll2' || e.st === 'bounce')) && !((e.type === 'dog' || e.type === 'chainer') && e.st !== 'move' && e.st !== 'rec')) e.face = dx >= 0 ? 1 : -1;
      if (!p.dead) AI[e.type](e, dt, s, p, d, a); else if (e.type !== 'boss') { /* sin jugador, quietos */ }
      var m = G.WALL + e.r;
      e.x = G.clamp(e.x, m, G.AW - m); e.y = G.clamp(e.y, m, G.AH - m);
    }
    // separación entre enemigos
    for (i = 0; i < list.length; i++) {
      var A = list[i]; if (A.dead || A.spawnT > 0 || A.partOf || A.nosep || A.hidden) continue;   // M10: las Almas errantes (nosep) se apilan; lo oculto no empuja
      for (j = i + 1; j < list.length; j++) {
        var C = list[j]; if (C.dead || C.spawnT > 0 || C.partOf || C.nosep || C.hidden) continue;
        var ox = C.x - A.x, oy = C.y - A.y, dd2 = Math.hypot(ox, oy), min = (A.r + C.r) * 0.85;
        if (dd2 < min && dd2 > 0.01) {
          var push = (min - dd2) / 2, wA = (A.type === 'boss' || A.fixed) ? 0 : A.big ? 0.25 : 1, wC = (C.type === 'boss' || C.fixed) ? 0 : C.big ? 0.25 : 1;
          if (wA + wC === 0) continue;
          var ta = wA / (wA + wC), tc = wC / (wA + wC);
          A.x -= ox / dd2 * push * 2 * ta; A.y -= oy / dd2 * push * 2 * ta;
          C.x += ox / dd2 * push * 2 * tc; C.y += oy / dd2 * push * 2 * tc;
        }
      }
    }
    for (i = list.length - 1; i >= 0; i--) if (list[i].dead) list.splice(i, 1);
    updateZones(dt);
    updateProjectiles(dt);
  };

  // ------------------------------------------------------------- Dibujo
  // Colores de peligro: rojo = daño directo; azul #7fd4ff = hielo; verde ácido #9bff4a = zonas persistentes; morado = invocación / teletransporte
  function RED(a) { return 'rgba(255,40,40,' + a + ')'; }
  function fan(c, x, y, r, ang, half, f) {
    c.save(); c.fillStyle = RED(0.12 + 0.25 * f); c.strokeStyle = 'rgba(255,90,90,0.8)'; c.lineWidth = 2;
    c.beginPath(); c.moveTo(x, y); c.arc(x, y, r, ang - half, ang + half); c.closePath(); c.fill(); c.stroke(); c.restore();
  }
  function disc(c, x, y, r, fill, stroke, lw) {
    c.beginPath(); c.arc(x, y, r, 0, 6.283); if (fill) { c.fillStyle = fill; c.fill(); } if (stroke) { c.strokeStyle = stroke; c.lineWidth = lw || 2; c.stroke(); }
  }

  function drawZone(c, z, i) {
    var t = G.time / 1000;
    c.save();
    if (z.kind === 'fire' && z.arm > 0) {   // charco de lava armándose (Salamandra): círculo naranja punteado, sin daño
      var ua = 1 - z.arm / z.armMax;
      disc(c, z.x, z.y, z.r, 'rgba(255,130,40,' + (0.08 + 0.16 * ua) + ')');
      c.strokeStyle = 'rgba(8,4,14,0.6)'; c.lineWidth = 5; c.beginPath(); c.arc(z.x, z.y, z.r, 0, 6.283); c.stroke();
      c.strokeStyle = 'rgba(255,150,60,0.95)'; c.lineWidth = 2; c.setLineDash([5, 5]); c.lineDashOffset = -t * 24;
      c.beginPath(); c.arc(z.x, z.y, z.r, 0, 6.283); c.stroke(); c.setLineDash([]);
      c.globalAlpha = 0.7; c.beginPath(); c.arc(z.x, z.y, z.r * ua, 0, 6.283); c.stroke();
    } else if (z.kind === 'fire') {
      var a = Math.min(1, z.life / 400);
      if (G.hasSpr('fx_fire_cell')) {
        c.globalAlpha = a; var cv = Assets.sprite('fx_fire_cell', Math.floor(z.t / 110 + i) % 3); c.drawImage(cv, Math.round(z.x - z.r - 2), Math.round(z.y - z.r - 2), z.r * 2 + 4, z.r * 2 + 4);
      } else {
        c.globalAlpha = a; disc(c, z.x, z.y, z.r, 'rgba(255,70,20,' + (0.45 + 0.15 * Math.sin(z.t / 60 + i)) + ')', 'rgba(255,150,60,0.9)', 1.5);
        disc(c, z.x, z.y - 1, z.r * 0.5, 'rgba(255,220,90,0.7)');
      }
    } else if (z.arm > 0) {
      if (z.noArmDraw) { c.restore(); return; }   // la telegrafía la dibuja boss.js (drawBossTele)
      // telegrafía: de rojo claro a verde, anillo punteado que se cierra
      var ol = z.kind === 'olvido', u = 1 - z.arm / z.armMax, rr = Math.round(255 + ((ol ? 127 : 155) - 255) * u), gg = Math.round(110 + (255 - 110) * u), bb = Math.round(100 + ((ol ? 224 : 74) - 100) * u);
      disc(c, z.x, z.y, z.r, 'rgba(' + rr + ',' + gg + ',' + bb + ',' + (0.1 + 0.16 * u) + ')');
      c.strokeStyle = 'rgba(' + rr + ',' + gg + ',' + bb + ',0.9)'; c.lineWidth = 2; c.setLineDash([6, 6]); c.lineDashOffset = -t * 20;
      c.beginPath(); c.arc(z.x, z.y, z.r, 0, 6.283); c.stroke(); c.setLineDash([]);
      c.globalAlpha = 0.7; c.beginPath(); c.arc(z.x, z.y, z.r * u, 0, 6.283); c.stroke();
    } else if (z.kind === 'olvido') {   // M9 (A.5): zona turquesa del olvido: relojes que giran al revés y un anillo punteado; dentro, las cartas recargan más lento
      var oa = Math.min(1, z.life / 500);
      c.globalAlpha = oa;
      var og = c.createRadialGradient(z.x, z.y, z.r * 0.2, z.x, z.y, z.r);
      og.addColorStop(0, 'rgba(127,255,224,0.40)'); og.addColorStop(1, 'rgba(127,255,224,0.16)');
      disc(c, z.x, z.y, z.r, G.fg(og, 'rgba(127,255,224,0.28)'), '#7fffe0', 2);
      if (G.hasSpr('fx_olvido_zone')) { var oz = Assets.sprite('fx_olvido_zone', 1 + Math.floor(z.t / 330) % 2); c.globalAlpha = oa * 0.9; c.drawImage(oz, Math.round(z.x - oz.width / 2), Math.round(z.y - oz.height / 2)); }
      else {
        c.globalAlpha = oa * 0.8; c.strokeStyle = '#d8fff4'; c.lineWidth = 1.5; c.setLineDash([4, 6]); c.lineDashOffset = t * 18;
        c.beginPath(); c.arc(z.x, z.y, z.r * 0.62, 0, 6.283); c.stroke(); c.setLineDash([]);
        var ha = -t * 1.6; c.lineWidth = 2; c.beginPath(); c.moveTo(z.x, z.y); c.lineTo(z.x + Math.cos(ha) * z.r * 0.5, z.y + Math.sin(ha) * z.r * 0.5); c.moveTo(z.x, z.y); c.lineTo(z.x + Math.cos(ha * 0.25 + 2) * z.r * 0.32, z.y + Math.sin(ha * 0.25 + 2) * z.r * 0.32); c.stroke();
        for (var tk = 0; tk < 12; tk++) { var ta = tk * 0.5236; c.beginPath(); c.moveTo(z.x + Math.cos(ta) * z.r * 0.86, z.y + Math.sin(ta) * z.r * 0.86); c.lineTo(z.x + Math.cos(ta) * z.r * 0.96, z.y + Math.sin(ta) * z.r * 0.96); c.stroke(); }
      }
    } else {
      var fa = Math.min(1, z.life / 500);
      c.globalAlpha = fa;
      var g = c.createRadialGradient(z.x, z.y, z.r * 0.2, z.x, z.y, z.r);
      g.addColorStop(0, 'rgba(155,255,74,0.42)'); g.addColorStop(1, 'rgba(155,255,74,0.2)');
      disc(c, z.x, z.y, z.r, G.fg(g, 'rgba(155,255,74,0.3)'), '#9bff4a', 2);
      if (z.src === 'frog_pool' && G.hasSpr('fx_frog_acid')) { var fa2 = Assets.sprite('fx_frog_acid', Math.floor(z.t / 250 + i) % 3); c.globalAlpha = fa * 0.9; c.drawImage(fa2, Math.round(z.x - fa2.width / 2), Math.round(z.y - fa2.height / 2)); }
      if (G.hasSpr('fx_spore_zone')) { var sp = Assets.sprite('fx_spore_zone', 1 + Math.floor(z.t / 250) % 2); c.globalAlpha = fa * 0.8; c.drawImage(sp, z.x - z.r, z.y - z.r, z.r * 2, z.r * 2); }
      else { c.globalAlpha = fa * 0.5; c.strokeStyle = '#d8ff9a'; c.lineWidth = 1.5; c.beginPath(); c.arc(z.x, z.y, z.r * (0.6 + 0.08 * Math.sin(t * 5 + i)), 0, 6.283); c.stroke(); }
    }
    c.restore();
  }

  // ---- Dibujo de los minijefes v5 (telegrafías en rojo; zonas persistentes en verde ácido; ventana de exposición en dorado)
  function shieldBit(c, x, y, ang, glow) {
    c.save(); c.translate(Math.round(x), Math.round(y)); c.rotate(ang);
    if (glow) { c.globalCompositeOperation = 'lighter'; c.globalAlpha = 0.4 + 0.3 * glow; c.fillStyle = '#ff5a3a'; c.beginPath(); c.arc(0, 0, 17, 0, 6.283); c.fill(); c.globalCompositeOperation = 'source-over'; c.globalAlpha = 1; }
    c.fillStyle = '#8a95a8'; c.strokeStyle = '#1c2230'; c.lineWidth = 2;
    c.beginPath(); c.moveTo(11, 0); c.lineTo(3, -11); c.lineTo(-8, -9); c.lineTo(-8, 9); c.lineTo(3, 11); c.closePath(); c.fill(); c.stroke();
    c.strokeStyle = '#e8c860'; c.lineWidth = 1.5; c.beginPath(); c.moveTo(7, 0); c.lineTo(-4, 0); c.stroke();
    c.fillStyle = '#e8c860'; c.beginPath(); c.arc(0, 0, 2.5, 0, 6.283); c.fill();
    c.restore();
  }
  E.shieldBit = shieldBit;
  function tdisc(c, x, y, r, fill, stroke, lw) {   // círculo de telegrafía con contorno oscuro (se lee sobre el círculo rojo del ritual)
    c.save(); c.strokeStyle = 'rgba(8,4,14,0.7)'; c.lineWidth = (lw || 2) + 4; c.beginPath(); c.arc(x, y, r, 0, 6.283); c.stroke(); c.restore();
    disc(c, x, y, r, fill, stroke, lw);
  }
  function lane(c, x, y, ang, len, w, f, fixed) {
    c.save(); c.translate(x, y); c.rotate(ang);
    c.strokeStyle = 'rgba(8,4,14,0.7)'; c.lineWidth = 6; c.strokeRect(0, -w / 2, len, w);
    c.fillStyle = RED(0.1 + 0.26 * f); c.fillRect(0, -w / 2, len, w);
    c.strokeStyle = fixed ? 'rgba(255,110,90,0.95)' : 'rgba(255,90,90,0.55)'; c.lineWidth = fixed ? 2.5 : 1.5; c.strokeRect(0, -w / 2, len, w); c.restore();
  }
  function drawBulwark(c, e, p) {
    var M = MB, i, u, st = e.st;
    if (st === 'wind') fan(c, e.x, e.y, 100 + p.r, e.ang, 45 * DEG, e.t / 700);
    else if (st === 'swind') {
      u = e.t / 700; c.save(); c.fillStyle = RED(0.1 + 0.2 * u); c.strokeStyle = 'rgba(255,90,90,0.85)'; c.lineWidth = 2;
      disc(c, e.x, e.y, 125, c.fillStyle, c.strokeStyle, 2); c.setLineDash([6, 6]);
      [50, 85].forEach(function (rr) { c.beginPath(); c.arc(e.x, e.y, rr, 0, 6.283); c.stroke(); });
      c.setLineDash([]); c.globalAlpha = 0.7; c.beginPath(); c.arc(e.x, e.y, 125 * u, 0, 6.283); c.stroke(); c.restore();
    } else if (st === 'swave') {
      c.save(); c.strokeStyle = 'rgba(255,70,50,0.9)'; c.lineWidth = 9;
      for (i = 0; i < e.waves.length; i++) { var wv = e.waves[i]; if (wv.t < 0 || wv.t > 450) continue; c.globalAlpha = 1 - wv.t / 450 * 0.6; c.beginPath(); c.arc(e.x, e.y, wv.r, 0, 6.283); c.stroke(); }
      c.restore();
    } else if (st === 'cwind' || st === 'charge') {   // carril de la embestida (64 px) + círculo de la onda de choque en el punto de parada
      var tele = e.cn ? M.chargeTele2 : M.chargeTele, fix = e.cn ? M.chargeFix2 : M.chargeFix, f = st === 'charge' ? 1 : e.t / tele;
      lane(c, e.x, e.y, e.ang, st === 'charge' ? e.clen - e.trav : e.clen, 64, f, st === 'charge' || e.t >= fix);
      c.save(); c.fillStyle = RED(0.08 + 0.14 * f); c.strokeStyle = 'rgba(255,90,90,0.8)'; c.lineWidth = 2; c.setLineDash([7, 6]); c.lineDashOffset = -G.time / 30;
      tdisc(c, e.tx, e.ty, M.ringR, c.fillStyle, c.strokeStyle, 2); c.restore();
    } else if (st === 'cring') {
      u = e.t / M.ringMs; c.save(); c.strokeStyle = 'rgba(255,70,50,0.9)'; c.lineWidth = 10; c.globalAlpha = 1 - u * 0.5;
      c.beginPath(); c.arc(e.x, e.y, 18 + (M.ringR - 18) * u, 0, 6.283); c.stroke(); c.restore();
    } else if (st === 'owind') {   // aviso de los escudos: fantasmas en sus posiciones iniciales y círculo peligroso
      u = e.t / M.orbTele; c.save(); c.setLineDash([6, 6]); c.lineDashOffset = -G.time / 40; c.strokeStyle = 'rgba(255,90,90,0.8)'; c.fillStyle = RED(0.06 + 0.12 * u); c.lineWidth = 2;
      tdisc(c, e.x, e.y, M.orbR + 16, c.fillStyle, c.strokeStyle, 2); c.restore();
      c.save(); c.globalAlpha = 0.35 + 0.4 * u; for (i = 0; i < e.orbN; i++) { var q = orbPos(e, i); shieldBit(c, q.x, q.y, q.a + Math.PI / 2, 0); } c.restore();
    } else if (st === 'orbit' || st === 'olaunch') {
      c.save(); c.setLineDash([6, 8]); c.lineDashOffset = -G.time / 50; c.strokeStyle = 'rgba(255,110,90,0.55)'; c.lineWidth = 1.5; c.beginPath(); c.arc(e.x, e.y, M.orbR, 0, 6.283); c.stroke(); c.restore();
      var lf = st === 'olaunch' ? e.t / M.orbLaunch : 0;
      for (i = 0; i < e.orbN; i++) {
        var o2 = orbPos(e, i);
        if (st === 'olaunch') lane(c, o2.x, o2.y, o2.a, 330, 26, lf, e.t >= 200);
        shieldBit(c, o2.x, o2.y, o2.a + (st === 'olaunch' ? 0 : Math.PI / 2), st === 'olaunch' ? 0.5 + 0.5 * Math.sin(e.t / 30) : 0);
      }
    }
    if (e.shieldDown && !e.shieldBroken) { c.save(); c.strokeStyle = 'rgba(255,230,120,0.9)'; c.lineWidth = 3; c.setLineDash([6, 4]); c.beginPath(); c.arc(e.x, e.y, e.r + 8, 0, 6.283); c.stroke(); c.restore(); }
    if (e.expT > 0) { c.save(); c.strokeStyle = 'rgba(255,226,122,' + (0.6 + 0.3 * Math.sin(G.time / 60)) + ')'; c.lineWidth = 3; c.beginPath(); c.arc(e.x, e.y, e.r + 12, 0, 6.283); c.stroke(); c.restore(); }
    if (e.enraged) { c.save(); c.globalAlpha = 0.18 + 0.1 * Math.sin(G.time / 90); c.fillStyle = '#ff3010'; c.beginPath(); c.arc(e.x, e.y, e.r + 6, 0, 6.283); c.fill(); c.restore(); }
  }
  function drawHive(c, e, p) {
    var M = MH, i, u, st = e.st;
    if (st === 'spit' && e.land) {
      u = e.t / 500; c.save();
      for (i = 0; i < e.land.length; i++) disc(c, e.land[i].x, e.land[i].y, 18, RED(0.12 + 0.25 * u), 'rgba(255,90,90,0.85)', 2);
      c.restore();
    } else if (st === 'swell') {
      u = e.t / 800; c.save(); c.strokeStyle = 'rgba(255,183,58,' + (0.5 + 0.4 * Math.sin(e.t / 40)) + ')'; c.lineWidth = 3;
      c.beginPath(); c.arc(e.x, e.y, 20 + 50 * u, 0, 6.283); c.stroke(); c.restore();
    } else if (st === 'rwind' && e.rain) {   // lluvia de larvas: círculos rojos que se cierran
      u = e.t / M.rainTele; c.save();
      for (i = 0; i < e.rain.length; i++) {
        var r = e.rain[i]; tdisc(c, r.x, r.y, M.rainR, RED(0.12 + 0.3 * u), 'rgba(255,120,100,1)', 2.5);
        c.strokeStyle = 'rgba(255,200,120,0.8)'; c.lineWidth = 2; c.beginPath(); c.arc(r.x, r.y, M.rainR * (1 - u * 0.85), 0, 6.283); c.stroke();
      }
      c.restore();
    } else if (st === 'burst') {   // estallido: círculo rojo de 150 px que se llena
      u = e.t / M.burstTele; c.save(); c.setLineDash([8, 6]); c.lineDashOffset = -G.time / 30;
      tdisc(c, e.x, e.y, M.burstR, RED(0.07 + 0.2 * u), 'rgba(255,120,100,1)', 2.5); c.setLineDash([]);
      c.strokeStyle = 'rgba(255,200,120,0.85)'; c.lineWidth = 3; c.beginPath(); c.arc(e.x, e.y, M.burstR * u, 0, 6.283); c.stroke(); c.restore();
    }
    if (e.expT > 0) { c.save(); c.strokeStyle = 'rgba(255,226,122,' + (0.6 + 0.3 * Math.sin(G.time / 60)) + ')'; c.lineWidth = 3; c.beginPath(); c.arc(e.x, e.y, e.r + 12, 0, 6.283); c.stroke(); c.restore(); }
    if (e.enraged) { c.save(); c.globalAlpha = 0.15 + 0.1 * Math.sin(G.time / 90); c.fillStyle = '#ff7a10'; c.beginPath(); c.arc(e.x, e.y, e.r + 6, 0, 6.283); c.fill(); c.restore(); }
  }

  // Telegrafías propias de las familias P1 (rojo = daño directo; contorno oscuro para leerse con 100 enemigos y sobre los círculos del ritual)
  function thinLine(c, x, y, ang, len, col, w, dash) {
    c.save(); c.translate(x, y); c.rotate(ang);
    c.strokeStyle = 'rgba(8,4,14,0.65)'; c.lineWidth = w + 3; c.beginPath(); c.moveTo(0, 0); c.lineTo(len, 0); c.stroke();
    c.strokeStyle = col; c.lineWidth = w; if (dash) c.setLineDash(dash); c.beginPath(); c.moveTo(0, 0); c.lineTo(len, 0); c.stroke(); c.restore();
  }
  function bubbles(c, x, y, t, u) {   // fx_ambush_bubbles (48x48 final; frames 0-2 suben, 3 = estallido) sobre el aviso de emboscada / brote
    if (!G.hasSpr('fx_ambush_bubbles')) return;
    var sp = Assets.sprite('fx_ambush_bubbles', u > 0.9 ? 3 : Math.floor(t / 125) % 3); c.drawImage(sp, Math.round(x - sp.width / 2), Math.round(y - sp.height * 0.75));
  }
  function drawFamTele(c, e, p) {
    var u, ty = e.type, st = e.st, hw = e.r + p.r;
    if (ty === 'archer' && st === 'aim') {   // línea fina de la flecha (parpadeo amarillo en el cuerpo)
      u = e.t / B.tele.archer.ms; thinLine(c, e.x, e.y, e.ang, 260, 'rgba(255,226,122,' + (0.35 + 0.5 * u) + ')', 1.5, e.t >= 250 ? null : [5, 5]);
    } else if (ty === 'dog' && (st === 'bark' || st === 'dash')) {
      u = st === 'bark' ? e.t / B.tele.dog.ms : 1;
      var ln = st === 'bark' ? dogPath(e, G.dist(e.x, e.y, p.x, p.y)) : e.dashMs * DG.dashSpd / 1000;
      if (st === 'bark') {   // anillo rojo r 28 + carril (fijo los últimos 150 ms) con línea fina hasta el punto de arreo
        c.save(); c.translate(e.x, e.y); c.rotate(e.ang); c.fillStyle = RED(0.05 + 0.13 * u); c.fillRect(0, -hw, ln, hw * 2); c.restore();
        thinLine(c, e.x, e.y, e.ang, ln, 'rgba(255,90,90,' + (0.5 + 0.45 * u) + ')', 1.5, e.t >= B.tele.dog.ms - 150 ? null : [6, 4]);
        tdisc(c, e.x, e.y, DG.ring + 3 * Math.sin(e.t / 40), RED(0.1 + 0.25 * u), 'rgba(255,100,90,0.95)', 2);
      }
    } else if (ty === 'boar' && e.fe.roll) {
      if (st === 'wind') {   // carril rojo del primer tramo (honesto: ancho = radios de contacto)
        u = e.t / B.tele.roll.ms; lane(c, e.x, e.y, e.ang, SK.len + e.r, hw * 2, u, e.t >= B.tele.roll.ms - 200);
      } else if (st === 'bounce') {   // flecha roja del segundo tramo
        u = e.t / B.tele.bounce.ms; lane(c, e.x, e.y, e.ang, SK.len2 + e.r, hw * 2, u, e.t >= 150);
        c.save(); c.translate(e.x + Math.cos(e.ang) * (SK.len2 * 0.5 + e.r), e.y + Math.sin(e.ang) * (SK.len2 * 0.5 + e.r)); c.rotate(e.ang);
        c.fillStyle = 'rgba(255,60,50,0.9)'; c.strokeStyle = 'rgba(8,4,14,0.8)'; c.lineWidth = 2;
        c.beginPath(); c.moveTo(22, 0); c.lineTo(2, -13); c.lineTo(2, 13); c.closePath(); c.fill(); c.stroke(); c.restore();
      } else if (st === 'roll' || st === 'roll2') {
        lane(c, e.x, e.y, e.ang, Math.max(0, e.len - e.trav) + e.r, hw * 2, 1, true);
      }
    } else if (ty === 'leech' && st === 'amb') {   // anillo rojo r 30 + línea fina hacia el jugador (rumbo fijo los últimos 200 ms) con el carril del lance
      u = e.t / B.tele.leech.ms; var ll = G.clamp(G.dist(e.x, e.y, p.x, p.y) + 20, LE.lungeMin, LE.lungeMax);
      c.save(); c.translate(e.x, e.y); c.rotate(e.ang); c.fillStyle = RED(0.05 + 0.12 * u); c.fillRect(0, -hw, ll, hw * 2); c.restore();
      thinLine(c, e.x, e.y, e.ang, ll, 'rgba(255,90,90,' + (0.5 + 0.45 * u) + ')', 1.5, e.t >= B.tele.leech.ms - 200 ? null : [6, 4]);
      tdisc(c, e.x, e.y, LE.ring, RED(0.1 + 0.25 * u), 'rgba(255,100,90,0.95)', 2);
      bubbles(c, e.x, e.y, e.t, u);
    } else if (ty === 'boar' && e.fe.hop && (st === 'crouch' || st === 'air')) {   // círculo rojo r 24 en el punto de aterrizaje (fijo desde que se agacha)
      u = st === 'crouch' ? e.t / B.tele.frog.ms : 1;
      tdisc(c, e.lx, e.ly, FR.r, RED(0.1 + 0.3 * u), 'rgba(255,100,90,0.95)', 2);
      c.save(); c.strokeStyle = 'rgba(255,210,150,0.85)'; c.lineWidth = 2; c.beginPath(); c.arc(e.lx, e.ly, FR.r * (1 - 0.8 * u), 0, 6.283); c.stroke(); c.restore();
    } else if (ty === 'headlet' && (st === 'emerge' || st === 'regrow')) {   // brota: anillo rojo r 32 que se cierra
      u = e.t / (st === 'emerge' ? B.tele.emerge.ms : HL.regrowTele);
      tdisc(c, e.x, e.y, HL.ring, RED(0.08 + 0.26 * u), 'rgba(255,100,90,0.95)', 2);
      c.save(); c.strokeStyle = 'rgba(255,210,150,0.85)'; c.lineWidth = 2; c.beginPath(); c.arc(e.x, e.y, HL.ring * (1 - 0.8 * u), 0, 6.283); c.stroke(); c.restore();
      bubbles(c, e.x, e.y, e.t, u);
    } else if (ty === 'headlet' && st === 'wind') {   // mordisco: anillo rojo r 70
      u = e.t / B.tele.headlet.ms;
      tdisc(c, e.x, e.y, HL.bite, RED(0.06 + 0.2 * u), 'rgba(255,100,90,0.95)', 2.5);
      c.save(); c.strokeStyle = 'rgba(255,210,150,0.8)'; c.lineWidth = 2; c.beginPath(); c.arc(e.x, e.y, HL.bite * u, 0, 6.283); c.stroke(); c.restore();
    } else if (ty === 'scorcher' && e.fe.eel && (st === 'wind' || st === 'zap')) {   // carril rojo 18 x 300 (fijo los últimos 300 ms); el rayo es instantáneo (150 ms)
      if (st === 'wind') lane(c, e.x, e.y, e.ang, EL.len, EL.w, e.t / B.tele.eel.ms, e.t >= B.tele.eel.ms - 300);
      else {
        u = 1 - e.t / EL.zap; c.save(); c.translate(e.x, e.y); c.rotate(e.ang);
        c.fillStyle = 'rgba(255,232,90,' + (0.35 + 0.5 * u) + ')'; c.fillRect(0, -EL.w / 2 - 2, EL.len, EL.w + 4);
        c.fillStyle = 'rgba(255,255,235,' + (0.5 + 0.5 * u) + ')'; c.fillRect(0, -3, EL.len, 6);
        if (G.hasSpr('fx_lightning_lane')) { var tl = Assets.sprite('fx_lightning_lane', Math.floor(e.t / 55) % 3); c.globalAlpha = 0.6 + 0.4 * u; for (var tx = 0; tx < EL.len; tx += tl.width) c.drawImage(tl, tx, -tl.height / 2, Math.min(tl.width, EL.len - tx + 2), tl.height); }   // tile de rayo repetido a lo largo del carril
        c.restore();
      }
    } else if (ty === 'chainer' && st === 'wind') {   // línea fina naranja hasta el jugador; fija los últimos 300 ms
      u = e.t / B.tele.chainer.ms; var fx2 = e.t >= B.tele.chainer.ms - CH.fix;
      thinLine(c, e.x, e.y - 4, e.ang, CH.range, 'rgba(255,150,50,' + (0.45 + 0.5 * u) + ')', fx2 ? 2.5 : 1.5, fx2 ? null : [6, 5]);
      if (fx2) { c.save(); c.translate(e.x, e.y - 4); c.rotate(e.ang); c.fillStyle = 'rgba(255,140,40,0.1)'; c.fillRect(0, -9, CH.range, 18); c.restore(); }
    }
  }

  // Charcos fijos (M5): suelo oscuro verdeazulado con ondas que se expanden; el sprite fx_pond (arte P2) lo sustituye si existe
  function ripple(c, x, y, rx, ry, t, ph, a) {
    for (var k = 0; k < 2; k++) {
      var u = ((t * 0.7 + ph + k * 0.5) % 1);
      c.globalAlpha = a * (1 - u); c.beginPath(); c.ellipse(x, y, rx * (0.3 + 0.7 * u), ry * (0.3 + 0.7 * u), 0, 0, 6.283); c.stroke();
    }
    c.globalAlpha = 1;
  }
  E.drawPonds = function (c) {
    var ps = G.ponds, t = G.time / 1000, i, pd;
    for (i = 0; i < ps.length; i++) {
      pd = ps[i]; c.save();
      if (G.hasSpr('fx_pond')) { var sp = Assets.sprite('fx_pond', Math.floor(t * 3 + i) % 3); c.drawImage(sp, Math.round(pd.x - sp.width / 2), Math.round(pd.y - sp.height * 52 / 96)); }   // fx_pond 160x96: el agua (r ~38) va centrada en (80, 52)
      else {
        var g = c.createRadialGradient(pd.x, pd.y, pd.r * 0.2, pd.x, pd.y, pd.r + 6);
        g.addColorStop(0, 'rgba(14,52,58,0.95)'); g.addColorStop(0.75, 'rgba(26,86,90,0.9)'); g.addColorStop(1, 'rgba(60,130,120,0.55)');
        c.fillStyle = G.fg(g, 'rgba(22,76,80,0.9)'); c.strokeStyle = 'rgba(8,24,30,0.8)'; c.lineWidth = 3;
        c.beginPath(); c.ellipse(pd.x, pd.y, pd.r + 5, (pd.r + 5) * 0.8, 0, 0, 6.283); c.fill(); c.stroke();
        c.strokeStyle = 'rgba(190,240,230,0.7)'; c.lineWidth = 1.5; ripple(c, pd.x, pd.y, pd.r, pd.r * 0.8, t, i * 0.37, 0.8);
        c.fillStyle = 'rgba(210,250,240,0.5)'; c.fillRect(Math.round(pd.x - 9 + 6 * Math.sin(t * 1.3 + i)), Math.round(pd.y - 5 + 3 * Math.cos(t + i)), 4, 2);
      }
      c.restore();
    }
  };
  function drawHiddenRipple(c, e) {   // enemigo oculto: solo se ven las ondas (fx_pond_ripple o anillos)
    var t = G.time / 1000;
    if (G.hasSpr('fx_pond_ripple')) { var sp = Assets.sprite('fx_pond_ripple', Math.floor(t * 4 + e.anim) % 3); c.drawImage(sp, Math.round(e.x - sp.width / 2), Math.round(e.y - sp.height / 2)); return; }
    c.save(); c.strokeStyle = 'rgba(205,245,236,0.85)'; c.lineWidth = 1.5; ripple(c, e.x, e.y, 20, 10, t, (e.anim % 1000) / 1000, 0.9); c.restore();
  }

  E.drawGround = function (c) {
    var i, e, p = PL(), u;
    if (G.ponds.length) E.drawPonds(c);
    for (i = 0; i < G.zones.length; i++) if (G.zones[i].team === 'e') drawZone(c, G.zones[i], i);
    for (i = 0; i < G.enemies.length; i++) {
      e = G.enemies[i];
      if (e.dead || e.partOf) continue;
      if (e.hidden && e.spawnT <= 0) { drawHiddenRipple(c, e); if (e.fe) drawFamTele(c, e, p); continue; }
      if (e.spawnT > 0) { // telegrafía de aparición (morado si es una invocación)
        if (e.type === 'boss') continue;   // Letea hundida usa spawnT para no ser objetivo: sin marca de aparición
        u = 1 - e.spawnT / (e.spawnMax || B.spawnTelegraph);
        var big = e.type === 'boss' || e.big, sm = e.summoned, ca = sm ? '176,96,255' : '255,60,60';
        c.save(); c.strokeStyle = sm ? '#b060ff' : '#ff4040'; c.fillStyle = 'rgba(' + ca + ',' + (0.15 + 0.2 * u) + ')'; c.lineWidth = 2;
        c.beginPath(); c.arc(e.x, e.y, (big ? 40 : 18) * (0.5 + 0.5 * u), 0, 6.283); c.fill(); c.stroke(); c.restore();
        continue;
      }
      if (e.fe) drawFamTele(c, e, p);   // telegrafías de las familias (Zarzal / Arquero, Perro, Calavera rodante, Guardián de cadenas)
      if (e.type === 'boar' && e.st === 'wind' && !(e.fe && e.fe.roll)) {
        var len = 171 + e.r, w = e.r * 2, f = e.t / 600;
        c.save(); c.translate(e.x, e.y); c.rotate(e.ang);
        c.fillStyle = 'rgba(255,40,40,' + (0.12 + 0.25 * f) + ')'; c.fillRect(0, -w / 2, len, w);
        c.strokeStyle = 'rgba(255,80,80,0.7)'; c.lineWidth = 1; c.strokeRect(0, -w / 2, len, w); c.restore();
      }
      if (e.type === 'scorcher' && e.st === 'wind') {   // línea de carga: la longitud real es 150 px de dash + cuerpos
        var sl = 150 + e.r + p.r, sw = e.r * 2, sf = e.t / 600;
        c.save(); c.translate(e.x, e.y); c.rotate(e.ang);
        c.fillStyle = RED(0.12 + 0.28 * sf); c.fillRect(0, -sw / 2, sl, sw);
        c.strokeStyle = 'rgba(255,120,60,0.9)'; c.lineWidth = 1.5; c.strokeRect(0, -sw / 2, sl, sw); c.restore();
      }
      if (e.type === 'bomb' && e.st === 'lit') {
        c.save(); c.fillStyle = 'rgba(255,90,40,' + (0.12 + 0.18 * (e.t / 700)) + ')'; c.strokeStyle = 'rgba(255,120,60,0.7)';
        c.beginPath(); c.arc(e.x, e.y, 60, 0, 6.283); c.fill(); c.stroke(); c.restore();
      }
      if (e.type === 'fanner' && e.st === 'aim') {
        fan(c, e.x, e.y, 260, e.ang, 20 * DEG, e.t / 500);
        if (e.t >= 350) {   // carriles definitivos de las 3 espinas
          c.save(); c.strokeStyle = 'rgba(255,120,100,0.85)'; c.lineWidth = 1;
          for (var k = -1; k <= 1; k++) { c.beginPath(); c.moveTo(e.x, e.y); c.lineTo(e.x + Math.cos(e.ang + k * 14 * DEG) * 260, e.y + Math.sin(e.ang + k * 14 * DEG) * 260); c.stroke(); }
          c.restore();
        }
      }
      if (e.type === 'shield') {
        if (e.st === 'wind') fan(c, e.x, e.y, e.r + p.r + SH_REACH, e.fa, 45 * DEG, e.t / 500);
        if (e.shieldDown) { c.save(); c.strokeStyle = 'rgba(255,230,120,0.9)'; c.lineWidth = 2; c.beginPath(); c.arc(e.x, e.y, e.r + 6, 0, 6.283); c.stroke(); c.restore(); }
      }
      if (e.type === 'moth' && e.st === 'charge') {
        u = e.t / 450;
        c.save(); c.strokeStyle = 'rgba(127,212,255,' + (0.3 + 0.4 * u) + ')'; c.lineWidth = 1.5; c.setLineDash([5, 5]);
        c.beginPath(); c.moveTo(e.x, e.y); c.lineTo(e.x + Math.cos(e.ang) * 320, e.y + Math.sin(e.ang) * 320); c.stroke(); c.setLineDash([]);
        c.globalCompositeOperation = 'lighter'; disc(c, e.x, e.y - 6, 3 + 8 * u, 'rgba(127,212,255,0.6)', '#e8f8ff', 1.5); c.restore();
      }
      if (e.type === 'sower' && e.st === 'sow') {
        c.save(); c.strokeStyle = 'rgba(155,255,74,0.8)'; c.lineWidth = 2; c.setLineDash([4, 4]); c.beginPath(); c.arc(e.x, e.y, e.r + 6 + 4 * Math.sin(e.t / 50), 0, 6.283); c.stroke(); c.restore();
      }
      if (e.type === 'blinker') {
        if (e.st === 'fade') {   // anillo morado donde va a reaparecer
          u = e.t / 500; c.save();
          if (G.hasSpr('fx_blink_ring')) { var br = Assets.sprite('fx_blink_ring', Math.floor(e.t / 120) % 2); c.globalAlpha = 0.6 + 0.4 * u; c.drawImage(br, e.tx - br.width / 2, e.ty - br.height / 2); }
          c.strokeStyle = 'rgba(169,138,255,0.95)'; c.fillStyle = 'rgba(138,106,224,' + (0.1 + 0.2 * u) + ')'; c.lineWidth = 2;
          c.beginPath(); c.arc(e.tx, e.ty, 20 - 6 * u, 0, 6.283); c.fill(); c.stroke();
          c.setLineDash([3, 5]); c.beginPath(); c.arc(e.tx, e.ty, 26, 0, 6.283); c.stroke(); c.restore();
        } else if (e.st === 'slash') fan(c, e.x, e.y, BL_REACH + p.r, e.ang, 50 * DEG, e.t / 350);
      }
      if (e.type === 'warlock') {   // halo morado permanente + anillo de invocación
        c.save(); c.strokeStyle = 'rgba(176,96,255,' + (0.3 + 0.15 * Math.sin(e.anim / 200)) + ')'; c.fillStyle = 'rgba(176,96,255,0.07)'; c.lineWidth = 2;
        c.beginPath(); c.ellipse(e.x, e.y + 8, 24, 10, 0, 0, 6.283); c.fill(); c.stroke();
        if (e.st === 'cast') { u = e.t / 500; c.strokeStyle = 'rgba(200,140,255,0.9)'; c.lineWidth = 3; c.beginPath(); c.arc(e.x, e.y, 12 + 38 * u, 0, 6.283); c.stroke(); }
        c.restore();
      }
      if (e.type === 'mini_bulwark') drawBulwark(c, e, p);
      if (e.type === 'mini_hive') drawHive(c, e, p);
    }
  };

  // ---- Sprites. Los sprites de los enemigos nuevos viven en assets_enemies2.js; si aún no existen se usa un sprite viejo teñido.
  var FB = {
    enemy_fanner:       { spr: 'archer',  tint: '#2f8f5a' },
    enemy_shield:       { spr: 'boar',    tint: '#8fa0b8' },
    enemy_moth:         { spr: 'worm',    tint: '#4aa8ff' },
    enemy_sower:        { spr: 'warlock', tint: '#9a2a78' },
    enemy_blinker:      { spr: 'warlock', tint: '#8a6ae0', alpha: 0.85 },
    enemy_scorcher:     { spr: 'boar',    tint: '#ff7a1a' },
    enemy_mini_bulwark: { spr: 'boss',    tint: '#5a6478', sc: 0.67 },
    enemy_mini_hive:    { spr: 'boss',    tint: '#7a3aa8', sc: 0.67 }
  };

  // animación de los sprites originales (worm, archer, boar, bomb, warlock, boss)
  function oldAnim(base, e) {
    var w = Math.floor(e.anim / 110), st = e.st;
    switch (base) {
      case 'worm': return 'walk:' + w;
      case 'archer': return st === 'aim' ? 2 : 'walk:' + w;
      case 'boar': return (st === 'wind' || st === 'dash') ? 'attack:' + Math.min(1, Math.floor(e.t / 250)) : st === 'charge' ? 2 : 'walk:' + w;
      case 'bomb': return st === 'lit' ? 2 + Math.floor(e.t / 90) % 2 : 'walk:' + w;
      case 'warlock': return (st === 'cast' || st === 'sow') ? 2 : 'idle:' + Math.floor(e.anim / 250);
      case 'boss':
        if (e.type === 'boss') {
          if (e.st === 'tele' && e.kind === 'slam') return (e.t > e.dur - 300) ? 3 : 0;
          if (e.st === 'tele' && e.kind !== 'slam') return e.t > e.dur * 0.55 ? 2 : 0;
          if (e.st === 'rec') return e.kind === 'slam' ? 3 : 2;
        } else {
          if (e.st === 'strike' || e.st === 'swave' || e.st === 'spit' || e.st === 'charge' || e.st === 'cring' || e.st === 'twind') return 3;
          if (e.st === 'wind' || e.st === 'swind' || e.st === 'swell' || e.st === 'cwind' || e.st === 'owind' || e.st === 'olaunch' || e.st === 'rwind' || e.st === 'burst' || e.st === 'enrage') return 2;
        }
        return 'idle:' + Math.floor(e.anim / 330);
    }
    return 0;
  }

  // animación de los sprites nuevos (nombres de anim en ASSETS_API.md / assets_enemies2.js)
  function newAnim(e) {
    var w = Math.floor(e.anim / 110), st = e.st;
    switch (e.type) {
      case 'fanner': return st === 'aim' ? 'aim' : st === 'rec' ? 'shoot:0' : 'walk:' + w;
      case 'shield': return st === 'wind' ? 'bash:0' : st === 'bash' ? 'bash:1' : st === 'rec' ? 'bash:2' : 'walk:' + w;
      case 'moth': return st === 'charge' ? 'charge' : st === 'throw' ? 'throw:0' : 'fly:' + Math.floor(e.anim / 70);
      case 'sower': return st === 'sow' ? 'sow:' + (e.t < 250 ? 0 : 1) : 'walk:' + w;
      case 'blinker': return st === 'fade' ? 'fade:' + Math.floor(e.t / 100) : st === 'slash' ? 'slash:' + (e.t < 200 ? 0 : 1) : 'idle:' + Math.floor(e.anim / 200);
      case 'scorcher': return st === 'wind' ? 'charge:0' : st === 'dash' ? 'charge:1' : st === 'rec' ? 'rec:0' : 'walk:' + w;
      case 'mini_bulwark': return (st === 'wind' || st === 'cwind' || st === 'olaunch') ? 'bash:0' : (st === 'strike' || st === 'charge') ? 'bash:1' : (st === 'swind' || st === 'owind' || st === 'enrage') ? 'stomp:0' : (st === 'swave' || st === 'cring') ? 'stomp:1' : st === 'rec' ? 'rec:0' : 'walk:' + Math.floor(e.anim / 160);
      case 'mini_hive': return (st === 'spit' || st === 'rwind') ? 'spit:0' : (st === 'acid' || st === 'twind' || st === 'stag') ? 'acid:0' : (st === 'swell' || st === 'burst') ? 'swell:' + Math.floor(e.t / 100) % 2 : 'float:' + Math.floor(e.anim / 140);
    }
    return 0;
  }

  // animación de los sprites de las familias P1 (assets_fam1.js: nombres de anim en ASSETS_API.md); los roles que comparten nombres de anim con el sprite legado reutilizan newAnim
  function famAnim(e) {
    var w = Math.floor(e.anim / 110), st = e.st;
    switch (e.type) {
      case 'worm': return 'walk:' + w;
      case 'archer': return st === 'aim' ? 'aim' : e.flT > 0 ? 'fire' : 'walk:' + w;
      case 'fanner': case 'shield': case 'moth': case 'blinker': return newAnim(e);
      case 'bomb': return st === 'lit' ? (e.t > 550 ? 'prime' : 'lit:' + Math.floor(e.t / 100)) : 'walk:' + w;
      case 'boar': return st === 'wind' ? 'wind' : (st === 'roll' || st === 'roll2') ? 'roll:' + Math.floor(e.t / 60) : (st === 'stun' || st === 'bounce') ? 'stun' : 'walk:' + Math.floor(e.anim / 200);
      case 'warlock': return st === 'cast' ? 'cast:' + Math.floor(e.t / 150) : 'idle:' + Math.floor(e.anim / 250);
      case 'dog': return st === 'bark' ? 'bark' : st === 'dash' ? 'dash:' + Math.floor(e.t / 70) : st === 'rec' ? 'idle:' + Math.floor(e.anim / 250) : 'walk:' + Math.floor(e.anim / 90);
      case 'salamander': return 'slither:' + Math.floor(e.anim / 125);
      case 'chainer': return st === 'wind' ? 'wind' : st === 'throw' ? 'throw:' + (e.t < 150 ? 0 : 1) : 'walk:' + Math.floor(e.anim / 160);
    }
    return 0;
  }
  var FAMSPR = /^enemy_(bos|cri)_/, ASFSPR = /^enemy_asf_/;
  // animación de los sprites del Asfódelo (assets_fam2.js; nombres de anim en ASSETS_API.md 'Familias P2'). Si el sprite no tuviera esa anim se usa un frame suelto.
  function asfAnim(e) {
    var w = Math.floor(e.anim / 110), st = e.st;
    switch (e.type) {
      case 'worm': return 'walk:' + w;
      case 'leech': return st === 'lunge' ? 'lunge:' + Math.floor(e.t / 110) : (st === 'exposed' || st === 'flee') ? 'exposed' : 'swim:' + Math.floor(e.anim / 160);
      case 'boar': return st === 'crouch' ? 'crouch' : st === 'air' ? 'air' : st === 'rest' ? (e.t < 160 ? 'land' : 'rest') : 'idle:' + Math.floor(e.anim / 330);
      case 'headlet': return st === 'emerge' ? 'emerge:' + Math.min(3, Math.floor(e.t / 175)) : st === 'bite' ? 'bite:1' : st === 'wind' ? 'bite:0' : st === 'stump' ? 'stump' : st === 'regrow' ? 'regrow:' + Math.min(2, Math.floor(e.t / 200)) : 'idle:' + Math.floor(e.anim / 280);
      case 'moth': return st === 'charge' ? 'charge' : st === 'throw' ? 'throw:' + (e.t < 125 ? 0 : 1) : 'float:' + Math.floor(e.anim / 170);
      case 'sower': return st === 'sow' ? 'sow:' + (e.t < 250 ? 0 : 1) : 'walk:' + w;
      case 'scorcher': return st === 'wind' || st === 'zap' ? 'wind' : st === 'dash' ? 'dash' : st === 'rec' ? 'rec' : 'slither:' + w;
      case 'warlock': return st === 'cast' ? 'cast:' + Math.floor(e.t / 160) : 'float:' + Math.floor(e.anim / 200);
    }
    return 0;
  }
  function safeSpr(name, an) { try { return Assets.sprite(name, an); } catch (x) { try { return Assets.sprite(name, String(an).split(':')[0] === 'walk' ? 'idle:0' : 0); } catch (y) { return Assets.sprite(name, 0); } } }

  // Devuelve { cv, sc, fb } con el canvas actual del enemigo
  function visual(e) {
    var name = e.spr || B.enemy[e.type].spr, fb = FB[name];
    if (!fb && FAMSPR.test(name)) return { cv: Assets.sprite(name, famAnim(e)), sc: 1, fb: null };
    if (!fb && ASFSPR.test(name)) return { cv: safeSpr(name, asfAnim(e)), sc: 1, fb: null };
    if (!fb) return { cv: Assets.sprite(name, oldAnim(name, e)), sc: 1, fb: null };
    if (G.hasSpr(name)) { try { return { cv: Assets.sprite(name, newAnim(e)), sc: 1, fb: null }; } catch (x) { /* anim desconocida: usa el reemplazo */ } }
    return { cv: Assets.sprite(fb.spr, oldAnim(fb.spr, e)), sc: fb.sc || 1, fb: fb };
  }

  // Tinte por estado: si hay varios se alternan para que los combos se lean
  function statusTint(e) {
    var l = [];
    if (e.slowT > 0) l.push('#4aa8ff');
    if (e.poisonT > 0) l.push('#5be03a');
    if (e.burnT > 0) l.push('#ff7a1a');
    if (e.bleedT > 0) l.push('#e01030');
    if (!l.length) return null;
    return l[Math.floor(e.anim / 260) % l.length];
  }

  var SHADOW = { boss: 2.5, boar: 1.4, shield: 1.2, scorcher: 1.5, mini_bulwark: 1.9, mini_hive: 2, dog: 1.3, salamander: 1.5, chainer: 1.3 };

  E.draw = function (c, e) {
    if (e.type === 'boss') { G.Boss.draw(c, e); return; }
    if (e.partOf) return;
    if (e.hidden) return;   // Sanguijuela oculta en su charco: solo se ven las ondas (drawGround)
    var v = visual(e), cv = v.cv, sc = v.sc * (e.sc || 1);
    var jump = e.jump || 0, hh = cv.height * sc;
    G.fx.spr(c, Assets.sprite('shadow', 0), e.x, e.y + hh / 2 - 6, { alpha: 0.6, sx: SHADOW[e.type] || (e.sc || 1) });
    var o = { flip: e.face < 0, sx: sc, sy: sc };
    if (e.spawnT > 0) { o.alpha = 0.25 + 0.4 * (1 - e.spawnT / (e.spawnMax || B.spawnTelegraph)); }
    else if (e.flash > 0) { o.tint = '#ffffff'; o.tintA = 1; }
    else if (e.stunT > 0) { o.tint = '#ffffaa'; o.tintA = 0.5; }
    else if (statusTint(e)) { var stt = statusTint(e); o.tint = stt; o.tintA = 0.38; }
    else if (e.type === 'archer' && e.st === 'aim') { o.tint = '#ffe27a'; o.tintA = 0.35 + 0.3 * Math.sin(e.t / 25); }
    else if (e.type === 'fanner' && e.st === 'aim') { o.tint = '#ff9a2a'; o.tintA = 0.2 + 0.3 * (e.t / 500); o.sx = sc * (1 + 0.1 * e.t / 500); }
    else if (e.type === 'shield' && e.st === 'wind') { o.tint = '#ffffff'; o.tintA = 0.25 + 0.35 * Math.sin(e.t / 40); }
    else if (e.type === 'moth' && e.st === 'charge') { o.tint = '#bfeaff'; o.tintA = 0.3 + 0.3 * Math.sin(e.t / 40); }
    else if (e.type === 'sower' && e.st === 'sow') { o.tint = '#9bff4a'; o.tintA = 0.3; }
    else if (e.type === 'scorcher' && (e.st === 'wind' || e.st === 'dash')) { o.tint = '#ffd23a'; o.tintA = 0.25 + 0.25 * Math.sin(e.t / 50); }
    else if (e.type === 'bomb' && e.st === 'lit' && Math.floor(e.t / 80) % 2) { o.tint = '#ff3030'; o.tintA = 0.6; }
    else if (e.type === 'boar' && (e.st === 'stun' || e.st === 'bounce')) { o.tint = '#ffff80'; o.tintA = 0.25 + 0.15 * Math.sin(e.t / 60); }
    else if (e.type === 'boar' && e.st === 'wind' && e.fe) { o.tint = '#ff6a5a'; o.tintA = 0.2 + 0.3 * (e.t / 600); }
    else if (e.type === 'dog' && e.st === 'bark') { o.tint = '#ff4040'; o.tintA = 0.2 + 0.3 * Math.abs(Math.sin(e.t / 45)); }
    else if (e.type === 'chainer' && e.st === 'wind') { o.tint = '#ff9a2a'; o.tintA = 0.2 + 0.3 * (e.t / 700); }
    else if (e.type === 'warlock' && e.st === 'cast' && e.fe) { o.tint = '#b070ff'; o.tintA = 0.25; }
    else if (e.type === 'mini_hive' && (e.st === 'swell' || e.st === 'burst')) { o.tint = '#ffb73a'; o.tintA = 0.3 + 0.3 * Math.sin(e.t / 40); o.sx = sc * (1 + 0.15 * Math.min(1, e.t / (e.st === 'burst' ? 1150 : 800))); o.sy = o.sx; }
    else if (e.type === 'boss' && e.rage) { o.tint = e.fury ? '#ff0000' : '#ff2020'; o.tintA = 0.25 + 0.1 * Math.sin(e.anim / 100); }
    else if (v.fb) { o.tint = (e.variant && E.VARIANTS[e.variant].tint) || v.fb.tint; o.tintA = e.variant ? 0.62 : 0.5; }
    if (e.skin && o.tint == null) { o.tint = e.skin.tint; o.tintA = e.skin.a != null ? e.skin.a : 0.35; }   // tinte de la piel de familia (si no hay ya un tinte de estado)
    if (v.fb && v.fb.alpha && o.alpha == null) o.alpha = v.fb.alpha;
    if (e.fe && e.fe.alpha && e.spr === e.fe.fbSpr && o.alpha == null) o.alpha = e.fe.alpha;   // Alma errante: semitransparente (el sprite propio ya trae el alpha 0,8 horneado: solo se aplica al sprite de reemplazo)
    if (e.immune && e.type !== 'headlet') { o.alpha = 0.25 + 0.1 * Math.sin(e.t / 40); }
    else if (e.type === 'headlet' && e.st === 'stump') o.alpha = 0.6;
    else if (e.type === 'headlet' && (e.st === 'emerge' || e.st === 'regrow')) { o.alpha = 0.45 + 0.4 * Math.min(1, e.t / 500); }
    if (e.type === 'boss' && e.st === 'tele' && e.kind !== 'slam') { o.sx = 1 + 0.05 * Math.sin(e.t / 40); }
    G.fx.spr(c, cv, e.x, e.y - jump, o);
    if (e.spawnT <= 0 && e.type !== 'boss') {
      var elite = B.enemy[e.type].elite;
      if (elite) {
        var bw = 64, bx2 = Math.round(e.x - bw / 2), by2 = Math.round(e.y - hh / 2 - 16);
        var blink = (e.st === 'swell' || e.st === 'burst' || e.st === 'enrage') && Math.floor(e.t / 80) % 2;
        c.fillStyle = '#1a0a12'; c.fillRect(bx2 - 1, by2 - 1, bw + 2, 7);
        c.fillStyle = blink ? '#ffffff' : (e.enraged ? '#ff5a30' : '#ffb347'); c.fillRect(bx2, by2, Math.max(0, bw * e.hp / e.maxHp), 5);
        c.fillStyle = 'rgba(255,255,255,0.8)'; c.fillRect(bx2 + bw / 2, by2 - 2, 1, 9);   // muesca del enrage (50 %)
        var pm = e.shieldMax ? (e.shieldBroken ? 0 : e.shieldHp / e.shieldMax) : e.sacMax ? (e.sacBroken ? 0 : e.sacHp / e.sacMax) : -1;
        if (pm >= 0) {   // medidor de la parte rompible (Escudo / Saco)
          var pw = e.partName ? 64 : 0, flash = (e.shieldFlash > 0 || e.sacFlash > 0);
          c.fillStyle = '#1a0a12'; c.fillRect(bx2 - 1, by2 + 7, pw + 2, 6);
          c.fillStyle = flash ? '#ffffff' : (e.shieldMax ? '#8fb4e8' : '#c8e85a'); c.fillRect(bx2, by2 + 8, Math.max(0, pw * pm), 4);
          G.txt(c, (pm > 0 ? e.partName : e.partName + ' ROTO'), e.x, by2 + 19, 9, pm > 0 ? '#d8cfe8' : '#ffd27a', 'center');
        }
        if (e.expT > 0) G.txt(c, 'x' + e.expMul + ' EXPUESTO', e.x, by2 - 9, 10, '#ffe27a', 'center');
      } else if (e.hp < e.maxHp && e.st !== 'stump') {
        var w = 22, bx = Math.round(e.x - w / 2), by = Math.round(e.y - hh / 2 - 6);
        c.fillStyle = '#1a0a12'; c.fillRect(bx - 1, by - 1, w + 2, 5);
        c.fillStyle = '#e04050'; c.fillRect(bx, by, Math.max(0, w * e.hp / e.maxHp), 3);
      }
    }
  };

  E.drawProjectiles = function (c) {
    for (var i = 0; i < G.projectiles.length; i++) {
      var q = G.projectiles[i];
      G.Proj.up(c, q.x, q.y);   // vista inclinada: proyectil de pie, con la dirección visual proyectada (Proj.ang)
      drawOneProj(c, q);
      G.Proj.down(c);
    }
  };
  function drawOneProj(c, q) {
    {
      if (q.team === 'p') { G.Weapons.drawProj(c, q); return; }
      if (q.orb) {   // orbe de hielo: halo procedural + sprite si existe
        c.save(); c.globalCompositeOperation = 'lighter'; c.fillStyle = 'rgba(127,212,255,' + (0.35 + 0.1 * Math.sin(q.t / 60)) + ')';
        c.beginPath(); c.arc(Math.round(q.x), Math.round(q.y), q.r + 5, 0, 6.283); c.fill(); c.restore();
        if (!q.spr) { c.save(); c.fillStyle = '#bfeaff'; c.strokeStyle = '#4aa8ff'; c.lineWidth = 2; c.beginPath(); c.arc(Math.round(q.x), Math.round(q.y), q.r - 1, 0, 6.283); c.fill(); c.stroke(); c.fillStyle = '#fff'; c.beginPath(); c.arc(q.x - 1, q.y - 1, 3, 0, 6.283); c.fill(); c.restore(); return; }
      }
      if (q.kind === 'shieldbit') { E.shieldBit(c, q.x, q.y, q.t / 60, 0.4); return; }
      if (q.kind === 'chain' && q.ox != null) {   // la cadena: eslabones desde el guardián hasta la cabeza (proj_chain)
        var cd = Math.hypot(q.x - q.ox, q.y - q.oy), cn = Math.max(1, Math.floor(cd / 14)), ci;
        c.save(); c.strokeStyle = 'rgba(8,4,14,0.8)'; c.lineWidth = 5; c.beginPath(); c.moveTo(q.ox, q.oy); c.lineTo(q.x, q.y); c.stroke();
        c.strokeStyle = '#8f98ab'; c.lineWidth = 2.5; c.setLineDash([5, 3]); c.beginPath(); c.moveTo(q.ox, q.oy); c.lineTo(q.x, q.y); c.stroke(); c.setLineDash([]);
        if (G.hasSpr('fx_chain_link')) { var lk = Assets.sprite('fx_chain_link', 0); for (ci = 1; ci < cn; ci += 2) c.drawImage(lk, Math.round(q.ox + (q.x - q.ox) * ci / cn - 8), Math.round(q.oy + (q.y - q.oy) * ci / cn - 8), 16, 16); }
        c.restore();
      }
      if (!q.spr) return;
      var cv = Assets.sprite(q.spr, Math.floor(q.t / 100) % 2);
      G.fx.spr(c, cv, q.x, q.y, { rot: q.orb ? 0 : G.Proj.ang(q.ang) });
    }
  }
})();
