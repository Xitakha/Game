/* smith.js - Panel del taller de Carapa (la Armera): EQUIPO / FABRICAR / SETS / PEDIDOS. Columna de 960x540 centrada (G.column).
   T-F1-08: letra 17 (G.MIN_UI) y botones de 66. Pestañas en la fila del título; EQUIPO y FABRICAR en dos vistas (como la Forja): LISTA (slots, piezas del slot
   y bonos de set) y DETALLE de la pieza tocada (comparación, coste y botones). SETS: 2 sets por vista con desplazamiento; PEDIDOS: 5 por página.
   Interfaz como tree.js / panels.js: G.Smith.open(), update(dt) -> true si hay que cerrar, draw(c). Teclas: Q/E o deslizar = pestaña, 1-4 = slot, flechas = pieza,
   Enter = equipar / fabricar, R = reforzar, Esc = volver a la lista (desde el detalle) o salir. */
(function () {
  'use strict';
  var G = window.G, S = G.Smith = {}, U = G.UI, inp = G.input, D = G.ArmorData, A = G.Armor;
  var TABS = ['EQUIPO', 'FABRICAR', 'SETS', 'PEDIDOS'], SLOT_LET = ['Y', 'P', 'G', 'T'];
  var ui = { tab: 0, slot: 1, sel: 0, msg: '', msgT: 0, scroll: 0, ro: false, tn: 1, det: false, pp: 0 };
  var VIS = 4, SETV = 2, PPER = 5;
  var R_CLOSE = { x: 890, y: 0, w: 66, h: 66 };
  function tabR(i) { return { x: 270 + i * 152, y: 0, w: 148, h: 66 }; }
  function tileR(i) { return { x: 14 + i * 152, y: 104, w: 146, h: 102 }; }
  function rowR(k) { return { x: 14, y: 238 + (k - ui.scroll) * 72, w: 520, h: 66 }; }
  var R_UP = { x: 542, y: 238, w: 66, h: 66 }, R_DN = { x: 542, y: 310, w: 66, h: 66 }, R_AUTO = { x: 624, y: 468, w: 322, h: 66 };
  var R_BACK = { x: 14, y: 468, w: 220, h: 66 }, R_B1 = { x: 490, y: 468, w: 220, h: 66 }, R_B2 = { x: 726, y: 468, w: 220, h: 66 };
  var R_SUP = { x: 808, y: 104, w: 66, h: 66 }, R_SDN = { x: 880, y: 104, w: 66, h: 66 };
  function setR(k) { return { x: 14, y: 254 + (k - ui.scroll) * 142, w: 932, h: 138 }; }
  function tryR(k) { var r = setR(k); return { x: r.x + r.w - 136, y: r.y + 36, w: 126, h: 66 }; }
  function tnR(i) { return { x: 130 + i * 74, y: 104, w: 66, h: 66 }; }
  function pedR(k) { return { x: 14, y: 104 + (k - ui.pp * PPER) * 72, w: 932, h: 66 }; }
  function pedBtn(k) { var r = pedR(k); return { x: r.x + r.w - 166, y: r.y, w: 166, h: 66 }; }
  var R_PP = { x: 14, y: 468, w: 150, h: 66 }, R_PN = { x: 250, y: 468, w: 150, h: 66 };
  function pedPages() { return Math.max(1, Math.ceil(A.PED.length / PPER)); }
  function pedVis(k) { return Math.floor(k / PPER) === ui.pp; }
  function say(t) { ui.msg = t; ui.msgT = 3200; }
  function fx1(v) { return (Math.round(v * 10) / 10).toString().replace('.', ','); }
  function pct(v) { return fx1(v * 100) + ' %'; }
  function onR(r) { return inp.hit('Mouse0') && U.inR(r, inp.mouse); }
  function SV() { return G.Save.data; }
  function tw(c, t, size) { c.font = 'bold ' + G.fs(size) + 'px "Courier New", monospace'; return c.measureText(t).width; }
  function fitTxt(c, t, w, size) { if (tw(c, t, size) <= w) return t; while (t.length > 4 && tw(c, t + '.', size) > w) t = t.slice(0, -1); return t.replace(/[\s.,;:]+$/, '') + '.'; }
  function rfix(t) { return G.Res ? G.Res.fix(t) : t; }   // T-F1-07: "1 Esencia" = "1 parte rara" mientras la Esencia no se ve

  S.open = function (ro) {
    ui.tab = 0; ui.slot = 1; ui.sel = 0; ui.msg = ''; ui.msgT = 0; ui.scroll = 0; ui.ro = !!ro; ui.det = false; ui.pp = 0; A.trialView = true; A.dirty();
    if (!ro) A.snd('open'); listFix();
  };
  S.close = function () { A.trialView = false; ui.ro = false; ui.det = false; A.dirty(); };
  S.ui = ui;   // pruebas
  S.setTab = function (t) { ui.tab = t; ui.sel = 0; ui.det = false; ui.scroll = 0; ui.pp = 0; listFix(); };
  S.rects = function () { return { tab: tabR, tile: tileR, row: rowR, up: R_UP, dn: R_DN, auto: R_AUTO, back: R_BACK, b1: R_B1, b2: R_B2, sup: R_SUP, sdn: R_SDN, set: setR, tryR: tryR, tn: tnR, ped: pedBtn, pprev: R_PP, pnext: R_PN, close: R_CLOSE }; };   // pruebas

  // Lista de la pestaña actual para el slot elegido
  function list() {
    var l = D.ofSlot(ui.slot);
    if (ui.tab === 0) l = l.filter(function (p) { return A.owned(p.id); });
    return l.sort(function (a, b) { return D.SETS[a.set].tier - D.SETS[b.set].tier; });
  }
  function listFix() { var n = list().length; ui.sel = G.clamp(ui.sel, 0, Math.max(0, n - 1)); if (ui.sel < ui.scroll) ui.scroll = ui.sel; if (ui.sel >= ui.scroll + VIS) ui.scroll = ui.sel - VIS + 1; ui.scroll = G.clamp(ui.scroll, 0, Math.max(0, n - VIS)); }
  function scrollBy(d, n) { ui.scroll = G.clamp(ui.scroll + d, 0, Math.max(0, n - VIS)); }
  function cur() { return list()[ui.sel] || null; }
  function refOf(id) { return A.ref(id); }
  function artSet(p) { return p.set === 'esquila' ? 'pastor' : p.set === 'carcelero' ? 'karceron' : A.ART[p.set] || p.set; }
  function icon(c, p, x, y, s, ref) {
    var set = D.SETS[p.set], ok = false;
    try { if (window.Assets && Assets.armorIcon) { var cv = (p.set === 'mini' ? Assets.armorIcon('mini', p.mins[0], Math.max(0, ref || 0)) : Assets.armorIcon(artSet(p), ['yelmo', 'peto', 'grebas', 'talisman'][p.slot], Math.max(0, ref || 0))); if (cv && cv.width) { c.drawImage(cv, x, y, s, s); ok = true; } } } catch (e) { ok = false; }
    if (ok) return;
    c.fillStyle = '#1b1124'; c.fillRect(x, y, s, s); c.fillStyle = set.color; c.fillRect(x + 3, y + 3, s - 6, s - 6);
    c.fillStyle = 'rgba(255,255,255,0.22)'; c.fillRect(x + 3, y + 3, s - 6, (s - 6) / 3);
    G.txt(c, SLOT_LET[p.slot], x + s / 2, y + s / 2 + 1, Math.round(s * 0.5), '#1b1124', 'center', 'rgba(0,0,0,0)');
  }
  S.icon = icon;   // v10: la ficha del kit del reto (reto_ui.js) usa los mismos iconos del taller
  function pStats(p, n) {   // texto de la estadística propia de la pieza
    var s = D.SETS[p.set], t = D.tierOf(p), mul = 1 + D.REF * Math.max(0, n);
    if (p.slot === 0) return '+' + Math.round(D.HP[t] * mul * A.HPMUL) + ' HP máx.';
    if (p.slot === 1) return '-' + pct(D.PETO[t] * mul) + ' daño ' + D.FAM_NAME[s.fam];
    if (p.slot === 2) return 'Aplomo ' + pct(D.APL[t] * mul) + (D.IMS[t] ? ', +' + Math.round(D.IMS[t] * mul) + ' ms inv.' : '');
    if (p.util) return p.ut;
    if (p.hp) return '+' + Math.round(p.hp * mul) + ' HP máx.';
    return '+' + pct(D.TAL[t] * mul) + ' daño de ' + D.TAG_NAME[s.tag];
  }
  function pDef(p, n) { return D.DEF[D.tierOf(p)] * (p.util ? 0.4 : D.SLOT_DEF[p.slot]) * (1 + D.REF * Math.max(0, n)); }

  // ---- acciones
  function guard() { if (ui.ro) { say('Solo lectura en la pausa.'); return true; } if (A.trial) { say('Quita el equipo de prueba para cambiar tu equipo.'); A.snd('deny'); return true; } return false; }
  function primary(p) {
    if (!p || guard()) return;
    if (ui.tab === 1) { if (A.owned(p.id)) { say('Ya la tienes fabricada.'); return; } var rq = A.craftReq(p); if (rq) { say(rq); A.snd('deny'); return; } if (A.craft(p.id)) say('Fabricada: ' + p.name + '.'); else say('Te falta algo para fabricarla.'); }
    else if (ui.tab === 0) { if (A.eq()[p.slot] === p.id) { A.unequip(p.slot); say('Quitas ' + p.name + '.'); } else if (A.equip(p.id)) say('Equipada: ' + p.name + '.'); }
  }
  function reinforce(p) {
    if (!p || guard() || !A.owned(p.id)) return; var n = A.baseRef(p.id) + 1, rq = n > A.maxRef(p) ? 'Refuerzo máximo.' : A.refReq(p, n);
    if (rq) { say(rq); A.snd('deny'); return; }
    if (A.upgrade(p.id)) say(p.name + ' +' + n + '.'); else say('Te falta algo para reforzarla.');
  }

  function tabTo(t) { ui.tab = t; ui.sel = 0; ui.det = false; ui.scroll = 0; listFix(); }
  S.update = function (dt) {
    if (ui.msgT > 0) ui.msgT -= dt;
    var esc = inp.hit('Escape'), xc = onR(R_CLOSE);
    if (ui.det && ui.tab <= 1 && (esc || xc || onR(R_BACK))) { ui.det = false; listFix(); G.sfx('flip', { vol: 0.3 }); return false; }   // como la Forja: del detalle se vuelve a la lista
    if (esc || xc) { if (!ui.ro) A.snd('close'); else (A.snd2('close') || A.snd('close')); S.close(); return true; }
    var i, p;
    for (i = 0; i < 4; i++) if (onR(tabR(i))) { tabTo(i); G.sfx('flip', { vol: 0.4 }); }
    if (inp.hit('KeyQ') || inp.swipe < 0) tabTo((ui.tab + 3) % 4);
    if (inp.hit('KeyE') && ui.tab >= 2 || inp.swipe > 0) tabTo((ui.tab + 1) % 4);
    if (ui.tab === 3) {
      var np = pedPages();
      if (onR(R_PP) && ui.pp > 0) { ui.pp--; G.sfx('flip', { vol: 0.4 }); }
      if (onR(R_PN) && ui.pp < np - 1) { ui.pp++; G.sfx('flip', { vol: 0.4 }); }
      ui.pp = G.clamp(ui.pp, 0, np - 1);
      A.PED.forEach(function (d, k) { if (!pedVis(k)) return; if (onR(pedBtn(k))) { if (ui.ro) say('Solo lectura en la pausa.'); else if (A.pedClaim(d.id)) { say('Pedido cobrado: ' + d.name + '.'); } else A.snd('deny'); } });
      return false;
    }
    if (ui.tab === 2) {
      var nS = D.SET_ORDER.length;
      for (i = 0; i < 4; i++) if (onR(tnR(i))) { ui.tn = i; G.sfx('flip', { vol: 0.4 }); }
      ui.scroll = G.clamp(ui.scroll + (Math.round(-inp.dragY / 36) || 0), 0, Math.max(0, nS - SETV));
      if (inp.hit('ArrowDown', 'KeyS')) ui.scroll = G.clamp(ui.scroll + 1, 0, nS - SETV);
      if (inp.hit('ArrowUp', 'KeyW')) ui.scroll = G.clamp(ui.scroll - 1, 0, nS - SETV);
      if (onR(R_SUP)) ui.scroll = Math.max(0, ui.scroll - 1); if (onR(R_SDN)) ui.scroll = G.clamp(ui.scroll + 1, 0, nS - SETV);
      ui.scroll = G.clamp(ui.scroll, 0, Math.max(0, nS - SETV));
      D.SET_ORDER.forEach(function (sid, k) {
        if (sid === 'mini' || k < ui.scroll || k >= ui.scroll + SETV) return; var b = tryR(k);
        if (onR(b)) {
          if (A.trial && A.trial.sid === sid && A.trial.n === ui.tn) { A.setTrial(null); say('Equipo de prueba retirado.'); }
          else { A.setTrial(sid, ui.tn); say('Probando ' + D.SETS[sid].name + ' +' + ui.tn + ': vale para la Práctica (no gasta nada).'); if (!A.snd2('try')) A.snd('equip', 'metal'); }
        }
      });
      return false;
    }
    var l = list();
    if (!ui.det) for (i = 0; i < 4; i++) if (onR(tileR(i)) || inp.hit('Digit' + (i + 1))) { ui.slot = i; ui.sel = 0; listFix(); G.sfx('flip', { vol: 0.4 }); }
    l = list();
    if (inp.hit('KeyE') && ui.tab < 2) { /* E = equipar / fabricar */ primary(cur()); }
    if (!ui.det) {
      scrollBy(Math.round(-inp.dragY / 36) || 0, l.length);
      if (onR(R_UP)) scrollBy(-1, l.length); if (onR(R_DN)) scrollBy(1, l.length);
      for (i = ui.scroll; i < Math.min(l.length, ui.scroll + VIS); i++) if (onR(rowR(i))) { ui.sel = i; ui.det = true; G.sfx('flip', { vol: 0.4 }); return false; }   // tocar una pieza abre su detalle
      if (onR(R_AUTO)) { if (A.trial) { A.setTrial(null); say('Equipo de prueba retirado.'); } else if (!ui.ro) { A.autoEquip(); say('Equipo automático: mayor DEF por slot.'); } }
    }
    if (inp.hit('ArrowDown', 'KeyS')) { ui.sel = Math.min(l.length - 1, ui.sel + 1); listFix(); }
    if (inp.hit('ArrowUp', 'KeyW')) { ui.sel = Math.max(0, ui.sel - 1); listFix(); }
    if (inp.hit('Enter')) primary(cur());
    p = cur();
    if (ui.det && onR(R_B1)) primary(p);
    if ((ui.det && onR(R_B2) && ui.tab === 0) || inp.hit('KeyR')) reinforce(p);
    return false;
  };

  // ---- dibujo
  function costLines(c, cost, x, y) {   // fila de partes y Brasas (lo que tienes / lo que pide) y debajo los trofeos (de jefe y de guardián; F2: antes insignias)
    var Sv = SV(), k, cx = x, t;
    for (k in cost.parts) {
      var have = Sv.parts[k] || 0, ok = have >= cost.parts[k]; t = have + '/' + cost.parts[k]; U.part(c, k, cx + 8, y, 8); G.txt(c, t, cx + 20, y + 1, 17, ok ? '#9dffb4' : '#ff8a8a', 'left'); cx += 20 + tw(c, t, 17) + 18;
    }
    var okb = Sv.brasas >= cost.brasas; U.part(c, 'brasa', cx + 8, y, 8); G.txt(c, Sv.brasas + '/' + cost.brasas, cx + 20, y + 1, 17, okb ? '#9dffb4' : '#ff8a8a', 'left');
    cost.items.forEach(function (it, j) {
      var have = A.haveAny(it.kind, it.ids), ok = have >= it.n, nm = it.kind === 'tro' ? 'Trofeo: ' + (it.ids.length === 1 ? A.itemName(it.kind, it.ids[0]) : 'trofeo del jefe') : 'Trofeo de guardián' + (it.ids.length === 1 ? ': ' + A.itemName(it.kind, it.ids[0]) : ' del bioma');
      U.wrap(c, nm + ' ' + have + '/' + it.n, 456, 17).slice(0, 2).forEach(function (l, q) { G.txt(c, l, x, y + 28 + j * 44 + q * 22, 17, ok ? '#9dffb4' : '#ff8a8a', 'left'); });
    });
  }
  function drawDetail(c, p) {   // vista DETALLE (EQUIPO / FABRICAR): pieza a la izquierda, coste o refuerzo a la derecha, botones abajo
    U.button(c, R_BACK, 'VOLVER', { size: 18, color: '#3a2f48', hot: '#5a4a76', border: '#8a7aa6', sub: G.hint('Esc', null) });
    if (!p) { G.txt(c, ui.tab === 0 ? 'Sin piezas en este slot.' : '', 14, 120, 17, '#9a8fb0', 'left'); return; }
    var s = D.SETS[p.set], own = A.owned(p.id), n = Math.max(0, A.baseRef(p.id)), x = 14, m = A.get(), eqId = A.eq()[p.slot];
    U.panel(c, 8, 98, 470, 360, { border: s.color }); U.panel(c, 484, 98, 468, 360, { border: '#4a3a66' });
    icon(c, p, x + 6, 108, 60, n); G.txt(c, fitTxt(c, p.name + (own && n ? '  +' + n : ''), 380, 20), x + 76, 124, 20, '#fff', 'left');
    G.txt(c, fitTxt(c, (p.set === 'mini' ? 'Minijefe ' + p.bio : s.name) + '  (T' + D.tierOf(p) + ')  ' + D.SLOTS[p.slot], 380, 17), x + 76, 152, 17, s.color, 'left');
    var base = own ? n : 0, def = pDef(p, base);
    G.txt(c, 'DEF ' + fx1(def) + (eqId && eqId !== p.id ? '   (equipada ' + fx1(pDef(D.BY[eqId], A.ref(eqId))) + ')' : ''), x + 6, 196, 17, '#ffe9a0', 'left');
    G.txt(c, pStats(p, base), x + 6, 218, 17, '#d8cfe8', 'left');
    // comparación frente a lo equipado (si se equipara esta pieza)
    var eq = A.eq().slice(); eq[p.slot] = p.id; var m2 = A.calc(eq, function (id) { return id === p.id ? (own ? A.ref(id) : 0) : A.ref(id); }), dd = m2.def - m.def, dh = m2.hp - m.hp, da = m2.apl - m.apl;
    function dl(v, f, u) { return (v >= 0 ? '+' : '') + f(v) + u; }
    if (eqId !== p.id) {
      G.txt(c, 'Al equiparla:', x + 6, 252, 17, '#b4a8c8', 'left');
      G.txt(c, 'DEF ' + dl(dd, fx1, ''), x + 6, 274, 17, dd > 0.04 ? '#9dffb4' : dd < -0.04 ? '#ff8a8a' : '#9a8fb0', 'left');
      G.txt(c, 'HP ' + dl(dh, function (v) { return Math.round(v); }, ''), x + 136, 274, 17, dh > 0 ? '#9dffb4' : dh < 0 ? '#ff8a8a' : '#9a8fb0', 'left');
      G.txt(c, 'Aplomo ' + dl(da * 100, fx1, ' %'), x + 246, 274, 17, da > 0.001 ? '#9dffb4' : da < -0.001 ? '#ff8a8a' : '#9a8fb0', 'left');
      var sc = m2.sets[p.set] || 0; if (!s.noSet && (s.b4 || s.b2)) G.txt(c, 'Set ' + s.name.split(' ')[0] + ': ' + sc + '/4' + (sc === 2 ? '  (bono 2 activo)' : sc === 4 ? '  (bono 4 activo)' : ''), x + 6, 296, 17, sc >= 2 ? s.color : '#9a8fb0', 'left');
    } else G.txt(c, 'Equipada.', x + 6, 252, 17, '#9dffb4', 'left');
    // frase de daño recibido
    var mm = A.mult(m2, s.fam, G.Tree.fx.bastion, 0) * A.zone();
    U.wrap(c, 'Recibes x' + (Math.round(mm * 100) / 100).toString().replace('.', ',') + ' del daño en ' + ((G.curBiome || 'bosque').toUpperCase()) + ' (melee)', 450, 17).slice(0, 2).forEach(function (l, q) { G.txt(c, l, x + 6, 412 + q * 22, 17, '#c8b8e8', 'left'); });
    // coste: fabricar (pestaña 1, no fabricada) o siguiente refuerzo (pestaña 0)
    var X = 498;
    if (ui.tab === 1 && !own) {
      var rq = A.craftReq(p); G.txt(c, 'COSTE', X, 120, 17, '#b4a8c8', 'left'); if (rq) U.wrap(c, rq, 440, 17).slice(0, 4).forEach(function (l, k) { G.txt(c, l, X, 148 + k * 22, 17, '#ff9a8a', 'left'); }); else costLines(c, A.cost(p, 0), X, 150);
    } else if (own && ui.tab === 0) {
      var nx = n + 1, rr = nx > A.maxRef(p) ? 'Refuerzo máximo (+' + A.maxRef(p) + ').' : A.refReq(p, nx);
      G.txt(c, nx > A.maxRef(p) ? 'REFUERZO' : 'REFUERZO +' + nx + '  (x' + fx1(1 + D.REF * nx) + ')', X, 120, 17, '#b4a8c8', 'left');
      if (rr) U.wrap(c, rr, 440, 17).slice(0, 4).forEach(function (l, k) { G.txt(c, l, X, 148 + k * 22, 17, '#ff9a8a', 'left'); }); else costLines(c, A.cost(p, nx), X, 150);
    } else if (own) G.txt(c, 'Ya fabricada' + (n ? ' (+' + n + ')' : '') + '.', X, 120, 17, '#9dffb4', 'left');
    if (ui.tab === 1) U.button(c, R_B1, own ? 'YA FABRICADA' : 'FABRICAR', { size: 18, off: own || !!A.craftReq(p) || !A.costOK(A.cost(p, 0)), color: '#2a8a4a', hot: '#3aba66', border: '#9dffb4', sub: G.hint('[Enter]', null) });
    else {
      var isE = A.eq()[p.slot] === p.id;
      U.button(c, R_B1, isE ? 'QUITAR' : 'EQUIPAR', { size: 18, color: '#2a6a74', hot: '#3a9aaa', border: '#a8e8f0', sub: G.hint('[E]', null) });
      var nx2 = A.baseRef(p.id) + 1, ok2 = nx2 <= A.maxRef(p) && !A.refReq(p, nx2) && A.costOK(A.cost(p, nx2));
      U.button(c, R_B2, nx2 <= A.maxRef(p) ? 'REFORZAR +' + nx2 : 'REFORZADA', { size: 18, off: !ok2, color: '#8a6a1a', hot: '#c89a2a', border: '#ffe08a', sub: G.hint('[R]', null) });
    }
  }
  function drawEquipTab(c) {   // vista LISTA (EQUIPO / FABRICAR): 4 slots arriba, piezas del slot abajo a la izquierda, bonos de set a la derecha
    var m = A.get(), i, l;
    for (i = 0; i < 4; i++) {
      var r = tileR(i), id = A.eq()[i], pc = id && D.BY[id], on = ui.slot === i, hov = U.inR(r, inp.mouse), col = pc ? D.SETS[pc.set].color : '#4a3a66';
      c.fillStyle = on ? '#3a2a5a' : hov ? '#2a2038' : '#1a1226'; c.fillRect(r.x, r.y, r.w, r.h);
      c.strokeStyle = on ? '#ffe9a0' : col; c.lineWidth = on ? 4 : 2; c.strokeRect(r.x + 1, r.y + 1, r.w - 2, r.h - 2);
      G.txt(c, D.SLOTS[i], r.x + r.w / 2, r.y + 13, 17, on ? '#ffe9a0' : '#b4a8c8', 'center');
      if (pc) { icon(c, pc, r.x + r.w / 2 - 17, r.y + 24, 34, A.ref(id)); G.txt(c, fitTxt(c, pc.name, r.w - 8, 17), r.x + r.w / 2, r.y + 70, 17, '#d8cfe8', 'center'); G.txt(c, 'DEF ' + fx1(pDef(pc, A.ref(id))) + (A.ref(id) ? '  +' + A.ref(id) : ''), r.x + r.w / 2, r.y + 92, 17, '#ffe9a0', 'center'); }
      else G.txt(c, '(vacío)', r.x + r.w / 2, r.y + 56, 17, '#a89cc0', 'center');
      if (!G.Sys.isTouch()) G.txt(c, String(i + 1), r.x + 10, r.y + 13, 17, '#8a7f96', 'center');
    }
    // bonos de set activos (columna derecha)
    G.txt(c, 'SETS', 624, 116, 17, '#b4a8c8', 'left'); var yy = 140, any = false;
    D.SET_ORDER.forEach(function (sid) {
      var cnt = m.sets[sid] || 0; if (!cnt) return; any = true; var s = D.SETS[sid];
      if (yy > 396) return;
      G.txt(c, fitTxt(c, s.name + '  ' + cnt + '/4', 322, 17), 624, yy, 17, cnt >= 2 ? s.color : '#b4a8c8', 'left'); yy += 22;
      if (cnt >= 2) U.wrap(c, 'Bono 2: ' + s.t2, 322, 17).forEach(function (ln) { if (yy <= 396) { G.txt(c, ln, 624, yy, 17, '#c8b8e8', 'left'); yy += 22; } });
      if (cnt >= 4 && s.b4) U.wrap(c, 'Bono 4: ' + s.t4, 322, 17).forEach(function (ln) { if (yy <= 396) { G.txt(c, ln, 624, yy, 17, '#ffe9a0', 'left'); yy += 22; } });
    });
    if (!any) U.wrap(c, 'Equipa 2 piezas del mismo set para un bono.', 322, 17).forEach(function (ln, k) { G.txt(c, ln, 624, 140 + k * 22, 17, '#b4a8c8', 'left'); });
    if (A.trial) U.wrap(c, 'PRUEBA: ' + D.SETS[A.trial.sid].name + ' +' + A.trial.n + ' (solo Práctica)', 322, 17).slice(0, 2).forEach(function (ln, k) { G.txt(c, ln, 624, 422 + k * 22, 17, '#ffb08a', 'left'); });
    U.button(c, R_AUTO, A.trial ? 'QUITAR PRUEBA' : 'AUTO-EQUIPAR', { size: 18, color: A.trial ? '#8a4a2a' : '#2a6a74', hot: '#3a9aaa', border: '#a8e8f0', off: ui.ro && !A.trial });
    // lista
    l = list(); G.txt(c, (ui.tab === 0 ? 'FABRICADAS' : 'RECETAS') + ' - ' + D.SLOTS[ui.slot].toUpperCase(), 14, 224, 17, '#b4a8c8', 'left');
    if (!l.length) U.wrap(c, 'Aún no tienes piezas de este slot. Fabrícalas en la pestaña FABRICAR.', 500, 17).forEach(function (ln, k) { G.txt(c, ln, 20, 258 + k * 22, 17, '#9a8fb0', 'left'); });
    if (l.length > VIS) { U.button(c, R_UP, '^', { size: 20, color: '#3a2f48', hot: '#6a5a86', border: '#8a7aa6', off: ui.scroll <= 0 }); U.button(c, R_DN, 'v', { size: 20, color: '#3a2f48', hot: '#6a5a86', border: '#8a7aa6', off: ui.scroll >= l.length - VIS }); G.txt(c, (ui.scroll + 1) + '-' + Math.min(l.length, ui.scroll + VIS) + '/' + l.length, 575, 400, 17, '#b4a8c8', 'center'); }
    l.forEach(function (pp, k) {
      if (k < ui.scroll || k >= ui.scroll + VIS) return;
      var r = rowR(k), s = D.SETS[pp.set], own = A.owned(pp.id), n = Math.max(0, A.baseRef(pp.id)), isEq = A.eq()[pp.slot] === pp.id, sel = ui.sel === k, hov = U.inR(r, inp.mouse);
      var lock = !own && ui.tab === 1 && A.craftReq(pp), can = !own && !lock && A.costOK(A.cost(pp, 0));
      c.fillStyle = sel ? '#3a2a5a' : hov ? '#2a2038' : '#1a1226'; c.fillRect(r.x, r.y, r.w, r.h);
      c.strokeStyle = sel ? '#ffe9a0' : isEq ? '#9dffb4' : '#4a3a66'; c.lineWidth = sel ? 4 : 2; c.strokeRect(r.x + 1, r.y + 1, r.w - 2, r.h - 2);
      c.save(); if (lock) c.globalAlpha = 0.45; icon(c, pp, r.x + 8, r.y + 11, 44, n); c.restore();
      var st = own ? (isEq ? 'EQUIPADA' : 'FABRICADA') : lock ? 'BLOQUEADA' : can ? 'LISTA' : 'FALTA', sw = tw(c, st, 17);
      G.txt(c, fitTxt(c, pp.name + (own && n ? '  +' + n : ''), r.w - 76 - sw - 12, 17), r.x + 60, r.y + 13, 17, lock ? '#a89cc0' : '#fff', 'left');
      G.txt(c, fitTxt(c, (pp.set === 'mini' ? 'Minijefe ' + pp.bio : s.name) + '  DEF ' + fx1(pDef(pp, own ? n : 0)), r.w - 68, 17), r.x + 60, r.y + 35, 17, lock ? '#a89cc0' : s.color, 'left');
      G.txt(c, fitTxt(c, pStats(pp, own ? n : 0), r.w - 68, 17), r.x + 60, r.y + 57, 17, '#c8b8e8', 'left');
      G.txt(c, st, r.x + r.w - 8, r.y + 13, 17, own ? (isEq ? '#9dffb4' : '#ffe9a0') : lock ? '#ff8a8a' : can ? '#9dffb4' : '#8a7f96', 'right');
    });
  }
  function drawSets(c) {
    var m = A.get(), nS = D.SET_ORDER.length;
    G.txt(c, 'PROBAR A:', 14, 137, 17, '#9a8fb0', 'left');
    for (var q = 0; q < 4; q++) U.button(c, tnR(q), '+' + q, { size: 17, color: ui.tn === q ? '#8a6a1a' : '#2c2438', hot: '#c89a2a', border: ui.tn === q ? '#ffe08a' : '#6a5a80' });
    U.button(c, R_SUP, '^', { size: 20, color: '#3a2f48', hot: '#6a5a86', border: '#8a7aa6', off: ui.scroll <= 0 }); U.button(c, R_SDN, 'v', { size: 20, color: '#3a2f48', hot: '#6a5a86', border: '#8a7aa6', off: ui.scroll >= nS - SETV });
    // equipo de prueba: estado (arriba, entre +0..+3 y las flechas) y explicación (debajo)
    G.txt(c, fitTxt(c, A.trial ? 'Activo: ' + D.SETS[A.trial.sid].name + ' +' + A.trial.n : 'Ninguno activo', 360, 17), 432, 116, 17, A.trial ? '#ffb08a' : '#b4a8c8', 'left');
    if (A.trial) { var mt = A.get(); G.txt(c, 'DEF ' + fx1(mt.def) + '  RD ' + pct(mt.rd) + '  HP +' + mt.hp, 432, 138, 17, '#ffe9a0', 'left'); G.txt(c, 'Recibes x' + (Math.round(A.mult(mt, D.SETS[A.trial.sid].fam, G.Tree.fx.bastion, 0) * A.zone() * 100) / 100).toString().replace('.', ',') + ' en ' + (G.curBiome || 'bosque').toUpperCase(), 432, 160, 17, '#c8b8e8', 'left'); }
    U.wrap(c, 'Toca PROBAR en un set para vestirlo a +' + ui.tn + ' sin fabricarlo ni gastar nada. Vale para ver la defensa en este panel y para la PRÁCTICA (un jefe con ese equipo). En una expedición normal se retira solo. Tope de reducción total: ' + Math.round(A.CAP * 100) + ' %.', 930, 17).slice(0, 3).forEach(function (l, j) { G.txt(c, l, 14, 190 + j * 22, 17, '#d8cfe8', 'left'); });
    D.SET_ORDER.forEach(function (sid, k) {
      if (k < ui.scroll || k >= ui.scroll + SETV) return;
      var s = D.SETS[sid], r = setR(k), unl = A.unlockedSet(sid), cnt = m.sets[sid] || 0, mini = sid === 'mini', MX = r.x + 236;
      U.panel(c, r.x, r.y, r.w, r.h, { border: unl ? s.color : '#3a3046' });
      G.txt(c, s.name + (mini ? '' : '  (T' + s.tier + ')'), r.x + 12, r.y + 18, 17, unl ? '#fff' : '#7a7086', 'left');
      D.ofSet(sid).forEach(function (p, j) { var own = A.owned(p.id), sz = 34, x = r.x + 12 + j * (sz + 4); c.save(); if (!own) c.globalAlpha = 0.4; icon(c, p, x, r.y + 32, sz, A.baseRef(p.id)); c.restore(); if (own && A.eq()[p.slot] === p.id) { c.fillStyle = '#9dffb4'; c.fillRect(x + 2, r.y + 32 + sz + 1, sz - 4, 3); } });
      if (!mini) U.wrap(c, unl ? 'Equipadas ' + cnt + '/4' : 'Vence a ' + (G.Boss.DEFS[s.boss] ? G.Boss.DEFS[s.boss].name : s.boss), 214, 17).slice(0, 2).forEach(function (l, j) { G.txt(c, l, r.x + 12, r.y + 86 + j * 22, 17, unl ? (cnt >= 2 ? s.color : '#b4a8c8') : '#ff8a8a', 'left'); });
      if (mini) { U.wrap(c, rfix('+10 % imán, +1 HP por corazón, +10 % XP en el Asfódelo, Frío -10 %, miel -15 %. Sin bono de set: 2 trofeos de guardián del bioma + 1 Esencia.'), 680, 17).slice(0, 4).forEach(function (l, j) { G.txt(c, l, MX, r.y + 40 + j * 22, 17, '#c8b8e8', 'left'); }); }
      else {
        var ly = r.y + 40;
        U.wrap(c, 'B2: ' + s.t2, 560, 17).slice(0, 2).forEach(function (l) { G.txt(c, l, MX, ly, 17, cnt >= 2 ? '#c8f0c8' : '#a89cc0', 'left'); ly += 22; });
        U.wrap(c, 'B4: ' + s.t4, 560, 17).slice(0, 5 - (ly - r.y - 40) / 22).forEach(function (l) { G.txt(c, l, MX, ly, 17, cnt >= 4 ? '#ffe9a0' : '#a89cc0', 'left'); ly += 22; });
      }
    });
  }
  function drawSetButtons(c) {
    D.SET_ORDER.forEach(function (sid, k) {
      if (sid === 'mini' || k < ui.scroll || k >= ui.scroll + SETV) return;
      var tb = tryR(k), on = A.trial && A.trial.sid === sid && A.trial.n === ui.tn;
      U.button(c, tb, on ? 'QUITAR' : 'PROBAR +' + ui.tn, { size: 17, color: on ? '#8a4a2a' : '#2a6a74', hot: '#3a9aaa', border: '#a8e8f0' });
    });
  }

  function drawPed(c) {
    A.PED.forEach(function (d, k) {
      if (!pedVis(k)) return;
      var r = pedR(k), done = SV().armor.ped[d.id], rdy = A.pedReady(d), pay = 'Pago: ' + rfix(A.rewardText(d));
      U.panel(c, r.x, r.y, r.w, r.h, { border: rdy ? '#9dffb4' : '#3a2f48' });
      G.txt(c, d.name, r.x + 14, r.y + 20, 17, done ? '#a89cc0' : '#ffd27a', 'left'); G.txt(c, fitTxt(c, d.desc, r.w - 200, 17), r.x + 14, r.y + 46, 17, '#d8cfe8', 'left');
      G.txt(c, pay, r.x + r.w - 182, r.y + 20, 17, '#ffe9a0', 'right');
      U.button(c, pedBtn(k), done ? 'COBRADO' : rdy ? 'COBRAR' : 'EN CURSO', { size: 17, off: !rdy, color: '#2a8a4a', hot: '#3aba66', border: '#9dffb4' });
    });
    var np = pedPages();
    if (np > 1) {
      U.button(c, R_PP, 'ANTERIOR', { size: 17, off: ui.pp <= 0, color: '#3a2f48', hot: '#5a4a76', border: '#8a7aa6' });
      U.button(c, R_PN, 'SIGUIENTE', { size: 17, off: ui.pp >= np - 1, color: '#3a2f48', hot: '#5a4a76', border: '#8a7aa6' });
      G.txt(c, (ui.pp + 1) + '/' + np, 207, 501, 17, '#c8c0d8', 'center');
    }
  }
  function drawMsg(c) {   // aviso encima de todo, con placa (2 líneas de 17 como máximo), como los demás paneles
    if (!(ui.msgT > 0 && ui.msg)) return;
    var ls = U.wrap(c, ui.msg, 840, 17).slice(0, 2), h = ls.length * 22 + 12, y0 = 70;
    c.fillStyle = 'rgba(8,4,14,0.92)'; c.fillRect(50, y0, 860, h); c.strokeStyle = '#6ac8d8'; c.lineWidth = 2; c.strokeRect(51, y0 + 1, 858, h - 2);
    ls.forEach(function (l, i) { G.txt(c, l, 480, y0 + 17 + i * 22, 17, '#ffe9a0', 'center'); });
  }
  S.draw = function (c) {
    var m = A.get();
    G.minFont = G.MIN_UI;   // T-F1-08: letra 17 (también desde la pausa)
    c.fillStyle = '#08040e'; c.fillRect(0, 0, G.W, G.H);
    G.txt(c, ui.ro ? 'EQUIPO (solo lectura)' : 'TALLER DE CARAPA', 14, 26, ui.ro ? 20 : 24, '#6ac8d8', 'left');
    U.part(c, 'brasa', 22, 88, 10); G.txt(c, 'Brasas ' + SV().brasas, 38, 88, 17, '#ff9a3c', 'left');
    G.txt(c, A.OFF ? 'ARMADURA APAGADA (?arm=0)' : 'DEF ' + fx1(m.def) + '  =  ' + pct(m.rd) + ' (tope ' + Math.round(A.CAP * 100) + ' %)   HP +' + m.hp, 220, 88, 17, A.OFF ? '#ff8a8a' : '#ffe9a0', 'left');
    U.button(c, R_CLOSE, 'X', { size: 22, color: '#7a2a3a', hot: '#c03a4a', border: '#ff8a8a' });
    for (var i = 0; i < 4; i++) {
      var tb = tabR(i), on = ui.tab === i, badge = i === 1 ? A.readyCount() : i === 3 ? A.pedReadyCount() : 0;
      U.button(c, tb, TABS[i], { size: 17, color: on ? '#2a5a66' : '#2c2438', hot: '#3a8a9a', border: on ? '#a8e8f0' : '#6a5a80' });
      if (badge) { c.fillStyle = '#7dff9a'; c.beginPath(); c.arc(tb.x + tb.w - 14, tb.y + 14, 11, 0, 6.283); c.fill(); G.txt(c, String(badge), tb.x + tb.w - 14, tb.y + 15, 17, '#102014', 'center', 'rgba(0,0,0,0)'); }
    }
    if (ui.tab <= 1) { if (ui.det) drawDetail(c, cur()); else drawEquipTab(c); } else if (ui.tab === 2) { drawSets(c); drawSetButtons(c); } else drawPed(c);
    if (!G.Sys.isTouch() && ui.tab <= 1 && !ui.det) G.txt(c, 'Q/E pestaña  1-4 slot  Enter acción  R reforzar  Esc salir', 14, 530, 17, '#b4a8c8', 'left');
    drawMsg(c);
  };
})();
