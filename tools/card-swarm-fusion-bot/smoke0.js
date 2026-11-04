const { chromium } = require('/opt/node-tools/node_modules/playwright');
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--no-sandbox', '--autoplay-policy=no-user-gesture-required'] });
  const ctx = await b.newContext({ viewport: { width: 844, height: 390 }, hasTouch: true, isMobile: true });
  const pg = await ctx.newPage(); const errs = [];
  pg.on('console', m => { if (m.type() === 'error' || m.type()==='warning') errs.push(m.type()+': '+m.text()); }); pg.on('pageerror', e => errs.push('PAGEERR ' + e.message + e.stack));
  await pg.goto('http://localhost:8811/index.html?nosw=1&reset=1'); await pg.waitForTimeout(1500);
  console.log(await pg.evaluate(() => JSON.stringify({ state: G.state, offer: G.Cards.off && G.Cards.off.cards })));
  console.log(errs.join('\n'));
  await b.close();
})();
