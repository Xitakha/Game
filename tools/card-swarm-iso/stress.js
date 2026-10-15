const { chromium } = require('/opt/node-tools/node_modules/playwright');
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--no-sandbox'] });
  for (let r = 0; r < 2; r++) for (const v of ['flat', 'iso']) {
    const pg = await b.newPage({ viewport: { width: 960, height: 540 } });
    await pg.goto(`http://localhost:${process.argv[2] || 8766}/index.html?view=${v}&reset=1&god=1&t=200&hand=spark:3,dart:3,shard:2,dagger:2,fang:2`);
    await pg.evaluate(() => G.startGame());
    await pg.evaluate(() => { setInterval(() => { if (G.state === 'cards' && G.Cards.off) { try { G.Cards.off.mode === 'level' ? G.Cards.skip() : G.Cards.pick(0); } catch (e) { } } }, 100); });
    await pg.waitForTimeout(1500);
    await pg.evaluate(() => { const T = ['worm', 'archer', 'boar', 'bomb', 'shield', 'moth']; for (let i = 0; i < 110; i++) { const a = Math.random() * 6.28, d = 60 + Math.random() * 300; G.Enemies.spawn(T[i % 6], G.player.x + Math.cos(a) * d, G.player.y + Math.sin(a) * d * 0.6, {}); } });
    await pg.waitForTimeout(500);
    const f = await pg.evaluate(() => new Promise(res => { let n = 0; const t0 = performance.now(); (function f() { n++; if (performance.now() - t0 < 4000) requestAnimationFrame(f); else res(n / 4); })(); }));
    console.log(v, 'fps', f.toFixed(1), 'enem', await pg.evaluate(() => G.enemies.length), 'proy', await pg.evaluate(() => G.projectiles.length + '/' + G.fx.parts.length));
    await pg.close();
  }
  await b.close();
})();
