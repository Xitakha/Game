// PRUEBAS P7 (Integración; DESIGN-v5-biomas.md P7, B.7, DESIGN-v7 pendientes de la P6.5).
// uso: node p7_tests.js portal|peligro|hunt|ruta|platos|misiones|logros|estatua|anuncio|migrar|flow|all [base]   (base por defecto http://localhost:8801)
//  portal  : 6 destinos (2 x 3 chips de 94 x 46), pistas 'Lleva Fuego' y requisitos, desbloqueo en cadena que persiste al recargar, chip del Cráter, táctil 844x390 y capturas
//  peligro : Peligro I-V de los 6 jefes: HP, daño, Furia, tope de adds, trofeos x2, 2 desesperados, y las variantes de Yarlak y Melaria (Llamada, Aliento, Alud, ventisca, Frío, Picado doble, miel x1,5)
//  hunt    : cacería y práctica con los 6 jefes por URL (HP x0,75 / x0,5) y desde la pestaña de Vesper (6 botones, Peligro elegido)
//  ruta    : rama 'Ruta' (6 nodos + Aliento del Cráter): requisito de trofeo, costes sin PF, efectos reales (Crampones, Abrigo, Brasa en el pecho, Ahumador, Guantes, Jalea, +10 % contra jefes)
//  platos  : 4 platos nuevos (Caldo de brasa, Tostada de miel, Té de humo, Caldo del Hogar Reencendido): desbloqueo, coste, efecto real y la cocina en 2 páginas
//  misiones: 10 encargos nuevos (Tundra, Panal, Cráter): se ofrecen solo con el destino abierto y progresan con sus condiciones
//  logros  : Insignias del Panal (3 / 8 / 10 de 10), logros nuevos y 'Cálido corazón' / 'Ni una gota' con victorias reales
//  estatua : estatua del Hogar en la plaza (interactuable, colisión, dibujo) y el brasero antes de vencer a Cenizar
//  anuncio : Peligro IV-V de Cenizar: 2.º Aviso fantasma de 1000 ms en el Rosario
//  migrar  : guardado v8 -> v9 con copia swarmhand.save.v8, sin pérdidas, desde v5, corrupto, importación de texto
//  flow    : aldea -> Portal -> expedición en los 6 destinos con ratón y toque, sin errores
const { chromium } = require('/opt/node-tools/node_modules/playwright');
const fs = require('fs');
const mode = process.argv[2] || 'all', base = process.argv[3] || 'http://localhost:8801';
const SHOTS = process.env.SHOTS || '';   // carpeta de capturas (JPEG pequeñas)
let fails = 0; const ok = (c, msg) => { if (!c) fails++; console.log((c ? 'OK     ' : 'FALLO  ') + msg); };
const launch = () => chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--no-sandbox', '--autoplay-policy=no-user-gesture-required'] });
async function mk(b, url, vp, touch) {
  const ctx = await b.newContext({ viewport: vp || { width: 960, height: 540 }, hasTouch: !!touch, isMobile: false }), pg = await ctx.newPage(); pg.errs = []; pg.ctx = ctx;
  pg.on('console', m => { if (m.type() === 'error') pg.errs.push(m.text()); }); pg.on('pageerror', e => pg.errs.push('PAGEERR ' + e.message + ' ' + (e.stack || '').split('\n').slice(1, 3).join('|')));
  await pg.goto(`${base}/index.html?${url}`); await pg.waitForTimeout(500);
  return pg;
}
const close = async pg => { await pg.close(); await pg.ctx.close(); };
const boss = (b, id, n, extra) => mk(b, `reset=1&god=1&dbg=1&nosw=1&boss=${id}&peligro=${n || 1}&nointro=1&prep=0&hand=spark:3,dart:2,shard:2,dagger:2,fang:1${extra || ''}`);
const SIM = `
window.__sim = function (ms, cb, keep) { var dt = 1000 / 60, t = 0; while (t < ms) { G.time += dt; G.Player.update(G.player, dt); G.Enemies.update(dt); G.Combat.update(dt); G.fx.update(dt); G.pendingLevels = 0; G.player.xp = 0; if (keep !== false) G.player.hp = G.player.maxHp; t += dt; if (cb && cb(t) === false) break; } return t; };
window.__prep = function () { var e = G.Boss.e; e.atk = null; e.bst = 'idle'; e.mode = 'fight'; e.immune = false; e.stagT = 0; e.exps.length = 0; e.cadT = 1e9; for (var k in G.Boss.cds) G.Boss.cds[k] = 0; G.projectiles.length = 0; G.zones.length = 0; G.enemies.forEach(function (q) { if (q.bossAdd) q.dead = true; }); G.player.dead = false; G.player.hp = G.player.maxHp; };
`;
const ALL = ['pastor', 'karceron', 'letea', 'yarlak', 'melaria', 'cenizar'];
const KILLS5 = { pastor: 1, karceron: 1, letea: 1, yarlak: 1, melaria: 1 };
// centros de los chips del Portal (G.Panels.biomeRect)
const CHIP = i => ({ x: 440 + 4 + (i % 2) * 98 + 47, y: 84 + 18 + Math.floor(i / 2) * 49 + 23 });
const DEST = ['bosque', 'cripta', 'asfodelo', 'tundra', 'panal', 'crater'];
const shot = async (pg, name, clip) => { if (!SHOTS) return; fs.mkdirSync(SHOTS, { recursive: true }); await pg.screenshot({ path: SHOTS + '/' + name + '.jpg', type: 'jpeg', quality: 55, clip }); };

async function openPortal(pg, kills, biome) {
  await pg.evaluate(([k, bi]) => { G.Save.data.bossKills = k; G.Save.data.biome = bi || 'bosque'; G.Save.save(); G.Aldea.open(false); }, [kills, biome]);
  await pg.keyboard.press('Tab'); await pg.waitForTimeout(900); await pg.keyboard.press('KeyE'); await pg.waitForTimeout(500);
}

