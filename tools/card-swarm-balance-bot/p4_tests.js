// PRUEBAS P4 (Yarlak, el Coloso Gélido; DESIGN-v5-biomas.md B.2, B.7, C.2).
// uso: node p4_tests.js data|tele|parts|phases|flow|unlock|all [base]   (base por defecto http://localhost:8793)
//  data   : HP (29 750 a 9 min con hpCal 3,5), fases, partes, debilidades, recompensas, cobertura de nieve firme (<= 260) y de hogueras (<= 215), L.DUR.cold, Peligro
//  tele   : regla del hielo tele >= 250 + 220 + 1000 x salida / 190 en los 8 ataques y los 5 Peligros (>= 800 ms los de >= 25 de daño) y telegrafías medidas en el juego
//  parts  : cada parte rota cambia el comportamiento, suelta su trofeo y Corazón solo apuntable con la ventana abierta
//  phases : 4 fases con puerta inmune de 3 s, nieve firme 110 / 90 / 70, desesperado de 10 s (hogueras r 120, carámbanos), topes de adds (4) y proyectiles (60), Peligro V (2 desesperados)
//  flow   : aldea -> Portal -> expedición -> jefe -> botín -> aldea en los 4 biomas con victoria y derrota (+ cacería y práctica de Yarlak)
//  unlock : la Tundra se abre al vencer a Letea (Portal + persistencia) y migración v4 -> v5 con copia de seguridad
const { chromium } = require('/opt/node-tools/node_modules/playwright');
const mode = process.argv[2] || 'all', base = process.argv[3] || 'http://localhost:8793';
let fails = 0; const ok = (c, msg) => { if (!c) fails++; console.log((c ? 'OK     ' : 'FALLO  ') + msg); };
const launch = () => chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--no-sandbox', '--autoplay-policy=no-user-gesture-required'] });
async function page(b, q, vp) {
  const pg = await b.newPage({ viewport: vp || { width: 960, height: 540 } }); pg.errs = [];
  pg.on('console', m => { if (m.type() === 'error') pg.errs.push(m.text()); }); pg.on('pageerror', e => pg.errs.push('PAGEERR ' + e.message + ' ' + (e.stack || '').split('\n').slice(1, 3).join('|')));
  await pg.goto(`${base}/index.html?reset=1&god=1&dbg=1&boss=yarlak&nointro=1&prep=0&hand=spark:3,dart:2,shard:2,dagger:2,fang:1${q || ''}`); await pg.waitForTimeout(500);
  await pg.evaluate(SIM);
  return pg;
}
// __sim(ms, cb): avanza el mundo del jefe en pasos de 1000/60 (sin el director); mantiene al jugador vivo y sin subidas de nivel
const SIM = `
window.__sim = function (ms, cb, keep) { var dt = 1000 / 60, t = 0; while (t < ms) { G.time += dt; if (G.Boss.active) G.runT = G.runT; G.Player.update(G.player, dt); if (!window.__noW) G.Weapons.update(dt); G.Enemies.update(dt); G.Combat.update(dt); G.Tundra.update(dt); G.fx.update(dt); G.pendingLevels = 0; G.player.xp = 0; if (keep !== false) G.player.hp = G.player.maxHp; t += dt; if (cb && cb(t) === false) break; } return t; };
window.__fight = function () { G.state = 'play'; window.__sim(200); };
`;
const RULE = (n, exit) => Math.round(250 + 220 + 1000 * exit / 190);

