// CAPTURAS Y MEDIDAS VISUALES DE LA P3 (Tundra): legibilidad con 100 enemigos y telegrafías, y fps con horda + ventisca (Alta / Media / Baja).
// uso: node p3_visual.js shots|fps [base] [outDir]    (base por defecto http://localhost:8793)
const { chromium } = require('/opt/node-tools/node_modules/playwright');
const fs = require('fs');
const mode = process.argv[2] || 'shots', base = process.argv[3] || 'http://localhost:8793', OUT = process.argv[4] || '/tmp/';
const src = fs.readFileSync(__dirname + '/p3_tests.js', 'utf8'), SIM = src.match(/const SIM = `([\s\S]*?)`;/)[1];
const launch = () => chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--no-sandbox', '--autoplay-policy=no-user-gesture-required'] });
async function scene(pg, n) {   // n enemigos de la familia en el campo con avisos activos
  await pg.evaluate(SIM);
  return pg.evaluate(n => {
    __clear(720, 330); G.Tundra.bz.off = true; const types = ['worm', 'worm', 'worm', 'worm', 'archer', 'frostwolf', 'frostwolf', 'boar', 'shield', 'moth', 'sower', 'blinker', 'warlock'];
    for (let i = 0; i < n; i++) {
      const t = types[i % types.length], a = i * 2.399, r = 70 + (i % 9) * 38 + Math.random() * 40;
      const e = G.Enemies.spawn(t, 720 + Math.cos(a) * r * 1.5, 330 + Math.sin(a) * r * 0.9, { spawnT: 0 }); e.sumT = 1e9; e.shootT = 1e9; e.bashT = 1e9; e.cdT = 1e9;
      if (t === 'sower') { e.st = 'crawl'; e.untarget = false; e.rearm = 1e9; }
      if (i % 13 === 5 && i < 60) { e.st = 'aim'; e.t = 300; e.ang = a + 3.14; }
      if (t === 'frostwolf' && i % 2) { e.st = 'howl'; e.t = 500; e.ang = a + 3.14; e.len = 220; }
      if (t === 'boar' && i % 2) { e.st = 'wind'; e.t = 600; e.ang = a + 3.14; }
      if (t === 'shield' && i % 2) { e.st = 'wind'; e.t = 500; e.fa = a + 3.14; }
      if (t === 'moth' && i % 2) { e.st = 'aim'; e.t = 400; e.ang = a + 3.14; e.len = 260; }
      e.spd = 0; e.spdBase = 0;
    }
    G.Tundra.bz.off = false; G.Tundra.bz.force = true; G.speed = 0.00001; return G.enemies.length;
  }, n);
}
(async () => {
  const b = await launch();
  if (mode === 'shots') {
    const pg = await b.newPage({ viewport: { width: 960, height: 540 } }); pg.errs = [];
    pg.on('pageerror', e => pg.errs.push(e.message)); pg.on('console', m => { if (m.type() === 'error') pg.errs.push(m.text()); });
    await pg.goto(`${base}/index.html?reset=1&god=1&dbg=1&biome=tundra&hand=spark:3,dart:3,shard:2,dagger:2,fang:2&t=300`); await pg.waitForTimeout(500); await pg.evaluate(() => G.startGame());
    const n = await scene(pg, 100); await pg.waitForTimeout(500);
    await pg.screenshot({ path: OUT + 'p3_100_enemigos.jpg', type: 'jpeg', quality: 55 });
    console.log('enemigos en escena', n, 'errores', pg.errs.length);
  }
  if (mode === 'fps') {
    const f = ms => (pg) => pg.evaluate(ms => new Promise(res => { let n = 0; const t0 = performance.now(); (function f() { n++; if (performance.now() - t0 < ms) requestAnimationFrame(f); else res(n / (ms / 1000)); })(); }), ms);
    const rows = [];
    for (let r = 0; r < 3; r++) for (const cfg of [['pastor', 'biome=bosque&t=435'], ['tundra-alta', 'biome=tundra&t=435&q=alta&gust=0'], ['tundra-gust', 'biome=tundra&t=435&q=alta&gust=1'], ['tundra-media', 'biome=tundra&t=435&q=media&gust=1'], ['tundra-baja', 'biome=tundra&t=435&q=baja&gust=1'], ['tundra-ice0', 'biome=tundra&t=435&q=alta&gust=1&ice=0&cold=0']]) {
      const ctx = await b.newContext({ viewport: { width: 960, height: 540 } }), pg = await ctx.newPage(); pg.errs = [];
      pg.on('pageerror', e => pg.errs.push(e.message));
      await pg.goto(`${base}/index.html?reset=1&god=1&dbg=1&${cfg[1]}&hand=spark:3,dart:3,shard:2,dagger:2,fang:2&speed=1`); await pg.waitForTimeout(400);
      await pg.evaluate(() => { G.startGame(); setInterval(() => { if (G.state === 'cards' && G.Cards.off) { try { G.Cards.off.mode === 'level' ? G.Cards.skip() : G.Cards.pick(0); } catch (e) { } } }, 100); });
      await pg.waitForTimeout(3000);
      const a = await f(4000)(pg), ent = await pg.evaluate(() => G.enemies.length), c = await f(4000)(pg);
      rows.push({ k: cfg[0], fps: (a + c) / 2, ent, errs: pg.errs.length }); await ctx.close();
    }
    const by = {}; rows.forEach(r => { (by[r.k] = by[r.k] || []).push(r); });
    Object.keys(by).forEach(k => console.log(k.padEnd(14), by[k].map(r => r.fps.toFixed(1)).join(' '), 'media', (by[k].reduce((a, r) => a + r.fps, 0) / by[k].length).toFixed(1), 'enemigos', by[k].map(r => r.ent).join('/'), 'errores', by[k].reduce((a, r) => a + r.errs, 0)));
  }
  await b.close();
})();
