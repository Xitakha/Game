// uso: node perf.js [boss=pastor] [puerto=8765]   (mide fps antes del jefe con horda y durante la pelea)
const { chromium } = require('/opt/node-tools/node_modules/playwright');
const BOSS = process.argv[2] || 'pastor', PORT = process.argv[3] || 8765;
const OUT = '/home/user/Game/studio/docs/' + (BOSS === 'pastor' ? 'capturas-jefes-j1-logica/' : 'capturas-jefes-j2-logica/');
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--no-sandbox', '--autoplay-policy=no-user-gesture-required'] });
  const pg = await b.newPage({ viewport: { width: 960, height: 540 } });
  const errs = [];
  pg.on('console', m => { if (m.type() === 'error' || m.type() === 'warning') errs.push(m.type() + ' ' + m.text()); });
  pg.on('pageerror', e => errs.push('PAGEERR ' + e.message));
  // partida normal con horda real: t=7:20 con god, mano de prueba, speed 1
  await pg.goto('http://localhost:' + PORT + '/index.html?reset=1&god=1&t=435&biome=' + ({ pastor: 'bosque', karceron: 'cripta', letea: 'asfodelo' })[BOSS] + '&hand=spark:3,dart:3,shard:2,dagger:2,fang:2&speed=1&dbg=1');
  await pg.evaluate((b) => { G.startGame(); G.bossId = b; G.Cards.recalc(false); }, BOSS);
  await pg.evaluate(() => { setInterval(() => { if (G.state === 'cards' && G.Cards.off) { try { G.Cards.off.mode === 'level' ? G.Cards.skip() : G.Cards.pick(0); } catch (e) { } } }, 100); });
  const fps = (ms) => pg.evaluate((ms) => new Promise(res => { let n = 0; const t0 = performance.now(); function f() { n++; if (performance.now() - t0 < ms) requestAnimationFrame(f); else res(n / (ms / 1000)); } requestAnimationFrame(f); }), ms);
  console.log('fps antes del jefe (horda)', (await fps(3000)).toFixed(1), await pg.evaluate(() => G.enemies.length + ' enemigos'));
  for (let i = 0; i < 100; i++) { await pg.waitForTimeout(250); if (await pg.evaluate(() => !!G.Boss.e)) break; }
  await pg.waitForTimeout(1500); await pg.screenshot({ path: OUT + (BOSS === 'pastor' ? '32' : 'p') + '_intro_con_horda_' + BOSS + '.png' });
  console.log('en intro: enemigos', await pg.evaluate(() => G.enemies.length), 'runT', await pg.evaluate(() => G.fmtTime(G.runT)));
  await pg.waitForTimeout(3500);
  console.log('tras intro: enemigos', await pg.evaluate(() => G.enemies.length), JSON.stringify(await pg.evaluate(() => G.Boss.info())));
  for (const label of ['pelea fase 1']) {
    console.log('fps', label, (await fps(5000)).toFixed(1), 'proy', await pg.evaluate(() => G.projectiles.length), 'ent', await pg.evaluate(() => G.enemies.length));
  }
  const t1 = await pg.evaluate(() => G.runT);
  await pg.waitForTimeout(3000);
  const t2 = await pg.evaluate(() => G.runT);
  console.log('reloj de la run congelado:', t1 === t2, t1, t2);
  // ataques forzados con ventana de coste: medir ms por frame de dibujo con muchas cosas
  await pg.evaluate(() => { G.Boss.gate(); });
  await pg.waitForTimeout(4000);
  for (const n of (BOSS === 'pastor' ? ['esporas', 'abanico'] : BOSS === 'karceron' ? ['k_aliento', 'k_costillas', 'k_brasas'] : ['l_rayo', 'l_acido', 'l_aliento'])) { await pg.evaluate((n) => G.Boss.force(n), n); await pg.waitForTimeout(1500); }
  console.log('fps fase 2 con zarzal/esporas', (await fps(4000)).toFixed(1), 'proy', await pg.evaluate(() => G.projectiles.length), 'ent', await pg.evaluate(() => G.enemies.length));
  console.log('dbg dmg', JSON.stringify(await pg.evaluate(() => G.dbg && G.dbg.dmg)));
  console.log(errs.join('\n') || 'NO ERRORS');
  await b.close();
})();
