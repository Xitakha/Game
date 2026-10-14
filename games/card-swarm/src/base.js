/* base.js - Pantalla de fin de expedición con el botín (Reintentar mismo build / Ir a la Aldea) y el lanzador de expediciones.
   La antigua Base de una página fue sustituida por la aldea Rescoldo (aldea.js): G.Base.open() ahora abre la aldea y la colección/anclas
   viven en panels.js (Archivo de Ulalume y Portal). */
(function () {
  'use strict';
  var G = window.G, Bs = G.Base = {};
  var U = G.UI, inp = G.input;
  var END_RETRY = { x: 20, y: 448, w: 440, h: 70 }, END_BASE = { x: 480, y: 448, w: 460, h: 70 };

  Bs.launch = function () { G.sfx('card_select', { vol: 0.7 }); G.startGame(); };
  Bs.open = function (fromRun) { G.Aldea.open(!!fromRun); };

  // ------------------------------------------------------------- Pantalla de fin / botín
  Bs.updateEnd = function () {
    var m = inp.mouse;
    if (inp.hit('KeyR', 'Enter') || (inp.hit('Mouse0') && U.inR(END_RETRY, m))) { Bs.launch(); return; }
    if (inp.hit('KeyB', 'Escape') || (inp.hit('Mouse0') && U.inR(END_BASE, m))) { Bs.open(true); }
  };

  Bs.drawEnd = function (c) {
    var won = G.won, p = G.player, h = p.hand, i, S = G.Save.data, sm = G.Loot.summary || { parts: {}, total: 0, brasas: 0, newCards: [] };
    c.fillStyle = won ? 'rgba(20,14,0,0.92)' : 'rgba(20,0,6,0.92)'; c.fillRect(0, 0, G.W, G.H);
    G.txt(c, won ? 'MANO GANADORA' : 'HAS CAÍDO', G.W / 2, 34, 44, won ? '#ffd24a' : '#ff5a5a', 'center');
    G.txt(c, 'Tiempo ' + G.fmtTime(G.runT) + '   -   Kills ' + G.kills + '   -   Nivel ' + p.level, G.W / 2, 72, 16, '#fff', 'center');
    G.txt(c, 'TU MANO FINAL', 20, 246, 13, '#9a8fb0', 'left');
    for (i = 0; i < h.length; i++) {
      var r = G.Cards.slotRect(i, 'end');
      if (h[i]) G.Cards.drawCard(c, { id: h[i].id, lvl: h[i].lvl }, r.x, r.y, r.w, r.h, { nocd: true });
      else G.Cards.drawEmptySlot(c, r.x, r.y, r.w, r.h, '');
    }
    G.Cards.drawComboLines(c, 'end');
    // resumen del jefe (v4): una línea bajo el título; los trofeos y el desglose de Brasas van en el panel del botín
    var bi = sm.boss;
    if (bi) {
      var BDP = (G.Boss.DEFS[bi.id] || {}).parts || {}, PN = { cuernos: 'Cuernos', cayado: 'Cayado', vellon: 'Vellón' }, mm = Math.floor(bi.time / 60000), ss = Math.floor(bi.time / 1000) % 60;
      var bl = bi.name.toUpperCase() + (bi.won ? '  -  derrotado en ' + mm + ':' + (ss < 10 ? '0' : '') + ss : '  -  te venció con ' + Math.round(bi.hpFrac * 100) + ' % de vida')
        + '  -  partes rotas: ' + (bi.parts.length ? bi.parts.map(function (k) { return PN[k] || (BDP[k] && BDP[k].name) || k; }).join(', ') : 'ninguna');
      G.txt(c, bl, G.W / 2, 92, 13, bi.won ? '#ffd24a' : '#ff9a8a', 'center');
    }
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
    if (bi && bi.trophies.length) bi.trophies.forEach(function (tk) {   // trofeos de jefe: cuentan como Esencia
      var T = G.Boss.TROPHY[tk]; if (!T) return;
      var col2 = shown % 3, row2 = Math.floor(shown / 3), x2 = 516 + col2 * 140, y2 = 146 + row2 * 34;
      c.drawImage(Assets.sprite(T.spr, 0), x2, y2 - 14, 28, 28); G.txt(c, '+1 ' + T.name.split(' ')[0], x2 + 32, y2, 13, '#ffd27a', 'left');
      shown++;
    });
    if (!shown) G.txt(c, 'Sin partes esta vez', 516, 150, 14, '#9a8fb0', 'left');
    U.part(c, 'brasa', 528, 262, 11);
    G.txt(c, '+' + sm.brasas + ' Brasas   (total ' + S.brasas + ')', 548, 262, 16, '#ff9a3c', 'left');
    if (bi) G.txt(c, 'jefe +' + bi.brasas + ' / run +' + (sm.brasas - bi.brasas), 800, 262, 10, '#c8a070', 'left');
    if (sm.rare) G.txt(c, '¡Esencia rara conseguida!', 516, 286, 13, '#e0a8ff', 'left');
    else G.txt(c, 'Prob. de Esencia rara: ' + ((L.RARE_P + S.pity) * 100).toFixed(1) + '%', 516, 286, 12, '#9a8fb0', 'left');
    if (sm.quest) U.wrap(c, 'Encargo: ' + sm.quest, 410, 11).slice(0, 2).forEach(function (ln, k) { G.txt(c, ln, 516, 302 + k * 13, 11, '#ffe9a0', 'left'); });
    if (sm.pfGained) G.txt(c, '+' + sm.pfGained + ' Punto' + (sm.pfGained > 1 ? 's' : '') + ' de Forja', 730, 286, 12, '#ffd24a', 'left');
    G.txt(c, sm.newCards.length ? 'NUEVAS CARTAS YA FORJABLES (Clásica)' : 'PF libres ' + G.Tree.pfFree() + '  -  nodos comprables ' + G.Tree.availableCount(), 516, 336, 13, sm.newCards.length ? '#9dffb4' : '#9a8fb0', 'left');
    sm.newCards.slice(0, 6).forEach(function (id, k) {
      G.Cards.drawCard(c, { id: id, lvl: 0 }, 516 + k * 68, 348, 56, 74, { nocd: true, glow: '#9dffb4' });
    });
    U.button(c, END_RETRY, 'REINTENTAR MISMO BUILD', { size: 22, sub: 'R / Enter  -  anclas: ' + (S.anchors.map(function (a) { return G.Cards.def(a).short; }).join(' + ') || 'ninguna') });
    U.button(c, END_BASE, 'IR A LA ALDEA', { size: 22, color: '#2a6aa8', hot: '#3a8ad0', border: '#bfeaff', sub: 'B  -  forjar, encargos y anclas' });
  };
})();