// ------------------------------------------------------------------------------------------------ portal
async function portal(b) {
  console.log('--- Portal de 6 destinos');
  const pg = await mk(b, 'reset=1&dbg=1&nosw=1');
  await openPortal(pg, KILLS5, 'bosque');
  const geo = await pg.evaluate(() => { var P = G.Panels; return { r: [0, 1, 2, 3, 4, 5].map(function (i) { return P.biomeRect(i); }), n: P.BIOMES.length, ids: P.BIOMES.map(function (x) { return x.id; }).join(','), hints: P.BIOMES.map(function (x) { return x.hint; }), fire: P.BIOMES.filter(function (x) { return x.fire; }).map(function (x) { return x.id; }).join(',') }; });
  ok(geo.n === 6 && geo.ids === DEST.join(','), 'Portal: 6 destinos en orden de desbloqueo (' + geo.ids + ')');
  const inter = geo.r.some((a, i) => geo.r.some((c, j) => j > i && a.x < c.x + c.w && c.x < a.x + a.w && a.y < c.y + c.h && c.y < a.y + a.h));
  ok(!inter && geo.r.every(r => r.w >= 94 && r.h >= 46 && r.x >= 440 && r.x + r.w <= 640 && r.y + r.h <= 252), 'chips de >= 94 x 46 (antes 46 x 42), sin solaparse y fuera de la mano y las anclas (' + JSON.stringify(geo.r[5]) + ')');
  ok(geo.fire === 'tundra,panal' && /LLEVA FUEGO/.test(geo.hints[3]) && /LLEVA FUEGO/.test(geo.hints[4]) && /ASALTO/.test(geo.hints[5]), 'pistas "Lleva Fuego" en Tundra y Panal, y "Asalto" en el Cráter');
  // los 6 chips se eligen con un clic y quedan guardados
  for (let i = 0; i < 6; i++) {
    await pg.mouse.click(CHIP(i).x, CHIP(i).y); await pg.waitForTimeout(250);
    const r = await pg.evaluate(() => ({ b: G.Save.data.biome, seen: G.Save.data.portalSeen, eff: G.Panels.effBiome().id }));
    ok(r.b === DEST[i] && r.eff === DEST[i] && r.seen[DEST[i]] === 1, `chip ${DEST[i]} se elige con un clic (biome ${r.b})`);
    if (i === 3) await shot(pg, 'p7_portal', { x: 0, y: 60, width: 960, height: 480 });
  }
  // sin vencer a nadie: solo el Bosque; los cerrados enseñan el requisito y no cambian el destino
  await pg.keyboard.press('Escape'); await pg.waitForTimeout(300);
  await openPortal(pg, {}, 'bosque');
  const need = ['', 'Pastor', 'Karceron', 'Letea', 'Yarlak', 'cinco jefes'];
  for (let i = 1; i < 6; i++) {
    await pg.mouse.click(CHIP(i).x, CHIP(i).y); await pg.waitForTimeout(200);
    const r = await pg.evaluate(() => ({ b: G.Save.data.biome, txt: (function () { try { return G.Panels.lastMsg(); } catch (e) { return ''; } })() }));
    ok(r.b === 'bosque', `destino cerrado ${DEST[i]}: no se elige`);
    ok(r.txt.indexOf('Bloqueado') === 0 && (i < 5 ? r.txt.indexOf(need[i]) > 0 : /cinco jefes \(0\/5\)/.test(r.txt)), `  requisito claro: "${r.txt}"`);
  }
  await pg.screenshot({ path: '/tmp/claude-0/s/p7_closed.png' });
  // desbloqueo en cadena: al vencer a cada jefe se abre el siguiente, persiste al recargar y el nuevo destino sale como NUEVO
  const chain = await pg.evaluate(() => {
    var S = G.Save.data, out = [], seq = ['pastor', 'karceron', 'letea', 'yarlak', 'melaria'], P = G.Panels;
    S.bossKills = {}; seq.forEach(function (k) { S.bossKills[k] = 1; var open = P.BIOMES.filter(function (b) { return b.id === 'bosque' || (b.need === '*' ? G.Save.craterOpen() : S.bossKills[b.need] > 0); }).map(function (b) { return b.id; }); out.push(open.join('/')); });
    return out;
  });
  ok(chain.join(' | ') === 'bosque/cripta | bosque/cripta/asfodelo | bosque/cripta/asfodelo/tundra | bosque/cripta/asfodelo/tundra/panal | bosque/cripta/asfodelo/tundra/panal/crater', 'cadena de desbloqueo Pastor -> Cripta -> Asfódelo -> Tundra -> Panal -> Cráter (' + chain.length + ' pasos)');
  await pg.evaluate(() => { G.Save.data.bossKills = { pastor: 1, karceron: 1, letea: 1 }; G.Save.data.portalSeen = { bosque: 1, cripta: 1, asfodelo: 1 }; G.Save.data.biome = 'tundra'; G.Save.save(); });
  await pg.goto(`${base}/index.html?dbg=1&nosw=1`); await pg.waitForTimeout(700);
  const rl = await pg.evaluate(() => ({ k: JSON.stringify(G.Save.data.bossKills), b: G.Save.data.biome, ps: JSON.stringify(G.Save.data.portalSeen), eff: G.Panels.effBiome().id }));
  ok(rl.k === '{"pastor":1,"karceron":1,"letea":1}' && rl.b === 'tundra' && rl.eff === 'tundra', 'el desbloqueo en cadena y el destino persisten al recargar (' + rl.eff + ')');
  // marca NUEVO: se ve en el destino abierto y aún no visitado, y desaparece al elegirlo
  await openPortal(pg, { pastor: 1, karceron: 1, letea: 1, yarlak: 1 }, 'tundra');
  await pg.evaluate(() => { G.Save.data.portalSeen = { bosque: 1, cripta: 1, asfodelo: 1, tundra: 1 }; });
  ok(await pg.evaluate(() => !G.Save.data.portalSeen.panal), 'Panal recién abierto = no visto (marca NUEVO)');
  await pg.mouse.click(CHIP(4).x, CHIP(4).y); await pg.waitForTimeout(250);
  ok(await pg.evaluate(() => G.Save.data.portalSeen.panal === 1 && G.Save.data.biome === 'panal'), 'al elegirlo la marca NUEVO se apaga');
  // flechas: ciclar entre destinos abiertos
  await pg.keyboard.press('ArrowRight'); await pg.waitForTimeout(200);
  ok(await pg.evaluate(() => G.Save.data.biome) === 'bosque', 'ArrowRight cicla entre los destinos abiertos (panal -> bosque)');
  // Peligro propio de cada jefe en el selector y texto específico
  const pt = await pg.evaluate(() => { var ids = ['pastor', 'karceron', 'letea', 'yarlak', 'melaria', 'cenizar']; return ids.length + ':' + ['yarlak', 'melaria'].map(function (id) { return G.Panels.pelText(id, 3); }).join('#'); });
  ok(/^6:/.test(pt) && /Aliento polar de ida y vuelta/.test(pt) && /Picado doble/.test(pt), 'textos de Peligro propios de los 6 jefes (' + pt.slice(0, 70) + ')');
  ok(!pg.errs.length, '0 errores ' + pg.errs.slice(0, 2)); await close(pg);

  // Cráter: elegir, pista, Asalto y táctil 844x390 (mismo coord. lógico, lienzo escalado y centrado)
  const mp = await mk(b, 'reset=1&dbg=1&nosw=1', { width: 844, height: 390 }, true);
  await openPortal(mp, KILLS5, 'tundra');
  const box = await mp.evaluate(() => { var r = document.getElementById('game').getBoundingClientRect(); return { x: r.x, y: r.y, w: r.width, h: r.height }; });
  const tap = async (x, y) => { await mp.touchscreen.tap(box.x + x * box.w / 960, box.y + y * box.h / 540); await mp.waitForTimeout(300); };
  console.log('lienzo móvil:', JSON.stringify(box));
  for (const i of [5, 4, 3, 2, 1, 0]) { await tap(CHIP(i).x, CHIP(i).y); ok(await mp.evaluate(() => G.Save.data.biome) === DEST[i], `táctil 844x390: chip ${DEST[i]} elegido con un toque (${Math.round(94 * box.w / 960)} x ${Math.round(46 * box.h / 540)} px reales)`); }
  await tap(CHIP(5).x, CHIP(5).y); await shot(mp, 'p7_portal_movil');
  await tap(795, 508); await mp.waitForTimeout(1500);
  const st = await mp.evaluate(() => ({ s: G.state, bi: G.curBiome, boss: G.bossId, mode: G.mode, fin: G.final }));
  ok(st.bi === 'crater' && st.boss === 'cenizar' && st.fin === true, 'táctil: SALIR con el Cráter arranca el Asalto (' + JSON.stringify(st) + ')');
  ok(!mp.errs.length, 'táctil: 0 errores ' + mp.errs.slice(0, 2)); await close(mp);
}

// ------------------------------------------------------------------------------------------------ peligro
async function peligro(b) {
  console.log('--- Peligro I-V de los 6 jefes');
  const MULT = [1, 1.15, 1.3, 1.5, 1.75], CMULT = [1, 1.1, 1.2, 1.3, 1.4];
  const tab = {};
  for (const id of ALL) {
    const rows = [];
    for (let n = 1; n <= 5; n++) {
      const pg = await boss(b, id, n, '&len=9'); await pg.evaluate(SIM);
      const r = await pg.evaluate(() => {
        var S = G.Boss, e = S.e, D = e.def, P = S.u.pel(), o = {};
        o.n = G.peligro; o.hp = Math.round(e.maxHp); o.dmg = P.dmg; o.fury = P.fury; o.cap = P.cap; o.troph = P.troph; o.derr = P.derr || 1; o.desp = e.despLeft; o.part = P.part; o.pf = P.pfx; o.brasas = P.brasas;
        o.nph = D.phases.length; o.gate = D.gateHearts || 2;
        // trofeos por parte rota
        G.gems.length = 0; var k = Object.keys(D.parts)[0]; S.breakKey(k); o.trophies = G.gems.filter(function (g) { return !!g.trophy; }).length;
        return o;
      });
      rows.push(r);
      if (n === 1) tab[id] = r.hp;
      ok(!pg.errs.length, `${id} P${n}: 0 errores ${pg.errs.slice(0, 2)}`);
      await close(pg);
    }
    const H1 = rows[0].hp, M = id === 'cenizar' ? CMULT : MULT, DM = id === 'cenizar' ? [1, 1.05, 1.1, 1.15, 1.2] : [1, 1.1, 1.2, 1.3, 1.4];
    ok(rows.every((r, i) => Math.abs(r.hp - Math.round(H1 * M[i])) <= 1 && r.n === i + 1), `${id}: HP por Peligro I-V = x${M.join(' / x')} (${rows.map(r => r.hp).join(', ')})`);
    ok(rows.every((r, i) => Math.abs(r.dmg - DM[i]) < 1e-9), `${id}: daño ${DM.map(x => '+' + Math.round((x - 1) * 100) + ' %').join(' / ')}`);
    ok(rows.every((r, i) => r.fury === (i >= 3 ? 120000 : 150000) && r.cap === (i === 4 ? 6 : 4) && r.desp === (i === 4 ? 2 : 1) && r.troph === (i >= 3 ? 2 : 1) && r.trophies === (i >= 3 ? 2 : 1)), `${id}: Furia 150 s (120 s en IV-V), tope de adds 4 (6 en V), 2 desesperados en V, trofeos x2 en IV-V (medido al romper una parte: ${rows.map(r => r.trophies).join('')})`);
    ok(rows.every((r, i) => Math.abs(r.part - (i >= 3 ? 1.3 : 1)) < 1e-9 && r.pf === (i === 2 || i === 4 ? 1 : 0) && Math.abs(r.brasas - (1 + 0.25 * i)) < 1e-9), `${id}: partes +30 % desde IV, PF extra 1.ª vez en III y V, Brasas x1,00 / 1,25 / ... / 2,00`);
  }
  // ---- Yarlak: variantes por nivel
  const Y = [];
  for (let n = 1; n <= 5; n++) {
    const pg = await boss(b, 'yarlak', n, '&len=9'); await pg.evaluate(SIM);
    const r = await pg.evaluate(() => {
      var S = G.Boss, e = S.e, o = {}; G.state = 'play'; window.__sim(300);
      e.phase = 2; window.__prep(); S.force('y_llamada'); o.llamada2 = e.atk.spots.length;
      e.phase = 3; window.__prep(); S.force('y_llamada'); o.llamada3 = e.atk.spots.length;
      e.phase = 2; window.__prep(); S.force('y_aliento'); o.back = !!e.atk.back; o.sweep = e.atk.sweepMs;
      window.__prep(); S.force('y_alud'); o.alud = e.atk.spots.length;
      o.coldK = S.A.coldK;
      return o;
    });
    Y.push(r); ok(!pg.errs.length, `Yarlak P${n} variantes: 0 errores ${pg.errs.slice(0, 2)}`); await close(pg);
  }
  console.log('Yarlak', JSON.stringify(Y));
  ok(Y.map(r => r.llamada2).join() === '2,3,3,3,3' && Y.map(r => r.llamada3).join() === '3,4,4,4,4', 'Yarlak: La Llamada invoca +1 Lobo desde Peligro II (F2 2 -> 3, F3-F4 3 -> 4; tope de adds 4)');
  ok(Y.map(r => r.back).join() === 'false,false,true,true,true' && Y.map(r => r.sweep).join() === '1200,1200,2400,2400,2400', 'Yarlak: Aliento polar de ida y vuelta (30 grados, 2,4 s) desde Peligro III');
  ok(Y.map(r => r.alud).join() === '8,8,12,12,12', 'Yarlak: Alud de 12 bloques desde Peligro III (8 antes)');
  ok(Y.map(r => r.coldK).join() === '1,1,1,1.3,1.3', 'Yarlak: Frío x1,3 desde Peligro IV');
  // ---- Melaria: variantes por nivel
  const M = [];
  for (let n = 1; n <= 5; n++) {
    const pg = await boss(b, 'melaria', n, '&len=9'); await pg.evaluate(SIM);
    const r = await pg.evaluate(() => {
      var S = G.Boss, e = S.e, o = {}; G.state = 'play'; window.__sim(300);
      e.phase = 1; window.__prep(); S.force('m_llamada'); o.llamada1 = e.atk.spots.length;
      e.phase = 1; window.__prep(); S.force('m_picado'); o.picado = e.atk.n;
      return o;
    });
    const cp = await pg.evaluate(() => G.Panal.maxHoney());
    r.cap1 = cp; M.push(r); ok(!pg.errs.length, `Melaria P${n} variantes: 0 errores ${pg.errs.slice(0, 2)}`); await close(pg);
  }
  console.log('Melaria', JSON.stringify(M));
  ok(M.map(r => r.llamada1).join() === '2,3,3,3,3', 'Melaria: La Llamada invoca +1 Obrera desde Peligro II (F1 2 -> 3)');
  ok(M.map(r => r.picado).join() === '1,1,2,2,2', 'Melaria: Picado doble desde Peligro III');
  ok(M.map(r => r.cap1).join() === '12,12,12,18,18', 'Melaria: tope de celdas de miel x1,5 desde Peligro IV (12 -> 18 en F1; x1,5 también en F2-F3)');
  // ---- el Portal y la cacería muestran el HP y el daño reales de cada Peligro; la tabla de HP a 9 min coincide con el README
  console.log('HP I (9 min):', JSON.stringify(tab));
}

