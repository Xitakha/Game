// PRUEBAS P5 (Panal: arena hexagonal, miel, celdas, humo y familia de 9; DESIGN-v5-biomas.md B.4, B.6, B.7, C.2 + DESIGN-v6-minijefes.md 5).
// uso: node p5_tests.js arena|honey|cells|smoke|tele|mech|minis|data|flow|all [base]   (base por defecto http://localhost:8847)
//  arena: hexágono (muros diagonales: jugador, enemigos, spawn y proyectiles), pilares de cera (colisión, bloqueo, 300 HP, reconstrucción a los 40 s)
//  honey: miel (45 % jugador, 35 % terrestres, voladores y Babosa no, no apila, 600 ms de retraso, 10 s + fundido 1 s), caramelización por Fuego (máx. 2/s), charcos libres
//  cells: celdas (aviso 1000-1200 ms, estados, tope 24 / 36, >= 55 % libre, camino sin miel siempre, coste por fotograma)
//  smoke: humo (Fuego crea nube r 36 / 1,8 s / máx. 6; sedación: -40 % velocidad, sin ataques, sin cura; no sedan los no insectos)
//  tele : telegrafías de los 9 monstruos medidas en el juego contra G.B.tele y la regla 250 + 1000 x salida / 190
//  mech : mecánicas (vuelo, curación de aliados del Polinizador, Larva + charco, Zángano + pilar, escudo de cera, Babosa, Avispa, Nodriza, nidos)
//  minis: Avispón Real y Reina Joven (telegrafías, parte, botín, Insignia, director a 3:30 y 5:30)
//  data : tabla B.6 (tiers, pesos, costes, topes, materiales), packs, drops, Portal bloqueado ('? PANAL'), encargo, ?biome=panal sin jefa
//  flow : expedición completa en el Panal sin jefa con el bot (aldea -> expedición -> botín -> aldea) y flujo táctil 844x390
const { chromium } = require('/opt/node-tools/node_modules/playwright');
const fs = require('fs');
const mode = process.argv[2] || 'all', base = process.argv[3] || 'http://localhost:8847';
const botSrc = fs.readFileSync(__dirname + '/bot_page.js', 'utf8');
let fails = 0; const ok = (c, msg) => { if (!c) fails++; console.log((c ? 'OK     ' : 'FALLO  ') + msg); };
const launch = () => chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--no-sandbox', '--autoplay-policy=no-user-gesture-required'] });
async function page(b, q, vp) {
  const pg = await b.newPage({ viewport: vp || { width: 960, height: 540 } }); pg.errs = [];
  pg.on('console', m => { if (m.type() === 'error') pg.errs.push(m.text()); }); pg.on('pageerror', e => pg.errs.push('PAGEERR ' + e.message + ' ' + (e.stack || '').split('\n').slice(1, 3).join('|')));
  await pg.goto(`${base}/index.html?reset=1&god=1&dbg=1&nobos=1&biome=panal&env=0&nosw=1${q || ''}`); await pg.waitForTimeout(400);
  await pg.evaluate(() => { G.startGame(); });
  return pg;
}
const SIM = `
window.__sim = function (ms, cb) { var dt = 1000 / 60, t = 0; while (t < ms) { G.time += dt; G.Player.update(G.player, dt); G.Enemies.update(dt); G.Combat.update(dt); G.Panal.update(dt); t += dt; if (cb && cb(t) === false) break; } return t; };
window.__clear = function (x, y) { G.enemies.length = 0; G.projectiles.length = 0; G.zones.length = 0; G.gems.length = 0; var P = G.Panal; P.begin('panal'); var p = G.player; p.x = x == null ? 720 : x; p.y = y == null ? 405 : y; p.hp = p.maxHp; p.hurtT = 0; p.kx = p.ky = 0; p.vx = p.vy = 0; p.slowT = 0; p.slowPct = 0; p.dead = false; G.state = 'play'; G.input.joy = { active: false, id: null, ox: 0, oy: 0, x: 0, y: 0 }; P.nobos = true; };
window.__hold = function (x, y) { G.input.joy = { active: true, id: 1, ox: 0, oy: 0, x: x, y: y }; };
window.__free = function () { G.input.joy = { active: false, id: null, ox: 0, oy: 0, x: 0, y: 0 }; };
window.__mk = function (type, dx, dy, o) { var e = G.Enemies.spawn(type, G.player.x + dx, G.player.y + dy, Object.assign({ spawnT: 0 }, o || {})); e.sumT = e.shootT = e.atkT = e.pulseT = e.spitT = e.bashT = 1e9; return e; };
window.__durs = function (e, ms, states) { var cur = null, t0 = 0, out = {}; __sim(ms, function (t) { if (e.dead) { if (cur && states.indexOf(cur) >= 0) (out[cur] = out[cur] || []).push(Math.round(t - t0)); cur = null; return false; } if (e.st !== cur) { if (cur && states.indexOf(cur) >= 0) (out[cur] = out[cur] || []).push(Math.round(t - t0)); cur = e.st; t0 = t; } }); return out; };
window.__hit = function (e, dmg, tag) { e.untarget = false; e.immune = false; return G.Combat.deal(e, dmg, { tag: tag || 'steel', ang: 0 }); };
window.__honeyAt = function (x, y) { var c = G.Panal.cellAt(x, y); G.Panal.openCell(c, { tele: 1, life: 10000 }); __sim(700); return c; };
`;

