// Capturas comparativas vista plana vs ?view=iso. Uso: node caps.js <puerto>  (servidor: python3 tools/serve.py card-swarm <puerto>)
// Genera NN_nombre_plana.png / NN_nombre_iso.png en studio/docs/capturas-vista-iso/ (la unión lado a lado la hace merge.py).
const { chromium } = require('/opt/node-tools/node_modules/playwright');
const PORT = process.argv[2] || '8766';
const OUT = '/home/user/Game/studio/docs/capturas-vista-iso/';
const HAND = 'spark:3,dart:3,shard:2,dagger:2,fang:2';
const only = process.argv[3];
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--no-sandbox', '--autoplay-policy=no-user-gesture-required'] });
  const allErrs = [];
  async function run(view, fn) {
    const pg = await b.newPage({ viewport: { width: 960, height: 540 } });
    pg.on('console', m => { if (m.type() === 'error') allErrs.push(view + ' ' + m.text()); });
    pg.on('pageerror', e => allErrs.push(view + ' PAGEERR ' + e.message + (e.stack || '').split('\n').slice(1, 3).join('|')));
    const v = view === 'iso' ? 'iso' : 'flat';
    const shot = (n) => pg.screenshot({ path: OUT + n + '_' + (view === 'iso' ? 'iso' : 'plana') + '.png' });
    await fn(pg, v, shot);
    await pg.close();
  }
  const auto = (pg) => pg.evaluate(() => { setInterval(() => { if (G.state === 'cards' && G.Cards.off) { try { G.Cards.off.mode === 'level' ? G.Cards.skip() : G.Cards.pick(0); } catch (e) { } } }, 100); });
  const sc = {
    horda: async (pg, v, shot) => {
      await pg.goto(`http://localhost:${PORT}/index.html?view=${v}&reset=1&god=1&t=400&hand=${HAND}`);
      await pg.evaluate(() => G.startGame()); await auto(pg);
      await pg.waitForTimeout(5000); await shot('01_horda');
    },
    mini_coloso: async (pg, v, shot) => {
      await pg.goto(`http://localhost:${PORT}/index.html?view=${v}&reset=1&god=1&t=212&hand=${HAND}`);
      await pg.evaluate(() => G.startGame()); await auto(pg);
      for (let i = 0; i < 60; i++) { await pg.waitForTimeout(250); if (await pg.evaluate(() => G.Enemies.minis().length)) break; }
      await pg.waitForTimeout(1500);
      const f = async (a, w, n) => { await pg.evaluate((a) => { G.god = true; const m = G.Enemies.minis()[0]; if (m) { G.Enemies.forceMini(m, a); } }, a); await pg.waitForTimeout(w); await shot(n); };
      await shot('02_coloso');
      await f('charge', 450, '03_coloso_carga');
      await pg.waitForTimeout(1500);
      await f('stomp', 400, '04_coloso_pisoton');
      await pg.waitForTimeout(1800);
      await f('shields', 450, '05_coloso_escudos');
    },
    mini_colmena: async (pg, v, shot) => {
      await pg.goto(`http://localhost:${PORT}/index.html?view=${v}&reset=1&god=1&t=332&hand=${HAND}`);
      await pg.evaluate(() => G.startGame()); await auto(pg);
      for (let i = 0; i < 60; i++) { await pg.waitForTimeout(250); if (await pg.evaluate(() => G.Enemies.minis().length)) break; }
      await pg.waitForTimeout(1500);
      const f = async (a, w, n) => { await pg.evaluate((a) => { G.god = true; const m = G.Enemies.minis()[0]; if (m) { G.Enemies.forceMini(m, a); } }, a); await pg.waitForTimeout(w); await shot(n); };
      await f('spit', 300, '06_colmena_escupitajo');
      await pg.waitForTimeout(1800);
      await f('rain', 500, '07_colmena_lluvia');
      await pg.waitForTimeout(2000);
      await f('tide', 700, '08_colmena_marea');
    },
  };
  function bossSc(phase, attacks, pre) {
    return async (pg, v, shot) => {
      await pg.goto(`http://localhost:${PORT}/index.html?view=${v}&boss=pastor&god=1&reset=1&nointro=1&phase=${phase}&hand=${HAND}&hpcal=6`);
      await auto(pg);
      await pg.waitForTimeout(4200);
      await shot(pre + '_f' + phase + '_inicio');
      async function free() { for (let i = 0; i < 80; i++) { const r = await pg.evaluate(() => G.Boss.e && !G.Boss.e.atk && G.Boss.e.mode === 'fight' && G.Boss.e.stagT <= 0); if (r) return; await pg.waitForTimeout(150); } }
      for (const [n, w] of attacks) { await free(); await pg.evaluate((a) => { G.god = true; G.Boss.force(a); }, n); await pg.waitForTimeout(w); await shot(pre + '_f' + phase + '_' + n); }
    };
  }
  sc.boss1 = bossSc(1, [['barrido', 600], ['embestida', 650], ['pisoton', 450], ['salto', 700], ['abanico', 400], ['llamada', 600]], '10');
  sc.boss2 = bossSc(2, [['esporas', 700], ['estampida', 500], ['pisoton', 1500]], '20');
  sc.boss3 = bossSc(3, [['barrido', 600], ['abanico', 450], ['estampida', 500], ['salto', 700], ['pisoton', 1400]], '30');
  sc.aldea = async (pg, v, shot) => {
    await pg.goto(`http://localhost:${PORT}/index.html?view=${v}&reset=1`); await pg.waitForTimeout(1500); await shot('40_aldea');
    await pg.keyboard.press('Escape'); await pg.waitForTimeout(300);
    await pg.mouse.click(480, 250); await pg.waitForTimeout(300); await shot('41_menu');
  };
  for (const k of Object.keys(sc)) { if (only && k !== only) continue; for (const view of ['plana', 'iso']) await run(view, sc[k]); }
  console.log('errores:', JSON.stringify(allErrs));
  await b.close();
})();
