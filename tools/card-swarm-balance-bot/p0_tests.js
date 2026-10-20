// Pruebas de la fase P0 (familias): unitarias de la infraestructura, flujo completo, 3 jefes y fps.
// uso: node p0_tests.js unit|flow|bosses|fps|all [base=http://localhost:8791] [baseAntes=http://localhost:8792 (solo fps: comparar con el código anterior)]
const { chromium } = require('/opt/node-tools/node_modules/playwright');
const fs = require('fs');
const what = process.argv[2] || 'all', base = process.argv[3] || 'http://localhost:8791', before = process.argv[4] || '';
const botSrc = fs.readFileSync(__dirname + '/bot_page.js', 'utf8');
let fails = 0; const ok = (c, msg) => { if (!c) fails++; console.log((c ? 'OK     ' : 'FALLO  ') + msg); };
const launch = () => chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--no-sandbox', '--autoplay-policy=no-user-gesture-required'] });
async function page(b, q, vp) {
  const ctx = await b.newContext({ viewport: vp || { width: 960, height: 540 } }), pg = await ctx.newPage(); pg.errs = [];
  pg.on('console', m => { if (m.type() === 'error') pg.errs.push(m.text()); }); pg.on('pageerror', e => pg.errs.push('PAGEERR ' + e.message));
  await pg.goto(`${base}/index.html?${q}`); await pg.waitForTimeout(500); return pg;
}

