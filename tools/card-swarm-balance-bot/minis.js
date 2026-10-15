// Prueba de los minijefes v5: fuerza cada ataque, mide la duración de cada telegrafía y hace capturas.
// uso: node minis.js http://localhost:8771 [carpeta de capturas]
const { chromium } = require('/opt/node-tools/node_modules/playwright');
const base = process.argv[2] || 'http://localhost:8771', OUT = process.argv[3] || '/home/user/Game/studio/docs/capturas-balance-v5/';
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--no-sandbox', '--autoplay-policy=no-user-gesture-required'] });
  const errs = [];
  async function open(type, extra) {
    const pg = await b.newPage({ viewport: { width: 960, height: 540 } });
    pg.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
    pg.on('pageerror', e => errs.push('PAGEERR ' + e.message + ' ' + (e.stack || '').split('\n').slice(1, 3).join('|')));
    await pg.goto(`${base}/index.html?reset=1&dbg=1&god=1&len=9&t=${type === 'mini_bulwark' ? 205 : 325}&hand=spark:3,dart:3,shard:2,dagger:2,fang:2${extra || ''}`);
    await pg.waitForTimeout(300);
    await pg.evaluate((tp) => {
      G.startGame(); if (tp === 'mini_hive') G.Waves.elitesDone = { mini_bulwark: true };
      setInterval(() => { if (G.state === 'cards' && G.Cards.off) { try { G.Cards.off.mode === 'level' ? G.Cards.skip() : G.Cards.pick(0); } catch (e) { } } }, 100);
    }, type);
    for (let i = 0; i < 80; i++) { await pg.waitForTimeout(200); if (await pg.evaluate((t) => G.enemies.some(e => e.type === t && e.spawnT <= 0), type)) break; }
    // coloca al minijefe a 200 px a la derecha del jugador y quita los demás enemigos
    await pg.evaluate((t) => { const p = G.player, e = G.enemies.find(q => q.type === t); p.x = 700; p.y = 420; e.x = 900; e.y = 420; G.enemies.forEach(q => { if (q !== e) q.dead = true; }); G.Waves.W && 0; }, type);
    return pg;
  }
  // mide la duración de cada estado de un ataque forzado (muestreo cada 25 ms)
  async function timeline(pg, name, ms) {
    return await pg.evaluate(async ([nm, total]) => {
      const e = G.Enemies.minis()[0]; G.Enemies.forceMini(e, nm); const out = []; let last = null, t0 = performance.now();
      return await new Promise(res => { const iv = setInterval(() => { const st = e.st, now = performance.now() - t0; if (st !== last) { out.push([st, Math.round(now)]); last = st; } if (now > total || e.dead) { clearInterval(iv); res(out); } }, 20); });
    }, [name, ms]);
  }
  const tele = (tl) => tl.map((x, i) => x[0] + ':' + ((tl[i + 1] ? tl[i + 1][1] : '?') - x[1])).join(' ');
  // ---------------- Coloso
  let pg = await open('mini_bulwark');
  const shot = async (n) => pg.screenshot({ path: OUT + n + '.png' });
  const reset = async () => { await pg.evaluate(() => { const e = G.Enemies.minis()[0], p = G.player; e.hp = Math.max(e.hp, e.maxHp * 0.9); e.st = 'move'; e.atkT = 5000; e.expT = 0; e.shieldDown = false; e.orbs = null; p.x = 700; p.y = 420; e.x = 900; e.y = 420; G.projectiles.length = 0; G.zones.length = 0; }); await pg.waitForTimeout(250); };
  console.log('COLOSO hp', await pg.evaluate(() => { const e = G.Enemies.minis()[0]; return [e.hp, Math.round(e.shieldMax)]; }));
  // 1) embestida con onda de choque
  await reset(); pg.evaluate(() => G.Enemies.forceMini(G.Enemies.minis()[0], 'charge')); await pg.waitForTimeout(650); await shot('b1_embestida_tele');
  await pg.waitForTimeout(520); await shot('b2_embestida_carga'); await pg.waitForTimeout(620); await shot('b3_embestida_onda');
  await pg.waitForTimeout(500); await shot('b4_embestida_expuesto');
  await reset(); console.log('embestida', tele(await timeline(pg, 'charge', 4500)));
  // 2) escudos giratorios
  await reset(); pg.evaluate(() => G.Enemies.forceMini(G.Enemies.minis()[0], 'shields')); await pg.waitForTimeout(450); await shot('b5_escudos_aviso');
  await pg.waitForTimeout(1500); await shot('b6_escudos_giran'); await pg.waitForTimeout(1950); await shot('b7_escudos_lanzamiento_tele');
  await pg.waitForTimeout(450); await shot('b8_escudos_proyectiles');
  await reset(); console.log('escudos', tele(await timeline(pg, 'shields', 5200)));
  // 3) ataques originales (bash / stomp)
  await reset(); console.log('bash', tele(await timeline(pg, 'bash', 1800)));
  await reset(); console.log('stomp', tele(await timeline(pg, 'stomp', 2800)));
  // 4) escudo roto y enrage
  await reset(); await pg.evaluate(() => { const e = G.Enemies.minis()[0]; e.shieldHp = 5; G.Combat.deal(e, 100, { tag: 'steel', proj: true, sx: e.x + 40 * Math.cos(e.fa), sy: e.y + 40 * Math.sin(e.fa) }); });
  await pg.waitForTimeout(350); await shot('b9_escudo_roto');
  await reset(); await pg.evaluate(() => { const e = G.Enemies.minis()[0]; e.hp = e.maxHp * 0.49; }); await pg.waitForTimeout(450); await shot('b10_enrage');
  await pg.waitForTimeout(1200); await reset(); pg.evaluate(() => G.Enemies.forceMini(G.Enemies.minis()[0], 'charge')); await pg.waitForTimeout(1900); await shot('b11_enrage_doble_embestida');
  console.log('COLOSO enraged charge x2', tele(await timeline(pg, 'charge', 6000)));
  await pg.close();
  // ---------------- Colmena
  pg = await open('mini_hive'); const shot2 = async (n) => pg.screenshot({ path: OUT + n + '.png' });
  const reset2 = async () => { await pg.evaluate(() => { const e = G.Enemies.minis()[0], p = G.player; e.hp = Math.max(e.hp, e.maxHp * 0.9); e.st = 'move'; e.atkT = 5000; e.ecT = 99999; e.expT = 0; e.rain = null; p.x = 700; p.y = 420; e.x = 940; e.y = 420; G.projectiles.length = 0; G.zones.length = 0; G.enemies.forEach(q => { if (q !== e) q.dead = true; }); }); await pg.waitForTimeout(250); };
  console.log('COLMENA hp', await pg.evaluate(() => { const e = G.Enemies.minis()[0]; return [e.hp, Math.round(e.sacMax)]; }));
  await reset2(); pg.evaluate(() => G.Enemies.forceMini(G.Enemies.minis()[0], 'rain')); await pg.waitForTimeout(600); await shot2('h1_lluvia_tele'); await pg.waitForTimeout(400); await shot2('h2_lluvia_impacto');
  await reset2(); console.log('lluvia', tele(await timeline(pg, 'rain', 1800)));
  await reset2(); pg.evaluate(() => G.Enemies.forceMini(G.Enemies.minis()[0], 'tide')); await pg.waitForTimeout(500); await shot2('h3_marea_tele'); await pg.waitForTimeout(900); await shot2('h4_marea_activa');
  await reset2(); console.log('marea', tele(await timeline(pg, 'tide', 1800)));
  await reset2(); await pg.evaluate(() => { const e = G.Enemies.minis()[0]; e.sacHp = 5; G.Combat.deal(e, 100, { tag: 'steel', proj: true }); }); await pg.waitForTimeout(350); await shot2('h5_saco_roto');
  await reset2(); await pg.evaluate(() => { const e = G.Enemies.minis()[0]; e.hp = e.maxHp * 0.49; }); await pg.waitForTimeout(700); await shot2('h6_estallido_tele');
  await pg.waitForTimeout(700); await shot2('h7_estallido');
  
  console.log('errores:', errs.length ? errs.join('\n') : 'NINGUNO');
  await b.close();
})();
