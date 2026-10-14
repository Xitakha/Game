/* panels.js - Paneles de la aldea (todo en canvas 960x540, botones >= 44 px): Tablón de Vesper, Mercader Rufo (trueque / vender / comprar),
   Portal (mano al salir, anclas, duración, encargo, SALIR), Archivo de Ulalume (colección + anclas, provisional hasta la Fase 2b), Menú y Ajustes.
   La forja de Grum vive en tree.js (P.open('forge') la abre). Interfaz: P.open(nombre), P.update(dt) -> true si hay que cerrar, P.draw(c). */
(function () {
  'use strict';
  var G = window.G, P = G.Panels = {}, U = G.UI, inp = G.input, L = G.Loot;
  var cur = null, msg = '', msgT = 0, confirm = '', confirmT = 0;
  var R_CLOSE = { x: 904, y: 2, w: 52, h: 42 };
  var st = { rt: 0, give: 'wick', get: 'thread', qty: 1, buy: 'thread', csel: 0 };
  var LENS = [7, 9, 10];

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
  };
  P.closeAll = function () { cur = null; };
  P.current = function () { return cur; };

  P.update = function (dt) {
    if (msgT > 0) msgT -= dt; if (confirmT > 0) confirmT -= dt; else confirm = '';
    if (cur === 'forge') return G.Tree.update(dt);
    var esc = inp.hit('Escape'), cl = onR(R_CLOSE);
    if (cur === 'menu') { if (esc) return true; }
    else if (cur === 'settings') { if (esc || cl) { cur = 'menu'; return false; } }
    else if (cur === 'archive' && G.Aldea.fromMenu) { if (esc || cl) { G.Aldea.fromMenu = false; cur = 'menu'; return false; } }
    else if (esc || cl) return true;
    if (cur === 'vesper') return updVesper();
    if (cur === 'rufo') return updRufo();
    if (cur === 'portal') return updPortal();
    if (cur === 'archive') return updArchive();
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
    else if (cur === 'menu') drawMenu(c);
    else if (cur === 'settings') drawSettings(c);
  };

  // ============================================================= VESPER
  function qRect(i) { return { x: 20, y: 76 + i * 128, w: 920, h: 116 }; }
  function qBtn(i) { var r = qRect(i); return { x: r.x + r.w - 196, y: r.y + 30, w: 178, h: 56 }; }
  function qAction(i) {
    var Q = G.Quests, d = Q.DEFS[i], act = Q.active();
    if (act && act.id === d.id) {
      if (Q.isReady()) {
        var r = Q.claim(); if (r) { say('Entregado: ' + r.text + '.'); G.sfx('card_select', { vol: 0.8 }); try { G.Snd.play('fuse'); } catch (e) { /* audio */ } }
      } else if (confirm === 'q' + i) { Q.abandon(); confirm = ''; say('Encargo abandonado (el progreso se pierde).'); }
      else { confirm = 'q' + i; confirmT = 3000; say('Pulsa otra vez para abandonar (pierdes el progreso).'); }
    } else if (act) say('Ya tienes un encargo activo. Entrégalo o abandónalo.');
    else { Q.accept(d.id); say('Encargo aceptado: ' + d.target + ' aparece antes y más a menudo.'); G.sfx('card_select', { vol: 0.7 }); }
  }
  function updVesper() {
    for (var i = 0; i < 3; i++) if (inp.hit('Digit' + (i + 1)) || onR(qBtn(i))) qAction(i);
    return false;
  }
  function drawVesper(c) {
    var Q = G.Quests, act = Q.active();
    bg(c, 'TABLÓN DE ENCARGOS  -  Vesper'); header(c, 560); G.Tree.pfIcon(c, 720, 24, 10); G.txt(c, 'PF ' + G.Tree.pfFree(), 738, 24, 16, '#ffd24a', 'left');
    Q.DEFS.forEach(function (d, i) {
      var r = qRect(i), b = qBtn(i), isA = act && act.id === d.id, ready = isA && Q.isReady(), prog = Q.progress(d.id);
      U.panel(c, r.x, r.y, r.w, r.h, { border: ready ? '#7dff9a' : isA ? '#ffd24a' : '#4a3a66' });
      G.txt(c, '[' + (i + 1) + '] ' + d.name, r.x + 16, r.y + 22, 19, '#ffd27a', 'left');
      if (d.tutorial) G.txt(c, 'TUTORIAL', r.x + 16, r.y + 44, 10, '#9dffb4', 'left');
      G.txt(c, d.desc, r.x + 16, r.y + 60, 12, '#d8cfe8', 'left');
      G.txt(c, 'Recompensa: ' + Q.rewardText(d) + (Q.times(d.id) ? '   (hecho ' + Q.times(d.id) + 'x; el PF se repite a ' + d.pfRepeat + ')' : ''), r.x + 16, r.y + 82, 12, '#ffe9a0', 'left');
      var bw = 480; c.fillStyle = '#1a1226'; c.fillRect(r.x + 16, r.y + 96, bw, 10);
      c.fillStyle = ready ? '#7dff9a' : '#ff9a3c'; c.fillRect(r.x + 16, r.y + 96, bw * G.clamp(prog / d.goal, 0, 1), 10);
      G.txt(c, (isA ? prog : 0) + '/' + d.goal + ' ' + d.label + (isA ? '' : '  (no activo)'), r.x + bw + 28, r.y + 101, 11, '#d8cfe8', 'left');
      var label = ready ? 'ENTREGAR' : isA ? (confirm === 'q' + i ? 'SEGURO?' : 'ABANDONAR') : 'ACEPTAR';
      U.button(c, b, label, { size: 16, off: !isA && !!act, color: ready ? '#2a8a4a' : isA ? '#7a3a3a' : '#c4601c', hot: ready ? '#3aba66' : '#ff9a3c' });
    });
    G.txt(c, 'Un encargo a la vez. El enemigo objetivo pesa x2,5 en el director y entra antes (máx. 2:30). El progreso se conserva entre expediciones.', 20, 482, 11, '#9a8fb0', 'left');
    G.txt(c, 'Esc: volver', 20, 502, 11, '#6f6480', 'left');
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
  function lenRect(i) { return { x: 650 + i * 98, y: 100, w: 92, h: 56 }; }
  var R_GO = { x: 650, y: 440, w: 290, h: 76 };
  // Destino (bioma): decide el jefe. Cripta se abre al vencer al Pastor; Asfodelo al vencer al jefe de la Cripta (J2, aún sin jefe propio)
  var BIOMES = [{ id: 'bosque', name: 'BOSQUE', boss: 'El Pastor Corrupto' }, { id: 'cripta', name: 'CRIPTA', boss: 'El Pastor (Karceron llega en J2)', need: 'pastor', needName: 'el Pastor' },
    { id: 'asfodelo', name: 'ASFODELO', boss: 'Letea (J2, sin jefe aún)', need: 'karceron', needName: 'Karceron' }];
  function biomeRect(i) { return { x: 650 + i * 98, y: 376, w: 92, h: 50 }; }
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
    G.txt(c, 'DURACIÓN', 650, 86, 12, '#9a8fb0', 'left');
    var subs = { 7: 'corta', 9: 'estándar', 10: 'larga' };
    LENS.forEach(function (n, k) { var on = S.len === n; U.button(c, lenRect(k), n + ' min', { size: 17, color: on ? '#2a6aa8' : '#2c2438', hot: '#3a8ad0', border: on ? '#bfeaff' : '#6a5a80', sub: subs[n] }); });
    G.txt(c, 'Jefe a los ' + G.fmtTime(S.len * 60000 * 7.5 / 9) + '. Más tiempo = más botín.', 650, 172, 11, '#9a8fb0', 'left');
    // encargo y compras pendientes
    U.panel(c, 650, 190, 290, 104);
    G.txt(c, 'ENCARGO ACTIVO', 662, 208, 12, '#9a8fb0', 'left');
    var ql = Q.statusLine();
    var ls = U.wrap(c, ql || 'Ninguno. Vesper tiene encargos en el Tablón.', 266, 12);
    for (i = 0; i < ls.length && i < 3; i++) G.txt(c, ls[i], 662, 230 + i * 16, 12, ql ? '#ffe9a0' : '#8a7f96', 'left');
    if (Q.target()) G.txt(c, 'Objetivo: pesa x2,5 y llega antes', 662, 282, 10, '#9dffb4', 'left');
    U.panel(c, 650, 300, 290, 50);
    G.txt(c, 'COMPRAS PARA ESTA SALIDA', 662, 314, 11, '#9a8fb0', 'left');
    G.txt(c, (S.pending.tonic ? 'Tónico (+40 Ceniza)  ' : '') + (S.pending.magnet ? 'Imán x1,5' : '') || '', 662, 335, 12, '#ffe9a0', 'left');
    if (!S.pending.tonic && !S.pending.magnet) G.txt(c, 'Ninguna (Rufo las vende)', 662, 335, 12, '#8a7f96', 'left');
    var cb = BIOMES.filter(function (b) { return b.id === (S.biome || 'bosque'); })[0] || BIOMES[0];
    G.txt(c, 'DESTINO  -  Jefe: ' + cb.boss, 650, 364, 11, '#9a8fb0', 'left');
    BIOMES.forEach(function (b, k) {
      var open = biomeOpen(b), on = (S.biome || 'bosque') === b.id && open;
      U.button(c, biomeRect(k), open ? b.name : '? ' + b.name, { size: 13, color: on ? '#2a6aa8' : open ? '#2c2438' : '#1a1422', hot: '#3a8ad0', border: on ? '#bfeaff' : open ? '#6a5a80' : '#3a3046', off: !open, sub: open ? (on ? 'elegido' : 'Peligro I') : 'bloqueado' });
    });
    G.txt(c, 'Peligro I (II-V: próximamente)', 650, 434, 10, '#5a4f68', 'left');
    var names = S.anchors.map(function (a) { return G.Cards.def(a).short; }).join(' + ') || 'sin anclas';
    U.button(c, R_GO, 'SALIR A LA EXPEDICIÓN', { size: 19, sub: 'Enter  -  anclas: ' + names });
  }

  // ============================================================= ARCHIVO (Ulalume provisional) / COLECCIÓN
  var CELL = { w: 62, h: 84, gx: 66, gy: 92, x0: 14, y0: 60, cols: 9 };
  function cellRect(i) { return { x: CELL.x0 + (i % CELL.cols) * CELL.gx, y: CELL.y0 + Math.floor(i / CELL.cols) * CELL.gy, w: CELL.w, h: CELL.h }; }
  var R_ANC = { x: 626, y: 280, w: 310, h: 52 };
  function updArchive() {
    var defs = G.Cards.defs, i;
    if (inp.hit('ArrowRight', 'KeyD')) st.csel = (st.csel + 1) % defs.length;
    if (inp.hit('ArrowLeft', 'KeyA')) st.csel = (st.csel + defs.length - 1) % defs.length;
    if (inp.hit('ArrowDown', 'KeyS')) st.csel = Math.min(defs.length - 1, st.csel + CELL.cols);
    if (inp.hit('ArrowUp', 'KeyW')) st.csel = Math.max(0, st.csel - CELL.cols);
    if (inp.hit('KeyE', 'Enter') || onR(R_ANC)) { toggleAnchor(defs[st.csel].id); }
    for (i = 0; i < defs.length; i++) if (onR(cellRect(i))) { st.csel = i; G.sfx('flip', { vol: 0.4 }); }
    for (i = 0; i < G.B.anchorSlots; i++) if (onR(handRect2(i)) && SV().anchors[i]) { SV().anchors.splice(i, 1); G.Save.save(); }
    return false;
  }
  function handRect2(i) { return { x: 20 + i * 84, y: 410, w: 72, h: 96 }; }
  function nodeFor(card) { return G.Tree.NODES.filter(function (n) { return n.card === card && n.type === 'C'; })[0]; }
  function drawArchive(c) {
    var defs = G.Cards.defs, S = SV(), i, d = defs[st.csel], id = d.id, rank = G.Save.rank(id), tc = G.TAGS[d.tag].color;
    bg(c, 'ARCHIVO  -  Ulalume (colección y anclas)');
    for (i = 0; i < defs.length; i++) {
      var r = cellRect(i), rk = G.Save.rank(defs[i].id), isA = S.anchors.indexOf(defs[i].id) >= 0;
      G.Cards.drawCard(c, { id: defs[i].id, lvl: 0 }, r.x, r.y, r.w, r.h, { nocd: true, dim: rk === 0, glow: i === st.csel ? '#ffe9a0' : null });
      if (i === st.csel) { c.strokeStyle = '#ffe9a0'; c.lineWidth = 3; c.strokeRect(r.x - 2, r.y - 2, r.w + 4, r.h + 4); }
      if (rk === 0) { c.fillStyle = '#0c0814'; c.fillRect(r.x + r.w - 20, r.y + 4, 16, 14); c.fillStyle = '#9a8fb0'; c.fillRect(r.x + r.w - 18, r.y + 7, 12, 9); }
      if (isA) { c.fillStyle = '#ffd24a'; c.fillRect(r.x, r.y + r.h - 16, r.w, 16); G.txt(c, 'ANCLA', r.x + r.w / 2, r.y + r.h - 8, 11, '#2a1a00', 'center', '#ffd24a'); }
    }
    U.panel(c, 614, 56, 330, 290, { border: tc });
    G.Cards.drawCard(c, { id: id, lvl: 0 }, 626, 66, 62, 84, { nocd: true });
    G.txt(c, d.name, 700, 80, 17, '#ffd27a', 'left');
    G.txt(c, G.TAGS[d.tag].name + ' - ' + (d.type === 'attack' ? 'ATAQUE' : 'PASIVA'), 700, 101, 12, tc, 'left');
    G.txt(c, rank ? 'RANGO ' + U.roman(rank) : 'BLOQUEADA', 700, 121, 13, rank ? '#fff' : '#ff8a8a', 'left');
    var ls = U.wrap(c, d.desc, 306, 11);
    for (i = 0; i < ls.length && i < 3; i++) G.txt(c, ls[i], 626, 168 + i * 14, 11, '#d8cfe8', 'left');
    var how = rank ? 'Mejoras de rango: forja de Grum.' : (L.classic(id) ? 'Se desbloquea con receta en Grum > CLÁSICA.' : 'Se desbloquea en el árbol de Grum: ' + (nodeFor(id) ? nodeFor(id).name + '.' : '.'));
    var hl = U.wrap(c, how, 306, 11); for (i = 0; i < hl.length && i < 2; i++) G.txt(c, hl[i], 626, 220 + i * 14, 11, '#9dffb4', 'left');
    var isAnchor = S.anchors.indexOf(id) >= 0;
    U.button(c, R_ANC, isAnchor ? 'QUITAR ANCLA' : 'FIJAR ANCLA', { off: !rank, color: '#a8801a', hot: '#d8a82a', size: 16, sub: '[E]' });
    G.txt(c, 'TU MANO AL SALIR', 20, 394, 12, '#9a8fb0', 'left');
    for (i = 0; i < 5; i++) {
      var hr = handRect2(i), isAn = i < G.B.anchorSlots, a = S.anchors[i];
      if (isAn && a) G.Cards.drawCard(c, { id: a, lvl: 0 }, hr.x, hr.y, hr.w, hr.h, { nocd: true });
      else if (isAn) G.Cards.drawEmptySlot(c, hr.x, hr.y, hr.w, hr.h, '+');
      else G.Cards.drawEmptySlot(c, hr.x, hr.y, hr.w, hr.h, '?');
    }
    G.txt(c, G.B.anchorSlots + ' anclas. Flechas: elegir  -  E: fijar  -  Esc: volver', 450, 430, 12, '#9a8fb0', 'left');
    G.txt(c, 'Ulalume, la archivista, abrirá tus loadouts en la Fase 2b.', 450, 450, 11, '#6f6480', 'left');
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
      confirm = 'del'; confirmT = 3000; say('Pulsa otra vez para BORRAR todo el progreso.');
    }
    return false;
  }
  function drawMenu(c) {
    var S = SV();
    bg(c, 'MENÚ');
    G.txt(c, 'Expediciones ' + S.runs + '   Victorias ' + S.wins + (S.pity > 0 ? '   Rara +' + (S.pity * 100).toFixed(1) + '%' : ''), 480, 88, 13, '#9a8fb0', 'center');
    U.button(c, MB(0), 'COLECCIÓN', { size: 20, color: '#2a6aa8', hot: '#3a8ad0', border: '#bfeaff' });
    U.button(c, MB(1), 'AJUSTES', { size: 20, color: '#4a3a66', hot: '#6a5a86', border: '#8a7aa6' });
    U.button(c, MB(2), confirm === 'del' ? 'SEGURO? PULSA DE NUEVO' : 'BORRAR PROGRESO', { size: 18, color: confirm === 'del' ? '#a02030' : '#3a2f48', hot: '#c03040', border: '#8a6a8a' });
    U.button(c, MB(3), 'CERRAR [Esc]', { size: 20 });
  }
  var SET = [['master', 'Volumen general'], ['music', 'Música'], ['sfx', 'Efectos']];
  function setRect(i, plus) { return { x: plus ? 700 : 560, y: 120 + i * 80, w: 60, h: 56 }; }
  function updSettings() {
    var S = SV();
    if (!S.settings) S.settings = (function () { try { return Assets.getVolume(); } catch (e) { return { master: 0.8, music: 0.6, sfx: 0.8 }; } })();
    for (var i = 0; i < 3; i++) for (var p = 0; p < 2; p++) if (onR(setRect(i, p))) {
      var k = SET[i][0]; S.settings[k] = G.clamp(Math.round((S.settings[k] + (p ? 0.1 : -0.1)) * 10) / 10, 0, 1);
      G.Save.save(); G.Aldea.applySettings(); G.sfx('card_select', { vol: 0.5 });
    }
    if (onR({ x: 330, y: 340, w: 300, h: 40 })) { S.settings.shake = S.settings.shake ? 0 : 1; G.shakeMul = S.settings.shake ? 1 / 3 : 1; G.Save.save(); G.sfx('card_select', { vol: 0.5 }); }
    if (onR({ x: 330, y: 388, w: 300, h: 40 })) { G.Proj.toggle(); G.sfx('card_select', { vol: 0.5 }); }   // vista inclinada tipo Hades (se guarda en settings.view)
    if (onR({ x: 330, y: 436, w: 300, h: 56 })) { cur = 'menu'; }
    return false;
  }
  function drawSettings(c) {
    var S = SV(); if (!S.settings) S.settings = (function () { try { return Assets.getVolume(); } catch (e) { return { master: 0.8, music: 0.6, sfx: 0.8 }; } })();
    bg(c, 'AJUSTES');
    SET.forEach(function (it, i) {
      G.txt(c, it[1], 200, 148 + i * 80, 20, '#ffd27a', 'left');
      U.button(c, setRect(i, 0), '-', { size: 26 });
      G.txt(c, Math.round(S.settings[it[0]] * 100) + '%', 660, 148 + i * 80, 20, '#fff', 'center');
      U.button(c, setRect(i, 1), '+', { size: 26 });
    });
    U.button(c, { x: 330, y: 340, w: 300, h: 40 }, 'Reducir sacudidas: ' + (S.settings.shake ? 'SÍ' : 'NO'), { size: 15, color: S.settings.shake ? '#2a6aa8' : '#2c2438' });
    U.button(c, { x: 330, y: 388, w: 300, h: 40 }, 'Vista inclinada (exped.): ' + (G.Proj.iso ? 'SÍ' : 'NO'), { size: 15, color: G.Proj.iso ? '#2a6aa8' : '#2c2438' });
    U.button(c, { x: 330, y: 436, w: 300, h: 56 }, 'ATRÁS', { size: 20 });
  }
})();