async function data(b) {
  console.log('--- datos de Yarlak');
  const pg = await page(b, '&len=9');
  const r = await pg.evaluate(() => {
    var S = G.Boss, D = S.DEFS.yarlak, out = {};
    out.hp = [7, 9, 10].map(m => Math.round(D.hp * D.hpCal * S.durMul(m) * 1)); out.hp1 = S.bossHp('yarlak');
    out.phases = D.phases.map(p => p.thr + '/' + p.cad + '/' + p.spd); out.parts = Object.keys(D.parts).map(k => k + ':' + D.parts[k].pct);
    out.weak = JSON.stringify(D.weak); out.resist = JSON.stringify(D.resist); out.rew = [D.brasas, D.brasasPart, D.pf, D.pfFirst, JSON.stringify(D.guaranteed)];
    out.pelHp = [1, 2, 3, 4, 5].map(n => Math.round(D.hp * D.hpCal * S.PELIGRO[n].hp));
    out.cov = [110, 90, 70].map(r => G.Tundra.iceCoverage(r, 10).max);
    var fires = G.B.biomes.tundra.patches.concat(G.B.biomes.tundra.ledges), mx = 0; for (var x = 28; x <= 1412; x += 10) for (var y = 28; y <= 782; y += 10) { var m = 1e9; fires.forEach(f => { m = Math.min(m, Math.hypot(x - f[0], y - f[1]) - 120); }); mx = Math.max(mx, m); }
    out.fire120 = Math.round(mx * 10) / 10; out.cold = [7, 9, 10].map(m => G.Loot.dur(m).cold); out.bb = S.BIOME_BOSS.tundra; out.fam = G.B.fam.tundra.ready; out.save = G.Save.VERSION; out.bosses = G.Save.BOSSES.join(',');
    return out;
  });
  console.log(JSON.stringify(r));
  const H0 = 8500 * 3.5; ok(r.hp1 === Math.round(H0), 'HP a 9 min Peligro I = 8500 x hpCal 3,5 = 29 750 (' + r.hp1 + ')'); ok(r.hp[0] === Math.round(H0 * 0.75) && r.hp[2] === Math.round(H0 * 1.1), 'HP 7 min x0,75 y 10 min x1,10 (' + r.hp + ')');
  ok(r.pelHp.join() === [1, 1.15, 1.3, 1.5, 1.75].map(m => Math.round(H0 * m)).join(), 'HP por Peligro I-V = hp x 1 / 1,15 / 1,30 / 1,50 / 1,75 (' + r.pelHp + ')');
  ok(r.phases.join() === '0.7/3000/55,0.45/2600/65,0.2/2200/75,0/1900/85', '4 fases: umbrales 70 / 45 / 20, cadencia 3,0 / 2,6 / 2,2 / 1,9 s, velocidad 55-85 (' + r.phases + ')');
  ok(r.parts.join() === 'colmillos:0.09,armadura:0.11,corazon:0.08', 'partes Colmillos 9 % / Armadura 11 % / Corazón 8 %');
  ok(r.weak.indexOf('fire') > 0 && r.weak.indexOf('lightning') > 0 && r.resist.indexOf('"ice","mul":0.6') > 0, 'debilidades Fuego y Rayo; resistencia Hielo x0,6 (' + r.weak + ' ' + r.resist + ')');
  ok(r.rew[0] === 14 && r.rew[1] === 4 && r.rew[2] === 2 && r.rew[3] === 3 && r.rew[4] === '{"static":2,"wick":2,"thread":1}', 'recompensa 14 Brasas + 4 por parte, PF 2 (3), garantizados static 2 wick 2 thread 1');
  ok(r.cov.every(c => c <= 260), 'nieve firme a <= 260 px del borde con parches r 110 / 90 / 70 (' + r.cov + ')');
  ok(r.fire120 <= 215, 'hoguera a <= 215 px del borde desde cualquier punto con r 120 (5 hogueras + 2 repisas encendidas en el Invierno) (' + r.fire120 + ')');
  ok(r.cold.join() === '0.9,1,1.1', 'L.DUR.cold = 0,90 / 1,00 / 1,10 (' + r.cold + ')');
  ok(r.bb === 'yarlak' && r.fam === true && r.save === 5 && r.bosses === 'pastor,karceron,letea,yarlak', 'Tundra -> yarlak, familia lista, guardado v5, 4 jefes (' + [r.bb, r.fam, r.save, r.bosses] + ')');
  // el Frío corre a ritmo distinto por duración (L.DUR.cold)
  const cr = await pg.evaluate(() => { var res = []; [7, 9, 10].forEach(m => { G.setLen(m); G.Tundra.begin('tundra'); G.cold.v = 0; G.Boss.e.mode === 'x'; var p = G.player; p.x = 380; p.y = 405; p.sf = 1; G.hand = null; p.hand = p.hand.map(() => null); G.Tundra.resetHand(); G.Tundra.coldUpdate(1000); res.push(Math.round(G.cold.v * 100) / 100); }); G.setLen(9); return res; });
  ok(cr[0] < cr[1] && cr[1] < cr[2] && Math.abs(cr[1] - 1.5) < 0.2, 'ganancia de Frío por segundo x 0,9 / 1,0 / 1,1 (' + cr + ')');
  ok(!pg.errs.length, '0 errores: ' + pg.errs.slice(0, 2)); await pg.close();
}

