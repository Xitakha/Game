// Línea base: el MISMO bot de esquiva sobre el juego ORIGINAL (games/card-swarm servido en otro puerto), para comparar con play_bot.js.
//   python3 tools/serve.py card-swarm 8812 &   node tools/card-swarm-fusion-bot/baseline_bot.js <n> [base=http://localhost:8812]
const { chromium } = require('/opt/node-tools/node_modules/playwright');
const N = +process.argv[2] || 3, base = process.argv[3] || 'http://localhost:8812';
const PAR = +process.env.PAR || 1;
const BOT = () => {
  const inp = G.input, C = G.Cards;
  window.__log = { hb: {}, samples: [] };
  const oheal = G.Player.heal; G.Player.heal = function (p, n, src) { const b0 = p.hp; oheal.call(G.Player, p, n, src); const k = src || '?'; window.__log.hl = window.__log.hl || {}; window.__log.hl[k] = (window.__log.hl[k] || 0) + (p.hp - b0); };
  const oh = G.Player.hurt; G.Player.hurt = function (p, dmg, sx, sy, o) { const h0 = p.hp, r = oh.call(G.Player, p, dmg, sx, sy, o); if (r) { const k = (o && o.src) || '?'; window.__log.hb[k] = (window.__log.hb[k] || 0) + (h0 - p.hp); } return r; };
  let lastS = -99; setInterval(() => { const t = G.runT / 1000; if (G.state === 'play' && t - lastS >= 20) { lastS = t; window.__log.samples.push([Math.round(t), Math.round(G.player.hp), G.player.level, 0, G.enemies.length]); } }, 500);
  setInterval(() => {
    if (G.state === 'cards' && C.off) {
      const O = C.off; if (O.t < 450) return;
      if (O.replacing) { let bi = 0, bl = 9; G.player.hand.forEach((h, i) => { if (h && h.lvl < bl) { bl = h.lvl; bi = i; } }); C.replace(bi); return; }
      let best = 0, bs = -1;
      O.cards.forEach((id, i) => { const d = C.def(id); let s = d.type === 'attack' ? 3 : 1.2; if (C.newCombos(d.tag).length) s += 3; if (C.slotOf(id)) s += 1.5; if (id === 'heart') s += 2; if (s > bs) { bs = s; best = i; } });
      C.pick(best); return;
    }
    if (G.state !== 'play') return;
    const p = G.player; let ax = 0, ay = 0;
    for (const e of G.enemies) { if (e.dead || e.spawnT > 0) continue; const dx = p.x - e.x, dy = p.y - e.y, d = Math.hypot(dx, dy); if (d < 260 && d > 0) { const w = (e.type === 'boss' ? 2.5 : 1) * (260 - d) / 260 / d; ax += dx * w; ay += dy * w; } }
    for (const q of G.projectiles) { if (q.team === 'p') continue; const dx = p.x - q.x, dy = p.y - q.y, d = Math.hypot(dx, dy); if (d < 140 && d > 0) { ax += dx / d * (140 - d) / 60; ay += dy / d * (140 - d) / 60; } }
    if (window.__gems !== 0 && Math.hypot(ax, ay) < 0.35) { let bd = 380, bg = null; for (const g of G.gems) { if (g.kind === 'part') continue; const d = Math.hypot(g.x - p.x, g.y - p.y); if (d < bd) { bd = d; bg = g; } } if (bg) { ax += (bg.x - p.x) / bd * 0.8; ay += (bg.y - p.y) / bd * 0.8; } }   // recoge gemas cuando no hay peligro cerca (como un jugador); ?gems=0 en window.__gems lo apaga
    ax += (G.AW / 2 - p.x) * 0.0015; ay += (G.AH / 2 - p.y) * 0.0015;
    if (p.x < 90) ax += 2; if (p.x > G.AW - 90) ax -= 2; if (p.y < 90) ay += 2; if (p.y > G.AH - 90) ay -= 2;
    inp.keys.KeyA = ax < -0.15; inp.keys.KeyD = ax > 0.15; inp.keys.KeyW = ay < -0.15; inp.keys.KeyS = ay > 0.15;
  }, 80);
};
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--no-sandbox', '--autoplay-policy=no-user-gesture-required'] });
  const res = []; let next = 0;
  async function one(g) {
    const ctx = await b.newContext({ viewport: { width: 844, height: 390 }, hasTouch: true, isMobile: true }), pg = await ctx.newPage();
    await pg.goto(`${base}/index.html?nosw=1&reset=1&speed=4`); await pg.waitForTimeout(600);
    await pg.evaluate(() => { G.startGame(); }); await pg.evaluate(BOT);
    const t0 = Date.now(); let r = null;
    while (Date.now() - t0 < 600000) { await pg.waitForTimeout(1000); r = await pg.evaluate(() => ({ st: G.state, t: Math.round(G.runT / 1000), won: G.won, lvl: G.player.level, kills: G.kills, boss: G.Enemies.boss() ? Math.round(G.Enemies.boss().hp / G.Enemies.boss().maxHp * 100) : null, log: window.__log })); if (r.st === 'gameover') break; }
    res.push(r);
    const hb = Object.entries(r.log.hb).sort((a, c) => c[1] - a[1]).slice(0, 4).map(([k, v]) => k + ':' + Math.round(v)).join(',');
    console.log(`base ${g + 1}: ${r.st === 'gameover' ? (r.won ? 'VICTORIA' : 'muerte') : 'sin fin'} t=${r.t}s nv=${r.lvl} kills=${r.kills} boss=${r.boss} dano=${hb} cura=${JSON.stringify(Object.fromEntries(Object.entries(r.log.hl || {}).map(([k, v]) => [k, Math.round(v)])))} hp20s=${r.log.samples.map(x => x[1]).join("/")} n20s=${r.log.samples.map(x => x[4]).join("/")} lv20s=${r.log.samples.map(x => x[2]).join("/")}`);
    await pg.close(); await ctx.close();
  }
  async function worker() { while (next < N) { const g = next++; try { await one(g); } catch (e) { console.log('ERR', g, e.message); } } }
  await Promise.all(Array.from({ length: Math.min(PAR, N) }, worker));
  const ts = res.map(x => x.t), m = ts.reduce((a, x) => a + x, 0) / ts.length, sd = Math.sqrt(ts.reduce((a, x) => a + (x - m) * (x - m), 0) / Math.max(1, ts.length - 1));
  console.log(`RESUMEN original: n=${res.length} victorias ${res.filter(x => x.won).length}/${res.length}, tiempo ${Math.round(m)} +- ${Math.round(sd)}s (ee ${Math.round(sd / Math.sqrt(ts.length))}) min ${Math.min(...ts)}`);
  await b.close();
})();
