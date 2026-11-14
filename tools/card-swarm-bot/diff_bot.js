// Medicion de equivalencia ALTA / MEDIA / BAJA (T-F0-05 parte 2): bot de guion, semillas fijas, por pasos (G.step), hasta el jefe.
// Uso: node tools/card-swarm-bot/diff_bot.js [n=8] [normal|sat|both] [bioma=bosque] [alta,media,baja] [base=http://localhost:8811]
//   normal = cmul por defecto; sat = cmul=1 (saturado: el jugador no da abasto). Env PAR=4 corridas en paralelo. Env EXTRA='&dh=1.2' anade parametros de URL.
// Entradas por tick (sin god: la vida se repone cada tick; movimiento por bloques de 45 ticks con un hash fijo), primera oferta de cada nivel. Mide bajas, nivel final, Ceniza y dano recibido (?dbg=1).
const { launch } = require('../lib/browser.js');
const [, , nS, regS, biomeS, qsS, baseS] = process.argv;
const N = +nS || 8, REG = regS || 'both', BIOME = biomeS || 'bosque', QS = (qsS || 'alta,media,baja').split(','), BASE = baseS || 'http://localhost:8811', PAR = +process.env.PAR || 4, EXTRA = process.env.EXTRA || '';
const run = async (b, q, seed, sat) => {
  const pg = await b.newPage(); const errs = []; pg.on('pageerror', e => errs.push(e.message));
  await pg.goto(`${BASE}/index.html?dev=1&nosw=1&reset=1&god=0&dbg=1&direct=1&all=1&noanchor=1&nointro=1&speed=0&biome=${BIOME}&hand=spark:1&seed=${seed}&q=${q}${sat ? '&cmul=1' : ''}${EXTRA}`);
  await pg.waitForTimeout(600);
  const r = await pg.evaluate(() => {
    const dirs = [[1, 0], [1, 1], [0, 1], [-1, 1], [-1, 0], [-1, -1], [0, -1], [1, -1], [0, 0]], t0 = Math.round(G.time / G.STEP);
    let lvl5 = 0, guard = 0;
    while (G.runT < G.BOSS_T && !G.won && guard++ < 60000) {
      const C = G.Cards; G.player.hp = G.player.maxHp;   // sin muerte; god=0 conserva la invulnerabilidad normal de 600 ms tras cada golpe
      if (G.state === 'cards') { const O = C.off; if (O) { O.modal = null; try { C.pick(0); } catch (e) { C.skip(); } } if (G.state === 'cards') G.state = 'play'; }
      const t = Math.round(G.time / G.STEP) - t0, d = t < 120 ? dirs[8] : dirs[(Math.imul(Math.floor(t / 45) + 1, 2654435761) >>> 0) % 9], l = Math.hypot(d[0], d[1]) || 1;
      G.input.joy = { active: d[0] !== 0 || d[1] !== 0, id: 1, ox: 100, oy: 400, x: d[0] / l, y: d[1] / l };
      G.step(); if (!lvl5 && G.runT >= 300000) lvl5 = G.player.level;
    }
    let dmg = 0; for (const k in G.dbg.dmg) dmg += G.dbg.dmg[k];
    return { kills: G.kills, level: G.player.level, lvl5, ash: G.player.ash, dmg: Math.round(dmg), runT: Math.round(G.runT), prof: G.D.id };
  });
  await pg.close(); return { ...r, errs: errs.length };
};
const stat = a => { const m = a.reduce((s, v) => s + v, 0) / a.length, sd = Math.sqrt(a.reduce((s, v) => s + (v - m) ** 2, 0) / Math.max(1, a.length - 1)); return [m, sd / Math.sqrt(a.length)]; };
(async () => {
  const b = await launch({ args: ['--no-sandbox'] });
  const regs = REG === 'both' ? ['normal', 'sat'] : [REG], jobs = [], res = {};
  for (const rg of regs) for (const q of QS) for (let s = 1; s <= N; s++) jobs.push([rg, q, s]);
  let i = 0; await Promise.all(Array.from({ length: PAR }, async () => { while (i < jobs.length) { const [rg, q, s] = jobs[i++]; const r = await run(b, q, s, rg === 'sat'); (res[rg + '/' + q] = res[rg + '/' + q] || []).push(r); } }));
  console.log(`bioma ${BIOME}, n=${N} por celda, semillas 1..${N}, hasta el jefe (7:30); media +- error estandar`);
  console.log('regimen | calidad | bajas | nivel final | nivel min 5 | Ceniza | dano recibido | errores');
  for (const rg of regs) for (const q of QS) {
    const a = res[rg + '/' + q], f = k => { const [m, e] = stat(a.map(x => x[k])); return m.toFixed(k === 'level' || k === 'lvl5' ? 1 : 0) + ' +- ' + e.toFixed(k === 'level' || k === 'lvl5' ? 1 : 0); };
    console.log([rg, q.toUpperCase(), f('kills'), f('level'), f('lvl5'), f('ash'), f('dmg'), a.reduce((s, x) => s + x.errs, 0)].join(' | '));
  }
  await b.close();
})();
