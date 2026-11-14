#!/usr/bin/env node
// Mide la carga inicial de un servidor local: peticiones, bytes, bytes con gzip y tiempos (mediana de N cargas, caché fría).
// Uso: node tools/build/measure.js http://localhost:8811 [N=5]      (sirve con tools/serve.py; ver README.md)
const zlib = require('zlib');
const { launch } = require('../lib/browser.js');
const base = process.argv[2] || 'http://localhost:8811', N = +(process.argv[3] || 5);
const med = a => a.slice().sort((x, y) => x - y)[a.length >> 1];
(async () => {
  const b = await launch({ args: ['--no-sandbox'] });
  const runs = [];
  for (let i = 0; i < N; i++) {
    const ctx = await b.newContext({ viewport: { width: 844, height: 390 }, hasTouch: true, isMobile: true }), pg = await ctx.newPage();
    let n = 0, bytes = 0, gz = 0, scripts = 0;
    const pend = [];
    pg.on('response', r => { n++; pend.push(r.body().then(buf => { bytes += buf.length; gz += zlib.gzipSync(buf, { level: 9 }).length; if (/\.js(\?|$)/.test(r.url())) scripts++; }).catch(() => {})); });
    const t0 = Date.now();
    await pg.goto(base + '/index.html?nosw=1', { waitUntil: 'load' });
    const tLoad = Date.now() - t0;
    await pg.waitForFunction(() => window.G && G.state, null, { timeout: 30000 });
    const tReady = Date.now() - t0;
    await Promise.all(pend);
    runs.push({ n, scripts, bytes, gz, tLoad, tReady });
    await ctx.close();
  }
  await b.close();
  const k = f => med(runs.map(r => r[f]));
  console.log(JSON.stringify({ base, N, peticiones: k('n'), scripts: k('scripts'), bytes: k('bytes'), gzip: k('gz'), msLoad: k('tLoad'), msListo: k('tReady') }));
})();
