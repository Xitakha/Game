// Duración de la pelea y peligrosidad de los minijefes P4.5 con el bot de balance (bot_page.js). uso:
//   node minis_ttk.js '{"base":"http://localhost:8842","runs":16,"len":9,"god":1,"ids":["carnero"],"par":4}'
// god=1: mide TTK, rotura de parte, enrage y daño por ataque (G.dbg.dmg). god=0: el jugador puede morir; se atribuye al minijefe si muere con él vivo o < 15 s después.
// Mano de referencia p50: slot 1 (3:30) suma nivel 8, slot 2 (5:30) suma 12 (README, "Minijefes v5").
const { chromium } = require('/opt/node-tools/node_modules/playwright');
const fs = require('fs');
const cfg = Object.assign({ base: 'http://localhost:8842', runs: 16, len: 9, god: 1, par: 4, ids: ['carnero', 'tejedora', 'alcaide', 'centinela', 'hidra', 'planidera', 'yeti_mayor', 'ventisquero'], speed: 20, hand1: 'spark:2,dart:2,shard:2,dagger:1,fang:1', hand2: 'spark:3,dart:3,shard:2,dagger:2,fang:2', mul: 1 }, JSON.parse(process.argv[2] || '{}'));
const botSrc = fs.readFileSync(__dirname + '/bot_page.js', 'utf8');
const SLOT = { carnero: 1, tejedora: 2, alcaide: 1, centinela: 2, hidra: 1, planidera: 2, yeti_mayor: 1, ventisquero: 2 };
const BIO = { carnero: 'bosque', tejedora: 'bosque', alcaide: 'cripta', centinela: 'cripta', hidra: 'asfodelo', planidera: 'asfodelo', yeti_mayor: 'tundra', ventisquero: 'tundra' };
async function one(b, id) {
  const ctx = await b.newContext({ viewport: { width: 640, height: 360 } }), pg = await ctx.newPage(), errs = [];
  pg.on('console', m => { if (m.type() === 'error') errs.push(m.text()); }); pg.on('pageerror', e => errs.push('PAGEERR ' + e.message));
  const t0 = (SLOT[id] === 1 ? 210 : 330) - 2;
  await pg.goto(`${cfg.base}/index.html?reset=1&dbg=1&god=${cfg.god}&len=${cfg.len}&speed=${cfg.speed}&t=${t0}&biome=${BIO[id]}&mini=${id}&hand=${SLOT[id] === 1 ? cfg.hand1 : cfg.hand2}&cmul=${cfg.mul}&nosw=1&peligro=1`);
  await pg.waitForTimeout(250); await pg.evaluate(botSrc);
  await pg.evaluate(() => { G.startGame(); });
  await pg.evaluate(() => window.installBalanceBot({ noLevel: false }));
  await pg.evaluate(() => {
    const R = window.__R = { sp: null, die: null, brokeT: null, brokeHp: null, enrT: null, dead: null, minDeadAt: null };
    const o = G.Enemies.update;
    G.Enemies.update = function (dt) {
      o.call(G.Enemies, dt);
      const m = G.enemies.find(q => q.mini); 
      if (m && m.spawnT <= 0 && R.sp == null) { R.sp = G.time; R.id = m.mid; R.hpMax = m.maxHp; }
      if (m && R.sp != null) { R.last = m; if (m.part.broken && R.brokeT == null) { R.brokeT = G.time - R.sp; R.brokeHp = 1 - m.hp / m.maxHp; } if (m.enraged && R.enrT == null) R.enrT = G.time - R.sp; }
      if (R.sp != null && R.die == null && !G.enemies.some(q => q.mini && !q.dead)) R.die = G.time - R.sp;
      if (G.player.dead && R.dead == null) R.dead = { atMini: R.die == null, since: R.die == null ? 0 : G.time - R.sp - R.die };
    };
  });
  const w0 = Date.now(); let r;
  while (Date.now() - w0 < 170000) {
    await pg.waitForTimeout(400);
    r = await pg.evaluate(() => ({ s: G.state, sp: __R.sp, die: __R.die, rt: Math.round(G.time - (__R.sp || G.time)), dead: __R.dead }));
    if (r.s === 'gameover') break;
    if (r.die != null) { const since = await pg.evaluate(() => G.time - __R.sp - __R.die); if (since > 16000) break; }
    if (r.sp != null && r.rt > 400000) break;
  }
  const res = await pg.evaluate(() => { const R = __R; const d = G.dbg.dmg, mine = {}; let tot = 0; for (const k in d) if (/^mini_/.test(k)) { mine[k] = Math.round(d[k]); tot += d[k]; } return { id: R.id, ttk: R.die == null ? null : Math.round(R.die / 1000), broke: R.brokeT == null ? null : Math.round(R.brokeT / 1000), brokeHp: R.brokeHp == null ? null : +R.brokeHp.toFixed(2), enr: R.enrT == null ? null : Math.round(R.enrT / 1000), dead: R.dead, dmg: Math.round(tot), by: mine, atk: G.dbg.atk, won: G.won, hp: Math.round(G.player.hp) }; });
  await ctx.close(); res.errs = errs.slice(0, 3); return res;
}
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--no-sandbox'] });
  const out = {};
  for (const id of cfg.ids) {
    const res = []; let n = 0;
    async function worker() { while (n < cfg.runs) { n++; try { res.push(await one(b, id)); } catch (e) { console.log('ERR', id, e.message); } } }
    await Promise.all(Array.from({ length: cfg.par }, worker));
    const tt = res.filter(r => r.ttk != null).map(r => r.ttk).sort((a, c) => a - c), q = p => tt.length ? tt[Math.min(tt.length - 1, Math.floor(p * tt.length))] : null;
    const brk = res.filter(r => r.broke != null).length, brkOk = res.filter(r => r.brokeHp != null && r.brokeHp >= 0.45 && r.brokeHp <= 0.65).length;
    const deaths = res.filter(r => r.dead && (r.dead.atMini || r.dead.since < 15000)).length;
    const dm = res.map(r => r.dmg).sort((a, c) => a - c);
    out[id] = { n: res.length, ttk: { p25: q(0.25), p50: q(0.5), p75: q(0.75) }, killed: tt.length, partBroken: brk, partMid: brkOk, enraged: res.filter(r => r.enr != null).length, deaths, dmgMed: dm[Math.floor(dm.length / 2)], dmgP90: dm[Math.floor(dm.length * 0.9)], brokeHp: res.map(r => r.brokeHp), errs: res.filter(r => r.errs.length).length };
    const atk = {}; res.forEach(r => { for (const k in r.atk || {}) if (k.indexOf('mini_' + id) === 0) atk[k.split(':')[1]] = (atk[k.split(':')[1]] || 0) + r.atk[k] / res.length; });
    out[id].atkAvg = Object.fromEntries(Object.entries(atk).map(([k, v]) => [k, +v.toFixed(1)]));
    const by = {}; res.forEach(r => { for (const k in r.by) { const kk = k.replace('mini_' + id + '_', ''); by[kk] = (by[kk] || 0) + r.by[k] / res.length; } }); out[id].byAvg = Object.fromEntries(Object.entries(by).map(([k, v]) => [k, Math.round(v)]));
    console.log(id, JSON.stringify(out[id]));
  }
  fs.writeFileSync((process.env.TTK_OUT || require('os').tmpdir()) + '/ttk_' + cfg.god + '_' + cfg.len + '.json', JSON.stringify(out));
  await b.close();
})();
