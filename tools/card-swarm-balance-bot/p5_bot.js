// BOT EN EL PANAL (P5): runs del bot de balance SIN god (y sin jefe) en un bioma; reporta supervivencia, causa de daño (G.dbg.dmg), miel (celdas abiertas, tiempo del jugador sobre miel), humo y censo por minuto.
// uso: node p5_bot.js '{"base":"http://localhost:8793","biome":"panal","runs":16,"par":4,"speed":20,"len":9,"god":0,"bot":"base|ice","fam":"","q":"","extra":"","label":"x","out":""}'
const { chromium } = require('/opt/node-tools/node_modules/playwright');
const fs = require('fs');
const cfg = Object.assign({ base: 'http://localhost:8793', biome: 'panal', runs: 16, par: 4, speed: 20, len: 9, god: 0, bot: 'base', fam: '', q: '', extra: '', label: 'x', out: '', maxWall: 600, stop: 0 }, JSON.parse(process.argv[2] || '{}'));
const botSrc = fs.readFileSync(__dirname + '/bot_page.js', 'utf8'), cenSrc = fs.readFileSync(__dirname + '/census_page.js', 'utf8');
const iceSrc = cfg.bot === 'ice' ? fs.readFileSync(__dirname + '/bot_ice.js', 'utf8') : '';
async function one(b, i) {
  const ctx = await b.newContext({ viewport: { width: 640, height: 360 } }), pg = await ctx.newPage(), errs = [];
  pg.on('console', m => { if (m.type() === 'error') errs.push(m.text()); }); pg.on('pageerror', e => errs.push('PAGEERR ' + e.message));
  const q = `reset=1&dbg=1&god=${cfg.god}&len=${cfg.len}&speed=${cfg.speed}&biome=${cfg.biome}&nobos=1` + (cfg.fam !== '' ? '&fam=' + cfg.fam : '') + (cfg.q ? '&q=' + cfg.q : '') + cfg.extra;
  await pg.goto(`${cfg.base}/index.html?${q}`); await pg.waitForTimeout(300);
  await pg.evaluate(botSrc); await pg.evaluate(cenSrc); await pg.evaluate(() => { G.startGame(); });
  await pg.evaluate(() => { window.installBalanceBot({}); window.installCensus(); window.__pan = { honeyT: 0, peakHoney: 0, smokes: 0, validOk: true, conn: true }; var lastC = 0; setInterval(function () { if (G.state !== 'play') return; var P = G.Panal, v = P.validate(); window.__pan.peakHoney = Math.max(window.__pan.peakHoney, v.honey); if (!v.ok) window.__pan.validOk = false; if (!v.connected) window.__pan.conn = false; if (P.honeyAt(G.player.x, G.player.y)) window.__pan.honeyT += 0.25; if (P.clouds.length > lastC) window.__pan.smokes += P.clouds.length - lastC; lastC = P.clouds.length; }, 250); });
  if (iceSrc) { await pg.evaluate(iceSrc); await pg.evaluate(() => window.installIceBot({})); }
  const t0 = Date.now();
  while (Date.now() - t0 < cfg.maxWall * 1000) { await pg.waitForTimeout(500); const st = await pg.evaluate(() => ({ s: G.state, t: (G.time - G.t0) / 1000 })); if (st.s === 'gameover' || (cfg.stop && st.t >= cfg.stop)) break; }
  const res = await pg.evaluate(() => ({ census: window.__census, state: G.state, won: G.won, t: Math.round((G.time - G.t0) / 1000), kills: G.kills, lvl: G.player.level, dmg: G.dbg && G.dbg.dmg, cold: window.__pan || {}, hp: Math.round(G.player.hp), fam: !!G.B.famOf() }));
  await ctx.close(); res.errs = errs.slice(0, 5); res.wall = Math.round((Date.now() - t0) / 1000); res.i = i; return res;
}
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--no-sandbox', '--autoplay-policy=no-user-gesture-required'] });
  const results = []; let next = 0;
  async function worker() { while (next < cfg.runs) { const i = next++; try { const r = await one(b, i); results.push(r); console.log('RUN', JSON.stringify({ i, state: r.state, won: r.won, t: r.t, kills: r.kills, cold: r.cold, errs: r.errs.length, wall: r.wall })); } catch (e) { console.log('ERR', i, e.message); } } }
  await Promise.all(Array.from({ length: Math.min(cfg.par, cfg.runs) }, worker));
  const T = results.map(r => r.t).sort((a, c) => a - c), surv = results.filter(r => r.won || r.t >= cfg.len * 60 - 1).length;
  const dmg = {}; results.forEach(r => { for (const k in (r.dmg || {})) dmg[k] = (dmg[k] || 0) + r.dmg[k]; }); const dt = Object.values(dmg).reduce((a, c) => a + c, 0) || 1;
  console.log(`RESUMEN ${cfg.label}: ${results.length} runs, sobreviven a ${cfg.len} min: ${surv} (${Math.round(100 * surv / results.length)} %), muerte mediana ${T[Math.floor(T.length / 2)]} s, media ${Math.round(T.reduce((a, c) => a + c, 0) / T.length)} s`);
  console.log('daño por fuente (%): ' + Object.keys(dmg).sort((a, c) => dmg[c] - dmg[a]).slice(0, 12).map(k => k + ' ' + Math.round(100 * dmg[k] / dt)).join(', '));
  console.log('Panal: celdas de miel pico ' + Math.max.apply(null, results.map(r => r.cold.peakHoney || 0)) + ', s del jugador sobre miel por run ' + Math.round(results.reduce((a, r) => a + (r.cold.honeyT || 0), 0) / results.length) + ', invariantes ok en ' + results.filter(r => r.cold.validOk && r.cold.conn).length + '/' + results.length + ' runs');
  // censo por minuto (medias)
  const mins = {}; results.forEach(r => { const C = r.census && r.census.min || {}; for (const m in C) { const S = mins[m] || (mins[m] = { n: 0, alive: 0, t: [0, 0, 0, 0], runs: 0 }); S.n += C[m].n; S.alive += C[m].alive; S.runs++; for (let k = 0; k < 4; k++) S.t[k] += C[m].byTier[k]; } });
  console.log('censo por minuto (vivos medios; % por tier T0/T1/T2/T3; runs vivas): ' + Object.keys(mins).sort((a, c) => a - c).map(m => { const S = mins[m], tot = S.t.reduce((a, c) => a + c, 0) || 1; return m + ':' + (S.alive / (S.n || 1)).toFixed(0) + ' ' + S.t.map(x => Math.round(100 * x / tot)).join('/') + ' n' + S.runs; }).join(' | '));
  if (cfg.out) fs.writeFileSync(cfg.out, JSON.stringify({ cfg, results }));
  await b.close();
})();
