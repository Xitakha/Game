// uso: node caps_j3.js [puerto=8765]  - capturas de J3 (Portal con Peligro, Vesper/Cacería, preparación, HUD de Peligro, variantes, guardianes, práctica, zoom, táctil)
const { chromium } = require('/opt/node-tools/node_modules/playwright');
const PORT = process.argv[2] || 8765, OUT = '/home/user/Game/studio/docs/capturas-jefes-j3/', U = 'http://localhost:' + PORT + '/index.html';
const EXE = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
(async () => {
  const b = await chromium.launch({ executablePath: EXE, args: ['--no-sandbox', '--autoplay-policy=no-user-gesture-required'] });
  const errs = [];
  async function page(url, vp, ctxo) {
    const ctx = ctxo ? await b.newContext(ctxo) : await b.newContext({ viewport: vp || { width: 960, height: 540 } });
    const pg = await ctx.newPage();
    pg.on('console', m => { if (m.type() === 'error') errs.push(url + ' :: ' + m.text()); });
    pg.on('pageerror', e => errs.push('PAGEERR ' + url + ' :: ' + e.message));
    await pg.goto(U + url); await pg.waitForTimeout(700); return pg;
  }
  const shot = (pg, n) => pg.screenshot({ path: OUT + n + '.png' });
  const unlock = "const D = G.Save.data; D.bossKills = { pastor: 3, karceron: 2, letea: 1 }; D.peligro = { pastor: 4, karceron: 3, letea: 2 }; D.pelWins = { pastor: { 1: 2, 2: 1, 3: 1 } }; D.peligroSel = { pastor: 3 }; G.Save.save();";
  let pg = await page('?reset=1&pf=4&give=all:20,brasas:600');
  await pg.evaluate(unlock + "G.Aldea.openPanel('portal');"); await pg.waitForTimeout(300); await shot(pg, 'j01_portal_peligro');
  await pg.evaluate("G.Panels.closeAll(); G.Aldea.openPanel('vesper'); G.Panels.vesperTab(1);"); await pg.waitForTimeout(300); await shot(pg, 'j02_vesper_caceria');
  await pg.close();
  // preparación de cacería
  pg = await page('?hunt=pastor&peligro=3&reset=1&god=1'); await pg.waitForTimeout(500); await shot(pg, 'j03_preparacion_6_ofertas');
  for (let i = 0; i < 6; i++) { await pg.keyboard.press('1'); await pg.waitForTimeout(250); }
  await pg.waitForTimeout(6500); await shot(pg, 'j04_caceria_chip_peligro'); await pg.close();
  // Pastor Peligro IV: embestida doble
  pg = await page('?boss=pastor&peligro=4&reset=1&god=1&nointro=1&hand=spark:3,dart:3,shard:2,dagger:2&speed=1&hpcal=4');
  await pg.waitForTimeout(800); await pg.evaluate("G.Boss.force('embestida')"); await pg.waitForTimeout(1500); await shot(pg, 'j05_pastor_P4_embestida_doble'); await pg.close();
  // Karceron P3: lluvia de 9 brasas
  pg = await page('?boss=karceron&peligro=3&reset=1&god=1&nointro=1&hand=spark:3,dart:3,shard:2,dagger:2&speed=1');
  await pg.waitForTimeout(800); await pg.evaluate("G.Boss.force('k_brasas')"); await pg.waitForTimeout(1900); await shot(pg, 'j06_karceron_P3_9_brasas'); await pg.close();
  // Letea P3: 6 rayos desde la F1
  pg = await page('?boss=letea&peligro=3&reset=1&god=1&nointro=1&hand=spark:3,dart:3,shard:2,dagger:2&speed=1');
  await pg.waitForTimeout(800); await pg.evaluate("G.Boss.force('l_rayo','amarilla')"); await pg.waitForTimeout(1500); await shot(pg, 'j07_letea_P3_6_rayos'); await pg.close();
  // Peligro V: último aliento (dos éxtasis)
  pg = await page('?boss=pastor&peligro=5&reset=1&god=1&nointro=1&hand=spark:3,dart:3,shard:3,dagger:3&speed=1&phase=3&hp=0.075');
  await pg.waitForTimeout(1200); await pg.evaluate("G.Boss.e.hp = G.Boss.e.maxHp * 0.079; G.Boss.afterHit(G.Boss.e)"); await pg.waitForTimeout(2500); await shot(pg, 'j08_pastor_P5_ultimo_aliento'); await pg.close();
  // práctica: fin
  pg = await page('?hunt=letea&practice=1&reset=1&god=1&nointro=1&prep=0&hand=spark:3,dart:3&speed=1&phase=3');
  await pg.waitForTimeout(1000); await shot(pg, 'j09_practica_en_curso');
  await pg.evaluate("G.player.hp = 0; G.player.dead = true;"); await pg.waitForTimeout(2200); await shot(pg, 'j10_practica_fin'); await pg.close();
  // guardianes de bioma
  for (const [bio, ty, nm] of [['cripta', 'mini_bulwark', 'j11_guardian_centinela'], ['asfodelo', 'mini_hive', 'j12_guardian_planidera']]) {
    pg = await page('?reset=1&god=1&biome=' + bio + '&t=215&hand=spark:3,dart:3,shard:2&speed=1');
    await pg.evaluate("G.startGame(); G.Waves.elitesDone = {}; G.runT = G.time = G.vt() + 215000;"); await pg.waitForTimeout(6000);
    await pg.evaluate(() => { const p = G.player, m = G.Enemies.minis()[0]; if (m) { p.x = m.x - 190; p.y = m.y; } }); await pg.waitForTimeout(1800); await shot(pg, nm); await pg.close();
  }
  // zoom 0.9
  pg = await page('?boss=karceron&peligro=2&reset=1&god=1&nointro=1&hand=spark:3,dart:3,shard:2&speed=1&zoom=0.9'); await pg.waitForTimeout(2500); await shot(pg, 'j13_zoom_0_9_karceron'); await pg.close();
  // táctil 844x390: portal con Peligro y Vesper
  pg = await page('?reset=1&pf=4&give=all:20,brasas:600', null, { viewport: { width: 844, height: 390 }, hasTouch: true, isMobile: true, deviceScaleFactor: 2 });
  await pg.evaluate(unlock + "G.Aldea.openPanel('portal');"); await pg.waitForTimeout(300);
  const k = 693 / 960, ox = (844 - 693) / 2; // lienzo 16:9 centrado en 844x390
  await pg.touchscreen.tap(ox + (650 + 4 * 58 + 27) * k, (408 + 19) * k); await pg.waitForTimeout(200); // Peligro V (bloqueado)
  await pg.touchscreen.tap(ox + (650 + 3 * 58 + 27) * k, (408 + 19) * k); await pg.waitForTimeout(300); // Peligro IV
  console.log('toque Peligro IV ->', await pg.evaluate("G.Save.data.peligroSel.pastor"));
  await shot(pg, 'j14_tactil_portal_844x390'); await pg.close();
  console.log(errs.length ? errs.join('\n') : 'NO ERRORS');
  await b.close();
})();
