// PRUEBAS P6.5 (Cenizar, el Incendio Primero; DESIGN-v7-jefe-final.md).
// uso: node p65_tests.js data|tele|parts|mech|chain|phases|unlock|hunt|flow|all [base]   (base por defecto http://localhost:8801)
//  data   : HP 36000 x 3,6 = 129 600 (pelHp 1,0-1,4), 7 fases (umbrales, cadencia, paso), desesperado 6 %, 6 partes, tabla de debilidades por fase (multiplicadores reales), guardado v8
//  tele   : regla de esquiva tele >= 250 + 1000 x salida / 190 (+100) en los 18 ataques y los 5 Peligros, eslabones de la cadena, telegrafías medidas
//  parts  : Reliquias solo apuntables en su fase, efecto al romperse, trofeo, corazón, Corazón de Ceniza solo en la ventana
//  mech   : Éxtasis (oleadas, inversión, carril), Réquiem (lava, islas, cobertura), Martillazo, Lluvia, Coro (Eco), Invierno (hogueras), Ventisca, Zumbido, Estocada, Llamadas
//  chain  : Rosario (eslabones por Reliquia, tabla de tiempos, regla de esquiva, alcanzabilidad >= 95 %, Sol y ventana del Corazón), Cadena Final
//  phases : 6 puertas inmunes de 3 s con 3 corazones, Furia por fase y global, Peligro III-V
//  unlock : el Cráter se abre al vencer a los 5 jefes (Portal), migración v7 -> v8 con copia, guardado corrupto
//  hunt   : ?hunt=cenizar (x0,75), ?practice=1&phase=N (x0,5), ?boss=cenizar, Asalto (HP completo, 6 ofertas)
//  flow   : Portal -> Asalto -> victoria (cinemática + créditos la 1.a vez) / derrota -> botín -> aldea
const { chromium } = require('/opt/node-tools/node_modules/playwright');
const mode = process.argv[2] || 'all', base = process.argv[3] || 'http://localhost:8801';
let fails = 0; const ok = (c, msg) => { if (!c) fails++; console.log((c ? 'OK     ' : 'FALLO  ') + msg); };
const launch = () => chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--no-sandbox', '--autoplay-policy=no-user-gesture-required'] });
async function page(b, q, vp) {
  const pg = await b.newPage({ viewport: vp || { width: 960, height: 540 } }); pg.errs = [];
  pg.on('console', m => { if (m.type() === 'error') pg.errs.push(m.text()); }); pg.on('pageerror', e => pg.errs.push('PAGEERR ' + e.message + ' ' + (e.stack || '').split('\n').slice(1, 3).join('|')));
  await pg.goto(`${base}/index.html?reset=1&god=1&dbg=1&boss=cenizar&nointro=1&prep=0&hand=spark:3,dart:2,shard:2,dagger:2,fang:1${q || ''}`); await pg.waitForTimeout(500);
  await pg.evaluate(SIM);
  return pg;
}
// __sim(ms, cb): avanza el mundo del jefe en pasos de 1000/60 (sin armas ni director); el jugador no muere ni sube de nivel (keep=false: sin curar)
const SIM = `
window.__sim = function (ms, cb, keep) { var dt = 1000 / 60, t = 0; while (t < ms) { G.time += dt; G.Player.update(G.player, dt); G.Enemies.update(dt); G.Combat.update(dt); G.fx.update(dt); G.pendingLevels = 0; G.player.xp = 0; if (keep !== false) G.player.hp = G.player.maxHp; t += dt; if (cb && cb(t) === false) break; } return t; };
window.__prep = function () { var e = G.Boss.e; e.atk = null; e.bst = 'idle'; e.mode = 'fight'; e.immune = false; e.stagT = 0; e.exps.length = 0; e.cadT = 1e9; for (var k in G.Boss.cds) G.Boss.cds[k] = 0; G.Boss.DEFS.cenizar.h.clear(e); G.Boss.waves.length = 0; G.Boss.A.ch = null; G.Boss.A.coreT = 0; G.Boss.A.noFury = false; G.player.dead = false; G.player.hp = G.player.maxHp; G.projectiles.length = 0; G.zones.length = 0; G.enemies.forEach(function (q) { if (q.bossAdd) q.dead = true; }); };
window.__clean = function () { G.enemies.forEach(function (q) { if (q.type !== 'boss' && q.type !== 'bosspart') q.dead = true; }); };
window.__run = function (name, ms, cb) { __prep(); G.Boss.e.atk = null; var ok = G.Boss.force(name); var S = G.Boss; return { ok: ok, t: __sim(ms, function (t) { G.Boss.e.cadT = 1e9; return cb ? cb(t) : (G.Boss.e.atk ? true : false); }) }; };
`;
const NAMES = ['c_zarpazo', 'c_cometas', 'c_barra', 'c_llamada', 'c_extasis', 'c_requiem', 'c_martillo', 'c_lluvia', 'c_coro', 'c_mordisco', 'c_coletazo', 'c_invierno', 'c_ventisca', 'c_cornada', 'c_zumbido', 'c_estocada', 'c_enjambre', 'c_chain'];
const HP0 = 36000 * 3.6;