async function arena(b) {
  console.log('--- arena hexagonal, muros diagonales y pilares (B.4.1)');
  const pg = await page(b); await pg.evaluate(SIM);
  const r = await pg.evaluate(() => {
    const P = G.Panal, o = {}; __clear();
    o.cells = P.cells.length; o.artCells = Assets.PANAL ? Assets.PANAL.cells.length : -1; o.nests = P.nests.length; o.pillars = P.pillars.length; o.area = Math.round(P.hexArea());
    o.inC = P.inside(720, 405, 0); o.outC = P.inside(60, 60, 0); o.outC2 = P.inside(1400, 40, 0); o.edge = P.inside(260, 60, 0);
    const p = G.player; o.walls = [];
    [[40, 40], [1400, 40], [40, 770], [1400, 770]].forEach(c => { __clear(c[0], c[1]); p.x = c[0]; p.y = c[1]; __sim(100); o.walls.push(Math.round(P.wallDist(p.x, p.y)), p.x > 0 && p.x < G.AW); });
    // corre contra la esquina con el mando: nunca atraviesa el muro
    __clear(300, 120); __hold(1, -1); let minD = 1e9; __sim(3000, () => { minD = Math.min(minD, P.wallDist(p.x, p.y)); }); o.runMin = Math.round(minD * 10) / 10; o.runPos = [Math.round(p.x), Math.round(p.y)]; __free();
    __clear(1200, 700); __hold(1, 1); minD = 1e9; __sim(3000, () => { minD = Math.min(minD, P.wallDist(p.x, p.y)); }); o.runMin2 = Math.round(minD * 10) / 10; __free();
    // enemigos terrestres y voladores empujados dentro
    __clear(); const e1 = G.Enemies.spawn('worm', 10, 10, { spawnT: 0 }), e2 = G.Enemies.spawn('archer', 1430, 800, { spawnT: 0 }); o.spawnIn = [Math.round(P.wallDist(e1.x, e1.y)), Math.round(P.wallDist(e2.x, e2.y))];
    e1.x = 20; e1.y = 20; G.Enemies.update(16); o.pushed = P.wallDist(e1.x, e1.y) >= 28 - 0.5;
    // spawn del director: 2000 posiciones con el jugador en las 4 esquinas jugables
    let bad = 0; [[120, 90], [1320, 90], [120, 720], [1320, 720], [720, 405]].forEach(c => { G.player.x = c[0]; G.player.y = c[1]; for (let i = 0; i < 400; i++) { const q = G.Waves.spawnPos(); if (!P.inside(q[0], q[1], 0)) bad++; } }); o.spawnBad = bad;
    // proyectiles
    __clear(300, 300); G.Enemies.shoot('e', 120, 90, Math.atan2(-1, -1.1), 200, 5, null, { r: 5, life: 5000 }); let pass = false; for (let i = 0; i < 120; i++) { __sim(16.7); const q = G.projectiles[0]; if (q && P.wallDist(q.x, q.y) < -2) pass = true; } o.eprojGone = G.projectiles.length === 0; o.eprojPass = pass;
    __clear(300, 300); G.projectiles.push({ team: 'p', x: 150, y: 100, vx: -150, vy: -150, ang: -2.3, dmg: 5, tag: 'steel', r: 6, life: 3000, pierce: false, hit: new Set(), t: 0, rot: 0, back: false, speed: 200, bounce: 0, o: {}, kind: 'dagger' });
    pass = false; for (let i = 0; i < 80; i++) { __sim(16.7); const q = G.projectiles[0]; if (q && P.wallDist(q.x, q.y) < -4) pass = true; } o.pprojGone = G.projectiles.length === 0 && !pass;
    // pilares
    __clear(480, 300 + 28 + 10 + 40); __hold(0, -1); __sim(1500); o.pillarPush = Math.hypot(p.x - 480, p.y - 300) >= 28 + p.r - 0.5; __free();
    __clear(300, 300); G.Enemies.shoot('e', 300, 300, 0, 300, 5, null, { r: 5, life: 5000 }); G.projectiles[0].x = 380; G.projectiles[0].y = 300; G.Enemies.shoot('e', 400, 300, 0, 300, 5, null, { r: 5, life: 5000 }); let n0 = 0;
    G.projectiles.length = 0; G.Enemies.shoot('e', 380, 300, 0, 300, 5, null, { r: 5, life: 5000 }); __sim(300); o.pillarBlocks = G.projectiles.length === 0;
    P.hitPillar(0, 150); o.pillarHp = P.pillars[0].hp; P.hitPillar(0, 200); o.pillarDead = P.pillars[0].dead; __sim(39000); const mid = P.pillars[0].dead; __sim(1500); o.regrow = [mid, P.pillars[0].dead, P.pillars[0].hp];
    return o;
  });
  console.log(JSON.stringify(r));
  ok(r.cells === r.artCells && r.cells >= 150 && r.cells <= 175, `celdas de cera = las del arte (${r.cells} / ${r.artCells}; doc ~150)`);
  ok(r.nests === 6 && r.pillars === 4, 'seis nidos y cuatro pilares');
  ok(Math.abs(r.area - 1020600) < 5, `área del hexágono ${r.area} (vértices del doc)`);
  ok(r.inC && !r.outC && !r.outC2 && r.edge, 'inside(): centro dentro, esquinas cortadas fuera');
  ok(r.walls.filter((v, i) => i % 2 === 0).every(v => v >= 27.5) && r.walls.filter((v, i) => i % 2 === 1).every(v => v), 'un jugador colocado en las 4 esquinas recortadas queda empujado dentro del muro (' + r.walls + ')');
  ok(r.runMin >= 27 && r.runMin2 >= 27, `correr contra el muro diagonal no lo atraviesa (distancia mín. ${r.runMin} / ${r.runMin2})`);
  ok(r.spawnIn.every(v => v >= 27.5) && r.pushed, 'los enemigos (terrestres y voladores) nacen y se mantienen dentro (' + r.spawnIn + ')');
  ok(r.spawnBad === 0, 'el director nunca crea enemigos en las esquinas cortadas (2000 posiciones)');
  ok(r.eprojGone && !r.eprojPass && r.pprojGone, 'los proyectiles enemigos y los del jugador mueren al tocar el muro diagonal');
  ok(r.pillarPush && r.pillarBlocks, 'el pilar de cera bloquea al jugador y a los proyectiles enemigos');
  ok(r.pillarHp === 150 && r.pillarDead && r.regrow[0] === true && r.regrow[1] === false && r.regrow[2] === 300, 'pilar: 300 HP, se rompe y se reconstruye a los 40 s');
  // vista inclinada: sin errores y el suelo se aplana
  const pi = await page(b, '&view=iso'); await pi.waitForTimeout(1200); const iso = await pi.evaluate(() => G.Proj.iso && !!G.ground); ok(iso && !pi.errs.length, 'vista inclinada (?view=iso) en el Panal sin errores ' + pi.errs.slice(0, 2).join('|'));
  ok(!pg.errs.length, 'arena: 0 errores de consola ' + pg.errs.slice(0, 3).join(' | '));
}