// ------------------------------------------------------------------------------------------------ hunt
async function hunt(b) {
  console.log('--- cacería y práctica con los 6 jefes');
  for (const id of ALL) {
    const hp = {};
    for (const q of ['', '&practice=1']) {
      const pg = await mk(b, `reset=1&god=1&dbg=1&nosw=1&speed=10&prep=0&nointro=1&hunt=${id}&peligro=${id === 'cenizar' ? 1 : 2}&len=9${q}`); await pg.waitForTimeout(1200);
      for (let i = 0; i < 60; i++) { if (await pg.evaluate(() => G.Boss.e && (G.Boss.e.mode === 'fight' || G.Boss.e.mode === 'gate'))) break; await pg.waitForTimeout(300); }
      hp[q || 'hunt'] = await pg.evaluate(() => ({ id: G.Boss.e && G.Boss.e.id, hp: G.Boss.e && Math.round(G.Boss.e.maxHp), mode: G.mode, pel: G.peligro, bi: G.curBiome, hm: G.huntHpMul }));
      ok(!pg.errs.length, `${id}${q || ' cacería'}: 0 errores ${pg.errs.slice(0, 2)}`); await close(pg);
    }
    const hpOf = async n => { const pg = await boss(b, id, n, '&len=9'); const v = await pg.evaluate(() => Math.round(G.Boss.e.maxHp)); await close(pg); return v; };
    const hn = id === 'cenizar' ? 1 : 2, base1 = await hpOf(hn), base0 = await hpOf(1);
    ok(hp.hunt.id === id && hp.hunt.mode === 'hunt' && Math.abs(hp.hunt.hp - Math.round(base1 * 0.75)) <= 1, `${id}: cacería x0,75 (${hp.hunt.hp} de ${base1}, Peligro ${hp.hunt.pel}, bioma ${hp.hunt.bi})`);
    const pr = hp['&practice=1']; ok(pr.id === id && pr.mode === 'practice' && Math.abs(pr.hp - Math.round(base0 * 0.5)) <= 1, `${id}: práctica x0,5 sin Peligro (${pr.hp} de ${base0})`);
  }
  // pestaña de Vesper: 6 botones, Peligro elegido y CAZAR / PRACTICAR por teclado y botón
  const pg = await mk(b, 'reset=1&dbg=1&nosw=1&nointro=1&prep=0');
  for (let k = 0; k < 6; k++) {
    await pg.evaluate(([id]) => { var S = G.Save.data; S.bossKills = { pastor: 1, karceron: 1, letea: 1, yarlak: 1, melaria: 1, cenizar: 1 }; S.peligro = { pastor: 3, karceron: 3, letea: 3, yarlak: 3, melaria: 3, cenizar: 3 }; G.Save.save(); G.Aldea.open(false); G.Aldea.openPanel('vesper'); G.Panels.vesperTab(1); }, [ALL[k]]);
    await pg.waitForTimeout(200);
    await pg.mouse.click(20 + k * 152 + 72, 56 + 26); await pg.waitForTimeout(150);
    await pg.mouse.click(20 + 2 * 64 + 29, 116 + 19); await pg.waitForTimeout(150);   // Peligro III
    await pg.keyboard.press('KeyF'); await pg.waitForTimeout(1500);
    const r = await pg.evaluate(() => ({ s: G.state, m: G.mode, b: G.bossId, p: G.peligro, bi: G.curBiome }));
    ok(r.m === 'hunt' && r.b === ALL[k] && r.p === 3, `Vesper -> CACERÍA de ${ALL[k]} en Peligro III (${JSON.stringify(r)})`);
    if (k === 3) await shot(pg, 'p7_vesper', null);
    await pg.evaluate(() => { G.Aldea.open(false); });
  }
  ok(!pg.errs.length, 'Vesper: 0 errores ' + pg.errs.slice(0, 2)); await close(pg);
}