async function unit(b) {
  console.log('--- unit');
  const pg = await page(b, 'reset=1&dbg=1&god=1&hand=spark:1');
  const r = await pg.evaluate(() => {
    const B = G.B, out = {}, roles = ['worm', 'archer', 'fanner', 'boar', 'shield', 'bomb', 'moth', 'sower', 'blinker', 'scorcher', 'warlock'];
    out.biomes = Object.keys(B.fam).join(',');
    // resolución por modo
    B.famMode = 'auto'; out.autoNull = ['bosque', 'cripta', 'asfodelo'].every(k => B.famOf(k) === null);
    B.famMode = 1; out.f1 = ['bosque', 'cripta', 'asfodelo'].every(k => B.famOf(k) === B.fam[k]); out.f1Empty = B.famOf('tundra') === null && B.famOf('panal') === null;
    B.famMode = 0; out.f0 = B.famOf('bosque') === null;
    // identidad: con fam forzada, tierOf/val == roster legado en los 3 biomas
    B.famMode = 1; let idn = true;
    ['bosque', 'cripta', 'asfodelo'].forEach(bio => { G.curBiome = bio; roles.forEach(k => { if (B.tierOf(k) !== B.tier[k]) idn = false; ['from', 'w', 'cost', 'maxAlive'].forEach(f => { if (B.val(k, f) !== B.enemy[k][f]) idn = false; }); const u = B.entry(k); if (!u || u.hp !== 1 || u.spd !== 1 || u.dmg !== 1 || u.spr) idn = false; }); });
    out.identity = idn;
    out.packs = B.packsOf().length;
    // tabla de materiales: 13 x 6
    out.mats = Object.keys(B.mat.table).length; out.tbl = Object.values(B.mat.table).every(r => r.length === 6 && r.every(v => v >= 0.75 && v <= 1.25));
    return out;
  });
  ok(r.biomes === 'bosque,cripta,asfodelo,tundra,panal', 'G.B.fam tiene bosque, cripta, asfodelo y esqueletos tundra/panal');
  ok(r.autoNull, 'modo auto: ningun bioma ready -> roster legado (famOf = null)');
  ok(r.f1 && r.f1Empty, '?fam=1 fuerza familias en los 3 biomas; tundra/panal (use vacio) siguen en legado');
  ok(r.f0, '?fam=0 -> famOf = null');
  ok(r.identity, 'identidad: tierOf/from/w/cost/maxAlive == roster actual y hp/spd/dmg = 1, sin sprite propio (3 biomas x 11 roles)');
  ok(r.packs === 4, 'packs por bioma: estructura con los 4 packs actuales');
  ok(r.mats === 13 && r.tbl, 'tabla de materiales: 13 materiales x 6 etiquetas dentro de [0,75; 1,25]');

  // spawn con override + fallback de sprite + capGrow + materiales + deal (dentro de una run real)
  await pg.evaluate(() => { G.startGame(); });
  await pg.waitForTimeout(300);
  const s = await pg.evaluate(() => {
    const B = G.B, E = G.Enemies, o = {}; G.state = 'play';
    B.famMode = 1; G.curBiome = 'cripta';
    const u = B.fam.cripta.use.boar, save = Object.assign({}, u);
    const e0 = E.spawn('boar', 400, 400, { nofam: true }); const e1 = E.spawn('boar', 400, 400);
    o.sameHp = Math.abs(e0.hp - e1.hp) < 1e-9 && e0.spdBase === e1.spdBase && e0.spr === e1.spr && e1.spr === B.enemy.boar.spr;
    u.hp = 2; u.spd = 0.5; u.dmg = 3; u.spr = 'sprite_que_no_existe';
    const e2 = E.spawn('boar', 400, 400);
    o.hp = e2.hp / e0.hp; o.spd = e2.spdBase / e0.spdBase; o.dmg = e2.dmg / e0.dmg; o.fallback = e2.spr === B.enemy.boar.spr;
    u.spr = 'worm'; const e3 = E.spawn('boar', 400, 400); o.ownSpr = e3.spr === 'worm';
    u.skin = { tint: '#ff0000', a: 0.4 }; const e4 = E.spawn('boar', 400, 400); o.skin = !!e4.skin && e4.skin.tint === '#ff0000';
    Object.keys(u).forEach(k => delete u[k]); Object.assign(u, save);
    // familia no lista (modo auto) -> roster legado aunque haya override
    B.famMode = 'auto'; u.hp = 5; const e5 = E.spawn('boar', 400, 400); o.autoLegacy = Math.abs(e5.hp - e0.hp) < 1e-9; delete u.hp; u.hp = 1;
    B.famMode = 1;
    // capGrow
    const W = G.Waves, cs = B.fam.cripta.use.sower; delete cs.capGrow;
    const c0 = W.capOf('sower', 9); cs.capGrow = 1.5; const c1 = W.capOf('sower', 9); delete cs.capGrow;
    o.cap0 = c0; o.cap1 = c1; o.capExp0 = Math.round(B.enemy.sower.maxAlive * 2.4); o.capExp1 = Math.round(B.enemy.sower.maxAlive * 1.5);
    // materiales apagados -> sin e.mat; encendidos -> e.mat y multiplicadores
    B.mat.on = false; G.curBiome = 'bosque'; const m0 = E.spawn('worm', 500, 500); o.matOff = m0.mat === undefined && B.matMul({ mat: 'lana' }, 'fire') === 1;
    B.mat.on = true; const m1 = E.spawn('worm', 500, 500), m2 = E.spawn('worm', 500, 500, { nofam: true }); o.matOn = m1.mat === 'lana' && m2.mat === undefined;
    o.lanaFire = B.matMul(m1, 'fire'); o.lanaIce = B.matMul(m1, 'ice'); o.lanaNeutral = B.matMul(m1, 'neutral');
    G.curBiome = 'asfodelo'; const an = E.spawn('scorcher', 500, 500); o.eel = [B.matMul(an, 'lightning'), B.matMul(an, 'ice'), B.matMul(an, 'poison')];
    G.curBiome = 'cripta'; const sk = E.spawn('worm', 500, 500); o.hueso = [B.matMul(sk, 'steel'), B.matMul(sk, 'poison'), B.matMul(sk, 'fire')];
    B.famMode = 0; const m3 = E.spawn('worm', 500, 500); o.fam0NoMat = m3.mat === undefined; B.famMode = 1;
    // Combat.deal: el mismo golpe de Fuego a un enemigo de lana (x1,25) y a uno sin material
    G.curBiome = 'bosque';
    function hit(mat, tag) { const e = E.spawn('boar', 600, 600, { nofam: true }); e.spawnT = 0; e.hp = e.maxHp = 1e6; e.mat = mat; e.numT = 1e9; const h0 = e.hp; G.Combat.deal(e, 100, { tag: tag }); const d = h0 - e.hp; e.dead = true; return d; }
    const dn = hit(undefined, 'fire'), dl = hit('lana', 'fire'), di = hit('lana', 'ice'), dv = hit('vegetal', 'poison');
    o.deal = [dl / dn, hit('lana', 'ice') / hit(undefined, 'ice'), dv / hit(undefined, 'poison')];
    // ticks (Combat.dot)
    const e6 = E.spawn('boar', 600, 600, { nofam: true }); e6.spawnT = 0; e6.hp = 1e6; e6.mat = 'lana'; const h6 = e6.hp; G.Combat.dot(e6, 10, 'fire'); const dd = h6 - e6.hp;
    const e7 = E.spawn('boar', 600, 600, { nofam: true }); e7.spawnT = 0; e7.hp = 1e6; const h7 = e7.hp; G.Combat.dot(e7, 10, 'fire'); o.dot = dd / (h7 - e7.hp);
    // jefe y partes: sin material
    o.bossNoMat = (() => { const bb = E.spawn('boss', 700, 400); G.enemies.pop(); return bb.mat === undefined; })();
    // censo en vivo
    const c = G.Waves.census(); o.census = typeof c.alive === 'number' && c.byTier.length === 4;
    return o;
  });
  ok(s.sameHp, 'E.spawn con familia identidad == E.spawn legado (hp, vel, sprite)');
  ok(Math.abs(s.hp - 2) < 1e-6 && Math.abs(s.spd - 0.5) < 1e-6 && Math.abs(s.dmg - 3) < 1e-6, `multiplicadores hp/spd/dmg de la familia (x${s.hp.toFixed(2)} x${s.spd.toFixed(2)} x${s.dmg.toFixed(2)})`);
  ok(s.fallback && s.ownSpr, 'sprite inexistente -> fallback al sprite del rol; sprite existente -> se usa');
  ok(s.skin, 'skin (tinte) de la familia llega al enemigo');
  ok(s.autoLegacy, 'familia no lista (auto) ignora los overrides: roster legado');
  ok(s.cap0 === s.capExp0 && s.cap1 === s.capExp1, `capGrow: sin capGrow ${s.cap0} (=${s.capExp0}), con 1,5 -> ${s.cap1} (=${s.capExp1})`);
  ok(s.matOff && s.matOn && s.fam0NoMat, 'materiales: apagados = neutros; encendidos asignan e.mat; ?fam=0 / nofam no');
  ok(s.lanaFire === 1.25 && s.lanaIce === 0.75 && s.lanaNeutral === 1, 'matMul lana: fuego 1,25 / hielo 0,75 / neutro 1');
  ok(s.eel[0] === 0.75 && s.eel[1] === 1 && s.eel[2] === 1.25, 'excepcion por monstruo (Anguila: rayo 0,75, hielo 1) sobre pantano');
  ok(s.hueso[0] === 1.25 && s.hueso[1] === 0.75 && s.hueso[2] === 1, 'matMul hueso: acero 1,25 / veneno 0,75 / fuego 1');
  ok(Math.abs(s.deal[0] - 1.25) < 0.01 && Math.abs(s.deal[1] - 0.75) < 0.01 && Math.abs(s.deal[2] - 0.75) < 0.01, `Combat.deal aplica el material (fuego/lana ${s.deal[0].toFixed(3)}, hielo/lana ${s.deal[1].toFixed(3)}, veneno/vegetal ${s.deal[2].toFixed(3)})`);
  ok(Math.abs(s.dot - 1.25) < 0.01, `Combat.dot (ticks) aplica el material (x${s.dot.toFixed(3)})`);
  ok(s.bossNoMat, 'el jefe no usa la tabla de materiales');
  ok(s.census, 'G.Waves.census() disponible');
  // ?mat=1 y ?fam=0 por URL
  const pm = await page(b, 'reset=1&dbg=1&mat=1&fam=1'), pf = await page(b, 'reset=1&dbg=1&fam=0'), pd = await page(b, 'reset=1&dbg=1');
  const url = [await pm.evaluate(() => [G.B.mat.on, G.B.famMode]), await pf.evaluate(() => [G.B.mat.on, G.B.famMode]), await pd.evaluate(() => [G.B.mat.on, G.B.famMode])];
  ok(url[0][0] === true && url[0][1] === 1 && url[1][1] === 0 && url[1][0] === false && url[2][0] === false && url[2][1] === 'auto', 'parametros URL: ?mat=1 ?fam=1 ?fam=0, y por defecto mat apagado / fam auto');
  // A.7: interseccion allow de jefe x familia no vacia
  const pc = await page(b, 'reset=1&dbg=1'); await pc.evaluate(fs_ => (0, eval)(fs_), fs.readFileSync(__dirname + '/census_page.js', 'utf8'));
  const al2 = await pc.evaluate(() => window.censusAllowCheck());
  ok(al2.length >= 6 && al2.every(x => x.ok), `A.7 interseccion allow(jefe) x familia no vacia en ${al2.length} fases de 3 biomas`);
  ok(!pg.errs.length && !pm.errs.length && !pf.errs.length && !pd.errs.length && !pc.errs.length, 'unit: 0 errores de consola ' + [pg, pm, pf, pd, pc].flatMap(p => p.errs).slice(0, 3).join(' | '));
}

