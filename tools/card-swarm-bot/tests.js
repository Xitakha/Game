// PRUEBAS de Swarm Hand (games/card-swarm). Uso:
//   python3 tools/serve.py card-swarm 8811 &      (cierra el servidor por PID, nunca pkill -f)
//   node tools/card-swarm-bot/tests.js [all|iso|flow|powers|ui|village|touch|boss|balance|armor] [base=http://localhost:8811]
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
  console.log('--- PWA / guardado / precache (games/card-swarm)');
  const G_DIR = 'games/card-swarm/';
  const sw = fs.readFileSync(path.join(ROOT, G_DIR, 'sw.js'), 'utf8'), man = JSON.parse(fs.readFileSync(path.join(ROOT, G_DIR, 'manifest.webmanifest'), 'utf8'));
  ok(/const CACHE = 'fusionhand-'/.test(sw) && !/startsWith\('swarmhand-'\)/.test(sw), 'sw.js: cache fusionhand-* (no colisiona con las swarmhand-* del clasico)');
  ok(man.name === 'Swarm Hand' && man.start_url === './' && man.scope === './' && man.id === './', 'manifest: ' + man.name + ' / id ' + man.id);
  const html = fs.readFileSync(path.join(ROOT, G_DIR, 'index.html'), 'utf8');
  ok(/<title>Swarm Hand<\/title>/.test(html), 'titulo Swarm Hand');
  const out = execSync('python3 tools/card-swarm-pwa/stamp.py', { cwd: ROOT }).toString();
  ok(/sw\.js: \d+ archivos/.test(out), 'stamp.py: ' + out.trim());
  const sw2 = fs.readFileSync(path.join(ROOT, G_DIR, 'sw.js'), 'utf8');
  const files = JSON.parse(sw2.match(/\/\*FILES\*\/([\s\S]*?)\/\*END\*\//)[1]);
  const missing = fs.readdirSync(path.join(ROOT, G_DIR, 'src')).filter(f => f.endsWith('.js') && !files.includes('./src/' + f));
  ok(missing.length === 0, 'precache incluye todos los src/*.js' + (missing.length ? ' (faltan ' + missing.join(',') + ')' : ''));
  ok(/assets_fusion\.js/.test(sw2) && /sfx_fusion\.js/.test(sw2), 'precache incluye assets_fusion.js y sfx_fusion.js');
  const b = await launch(); const pg = await mk(b, 'reset=1');
  await sleep(pg, 500);
  await E(pg, () => G.Save.save());
  const keys = await E(pg, () => Object.keys(localStorage));
  ok(keys.length > 0 && keys.every(k => k.startsWith('swarmhand.fusion.')), 'localStorage solo usa swarmhand.fusion.*: ' + keys.join(','));
  await done(pg, 'iso'); await b.close();
}

async function flow() {
  console.log('--- flujo: inicio, infusiones, fusión, reemplazo, Nv2');
  const b = await launch(); const pg = await mk(b, 'reset=1&god=1&direct=1&all=1&noanchor=1');
  ok((await E(pg, () => G.state)) === 'cards' || (await E(pg, () => G.state)) === 'play', '?direct=1 arranca en partida (la aldea abre sin direct)');
  await E(pg, () => { G.Save.data.anchors = []; G.startGame(); });
  ok((await E(pg, () => G.state)) === 'cards', 'sin ancla: oferta inicial');
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
  const mods = await E(pg, () => { const i = G.Fusion.infusion(); return JSON.stringify(i); }); ok(/"fire":\{"bonus":0.1[34]/.test(mods), 'infusión Fuego Nv1 +14 % (20 % x infmul 0,7): ' + mods);
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
  ok(modal && modal.length === 4 && /Plasma/.test(modal.join()) && /Gas/.test(modal.join()), 'botón FUSIONAR lista las parejas: ' + (modal || []).join(' | '));
  const plasmaIdx = modal.findIndex(l => /Plasma/.test(l)); await key(pg, 'Digit' + (plasmaIdx + 1)); await sleep(pg, 300);
  s = await E(pg, () => G.Fusion.snapshot());
  ok(s.actives[1] && s.actives[1].id === 'plasma', '2.º poder: Plasma en el slot 2');
  ok(s.hand[0] === null && s.hand[1] === null && s.hand[2] === 'dart:1', 'fusión posterior: se consumen las dos cartas: ' + s.hand);
  ok((await E(pg, () => G.state)) === 'cards', 'fusionar desde la mano no cierra la oferta');
  await E(pg, () => { G.Fusion.grant('sed'); G.Fusion.grant('forja'); });   // 4 poderes: el 5.º pide reemplazo
  // quinta receta: hay que elegir qué poder reemplazar (con cancelar)
  await E(pg, () => { G.Cards.add('spark'); G.Cards.recalc(false); });
  await tap(pg, fr.x + 50, fr.y + 15);
  modal = await E(pg, () => G.Cards.off.modal && { t: G.Cards.off.modal.title, b: G.Cards.off.modal.buttons.map(x => x.label) });
  ok(modal && /Gas/.test(modal.b.join()), 'Gas inflamable disponible (dardo + chispa)');
  await key(pg, 'Digit1'); await sleep(pg, 300);
  modal = await E(pg, () => G.Cards.off.modal && { t: G.Cards.off.modal.title, b: G.Cards.off.modal.buttons.map(x => x.label) });
  ok(modal && /4 PODERES/.test(modal.t) && modal.b.length === 5 && /CANCELAR/.test(modal.b[4]), 'con 4 poderes pide confirmar cuál reemplazar: ' + (modal && modal.b.join(' | ')));
  await key(pg, 'Digit5'); await sleep(pg, 300);
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
  console.log('--- poderes: los 12 disparan, dañan / aplican su efecto y entran en enfriamiento (Nv1 y Nv2)');
  const b = await launch();
  const IDS = ['vapor', 'plasma', 'gas', 'sed', 'tormenta', 'escarcha', 'pacto', 'iman', 'forja', 'filo', 'hemo', 'descarga'];
  for (const lv of [1, 2]) for (const id of IDS) {
    if (lv === 2 && !['tormenta', 'escarcha', 'pacto', 'iman', 'forja', 'filo', 'hemo', 'descarga'].includes(id)) continue;
    const pg = await mk(b, `reset=1&god=1&direct=1&all=1&speed=3&nointro=1&actives=${id}${lv === 2 ? '2' : ''}&hand=spark:1,shard:1&bcd=60000&aux=0`);
    await autoSkip(pg); await sleep(pg, 600); await E(pg, () => { G.player.hp = 60; });
    await E(pg, () => { for (let i = 0; i < 16; i++) { const a = i * 0.4; G.Enemies.spawn('worm', G.player.x + Math.cos(a) * (70 + i * 7), G.player.y + Math.sin(a) * (70 + i * 7)); } });
    await sleep(pg, 900);
    await E(pg, id => { G.enemies.forEach(e => { e.hp = e.maxHp = 600; if (id === 'descarga') G.Combat.poison(e, 3); if (id === 'filo' || id === 'tormenta') G.Combat.slow(e, 0.3, 6000); }); G.player.actives[0].cd = 0; }, id);
    const hp0 = await E(pg, () => G.enemies.reduce((a, e) => a + e.hp, 0));
    await pg.keyboard.press('KeyQ'); await sleep(pg, ['filo', 'descarga'].includes(id) ? 20 : 100);
    let st = await E(pg, () => { const s = G.Fusion.snapshot(); return { s, fields: G.Fusion.fields.length, axes: G.Fusion.axes.length, fxs: G.Fusion.fxs.length, on: !!G.player.actives[0].st, marks: G.enemies.filter(e => e.hemoT > 0).length, buff: G.player.fusBuffT > 0 }; });
    const tag = `${id}${lv === 2 ? ' Nv2' : ''}`;
    ok(st.s.actives[0].uses === 1 && st.s.actives[0].cd > 5000, `${tag}: Q lo dispara y entra en cooldown (${st.s.actives[0].cd} ms)`);
    ok(st.fields + st.axes + st.fxs > 0 || st.on || st.buff, `${tag}: efecto visible (campos ${st.fields}, hachas ${st.axes}, fx ${st.fxs}, canal ${st.on})`);
    if (id === 'hemo') ok(st.marks >= (lv === 2 ? 7 : 6), `${tag}: marca ${st.marks} enemigos`);
    if (id === 'pacto') ok(st.buff && (await E(pg, () => G.player.hp)) >= 20, `${tag}: buff activo y HP >= 20`);
    await sleep(pg, id === 'sed' ? 5000 : id === 'gas' ? 6000 : id === 'tormenta' ? 4000 : 3200);
    const hp1 = await E(pg, () => G.enemies.reduce((a, e) => a + e.hp, 0)), sn = await E(pg, () => G.Fusion.snapshot());
    ok(sn.actives[0].dmg > 0 || id === 'hemo' || hp1 < hp0, `${tag}: ha hecho daño (${sn.actives[0].dmg}; vida enemiga ${Math.round(hp0)} -> ${Math.round(hp1)})`);
    if (id === 'descarga') ok(await E(pg, () => G.enemies.filter(e => e.poisonN > 0).length) < 16, 'descarga: consume el veneno');
    await E(pg, () => { G.player.actives[0].cd = 20; G.player.actives[0].used = true; }); await sleep(pg, 80);
    ok((await E(pg, () => G.player.actives[0].readyT)) > 0, `${tag}: aviso de poder listo`);
    await done(pg, 'poder ' + tag);
  }
  // reglas especiales
  let pg = await mk(b, 'reset=1&direct=1&all=1&speed=2&nointro=1&actives=pacto&hand=spark:1');
  await sleep(pg, 500); await E(pg, () => { G.player.hp = 22; G.enemies.length = 0; G.Enemies.spawn('worm', G.player.x + 60, G.player.y); G.enemies[0].spawnT = 0; G.player.actives[0].cd = 0; });
  await pg.keyboard.press('KeyQ'); await sleep(pg, 200);
  ok(await E(pg, () => G.player.hp >= 20), 'pacto: nunca baja de 20 HP (hp ' + await E(pg, () => G.player.hp) + ')');
  await done(pg, 'pacto-min');
  pg = await mk(b, 'reset=1&god=1&direct=1&all=1&speed=2&nointro=1&actives=iman&hand=spark:1');
  await sleep(pg, 500); const im = await E(pg, async () => {
    const p = G.player; G.enemies.length = 0; G.Enemies.spawn('worm', p.x + 120, p.y); const w = G.enemies[0]; w.spawnT = 0; const d0 = Math.hypot(w.x - p.x, w.y - p.y);
    G.projectiles.push({ team: 'e', x: p.x + 60, y: p.y, vx: 0, vy: 0, life: 5000, r: 5, dmg: 5, ang: 0, kind: 'arrow', hit: new Set(), o: {}, t: 0, rot: 0 }); const ne0 = G.projectiles.filter(q => q.team === 'e').length;
    p.actives[0].cd = 0; G.Fusion.fire(0); await new Promise(r => setTimeout(r, 500));
    return { d0, d1: Math.hypot(w.x - p.x, w.y - p.y), ne0, ne1: G.projectiles.filter(q => q.team === 'e' && q.life > 0).length };
  });
  ok(im.d1 < im.d0 - 40, `iman: tira de los enemigos pequeños (${Math.round(im.d0)} -> ${Math.round(im.d1)})`);
  ok(im.ne1 < im.ne0, 'iman: destruye proyectiles enemigos');
  await done(pg, 'iman-tiro'); await b.close();
}

async function ui() {
  console.log('--- interfaz: 4 botones, teclas, mano a la izquierda, 844x390 y vertical');
  const b = await launch(); const pg = await mk(b, 'reset=1&god=1&direct=1&all=1&speed=2&nointro=1&actives=vapor,plasma,forja,hemo&hand=spark:1,shard:1,dart:1,dagger:1,fang:1');
  await sleep(pg, 800);
  const g = await E(pg, () => ({ btn: G.Fusion.BTN, auto: G.Fusion.AUTO, hand: [0, 1, 2, 3, 4].map(i => G.Cards.slotRect(i, false)), n: G.Fusion.activeCount() }));
  const hit = (c, r) => { const px = Math.max(r.x, Math.min(c.x, r.x + r.w)), py = Math.max(r.y, Math.min(c.y, r.y + r.h)); return Math.hypot(c.x - px, c.y - py) < c.r; };
  const sysBtns = [{ x: 246, y: 6, w: 48, h: 48 }, { x: 298, y: 6, w: 48, h: 48 }];   // mobile.js BTN.pause / muteRun
  const hud = [{ x: 8, y: 6, w: 240, h: 34 }, { x: 760, y: 6, w: 196, h: 110 }];       // barra de vida y bloque Kills / Ceniza / Partes (derecha arriba)
  ok(g.n === 4 && g.btn.length === 4, '4 slots de poderes y 4 botones');
  ok(g.hand.every(r => r.x + r.w <= 480), 'la mano de cartas está a la IZQUIERDA (termina en x=' + (g.hand[4].x + g.hand[4].w) + ')');
  ok(g.btn.every(c => c.x - c.r >= 480), 'botones en la mitad derecha (zona del pulgar derecho; el joystick solo nace en x < 480)');
  ok(g.btn.every(c => c.r >= 38) && g.btn.every((c, i) => g.btn.every((d, j) => i === j || Math.hypot(c.x - d.x, c.y - d.y) > c.r + d.r)), 'radio >= 38 (55 px CSS en 844x390) y botones sin solaparse');
  ok(g.btn.every(c => !g.hand.some(r => hit(c, r)) && !sysBtns.some(r => hit(c, r)) && !hud.some(r => hit(c, r)) && c.x + c.r <= 960 && c.y + c.r <= 540), 'sin solapar mano, pausa / silencio ni HUD');
  ok(g.btn.every(c => !hit(c, { x: g.auto.x, y: g.auto.y, w: g.auto.w, h: g.auto.h })) && g.hand.every(r => r.x + r.w < g.auto.x), 'chip AUTO libre de mano y botones');
  await E(pg, () => { G.enemies.length = 0; for (let i = 0; i < 10; i++) G.Enemies.spawn('worm', G.player.x + 60 + i * 12, G.player.y + (i % 3) * 20); G.enemies.forEach(e => { e.spawnT = 0; e.hp = e.maxHp = 9999; }); G.player.actives.forEach(s => { s.cd = 0; }); });
  for (const k of ['KeyQ', 'KeyE', 'KeyR', 'Space']) { await pg.keyboard.press(k); await sleep(pg, 120); }
  let u = await E(pg, () => G.player.actives.map(s => s.uses)); ok(u.every(x => x === 1), 'Q / E / R / Espacio disparan los 4 poderes: ' + u);
  await E(pg, () => { G.player.actives.forEach(s => { s.cd = 0; s.st = null; }); G.Fusion.fields.length = 0; });
  for (const k of ['Digit1', 'Digit2', 'Digit3', 'Digit4']) { await pg.keyboard.press(k); await sleep(pg, 120); }
  u = await E(pg, () => G.player.actives.map(s => s.uses)); ok(u.every(x => x === 2), 'teclas 1-4 equivalen: ' + u);
  if (process.env.SHOT_UI) await pg.screenshot({ path: process.env.SHOT_UI, type: 'jpeg', quality: 45 });
  await done(pg, 'ui');
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true }), pv = await ctx.newPage(); pv.errs = []; pv.ctx = ctx;
  pv.on('console', m => { if (m.type() === 'error') pv.errs.push(m.text()); }); pv.on('pageerror', e => pv.errs.push('PAGEERR ' + e.message));
  await pv.goto(`${base}/index.html?nosw=1&reset=1&direct=1&all=1`); await sleep(pv, 800);
  ok(await E(pv, () => [...document.querySelectorAll('div')].some(d => /gira/i.test(d.textContent) && getComputedStyle(d).display !== 'none')), 'vertical 390x844: aviso "gira el teléfono"');
  await done(pv, 'vertical'); await b.close();
}

