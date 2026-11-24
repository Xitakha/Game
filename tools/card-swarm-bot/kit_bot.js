// Bot del reto diario con kit (DESIGN-v10-retencion.md 1.10.6, calibración de kits). Rápido y REPRODUCIBLE: corre por pasos (?speed=0, G.step()) con la misma
// política que play_bot.js (esquiva por repulsión, recoge gemas sin peligro cerca, prioriza fusiones, AUTO para los poderes), pero decidida por tick de mundo
// (cada 5 ticks = 83 ms, como el setInterval de 80 ms de play_bot) y no por reloj real: misma celda + misma semilla = misma partida, bit a bit.
// Uso:
//   python3 tools/serve.py card-swarm 8891 &     (cerrar por PID)
//   KIT=fragua BIOME=asfodelo PEL=3 MUT=veloz,sincor N=48 SEED=1 Q=alta PAR=4 node tools/card-swarm-bot/kit_bot.js [base=http://localhost:8891]
// Variables: KIT=<id de G.Kit.KITS | all> (varios con comas), BIOME=<bosque|cripta|asfodelo|tundra|panal | all> (varios con comas), PEL=2|3|4 (varios con comas),
//   MUT= (vacío = sin mutadores; ids de G.Daily.MUT separados por '+', varias celdas separadas por comas, p. ej. MUT=,veloz,sincor+cristal), N= partidas por celda,
//   SEED= primera semilla (la partida i usa el i-ésimo día con ese bioma desde el día 20000+SEED: fija la semilla de la simulación y las 2 etiquetas de acompañamiento),
//   Q=alta|media|baja (perfil G.D, ?dq=), EXTRA='&k=v' (perillas por URL), OUT=archivo.csv (añade filas), PAR=4 partidas a la vez, DAILY=1 (reglas reales del día: sin forzar
//   Peligro ni mutadores; SEED= es el primer día y N días seguidos; KIT y BIOME se ignoran salvo KIT=auto, el de la semana).
//   REACT= ticks entre decisiones de movimiento (5 = bot hábil, 83 ms; 19 = bot torpe, lo que hace play_bot.js a speed=4 con su setInterval de 80 ms reales).
// Salida: una línea por partida y un resumen por celda con victoria (Oro), Bronce (llega al jefe), Plata, intervalo de Wilson al 95 %, tiempo de muerte y puntuación.
const { launch } = require('../lib/browser.js');
const fs = require('fs');
const base = process.argv[2] || 'http://localhost:8891';
const env = process.env, PAR = +env.PAR || 4, N = +env.N || 8, SEED = env.SEED != null ? +env.SEED : 1, Q = env.Q || 'alta', EXTRA = env.EXTRA || '', OUT = env.OUT || '', DAILY = env.DAILY === '1', REACT = +env.REACT || 5;
const ALLK = ['fragua', 'ventisca', 'pantano', 'carmesi', 'lana', 'tempestad', 'alquimia', 'hogar'], ALLB = ['bosque', 'cripta', 'asfodelo', 'tundra', 'panal'];
const list = (v, all, def) => (v == null ? def : v === 'all' ? all : v.split(','));
const KITS = list(env.KIT, ALLK, ['fragua']), BIOMES = list(env.BIOME, ALLB, ['bosque']), PELS = list(env.PEL, null, ['3']).map(Number), MUTS = (env.MUT == null ? [''] : env.MUT.split(',')).map(s => s ? s.split('+') : []);

