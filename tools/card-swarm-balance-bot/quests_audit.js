// AUDITORIA DE ENCARGOS (v5 P2): cada encargo de Vesper debe ser cumplible en al menos un bioma desbloqueado, de forma coherente con el orden Bosque -> Cripta -> Asfodelo.
// uso: node quests_audit.js [base=http://localhost:8793] [--census=a.json,b.json ...]   (los JSON son los de census.js; opcional: calcula cuantas runs hacen falta por encargo de caza)
// Reglas comprobadas:
//   1. >= 21 encargos y todos con al menos un bioma donde avanzan (Q.biomesOf).
//   2. Coherencia con el orden: cat A (faciles, incl. el tutorial) -> cumplibles en el BOSQUE; cat B -> en Bosque o Cripta; cat C -> en cualquiera.
//   3. El tutorial (id 'bombs') apunta a un rol que existe en el Bosque y se ofrece siempre a la cuenta nueva.
//   4. El Tablon (Q.offers, 400 rotaciones por estado de desbloqueo: ningun jefe / Pastor / Pastor+Karceron) solo ofrece encargos cumplibles en un bioma desbloqueado.
//   5. Los roles objetivo de caza entran antes del jefe (from < 5/6 de la run) en algun bioma donde existen.
const { chromium } = require('/opt/node-tools/node_modules/playwright');
const fs = require('fs');
const args = process.argv.slice(2), base = args.find(a => !a.startsWith('--')) || 'http://localhost:8793';
const cen = ((args.find(a => a.startsWith('--census=')) || '').split('=')[1] || '').split(',').filter(Boolean);
let fails = 0; const ok = (c, msg) => { if (!c) fails++; console.log((c ? 'OK     ' : 'FALLO  ') + msg); };
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--no-sandbox'] });
  const pg = await b.newPage({ viewport: { width: 960, height: 540 } }), errs = [];
  pg.on('console', m => { if (m.type() === 'error') errs.push(m.text()); }); pg.on('pageerror', e => errs.push(e.message));
  await pg.goto(`${base}/index.html?reset=1`); await pg.waitForTimeout(500);
  const R = await pg.evaluate(() => {
    const Q = G.Quests, B = G.B, order = Q.BIOMES, out = { rows: [], boards: {} };
    Q.DEFS.forEach(d => { const bs = Q.biomesOf(d); out.rows.push({ id: d.id, cat: d.cat, tier: d.tier, kind: d.kind, target: d.target || '', goal: d.goal, label: d.label, biomes: bs, first: bs.length ? order.indexOf(bs[0]) : -1,
      from: d.kind === 'hunt' ? Math.min.apply(null, bs.map(b => { const f = B.famOf(b); return f ? f.use[d.target].from != null ? f.use[d.target].from : B.enemy[d.target].from : B.enemy[d.target].from; })) : null }); });
    out.tutorial = Q.def('bombs');
    out.tutorialInBosque = Q.biomesOf(Q.def('bombs')).indexOf('bosque') >= 0;
    [[{}, 'ninguno'], [{ pastor: 1 }, 'pastor'], [{ pastor: 1, karceron: 1 }, 'pastor+karceron']].forEach(([kills, name]) => {
      G.Save.data.bossKills = Object.assign({ pastor: 0, karceron: 0, letea: 0 }, kills); G.Save.data.quest.done = {};
      const un = Q.unlockedBiomes(), bad = {}, seen = {}; let nBad = 0, first = [];
      for (let i = 0; i < 400; i++) { G.Save.data.runs = i * 7 + 3; const of = Q.offers().slice(); if (i === 0) first = of.map(d => d.id); of.forEach(d => { seen[d.id] = 1; if (!Q.feasible(d)) { bad[d.id] = 1; nBad++; } }); }
      out.boards[name] = { unlocked: un, bad: Object.keys(bad), seen: Object.keys(seen).length, nBad, first };
    });
    // la cuenta nueva con el tutorial hecho: ya no se fuerza
    return out;
  });
  console.log('--- encargos: ' + R.rows.length);
  console.log('id'.padEnd(13) + 'cat t  tipo    objetivo   meta  entrada  biomas');
  R.rows.forEach(r => console.log(r.id.padEnd(13) + r.cat + '   ' + r.tier + '  ' + r.kind.padEnd(8) + (r.target || '-').padEnd(11) + String(r.goal).padStart(4) + '  ' + (r.from == null ? '   -  ' : (r.from / 60000).toFixed(2).padStart(6)) + '   ' + r.biomes.join(',')));
  ok(R.rows.length >= 21, R.rows.length + ' encargos (>= 21)');
  ok(R.rows.every(r => r.biomes.length > 0), 'todos los encargos avanzan en al menos un bioma');
  const A = R.rows.filter(r => r.cat === 'A'), Bq = R.rows.filter(r => r.cat === 'B');
  ok(A.every(r => r.biomes.indexOf('bosque') >= 0), 'cat A (faciles) cumplibles en el Bosque: ' + A.map(r => r.id).join(','));
  ok(Bq.every(r => r.first <= 1), 'cat B cumplibles en Bosque o Cripta: ' + Bq.map(r => r.id + '(' + r.biomes[0] + ')').join(','));
  ok(R.tutorialInBosque && R.tutorial.target === 'fanner', 'tutorial (Huele a chamusquina) -> ' + R.tutorial.target + ' existe en el Bosque');
  ok(R.rows.filter(r => r.kind === 'hunt').every(r => r.from < 450000), 'los objetivos de caza entran antes del jefe (7:30)');
  for (const k in R.boards) { const x = R.boards[k]; ok(x.nBad === 0, `Tablon con jefes vencidos = ${k}: desbloqueados ${x.unlocked.join(',')}; ${x.seen} encargos distintos ofrecidos, ${x.nBad} no cumplibles ${x.bad.join(',')}; primer tablon ${x.first.join(',')}`); }
  ok(R.boards.ninguno.first[0] === 'bombs', 'la cuenta nueva ve el tutorial primero');
  // runs necesarias (opcional): altas por run de cada rol en cada bioma medido con el bot
  if (cen.length) {
    console.log('--- runs estimadas por encargo de caza (altas del director medidas con el bot; 1 run = 9 min)');
    const per = {};
    cen.forEach(f => { const j = JSON.parse(fs.readFileSync(f)); j.results.forEach(r => { const c = r.census; if (!c) return; const bio = r.biome; const tot = {}; Object.keys(c.spawns || {}).forEach(m => { Object.keys(c.spawns[m]).forEach(t => { tot[t] = (tot[t] || 0) + c.spawns[m][t]; }); }); (per[bio] = per[bio] || []).push(tot); }); });
    R.rows.filter(r => r.kind === 'hunt').forEach(r => {
      const parts = r.biomes.map(bio => { const a = per[bio]; if (!a) return bio + ': sin datos'; const m = a.reduce((s, t) => s + (t[r.target] || 0), 0) / a.length; return bio + ': ' + m.toFixed(0) + ' altas/run -> ' + (m ? Math.ceil(r.goal / Math.max(1, m * 0.8)) : '?') + ' runs'; });
      console.log(r.id.padEnd(11) + r.goal + ' ' + r.target + '  ' + parts.join(' | '));
    });
  }
  ok(!errs.length, 'auditoria: 0 errores de consola ' + errs.slice(0, 2).join(' | '));
  console.log(fails ? `AUDITORIA DE ENCARGOS: ${fails} FALLO(S)` : 'AUDITORIA DE ENCARGOS: OK');
  await b.close(); process.exit(fails ? 1 : 0);
})();
