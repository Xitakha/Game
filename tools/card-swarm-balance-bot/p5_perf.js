// P5: fps del Panal frente al Bosque (misma sesión, 3 rondas alternadas, horda t=7:15, + 100 enemigos con miel y humo) y calidad Alta / Media / Baja; "antes" = el mismo Bosque servido desde el commit anterior.
// uso: node p5_perf.js [base] [baseAntes]
const { chromium } = require('/opt/node-tools/node_modules/playwright');
const base = process.argv[2] || 'http://localhost:8847', before = process.argv[3] || 'http://localhost:8848';
const launch = () => chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--no-sandbox', '--autoplay-policy=no-user-gesture-required'] });
const FPS = (pg, s) => pg.evaluate(s => new Promise(res => { let n = 0; const t0 = performance.now(); (function f() { n++; if (performance.now() - t0 < s * 1000) requestAnimationFrame(f); else res(n / s); })(); }), s || 4);
(async () => {
  const b = await launch(), res = {}; const avg = a => a.reduce((x, y) => x + y, 0) / a.length;
  const cases = [['bosque', base, 'bosque', 'alta'], ['panal_100_alta', base, 'panal&nobos=1', 'alta'], ['panal_100_media', base, 'panal&nobos=1', 'media'], ['panal_100_baja', base, 'panal&nobos=1', 'baja']];
  for (let r = 0; r < 3; r++) for (const [k, bs, bio, q] of cases) {
    const pg = await b.newPage({ viewport: { width: 960, height: 540 } }); const errs = [];
    pg.on('pageerror', e => errs.push(e.message)); pg.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
    await pg.goto(`${bs}/index.html?reset=1&god=1&t=435&biome=${bio}&q=${q}&hand=spark:3,dart:3,shard:2,dagger:2,fang:2&speed=1&nosw=1`); await pg.waitForTimeout(500);
    await pg.evaluate(() => { G.startGame(); setInterval(() => { G.pendingLevels = 0; if (G.state === 'cards') G.state = 'play'; }, 50); });
    await pg.waitForTimeout(3000);
    if (k.indexOf('panal_100') === 0) await pg.evaluate(() => { const P = G.Panal, p = G.player, T = Object.keys(G.B.fam.panal.use); for (let i = 0; i < 100; i++) { const t = i % 3 ? 'worm' : T[i % T.length], a = Math.random() * 6.28, d = 120 + Math.random() * 260; const e = G.Enemies.spawn(t, p.x + Math.cos(a) * d, p.y + Math.sin(a) * d * 0.7, { spawnT: 0 }); e.hp = e.maxHp = 1e7; e.shootT = e.atkT = e.sumT = e.bashT = e.pulseT = e.spitT = 1e9; } P.setCap(36, 1); for (let i = 0; i < 40; i++) P.openCell(P.cells[Math.floor(Math.random() * P.cells.length)], { tele: 500, life: 1e6 }); for (let i = 0; i < 6; i++) P.smoke(p.x + (i - 3) * 90, p.y + 40); for (let i = 0; i < 10; i++) P.puddle(p.x + (i - 5) * 70, p.y - 60, 36, 1e6); });
    await pg.waitForTimeout(1200);
    const h = await FPS(pg, 4), n = await pg.evaluate(() => G.enemies.length + '/' + G.Q.level);
    (res[k] = res[k] || []).push(+h.toFixed(1)); console.log(k, h.toFixed(1), n, errs.slice(0, 2).join('|')); await pg.close();
  }
  console.log('RESUMEN fps (media de 3 rondas): ' + Object.keys(res).map(k => k + ' ' + avg(res[k]).toFixed(1)).join(' | '));
  await b.close();
})();
