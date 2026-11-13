// Bot de rendimiento: escenario FIJO de peor caso (enjambre denso en el Crater con 4 poderes en AUTO) con semilla; mide el frame-time
// y REPORTA p95 (sin umbral duro: no falla). Uso:
//   python3 tools/serve.py card-swarm 8811 &      (cierra por PID)
//   node tools/card-swarm-bot/perf_bot.js [segundos=30] [base=http://localhost:8811]
// Env: SEED=<n> (def. 1)  SWARM=<n enemigos vivos, def. 110>  PERF=1|0 (1 = usa el overlay ?perf=1 del juego; 0 = juego sin ?perf, medido con un contador propio)
//      RUNS=<n> (repite y da la mediana)  PINF=<f> (?pinf, def. 0.25)  QUALITY=alta|media|baja (ajuste de calidad de G.Q.level, def. no tocar)  EXTRA='&x=1'
// Mide la ventana tras 3 s de calentamiento. En headless (GPU por software) los ms no son los de un movil: sirve para comparar versiones, no como absoluto.
const { launch } = require('../lib/browser.js');
const SECS = +process.argv[2] || 30, base = process.argv[3] || 'http://localhost:8811';
const SEED = +process.env.SEED || 1, SWARM = +process.env.SWARM || 110, PERF = process.env.PERF !== '0', RUNS = +process.env.RUNS || 1, PINF = process.env.PINF || '0.25', EXTRA = process.env.EXTRA || '';
const URL = `${base}/index.html?nosw=1&reset=1&direct=1&all=1&god=1&biome=crater&t=240&nobos=1&seed=${SEED}&pinf=${PINF}&actives=vapor,plasma,forja,sed&hand=spark:3,ember:3,dart:3,shard:2,ring:1${PERF ? '&perf=1' : ''}${EXTRA}`;

async function run() {
  const b = await launch({ args: ['--no-sandbox', '--autoplay-policy=no-user-gesture-required'] });
  const ctx = await b.newContext({ viewport: { width: 844, height: 390 }, hasTouch: true, isMobile: true }), pg = await ctx.newPage(); const errs = [];
  pg.on('console', m => { if (m.type() === 'error') errs.push(m.text()); }); pg.on('pageerror', e => errs.push('PAGEERR ' + e.message));
  if (!PERF) await pg.addInitScript(() => {   // contador propio (solo en la variante sin ?perf): intervalo entre frames y trabajo (CPU) del callback
    const S = window.__own = { d: [], w: [] }; let last = 0; const raf = window.requestAnimationFrame.bind(window);
    window.requestAnimationFrame = cb => raf(t => { const a = performance.now(); cb(t); S.w.push(performance.now() - a); if (last) S.d.push(t - last); last = t; });
    window.requestAnimationFrame(() => {});
  });
  await pg.goto(URL); await pg.waitForTimeout(800);
  await pg.evaluate(([swarm, q]) => {
    if (G.state === 'cards' && G.Cards.off) G.Cards.pick(0);
    if (q) G.Sys && G.Sys.setQuality && G.Sys.setQuality(q);
    G.Fusion.auto = true;
    const R = () => (G.rng || Math.random)();   // (G.rng no existe en versiones antiguas del juego)
    const T = ['worm', 'worm', 'worm', 'archer', 'boar', 'bomb', 'shield', 'fanner', 'moth'];
    setInterval(() => {   // mantiene el enjambre denso alrededor del jugador y nunca deja abierta una oferta de nivel
      if (G.state === 'cards' && G.Cards.off) { G.Cards.off.modal = null; if (G.Cards.off.mode === 'level') G.Cards.skip(); else G.Cards.pick(0); }
      if (G.state !== 'play') return;
      G.player.hp = G.player.maxHp;
      let add = swarm - G.enemies.length, i = 0;
      for (; i < add && i < 12; i++) { const a = R() * 6.283, d = 120 + R() * 260; G.Enemies.spawn(T[Math.floor(R() * T.length)], G.clamp(G.player.x + Math.cos(a) * d, 60, G.AW - 60), G.clamp(G.player.y + Math.sin(a) * d, 60, G.AH - 60)); }
    }, 250);
  }, [SWARM, process.env.QUALITY || null]);
  await pg.waitForTimeout(3000);
  if (PERF) await pg.evaluate(() => window.__perf.reset()); else await pg.evaluate(() => { window.__own.d.length = 0; window.__own.w.length = 0; });
  const t0 = Date.now(); let en = [];
  while (Date.now() - t0 < SECS * 1000) { await pg.waitForTimeout(2000); en.push(await pg.evaluate(() => G.enemies.length)); }
  let r;
  if (PERF) { const s = await pg.evaluate(() => window.__perf.summary()); r = { fps: s.fps, avg: s.interval.avg, p95: s.interval.p95, p99: s.interval.p99, max: s.interval.max, cpuAvg: s.work.avg, cpuP95: s.work.p95, over33: s.over33, frames: s.frames, quality: s.quality }; }
  else { const o = await pg.evaluate(() => window.__own), d = o.d.slice().sort((x, y) => x - y), w = o.w.slice().sort((x, y) => x - y); const n = d.length, avg = d.reduce((a, c) => a + c, 0) / n; r = { fps: +(1000 / avg).toFixed(2), avg: +avg.toFixed(2), p95: +d[Math.floor(n * 0.95)].toFixed(1), p99: +d[Math.floor(n * 0.99)].toFixed(1), max: +d[n - 1].toFixed(1), over33: d.filter(x => x > 33.4).length, frames: n, cpuAvg: +(w.reduce((a, c) => a + c, 0) / w.length).toFixed(2), cpuP95: +w[Math.floor(w.length * 0.95)].toFixed(1) }; }
  r.enemiesAvg = Math.round(en.reduce((a, c) => a + c, 0) / (en.length || 1)); r.kills = await pg.evaluate(() => G.kills); r.errs = errs.length;
  await b.close(); return r;
}
(async () => {
  console.log(`perf_bot: Crater, 4 poderes, enjambre ${SWARM}, seed ${SEED}, ${SECS}s, medicion ${PERF ? '?perf=1' : 'contador propio (sin ?perf)'}`);
  const rs = []; for (let i = 0; i < RUNS; i++) { const r = await run(); rs.push(r); console.log(JSON.stringify(r)); }
  const med = k => rs.map(r => r[k]).sort((a, c) => a - c)[Math.floor(rs.length / 2)];
  console.log(`RESULTADO p95 = ${med("p95")} ms (cpu/frame avg ${med("cpuAvg")} p95 ${med("cpuP95")} ms)  (avg ${med('avg')} ms, ${med('fps')} fps, max ${med('max')} ms; frames>33ms: ${med('over33')})  [solo informe: sin umbral]`);
  process.exit(rs.some(r => r.errs) ? 1 : 0);
})().catch(e => { console.error(e); process.exit(2); });
