/* panels.js - Paneles de la aldea (todo en canvas 960x540, botones >= 44 px): Tablón de Vesper (ofertas rotativas), Mercader Rufo (trueque / vender / comprar),
   Portal (mano al salir, anclas, duración, encargo, plato, SALIR), Archivo de Ulalume (colección con filtros por etiqueta, 3 loadouts, anclas con vista previa de combos),
   cocina de Tía Castaña (G.Cook: 1 plato por expedición), logros de Lanudo, Menú y Ajustes.
   La forja de Grum vive en tree.js (P.open('forge') la abre). Interfaz: P.open(nombre), P.update(dt) -> true si hay que cerrar, P.draw(c). */
(function () {
  'use strict';
  var G = window.G, P = G.Panels = {}, U = G.UI, inp = G.input, L = G.Loot;
  var cur = null, msg = '', msgT = 0, confirm = '', confirmT = 0;
  var R_CLOSE = { x: 896, y: 2, w: 60, h: 50 };
  var st = { rt: 0, give: 'wick', get: 'thread', qty: 1, buy: 'thread', csel: 0 };
  var LENS = [7, 9, 10];
  G.touchUI = ('ontouchstart' in window) && !!(window.matchMedia && window.matchMedia('(pointer: coarse)').matches);   // táctil: el renombrado de loadouts usa el teclado nativo

  function SV() { return G.Save.data; }
  function say(t) { msg = t; msgT = 3200; }
  function click() { return inp.hit('Mouse0'); }
  function onR(r) { return click() && U.inR(r, inp.mouse); }
  function common() { return L.PARTS.filter(function (p) { return !p.rare; }); }
  function bg(c, title) {
    c.fillStyle = 'rgba(8,4,14,0.96)'; c.fillRect(0, 0, G.W, G.H);
    G.txt(c, title, 14, 24, 24, '#ffd27a', 'left');
    U.button(c, R_CLOSE, 'X', { size: 20, color: '#7a2a3a', hot: '#c03a4a', border: '#ff8a8a' });
    if (msgT > 0 && msg) G.txt(c, msg, 480, 56, 13, '#ffe9a0', 'center');
  }
  function header(c, x) {
    var S = SV(); U.part(c, 'brasa', x, 24, 10); G.txt(c, 'Brasas ' + S.brasas, x + 16, 24, 16, '#ff9a3c', 'left');
  }

  P.open = function (name) {
    cur = name; msg = ''; msgT = 0; confirm = ''; st.csel = 0;
    if (name === 'forge') G.Tree.open();
    if (name === 'rufo') st.rt = 0;
    if (name === 'vesper') { G.Quests.seen(); st.vt = st.vt || 0; huntFix(); }
    if (name === 'logros') { st.lsel = 0; G.Ach.markSeen(); }
    if (name === 'archive') { st.edit = false; st.lo = st.lo || 0; }
  };
  P.closeAll = function () { cur = null; };
  P.vesperTab = function (n) { st.vt = n; huntFix(); };   // 0 = Tablón, 1 = Cacería (lo usa el diálogo de Vesper)
  P.current = function () { return cur; };

  P.update = function (dt) {
    if (msgT > 0) msgT -= dt; if (confirmT > 0) confirmT -= dt; else confirm = '';
    if (cur === 'forge') return G.Tree.update(dt);
    var esc = inp.hit('Escape'), cl = onR(R_CLOSE);
    if (cur === 'archive' && st.edit) { updEdit(); return false; }   // renombrar un loadout: Esc/Enter terminan la edición, no cierran el panel
    if (cur === 'menu') { if (esc) return true; }
    else if (cur === 'settings') { if (esc || cl) { cur = 'menu'; return false; } }
    else if (cur === 'archive' && G.Aldea.fromMenu) { if (esc || cl) { G.Aldea.fromMenu = false; cur = 'menu'; return false; } }
    else if (esc || cl) return true;
    if (cur === 'vesper') return updVesper();
    if (cur === 'rufo') return updRufo();
    if (cur === 'portal') return updPortal();
    if (cur === 'archive') return updArchive();
    if (cur === 'cook') return updCook();
    if (cur === 'logros') return updLogros();
    if (cur === 'menu') return updMenu();
    if (cur === 'settings') return updSettings();
    return true;
  };
  P.draw = function (c) {
    if (cur === 'forge') return G.Tree.draw(c);
    if (cur === 'vesper') drawVesper(c);
    else if (cur === 'rufo') drawRufo(c);
    else if (cur === 'portal') drawPortal(c);
    else if (cur === 'archive') drawArchive(c);
    else if (cur === 'cook') drawCook(c);
    else if (cur === 'logros') drawLogros(c);
    else if (cur === 'menu') drawMenu(c);
    else if (cur === 'settings') drawSettings(c);
  };

  // ============================================================= VESPER
  // Filas: el encargo activo (si ya rotó fuera del Tablón) + 3 ofertas rotativas (Quests.board). Teclas 1-4.
  function qRect(i) { return { x: 20, y: 64 + i * 108, w: 920, h: 100 }; }
  function qBtn(i) { var r = qRect(i); return { x: r.x + r.w - 196, y: r.y + 22, w: 178, h: 56 }; }
  var TIERC = { 1: '#7dff9a', 2: '#ffd24a', 3: '#ff7a5a' };
  function qAction(i) {
    var Q = G.Quests, d = Q.board()[i], act = Q.active(); if (!d) return;
    if (act && act.id === d.id) {
      if (Q.isReady()) {
        var r = Q.claim(); if (r) { say('Entregado: ' + r.text + '.'); G.sfx('card_select', { vol: 0.8 }); try { G.Snd.play('fuse'); } catch (e) { /* audio */ } }
      } else if (confirm === 'q' + i) { Q.abandon(); confirm = ''; say('Encargo abandonado (el progreso se pierde).'); }
      else { confirm = 'q' + i; confirmT = 3000; say('Pulsa otra vez para abandonar (pierdes el progreso).'); }
    } else if (act) say('Ya tienes un encargo activo. Entrégalo o abandónalo.');
    else { Q.accept(d.id); say(d.target ? 'Encargo aceptado: ' + d.label + ' aparece antes y más a menudo.' : 'Encargo aceptado: ' + d.name + '.'); G.sfx('card_select', { vol: 0.7 }); }
  }
  // ---- CACERÍA (J3, DESIGN 4.2): encargo de Vesper por jefe y Peligro desbloqueado; PRACTICAR = sin riesgo ni recompensas, con HP x0,5
  function huntAvail(id) { return (SV().bossKills[id] || 0) > 0; }
  P.huntAvailable = function () { return G.Save.BOSSES.some(huntAvail); };
  function huntFix() {
    var B = G.Save.BOSSES; st.hb = st.hb || 0; st.hph = st.hph || 1;
    if (!huntAvail(B[st.hb])) { var f = B.filter(huntAvail)[0]; st.hb = f ? B.indexOf(f) : 0; }
    st.hp = G.clamp(st.hp || 1, 1, G.Save.pelMax(B[st.hb]));
  }
  function tabRect(i) { return { x: 150 + i * 138, y: 2, w: 130, h: 48 }; }
  function hbRect(i) { return { x: 20 + i * 152, y: 56, w: 144, h: 52 }; }
  function hpRect(i) { return { x: 20 + i * 64, y: 116, w: 58, h: 38 }; }
  var R_HUNT = { x: 648, y: 168, w: 280, h: 62 }, R_PRAC = { x: 648, y: 396, w: 280, h: 56 };
  function phRect(i) { return { x: 648 + i * 94, y: 338, w: 90, h: 48 }; }
  function startHunt(practice) {
    var id = G.Save.BOSSES[st.hb]; if (!huntAvail(id)) return;
    G.launchReq = { mode: practice ? 'practice' : 'hunt', boss: id, peligro: practice ? 1 : st.hp, phase: practice ? st.hph : 0 };
    G.practiceHand = null; G.Base.launch();
  }
  function updHunt() {
    var B = G.Save.BOSSES, i;
    for (i = 0; i < 3; i++) if (onR(hbRect(i))) { if (huntAvail(B[i])) { st.hb = i; huntFix(); G.sfx('flip', { vol: 0.4 }); } else say('Aún no has derrotado a ' + G.Boss.DEFS[B[i]].name + ': véncelo en una expedición.'); }
    var id = B[st.hb];
    for (i = 0; i < 5; i++) if (onR(hpRect(i))) { if (i + 1 <= G.Save.pelMax(id)) { st.hp = i + 1; G.sfx('flip', { vol: 0.4 }); } else say('Peligro ' + G.Boss.ROMAN[i + 1] + ' bloqueado: véncelo antes en ' + G.Boss.ROMAN[i] + '.'); }
    for (i = 0; i < 3; i++) if (onR(phRect(i))) { st.hph = i + 1; G.sfx('flip', { vol: 0.4 }); }
    if (onR(R_HUNT) || inp.hit('KeyF')) startHunt(false);
    if (onR(R_PRAC) || inp.hit('KeyP')) startHunt(true);
    if (inp.hit('KeyQ')) { st.hp = Math.max(1, st.hp - 1); } if (inp.hit('KeyE')) { st.hp = Math.min(G.Save.pelMax(id), st.hp + 1); }
    return false;
  }
  var TAGC = { fire: '#ff7a2a', steel: '#b8c0cc', poison: '#7be34a', ice: '#6ac8ff', lightning: '#ffe45a', blood: '#d02048' };
  function drawHunt(c) {
    var B = G.Save.BOSSES, S = SV(), Q = G.Quests, i;
    G.txt(c, '"Hay una bestia que merece la pena. ¿Vamos?"', 720, 135, 12, '#ffd0a0', 'center');
    for (i = 0; i < 3; i++) {
      var D0 = G.Boss.DEFS[B[i]], av = huntAvail(B[i]);
      U.button(c, hbRect(i), av ? D0.name.replace(/^El |^La |, .*$/g, '').split(' ')[0].toUpperCase() : '? ' + D0.name.replace(/^El |^La |, .*$/g, '').split(' ')[0].toUpperCase(), { size: 15, off: !av, color: st.hb === i ? '#2a6aa8' : '#2c2438', hot: '#3a8ad0', border: st.hb === i ? '#bfeaff' : '#6a5a80', sub: av ? 'Peligro hasta ' + G.Boss.ROMAN[G.Save.pelMax(B[i])] : 'vence al jefe 1 vez' });
    }
    var id = B[st.hb], D = G.Boss.DEFS[id], av2 = huntAvail(id), PD = G.Boss.PELIGRO[st.hp], pmax = G.Save.pelMax(id);
    G.txt(c, 'PELIGRO  (Q/E)', 345, 135, 11, '#9a8fb0', 'left');
    for (i = 0; i < 5; i++) { var op = i + 1 <= pmax; U.button(c, hpRect(i), op ? G.Boss.ROMAN[i + 1] : '?', { size: 15, off: !op, color: st.hp === i + 1 ? '#a8801a' : '#2c2438', hot: '#d8a82a', border: st.hp === i + 1 ? '#ffffff' : '#6a5a80' }); }
    if (!av2) { G.txt(c, 'Derrota a este jefe en una expedición para desbloquear su cacería.', 20, 190, 14, '#ff9a8a', 'left'); return; }
    U.panel(c, 20, 162, 612, 336, { border: '#6a4a30' });
    G.txt(c, D.name.toUpperCase(), 36, 184, 20, '#ffd27a', 'left');
    G.txt(c, D.title + '   -   Peligro ' + G.Boss.ROMAN[st.hp] + ': HP x' + PD.hp.toFixed(2).replace('.', ',') + ' x0,75 (cacería), daño +' + Math.round((PD.dmg - 1) * 100) + ' %', 36, 206, 12, '#c8b8e8', 'left');
    G.txt(c, 'Duración ' + L.dur(SV().len).name + ' (' + SV().len + ' min, la del Portal): HP jefe x' + (G.Boss.durMul(SV().len) * L.dur(SV().len).bossHp).toFixed(2).replace('.', ',') + ', PF x' + String(L.dur(SV().len).pf).replace('.', ','), 36, 220, 11, '#9dffb4', 'left');
    G.txt(c, 'DEBILIDADES', 36, 236, 11, '#9a8fb0', 'left');
    var x = 36;
    D.weak.forEach(function (w) { var t = Q.TAGN[w.tag] || w.tag; G.txt(c, t + ' x' + w.mul, x, 250, 12, TAGC[w.tag] || '#9dffb4', 'left'); x += (t.length + 6) * 8.2 + 14; });
    D.resist.forEach(function (w) { var t = Q.TAGN[w.tag] || w.tag; G.txt(c, t + ' x' + w.mul, x, 250, 12, '#8a8a98', 'left'); x += (t.length + 6) * 8.2 + 14; });
    G.txt(c, 'PARTES ROMPIBLES  (cada una suelta su trofeo' + (PD.troph > 1 ? ' x2' : '') + ')', 36, 276, 11, '#9a8fb0', 'left');
    Object.keys(D.parts).forEach(function (k, j) {
      var pd = D.parts[k], tr = G.Boss.TROPHY[pd.trophy], y = 298 + j * 24;
      try { c.drawImage(Assets.sprite(G.hasSpr(tr.spr) ? tr.spr : 'trophy_pastor_horn', 0), 36, y - 10, 20, 20); } catch (e0) { /* sin icono */ }
      G.txt(c, pd.name + '  ->  ' + tr.name + '  (' + Math.round(pd.pct * 100) + ' % de la vida)', 64, y, 12, '#ffe9a0', 'left');
    });
    var bmin = Math.round(D.brasas * PD.brasas), bmax = Math.round((D.brasas + D.brasasPart * 3) * PD.brasas), pw = (S.pelWins[id] || {})[st.hp] || 0, hr = (S.hunts[id] || {})[st.hp] || { wins: 0, tries: 0, best: 0 }, pr = S.practice[id] || { tries: 0, wins: 0 };
    G.txt(c, 'RECOMPENSA', 36, 380, 11, '#9a8fb0', 'left');
    G.txt(c, bmin + '-' + bmax + ' Brasas, trofeos de las partes rotas, partes del jefe x' + PD.gmul.toFixed(2).replace('.', ','), 36, 398, 12, '#ffe9a0', 'left');
    G.txt(c, 'PF: ' + (pw > 0 ? 'ya cobrados en este Peligro (sin farmeo)' : '+' + Math.round((D.pf + PD.pfx) * L.dur(SV().len).pf) + ' la primera vez') + '   -   sin Esencia segura, sin hordas', 36, 416, 12, pw > 0 ? '#9a8fb0' : '#ffd24a', 'left');
    G.txt(c, 'Cacería en Peligro ' + G.Boss.ROMAN[st.hp] + ': ' + hr.wins + ' victorias / ' + hr.tries + ' intentos' + (hr.best ? '   mejor ' + G.fmtTime(hr.best * 1000) : ''), 36, 444, 12, '#9dffb4', 'left');
    G.txt(c, 'Práctica: ' + pr.wins + ' victorias / ' + pr.tries + ' intentos', 36, 462, 12, '#9dffb4', 'left');
    G.txt(c, 'Preparación: 6 ofertas de carta seguidas; luego entra la bestia.', 36, 484, 11, '#c8b8e8', 'left');
    U.panel(c, 640, 162, 296, 336, { border: '#4a3a66' });
    U.button(c, R_HUNT, 'CAZAR', { size: 26, sub: 'F  -  Peligro ' + G.Boss.ROMAN[st.hp], color: '#c4601c' });
    G.txt(c, 'Sin hordas: solo la bestia y sus adds,', 650, 252, 11, '#d8cfe8', 'left');
    G.txt(c, 'más 3 gusanos de limpieza cada 25 s.', 650, 267, 11, '#d8cfe8', 'left');
    G.txt(c, 'PRACTICAR  (sin riesgo, HP x0,5, sin Peligro)', 650, 318, 11, '#9dffb4', 'left');
    for (i = 0; i < 3; i++) U.button(c, phRect(i), 'FASE ' + G.Boss.ROMAN[i + 1], { size: 13, color: st.hph === i + 1 ? '#2a8a4a' : '#2c2438', hot: '#3aba66', border: '#9dffb4' });
    G.txt(c, 'Empieza en la fase elegida. Reinicio rápido con R.', 650, 396 - 6, 10, '#9a8fb0', 'left');
    U.button(c, R_PRAC, 'PRACTICAR', { size: 20, sub: 'P  -  fase ' + G.Boss.ROMAN[st.hph] + ', intento ' + (pr.tries + 1), color: '#2a8a4a', hot: '#3aba66', border: '#9dffb4' });
  }
  function updVesper() {
    for (var ti = 0; ti < 2; ti++) if (onR(tabRect(ti))) { st.vt = ti; huntFix(); G.sfx('flip', { vol: 0.4 }); }
    if (st.vt === 1) return updHunt();
    var n = G.Quests.board().length;
    for (var i = 0; i < n; i++) if (inp.hit('Digit' + (i + 1)) || onR(qBtn(i))) qAction(i);
    return false;
  }
  function drawVesper(c) {
    var Q = G.Quests, act = Q.active(), list = Q.board();
    bg(c, 'VESPER'); header(c, 560); G.Tree.pfIcon(c, 720, 24, 10); G.txt(c, 'PF ' + G.Tree.pfFree(), 738, 24, 16, '#ffd24a', 'left');
    ['TABLÓN', 'CACERÍA'].forEach(function (t, i) { U.button(c, tabRect(i), t, { size: 15, color: st.vt === i ? '#2a6aa8' : '#2c2438', hot: '#3a8ad0', border: st.vt === i ? '#bfeaff' : '#6a5a80', sub: i === 1 && !P.huntAvailable() ? 'vence a un jefe' : null }); });
    if (st.vt === 1) { drawHunt(c); G.txt(c, 'Esc: volver', 20, 522, 11, '#6f6480', 'left'); return; }
    list.forEach(function (d, i) {
      var r = qRect(i), b = qBtn(i), isA = act && act.id === d.id, ready = isA && Q.isReady(), prog = Q.progress(d.id), offered = Q.offers().indexOf(d) >= 0;
      U.panel(c, r.x, r.y, r.w, r.h, { border: ready ? '#7dff9a' : isA ? '#ffd24a' : '#4a3a66' });
      G.txt(c, '[' + (i + 1) + '] ' + d.name, r.x + 16, r.y + 20, 18, '#ffd27a', 'left');
      var tx = r.x + 24 + Math.min(430, d.name.length * 11.6 + 40);
      G.txt(c, Q.tierName(d.tier), tx, r.y + 20, 11, TIERC[d.tier], 'left');
      if (d.tutorial) G.txt(c, 'TUTORIAL', tx + 70, r.y + 20, 10, '#9dffb4', 'left');
      if (isA && !offered) G.txt(c, 'ACTIVO (ya rotó del Tablón)', tx + (d.tutorial ? 140 : 70), r.y + 20, 10, '#9a8fb0', 'left');
      G.txt(c, d.desc, r.x + 16, r.y + 44, 12, '#d8cfe8', 'left');
      G.txt(c, 'Recompensa: ' + Q.rewardText(d) + (Q.times(d.id) ? '   (hecho ' + Q.times(d.id) + 'x: partes y Brasas a la mitad)' : ''), r.x + 16, r.y + 64, 11, '#ffe9a0', 'left');
      var bw = 480; c.fillStyle = '#1a1226'; c.fillRect(r.x + 16, r.y + 80, bw, 9);
      c.fillStyle = ready ? '#7dff9a' : '#ff9a3c'; c.fillRect(r.x + 16, r.y + 80, bw * G.clamp(prog / d.goal, 0, 1), 9);
      G.txt(c, isA ? Q.progText(d) : 'no activo', r.x + bw + 28, r.y + 85, 11, '#d8cfe8', 'left');
      var label = ready ? 'ENTREGAR' : isA ? (confirm === 'q' + i ? 'SEGURO?' : 'ABANDONAR') : 'ACEPTAR';
      U.button(c, b, label, { size: 16, off: !isA && !!act, color: ready ? '#2a8a4a' : isA ? '#7a3a3a' : '#c4601c', hot: ready ? '#3aba66' : '#ff9a3c' });
    });
    G.txt(c, 'El Tablón cambia cada día y tras cada expedición. Un encargo a la vez; el progreso se conserva. El enemigo objetivo pesa x2,5 y entra antes (máx. 2:30).', 20, 504, 10, '#9a8fb0', 'left');
    G.txt(c, 'Esc: volver', 20, 522, 11, '#6f6480', 'left');
  }

  // ============================================================= RUFO
  var RT = ['TRUEQUE', 'VENDER', 'COMPRAR'];
  function rtTab(i) { return { x: 14 + i * 156, y: 50, w: 148, h: 44 }; }
  function tile(i, y) { return { x: 14 + i * 117, y: y, w: 110, h: 72 }; }
  function giveN(id) { return id === 'thread' ? L.TRADE.hebraRatio : L.TRADE.ratio; }
  function doTrade() {
    var S = SV(), n = giveN(st.give);
    if (st.give === st.get) { say('Elige partes distintas.'); return; }
    if ((S.shop.trade || 0) >= L.TRADE.cupo) { say('Hoy no me caben más trastos. Vuelve tras otra salida.'); G.sfx('discard', { vol: 0.5 }); return; }
    if ((S.parts[st.give] || 0) < n) { say('Te faltan partes (' + n + ').'); G.sfx('discard', { vol: 0.5 }); return; }
    S.parts[st.give] -= n; G.Save.add(st.get, 1); S.shop.trade++; G.Save.save();
    say('Trato hecho: ' + n + ' ' + L.part(st.give).short + ' por 1 ' + L.part(st.get).short + '.'); G.sfx('card_select', { vol: 0.7 });
  }
  function doSell(id) {
    var S = SV(), have = S.parts[id] || 0, n = st.qty === 0 ? have : Math.min(st.qty, have);
    if (n <= 0) { say('No tienes ' + L.part(id).short + '.'); return; }
    var price = id === 'thread' ? L.SELL_THREAD : L.SELL;
    S.parts[id] -= n; S.brasas += n * price; G.Save.save();
    say('Vendes ' + n + ' ' + L.part(id).short + ' por ' + n * price + ' Brasas.'); G.sfx('pickup', { vol: 0.6 });
  }
  function doBuy(what) {
    var S = SV();
    if (what === 'part') {
      if ((S.shop.part || 0) >= L.BUY.partCupo) { say('Cupo de partes agotado esta salida.'); return; }
      if (S.brasas < L.BUY.part) { say('El cariño no paga, cordero.'); return; }
      S.brasas -= L.BUY.part; G.Save.add(st.buy, 1); S.shop.part++; say('Compras 1 ' + L.part(st.buy).short + '.');
    } else {
      if (S.shop[what]) { say('Ya lo compraste esta salida.'); return; }
      if (S.brasas < L.BUY[what]) { say('El cariño no paga, cordero.'); return; }
      S.brasas -= L.BUY[what]; S.shop[what] = 1; S.pending[what] = 1;
      say(what === 'tonic' ? 'Tónico listo: +40 Ceniza en la próxima expedición.' : 'Imán listo: radio x1,5 en la próxima expedición.');
    }
    G.Save.save(); G.sfx('pickup', { vol: 0.6 });
  }
  var R_TRADE = { x: 250, y: 380, w: 460, h: 60 }, R_QTY = { x: 14, y: 400, w: 220, h: 48 };
  var R_ITEM = function (i) { return { x: 14, y: 112 + i * 74, w: 920, h: 68 }; };
  function itemBtn(i) { var r = R_ITEM(i); return { x: r.x + r.w - 190, y: r.y + 7, w: 176, h: 54 }; }
  function updRufo() {
    var i, cm = common(), m = inp.mouse;
    for (i = 0; i < 3; i++) if (onR(rtTab(i))) { st.rt = i; G.sfx('flip', { vol: 0.4 }); }
    if (inp.hit('KeyQ')) st.rt = (st.rt + 2) % 3;
    if (inp.hit('KeyE')) st.rt = (st.rt + 1) % 3;
    if (st.rt === 0) {
      for (i = 0; i < cm.length; i++) {
        if (onR(tile(i, 150))) { st.give = cm[i].id; G.sfx('flip', { vol: 0.4 }); }
        else if (onR(tile(i, 272))) { st.get = cm[i].id; G.sfx('flip', { vol: 0.4 }); }
      }
      if (onR(R_TRADE) || inp.hit('KeyF')) doTrade();
    } else if (st.rt === 1) {
      for (i = 0; i < cm.length; i++) if (onR(tile(i, 150))) doSell(cm[i].id);
      if (onR(R_QTY)) { st.qty = st.qty === 1 ? 5 : st.qty === 5 ? 0 : 1; G.sfx('flip', { vol: 0.4 }); }
    } else {
      for (i = 0; i < cm.length; i++) if (onR(tile(i, 352))) { st.buy = cm[i].id; G.sfx('flip', { vol: 0.4 }); }
      var kinds = ['tonic', 'magnet', 'part'];
      for (i = 0; i < 3; i++) if (onR(itemBtn(i))) doBuy(kinds[i]);
    }
    return false;
  }
  P.trade = function (give, get) { st.give = give; st.get = get; doTrade(); };   // API para pruebas / bot
  function partTile(c, p, r, sel, extra) {
    var n = SV().parts[p.id] || 0;
    c.fillStyle = sel ? '#3a2a5a' : '#1a1226'; c.fillRect(r.x, r.y, r.w, r.h);
    c.strokeStyle = sel ? '#ffe9a0' : '#4a3a66'; c.lineWidth = sel ? 4 : 2; c.strokeRect(r.x + 1, r.y + 1, r.w - 2, r.h - 2);
    U.part(c, p.id, r.x + 24, r.y + 28, 14);
    G.txt(c, p.short, r.x + 46, r.y + 20, 12, '#d8cfe8', 'left'); G.txt(c, 'x' + n, r.x + 46, r.y + 40, 17, n ? '#fff' : '#6a5f78', 'left');
    if (extra) G.txt(c, extra, r.x + r.w / 2, r.y + r.h - 9, 11, '#ffe9a0', 'center');
  }
  function drawRufo(c) {
    var S = SV(), cm = common(), i;
    bg(c, 'MERCADER  -  Rufo'); header(c, 560);
    for (i = 0; i < 3; i++) {
      var tb = rtTab(i), on = st.rt === i;
      c.fillStyle = on ? '#2a1d3a' : '#150f20'; c.fillRect(tb.x, tb.y, tb.w, tb.h); c.strokeStyle = on ? '#ffd27a' : '#3a2f48'; c.lineWidth = on ? 4 : 2; c.strokeRect(tb.x + 1, tb.y + 1, tb.w - 2, tb.h - 2);
      G.txt(c, RT[i], tb.x + tb.w / 2, tb.y + tb.h / 2, 15, on ? '#ffd27a' : '#8a7f96', 'center');
    }
    if (st.rt === 0) {
      var left = L.TRADE.cupo - (S.shop.trade || 0), n = giveN(st.give);
      G.txt(c, 'Cupo de trueques esta salida: ' + left + ' de ' + L.TRADE.cupo + '   (se reinicia al volver de una expedición)', 14, 124, 12, left ? '#9dffb4' : '#ff8a8a', 'left');
      G.txt(c, 'ENTREGAS  (3 por 1; la Hebra, 6 por 1)', 14, 140, 12, '#9a8fb0', 'left');
      cm.forEach(function (p, k) { partTile(c, p, tile(k, 150), p.id === st.give, p.id === 'thread' ? '6 por 1' : '3 por 1'); });
      G.txt(c, 'RECIBES 1 DE...', 14, 264, 12, '#9a8fb0', 'left');
      cm.forEach(function (p, k) { partTile(c, p, tile(k, 272), p.id === st.get, ''); });
      var ok = st.give !== st.get && left > 0 && (S.parts[st.give] || 0) >= n;
      U.button(c, R_TRADE, 'TRUEQUE: ' + n + ' ' + L.part(st.give).short + ' > 1 ' + L.part(st.get).short, { size: 17, off: !ok, color: '#2a8a4a', hot: '#3aba66', border: '#9dffb4', sub: '[F]  -  las raras no se truecan' });
    } else if (st.rt === 1) {
      G.txt(c, 'Toca una parte para venderla (' + L.SELL + ' Brasas; Hebra ' + L.SELL_THREAD + '). Las raras no se venden.', 14, 130, 12, '#9a8fb0', 'left');
      cm.forEach(function (p, k) { partTile(c, p, tile(k, 150), false, '+' + (p.id === 'thread' ? L.SELL_THREAD : L.SELL) + ' c/u'); });
      U.button(c, R_QTY, 'CANTIDAD: ' + (st.qty === 0 ? 'TODAS' : st.qty), { size: 15, color: '#2a6aa8', hot: '#3a8ad0', border: '#bfeaff' });
    } else {
      G.txt(c, 'Tienda: una vez por expedición cada artículo.', 14, 124, 12, '#9a8fb0', 'left');
      var items = [
        ['Tónico de ceniza', 'Empiezas la próxima expedición con +40 de Ceniza.', L.BUY.tonic, S.shop.tonic ? 'COMPRADO' : null],
        ['Imán de bolsillo', 'Radio del imán x1,5 en la próxima expedición.', L.BUY.magnet, S.shop.magnet ? 'COMPRADO' : null],
        ['Parte común (' + L.part(st.buy).short + ')', 'Elige la parte abajo. Cupo ' + (S.shop.part || 0) + '/' + L.BUY.partCupo + ' esta salida.', L.BUY.part, (S.shop.part || 0) >= L.BUY.partCupo ? 'AGOTADO' : null]];
      items.forEach(function (it, k) {
        var r = R_ITEM(k); U.panel(c, r.x, r.y, r.w, r.h);
        G.txt(c, it[0], r.x + 16, r.y + 22, 17, '#ffd27a', 'left'); G.txt(c, it[1], r.x + 16, r.y + 47, 12, '#d8cfe8', 'left');
        U.button(c, itemBtn(k), it[3] || 'COMPRAR', { size: 15, off: !!it[3] || S.brasas < it[2], sub: it[2] + ' Brasas' });
      });
      G.txt(c, 'PARTE A COMPRAR', 14, 338, 12, '#9a8fb0', 'left');
      cm.forEach(function (p, k) { partTile(c, p, tile(k, 352), p.id === st.buy, ''); });
    }
    G.txt(c, 'Q/E: pestaña  -  Esc: volver', 14, 526, 10, '#6f6480', 'left');
  }

  // ============================================================= PORTAL
  function handRect(i) { return { x: 20 + i * 84, y: 120, w: 72, h: 96 }; }
  function ancRect(i) { return { x: 20 + (i % 10) * 62, y: 262 + Math.floor(i / 10) * 80, w: 56, h: 74 }; }
  function lenRect(i) { return { x: 650 + i * 98, y: 94, w: 92, h: 52 }; }
  var R_GO = { x: 650, y: 482, w: 290, h: 52 };
  // Destino (bioma): decide el jefe. Cripta se abre al vencer al Pastor; Asfodelo al vencer al jefe de la Cripta (J2, aún sin jefe propio)
  var BIOMES = [{ id: 'bosque', name: 'BOSQUE', boss: 'El Pastor Corrupto', bid: 'pastor' }, { id: 'cripta', name: 'CRIPTA', boss: 'Karceron el Carcelero', need: 'pastor', needName: 'el Pastor', bid: 'karceron' },
    { id: 'asfodelo', name: 'ASFODELO', boss: 'Letea la Hidra', need: 'karceron', needName: 'Karceron', bid: 'letea' }];
  function biomeRect(i) { return { x: 650 + i * 98, y: 336, w: 92, h: 48 }; }
  // Peligro I-V (J3): se elige por jefe; vencer el Peligro N abre el N+1 (Save.data.peligro[jefe])
  var PEL_TXT = ['', 'Base.', '+1 add en las invocaciones, telegrafías -10 %.', 'Ataque nuevo o variante por jefe.', 'Furia a los 120 s, partes +30 %, derribos más cortos, 2 trofeos por parte.', 'Último aliento (2 desesperados), hasta 6 adds.'];
  function pelRect(i) { return { x: 650 + i * 58, y: 404, w: 54, h: 48 }; }
  function effBiome() {   // el destino que de verdad se usará (como G.startGame: un bioma bloqueado cae al último abierto)
    var S = SV(), id = S.biome || 'bosque';
    if (id === 'asfodelo' && !S.bossKills.karceron) id = S.bossKills.pastor ? 'cripta' : 'bosque';
    if (id === 'cripta' && !S.bossKills.pastor) id = 'bosque';
    return BIOMES.filter(function (b) { return b.id === id; })[0];
  }
  function biomeOpen(b) { return !b.need || (SV().bossKills[b.need] || 0) > 0; }
  function unlockedList() { return G.Cards.defs.filter(function (d) { return d.id && L.unlocked(d.id); }); }
  function toggleAnchor(id) {
    var S = SV(), a = S.anchors, i = a.indexOf(id);
    if (!L.unlocked(id)) { say('Desbloquea la carta antes de fijarla como ancla.'); return; }
    if (i >= 0) a.splice(i, 1); else { a.push(id); if (a.length > G.B.anchorSlots) a.shift(); }
    G.Save.save(); G.sfx('card_select', { vol: 0.5 });
  }
  function updPortal() {
    var S = SV(), i, list = unlockedList();
    for (i = 0; i < 3; i++) if (onR(lenRect(i))) { S.len = LENS[i]; G.Save.save(); G.sfx('card_select', { vol: 0.5 }); }
    for (i = 0; i < G.B.anchorSlots; i++) if (onR(handRect(i)) && S.anchors[i]) { S.anchors.splice(i, 1); G.Save.save(); }
    for (i = 0; i < BIOMES.length; i++) if (onR(biomeRect(i))) {
      if (biomeOpen(BIOMES[i])) { S.biome = BIOMES[i].id; G.Save.save(); G.sfx('card_select', { vol: 0.5 }); }
      else say('Bloqueado: vence a ' + BIOMES[i].needName + ' para abrir este destino.');
    }
    for (i = 0; i < list.length; i++) if (onR(ancRect(i))) toggleAnchor(list[i].id);
    var bid = effBiome().bid;
    for (i = 0; i < 5; i++) if (onR(pelRect(i))) {
      if (i + 1 <= G.Save.pelMax(bid)) { G.Save.setPelSel(bid, i + 1); G.sfx('card_select', { vol: 0.5 }); }
      else say('Bloqueado: vence a ' + effBiome().boss + ' en Peligro ' + G.Boss.ROMAN[i] + ' para abrirlo.');
    }
    if (inp.hit('KeyQ')) G.Save.setPelSel(bid, G.Save.pelSel(bid) - 1);
    if (inp.hit('KeyE')) G.Save.setPelSel(bid, G.Save.pelSel(bid) + 1);
    G.launchReq = null;
    if (onR(R_GO) || inp.hit('Enter')) { G.Base.launch(); }
    return false;
  }
  function drawHand(c, x0) {
    var S = SV(), i;
    for (i = 0; i < 5; i++) {
      var r = handRect(i), isAn = i < G.B.anchorSlots, id = S.anchors[i];
      if (isAn && id) { G.Cards.drawCard(c, { id: id, lvl: 0 }, r.x, r.y, r.w, r.h, { nocd: true }); G.txt(c, 'ANCLA', r.x + r.w / 2, r.y - 8, 10, '#ffd24a', 'center'); }
      else if (isAn) { G.Cards.drawEmptySlot(c, r.x, r.y, r.w, r.h, '+'); G.txt(c, 'ANCLA', r.x + r.w / 2, r.y + r.h - 10, 10, '#ffd24a', 'center'); }
      else { G.Cards.drawEmptySlot(c, r.x, r.y, r.w, r.h, '?'); G.txt(c, 'ABIERTO', r.x + r.w / 2, r.y + r.h - 10, 10, '#6f6480', 'center'); }
    }
  }
  function fx(v) { return String(v).replace('.', ','); }
  function drawPortal(c) {
    var S = SV(), list = unlockedList(), i, Q = G.Quests;
    bg(c, '¿LISTO, MARLO?'); header(c, 360);
    G.txt(c, 'TU MANO AL SALIR  (toca un ancla para quitarla)', 20, 94, 12, '#9a8fb0', 'left');
    drawHand(c);
    G.txt(c, G.B.anchorSlots + ' anclas fijas; los otros ' + (5 - G.B.anchorSlots) + ' slots se llenan al subir de nivel con tus cartas.', 20, 236, 11, '#9a8fb0', 'left');
    G.txt(c, 'TUS CARTAS  (toca para fijar / quitar como ancla)', 20, 254, 12, '#9a8fb0', 'left');
    for (i = 0; i < list.length; i++) {
      var r = ancRect(i), isA = S.anchors.indexOf(list[i].id) >= 0;
      G.Cards.drawCard(c, { id: list[i].id, lvl: 0 }, r.x, r.y + 8, r.w, r.h - 8, { nocd: true, glow: isA ? '#ffd24a' : null });
      if (isA) { c.fillStyle = '#ffd24a'; c.fillRect(r.x, r.y + r.h - 12, r.w, 12); G.txt(c, 'ANCLA', r.x + r.w / 2, r.y + r.h - 6, 9, '#2a1a00', 'center', '#ffd24a'); }
    }
    G.txt(c, 'DURACIÓN  (riesgo / recompensa)', 650, 84, 12, '#9a8fb0', 'left');
    LENS.forEach(function (n, k) { var on = S.len === n, D = L.DUR[n]; U.button(c, lenRect(k), D.name, { size: 16, color: on ? '#2a6aa8' : '#2c2438', hot: '#3a8ad0', border: on ? '#bfeaff' : '#6a5a80', sub: n + ' min' }); });
    LENS.forEach(function (n, k) { var on = S.len === n, D = L.DUR[n]; G.txt(c, D.name + ': ' + D.tag, 650, 157 + k * 11, 10, on ? '#ffe9a0' : '#7a7086', 'left'); });
    var dd = L.DUR[S.len] || L.DUR[9], pc = function (v) { return (v >= 1 ? '+' : '') + Math.round((v - 1) * 100) + ' %'; }, hpRel = G.Boss.durMul(dd.min) * dd.bossHp;
    G.txt(c, 'Botín x' + fx(dd.parts) + '  PF x' + fx(dd.pf) + '  Esencia x' + fx(dd.rare) + '  Jefe a ' + G.fmtTime(dd.min * 60000 * 7.5 / 9), 650, 191, 10, '#9dffb4', 'left');
    G.txt(c, 'HP jefe ' + pc(hpRel) + '  daño ' + pc(dd.bossDmg) + '  guardianes ' + pc(dd.guardHp), 650, 202, 10, '#ffb08a', 'left');
    // encargo y compras pendientes
    U.panel(c, 650, 210, 290, 52);
    G.txt(c, 'ENCARGO ACTIVO', 662, 222, 11, '#9a8fb0', 'left');
    var ql = Q.statusLine();
    var ls = U.wrap(c, ql || 'Ninguno. Vesper tiene encargos en el Tablón.', 266, 12);
    for (i = 0; i < ls.length && i < 2; i++) G.txt(c, ls[i], 662, 236 + i * 13, 12, ql ? '#ffe9a0' : '#8a7f96', 'left');
    if (Q.target()) G.txt(c, 'Objetivo: peso x2,5', 930, 222, 10, '#9dffb4', 'right');
    U.panel(c, 650, 266, 290, 56);
    G.txt(c, 'COMPRAS Y PLATO PARA ESTA SALIDA', 662, 278, 11, '#9a8fb0', 'left');
    var dsh = G.Cook.pending(); G.txt(c, dsh ? 'Plato: ' + dsh.name : 'Plato: ninguno (Tía Castaña cocina)', 662, 309, 11, dsh ? '#ffd0dc' : '#8a7f96', 'left');
    G.txt(c, (S.pending.tonic ? 'Tónico (+40 Ceniza)  ' : '') + (S.pending.magnet ? 'Imán x1,5' : '') || '', 662, 293, 12, '#ffe9a0', 'left');
    if (!S.pending.tonic && !S.pending.magnet) G.txt(c, 'Ninguna (Rufo las vende)', 662, 293, 12, '#8a7f96', 'left');
    var cb = effBiome(), bid = cb.bid, pmax = G.Save.pelMax(bid), psel = G.Save.pelSel(bid), PD = G.Boss.PELIGRO[psel];
    G.txt(c, 'DESTINO  -  Jefe: ' + cb.boss, 650, 328, 11, '#9a8fb0', 'left');
    BIOMES.forEach(function (b, k) {
      var open = biomeOpen(b), on = cb.id === b.id;
      U.button(c, biomeRect(k), open ? b.name : '? ' + b.name, { size: 13, color: on ? '#2a6aa8' : open ? '#2c2438' : '#1a1422', hot: '#3a8ad0', border: on ? '#bfeaff' : open ? '#6a5a80' : '#3a3046', off: !open, sub: open ? (on ? 'elegido' : 'Peligro ' + G.Boss.ROMAN[G.Save.pelSel(b.bid)]) : 'bloqueado' });
    });
    G.txt(c, 'PELIGRO  (Q/E)  -  desbloqueado hasta ' + G.Boss.ROMAN[pmax], 650, 398, 11, '#9a8fb0', 'left');
    for (i = 0; i < 5; i++) {
      var pr = pelRect(i), pon = psel === i + 1, pop = i + 1 <= pmax;
      U.button(c, pr, pop ? G.Boss.ROMAN[i + 1] : '?', { size: 16, off: !pop, color: pon ? ['', '#6a6a5a', '#a8801a', '#c4601c', '#b8341a', '#9a1a80'][i + 1] : '#2c2438', hot: '#3a8ad0', border: pon ? '#ffffff' : pop ? '#6a5a80' : '#3a3046' });
    }
    var pl1 = 'HP jefe x' + PD.hp.toFixed(2).replace('.', ',') + '  daño +' + Math.round((PD.dmg - 1) * 100) + ' %  Brasas x' + PD.brasas.toFixed(2).replace('.', ',') + (PD.troph > 1 ? '  2 trofeos/parte' : '');
    G.txt(c, pl1, 650, 453, 10, '#ffe9a0', 'left');
    U.wrap(c, PEL_TXT[psel] + (psel >= 4 ? ' Recomendado: DPS >= 110.' : ''), 290, 10).slice(0, 2).forEach(function (ln, k) { G.txt(c, ln, 650, 466 + k * 12, 10, '#c8b8e8', 'left'); });
    var names = S.anchors.map(function (a) { return G.Cards.def(a).short; }).join(' + ') || 'sin anclas';
    U.button(c, R_GO, 'SALIR A LA EXPEDICIÓN', { size: 15, sub: 'Enter  -  ' + names });
  }

  // ============================================================= ARCHIVO (Ulalume) / COLECCIÓN
  // Colección completa (28 cartas) con filtros por etiqueta, selección de anclas con vista previa de combos y sinergias, y 3 loadouts guardados.
  var FILTERS = [{ id: 'all', name: 'TODAS', color: '#e8dcb0' }, { id: 'fire', name: 'FUEGO' }, { id: 'ice', name: 'HIELO' }, { id: 'lightning', name: 'RAYO' },
    { id: 'poison', name: 'VENENO' }, { id: 'blood', name: 'SANGRE' }, { id: 'steel', name: 'ACERO' }, { id: 'neutral', name: 'NEUTRO' }];
  FILTERS.forEach(function (f) { if (!f.color) f.color = G.TAGS[f.id].color; });
  var CELL = { w: 56, h: 76, gx: 60, gy: 82, x0: 14, y0: 104, cols: 10 };
  function cellRect(i) { return { x: CELL.x0 + (i % CELL.cols) * CELL.gx, y: CELL.y0 + Math.floor(i / CELL.cols) * CELL.gy, w: CELL.w, h: CELL.h }; }
  function chipRect(i) { return { x: 14 + i * 76, y: 64, w: 72, h: 30 }; }
  var R_ANC = { x: 626, y: 304, w: 312, h: 48 };
  var LOX = 620, LOW = 324;
  function loRect(i) { return { x: LOX, y: 388 + i * 46, w: LOW, h: 44 }; }
  function loName(i) { return { x: LOX, y: 388 + i * 46, w: 120, h: 44 }; }
  function loSave(i) { return { x: LOX + 124, y: 388 + i * 46, w: 94, h: 44 }; }
  function loApply(i) { return { x: LOX + 222, y: 388 + i * 46, w: 102, h: 44 }; }
  function handRect2(i) { return { x: 14 + i * 70, y: 390, w: 64, h: 86 }; }
  function archList() {
    var f = st.filter || 'all';
    return G.Cards.defs.filter(function (d) { return d.id && (f === 'all' || d.tag === f); });
  }
  function comboNames(ids) {
    var tags = {}; ids.forEach(function (id) { var d = G.Cards.def(id); if (d && d.tag !== 'neutral') tags[d.tag] = true; });
    return G.Cards.combos.filter(function (cb) { return tags[cb.a] && tags[cb.b]; });
  }
  P.anchorCombos = function (ids) { return comboNames(ids).map(function (cb) { return cb.k; }); };   // para pruebas
  function saveLoadout(i) {
    var S = SV(); S.loadouts[i] = { name: (S.loadouts[i] && S.loadouts[i].name) || 'LOADOUT ' + (i + 1), anchors: S.anchors.slice(), dish: S.pending.dish || null, len: S.len };
    G.Save.save(); G.sfx('card_select', { vol: 0.6 }); say('Loadout ' + (i + 1) + ' guardado: ' + (S.anchors.map(function (a) { return G.Cards.def(a).short; }).join(' + ') || 'sin anclas') + ', ' + S.len + ' min.');
  }
  function applyLoadout(i) {
    var S = SV(), lo = S.loadouts[i]; if (!lo) { say('Ese slot está vacío. Pulsa GUARDAR para guardar tu mano actual.'); return; }
    S.anchors = lo.anchors.filter(function (id) { return G.Cards.def(id) && L.unlocked(id); }).slice(0, G.B.anchorSlots);
    if (LENS.indexOf(lo.len) >= 0) S.len = lo.len;
    var extra = '';
    if (lo.dish) {
      var cur = G.Cook.pending();
      if (cur && cur.id === lo.dish) extra = '  Plato ya preparado.';
      else if (cur) extra = '  (Ya hay otro plato preparado.)';
      else { var r = G.Cook.cook(lo.dish); extra = '  ' + r.msg; }
    }
    G.Save.save(); G.sfx('card_select', { vol: 0.7 });
    say('Loadout "' + lo.name + '" aplicado: ' + (S.anchors.map(function (a) { return G.Cards.def(a).short; }).join(' + ') || 'sin anclas') + ', ' + S.len + ' min.' + extra);
  }
  P.saveLoadout = saveLoadout; P.applyLoadout = applyLoadout;   // API de pruebas
  var KEYCH = {};
  'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('').forEach(function (ch) { KEYCH['Key' + ch] = ch; });
  '0123456789'.split('').forEach(function (ch) { KEYCH['Digit' + ch] = ch; });
  function startEdit() {
    var S = SV(), lo = S.loadouts[st.lo];
    if (!lo) { say('Guarda primero el loadout y luego ponle nombre.'); return; }
    if (G.touchUI && window.prompt) {   // táctil: teclado nativo del navegador
      var nm = window.prompt('Nombre del loadout (12 letras)', lo.name);
      if (nm != null) { lo.name = nm.toUpperCase().replace(/[^A-Z0-9 ÁÉÍÓÚÑ-]/g, '').slice(0, 12) || lo.name; G.Save.save(); }
      return;
    }
    st.edit = true; st.buf = '';   // escribe el nombre nuevo (si lo dejas vacío se conserva el anterior)
  }
  function updEdit() {
    var lo = SV().loadouts[st.lo];
    if (!lo) { st.edit = false; return; }
    for (var code in inp.pressed) {
      if (!inp.pressed[code]) continue;
      if (code === 'Enter' || code === 'NumpadEnter') { lo.name = (st.buf || '').trim() || lo.name; G.Save.save(); st.edit = false; say('Loadout renombrado: ' + lo.name); return; }
      if (code === 'Escape') { st.edit = false; return; }
      if (code === 'Backspace') st.buf = st.buf.slice(0, -1);
      else if (code === 'Space') { if (st.buf.length < 12) st.buf += ' '; }
      else if (KEYCH[code] && st.buf.length < 12) st.buf += KEYCH[code];
    }
    if (click() && !U.inR(loName(st.lo), inp.mouse)) { lo.name = (st.buf || '').trim() || lo.name; G.Save.save(); st.edit = false; }
  }
  function updArchive() {
    var list = archList(), i, S = SV();
    if (st.csel >= list.length) st.csel = Math.max(0, list.length - 1);
    if (inp.hit('ArrowRight', 'KeyD')) st.csel = Math.min(list.length - 1, st.csel + 1);
    if (inp.hit('ArrowLeft', 'KeyA')) st.csel = Math.max(0, st.csel - 1);
    if (inp.hit('ArrowDown', 'KeyS')) st.csel = Math.min(list.length - 1, st.csel + CELL.cols);
    if (inp.hit('ArrowUp', 'KeyW')) st.csel = Math.max(0, st.csel - CELL.cols);
    if (inp.hit('KeyQ')) { st.filter = FILTERS[(FILTERS.map(function (f) { return f.id; }).indexOf(st.filter || 'all') + FILTERS.length - 1) % FILTERS.length].id; st.csel = 0; }
    if (inp.hit('Tab')) { st.filter = FILTERS[(FILTERS.map(function (f) { return f.id; }).indexOf(st.filter || 'all') + 1) % FILTERS.length].id; st.csel = 0; }
    for (i = 0; i < FILTERS.length; i++) if (onR(chipRect(i))) { st.filter = FILTERS[i].id; st.csel = 0; G.sfx('flip', { vol: 0.4 }); }
    list = archList();
    if ((inp.hit('KeyE', 'Enter') || onR(R_ANC)) && list[st.csel]) toggleAnchor(list[st.csel].id);
    for (i = 0; i < list.length; i++) if (onR(cellRect(i))) { st.csel = i; G.sfx('flip', { vol: 0.4 }); }
    for (i = 0; i < G.B.anchorSlots; i++) if (onR(handRect2(i)) && S.anchors[i]) { S.anchors.splice(i, 1); G.Save.save(); }
    for (i = 0; i < 3; i++) {
      if (inp.hit('Digit' + (i + 1))) { st.lo = i; G.sfx('flip', { vol: 0.3 }); }
      if (onR(loRect(i))) st.lo = i;
      if (onR(loSave(i))) saveLoadout(i);
      else if (onR(loApply(i))) applyLoadout(i);
      else if (onR(loName(i)) && st.lo === i && S.loadouts[i]) startEdit();
    }
    if (inp.hit('KeyZ')) saveLoadout(st.lo);
    if (inp.hit('KeyX')) applyLoadout(st.lo);
    if (inp.hit('KeyN')) startEdit();
    return false;
  }
  function nodeFor(card) { return G.Tree.NODES.filter(function (n) { return n.card === card && n.type === 'C'; })[0]; }
  function drawArchive(c) {
    var list = archList(), S = SV(), i, d = list[Math.min(st.csel, list.length - 1)] || list[0], id = d.id, rank = G.Save.rank(id), tc = G.TAGS[d.tag].color;
    var owned = G.Cards.defs.filter(function (q) { return q.id && L.unlocked(q.id); }).length;
    bg(c, 'ARCHIVO  -  Ulalume');
    G.txt(c, 'Colección ' + owned + '/' + G.Cards.defs.length + '  -  anclas ' + S.anchors.length + '/' + G.B.anchorSlots, 300, 24, 13, '#9a8fb0', 'left');
    for (i = 0; i < FILTERS.length; i++) {
      var f = FILTERS[i], cr = chipRect(i), on = (st.filter || 'all') === f.id;
      c.fillStyle = on ? '#2a1d3a' : '#150f20'; c.fillRect(cr.x, cr.y, cr.w, cr.h); c.strokeStyle = on ? f.color : '#3a2f48'; c.lineWidth = on ? 4 : 2; c.strokeRect(cr.x + 1, cr.y + 1, cr.w - 2, cr.h - 2);
      G.txt(c, f.name, cr.x + cr.w / 2, cr.y + cr.h / 2, 12, on ? f.color : '#8a7f96', 'center');
    }
    for (i = 0; i < list.length; i++) {
      var r = cellRect(i), rk = G.Save.rank(list[i].id), isA = S.anchors.indexOf(list[i].id) >= 0;
      G.Cards.drawCard(c, { id: list[i].id, lvl: 0 }, r.x, r.y, r.w, r.h, { nocd: true, dim: rk === 0, glow: list[i] === d ? '#ffe9a0' : null });
      if (list[i] === d) { c.strokeStyle = '#ffe9a0'; c.lineWidth = 3; c.strokeRect(r.x - 2, r.y - 2, r.w + 4, r.h + 4); }
      if (rk === 0) { c.fillStyle = '#0c0814'; c.fillRect(r.x + r.w - 20, r.y + 4, 16, 14); c.fillStyle = '#9a8fb0'; c.fillRect(r.x + r.w - 18, r.y + 7, 12, 9); }
      if (isA) { c.fillStyle = '#ffd24a'; c.fillRect(r.x, r.y + r.h - 14, r.w, 14); G.txt(c, 'ANCLA', r.x + r.w / 2, r.y + r.h - 7, 10, '#2a1a00', 'center', '#ffd24a'); }
    }
    // detalle de la carta
    U.panel(c, 614, 60, 336, 296, { border: tc });
    G.Cards.drawCard(c, { id: id, lvl: 0 }, 626, 70, 62, 84, { nocd: true });
    G.txt(c, d.name, 700, 84, 17, '#ffd27a', 'left');
    G.txt(c, G.TAGS[d.tag].name + ' - ' + (d.type === 'attack' ? 'ATAQUE' : 'PASIVA'), 700, 105, 12, tc, 'left');
    G.txt(c, rank ? 'RANGO ' + U.roman(rank) : 'BLOQUEADA', 700, 125, 13, rank ? '#fff' : '#ff8a8a', 'left');
    var ls = U.wrap(c, d.desc, 306, 11);
    for (i = 0; i < ls.length && i < 4; i++) G.txt(c, ls[i], 626, 172 + i * 14, 11, '#d8cfe8', 'left');
    var how = rank ? 'Mejoras de rango: árbol de Grum.' : G.Save.STARTERS.indexOf(id) >= 0 ? 'Carta inicial.' : 'Se desbloquea en el árbol de Grum' + (nodeFor(id) ? ': ' + nodeFor(id).name + ' (' + (G.Tree.tabOf(nodeFor(id).tree) || {}).name + ').' : '.');
    var hl = U.wrap(c, how, 306, 11); for (i = 0; i < hl.length && i < 2; i++) G.txt(c, hl[i], 626, 236 + i * 14, 11, '#9dffb4', 'left');
    var isAnchor = S.anchors.indexOf(id) >= 0, nw = comboNames(S.anchors.concat(isAnchor ? [] : [id]));
    var gain = isAnchor || !rank ? [] : nw.filter(function (cb) { return comboNames(S.anchors).indexOf(cb) < 0; });
    if (gain.length) G.txt(c, 'COMBO al fijarla: ' + gain.map(function (cb) { return cb.name; }).join(', '), 626, 276, 11, '#ffe9a0', 'left');
    U.button(c, R_ANC, isAnchor ? 'QUITAR ANCLA' : 'FIJAR ANCLA', { off: !rank, color: '#a8801a', hot: '#d8a82a', size: 16, sub: '[E]' });
    // mano al salir
    G.txt(c, 'TU MANO AL SALIR  (toca un ancla para quitarla)', 14, 376, 12, '#9a8fb0', 'left');
    for (i = 0; i < 5; i++) {
      var hr = handRect2(i), isAn = i < G.B.anchorSlots, a = S.anchors[i];
      if (isAn && a) { G.Cards.drawCard(c, { id: a, lvl: 0 }, hr.x, hr.y, hr.w, hr.h, { nocd: true }); G.txt(c, 'ANCLA', hr.x + hr.w / 2, hr.y + hr.h + 9, 9, '#ffd24a', 'center'); }
      else if (isAn) G.Cards.drawEmptySlot(c, hr.x, hr.y, hr.w, hr.h, '+');
      else { G.Cards.drawEmptySlot(c, hr.x, hr.y, hr.w, hr.h, '?'); G.txt(c, 'ABIERTO', hr.x + hr.w / 2, hr.y + hr.h + 9, 9, '#6f6480', 'center'); }
    }
    drawSynergy(c, S, d, isAnchor);
    // loadouts
    U.panel(c, 614, 372, 336, 156);
    G.txt(c, 'LOADOUTS  1-3 elegir  Z guardar  X aplicar  N nombre', 626, 382, 10, '#9a8fb0', 'left');
    for (i = 0; i < 3; i++) {
      var lr = loRect(i), lo = S.loadouts[i], sel = st.lo === i;
      c.fillStyle = sel ? '#2a1d3a' : '#150f20'; c.fillRect(lr.x, lr.y, lr.w, lr.h); c.strokeStyle = sel ? '#ffd27a' : '#3a2f48'; c.lineWidth = sel ? 3 : 2; c.strokeRect(lr.x + 1, lr.y + 1, lr.w - 2, lr.h - 2);
      var nm = st.edit && sel ? (st.buf || 'ESCRIBE...') + (Math.floor(Date.now() / 400) % 2 ? '_' : ' ') : (lo ? lo.name : 'VACÍO ' + (i + 1));
      G.txt(c, nm, lr.x + 8, lr.y + 14, 12, lo ? '#fff' : '#6a5f78', 'left');
      var sub = lo ? lo.anchors.map(function (a2) { return (G.Cards.def(a2) || { short: '?' }).short; }).join('+') + ' ' + lo.len + 'm' + (lo.dish ? ' *' : '') : 'sin guardar';
      G.txt(c, sub.length > 19 ? sub.slice(0, 18) + '.' : sub, lr.x + 8, lr.y + 32, 9, '#9a8fb0', 'left');
      U.button(c, loSave(i), 'GUARDAR', { size: 12, color: '#2a6aa8', hot: '#3a8ad0', border: '#bfeaff' });
      U.button(c, loApply(i), 'APLICAR', { size: 12, off: !lo, color: '#2a8a4a', hot: '#3aba66', border: '#9dffb4' });
    }
    G.txt(c, 'Flechas: elegir  -  E: fijar  -  Q / Tab: filtro  -  Esc: volver', 14, 531, 10, '#6f6480', 'left');
  }
  // Vista previa de sinergias de etiqueta de las anclas (y de la carta señalada)
  function drawSynergy(c, S, d, isAnchor) {
    var i, N = {}, ids = S.anchors.slice(0, G.B.anchorSlots), x = 372, y = 372;
    U.panel(c, x, y, 232, 156);
    G.txt(c, 'SINERGIAS DE TUS ANCLAS', x + 10, y + 14, 11, '#9a8fb0', 'left');
    ids.forEach(function (a) { var t = G.Cards.def(a).tag; N[t] = (N[t] || 0) + 1; });
    var tags = Object.keys(N), px = x + 10;
    if (!tags.length) G.txt(c, 'Sin anclas: sal con la mano vacía.', x + 10, y + 32, 11, '#8a7f96', 'left');
    tags.forEach(function (t, k) {
      var col = (G.TAGS[t] || {}).color || '#fff'; c.fillStyle = col; c.beginPath(); c.arc(px + 5, y + 34, 5, 0, 6.283); c.fill();
      G.txt(c, (G.TAGS[t] || { name: t }).name + ' x' + N[t], px + 14, y + 34, 10, '#d8cfe8', 'left'); px += 14 + (G.TAGS[t].name.length + 3) * 6.4 + 8;
    });
    var cur = comboNames(ids);
    G.txt(c, cur.length ? 'COMBOS ACTIVOS' : 'Sin combos: junta etiquetas distintas', x + 10, y + 54, 10, cur.length ? '#9dffb4' : '#9a8fb0', 'left');
    cur.slice(0, 3).forEach(function (cb, k) {
      c.fillStyle = G.TAGS[cb.a].color; c.beginPath(); c.arc(x + 15, y + 72 + k * 17, 4, 0, 6.283); c.fill(); c.fillStyle = G.TAGS[cb.b].color; c.beginPath(); c.arc(x + 25, y + 72 + k * 17, 4, 0, 6.283); c.fill();
      G.txt(c, cb.name, x + 34, y + 72 + k * 17, 11, '#ffe9a0', 'left');
    });
    if (cur.length > 3) G.txt(c, '+' + (cur.length - 3) + ' más', x + 160, y + 72, 10, '#9a8fb0', 'left');
    var set = Object.keys(N).filter(function (t) { return N[t] >= 2 && t !== 'neutral'; });
    if (set.length) G.txt(c, 'Set ' + G.TAGS[set[0]].name + ': a 3 cartas +25 %', x + 10, y + 118, 9, '#c8b8e8', 'left');
    var gain = !isAnchor && G.Save.rank(d.id) ? comboNames(ids.concat([d.id])).filter(function (cb) { return cur.indexOf(cb) < 0; }) : [];
    var gt = gain.length ? 'Con ' + d.short + ': ' + gain.map(function (cb) { return cb.name; }).join(', ') : (isAnchor ? d.short + ' ya es ancla.' : 'Con ' + d.short + ': sin combo nuevo.');
    U.wrap(c, gt, 212, 10).slice(0, 2).forEach(function (ln, k) { G.txt(c, ln, x + 10, y + 132 + k * 13, 10, gain.length ? '#ffe9a0' : '#8a7f96', 'left'); });
  }

  // ============================================================= COCINA de Tía Castaña
  // Un plato por expedición (se reinicia al volver de una salida). El plato preparado se consume al salir y da su buff durante toda la run (HUD: chip abajo a la izquierda).
  var Cook = G.Cook = {};
  Cook.DISHES = [
    { id: 'sopa', name: 'Sopa de hebra', icon: 'thread', short: 'Sopa', desc: 'Cura pasiva leve: +0,25 HP por segundo (sin cifras flotantes).', parts: { thread: 8 }, brasas: 20, fx: { regen: 0.25 } },
    { id: 'pan', name: 'Pan de pluma', icon: 'feather', short: 'Pan', desc: '+8 % de velocidad de movimiento.', parts: { feather: 6 }, brasas: 20, fx: { speed: 1 } },
    { id: 'te', name: 'Té de brasas', icon: 'brasa', short: 'Té', desc: '+10 % de XP durante toda la expedición.', parts: { thread: 4 }, brasas: 60, fx: { xp: 1 } },
    { id: 'estofado', name: 'Estofado de púas', icon: 'spine', short: 'Estofado', desc: '-25 % de daño de proyectiles (arqueros, espinosos, polillas, sembradores).', parts: { spine: 6 }, brasas: 20, fx: { res: { ranged: 0.25 } } },
    { id: 'guiso', name: 'Guiso de mecha', icon: 'wick', short: 'Guiso', desc: '-30 % de daño de explosivos y fuego (bombas, ascuas).', parts: { wick: 4 }, brasas: 30, fx: { res: { blast: 0.3 } } },
    { id: 'caldo', name: 'Caldo de placa', icon: 'plate', short: 'Caldo', desc: '-20 % de daño cuerpo a cuerpo (gusanos, jabalíes, escuderos, espectros).', parts: { plate: 5 }, brasas: 30, fx: { res: { melee: 0.2 } } },
    { id: 'asado', name: 'Asado de colmillo', icon: 'fang', short: 'Asado', desc: '-15 % de daño de élites, minijefes y jefes.', parts: { fang: 4 }, brasas: 30, fx: { res: { big: 0.15 } } }
  ];
  Cook.def = function (id) { return Cook.DISHES.filter(function (d) { return d.id === id; })[0] || null; };
  Cook.pending = function () { var id = SV().pending.dish; return id ? Cook.def(id) : null; };
  Cook.afford = function (d) { var S = SV(); if (S.brasas < d.brasas) return false; for (var k in d.parts) if ((S.parts[k] || 0) < d.parts[k]) return false; return true; };
  Cook.can = function () { var S = SV(); return !S.pending.dish && !S.shop.dish; };
  Cook.anyAffordable = function () { return Cook.can() && Cook.DISHES.some(Cook.afford); };
  Cook.cook = function (id) {
    var S = SV(), d = Cook.def(id); if (!d) return { ok: false, msg: '' };
    if (S.pending.dish) return { ok: false, msg: 'Ya llevas un plato: ' + Cook.def(S.pending.dish).name + '.' };
    if (S.shop.dish) return { ok: false, msg: 'Ya comiste en esta salida. Vuelve tras otra expedición.' };
    if (!Cook.afford(d)) return { ok: false, msg: 'Faltan ingredientes o Brasas.' };
    for (var k in d.parts) S.parts[k] -= d.parts[k];
    S.brasas -= d.brasas; S.pending.dish = id; S.shop.dish = 1; G.Save.save();
    return { ok: true, msg: d.name + ' preparado para la próxima expedición.' };
  };
  // Al empezar una expedición (G.startGame): consume el plato y deja su buff en G.runBuff
  Cook.begin = function () {
    var S = SV(), d = S.pending.dish ? Cook.def(S.pending.dish) : null;
    G.runBuff = G.runBuff || {}; G.runBuff.dish = d ? d.id : null; G.runBuff.fx = d ? d.fx : {};
    if (d) { S.pending.dish = null; S.cooked = (S.cooked || 0) + 1; G.Save.save(); try { G.Ach.check(); } catch (e) { /* logros */ } }
  };
  Cook.drawHud = function (c) {
    var d = G.runBuff && G.runBuff.dish ? Cook.def(G.runBuff.dish) : null; if (!d) return;
    c.save(); c.fillStyle = 'rgba(10,6,18,0.72)'; c.fillRect(66, G.H - 34, 148, 22); c.strokeStyle = '#d0708a'; c.lineWidth = 2; c.strokeRect(67, G.H - 33, 146, 20);
    U.part(c, d.icon, 80, G.H - 23, 7); G.txt(c, d.name.length > 16 ? d.short : d.name, 94, G.H - 22, 10, '#ffe9f0', 'left'); c.restore();
  };
  function dRow(i) { return { x: 14, y: 70 + i * 63, w: 932, h: 57 }; }
  function dBtn(i) { var r = dRow(i); return { x: r.x + r.w - 168, y: r.y + 4, w: 156, h: 48 }; }
  function updCook() {
    for (var i = 0; i < Cook.DISHES.length; i++) if (onR(dBtn(i)) || inp.hit('Digit' + (i + 1))) {
      var r = Cook.cook(Cook.DISHES[i].id); say(r.msg); if (r.ok) { G.sfx('card_select', { vol: 0.8 }); try { G.Snd.play('fuse'); } catch (e) { /* audio */ } if (G.Aldea.onCooked) G.Aldea.onCooked(); } else G.sfx('discard', { vol: 0.5 });
    }
    return false;
  }
  function drawCook(c) {
    var S = SV(), cur = Cook.pending();
    bg(c, 'COCINA  -  Tía Castaña'); header(c, 560);
    G.txt(c, cur ? 'Preparado: ' + cur.name : S.shop.dish ? 'Hoy ya comiste. Vuelve tras otra expedición.' : 'Un plato por expedición. Se come solo al salir.', 14, 56, 12, cur ? '#9dffb4' : '#9a8fb0', 'left');
    Cook.DISHES.forEach(function (d, i) {
      var r = dRow(i), ok = Cook.afford(d), isCur = cur && cur.id === d.id;
      U.panel(c, r.x, r.y, r.w, r.h, { border: isCur ? '#7dff9a' : ok ? '#8a6a4a' : '#3a2f48' });
      U.part(c, d.icon, r.x + 28, r.y + 29, 14);
      G.txt(c, '[' + (i + 1) + '] ' + d.name, r.x + 58, r.y + 18, 16, '#ffd27a', 'left');
      G.txt(c, d.desc, r.x + 58, r.y + 40, 11, '#d8cfe8', 'left');
      var x = r.x + 560, k;
      for (k in d.parts) { var have = S.parts[k] || 0; U.part(c, k, x + 8, r.y + 28, 9); G.txt(c, have + '/' + d.parts[k], x + 22, r.y + 29, 12, have >= d.parts[k] ? '#9dffb4' : '#ff8a8a', 'left'); x += 74; }
      U.part(c, 'brasa', x + 8, r.y + 28, 9); G.txt(c, S.brasas + '/' + d.brasas, x + 22, r.y + 29, 12, S.brasas >= d.brasas ? '#9dffb4' : '#ff8a8a', 'left');
      U.button(c, dBtn(i), isCur ? 'LISTO' : 'COCINAR', { size: 15, off: !Cook.can() || !ok || isCur, color: '#2a8a4a', hot: '#3aba66', border: '#9dffb4' });
    });
    G.txt(c, '1-7: cocinar  -  Esc: volver', 14, 526, 10, '#6f6480', 'left');
  }

  // ============================================================= LOGROS (Abuelo Lanudo)
  function lRow(i) { return { x: 14, y: 64 + i * 40, w: 560, h: 36 }; }
  function updLogros() {
    var n = G.Ach.DEFS.length, i;
    if (inp.hit('ArrowDown', 'KeyS')) st.lsel = Math.min(n - 1, (st.lsel || 0) + 1);
    if (inp.hit('ArrowUp', 'KeyW')) st.lsel = Math.max(0, (st.lsel || 0) - 1);
    for (i = 0; i < n; i++) if (onR(lRow(i))) { st.lsel = i; G.sfx('flip', { vol: 0.3 }); }
    return false;
  }
  function drawLogros(c) {
    var A = G.Ach, S = SV(), sel = A.DEFS[st.lsel || 0];
    bg(c, 'MEMORIAS  -  Abuelo Lanudo'); G.txt(c, A.count() + '/' + A.DEFS.length + ' logros', 400, 24, 14, '#ffd24a', 'left');
    A.DEFS.forEach(function (a, i) {
      var r = lRow(i), got = !!S.ach[a.id], on = i === (st.lsel || 0);
      c.fillStyle = on ? '#2a1d3a' : '#150f20'; c.fillRect(r.x, r.y, r.w, r.h); c.strokeStyle = got ? '#ffd24a' : '#3a2f48'; c.lineWidth = on ? 3 : 2; c.strokeRect(r.x + 1, r.y + 1, r.w - 2, r.h - 2);
      c.fillStyle = got ? '#ffd24a' : '#3a2f48'; c.beginPath(); c.arc(r.x + 20, r.y + 18, 9, 0, 6.283); c.fill();
      if (got) G.txt(c, 'v', r.x + 20, r.y + 19, 12, '#3a2410', 'center', 'rgba(0,0,0,0)');
      G.txt(c, a.name, r.x + 40, r.y + 12, 13, got ? '#fff' : '#8a7f96', 'left'); G.txt(c, a.desc, r.x + 40, r.y + 27, 10, got ? '#bdb2d0' : '#6a5f78', 'left');
    });
    U.panel(c, 590, 64, 356, 300, { border: '#b8a878' });
    if (sel) {
      G.txt(c, sel.name, 604, 84, 16, '#ffd27a', 'left');
      var got2 = !!S.ach[sel.id], ls = U.wrap(c, got2 ? '"' + sel.lore + '"' : 'Aún no lo has conseguido. ' + sel.desc, 330, 12);
      for (var k = 0; k < ls.length && k < 10; k++) G.txt(c, ls[k], 604, 114 + k * 17, 12, got2 ? '#e8dcb0' : '#8a7f96', 'left');
    }
    G.txt(c, 'Flechas: elegir  -  Esc: volver', 14, 526, 10, '#6f6480', 'left');
  }

  // ============================================================= MENÚ y AJUSTES
  var MB = function (i) { return { x: 330, y: 110 + i * 78, w: 300, h: 62 }; };
  function updMenu() {
    var S = SV();
    if (onR(R_CLOSE) || onR(MB(3))) return true;
    if (onR(MB(0))) { G.Aldea.fromMenu = true; cur = 'archive'; st.csel = 0; }
    else if (onR(MB(1))) { cur = 'settings'; }
    else if (onR(MB(2))) {
      if (confirm === 'del') { G.Save.reset(); G.Aldea.open(false); say('Progreso borrado.'); return false; }
      confirm = 'del'; confirmT = 4000; say('Pulsa otra vez para BORRAR todo el progreso (no se puede deshacer; exporta antes si dudas).');
    }
    return false;
  }
  function drawMenu(c) {
    var S = SV();
    bg(c, 'MENÚ');
    G.txt(c, 'Expediciones ' + S.runs + '   Victorias ' + S.wins + (S.pity > 0 ? '   Rara +' + (S.pity * 100).toFixed(1) + '%' : ''), 480, 88, 13, '#9a8fb0', 'center');
    U.button(c, MB(0), 'COLECCIÓN', { size: 20, color: '#2a6aa8', hot: '#3a8ad0', border: '#bfeaff' });
    U.button(c, MB(1), 'AJUSTES', { size: 20, color: '#4a3a66', hot: '#6a5a86', border: '#8a7aa6' });
    U.button(c, MB(2), confirm === 'del' ? 'SEGURO? TOCA DE NUEVO' : 'BORRAR PROGRESO', { size: 18, color: confirm === 'del' ? '#a02030' : '#3a2f48', hot: '#c03040', border: '#8a6a8a' });
    U.button(c, MB(3), 'CERRAR [Esc]', { size: 20 });
  }
  var SET = [['master', 'Volumen general'], ['music', 'Música'], ['sfx', 'Efectos']];
  function setRect(i, plus) { return { x: plus ? 700 : 560, y: 64 + i * 56, w: 60, h: 48 }; }
  var SB = {   // rejilla de 2 columnas (todos >= 48 px de alto para el dedo)
    shake: { x: 150, y: 236, w: 320, h: 48 }, iso: { x: 490, y: 236, w: 320, h: 48 },
    qual: { x: 150, y: 292, w: 320, h: 48 }, fs: { x: 490, y: 292, w: 320, h: 48 },
    mute: { x: 150, y: 348, w: 320, h: 48 }, inst: { x: 490, y: 348, w: 320, h: 48 },
    exp: { x: 150, y: 404, w: 320, h: 48 }, imp: { x: 490, y: 404, w: 320, h: 48 },
    back: { x: 330, y: 466, w: 300, h: 52 }
  };
  function updSettings() {
    var S = SV();
    if (!S.settings) S.settings = (function () { try { return Assets.getVolume(); } catch (e) { return { master: 0.8, music: 0.6, sfx: 0.8 }; } })();
    for (var i = 0; i < 3; i++) for (var p = 0; p < 2; p++) if (onR(setRect(i, p))) {
      var k = SET[i][0]; S.settings[k] = G.clamp(Math.round((S.settings[k] + (p ? 0.1 : -0.1)) * 10) / 10, 0, 1);
      G.Save.save(); G.Aldea.applySettings(); G.sfx('card_select', { vol: 0.5 });
    }
    if (onR(SB.shake)) { S.settings.shake = S.settings.shake ? 0 : 1; G.shakeMul = S.settings.shake ? 1 / 3 : 1; G.Save.save(); G.sfx('card_select', { vol: 0.5 }); }
    if (onR(SB.iso)) { G.Proj.toggle(); G.sfx('card_select', { vol: 0.5 }); }   // vista inclinada tipo Hades (se guarda en settings.view)
    if (onR(SB.qual)) { G.Sys.cycleQuality(); G.sfx('card_select', { vol: 0.5 }); }
    if (onR(SB.fs)) G.Sys.toggleFullscreen();
    if (onR(SB.mute)) G.Sys.toggleMute();
    if (onR(SB.inst)) G.PWA.install();
    if (onR(SB.exp)) G.PWA.exportSave();
    if (onR(SB.imp)) G.PWA.importSave();
    if (onR(SB.back)) { cur = 'menu'; }
    return false;
  }
  function drawSettings(c) {
    var S = SV(); if (!S.settings) S.settings = (function () { try { return Assets.getVolume(); } catch (e) { return { master: 0.8, music: 0.6, sfx: 0.8 }; } })();
    bg(c, 'AJUSTES');
    SET.forEach(function (it, i) {
      G.txt(c, it[1], 200, 64 + i * 56 + 24, 20, '#ffd27a', 'left');
      U.button(c, setRect(i, 0), '-', { size: 26 });
      G.txt(c, Math.round(S.settings[it[0]] * 100) + '%', 660, 64 + i * 56 + 24, 20, '#fff', 'center');
      U.button(c, setRect(i, 1), '+', { size: 26 });
    });
    var on = '#2a6aa8', off = '#2c2438', Sy = G.Sys;
    U.button(c, SB.shake, 'Reducir sacudidas: ' + (S.settings.shake ? 'SÍ' : 'NO'), { size: 14, color: S.settings.shake ? on : off });
    U.button(c, SB.iso, 'Vista inclinada: ' + (G.Proj.iso ? 'SÍ' : 'NO'), { size: 14, color: G.Proj.iso ? on : off });
    U.button(c, SB.qual, 'Gráficos: ' + Sy.qualityLabel(), { size: 14, color: '#4a3a66', hot: '#6a5a86', border: '#8a7aa6' });
    U.button(c, SB.fs, Sy.isFullscreen() ? 'Salir de pantalla completa' : 'Pantalla completa', { size: 14, off: !Sy.fsSupported(), color: '#4a3a66', hot: '#6a5a86', border: '#8a7aa6', sub: Sy.fsSupported() ? null : 'no disponible aquí' });
    U.button(c, SB.mute, Sy.muted ? 'Silencio: SÍ' : 'Silencio: NO', { size: 14, color: Sy.muted ? '#7a3a3a' : off });
    U.button(c, SB.inst, Sy.standalone() ? 'App instalada' : 'Instalar app', { size: 14, off: Sy.standalone(), color: '#2a8a4a', hot: '#3aba66', border: '#9dffb4' });
    U.button(c, SB.exp, 'Exportar guardado', { size: 14, color: '#4a3a66', hot: '#6a5a86', border: '#8a7aa6' });
    U.button(c, SB.imp, 'Importar guardado', { size: 14, color: '#4a3a66', hot: '#6a5a86', border: '#8a7aa6' });
    U.button(c, SB.back, 'ATRÁS', { size: 20 });
    G.txt(c, Math.round(Sy.fps) + ' fps  -  render x' + (G.rs || 1).toFixed(2) + (G.Save.ok ? '' : '  -  ¡el navegador NO guarda! exporta tu progreso'), 480, 530, 10, G.Save.ok ? '#6f6480' : '#ff8a8a', 'center');
  }
})();
