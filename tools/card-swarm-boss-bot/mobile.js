// uso: node mobile.js [boss=pastor] [puerto=8765]
// prueba táctil 844x390: joystick flotante con touch events + intro con salto por toque + fps durante la pelea
const { chromium } = require('/opt/node-tools/node_modules/playwright');
const BOSS = process.argv[2] || 'pastor', PORT = process.argv[3] || 8765;
const OUT = '/home/user/Game/studio/docs/' + (BOSS === 'pastor' ? 'capturas-jefes-j1-logica/' : 'capturas-jefes-j2-logica/');
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--no-sandbox', '--autoplay-policy=no-user-gesture-required'] });
  const ctx = await b.newContext({ viewport: { width: 844, height: 390 }, hasTouch: true, isMobile: true, deviceScaleFactor: 2 });
  const pg = await ctx.newPage();
  const errs = [];
  pg.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
  pg.on('pageerror', e => errs.push('PAGEERR ' + e.message));
  await pg.goto('http://localhost:' + PORT + '/index.html?boss=' + BOSS + '&god=1&reset=1&hand=spark:3,dart:3,shard:2,dagger:2,fang:2&speed=1&hpcal=3.5');
  await pg.waitForTimeout(1500);
  await pg.screenshot({ path: OUT + 'm1_intro_844x390_' + BOSS + '.png' });
  await pg.waitForTimeout(3200);
  // joystick: toque en la mitad izquierda y arrastre
  const cdp = await ctx.newCDPSession(pg);
  const tp = (type, x, y) => cdp.send('Input.dispatchTouchEvent', { type, touchPoints: type === 'touchEnd' ? [] : [{ x, y, id: 1 }] });
  const p0 = await pg.evaluate(() => ({ x: G.player.x, y: G.player.y }));
  await tp('touchStart', 100, 250); await tp('touchMove', 160, 250);
  await pg.waitForTimeout(1200);
  await pg.screenshot({ path: OUT + 'm2_combate_844x390_' + BOSS + '.png' });
  const p1 = await pg.evaluate(() => ({ x: G.player.x, y: G.player.y }));
  await tp('touchEnd');
  console.log('joystick movio al jugador', JSON.stringify(p0), '->', JSON.stringify(p1));
  // fps: contar frames reales 4 s durante la pelea
  const fps = await pg.evaluate(() => new Promise(res => { let n = 0; const t0 = performance.now(); function f() { n++; if (performance.now() - t0 < 4000) requestAnimationFrame(f); else res(n / 4); } requestAnimationFrame(f); }));
  console.log('fps (844x390, dpr2):', fps.toFixed(1), JSON.stringify(await pg.evaluate(() => G.Boss.info())));
  console.log(errs.join('\n') || 'NO ERRORS');
  await b.close();
})();
