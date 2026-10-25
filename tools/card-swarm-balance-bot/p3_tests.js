// PRUEBAS P3 (Tundra: hielo, Frío, ventisca y familia; DESIGN-v5-biomas.md B.1, B.3, B.7, C.2).
// uso: node p3_tests.js ice|cold|tele|mech|data|flow|all [base]   (base por defecto http://localhost:8793)
//  ice : física del hielo (jugador: 95 % de la velocidad en 660 +-60 ms, derrape 86 +-8 px, cambio de sentido ~150 ms, retroceso con tope, nieve firme = movimiento actual; enemigos tau 300 ms;
//        cobertura de nieve firme <= 260 px; ?biome=bosque sin cambios)
//  cold: medidor de Frío (mano sin Fuego llena en 55-75 s; 3 Fuego <= +0,5 %/s; hoguera -10 %/s; Helado 70 %; Escarcha 100 %; platos / nodos; L.DUR.cold; contraste de telegrafías sobre la bruma >= 3:1)
//  tele: telegrafías de los 9 monstruos medidas en el juego contra G.B.tele y la regla del HIELO tele >= 250 + 220 + 1000 x salida / 190 (>= 400 ms los fuertes)
//  mech: mecánicas de cada monstruo (manada, embestida con derrape, placa del Yeti, picado, trampa, remolino, aura, flecha helada) y guardianes
//  data: tabla B.3 (tiers, pesos, costes, topes), packs, materiales, drops, director, ?biome=tundra sin jefe
//  flow: Portal ('? TUNDRA' bloqueada) y expedición completa en la Tundra sin jefe con el bot (aldea -> expedición -> botín -> aldea)
const { chromium } = require('/opt/node-tools/node_modules/playwright');
const fs = require('fs');
const mode = process.argv[2] || 'all', base = process.argv[3] || 'http://localhost:8793';
const botSrc = fs.readFileSync(__dirname + '/bot_page.js', 'utf8');
let fails = 0; const ok = (c, msg) => { if (!c) fails++; console.log((c ? 'OK     ' : 'FALLO  ') + msg); };
const launch = () => chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--no-sandbox', '--autoplay-policy=no-user-gesture-required'] });
async function page(b, q, vp) {
  const pg = await b.newPage({ viewport: vp || { width: 960, height: 540 } }); pg.errs = [];
  pg.on('console', m => { if (m.type() === 'error') pg.errs.push(m.text()); }); pg.on('pageerror', e => pg.errs.push('PAGEERR ' + e.message + ' ' + (e.stack || '').split('\n').slice(1, 3).join('|')));
  await pg.goto(`${base}/index.html?reset=1&god=1&dbg=1&nobos=1&biome=tundra${q || ''}`); await pg.waitForTimeout(400);
  await pg.evaluate(() => { G.startGame(); });
  return pg;
}
// Todo corre dentro de la página: __sim(ms) avanza el mundo en pasos de 1000/60 sin el director (Waves.update no se llama)
const SIM = `
window.__sim = function (ms, cb) { var dt = 1000 / 60, t = 0; while (t < ms) { G.time += dt; G.Player.update(G.player, dt); G.Enemies.update(dt); G.Combat.update(dt); G.Tundra.update(dt); t += dt; if (cb && cb(t) === false) break; } return t; };
window.__clear = function (x, y) { G.enemies.length = 0; G.projectiles.length = 0; G.zones.length = 0; G.gems.length = 0; var p = G.player; p.x = x == null ? 720 : x; p.y = y == null ? 405 : y; p.hp = p.maxHp; p.hurtT = 0; p.kx = p.ky = 0; p.vx = p.vy = 0; p.slowT = 0; p.slowPct = 0; p.sf = G.Tundra.slipAt(p.x, p.y); p.dead = false; G.state = 'play'; G.input.joy = { active: false, id: null, ox: 0, oy: 0, x: 0, y: 0 }; G.cold.v = 0; G.cold.frozenT = 0; G.cold.immuneT = 0; G.Tundra.bz.off = true; G.Tundra.bz.gust = false; G.Tundra.bz.t = 0; };
window.__hold = function (x, y) { G.input.joy = { active: true, id: 1, ox: 0, oy: 0, x: x, y: y }; };
window.__free = function () { G.input.joy = { active: false, id: null, ox: 0, oy: 0, x: 0, y: 0 }; };
window.__mk = function (type, dx, dy, o) { var e = G.Enemies.spawn(type, G.player.x + dx, G.player.y + dy, Object.assign({ spawnT: 0 }, o || {})); e.sumT = 1e9; return e; };
window.__durs = function (e, ms, states) { var cur = null, t0 = 0, out = {}; __sim(ms, function (t) { if (e.dead) { if (cur && states.indexOf(cur) >= 0) (out[cur] = out[cur] || []).push(Math.round(t - t0)); cur = null; return false; } if (e.st !== cur) { if (cur && states.indexOf(cur) >= 0) (out[cur] = out[cur] || []).push(Math.round(t - t0)); cur = e.st; t0 = t; } }); return out; };
window.__hit = function (e, dmg, tag) { e.untarget = false; e.immune = false; return G.Combat.deal(e, dmg, { tag: tag || 'steel', ang: 0 }); };
window.__hand = function (ids) { var p = G.player; p.hand = [null, null, null, null, null]; ids.forEach(function (id, i) { p.hand[i] = { id: id, lvl: 1, cd: 0 }; }); G.Tundra.resetHand(); };
`;

