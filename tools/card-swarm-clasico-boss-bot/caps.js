const { chromium } = require('/opt/node-tools/node_modules/playwright');
const OUT = '/home/user/Game/studio/docs/capturas-jefes-j1-logica/';
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--no-sandbox', '--autoplay-policy=no-user-gesture-required'] });
  const pg = await b.newPage({ viewport: { width: 960, height: 540 } });
  const errs = [];
  pg.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
  pg.on('pageerror', e => errs.push('PAGEERR ' + e.message + (e.stack || '').split('\n').slice(1, 4).join('|')));
  await pg.goto('http://localhost:8765/index.html?boss=pastor&god=1&reset=1&hand=spark:3,dart:3,shard:2,dagger:2,fang:2&speed=1&hpcal=4');
  await pg.evaluate(() => { setInterval(() => { if (G.state === 'cards' && G.Cards.off) { try { G.Cards.off.mode === 'level' ? G.Cards.skip() : G.Cards.pick(0); } catch (e) { } } }, 100); });
  const shot = async (n) => { await pg.screenshot({ path: OUT + n + '.png' }); };
  const info = async () => JSON.stringify(await pg.evaluate(() => G.Boss.info()));
  // intro
  await pg.waitForTimeout(500); await shot('01_intro_caida');
  await pg.waitForTimeout(1000); await shot('02_intro_titulo');
  await pg.waitForTimeout(900); await shot('03_intro_rugido');
  await pg.waitForTimeout(1500); await shot('04_combate_inicio');
  console.log(await info());
  // ataques forzados
  const att = async (name, wait, n) => { await pg.evaluate((a) => { G.god = true; G.Boss.force(a); }, name); await pg.waitForTimeout(wait); await shot(n); };
  // esperar a que esté libre
  async function free() { for (let i = 0; i < 80; i++) { const r = await pg.evaluate(() => G.Boss.e && !G.Boss.e.atk && G.Boss.e.mode === 'fight' && G.Boss.e.stagT <= 0); if (r) return; await pg.waitForTimeout(150); } }
  for (const [n, w, f] of [['barrido', 600, '05_tele_barrido'], ['embestida', 650, '06_tele_embestida'], ['pisoton', 450, '07_tele_pisoton'], ['salto', 700, '08_tele_salto'], ['abanico', 400, '09_tele_abanico'], ['llamada', 600, '10_tele_llamada']]) { await free(); await att(n, w, f); }
  await free(); await pg.evaluate(() => G.Boss.force('pisoton')); await pg.waitForTimeout(1500); await shot('11_ondas_pisoton');
  await free(); await pg.evaluate(() => G.Boss.force('salto')); await pg.waitForTimeout(1250); await shot('12_salto_ventana');
  await free(); await pg.evaluate(() => G.Boss.breakKey('cuernos')); await pg.waitForTimeout(300); await shot('13_parte_rota_cuernos');
  await pg.evaluate(() => G.Boss.breakKey('cayado')); await pg.waitForTimeout(900); await shot('14_cayado_roto');
  await pg.evaluate(() => G.Boss.breakKey('vellon')); await pg.waitForTimeout(900); await shot('15_vellon_roto');
  console.log(await info());
  await pg.evaluate(() => { G.Boss.e.stagT = 0; G.Boss.gate(); }); await pg.waitForTimeout(700); await shot('16_transicion_fase2');
  await pg.waitForTimeout(3500); await shot('17_fase2_zarzal');
  await free(); await pg.evaluate(() => G.Boss.force('esporas')); await pg.waitForTimeout(800); await shot('18_tele_esporas');
  await pg.waitForTimeout(1500); await shot('19_esporas_activas');
  await pg.evaluate(() => { G.Boss.e.stagT = 0; G.Boss.e.atk = null; G.Boss.e.bst = 'idle'; G.Boss.gate(); }); await pg.waitForTimeout(800); await shot('20_transicion_fase3');
  await pg.waitForTimeout(6000); await shot('21_fase3_perimetro');
  await free(); await pg.evaluate(() => G.Boss.force('estampida')); await pg.waitForTimeout(600); await shot('22_tele_estampida');
  await pg.waitForTimeout(2500); await shot('23_estampida');
  // desesperado
  await pg.evaluate(() => { const e = G.Boss.e; e.atk = null; e.bst = 'idle'; e.stagT = 0; e.hp = e.maxHp * 0.079; G.Boss.afterHit(e); });
  await pg.waitForTimeout(2800); await shot('24_extasis');
  await pg.waitForTimeout(1800); await shot('25_extasis_ondas');
  console.log(await info());
  // muerte
  await pg.evaluate(() => { const e = G.Boss.e; G.Combat.deal(e, 99999, { tag: 'fire', proj: true }); });
  await pg.waitForTimeout(500); await shot('26_muerte_a');
  await pg.waitForTimeout(1500); await shot('27_muerte_b');
  for (let i = 0; i < 40; i++) { await pg.waitForTimeout(250); if (await pg.evaluate(() => G.state === 'gameover')) break; }
  await pg.waitForTimeout(400); await shot('28_victoria');
  console.log(await pg.evaluate(() => JSON.stringify(G.Loot.summary && G.Loot.summary.boss)));
  // perímetro ardiente visto desde el borde + portal + derrota
  await pg.goto('http://localhost:8765/index.html?boss=pastor&god=1&reset=1&nointro=1&phase=3&hand=spark:3,dart:3&speed=1&hpcal=4');
  await pg.waitForTimeout(2500);
  await pg.evaluate(() => { G.player.x = 120; G.player.y = 405; G.Boss.e && (G.Boss.e.x = 600); });
  await pg.waitForTimeout(6500); await shot('29_perimetro_ardiente_borde');
  console.log(await info());
  await pg.goto('http://localhost:8765/index.html?reset=1&give=all:30&pf=3');
  await pg.waitForTimeout(800);
  await pg.evaluate(() => { G.Save.data.bossKills.pastor = 1; G.Panels.open('portal'); G.Aldea.setPanel('portal'); });
  await pg.waitForTimeout(500); await shot('30_portal_destinos');
  await pg.goto('http://localhost:8765/index.html?boss=pastor&reset=1&nointro=1&hand=spark:1&speed=6&hpcal=4');
  await pg.waitForTimeout(1500);
  await pg.evaluate(() => { G.Boss.breakKey('cuernos'); G.Boss.e.hp = G.Boss.e.maxHp * 0.5; G.player.hp = 1; });
  for (let i = 0; i < 80; i++) { await pg.waitForTimeout(300); if (await pg.evaluate(() => G.state === 'gameover')) break; await pg.evaluate(() => { if (G.player.hp > 0) G.player.hp = Math.min(G.player.hp, 5); }); }
  await pg.waitForTimeout(500); await shot('31_derrota');
  console.log(await pg.evaluate(() => JSON.stringify(G.Loot.summary && G.Loot.summary.boss)));
  console.log(errs.join('\n') || 'NO ERRORS');
  await b.close();
})();
