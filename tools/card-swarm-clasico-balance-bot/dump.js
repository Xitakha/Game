const { chromium } = require('/opt/node-tools/node_modules/playwright');
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--no-sandbox'] });
  const pg = await b.newPage(); await pg.goto(process.argv[2] + '/index.html?reset=1');
  await pg.waitForTimeout(500);
  const out = await pg.evaluate(() => {
    const L = G.Loot, rows = [];
    G.Cards.defs.forEach(d => { if (!d.id || !L.classic(d.id)) return; for (let r = 1; r <= 3; r++) { const x = L.recipe(d.id, r); rows.push(d.id + ' r' + r + ' [' + (L.TIER[d.id]) + (L.unlocked(d.id) ? ' owned' : '') + '] ' + JSON.stringify(x.parts) + ' b' + x.brasas); } });
    const nodes = G.Tree.NODES.filter(n => n.type !== 'root').map(n => n.id + ' ' + n.name + ' ' + JSON.stringify(G.Tree.cost(n)));
    return { rows, nodes };
  });
  console.log(out.rows.join('\n')); console.log(out.nodes.join('\n'));
  await b.close();
})();