async function ice(b) {
  console.log('--- hielo: física del jugador y de los enemigos (B.1.2)');
  const pg = await page(b, '&patch=1&softice=0'); await pg.evaluate(SIM);
  const r = await pg.evaluate(() => {
    const p = G.player, o = {}, dt = 1000 / 60, V = G.B.player.speed * G.Cards.mods.speed, T = G.Tundra;
    __clear(250, 110); p.sf = 1; G.god = false;
    __hold(1, 0); let t = 0, t95 = null; while (t < 1500) { G.time += dt; G.Player.update(p, dt); t += dt; if (t95 == null && p.vx >= 0.95 * V) t95 = t; }
    o.t95 = Math.round(t95); o.vmax = Math.round(p.vx);
    // cambio de sentido 190 -> -190: tiempo hasta cruzar cero
    __hold(-1, 0); t = 0; let tz = null; while (t < 1500) { G.time += dt; G.Player.update(p, dt); t += dt; if (tz == null && p.vx <= 0) tz = t; }
    o.tz = Math.round(tz);
    // derrape: vuelve a 190 a la derecha, suelta y mide el recorrido hasta pararse
    __clear(250, 110); p.sf = 1; __hold(1, 0); t = 0; while (t < 1500) { G.time += dt; G.Player.update(p, dt); t += dt; }
    __free(); const x0 = p.x; t = 0; while (t < 4000 && Math.abs(p.vx) > 0.5) { G.time += dt; G.Player.update(p, dt); t += dt; }
    o.drift = Math.round((p.x - x0) * 10) / 10; o.tstop = Math.round(t);
    // retroceso en hielo: parado, golpe desde la izquierda
    __clear(500, 110); p.sf = 1; let hp0 = p.hp; G.Player.hurt(p, 5, p.x - 30, p.y, {}); const xk = p.x; __sim(2000); o.kb = Math.round(p.x - xk); o.kbHit = p.hp < hp0;
    // retroceso + derrape: corriendo a 190 hacia la derecha y golpeado por detrás
    __clear(250, 110); p.sf = 1; __hold(1, 0); t = 0; while (t < 1500) { G.time += dt; G.Player.update(p, dt); t += dt; } __free(); const xr = p.x; G.Player.hurt(p, 5, p.x - 30, p.y, {}); __sim(3000); o.kbDrift = Math.round(p.x - xr);
    // nieve firme: arranque instantáneo y parada en seco (dentro de un parche de verdad)
    G.Tundra.setPatchR(110); __clear(720, 405); p.sf = 0; __hold(1, 0); G.time += dt; G.Player.update(p, dt); o.firmV1 = Math.round(p.vx); __free(); const xf = p.x; __sim(500); o.firmDrift = Math.round((p.x - xf) * 10) / 10;
    // transición: sf nunca cambia más de dt/120 por paso (120 ms)
    __clear(720 + 110 - 40, 405); p.sf = 0; __hold(1, 0); let mx = 0, last = p.sf, steps = 0; for (let i = 0; i < 60; i++) { G.time += dt; G.Player.update(p, dt); mx = Math.max(mx, Math.abs(p.sf - last)); last = p.sf; steps++; } o.dSf = +(mx * 120 / dt).toFixed(3); o.sfEnd = +p.sf.toFixed(2);
    // velocidad máxima y estados del Frío: Helado (70 %) y Escarcha
    G.Tundra.setPatchR(1); __clear(250, 110); p.sf = 1; G.cold.v = 75; __hold(1, 0); __sim(1800); o.helado = Math.round(p.vx);
    __clear(250, 110); p.sf = 1; G.cold.v = 10; G.cold.frozenT = 5000; __hold(1, 0); __sim(1800); o.frost = Math.round(p.vx);
    // crampones (Tree.fx) y Hielo suave: tau 140
    const fx0 = G.Tree.fx.crampones; G.Tree.fx.crampones = true; __clear(250, 110); p.sf = 1; __hold(1, 0); t = 0; t95 = null; while (t < 1500) { G.time += dt; G.Player.update(p, dt); t += dt; if (t95 == null && p.vx >= 0.95 * V) t95 = t; } o.cramp95 = Math.round(t95);
    __free(); const xc = p.x; __sim(3000); o.crampDrift = Math.round(p.x - xc); G.Tree.fx.crampones = fx0;
    // paredes: contra el borde la velocidad se anula
    __clear(60, 110); p.sf = 1; __hold(-1, 0); __sim(1000); o.wall = [Math.round(p.x), Math.round(p.vx)];
    // enemigos: tau generica 300 ms (95 % en ~900 ms) y parada en nieve firme
    G.Tundra.setPatchR(1); __clear(900, 110); p.sf = 1; const e = G.Enemies.spawn('worm', 300, 110, { spawnT: 0 }); e.sf = 1; let te = null; const spd = () => Math.hypot(e.vx, e.vy);
    __sim(3000, tt => { if (te == null && spd() >= 0.95 * e.spd) te = tt; }); o.enemy95 = Math.round(te); o.enemySpd = +(spd() / e.spd).toFixed(2);
    return o;
  });
  console.log(JSON.stringify(r));
  ok(Math.abs(r.t95 - 660) <= 60 && r.vmax === 190, `95 % de 190 px/s en ${r.t95} ms (660 +-60), vmax ${r.vmax}`);
  ok(Math.abs(r.drift - 86) <= 8, `derrape sin entrada desde 190 px/s = ${r.drift} px (86 +-8), parada en ${r.tstop} ms`);
  ok(Math.abs(r.tz - 150) <= 20, `cambio de sentido 190 -> -190: cruza cero en ${r.tz} ms (~150)`);
  ok(r.kbHit && r.kb >= 85 && r.kb <= 101, `retroceso en hielo ${r.kb} px (x1,6 con tope de 100)`);
  ok(r.kbDrift <= 108, `retroceso + derrape corriendo = ${r.kbDrift} px (nunca pasa de ~100)`);
  ok(r.firmV1 === 190 && r.firmDrift < 1, `nieve firme: arranque instantáneo (${r.firmV1}) y parada en seco (${r.firmDrift} px)`);
  ok(r.dSf <= 1.01 && r.sfEnd > 0.9, `transición de superficie en 120 ms (máx. ${r.dSf} x el paso permitido, sf final ${r.sfEnd})`);
  ok(r.helado >= 160 && r.helado <= 163 && r.frost >= 122 && r.frost <= 125, `Helado (70 %) -15 % de velocidad (${r.helado}) y Escarcha -35 % (${r.frost})`);
  ok(Math.abs(r.cramp95 - 420) <= 60 && r.crampDrift >= 55 && r.crampDrift <= 63, `Crampones: 95 % en ${r.cramp95} ms (tau 140: ~420) y derrape ${r.crampDrift} px (59)`);
  ok(r.wall[1] === 0, 'contra la pared la velocidad se anula ' + r.wall.join('/'));
  ok(r.enemy95 >= 780 && r.enemy95 <= 1000 && r.enemySpd > 0.95, `enemigos terrestres: tau 300 ms, 95 % en ${r.enemy95} ms (~900)`);
  // cobertura de nieve firme (B.1.1)
  const cov = await pg.evaluate(() => [110, 90, 70].map(R => G.Tundra.iceCoverage(R, 6)));
  console.log('cobertura', JSON.stringify(cov));
  ok(cov.every(c => c.max <= 260), 'iceCoverage() <= 260 px con parches de r 110 / 90 / 70: ' + cov.map(c => c.max).join(' / '));
  ok(!pg.errs.length, 'ice: 0 errores ' + pg.errs.slice(0, 3).join(' | '));
  await pg.close();
  // regresión: en el Bosque nada cambia (movimiento instantáneo, sin derrape, sin Frío)
  const pb = await b.newPage({ viewport: { width: 960, height: 540 } }); pb.errs = [];
  pb.on('console', m => { if (m.type() === 'error') pb.errs.push(m.text()); }); pb.on('pageerror', e => pb.errs.push('PAGEERR ' + e.message));
  await pb.goto(`${base}/index.html?reset=1&god=1&biome=bosque`); await pb.waitForTimeout(400); await pb.evaluate(() => G.startGame()); await pb.evaluate(SIM);
  const rb = await pb.evaluate(() => { const p = G.player, dt = 1000 / 60; __clear(300, 300); G.input.joy = { active: true, id: 1, ox: 0, oy: 0, x: 1, y: 0 }; G.Player.update(p, dt); const v1 = +(p.x - 300).toFixed(3); G.input.joy = { active: false }; const x0 = p.x; for (let i = 0; i < 30; i++) G.Player.update(p, dt); return { on: G.Tundra.on, step: v1, after: +(p.x - x0).toFixed(3), cold: G.cold.v, fe: !!G.B.famOf() }; });
  ok(!rb.on && Math.abs(rb.step - 190 / 60) < 0.01 && rb.after === 0 && rb.cold === 0, 'Bosque: movimiento instantáneo y sin derrape ni Frío ' + JSON.stringify(rb));
  ok(!pb.errs.length, 'bosque: 0 errores'); await pb.close();
}

