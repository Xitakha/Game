/* base.js - Pantalla de fin de expedición con el botín (Reintentar mismo build / Ir a la Aldea) y el lanzador de expediciones.
   La antigua Base de una página fue sustituida por la aldea Rescoldo (aldea.js): G.Base.open() ahora abre la aldea y la colección/anclas
   viven en panels.js (Archivo de Ulalume y Portal). */
(function () {
  'use strict';
  var G = window.G, Bs = G.Base = {};
  var U = G.UI, inp = G.input;
  var END_RETRY = { x: 20, y: 448, w: 440, h: 70 }, END_BASE = { x: 480, y: 448, w: 460, h: 70 };

  Bs.launch = function () { G.sfx('card_select', { vol: 0.7 }); G.startGame(); };
  // Reintentar la misma salida: normal, cacería (misma bestia y Peligro) o práctica (misma mano; la fase de inicio puede cambiarse con 1-3)
  Bs.retry = function () { G.launchReq = G.lastReq ? { mode: G.lastReq.mode, boss: G.lastReq.boss, peligro: G.lastReq.peligro, phase: G.lastReq.phase } : null; Bs.launch(); };
  Bs.retryPractice = function () { if (G.mode === 'practice') Bs.retry(); };
  var PH_BTN = function (i) { return { x: 516 + i * 140, y: 328, w: 130, h: 48 }; };
  Bs.open = function (fromRun) { G.Aldea.open(!!fromRun); };

  // ------------------------------------------------------------- Pantalla de fin / botín
  Bs.updateEnd = function () {
    var m = inp.mouse;
    if (G.mode === 'practice') {   // elegir la fase de inicio de la práctica: 1-3 (o los botones) y se reinicia al momento
      for (var pi = 0; pi < 3; pi++) if (inp.hit('Digit' + (pi + 1)) || (inp.hit('Mouse0') && U.inR(PH_BTN(pi), m))) { G.lastReq = G.lastReq || { mode: 'practice', boss: G.bossId }; G.lastReq.phase = pi + 1; Bs.retry(); return; }
    }
    if (inp.hit('KeyR', 'Enter') || (inp.hit('Mouse0') && U.inR(END_RETRY, m))) { Bs.retry(); return; }
    if (inp.hit('KeyB', 'Escape') || (inp.hit('Mouse0') && U.inR(END_BASE, m))) { Bs.open(true); }
  };

  Bs.drawEnd = function (c) {
    var won = G.won, p = G.player, h = p.hand, i, S = G.Save.data, sm = G.Loot.summary || { parts: {}, total: 0, brasas: 0, newCards: [] };
    c.fillStyle = won ? 'rgba(20,14,0,0.92)' : 'rgba(20,0,6,0.92)'; c.fillRect(0, 0, G.W, G.H);
    var md = G.mode, prac = md === 'practice';
    G.txt(c, prac ? (won ? 'PRÁCTICA SUPERADA' : 'PRÁCTICA: HAS CAÍDO') : md === 'hunt' ? (won ? 'CACERÍA CUMPLIDA' : 'LA BESTIA SE LIBRA') : won ? 'MANO GANADORA' : 'HAS CAÍDO', G.W / 2, 34, md === 'run' ? 44 : 38, won ? '#ffd24a' : '#ff5a5a', 'center');
    G.txt(c, md === 'run' ? 'Tiempo ' + G.fmtTime(G.runT) + '   -   Kills ' + G.kills + '   -   Nivel ' + p.level : (prac ? 'Práctica (jefe a media vida, sin Peligro, sin recompensas)' : 'Cacería de Vesper  -  Peligro ' + G.Boss.ROMAN[G.clamp(Math.round(G.peligro || 1), 1, 5)] + '  -  jefe a 75 % de vida'), G.W / 2, 72, 16, '#fff', 'center');
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
      if (bi.peligro > 1 && !prac) bl += '  -  PELIGRO ' + G.Boss.ROMAN[bi.peligro];
      G.txt(c, bl.length > 118 ? bl.slice(0, 117) + '.' : bl, G.W / 2, 92, 13, bi.won ? '#ffd24a' : '#ff9a8a', 'center');
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
    if (prac) { drawPracticePanel(c, sm); drawEndButtons(c, S); return; }
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
    if (bi) G.txt(c, 'jefe +' + bi.brasas + (bi.peligro > 1 ? ' (P' + G.Boss.ROMAN[bi.peligro] + ')' : '') + (bi.mode === 'hunt' ? '' : ' / run +' + (sm.brasas - bi.brasas)), 778, 262, 10, '#c8a070', 'left');
    if (sm.rare) G.txt(c, '¡Esencia rara conseguida!', 516, 286, 13, '#e0a8ff', 'left');
    else G.txt(c, 'Prob. de Esencia rara: ' + ((L.RARE_P + S.pity) * 100).toFixed(1) + '%', 516, 286, 12, '#9a8fb0', 'left');
    if (sm.quest) U.wrap(c, 'Encargo: ' + sm.quest, 410, 11).slice(0, 2).forEach(function (ln, k) { G.txt(c, ln, 516, 302 + k * 13, 11, '#ffe9a0', 'left'); });
    if (sm.pfGained) G.txt(c, '+' + sm.pfGained + ' Punto' + (sm.pfGained > 1 ? 's' : '') + ' de Forja', 730, 286, 12, '#ffd24a', 'left');
    G.txt(c, sm.newCards.length ? 'NUEVAS CARTAS YA FORJABLES (Clásica)' : 'PF libres ' + G.Tree.pfFree() + '  -  nodos comprables ' + G.Tree.availableCount(), 516, 336, 13, sm.newCards.length ? '#9dffb4' : '#9a8fb0', 'left');
    sm.newCards.slice(0, 6).forEach(function (id, k) {
      G.Cards.drawCard(c, { id: id, lvl: 0 }, 516 + k * 68, 348, 56, 74, { nocd: true, glow: '#9dffb4' });
    });
    if (bi && bi.unlocked) G.txt(c, '¡PELIGRO ' + G.Boss.ROMAN[bi.unlocked] + ' DESBLOQUEADO!', 730, 310, 13, '#9dffb4', 'left');
    if (sm.dur) G.txt(c, 'Duración ' + sm.dur.name + ' (' + sm.dur.min + ' min): partes y Brasas x' + String(sm.dur.parts).replace('.', ',') + (sm.dur.pf !== 1 ? ', PF x' + String(sm.dur.pf).replace('.', ',') : '') + (sm.dur.rare !== 1 ? ', Esencia x' + String(sm.dur.rare).replace('.', ',') : '') + (sm.dur.bossHp !== 1 ? ', jefe +HP' : ''), 720, 426, 10, '#9a8fb0', 'center');
    drawEndButtons(c, S);
  };
  function drawEndButtons(c, S) {
    var md = G.mode;
    U.button(c, END_RETRY, md === 'practice' ? 'REINICIAR PRÁCTICA' : md === 'hunt' ? 'OTRA CACERÍA' : 'REINTENTAR MISMO BUILD', { size: 22, sub: md === 'practice' ? 'R / Enter  -  misma mano; 1-3: fase de inicio' : md === 'hunt' ? 'R / Enter  -  6 ofertas nuevas' : 'R / Enter  -  anclas: ' + (S.anchors.map(function (a) { return G.Cards.def(a).short; }).join(' + ') || 'ninguna') });
    U.button(c, END_BASE, 'IR A LA ALDEA', { size: 22, color: '#2a6aa8', hot: '#3a8ad0', border: '#bfeaff', sub: 'B  -  forjar, encargos y anclas' });
  }
  function drawPracticePanel(c, sm) {
    var bi = sm.boss || {}, S = G.Save.data;
    U.panel(c, 500, 96, 440, 336, { border: '#4a8a6a' });
    G.txt(c, 'PRÁCTICA', 516, 114, 18, '#9dffb4', 'left');
    var ls = ['Sin recompensas, sin pérdida de progreso y sin Peligro.', 'El jefe tiene la mitad de vida; úsalo para aprender los patrones.', '', 'Intento ' + (bi.tries || 1) + '   -   victorias de práctica ' + (bi.wins || 0),
      'Duración del intento: ' + G.fmtTime(bi.time || 0) + '   -   fase alcanzada: ' + ['I', 'II', 'III'][(bi.phase || 1) - 1], 'Partes rotas: ' + ((bi.parts && bi.parts.length) || 0) + '/3'];
    ls.forEach(function (t, k) { G.txt(c, t, 516, 146 + k * 22, 13, k < 2 ? '#d8cfe8' : '#ffe9a0', 'left'); });
    G.txt(c, 'EMPEZAR EN LA FASE...  (teclas 1-3 reinician al momento)', 516, 312, 12, '#9a8fb0', 'left');
    for (var i = 0; i < 3; i++) U.button(c, PH_BTN(i), 'FASE ' + ['I', 'II', 'III'][i], { size: 15, color: (G.lastReq && (G.lastReq.phase || 1) === i + 1) ? '#2a8a4a' : '#2c2438', hot: '#3aba66', border: '#9dffb4' });
  }
})();
