/* aldea.js - Rescoldo: la aldea caminable que sustituye a la Base como pantalla principal (G.state === 'aldea').
   Mapa fijo 960x540 (el canvas ya escala a cualquier pantalla), Marlo se mueve con WASD/flechas o joystick táctil, interacción E/Enter o botón
   HABLAR (96 px) a menos de 56 px, viaje rápido al Portal (Tab / botón), colisiones con rectángulos y límites. NPCs con burbujas (dialog.js) y paneles
   (panels.js: Vesper, Rufo, Portal, Ulalume/colección, menú; tree.js: la forja de Grum). Arte: Assets.drawVillage / VILLAGE (assets_village.js) con
   fallback de rectángulos si no existe. Datos de posición de VILLAGE si están; si no, FALLBACK. */
(function () {
  'use strict';
  var G = window.G, A = G.Aldea = {}, U = G.UI, inp = G.input, D = G.Dialog;
  var SPEED = 170, RANGE = 56, FEET = 7;

  var FALLBACK = {
    walk: { x: 20, y: 290, w: 920, h: 200 },
    spots: { marloStart: { x: 480, y: 432 }, portalReturn: { x: 862, y: 372 }, bonfire: { x: 480, y: 390 }, portal: { x: 900, y: 340 } },
    npcs: { grum: { name: 'Grum', x: 130, y: 330, color: '#a0522d' }, vesper: { name: 'Vesper', x: 300, y: 330, color: '#ff8a3c' },
      rufo: { name: 'Rufo', x: 650, y: 424, color: '#7a7f8a' }, ulalume: { name: 'Ulalume', x: 780, y: 330, color: '#8a5ac0' },
      lanudo: { name: 'Abuelo Lanudo', x: 430, y: 400, color: '#e8dcb0' }, castana: { name: 'Tía Castaña', x: 560, y: 312, color: '#e89aa8' } },
    colliders: [{ x: 462, y: 376, w: 36, h: 26 }, { x: 596, y: 384, w: 108, h: 30 }]
  };
  var Lay = null, M = { x: 480, y: 432, dir: 1, t: 0, moving: false };
  var mode = 'walk', panel = null, fade = null, toast = '', toastT = 0, forgedVisit = false, time = 0;
  A.timeMode = 'dia';
  var NPC_ORDER = ['grum', 'vesper', 'rufo', 'ulalume', 'lanudo', 'castana'];
  var COL = { grum: '#c0602a', vesper: '#e8741c', rufo: '#6a7080', ulalume: '#8a5ac0', lanudo: '#b8a878', castana: '#d0708a' };

  function layout() {
    var V = window.Assets && Assets.VILLAGE;
    Lay = V && V.npcs && V.spots ? { walk: V.walk || FALLBACK.walk, spots: V.spots, npcs: V.npcs, colliders: V.colliders || [] } : FALLBACK;
    A.layout = Lay;
  }
  function npcPos(id) { var n = Lay.npcs[id] || FALLBACK.npcs[id]; return { x: n.x, y: n.y }; }
  function npcName(id) { var n = Lay.npcs[id] || FALLBACK.npcs[id]; return n.name || FALLBACK.npcs[id].name; }

  // Lista de interactuables (pies). El portal es un objeto sin NPC.
  function ints() {
    var out = NPC_ORDER.map(function (id) { var p = npcPos(id); return { id: id, x: p.x, y: p.y, name: npcName(id), npc: true }; });
    var sp = Lay.spots.portal; out.push({ id: 'portal', x: sp.x, y: sp.y, name: 'Portal', npc: false });
    return out;
  }
  function target() {
    var best = null, bd = RANGE, L = ints();
    for (var i = 0; i < L.length; i++) { var d = Math.hypot(L[i].x - M.x, L[i].y - M.y); if (d < bd) { bd = d; best = L[i]; } }
    return best;
  }

  // ------------------------------------------------------------- Apertura
  A.open = function (fromRun) {
    layout();
    G.state = 'aldea'; mode = 'walk'; panel = null; fade = null; D.close(); G.Panels.closeAll();
    G.Tree.sync(); G.Save.save();
    var st = fromRun ? Lay.spots.portalReturn : (M.booted ? { x: M.x, y: M.y } : Lay.spots.marloStart);
    M.x = st.x; M.y = st.y; M.booted = true; M.moving = false;
    if (fromRun) { A.timeMode = G.won ? 'dia' : 'ocaso'; flash(G.won ? 'Rescoldo celebra tu regreso.' : 'Rescoldo te espera junto al fuego.'); }
    applySettings();
  };
  function applySettings() {
    var s = G.Save.data.settings; if (!s) return;
    try { Assets.setVolume({ master: s.master, sfx: s.sfx, music: s.music }); } catch (e) { /* audio */ }
  }
  A.applySettings = applySettings;
  function flash(t) { toast = t; toastT = 3200; }
  A.flash = flash;
  A.onForged = function () { forgedVisit = true; };
  A.setPanel = function (p) { panel = p; mode = p ? 'panel' : 'walk'; };

  function toPortal() {
    if (fade || mode !== 'walk') return;
    fade = { t: 0, dur: 300, done: false, fn: function () { var sp = Lay.spots.portalReturn; M.x = sp.x; M.y = sp.y; panel = null; } };
    G.sfx('whoosh', { vol: 0.4 });
  }

  // ------------------------------------------------------------- NPCs: diálogos
  var CHAT = {
    grum: ['Cada martillazo es una promesa.', 'El hierro recuerda lo que le enseñas.', 'Una buena hoja se gana, no se compra.'],
    vesper: ['Apuesto por ti, cordero. No me hagas perder.', 'Los bichos más molestos pagan mejor.', 'Si algo te persigue, es que vale la pena.'],
    rufo: ['Para ti, hoy, precio de amigo. Siempre es hoy.', 'Todo se vende, hasta lo que no sabías que tenías.', 'Hebra por aquí, plumas por allá... negocio redondo.'],
    ulalume: ['Fuego y Hielo... qué vapor tan dramático.', 'Tus cartas susurran. Algunas mienten.', 'Cinco cartas, un destino. Más o menos.'],
    lanudo: ['El Pastor era el mejor de nosotros...', 'Si te rodean, no corras en línea recta.', 'Dos fuegos y un hielo hacen vapor, decía mi abuela.'],
    castana: ['Mi sopa estará lista en la próxima versión, cielo.', '¿Has comido algo? Se te ve flaco, corderito.']
  };
  function who(it, color) { return { name: it.name, x: it.x, y: it.y - 96, color: color || COL[it.id] || '#a0481c', pitch: it.id === 'grum' ? -0.6 : it.id === 'ulalume' ? 0.6 : 0 }; }
  function flag(k) { var f = G.Save.data.flags; var v = !!f[k]; f[k] = (f[k] || 0) + 1; return v; }
  function rot(k, arr) { var f = G.Save.data.flags, n = f[k] || 0; f[k] = n + 1; return arr[n % arr.length]; }
  function chat(it) { D.say(who(it), [rot('chat_' + it.id, CHAT[it.id])]); }

  function talk(it) {
    var S = G.Save.data, w = who(it), Q = G.Quests, L = G.Loot;
    if (it.id === 'portal') { panel = 'portal'; mode = 'panel'; G.Panels.open('portal'); G.sfx('whoosh', { vol: 0.5 }); return; }
    if (it.id === 'lanudo') { D.say(w, [rot('chat_lanudo', CHAT.lanudo)]); return; }
    if (it.id === 'castana') { chat(it); return; }
    var bye = { label: 'Adiós', fn: function () { /* cierra */ } }, ch = { label: 'Charlar', fn: function () { chat(it); } };
    if (it.id === 'grum') {
      var first = !flag('grum'), noPF = G.Tree.pfFree() <= 0 && G.Tree.availableCount() === 0;
      var line = first ? 'El hierro recuerda. Elige bien qué camino le enseñas.' : noPF ? 'Sin chispa de forja no hay trabajo. Cumple encargos.' : 'Trae partes. Yo hago el resto.';
      D.say(w, [line], [{ label: 'Forjar', fn: function () { forgedVisit = false; openPanel('forge'); } }, ch, bye]);
    } else if (it.id === 'vesper') {
      var firstV = !flag('vesper'), act = Q.active(), lines, choices;
      if (Q.isReady()) {
        D.say(w, ['Lo conseguiste. Pásame ese encargo.'], [{ label: 'Entregar', fn: function () {
          var r = Q.claim(); if (!r) return;
          G.sfx('card_select', { vol: 0.7 }); D.say(w, ['Cobrado. Toma lo tuyo.', r.text + '.']);
        } }, { label: 'Tablón', fn: function () { openPanel('vesper'); } }, bye]);
        return;
      }
      if (act) lines = ['Aún te faltan ' + (act.goal - Q.progress(act.id)) + '. No los dejes escapar.'];
      else lines = firstV ? ['Hay bichos que molestan. Elige uno.', 'Empieza por las Bombas: huelen a chamusquina.'] : ['Hay bichos que molestan. Elige uno.'];
      D.say(w, lines, [{ label: 'Encargos', fn: function () { openPanel('vesper'); } }, ch, bye]);
    } else if (it.id === 'rufo') {
      var left = L.TRADE.cupo - (S.shop.trade || 0), line2 = left <= 0 ? 'Hoy no me caben más trastos. Vuelve tras otra salida.' : (S.brasas < 6 && totalParts() === 0) ? 'El cariño no paga, cordero.' : '¿Cambiamos? Tres por una, sin preguntas.';
      D.say(w, [line2], [{ label: 'Comerciar', fn: function () { openPanel('rufo'); } }, ch, bye]);
    } else if (it.id === 'ulalume') {
      D.say(w, ['Tus cartas susurran. ¿Las ordenamos?'], [{ label: 'Cartas', fn: function () { openPanel('archive'); } }, ch, bye]);
    }
  }
  function totalParts() { var n = 0, p = G.Save.data.parts; for (var k in p) n += p[k]; return n; }
  function openPanel(name) { mode = 'panel'; panel = name; G.Panels.open(name); G.sfx('flip', { vol: 0.5 }); }
  A.openPanel = openPanel;

  // ------------------------------------------------------------- Movimiento y colisión
  function blocked(x, y) {
    var w = Lay.walk;
    if (x < w.x + 10 || x > w.x + w.w - 10 || y < w.y || y > w.y + w.h) return true;
    var i, c, cols = Lay.colliders;
    for (i = 0; i < cols.length; i++) {
      c = cols[i];
      if (x > c.x - FEET && x < c.x + c.w + FEET && y > c.y - 2 && y < c.y + c.h + 2) return true;
    }
    var L = ints();
    for (i = 0; i < L.length; i++) if (L[i].npc && Math.abs(x - L[i].x) < 15 && Math.abs(y - L[i].y) < 9) return true;
    return false;
  }
  function move(dt) {
    var ix = (inp.held('KeyD', 'ArrowRight') ? 1 : 0) - (inp.held('KeyA', 'ArrowLeft') ? 1 : 0);
    var iy = (inp.held('KeyS', 'ArrowDown') ? 1 : 0) - (inp.held('KeyW', 'ArrowUp') ? 1 : 0);
    if (inp.joy && inp.joy.active) { ix += inp.joy.x; iy += inp.joy.y; }
    var l = Math.hypot(ix, iy); if (l > 1) { ix /= l; iy /= l; }
    M.moving = l > 0.12;
    if (!M.moving) return;
    if (ix) M.dir = ix > 0 ? 1 : -1;
    var s = SPEED * dt / 1000, nx = M.x + ix * s, ny = M.y + iy * s;
    if (!blocked(nx, M.y)) M.x = nx;
    if (!blocked(M.x, ny)) M.y = ny;
    M.t += dt;
  }

  // ------------------------------------------------------------- Botones de pantalla
  var R_TALK = { x: 850, y: 430, w: 96, h: 96 }, R_PORTAL = { x: 12, y: 486, w: 76, h: 44 }, R_MENU = { x: 906, y: 6, w: 48, h: 44 };

  A.update = function (dt) {
    time += dt;
    if (toastT > 0) toastT -= dt;
    var m = inp.mouse, click = inp.hit('Mouse0');
    if (fade) {
      fade.t += dt;
      if (!fade.done && fade.t >= fade.dur / 2) { fade.done = true; fade.fn(); }
      if (fade.t >= fade.dur) fade = null;
      return;
    }
    if (D.active()) { D.update(dt); return; }
    if (mode === 'panel') {
      if (G.Panels.update(dt)) { closePanel(); }
      return;
    }
    // modo caminar
    move(dt);
    var tg = target();
    if (inp.hit('Tab')) toPortal();
    else if (inp.hit('Escape') || (click && U.inR(R_MENU, m))) openPanel('menu');
    else if (click && U.inR(R_PORTAL, m)) toPortal();
    else if ((inp.hit('KeyE', 'Enter') && tg) || (click && tg && U.inR(R_TALK, m))) { M.moving = false; talk(tg); }
  };
  function closePanel() {
    var was = panel; panel = null; mode = 'walk'; G.Panels.closeAll();
    if (was === 'forge' && forgedVisit) { forgedVisit = false; var it = ints()[0]; D.say(who(it), ['Eso aguantará.']); }
  }

  // ------------------------------------------------------------- Dibujo
  function anim(name, an, t) { try { return Assets.animFrame(name, an, t); } catch (e) { return null; } }
  function drawMarlo(c) {
    var t = M.t, cv;
    try { cv = Assets.sprite('player', M.moving ? 'walk:' + Math.floor(t / 80) : 'idle:' + Math.floor(time / 166)); } catch (e) { cv = null; }
    var bob = M.moving ? Math.abs(Math.sin(t / 90)) * -3 : 0, K = 1.3;   // Marlo se dibuja a x1,3 para que case con los NPC (80x84)
    try { var sh = Assets.sprite('shadow', 0); c.save(); c.globalAlpha = 0.6; c.drawImage(sh, Math.round(M.x - sh.width * K / 2), Math.round(M.y - sh.height * K / 2), sh.width * K, sh.height * K); c.restore(); } catch (e) { /* sin sombra */ }
    c.save(); c.translate(Math.round(M.x), Math.round(M.y - 14 * K + bob));
    c.scale(M.dir < 0 ? -K : K, K);
    if (cv) c.drawImage(cv, -cv.width / 2, -cv.height / 2);
    else { c.fillStyle = '#e8dcc0'; c.beginPath(); c.arc(0, 0, 12, 0, 6.283); c.fill(); }
    c.restore();
  }

  function drawFallback(c, now) {
    var g = c.createLinearGradient(0, 0, 0, 290); g.addColorStop(0, A.timeMode === 'ocaso' ? '#6a3a5a' : '#6aa8d8'); g.addColorStop(1, A.timeMode === 'ocaso' ? '#e89a5a' : '#bfe3f0');
    c.fillStyle = g; c.fillRect(0, 0, G.W, 290);
    c.fillStyle = '#2f5a30'; c.fillRect(0, 280, G.W, G.H - 280);
    c.fillStyle = '#8a6a3a'; c.fillRect(0, 350, G.W, 70);
    var B = [['HERRERÍA', 130, '#7a4a3a'], ['TABLÓN', 300, '#6a5a3a'], ['CARPA', 560, '#9a4a6a'], ['ARCHIVO', 780, '#5a4a8a'], ['PORTAL', 900, '#4a5a6a']];
    B.forEach(function (b) { c.fillStyle = b[2]; c.fillRect(b[1] - 50, 180, 100, 112); c.fillStyle = '#2a1d1a'; c.fillRect(b[1] - 12, 250, 24, 42); G.txt(c, b[0], b[1], 196, 12, '#fff', 'center'); });
    c.fillStyle = '#ff8a2a'; c.beginPath(); c.arc(480, 388, 12 + Math.sin(now / 90) * 2, 0, 6.283); c.fill();
    c.fillStyle = '#7a5a30'; c.fillRect(600, 384, 100, 28); G.txt(c, 'CARRO', 650, 398, 10, '#fff', 'center');
    NPC_ORDER.forEach(function (id) { var p = npcPos(id); c.fillStyle = COL[id]; c.beginPath(); c.ellipse(p.x, p.y - 22, 16, 24, 0, 0, 6.283); c.fill(); c.strokeStyle = '#120c1a'; c.lineWidth = 3; c.stroke(); });
  }

  function npcOverrides(tg) {
    var o = {}, dlg = D.active();
    NPC_ORDER.forEach(function (id) {
      var p = npcPos(id), d = Math.hypot(p.x - M.x, p.y - M.y), ov = null;
      if (d < 120) { ov = { flip: M.x < p.x }; if (id === 'lanudo') ov.flip = M.x < p.x; }
      if (dlg && tg && tg.id === id) { ov = ov || {}; ov.anim = 'talk'; }
      if (ov) o[id] = ov;
    });
    return o;
  }

  A.draw = function (c) {
    var now = Date.now(), tg = (mode === 'walk' && !D.active()) ? target() : null, talkTg = D.active() ? A.lastTarget : null;
    if (tg) A.lastTarget = tg;
    var actors = [{ y: M.y, draw: drawMarlo }];
    var haveArt = window.Assets && Assets.drawVillage;
    c.imageSmoothingEnabled = false;
    if (haveArt) {
      try { Assets.drawVillage(c, now, { time: A.timeMode, actors: actors, npcs: npcOverrides(talkTg || tg) }); }
      catch (e) { haveArt = false; }
    }
    if (!haveArt) { drawFallback(c, now); drawMarlo(c); }
    drawMarks(c, now, tg);
    if (mode !== 'panel') drawTopHud(c);
    if (mode === 'walk' || D.active()) drawButtons(c, tg);
    D.draw(c);
    if (mode === 'panel') G.Panels.draw(c);
    if (toastT > 0 && toast) { c.save(); c.globalAlpha = Math.min(1, toastT / 400); G.txt(c, toast, G.W / 2, 74, 14, '#ffe9a0', 'center'); c.restore(); }
    if (fade) { var u = fade.t / fade.dur, a = u < 0.5 ? u * 2 : (1 - u) * 2; c.fillStyle = 'rgba(7,5,12,' + Math.min(1, a) + ')'; c.fillRect(0, 0, G.W, G.H); }
  };

  function drawMarks(c, now, tg) {
    var Q = G.Quests, T = G.Tree;
    NPC_ORDER.concat(['portal']).forEach(function (id) {
      var kind = null;
      if (id === 'grum') { if (T.availableCount() > 0 || Object.keys(G.Loot.affordable()).length) kind = 'green'; }
      else if (id === 'vesper') { var mk = Q.mark(); kind = mk === 'ready' ? 'green' : mk === 'new' ? 'gold' : null; }
      if (!kind || D.active() || mode === 'panel' || (tg && tg.id === id)) return;
      var p = npcPos(id), cv = anim(kind === 'green' ? 'ui_mark_green' : 'ui_mark_gold', 'shine', now), by = Math.sin(now / 300) * 3;
      if (cv) c.drawImage(cv, Math.round(p.x - cv.width / 2), Math.round(p.y - 112 + by));
      else { c.fillStyle = kind === 'green' ? '#7dff9a' : '#ffd24a'; c.beginPath(); c.arc(p.x, p.y - 100 + by, 11, 0, 6.283); c.fill(); G.txt(c, '!', p.x, p.y - 99 + by, 16, '#1a1024', 'center', 'rgba(0,0,0,0)'); }
    });
    if (tg && !D.active()) {
      var nm = tg.name; G.txt(c, nm, tg.x, tg.y - (tg.npc ? 96 : 140), 13, '#ffe9a0', 'center');
      var ky = anim('ui_key_e', 'pulse', now), kx = tg.x, kyy = tg.y - (tg.npc ? 124 : 164);
      if (ky) c.drawImage(ky, Math.round(kx - ky.width / 2), Math.round(kyy - ky.height / 2 + Math.sin(now / 200) * 2));
      else { var sc = 1 + 0.08 * Math.sin(now / 200); c.save(); c.translate(kx, kyy); c.scale(sc, sc); c.fillStyle = '#fff6df'; c.strokeStyle = '#2a1d3a'; c.lineWidth = 3; c.fillRect(-14, -14, 28, 28); c.strokeRect(-14, -14, 28, 28); c.restore(); G.txt(c, 'E', kx, kyy + 1, 16, '#2a1d3a', 'center', '#fff6df'); }
    }
  }

  function drawTopHud(c) {
    var S = G.Save.data, T = G.Tree, Q = G.Quests;
    c.fillStyle = 'rgba(10,6,18,0.62)'; c.fillRect(6, 6, 330, 44);
    U.part(c, 'brasa', 22, 20, 8); G.txt(c, 'Brasas ' + S.brasas, 36, 20, 13, '#ff9a3c', 'left');
    T.pfIcon(c, 158, 20, 8); G.txt(c, 'PF ' + T.pfFree(), 172, 20, 13, T.pfFree() ? '#ffd24a' : '#9a8fb0', 'left');
    G.txt(c, 'Salidas ' + S.runs, 238, 20, 11, '#9a8fb0', 'left');
    var q = Q.statusLine();
    G.txt(c, q ? 'Encargo: ' + q : 'Sin encargo (habla con Vesper)', 14, 39, 10, q && Q.isReady() ? '#9dffb4' : '#d8cfe8', 'left');
    var h = U.inR(R_MENU, inp.mouse);
    c.fillStyle = h ? '#4a3a66' : 'rgba(10,6,18,0.72)'; c.fillRect(R_MENU.x, R_MENU.y, R_MENU.w, R_MENU.h); c.strokeStyle = '#8a7aa6'; c.lineWidth = 3; c.strokeRect(R_MENU.x + 1.5, R_MENU.y + 1.5, R_MENU.w - 3, R_MENU.h - 3);
    c.fillStyle = '#fff'; for (var i = 0; i < 3; i++) c.fillRect(R_MENU.x + 12, R_MENU.y + 11 + i * 8, 24, 4);
  }

  function drawButtons(c, tg) {
    U.button(c, R_PORTAL, 'PORTAL', { size: 12, color: '#2a6aa8', hot: '#3a8ad0', border: '#bfeaff', sub: 'Tab' });
    if (tg && !D.active()) U.button(c, R_TALK, tg.id === 'portal' ? 'PORTAL' : 'HABLAR', { size: 17, sub: '[E]' });
  }

  // Zona del joystick táctil: mitad izquierda, solo en modo caminar sin diálogo
  A.joyOK = function () { return G.state === 'aldea' && mode === 'walk' && !D.active() && !fade; };
  A.pos = M;
  A.state = function () { return { mode: mode, panel: (G.Panels.current() || panel), dialog: D.active(), x: M.x, y: M.y, target: (target() || {}).id || null }; };
  // Depuración/bot: teletransporta a Marlo junto a un interactuable
  A.goto = function (id) { var L = ints().filter(function (i) { return i.id === id; })[0]; if (L) { M.x = L.x; M.y = L.y + 34; } };
  A.talk = function (id) { var L = ints().filter(function (i) { return i.id === id; })[0]; if (L) talk(L); };
})();