async function cold(b) {
  console.log('--- Frío (B.1.4) y ventisca (B.1.3)');
  const pg = await page(b, '&patch=1'); await pg.evaluate(SIM);
  const r = await pg.evaluate(() => {
    const p = G.player, o = {}, T = G.Tundra, C = G.cold;
    // mano sin Fuego / Sangre / Hielo: cartas de Rayo / Acero / Veneno
    __clear(250, 110); p.sf = 1; __hand(['dart', 'zap', 'spark'].map(x => x === 'spark' ? 'dart' : x)); let t0 = G.time; __sim(120000, () => { if (C.v >= 99.9 || C.frozenT > 0) return false; }); o.fillNoFire = Math.round((G.time - t0) / 100) / 10; __sim(400); o.frozenAt100 = C.frozenT > 0 || C.frozenN > 0;
    // 3 cartas de Fuego: tasa = 1,5 - 3 x 0,35 = +0,45 %/s
    __clear(250, 110); p.sf = 1; __hand(['spark', 'ember', 'ring']); G.time += 300; __sim(10000); o.rate3fire = +C.rate.toFixed(3); o.v10 = +C.v.toFixed(2);
    // Sangre / Hielo
    __clear(250, 110); p.sf = 1; __hand(['fang', 'shard']); G.time += 300; __sim(500); o.rateBI = +C.rate.toFixed(3);
    // máx. 3 cartas por etiqueta: con 5 de Fuego cuenta 3
    __clear(250, 110); p.sf = 1; __hand(['spark', 'ember', 'ring', 'spark', 'ember']); G.time += 300; __sim(500); o.rate5fire = +C.rate.toFixed(3);
    // hoguera: -10 %/s dentro del radio de 64 px
    __clear(250, 110); p.sf = 1; __hand(['dart']); p.x = T.fires[0].x + 30; p.y = T.fires[0].y; p.sf = 0; C.v = 50; G.time += 300; __sim(2000); o.fire = +C.rate.toFixed(2); o.vFire = +C.v.toFixed(1); o.hearth = C.hearth;
    p.x = T.fires[0].x + 90; p.y = T.fires[0].y; __sim(500); o.outHearth = C.hearth;
    // nieve firme fuera de hoguera: baja lentamente
    G.Tundra.setPatchR(110); __clear(720, 405); p.x = 720 + 80; p.sf = 0; C.v = 50; G.time += 300; __hand(['dart']); __sim(1000); o.firmRate = +C.rate.toFixed(2); G.Tundra.setPatchR(1);
    // baja con Fuego: -0,8 por baja (máx. -4/s)
    __clear(250, 110); p.sf = 1; __hand(['dart']); C.v = 50; C.kT = 0; for (let i = 0; i < 10; i++) T.fireKill(); o.fireKills = +(50 - C.v).toFixed(1);
    // 70 %: aviso y Helado; 100 %: Escarcha (baja a 55 %, 5 s de lentitud, 8 s de inmunidad)
    __clear(250, 110); p.sf = 1; __hand(['dart']); C.v = 69.9; __sim(1000); o.warned = C.warned; o.state70 = T.state();
    C.v = 99.9; __sim(300); o.frozen = [Math.round(C.v), Math.round(C.frozenT), Math.round(C.immuneT)];
    const v0 = C.v; __sim(3000); o.noFill = +(C.v - v0).toFixed(2); __sim(5000); o.after8 = [Math.round(C.frozenT), Math.round(C.immuneT)]; __sim(3000); o.fills = C.v > v0;
    // Escarcha: las cartas recargan 25 % más lento
    __clear(250, 110); p.sf = 1; __hand(['spark']); const sl = p.hand[0]; function cdDrop(fr) { C.frozenT = fr ? 5000 : 0; sl.cd = 5000; const c0 = sl.cd; G.enemies.length = 0; G.Weapons.update(500); return c0 - sl.cd; } const a = cdDrop(false), b2 = cdDrop(true); o.cdRatio = +(b2 / a).toFixed(2); C.frozenT = 0;
    // L.DUR.cold
    o.dur = [7, 9, 10].map(m => G.Loot.dur(m).cold);
    // ganancia por duración: Larga (+10 %) y Rápida (-10 %)
    ['rapida', 'larga'].forEach(k => { G.setLen(k === 'rapida' ? 7 : 10); __clear(250, 110); p.sf = 1; __hand(['dart']); G.time += 300; __sim(600); o['rate_' + k] = +C.rate.toFixed(3); }); G.setLen(9);
    // platos / nodos: Caldo de brasa -35 % de ganancia (runBuff.fx.cold), Abrigo de escarcha -30 %, Brasa en el pecho (Fuego -0,5), cacería x0,8, jefe pasa a 20 %
    G.runBuff = { fx: { cold: 0.35 } }; __clear(250, 110); p.sf = 1; __hand(['dart']); G.time += 300; __sim(600); o.caldo = +C.rate.toFixed(3); G.runBuff = { fx: {} };
    G.Tree.fx.abrigo = true; __clear(250, 110); p.sf = 1; __hand(['dart']); G.time += 300; __sim(600); o.abrigo = +C.rate.toFixed(3); G.Tree.fx.abrigo = false;
    G.Tree.fx.brasaPecho = true; __clear(250, 110); p.sf = 1; __hand(['spark']); G.time += 300; __sim(600); o.brasa = +C.rate.toFixed(3); G.Tree.fx.brasaPecho = false;
    G.mode = 'hunt'; __clear(250, 110); p.sf = 1; __hand(['dart']); G.time += 300; __sim(600); o.hunt = +C.rate.toFixed(3); G.mode = 'run';
    T.onBoss(); o.boss = C.v;
    // golpes de Frío: +6 flecha, +8 picado; inmune durante la inmunidad
    __clear(250, 110); p.sf = 1; __hand(['dart']); C.v = 10; T.coldAdd(6); o.add6 = +(C.v - 10).toFixed(2); C.immuneT = 1000; T.coldAdd(6); o.immuneAdd = +(C.v - 10).toFixed(2);
    return o;
  });
  console.log(JSON.stringify(r));
  ok(r.fillNoFire >= 55 && r.fillNoFire <= 75, `mano sin Fuego/Sangre/Hielo llena en ${r.fillNoFire} s (55-75) y dispara la Escarcha: ${r.frozenAt100}`);
  ok(r.rate3fire <= 0.5 && r.rate3fire > 0.4, `3 cartas de Fuego: ${r.rate3fire} %/s (<= +0,5), tras 10 s ${r.v10} %`);
  ok(Math.abs(r.rateBI - (1.5 - 0.2 - 0.15)) < 0.02 && Math.abs(r.rate5fire - 0.45) < 0.02, `Sangre -0,20 + Hielo -0,15 (${r.rateBI}) y máx. 3 cartas por etiqueta (5 Fuego = ${r.rate5fire})`);
  ok(Math.abs(r.fire + 10) < 0.8 && r.hearth && r.vFire < 35 && !r.outHearth, `hoguera: ${r.fire} %/s dentro (-10), 50 -> ${r.vFire} en 2 s; fuera de ella no calienta`);
  ok(r.firmRate < -1, `nieve firme fuera de hoguera: ${r.firmRate} %/s (baja)`);
  ok(Math.abs(r.fireKills - 4) < 0.01, `bajas con Fuego: -0,8 c/u con tope de -4 en 1 s (${r.fireKills})`);
  ok(r.warned && r.state70 === 'helado', 'a 70 %: aviso (cold_warn) y estado Helado');
  ok(r.frozen[0] === 55 && r.frozen[1] > 4500 && r.frozen[2] > 7500, `100 %: Escarcha, el medidor baja a 55 % y hay 5 s de lentitud / 8 s de inmunidad ${r.frozen.join('/')}`);
  ok(r.noFill <= 0.01 && r.after8[0] === 0 && r.after8[1] === 0 && r.fills, `durante la inmunidad no se rellena (${r.noFill}); después sí`);
  ok(r.cdRatio > 0.72 && r.cdRatio < 0.78, `Escarcha: las cartas recargan 25 % más lento (ratio ${r.cdRatio})`);
  ok(r.dur.join() === '0.9,1,1.1', 'L.DUR.cold = 0,90 / 1,00 / 1,10: ' + r.dur.join('/'));
  ok(Math.abs(r.rate_rapida - 1.35) < 0.02 && Math.abs(r.rate_larga - 1.65) < 0.02, `ganancia x duración: Rápida ${r.rate_rapida}, Larga ${r.rate_larga} (1,35 / 1,65)`);
  ok(Math.abs(r.caldo - 0.975) < 0.02 && Math.abs(r.abrigo - 1.05) < 0.02 && Math.abs(r.brasa - (1.5 - 0.5)) < 0.02 && Math.abs(r.hunt - 1.2) < 0.02, `Caldo -35 % (${r.caldo}), Abrigo -30 % (${r.abrigo}), Brasa en el pecho (${r.brasa}), cacería x0,8 (${r.hunt})`);
  ok(r.boss === 20 && Math.abs(r.add6 - 6) < 0.01 && r.immuneAdd === r.add6, `jefe: Frío a 20 %; golpes de Frío +6 (${r.add6}) y no suben con la inmunidad`);
  // contraste del contorno de telegrafías sobre la bruma máxima (>= 3:1)
  const ct = await pg.evaluate(() => {
    function lum(c) { const f = v => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); }; return 0.2126 * f(c[0]) + 0.7152 * f(c[1]) + 0.0722 * f(c[2]); }
    const ice = [42, 79, 138], haze = [225, 238, 255], A = 0.6;   // hielo negro + bruma blanca al maximo (desesperado 0,6)
    const bg = ice.map((v, i) => v * (1 - A) + haze[i] * A), ol = [8, 4, 14], oa = 0.7, oc = bg.map((v, i) => v * (1 - oa) + ol[i] * oa);   // contorno oscuro de las telegrafias (alpha 0,7)
    const L1 = lum(bg), L2 = lum(oc); return +((Math.max(L1, L2) + 0.05) / (Math.min(L1, L2) + 0.05)).toFixed(2);
  });
  ok(ct >= 3, `contraste del contorno de telegrafías sobre la bruma máxima = ${ct}:1 (>= 3:1)`);
  // píxeles reales: dibujar una telegrafía (disco rojo con contorno) sobre la bruma de Alta y medir el contraste
  const px = await pg.evaluate(() => {
    const c = document.createElement('canvas'); c.width = 960; c.height = 540; const g = c.getContext('2d');
    g.fillStyle = '#2a4f8a'; g.fillRect(0, 0, 960, 540); G.Q.level = 'alta'; G.Tundra.bz.a = 0.6; const sv = G.cam.x, sy = G.cam.y; G.cam.x = 0; G.cam.y = 0; G.player.x = 100; G.player.y = 100; G.Tundra.drawHaze(g);
    const pre = g.getImageData(850, 450, 1, 1).data; // fondo con bruma
    g.save(); g.strokeStyle = 'rgba(8,4,14,0.7)'; g.lineWidth = 8; g.beginPath(); g.arc(850, 450, 30, 0, 6.283); g.stroke(); g.restore();
    const ring = g.getImageData(850 + 30, 450, 1, 1).data; G.cam.x = sv; G.cam.y = sy;
    function lum(c) { const f = v => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); }; return 0.2126 * f(c[0]) + 0.7152 * f(c[1]) + 0.0722 * f(c[2]); }
    const a = lum(pre), b2 = lum(ring); return +((Math.max(a, b2) + 0.05) / (Math.min(a, b2) + 0.05)).toFixed(2);
  });
  ok(px >= 3, `contraste medido en píxeles (contorno sobre la bruma de Alta al 0,6) = ${px}:1`);
  ok(!pg.errs.length, 'cold: 0 errores ' + pg.errs.slice(0, 3).join(' | '));
  await pg.close();
}

