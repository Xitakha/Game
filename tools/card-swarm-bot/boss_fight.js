// COPIA de tools/card-swarm-clasico-boss-bot/fight.js (el original no se toca) para la Fusión: cfg.fusion=true usa ?actives=<poderes>&all=1&direct=1; mismo bot esquivador (dodge_fusion.js, con AUTO).
// uso: node boss_fight.js '{"fusion":true,"boss":"pastor","port":8811,"hand":"spark:3,dart:2,shard:2,dagger:2,fang:1","actives":"forja,plasma,pacto,gas","runs":8,"par":4,"speed":12,"noLevel":true}'
// uso: (jefes: "boss":"pastor|karceron|letea", "port":8765) node fight.js '{"hand":"spark:3,ember:3","runs":4,"speed":6,"react":250,"mistakes":0.1,"peligro":1,"par":4,"len":9,"dist":250}'
const { launch } = require('../lib/browser.js');
const fs = require('fs');
const cfg = Object.assign({ hand: 'spark:3,ember:3,dart:3,shard:2,ring:1', runs: 4, speed: 6, react: 250, mistakes: 0.1, peligro: 1, par: 4, len: 9, dist: 250, every: 100, maxSim: 420, extra: '', full: false, noLevel: false, inattn: 0, hp0: 100, hpcal: 0, burst: null, horizon: 1600, profile: 'fresh', anchors: '', boss: 'pastor', port: 8765, nogod: false }, JSON.parse(process.argv[2] || '{}'));
const botSrc = fs.readFileSync(__dirname + '/dodge_fusion.js', 'utf8');
async function one(b, i) {
  const pg = await b.newPage({ viewport: { width: 960, height: 540 } });
  const errs = [];
  pg.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
  pg.on('pageerror', e => errs.push('PAGEERR ' + e.message + ' @ ' + (e.stack || '').split('\n').slice(1, 5).join(' | ')));
  const url = cfg.fusion ? `http://localhost:${cfg.port}/index.html?dev=1&nosw=1&direct=1&all=1&reset=1&nointro=1&prep=0&speed=${cfg.speed}&peligro=${cfg.peligro}&hand=${cfg.hand}${cfg.actives ? '&actives=' + cfg.actives : ''}${cfg.boss === 'cenizar' ? '&assault=1' : '&boss=' + cfg.boss}${cfg.extra}` : cfg.full ? `http://localhost:${cfg.port}/index.html?dev=1&reset=1&len=${cfg.len}&speed=${cfg.speed}&peligro=${cfg.peligro}${cfg.hpcal ? '&hpcal=' + cfg.hpcal : ''}${cfg.extra}` : `http://localhost:${cfg.port}/index.html?dev=1&boss=${cfg.boss}&reset=1&len=${cfg.len}&hand=${cfg.hand}&speed=${cfg.speed}&peligro=${cfg.peligro}${cfg.hpcal ? '&hpcal=' + cfg.hpcal : ''}${cfg.extra}`;
  await pg.addInitScript(() => { });
  await pg.goto(url + (process.env.SEED ? '&seed=' + (+process.env.SEED + i) : ''));   // SEED=<n>: partida i usa la semilla n+i
  if (cfg.full) {
    await pg.evaluate(([prof, anc]) => {
      const D = G.Save.data, mid = ['ember','ring','nova','zap','pool','bleed','thorns','mantle','frost','whet','hooves','magnet','cloud','bile','heart','satchel'];
      const all = G.Cards.defs.map(d => d.id).filter(Boolean);
      if (prof === 'mid') mid.forEach(id => D.cards[id] = 1);
      if (prof === 'mid2') { mid.forEach(id => D.cards[id] = 2); }
      if (prof === 'strong') all.forEach(id => D.cards[id] = 3);
      if (anc) D.anchors = anc.split(',');
      G.Tree.sync && G.Tree.sync();
    }, [cfg.profile, cfg.anchors]);
    await pg.evaluate(() => { G.startGame(); });
  }
  await pg.evaluate(botSrc);
  await pg.evaluate((o) => { window.installBot(o); }, { react: cfg.react, mistakes: cfg.mistakes, dist: cfg.dist, every: cfg.every, godUntilBoss: !cfg.nogod, noPowers: !!cfg.noPowers, noLevel: cfg.noLevel, inattn: cfg.inattn, hp0: cfg.hp0, burst: cfg.burst != null ? !!cfg.burst : cfg.boss === 'cenizar', horizon: cfg.horizon || (cfg.boss === 'cenizar' ? 2800 : 1600) });
  const ph = []; let last = null, res = null; const t0 = Date.now();
  const frames = [];
  while (Date.now() - t0 < 600000) {
    await pg.waitForTimeout(400);
    const s = await pg.evaluate(() => ({ st: G.state, won: G.won, info: G.Boss.info(), hp: G.player.hp, dead: G.player.dead, bd: G.bossDead, time: G.time, bot: window.__bot && { hb: window.__bot.hurtsBy, err: window.__bot.err, minHp: window.__bot.minHp } }));
    if (s.info) { if (!last || last.phase !== s.info.phase || last.mode !== s.info.mode) ph.push([s.info.mode + s.info.phase, s.info.combatT]); last = s.info; }
    if (s.st === 'gameover') { res = s; break; }
    if (s.info && s.info.combatT > cfg.maxSim * 1000) { res = Object.assign(s, { timeout: true }); break; }
  }
  const fin = await pg.evaluate(() => ({ hand: G.finalHand && G.finalHand.hand.map(h => h && (h.id + h.lvl)).join(','), lvl: G.player.level, kills: G.kills, won: G.won, info: G.Boss.info(), summary: G.Loot.summary && G.Loot.summary.boss, bot: window.__bot && { hb: window.__bot.hurtsBy, minHp: window.__bot.minHp, err: window.__bot.err, log: window.__bot.log }, hp: G.player.hp, parts: G.Boss.e && G.Boss.e.partsBroken, combat: G.Boss.combatT, tEnd: Math.round((G.time - (G.t0 || 0)) / 1000), boss: !!(G.Boss.e && G.Boss.e.mode !== 'intro') }));
  await pg.close();
  return { i, tEnd: fin.tEnd, bossSeen: fin.boss, hand: fin.hand, lvl: fin.lvl, kills: fin.kills, won: !!fin.won, combatT: Math.round(fin.combat / 1000), bossHp: fin.info && fin.info.hp, parts: fin.parts, phases: ph, hb: fin.bot && fin.bot.hb, minHp: fin.bot && Math.round(fin.bot.minHp), log: fin.won ? undefined : (fin.bot && fin.bot.log), err: fin.bot && fin.bot.err, errs: errs.slice(0, 2), timeout: !!(res && res.timeout), wall: Math.round((Date.now() - t0) / 1000) };
}
(async () => {
  const b = await launch({ args: ['--no-sandbox', '--autoplay-policy=no-user-gesture-required'] });
  const results = []; let next = 0;
  async function worker() { while (next < cfg.runs) { const i = next++; try { const r = await one(b, i); results.push(r); console.log(JSON.stringify(r)); } catch (e) { console.log('ERR', i, e.message); } } }
  await Promise.all(Array.from({ length: Math.min(cfg.par, cfg.runs) }, worker));
  const w = results.filter(r => r.won).length;
  const durs = results.filter(r => r.won).map(r => r.combatT).sort((a, c) => a - c);
  console.log('RESUMEN', JSON.stringify(cfg), 'victorias', w + '/' + results.length, 'dur victorias', durs.join(','), 'dur todas', results.map(r => r.combatT).join(','));
  const agg = {}; results.forEach(r => { for (const k in (r.hb || {})) agg[k] = (agg[k] || 0) + r.hb[k]; });
  Object.keys(agg).forEach(k => agg[k] = Math.round(agg[k] / results.length));
  console.log('DANO medio por run', JSON.stringify(agg), 'minHp medio', Math.round(results.reduce((a, r) => a + (r.minHp || 0), 0) / results.length));
  await b.close();
})();
