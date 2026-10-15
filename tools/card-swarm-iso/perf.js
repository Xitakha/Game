// fps (horda y jefe) en ambas vistas + toggle de Ajustes + táctil 844x390. Uso: node perf.js <puerto>
const { chromium } = require('/opt/node-tools/node_modules/playwright');
const PORT = process.argv[2] || '8766', OUT = '/home/user/Game/studio/docs/capturas-vista-iso/';
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--no-sandbox', '--autoplay-policy=no-user-gesture-required'] });
  const errs = [];
  const fps = (pg, ms) => pg.evaluate((ms) => new Promise(res => { let n = 0; const t0 = performance.now(); (function f() { n++; if (performance.now() - t0 < ms) requestAnimationFrame(f); else res(n / (ms / 1000)); })(); }), ms);
  for (const v of ['flat', 'iso']) {
    const pg = await b.newPage({ viewport: { width: 960, height: 540 } });
    pg.on('console', m => { if (m.type() === 'error') errs.push(v + ' ' + m.text()); });
    pg.on('pageerror', e => errs.push(v + ' PAGEERR ' + e.message));
    await pg.goto(`http://localhost:${PORT}/index.html?view=${v}&reset=1&god=1&t=435&hand=spark:3,dart:3,shard:2,dagger:2,fang:2&speed=1`);
    await pg.evaluate(() => G.startGame());
    await pg.evaluate(() => { setInterval(() => { if (G.state === 'cards' && G.Cards.off) { try { G.Cards.off.mode === 'level' ? G.Cards.skip() : G.Cards.pick(0); } catch (e) { } } }, 100); });
    await pg.waitForTimeout(3000);
    console.log(v, 'horda fps', (await fps(pg, 4000)).toFixed(1), 'enemigos', await pg.evaluate(() => G.enemies.length), 'proy', await pg.evaluate(() => G.projectiles.length));
    for (let i = 0; i < 100; i++) { await pg.waitForTimeout(250); if (await pg.evaluate(() => !!G.Boss.e && G.Boss.e.mode === 'fight')) break; }
    await pg.waitForTimeout(1500);
    console.log(v, 'jefe fps', (await fps(pg, 4000)).toFixed(1), JSON.stringify(await pg.evaluate(() => ({ ent: G.enemies.length, pj: G.projectiles.length, ph: G.Boss.info().phase }))));
    await pg.evaluate(() => { G.Boss.gate && G.Boss.gate(); });
    await pg.waitForTimeout(3500);
    for (const n of ['esporas', 'abanico']) { await pg.evaluate((n) => G.Boss.force(n), n); await pg.waitForTimeout(700); }
    console.log(v, 'jefe fase2+ataque fps', (await fps(pg, 4000)).toFixed(1));
    await pg.close();
  }
  // toggle por Ajustes (aldea) y persistencia
  { const pg = await b.newPage({ viewport: { width: 960, height: 540 } });
    pg.on('pageerror', e => errs.push('toggle PAGEERR ' + e.message));
    await pg.goto(`http://localhost:${PORT}/index.html?reset=1`); await pg.waitForTimeout(800);
    await pg.keyboard.press('Escape'); await pg.waitForTimeout(300);
    await pg.mouse.click(480, 250); await pg.waitForTimeout(300);   // AJUSTES
    await pg.mouse.click(480, 408); await pg.waitForTimeout(300);   // vista inclinada
    console.log('toggle: iso =', await pg.evaluate(() => G.Proj.iso), 'save.view =', await pg.evaluate(() => JSON.parse(localStorage.getItem('swarmhand.save')).settings.view));
    await pg.goto(`http://localhost:${PORT}/index.html`); await pg.waitForTimeout(800);
    console.log('recarga sin ?view: iso =', await pg.evaluate(() => G.Proj.iso));
    await pg.goto(`http://localhost:${PORT}/index.html?view=flat`); await pg.waitForTimeout(800);
    console.log('?view=flat gana al save: iso =', await pg.evaluate(() => G.Proj.iso));
    await pg.close(); }
  // táctil 844x390 en vista inclinada, jefe + horda; joystick arriba = arriba en pantalla
  for (const v of ['flat', 'iso']) {
    const ctx = await b.newContext({ viewport: { width: 844, height: 390 }, hasTouch: true, isMobile: true, deviceScaleFactor: 2 });
    const pg = await ctx.newPage();
    pg.on('console', m => { if (m.type() === 'error') errs.push('touch ' + m.text()); });
    pg.on('pageerror', e => errs.push('touch PAGEERR ' + e.message));
    await pg.goto(`http://localhost:${PORT}/index.html?view=${v}&god=1&t=400&hand=spark:3,dart:3,shard:2,dagger:2,fang:2&speed=1`);
    await pg.waitForTimeout(500); await pg.evaluate(() => G.startGame());
    await pg.evaluate(() => { setInterval(() => { if (G.state === 'cards' && G.Cards.off) { try { G.Cards.off.mode === 'level' ? G.Cards.skip() : G.Cards.pick(0); } catch (e) { } } }, 100); });
    await pg.waitForTimeout(2500);
    const cdp = await ctx.newCDPSession(pg);
    const tp = (type, x, y) => cdp.send('Input.dispatchTouchEvent', { type, touchPoints: type === 'touchEnd' ? [] : [{ x, y, id: 1 }] });
    const p0 = await pg.evaluate(() => ({ x: G.player.x, y: G.player.y }));
    await tp('touchStart', 100, 250); await tp('touchMove', 100, 190);
    await pg.waitForTimeout(900);
    const p1 = await pg.evaluate(() => ({ x: G.player.x, y: G.player.y }));
    await pg.screenshot({ path: OUT + '50_tactil_' + (v === 'iso' ? 'iso' : 'plana') + '.png' });
    await tp('touchEnd');
    console.log('tactil', v, 'arriba mueve y:', Math.round(p0.y), '->', Math.round(p1.y));
    await ctx.close();
  }
  console.log('errores:', JSON.stringify(errs));
  await b.close();
})();