async function tele(b) {
  console.log('--- telegrafías de la Tundra (regla del hielo)');
  const pg = await page(b, '&patch=1'); await pg.evaluate(SIM);
  const r = await pg.evaluate(() => {
    const out = {};
    function run(key, type, dx, dy, st, ms, prep) { __clear(); G.Tundra.bz.off = true; const e = __mk(type, dx, dy); e.shootT = 0; e.atkT = 0; e.bashT = 0; e.cdT = 0; if (prep) prep(e); const d = __durs(e, ms || 4000, [st]); out[key] = (d[st] || []).slice(0, 2); }
    run('hunter', 'archer', 230, 0, 'aim', 3500);
    run('wolf', 'frostwolf', 200, 0, 'howl', 5000);
    run('bear', 'boar', 230, 0, 'wind', 4000);
    run('yeti', 'shield', 55, 0, 'wind', 3500, e => { e.bashT = 0; });
    run('bat', 'moth', 230, 0, 'aim', 4000);
    __clear(); { const e = __mk('sower', 90, 0); const d = __durs(e, 2500, ['tele']); out.stalag = d.tele || []; }
    run('spiritFade', 'blinker', 200, 0, 'fade', 4500); run('spiritSlash', 'blinker', 200, 0, 'slash', 5500);
    run('shaman', 'warlock', 200, 0, 'cast', 3500, e => { e.sumT = 0; });
    return out;
  });
  const audit = await pg.evaluate(() => G.B.teleAudit());
  const MAP = { hunter: 'hunter', wolf: 'wolf', bear: 'bear', yeti: 'yeti', bat: 'bat', stalag: 'stalag', spiritFade: 'spirit', spiritSlash: 'spirit', shaman: 'shaman' };
  let bad = 0;
  for (const k in r) {
    const meas = r[k][0], t = audit.find(a => a.id === MAP[k]), exp = k === 'spiritFade' ? 600 : k === 'spiritSlash' ? 350 : t.ms;
    const okm = meas != null && Math.abs(meas - exp) <= 40, tot = k === 'spiritFade' ? 600 + 350 : exp;
    const okr = t.ok && (k !== 'spiritFade' || tot >= t.need);
    if (!okm || !okr) bad++;
    console.log(`${k.padEnd(12)} medido ${String(meas).padStart(5)} ms (esperado ${exp})  salida ${String(t.exit).padStart(3)} px  regla del hielo ${String(t.need).padStart(4)} ms  ${okm && okr ? 'OK' : 'FALLA'}`);
  }
  ok(bad === 0, 'las 9 telegrafías miden lo que dice la tabla y cumplen tele >= 250 + 220 + 1000 x salida / 190');
  const bad2 = audit.filter(a => !a.ok); ok(!bad2.length, 'G.B.teleAudit() sin fallos en todas las entradas (P1-P3): ' + bad2.map(a => a.id).join(','));
  const need = audit.filter(a => ['hunter', 'wolf', 'bear', 'yeti', 'bat', 'stalag', 'spirit'].indexOf(a.id) >= 0).map(a => a.id + ':' + a.ms + '>=' + a.need).join(' ');
  console.log(need);
  ok(!pg.errs.length, 'tele: 0 errores ' + pg.errs.slice(0, 3).join(' | '));
  await pg.close();
}

