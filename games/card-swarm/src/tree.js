/* tree.js - Árbol de forja de Grum (Fase 2a): datos de nodos (Tronco + Fuego completo, 12 nodos), reglas (PF, prerrequisitos, ramas excluyentes,
   reespecializar) y el panel de UI por pestañas (Fuego / Tronco / Clásica). Los efectos viven en T.fx (flags) y los leen cards.js, combat.js,
   weapons.js, player.js y main.js. Costes por nivel en Loot.NODE_TIER; nada de balance está aquí salvo los textos y la disposición. */
(function () {
  'use strict';
  var G = window.G, T = G.Tree = {}, L = G.Loot, U = G.UI, inp = G.input;

  // ------------------------------------------------------------- Datos
  // type: C carta, M mejora A/B, P pasivo, X rama excluyente, S set, Ma maestría, R rango/tronco. col,row = posición en la rejilla (100 x 68 px).
  // req: { all: [...] } o { any: [...] } (F0 = raíz, siempre comprada). tier: T1..T4 (T2 pide Rango II, T3/T4 piden Rango III). cost: coste propio (tronco).
  var NODES = [
    { id: 'F0', tree: 'fire', tag: 'fire', type: 'root', name: 'Chispa', col: 2.5, row: 0, icon: 'flame', desc: 'Carta inicial de Fuego (Rango I): proyectil al enemigo más cercano con quemadura. Raíz del árbol.' },
    { id: 'F1', tree: 'fire', tag: 'fire', type: 'M', tier: 'T1', name: 'Chispa II', col: 1, row: 1, icon: 'flame', card: 'spark', req: { all: ['F0'] },
      desc: 'Chispa sube a Rango II (+8 % de daño). Elige una mejora permanente.',
      ch: { A: { name: 'Pavesa', fx: 'pavesa', desc: 'La quemadura de Chispa dura +2 s y hace +30 % de su daño.' }, B: { name: 'Ráfaga', fx: 'rafaga', desc: 'El cooldown de Chispa baja un 15 %.' } } },
    { id: 'F2', tree: 'fire', tag: 'fire', type: 'C', tier: 'T1', name: 'Bola de brasa', col: 4, row: 1, icon: 'burst', card: 'ember', req: { all: ['F0'] },
      desc: 'Desbloquea la carta Bola de brasa (común): bola lenta que explota en área.' },
    { id: 'F4', tree: 'fire', tag: 'fire', type: 'P', tier: 'T1', name: 'Pulmón de fragua', col: 0, row: 2, icon: 'flame', fx: 'lung', req: { all: ['F1'] },
      desc: 'Pasivo: +8 % de daño en todas las cartas de Fuego.' },
    { id: 'F5', tree: 'fire', tag: 'fire', type: 'C', tier: 'T2', name: 'Manto de ceniza', col: 2, row: 2, icon: 'mantle', card: 'mantle', req: { any: ['F1', 'F2'] },
      desc: 'Desbloquea la carta pasiva Manto de ceniza (rara): las cartas Fuego hacen +25 % de daño.' },
    { id: 'F3', tree: 'fire', tag: 'fire', type: 'M', tier: 'T2', name: 'Bola II', col: 4, row: 2, icon: 'burst', card: 'ember', req: { all: ['F2'] },
      desc: 'Bola de brasa sube a Rango II. Elige una mejora permanente.',
      ch: { A: { name: 'Metralla', fx: 'metralla', desc: 'Al explotar lanza además 3 fragmentos de 8 de daño.' }, B: { name: 'Napalm', fx: 'napalm', desc: 'Deja suelo ardiente 2 s (4 dps, radio 40).' } } },
    { id: 'F6', tree: 'fire', tag: 'fire', type: 'X', tier: 'T2', name: 'Cenizas ardientes', col: 1, row: 3, icon: 'cloud', fx: 'cenizas', req: { all: ['F5'] }, xor: 'F7',
      desc: 'Un enemigo quemado que muere deja 3 s de fuego en el suelo (radio 35). Para enjambres. Excluye a Fundición.' },
    { id: 'F7', tree: 'fire', tag: 'fire', type: 'X', tier: 'T2', name: 'Fundición', col: 3, row: 3, icon: 'shield', fx: 'fundicion', req: { all: ['F5'] }, xor: 'F6',
      desc: 'Fuego ignora la mitad del escudo del Escudero (x0,2 pasa a x0,5) y hace +15 % a élites y jefe. Excluye a Cenizas ardientes.' },
    { id: 'F8', tree: 'fire', tag: 'fire', type: 'C', tier: 'T3', name: 'Anillo ardiente', col: 4, row: 3, icon: 'ring', card: 'ring', req: { all: ['F3', 'F5'] },
      desc: 'Desbloquea la carta épica Anillo ardiente: 2 llamas orbitan a tu alrededor. Exige 1 Esencia rara.' },
    { id: 'F10', tree: 'fire', tag: 'fire', type: 'S', tier: 'T2', name: 'Emblema de Fuego', col: 2, row: 4, icon: 'burst', fx: 'emblem', req: { any: ['F6', 'F7'] },
      desc: 'Set: con 3 cartas Fuego en la mano, +25 % de daño de Fuego. Con 4 o más, "Pira": las quemaduras se propagan al morir.' },
    { id: 'F9', tree: 'fire', tag: 'fire', type: 'M', tier: 'T2', name: 'Anillo II', col: 4, row: 4, icon: 'ring', card: 'ring', req: { all: ['F8'] },
      desc: 'Anillo ardiente sube a Rango II. Elige una mejora permanente.',
      ch: { A: { name: 'Corona', fx: 'corona', desc: '3 llamas orbitales en vez de 2.' }, B: { name: 'Cometa', fx: 'cometa', desc: 'Órbita +25 % de radio y +20 % de daño.' } } },
    { id: 'F11', tree: 'fire', tag: 'fire', type: 'Ma', tier: 'T4', name: 'Corazón de brasa', col: 3, row: 5, icon: 'heart', fx: 'heart', req: { all: ['F9', 'F10'] },
      desc: 'Maestría: una vez por expedición, al llegar a 0 HP revives con el 40 % de vida y una explosión de radio 120 (60 de daño).' },
    // ---- Tronco común
    { id: 'R2', tree: 'trunk', tag: 'neutral', type: 'R', name: 'Rango de forja II', col: 2, row: 0, icon: 'II', fx: 'rank2', cost: { pf: 0, parts: { thread: 30, feather: 10 }, brasas: 100 },
      desc: 'Abre los nodos de nivel T2 de todos los árboles.' },
    { id: 'R3', tree: 'trunk', tag: 'neutral', type: 'R', name: 'Rango de forja III', col: 2, row: 1, icon: 'III', fx: 'rank3', req: { all: ['R2'] }, cost: { pf: 0, parts: { thread: 60, feather: 20, plate: 10 }, brasas: 300 },
      desc: 'Abre los nodos de nivel T3 (cartas épicas) y T4 (maestrías).' },
    { id: 'ASH', tree: 'trunk', tag: 'neutral', type: 'P', name: 'Ceniza viva', col: 4, row: 1, icon: 'burst', fx: 'ash', cost: { pf: 1, parts: { thread: 20 }, brasas: 0 },
      desc: 'Pasivo: empiezas cada expedición con +20 de Ceniza.' },
    { id: 'ANC', tree: 'trunk', tag: 'neutral', type: 'S', name: 'Tercera ancla', col: 2, row: 2, icon: '3', fx: 'anchor3', req: { all: ['R3'] }, cost: { pf: 3, parts: { rare: 2 }, brasas: 0 },
      desc: 'Llevas 3 cartas ancla ya en la mano al salir, en vez de 2.' },
    { id: 'N1', tree: 'trunk', tag: 'neutral', type: 'C', tier: 'T1', name: 'Pezuñas veloces', col: 1, row: 4, icon: 'boots', card: 'hooves',
      desc: 'Desbloquea la pasiva Pezuñas veloces: +12 % de velocidad de movimiento.' },
    { id: 'N2', tree: 'trunk', tag: 'neutral', type: 'C', tier: 'T1', name: 'Imán de brasas', col: 2, row: 4, icon: 'magnet', card: 'magnet',
      desc: 'Desbloquea la pasiva Imán de brasas: radio de recogida x2 y +20 % de XP.' },
    { id: 'N3', tree: 'trunk', tag: 'neutral', type: 'C', tier: 'T1', name: 'Alforja de ceniza', col: 3, row: 4, icon: 'bag', card: 'satchel',
      desc: 'Desbloquea la pasiva Alforja de ceniza: +50 % de Ceniza y rerolls 5 más baratos.' }
  ];
  var BY = {}; NODES.forEach(function (n) { BY[n.id] = n; });
  T.NODES = NODES; T.node = function (id) { return BY[id]; };
  T.TABS = [{ id: 'fire', name: 'FUEGO', color: '#ff7a2a' }, { id: 'trunk', name: 'TRONCO', color: '#c8b8e8' }, { id: 'classic', name: 'CLÁSICA', color: '#e8dcb0' }];
  var TYPE_NAME = { root: 'RAÍZ', C: 'CARTA', M: 'MEJORA A / B', P: 'PASIVO', X: 'RAMA EXCLUYENTE', S: 'SET', Ma: 'MAESTRÍA', R: 'RANGO DE FORJA' };

  // ------------------------------------------------------------- Estado y reglas
  function SV() { return G.Save.data; }
  T.fx = {};
  T.owned = function (id) { return id === 'F0' || !!SV().nodes[id]; };
  T.choice = function (id) { var o = SV().nodes[id]; return o ? o.c : null; };
  T.pfEarned = function () { return SV().pf.earned; };
  T.pfUsed = function () { var u = 0, N = SV().nodes; for (var id in N) if (!N[id].free && BY[id]) u += T.cost(BY[id]).pf; return u; };
  T.pfFree = function () { return T.pfEarned() - T.pfUsed(); };
  T.addPF = function (n) {
    var S = SV(), before = S.pf.earned; S.pf.earned = Math.min(L.PF_CAP, before + n);
    return S.pf.earned - before;
  };
  // Primer élite abatido de cada tipo: +1 PF
  T.onElite = function (type, e) {
    var S = SV(); if (S.elites[type]) return;
    S.elites[type] = 1;
    var got = T.addPF(L.PF_SOURCES.firstElite); G.Save.save();
    if (got) { L.run.pf = (L.run.pf || 0) + got; try { G.fx.num(e.x, e.y - 40, '+' + got + ' PF', '#ffd24a', true); G.Hud.banner('+1 PUNTO DE FORJA', 1800, '#ffd24a'); } catch (x) { /* fx */ } }
  };

  T.cost = function (n) {
    if (n.cost) return n.cost;
    var t = L.NODE_TIER[n.tier || 'T1'], parts = {}, main = L.MAIN[n.tag], sec = L.SEC[n.tag];
    parts[main] = t.main; if (sec !== main) parts[sec] = t.sec;
    if (t.rare) parts.rare = t.rare;
    return { pf: t.pf, parts: parts, brasas: t.brasas };
  };
  function nodeOK(id, set) { return id === 'F0' || (set ? !!set[id] : !!SV().nodes[id]); }
  function reqOK(n, set) {
    if (!n.req) return true;
    var r = n.req, i;
    if (r.all) { for (i = 0; i < r.all.length; i++) if (!nodeOK(r.all[i], set)) return false; return true; }
    for (i = 0; i < r.any.length; i++) if (nodeOK(r.any[i], set)) return true;
    return false;
  }
  function tierOK(n, set) {
    if (n.tier === 'T2') return nodeOK('R2', set);
    if (n.tier === 'T3' || n.tier === 'T4') return nodeOK('R3', set);
    return true;
  }
  T.reason = function (n) {
    if (n.xor && T.owned(n.xor)) return 'Excluido por ' + BY[n.xor].name + '.';
    if (n.req && !reqOK(n)) {
      var names = (n.req.all || n.req.any).map(function (i) { return BY[i].name; });
      return 'Requiere ' + names.join(n.req.all ? ' y ' : ' o ') + '.';
    }
    if (!tierOK(n)) return 'Requiere ' + (n.tier === 'T2' ? 'Rango de forja II (Tronco)' : 'Rango de forja III (Tronco)') + '.';
    return '';
  };
  // 'owned' | 'excluded' | 'locked' | 'avail'
  T.status = function (n) {
    if (T.owned(n.id)) return 'owned';
    if (n.xor && T.owned(n.xor)) return 'excluded';
    if (!reqOK(n) || !tierOK(n)) return 'locked';
    return 'avail';
  };
  // ¿Se puede pagar? Devuelve '' si sí, o el texto de lo que falta
  T.afford = function (n) {
    var c = T.cost(n), S = SV(), k;
    if (c.pf > T.pfFree()) return 'Faltan Puntos de Forja.';
    for (k in c.parts) if ((S.parts[k] || 0) < c.parts[k]) return 'Faltan partes.';
    if (S.brasas < c.brasas) return 'Faltan Brasas.';
    return '';
  };
  T.availableCount = function () {
    var n = 0; NODES.forEach(function (x) { if (x.type !== 'root' && T.status(x) === 'avail' && !T.afford(x)) n++; });
    return n;
  };

  T.buy = function (id, choice) {
    var n = BY[id], S = SV(); if (!n || n.type === 'root') return { ok: false, msg: '' };
    var st = T.status(n);
    if (st !== 'avail') return { ok: false, msg: T.reason(n) || 'Ya comprado.' };
    if (n.type === 'M' && !n.ch[choice]) return { ok: false, msg: 'Elige A o B.' };
    var why = T.afford(n); if (why) return { ok: false, msg: why };
    var c = T.cost(n), k;
    for (k in c.parts) S.parts[k] -= c.parts[k];
    S.brasas -= c.brasas;
    var o = { c: n.type === 'M' ? choice : '1' };
    if (n.card) {
      if (n.type === 'C') S.cards[n.card] = Math.max(1, S.cards[n.card] || 0);
      else if ((S.cards[n.card] || 1) < L.MAXRANK) { S.cards[n.card] = (S.cards[n.card] || 1) + 1; o.r = 1; }
    }
    S.nodes[id] = o;
    var msg = n.type === 'M' ? n.name + ': ' + n.ch[choice].name : n.name;
    if (!S.ever[id]) {   // hito "Maestría de oficio": cada 4 nodos distintos forjados, +1 PF
      S.ever[id] = 1;
      var m = Math.floor(Object.keys(S.ever).length / L.PF_SOURCES.milestoneEvery);
      if (m > S.mile) { S.mile = m; if (T.addPF(1)) msg += '  -  Maestría de oficio: +1 PF'; }
    }
    T.sync(); G.Save.save();
    return { ok: true, msg: n.type === 'C' ? '¡Forjada: ' + msg + '!' : '¡Forjado: ' + msg + '!', card: n.card };
  };

  // Conjunto de nodos que caen si se quita `id` (él y sus dependientes). Los heredados (free) nunca caen.
  function removalSet(ids) {
    var set = {}, N = SV().nodes, id, ch = true;
    for (id in N) set[id] = true;
    ids.forEach(function (i) { delete set[i]; });
    while (ch) {
      ch = false;
      for (id in set) if (!N[id].free && (!reqOK(BY[id], set) || !tierOK(BY[id], set))) { delete set[id]; ch = true; }
    }
    var out = []; for (id in N) if (!set[id]) out.push(id);
    return out;
  }
  function refundInfo(ids) {
    var pf = 0, parts = {};
    ids.forEach(function (id) {
      var c = T.cost(BY[id]), k; pf += c.pf;
      for (k in c.parts) parts[k] = (parts[k] || 0) + Math.floor(c.parts[k] * L.RESPEC.refund);
    });
    return { pf: pf, parts: parts };
  }
  // Coste de quitar un nodo (y dependientes): 40 Brasas por PF devuelto; el primer reespecializado es gratis
  T.undoPlan = function (id) {
    var N = SV().nodes; if (!N[id] || N[id].free) return null;
    var ids = removalSet([id]), r = refundInfo(ids);
    return { ids: ids, pf: r.pf, parts: r.parts, brasas: SV().respecFree ? 0 : L.RESPEC.brasasPerPF * r.pf };
  };
  T.treePlan = function (tree) {
    var N = SV().nodes, base = Object.keys(N).filter(function (id) { return !N[id].free && BY[id].tree === tree; });
    if (!base.length) return null;
    var ids = removalSet(base), r = refundInfo(ids);
    return { ids: ids, pf: r.pf, parts: r.parts, brasas: SV().respecFree ? 0 : L.RESPEC.tree };
  };
  T.applyPlan = function (plan) {
    var S = SV();
    if (S.brasas < plan.brasas) return { ok: false, msg: 'Faltan Brasas para reespecializar (' + plan.brasas + ').' };
    S.brasas -= plan.brasas; S.respecFree = 0;
    plan.ids.forEach(function (id) {
      var n = BY[id], o = S.nodes[id];
      if (n.card) {
        if (n.type === 'C') { S.cards[n.card] = 0; S.anchors = S.anchors.filter(function (a) { return a !== n.card; }); }
        else if (o.r) S.cards[n.card] = Math.max(1, (S.cards[n.card] || 1) - 1);
      }
      delete S.nodes[id];
    });
    for (var k in plan.parts) G.Save.add(k, plan.parts[k]);
    T.sync(); G.Save.save();
    return { ok: true, msg: 'Reespecializado: +' + plan.pf + ' PF y el 50 % de las partes.' };
  };

  // Recalcula efectos y sincroniza con el guardado (nodos heredados de v1, ranuras de ancla, anclas válidas)
  T.sync = function () {
    var S = SV(), fx = {};
    NODES.forEach(function (n) {   // migración: una carta ya desbloqueada marca su nodo de carta como heredado (sin PF)
      if (n.type === 'C' && n.card && (S.cards[n.card] || 0) > 0 && !S.nodes[n.id]) S.nodes[n.id] = { c: '1', free: 1 };
    });
    for (var id in S.nodes) {
      var n = BY[id], o = S.nodes[id]; if (!n) { delete S.nodes[id]; continue; }
      if (n.fx) fx[n.fx] = true;
      if (n.type === 'M' && n.ch[o.c]) fx[n.ch[o.c].fx] = true;
    }
    T.fx = fx;
    G.B.anchorSlots = fx.anchor3 ? 3 : 2;
    S.anchors = S.anchors.filter(function (id2, i, a) { return G.Loot.unlocked(id2) && a.indexOf(id2) === i; }).slice(-G.B.anchorSlots);
  };
  T.startAsh = function () { return (T.fx.ash ? 20 : 0) + (G.runBuff && G.runBuff.tonic ? 40 : 0); };
  T.cdMul = function (id) { return id === 'spark' && T.fx.rafaga ? 0.85 : 1; };

  // ------------------------------------------------------------- UI
  var ui = { tab: 'fire', sel: 'F1', csel: 0, msg: '', msgT: 0, confirm: '', confirmT: 0, flash: null, flashT: 0, fade: 0 };
  var R_CLOSE = { x: 904, y: 2, w: 52, h: 42 };
  var R_TAB = function (i) { return { x: 10 + i * 156, y: 50, w: 148, h: 44 }; };
  var R_RESET = { x: 590, y: 4, w: 156, h: 38 };
  var DET = { x: 644, y: 100, w: 306, h: 432 };
  var R_BUY = { x: 654, y: 470, w: 286, h: 52 };
  var R_CH = [{ x: 654, y: 470, w: 140, h: 52 }, { x: 800, y: 470, w: 140, h: 52 }];
  var R_UNDO = { x: 754, y: 418, w: 186, h: 44 };
  var NX = 72, NY = 138, SX = 100, SY = 68, NR = 28;
  function pos(n) { return { x: NX + n.col * SX, y: NY + n.row * SY }; }
  function say(t) { ui.msg = t; ui.msgT = 3200; }
  function tabNodes() { return NODES.filter(function (n) { return n.tree === ui.tab; }); }

  T.open = function (tab) { ui.tab = tab || ui.tab; ui.msg = ''; ui.msgT = 0; ui.confirm = ''; if (ui.tab !== 'classic' && !BY[ui.sel]) ui.sel = 'F1'; fixSel(); };
  function fixSel() { if (ui.tab !== 'classic' && (!BY[ui.sel] || BY[ui.sel].tree !== ui.tab)) ui.sel = tabNodes()[ui.tab === 'fire' ? 1 : 0].id; }
  function setTab(t) { if (t === ui.tab) return; ui.tab = t; ui.confirm = ''; fixSel(); G.sfx('flip', { vol: 0.4 }); }
  function classicList() { return G.Cards.defs.filter(function (d) { return d.id && L.classic(d.id); }); }

  var CELL = { w: 62, h: 84, gx: 66, gy: 92, x0: 14, y0: 112, cols: 9 };
  function cellRect(i) { return { x: CELL.x0 + (i % CELL.cols) * CELL.gx, y: CELL.y0 + Math.floor(i / CELL.cols) * CELL.gy, w: CELL.w, h: CELL.h }; }
  var R_FORGE = { x: 654, y: 470, w: 286, h: 52 };

  function moveSel(dx, dy) {
    var cur = BY[ui.sel], p = pos(cur), best = null, bd = 1e9;
    tabNodes().forEach(function (n) {
      if (n === cur) return;
      var q = pos(n), vx = q.x - p.x, vy = q.y - p.y;
      if (dx && Math.sign(vx) !== dx) return;
      if (dy && Math.sign(vy) !== dy) return;
      var d = dx ? Math.abs(vx) + Math.abs(vy) * 2.5 : Math.abs(vy) + Math.abs(vx) * 2.5;
      if (d < bd) { bd = d; best = n; }
    });
    if (best) { ui.sel = best.id; G.sfx('flip', { vol: 0.3 }); }
  }

  function doBuy(choice) {
    var n = BY[ui.sel], r = T.buy(n.id, choice);
    if (!r.ok) { say(r.msg); G.sfx('discard', { vol: 0.5 }); return; }
    say(r.msg); ui.flash = n.id; ui.flashT = 800;
    try { G.Snd.play('fuse'); } catch (e) { /* audio */ }
    if (G.Aldea && G.Aldea.onForged) G.Aldea.onForged(n);
  }
  function doUndo(plan) {
    if (!plan) return;
    var r = T.applyPlan(plan); say(r.msg);
    if (r.ok) { try { G.Snd.play('discard'); } catch (e) { /* audio */ } }
    ui.confirm = '';
  }
  function doClassicForge() {
    var d = classicList()[ui.csel]; if (!d) return;
    var nr = L.nextRank(d.id);
    if (!nr) { say('Rango máximo.'); return; }
    if (!L.canForge(d.id)) { say('Faltan partes o Brasas.'); G.sfx('discard', { vol: 0.5 }); return; }
    L.forge(d.id); T.sync(); ui.flashT = 800; ui.flash = '*';
    say(nr === 1 ? '¡Forjada: ' + d.name + '!' : d.name + ' sube a Rango ' + U.roman(nr) + ' (+8 % daño)');
    try { G.Snd.play('fuse'); } catch (e) { /* audio */ }
    if (G.Aldea && G.Aldea.onForged) G.Aldea.onForged(null);
  }

  // Devuelve true si hay que cerrar el panel
  T.update = function (dt) {
    var m = inp.mouse, click = inp.hit('Mouse0'), i;
    if (ui.msgT > 0) ui.msgT -= dt; if (ui.flashT > 0) ui.flashT -= dt; if (ui.confirmT > 0) ui.confirmT -= dt; else ui.confirm = '';
    if (inp.hit('Escape') || (click && U.inR(R_CLOSE, m))) return true;
    for (i = 0; i < 3; i++) if (inp.hit('Digit' + (i + 1)) || (click && U.inR(R_TAB(i), m))) { setTab(T.TABS[i].id); }
    var ti = T.TABS.map(function (t) { return t.id; }).indexOf(ui.tab);
    if (inp.hit('KeyQ') || inp.swipe === 1) setTab(T.TABS[(ti + 2) % 3].id);
    if (inp.hit('KeyE') || inp.swipe === -1) setTab(T.TABS[(ti + 1) % 3].id);

    if (ui.tab === 'classic') {
      var list = classicList();
      if (inp.hit('ArrowRight', 'KeyD')) ui.csel = Math.min(list.length - 1, ui.csel + 1);
      if (inp.hit('ArrowLeft', 'KeyA')) ui.csel = Math.max(0, ui.csel - 1);
      if (inp.hit('ArrowDown', 'KeyS')) ui.csel = Math.min(list.length - 1, ui.csel + CELL.cols);
      if (inp.hit('ArrowUp', 'KeyW')) ui.csel = Math.max(0, ui.csel - CELL.cols);
      if (inp.hit('KeyF')) doClassicForge();
      if (click) {
        for (i = 0; i < list.length; i++) if (U.inR(cellRect(i), m)) { ui.csel = i; G.sfx('flip', { vol: 0.4 }); return false; }
        if (U.inR(R_FORGE, m)) doClassicForge();
      }
      return false;
    }
    var n = BY[ui.sel];
    if (inp.hit('ArrowRight', 'KeyD')) moveSel(1, 0);
    if (inp.hit('ArrowLeft', 'KeyA')) moveSel(-1, 0);
    if (inp.hit('ArrowDown', 'KeyS')) moveSel(0, 1);
    if (inp.hit('ArrowUp', 'KeyW')) moveSel(0, -1);
    if (n.type === 'M') { if (inp.hit('KeyF')) doBuy('A'); if (inp.hit('KeyG')) doBuy('B'); }
    else if (inp.hit('KeyF')) doBuy('1');
    var plan = T.undoPlan(ui.sel), tplan = T.treePlan(ui.tab);
    if (inp.hit('KeyU')) tryConfirm('u' + ui.sel, plan);
    if (inp.hit('KeyR')) tryConfirm('t' + ui.tab, tplan);
    if (click) {
      if (U.inR(R_RESET, m)) { tryConfirm('t' + ui.tab, tplan); return false; }
      var tn = tabNodes();
      for (i = 0; i < tn.length; i++) { var p = pos(tn[i]); if (Math.hypot(m.x - p.x, m.y - p.y) <= NR + 4) { ui.sel = tn[i].id; G.sfx('flip', { vol: 0.4 }); return false; } }
      if (n.type === 'M') { if (U.inR(R_CH[0], m)) doBuy('A'); else if (U.inR(R_CH[1], m)) doBuy('B'); }
      else if (U.inR(R_BUY, m)) doBuy('1');
      if (U.inR(R_UNDO, m) && T.owned(n.id)) tryConfirm('u' + ui.sel, plan);
    }
    return false;
  };
  function tryConfirm(key, plan) {
    if (!plan) { say(key.charAt(0) === 'u' ? 'Este nodo no se puede deshacer.' : 'Nada que reespecializar en este árbol.'); return; }
    if (ui.confirm === key) { doUndo(plan); return; }
    ui.confirm = key; ui.confirmT = 3500;
    say('Pulsa otra vez para confirmar: +' + plan.pf + ' PF, ' + (plan.brasas ? plan.brasas + ' Brasas' : 'GRATIS (primera vez)') + ', 50 % de partes.');
  }

  // ------------------------------------------------------------- Dibujo
  function pfIcon(c, x, y, s, col) {
    c.save(); c.translate(x, y); c.fillStyle = col || '#ffd24a'; c.strokeStyle = '#0c0814'; c.lineWidth = Math.max(1.5, s * 0.14); c.lineJoin = 'round';
    c.beginPath(); for (var i = 0; i < 6; i++) { var a = Math.PI / 6 + i * Math.PI / 3; c.lineTo(Math.cos(a) * s, Math.sin(a) * s); } c.closePath(); c.fill(); c.stroke();
    c.fillStyle = '#7a4a00'; c.fillRect(-s * 0.2, -s * 0.5, s * 0.4, s * 0.8); c.fillRect(-s * 0.5, -s * 0.5, s, s * 0.22); c.restore();
  }
  T.pfIcon = pfIcon;
  function costRow(c, cost, x, y) {
    var S = SV(), items = [], k, i;
    if (cost.pf) items.push({ k: 'pf', have: T.pfFree(), need: cost.pf });
    for (k in cost.parts) items.push({ k: k, have: S.parts[k] || 0, need: cost.parts[k] });
    if (cost.brasas) items.push({ k: 'brasa', have: S.brasas, need: cost.brasas });
    if (!items.length) { G.txt(c, 'Sin coste', x, y, 12, '#9a8fb0', 'left'); return true; }
    var ok = true;
    for (i = 0; i < items.length; i++) {
      var it = items[i], cx = x + (i % 4) * 74, cy = y + Math.floor(i / 4) * 26, good = it.have >= it.need;
      if (!good) ok = false;
      if (it.k === 'pf') pfIcon(c, cx + 10, cy, 9); else U.part(c, it.k, cx + 10, cy, 10);
      G.txt(c, (it.have >= 1000 ? (it.have / 1000).toFixed(1) + 'k' : it.have) + '/' + it.need, cx + 24, cy + 1, 11, good ? '#9dffb4' : '#ff8a8a', 'left');
    }
    return ok;
  }
  T.costRow = costRow;

  function drawNodeShape(c, n, st, p, selected, t) {
    var tag = G.TAGS[n.tag] || G.TAGS.neutral, col = tag.color, owned = st === 'owned', pulse = 0.5 + 0.5 * Math.sin(t * 5);
    var dim = st === 'locked' || st === 'excluded';
    c.save(); c.translate(p.x, p.y);
    if (st === 'avail') { c.shadowColor = col; c.shadowBlur = 10 + 8 * pulse; }
    c.fillStyle = owned ? col : (dim ? '#1c1626' : '#2a1d3a');
    c.beginPath(); c.arc(0, 0, NR, 0, 6.283); c.fill(); c.shadowBlur = 0;
    if (n.type === 'M') {   // círculo partido en dos mitades A / B
      var chosen = T.choice(n.id);
      c.save(); c.beginPath(); c.arc(0, 0, NR - 3, 0, 6.283); c.clip();
      c.fillStyle = chosen === 'A' ? '#fff3c0' : (owned ? 'rgba(0,0,0,0.35)' : 'rgba(255,255,255,0.08)'); c.fillRect(-NR, -NR, NR, NR * 2);
      c.fillStyle = chosen === 'B' ? '#fff3c0' : (owned ? 'rgba(0,0,0,0.35)' : 'rgba(255,255,255,0.14)'); c.fillRect(0, -NR, NR, NR * 2);
      c.restore();
      c.strokeStyle = '#0c0814'; c.lineWidth = 2; c.beginPath(); c.moveTo(0, -NR + 2); c.lineTo(0, NR - 2); c.stroke();
    }
    c.lineWidth = selected ? 5 : 3.5;
    c.strokeStyle = owned ? '#fff3c0' : (st === 'avail' ? col : (dim ? '#4a4058' : col));
    if (st === 'avail') c.globalAlpha = 0.65 + 0.35 * pulse;
    c.beginPath(); c.arc(0, 0, NR, 0, 6.283); c.stroke(); c.globalAlpha = 1;
    if (n.type === 'X') { c.strokeStyle = dim ? '#4a4058' : col; c.lineWidth = 2; c.setLineDash([4, 4]); c.beginPath(); c.arc(0, 0, NR + 5, 0, 6.283); c.stroke(); c.setLineDash([]); }
    if (n.type === 'Ma' || n.type === 'S') { c.strokeStyle = dim ? '#4a4058' : '#ffd24a'; c.lineWidth = 2; c.beginPath(); c.arc(0, 0, NR + 4, 0, 6.283); c.stroke(); }
    c.restore();
    c.save(); if (dim) c.globalAlpha = 0.4;
    if (n.icon === 'II' || n.icon === 'III' || n.icon === '3') G.txt(c, n.icon, p.x, p.y + 1, n.icon.length > 1 ? 16 : 22, owned ? '#1a1024' : '#fff', 'center');
    else G.Cards.glyph(c, n.icon, p.x, p.y, n.type === 'M' ? 12 : 15, owned ? '#1a1024' : col);
    c.restore();
    if (st === 'excluded') { c.strokeStyle = '#ff6a6a'; c.lineWidth = 3; c.beginPath(); c.moveTo(p.x - 20, p.y - 20); c.lineTo(p.x + 20, p.y + 20); c.stroke(); }
    // coste en PF (chapa dorada) y estrella de nivel
    if (!owned) { var cc = T.cost(n); if (cc.pf) { pfIcon(c, p.x + 24, p.y - 22, 10, dim ? '#6a5a3a' : '#ffd24a'); G.txt(c, String(cc.pf), p.x + 24, p.y - 21, 10, '#fff', 'center'); } }
    G.txt(c, n.name.length > 15 ? n.name.slice(0, 14) + '.' : n.name, p.x, p.y + NR + 7, 10, dim ? '#6f6480' : '#d8cfe8', 'center');
  }

  T.draw = function (c) {
    var S = SV(), m = inp.mouse, t = Date.now() / 1000, i;
    c.fillStyle = '#08040e'; c.fillRect(0, 0, G.W, G.H);
    // cabecera
    G.txt(c, 'FORJA DE GRUM', 14, 22, 24, '#ffd27a', 'left');
    pfIcon(c, 262, 22, 11); G.txt(c, 'PF libres ' + T.pfFree(), 280, 22, 16, T.pfFree() > 0 ? '#ffd24a' : '#9a8fb0', 'left');
    G.txt(c, T.pfEarned() + '/' + L.PF_CAP + ' ganados', 280, 38, 10, '#9a8fb0', 'left');
    U.part(c, 'brasa', 430, 22, 10); G.txt(c, 'Brasas ' + S.brasas, 446, 22, 16, '#ff9a3c', 'left');
    var pk = ['thread', 'feather', 'spine', 'fang', 'plate', 'wick', 'frost', 'static', 'rare'];
    // fila de partes (compacta)
    pk.forEach(function (k, j) { var x = 484 + j * 47; U.part(c, k, x + 7, 72, 7); G.txt(c, String(S.parts[k] || 0), x + 17, 73, 11, (S.parts[k] || 0) ? '#fff' : '#6a5f78', 'left'); });
    U.button(c, R_CLOSE, 'X', { size: 20, color: '#7a2a3a', hot: '#c03a4a', border: '#ff8a8a' });
    for (i = 0; i < 3; i++) {
      var tb = T.TABS[i], r = R_TAB(i), on = tb.id === ui.tab;
      if (i === 0) { /* fuego */ }
      c.fillStyle = on ? '#2a1d3a' : '#150f20'; c.fillRect(r.x, r.y, r.w, r.h);
      c.strokeStyle = on ? tb.color : '#3a2f48'; c.lineWidth = on ? 4 : 2; c.strokeRect(r.x + 1, r.y + 1, r.w - 2, r.h - 2);
      G.txt(c, tb.name + ' [' + (i + 1) + ']', r.x + r.w / 2, r.y + r.h / 2, 15, on ? tb.color : '#8a7f96', 'center');
    }
    // mensaje
    if (ui.msgT > 0 && ui.msg) G.txt(c, ui.msg, 320, 508, 12, '#ffe9a0', 'center');
    if (ui.tab === 'classic') { drawClassic(c, m); return; }
    var nodes = tabNodes(), n = BY[ui.sel];
    // reespecializar árbol
    var tp = T.treePlan(ui.tab);
    U.button(c, R_RESET, ui.confirm === 't' + ui.tab ? 'SEGURO? OTRA VEZ' : 'REESPECIALIZAR', { size: 12, off: !tp, color: '#3a2f48', hot: '#6a3a8a', border: '#8a6a8a',
      sub: tp ? (S.respecFree ? 'primera vez GRATIS' : L.RESPEC.tree + ' Brasas') : 'nada que deshacer' });
    // aristas
    nodes.forEach(function (nd) {
      if (!nd.req) return;
      (nd.req.all || nd.req.any).forEach(function (pid) {
        var a = pos(BY[pid]), b = pos(nd), on = T.owned(pid) && T.owned(nd.id), ok = T.owned(pid);
        c.strokeStyle = on ? '#ffe9a0' : (ok ? '#7a6aa0' : '#3a2f48'); c.lineWidth = on ? 4 : 3;
        if (nd.req.any) c.setLineDash([6, 5]);
        c.beginPath(); c.moveTo(a.x, a.y); c.lineTo(b.x, b.y); c.stroke(); c.setLineDash([]);
      });
      if (nd.xor && nd.id < nd.xor) {   // "V" punteada entre hermanos excluyentes
        var q1 = pos(nd), q2 = pos(BY[nd.xor]);
        c.strokeStyle = '#ff6a6a'; c.lineWidth = 2; c.setLineDash([3, 5]); c.beginPath(); c.moveTo(q1.x + NR, q1.y); c.lineTo(q2.x - NR, q2.y); c.stroke(); c.setLineDash([]);
        G.txt(c, 'O', (q1.x + q2.x) / 2, q1.y, 12, '#ff8a8a', 'center');
      }
    });
    if (ui.tab === 'trunk') G.txt(c, 'CARTAS NEUTRAS', NX + 2 * SX, NY + 3 * SY + 10, 12, '#9a8fb0', 'center');
    nodes.forEach(function (nd) { drawNodeShape(c, nd, T.status(nd), pos(nd), nd.id === ui.sel, t); });
    if (ui.flashT > 0 && BY[ui.flash]) {
      var fp = pos(BY[ui.flash]), u = 1 - ui.flashT / 800;
      c.save(); c.globalCompositeOperation = 'lighter'; c.strokeStyle = 'rgba(255,224,120,' + (1 - u) + ')'; c.lineWidth = 5; c.beginPath(); c.arc(fp.x, fp.y, NR + u * 40, 0, 6.283); c.stroke(); c.restore();
    }
    // selección
    var sp = pos(n); c.strokeStyle = '#ffffff'; c.lineWidth = 2; c.setLineDash([4, 4]); c.lineDashOffset = -t * 20; c.beginPath(); c.arc(sp.x, sp.y, NR + 8, 0, 6.283); c.stroke(); c.setLineDash([]);
    drawDetail(c, n, m);
    G.txt(c, 'Flechas: mover  -  F/G: forjar (A/B)  -  U: deshacer nodo  -  R: reespecializar  -  Q/E: pestaña  -  Esc: salir', 14, 526, 10, '#6f6480', 'left');
  };

  function drawDetail(c, n, m) {
    var S = SV(), st = T.status(n), tag = G.TAGS[n.tag] || G.TAGS.neutral, i, y;
    U.panel(c, DET.x, DET.y, DET.w, DET.h, { border: tag.color });
    G.txt(c, n.name, DET.x + 14, DET.y + 22, 18, '#ffd27a', 'left');
    G.txt(c, (TYPE_NAME[n.type] || '') + (n.tier ? '  -  ' + n.tier : '') + '  -  ' + (n.tree === 'trunk' ? 'TRONCO' : tag.name), DET.x + 14, DET.y + 44, 11, tag.color, 'left');
    var stTxt = st === 'owned' ? (n.type === 'root' ? 'INICIAL' : 'COMPRADO' + (n.type === 'M' ? ': ' + n.ch[T.choice(n.id)].name : '') + (S.nodes[n.id] && S.nodes[n.id].free ? ' (heredado)' : '')) :
      st === 'avail' ? 'DISPONIBLE' : T.reason(n);
    G.txt(c, stTxt, DET.x + 14, DET.y + 64, 12, st === 'owned' ? '#9dffb4' : st === 'avail' ? '#ffe9a0' : '#ff8a8a', 'left');
    var lines = U.wrap(c, n.desc, DET.w - 28, 12); y = DET.y + 88;
    for (i = 0; i < lines.length && i < 6; i++) G.txt(c, lines[i], DET.x + 14, y + i * 16, 12, '#d8cfe8', 'left');
    y += Math.min(lines.length, 6) * 16 + 8;
    if (n.type === 'M') {
      ['A', 'B'].forEach(function (k, j) {
        var ch = n.ch[k], picked = T.choice(n.id) === k;
        G.txt(c, k + ' - ' + ch.name + (picked ? '  (elegida)' : ''), DET.x + 14, y, 12, picked ? '#9dffb4' : '#ffe9a0', 'left');
        var ls = U.wrap(c, ch.desc, DET.w - 28, 11);
        for (var q = 0; q < ls.length && q < 3; q++) G.txt(c, ls[q], DET.x + 14, y + 16 + q * 14, 11, '#bdb2d0', 'left');
        y += 20 + Math.min(ls.length, 3) * 14 + 6;
      });
    }
    if (n.type === 'root') return;
    var cost = T.cost(n);
    if (st !== 'owned') {
      G.txt(c, 'COSTE', DET.x + 14, 392, 11, '#9a8fb0', 'left');
      costRow(c, cost, DET.x + 12, 410);
    } else {
      var plan = T.undoPlan(n.id);
      G.txt(c, plan ? 'Deshacer: +' + plan.pf + ' PF, 50 % de partes' : 'No se puede deshacer', DET.x + 14, 392, 11, '#9a8fb0', 'left');
      G.txt(c, plan ? (plan.brasas ? plan.brasas + ' Brasas' : 'GRATIS (primera vez)') + (plan.ids.length > 1 ? '  (+' + (plan.ids.length - 1) + ' dependientes)' : '') : '', DET.x + 14, 410, 11, '#ff9a3c', 'left');
      U.button(c, R_UNDO, ui.confirm === 'u' + n.id ? 'SEGURO? OTRA VEZ' : 'DESHACER [U]', { size: 13, off: !plan, color: '#3a2f48', hot: '#6a3a8a', border: '#8a6a8a' });
    }
    var why = st === 'avail' ? T.afford(n) : '';
    var can = st === 'avail' && !why;
    if (n.type === 'M') {
      ['A', 'B'].forEach(function (k, j) {
        U.button(c, R_CH[j], 'ELEGIR ' + k, { size: 15, off: st !== 'avail' || !can, color: '#2a8a4a', hot: '#3aba66', border: '#9dffb4', sub: n.ch[k].name + (j ? ' [G]' : ' [F]') });
      });
    } else if (st === 'owned') {
      /* nada */
    } else {
      U.button(c, R_BUY, st === 'avail' ? (n.type === 'C' ? 'FORJAR' : 'COMPRAR') : 'BLOQUEADO', { size: 18, off: !can, color: '#2a8a4a', hot: '#3aba66', border: '#9dffb4', sub: why || (st === 'avail' ? '[F]' : '') });
    }
  }

  function drawClassic(c, m) {
    var list = classicList(), i, S = SV();
    if (ui.csel >= list.length) ui.csel = 0;
    G.txt(c, 'RECETAS PLANAS (cartas de Hielo, Rayo, Veneno, Sangre, Acero y neutras)', 14, 104, 12, '#9a8fb0', 'left');
    for (i = 0; i < list.length; i++) {
      var dd = list[i], r = cellRect(i), rk = G.Save.rank(dd.id);
      G.Cards.drawCard(c, { id: dd.id, lvl: 0 }, r.x, r.y + 12, r.w, r.h, { nocd: true, dim: rk === 0, glow: i === ui.csel ? '#ffe9a0' : null });
      if (i === ui.csel) { c.strokeStyle = '#ffe9a0'; c.lineWidth = 3; c.strokeRect(r.x - 2, r.y + 10, r.w + 4, r.h + 4); }
      if (L.canForge(dd.id)) { var pu = 0.6 + 0.4 * Math.sin(Date.now() / 200); c.fillStyle = 'rgba(120,255,160,' + pu + ')'; c.beginPath(); c.arc(r.x + 8, r.y + 20, 6, 0, 6.283); c.fill(); }
    }
    var yb = CELL.y0 + Math.ceil(list.length / CELL.cols) * CELL.gy + 16;
    G.txt(c, 'Fuego y neutras clave (Pezuñas, Imán, Alforja): pestañas FUEGO y TRONCO.', 14, yb, 12, '#d8cfe8', 'left');
    G.txt(c, 'Árboles de Hielo, Rayo, Veneno, Sangre y Acero: llegan en la Fase 2b.', 14, yb + 20, 12, '#d8cfe8', 'left');
    var d = list[ui.csel]; if (!d) return;
    var id = d.id, rank = G.Save.rank(id), nr = L.nextRank(id), tc = G.TAGS[d.tag].color;
    U.panel(c, DET.x, DET.y, DET.w, DET.h, { border: tc });
    G.Cards.drawCard(c, { id: id, lvl: 0 }, DET.x + 12, DET.y + 12, 62, 84, { nocd: true });
    G.txt(c, d.name, DET.x + 86, DET.y + 26, 17, '#ffd27a', 'left');
    G.txt(c, G.TAGS[d.tag].name + ' - ' + (d.type === 'attack' ? 'ATAQUE' : 'PASIVA'), DET.x + 86, DET.y + 48, 12, tc, 'left');
    G.txt(c, rank ? 'RANGO ' + U.roman(rank) : 'BLOQUEADA', DET.x + 86, DET.y + 68, 13, rank ? '#fff' : '#ff8a8a', 'left');
    var ls = U.wrap(c, d.desc, DET.w - 28, 12);
    for (i = 0; i < ls.length && i < 4; i++) G.txt(c, ls[i], DET.x + 14, DET.y + 118 + i * 16, 12, '#d8cfe8', 'left');
    var ok = false;
    if (nr) {
      G.txt(c, nr === 1 ? 'RECETA: DESBLOQUEAR' : 'MEJORAR A RANGO ' + U.roman(nr) + ' (+8 % daño)', DET.x + 14, 392, 12, '#ffe9a0', 'left');
      var rec = L.recipe(id, nr);
      ok = costRow(c, { pf: 0, parts: rec.parts, brasas: rec.brasas }, DET.x + 12, 416);
    } else G.txt(c, 'RANGO MÁXIMO ALCANZADO', DET.x + 14, 400, 13, '#ffd24a', 'left');
    U.button(c, R_FORGE, nr === 1 ? 'FORJAR' : 'MEJORAR', { size: 18, off: !nr || !ok, color: '#2a8a4a', hot: '#3aba66', border: '#9dffb4', sub: nr ? '[F]' : 'máx.' });
    G.txt(c, 'Flechas: elegir  -  F: forjar  -  Q/E: pestaña  -  Esc: salir', 14, 526, 10, '#6f6480', 'left');
  }
})();
