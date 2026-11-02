// PRUEBAS MÓVILES P8: toque real (CDP) en 844x390 (horizontal) y 390x844 (vertical) con DPR 2 y isMobile: aldea (joystick), Portal (toques), pelea de cada uno de los 6 jefes
// (joystick flotante + fps + HUD dentro del lienzo), cinemática final (saltar con toque) y vertical (aviso "gira el teléfono" y partida en pausa).
// uso: node p8_mobile.js [base=http://localhost:8791] [carpetaCapturas]   (máx. 4 capturas JPEG pequeñas)
const { chromium } = require('/opt/node-tools/node_modules/playwright');
const base = process.argv[2] || 'http://localhost:8791', OUT = process.argv[3] || '';
let fails = 0; const ok = (c, m) => { if (!c) fails++; console.log((c ? 'OK     ' : 'FALLO  ') + m); };
const FPS = (pg, s) => pg.evaluate(s => new Promise(res => { let n = 0; const t0 = performance.now(); (function f() { n++; if (performance.now() - t0 < s * 1000) requestAnimationFrame(f); else res(n / s); })(); }), s);
const IDS = ['pastor', 'karceron', 'letea', 'yarlak', 'melaria', 'cenizar'], PH = { pastor: 2, karceron: 2, letea: 2, yarlak: 2, melaria: 2, cenizar: 3 };
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--no-sandbox', '--autoplay-policy=no-user-gesture-required'] });
  const mk = async (w, h, url) => {
    const ctx = await b.newContext({ viewport: { width: w, height: h }, hasTouch: true, isMobile: true, deviceScaleFactor: 2 }), pg = await ctx.newPage(); pg.errs = []; pg.ctx = ctx;
    pg.on('console', m => { if (m.type() === 'error') pg.errs.push(m.text()); }); pg.on('pageerror', e => pg.errs.push('PAGEERR ' + e.message));
    await pg.goto(`${base}/index.html?${url}`); await pg.waitForTimeout(900); pg.cdp = await ctx.newCDPSession(pg); return pg;
  };
  const scr = (pg, gx, gy) => pg.evaluate(([gx, gy]) => { const r = document.getElementById('game').getBoundingClientRect(); return { x: r.left + gx * r.width / 960, y: r.top + gy * r.height / 540, w: r.width, h: r.height }; }, [gx, gy]);
  const tp = (pg, type, x, y) => pg.cdp.send('Input.dispatchTouchEvent', { type, touchPoints: type === 'touchEnd' ? [] : [{ x, y, id: 1 }] });
  const tap = async (pg, gx, gy) => { const p = await scr(pg, gx, gy); await pg.touchscreen.tap(p.x, p.y); await pg.waitForTimeout(350); };
  async function drag(pg, gx, gy, dx, dy) { const a = await scr(pg, gx, gy), c = await scr(pg, gx + dx, gy + dy); await tp(pg, 'touchStart', a.x, a.y); for (let i = 1; i <= 5; i++) await tp(pg, 'touchMove', a.x + (c.x - a.x) * i / 5, a.y + (c.y - a.y) * i / 5); await pg.waitForTimeout(900); await tp(pg, 'touchEnd'); }

  // ---------------------------------------------------------------- horizontal 844x390
  console.log('--- 844x390 (horizontal)');
  let pg = await mk(844, 390, 'reset=1&dbg=1&god=1&nosw=1&len=7');
  const lay = await pg.evaluate(() => ({ m: G.Sys.isMobile, l: G.Sys.layout, s: G.state }));
  ok(lay.m && lay.s === 'aldea', 'modo móvil activo y arranca en la aldea ' + JSON.stringify(lay.l));
  ok(lay.l.cw <= 844 && lay.l.ch <= 390 && Math.abs(lay.l.cw / lay.l.ch - 16 / 9) < 0.03, `lienzo ${lay.l.cw}x${lay.l.ch} dentro de 844x390 en 16:9`);
  const a0 = await pg.evaluate(() => ({ x: G.Aldea.pos.x }));
  await drag(pg, 180, 330, 70, 0);
  const a1 = await pg.evaluate(() => ({ x: G.Aldea.pos.x }));
  ok(a0.x != null && a1.x !== a0.x, `aldea: el joystick flotante mueve a Marlo (${a0.x} -> ${a1.x})`);
  if (OUT) await pg.screenshot({ path: OUT + 'p8_m1_aldea_844x390.jpg', type: 'jpeg', quality: 50 });
  await pg.evaluate(() => { G.Save.data.bossKills = { pastor: 1, karceron: 1, letea: 1, yarlak: 1, melaria: 1 }; G.Save.save(); });
  await tap(pg, 62, 506); await pg.waitForTimeout(900); await tap(pg, 898, 478); await pg.waitForTimeout(700);
  const pl = await pg.evaluate(() => ({ p: G.Panels && G.Panels.current ? G.Panels.current() : null }));
  ok(pl.p === 'portal', 'Portal abierto con toques (botón PORTAL + botón del arco)');
  for (let i = 0; i < 6; i++) { await tap(pg, 491 + (i % 2) * 98, 125 + Math.floor(i / 2) * 49); const bi = await pg.evaluate(() => G.Save.data.biome); if (i === 5) ok(bi === 'crater', 'Portal: el chip del Cráter se elige con un toque (' + bi + ')'); }
  await pg.evaluate(() => { var D = G.Save.data; D.biome = 'bosque'; G.Save.save(); });
  await tap(pg, 795, 508); await pg.waitForTimeout(900);
  const sP = await pg.evaluate(() => G.state); ok(sP === 'play' || sP === 'cards', 'Portal -> SALIR con un toque inicia la expedición (' + sP + ')');
  ok(!pg.errs.length, 'aldea + Portal: 0 errores ' + pg.errs.slice(0, 2)); await pg.ctx.close();

  for (const id of IDS) {
    pg = await mk(844, 390, `reset=1&god=1&dbg=1&nosw=1&nointro=1&prep=0&boss=${id}&phase=${PH[id]}&hand=spark:3,dart:3,shard:2,dagger:2,fang:2`);
    await pg.evaluate(() => { setInterval(() => { G.pendingLevels = 0; if (G.state === 'cards') G.state = 'play'; }, 50); });
    await pg.waitForTimeout(3500);
    const p0 = await pg.evaluate(() => ({ x: G.player.x, y: G.player.y }));
    await drag(pg, 120, 330, 60, -10);
    const p1 = await pg.evaluate(() => ({ x: G.player.x, y: G.player.y, joy: !!(G.input.joy && G.input.joy.active), s: G.state, boss: G.Boss.e && G.Boss.e.id, q: G.Q.level, rs: G.rs }));
    const f = await FPS(pg, 3);
    ok(Math.hypot(p1.x - p0.x, p1.y - p0.y) > 20 && p1.boss === id, `${id}: el joystick táctil mueve al jugador ${Math.round(Math.hypot(p1.x - p0.x, p1.y - p0.y))} px; jefe vivo; calidad ${p1.q} (rs ${p1.rs}); ${f.toFixed(1)} fps`);
    ok(f >= 20, `${id}: fps táctil 844x390 >= 20 en Chromium sin GPU (${f.toFixed(1)}; en móviles reales el lienzo va acelerado)`);
    if (OUT && id === 'melaria') await pg.screenshot({ path: OUT + 'p8_m2_melaria_844x390.jpg', type: 'jpeg', quality: 50 });
    ok(!pg.errs.length, `${id}: 0 errores ${pg.errs.slice(0, 2)}`); await pg.ctx.close();
  }
  // cinemática final: se salta con un toque
  pg = await mk(844, 390, 'reset=1&god=1&dbg=1&nosw=1');
  await pg.evaluate(() => { G.Ending.begin(); });
  await pg.waitForTimeout(2500);
  ok(await pg.evaluate(() => G.Ending.active()), 'cinemática final activa');
  if (OUT) await pg.screenshot({ path: OUT + 'p8_m3_cinematica_844x390.jpg', type: 'jpeg', quality: 50 });
  for (let i = 0; i < 4; i++) { await tap(pg, 480, 270); await pg.waitForTimeout(500); }
  await pg.waitForTimeout(1500);
  ok(await pg.evaluate(() => !G.Ending.active() || G.state !== 'ending'), 'cinemática final: se salta con toques y sale a la pantalla final (' + (await pg.evaluate(() => G.state)) + ')');
  ok(!pg.errs.length, 'cinemática: 0 errores ' + pg.errs.slice(0, 2)); await pg.ctx.close();

  // ---------------------------------------------------------------- vertical 390x844
  console.log('--- 390x844 (vertical)');
  pg = await mk(390, 844, 'reset=1&god=1&dbg=1&nosw=1&nointro=1&prep=0&boss=pastor&phase=2');
  await pg.waitForTimeout(1500);
  const v = await pg.evaluate(() => { const r = document.querySelectorAll('div'); let rot = null; r.forEach(d => { if (/gira|GIRA/i.test(d.textContent || '') && d.children.length < 4 && getComputedStyle(d).display !== 'none') rot = d.textContent.slice(0, 40); }); return { rot, paused: G.Sys.paused, s: G.state, t: G.time }; });
  ok(!!v.rot && (v.paused || v.s === 'paused'), `vertical: aviso "${v.rot}" y partida en pausa (paused ${v.paused}, estado ${v.s})`);
  const t1 = await pg.evaluate(() => G.time); await pg.waitForTimeout(1500); const t2 = await pg.evaluate(() => G.time);
  ok(Math.abs(t2 - t1) < 100, `vertical: el reloj de la partida no avanza (${Math.round(t2 - t1)} ms en 1,5 s)`);
  if (OUT) await pg.screenshot({ path: OUT + 'p8_m4_vertical_390x844.jpg', type: 'jpeg', quality: 50 });
  ok(!pg.errs.length, 'vertical: 0 errores ' + pg.errs.slice(0, 2)); await pg.ctx.close();
  await b.close();
  console.log(fails ? `\n${fails} FALLOS` : '\nTODO OK'); process.exit(fails ? 1 : 0);
})();