async function mech(b) {
  console.log('--- mecánicas de la familia');
  const pg = await page(b, '&patch=1'); await pg.evaluate(SIM);
  // ---- Lobo de escarcha: manada
  let r = await pg.evaluate(() => {
    __clear(500, 110); const o = {}; G.god = false; const ws = [], ang = [0, 2.1, 4.2];
    ang.forEach(a => { const e = G.Enemies.spawn('frostwolf', G.player.x + Math.cos(a) * 320, G.player.y + Math.sin(a) * 160, { spawnT: 0 }); e.cdT = 0; ws.push(e); });
    const starts = [], dist = []; let lastSt = ws.map(() => null), hp0 = G.player.hp, hits = 0, skid = [], lunge = [];
    G.player.x = 700; G.player.y = 405; G.player.hurtT = 0;
    __sim(14000, t => { ws.forEach((w, i) => { if (w.dead) return; if (w.st !== lastSt[i]) { if (w.st === 'howl') starts.push(Math.round(t)); if (w.st === 'lunge') w._p0 = [w.x, w.y]; if (w.st === 'skid') { lunge.push(Math.round(Math.hypot(w.x - w._p0[0], w.y - w._p0[1]))); w._p1 = [w.x, w.y]; } if (w.st === 'rec' && lastSt[i] === 'skid') skid.push(Math.round(Math.hypot(w.x - w._p1[0], w.y - w._p1[1]))); lastSt[i] = w.st; } if (w.st === 'surround') dist.push(Math.hypot(w.x - G.player.x, w.y - G.player.y)); }); if (G.player.hp < hp0) { hits++; hp0 = G.player.hp; } G.player.hp = G.player.maxHp; hp0 = G.player.hp; G.player.x = 700; G.player.y = 405; G.player.vx = 0; G.player.vy = 0; });
    o.starts = starts; o.gaps = starts.slice(1).map((s, i) => s - starts[i]); o.meanDist = Math.round(dist.reduce((a, c) => a + c, 0) / (dist.length || 1)); o.lunge = lunge.slice(0, 3); o.skid = skid.slice(0, 4);
    return o;
  });
  console.log('manada', JSON.stringify(r));
  ok(r.starts.length >= 4 && r.gaps.every(g => g >= 1100), `manada: ataques por turnos, separación >= 1,2 s: ${r.gaps.join(',')} ms (${r.starts.length} ataques)`);
  ok(r.meanDist >= 150 && r.meanDist <= 260, `rodean al jugador a ~200 px (media ${r.meanDist})`);
  const sk = r.skid.filter(x => x > 0);
  ok(sk.length >= 2 && sk.every(s => s >= 105 && s <= 160), `derrape tras el lance ~140 px (los que chocan con la pared o una estalagmita se paran antes): ${r.skid.join(',')}`);
  // ---- Oso: perfil de embestida
  r = await pg.evaluate(() => {
    __clear(500, 110); G.god = false; const o = {}; const e = __mk('boar', 230, 0); e.atkT = 0; const prof = []; let last = null, t0 = 0, dur = {}, x0 = null, x1 = null, hit = null, hp0 = G.player.hp, tc = null;
    __sim(8000, t => { if (e.st !== last) { if (last) dur[last] = Math.round(t - t0); last = e.st; t0 = t; if (e.st === 'charge') { x0 = [e.x, e.y]; tc = t; } if (e.st === 'slide') x1 = [e.x, e.y]; if (e.st === 'stun' && x1) { o.slide = Math.round(Math.hypot(e.x - x1[0], e.y - x1[1])); } } if (e.st === 'charge') prof.push([Math.round(t - tc), Math.round(e.cv)]); if (G.player.hp < hp0 && hit == null) hit = Math.round(hp0 - G.player.hp); G.player.hp = G.player.maxHp; hp0 = G.player.hp; G.player.x = 500; G.player.y = 110; G.player.vx = G.player.vy = G.player.kx = G.player.ky = 0; });
    o.dur = dur; o.v600 = (prof.find(q => q[0] >= 600) || [0, 0])[1]; o.vmax = Math.max.apply(null, prof.map(q => q[1])); o.charge = x0 && x1 ? Math.round(Math.hypot(x1[0] - x0[0], x1[1] - x0[1])) : null; o.hit = hit; o.dmg = Math.round(e.dmg);
    return o;
  });
  console.log('oso', JSON.stringify(r));
  ok(Math.abs(r.dur.wind - 900) <= 40 && r.vmax >= 415 && r.vmax <= 425 && r.v600 >= 400, `oso: aviso ${r.dur.wind} ms, acelera hasta ${r.vmax} px/s (v a 600 ms = ${r.v600})`);
  ok(r.charge >= 285 && r.charge <= 320 && r.slide >= 150 && r.slide <= 200, `embestida ${r.charge} px + patina ${r.slide} px (300 + 180)`);
  ok(Math.abs(r.dur.stun - 900) <= 60 && r.hit >= 15, `queda aturdido ${r.dur.stun} ms (vulnerable x1,5); impacto ${r.hit}`);
  // ---- Yeti
  r = await pg.evaluate(() => {
    __clear(500, 110); const o = {}; const e = __mk('shield', 60, 0); e.bashT = 0; o.plate0 = e.plateHp; o.mat0 = e.mat;
    function fireMul(en) { en.hp = en.maxHp = 1e6; const h0 = en.hp; G.Combat.deal(en, 10, { tag: 'fire' }); return +((h0 - en.hp) / (10 * G.B.cardDmgMul)).toFixed(2); }
    const probe = __mk('shield', 400, 0); o.fireWithPlate = fireMul(probe);
    probe.plateHp = 30; __hit(probe, 29 / 1.25 / G.B.cardDmgMul, 'fire'); o.afterMostly = probe.plateHp > 0; __hit(probe, 5, 'fire'); o.melted = probe.plateHp === 0 && !probe.shield; o.matAfter = probe.mat; o.fireAfter = fireMul(probe);
    // golpe de Acero frontal: x0,2 con la placa
    const q = __mk('shield', 400, 80); q.hp = q.maxHp = 1e6; q.fa = Math.PI; q.st = 'move'; const h1 = q.hp; G.Combat.deal(q, 20, { tag: 'steel', sx: q.x - 60, sy: q.y, ang: 0 }); o.blocked = +((h1 - q.hp) / (20 * 1.25 * G.B.cardDmgMul)).toFixed(2);
    // empellón: 800 ms, empuje de ~100 px que patina
    G.god = false; __clear(500, 110); const y = __mk('shield', 55, 0); y.bashT = 0; let hp0 = G.player.hp, px0 = null, tb = null, pe = null; __sim(5000, t => { if (y.st === 'bash' && px0 == null) { px0 = G.player.x; tb = t; } if (px0 != null && G.player.hp < hp0 && o.pushHp == null) o.pushHp = Math.round(hp0 - G.player.hp); if (tb != null && pe == null && t - tb >= 1800) pe = G.player.x; }); o.push = px0 == null || pe == null ? null : Math.round(px0 - pe);
    o.dmg = Math.round(y.dmg);
    return o;
  });
  console.log('yeti', JSON.stringify(r));
  ok(r.plate0 === 30 && r.mat0 === 'escarcha' && r.fireWithPlate === 1.25, `placa de 30: cuenta como Escarcha (Fuego x${r.fireWithPlate})`);
  ok(r.afterMostly && r.melted && r.matAfter === 'pelaje' && r.fireAfter === 1, `se derrite con 30 de Fuego; después Pelaje (Fuego x${r.fireAfter})`);
  ok(r.blocked <= 0.3, `la placa frena el golpe frontal (x${r.blocked})`);
  ok(r.push != null && r.push >= 60 && r.push <= 105, `empellón: empuje de ${r.push} px (<= 100 + patina) y daño ${r.pushHp}`);
  // ---- Murciélago
  r = await pg.evaluate(() => {
    __clear(500, 110); G.god = false; const o = {}; const e = __mk('moth', 230, 0); e.shootT = 0; let last = null, t0 = 0, dur = {}, p0 = null, dist = null, hit = null, cp = G.cold.v;
    G.cold.frozenT = 0; G.cold.immuneT = 0; const hp0 = G.player.hp;
    __sim(6000, t => { const cprev = cp; cp = G.cold.v; if (e.st !== last) { if (last) dur[last] = Math.round(t - t0); if (e.st === 'dive') p0 = [e.x, e.y, t]; if (e.st === 'rec' && p0) { dist = Math.round(Math.hypot(e.x - p0[0], e.y - p0[1])); o.spd = Math.round(dist / ((t - p0[2]) / 1000)); } last = e.st; t0 = t; } if (G.player.hp < hp0 && hit == null) { hit = Math.round(hp0 - G.player.hp); o.cold = +(G.cold.v - cprev - 1.5 / 60).toFixed(1); } if (e.st !== 'dive') G.player.hurtT = 0; });
    o.dur = dur; o.dist = dist; o.hit = hit; o.fly = !!e.fly; return o;
  });
  console.log('murciélago', JSON.stringify(r));
  ok(Math.abs(r.dur.aim - 700) <= 40 && r.spd >= 330 && r.spd <= 370 && r.fly, `murciélago: aviso ${r.dur.aim} ms, picado a ${r.spd} px/s, vuela (sin hielo)`);
  ok(r.hit != null && r.cold >= 7 && r.cold <= 9, `picado: ${r.hit} de daño + ${r.cold} de Frío (6 + 8)`);
  // ---- Estalagmita viva
  r = await pg.evaluate(() => {
    __clear(500, 110); G.god = false; const o = {}; const e = __mk('sower', 300, 0); o.dormant = [e.st, e.untarget, !!G.Combat.nearest(e.x, e.y, 50)]; __sim(500); o.stay = [e.st, Math.round(e.x)];
    G.player.x = e.x - 100; G.player.y = e.y; let last = null, t0 = 0, dur = {}; const hp0 = G.player.hp; let hit = null;
    __sim(2500, t => { if (e.st !== last) { if (last) dur[last] = Math.round(t - t0); last = e.st; t0 = t; } if (G.player.hp < hp0 && hit == null) hit = Math.round(hp0 - G.player.hp); G.player.x = e.x - 20; G.player.hurtT = 0 && G.player.hurtT; });
    o.dur = dur; o.hit = hit; o.awake = [e.untarget, !!G.Combat.nearest(e.x, e.y, 60), e.st];
    // se arrastra a 28 px/s y se rearma cada 5 s
    G.player.x = 1300; G.player.y = 700; e.rearm = 5000; __sim(1500); const x0 = e.x, y0 = e.y; __sim(2000); o.crawl = Math.round(Math.hypot(e.x - x0, e.y - y0) / 2);
    // al morir: 3 esquirlas de 3
    const n0 = G.projectiles.length; e.hp = 1; __hit(e, 50, 'steel'); o.shards = G.projectiles.filter(q => q.dmg === 3).length;
    return o;
  });
  console.log('estalagmita', JSON.stringify(r));
  ok(r.dormant[0] === 'dormant' && r.dormant[1] && !r.dormant[2], 'dormida: camuflada (no es objetivo de las cartas)');
  ok(Math.abs(r.dur.tele - 800) <= 40 && r.hit >= 13 && r.hit <= 15, `se despierta a < 120 px: aviso ${r.dur.tele} ms, erupción de ${r.hit} (14)`);
  ok(!r.awake[0] && r.awake[1] && r.crawl >= 24 && r.crawl <= 32, `después ya es objetivo y se arrastra a ${r.crawl} px/s (28)`);
  ok(r.shards === 3, 'al morir suelta 3 esquirlas de 3 de daño');
  // ---- Espíritu de nieve
  r = await pg.evaluate(() => {
    __clear(500, 110); G.god = false; const o = {}; const e = __mk('blinker', 200, 0); e.atkT = 0; let last = null, t0 = 0, dur = {}; const hp0 = G.player.hp; let hit = null, px0 = null, whirl = null;
    __sim(5000, t => { if (e.st !== last) { if (last) dur[last] = Math.round(t - t0); last = e.st; t0 = t; } if (e.st === 'fade' && !whirl) { const z = G.zones.find(q => q.kind === 'whirl'); if (z) whirl = { r: z.r, slow: z.slow, ms: z.slowMs }; } if (e.st === 'slash' && px0 == null) px0 = [G.player.x, G.player.y]; if (px0 && G.player.hp < hp0 && hit == null) hit = Math.round(hp0 - G.player.hp); });
    o.dur = dur; o.hit = hit; o.whirl = whirl; o.push = px0 ? Math.round(Math.hypot(G.player.x - px0[0], G.player.y - px0[1])) : null; return o;
  });
  console.log('espíritu', JSON.stringify(r));
  ok(Math.abs(r.dur.fade - 600) <= 40 && Math.abs(r.dur.slash - 350) <= 40, `espíritu: desvanece ${r.dur.fade} ms + tajo ${r.dur.slash} ms`);
  ok(r.whirl && r.whirl.r === 36 && r.whirl.slow === 0.25 && r.whirl.ms === 2000, 'remolino de nieve r 36, ralentiza 25 % durante 2 s: ' + JSON.stringify(r.whirl));
  ok(r.hit != null && r.push != null && r.push >= 60 && r.push <= 105, `tajo de ${r.hit} y empuje de ${r.push} px (100)`);
  // ---- Chamán: invocación y aura de Frío
  r = await pg.evaluate(() => {
    __clear(500, 110); const o = {}; const e = __mk('warlock', 150, 0); e.sumT = 0; let n = 0; __sim(2500, () => { n = G.enemies.filter(q => q.owner === e).length; if (n >= 2) return false; }); o.sum = n; o.cast = (G.B.tele.shaman || {}).ms; o.kind = G.enemies.filter(q => q.owner === e).map(q => q.type);
    // matar al chamán disipa a los lobeznos
    const owned = G.enemies.filter(q => q.owner === e && !q.dead).length; { const e2 = __mk('warlock', 150, 0); e2.sumT = 0; __sim(2000, () => { if (G.enemies.filter(q => q.owner === e2).length >= 2) return false; }); o.owned0 = G.enemies.filter(q => q.owner === e2 && !q.dead).length; G.Enemies.kill(e2, false, 'steel'); o.owned1 = G.enemies.filter(q => q.owner === e2 && !q.dead).length; }
    // aura: ganancia x2 a < 200 px; sin chamán x1
    G.Tundra.coldAdd(0); G.player.hand = [null, null, null, null, null]; const C = G.cold; G.enemies.forEach(q => { if (q !== e) q.dead = true; }); e.sumT = 1e9; e.x = G.player.x + 120; e.y = G.player.y; e.spd = 0; e.spdBase = 0; G.player.sf = 1; C.v = 0; G.time += 300; __sim(1000); o.rateNear = +C.rate.toFixed(2);
    e.x = G.player.x + 400; __sim(1000); o.rateFar = +C.rate.toFixed(2);
    return o;
  });
  console.log('chamán', JSON.stringify(r));
  ok(r.sum === 2 && r.kind.every(k => k === 'worm'), 'invoca 2 Lobeznos por conjuro');
  ok(Math.abs(r.rateNear - 3.0) < 0.05 && Math.abs(r.rateFar - 1.5) < 0.05, `aura de Frío: ganancia x2 a < 200 px (${r.rateNear} vs ${r.rateFar} %/s)`);
  ok(r.owned0 >= 2 && r.owned1 === 0, 'matarlo disipa a los lobeznos');
  // ---- Cazador de la ventisca
  r = await pg.evaluate(() => {
    __clear(500, 110); G.god = false; const o = {}; const e = __mk('archer', 230, 0); e.shootT = 0; let last = null, t0 = 0, dur = {}, sp = null, hit = null, cp = G.cold.v; const hp0 = G.player.hp;
    __sim(6000, t => { const cprev = cp; cp = G.cold.v; if (e.st !== last) { if (last) dur[last] = Math.round(t - t0); last = e.st; t0 = t; } const q = G.projectiles.find(z => z.team === 'e' && z.src === 'archer'); if (q && sp == null) sp = Math.round(Math.hypot(q.vx, q.vy)); if (G.player.hp < hp0 && hit == null) { hit = Math.round(hp0 - G.player.hp); o.cold = +(G.cold.v - cprev - 1.5 / 60).toFixed(1); } });
    o.dur = dur; o.speed = sp; o.hit = hit; o.fb = e.fe.proj; return o;
  });
  console.log('cazador', JSON.stringify(r));
  ok(Math.abs(r.dur.aim - 700) <= 40 && r.speed === 240, `cazador: aim ${r.dur.aim} ms, flecha helada a ${r.speed} px/s`);
  ok(r.hit != null && r.cold >= 5.5 && r.cold <= 6.5, `impacto: ${r.hit} de daño + ${r.cold} de Frío (8 + 6)`);
  // ---- estalagmitas del suelo bloquean proyectiles enemigos; los de jugador no
  r = await pg.evaluate(() => {
    __clear(500, 110); const o = {}; const P = G.Tundra.pillars[4]; G.projectiles.length = 0;
    G.Enemies.shoot('e', P.x - 120, P.y, 0, 200, 5, 'proj_ice_arrow', { r: 6, life: 4000 }); G.Enemies.shoot('e', P.x - 120, P.y + 150, 0, 200, 5, 'proj_ice_arrow', { r: 6, life: 4000 });
    G.player.x = 1300; G.player.y = 700; __sim(1500); o.left = G.projectiles.length; o.pillar = [P.x, P.y];
    // colisión del jugador y de un enemigo con la estalagmita
    __clear(P.x - 60, P.y); G.player.x = P.x - 5; G.player.y = P.y; G.Tundra.collide(G.player, G.player.r); o.push = Math.round(Math.hypot(G.player.x - P.x, G.player.y - P.y));
    return o;
  });
  ok(r.left === 1 && r.push >= 32, `la estalagmita bloquea la flecha que la atraviesa (quedan ${r.left} de 2) y empuja al jugador fuera (${r.push} px)`);
  // ---- guardianes y packs
  r = await pg.evaluate(() => {
    __clear(500, 110); const o = {}; G.curBiome = 'tundra'; const W = G.Waves; W.elitesDone = {}; G.runT = G.time = 0;
    function guard(type, vr) { G.enemies.length = 0; const before = G.enemies.length; G.Waves.elitesDone[type] = false; const e = G.Enemies.spawn(type, 900, 300, { spawnT: 0 }); e.spawnT = 0; G.Enemies.variant(e, vr); return e; }
    const y = guard('mini_bulwark', 'yeti'); o.yetiName = y.vname; o.yetiSpr = y.spr; o.shield0 = Math.round(y.shieldHp);
    __hit(y, 10, 'fire'); const sh = y.shieldHp; o.fireMelts = sh < y.shieldMax;
    y.st = 'move'; y.atkT = 0; y.force = 'charge'; y.x = 700; y.y = 405; G.player.x = 1000; G.player.y = 405; let cw = 0; const durs = {}; let last = null, t0 = 0; __sim(6000, t => { if (y.st !== last) { if (last) durs[last] = Math.round(t - t0); last = y.st; t0 = t; } });
    o.yetiDur = durs; o.clen = y.clen;
    const v = guard('mini_hive', 'ventisquero'); o.vName = v.vname; o.vSpr = v.spr; v.x = 700; v.y = 405; G.player.x = 760; G.player.y = 405; v.force = 'tide'; v.atkT = 0; G.zones.length = 0; __sim(2500); const bz = G.zones.find(z => z.kind === 'blizz'); o.blizz = bz ? bz.cold : null;
    return o;
  });
  console.log('guardianes', JSON.stringify(r));
  ok(r.yetiName === 'YETI CENTINELA' && r.fireMelts, 'Yeti Centinela: su placa se derrite con Fuego (' + r.shield0 + ' de placa)');
  ok(r.yetiDur.cwind >= 590 && r.clen >= 300, `Embestida del Yeti Centinela: recorrido ${Math.round(r.clen)} px (300 + 180 de derrape), aviso ${r.yetiDur.cwind} ms`);
  ok(r.vName === 'VENTISQUERO' && r.blizz === 14, 'Ventisquero: Ventisca local que sube el Frío (+14 %/s)');
  ok(!pg.errs.length, 'mech: 0 errores ' + pg.errs.slice(0, 3).join(' | '));
  await pg.close();
}