async function honey(b) {
  console.log('--- miel (B.4.2)');
  const pg = await page(b); await pg.evaluate(SIM);
  const r = await pg.evaluate(() => {
    const P = G.Panal, p = G.player, o = {}, V = G.B.player.speed * G.Cards.mods.speed; __clear(720, 405);
    // velocidad del jugador sin miel / con miel (celda abierta)
    __hold(1, 0); __sim(100); let x0 = p.x; __sim(300); o.vFree = Math.round((p.x - x0) / 0.3); __free();
    __clear(720, 405); const c = __honeyAt(720, 405); o.cellSt = c.st;
    __hold(1, 0); __sim(100); x0 = p.x; __sim(300); o.vHoney = Math.round((p.x - x0) / 0.3 * 10) / 10; o.inCell = P.honeyAt(p.x, p.y); __free(); o.slowPct = p.slowPct;
    // no apila: ralentización de hielo del 60 % + miel -> manda la mayor
    p.slowT = 0; G.Player.slow(p, 0.6, 500); G.Player.update(p, 16); P.update(16); o.maxSlow = p.slowPct;
    // retraso de 600 ms, 10 s de duración y fundido de 1 s
    __clear(720, 405); const c2 = P.cellAt(300, 400), tl = []; P.openCell(c2, { tele: 1100 }); let last = -1; __sim(13000, t => { if (c2.st !== last) { tl.push([c2.st, Math.round(t)]); last = c2.st; } }); o.timeline = tl; o.endSt = c2.st;
    // enemigos: terrestre -35 %, volador y Babosa sin efecto
    __clear(1000, 405); __honeyAt(720, 405); const a = __mk('worm', 0, 0), q = __mk('archer', 0, 0), s = __mk('honeyslug', 0, 0); [a, q, s].forEach(e => { e.x = 720; e.y = 405; e.spd = 0; });
    o.eslow = [P.enemySlow(a), P.enemySlow(q), P.enemySlow(s)];
    // charco libre
    __clear(720, 405); P.puddle(720, 405, 36, 5000); o.pudHoney = P.honeyAt(720, 405); o.pudOut = P.honeyAt(720 + 60, 405); __sim(5200); o.pudGone = !P.honeyAt(720, 405) && P.puddles.length === 0;
    // Fuego carameliza: sella al instante y máx. 2 por segundo
    __clear(720, 405); const cs = [[720, 405], [792, 405 + 41], [648, 405 + 41], [720, 405 + 83]].map(xy => __honeyAt(xy[0], xy[1])); o.allHoney = cs.every(k => k.st === 3);
    cs.forEach((k, i) => { G.Panal.caramelize(k.x, k.y, 0); }); o.caramel1s = cs.filter(k => k.st === 5).length; __sim(1100); const rest = cs.filter(k => k.st === 3).length; cs.forEach(k => { if (k.st === 3) P.caramelize(k.x, k.y, 0); }); o.caramel2 = cs.filter(k => k.st === 5 || k.st === 0).length; __sim(600); o.sealed = cs.filter(k => k.st === 0).length;
    // el daño de Fuego sobre un enemigo que pisa miel carameliza su celda y levanta humo
    __clear(720, 405); const ch = __honeyAt(720, 405), w = __mk('worm', 0, 0); w.x = 720; w.y = 405; w.hp = w.maxHp = 500; G.Combat.deal(w, 5, { tag: 'fire', ang: 0 }); o.fireDeal = ch.st === 5; o.smokeFromFire = P.clouds.length;
    // las explosiones de Fuego también
    __clear(720, 405); const cb = __honeyAt(720, 405); G.Combat.boom(720, 405, 60, 5, 'fire', {}); o.boom = cb.st === 5;
    // la Larva explosiva deja un charco de miel r 36 / 5 s
    __clear(720, 405); const lv = __mk('bomb', 100, 0); lv.x = 900; lv.y = 405; lv.st = 'lit'; lv.t = 650; __sim(200); o.larvaPuddle = P.puddles.length && P.puddles[0].r === 36 && Math.round(P.puddles[0].max) === 5000;
    return o;
  });
  console.log(JSON.stringify(r));
  ok(Math.abs(r.vHoney / (r.vFree) - 0.55) < 0.03, `jugador: ${r.vFree} px/s libre, ${r.vHoney} en miel (x${(r.vHoney / r.vFree).toFixed(2)}; -45 %)`);
  ok(r.maxSlow >= 0.6, 'no apila: con hielo 60 % + miel manda la mayor (' + r.maxSlow + ')');
  const tl = r.timeline.map(x => x[0] + '@' + x[1]).join(' ');
  const t = Object.fromEntries(r.timeline.map(x => [x[0], x[1]]));
  ok(r.timeline.map(x => x[0]).join() === '1,2,3,4,0' && Math.abs(t[2] - 1100) < 40 && Math.abs(t[3] - t[2] - 600) < 40 && Math.abs(t[4] - t[3] - 10000) < 40 && Math.abs(t[0] - t[4] - 1000) < 40, 'celda: aviso 1100 ms -> abierta 600 ms sin efecto -> miel 10 s -> fundido 1 s -> cera (' + tl + ')');
  ok(Math.abs(r.eslow[0] - 0.65) < 1e-6 && r.eslow[1] === 1 && r.eslow[2] === 1, 'terrestres -35 % (x' + r.eslow[0] + '), voladores y Babosa inmunes (' + r.eslow.slice(1) + ')');
  ok(r.pudHoney && !r.pudOut && r.pudGone, 'charco libre: ralentiza dentro, no fuera y desaparece a los 5 s');
  ok(r.allHoney && r.caramel1s === 2 && r.caramel2 >= 3 && r.sealed >= 2, `Fuego carameliza: máx. 2 por segundo (${r.caramel1s} en el primer segundo) y sella al instante`);
  ok(r.fireDeal && r.smokeFromFire >= 0 && r.boom, 'un impacto de Fuego (golpe y explosión) sobre miel la carameliza');
  ok(r.larvaPuddle, 'la Larva explosiva deja un charco de miel de r 36 y 5 s');
  ok(!pg.errs.length, 'miel: 0 errores de consola ' + pg.errs.slice(0, 3).join(' | '));
}

async function cells(b) {
  console.log('--- celdas: invariantes de justicia (B.4.2) y coste');
  const pg = await page(b); await pg.evaluate(SIM);
  const r = await pg.evaluate(() => {
    const P = G.Panal, p = G.player, o = {}; __clear(720, 405);
    let opened = 0; for (let i = 0; i < 400; i++) { const c = P.cells[Math.floor(Math.random() * P.cells.length)]; if (P.openCell(c, { tele: 100000 })) opened++; } const v = P.validate(); o.cap24 = [opened, v.honey, v.ok, v.connected, +v.freeFrac.toFixed(3)];
    __clear(720, 405); P.setCap(36, 1); opened = 0; for (let i = 0; i < 600; i++) if (P.openCell(P.cells[Math.floor(Math.random() * P.cells.length)], { tele: 100000 })) opened++; const v2 = P.validate(); o.cap36 = [opened, v2.honey, v2.ok, v2.connected, +v2.freeFrac.toFixed(3)];
    __clear(720, 405); P.setCap(36, 1.5); opened = 0; for (let i = 0; i < 900; i++) if (P.openCell(P.cells[Math.floor(Math.random() * P.cells.length)], { tele: 100000 })) opened++; const v3 = P.validate(); o.cap54 = [opened, v3.ok, v3.connected, +v3.freeFrac.toFixed(3)];
    // una celda no puede quedar aislada: abrir sus 6 vecinas se rechaza en la última
    __clear(300, 405); const C = P.cellAt(1000, 405); let res = []; C.nb.forEach(n => res.push(P.openCell(n, { tele: 100000 }))); o.isolate = res; o.isoConnected = P.validate().connected;
    // el jugador rodeado: tampoco se le puede encerrar
    __clear(720, 405); const pc = P.cellAt(720, 405); res = []; pc.nb.forEach(n => res.push(P.openCell(n, { tele: 100000 }))); o.surround = res; o.surConn = P.validate().connected;
    // nidos y cera no se abren
    __clear(720, 405); o.nestNo = P.openCell(P.nests[0], {}) === false;
    // coste por fotograma con 24 celdas activas (update + dibujo del suelo dinámico)
    __clear(720, 405); P.setCap(24, 1); let n = 0; for (let i = 0; i < 300 && n < 24; i++) if (P.openCell(P.cells[Math.floor(Math.random() * P.cells.length)], { tele: 300, life: 100000 })) n++; __sim(1200);
    const cv = document.createElement('canvas'); cv.width = 960; cv.height = 540; const g = cv.getContext('2d'); G.cam.x = 200; G.cam.y = 100; let t0 = performance.now(); for (let i = 0; i < 200; i++) { P.update(16.7); P.drawGround(g); } o.msFrame = +((performance.now() - t0) / 200).toFixed(3);
    t0 = performance.now(); for (let i = 0; i < 2000; i++) P.cellAt(Math.random() * 1440, Math.random() * 810); o.msCellAt = +((performance.now() - t0) / 2000).toFixed(5);
    // evento del entorno: aviso entre 1000 y 1200 ms
    __clear(720, 405); const k0 = P.envEvent(); o.env = [k0, P.activeCells().length, P.activeCells().every(c => c.t >= 1000 && c.t <= 1200)];
    return o;
  });
  console.log(JSON.stringify(r));
  ok(r.cap24[0] === 24 && r.cap24[1] === 24 && r.cap24[2] && r.cap24[3] && r.cap24[4] >= 0.55, `tope de 24 celdas de miel (F1-F2), >= 55 % libre (${r.cap24[4]}), camino sin miel ${r.cap24[3]}`);
  ok(r.cap36[0] === 36 && r.cap36[2] && r.cap36[3] && r.cap36[4] >= 0.55, `tope de 36 celdas (F3), >= 55 % libre (${r.cap36[4]})`);
  ok(r.cap54[0] === 54 && r.cap54[1] && r.cap54[2] && r.cap54[3] >= 0.55, `Peligro IV (x1,5): 54 celdas, invariantes intactos (${r.cap54[3]})`);
  ok(r.isolate.slice(0, 5).every(x => x) && r.isolate[5] === false && r.isoConnected, 'una celda no puede quedar aislada: la 6.ª vecina se rechaza (' + r.isolate + ')');
  ok(r.surround.some(x => !x) && r.surConn, 'siempre existe camino sin miel hasta cualquier punto (el jugador no se encierra)');
  ok(r.nestNo, 'los nidos no se abren como miel');
  ok(r.msFrame < 1 && r.msCellAt < 0.01, `coste: ${r.msFrame} ms por fotograma con 24 celdas (< 1 ms), cellAt ${r.msCellAt} ms (O(1))`);
  ok(r.env[0] > 0 && r.env[2], 'evento del entorno: abre celdas con aviso de 1000-1200 ms (' + r.env + ')');
  ok(!pg.errs.length, 'celdas: 0 errores de consola ' + pg.errs.slice(0, 3).join(' | '));
}

