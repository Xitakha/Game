// PRUEBAS de Swarm Hand (games/card-swarm). Uso:
//   python3 tools/serve.py card-swarm 8811 &      (cierra el servidor por PID, nunca pkill -f)
//   node tools/card-swarm-bot/tests.js [all|cine|iso|flow|powers|ui|village|touch|boss|balance|armor|text|manual] [base=http://localhost:8811]
// Chromium de /opt/pw-browsers (sin playwright install). Vista 844x390 táctil. Cada partida debe terminar con 0 errores de consola.
const { chromium } = require('/opt/node-tools/node_modules/playwright');
const { execSync } = require('child_process');
const TC = require('./textcheck.js');
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
  // las 15 parejas tienen receta (fusiones 13-15)
  ok((await E(pg, () => G.Fusion.recipeFor('ice', 'blood').id === 'cristal' && G.Fusion.recipeFor('lightning', 'blood').id === 'zancada' && G.Fusion.recipeFor('poison', 'steel').id === 'virote')), 'hielo+sangre, rayo+sangre y veneno+acero fusionan (cristal, zancada, virote)');
  await done(pg, 'flow'); await b.close();
}

async function powers() {
  console.log('--- poderes: los 15 disparan, dañan / aplican su efecto y entran en enfriamiento (Nv1 y Nv2)');
  const b = await launch();
  const IDS = ['vapor', 'plasma', 'gas', 'sed', 'tormenta', 'escarcha', 'pacto', 'iman', 'forja', 'filo', 'hemo', 'descarga', 'cristal', 'zancada', 'virote'];
  for (const lv of [1, 2]) for (const id of IDS) {
    if (lv === 2 && !['tormenta', 'escarcha', 'pacto', 'iman', 'forja', 'filo', 'hemo', 'descarga', 'cristal', 'zancada', 'virote'].includes(id)) continue;
    const pg = await mk(b, `reset=1&god=1&direct=1&all=1&speed=3&nointro=1&actives=${id}${lv === 2 ? '2' : ''}&hand=spark:1,shard:1&bcd=60000&aux=0`);
    await autoSkip(pg); await sleep(pg, 600); await E(pg, () => { G.player.hp = 60; });
    await E(pg, () => { for (let i = 0; i < 16; i++) { const a = i * 0.4; G.Enemies.spawn('worm', G.player.x + Math.cos(a) * (70 + i * 7), G.player.y + Math.sin(a) * (70 + i * 7)); } });
    await sleep(pg, 900);
    await E(pg, id => { G.enemies.forEach(e => { e.hp = e.maxHp = 600; if (id === 'descarga') G.Combat.poison(e, 3); if (id === 'filo' || id === 'tormenta') G.Combat.slow(e, 0.3, 6000); }); G.player.actives[0].cd = 0; }, id);
    const hp0 = await E(pg, () => G.enemies.reduce((a, e) => a + e.hp, 0));
    await pg.keyboard.press('KeyQ'); await sleep(pg, ['filo', 'descarga', 'virote'].includes(id) ? 20 : 100);
    let st = await E(pg, () => { const s = G.Fusion.snapshot(); return { s, fields: G.Fusion.fields.length, axes: G.Fusion.axes.length, fxs: G.Fusion.fxs.length, on: !!G.player.actives[0].st, marks: G.enemies.filter(e => e.hemoT > 0).length, buff: G.player.fusBuffT > 0 }; });
    const tag = `${id}${lv === 2 ? ' Nv2' : ''}`;
    ok(st.s.actives[0].uses === 1 && (st.s.actives[0].cd > 5000 || (id === 'zancada' && lv === 2 && st.s.actives[0].cd > 0)), `${tag}: Q lo dispara y entra en cooldown (${st.s.actives[0].cd} ms)`);
    ok(st.fields + st.axes + st.fxs > 0 || st.on || st.buff, `${tag}: efecto visible (campos ${st.fields}, hachas ${st.axes}, fx ${st.fxs}, canal ${st.on})`);
    if (id === 'hemo') ok(st.marks >= (lv === 2 ? 7 : 6), `${tag}: marca ${st.marks} enemigos`);
    if (id === 'pacto') ok(st.buff && (await E(pg, () => G.player.hp)) >= 20, `${tag}: buff activo y HP >= 20`);
    await sleep(pg, id === 'sed' ? 5000 : id === 'gas' ? 6000 : id === 'tormenta' ? 4000 : id === 'cristal' ? 6800 : 3200);
    const hp1 = await E(pg, () => G.enemies.reduce((a, e) => a + e.hp, 0)), sn = await E(pg, () => G.Fusion.snapshot());
    ok(sn.actives[0].dmg > 0 || id === 'hemo' || hp1 < hp0, `${tag}: ha hecho daño (${sn.actives[0].dmg}; vida enemiga ${Math.round(hp0)} -> ${Math.round(hp1)})`);
    if (id === 'descarga') ok(await E(pg, () => G.enemies.filter(e => e.poisonN > 0).length) < 16, 'descarga: consume el veneno');
    await E(pg, () => { const a = G.player.actives[0]; a.dash2 = 0; a.cd = 20; a.used = true; }); await sleep(pg, 80);
    ok((await E(pg, () => G.player.actives[0].readyT)) > 0, `${tag}: aviso de poder listo`);
    await done(pg, 'poder ' + tag);
  }
  // fusiones 13-15 (DESIGN-fusion.md sec. 14)
  {
    let pg = await mk(b, 'reset=1&god=1&direct=1&all=1&nointro=1&hand=spark:1&bcd=60000&aux=0');
    const r15 = await E(pg, () => { const F = G.Fusion, tg = ['fire', 'ice', 'lightning', 'poison', 'blood', 'steel']; let n = 0, miss = []; for (let i = 0; i < 6; i++) for (let j = i + 1; j < 6; j++) { if (F.recipeFor(tg[i], tg[j])) n++; else miss.push(tg[i] + '+' + tg[j]); } return { n, miss, rec: F.recipes.length, comb: G.Cards.combos.length }; });
    ok(r15.n === 15 && r15.rec === 15 && r15.comb === 15, 'las 15 parejas de etiquetas tienen receta (' + JSON.stringify(r15) + ')');
    const n3 = await E(pg, () => ['cristal', 'zancada', 'virote'].map(id => { const r = G.Fusion.recipe(id); return [r.kind, r.lv[0].cd, r.lv.length].join('/'); }).join(' '));
    ok(n3 === 'ward/17000/2 dash/15000/2 bolt/12000/2', '3 recetas nuevas (kind/cd/niveles): ' + n3);
    const q15 = await E(pg, () => G.Quests && (G.Quests.ACH || G.Quests.ACHS || []).length >= 0);
    await done(pg, 'recetas-15');
    // Cristal: escudo propio (no lo recorta el set Sangre), se resta tras el escudo del set; onda al romperse
    pg = await mk(b, 'reset=1&direct=1&all=1&speed=2&nointro=1&actives=cristal2&hand=spark:1&bcd=60000&aux=0');
    await sleep(pg, 500);
    const cw = await E(pg, async () => {
      const p = G.player; G.enemies.length = 0; for (let i = 0; i < 3; i++) { G.Enemies.spawn('worm', p.x + 60 + i * 20, p.y); } G.enemies.forEach(e => { e.spawnT = 0; e.hp = e.maxHp = 9999; });
      p.hp = 100; p.hurtT = 0; p.actives[0].cd = 0; G.Fusion.fire(0);
      const w0 = p.ward, locked = G.Fusion.fire(0);   // recastear con el escudo activo: bloqueado
      p.shield = 10; G.Combat; p.hurtT = 0; G.Player.hurt(p, 25, p.x + 50, p.y, { src: 'worm' });   // 10 al escudo del set, 15 al cristal
      const w1 = p.ward, hp1 = p.hp; p.hurtT = 0; G.Player.hurt(p, 100, p.x + 50, p.y, { src: 'worm' });   // rompe el cristal (30 restantes) y pasa el resto
      const hp2 = p.hp, w2 = p.ward; await new Promise(r => setTimeout(r, 200));
      const slow = G.enemies.some(e => e.slowT > 0 || e.stunT > 0 || e.hp < 9999);
      return { w0, locked, sh: p.shield, w1, hp1, hp2, w2, slow, abs: G.Fusion.stats.absorbed, on: !!p.actives[0].st };
    });
    ok(cw.w0 === 45 && cw.locked === false, 'cristal Nv2: escudo 45 y no se recastea activo (' + cw.w0 + ')');
    ok(cw.sh === 0 && cw.w1 === 30 && cw.hp1 === 100, 'cristal: tras el escudo del set (10) absorbe el resto (' + JSON.stringify([cw.sh, cw.w1, cw.hp1]) + ')');
    ok(cw.w2 === 0 && cw.hp2 < 100 && cw.hp2 > 20 && cw.abs === 45, 'cristal: se rompe, el sobrante pasa a la vida y cuenta lo absorbido (' + JSON.stringify([cw.w2, cw.hp2, cw.abs]) + ')');
    ok(cw.slow && !cw.on, 'cristal: al romperse estalla en onda (daño / slow / aturdimiento) y termina el estado');
    const cap = await E(pg, () => { const p = G.player; p.ward = 0; p.actives[0].st = null; p.actives[0].cd = 0; G.Fusion.fire(0); p.ward = 999; p.shield = 0; return G.Fusion.recipe('cristal').lv[1].shield; });
    ok(cap === 45, 'cristal: tope de escudo temporal 45 en la receta');
    await done(pg, 'cristal');
    // Zancada: desplaza, invulnerable, cura tope, 2 cargas en Nv2
    pg = await mk(b, 'reset=1&direct=1&all=1&speed=2&nointro=1&actives=zancada2&hand=spark:1&bcd=60000&aux=0');
    await sleep(pg, 500);
    const zd = await E(pg, async () => {
      const p = G.player; G.enemies.length = 0; p.x = 600; p.y = 400; p.hp = 50; p.hurtT = 0;
      for (let i = 0; i < 4; i++) { G.Enemies.spawn('worm', p.x + 70 + i * 40, p.y); } G.enemies.forEach(e => { e.spawnT = 0; e.hp = e.maxHp = 9999; });
      const x0 = p.x; p.actives[0].cd = 0; const f1 = G.Fusion.fire(0); const x1 = p.x, inv = p.hurtT;
      const c1 = p.actives[0].cd; await new Promise(r => setTimeout(r, 700)); const f2 = G.Fusion.fire(0), x2 = p.x, c2 = p.actives[0].cd;
      const f3 = G.Fusion.fire(0); const hit = G.enemies.filter(e => e.hp < 9999).length; const hp = p.hp;
      p.x = 40; p.y = 400; G.enemies.length = 0; p.actives[0].cd = 0; p.actives[0].dash2 = 0; p.hurtT = 0; G.Enemies.spawn('worm', 20, 400); G.enemies[0].spawnT = 0; const f4 = G.Fusion.fire(0); const x4 = p.x;
      return { f1, f2, f3, f4, dx1: x1 - x0, dx2: x2 - x1, inv, c1, c2, hit, hp, x4 };
    });
    ok(zd.f1 && zd.dx1 > 200 && zd.inv >= 200, 'zancada: embiste hacia el enemigo (' + Math.round(zd.dx1) + ' px) e invulnerable (' + zd.inv + ' ms)');
    ok(zd.c1 < 600 && zd.f2 && Math.abs(zd.dx2) > 100 && zd.c2 > 5000 && zd.f3 === false, 'zancada Nv2: 2 cargas (2.ª sin esperar), luego cooldown completo (' + zd.c1 + ' / ' + Math.round(zd.c2) + ')');
    ok(zd.hit >= 1 && zd.hp > 50 && zd.hp <= 60, 'zancada: golpea y cura con tope (hp ' + Math.round(zd.hp) + ', golpeados ' + zd.hit + ')');
    ok(zd.x4 >= 28, 'zancada: respeta los límites del mapa (x=' + Math.round(zd.x4) + ')');
    await done(pg, 'zancada');
    // Virote: corrosión (x1,2 normal; jefe topado x1,25), propaga veneno, afecta a otras fuentes
    pg = await mk(b, 'reset=1&god=1&direct=1&all=1&speed=2&nointro=1&actives=virote&hand=spark:1&bcd=60000&aux=0');
    await sleep(pg, 500);
    const vr = await E(pg, async () => {
      const p = G.player; G.enemies.length = 0; for (let i = 0; i < 4; i++) G.Enemies.spawn('worm', p.x + 120 + i * 30, p.y + (i % 2) * 8); G.enemies.forEach(e => { e.spawnT = 0; e.hp = e.maxHp = 9999; });
      G.Enemies.spawn('worm', p.x + 130, p.y + 90); const sp = G.enemies[G.enemies.length - 1]; sp.spawnT = 0; sp.hp = sp.maxHp = 9999;
      const t = G.enemies[0]; const before = G.Combat.deal(t, 10, { tag: 'neutral' }); t.hp = 9999;
      p.actives[0].cd = 0; const ok1 = G.Fusion.fire(0);
      const cor = G.enemies.filter(e => e.corrodeT > 0), c0 = cor[0];
      let after = 0; if (c0) { c0.hp = 9999; after = G.Combat.deal(c0, 10, { tag: 'neutral' }); c0.hp = 9999; }
      const F = G.Fusion; const fake = (w) => ({ type: 'boss', phase: 1, corrodeMul: 0.1, def: { weak: w, resist: [] } });
      return { ok1, n: cor.length, ratio: after / before, mul: c0 && c0.corrodeMul, pois: G.enemies.filter(e => e.poisonN > 0).length, fb0: F.corrode(fake([]), 'poison'), fb1: F.corrode(fake([{ tag: 'poison', mul: 1.25, phases: [1] }]), 'poison'), fb2: F.corrode(fake([{ tag: 'poison', mul: 1.15, phases: [1] }]), 'poison'), dot: G.Fusion.P.corr };
    });
    ok(vr.ok1 && vr.n >= 1 && vr.n <= 3 && Math.abs(vr.mul - 0.2) < 1e-6, 'virote: oxida hasta 3 objetivos con +20 % (' + vr.n + ', mul ' + vr.mul + ')');
    ok(Math.abs(vr.ratio - 1.2) < 0.05, 'virote: el daño de otras fuentes sube x1,2 al corroído (' + vr.ratio.toFixed(2) + ')');
    ok(vr.pois >= 3, 'virote: veneno a los atravesados y propagado a vecinos (' + vr.pois + ')');
    ok(Math.abs(vr.fb0 - 1.1) < 1e-6 && Math.abs(vr.fb1 - 1) < 1e-6 && Math.abs(vr.fb2 - 1.25 / 1.15) < 1e-6, 'virote: jefe +10 % y total con la debilidad topado en x1,25 (' + [vr.fb0, vr.fb1, vr.fb2].map(v => v.toFixed(3)) + ')');
    await done(pg, 'virote');
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
  ok(await E(pg, () => !G.Armor.smithOn() && !G.Save.data.flags.smithMet && G.Save.data.v === 12), 'cuenta nueva: guardado v12, Carapa aun no ha llegado');
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
  ok(mig.v === 12 && mig.brasas === 777 && mig.thread === 33 && mig.pf === 9 && mig.tr.horn === 2 && mig.te.horn === 2 && mig.ie.carnero === 2 && mig.bak, 'migracion v9->v11 sin perdida + copia .v9: ' + JSON.stringify({ b: mig.brasas, t: mig.thread, pf: mig.pf }));
  ok(mig.owned.join() === 'ald_amulet,ald_boots,ald_chest,ald_helm,car_chest,esq_chest' && mig.eq[1] === 'car_chest' && mig.gift === 1, 'regalo: Aldeano + Peto por jefe vencido (Esquila y Carcelero), mejor equipado: ' + mig.owned.length + ' piezas');
  const imp = await E(pg, () => { const txt = G.Save.exportText(); const r = G.Save.importText(txt); const r2 = G.Save.importText(JSON.stringify({ v: 13, parts: {}, cards: {} })); return [r.ok, r2.ok]; });
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
  ok(m11.v === 12 && m11.bak && m11.brasas === 555 && m11.tr === 1, 'migracion v10->v11 sin perdida + copia .v10');
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

// ---------------------------------------------------------------- RNG con semilla (?seed=<n>)
// Corre N ticks de simulacion con paso manual (?speed=0 detiene el bucle) y devuelve un hash del estado. Misma semilla => mismo hash.
const simHash = (pg, ticks) => E(pg, (ticks) => {
  const C = G.Cards;
  if (G.state === 'cards') C.pick(0);
  G.player.hp = G.player.maxHp;
  for (let i = 0; i < ticks; i++) {
    if (G.state === 'cards') { const O = C.off; if (O) { O.modal = null; if (O.mode === 'level') C.skip(); else C.pick(0); if (G.state === 'cards') G.state = 'play'; } }
    G.step();
  }
  const r = n => Math.round(n * 100);
  let h = 2166136261 >>> 0; const mix = v => { const s = String(v); for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619) >>> 0; } };
  mix(G.time); mix(G.kills); mix(G.runT); mix(G.enemies.length); mix(G.gems.length); mix(G.projectiles.length); mix(r(G.player.x)); mix(r(G.player.y)); mix(r(G.player.hp)); mix(G.player.ash); mix(G.player.xp);
  G.enemies.forEach(e => { mix(e.type); mix(r(e.x)); mix(r(e.y)); mix(r(e.hp)); });
  G.gems.forEach(g => { mix(g.kind || g.type); mix(r(g.x)); mix(r(g.y)); });
  G.player.hand.forEach(c => mix(c ? c.id + c.lvl : '-'));
  return { hash: h, kills: G.kills, en: G.enemies.length, gems: G.gems.length, t: Math.round(G.runT) };
}, ticks);
async function seed() {
  console.log('--- RNG con semilla: sin ?seed es Math.random; con ?seed misma partida');
  const b = await launch(); const U = 'reset=1&god=1&direct=1&all=1&noanchor=1&speed=0&hand=spark:1';
  let pg = await mk(b, U);
  ok(await E(pg, () => G.rng === Math.random && G.seed === null), 'sin ?seed: G.rng ES Math.random (comportamiento identico al de siempre)');
  await done(pg, 'seed-off');
  const TICKS = +process.env.SEED_TICKS || 4000, res = [];
  for (const sd of [1234, 1234, 99]) {
    pg = await mk(b, U + '&seed=' + sd);
    const sane = await E(pg, () => typeof G.rng === 'function' && G.rng !== Math.random && G.seed);
    res.push(Object.assign(await simHash(pg, TICKS), { sane }));
    await done(pg, 'seed-' + sd);
  }
  console.log('       corridas:', JSON.stringify(res));
  ok(res.every(r => r.sane) && res[0].kills > 0 && res[0].t > 30000, 'la partida con semilla avanza (' + res[0].kills + ' kills, ' + res[0].t + ' ms de run)');
  ok(res[0].hash === res[1].hash, 'misma semilla (1234) + mismas entradas => mismo estado/hash tras ' + TICKS + ' ticks (' + res[0].hash + ')');
  ok(res[0].hash !== res[2].hash, 'otra semilla (99) => otra partida');
  pg = await mk(b, 'reset=1&seed=7&speed=0');
  const seq = await E(pg, () => { const a = []; G.rngSeed(5); for (let i = 0; i < 3; i++) a.push(G.rng()); G.rngSeed(5); return a.concat([G.rng()]); });
  ok(seq[0] === seq[3] && seq[0] !== seq[1] && seq.every(v => v >= 0 && v < 1), 'rngSeed(n) reinicia la secuencia mulberry32 ([0,1))');
  await done(pg, 'seed-api'); await b.close();
}