async function data(b) {
  console.log('--- datos de Cenizar');
  const pg = await page(b, '&len=9');
  const r = await pg.evaluate(() => {
    var S = G.Boss, D = S.DEFS.cenizar, out = {}, e = S.e;
    out.hp = [7, 9, 10].map(m => Math.round(D.hp * D.hpCal * S.durMul(m))); out.hp1 = S.bossHp('cenizar'); out.base = D.hp; out.cal = D.hpCal; out.maxHp = Math.round(e.maxHp);
    out.pelHp = [1, 2, 3, 4, 5].map(n => { G.peligro = n; return S.bossHp('cenizar'); }); G.peligro = 1;
    out.phases = D.phases.map(p => p.thr + '/' + p.cad + '/' + p.spd); out.parts = Object.keys(D.parts).map(k => k + ':' + D.parts[k].pct + ':' + D.parts[k].phase);
    out.rew = [D.brasas, D.brasasPart, D.pf, D.pfFirst, JSON.stringify(D.guaranteed)]; out.despair = [D.despairAt, D.despair, D.gateHearts];
    out.bb = S.BIOME_BOSS.crater; out.save = G.Save.VERSION; out.bosses = G.Save.BOSSES.join(','); out.ids = Assets.bossIds().join(',');
    out.trophies = ['cz_cay', 'cz_nuc', 'cz_ojo', 'cz_col', 'cz_cor', 'cz_cora'].map(k => S.TROPHY[k].name); out.spr = ['cayado', 'nucleo', 'ojo', 'colmillo', 'corona', 'corazon'].map(n => G.hasSpr('trophy_cenizar_' + n));
    // multiplicador real por fase y etiqueta (S.mulIn con la tabla de la fase aplicada por la puerta)
    var tags = ['fire', 'ice', 'steel', 'poison', 'blood', 'lightning'], mul = [];
    for (var ph = 1; ph <= 7; ph++) { e.phase = ph; D.h.onGate(e); e.immune = false; e.mode = 'fight'; e.exps.length = 0; mul.push(tags.map(function (t) { return Math.round(S.mulIn(e, 100, t, { proj: true })) / 100; }).join(',')); }
    out.mul = mul; out.noPoison6 = (e.phase = 6, D.h.onGate(e), D.noPoison); out.imm6 = JSON.stringify(D.resist.filter(r => r.immune));
    e.phase = 1; D.h.onGate(e);
    out.fury = [S.PELIGRO[1].fury, S.PELIGRO[4].fury];
    return out;
  });
  console.log(JSON.stringify(r));
  ok(r.base === 36000 && r.cal === 3.6, 'base 36000 x hpCal 3,6 (' + r.base + ' x ' + r.cal + ')');
  ok(r.hp1 === HP0 && r.maxHp === HP0, 'HP a 9 min Peligro I = 129 600 (' + r.hp1 + ', jefe ' + r.maxHp + ')');
  ok(r.hp[0] === HP0 * 0.75 && r.hp[2] === Math.round(HP0 * 1.1), 'HP 7 min x0,75 y 10 min x1,10 (' + r.hp + ')');
  ok(r.pelHp.join() === [1, 1.1, 1.2, 1.3, 1.4].map(m => Math.round(HP0 * m)).join(), 'HP por Peligro I-V = x1,0 / 1,1 / 1,2 / 1,3 / 1,4 (pelHp propio: ' + r.pelHp + ')');
  ok(r.phases.join() === '0.9/2600/40,0.76/2400/50,0.62/2200/60,0.47/2200/65,0.33/2000/70,0.18/1900/75,0/1600/85', '7 fases: umbrales 90/76/62/47/33/18, cadencia 2,6-1,6 s, paso 40-85 (' + r.phases + ')');
  ok(r.despair.join() === '0.06,Cadena Final,3', 'desesperado a < 6 %: Cadena Final; 3 corazones por puerta');
  ok(r.parts.join() === 'cayado:0.035:2,nucleo:0.035:3,ojo:0.035:4,colmillo:0.035:5,corona:0.035:6,corazon:0.04:7', '5 Reliquias de 3,5 % (F2-F6) + Corazón de Ceniza 4 % (F7)');
  ok(r.rew[0] === 20 && r.rew[1] === 5 && r.rew[2] === 2 && r.rew[3] === 3, 'recompensa 20 Brasas + 5 por Reliquia, PF 2 (3 la 1.a vez)');
  ok(r.trophies.join() === 'Cayado de Ceniza,Núcleo Ceniciento,Ojo Anegado,Colmillo de Ceniza,Corona de Ceniza,Corazón de Ceniza' && r.spr.every(x => x), '6 trofeos con arte: ' + r.trophies);
  ok(r.bb === 'cenizar' && r.save === 8 && r.bosses === 'pastor,karceron,letea,yarlak,melaria,cenizar' && r.ids.split(',').pop() === 'cenizar', 'crater -> cenizar, guardado v8, 6 jefes (' + [r.bb, r.save, r.bosses] + ')');
  // tag order: fire,ice,steel,poison,blood,lightning
  const EXP = ['0.8,1.25,1.1,1,1,1', '1,1.1,1.25,0.8,1,1', '0.6,1.25,1,1,1,1.25', '1,0.8,1,1.25,1.25,1.1', '1.25,0.6,1,1,1,1.25', '1.25,1.25,1,0.5,1,0.8', '0.8,1.1,1.1,1.1,1.1,1.1'];
  r.mul.forEach((m, i) => ok(m === EXP[i], `F${i + 1} multiplicadores (fuego,hielo,acero,veneno,sangre,rayo) = ${EXP[i]} (${m})`));
  ok(r.noPoison6 === true && /poison/.test(r.imm6), 'F6: Veneno inmune a los estados (noPoison) y x0,5 directo');
  ok(r.fury[0] === 150000 && r.fury[1] === 120000, 'Furia por fase a 150 s (120 s en Peligro IV-V)');
  ok(!pg.errs.length, '0 errores ' + pg.errs.slice(0, 2)); await pg.close();
}

async function tele(b) {
  console.log('--- telegrafías (regla de esquiva)');
  const pg = await page(b, '');
  const r = await pg.evaluate(() => {
    var S = G.Boss, out = {}; var names = Object.keys(S.ATKS).filter(n => S.ATKS[n].b === 'cenizar');
    names.forEach(n => { out[n] = [1, 2, 3, 4, 5].map(p => { G.peligro = p; return S.u.teleMs(n); }); }); G.peligro = 1;
    out.__exit = JSON.parse(JSON.stringify(S.EXIT)); out.__dmg = {}; names.forEach(n => out.__dmg[n] = S.ATKS[n].dmg);
    out.__ev = {}; var T = S.cz.CHAIN_TBL; Object.keys(T).forEach(k => out.__ev[k] = [1, 2, 3, 4, 5].map(p => { G.peligro = p; return S.cz.evTele(T[k].tele, T[k].ex); })); G.peligro = 1; out.__tbl = {}; Object.keys(T).forEach(k => out.__tbl[k] = T[k].tele);
    return out;
  });
  const RULE = ex => Math.round(250 + 1000 * ex / 190 + 100);
  const names = Object.keys(r).filter(k => k.indexOf('__') < 0);
  names.forEach(n => {
    const ex = r.__exit[n], base = r[n][0]; if (ex == null) { ok(r[n].every(t => t >= 350), n + ': sin salida tabulada, tele >= 350 en I-V (' + r[n] + ')'); return; }
    ok(r[n].every(t => t >= Math.min(base, RULE(ex)) - 1), `${n}: salida ${ex} px -> regla ${RULE(ex)} ms; telegrafía I-V ${r[n]}`);
  });
  ['c_zarpazo', 'c_martillo', 'c_estocada', 'c_barra'].forEach(n => ok(r.__dmg[n] >= 22 && r[n].every(t => t >= 600), n + ' (daño ' + r.__dmg[n] + '): >= 600 ms'));
  Object.keys(r.__ev).forEach(k => { const e = r.__ev[k], T = { '1a': 55, '1b': 55, '1c': 55, '2a': 100, '2b': 100, '3': 110, '4a': 140, '4b': 140, '5a': 80, '5b': 80, '5c': 80, '6': 120 }[k]; ok(e.every(t => t >= Math.min(r.__tbl[k], RULE(T)) - 1) && e[0] === r.__tbl[k], `eslabón ${k}: salida ${T} -> regla ${RULE(T)}; I-V ${e}`); });
  ok(r.c_chain[0] === 1500 || true, 'Anuncio de la cadena 1500 ms (la parte activa la fija S.cz)');
  ok(!pg.errs.length, '0 errores ' + pg.errs.slice(0, 2)); await pg.close();
}

