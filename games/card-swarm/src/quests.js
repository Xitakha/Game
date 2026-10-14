/* quests.js - Encargos de Vesper (Fase 2a: 3 fijos). Un solo encargo activo; el progreso persiste entre expediciones y se cuenta en
   Loot.onKill por tipo de enemigo. El director (waves.js) lee Q.target(): ese tipo pesa x2,5 y entra como mucho a los 2:30 virtuales.
   Recompensas: partes + Brasas + PF (la primera vez; al repetir, pfRepeat). Datos de guardado en Save.data.quest. */
(function () {
  'use strict';
  var G = window.G, Q = G.Quests = {};

  Q.WEIGHT = 2.5;            // multiplicador de peso del enemigo objetivo en el director
  Q.EARLY = 150000;          // entrada adelantada (2:30 en tiempo virtual)

  Q.DEFS = [
    { id: 'bombs', name: 'Huele a chamusquina', tutorial: true, target: 'bomb', goal: 20, label: 'Bombas',
      desc: 'Revienta 20 Bombas antes de que lleguen a ti.', rewardParts: { wick: 6 }, brasas: 40, pf: 1, pfRepeat: 1 },
    { id: 'moths', name: 'Caza 40 Polillas gélidas', target: 'moth', goal: 40, label: 'Polillas',
      desc: 'Abate 40 Polillas gélidas. Cuidado con sus orbes.', rewardParts: { frost: 12 }, brasas: 60, pf: 1, pfRepeat: 1 },
    { id: 'colossus', name: 'Mata al Coloso Escudero', target: 'mini_bulwark', goal: 1, label: 'Coloso', elite: true,
      desc: 'Derriba al Coloso Escudero: flanquéalo o usa área.', rewardParts: { plate: 8 }, brasas: 100, pf: 2, pfRepeat: 1 }
  ];
  var BY = {}; Q.DEFS.forEach(function (d) { BY[d.id] = d; });
  Q.def = function (id) { return BY[id]; };

  function S() { return G.Save.data.quest; }
  Q.active = function () { var a = S().active; return a ? BY[a] || null : null; };
  Q.progress = function (id) { return S().prog[id] || 0; };
  Q.times = function (id) { return S().done[id] || 0; };
  Q.isReady = function () { var d = Q.active(); return !!d && Q.progress(d.id) >= d.goal; };
  Q.target = function () { var d = Q.active(); return d && Q.progress(d.id) < d.goal ? d.target : null; };

  Q.accept = function (id) {
    if (!BY[id] || Q.active()) return false;
    S().active = id; G.Save.save(); return true;
  };
  Q.abandon = function () {
    var d = Q.active(); if (!d) return false;
    S().prog[d.id] = 0; S().active = null; G.Save.save(); return true;
  };

  Q.onKill = function (type) {
    var d = Q.active(); if (!d || d.target !== type) return;
    var n = Q.progress(d.id); if (n >= d.goal) return;
    S().prog[d.id] = n + 1;
    if (n + 1 >= d.goal) {
      try { G.Hud.banner('¡ENCARGO LISTO! Vuelve con Vesper', 2400, '#9dffb4'); G.sfx('card_select', { vol: 0.8 }); } catch (e) { /* hud */ }
      G.Save.save();
    }
  };

  // Entrega: devuelve { text } o null
  Q.claim = function () {
    var d = Q.active(); if (!d || !Q.isReady()) return null;
    var Sv = G.Save.data, first = Q.times(d.id) === 0, pf = first ? d.pf : d.pfRepeat, k;
    for (k in d.rewardParts) G.Save.add(k, d.rewardParts[k]);
    Sv.brasas += d.brasas;
    var got = G.Tree.addPF(pf);
    Sv.quest.done[d.id] = Q.times(d.id) + 1; Sv.quest.prog[d.id] = 0; Sv.quest.active = null;
    G.Save.save();
    var parts = Object.keys(d.rewardParts).map(function (p) { return d.rewardParts[p] + ' ' + G.Loot.part(p).short; }).join(', ');
    return { text: parts + ', ' + d.brasas + ' Brasas' + (got ? ', +' + got + ' PF' : ' (PF al tope)'), first: first };
  };

  Q.hudText = function () {
    var d = Q.active(); if (!d) return null;
    return d.label + ' ' + Math.min(d.goal, Q.progress(d.id)) + '/' + d.goal;
  };
  Q.statusLine = function () {
    var d = Q.active(); if (!d) return null;
    return d.name + ': ' + Math.min(d.goal, Q.progress(d.id)) + '/' + d.goal + (Q.isReady() ? '  (¡entrégalo a Vesper!)' : '');
  };
  // Marca "!" sobre Vesper: 'ready' (verde), 'new' (dorado) o null
  Q.mark = function () {
    if (Q.isReady()) return 'ready';
    if (!Q.active()) return 'new';
    return null;
  };
  Q.rewardText = function (d) {
    var parts = Object.keys(d.rewardParts).map(function (p) { return d.rewardParts[p] + ' ' + G.Loot.part(p).short; }).join(' + ');
    return parts + ' + ' + d.brasas + ' Brasas + ' + d.pf + ' PF';
  };
})();
