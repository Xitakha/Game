// Línea base: el MISMO bot de esquiva sobre el juego ORIGINAL (games/card-swarm servido en otro puerto), para comparar con play_bot.js.
//   python3 tools/serve.py card-swarm 8812 &   node tools/card-swarm-fusion-bot/baseline_bot.js <n> [base=http://localhost:8812]
const { chromium } = require('/opt/node-tools/node_modules/playwright');
const N = +process.argv[2] || 3, base = process.argv[3] || 'http://localhost:8812';
const BOT = () => {
  const inp = G.input, C = G.Cards;
  setInterval(() => {
    if (G.state === 'cards' && C.off) {
      const O = C.off; if (O.t < 450) return;
      if (O.replacing) { let bi = 0, bl = 9; G.player.hand.forEach((h, i) => { if (h && h.lvl < bl) { bl = h.lvl; bi = i; } }); C.replace(bi); return; }
      let best = 0, bs = -1;
      O.cards.forEach((id, i) => { const d = C.def(id); let s = d.type === 'attack' ? 3 : 1.2; if (C.newCombos(d.tag).length) s += 3; if (C.slotOf(id)) s += 1.5; if (id === 'heart') s += 2; if (s > bs) { bs = s; best = i; } });
      C.pick(best); return;
    }
    if (G.state !== 'play') return;
    const p = G.player; let ax = 0, ay = 0;
    for (const e of G.enemies) { if (e.dead || e.spawnT > 0) continue; const dx = p.x - e.x, dy = p.y - e.y, d = Math.hypot(dx, dy); if (d < 260 && d > 0) { const w = (e.type === 'boss' ? 2.5 : 1) * (260 - d) / 260 / d; ax += dx * w; ay += dy * w; } }
    for (const q of G.projectiles) { if (q.team === 'p') continue; const dx = p.x - q.x, dy = p.y - q.y, d = Math.hypot(dx, dy); if (d < 140 && d > 0) { ax += dx / d * (140 - d) / 60; ay += dy / d * (140 - d) / 60; } }
    ax += (G.AW / 2 - p.x) * 0.0015; ay += (G.AH / 2 - p.y) * 0.0015;
    if (p.x < 90) ax += 2; if (p.x > G.AW - 90) ax -= 2; if (p.y < 90) ay += 2; if (p.y > G.AH - 90) ay -= 2;
    inp.keys.KeyA = ax < -0.15; inp.keys.KeyD = ax > 0.15; inp.keys.KeyW = ay < -0.15; inp.keys.KeyS = ay > 0.15;
  }, 80);
};
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--no-sandbox', '--autoplay-policy=no-user-gesture-required'] });
  const res = [];
  for (let g = 0; g < N; g++) {
    const ctx = await b.newContext({ viewport: { width: 844, height: 390 }, hasTouch: true, isMobile: true }), pg = await ctx.newPage();
    await pg.goto(`${base}/index.html?nosw=1&reset=1&speed=4`); await pg.waitForTimeout(600);
    await pg.evaluate(() => { G.startGame(); }); await pg.evaluate(BOT);
    const t0 = Date.now(); let r = null;
    while (Date.now() - t0 < 300000) { await pg.waitForTimeout(1000); r = await pg.evaluate(() => ({ st: G.state, t: Math.round(G.runT / 1000), won: G.won, lvl: G.player.level, kills: G.kills, boss: G.Enemies.boss() ? Math.round(G.Enemies.boss().hp / G.Enemies.boss().maxHp * 100) : null })); if (r.st === 'gameover') break; }
    res.push(r); console.log(`base ${g + 1}: ${r.st === 'gameover' ? (r.won ? 'VICTORIA' : 'muerte') : 'sin fin'} t=${r.t}s nv=${r.lvl} kills=${r.kills} boss=${r.boss}`);
    await pg.close(); await ctx.close();
  }
  console.log(`RESUMEN original: victorias ${res.filter(x => x.won).length}/${N}, tiempo medio ${Math.round(res.reduce((a, x) => a + x.t, 0) / N)}s`);
  await b.close();
})();
