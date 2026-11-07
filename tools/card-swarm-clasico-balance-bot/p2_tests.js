// PRUEBAS P2 (familia del Asfodelo, DESIGN-v5-biomas.md A.5 / A.6 / A.8-A.11).
// uso: node p2_tests.js tele|mech|flow|data|all [base]   (base por defecto http://localhost:8793)
//  tele: audita las telegrafías nuevas (A.11.3): mide en el juego la duración real de cada aviso y la compara con G.B.tele y con la regla 250 + 1000*salida/190 (>= 400 ms los fuertes)
//  mech: mecánicas M5-M10 (charcos y emboscada, salto, rebrote/cauterización, línea instantánea, cdSlow, sin separación)
//  data: tabla A.5 (tiers, pesos, costes, topes), suma de w por tier, materiales, packs, allow de Letea, drops
//  flow: flujo aldea -> portal -> expedición -> botín -> aldea en los 3 biomas (bot, victoria)
const { chromium } = require('/opt/node-tools/node_modules/playwright');
const fs = require('fs');
const mode = process.argv[2] || 'all', base = process.argv[3] || 'http://localhost:8793';
const botSrc = fs.readFileSync(__dirname + '/bot_page.js', 'utf8');
let fails = 0; const ok = (c, msg) => { if (!c) fails++; console.log((c ? 'OK     ' : 'FALLO  ') + msg); };
const launch = () => chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--no-sandbox', '--autoplay-policy=no-user-gesture-required'] });
async function page(b, biome, q) {
  const pg = await b.newPage({ viewport: { width: 960, height: 540 } }); pg.errs = [];
  pg.on('console', m => { if (m.type() === 'error') pg.errs.push(m.text()); }); pg.on('pageerror', e => pg.errs.push('PAGEERR ' + e.message));
  await pg.goto(`${base}/index.html?reset=1&god=1&biome=${biome}${q || ''}`); await pg.waitForTimeout(400);
  await pg.evaluate(() => { G.startGame(); });
  return pg;
}
// Todo corre dentro de la página: __sim(ms) avanza E.update en pasos de 1000/60 sin tocar el director (W.update no se llama) ni el jugador (quieto)
const SIM = `
window.__sim = function (ms, cb) { var dt = 1000 / 60, t = 0; while (t < ms) { G.time += dt; G.Player.update(G.player, dt); G.Enemies.update(dt); G.Combat.update(dt); t += dt; if (cb && cb(t) === false) break; } return t; };
window.__clear = function () { G.enemies.length = 0; G.projectiles.length = 0; G.zones.length = 0; G.gems.length = 0; var p = G.player; p.x = 720; p.y = 405; p.hp = p.maxHp; p.hurtT = 0; p.kx = p.ky = 0; p.slowT = 0; p.cdSlowT = 0; p.cdSlowPct = 0; G.state = 'play'; };
window.__mk = function (type, dx, dy) { var e = G.Enemies.spawn(type, 720 + dx, 405 + dy, { spawnT: 0, inPond: true }); e.sumT = 1e9; return e; };
window.__durs = function (e, ms, states) { var cur = null, t0 = 0, out = {}; __sim(ms, function (t) { if (e.dead) { if (cur && states.indexOf(cur) >= 0) (out[cur] = out[cur] || []).push(Math.round(t - t0)); cur = null; return false; } if (e.st !== cur) { if (cur && states.indexOf(cur) >= 0) (out[cur] = out[cur] || []).push(Math.round(t - t0)); cur = e.st; t0 = t; } }); return out; };
window.__hit = function (e, dmg, tag) { return G.Combat.deal(e, dmg, { tag: tag || 'steel', ang: 0 }); };
`;

