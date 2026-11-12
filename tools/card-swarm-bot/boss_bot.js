// Bot de jefes del prototipo Fusión (copia adaptada del boss-bot del original, sin tocarlo): pelea contra cada jefe con 4 poderes fijados por URL y el
// mismo bot de esquiva que play_bot.js. Dispara los poderes con AUTO (F); con sinPoderes=1 no se dan poderes (solo básico + infusiones + armas auxiliares).
//   node tools/card-swarm-bot/boss_bot.js <n_por_jefe> [jefes=pastor,karceron,letea,yarlak,melaria,cenizar] [sinPoderes=0|1] [base] [speed=4] [extra=&cmul=..]
const { chromium } = require('/opt/node-tools/node_modules/playwright');
const N = +process.argv[2] || 2, BOSSES = (process.argv[3] || 'pastor,karceron,letea,yarlak,melaria,cenizar').split(','), NOACT = process.argv[4] === '1';
const base = process.argv[5] || 'http://localhost:8811', SPEED = +process.argv[6] || 4, EXTRA = process.argv[7] || '';
// Poderes y mano por jefe (sinergias con sus debilidades, ver DESIGN-v4..v7 y card-swarm/DESIGN-fusion.md)
const SET = {
  pastor:   { act: 'forja,plasma,pacto,gas', hand: 'spark:2,dagger:2,ember:1,axe:1' },
  karceron: { act: 'tormenta,filo,plasma,iman', hand: 'shard:2,zap:2,nova:1' },
  letea:    { act: 'hemo,descarga,sed,gas', hand: 'fang:2,dart:2,bleed:1,zap:1' },
  yarlak:   { act: 'plasma,forja,pacto,tormenta', hand: 'spark:2,zap:1,dagger:2' },
  melaria:  { act: 'vapor,filo,tormenta,forja', hand: 'spark:1,shard:2,dagger:1' },
  cenizar:  { act: 'vapor,filo,tormenta,iman', hand: 'shard:2,zap:2,nova:1,dart:1' }
};
const BOT = () => {
  const inp = G.input, C = G.Cards;
  setInterval(() => {
    if (G.state === 'cards' && C.off) {
      const O = C.off; if (O.t < 450) return;
      if (O.modal) { O.modal.buttons[O.modal.buttons.length - 1].fn(); O.modal = null; return; }
      if (O.replacing) { let bi = 0, bl = 9; G.player.hand.forEach((h, i) => { if (h && h.lvl < bl) { bl = h.lvl; bi = i; } }); C.replace(bi); return; }
      let best = 0, bs = -1; O.cards.forEach((id, i) => { const d = C.def(id); let s = d.type === 'attack' ? 3 : 1.2; if (C.slotOf(id)) s += 1.5; if (id === 'heart') s += 2; if (s > bs) { bs = s; best = i; } });
      C.pick(best); if (O.modal) { const f = O.modal.buttons.find(b => /A LA MANO/.test(b.label)); O.modal = null; if (f) f.fn(); } return;
    }
    if (G.state !== 'play') return;
    const p = G.player; let ax = 0, ay = 0;
    for (const e of G.enemies) { if (e.dead || e.spawnT > 0) continue; const dx = p.x - e.x, dy = p.y - e.y, d = Math.hypot(dx, dy); if (d < 260 && d > 0) { const w = (e.type === 'boss' ? 2.5 : 1) * (260 - d) / 260 / d; ax += dx * w; ay += dy * w; } }
    for (const q of G.projectiles) { if (q.team === 'p') continue; const dx = p.x - q.x, dy = p.y - q.y, d = Math.hypot(dx, dy); if (d < 140 && d > 0) { ax += dx / d * (140 - d) / 60; ay += dy / d * (140 - d) / 60; } }
    ax += (G.AW / 2 - p.x) * 0.0015; ay += (G.AH / 2 - p.y) * 0.0015;
    if (p.x < 90) ax += 2; if (p.x > G.AW - 90) ax -= 2; if (p.y < 90) ay += 2; if (p.y > G.AH - 90) ay -= 2;
    inp.keys.KeyA = ax < -0.15; inp.keys.KeyD = ax > 0.15; inp.keys.KeyW = ay < -0.15; inp.keys.KeyS = ay > 0.15;
    if (!window.__noact) G.Fusion.auto = true;
  }, 80);
};
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--no-sandbox', '--autoplay-policy=no-user-gesture-required'] });
  const all = {};
  const jobs = []; for (const bo of BOSSES) { all[bo] = []; for (let g = 0; g < N; g++) jobs.push([bo, g]); }
  let nj = 0;
  async function worker() {
    while (nj < jobs.length) {
      const [bo, g] = jobs[nj++], S = SET[bo];
      try {
      const ctx = await b.newContext({ viewport: { width: 844, height: 390 }, hasTouch: true, isMobile: true }), pg = await ctx.newPage(); const errs = [];
      pg.on('console', m => { if (m.type() === 'error') errs.push(m.text()); }); pg.on('pageerror', e => errs.push('PAGEERR ' + e.message));
      const q = (bo === 'cenizar' ? 'assault=1' : 'boss=' + bo) + '&nointro=1&prep=0&noprep=1&direct=1&all=1&reset=1&speed=' + SPEED + '&hand=' + S.hand + (NOACT ? '' : '&actives=' + (process.env.ACT || S.act)) + (process.env.SEED ? '&seed=' + (+process.env.SEED + g) : '') + EXTRA;
      await pg.goto(`${base}/index.html?nosw=1&${q}`); await pg.waitForTimeout(500);
      await pg.evaluate(n => { window.__noact = n; }, NOACT); await pg.evaluate(BOT);
      const t0 = Date.now(); let r = null;
      while (Date.now() - t0 < 360000) {
        await pg.waitForTimeout(1000);
        r = await pg.evaluate(() => { const e = G.Enemies.boss(); return { st: G.state, t: Math.round(G.runT / 1000), won: G.won, hp: Math.round(G.player.hp), boss: e ? Math.round(e.hp / e.maxHp * 100) : null, uses: G.Fusion.stats.uses }; });
        if (r.st === 'gameover') break;
      }
      r.arm = await pg.evaluate(() => ({ blocked: Math.round(G.Armor.run.blocked), raw: Math.round(G.Armor.run.raw) })).catch(() => ({ blocked: 0, raw: 0 }));
      all[bo].push(r); console.log(`${bo} #${g + 1}: ${r.st === 'gameover' ? (r.won ? 'VICTORIA' : 'muerte') : 'sin fin'} t=${r.t}s bossHp=${r.boss}% usos=${JSON.stringify(r.uses)} errs=${errs.length}`);
      await pg.close(); await ctx.close();
      } catch (ex) { console.log('ERR', bo, g, ex.message); }
    }
  }
  await Promise.all(Array.from({ length: Math.min(+process.env.PAR || 1, jobs.length) }, worker));
  BOSSES.forEach(bo => { const a = all[bo], ts = a.map(x => x.t), m = ts.reduce((x, y) => x + y, 0) / ts.length, bl = a.reduce((x, y) => x + y.arm.blocked, 0), rw = a.reduce((x, y) => x + y.arm.raw, 0); console.log(`  ${bo}: victorias ${a.filter(x => x.won).length}/${a.length}, t medio ${Math.round(m)}s, evitado ${rw ? Math.round(100 * bl / rw) : 0} %`); });
  console.log('RESUMEN jefes (sinPoderes=' + NOACT + '): ' + BOSSES.map(bo => bo + ' ' + all[bo].filter(x => x.won).length + '/' + N).join('  '));
  await b.close();
})();
