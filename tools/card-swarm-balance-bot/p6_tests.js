// PRUEBAS P6 (Melaria, la Reina Abeja; DESIGN-v5-biomas.md B.0, B.4, B.5, B.7, C.2).
// uso: node p6_tests.js data|tele|parts|mech|phases|unlock|flow|hunt|all [base]   (base por defecto http://localhost:8793)
//  data   : HP (hpCal final), fases, partes, debilidades y resistencias (Veneno inmune a estados), recompensas, tope de celdas 12 / 24 / 36, guardado v7, 5 jefes
//  tele   : regla de esquiva tele >= 250 + 1000 x salida / 190 en los 9 ataques y los 5 Peligros (>= 800 ms los de >= 25 de daño) y telegrafías medidas en el juego
//  parts  : Alas / Aguijón / Corona: efecto, trofeo y ataques que se pierden
//  mech   : Estocada, Picado (miel = atrapada), Llamada, Panal abierto (invariantes), Torbellino (zona segura), Jalea real (interrupción), Eclosión (hinchada), Fuego carameliza, Polinizador cura
//  phases : 3 fases con puerta inmune de 3 s, desesperado (5 anillos, 100 % esquivable), Peligro III (picado doble) y V (dos Zumbidos Mortales, adds <= 6)
//  unlock : el Panal se abre al vencer a Yarlak (Portal + persistencia), migración v6 -> v7 con copia de seguridad, encargos dormidos y flujo del chip
//  flow   : aldea -> Portal -> expedición -> jefe -> botín -> aldea en los 5 biomas con victoria y derrota
//  hunt   : ?hunt=melaria (HP x0,75), ?practice=1 (HP x0,5), ?boss=melaria y ?biome=panal
const { chromium } = require('/opt/node-tools/node_modules/playwright');
const mode = process.argv[2] || 'all', base = process.argv[3] || 'http://localhost:8793';
const HPCAL = 3.5;   // hpCal final de Melaria (README, calibración P6)
let fails = 0; const ok = (c, msg) => { if (!c) fails++; console.log((c ? 'OK     ' : 'FALLO  ') + msg); };
const launch = () => chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--no-sandbox', '--autoplay-policy=no-user-gesture-required'] });
async function page(b, q, vp) {
  const pg = await b.newPage({ viewport: vp || { width: 960, height: 540 } }); pg.errs = [];
  pg.on('console', m => { if (m.type() === 'error') pg.errs.push(m.text()); }); pg.on('pageerror', e => pg.errs.push('PAGEERR ' + e.message + ' ' + (e.stack || '').split('\n').slice(1, 3).join('|')));
  await pg.goto(`${base}/index.html?reset=1&god=1&dbg=1&boss=melaria&nointro=1&prep=0&hand=spark:3,dart:2,shard:2,dagger:2,fang:1${q || ''}`); await pg.waitForTimeout(500);
  await pg.evaluate(SIM);
  return pg;
}
// __sim(ms, cb): avanza el mundo del jefe en pasos de 1000/60 (sin el director); mantiene al jugador vivo y sin subidas de nivel
const SIM = `
window.__sim = function (ms, cb, keep) { var dt = 1000 / 60, t = 0; while (t < ms) { G.time += dt; G.Player.update(G.player, dt); if (!window.__noW) G.Weapons.update(dt); G.Enemies.update(dt); G.Combat.update(dt); G.Panal.update(dt); G.fx.update(dt); G.pendingLevels = 0; G.player.xp = 0; if (keep !== false) G.player.hp = G.player.maxHp; t += dt; if (cb && cb(t) === false) break; } return t; };
window.__prep = function (a) { var e = G.Boss.e; e.atk = null; e.bst = 'idle'; e.mode = 'fight'; e.immune = false; e.stagT = 0; e.exps.length = 0; e.cadT = 1e9; for (var k in G.Boss.cds) G.Boss.cds[k] = 0; G.projectiles.length = 0; };
window.__clean = function () { G.enemies.forEach(function (q) { if (q.type !== 'boss' && q.type !== 'bosspart') q.dead = true; }); };
`;
const RULE = exit => Math.round(250 + 1000 * exit / 190);
const NAMES = ['m_estocada', 'm_picado', 'm_lluvia', 'm_llamada', 'm_panal', 'm_torbellino', 'm_jalea', 'm_eclosion', 'm_alazo'];

