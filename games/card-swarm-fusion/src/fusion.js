/* fusion.js - PROTOTIPO v0 "Fusión" (ver games/card-swarm-fusion-DESIGN.md). G.Fusion.
   - Ataque básico automático del jugador (10 de daño cada 650 ms al enemigo más cercano) + INFUSIONES: las cartas de ataque de la mano ya no disparan;
     cada una mejora el básico según su etiqueta (+20 / +35 / +50 % de daño por nivel de carta y un efecto: quema, ralentiza, encadena, veneno, robo de vida, atraviesa).
   - FUSIÓN: dos cartas de etiquetas distintas con receta = PODER ACTIVO (máx. 2). Se dispara a mano (botón táctil, Q / E) o en modo AUTO (F). Re-fusionar la misma receta = Nv2.
     La 1.ª fusión es ayudada: la carta inicial se conserva. Recetas v0: Vapor (fuego+hielo), Plasma (fuego+rayo), Gas inflamable (veneno+fuego), Sed de hierro (sangre+acero).
   - La interfaz de la oferta (modal "FUSIONAR YA / A LA MANO", botón FUSIONAR, chips de poderes) vive en cards.js y usa estas funciones.
   Parámetros URL de prueba: ?actives=vapor,plasma (poderes de inicio, Nv1; "vapor2" = Nv2)  ?fuseAsh=<n> (coste en Ceniza de fusionar)  ?bosscap=<frac> (tope por uso contra jefe)  ?cmul= (daño global). */
