// Compara dos censos (A.2 / A.11.1): vivos totales +-8 % y proporción por tier +-10 puntos, minuto a minuto (solo minutos con >= 20 muestras por run y sin jefe).
// uso: node census_compare.js A.json B.json [--minutes=1-7] [--tol=8] [--tierTol=10]   (A = referencia, p. ej. ?fam=0; B = candidato)
const fs = require('fs');
const args = process.argv.slice(2), files = args.filter(a => !a.startsWith('--')), opt = {};
args.filter(a => a.startsWith('--')).forEach(a => { const [k, v] = a.slice(2).split('='); opt[k] = v; });
const tol = +(opt.tol || 8), tierTol = +(opt.tierTol || 10), [m0, m1] = (opt.minutes || '1-7').split('-').map(Number);
function agg(f) {
  const d = JSON.parse(fs.readFileSync(f, 'utf8')), M = {}, runs = d.results.length;
  d.results.forEach(r => Object.keys(r.census.min).forEach(m => {
    const s = r.census.min[m]; if (s.boss > 0 || s.n < 20) return;
    const a = M[m] || (M[m] = { runs: 0, alive: 0, tier: [0, 0, 0, 0], type: {}, spawns: {} });
    a.runs++; a.alive += s.alive / s.n; for (let i = 0; i < 4; i++) a.tier[i] += s.byTier[i] / s.n;
    for (const k in s.byType) a.type[k] = (a.type[k] || 0) + s.byType[k] / s.n;
    const sp = r.census.spawns[m] || {}; for (const k in sp) a.spawns[k] = (a.spawns[k] || 0) + sp[k];
  }));
  Object.values(M).forEach(a => { a.alive /= a.runs; a.tier = a.tier.map(x => x / a.runs); for (const k in a.type) a.type[k] /= a.runs; for (const k in a.spawns) a.spawns[k] /= a.runs; });
  return { M, runs, d };
}
const A = agg(files[0]), B = agg(files[1]); let bad = 0;
console.log(`A=${files[0]} (${A.runs} runs, fam=${A.d.results[0].fam})  B=${files[1]} (${B.runs} runs, fam=${B.d.results[0].fam})`);
console.log('min | vivos A -> B (dif %) | tier% A | tier% B | dif max (pts)');
for (let m = m0; m <= m1; m++) {
  const a = A.M[m], b = B.M[m]; if (!a || !b) { console.log(m, 'sin datos'); continue; }
  const dp = (b.alive - a.alive) / a.alive * 100, ta = a.tier.map(x => x / a.alive * 100), tb = b.tier.map(x => x / b.alive * 100);
  const dt = Math.max(...ta.map((x, i) => Math.abs(x - tb[i]))), ok = Math.abs(dp) <= tol && dt <= tierTol; if (!ok) bad++;
  console.log(`${m} | ${a.alive.toFixed(1)} -> ${b.alive.toFixed(1)} (${dp >= 0 ? '+' : ''}${dp.toFixed(1)}%) | ${ta.map(x => x.toFixed(0)).join('/')} | ${tb.map(x => x.toFixed(0)).join('/')} | ${dt.toFixed(1)} ${ok ? 'OK' : 'FUERA'}`);
}
const types = new Set(); [A, B].forEach(x => Object.values(x.M).forEach(a => Object.keys(a.type).forEach(k => types.add(k))));
console.log('vivos medios por rol (minutos ' + m0 + '-' + m1 + ', A / B):');
console.log([...types].map(k => { let sa = 0, sb = 0, n = 0; for (let m = m0; m <= m1; m++) if (A.M[m] && B.M[m]) { sa += A.M[m].type[k] || 0; sb += B.M[m].type[k] || 0; n++; } return k + ' ' + (sa / n).toFixed(2) + '/' + (sb / n).toFixed(2); }).join('  '));
const errs = [...A.d.results, ...B.d.results].reduce((n, r) => n + r.errs.length, 0), allow = [...A.d.results, ...B.d.results].reduce((n, r) => n + r.allow.filter(x => !x.ok).length, 0);
console.log(`errores de consola: ${errs}; fases de jefe con interseccion vacia: ${allow}`);
console.log(bad || errs || allow ? `RESULTADO: FUERA de tolerancia en ${bad} minuto(s)` : 'RESULTADO: OK (equivalente dentro de +-' + tol + ' % vivos y +-' + tierTol + ' pts por tier)');
process.exit(bad || errs || allow ? 1 : 0);