async function smoke(b) {
  console.log('--- humo y sedación (B.4.3)');
  const pg = await page(b); await pg.evaluate(SIM);
  const r = await pg.evaluate(() => {
    const P = G.Panal, p = G.player, o = {}; __clear(300, 300);
    const w = __mk('worm', 200, 0); w.hp = w.maxHp = 1e6; G.Combat.deal(w, 3, { tag: 'fire', ang: 0 }); o.cloud = P.clouds.length; o.r = P.clouds[0] && P.clouds[0].r; o.life = P.clouds[0] && Math.round(P.clouds[0].max);
    G.Combat.deal(w, 3, { tag: 'steel', ang: 0 }); o.steelNo = P.clouds.length === 1;
    // máx. 6 a la vez
    for (let i = 0; i < 20; i++) P.smoke(800 + i * 60, 700); o.max6 = P.clouds.length;
    __sim(1900); o.gone = P.clouds.length;
    // sedación: velocidad -40 % y sin ataques (insecto) / sin efecto (Guardia)
    __clear(300, 300); const ob = __mk('worm', 300, 0), gd = __mk('shield', 300, 80); ob.fe && 0; G.Panal.smoke(ob.x, ob.y); G.Panal.smoke(gd.x, gd.y);
    ob.hitCd = 0; const spd0 = ob.spdBase; G.Enemies.update(16); o.sedSpd = +(ob.spd / (spd0 * G.B.speedMul(G.vt() / 60000))).toFixed(3); o.sed = [ob.sed, !!gd.sed];
    // no ataca: Obrera pegada al jugador no hiere mientras está sedada
    __clear(300, 300); const o2 = __mk('worm', 5, 0); P.smoke(o2.x, o2.y); const hp0 = p.hp; G.god = false; __sim(700); o.sedHit = hp0 - p.hp; G.god = true;
    // la Aguijonera sedada no empieza a disparar (temporizador pausado) y la sana sí
    __clear(300, 405); const a1 = __mk('archer', 250, 0); a1.shootT = 300; P.smoke(a1.x, a1.y); let ns = 0; __sim(1500, () => { ns = Math.max(ns, G.projectiles.filter(z => z.team === 'e').length); }); o.archerSed = ns;
    __clear(300, 405); const a2 = __mk('archer', 250, 0); a2.shootT = 300; ns = 0; __sim(1500, () => { ns = Math.max(ns, G.projectiles.filter(z => z.team === 'e').length); }); o.archerFree = ns;
    // el aviso en curso se aborta al entrar en el humo
    __clear(300, 300); const a3 = __mk('archer', 250, 0); a3.shootT = 0; __sim(100); const was = a3.st; P.smoke(a3.x, a3.y); __sim(60); o.abort = [was, a3.st];
    // humo desde Fuego sobre celda de miel
    __clear(720, 405); const ch = __honeyAt(720, 405); const nc = P.clouds.length; P.caramelize(ch.x, ch.y, 0); o.cellSmoke = P.clouds.length > nc;
    return o;
  });
  console.log(JSON.stringify(r));
  ok(r.cloud === 1 && r.r === 36 && r.life === 1800 && r.steelNo, `un impacto de Fuego sobre un insecto crea una nube r ${r.r} de ${r.life} ms; el Acero no`);
  ok(r.max6 === 6 && r.gone === 0, 'máximo 6 nubes a la vez y se disipan a los 1,8 s');
  ok(Math.abs(r.sedSpd - 0.6) < 0.01 && r.sed[0] === true && r.sed[1] === false, `sedación: velocidad x${r.sedSpd} (-40 %); la Guardia de cera (no insecto) no se seda`);
  ok(r.sedHit === 0, 'una Obrera sedada pegada al jugador no ataca (daño recibido ' + r.sedHit + ')');
  ok(r.archerSed === 0 && r.archerFree > 0, 'la Aguijonera sedada no dispara (' + r.archerSed + ' proyectiles) y la libre sí (' + r.archerFree + ')');
  ok(r.abort[0] === 'aim' && r.abort[1] === 'move', 'el aviso en curso se aborta al entrar en el humo (' + r.abort + ')');
  ok(r.cellSmoke, 'el Fuego sobre una celda de miel también crea humo');
  ok(!pg.errs.length, 'humo: 0 errores de consola ' + pg.errs.slice(0, 3).join(' | '));
}

async function tele(b) {
  console.log('--- telegrafías medidas en el juego (regla 250 + 1000 x salida / 190)');
  const pg = await page(b); await pg.evaluate(SIM);
  const r = await pg.evaluate(() => {
    const o = {}; __clear(720, 405); G.Panal.setCap(24, 1);
    function m(type, dx, st, trig) { __clear(720, 405); const e = __mk(type, dx, 0); trig(e); const d = __durs(e, 3000, st); return d; }
    o.archer = m('archer', 220, ['aim'], e => { e.shootT = 0; });
    o.bomb = m('bomb', 200, ['lit'], e => { e.x = G.player.x + 30; e.y = G.player.y; });
    o.drone = m('boar', 200, ['wind'], e => { e.atkT = 0; });
    o.guard = m('shield', 40, ['wind'], e => { e.bashT = 0; });
    o.slug = m('honeyslug', 200, ['spit'], e => { e.spitT = 0; });
    o.poll = m('pollinator', 330, ['pulse'], e => { e.pulseT = 0; });
    o.wasp = m('blinker', 200, ['fade', 'slash'], e => { e.atkT = 0; });
    o.nurse = m('warlock', 400, ['cast'], e => { e.sumT = 0; });
    o.audit = G.B.teleAudit().filter(t => ['drone', 'slug', 'pollen', 'wasp', 'nurse', 'archer', 'bomb', 'shield'].indexOf(t.id) >= 0).map(t => [t.id, t.ms, t.need, t.ok]);
    o.tele = { archer: G.B.tele.archer.ms, bomb: G.B.tele.bomb.ms, drone: G.B.tele.drone.ms, shield: G.B.tele.shield.ms, slug: G.B.tele.slug.ms, pollen: G.B.tele.pollen.ms, wasp: G.B.tele.wasp.ms, nurse: G.B.tele.nurse.ms };
    return o;
  });
  console.log(JSON.stringify(r));
  const near = (a, ms, tol) => a && a[0] && Math.abs(a[0] - ms) <= (tol || 40);
  ok(near(r.archer.aim, 400) && near(r.bomb.lit, 700, 60) && near(r.drone.wind, 600) && near(r.guard.wind, 500) && near(r.slug.spit, 500) && near(r.poll.pulse, 500) && near(r.nurse.cast, 500), 'avisos medidos: Aguijonera 400, Larva 700, Zángano 600, Guardia 500, Babosa 500, Polinizador 500, Nodriza 500 ms');
  ok(near(r.wasp.fade, 500) && near(r.wasp.slash, 350), 'Avispa: borrón 500 ms + tajo 350 ms (850 ms)');
  ok(r.audit.every(a => a[3]), 'auditoría de G.B.tele (Panal): todas cumplen la regla y >= 400 ms los fuertes (' + r.audit.map(a => a[0] + ' ' + a[1] + '/' + a[2]).join(', ') + ')');
  ok(!pg.errs.length, 'tele: 0 errores de consola ' + pg.errs.slice(0, 3).join(' | '));
}

