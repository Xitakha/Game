// uso: node run.js '{"base":"http://localhost:8771","len":7,"runs":4,"speed":20,"par":4,"label":"after"}'
// opts: hand ("fang:3,spark:3"), noLevel, god(1), maxWall (s), t (segundo inicial)
const { chromium } = require('/opt/node-tools/node_modules/playwright');
const fs = require('fs');
const cfg = Object.assign({ base: 'http://localhost:8771', len: 7, runs: 4, speed: 20, par: 4, hand: '', noLevel: false, god: 1, hpBoost: 0, maxWall: 420, t: 0, label: '' }, JSON.parse(process.argv[2] || '{}'));
const botSrc = fs.readFileSync(__dirname + '/bot_page.js', 'utf8');
async function one(b, i) {
  const ctx = await b.newContext({ viewport: { width: 640, height: 360 } });
  const pg = await ctx.newPage(); const errs = [];
  pg.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
  pg.on('pageerror', e => errs.push('PAGEERR ' + e.message));
  await pg.goto(`${cfg.base}/index.html?reset=1&dbg=1&god=${cfg.god}&len=${cfg.len}&speed=${cfg.speed}&t=${cfg.t}${cfg.hand ? '&hand=' + cfg.hand : ''}`);
  await pg.waitForTimeout(300);
  await pg.evaluate(botSrc);
  await pg.evaluate(() => { G.startGame(); });
  await pg.evaluate(o => window.installBalanceBot(o), { noLevel: cfg.noLevel, hpBoost: cfg.hpBoost });
  const t0 = Date.now(); let st;
  while (Date.now() - t0 < cfg.maxWall * 1000) {
    await pg.waitForTimeout(500);
    st = await pg.evaluate(() => ({ s: G.state, rt: Math.round((G.runT - G.t0) / 1000), boss: !!G.Enemies.boss() }));
    if (st.s === 'gameover') break;
  }
  const res = await pg.evaluate(() => {
    const M = window.__m, L = G.Loot, R = L.run, sm = L.summary;
    const sp = {}; for (const k in M.sp) sp[k] = M.sp[k].n ? { r: +(M.sp[k].r / M.sp[k].n).toFixed(3), a: +(M.sp[k].a / M.sp[k].n).toFixed(1) } : null;
    return { state: G.state, won: G.won, runT: Math.round((G.time - G.t0) / 1000), lvl: G.player.level, kills: G.kills, hand: G.finalHand ? G.finalHand.hand.map(h => h && h.id + h.lvl).join(',') : G.player.hand.map(h => h && h.id + h.lvl).join(','),
      min: M.min, buildT: M.buildT, full5T: M.full5T, bossT: M.bossSeenT, mini: M.mini, sp, heal: G.dbg.heal || {}, parts: R.parts, total: R.total, rare: R.rare, pf: R.pf, brasas: sm && sm.brasas, err: M.err,
      craft: sm ? window.craftSim() : null, dmg: G.dbg.dmg, atk: G.dbg.atk || {} };
  });
  await ctx.close();
  res.wall = Math.round((Date.now() - t0) / 1000); res.errs = errs.slice(0, 3); res.i = i;
  return res;
}
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--no-sandbox', '--autoplay-policy=no-user-gesture-required'] });
  const results = []; let next = 0;
  async function worker() { while (next < cfg.runs) { const i = next++; try { const r = await one(b, i); results.push(r); console.log('RUN', JSON.stringify({ i, state: r.state, runT: r.runT, lvl: r.lvl, hand: r.hand, buildT: r.buildT, full5T: r.full5T, total: r.total, craft: r.craft && [r.craft.cards, r.craft.talents], errs: r.errs, err: r.err, wall: r.wall })); } catch (e) { console.log('ERR', i, e.message); } } }
  await Promise.all(Array.from({ length: Math.min(cfg.par, cfg.runs) }, worker));
  fs.writeFileSync(`/tmp/claude-0/-home-user-Game/ac8df0e6-87e6-5837-9d6a-fa8dcc4300ed/scratchpad/res_${cfg.label || 'x'}_${cfg.len}.json`, JSON.stringify({ cfg, results }));
  await b.close();
})();