// Determinismo del director: con Math.random sembrado, la secuencia de altas (rol, posición, minuto) debe ser IDÉNTICA con ?fam=0, auto y ?fam=1 (familias = identidad en P0).
async function det(b) {
  console.log('--- determinismo del director (misma semilla, 3 biomas x 3 modos' + (before ? ' + código anterior' : '') + ')');
  const pg = await page(b, 'reset=1&dbg=1&god=1&hand=spark:1');
  const pb = before ? await (async () => { const ctx = await b.newContext({ viewport: { width: 960, height: 540 } }), q = await ctx.newPage(); await q.goto(`${before}/index.html?reset=1&dbg=1&god=1&hand=spark:1`); await q.waitForTimeout(500); return q; })() : null;
  const seqOf = (bio, mode, seed, pp) => (pp || pg).evaluate(([bio, mode, seed]) => {
    G.startGame(); G.state = 'play'; G.curBiome = bio; G.B.famMode = mode; G.Waves.reset(); G.enemies = [];
    let s = seed; Math.random = () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
    const out = [], oSp = G.Enemies.spawn; G.Enemies.spawn = function (type, x, y, o) { out.push(type + '@' + Math.round(x) + ',' + Math.round(y)); return oSp.apply(this, arguments); };
    G.player.x = 720; G.player.y = 400;
    for (let t = 0, i = 0; t < 440000; t += 1500, i++) { G.runT = G.time = t; G.Waves.update(1500); if (i % 5 === 4) G.enemies.forEach(e => { if (Math.random() < 0.8) e.dead = true; }); G.enemies = G.enemies.filter(e => !e.dead); }
    G.Enemies.spawn = oSp; return out.join('|');
  }, [bio, mode, seed]);
  for (const bio of ['bosque', 'cripta', 'asfodelo']) {
    const a = await seqOf(bio, 0, 12345), c = await seqOf(bio, 'auto', 12345), d = await seqOf(bio, 1, 12345), e2 = await seqOf(bio, 0, 777);
    const n = a.split('|').length;
    if (pb) ok(a === await seqOf(bio, 0, 12345, pb), `${bio}: secuencia idéntica al código anterior a P0 (HEAD)`);
    ok(a === c && a === d && n > 300 && a !== e2, `${bio}: ${n} altas, secuencia idéntica entre ?fam=0, auto y ?fam=1 (y distinta con otra semilla)`);
  }
}