async function tele(b) {
  console.log('--- telegrafías (regla del hielo)');
  const pg = await page(b, '');
  const names = ['y_pisoton', 'y_embestida', 'y_cornada', 'y_aliento', 'y_alud', 'y_latido', 'y_ventisca'];
  for (let n = 1; n <= 5; n++) {
    const r = await pg.evaluate(([names, n]) => { G.peligro = n; return names.map(a => ({ a: a, ms: G.Boss.u.teleMs(a), base: G.Boss.ATKS[a].tele, exit: G.Boss.EXIT[a], dmg: G.Boss.ATKS[a].dmg })); }, [names, n]);
    const bad = r.filter(x => x.ms < RULE(0, x.exit) || x.ms > x.base || (x.dmg >= 25 && x.ms < 800));
    ok(!bad.length, 'Peligro ' + n + ': ' + r.map(x => x.a.slice(2) + ' ' + x.ms + '>=' + RULE(0, x.exit)).join(', ') + (bad.length ? '  MAL: ' + bad.map(x => x.a) : ''));
  }
  await pg.evaluate(() => { G.peligro = 1; });
  // medidas en juego: tiempo desde el inicio del ataque hasta pasar a 'act'
  const phases = { y_pisoton: 1, y_embestida: 1, y_cornada: 1, y_aliento: 1, y_alud: 2, y_latido: 1, y_ventisca: 3 };
  for (const a of names) {
    const ms = await pg.evaluate(a => {
      G.Boss.e.hp = G.Boss.e.maxHp; G.Boss.e.phase = Math.max(G.Boss.e.phase, 1); G.Boss.e.atk = null; G.Boss.e.bst = 'idle'; G.Boss.e.mode = 'fight'; G.Boss.e.stagT = 0; G.Boss.e.exps.length = 0;
      G.Boss.e.x = 720; G.Boss.e.y = 300; G.player.x = 720; G.player.y = 560; G.player.vx = G.player.vy = 0;
      G.Boss.force(a); var A = G.Boss.e.atk, t0 = 0; if (!A) return -1;
      var t = window.__sim(3000, function () { return A.step === 'tele'; }); return Math.round(t);
    }, a);
    const need = RULE(0, 0); const exit = await pg.evaluate(a => G.Boss.EXIT[a], a);
    ok(ms >= RULE(0, exit) - 20, `${a}: telegrafía medida ${ms} ms >= ${RULE(0, exit)}`);
    await pg.evaluate(() => { var e = G.Boss.e; e.atk = null; e.bst = 'idle'; e.exps.length = 0; G.projectiles.length = 0; G.Boss.waves.length = 0; });
  }
  ok(!pg.errs.length, '0 errores: ' + pg.errs.slice(0, 2)); await pg.close();
}