async function mech(b) {
  console.log('--- mecánicas de la familia (B.6)');
  const pg = await page(b); await pg.evaluate(SIM);
  const r = await pg.evaluate(() => {
    const P = G.Panal, p = G.player, o = {}; __clear(720, 405);
    // vuelo: voladores ignoran miel y pilares; terrestres no
    const fl = ['archer', 'boar', 'pollinator', 'blinker', 'warlock'].map(t => __mk(t, 100, 0).fly), gr = ['worm', 'bomb', 'shield', 'honeyslug'].map(t => __mk(t, 100, 0).fly); o.fly = [fl.every(x => x), gr.every(x => !x)];
    // Polinizador: cura a los aliados en r 120 un 20 % del HP máx. en 2 s
    __clear(720, 405); const pol = __mk('pollinator', 400, 0), a1 = __mk('worm', 440, 0), a2 = __mk('worm', 700, 0), mn = a1.maxHp; pol.x = 1100; pol.y = 405; a1.x = 1160; a1.y = 405; a2.x = 1350; a2.y = 405; a1.hp = a2.hp = mn * 0.4; a1.spd = a2.spd = a1.spdBase = a2.spdBase = 0; pol.spd = pol.spdBase = 0;
    pol.pulseT = 0; G.Enemies.update(16); const stp = pol.st; __sim(520); const h0 = a1.hp; __sim(2100); o.heal = [stp, +((a1.hp - mn * 0.4) / mn).toFixed(3), +((a2.hp - mn * 0.4) / mn).toFixed(3), +(h0 / mn).toFixed(2)];
    // sedado: no recibe la cura
    __clear(720, 405); const pol2 = __mk('pollinator', 400, 0), b1 = __mk('worm', 440, 0); pol2.x = 1100; pol2.y = 405; b1.x = 1160; b1.y = 405; b1.hp = b1.maxHp * 0.4; b1.spd = b1.spdBase = 0; pol2.spd = pol2.spdBase = 0; P.healPulse(pol2, pol2.x, pol2.y); P.smoke(b1.x, b1.y); const bh = b1.hp; __sim(1500); o.sedHeal = +((b1.hp - bh) / b1.maxHp).toFixed(3);
    // Larva: charco de miel al explotar (ya medido en honey); Nodriza invoca 2 Larvas cada 6 s (máx. 4) y matarla las disipa
    __clear(720, 405); const nu = __mk('warlock', 400, 0); nu.sumT = 0; nu.spd = 0; nu.spdBase = 0; let maxL = 0; __sim(14500, () => { let n = 0; G.enemies.forEach(q => { if (!q.dead && q.owner === nu) { n++; q.spdBase = 0; q.st = 'move'; } }); maxL = Math.max(maxL, n); }); o.nurse = maxL;
    G.Combat.deal(nu, 1e6, { tag: 'steel', ang: 0 }); let left = 0; G.enemies.forEach(q => { if (!q.dead && q.owner === nu) left++; }); o.nurseDie = left;
    // Zángano: carga 360 px/s y se aturde 1 s contra un pilar y lo daña
    __clear(480, 405); const dr = __mk('boar', 0, 0); p.x = 700; p.y = 405; const pil = P.pillars[0]; dr.x = 480; dr.y = 450; dr.ang = -Math.PI / 2; dr.fa = dr.ang; dr.st = 'charge'; dr.t = 0; dr.trav = 0; dr.hitDone = true; let tStun = null, tEnd = null, sp = null, y0 = dr.y; __sim(1500, t => { if (sp == null && t > 100) sp = Math.abs(dr.y - y0) / (t / 1000); if (dr.st === 'stun' && tStun == null) tStun = t; if (tStun != null && dr.st !== 'stun' && tEnd == null) tEnd = t; });
    o.drone = { stunned: tStun != null, speed: sp && Math.round(sp), pillarHp: pil.hp }; o.droneStunMs = Math.round(tEnd - tStun);
    // Guardia de cera: escudo frontal x0,2; 40 de Fuego lo funde (frontal x1)
    __clear(720, 405); const gd = __mk('shield', 100, 0); gd.hp = gd.maxHp = 1e6; gd.spd = 0; gd.fa = Math.PI; gd.shield = 70 * Math.PI / 180; const fw = G.Combat.deal(gd, 10, { tag: 'steel', ang: 0, sx: gd.x - 50, sy: gd.y }); gd.fa = Math.PI; o.shield = { front: +fw.toFixed(1), plate: gd.plateHp };
    let fire = 0; for (let i = 0; i < 12 && gd.plateHp > 0; i++) { G.Combat.deal(gd, 8, { tag: 'fire', ang: 0, sx: gd.x - 50, sy: gd.y }); fire += 8; } o.melt = [gd.plateHp, gd.shield, fire]; gd.fa = Math.PI; const fw2 = G.Combat.deal(gd, 10, { tag: 'steel', ang: 0, sx: gd.x - 50, sy: gd.y }); o.afterMelt = +fw2.toFixed(1);
    // Babosa: rastro de miel cada 60 px, escupitajo (círculo r 34, charco 6 s) e inmune a la miel
    __clear(300, 300); const sl = __mk('honeyslug', 650, 0); sl.spitT = 1e9; sl.spd = 35; sl.spdBase = 35; __sim(6000); o.slugTrail = P.puddles.filter(q => q.r === 26).length > 1; P.puddles.length = 0;
    sl.spitT = 0; sl.x = 700; sl.y = 300; p.x = 400; p.y = 300; __sim(300); const spit = sl.st; __sim(3000); o.slugSpit = [spit, P.puddles.some(q => q.r === 34 && q.max === 6000)];
    // Aguijonera dispara aguijón recto a 230 px/s
    __clear(300, 405); const ag = __mk('archer', 200, 0); ag.shootT = 0; let sp2 = null; __sim(1500, () => { const q = G.projectiles.find(z => z.team === 'e'); if (q) { sp2 = Math.round(Math.hypot(q.vx, q.vy)); return false; } }); o.sting = sp2;
    // Avispa: reaparece a ~55 px y hiere (14 de daño con dmg x0,9)
    __clear(300, 300); G.god = false; const av = __mk('blinker', 180, 0); av.atkT = 0; __sim(1500); o.wasp = [Math.round(av.dmg * 10) / 10, p.hp < p.maxHp]; G.god = true;
    // nidos: la Larva del director sale de un nido (>= 200 px del jugador)
    __clear(300, 300); const lv = P.spawnLarva([900, 300]); o.nest = [!!lv.fromNest, P.nests.some(n => Math.hypot(n.x - lv.x, n.y - lv.y) < 1)];
    // sprites: 9 monstruos con sprite propio del arte (assets_fam4.js)
    o.sprites = Object.keys(G.B.fam.panal.use).map(k => G.hasSpr(G.B.fam.panal.use[k].spr));
    return o;
  });
  console.log(JSON.stringify(r));
  ok(r.fly[0] && r.fly[1], 'vuelan: Aguijonera, Zángano, Polinizador, Avispa y Nodriza; son terrestres Obrera, Larva, Guardia y Babosa');
  ok(r.heal[0] === 'pulse' && Math.abs(r.heal[1] - 0.2) < 0.03 && r.heal[2] === 0 && r.heal[3] < 0.5, `Polinizador: pulso, cura a los aliados en r 120 un ${Math.round(r.heal[1] * 100)} % en 2 s (a 290 px: ${r.heal[2]}; a mitad de pulso ${r.heal[3]})`);
  ok(r.sedHeal <= 0.001, 'un insecto sedado no recibe la cura (' + r.sedHeal + ')');
  ok(r.nurse === 4 && r.nurseDie === 0, `Nodriza: invoca Larvas (máx. ${r.nurse} vivas) y al morir se disipan`);
  ok(r.drone.stunned && Math.abs(r.drone.speed - 360) < 25 && r.drone.pillarHp < 300 && Math.abs(r.droneStunMs - 1000) < 40, `Zángano: carga ${r.drone.speed} px/s, choca con el pilar (HP ${r.drone.pillarHp}), aturdido 1 s (${r.droneStunMs})`);
  ok(r.shield.front < 3 && r.shield.plate === 40 && r.melt[0] <= 0 && r.melt[1] === 0 && r.melt[2] <= 48 && r.afterMelt >= 9, `Guardia de cera: frontal x0,2 (${r.shield.front}), 40 de Fuego funden el escudo (${r.melt[2]} lanzados) y luego x1 (${r.afterMelt})`);
  ok(r.slugTrail && r.slugSpit[0] === 'spit' && r.slugSpit[1], 'Babosa: rastro de miel r 26 y escupitajo con charco r 34 de 6 s');
  ok(r.sting === 230, 'Aguijonera: aguijón a 230 px/s (' + r.sting + ')');
  ok(r.wasp[0] === 14.4 || Math.abs(r.wasp[0] - 14.4) < 1.5, 'Avispa: tajo de ~14 de daño (' + r.wasp[0] + ')');
  ok(r.nest[0] && r.nest[1], 'las Larvas del director salen de los nidos');
  ok(r.sprites.every(x => x), 'los 9 monstruos usan su sprite propio (assets_fam4.js)');
  ok(!pg.errs.length, 'mech: 0 errores de consola ' + pg.errs.slice(0, 3).join(' | '));
}