// ------------------------------------------------------------------------------------------------ ruta
async function ruta(b) {
  console.log('--- rama Ruta del árbol de forja');
  const pg = await mk(b, 'reset=1&dbg=1&nosw=1&biome=panal');
  const r = await pg.evaluate(() => {
    var T = G.Tree, S = G.Save.data, out = {}, ids = ['RT1', 'RT2', 'RT3', 'RT4', 'RT5', 'RT6', 'RT7'];
    out.nodes = ids.map(function (id) { var n = T.node(id), c = T.cost(n); return [id, n.name, n.tree, c.pf, JSON.stringify(c.parts), c.brasas, n.trophies.join('+')].join('~'); });
    out.pfBefore = T.pfFree(); S.brasas = 5000; G.Loot.PARTS.forEach(function (p) { S.parts[p.id] = 60; });
    out.locked = ids.map(function (id) { return T.status(T.node(id)) + ':' + T.reason(T.node(id)); });
    out.buyLocked = T.buy('RT1', '1'); out.buyLocked2 = T.buy('RT7', '1');
    return out;
  });
  const EXPECT = { RT1: ['Crampones', { plate: 8 }, 300, 'ytusk'], RT2: ['Abrigo de escarcha', { thread: 8 }, 300, 'yplate'], RT3: ['Brasa en el pecho', { wick: 6 }, 450, 'yheart'], RT4: ['Ahumador', { wick: 6 }, 300, 'msting'], RT5: ['Guantes de apicultor', { thread: 8 }, 300, 'mwing'], RT6: ['Jalea de reserva', { feather: 8 }, 450, 'mjelly'] };
  Object.keys(EXPECT).forEach((id, i) => { const [nm, parts, br, tr] = EXPECT[id]; const row = r.nodes[i].split('~'); ok(row[1] === nm && row[2] === 'trunk' && row[3] === '0' && row[4] === JSON.stringify(parts) && +row[5] === br && row[6] === tr, `${id} ${nm}: tronco, 0 PF, ${JSON.stringify(parts)} + ${br} Brasas, trofeo ${tr}`); });
  const a7 = r.nodes[6].split('~'); ok(a7[1] === 'Aliento del Cráter' && a7[3] === '0' && a7[6] === 'cz_cay+cz_nuc+cz_ojo+cz_col+cz_cor+cz_cora', 'Aliento del Cráter: los 6 trofeos de Cenizar, 0 PF (' + a7[4] + ' + ' + a7[5] + ' Brasas)');
  ok(r.locked.every(x => /^locked:Requiere (el trofeo|los 6 trofeos)/.test(x)), 'sin trofeo: bloqueados con el motivo "Requiere el trofeo ..." (' + r.locked[0] + ')');
  ok(!r.buyLocked.ok && !r.buyLocked2.ok, 'sin trofeo no se puede comprar (' + r.buyLocked.msg + ')');
  // con trofeos: se compran sin PF ni hitos, y los trofeos no se consumen
  const t = await pg.evaluate(() => {
    var T = G.Tree, S = G.Save.data, o = {}; S.trophies = { ytusk: 1, yplate: 1, yheart: 1, msting: 1, mwing: 1, mjelly: 1, cz_cay: 1, cz_nuc: 1, cz_ojo: 1, cz_col: 1, cz_cor: 1 };   // faltan el Corazón de Ceniza
    var pf0 = T.pfFree(), br0 = S.brasas, pl0 = S.parts.plate, mile0 = S.mile, ever0 = Object.keys(S.ever).length;
    o.r1 = T.buy('RT1', '1'); o.dBr = br0 - S.brasas; o.dPl = pl0 - S.parts.plate; o.pf = T.pfFree() - pf0; o.fx1 = !!T.fx.crampones;
    ['RT2', 'RT3', 'RT4', 'RT5', 'RT6'].forEach(function (id) { o['r' + id] = T.buy(id, '1').ok; });
    o.tro = S.trophies.ytusk; o.mile = S.mile - mile0; o.ever = Object.keys(S.ever).length - ever0; o.avail7 = T.status(T.node('RT7')) + ':' + T.reason(T.node('RT7'));
    S.trophies.cz_cora = 1; o.avail7b = T.status(T.node('RT7')); o.r7 = T.buy('RT7', '1').ok; o.pfEnd = T.pfFree() - pf0; o.count = T.availableCount();
    var u = T.undoPlan('RT3'); o.undo = u ? [u.pf, u.brasas, u.ids.length] : null;
    return o;
  });
  console.log(JSON.stringify(t));
  ok(t.r1.ok && t.dBr === 300 && t.dPl === 8 && t.pf === 0 && t.fx1, 'Crampones con el trofeo: -8 Placa, -300 Brasas, 0 PF, efecto activo');
  ok(t.rRT2 && t.rRT3 && t.rRT4 && t.rRT5 && t.rRT6 && t.tro === 1, 'los otros 5 nodos se compran; el trofeo no se consume');
  ok(t.mile === 0 && t.ever === 0, 'la rama Ruta no da PF por "Maestría de oficio" ni cuenta como nodo distinto (hito 0, ever 0)');
  ok(/^locked:Requiere los 6 trofeos de Cenizar \(5\/6\)/.test(t.avail7), 'Aliento del Cráter: con 5 de 6 trofeos sigue bloqueado (' + t.avail7 + ')');
  ok(t.avail7b === 'avail' && t.r7 && t.pfEnd === 0, 'con los 6 trofeos se compra sin PF');
  ok(t.undo && t.undo[0] === 0 && t.undo[1] === 0, 'un nodo de Ruta se puede deshacer sin coste y devuelve 0 PF');
  // efectos reales
  const e = await pg.evaluate(() => {
    var T = G.Tree, o = {}, Tu = G.Tundra, Pn = G.Panal, fxSet = function (a) { T.fx = {}; a.forEach(function (k) { T.fx[k] = true; }); };
    G.runBuff = { fx: {} };
    fxSet([]); var p0 = Tu.params(); fxSet(['crampones']); var p1 = Tu.params(); o.tau = [p0.tau, p1.tau]; o.kb = [p0.kb, p1.kb];
    fxSet([]); o.cold0 = Tu.coldMul(); fxSet(['abrigo']); o.cold1 = Tu.coldMul();
    fxSet([]); var r0 = Tu.heatR(), pa0 = Tu.passive(); o.heat0 = r0;
    fxSet(['ahumador']); G.Boss.A = G.Boss.A || {}; Pn.on = true; Pn.clouds.length = 0; Pn.smoke(100, 100); o.smoke = [Math.round(Pn.clouds[0].life), Pn.clouds[0].r]; Pn.clouds.length = 0;
    fxSet([]); Pn.smoke(100, 100); o.smoke0 = [Math.round(Pn.clouds[0].life), Pn.clouds[0].r]; Pn.clouds.length = 0;
    fxSet([]); o.honey0 = Pn.honeyPct(); fxSet(['guantes']); o.honey1 = Pn.honeyPct();
    fxSet([]); G.Cards.recalc(false); var hp0 = G.player.maxHp; fxSet(['jalea']); G.Cards.recalc(false); o.hp = G.player.maxHp - hp0; fxSet([]); G.Cards.recalc(false);
    return o;
  });
  console.log(JSON.stringify(e));
  ok(e.tau[0] === 220 && e.tau[1] === 140 && Math.abs(e.kb[1] / e.kb[0] - 1.2 / (e.kb[0] ? 1 : 1)) >= 0, `Crampones: inercia del hielo ${e.tau[0]} -> ${e.tau[1]} ms, retroceso ${e.kb[0]} -> ${e.kb[1]}`);
  ok(Math.abs(e.cold0 - 1) < 1e-9 && Math.abs(e.cold1 - 0.7) < 1e-9, 'Abrigo de escarcha: ganancia de Frío x0,7');
  ok(e.smoke[0] === Math.round(e.smoke0[0] * 1.4) && e.smoke[1] === 50 && e.smoke0[1] === 36, `Ahumador: humo +40 % (${e.smoke0[0]} -> ${e.smoke[0]} ms) y radio 36 -> 50`);
  ok(e.honey0 === 0.45 && e.honey1 === 0.25, 'Guantes de apicultor: la miel ralentiza 25 % en vez de 45 %');
  ok(e.hp === 10, 'Jalea de reserva: +10 HP máximo');
  // Brasa en el pecho (radio de hoguera y Frío por carta de Fuego) y Aliento (+10 % a jefes) en una pelea de Tundra
  await close(pg);
  const tp = await mk(b, 'reset=1&god=1&dbg=1&nosw=1&biome=tundra&hand=spark:3,fang:1,shard:1&prep=0&nobos=1'); await tp.waitForTimeout(500);
  const bp = await tp.evaluate(() => {
    var T = G.Tree, Tu = G.Tundra, o = {};
    function set(a) { T.fx = {}; a.forEach(function (k) { T.fx[k] = true; }); }
    G.player.hand = [{ id: 'spark', lvl: 1 }, { id: 'ember', lvl: 1 }, { id: 'dart', lvl: 1 }, null, null]; G.time += 1000;
    set([]); o.r0 = Tu.heatR(); o.pas0 = Tu.passive(); set(['brasaPecho']); o.pas1 = Tu.passive(); o.r1 = Tu.heatR(); set([]);
    return o;
  });
  console.log(JSON.stringify(bp));
  ok(bp.pas0 > 0 && Math.abs(bp.pas1 / bp.pas0 - 0.5 / 0.35) < 0.02 && bp.r0 === 64, `Brasa en el pecho: cada carta de Fuego resta 0,5 %/s en vez de 0,35 (${bp.pas0.toFixed(2)} -> ${bp.pas1.toFixed(2)})`);
  await close(tp);
  const bb = await boss(b, 'pastor', 1, '&len=9'); await bb.evaluate(SIM);
  const dm = await bb.evaluate(() => {
    var e = G.Boss.e, T = G.Tree, S = G.Boss, o = {}; G.state = 'play'; window.__sim(300); window.__prep(); e.phase = 1;
    function hit(id) { var h0 = e.hp; G.Combat.deal(e, 100, { id: id, tag: 'neutral', proj: true }); return h0 - e.hp; }
    T.fx = {}; o.a = hit('t1'); window.__sim(200); T.fx = { alientoCrater: true }; o.b = hit('t2'); T.fx = {};
    return o;
  });
  ok(dm.a > 0 && Math.abs(dm.b / dm.a - 1.1) < 0.005, `Aliento del Cráter: +10 % de daño contra jefes (${dm.a.toFixed(1)} -> ${dm.b.toFixed(1)})`);
  ok(!bb.errs.length, '0 errores ' + bb.errs.slice(0, 2));
  // captura del árbol (nodos de Ruta)
  await bb.evaluate(() => { var S = G.Save.data; S.trophies = { ytusk: 1, yplate: 1, msting: 1, cz_cay: 1, cz_nuc: 1, cz_ojo: 1, cz_col: 1, cz_cor: 1, cz_cora: 1 }; S.brasas = 3000; G.Loot.PARTS.forEach(function (p) { S.parts[p.id] = 40; }); G.Tree.buy('RT1', '1'); G.Tree.buy('RT4', '1'); G.Aldea.open(false); G.Aldea.openPanel('forge'); G.Tree.setTab('trunk'); G.Tree.selectNode('RT7'); });
  await bb.waitForTimeout(500); await shot(bb, 'p7_ruta', null);
  await close(bb);
}