async function village() {
  console.log('--- aldea: se abre, ancla, partida, fin con cuenta propia');
  const b = await launch(); const pg = await mk(b, 'reset=1&god=1&speed=4');
  ok((await E(pg, () => G.state)) === 'aldea', 'sin ?direct=1 el juego abre la aldea');
  const d = await E(pg, () => ({ anchors: G.Save.data.anchors, slots: G.B.anchorSlots }));
  ok(d.slots === 1 && d.anchors.length === 1, 'cuenta nueva: 1 ancla (' + d.anchors + ') de ' + d.slots + ' slot');
  const r = await E(pg, () => { G.Save.data.anchors = ['dart']; G.startGame(); return { st: G.state, hand: G.player.hand.map(h => h && h.id + (h.starter ? '*' : '')) }; });
  ok(r.st === 'play' && r.hand[0] === 'dart*', 'startGame con ancla: parte en partida con la carta inicial ' + r.hand[0]);
  ok((await E(pg, () => G.Cards.defs.filter(d => G.Fusion.unlockedCard(d.id) && d.type === 'attack').length)) === 5, 'pool de la cuenta vacía: solo las cartas iniciales desbloqueadas (5 de ataque)');
  await sleep(pg, 1500);
  await E(pg, () => { G.god = false; G.player.hp = 0; G.player.dead = true; });
  ok(await waitState(pg, 'gameover', 8000), 'morir lleva a la pantalla final');
  const keys = await E(pg, () => Object.keys(localStorage)); ok(keys.every(k => k.startsWith('swarmhand.fusion.')), 'guardado propio: ' + keys.join(','));
  await done(pg, 'aldea'); await b.close();
}