async function flow(b, famq) {
  console.log('--- flujo completo aldea->portal->expedicion->botin->aldea ' + famq);
  const pg = await page(b, `reset=1&dbg=1&god=1&len=7&speed=20${famq}`);
  const st = () => pg.evaluate(() => G.state);
  ok((await st()) === 'aldea', 'arranca en la aldea');
  await pg.keyboard.press('Tab'); await pg.waitForTimeout(900); await pg.keyboard.press('KeyE'); await pg.waitForTimeout(700);
  await pg.evaluate(botSrc); await pg.keyboard.press('Enter'); await pg.waitForTimeout(500);
  const s1 = await st(); ok(s1 === 'play' || s1 === 'cards', 'portal -> expedicion (' + s1 + ')');
  await pg.evaluate(() => window.installBalanceBot({}));
  for (let i = 0; i < 400; i++) { await pg.waitForTimeout(500); if ((await st()) === 'gameover') break; }
  await pg.waitForTimeout(800);
  const res = await pg.evaluate(() => ({ won: G.won, total: G.Loot.summary && G.Loot.summary.total, brasas: G.Loot.summary && G.Loot.summary.brasas, boss: G.Loot.summary && G.Loot.summary.boss && G.Loot.summary.boss.won }));
  ok((await st()) === 'gameover' && res.won && res.total > 0, 'expedicion terminada con victoria y botin ' + JSON.stringify(res));
  await pg.keyboard.press('KeyB'); await pg.waitForTimeout(1200);
  ok((await st()) === 'aldea', 'botin -> aldea');
  ok(!pg.errs.length, 'flujo: 0 errores de consola ' + pg.errs.slice(0, 3).join(' | '));
}