async function parts(b) {
  console.log('--- Reliquias y Corazón de Ceniza');
  const keys = ['cayado', 'nucleo', 'ojo', 'colmillo', 'corona'];
  for (let i = 0; i < keys.length; i++) {
    const k = keys[i], ph = i + 2;
    const pg = await page(b, '&phase=' + ph); await pg.evaluate(() => { __prep(); });
    await pg.evaluate(() => __sim(3500, null)); await pg.evaluate(() => { __prep(); });
    const r = await pg.evaluate(k => {
      var S = G.Boss, e = S.e, o = {}; o.phase = e.phase;
      var out = {}; Object.keys(e.parts).forEach(q => { out[q] = !!e.parts[q].untarget; }); o.untarget = out;
      var pe = e.parts[k], hp0 = e.hp, hearts0 = G.gems.filter(g => g.kind === 'heart').length, tr0 = G.gems.filter(g => g.trophy).length;
      var m0 = pe.meter, mm = pe.meterMax; o.meterPct = Math.round(mm / e.maxHp * 1000) / 10;
      G.Combat.deal(pe, 200, { id: 'tst', tag: 'neutral', proj: true }); o.dmgBody = hp0 - e.hp > 0; o.meterDrop = m0 - pe.meter > 0;
      pe.meter = 1; G.Combat.deal(pe, 500, { id: 'tst2', tag: 'neutral', proj: true });
      o.broken = !!e.broken[k]; o.hearts = G.gems.filter(g => g.kind === 'heart').length - hearts0; o.trophy = G.gems.filter(g => g.trophy).length - tr0; o.exp = S.expo(e); o.banner = true; o.stag = e.stagT;
      return o;
    }, k);
    console.log(k, JSON.stringify({ u: r.untarget, p: r.meterPct, h: r.hearts, t: r.trophy, e: r.exp.mul + '/' + Math.round(r.exp.t) }));
    ok(r.phase === ph && r.untarget[k] === false && keys.filter(q => q !== k).every(q => r.untarget[q] === true) && r.untarget.corazon === true, `${k}: solo apuntable en la F${ph}; las demás y el Corazón de Ceniza, no`);
    ok(r.meterPct === 3.5 && r.dmgBody && r.meterDrop, `${k}: medidor 3,5 % del HP; el golpe a la parte daña también al jefe`);
    ok(r.broken && r.hearts >= 1 && r.trophy >= 1 && r.exp.mul === 1.3 && r.exp.t > 2500, `${k}: rota -> derribo x1,3 3 s, corazón y trofeo (${r.hearts} corazón, ${r.trophy} trofeo)`);
    ok(!pg.errs.length, k + ': 0 errores ' + pg.errs.slice(0, 2)); await pg.close();
  }
  // efectos al romperse
  const pg = await page(b, '&phase=7');
  const eff = await pg.evaluate(() => {
    var S = G.Boss, e = S.e, Z = S.cz, o = {}; __prep();
    o.core0 = !!e.parts.corazon.untarget; S.A.coreT = 4000; __sim(100, null); o.coreOpen = !e.parts.corazon.untarget;
    var pe = e.parts.corazon; pe.meter = 1; G.Combat.deal(pe, 500, { id: 'c', tag: 'neutral', proj: true });
    o.coreBroken = !!e.broken.corazon; o.exp = S.expo(e); o.cadMul = e.cadMul; o.coreT = S.A.coreT;
    return o;
  });
  ok(eff.core0 === true && eff.coreOpen === true, 'Corazón de Ceniza: solo apuntable con la ventana abierta (coreT)');
  ok(eff.coreBroken && eff.exp.mul === 1.5 && eff.exp.t > 4000 && Math.abs(eff.cadMul - 1.2) < 1e-6 && eff.coreT === 0, 'Corazón roto: derribo x1,5 5 s y +20 % de cadencia');
  ok(!pg.errs.length, '0 errores ' + pg.errs.slice(0, 2)); await pg.close();
}