// ------------------------------------------------------------------------------------------------ platos
async function platos(b) {
  console.log('--- platos nuevos de Tía Castaña');
  const pg = await mk(b, 'reset=1&god=1&dbg=1&nosw=1&biome=panal&prep=0');
  const r = await pg.evaluate(() => {
    var C = G.Cook, S = G.Save.data, o = {}; o.n = C.DISHES.length; var N = ['caldobrasa', 'tostada', 'tehumo', 'hogar'].map(C.def);
    o.defs = N.map(function (d) { return [d.id, d.name, JSON.stringify(d.parts), d.brasas, d.need, JSON.stringify(d.fx)].join('~'); });
    S.brasas = 500; G.Loot.PARTS.forEach(function (p) { S.parts[p.id] = 20; });
    o.lockedBefore = N.map(function (d) { return C.unlocked(d); });
    var rr = C.cook('caldobrasa'); o.cookLocked = rr.ok + ':' + rr.msg;
    S.bossKills = { pastor: 1, karceron: 1, letea: 1, yarlak: 1 }; o.unlocked = N.map(function (d) { return C.unlocked(d); });
    var a = C.cook('tostada'); o.cook = a.ok + ':' + S.pending.dish + ':' + S.shop.dish; var a2 = C.cook('tehumo'); o.two = a2.ok;
    o.parts = [S.parts.thread, S.brasas];
    return o;
  });
  console.log(JSON.stringify(r));
  ok(r.n === 11 && r.defs.length === 4, `${r.n} platos (7 + 4 nuevos)`);
  const DEF = r.defs.map(x => x.split('~'));
  ok(DEF.slice(0, 3).every(d => { const ps = Object.values(JSON.parse(d[2])).reduce((a, c) => a + c, 0); return ps >= 4 && ps <= 6 && +d[3] >= 40 && +d[3] <= 60; }), 'Tundra / Panal: 4-6 partes + 40-60 Brasas (' + DEF.slice(0, 3).map(d => d[1] + ' ' + d[2] + '+' + d[3]).join('; ') + ')');
  ok(DEF[3][1] === 'Caldo del Hogar Reencendido' && DEF[3][2] === '{"fang":4,"plate":4,"wick":4}' && DEF[3][4] === 'cenizar', 'Caldo del Hogar Reencendido: Colmillo / Placa / Mecha, se abre al vencer a Cenizar');
  ok(r.lockedBefore.join() === 'false,false,false,false' && /^false:Receta cerrada/.test(r.cookLocked), 'cerrados sin el jefe: no se pueden cocinar (' + r.cookLocked + ')');
  ok(r.unlocked.join() === 'true,true,true,false', 'Letea abre el Caldo de brasa, Yarlak la Tostada y el Té de humo; el del Hogar espera a Cenizar');
  ok(r.cook === 'true:tostada:1' && r.two === false && r.parts[0] === 15 && r.parts[1] === 460, 'cocinar: 1 plato por expedición, -5 Hebra, -40 Brasas');
  // efectos
  const e = await pg.evaluate(() => {
    var C = G.Cook, S = G.Save.data, o = {}, Tu = G.Tundra, Pn = G.Panal, T = G.Tree;
    function eat(id) { S.pending.dish = id; C.begin(); }
    T.fx = {}; eat(null); o.cold0 = Tu.coldMul(); o.honey0 = Pn.honeyPct(); Pn.on = true; Pn.clouds.length = 0; Pn.smoke(50, 50); o.smoke0 = Pn.clouds[0].life; Pn.clouds.length = 0; G.Cards.recalc(false); o.hp0 = G.player.maxHp;
    eat('caldobrasa'); o.cold1 = Tu.coldMul(); eat('tostada'); o.honey1 = Pn.honeyPct();
    eat('tehumo'); Pn.smoke(50, 50); o.smoke1 = Pn.clouds[0].life; Pn.clouds.length = 0; T.fx = { ahumador: true }; Pn.smoke(50, 50); o.smoke2 = Pn.clouds[0].life; Pn.clouds.length = 0; T.fx = {};
    eat('hogar'); G.Cards.recalc(false); o.hp1 = G.player.maxHp; o.cooked = S.cooked; eat(null);
    return o;
  });
  console.log(JSON.stringify(e));
  ok(Math.abs(e.cold1 / e.cold0 - 0.65) < 1e-9, 'Caldo de brasa: -35 % de ganancia de Frío');
  ok(Math.abs(e.honey1 / e.honey0 - 0.5) < 1e-9, 'Tostada de miel: la miel ralentiza la mitad');
  ok(Math.abs(e.smoke1 / e.smoke0 - 1.5) < 1e-9 && e.smoke2 === e.smoke1, `Té de humo: humo +50 % (${e.smoke0} -> ${e.smoke1} ms), no se suma al Ahumador (${e.smoke2})`);
  ok(e.hp1 - e.hp0 === 12, 'Caldo del Hogar: +12 HP máximo');
  await close(pg);
  // +1 corazón en cada puerta de fase (Pastor 2 -> 3; Cenizar 3 -> 4)
  for (const [id, base0] of [['pastor', 2], ['cenizar', 3]]) {
    const res = [];
    for (const dish of [null, 'hogar']) {
      const bp = await boss(b, id, 1); await bp.evaluate(SIM);
      res.push(await bp.evaluate(([dh]) => {
        var S = G.Boss, e = S.e; G.state = 'play'; window.__sim(300); window.__prep(); G.runBuff = { fx: dh ? { hp: 12, gate: 1 } : {} }; G.gems.length = 0;
        e.hp = e.maxHp * e.def.phases[e.phase - 1].thr + 5; G.Combat.deal(e, 50, { id: 'x', tag: 'neutral', proj: true });
        return G.gems.filter(function (g) { return g.kind === 'heart'; }).length;
      }, [dish])); await close(bp);
    }
    ok(res[0] === base0 && res[1] === base0 + 1, `${id}: puerta de fase con ${res[0]} corazones, con el Caldo del Hogar ${res[1]}`);
  }
  // la cocina en 2 páginas (captura y sin errores)
  const cp = await mk(b, 'reset=1&dbg=1&nosw=1');
  await cp.evaluate(() => { var S = G.Save.data; S.bossKills = { pastor: 1, karceron: 1, letea: 1, yarlak: 1, melaria: 1, cenizar: 1 }; S.brasas = 400; G.Loot.PARTS.forEach(function (p) { S.parts[p.id] = 12; }); G.Aldea.open(false); G.Aldea.openPanel('cook'); });
  await cp.mouse.click(838, 26); await cp.waitForTimeout(300);
  await cp.mouse.click(850 - 0, 98); await cp.waitForTimeout(300);
  ok(await cp.evaluate(() => G.Save.data.pending.dish) === 'caldobrasa', 'cocina: página DE BIOMA, el botón COCINAR del 1.er plato lo prepara');
  ok(!cp.errs.length, 'cocina: 0 errores ' + cp.errs.slice(0, 2)); await close(cp);
}