async function data(b) {
  console.log('--- datos de Melaria');
  const pg = await page(b, '&len=9');
  const r = await pg.evaluate(() => {
    var S = G.Boss, D = S.DEFS.melaria, out = {};
    out.hp = [7, 9, 10].map(m => Math.round(D.hp * D.hpCal * S.durMul(m))); out.hp1 = S.bossHp('melaria'); out.base = D.hp; out.cal = D.hpCal;
    out.phases = D.phases.map(p => p.thr + '/' + p.cad + '/' + p.spd); out.parts = Object.keys(D.parts).map(k => k + ':' + D.parts[k].pct);
    out.weak = JSON.stringify(D.weak); out.resist = JSON.stringify(D.resist); out.rew = [D.brasas, D.brasasPart, D.pf, D.pfFirst, JSON.stringify(D.guaranteed)];
    out.pelHp = [1, 2, 3, 4, 5].map(n => Math.round(D.hp * D.hpCal * S.PELIGRO[n].hp));
    out.bb = S.BIOME_BOSS.panal; out.fam = G.B.fam.panal.ready; out.save = G.Save.VERSION; out.bosses = G.Save.BOSSES.join(','); out.despair = [D.despairAt, D.despair];
    out.trophies = ['mwing', 'msting', 'mjelly'].map(k => S.TROPHY[k].name); out.spr = ['trophy_reina_wing', 'trophy_reina_sting', 'trophy_reina_jelly'].map(n => G.hasSpr(n));
    out.fury = S.PELIGRO[1].fury + '/' + S.PELIGRO[4].fury; out.caps = [S.PELIGRO[1].cap, S.PELIGRO[5].cap];
    out.mul = [1, 2, 3, 4, 5].map(n => [S.PELIGRO[n].hp, S.PELIGRO[n].dmg, S.PELIGRO[n].tele].join('/')).join(' ');
    out.ids = Assets.bossIds().join(','); out.alias = !!Assets.bossAnchors('reina', { t: 0, facing: 1 });
    return out;
  });
  console.log(JSON.stringify(r));
  const H0 = 7200 * HPCAL;
  ok(r.base === 7200 && r.cal === HPCAL, 'base 7200 x hpCal ' + HPCAL + ' (' + r.base + ' x ' + r.cal + ')');
  ok(r.hp1 === Math.round(H0), 'HP a 9 min Peligro I = ' + Math.round(H0) + ' (' + r.hp1 + ')'); ok(r.hp[0] === Math.round(H0 * 0.75) && r.hp[2] === Math.round(H0 * 1.1), 'HP 7 min x0,75 y 10 min x1,10 (' + r.hp + ')');
  ok(r.pelHp.join() === [1, 1.15, 1.3, 1.5, 1.75].map(m => Math.round(H0 * m)).join(), 'HP por Peligro I-V = hp x 1 / 1,15 / 1,30 / 1,50 / 1,75 (' + r.pelHp + ')');
  ok(r.phases.join() === '0.65/3000/60,0.3/2500/70,0/2000/80', '3 fases: umbrales 65 / 30, cadencia 3,0 / 2,5 / 2,0 s, velocidad 60 / 70 / 80 (' + r.phases + ')');
  ok(r.despair.join() === '0.08,Zumbido Mortal', 'desesperado a < 8 %: Zumbido Mortal');
  ok(r.parts.join() === 'alas:0.09,aguijon:0.09,corona:0.1', 'partes Alas 9 % / Aguijón 9 % / Corona 10 %');
  ok(r.weak.indexOf('"tag":"fire","mul":1.25,"phases":[1,2,3]') > 0 && r.weak.indexOf('"tag":"ice","mul":1.25,"phases":[2,3]') > 0, 'debilidades Fuego x1,25 (F1-F3) e Hielo x1,25 (F2-F3) (' + r.weak + ')');
  ok(r.resist.indexOf('"tag":"poison","mul":0.5') > 0 && r.resist.indexOf('"tag":"lightning","mul":0.8') > 0, 'resistencias Veneno x0,5 directo y Rayo x0,8 (' + r.resist + ')');
  ok(r.rew[0] === 14 && r.rew[1] === 4 && r.rew[2] === 2 && r.rew[3] === 3 && r.rew[4] === '{"wick":2,"frost":2,"thread":2}', 'recompensa 14 Brasas + 4 por parte, PF 2 (3), garantizados wick 2, frost 2, thread 2');
  ok(r.trophies.join() === 'Ala de Reina,Aguijón Real,Jalea Real' && r.spr.every(x => x), '3 trofeos con arte: ' + r.trophies);
  ok(r.bb === 'melaria' && r.fam === true && r.save === 7 && r.bosses === 'pastor,karceron,letea,yarlak,melaria', 'Panal -> melaria, familia lista, guardado v7, 5 jefes (' + [r.bb, r.fam, r.save, r.bosses] + ')');
  ok(r.fury === '150000/120000' && r.caps[0] === 4 && r.caps[1] === 6, 'Furia a 150 s (120 s en IV-V), tope de adds 4 (6 en Peligro V)');
  ok(r.ids.indexOf('melaria') > 0 && r.alias, 'arte: Assets.bossIds incluye melaria y el alias reina funciona');
  // resistencias reales (daño directo): Veneno x0,5, Rayo x0,8, Fuego x1,25, Hielo x1,25 solo en F2-F3; Veneno nunca deja estado
  const m = await pg.evaluate(() => {
    var S = G.Boss, e = S.e, o = {}; e.mode = 'fight'; e.immune = false; e.exps.length = 0; e.hp = e.maxHp;
    function dmg(tag, id) { return S.mulIn(e, 100, tag, { tag: tag, id: id, proj: true }); }   // multiplicador del jefe (debilidades / resistencias / ventanas), sin los modificadores globales de las cartas
    o.neutral = dmg('neutral', 'n'); o.fire = dmg('fire', 'f'); o.poison = dmg('poison', 'p'); o.lightning = dmg('lightning', 'l'); o.ice1 = dmg('ice', 'i1');
    e.phase = 2; o.ice2 = dmg('ice', 'i2'); e.phase = 1;
    G.Combat.deal(e, 50, { tag: 'poison', id: 'pp', proj: true, poison: 2 }); G.Combat.poison(e, 3); o.poisonN = e.poisonN || 0; o.poisonT = e.poisonT || 0;
    return o;
  });
  console.log(JSON.stringify(m));
  const q = x => Math.round(x / m.neutral * 100) / 100;
  ok(q(m.fire) === 1.25 && q(m.poison) === 0.5 && q(m.lightning) === 0.8, 'daño directo: Fuego x1,25, Veneno x0,5, Rayo x0,8 (' + [q(m.fire), q(m.poison), q(m.lightning)] + ')');
  ok(q(m.ice1) === 1 && q(m.ice2) === 1.25, 'Hielo x1,0 en F1 y x1,25 en F2-F3 (' + [q(m.ice1), q(m.ice2)] + ')');
  ok(m.poisonN === 0 && m.poisonT === 0, 'Veneno inmune a estados: no apila (poisonN ' + m.poisonN + ')');
  // celdas de miel: tope 12 / 24 / 36 (x1,5 en Peligro IV) y las invariantes del Panal
  const c = await pg.evaluate(() => {
    var P = G.Panal, S = G.Boss, e = S.e, o = {};
    function mx() { return P.maxHoney(); }
    o.f1 = mx(); e.phase = 2; S.DEFS.melaria.h.onGate(e); o.f2 = mx(); e.phase = 3; S.DEFS.melaria.h.onGate(e); o.f3 = mx(); e.phase = 1; S.DEFS.melaria.h.onGate(e);
    G.peligro = 4; S.DEFS.melaria.h.onGate(e); o.p4 = mx(); G.peligro = 1; S.DEFS.melaria.h.onGate(e);
    var n = 0; P.cells.forEach(function (cc) { if (P.openCell(cc, { tele: 100, life: 60000 })) n++; }); o.opened = n; window.__sim(1200); var v = P.validate(); o.v = v;
    return o;
  });
  console.log(JSON.stringify(c));
  ok(c.f1 === 12 && c.f2 === 24 && c.f3 === 36 && c.p4 === 18, 'celdas de miel máx. 12 / 24 / 36 y x1,5 en Peligro IV (' + [c.f1, c.f2, c.f3, c.p4] + ')');
  ok(c.v.ok && c.v.connected && c.v.freeFrac >= 0.55 && c.opened === 12, 'invariantes: <= tope, >= 55 % libre y camino sin miel (abiertas ' + c.opened + ', libre ' + Math.round(c.v.freeFrac * 100) + ' %)');
  ok(!pg.errs.length, '0 errores: ' + pg.errs.slice(0, 2)); await pg.close();
}