// ---------------------------------------------------------------- Invariante de la mano (bot de acciones aleatorias con semilla)
// Ver cards_bot_page.js. Uso: SEED=<n> ACTIONS=<n> node tests.js cards   (por defecto SEED=1, ACTIONS=12000)
async function cards() {
  console.log('--- invariante de la mano: bot aleatorio con semilla (modelo vs. juego tras cada accion)');
  const SEED = +process.env.SEED || 1, ACTIONS = +process.env.ACTIONS || 12000;
  const b = await launch(); const pg = await mk(b, 'reset=1&god=1&direct=1&all=1&speed=0&seed=' + SEED);
  await pg.addScriptTag({ content: fs.readFileSync(path.join(__dirname, 'cards_bot_page.js'), 'utf8') });
  let r = null, n = 0;
  while (n < ACTIONS) { const k = Math.min(1000, ACTIONS - n); r = await E(pg, ([s, k]) => window.__cardsBot(s, k), [SEED, k]); if (r.fail) break; n += k; }
  if (r.fail) { console.log('       semilla ' + SEED + ', accion #' + r.fail.n + ' (' + r.fail.act + '); antes: ' + r.fail.before + '\n       ' + r.fail.bad.join('\n       ') + '\n       log: ' + r.fail.log.join(' | ')); }
  ok(!r.fail, 'invariante de la mano/poderes se cumple en ' + (r.fail ? r.fail.n : ACTIONS) + ' acciones (semilla ' + SEED + ')');
  if (!r.fail) {
    const S = r.stat; console.log('       cobertura:', JSON.stringify(S));
    ok(ACTIONS < 3000 || ((S.fuse || 0) >= 20 && (S['replace-power'] || 0) >= 3 && (S['fuse1-assisted-offered'] || 0) + (S['fuse1-assisted-hand'] || 0) >= 5 && (S.discard || 0) >= 20 && (S.skip || 0) >= 20 && (S.reinforce || 0) >= 20 && (S['replace-card'] || 0) >= 5), 'el bot cubre fusion (1.ª asistida/ancla), reemplazo del 5.º poder, descartar, omitir, reforzar y reemplazar carta');
  }
  await done(pg, 'cards'); await b.close();
}

