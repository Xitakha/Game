// Campaña de economía: toma el botín (partes, Brasas, PF) de las runs medidas con run.js y simula una campaña de N runs seguidas (con arrastre de sobrantes),
// gastando de forma voraz "lo más barato primero" tras cada run. Usa las funciones de coste de la página que se le indique (antes / después).
// uso: node campaign.js <base_url_de_costes> <label> [lens=7,9,10] [override JSON de constantes: {"DROP":..}]
const { chromium } = require('/opt/node-tools/node_modules/playwright');
const fs = require('fs'); const D = '/tmp/claude-0/-home-user-Game/ac8df0e6-87e6-5837-9d6a-fa8dcc4300ed/scratchpad/';
const base = process.argv[2], label = process.argv[3], lens = (process.argv[4] || '7,9,10').split(','), ovr = JSON.parse(process.argv[5] || '{}');
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--no-sandbox'] });
  const pg = await b.newPage(); await pg.goto(base + '/index.html?reset=1'); await pg.waitForTimeout(400);
  for (const len of lens) {
    const R = JSON.parse(fs.readFileSync(D + `res_${label}_${len}.json`)).results.map(r => ({ parts: r.parts, brasas: r.brasas }));
    const out = await pg.evaluate(([R, ovr, nCamp, nRuns]) => {
      const L = G.Loot, T = G.Tree; if (ovr.cost) { L.COST_MUL = ovr.cost; }
      const base0 = JSON.stringify(G.Save.data);
      function cheapestCard() { let best = null, bc = 1e9; G.Cards.defs.forEach(d => { if (!d.id || !L.classic(d.id) || !L.canForge(d.id)) return; const r = L.recipe(d.id, L.nextRank(d.id)); let c = r.brasas / 40; for (const k in r.parts) c += r.parts[k]; if (c < bc) { bc = c; best = d.id; } }); return best; }
      function cheapestNode() { let bn = null, bc = 1e9; T.NODES.forEach(n => { if (n.type === 'root' || T.status(n) !== 'avail' || T.afford(n)) return; const c = T.cost(n); let t = c.pf * 10 + c.brasas / 20; for (const k in c.parts) t += c.parts[k]; if (t < bc) { bc = t; bn = n; } }); return bn; }
      function spend(mode) { let n = 0, g = 0; for (; g < 30; g++) { const cid = mode !== 't' ? cheapestCard() : null, nd = mode !== 'c' ? cheapestNode() : null; if (!cid && !nd) break; if (cid && (!nd || mode === 'c')) { L.forge(cid); n++; } else { if (!T.buy(nd.id, 'A').ok) break; n++; } } return n; }
      const res = {};
      ['c', 't', 'm'].forEach(mode => {
        let tot = 0, firstRunCrafts = 0;
        for (let k = 0; k < nCamp; k++) {
          G.Save.data = JSON.parse(base0); T.sync();
          G.Save.data.pf.earned = 1 + 3 + 2;   // regalo + primera vez del jefe (3) y de los dos élites (+2); luego PF 2 (jefe) + 1 (fragmentos)
          for (let i = 0; i < nRuns; i++) {
            const r = R[Math.floor(Math.random() * R.length)];
            for (const p in r.parts) G.Save.add(p, r.parts[p]);
            G.Save.data.brasas += r.brasas; if (i > 0) G.Save.data.pf.earned = Math.min(L.PF_CAP, G.Save.data.pf.earned + 3);
            const n = spend(mode); tot += n; if (i === 0) firstRunCrafts += n;
          }
        }
        res[mode] = { perRun: +(tot / (nCamp * nRuns)).toFixed(2), run1: +(firstRunCrafts / nCamp).toFixed(2) };
      });
      G.Save.data = JSON.parse(base0); T.sync();
      return res;
    }, [R, ovr, 40, +(process.env.NRUNS || 5)]);
    console.log(`len ${len} (${label}) cartas-solo ${out.c.perRun}/run  talentos-solo ${out.t.perRun}/run  mixto ${out.m.perRun}/run   [1.ª run: c ${out.c.run1} t ${out.t.run1} m ${out.m.run1}]`);
  }
  await b.close();
})();