(function () {
  'use strict';
  var G = window.G, B = G.B, C = G.Cards, W = G.Weapons, fx = G.fx, inp = G.input, F = G.Fusion = {};
  function qnum(name, def) { var m = new RegExp('[?&]' + name + '=([\\d.]+)').exec(location.search); return m ? parseFloat(m[1]) : def; }

  var P = F.P = { basicDmg: 10, basicCd: 650, speed: 440, fuseAsh: qnum('fuseAsh', 0), replaceAsh: 20, bossCap: qnum('bosscap', 0.03), perTargetCap: 400, maxFields: 2 };
  var BONUS = [0.2, 0.35, 0.5];            // daño del básico por infusión según el Nv de la carta
  var RANGE = 440, uid = 0;

  // ------------------------------------------------------------- Pool de la prueba: 12 infusiones (2 por etiqueta) + 5 pasivas neutras / de vida
  var POOL = {};
  ['spark', 'ember', 'shard', 'nova', 'zap', 'storm', 'dart', 'pool', 'fang', 'bleed', 'dagger', 'axe', 'heart', 'hooves', 'magnet', 'satchel', 'hourglass'].forEach(function (id) { POOL[id] = 1; });
  F.inPool = function (id) { return !!POOL[id]; };
  var INF_TXT = {
    fire: 'Quema (3 dps). Nv3: el impacto explota.', ice: 'Ralentiza 25 %. Nv3: congela 0,5 s la 1.ª vez.', lightning: 'Encadena 1 salto (-20 %). Nv3: 2 saltos.',
    poison: 'Aplica 1 stack de veneno (apila 3).', blood: '20 % de curar 1 HP al impactar. Nv3: sangrado.', steel: 'Atraviesa 1 enemigo y 10 % de crítico. Nv3: atraviesa 2.'
  };
  C.defs.forEach(function (d) {   // textos de infusión (solo cambia la descripción; icono y nombre son los de siempre)
    if (d.type === 'attack' && INF_TXT[d.tag]) d.desc = 'INFUSIÓN: +20 % de daño a tu ataque básico. ' + INF_TXT[d.tag];
    if (d.id === 'hourglass') d.desc = 'Cooldown de los poderes -6 % (tope global -25 %) y básico más rápido.';
  });

  // ------------------------------------------------------------- Recetas / poderes (2 niveles). desc = frase corta para la ventana de fusión
  var R = F.recipes = [
    { id: 'vapor', name: 'Vapor', a: 'fire', b: 'ice', color: '#bfeaff', kind: 'cloud', sfx: 'fx_vapor',
      desc: 'Nube en el grupo más denso: ciega y ralentiza, con ticks de daño.',
      lv: [{ r: 90, dur: 4000, dmg: 6, cd: 14000 }, { r: 110, dur: 5000, dmg: 8, cd: 12000 }] },
    { id: 'plasma', name: 'Plasma', a: 'fire', b: 'lightning', color: '#ffb347', kind: 'beam', sfx: 'fx_plasma',
      desc: 'Rayo continuo perforante que gira 180 grados/s durante 2,5 s.',
      lv: [{ dur: 2500, w: 14, len: 260, dmg: 10, cd: 12000 }, { dur: 3500, w: 20, len: 260, dmg: 12, cd: 12000 }] },
    { id: 'gas', name: 'Gas inflamable', a: 'fire', b: 'poison', color: '#9bff5a', kind: 'gas', sfx: 'fx_gas',
      desc: 'Granada de gas venenoso; al acabar la nube detona.',
      lv: [{ r: 80, dur: 5000, det: 45, cd: 13000 }, { r: 100, dur: 5000, det: 70, perStack: 6, cd: 13000 }] },
    { id: 'sed', name: 'Sed de hierro', a: 'blood', b: 'steel', color: '#d02048', kind: 'orbit', sfx: 'fx_sed',
      desc: '3 dagas orbitan 6 s, tu básico dispara +40 % y cada 5 golpes curas 1 HP.',
      lv: [{ dur: 6000, dmg: 8, heal: 6, cd: 18000 }, { dur: 8000, dmg: 8, heal: 10, cd: 18000 }] }
  ];
  var RBY = {}, RKEY = {};
  R.forEach(function (r) { RBY[r.id] = r; RKEY[[r.a, r.b].sort().join('+')] = r; });
  F.recipe = function (id) { return RBY[id]; };
  F.recipeFor = function (t1, t2) { return RKEY[[t1, t2].sort().join('+')] || null; };

  // ------------------------------------------------------------- Estado
  F.fused = 0; F.auto = false; F.fields = []; F.fxs = []; F.timers = []; F.stats = { fusions: [], uses: {}, dmg: {}, firstFusionT: null, basicShots: 0 };
  var bT = 300, hitN = 0;
  function hand() { return G.player.hand; }
  F.reset = function () {
    var p = G.player; p.actives = [null, null];
    F.fused = 0; F.auto = false; F.fields = []; F.fxs = []; F.timers = []; bT = 300; hitN = 0;
    F.stats = { fusions: [], uses: {}, dmg: {}, firstFusionT: null, basicShots: 0 };
    var u = /[?&]actives=([\w,]+)/.exec(location.search);
    if (u) u[1].split(',').slice(0, 2).forEach(function (k) { var m = /^([a-z]+?)(2)?$/.exec(k); if (m && RBY[m[1]]) F.grant(m[1], m[2] ? 2 : 1); });
  };
  F.grant = function (id, lvl) {   // prueba / ?actives=: da un poder sin fusionar
    var p = G.player, i = p.actives.indexOf(null); if (i < 0) i = 1; var r = RBY[id];
    p.actives[i] = newSlot(r, lvl || 1);
  };
  function newSlot(r, lvl) { var L = r.lv[lvl - 1]; return { id: r.id, lvl: lvl, cd: Math.min(3000, L.cd), cdMax: L.cd, flash: 0, st: null, use: {}, dmg: 0, uses: 0, readyT: 0, used: false }; }
  F.activeCount = function () { var n = 0; G.player.actives.forEach(function (a) { if (a) n++; }); return n; };
  function activeOf(id) { var a = G.player.actives; for (var i = 0; i < 2; i++) if (a[i] && a[i].id === id) return i; return -1; }
  function canUse(r) { var i = activeOf(r.id); return !(i >= 0 && G.player.actives[i].lvl >= 2); }

  // ------------------------------------------------------------- Opciones de fusión desde la mano
  F.optionsFor = function (tag) {   // recetas que completa una carta ofrecida de esta etiqueta con una carta de ataque de la mano
    var h = hand(), out = [], seen = {};
    for (var i = 0; i < h.length; i++) {
      var s = h[i]; if (!s) continue;
      var d = C.def(s.id); if (d.type !== 'attack' || d.tag === tag) continue;
      var r = F.recipeFor(tag, d.tag);
      if (r && canUse(r) && !seen[r.id]) { seen[r.id] = 1; out.push({ recipe: r, slot: i }); }
    }
    return out;
  };
  F.handPairs = function () {
    var h = hand(), out = [], seen = {};
    for (var i = 0; i < h.length; i++) for (var j = i + 1; j < h.length; j++) {
      if (!h[i] || !h[j]) continue;
      var a = C.def(h[i].id), b = C.def(h[j].id); if (a.type !== 'attack' || b.type !== 'attack' || a.tag === b.tag) continue;
      var r = F.recipeFor(a.tag, b.tag);
      if (r && canUse(r) && !seen[r.id]) { seen[r.id] = 1; out.push({ recipe: r, slot: i, slot2: j }); }
    }
    return out;
  };

  // Fusiona. slotA: carta de la mano; slotB: segunda carta de la mano (o null si la segunda es la carta ofrecida offeredId). done() al terminar.
  F.fuse = function (r, slotA, slotB, offeredId, done) {
    var h = hand(), p = G.player;
    function finish(replaceIdx) {
      var ex = activeOf(r.id), free = p.actives.indexOf(null), lvlUp = false;
      if (P.fuseAsh > 0) { if (p.ash < P.fuseAsh) { C.msg('Necesitas ' + P.fuseAsh + ' Ceniza para fusionar.'); return; } p.ash -= P.fuseAsh; }
      // cartas que se consumen: 1.ª fusión ayudada = la carta inicial se conserva; después se consumen las dos
      var drop = [];
      if (offeredId) { if (F.fused > 0) drop.push(slotA); }
      else { [slotA, slotB].forEach(function (k) { if (!(F.fused === 0 && h[k].starter)) drop.push(k); }); }
      drop.forEach(function (k) { h[k] = null; });
      if (ex >= 0) { p.actives[ex].lvl = 2; var L2 = r.lv[1]; p.actives[ex].cdMax = L2.cd; p.actives[ex].cd = Math.min(p.actives[ex].cd, 2000); lvlUp = true; }
      else {
        var at = replaceIdx != null ? replaceIdx : free;
        if (replaceIdx != null) { p.ash += P.replaceAsh; fx.num(p.x, p.y - 30, '+' + P.replaceAsh + ' Ceniza', '#ff9a3c'); }
        p.actives[at] = newSlot(r, 1);
      }
      F.fused++; F.stats.fusions.push({ id: r.id, lvl: lvlUp ? 2 : 1, t: Math.round(G.runT) }); if (F.stats.firstFusionT == null) F.stats.firstFusionT = Math.round(G.runT);
      C.recalc(false);
      G.Hud.banner('¡FUSIÓN! ' + r.name + (lvlUp ? ' Nv2' : ''), 2400, '#ffd24a', { a: r.a, b: r.b, name: '¡' + r.name.toUpperCase() + '!', desc: r.desc });
      G.Snd.play('fx_fusion'); G.Snd.play('fuse');
      fx.ring(p.x, p.y, 10, 120, 500, G.TAGS[r.a].color, 6); fx.ring(p.x, p.y, 6, 90, 400, G.TAGS[r.b].color, 4);
      fx.burst(p.x, p.y, 24, G.TAGS[r.a].color, 260, 600, 4, { add: true }); fx.burst(p.x, p.y, 24, G.TAGS[r.b].color, 200, 600, 4, { add: true });
      if (done) done();
    }
    if (activeOf(r.id) < 0 && p.actives.indexOf(null) < 0) {   // 2 poderes ya: hay que elegir cuál reemplazar (con confirmación)
      var btns = p.actives.map(function (a, i) { return { label: 'REEMPLAZAR ' + RBY[a.id].name.toUpperCase() + ' Nv' + a.lvl + '   (+' + P.replaceAsh + ' Ceniza)', col: '#8a2030', fn: function () { finish(i); } }; });
      btns.push({ label: 'CANCELAR (no se consume nada)', col: '#3a2f48', fn: function () {} });
      C.modal('YA TIENES 2 PODERES', 'Para crear ' + r.name + ' hay que sustituir uno. Esto no se puede deshacer.', btns);
      return;
    }
    finish(null);
  };

  // ------------------------------------------------------------- Infusiones y etiqueta dinámica
  F.infusion = function () {
    var inf = {}, h = hand();
    for (var i = 0; i < h.length; i++) {
      var s = h[i]; if (!s) continue; var d = C.def(s.id); if (d.type !== 'attack') continue;
      var o = inf[d.tag] || (inf[d.tag] = { bonus: 0, lv: 0, n: 0 });
      o.bonus += BONUS[s.lvl - 1]; o.lv = Math.max(o.lv, s.lvl); o.n++;
    }
    return inf;
  };
  var oldRecalc = C.recalc;
  C.recalc = function (a) { oldRecalc(a); C.mods.steelCrit = F.infusion().steel ? 0.1 : 0; };   // infusión de Acero: 10 % de crítico
  function mulFor(e, tag) {
    var m = 1, r = e.partOf || e;
    if (e.mat && B.matMul) m *= B.matMul(e, tag);
    if (r.type === 'boss' && r.def) {
      var D = r.def, i;
      for (i = 0; i < D.weak.length; i++) if (D.weak[i].tag === tag && D.weak[i].phases.indexOf(r.phase) >= 0) m *= D.weak[i].mul;
      for (i = 0; i < D.resist.length; i++) if (D.resist[i].tag === tag) m *= D.resist[i].mul;
    }
    return m;
  }
  // De las etiquetas dadas, la que mejor multiplica contra este objetivo (un híbrido nunca es peor que su mejor mitad)
  function pickTag(e, tags) {
    if (!tags || !tags.length) return 'neutral';
    var best = tags[0], bm = -1;
    for (var i = 0; i < tags.length; i++) { var m = mulFor(e, tags[i]); if (m > bm + 1e-6) { bm = m; best = tags[i]; } }
    return best;
  }
  F.pickTag = pickTag;

  // ------------------------------------------------------------- Ataque básico
  function slotsActive(id) { var a = G.player.actives; for (var i = 0; i < 2; i++) if (a[i] && a[i].id === id && a[i].st) return a[i]; return null; }
  function basicShot(p) {
    var t = C.nearest(p.x, p.y, RANGE); if (!t) return false;
    var inf = F.infusion(), mul = 1, tags = [], dom = null, best = 0;
    for (var tg in inf) { mul += inf[tg].bonus; tags.push(tg); if (inf[tg].bonus > best) { best = inf[tg].bonus; dom = tg; } }
    var a = Math.atan2(t.y - p.y, t.x - p.x);
    var q = W.spawnProj({ x: p.x, y: p.y - 4, ang: a, speed: P.speed, dmg: P.basicDmg * mul, tag: dom || 'neutral', id: 'basic', kind: 'basic', r: 6, life: 1300 });
    if (!q) return false;
    q.fus = { tags: tags, inf: inf };
    q.pierceN = inf.steel ? (inf.steel.lv >= 3 ? 2 : 1) : 0;
    F.stats.basicShots++;
    G.Snd.play(dom || 'neutral', 1);
    return true;
  }
  F.basicHit = function (e, q, oo) {   // antes del daño: etiqueta dinámica + estados de las infusiones
    var inf = q.fus.inf;
    oo.tag = pickTag(e, q.fus.tags);
    if (inf.fire) oo.burn = 3;
    if (inf.ice) oo.slow = [0.25, 1500];
    if (inf.poison) oo.poison = true;
    if (inf.blood) { oo.lifesteal = 1; if (inf.blood.lv >= 3) oo.bleed = true; }
  };
  F.basicAfter = function (e, q) {    // después del daño: cadena, explosión, congelación y cuenta de golpes de Sed de hierro
    var inf = q.fus.inf, p = G.player;
    if (inf.lightning) { var nx = C.nearest(e.x, e.y, 110, [e]); if (nx) C.chain(e.x, e.y, nx, inf.lightning.lv >= 3 ? 2 : 1, q.dmg * 0.8, 0.8, 110, 'lightning', { exclude: [e], id: 'basic' }); }
    if (inf.fire && inf.fire.lv >= 3) C.boom(e.x, e.y, 30, q.dmg * 0.4, 'fire', { id: 'basic', kb: 10 });
    if (inf.ice && inf.ice.lv >= 3 && !e.frozeOnce) { e.frozeOnce = true; C.stun(e, 500); }
    var sed = slotsActive('sed');
    if (sed && ++hitN % 5 === 0 && sed.st.healed < sed.st.L.heal && !p.dead) { sed.st.healed++; G.Player.heal(p, 1, 'sed'); }
  };
  F.drawBasic = function (c, q) {
    var col = G.TAGS[q.tag] ? G.TAGS[q.tag].color : '#e8dcff';
    c.globalCompositeOperation = 'lighter'; c.globalAlpha = 0.55; c.fillStyle = col; c.beginPath(); c.arc(0, 0, 10, 0, 6.283); c.fill();
    c.globalCompositeOperation = 'source-over'; c.globalAlpha = 1; c.fillStyle = '#fff'; c.beginPath(); c.arc(0, 0, 4.5, 0, 6.283); c.fill();
    c.strokeStyle = col; c.lineWidth = 2; c.beginPath(); c.arc(0, 0, 5.5, 0, 6.283); c.stroke();
  };

  // ------------------------------------------------------------- Cegado (Vapor): el enemigo persigue un punto al azar
  F.blindTarget = function (e, p, dt) {
    e.blindT -= dt;
    if (!e.blindP) { e.blindP = Object.create(p); e.blindR = 0; }
    if ((e.blindR -= dt) <= 0) { e.blindR = 1100; var a = Math.random() * 6.283, d = 120 + Math.random() * 140; e.blindP.x = e.x + Math.cos(a) * d; e.blindP.y = e.y + Math.sin(a) * d; }
    return e.blindP;
  };

  // ------------------------------------------------------------- Daño de poderes con topes por uso
  function hitE(e, slot, dmg, o, tags) {
    var r = e.partOf || e; if (!r.fid) r.fid = ++uid;
    var used = slot.use[r.fid] || 0, cap = r.type === 'boss' ? P.bossCap * r.maxHp : P.perTargetCap;
    if (used >= cap) return 0;
    slot.use[r.fid] = used + dmg;
    o.tag = pickTag(e, tags); o.id = o.id || slot.id; o.zone = true;
    var d = C.deal(e, dmg, o) || 0; slot.dmg += d;
    F.stats.dmg[slot.id] = (F.stats.dmg[slot.id] || 0) + d;
    return d;
  }
  function tickEnemy(e, key, ms) { var tk = e.tk || (e.tk = {}); if ((tk[key] || 0) > G.time) return false; tk[key] = G.time + ms; return true; }
  function densest(p, range, rad) {   // enemigo con más vecinos en rad (centro de la nube / granada)
    var list = C.inRange(p.x, p.y, range), best = null, bn = -1;
    for (var i = 0; i < list.length; i++) {
      var e = list[i]; if (e.partOf) continue;
      var n = 0; for (var j = 0; j < list.length; j++) if (Math.hypot(list[j].x - e.x, list[j].y - e.y) <= rad) n++;
      if (n > bn) { bn = n; best = e; }
    }
    return best ? { x: best.x, y: best.y, n: bn } : null;
  }
  function later(ms, fn) { F.timers.push({ t: ms, fn: fn }); }
  function addField(f) { f.max = f.life; f.tk = 0; F.fields.push(f); while (F.fields.length > P.maxFields) { F.fields.shift(); } }

  // ------------------------------------------------------------- Lanzamiento de cada poder (devuelve false si no hay objetivo útil)
  var CAST = {
    cloud: function (slot, r, L, p) {
      var t = densest(p, 440, L.r); if (!t) return false;
      addField({ kind: 'cloud', x: t.x, y: t.y, r: L.r, life: L.dur, interval: 250, slot: slot, L: L });
      fx.ring(t.x, t.y, 10, L.r, 450, '#e8f6ff', 6); fx.burst(t.x, t.y, 14, '#e8f6ff', 120, 600, 5, { add: true, drag: 1 });
      return true;
    },
    gas: function (slot, r, L, p) {
      var t = densest(p, 440, L.r); if (!t) return false;
      var o = { x0: p.x, y0: p.y - 8, x1: t.x, y1: t.y, t: 0, dur: 450 };
      F.fxs.push(o);
      later(o.dur, function () {
        addField({ kind: 'gas', x: t.x, y: t.y, r: L.r, life: L.dur, interval: 500, slot: slot, L: L });
        fx.burst(t.x, t.y, 16, '#9bff5a', 140, 600, 5, { drag: 1 }); fx.ring(t.x, t.y, 8, L.r, 400, '#9bff5a', 5);
      });
      return true;
    },
    beam: function (slot, r, L, p) {
      var t = C.nearest(p.x, p.y, 520); if (!t) return false;
      slot.st = { t: L.dur, dur: L.dur, ang: Math.atan2(t.y - p.y, t.x - p.x), tk: 0, snd: 0, L: L };
      return true;
    },
    orbit: function (slot, r, L, p) {
      if (!C.nearest(p.x, p.y, 420)) return false;
      slot.st = { t: L.dur, dur: L.dur, ang: 0, healed: 0, bodies: [], L: L };
      fx.ring(p.x, p.y, 8, 70, 400, '#d02048', 5);
      return true;
    }
  };

  function cdMul() { var hg = (1 - C.mods.cdMul) / 0.1; return Math.max(0.75, 1 - 0.06 * hg); }   // Reloj de arena: -6 % por nivel, tope global -25 %
  F.fire = function (i, auto) {
    var p = G.player, s = p.actives[i]; if (!s || p.dead || G.state !== 'play') return false;
    if (s.cd > 0 || s.st) { if (!auto) G.Snd.play('fx_deny'); return false; }
    var r = RBY[s.id], L = r.lv[s.lvl - 1];
    s.use = {};
    if (!CAST[r.kind](s, r, L, p)) { if (!auto) { fx.num(p.x, p.y - 34, 'sin objetivo', '#9a8fb0'); G.Snd.play('fx_deny'); } return false; }
    s.cdMax = Math.round(L.cd * cdMul()); s.cd = s.cdMax; s.flash = 220; s.uses++; s.used = true;
    F.stats.uses[s.id] = (F.stats.uses[s.id] || 0) + 1;
    G.Snd.play(r.sfx, 1); fx.shake(3, 100);
    return true;
  };
  function autoOK(s, r, p) {   // modo AUTO: dispara cuando hay objetivo útil
    var n = C.inRange(p.x, p.y, 280).length, boss = G.Enemies.boss && G.Enemies.boss();
    if (r.kind === 'cloud' || r.kind === 'gas') return n >= 3 || (boss && n >= 1);
    if (r.kind === 'beam') return C.inRange(p.x, p.y, 240).length >= 1;
    if (r.kind === 'orbit') return C.inRange(p.x, p.y, 150).length >= 2;
    return false;
  }

  // ------------------------------------------------------------- Bucle
  function updateSlot(s, dt, p) {
    var r = RBY[s.id];
    if (s.flash > 0) s.flash -= dt;
    if (s.readyT > 0) s.readyT -= dt;
    if (s.cd > 0) { s.cd -= dt; if (s.cd <= 0) { s.cd = 0; if (s.used) { s.readyT = 700; G.Snd.play('fx_ready'); } } }
    var st = s.st; if (!st) return;
    st.t -= dt;
    if (r.kind === 'beam') {
      st.ang += Math.PI * dt / 1000;   // 180 grados por segundo
      st.tk -= dt; st.snd -= dt;
      st.x0 = p.x; st.y0 = p.y - 6; st.x1 = st.x0 + Math.cos(st.ang) * st.L.len; st.y1 = st.y0 + Math.sin(st.ang) * st.L.len;
      if (st.snd <= 0) { st.snd = 420; G.Snd.play('fx_plasma', 1); }
      if (st.tk <= 0) {
        st.tk = 140;
        var list = C.inRange(p.x, p.y, st.L.len + 30), hits = [], dx = st.x1 - st.x0, dy = st.y1 - st.y0, ll = dx * dx + dy * dy;
        for (var i = 0; i < list.length; i++) {
          var e = list[i], u = Math.max(0, Math.min(1, ((e.x - st.x0) * dx + (e.y - st.y0) * dy) / ll)), d = Math.hypot(e.x - (st.x0 + dx * u), e.y - (st.y0 + dy * u));
          if (d <= st.L.w / 2 + e.r) hits.push({ e: e, u: u });
        }
        hits.sort(function (a, b) { return a.u - b.u; });
        for (var k = 0; k < hits.length && k < 12; k++) hitE(hits[k].e, s, st.L.dmg, { burn: 3, noChain: true, kb: 0 }, ['fire', 'lightning']);
        if (Math.random() < 0.7) fx.dot(st.x1, st.y1, G.rnd(-60, 60), G.rnd(-60, 60), 300, '#ffb347', 3, { add: true });
      }
    } else if (r.kind === 'orbit') {
      st.ang += 4.2 * dt / 1000; st.bodies = [];
      for (var b = 0; b < 3; b++) {
        var a = st.ang + b * 2.094, bx = p.x + Math.cos(a) * 55, by = p.y - 2 + Math.sin(a) * 55;
        st.bodies.push({ x: bx, y: by, a: a });
        var near = C.inRange(bx, by, 11);
        for (var j = 0; j < near.length; j++) { if (tickEnemy(near[j], 'sed', 450)) hitE(near[j], s, st.L.dmg, { bleed: true, kb: 20, ang: a + Math.PI / 2 }, ['blood', 'steel']); }
      }
    }
    if (st.t <= 0) s.st = null;
  }
  function updateFields(dt) {
    for (var i = F.fields.length - 1; i >= 0; i--) {
      var f = F.fields[i]; f.life -= dt; f.tk -= dt;
      if (f.tk <= 0) {
        f.tk = f.interval;
        var list = C.inRange(f.x, f.y, f.r);
        for (var j = 0; j < list.length; j++) {
          var e = list[j];
          if (f.kind === 'cloud') {
            var big = e.big || e.type === 'boss' || e.partOf;
            if (!big) e.blindT = Math.max(e.blindT || 0, f.interval + 300);
            hitE(e, f.slot, f.L.dmg * (big ? 1.2 : 1), { slow: [0.3, 600], noChain: true, kb: 0 }, ['fire', 'ice']);   // jefes / élites: sin ceguera, +20 % de daño recibido
          } else {
            if (!e.partOf) C.poison(e, 1);
            hitE(e, f.slot, 2, { noChain: true, kb: 0 }, ['poison', 'fire']);
          }
        }
        if (Math.random() < 0.6) fx.dot(f.x + G.rnd(-f.r, f.r) * 0.6, f.y + G.rnd(-f.r, f.r) * 0.4, 0, -30, 600, f.kind === 'gas' ? '#9aff6a' : '#e8f6ff', 3, { drag: 1 });
      }
      if (f.life <= 0) {
        if (f.kind === 'gas') {
          var L = f.L, all = C.inRange(f.x, f.y, f.r);
          if (L.perStack) all.forEach(function (e) { if (e.poisonN > 0 && !e.partOf) hitE(e, f.slot, L.perStack * e.poisonN, { noChain: true, kb: 0 }, ['fire']); });
          C.boom(f.x, f.y, f.r, L.det, 'fire', { id: 'gas', burn: 3, big: true, kb: 60, color: '#b8ff40' });
          G.Snd.play('fx_gas_boom', 1); fx.shake(5, 160);
        }
        F.fields.splice(i, 1);
      }
    }
  }
  F.update = function (dt, base) {
    var p = G.player; if (p.dead) return;
    var i, s;
    // temporizadores propios
    for (i = F.timers.length - 1; i >= 0; i--) { F.timers[i].t -= dt; if (F.timers[i].t <= 0) { var fn = F.timers[i].fn; F.timers.splice(i, 1); fn(); } }
    for (i = F.fxs.length - 1; i >= 0; i--) { F.fxs[i].t += dt; if (F.fxs[i].t > F.fxs[i].dur) F.fxs.splice(i, 1); }
    // ataque básico (Sed de hierro: +40 % de cadencia)
    var rate = base * (slotsActive('sed') ? 1.4 : 1);
    bT -= dt * rate;
    if (bT <= 0) { if (basicShot(p)) bT = P.basicCd; else bT = 0; }
    // poderes
    for (i = 0; i < 2; i++) { s = p.actives[i]; if (s) updateSlot(s, dt, p); }
    updateFields(dt);
    // entrada
    if (inp.hit('KeyQ')) F.fire(0);
    if (inp.hit('KeyE')) F.fire(1);
    if (inp.hit('KeyF')) { F.auto = !F.auto; fx.num(p.x, p.y - 34, 'AUTO ' + (F.auto ? 'SÍ' : 'NO'), '#ffe9a0'); G.Snd.play('fx_btn'); }
    if (F.auto) for (i = 0; i < 2; i++) { s = p.actives[i]; if (s && s.cd <= 0 && !s.st && autoOK(s, RBY[s.id], p)) F.fire(i, true); }
  };

  // ------------------------------------------------------------- Botones táctiles / ratón (dentro de la mitad derecha: el joystick flotante solo nace en la mitad izquierda)
  var BTN = [{ x: 880, y: 462, r: 42 }, { x: 786, y: 480, r: 42 }], AUTO = { x: 835, y: 508, w: 90, h: 24 };
  F.BTN = BTN; F.AUTO = AUTO;
  F.press = function (m, type) {
    if (G.Sys) G.Sys.touchActive = type !== 'mouse';
    if (m.x >= AUTO.x && m.x <= AUTO.x + AUTO.w && m.y >= AUTO.y && m.y <= AUTO.y + AUTO.h) { F.auto = !F.auto; G.Snd.play('fx_btn'); return true; }
    for (var i = 0; i < 2; i++) if (Math.hypot(m.x - BTN[i].x, m.y - BTN[i].y) <= BTN[i].r + 8) { if (G.player.actives[i]) F.fire(i); return true; }
    return false;
  };

  // ------------------------------------------------------------- Dibujo
  F.drawGround = function (c) {
    var t = G.time / 1000;
    for (var i = 0; i < F.fields.length; i++) {
      var f = F.fields[i], u = Math.min(1, f.life / 400, (f.max - f.life) / 250 + 0.2);
      G.FusionArt.cloud(c, f.x, f.y, f.r, t, f.kind === 'gas' ? 'gas' : 'vapor', u);
      if (f.kind === 'gas' && f.life < 1000 && Math.floor(f.life / 120) % 2) { c.save(); c.strokeStyle = '#ff7a2a'; c.lineWidth = 4; c.globalAlpha = 0.8; c.beginPath(); c.ellipse(f.x, f.y, f.r, f.r * 0.8, 0, 0, 6.283); c.stroke(); c.restore(); }   // aviso de detonación
    }
  };
  F.drawAir = function (c) {
    var p = G.player, i, j;
    for (i = 0; i < F.fxs.length; i++) {   // granada en vuelo
      var o = F.fxs[i], u = o.t / o.dur, x = o.x0 + (o.x1 - o.x0) * u, y = o.y0 + (o.y1 - o.y0) * u - Math.sin(u * Math.PI) * 60;
      G.FusionArt.nade(c, x, y, u * 12);
    }
    for (i = 0; i < 2; i++) {
      var s = p.actives && p.actives[i]; if (!s || !s.st) continue;
      var st = s.st;
      if (RBY[s.id].kind === 'beam') G.FusionArt.beam(c, st.x0, st.y0, st.x1, st.y1, st.L.w, G.time / 1000);
      else if (RBY[s.id].kind === 'orbit') for (j = 0; j < st.bodies.length; j++) G.FusionArt.dagger(c, st.bodies[j].x, st.bodies[j].y, st.bodies[j].a + Math.PI / 2);
    }
  };
  function sweep(c, x, y, r, frac) {
    c.fillStyle = 'rgba(8,4,14,0.72)'; c.beginPath(); c.moveTo(x, y); c.arc(x, y, r, -Math.PI / 2, -Math.PI / 2 + 6.283 * frac); c.closePath(); c.fill();
  }
  F.drawHud = function (c) {
    var p = G.player, t = G.time / 1000, touch = G.Sys.isTouch();
    for (var i = 0; i < 2; i++) {
      var b = BTN[i], s = p.actives[i];
      c.save();
      c.fillStyle = 'rgba(10,6,18,0.82)'; c.beginPath(); c.arc(b.x, b.y, b.r, 0, 6.283); c.fill();
      if (!s) {
        c.strokeStyle = 'rgba(160,140,190,0.4)'; c.lineWidth = 3; c.setLineDash([6, 6]); c.beginPath(); c.arc(b.x, b.y, b.r - 2, 0, 6.283); c.stroke(); c.setLineDash([]);
        G.txt(c, 'PODER', b.x, b.y - 6, 11, 'rgba(180,160,210,0.6)', 'center'); G.txt(c, touch ? String(i + 1) : (i ? 'E' : 'Q'), b.x, b.y + 10, 14, 'rgba(180,160,210,0.6)', 'center');
        c.restore(); continue;
      }
      var r = RBY[s.id], ready = s.cd <= 0 && !s.st;
      c.save(); c.beginPath(); c.arc(b.x, b.y, b.r - 3, 0, 6.283); c.clip();
      c.fillStyle = 'rgba(' + (s.id === 'vapor' ? '40,70,100' : s.id === 'plasma' ? '90,50,20' : s.id === 'gas' ? '40,70,30' : '80,20,36') + ',0.9)'; c.fillRect(b.x - b.r, b.y - b.r, b.r * 2, b.r * 2);
      G.FusionArt.icon(c, s.id, b.x, b.y - 2, b.r * 0.55);
      if (s.cd > 0) sweep(c, b.x, b.y, b.r * 1.5, Math.min(1, s.cd / s.cdMax));
      if (s.flash > 0) { c.fillStyle = 'rgba(255,255,255,' + 0.5 * s.flash / 220 + ')'; c.fillRect(b.x - b.r, b.y - b.r, b.r * 2, b.r * 2); }
      c.restore();
      c.lineWidth = ready ? 5 : 3;
      if (ready) { c.strokeStyle = '#ffd24a'; c.shadowColor = '#ffd24a'; c.shadowBlur = 10 + 6 * Math.sin(t * 8); } else c.strokeStyle = s.st ? r.color : '#6a5a86';
      c.beginPath(); c.arc(b.x, b.y, b.r - 1.5, 0, 6.283); c.stroke(); c.shadowBlur = 0;
      if (s.st) { c.strokeStyle = r.color; c.lineWidth = 4; c.beginPath(); c.arc(b.x, b.y, b.r + 4, -Math.PI / 2, -Math.PI / 2 + 6.283 * (s.st.t / s.st.dur)); c.stroke(); }
      if (s.readyT > 0) { c.strokeStyle = 'rgba(255,233,160,' + s.readyT / 700 + ')'; c.lineWidth = 3; c.beginPath(); c.arc(b.x, b.y, b.r + 4 + (700 - s.readyT) / 700 * 16, 0, 6.283); c.stroke(); }
      if (s.cd > 0) G.txt(c, (s.cd >= 10000 ? Math.ceil(s.cd / 1000) : (s.cd / 1000).toFixed(1)), b.x, b.y + 2, 20, '#fff', 'center');
      G.txt(c, r.name + (s.lvl > 1 ? ' II' : ''), b.x, b.y - b.r - 9, 11, ready ? '#ffe9a0' : '#9a8fb0', 'center');
      if (!touch) { c.fillStyle = '#0c0814'; c.fillRect(b.x - b.r + 2, b.y + b.r - 20, 20, 20); G.txt(c, i ? 'E' : 'Q', b.x - b.r + 12, b.y + b.r - 10, 14, '#ffd27a', 'center'); }
      c.restore();
    }
    var a = AUTO; c.save(); c.fillStyle = F.auto ? '#2a8a4a' : 'rgba(10,6,18,0.8)'; c.fillRect(a.x, a.y, a.w, a.h); c.strokeStyle = F.auto ? '#9dffb4' : '#6a5a86'; c.lineWidth = 2; c.strokeRect(a.x + 1, a.y + 1, a.w - 2, a.h - 2);
    G.txt(c, 'AUTO ' + (F.auto ? 'SI' : 'NO') + (touch ? '' : ' (F)'), a.x + a.w / 2, a.y + a.h / 2, 11, '#fff', 'center'); c.restore();
  };
  F.drawChips = function (c) {   // pantalla de oferta: panel PODERES arriba a la derecha
    var p = G.player;
    G.txt(c, 'PODERES', 770, 14, 11, '#9a8fb0', 'left');
    for (var i = 0; i < 2; i++) {
      var s = p.actives[i], x = 770 + i * 96, y = 24, w = 90, h = 34;
      c.save(); c.fillStyle = 'rgba(12,8,20,0.7)'; c.fillRect(x, y, w, h); c.strokeStyle = s ? RBY[s.id].color : 'rgba(160,140,190,0.35)'; c.lineWidth = 2; c.strokeRect(x + 1, y + 1, w - 2, h - 2);
      if (s) { G.FusionArt.icon(c, s.id, x + 17, y + 17, 11); G.txt(c, RBY[s.id].name.split(' ')[0], x + 60, y + 12, 11, '#fff', 'center'); G.txt(c, 'Nv' + s.lvl, x + 60, y + 25, 11, '#ffd24a', 'center'); }
      else G.txt(c, 'libre', x + w / 2, y + h / 2, 11, 'rgba(180,160,210,0.5)', 'center');
      c.restore();
    }
  };
  F.endText = function () {
    var p = G.player, a = (p.actives || []).filter(Boolean);
    if (!a.length) return 'Sin poderes: fusiona dos cartas de etiquetas distintas';
    return 'PODERES: ' + a.map(function (s) { return RBY[s.id].name + ' Nv' + s.lvl + ' (' + s.uses + ' usos)'; }).join('  -  ');
  };

  // Estado resumido para pruebas (fusion_tests.js / partidas de humo)
  F.snapshot = function () {
    var p = G.player;
    return { actives: p.actives.map(function (s) { return s && { id: s.id, lvl: s.lvl, cd: Math.round(s.cd), uses: s.uses, dmg: Math.round(s.dmg) }; }), fused: F.fused, auto: F.auto, stats: F.stats, hand: p.hand.map(function (h) { return h && h.id + ':' + h.lvl; }) };
  };
})();
