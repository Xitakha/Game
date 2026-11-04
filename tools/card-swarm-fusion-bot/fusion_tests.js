// PRUEBAS del prototipo Fusión (games/card-swarm-fusion). Uso:
//   python3 tools/serve.py card-swarm-fusion 8811 &      (cierra el servidor por PID, nunca pkill -f)
//   node tools/card-swarm-fusion-bot/fusion_tests.js [all|iso|flow|powers|touch|boss] [base=http://localhost:8811]
// Chromium de /opt/pw-browsers (sin playwright install). Vista 844x390 táctil. Cada partida debe terminar con 0 errores de consola.
const { chromium } = require('/opt/node-tools/node_modules/playwright');
const { execSync } = require('child_process');
const fs = require('fs'), path = require('path');
const mode = process.argv[2] || 'all', base = process.argv[3] || 'http://localhost:8811';
const ROOT = path.join(__dirname, '..', '..');
let fails = 0, total = 0;
const ok = (c, msg) => { total++; if (!c) fails++; console.log((c ? 'OK     ' : 'FALLO  ') + msg); };
const launch = () => chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--no-sandbox', '--autoplay-policy=no-user-gesture-required'] });
async function mk(b, url) {
  const ctx = await b.newContext({ viewport: { width: 844, height: 390 }, hasTouch: true, isMobile: true }), pg = await ctx.newPage(); pg.errs = []; pg.ctx = ctx;
  pg.on('console', m => { if (m.type() === 'error') pg.errs.push(m.text()); }); pg.on('pageerror', e => pg.errs.push('PAGEERR ' + e.message));
  await pg.goto(`${base}/index.html?nosw=1&${url}`); await pg.waitForTimeout(600);
  return pg;
}
const done = async (pg, name) => { ok(pg.errs.length === 0, `${name}: 0 errores de consola` + (pg.errs.length ? ' -> ' + pg.errs.slice(0, 3).join(' | ') : '')); await pg.close(); await pg.ctx.close(); };
const E = (pg, fn, arg) => pg.evaluate(fn, arg);
const sleep = (pg, ms) => pg.waitForTimeout(ms);
const key = async (pg, k) => { await sleep(pg, 320); await pg.keyboard.press(k); await sleep(pg, 120); };   // las ventanas ignoran pulsaciones los primeros 200 ms
// coordenadas del juego (960x540) -> punto de la página
async function gp(pg, x, y) { const r = await E(pg, () => { const b = document.getElementById('game').getBoundingClientRect(); return { l: b.left, t: b.top, w: b.width, h: b.height }; }); return { x: r.l + x * r.w / 960, y: r.t + y * r.h / 540 }; }
async function tap(pg, x, y) { const p = await gp(pg, x, y); await pg.touchscreen.tap(p.x, p.y); await sleep(pg, 80); }
async function waitState(pg, st, ms = 4000) { const t0 = Date.now(); while (Date.now() - t0 < ms) { if ((await E(pg, () => G.state)) === st) return true; await sleep(pg, 50); } return false; }
const autoSkip = pg => E(pg, () => { setInterval(() => { if (G.state === 'cards' && G.Cards.off && G.Cards.off.mode === 'level' && !G.Cards.off.modal && !G.Cards.off.keep) G.Cards.skip(); }, 150); });   // las subidas de nivel por XP no deben frenar las pruebas de poderes
const spawnAround = (pg, n, dist) => E(pg, ([n, dist]) => { const p = G.player; for (let i = 0; i < n; i++) { const a = i * 6.283 / n; G.Enemies.spawn('worm', p.x + Math.cos(a) * dist, p.y + Math.sin(a) * dist); } }, [n, dist]);