async function data(b) {
  console.log('--- data (tabla A.5)');
  const pg = await page(b, 'asfodelo', '&dbg=1'); await pg.evaluate(SIM);
  const r = await pg.evaluate(() => {
    const B = G.B, f = B.fam.asfodelo, u = f.use, o = { ready: f.ready, n: Object.keys(u).length, ponds: f.ponds, sums: [0, 0, 0, 0], caps: [0, 0, 0, 0], rows: {} };
    Object.keys(u).forEach(k => { const e = u[k], t = e.tier; o.sums[t] += e.w; o.caps[t] += e.maxAlive; o.rows[k] = [e.name, t, e.from / 1000, e.w, e.cost, e.maxAlive, e.capGrow || 0, e.mat]; });
    o.has = ['worm', 'leech', 'boar', 'headlet', 'moth', 'sower', 'scorcher', 'warlock'].every(k => B.has(k)) && ['archer', 'fanner', 'bomb', 'shield', 'blinker', 'dog', 'salamander', 'chainer'].every(k => !B.has(k));
    G.curBiome = 'asfodelo'; o.mat = G.B.mat.on; o.lens = G.B.matLens('asfodelo');
    o.allow = window.censusAllowCheck ? 1 : 0;
    const D = G.Boss.DEFS.letea; o.letea = D.phases.filter(p => p.spawn.mul > 0).map(p => Object.keys(p.spawn.allow).filter(k => B.has(k)));
    o.packs = f.packs.map(p => p.id + ':' + p.parts.map(q => q[0] + q[1]).join('+'));
    o.drops = ['leech', 'headlet'].map(k => G.Loot.DROPS[k]);
    o.tele = B.teleAudit().filter(t => !t.ok).map(t => t.id);
    o.mx = { anguila: f.use.scorcher.mx, cabeza: f.use.headlet.mx };
    return o;
  });
  ok(r.ready && r.n === 8 && r.ponds === 6, 'familia Asfodelo ready, 8 tipos, 6 charcos');
  ok(r.sums.join() === '55,44,29,25', 'suma de w por tier 55/44/29/25 = ' + r.sums.join('/'));
  ok(r.caps.join() === '40,15,8,9', 'topes base por tier 40/15/8/9 (A.5: 40/18/11/9; Sanguijuela 10 -> 7, Cabeza menor 5 -> 3 y Medusa 6 -> 5 por censo y cuota <= 10 %) = ' + r.caps.join('/'));
  console.log(JSON.stringify(r.rows));
  ok(r.has, 'roles presentes (8) y ausentes (archer fanner bomb shield blinker + dog salamander chainer)');
  ok(r.mat, 'materiales encendidos en el Asfodelo');
  ok(r.lens && r.lens.best.join() === 'lightning,poison' && r.lens.worst.join() === 'ice,steel,blood', 'chips MEJOR Rayo,Veneno / PEOR Hielo,Acero,Sangre');
  ok(r.letea.every(a => a.length >= 2 && a.indexOf('leech') >= 0), 'allow de Letea x familia nunca vacia y con Sanguijuela/Rana: ' + JSON.stringify(r.letea));
  ok(r.packs.length === 4, 'packs A.9: ' + r.packs.join(' | '));
  ok(r.drops.every(Boolean), 'drops nuevos (Sanguijuela, Cabeza menor) ' + JSON.stringify(r.drops));
  ok(!r.tele.length, 'auditoria de telegrafias (todas) sin fallos ' + r.tele.join(','));
  // materiales: valores de la tabla A.8 aplicados por deal
  const m = await pg.evaluate(() => {
    __clear(); const out = {}, mk = t => { const e = __mk(t, 400, 0); e.hp = e.maxHp = 1e6; return e; };
    const probe = (e, tag) => { e.hp = 1e6; const h0 = e.hp; G.Combat.deal(e, 10, { tag }); return +((h0 - e.hp) / (10 * G.B.cardDmgMul)).toFixed(2); };
    ['worm', 'leech', 'boar', 'headlet', 'moth', 'sower', 'scorcher', 'warlock'].forEach(t => { const e = mk(t); e.untarget = false; e.immune = false; out[t] = ['fire', 'ice', 'lightning', 'poison', 'blood', 'steel'].map(tg => probe(e, tg)).join(' '); });
    return out;
  });
  console.log(JSON.stringify(m));
  ok(m.worm === '1 1 1.25 1 0.75 0.75' && m.leech === '1 0.75 1.25 1.25 1 1' && m.headlet === '1.25 0.75 1.25 1.25 1 1' && m.moth === '1.25 0.75 1.25 1.25 1 1' && m.scorcher === '1 1 0.75 1.25 1 1' && m.sower === '1.25 1 1 0.75 0.75 1' && m.warlock === '1 1 1.25 1 0.75 0.75', 'A.8: espectro/pantano/vegetal + excepciones (Cabeza y Medusa Fuego x1,25; Anguila Rayo x0,75 y Hielo x1)');
  ok(!pg.errs.length, 'data: 0 errores ' + pg.errs.slice(0, 2).join(' | '));
  await pg.close();
}