// ---------------------------------------------------------------- v9 Cinemáticas fase 1 (G.Cine, título, intro, guardado v12)
const stepN = (pg, n) => E(pg, n => { for (let i = 0; i < n; i++) G.step(); }, n);
const press = async (pg, k) => { await E(pg, k => { G.input.pressed[k] = true; }, k); await stepN(pg, 1); };
async function cine() {
  console.log('--- cinematicas v9 fase 1: motor, titulo, intro, guardado v12, pausa, accesibilidad');
  const b = await launch(); let pg;
  // 1. ?cine=0 y bots: sin titulo
  pg = await mk(b, 'reset=1&cine=0&speed=0');
  ok(await E(pg, () => G.Cine.off && G.state === 'aldea'), '?cine=0: sin titulo (aldea directa)');
  ok(await E(pg, () => { let r = null; G.Cine.play(G.Cine.INTRO, { onEnd: x => { r = x; } }); return r === 'off' && !G.Cine.active(); }), '?cine=0: play() llama a onEnd("off") al instante');
  await done(pg, 'cine0');
  pg = await mk(b, 'reset=1&speed=0');
  ok(await E(pg, () => navigator.webdriver && G.state === 'aldea' && !G.Cine.auto), 'navegador automatizado / URL de prueba: sin titulo ni intro (bots intactos)');
  await done(pg, 'bots');
  for (const u of ['direct=1', 'boss=pastor', 'hunt=pastor&practice=1', 'assault=1']) {
    pg = await mk(b, 'reset=1&speed=0&god=1&' + u);
    ok(await E(pg, () => G.state !== 'title' && G.state !== 'cine'), `?${u}: salta el titulo (estado ${'' })`);
    await done(pg, 'skip-' + u.split('=')[0]);
  }
  // 2. ?cine=1: titulo -> intro bloqueada la 1.a vez -> aldea
  pg = await mk(b, 'reset=1&cine=1&speed=0');
  ok(await E(pg, () => G.state === 'title' && G.Cine.titleActive()), '?cine=1: pantalla de titulo "TOCA PARA JUGAR"');
  await stepN(pg, 10); ok(await E(pg, () => G.state === 'title'), 'el titulo no avanza solo (ni antes de 400 ms con un toque)');
  await stepN(pg, 40); await press(pg, 'Space');
  ok(await E(pg, () => G.state === 'cine' && G.Cine.active()), 'un toque en el titulo arranca la intro (cuenta nueva)');
  const t0 = await E(pg, () => ({ time: G.time, runT: G.runT, seen: G.Save.data.cine.introSeen }));
  ok(t0.seen === false, 'introSeen sigue false mientras se reproduce');
  ok(await E(pg, () => G.Cine.info().locked === true && G.Cine.skip() === false), '1.a vez: bloqueada, skip() no hace nada');
  await press(pg, 'Escape'); ok(await E(pg, () => G.state === 'cine'), '1.a vez: Esc no la salta');
  await stepN(pg, 600);
  ok(await E(pg, () => { const i = G.Cine.info(); return i && i.t > 9000 && i.fired >= 6 && i.line; }), 'avanza con su reloj propio y dispara pistas (' + JSON.stringify(await E(pg, () => G.Cine.info() && { t: Math.round(G.Cine.info().t), f: G.Cine.info().fired })) + ')');
  ok(await E(pg, t0 => G.time === t0.time && G.runT === t0.runT, t0), 'la intro no avanza G.time ni G.runT');
  // pausa
  await E(pg, () => { Object.defineProperty(document, 'hidden', { configurable: true, get: () => true }); document.dispatchEvent(new Event('visibilitychange')); });
  const tp = await E(pg, () => G.Cine.info().t); await stepN(pg, 120);
  ok(await E(pg, tp => G.Cine.info().paused && G.Cine.info().t === tp, tp), 'segundo plano: el reloj se detiene (pausa)');
  await E(pg, () => { Object.defineProperty(document, 'hidden', { configurable: true, get: () => false }); }); await press(pg, 'Space');
  await stepN(pg, 30); ok(await E(pg, tp => !G.Cine.info().paused && G.Cine.info().t > tp, tp), 'al volver y tocar: continua desde el mismo t');
  // toque: completa la linea y luego avanza de escena
  const sc0 = await E(pg, () => G.Cine.info().scene); await stepN(pg, 60); await press(pg, 'Space'); await press(pg, 'Space');
  ok(await E(pg, s => G.Cine.info().scene > s, sc0), 'tocar avanza de viñeta (sin saltar la cinematica)');
  await stepN(pg, 1800);
  ok(await E(pg, () => G.state === 'aldea' && !G.Cine.active() && G.Save.data.cine.introSeen === true), 'al terminar vuelve a la aldea y marca introSeen');
  ok(await E(pg, () => G.player && G.Save.data.cine.introSeen), 'guardado coherente');
  // repeticion: saltable y sin escribir en el guardado
  await E(pg, () => { G.Save.data.cine.introSeen = true; G.Save.data.cine.creditsSeen = false; G.Cine.playIntro({ replay: true }); });
  ok(await E(pg, () => G.Cine.info().locked === false), 'repeticion: saltable (boton SALTAR)');
  await stepN(pg, 30);
  const sk = await E(pg, () => { const r = G.Cine.skipRect(); G.input.mouse.x = r.x + 5; G.input.mouse.y = r.y + 5; G.input.pressed.Mouse0 = true; G.input.lock = 0; G.step(); return { st: G.state, act: G.Cine.active(), cs: G.Save.data.cine.creditsSeen }; });
  ok(sk.st === 'aldea' && !sk.act && sk.cs === false, 'repeticion: el boton SALTAR termina y no toca el guardado');
  await done(pg, 'cine1');
  // 3. Reducir destellos y sacudidas
  pg = await mk(b, 'reset=1&cine=1&speed=0');
  await E(pg, () => { window.__mx = {}; });
  for (const calm of [true, false]) {
    await E(pg, calm => { G.Save.data.settings = G.Save.data.settings || { master: 0.8, music: 0.6, sfx: 0.8 }; G.Save.data.settings.cine = { calm, textSpeed: 1, soundCaps: true }; G.Cine.playIntro({ replay: true });
      const cv = document.createElement('canvas'); cv.width = 960; cv.height = 540; const c = cv.getContext('2d'); let mx = 0, fc = 0, sp = 0;
      for (let i = 0; i < 1700 && G.Cine.active(); i++) { G.step(); if (!G.Cine.active()) break; G.Cine.draw(c); const n = G.Cine.info(); mx = Math.max(mx, n.maxFlashA); fc = n.flashCount; sp = Math.max(sp, n.shakePx); }
      window.__mx[calm] = { mx, fc, sp }; G.Cine.end(); }, calm);
  }
  const mxr = await E(pg, () => window.__mx);
  ok(mxr.true.mx <= 0.2501 && mxr.true.mx > 0, 'Reducir destellos: ningun destello supera 25 % de alfa (max ' + mxr.true.mx.toFixed(2) + ')');
  ok(mxr.false.mx > 0.3, 'sin Reducir destellos el destello de titulo es mas fuerte (' + mxr.false.mx.toFixed(2) + ')');
  ok(mxr.false.sp <= 4.01, 'sacudidas acotadas a <= 4 px (' + mxr.false.sp.toFixed(2) + ')');
  // 4. motor: pistas una sola vez, capas horneadas, canvases liberados, subtitulos siempre
  const eng = await E(pg, () => {
    let n = 0, ends = [], bakes = 0; const lay = { par: 0.5, bake: { w: 960, h: 540 }, draw: () => { bakes++; } };
    const sc = k => ({ at: k * 1000, dur: 1000, layers: [lay, { draw() {}, par: 1 }] });
    G.Cine.play({ id: 'T', len: 4200, scenes: [sc(0), sc(1), sc(2), sc(3)], tracks: [{ at: 500, type: 'fn', fn: () => n++ }, { at: 500, type: 'fn', fn: () => n++ }, { at: 1500, type: 'dlg', who: 'X', text: 'hola mundo', dur: 800 }] }, { onEnd: r => ends.push(r), skippable: true });
    const cv = document.createElement('canvas'); cv.width = 960; cv.height = 540; const c = cv.getContext('2d'); let maxB = 0, sawLine = false;
    for (let i = 0; i < 300 && G.Cine.active(); i++) { G.step(); if (G.Cine.active()) { G.Cine.draw(c); maxB = Math.max(maxB, G.Cine.info().bakedCanvases); if (G.Cine.info().line) sawLine = true; } }
    return { n, ends, maxB, sawLine, bakes, st: G.state };
  });
  ok(eng.n === 2 && eng.ends.join() === 'end' && eng.maxB <= 3 && eng.sawLine && eng.st === 'aldea', 'motor: cada pista una vez, onEnd("end") una vez, <= 3 canvases vivos, subtitulo visible ' + JSON.stringify(eng));
  const sk2 = await E(pg, () => { let ends = []; G.Cine.play({ id: 'T2', len: 5000, scenes: [], tracks: [] }, { onEnd: r => ends.push(r), skippable: true }); G.Cine.skip(); G.Cine.skip(); return ends; });
  ok(sk2.join() === 'skip', 'skip() dispara onEnd("skip") exactamente una vez');
  await done(pg, 'cine-calm');
  // 5. Guardado v12: migracion v11 -> v12
  pg = await mk(b, 'reset=1&speed=0');
  const mig = await E(pg, () => {
    const mk11 = prog => { const d = JSON.parse(JSON.stringify(G.Save.data)); d.v = 11; delete d.cine; if (prog) { d.runs = 4; d.bossKills = { pastor: 1 }; d.bossSeen = { pastor: 1 }; d.endingSeen = false; } return d; };
    const out = {};
    [false, true].forEach(prog => {
      const d = mk11(prog); localStorage.setItem('swarmhand.fusion.save', JSON.stringify(d)); localStorage.removeItem('swarmhand.fusion.save.v11');
      G.Save.load(); out[prog] = { v: G.Save.data.v, intro: G.Save.data.cine.introSeen, entry: G.Save.data.cine.entrySeen, runs: G.Save.data.runs, bk: G.Save.data.bossKills, backup: !!localStorage.getItem('swarmhand.fusion.save.v11') };
    });
    const d2 = mk11(true); d2.endingSeen = true; d2.settings = { master: 0.5, music: 0.5, sfx: 0.5 }; localStorage.setItem('swarmhand.fusion.save', JSON.stringify(d2)); G.Save.load();
    out.end = { cr: G.Save.data.cine.creditsSeen, ep: G.Save.data.cine.epilogueSeen, set: G.Save.data.settings };
    return out;
  });
  ok(mig.false.v === 12 && mig.false.intro === false && mig.false.backup, 'migracion v11->v12 (cuenta sin progreso): intro NO vista, copia swarmhand.fusion.save.v11');
  ok(mig.true.v === 12 && mig.true.intro === true && mig.true.entry.pastor === 1 && mig.true.runs === 4 && mig.true.bk.pastor === 1, 'migracion v11->v12 (con progreso): introSeen=true, entrySeen desde bossSeen, sin perdidas');
  ok(mig.end.cr && mig.end.ep && mig.end.set.master === 0.5 && mig.end.set.cine && mig.end.set.cine.calm === null, 'endingSeen => creditsSeen/epilogueSeen; settings conservados + settings.cine');
  await done(pg, 'cine-save');
  // 6. La simulacion no se entera: hash identico con ?cine=0 y con cine (titulo + intro + direct)
  const U = 'reset=1&god=1&direct=1&all=1&noanchor=1&speed=0&hand=spark:1&seed=1234', TICKS = +process.env.CINE_TICKS || 2500, hs = [];
  for (const extra of ['&cine=0', '&cine=1']) {
    pg = await mk(b, U + extra);
    if (extra === '&cine=1') {
      ok(await E(pg, () => G.state === 'title'), 'direct + cine=1: se ve el titulo antes de la partida');
      await stepN(pg, 40); await press(pg, 'Space');
      await E(pg, () => { for (let i = 0; i < 4000 && (G.state === 'title' || G.state === 'cine'); i++) G.step(); });
      ok(await E(pg, () => G.state === 'play' || G.state === 'cards'), 'direct + cine=1: tras el titulo y la intro empieza la partida directa');
    }
    const rg = await E(pg, () => { const a = [G.rng(), G.rng()]; G.rngSeed(1234); return a; });
    hs.push(Object.assign(await simHash(pg, TICKS), { rg }));
    await done(pg, 'hash' + extra);
  }
  console.log('      ', JSON.stringify(hs));
  ok(hs[0].hash === hs[1].hash && hs[0].kills === hs[1].kills, 'hash de simulacion IDENTICO con ?cine=0 y con titulo+intro (' + hs[0].hash + ')');
  await cine2(b);
  await cine3(b);
  await b.close();
}