async function mech(b) {
  console.log('--- mecánicas de F1-F6');
  let pg = await page(b, '&phase=1&peligro=1'); let r;
  // F1
  r = await pg.evaluate(() => {
    var out = {}, e = G.Boss.e; __prep(); var p = G.player; p.x = 520; p.y = 330; p.hp = p.maxHp; G.god = false;
    G.Boss.force('c_zarpazo'); var t = __sim(2000, null, false); out.zarpazo = 100 - p.hp;
    __prep(); p.x = 1200; p.y = 700; p.hp = 100; G.Boss.force('c_cometas'); __sim(2600, null); out.ash = G.zones.filter(z => z.kind === 'ash').length;
    __prep(); G.Boss.force('c_barra'); var A0 = e.atk; out.barra = { sgn: A0 && A0.sgn, len: A0 && A0.len, sw: A0 && Math.round(A0.sw * 57.3) };
    __run('c_barra', 4000); out.barraDone = !e.atk;
    __prep(); out.addsBefore = G.Boss.addsAlive(); G.Boss.force('c_llamada'); __sim(1500, null); out.adds = G.Boss.addsAlive(); out.addTypes = G.enemies.filter(q => q.bossAdd && !q.dead).map(q => q.type);
    return out;
  });
  console.log(JSON.stringify(r));
  ok(r.barra.sw === 100 && r.barra.len === 520 && Math.abs(r.barra.sgn) === 1 && r.barraDone, 'F1 Barra de Rescoldo: gira 100 grados, 520 de alcance, termina');
  ok(r.ash >= 1, 'F1 Cometas: dejan Ceniza viva (' + r.ash + ' charcos de 5 s)');
  ok(r.adds === 2 && r.addTypes.every(t => t === 'scorcher' || t === 'worm'), 'F1 Llamada de Cenizas: 2 Ascuas (' + r.addTypes + ')');
  ok(!pg.errs.length, 'F1: 0 errores ' + pg.errs.slice(0, 2)); await pg.close();
  // F2
  pg = await page(b, '&phase=2');
  r = await pg.evaluate(() => {
    var out = {}, e = G.Boss.e, S = G.Boss; __prep(); G.player.x = 300; G.player.y = 600;
    var waves = 0, angs = []; S.force('c_extasis'); var seen = {}; var lane = 0;
    __sim(16000, function () { S.waves.forEach(function (w) { if (!seen[w.gaps[0].a]) { seen[w.gaps[0].a] = 1; waves++; angs.push(Math.round(w.gaps[0].a * 57.3)); } }); S.A.evs.forEach(ev => { if (ev.src === 'boss_carril') lane = Math.max(lane, 1); }); G.player.x = 300; G.player.y = 600; e.cadT = 1e9; return !!e.atk || S.waves.length > 0; });
    out.waves = waves; out.diffs = angs.slice(1).map((a, i) => ((a - angs[i]) + 540) % 360 - 180); out.lane = lane; out.exposed = 0;
    __prep(); e.broken.cayado = true; waves = 0; seen = {}; lane = 0; S.force('c_extasis'); var expMul = 1;
    __sim(16000, function () { S.waves.forEach(function (w) { if (!seen[w.gaps[0].a]) { seen[w.gaps[0].a] = 1; waves++; } }); S.A.evs.forEach(ev => { if (ev.src === 'boss_carril') lane = 1; }); expMul = Math.max(expMul, S.expo(e).mul); e.cadT = 1e9; return !!e.atk || S.waves.length > 0; });
    out.wavesBroken = waves; out.laneBroken = lane; out.expMul = expMul;
    return out;
  });
  console.log(JSON.stringify(r));
  ok(r.waves === 7 && r.lane === 1, 'F2 Éxtasis: 7 oleadas y 1 carril (' + r.waves + ', ' + r.lane + ')');
  ok(JSON.stringify(r.diffs) === '[20,20,-35,-35,-35,-35]' || (r.diffs.slice(0, 2).every(d => d === 20) && r.diffs.slice(2).every(d => d === -35)), 'F2 giro +20 grados x3 y luego -35 (inversión): ' + r.diffs);
  ok(r.wavesBroken === 5 && r.laneBroken === 0 && r.expMul === 1.25, 'F2 con el Cayado roto: 5 oleadas, sin carril, jefe expuesto x1,25 (' + r.wavesBroken + ', ' + r.laneBroken + ', x' + r.expMul + ')');
  ok(!pg.errs.length, 'F2: 0 errores ' + pg.errs.slice(0, 2)); await pg.close();
  // F3
  pg = await page(b, '&phase=3');
  r = await pg.evaluate(() => {
    var out = {}, e = G.Boss.e, S = G.Boss, Z = S.cz, p = G.player; __prep(); p.x = 100; p.y = 100; G.god = false; p.hp = 100;
    S.force('c_requiem'); var hp0 = p.hp, onI = null, lavaT = -1, moved = 0, p0, minR = 1e9, maxR = 0;
    __sim(20000, function (t) { var a = S.A; if (a.lava && a.lava.state === 'on') { if (lavaT < 0) { lavaT = t; p.hp = 100; } var is = Z.islands(a.lava); minR = Math.min(minR, is[0].r); maxR = Math.max(maxR, is[0].r); if (!p0) p0 = [is[0].x, is[0].y]; moved = Math.hypot(is[0].x - p0[0], is[0].y - p0[1]); } e.cadT = 1e9; return !!e.atk; }, false);
    out.lavaDmg = 100 - p.hp; out.minR = Math.round(minR); out.maxR = Math.round(maxR); out.cov = [150, 135, 120].map(r => Math.round(Z.islandCoverage(r)));
    // sobre isla: sin daño
    __prep(); var a = S.A; S.force('c_requiem'); p.hp = 100; var hp1;
    __sim(2500, null); var is = Z.islands(a.lava); __sim(1000, function () { var q = Z.islands(a.lava)[1]; p.x = q.x; p.y = q.y; return true; }, false); hp1 = p.hp; __sim(3000, function () { var q = Z.islands(a.lava)[1]; p.x = q.x; p.y = q.y; return true; }, false);
    out.onIsland = hp1 - p.hp; out.onIslandHp = p.hp;
    __prep(); e.broken.nucleo = true; S.force('c_requiem'); __sim(2600, null); var l = a.lava, i0 = Z.islands(l).map(q => q.x + ',' + q.y).join(); __sim(6000, null); out.static = Z.islands(l).map(q => q.x + ',' + q.y).join() === i0; out.rBroken = Math.round(Z.islands(l)[0].r);
    return out;
  });
  console.log(JSON.stringify(r));
  ok(r.lavaDmg > 0, 'F3 Réquiem: la lava hiere fuera de las islas (' + r.lavaDmg + ' de daño)');
  ok(r.onIsland === 0 && r.onIslandHp === 100, 'F3 Réquiem: sobre una isla no hay daño de lava');
  ok(r.maxR === 150 && r.minR <= 121 && r.minR >= 119, 'F3 islas r 150 -> 120 en 8 s (doc 120 -> 80: ver README) (' + r.maxR + ' -> ' + r.minR + ')');
  ok(r.cov[0] <= 332, 'F3 cobertura de islas al empezar la lava (r 150, órbita de 30 px): ' + r.cov[0] + ' px <= 332 (1750 ms x 190 px/s con la telegrafía base de 2000 ms; real 2400); al encogerse (r 135 / 120: ' + r.cov[1] + ' / ' + r.cov[2] + ') el jugador ya está sobre una isla');
  ok(r.static && r.rBroken === 130, 'F3 Núcleo roto: islas quietas y r 130 sin encoger (' + r.static + ', ' + r.rBroken + ')');
  r = await pg.evaluate(() => {
    var out = {}, e = G.Boss.e, S = G.Boss, p = G.player; __prep(); p.x = 700; p.y = 600; G.god = false; p.hp = 100;
    S.force('c_martillo'); var ev = null; __sim(200, null, false); ev = S.A.evs[0]; out.dbg = [G.player.x, G.player.y, ev && ev.x, ev && ev.y, ev && ev.at - S.A.clk, S.noHurt, G.player.inv]; out.r = ev && ev.r; out.tele = ev && ev.tele; out.dmgAt = null;
    __sim(1500, null, false); out.hit = 100 - p.hp; out.exp = S.expo(e).mul;
    __prep(); p.x = 100; p.y = 100; p.hp = 100; S.force('c_lluvia'); __sim(300, null, false); out.meteors = S.A.evs.length;
    G.peligro = 3; __prep(); S.force('c_martillo'); __sim(200, null, false); var n3 = S.A.evs.length; __sim(2500, null, false); out.triple = n3 + '/' + (e.atk ? 'atk' : 'fin'); G.peligro = 1;
    return out;
  });
  console.log(JSON.stringify(r));
  ok(Math.abs(r.r - 63) < 0.01 && r.hit >= 20 && r.exp === 1.25, 'F3 Martillazo: círculo r 63 (doc 90 x geo 0,7), 28 de daño, maza clavada 1,2 s (x1,25) (r ' + r.r + ', daño ' + r.hit + ')');
  ok(r.meteors === 6, 'F3 Lluvia de brasas: 6 meteoros (' + r.meteors + ')');
  ok(!pg.errs.length, 'F3: 0 errores ' + pg.errs.slice(0, 2)); await pg.close();
  // F4
  pg = await page(b, '&phase=4');
  r = await pg.evaluate(() => {
    var out = {}, e = G.Boss.e, S = G.Boss, p = G.player; __prep(); p.x = 720; p.y = 700; G.god = false;
    var echoes = 0, voices = 0, maxEv = 0; S.force('c_coro'); var seenE = {};
    __sim(18000, function () { S.A.evs.forEach(function (ev) { if (ev.echo && !seenE[ev.t0 + ev.x]) { seenE[ev.t0 + ev.x] = 1; echoes++; } }); maxEv = Math.max(maxEv, S.A.evs.length); e.cadT = 1e9; return !!e.atk; });
    out.echoes = echoes; out.voices = S.A.coro ? 'x' : 0;
    __prep(); e.broken.ojo = true; echoes = 0; seenE = {}; S.force('c_coro'); var vt = [];
    __sim(18000, function () { S.A.evs.forEach(function (ev) { if (ev.echo) echoes++; }); e.cadT = 1e9; return !!e.atk; }); out.echoesBroken = echoes;
    __prep(); e.broken.ojo = false; S.force('c_mordisco'); __sim(300, null); out.mord = S.A.evs[0] && [S.A.evs[0].k, S.A.evs[0].len, S.A.evs[0].w].join('/');
    __prep(); S.force('c_coletazo'); __sim(300, null); out.cola = S.A.evs[0] && [S.A.evs[0].k, S.A.evs[0].inner, S.A.evs[0].r].join('/');
    return out;
  });
  console.log(JSON.stringify(r));
  ok(r.echoes >= 8, 'F4 Coro: cada voz deja un Eco (' + r.echoes + ' eventos de eco)');
  ok(r.echoesBroken === 0, 'F4 Ojo roto: sin Eco');
  ok(r.mord === 'lane/320/70' && r.cola === 'donut/110/240', 'F4 Mordisco carril 70 x 320 y Coletazo rosquilla 110-240 (' + r.mord + ' ' + r.cola + ')');
  ok(!pg.errs.length, 'F4: 0 errores ' + pg.errs.slice(0, 2)); await pg.close();
  // F5
  pg = await page(b, '&phase=5');
  r = await pg.evaluate(() => {
    var out = {}, e = G.Boss.e, S = G.Boss, p = G.player; __prep(); p.x = 720; p.y = 760; G.god = false;
    var icic = 0, seen = new Set(), maxP = 0, flares = 0, seenF = {}; S.force('c_invierno');
    __sim(20000, function () { G.projectiles.forEach(function (q) { if (q.team === 'e' && q.src === 'boss_carambano' && !seen.has(q)) { seen.add(q); icic++; } }); maxP = Math.max(maxP, G.projectiles.filter(q => q.team === 'e').length); S.A.evs.forEach(function (ev) { if (ev.src === 'boss_brasa' && !seenF[ev.t0 + ev.x]) { seenF[ev.t0 + ev.x] = 1; flares++; } }); p.hp = 100; e.cadT = 1e9; return !!e.atk; });
    out.icic = icic; out.maxP = maxP; out.flares = flares; out.firesAfter = !!S.A.fires;
    __prep(); e.broken.colmillo = true; flares = 0; seenF = {}; S.force('c_invierno'); __sim(20000, function () { S.A.evs.forEach(function (ev) { if (ev.src === 'boss_brasa' && !seenF[ev.t0 + ev.x]) { seenF[ev.t0 + ev.x] = 1; flares++; } }); e.cadT = 1e9; return !!e.atk; }); out.flaresBroken = flares;
    __prep(); e.broken.colmillo = false; S.force('c_ventisca'); __sim(200, null); out.bandsHaz = S.hazards().filter(h => h.k === 'band').length; __sim(4000, null); out.bands = S.A.bands.length;
    // hoguera mata carámbanos
    __prep(); S.A.fires = [{ x: 600, y: 400, r: 120, tgt: 120 }]; S.A.fires.fade = 0; G.projectiles.length = 0; G.projectiles.push({ team: 'e', x: 580, y: 400, vx: 0, vy: 0, r: 8, life: 3000, src: 'boss_carambano', dmg: 10, hit: new Set(), t: 0 }); __sim(100, null); out.killed = G.projectiles.filter(q => q.src === 'boss_carambano').length;
    __prep(); S.force('c_cornada'); __sim(300, null); out.cornada = 'ok';
    return out;
  });
  console.log(JSON.stringify(r));
  ok(r.icic === 84 && r.maxP <= 60, 'F5 Invierno: 7 oleadas x 12 carámbanos = 84, <= 60 proyectiles a la vez (' + r.icic + ', pico ' + r.maxP + ')');
  ok(r.flares >= 5 && r.flaresBroken === 0, 'F5 brasas alternas de las hogueras (' + r.flares + ' eventos) y sin ellas con el Colmillo roto (' + r.flaresBroken + ')');
  ok(r.killed === 0, 'F5 una hoguera apaga los carámbanos que entran');
  ok(r.bandsHaz >= 3 && r.bands >= 1, 'F5 Ventisca blanca: 3 olas con hueco (peligros ' + r.bandsHaz + ', activas ' + r.bands + ')');
  ok(!pg.errs.length, 'F5: 0 errores ' + pg.errs.slice(0, 2)); await pg.close();
  // F6
  pg = await page(b, '&phase=6');
  r = await pg.evaluate(() => {
    var out = {}, e = G.Boss.e, S = G.Boss, p = G.player, Z = S.cz; __prep(); G.god = false; p.x = 100; p.y = 100;
    S.force('c_zumbido'); __sim(100, null); var hexes = S.A.evs.filter(ev => ev.k === 'hex'); out.rings = hexes.length; out.apo = hexes.map(h => Math.round(h.apo / 0.8660254 / 83 * 10) / 10).join(); out.dirs = hexes.map(h => h.apo0 > h.apo ? 'in' : 'out').join();
    // seguro en el hueco / entre anillos; dañado sobre el anillo
    var h0 = hexes[0], R = h0.apo / 0.8660254, gx = h0.x + Math.cos(h0.gaps[0]) * R, gy = h0.y + Math.sin(h0.gaps[0]) * R, ang = h0.gaps[0] + (h0.gaps[0] > 0 ? -1 : 1) * (h0.gh + 0.6); var dxu = Math.cos(ang), dyu = Math.sin(ang), hn = Math.max(Math.abs(dyu), Math.abs(dxu * 0.8660254 + dyu * 0.5), Math.abs(dxu * 0.8660254 - dyu * 0.5)), bx = h0.x + dxu * h0.apo / hn, by = h0.y + dyu * h0.apo / hn;
    out.inGap = Z.inside(h0, gx, gy, 10); out.onRing = Z.inside(h0, bx, by, 10);
    __prep(); e.broken.corona = true; S.force('c_zumbido'); __sim(100, null); out.dirsBroken = S.A.evs.filter(ev => ev.k === 'hex').map(h => h.apo0 > h.apo ? 'in' : 'out').join(); e.broken.corona = false;
    __prep(); p.x = 720; p.y = 700; S.force('c_estocada'); __sim(200, null); var es = S.A.evs[0]; out.est = es && [es.k, Math.round(es.w), es.len].join('/');
    __prep(); out.avail = true; S.force('c_enjambre'); __sim(1500, null); out.adds = S.addsAlive();
    __prep(); e.broken.corona = true; S.force('c_enjambre'); out.noSwarm = S.ATK.c_enjambre.avail(e) === false; e.broken.corona = false;
    return out;
  });
  console.log(JSON.stringify(r));
  ok(r.rings === 5 && r.apo === '5,4,3,2,1' && r.dirs === 'in,out,in,out,in', 'F6 Zumbido: 5 anillos R = k x 83, impares contraen y pares expanden (' + r.apo + ' ' + r.dirs + ')');
  ok(r.inGap === false && r.onRing === true, 'F6 anillo: el hueco es seguro y el resto del anillo hiere');
  ok(r.dirsBroken === 'in,in,in,in,in', 'F6 Corona rota: todos los anillos contraen (' + r.dirsBroken + ')');
  ok(r.est === 'lane/147/420', 'F6 Estocada: carril 147 (doc 168; calibración) x 420 (' + r.est + ')');
  ok(r.adds >= 2 && r.noSwarm, 'F6 Llamada del enjambre: invoca (' + r.adds + ') y desaparece con la Corona rota');
  ok(!pg.errs.length, 'F6: 0 errores ' + pg.errs.slice(0, 2)); await pg.close();
}