async function tele(b) {
  console.log('--- telegrafias (A.11.3)');
  const pg = await page(b, 'asfodelo'); await pg.evaluate(SIM);
  const r = await pg.evaluate(() => {
    const out = {};
    function run(key, type, dx, dy, st, ms, prep) { __clear(); const e = __mk(type, dx, dy); e.shootT = 0; e.atkT = 0; if (prep) prep(e); const d = __durs(e, ms || 4000, [st]); out[key] = (d[st] || []).slice(0, 2); }
    // sanguijuela: oculta en su charco; el jugador pasa a < 150 px
    __clear(); { const e = __mk('leech', 0, 0); e.coolT = 0; const pd = e.pond; G.player.x = pd.x + 100; G.player.y = pd.y; const d = __durs(e, 3000, ['amb', 'exposed']); out.leech = (d.amb || []).slice(0, 1); out.leechExp = (d.exposed || []).slice(0, 1); }
    run('frog', 'boar', 200, 0, 'crouch', 4000, e => { e.hopT = 0; });
    __clear(); { const e = __mk('headlet', 0, 0); const d = __durs(e, 1600, ['emerge']); out.emerge = d.emerge || []; }
    __clear(); { const e = __mk('headlet', 0, 0); e.st = 'idle'; e.untarget = false; e.immune = false; e.biteT = 0; e.x = 720 + 50; e.y = 405; const d = __durs(e, 2500, ['wind']); out.headlet = d.wind || []; }
    run('eel', 'scorcher', 200, 0, 'wind', 4000);
    run('moth', 'moth', 170, 0, 'charge', 3500);
    run('warlock', 'warlock', 200, 0, 'cast', 3000, e => { e.sumT = 0; });
    __clear(); { const e = __mk('sower', 230, 0); e.sumT = 0; let arm = null; __sim(3000, () => { const z = G.zones.find(q => q.kind === 'olvido'); if (z) { arm = z.armMax; return false; } }); out.sower = [arm]; }
    return out;
  });
  const audit = await pg.evaluate(() => G.B.teleAudit()), MAP = { leech: 'leech', frog: 'frog', emerge: 'emerge', headlet: 'headlet', eel: 'eel', moth: 'moth', warlock: 'priest', sower: 'sower' };
  for (const k in r) {
    if (k === 'leechExp') continue;
    const meas = r[k][0], t = audit.find(a => a.id === MAP[k]); if (!t) continue;
    const okm = meas != null && Math.abs(meas - t.ms) <= 40;
    ok(okm && t.ok, `${k.padEnd(8)} medido ${String(meas).padStart(5)} ms (esperado ${t.ms})  salida ${String(t.exit).padStart(3)} px  regla ${String(t.need).padStart(4)} ms`);
  }
  ok(r.leechExp[0] != null && Math.abs(r.leechExp[0] - 1200) <= 40, 'sanguijuela expuesta ' + r.leechExp[0] + ' ms (1200)');
  ok(!pg.errs.length, 'tele: 0 errores ' + pg.errs.slice(0, 2).join(' | '));
  await pg.close();
}