// ---------------------------------------------------------------- Cinematicas v9 fase 3: cierre (victoria in-world, epilogo, creditos) y aldea por niveles
async function cine3(b) {
  console.log('--- cinematicas v9 fase 3: victoria de Cenizar -> epilogo -> creditos -> botin; aldea por niveles; galeria');
  const FIGHT = extra => `reset=1&god=1&all=1&nointro=1&speed=0&seed=5&peligro=3&hand=spark:3,shard:2,dart:1&boss=cenizar${extra}`;
  const kill = pg => E(pg, () => {
    G.Save.data.cine.introSeen = true;
    for (let i = 0; i < 40 && G.state === 'title'; i++) G.step(); if (G.state === 'title') { G.input.pressed.Space = true; G.step(); }
    for (let i = 0; i < 4000 && (G.state === 'title' || G.state === 'cine'); i++) G.step();
    window.__snd = []; const p0 = G.Snd.play; G.Snd.play = function (n) { window.__snd.push('play:' + n); return p0.apply(this, arguments); };
    const c3 = G.Snd.cine3; G.Snd.cine3 = function (k, a) { window.__snd.push('cine3:' + k); return c3 && c3.apply(this, arguments); };
    for (let i = 0; i < 600 && !G.Boss.e; i++) { G.step(); if (G.state === 'cards') { G.Cards.off = null; G.state = 'play'; } }
    const e = G.Boss.e; if (e) { e.hp = 1; G.Enemies.kill(e); } return !!e;
  });
  // 1. Primera victoria con cine=1: victoria in-world 6 s -> epilogo (bloqueado) -> creditos -> botin
  let pg = await mk(b, FIGHT('&cine=1'));
  ok(await kill(pg), 'Cenizar (cine=1): jefe muerto');
  const v = await E(pg, () => { let n = 0, seen = false, lastEnd = 0; while (G.state === 'play' && n++ < 2000) { G.step(); if (G.Ending.victoryOn()) seen = true; lastEnd = G.endT; } return { seen, st: G.state, n, endT: lastEnd, info: G.Cine.info() && G.Cine.info().id, ms: n * G.STEP, hp: G.state }; });
  ok(v.seen && v.st === 'cine' && v.info === 'epilogue', 'victoria in-world (G.Ending.victoryOn) -> epilogo (' + Math.round(v.endT) + ' ms de espera)');
  ok(v.endT > 5900 && v.endT < 6300, 'la victoria in-world dura ~6 s (' + Math.round(v.endT) + ' ms)');
  const ep = await E(pg, () => { const o = {}; for (let i = 0; i < 100; i++) G.step(); G.input.pressed.Escape = true; G.input.pressed.Space = true; for (let i = 0; i < 3; i++) { G.input.lock = 0; G.step(); } o.locked = G.Cine.info().locked; o.still = G.Cine.info().id === 'epilogue'; o.len = G.Cine.EPILOGUE.len; o.skip = G.Cine.skip(); o.vis = JSON.stringify(G.Save.data.cine); return o; });
  ok(ep.locked && ep.still && !ep.skip, 'epilogo la 1.a vez: NO saltable (Esc / toque / skip())');
  ok(ep.len >= 40000 && ep.len <= 56000, 'epilogo ' + (ep.len / 1000).toFixed(1) + ' s (incluye ~6 s de stinger de victoria y los 16 s de ceniza de la pista)');
  const run = await E(pg, () => { let n = 0, maxF = 0, flashN = 0, marks = [], paused = null; const t0 = G.time;
    while (G.Cine.active() && G.Cine.info().id === 'epilogue' && n++ < 4000) {
      G.step(); const i = G.Cine.info(); if (i) { maxF = Math.max(maxF, i.maxFlashA); flashN = Math.max(flashN, i.flashCount); }
      if (n === 200) { const a = G.Cine.info().t; window.dispatchEvent(new Event('blur')); for (let k = 0; k < 30; k++) G.step(); paused = { p: G.Cine.info().paused, same: G.Cine.info().t === a }; G.input.pressed.Mouse0 = true; G.input.lock = 0; G.step(); paused.resumed = !G.Cine.info().paused; }
    }
    const S = G.Save.data; return { n, maxF, flashN, paused, dtime: G.time - t0, id: G.Cine.info() && G.Cine.info().id, end: S.endingSeen, ep: S.cine.epilogueSeen, cr: S.cine.creditsSeen }; });
  ok(run.paused && run.paused.p && run.paused.same && run.paused.resumed, 'pausa en segundo plano (blur): el reloj del epilogo se detiene y reanuda con un toque');
  ok(run.maxF <= 0.3 && run.flashN === 0, 'epilogo: sin destello blanco (maxFlashA ' + run.maxF.toFixed(2) + ', destellos ' + run.flashN + ')');
  ok(run.dtime === 0 && run.id === 'credits' && run.end && run.ep && !run.cr, 'epilogo no avanza G.time; marca endingSeen y epilogueSeen; sigue con los creditos');
  const cr = await E(pg, () => { const o = { len: G.Cine.CREDITS_SCRIPT.len }; for (let i = 0; i < 60; i++) G.step(); o.lock1 = G.Cine.info().locked; o.skip1 = G.Cine.skip(); for (let i = 0; i < 160; i++) G.step(); o.lock2 = G.Cine.info().locked; o.names = JSON.stringify(G.Ending.CREDITS).length > 200 && /XITAKHA/.test(JSON.stringify(G.Ending.CREDITS));
    o.skip2 = G.Cine.skip(); o.st = G.state; o.cr = G.Save.data.cine.creditsSeen; return o; });
  ok(cr.lock1 && !cr.skip1 && !cr.lock2 && cr.skip2, 'creditos: bloqueados 3 s y saltables despues');
  ok(cr.len >= 24000 && cr.len <= 27000 && cr.names, 'creditos ' + (cr.len / 1000).toFixed(1) + ' s con Xitakha Studio y los 8 agentes');
  ok(cr.st === 'gameover' && cr.cr, 'tras los creditos: pantalla de botin (gameover) y creditsSeen');
  const snd = await E(pg, () => window.__snd);
  ok(!snd.includes('play:stg_cenizar_win') && !snd.includes('play:stg_cenizar_ending') && snd.filter(x => x === 'cine3:victory').length === 1 && snd.filter(x => x === 'cine3:fire').length === 1, 'jingles: sin stg_cenizar_win ni stg_cenizar_ending; cine3 victory y fire una vez (' + snd.join(',') + ')');
  const ls = await E(pg, () => { G.Aldea.open(true); return { lv: G.Aldea.level(), st: G.state }; });
  ok(ls.lv === 6 && ls.st === 'aldea', 'tras el botin la aldea esta completa (nivel 6)');
  await done(pg, 'cierre');
  // 2. ?cine=0, bots (sin cine=1) y 2.a victoria: sin epilogo, directo al botin
  for (const [name, extra, pre] of [['cine=0', '&cine=0', false], ['URL de prueba (sin cine=1)', '', false], ['2.a victoria', '&cine=1', true]]) {
    pg = await mk(b, FIGHT(extra));
    if (pre) await E(pg, () => { G.Save.data.bossKills.cenizar = 1; });
    await kill(pg);
    const r = await E(pg, () => { let n = 0, vic = false, cine = false; while (G.state !== 'gameover' && n++ < 3000) { G.step(); if (G.state === 'play' && G.Ending.victoryOn()) vic = true; if (G.Cine.active()) cine = true; } return { vic, cine, st: G.state, endT: G.endT }; });
    ok(r.st === 'gameover' && !r.vic && !r.cine && r.endT < 3200, name + ': sin victoria in-world ni epilogo (espera ' + Math.round(r.endT) + ' ms): directo al botin');
    await done(pg, 'cierre-' + name);
  }
  // 3. Practica: nunca
  pg = await mk(b, FIGHT('&cine=1&practice=1'));
  await kill(pg); const pr = await E(pg, () => { let n = 0, cine = false; while (G.state !== 'gameover' && n++ < 3000) { G.step(); if (G.Cine.active()) cine = true; } return { cine, st: G.state, eg: G.Ending.eligible() }; });
  ok(!pr.cine && !pr.eg && pr.st === 'gameover', 'Practica: sin epilogo');
  await done(pg, 'cierre-practica');
  // 4. Simulacion: el combate de Cenizar no cambia (hash identico con ?cine=0 y cine=1 hasta la muerte)
  const hs = [];
  for (const extra of ['&cine=0', '&cine=1']) {
    pg = await mk(b, FIGHT(extra) + '&nodmg=1');
    hs.push(await E(pg, () => { G.Save.data.cine.introSeen = true; for (let i = 0; i < 40 && G.state === 'title'; i++) G.step(); if (G.state === 'title') { G.input.pressed.Space = true; G.step(); } for (let i = 0; i < 4000 && (G.state === 'title' || G.state === 'cine'); i++) G.step();
      for (let i = 0; i < 700; i++) { G.step(); if (G.state === 'cards') { G.Cards.off = null; G.state = 'play'; } } const e = G.Boss.e; let h = 0; const m = [G.time, e && e.x, e && e.y, G.state].join('|'); for (let i = 0; i < m.length; i++) h = (h * 31 + m.charCodeAt(i)) | 0; return { h, m }; }));
    await done(pg, 'hash-' + extra);
  }
  ok(hs[0].h === hs[1].h, 'simulacion de Cenizar (reloj, posicion y estado; HP, fase y bajas dependen de tiempo real incluso con ?cine=0) identica con ?cine=0 y cine=1 (' + hs[0].m + ')');
  // 5. Aldea por niveles 0..6 (derivado de bossKills) y dibujo sin errores; migracion: cuentas con jefes lo reciben
  pg = await mk(b, 'reset=1&cine=0&speed=0');
  const vl = await E(pg, () => { const out = [], ids = G.Save.BOSSES; const cv = document.createElement('canvas'); cv.width = 960; cv.height = 540; const c = cv.getContext('2d'); let err = 0;
    for (let n = 0; n <= 6; n++) { G.Save.data.bossKills = {}; G.Save.data.endingSeen = false; for (let i = 0; i < n; i++) G.Save.data.bossKills[ids[i]] = 1; G.Aldea.open(false); try { G.Aldea.draw(c); } catch (e) { err++; } out.push(G.Aldea.level()); }
    G.Save.data.bossKills = { karceron: 2, melaria: 1 }; const mix = G.Aldea.level(); G.Save.data.bossKills = {}; G.Save.data.endingSeen = true; const es = G.Aldea.level(); return { out, mix, es, err, txt: [1, 2, 3, 4, 5, 6].every(n => G.Aldea.levelText(n).length > 5) }; });
  ok(JSON.stringify(vl.out) === '[0,1,2,3,4,5,6]' && vl.mix === 2 && vl.es === 6 && vl.err === 0 && vl.txt, 'nivel de aldea 0..6 = jefes vencidos (cualquier orden); endingSeen => completa; dibuja los 7 niveles sin errores');
  const sv = await E(pg, () => { const k = Object.keys(G.Save.data); return k.includes('villageLevel') || k.includes('aldeaNivel'); });
  ok(!sv, 'el nivel de aldea no se guarda (derivado de bossKills)');
  // 6. Galeria: epilogo + creditos y creditos solos, saltables, sin escribir en el guardado
  const gl = await E(pg, () => { G.Save.data.endingSeen = true; G.Save.data.cine.introSeen = true; const before = JSON.stringify(G.Save.data.cine); const o = {};
    G.Cine.off = false; let done = 0; G.Ending.playAll({ replay: true, returnState: 'aldea', onEnd: () => { done++; } }); o.id0 = G.Cine.info().id; o.lock0 = G.Cine.info().locked;
    for (let i = 0; i < 30; i++) G.step(); G.Cine.skip(); o.id1 = G.Cine.info() && G.Cine.info().id; for (let i = 0; i < 200; i++) G.step(); G.Cine.skip(); o.done = done; o.st = G.state;
    G.Ending.playCredits({ replay: true, returnState: 'aldea' }, () => { done++; }); o.idc = G.Cine.info().id; for (let i = 0; i < 200; i++) G.step(); G.Cine.skip(); o.done2 = done; o.same = before === JSON.stringify(G.Save.data.cine); return o; });
  ok(gl.id0 === 'epilogue' && !gl.lock0 && gl.id1 === 'credits' && gl.done === 1 && gl.idc === 'credits' && gl.done2 === 2 && gl.same, 'galeria: epilogo (saltable) -> creditos (saltables tras 3 s); no escribe en el guardado');
  await done(pg, 'aldea-galeria');
}