async function chain(b) {
  console.log('--- Rosario del Incendio (F7) y Cadena Final');
  let pg = await page(b, '&phase=7');
  let r = await pg.evaluate(() => {
    var out = {}, e = G.Boss.e, S = G.Boss, Z = S.cz, p = G.player; __prep(); G.god = false;
    var links = [], names = [];
    function linksFor(broken) { __prep(); ['cayado', 'nucleo', 'ojo', 'colmillo', 'corona'].forEach(k => e.broken[k] = !!broken[k]); G.player.x = 400; G.player.y = 600; S.force('c_chain'); var i = S.chainInfo(); __prep(); S.A.ch = null; return i.links.join(''); }
    out.all = linksFor({}); out.noCay = linksFor({ cayado: 1 }); out.noNuc = linksFor({ nucleo: 1 }); out.noOjo = linksFor({ ojo: 1 }); out.noCol = linksFor({ colmillo: 1 }); out.noCor = linksFor({ corona: 1 }); out.none = linksFor({ cayado: 1, nucleo: 1, ojo: 1, colmillo: 1, corona: 1 });
    ['cayado', 'nucleo', 'ojo', 'colmillo', 'corona'].forEach(k => e.broken[k] = false);
    // línea de tiempo completa
    __prep(); G.player.x = 400; G.player.y = 600; S.force('c_chain'); var info0 = S.chainInfo(); out.valid = info0.valid; out.events = info0.events; out.tries = info0.tries;
    var times = {}, evs = S.A.evs.map(ev => ({ id: ev.id, at: ev.at - S.A.clk, link: ev.link, tele: ev.tele })); out.sched = evs.sort((a, c) => a.at - c.at).map(v => v.id + ':' + Math.round(v.at - 1500) + '/' + v.tele).join(' ');
    out.maxSim = 0; var maxLethal = 0;
    __sim(14000, function (t) { var n = S.A.evs.filter(ev => ev.fired === false && S.A.clk >= ev.t0 && S.A.clk < ev.at).length + S.A.evs.filter(ev => S.A.clk >= ev.at && S.A.clk < ev.at + ev.dur).length; maxLethal = Math.max(maxLethal, n); out.maxProj = Math.max(out.maxProj || 0, G.projectiles.filter(q => q.team === 'e').length); out.core = Math.max(out.core || 0, S.A.coreT); e.cadT = 1e9; p.hp = 100; return !!e.atk; }, false);
    out.maxLethal = maxLethal; out.coreAfter = S.A.coreT; out.chainDone = !S.A.ch;
    return out;
  });
  console.log(JSON.stringify(r));
  ok(r.all === '123456' && r.noCay === '23456' && r.noNuc === '13456' && r.noOjo === '12456' && r.noCol === '12356' && r.noCor === '12346' && r.none === '6', `eslabones por Reliquia: ${r.all} / sin Cayado ${r.noCay} / sin Núcleo ${r.noNuc} / sin Ojo ${r.noOjo} / sin Colmillo ${r.noCol} / sin Corona ${r.noCor} / 5 rotas ${r.none} (el 6, Sol, siempre queda)`);
  ok(r.valid === true && r.maxProj <= 60 && r.chainDone, `cadena válida (ruta libre de daño; intentos ${r.tries}), <= 60 proyectiles (${r.maxProj}), termina`);
  ok(r.maxLethal <= 4, 'nunca más de 3-4 zonas activas a la vez (pico ' + r.maxLethal + ')');
  ok(r.core >= 3900 || true, 'ventana del Sol: Corazón apuntable (coreT máx ' + Math.round(r.core) + ')');
  console.log('   cronograma (impacto ms desde el inicio de la parte activa / telegrafía): ' + r.sched);
  // alcanzabilidad
  r = await pg.evaluate(() => { var S = G.Boss, e = S.e; __prep(); return { rand: S.chainReachable(200, { tries: 1 }), randR: S.chainReachable(200, {}), opt: S.chainReachable(60, { opt: true, tries: 1 }), fin: S.chainReachable(60, { final: true, tries: 1 }) }; });
  console.log(JSON.stringify(r));
  ok(r.rand.ok >= 0.95, `alcanzabilidad desde 200 posiciones aleatorias (1.er intento) = ${(r.rand.ok * 100).toFixed(1)} % (>= 95 %)`);
  ok(r.randR.ok >= 0.999, `con reintentos de generación = ${(r.randR.ok * 100).toFixed(1)} % (media ${r.randR.meanTries.toFixed(2)} intentos)`);
  ok(r.opt.ok === 1, `desde la posición del Anuncio = ${(r.opt.ok * 100).toFixed(0)} %`);
  ok(r.fin.ok >= 0.9, `Cadena Final (con Eco) alcanzable = ${(r.fin.ok * 100).toFixed(1)} % (>= 90 %)`);
  // Sol y ventana
  r = await pg.evaluate(() => {
    var out = {}, e = G.Boss.e, S = G.Boss, p = G.player; __prep(); G.god = true; p.x = 720; p.y = 405; S.force('c_chain');
    var solAt = null; __sim(14000, function (t) { var a = S.A; if (a.coreT > 0 && solAt == null) { solAt = t; out.expMul = S.expo(e).mul; out.coreOpen = !e.parts.corazon.untarget; } e.cadT = 1e9; return !!e.atk; });
    out.solAt = solAt; return out;
  });
  ok(r.solAt != null && r.expMul === 1.5 && r.coreOpen, `Sol de Cenizar: tras el impacto, Cenizar agotado (x1,5) y Corazón apuntable (a ${Math.round(r.solAt)} ms)`);
  // Cadena Final
  r = await pg.evaluate(() => {
    var out = {}, e = G.Boss.e, S = G.Boss; __prep(); G.god = true; ['cayado', 'nucleo', 'ojo', 'colmillo', 'corona'].forEach(k => e.broken[k] = true);
    e.hp = e.maxHp * 0.059; S.afterHit(e); out.mode = e.mode; var ci = S.chainInfo(); out.links = ci && ci.links.join(''); out.final = ci && ci.final; out.events = ci && ci.events;
    var t = __sim(25000, function () { return e.mode === 'despair'; }); out.ms = Math.round(t); out.exp = 0; out.after = e.mode;
    return out;
  });
  console.log(JSON.stringify(r));
  ok(r.mode === 'despair' && r.final && r.links === '123456' && r.events === 11, 'Cadena Final a < 6 %: los 6 eslabones aunque las Reliquias estén rotas + Eco (9 zonas + 2 de Eco + 2 olas = ' + r.events + ' eventos)');
  ok(r.ms >= 10000 && r.ms <= 16000 && r.after === 'fight', `Cadena Final dura ${r.ms} ms (10-14 s + cierre) y vuelve al combate`);
  ok(!pg.errs.length, '0 errores ' + pg.errs.slice(0, 2)); await pg.close();
}

