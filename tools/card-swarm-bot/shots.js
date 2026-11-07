// Capturas JPEG pequeñas (844x390 táctil) para studio/docs/capturas-fusion/. Uso: node tools/card-swarm-bot/shots.js [base]
const { chromium } = require('/opt/node-tools/node_modules/playwright');
const path = require('path'), base = process.argv[2] || 'http://localhost:8811', out = path.join(__dirname, '..', '..', 'studio', 'docs', 'capturas-fusion');
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--no-sandbox', '--autoplay-policy=no-user-gesture-required'] });
  const mk = async url => { const ctx = await b.newContext({ viewport: { width: 844, height: 390 }, hasTouch: true, isMobile: true }), pg = await ctx.newPage(); pg.errs = []; pg.ctx = ctx; pg.on('console', m => { if (m.type() === 'error') pg.errs.push(m.text()); }); pg.on('pageerror', e => pg.errs.push(e.message)); await pg.goto(`${base}/index.html?nosw=1&${url}`); await pg.waitForTimeout(900); return pg; };
  const shot = (pg, n) => pg.screenshot({ path: path.join(out, n), type: 'jpeg', quality: 45 });
  let pg = await mk('reset=1&god=1'); await pg.waitForTimeout(700); await shot(pg, '1_inicio_infusion.jpg');
  await pg.evaluate(() => { G.Cards.off.cards = ['spark', 'shard', 'dart']; G.Cards.pick(0); });
  await pg.waitForTimeout(500);
  await pg.evaluate(() => { G.pendingLevels = 1; G.Cards.open('level'); G.state = 'cards'; G.Cards.off.cards = ['shard', 'zap', 'dart']; });
  await pg.waitForTimeout(900); await pg.evaluate(() => G.Cards.pick(0)); await pg.waitForTimeout(700); await shot(pg, '2_ventana_fusion.jpg');
  console.log('errs', pg.errs); await pg.close(); await pg.ctx.close();
  pg = await mk('reset=1&god=1&actives=vapor,plasma&hand=spark:2,shard:1,dagger:1&speed=1');
  await pg.evaluate(() => { const p = G.player; for (let i = 0; i < 16; i++) { const a = i * 0.4; G.Enemies.spawn('worm', p.x + Math.cos(a) * (130 + i * 7), p.y + Math.sin(a) * (110 + i * 6)); } });
  await pg.waitForTimeout(1800); await pg.evaluate(() => { G.player.actives[0].cd = 0; G.player.actives[1].cd = 0; }); await pg.keyboard.press('KeyQ'); await pg.waitForTimeout(700); await shot(pg, '3_vapor_hud.jpg');
  await pg.keyboard.press('KeyE'); await pg.waitForTimeout(500); await shot(pg, '4_plasma.jpg');
  console.log('errs', pg.errs); await pg.close(); await pg.ctx.close(); await b.close();
})();