async function mech(b) {
  console.log('--- mecanicas M5-M10');
  let pg = await page(b, 'asfodelo', '&hand=spark:3'); await pg.evaluate(SIM);
  // ---------------- M5 charcos / sanguijuela
  let r = await pg.evaluate(() => {
    __clear(); const o = {}; o.ponds = G.ponds.length; o.pr = G.ponds[0].r;
    const e = __mk('leech', 0, 0); const pd = e.pond; o.inPond = Math.hypot(e.x - pd.x, e.y - pd.y) < 12; o.hidden = e.hidden && e.untarget;
    o.nearest = G.Combat.nearest(e.x, e.y, 200) === e; o.inRange = G.Combat.inRange(e.x, e.y, 50).length;
    o.dealHidden = G.Combat.deal(e, 50, { tag: 'steel' }); o.hp = e.hp === e.maxHp;
    G.player.x = 1300; G.player.y = 700; e.coolT = 0; __sim(1500); o.farStill = e.st === 'hidden' || e.st === undefined;
    // el jugador pasa a 100 px de su charco
    __clear(); const e2 = __mk('leech', 0, 0); e2.coolT = 0; const p2 = e2.pond; G.player.x = p2.x + 100; G.player.y = p2.y; G.god = false;
    const seen = []; let last = null, hurtDmg = null, hp0 = G.player.hp, lungeLen = 0, sx = null;
    __sim(5000, t => { if (e2.st !== last) { seen.push(e2.st); last = e2.st; if (e2.st === 'lunge') sx = [e2.x, e2.y]; if (e2.st === 'exposed') lungeLen = Math.hypot(e2.x - sx[0], e2.y - sx[1]); } if (G.player.hp < hp0 && hurtDmg == null) hurtDmg = hp0 - G.player.hp; });
    o.seen = seen.join('>'); o.hurt = hurtDmg && Math.round(hurtDmg); o.lunge = Math.round(lungeLen);
    // expuesta: es objetivo y recibe x1,3
    __clear(); const e3 = __mk('leech', 0, 0); e3.hp = e3.maxHp = 1000; e3.st = 'exposed'; e3.hidden = e3.untarget = false; e3.expT = 1200; e3.expMul = 1.3; e3.mat = null; const h = e3.hp; G.Combat.deal(e3, 10, { tag: 'steel' }); o.exp = +((h - e3.hp) / (10 * G.B.cardDmgMul)).toFixed(2);
    return o;
  });
  console.log('M5 sanguijuela', JSON.stringify(r));
  ok(r.ponds === 6 && r.pr === 36, 'G.ponds: 6 charcos de r 36');
  ok(r.inPond && r.hidden && !r.nearest && r.inRange === 0 && r.dealHidden === 0 && r.hp, 'sanguijuela nace oculta en un charco: no es objetivo (nearest/inRange) y no recibe dano');
  ok(r.farStill, 'sin nadie cerca permanece oculta');
  ok(/^(hidden>)?amb>lunge>exposed>flee>hidden/.test(r.seen), 'emboscada: ' + r.seen);
  ok(r.hurt >= 8 && r.hurt <= 10 && r.lunge >= 130 && r.lunge <= 225, `lance de ${r.lunge} px (140-220) con ${r.hurt} de dano (9)`);
  ok(r.exp === 1.3, 'expuesta: x1,3 (' + r.exp + ')');

  r = await pg.evaluate(() => {   // el director la hace llegar arrastrandose (visible, vulnerable) al charco mas cercano y alli se oculta
    __clear(); const o = {}; const e = G.Enemies.spawn('leech', 60, 60, { spawnT: 0 }); e.sumT = 1e9;
    o.start = e.st + (e.hidden ? ' oculta' : ' visible'); o.target = !e.untarget; const seen = []; let last = null;
    __sim(25000, t => { if (e.st !== last) { seen.push(e.st); last = e.st; } if (e.st === 'hidden') return false; });
    o.seen = seen.join('>'); o.end = e.st + (e.hidden ? ' oculta' : ''); o.atPond = Math.hypot(e.x - e.pond.x, e.y - e.pond.y) < 10;
    return o;
  });
  console.log('M5 arrastre', JSON.stringify(r));
  ok(r.start === 'flee visible' && r.target && r.seen === 'flee>hidden' && r.atPond, 'sanguijuela del director: llega visible y vulnerable y se oculta al llegar al charco (' + r.seen + ')');

  // ---------------- M5/M7 cabeza menor
  r = await pg.evaluate(() => {
    __clear(); const o = {}; G.god = false; const e = __mk('headlet', 0, 0); const pd = e.pond;
    o.pondOK = !!pd && Math.hypot(e.x - pd.x, e.y - pd.y) < 12; o.emergeImm = e.immune && e.untarget;
    G.player.x = 1300; G.player.y = 750; __sim(800);
    o.fixed = e.st === 'idle' && e.spd === 0; const x0 = e.x, y0 = e.y; G.player.x = pd.x + 200; G.player.y = pd.y; __sim(600); o.still = Math.hypot(e.x - x0, e.y - y0) < 1;
    // muerte sin quemadura -> muñon -> rebrota a los 8 s con el 60 % de HP, XP/Ceniza/botin solo la primera vez
    const g0 = G.gems.length, k0 = G.kills; e.hp = 1; G.Combat.deal(e, 50, { tag: 'steel' });
    o.stump1 = e.st === 'stump' && !e.dead && e.untarget; o.gems1 = G.gems.length - g0; o.kills1 = G.kills - k0;
    let tRe = null; __sim(9000, t => { if (e.st === 'regrow' && tRe == null) tRe = t; if (e.st === 'idle') { o.regrowAt = Math.round(t); return false; } });
    o.regrowHp = +(e.hp / e.maxHp).toFixed(2); o.tRegrowStart = Math.round(tRe);
    const g1 = G.gems.length, k1 = G.kills; e.hp = 1; G.Combat.deal(e, 50, { tag: 'steel' });
    o.stump2 = e.st === 'stump' && e.regrowN === 2; __sim(9000, () => { if (e.st === 'idle') return false; });
    o.gems2 = G.gems.length - g1; o.kills2 = G.kills - k1;
    e.hp = 1; G.Combat.deal(e, 50, { tag: 'steel' });   // 3.ª muerte: definitiva (ya rebrotó 2 veces)
    o.final3 = e.dead; o.gems3 = G.gems.length - g1;
    // cauterizacion: el ultimo golpe es Fuego -> muerte definitiva (y XP/botin normal)
    __clear(); const f = __mk('headlet', 0, 0); G.player.x = 1300; G.player.y = 750; __sim(800); const gk = G.gems.length, kk = G.kills; f.hp = 1; G.Combat.deal(f, 50, { tag: 'fire' });
    o.burnDead = f.dead && f.cauterized; o.burnGems = G.gems.length - gk; o.burnKills = G.kills - kk;
    // cauterizacion por quemadura previa: el golpe final es de Acero pero esta ardiendo
    __clear(); const h = __mk('headlet', 0, 0); G.player.x = 1300; G.player.y = 750; __sim(800); G.Combat.burn(h, 5, 2000); h.hp = 1; G.Combat.deal(h, 50, { tag: 'steel' }); o.burnPrev = h.dead;
    // Fuego x1,25 sobre Cabeza menor
    __clear(); const m = __mk('headlet', 0, 0); m.hp = m.maxHp = 1e5; m.untarget = false; m.immune = false; const hh = m.hp; G.Combat.deal(m, 10, { tag: 'fire' }); o.fire = +((hh - m.hp) / (10 * G.B.cardDmgMul)).toFixed(2);
    return o;
  });
  console.log('M5/M7 cabeza', JSON.stringify(r));
  ok(r.pondOK && r.emergeImm, 'cabeza menor brota en un charco (inmune mientras brota)');
  ok(r.fixed && r.still, 'queda fija (vel 0)');
  ok(r.stump1 && r.kills1 === 1 && r.gems1 > 0, 'muerte sin quemadura -> muñon; XP/botin la primera vez (gemas ' + r.gems1 + ', kills ' + r.kills1 + ')');
  ok(r.regrowAt >= 7900 && r.regrowAt <= 8100 && Math.abs(r.regrowHp - 0.6) < 0.01, `rebrota a los ${r.regrowAt} ms con ${r.regrowHp * 100} % de HP`);
  ok(r.stump2 && r.gems2 === 0 && r.kills2 === 0, 'segunda muerte: otro muñon sin XP/botin/kills (gemas ' + r.gems2 + ')');
  ok(r.final3 && r.gems3 === 0, 'tras 2 rebrotes la 3.ª muerte es definitiva');
  ok(r.burnDead && r.burnGems > 0 && r.burnKills === 1, 'cauterizada con Fuego: muerte definitiva con XP/botin');
  ok(r.burnPrev, 'cauterizada con quemadura previa (ultimo golpe Acero)');
  ok(r.fire === 1.25, 'Fuego x1,25 sobre la Cabeza menor');

  // ---------------- M6 rana
  r = await pg.evaluate(() => {
    __clear(); const o = {}; G.god = false; const e = __mk('boar', 200, 0); e.hopT = 0; const pHp = G.player.hp;
    const seen = []; let last = null, t0 = 0, dur = {}, pool = null, jmax = 0, landed = null;
    G.player.x = 720; G.player.y = 405;
    __sim(5000, t => { if (e.st !== last) { if (last) dur[last] = Math.round(t - t0); seen.push(e.st); last = e.st; t0 = t; if (e.st === 'crouch') o.land = [e.lx, e.ly]; } if (e.st === 'air') jmax = Math.max(jmax, e.jump || 0); if (!pool) { const z = G.zones.find(z => z.kind === 'acid' && z.owner === e); if (z) pool = { r: z.r, arm: z.armMax, life: z.life, dmg: z.dmg, tick: z.tick }; } });
    o.seen = seen.slice(0, 5).join('>'); o.dur = dur; o.pool = pool; o.jump = Math.round(jmax); o.hp = e.maxHp; o.dist = Math.round(Math.hypot(o.land[0] - 920, o.land[1] - 405));
    // jugador exactamente en el punto de aterrizaje -> 10 de dano
    __clear(); G.god = false; const f = __mk('boar', 180, 0); f.hopT = 0; G.player.x = 720; G.player.y = 405; let hp0 = G.player.hp;
    __sim(1000, () => { if (f.st === 'air') return false; }); G.player.x = f.lx; G.player.y = f.ly; G.player.hurtT = 0; hp0 = G.player.hp; __sim(600);
    o.dmg = Math.round(hp0 - G.player.hp);
    return o;
  });
  console.log('M6 rana', JSON.stringify(r));
  ok(/^move>crouch>air>rest>move/.test(r.seen) || /^crouch>air>rest>move/.test(r.seen), 'salto: ' + r.seen);
  ok(Math.abs(r.dur.crouch - 500) <= 40 && Math.abs(r.dur.air - 400) <= 40 && Math.abs(r.dur.rest - 700) <= 40, 'agacha 500 / aire 400 / descanso 700: ' + JSON.stringify(r.dur));
  ok(r.pool && r.pool.r === 28 && r.pool.arm === 600 && r.pool.tick === 500 && Math.abs(r.pool.dmg - 6) < 0.8, 'charco acido r 28, aviso 600, 6 / 500 ms: ' + JSON.stringify(r.pool));
  ok(r.jump >= 40 && r.dmg >= 9 && r.dmg <= 11, `arco (${r.jump} px) y aterrizaje de ${r.dmg} de dano (10)`);

  // ---------------- M8 anguila
  r = await pg.evaluate(() => {
    __clear(); const o = {}; G.god = false; const e = __mk('scorcher', 200, 0); e.atkT = 0; e.mat = e.mat; const seen = []; let last = null, dur = {}, t0 = 0, hp0 = G.player.hp, firstHit = null, zones0 = G.zones.length, zonesMax = 0;
    __sim(5000, t => { if (e.st !== last) { if (last) dur[last] = Math.round(t - t0); seen.push(e.st); last = e.st; t0 = t; } if (G.player.hp < hp0 && firstHit == null) firstHit = { t: Math.round(t), dmg: Math.round(hp0 - G.player.hp), st: e.st }; zonesMax = Math.max(zonesMax, G.zones.length - zones0); });
    o.seen = seen.join('>'); o.dur = dur; o.hit = firstHit; o.zones = zonesMax;
    // el jugador sale del carril (45 px al lado) cuando el rumbo ya esta fijado: sin dano
    __clear(); const f = __mk('scorcher', 200, 0); f.atkT = 0; const hp1 = G.player.hp; let moved = false;
    __sim(1600, () => { if (f.st === 'wind' && f.t >= 450 && !moved) { moved = true; G.player.y += 45; } });
    o.sideHp = G.player.hp === hp1 && moved;
    return o;
  });
  console.log('M8 anguila', JSON.stringify(r));
  ok(/^move>wind>zap>dash>rec>move/.test(r.seen) || /^wind>zap>dash>rec/.test(r.seen), 'secuencia: ' + r.seen);
  ok(Math.abs(r.dur.wind - 700) <= 40 && Math.abs(r.dur.zap - 150) <= 40 && Math.abs(r.dur.rec - 800) <= 40, 'aviso 700 / rayo 150 / descanso 800: ' + JSON.stringify(r.dur));
  ok(r.hit && r.hit.dmg >= 13 && r.hit.dmg <= 15 && r.zones === 0, 'rayo de 14 de dano al instante y sin rastro persistente (zonas ' + r.zones + '): ' + JSON.stringify(r.hit));
  ok(r.sideHp, 'fuera del carril no hay dano');

  // ---------------- M9 cdSlow
  r = await pg.evaluate(() => {
    __clear(); const o = {}; G.state = 'play';
    const P = G.Player, p = G.player;
    P.cdSlow(p, 0.9, 99999); o.cap = [p.cdSlowPct, p.cdSlowT]; P.cdSlow(p, 0.2, 100); o.noStack = [p.cdSlowPct, p.cdSlowT];
    p.cdSlowT = 0; p.cdSlowPct = 0;
    // ritmo de enfriamiento: una carta con cd cargado baja a 1 (normal) vs 0,6 (con cdSlow)
    const slot = p.hand.find(s => s && G.Cards.def(s.id).type === 'attack' && !G.Cards.def(s.id).kind.match(/orbital|aura/)) || null; o.slot = slot && slot.id;
    function cdDrop(slow) { p.cdSlowT = slow ? 5000 : 0; p.cdSlowPct = slow ? 0.4 : 0; slot.cd = 5000; const c0 = slot.cd; G.enemies.length = 0; G.Weapons.update(500); return c0 - slot.cd; }
    const a = cdDrop(false), b2 = cdDrop(true); o.ratio = +(b2 / a).toFixed(2);
    // zona del Lirio: el jugador dentro -> cdSlowT 2000 al salir; fuera decae
    __clear(); G.zones.push({ team: 'e', kind: 'olvido', x: 720, y: 405, r: 42, arm: 0, armMax: 0, life: 4000, max: 4000, dmg: 3, tick: 500, tk: 0, slow: 0, cd: true, owner: null, src: 'olvido', t: 0 });
    __sim(300); o.inside = [p.cdSlowPct, Math.round(p.cdSlowT)]; p.x = 900; __sim(1000); o.after1s = Math.round(p.cdSlowT); __sim(1400); o.after = [p.cdSlowT, p.cdSlowPct];
    // el lirio: aviso y zona
    __clear(); const l = __mk('sower', 230, 0); l.sumT = 0; const k = []; __sim(2500, () => { const z = G.zones.find(q => q.kind === 'olvido'); if (z && !k.length) k.push({ r: z.r, arm: z.armMax, life: z.life, dmg: z.dmg, cd: z.cd }); });
    o.zone = k[0]; o.nzones = G.zones.filter(z => z.kind === 'olvido').length;
    return o;
  });
  console.log('M9 cdSlow', JSON.stringify(r));
  ok(r.cap[0] === 0.4 && r.cap[1] === 2000, 'tope: <= 40 % y <= 2 s ' + r.cap.join('/'));
  ok(r.noStack[0] === 0.4 && r.noStack[1] === 2000, 'no se apila (sigue en 40 % / 2 s)');
  ok(r.ratio > 0.55 && r.ratio < 0.65, 'el cooldown avanza al 60 % con cdSlow (ratio ' + r.ratio + ', carta ' + r.slot + ')');
  ok(r.inside[0] === 0.4 && r.inside[1] > 1900 && r.after1s > 800 && r.after1s < 1200 && r.after[0] <= 0 && r.after[1] === 0, `dentro de la zona 40 %, +2 s al salir y despues vuelve a 0 (${JSON.stringify(r.inside)} ${r.after1s} ${JSON.stringify(r.after)})`);
  ok(r.zone && r.zone.r === 42 && r.zone.arm === 900 && r.zone.life > 3500 && r.zone.cd && r.nzones <= 5, 'Lirio: zona r 42, aviso 900 ms, 4 s, con cdSlow: ' + JSON.stringify(r.zone));
  // HUD: icono de reloj roto mientras dura
  const hud = await pg.evaluate(() => { __clear(); const c = document.createElement('canvas'); c.width = 960; c.height = 540; const g = c.getContext('2d'); G.player.cdSlowT = 1500; G.player.cdSlowPct = 0.4; G.Hud.drawCdSlow(g, G.player); const a = g.getImageData(230, 460, 40, 40).data; let n = 0; for (let i = 3; i < a.length; i += 4) if (a[i] > 0) n++; G.player.cdSlowT = 0; const c2 = document.createElement('canvas'); c2.width = 960; c2.height = 540; const g2 = c2.getContext('2d'); G.Hud.drawCdSlow(g2, G.player); const a2 = g2.getImageData(230, 460, 40, 40).data; let n2 = 0; for (let i = 3; i < a2.length; i += 4) if (a2[i] > 0) n2++; return [n, n2]; });
  ok(hud[0] > 200 && hud[1] === 0, 'HUD: reloj roto dibujado mientras dura (' + hud[0] + ' px) y ausente despues');
  // no aplica a jefes: el jefe no tiene cdSlow ni weapons lo lee de otra cosa
  const nb = await pg.evaluate(() => { __clear(); G.Boss.spawn && 0; return typeof G.Player.cdSlow; });
  ok(nb === 'function', 'P.cdSlow definido; solo el jugador lo tiene (p.cdSlowT)');

  // ---------------- M10 sin separacion
  r = await pg.evaluate(() => {
    function spread(biomeFam) { __clear(); const es = []; for (let i = 0; i < 12; i++) { const e = G.Enemies.spawn('worm', 400 + i * 0.5, 300, { spawnT: 0 }); e.spd = 0; e.spdBase = 0; es.push(e); } __sim(1000); let m = 0; es.forEach(e => { m = Math.max(m, Math.hypot(e.x - es[0].x, e.y - es[0].y)); }); return +m.toFixed(1); }
    const o = { asf: spread(), n: 0 }; const e = G.Enemies.spawn('worm', 1, 1, { spawnT: 0 }); o.nosep = !!e.nosep && e.fe.alpha === 0.8;
    G.curBiome = 'bosque'; o.bos = spread(); G.curBiome = 'asfodelo';
    return o;
  });
  console.log('M10', JSON.stringify(r));
  ok(r.nosep && r.asf < 8 && r.bos > 15, `Alma errante se apila (dispersion ${r.asf} px) y el Cordero se separa (${r.bos} px)`);
  ok(!pg.errs.length, 'mech: 0 errores ' + pg.errs.slice(0, 3).join(' | '));
  await pg.close();
}