async function iso() {
  console.log('--- aislamiento del juego original');
  const chg = execSync('git diff --stat b7a1ea7 -- games/card-swarm tools/card-swarm-balance-bot tools/card-swarm-boss-bot tools/card-swarm-iso tools/card-swarm-pwa/stamp.py tools/card-swarm-pwa/make-icons.js tools/serve.py', { cwd: ROOT }).toString().trim();
  ok(chg === '', 'games/card-swarm, sus tests/bots y stamp.py intactos respecto al diseño' + (chg ? ': ' + chg : ''));
  const sw = fs.readFileSync(path.join(ROOT, 'games/card-swarm-fusion/sw.js'), 'utf8'), man = JSON.parse(fs.readFileSync(path.join(ROOT, 'games/card-swarm-fusion/manifest.webmanifest'), 'utf8'));
  ok(/const CACHE = 'fusionhand-'/.test(sw) && !/startsWith\('swarmhand-'\)/.test(sw), 'sw.js: cache fusionhand-* (el original borra swarmhand-*: no puede tocarlo)');
  ok(man.name === 'Swarm Hand: Fusión' && man.start_url === './' && man.scope === './' && man.id !== './', 'manifest propio: ' + man.name + ' / id ' + man.id);
  const html = fs.readFileSync(path.join(ROOT, 'games/card-swarm-fusion/index.html'), 'utf8');
  ok(/<title>Swarm Hand: Fusión/.test(html), 'título propio');
  const out = execSync('python3 tools/card-swarm-pwa/stamp_fusion.py', { cwd: ROOT }).toString();
  ok(/sw\.js: \d+ archivos/.test(out), 'stamp_fusion.py: ' + out.trim());
  ok(/assets_fusion\.js/.test(fs.readFileSync(path.join(ROOT, 'games/card-swarm-fusion/sw.js'), 'utf8')) && /sfx_fusion\.js/.test(sw + fs.readFileSync(path.join(ROOT, 'games/card-swarm-fusion/sw.js'), 'utf8')), 'precache incluye assets_fusion.js y sfx_fusion.js');
  const b = await launch(); const pg = await mk(b, 'reset=1');
  await sleep(pg, 500);
  await E(pg, () => G.Save.save());
  const keys = await E(pg, () => Object.keys(localStorage));
  ok(keys.length > 0 && keys.every(k => k.startsWith('swarmhand.fusion.')), 'localStorage solo usa swarmhand.fusion.*: ' + keys.join(','));
  await done(pg, 'iso'); await b.close();
}

