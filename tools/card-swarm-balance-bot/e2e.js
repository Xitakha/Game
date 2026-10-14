// Flujo completo: aldea -> portal (Tab) -> expedición (bot en god) -> jefe final -> botín -> aldea (B) -> forja / mercader / encargos -> 2.ª expedición.
// uso: node e2e.js http://localhost:8771 [len]
const { chromium } = require('/opt/node-tools/node_modules/playwright');
const fs = require('fs');
const base = process.argv[2] || 'http://localhost:8771', len = +(process.argv[3] || 7), OUT = '/home/user/Game/studio/docs/capturas-balance-v5/';
const botSrc = fs.readFileSync(__dirname + '/bot_page.js', 'utf8');
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--no-sandbox', '--autoplay-policy=no-user-gesture-required'] });
  const ctx = await b.newContext({ viewport: { width: 960, height: 540 } }); const pg = await ctx.newPage(); const errs = [];
  pg.on('console', m => { if (m.type() === 'error') errs.push(m.text()); }); pg.on('pageerror', e => errs.push('PAGEERR ' + e.message + ' ' + (e.stack || '').split('\n').slice(1, 3).join('|')));
  await pg.goto(`${base}/index.html?reset=1&dbg=1&god=1&len=${len}&speed=20`); await pg.waitForTimeout(600);
  const st = () => pg.evaluate(() => G.state);
  console.log('estado inicial', await st());
  await pg.screenshot({ path: OUT + 'e1_aldea.png' });
  await pg.keyboard.press('Tab'); await pg.waitForTimeout(900); await pg.keyboard.press('KeyE'); await pg.waitForTimeout(700); await pg.screenshot({ path: OUT + 'e2_portal.png' });
  await pg.evaluate(botSrc); await pg.keyboard.press('Enter'); await pg.waitForTimeout(500);
  console.log('tras Enter', await st());
  await pg.evaluate(() => window.installBalanceBot({})); 
  for (let i = 0; i < 400; i++) { await pg.waitForTimeout(500); if ((await st()) === 'gameover') break; }
  await pg.waitForTimeout(800);
  const res = await pg.evaluate(() => ({ won: G.won, boss: G.Loot.summary && G.Loot.summary.boss && { won: G.Loot.summary.boss.won, parts: G.Loot.summary.boss.parts, brasas: G.Loot.summary.boss.brasas, pf: G.Loot.summary.boss.pf }, total: G.Loot.summary.total, brasas: G.Loot.summary.brasas, pf: G.Loot.summary.pfGained, mini: window.__m.mini, elites: G.Save.data.elites, frag: G.Save.data.pf.frag, pfEarned: G.Save.data.pf.earned }));
  console.log('fin de run', JSON.stringify(res));
  await pg.screenshot({ path: OUT + 'e3_botin.png' });
  await pg.keyboard.press('KeyR'); await pg.waitForTimeout(900); console.log('R (repetir sin pasar por la aldea) ->', await st());
  await pg.evaluate(botSrc); await pg.evaluate(() => window.installBalanceBot({}));
  for (let i = 0; i < 400; i++) { await pg.waitForTimeout(500); if ((await st()) === 'gameover') break; }
  console.log('2.ª run terminada:', await pg.evaluate(() => ({ won: G.won, total: G.Loot.summary.total, brasas: G.Loot.summary.brasas, partes: G.Loot.summary.parts })));
  await pg.keyboard.press('KeyB'); await pg.waitForTimeout(1200); console.log('tras B', await st()); await pg.screenshot({ path: OUT + 'e4_aldea_vuelta.png' });
  // forja, recetas planas, mercader, tablón
  const sp = await pg.evaluate(() => { G.Aldea.setPanel('forge'); G.Panels.open('forge'); return G.Tree.pfFree(); });
  await pg.waitForTimeout(400); await pg.screenshot({ path: OUT + 'e5_forja_fuego.png' });
  const costs = await pg.evaluate(() => { const T = G.Tree; return T.NODES.filter(n => n.type !== 'root').map(n => { const c = T.cost(n); return n.id + ':' + JSON.stringify(c.parts) + '/b' + c.brasas + '/pf' + c.pf; }).join('  '); });
  console.log('PF libres', sp, '\nnodos', costs);
  await pg.keyboard.press('Digit3'); await pg.waitForTimeout(300); await pg.screenshot({ path: OUT + 'e6_forja_clasica.png' });
  const buy = await pg.evaluate(() => { const T = G.Tree; let out = []; for (const id of ['N1', 'F1']) { const r = T.buy(id, 'A'); out.push(id + ':' + (r.ok ? 'ok' : r.msg)); } const L = G.Loot; for (const id of ['shard', 'nova', 'dagger']) out.push(id + ':' + (L.canForge(id) ? (L.forge(id) ? 'forjada' : 'x') : 'faltan partes ' + JSON.stringify(L.recipe(id, L.nextRank(id)).parts) + ' b' + L.recipe(id, L.nextRank(id)).brasas)); return out.join(' | ') + ' || partes ' + JSON.stringify(G.Save.data.parts) + ' brasas ' + G.Save.data.brasas; });
  console.log('compras', buy);
  await pg.keyboard.press('Escape'); await pg.waitForTimeout(600);
  await pg.evaluate(() => { G.speed = 1; }); await pg.waitForTimeout(800);
  await pg.keyboard.press('Tab'); await pg.waitForTimeout(1200); await pg.keyboard.press('KeyE'); await pg.waitForTimeout(900);
  console.log('portal abierto, estado', await st()); await pg.screenshot({ path: OUT + 'e7_portal_2.png' });
  await pg.keyboard.press('Enter'); await pg.waitForTimeout(1200);
  console.log('3.ª expedición estado', await st());
  await pg.evaluate(botSrc); await pg.evaluate(() => window.installBalanceBot({}));
  for (let i = 0; i < 40; i++) await pg.waitForTimeout(250);
  console.log('3.ª expedición en juego', await st(), await pg.evaluate(() => Math.round(G.runT / 1000)));
  console.log('errores:', errs.length ? errs.join('\n') : 'NINGUNO');
  await b.close();
})();
