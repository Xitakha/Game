/* smith.js - Panel del taller de Carapa (la Armera): EQUIPO / FABRICAR / SETS / PEDIDOS. Canvas 960x540 (móvil 844x390: escala 0,72, tiles >= 100 px lógicos = 72 px reales, botones de 50 px).
   Interfaz como tree.js / panels.js: G.Smith.open(), update(dt) -> true si hay que cerrar, draw(c). Teclas: Q/E o deslizar = pestaña, 1-4 = slot, flechas = pieza, Enter = equipar / fabricar, R = reforzar. */
(function () {
  'use strict';
  var G = window.G, S = G.Smith = {}, U = G.UI, inp = G.input, D = G.ArmorData, A = G.Armor;
  var TABS = ['EQUIPO', 'FABRICAR', 'SETS', 'PEDIDOS'], SLOT_LET = ['Y', 'P', 'G', 'T'];
  var ui = { tab: 0, slot: 1, sel: 0, msg: '', msgT: 0, scroll: 0, ro: false, tn: 1 };
  var VIS = 6;
  var R_CLOSE = { x: 896, y: 2, w: 60, h: 50 };
  function tabR(i) { return { x: 14 + i * 134, y: 58, w: 128, h: 46 }; }
  function tileR(i) { return { x: 14 + (i % 2) * 112, y: 114 + Math.floor(i / 2) * 108, w: 106, h: 100 }; }
  function rowR(k) { return { x: 250, y: 114 + (k - ui.scroll) * 62, w: 318, h: 58 }; }
  var R_UP = { x: 574, y: 114, w: 36, h: 56 }, R_DN = { x: 574, y: 176, w: 36, h: 56 };
  var R_AUTO = { x: 14, y: 450, w: 224, h: 50 }, R_DET = { x: 622, y: 114, w: 324, h: 300 }, R_B1 = { x: 622, y: 424, w: 324, h: 50 }, R_B2 = { x: 622, y: 482, w: 324, h: 50 };
  var SETV = 5;
  function setR(k) { return { x: 14, y: 114 + (k - ui.scroll) * 76, w: 556, h: 70 }; }
  function tryR(k) { var r = setR(k); return { x: 14 + 556 - 120, y: r.y + 8, w: 112, h: 54 }; }
  function tnR(i) { return { x: 600 + i * 84, y: 62, w: 78, h: 38 }; }
  function pedR(k) { return { x: 14, y: 114 + k * 60, w: 932, h: 54 }; }
  function say(t) { ui.msg = t; ui.msgT = 3200; }
  function fx1(v) { return (Math.round(v * 10) / 10).toString().replace('.', ','); }
  function pct(v) { return fx1(v * 100) + ' %'; }
  function onR(r) { return inp.hit('Mouse0') && U.inR(r, inp.mouse); }
  function SV() { return G.Save.data; }

  S.open = function (ro) {
    ui.tab = 0; ui.slot = 1; ui.sel = 0; ui.msg = ''; ui.msgT = 0; ui.scroll = 0; ui.ro = !!ro; A.trialView = true; A.dirty();
    if (!ro) A.snd('open'); listFix();
  };
  S.close = function () { A.trialView = false; ui.ro = false; A.dirty(); };
  S.ui = ui;   // pruebas

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

  S.update = function (dt) {
    if (ui.msgT > 0) ui.msgT -= dt;
    if (inp.hit('Escape') || onR(R_CLOSE)) { if (!ui.ro) A.snd('close'); else (A.snd2('close') || A.snd('close')); S.close(); return true; }
    var i, p;
    for (i = 0; i < 4; i++) if (onR(tabR(i))) { ui.tab = i; ui.sel = 0; listFix(); G.sfx('flip', { vol: 0.4 }); }
    if (inp.hit('KeyQ') || inp.swipe < 0) { ui.tab = (ui.tab + 3) % 4; ui.sel = 0; listFix(); }
    if (inp.hit('KeyE') && ui.tab >= 2 || inp.swipe > 0) { ui.tab = (ui.tab + 1) % 4; ui.sel = 0; listFix(); }
    if (ui.tab === 3) {
      A.PED.forEach(function (d, k) { var r = pedR(k), b = { x: r.x + r.w - 150, y: r.y + 3, w: 144, h: r.h - 6 }; if (onR(b)) { if (ui.ro) say('Solo lectura en la pausa.'); else if (A.pedClaim(d.id)) { say('Pedido cobrado: ' + d.name + '.'); } else A.snd('deny'); } });
      return false;
    }
    if (ui.tab === 2) {
      var nS = D.SET_ORDER.length;
      for (i = 0; i < 4; i++) if (onR(tnR(i))) { ui.tn = i; G.sfx('flip', { vol: 0.4 }); }
      scrollBy(Math.round(-inp.dragY / 36) || 0, nS - SETV + VIS);
      if (inp.hit('ArrowDown', 'KeyS')) ui.scroll = G.clamp(ui.scroll + 1, 0, nS - SETV);
      if (inp.hit('ArrowUp', 'KeyW')) ui.scroll = G.clamp(ui.scroll - 1, 0, nS - SETV);
      if (onR(R_UP)) ui.scroll = Math.max(0, ui.scroll - 1); if (onR(R_DN)) ui.scroll = G.clamp(ui.scroll + 1, 0, nS - SETV);
      ui.scroll = G.clamp(ui.scroll, 0, Math.max(0, nS - SETV));
      D.SET_ORDER.forEach(function (sid, k) {
        if (sid === 'mini') return; var b = tryR(k); if (b.y < 108 || b.y > 470) return;
        if (onR(b)) {
          if (A.trial && A.trial.sid === sid && A.trial.n === ui.tn) { A.setTrial(null); say('Equipo de prueba retirado.'); }
          else { A.setTrial(sid, ui.tn); say('Probando ' + D.SETS[sid].name + ' +' + ui.tn + ': vale para la Práctica (no gasta nada).'); if (!A.snd2('try')) A.snd('equip', 'metal'); }
        }
      });
      return false;
    }
    for (i = 0; i < 4; i++) if (onR(tileR(i)) || inp.hit('Digit' + (i + 1))) { ui.slot = i; ui.sel = 0; listFix(); G.sfx('flip', { vol: 0.4 }); }
    var l = list();
    if (inp.hit('KeyE') && ui.tab < 2) { /* E = equipar / fabricar */ primary(cur()); }
    scrollBy(Math.round(-inp.dragY / 36) || 0, l.length);
    if (onR(R_UP)) scrollBy(-1, l.length); if (onR(R_DN)) scrollBy(1, l.length);
    for (i = ui.scroll; i < Math.min(l.length, ui.scroll + VIS); i++) if (onR(rowR(i))) { if (ui.sel === i) primary(l[i]); else { ui.sel = i; G.sfx('flip', { vol: 0.4 }); } }
    if (inp.hit('ArrowDown', 'KeyS')) { ui.sel = Math.min(l.length - 1, ui.sel + 1); listFix(); }
    if (inp.hit('ArrowUp', 'KeyW')) { ui.sel = Math.max(0, ui.sel - 1); listFix(); }
    if (inp.hit('Enter')) primary(cur());
    p = cur();
    if (onR(R_B1)) primary(p);
    if ((onR(R_B2) && ui.tab === 0) || inp.hit('KeyR')) reinforce(p);
    if (onR(R_AUTO)) { if (A.trial) { A.setTrial(null); say('Equipo de prueba retirado.'); } else if (!ui.ro) { A.autoEquip(); say('Equipo automático: mayor DEF por slot.'); } }
    return false;
  };

  // ---- dibujo
  function costLines(c, cost, x, y) {
    var Sv = SV(), L = G.Loot, k, cx = x;
    for (k in cost.parts) {
      var have = Sv.parts[k] || 0, ok = have >= cost.parts[k]; U.part(c, k, cx + 8, y, 8); G.txt(c, have + '/' + cost.parts[k], cx + 20, y + 1, 11, ok ? '#9dffb4' : '#ff8a8a', 'left'); cx += 66;
    }
    var okb = Sv.brasas >= cost.brasas; U.part(c, 'brasa', cx + 8, y, 8); G.txt(c, Sv.brasas + '/' + cost.brasas, cx + 20, y + 1, 11, okb ? '#9dffb4' : '#ff8a8a', 'left');
    cost.items.forEach(function (it, j) {
      var have = A.haveAny(it.kind, it.ids), ok = have >= it.n, nm = it.ids.length === 1 ? A.itemName(it.kind, it.ids[0]) : (it.kind === 'tro' ? 'trofeo' : 'insignia') + ' del jefe' + (it.kind === 'ins' ? ' (minijefe)' : '');
      G.txt(c, (it.kind === 'tro' ? 'Trofeo: ' : 'Insignia: ') + nm + ' ' + have + '/' + it.n, x, y + 17 + j * 14, 11, ok ? '#9dffb4' : '#ff8a8a', 'left');
    });
  }
  function drawDetail(c, p) {
    U.panel(c, R_DET.x, R_DET.y, R_DET.w, R_DET.h, { border: p ? D.SETS[p.set].color : '#4a3a66' });
    if (!p) { G.txt(c, ui.tab === 0 ? 'Sin piezas en este slot.' : '', R_DET.x + 14, R_DET.y + 24, 13, '#9a8fb0', 'left'); return; }
    var s = D.SETS[p.set], own = A.owned(p.id), n = Math.max(0, A.baseRef(p.id)), x = R_DET.x + 12, y = R_DET.y + 20, m = A.get(), eqId = A.eq()[p.slot];
    icon(c, p, x, y - 10, 44, n); G.txt(c, p.name + (own && n ? '  +' + n : ''), x + 54, y, 14, '#fff', 'left'); G.txt(c, (p.set === 'mini' ? 'Minijefe ' + p.bio : s.name) + '  (T' + D.tierOf(p) + ')  ' + D.SLOTS[p.slot], x + 54, y + 18, 10, s.color, 'left');
    var base = own ? n : 0, def = pDef(p, base);
    G.txt(c, 'DEF ' + fx1(def) + (eqId && eqId !== p.id ? '   (equipada ' + fx1(pDef(D.BY[eqId], A.ref(eqId))) + ')' : ''), x, y + 52, 13, '#ffe9a0', 'left');
    G.txt(c, pStats(p, base), x, y + 70, 12, '#d8cfe8', 'left');
    // comparación frente a lo equipado (si se equipara esta pieza)
    var eq = A.eq().slice(); eq[p.slot] = p.id; var m2 = A.calc(eq, function (id) { return id === p.id ? (own ? A.ref(id) : 0) : A.ref(id); }), dd = m2.def - m.def, dh = m2.hp - m.hp, da = m2.apl - m.apl;
    function dl(v, f, u) { return (v >= 0 ? '+' : '') + f(v) + u; }
    if (eqId !== p.id) {
      G.txt(c, 'Al equiparla:', x, y + 92, 10, '#9a8fb0', 'left');
      G.txt(c, 'DEF ' + dl(dd, fx1, ''), x, y + 106, 12, dd > 0.04 ? '#9dffb4' : dd < -0.04 ? '#ff8a8a' : '#9a8fb0', 'left');
      G.txt(c, 'HP ' + dl(dh, function (v) { return Math.round(v); }, ''), x + 100, y + 106, 12, dh > 0 ? '#9dffb4' : dh < 0 ? '#ff8a8a' : '#9a8fb0', 'left');
      G.txt(c, 'Aplomo ' + dl(da * 100, fx1, ' %'), x + 190, y + 106, 12, da > 0.001 ? '#9dffb4' : da < -0.001 ? '#ff8a8a' : '#9a8fb0', 'left');
      var sc = m2.sets[p.set] || 0; if (!s.noSet && (s.b4 || s.b2)) G.txt(c, 'Set ' + s.name.split(' ')[0] + ': ' + sc + '/4' + (sc === 2 ? '  (bono 2 activo)' : sc === 4 ? '  (bono 4 activo)' : ''), x, y + 124, 11, sc >= 2 ? s.color : '#9a8fb0', 'left');
    } else G.txt(c, 'Equipada.', x, y + 92, 12, '#9dffb4', 'left');
    // coste: fabricar (pestaña 1, no fabricada) o siguiente refuerzo (pestaña 0)
    if (ui.tab === 1 && !own) {
      var rq = A.craftReq(p); G.txt(c, 'COSTE', x, y + 148, 10, '#9a8fb0', 'left'); if (rq) G.txt(c, rq, x, y + 168, 11, '#ff9a8a', 'left'); else costLines(c, A.cost(p, 0), x, y + 168);
    } else if (own && ui.tab === 0) {
      var nx = n + 1, rr = nx > A.maxRef(p) ? 'Refuerzo máximo (+' + A.maxRef(p) + ').' : A.refReq(p, nx);
      G.txt(c, nx > A.maxRef(p) ? 'REFUERZO' : 'REFUERZO +' + nx + '  (x' + fx1(1 + D.REF * nx) + ')', x, y + 148, 10, '#9a8fb0', 'left');
      if (rr) U.wrap(c, rr, 296, 11).slice(0, 2).forEach(function (l, k) { G.txt(c, l, x, y + 168 + k * 13, 11, '#ff9a8a', 'left'); }); else costLines(c, A.cost(p, nx), x, y + 168);
    } else if (own) G.txt(c, 'Ya fabricada' + (n ? ' (+' + n + ')' : '') + '.', x, y + 148, 12, '#9dffb4', 'left');
    // frase de daño recibido
    var mm = A.mult(m2, s.fam, G.Tree.fx.bastion, 0) * A.zone();
    G.txt(c, 'Recibes x' + (Math.round(mm * 100) / 100).toString().replace('.', ',') + ' del daño en ' + ((G.curBiome || 'bosque').toUpperCase()) + ' (melee)', x, R_DET.y + R_DET.h - 12, 10, '#c8b8e8', 'left');
  }
  function drawEquipTab(c) {
    var m = A.get(), i, p, l;
    for (i = 0; i < 4; i++) {
      var r = tileR(i), id = A.eq()[i], pc = id && D.BY[id], on = ui.slot === i, hov = U.inR(r, inp.mouse), col = pc ? D.SETS[pc.set].color : '#4a3a66';
      c.fillStyle = on ? '#3a2a5a' : hov ? '#2a2038' : '#1a1226'; c.fillRect(r.x, r.y, r.w, r.h);
      c.strokeStyle = on ? '#ffe9a0' : col; c.lineWidth = on ? 4 : 2; c.strokeRect(r.x + 1, r.y + 1, r.w - 2, r.h - 2);
      G.txt(c, D.SLOTS[i], r.x + r.w / 2, r.y + 10, 11, on ? '#ffe9a0' : '#9a8fb0', 'center');
      if (pc) { icon(c, pc, r.x + r.w / 2 - 22, r.y + 18, 44, A.ref(id)); var nm = pc.name.length > 15 ? pc.name.slice(0, 14) + '.' : pc.name; G.txt(c, nm, r.x + r.w / 2, r.y + 72, 10, '#d8cfe8', 'center'); G.txt(c, 'DEF ' + fx1(pDef(pc, A.ref(id))) + (A.ref(id) ? '  +' + A.ref(id) : ''), r.x + r.w / 2, r.y + 88, 10, '#ffe9a0', 'center'); }
      else G.txt(c, '(vacío)', r.x + r.w / 2, r.y + 54, 11, '#6a5f78', 'center');
      G.txt(c, String(i + 1), r.x + 8, r.y + r.h - 8, 9, '#5a4f68', 'center');
    }
    // bonos de set activos
    G.txt(c, 'SETS', 14, 336, 10, '#9a8fb0', 'left'); var yy = 350, any = false;
    D.SET_ORDER.forEach(function (sid) {
      var cnt = m.sets[sid] || 0; if (!cnt) return; any = true; var s = D.SETS[sid];
      G.txt(c, s.name + '  ' + cnt + '/4', 14, yy, 11, cnt >= 2 ? s.color : '#8a7f96', 'left'); yy += 13;
      if (cnt >= 2) { U.wrap(c, 'Bono 2: ' + s.t2, 224, 9).slice(0, 2).forEach(function (ln) { G.txt(c, ln, 14, yy, 9, '#c8b8e8', 'left'); yy += 11; }); }
      if (cnt >= 4 && s.b4) { U.wrap(c, 'Bono 4: ' + s.t4, 224, 9).slice(0, 3).forEach(function (ln) { G.txt(c, ln, 14, yy, 9, '#ffe9a0', 'left'); yy += 11; }); }
    });
    if (!any) G.txt(c, 'Equipa 2 piezas del mismo set para un bono.', 14, 350, 9, '#6a5f78', 'left');
    U.button(c, R_AUTO, A.trial ? 'QUITAR PRUEBA' : 'AUTO-EQUIPAR', { size: 14, color: A.trial ? '#8a4a2a' : '#2a6a74', hot: '#3a9aaa', border: '#a8e8f0', off: ui.ro && !A.trial });
    if (A.trial) G.txt(c, 'PRUEBA: ' + D.SETS[A.trial.sid].name + ' +' + A.trial.n + ' (solo Práctica)', 14, 436, 10, '#ffb08a', 'left');
    // lista
    l = list(); G.txt(c, (ui.tab === 0 ? 'FABRICADAS' : 'RECETAS') + ' - ' + D.SLOTS[ui.slot].toUpperCase(), 250, 106, 10, '#9a8fb0', 'left');
    if (!l.length) U.wrap(c, 'Aún no tienes piezas de este slot. Fabrícalas en la pestaña FABRICAR.', 340, 12).forEach(function (ln, k) { G.txt(c, ln, 256, 140 + k * 15, 12, '#9a8fb0', 'left'); });
    if (l.length > VIS) { U.button(c, R_UP, '^', { size: 18, color: '#3a2f48', hot: '#6a5a86', border: '#8a7aa6', off: ui.scroll <= 0 }); U.button(c, R_DN, 'v', { size: 18, color: '#3a2f48', hot: '#6a5a86', border: '#8a7aa6', off: ui.scroll >= l.length - VIS }); G.txt(c, (ui.scroll + 1) + '-' + Math.min(l.length, ui.scroll + VIS) + '/' + l.length, 592, 244, 10, '#9a8fb0', 'center'); }
    l.forEach(function (pp, k) {
      if (k < ui.scroll || k >= ui.scroll + VIS) return;
      var r = rowR(k), s = D.SETS[pp.set], own = A.owned(pp.id), n = Math.max(0, A.baseRef(pp.id)), isEq = A.eq()[pp.slot] === pp.id, sel = ui.sel === k, hov = U.inR(r, inp.mouse);
      var lock = !own && ui.tab === 1 && A.craftReq(pp), can = !own && !lock && A.costOK(A.cost(pp, 0));
      c.fillStyle = sel ? '#3a2a5a' : hov ? '#2a2038' : '#1a1226'; c.fillRect(r.x, r.y, r.w, r.h);
      c.strokeStyle = sel ? '#ffe9a0' : isEq ? '#9dffb4' : '#4a3a66'; c.lineWidth = sel ? 4 : 2; c.strokeRect(r.x + 1, r.y + 1, r.w - 2, r.h - 2);
      c.save(); if (lock) c.globalAlpha = 0.45; icon(c, pp, r.x + 8, r.y + 7, 44, n); c.restore();
      G.txt(c, pp.name + (own && n ? '  +' + n : ''), r.x + 60, r.y + 15, 13, lock ? '#7a7086' : '#fff', 'left');
      G.txt(c, (pp.set === 'mini' ? 'Minijefe ' + pp.bio : s.name) + '  DEF ' + fx1(pDef(pp, own ? n : 0)), r.x + 60, r.y + 32, 10, lock ? '#6a5f78' : s.color, 'left');
      G.txt(c, pStats(pp, own ? n : 0), r.x + 60, r.y + 46, 10, '#c8b8e8', 'left');
      var st = own ? (isEq ? 'EQUIPADA' : 'FABRICADA') : lock ? 'BLOQUEADA' : can ? 'LISTA' : 'FALTA';
      G.txt(c, st, r.x + r.w - 6, r.y + 15, 10, own ? (isEq ? '#9dffb4' : '#ffe9a0') : lock ? '#ff8a8a' : can ? '#9dffb4' : '#8a7f96', 'right');
    });
    p = cur(); drawDetail(c, p);
    if (ui.tab === 1) U.button(c, R_B1, p && A.owned(p.id) ? 'YA FABRICADA' : 'FABRICAR', { size: 17, off: !p || A.owned(p.id) || !!A.craftReq(p) || !A.costOK(A.cost(p, 0)), color: '#2a8a4a', hot: '#3aba66', border: '#9dffb4', sub: '[Enter]' });
    else {
      var isE = p && A.eq()[p.slot] === p.id;
      U.button(c, R_B1, !p ? 'EQUIPAR' : isE ? 'QUITAR' : 'EQUIPAR', { size: 17, off: !p, color: '#2a6a74', hot: '#3a9aaa', border: '#a8e8f0', sub: '[E]' });
      var nx = p ? A.baseRef(p.id) + 1 : 1, ok2 = p && nx <= A.maxRef(p) && !A.refReq(p, nx) && A.costOK(A.cost(p, nx));
      U.button(c, R_B2, p && nx <= A.maxRef(p) ? 'REFORZAR +' + nx : 'REFORZADA', { size: 17, off: !ok2, color: '#8a6a1a', hot: '#c89a2a', border: '#ffe08a', sub: '[R]' });
    }
  }
  function drawSets(c) {
    var m = A.get(), nS = D.SET_ORDER.length;
    G.txt(c, 'PROBAR A:', 590, 54, 10, '#9a8fb0', 'left');
    for (var q = 0; q < 4; q++) U.button(c, tnR(q), '+' + q, { size: 15, color: ui.tn === q ? '#8a6a1a' : '#2c2438', hot: '#c89a2a', border: ui.tn === q ? '#ffe08a' : '#6a5a80' });
    U.button(c, R_UP, '^', { size: 18, color: '#3a2f48', hot: '#6a5a86', border: '#8a7aa6', off: ui.scroll <= 0 }); U.button(c, R_DN, 'v', { size: 18, color: '#3a2f48', hot: '#6a5a86', border: '#8a7aa6', off: ui.scroll >= nS - SETV });
    D.SET_ORDER.forEach(function (sid, k) {
      if (k < ui.scroll || k >= ui.scroll + SETV) return;
      var s = D.SETS[sid], r = setR(k), unl = A.unlockedSet(sid), cnt = m.sets[sid] || 0, mini = sid === 'mini';
      U.panel(c, r.x, r.y, r.w, r.h, { border: unl ? s.color : '#3a3046' });
      G.txt(c, s.name + (mini ? '' : '  (T' + s.tier + ')'), r.x + 12, r.y + 13, 13, unl ? '#fff' : '#7a7086', 'left');
      if (!mini) G.txt(c, unl ? 'Equipadas ' + cnt + '/4' : 'Vence a ' + (G.Boss.DEFS[s.boss] ? G.Boss.DEFS[s.boss].name : s.boss), r.x + 12, r.y + 62, 10, unl ? (cnt >= 2 ? s.color : '#9a8fb0') : '#ff8a8a', 'left');
      D.ofSet(sid).forEach(function (p, j) { var own = A.owned(p.id), sz = mini ? 34 : 34, x = r.x + 12 + j * (sz + 4); c.save(); if (!own) c.globalAlpha = 0.4; icon(c, p, x, r.y + 22, sz, A.baseRef(p.id)); c.restore(); if (own && A.eq()[p.slot] === p.id) { c.fillStyle = '#9dffb4'; c.fillRect(x + 2, r.y + 22 + sz + 1, sz - 4, 3); } });
      if (mini) { U.wrap(c, '+10 % imán, +1 HP por corazón, +10 % XP en el Asfódelo, Frío -10 %, miel -15 %. Sin bono de set: 2 Insignias del bioma + 1 Esencia.', 340, 9).slice(0, 4).forEach(function (l, j) { G.txt(c, l, r.x + 200, r.y + 20 + j * 11, 9, '#c8b8e8', 'left'); }); }
      else {
        U.wrap(c, 'B2: ' + s.t2, 230, 9).slice(0, 3).forEach(function (l, j) { G.txt(c, l, r.x + 200, r.y + 12 + j * 10, 9, cnt >= 2 ? '#c8f0c8' : '#8a7f96', 'left'); });
        U.wrap(c, 'B4: ' + s.t4, 230, 9).slice(0, 3).forEach(function (l, j) { G.txt(c, l, r.x + 200, r.y + 42 + j * 10, 9, cnt >= 4 ? '#ffe9a0' : '#8a7f96', 'left'); });
      }
    });
    U.panel(c, 622, 114, 324, 300);
    G.txt(c, 'EQUIPO DE PRUEBA', 634, 134, 13, '#ffd27a', 'left');
    U.wrap(c, 'Toca PROBAR en un set para vestirlo a +' + ui.tn + ' sin fabricarlo ni gastar nada. Vale para ver la defensa en este panel y para la PRÁCTICA (un jefe con ese equipo). En una expedición normal se retira solo.', 296, 11).forEach(function (l, j) { G.txt(c, l, 634, 156 + j * 14, 11, '#d8cfe8', 'left'); });
    G.txt(c, A.trial ? 'Activo: ' + D.SETS[A.trial.sid].name + ' +' + A.trial.n : 'Ninguno activo', 634, 286, 12, A.trial ? '#ffb08a' : '#8a7f96', 'left');
    if (A.trial) { var mt = A.get(); G.txt(c, 'DEF ' + fx1(mt.def) + '  RD ' + pct(mt.rd) + '  HP +' + mt.hp, 634, 306, 12, '#ffe9a0', 'left'); G.txt(c, 'Recibes x' + (Math.round(A.mult(mt, D.SETS[A.trial.sid].fam, G.Tree.fx.bastion, 0) * A.zone() * 100) / 100).toString().replace('.', ',') + ' en ' + (G.curBiome || 'bosque').toUpperCase(), 634, 326, 12, '#c8b8e8', 'left'); }
    G.txt(c, 'Tope de reducción total: ' + Math.round(A.CAP * 100) + ' %.', 634, 398, 10, '#9a8fb0', 'left');
  }
  function drawSetButtons(c) {
    D.SET_ORDER.forEach(function (sid, k) {
      if (sid === 'mini' || k < ui.scroll || k >= ui.scroll + SETV) return;
      var tb = tryR(k), on = A.trial && A.trial.sid === sid && A.trial.n === ui.tn;
      U.button(c, tb, on ? 'QUITAR' : 'PROBAR +' + ui.tn, { size: 13, color: on ? '#8a4a2a' : '#2a6a74', hot: '#3a9aaa', border: '#a8e8f0' });
    });
  }

  function drawPed(c) {
    A.PED.forEach(function (d, k) {
      var r = pedR(k), done = SV().armor.ped[d.id], rdy = A.pedReady(d);
      U.panel(c, r.x, r.y, r.w, r.h, { border: rdy ? '#9dffb4' : '#3a2f48' });
      G.txt(c, d.name, r.x + 14, r.y + 16, 14, done ? '#8a7f96' : '#ffd27a', 'left'); G.txt(c, d.desc, r.x + 14, r.y + 36, 11, '#d8cfe8', 'left');
      G.txt(c, 'Pago: ' + A.rewardText(d), r.x + 480, r.y + 27, 11, '#ffe9a0', 'left');
      U.button(c, { x: r.x + r.w - 150, y: r.y + 3, w: 144, h: r.h - 6 }, done ? 'COBRADO' : rdy ? 'COBRAR' : 'EN CURSO', { size: 14, off: !rdy, color: '#2a8a4a', hot: '#3aba66', border: '#9dffb4' });
    });
  }
  S.draw = function (c) {
    var m = A.get();
    c.fillStyle = '#08040e'; c.fillRect(0, 0, G.W, G.H);
    G.txt(c, ui.ro ? 'EQUIPO (solo lectura)' : 'TALLER DE CARAPA', 14, 24, ui.ro ? 20 : 24, '#6ac8d8', 'left');
    U.part(c, 'brasa', 340, 24, 10); G.txt(c, 'Brasas ' + SV().brasas, 356, 24, 15, '#ff9a3c', 'left');
    G.txt(c, A.OFF ? 'ARMADURA APAGADA (?arm=0)' : 'DEF ' + fx1(m.def) + '  =  ' + pct(m.rd) + ' (tope ' + Math.round(A.CAP * 100) + ' %)   HP +' + m.hp, 470, 24, 13, A.OFF ? '#ff8a8a' : '#ffe9a0', 'left');
    U.button(c, R_CLOSE, 'X', { size: 20, color: '#7a2a3a', hot: '#c03a4a', border: '#ff8a8a' });
    for (var i = 0; i < 4; i++) {
      var tb = tabR(i), on = ui.tab === i, badge = i === 1 ? A.readyCount() : i === 3 ? A.pedReadyCount() : 0;
      c.fillStyle = on ? '#2a1d3a' : '#150f20'; c.fillRect(tb.x, tb.y, tb.w, tb.h); c.strokeStyle = on ? '#6ac8d8' : '#3a2f48'; c.lineWidth = on ? 4 : 2; c.strokeRect(tb.x + 1, tb.y + 1, tb.w - 2, tb.h - 2);
      G.txt(c, TABS[i], tb.x + tb.w / 2, tb.y + tb.h / 2, 14, on ? '#6ac8d8' : '#8a7f96', 'center');
      if (badge) { c.fillStyle = '#7dff9a'; c.beginPath(); c.arc(tb.x + tb.w - 12, tb.y + 12, 9, 0, 6.283); c.fill(); G.txt(c, String(badge), tb.x + tb.w - 12, tb.y + 13, 11, '#102014', 'center', 'rgba(0,0,0,0)'); }
    }
    if (ui.msgT > 0 && ui.msg) G.txt(c, ui.msg, 430, 521, 12, '#ffe9a0', 'center');
    if (ui.tab <= 1) drawEquipTab(c); else if (ui.tab === 2) { drawSets(c); drawSetButtons(c); } else drawPed(c);
    G.txt(c, 'Q/E pestaña  1-4 slot  Enter acción  R reforzar  Esc salir', 14, 532, 9, '#5a4f68', 'left');
  };
})();