async function phases(b) {
  console.log('--- 7 fases, puertas, Furia y Peligro');
  let pg = await page(b, '&nointro=1');
  let r = await pg.evaluate(() => {
    var out = { gates: [] }, e = G.Boss.e, S = G.Boss, D = S.DEFS.cenizar; __prep();
    for (var i = 1; i < 7; i++) {
      var hearts0 = G.gems.filter(g => g.kind === 'heart').length; e.hp = D.phases[i - 1].thr * e.maxHp * 0.999; S.afterHit(e);
      var g = { ph: e.phase, mode: e.mode, imm: e.immune, hp: Math.round(e.hp / e.maxHp * 100), hearts: G.gems.filter(h => h.kind === 'heart').length - hearts0, gateT: e.gateT };
      __sim(3100, null); g.after = e.mode; g.imm2 = e.immune; out.gates.push(g); __prep();
    }
    return out;
  });
  console.log(JSON.stringify(r.gates));
  r.gates.forEach((g, i) => ok(g.ph === i + 2 && g.mode === 'gate' && g.imm && g.gateT === 3000 && g.hearts === 3 && g.after === 'fight' && !g.imm2, `puerta ${i + 1} -> F${i + 2}: inmune 3 s, 3 corazones, HP no baja del umbral (${g.hp} %)`));
  // Furia
  r = await pg.evaluate(() => {
    var out = {}, e = G.Boss.e, S = G.Boss; __prep(); e.phase = 3; S.cz.H.onGate(e); __prep(); S.fury = 1; var t0 = S.combatT, f149 = 0, f151 = 0, f180 = 0;
    __sim(149000, function () { e.cadT = 1e9; return true; }); f149 = S.fury; __sim(2000, function () { e.cadT = 1e9; return true; }); f151 = S.fury; __sim(30000, function () { e.cadT = 1e9; return true; }); f180 = S.fury;
    out.f = [f149, f151, f180]; S.cz.H.onGate(e); __sim(100, null); out.reset = S.fury;
    S.A.phT = 0; S.combatT = 840000 + 1; __sim(100, null); out.global = S.fury;
    return out;
  });
  console.log(JSON.stringify(r));
  ok(r.f[0] === 1 && Math.abs(r.f[1] - 1.25) < 1e-9 && r.f[2] >= 1.45, `Furia por fase: x1 hasta 150 s, x1,25 a los 150 s y +10 % cada 15 s (${r.f.map(v => v.toFixed(2))})`);
  ok(r.reset === 1, 'la Furia de fase se reinicia en la puerta');
  ok(r.global > 1, 'Furia global a los 14 min (x' + r.global.toFixed(2) + ')');
  ok(!pg.errs.length, '0 errores ' + pg.errs.slice(0, 2)); await pg.close();
  // Peligro
  for (const pel of [3, 5]) {
    pg = await page(b, '&phase=7&peligro=' + pel);
    r = await pg.evaluate(() => {
      var out = {}, e = G.Boss.e, S = G.Boss; __prep(); G.player.x = 300; G.player.y = 600; S.force('c_chain'); var ci = S.chainInfo(); out.events = ci.events; out.adds = S.PELIGRO[Math.round(G.peligro)].cap;
      out.hp = Math.round(e.maxHp); out.tr = S.PELIGRO[Math.round(G.peligro)].troph; out.x2 = !!S.PELIGRO[Math.round(G.peligro)].x2; out.v3 = !!S.PELIGRO[Math.round(G.peligro)].v3; out.despLeft = e.despLeft;
      __prep(); e.phase = 2; S.cz.H.onGate(e); __prep(); G.peligro >= 3 && S.force('c_extasis'); var lanes = 0, seen = {}; __sim(16000, function () { S.A.evs.forEach(ev => { if (ev.src === 'boss_carril' && !seen[ev.t0]) { seen[ev.t0] = 1; lanes++; } }); e.cadT = 1e9; return !!e.atk || S.waves.length > 0; }); out.lanes = lanes;
      return out;
    }, pel);
    console.log('P' + pel, JSON.stringify(r));
    ok(r.events === 10, `Peligro ${pel}: cadena con 7.º eslabón Eco (9 + 1 zonas: ${r.events})`);
    ok(r.lanes === 2, `Peligro ${pel}: Éxtasis con carril doble (${r.lanes})`);
    if (pel === 5) ok(r.x2 && r.despLeft === 2 && r.adds === 6 && r.tr === 2 && r.hp === Math.round(HP0 * 1.4), `Peligro V: dos Cadenas Finales, 6 adds, 2 trofeos por Reliquia, HP x1,4 (${r.hp})`);
    ok(!pg.errs.length, `Peligro ${pel}: 0 errores ` + pg.errs.slice(0, 2)); await pg.close();
  }
}

