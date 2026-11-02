// PERFIL P8: fps y coste por función (perfilador CDP) en las peleas de cada jefe y en la horda del Panal. Chromium sin GPU.
// uso: node p8_perf.js [base=http://localhost:8791] [escenarios=pastor,melaria,yarlak,cenizar,panal_horda] [calidad=auto|alta|media|baja] [perfil=0|1] [segundos=5]
const { chromium } = require('/opt/node-tools/node_modules/playwright');
const base = process.argv[2] || 'http://localhost:8791', ESC = (process.argv[3] || 'pastor,melaria,yarlak,cenizar,panal_horda').split(','), Q = process.argv[4] || 'alta', PROF = process.argv[5] === '1', SEC = +(process.argv[6] || 5);
const HAND = 'spark:3,dart:3,shard:2,dagger:2,fang:2';
const URL = { pastor: `boss=pastor&phase=2`, melaria: `boss=melaria&phase=2`, yarlak: `boss=yarlak&phase=2`, cenizar: `boss=cenizar&phase=3`, karceron: `boss=karceron&phase=2`, letea: `boss=letea&phase=2`, panal_horda: `t=380&biome=panal`, tundra_horda: `t=380&biome=tundra` };
const FPS = (pg, s) => pg.evaluate(s => new Promise(res => { let n = 0, max = 0, last = performance.now(); const t0 = last; (function f() { const now = performance.now(); max = Math.max(max, now - last); last = now; n++; if (now - t0 < s * 1000) requestAnimationFrame(f); else res({ fps: n / s, worst: max }); })(); }), s);
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--no-sandbox', '--autoplay-policy=no-user-gesture-required'] });
  for (const sc of ESC) {
    const ctx = await b.newContext({ viewport: { width: 960, height: 540 } }), pg = await ctx.newPage(), errs = [];
    pg.on('pageerror', e => errs.push(e.message)); pg.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
    await pg.goto(`${base}/index.html?reset=1&god=1&nosw=1&nointro=1&prep=0&hand=${HAND}&speed=1&${process.env.PERF_EXTRA || ''}&${URL[sc]}`); await pg.waitForTimeout(600);
    if (!/^(pastor|melaria|yarlak|cenizar|karceron|letea)$/.test(sc)) await pg.evaluate(() => { G.startGame(); });
    await pg.evaluate((q) => { setInterval(() => { G.pendingLevels = 0; if (G.state === 'cards') G.state = 'play'; }, 50); if (q !== 'auto' && G.Sys && G.Sys.setQuality) G.Sys.setQuality(q); else if (q === 'auto') { } }, Q);
    if (Q !== 'auto') await pg.evaluate(q => { const S = G.Sys; if (S.qMode !== undefined) { S.qMode = q; } }, Q).catch(() => {});
    await pg.waitForTimeout(4500);
    const cdp = await ctx.newCDPSession(pg);
    if (PROF) { await cdp.send('Profiler.enable'); await cdp.send('Profiler.setSamplingInterval', { interval: 200 }); await cdp.send('Profiler.start'); }
    const f = await FPS(pg, SEC);
    let top = '';
    if (PROF) {
      const { profile } = await cdp.send('Profiler.stop'); const self = {}, byId = {}; profile.nodes.forEach(n => byId[n.id] = n);
      const dt = profile.timeDeltas; const tot = dt.reduce((a, c) => a + c, 0);
      profile.samples.forEach((id, i) => { const n = byId[id], k = n.callFrame.functionName + '@' + (n.callFrame.url.split('/').pop() || '') + ':' + n.callFrame.lineNumber; self[k] = (self[k] || 0) + dt[i]; });
      top = Object.entries(self).sort((a, c) => c[1] - a[1]).slice(0, 12).map(([k, v]) => `${(v / 1000 / SEC).toFixed(1)} ms/s ${k}`).join('\n      ');
    }
    const info = await pg.evaluate(() => ({ q: G.Q && G.Q.level, st: G.state, boss: G.Boss.e && G.Boss.e.id, en: G.enemies.length, ms: G.Boss.melariaInfo && G.Boss.e && G.Boss.e.id === 'melaria' ? G.Boss.melariaInfo().drawMs : null }));
    console.log(sc.padEnd(12), 'fps', f.fps.toFixed(1), 'peor fotograma', f.worst.toFixed(0), 'ms', JSON.stringify(info), errs.length ? 'ERR ' + errs[0] : '');
    if (top) console.log('      ' + top);
    await ctx.close();
  }
  await b.close();
})();