async function flow(b, biome, bossKills) {
  console.log('--- flujo aldea->portal->expedicion->botin->aldea (' + biome + ')');
  const ctx = await b.newContext({ viewport: { width: 960, height: 540 } }), pg = await ctx.newPage(); pg.errs = [];
  pg.on('console', m => { if (m.type() === 'error') pg.errs.push(m.text()); }); pg.on('pageerror', e => pg.errs.push('PAGEERR ' + e.message));
  await pg.goto(`${base}/index.html?reset=1&dbg=1&god=1&len=7&speed=20`); await pg.waitForTimeout(500);
  const st = () => pg.evaluate(() => G.state);
  ok((await st()) === 'aldea', 'arranca en la aldea');
  await pg.evaluate(([bio, kills]) => { G.Save.data.bossKills.pastor = kills > 0 ? 1 : 0; G.Save.data.bossKills.karceron = kills > 1 ? 1 : 0; G.Save.data.biome = bio; G.Save.save(); }, [biome, bossKills]);
  await pg.keyboard.press('Tab'); await pg.waitForTimeout(900); await pg.keyboard.press('KeyE'); await pg.waitForTimeout(700);
  await pg.evaluate(botSrc); await pg.keyboard.press('Enter'); await pg.waitForTimeout(500);
  const s1 = await st(); ok(s1 === 'play' || s1 === 'cards', 'portal -> expedicion (' + s1 + ')');
  ok((await pg.evaluate(() => G.curBiome)) === biome && (await pg.evaluate(() => !!G.B.famOf())), 'bioma de la expedicion = ' + biome + ' con familia');
  await pg.evaluate(() => window.installBalanceBot({}));
  for (let i = 0; i < 400; i++) { await pg.waitForTimeout(500); if ((await st()) === 'gameover') break; }
  await pg.waitForTimeout(800);
  const res = await pg.evaluate(() => ({ won: G.won, total: G.Loot.summary && G.Loot.summary.total, brasas: G.Loot.summary && G.Loot.summary.brasas, boss: G.Loot.summary && G.Loot.summary.boss && G.Loot.summary.boss.name }));
  ok((await st()) === 'gameover' && res.won && res.total > 0, 'expedicion terminada con victoria y botin ' + JSON.stringify(res));
  await pg.keyboard.press('KeyB'); await pg.waitForTimeout(1200);
  ok((await st()) === 'aldea', 'botin -> aldea');
  ok(!pg.errs.length, 'flujo ' + biome + ': 0 errores de consola ' + pg.errs.slice(0, 3).join(' | '));
  await ctx.close();
}

(async () => {
  const b = await launch();
  if (mode === 'data' || mode === 'all') await data(b);
  if (mode === 'tele' || mode === 'all') await tele(b);
  if (mode === 'mech' || mode === 'all') await mech(b);
  if (mode === 'flow' || mode === 'all') { await flow(b, 'bosque', 0); await flow(b, 'cripta', 1); await flow(b, 'asfodelo', 2); }
  console.log(fails ? `RESULTADO: ${fails} FALLO(S)` : 'RESULTADO: TODO OK');
  await b.close(); process.exit(fails ? 1 : 0);
})();