async function minis(b) {
  console.log('--- minijefes del Panal: Avispón Real (3:30) y Reina Joven (5:30)');
  const pg = await page(b); await pg.evaluate(SIM);
  const r = await pg.evaluate(() => {
    const M = G.Minis, P = G.Panal, o = {};
    o.audit = M.teleAudit(true).filter(a => a.mini === 'avispon' || a.mini === 'reina_joven').map(a => [a.mini, a.atk, a.ms, a.need, a.dmg, a.ok]);
    o.ready = G.B.minis.panal.ready; o.slots = [G.B.minis.panal.slot1.id, G.B.minis.panal.slot2.id, G.B.minis.panal.slot1.at, G.B.minis.panal.slot2.at];
    o.ids = [M.IDS.length, M.IDS_PANAL.join()];
    ['avispon', 'reina_joven'].forEach(id => {
      __clear(720, 405); const e = M.spawn(id, [900, 405]); e.spawnT = 0; e.hp = e.maxHp; const De = e.D;
      o[id] = { fly: e.fly, mat: e.mat, weak: M.weakness(e), hp: e.maxHp, part: [e.part.name, Math.round(e.part.max / e.maxHp * 100)], bag: De.bag };
      // cada ataque del bag: se ejecuta sin errores y mide su telegrafía real
      const meas = {};
      Object.keys(M.ATK[id]).forEach(n => {
        __clear(720, 405); const q = M.spawn(id, [980, 405]); q.spawnT = 0; q.atkT = 0; if (n === 'ala') { q.part.hp = 0; M.breakPart(q); q.st = 'move'; q.expT = 0; q.recDur = 0; }
        q.atkT = 1e9; M.force(q, n); q.atkT = 0; let tmax = 0, started = null, ended = null, tl = 0; G.god = true; __sim(6000, t => { if (q.st === 'tele') { if (started == null) started = t; tl = t - started; } else if (started != null && ended == null) { ended = t; return false; } });
        meas[n] = Math.round(tl); G.enemies.length = 0; M.reset();
      });
      o[id].meas = meas;
    });
    // botín garantizado y Insignia
    o.loot = ['avispon', 'reina_joven'].map(id => [id, JSON.stringify(G.Loot.GUARANTEED['mini_' + id]), JSON.stringify(G.Loot.MINI_PART_BONUS['mini_' + id])]);
    // parte rompible: Aguijón / Abdomen -> derribo, botín extra, Insignia
    ['avispon', 'reina_joven'].forEach(id => {
      __clear(720, 405); const e = M.spawn(id, [900, 405]); e.spawnT = 0; G.gems.length = 0; let n = 0; while (!e.part.broken && n++ < 200) G.Combat.deal(e, 60, { tag: 'steel', ang: 0, sx: e.x + 50, sy: e.y });
      o[id].broke = [e.part.broken, e.expT > 0, G.gems.filter(g => g.kind === 'insignia').length, Math.round((1 - e.hp / e.maxHp) * 100)];
    });
    // humo: seda al Avispón 1 s (-40 %)
    __clear(720, 405); const av = M.spawn('avispon', [900, 405]); av.spawnT = 0; P.smoke(av.x, av.y); __sim(100); o.avSed = [+av.spdMul.toFixed(2), av.sed === true]; __sim(2600); o.avSedEnd = av.spdMul;
    // director: slot 1 a 3:30, slot 2 a 5:30 (nunca dos a la vez)
    __clear(720, 405); G.Waves.reset(); G.runT = 209000; G.time = 209000; let t0 = null; const seen = []; G.god = true;
    for (let i = 0; i < 2400; i++) { G.time += 16.7; G.runT += 16.7; G.Player.update(G.player, 16.7); G.Waves.update(16.7); G.Enemies.update(16.7); const mm = G.Enemies.minis(); if (mm.length && seen.indexOf(mm[0].mid) < 0) seen.push(mm[0].mid + '@' + Math.round(G.runT / 1000)); }
    o.dir = seen;
    return o;
  });
  console.log(JSON.stringify(r));
  ok(r.audit.length >= 8 && r.audit.every(a => a[5]), 'auditoría de telegrafías de los 2 minijefes (' + r.audit.map(a => a[1] + ' ' + a[2] + '/' + a[3]).join(', ') + ')');
  ok(r.ready && r.slots.join() === 'avispon,reina_joven,210000,330000' && r.ids[0] === 8 && r.ids[1] === 'avispon,reina_joven', 'G.B.minis.panal activo: slot 1 Avispón Real a 3:30 y slot 2 Reina Joven a 5:30; las 8 Insignias del logro no cambian');
  ok(r.avispon.fly && r.reina_joven.fly && r.avispon.mat === 'insecto' && r.avispon.weak.weak.indexOf('fire') >= 0 && r.avispon.weak.weak.indexOf('ice') >= 0 && r.avispon.weak.resist.indexOf('poison') >= 0, 'voladores, material Insecto: débiles a Fuego e Hielo, resisten Veneno');
  ok(Math.abs(r.avispon.meas.picado - 650) < 60 && Math.abs(r.avispon.meas.zumbido - 600) < 60 && Math.abs(r.avispon.meas.estocada - 900) < 60, `Avispón: Picado ${r.avispon.meas.picado} (650), Zumbido ${r.avispon.meas.zumbido} (600), Estocada ${r.avispon.meas.estocada} (900) ms`);
  ok(r.avispon.broke[0] && r.avispon.broke[1] && r.avispon.broke[2] === 1, 'Avispón: el Aguijón se rompe, derribo con ventana y suelta su Insignia (' + r.avispon.broke + ')');
  ok(r.reina_joven.broke[0] && r.reina_joven.broke[1] && r.reina_joven.broke[2] === 1, 'Reina Joven: el Abdomen se rompe, derribo y Insignia (' + r.reina_joven.broke + ')');
  ok(r.loot[0][1].indexOf('"spine":3') > 0 && r.loot[1][1].indexOf('"frost":3') > 0, 'botín: Avispón Púa 3 + bonus ' + r.loot[0][2] + '; Reina Joven Escarcha 3 + bonus ' + r.loot[1][2]);
  ok(r.avSed[0] === 0.6 && r.avSed[1] && r.avSedEnd === 1, 'el humo seda al Avispón 1 s (-40 % de velocidad)');
  ok(r.dir.length >= 1 && /^avispon@2/.test(r.dir[0]), 'director: ' + r.dir.join(', '));
  ok(!pg.errs.length, 'minis: 0 errores de consola ' + pg.errs.slice(0, 3).join(' | '));
}