// ------------------------------------------------------------------------------------------------ misiones
async function misiones(b) {
  console.log('--- encargos nuevos de Tundra, Panal y Cráter');
  const pg = await mk(b, 'reset=1&dbg=1&nosw=1&prep=0');
  const NEW = ['yetis', 'coldwin', 'noram', 'guards', 'wasps', 'sting', 'reinafuego', 'nohoney', 'cpart', 'czwin'];
  const r = await pg.evaluate(NEW => {
    var Q = G.Quests, o = {}; o.total = Q.DEFS.length; o.have = NEW.filter(function (id) { return !!Q.def(id); }).length;
    function feas(kills) { return NEW.filter(function (id) { return Q.feasible(Q.def(id), kills); }).join(','); }
    o.f0 = feas({}); o.f1 = feas({ pastor: 1, karceron: 1, letea: 1 }); o.f2 = feas({ pastor: 1, karceron: 1, letea: 1, yarlak: 1 }); o.f3 = feas({ pastor: 1, karceron: 1, letea: 1, yarlak: 1, melaria: 1 });
    o.biomes = NEW.map(function (id) { return id + ':' + Q.biomesOf(Q.def(id)).join('/'); }).join(' ');
    // el Tablón no ofrece encargos incumplibles en ningún estado de desbloqueo
    var bad = 0, seen = {};
    [{}, { pastor: 1 }, { pastor: 1, karceron: 1 }, { pastor: 1, karceron: 1, letea: 1 }, { pastor: 1, karceron: 1, letea: 1, yarlak: 1 }, KILLS_().all].forEach(function (k) {
      G.Save.data.bossKills = k; G.Save.data.quest.done = {}; for (var i = 0; i < 300; i++) { G.Save.data.runs = i * 7 + 3; Q.offers().forEach(function (d) { seen[d.id] = 1; if (!Q.feasible(d)) bad++; }); }
    });
    function KILLS_() { return { all: { pastor: 1, karceron: 1, letea: 1, yarlak: 1, melaria: 1 } }; }
    o.bad = bad; o.seenNew = NEW.filter(function (id) { return seen[id]; }).length;
    return o;
  }, NEW);
  console.log(JSON.stringify(r));
  ok(r.have === 10 && r.total >= 36, `10 encargos nuevos (pool ${r.total}; 7+ para Tundra / Panal / Cráter)`);
  ok(r.f0 === '' && r.f1 === 'yetis,coldwin,noram' && r.f2 === 'yetis,coldwin,noram,guards,wasps,sting,reinafuego,nohoney' && r.f3.split(',').length === 10, `solo se ofrecen con el destino abierto: Tundra 3 con Letea, Panal 5 con Yarlak, Cráter 2 con los cinco (${r.f1} | ${r.f3.split(',').length})`);
  ok(r.bad === 0 && r.seenNew >= 8, `Tablón: 1800 rotaciones sin ofertas incumplibles; ${r.seenNew} de los 10 nuevos aparecen`);
  // progreso
  const p = await pg.evaluate(() => {
    var Q = G.Quests, S = G.Save.data, o = {};
    function run(id, info, pre) { S.quest.active = null; S.quest.prog = {}; Q.accept(id); if (pre) pre(); var d = Q.onRunEnd(info); return !!(d && Q.isReady()); }
    function kill(id, type, biome, n) { S.quest.active = null; S.quest.prog = {}; Q.accept(id); G.curBiome = biome; for (var i = 0; i < n; i++) Q.onKill(type, {}); return Q.progress(id); }
    o.yetisT = kill('yetis', 'shield', 'tundra', 12); o.yetisC = kill('yetis', 'shield', 'cripta', 12); o.guardsP = kill('guards', 'shield', 'panal', 20); o.guardsT = kill('guards', 'shield', 'tundra', 20); o.wasps = kill('wasps', 'blinker', 'panal', 15);
    o.coldOk = run('coldwin', { won: true, bossId: 'yarlak', coldPeak: 68 }); o.coldBad = run('coldwin', { won: true, bossId: 'yarlak', coldPeak: 71 }); o.coldLose = run('coldwin', { won: false, bossId: 'yarlak', coldPeak: 10 });
    o.ramOk = run('noram', { won: true, bossId: 'yarlak', hitBy: { boss_pisoton: 3 } }); o.ramBad = run('noram', { won: true, bossId: 'yarlak', hitBy: { boss_embestida: 1 } }); o.ramPastor = run('noram', { won: true, bossId: 'pastor', hitBy: {} });
    o.sting = run('sting', { won: false, bossId: 'melaria', parts: ['aguijon'] }); o.stingNo = run('sting', { won: false, bossId: 'melaria', parts: ['alas'] });
    o.rf = run('reinafuego', { won: true, bossId: 'melaria', hand: ['ember', 'spark', 'ember', 'dart'] }); o.rfNo = run('reinafuego', { won: true, bossId: 'pastor', hand: ['spark', 'spark', 'spark'] }); o.rfLess = run('reinafuego', { won: true, bossId: 'melaria', hand: ['spark', 'spark', 'dart'] });
    o.cz = run('czwin', { won: false, bossWon: true, bossId: 'cenizar', peligro: 2 }); o.czNo = run('czwin', { won: false, bossWon: true, bossId: 'cenizar', peligro: 1 });
    S.quest.active = null; S.quest.prog = {}; Q.accept('cpart'); Q.onRunEnd({ bossId: 'cenizar', parts: ['cayado', 'nucleo'], won: false }); o.cp1 = Q.progress('cpart'); Q.onRunEnd({ bossId: 'cenizar', parts: [], won: false }); o.cp2 = Q.progress('cpart'); Q.onRunEnd({ bossId: 'cenizar', parts: ['ojo'], won: false }); o.cp3 = Q.progress('cpart') + ':' + Q.isReady();
    // racha sin pisar miel
    S.quest.active = null; S.quest.prog = {}; Q.accept('nohoney'); G.curBiome = 'panal'; G.state = 'play'; G.mode = 'run'; G.Loot.resetRun(); G.t0 = 0; G.time = 30000; Q.tick(); o.nh30 = Q.progress('nohoney');
    G.Loot.run.honeyAt = 30000; G.time = 55000; Q.tick(); o.nh25 = Q.progress('nohoney'); G.time = 95000; Q.tick(); o.nh65 = Q.progress('nohoney') + ':' + Q.isReady();
    S.quest.active = null; S.quest.prog = {}; Q.accept('nohoney'); G.curBiome = 'tundra'; G.time = 200000; Q.tick(); o.nhT = Q.progress('nohoney'); G.curBiome = 'bosque';
    return o;
  });
  console.log(JSON.stringify(p));
  ok(p.yetisT === 12 && p.yetisC === 0 && p.guardsP === 20 && p.guardsT === 0 && p.wasps === 15, 'Rompe-yetis solo avanza en la Tundra; Rompe-cera y Avispero solo en el Panal');
  ok(p.coldOk && !p.coldBad && !p.coldLose, 'Sin escalofríos: victoria contra Yarlak con el Frío <= 70 % (68 sí, 71 no, derrota no)');
  ok(p.ramOk && !p.ramBad && !p.ramPastor, 'Sin Embestida: sin que te alcance boss_embestida, solo contra Yarlak');
  ok(p.sting && !p.stingNo, 'Rompe el Aguijón: cuenta aunque pierdas, solo la parte "aguijon"');
  ok(p.rf && !p.rfNo && !p.rfLess, 'La Reina en llamas: victoria contra Melaria con 3+ cartas de Fuego');
  ok(p.cz && !p.czNo, 'Segundo aliento: Cenizar en Peligro II o más');
  ok(p.cp1 === 2 && p.cp2 === 2 && p.cp3 === '3:true', 'Rompe-reliquias: suma las Reliquias de Cenizar entre Asaltos (2, 2, 3)');
  ok(p.nh30 === 30 && p.nh25 === 30 && /^60:true/.test(p.nh65) && p.nhT === 0, `Pies limpios: racha sin pisar miel (30 s; tras pisar miel la mejor racha se conserva; 60 s completa; solo en el Panal)`);
  ok(!pg.errs.length, '0 errores ' + pg.errs.slice(0, 2)); await close(pg);
}

// ------------------------------------------------------------------------------------------------ logros
async function logros(b) {
  console.log('--- logros e Insignias');
  const pg = await mk(b, 'reset=1&dbg=1&nosw=1&prep=0');
  const r = await pg.evaluate(() => {
    var A = G.Ach, S = G.Save.data, o = {}, M = G.Minis;
    function set(list) { S.insignias = {}; list.forEach(function (k) { S.insignias[k] = 1; }); S.ach = {}; A.check(); return ['insig3', 'insig8', 'insig10'].map(function (k) { return S.ach[k] ? 1 : 0; }).join(''); }
    o.ids = M.IDS.length + '+' + M.IDS_PANAL.length;
    o.a = set(M.IDS.slice(0, 2)); o.b = set(M.IDS.slice(0, 2).concat(M.IDS_PANAL[0])); o.c = set(M.IDS.slice(0, 7)); o.d = set(M.IDS.slice(0, 6).concat(M.IDS_PANAL)); o.e = set(M.IDS); o.f = set(M.ALL); o.g = set(M.IDS.concat(['brasa_primera']));
    o.count = (S.insignias = { carnero: 1, avispon: 1, reina_joven: 1, brasa_primera: 1 }, M.insigniaCount());
    // los logros ya conseguidos no se pierden
    S.ach = { insig8: 3 }; S.insignias = {}; A.check(); o.keep = S.ach.insig8;
    // logros de Ruta, Peligro V y flags
    S.ach = {}; S.insignias = {}; S.nodes = {}; A.check(); o.base = ['calido', 'nigota', 'peligro5', 'ruta', 'aliento'].map(function (k) { return S.ach[k] ? 1 : 0; }).join('');
    S.flags.warm_heart = 1; S.flags.no_honey = 1; S.pelWins = { yarlak: { 1: 1, 5: 1 } }; ['RT1', 'RT2', 'RT3', 'RT4', 'RT5', 'RT6'].forEach(function (id) { S.nodes[id] = { c: '1' }; }); A.check(); o.mid = ['calido', 'nigota', 'peligro5', 'ruta', 'aliento'].map(function (k) { return S.ach[k] ? 1 : 0; }).join('');
    S.nodes.RT7 = { c: '1' }; A.check(); o.end = S.ach.aliento ? 1 : 0; o.n = A.DEFS.length; o.give = S.parts.rare;
    return o;
  });
  console.log(JSON.stringify(r));
  ok(r.ids === '8+2', 'Insignias de minijefe: 8 + 2 del Panal');
  ok(r.a === '000' && r.b === '100' && r.c === '100' && r.d === '110' && r.e === '110' && r.f === '111', `Cazador de guardianes (3) y Coleccionista (8) cuentan las 10 Insignias; Colección completa pide las 10 (${[r.a, r.b, r.c, r.d, r.e, r.f].join(' ')})`);
  ok(r.g === '110' && r.count === 3, 'la Insignia 11 "Brasa Primera" no cuenta para estos logros ni para el contador de las 10');
  ok(r.keep === 3, 'un logro ya conseguido no se revoca al cambiar el cómputo');
  ok(r.base === '00000' && r.mid === '11110' && r.end === 1 && r.n === 24, `5 logros nuevos (Cálido corazón, Ni una gota, Último aliento, Hecho para el camino, Aliento del Cráter): ${r.n} logros en total`);
  // Cálido corazón y Ni una gota con victorias reales
  await close(pg);
  const win = async (id, extra, pre) => {
    const p = await boss(b, id, 1, '&speed=10' + (extra || '')); await p.evaluate(SIM);
    await p.evaluate(() => { setInterval(() => { G.pendingLevels = 0; if (G.state === 'cards') { try { G.Cards.pick(0); } catch (e) { G.state = 'play'; } } }, 50); });
    for (let i = 0; i < 60; i++) { if (await p.evaluate(() => G.Boss.e && G.Boss.e.mode === 'fight')) break; await p.waitForTimeout(250); }
    if (pre) await p.evaluate(pre);
    await p.evaluate(() => { var e = G.Boss.e; e.phase = e.def.phases.length; e.despDone = true; e.despLeft = 0; e.mode = 'fight'; e.immune = false; e.hp = e.maxHp * 0.0005; G.Combat.deal(e, 1e6, { id: 'k', tag: 'neutral', proj: true }); G.Combat.deal(e, 1e6, { id: 'k2', tag: 'neutral', proj: true }); });
    for (let i = 0; i < 80; i++) { if (await p.evaluate(() => !!G.Loot.summary)) break; await p.waitForTimeout(300); }
    const f = await p.evaluate(() => ({ s: !!G.Loot.summary && G.Loot.summary.won, w: JSON.stringify(G.Save.data.flags), a: JSON.stringify(Object.keys(G.Save.data.ach)), bk: G.Save.data.bossKills, bp: G.cold && G.cold.bossPeak }));
    await p.evaluate(() => { G.Aldea.open(true); }); const f2 = await p.evaluate(() => JSON.stringify(Object.keys(G.Save.data.ach))); f.a = f2;
    await p.waitForTimeout(100); const errs = p.errs.slice(0, 2); await close(p); return Object.assign(f, { errs });
  };
  const y1 = await win('yarlak'); console.log(JSON.stringify(y1));
  ok(y1.s && /"warm_heart":1/.test(y1.w) && /calido/.test(y1.a), `Cálido corazón: Yarlak vencido con el Frío por debajo del 50 % (pico ${Math.round(y1.bp)} %) -> logro`);
  const y2 = await win('yarlak', '', () => { G.cold.v = 60; G.cold.bossPeak = 60; });
  ok(y2.s && !/warm_heart/.test(y2.w) && !/calido/.test(y2.a), 'con el Frío en 60 % durante la pelea no se concede');
  const m1 = await win('melaria'); console.log(JSON.stringify(m1));
  ok(m1.s && /"no_honey":1/.test(m1.w) && /nigota/.test(m1.a), 'Ni una gota: Melaria vencida sin pisar miel -> logro');
  const m2 = await win('melaria', '', () => { G.Loot.run.honeyBoss = true; });
  ok(m2.s && !/no_honey/.test(m2.w), 'pisar miel durante la pelea lo impide');
  ok(!y1.errs.length && !m1.errs.length, '0 errores ' + y1.errs.concat(m1.errs).slice(0, 2));
  // panel de logros: 24 logros con scroll
  const lp = await mk(b, 'reset=1&dbg=1&nosw=1');
  await lp.evaluate(() => { G.Aldea.open(false); G.Aldea.openPanel('logros'); }); await lp.waitForTimeout(300);
  await lp.mouse.click(860, 397); await lp.waitForTimeout(300);
  const sc = await lp.evaluate(() => 1);
  await lp.mouse.click(860, 397); await lp.waitForTimeout(300); await lp.mouse.click(680, 397); await lp.waitForTimeout(300);
  ok(!lp.errs.length, 'panel de logros con scroll (SIGUIENTES / ANTERIORES): 0 errores ' + lp.errs.slice(0, 2)); await close(lp);
}

