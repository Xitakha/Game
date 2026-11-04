// Bot de partidas completas para calibrar el prototipo Fusión (v1: 4 poderes activos). Uso:
//   node tools/card-swarm-fusion-bot/play_bot.js <n_partidas> <cmul> [sinPoderes=0|1] [base=http://localhost:8811] [speed=4] [all=0|1] [extra=&aux=0...]
// Esquiva alejándose de los enemigos (mismo bot de movimiento que baseline_bot.js), elige cartas (prioriza fusiones mientras haya hueco de poder, luego refuerzos),
// usa AUTO (F) para los poderes y reporta supervivencia / victoria / poderes usados. all=1 desbloquea todas las cartas (si no: cuenta vacía, solo las cartas iniciales).
// Con sinPoderes=1 no fusiona nunca (las cartas quedan como infusiones y armas auxiliares).
const { chromium } = require('/opt/node-tools/node_modules/playwright');
const N = +process.argv[2] || 3, CM = process.argv[3] || '', NOACT = process.argv[4] === '1', base = process.argv[5] || 'http://localhost:8811', SPEED = +process.argv[6] || 4;
const ALL = process.argv[7] === '1', EXTRA = process.argv[8] || '';
const BOT = () => {
  const inp = G.input, C = G.Cards, F = G.Fusion;
  window.__log = { picks: [] };
  setInterval(() => {
    if (G.state === 'cards' && C.off) {
      const O = C.off; if (O.t < 450) return;
      if (O.modal) {   // fusionar ya; si pide reemplazar un poder, el de menor Nv (el primero)
        const bt = O.modal.buttons, i = bt.findIndex(b => /FUSIONAR YA|REEMPLAZAR/.test(b.label)); const f = bt[i >= 0 ? i : 0].fn; O.modal = null; f(); return;
      }
      if (O.replacing) { let bi = 0, bl = 9; G.player.hand.forEach((h, i) => { if (h && h.lvl < bl) { bl = h.lvl; bi = i; } }); C.replace(bi); return; }
      if (!window.__noact && F.handPairs().length) { C.fuseHand(); if (O.modal) { O.modal.buttons[0].fn(); O.modal = null; } return; }
      let best = 0, bs = -1;
      O.cards.forEach((id, i) => {
        const d = C.def(id); let s = d.type === 'attack' ? 3 : 1.2;
        if (!window.__noact && C.newCombos(d.tag).length && d.type === 'attack') s += F.activeCount() < 4 ? 6 - F.activeCount() : 2.5;
        if (window.__noact && C.slotOf(id)) s += 1.5; else if (C.slotOf(id)) s += 1;
        if (id === 'heart') s += 2;
        if (window.__noact && d.type === 'attack' && C.hasTag(d.tag)) s += 1;   // sin poderes: mejor repetir etiqueta
        if (s > bs) { bs = s; best = i; }
      });
      window.__log.picks.push(O.cards[best]);
      C.pick(best);
      if (O.modal) { const bt = O.modal.buttons, k = window.__noact ? bt.findIndex(b => /A LA MANO/.test(b.label)) : 0; const f = bt[k >= 0 ? k : 0].fn; O.modal = null; f(); }
      return;
    }
    if (G.state === 'gameover' || G.state !== 'play') return;
    const p = G.player; let ax = 0, ay = 0;
    for (const e of G.enemies) { if (e.dead || e.spawnT > 0) continue; const dx = p.x - e.x, dy = p.y - e.y, d = Math.hypot(dx, dy); if (d < 260 && d > 0) { const w = (e.type === 'boss' ? 2.5 : 1) * (260 - d) / 260 / d; ax += dx * w; ay += dy * w; } }
    for (const q of G.projectiles) { if (q.team === 'p') continue; const dx = p.x - q.x, dy = p.y - q.y, d = Math.hypot(dx, dy); if (d < 140 && d > 0) { ax += dx / d * (140 - d) / 60; ay += dy / d * (140 - d) / 60; } }
    ax += (G.AW / 2 - p.x) * 0.0015; ay += (G.AH / 2 - p.y) * 0.0015;
    if (p.x < 90) ax += 2; if (p.x > G.AW - 90) ax -= 2; if (p.y < 90) ay += 2; if (p.y > G.AH - 90) ay -= 2;
    inp.keys.KeyA = ax < -0.15; inp.keys.KeyD = ax > 0.15; inp.keys.KeyW = ay < -0.15; inp.keys.KeyS = ay > 0.15;
    if (!window.__noact) F.auto = true;
  }, 80);
};
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--no-sandbox', '--autoplay-policy=no-user-gesture-required'] });
  const res = [];
  for (let g = 0; g < N; g++) {
    const ctx = await b.newContext({ viewport: { width: 844, height: 390 }, hasTouch: true, isMobile: true }), pg = await ctx.newPage(); const errs = [];
    pg.on('console', m => { if (m.type() === 'error') errs.push(m.text()); }); pg.on('pageerror', e => errs.push('PAGEERR ' + e.message));
    await pg.goto(`${base}/index.html?nosw=1&reset=1&direct=1&speed=${SPEED}${CM ? '&cmul=' + CM : ''}${ALL ? '&all=1' : ''}${EXTRA}`); await pg.waitForTimeout(500);
    await pg.evaluate(NOACT => { window.__noact = NOACT; }, NOACT);
    await pg.evaluate(BOT);
    const t0 = Date.now(); let r = null;
    while (Date.now() - t0 < 420000) {
      await pg.waitForTimeout(1000);
      r = await pg.evaluate(() => ({ st: G.state, t: Math.round(G.runT / 1000), won: G.won, lvl: G.player.level, kills: G.kills, hp: Math.round(G.player.hp), boss: G.Enemies.boss() ? Math.round(G.Enemies.boss().hp / G.Enemies.boss().maxHp * 100) : null, snap: G.Fusion.snapshot() }));
      if (r.st === 'gameover') break;
    }
    res.push({ ...r, errs: errs.length, errsText: errs.slice(0, 2) });
    console.log(`partida ${g + 1}: ${r.st === 'gameover' ? (r.won ? 'VICTORIA' : 'muerte') : 'sin fin'} t=${r.t}s nv=${r.lvl} kills=${r.kills} bossHp=${r.boss}% fusiones=${JSON.stringify(r.snap.stats.fusions.map(f => f.id + (f.lvl > 1 ? '2' : '') + '@' + f.t))} usos=${JSON.stringify(r.snap.stats.uses)} errs=${errs.length}`);
    await pg.close(); await ctx.close();
  }
  const w = res.filter(x => x.won).length;
  console.log(`RESUMEN cmul=${CM || 'defecto'} sinPoderes=${NOACT} all=${ALL}${EXTRA}: victorias ${w}/${N}, tiempo medio ${Math.round(res.reduce((a, x) => a + x.t, 0) / N)}s, errores ${res.reduce((a, x) => a + x.errs, 0)}`);
  await b.close();
})();
