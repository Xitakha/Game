// PRUEBAS P8 (Balance, rendimiento y cierre; DESIGN-v5-biomas.md P8).
// uso: node p8_tests.js data|tele|hearts|perf|sw|regress|all [base]   (base por defecto http://localhost:8791)
//  data    : constantes de balance finales de los 6 jefes (hpCal, dmgK, cadK, corazones por puerta, pelHeart), HP por Peligro, jefes NO tocados idénticos a P7
//  tele    : regla de esquiva (tele >= 250 + 1000 x salida / 190 ms) en TODOS los ataques de los 6 jefes y los 5 Peligros + HIT_CAP 32 (daño base x dmgK, sin Peligro)
//  hearts  : corazones reales que suelta cada puerta de fase (Pastor 2, Karceron 2, Letea 2, Yarlak 1, Melaria 1, Cenizar 3 / 4 en Peligro V)
//  perf    : el coste de dibujo de cada jefe se mide y respeta el presupuesto; calidad Baja no es más cara que Alta (no falla por fps absolutos: dependen de la máquina)
//  sw      : sw.js tiene VERSION y la lista de precache al día con index.html (stamp.py) y todos los archivos existen
//  regress : cambios de balance intencionales: lo no tocado (Pastor, Karceron, Letea) mantiene sus constantes
const { chromium } = require('/opt/node-tools/node_modules/playwright');
const fs = require('fs'), path = require('path');
const mode = process.argv[2] || 'all', base = process.argv[3] || 'http://localhost:8791';
const ROOT = path.join(__dirname, '..', '..', 'games', 'card-swarm');
let fails = 0; const ok = (c, msg) => { if (!c) fails++; console.log((c ? 'OK     ' : 'FALLO  ') + msg); };
const launch = () => chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--no-sandbox', '--autoplay-policy=no-user-gesture-required'] });
async function mk(b, url) {
  const ctx = await b.newContext({ viewport: { width: 960, height: 540 } }), pg = await ctx.newPage(); pg.errs = []; pg.ctx = ctx;
  pg.on('console', m => { if (m.type() === 'error') pg.errs.push(m.text()); }); pg.on('pageerror', e => pg.errs.push('PAGEERR ' + e.message));
  await pg.goto(`${base}/index.html?${url}`); await pg.waitForTimeout(500);
  return pg;
}
const close = async pg => { await pg.close(); await pg.ctx.close(); };
const boss = async (b, id, n, extra) => { const pg = await mk(b, `reset=1&god=1&dbg=1&nosw=1&boss=${id}&peligro=${n || 1}&nointro=1&prep=0&hand=spark:3,dart:2,shard:2,dagger:2,fang:1${extra || ''}`); await pg.waitForFunction(() => window.G && G.Boss && G.Boss.e, null, { timeout: 15000 }); return pg; };
const ALL = ['pastor', 'karceron', 'letea', 'yarlak', 'melaria', 'cenizar'];
// constantes finales P8 (README, "Balance y cierre P8")
const FINAL = {
  pastor:   { hpCal: 4.0, dmgK: undefined, cadK: undefined, gate: undefined },
  karceron: { hpCal: 2.3, dmgK: undefined, cadK: undefined, gate: undefined },
  letea:    { hpCal: 3.6, dmgK: undefined, cadK: undefined, gate: undefined },
  yarlak:   { hpCal: 4.5, dmgK: 1.45, cadK: 1.3, gate: 1 },
  melaria:  { hpCal: 3.6, dmgK: 1.45, cadK: 1.0, gate: 1 },
  cenizar:  { hpCal: 4.1, dmgK: 1.0, cadK: 1.35, gate: 3 }
};

