/* base.js - Pantalla de fin de expedición con el botín (Reintentar mismo build / Ir a la Aldea) y el lanzador de expediciones.
   La antigua Base de una página fue sustituida por la aldea Rescoldo (aldea.js): G.Base.open() ahora abre la aldea y la colección/anclas
   viven en panels.js (Archivo de Ulalume y Portal). */
(function () {
  'use strict';
  var G = window.G, Bs = G.Base = {};
  var U = G.UI, inp = G.input;
  var END_RETRY = { x: 20, y: 456, w: 440, h: 68 }, END_BASE = { x: 480, y: 456, w: 460, h: 68 };

  Bs.launch = function () { G.sfx('card_select', { vol: 0.7 }); G.startGame(); };
  // Reintentar la misma salida: normal, cacería (misma bestia y Peligro) o práctica (misma mano; la fase de inicio puede cambiarse con 1-3)
  Bs.retry = function () { G.launchReq = G.lastReq ? { mode: G.lastReq.mode, boss: G.lastReq.boss, peligro: G.lastReq.peligro, phase: G.lastReq.phase, final: G.lastReq.final } : null; Bs.launch(); };
  Bs.retryPractice = function () { if (G.mode === 'practice') Bs.retry(); };
  function phCount() { var d = G.Boss.DEFS[G.bossId]; return d ? d.phases.length : 3; }
  var PH_BTN = function (i) { return phCount() > 4 ? { x: 516 + i * 60, y: 328, w: 56, h: 48 } : { x: 516 + i * 140, y: 328, w: 130, h: 48 }; };
  Bs.open = function (fromRun) { G.Aldea.open(!!fromRun); };

  // ------------------------------------------------------------- Pantalla de fin / botín
  Bs.updateEnd = function () {
    var m = inp.mouse;
    if (G.mode === 'practice') {   // elegir la fase de inicio de la práctica: 1-3 (o los botones) y se reinicia al momento
      for (var pi = 0; pi < phCount(); pi++) if (inp.hit('Digit' + (pi + 1)) || (inp.hit('Mouse0') && U.inR(PH_BTN(pi), m))) { G.lastReq = G.lastReq || { mode: 'practice', boss: G.bossId }; G.lastReq.phase = pi + 1; Bs.retry(); return; }
    }
    if (inp.hit('KeyR', 'Enter') || (inp.hit('Mouse0') && U.inR(END_RETRY, m))) { Bs.retry(); return; }
    if (inp.hit('KeyB', 'Escape') || (inp.hit('Mouse0') && U.inR(END_BASE, m))) { Bs.open(true); }
  };

  // Pantalla de fin (v: textos). Rejilla vertical: título 30, subtítulo 62, columnas de y = 84 a 444, botones de y = 456. Texto >= 12 px lógicos con interlineado >= 1,3, fondo opaco
  // (no se transparenta la arena) y filas que se reparten solas: si una fila "izquierda + derecha" no cabe en el ancho del panel, la derecha baja a una línea propia.
  var PN_X = 500, PN_Y = 84, PN_W = 440, PN_H = 360, IN_X = 516, IN_W = 408;
  function infoRows(c, y, rows, size, lhh) {   // rows: [[izq, colIzq, der, colDer], ...]; devuelve la y siguiente
    size = size || 13; var lh = lhh || Math.round(size * 1.5);
    rows.forEach(function (r) {
      if (!r || (!r[0] && !r[2])) return;
      c.font = 'bold ' + size + 'px "Courier New", monospace';
      var wl = r[0] ? c.measureText(r[0]).width : 0, wr = r[2] ? c.measureText(r[2]).width : 0;
      if (r[0] && r[2] && wl + wr + 16 > IN_W) { G.txt(c, r[0], IN_X, y, size, r[1], 'left'); y += lh; G.txt(c, r[2], IN_X, y, size, r[3], 'left'); y += lh; return; }
      if (r[0]) G.txt(c, r[0], IN_X, y, size, r[1], 'left');
      if (r[2]) G.txt(c, r[2], IN_X + IN_W, y, size, r[3], 'right');
      y += lh;
    });
    return y;
  }
  function wrapLines(c, y, text, maxLines, size, col, x, maxW) {
    var ls = U.wrap(c, text, maxW, size), lh = Math.round(size * 1.45);
    if (ls.length > maxLines) { ls = ls.slice(0, maxLines); var l = ls[maxLines - 1]; ls[maxLines - 1] = l.replace(/\s*\S{0,3}$/, '') + '...'; }
    ls.forEach(function (ln) { G.txt(c, ln, x, y, size, col, 'left'); y += lh; });
    return y;
  }
  function endTitle(c, md, prac, won) {
    return prac ? (won ? 'PRÁCTICA SUPERADA' : 'PRÁCTICA: HAS CAÍDO') : md === 'hunt' ? (G.final ? (won ? 'EL CRÁTER SE APAGA' : 'EL INCENDIO TE CONSUME') : won ? 'CACERÍA CUMPLIDA' : 'LA BESTIA SE LIBRA') : won ? 'MANO GANADORA' : 'HAS CAÍDO';
  }
  Bs.drawEnd = function (c) {
    var won = G.won, p = G.player, h = p.hand, i, S = G.Save.data, sm = G.Loot.summary || { parts: {}, total: 0, brasas: 0, newCards: [] };
    c.fillStyle = won ? 'rgb(22,16,4)' : 'rgb(22,4,10)'; c.fillRect(0, 0, G.W, G.H);
    var gr = c.createRadialGradient(480, 200, 40, 480, 200, 560); gr.addColorStop(0, won ? 'rgba(90,60,10,0.35)' : 'rgba(90,10,30,0.3)'); gr.addColorStop(1, 'rgba(0,0,0,0)'); c.fillStyle = gr; c.fillRect(0, 0, G.W, G.H);
    var md = G.mode, prac = md === 'practice';
    G.txt(c, endTitle(c, md, prac, won), G.W / 2, 30, 38, won ? '#ffd24a' : '#ff6a6a', 'center');
    G.txt(c, md === 'run' ? 'Tiempo ' + G.fmtTime(G.runT) + '   -   Kills ' + G.kills + '   -   Nivel ' + p.level : (prac ? 'Práctica (jefe a media vida, sin Peligro, sin recompensas)' : (G.final ? 'Asalto al Cráter  -  Peligro ' : 'Cacería de Vesper  -  Peligro ') + G.Boss.ROMAN[G.clamp(Math.round(G.peligro || 1), 1, 5)] + (G.final ? '  -  Cenizar a vida completa' : '  -  jefe a 75 % de vida')), G.W / 2, 66, 16, '#fff', 'center');
    // ---- columna izquierda: mano, poderes y resumen del jefe
    G.txt(c, 'TU MANO FINAL', 20, 100, 13, '#b4a8c8', 'left');
    for (i = 0; i < h.length; i++) {
      var r = G.Cards.slotRect(i, 'end');
      if (h[i]) G.Cards.drawCard(c, { id: h[i].id, lvl: h[i].lvl }, r.x, r.y, r.w, r.h, { nocd: true });
      else G.Cards.drawEmptySlot(c, r.x, r.y, r.w, r.h, '');
    }
    G.Cards.drawComboLines(c, 'end');
    var names = G.Cards.combos.filter(function (cb) { return G.Cards.active[cb.k]; }), ly = 262;
    if (names.length) {
      G.txt(c, 'FUSIONES', 20, ly, 13, '#b4a8c8', 'left'); ly += 24;
      names.slice(0, 4).forEach(function (cb) {
        c.fillStyle = G.TAGS[cb.a].color; c.beginPath(); c.arc(28, ly, 5, 0, 6.283); c.fill();
        c.fillStyle = G.TAGS[cb.b].color; c.beginPath(); c.arc(39, ly, 5, 0, 6.283); c.fill();
        G.txt(c, cb.name, 52, ly, 13, '#ffe9a0', 'left'); ly += 22;
      });
    } else {
      var acts = (p.actives || []).filter(Boolean);
      G.txt(c, acts.length ? 'PODERES' : G.Fusion.endText(), 20, ly, acts.length ? 13 : 12, acts.length ? '#b4a8c8' : '#ffe9a0', 'left'); ly += 24;
      acts.slice(0, 4).forEach(function (a) {
        var d = G.Fusion.recipe(a.id);
        try { G.FusionArt.icon(c, a.id, 32, ly, 10); } catch (e0) { /* sin icono */ }
        G.txt(c, (d ? d.short : a.id) + ' Nv' + a.lvl, 50, ly, 13, '#ffe9a0', 'left');
        G.txt(c, a.uses + (a.uses === 1 ? ' uso' : ' usos'), 330, ly, 12, '#b4a8c8', 'right');
        ly += 22;
      });
    }
    // resumen del jefe (v4): bajo los poderes, hasta 4 líneas envueltas
    var bi = sm.boss;
    if (bi) {
      var BDP = (G.Boss.DEFS[bi.id] || {}).parts || {}, PN = { cuernos: 'Cuernos', cayado: 'Cayado', vellon: 'Vellón' }, mm = Math.floor(bi.time / 60000), ss = Math.floor(bi.time / 1000) % 60;
      var bl = bi.name.toUpperCase() + (bi.won ? ' - derrotado en ' + mm + ':' + (ss < 10 ? '0' : '') + ss : ' - te venció con ' + Math.round(bi.hpFrac * 100) + ' % de vida')
        + '. Partes rotas: ' + (bi.parts.length ? bi.parts.map(function (k) { return PN[k] || (BDP[k] && BDP[k].name) || k; }).join(', ') : 'ninguna');
      if (bi.peligro > 1 && !prac) bl += '. PELIGRO ' + G.Boss.ROMAN[bi.peligro];
      c.fillStyle = 'rgba(0,0,0,0.35)'; c.fillRect(14, 378, 462, 66);
      wrapLines(c, 394, bl, 3, 13, bi.won ? '#ffd24a' : '#ff9a8a', 22, 450);
    }
    if (prac) { drawPracticePanel(c, sm); drawEndButtons(c, S); return; }
    // ---- panel del botín
    U.panel(c, PN_X, PN_Y, PN_W, PN_H, { border: '#8a6a30' });
    G.txt(c, 'BOTÍN  (+' + sm.total + ' partes)', IN_X, 108, 18, '#ffd27a', 'left');
    var L = G.Loot, shown = 0, GY = 140, GP = 30, nItems = L.PARTS.filter(function (P) { return sm.parts[P.id]; }).length + (bi ? bi.trophies.length : 0), COLS = nItems > 9 ? 4 : 3, CW = Math.floor(IN_W / COLS);
    L.PARTS.forEach(function (P) {
      var n = sm.parts[P.id] || 0; if (!n) return;
      var col = shown % COLS, row = Math.floor(shown / COLS), x = IN_X + col * CW, y = GY + row * GP;
      U.part(c, P.id, x + 11, y, 11);
      G.txt(c, '+' + n, x + 27, y, COLS === 4 ? 15 : 17, P.rare ? '#e0a8ff' : '#fff', 'left');
      G.txt(c, '(' + (S.parts[P.id] || 0) + ')', x + (COLS === 4 ? 62 : 66), y + 1, 12, '#b4a8c8', 'left');
      shown++;
    });
    if (bi && bi.trophies.length) bi.trophies.forEach(function (tk) {   // trofeos de jefe: cuentan como Esencia
      var T = G.Boss.TROPHY[tk]; if (!T) return;
      var col2 = shown % COLS, row2 = Math.floor(shown / COLS), x2 = IN_X + col2 * CW, y2 = GY + row2 * GP;
      c.drawImage(Assets.sprite(T.spr, 0), x2, y2 - 12, 24, 24); G.txt(c, '+1 ' + T.name.split(' ')[0], x2 + 28, y2, 12, '#ffd27a', 'left');
      shown++;
    });
    if (!shown) G.txt(c, 'Sin partes esta vez', IN_X, GY, 14, '#b4a8c8', 'left');
    var y = GY + Math.max(1, Math.ceil(shown / COLS)) * GP + 4;
    c.fillStyle = 'rgba(255,255,255,0.12)'; c.fillRect(IN_X, y - 12, IN_W, 1);
    U.part(c, 'brasa', IN_X + 10, y + 6, 10);
    G.txt(c, '+' + sm.brasas + ' Brasas', IN_X + 28, y + 6, 17, '#ff9a3c', 'left');
    G.txt(c, 'total ' + S.brasas, IN_X + IN_W, y + 6, 13, '#ffc890', 'right');
    y += 30;
    var pfTxt = sm.pfGained ? '+' + sm.pfGained + ' Punto' + (sm.pfGained > 1 ? 's' : '') + ' de Forja' : '';
    var rows = [];
    if (bi) rows.push(['Jefe +' + bi.brasas + (bi.peligro > 1 ? ' (P' + G.Boss.ROMAN[bi.peligro] + ')' : '') + (bi.mode === 'hunt' ? '' : '   Expedición +' + (sm.brasas - bi.brasas)), '#e0b888']);
    rows.push([sm.rare ? '¡Esencia rara conseguida!' : 'Prob. de Esencia rara: ' + ((L.RARE_P + S.pity) * 100).toFixed(1) + '%', sm.rare ? '#e0a8ff' : '#b4a8c8', pfTxt, '#ffd24a']);
    if (bi && bi.unlocked) rows.push(['¡PELIGRO ' + G.Boss.ROMAN[bi.unlocked] + ' DESBLOQUEADO!', '#9dffb4']);
    y = infoRows(c, y, rows, 13, 18);
    // pie del panel: cartas nuevas (o recordatorio de PF) anclado abajo; lo opcional (armadura, encargo, duración) entra solo si queda sitio
    var bot = PN_Y + PN_H - 10, foot = sm.newCards.length ? 92 : 20, free = function (h) { return y + h <= bot - foot; };
    if (sm.blocked > 0 && free(18)) y = infoRows(c, y, [['Daño evitado por armadura: ' + sm.blocked + ' (' + Math.round(100 * sm.blocked / Math.max(1, sm.rawDmg)) + ' %)', '#7fd8e8']], 13, 18);
    if (sm.quest) { var ql = U.wrap(c, 'Encargo: ' + sm.quest, IN_W, 13).slice(0, 2); while (ql.length && !free(ql.length * 18)) ql.pop(); ql.forEach(function (ln) { G.txt(c, ln, IN_X, y, 13, '#ffe9a0', 'left'); y += 18; }); }
    if (sm.dur) {
      var dtx = 'Duración ' + sm.dur.name + ' (' + sm.dur.min + ' min): partes y Brasas x' + String(sm.dur.parts).replace('.', ',') + (sm.dur.pf !== 1 ? ', PF x' + String(sm.dur.pf).replace('.', ',') : '') + (sm.dur.rare !== 1 ? ', Esencia x' + String(sm.dur.rare).replace('.', ',') : '') + (sm.dur.bossHp !== 1 ? ', jefe +HP' : '');
      var dl = U.wrap(c, dtx, IN_W, 12).slice(0, 2); if (free(dl.length * 16)) dl.forEach(function (ln) { G.txt(c, ln, IN_X, y, 12, '#b4a8c8', 'left'); y += 16; });
    }
    if (sm.newCards.length) {
      var cy = bot - 66; G.txt(c, 'NUEVAS CARTAS YA FORJABLES', IN_X, cy - 12, 13, '#9dffb4', 'left');
      sm.newCards.slice(0, 6).forEach(function (id, k) { G.Cards.drawCard(c, { id: id, lvl: 0 }, IN_X + k * 68, cy, 62, 66, { nocd: true, glow: '#9dffb4' }); });
    } else G.txt(c, 'PF libres ' + G.Tree.pfFree() + '   -   nodos comprables ' + G.Tree.availableCount(), IN_X, bot - 6, 13, '#b4a8c8', 'left');
    drawEndButtons(c, S);
  };
  function drawEndButtons(c, S) {
    var md = G.mode;
    U.button(c, END_RETRY, md === 'practice' ? 'REINICIAR PRÁCTICA' : md === 'hunt' ? (G.final ? 'OTRO ASALTO' : 'OTRA CACERÍA') : 'REINTENTAR MISMO BUILD', { size: 22, sub: md === 'practice' ? 'R / Enter  -  misma mano; 1-3: fase de inicio' : md === 'hunt' ? 'R / Enter  -  6 ofertas nuevas' : 'R / Enter  -  anclas: ' + (S.anchors.map(function (a) { return G.Cards.def(a).short; }).join(' + ') || 'ninguna') });
    U.button(c, END_BASE, 'IR A LA ALDEA', { size: 22, color: '#2a6aa8', hot: '#3a8ad0', border: '#bfeaff', sub: 'B  -  forjar, encargos y anclas' });
  }
  function drawPracticePanel(c, sm) {
    var bi = sm.boss || {}, S = G.Save.data;
    U.panel(c, 500, 96, 440, 336, { border: '#4a8a6a' });
    G.txt(c, 'PRÁCTICA', 516, 114, 18, '#9dffb4', 'left');
    var ls = ['Sin recompensas, sin pérdida de progreso y sin Peligro.', 'El jefe tiene la mitad de vida; úsalo para aprender los patrones.', '', 'Intento ' + (bi.tries || 1) + '   -   victorias de práctica ' + (bi.wins || 0),
      'Duración del intento: ' + G.fmtTime(bi.time || 0) + '   -   fase alcanzada: ' + G.Boss.ROMAN[bi.phase || 1], 'Partes rotas: ' + ((bi.parts && bi.parts.length) || 0) + '/' + Object.keys((G.Boss.DEFS[G.bossId] || { parts: {} }).parts).length];
    ls.forEach(function (t, k) { G.txt(c, t, 516, 146 + k * 22, 13, k < 2 ? '#d8cfe8' : '#ffe9a0', 'left'); });
    G.txt(c, 'EMPEZAR EN LA FASE...  (teclas 1-' + phCount() + ' reinician al momento)', 516, 312, 12, '#9a8fb0', 'left');
    for (var i = 0; i < phCount(); i++) U.button(c, PH_BTN(i), (phCount() > 4 ? 'F' + (i + 1) : 'FASE ' + G.Boss.ROMAN[i + 1]), { size: 15, color: (G.lastReq && (G.lastReq.phase || 1) === i + 1) ? '#2a8a4a' : '#2c2438', hot: '#3aba66', border: '#9dffb4' });
  }
})();