async function bosses(b, famq) {
  console.log('--- 3 jefes ' + famq);
  for (const [id, bio] of [['pastor', 'bosque'], ['karceron', 'cripta'], ['letea', 'asfodelo']]) {
    const pg = await page(b, `reset=1&dbg=1&god=1&speed=20&boss=${id}&nointro=1&hand=spark:3,dart:3,shard:2,dagger:2,fang:2${famq}`, { width: 640, height: 360 });
    await pg.evaluate(botSrc); await pg.evaluate(() => window.installBalanceBot({}));
    let seen = false, adds = 0;
    for (let i = 0; i < 360; i++) { await pg.waitForTimeout(500); const q = await pg.evaluate(() => ({ s: G.state, b: !!G.Enemies.boss(), n: G.Boss.normalsAlive ? G.Boss.normalsAlive() : 0 })); seen = seen || q.b; adds = Math.max(adds, q.n); if (q.s === 'gameover') break; }
    const r = await pg.evaluate(() => ({ s: G.state, won: G.won, biome: G.curBiome, fam: !!G.B.famOf() }));
    ok(seen && r.s === 'gameover' && r.won && r.biome === bio, `${id} (${bio}): jefe aparece, fases con adds (max ${adds}) y muere -> victoria (fam=${r.fam})`);
    ok(!pg.errs.length, `${id}: 0 errores de consola ` + pg.errs.slice(0, 2).join(' | '));
    await pg.context().close();
  }
}

async function fpsOf(b, baseUrl, extra) {
  const ctx = await b.newContext({ viewport: { width: 960, height: 540 } }), pg = await ctx.newPage(); pg.errs = [];
  pg.on('pageerror', e => pg.errs.push(e.message));
  await pg.goto(`${baseUrl}/index.html?reset=1&god=1&t=435&biome=bosque&hand=spark:3,dart:3,shard:2,dagger:2,fang:2&speed=1&dbg=1${extra}`); await pg.waitForTimeout(400);
  await pg.evaluate(() => { G.startGame(); setInterval(() => { if (G.state === 'cards' && G.Cards.off) { try { G.Cards.off.mode === 'level' ? G.Cards.skip() : G.Cards.pick(0); } catch (e) { } } }, 100); });
  await pg.waitForTimeout(3000);
  const f = ms => pg.evaluate(ms => new Promise(res => { let n = 0; const t0 = performance.now(); (function f() { n++; if (performance.now() - t0 < ms) requestAnimationFrame(f); else res(n / (ms / 1000)); })(); }), ms);
  const a = await f(4000), ent = await pg.evaluate(() => G.enemies.length), c = await f(4000);
  await ctx.close(); return { fps: (a + c) / 2, ent, errs: pg.errs.length };
}
async function fps(b) {
  console.log('--- fps (horda 7:15 del Pastor, Chromium sin GPU; 3 rondas alternadas)');
  const rows = { antes: [], 'fam=0': [], auto: [], 'fam=1': [] };
  for (let r = 0; r < 3; r++) {
    if (before) rows.antes.push((await fpsOf(b, before, '')).fps);
    rows['fam=0'].push((await fpsOf(b, base, '&fam=0')).fps); rows.auto.push((await fpsOf(b, base, '')).fps); rows['fam=1'].push((await fpsOf(b, base, '&fam=1')).fps);
  }
  const avg = a => a.length ? a.reduce((x, y) => x + y, 0) / a.length : NaN;
  Object.keys(rows).forEach(k => console.log(k.padEnd(6), rows[k].map(x => x.toFixed(1)).join(' '), 'media', avg(rows[k]).toFixed(1)));
  const ref = before ? avg(rows.antes) : avg(rows['fam=0']);
  ok(avg(rows.auto) >= ref - 1.5 && avg(rows['fam=1']) >= ref - 1.5, `fps sin regresion (auto ${avg(rows.auto).toFixed(1)}, fam=1 ${avg(rows['fam=1']).toFixed(1)} vs referencia ${ref.toFixed(1)}, margen de ruido 1,5)`);
}

(async () => {
  const b = await launch();
  if (what === 'unit' || what === 'all') await unit(b);
  if (what === 'det' || what === 'all') await det(b);
  if (what === 'flow' || what === 'all') { await flow(b, ''); await flow(b, '&fam=1'); }
  if (what === 'bosses' || what === 'all') { await bosses(b, '&fam=1'); }
  if (what === 'bosses0') { await bosses(b, '&fam=0'); }
  if (what === 'fps' || what === 'all') await fps(b);
  console.log(fails ? `RESULTADO: ${fails} FALLO(S)` : 'RESULTADO: TODO OK');
  await b.close(); process.exit(fails ? 1 : 0);
})();
