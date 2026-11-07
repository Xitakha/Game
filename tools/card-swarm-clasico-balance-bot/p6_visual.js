// P6: capturas de legibilidad de Melaria (<= 4, JPEG <= 200 KB) -> studio/docs/capturas-p6-logica/. uso: node p6_visual.js [base] [carpeta]
const { chromium } = require('/opt/node-tools/node_modules/playwright');
const fs = require('fs');
const base = process.argv[2] || 'http://localhost:8793', OUT = process.argv[3] || '/tmp/';
const SIM = `window.__sim = function (ms) { var dt = 1000 / 60, t = 0; while (t < ms) { G.time += dt; G.Player.update(G.player, dt); G.Enemies.update(dt); G.Combat.update(dt); G.Panal.update(dt); G.fx.update(dt); G.Hud.update(dt); G.pendingLevels = 0; G.player.hp = G.player.maxHp; t += dt; } };`;
async function open(b, q, vp, ctxOpts) {
  const ctx = ctxOpts ? await b.newContext(ctxOpts) : null, pg = ctx ? await ctx.newPage() : await b.newPage({ viewport: vp || { width: 960, height: 540 } }); pg.errs = [];
  pg.on('pageerror', e => pg.errs.push(e.message)); pg.on('console', m => { if (m.type() === 'error') pg.errs.push(m.text()); });
  await pg.goto(`${base}/index.html?reset=1&god=1&dbg=1&boss=melaria&nointro=1&prep=0&hand=spark:3,ember:2,shard:2,dart:2,dagger:2&nosw=1&speed=1${q}`); await pg.waitForTimeout(600);
  await pg.evaluate(SIM); await pg.evaluate(() => { G.state = 'play'; window.__sim(5400); });
  return pg;
}
const prep = () => { var e = G.Boss.e; e.atk = null; e.bst = 'idle'; e.mode = 'fight'; e.immune = false; e.stagT = 0; e.exps.length = 0; e.cadT = 1e9; for (var k in G.Boss.cds) G.Boss.cds[k] = 0; };
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--no-sandbox'] });
  // 1) Estocada real telegrafiada (carril desde el aguijón) con la barra, partes y chips de debilidades (Veneno inmune)
  let pg = await open(b, '&phase=2');
  await pg.evaluate(prep); await pg.evaluate(() => { G.player.x = 560; G.player.y = 470; G.Boss.force('m_estocada'); window.__sim(650); });
  await pg.screenshot({ path: OUT + 'p6_estocada.jpg', type: 'jpeg', quality: 62 }); await pg.close();
  // 2) Panal abierto: celdas con aviso y nidos en rojo (Melaria F3, adds)
  pg = await open(b, '&phase=3');
  await pg.evaluate(prep); await pg.evaluate(() => { G.player.x = 640; G.player.y = 470; G.Boss.force('m_panal'); window.__sim(850); });
  await pg.screenshot({ path: OUT + 'p6_panal_abierto.jpg', type: 'jpeg', quality: 62 }); await pg.close();
  // 3) Zumbido Mortal: anillos hexagonales con huecos
  pg = await open(b, '&phase=3');
  await pg.evaluate(() => { const e = G.Boss.e; prep_(); function prep_() { e.atk = null; e.bst = 'idle'; e.mode = 'fight'; e.immune = false; } e.hp = e.maxHp * 0.0801; G.Combat.deal(e, 5000, { id: 'y', tag: 'neutral', proj: true }); window.__sim(3100); G.player.x = 720 + 150; G.player.y = 405 + 20; window.__sim(200); });
  await pg.screenshot({ path: OUT + 'p6_zumbido_mortal.jpg', type: 'jpeg', quality: 62 }); await pg.close();
  // 4) táctil 844x390: Picado telegrafiado (sombra) con el joystick
  pg = await open(b, '&phase=2', null, { viewport: { width: 844, height: 390 }, hasTouch: true, isMobile: true, deviceScaleFactor: 1 });
  await pg.evaluate(prep); await pg.evaluate(() => { G.player.x = 560; G.player.y = 480; G.Boss.force('m_picado'); window.__sim(560); });
  await pg.screenshot({ path: OUT + 'p6_tactil_844x390.jpg', type: 'jpeg', quality: 62 }); await pg.close();
  fs.readdirSync(OUT).filter(f => /^p6_.*\.jpg$/.test(f)).forEach(f => console.log(f, Math.round(fs.statSync(OUT + f).size / 1024) + ' KB'));
  await b.close();
})();