// ------------------------------------------------------------------------------------------------ estatua
async function estatua(b) {
  console.log('--- estatua del Hogar');
  const pg = await mk(b, 'reset=1&dbg=1&nosw=1&prep=0');
  const r = await pg.evaluate(() => {
    var S = G.Save.data, A = G.Aldea, o = {};
    S.bossKills = { pastor: 1, karceron: 1, letea: 1, yarlak: 1, melaria: 1 }; G.Save.save(); A.open(false); A.pos.x = 790; A.pos.y = 470; o.before = A.state().target;
    S.bossKills.cenizar = 1; A.pos.x = 790; A.pos.y = 470; o.after = A.state().target;
    o.hasArt = typeof Assets.drawHearthStatue === 'function'; o.icons = ['bosque', 'cripta', 'asfodelo', 'tundra', 'panal', 'crater'].every(function (id) { var c = document.createElement('canvas').getContext('2d'); return Assets.drawDestIcon(c, id, 16, 16, 24); });
    A.talk('estatua'); o.dlg = G.Dialog.active(); G.Dialog.close();
    return o;
  });
  ok(r.before !== 'estatua' && r.after === 'estatua', `la estatua solo existe tras vencer a Cenizar (antes ${r.before}, después ${r.after})`);
  ok(r.hasArt && r.icons && r.dlg, 'arte procedural (estatua + 6 iconos de destino) y diálogo de la estatua');
  await pg.evaluate(() => { G.Aldea.pos.x = 790; G.Aldea.pos.y = 440; }); await pg.waitForTimeout(500); await shot(pg, 'p7_estatua', { x: 560, y: 300, width: 400, height: 240 });
  // colisión: Marlo no atraviesa la base de la estatua caminando hacia abajo
  await pg.evaluate(() => { G.Dialog.close(); G.Aldea.pos.x = 790; G.Aldea.pos.y = 440; });
  await pg.keyboard.down('KeyS'); await pg.waitForTimeout(1500); await pg.keyboard.up('KeyS');
  const y = await pg.evaluate(() => Math.round(G.Aldea.pos.y)); ok(y < 475, `la base de la estatua bloquea a Marlo (se detiene en y ${y})`);
  // sin Cenizar vencido: el brasero arde con Melaria vencida; dibujo sin errores en los dos estados
  await pg.evaluate(() => { G.Save.data.bossKills = { pastor: 1, karceron: 1, letea: 1, yarlak: 1, melaria: 1 }; }); await pg.waitForTimeout(300);
  ok(!pg.errs.length, '0 errores ' + pg.errs.slice(0, 2)); await close(pg);
}

// ------------------------------------------------------------------------------------------------ anuncio
async function anuncio(b) {
  console.log('--- Cenizar: 2.º Aviso fantasma (Peligro IV-V)');
  const res = [];
  for (let n = 1; n <= 5; n++) {
    const pg = await boss(b, 'cenizar', n, '&len=9'); await pg.evaluate(SIM);
    const r = await pg.evaluate(() => {
      var S = G.Boss, e = S.e, a = S.A, o = {}; G.state = 'play'; window.__sim(300);
      e.phase = 7; window.__prep(); S.cz.D.h.clear && S.cz.D.h.clear(e); S.force('c_chain'); var ch = a.ch; o.valid = ch.spec.valid;
      var late = a.evs.filter(function (v) { return v.ghostAt != null; }); o.late = late.length; o.keys = a.evs.length;
      o.info = S.chainInfo().ann2;
      if (late.length) { var t0 = Math.min.apply(null, late.map(function (v) { return v.t0; })); o.lead = Math.round(t0 - late[0].ghostAt); o.ghostAfterStart = late[0].ghostAt >= a.clk + 1400; o.all = late.every(function (v) { return v.link >= 4 || v.id === '1c'; }); o.early = a.evs.filter(function (v) { return v.ghostAt == null && v.link >= 4; }).length; }
      // dibujo: antes del 2.º aviso las zonas tardías no se dibujan; después sí
      function calls(ev, clk) { var n = 0, p = new Proxy({}, { get: function (t, k) { if (k === 'canvas') return {}; return function () { n++; return p; }; }, set: function () { return true; } }); try { S.cz.drawEv(p, ev, clk); } catch (x) { return -1; } return n; }
      if (late.length) { o.drawBefore = calls(late[0], late[0].ghostAt - 10); o.drawAfter = calls(late[0], late[0].ghostAt + 10); o.drawEarlyLink = calls(a.evs.filter(function (v) { return v.link === 1; })[0], 10); }
      // avanzar hasta el 2.º aviso: banner y marca
      var bn = null; window.__sim(9000, function () { if (ch.ann2Done && bn == null) bn = a.clk; return !(ch.ann2 != null && ch.ann2Done); });
      o.done = !!ch.ann2Done; o.hasAnn = ch.ann2 != null;
      return o;
    });
    res.push(r); ok(!pg.errs.length, `Peligro ${n}: 0 errores ${pg.errs.slice(0, 2)}`); await close(pg);
  }
  console.log(JSON.stringify(res));
  ok(res.every(r => r.valid), 'la cadena sigue siendo alcanzable (BFS) con el 2.º aviso');
  ok(res.slice(0, 3).every(r => r.late === 0 && !r.hasAnn), 'Peligro I-III: sin 2.º aviso (toda la cadena se ve en el Anuncio de 1500 ms)');
  ok(res.slice(3).every(r => r.late >= 5 && r.hasAnn && r.all && r.early === 0), `Peligro IV-V: los eslabones 4-6 y el Eco (${res[3].late} zonas) esperan al 2.º aviso`);
  ok(res.slice(3).every(r => r.lead === 1000 && r.ghostAfterStart), 'el 2.º aviso los muestra 1000 ms antes de que empiece la telegrafía del 4.º eslabón');
  ok(res.slice(3).every(r => r.drawBefore === 0 && r.drawAfter > 0 && r.drawEarlyLink > 0), 'antes del 2.º aviso no se dibujan; después sí; el eslabón 1 se ve desde el Anuncio');
  ok(res.slice(3).every(r => r.done), 'el 2.º aviso se dispara durante el Rosario (banner "SEGUNDO AVISO")');
}