async function data(b) {
  console.log('--- datos (B.6), Portal bloqueado y flujo de arranque');
  const pg = await page(b);
  const r = await pg.evaluate(() => {
    const f = G.B.fam.panal, o = {}, U = f.use, tiers = [0, 0, 0, 0], caps = [0, 0, 0, 0];
    Object.keys(U).forEach(k => { tiers[U[k].tier] += U[k].w; caps[U[k].tier] += U[k].maxAlive; });
    o.tiers = tiers; o.caps = caps; o.n = Object.keys(U).length; o.ready = f.ready; o.urlOk = f.urlOk;
    o.rows = Object.keys(U).map(k => [k, U[k].name, U[k].tier, U[k].from / 1000, U[k].w, U[k].cost, U[k].maxAlive, U[k].mat]);
    o.packs = f.packs.map(p => p.id);
    o.drops = [G.Loot.DROPS.honeyslug, G.Loot.DROPS.pollinator];
    o.famOf = !!G.B.famOf(); o.matOn = G.B.mat.on; o.light = Object.keys(f.light);
    o.q = G.Quests.def('pollinators') && G.Quests.feasible(G.Quests.def('pollinators'), { pastor: 1, karceron: 1, letea: 1, yarlak: 1 }); o.q0 = G.Quests.feasible(G.Quests.def('pollinators'), { pastor: 1, karceron: 1, letea: 1 });   // P6: el Panal se abre con Yarlak
    o.qBiomes = G.Quests.biomesOf(G.Quests.def('pollinators'));
    o.biomeBoss = G.Boss.BIOME_BOSS.panal;
    // el director del Panal solo lista roles de su familia con la masa por tier
    o.allow = Object.keys(G.B.enemy).filter(k => G.B.has(k) && !G.B.enemy[k].elite && k !== 'boss');
    o.matTable = ['insecto', 'cera', 'miel'].map(m => G.B.mat.table[m].join());
    return o;
  });
  console.log(JSON.stringify(r));
  ok(r.n === 9 && r.tiers.join() === '55,44,29,25', 'nueve tipos; suma de w por tier 55 / 44 / 29 / 25 (' + r.tiers + ')');
  ok(r.caps.join() === '40,18,16,8', 'topes por tier 40 / 18 / 16 / 8 (' + r.caps + ')');
  const exp = { worm: [0, 0, 55, 1, 40], archer: [1, 45, 28, 3, 12], bomb: [1, 90, 16, 2, 6], boar: [2, 120, 10, 5, 6], shield: [2, 165, 10, 5, 6], honeyslug: [2, 210, 9, 5, 4], pollinator: [3, 270, 8, 6, 2], blinker: [3, 315, 9, 6, 4], warlock: [3, 405, 8, 8, 2] };
  ok(r.rows.every(x => { const e = exp[x[0]]; return e && x[2] === e[0] && x[3] === e[1] && x[4] === e[2] && x[5] === e[3] && x[6] === e[4]; }), 'tier / entrada (0:00 ... 6:45) / peso / coste / tope de cada tipo = tabla B.6');
  ok(r.rows.find(x => x[0] === 'pollinator')[7] === 'insecto' && r.rows.find(x => x[0] === 'shield')[7] === 'cera' && r.rows.find(x => x[0] === 'bomb')[7] === 'miel' && r.rows.find(x => x[0] === 'honeyslug')[7] === 'miel', 'materiales: Insecto / Cera (Guardia) / Miel (Larva, Babosa)');
  ok(r.ready && r.urlOk && r.famOf && r.matOn, 'ready:true desde la P6 (el Panal se abre con Yarlak): familia y materiales activos');
  ok(r.packs.join() === 'falange,abejorros,flores,avispero', 'packs: Falange, Abejorros, Campo de flores, Avispero');
  ok(r.drops[0][0] === 'frost' && r.drops[1][0] === 'spine', 'drops: Babosa Escarcha, Polinizador Púa');
  ok(r.q === true && r.q0 === false && r.qBiomes.indexOf('panal') >= 0, 'encargo "Apaga a los Polinizadores": el Tablón lo ofrece con Yarlak vencido (P6) y no sin él');
  ok(r.light.indexOf('pollinator') >= 0 && r.biomeBoss === 'melaria', 'light del Panal y Boss.BIOME_BOSS.panal = melaria');
  ok(r.allow.sort().join() === Object.keys(r.rows.reduce((m, x) => (m[x[0]] = 1, m), {})).sort().join(), 'el director solo conoce los 9 roles de la familia (' + r.allow + ')');
  ok(r.matTable[0] === '1.25,1.25,1,0.75,1,1' && r.matTable[1] === '1.25,1,0.75,1,1,1' && r.matTable[2] === '1,1.25,1,0.75,1,1', 'tabla de materiales A.8 (Insecto, Cera, Miel)');
  // arranque: sin ?biome=panal el destino cae al bosque aunque el guardado diga panal
  const p2 = await b.newPage({ viewport: { width: 960, height: 540 } }); p2.errs = []; p2.on('pageerror', e => p2.errs.push(e.message));
  await p2.goto(`${base}/index.html?reset=1&nosw=1`); await p2.waitForTimeout(400);
  const bi = await p2.evaluate(() => { G.Save.data.biome = 'panal'; G.Save.data.bossKills = { pastor: 1, karceron: 1, letea: 1, yarlak: 1 }; G.startGame(); return [G.curBiome, G.Panal.on]; });
  ok(bi[0] === 'panal' && bi[1], 'P6: con Yarlak vencido el destino del guardado (panal) se abre sin ?biome= (' + bi + ')');
  const bi0 = await p2.evaluate(() => { G.Save.data.biome = 'panal'; G.Save.data.bossKills = { pastor: 1, karceron: 1, letea: 1 }; G.startGame(); return [G.curBiome, G.Panal.on]; });
  ok(bi0[0] === 'tundra' && !bi0[1], 'sin Yarlak vencido el Panal sigue cerrado aunque el guardado lo pida (' + bi0 + ')');
  // Portal: chip '? PANAL' bloqueado
  const p3 = await b.newPage({ viewport: { width: 960, height: 540 } }); p3.errs = []; p3.on('pageerror', e => p3.errs.push(e.message)); p3.on('console', m => { if (m.type() === 'error') p3.errs.push(m.text()); });
  await p3.goto(`${base}/index.html?reset=1&nosw=1&len=7`); await p3.waitForTimeout(500);
  await p3.evaluate(() => { G.Save.data.bossKills = { pastor: 1, karceron: 1, letea: 1, yarlak: 1 }; G.Save.data.biome = 'tundra'; G.Save.save(); });
  await p3.keyboard.press('Tab'); await p3.waitForTimeout(900); await p3.keyboard.press('KeyE'); await p3.waitForTimeout(700);
  await p3.mouse.click(650 + 4 * 48 + 23, 357); await p3.waitForTimeout(400);
  const bio = await p3.evaluate(() => G.Save.data.biome); ok(bio === 'panal', 'P6: el chip PANAL se elige con Yarlak vencido (' + bio + ')');
  await p3.screenshot({ path: process.env.SHOT || '/tmp/p5_portal.png' });
  await p3.mouse.click(650 + 3 * 48 + 23, 357); await p3.waitForTimeout(300); ok((await p3.evaluate(() => G.Save.data.biome)) === 'tundra', 'el chip TUNDRA (4.º de 5, 56 px) sigue eligiéndose');
  ok(!pg.errs.length && !p2.errs.length && !p3.errs.length, 'datos: 0 errores de consola ' + [].concat(pg.errs, p2.errs, p3.errs).slice(0, 3).join(' | '));
}