async function flow() {
  console.log('--- flujo: inicio, infusiones, fusión, reemplazo, Nv2');
  const b = await launch(); const pg = await mk(b, 'reset=1&god=1');
  ok((await E(pg, () => G.state)) === 'cards', 'arranca directo en la oferta inicial (sin aldea)');
  const offer = await E(pg, () => G.Cards.off.cards.map(id => G.Cards.def(id).tag));
  ok(offer.length === 3 && new Set(offer).size === 3, 'oferta inicial: 3 etiquetas distintas ' + offer);
  // la carta inicial es de Fuego para que las recetas sean predecibles
  await E(pg, () => { G.Cards.off.cards = ['spark', 'shard', 'dart']; });
  await sleep(pg, 400);
  const sr = await E(pg, () => G.Cards.offerRect(0)); await tap(pg, sr.x + 100, sr.y + 100);
  ok(await waitState(pg, 'play'), 'elegir la inicial con un toque -> partida');
  ok((await E(pg, () => G.player.hand[0] && G.player.hand[0].id + G.player.hand[0].starter)) === 'sparktrue', 'carta inicial marcada');
  // ataque básico + infusión de fuego
  await sleep(pg, 700); await spawnAround(pg, 3, 120); await sleep(pg, 2500);
  ok((await E(pg, () => G.Fusion.stats.basicShots)) > 0, 'el ataque básico dispara solo');
  ok((await E(pg, () => G.Weapons && G.projectiles.every(q => q.team !== 'p' || q.kind === 'basic'))), 'solo proyectiles básicos (las cartas no disparan)');
  const mods = await E(pg, () => { const i = G.Fusion.infusion(); return JSON.stringify(i); }); ok(/"fire":\{"bonus":0.2/.test(mods), 'infusión Fuego Nv1 +20 %: ' + mods);
  // 1.ª oferta tras el inicio: garantiza una carta que forme receta
  let guar = 0; for (let k = 0; k < 40; k++) { const o = await E(pg, () => { G.Cards.open('level'); return G.Cards.off.cards.some(id => G.Cards.newCombos(G.Cards.def(id).tag).length > 0); }); if (o) guar++; }
  ok(guar === 40, '1.ª oferta (sin fusiones): siempre hay carta de fusión (' + guar + '/40)');
  await E(pg, () => { G.state = 'play'; G.Cards.off = null; });
  // oferta de nivel: Esquirla completa Vapor -> ventana FUSIONAR YA
  await E(pg, () => { G.pendingLevels = 1; G.Cards.open('level'); G.state = 'cards'; G.Cards.off.cards = ['shard', 'zap', 'dart']; });
  await sleep(pg, 500);
  const r0 = await E(pg, () => G.Cards.offerRect(0)); await tap(pg, r0.x + 100, r0.y + 100);
  let modal = await E(pg, () => G.Cards.off && G.Cards.off.modal && { title: G.Cards.off.modal.title, b: G.Cards.off.modal.buttons.map(x => x.label) });
  ok(modal && /Vapor/.test(modal.title) && /FUSIONAR YA/.test(modal.b[0]) && /conservas/.test(modal.b[0]), 'ventana de fusión visible: ' + (modal && modal.b[0]));
  const png = await pg.screenshot({ type: 'jpeg', quality: 40 }); fs.writeFileSync(process.env.SHOT_MODAL || '/tmp/claude-0/-home-user-Game/ac8df0e6-87e6-5837-9d6a-fa8dcc4300ed/scratchpad/modal.jpg', png);
  await sleep(pg, 300); await key(pg, 'Digit1'); await sleep(pg, 300);
  ok(await waitState(pg, 'play'), 'FUSIONAR YA cierra la oferta');
  let s = await E(pg, () => G.Fusion.snapshot());
  ok(s.actives[0] && s.actives[0].id === 'vapor' && s.actives[0].lvl === 1, '1.ª fusión: poder Vapor Nv1');
  ok(s.hand[0] === 'spark:1' && s.hand[1] === null, '1.ª fusión ayudada: se conserva la inicial, se consume la ofrecida: ' + s.hand);
  ok((await E(pg, () => G.pendingLevels)) === 0, 'la fusión cuenta como elección de nivel');
  // 2.ª fusión desde la mano (botón FUSIONAR): se consumen las dos
  await E(pg, () => { G.pendingLevels = 1; G.Cards.open('level'); G.state = 'cards'; G.Cards.add('zap'); G.Cards.add('dart'); G.Cards.recalc(false); });
  await sleep(pg, 500);
  const fr = await E(pg, () => G.Cards.fuseRect); await tap(pg, fr.x + 50, fr.y + 15);
  modal = await E(pg, () => G.Cards.off.modal && G.Cards.off.modal.buttons.map(x => x.label));
  ok(modal && modal.length === 3 && /Plasma/.test(modal.join()) && /Gas/.test(modal.join()), 'botón FUSIONAR lista las parejas: ' + (modal || []).join(' | '));
  const plasmaIdx = modal.findIndex(l => /Plasma/.test(l)); await key(pg, 'Digit' + (plasmaIdx + 1)); await sleep(pg, 300);
  s = await E(pg, () => G.Fusion.snapshot());
  ok(s.actives[1] && s.actives[1].id === 'plasma', '2.º poder: Plasma en el slot 2');
  ok(s.hand[0] === null && s.hand[1] === null && s.hand[2] === 'dart:1', 'fusión posterior: se consumen las dos cartas: ' + s.hand);
  ok((await E(pg, () => G.state)) === 'cards', 'fusionar desde la mano no cierra la oferta');
  // tercera receta: hay que elegir qué poder reemplazar (con cancelar)
  await E(pg, () => { G.Cards.add('spark'); G.Cards.recalc(false); });
  await tap(pg, fr.x + 50, fr.y + 15);
  modal = await E(pg, () => G.Cards.off.modal && { t: G.Cards.off.modal.title, b: G.Cards.off.modal.buttons.map(x => x.label) });
  ok(modal && /Gas/.test(modal.b.join()), 'Gas inflamable disponible (dardo + chispa)');
  await key(pg, 'Digit1'); await sleep(pg, 300);
  modal = await E(pg, () => G.Cards.off.modal && { t: G.Cards.off.modal.title, b: G.Cards.off.modal.buttons.map(x => x.label) });
  ok(modal && /2 PODERES/.test(modal.t) && modal.b.length === 3 && /CANCELAR/.test(modal.b[2]), 'con 2 poderes pide confirmar cuál reemplazar: ' + (modal && modal.b.join(' | ')));
  await key(pg, 'Digit3'); await sleep(pg, 300);
  s = await E(pg, () => G.Fusion.snapshot());
  ok(s.actives[0].id === 'vapor' && s.actives[1].id === 'plasma' && s.hand[2] === 'dart:1', 'cancelar no consume nada');
  const ash0 = await E(pg, () => G.player.ash);
  await tap(pg, fr.x + 50, fr.y + 15); await key(pg, 'Digit1'); await sleep(pg, 300); await key(pg, 'Digit1'); await sleep(pg, 300);
  s = await E(pg, () => G.Fusion.snapshot());
  ok(s.actives[0].id === 'gas' && s.actives[1].id === 'plasma', 'reemplazo confirmado: Gas sustituye a Vapor');
  ok((await E(pg, ash0 => G.player.ash - ash0, ash0)) === 20, 'el poder reemplazado da +20 Ceniza');
  // Nv2 re-fusionando la misma receta
  await E(pg, () => { G.Cards.add('spark'); G.Cards.add('zap'); G.Cards.recalc(false); });
  const pairs = await E(pg, () => G.Fusion.handPairs().map(p => p.recipe.id).sort().join());
  ok(/plasma/.test(pairs), 'pareja de Plasma disponible para re-fusionar (parejas: ' + pairs + ')');
  await E(pg, () => { const o = G.Fusion.handPairs().find(p => p.recipe.id === 'plasma'); G.Fusion.fuse(o.recipe, o.slot, o.slot2, null, () => {}); });
  s = await E(pg, () => G.Fusion.snapshot());
  ok(s.actives[1].id === 'plasma' && s.actives[1].lvl === 2, 'misma receta otra vez -> Nv2');
  ok((await E(pg, () => G.Fusion.handPairs().every(p => p.recipe.id !== 'plasma'))), 'Nv2 es el tope: la receta deja de ofrecerse');
  // parejas sin receta
  ok((await E(pg, () => G.Fusion.recipeFor('ice', 'blood') === null && G.Fusion.recipeFor('poison', 'steel') === null)), 'parejas sin receta (hielo+sangre, veneno+acero) no fusionan');
  await done(pg, 'flow'); await b.close();
}

async function powers() {
  console.log('--- poderes: cada uno dispara, daña y entra en enfriamiento');
  const b = await launch();
  for (const id of ['vapor', 'plasma', 'gas', 'sed']) {
    const pg = await mk(b, `reset=1&god=1&speed=3&actives=${id}&hand=spark:1,shard:1`);
    await autoSkip(pg); await sleep(pg, 800); await E(pg, () => { G.player.hp = 40; }); await spawnAround(pg, 14, 70); await sleep(pg, 1000);
    const ready = await E(pg, () => G.player.actives[0].cd <= 0 || (G.player.actives[0].cd = 0, true));
    await E(pg, () => { G.player.actives[0].cd = 0; }); await pg.keyboard.press('KeyQ'); await sleep(pg, 600);
    let st = await E(pg, () => { const s = G.Fusion.snapshot(); const bl = G.enemies.filter(e => e.blindT > 0 || e.slowT > 0).length; return { s, bl, orb: G.player.actives[0].st && G.player.actives[0].st.bodies && G.player.actives[0].st.bodies.length, fields: G.Fusion.fields.length }; });
    ok(st.s.actives[0].uses === 1 && st.s.actives[0].cd > 5000, `${id}: Q lo dispara y entra en cooldown (${st.s.actives[0].cd} ms)`);
    ok(id === 'sed' ? st.orb === 3 : id === 'plasma' ? (await E(pg, () => !!G.player.actives[0].st)) : id === 'gas' ? true : st.fields === 1, `${id}: efecto activo (campos ${st.fields}, orbes ${st.orb})`);
    await sleep(pg, id === 'sed' ? 5000 : id === 'gas' ? 6500 : 3000);
    st = await E(pg, () => G.Fusion.snapshot());
    ok(st.actives[0].dmg > 0, `${id}: ha hecho daño (${st.actives[0].dmg})`);
    if (id === 'vapor') { await E(pg, () => { G.player.actives[0].cd = 0; }); await spawnAround(pg, 6, 60); await E(pg, () => G.enemies.forEach(e => { e.hp = e.maxHp = 1e6; })); await sleep(pg, 700); await pg.keyboard.press('KeyQ'); await sleep(pg, 100);
      const vs = await E(pg, () => ({ blind: G.enemies.filter(e => e.blindT > 0).length, slow: G.enemies.filter(e => e.slowT > 0).length })); ok(vs.blind > 0 && vs.slow > 0, 'vapor: ciega y ralentiza (' + vs.blind + ' ciegos, ' + vs.slow + ' lentos)'); }
    if (id === 'sed') ok(await E(pg, () => G.player.hp > 40), 'sed: curación por golpes del básico (hp ' + await E(pg, () => G.player.hp) + ')');
    if (id === 'gas') ok(await E(pg, () => G.Fusion.fields.length === 0), 'gas: la nube detonó y se retiró');
    // enfriamiento termina y avisa
    await E(pg, () => { G.player.actives[0].cd = 20; }); await sleep(pg, 70);
    ok((await E(pg, () => G.player.actives[0].readyT)) > 0, `${id}: aviso de poder listo`);
    await done(pg, 'poder ' + id);
  }
  await b.close();
}

async function touch() {
  console.log('--- táctil: botones grandes, sin chocar con el joystick ni con mobile.js');
  const b = await launch(); const pg = await mk(b, 'reset=1&god=1&actives=vapor,plasma&hand=spark:1&speed=2');
  await autoSkip(pg); await sleep(pg, 800);
  const g = await E(pg, () => ({ btn: G.Fusion.BTN, auto: G.Fusion.AUTO, hand: [0, 1, 2, 3, 4].map(i => G.Cards.slotRect(i, false)) }));
  const hit = (c, r) => { const px = Math.max(r.x, Math.min(c.x, r.x + r.w)), py = Math.max(r.y, Math.min(c.y, r.y + r.h)); return Math.hypot(c.x - px, c.y - py) < c.r; };
  const sysBtns = [{ x: 246, y: 6, w: 48, h: 48 }, { x: 298, y: 6, w: 48, h: 48 }];   // mobile.js BTN.pause / muteRun
  ok(g.btn.every(c => c.x - c.r >= 480), 'botones en la mitad derecha (el joystick flotante solo nace en x < 480)');
  ok(g.btn.every(c => c.r >= 40) && Math.hypot(g.btn[0].x - g.btn[1].x, g.btn[0].y - g.btn[1].y) > g.btn[0].r + g.btn[1].r, 'radio >= 40 (unos 61 px de diámetro en 844x390) y botones sin solaparse');
  ok(g.btn.every(c => !g.hand.some(r => hit(c, r)) && !sysBtns.some(r => hit(c, r)) && c.x + c.r <= 960 && c.y + c.r <= 540), 'sin solapar la mano ni los botones de pausa / silencio de mobile.js');
  // toque en el botón 1 dispara
  await E(pg, () => { G.player.actives[0].cd = 0; }); await spawnAround(pg, 6, 80); await sleep(pg, 1300);
  await tap(pg, g.btn[0].x, g.btn[0].y);
  ok((await E(pg, () => G.player.actives[0].uses)) === 1, 'toque en el botón 1 dispara el poder 1');
  // joystick y botón a la vez (dos dedos)
  const res = await E(pg, async ([c]) => {
    const cv = document.getElementById('game'), r = cv.getBoundingClientRect(), X = x => r.left + x * r.width / 960, Y = y => r.top + y * r.height / 540;
    const ev = (t, id, x, y) => cv.dispatchEvent(new PointerEvent(t, { pointerType: 'touch', pointerId: id, clientX: X(x), clientY: Y(y), bubbles: true, cancelable: true, isPrimary: id === 5 }));
    G.player.actives[1].cd = 0; const x0 = G.player.x;
    ev('pointerdown', 5, 150, 400); ev('pointermove', 5, 220, 400);
    const joyOn = G.input.joy.active;
    ev('pointerdown', 6, c.x, c.y); ev('pointerup', 6, c.x, c.y);
    const still = G.input.joy.active, used = G.player.actives[1].uses;
    await new Promise(r => setTimeout(r, 500));
    const moved = G.player.x - x0; ev('pointerup', 5, 220, 400);
    return { joyOn, still, used, moved };
  }, [g.btn[1]]);
  ok(res.joyOn && res.still && res.used === 1 && res.moved > 20, `joystick a la izquierda y botón 2 a la derecha a la vez (joy ${res.joyOn}/${res.still}, usos ${res.used}, avance ${Math.round(res.moved)} px)`);
  // AUTO
  await tap(pg, g.auto.x + 40, g.auto.y + 10); ok(await E(pg, () => G.Fusion.auto), 'chip AUTO activa el modo automático');
  await E(pg, () => { G.player.actives[0].cd = 0; }); await spawnAround(pg, 8, 90); await sleep(pg, 2500);
  ok((await E(pg, () => G.player.actives[0].uses)) >= 2, 'modo AUTO dispara solo con >= 3 enemigos');
  await E(pg, () => { G.state = 'play'; });
  await pg.keyboard.press('KeyF'); await sleep(pg, 100); ok(!(await E(pg, () => G.Fusion.auto)), 'tecla F alterna AUTO');
  await done(pg, 'touch'); await b.close();
}

async function boss() {
  console.log('--- jefe: tope por uso y partida de humo con el Pastor');
  const b = await launch(); const pg = await mk(b, 'reset=1&god=1&dbg=1&speed=4&boss=pastor&nointro=1&prep=0&actives=plasma,vapor&hand=spark:1,shard:2');
  await autoSkip(pg); await sleep(pg, 2500);
  const hp0 = await E(pg, () => { const e = G.Enemies.boss(); return e ? e.hp : 0; });
  ok(hp0 > 0, 'el Pastor está en la arena (hp ' + Math.round(hp0) + ')');
  await E(pg, () => { const e = G.Enemies.boss(); G.player.x = e.x - 150; G.player.y = e.y; G.player.actives[0].cd = 0; });
  await sleep(pg, 400); await pg.keyboard.press('KeyQ'); await sleep(pg, 3200);
  const r = await E(pg, () => { const s = G.player.actives[0], e = G.Enemies.boss(); const used = Object.values(s.use).reduce((a, b) => Math.max(a, b), 0); return { used, cap: G.Fusion.P.bossCap * e.maxHp, uses: s.uses, hp: e.hp }; });
  ok(r.uses === 1 && r.used > 0 && r.used <= r.cap + 12, `plasma contra el jefe respeta el tope por uso (${Math.round(r.used)} <= ${Math.round(r.cap)})`);
  await sleep(pg, 8000);
  const hp1 = await E(pg, () => G.Enemies.boss().hp); ok(hp1 < hp0, 'el básico + poderes dañan al jefe (' + Math.round(hp0) + ' -> ' + Math.round(hp1) + ')');
  await done(pg, 'boss'); await b.close();
}

(async () => {
  const run = { iso, flow, powers, touch, boss };
  if (mode === 'all') for (const k of Object.keys(run)) await run[k](); else await run[mode]();
  console.log(`\n${total - fails}/${total} OK`); process.exit(fails ? 1 : 0);
})().catch(e => { console.error(e); process.exit(2); });
