/* boss_cenizar_chain.js - P6.5: Cenizar F7, el ROSARIO DEL INCENDIO (cadena de 6 eslabones) y el desesperado CADENA FINAL. DESIGN-v7 sección 8.
   La cadena es una línea de tiempo de eventos de zona (S.cz.add) con vista previa fantasma de TODOS los eslabones durante el Anuncio de 1500 ms, glifos 1-6 sobre el jefe y un
   eslabón por Reliquia no rota (Cayado 1 Doble Embestida, Núcleo 2 Doble Martillazo, Ojo 3 Coro de tres conos, Colmillo 4 Ventisca doble, Corona 5 Zumbido en espiral; el 6 Sol de
   Cenizar siempre queda). Cada eslabón respeta la regla de esquiva (S.cz.evTele). La geometría es ESTÁTICA (se decide al empezar el Anuncio) y se VALIDA con una búsqueda en
   tiempo-espacio (BFS a 190 px/s desde donde está el jugador): si no hay ruta sin daño se descarta y se genera otra (S.chainReachable() mide la tasa). */
(function () {
  'use strict';
  var G = window.G, S = G.Boss, fx = G.fx, E = G.Enemies, U = S && S.u, Z = S && S.cz;
  if (!S || !U || !Z) return;
  var ATK = S.ATK, TAU = Math.PI * 2, DEG = Math.PI / 180, D = Z.D, H = Z.H;
  var ease = U.ease, angTo = U.angTo, sfx = U.sfx, pel = U.pel, expose = U.expose, gnd = Z.gnd, geo = Z.geo, faceTo = Z.faceTo;
  function PL() { return G.player; }
  function A() { return S.A; }
  var ANN = 1500;
  // ---- tabla de la cadena (ms desde el inicio de la parte activa; DESIGN 8.1). at = impacto; tele = telegrafía base; ex = salida (px) para la regla
  var TBL = {
    '1a': { link: 1, at: 900,  tele: 900, ex: 55 },  '1b': { link: 1, at: 1800, tele: 600, ex: 55 },
    '2a': { link: 2, at: 2100, tele: 900, ex: 100 }, '2b': { link: 2, at: 2700, tele: 900, ex: 100 },
    '3':  { link: 3, at: 3300, tele: 950, ex: 110 },
    '4a': { link: 4, at: 3800, tele: 1100, ex: 140 }, '4b': { link: 4, at: 5300, tele: 1100, ex: 140 },
    '5a': { link: 5, at: 5400, tele: 900, ex: 80 }, '5b': { link: 5, at: 6100, tele: 900, ex: 80 }, '5c': { link: 5, at: 6800, tele: 900, ex: 80 },
    '6':  { link: 6, at: 7400, tele: 1300, ex: 120 },
    '1c': { link: 1, at: 4200, tele: 900, ex: 55 }   // Eco (Peligro III+): repite el eslabón 1 a mitad de cadena
  };
  Z.CHAIN_TBL = TBL;
  var LNAME = [null, 'Doble Embestida', 'Doble Martillazo', 'Coro de tres conos', 'Ventisca doble', 'Zumbido en espiral', 'Sol de Cenizar'];
  var LCOL = [null, 'purple', 'orange', 'turq', 'blue', 'amber', 'white'];
  var RELIC_OF = [null, 'cayado', 'nucleo', 'ojo', 'colmillo', 'corona', null];
  Z.LNAME = LNAME;

  function present(e, final) {
    var out = [1, 2, 3, 4, 5, 6].filter(function (l) { return final || !RELIC_OF[l] || !e.broken[RELIC_OF[l]]; });
    return out;
  }
  function rv(a, b) { return a + Math.random() * (b - a); }
  function rsg() { return Math.random() < 0.5 ? -1 : 1; }

  // ---- generación de la geometría de una cadena candidata. keys = ids de TBL presentes. Devuelve { items: [{id, spec}], waves: [...] } con tiempos ya comprimidos
  function timeline(keys) {
    // grupos por eslabón; si falta un eslabón se acorta: el siguiente grupo se adelanta para que no queden huecos de más de ~400 ms
    var order = [1, 2, 3, 4, 5, 6], shift = 0, cursor = -1e9, first = true, sh = {};
    var ids = Object.keys(TBL).filter(function (k) { return keys.indexOf(k) >= 0; });
    order.forEach(function (l) {
      var gk = ids.filter(function (k) { return TBL[k].link === l && k !== '1c'; });
      if (!gk.length) return;
      var s = Math.min.apply(null, gk.map(function (k) { return TBL[k].at - TBL[k].tele; })), want;
      if (first) { shift = -s; first = false; } else if (s + shift - cursor > -200) shift -= (s + shift - cursor + 400);
      gk.forEach(function (k) { sh[k] = shift; cursor = Math.max(cursor, TBL[k].at + shift); });
    });
    if (keys.indexOf('1c') >= 0) sh['1c'] = shift;
    return sh;
  }
  function genGeo(e, keys, P0, final) {
    var g = gnd(e), sh = timeline(keys), out = [], waves = [], k;
    var aP = Math.atan2(P0.y - g.y, P0.x - g.x), gm = geo('chain');
    function add(id, spec) { var T = TBL[id]; spec.id = id; spec.link = T.link; spec.atRel = T.at + sh[id]; spec.tele = Z.evTele(T.tele, T.ex, true); out.push(spec); }
    var a1 = aP + rv(-0.4, 0.4), a1b = a1 + rsg() * rv(0.5, 1.1);
    if (keys.indexOf('1a') >= 0) { add('1a', { k: 'lane', x: g.x, y: g.y, a: a1, w: 100 * gm, len: 560, dmg: 24, kb: 1.6 }); add('1b', { k: 'lane', x: g.x, y: g.y, a: a1b, w: 100 * gm, len: 560, dmg: 24, kb: 1.6 }); }
    if (keys.indexOf('2a') >= 0) {
      var o2 = rv(0, 100), t2 = Math.random() * TAU, o3 = rv(60, 180), t3 = Math.random() * TAU;
      add('2a', { k: 'circle', x: Z.clampX(P0.x + Math.cos(t2) * o2, 40), y: Z.clampY(P0.y + Math.sin(t2) * o2, 40), r: 90 * gm, dmg: 28, kb: 1.4 });
      add('2b', { k: 'circle', x: Z.clampX(P0.x + Math.cos(t3) * o3, 40), y: Z.clampY(P0.y + Math.sin(t3) * o3, 40), r: 90 * gm, dmg: 28, kb: 1.4 });
    }
    var cb = aP + rv(0, TAU / 3);
    if (keys.indexOf('3') >= 0) add('3', { k: 'cones', x: g.x, y: g.y, angs: [cb, cb + TAU / 3, cb + 2 * TAU / 3], half: 20 * DEG, reach: 420 * gm, dmg: 14, slow: [0.35, 2000], kb: 1 });
    var wdir = rsg(), wy1 = G.clamp(P0.y + rv(-170, 170), 190, G.AH - 190), wy2 = G.clamp(wy1 + rv(-150, 150), 190, G.AH - 190);
    if (keys.indexOf('4a') >= 0) { waves.push({ id: '4a', link: 4, atRel: TBL['4a'].at + sh['4a'], tele: Z.evTele(TBL['4a'].tele, 140, true), dir: wdir, gap: wy1 }); waves.push({ id: '4b', link: 4, atRel: TBL['4b'].at + sh['4b'], tele: Z.evTele(TBL['4b'].tele, 140, true), dir: wdir, gap: wy2 }); }
    if (keys.indexOf('5a') >= 0) {
      var rc = { x: Z.clampX(P0.x + rv(-160, 160), 120), y: Z.clampY(P0.y + rv(-120, 120), 120) }, ks = Math.random() < 0.6 ? [3, 2, 1] : [1, 2, 3], gg = Math.random() * TAU, ids5 = ['5a', '5b', '5c'];
      ids5.forEach(function (id, i) {
        var R = ks[i] * 83 + (ks[0] === 1 ? 83 : 0), c2 = rv(-0.4, 0.4), contract = ks[0] === 3;
        add(id, { k: 'hex', x: rc.x, y: rc.y, apo: R * 0.8660254, apo0: (R + (contract ? 83 : -83)) * 0.8660254, th: 32, gaps: [gg + c2 * i, gg + Math.PI + c2], gh: Math.min(0.95, Math.atan(75 / R)), dmg: 18, kb: 0.8 });
      });
    }
    if (keys.indexOf('6') >= 0) add('6', { k: 'donut', x: g.x, y: g.y, r: 330, inner: 120, dmg: 22, kb: 1.2 });
    if (keys.indexOf('1c') >= 0) add('1c', { k: 'lane', x: g.x, y: g.y, a: aP + rsg() * rv(0.3, 1.2), w: 100 * gm, len: 560, dmg: 24, kb: 1.6 });
    if (final) {   // Eco de la Cadena Final: espejo de los dos primeros eslabones
      var endT = 0; out.forEach(function (s) { endT = Math.max(endT, s.atRel); });
      ['1a', '1b'].forEach(function (id, i) {
        var s0 = out.filter(function (s) { return s.id === id; })[0]; if (!s0) return;
        out.push({ id: 'E' + id, link: 7, k: 'lane', x: G.AW - g.x, y: g.y, a: Math.PI - s0.a, w: s0.w, len: 560, dmg: 24, kb: 1.6, atRel: endT + 1500 + i * 900, tele: Z.evTele(TBL[id].tele, 55, true) });
      });
    }
    return { items: out, waves: waves, sh: sh };
  }

  // ---- validación: búsqueda en tiempo-espacio desde la posición del jugador al empezar el Anuncio (celdas de 14 px, pasos de 100 ms, 8 vecinos ~ 190 px/s)
  var CS = 14;
  function bfs(geoSpec, P0) {
    var x0 = G.WALL + 16, y0 = G.WALL + 16, nx = Math.floor((G.AW - 2 * G.WALL - 32) / CS) + 1, ny = Math.floor((G.AH - 2 * G.WALL - 32) / CS) + 1, N = nx * ny, i, j, p = PL(), pr = p.r;
    var masks = geoSpec.items.map(function (s) {
      var m = new Uint8Array(N); for (j = 0; j < ny; j++) for (i = 0; i < nx; i++) if (Z.inside(s, x0 + i * CS, y0 + j * CS, pr)) m[j * nx + i] = 1; return m;
    });
    var cur = new Uint8Array(N), nxt = new Uint8Array(N), ci = G.clamp(Math.round((P0.x - x0) / CS), 0, nx - 1), cj = G.clamp(Math.round((P0.y - y0) / CS), 0, ny - 1);
    cur[cj * nx + ci] = 1;
    var tEnd = 0; geoSpec.items.forEach(function (s) { tEnd = Math.max(tEnd, s.atRel + 200); }); geoSpec.waves.forEach(function (w) { tEnd = Math.max(tEnd, w.atRel + (G.AW + 200) / 260 * 1000); });
    var minReach = N, step = 100, t, d, k;
    for (t = -ANN; t <= tEnd; t += step) {
      nxt.fill(0);
      for (j = 0; j < ny; j++) for (i = 0; i < nx; i++) if (cur[j * nx + i]) {
        for (var dj = -1; dj <= 1; dj++) for (var di = -1; di <= 1; di++) { var a = i + di, b = j + dj; if (a >= 0 && a < nx && b >= 0 && b < ny) nxt[b * nx + a] = 1; }
      }
      for (k = 0; k < masks.length; k++) {
        var s = geoSpec.items[k];
        if (t >= s.atRel - 100 && t <= s.atRel + 160 + 100) { var m = masks[k]; for (d = 0; d < N; d++) if (m[d]) nxt[d] = 0; }
      }
      for (k = 0; k < geoSpec.waves.length; k++) {
        var w = geoSpec.waves[k], tw = t - w.atRel, tw2 = tw + step; if (tw2 < 0) continue;
        var wx0 = w.dir > 0 ? G.WALL - 60 : G.AW - G.WALL + 60, f0 = wx0 + w.dir * 260 * Math.max(0, tw) / 1000, f1 = wx0 + w.dir * 260 * tw2 / 1000, lo = Math.min(f0, f1) - 60 - pr * 0.5, hi = Math.max(f0, f1) + 60 + pr * 0.5;
        if (hi < 0 || lo > G.AW) continue;
        for (j = 0; j < ny; j++) { var yy = y0 + j * CS; if (Math.abs(yy - w.gap) <= 70 - pr * 0.3) continue; for (i = 0; i < nx; i++) { var xx = x0 + i * CS; if (xx >= lo && xx <= hi) nxt[j * nx + i] = 0; } }
      }
      var cnt = 0; for (d = 0; d < N; d++) cnt += nxt[d]; minReach = Math.min(minReach, cnt);
      if (cnt === 0) return { ok: false, minReach: 0 };
      var sw = cur; cur = nxt; nxt = sw;
    }
    return { ok: true, minReach: minReach, frac: minReach / N };
  }
  Z.bfs = bfs;
  function keysFor(e, final) {
    var ls = present(e, final), keys = [];
    ls.forEach(function (l) { if (l === 1) keys.push('1a', '1b'); else if (l === 2) keys.push('2a', '2b'); else if (l === 3) keys.push('3'); else if (l === 4) keys.push('4a', '4b'); else if (l === 5) keys.push('5a', '5b', '5c'); else keys.push('6'); });
    if (pel().v3 && ls.indexOf(1) >= 0) keys.push('1c');
    return { keys: keys, links: ls };
  }
  Z.genChain = function (e, final, P0, tries) {
    var kf = keysFor(e, final), best = null, n = 0, r;
    tries = tries || 8;
    for (; n < tries; n++) {
      var spec = genGeo(e, kf.keys, P0, final); r = bfs(spec, P0);
      if (r.ok) { spec.valid = true; spec.tries = n + 1; spec.links = kf.links; spec.minReach = r.minReach; return spec; }
      if (!best || r.minReach > best.rr) best = { spec: spec, rr: r.minReach };
    }
    best.spec.valid = false; best.spec.tries = tries; best.spec.links = kf.links; return best.spec;
  };

  // ---- instancia de la cadena en el combate
  function launch(e, final) {
    var a = A(), p = PL(), spec = Z.genChain(e, final, { x: p.x, y: p.y }, final ? 10 : 8), ch;
    ch = a.ch = { final: !!final, spec: spec, t: -ANN, n: 0, links: spec.links, waves: [], end: 0, solDone: false, ghosts: [], hits0: a.hurts || 0 };
    spec.items.forEach(function (s) {
      var tele = s.tele, ev = Z.add(Object.assign({}, s, { delay: ANN + s.atRel - tele, tele: tele, ghost: true, glyph: s.link === 7 ? null : s.link, col: s.link === 7 ? 'purple' : LCOL[s.link], sig: s.link === 6, silent: true, dur: s.k === 'hex' ? 200 : 160 }));
      ev.fixAt = ev.t0 + (s.k === 'lane' ? Math.max(0, tele - 300) : Math.round(tele * 0.7));
      ev.glyphPos = true;
      if (s.k === 'lane') { ev.gx = s.x + Math.cos(s.a) * 150; ev.gy = s.y + Math.sin(s.a) * 150; if (ev.link === 7) { ev.gx = null; } }
      else if (s.k === 'cones') { ev.gx = s.x + Math.cos(s.angs[0]) * 200; ev.gy = s.y + Math.sin(s.angs[0]) * 200; }
      else if (s.k === 'hex') { ev.gx = s.x + Math.cos(s.gaps[0]) * s.apo / 0.8660254 * 0.97; ev.gy = s.y + Math.sin(s.gaps[0]) * s.apo / 0.8660254 * 0.97; }
      else if (s.k === 'donut') { ev.gx = s.x; ev.gy = s.y - 225; }
      ev.onGo = function (v) { chainHit(e, v); };
      ch.ghosts.push(ev);
      if (s.id === '6') ch.sol = ev;
      ch.end = Math.max(ch.end, s.atRel);
    });
    spec.waves.forEach(function (w) { ch.waves.push({ id: w.id, link: w.link, launchRel: w.atRel, dir: w.dir, gap: w.gap, tele: w.tele, done: false, x0: w.dir > 0 ? G.WALL - 60 : G.AW - G.WALL + 60 }); ch.end = Math.max(ch.end, w.atRel + 1500); });
    ch.end += ch.final ? 800 : ch.sol ? 4200 : 900;
    ch.keys = spec.items.length;
    sfx('chain_announce', { vol: 0.9 });
    try { Assets.music.setChain(0); } catch (x) { /* audio */ }
    return ch;
  }
  Z.launchChain = launch;
  function chainHit(e, v) {
    var ch = A().ch; if (!ch) return;
    sfx(v.link === 6 ? 'sol_pulse' : 'chain_hit', { vol: 0.8 }); fx.shake(v.link === 6 ? 9 : 4, v.link === 6 ? 300 : 120);
    if (v.link >= 1 && v.link <= 6 && v.link > ch.n) { ch.n = v.link; try { Assets.music.setChain(ch.n); } catch (x) { /* audio */ } }
    if (v.link === 1 || v.link === 7) Z.breakPillarsLane(v);
    if (v.link === 2) { fx.shockwave(v.x, v.y, 200); expose(S.e, 1.25, 900, 'window'); }
    if (v.link === 6) {
      fx.shockwave(v.x, v.y, 700); fx.ring(v.x, v.y, 40, 330, 600, '#fff2b0', 8); fx.ring(v.x, v.y, 20, 250, 500, '#ff6a1a', 5);
      ch.solDone = true;
      if (!ch.final) {
        var a = A(); a.coreT = 4000; expose(S.e, 1.5, 4000, 'window'); if (D.sigHeart) { var pl = PL(); for (var hi = 0; hi < 2; hi++) G.Combat.dropGem(pl.x + (hi ? 40 : -40), pl.y + 30, 'heart', G.B.player.heal); }   // ventana del Sol: 2 corazones (palanca de calibración) Z.win(); G.Hud.banner('¡CENIZAR AGOTADO!', 1500, '#fff2b0'); sfx('stg_cenizar_window'.replace('stg_', 'relic_glow'), { vol: 0.8 });
      }
    }
  }
  Z.tickChain = function (e, dt) {
    var a = A(), ch = a.ch; if (!ch) return;
    var t0 = ch.t; ch.t += dt;
    if (ch.t >= 0 && t0 < 0) { snd(); }
    ch.waves.forEach(function (w) {
      if (!w.done && ch.t >= w.launchRel) { w.done = true; Z.addBand({ x: w.x0, dir: w.dir, gap: w.gap, dmg: 14, col: '#bfeaff', src: 'boss_ventisca2', glyph: null }); }
    });
    // la ventana del Sol termina al agotarse; la cadena termina cuando pasa su último instante
    if (!e.dying && ch.t >= ch.end) { A().ch = null; try { Assets.music.setChain(0); } catch (x) { /* audio */ } }
  };
  function snd() { Z.snd('stg_cenizar_chain'); }

  ATK.c_chain = {
    start: function (e, A0) { A0.tele = ANN; A0.pose = 'chain'; A0.actMs = 99999; A0.rec = 700; A0.drawAct = true; faceTo(e, angTo(e, PL())); launch(e, false); G.Hud.banner('ROSARIO DEL INCENDIO', 1500, '#fff2b0'); },
    tele: function () { },
    go: function (e, A0) { fx.shake(5, 160); },
    act: function (e, A0) { return !A().ch; },
    draw: function () { },
    haz: function () { }
  };
  // ---- Cadena Final (desesperado, < 6 % de vida)
  H.onDespair = function (e) {
    var a = A(), p = PL();
    a.evs.length = 0; a.bands.length = 0; a.des = { t: 0, fx: e.x, fy: e.y };
    var ch = launch(e, true); ch.final = true;
    expose(e, 1.25, 15500, 'despair');
    try { Assets.music.setPhase(7); Assets.music.setDespair(true); } catch (x) { /* audio */ }
    sfx('cenizar_roar', { vol: 1 });
    G.Hud.banner('¡LA CADENA FINAL!', 2400, '#fff2b0');
  };
  H.updDespair = function (e, dt) {
    var a = A(), ds = a.des; if (!ds) { e.mode = 'fight'; return; }
    e.despT += dt; e.moveAmt = 0; ds.t += dt;
    var u = ease(ds.t / 1000); e.x = ds.fx + (720 - ds.fx) * u; e.y = ds.fy + (330 - ds.fy) * u; e.roar = ds.t < 1400 ? 1 : 0;
    if (!a.ch && ds.t > 800) {
      e.mode = 'fight'; e.cadT = 1500; e.roar = 0; a.des = null; a.bands.length = 0;
      e.exps = e.exps.filter(function (x) { return x.kind !== 'despair'; });
      try { Assets.music.setDespair(false); Assets.music.setChain(0); } catch (x) { /* audio */ }
      G.Hud.banner('La cadena se rompe...', 1300, '#fff2b0');
    }
  };
  // F7: el boss se queda quieto durante todo el Rosario; la geometría se calculó con su posición actual (gnd) y no se mueve

  // ---- dibujo: glifos sobre el jefe (los eslabones que existen), vista de bandas fantasma
  Z.drawOverBoss = function (c, e) {
    var a = A(), ch = a.ch; if (!ch || (typeof Assets.drawBoss === 'function' && Assets.bossIds().indexOf('cenizar') >= 0 && G.hasSpr('boss_cenizar_torso'))) return;   // con arte, el propio drawBoss pinta los glifos (state.chain)
    var y = e.y - 200, x0 = e.x - (ch.links.length - 1) * 17, ph = G.clamp((ch.t + ANN) / ANN, 0, 1);
    c.save();
    ch.links.forEach(function (l, i) {
      var gx = x0 + i * 34, done = ch.n >= l, cur = !done && (ch.t > -ANN);
      c.globalAlpha = Math.min(1, ph * 3 - i * 0.3 + 0.2);
      if (G.hasSpr('fx_cenizar_glyph')) { try { var sp = Assets.sprite('fx_cenizar_glyph', (l - 1) * 2 + (done ? 1 : 0)); c.drawImage(sp, Math.round(gx - 16), Math.round(y - 16)); c.restore(); c.save(); return; } catch (x) { /* arte opcional */ } }
      c.fillStyle = done ? 'rgba(80,70,90,0.9)' : 'rgba(14,6,20,0.85)'; c.beginPath(); c.arc(gx, y, 14, 0, TAU); c.fill();
      c.strokeStyle = done ? '#6a6078' : '#fff2b0'; c.lineWidth = 2.5; c.stroke();
      G.txt(c, String(l), gx, y + 1, 16, done ? '#8a8294' : '#ffffff', 'center');
    });
    if (ch.final) G.txt(c, 'CADENA FINAL', e.x, y - 26, 13, '#fff2b0', 'center');
    else G.txt(c, LNAME[Math.min(6, Math.max(1, ch.n + 1))].toUpperCase(), e.x, y - 26, 11, '#d8cfe8', 'center');
    c.restore();
  };
  Z.drawGroundChain = function (c, e) {
    var a = A(), ch = a.ch; if (!ch) return;
    ch.waves.forEach(function (w) {
      if (w.done || ch.t > w.launchRel) return;
      var pr = G.clamp((ch.t - (w.launchRel - w.tele)) / w.tele, 0, 1), ghostOnly = ch.t < w.launchRel - w.tele;
      Z.drawBand(c, { x: w.x0 + w.dir * 0, dir: w.dir, gap: w.gap, w: 120, gapH: 140, glyph: 4 }, ghostOnly ? 0.15 : pr, true);
    });
  };
  Z.hazChain = function (e, out) {
    var ch = A().ch; if (!ch) return;
    ch.waves.forEach(function (w) { if (!w.done) out.push({ ref: w, k: 'band', x: w.x0, dir: w.dir, v: 260, w: 120, gaps: [w.gap], t0: Math.max(0, w.launchRel - ch.t), t1: Math.max(0, w.launchRel - ch.t) + (G.AW + 160) / 260 * 1000 }); });
  };
  Z.hudChain = function (c, e, bx, by, bw) { var ch = A().ch; if (ch && ch.t > -ANN) G.txt(c, (ch.final ? 'CADENA FINAL' : 'ROSARIO') + '  ' + Math.max(0, ch.n) + '/' + ch.links.length, bx + bw / 2, by + 52, 11, '#fff2b0', 'center'); };

  // ---- pruebas / calibración
  S.chainInfo = function () { var ch = A().ch; return ch ? { t: ch.t, n: ch.n, links: ch.links, valid: ch.spec.valid, tries: ch.spec.tries, events: ch.keys, end: ch.end, final: ch.final } : null; };
  S.chainReachable = function (n, o) {   // % de cadenas sin ruta libre de daño desde N posiciones de partida aleatorias del jugador (DESIGN 8.3 regla 2)
    var e = S.e, p = PL(), ok = 0, first = 0, tries = 0, i; n = n || 200; o = o || {};
    if (!e) return null;
    for (i = 0; i < n; i++) {
      var P0 = o.opt ? { x: e.x, y: e.y + 200 } : { x: G.rnd(G.WALL + 30, G.AW - G.WALL - 30), y: G.rnd(G.WALL + 30, G.AH - G.WALL - 30) };
      var spec = Z.genChain(e, !!o.final, P0, o.tries || 8); if (spec.valid) ok++; if (spec.valid && spec.tries === 1) first++; tries += spec.tries;
    }
    return { n: n, ok: ok / n, firstTry: first / n, meanTries: tries / n };
  };
})();
