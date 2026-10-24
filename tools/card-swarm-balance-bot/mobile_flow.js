// FLUJO TACTIL REAL (844x390, DPR 2, Chromium con hasTouch/isMobile): aldea -> Portal -> destino -> expedicion -> cartas -> jefe -> botin -> aldea, solo con toques (page.touchscreen.tap)
// y un joystick flotante con eventos CDP Input.dispatchTouchEvent. uso: node mobile_flow.js [bioma=asfodelo] [base=http://localhost:8793] [capturaDir]
const { chromium } = require('/opt/node-tools/node_modules/playwright');
const biome = process.argv[2] || 'asfodelo', base = process.argv[3] || 'http://localhost:8793', OUT = process.argv[4] || '';
let fails = 0; const ok = (c, m) => { if (!c) fails++; console.log((c ? 'OK     ' : 'FALLO  ') + m); };
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--no-sandbox', '--autoplay-policy=no-user-gesture-required'] });
  const ctx = await b.newContext({ viewport: { width: 844, height: 390 }, hasTouch: true, isMobile: true, deviceScaleFactor: 2 });
  const pg = await ctx.newPage(), errs = [];
  pg.on('console', m => { if (m.type() === 'error') errs.push(m.text()); }); pg.on('pageerror', e => errs.push('PAGEERR ' + e.message));
  await pg.goto(`${base}/index.html?reset=1&dbg=1&god=1&len=7&speed=16&nosw=1`); await pg.waitForTimeout(900);
  const cdp = await ctx.newCDPSession(pg);
  const st = () => pg.evaluate(() => G.state);
  const scr = (gx, gy) => pg.evaluate(([gx, gy]) => { const r = document.getElementById('game').getBoundingClientRect(); return { x: r.left + gx * r.width / 960, y: r.top + gy * r.height / 540 }; }, [gx, gy]);
  const tap = async (gx, gy) => { const p = await scr(gx, gy); await pg.touchscreen.tap(p.x, p.y); await pg.waitForTimeout(350); };
  const rectC = async (js) => pg.evaluate(js);
  ok((await st()) === 'aldea', 'arranca en la aldea (toque)');
  await pg.evaluate(bio => { G.Save.data.bossKills.pastor = bio === 'bosque' ? 0 : 1; G.Save.data.bossKills.karceron = bio === 'asfodelo' ? 1 : 0; G.Save.save(); }, biome);
  // PORTAL (boton de 100x48 abajo a la izquierda)
  await tap(62, 506); await pg.waitForTimeout(900);     // viaje rapido al Portal
  await tap(898, 478); await pg.waitForTimeout(700);    // boton HABLAR / PORTAL (96 px) junto al arco
  const open = await pg.evaluate(() => ({ s: G.state, p: G.Panels && G.Panels.current ? G.Panels.current() : null }));
  ok(open.p === 'portal', 'toques: PORTAL -> boton del arco abre el Portal (' + JSON.stringify(open) + ')');
  // destino: chips de 92x42 en y 336, x = 650 + i*98 (bosque, cripta, asfodelo)
  const idx = { bosque: 0, cripta: 1, asfodelo: 2 }[biome];
  await tap(650 + idx * 98 + 46, 357); await pg.waitForTimeout(500);
  if (OUT) await pg.screenshot({ path: OUT + `m1_portal_${biome}.jpg`, type: 'jpeg', quality: 62 });
  ok((await pg.evaluate(() => G.Save.data.biome)) === biome, 'destino ' + biome + ' elegido con un toque');
  await tap(795, 508); await pg.waitForTimeout(900);   // SALIR A LA EXPEDICION
  let s1 = await st(); ok(s1 === 'play' || s1 === 'cards', 'portal -> expedicion (' + s1 + ')');
  ok((await pg.evaluate(() => G.curBiome)) === biome && (await pg.evaluate(() => !!G.B.famOf())), 'bioma ' + biome + ' con familia');
  // bucle: cartas por toque, joystick por CDP, hasta el botin
  let t0 = Date.now(), a = 0, shot = false, taps = 0, joy = false;
  const tp = (type, x, y) => cdp.send('Input.dispatchTouchEvent', { type, touchPoints: type === 'touchEnd' ? [] : [{ x, y, id: 1 }] });
  let fingers = false;
  while (Date.now() - t0 < 420000) {
    const s = await st();
    if (s === 'gameover') break;
    if (s === 'cards') { if (fingers) { await tp('touchEnd'); fingers = false; } const r = await pg.evaluate(() => { const O = G.Cards.off; const r = G.Cards.offerRect(0); return { x: r.x + r.w / 2, y: r.y + r.h / 2, mode: O && O.mode, skip: G.Cards.skipRect, replacing: O && O.replacing }; }); await tap(r.x, r.y); taps++; if (r.replacing) await tap(110 + 36, 400); continue; }
    if (s === 'play') {
      if (!fingers) { const p = await scr(120, 330); await tp('touchStart', p.x, p.y); fingers = true; a = 0; }
      a += 0.35; const p = await scr(120 + Math.cos(a) * 50, 330 + Math.sin(a) * 40); await tp('touchMove', p.x, p.y);
      if (!shot && OUT && (await pg.evaluate(() => G.runT > 60000))) { shot = true; await pg.screenshot({ path: OUT + `m2_combate_${biome}_844x390.jpg`, type: 'jpeg', quality: 52 }); }
      joy = joy || (await pg.evaluate(() => G.input.joy && G.input.joy.active));
    }
    await pg.waitForTimeout(120);
  }
  if (fingers) await tp('touchEnd');
  ok(joy, 'el joystick flotante tactil se activo durante la expedicion (' + taps + ' toques en cartas)');
  await pg.waitForTimeout(1200);
  const res = await pg.evaluate(() => ({ s: G.state, won: G.won, total: G.Loot.summary && G.Loot.summary.total, brasas: G.Loot.summary && G.Loot.summary.brasas }));
  ok(res.s === 'gameover' && res.won && res.total > 0, 'expedicion terminada con victoria y botin ' + JSON.stringify(res));
  await tap(710, 483); await pg.waitForTimeout(1500);   // IR A LA ALDEA
  ok((await st()) === 'aldea', 'botin -> aldea con un toque');
  ok(!errs.length, 'flujo tactil ' + biome + ': 0 errores de consola ' + errs.slice(0, 3).join(' | '));
  await b.close(); process.exit(fails ? 1 : 0);
})();
