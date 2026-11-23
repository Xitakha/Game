/* reto_ui.js - Interfaz del reto diario y de los objetivos (DESIGN-v10-retencion.md 1.5, 1.7, 1.10.7, 2.6 y textos de la sección 4).
   Paneles de la aldea (G.Panels los enruta aquí): 'reto' (reto del día, confirmación modal), 'kit' (ficha VER KIT: ARMADURA / FORJA / MANO, piezas "PRESTADO")
   y 'diario' (OBJETIVOS / HOGUERA). Pantalla de resultado del reto (G.Base), chip del HUD en partida, chips de la aldea (racha y reto) y cosméticos de la racha.
   Columna de 960 (G.column) con letra mínima 17 lógicos y botones de 66 de alto, como el resto de menús rehechos en T-F1-08. Entradas: chips de la aldea,
   MENÚ > RETO Y OBJETIVOS y la pestaña DIARIO de Vesper. */
(function () {
  'use strict';
  var G = window.G, RU = G.RetoUI = {}, U = G.UI, inp = G.input;
  function Dl() { return G.Daily; } function O() { return G.Obj; }
  function T(k) { return Dl().t.apply(null, arguments); }
  function OT(k) { return O().t.apply(null, arguments); }
  function SV() { return G.Save.data; }
  function onR(r) { return inp.hit('Mouse0') && U.inR(r, inp.mouse); }
  var R_CLOSE = { x: 890, y: 0, w: 66, h: 66 }, R_GO = { x: 470, y: 468, w: 476, h: 66 }, R_OBJ = { x: 14, y: 468, w: 440, h: 66 }, R_KIT = { x: 490, y: 176, w: 200, h: 66 };
  var R_YES = { x: 200, y: 320, w: 270, h: 66 }, R_NO = { x: 490, y: 320, w: 270, h: 66 }, R_BACK = { x: 706, y: 468, w: 240, h: 66 };
  var st = { modal: false, mt: 0, ktab: 0, dtab: 0, msg: '', msgT: 0 };
  function tabR(k) { return { x: 404 + k * 160, y: 0, w: 154, h: 66 }; }
  RU.rects = function () { return { go: R_GO, obj: R_OBJ, kit: R_KIT, yes: R_YES, no: R_NO, back: R_BACK, tab: tabR, close: R_CLOSE, row: dRow, reroll: dBtn, chips: chipRects, share: R_SHARE }; };   // pruebas
  function say(t) { st.msg = t; st.msgT = 3200; }
  RU.lastMsg = function () { return st.msg; };
  function bg(c, title) {
    c.fillStyle = 'rgb(10,5,16)'; c.fillRect(0, 0, G.W, G.H);
    G.txt(c, title, 14, 26, 24, '#ffd27a', 'left');
    U.button(c, R_CLOSE, 'X', { size: 22, color: '#7a2a3a', hot: '#c03a4a', border: '#ff8a8a' });
  }
  function drawMsg(c) {
    if (!(st.msgT > 0 && st.msg)) return;
    var ls = U.wrap(c, st.msg, 840, 17).slice(0, 2), h = ls.length * 22 + 12, y0 = 70;
    c.fillStyle = 'rgba(8,4,14,0.92)'; c.fillRect(50, y0, 860, h); c.strokeStyle = '#ffd27a'; c.lineWidth = 2; c.strokeRect(51, y0 + 1, 858, h - 2);
    ls.forEach(function (l, i) { G.txt(c, l, 480, y0 + 17 + i * 22, 17, '#ffe9a0', 'center'); });
  }
  var BN = { bosque: 'Bosque', cripta: 'Cripta', asfodelo: 'Asfódelo', tundra: 'Tundra', panal: 'Panal' };
  var PELC = ['', '#9a9a8a', '#d8b040', '#ff8a3c', '#ff5a3a', '#e05ac0'];
  function bname(id) { return ((G.Boss.DEFS[id] || {}).name || id).split(/[ ,]/)[0]; }
  // Reglas del día y kit armado: en caché por día y progreso (se piden en cada fotograma)
  var cache = { k: null };
  function today() {
    var D = Dl(), day = D.today(), kl = SV().bossKills || {}, k = day + '|' + G.Quests.unlockedBiomes().join() + '|' + Object.keys(kl).filter(function (x) { return kl[x] > 0; }).join() + '|' + (G.Kit.forced() || '');
    if (cache.k !== k) { var R = D.rules(day), b = G.Kit.build(R.kit, R.biome); cache = { k: k, R: R, b: b, v: G.Kit.view(b) }; }
    return cache;
  }
  RU.today = today;
  RU.reset = function () { cache.k = null; };

  // ============================================================= Panel RETO
  RU.open = function (name) {
    st.modal = false; st.msg = ''; st.msgT = 0;
    if (name === 'kit') st.ktab = 0;
    if (name === 'diario') { st.dtab = st.dtab || 0; if (O().isOpen()) { O().ensure(); O().markSeen(); } }
    if (name === 'reto' && Dl().isOpen()) {
      var D = SV().daily, d = Dl().today(), w = Dl().weekOf(d), tc = today();
      st.kitNew = D.reto.kit.seenWeek !== w; if (st.kitNew) { D.reto.kit.seenWeek = w; try { G.sfx('card_select', { vol: 0.6 }); } catch (e) { /* audio */ } }   // A10l: aviso de kit nuevo (etiqueta NUEVO junto al kit)
      D.reto.seenDay = d; G.Save.save();
    }
  };
  RU.update = function (name, dt) {
    if (st.msgT > 0) st.msgT -= dt;
    if (name === 'reto') return updReto();
    if (name === 'kit') return updKit();
    if (name === 'diario') return updDiario();
    return true;
  };
  RU.draw = function (c, name) {
    if (name === 'reto') drawReto(c);
    else if (name === 'kit') drawKit(c);
    else if (name === 'diario') drawDiario(c);
    drawMsg(c);
  };
  function updReto() {
    var D = Dl();
    if (st.modal) {
      st.mt += 16; if (st.mt < 200) return false;
      if (inp.hit('Escape') || onR(R_NO)) { st.modal = false; return false; }
      if (inp.hit('Enter') || onR(R_YES)) { st.modal = false; G.Aldea.setPanel(null); G.Panels.closeAll(); D.start(true); }
      return false;
    }
    if (inp.hit('Escape') || onR(R_CLOSE)) return true;
    if (!D.isOpen()) return false;
    if (onR(R_KIT)) { G.Panels.open('kit'); G.sfx('flip', { vol: 0.5 }); return false; }
    if (onR(R_OBJ)) { G.Panels.open('diario'); G.sfx('flip', { vol: 0.5 }); return false; }
    if (onR(R_GO) || inp.hit('Enter')) {
      if (D.canOfficial()) { st.modal = true; st.mt = 0; G.sfx('flip', { vol: 0.5 }); }
      else { G.Aldea.setPanel(null); G.Panels.closeAll(); D.start(false); }
    }
    return false;
  }
  function drawReto(c) {
    var D = Dl(), S = SV(), dy = S.daily;
    bg(c, T('title') + (D.isOpen() ? '  ·  ' + D.shortDate(D.today()) : ''));
    if (!D.ON || !D.isOpen()) { G.txt(c, D.ON ? T('closed') : T('off'), 480, 270, 17, '#ffe9a0', 'center'); return; }
    var tc = today(), R = tc.R, v = tc.v, y, i;
    G.txt(c, T('next', D.hm(D.msToNextDay())), 876, 26, 17, '#9dd8ff', 'right');
    if (st.modal) { drawConfirm(c, R, v); return; }   // la confirmación tapa la página entera (nada debajo)
    G.txt(c, T('motto'), 14, 58, 17, '#d8cfe8', 'left');
    // ---- izquierda: destino y mutadores
    G.txt(c, T('dest'), 14, 92, 17, '#b4a8c8', 'left');
    if (!(window.Assets && Assets.drawDestIcon && Assets.drawDestIcon(c, R.biome, 32, 130, 32, {}))) { c.fillStyle = '#6a5a80'; c.fillRect(16, 114, 32, 32); }
    G.txt(c, (BN[R.biome] || R.biome).toUpperCase() + '  ·  ' + bname(R.boss), 60, 118, 17, '#fff', 'left');
    G.txt(c, 'Peligro ' + G.Boss.ROMAN[R.peligro], 60, 142, 17, PELC[R.peligro], 'left');
    y = 170;
    if (R.novato) { U.wrap(c, T('soft'), 452, 17).slice(0, 2).forEach(function (l) { G.txt(c, l, 14, y, 17, '#9dffb4', 'left'); y += 22; }); }
    y += 6; G.txt(c, T('muts'), 14, y, 17, '#b4a8c8', 'left'); y += 24;
    R.mut.forEach(function (id) { var m = D.mut(id); U.wrap(c, m.name + ': ' + m.eff, 452, 17).slice(0, 2).forEach(function (l, k) { G.txt(c, l, 14, y, 17, k ? '#d8cfe8' : '#ffd27a', 'left'); y += 22; }); y += 4; });
    var best = dy.reto.best, md = dy.reto.medals;
    G.txt(c, best ? T('best', D.fmtN(best.score), D.medalName(best.medal).charAt(0) + D.medalName(best.medal).slice(1).toLowerCase(), D.shortDate(best.day)) : T('noBest'), 14, 400, 17, best ? '#ffe9a0' : '#b4a8c8', 'left');
    G.txt(c, T('medalsLine', md.oro || 0, md.plata || 0, md.bronce || 0), 14, 424, 17, '#c8b8e8', 'left');
    // ---- derecha: kit de la semana, baraja y premio
    G.txt(c, T('kitHead') + '  ·  ' + T('kitChange', D.dh(D.msToNextWeek())).toLowerCase(), 490, 92, 17, '#b4a8c8', 'left');
    G.txt(c, v.name.toUpperCase() + '  ·  ' + G.Kit.tagName(v.tags[0]) + ' y ' + G.Kit.tagName(v.tags[1]), 490, 118, 17, tc.b.kit.color, 'left');
    if (st.kitNew) { c.fillStyle = '#ffd24a'; c.fillRect(868, 107, 78, 22); G.txt(c, T('kitNew'), 907, 118, 17, '#2a1a00', 'center', '#ffd24a'); }
    G.txt(c, v.motto, 490, 140, 17, '#ffe9a0', 'left');
    G.txt(c, T('lent'), 490, 162, 17, '#d8cfe8', 'left');
    U.button(c, R_KIT, T('seeKit'), { size: 18, color: '#2a6a74', hot: '#3a9aaa', border: '#a8e8f0' });
    G.txt(c, 'Ancla: ' + G.Cards.def(R.anchor).short, 706, 196, 17, '#fff', 'left');
    G.txt(c, R.deck.length + ' cartas', 706, 222, 17, '#c8b8e8', 'left');
    var tx = 490; R.tags.forEach(function (tg) { try { Assets.drawWeakIcon(c, tg, tx + 8, 258, { size: 16 }); } catch (e) { c.fillStyle = G.TAGS[tg].color; c.fillRect(tx, 250, 16, 16); } tx += 26; });
    G.txt(c, R.tags.map(function (tg) { return G.Kit.tagName(tg).charAt(0) + G.Kit.tagName(tg).slice(1).toLowerCase(); }).join(', '), tx + 4, 258, 17, '#d8cfe8', 'left');
    G.txt(c, T('prizeHead'), 490, 292, 17, '#b4a8c8', 'left');
    ['prize1', 'prize2', 'prize3', 'prize4'].forEach(function (k, j) { G.txt(c, T(k), 490, 316 + j * 22, 17, j < 2 ? '#ffe9a0' : '#d8cfe8', 'left'); });
    // ---- botones
    U.button(c, R_OBJ, 'OBJETIVOS Y RACHA', { size: 18, color: '#4a3a66', hot: '#6a5a86', border: '#c8b8e8', sub: O().isOpen() ? O().summary().done + '/' + O().summary().n + ' de hoy' : null });
    var off = D.officialToday(), can = D.canOfficial(), test = D.isTest();
    U.button(c, R_GO, can ? T('go') : T('again'), { size: 20, sub: can ? T('goSub') : test ? T('againSubTest') : off ? T('againSub', D.medalName(off.medal).charAt(0) + D.medalName(off.medal).slice(1).toLowerCase(), D.fmtN(off.score)) : T('againBtnSub') });
  }
  function drawConfirm(c, R, v) {
    {
      U.panel(c, 170, 130, 620, 280, { border: '#ffd27a' });
      G.txt(c, T('confirm'), 480, 168, 22, '#ffd27a', 'center');
      G.txt(c, T('confirm2'), 480, 214, 17, '#fff', 'center');
      G.txt(c, T('mortal'), 480, 246, 17, '#ffb08a', 'center');
      G.txt(c, (BN[R.biome] || R.biome) + '  ·  Peligro ' + G.Boss.ROMAN[R.peligro] + '  ·  ' + v.name, 480, 278, 17, '#d8cfe8', 'center');
      U.button(c, R_YES, T('yes'), { size: 20, color: '#2a8a4a', hot: '#3aba66', border: '#9dffb4' });
      U.button(c, R_NO, T('no'), { size: 20, color: '#3a2f48', hot: '#5a4a68', border: '#8a7aa6' });
    }
  }

  // ============================================================= Ficha VER KIT
  function updKit() {
    if (inp.hit('Escape') || onR(R_CLOSE) || onR(R_BACK)) { G.Panels.open('reto'); return false; }
    for (var k = 0; k < 3; k++) if (onR(tabR(k))) { st.ktab = k; G.sfx('flip', { vol: 0.4 }); }
    if (inp.hit('Tab')) st.ktab = (st.ktab + 1) % 3;
    return false;
  }
  function lentTag(c, x, y) { c.fillStyle = '#ffd24a'; c.fillRect(x, y - 11, 112, 22); G.txt(c, T('lentTag'), x + 56, y, 17, '#2a1a00', 'center', '#ffd24a'); }
  function drawKit(c) {
    var tc = today(), v = tc.v, b = tc.b, R = tc.R, y, i;
    bg(c, 'KIT: ' + v.name.toUpperCase());
    [T('kitArmor'), T('kitForge'), T('kitHand')].forEach(function (t, k) { var on = st.ktab === k; U.button(c, tabR(k), t, { size: 17, color: on ? '#2a6aa8' : '#2c2438', hot: '#3a8ad0', border: on ? '#bfeaff' : '#6a5a80' }); });
    U.button(c, R_BACK, T('back'), { size: 20, color: '#2a6aa8', hot: '#3a8ad0', border: '#bfeaff' });
    if (st.ktab === 0) {
      G.txt(c, T('leveled', BN[R.biome] || R.biome, Math.round(v.stats ? v.stats.def : 0)) + '  ·  T' + b.tier + (b.ref ? ' +' + b.ref : ''), 14, 92, 17, '#ffe9a0', 'left');
      v.pieces.forEach(function (p, k) {
        y = 118 + k * 62;
        try { G.Smith.icon(c, p, 14, y, 48, b.ref); } catch (e) { c.fillStyle = '#4a3a66'; c.fillRect(14, y, 48, 48); }
        var s = G.ArmorData.SETS[p.set];
        G.txt(c, p.name, 74, y + 12, 17, '#fff', 'left');
        G.txt(c, G.ArmorData.SLOTS[p.slot] + '  ·  ' + (p.set === 'mini' ? (p.ut || '') : s.name), 74, y + 36, 17, s.color || '#c8b8e8', 'left');
        lentTag(c, 820, y + 12);   // todo el kit es prestado (y nivelado al bioma): no cuenta como descubierto ni se puede fabricar
      });
      y = 372; v.bonus.slice(0, 3).forEach(function (t) { U.wrap(c, t, 930, 17).slice(0, 2).forEach(function (l) { if (y < 456) G.txt(c, l, 14, y, 17, '#9dffb4', 'left'); y += 22; }); });
    } else if (st.ktab === 1) {
      G.txt(c, T('activeNodes', v.pfSpent), 14, 92, 17, '#ffe9a0', 'left');
      y = 116;
      v.active.forEach(function (n) { if (y < 340) { G.txt(c, '·  ' + n.name, 14, y, 17, '#fff', 'left'); y += 22; } });
      if (v.prov.length) { G.txt(c, (R.biome === 'tundra' ? 'Provisión de Tundra: ' : 'Provisión de Panal: ') + v.prov.join(', '), 14, y + 4, 17, '#9dd8ff', 'left'); y += 26; }
      if (v.later.length) { G.txt(c, T('harder'), 490, 92, 17, '#9a8fb0', 'left'); v.later.forEach(function (n, k) { if (k < 14) G.txt(c, '·  ' + n.name, 490, 116 + k * 22, 17, '#a89cc0', 'left'); }); }
    } else {
      G.txt(c, 'Ancla', 14, 92, 17, '#b4a8c8', 'left');
      G.Cards.drawCard(c, { id: R.anchor, lvl: 0 }, 14, 104, 90, 90, { nocd: true });
      G.txt(c, G.Cards.def(R.anchor).name, 118, 130, 17, '#fff', 'left');
      G.txt(c, G.Kit.tagName(v.tags[0]) + ' y ' + G.Kit.tagName(v.tags[1]), 118, 156, 17, tc.b.kit.color, 'left');
      y = 224;
      G.txt(c, T('sigFusion', v.fusion + ' (' + G.Kit.tagName(v.tags[0]).toLowerCase() + ' + ' + G.Kit.tagName(v.tags[1]).toLowerCase() + ')'), 14, y, 17, '#ffd27a', 'left'); y += 22;
      U.wrap(c, v.fusionDesc, 930, 17).slice(0, 2).forEach(function (l) { G.txt(c, l, 14, y, 17, '#d8cfe8', 'left'); y += 22; });
      y += 8; G.txt(c, T('dishL', v.dish), 14, y, 17, '#ffd0dc', 'left'); y += 22;
      U.wrap(c, v.dishDesc, 930, 17).slice(0, 2).forEach(function (l) { G.txt(c, l, 14, y, 17, '#d8cfe8', 'left'); y += 22; });
      y += 8; U.wrap(c, 'Baraja de hoy: ' + R.deck.map(function (id) { return G.Cards.def(id).short; }).join(', '), 930, 17).slice(0, 3).forEach(function (l) { if (y < 456) G.txt(c, l, 14, y, 17, '#c8b8e8', 'left'); y += 22; });
      lentTag(c, 820, 130);
    }
  }

  // ============================================================= Panel DIARIO (objetivos y racha)
  function dRow(i) { return { x: 14, y: (i < 3 ? 104 : 136) + i * 70, w: 932, h: 64 }; }
  function dBtn(i) { var r = dRow(i); return { x: r.x + r.w - 186, y: r.y - 1, w: 186, h: 66 }; }
  function updDiario() {
    if (inp.hit('Escape') || onR(R_CLOSE)) return true;
    for (var k = 0; k < 2; k++) if (onR(tabR(k))) { st.dtab = k; G.sfx('flip', { vol: 0.4 }); }
    if (inp.hit('Tab')) st.dtab = (st.dtab + 1) % 2;
    if (st.dtab === 0 && O().isOpen()) for (var i = 0; i < 3; i++) if (onR(dBtn(i))) { var r = O().reroll(i); if (r.msg) say(r.msg); G.sfx(r.ok ? 'card_select' : 'discard', { vol: 0.5 }); }
    return false;
  }
  function objRow(c, e, i, weekly, day) {
    var o = O().def(e.id), r = dRow(i), done = !!e.done, w = weekly ? 932 : 736;
    U.panel(c, r.x, r.y, w, r.h, { border: done ? '#7dff9a' : '#4a3a66' });
    var lab = weekly ? OT(o.d === 1 ? 'wdiff1' : 'wdiff2') : OT('diff' + o.d);
    G.txt(c, lab, r.x + 12, r.y + 18, 17, ['', '#9dffb4', '#ffd24a', '#ff9a6a'][o.d] || '#ffd24a', 'left');
    var lx = r.x + 12 + (lab.length + 2) * 10.2;
    G.txt(c, o.txt, lx, r.y + 18, 17, '#fff', 'left');
    G.txt(c, done ? OT('done') : Dl().fmtN(e.prog) + '/' + Dl().fmtN(e.goal), r.x + w - 12, r.y + 18, 17, done ? '#7dff9a' : '#ffe9a0', 'right');
    G.txt(c, O().rewardText(o, day), r.x + 12, r.y + 44, 17, '#d8cfe8', 'left');
    var bw = 220, bx = r.x + w - bw - 12; c.fillStyle = '#1a1226'; c.fillRect(bx, r.y + 40, bw, 8); c.fillStyle = done ? '#7dff9a' : '#ff9a3c'; c.fillRect(bx, r.y + 40, bw * G.clamp(e.prog / e.goal, 0, 1), 8);
  }
  function drawDiario(c) {
    var S = SV(), ob = S.daily.obj, sk = S.daily.streak;
    bg(c, 'DIARIO');
    [OT('tabObj'), OT('tabFire')].forEach(function (t, k) { var on = st.dtab === k; U.button(c, tabR(k), t, { size: 17, color: on ? '#2a6aa8' : '#2c2438', hot: '#3a8ad0', border: on ? '#bfeaff' : '#6a5a80' }); });
    if (st.dtab === 0) {
      if (!O().isOpen()) { G.txt(c, OT('closed'), 480, 270, 17, '#ffe9a0', 'center'); return; }
      G.txt(c, OT('today', Dl().hm(Dl().msToNextDay())), 14, 84, 17, '#b4a8c8', 'left');
      var used = O().rerollUsed();
      ob.list.forEach(function (e, i) {
        objRow(c, e, i, false, ob.day);
        U.button(c, dBtn(i), OT('reroll'), { size: 17, off: used || !!e.done, color: '#4a3a66', hot: '#6a5a86', border: '#c8b8e8', sub: used ? OT('rerollUsed') : OT('rerollSub') });
      });
      G.txt(c, OT('week'), 14, 336, 17, '#b4a8c8', 'left');
      ob.wlist.forEach(function (e, i) { objRow(c, e, 3 + i, true, ob.day); });
    } else {
      var nm = O().nextMile();
      G.txt(c, OT('fireHead'), 14, 92, 17, '#ffd27a', 'left');
      G.txt(c, OT('fireState', sk.n, sk.best, sk.wood), 14, 118, 17, '#fff', 'left');
      G.txt(c, O().playedToday() ? OT('chipOn') : OT('chipOff'), 14, 142, 17, O().playedToday() ? '#9dffb4' : '#ffb08a', 'left');
      G.txt(c, OT('fireHelp'), 14, 166, 17, '#d8cfe8', 'left');
      G.txt(c, OT('woodTxt', sk.wood), 14, 190, 17, '#c8b8e8', 'left');
      G.txt(c, nm ? OT('nextMile', nm) : OT('top'), 14, 222, 17, '#ffe9a0', 'left');
      O().MILES.forEach(function (m, k) {
        var got = !!sk.miles[m], y = 262 + k * 40;
        c.fillStyle = got ? '#ffb347' : '#3a3046'; c.beginPath(); c.arc(28, y, 9, 0, 6.283); c.fill(); c.strokeStyle = '#1b1124'; c.lineWidth = 2; c.stroke();
        G.txt(c, 'Día ' + m + ': ' + OT('mile' + m) + (got ? '  (' + OT('got') + ')' : ''), 46, y, 17, got ? '#ffe9a0' : '#a89cc0', 'left');
      });
    }
  }

  // ============================================================= Pantalla de resultado del reto (variante de G.Base.drawEnd)
  var END_RETRY = { x: 20, y: 456, w: 600, h: 68 }, END_BASE = { x: 636, y: 456, w: 304, h: 68 }, R_SHARE = { x: 790, y: 96, w: 140, h: 66 };
  var shareMsg = '', shareT = 0, endT = 0, endFor = null;
  RU.endActive = function () { return !!(G.Daily && G.Daily.endRes) && G.state === 'gameover'; };
  RU.updateEnd = function () {
    var r = Dl().endRes; if (endFor !== r) { endFor = r; endT = 0; shareMsg = ''; }
    endT += G.STEP; if (shareT > 0) shareT -= G.STEP;
    if (endT < 600) return;
    var click = inp.hit('Mouse0'), m = inp.mouse;
    if (click && U.inR(R_SHARE, m)) { Dl().share(function (t) { shareMsg = t; shareT = 2600; }); return; }
    if (inp.hit('KeyR', 'Enter') || (click && U.inR(END_RETRY, m))) { Dl().retry(); return; }
    if (inp.hit('KeyB', 'Escape') || (click && U.inR(END_BASE, m))) { G.Base.open(true); }
  };
  RU.drawEnd = function (c) {
    var r = Dl().endRes, e = r.entry, sc = r.sc, R = r.rules, p = G.player, D = Dl(), i, y;
    c.fillStyle = e.won ? 'rgb(22,16,4)' : 'rgb(14,8,22)'; c.fillRect(0, 0, G.W, G.H);
    G.txt(c, e.medal === 3 ? T('won') : T('ended'), G.W / 2, 32, 34, e.medal === 3 ? '#ffd24a' : '#e0c8ff', 'center');
    G.txt(c, T('sub', D.shortDate(R.day), BN[R.biome] || R.biome, G.Boss.ROMAN[R.peligro]) + (r.test ? '  ·  PRUEBA' : ''), G.W / 2, 66, 17, '#fff', 'center');
    // ---- izquierda: mano final, poderes y jefe
    G.txt(c, T('hand'), 20, 100, 17, '#b4a8c8', 'left');
    for (i = 0; i < p.hand.length; i++) { var sr = G.Cards.slotRect(i, 'end'); if (p.hand[i]) G.Cards.drawCard(c, { id: p.hand[i].id, lvl: p.hand[i].lvl }, sr.x, sr.y, sr.w, sr.h, { nocd: true }); else G.Cards.drawEmptySlot(c, sr.x, sr.y, sr.w, sr.h, ''); }
    var acts = (p.actives || []).filter(Boolean); y = 256;
    if (acts.length) { G.txt(c, T('powers'), 20, y, 17, '#b4a8c8', 'left'); y += 24; acts.slice(0, 3).forEach(function (a) { var d = G.Fusion.recipe(a.id); G.txt(c, (d ? d.short : a.id) + ' Nv' + a.lvl + '  ·  ' + a.uses + (a.uses === 1 ? ' uso' : ' usos'), 20, y, 17, '#ffe9a0', 'left'); y += 22; }); }
    var bl = bname(R.boss).toUpperCase() + (e.won ? ' vencido' : e.bossFrac > 0 ? ' al ' + Math.round((1 - e.bossFrac) * 100) + ' % de vida' : ': ' + T('notReached')) + '  ·  partes ' + e.parts;
    c.fillStyle = 'rgba(0,0,0,0.35)'; c.fillRect(14, 380, 462, 64);
    U.wrap(c, bl, 450, 17).slice(0, 2).forEach(function (l, k) { G.txt(c, l, 22, 398 + k * 22, 17, e.won ? '#ffd24a' : '#ff9a8a', 'left'); });
    // ---- derecha: medalla, desglose, total, récord y premio
    U.panel(c, 500, 84, 440, 360, { border: ['#8a7a9a', '#c08040', '#c8d0dc', '#ffd24a'][e.medal] });
    drawMedal(c, 552, 128, e.medal, 30);
    G.txt(c, D.medalName(e.medal), 586, 128, 20, ['#c8b8e8', '#e8a860', '#e8eef8', '#ffd24a'][e.medal], 'left');
    U.button(c, R_SHARE, T('share'), { size: 17, color: '#2a6a74', hot: '#3a9aaa', border: '#a8e8f0' });
    y = 184;
    [['rTime', sc.time], ['rKills', sc.kills], ['rGuard', sc.guard], ['rBoss', sc.boss], ['rWin', sc.win]].forEach(function (row) { G.txt(c, T(row[0]), 516, y, 17, '#d8cfe8', 'left'); G.txt(c, D.fmtN(row[1]), 924, y, 17, '#fff', 'right'); y += 22; });
    G.txt(c, T('rMul', String(sc.mul).replace('.', ',')), 516, y, 17, '#9dd8ff', 'left'); y += 28;
    G.txt(c, T('rTotal', D.fmtN(sc.total)), 516, y, 22, '#ffd27a', 'left'); y += 28;
    var best = SV().daily.reto.best;
    if (r.official && r.isNew) G.txt(c, T('newRecord'), 516, y, 17, '#9dffb4', 'left');
    else if (best) G.txt(c, T('yourBest', D.fmtN(best.score)), 516, y, 17, '#c8b8e8', 'left');
    y += 22;
    var pl = r.pay ? (r.test ? T('testPay', r.pay.brasas) : r.pay.rare ? T('payRare', r.pay.brasas, r.pay.parts) : T('pay', r.pay.brasas, r.pay.parts)) : T('retryNo', D.medalName(e.medal).charAt(0) + D.medalName(e.medal).slice(1).toLowerCase());
    U.wrap(c, pl, 408, 17).slice(0, 2).forEach(function (l) { G.txt(c, l, 516, y, 17, r.pay ? '#ffb347' : '#b4a8c8', 'left'); y += 22; });
    if (r.obj && r.obj.n) G.txt(c, T('objLine', r.obj.done, r.obj.n), 516, Math.min(y, 432), 17, '#9dffb4', 'left');
    if (shareT > 0 && shareMsg) G.txt(c, shareMsg, 720, 176, 17, '#9dffb4', 'center');
    U.button(c, END_RETRY, T('againBtn'), { size: 22, sub: T('againBtnSub') });
    U.button(c, END_BASE, T('toVillage'), { size: 20, color: '#2a6aa8', hot: '#3a8ad0', border: '#bfeaff', sub: T('toVillageSub') });
  };
  // Medalla con silueta distinta por grado (no solo color): círculo, círculo con 1 / 2 cintas, estrella
  function drawMedal(c, x, y, m, r) {
    var col = ['#8a7a9a', '#c87a3a', '#c8d0dc', '#ffd24a'][m] || '#8a7a9a';
    c.save(); c.strokeStyle = '#1b1124'; c.lineWidth = 3;
    if (m >= 1) { c.fillStyle = '#7a2a3a'; c.fillRect(x - r * 0.6, y - r * 1.3, r * 0.4, r * 0.8); if (m >= 2) { c.fillStyle = '#2a4a8a'; c.fillRect(x + r * 0.2, y - r * 1.3, r * 0.4, r * 0.8); } }
    c.fillStyle = col; c.beginPath();
    if (m === 3) { for (var k = 0; k < 10; k++) { var a = -Math.PI / 2 + k * Math.PI / 5, rr = k % 2 ? r * 0.5 : r; c.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr); } c.closePath(); }
    else c.arc(x, y, r * 0.8, 0, 6.283);
    c.fill(); c.stroke(); c.restore();
  }
  RU.drawMedal = drawMedal;

  // ============================================================= HUD en partida: chip "RETO  1.230" (puntos en vivo sin multiplicador) y medalla asegurada
  RU.drawHud = function (c) {
    if (!G.daily) return;
    var sc = Dl().live(); if (!sc) return;
    var wide = G.hudWide(), A = wide ? G.anchor() : null, cx = wide ? A.CX : G.W / 2, y = wide ? A.T + 62 : 60, sz = wide ? 16 : 13;
    var txt = (G.daily.test ? T('chipTest', Dl().fmtN(sc.base)) : T('chip', Dl().fmtN(sc.base)));
    c.save(); c.font = 'bold ' + sz + 'px "Courier New", monospace'; var w = Math.ceil(c.measureText(txt).width) + 44;
    c.fillStyle = 'rgba(10,6,18,0.72)'; c.fillRect(Math.round(cx - w / 2), y - 13, w, 26); c.strokeStyle = '#ffd27a'; c.lineWidth = 2; c.strokeRect(Math.round(cx - w / 2) + 1, y - 12, w - 2, 24); c.restore();
    drawMedal(c, cx - w / 2 + 16, y + 1, sc.medal, 8);
    G.txt(c, txt, cx + 10, y, sz, '#ffe9a0', 'center');
  };

  // ============================================================= Aldea: chips de la racha y del reto (abajo, junto al botón PORTAL), marcas y cosméticos
  function chipRects() {
    var ca = G.colAnchor(), y = ca.B - 66, x = ca.L + 128;
    return { fire: { x: x, y: y, w: 236, h: 66 }, reto: { x: x + 244, y: y, w: 230, h: 66 } };
  }
  RU.chipRects = chipRects;
  RU.chipsOn = function () { return O().isOpen() || Dl().isOpen(); };
  RU.aldeaClick = function (m) {   // true si el toque es de un chip (abre su panel)
    if (!RU.chipsOn()) return false;
    var r = chipRects();
    if (O().isOpen() && U.inR(r.fire, m)) { G.Aldea.openPanel('diario'); return true; }
    if (Dl().isOpen() && U.inR(r.reto, m)) { G.Aldea.openPanel('reto'); return true; }
    return false;
  };
  RU.drawChips = function (c) {
    if (!RU.chipsOn()) return;
    var r = chipRects(), sk = SV().daily.streak, D = Dl();
    if (O().isOpen()) {
      var on = O().playedToday(), un = O().unseen();
      U.button(c, r.fire, OT('chipName', sk.n), { size: 18, color: on ? '#7a3a1a' : '#3a2a3a', hot: '#9a5a2a', border: un ? '#ffd24a' : on ? '#ffb347' : '#8a7aa6', sub: on ? OT('chipOn') : OT('chipOff') });
      drawFlame(c, r.fire.x + 20, r.fire.y + 33, on, sk.n >= 28);
    }
    if (D.isOpen()) {
      var off = D.officialToday(), pend = !D.claimed();
      U.button(c, r.reto, T('chipAldea'), { size: 18, color: pend ? '#8a6a1a' : '#2c2438', hot: '#b88a2a', border: pend ? '#ffd24a' : '#8a7aa6', sub: pend ? T('chipReady') : off ? T('chipDone', D.medalName(off.medal).charAt(0) + D.medalName(off.medal).slice(1).toLowerCase()) : T('chipDone', '-') });
      if (pend) drawMedal(c, r.reto.x + 20, r.reto.y + 36, 3, 9);
    }
  };
  function drawFlame(c, x, y, lit, big) {
    var t = Date.now() / 140, h = (lit ? 14 : 8) * (big ? 1.3 : 1) + Math.sin(t) * 2;
    c.save(); c.fillStyle = lit ? '#ff9a3c' : '#6a5a6a'; c.beginPath(); c.moveTo(x - 7, y + 8); c.quadraticCurveTo(x - 8, y - h * 0.4, x, y - h); c.quadraticCurveTo(x + 8, y - h * 0.4, x + 7, y + 8); c.closePath(); c.fill();
    if (lit) { c.fillStyle = '#ffe9a0'; c.beginPath(); c.arc(x, y + 3, 3, 0, 6.283); c.fill(); }
    c.restore();
  }
  // Cosméticos de la racha alrededor de la hoguera (480, 390): farolillos (3 y 7), guirnalda (14), chispas doradas (21) y hoguera mayor (28). Solo dibujo
  RU.drawVillage = function (c, now) {
    var ms = (SV().daily && SV().daily.streak.miles) || {}, x0 = 480, y0 = 390, i;
    if (!ms[3]) return;
    c.save();
    var lamp = function (x, y, k) { c.fillStyle = '#1b1124'; c.fillRect(x - 1, y - 18, 2, 18); c.fillStyle = '#ffb347'; c.globalAlpha = 0.8 + 0.2 * Math.sin(now / 300 + k); c.fillRect(x - 5, y - 4, 10, 12); c.globalAlpha = 1; c.strokeStyle = '#1b1124'; c.lineWidth = 2; c.strokeRect(x - 5, y - 4, 10, 12); };
    lamp(x0 - 44, y0 + 6, 0); if (ms[7]) lamp(x0 + 44, y0 + 6, 1);
    if (ms[14]) { c.strokeStyle = '#3a2a1a'; c.lineWidth = 2; c.beginPath(); c.moveTo(250, 300); c.quadraticCurveTo(480, 340, 710, 300); c.stroke(); for (i = 0; i < 11; i++) { var gx = 270 + i * 42, gy = 300 + Math.sin(i / 10 * 3.14) * 26; c.fillStyle = i % 2 ? '#ffb347' : '#ff7a5a'; c.globalAlpha = 0.85 + 0.15 * Math.sin(now / 260 + i); c.beginPath(); c.arc(gx, gy + 4, 4, 0, 6.283); c.fill(); c.globalAlpha = 1; } }
    if (ms[21]) for (i = 0; i < 6; i++) { var u = ((now / 1600) + i / 6) % 1; c.fillStyle = 'rgba(255,215,90,' + (1 - u) + ')'; c.fillRect(x0 + Math.sin(i * 2.1 + u * 6) * 14, y0 - 20 - u * 60, 3, 3); }
    if (ms[28]) { var g = c.createRadialGradient(x0, y0 - 10, 4, x0, y0 - 10, 70); g.addColorStop(0, 'rgba(255,200,110,0.35)'); g.addColorStop(1, 'rgba(255,120,40,0)'); c.fillStyle = g; c.fillRect(x0 - 70, y0 - 80, 140, 140); }
    c.restore();
  };
})();