async function parts(b) {
  console.log('--- partes rompibles');
  const pg = await page(b, '&phase=3');
  await pg.evaluate(() => { G.state = 'play'; window.__sim(3500); });
  const r = await pg.evaluate(() => {
    var S = G.Boss, e = S.e, o = {}; e.hp = e.maxHp * 0.6; e.mode = 'fight'; e.immune = false; e.stagT = 0;
    o.corDown = e.parts.corazon.spawnT > 1000;   // cerrado: no apuntable
    o.avail0 = !(S.ATK.y_cornada.avail && !S.ATK.y_cornada.avail(e)); o.w0 = 0;
    o.mulBody = e.def.h.mulExtra(e, 'neutral', {});
    S.breakKey('armadura'); o.armBroken = e.broken.armadura; o.mulBody2 = e.def.h.mulExtra(e, 'neutral', {});
    o.gems1 = G.gems.filter(g => g.trophy).map(g => g.trophy);
    e.exps.length = 0; e.atk = null; S.breakKey('colmillos'); o.avail1 = !(S.ATK.y_cornada.avail && !S.ATK.y_cornada.avail(e)); o.gems2 = G.gems.filter(g => g.trophy).map(g => g.trophy);
    e.exps.length = 0; e.atk = null; e.stagT = 0; e.mode = 'fight'; e.bst = 'idle'; S.cds.y_embestida = 0; S.force('y_embestida'); o.laneW = e.atk && e.atk.w;
    e.atk = null; e.bst = 'idle'; e.stagT = 0; e.exps.length = 0; S.cds.y_latido = 0; S.force('y_latido'); o.openMs = e.atk && e.atk.openMs;   // Armadura rota: 5,5 s
    return o;
  });
  console.log(JSON.stringify(r));
  ok(r.corDown, 'el Corazón no es apuntable con el pecho cerrado'); ok(r.avail0, 'Cornada disponible con Colmillos');
  ok(r.mulBody === 0.75 && r.mulBody2 === 1, 'Armadura entera: cuerpo x0,75; rota: x1,0 (' + r.mulBody + ' -> ' + r.mulBody2 + ')');
  ok(r.gems1.indexOf('yplate') >= 0, 'la Armadura suelta su trofeo (Placa Glaciar)');
  ok(!r.avail1 && r.gems2.indexOf('ytusk') >= 0, 'sin Colmillos se pierde la Cornada y suelta el Colmillo de Yarlak');
  ok(r.laneW === 90, 'sin Colmillos la Embestida pasa de 110 a 90 px de ancho (' + r.laneW + ')');
  ok(r.openMs === 5500, 'Armadura rota: el Latido dura 5,5 s de ventana (' + r.openMs + ')');
  // ventana: abrir el pecho, apuntable, x2,0; romper el Corazón -> trofeo, derribo 5 s x1,5, +20 % cadencia
  const w = await pg.evaluate(() => {
    var S = G.Boss, e = S.e, o = {};
    var tele = e.atk.tele; window.__sim(tele + 80);
    o.open = S.yarlakInfo().open; o.corUp = e.parts.corazon.spawnT === 0; o.expo = S.expo(e).mul; o.kind = S.expo(e).kind;
    var he = e.parts.corazon, h0 = e.hp, d = G.Combat.deal(he, 100, { id: 't', tag: 'neutral', proj: true }); o.heartDmg = Math.round(d); var d2 = G.Combat.deal(e, 100, { id: 't2', tag: 'neutral', proj: true }); o.bodyDmg = Math.round(d2);
    S.breakKey('corazon'); o.heartBroken = e.broken.corazon; o.cadMul = e.cadMul; o.der = S.expo(e).mul; o.trophies = G.gems.filter(g => g.trophy).map(g => g.trophy); o.openAfter = S.yarlakInfo().open;
    return o;
  });
  console.log(JSON.stringify(w));
  ok(w.open && w.corUp && w.expo === 1.35 && w.kind === 'window', 'el Latido abre el pecho: ventana x1,35 al cuerpo y Corazón apuntable (' + w.expo + ')');
  ok(w.heartDmg > 0 && Math.abs(w.heartDmg / w.bodyDmg - 2 / 1.35) < 0.15, 'Corazón recibe x2,0 / cuerpo x1,35 (' + w.heartDmg + ' vs ' + w.bodyDmg + ')');
  ok(w.heartBroken && w.cadMul === 1.2 && w.der === 1.5 && w.trophies.indexOf('yheart') >= 0 && !w.openAfter, 'Corazón roto: trofeo, derribo x1,5, Invierno profundo +20 % cadencia, pecho cerrado');
  ok(!pg.errs.length, '0 errores: ' + pg.errs.slice(0, 2)); await pg.close();
}

