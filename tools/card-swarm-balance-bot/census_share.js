// Cuota de cada rol sobre los enemigos vivos (A.11.4: ningun tipo nuevo > 10 % de los enemigos en pantalla). uso: node census_share.js census.json [rol1,rol2] [--from=3]
// Por minuto: media de (vivos del rol / vivos totales) de las runs sin jefe; "media" = de los minutos desde el de entrada (--from, defecto 1) hasta el 7.
const fs = require('fs'); const a = process.argv.slice(2), f = a.find(x => !x.startsWith('--')), roles = (a.find(x => /^[a-z,_]+$/.test(x) && x !== f) || '').split(',').filter(Boolean), from = +((a.find(x => x.startsWith('--from=')) || '--from=1').split('=')[1]);
const d = JSON.parse(fs.readFileSync(f, 'utf8')), M = {};
d.results.forEach(r => Object.keys(r.census.min).forEach(m => { const s = r.census.min[m]; if (s.boss > 0 || s.n < 20) return; (M[m] = M[m] || { n: 0, alive: 0, t: {} }); M[m].n++; M[m].alive += s.alive / s.n; for (const k in s.byType) M[m].t[k] = (M[m].t[k] || 0) + s.byType[k] / s.n; }));
const all = new Set(); Object.values(M).forEach(x => Object.keys(x.t).forEach(k => all.add(k)));
const list = roles.length ? roles : [...all];
console.log('rol'.padEnd(12) + Object.keys(M).sort((x, y) => x - y).filter(m => m <= 7).map(m => ('m' + m).padStart(7)).join('') + '   media(>=' + from + ')  max');
list.forEach(k => {
  const row = []; let sum = 0, n = 0, mx = 0;
  Object.keys(M).sort((x, y) => x - y).filter(m => m <= 7).forEach(m => { const x = M[m], sh = (x.t[k] || 0) / x.alive * 100; row.push((sh.toFixed(1) + '%').padStart(7)); mx = Math.max(mx, sh); if (+m >= from) { sum += sh; n++; } });
  console.log(k.padEnd(12) + row.join('') + '   ' + (sum / n).toFixed(1).padStart(6) + '%   ' + mx.toFixed(1) + '%');
});
console.log('vivos medios por minuto: ' + Object.keys(M).sort((x, y) => x - y).filter(m => m <= 7).map(m => (M[m].alive / M[m].n).toFixed(1)).join(' '));