async function tele(b) {
  console.log('--- telegrafías (regla de esquiva estándar)');
  const pg = await page(b, '');
  for (let n = 1; n <= 5; n++) {
    const r = await pg.evaluate(([names, n]) => { G.peligro = n; return names.map(a => ({ a: a, ms: G.Boss.u.teleMs(a), base: G.Boss.ATKS[a].tele, exit: G.Boss.EXIT[a], dmg: G.Boss.ATKS[a].dmg })); }, [NAMES, n]);
    const bad = r.filter(x => (x.exit != null && x.ms < RULE(x.exit)) || x.ms > x.base || (x.dmg >= 25 && x.ms < 800));
    ok(!bad.length, 'Peligro ' + n + ': ' + r.filter(x => x.exit != null).map(x => x.a.slice(2) + ' ' + x.ms + '>=' + RULE(x.exit)).join(', ') + (bad.length ? '  MAL: ' + bad.map(x => x.a) : ''));
  }
  await pg.evaluate(() => { G.peligro = 1; });
  // medidas en juego: tiempo desde el inicio del ataque hasta pasar a 'act' (Jalea real: canal de 1600 ms)
  const want = { m_estocada: 900, m_picado: 1000, m_lluvia: 600, m_llamada: 800, m_panal: 1200, m_torbellino: 1100, m_jalea: 1600, m_eclosion: 1200, m_alazo: 600 };
  const phases = { m_estocada: 1, m_picado: 1, m_lluvia: 1, m_llamada: 1, m_panal: 2, m_torbellino: 2, m_jalea: 1, m_eclosion: 3, m_alazo: 1 };
  for (const a of NAMES) {
    const ms = await pg.evaluate(([a, ph]) => {
      var e = G.Boss.e; window.__clean(); e.phase = ph; e.hp = e.maxHp * 0.8; window.__prep(); if (a === 'm_alazo') e.broken.aguijon = true; else e.broken.aguijon = false;
      e.x = 720; e.y = 300; G.player.x = 720; G.player.y = 560; G.player.vx = G.player.vy = 0; G.Boss.force(a); var A = e.atk; if (!A) return -1;
      var t = window.__sim(4000, function () { return A.step === 'tele'; }); e.broken.aguijon = false; return Math.round(t);
    }, [a, phases[a]]);
    ok(Math.abs(ms - want[a]) <= 40, `${a}: telegrafía medida ${ms} ms (doc ${want[a]})`);
    await pg.evaluate(() => { var e = G.Boss.e; e.atk = null; e.bst = 'idle'; e.exps.length = 0; G.projectiles.length = 0; window.__clean(); });
  }
  ok(!pg.errs.length, '0 errores: ' + pg.errs.slice(0, 2)); await pg.close();
}

async function parts(b) {
  console.log('--- partes rompibles');
  const pg = await page(b, '&phase=3'); await pg.evaluate(() => { window.__noW = true; });
  await pg.evaluate(() => { G.state = 'play'; window.__sim(3600); });
  const r = await pg.evaluate(() => {
    var S = G.Boss, e = S.e, o = {}; e.hp = e.maxHp * 0.6; window.__prep(); window.__clean();
    function av(n) { return !(S.ATK[n].avail && !S.ATK[n].avail(e)); }
    o.start = ['m_estocada', 'm_lluvia', 'm_torbellino', 'm_jalea', 'm_alazo'].map(n => n + ':' + av(n)).join(' ');
    // Alas
    S.breakKey('alas'); o.alasB = e.broken.alas; o.fly = e.fly; o.torb = av('m_torbellino'); o.gemsA = G.gems.filter(g => g.trophy).map(g => g.trophy); o.derr = S.expo(e).mul; o.derrKind = S.expo(e).kind;
    window.__prep(); S.cds.m_picado = 0; S.force('m_picado'); o.shortR = e.atk && e.atk.r; o.short = e.atk && e.atk.short; o.lift0 = e.atk && e.atk.lift0;
    // Aguijón
    window.__prep(); S.breakKey('aguijon'); o.est = av('m_estocada'); o.llu = av('m_lluvia'); o.alazo = av('m_alazo'); o.gemsS = G.gems.filter(g => g.trophy).map(g => g.trophy);
    // Corona
    window.__prep(); var h0 = G.gems.filter(g => g.jelly).length; S.breakKey('corona'); o.jalea = av('m_jalea'); o.gemsC = G.gems.filter(g => g.trophy).map(g => g.trophy); o.jelly = G.gems.filter(g => g.jelly).length - h0; o.jv = (G.gems.filter(g => g.jelly)[0] || {}).v;
    o.cap = G.Boss.melariaInfo().cap;
    return o;
  });
  console.log(JSON.stringify(r));
  ok(r.start === 'm_estocada:true m_lluvia:true m_torbellino:true m_jalea:true m_alazo:false', 'con todo entero: Estocada, Lluvia, Torbellino y Jalea disponibles; Golpe de ala no (' + r.start + ')');
  ok(r.alasB && !r.fly && !r.torb && r.gemsA.indexOf('mwing') >= 0 && r.derr === 1.3 && r.derrKind === 'derribo', 'Alas rotas: aterriza, pierde el Torbellino, suelta el Ala de Reina y derribo x1,3');
  ok(r.short && r.shortR === 140 && r.lift0 === 0, 'Alas rotas: el Picado pasa a Salto corto (sin ascenso, mismo radio que el Picado: 140)');
  ok(!r.est && !r.llu && r.alazo && r.gemsS.indexOf('msting') >= 0, 'Aguijón roto: pierde Estocada real y Lluvia, usa el golpe de ala y suelta el Aguijón Real');
  ok(!r.jalea && r.gemsC.indexOf('mjelly') >= 0 && r.jelly >= 1 && r.jv === 20 && r.cap === 2, 'Corona rota: pierde la Jalea real, suelta la Jalea Real y una gota que cura 20 HP; tope de adds 2 (' + r.cap + ')');
  // Llamada: composición por fase y solo Obreras con la Corona rota
  const l = await pg.evaluate(() => {
    var S = G.Boss, e = S.e, out = {};
    [1, 2, 3].forEach(ph => {
      [false, true].forEach(cr => {
        window.__clean(); window.__prep(); e.phase = ph; e.broken.corona = cr; S.cds.m_llamada = 0; S.force('m_llamada'); var A = e.atk;
        out[ph + (cr ? 'c' : '')] = G.enemies.filter(q => !q.dead && q.bossAdd).map(q => q.type).sort().join('+'); window.__sim(2500);
      });
    });
    return out;
  });
  console.log(JSON.stringify(l));
  ok(l['1'] === 'worm+worm' && l['2'] === 'boar+pollinator+worm+worm' && l['3'] === 'boar+worm+worm+worm', 'Llamada: F1 2 Obreras; F2 2 + Zángano + Polinizador (máx. 1); F3 3 + Zángano (el tope de 4 recorta el Polinizador) (' + [l['1'], l['2'], l['3']] + ')');
  ok(/^worm(\+worm)?$/.test(l['1c']) && /^worm(\+worm)?$/.test(l['2c']) && /^worm(\+worm)?$/.test(l['3c']), 'Corona rota: solo Obreras y tope 2 (' + [l['1c'], l['2c'], l['3c']] + ')');
  ok(!pg.errs.length, '0 errores: ' + pg.errs.slice(0, 2)); await pg.close();
}