async function phases(b) {
  console.log('--- fases, puertas y desesperado');
  const pg = await page(b, ''); await pg.evaluate(() => { window.__noW = true; });
  await pg.evaluate(() => { G.state = 'play'; window.__sim(500); });
  const T0 = await pg.evaluate(() => ({ patch: G.Tundra.iceCoverage(null, 20).max, heat: G.Tundra.heatR(), ph: G.Boss.e.phase, adds: 0 }));
  ok(T0.ph === 1 && T0.heat === 64, 'F1: nieve firme r 110 (cobertura ' + T0.patch + ' <= 260), hogueras r 64');
  const log = [];
  for (let k = 0; k < 3; k++) {
    const g = await pg.evaluate(() => {
      var S = G.Boss, e = S.e; e.atk = null; e.bst = 'idle'; e.mode = 'fight'; e.immune = false; var ph0 = e.phase;
      e.hp = e.maxHp * e.def.phases[ph0 - 1].thr + 5; G.Combat.deal(e, 50, { id: 'x', tag: 'neutral', proj: true });
      var o = { ph0: ph0, mode: e.mode, ph: e.phase, immune: e.immune, gate: e.gateT, hp: Math.round(e.hp / e.maxHp * 100), hearts: G.gems.filter(g => g.kind === 'heart').length };
      window.__sim(1500); o.mid = e.mode; window.__sim(1600); o.after = e.mode; o.heat = G.Tundra.heatR(); o.cov = G.Tundra.iceCoverage(null, 20).max;
      return o;
    });
    log.push(g); console.log(JSON.stringify(g));
    ok(g.mode === 'gate' && g.immune && g.ph === g.ph0 + 1 && g.hearts >= 2 && g.after === 'fight', `puerta a la fase ${g.ph}: inmune 3 s, 2 corazones, vuelve a combate (HP ${g.hp} %)`);
  }
  const patch = await pg.evaluate(() => { var cov = []; return { c: G.Tundra.iceCoverage(null, 20).max }; });
  ok(log[1].cov > log[0].cov - 1 && log[2].cov >= log[1].cov - 1 && log[2].cov <= 260, 'la cobertura de nieve firme crece al encogerse los parches pero se mantiene <= 260 (' + log.map(l => l.cov) + ')');
  // desesperado
  const d = await pg.evaluate(() => {
    var S = G.Boss, e = S.e, o = {}; e.atk = null; e.bst = 'idle'; e.mode = 'fight'; e.immune = false; e.hp = e.maxHp * 0.0801; G.Combat.deal(e, 5000, { id: 'y', tag: 'neutral', proj: true });
    o.mode = e.mode; o.heat = G.Tundra.heatR(); o.clear = G.B.biomes.tundra.blizzard.clearR; o.expo = S.expo(e).mul; o.open = S.yarlakInfo().open; var maxP = 0, maxA = 0, waves = 0, lastN = 0;
    window.__sim(10400, function (t) { var n = G.projectiles.filter(q => q.team === 'e').length; maxP = Math.max(maxP, n); if (e.mode !== 'despair') return false; return true; });
    o.maxP = maxP; o.after = e.mode; o.heat2 = G.Tundra.heatR(); o.clear2 = G.B.biomes.tundra.blizzard.clearR; o.dt = Math.round(e.despT);
    return o;
  });
  console.log(JSON.stringify(d));
  ok(d.mode === 'despair' && d.heat === 120 && d.clear === 260 && d.expo === 1.25 && d.open, 'Invierno Eterno: hogueras r 120, claro de ventisca 260, cuerpo x1,25 y pecho abierto');
  ok(d.maxP <= 60 && d.maxP > 6, 'carámbanos: máx. ' + d.maxP + ' proyectiles enemigos (<= 60)'); ok(d.after === 'fight' && d.dt >= 9900 && d.heat2 === 64, 'dura 10 s y vuelve a combate con las hogueras en r 64 (' + d.dt + ' ms)');
  // matar durante el desesperado: congelado de 400 ms
  const k = await pg.evaluate(() => { var S = G.Boss, e = S.e; e.atk = null; e.mode = 'fight'; e.hp = e.maxHp * 0.03; G.Combat.deal(e, 10, { id: 'z', tag: 'neutral', proj: true }); return { m: e.mode, left: e.despLeft, hp: Math.round(e.hp) }; });
  ok(k.m === 'fight', 'tras el desesperado no se repite (Peligro I) (' + JSON.stringify(k) + ')');
  ok(!pg.errs.length, '0 errores: ' + pg.errs.slice(0, 2)); await pg.close();
  // topes de adds y proyectiles durante la pelea completa de las fases 2-3 y Peligro V (2 desesperados)
  const p2 = await page(b, '&phase=2&peligro=5'); await p2.evaluate(() => { window.__noW = true; });
  await p2.evaluate(() => { G.state = 'play'; window.__sim(3600); });
  const lim = await p2.evaluate(() => {
    var S = G.Boss, e = S.e, mxA = 0, mxP = 0, n = 0; e.hp = e.maxHp * 0.4;
    ['y_llamada', 'y_alud', 'y_ventisca', 'y_aliento'].forEach(a => { for (var i = 0; i < 3; i++) { e.atk = null; e.bst = 'idle'; e.mode = 'fight'; e.stagT = 0; S.cds[a] = 0; S.force(a); window.__sim(5000, function () { mxA = Math.max(mxA, S.addsAlive()); mxP = Math.max(mxP, G.projectiles.filter(q => q.team === 'e').length); }); } });
    return { mxA: mxA, mxP: mxP, cap: S.PELIGRO[5].cap };
  });
  ok(lim.mxA <= 6 && lim.mxP <= 60, 'Peligro V: adds <= ' + lim.cap + ' y proyectiles <= 60 (' + lim.mxA + ' / ' + lim.mxP + ')');
  const v = await p2.evaluate(() => {
    var S = G.Boss, e = S.e, o = { n: 0 }; e.atk = null; e.mode = 'fight'; e.phase = 4; e.hp = e.maxHp * 0.0801; G.Combat.deal(e, 5000, { id: 'v', tag: 'neutral', proj: true });
    o.m1 = e.mode; o.left = e.despLeft; window.__sim(10400); o.f1 = G.Tundra.fires.length; o.m2 = e.mode; o.hp = Math.round(e.hp / e.maxHp * 1000) / 10;
    e.hp = e.maxHp * 0.0301; G.Combat.deal(e, 5, { id: 'v2', tag: 'neutral', proj: true }); window.__sim(100); o.m3 = e.mode; o.fires = G.Tundra.fires.length; o.heat = G.Tundra.heatR(); window.__sim(10400); o.fin = e.mode; o.fires2 = G.Tundra.fires.length;
    return o;
  });
  console.log(JSON.stringify(v));
  ok(v.m1 === 'despair' && v.m2 === 'fight' && v.m3 === 'despair' && v.fires === 3 && v.heat === 120 && v.fin === 'fight' && v.fires2 === 5, 'Peligro V: dos Inviernos Eternos seguidos, el 2.º con 3 hogueras (' + JSON.stringify(v) + ')');
  ok(!p2.errs.length, 'Peligro V: 0 errores ' + p2.errs.slice(0, 2)); await p2.close();
}