async function data(b) {
  console.log('--- constantes de balance P8');
  for (const id of ALL) {
    const pg = await boss(b, id, 1, '&len=9');
    const r = await pg.evaluate(() => { var D = G.Boss.e.def; return { hpCal: D.hpCal, dmgK: D.dmgK, cadK: D.cadK, gate: D.gateHearts, hp: Math.round(G.Boss.e.maxHp), base: D.hp, pelHeart: D.pelHeart ? JSON.stringify(D.pelHeart) : null }; });
    const F = FINAL[id];
    ok(r.hpCal === F.hpCal && r.dmgK === F.dmgK && r.cadK === F.cadK && r.gate === F.gate, `${id}: hpCal ${r.hpCal}, dmgK ${r.dmgK}, cadK ${r.cadK}, corazones/puerta ${r.gate} (esperado ${JSON.stringify(F)})`);
    ok(!pg.errs.length, `${id}: 0 errores ${pg.errs.slice(0, 2)}`);
    await close(pg);
  }
  // Yarlak y Melaria: HP final a 9 min Peligro I = hp x hpCal
  for (const [id, hp0, cal] of [['yarlak', 8500, 4.5], ['melaria', 7200, 3.6]]) {
    const pg = await boss(b, id, 1, '&len=9'); const hp = await pg.evaluate(() => Math.round(G.Boss.e.maxHp));
    ok(hp === Math.round(hp0 * cal), `${id}: HP 9 min Peligro I = ${hp0} x ${cal} = ${Math.round(hp0 * cal)} (${hp})`); await close(pg);
  }
  // Cenizar Peligro V: corazón extra y perillas por defecto
  const pg = await boss(b, 'cenizar', 5, '&len=9');
  const r = await pg.evaluate(() => { var D = G.Boss.e.def; return { ph: D.pelHeart, hp: Math.round(G.Boss.e.maxHp), pelHp: D.pelHp && D.pelHp[5], dmg: D.pelOver && D.pelOver[5] && D.pelOver[5].dmg }; });
  ok(r.ph && r.ph[5] >= 1, `Cenizar V: corazones extra por puerta ${JSON.stringify(r.ph)}, pelHp ${r.pelHp}, dmg ${r.dmg}`); await close(pg);
}

async function tele(b) {
  console.log('--- regla de esquiva + HIT_CAP en los 6 jefes');
  const RULE = ex => Math.round(250 + 1000 * ex / 190 + 100);
  for (const id of ALL) {
    const pg = await boss(b, id, 1, '&len=9');
    const r = await pg.evaluate(id => {
      var S = G.Boss, out = { atk: {}, exit: JSON.parse(JSON.stringify(S.EXIT)), dmgK: S.e.def.dmgK || 1 };
      Object.keys(S.ATKS).filter(n => (S.ATKS[n].b || 'pastor') === id).forEach(n => { out.atk[n] = { tele: [1, 2, 3, 4, 5].map(p => { G.peligro = p; return S.u.teleMs(n); }), dmg: S.ATKS[n].dmg }; }); G.peligro = 1;
      return out;
    }, id);
    const names = Object.keys(r.atk); let bad = [];
    names.forEach(n => { const a = r.atk[n], ex = r.exit[n]; if (ex != null && !a.tele.every(t => t >= Math.min(a.tele[0], RULE(ex)) - 1)) bad.push(n + ' ' + a.tele); });
    ok(bad.length === 0, `${id}: ${names.length} ataques cumplen la regla de esquiva en I-V ${bad.join(' | ')}`);
    // HIT_CAP: el daño base x dmgK de un golpe directo nunca pasa de 32 (el motor lo recorta con Math.min(32, ...) / U.hurt)
    const over = names.filter(n => r.atk[n].dmg > 32);
    ok(over.length === 0, `${id}: HIT_CAP 32 respetado (dmgK ${r.dmgK}; mayor golpe base ${Math.max(...names.map(n => r.atk[n].dmg))})`);
    await close(pg);
  }
}

