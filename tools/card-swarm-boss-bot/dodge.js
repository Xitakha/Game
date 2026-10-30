// Prueba de esquiva por ataque (P6.5): fuerza N veces cada ataque de Cenizar con el bot esquivador y cuenta golpes recibidos.
// uso: node dodge.js '{"phase":3,"attacks":["c_martillo"],"n":10,"port":8801,"react":250,"mistakes":0.1,"inattn":0.1,"peligro":1,"extra":""}'
const { chromium } = require('/opt/node-tools/node_modules/playwright');
const fs = require('fs');
const cfg = Object.assign({ phase: 1, attacks: [], n: 8, port: 8801, react: 250, mistakes: 0.1, inattn: 0.1, peligro: 1, extra: '', speed: 12, hand: 'spark:3,dart:2,shard:2,dagger:2,fang:1', broken: '' }, JSON.parse(process.argv[2] || '{}'));
const botSrc = fs.readFileSync(__dirname + '/bot.js', 'utf8');
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--no-sandbox'] });
  const pg = await b.newPage({ viewport: { width: 960, height: 540 } }); const errs = [];
  pg.on('pageerror', e => errs.push(e.message + ' ' + (e.stack || '').split('\n').slice(1, 3).join('|')));
  await pg.goto(`http://localhost:${cfg.port}/index.html?reset=1&boss=cenizar&nointro=1&prep=0&phase=${cfg.phase}&peligro=${cfg.peligro}&speed=${cfg.speed}&hand=${cfg.hand}${cfg.extra}`);
  await pg.waitForTimeout(600);
  await pg.evaluate(botSrc);
  await pg.evaluate((o) => { window.installBot(o); G.god = false; }, { react: cfg.react, mistakes: cfg.mistakes, dist: 250, every: 100, godUntilBoss: false, noLevel: true, inattn: cfg.inattn, hp0: 100, burst: cfg.burst !== false, horizon: cfg.horizon || 2800 });
  await pg.evaluate((br) => { setInterval(() => { if (G.Boss.e) G.Boss.e.cadT = 1e9; G.player.xp = 0; G.pendingLevels = 0; const e = G.Boss.e; if (e && e.mode === 'fight') { e.hp = e.maxHp * (e.def.phases[e.phase - 1].thr + 0.5 * ((e.phase > 1 ? e.def.phases[e.phase - 2].thr : 1) - e.def.phases[e.phase - 1].thr)); G.player.hp = Math.max(G.player.hp, 60); } }, 40); if (br) br.split(',').forEach(k => G.Boss.e.broken[k] = true); }, cfg.broken);
  for (const name of cfg.attacks) {
    let hit = 0, dmg = 0, runs = 0; const hb0 = await pg.evaluate(() => JSON.stringify(window.__bot.hurtsBy));
    for (let i = 0; i < cfg.n; i++) {
      for (let k = 0; k < 80; k++) { if (await pg.evaluate(() => { const e = G.Boss.e; return e.mode === 'fight' && !e.atk; })) break; await pg.waitForTimeout(100); }
      const before = await pg.evaluate(() => { const h = window.__bot.hurtsBy, s = Object.values(h).reduce((a, c) => a + c, 0); const e = G.Boss.e; e.cadT = 1e9; for (const k in G.Boss.cds) G.Boss.cds[k] = 0; return s; });
      const st = await pg.evaluate((n) => { const e = G.Boss.e; e.exps.length = 0; const ok = G.Boss.force(n); return ok; }, name);
      const t0 = Date.now(); while (Date.now() - t0 < 60000) { await pg.waitForTimeout(150); if (await pg.evaluate(() => !G.Boss.e.atk)) break; }
      await pg.waitForTimeout(800);
      const after = await pg.evaluate(() => Object.values(window.__bot.hurtsBy).reduce((a, c) => a + c, 0));
      runs++; if (after > before) { hit++; dmg += after - before; }
    }
    console.log(name, 'P' + cfg.peligro, 'fase', cfg.phase, 'golpeado', hit + '/' + runs, 'dano medio', Math.round(dmg / runs * 10) / 10);
  }
  console.log('log', JSON.stringify(await pg.evaluate(() => window.__bot.log.slice(-8)))); console.log('hurtsBy', JSON.stringify(await pg.evaluate(() => window.__bot.hurtsBy)), 'minHp', await pg.evaluate(() => window.__bot.minHp)); console.log('errs', errs.slice(0, 3)); await b.close();
})();