async function endFlow(pg, win) {
  // desde el Portal: lanza, espera al jefe y lo vence o muere
  await pg.keyboard.press('Enter'); await pg.waitForTimeout(800);
  await pg.evaluate(() => { setInterval(() => { G.pendingLevels = 0; if (G.state === 'cards') { try { G.Cards.pick(0); } catch (e) { G.state = 'play'; } } }, 50); });
  let bossT = 0;
  for (let i = 0; i < 80; i++) { await pg.waitForTimeout(400); if (await pg.evaluate(() => !!G.Boss.e && G.Boss.e.mode === 'fight')) break; }
  const info = await pg.evaluate(() => ({ id: G.Boss.e && G.Boss.e.id, biome: G.curBiome, state: G.state }));
  if (win) await pg.evaluate(() => { G.god = true; var e = G.Boss.e; e.hp = e.maxHp * 0.0005; G.Combat.deal(e, 1e6, { id: 'k', tag: 'neutral', proj: true }); G.Combat.deal(e, 1e6, { id: 'k2', tag: 'neutral', proj: true }); });
  else await pg.evaluate(() => { G.god = false; G.player.hp = 0.01; G.Player.hurt(G.player, 500, 0, 0, { src: 'test' }); });
  for (let i = 0; i < 60; i++) { await pg.waitForTimeout(500); if (await pg.evaluate(() => G.state) === 'gameover') break; }
  const res = await pg.evaluate(() => ({ s: G.state, won: G.won, sum: !!G.Loot.summary, boss: G.Loot.summary && G.Loot.summary.boss && G.Loot.summary.boss.id, bk: JSON.stringify(G.Save.data.bossKills) }));
  await pg.waitForTimeout(500); await pg.keyboard.press('KeyB'); await pg.waitForTimeout(1500);
  const back = await pg.evaluate(() => G.state);
  return Object.assign(info, res, { back: back });
}
async function flow(b) {
  console.log('--- flujo aldea -> portal -> expedición -> botín -> aldea (4 biomas, victoria y derrota)');
  const exp = { bosque: 'pastor', cripta: 'karceron', asfodelo: 'letea', tundra: 'yarlak' };
  for (const bio of Object.keys(exp)) for (const win of [true, false]) {
    const ctx = await b.newContext({ viewport: { width: 960, height: 540 } }), pg = await ctx.newPage(); pg.errs = [];
    pg.on('console', m => { if (m.type() === 'error') pg.errs.push(m.text()); }); pg.on('pageerror', e => pg.errs.push('PAGEERR ' + e.message + ' ' + (e.stack || '').split('\n').slice(1, 3).join('|')));
    await pg.goto(`${base}/index.html?reset=1&dbg=1&len=7&speed=20&t=370&god=1`); await pg.waitForTimeout(600);
    await pg.evaluate(bio => { G.Save.data.bossKills = { pastor: 1, karceron: 1, letea: 1 }; G.Save.data.biome = bio; G.Save.save(); }, bio);
    await pg.keyboard.press('Tab'); await pg.waitForTimeout(900); await pg.keyboard.press('KeyE'); await pg.waitForTimeout(700);
    const sel = await pg.evaluate(() => G.Save.data.biome); ok(sel === bio, 'Portal con destino ' + bio);
    const r = await endFlow(pg, win);
    ok(r.id === exp[bio] && r.biome === bio, `${bio} ${win ? 'victoria' : 'derrota'}: jefe ${r.id} en ${r.biome}`);
    ok(r.s === 'gameover' && r.won === win && r.sum && (!win || r.boss === exp[bio]), `${bio} ${win ? 'victoria' : 'derrota'}: pantalla de botín (${JSON.stringify({ s: r.s, won: r.won, boss: r.boss })})`);
    ok(r.back === 'aldea', `${bio}: botín -> aldea (${r.back})`);
    if (win && bio === 'tundra') { const k = JSON.parse(r.bk); ok(k.yarlak === 1, 'victoria sobre Yarlak guardada en bossKills'); }
    ok(!pg.errs.length, `${bio} ${win ? 'victoria' : 'derrota'}: 0 errores ${pg.errs.slice(0, 2)}`);
    await ctx.close();
  }
  // cacería y práctica de Yarlak
  for (const q of ['&hunt=yarlak', '&hunt=yarlak&practice=1']) {
    const pg = await b.newPage({ viewport: { width: 960, height: 540 } }); pg.errs = [];
    pg.on('console', m => { if (m.type() === 'error') pg.errs.push(m.text()); }); pg.on('pageerror', e => pg.errs.push('PAGEERR ' + e.message));
    await pg.goto(`${base}/index.html?reset=1&dbg=1&god=1&speed=10&prep=0${q}`); await pg.waitForTimeout(1500);
    for (let i = 0; i < 40; i++) { if (await pg.evaluate(() => G.Boss.e && G.Boss.e.mode === 'fight')) break; await pg.waitForTimeout(300); }
    const r = await pg.evaluate(() => ({ mode: G.mode, id: G.Boss.e && G.Boss.e.id, hp: G.Boss.e && Math.round(G.Boss.e.maxHp), biome: G.curBiome, n: G.enemies.filter(e => !e.dead && e.type !== 'boss' && e.type !== 'bosspart').length }));
    const want = q.indexOf('practice') > 0 ? Math.round(29750 * 0.5) : Math.round(29750 * 0.75);
    ok(r.id === 'yarlak' && r.biome === 'tundra' && r.hp === want, `${q}: modo ${r.mode}, HP ${r.hp} (esperado ${want}), normales ${r.n}`);
    ok(!pg.errs.length, `${q}: 0 errores ${pg.errs.slice(0, 2)}`); await pg.close();
  }
}