async function mech(b) {
  console.log('--- mecánicas (Estocada, Picado, Panal abierto, Torbellino, Jalea real, Eclosión, Fuego, Polinizador)');
  const pg = await page(b, '&phase=3&env=0'); await pg.evaluate(() => { window.__noW = true; });
  await pg.evaluate(() => { G.state = 'play'; window.__sim(3600); });
  // Estocada: carril 70 x 420 desde el aguijón; falla -> expuesta 1,0 s x1,25; si acierta, 26 de daño
  const s = await pg.evaluate(() => {
    var S = G.Boss, e = S.e, o = {}; window.__clean(); window.__prep(); e.x = 720; e.y = 300; e.hp = e.maxHp * 0.8; G.player.x = 720; G.player.y = 560; G.player.hp = 100;
    S.cds.m_estocada = 0; S.force('m_estocada'); var A = e.atk; window.__sim(A.tele + 60, null, false); o.lane = [A.w, A.len]; o.dir = Math.round(A.dir * 100) / 100; o.tip = [Math.round(A.ox), Math.round(A.oy)];
    G.god = false; G.player.x = A.ox + Math.cos(A.dir) * 200 + 400; G.player.y = A.oy + Math.sin(A.dir) * 200 + 400;   // lejos del carril
    G.player.x = Math.min(1300, Math.max(150, G.player.x)); G.player.y = Math.min(700, Math.max(150, G.player.y));
    var ex = 0; window.__sim(2500, function () { var x = S.expo(e); if (x.mul === 1.25 && x.kind === 'window') { ex = x.max; return false; } }, false); o.expMax = ex; o.expMul = S.expo(e).mul; o.hp = G.player.hp;
    // acierta
    window.__prep(); e.exps.length = 0; e.x = 720; e.y = 300; S.cds.m_estocada = 0; S.force('m_estocada'); A = e.atk; window.__sim(A.tele - 60, null, false);
    var tip = [A.ox, A.oy], d = A.dir; G.player.x = tip[0] + Math.cos(d) * 160; G.player.y = tip[1] + Math.sin(d) * 160; G.player.vx = G.player.vy = 0; G.player.hp = 100; G.player.hurtT = 0; G.player.inv = 0; G.player.iT = 0; var hp0 = G.player.hp;
    window.__sim(1800, function () { G.player.x = tip[0] + Math.cos(d) * 160; G.player.y = tip[1] + Math.sin(d) * 160; }, false); o.hit = Math.round(hp0 - G.player.hp);
    G.god = true; return o;
  });
  console.log(JSON.stringify(s));
  ok(s.lane[0] === 140 && s.lane[1] === 420, 'Estocada: carril 140 (doc 70 x 2,0 de calibración) x 420 desde la punta del aguijón (' + s.lane + ', ángulo ' + s.dir + ')');
  ok(s.expMax === 1000 && s.expMul === 1.25, 'Estocada fallada: queda expuesta 1,0 s (x1,25)');
  ok(s.hit >= 20 && s.hit <= 40, 'Estocada acertada: daño ~26 + Peligro (' + s.hit + ')');
  // Picado sobre miel = atrapada 2,4 s (x1,35); sin miel = se eleva en 0,8 s
  const d = await pg.evaluate(() => {
    var S = G.Boss, e = S.e, o = {}, P = G.Panal; window.__clean(); window.__prep(); P.begin('panal'); G.player.x = 560; G.player.y = 560; G.player.vx = G.player.vy = 0; e.x = 720; e.y = 300;
    var c = P.cellAt(560, 560); c.st = 3; c.t = 20000; var n0 = P.activeCells().length; P.activeCells().push(c); P.nb = n0;
    S.cds.m_picado = 0; S.force('m_picado'); var A = e.atk, mx = 0; o.tele = A.tele; window.__sim(A.tele + 40, function () { mx = Math.max(mx, e.lift || 0); }, false); o.lift = Math.round(mx);
    window.__sim(300, null, false); o.stuck = S.melariaInfo().stuckT > 0; o.mul = S.expo(e).mul; o.kind = S.expo(e).kind; o.max = S.expo(e).max; o.fly = e.fly; o.dist = Math.round(Math.hypot(e.x - 560, (e.y + 24) - 560));
    window.__sim(3600, function () { return !!e.atk; }); o.after = !e.atk; o.dip = Math.round(S.melariaInfo().dip);
    // sin miel
    window.__prep(); S.A.stuckT = 0; S.A.dip = 0; P.begin('panal'); G.player.x = 900; G.player.y = 520; e.x = 720; e.y = 300; S.cds.m_picado = 0; S.force('m_picado'); A = e.atk; window.__sim(A.tele + 400, null, false); o.stuck2 = S.melariaInfo().stuckT > 0; o.rec = A.rec; window.__sim(2500, function () { return !!e.atk; }); o.dip2 = Math.round(S.melariaInfo().dip);
    return o;
  });
  console.log(JSON.stringify(d));
  ok(d.lift >= 120 && d.stuck && d.mul === 1.35 && d.kind === 'stun' && d.max === 2400 && !d.fly && d.dist <= 30, 'Picado sobre miel: asciende (lift ' + d.lift + '), cae donde estaba el jugador y queda atrapada 2,4 s x1,35 aturdida');
  ok(!d.stuck2 && d.rec === 800 && d.dip2 === 0, 'Picado sin miel: se eleva en 0,8 s (rec ' + d.rec + ')');
  // Panal abierto: 7-9 celdas + 2-3 nidos que eclosionan a los 1,5 s, respeta las invariantes
  const p = await pg.evaluate(() => {
    var S = G.Boss, e = S.e, o = {}, P = G.Panal; window.__clean(); window.__prep(); P.begin('panal'); S.DEFS.melaria.h.onGate(e); G.player.x = 720; G.player.y = 405; e.x = 720; e.y = 300;
    S.cds.m_panal = 0; S.force('m_panal'); var A = e.atk, tele0 = null; o.cells = P.honeyCount(); o.nests = A.nests.length; o.tele = A.tele; window.__sim(A.tele + 100, null, false); window.__sim(700, null, false);
    var honey = P.activeCells().filter(c => c.st === 3).length; o.honey = honey; o.v = P.validate(); o.hatch = S.melariaInfo().hatch;
    var adds0 = G.enemies.filter(q => !q.dead && q.bossAdd && q.type === 'bomb').length; window.__sim(1700, null, false); o.larvas = G.enemies.filter(q => !q.dead && q.bossAdd && q.type === 'bomb').length - adds0; o.hatchAfter = S.melariaInfo().hatch;
    return o;
  });
  console.log(JSON.stringify(p));
  ok(p.cells >= 5 && p.cells <= 9 && p.nests >= 2 && p.nests <= Math.min(3, p.cells), 'Panal abierto: ' + p.cells + ' celdas (7-9 si caben) y ' + p.nests + ' nidos');
  ok(p.v.ok && p.v.connected && p.honey >= 5, 'Panal abierto: celdas con miel (' + p.honey + ') dentro de las invariantes (libre ' + Math.round(p.v.freeFrac * 100) + ' %)');
  ok(p.larvas >= 1 && p.hatchAfter === 0, 'los nidos eclosionan una Larva explosiva a los 1,5 s (' + p.larvas + ' Larvas)');
  // Torbellino: zona segura interior
  const t = await pg.evaluate(() => {
    var S = G.Boss, e = S.e, o = {}; window.__clean(); window.__prep(); e.x = 720; e.y = 300; G.god = false; G.player.hp = 100; G.player.x = 720; G.player.y = 324 + 40; G.player.vx = G.player.vy = 0;
    S.cds.m_torbellino = 0; S.force('m_torbellino'); var A = e.atk; window.__sim(A.tele + 60, null, false); o.safe = Math.round(100 - G.player.hp);
    window.__prep(); e.x = 720; e.y = 300; G.player.hp = 100; G.player.x = 720; G.player.y = 324 + 200; G.player.iT = 0; G.player.inv = 0; G.player.hurtT = 0; S.cds.m_torbellino = 0; S.force('m_torbellino'); A = e.atk; var y0 = G.player.y;
    window.__sim(A.tele + 60, null, false); o.hit = Math.round(100 - G.player.hp); window.__sim(900, null, false); o.push = Math.round(G.player.y - y0); G.god = true; return o;
  });
  console.log(JSON.stringify(t));
  ok(t.safe === 0 && t.hit >= 15 && t.push > 40, 'Torbellino: pegado al cuerpo (r < 62) es seguro; en la rosquilla hiere ~18 y el viento empuja ' + t.push + ' px');
  // Jalea real: curación 2,5 % y interrupción con >= 1,2 % de daño
  const j = await pg.evaluate(() => {
    var S = G.Boss, e = S.e, o = {}; window.__clean(); window.__prep(); e.hp = e.maxHp * 0.5; var h0 = e.hp; S.cds.m_jalea = 0; S.force('m_jalea'); var A = e.atk; o.tele = A.tele;
    window.__sim(A.tele + 400, null, false); o.heal = Math.round((e.hp - h0) / e.maxHp * 1000) / 10;
    window.__prep(); e.exps.length = 0; e.hp = e.maxHp * 0.5; h0 = e.hp; S.cds.m_jalea = 0; S.force('m_jalea'); A = e.atk; window.__sim(600, null, false);
    G.Combat.deal(e, e.maxHp * 0.014, { id: 'j', tag: 'neutral', proj: true, noChain: true }); window.__sim(120, null, false); o.cut = A.cut; o.kind = S.expo(e).kind; o.mul = S.expo(e).mul; o.max = S.expo(e).max; o.net = Math.round((e.hp - h0) / e.maxHp * 1000) / 10;
    window.__prep(); e.exps.length = 0; e.hp = e.maxHp * 0.5; S.cds.m_jalea = 0; S.force('m_jalea'); A = e.atk; window.__sim(600, null, false); G.Combat.deal(e, e.maxHp * 0.006, { id: 'j2', tag: 'neutral', proj: true, noChain: true }); window.__sim(1200, null, false); o.small = A.cut;
    return o;
  });
  console.log(JSON.stringify(j));
  ok(j.tele === 1600 && j.heal === 2.5, 'Jalea real: canal de 1600 ms y cura el 2,5 % del HP máx. (' + j.heal + ' %)');
  ok(j.cut && j.kind === 'stun' && j.mul === 1.25 && j.max === 1000, 'Jalea real: >= 1,2 % de daño en el canal la interrumpe: aturdida 1,0 s x1,25');
  ok(!j.small, 'Jalea real: 0,6 % de daño no la interrumpe');
  // Eclosión: 4 Larvas (6 en Peligro V) y abdomen hinchado 3 s x1,3
  const ec = await pg.evaluate(() => {
    var S = G.Boss, e = S.e, o = {}; window.__clean(); window.__prep(); e.exps.length = 0; S.cds.m_eclosion = 0; S.force('m_eclosion'); var A = e.atk; o.n = A.pts.length; o.tele = A.tele; var larvas = G.enemies.filter(q => !q.dead && q.bossAdd && q.type === 'bomb').length; o.larvas = larvas;
    window.__sim(A.tele + 100, null, false); o.mul = S.expo(e).mul; o.max = S.expo(e).max; o.swollen = S.melariaInfo().swollenT > 2500; o.load = S.addsLoad();
    window.__clean(); window.__prep(); e.exps.length = 0; G.peligro = 5; S.cds.m_eclosion = 0; S.force('m_eclosion'); o.n5 = e.atk.pts.length; G.peligro = 1; return o;
  });
  console.log(JSON.stringify(ec));
  ok(ec.n === 4 && ec.larvas === 4 && ec.n5 === 6, 'Eclosión: 4 Larvas en anillo (6 en Peligro V)');
  ok(ec.mul === 1.3 && ec.max === 3000 && ec.swollen && ec.load === 2, 'Eclosión: abdomen hinchado 3 s (x1,3); las Larvas cuentan 0,5 (' + ec.load + ')');
  // Fuego carameliza una celda de miel; el humo seda; el Polinizador cura a la Reina 1 % por pulso
  const f = await pg.evaluate(() => {
    var S = G.Boss, e = S.e, o = {}, P = G.Panal; window.__clean(); window.__prep(); P.begin('panal'); var c = P.cellAt(400, 500); c.st = 3; c.t = 20000; P.activeCells().push(c);
    var ok0 = P.honeyAt(c.x, c.y); G.Combat.deal(e, 20, { id: 'ff', tag: 'fire', proj: true }); P.caramelize(c.x, c.y, 6); o.before = ok0; o.after = P.honeyAt(c.x, c.y); o.st = c.st;
    var pol = G.Enemies.spawn('pollinator', 700, 330, { summoned: true, spawnT: 0 }); pol.bossAdd = true; e.hp = e.maxHp * 0.5; var h0 = e.hp; G.Panal.healPulse(pol, pol.x, pol.y); o.heal = Math.round((e.hp - h0) / e.maxHp * 1000) / 10;
    return o;
  });
  console.log(JSON.stringify(f));
  ok(f.before && !f.after && f.st === 5, 'el Fuego carameliza y sella al instante la celda de miel');
  ok(f.heal === 1, 'el pulso del Polinizador cura a la Reina un 1 % de su HP máx. (' + f.heal + ' %)');
  ok(!pg.errs.length, '0 errores: ' + pg.errs.slice(0, 2)); await pg.close();
}