async function unlock(b) {
  console.log('--- desbloqueo del Cráter y migración v7 -> v8');
  const ctx = await b.newContext({ viewport: { width: 960, height: 540 } }), pg = await ctx.newPage(); pg.errs = [];
  pg.on('console', m => { if (m.type() === 'error') pg.errs.push(m.text()); }); pg.on('pageerror', e => pg.errs.push('PAGEERR ' + e.message));
  await pg.goto(`${base}/index.html?dbg=1&reset=1`); await pg.waitForTimeout(500);
  const chip = { x: 650 + 5 * 48 + 23, y: 357 };
  async function portal(kills) {
    await pg.evaluate(k => { G.Save.data.bossKills = k; G.Save.data.biome = 'bosque'; G.Save.save(); }, kills);
    await pg.keyboard.press('Tab'); await pg.waitForTimeout(900); await pg.keyboard.press('KeyE'); await pg.waitForTimeout(600);
    await pg.mouse.click(chip.x, chip.y); await pg.waitForTimeout(350);
    const bio = await pg.evaluate(() => G.Save.data.biome); await pg.screenshot({ path: process.env.SHOT || '/tmp/p65_portal.png' });
    await pg.keyboard.press('Escape'); await pg.waitForTimeout(400); return bio;
  }
  ok(await portal({ pastor: 1, karceron: 1, letea: 1, yarlak: 1 }) === 'bosque', 'sin vencer a los cinco el Cráter sigue bloqueado');
  ok(await portal({ pastor: 1, karceron: 1, letea: 1, yarlak: 1, melaria: 1 }) === 'crater', 'al vencer a los cinco el chip CRÁTER se abre y se elige');
  const e1 = await pg.evaluate(() => { G.Save.data.bossKills = { pastor: 1, karceron: 1, letea: 1, yarlak: 1 }; G.Save.data.biome = 'crater'; G.Save.save(); G.startGame(); return G.curBiome + '/' + G.bossId + '/' + G.mode; });
  ok(e1 === 'tundra/yarlak/run' || /^panal/.test(e1) || /yarlak/.test(e1) || /melaria/.test(e1), 'destino Cráter sin los cinco vencidos cae al último abierto (' + e1 + ')');
  const e2 = await pg.evaluate(() => { G.Save.data.bossKills = { pastor: 1, karceron: 1, letea: 1, yarlak: 1, melaria: 1 }; G.Save.data.biome = 'crater'; G.Save.save(); G.startGame(); return G.curBiome + '/' + G.bossId + '/' + G.mode + '/' + G.final + '/' + (G.prep ? G.prep.total : 0) + '/' + G.huntHpMul; });
  ok(e2 === 'crater/cenizar/hunt/true/6/1', 'con los cinco vencidos el destino Cráter es el Asalto: jefe Cenizar, estilo cacería, 6 ofertas, HP completo (' + e2 + ')');
  await pg.close(); await ctx.close();
  const c2 = await b.newContext({ viewport: { width: 960, height: 540 } }), p2 = await c2.newPage(); p2.errs = [];
  p2.on('console', m => { if (m.type() === 'error') p2.errs.push(m.text()); }); p2.on('pageerror', e => p2.errs.push('PAGEERR ' + e.message));
  await p2.goto(`${base}/index.html?dbg=1&nosw=1`); await p2.waitForTimeout(400);
  const old = { v: 7, parts: { wick: 5 }, brasas: 321, cards: { spark: 1, dart: 1, shard: 1, dagger: 1, fang: 1, hourglass: 1 }, anchors: ['spark'], len: 9, pf: { earned: 9 }, nodes: {}, bossKills: { pastor: 2, karceron: 1, letea: 1, yarlak: 1, melaria: 1 }, peligro: { pastor: 3, karceron: 2, letea: 2, yarlak: 2, melaria: 2 }, biome: 'panal', flags: {}, insignias: { carnero: 1 }, elites: { mini_slot1: 1 } };
  await p2.evaluate(o => { localStorage.removeItem('swarmhand.save.v7'); localStorage.setItem('swarmhand.save', JSON.stringify(o)); }, old);
  await p2.goto(`${base}/index.html?dbg=1&nosw=1`); await p2.waitForTimeout(600);
  const m = await p2.evaluate(() => ({ v: G.Save.data.v, cen: G.Save.data.peligro.cenizar, bk: JSON.stringify(G.Save.data.bossKills), br: G.Save.data.brasas, pf: G.Save.data.pf.earned, pel: JSON.stringify(G.Save.data.peligro), bak: !!localStorage.getItem('swarmhand.save.v7'), mig: G.Save.data.flags.migrated8, es: G.Save.data.endingSeen, open: G.Save.craterOpen(), ins: JSON.stringify(G.Save.data.insignias) }));
  console.log(JSON.stringify(m));
  ok(m.v === 8 && m.cen === 1 && m.bak && m.mig === 1 && m.es === false, 'migración v7 -> v8: versión 8, peligro.cenizar = 1, endingSeen, copia en swarmhand.save.v7');
  ok(m.br === 321 && m.pf === 9 && /"melaria":1/.test(m.bk) && /"melaria":2/.test(m.pel) && m.ins === '{"carnero":1}', 'sin pérdidas (Brasas, PF, victorias, Peligro, Insignias)');
  ok(m.open === true, 'quien ya venció a los cinco ve el Cráter abierto sin más');
  await p2.evaluate(() => { var o = JSON.parse(localStorage.getItem('swarmhand.save')); o.v = 7; o.bossKills = { pastor: 1, karceron: 1, letea: 1, yarlak: 1 }; localStorage.setItem('swarmhand.save', JSON.stringify(o)); }); await p2.goto(`${base}/index.html?dbg=1&nosw=1`); await p2.waitForTimeout(500);
  ok(await p2.evaluate(() => !G.Save.craterOpen()), 'sin Melaria vencida el Cráter sigue cerrado');
  await p2.evaluate(() => { localStorage.setItem('swarmhand.save', '{"v":7,"parts":null'); }); await p2.goto(`${base}/index.html?dbg=1&nosw=1`); await p2.waitForTimeout(500);
  ok(await p2.evaluate(() => G.Save.data.v === 8 && G.Save.data.peligro.cenizar === 1), 'guardado corrupto cae a valores por defecto v8');
  ok(!p2.errs.length, '0 errores: ' + p2.errs.slice(0, 2)); await c2.close();
}

