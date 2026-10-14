/* base.js - La Base (pantalla de título + forja de una página) y la pantalla de fin de expedición con el botín.
   Base: colección (26 cartas), forja con recetas, Rango I-III, selección de anclas, selector de duración y botón de salida.
   Todo en canvas 960x540, botones >= 44 px de alto (se usa también en móvil). Los datos viven en G.Save y la economía en G.Loot. */
(function () {
  'use strict';
  var G = window.G, B = G.B, Bs = G.Base = {};
  var U = G.UI, inp = G.input;
  var sel = 0, msg = '', msgT = 0, flashT = 0, confirmDel = 0;

  // ------------------------------------------------------------- Geometría
  var CELL = { w: 62, h: 84, gx: 66, gy: 88, x0: 12, y0: 50, cols: 9 };
  function cellRect(i) { return { x: CELL.x0 + (i % CELL.cols) * CELL.gx, y: CELL.y0 + Math.floor(i / CELL.cols) * CELL.gy, w: CELL.w, h: CELL.h }; }
  var PANEL = { x: 612, y: 46, w: 336, h: 272 };
  var BTN_FORGE = { x: 620, y: 254, w: 160, h: 58 }, BTN_ANCHOR = { x: 786, y: 254, w: 154, h: 58 };
  var BTN_DEL = { x: 770, y: 5, w: 178, h: 34 };
  var BTN_GO = { x: 400, y: 468, w: 548, h: 60 };
  var LENS = [7, 9, 10];
  function lenRect(i) { return { x: 400 + i * 186, y: 404, w: 176, h: 48 }; }
  function anchorRect(i) { return { x: 12 + i * 74, y: 404, w: 66, h: 88 }; }
  var END_RETRY = { x: 20, y: 448, w: 440, h: 70 }, END_BASE = { x: 480, y: 448, w: 460, h: 70 };

  function defs() { return G.Cards.defs; }
  function say(t) { msg = t; msgT = 2600; }
  function anchors() { return G.Save.data.anchors; }
  function cleanAnchors() {
    var S = G.Save.data;
    S.anchors = S.anchors.filter(function (id, i, a) { return G.Loot.unlocked(id) && a.indexOf(id) === i; }).slice(-B.anchorSlots);
  }
  function toggleAnchor(id) {
    var a = anchors(), i = a.indexOf(id);
    if (!G.Loot.unlocked(id)) { say('Forja la carta antes de fijarla como ancla.'); return; }
    if (i >= 0) a.splice(i, 1); else { a.push(id); if (a.length > B.anchorSlots) a.shift(); }
    G.Save.save(); G.sfx('card_select', { vol: 0.5 });
  }
  function launch() { G.sfx('card_select', { vol: 0.7 }); G.startGame(); }

  Bs.open = function () {
    cleanAnchors(); G.state = 'base'; msg = ''; msgT = 0; confirmDel = 0;
    G.Save.save();
  };

  // ------------------------------------------------------------- Entrada de la Base
  Bs.update = function (dt) {
    if (msgT > 0) msgT -= dt; if (flashT > 0) flashT -= dt; if (confirmDel > 0) confirmDel -= dt;
    var m = inp.mouse, S = G.Save.data, id = defs()[sel].id;
    if (inp.hit('Enter')) { launch(); return; }
    if (inp.hit('ArrowRight', 'KeyD')) sel = (sel + 1) % defs().length;
    if (inp.hit('ArrowLeft', 'KeyA')) sel = (sel + defs().length - 1) % defs().length;
    if (inp.hit('ArrowDown', 'KeyS')) sel = Math.min(defs().length - 1, sel + CELL.cols);
    if (inp.hit('ArrowUp', 'KeyW')) sel = Math.max(0, sel - CELL.cols);
    if (inp.hit('KeyF')) doForge(id);
    if (inp.hit('KeyE')) toggleAnchor(id);
    if (!inp.hit('Mouse0')) return;
    if (U.inR(BTN_GO, m)) { launch(); return; }
    if (U.inR(BTN_DEL, m)) {
      if (confirmDel > 0) { G.Save.reset(); G.Base.open(); say('Progreso borrado.'); sel = 0; }
      else { confirmDel = 3000; say('Pulsa otra vez para BORRAR todo el progreso.'); }
      return;
    }
    for (var i = 0; i < LENS.length; i++) if (U.inR(lenRect(i), m)) { S.len = LENS[i]; G.Save.save(); G.sfx('card_select', { vol: 0.5 }); return; }
    for (i = 0; i < defs().length; i++) if (U.inR(cellRect(i), m)) { sel = i; G.sfx('flip', { vol: 0.4 }); return; }
    if (U.inR(BTN_FORGE, m)) { doForge(id); return; }
    if (U.inR(BTN_ANCHOR, m)) { toggleAnchor(id); return; }
    for (i = 0; i < B.anchorSlots; i++) {
      if (!U.inR(anchorRect(i), m)) continue;
      if (anchors()[i]) { anchors().splice(i, 1); G.Save.save(); }
      else toggleAnchor(id);
      return;
    }
  };

  function doForge(id) {
    var nr = G.Loot.nextRank(id);
    if (!nr) { say('Rango máximo.'); return; }
    if (!G.Loot.canForge(id)) { say('Faltan partes o Brasas.'); G.sfx('discard', { vol: 0.5 }); return; }
    G.Loot.forge(id); flashT = 700;
    var d = G.Cards.def(id);
    say(nr === 1 ? '¡Forjada: ' + d.name + '!' : d.name + ' sube a Rango ' + U.roman(nr) + ' (+8 % daño)');
    try { G.Snd.play('fuse'); } catch (e) { /* audio */ }
  }

  // ------------------------------------------------------------- Dibujo de la Base
  function recipeRow(c, rec, x, y) {
    var S = G.Save.data, keys = Object.keys(rec.parts).concat(['_b']), i, ok = true;
    for (i = 0; i < keys.length; i++) {
      var k = keys[i], need = k === '_b' ? rec.brasas : rec.parts[k], have = k === '_b' ? S.brasas : (S.parts[k] || 0), cx = x + i * 78;
      U.part(c, k === '_b' ? 'brasa' : k, cx + 13, y, 11);
      var good = have >= need; if (!good) ok = false;
      G.txt(c, have + '/' + need, cx + 28, y + 1, 13, good ? '#9dffb4' : '#ff8a8a', 'left');
    }
    return ok;
  }

  Bs.draw = function (c) {
    var S = G.Save.data, m = inp.mouse, i, id = defs()[sel].id, d = defs()[sel], rank = G.Save.rank(id), L = G.Loot;
    c.fillStyle = 'rgba(8,4,14,0.9)'; c.fillRect(0, 0, G.W, G.H);
    // cabecera
    G.txt(c, 'BASE', 14, 22, 28, '#ffd27a', 'left');
    U.part(c, 'brasa', 150, 22, 10); G.txt(c, 'Brasas ' + S.brasas, 166, 22, 17, '#ff9a3c', 'left');
    if (!(msgT > 0 && msg)) G.txt(c, 'Expediciones ' + S.runs + '   Victorias ' + S.wins, 330, 22, 14, '#9a8fb0', 'left');
    if (S.pity > 0 && !(msgT > 0 && msg)) G.txt(c, 'Rara +' + (S.pity * 100).toFixed(1) + '%', 620, 22, 13, '#c070ff', 'left');
    U.button(c, BTN_DEL, confirmDel > 0 ? 'SEGURO? PULSA DE NUEVO' : 'BORRAR PROGRESO', { color: confirmDel > 0 ? '#a02030' : '#3a2f48', hot: '#c03040', border: '#8a6a8a', size: 12 });
    // colección
    var aff = {};
    for (i = 0; i < defs().length; i++) {
      var dd = defs()[i], r = cellRect(i), rk = G.Save.rank(dd.id), isA = anchors().indexOf(dd.id) >= 0;
      var canF = L.canForge(dd.id);
      G.Cards.drawCard(c, { id: dd.id, lvl: 0 }, r.x, r.y, r.w, r.h, { nocd: true, dim: rk === 0, glow: i === sel ? '#ffe9a0' : null });
      if (i === sel) { c.strokeStyle = '#ffe9a0'; c.lineWidth = 3; c.strokeRect(r.x - 2, r.y - 2, r.w + 4, r.h + 4); }
      if (rk === 0) {   // candado
        c.fillStyle = '#0c0814'; c.fillRect(r.x + r.w - 20, r.y + 4, 16, 14); c.fillStyle = '#9a8fb0'; c.fillRect(r.x + r.w - 18, r.y + 7, 12, 9);
        c.strokeStyle = '#9a8fb0'; c.lineWidth = 2; c.beginPath(); c.arc(r.x + r.w - 12, r.y + 7, 4, Math.PI, 0); c.stroke();
      }
      if (isA) { c.fillStyle = '#ffd24a'; c.fillRect(r.x, r.y + r.h - 16, r.w, 16); G.txt(c, 'ANCLA', r.x + r.w / 2, r.y + r.h - 8, 11, '#2a1a00', 'center', '#ffd24a'); }
      if (canF) { var pu = 0.6 + 0.4 * Math.sin(Date.now() / 200); c.fillStyle = 'rgba(120,255,160,' + pu + ')'; c.beginPath(); c.arc(r.x + 8, r.y + 8, 6, 0, 6.283); c.fill(); G.txt(c, '!', r.x + 8, r.y + 9, 11, '#0a3a1a', 'center', 'rgba(0,0,0,0)'); }
    }
    // panel de forja
    U.panel(c, PANEL.x, PANEL.y, PANEL.w, PANEL.h);
    var tc = G.TAGS[d.tag].color;
    G.Cards.drawCard(c, { id: id, lvl: 0 }, 622, 56, 62, 84, { nocd: true });
    G.txt(c, d.name, 694, 66, 17, '#ffd27a', 'left');
    G.txt(c, G.TAGS[d.tag].name + ' - ' + (d.type === 'attack' ? 'ATAQUE' : 'PASIVA'), 694, 87, 12, tc, 'left');
    G.txt(c, rank ? 'RANGO ' + U.roman(rank) + (rank > 1 ? '  x' + L.RANK_MUL[rank].toFixed(2) : '') : 'BLOQUEADA', 694, 107, 13, rank ? '#fff' : '#ff8a8a', 'left');
    for (i = 1; i <= 3; i++) {
      var dx = 700 + i * 22; c.fillStyle = rank >= i ? '#ffd24a' : '#2a2038'; c.strokeStyle = '#0c0814'; c.lineWidth = 2;
      c.beginPath(); c.moveTo(dx, 118); c.lineTo(dx + 8, 126); c.lineTo(dx, 134); c.lineTo(dx - 8, 126); c.closePath(); c.fill(); c.stroke();
    }
    var lines = U.wrap(c, d.desc, 318, 11);
    for (i = 0; i < lines.length && i < 3; i++) G.txt(c, lines[i], 622, 156 + i * 14, 11, '#d8cfe8', 'left');
    var nr = L.nextRank(id), can = false;
    if (nr) {
      var rec = L.recipe(id, nr);
      G.txt(c, nr === 1 ? 'RECETA: DESBLOQUEAR' : 'MEJORAR A RANGO ' + U.roman(nr) + ' (+8% daño)', 622, 202, 12, '#ffe9a0', 'left');
      can = recipeRow(c, rec, 622, 226);
    } else G.txt(c, 'RANGO MÁXIMO ALCANZADO', 622, 214, 13, '#ffd24a', 'left');
    var isAnchor = anchors().indexOf(id) >= 0;
    U.button(c, BTN_FORGE, nr === 1 ? 'FORJAR' : 'MEJORAR', { off: !nr || !can, color: '#2a8a4a', hot: '#3aba66', border: '#9dffb4', size: 18, sub: nr ? '[F]' : 'máx.' });
    U.button(c, BTN_ANCHOR, isAnchor ? 'QUITAR ANCLA' : 'FIJAR ANCLA', { off: !rank, color: '#a8801a', hot: '#d8a82a', size: 15, sub: '[E]' });
    if (flashT > 0) { c.fillStyle = 'rgba(255,233,160,' + 0.35 * flashT / 700 + ')'; c.fillRect(PANEL.x, PANEL.y, PANEL.w, PANEL.h); }
    // inventario de partes
    for (i = 0; i < L.PARTS.length; i++) {
      var P = L.PARTS[i], px = 12 + i * 104, n = S.parts[P.id] || 0;
      c.fillStyle = 'rgba(20,14,30,0.9)'; c.fillRect(px, 326, 100, 50);
      c.strokeStyle = P.rare ? '#8a50c0' : '#3a2f48'; c.lineWidth = 2; c.strokeRect(px + 1, 327, 98, 48);
      U.part(c, P.id, px + 18, 350, 12);
      G.txt(c, P.short, px + 36, 338, 10, '#9a8fb0', 'left');
      G.txt(c, 'x' + n, px + 36, 358, 17, n ? '#fff' : '#6a5f78', 'left');
    }
    // mano al salir: anclas + abiertos
    G.txt(c, 'TU MANO AL SALIR', 12, 392, 13, '#9a8fb0', 'left');
    for (i = 0; i < 5; i++) {
      var ar = anchorRect(i), isAn = i < B.anchorSlots, id2 = anchors()[i];
      if (isAn && id2) {
        G.Cards.drawCard(c, { id: id2, lvl: 0 }, ar.x, ar.y, ar.w, ar.h, { nocd: true });
        G.txt(c, 'ANCLA', ar.x + ar.w / 2, ar.y - 1, 10, '#ffd24a', 'center');
      } else if (isAn) {
        G.Cards.drawEmptySlot(c, ar.x, ar.y, ar.w, ar.h, '+'); G.txt(c, 'ANCLA', ar.x + ar.w / 2, ar.y + ar.h - 10, 10, '#ffd24a', 'center');
      } else { G.Cards.drawEmptySlot(c, ar.x, ar.y, ar.w, ar.h, '?'); G.txt(c, 'ABIERTO', ar.x + ar.w / 2, ar.y + ar.h - 10, 10, '#6f6480', 'center'); }
    }
    G.txt(c, B.anchorSlots + ' anclas fijas. Los otros ' + (5 - B.anchorSlots) + ' slots se llenan', 12, 506, 11, '#9a8fb0', 'left');
    G.txt(c, 'al subir de nivel con tus cartas desbloqueadas.', 12, 520, 11, '#9a8fb0', 'left');
    // duración
    G.txt(c, 'DURACIÓN DE LA EXPEDICIÓN', 400, 392, 13, '#9a8fb0', 'left');
    var cur = S.len, subs = { 7: 'corta', 9: 'estándar', 10: 'larga' };
    for (i = 0; i < LENS.length; i++) {
      var lr = lenRect(i), on = cur === LENS[i];
      U.button(c, lr, LENS[i] + ' min', { color: on ? '#2a6aa8' : '#2c2438', hot: '#3a8ad0', border: on ? '#bfeaff' : '#6a5a80', size: 18, sub: subs[LENS[i]] + (on ? ' (activa)' : '') });
    }
    G.txt(c, 'Jefe a los ' + G.fmtTime(cur * 60000 * 7.5 / 9) + '. Más tiempo = más botín.', 400, 459, 11, '#9a8fb0', 'left');
    var names = anchors().map(function (a) { return G.Cards.def(a).short; }).join(' + ') || 'sin anclas';
    U.button(c, BTN_GO, 'SALIR A LA EXPEDICIÓN', { size: 24, sub: 'Enter  -  anclas: ' + names });
    if (msgT > 0 && msg) G.txt(c, msg, 480, 22 + 0, 14, '#ffe9a0', 'center');
  };

  // ------------------------------------------------------------- Pantalla de fin / botín
  Bs.updateEnd = function () {
    var m = inp.mouse;
    if (inp.hit('KeyR', 'Enter') || (inp.hit('Mouse0') && U.inR(END_RETRY, m))) { launch(); return; }
    if (inp.hit('KeyB', 'Escape') || (inp.hit('Mouse0') && U.inR(END_BASE, m))) { G.Base.open(); }
  };

  Bs.drawEnd = function (c) {
    var won = G.won, p = G.player, h = p.hand, i, S = G.Save.data, sm = G.Loot.summary || { parts: {}, total: 0, brasas: 0, newCards: [] };
    c.fillStyle = won ? 'rgba(20,14,0,0.92)' : 'rgba(20,0,6,0.92)'; c.fillRect(0, 0, G.W, G.H);
    G.txt(c, won ? 'MANO GANADORA' : 'HAS CAÍDO', G.W / 2, 34, 44, won ? '#ffd24a' : '#ff5a5a', 'center');
    G.txt(c, 'Tiempo ' + G.fmtTime(G.time) + '   -   Kills ' + G.kills + '   -   Nivel ' + p.level, G.W / 2, 72, 16, '#fff', 'center');
    G.txt(c, 'TU MANO FINAL', 20, 246, 13, '#9a8fb0', 'left');
    for (i = 0; i < h.length; i++) {
      var r = G.Cards.slotRect(i, 'end');
      if (h[i]) G.Cards.drawCard(c, { id: h[i].id, lvl: h[i].lvl }, r.x, r.y, r.w, r.h, { nocd: true });
      else G.Cards.drawEmptySlot(c, r.x, r.y, r.w, r.h, '');
    }
    G.Cards.drawComboLines(c, 'end');
    var names = G.Cards.combos.filter(function (cb) { return G.Cards.active[cb.k]; });
    if (names.length) {
      G.txt(c, 'COMBOS ACTIVOS', 20, 276, 13, '#9a8fb0', 'left');
      names.slice(0, 7).forEach(function (cb, k) {
        var y = 298 + k * 22;
        c.fillStyle = G.TAGS[cb.a].color; c.beginPath(); c.arc(28, y, 5, 0, 6.283); c.fill();
        c.fillStyle = G.TAGS[cb.b].color; c.beginPath(); c.arc(39, y, 5, 0, 6.283); c.fill();
        G.txt(c, cb.name, 52, y, 13, '#ffe9a0', 'left');
      });
    } else G.txt(c, 'Sin combos: la próxima vez junta etiquetas distintas', 20, 276, 12, '#9a8fb0', 'left');
    // botín
    U.panel(c, 500, 96, 440, 336, { border: '#8a6a30' });
    G.txt(c, 'BOTÍN  (+' + sm.total + ' partes)', 516, 114, 18, '#ffd27a', 'left');
    var L = G.Loot, shown = 0;
    L.PARTS.forEach(function (P) {
      var n = sm.parts[P.id] || 0; if (!n) return;
      var col = shown % 3, row = Math.floor(shown / 3), x = 516 + col * 140, y = 146 + row * 34;
      U.part(c, P.id, x + 12, y, 12);
      G.txt(c, '+' + n, x + 30, y, 17, P.rare ? '#e0a8ff' : '#fff', 'left');
      G.txt(c, '(' + (S.parts[P.id] || 0) + ')', x + 70, y + 1, 11, '#9a8fb0', 'left');
      shown++;
    });
    if (!shown) G.txt(c, 'Sin partes esta vez', 516, 150, 14, '#9a8fb0', 'left');
    U.part(c, 'brasa', 528, 262, 11);
    G.txt(c, '+' + sm.brasas + ' Brasas   (total ' + S.brasas + ')', 548, 262, 16, '#ff9a3c', 'left');
    if (sm.rare) G.txt(c, '¡Esencia rara conseguida!', 516, 286, 13, '#e0a8ff', 'left');
    else G.txt(c, 'Prob. de Esencia rara: ' + ((L.RARE_P + S.pity) * 100).toFixed(1) + '%', 516, 286, 12, '#9a8fb0', 'left');
    G.txt(c, sm.newCards.length ? 'NUEVAS CARTAS YA FORJABLES' : 'Sin recetas nuevas listas todavía', 516, 312, 13, sm.newCards.length ? '#9dffb4' : '#9a8fb0', 'left');
    sm.newCards.slice(0, 6).forEach(function (id, k) {
      G.Cards.drawCard(c, { id: id, lvl: 0 }, 516 + k * 68, 326, 56, 74, { nocd: true, glow: '#9dffb4' });
    });
    U.button(c, END_RETRY, 'REINTENTAR MISMO BUILD', { size: 22, sub: 'R / Enter  -  anclas: ' + (S.anchors.map(function (a) { return G.Cards.def(a).short; }).join(' + ') || 'ninguna') });
    U.button(c, END_BASE, 'IR A LA BASE (FORJA)', { size: 22, color: '#2a6aa8', hot: '#3a8ad0', border: '#bfeaff', sub: 'B  -  forjar y cambiar anclas' });
  };
})();
