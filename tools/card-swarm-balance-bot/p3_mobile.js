// FLUJO TÁCTIL 844x390 en la TUNDRA (DPR 2, hasTouch/isMobile): expedición con joystick flotante CDP, cartas por toque y deriva en hielo. uso: node p3_mobile.js [base] [capturaDir]
const { chromium } = require('/opt/node-tools/node_modules/playwright');
const base = process.argv[2] || 'http://localhost:8793', OUT = process.argv[3] || '';
let fails = 0; const ok = (c, m) => { if (!c) fails++; console.log((c ? 'OK     ' : 'FALLO  ') + m); };
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--no-sandbox', '--autoplay-policy=no-user-gesture-required'] });
  const ctx = await b.newContext({ viewport: { width: 844, height: 390 }, hasTouch: true, isMobile: true, deviceScaleFactor: 2 });
  const pg = await ctx.newPage(), errs = [];
  pg.on('console', m => { if (m.type() === 'error') errs.push(m.text()); }); pg.on('pageerror', e => errs.push('PAGEERR ' + e.message));
  await pg.goto(`${base}/index.html?reset=1&dbg=1&god=1&len=7&speed=6&nosw=1&biome=tundra&nobos=1&patch=1&t=60`); await pg.waitForTimeout(900);
  const cdp = await ctx.newCDPSession(pg);
  const scr = (gx, gy) => pg.evaluate(([gx, gy]) => { const r = document.getElementById('game').getBoundingClientRect(); return { x: r.left + gx * r.width / 960, y: r.top + gy * r.height / 540 }; }, [gx, gy]);
  const tp = (type, x, y) => cdp.send('Input.dispatchTouchEvent', { type, touchPoints: type === 'touchEnd' ? [] : [{ x, y, id: 1 }] });
  await pg.evaluate(() => { G.startGame(); });
  let st = await pg.evaluate(() => G.state); ok(st === 'play' || st === 'cards', 'expedición en la Tundra desde la URL (' + st + ')');
  ok(await pg.evaluate(() => G.Tundra.on && !!G.B.famOf() && G.Proj.K === 1), 'Tundra con familia y vista plana');
  // 1) deriva: joystick a la derecha 1,5 s, soltar, medir velocidad residual y derrape
  async function wait() { for (let i = 0; i < 30; i++) { if ((await pg.evaluate(() => G.state)) === 'play') return; const r = await pg.evaluate(() => { const O = G.Cards.off, r = G.Cards.offerRect(0); return { x: r.x + r.w / 2, y: r.y + r.h / 2 }; }); const p = await scr(r.x, r.y); await pg.touchscreen.tap(p.x, p.y); await pg.waitForTimeout(400); } }
  await wait();
  await pg.evaluate(() => { G.player.x = 200; G.player.y = 110; G.player.sf = 1; G.enemies.length = 0; G.Tundra.bz.off = true; G.speed = 1; });
  const p0 = await scr(120, 330); await tp('touchStart', p0.x, p0.y); const p1 = await scr(120 + 50, 330); await tp("touchMove", p1.x, p1.y); await pg.waitForTimeout(1000);
  const run = await pg.evaluate(() => ({ vx: Math.round(G.player.vx), j: G.input.joy.active, x: Math.round(G.player.x) }));
  await tp('touchEnd'); const x1 = await pg.evaluate(() => G.player.x); await pg.waitForTimeout(250);
  const mid = await pg.evaluate(() => Math.round(G.player.vx)); await pg.waitForTimeout(1500);
  const x2 = await pg.evaluate(() => G.player.x), drift = Math.round(x2 - x1);
  console.log(JSON.stringify({ run, mid, drift }));
  ok(run.j && run.vx > 150, 'el joystick flotante táctil mueve al jugador en hielo (v ' + run.vx + ' px/s)');
  ok(mid > 20 && drift >= 50 && drift <= 110, `al soltar el pulgar el jugador sigue deslizando (v ${mid} a los 250 ms; derrape total ${drift} px)`);
  // 2) bucle con el joystick en círculo y cartas por toque
  let a = 0, fingers = false, shot = false, t0 = Date.now(), taps = 0;
  await pg.evaluate(() => { G.speed = 6; });
  while (Date.now() - t0 < 60000) {
    const s = await pg.evaluate(() => G.state);
    if (s === 'gameover') break;
    if (s === 'cards') { if (fingers) { await tp('touchEnd'); fingers = false; } const r = await pg.evaluate(() => { const r = G.Cards.offerRect(0), O = G.Cards.off; return { x: r.x + r.w / 2, y: r.y + r.h / 2, replacing: O && O.replacing }; }); const p = await scr(r.x, r.y); await pg.touchscreen.tap(p.x, p.y); taps++; await pg.waitForTimeout(350); if (r.replacing) { const q = await scr(146, 400); await pg.touchscreen.tap(q.x, q.y); } continue; }
    if (s === 'play') {
      if (!fingers) { const p = await scr(120, 330); await tp('touchStart', p.x, p.y); fingers = true; a = 0; }
      a += 0.3; const p = await scr(120 + Math.cos(a) * 50, 330 + Math.sin(a) * 40); await tp('touchMove', p.x, p.y);
      if (!shot && OUT && (await pg.evaluate(() => G.runT > 150000))) { shot = true; await pg.evaluate(() => { G.Tundra.bz.off = false; G.Tundra.bz.force = true; }); await pg.waitForTimeout(500); await pg.screenshot({ path: OUT + 'p3_movil_844x390.jpg', type: 'jpeg', quality: 55 }); }
    }
    await pg.waitForTimeout(120);
  }
  if (fingers) await tp('touchEnd');
  const res = await pg.evaluate(() => ({ s: G.state, t: Math.round(G.runT / 1000), cold: Math.round(G.cold.v), fps: Math.round(G.Sys.fps), enemies: G.enemies.length }));
  console.log(JSON.stringify(res), 'toques en cartas', taps);
  ok(res.t > 100, 'la partida táctil avanza en la Tundra (run ' + res.t + ' s)');
  ok(!errs.length, 'táctil Tundra 844x390: 0 errores de consola ' + errs.slice(0, 3).join(' | '));
  await b.close(); process.exit(fails ? 1 : 0);
})();