// ---------------------------------------------------------------- Cinematicas v9 fase 2: entradas de jefe
// Arranca una pelea de jefe (con o sin titulo) y avanza hasta que empieza la intro in-world (G.Boss.intro) o hasta una cinematica 'full'.
const BOSS_URL = (id, extra) => `reset=1&god=1&direct=1&all=1&noanchor=1&speed=0&hand=spark:1&seed=77&boss=${id}${extra}`;
async function toIntro(pg, stopOnCine) {
  await E(pg, () => { if (G.state !== 'title') return; for (let i = 0; i < 40; i++) G.step(); G.input.pressed.Space = true; G.step(); for (let i = 0; i < 4000 && (G.state === 'title' || (G.state === 'cine' && G.Cine.info() && G.Cine.info().id === 'intro')); i++) G.step(); });
  return E(pg, stop => { for (let i = 0; i < 40000 && !G.Boss.intro && !(stop && G.state === 'cine'); i++) { if (G.state === 'cards') { const O = G.Cards.off; if (O) { O.modal = null; if (O.mode === 'level') G.Cards.skip(); else G.Cards.pick(0); if (G.state === 'cards') G.state = 'play'; } } G.step(); } return { intro: !!G.Boss.intro, st: G.state, mode: G.Boss.intro && G.Boss.intro.mode }; }, !!stopOnCine);
}
// pasos hasta que acaba la intro; comprueba que el jugador es invulnerable todo el rato y devuelve datos de fin de intro
const runIntro = (pg, o = {}) => E(pg, o => {
  const e = G.Boss.e, I = G.Boss.intro, t0 = G.time; let n = 0, noHurtAll = true, skipped = false, lastReal = 0;
  while (G.Boss.intro && n < 3000) {
    if (!G.Boss.noHurtNow()) noHurtAll = false;
    if (o.skipAt != null && !skipped && G.Boss.intro.real >= o.skipAt) { G.input.pressed.Space = true; skipped = true; }
    lastReal = G.Boss.intro.real; G.step(); n++;
  }
  return { n, ms: Math.round(G.Boss.e && lastReal ? lastReal + G.STEP : n * G.STEP), dtime: Math.round(G.time - t0), cad: e.cadT, mode: e.mode, immune: e.immune, frozen: G.frozen, noHurtAll, roared: I.roared, music: I.music, seen: !!(G.Save.data.cine.entrySeen[e.id]), skipped: I.skipped };
}, o);
const bossHash = (pg, ticks) => E(pg, ticks => {
  for (let i = 0; i < ticks; i++) { if (G.state === 'cards') { const O = G.Cards.off; if (O) { O.modal = null; if (O.mode === 'level') G.Cards.skip(); else G.Cards.pick(0); if (G.state === 'cards') G.state = 'play'; } } G.player.hp = G.player.maxHp; G.step(); }
  const r = n => Math.round(n * 100), e = G.Boss.e; let h = 2166136261 >>> 0; const mix = v => { const s = String(v); for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619) >>> 0; } };
  mix(G.time); mix(G.kills); mix(G.enemies.length); mix(G.projectiles.length); mix(r(G.player.x)); mix(r(G.player.y)); mix(G.player.xp);
  G.enemies.forEach(x => { mix(x.type); mix(r(x.x)); mix(r(x.y)); mix(r(x.hp)); });
  if (e) { mix(e.phase); mix(e.mode); mix(Math.round(e.cadT)); mix(r(e.hp)); mix(e.atk && e.atk.name); }
  return { hash: h, g: G.rng(), time: Math.round(G.time), kills: G.kills };
}, ticks);

