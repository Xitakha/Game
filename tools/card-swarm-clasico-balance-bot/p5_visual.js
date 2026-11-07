// P5: capturas de legibilidad del Panal (<= 4, JPEG <= 200 KB) -> studio/docs/capturas-p5-logica/. uso: node p5_visual.js [base] [carpeta]
const { chromium } = require('/opt/node-tools/node_modules/playwright');
const base = process.argv[2] || 'http://localhost:8847', OUT = process.argv[3] || '/tmp/';
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--no-sandbox'] });
  // 1) 100 enemigos con miel, humo y avisos (960x540)
  let pg = await b.newPage({ viewport: { width: 960, height: 540 } }); const errs = [];
  pg.on('pageerror', e => errs.push(e.message)); pg.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
  await pg.goto(`${base}/index.html?reset=1&god=1&biome=panal&nobos=1&env=0&t=400&hand=spark:3,ember:2,shard:2,dart:2&nosw=1`); await pg.waitForTimeout(400);
  await pg.evaluate(() => { G.startGame(); setInterval(() => { G.pendingLevels = 0; if (G.state === 'cards') G.state = 'play'; }, 50); }); await pg.waitForTimeout(1500);
  await pg.evaluate(() => { const P = G.Panal, p = G.player, T = Object.keys(G.B.fam.panal.use); for (let i = 0; i < 100; i++) { const t = i % 3 ? 'worm' : T[i % T.length], a = Math.random() * 6.28, d = 90 + Math.random() * 300; const e = G.Enemies.spawn(t, p.x + Math.cos(a) * d, p.y + Math.sin(a) * d * 0.7, { spawnT: 0 }); e.hp = e.maxHp = 1e7; }
    P.setCap(36, 1); for (let i = 0; i < 14; i++) P.openCell(P.cellAt(p.x + (Math.random() - 0.5) * 700, p.y + (Math.random() - 0.5) * 380), { tele: 300 + i * 150, life: 1e6 }); for (let i = 0; i < 4; i++) P.smoke(p.x + (i - 2) * 110, p.y + 60); P.puddle(p.x + 60, p.y - 80, 36, 1e6); });
  await pg.waitForTimeout(1300);
  await pg.screenshot({ path: OUT + 'p5_100_enemigos.jpg', type: 'jpeg', quality: 60 }); console.log('n', await pg.evaluate(() => G.enemies.length));
  await pg.close();
  // 2) Avispón Real: estocada telegrafiada
  pg = await b.newPage({ viewport: { width: 960, height: 540 } });
  pg.on('pageerror', e => errs.push(e.message)); pg.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
  await pg.goto(`${base}/index.html?reset=1&god=1&biome=panal&nobos=1&env=0&mini=avispon&hand=spark:3,ember:2,shard:2,dart:2&nosw=1`); await pg.waitForTimeout(400);
  await pg.evaluate(() => { G.startGame(); setInterval(() => { G.pendingLevels = 0; if (G.state === 'cards') G.state = 'play'; }, 50); }); await pg.waitForTimeout(2600);
  await pg.evaluate(() => { const e = G.Minis.info(); const m = G.Enemies.minis()[0]; m.x = G.player.x + 250; m.y = G.player.y; G.Minis.force(m, 'estocada'); m.atkT = 0; }); await pg.waitForTimeout(650);
  await pg.screenshot({ path: OUT + 'p5_avispon_estocada.jpg', type: 'jpeg', quality: 60 }); await pg.close();
  // 3) Reina Joven: celdas de miel con aviso
  pg = await b.newPage({ viewport: { width: 960, height: 540 } });
  pg.on('pageerror', e => errs.push(e.message)); pg.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
  await pg.goto(`${base}/index.html?reset=1&god=1&biome=panal&nobos=1&env=0&mini=reina_joven&hand=spark:3,ember:2,shard:2,dart:2&nosw=1`); await pg.waitForTimeout(400);
  await pg.evaluate(() => { G.startGame(); setInterval(() => { G.pendingLevels = 0; if (G.state === 'cards') G.state = 'play'; }, 50); }); await pg.waitForTimeout(2600);
  await pg.evaluate(() => { const m = G.Enemies.minis()[0]; m.x = G.player.x + 200; m.y = G.player.y - 20; G.Minis.force(m, 'miel'); m.atkT = 0; }); await pg.waitForTimeout(800);
  await pg.screenshot({ path: OUT + 'p5_reina_miel.jpg', type: 'jpeg', quality: 60 }); await pg.close();
  // 4) táctil 844x390
  const ctx = await b.newContext({ viewport: { width: 844, height: 390 }, hasTouch: true, isMobile: true, deviceScaleFactor: 1 }); pg = await ctx.newPage();
  pg.on('pageerror', e => errs.push(e.message)); pg.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
  await pg.goto(`${base}/index.html?reset=1&god=1&biome=panal&nobos=1&env=0&t=330&hand=spark:3,ember:2,shard:2,dart:2&nosw=1`); await pg.waitForTimeout(400);
  await pg.evaluate(() => { G.startGame(); setInterval(() => { G.pendingLevels = 0; if (G.state === 'cards') G.state = 'play'; }, 50); }); await pg.waitForTimeout(2500);
  await pg.evaluate(() => { const P = G.Panal, p = G.player; for (let i = 0; i < 5; i++) P.openCell(P.cellAt(p.x + 60 + i * 50, p.y + (i % 2 ? 40 : -40)), { tele: 800, life: 1e6 }); P.smoke(p.x - 70, p.y + 50); });
  await pg.waitForTimeout(1200); await pg.screenshot({ path: OUT + 'p5_tactil_844x390.jpg', type: 'jpeg', quality: 60 });
  console.log(errs.length ? 'ERRORES ' + errs.slice(0, 3).join(' | ') : 'NO ERRORS'); await b.close();
})();
