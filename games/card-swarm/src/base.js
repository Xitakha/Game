/* base.js - Pantalla de fin de expedición con el botín (Reintentar mismo build / Ir a la Aldea) y el lanzador de expediciones.
   La antigua Base de una página fue sustituida por la aldea Rescoldo (aldea.js): G.Base.open() ahora abre la aldea y la colección/anclas
   viven en panels.js (Archivo de Ulalume y Portal). */
(function () {
  'use strict';
  var G = window.G, Bs = G.Base = {};
  var U = G.UI, inp = G.input;
  var END_RETRY = { x: 20, y: 456, w: 600, h: 68 }, END_BASE = { x: 636, y: 456, w: 304, h: 68 }, END_PANEL = { x: 490, y: 92, w: 450, h: 172 };   // T-F1-04: acción principal a la izquierda (al alcance del pulgar), secundaria a la derecha
  var endS = { sm: null, t: 0, view: 'main', logged: false };

  Bs.launch = function () { G.sfx('card_select', { vol: 0.7 }); G.startGame(); if (G.Fte) G.Fte.nextFrom = null; };
  // Reintentar la misma salida: normal, cacería (misma bestia y Peligro) o práctica (misma mano; la fase de inicio puede cambiarse con 1-3)
  Bs.retry = function () { logEnd('again'); G.launchReq = G.lastReq ? { mode: G.lastReq.mode, boss: G.lastReq.boss, peligro: G.lastReq.peligro, phase: G.lastReq.phase, final: G.lastReq.final } : null; if (G.Fte) G.Fte.nextFrom = 'retry'; Bs.launch(); };
  Bs.retryPractice = function () { if (G.mode === 'practice') Bs.retry(); };
  function phCount() { var d = G.Boss.DEFS[G.bossId]; return d ? d.phases.length : 3; }
  var PH_BTN = function (i) { return phCount() > 4 ? { x: 516 + i * 70, y: 328, w: 66, h: 66 } : { x: 516 + i * 136, y: 328, w: 130, h: 66 }; };   // T-F1-08 fase 3: 66 de alto
  Bs.open = function (fromRun) { if (fromRun) logEnd('aldea'); G.Aldea.open(!!fromRun); };

  // ------------------------------------------------------------- Pantalla de fin / botín
  // Analítica de la pantalla de fin (una vez por pantalla): end_screen { kind, record_new, ms_on_screen, choice }
  function endKind() { var sm = G.Loot.summary || {}; return G.mode === 'practice' ? 'practica' : sm.first ? 'primera' : G.won ? 'victoria' : sm.quit ? 'abandono' : 'muerte'; }
  function logEnd(choice) {
    if (endS.logged) return; endS.logged = true;
    var sm = G.Loot.summary || {};
    try { G.Track('end_screen', { kind: endKind(), record_new: !!(sm.record && sm.record.isNew), ms_on_screen: Math.round(endS.t), choice: choice, goal_ids: (sm.goals || []).map(function (g) { return g.id; }).join(',') }); } catch (e) { /* analítica */ }
  }
  function detailOnly() { return G.mode !== 'run' || G.final || !(G.Loot.summary && G.Loot.summary.goals); }   // cacería, asalto y práctica: pantalla de siempre (ya es el detalle)
  Bs.endView = function () { return endS.view; };
  Bs.updateEnd = function () {
    var m = inp.mouse, sm = G.Loot.summary;
    if (endS.sm !== sm) { endS.sm = sm; endS.t = 0; endS.view = 'main'; endS.logged = false; }
    endS.t += G.STEP;
    var click = inp.hit('Mouse0') && endS.t >= 600;   // el dedo que seguía en el joystick al morir no cuenta
    if (endS.view === 'detail' && !detailOnly()) {
      if (inp.hit('Escape', 'KeyB', 'KeyD') || (click && U.inR(END_BASE, m))) endS.view = 'main';
      return;
    }
    if (G.mode === 'practice') {   // elegir la fase de inicio de la práctica: 1-3 (o los botones) y se reinicia al momento
      for (var pi = 0; pi < phCount(); pi++) if ((endS.t >= 600 && inp.hit('Digit' + (pi + 1))) || (click && U.inR(PH_BTN(pi), m))) { G.lastReq = G.lastReq || { mode: 'practice', boss: G.bossId }; G.lastReq.phase = pi + 1; Bs.retry(); return; }
    }
    if (endS.t < 600) return;
    if (inp.hit('KeyR', 'Enter') || (click && U.inR(END_RETRY, m))) { Bs.retry(); return; }
    if (inp.hit('KeyB', 'Escape') || (click && U.inR(END_BASE, m))) { Bs.open(true); return; }
    if (!detailOnly() && (inp.hit('KeyD') || (click && U.inR(END_PANEL, m)))) { endS.view = 'detail'; logEnd('detail'); endS.logged = false; }
  };

  // Pantalla de fin (v: textos). Rejilla vertical: título 30, subtítulo 62, columnas de y = 84 a 444, botones de y = 456. Texto >= 12 px lógicos con interlineado >= 1,3, fondo opaco
  // (no se transparenta la arena) y filas que se reparten solas: si una fila "izquierda + derecha" no cabe en el ancho del panel, la derecha baja a una línea propia.
  var PN_X = 500, PN_Y = 84, PN_W = 440, PN_H = 360, IN_X = 516, IN_W = 408;
  function infoRows(c, y, rows, size, lhh) {   // rows: [[izq, colIzq, der, colDer], ...]; devuelve la y siguiente
    size = G.fs(size || 13); var lh = Math.max(lhh || 0, Math.round(size * 1.3));   // T-F1-08 fase 3: el interlineado sigue al tamaño real (G.minFont)
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
    size = G.fs(size); var ls = U.wrap(c, text, maxW, size), lh = Math.round(size * 1.3);   // T-F1-08 fase 3: interlineado según el tamaño real (G.minFont)
    if (ls.length > maxLines) { ls = ls.slice(0, maxLines); var l = ls[maxLines - 1]; ls[maxLines - 1] = l.replace(/\s*\S{0,3}$/, '') + '...'; }
    ls.forEach(function (ln) { G.txt(c, ln, x, y, size, col, 'left'); y += lh; });
    return y;
  }
  function endTitle(c, md, prac, won) {
    var sm = G.Loot.summary || {};
    if (!prac && md === 'run' && sm.first) return 'PRIMERA EXPEDICIÓN';
    if (md === 'run' && sm.quit) return 'EXPEDICIÓN ABANDONADA';
    return prac ? (won ? 'PRÁCTICA SUPERADA' : 'PRÁCTICA: HAS CAÍDO') : md === 'hunt' ? (G.final ? (won ? 'EL CRÁTER SE APAGA' : 'EL INCENDIO TE CONSUME') : won ? 'CACERÍA CUMPLIDA' : 'LA BESTIA SE LIBRA') : won ? 'MANO GANADORA' : 'HAS CAÍDO';
  }
  function endColor(md, won) { var sm = G.Loot.summary || {}; return md === 'run' && sm.first ? '#ffd27a' : md === 'run' && sm.quit ? '#e0b8c8' : won ? '#ffd24a' : '#ff6a6a'; }
  function drawDetail(c, withBack) {
    var won = G.won, p = G.player, h = p.hand, i, S = G.Save.data, sm = G.Loot.summary || { parts: {}, total: 0, brasas: 0, newCards: [] };
    c.fillStyle = won ? 'rgb(22,16,4)' : 'rgb(22,4,10)'; c.fillRect(0, 0, G.W, G.H);
    var gr = c.createRadialGradient(480, 200, 40, 480, 200, 560); gr.addColorStop(0, won ? 'rgba(90,60,10,0.35)' : 'rgba(90,10,30,0.3)'); gr.addColorStop(1, 'rgba(0,0,0,0)'); c.fillStyle = gr; c.fillRect(0, 0, G.W, G.H);
    var md = G.mode, prac = md === 'practice';
    G.txt(c, endTitle(c, md, prac, won), G.W / 2, 30, 38, endColor(md, won), 'center');
    G.txt(c, md === 'run' ? 'Tiempo ' + G.fmtTime(G.runT) + '   -   bajas ' + G.kills + '   -   Nivel ' + p.level : (prac ? 'Práctica (jefe a media vida, sin Peligro, sin recompensas)' : (G.final ? 'Asalto al Cráter  -  Peligro ' : 'Cacería de Vesper  -  Peligro ') + G.Boss.ROMAN[G.clamp(Math.round(G.peligro || 1), 1, 5)] + (G.final ? '  -  Cenizar a vida completa' : '  -  jefe a 75 % de vida')), G.W / 2, 66, 16, '#fff', 'center');
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
      if (acts.length) { G.txt(c, 'PODERES', 20, ly, 13, '#b4a8c8', 'left'); ly += 24; } else ly = wrapLines(c, ly, G.Fusion.endText(), 2, 12, '#ffe9a0', 20, 456) + 2;
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
      c.fillStyle = 'rgba(0,0,0,0.35)'; c.fillRect(14, 370, 462, 80);
      wrapLines(c, 384, bl, 3, 13, bi.won ? '#ffd24a' : '#ff9a8a', 22, 450);
    }
    if (prac) { drawPracticePanel(c, sm); drawEndButtons(c, S); return; }   // (la práctica: panel de fases y botones)
    // ---- panel del botín
    U.panel(c, PN_X, PN_Y, PN_W, PN_H, { border: '#8a6a30' });
    G.txt(c, 'BOTÍN  (+' + sm.total + ' partes)', IN_X, 108, 18, '#ffd27a', 'left');
    var L = G.Loot, shown = 0, GY = 140, nItems = L.PARTS.filter(function (P) { return sm.parts[P.id]; }).length + (bi ? bi.trophies.length : 0), GP = nItems > 9 ? 22 : 28, COLS = 3, CW = Math.floor(IN_W / COLS);   // T-F1-08 fase 3: siempre 3 columnas (con letra 17 no caben 4)
    L.PARTS.forEach(function (P) {
      var n = sm.parts[P.id] || 0; if (!n) return;
      var col = shown % COLS, row = Math.floor(shown / COLS), x = IN_X + col * CW, y = GY + row * GP;
      U.part(c, P.id, x + 11, y, 11);
      G.txt(c, '+' + n, x + 27, y, 17, P.rare ? '#e0a8ff' : '#fff', 'left');
      G.txt(c, '(' + (S.parts[P.id] || 0) + ')', x + 64, y, 12, '#b4a8c8', 'left');
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
    var lh2 = Math.round(G.fs(13) * 1.3);
    if (sm.quest) { var ql = U.wrap(c, 'Encargo: ' + sm.quest, IN_W, 13).slice(0, 2); while (ql.length && !free(ql.length * lh2)) ql.pop(); ql.forEach(function (ln) { G.txt(c, ln, IN_X, y, 13, '#ffe9a0', 'left'); y += lh2; }); }
    if (sm.dur) {
      var dtx = 'Duración ' + sm.dur.name + ' (' + sm.dur.min + ' min): partes y Brasas x' + String(sm.dur.parts).replace('.', ',') + (sm.dur.pf !== 1 ? ', PF x' + String(sm.dur.pf).replace('.', ',') : '') + (sm.dur.rare !== 1 ? ', Esencia x' + String(sm.dur.rare).replace('.', ',') : '') + (sm.dur.bossHp !== 1 ? ', jefe +HP' : '');
      var dl = U.wrap(c, dtx, IN_W, 12).slice(0, 2); if (free(dl.length * lh2)) dl.forEach(function (ln) { G.txt(c, ln, IN_X, y, 12, '#b4a8c8', 'left'); y += lh2; });
    }
    if (sm.newCards.length) {
      var cy = bot - 62; G.txt(c, 'NUEVAS CARTAS YA FORJABLES', IN_X, cy - 14, 13, '#9dffb4', 'left');
      sm.newCards.slice(0, 6).forEach(function (id, k) { G.Cards.drawCard(c, { id: id, lvl: 0 }, IN_X + k * 68, cy, 62, 62, { nocd: true, glow: '#9dffb4', noName: G.minFont > 12 }); });   // T-F1-08: miniaturas sin nombre (la lista con nombres está en la pantalla principal)
    } else G.txt(c, 'PF libres ' + G.Tree.pfFree() + '   -   nodos comprables ' + G.Tree.availableCount(), IN_X, bot - 6, 13, '#b4a8c8', 'left');
    if (withBack) U.button(c, END_BASE, 'VOLVER', { size: 22, color: '#2a6aa8', hot: '#3a8ad0', border: '#bfeaff', sub: G.hint('B / Esc', null) });
    else drawEndButtons(c, S);
  }
  function drawEndButtons(c, S) {
    var md = G.mode, sm = G.Loot.summary || {}, rawGoal = sm.goals && sm.goals[0];
    var title = md === 'practice' ? 'REINICIAR PRÁCTICA' : md === 'hunt' ? (G.final ? 'OTRO ASALTO' : 'OTRA CACERÍA') : 'OTRA EXPEDICIÓN';
    var sub = md === 'practice' ? G.hint('R / Enter  -  misma mano; 1-3: fase de inicio', 'misma mano') : md === 'hunt' ? G.hint('R / Enter  -  6 ofertas nuevas', '6 ofertas nuevas') : rawGoal ? rawGoal.sub : G.hint('R / Enter  -  ', '') + 'anclas: ' + (S.anchors.map(function (a) { return G.Cards.def(a).short; }).join(' + ') || 'ninguna');
    U.button(c, END_RETRY, title, { size: 22, sub: sub });
    var fte = G.Fte && G.Fte.engaged() && G.Fte.data().runs >= 1, first = md === 'run' && sm.first;
    U.button(c, END_BASE, first ? 'VOLVER A RESCOLDO' : md === 'run' || md === 'hunt' ? 'ALDEA' : 'IR A LA ALDEA', { size: first ? 17 : 20, color: '#2a6aa8', hot: '#3a8ad0', border: '#bfeaff', sub: first ? (G.Fte.data().runs >= 1 ? 'Lanudo quiere hablar contigo' : null) : (G.Fte && G.Fte.engaged() && !G.Fte.npcVisible('grum') ? null : G.hint('B  -  forja y encargos', 'forja y encargos')) });
  }
  var ART = { bosque: 'EL', cripta: 'LA', asfodelo: 'EL', tundra: 'LA', panal: 'EL', crater: 'EL' };
  function statsLine(sm) {
    var E = G.EndInfo, bn = (E && E.BIOME[G.curBiome]) || 'Bosque', du = sm.dur ? sm.dur.name + ' ' + sm.dur.min + ' min' : 'Normal 9 min';
    return bn + '  ·  ' + du + '  ·  ' + G.fmtTime(G.runT) + '  ·  ' + G.kills + ' bajas  ·  Nivel ' + G.player.level;
  }
  function diamond(c, x, y, col) { c.fillStyle = col; c.beginPath(); c.moveTo(x, y - 6); c.lineTo(x + 5, y); c.lineTo(x, y + 6); c.lineTo(x - 5, y); c.closePath(); c.fill(); }
  function barAt(c, x, y, w, h, frac, col) { c.fillStyle = '#1a1226'; c.fillRect(x, y, w, h); c.fillStyle = col; c.fillRect(x, y, Math.round(w * G.clamp(frac, 0, 1)), h); c.strokeStyle = '#4a3a66'; c.lineWidth = 1; c.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1); }
  // Pantalla de fin principal (T-F1-04): qué ha pasado, qué te falta, OTRA EXPEDICIÓN con ese objetivo, lo ganado en dos líneas, aldea y detalle como secundarios
  function drawMain(c) {
    var won = G.won, p = G.player, S = G.Save.data, sm = G.Loot.summary, rec = sm.record || { prev: 0, now: 0, isNew: false }, md = G.mode;
    c.fillStyle = won ? 'rgb(22,16,4)' : 'rgb(22,4,10)'; c.fillRect(0, 0, G.W, G.H);
    var gr = c.createRadialGradient(480, 200, 40, 480, 200, 560); gr.addColorStop(0, won ? 'rgba(90,60,10,0.35)' : 'rgba(90,10,30,0.3)'); gr.addColorStop(1, 'rgba(0,0,0,0)'); c.fillStyle = gr; c.fillRect(0, 0, G.W, G.H);
    G.txt(c, endTitle(c, md, false, won), G.W / 2, 34, 34, endColor(md, won), 'center');
    var l2 = statsLine(sm);
    if (won && sm.boss && sm.boss.won) l2 = (sm.boss.name || 'Jefe') + ' vencido en ' + G.fmtTime(sm.boss.time || 0) + '  ·  ' + l2.split('  ·  ').slice(3).join('  ·  ');
    else if (sm.quit && !sm.first) l2 = 'Conservas las partes recogidas  ·  ' + G.fmtTime(G.runT) + '  ·  ' + G.kills + ' bajas  ·  Nivel ' + p.level;
    G.txt(c, l2, G.W / 2, 68, 15, '#fff', 'center');
    var bk = G.curBiome || 'bosque', best = (S.stats.best || {})[bk], E = G.EndInfo;
    // ---- izquierda
    G.txt(c, 'TU MARCA EN ' + (ART[bk] || 'EL') + ' ' + ((E && E.BIOME[bk]) || 'Bosque').toUpperCase(), 20, 104, 13, '#b4a8c8', 'left');
    var t = G.fmtTime(rec.now * 1000), line, col = '#fff', sz = 20;
    if (sm.god) { line = 'Modo de pruebas: sin récord'; col = '#9a8fb0'; sz = 14; }
    else if (sm.quit) { line = 'Abandonaste a las ' + t + (best ? '  ·  récord ' + G.fmtTime(best.t * 1000) : ''); sz = 16; }
    else if (sm.first) line = 'Tu marca: ' + t;
    else if (rec.isNew) { line = '¡Nuevo récord! ' + t + (rec.prev > 0 ? ' (antes ' + G.fmtTime(rec.prev * 1000) + ')' : ''); col = '#9dffb4'; }
    else line = t + '  ·  tu récord ' + G.fmtTime((best ? best.t : rec.now) * 1000);
    G.txt(c, line, 20, 132, sz, col, 'left');
    var ref = Math.max(best ? best.t : 0, G.BOSS_T / 1000);
    barAt(c, 20, 150, 410, 12, rec.now / ref, rec.isNew ? '#4dd870' : '#ff9a3c');
    G.txt(c, t + ' / ' + G.fmtTime(ref * 1000) + ' ' + (best && best.t > G.BOSS_T / 1000 ? 'récord' : 'Pastor'), 20, 174, 12, '#b4a8c8', 'left');
    G.txt(c, 'TE FALTA POCO', 20, 198, 13, '#b4a8c8', 'left');
    var gy = 222, gs = (sm.goals || []).slice(0, 2);
    gs.forEach(function (g) {
      diamond(c, 26, gy, '#ffd27a'); G.txt(c, g.text, 40, gy, 14, '#ffe9a0', 'left');
      if (g.frac != null) barAt(c, 40, gy + 14, 300, 10, g.frac, '#ffd27a');
      gy += 44;
    });
    if (sm.tip) { G.txt(c, 'CONSEJO', 20, 316, 13, '#b4a8c8', 'left'); wrapLines(c, 340, sm.tip, 2, 14, '#d8cfe8', 20, 430); }
    // ---- derecha: lo ganado (todo el panel abre el detalle)
    var hov = U.inR(END_PANEL, inp.mouse);
    U.panel(c, END_PANEL.x, END_PANEL.y, END_PANEL.w, END_PANEL.h, { border: hov ? '#ffd27a' : '#6a4a30' });
    G.txt(c, 'LO GANADO', 506, 108, 13, '#b4a8c8', 'left');
    G.txt(c, '+' + sm.total + ' partes  ·  +' + sm.brasas + ' Brasas', 506, 134, 16, '#ffe9a0', 'left');
    if (sm.first) G.txt(c, 'Las Brasas sirven para forjar en Rescoldo.', 506, 158, 14, '#d8cfe8', 'left');
    else if (sm.pfGained) G.txt(c, '+' + sm.pfGained + ' Punto' + (sm.pfGained > 1 ? 's' : '') + ' de Forja', 506, 158, 14, '#ffd24a', 'left');
    if (sm.newCards && sm.newCards.length)   // T-F1-08 fase 3: en lista (las miniaturas no admiten el nombre a 17); las cartas se ven en el detalle
      wrapLines(c, 182, 'Cartas nuevas para forjar: ' + sm.newCards.map(function (id) { return G.Cards.def(id).short; }).join(', '), 2, 17, '#9dffb4', 506, 420);
    G.txt(c, 'Toca para ver el botín completo', 506, 246, 12, '#9dd8ff', 'left');
    G.txt(c, 'TU MANO', 490, 284, 13, '#b4a8c8', 'left');
    for (var i = 0; i < p.hand.length; i++) {
      var hx = 490 + i * 90;
      if (p.hand[i]) G.Cards.drawCard(c, { id: p.hand[i].id, lvl: p.hand[i].lvl }, hx, 296, 86, 64, { nocd: true });
      else G.Cards.drawEmptySlot(c, hx, 296, 86, 64, '');
    }
    var acts = (p.actives || []).filter(Boolean);
    var pw = acts.length ? 'Poderes: ' + acts.slice(0, 3).map(function (a) { var d = G.Fusion.recipe(a.id); return (d ? d.short : a.id) + ' Nv' + a.lvl + ' (' + a.uses + (a.uses === 1 ? ' uso' : ' usos') + ')'; }).join('  ·  ') : G.Fusion.endText();
    wrapLines(c, 382, pw, 2, 12, '#ffe9a0', 490, 450);
    drawEndButtons(c, S);
  }
  Bs.drawEnd = function (c) {
    if (detailOnly()) { drawDetail(c, false); return; }
    if (endS.view === 'detail') drawDetail(c, true); else drawMain(c);
  };
  function drawPracticePanel(c, sm) {
    var bi = sm.boss || {}, S = G.Save.data;
    U.panel(c, 500, 96, 440, 336, { border: '#4a8a6a' });
    G.txt(c, 'PRÁCTICA', 516, 114, 18, '#9dffb4', 'left');
    var y = 144, U2 = U;   // T-F1-08 fase 3: líneas envueltas al ancho del panel (letra 17)
    ['Sin recompensas, sin pérdida de progreso y sin Peligro.', 'El jefe tiene la mitad de vida: aprende sus patrones.'].forEach(function (t) { y = wrapLines(c, y, t, 2, 13, '#d8cfe8', 516, 408); });
    y += 8;
    ['Intento ' + (bi.tries || 1) + '  -  victorias ' + (bi.wins || 0), 'Duración ' + G.fmtTime(bi.time || 0) + '  -  fase ' + G.Boss.ROMAN[bi.phase || 1], 'Partes rotas: ' + ((bi.parts && bi.parts.length) || 0) + '/' + Object.keys((G.Boss.DEFS[G.bossId] || { parts: {} }).parts).length]
      .forEach(function (t) { G.txt(c, t, 516, y, 13, '#ffe9a0', 'left'); y += 22; });
    G.txt(c, 'EMPEZAR EN LA FASE...', 516, 314, 12, '#9a8fb0', 'left');
    for (var i = 0; i < phCount(); i++) U2.button(c, PH_BTN(i), (phCount() > 4 ? 'F' + (i + 1) : 'FASE ' + G.Boss.ROMAN[i + 1]), { size: 17, color: (G.lastReq && (G.lastReq.phase || 1) === i + 1) ? '#2a8a4a' : '#2c2438', hot: '#3aba66', border: '#9dffb4' });
    if (G.hint('x', '')) G.txt(c, 'Teclas 1-' + phCount() + ': reiniciar en esa fase', 516, 414, 12, '#9a8fb0', 'left');
  }
})();