async function cine2(b) {
  console.log('--- cinematicas v9 fase 2: entradas de jefe (larga / corta / ?cine=0), prerrollo de Cenizar, galeria');
  let pg;
  // 1. Simulacion identica: ?cine=0 (intro de siempre), entrada larga (?cine=1 con el jefe sin ver) y corta (?cine=short)
  const res = {};
  for (const [k, extra, seenFirst] of [['off', '&cine=0', false], ['long', '&cine=1', false], ['short', '&cine=short', false], ['short2', '&cine=1', true]]) {
    pg = await mk(b, BOSS_URL('pastor', extra));
    if (seenFirst) await E(pg, () => { G.Save.data.cine.entrySeen.pastor = 1; });
    const st = await toIntro(pg);
    await E(pg, () => G.rngSeed(77));
    const ri = await runIntro(pg);
    const gi = await E(pg, () => { const v = G.rng(); G.rngSeed(78); return v; });
    const h0 = await bossHash(pg, 0), hh = await bossHash(pg, 25);
    hh.h0 = h0.hash; hh.g0 = h0.g;
    res[k] = Object.assign({ imode: st.mode, gi }, ri, hh);
    await done(pg, 'entrada-' + k);
  }
  console.log('      ', JSON.stringify(res));
  ok(res.off.imode === 'off' && res.long.imode === 'long' && res.short.imode === 'short' && res.short2.imode === 'short', 'modos: ?cine=0 = intro de siempre, 1.a vez = larga, ya vista / ?cine=short = corta');
  ok(Math.abs(res.off.ms - 3500) <= 100 && Math.abs(res.long.ms - 4500) <= 100 && Math.abs(res.short.ms - 1600) <= 100 && Math.abs(res.short2.ms - 1600) <= 100, `duracion: off ${res.off.ms}, larga ${res.long.ms}, corta ${res.short.ms} / ${res.short2.ms} ms (3500 / 4500 / 1600 +-100)`);
  for (const k of Object.keys(res)) ok(res[k].cad === 1200 && res[k].mode === 'fight' && !res[k].frozen && res[k].noHurtAll && res[k].roared && res[k].music && res[k].seen, `${k}: al acabar cadT=1200, mundo libre, invulnerable todo el rato, rugido (cullHorde) y musica hechos, entrySeen marcada`);
  ok(res.off.dtime === res.long.dtime && res.off.dtime === res.short.dtime, `G.time avanza igual en la intro (${res.off.dtime} / ${res.long.dtime} / ${res.short.dtime}): la simulacion recibe los mismos pasos`);
  const same = f => ['long', 'short', 'short2'].every(k => res[k][f] === res.off[f]);
  ok(same('h0') && same('hash') && same('g0') && same('gi'), 'hash de estado IDENTICO al acabar la entrada y 25 ticks despues con ?cine=0, larga y corta; G.rng consume lo mismo (' + res.off.h0 + ' / ' + res.off.hash + ')');   // (la pelea en si no es bit-identica entre dos corridas ni con ?cine=0: hay Math.random en el combate, ajeno a esto)
  // 2. Saltar: la corta desde 800 ms (no antes); la larga (1.a vez) nunca; tras saltar el estado final es el de siempre
  pg = await mk(b, BOSS_URL('pastor', '&cine=short'));
  await toIntro(pg);
  const sk0 = await runIntro(pg, { skipAt: 300 }), early = sk0.ms;
  await done(pg, 'salto-corta-temprano');
  pg = await mk(b, BOSS_URL('pastor', '&cine=short')); await toIntro(pg);
  const sk1 = await runIntro(pg, { skipAt: 900 });
  ok(early >= 1500, `corta: un toque antes de 800 ms no salta (acaba a ${early} ms)`);
  ok(sk1.ms < 1300 && sk1.cad === 1200 && sk1.roared && sk1.music && !sk1.frozen && sk1.seen, `corta: salto a 900 ms (acaba a ${sk1.ms} ms) con rugido/cullHorde, musica, cadT=1200 y marca`);
  await done(pg, 'salto-corta');
  pg = await mk(b, BOSS_URL('karceron', '&cine=1')); await toIntro(pg);
  const sk2 = await runIntro(pg, { skipAt: 1500 });
  ok(Math.abs(sk2.ms - 4500) <= 100, `larga (1.a vez): NO se puede saltar (dura ${sk2.ms} ms con toques)`);
  await done(pg, 'salto-larga');
  // 3. Los 6 jefes: larga, luego corta (marca entrySeen); Cenizar con prerrollo
  for (const id of ['pastor', 'karceron', 'letea', 'yarlak', 'melaria', 'cenizar']) {
    pg = await mk(b, BOSS_URL(id, '&cine=1')); const st = await toIntro(pg, true);
    let info = null;
    if (id === 'cenizar') {
      info = await E(pg, () => { const i = G.Cine.info(); return { st: G.state, id: i && i.id, locked: i && i.locked, len: G.Cine.PREROLL.len, time: G.time, lines: G.Cine.PREROLL_LORE.length, boss: !!G.Boss.e }; });
      ok(info.st === 'cine' && info.id === 'cenizar-preroll' && info.locked && !info.boss, 'Cenizar 1.a vez: prerrollo de 6 s bloqueado ANTES de S.spawn (sin jefe todavia)');
      const pr = await E(pg, () => { const t0 = G.time; let n = 0; const ph = []; while (G.state === 'cine' && n < 2000) { G.input.pressed.Space = true; G.input.pressed.Mouse0 = true; G.step(); n++; } return { n, ms: Math.round(n * G.STEP), dt: Math.round(G.time - t0), st: G.state, intro: !!G.Boss.intro, mode: G.Boss.intro && G.Boss.intro.mode }; });
      ok(Math.abs(pr.ms - 6000) <= 150 && pr.dt === 0 && pr.st === 'play' && pr.intro && pr.mode === 'long', `Cenizar: el prerrollo dura ${pr.ms} ms, no avanza G.time, y le sigue la entrada larga`);
    } else ok(st.mode === 'long', id + ': entrada larga la 1.a vez');
    const ri = await runIntro(pg);
    ok(Math.abs(ri.ms - 4500) <= 100 && ri.cad === 1200 && ri.noHurtAll && ri.seen, `${id}: larga ${ri.ms} ms, cadT=1200, invulnerable, marcada`);
    await done(pg, 'larga-' + id);
    pg = await mk(b, BOSS_URL(id, '&cine=1'));
    await E(pg, id => { G.Save.data.cine.entrySeen[id] = 1; }, id); const st2 = await toIntro(pg, true);
    ok(st2.mode === 'short', id + ': la 2.a vez es la corta' + (id === 'cenizar' ? ' (sin prerrollo)' : ''));
    const r2 = await runIntro(pg); ok(Math.abs(r2.ms - 1600) <= 100 && r2.cad === 1200 && r2.noHurtAll, `${id}: corta ${r2.ms} ms, cadT=1200, invulnerable`);
    await done(pg, 'corta-' + id);
  }
  // 4. Perillas: URLs de prueba y bots apagadas por defecto (intro de siempre); practica = corta; Reducir destellos y sacudida
  pg = await mk(b, BOSS_URL('pastor', ''));
  const st3 = await toIntro(pg); ok(st3.mode === null || st3.mode === 'off', '?boss= sin ?cine: entrada apagada (intro de siempre de 3,5 s)');
  await done(pg, 'perilla-boss');
  pg = await mk(b, BOSS_URL('pastor', '&cine=1&nointro=1')); await toIntro(pg);
  ok(await E(pg, () => !G.Boss.intro || G.Boss.intro.mode === 'off'), '?nointro=1 sigue omitiendo la entrada');
  await done(pg, 'perilla-nointro');
  pg = await mk(b, BOSS_URL('pastor', '&cine=1')); await toIntro(pg);
  const cal = await E(pg, () => { G.Save.data.settings = G.Save.data.settings || { master: 0.8, music: 0.6, sfx: 0.8 }; G.Save.data.settings.cine = { calm: true, textSpeed: 1, soundCaps: true }; let ok2 = true, n = 0;
    const cv = document.createElement('canvas'); cv.width = 960; cv.height = 540; const c = cv.getContext('2d');
    while (G.Boss.intro && n++ < 400) { G.step(); c.clearRect(0, 0, 960, 540); try { G.Boss.drawHud(c); } catch (e) { ok2 = false; } }
    return { ok2, lore: G.Cine.LORE.pastor.length > 5, sub: Object.keys(G.Cine.LORE).length }; });
  ok(cal.ok2 && cal.sub === 6, 'dibujo de la capa (con Reducir destellos) sin excepciones; lore para los 6 jefes');
  await done(pg, 'calm');
  // 5. Galeria: re-ver cada entrada, saltable, sin escribir en el guardado
  pg = await mk(b, 'reset=1&cine=1&speed=0');
  const gal = await E(pg, () => { const cs = G.Save.data.cine; cs.introSeen = true; const before = JSON.stringify(cs); const out = {};
    for (const id of G.Cine.entryIds) { let r = null; G.Cine.playEntry(id, { onEnd: x => { r = x; } }); const a = G.Cine.info(); out[id] = a && a.id; let n = 0; while (G.Cine.active() && n++ < 600) G.step(); out[id + '_skipped'] = r; }
    out.same = before === JSON.stringify(cs); return out; });
  ok(['pastor', 'karceron', 'letea', 'yarlak', 'melaria'].every(id => gal[id] === 'entry-' + id) && gal.cenizar === 'cenizar-preroll', 'galeria: arranca la cinematica de cada jefe (Cenizar empieza por el prerrollo)');
  const gal2 = await E(pg, () => { G.Save.data.cine.introSeen = true; G.Save.data.cine.entrySeen.pastor = 1; G.Cine.playEntry('pastor', {}); const i0 = G.Cine.info(); for (let i = 0; i < 40; i++) G.step(); const r = G.Cine.info().locked; const rc = G.Cine.skipRect(); G.input.mouse.x = rc.x + 5; G.input.mouse.y = rc.y + 5; G.input.pressed.Mouse0 = true; G.input.lock = 0; G.step(); return { locked: r, active: G.Cine.active(), st: G.state, es: JSON.stringify(G.Save.data.cine.entrySeen) }; });
  ok(!gal2.locked && !gal2.active && gal2.st === 'aldea', 'galeria: saltable con el boton SALTAR y vuelve a la aldea');
  ok(gal.same, 'galeria: no escribe en el guardado');
  const ui = await E(pg, () => { G.Aldea.open(false); G.Panels.open && G.Panels.open('menu'); return typeof G.Panels.current === 'function'; });
  await done(pg, 'galeria');
}