async function phases(b) {
  console.log('--- fases, puertas y desesperado');
  const pg = await page(b, ''); await pg.evaluate(() => { window.__noW = true; });
  await pg.evaluate(() => { G.state = 'play'; window.__sim(500); });
  for (let k = 0; k < 2; k++) {
    const g = await pg.evaluate(() => {
      var S = G.Boss, e = S.e; window.__prep(); var ph0 = e.phase;
      e.hp = e.maxHp * e.def.phases[ph0 - 1].thr + 5; G.Combat.deal(e, 50, { id: 'x', tag: 'neutral', proj: true });
      var o = { ph0: ph0, mode: e.mode, ph: e.phase, immune: e.immune, gate: e.gateT, hp: Math.round(e.hp / e.maxHp * 100), hearts: G.gems.filter(g => g.kind === 'heart').length };
      window.__sim(1500); o.mid = e.mode; window.__sim(1600); o.after = e.mode; o.cap = G.Panal.maxHoney(); o.cad = e.def.phases[e.phase - 1].cad;
      return o;
    });
    console.log(JSON.stringify(g));
    ok(g.mode === 'gate' && g.immune && g.ph === g.ph0 + 1 && g.hearts >= 2 && g.after === 'fight', `puerta a la fase ${g.ph}: inmune 3 s, 2 corazones, vuelve a combate (HP ${g.hp} %)`);
    ok(g.cap === (k ? 36 : 24), `fase ${g.ph}: tope de celdas de miel ${g.cap}`);
  }
  // desesperado: Zumbido Mortal
  const d = await pg.evaluate(() => {
    var S = G.Boss, e = S.e, o = {}; window.__prep(); window.__clean(); e.hp = e.maxHp * 0.0801; G.Combat.deal(e, 5000, { id: 'y', tag: 'neutral', proj: true });
    o.mode = e.mode; o.expo = S.expo(e).mul; o.cap = G.Panal.maxHoney(); var maxP = 0, hits = 0, rings = 0, land = -1, seen = {}; G.god = false; G.player.hp = 100;
    window.__sim(300); o.rings = S.melariaInfo().rings;
    var hp0 = G.player.hp, tt = 0;
    window.__sim(10400, function (t) { tt = t; var n = G.projectiles.filter(q => q.team === 'e').length; maxP = Math.max(maxP, n); if (e.mode === 'despair' && e.despT >= 8000 && land < 0) land = e.despT; return e.mode === 'despair'; }, false);
    o.maxP = maxP; o.after = e.mode; o.dt = Math.round(e.despT); o.land = Math.round(land); o.cap2 = G.Panal.maxHoney(); G.god = true; return o;
  });
  console.log(JSON.stringify(d));
  ok(d.mode === 'despair' && d.expo === 1.25 && d.rings === 5 && d.cap === 0, 'Zumbido Mortal: 5 anillos hexagonales, cuerpo x1,25 y sin miel (tope 0)');
  ok(d.after === 'fight' && d.dt >= 9900 && d.land >= 7900 && d.land <= 8300 && d.cap2 === 36, `dura 10 s, aterriza aturdida en los últimos 2 s (${d.land} ms) y vuelve a combate con el tope de celdas en 36`);
  ok(!pg.errs.length, '0 errores: ' + pg.errs.slice(0, 2)); await pg.close();
  // 100 % esquivable: en cada anillo, un jugador parado en el hueco no recibe daño; en la banda (fuera del hueco) recibe 18
  const pr = await page(b, '&phase=3&env=0'); await pr.evaluate(() => { window.__noW = true; G.state = 'play'; window.__sim(500); });
  const r = await pr.evaluate(() => {
    var S = G.Boss, e = S.e, o = { safeGap: [], band: [], hit: [] }; window.__prep(); window.__clean(); e.hp = e.maxHp * 0.0801; G.Combat.deal(e, 5000, { id: 'y2', tag: 'neutral', proj: true });
    window.__sim(300); G.god = false;
    var hz = S.A.des.rings.slice(), RC = S.melariaRingContact; o.hz = hz.length; G.player.hp = 100;
    function at(h, ang) { var rr = h.apo / Math.cos(((ang % (Math.PI / 3)) + Math.PI / 3) % (Math.PI / 3) - Math.PI / 6); return [720 + Math.cos(ang) * rr, 405 + Math.sin(ang) * rr]; }
    hz.forEach(function (h) {
      var g = at(h, h.gaps[0]); o.safeGap.push(RC(h, g[0], g[1], 10) ? 1 : 0);
      var q = at(h, h.gaps[0] + h.gh + 0.6); o.band.push(RC(h, q[0], q[1], 10) ? 1 : 0);
    });
    var q0 = at(hz[0], hz[0].gaps[0] + hz[0].gh + 0.6); window.__sim(2600, function () { G.player.x = q0[0]; G.player.y = q0[1]; }, false); o.dmgRing = Math.round(100 - G.player.hp);
    var g1 = at(hz[1], hz[1].gaps[0]); G.player.hp = 100; window.__sim(4200, function () { G.player.x = g1[0]; G.player.y = g1[1]; }, false); o.dmgGap = Math.round(100 - G.player.hp);
    G.god = true; return o;
  });
  console.log(JSON.stringify(r));
  ok(r.hz === 5 && r.safeGap.every(x => x === 0), 'Zumbido Mortal: el hueco de cada anillo es seguro (' + r.safeGap + ')');
  ok(r.band.every(x => x === 1), 'la banda del anillo (fuera del hueco) hiere (' + r.band + ')');
  ok(r.dmgRing >= 15 && r.dmgRing <= 40 && r.dmgGap === 0, 'en la banda del anillo exterior se recibe ~18 (' + r.dmgRing + ') y parado en un hueco del siguiente 0 (' + r.dmgGap + ')');
  ok(!pr.errs.length, '0 errores: ' + pr.errs.slice(0, 2)); await pr.close();
  // Peligro III: picado doble; Peligro V: dos Zumbidos Mortales seguidos y tope de adds 6
  const p3 = await page(b, '&phase=1&peligro=3'); await p3.evaluate(() => { window.__noW = true; G.state = 'play'; window.__sim(3600); });
  const dd = await p3.evaluate(() => {
    var S = G.Boss, e = S.e, o = {}; window.__clean(); window.__prep(); e.x = 720; e.y = 300; G.player.x = 720; G.player.y = 560; S.cds.m_picado = 0; S.force('m_picado'); var A = e.atk; o.n = A.n; var subs = [], seen = ''; var imp = 0;
    window.__sim(5000, function () { if (A.sub !== seen) { seen = A.sub; subs.push(A.sub); } imp = A.k; return !!e.atk; }); o.subs = subs.join('>'); o.k = A.k; return o;
  });
  ok(dd.n === 2 && dd.k === 2 && /aim/.test(dd.subs), 'Peligro III: picado doble (2.º picado tras re-aim de 600 ms) (' + JSON.stringify(dd) + ')');
  await p3.close();
  const p2 = await page(b, '&phase=3&peligro=5'); await p2.evaluate(() => { window.__noW = true; G.state = 'play'; window.__sim(3600); });
  const lim = await p2.evaluate(() => {
    var S = G.Boss, e = S.e, mxA = 0, mxP = 0, mxS = 0; e.hp = e.maxHp * 0.7; window.__prep(); e.cadT = 500;
    window.__sim(90000, function () { mxA = Math.max(mxA, S.addsLoad()); mxP = Math.max(mxP, G.projectiles.filter(q => q.team === 'e').length); if (e.mode === 'fight' && e.atk && e.cadT > 1e8) e.cadT = 500; if (e.mode === 'fight' && e.cadT > 1e8) e.cadT = 500; e.hp = Math.max(e.hp, e.maxHp * 0.5); });
    return { mxA: mxA, mxP: mxP, cap: S.PELIGRO[5].cap };
  });
  ok(lim.mxP <= 60 && lim.mxA <= lim.cap, 'Peligro V (90 s de pelea natural): adds <= ' + lim.cap + ' (' + lim.mxA + ') y proyectiles <= 60 (' + lim.mxP + ')');
  const v = await p2.evaluate(() => {
    var S = G.Boss, e = S.e, o = {}; window.__prep(); window.__clean(); e.hp = e.maxHp * 0.0801; G.Combat.deal(e, 5000, { id: 'v', tag: 'neutral', proj: true });
    o.m1 = e.mode; o.left = e.despLeft; window.__sim(10400); o.m2 = e.mode; o.hp = Math.round(e.hp / e.maxHp * 1000) / 10;
    e.hp = e.maxHp * 0.0301; G.Combat.deal(e, 5, { id: 'v2', tag: 'neutral', proj: true }); window.__sim(100); o.m3 = e.mode; window.__sim(10400); o.fin = e.mode; return o;
  });
  console.log(JSON.stringify(v));
  ok(v.m1 === 'despair' && v.m2 === 'fight' && v.m3 === 'despair' && v.fin === 'fight', 'Peligro V: dos Zumbidos Mortales seguidos (' + JSON.stringify(v) + ')');
  ok(!p2.errs.length, 'Peligro V: 0 errores ' + p2.errs.slice(0, 2)); await p2.close();
}