async function data(b) {
  console.log('--- datos de la familia (B.3)');
  const pg = await page(b, ''); await pg.evaluate(SIM);
  const r = await pg.evaluate(() => {
    const B = G.B, f = B.fam.tundra, u = f.use, o = { ready: f.ready, n: Object.keys(u).length, sums: [0, 0, 0, 0], caps: [0, 0, 0, 0], rows: {} };
    Object.keys(u).forEach(k => { const e = u[k], t = e.tier; o.sums[t] += e.w; o.caps[t] += e.maxAlive; o.rows[k] = [e.name, t, e.from / 1000, e.w, e.cost, e.maxAlive, e.capGrow || 0, e.mat]; });
    o.famOn = !!B.famOf(); o.has = ['worm', 'archer', 'frostwolf', 'boar', 'shield', 'moth', 'sower', 'blinker', 'warlock'].every(k => B.has(k)) && ['fanner', 'bomb', 'scorcher', 'dog', 'salamander', 'chainer', 'leech', 'headlet'].every(k => !B.has(k));
    o.mat = B.mat.on; o.packs = f.packs.map(p => p.id + ':' + p.parts.map(q => q[0] + q[1]).join('+')); o.lens = f.lens; o.drops = ['frostwolf'].map(k => G.Loot.DROPS[k]); o.stalagDrop = u.sower.drop;
    o.bossDefs = !!(G.Boss.DEFS && G.Boss.DEFS.yarlak); o.noBoss = G.Tundra.noBoss(); o.sprs = Object.keys(u).map(k => [k, G.hasSpr(u[k].spr)]);
    o.caps2 = Object.keys(u).map(k => [k, G.Waves.capOf(k, 0), G.Waves.capOf(k, 9)]);
    // director: 1000 pulsos a los 8 min con todo desbloqueado; ningún tipo supera su tope; tierCurve intacta
    G.runT = 8 * 60000 / G.tk; o.tm = [0, 3, 6, 9].map(m => [0, 1, 2, 3].map(t => +G.B.tierCurve.find(c => c[0] >= m)[t + 1].toFixed(2)));
    // chips del portal
    o.matLens = B.matLens('tundra');
    return o;
  });
  console.log(JSON.stringify(r.rows)); console.log('packs', r.packs.join(' | ')); console.log('topes mín/máx', JSON.stringify(r.caps2));
  ok(r.ready && r.famOn && r.n === 9, 'familia Tundra: 9 tipos, ready:true desde la P4 (activa con ?biome=tundra)');
  ok(r.sums.join() === '55,44,29,25', 'suma de w por tier 55/44/29/25 = ' + r.sums.join('/'));
  ok(r.caps.join() === '40,17,16,9', 'topes base por tier 40/17/16/9 = ' + r.caps.join('/'));
  ok(r.has, 'roles presentes (9) y ausentes (fanner bomb scorcher dog salamander chainer leech headlet)');
  ok(r.mat, 'materiales encendidos (Pelaje / Escarcha)');
  ok(r.sprs.every(q => q[1]), 'los 9 sprites enemy_tun_* existen: ' + r.sprs.map(q => q[0] + (q[1] ? '' : '?')).join(' '));
  ok(r.packs.length === 4 && /manada:frostwolf3/.test(r.packs[0]), 'packs B.3 (Manada, Cordada, Pinza del aullido, Trampal)');
  ok(r.bossDefs && r.noBoss, 'P4: Yarlak existe y &nobos=1 sigue dando la prueba sin jefe');
  ok(r.drops.every(Boolean) && r.stalagDrop[0] === 'frost', 'drops: Lobo = Colmillo, Estalagmita = Escarcha');
  ok(!pg.errs.length, 'data: 0 errores ' + pg.errs.slice(0, 3).join(' | '));
  await pg.close();
  // Tundra sin ?biome=tundra: familia apagada (ready:false), y ?fam=0 la anula
  const p2 = await b.newPage({ viewport: { width: 960, height: 540 } }), e2 = [];
  p2.on('pageerror', e => e2.push(e.message));
  await p2.goto(`${base}/index.html?reset=1&god=1&biome=tundra&fam=0`); await p2.waitForTimeout(400); await p2.evaluate(() => G.startGame());
  const z = await p2.evaluate(() => ({ fam: !!G.B.famOf(), on: G.Tundra.on, has: G.B.has('frostwolf') }));
  ok(z.on && !z.fam && !z.has, '?fam=0 anula la familia (roster legado) aunque el hielo siga activo ' + JSON.stringify(z));
  await p2.close();
}