// ---------------------------------------------------------------- Texto: pantallas de victoria de los 6 jefes y menús sin solapes ni desbordes
async function text() {
  console.log('--- texto: victoria de los 6 jefes, derrota, pausa, Portal y paneles (844x390): sin solapes, desbordes ni fuentes < 11,5 px');
  const b = await launch();
  const report = async (pg, name) => { const d = await TC.snap(pg, 2); const iss = TC.analyze(d, { minSize: 11.5 }).filter(i => i.k !== 'contraste' || true); ok(d.texts.length > 5 && iss.length === 0, `${name}: ${d.texts.length} textos, ${iss.length} problemas` + (iss.length ? ' -> ' + iss.slice(0, 3).map(i => i.msg).join(' | ') : '')); };
  for (const id of ['pastor', 'karceron', 'letea', 'yarlak', 'melaria', 'cenizar']) {
    const pg = await mk(b, `reset=1&god=1&all=1&nointro=1&speed=0&seed=5&peligro=3&cine=0&hand=spark:3,shard:2,dart:1&boss=${id}`);
    const st = await E(pg, () => { G.Save.data.bossKills.cenizar = 1; for (let i = 0; i < 600 && !G.Boss.e; i++) G.step(); const e = G.Boss.e; if (e) { e.hp = 1; G.Enemies.kill(e); } for (let i = 0; i < 600 && G.state !== 'gameover'; i++) { G.step(); if (G.state === 'cards') { G.Cards.off = null; G.state = 'play'; } } return G.state; });
    ok(st === 'gameover', `${id}: la victoria llega a la pantalla de botín`);
    await report(pg, `victoria ${id}`);
    // peor caso: botín enorme, trofeos, encargo largo, cartas nuevas, armadura, 4 poderes y jefe con muchas partes rotas
    await E(pg, () => { const S = G.Save.data, sm = G.Loot.summary; ['thread', 'feather', 'spine', 'fang', 'plate', 'wick', 'frost', 'static', 'rare'].forEach((k, i) => { sm.parts[k] = 12 + i; S.parts[k] = 1234; }); sm.total = 150; sm.brasas = 12345; S.brasas = 987654; sm.rare = 1; sm.pfGained = 4; sm.blocked = 987; sm.rawDmg = 1500;
      sm.quest = 'Encargo cumplido: Apaga a los Perros pastores (40/40) y entrega la cabeza al Tablón de Vesper para cobrar'; sm.newCards = ['spark', 'shard', 'dart', 'dagger', 'fang', 'zap', 'ember', 'nova'];
      if (sm.boss) { sm.boss.parts = ['cuernos', 'cayado', 'vellon', 'a', 'b']; sm.boss.peligro = 5; sm.boss.unlocked = 5; sm.boss.trophies = Object.keys(G.Boss.TROPHY).slice(0, 3); }
      ['vapor', 'plasma', 'forja', 'hemo'].forEach(a => { try { G.Fusion.grant(a, 2); } catch (e) { /* receta ausente */ } }); });
    await report(pg, `victoria ${id} (peor caso)`);
    await done(pg, 'texto-' + id);
  }
  let pg = await mk(b, 'reset=1&direct=1&all=1&god=0&speed=0');
  await E(pg, () => { G.god = false; G.player.hp = 0; G.player.dead = true; G.finish(false); }); await report(pg, 'derrota');
  await done(pg, 'texto-derrota');
  pg = await mk(b, 'reset=1&direct=1&all=1&speed=0');
  await E(pg, () => { G.step(); G.state = 'paused'; G.Hud.pauseOpen(); }); await report(pg, 'pausa'); await done(pg, 'texto-pausa');
  pg = await mk(b, 'reset=1&all=1&speed=0&give=all:40,brasas:900&pf=5');
  for (const pn of ['portal', 'vesper', 'rufo', 'archive', 'cook', 'logros', 'menu', 'settings', 'forge', 'armor']) { await E(pg, n => { G.Aldea.open(false); G.Aldea.openPanel(n); }, pn); await sleep(pg, 150); await report(pg, 'panel ' + pn); }
  await E(pg, () => { G.Aldea.open(false); G.Aldea.openPanel('portal'); G.Panels.portalTab(1); }); await sleep(pg, 150); await report(pg, 'panel portal (cartas)');
  await done(pg, 'texto-paneles'); await b.close();
}