async function endFlow(pg, win) {
  await pg.keyboard.press('Enter'); await pg.waitForTimeout(800);
  await pg.evaluate(() => { setInterval(() => { G.pendingLevels = 0; if (G.state === 'cards') { try { G.Cards.pick(0); } catch (e) { G.state = 'play'; } } }, 50); });
  for (let i = 0; i < 80; i++) { await pg.waitForTimeout(400); if (await pg.evaluate(() => !!G.Boss.e && G.Boss.e.mode === 'fight')) break; }
  const info = await pg.evaluate(() => ({ id: G.Boss.e && G.Boss.e.id, biome: G.curBiome, state: G.state }));
  if (win) await pg.evaluate(() => { G.god = true; var e = G.Boss.e; e.phase = e.def.phases.length; e.despDone = true; e.despLeft = 0; e.mode = 'fight'; e.immune = false; e.hp = e.maxHp * 0.0005; G.Combat.deal(e, 1e6, { id: 'k', tag: 'neutral', proj: true }); G.Combat.deal(e, 1e6, { id: 'k2', tag: 'neutral', proj: true }); });
  else await pg.evaluate(() => { G.god = false; G.player.hp = 0.01; G.Player.hurt(G.player, 500, 0, 0, { src: 'test' }); });
  for (let i = 0; i < 60; i++) { await pg.waitForTimeout(500); if (await pg.evaluate(() => G.state) === 'gameover') break; }
  const res = await pg.evaluate(() => ({ s: G.state, won: G.won, sum: !!G.Loot.summary, boss: G.Loot.summary && G.Loot.summary.boss && G.Loot.summary.boss.id, bk: JSON.stringify(G.Save.data.bossKills), pel: JSON.stringify(G.Save.data.peligro) }));
  await pg.waitForTimeout(500); await pg.keyboard.press('KeyB'); await pg.waitForTimeout(1500);
  const back = await pg.evaluate(() => G.state);
  return Object.assign(info, res, { back: back });
}
async function flow(b) {
  console.log('--- flujo aldea -> portal -> expedición -> botín -> aldea (5 biomas, victoria y derrota)');
  const exp = { bosque: 'pastor', cripta: 'karceron', asfodelo: 'letea', tundra: 'yarlak', panal: 'melaria' };
  for (const bio of Object.keys(exp)) for (const win of [true, false]) {
    const ctx = await b.newContext({ viewport: { width: 960, height: 540 } }), pg = await ctx.newPage(); pg.errs = [];
    pg.on('console', m => { if (m.type() === 'error') pg.errs.push(m.text()); }); pg.on('pageerror', e => pg.errs.push('PAGEERR ' + e.message + ' ' + (e.stack || '').split('\n').slice(1, 3).join('|')));
    await pg.goto(`${base}/index.html?reset=1&dbg=1&len=7&speed=20&t=370&god=1`); await pg.waitForTimeout(600);
    await pg.evaluate(bio => { G.Save.data.bossKills = { pastor: 1, karceron: 1, letea: 1, yarlak: 1 }; G.Save.data.biome = bio; G.Save.save(); }, bio);
    await pg.keyboard.press('Tab'); await pg.waitForTimeout(900); await pg.keyboard.press('KeyE'); await pg.waitForTimeout(700);
    const sel = await pg.evaluate(() => G.Save.data.biome); ok(sel === bio, 'Portal con destino ' + bio);
    const r = await endFlow(pg, win);
    ok(r.id === exp[bio] && r.biome === bio, `${bio} ${win ? 'victoria' : 'derrota'}: jefe ${r.id} en ${r.biome}`);
    ok(r.s === 'gameover' && r.won === win && r.sum && (!win || r.boss === exp[bio]), `${bio} ${win ? 'victoria' : 'derrota'}: pantalla de botín (${JSON.stringify({ s: r.s, won: r.won, boss: r.boss })})`);
    ok(r.back === 'aldea', `${bio}: botín -> aldea (${r.back})`);
    if (win && bio === 'panal') { const k = JSON.parse(r.bk); ok(k.melaria === 1 && JSON.parse(r.pel).melaria === 2, 'victoria sobre Melaria guardada en bossKills y abre el Peligro II'); }
    ok(!pg.errs.length, `${bio} ${win ? 'victoria' : 'derrota'}: 0 errores ${pg.errs.slice(0, 2)}`);
    await ctx.close();
  }
}

