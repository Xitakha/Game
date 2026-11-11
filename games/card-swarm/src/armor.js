/* armor.js - Lógica de la Armera Carapa (DESIGN-v8-herrero.md C): DEF, reducción con curva suave y tope global, equipar, fabricar, refuerzos, bonos de set, zoneDmg y perillas por URL.
   Guardado: Save.data.armor { owned: { pieceId: refuerzo 0-3 }, equipped: [yelmo, peto, grebas, talismán], seen, stats { blocked, crafts }, ped }.
   Perillas: ?arm=0 (apaga armadura, zoneDmg y BRASAS_MIN nuevo: simulación como antes) ?armk=120 ?armcap=0.45 ?zdmg=1,1.1,1.18,1.26,1.34,1.44 (por bioma; activa todos) ?zdmgall=1 (valores del doc en todos los biomas)
   ?armset=esquila:1[,carcelero:2] (equipa ese set con ese refuerzo, solo en memoria) ?armtier=1&armref=1 ?armcost=1 ?armhp=1 ?smith=1 (Carapa desbloqueada) ?give=horn:3,carnero:2 */
(function () {
  'use strict';
  var G = window.G, D = G.ArmorData, A = G.Armor = {}, q = location.search;
  function qnum(name, def) { var m = new RegExp('[?&]' + name + '=(-?[\\d.]+)').exec(q); return m ? parseFloat(m[1]) : def; }
  A.OFF = qnum('arm', 1) === 0;
  A.K = qnum('armk', 120); A.CAP = qnum('armcap', 0.45); A.COSTMUL = qnum('armcost', 1); A.HPMUL = qnum('armhp', 1);
  A.DMGMUL = qnum('armdmg', 1);
  var zq = /[?&]zdmg=([\d.,]+)/.exec(q), ZALL = qnum('zdmgall', 0) > 0;
  var ZT = { bosque: 1, cripta: 1.1, asfodelo: 1.18, tundra: 1.26, panal: 1.34, crater: 1.44 };
  if (zq) { var za = zq[1].split(','); ['bosque', 'cripta', 'asfodelo', 'tundra', 'panal', 'crater'].forEach(function (b, i) { if (za[i] != null && za[i] !== '') ZT[b] = parseFloat(za[i]); }); }
  var ZON = (zq || ZALL) ? { bosque: 1, cripta: 1, asfodelo: 1, tundra: 1, panal: 1, crater: 1 } : { bosque: 1, cripta: 1 };   // MVP: zoneDmg solo en Bosque y Cripta (el resto con perilla)
  A.zoneOn = function (b) { return (zq || ZALL) ? true : b === 'bosque' || b === 'cripta'; };
  A.zoneTable = ZT;
  function SV() { return G.Save.data; }
  var dirty = true, M = null, ovr = null;

  // ---- override por URL (bots): ?armset=esquila:1 | ?armtier=1&armref=1
  (function () {
    var m = /[?&]armset=([\w:,]+)/.exec(q), t = qnum('armtier', -1), eq = [null, null, null, null], ref = {}, any = false;
    function put(sid, n) { D.ofSet(sid).forEach(function (p) { eq[p.slot] = p.id; ref[p.id] = n; any = true; }); }
    if (m) m[1].split(',').forEach(function (kv) { var a = kv.split(':'); if (D.SETS[a[0]]) put(a[0], parseInt(a[1], 10) || 0); });
    else if (t >= 0) D.SET_ORDER.forEach(function (sid) { if (D.SETS[sid].tier === t) put(sid, qnum('armref', 1)); });
    if (any) ovr = { eq: eq, ref: ref };
  })();

  A.smithOn = function () { var S = SV(); return !!((S.bossKills && S.bossKills.pastor > 0) || (S.flags && S.flags.smithMet) || /[?&]smith=1/.test(q)); };
  A.data = function () { return SV().armor; };
  A.ref = function (id) { if (ovr && ovr.ref[id] != null) return ovr.ref[id]; var o = SV().armor.owned; return o[id] == null ? -1 : o[id]; };   // -1 = no fabricada
  A.owned = function (id) { return A.ref(id) >= 0; };
  A.eq = function () { return ovr ? ovr.eq : SV().armor.equipped; };
  A.dirty = function () { dirty = true; };
  A.maxRef = function (p) { return D.SETS[p.set].tier === 0 ? 1 : 3; };

  // ---- cálculo de estadísticas
  A.calc = function (eq, refOf) {
    var r = { def: 0, hp: 0, apl: 0, ims: 0, resP: {}, resS: {}, dmg: {}, sets: {}, set4: {}, n: 0, any: false, tiers: 0 }, i, id, p, s, n, mul, t;
    for (i = 0; i < 4; i++) {
      id = eq[i]; p = id && D.BY[id]; if (!p) continue;
      n = refOf(id); if (n < 0) continue;
      s = D.SETS[p.set]; t = s.tier; mul = 1 + D.REF * n; r.n++; r.any = true; r.tiers = Math.max(r.tiers, t);
      r.def += D.DEF[t] * D.SLOT_DEF[p.slot] * mul;
      if (p.slot === 0) r.hp += D.HP[t] * mul * A.HPMUL;
      else if (p.slot === 1) r.resP[s.fam] = (r.resP[s.fam] || 0) + D.PETO[t] * mul;
      else if (p.slot === 2) { r.apl += D.APL[t] * mul; r.ims += D.IMS[t] * mul; }
      else { if (p.hp) r.hp += p.hp * mul * A.HPMUL; else if (s.tag !== 'neutral') r.dmg[s.tag] = (r.dmg[s.tag] || 0) + D.TAL[t] * mul; }
      r.sets[s.id] = (r.sets[s.id] || 0) + 1;
    }
    for (var sid in r.sets) {
      s = D.SETS[sid];
      if (r.sets[sid] >= 2) { if (s.b2.hp) r.hp += s.b2.hp * A.HPMUL; if (s.b2.dmg) r.dmg[s.tag] = (r.dmg[s.tag] || 0) + s.b2.dmg; if (s.b2.res) r.resS[s.fam] = (r.resS[s.fam] || 0) + s.b2.res; }
      if (r.sets[sid] >= 4 && s.b4) r.set4[s.b4] = true;
    }
    r.res = {}; ['melee', 'ranged', 'blast', 'big'].forEach(function (f) { var v = Math.min(D.CAP.res, (r.resP[f] || 0) + (r.resS[f] || 0)); if (v > 0) r.res[f] = v; });
    for (var tg in r.dmg) r.dmg[tg] = Math.min(D.CAP.dmg, r.dmg[tg]) * A.DMGMUL;
    r.hp = Math.round(Math.min(D.CAP.hp, r.hp)); r.apl = Math.min(D.CAP.apl, r.apl); r.ims = Math.min(D.CAP.ims, Math.round(r.ims));
    r.rd = r.def / (r.def + A.K);
    return r;
  };
  A.get = function () {
    if (dirty || !M) { M = A.calc(A.eq(), A.ref); dirty = false; }
    return M;
  };
  A.hp = function () { return A.OFF ? 0 : A.get().hp; };
  A.apl = function () { return A.OFF ? 0 : A.get().apl; };
  A.ims = function () { return A.OFF ? 0 : A.get().ims; };
  A.dmgMul = function (tag) { if (A.OFF) return 1; var v = A.get().dmg[tag]; return v ? 1 + v : 1; };
  A.zone = function () { if (A.OFF) return 1; var b = G.curBiome || 'bosque'; return A.zoneOn(b) ? (ZT[b] || 1) : 1; };
  A.engaged = function () { if (A.OFF) return false; var m = A.get(); return m.any || A.zone() !== 1; };
  // multiplicador de daño recibido de una familia con el equipo dado (para la UI y la fórmula): tope global 45 %
  A.mult = function (m, fam, bast, plato) {
    var rdf = 1 - (1 - m.rd) * (1 - (m.res[fam] || 0));
    return Math.max(1 - A.CAP, (1 - rdf) * (bast ? 0.9 : 1) * (1 - (plato || 0)));
  };

  // ---- estado de la expedición
  A.beginRun = function () { A.run = { lanaAt: -1e9, grilAt: -1e9, blocked: 0, raw: 0 }; };
  A.beginRun();
  // Devuelve el daño final (con zoneDmg, armadura, Bastión, platos y Lana gruesa). Solo se llama si A.engaged()
  A.reduce = function (dmg, src, soft) {
    var P = G.Player, fam = P.family(src), m = A.get(), R = A.run, raw;
    dmg *= A.zone(); raw = dmg;
    var rs = G.runBuff && G.runBuff.fx && G.runBuff.fx.res;
    dmg *= A.mult(m, fam, G.Tree.fx.bastion, rs && rs[fam] ? rs[fam] : 0);
    if (m.set4.lana && !soft && G.time - R.lanaAt >= 25000) { R.lanaAt = G.time; dmg *= 0.5; try { G.fx.num(G.player.x, G.player.y - 30, 'LANA', '#d8e0ec', true); } catch (e) { /* fx */ } }
    R.raw += raw; R.blocked += raw - dmg;
    var red = raw > 0 ? 1 - dmg / raw : 0; if (red >= 0.2 && !soft) A.snd('hit', red);
    return Math.max(1, dmg);
  };
  A.onHit = function (p, soft) {
    var m = A.get(), R = A.run;
    if (m.set4.grilletes && !soft && G.time - R.grilAt >= 6000) { R.grilAt = G.time; try { G.Combat.boom(p.x, p.y, 70, 20, 'fire', { kb: 60 }); } catch (e) { /* combate */ } }
  };
  A.endRun = function () {
    var S = SV().armor, R = A.run; if (!R) return;
    S.stats.blocked = (S.stats.blocked || 0) + Math.round(R.blocked);
  };
  A.snd = function (t, a, pitch) { try { if (G.Snd && G.Snd.armor) G.Snd.armor(t, a, pitch); } catch (e) { /* audio opcional */ } };

  // ---- materiales: trofeos / insignias gastables (S.trophies / S.insignias = saldo; *Ever = acumulado para Ruta, logros y Archivo)
  A.have = function (kind, id) { var S = SV(); return ((kind === 'tro' ? S.trophies : S.insignias) || {})[id] || 0; };
  A.haveAny = function (kind, ids) { return ids.reduce(function (n, id) { return n + A.have(kind, id); }, 0); };
  A.itemName = function (kind, id) { try { return kind === 'tro' ? G.Boss.TROPHY[id].name : G.Minis.D[id].ins.name; } catch (e) { return id; } };
  // Coste de fabricar (toRef = 0) o de reforzar a toRef (1..3): { parts, brasas, items: [{ kind, ids, n }], rare }
  A.cost = function (p, toRef) {
    var s = D.SETS[p.set], u = D.COST[s.tier], w = D.SLOT_COST[p.slot], cm = A.COSTMUL, L = G.Loot, parts = {}, items = [], rc = toRef > 0 ? D.REF_COST[toRef] : null;
    var pm = rc ? rc.parts : 1;
    parts[p.main] = Math.max(1, Math.ceil(u.main * (L.TREE_PART_MUL[s.tag] || 1) * w * cm * pm));
    if (p.sec) parts[p.sec] = (parts[p.sec] || 0) + Math.max(1, Math.ceil(u.sec * w * cm * pm));
    var brasas = Math.round(u.brasas * w * cm * (rc ? rc.brasas : 1)), rare = 0;
    if (s.tier > 0) {
      if (!rc) { if (p.slot === 3) s.mins.forEach(function (m) { items.push({ kind: 'ins', ids: [m], n: 1 }); }); else items.push({ kind: 'tro', ids: [p.tro], n: 1 }); }
      else items.push(p.slot === 3 ? { kind: 'ins', ids: s.mins, n: rc.tro } : { kind: 'tro', ids: s.tros, n: rc.tro });
      if (rc) rare = rc.rare; else rare = u.rare;
    }
    if (rare) parts.rare = rare;
    return { parts: parts, brasas: brasas, items: items };
  };
  A.itemsOK = function (items) { return items.every(function (it) { return A.haveAny(it.kind, it.ids) >= it.n; }); };
  A.costOK = function (c) {
    var S = SV(); if (S.brasas < c.brasas) return false;
    for (var k in c.parts) if ((S.parts[k] || 0) < c.parts[k]) return false;
    return A.itemsOK(c.items);
  };
  function pay(c) {
    var S = SV(); S.brasas -= c.brasas;
    for (var k in c.parts) S.parts[k] -= c.parts[k];
    c.items.forEach(function (it) {
      var left = it.n, ids = it.ids.slice().sort(function (a, b) { return A.have(it.kind, b) - A.have(it.kind, a); }), bag = it.kind === 'tro' ? S.trophies : S.insignias;
      ids.forEach(function (id) { var t = Math.min(left, bag[id] || 0); bag[id] = (bag[id] || 0) - t; left -= t; });
    });
  }
  // ---- requisitos y estado de una pieza
  A.unlockedSet = function (sid) { var s = D.SETS[sid]; return !s.boss ? A.smithOn() : ((SV().bossKills[s.boss] || 0) > 0); };
  A.refReq = function (p, n) {   // por qué no se puede reforzar a n ('' = se puede)
    var s = D.SETS[p.set], S = SV();
    if (n > A.maxRef(p)) return 'Refuerzo máximo.';
    if (n >= 2) {
      if (!G.Tree.owned(n === 2 ? 'R2' : 'R3')) return 'Grum debe templar el metal: Rango de forja ' + (n === 2 ? 'II' : 'III') + '.';
      var pw = (S.pelWins[s.boss] || {})[D.PEL_REQ[n]] || 0;
      if (!pw) return 'Vence a ' + (G.Boss.DEFS[s.boss] ? G.Boss.DEFS[s.boss].name : s.boss) + ' en Peligro ' + G.Boss.ROMAN[D.PEL_REQ[n]] + '.';
    }
    return '';
  };
  A.craftReq = function (p) { var s = D.SETS[p.set]; return A.unlockedSet(p.set) ? '' : 'Vence a ' + (G.Boss.DEFS[s.boss] ? G.Boss.DEFS[s.boss].name : s.boss) + '.'; };
  A.craft = function (id) {
    var p = D.BY[id], S = SV(); if (!p || A.owned(id) || A.craftReq(p)) return false;
    var c = A.cost(p, 0); if (!A.costOK(c)) { A.snd('deny'); return false; }
    pay(c); S.armor.owned[id] = 0; S.armor.stats.crafts++;
    if (!S.armor.equipped[p.slot]) S.armor.equipped[p.slot] = id;   // el primer hueco se rellena solo
    S.armor.seen[p.set] = 1; A.dirty(); G.Save.save();
    A.snd(D.SETS[p.set].tier === 0 ? 'stitch' : 'craft'); try { G.Aldea.onCrafted(); } catch (e) { /* aldea */ }
    try { G.Ach.check(); } catch (e2) { /* logros */ }
    return true;
  };
  A.upgrade = function (id) {
    var p = D.BY[id], S = SV(), n = A.ref(id) + 1; if (!p || n < 1 || A.refReq(p, n)) return false;
    var c = A.cost(p, n); if (!A.costOK(c)) { A.snd('deny'); return false; }
    pay(c); S.armor.owned[id] = n; A.dirty(); G.Save.save(); A.snd('upgrade', n); try { G.Aldea.onCrafted(true); } catch (e) { /* aldea */ }
    try { G.Ach.check(); } catch (e2) { /* logros */ }
    return true;
  };
  var SND_SLOT = ['metal', 'metal', 'leather', 'charm'];
  A.equip = function (id) {
    var p = D.BY[id], S = SV(); if (!p || !A.owned(id)) return false;
    var before = A.get().sets, b2 = {}, b4 = {}; Object.keys(before).forEach(function (k) { b2[k] = before[k] >= 2; b4[k] = before[k] >= 4; });
    S.armor.equipped[p.slot] = id; A.dirty(); G.Save.save();
    var af = A.get().sets, ns = af[p.set] || 0; A.snd('equip', D.SETS[p.set].tier === 0 ? 'leather' : SND_SLOT[p.slot]);
    if (ns >= 4 && !b4[p.set] && D.SETS[p.set].b4) A.snd('set4'); else if (ns >= 2 && !b2[p.set]) A.snd('set2');
    try { G.Ach.check(); } catch (e) { /* logros */ }
    return true;
  };
  A.unequip = function (slot) { SV().armor.equipped[slot] = null; A.dirty(); G.Save.save(); A.snd('unequip', SND_SLOT[slot]); };
  // Mayor DEF por slot entre lo fabricado (empate: el de mayor tier)
  A.autoEquip = function () {
    var S = SV();
    for (var sl = 0; sl < 4; sl++) {
      var best = null, bv = -1;
      D.ofSlot(sl).forEach(function (p) { if (S.armor.owned[p.id] == null) return; var v = D.DEF[D.SETS[p.set].tier] * (1 + D.REF * S.armor.owned[p.id]); if (v > bv) { bv = v; best = p.id; } });
      S.armor.equipped[sl] = best;
    }
    A.dirty(); G.Save.save(); A.snd('equip', 'metal');
  };
  A.setCount = function (sid) { return A.get().sets[sid] || 0; };
  A.equippedCount = function () { return A.eq().filter(function (x) { return x && A.owned(x); }).length; };
  A.readyCount = function () {
    var n = 0; D.PIECES.forEach(function (p) {
      if (A.owned(p.id)) { var nx = A.ref(p.id) + 1; if (nx <= A.maxRef(p) && !A.refReq(p, nx) && A.costOK(A.cost(p, nx))) n++; }
      else if (!A.craftReq(p) && A.costOK(A.cost(p, 0))) n++;
    }); return n;
  };
  A.newSets = function () { return D.SET_ORDER.filter(function (sid) { return A.unlockedSet(sid) && !SV().armor.seen[sid]; }).length; };
  A.recDef = function (b) { return D.REC_DEF[b] || 0; };
  // Regalo de bienvenida (migración y primera visita): set Aldeano + el Peto de cada jefe vencido; se equipa lo mejor
  A.gift = function () {
    var S = SV(), a = S.armor; if (S.flags.smithGift) return;
    D.ofSet('aldeano').forEach(function (p) { if (a.owned[p.id] == null) a.owned[p.id] = 0; });
    D.SET_ORDER.forEach(function (sid) { var s = D.SETS[sid]; if (s.boss && (S.bossKills[s.boss] || 0) > 0) { var pe = D.peto(sid); if (pe && a.owned[pe.id] == null) { a.owned[pe.id] = 0; a.seen[sid] = 0; } } });
    S.flags.smithGift = 1; A.autoEquip(); A.snd('equip', 'leather');
  };

  // ---- pedidos de Carapa (misiones mínimas): condición evaluada sobre el guardado + banderas de expedición
  A.PED = [
    { id: 'p1', name: 'Tomar medidas', desc: 'Fabrica 1 pieza.', ok: function (S) { return S.armor.stats.crafts >= 1; }, reward: { brasas: 60, parts: { thread: 8 } } },
    { id: 'p2', name: 'Costura doble', desc: 'Lleva 4 piezas del mismo set equipadas.', ok: function () { var s = A.get().sets; return Object.keys(s).some(function (k) { return s[k] >= 4; }); }, reward: { brasas: 120, parts: { feather: 6 } } },
    { id: 'p3', name: 'Mosaico', desc: 'Lleva piezas de 3 sets distintos a la vez.', ok: function () { return Object.keys(A.get().sets).length >= 3; }, reward: { brasas: 150, parts: { plate: 6 } } },
    { id: 'p4', name: 'Refuerzo', desc: 'Refuerza una pieza a +1.', ok: function (S) { return Object.keys(S.armor.owned).some(function (k) { return S.armor.owned[k] >= 1; }); }, reward: { brasas: 100, parts: { thread: 10 } } },
    { id: 'p5', name: 'Sin rasguños', desc: 'Gana una expedición sin recibir daño llevando armadura de tier 2.', ok: function (S) { return !!S.flags.arm_clean; }, reward: { brasas: 200, parts: { rare: 1 } } },
    { id: 'p6', name: 'Cazador de insignias', desc: 'Consigue 2 Insignias de minijefe en una salida.', ok: function (S) { return !!S.flags.arm_ins2; }, reward: { brasas: 180, parts: { rare: 1 } } },
    { id: 'p7', name: 'A pelo', desc: 'Vence a un jefe en Peligro II sin armadura equipada.', ok: function (S) { return !!S.flags.arm_bare; }, reward: { brasas: 250, parts: { rare: 1 } } }
  ];
  A.pedReady = function (d) { var S = SV(); return !S.armor.ped[d.id] && !!d.ok(S); };
  A.pedReadyCount = function () { return A.PED.filter(A.pedReady).length; };
  A.pedClaim = function (id) {
    var d = A.PED.filter(function (x) { return x.id === id; })[0], S = SV(); if (!d || !A.pedReady(d)) return false;
    S.armor.ped[id] = 1; S.brasas += d.reward.brasas; for (var k in d.reward.parts) G.Save.add(k, d.reward.parts[k]); G.Save.save(); A.snd('upgrade', 1); return true;
  };
  A.rewardText = function (d) { return d.reward.brasas + ' Brasas' + Object.keys(d.reward.parts).map(function (k) { return ' + ' + d.reward.parts[k] + ' ' + G.Loot.part(k).short; }).join(''); };
  // Se llama desde Loot.endRun con el resultado de la expedición (flags de pedidos y logros)
  A.onRunEnd = function (r) {
    var S = SV(), eqN = A.equippedCount(), t = A.get().tiers;
    if (r.won && !r.hunt && !r.lastHit && eqN > 0 && t >= 2) S.flags.arm_clean = 1;
    if (r.bossWon && r.peligro >= 2 && eqN === 0 && !A.OFF) S.flags.arm_bare = 1;
    if ((r.ins || 0) >= 2) S.flags.arm_ins2 = 1;
    A.endRun();
  };
  A.init = function () { A.dirty(); };
})();
