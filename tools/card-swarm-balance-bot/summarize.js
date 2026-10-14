// uso: node summarize.js <label> [lens...]   (lee scratchpad/res_<label>_<len>.json)
const fs = require('fs'); const D = '/tmp/claude-0/-home-user-Game/ac8df0e6-87e6-5837-9d6a-fa8dcc4300ed/scratchpad/';
const label = process.argv[2], lens = process.argv.slice(3).length ? process.argv.slice(3) : ['7', '9', '10'];
const avg = a => a.length ? a.reduce((x, y) => x + y, 0) / a.length : NaN, f = (x, n = 1) => isNaN(x) ? '-' : x.toFixed(n);
for (const len of lens) {
  const j = JSON.parse(fs.readFileSync(D + `res_${label}_${len}.json`)); const R = j.results;
  console.log(`\n== ${label} len=${len} runs=${R.length}  errores consola: ${R.reduce((a, r) => a + r.errs.length, 0)}  fin:${R.map(r => r.state + (r.won ? 'W' : '')).join(',')}`);
  let line = 'min :', l2 = 'lvl :', l3 = 'Lv3 :', l4 = 'sum :', l5 = 'spd :';
  for (let m = 1; m <= +len; m++) {
    const rows = R.map(r => r.min[m]).filter(Boolean);
    const sp = R.map(r => r.sp[m - 1]).filter(Boolean);
    line += ' ' + String(m).padStart(5); l2 += ' ' + f(avg(rows.map(x => x.lvl))).padStart(5); l3 += ' ' + f(avg(rows.map(x => x.lv3))).padStart(5); l4 += ' ' + f(avg(rows.map(x => x.lvSum))).padStart(5);
    l5 += ' ' + (sp.length ? f(avg(sp.map(x => x.r)), 3) : '-').padStart(5);
  }
  console.log(line + '\n' + l2 + '\n' + l3 + '\n' + l4 + '\n' + l5 + '  (x velocidad base, enemigos normales)');
  console.log('build (Σlvl>=13 y 5 slots) min:', f(avg(R.map(r => r.buildT).filter(x => x != null)), 2), ' 5xLv3 min:', f(avg(R.map(r => r.full5T).filter(x => x != null)), 2), ' boss aparece min:', f(avg(R.map(r => r.bossT).filter(x => x != null)), 2), ' runT fin(s):', f(avg(R.map(r => r.runT)), 0), ' nivel final:', f(avg(R.map(r => r.lvl))));
  const tot = avg(R.map(r => r.total)), P = {}; R.forEach(r => { for (const k in r.parts) P[k] = (P[k] || 0) + r.parts[k] / R.length; });
  console.log('partes/run:', f(tot), JSON.stringify(Object.fromEntries(Object.entries(P).map(([k, v]) => [k, +v.toFixed(1)]))), 'brasas/run:', f(avg(R.map(r => r.brasas))), 'PF/run:', f(avg(R.map(r => r.pf || 0))));
  console.log('crafts cartas/run (barato 1º):', f(avg(R.map(r => r.craft ? r.craft.cards : NaN))), ' talentos/run:', f(avg(R.map(r => r.craft ? r.craft.talents : NaN))), ' ej:', R.slice(0, 2).map(r => r.craft && r.craft.cardIds.join('+') + ' | ' + r.craft.nodeIds.join('+')).join(' || '));
  const mm = t => { const a = R.map(r => r.mini && r.mini[t]).filter(Boolean); return a.length ? `n=${a.length} aparece min ${f(avg(a.map(x => x.sp)), 2)} (build Σlvl ${f(avg(a.map(x => x.lvSum)))}) TTK ${f(avg(a.filter(x => x.ttk != null).map(x => x.ttk)), 0)} s [${a.map(x => x.ttk != null ? x.ttk : 'sin morir').join(',')}] parte rota ${a.filter(x => x.broke).length}/${a.length} enrage ${a.filter(x => x.enraged).length}/${a.length}` : '-'; };
  console.log('minijefes  Coloso:', mm('mini_bulwark'), '\n           Colmena:', mm('mini_hive'));
  const H = {}; R.forEach(r => { for (const k in r.heal) H[k] = (H[k] || 0) + r.heal[k] / R.length; });
  console.log('cura cruda/run:', JSON.stringify(Object.fromEntries(Object.entries(H).map(([k, v]) => [k, +v.toFixed(1)]))), ' kills:', f(avg(R.map(r => r.kills)), 0));
}
