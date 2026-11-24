/* panels.js - Paneles de la aldea (columna de 960x540 centrada en el lienzo ancho; T-F1-08: letra 17 y botones de 66 en todos, ver P.minFor): Tablón de Vesper (ofertas rotativas), Mercader Rufo (trueque / vender / comprar),
   Portal (mano al salir, anclas, duración, encargo, plato, SALIR), Archivo de Ulalume (colección con filtros por etiqueta, 3 loadouts, anclas con vista previa de combos),
   cocina de Tía Castaña (G.Cook: 1 plato por expedición), logros de Lanudo, Menú y Ajustes.
   La forja de Grum vive en tree.js (P.open('forge') la abre). Interfaz: P.open(nombre), P.update(dt) -> true si hay que cerrar, P.draw(c). */
(function () {
  'use strict';
  var G = window.G, P = G.Panels = {}, U = G.UI, inp = G.input, L = G.Loot;
  var cur = null, msg = '', msgT = 0, confirm = '', confirmT = 0;
  var R_CLOSE = { x: 890, y: 0, w: 66, h: 66 };
  var st = { rt: 0, give: 'wick', get: 'thread', qty: 1, buy: 'thread', csel: 0 };
  var LENS = [7, 9, 10];
  G.touchUI = ('ontouchstart' in window) && !!(window.matchMedia && window.matchMedia('(pointer: coarse)').matches);   // táctil: el renombrado de loadouts usa el teclado nativo

  function SV() { return G.Save.data; }
  function say(t) { msg = t; msgT = 3200; }
  function click() { return inp.hit('Mouse0'); }
  function onR(r) { return click() && U.inR(r, inp.mouse); }
  function common() { return L.PARTS.filter(function (p) { return !p.rare; }); }
  function bg(c, title) {
    c.fillStyle = 'rgb(10,5,16)'; c.fillRect(0, 0, G.W, G.H);
    G.txt(c, title, 14, 26, 24, '#ffd27a', 'left');
    U.button(c, R_CLOSE, 'X', { size: 22, color: '#7a2a3a', hot: '#c03a4a', border: '#ff8a8a' });
  }
  // T-F1-08 fase 3: el aviso (msg) se pinta ENCIMA de todo el panel, con placa y en hasta 2 líneas de 17 (antes una línea de 13 en y 56 que, con 17, no cabía)
  function drawMsg(c) {
    if (!(msgT > 0 && msg)) return;
    var ls = U.wrap(c, msg, 840, 17).slice(0, 2), h = ls.length * 22 + 12, y0 = 70;
    c.fillStyle = 'rgba(8,4,14,0.92)'; c.fillRect(50, y0, 860, h); c.strokeStyle = '#ffd27a'; c.lineWidth = 2; c.strokeRect(51, y0 + 1, 858, h - 2);
    ls.forEach(function (l, i) { G.txt(c, l, 480, y0 + 17 + i * 22, 17, '#ffe9a0', 'center'); });
  }
  function header(c, x) {
    var S = SV(); if (G.Res) G.Res.mark('brasas'); U.part(c, 'brasa', x, 24, 10); G.txt(c, 'Brasas ' + S.brasas, x + 16, 24, 16, '#ff9a3c', 'left');
  }

  P.open = function (name) {
    cur = name; msg = ''; msgT = 0; confirm = ''; st.csel = 0;
    if (name === 'manual') G.Manual.open('panel');
    if (name === 'forge') G.Tree.open();
    if (name === 'armor') G.Smith.open();
    if (name === 'rufo') st.rt = 0;
    if (name === 'portal') st.pv = null;
    if (name === 'vesper') { G.Quests.seen(); st.vt = st.vt || 0; huntFix(); }
    if (name === 'logros') { st.lsel = 0; st.lscroll = 0; G.Ach.markSeen(); }
    if (name === 'archive') { st.edit = false; st.lo = st.lo || 0; }
    if (RETO[name]) G.RetoUI.open(name);   // v10: reto del día, ficha del kit y diario (reto_ui.js)
  };
  var RETO = { reto: 1, kit: 1, diario: 1 };
  P.closeAll = function () { cur = null; st.armorFrom = null; if (G.Smith) G.Smith.close(); };
  P.vesperTab = function (n) { st.vt = n; huntFix(); };   // 0 = Tablón, 1 = Cacería (lo usa el diálogo de Vesper)
  P.current = function () { return cur; };
  P.lastMsg = function () { return msg; };   // último aviso en pantalla (pruebas)

  P.update = function (dt) {
    if (msgT > 0) msgT -= dt; if (confirmT > 0) confirmT -= dt; else confirm = '';
    if (cur === 'manual') { if (G.Manual.update(dt)) { G.Manual.close(); cur = st.manBack || 'menu'; } return false; }
    if (cur === 'forge') return G.Tree.update(dt);
    if (RETO[cur]) return G.RetoUI.update(cur, dt);
    if (cur === 'armor') { var ra = G.Smith.update(dt); if (ra && st.armorFrom === 'portal') { st.armorFrom = null; cur = 'portal'; return false; } return ra; }
    var esc = inp.hit('Escape'), cl = onR(R_CLOSE);
    if (cur === 'archive' && st.edit) { updEdit(); return false; }   // renombrar un loadout: Esc/Enter terminan la edición, no cierran el panel
    if (cur === 'menu') { if (esc) return true; }
    else if (cur === 'settings') { if (esc || cl) { cur = 'menu'; return false; } }
    else if (cur === 'cine') { if (esc || cl) { cur = 'settings'; return false; } }
    else if (cur === 'cine2') { if (esc || cl) { cur = 'cine'; return false; } }
    else if (cur === 'errlog') { if (esc || cl) { cur = 'settings'; return false; } }
    else if (cur === 'privacy') { if (esc || cl) { cur = 'settings'; return false; } }
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
    if (cur === 'cine') return updCine();
    if (cur === 'cine2') return updCine2();
    if (cur === 'errlog') return updErr();
    if (cur === 'privacy') return updPriv();
    return true;
  };
  // T-F1-08 fase 3: letra mínima por panel. Todos rehechos para 17 (G.MIN_UI = 11 px reales a 740x360): menú, ajustes y sus subpantallas, Portal, Archivo,
  // Forja y, después, Rufo, Manual, Tablón / Cacería de Vesper, Cocina, Logros y Herrería (paginados donde no cabía). Se deja la función para las pruebas.
  P.minFor = function () { return G.MIN_UI; };
  P.draw = function (c) {
    var mf = G.minFont; G.minFont = P.minFor(cur);
    try { drawCur(c); } finally { G.minFont = mf; }
  };
  function drawCur(c) {
    if (RETO[cur]) return G.RetoUI.draw(c, cur);
    if (cur === 'forge') return G.Tree.draw(c);
    if (cur === 'armor') return G.Smith.draw(c);
    if (cur === 'manual') return G.Manual.draw(c);
    if (cur === 'vesper') drawVesper(c);
    else if (cur === 'rufo') drawRufo(c);
    else if (cur === 'portal') drawPortal(c);
    else if (cur === 'archive') drawArchive(c);
    else if (cur === 'cook') drawCook(c);
    else if (cur === 'logros') drawLogros(c);
    else if (cur === 'menu') drawMenu(c);
    else if (cur === 'settings') drawSettings(c);
    else if (cur === 'cine') drawCine(c);
    else if (cur === 'cine2') drawCine2(c);
    else if (cur === 'errlog') drawErr(c);
    else if (cur === 'privacy') drawPriv(c);
    drawMsg(c);
  }

  // ============================================================= VESPER
  // Filas: el encargo activo (si ya rotó fuera del Tablón) + 3 ofertas rotativas (Quests.board). Teclas 1-4.
  // T-F1-08: letra 17 y botones de 66. Pestañas (TABLÓN / CACERÍA / DIARIO) en la fila del título; el Tablón va en páginas de 2 encargos (st.vp)
  // y la Cacería en 3 páginas (st.hpg: BESTIA, DETALLE, RECOMPENSA Y PRÁCTICA) con CAZAR y PRACTICAR siempre a la vista abajo.
  var QPER = 2;
  function qRect(k) { return { x: 14, y: 76 + k * 156, w: 932, h: 150 }; }   // k = puesto en la página
  function qBtn(k) { var r = qRect(k); return { x: r.x + r.w - 216, y: r.y + r.h - 76, w: 200, h: 66 }; }
  function qPages() { return Math.max(1, Math.ceil(G.Quests.board().length / QPER)); }
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
  // ---- paginador común de los paneles rehechos (fila inferior, a la izquierda): ANTERIOR  n/m  SIGUIENTE
  var R_PGP = { x: 14, y: 468, w: 150, h: 66 }, R_PGN = { x: 250, y: 468, w: 150, h: 66 };
  function pagerDraw(c, pg, n) {
    if (n < 2) return;
    U.button(c, R_PGP, 'ANTERIOR', { size: 17, off: pg <= 0, color: '#3a2f48', hot: '#5a4a76', border: '#8a7aa6' });
    U.button(c, R_PGN, 'SIGUIENTE', { size: 17, off: pg >= n - 1, color: '#3a2f48', hot: '#5a4a76', border: '#8a7aa6' });
    G.txt(c, (pg + 1) + '/' + n, 207, 501, 17, '#c8c0d8', 'center');
  }
  function pagerUpd(pg, n) {
    if (n < 2) return 0;
    if ((onR(R_PGP) || inp.hit('PageUp')) && pg > 0) { pg--; G.sfx('flip', { vol: 0.4 }); }
    if ((onR(R_PGN) || inp.hit('PageDown')) && pg < n - 1) { pg++; G.sfx('flip', { vol: 0.4 }); }
    return G.clamp(pg, 0, n - 1);
  }
  function tw(c, s, size) { c.font = 'bold ' + G.fs(size) + 'px "Courier New", monospace'; return c.measureText(s).width; }   // ancho real (con la letra mínima)
  // ---- CACERÍA (J3, DESIGN 4.2): encargo de Vesper por jefe y Peligro desbloqueado; PRACTICAR = sin riesgo ni recompensas, con HP x0,5
  function huntAvail(id) { return (SV().bossKills[id] || 0) > 0 || (id === 'cenizar' && G.Save.craterOpen()); }   // Cenizar: práctica y cacería desde que se abre el Cráter
  P.huntAvailable = function () { return G.Save.BOSSES.some(huntAvail); };
  function huntFix() {
    var B = G.Save.BOSSES; st.hb = st.hb || 0; st.hph = st.hph || 1;
    if (!huntAvail(B[st.hb])) { var f = B.filter(huntAvail)[0]; st.hb = f ? B.indexOf(f) : 0; }
    st.hp = G.clamp(st.hp || 1, 1, G.Save.pelMax(B[st.hb])); st.hph = Math.min(st.hph, phN());
  }
  function tabRect(i) { return { x: 112 + i * 164, y: 0, w: 160, h: 66 }; }
  function hbRect(i) { return { x: 14 + (i % 3) * 312, y: 108 + Math.floor(i / 3) * 72, w: 304, h: 66 }; }
  function hpRect(i) { return { x: 14 + i * 74, y: 284, w: 66, h: 66 }; }
  var R_HUNT = { x: 686, y: 468, w: 260, h: 66 }, R_PRAC = { x: 416, y: 468, w: 256, h: 66 }, HPAGES = 3;
  function phN() { return G.Boss.DEFS[G.Save.BOSSES[st.hb || 0]].phases.length; }   // P4: Yarlak tiene 4 fases (Practicar elige la inicial)
  function phRect(i) { var w = phN() > 4 ? 66 : 120; return { x: 14 + i * (w + 8), y: 242, w: w, h: 66 }; }
  P.vesperRects = function () { return { tab: tabRect, q: qRect, qBtn: qBtn, prev: R_PGP, next: R_PGN, hb: hbRect, hp: hpRect, ph: phRect, hunt: R_HUNT, prac: R_PRAC }; };   // pruebas
  P.vesperPage = function (n) { st.vp = n; };
  P.huntPage = function (n) { st.hpg = n; };
  function startHunt(practice) {
    var id = G.Save.BOSSES[st.hb]; if (!huntAvail(id)) return;
    G.launchReq = { mode: practice ? 'practice' : 'hunt', boss: id, peligro: practice ? 1 : st.hp, phase: practice ? st.hph : 0 };
    G.practiceHand = null; G.Base.launch();
  }
  function updHunt() {
    var B = G.Save.BOSSES, i, hp = st.hpg || 0;
    st.hpg = hp = pagerUpd(hp, HPAGES);
    if (hp === 0) for (i = 0; i < B.length; i++) if (onR(hbRect(i))) { if (huntAvail(B[i])) { st.hb = i; huntFix(); G.sfx('flip', { vol: 0.4 }); } else say('Aún no has derrotado a ' + G.Boss.DEFS[B[i]].name + ': véncelo en una expedición.'); }
    var id = B[st.hb];
    if (hp === 0) for (i = 0; i < 5; i++) if (onR(hpRect(i))) { if (i + 1 <= G.Save.pelMax(id)) { st.hp = i + 1; G.sfx('flip', { vol: 0.4 }); } else say('Peligro ' + G.Boss.ROMAN[i + 1] + ' bloqueado: véncelo antes en ' + G.Boss.ROMAN[i] + '.'); }
    if (hp === 2) for (i = 0; i < phN(); i++) if (onR(phRect(i))) { st.hph = i + 1; G.sfx('flip', { vol: 0.4 }); }
    if (onR(R_HUNT) || inp.hit('KeyF')) startHunt(false);
    if (onR(R_PRAC) || inp.hit('KeyP')) startHunt(true);
    if (inp.hit('KeyQ')) { st.hp = Math.max(1, st.hp - 1); } if (inp.hit('KeyE')) { st.hp = Math.min(G.Save.pelMax(id), st.hp + 1); }
    return false;
  }
  var TAGC = { fire: '#ff7a2a', steel: '#b8c0cc', poison: '#7be34a', ice: '#6ac8ff', lightning: '#ffe45a', blood: '#d02048' };
  function drawHunt(c) {
    var B = G.Save.BOSSES, S = SV(), Q = G.Quests, i, hp = st.hpg || 0;
    var id = B[st.hb], D = G.Boss.DEFS[id], av2 = huntAvail(id), PD = G.Boss.PELIGRO[st.hp], pmax = G.Save.pelMax(id);
    if (!av2) hp = 0;
    if (hp === 0) {   // ---- BESTIA: jefe, Peligro y reglas de la cacería
      G.txt(c, '"Hay una bestia que merece la pena. ¿Vamos?"', 14, 90, 17, '#ffd0a0', 'left');
      for (i = 0; i < B.length; i++) {
        var D0 = G.Boss.DEFS[B[i]], av = huntAvail(B[i]);
        U.button(c, hbRect(i), av ? D0.name.replace(/^El |^La |, .*$/g, '').split(' ')[0].toUpperCase() : '? ' + D0.name.replace(/^El |^La |, .*$/g, '').split(' ')[0].toUpperCase(), { size: 17, off: !av, color: st.hb === i ? '#2a6aa8' : '#2c2438', hot: '#3a8ad0', border: st.hb === i ? '#bfeaff' : '#6a5a80', sub: av ? 'Peligro hasta ' + G.Boss.ROMAN[G.Save.pelMax(B[i])] : 'vence al jefe 1 vez' });
      }
      if (!av2) { U.wrap(c, 'Derrota a este jefe en una expedición para desbloquear su cacería.', 920, 17).forEach(function (l, k) { G.txt(c, l, 14, 276 + k * 22, 17, '#ff9a8a', 'left'); }); return; }
      G.txt(c, G.hint('PELIGRO  (Q/E)', 'PELIGRO'), 14, 268, 17, '#9a8fb0', 'left');
      for (i = 0; i < 5; i++) { var op = i + 1 <= pmax; U.button(c, hpRect(i), op ? G.Boss.ROMAN[i + 1] : '?', { size: 17, off: !op, color: st.hp === i + 1 ? '#a8801a' : '#2c2438', hot: '#d8a82a', border: st.hp === i + 1 ? '#ffffff' : '#6a5a80' }); }
      var py = 296;
      U.wrap(c, 'Peligro ' + G.Boss.ROMAN[st.hp] + ': HP x' + PD.hp.toFixed(2).replace('.', ',') + ' x0,75 (cacería), daño +' + Math.round((PD.dmg - 1) * 100) + ' %', 540, 17).forEach(function (l) { G.txt(c, l, 400, py, 17, '#c8b8e8', 'left'); py += 22; });
      U.wrap(c, 'Duración ' + L.dur(SV().len).name + ' (' + SV().len + ' min, la del Portal): HP jefe x' + (G.Boss.durMul(SV().len) * L.dur(SV().len).bossHp).toFixed(2).replace('.', ',') + ', PF x' + String(L.dur(SV().len).pf).replace('.', ','), 540, 17).slice(0, 2).forEach(function (l) { G.txt(c, l, 400, py, 17, '#9dffb4', 'left'); py += 22; });
      G.txt(c, 'Sin hordas: solo la bestia y sus adds,', 14, 390, 17, '#d8cfe8', 'left');
      G.txt(c, 'más 3 gusanos de limpieza cada 25 s.', 14, 412, 17, '#d8cfe8', 'left');
      G.txt(c, 'Preparación: 6 ofertas de carta seguidas; luego entra la bestia.', 14, 440, 17, '#c8b8e8', 'left');
    } else if (hp === 1) {   // ---- DETALLE: debilidades y partes rompibles
      G.txt(c, D.name.toUpperCase(), 14, 92, 20, '#ffd27a', 'left');
      G.txt(c, D.title, 14, 118, 17, '#c8b8e8', 'left');
      G.txt(c, 'DEBILIDADES', 14, 150, 17, '#9a8fb0', 'left');
      var x = 14;
      var WV = (G.Boss.weakView && G.Boss.weakView(id)) || { weak: D.weak, resist: D.resist };
      WV.weak.forEach(function (w) { var t = (Q.TAGN[w.tag] || w.tag) + ' x' + w.mul; G.txt(c, t, x, 174, 17, TAGC[w.tag] || '#9dffb4', 'left'); x += tw(c, t, 17) + 24; });
      WV.resist.forEach(function (w) { var t = (Q.TAGN[w.tag] || w.tag) + ' x' + w.mul; G.txt(c, t, x, 174, 17, '#8a8a98', 'left'); x += tw(c, t, 17) + 24; });
      G.txt(c, 'PARTES ROMPIBLES  (cada una suelta su trofeo' + (PD.troph > 1 ? ' x2' : '') + ')', 14, 206, 17, '#9a8fb0', 'left');
      Object.keys(D.parts).forEach(function (k, j) {
        var pd = D.parts[k], tr = G.Boss.TROPHY[pd.trophy], y = 232 + j * 26;
        try { c.drawImage(Assets.sprite(G.hasSpr(tr.spr) ? tr.spr : 'trophy_pastor_horn', 0), 14, y - 11, 22, 22); } catch (e0) { /* sin icono */ }
        G.txt(c, pd.name + '  ->  ' + tr.name + '  (' + (pd.pct * 100).toFixed(pd.pct * 100 % 1 ? 1 : 0).replace('.', ',') + ' % de la vida' + (pd.phase ? ', fase ' + G.Boss.ROMAN[pd.phase] : '') + ')', 46, y, 17, '#ffe9a0', 'left');
      });
    } else {   // ---- RECOMPENSA Y PRÁCTICA
      var bmin = Math.round(D.brasas * PD.brasas), bmax = Math.round((D.brasas + D.brasasPart * 3) * PD.brasas), pw = (S.pelWins[id] || {})[st.hp] || 0, hr = (S.hunts[id] || {})[st.hp] || { wins: 0, tries: 0, best: 0 }, pr = S.practice[id] || { tries: 0, wins: 0 };
      var vE = !G.Res || G.Res.visible('esencia');   // T-F1-07: sin nombrar la Esencia antes de presentarla
      G.txt(c, 'RECOMPENSA', 14, 90, 17, '#9a8fb0', 'left');
      G.txt(c, bmin + '-' + bmax + ' Brasas, trofeos de las partes rotas, partes del jefe x' + PD.gmul.toFixed(2).replace('.', ','), 14, 114, 17, '#ffe9a0', 'left');
      G.txt(c, 'PF: ' + (pw > 0 ? 'ya cobrados en este Peligro (sin farmeo)' : '+' + Math.round((D.pf + PD.pfx) * L.dur(SV().len).pf) + ' la primera vez') + (vE ? '   -   sin Esencia segura, sin hordas' : '   -   sin hordas'), 14, 136, 17, pw > 0 ? '#9a8fb0' : '#ffd24a', 'left');
      G.txt(c, 'Cacería en Peligro ' + G.Boss.ROMAN[st.hp] + ': ' + hr.wins + ' victorias / ' + hr.tries + ' intentos' + (hr.best ? '   mejor ' + G.fmtTime(hr.best * 1000) : ''), 14, 164, 17, '#9dffb4', 'left');
      G.txt(c, 'Práctica: ' + pr.wins + ' victorias / ' + pr.tries + ' intentos', 14, 186, 17, '#9dffb4', 'left');
      G.txt(c, 'PRACTICAR  (sin riesgo, HP x0,5, sin Peligro)', 14, 222, 17, '#9dffb4', 'left');
      for (i = 0; i < phN(); i++) U.button(c, phRect(i), phN() > 4 ? 'F' + (i + 1) : 'FASE ' + G.Boss.ROMAN[i + 1], { size: 17, color: st.hph === i + 1 ? '#2a8a4a' : '#2c2438', hot: '#3aba66', border: '#9dffb4' });
      G.txt(c, 'Empieza en la fase elegida. Reinicio rápido con R.', 14, 332, 17, '#9a8fb0', 'left');
    }
    pagerDraw(c, hp, HPAGES);
    U.button(c, R_PRAC, 'PRACTICAR', { size: 20, sub: 'P  -  fase ' + G.Boss.ROMAN[st.hph] + ', intento ' + ((S.practice[id] || { tries: 0 }).tries + 1), color: '#2a8a4a', hot: '#3aba66', border: '#9dffb4' });
    U.button(c, R_HUNT, 'CAZAR', { size: 22, sub: 'F  -  Peligro ' + G.Boss.ROMAN[st.hp], color: '#c4601c' });
  }
  function updVesper() {
    for (var ti = 0; ti < 2; ti++) if (onR(tabRect(ti))) { st.vt = ti; huntFix(); G.sfx('flip', { vol: 0.4 }); }
    if (G.Obj && G.Obj.isOpen() && onR(tabRect(2))) { P.open('diario'); G.sfx('flip', { vol: 0.4 }); return false; }   // v10: objetivos diarios
    if (st.vt === 1) return updHunt();
    var n = G.Quests.board().length, pg;
    st.vp = pg = pagerUpd(Math.min(st.vp || 0, qPages() - 1), qPages());
    for (var i = 0; i < n; i++) if (inp.hit('Digit' + (i + 1)) || (Math.floor(i / QPER) === pg && onR(qBtn(i % QPER)))) qAction(i);
    return false;
  }
  function drawVesper(c) {
    var Q = G.Quests, act = Q.active(), list = Q.board(), np = qPages(), pg = Math.min(st.vp || 0, np - 1);
    bg(c, 'VESPER'); header(c, 612); G.Tree.pfIcon(c, 776, 24, 10); G.txt(c, 'PF ' + G.Tree.pfFree(), 794, 24, 17, '#ffd24a', 'left');
    ['TABLÓN', 'CACERÍA'].forEach(function (t, i) { U.button(c, tabRect(i), t, { size: 17, color: st.vt === i ? '#2a6aa8' : '#2c2438', hot: '#3a8ad0', border: st.vt === i ? '#bfeaff' : '#6a5a80', sub: i === 1 && !P.huntAvailable() ? 'vence a un jefe' : null }); });
    if (G.Obj && G.Obj.isOpen()) U.button(c, tabRect(2), G.Obj.t('tab'), { size: 17, color: '#2c2438', hot: '#3a8ad0', border: G.Obj.unseen() ? '#ffd24a' : '#6a5a80' });
    if (st.vt === 1) { drawHunt(c); return; }
    list.forEach(function (d, i) {
      if (Math.floor(i / QPER) !== pg) return;
      var k = i % QPER, r = qRect(k), b = qBtn(k), isA = act && act.id === d.id, ready = isA && Q.isReady(), prog = Q.progress(d.id), offered = Q.offers().indexOf(d) >= 0;
      U.panel(c, r.x, r.y, r.w, r.h, { border: ready ? '#7dff9a' : isA ? '#ffd24a' : '#4a3a66' });
      var nm = G.hint('[' + (i + 1) + '] ', '') + d.name, tx = r.x + 16 + tw(c, nm, 18) + 20;
      G.txt(c, nm, r.x + 16, r.y + 20, 18, '#ffd27a', 'left');
      G.txt(c, Q.tierName(d.tier), tx, r.y + 20, 17, TIERC[d.tier], 'left'); tx += tw(c, Q.tierName(d.tier), 17) + 16;
      if (d.tutorial) { G.txt(c, 'TUTORIAL', tx, r.y + 20, 17, '#9dffb4', 'left'); tx += tw(c, 'TUTORIAL', 17) + 16; }
      if (isA && !offered) G.txt(c, 'ACTIVO (ya rotó del Tablón)', tx, r.y + 20, 17, '#b4a8c8', 'left');
      var yy = r.y + 44;
      U.wrap(c, d.desc, 690, 17).slice(0, 2).forEach(function (ln) { G.txt(c, ln, r.x + 16, yy, 17, '#d8cfe8', 'left'); yy += 22; });
      U.wrap(c, 'Recompensa: ' + Q.rewardText(d) + (Q.times(d.id) ? '   (hecho ' + Q.times(d.id) + 'x: partes y Brasas a la mitad)' : ''), 690, 17).slice(0, 2).forEach(function (ln) { G.txt(c, ln, r.x + 16, yy, 17, '#ffe9a0', 'left'); yy += 22; });
      var bw = 360; c.fillStyle = '#1a1226'; c.fillRect(r.x + 16, yy - 4, bw, 8);
      c.fillStyle = ready ? '#7dff9a' : '#ff9a3c'; c.fillRect(r.x + 16, yy - 4, bw * G.clamp(prog / d.goal, 0, 1), 9);
      G.txt(c, isA ? Q.progText(d) : 'no activo', r.x + bw + 30, yy, 17, '#d8cfe8', 'left');
      var label = ready ? 'ENTREGAR' : isA ? (confirm === 'q' + i ? 'SEGURO?' : 'ABANDONAR') : 'ACEPTAR';
      U.button(c, b, label, { size: 18, off: !isA && !!act, color: ready ? '#2a8a4a' : isA ? '#7a3a3a' : '#c4601c', hot: ready ? '#3aba66' : '#ff9a3c' });
    });
    U.wrap(c, 'El Tablón cambia cada día y tras cada expedición. Un encargo a la vez; el progreso se conserva. El enemigo objetivo pesa x2,5 y entra antes (máx. 2:30).', 920, 17).slice(0, 2).forEach(function (ln, k) { G.txt(c, ln, 14, 406 + k * 22, 17, '#b4a8c8', 'left'); });
    pagerDraw(c, pg, np);
  }

  // ============================================================= RUFO
  // T-F1-08: letra 17 y botones de 66. Pestañas en la fila del título; casillas de parte de 110x92 (nombre, icono y cantidad, nota abajo).
  var RT = ['TRUEQUE', 'VENDER', 'COMPRAR'];
  var TY = { give: 130, get: 260, sell: 112, buy: 376 };   // fila de casillas de cada vista
  function rtTab(i) { return { x: 268 + i * 146, y: 0, w: 142, h: 66 }; }
  function tile(i, y) { return { x: 14 + i * 117, y: y, w: 110, h: 92 }; }
  P.rufoTab = function (n) { st.rt = n; };
  P.rufoRects = function () { return { tab: rtTab, tile: tile, ty: TY, trade: R_TRADE, qty: R_QTY, item: itemBtn }; };   // pruebas
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
      if (S.brasas < L.BUY.part) { say('El cariño no paga, mapache.'); return; }
      S.brasas -= L.BUY.part; G.Save.add(st.buy, 1); S.shop.part++; say('Compras 1 ' + L.part(st.buy).short + '.');
    } else {
      if (S.shop[what]) { say('Ya lo compraste esta salida.'); return; }
      if (S.brasas < L.BUY[what]) { say('El cariño no paga, mapache.'); return; }
      S.brasas -= L.BUY[what]; S.shop[what] = 1; S.pending[what] = 1;
      say(what === 'tonic' ? 'Tónico listo: +40 Ceniza en la próxima expedición.' : 'Imán listo: radio x1,5 en la próxima expedición.');
    }
    G.Save.save(); G.sfx('pickup', { vol: 0.6 });
  }
  var R_TRADE = { x: 250, y: 372, w: 460, h: 66 }, R_QTY = { x: 14, y: 224, w: 260, h: 66 };
  var R_ITEM = function (i) { return { x: 14, y: 106 + i * 80, w: 932, h: 74 }; };
  function itemBtn(i) { var r = R_ITEM(i); return { x: r.x + r.w - 206, y: r.y + 4, w: 196, h: 66 }; }
  function updRufo() {
    var i, cm = common(), m = inp.mouse;
    for (i = 0; i < 3; i++) if (onR(rtTab(i))) { st.rt = i; G.sfx('flip', { vol: 0.4 }); }
    if (inp.hit('KeyQ')) st.rt = (st.rt + 2) % 3;
    if (inp.hit('KeyE')) st.rt = (st.rt + 1) % 3;
    if (st.rt === 0) {
      for (i = 0; i < cm.length; i++) {
        if (onR(tile(i, TY.give))) { st.give = cm[i].id; G.sfx('flip', { vol: 0.4 }); }
        else if (onR(tile(i, TY.get))) { st.get = cm[i].id; G.sfx('flip', { vol: 0.4 }); }
      }
      if (onR(R_TRADE) || inp.hit('KeyF')) doTrade();
    } else if (st.rt === 1) {
      for (i = 0; i < cm.length; i++) if (onR(tile(i, TY.sell))) doSell(cm[i].id);
      if (onR(R_QTY)) { st.qty = st.qty === 1 ? 5 : st.qty === 5 ? 0 : 1; G.sfx('flip', { vol: 0.4 }); }
    } else {
      for (i = 0; i < cm.length; i++) if (onR(tile(i, TY.buy))) { st.buy = cm[i].id; G.sfx('flip', { vol: 0.4 }); }
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
    G.txt(c, p.short, r.x + r.w / 2, r.y + 16, 17, '#d8cfe8', 'center');
    U.part(c, p.id, r.x + 24, r.y + 45, 13); G.txt(c, 'x' + n, r.x + 44, r.y + 46, 17, n ? '#fff' : '#6a5f78', 'left');
    if (extra) G.txt(c, extra, r.x + r.w / 2, r.y + 74, 17, '#ffe9a0', 'center');
  }
  function drawRufo(c) {
    var S = SV(), cm = common(), i;
    bg(c, 'MERCADER  -  Rufo'); header(c, 718);
    for (i = 0; i < 3; i++) U.button(c, rtTab(i), RT[i], { size: 17, color: st.rt === i ? '#2a6aa8' : '#2c2438', hot: '#3a8ad0', border: st.rt === i ? '#bfeaff' : '#6a5a80' });
    if (st.rt === 0) {
      var left = L.TRADE.cupo - (S.shop.trade || 0), n = giveN(st.give);
      G.txt(c, 'Cupo de trueques esta salida: ' + left + ' de ' + L.TRADE.cupo + '   (se reinicia al volver de una expedición)', 14, 90, 17, left ? '#9dffb4' : '#ff8a8a', 'left');
      G.txt(c, 'ENTREGAS  (3 por 1; la Hebra, 6 por 1)', 14, 116, 17, '#9a8fb0', 'left');
      cm.forEach(function (p, k) { partTile(c, p, tile(k, TY.give), p.id === st.give, p.id === 'thread' ? '6 por 1' : '3 por 1'); });
      G.txt(c, 'RECIBES 1 DE...', 14, 246, 17, '#9a8fb0', 'left');
      cm.forEach(function (p, k) { partTile(c, p, tile(k, TY.get), p.id === st.get, ''); });
      var ok = st.give !== st.get && left > 0 && (S.parts[st.give] || 0) >= n;
      U.button(c, R_TRADE, 'TRUEQUE: ' + n + ' ' + L.part(st.give).short + ' > 1 ' + L.part(st.get).short, { size: 17, off: !ok, color: '#2a8a4a', hot: '#3aba66', border: '#9dffb4', sub: G.hint('[F]  -  las raras no se truecan', 'las raras no se truecan') });
    } else if (st.rt === 1) {
      G.txt(c, 'Toca una parte para venderla (' + L.SELL + ' Brasas; Hebra ' + L.SELL_THREAD + '). Las raras no se venden.', 14, 92, 17, '#9a8fb0', 'left');
      cm.forEach(function (p, k) { partTile(c, p, tile(k, TY.sell), false, '+' + (p.id === 'thread' ? L.SELL_THREAD : L.SELL) + ' c/u'); });
      U.button(c, R_QTY, 'CANTIDAD: ' + (st.qty === 0 ? 'TODAS' : st.qty), { size: 17, color: '#2a6aa8', hot: '#3a8ad0', border: '#bfeaff' });
    } else {
      G.txt(c, 'Tienda: una vez por expedición cada artículo.', 14, 90, 17, '#9a8fb0', 'left');
      var items = [
        ['Tónico de ceniza', 'Empiezas la próxima expedición con +40 de Ceniza.', L.BUY.tonic, S.shop.tonic ? 'COMPRADO' : null],
        ['Imán de bolsillo', 'Radio del imán x1,5 en la próxima expedición.', L.BUY.magnet, S.shop.magnet ? 'COMPRADO' : null],
        ['Parte común (' + L.part(st.buy).short + ')', 'Elige la parte abajo. Cupo ' + (S.shop.part || 0) + '/' + L.BUY.partCupo + ' esta salida.', L.BUY.part, (S.shop.part || 0) >= L.BUY.partCupo ? 'AGOTADO' : null]];
      items.forEach(function (it, k) {
        var r = R_ITEM(k); U.panel(c, r.x, r.y, r.w, r.h);
        G.txt(c, it[0], r.x + 16, r.y + 22, 17, '#ffd27a', 'left'); G.txt(c, it[1], r.x + 16, r.y + 50, 17, '#d8cfe8', 'left');
        U.button(c, itemBtn(k), it[3] || 'COMPRAR', { size: 17, off: !!it[3] || S.brasas < it[2], sub: it[2] + ' Brasas' });
      });
      G.txt(c, 'PARTE A COMPRAR', 14, 362, 17, '#9a8fb0', 'left');
      cm.forEach(function (p, k) { partTile(c, p, tile(k, TY.buy), p.id === st.buy, ''); });
    }
    if (!G.Sys.isTouch()) G.txt(c, 'Q/E: pestaña  -  Esc: volver', 14, 526, 17, '#b4a8c8', 'left');
  }

  // ============================================================= PORTAL
  // v (textos): el Portal se reparte en dos páginas para que nada se apelotone: SALIDA (destino, duración, Peligro, encargo y compras; la de siempre al abrir) y CARTAS (mano y anclas).
  // El botón SALIR A LA EXPEDICIÓN está siempre visible abajo a la derecha. Tab / T / toque en la pestaña cambia de página.
  // T-F1-08 fase 3: Portal en 3 páginas (DESTINO, SALIDA, CARTAS; pestañas arriba) para letra 17 y botones de 66 de alto.
  // st.ptab: 0 = DESTINO, 1 = CARTAS, 2 = SALIDA (ids estables para P.portalTab; el orden en pantalla es DESTINO, SALIDA, CARTAS)
  var PTAB_ORDER = [0, 2, 1];
  function handRect(i) { return { x: 14 + i * 96, y: 96, w: 90, h: 90 }; }
  function ancRect(i) { return { x: 14 + (i % 10) * 94, y: 238 + Math.floor(i / 10) * 76, w: 88, h: 72 }; }
  function lenRect(i) { return { x: 14 + i * 160, y: 98, w: 152, h: 66 }; }
  var R_GO = { x: 470, y: 468, w: 476, h: 66 };
  function ptabRect(id) { var k = PTAB_ORDER.indexOf(id); return { x: 404 + k * 160, y: 0, w: 154, h: 66 }; }
  P.portalRects = function () { return { tab: ptabRect, len: lenRect, pel: pelRect, hand: handRect, anc: ancRect, go: R_GO, equip: R_EQUIP }; };   // pruebas
  // Destino (bioma): decide el jefe. Orden de desbloqueo en cadena (P7): Cripta con el Pastor, Asfódelo con Karceron, Tundra con Letea, Panal con Yarlak, Cráter con los cinco.
  // hint = pista del Portal ('Lleva Fuego' en Tundra y Panal); lock = requisito en texto corto (chip) y largo (panel de destino).
  var BIOMES = [{ id: 'bosque', name: 'BOSQUE', boss: 'El Pastor Corrupto', bid: 'pastor', hint: 'Sin requisitos. El Pastor sufre más con Fuego y Acero.' },
    { id: 'cripta', name: 'CRIPTA', boss: 'Karceron el Carcelero', need: 'pastor', needName: 'el Pastor Corrupto', lockMsg: 'Bloqueado: vence al Pastor Corrupto para abrir la Cripta.', short: 'Pastor', bid: 'karceron', hint: 'Karceron y los huesos del Carcelero: Hielo y Rayo les pegan más.' },
    { id: 'asfodelo', name: 'ASFODELO', boss: 'Letea la Hidra', need: 'karceron', needName: 'Karceron', lockMsg: 'Bloqueado: vence a Karceron, el Carcelero, para abrir el Asfódelo.', short: 'Karceron', bid: 'letea', hint: 'Letea odia el Veneno y la Sangre. Cauteriza las cabezas con Fuego.' },
    { id: 'tundra', name: 'TUNDRA', boss: 'Yarlak el Coloso Gélido', need: 'letea', needName: 'Letea', lockMsg: 'Bloqueado: vence a Letea, la Hidra, para abrir la Tundra.', short: 'Letea', bid: 'yarlak', fire: true, hint: 'LLEVA FUEGO: sin él el Frío te paraliza. Fuego, Sangre y Hielo lo frenan; busca las hogueras.' },
    { id: 'panal', name: 'PANAL', boss: 'Melaria la Reina Abeja', need: 'yarlak', needName: 'Yarlak', lockMsg: 'Bloqueado: vence a Yarlak, el Coloso Gélido, para abrir el Panal.', short: 'Yarlak', bid: 'melaria', fire: true, hint: 'LLEVA FUEGO: derrite la cera y carameliza la miel; el humo sedante duerme a las abejas.' },
    { id: 'crater', name: 'CRÁTER', boss: 'Cenizar el Incendio Primero', need: '*', needName: 'los cinco jefes', short: 'los 5', bid: 'cenizar', hint: 'ASALTO: 6 ofertas de carta, sin horda ni checkpoints. Cada fase cambia la debilidad: lleva de todo.' }];
  var BIOME_GRID = [0, 1, 2, 3, 4, 5];   // orden de lectura: 2 columnas x 3 filas
  function biomeRect(i) { return { x: 14 + (i % 3) * 312, y: 80 + Math.floor(i / 3) * 74, w: 308, h: 66 }; }
  P.biomeRect = biomeRect; P.BIOMES = BIOMES; P.portalTab = function (n) { st.ptab = n; };
  // Peligro I-V (J3): se elige por jefe; vencer el Peligro N abre el N+1 (Save.data.peligro[jefe])
  var PEL_TXT = ['', 'Base.', '+1 add en las invocaciones, telegrafías -10 %.', 'Ataque nuevo o variante por jefe.', 'Furia a los 120 s, partes +30 %, derribos más cortos, 2 trofeos por parte.', 'Último aliento (2 desesperados), hasta 6 adds.'];
  // P7: lo que cambia de verdad en cada Peligro, por jefe (el Portal y la cacería lo muestran; los tests comprueban cada variante contra el código)
  var PEL_BOSS = {
    pastor: ['', 'Base.', '+1 add en La Llamada; telegrafías -10 %.', 'Embestida doble: tras la 1.ª, 2.ª carga con re-aim.', 'Furia 120 s, partes +30 %, derribos 2,4 s, 2 trofeos por parte.', 'Último aliento: dos desesperados seguidos, hasta 6 adds.'],
    karceron: ['', 'Base.', '+1 Ascua en las invocaciones; telegrafías -10 %.', 'Lluvia de 9 brasas en vez de 6.', 'Furia 120 s, partes +30 %; la marea de lava vuelve antes.', 'Último aliento: 2.º desesperado = Marea final sin lluvia.'],
    letea: ['', 'Base.', '+1 Plañidera por invocación; telegrafías -10 %.', 'Rayo del cielo desde la F1, con 6 rayos en línea.', 'Furia 120 s, partes +30 %; las cabezas rebrotan antes.', 'Último aliento: dos desesperados seguidos, hasta 6 adds.'],
    yarlak: ['', 'Base.', 'La Llamada invoca +1 Lobo (3; 4 desde la F3).', 'Aliento polar de ida y vuelta (30 grados) y Alud de 12 bloques.', 'Furia 120 s, ventisca r 300, Frío x1,3, partes +30 %, derribos 2,4 s.', 'Último aliento: dos Inviernos Eternos (el 2.º con 3 hogueras), hasta 6 adds.'],
    melaria: ['', 'Base.', 'La Llamada invoca +1 Obrera (3; 4 en la F3).', 'Picado doble: 2.º picado con re-aim de 600 ms.', 'Furia 120 s, miel x1,5 (hasta 54 celdas), partes +30 %, derribos 2,4 s.', 'Último aliento: dos Zumbidos Mortales seguidos, hasta 6 adds.'],
    cenizar: ['', 'Base: 7 fases, Rosario de 6 eslabones.', 'Daño +5 %, +1 add en Llamadas; telegrafías con suelo de esquiva.', 'Martillazo triple (F3), Eco de 3 s (F4) y 7.º eslabón Eco.', 'Furia 120 s, partes +30 %, 2.º Aviso fantasma de 1 s en el Rosario.', 'Último aliento: dos Cadenas Finales (6 % y 3 %), hasta 6 adds.']
  };
  P.pelText = function (bid, n) { return (PEL_BOSS[bid] || [])[n] || PEL_TXT[n]; };
  function pelRect(i) { return { x: 14 + i * 90, y: 362, w: 84, h: 66 }; }
  function biomeUnlocked(b, S) { S = S || SV(); return !b.need || (b.need === '*' ? G.Save.craterOpen() : (S.bossKills[b.need] || 0) > 0); }
  function effBiome() {   // el destino que de verdad se usará (como G.startGame: un bioma bloqueado cae al último abierto)
    var S = SV(), id = S.biome || 'bosque', b = BIOMES.filter(function (x) { return x.id === id; })[0] || BIOMES[0], k = 0;
    if (!biomeUnlocked(b, S)) { BIOMES.forEach(function (x, ix) { if (x.id !== 'crater' && biomeUnlocked(x, S)) k = ix; }); return BIOMES[k]; }
    return b;
  }
  P.effBiome = effBiome;
  function biomeOpen(b) { return !b.locked && biomeUnlocked(b); }
  // texto de requisito de un destino cerrado (panel del Portal y aviso al tocar)
  function lockText(b) {
    var S = SV(), k = S.bossKills;
    if (b.need === '*') { var n = G.Save.FIVE.filter(function (x) { return (k[x] || 0) > 0; }).length; return 'Bloqueado: vence a los cinco jefes (' + n + '/5) y se abre el Cráter de Cenizar.'; }
    return b.lockMsg;
  }
  function unlockedList() { return G.Cards.defs.filter(function (d) { return d.id && L.unlocked(d.id); }); }
  function toggleAnchor(id) {
    var S = SV(), a = S.anchors, i = a.indexOf(id);
    if (!L.unlocked(id)) { say('Desbloquea la carta antes de fijarla como ancla.'); return; }
    if (i >= 0) a.splice(i, 1); else { a.push(id); if (a.length > G.B.anchorSlots) a.shift(); }
    G.Save.save(); G.sfx('card_select', { vol: 0.5 });
  }
  var R_EQUIP = { x: 14, y: 384, w: 300, h: 66 };
  function updPortal() {
    var S = SV(), i, list = unlockedList(), pt = st.ptab || 0;
    if (pt === 2 && G.Armor.smithOn() && onR(R_EQUIP)) { st.armorFrom = 'portal'; P.open('armor'); G.sfx('flip', { vol: 0.5 }); return false; }
    for (i = 0; i < 3; i++) if (onR(ptabRect(i))) { st.ptab = pt = i; G.sfx('flip', { vol: 0.4 }); return false; }
    if (inp.hit('Tab', 'KeyT')) { st.ptab = pt = PTAB_ORDER[(PTAB_ORDER.indexOf(pt) + 1) % 3]; G.sfx('flip', { vol: 0.4 }); return false; }
    if (pt === 1) {   // página CARTAS: mano y anclas
      for (i = 0; i < G.B.anchorSlots; i++) if (onR(handRect(i)) && S.anchors[i]) { S.anchors.splice(i, 1); G.Save.save(); }
      for (i = 0; i < list.length; i++) if (onR(ancRect(i))) toggleAnchor(list[i].id);
      G.launchReq = null;
      if (onR(R_GO) || inp.hit('Enter')) { G.Base.launch(); }
      return false;
    }
    if (pt === 2) for (i = 0; i < 3; i++) if (onR(lenRect(i))) { S.len = LENS[i]; G.Save.save(); G.sfx('card_select', { vol: 0.5 }); }
    if (pt === 0) for (i = 0; i < BIOMES.length; i++) if (onR(biomeRect(i))) {
      if (biomeOpen(BIOMES[i])) { S.biome = BIOMES[i].id; S.portalSeen[BIOMES[i].id] = 1; st.pv = null; G.Save.save(); G.sfx('card_select', { vol: 0.5 }); }
      else { st.pv = BIOMES[i].id; say(lockText(BIOMES[i])); G.sfx('discard', { vol: 0.4 }); }   // un destino cerrado se puede mirar: el panel dice qué hay que vencer
    }
    if (inp.hit('ArrowLeft', 'ArrowRight')) {   // teclado: ciclar entre los destinos abiertos
      var op = BIOMES.filter(biomeOpen), ci = op.indexOf(effBiome()), nx = op[(ci + (inp.hit('ArrowRight') ? 1 : op.length - 1)) % op.length];
      if (nx) { S.biome = nx.id; S.portalSeen[nx.id] = 1; st.pv = null; G.Save.save(); G.sfx('card_select', { vol: 0.5 }); }
    }
    var bid = effBiome().bid;
    if (pt === 0) for (i = 0; i < 5; i++) if (onR(pelRect(i))) {
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
      if (isAn && id) { G.Cards.drawCard(c, { id: id, lvl: 0 }, r.x, r.y, r.w, r.h, { nocd: true }); G.txt(c, 'ANCLA', r.x + r.w / 2, r.y + r.h + 13, 12, '#ffd24a', 'center'); }
      else if (isAn) { G.Cards.drawEmptySlot(c, r.x, r.y, r.w, r.h, '+'); G.txt(c, 'ANCLA', r.x + r.w / 2, r.y + r.h + 13, 12, '#ffd24a', 'center'); }
      else { G.Cards.drawEmptySlot(c, r.x, r.y, r.w, r.h, '?'); G.txt(c, 'LIBRE', r.x + r.w / 2, r.y + r.h + 13, 12, '#a89cc0', 'center'); }
    }
  }
  function fx(v) { return String(v).replace('.', ','); }
  function drawPortal(c) {
    var S = SV(), list = unlockedList(), i, Q = G.Quests, pt = st.ptab || 0;
    bg(c, '¿LISTO, MARLO?'); header(c, 236);
    [['DESTINO', 0], ['SALIDA', 2], ['CARTAS (' + list.length + ')', 1]].forEach(function (t) { var on = pt === t[1]; U.button(c, ptabRect(t[1]), t[0], { size: 18, color: on ? '#2a6aa8' : '#2c2438', hot: '#3a8ad0', border: on ? '#bfeaff' : '#6a5a80' }); });
    var names = S.anchors.map(function (a) { return G.Cards.def(a).short; }).join(' + ') || 'sin anclas';
    var cb = effBiome(), bid = cb.bid, pmax = G.Save.pelMax(bid), psel = G.Save.pelSel(bid), PD = G.Boss.PELIGRO[psel], pelHpK = G.Boss.DEFS[bid].pelHp ? G.Boss.DEFS[bid].pelHp[psel] : PD.hp;
    var dd = L.DUR[S.len] || L.DUR[9];
    U.button(c, R_GO, 'SALIR A LA EXPEDICIÓN', { size: 20, sub: G.hint('Enter  -  ' + names, names) });
    if (pt !== 1) G.txt(c, cb.name + '  -  ' + dd.name + ' ' + dd.min + ' min  -  Peligro ' + G.Boss.ROMAN[psel], 14, 500, 13, '#b4a8c8', 'left');   // resumen junto a SALIR
    if (!G.Sys.isTouch()) G.txt(c, 'Tab: cambiar de página', 14, 524, 12, '#9a8fb0', 'left');
    if (pt === 1) {   // ---- CARTAS: mano al salir y anclas
      G.txt(c, 'TU MANO AL SALIR  (toca un ancla para quitarla)', 14, 82, 13, '#b4a8c8', 'left');
      drawHand(c);
      G.txt(c, 'TUS CARTAS  (toca para fijar o quitar como ancla)  -  ' + G.B.anchorSlots + ' ancla', 14, 224, 13, '#b4a8c8', 'left');
      for (i = 0; i < list.length && i < 30; i++) {
        var r = ancRect(i), isA = S.anchors.indexOf(list[i].id) >= 0;
        G.Cards.drawCard(c, { id: list[i].id, lvl: 0 }, r.x, r.y, r.w, r.h, { nocd: true, glow: isA ? '#ffd24a' : null });
        if (isA) { c.fillStyle = '#ffd24a'; c.fillRect(r.x, r.y, r.w, 20); G.txt(c, 'ANCLA', r.x + r.w / 2, r.y + 10, 12, '#2a1a00', 'center', '#ffd24a'); }
      }
      return;
    }
    var fg = G.Fte && G.Fte.engaged(), showQ = !fg || G.Fte.npcVisible('vesper'), showBuy = !fg || G.Fte.npcVisible('rufo') || G.Fte.npcVisible('castana'), showPel = !fg || pmax > 1;
    if (pt === 2) {   // ---- SALIDA: duración, encargo, compras y equipo
      G.txt(c, 'DURACIÓN  (riesgo / recompensa)', 14, 84, 13, '#b4a8c8', 'left');
      LENS.forEach(function (n, k) { var on = S.len === n, D = L.DUR[n]; U.button(c, lenRect(k), D.name, { size: 18, color: on ? '#2a6aa8' : '#2c2438', hot: '#3a8ad0', border: on ? '#bfeaff' : '#6a5a80', sub: n + ' min' }); });
      var pc = function (v) { return (v >= 1 ? '+' : '') + Math.round((v - 1) * 100) + ' %'; }, hpRel = G.Boss.durMul(dd.min) * dd.bossHp, yy = 104;
      var RS = G.Res, vPF = !RS || RS.visible('pf'), vE = !RS || RS.visible('esencia');   // T-F1-07: solo los recursos ya presentados
      U.wrap(c, dd.name + ': ' + (dd.id === 'rapida' && !vPF ? RS.t('res.rapidaTag') : dd.tag), 440, 17).slice(0, 2).forEach(function (l) { G.txt(c, l, 500, yy, 13, '#ffe9a0', 'left'); yy += 22; });
      if (RS) { if (vPF) RS.mark('pf'); if (vE) RS.mark('esencia'); }
      G.txt(c, 'Botín x' + fx(dd.parts) + (vPF ? '  PF x' + fx(dd.pf) : '') + (vE ? '  Esencia x' + fx(dd.rare) : ''), 500, yy, 13, '#9dffb4', 'left'); yy += 22;
      G.txt(c, 'Jefe a ' + G.fmtTime(dd.min * 60000 * 7.5 / 9) + '  HP ' + pc(hpRel) + '  daño ' + pc(dd.bossDmg), 500, yy, 13, '#ffb08a', 'left');
      if (showQ) {
        U.panel(c, 14, 196, 932, 84);
        G.txt(c, 'ENCARGO ACTIVO', 28, 214, 13, '#b4a8c8', 'left');
        var ql = Q.statusLine(), ls = U.wrap(c, ql || 'Ninguno. Vesper tiene encargos en el Tablón.', 900, 17);
        for (i = 0; i < ls.length && i < 2; i++) G.txt(c, ls[i], 28, 238 + i * 22, 13, ql ? '#ffe9a0' : '#b4a8c8', 'left');
        var qt = Q.target(), qf = qt && G.B.enemy[qt] && !G.B.enemy[qt].elite && G.B.famOf(effBiome().id);   // v5 A.10: si el rol del encargo no existe en la familia del destino, el encargo no avanza
        if (qt) { if (qf && !qf.use[qt]) G.txt(c, 'No avanza en este destino', 932, 214, 12, '#ff9a8a', 'right'); else G.txt(c, 'Objetivo: peso x2,5', 932, 214, 12, '#9dffb4', 'right'); }
      }
      if (showBuy) {
        U.panel(c, 14, 288, 932, 84);
        G.txt(c, 'COMPRAS Y PLATO PARA ESTA SALIDA', 28, 306, 13, '#b4a8c8', 'left');
        var dsh = G.Cook.pending(), buy = (S.pending.tonic ? 'Tónico (+40 Ceniza)  ' : '') + (S.pending.magnet ? 'Imán x1,5' : '');
        G.txt(c, buy || 'Ninguna (Rufo las vende)', 28, 330, 13, buy ? '#ffe9a0' : '#b4a8c8', 'left');
        G.txt(c, dsh ? 'Plato: ' + dsh.name : 'Plato: ninguno (Tía Castaña cocina)', 28, 352, 13, dsh ? '#ffd0dc' : '#b4a8c8', 'left');
      }
      if (G.Armor.smithOn()) {   // v8: defensa recomendada del destino y acceso al taller sin caminar
        var AR = G.Armor, rec = AR.recDef(cb.id), my = Math.round(AR.OFF ? 0 : AR.get().def), col = my >= rec ? '#7dff9a' : my >= rec * 0.7 ? '#ffd24a' : '#ff8a6a';
        U.button(c, R_EQUIP, 'EQUIPO', { size: 18, color: '#2a6a74', hot: '#3a9aaa', border: '#a8e8f0', sub: AR.readyCount() ? AR.readyCount() + ' listas' : null });
        G.txt(c, 'DEF ' + my + ' / recomendada ' + rec, 330, 417, 13, AR.OFF ? '#b4a8c8' : col, 'left');
      }
      return;
    }
    // ---- DESTINO: 6 destinos (3 x 2), información del elegido (o del cerrado que se mira) y Peligro
    BIOMES.forEach(function (b, k) {
      var r = biomeRect(k), open = biomeOpen(b), on = cb.id === b.id, pv = st.pv === b.id, hov = U.inR(r, inp.mouse);
      c.fillStyle = on ? '#2a6aa8' : open ? (hov ? '#3a3050' : '#2c2438') : (pv ? '#2a1e32' : '#1a1422'); c.fillRect(r.x, r.y, r.w, r.h);
      c.fillStyle = 'rgba(255,255,255,0.12)'; c.fillRect(r.x, r.y, r.w, 8);
      c.strokeStyle = on ? '#bfeaff' : pv ? '#c0a060' : open ? '#6a5a80' : '#3a3046'; c.lineWidth = 3; c.strokeRect(r.x + 1.5, r.y + 1.5, r.w - 3, r.h - 3);
      if (!(window.Assets && Assets.drawDestIcon && Assets.drawDestIcon(c, b.id, r.x + 26, r.y + 33, 32, { dim: !open }))) { c.fillStyle = open ? '#9a8fb0' : '#4a4058'; c.fillRect(r.x + 10, r.y + 17, 32, 32); }
      G.txt(c, b.name, r.x + 52, r.y + 21, 13, open ? '#fff' : '#a89cc0', 'left');
      G.txt(c, open ? (on ? 'ELEGIDO  -  Peligro ' + G.Boss.ROMAN[G.Save.pelSel(b.bid)] : 'Peligro ' + G.Boss.ROMAN[G.Save.pelSel(b.bid)]) : 'Tras ' + b.short, r.x + 52, r.y + 45, 12, open ? (on ? '#ffe9a0' : '#c8b8e8') : '#ff9a8a', 'left');
      if (on && !SV().portalSeen[b.id]) { SV().portalSeen[b.id] = 1; G.Save.save(); }
      if (open && !SV().portalSeen[b.id]) { c.fillStyle = '#ffd24a'; c.fillRect(r.x + r.w - 70, r.y + 10, 62, 22); G.txt(c, 'NUEVO', r.x + r.w - 39, r.y + 21, 12, '#2a1a00', 'center', 'rgba(0,0,0,0)'); }
      else if (b.fire && open) Assets.drawWeakIcon(c, 'fire', r.x + r.w - 16, r.y + 18, { size: 14 });   // pista: 'Lleva Fuego'
      if (!open) { c.fillStyle = '#a89cc0'; c.fillRect(r.x + r.w - 20, r.y + 18, 10, 8); c.strokeStyle = '#a89cc0'; c.lineWidth = 2; c.strokeRect(r.x + 19 + r.w - 38, r.y + 12, 8, 7); }
    });
    var ib = st.pv ? BIOMES.filter(function (x) { return x.id === st.pv; })[0] : cb, ln = ib && biomeOpen(ib) ? G.B.matLens(ib.id) : null, iy = 248;
    if (ib && !biomeOpen(ib)) {
      G.txt(c, ib.name + '  -  Jefe: ' + ib.boss, 14, iy, 13, '#ffb08a', 'left'); iy += 22;
      U.wrap(c, lockText(ib), 900, 17).slice(0, 2).forEach(function (l) { G.txt(c, l, 14, iy, 13, '#ff9a8a', 'left'); iy += 22; });
      if (ib.need === '*') G.Save.FIVE.forEach(function (bk, k) { var got = (SV().bossKills[bk] || 0) > 0; c.fillStyle = got ? '#ffd24a' : '#3a3046'; c.beginPath(); c.arc(24 + k * 22, iy + 2, 7, 0, 6.283); c.fill(); c.strokeStyle = '#1b1124'; c.lineWidth = 2; c.stroke(); });
    } else if (ib) {
      G.txt(c, ib.name + '  -  Jefe: ' + ib.boss, 14, iy, 13, '#ffe9a0', 'left');
      if (ln) {   // v5 A.8: etiquetas mejores / peores contra la familia del destino (solo biomas con familia y materiales activos)
        var lx = 600;
        G.txt(c, 'MEJOR', lx, iy, 12, '#9dffb4', 'left'); lx += 62;
        ln.best.forEach(function (t) { Assets.drawWeakIcon(c, t, lx, iy - 8, { size: 16 }); lx += 22; });
        lx += 16; G.txt(c, 'PEOR', lx, iy, 12, '#ff9a8a', 'left'); lx += 52;
        ln.worst.forEach(function (t) { Assets.drawWeakIcon(c, t, lx, iy - 8, { resist: true, size: 16 }); lx += 22; });
      }
      iy += 22;
      U.wrap(c, ib.hint, 920, 17).slice(0, 3).forEach(function (l) { G.txt(c, l, 14, iy, 13, ib.fire ? '#ffc890' : '#d4c8ec', 'left'); iy += 22; });
    }
    if (showPel) {
      G.txt(c, G.hint('PELIGRO  (Q/E)', 'PELIGRO') + '  -  desbloqueado hasta ' + G.Boss.ROMAN[pmax] + (psel >= 4 ? '  -  DPS 110+' : ''), 14, 346, 13, '#b4a8c8', 'left');
      for (i = 0; i < 5; i++) {
        var pr = pelRect(i), pon = psel === i + 1, pop = i + 1 <= pmax;
        U.button(c, pr, pop ? G.Boss.ROMAN[i + 1] : '?', { size: 20, off: !pop, color: pon ? ['', '#6a6a5a', '#a8801a', '#c4601c', '#b8341a', '#9a1a80'][i + 1] : '#2c2438', hot: '#3a8ad0', border: pon ? '#ffffff' : pop ? '#6a5a80' : '#3a3046' });
      }
      var py = 374;
      G.txt(c, 'HP jefe x' + pelHpK.toFixed(2).replace('.', ',') + '  daño +' + Math.round((PD.dmg - 1) * 100) + ' %  Brasas x' + PD.brasas.toFixed(2).replace('.', ',') + (PD.troph > 1 ? '  2 trofeos' : ''), 470, py, 13, '#ffe9a0', 'left'); py += 22;
      U.wrap(c, P.pelText(bid, psel), 470, 17).slice(0, 2).forEach(function (ln2) { G.txt(c, ln2, 470, py, 13, '#d4c8ec', 'left'); py += 22; });
    }
  }

  // ============================================================= ARCHIVO (Ulalume) / COLECCIÓN
  // Colección completa (28 cartas) con filtros por etiqueta, selección de anclas con vista previa de combos y sinergias, y 3 loadouts guardados.
  var FILTERS = [{ id: 'all', name: 'TODAS', color: '#e8dcb0' }, { id: 'fire', name: 'FUEGO' }, { id: 'ice', name: 'HIELO' }, { id: 'lightning', name: 'RAYO' },
    { id: 'poison', name: 'VENENO' }, { id: 'blood', name: 'SANGRE' }, { id: 'steel', name: 'ACERO' }, { id: 'neutral', name: 'NEUTRO' }];
  FILTERS.forEach(function (f) { if (!f.color) f.color = G.TAGS[f.id].color; });
  // T-F1-08 fase 3: el Archivo va en 2 páginas (pestañas arriba) para letra 17 y botones de 66: COLECCIÓN (filtros, rejilla de 7 x 4 y detalle con insignias)
  // y ANCLAS (mano al salir, sinergias y los 3 loadouts). st.atab = 0 / 1.
  var CELL = { w: 84, h: 86, gx: 86, gy: 90, x0: 14, y0: 132, cols: 7 };
  function cellRect(i) { return { x: CELL.x0 + (i % CELL.cols) * CELL.gx, y: CELL.y0 + Math.floor(i / CELL.cols) * CELL.gy, w: CELL.w, h: CELL.h }; }
  function chipRect(i) { return { x: 14 + i * 74, y: 76, w: 70, h: 48 }; }
  function atabRect(i) { return { x: 160 + i * 242, y: 0, w: 236, h: 66 }; }   // T-F1-07: 3 pestañas (COLECCIÓN, ANCLAS, RECURSOS) entre el título y la X
  var R_ANC = { x: 626, y: 362, w: 312, h: 66 };
  var LOX = 500, LOW = 436;
  function loRect(i) { return { x: LOX, y: 116 + i * 136, w: LOW, h: 128 }; }
  function loName(i) { return { x: LOX, y: 116 + i * 136, w: LOW, h: 52 }; }
  function loSave(i) { return { x: LOX + 8, y: 116 + i * 136 + 56, w: 206, h: 66 }; }
  function loApply(i) { return { x: LOX + 222, y: 116 + i * 136 + 56, w: 206, h: 66 }; }
  function handRect2(i) { return { x: 14 + i * 94, y: 96, w: 88, h: 90 }; }
  P.archRects = function () { return { tab: atabRect, chip: chipRect, cell: cellRect, anc: R_ANC, lo: loRect, save: loSave, apply: loApply, hand: handRect2 }; };   // pruebas
  P.archTab = function (n) { st.atab = n; };
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
    var S = SV(); S.loadouts[i] = { name: (S.loadouts[i] && S.loadouts[i].name) || 'LOADOUT ' + (i + 1), anchors: S.anchors.slice(), dish: S.pending.dish || null, len: S.len, armor: S.armor.equipped.slice() };
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
    if (lo.armor && Array.isArray(lo.armor)) {   // v8: equipa las piezas del loadout si existen; avisa de las que faltan
      var miss = 0; lo.armor.forEach(function (id, sl) { if (!id) return; if (G.Armor.owned(id)) S.armor.equipped[sl] = id; else miss++; }); G.Armor.dirty();
      if (miss) extra += '  (Faltan ' + miss + ' pieza' + (miss > 1 ? 's' : '') + ' de armadura.)';
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
    var list = archList(), i, S = SV(), at = st.atab || 0;
    for (i = 0; i < 3; i++) if (onR(atabRect(i)) && at !== i) { st.atab = i; G.sfx('flip', { vol: 0.4 }); return false; }
    if (inp.swipe) { st.atab = (at + 1) % 3; G.sfx('flip', { vol: 0.4 }); return false; }
    if (at === 2) return false;   // RECURSOS: solo lectura
    if (at === 1) {
      for (i = 0; i < G.B.anchorSlots; i++) if (onR(handRect2(i)) && S.anchors[i]) { S.anchors.splice(i, 1); G.Save.save(); }
      for (i = 0; i < 3; i++) {
        if (inp.hit('Digit' + (i + 1))) { st.lo = i; G.sfx('flip', { vol: 0.3 }); }
        if (onR(loSave(i))) { st.lo = i; saveLoadout(i); }
        else if (onR(loApply(i))) { st.lo = i; applyLoadout(i); }
        else if (onR(loName(i))) { if (st.lo === i && S.loadouts[i]) startEdit(); else st.lo = i; }
        else if (onR(loRect(i))) st.lo = i;
      }
      if (inp.hit('KeyZ')) saveLoadout(st.lo);
      if (inp.hit('KeyX')) applyLoadout(st.lo);
      if (inp.hit('KeyN')) startEdit();
      return false;
    }
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
    return false;
  }
  function nodeFor(card) { return G.Tree.NODES.filter(function (n) { return n.card === card && n.type === 'C'; })[0]; }
  function drawArchive(c) {
    var list = archList(), S = SV(), i, d = list[Math.min(st.csel, list.length - 1)] || list[0], id = d.id, rank = G.Save.rank(id), tc = G.TAGS[d.tag].color, at = st.atab || 0;
    var owned = G.Cards.defs.filter(function (q) { return q.id && L.unlocked(q.id); }).length;
    bg(c, 'ARCHIVO');
    ['COLECCIÓN ' + owned + '/' + G.Cards.defs.length, 'ANCLAS ' + S.anchors.length + '/' + G.B.anchorSlots + ' Y LOADOUTS', G.Res ? G.Res.t('res.tab') : 'RECURSOS'].forEach(function (t, k) { U.button(c, atabRect(k), t, { size: 17, color: at === k ? '#2a6aa8' : '#2c2438', hot: '#3a8ad0', border: at === k ? '#bfeaff' : '#6a5a80' }); });
    if (at === 2) { drawArchRes(c); return; }
    if (!G.Sys.isTouch()) G.txt(c, at ? '1-3 elegir  Z guardar  X aplicar  N nombre  -  Esc: volver' : 'Flechas: elegir  -  E: fijar  -  Q / Tab: filtro  -  Esc: volver', 14, 528, 12, '#b4a8c8', 'left');
    if (at === 1) { drawArchAnchors(c, S, d); return; }
    for (i = 0; i < FILTERS.length; i++) {
      var f = FILTERS[i], cr = chipRect(i), on = (st.filter || 'all') === f.id;
      c.fillStyle = on ? '#2a1d3a' : '#150f20'; c.fillRect(cr.x, cr.y, cr.w, cr.h); c.strokeStyle = on ? f.color : '#3a2f48'; c.lineWidth = on ? 4 : 2; c.strokeRect(cr.x + 1, cr.y + 1, cr.w - 2, cr.h - 2);
      G.txt(c, f.name, cr.x + cr.w / 2, cr.y + cr.h / 2, 12, on ? f.color : '#8a7f96', 'center');
    }
    for (i = 0; i < list.length; i++) {
      var r = cellRect(i), rk = G.Save.rank(list[i].id), isA = S.anchors.indexOf(list[i].id) >= 0;
      G.Cards.drawCard(c, { id: list[i].id, lvl: 0 }, r.x, r.y, r.w, r.h, { nocd: true, dim: rk === 0, glow: list[i] === d ? '#ffe9a0' : null });
      if (list[i] === d) { c.strokeStyle = '#ffe9a0'; c.lineWidth = 3; c.strokeRect(r.x - 2, r.y - 2, r.w + 4, r.h + 4); }
      if (rk === 0) { c.fillStyle = '#0c0814'; c.fillRect(r.x + r.w - 22, r.y + 4, 18, 16); c.fillStyle = '#9a8fb0'; c.fillRect(r.x + r.w - 20, r.y + 8, 14, 10); }
      if (isA) { c.fillStyle = '#ffd24a'; c.fillRect(r.x + r.w - 24, r.y + 2, 22, 22); G.txt(c, 'A', r.x + r.w - 13, r.y + 13, 12, '#2a1a00', 'center', '#ffd24a'); }
    }
    // detalle de la carta
    U.panel(c, 614, 76, 336, 458, { border: tc });
    G.Cards.drawCard(c, { id: id, lvl: 0 }, 626, 86, 62, 84, { nocd: true, noName: true });
    G.txt(c, d.name, 700, 100, 20, '#ffd27a', 'left');
    G.txt(c, G.TAGS[d.tag].name + ' - ' + (d.type === 'attack' ? 'ATAQUE' : 'PASIVA'), 700, 126, 12, tc, 'left');
    G.txt(c, rank ? 'RANGO ' + U.roman(rank) : 'BLOQUEADA', 700, 150, 13, rank ? '#fff' : '#ff8a8a', 'left');
    var y = 190, ls = U.wrap(c, d.desc, 310, 17);
    for (i = 0; i < ls.length && i < 4; i++) { G.txt(c, ls[i], 626, y, 12, '#d8cfe8', 'left'); y += 22; }
    var how = rank ? 'Mejoras de rango: árbol de Grum.' : G.Save.STARTERS.indexOf(id) >= 0 ? 'Carta inicial.' : 'Se desbloquea en el árbol de Grum' + (nodeFor(id) ? ': ' + nodeFor(id).name + ' (' + (G.Tree.tabOf(nodeFor(id).tree) || {}).name + ').' : '.');
    y += 4; var hl = U.wrap(c, how, 310, 17); for (i = 0; i < hl.length && i < 2; i++) { G.txt(c, hl[i], 626, y, 12, '#9dffb4', 'left'); y += 22; }
    var isAnchor = S.anchors.indexOf(id) >= 0, nw = comboNames(S.anchors.concat(isAnchor ? [] : [id]));
    var gain = isAnchor || !rank ? [] : nw.filter(function (cb) { return comboNames(S.anchors).indexOf(cb) < 0; });
    if (gain.length && y < 340) U.wrap(c, 'FUSIÓN posible: ' + gain.map(function (cb) { return cb.name; }).join(', '), 310, 17).slice(0, y < 320 ? 2 : 1).forEach(function (l) { G.txt(c, l, 626, y, 12, '#ffe9a0', 'left'); y += 22; });
    U.button(c, R_ANC, isAnchor ? 'QUITAR ANCLA' : 'FIJAR ANCLA', { off: !rank, color: '#a8801a', hot: '#d8a82a', size: 18, sub: G.hint('[E]', null) });
    // P4.5 / P7: Insignias de minijefe (trofeo menor; 3 = logro, 8 = logro + 1 Esencia, 10 = logro + 1 Esencia; cuentan las del Panal)
    G.txt(c, 'INSIGNIAS ' + G.Minis.insigniaCount() + '/10', 626, 450, 12, '#c8a0ff', 'left');
    G.Minis.ALL.forEach(function (mid, k) {
      var have = (S.insigniasEver || {})[mid], ix = 626 + k * 30;
      try { c.globalAlpha = have ? 1 : 0.9; c.drawImage(Assets.sprite(G.Minis.D[mid].ins.id, have ? 0 : 1), ix, 468, 26, 26); c.globalAlpha = 1; } catch (e0) { /* sin icono */ }
    });
  }
  // T-F1-07: página RECURSOS del Archivo. Los 7 recursos siempre (con o sin la presentación por pasos), con su saldo real; los aún no presentados llevan "Lo conocerás más adelante".
  // Una fila de 66 por recurso: nombre y saldo / cómo se consigue / para qué sirve (letra 17, interlineado 21,5).
  function resIcon(c, id, x, y) {
    try {
      if (id === 'ceniza') { c.fillStyle = '#ff9a3c'; c.beginPath(); c.moveTo(x, y - 9); c.lineTo(x + 7, y); c.lineTo(x, y + 9); c.lineTo(x - 7, y); c.closePath(); c.fill(); }
      else if (id === 'brasas') U.part(c, 'brasa', x, y, 10);
      else if (id === 'partes') U.part(c, 'thread', x, y, 10);
      else if (id === 'esencia') U.part(c, 'rare', x, y, 10);
      else if (id === 'pf') G.Tree.pfIcon(c, x, y, 10);
      else if (id === 'trofeos') c.drawImage(Assets.sprite('trophy_pastor_horn', 0), x - 12, y - 12, 24, 24);
      else if (id === 'insignias') c.drawImage(Assets.sprite('trophy_mini_carnero', 0), x - 12, y - 12, 24, 24);
    } catch (e) { /* sin icono */ }
  }
  function drawArchRes(c) {
    var rows = G.Res ? G.Res.rows() : [], RH = 66;
    rows.forEach(function (r, i) {
      var y0 = 76 + i * RH;
      if (i % 2) { c.fillStyle = 'rgba(255,255,255,0.04)'; c.fillRect(8, y0 - 2, 944, RH); }
      resIcon(c, r.id, 28, y0 + 11);
      G.txt(c, r.name, 50, y0 + 11, 17, r.soon ? '#c8b8e8' : '#ffd27a', 'left');
      c.font = 'bold ' + G.fs(17) + 'px "Courier New", monospace';
      G.txt(c, r.haveTxt, 50 + c.measureText(r.name).width + 24, y0 + 11, 17, r.have ? '#ffe9a0' : '#b4a8c8', 'left');
      if (r.soon) G.txt(c, G.Res.t('res.soon'), 946, y0 + 11, 17, '#ffb08a', 'right');
      G.txt(c, r.how, 50, y0 + 32.5, 17, '#d8cfe8', 'left');
      G.txt(c, r.use, 50, y0 + 54, 17, '#9dffb4', 'left');
    });
  }
  P.resRows = function () { return G.Res ? G.Res.rows() : []; };   // pruebas
  // Página ANCLAS del Archivo: mano al salir, sinergias y loadouts
  function drawArchAnchors(c, S, d) {
    var i;
    G.txt(c, 'TU MANO AL SALIR  (toca un ancla para quitarla)', 14, 84, 12, '#9a8fb0', 'left');
    for (i = 0; i < 5; i++) {
      var hr = handRect2(i), isAn = i < G.B.anchorSlots, a = S.anchors[i];
      if (isAn && a) { G.Cards.drawCard(c, { id: a, lvl: 0 }, hr.x, hr.y, hr.w, hr.h, { nocd: true }); G.txt(c, 'ANCLA', hr.x + hr.w / 2, hr.y + hr.h + 13, 12, '#ffd24a', 'center'); }
      else if (isAn) G.Cards.drawEmptySlot(c, hr.x, hr.y, hr.w, hr.h, '+');
      else { G.Cards.drawEmptySlot(c, hr.x, hr.y, hr.w, hr.h, '?'); G.txt(c, 'LIBRE', hr.x + hr.w / 2, hr.y + hr.h + 13, 12, '#a89cc0', 'center'); }
    }
    drawSynergy(c, S, d, S.anchors.indexOf(d.id) >= 0);
    U.panel(c, LOX - 10, 76, LOW + 20, 458);
    G.txt(c, G.Sys.isTouch() ? 'LOADOUTS  (toca el nombre para renombrar)' : 'LOADOUTS', LOX + 2, 96, 12, '#b4a8c8', 'left');
    for (i = 0; i < 3; i++) {
      var lr = loRect(i), lo = S.loadouts[i], sel = st.lo === i;
      c.fillStyle = sel ? '#2a1d3a' : '#150f20'; c.fillRect(lr.x, lr.y, lr.w, lr.h); c.strokeStyle = sel ? '#ffd27a' : '#3a2f48'; c.lineWidth = sel ? 3 : 2; c.strokeRect(lr.x + 1, lr.y + 1, lr.w - 2, lr.h - 2);
      var nm = st.edit && sel ? (st.buf || 'ESCRIBE...') + (Math.floor(Date.now() / 400) % 2 ? '_' : ' ') : (lo ? lo.name : 'VACÍO ' + (i + 1));
      G.txt(c, nm, lr.x + 10, lr.y + 16, 12, lo ? '#fff' : '#8a7f96', 'left');
      var sub = lo ? lo.anchors.map(function (a2) { return (G.Cards.def(a2) || { short: '?' }).short; }).join(' + ') + '  -  ' + lo.len + ' min' + (lo.dish ? '  -  plato' : '') : 'sin guardar';
      G.txt(c, sub.length > 40 ? sub.slice(0, 39) + '.' : sub, lr.x + 10, lr.y + 38, 12, '#b4a8c8', 'left');
      U.button(c, loSave(i), 'GUARDAR', { size: 18, color: '#2a6aa8', hot: '#3a8ad0', border: '#bfeaff' });
      U.button(c, loApply(i), 'APLICAR', { size: 18, off: !lo, color: '#2a8a4a', hot: '#3aba66', border: '#9dffb4' });
    }
  }
  // Vista previa de sinergias de etiqueta de las anclas (y de la carta señalada)
  function drawSynergy(c, S, d, isAnchor) {
    var i, N = {}, ids = S.anchors.slice(0, G.B.anchorSlots), x = 14, y = 226, w = 462;
    U.panel(c, x, y, w, 308);
    G.txt(c, 'SINERGIAS DE TUS ANCLAS', x + 12, y + 18, 12, '#b4a8c8', 'left');
    ids.forEach(function (a) { var t = G.Cards.def(a).tag; N[t] = (N[t] || 0) + 1; });
    var tags = Object.keys(N), px = x + 12;
    if (!tags.length) G.txt(c, 'Sin anclas: sal con la mano vacía.', x + 12, y + 42, 12, '#b4a8c8', 'left');
    tags.forEach(function (t) {
      var col = (G.TAGS[t] || {}).color || '#fff', nm = (G.TAGS[t] || { name: t }).name + ' x' + N[t]; c.fillStyle = col; c.beginPath(); c.arc(px + 6, y + 42, 6, 0, 6.283); c.fill();
      G.txt(c, nm, px + 16, y + 42, 12, '#d8cfe8', 'left'); px += 16 + nm.length * 10.2 + 16;
    });
    var cur = comboNames(ids);
    G.txt(c, cur.length ? 'FUSIONES POSIBLES' : 'Sin fusiones aún', x + 12, y + 66, 12, cur.length ? '#9dffb4' : '#b4a8c8', 'left');
    cur.slice(0, 4).forEach(function (cb, k) {
      c.fillStyle = G.TAGS[cb.a].color; c.beginPath(); c.arc(x + 18, y + 88 + k * 22, 5, 0, 6.283); c.fill(); c.fillStyle = G.TAGS[cb.b].color; c.beginPath(); c.arc(x + 30, y + 88 + k * 22, 5, 0, 6.283); c.fill();
      G.txt(c, cb.name, x + 42, y + 88 + k * 22, 12, '#ffe9a0', 'left');
    });
    if (cur.length > 4) G.txt(c, '+' + (cur.length - 4) + ' más', x + w - 12, y + 66, 12, '#b4a8c8', 'right');
    var set = Object.keys(N).filter(function (t) { return N[t] >= 2 && t !== 'neutral'; });
    if (set.length) G.txt(c, 'Set ' + G.TAGS[set[0]].name + ': 3 cartas +25 %', x + 12, y + 186, 12, '#c8b8e8', 'left');
    var gain = !isAnchor && G.Save.rank(d.id) ? comboNames(ids.concat([d.id])).filter(function (cb) { return cur.indexOf(cb) < 0; }) : [];
    var gt = gain.length ? 'Con ' + d.short + ': ' + gain.map(function (cb) { return cb.name; }).join(', ') : (isAnchor ? d.short + ' ya es ancla.' : 'Con ' + d.short + ': sin fusión nueva.');
    U.wrap(c, gt, w - 24, 17).slice(0, 3).forEach(function (ln, k) { G.txt(c, ln, x + 12, y + 216 + k * 22, 12, gain.length ? '#ffe9a0' : '#b4a8c8', 'left'); });
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
  // P7: platos de bioma (página 2 de la cocina). Se abren al vencer al jefe del bioma: Caldo de brasa (-35 % de ganancia de Frío) y Tundra con Letea (la Tundra se abre al vencerla),
  // Tostada de miel (la miel ralentiza la mitad) y Té de humo (humo +50 % de duración) con Yarlak (se abre el Panal), Caldo del Hogar Reencendido con Cenizar (+12 HP máximo y +1 corazón en cada puerta de fase).
  Cook.DISHES = Cook.DISHES.concat([
    { id: 'caldobrasa', page: 1, need: 'letea', needName: 'Letea (abre la Tundra)', name: 'Caldo de brasa', icon: 'wick', short: 'Brasa', desc: 'Tundra: -35 % de ganancia de Frío durante toda la expedición.', parts: { wick: 5 }, brasas: 50, fx: { cold: 0.35 } },
    { id: 'tostada', page: 1, need: 'yarlak', needName: 'Yarlak (abre el Panal)', name: 'Tostada de miel', icon: 'thread', short: 'Tostada', desc: 'Panal: la miel te ralentiza la mitad (-50 %).', parts: { thread: 5 }, brasas: 40, fx: { honey: 0.5 } },
    { id: 'tehumo', page: 1, need: 'yarlak', needName: 'Yarlak (abre el Panal)', name: 'Té de humo', icon: 'spine', short: 'Té humo', desc: 'Panal: el humo sedante dura un 50 % más (no se suma al Ahumador).', parts: { spine: 5 }, brasas: 60, fx: { smoke: 0.5 } },
    { id: 'hogar', page: 1, need: 'cenizar', needName: 'Cenizar (el Cráter)', name: 'Caldo del Hogar Reencendido', icon: 'fang', short: 'Hogar', desc: '+12 HP máximos y +1 corazón extra en cada puerta de fase de los jefes.', parts: { fang: 4, plate: 4, wick: 4 }, brasas: 100, fx: { hp: 12, gate: 1 } }
  ]);
  Cook.PAGES = [{ name: 'COMUNES', page: 0 }, { name: 'DE BIOMA', page: 1 }];
  Cook.unlocked = function (d) { return !d.need || ((SV().bossKills[d.need] || 0) > 0); };
  Cook.def = function (id) { return Cook.DISHES.filter(function (d) { return d.id === id; })[0] || null; };
  Cook.pending = function () { var id = SV().pending.dish; return id ? Cook.def(id) : null; };
  Cook.afford = function (d) { var S = SV(); if (!Cook.unlocked(d) || S.brasas < d.brasas) return false; for (var k in d.parts) if ((S.parts[k] || 0) < d.parts[k]) return false; return true; };
  Cook.can = function () { var S = SV(); return !S.pending.dish && !S.shop.dish; };
  Cook.anyAffordable = function () { return Cook.can() && Cook.DISHES.some(Cook.afford); };
  Cook.cook = function (id) {
    var S = SV(), d = Cook.def(id); if (!d) return { ok: false, msg: '' };
    if (!Cook.unlocked(d)) return { ok: false, msg: 'Receta cerrada: vence a ' + d.needName + '.' };
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
    if (G.hudWide()) {   // T-F1-08: chip anclado a la derecha de la mano (sobre el reloj roto), texto 15
      var A = G.anchor(), x = A.L + 5 * 84 + 6, y = A.B - 110, nm = d.name.length > 16 ? d.short : d.name, w = Math.ceil(nm.length * 9) + 34;
      c.save(); c.fillStyle = 'rgba(10,6,18,0.72)'; c.fillRect(x, y, w, 22); c.strokeStyle = '#d0708a'; c.lineWidth = 2; c.strokeRect(x + 1, y + 1, w - 2, 20);
      U.part(c, d.icon, x + 14, y + 11, 7); G.txt(c, nm, x + 28, y + 12, 15, '#ffe9f0', 'left'); c.restore(); return;
    }
    c.save(); c.fillStyle = 'rgba(10,6,18,0.72)'; c.fillRect(462, G.H - 34, 148, 22); c.strokeStyle = '#d0708a'; c.lineWidth = 2; c.strokeRect(463, G.H - 33, 146, 20);   // FUSION: a la derecha de la mano
    U.part(c, d.icon, 476, G.H - 23, 7); G.txt(c, d.name.length > 16 ? d.short : d.name, 490, G.H - 22, 10, '#ffe9f0', 'left'); c.restore();
  };
  // T-F1-08: letra 17 y botones de 66. Pestañas (COMUNES / DE BIOMA) en la fila del título; 3 platos por página (st.cpg) con el paginador abajo.
  var DPER = 3;
  function dRow(i) { return { x: 14, y: 104 + i * 112, w: 932, h: 104 }; }
  function dBtn(i) { var r = dRow(i); return { x: r.x + r.w - 176, y: r.y + 19, w: 164, h: 66 }; }
  function dAll() { return Cook.DISHES.filter(function (d) { return (d.page || 0) === (st.cpage || 0); }); }
  function dPages() { return Math.max(1, Math.ceil(dAll().length / DPER)); }
  function dPage() { var p = Math.min(st.cpg || 0, dPages() - 1); return dAll().slice(p * DPER, p * DPER + DPER); }
  function cpRect(i) { return { x: 344 + i * 164, y: 0, w: 160, h: 66 }; }
  P.cookPage = function (t, n) { st.cpage = t; st.cpg = n || 0; };
  P.cookRects = function () { return { tab: cpRect, row: dRow, btn: dBtn, prev: R_PGP, next: R_PGN }; };   // pruebas
  function updCook() {
    for (var t = 0; t < 2; t++) if (onR(cpRect(t))) { st.cpage = t; st.cpg = 0; G.sfx('flip', { vol: 0.4 }); }
    if (inp.hit('KeyQ') || inp.hit('KeyE')) { st.cpage = st.cpage ? 0 : 1; st.cpg = 0; G.sfx('flip', { vol: 0.4 }); }
    st.cpg = pagerUpd(Math.min(st.cpg || 0, dPages() - 1), dPages());
    var pg = dPage();
    for (var i = 0; i < pg.length; i++) if (onR(dBtn(i)) || inp.hit('Digit' + (i + 1))) {
      var r = Cook.cook(pg[i].id); say(r.msg); if (r.ok) { G.sfx('card_select', { vol: 0.8 }); try { G.Snd.play('fuse'); } catch (e) { /* audio */ } if (G.Aldea.onCooked) G.Aldea.onCooked(); } else G.sfx('discard', { vol: 0.5 });
    }
    return false;
  }
  function drawCook(c) {
    var S = SV(), cur = Cook.pending(), pg = dPage();
    bg(c, 'COCINA  -  Tía Castaña'); header(c, 680);
    Cook.PAGES.forEach(function (p, t) {
      var anyOk = Cook.DISHES.some(function (d) { return (d.page || 0) === t && Cook.afford(d) && Cook.can(); });
      U.button(c, cpRect(t), p.name, { size: 17, color: (st.cpage || 0) === t ? '#2a6aa8' : '#2c2438', hot: '#3a8ad0', border: (st.cpage || 0) === t ? '#bfeaff' : '#6a5a80', sub: anyOk ? 'hay platos' : null });
    });
    G.txt(c, cur ? 'Preparado: ' + cur.name : S.shop.dish ? 'Hoy ya comiste. Vuelve tras otra expedición.' : 'Un plato por expedición. Se come solo al salir.', 14, 88, 17, cur ? '#9dffb4' : '#9a8fb0', 'left');
    pg.forEach(function (d, i) {
      var r = dRow(i), ok = Cook.afford(d), isCur = cur && cur.id === d.id, lk = !Cook.unlocked(d);
      U.panel(c, r.x, r.y, r.w, r.h, { border: isCur ? '#7dff9a' : ok ? '#8a6a4a' : '#3a2f48' });
      U.part(c, d.icon, r.x + 28, r.y + 30, 14);
      G.txt(c, G.hint('[' + (i + 1) + '] ', '') + (lk ? '? ' : '') + d.name, r.x + 58, r.y + 20, 17, lk ? '#a89cc0' : '#ffd27a', 'left');
      var x = r.x + 58, k, s1;   // ingredientes (lo que tienes / lo que pide)
      for (k in d.parts) { var have = S.parts[k] || 0; s1 = have + '/' + d.parts[k]; U.part(c, k, x + 8, r.y + 45, 9); G.txt(c, s1, x + 22, r.y + 46, 17, have >= d.parts[k] ? '#9dffb4' : '#ff8a8a', 'left'); x += 22 + tw(c, s1, 17) + 18; }
      U.part(c, 'brasa', x + 8, r.y + 45, 9); G.txt(c, S.brasas + '/' + d.brasas, x + 22, r.y + 46, 17, S.brasas >= d.brasas ? '#9dffb4' : '#ff8a8a', 'left');
      U.wrap(c, lk ? 'Receta cerrada: vence a ' + d.needName + '.' : d.desc, 680, 17).slice(0, 2).forEach(function (ln, q) { G.txt(c, ln, r.x + 58, r.y + 72 + q * 22, 17, lk ? '#ff9a8a' : '#d8cfe8', 'left'); });
      U.button(c, dBtn(i), isCur ? 'LISTO' : lk ? 'CERRADA' : 'COCINAR', { size: 17, off: !Cook.can() || !ok || isCur, color: '#2a8a4a', hot: '#3aba66', border: '#9dffb4' });
    });
    pagerDraw(c, Math.min(st.cpg || 0, dPages() - 1), dPages());
    if (!G.Sys.isTouch()) G.txt(c, '1-' + pg.length + ': cocinar  -  Q / E: cambiar de página  -  Esc: volver', 14, 450, 17, '#b4a8c8', 'left');
  }

  // ============================================================= LOGROS (Abuelo Lanudo)
  // P7: con 24 logros la lista ya no cabe: se desplaza con las flechas, los botones ANTERIORES / SIGUIENTES o al elegir una fila fuera de pantalla
  // T-F1-08: letra 17; filas de 66 (5 por página) a la izquierda, ficha a la derecha y ANTERIORES / SIGUIENTES de 66 abajo.
  var LROWS = 5;
  function lRow(i) { return { x: 14, y: 76 + (i - (st.lscroll || 0)) * 72, w: 586, h: 66 }; }
  function lVis(i) { var k = i - (st.lscroll || 0); return k >= 0 && k < LROWS; }
  var R_LUP = { x: 14, y: 468, w: 200, h: 66 }, R_LDN = { x: 400, y: 468, w: 200, h: 66 };
  P.logrosRects = function () { return { row: lRow, up: R_LUP, dn: R_LDN }; };   // pruebas
  P.logrosScroll = function (n) { st.lscroll = n; st.lsel = n; lFix(); };   // pruebas
  function lFix() { var n = G.Ach.DEFS.length; st.lsel = G.clamp(st.lsel || 0, 0, n - 1); st.lscroll = G.clamp(st.lscroll || 0, 0, Math.max(0, n - LROWS)); if (st.lsel < st.lscroll) st.lscroll = st.lsel; if (st.lsel >= st.lscroll + LROWS) st.lscroll = st.lsel - LROWS + 1; }
  // T-F1-07: los textos de un logro no nombran un recurso que G.Res aún no enseña (cuentas del flujo nuevo). Insignias, trofeos o PF ocultos: el nombre
  // pasa a "???" y la descripción / el recuerdo a "Lo conocerás más adelante"; la Esencia oculta pasa a "parte rara" (G.Res.fix, como en el reto y los encargos).
  var ACH_RX = { insignias: /[Ii]nsignia/, trofeos: /[Tt]rofeo/, pf: /\bPF\b|[Pp]untos? de [Ff]orja/ };
  function achHidden(t) { var R = G.Res; if (!R) return false; for (var k in ACH_RX) if (ACH_RX[k].test(t) && !R.visible(k)) return true; return false; }
  function achFix(t) { var R = G.Res; if (!R || R.visible('esencia')) return t; return R.fix(t).replace(/\b(una|otra) Esencia\b/g, '$1 ' + R.t('res.rareAsPart').replace(/^1 /, '')); }
  function achText(t, alt) { return achHidden(t) ? alt : achFix(t); }
  P.achText = function (a) { return { name: achText(a.name, '???'), desc: achText(a.desc, G.Res ? G.Res.t('res.soon') : ''), lore: achText(a.lore, G.Res ? G.Res.t('res.soon') : '') }; };   // pruebas
  function fitTxt(c, t, w, size) { if (tw(c, t, size) <= w) return t; while (t.length > 4 && tw(c, t + '.', size) > w) t = t.slice(0, -1); return t.replace(/[\s.,;:]+$/, '') + '.'; }
  function updLogros() {
    var n = G.Ach.DEFS.length, i;
    if (inp.hit('ArrowDown', 'KeyS')) st.lsel = Math.min(n - 1, (st.lsel || 0) + 1);
    if (inp.hit('ArrowUp', 'KeyW')) st.lsel = Math.max(0, (st.lsel || 0) - 1);
    for (i = 0; i < n; i++) if (lVis(i) && onR(lRow(i))) { st.lsel = i; G.sfx('flip', { vol: 0.3 }); }
    if (onR(R_LUP)) { st.lscroll = Math.max(0, (st.lscroll || 0) - LROWS); st.lsel = st.lscroll; G.sfx('flip', { vol: 0.3 }); }
    if (onR(R_LDN)) { st.lscroll = Math.min(Math.max(0, n - LROWS), (st.lscroll || 0) + LROWS); st.lsel = Math.max(st.lsel || 0, st.lscroll); G.sfx('flip', { vol: 0.3 }); }
    lFix();
    return false;
  }
  function drawLogros(c) {
    var A = G.Ach, S = SV(), sel = A.DEFS[st.lsel || 0]; lFix();
    bg(c, 'MEMORIAS  -  Abuelo Lanudo'); G.txt(c, A.count() + '/' + A.DEFS.length + ' logros', 400, 24, 17, '#ffd24a', 'left');
    A.DEFS.forEach(function (a, i) {
      if (!lVis(i)) return;
      var r = lRow(i), got = !!S.ach[a.id], on = i === (st.lsel || 0), tx = P.achText(a);
      c.fillStyle = on ? '#2a1d3a' : '#150f20'; c.fillRect(r.x, r.y, r.w, r.h); c.strokeStyle = got ? '#ffd24a' : '#3a2f48'; c.lineWidth = on ? 3 : 2; c.strokeRect(r.x + 1, r.y + 1, r.w - 2, r.h - 2);
      c.fillStyle = got ? '#ffd24a' : '#3a2f48'; c.beginPath(); c.arc(r.x + 22, r.y + 33, 12, 0, 6.283); c.fill();
      if (got) G.txt(c, 'v', r.x + 22, r.y + 34, 17, '#3a2410', 'center', 'rgba(0,0,0,0)');
      G.txt(c, fitTxt(c, tx.name, r.w - 56, 17), r.x + 44, r.y + 21, 17, got ? '#fff' : '#a89cc0', 'left');
      G.txt(c, fitTxt(c, tx.desc, r.w - 56, 17), r.x + 44, r.y + 46, 17, got ? '#d4c8e8' : '#a89cc0', 'left');
    });
    U.panel(c, 612, 76, 334, 384, { border: '#b8a878' });
    if (sel) {
      var st2 = P.achText(sel), got2 = !!S.ach[sel.id], y = 100;
      U.wrap(c, st2.name, 306, 20).slice(0, 2).forEach(function (l) { G.txt(c, l, 626, y, 20, '#ffd27a', 'left'); y += 26; });
      y += 6;
      var ls = U.wrap(c, got2 ? '"' + st2.lore + '"' : 'Aún no lo has conseguido. ' + st2.desc, 306, 17);
      for (var k = 0; k < ls.length && y < 452; k++, y += 22) G.txt(c, ls[k], 626, y, 17, got2 ? '#e8dcb0' : '#8a7f96', 'left');
    }
    var n = A.DEFS.length, sc = st.lscroll || 0;
    U.button(c, R_LUP, 'ANTERIORES', { size: 17, off: sc <= 0, color: '#2c2438', hot: '#3a3050', border: '#8a7aa6' });
    U.button(c, R_LDN, 'SIGUIENTES', { size: 17, off: sc >= n - LROWS, color: '#2c2438', hot: '#3a3050', border: '#8a7aa6' });
    G.txt(c, (sc + 1) + '-' + Math.min(n, sc + LROWS) + ' de ' + n, 307, 501, 17, '#b4a8c8', 'center');
    if (!G.Sys.isTouch()) G.txt(c, 'Flechas: elegir  -  Esc: volver', 626, 501, 17, '#b4a8c8', 'left');
  }

  // ============================================================= MENÚ y AJUSTES
  var MB = function (i) { return { x: 250, y: 96 + i * 74, w: 460, h: 66 }; };   // T-F1-08 fase 3: 66 de alto, ancho para la letra 17
  function updMenu() {
    var S = SV();
    if (onR(R_CLOSE) || onR(MB(3))) return true;
    if (onR(MB(0))) { G.Aldea.fromMenu = true; cur = 'archive'; st.csel = 0; }
    else if (onR(MB(1))) { cur = 'settings'; }
    else if (onR(MB(4))) { st.manBack = 'menu'; P.open('manual'); }
    else if (onR(MB(5)) && G.RetoUI && G.RetoUI.chipsOn()) { P.open(G.Daily.isOpen() ? 'reto' : 'diario'); }   // v10
    else if (onR(MB(2))) {
      if (confirm === 'del') { G.Save.reset(); G.Aldea.open(false); say('Progreso borrado.'); return false; }
      confirm = 'del'; confirmT = 4000; say('Pulsa otra vez para BORRAR todo el progreso (no se puede deshacer; exporta antes si dudas).');
    }
    return false;
  }
  function drawMenu(c) {
    var S = SV();
    bg(c, 'MENÚ');
    G.txt(c, 'Expediciones ' + S.runs + '   Victorias ' + S.wins + (S.pity > 0 && (!G.Res || G.Res.visible('esencia')) ? '   Rara +' + (S.pity * 100).toFixed(1) + '%' : ''), 480, 76, 13, '#9a8fb0', 'center');
    U.button(c, MB(0), 'COLECCIÓN', { size: 20, color: '#2a6aa8', hot: '#3a8ad0', border: '#bfeaff' });
    U.button(c, MB(1), 'AJUSTES', { size: 20, color: '#4a3a66', hot: '#6a5a86', border: '#8a7aa6' });
    U.button(c, MB(2), confirm === 'del' ? 'SEGURO? TOCA DE NUEVO' : 'BORRAR PROGRESO', { size: 18, color: confirm === 'del' ? '#a02030' : '#3a2f48', hot: '#c03040', border: '#8a6a8a' });
    U.button(c, MB(3), G.hint('CERRAR [Esc]', 'CERRAR'), { size: 20 });
    U.button(c, MB(4), 'MANUAL', { size: 20, color: '#6a4a2a', hot: '#9a6a3a', border: '#ffd27a', sub: 'cartas, fusiones y demostraciones' });
    if (G.RetoUI && G.RetoUI.chipsOn()) U.button(c, MB(5), G.Daily.t('menuBtn'), { size: 18, color: '#8a6a1a', hot: '#b88a2a', border: '#ffd24a', sub: G.Daily.t('menuSub') });   // v10
  }
  // ---- CINEMÁTICAS (v9): Reducir destellos y repetir la intro (saltable en repeticiones; no escribe en el guardado)
  var CB = { calm: { x: 250, y: 84, w: 460, h: 66 }, intro: { x: 250, y: 158, w: 460, h: 66 }, entries: { x: 250, y: 232, w: 460, h: 66 }, epi: { x: 250, y: 306, w: 226, h: 66 }, cred: { x: 484, y: 306, w: 226, h: 66 }, back: { x: 330, y: 462, w: 300, h: 66 } };   // T-F1-08 fase 3: 66 de alto
  function endUnlocked() { var S = G.Save.data; return !!(S.endingSeen || (S.cine && (S.cine.epilogueSeen || S.cine.creditsSeen)) || (S.bossKills && S.bossKills.cenizar > 0)); }
  function updCine() {
    if (onR(CB.calm)) { G.Cine.setCalm(!G.Cine.cfg().calm); G.sfx('card_select', { vol: 0.5 }); }
    if (onR(CB.intro) && !G.Cine.off) {
      G.Panels.closeAll(); G.Aldea.setPanel(null);
      G.Cine.playIntro({ replay: true, onEnd: function () { G.Aldea.open(false); } });
      return true;
    }
    if (onR(CB.entries)) { cur = 'cine2'; return false; }
    var back = function () { G.Aldea.open(false); };
    if (onR(CB.epi) && !G.Cine.off && endUnlocked()) { G.Panels.closeAll(); G.Aldea.setPanel(null); G.Ending.playAll({ replay: true, returnState: 'aldea', onEnd: back }); return true; }   // epílogo + créditos (no escribe en el guardado)
    if (onR(CB.cred) && !G.Cine.off && endUnlocked()) { G.Panels.closeAll(); G.Aldea.setPanel(null); G.Ending.playCredits({ replay: true, returnState: 'aldea' }, back); return true; }
    if (onR(CB.back)) cur = 'settings';
    return false;
  }
  // ---- Ver entradas de jefe (galería): una por jefe; las que aún no viste salen bloqueadas
  var EB = function (i) { return { x: 100 + (i % 2) * 390, y: 80 + Math.floor(i / 2) * 74, w: 370, h: 66 }; };
  var EN_NAMES = { pastor: 'El Pastor', karceron: 'Karceron', letea: 'Letea', yarlak: 'Yarlak', melaria: 'Melaria', cenizar: 'Cenizar (con prerrollo)' };
  function updCine2() {
    var ids = G.Cine.entryIds;
    for (var i = 0; i < ids.length; i++) if (onR(EB(i)) && !G.Cine.off && G.Cine.entrySeen(ids[i])) {
      G.Panels.closeAll(); G.Aldea.setPanel(null);
      G.Cine.playEntry(ids[i], { onEnd: function () { G.Aldea.open(false); } });
      return true;
    }
    if (onR(CB.back)) cur = 'cine';
    return false;
  }
  function drawCine2(c) {
    bg(c, 'ENTRADAS DE JEFE'); var ids = G.Cine.entryIds;
    for (var i = 0; i < ids.length; i++) {
      var seen = G.Cine.entrySeen(ids[i]);
      U.button(c, EB(i), seen ? EN_NAMES[ids[i]] : '???', { size: 18, off: !seen || G.Cine.off, color: '#4a3a66', hot: '#6a5a86', border: '#8a7aa6', sub: G.Cine.off ? 'apagadas con ?cine=0' : seen ? 'se puede saltar' : 'aún no te has enfrentado a él' });
    }
    G.txt(c, 'Se ven a pantalla completa. No cambian nada de tus partidas.', 480, 316, 12, '#9a8fb0', 'center');
    U.button(c, CB.back, 'ATRÁS', { size: 20 });
  }
  function drawCine(c) {
    bg(c, 'CINEMÁTICAS'); var cf = G.Cine.cfg();
    U.button(c, CB.calm, 'Reducir destellos: ' + (cf.calm ? 'SÍ' : 'NO'), { size: 16, color: cf.calm ? '#2a6aa8' : '#2c2438', sub: 'Destellos suaves y menos frecuentes' });
    U.button(c, CB.intro, 'Ver la intro', { size: 18, off: G.Cine.off, color: '#4a3a66', hot: '#6a5a86', border: '#8a7aa6', sub: G.Cine.off ? 'apagada con ?cine=0' : 'se puede saltar' });
    U.button(c, CB.entries, 'Ver entradas de jefe', { size: 18, off: G.Cine.off, color: '#4a3a66', hot: '#6a5a86', border: '#8a7aa6', sub: G.Cine.off ? 'apagadas con ?cine=0' : 'galería, se pueden saltar' });
    var eu = endUnlocked(), off = G.Cine.off || !eu, sb = G.Cine.off ? 'apagado con ?cine=0' : eu ? 'se puede saltar' : 'tras vencer a Cenizar';
    U.button(c, CB.epi, eu ? 'Ver epílogo' : '???', { size: 16, off: off, color: '#4a3a66', hot: '#6a5a86', border: '#8a7aa6', sub: sb });
    U.button(c, CB.cred, eu ? 'Ver créditos' : '???', { size: 16, off: off, color: '#4a3a66', hot: '#6a5a86', border: '#8a7aa6', sub: sb });
    G.txt(c, 'Los subtítulos están siempre activos.', 480, 396, 12, '#9a8fb0', 'center'); G.txt(c, 'Las sacudidas siguen el ajuste "Reducir sacudidas".', 480, 420, 12, '#9a8fb0', 'center');
    U.button(c, CB.back, 'ATRÁS', { size: 20 });
  }
  // ---- Informe de errores (diag.js): los últimos 20 errores de este dispositivo; se copian para pegarlos al estudio. No se envía nada.
  var ER = { copy: { x: 150, y: 384, w: 320, h: 66 }, clear: { x: 490, y: 384, w: 320, h: 66 }, back: { x: 330, y: 472, w: 300, h: 66 } };
  function updErr() {
    if (onR(ER.copy) && Diag.count()) { Diag.copy().then(function (ok) { st.errMsg = ok ? 'Informe copiado: pégalo donde te lo pidan.' : 'No se pudo copiar: este navegador lo impide.'; }); G.sfx('card_select', { vol: 0.5 }); }
    if (onR(ER.clear) && Diag.count()) { Diag.clear(); st.errMsg = 'Registro vaciado.'; G.sfx('card_select', { vol: 0.5 }); }
    if (onR(ER.back)) cur = 'settings';
    return false;
  }
  function drawErr(c) {
    bg(c, 'INFORME DE ERRORES'); var es = Diag.entries().reverse(), i;   // T-F1-08 fase 3: letra 17, 4 errores por pantalla (el resto va en el informe copiado)
    var head = es.length ? es.length + ' errores guardados aquí (los más nuevos arriba). Versión ' + Diag.build + '.' : 'No hay errores guardados.';
    U.wrap(c, head, 800, 17).slice(0, 2).forEach(function (l, k) { G.txt(c, l, 480, 80 + k * 22, 13, '#b4a8c8', 'center'); });
    for (i = 0; i < es.length && i < 4; i++) {
      var e = es[i], y = 122 + i * 62;
      c.fillStyle = 'rgba(20,12,32,0.7)'; c.fillRect(40, y, 880, 56);
      G.txt(c, (e.n > 1 ? 'x' + e.n + '  ' : '') + e.msg.slice(0, 80), 52, y + 16, 13, '#ffd2c8', 'left');
      G.txt(c, (e.src ? e.src + ':' + e.line + '  ' : '') + e.kind + '  ' + e.at.slice(0, 19).replace('T', ' ') + '  ' + (e.ctx && e.ctx.state || ''), 52, y + 39, 12, '#9a8fb0', 'left');
    }
    if (es.length > 4) G.txt(c, '... y ' + (es.length - 4) + ' más (van en el informe copiado)', 480, 372, 12, '#9a8fb0', 'center');
    U.button(c, ER.copy, 'COPIAR INFORME', { size: 18, off: !es.length, color: '#2a6aa8', hot: '#3a8ad0', border: '#bfeaff' });
    U.button(c, ER.clear, 'VACIAR', { size: 18, off: !es.length, color: '#3a2f48', hot: '#c03040', border: '#8a6a8a' });
    if (st.errMsg) G.txt(c, st.errMsg, 480, 462, 13, '#9dffb4', 'center');
    U.button(c, ER.back || CB.back, 'ATRÁS', { size: 20 });
  }
  // ---- Privacidad (T-F1-01): dar / retirar el permiso de analítica, ver qué se envía, ids de sesión, borrar datos locales y política. track.js / track_ui.js
  var PV = { back: { x: 330, y: 470, w: 300, h: 66 }, tog: { x: 110, y: 112, w: 740, h: 66 }, view: { x: 110, y: 184, w: 366, h: 66 }, pol: { x: 484, y: 184, w: 366, h: 66 }, wipe: { x: 110, y: 256, w: 366, h: 66 }, ids: { x: 484, y: 256, w: 366, h: 66 } };   // T-F1-08 fase 3: 66 de alto
  function updPriv() {
    var T = G.Track, ts = T.state();
    if (onR(PV.tog) && ts.available) { T.consent(ts.consent !== true, 'ajustes'); st.privMsg = ts.consent === true ? 'Permiso retirado: no se enviará nada más y la cola se vació.' : 'Permiso dado. Gracias.'; G.sfx('card_select', { vol: 0.5 }); }
    if (onR(PV.view)) { st.privView = !st.privView; G.sfx('flip', { vol: 0.3 }); }
    if (onR(PV.pol)) G.TrackUI.openPolicy();
    if (onR(PV.wipe)) { if (confirm === 'wipe') { T.wipe(); confirm = ''; st.privMsg = 'Datos de analítica borrados de este dispositivo.'; } else { confirm = 'wipe'; confirmT = 4000; st.privMsg = 'Pulsa otra vez para borrar los datos de analítica de este dispositivo.'; } }
    if (onR(PV.ids) && ts.sessions.length) { var tx = ts.sessions.join('\n'); try { navigator.clipboard.writeText(tx).then(function () { st.privMsg = 'Ids copiados: pégalos en el correo de la política.'; }, function () { st.privMsg = 'No se pudo copiar.'; }); } catch (e) { st.privMsg = 'No se pudo copiar.'; } }
    if (onR(PV.back)) cur = 'settings';
    return false;
  }
  function drawPriv(c) {
    var T = G.Track, ts = T.state(); bg(c, 'PRIVACIDAD');
    var info = !ts.available ? 'No disponible en este dispositivo o sesión: no se envía nada.' : ts.consent === true ? (ts.adapter === 'none' ? 'Permiso dado, pero el envío no está activo en esta versión: no sale nada.' : 'Envío de estadísticas: ACTIVADO (sin datos que te identifiquen directamente).') : ts.consent === false ? 'Envío de estadísticas: DESACTIVADO. No sale nada de tu dispositivo.' : 'Aún no has elegido. Mientras tanto no sale nada.';
    U.wrap(c, info, 800, 17).slice(0, 2).forEach(function (l, k) { G.txt(c, l, 480, 80 + k * 22, 13, '#b4a8c8', 'center'); });
    U.button(c, PV.tog, ts.consent === true ? 'Retirar mi permiso de estadísticas' : 'Dar permiso (tengo 18 años o más)', { size: 18, off: !ts.available, color: '#3a2f48', hot: '#5a4a70', border: '#ffd27a' });
    U.button(c, PV.view, st.privView ? 'Ocultar lo que se envía' : 'Ver qué se envía', { size: 17, color: '#4a3a66', hot: '#6a5a86', border: '#8a7aa6' });
    U.button(c, PV.pol, 'Política de privacidad', { size: 17, color: '#4a3a66', hot: '#6a5a86', border: '#8a7aa6' });
    U.button(c, PV.wipe, confirm === 'wipe' ? 'SEGURO? TOCA DE NUEVO' : 'Borrar datos de analítica', { size: 17, color: confirm === 'wipe' ? '#a02030' : '#3a2f48', hot: '#c03040', border: '#8a6a8a' });
    U.button(c, PV.ids, 'Copiar ids de sesiones', { size: 17, off: !ts.sessions.length, color: '#4a3a66', hot: '#6a5a86', border: '#8a7aa6' });
    var i, y = 340;   // lista (4 filas de 22)
    if (st.privView) {
      var ev = T.recent(4); G.txt(c, ev.length ? 'Últimos eventos en cola (solo en este dispositivo):' : 'No hay eventos en cola.', 110, y, 12, '#9a8fb0', 'left');
      for (i = 0; i < ev.length; i++) G.txt(c, (ev[i].e + '  ' + JSON.stringify(ev[i].p)).slice(0, 72), 110, y + 22 + i * 22, 12, '#d4c8e8', 'left');
    } else {
      G.txt(c, ts.sessions.length ? 'Ids de tus últimas sesiones (solo guardados aquí):' : 'Sin ids de sesión guardados.', 110, y, 12, '#9a8fb0', 'left');
      for (i = 0; i < ts.sessions.length && i < 6; i++) G.txt(c, ts.sessions[i], 110 + (i % 2) * 380, y + 22 + Math.floor(i / 2) * 22, 12, '#d4c8e8', 'left');
    }
    if (st.privMsg) G.txt(c, st.privMsg, 480, 448, 13, '#9dffb4', 'center');
    U.button(c, PV.back, 'ATRÁS', { size: 20 });
  }
  var SET = [['master', 'Volumen general'], ['music', 'Música'], ['sfx', 'Efectos']];
  // T-F1-08 fase 3: dos páginas (pestañas arriba) para que todo quepa con letra 17 y botones de 66 de alto
  function setRect(i, plus) { return { x: plus ? 700 : 520, y: 80 + i * 72, w: 80, h: 66 }; }
  var STAB = [{ x: 210, y: 0, w: 260, h: 66 }, { x: 478, y: 0, w: 260, h: 66 }];
  var SB = {   // página 0: sonido e imagen; página 1: partida y datos (rejilla de 2 columnas de 320x66)
    mute: { p: 0, x: 150, y: 298, w: 320, h: 66 }, qual: { p: 0, x: 490, y: 298, w: 320, h: 66 },
    fs: { p: 0, x: 150, y: 370, w: 320, h: 66 }, iso: { p: 0, x: 490, y: 370, w: 320, h: 66 },
    shake: { p: 0, x: 150, y: 442, w: 320, h: 66 }, cine: { p: 0, x: 490, y: 442, w: 320, h: 66 },
    soft: { p: 1, x: 150, y: 80, w: 320, h: 66 }, lightstorm: { p: 1, x: 490, y: 80, w: 320, h: 66 },   // P3 accesibilidad (Tundra): "Hielo suave" y "Ventisca ligera"
    inst: { p: 1, x: 150, y: 152, w: 320, h: 66 }, bak: { p: 1, x: 490, y: 152, w: 320, h: 66 },
    exp: { p: 1, x: 150, y: 224, w: 320, h: 66 }, imp: { p: 1, x: 490, y: 224, w: 320, h: 66 },
    priv: { p: 1, x: 150, y: 296, w: 320, h: 66 }, err: { p: 1, x: 490, y: 296, w: 320, h: 66 },
    vibe: { p: 1, x: 150, y: 368, w: 320, h: 66 },
    man: { x: 826, y: 80, w: 120, h: 66 }, back: { x: 14, y: 442, w: 120, h: 66 }
  };
  P.setRects = function () { return { tabs: STAB, sb: SB, vol: [0, 1, 2].map(function (i) { return [setRect(i, 0), setRect(i, 1)]; }) }; };   // pruebas
  P.setTab = function (n) { st.setTab = n; };
  function sOn(r) { return (r.p == null || r.p === (st.setTab || 0)) && onR(r); }
  function updSettings() {
    var S = SV(), pg = st.setTab || 0;
    if (!S.settings) S.settings = (function () { try { return Assets.getVolume(); } catch (e) { return { master: 0.8, music: 0.6, sfx: 0.8 }; } })();
    for (var t = 0; t < 2; t++) if (onR(STAB[t]) && pg !== t) { st.setTab = t; G.sfx('flip', { vol: 0.4 }); return false; }
    if (inp.hit('KeyQ') || inp.hit('KeyE') || inp.swipe) { st.setTab = pg ? 0 : 1; G.sfx('flip', { vol: 0.4 }); return false; }
    if (pg === 0) for (var i = 0; i < 3; i++) for (var p = 0; p < 2; p++) if (onR(setRect(i, p))) {
      var k = SET[i][0]; S.settings[k] = G.clamp(Math.round((S.settings[k] + (p ? 0.1 : -0.1)) * 10) / 10, 0, 1);
      G.Save.save(); G.Aldea.applySettings(); G.sfx('card_select', { vol: 0.5 });
    }
    if (sOn(SB.shake)) { S.settings.shake = S.settings.shake ? 0 : 1; G.shakeMul = S.settings.shake ? 1 / 3 : 1; G.Save.save(); G.sfx('card_select', { vol: 0.5 }); }
    if (sOn(SB.iso)) { G.Proj.toggle(); G.sfx('card_select', { vol: 0.5 }); }   // vista inclinada tipo Hades (se guarda en settings.view)
    if (sOn(SB.qual)) { G.Sys.cycleQuality(); G.sfx('card_select', { vol: 0.5 }); }
    if (sOn(SB.fs)) G.Sys.toggleFullscreen();
    if (sOn(SB.mute)) G.Sys.toggleMute();
    if (sOn(SB.inst)) G.PWA.install();
    if (sOn(SB.exp)) G.PWA.exportSave();
    if (sOn(SB.imp)) G.PWA.importSave();
    if (sOn(SB.soft)) { S.settings.softIce = S.settings.softIce ? 0 : 1; G.Save.save(); G.sfx('card_select', { vol: 0.5 }); }
    if (sOn(SB.lightstorm)) { S.settings.lightStorm = S.settings.lightStorm ? 0 : 1; G.Save.save(); G.sfx('card_select', { vol: 0.5 }); }
    if (sOn(SB.vibe) && G.fx.vibeSupported()) { S.settings.vibe = G.fx.vibeOn() ? 0 : 1; G.Save.save(); G.sfx('card_select', { vol: 0.5 }); G.fx.vibe('fuse'); }
    if (sOn(SB.cine)) { cur = 'cine'; }
    if (sOn(SB.err)) { cur = 'errlog'; st.errMsg = ''; }
    if (sOn(SB.priv)) { cur = 'privacy'; st.privMsg = ''; st.privView = false; }
    if (sOn(SB.bak)) G.PWA.backups();   // T-F1-11: copias de seguridad y restaurar
    if (sOn(SB.man)) { st.manBack = 'settings'; P.open('manual'); return false; }
    if (sOn(SB.back)) { cur = 'menu'; }
    return false;
  }
  function drawSettings(c) {
    var S = SV(), pg = st.setTab || 0; if (!S.settings) S.settings = (function () { try { return Assets.getVolume(); } catch (e) { return { master: 0.8, music: 0.6, sfx: 0.8 }; } })();
    bg(c, 'AJUSTES');
    ['SONIDO E IMAGEN', 'PARTIDA Y DATOS'].forEach(function (t, i) { U.button(c, STAB[i], t, { size: 18, color: pg === i ? '#6a4a2a' : '#2c2438', hot: '#4a3a66', border: pg === i ? '#ffd27a' : '#6a5a86' }); });
    var on = '#2a6aa8', off = '#2c2438', Sy = G.Sys;
    if (pg === 0) {
      SET.forEach(function (it, i) {
        var r = setRect(i, 0);
        G.txt(c, it[1], 150, r.y + 33, 20, '#ffd27a', 'left');
        U.button(c, r, '-', { size: 28 });
        G.txt(c, Math.round(S.settings[it[0]] * 100) + '%', 650, r.y + 33, 20, '#fff', 'center');
        U.button(c, setRect(i, 1), '+', { size: 28 });
      });
      U.button(c, SB.mute, Sy.muted ? 'Silencio: SÍ' : 'Silencio: NO', { size: 17, color: Sy.muted ? '#7a3a3a' : off });
      U.button(c, SB.qual, 'Gráficos: ' + Sy.qualityLabel(), { size: 17, color: '#4a3a66', hot: '#6a5a86', border: '#8a7aa6' });
      U.button(c, SB.fs, Sy.isFullscreen() ? 'Salir de pantalla completa' : 'Pantalla completa', { size: 17, off: !Sy.fsSupported(), color: '#4a3a66', hot: '#6a5a86', border: '#8a7aa6', sub: Sy.fsSupported() ? null : 'no disponible aquí' });
      U.button(c, SB.iso, 'Vista inclinada: ' + (G.Proj.iso ? 'SÍ' : 'NO'), { size: 17, color: G.Proj.iso ? on : off });
      U.button(c, SB.shake, 'Reducir sacudidas: ' + (S.settings.shake ? 'SÍ' : 'NO'), { size: 17, color: S.settings.shake ? on : off });
      U.button(c, SB.cine, 'CINEMÁTICAS', { size: 18, color: '#4a3a66', hot: '#6a5a86', border: '#8a7aa6' });
    } else {
      U.button(c, SB.soft, 'Hielo suave: ' + (S.settings.softIce ? 'SÍ' : 'NO'), { size: 17, color: S.settings.softIce ? on : off, sub: 'Tundra: derrape más corto' });
      U.button(c, SB.lightstorm, 'Ventisca ligera: ' + (S.settings.lightStorm ? 'SÍ' : 'NO'), { size: 17, color: S.settings.lightStorm ? on : off, sub: 'Tundra: +80 px de visión' });
      U.button(c, SB.inst, Sy.standalone() ? 'App instalada' : 'Instalar app', { size: 17, off: Sy.standalone(), color: '#2a8a4a', hot: '#3aba66', border: '#9dffb4' });
      var Sv = G.Save; U.button(c, SB.bak, 'Copias de seguridad', { size: 17, color: Sv.recovered ? '#7a4a2a' : '#4a3a66', hot: '#6a5a86', border: Sv.recovered ? '#ffd27a' : '#8a7aa6', sub: Sv.recovered ? 'se recuperó una copia' : null });
      U.button(c, SB.exp, 'Exportar guardado', { size: 17, color: '#4a3a66', hot: '#6a5a86', border: '#8a7aa6' });
      U.button(c, SB.imp, 'Importar guardado', { size: 17, color: '#4a3a66', hot: '#6a5a86', border: '#8a7aa6' });
      U.button(c, SB.priv, 'Privacidad', { size: 17, color: '#4a3a66', hot: '#6a5a86', border: '#8a7aa6', sub: G.Track && G.Track.state().consent === true ? 'permiso: SÍ' : 'permiso: NO' });
      U.button(c, SB.err, 'Informe de errores', { size: 17, color: '#4a3a66', hot: '#6a5a86', border: '#8a7aa6', sub: window.Diag && Diag.count() ? Diag.count() + ' guardados' : 'sin errores' });
      if (G.fx.vibeSupported()) U.button(c, SB.vibe, 'Vibración: ' + (G.fx.vibeOn() ? 'SÍ' : 'NO'), { size: 17, color: G.fx.vibeOn() ? on : off, sub: 'Golpe, fusión y jefe' });
      if (!G.Sys.isTouch()) G.txt(c, 'Q / E: cambiar de página', 480, 456, 12, '#9a8fb0', 'center');
    }
    U.button(c, SB.man, 'MANUAL', { size: 18, color: '#6a4a2a', hot: '#9a6a3a', border: '#ffd27a' });
    U.button(c, SB.back, 'ATRÁS', { size: 18 });
    G.txt(c, Math.round(Sy.fps) + ' fps  -  render x' + (G.rs || 1).toFixed(2) + (G.Save.ok ? '' : '  -  ¡el navegador NO guarda! exporta tu progreso'), 480, 527, 12, G.Save.ok ? '#b4a8c8' : '#ff8a8a', 'center');
  }
})();