async function flow(b) {
  console.log('--- flujo: expedición en el Panal sin jefa y táctil 844x390');
  const c2 = await b.newContext({ viewport: { width: 960, height: 540 } }), p2 = await c2.newPage(); p2.errs = [];
  p2.on('console', m => { if (m.type() === 'error') p2.errs.push(m.text()); }); p2.on('pageerror', e => p2.errs.push('PAGEERR ' + e.message));
  await p2.goto(`${base}/index.html?reset=1&dbg=1&god=1&len=7&speed=20&biome=panal&nobos=1&nosw=1`); await p2.waitForTimeout(500);
  await p2.evaluate(botSrc); await p2.evaluate(() => { G.startGame(); }); await p2.evaluate(() => window.installBalanceBot({}));
  let mx = { honey: 0, smoke: 0, pud: 0 };
  for (let i = 0; i < 400; i++) { await p2.waitForTimeout(500); const s = await p2.evaluate(() => ({ s: G.state, h: G.Panal.honeyCount(), c: G.Panal.clouds.length, p: G.Panal.puddles.length })); mx.honey = Math.max(mx.honey, s.h); mx.smoke = Math.max(mx.smoke, s.c); mx.pud = Math.max(mx.pud, s.p); if (s.s === 'gameover') break; }
  await p2.waitForTimeout(800);
  const res = await p2.evaluate(() => ({ s: G.state, won: G.won, t: Math.round(G.runT / 1000), total: G.Loot.summary && G.Loot.summary.total, boss: !!G.Boss.e, biome: G.curBiome }));
  console.log(JSON.stringify(res), JSON.stringify(mx));
  ok(res.s === 'gameover' && res.won && res.t >= 7 * 60 && !res.boss && res.total > 0 && res.biome === 'panal', 'la prueba sin jefa termina a los 7:00 con botín (' + JSON.stringify(res) + ')');
  ok(mx.honey > 0 && mx.smoke > 0, 'durante la run hubo celdas de miel (' + mx.honey + ') y humo (' + mx.smoke + ')');
  await p2.keyboard.press('KeyB'); await p2.waitForTimeout(1200);
  ok((await p2.evaluate(() => G.state)) === 'aldea', 'botín -> aldea');
  ok(!p2.errs.length, 'flujo Panal: 0 errores de consola ' + p2.errs.slice(0, 3).join(' | '));
  await c2.close();
  // táctil 844x390 con joystick (CDP)
  const ctx = await b.newContext({ viewport: { width: 844, height: 390 }, hasTouch: true, isMobile: true, deviceScaleFactor: 2 }), pt = await ctx.newPage(); pt.errs = [];
  pt.on('console', m => { if (m.type() === 'error') pt.errs.push(m.text()); }); pt.on('pageerror', e => pt.errs.push('PAGEERR ' + e.message));
  await pt.goto(`${base}/index.html?reset=1&dbg=1&god=1&biome=panal&nobos=1&env=0&t=240&hand=spark:3,ember:2,shard:2,dart:2&nosw=1`); await pt.waitForTimeout(500);
  await pt.evaluate(() => { G.startGame(); }); await pt.waitForTimeout(1500);
  const cdp = await ctx.newCDPSession(pt), x0 = await pt.evaluate(() => [G.player.x, G.player.y]);
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: 120, y: 260, id: 1 }] });
  for (let k = 1; k <= 12; k++) { await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: 120 + k * 5, y: 260 - k * 2, id: 1 }] }); await pt.waitForTimeout(100); }
  const x1 = await pt.evaluate(() => [G.player.x, G.player.y]); await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  const fps = await pt.evaluate(() => new Promise(res => { let n = 0, t0 = performance.now(); function f() { n++; if (performance.now() - t0 > 1500) res(n / ((performance.now() - t0) / 1000)); else requestAnimationFrame(f); } requestAnimationFrame(f); }));
  console.log('táctil: movió', Math.round(Math.hypot(x1[0] - x0[0], x1[1] - x0[1])), 'px, fps', Math.round(fps));
  ok(Math.hypot(x1[0] - x0[0], x1[1] - x0[1]) > 60, 'el joystick táctil mueve al jugador en el Panal');
  await pt.screenshot({ path: process.env.SHOT2 || '/tmp/p5_touch.png' });
  ok(!pt.errs.length, 'táctil: 0 errores de consola ' + pt.errs.slice(0, 3).join(' | '));
  await ctx.close();
}

(async () => {
  const b = await launch();
  if (mode === 'arena' || mode === 'all') await arena(b);
  if (mode === 'honey' || mode === 'all') await honey(b);
  if (mode === 'cells' || mode === 'all') await cells(b);
  if (mode === 'smoke' || mode === 'all') await smoke(b);
  if (mode === 'tele' || mode === 'all') await tele(b);
  if (mode === 'mech' || mode === 'all') await mech(b);
  if (mode === 'minis' || mode === 'all') await minis(b);
  if (mode === 'data' || mode === 'all') await data(b);
  if (mode === 'flow' || mode === 'all') await flow(b);
  console.log(fails ? `RESULTADO: ${fails} FALLO(S)` : 'RESULTADO: TODO OK');
  await b.close(); process.exit(fails ? 1 : 0);
})();