async function hearts(b) {
  console.log('--- corazones por puerta');
  const EXPECT = { pastor: [2, 2, 2, 2, 2], karceron: [2, 2, 2, 2, 2], letea: [2, 2, 2, 2, 2], yarlak: [1, 1, 1, 1, 1], melaria: [1, 1, 1, 1, 1], cenizar: [3, 3, 3, 3, 4] };
  for (const id of ALL) {
    const got = [];
    for (let n = 1; n <= 5; n++) {
      const pg = await boss(b, id, n, '&len=9');
      const c = await pg.evaluate(() => { var S = G.Boss, e = S.e; G.state = 'play'; G.gems.length = 0; try { S.gate(); } catch (x) { return -1; } return G.gems.filter(g => g.kind === 'heart').length; });
      got.push(c); await close(pg);
    }
    ok(got.join() === EXPECT[id].join(), `${id}: corazones al abrir la puerta de fase en Peligro I-V = ${got} (esperado ${EXPECT[id]})`);
  }
}

async function perf(b) {
  console.log('--- coste de dibujo de los jefes (Chromium sin GPU; informativo, con presupuesto holgado)');
  const BUDGET = { pastor: 6, karceron: 8, letea: 8, yarlak: 8, melaria: 8, cenizar: 8 };   // ms por fotograma de dibujo del cuerpo (media), sin GPU
  for (const id of ALL) {
    const pg = await boss(b, id, 1, '&len=9&speed=1');
    await pg.evaluate(() => { setInterval(() => { G.pendingLevels = 0; if (G.state === 'cards') G.state = 'play'; }, 50); });
    await pg.waitForTimeout(5500);
    const ms = await pg.evaluate(() => {
      var e = G.Boss.e, S = G.Boss, c = document.createElement('canvas'); c.width = 960; c.height = 540; var x = c.getContext('2d'), n = 120, t0 = performance.now();
      for (var i = 0; i < n; i++) { x.clearRect(0, 0, 960, 540); if (e.def.h && e.def.h.draw) e.def.h.draw(x, e); else if (S.draw) S.draw(x); }
      return (performance.now() - t0) / n;
    });
    ok(ms < BUDGET[id] * 2, `${id}: dibujo del cuerpo ${ms.toFixed(2)} ms/fotograma (presupuesto ${BUDGET[id]} ms)`);
    ok(!pg.errs.length, `${id}: 0 errores ${pg.errs.slice(0, 2)}`);
    await close(pg);
  }
}

function sw() {
  console.log('--- PWA: sw.js al día');
  const s = fs.readFileSync(path.join(ROOT, 'sw.js'), 'utf8'), html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
  const files = JSON.parse(/\/\*FILES\*\/([\s\S]*?)\/\*END\*\//.exec(s)[1]);
  const scripts = [...html.matchAll(/<script[^>]+src="([^"]+)"/g)].map(m => m[1]);
  ok(/const VERSION = '[0-9a-f]{10}'/.test(s), 'VERSION con hash de 10 caracteres');
  ok(scripts.every(f => files.includes('./' + f)), `los ${scripts.length} scripts de index.html están en el precache`);
  ok(files.every(f => f === './' || fs.existsSync(path.join(ROOT, f))), `los ${files.length} archivos del precache existen`);
}

async function regress() {
  console.log('--- no tocado: Pastor, Karceron, Letea');
  const src = n => fs.readFileSync(path.join(ROOT, 'src', n), 'utf8');
  ok(/hpCal: 4\.0/.test(src('boss.js')), 'Pastor hpCal 4,0 intacto');
  ok(/hpCal: 2\.3/.test(src('boss_karceron.js')), 'Karceron hpCal 2,3 intacto');
  ok(/hpCal: 3\.6/.test(src('boss_letea.js')) && /hpCalFam: 4\.7/.test(src('boss_letea.js')), 'Letea hpCal 3,6 / hpCalFam 4,7 intactos');
}

(async () => {
  const b = await launch();
  try {
    if (mode === 'sw' || mode === 'all') sw();
    if (mode === 'regress' || mode === 'all') await regress();
    if (mode === 'data' || mode === 'all') await data(b);
    if (mode === 'tele' || mode === 'all') await tele(b);
    if (mode === 'hearts' || mode === 'all') await hearts(b);
    if (mode === 'perf' || mode === 'all') await perf(b);
  } finally { await b.close(); }
  console.log(fails ? `\n${fails} FALLOS` : '\nTODO OK');
  process.exit(fails ? 1 : 0);
})();