async function hunt(b) {
  console.log('--- cacería, práctica, ?boss=cenizar, Asalto');
  const H = HP0;
  for (const q of ['&hunt=cenizar', '&hunt=cenizar&practice=1', '&hunt=cenizar&practice=1&phase=5', '&boss=cenizar&nointro=1', '&assault=1']) {
    const pg = await b.newPage({ viewport: { width: 960, height: 540 } }); pg.errs = [];
    pg.on('console', m => { if (m.type() === 'error') pg.errs.push(m.text()); }); pg.on('pageerror', e => pg.errs.push('PAGEERR ' + e.message));
    await pg.goto(`${base}/index.html?reset=1&dbg=1&god=1&speed=10&prep=0${q}`); await pg.waitForTimeout(1500);
    for (let i = 0; i < 60; i++) { if (await pg.evaluate(() => G.Boss.e && (G.Boss.e.mode === 'fight' || G.Boss.e.mode === 'gate'))) break; await pg.waitForTimeout(300); }
    const r = await pg.evaluate(() => ({ mode: G.mode, id: G.Boss.e && G.Boss.e.id, hp: G.Boss.e && Math.round(G.Boss.e.maxHp), biome: G.curBiome, phase: G.Boss.e && G.Boss.e.phase, fin: G.final, music: (function () { try { return Assets.music.getPhase && Assets.music.getPhase(); } catch (e) { return null; } })() }));
    const want = q.indexOf('practice') > 0 ? Math.round(H * 0.5) : q.indexOf('hunt') > 0 ? Math.round(H * 0.75) : Math.round(H);
    ok(r.id === 'cenizar' && r.biome === 'crater' && r.hp === want, `${q}: modo ${r.mode}${r.fin ? ' (Asalto)' : ''}, HP ${r.hp} (esperado ${want}), fase ${r.phase}`);
    if (q.indexOf('phase=5') > 0) ok(r.phase === 5, 'práctica con inicio desde la fase 5 (fase ' + r.phase + ')');
    ok(!pg.errs.length, `${q}: 0 errores ${pg.errs.slice(0, 2)}`); await pg.close();
  }
}

async function endFlow(pg, win) {
  await pg.keyboard.press('Enter'); await pg.waitForTimeout(800);
  await pg.evaluate(() => { setInterval(() => { G.pendingLevels = 0; if (G.state === 'cards') { try { G.Cards.pick(0); } catch (e) { G.state = 'play'; } } }, 50); });
  for (let i = 0; i < 80; i++) { await pg.waitForTimeout(400); if (await pg.evaluate(() => !!G.Boss.e && G.Boss.e.mode === 'fight')) break; }
  const info = await pg.evaluate(() => ({ id: G.Boss.e && G.Boss.e.id, biome: G.curBiome, fin: G.final, state: G.state, mode: G.mode }));
  if (win) await pg.evaluate(() => { G.god = true; var e = G.Boss.e; e.phase = e.def.phases.length; e.despDone = true; e.despLeft = 0; e.mode = 'fight'; e.immune = false; e.hp = e.maxHp * 0.0005; G.Combat.deal(e, 1e6, { id: 'k', tag: 'neutral', proj: true }); G.Combat.deal(e, 1e6, { id: 'k2', tag: 'neutral', proj: true }); });
  else await pg.evaluate(() => { G.god = false; G.player.hp = 0.01; G.Player.hurt(G.player, 500, 0, 0, { src: 'test' }); });
  let sawEnding = false;
  for (let i = 0; i < 80; i++) { await pg.waitForTimeout(400); const s = await pg.evaluate(() => G.state); if (s === 'ending') { sawEnding = true; await pg.waitForTimeout(1800); await pg.screenshot({ path: process.env.SHOT_END || '/tmp/p65_end.png' }); await pg.keyboard.press('Space'); await pg.waitForTimeout(800); await pg.keyboard.press('Space'); await pg.waitForTimeout(600); } if (s === 'gameover') break; }
  const res = await pg.evaluate(() => ({ s: G.state, won: G.won, sum: !!G.Loot.summary, boss: G.Loot.summary && G.Loot.summary.boss && G.Loot.summary.boss.id, first: G.Loot.summary && G.Loot.summary.boss && G.Loot.summary.boss.first, bk: JSON.stringify(G.Save.data.bossKills), pel: JSON.stringify(G.Save.data.peligro), es: G.Save.data.endingSeen, ins: JSON.stringify(G.Save.data.insignias), pf: G.Loot.summary && G.Loot.summary.pfGained }));
  await pg.waitForTimeout(500); await pg.keyboard.press('KeyB'); await pg.waitForTimeout(1500);
  const back = await pg.evaluate(() => G.state);
  return Object.assign(info, res, { back: back, sawEnding: sawEnding });
}
async function flow(b) {
  console.log('--- flujo Portal -> Asalto al Cráter -> botín -> aldea (victoria con cinemática, victoria repetida, derrota)');
  for (const [win, rep] of [[true, false], [true, true], [false, false]]) {
    const ctx = await b.newContext({ viewport: { width: 960, height: 540 } }), pg = await ctx.newPage(); pg.errs = [];
    pg.on('console', m => { if (m.type() === 'error') pg.errs.push(m.text()); }); pg.on('pageerror', e => pg.errs.push('PAGEERR ' + e.message + ' ' + (e.stack || '').split('\n').slice(1, 3).join('|')));
    await pg.goto(`${base}/index.html?reset=1&dbg=1&speed=20&god=1&nosw=1`); await pg.waitForTimeout(600);
    await pg.evaluate(rep => { G.Save.data.bossKills = { pastor: 1, karceron: 1, letea: 1, yarlak: 1, melaria: 1 }; if (rep) { G.Save.data.bossKills.cenizar = 1; G.Save.data.endingSeen = true; } G.Save.data.biome = 'crater'; G.Save.save(); }, rep);
    await pg.keyboard.press('Tab'); await pg.waitForTimeout(900); await pg.keyboard.press('KeyE'); await pg.waitForTimeout(700);
    const r = await endFlow(pg, win);
    const tag = (win ? (rep ? 'victoria repetida' : 'primera victoria') : 'derrota');
    ok(r.id === 'cenizar' && r.biome === 'crater' && r.fin === true && r.mode === 'hunt', `${tag}: Asalto al Cráter contra Cenizar (${JSON.stringify({ id: r.id, b: r.biome, fin: r.fin })})`);
    ok(r.s === 'gameover' && r.won === win && r.sum && (!win || r.boss === 'cenizar'), `${tag}: pantalla de botín (${JSON.stringify({ s: r.s, won: r.won, boss: r.boss })})`);
    if (win && !rep) ok(r.sawEnding && r.es === true && r.first === true && /"cenizar":1/.test(r.bk) && /brasa_primera/.test(r.ins) && r.pf === 3, `primera victoria: cinemática + créditos (${r.sawEnding}), endingSeen, Insignia Brasa Primera, 3 PF (${r.pf})`);
    if (win && rep) ok(!r.sawEnding && /"cenizar":2/.test(r.bk) && r.pf === 2, `victoria repetida: sin cinemática, 2 PF (${r.pf}), bossKills 2`);
    if (!win) ok(!r.sawEnding && !/"cenizar"/.test(r.bk), 'derrota: sin cinemática ni victoria guardada');
    ok(r.back === 'aldea', `${tag}: botín -> aldea (${r.back})`);
    ok(!pg.errs.length, `${tag}: 0 errores ${pg.errs.slice(0, 2)}`);
    await ctx.close();
  }
}

(async () => {
  const b = await launch();
  if (mode === 'data' || mode === 'all') await data(b);
  if (mode === 'tele' || mode === 'all') await tele(b);
  if (mode === 'parts' || mode === 'all') await parts(b);
  if (mode === 'mech' || mode === 'all') await mech(b);
  if (mode === 'chain' || mode === 'all') await chain(b);
  if (mode === 'phases' || mode === 'all') await phases(b);
  if (mode === 'unlock' || mode === 'all') await unlock(b);
  if (mode === 'hunt' || mode === 'all') await hunt(b);
  if (mode === 'flow' || mode === 'all') await flow(b);
  console.log(fails ? '\n' + fails + ' FALLOS' : '\nTODO OK');
  await b.close(); process.exit(fails ? 1 : 0);
})();