async function hunt(b) {
  console.log('--- cacería, práctica, ?boss=melaria y ?biome=panal');
  for (const q of ['&hunt=melaria', '&hunt=melaria&practice=1', '&boss=melaria&nointro=1', '&biome=panal&nointro=1']) {
    const pg = await b.newPage({ viewport: { width: 960, height: 540 } }); pg.errs = [];
    pg.on('console', m => { if (m.type() === 'error') pg.errs.push(m.text()); }); pg.on('pageerror', e => pg.errs.push('PAGEERR ' + e.message));
    await pg.goto(`${base}/index.html?reset=1&dbg=1&god=1&speed=10&prep=0${q}`); await pg.waitForTimeout(1500);
    const bossRun = q.indexOf('biome=panal') < 0;
    if (!bossRun) await pg.evaluate(() => { G.startGame(); });
    for (let i = 0; i < 40 && bossRun; i++) { if (await pg.evaluate(() => G.Boss.e && G.Boss.e.mode === 'fight')) break; await pg.waitForTimeout(300); }
    const r = await pg.evaluate(() => ({ mode: G.mode, id: G.Boss.e && G.Boss.e.id, hp: G.Boss.e && Math.round(G.Boss.e.maxHp), biome: G.curBiome, n: G.enemies.filter(e => !e.dead && e.type !== 'boss' && e.type !== 'bosspart').length, noBoss: G.Panal.noBoss(), on: G.Panal.on }));
    if (!bossRun) { const bid = await pg.evaluate(() => G.bossId); ok(r.biome === 'panal' && r.on && !r.noBoss && bid === 'melaria', '?biome=panal: bioma Panal con jefa Melaria (' + JSON.stringify(r) + ' ' + bid + ')'); }
    else {
      const want = q.indexOf('practice') > 0 ? Math.round(7200 * HPCAL * 0.5) : q.indexOf('hunt') > 0 ? Math.round(7200 * HPCAL * 0.75) : Math.round(7200 * HPCAL);
      ok(r.id === 'melaria' && r.biome === 'panal' && r.hp === want, `${q}: modo ${r.mode}, HP ${r.hp} (esperado ${want}), normales ${r.n}`);
    }
    ok(!pg.errs.length, `${q}: 0 errores ${pg.errs.slice(0, 2)}`); await pg.close();
  }
}

