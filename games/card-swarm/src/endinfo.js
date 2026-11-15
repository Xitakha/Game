/* endinfo.js - G.EndInfo: datos de la pantalla de fin (T-F1-04): récord por bioma, objetivos ("TE FALTA POCO") y consejo según el daño recibido.
   Se llama desde Loot.endRun con el resumen ya armado; deja en el resumen: record { prev, now, isNew, counted }, goals [{ id, text, sub, frac }], tip, quit, god.
   Solo lectura de la partida: no toca G.rng ni la simulación. El récord se guarda en Save.data.stats.best[bioma] = { t (s), bossPct (0-100), lvl, kills }. */
(function () {
  'use strict';
  var G = window.G, E = G.EndInfo = {};
  var BIOME = { bosque: 'Bosque', cripta: 'Cripta', asfodelo: 'Asfódelo', tundra: 'Tundra', panal: 'Panal', crater: 'Cráter' };
  var BOSS = { pastor: 'el Pastor', karceron: 'Karceron', letea: 'Letea', yarlak: 'Yarlak', melaria: 'Melaria', cenizar: 'Cenizar' };
  var NEXT = { pastor: ['Cripta', 'Karceron te espera'], karceron: ['Asfódelo', 'Letea te espera'], letea: ['Tundra', 'Yarlak te espera'], yarlak: ['Panal', 'Melaria te espera'], melaria: ['Cráter', 'Cenizar te espera'] };
  E.BIOME = BIOME; E.BOSS = BOSS;
  function mmss(sec) { return G.fmtTime(sec * 1000); }
  function bossName(id) { return BOSS[id] || id; }

  E.fill = function (sm, o) {
    var S = G.Save.data, bs = sm.boss, key = G.curBiome || 'bosque', normal = G.mode === 'run' && !o.hunt && !G.final;
    sm.god = !!G.god;
    var t = Math.round(o.runSecs + (bs && bs.time ? bs.time / 1000 : 0)), prev = (S.stats.best || {})[key] || null;
    var rec = { prev: prev ? prev.t : 0, prevPct: prev ? prev.bossPct : 100, now: t, isNew: false, counted: false };
    if (normal && !G.god && !sm.quit) {
      var pct = bs ? Math.round(Math.max(0, bs.hpFrac) * 100) : 100, b = prev || { t: 0, bossPct: 100, lvl: 0, kills: 0 };
      rec.isNew = !prev ? t > 0 : (t > prev.t || (bs && pct < prev.bossPct));
      S.stats.best = S.stats.best || {};
      S.stats.best[key] = { t: Math.max(b.t, t), bossPct: bs ? Math.min(b.bossPct, pct) : b.bossPct, lvl: Math.max(b.lvl, o.lvl || 0), kills: Math.max(b.kills, G.kills || 0) };
      rec.counted = true; G.Save.save();
    }
    sm.record = rec;
    sm.goals = goals(sm, o, key, normal, rec).slice(0, 3);
    sm.tip = tip(sm);
  };

  function goals(sm, o, key, normal, rec) {
    var S = G.Save.data, bs = sm.boss, out = [], bid = G.bossId || 'pastor', bn = bossName(bid), Q = G.Quests, T = G.Tree, won = !!sm.won;
    function add(id, text, sub, frac) { out.push({ id: id, text: text, sub: sub.length > 44 ? sub.slice(0, 43) + '.' : sub, frac: frac == null ? null : G.clamp(frac, 0, 1) }); }
    var bt = G.BOSS_T / 1000;
    if (won && bs && bs.won && !o.hunt) {   // victoria: el gancho es lo siguiente
      var nx = NEXT[bs.id];
      if (nx && bs.first) add('biome', 'Se abre la ' + nx[0] + ': ' + nx[1], 'Objetivo: prueba la ' + nx[0] + ' (' + bossName(NEXT_BOSS(bs.id)) + ')', null);
      if (bs.unlocked) add('peligro', 'Vence ' + (bid === 'pastor' ? 'al Pastor' : 'a ' + bn) + ' en Peligro ' + G.Boss.ROMAN[bs.unlocked], 'Objetivo: vence ' + (bid === 'pastor' ? 'al Pastor' : 'a ' + bn) + ' en Peligro ' + G.Boss.ROMAN[bs.unlocked], null);
    }
    if (normal && !won && !bs) add('boss', 'Llega al Pastor: aparece a las ' + mmss(bt), 'Objetivo: llega al Pastor (' + mmss(bt) + ')', rec.now / bt);
    if (normal && !won && bs && !bs.won) {
      var best = Math.min(rec.prevPct == null ? 100 : rec.prevPct, Math.round(bs.hpFrac * 100)), lim = Math.max(1, best);
      add('bosspct', 'Deja al Pastor por debajo del ' + lim + ' %', 'Objetivo: deja al Pastor por debajo del ' + lim + ' %', 1 - bs.hpFrac);
    }
    var qa = Q.active && Q.active();
    if (qa && Q.progress(qa.id) < qa.goal) add('quest', 'Encargo: ' + qa.label + ' ' + Q.progress(qa.id) + '/' + qa.goal, 'Objetivo: ' + qa.label + ' ' + Q.progress(qa.id) + '/' + qa.goal, Q.progress(qa.id) / qa.goal);
    var nr = T.nearest && T.nearest();
    if (nr && nr.miss.length <= 2) { var m0 = nr.miss[0]; add('forja', 'Forja: ' + nr.name + ', faltan ' + m0.n + ' ' + m0.label, 'Objetivo: forja ' + nr.name, null); }
    if (won && !out.some(function (g) { return g.id === 'peligro'; }) && G.Save.pelMax(bid) < 5 && (S.bossKills[bid] || 0) > 0) { var np = G.Save.pelMax(bid) + 1; add('peligro', 'Vence ' + (bid === 'pastor' ? 'al Pastor' : 'a ' + bn) + ' en Peligro ' + G.Boss.ROMAN[np], 'Objetivo: vence ' + (bid === 'pastor' ? 'al Pastor' : 'a ' + bn) + ' en Peligro ' + G.Boss.ROMAN[np], null); }
    // respaldo (siempre hay al menos un objetivo)
    var bt0 = (S.stats.best || {})[key];
    if (!out.length || out.length < 1) add('record', bt0 && bt0.t > 0 ? 'Supera tu récord de ' + mmss(bt0.t) : 'Aguanta hasta las ' + mmss(rec.now + 60), bt0 && bt0.t > 0 ? 'Objetivo: supera tu récord de ' + mmss(bt0.t) : 'Objetivo: aguanta hasta las ' + mmss(rec.now + 60), bt0 && bt0.t > 0 ? rec.now / bt0.t : null);
    return out;
  }
  function NEXT_BOSS(id) { return { pastor: 'karceron', karceron: 'letea', letea: 'yarlak', yarlak: 'melaria', melaria: 'cenizar' }[id]; }

  // Consejo de una línea según de dónde vino más daño (L.run.dmgBy, solo memoria)
  function tip(sm) {
    if (sm.won) return null;
    var p = G.player, acts = (p.actives || []).filter(Boolean), unused = acts.filter(function (a) { return !a.uses; })[0];
    if (unused) { var r = G.Fusion.recipe(unused.id); return 'Tenías ' + (r ? r.short : unused.id) + ' sin usar: tócalo en cuanto se cargue.'; }
    var by = (G.Loot.run && G.Loot.run.dmgBy) || {}, top = null, k;
    for (k in by) if (!top || by[k] > by[top]) top = k;
    if (!top) return 'Recoge gemas: cada nivel es una carta más.';
    if (top === 'boss' || /^boss|^mini_/.test(top) || top === 'reina') { var bi = sm.boss; return 'El ' + (bi ? bi.name.replace(/^El |^La /, '') : 'jefe') + ' pega fuerte: mira el suelo, el aviso sale antes del golpe.'; }
    if (/fanner/.test(top)) return 'Te tumbaron los Zarzales: aléjate cuando abran su abanico.';
    if (top === 'archer') return 'Las flechas te dieron: cruza en diagonal, no de frente.';
    if (top === 'bomb') return 'Las bombas explotan al llegar: no las dejes pegarse a ti.';
    return 'Te rodearon: muévete en círculos amplios, no en línea recta.';
  }
  E.tip = tip;
})();