// ---------------------------------------------------------------- Manual de cartas y combinaciones (src/manual.js)
async function manual() {
  console.log('--- manual: desbloqueo gradual, 43 entradas con demo animada determinista, navegación táctil, buscador, accesos y texto');
  const b = await launch();
  // 1. cuenta nueva: solo lo descubierto
  let pg = await mk(b, 'reset=1&speed=0');
  const r1 = await E(pg, () => { G.Aldea.open(false); G.Aldea.openPanel('menu'); const M = G.Manual, en = M.entries(); const cards = en.filter(e => e.k === 'card'), fx = en.filter(e => e.k === 'fx');
    return { cards: cards.length, defs: G.Cards.defs.filter(d => d.id).length, fx: fx.length, kc: cards.filter(M.isKnown).length, kf: fx.filter(M.isKnown).length, starters: G.Save.STARTERS.length }; });
  ok(r1.fx === 15 && r1.cards === r1.defs, `entradas: ${r1.cards} cartas y ${r1.fx} fusiones`);
  ok(r1.kc === r1.starters && r1.kf === 0, `cuenta nueva: solo ${r1.kc} cartas iniciales conocidas y ${r1.kf} fusiones (el resto '???')`);
  const r1b = await E(pg, () => { G.Save.data.combosSeen.vapor = 1; return G.Manual.isKnown(G.Manual.entries().find(e => e.id === 'vapor')); });
  ok(r1b, 'una fusión creada (combosSeen) pasa a estar descubierta');
  ok((await E(pg, () => G.Save.VERSION)) === 12, 'el guardado sigue en la versión 12 (manualSeen se normaliza sin subirla)');
  await done(pg, 'manual-cuenta');
  // 2. ?manual=all + demos
  pg = await mk(b, 'reset=1&manual=all');
  const r2 = await E(pg, () => { const M = G.Manual, en = M.entries(); G.Aldea.open(false); G.Aldea.openPanel('menu');
    const cv = document.createElement('canvas'); cv.width = 440; cv.height = 248; const c = cv.getContext('2d');
    let rnd = 0, tm = 0; const R0 = G.rng, MR = Math.random; G.rng = () => { rnd++; return R0(); }; Math.random = () => { tm++; return MR(); };
    const gt = G.time, ne = G.enemies.length, np = G.projectiles.length, nz = G.zones.length; let bad = [], still = [], nondet = [], err = 0, caps = 0;
    const sig = t => { c.clearRect(0, 0, 440, 248); M.lastError = null; const cap = M.renderDemo(c, e0, t); if (M.lastError) err++; if (cap) caps++; return cv.toDataURL(); };
    let e0;
    for (const e of en) { e0 = e; sig(0.6); const a = sig(0.6), a2 = sig(0.6), b2 = sig(2.4), d2 = sig(3.9); if (a !== a2) nondet.push(e.id); if (a === b2 && b2 === d2) still.push(e.id); }
    G.rng = R0; Math.random = MR;
    return { all: en.filter(M.isKnown).length, n: en.length, nondet, still, err, caps, rnd, tm, same: G.time === gt && G.enemies.length === ne && G.projectiles.length === np && G.zones.length === nz }; });
  ok(r2.all === r2.n && r2.n === 43, `?manual=all: ${r2.all}/${r2.n} entradas visibles`);
  ok(r2.err === 0 && r2.caps === r2.n * 5, `las 43 demos se dibujan sin excepciones y con leyenda (${r2.caps / 5})`);
  ok(r2.nondet.length === 0, 'demos deterministas: mismo instante = mismos píxeles' + (r2.nondet.length ? ' (fallan ' + r2.nondet.join(',') + ')' : ''));
  ok(r2.still.length === 0, 'todas las demos se animan (cambian entre 0,6 s, 2,4 s y 3,9 s)' + (r2.still.length ? ' (quietas: ' + r2.still.join(',') + ')' : ''));
  ok(r2.rnd === 0 && r2.tm === 0 && r2.same, `la demo no usa G.rng (${r2.rnd}) ni Math.random (${r2.tm}) y no toca G.time / enemigos / proyectiles / zonas`);
  // 3. navegación por toque, filtro, buscador, reloj propio
  await E(pg, () => { G.Aldea.open(false); G.Aldea.openPanel('manual'); });
  await sleep(pg, 400);
  const st0 = await E(pg, () => G.Manual.state());
  await tap(pg, 240, 468); await sleep(pg, 100);   // siguiente página
  const st1 = await E(pg, () => G.Manual.state()); ok(st1.page === 1 && st1.sel === 5, `botón siguiente: página ${st0.page} -> ${st1.page}`);
  await tap(pg, 100, 210 + 46 * 2 + 20); await sleep(pg, 100);
  const st2 = await E(pg, () => G.Manual.state()); ok(st2.sel === 7, 'tocar una fila la selecciona (' + st2.sel + ')');
  await E(pg, () => { G.input.swipe = -1; }); await sleep(pg, 150);
  ok((await E(pg, () => G.Manual.state().sel)) === 8, 'deslizar a la izquierda = siguiente entrada');
  await tap(pg, 100, 130); await sleep(pg, 100);
  const st3 = await E(pg, () => G.Manual.state()); ok(st3.filter === 'fire' && st3.n < st0.n, `filtro por etiqueta (un toque): ${st3.filter}, ${st3.n} entradas`);
  await tap(pg, 926, 27); await sleep(pg, 150);
  ok(await E(pg, () => G.Panels.current() === 'menu' || G.Panels.current() === null), 'la X cierra el Manual y vuelve al menú');
  await E(pg, () => { G.Panels.open('manual'); G.Manual.setFilter('all'); G.Manual.setTab(0); G.Manual.setQuery('veneno'); });
  const qs = await E(pg, () => { const M = G.Manual; return { n: M.state().n, all: M.entries().filter(e => e.k === 'card').filter(e => (e.name + ' ' + e.def.desc).toLowerCase().indexOf('veneno') >= 0 || e.tag === 'poison').length }; });
  ok(qs.n > 0 && qs.n <= qs.all, `buscador: 'veneno' deja ${qs.n} cartas`);
  await E(pg, () => { G.Manual.setQuery('zzzz'); }); ok((await E(pg, () => G.Manual.state().n)) === 0, 'buscador sin resultados');
  await E(pg, () => { G.Manual.setQuery(''); G.Manual.setTab(1); G.Manual.select(0); });
  const t1 = await E(pg, () => G.Manual.state().demoT); await sleep(pg, 700); const t2 = await E(pg, () => G.Manual.state().demoT);
  ok(t2 > t1 + 0.3, `el reloj de la demo avanza con el Manual abierto (${t1.toFixed(2)} -> ${t2.toFixed(2)} s)`);
  await E(pg, () => { G.Manual.close(); G.Aldea.open(false); }); await sleep(pg, 100);
  const t3 = await E(pg, () => G.Manual.state().demoT); await sleep(pg, 700); const t4 = await E(pg, () => G.Manual.state().demoT);
  ok(t3 === t4, 'cerrado / fuera de pantalla la demo no avanza (pausa automática)');
  // 4. 'visto en el manual'
  const sn = await E(pg, () => { G.Save.data.manualSeen = {}; G.Aldea.open(false); G.Aldea.openPanel('manual'); G.Manual.setTab(1); G.Manual.select(0); return null; }); await sleep(pg, 300);
  ok((await E(pg, () => !!G.Save.data.manualSeen.vapor)), "abrir una entrada la marca 'vista' (manualSeen)");
  // 5. texto sin solapes en 8 entradas (844x390 lógico 960x540)
  for (const [tab, i] of [[0, 0], [0, 3], [0, 9], [0, 27], [1, 0], [1, 4], [1, 12], [1, 14]]) {
    await E(pg, ([tab, i]) => { G.Manual.setFilter('all'); G.Manual.setQuery(''); G.Manual.setTab(tab); G.Manual.select(i); }, [tab, i]); await sleep(pg, 250);
    const d = await TC.snap(pg, 2), iss = TC.analyze(d, { minSize: 11.5 });
    ok(d.texts.length > 8 && iss.length === 0, `texto del Manual (${tab ? 'fusión' : 'carta'} ${i}): ${d.texts.length} textos, ${iss.length} problemas` + (iss.length ? ' -> ' + iss.slice(0, 3).map(x => x.msg).join(' | ') : ''));
  }
  await done(pg, 'manual-demos');
  // 6. accesos: Ajustes, Menú y Pausa; Reducir destellos
  pg = await mk(b, 'reset=1&manual=all');
  await E(pg, () => { G.Aldea.open(false); G.Aldea.openPanel('menu'); }); await sleep(pg, 300);
  await tap(pg, 480, 422 + 31); await sleep(pg, 200);
  ok(await E(pg, () => G.Panels.current() === 'manual' && G.Manual.isOpen()), 'Menú de la aldea: botón MANUAL');
  await E(pg, () => { G.input.pressed.Escape = true; }); await sleep(pg, 200);
  ok(await E(pg, () => G.Panels.current() === 'menu' && !G.Manual.isOpen()), 'Esc vuelve al Menú');
  await E(pg, () => { G.Panels.open('settings'); }); await sleep(pg, 300);
  await tap(pg, 855, 88); await sleep(pg, 200);
  ok(await E(pg, () => G.Panels.current() === 'manual'), 'Ajustes: botón MANUAL');
  await E(pg, () => { G.input.pressed.Escape = true; }); await sleep(pg, 200);
  ok(await E(pg, () => G.Panels.current() === 'settings'), 'Esc vuelve a Ajustes');
  await E(pg, () => { G.Save.data.settings.cine = { calm: true, textSpeed: 1, soundCaps: true }; G.Panels.open('manual'); }); await sleep(pg, 300);
  ok(await E(pg, () => G.Manual.state().paused), 'Reducir destellos: la demo arranca en pausa');
  await done(pg, 'manual-accesos');
  pg = await mk(b, 'reset=1&direct=1&all=1&god=1');
  await E(pg, () => { G.step(); G.state = 'paused'; G.Hud.pauseOpen(); }); await sleep(pg, 300);
  await tap(pg, 760, 219); await sleep(pg, 250);
  ok(await E(pg, () => G.Manual.isOpen() && G.state === 'paused'), 'Pausa: botón MANUAL abre el Manual sin reanudar la partida');
  const g0 = await E(pg, () => G.time); await E(pg, () => { for (let i = 0; i < 60; i++) G.step(); }); await sleep(pg, 300);
  ok((await E(pg, () => G.time)) === g0, 'con el Manual abierto en pausa el mundo no avanza');
  await E(pg, () => { G.input.pressed.Escape = true; }); await sleep(pg, 200);
  ok(await E(pg, () => !G.Manual.isOpen() && G.state === 'paused'), 'Esc cierra el Manual y sigues en la pausa');
  await done(pg, 'manual-pausa'); await b.close();
}

(async () => {
  const run = { manual, text, seed, cine, cards, armor, armor2, iso, flow, powers, ui, village, touch, boss, balance };
  if (mode === 'all') for (const k of Object.keys(run)) await run[k](); else await run[mode]();
  console.log(`\n${total - fails}/${total} OK`); process.exit(fails ? 1 : 0);
})().catch(e => { console.error(e); process.exit(2); });
