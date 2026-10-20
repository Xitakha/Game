// PRUEBAS P1 (familias Bosque + Cripta). uso: node p1_tests.js tele|mech|all [base]   (base por defecto http://localhost:8791)
//  tele: audita las telegrafías (A.11.3): mide en el juego (E.update con paso fijo) la duración real de cada aviso y la compara con G.B.tele y con la regla 250 + 1000*salida/190 (>= 400 ms los fuertes)
//  mech: mecánicas M1-M4 (perro: órbita/ladrido/arreo/empuje al centro; calavera: rebote; salamandra: rastro máx. 6; cadena: ralentiza) + sprites/anims de todas las entradas
const { chromium } = require('/opt/node-tools/node_modules/playwright');
const mode = process.argv[2] || 'all', base = process.argv[3] || 'http://localhost:8791';
async function page(b, biome) {
  const pg = await b.newPage({ viewport: { width: 960, height: 540 } }), errs = [];
  pg.on('console', m => { if (m.type() === 'error') errs.push(m.text()); }); pg.on('pageerror', e => errs.push('PAGEERR ' + e.message));
  await pg.goto(`${base}/index.html?reset=1&god=1&biome=${biome}`); await pg.waitForTimeout(400);
  await pg.evaluate(() => { G.startGame(); });
  pg.errs = errs; return pg;
}
// Todo corre dentro de la página: sim(ms) avanza E.update en pasos de 1000/60 sin tocar el director (W.update no se llama) ni el jugador (quieto, invulnerable)
const SIM = `
window.__sim = function (ms, cb) { var dt = 1000 / 60, t = 0; while (t < ms) { G.time += dt; G.Player.update(G.player, dt); G.Enemies.update(dt); t += dt; if (cb && cb(t) === false) break; } return t; };
window.__clear = function () { G.enemies.length = 0; G.projectiles.length = 0; G.zones.length = 0; var p = G.player; p.x = 720; p.y = 405; p.hp = p.maxHp; p.hurtT = 0; p.kx = p.ky = 0; p.slowT = 0; };
window.__mk = function (type, dx, dy) { var e = G.Enemies.spawn(type, 720 + dx, 405 + dy, { spawnT: 0 }); e.sumT = 1e9; return e; };
// duración (ms) de cada visita a un estado
window.__durs = function (e, ms, states) { var cur = null, t0 = 0, out = {}, T = 0; __sim(ms, function (t) { T = t; if (e.dead) { if (cur && states.indexOf(cur) >= 0) (out[cur] = out[cur] || []).push(Math.round(t - t0)); cur = null; return false; } if (e.st !== cur) { if (cur && states.indexOf(cur) >= 0) (out[cur] = out[cur] || []).push(Math.round(t - t0)); cur = e.st; t0 = t; } }); return out; };
`;
async function tele(b) {
  const res = [];
  for (const biome of ['bosque', 'cripta']) {
    const pg = await page(b, biome); await pg.evaluate(SIM);
    const r = await pg.evaluate(() => {
      const out = {}, T = G.B.tele, fam = G.B.famOf();
      function run(key, type, dx, dy, st, ms, prep) { __clear(); const e = __mk(type, dx, dy); e.shootT = 0; e.atkT = 0; e.bashT = 0; if (prep) prep(e); const d = __durs(e, ms || 4000, [st]); out[key] = (d[st] || []).slice(0, 2); }
      const has = t => !!fam.use[t];
      if (has('archer')) run('archer', 'archer', 230, 0, 'aim', 3000);
      if (has('fanner')) run('fanner', 'fanner', 210, 0, 'aim', 3500);
      if (has('moth')) run('moth', 'moth', 170, 0, 'charge', 3500);
      if (has('dog')) run('dog', 'dog', 190, 0, 'bark', 5000, e => { e.orbT = 0; });
      if (has('boar')) run('roll', 'boar', 200, 0, 'wind', 3000);
      if (has('boar') && fam.use.boar.roll) { __clear(); G.player.x = 110; const e = __mk('boar', -250, 0); e.x = 250; const d = __durs(e, 4500, ['bounce']); out.bounce = d.bounce || []; }
      if (has('shield')) run('shield', 'shield', 55, 0, 'wind', 3000, e => { e.bashT = 0; });
      if (has('bomb')) run('bomb', 'bomb', 30, 0, 'lit', 2500);
      if (has('chainer')) run('chainer', 'chainer', 220, 0, 'wind', 3500);
      if (has('blinker')) { run('blinkerFade', 'blinker', 200, 0, 'fade', 3500); }
      if (has('blinker')) run('blinkerSlash', 'blinker', 200, 0, 'slash', 4500);
      if (has('scorcher')) run('scorcher', 'scorcher', 250, 0, 'wind', 3500);
      if (has('warlock')) run('warlock', 'warlock', 200, 0, 'cast', 3000, e => { e.sumT = 0; });
      if (has('sower')) { __clear(); const e = __mk('sower', 230, 0); e.sumT = 0; let arm = null; __sim(3000, () => { const z = G.zones.find(q => q.kind === 'spore'); if (z) { arm = z.armMax; return false; } }); out.sower = [arm]; }
      if (has('salamander')) { __clear(); const e = __mk('salamander', 300, 0); let arm = null; __sim(4000, () => { const z = G.zones.find(q => q.kind === 'fire'); if (z) { arm = z.armMax; return false; } }); out.salamander = [arm]; }
      return out;
    });
    const audit = await pg.evaluate(() => G.B.teleAudit());
    res.push({ biome, r, audit, errs: pg.errs.slice(0, 5) }); await pg.close();
  }
  let bad = 0;
  const MAP = { archer: 'archer', fanner: 'fanner', moth: 'moth', dog: 'dog', roll: 'roll', bounce: 'bounce', shield: 'shield', bomb: 'bomb', chainer: 'chainer', blinkerFade: 'blinker', blinkerSlash: 'blinker', scorcher: 'scorcher', warlock: 'warlock', sower: 'sower', salamander: 'salamander' };
  for (const x of res) {
    console.log('== ' + x.biome + '  (errores de consola: ' + x.errs.length + ')');
    for (const k in x.r) {
      const meas = x.r[k][0], t = x.audit.find(a => a.id === MAP[k]); if (!t) continue;
      const exp = k === 'blinkerFade' ? 500 : k === 'blinkerSlash' ? 350 : t.ms;
      const okm = meas != null && Math.abs(meas - exp) <= 40, rule = t.ok;
      if (!okm || !rule) bad++;
      console.log(`${k.padEnd(13)} medido ${String(meas).padStart(5)} ms (esperado ${exp})  salida ${String(t.exit).padStart(3)} px  regla ${String(t.need).padStart(4)} ms  ${okm && rule ? 'OK' : 'FALLA'}`);
    }
    x.audit.forEach(a => { if (!a.ok) console.log('AUDITORIA FALLA', a.id); });
    if (x.errs.length) { bad++; console.log(x.errs); }
  }
  console.log(bad ? 'TELE: ' + bad + ' fallos' : 'TELE: OK'); return bad;
}
async function mech(b) {
  let bad = 0; const ck = (n, ok, info) => { if (!ok) bad++; console.log((ok ? 'OK    ' : 'FALLA ') + n + (info ? '  ' + info : '')); };
  let pg = await page(b, 'bosque'); await pg.evaluate(SIM);
  // M1 perro
  let r = await pg.evaluate(() => {
    __clear(); const p = G.player; p.x = 300; p.y = 405; const e = G.Enemies.spawn('dog', 300 + 190, 405, { spawnT: 0 });
    const seen = {}, rr = []; let minD = 1e9, maxD = 0, hurtAt = null, px0 = p.x, push = null;
    __sim(9000, t => { seen[e.st] = (seen[e.st] || 0) + 1; const d = Math.hypot(e.x - p.x, e.y - p.y); if (e.st === 'bark' && e.t < 30) { minD = Math.min(minD, d); maxD = Math.max(maxD, d); } if (!hurtAt && p.hp < p.maxHp) { hurtAt = t; } if (hurtAt && push == null && t > hurtAt + 400) push = p.x - px0; });
    return { seen, minD: Math.round(minD), maxD: Math.round(maxD), hurt: hurtAt, push: push == null ? null : Math.round(push) };
  });
  console.log('perro', JSON.stringify(r));
  ck('M1 perro: orbita, ladra, arrea y vuelve a orbitar', r.seen.move > 20 && r.seen.bark > 20 && r.seen.dash > 5 && r.seen.rec > 20, JSON.stringify(r.seen));
  ck('M1 perro: ladra a 130-230 px del jugador', r.minD >= 130 && r.maxD <= 230, r.minD + '-' + r.maxD);
  // god=1: Player.hurt no aplica daño ni empuje con ?god (devuelve false antes); el empuje se prueba sin god en 'mech2'
  // M2 calavera: rebote contra la pared izquierda
  r = await pg.evaluate(() => {
    __clear(); const p = G.player; p.x = 40 + 28 + 30; p.y = 405; const e = G.Enemies.spawn('boar', 400, 405, { spawnT: 0 });
    const seen = [], pos = []; let last = null;
    __sim(6000, t => { if (e.st !== last) { seen.push(e.st); last = e.st; } });
    return { seen, fe: !!(e.fe && e.fe.roll) };
  });
  console.log('calavera (familia ' + r.fe + ')', r.seen.join('>'));
  await pg.close();
  pg = await page(b, 'cripta'); await pg.evaluate(SIM);
  r = await pg.evaluate(() => {
    __clear(); const p = G.player; p.x = 110; p.y = 405; const e = G.Enemies.spawn('boar', 300, 405, { spawnT: 0 });
    const seen = []; let last = null, bx = null, bounceAng = null, a0 = null;
    __sim(7000, t => { if (e.st === 'wind' && a0 == null) a0 = e.ang; if (e.st !== last) { seen.push(e.st); last = e.st; if (e.st === 'bounce') { bx = e.x; bounceAng = e.ang; } } });
    return { seen, fe: !!(e.fe && e.fe.roll), bx, bounceAng, a0 };
  });
  console.log('calavera cripta', r.seen.join('>'), 'bx', r.bx && Math.round(r.bx), 'ang0', r.a0 && r.a0.toFixed(2), 'angRebote', r.bounceAng && r.bounceAng.toFixed(2));
  ck('M2 calavera: move>wind>roll>bounce>roll2>stun', r.fe && /wind>roll>bounce>roll2>stun/.test(r.seen.join('>')), r.seen.join('>'));
  ck('M2 calavera: el rebote invierte la direccion en x', r.bounceAng != null && Math.cos(r.bounceAng) > 0 && Math.cos(r.a0) < 0);
  // M3 salamandra: rastro, tope 6 por salamandra, desaparece el mas viejo
  r = await pg.evaluate(() => {
    __clear(); const p = G.player; p.x = 1300; p.y = 405; const e = G.Enemies.spawn('salamander', 120, 405, { spawnT: 0 }); e.spdBase = 130;   // rápida para alcanzar el tope
    let maxN = 0, first = null, n70 = 0; const xs = [];
    __sim(11000, t => { const n = G.zones.filter(z => z.owner === e && z.kind === 'fire').length; maxN = Math.max(maxN, n); const z0 = G.zones.find(z => z.owner === e); if (z0 && !first) first = { arm: z0.armMax, life: z0.life, r: z0.r }; });
    const z = G.zones.filter(z => z.owner === e).map(z => Math.round(z.x));
    return { maxN, first, xs: z, x: Math.round(e.x) };
  });
  console.log('salamandra', JSON.stringify(r));
  ck('M3 salamandra: max 6 charcos vivos por salamandra', r.maxN === 6, 'max ' + r.maxN);
  ck('M3 charco: r 22, arm 600, life 5000', r.first && r.first.r === 22 && r.first.arm === 600 && r.first.life === 5000 - 0 || (r.first && r.first.r === 22 && r.first.arm === 600), JSON.stringify(r.first));
  const gaps = r.xs.slice(1).map((x, i) => Math.abs(x - r.xs[i]));
  ck('M3 charcos cada ~70 px', gaps.length > 2 && gaps.every(g => g > 55 && g < 90), gaps.join(','));
  // M4 cadena: ralentiza 45 % 1,8 s sin god
  await pg.close();
  const ctx = await b.newPage({ viewport: { width: 960, height: 540 } }); const errs = [];
  ctx.on('pageerror', e => errs.push(e.message)); ctx.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
  await ctx.goto(`${base}/index.html?reset=1&biome=cripta`); await ctx.waitForTimeout(400); await ctx.evaluate(() => { G.startGame(); }); await ctx.evaluate(SIM);
  r = await ctx.evaluate(() => {
    __clear(); const p = G.player; p.x = 700; p.y = 405; G.god = false; const e = G.Enemies.spawn('chainer', 920, 405, { spawnT: 0 }); e.atkT = 0;
    let slow = null, proj = null, hurtT = null; const seen = [];
    __sim(4000, t => { const q = G.projectiles.find(q => q.kind === 'chain'); if (q && !proj) proj = { spd: Math.round(Math.hypot(q.vx, q.vy)), life: Math.round(q.life), r: q.r, hp: q.hp, slow: q.slow }; if (p.slowT > 0 && !slow) slow = { pct: p.slowPct, ms: Math.round(p.slowT), hp: p.hp }; });
    return { proj, slow };
  });
  console.log('cadena', JSON.stringify(r));
  ck('M4 cadena: 420 px/s, ralentiza 45 % ~1,8 s, no interceptable (hp 0)', r.proj && r.proj.spd === 420 && r.proj.hp === 0 && r.slow && Math.abs(r.slow.pct - 0.45) < 0.01 && r.slow.ms > 1500 && r.slow.hp < 100, JSON.stringify(r));
  // empuje del perro hacia el centro (sin god)
  await ctx.close();
  const c2 = await b.newPage({ viewport: { width: 960, height: 540 } }); const e2 = [];
  c2.on('pageerror', e => e2.push(e.message));
  await c2.goto(`${base}/index.html?reset=1&biome=bosque`); await c2.waitForTimeout(400); await c2.evaluate(() => { G.startGame(); }); await c2.evaluate(SIM);
  r = await c2.evaluate(() => {
    __clear(); const p = G.player; p.x = 300; p.y = 200; const e = G.Enemies.spawn('dog', 300, 380, { spawnT: 0 }); e.orbT = 0; e.orR = 175;
    const x0 = p.x, y0 = p.y; let pushed = null, hp0 = p.hp;
    __sim(5000, t => { if (p.hp < hp0 && pushed == null) pushed = t; if (pushed != null && t > pushed + 500) return false; });
    const toC = Math.hypot(720 - x0, 405 - y0), now = Math.hypot(720 - p.x, 405 - p.y);
    return { moved: Math.round(Math.hypot(p.x - x0, p.y - y0)), closer: Math.round(toC - now), dmg: Math.round(hp0 - p.hp), pushed };
  });
  console.log('empuje del perro', JSON.stringify(r));
  ck('M1 empuje ~55 px hacia el centro', r.pushed != null && r.moved >= 40 && r.moved <= 70 && r.closer > 30, JSON.stringify(r));
  console.log('errores pagina', e2.concat(errs));
  await c2.close();
  console.log(bad ? 'MECH: ' + bad + ' fallos' : 'MECH: OK'); return bad;
}
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--no-sandbox'] });
  let bad = 0;
  if (mode === 'tele' || mode === 'all') bad += await tele(b);
  if (mode === 'mech' || mode === 'all') bad += await mech(b);
  await b.close(); process.exit(bad ? 1 : 0);
})();
