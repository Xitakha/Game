// P6: fps de Melaria frente al Pastor (misma sesión, 3 rondas alternadas, horda antes del jefe y pelea) y prueba táctil 844x390 con la pelea de Melaria (joystick CDP, capturas).
// uso: node p4_perf.js fps|mobile [base] [carpeta de capturas]
const { chromium } = require('/opt/node-tools/node_modules/playwright');
const mode = process.argv[2] || 'fps', base = process.argv[3] || 'http://localhost:8793', OUT = process.argv[4] || '/tmp/';
const launch = () => chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--no-sandbox', '--autoplay-policy=no-user-gesture-required'] });
const FPS = (pg, s) => pg.evaluate(s => new Promise(res => { let n = 0; const t0 = performance.now(); (function f() { n++; if (performance.now() - t0 < s * 1000) requestAnimationFrame(f); else res(n / s); })(); }), s || 4);
async function fps(b) {
  const res = { pastor: [], melaria: [], horda: [] };
  for (let r = 0; r < 3; r++) for (const boss of ['pastor', 'melaria']) {
    const pg = await b.newPage({ viewport: { width: 960, height: 540 } }); const errs = [];
    pg.on('pageerror', e => errs.push(e.message)); pg.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
    const bio = boss === 'pastor' ? 'bosque' : 'panal';
    await pg.goto(`${base}/index.html?reset=1&god=1&t=435&biome=${bio}&hand=spark:3,dart:3,shard:2,dagger:2,fang:2&speed=1`); await pg.waitForTimeout(500);
    await pg.evaluate(() => { G.startGame(); setInterval(() => { G.pendingLevels = 0; if (G.state === 'cards') G.state = 'play'; }, 50); });
    await pg.waitForTimeout(3000); const h = await FPS(pg, 4);
    const info = await pg.evaluate(() => G.enemies.length);
    // pelea: salta al jefe (reloj) y mide con el jefe en fase 1-2
    await pg.evaluate(() => { G.runT = G.BOSS_T + 10; }); await pg.waitForTimeout(6500);
    const f = await FPS(pg, 4); const st = await pg.evaluate(() => ({ m: G.Boss.e && G.Boss.e.mode, id: G.Boss.e && G.Boss.e.id, adds: G.Boss.addsAlive(), q: G.Q.level }));
    const cost = await pg.evaluate(() => G.Boss.melariaInfo && G.Boss.e && G.Boss.e.id === 'melaria' ? { ms: +(G.Boss.melariaInfo().drawMs || 0).toFixed(2), max: +(G.Boss.melariaInfo().drawMax || 0).toFixed(1) } : null);
    res[boss].push(+f.toFixed(1)); res.horda.push(+h.toFixed(1)); console.log(boss, 'horda', h.toFixed(1), '(' + info + ' ents) jefe', f.toFixed(1), JSON.stringify(st), cost ? 'dibujo del jefe ' + JSON.stringify(cost) : '', errs.slice(0, 2).join('|'));
    await pg.close();
  }
  const avg = a => a.reduce((x, y) => x + y, 0) / a.length;
  console.log('RESUMEN fps pelea: Pastor', avg(res.pastor).toFixed(1), 'Melaria', avg(res.melaria).toFixed(1), 'diferencia', (avg(res.pastor) - avg(res.melaria)).toFixed(1));
}
async function mobile(b) {
  const ctx = await b.newContext({ viewport: { width: 844, height: 390 }, hasTouch: true, isMobile: true, deviceScaleFactor: 1 }), pg = await ctx.newPage(); const errs = [];
  pg.on('pageerror', e => errs.push(e.message)); pg.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
  await pg.goto(`${base}/index.html?boss=melaria&god=1&reset=1&hand=spark:3,dart:3,shard:2,dagger:2,fang:2&speed=1&phase=2&nointro=1`); await pg.waitForTimeout(1500);
  await pg.evaluate(() => { setInterval(() => { G.pendingLevels = 0; if (G.state === 'cards') G.state = 'play'; }, 50); });
  await pg.waitForTimeout(4200);
  const cdp = await ctx.newCDPSession(pg); const tp = (type, x, y) => cdp.send('Input.dispatchTouchEvent', { type, touchPoints: type === 'touchEnd' ? [] : [{ x, y, id: 1 }] });
  const p0 = await pg.evaluate(() => ({ x: G.player.x, y: G.player.y }));
  await tp('touchStart', 100, 250); await tp('touchMove', 170, 250); await pg.waitForTimeout(1200);
  const p1 = await pg.evaluate(() => ({ x: G.player.x, y: G.player.y })); await tp('touchEnd');
  await pg.evaluate(() => { var e = G.Boss.e; e.atk = null; e.bst = 'idle'; e.mode = 'fight'; G.Boss.force('m_estocada'); }); await pg.waitForTimeout(800);
  await pg.screenshot({ path: OUT + 'p6_m_estocada_844x390.jpg', type: 'jpeg', quality: 70 });
  await pg.evaluate(() => { var e = G.Boss.e; e.atk = null; e.bst = 'idle'; G.Boss.force('m_picado'); }); await pg.waitForTimeout(700);
  await pg.screenshot({ path: OUT + 'p6_m_picado_844x390.jpg', type: 'jpeg', quality: 70 });
  const f = await FPS(pg, 4);
  console.log('joystick', JSON.stringify(p0), '->', JSON.stringify(p1), 'moved', Math.hypot(p1.x - p0.x, p1.y - p0.y).toFixed(0), 'px; fps 844x390:', f.toFixed(1), JSON.stringify(await pg.evaluate(() => G.Boss.info())));
  console.log(errs.length ? 'ERRORES ' + errs.slice(0, 3).join(' | ') : 'NO ERRORS');
  await b.close();
}
(async () => { const b = await launch(); if (mode === 'fps') await fps(b); else await mobile(b); await b.close().catch(() => {}); })();