// ---- dentro de la página: reglas forzadas (kit, bioma, Peligro, mutadores) a partir del i-ésimo día con ese bioma; el resto (semilla, acompañamiento, neutrales) es el del día
const SETUP = ([kit, biome, pel, muts, seed, idx, daily]) => {
  const D = G.Daily, K = G.Kit, S = G.Save.data;
  S.runs = 3; S.bossKills = { pastor: 1, karceron: 1, letea: 1, yarlak: 1, melaria: 1, cenizar: 1 };
  const ALL = { unlocked: ['bosque', 'cripta', 'asfodelo', 'tundra', 'panal', 'crater'], kills: S.bossKills };
  let R = null;
  if (daily) { const d = 20000 + seed + idx; R = D.rules(d, ALL, kit === 'auto' ? null : kit); }
  else {
    const wantDos = muts.indexOf('dos') >= 0;
    for (let d = 20000 + seed, k = 0; d < 20000 + seed + 20000; d++) {
      const r = D.rules(d, ALL, kit); if (r.biome !== biome || r.mut.indexOf('dos') >= 0) continue;   // el día base nunca trae 'dos' (su baraja ya estaría recortada)
      if (k++ === idx) { R = r; break; }
    }
    if (wantDos) {   // baraja de "Dos etiquetas": las 2 del kit y los 3 neutrales del día
      const kt = K.get(kit).tags, deck = []; kt.forEach(tg => { K.TAG_CARDS[tg].forEach(id => deck.push(id)); if (K.TAG_PASSIVE[tg]) deck.push(K.TAG_PASSIVE[tg]); });
      R.deck.filter(id => K.NEUTRALS.indexOf(id) >= 0).forEach(id => { if (deck.indexOf(id) < 0) deck.push(id); }); R.deck = deck; R.comp = []; R.tags = kt.slice();
    }
    const w = muts.reduce((a, id) => a + D.mut(id).w, 0);
    R.mut = muts.slice(); R.mutW = w; R.peligro = pel; R.pelRoll = pel; R.novato = false; R.mul = Math.round((1 + 0.2 * (pel - 1) + 0.1 * w) * 100) / 100;
  }
  G.Aldea.open(false);
  G.launchReq = { daily: true, official: false, rules: R }; G.Base.launch();
  window.__R = { day: R.day, biome: R.biome, peligro: R.peligro, mut: R.mut.join('+'), kit: R.kit, comp: R.comp.join('+'), deckN: R.deck.length };
  window.__m = { minHp: G.player.hp, hp0: G.player.maxHp, k: 0, sig: K.get(R.kit).fusion, coldMax: 0, honey: 0 };
  return window.__R;
};
// ---- dentro de la página: avanza hasta `n` ticks con la política del bot; devuelve el estado al final
const ADV = ([n, react]) => {
  const C = G.Cards, F = G.Fusion, inp = G.input, M = window.__m;
  const cardTick = () => {
    const O = C.off; if (!O) { G.state = 'play'; return; }
    if (O.modal) { const bt = O.modal.buttons, i = bt.findIndex(b => /FUSIONAR YA|REEMPLAZAR/.test(b.label)); const f = bt[i >= 0 ? i : 0].fn; O.modal = null; f(); return; }
    if (O.replacing) { let bi = 0, bl = 9; G.player.hand.forEach((h, i) => { if (h && h.lvl < bl) { bl = h.lvl; bi = i; } }); C.replace(bi); return; }
    if (F.handPairs().length) { C.fuseHand(); if (O.modal) { O.modal.buttons[0].fn(); O.modal = null; } return; }
    if (!O.cards || !O.cards.length) { C.skip(); return; }
    let best = 0, bs = -1;
    O.cards.forEach((id, i) => {
      const d = C.def(id); let s = d.type === 'attack' ? 3 : 1.2;
      if (C.newCombos(d.tag).length && d.type === 'attack') s += F.activeCount() < 4 ? 6 - F.activeCount() : 2.5;
      if (C.slotOf(id)) s += 1; if (id === 'heart') s += 2;
      if (s > bs) { bs = s; best = i; }
    });
    C.pick(best);
    if (O.modal) { const f = O.modal.buttons[0].fn; O.modal = null; f(); }
  };
  const move = () => {
    const p = G.player; let ax = 0, ay = 0;
    for (const e of G.enemies) { if (e.dead || e.spawnT > 0) continue; const dx = p.x - e.x, dy = p.y - e.y, d = Math.hypot(dx, dy); if (d < 260 && d > 0) { const w = (e.type === 'boss' ? 2.5 : 1) * (260 - d) / 260 / d; ax += dx * w; ay += dy * w; } }
    for (const q of G.projectiles) { if (q.team === 'p') continue; const dx = p.x - q.x, dy = p.y - q.y, d = Math.hypot(dx, dy); if (d < 140 && d > 0) { ax += dx / d * (140 - d) / 60; ay += dy / d * (140 - d) / 60; } }
    if (Math.hypot(ax, ay) < 0.35) { let bd = 380, bg = null; for (const g of G.gems) { if (g.kind === 'part') continue; const d = Math.hypot(g.x - p.x, g.y - p.y); if (d < bd) { bd = d; bg = g; } } if (bg) { ax += (bg.x - p.x) / bd * 0.8; ay += (bg.y - p.y) / bd * 0.8; } }
    ax += (G.AW / 2 - p.x) * 0.0015; ay += (G.AH / 2 - p.y) * 0.0015;
    if (p.x < 90) ax += 2; if (p.x > G.AW - 90) ax -= 2; if (p.y < 90) ay += 2; if (p.y > G.AH - 90) ay -= 2;
    inp.keys.KeyA = ax < -0.15; inp.keys.KeyD = ax > 0.15; inp.keys.KeyW = ay < -0.15; inp.keys.KeyS = ay > 0.15;
    F.auto = true;
  };
  for (let i = 0, g = 0; i < n && g < n * 3 && G.state !== 'gameover'; g++) {
    if (G.state === 'cards') { cardTick(); if (G.state === 'cards') { G.step(); } continue; }
    if (G.state === 'paused') G.state = 'play';
    if (G.state === 'play' && M.k++ % react === 0) move();
    const t0 = G.time; G.step(); if (G.time !== t0) i++;
    const p = G.player; if (p.hp < M.minHp) M.minHp = p.hp;
    if (G.cold && G.cold.v > M.coldMax) M.coldMax = G.cold.v;
  }
  const st = { st: G.state, t: Math.round(G.runT / 1000), won: !!G.won };
  if (G.state === 'gameover') {
    const r = G.Daily.endRes, sc = r ? r.sc : {}, A = G.Armor && G.Armor.run;
    const sig = (F.stats && F.stats.uses && F.stats.uses[M.sig]) || 0;
    Object.assign(st, { medal: sc.medal, score: sc.total, base: sc.base, bossFrac: Math.round((sc.bossFrac || 0) * 100), parts: sc.parts || 0, kills: G.kills, lvl: G.player.level,
      minHp: Math.round(M.minHp), blk: A && A.raw ? Math.round(100 * A.blocked / A.raw) : 0, sig, fus: (F.stats.fusions || []).map(f => f.id).join('+'), bt: Math.round((sc.bt || 0) / 1000), coldMax: Math.round(M.coldMax) });
  }
  return st;
};

