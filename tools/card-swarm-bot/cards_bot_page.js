// Lado pagina del bot de invariante de la mano (lo inyecta tests.js modo `cards`). Define window.__cardsBot(seed, n) -> { n, stat } | { fail }.
// Un MODELO independiente (cartas id->nivel/starter, poderes, Ceniza, G.Fusion.fused) se actualiza con la regla de CADA accion y tras cada una
// se compara con la mano/poderes reales: un solo hogar por carta/poder, sin duplicados ni perdidas, conteo conservado.
(function () {
  var SL = 5, NS = 4, W = window.__cb = { n: 0, log: [], stat: {}, M: null, rnd: null };
  function mulberry(seed) { var a = seed >>> 0; return function () { a = (a + 0x6D2B79F5) | 0; var t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
  function st(k) { W.stat[k] = (W.stat[k] || 0) + 1; }
  function handNow() { return G.player.hand.map(function (c) { return c && { id: c.id, lvl: c.lvl, starter: !!c.starter }; }); }
  function actNow() { return G.player.actives.map(function (c) { return c && { id: c.id, lvl: c.lvl }; }); }
  var J = JSON.stringify;

  function check(act) {
    var C = G.Cards, F = G.Fusion, M = W.M, h = handNow(), ac = actNow(), bad = [];
    var ids = h.filter(Boolean).map(function (c) { return c.id; }), pid = ac.filter(Boolean).map(function (c) { return c.id; });
    if (h.length !== SL) bad.push('mano != 5 slots');
    if (ac.length !== NS) bad.push('poderes != 4 slots');
    if (new Set(ids).size !== ids.length) bad.push('carta duplicada en la mano: ' + ids);
    if (new Set(G.player.hand.filter(Boolean)).size !== ids.length) bad.push('el mismo objeto de carta en dos slots');
    if (new Set(pid).size !== pid.length) bad.push('poder duplicado: ' + pid);
    if (ids.some(function (i) { return !C.def(i); })) bad.push('carta desconocida en la mano');
    if (pid.some(function (i) { return !F.recipe(i); })) bad.push('poder desconocido');
    if (ids.some(function (i) { return pid.indexOf(i) >= 0; })) bad.push('un id vive en la mano Y en los poderes');
    if (h.some(function (c) { return c && (c.lvl < 1 || c.lvl > 3); })) bad.push('nivel de carta fuera de 1..3');
    if (ac.some(function (c) { return c && (c.lvl < 1 || c.lvl > 2); })) bad.push('nivel de poder fuera de 1..2');
    if (J(h) !== J(M.hand)) bad.push('MANO != modelo\n     real:   ' + J(h) + '\n     modelo: ' + J(M.hand));
    if (J(ac) !== J(M.act)) bad.push('PODERES != modelo\n     real:   ' + J(ac) + '\n     modelo: ' + J(M.act));
    if (G.player.ash !== M.ash) bad.push('Ceniza ' + G.player.ash + ' != modelo ' + M.ash);
    if (F.fused !== M.fused) bad.push('Fusion.fused ' + F.fused + ' != modelo ' + M.fused);
    // conservacion: cartas en juego = cartas entradas - consumidas (el modelo lo lleva); aqui el total debe coincidir con el modelo
    return bad;
  }

  // ---- reglas del modelo (la especificacion, escrita aparte del codigo del juego)
  function mFinish(id, mode) {   // anadir carta a la mano (o reforzar); en la oferta inicial la carta nueva queda marcada como inicial
    var ex = W.M.hand.filter(function (c) { return c && c.id === id; })[0];
    if (ex) { ex.lvl = Math.min(3, ex.lvl + 1); st('reinforce'); return; }
    var i = W.M.hand.indexOf(null); W.M.hand[i] = { id: id, lvl: 1, starter: mode === 'start' }; st('add');
  }
  function mFuse(r, sA, sB, offered, repl) {
    var M = W.M, drop = [];
    if (offered) { if (M.fused > 0) drop.push(sA); }
    else [sA, sB].forEach(function (k) { if (!(M.fused === 0 && M.hand[k].starter)) drop.push(k); });
    if (M.fused === 0) st(offered ? 'fuse1-assisted-offered' : 'fuse1-assisted-hand');
    drop.forEach(function (k) { M.hand[k] = null; });
    var ex = M.act.findIndex(function (x) { return x && x.id === r.id; });
    if (ex >= 0) { M.act[ex].lvl = 2; st('power-lvl2'); }
    else { var at = repl != null ? repl : M.act.indexOf(null); if (repl != null) M.ash += 20; M.act[at] = { id: r.id, lvl: 1 }; }
    M.fused++; st('fuse');
  }
  // lanza fn (el boton que fusiona); con 4 poderes pide reemplazar: elige uno al azar (o cancela) y actualiza el modelo
  function runFuse(r, sA, sB, offered, fn) {
    var C = G.Cards, O = C.off, rnd = W.rnd;
    var need = G.player.actives.indexOf(null) < 0 && !G.player.actives.some(function (x) { return x && x.id === r.id; });
    fn();
    if (!need) { mFuse(r, sA, sB, offered, null); return ''; }
    if (!O.modal) return 'ERR con 4 poderes no hubo ventana de reemplazo';
    var Mo = O.modal, n = Mo.buttons.length, k = rnd() < 0.25 ? n - 1 : Math.floor(rnd() * n); O.modal = null; Mo.buttons[k].fn();
    if (k === n - 1) { st('replace-power-cancel'); return ''; }   // CANCELAR: no se consume nada
    st('replace-power'); mFuse(r, sA, sB, offered, k); return '';
  }
  function afterPickHand(id, mode, O) {   // modelo de "A LA MANO" / pick normal
    var C = G.Cards, had = W.M.hand.some(function (c) { return c && c.id === id; }), free = W.M.hand.indexOf(null) >= 0;
    if (had || free) { mFinish(id, mode); return ''; }
    st('pick-full'); return O.replacing === id ? '' : 'ERR mano llena sin reemplazo pendiente';
  }

  function restart(mode) {   // nueva expedicion: G.reset() -> Cards.reset (ancla) y oferta inicial o de nivel
    var C = G.Cards, rnd = W.rnd, defs = C.defs, anchor = rnd() < 0.5 ? defs[Math.floor(rnd() * defs.length)].id : null;
    G.Save.data.anchors = anchor ? [anchor] : [];
    G.reset(); G.state = 'cards';
    var M = W.M = { hand: [null, null, null, null, null], act: [null, null, null, null], ash: G.player.ash, fused: 0 };
    if (anchor) M.hand[0] = { id: anchor, lvl: 1, starter: true };   // ancla = carta inicial que se conserva en la 1.ª fusion
    G.pendingLevels = mode === 'level' ? 1 : 0; C.open(mode); st('restart-' + mode);
  }

  window.__cardsBot = function (seed, N) {
    var C = G.Cards, F = G.Fusion;
    if (!W.rnd) { W.rnd = mulberry(seed); restart('start'); }
    var rnd = W.rnd, ri = function (n) { return Math.floor(rnd() * n); };
    var kinds = ['pick', 'pick', 'pick', 'pick', 'pick', 'fusehand', 'fusehand', 'discard', 'skip', 'reroll', 'replace', 'replace', 'esc', 'restart'];
    for (var i = 0; i < N; i++) {
      W.n++;
      if (!C.off) { G.state = 'cards'; G.pendingLevels = Math.max(1, G.pendingLevels); C.open('level'); }
      var O = C.off, act = kinds[ri(kinds.length)], res = '', before = J(W.M.hand) + ' | ' + J(W.M.act);
      if (rnd() < 0.3) { G.player.ash = W.M.ash = rnd() < 0.5 ? 0 : 300; }
      if (O.replacing && (act === 'pick' || act === 'fusehand' || act === 'skip' || act === 'reroll')) act = rnd() < 0.6 ? 'replace' : rnd() < 0.5 ? 'discard' : 'esc';   // como la UI real: con un reemplazo pendiente solo se elige slot / se cancela
      try {
        if (act === 'pick') {
          var k = ri(O.cards.length), id = O.cards[k], fo = F.optionsFor(C.def(id).tag);
          C.pick(k);
          if (fo.length) {
            st('pick-fuse-window'); if (!O.modal) { res = 'ERR sin ventana de fusion'; }
            else {
              var Mo = O.modal, n = Mo.buttons.length, nf = Math.min(3, fo.length), j = rnd() < 0.1 ? n - 1 : ri(n);
              O.modal = null;
              if (j < nf) res = runFuse(fo[j].recipe, fo[j].slot, null, id, Mo.buttons[j].fn);
              else if (j === nf) { Mo.buttons[j].fn(); res = afterPickHand(id, O.mode, O); }
              else { Mo.buttons[j].fn(); }
            }
          } else res = afterPickHand(id, O.mode, O);
        } else if (act === 'fusehand') {
          var pairs = F.handPairs(); C.fuseHand();
          if (pairs.length) {
            if (!O.modal) res = 'ERR sin ventana FUSIONAR';
            else { var M2 = O.modal, n2 = M2.buttons.length, j2 = rnd() < 0.1 ? n2 - 1 : ri(n2); O.modal = null; if (j2 < pairs.length) res = runFuse(pairs[j2].recipe, pairs[j2].slot, pairs[j2].slot2, null, M2.buttons[j2].fn); else M2.buttons[j2].fn(); }
          } else if (O.modal) res = 'ERR ventana FUSIONAR sin parejas';
        } else if (act === 'discard') {
          var s = ri(SL);
          if (G.player.hand[s]) { var rp = O.replacing; C.discard(s); st('discard'); W.M.hand[s] = null; W.M.ash += 10; if (rp) { res = afterPickHand(rp, O.mode, O); } }
        } else if (act === 'skip') {
          if (O.mode === 'level') { W.M.ash += G.B.skipAsh; C.skip(); st('skip'); }
        } else if (act === 'reroll') {
          var cost = C.rerollCost(); if (G.player.ash >= cost) { W.M.ash -= cost; st('reroll'); } C.reroll();
        } else if (act === 'replace') {
          if (O.replacing) { var s2 = ri(SL), id2 = O.replacing; if (G.player.hand[s2]) { W.M.hand[s2] = null; W.M.ash += 10; C.replace(s2); mFinish(id2, O.mode); st('replace-card'); } }
        } else if (act === 'esc') { if (O.replacing) { O.replacing = null; st('esc-replacing'); } }
        else if (act === 'restart') { if (rnd() < 0.05) restart(rnd() < 0.3 ? 'start' : 'level'); }
      } catch (e) { res = 'ERR excepcion: ' + e.message; }
      W.log.push(W.n + ':' + act + ':' + res); if (W.log.length > 12) W.log.shift();
      var bad = res.indexOf('ERR') === 0 ? [res] : check(act);
      if (bad.length) return { fail: { n: W.n, act: act, bad: bad, before: before, log: W.log.slice(-6) } };
    }
    return { n: W.n, stat: W.stat };
  };
})();