async function unlock(b) {
  console.log('--- desbloqueo de la Tundra y migración v4 -> v5');
  const ctx = await b.newContext({ viewport: { width: 960, height: 540 } }), pg = await ctx.newPage(); pg.errs = [];
  pg.on('console', m => { if (m.type() === 'error') pg.errs.push(m.text()); }); pg.on('pageerror', e => pg.errs.push('PAGEERR ' + e.message));
  await pg.goto(`${base}/index.html?dbg=1&reset=1`); await pg.waitForTimeout(500);
  const chip = { x: 650 + 3 * 72 + 34, y: 357 };
  async function portal(kills) {
    await pg.evaluate(k => { G.Save.data.bossKills = k; G.Save.data.biome = 'bosque'; G.Save.save(); }, kills);
    await pg.keyboard.press('Tab'); await pg.waitForTimeout(900); await pg.keyboard.press('KeyE'); await pg.waitForTimeout(600);
    await pg.mouse.click(chip.x, chip.y); await pg.waitForTimeout(350);
    const bio = await pg.evaluate(() => G.Save.data.biome); await pg.screenshot({ path: process.env.SHOT || '/tmp/p4_portal.png' });
    await pg.keyboard.press('Escape'); await pg.waitForTimeout(400); return bio;
  }
  ok(await portal({ pastor: 1, karceron: 1 }) === 'bosque', 'sin vencer a Letea la Tundra sigue bloqueada');
  ok(await portal({ pastor: 1, karceron: 1, letea: 1 }) === 'tundra', 'al vencer a Letea el chip TUNDRA se abre y se elige');
  // persistencia y el destino bloqueado cae al último abierto en startGame
  const eff = await pg.evaluate(() => { G.Save.data.bossKills = { pastor: 1, karceron: 1 }; G.Save.data.biome = 'tundra'; G.Save.save(); G.startGame(); return G.curBiome; });
  ok(eff === 'asfodelo', 'destino Tundra sin Letea vencida cae a Asfodelo (' + eff + ')');
  await pg.close(); await ctx.close();
  // migración v4 -> v5: copia de seguridad, Letea vencida -> Tundra abierta, peligro.yarlak
  const c2 = await b.newContext({ viewport: { width: 960, height: 540 } }), p2 = await c2.newPage(); p2.errs = [];
  p2.on('console', m => { if (m.type() === 'error') p2.errs.push(m.text()); }); p2.on('pageerror', e => p2.errs.push('PAGEERR ' + e.message));
  await p2.goto(`${base}/index.html?dbg=1&nosw=1`); await p2.waitForTimeout(400);
  const old = { v: 4, parts: { wick: 5 }, brasas: 123, cards: { spark: 1, dart: 1, shard: 1, dagger: 1, fang: 1, hourglass: 1 }, anchors: ['spark'], len: 9, pf: { earned: 7 }, nodes: {}, bossKills: { pastor: 2, karceron: 1, letea: 1 }, peligro: { pastor: 3, karceron: 2, letea: 2 }, biome: 'asfodelo', flags: {} };
  await p2.evaluate(o => { localStorage.setItem('swarmhand.save', JSON.stringify(o)); }, old);
  await p2.goto(`${base}/index.html?dbg=1&nosw=1`); await p2.waitForTimeout(600);
  const m = await p2.evaluate(() => ({ v: G.Save.data.v, y: G.Save.data.peligro.yarlak, bk: JSON.stringify(G.Save.data.bossKills), br: G.Save.data.brasas, pf: G.Save.data.pf.earned, pel: JSON.stringify(G.Save.data.peligro), bak: !!localStorage.getItem('swarmhand.save.v4'), mig: G.Save.data.flags.migrated5, qb: G.Quests.unlockedBiomes().join(','), feas: G.Quests.feasible(G.Quests.def('wolves')) }));
  console.log(JSON.stringify(m));
  ok(m.v === 5 && m.y === 1 && m.bak && m.mig === 1, 'migración v4 -> v5: versión 5, peligro.yarlak = 1, copia en swarmhand.save.v4');
  ok(m.br === 123 && m.pf === 7 && m.bk === '{"pastor":2,"karceron":1,"letea":1}' && /"pastor":3/.test(m.pel), 'sin pérdidas (Brasas, PF, victorias, Peligro)');
  ok(m.qb.indexOf('tundra') > 0 && m.feas, 'quien ya venció a Letea ve la Tundra abierta y el encargo de los Lobos de escarcha se activa (' + m.qb + ')');
  await p2.evaluate(() => { localStorage.setItem('swarmhand.save', '{"v":4,"parts":null'); }); await p2.goto(`${base}/index.html?dbg=1&nosw=1`); await p2.waitForTimeout(500);
  ok(await p2.evaluate(() => G.Save.data.v === 5 && G.Save.data.peligro.yarlak === 1), 'guardado corrupto cae a valores por defecto v5');
  ok(!p2.errs.length, '0 errores: ' + p2.errs.slice(0, 2)); await c2.close();
}

(async () => {
  const b = await launch();
  if (mode === 'data' || mode === 'all') await data(b);
  if (mode === 'tele' || mode === 'all') await tele(b);
  if (mode === 'parts' || mode === 'all') await parts(b);
  if (mode === 'phases' || mode === 'all') await phases(b);
  if (mode === 'unlock' || mode === 'all') await unlock(b);
  if (mode === 'flow' || mode === 'all') await flow(b);
  console.log(fails ? `RESULTADO: ${fails} FALLO(S)` : 'RESULTADO: TODO OK');
  await b.close(); process.exit(fails ? 1 : 0);
})();