const wilson = (k, n) => { if (!n) return [0, 0]; const z = 1.96, p = k / n, d = 1 + z * z / n, c = (p + z * z / (2 * n)) / d, h = z * Math.sqrt(p * (1 - p) / n + z * z / (4 * n * n)) / d; return [Math.max(0, c - h), Math.min(1, c + h)]; };
const pc = x => Math.round(x * 100);
(async () => {
  const b = await launch({ args: ['--no-sandbox', '--autoplay-policy=no-user-gesture-required'] });
  const cells = [];
  if (DAILY) cells.push({ kit: (env.KIT || 'auto'), biome: '-', pel: 0, muts: [] });
  else for (const kit of KITS) for (const biome of BIOMES) for (const pel of PELS) for (const muts of MUTS) cells.push({ kit, biome, pel, muts });
  const jobs = []; cells.forEach((c, ci) => { for (let i = 0; i < N; i++) jobs.push([ci, i]); });
  const res = cells.map(() => []); let next = 0; const T0 = Date.now();
  if (OUT && !fs.existsSync(OUT)) fs.writeFileSync(OUT, 'kit,biome,pel,mut,q,react,seed,idx,day,comp,won,medal,t,score,base,bossFrac,parts,kills,lvl,minHp,blk,sig,bt,coldMax,fus\n');
  async function one(ci, idx) {
    const c = cells[ci], ctx = await b.newContext({ viewport: { width: 844, height: 390 }, hasTouch: true, isMobile: true }), pg = await ctx.newPage(), errs = [];
    pg.on('pageerror', e => errs.push(e.message)); pg.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
    await pg.goto(`${base}/index.html?dev=1&nosw=1&reset=1&cine=0&speed=0&dq=${Q}${EXTRA}`); await pg.waitForTimeout(400);
    const R = await pg.evaluate(SETUP, [c.kit, c.biome, c.pel, c.muts, SEED, idx, DAILY]);
    let r = null; for (let k = 0; k < 40; k++) { r = await pg.evaluate(ADV, [3000, REACT]); if (r.st === 'gameover') break; }
    await pg.close(); await ctx.close();
    r = Object.assign(r, { R, errs: errs.length, idx }); res[ci].push(r);
    const lab = DAILY ? `${R.kit}/${R.biome}/P${R.peligro}/${R.mut || '-'}` : `${c.kit}/${c.biome}/P${c.pel}/${c.muts.join('+') || '-'}`;
    console.log(`${lab} #${idx} dia=${R.day} acomp=${R.comp}: ${r.won ? 'ORO' : ['part', 'bronce', 'plata', 'oro'][r.medal] || r.st} t=${r.t}s pts=${r.score} jefe=${r.bossFrac}% min=${r.minHp} blk=${r.blk}% firma=${r.sig} errs=${r.errs}`);
    if (OUT) fs.appendFileSync(OUT, [R.kit, R.biome, R.peligro, R.mut || '-', Q, REACT, SEED, idx, R.day, R.comp || '-', r.won ? 1 : 0, r.medal, r.t, r.score, r.base, r.bossFrac, r.parts, r.kills, r.lvl, r.minHp, r.blk, r.sig, r.bt, r.coldMax, r.fus].join(',') + '\n');
  }
  async function worker() { while (next < jobs.length) { const [ci, i] = jobs[next++]; try { await one(ci, i); } catch (e) { console.log('ERR', ci, i, e.message); } } }
  await Promise.all(Array.from({ length: Math.min(PAR, jobs.length) }, worker));
  console.log(`--- ${jobs.length} partidas en ${Math.round((Date.now() - T0) / 1000)} s; Q=${Q} SEED=${SEED} REACT=${REACT}${EXTRA}`);
  console.log('celda | n | Oro (IC95) | Plata+ | Bronce+ | t muerte mediana | pts media | min HP medio | errores');
  cells.forEach((c, ci) => {
    const a = res[ci], n = a.length, w = a.filter(x => x.won).length, s2 = a.filter(x => x.medal >= 2).length, s1 = a.filter(x => x.medal >= 1).length, [lo, hi] = wilson(w, n);
    const dead = a.filter(x => !x.won).map(x => x.t).sort((x, y) => x - y), med = dead.length ? dead[Math.floor(dead.length / 2)] : '-', pts = n ? Math.round(a.reduce((s, x) => s + (x.score || 0), 0) / n) : 0;
    const lab = DAILY ? 'reto real' : `${c.kit}/${c.biome}/P${c.pel}/${c.muts.join('+') || '-'}`;
    console.log(`${lab} | ${n} | ${pc(w / Math.max(1, n))} % (${pc(lo)}-${pc(hi)}) | ${pc(s2 / Math.max(1, n))} % | ${pc(s1 / Math.max(1, n))} % | ${med} | ${pts} | ${n ? Math.round(a.reduce((s, x) => s + x.minHp, 0) / n) : 0} | ${a.reduce((s, x) => s + x.errs, 0)}`);
  });
  await b.close();
})();