async function touch() {
  console.log('--- táctil: botones grandes, sin chocar con el joystick ni con mobile.js');
  const b = await launch(); const pg = await mk(b, 'reset=1&god=1&direct=1&all=1&actives=vapor,plasma,forja,hemo&hand=spark:1&speed=2&bcd=60000&aux=0');
  await autoSkip(pg); await sleep(pg, 800);
  const g = await E(pg, () => ({ btn: G.Fusion.BTN, auto: G.Fusion.AUTO, hand: [0, 1, 2, 3, 4].map(i => G.Cards.slotRect(i, false)) }));
  const hit = (c, r) => { const px = Math.max(r.x, Math.min(c.x, r.x + r.w)), py = Math.max(r.y, Math.min(c.y, r.y + r.h)); return Math.hypot(c.x - px, c.y - py) < c.r; };
  const sysBtns = [{ x: 246, y: 6, w: 48, h: 48 }, { x: 298, y: 6, w: 48, h: 48 }];   // mobile.js BTN.pause / muteRun
  ok(g.btn.every(c => c.x - c.r >= 480), 'botones en la mitad derecha (el joystick flotante solo nace en x < 480)');
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
  // dos dedos con los 4 botones: joystick izquierdo mantenido mientras se tocan los botones 3 y 4
  await spawnAround(pg, 14, 80); await sleep(pg, 450); await waitState(pg, "play", 3000);
  const r4 = await E(pg, async ([bs]) => {
    const cv = document.getElementById('game'), r = cv.getBoundingClientRect(), X = x => r.left + x * r.width / 960, Y = y => r.top + y * r.height / 540;
    const ev = (t, id, x, y) => cv.dispatchEvent(new PointerEvent(t, { pointerType: 'touch', pointerId: id, clientX: X(x), clientY: Y(y), bubbles: true, cancelable: true, isPrimary: id === 5 }));
    G.player.actives.forEach(s => { s.cd = 0; s.st = null; }); const u0 = G.player.actives.map(s => s.uses), x0 = G.player.x;
    ev('pointerdown', 5, 120, 380); ev('pointermove', 5, 200, 380);
    for (let i = 0; i < 4; i++) { ev('pointerdown', 10 + i, bs[i].x, bs[i].y); ev('pointerup', 10 + i, bs[i].x, bs[i].y); }
    await new Promise(r => setTimeout(r, 500)); const moved = G.player.x - x0, joy = G.input.joy.active; ev('pointerup', 5, 200, 380);
    return { u: G.player.actives.map((s, i) => s.uses - u0[i]), moved, joy };
  }, [g.btn]);
  ok(r4.u.every(x => x === 1) && r4.joy && r4.moved > 20, `joystick mantenido + los 4 botones (usos ${r4.u}, avance ${Math.round(r4.moved)} px)`);
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
  const b = await launch(); const pg = await mk(b, 'reset=1&god=1&dbg=1&direct=1&all=1&speed=4&boss=pastor&nointro=1&prep=0&actives=plasma,vapor,forja,pacto&hand=spark:1,shard:2');
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

async function balance() {
  console.log('--- balance v2: perillas por URL, defaults, volley, cura, jefes');
  const b = await launch(); let pg = await mk(b, 'reset=1&god=1&direct=1&all=1&hand=spark:3,shard:3,dart:3,fang:2,dagger:2&nosw=1');
  const P = await E(pg, () => { const p = G.Fusion.P; return { bd: p.basicDmg, bcd: p.basicCd, pmul: p.pmul, pcd: p.pcd, bm: p.bossMul, vs: p.vstep, im: p.infmul, lv: p.lvHeal, fh: p.fuseHeal, aux: G.Fusion.AUX.dmg, cm: G.B.cardDmgMul }; });
  ok(P.bcd === 500 && P.pmul === 3 && P.pcd === 0.6 && P.bm === 0.2 && P.vs === 4 && P.im === 0.7 && P.lv === 0.2 && P.fh === 25 && P.aux === 0.4, 'valores por defecto: ' + JSON.stringify(P));
  await sleep(pg, 800);
  const v = await E(pg, () => { const inf = G.Fusion.infusion(); let s = 0; for (const k in inf) s += inf[k].lvSum; return { s, shots: G.Fusion.P.vstep }; });
  ok(v.s >= 8, 'las infusiones suman niveles para el volley (' + v.s + ')');
  const h = await E(pg, () => { G.god = false; const p = G.player; p.hp = 50; G.Fusion.onLevel(); return p.hp; });
  ok(h > 50, 'cura al subir de nivel (' + h + ')');
  await done(pg, 'balance-defaults');
  pg = await mk(b, 'reset=1&god=1&direct=1&all=1&bcd=300&pmul=1&bossmul=1&lvheal=0&vstep=0&nosw=1');
  const Q = await E(pg, () => { const p = G.Fusion.P; return [p.basicCd, p.pmul, p.bossMul, p.lvHeal, p.vstep]; });
  ok(JSON.stringify(Q) === '[300,1,1,0,0]', 'perillas ?bcd ?pmul ?bossmul ?lvheal ?vstep se leen de la URL: ' + Q);
  await done(pg, 'balance-url'); await b.close();
}

async function armor() {
  console.log('--- armadura v8: Carapa, panel, defensa con tope, guardado v10, trofeos gastables, perillas');
  const b = await launch();
  // 1) cuenta vacia: sin Carapa; ?smith=1 la abre y la escena entrega el set Aldeano
  let pg = await mk(b, 'reset=1&nosw=1');
  ok(await E(pg, () => !G.Armor.smithOn() && !G.Save.data.flags.smithMet && G.Save.data.v === 11), 'cuenta nueva: guardado v11, Carapa aun no ha llegado');
  const zb = await E(pg, () => { G.curBiome = 'bosque'; return [G.Armor.engaged(), G.Armor.zone()]; });
  ok(zb[0] === false && zb[1] === 1, 'cuenta vacia en Bosque: sin zoneDmg ni armadura (rama antigua de hurt)');
  await done(pg, 'armor-vacia');
  // 2) migracion v9 -> v10 sin perdida
  pg = await mk(b, 'nosw=1&reset=1');
  const mig = await E(pg, () => {
    const old = { v: 9, parts: { thread: 33, plate: 5 }, cards: { spark: 1 }, brasas: 777, anchors: ['spark'], len: 9, runs: 12, wins: 3, pity: 0, pf: { earned: 9 }, nodes: { R2: { c: '1' } }, ever: {}, mile: 0, respecFree: 0, elites: {}, insignias: { carnero: 2 },
      quest: { active: null, prog: {}, done: {} }, shop: {}, pending: {}, flags: {}, bossKills: { pastor: 2, karceron: 1 }, trophies: { horn: 2, mace: 1 }, bossSeen: {}, biome: 'bosque', loadouts: [null, null, null], ach: {}, combosSeen: {}, cooked: 0, lossStreak: 0, peligro: { pastor: 2, karceron: 2 }, endingSeen: false, portalSeen: { bosque: 1 }, peligroSel: {}, pelWins: {}, hunts: {}, practice: {} };
    localStorage.setItem('swarmhand.fusion.save', JSON.stringify(old));
    G.Save.load(); const d = G.Save.data;
    return { v: d.v, brasas: d.brasas, thread: d.parts.thread, pf: d.pf.earned, te: d.trophiesEver, ie: d.insigniasEver, tr: d.trophies, owned: Object.keys(d.armor.owned).sort(), eq: d.armor.equipped, gift: d.flags.smithGift, bak: !!localStorage.getItem('swarmhand.fusion.save.v9') };
  });
  ok(mig.v === 11 && mig.brasas === 777 && mig.thread === 33 && mig.pf === 9 && mig.tr.horn === 2 && mig.te.horn === 2 && mig.ie.carnero === 2 && mig.bak, 'migracion v9->v11 sin perdida + copia .v9: ' + JSON.stringify({ b: mig.brasas, t: mig.thread, pf: mig.pf }));
  ok(mig.owned.join() === 'ald_amulet,ald_boots,ald_chest,ald_helm,car_chest,esq_chest' && mig.eq[1] === 'car_chest' && mig.gift === 1, 'regalo: Aldeano + Peto por jefe vencido (Esquila y Carcelero), mejor equipado: ' + mig.owned.length + ' piezas');
  const imp = await E(pg, () => { const txt = G.Save.exportText(); const r = G.Save.importText(txt); const r2 = G.Save.importText(JSON.stringify({ v: 12, parts: {}, cards: {} })); return [r.ok, r2.ok]; });
  ok(imp[0] === true && imp[1] === false, 'importText acepta la v11 y rechaza versiones mayores');
  await done(pg, 'armor-migra');
  // 3) panel: fabricar, equipar, reforzar con toques en 844x390
  pg = await mk(b, 'reset=1&smith=1&nosw=1&give=thread:80,feather:30,plate:80,wick:60,fang:20,brasas:4000,horn:4,fleece:2,carnero:1,tejedora:1,spine:5');
  await sleep(pg, 400);
  await E(pg, () => { G.Dialog.close(); G.Save.data.bossKills.pastor = 1; G.Save.data.peligro.pastor = 3; G.Save.data.pelWins.pastor = { 1: 1, 2: 1 }; G.Aldea.openPanel('armor'); });
  await sleep(pg, 300);
  const base0 = await E(pg, () => ({ owned: Object.keys(G.Save.data.armor.owned).length, ever: G.Save.data.trophiesEver.horn, def: G.Armor.get().def }));
  ok(base0.owned === 4 && Math.abs(base0.def - 6) < 1e-9, 'set Aldeano regalado y equipado: DEF ' + base0.def);
  await tap(pg, 14 + 134 + 64, 80);            // pestana FABRICAR
  await tap(pg, 14 + 53, 164);                 // slot Yelmo
  await tap(pg, 400, 144); await sleep(pg, 100);   // fila (Aldeano) -> seleccion
  await tap(pg, 400, 206);                     // fila Esquila (2.a)
  const sel = await E(pg, () => G.Smith.ui.sel); ok(sel === 1, 'toque en fila selecciona la pieza (sel=' + sel + ')');
  await tap(pg, 784, 449);                     // FABRICAR
  const cr = await E(pg, () => ({ own: G.Armor.owned('esq_helm'), tr: G.Save.data.trophies.horn, ever: G.Save.data.trophiesEver.horn, brasas: G.Save.data.brasas, plate: G.Save.data.parts.plate }));
  ok(cr.own && cr.tr === 3 && cr.ever === 4, 'fabricar Yelmo de cuernos gasta 1 trofeo (saldo 3) y trophiesEver sigue en 4');
  ok(cr.brasas === 4000 - 98 && cr.plate === 80 - 6, 'coste del Yelmo T1 (peso 0,7): 98 Brasas y 6 Placa (' + (4000 - cr.brasas) + ' / ' + (80 - cr.plate) + ')');
  await tap(pg, 14 + 64, 80);                  // pestana EQUIPO
  await tap(pg, 14 + 53, 164);
  await tap(pg, 400, 206); await tap(pg, 400, 206);   // seleccionar y doble toque = equipar
  ok(await E(pg, () => G.Save.data.armor.equipped[0]) === 'esq_helm', 'doble toque en la fila equipa la pieza');
  await tap(pg, 784, 507);                     // REFORZAR +1
  ok(await E(pg, () => G.Armor.ref('esq_helm')) === 1, 'refuerzo +1 (parte, Brasas y trofeo gastados)');
  await E(pg, () => { G.Save.data.nodes.R2 = { c: '1' }; });
  await tap(pg, 784, 507);
  ok(await E(pg, () => G.Armor.ref('esq_helm')) === 2, 'refuerzo +2 con Rango de forja II y Peligro II vencido');
  const r3 = await E(pg, () => G.Armor.refReq(G.ArmorData.piece('esq_helm'), 3));
  ok(/Rango de forja III/.test(r3), 'refuerzo +3 bloqueado: ' + r3);
  const ruta = await E(pg, () => { const n = G.Tree.NODES.filter(x => x.id === 'RT1')[0]; return [G.Tree.trophiesHave({ trophies: ['horn', 'staff'] }), G.Save.data.trophiesEver.horn]; });
  ok(ruta[0] === 1 && ruta[1] === 4, 'Ruta / logros leen trophiesEver (no se gasta)');
  for (let t = 2; t <= 3; t++) { await tap(pg, 14 + 134 * t + 64, 80); await sleep(pg, 120); }
  await tap(pg, 14 + 134 * 3 + 64, 80); await sleep(pg, 100);
  const ped = await E(pg, () => ({ tab: G.Smith.ui.tab, rdy: G.Armor.PED.filter(G.Armor.pedReady).map(d => d.id) }));
  ok(ped.tab === 3 && ped.rdy.includes('p1'), 'pestana PEDIDOS y pedido "Tomar medidas" listo: ' + ped.rdy);
  await tap(pg, 14 + 932 - 80, 114 + 27); const claim = await E(pg, () => G.Save.data.armor.ped.p1); ok(claim === 1, 'cobrar un pedido');
  if (process.env.SHOT_ARM) await pg.screenshot({ path: process.env.SHOT_ARM, type: 'jpeg', quality: 40 });
  await tap(pg, 926, 27); await sleep(pg, 200);
  ok(await E(pg, () => G.Aldea.state().mode) === 'walk', 'X cierra el panel');
  await done(pg, 'armor-panel');
  // 4) defensa: DEF/RD, tope 45 %, Aplomo, HP, perillas
  pg = await mk(b, 'reset=1&direct=1&armset=esquila:1&nosw=1&hand=spark:1&speed=1');
  const dfn = await E(pg, () => { const m = G.Armor.get(); return { def: m.def, rd: m.rd, hp: m.hp, maxHp: G.player.maxHp, set4: m.set4, apl: m.apl, ims: m.ims }; });
  ok(Math.abs(dfn.def - 13.8) < 1e-9 && Math.abs(dfn.rd - 13.8 / 133.8) < 1e-9, 'Esquila +1: DEF 13,8 y RD ' + (dfn.rd * 100).toFixed(2) + ' % (doc 10,3 %)');
  ok(dfn.set4.lana === true && dfn.hp === 5 && dfn.maxHp === 105, 'set de 4: Lana gruesa activa; Yelmo +' + dfn.hp + ' HP (maxHp ' + dfn.maxHp + ')');
  const dm = await E(pg, () => { G.god = false; const p = G.player; const res = []; G.Boss.noHurt = 0; G.Boss.intro = false; p.hp = 105; p.hurtT = 0; G.Armor.run.lanaAt = -1e9; G.Player.hurt(p, 10, 0, 0, { src: 'worm' }); res.push(105 - p.hp); p.hurtT = 0; p.hp = 105; G.Player.hurt(p, 10, 0, 0, { src: 'worm' }); res.push(105 - p.hp); return res; });
  ok(Math.abs(dm[0] - 5 * (1 - 13.8 / 133.8) * (1 - 0.0645)) < 0.01 && Math.abs(dm[1] - 2 * dm[0]) < 0.01, 'hurt: 1.er golpe con Lana -50 % (' + dm[0].toFixed(2) + ') y 2.o con RD + res. melee (' + dm[1].toFixed(2) + ')');
  const cap = await E(pg, () => { const A = G.Armor, m = A.calc(G.Armor.eq(), () => 3); m.rd = 0.9; m.res = { melee: 0.15 }; return A.mult(m, 'melee', true, 0.3); });
  ok(Math.abs(cap - 0.55) < 1e-9, 'tope global: armadura + Bastion + plato nunca bajan de x0,55 (' + cap + ')');
  await done(pg, 'armor-defensa');
  pg = await mk(b, 'reset=1&direct=1&arm=0&armset=esquila:3&nosw=1&hand=spark:1');
  const off = await E(pg, () => { G.god = false; const p = G.player; G.Boss.noHurt = 0; G.Boss.intro = false; G.curBiome = 'cripta'; p.hp = p.maxHp; p.hurtT = 0; G.Player.hurt(p, 10, 0, 0, { src: 'worm' }); return [p.maxHp, p.maxHp - p.hp, G.Armor.engaged(), G.Loot.BRASAS_MIN, G.Armor.zone()]; });
  ok(off[0] === 100 && off[1] === 10 && off[2] === false && off[3] === 18 && off[4] === 1, '?arm=0: HP 100, golpe de 10 = 10, sin zoneDmg, BRASAS_MIN 18 (' + off + ')');
  await done(pg, 'armor-off');
  pg = await mk(b, 'reset=1&direct=1&nosw=1&hand=spark:1&biome=cripta');
  const zn = await E(pg, () => { G.god = false; const p = G.player; G.Boss.noHurt = 0; G.Boss.intro = false; p.hp = p.maxHp; p.hurtT = 0; G.Player.hurt(p, 10, 0, 0, { src: 'worm' }); return [G.curBiome, +(p.maxHp - p.hp).toFixed(3), G.Armor.zone(), G.Loot.BRASAS_MIN]; });
  ok(zn[0] === 'cripta' && Math.abs(zn[1] - 11) < 0.01 && zn[3] === 21, 'zoneDmg Cripta x1,10 sin armadura: golpe de 10 = ' + zn[1] + '; BRASAS_MIN 21');
  const pm0 = await E(pg, () => G.Save.data.stats.playMs); await sleep(pg, 600); const pm1 = await E(pg, () => G.Save.data.stats.playMs);
  ok(pm1 - pm0 > 300, 'contador stats.playMs avanza (' + Math.round(pm1 - pm0) + ' ms en 600)');
  await done(pg, 'armor-zona');
  // 5) aldea: con el Pastor vencido aparece Carapa, toldo y marca; cuenta con Pastor: escena
  pg = await mk(b, 'reset=1&nosw=1');
  await E(pg, () => { G.Save.data.bossKills.pastor = 1; G.Save.save(); G.Aldea.open(true); });
  await sleep(pg, 600);
  const vs = await E(pg, () => ({ d: G.Dialog.active(), met: G.Save.data.flags.smithMet, own: Object.keys(G.Save.data.armor.owned).length }));
  ok(vs.d && vs.met === 1 && vs.own === 5, 'al volver de vencer al Pastor: escena de Carapa, regalo Aldeano + Peto Esquila (' + vs.own + ' piezas)');
  await E(pg, () => { G.Dialog.close(); G.Aldea.goto('carapa'); }); await sleep(pg, 200);
  ok(await E(pg, () => G.Aldea.state().target) === 'carapa', 'Marlo puede acercarse a Carapa y E/HABLAR la apunta');
  await E(pg, () => G.Aldea.talk('carapa')); await sleep(pg, 200);
  ok(await E(pg, () => G.Dialog.active()), 'hablar con Carapa abre su dialogo');
  await done(pg, 'armor-aldea'); await b.close();
}


async function armor2() {
  console.log('--- armadura v8.1: sets Letea/Yarlak/Melaria/Cenizar, minijefes, zoneDmg por defecto, bonos de 4, prueba, pausa, pedidos en Vesper');
  const b = await launch();
  let pg = await mk(b, 'reset=1&nosw=1');
  // migracion v10 -> v11
  const m11 = await E(pg, () => {
    const d = G.Save.data; const old = JSON.parse(JSON.stringify(d)); old.v = 10; old.bossKills = { pastor: 1, karceron: 1, letea: 1, yarlak: 1, melaria: 1, cenizar: 1 }; delete old.flags.migrated11;
    old.armor.owned = { ald_helm: 0, ald_chest: 0, ald_boots: 0, ald_amulet: 0, esq_chest: 0, car_chest: 0 }; old.armor.equipped = ['ald_helm', 'car_chest', 'ald_boots', 'ald_amulet']; old.trophies = { horn: 1 }; old.trophiesEver = { horn: 1 }; old.brasas = 555;
    localStorage.setItem('swarmhand.fusion.save', JSON.stringify(old)); G.Save.load(); const x = G.Save.data;
    return { v: x.v, owned: Object.keys(x.armor.owned).sort().join(), eq: x.armor.equipped, brasas: x.brasas, bak: !!localStorage.getItem('swarmhand.fusion.save.v10'), tr: x.trophies.horn };
  });
  ok(m11.v === 11 && m11.bak && m11.brasas === 555 && m11.tr === 1, 'migracion v10->v11 sin perdida + copia .v10');
  ok(['bra_chest', 'esc_chest', 'gla_chest', 'jal_chest', 'car_chest', 'esq_chest'].every(id => m11.owned.includes(id)) && m11.eq[1] === 'bra_chest', 'regalo: Peto de Escama, Pelaje, Jalea y Brasa por jefe vencido; equipa el de mayor tier (' + m11.eq[1] + ')');
  // datos y costes
  const dt = await E(pg, () => {
    const D = G.ArmorData, A = G.Armor, c = id => A.cost(D.piece(id), 0), r = (id, n) => A.cost(D.piece(id), n);
    return { sets: Object.keys(D.SETS).length, pieces: D.PIECES.length, per: D.PIECES.filter(p => p.set !== 'mini').length,
      braH: c('bra_helm').items.map(i => i.ids[0]), braT: c('bra_talis'), mn: c('mn_tundra'), glaC: c('gla_chest'), jalHr3: r('jal_helm', 3), escT: c('esc_talis').items.map(i => i.ids[0]) };
  });
  ok(dt.sets === 8 && dt.pieces === 33 && dt.per === 28, 'datos: 7 sets x 4 piezas + 5 talismanes de minijefe (' + dt.pieces + ' piezas)');
  ok(dt.braH.join() === 'cz_cor,cz_ojo' && dt.braT.items.length === 5 && dt.braT.parts.rare === 2, 'Brasa Primera: Yelmo pide 2 trofeos de Cenizar; Rescoldo pide 1 insignia por bioma y 2 Esencias');
  ok(dt.mn.items.map(i => i.ids[0]).join() === 'yeti_mayor,ventisquero' && dt.mn.parts.rare === 1 && dt.escT.join() === 'hidra,planidera', 'talisman de minijefe: 2 insignias del bioma + 1 Esencia; Colgante del olvido: Letea');
  ok(dt.glaC.parts.frost === Math.ceil(30 * 0.5) && dt.glaC.parts.plate === 12 && dt.glaC.brasas === 440 && dt.glaC.parts.rare === 1, 'coste Placa glacial (T4): Escarcha x0,5, Placa, 440 Brasas y 1 Esencia (' + JSON.stringify(dt.glaC.parts) + ')');
  ok(dt.jalHr3.items[0].n === 2 && dt.jalHr3.parts.rare === 1, 'refuerzo +3 de Jalea: 2 trofeos del jefe y 1 Esencia');
  // estadisticas de los sets nuevos
  const st = await E(pg, () => {
    const A = G.Armor, D = G.ArmorData, f = (sid, n) => { const eq = [null, null, null, null], rf = {}; D.ofSet(sid).forEach(p => { eq[p.slot] = p.id; rf[p.id] = n; }); return A.calc(eq, id => rf[id] != null ? rf[id] : -1); };
    const bra = f('brasa', 0), gla = f('glacial', 0), jal = f('jalea', 0), esc = f('escama', 0), mn = A.calc(['mn_cripta', null, null, null], () => 0);
    return { bra: [bra.def, bra.set4.ultima, bra.res.big, bra.dmg.lightning], gla: [gla.def, gla.set4.hoguera, gla.cold, gla.dmg.ice], jal: [jal.set4.reina, jal.honey, jal.dmg.blood], esc: [esc.set4.pantano, esc.res.ranged], mn: [mn.def, mn.util.heart, mn.sets] };
  });
  ok(Math.abs(st.bra[0] - 42) < 1e-9 && st.bra[1] && Math.abs(st.bra[2] - (0.10 + 0.03)) < 1e-9 && Math.abs(st.bra[3] - 0.10) < 1e-9, 'Brasa Primera T6: DEF 42, Ultima brasa, res. big 13 %, Rayo +10 % (tope) ' + JSON.stringify(st.bra));
  ok(Math.abs(st.gla[0] - 30) < 1e-9 && st.gla[1] && st.gla[2] === 0.15 && Math.abs(st.gla[3] - 0.09) < 1e-9, 'Pelaje Glacial T4: DEF 30, bono 4 Hoguera, Frio -15 %');
  ok(st.jal[0] === true && st.jal[1] === 0.25 && st.esc[0] === true && Math.abs(st.esc[1] - 0.13) < 1e-9, 'Jalea (miel -25 %, Reina) y Escama (Pantano; res. ranged 5 % + 8 %)');
  ok(Math.abs(st.mn[0] - 6 * 0.4) < 1e-9 && st.mn[1] === 1 && Object.keys(st.mn[2]).length === 0, 'talisman de minijefe: DEF x0,4 (2,4), +1 HP por corazon, no cuenta como set');
  await done(pg, 'armor2-datos');
  // zoneDmg por defecto en todos los biomas, perillas
  pg = await mk(b, 'reset=1&nosw=1');
  const z = await E(pg, () => ['bosque', 'cripta', 'asfodelo', 'tundra', 'panal', 'crater'].map(bi => { G.curBiome = bi; return G.Armor.zone(); }));
  ok(z.join() === '1,1.1,1.18,1.26,1.34,1.44', 'zoneDmg por defecto en los 6 biomas: ' + z);
  await done(pg, 'armor2-zona');
  pg = await mk(b, 'reset=1&nosw=1&zdmgall=0');
  const z0 = await E(pg, () => ['bosque', 'cripta', 'tundra'].map(bi => { G.curBiome = bi; return G.Armor.zone(); }));
  ok(z0.join() === '1,1.1,1', '?zdmgall=0 deja zoneDmg solo en Bosque y Cripta (como el MVP): ' + z0);
  await done(pg, 'armor2-zona0');
  pg = await mk(b, 'reset=1&nosw=1&zdmg=1,1,2,1,1,1');
  ok((await E(pg, () => { G.curBiome = 'asfodelo'; return G.Armor.zone(); })) === 2, '?zdmg= pone valores por bioma');
  await done(pg, 'armor2-zdmg');
  pg = await mk(b, 'reset=1&nosw=1&arm=0');
  ok((await E(pg, () => { G.curBiome = 'crater'; return [G.Armor.zone(), G.Armor.coldMul(), G.Armor.honeyMul(), G.Armor.magnetMul(), G.Armor.lvHealAdd(), G.Armor.xpMul()]; })).join() === '1,1,1,1,0,1', '?arm=0: todos los ganchos neutros');
  await done(pg, 'armor2-off');
  // bonos de 4 piezas en partida
  pg = await mk(b, 'reset=1&direct=1&nosw=1&hand=spark:1&armset=brasa:0&biome=crater');
  const ub = await E(pg, () => { G.god = false; const p = G.player; G.Boss.noHurt = 0; G.Boss.intro = false; p.hurtT = 0; p.hp = 5; G.Player.hurt(p, 200, 0, 0, { src: 'worm' }); const a = [p.hp, p.dead, p.revived, p.hurtT]; return a; });
  ok(ub[0] === 1 && ub[1] === false && ub[2] === true && ub[3] >= 1400, 'Ultima brasa: un golpe mortal deja a 1 HP, invulnerable 1,5 s (' + ub + ')');
  const ub2 = await E(pg, () => { const p = G.player; p.hurtT = 0; p.hp = 1; G.Player.hurt(p, 200, 0, 0, { src: 'worm' }); return p.dead; });
  ok(ub2 === true, 'la Ultima brasa solo se activa 1 vez por expedicion');
  await done(pg, 'armor2-ultima');
  pg = await mk(b, 'reset=1&direct=1&nosw=1&hand=spark:1&armset=jalea:0&biome=panal');
  const rn = await E(pg, () => { const p = G.player, A = G.Armor; p.shield = 0; for (let i = 0; i < 20; i++) A.onKillCount(); return [p.shield, A.lvHealAdd(), A.honeyMul()]; });
  ok(rn[0] === 6 && rn[1] === 0.05 && Math.abs(rn[2] - 0.75) < 1e-9, 'Reina de la colmena: escudo de 6 HP cada 20 bajas, cura de nivel +5 puntos; miel -25 %');
  await done(pg, 'armor2-reina');
  pg = await mk(b, 'reset=1&direct=1&nosw=1&hand=spark:1&armset=escama:0&biome=asfodelo');
  const pn = await E(pg, () => { const p = G.player, A = G.Armor; p.hp = 50; A.onPoisonKill(); const h1 = p.hp; A.onPoisonKill(); return [h1, p.hp, A.bogMul()]; });
  ok(pn[0] === 52 && pn[1] === 52 && pn[2] === 0.5, 'Piel de pantano: la 1.a baja con Veneno cura 2 HP (1 cada 20 s), charcos a la mitad');
  await done(pg, 'armor2-pantano');
  pg = await mk(b, 'reset=1&direct=1&nosw=1&hand=spark:1&armset=glacial:0&biome=tundra');
  const gl = await E(pg, () => { const A = G.Armor; return [A.coldMul(), A.set4('hoguera'), G.Player.hurt.length >= 0]; });
  ok(Math.abs(gl[0] - 0.85) < 1e-9 && gl[1] === true, 'Pelaje Glacial: el Frio sube un 15 % mas despacio; Corazon de hoguera activo');
  await done(pg, 'armor2-glacial');
  // bloqueo
  pg = await mk(b, 'reset=1&direct=1&nosw=1&hand=spark:1&armset=esquila:3');
  const bl = await E(pg, () => { G.god = false; const p = G.player; G.Boss.noHurt = 0; G.Boss.intro = false; p.hurtT = 0; G.Armor.run.lanaAt = -1e9; G.Player.hurt(p, 20, 0, 0, { src: 'worm' }); return [G.Armor.blockT > 0, typeof Assets.fxArmorBlock]; });
  ok(bl[0] === true && bl[1] === 'function', 'efecto de bloqueo al recibir un golpe amortiguado (reduccion >= 20 %)');
  await sleep(pg, 300); await done(pg, 'armor2-bloqueo');
  // panel: lista con scroll, probar equipo, pausa en solo lectura, pedidos y Vesper, logros
  pg = await mk(b, 'reset=1&smith=1&nosw=1&give=thread:80,feather:30,plate:80,wick:60,fang:20,brasas:4000,horn:4');
  await sleep(pg, 400);
  await E(pg, () => { G.Dialog.close(); const S = G.Save.data; S.bossKills = { pastor: 1, karceron: 1, letea: 1, yarlak: 1, melaria: 1, cenizar: 1 }; G.Aldea.openPanel('armor'); G.Smith.ui.slot = 3; G.Smith.ui.tab = 1; });
  await sleep(pg, 300);
  const nl = await E(pg, () => G.ArmorData.ofSlot(3).length); ok(nl === 12, 'slot Talisman: 12 piezas (7 sets + 5 minijefes) -> lista con scroll');
  await tap(pg, 592, 202); const sc = await E(pg, () => G.Smith.ui.scroll); ok(sc === 1, 'boton de scroll de la lista (' + sc + ')');
  await E(pg, () => { G.Smith.ui.tab = 2; G.Smith.ui.scroll = 0; }); await sleep(pg, 150);
  await tap(pg, 600 + 84 * 2 + 39, 81); await tap(pg, 14 + 556 - 120 + 56, 114 + 8 + 27);   // +2 y PROBAR del 1.er set (Aldeano)
  const tr = await E(pg, () => ({ t: G.Armor.trial && G.Armor.trial.sid + ':' + G.Armor.trial.n, def: G.Armor.get().def }));
  ok(tr.t === 'aldeano:2' && Math.abs(tr.def - 6 * 1.3) < 1e-9, 'probar equipo: set Aldeano +2 en memoria sin gastar (' + tr.t + ', DEF ' + tr.def + ')');
  const tr2 = await E(pg, () => { G.Armor.trialView = false; G.Armor.dirty(); const d0 = G.Armor.get().def; G.mode = 'practice'; G.Armor.dirty(); const d1 = G.Armor.get().def; G.mode = 'run'; G.Armor.modeSet(); return [d0, d1, G.Armor.trial]; });
  ok(tr2[1] > 0 && tr2[2] === null, 'el equipo de prueba solo cuenta en Practica y se retira al empezar una salida normal (' + tr2 + ')');
  await E(pg, () => { G.Smith.close(); G.Aldea.setPanel(null); G.Panels.closeAll(); });
  const ped = await E(pg, () => { const Q = G.Quests, S = G.Save.data; const d = Q.def('ped_p1'); S.armor.stats.crafts = 1; Q.accept('ped_p1'); const b0 = S.brasas, ready = Q.isReady(); const r = Q.claim(); const b1 = S.brasas; const again = G.Armor.pedClaim('p1'); return [!!d, ready, b1 - b0, S.armor.ped.p1, again, Q.feasible(d)]; });
  ok(ped[0] && ped[1] && ped[2] === 60 && ped[3] === 1 && ped[4] === false && ped[5] === false, 'pedido de Carapa en el Tablon de Vesper: se cobra una sola vez (60 Brasas) y deja de ofrecerse: ' + ped);
  const ped2 = await E(pg, () => { const Q = G.Quests, S = G.Save.data; Q.accept('ped_p4'); S.armor.owned.ald_helm = 1; const ok1 = Q.isReady(); const b0 = S.brasas; G.Armor.pedClaim('p4'); const b1 = S.brasas; const r = Q.claim(); return [ok1, b1 - b0, S.brasas - b1, Q.active() === null]; });
  ok(ped2[0] && ped2[1] === 100 && ped2[2] === 0 && ped2[3], 'cobrado en Carapa, Vesper no paga de nuevo (' + ped2 + ')');
  const ach = await E(pg, () => G.Ach.DEFS.filter(a => /^arm/.test(a.id)).map(a => a.id).sort().join());
  ok(ach === 'arm1,arm4,armbare,armcol,armmos,armseal,armup', '7 logros de armadura: ' + ach);
  await done(pg, 'armor2-panel');
  // pausa: EQUIPO en solo lectura
  pg = await mk(b, 'reset=1&smith=1&direct=1&nosw=1&hand=spark:1&god=1');
  await sleep(pg, 500);
  await E(pg, () => { G.Save.data.flags.smithMet = 1; G.state = 'paused'; G.Hud.pauseOpen(); });
  await sleep(pg, 200);
  await tap(pg, 480, 279); await sleep(pg, 200);
  ok(await E(pg, () => G.Hud.eqOpen && G.Smith.ui.ro), 'boton EQUIPO en la pausa abre el panel en solo lectura');
  const ro = await E(pg, () => { G.Smith.ui.tab = 1; G.Smith.ui.slot = 0; const before = G.Armor.get().def; const p = G.ArmorData.piece('ald_helm'); return before; });
  await tap(pg, 926, 27); await sleep(pg, 150);
  ok(await E(pg, () => !G.Hud.eqOpen && G.state === 'paused'), 'X vuelve a la pausa');
  await done(pg, 'armor2-pausa');
  // Marlo vestido y aldea
  pg = await mk(b, 'reset=1&smith=1&nosw=1');
  await sleep(pg, 800);
  const mv = await E(pg, () => { G.Dialog.close(); return [typeof Assets.drawMarloArmor, typeof Assets.armorIcon('mini', 'carnero', 0), Assets.armorIcon('letea', 'yelmo', 0) && Assets.armorIcon('letea', 'yelmo', 0).width]; });
  ok(mv[0] === 'function' && mv[1] === 'object' && mv[2] === 64, 'arte nuevo cargado (Marlo vestido, iconos de minijefe y sets T3-T6)');
  await sleep(pg, 400); await done(pg, 'armor2-aldea'); await b.close();
}

(async () => {
  const run = { armor, armor2, iso, flow, powers, ui, village, touch, boss, balance };
  if (mode === 'all') for (const k of Object.keys(run)) await run[k](); else await run[mode]();
  console.log(`\n${total - fails}/${total} OK`); process.exit(fails ? 1 : 0);
})().catch(e => { console.error(e); process.exit(2); });