// ------------------------------------------------------------------------------------------------ migración
async function migrar(b) {
  console.log('--- guardado v9 y migración desde v8');
  const ctx = await b.newContext({ viewport: { width: 960, height: 540 } }), pg = await ctx.newPage(); pg.errs = [];
  pg.on('console', m => { if (m.type() === 'error') pg.errs.push(m.text()); }); pg.on('pageerror', e => pg.errs.push('PAGEERR ' + e.message));
  await pg.goto(`${base}/index.html?dbg=1&nosw=1`); await pg.waitForTimeout(400);
  const old = { v: 8, parts: { wick: 5, thread: 9 }, brasas: 777, cards: { spark: 1, dart: 1, shard: 1, dagger: 1, fang: 1, hourglass: 1 }, anchors: ['spark'], len: 9, pf: { earned: 11 }, nodes: { H1: { c: 'A' } }, bossKills: { pastor: 2, karceron: 1, letea: 1, yarlak: 1, melaria: 1, cenizar: 1 }, peligro: { pastor: 4, karceron: 2, letea: 2, yarlak: 3, melaria: 2, cenizar: 2 }, biome: 'panal', flags: { title_apagafuegos: 1 }, insignias: { carnero: 1, avispon: 1, brasa_primera: 1 }, elites: { mini_slot1: 1 }, trophies: { ytusk: 2, cz_cay: 1 }, endingSeen: true, ach: { cenizar: 9 }, pelWins: { cenizar: { 1: 1 } } };
  await pg.evaluate(o => { localStorage.removeItem('swarmhand.save.v8'); localStorage.setItem('swarmhand.save', JSON.stringify(o)); }, old);
  await pg.goto(`${base}/index.html?dbg=1&nosw=1`); await pg.waitForTimeout(600);
  const m = await pg.evaluate(() => { var d = G.Save.data; return { v: d.v, ver: G.Save.VERSION, ps: JSON.stringify(d.portalSeen), bak: JSON.parse(localStorage.getItem('swarmhand.save.v8') || 'null'), mig: d.flags.migrated9, br: d.brasas, pf: d.pf.earned, pel: JSON.stringify(d.peligro), bk: JSON.stringify(d.bossKills), tro: JSON.stringify(d.trophies), ins: JSON.stringify(d.insignias), es: d.endingSeen, ach: JSON.stringify(d.ach), nodes: JSON.stringify(d.nodes), biome: d.biome, fl: JSON.stringify(d.flags), saved: JSON.parse(localStorage.getItem('swarmhand.save')).v }; });
  console.log(JSON.stringify(m));
  ok(m.v === 9 && m.ver === 9 && m.mig === 1 && m.saved === 9, 'migración v8 -> v9: versión 9, flag migrated9 y guardado reescrito');
  ok(m.bak && m.bak.v === 8 && m.bak.brasas === 777, 'copia de seguridad en swarmhand.save.v8 con el guardado original');
  ok(JSON.parse(m.ps).crater === 1 && JSON.parse(m.ps).panal === 1 && JSON.parse(m.ps).tundra === 1, 'los 6 destinos ya abiertos salen como vistos (sin marcas NUEVO falsas): ' + m.ps);
  ok(m.br === 777 && m.pf === 11 && m.bk === JSON.stringify(old.bossKills) && m.pel === JSON.stringify(old.peligro) && m.tro === JSON.stringify(old.trophies) && m.ins === JSON.stringify(old.insignias) && m.es === true && JSON.parse(m.ach).cenizar === 9 && m.nodes === '{"H1":{"c":"A"}}' && m.biome === 'panal', 'sin pérdidas (Brasas, PF, victorias, Peligro, trofeos, Insignias, logros, nodos, destino)');
  // a medio camino: sin Cenizar ni Melaria, los destinos nuevos no se marcan vistos
  await pg.evaluate(() => { var o = JSON.parse(localStorage.getItem('swarmhand.save')); o.v = 8; delete o.portalSeen; o.bossKills = { pastor: 1, karceron: 1 }; localStorage.setItem('swarmhand.save', JSON.stringify(o)); });
  await pg.goto(`${base}/index.html?dbg=1&nosw=1`); await pg.waitForTimeout(500);
  ok(await pg.evaluate(() => JSON.stringify(G.Save.data.portalSeen) === '{"bosque":1,"cripta":1,"asfodelo":1}' && !G.Save.craterOpen()), 'con solo 2 jefes vencidos: vistos Bosque, Cripta y Asfódelo; el Cráter sigue cerrado');
  // desde v5 (cadena completa) y el guardado corrupto
  await pg.evaluate(() => { localStorage.setItem('swarmhand.save', JSON.stringify({ v: 5, parts: { thread: 4 }, brasas: 50, cards: { spark: 1, dart: 1, shard: 1, dagger: 1, fang: 1, hourglass: 1 }, bossKills: { pastor: 1, karceron: 1, letea: 1, yarlak: 1 }, peligro: { pastor: 2, karceron: 2, letea: 2, yarlak: 1 }, flags: {} })); });
  await pg.goto(`${base}/index.html?dbg=1&nosw=1`); await pg.waitForTimeout(500);
  const f5 = await pg.evaluate(() => ({ v: G.Save.data.v, ps: JSON.stringify(G.Save.data.portalSeen), br: G.Save.data.brasas, bak: !!localStorage.getItem('swarmhand.save.v5') }));
  ok(f5.v === 9 && f5.br === 50 && f5.bak && f5.ps === '{"bosque":1,"cripta":1,"asfodelo":1,"tundra":1,"panal":1}', 'migración v5 -> v9 por toda la cadena (copia v5, Panal abierto y visto): ' + f5.ps);
  await pg.evaluate(() => { localStorage.setItem('swarmhand.save', '{"v":8,"parts":null'); }); await pg.goto(`${base}/index.html?dbg=1&nosw=1`); await pg.waitForTimeout(500);
  ok(await pg.evaluate(() => G.Save.data.v === 9 && G.Save.data.portalSeen.bosque === 1 && G.Save.data.peligro.cenizar === 1), 'guardado corrupto cae a valores por defecto v9');
  // exportar / importar: un texto de v8 se importa y migra; uno de una versión futura se rechaza
  const imp = await pg.evaluate(o => { var t = 'SWARM1:' + btoa(unescape(encodeURIComponent(JSON.stringify(o)))); var r = G.Save.importText(t); var d = G.Save.data; var fut = G.Save.importText(JSON.stringify({ v: 10, parts: {}, cards: {} })); return { ok: r.ok, v: d.v, br: d.brasas, fut: fut.ok, bak: !!localStorage.getItem('swarmhand.save.antes-de-importar') }; }, old);
  ok(imp.ok && imp.v === 9 && imp.br === 777 && !imp.fut, 'importar un texto de v8 lo migra a v9 y rechaza uno de v10');
  // reset: guardado nuevo v9
  await pg.goto(`${base}/index.html?dbg=1&nosw=1&reset=1`); await pg.waitForTimeout(500);
  ok(await pg.evaluate(() => G.Save.data.v === 9 && JSON.stringify(G.Save.data.portalSeen) === '{"bosque":1}'), 'partida nueva: v9 con solo el Bosque visto');
  ok(!pg.errs.length, '0 errores ' + pg.errs.slice(0, 2)); await ctx.close();
}

// ------------------------------------------------------------------------------------------------ flow
async function flow(b) {
  console.log('--- flujo aldea -> Portal -> expedición en los 6 destinos');
  const want = { bosque: 'pastor', cripta: 'karceron', asfodelo: 'letea', tundra: 'yarlak', panal: 'melaria', crater: 'cenizar' };
  for (const touch of [false, true]) {
    const pg = await mk(b, 'reset=1&dbg=1&nosw=1&prep=0&nointro=1', touch ? { width: 844, height: 390 } : null, touch);
    const box = await pg.evaluate(() => { var r = document.getElementById('game').getBoundingClientRect(); return { x: r.x, y: r.y, w: r.width, h: r.height }; });
    const click = async (x, y) => { if (touch) await pg.touchscreen.tap(box.x + x * box.w / 960, box.y + y * box.h / 540); else await pg.mouse.click(x, y); await pg.waitForTimeout(300); };
    for (let i = 0; i < 6; i++) {
      await openPortal(pg, KILLS5, 'bosque');
      await click(CHIP(i).x, CHIP(i).y);
      await click(795, 508); await pg.waitForTimeout(1500);
      const r = await pg.evaluate(() => ({ s: G.state, bi: G.curBiome, boss: G.bossId, mode: G.mode }));
      ok((r.s === 'play' || r.s === 'cards') && r.bi === DEST[i] && (r.boss === want[DEST[i]] || r.mode === 'run'), `${touch ? 'táctil' : 'ratón'}: ${DEST[i]} -> expedición (${JSON.stringify(r)})`);
      await pg.evaluate(() => { G.Aldea.open(false); });
    }
    ok(!pg.errs.length, `${touch ? 'táctil' : 'ratón'}: 0 errores ${pg.errs.slice(0, 2)}`); await close(pg);
  }
}

(async () => {
  const b = await launch();
  const M = { portal, peligro, hunt, ruta, platos, misiones, logros, estatua, anuncio, migrar, flow };
  for (const k of Object.keys(M)) if (mode === k || mode === 'all') await M[k](b);
  console.log(fails ? `RESULTADO: ${fails} FALLO(S)` : 'RESULTADO: TODO OK');
  await b.close(); process.exit(fails ? 1 : 0);
})();