async function unlock(b) {
  console.log('--- desbloqueo del Panal y migración v6 -> v7');
  const ctx = await b.newContext({ viewport: { width: 960, height: 540 } }), pg = await ctx.newPage(); pg.errs = [];
  pg.on('console', m => { if (m.type() === 'error') pg.errs.push(m.text()); }); pg.on('pageerror', e => pg.errs.push('PAGEERR ' + e.message));
  await pg.goto(`${base}/index.html?dbg=1&reset=1`); await pg.waitForTimeout(500);
  const chip = { x: 650 + 4 * 58 + 28, y: 357 };
  async function portal(kills) {
    await pg.evaluate(k => { G.Save.data.bossKills = k; G.Save.data.biome = 'bosque'; G.Save.save(); }, kills);
    await pg.keyboard.press('Tab'); await pg.waitForTimeout(900); await pg.keyboard.press('KeyE'); await pg.waitForTimeout(600);
    await pg.mouse.click(chip.x, chip.y); await pg.waitForTimeout(350);
    const bio = await pg.evaluate(() => G.Save.data.biome); await pg.screenshot({ path: process.env.SHOT || '/tmp/p6_portal.png' });
    await pg.keyboard.press('Escape'); await pg.waitForTimeout(400); return bio;
  }
  ok(await portal({ pastor: 1, karceron: 1, letea: 1 }) === 'bosque', 'sin vencer a Yarlak el Panal sigue bloqueado');
  ok(await portal({ pastor: 1, karceron: 1, letea: 1, yarlak: 1 }) === 'panal', 'al vencer a Yarlak el chip PANAL se abre y se elige');
  const eff = await pg.evaluate(() => { G.Save.data.bossKills = { pastor: 1, karceron: 1, letea: 1 }; G.Save.data.biome = 'panal'; G.Save.save(); G.startGame(); return G.curBiome; });
  ok(eff === 'tundra', 'destino Panal sin Yarlak vencido cae a Tundra (' + eff + ')');
  const eff2 = await pg.evaluate(() => { G.Save.data.bossKills = { pastor: 1, karceron: 1, letea: 1, yarlak: 1 }; G.Save.data.biome = 'panal'; G.Save.save(); G.startGame(); return G.curBiome + '/' + G.bossId; });
  ok(eff2 === 'panal/melaria', 'con Yarlak vencido el destino Panal da la jefa Melaria (' + eff2 + ')');
  await pg.close(); await ctx.close();
  // migración v6 -> v7: copia de seguridad, Yarlak vencido -> Panal abierto, peligro.melaria
  const c2 = await b.newContext({ viewport: { width: 960, height: 540 } }), p2 = await c2.newPage(); p2.errs = [];
  p2.on('console', m => { if (m.type() === 'error') p2.errs.push(m.text()); }); p2.on('pageerror', e => p2.errs.push('PAGEERR ' + e.message));
  await p2.goto(`${base}/index.html?dbg=1&nosw=1`); await p2.waitForTimeout(400);
  const old = { v: 6, parts: { wick: 5 }, brasas: 321, cards: { spark: 1, dart: 1, shard: 1, dagger: 1, fang: 1, hourglass: 1 }, anchors: ['spark'], len: 9, pf: { earned: 9 }, nodes: {}, bossKills: { pastor: 2, karceron: 1, letea: 1, yarlak: 1 }, peligro: { pastor: 3, karceron: 2, letea: 2, yarlak: 2 }, biome: 'tundra', flags: {}, insignias: { carnero: 1 }, elites: { mini_slot1: 1 } };
  await p2.evaluate(o => { localStorage.setItem('swarmhand.save', JSON.stringify(o)); }, old);
  await p2.goto(`${base}/index.html?dbg=1&nosw=1`); await p2.waitForTimeout(600);
  const m = await p2.evaluate(() => ({ v: G.Save.data.v, mel: G.Save.data.peligro.melaria, bk: JSON.stringify(G.Save.data.bossKills), br: G.Save.data.brasas, pf: G.Save.data.pf.earned, pel: JSON.stringify(G.Save.data.peligro), bak: !!localStorage.getItem('swarmhand.save.v6'), mig: G.Save.data.flags.migrated7, qb: G.Quests.unlockedBiomes().join(','), feas: G.Quests.feasible(G.Quests.def('pollinators')), ins: JSON.stringify(G.Save.data.insignias), hunt: G.Panels && 0 }));
  console.log(JSON.stringify(m));
  ok(m.v === 7 && m.mel === 1 && m.bak && m.mig === 1, 'migración v6 -> v7: versión 7, peligro.melaria = 1, copia en swarmhand.save.v6');
  ok(m.br === 321 && m.pf === 9 && m.bk === '{"pastor":2,"karceron":1,"letea":1,"yarlak":1}' && /"yarlak":2/.test(m.pel) && m.ins === '{"carnero":1}', 'sin pérdidas (Brasas, PF, victorias, Peligro, Insignias)');
  ok(m.qb.indexOf('panal') > 0 && m.feas, 'quien ya venció a Yarlak ve el Panal abierto y el encargo de los Polinizadores se activa (' + m.qb + ')');
  // quien no venció a Yarlak: el Panal sigue cerrado y el encargo no se ofrece
  await p2.evaluate(() => { var o = JSON.parse(localStorage.getItem('swarmhand.save')); o.v = 6; o.bossKills = { pastor: 1, karceron: 1, letea: 1 }; localStorage.setItem('swarmhand.save', JSON.stringify(o)); }); await p2.goto(`${base}/index.html?dbg=1&nosw=1`); await p2.waitForTimeout(500);
  const m2 = await p2.evaluate(() => ({ qb: G.Quests.unlockedBiomes().join(','), feas: G.Quests.feasible(G.Quests.def('pollinators')) }));
  ok(m2.qb.indexOf('panal') < 0 && !m2.feas, 'sin Yarlak vencido el Panal y el encargo de los Polinizadores siguen dormidos');
  await p2.evaluate(() => { localStorage.setItem('swarmhand.save', '{"v":6,"parts":null'); }); await p2.goto(`${base}/index.html?dbg=1&nosw=1`); await p2.waitForTimeout(500);
  ok(await p2.evaluate(() => G.Save.data.v === 7 && G.Save.data.peligro.melaria === 1), 'guardado corrupto cae a valores por defecto v7');
  ok(!p2.errs.length, '0 errores: ' + p2.errs.slice(0, 2)); await c2.close();
}

(async () => {
  const b = await launch();
  if (mode === 'data' || mode === 'all') await data(b);
  if (mode === 'tele' || mode === 'all') await tele(b);
  if (mode === 'parts' || mode === 'all') await parts(b);
  if (mode === 'mech' || mode === 'all') await mech(b);
  if (mode === 'phases' || mode === 'all') await phases(b);
  if (mode === 'unlock' || mode === 'all') await unlock(b);
  if (mode === 'hunt' || mode === 'all') await hunt(b);
  if (mode === 'flow' || mode === 'all') await flow(b);
  console.log(fails ? `RESULTADO: ${fails} FALLO(S)` : 'RESULTADO: TODO OK');
  await b.close(); process.exit(fails ? 1 : 0);
})();