async function flow(b) {
  console.log('--- flujo: Portal bloqueado y expedición en la Tundra sin jefe');
  const ctx = await b.newContext({ viewport: { width: 960, height: 540 } }), pg = await ctx.newPage(); pg.errs = [];
  pg.on('console', m => { if (m.type() === 'error') pg.errs.push(m.text()); }); pg.on('pageerror', e => pg.errs.push('PAGEERR ' + e.message));
  await pg.goto(`${base}/index.html?reset=1&dbg=1&god=1&len=7&speed=20`); await pg.waitForTimeout(500);
  await pg.evaluate(() => { G.Save.data.bossKills = { pastor: 1, karceron: 1, letea: 1 }; G.Save.data.biome = 'asfodelo'; G.Save.save(); });
  await pg.keyboard.press('Tab'); await pg.waitForTimeout(900); await pg.keyboard.press('KeyE'); await pg.waitForTimeout(700);
  const chip = { x: 650 + 3 * 72 + 34, y: 357 };
  await pg.mouse.click(chip.x, chip.y); await pg.waitForTimeout(400);
  const bio = await pg.evaluate(() => G.Save.data.biome); ok(bio === 'tundra', 'P4: con Letea vencida el chip TUNDRA se abre (' + bio + ')');
  await pg.screenshot({ path: process.env.SHOT || '/tmp/p3_portal.png' });
  await pg.keyboard.press('Escape'); await pg.waitForTimeout(300);
  await pg.close(); await ctx.close();
  // expedición con el bot, sin jefe: hasta el final de la prueba (7 min, speed 20)
  const c2 = await b.newContext({ viewport: { width: 960, height: 540 } }), p2 = await c2.newPage(); p2.errs = [];
  p2.on('console', m => { if (m.type() === 'error') p2.errs.push(m.text()); }); p2.on('pageerror', e => p2.errs.push('PAGEERR ' + e.message));
  await p2.goto(`${base}/index.html?reset=1&dbg=1&god=1&len=7&speed=20&biome=tundra&nobos=1`); await p2.waitForTimeout(500);
  await p2.evaluate(botSrc); await p2.evaluate(() => { G.startGame(); });
  const st = () => p2.evaluate(() => G.state);
  await p2.evaluate(() => window.installBalanceBot({}));
  let mx = { cold: 0, frozen: 0 };
  for (let i = 0; i < 400; i++) { await p2.waitForTimeout(500); const s = await p2.evaluate(() => ({ s: G.state, c: G.cold.v, f: G.cold.frozenN })); mx.cold = Math.max(mx.cold, s.c); mx.frozen = s.f; if (s.s === 'gameover') break; }
  await p2.waitForTimeout(800);
  const res = await p2.evaluate(() => ({ s: G.state, won: G.won, t: Math.round(G.runT / 1000), total: G.Loot.summary && G.Loot.summary.total, boss: !!G.Boss.e, biome: G.curBiome }));
  console.log(JSON.stringify(res), JSON.stringify(mx));
  ok(res.s === 'gameover' && res.won && res.t >= 7 * 60 && !res.boss && res.total > 0, 'la prueba sin jefe termina a los 7:00 con botín (' + JSON.stringify(res) + ')');
  await p2.keyboard.press('KeyB'); await p2.waitForTimeout(1200);
  ok((await st()) === 'aldea', 'botín -> aldea');
  ok(!p2.errs.length, 'flujo Tundra: 0 errores de consola ' + p2.errs.slice(0, 3).join(' | '));
  await c2.close();
}

(async () => {
  const b = await launch();
  if (mode === 'ice' || mode === 'all') await ice(b);
  if (mode === 'cold' || mode === 'all') await cold(b);
  if (mode === 'tele' || mode === 'all') await tele(b);
  if (mode === 'mech' || mode === 'all') await mech(b);
  if (mode === 'data' || mode === 'all') await data(b);
  if (mode === 'flow' || mode === 'all') await flow(b);
  console.log(fails ? `RESULTADO: ${fails} FALLO(S)` : 'RESULTADO: TODO OK');
  await b.close(); process.exit(fails ? 1 : 0);
})();
