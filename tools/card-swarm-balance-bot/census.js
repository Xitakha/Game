// CENSO: recorre N runs con el bot de balance y guarda los vivos por minuto / rol / tier / familia (A.2). Compararlo con census_compare.js.
// uso: node census.js '{"base":"http://localhost:8791","len":9,"runs":4,"speed":20,"par":4,"fam":"0","mat":"","biome":"","label":"fam0"}'
//   fam: ""(auto) | "0" | "1"   mat: ""|"1"|"0"   biome: ""|bosque|cripta|asfodelo   out (opcional): ruta del JSON   stop (s de partida a los que parar; 0 = hasta el final)
const { chromium } = require('/opt/node-tools/node_modules/playwright');
const fs = require('fs');
const cfg = Object.assign({ base: 'http://localhost:8791', len: 9, runs: 4, speed: 20, par: 4, fam: '', mat: '', biome: '', label: 'x', god: 1, maxWall: 420, stop: 0, out: '' }, JSON.parse(process.argv[2] || '{}'));
const botSrc = fs.readFileSync(__dirname + '/bot_page.js', 'utf8'), cenSrc = fs.readFileSync(__dirname + '/census_page.js', 'utf8');
const OUT = cfg.out || (process.env.CENSUS_DIR || '/tmp') + '/census_' + cfg.label + '.json';
async function one(b, i) {
  const ctx = await b.newContext({ viewport: { width: 640, height: 360 } }), pg = await ctx.newPage(), errs = [];
  pg.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
  pg.on('pageerror', e => errs.push('PAGEERR ' + e.message));
  const q = `reset=1&dbg=1&god=${cfg.god}&len=${cfg.len}&speed=${cfg.speed}` + (cfg.fam !== '' ? '&fam=' + cfg.fam : '') + (cfg.mat !== '' ? '&mat=' + cfg.mat : '') + (cfg.biome ? '&biome=' + cfg.biome : '');
  await pg.goto(`${cfg.base}/index.html?${q}`); await pg.waitForTimeout(300);
  await pg.evaluate(botSrc); await pg.evaluate(cenSrc);
  await pg.evaluate(() => { G.startGame(); });
  await pg.evaluate(() => { window.installBalanceBot({}); window.installCensus(); });
  const t0 = Date.now();
  while (Date.now() - t0 < cfg.maxWall * 1000) {
    await pg.waitForTimeout(500);
    const st = await pg.evaluate(() => ({ s: G.state, t: (G.time - G.t0) / 1000 }));
    if (st.s === 'gameover' || (cfg.stop && st.t >= cfg.stop)) break;
  }
  const res = await pg.evaluate(() => ({ census: window.__census, allow: window.censusAllowCheck(), state: G.state, won: G.won, t: Math.round((G.time - G.t0) / 1000), kills: G.kills, parts: G.Loot.run.total, lvl: G.player.level, fam: !!G.B.famOf(), biome: G.curBiome }));
  await ctx.close(); res.errs = errs.slice(0, 5); res.wall = Math.round((Date.now() - t0) / 1000); res.i = i;
  return res;
}
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--no-sandbox', '--autoplay-policy=no-user-gesture-required'] });
  const results = []; let next = 0;
  async function worker() { while (next < cfg.runs) { const i = next++; try { const r = await one(b, i); results.push(r); console.log('RUN', JSON.stringify({ i, state: r.state, won: r.won, t: r.t, fam: r.fam, biome: r.biome, kills: r.kills, errs: r.errs, wall: r.wall })); } catch (e) { console.log('ERR', i, e.message); } } }
  await Promise.all(Array.from({ length: Math.min(cfg.par, cfg.runs) }, worker));
  fs.writeFileSync(OUT, JSON.stringify({ cfg, results })); console.log('guardado', OUT);
  await b.close();
})();
