// PRUEBAS de Swarm Hand (games/card-swarm). Uso:
//   python3 tools/serve.py card-swarm 8811 &      (cierra el servidor por PID, nunca pkill -f)
//   node tools/card-swarm-bot/tests.js [all|daily|save2|dev|diag|track|seed|diff|cine|iso|flow|powers|ui|village|touch|boss|balance|armor|text|manual|fte|end|res|wide|vibe] [base=http://localhost:8811]
//   WIDE=0 node tools/card-swarm-bot/tests.js <grupo> ...   corre el grupo con el lienzo clásico de 960 (?wide=0; la pantalla ancha es el valor por defecto desde la fase 4 de la SPEC T-F1-08)
// Chromium de /opt/pw-browsers (sin playwright install). Vista 844x390 táctil. Cada partida debe terminar con 0 errores de consola.
const { launch: pwLaunch } = require('../lib/browser.js');
const { execSync } = require('child_process');
const os = require('os');
const TC = require('./textcheck.js');
const fs = require('fs'), path = require('path');
const mode = process.argv[2] || 'all', base = process.argv[3] || 'http://localhost:8811';
const ROOT = path.join(__dirname, '..', '..');
let fails = 0, total = 0;
const ok = (c, msg) => { total++; if (!c) fails++; console.log((c ? 'OK     ' : 'FALLO  ') + msg); };
const WX = process.env.WIDE ? '&wide=' + process.env.WIDE : '';   // T-F1-08: WIDE=0 / WIDE=1 fuerzan el ancho (sin la variable, el valor por defecto del juego: ancho)
const launch = () => pwLaunch({ args: ['--no-sandbox', '--autoplay-policy=no-user-gesture-required'] });
async function mk(b, url) {
  const ctx = await b.newContext({ viewport: { width: 844, height: 390 }, hasTouch: true, isMobile: true }), pg = await ctx.newPage(); pg.errs = []; pg.ctx = ctx;
  pg.on('console', m => { if (m.type() === 'error') pg.errs.push(m.text()); }); pg.on('pageerror', e => pg.errs.push('PAGEERR ' + e.message));
  await pg.goto(`${base}/index.html?${/(^|&)nodev(&|$)/.test(url) ? '' : 'dev=1&'}nosw=1&${url}${WX}`);   // dev=1: los parámetros de trampa (give, pf, cmul, reset...) solo valen con él (src/dev.js); 'nodev' lo omite await pg.waitForTimeout(600);
  return pg;
}
const done = async (pg, name) => { ok(pg.errs.length === 0, `${name}: 0 errores de consola` + (pg.errs.length ? ' -> ' + pg.errs.slice(0, 3).join(' | ') : '')); await pg.close(); await pg.ctx.close(); };
const E = (pg, fn, arg) => pg.evaluate(fn, arg);
const sleep = (pg, ms) => pg.waitForTimeout(ms);
const key = async (pg, k) => { await sleep(pg, 320); await pg.keyboard.press(k); await sleep(pg, 120); };   // las ventanas ignoran pulsaciones los primeros 200 ms
// coordenadas del juego (960x540) -> punto de la página
// T-F1-08: con la pantalla ancha (G.W > 960) los menús van en la columna de 960 centrada (G.OX); el HUD de combate ('play') usa coordenadas de lienzo
async function gp(pg, x, y) { const r = await E(pg, () => { const b = document.getElementById('game').getBoundingClientRect(); return { l: b.left, t: b.top, w: b.width, h: b.height, W: G.W || 960, ox: G.state === 'play' ? 0 : (G.OX || 0) }; }); return { x: r.l + (x + r.ox) * r.w / r.W, y: r.t + y * r.h / 540 }; }
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
  // stamp.py reescribe sw.js: se ejecuta sobre una copia temporal para no ensuciar el repo
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'cs-stamp-'));
  fs.cpSync(path.join(ROOT, G_DIR), tmp, { recursive: true });
  const out = execSync('python3 tools/card-swarm-pwa/stamp.py ' + JSON.stringify(tmp), { cwd: ROOT }).toString();
  ok(/sw\.js: \d+ archivos/.test(out), 'stamp.py: ' + out.trim());
  const sw2 = fs.readFileSync(path.join(tmp, 'sw.js'), 'utf8');
  fs.rmSync(tmp, { recursive: true, force: true });
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
  const png = await pg.screenshot({ type: 'jpeg', quality: 40 }); fs.writeFileSync(process.env.SHOT_MODAL || path.join(os.tmpdir(), 'swarmhand-modal.jpg'), png);
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
  const g = await E(pg, () => { G.Fusion.layout(); const A = G.anchor(); return { btn: G.Fusion.BTN, auto: G.Fusion.AUTO, hand: [0, 1, 2, 3, 4].map(i => G.Cards.slotRect(i, false)), n: G.Fusion.activeCount(), sys: G.Sys.buttons(), W: G.W, wide: G.hudWide(), A }; });
  const hit = (c, r) => { const px = Math.max(r.x, Math.min(c.x, r.x + r.w)), py = Math.max(r.y, Math.min(c.y, r.y + r.h)); return Math.hypot(c.x - px, c.y - py) < c.r; };
  const sysBtns = g.sys;   // mobile.js: pausa / silencio
  const hud = g.wide ? [{ x: g.A.L, y: g.A.T, w: 240, h: 22 }, { x: g.A.R - 260, y: g.A.T, w: 260, h: 130 }]   // T-F1-08: vida y columna derecha ancladas
    : [{ x: 8, y: 6, w: 240, h: 34 }, { x: 760, y: 6, w: 196, h: 110 }];       // barra de vida y bloque Kills / Ceniza / Partes (derecha arriba)
  ok(g.n === 4 && g.btn.length === 4, '4 slots de poderes y 4 botones');
  ok(g.hand.every(r => r.x + r.w <= g.W / 2), 'la mano de cartas está a la IZQUIERDA (termina en x=' + (g.hand[4].x + g.hand[4].w) + ')');
  ok(g.btn.every(c => c.x - c.r >= g.W / 2), `botones en la mitad derecha (zona del pulgar derecho; el joystick solo nace en x < ${g.W / 2})`);
  ok(g.btn.every(c => c.r >= 38) && g.btn.every((c, i) => g.btn.every((d, j) => i === j || Math.hypot(c.x - d.x, c.y - d.y) > c.r + d.r)), 'radio >= 38 (55 px CSS en 844x390) y botones sin solaparse');
  ok(g.btn.every(c => !g.hand.some(r => hit(c, r)) && !sysBtns.some(r => hit(c, r)) && !hud.some(r => hit(c, r)) && c.x + c.r <= g.W && c.y + c.r <= 540), 'sin solapar mano, pausa / silencio ni HUD');
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
  await pv.goto(`${base}/index.html?dev=1&nosw=1&reset=1&direct=1&all=1`); await sleep(pv, 800);
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
  const g = await E(pg, () => ({ btn: G.Fusion.BTN, auto: G.Fusion.AUTO, hand: [0, 1, 2, 3, 4].map(i => G.Cards.slotRect(i, false)), sys: G.Sys.buttons(), W: G.W }));
  const hit = (c, r) => { const px = Math.max(r.x, Math.min(c.x, r.x + r.w)), py = Math.max(r.y, Math.min(c.y, r.y + r.h)); return Math.hypot(c.x - px, c.y - py) < c.r; };
  const sysBtns = g.sys;   // mobile.js: pausa / silencio (con ?wide=1, arriba a la derecha)
  ok(sysBtns.length === 2 && g.btn.every(c => c.x - c.r >= g.W / 2), `botones en la mitad derecha (el joystick flotante solo nace en x < ${g.W / 2})`);
  ok(g.btn.every(c => !g.hand.some(r => hit(c, r)) && !sysBtns.some(r => hit(c, r)) && c.x + c.r <= g.W && c.y + c.r <= 540), 'sin solapar la mano ni los botones de pausa / silencio de mobile.js');
  // toque en el botón 1 dispara
  await E(pg, () => { G.player.actives[0].cd = 0; }); await spawnAround(pg, 6, 80); await sleep(pg, 1300);
  await tap(pg, g.btn[0].x, g.btn[0].y);
  ok((await E(pg, () => G.player.actives[0].uses)) === 1, 'toque en el botón 1 dispara el poder 1');
  // joystick y botón a la vez (dos dedos)
  const res = await E(pg, async ([c]) => {
    const cv = document.getElementById('game'), r = cv.getBoundingClientRect(), X = x => r.left + x * r.width / G.W, Y = y => r.top + y * r.height / 540;
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
    const cv = document.getElementById('game'), r = cv.getBoundingClientRect(), X = x => r.left + x * r.width / G.W, Y = y => r.top + y * r.height / 540;
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
  await done(pg, 'balance-url');
  await ritmo(b);
  await b.close();
}

// T-F1-03: ritmo de los primeros 30 s. Bot de guion por pasos (G.step), cuenta nueva, Bosque, ALTA, vida repuesta cada tick, nunca usa poderes.
// mov: 'rec' (recolector: se aparta de enemigos a < 70 px, si no va a la gema de XP mas cercana) o 'quieto'. Devuelve metricas por semilla.
async function ritmoRun(b, seed, mov, extra, secs) {
  const pg = await mk(b, `god=0&dbg=1&direct=1&nointro=1&speed=0&biome=bosque&dq=${(extra && /dq=/.test(extra)) ? '' : 'alta'}&seed=${seed}${extra || ''}`);
  const r = await E(pg, ({ mov, secs }) => {
    const out = { offer: -1, maxAlive: 0, kills30: 0, firstHit: -1, lvl: 0, xp: 0, xp2: G.B.xpNeed(2), xn: [G.B.xpNeed(1), G.B.xpNeed(2), G.B.xpNeed(3)], pk1: G.B.player.pickup1, prof: G.D.id };
    let guard = 0, nvT = 0, nvS = 12345, nvD = [0, 0];
    if (mov === 'hab') G.Fusion.auto = true;   // habil: recolector con los poderes en AUTO
    while (G.runT < secs * 1000 && guard++ < 40000) {
      G.player.hp = G.player.maxHp;
      if (G.state === 'cards') {
        if (out.offer < 0 && G.runT > 0) out.offer = G.runT / 1000;
        const C = G.Cards, O = C.off;
        if (O) {
          O.modal = null; let i = O.cards.findIndex(id => id && G.Fusion.optionsFor(C.def(id).tag).length > 0); if (i < 0) i = 0;
          try { C.pick(i); if (C.off && C.off.modal) { const bs = C.off.modal.buttons; (bs[0]).fn(); } } catch (e) { try { C.skip(); } catch (e2) { /* nada */ } }
        }
        if (G.state === 'cards') G.state = 'play';
      }
      let dx = 0, dy = 0;
      if (mov === 'nov') {   // novato: cambia de direccion cada 1,3 s (LCG propio: no toca G.rng), no busca gemas
        if (G.runT >= nvT) { nvT = G.runT + 1300; nvS = (Math.imul(nvS, 1664525) + 1013904223) >>> 0; const an = nvS / 4294967296 * 6.2832; nvD = [Math.cos(an), Math.sin(an)]; }
        dx = nvD[0]; dy = nvD[1];
      }
      if (mov === 'rec' || mov === 'hab') {
        const p = G.player; let near = null, nd = 1e9;
        for (const e of G.enemies) { const d = Math.hypot(e.x - p.x, e.y - p.y) - (e.r || 0); if (d < nd) { nd = d; near = e; } }
        if (near && nd < 70) { dx = p.x - near.x; dy = p.y - near.y; }
        else { let bg = null, bd = 1e9; for (const g of G.gems) { if (g.kind && g.kind !== 'xp' && g.type !== 'xp') continue; const d = Math.hypot(g.x - p.x, g.y - p.y); if (d < bd) { bd = d; bg = g; } } if (bg && bd > 4) { dx = bg.x - p.x; dy = bg.y - p.y; } }
      }
      const l = Math.hypot(dx, dy);
      G.input.joy = l > 0 ? { active: true, id: 1, ox: 100, oy: 400, x: dx / l, y: dy / l } : { active: false, id: 1, ox: 100, oy: 400, x: 0, y: 0 };
      G.step();
      const t = G.runT / 1000;
      if (t >= 10 && t <= 30) out.maxAlive = Math.max(out.maxAlive, G.enemies.length);
      if (t < 30) out.kills30 = G.kills;
      if (out.firstHit < 0) { let d = 0; for (const k in G.dbg.dmg) d += G.dbg.dmg[k]; if (d > 0) out.firstHit = t; }
    }
    out.lvl = G.player.level; out.xp = G.player.xp; out.kills = G.kills;
    return out;
  }, { mov, secs });
  await done(pg, `ritmo ${mov} semilla ${seed}`);
  return r;
}
async function ritmo(b) {
  console.log('--- ritmo (T-F1-03): rebaños de apertura, XP del nivel 2 y radio de recogida del nivel 1');
  const SEEDS = [1, 2, 3, 4, 5, 6, 7, 8], R = [], Q = [];
  for (const s of SEEDS) R.push(await ritmoRun(b, s, 'rec', '', 180));
  for (const s of SEEDS) Q.push(await ritmoRun(b, s, 'quieto', '', 40));
  const f = (a, k) => a.map(x => x[k]);
  const rng = a => Math.min(...a).toFixed(1) + '..' + Math.max(...a).toFixed(1);
  ok(JSON.stringify(R[0].xn) === '[6,39,34]', 'xpNeed(1,2,3) = 6, 39, 34 (' + R[0].xn + ')');
  // Sin C4 (el dueño mantiene el radio de recogida en 60 px): umbrales medidos con C1+C2+C3 solos; la especificacion validaba <= 14 s con C4 (150 px)
  ok(f(R, 'offer').every(v => v > 0 && v <= 20), 'recolector: primera oferta de carta <= 20 s en cada semilla (' + rng(f(R, 'offer')) + ')');
  ok(f(R, 'offer').reduce((a, v) => a + v, 0) / 8 <= 15, 'recolector: primera oferta media <= 15 s (' + (f(R, 'offer').reduce((a, v) => a + v, 0) / 8).toFixed(1) + ')');
  ok(f(R, 'maxAlive').every(v => v >= 15), 'maximo de vivos entre 10 y 30 s >= 15 en cada semilla (' + rng(f(R, 'maxAlive')) + ')');
  ok(f(R, 'kills30').every(v => v >= 42), 'bajas en 0-30 s >= 42 en cada semilla (' + rng(f(R, 'kills30')) + ')');
  ok(f(R, 'lvl').every(v => v === 6), 'nivel 6 a los 180 s en cada semilla (' + rng(f(R, 'lvl')) + ')');
  ok(f(Q, 'firstHit').every(v => v >= 15 && v <= 35), 'jugador quieto: primer golpe entre 15 y 35 s (' + rng(f(Q, 'firstHit')) + ')');
  const N = [], H = [];
  for (const s of SEEDS) N.push(await ritmoRun(b, s, 'nov', '', 90));
  for (const s of SEEDS) H.push(await ritmoRun(b, s, 'hab', '', 40));
  ok(f(N, 'offer').every(v => v > 0 && v <= 28) && f(N, 'offer').reduce((a, v) => a + v, 0) / 8 <= 25, 'novato (direccion al azar cada 1,3 s): primera oferta <= 28 s por semilla y <= 25 s de media (' + rng(f(N, 'offer')) + ')');
  ok(f(H, 'offer').every(v => v > 0 && v <= 20) && f(H, 'maxAlive').every(v => v >= 15), 'habil (recolector + poderes AUTO): primera oferta <= 20 s y vivos max >= 15 (' + rng(f(H, 'offer')) + ' / ' + rng(f(H, 'maxAlive')) + ')');
  ok(R[0].pk1 === 60, 'radio de recogida del nivel 1 = 60 px por defecto (decision del dueño; ?pk1= lo cambia solo con dev=1) (' + R[0].pk1 + ')');
  // perillas: ?open=0&pk1=60&xp2=0 devuelve el arranque anterior
  const O = [];
  for (const s of [1, 2, 3, 4]) O.push(await ritmoRun(b, s, 'rec', '&open=0&pk1=60&xp2=0', 30));
  ok(O.every(x => x.xn[1] === 30) && O.every(x => x.kills30 <= 41), '?open=0&pk1=60&xp2=0: xpNeed(2) = 30 y bajas 0-30 s como antes (' + rng(f(O, 'kills30')) + ')');
  const mean = a => a.reduce((s, v) => s + v, 0) / a.length;
  ok(mean(f(O, 'offer')) >= 13 && mean(f(O, 'offer')) <= 16, 'perillas a la base: primera oferta media entre 13 y 16 s (' + mean(f(O, 'offer')).toFixed(1) + ')');
  // tamaño de los rebaños por perfil de calidad (G.D.n): ALTA 8+10, MEDIA 7+9, BAJA 6+8
  const pq = await mk(b, 'god=1&direct=1&nointro=1&speed=0&biome=bosque&seed=3');
  const sz = await E(pq, () => {
    const res = {};
    for (const q of ['alta', 'media', 'baja']) {
      G.D = G.diffProfile(q);
      const n = k => Math.max(1, Math.round(G.B.open.packs[k][1] * G.D.n));
      res[q] = [n(0), n(1)];
    }
    return res;
  });
  ok(JSON.stringify(sz) === '{"alta":[8,10],"media":[7,9],"baja":[6,8]}', 'tamaño de rebaños por calidad ALTA/MEDIA/BAJA = 8+10 / 7+9 / 6+8 (' + JSON.stringify(sz) + ')');
  await done(pq, 'ritmo-tamanos');
  // los rebaños salen de verdad con BAJA y MEDIA: Corderos que aparecen de golpe a los 5 s (conteo real)
  for (const q of ['media', 'baja']) {
    const pz = await mk(b, `god=1&direct=1&nointro=1&speed=0&biome=bosque&seed=5&dq=${q}`);
    const r = await E(pz, () => {
      let guard = 0, w0 = null, w1 = null, c = 0; const spawned = [];
      const orig = G.Enemies.spawn; G.Enemies.spawn = function (t, x, y) { if (G.runT >= 4900 && G.runT < 5300 && t === 'worm') c++; return orig.apply(this, arguments); };
      G.input.joy = { active: false, id: 1, ox: 100, oy: 400, x: 0, y: 0 };
      while (G.runT < 5400 && guard++ < 2000) { G.step(); if (G.state === 'cards') { try { G.Cards.pick(0); } catch (e) { /* nada */ } if (G.state === 'cards') G.state = 'play'; } }
      return { c, prof: G.D.id };
    });
    const want = q === 'media' ? 7 : 6;
    ok(r.prof === q && r.c >= want && r.c <= want + 3, `?dq=${q}: el rebano de los 5 s escala (${r.c} Corderos en la ventana, perfil ${r.prof}, rebano ${want})`);
    await done(pz, 'ritmo-' + q);
  }
  // cacería: ningun rebano
  const ph = await mk(b, 'god=1&direct=1&nointro=1&speed=0&hunt=pastor&seed=2');
  const hr = await E(ph, () => { let g = 0; G.input.joy = { active: false, id: 1, ox: 100, oy: 400, x: 0, y: 0 }; while (G.runT < 25000 && g++ < 3000) G.step(); return { mode: G.mode, openI: G.Waves.openI }; });
  ok(hr.mode === 'hunt' && hr.openI === 0, 'modo cacería: los rebaños de apertura no se lanzan (modo ' + hr.mode + ', openI ' + hr.openI + ')');
  await done(ph, 'ritmo-caceria');
  console.log('ritmo: primera oferta ' + rng(f(R, 'offer')) + ' (media ' + mean(f(R, 'offer')).toFixed(1) + '), vivos max ' + rng(f(R, 'maxAlive')) + ', bajas 0-30 ' + rng(f(R, 'kills30')) + ', XP 180 s media ' + mean(f(R, 'xp')).toFixed(1) + ', quieto primer golpe ' + rng(f(Q, 'firstHit')) + ' (media ' + mean(f(Q, 'firstHit')).toFixed(1) + ')');
}

async function armor() {
  console.log('--- armadura v8: Carapa, panel, defensa con tope, guardado v10, trofeos gastables, perillas');
  const b = await launch();
  // 1) cuenta vacia: sin Carapa; ?smith=1 la abre y la escena entrega el set Aldeano
  let pg = await mk(b, 'reset=1&nosw=1');
  ok(await E(pg, () => !G.Armor.smithOn() && !G.Save.data.flags.smithMet && G.Save.data.v === 13), 'cuenta nueva: guardado v13 (v10 retención), Carapa aun no ha llegado');
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
  ok(mig.v === 13 && mig.brasas === 777 && mig.thread === 33 && mig.pf === 9 && mig.tr.horn === 2 && mig.te.horn === 2 && mig.ie.carnero === 2 && mig.bak, 'migracion v9->v13 sin perdida + copia .v9: ' + JSON.stringify({ b: mig.brasas, t: mig.thread, pf: mig.pf }));
  ok(mig.owned.join() === 'ald_amulet,ald_boots,ald_chest,ald_helm,car_chest,esq_chest' && mig.eq[1] === 'car_chest' && mig.gift === 1, 'regalo: Aldeano + Peto por jefe vencido (Esquila y Carcelero), mejor equipado: ' + mig.owned.length + ' piezas');
  const imp = await E(pg, () => { const txt = G.Save.exportText(); const r = G.Save.importText(txt); const r2 = G.Save.importText(JSON.stringify({ v: 14, parts: {}, cards: {} })); return [r.ok, r2.ok]; });
  ok(imp[0] === true && imp[1] === false, 'importText acepta la v11 y rechaza versiones mayores');
  await done(pg, 'armor-migra');
  // 3) panel: fabricar, equipar, reforzar con toques en 844x390
  pg = await mk(b, 'reset=1&smith=1&nosw=1&give=thread:80,feather:30,plate:80,wick:60,fang:20,brasas:4000,horn:4,fleece:2,carnero:1,tejedora:1,spine:5');
  await sleep(pg, 400);
  await E(pg, () => { G.Dialog.close(); G.Save.data.bossKills.pastor = 1; G.Save.data.peligro.pastor = 3; G.Save.data.pelWins.pastor = { 1: 1, 2: 1 }; G.Aldea.openPanel('armor'); });
  await sleep(pg, 300);
  const base0 = await E(pg, () => ({ owned: Object.keys(G.Save.data.armor.owned).length, ever: G.Save.data.trophiesEver.horn, def: G.Armor.get().def }));
  ok(base0.owned === 4 && Math.abs(base0.def - 6) < 1e-9, 'set Aldeano regalado y equipado: DEF ' + base0.def);
  // T-F1-08: la Herrería va con letra 17; EQUIPO / FABRICAR en dos vistas (LISTA y DETALLE de la pieza tocada). Toques por G.Smith.rects()
  const SR = async (k, i) => E(pg, ([k, i]) => { const r = G.Smith.rects()[k]; return typeof r === 'function' ? r(i) : r; }, [k, i]);
  const tapR = async (k, i) => { const r = await SR(k, i); await tap(pg, r.x + r.w / 2, r.y + r.h / 2); };
  await tapR('tab', 1);                        // pestana FABRICAR
  await tapR('tile', 0);                       // slot Yelmo
  await tapR('row', 1); await sleep(pg, 100);  // fila Esquila (2.a) -> seleccion y detalle
  const sel = await E(pg, () => [G.Smith.ui.sel, G.Smith.ui.det]); ok(sel[0] === 1 && sel[1], 'toque en fila selecciona la pieza y abre su detalle (sel=' + sel + ')');
  await tapR('b1');                            // FABRICAR
  const cr = await E(pg, () => ({ own: G.Armor.owned('esq_helm'), tr: G.Save.data.trophies.horn, ever: G.Save.data.trophiesEver.horn, brasas: G.Save.data.brasas, plate: G.Save.data.parts.plate }));
  ok(cr.own && cr.tr === 3 && cr.ever === 4, 'fabricar Yelmo de cuernos gasta 1 trofeo (saldo 3) y trophiesEver sigue en 4');
  ok(cr.brasas === 4000 - 98 && cr.plate === 80 - 6, 'coste del Yelmo T1 (peso 0,7): 98 Brasas y 6 Placa (' + (4000 - cr.brasas) + ' / ' + (80 - cr.plate) + ')');
  await tapR('tab', 0);                        // pestana EQUIPO (vuelve a la lista)
  ok(await E(pg, () => G.Smith.ui.tab === 0 && !G.Smith.ui.det), 'cambiar de pestaña vuelve a la vista LISTA');
  await tapR('tile', 0);
  await tapR('row', 1); await tapR('b1');      // tocar la fila abre el detalle; EQUIPAR la equipa
  ok(await E(pg, () => G.Save.data.armor.equipped[0]) === 'esq_helm', 'fila + EQUIPAR en el detalle equipa la pieza');
  await tapR('b2');                            // REFORZAR +1
  ok(await E(pg, () => G.Armor.ref('esq_helm')) === 1, 'refuerzo +1 (parte, Brasas y trofeo gastados)');
  await E(pg, () => { G.Save.data.nodes.R2 = { c: '1' }; });
  await tapR('b2');
  ok(await E(pg, () => G.Armor.ref('esq_helm')) === 2, 'refuerzo +2 con Rango de forja II y Peligro II vencido');
  const r3 = await E(pg, () => G.Armor.refReq(G.ArmorData.piece('esq_helm'), 3));
  ok(/Rango de forja III/.test(r3), 'refuerzo +3 bloqueado: ' + r3);
  const ruta = await E(pg, () => { const n = G.Tree.NODES.filter(x => x.id === 'RT1')[0]; return [G.Tree.trophiesHave({ trophies: ['horn', 'staff'] }), G.Save.data.trophiesEver.horn]; });
  ok(ruta[0] === 1 && ruta[1] === 4, 'Ruta / logros leen trophiesEver (no se gasta)');
  await tapR('back'); ok(await E(pg, () => !G.Smith.ui.det), 'VOLVER: del detalle a la lista');
  for (let t = 2; t <= 3; t++) { await tapR('tab', t); await sleep(pg, 120); }
  await tapR('tab', 3); await sleep(pg, 100);
  const ped = await E(pg, () => ({ tab: G.Smith.ui.tab, rdy: G.Armor.PED.filter(G.Armor.pedReady).map(d => d.id) }));
  ok(ped.tab === 3 && ped.rdy.includes('p1'), 'pestana PEDIDOS y pedido "Tomar medidas" listo: ' + ped.rdy);
  await tapR('ped', 0); const claim = await E(pg, () => G.Save.data.armor.ped.p1); ok(claim === 1, 'cobrar un pedido');
  await tapR('pnext'); ok(await E(pg, () => G.Smith.ui.pp === 1), 'PEDIDOS: 2.ª página (5 por página)');
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
  ok(m11.v === 13 && m11.bak && m11.brasas === 555 && m11.tr === 1, 'migracion v10->v11 sin perdida + copia .v10');
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
  const SR2 = async (k, i) => E(pg, ([k, i]) => { const r = G.Smith.rects()[k]; return typeof r === 'function' ? r(i) : r; }, [k, i]);
  const tapR2 = async (k, i) => { const r = await SR2(k, i); await tap(pg, r.x + r.w / 2, r.y + r.h / 2); };
  await tapR2('dn'); const sc = await E(pg, () => G.Smith.ui.scroll); ok(sc === 1, 'boton de scroll de la lista (' + sc + ')');
  await E(pg, () => { G.Smith.setTab(2); }); await sleep(pg, 150);
  await tapR2('tn', 2); await tapR2('tryR', 0);   // +2 y PROBAR del 1.er set (Aldeano)
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
// T-F0-05 parte 1: la simulacion con semilla es reproducible. El jugador SE MUEVE (guion por tick; quieto no se ven las fugas de azar de los efectos),
// se compara un hash EXACTO en varios puntos de control entre dos corridas con distinto tamano de bloque (600 y 23 ticks) y fotogramas dibujados entre medias.
// Los ticks se cuentan como round(G.time / G.STEP) desde el inicio de la expedicion. G.rngLeaks (guardia de ?seed + ?dev=1) debe quedar a 0.
const SEED_CP = [600, 900, 1800, 3600, 5400, 7200, 10800, 12600, 14400, 18000, 21600, 25200];
const SEED_BASE = 'reset=1&god=1&direct=1&all=1&noanchor=1&speed=0&hand=spark:3,ember:3,dart:3,shard:2,ring:1';
const SEED_BOSS = id => `reset=1&god=1&direct=1&all=1&noanchor=1&nointro=1&cine=0&speed=0&peligro=3&hand=spark:3,ember:3,dart:3,shard:2,ring:1&boss=${id}`;
const SEED_UTILS = () => {   // utilidades de la prueba de semilla dentro de la pagina: __tick(), __adv(n) avanza n ticks con el guion de movimiento y devuelve el hash
    window.__t0 = Math.round(G.time / G.STEP);   // las peleas de jefe empiezan con G.time > 0: se cuenta desde el inicio de la prueba
    window.__tick = () => Math.round(G.time / G.STEP) - __t0;
    window.__adv = (n) => {
      const C = G.Cards, dirs = [[1, 0], [1, 1], [0, 1], [-1, 1], [-1, 0], [-1, -1], [0, -1], [1, -1], [0, 0]];
      for (let i = 0, g = 0; i < n && g < n * 4; g++) {
        if (G.state === 'cards') { const O = C.off; if (O) { O.modal = null; if (O.mode === 'level') C.skip(); else C.pick(0); } if (G.state === 'cards') G.state = 'play'; }
        const t = __tick(), blk = Math.floor(t / 45);
        const d = t < 300 ? dirs[8] : dirs[(Math.imul(blk + 1, 2654435761) >>> 0) % 9], l = Math.hypot(d[0], d[1]) || 1;
        G.input.joy = { active: d[0] !== 0 || d[1] !== 0, id: 1, ox: 100, oy: 400, x: d[0] / l, y: d[1] / l };
        const before = G.time; G.step(); if (G.time !== before) i++;
      }
      G.input.joy = { active: false, id: null, ox: 0, oy: 0, x: 0, y: 0 };
      const r = n => Math.round(n * 1000); let h = 2166136261 >>> 0; const mix = v => { const s = String(v); for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619) >>> 0; } };
      mix(G.time); mix(G.runT); mix(G.kills); mix(r(G.player.x)); mix(r(G.player.y)); mix(r(G.player.hp)); mix(G.player.lvl || G.player.level); mix(G.player.xp); mix(G.player.ash);
      G.enemies.forEach(e => { mix(e.type); mix(r(e.x)); mix(r(e.y)); mix(r(e.hp)); });
      G.gems.forEach(g => { mix(g.kind || g.type); mix(r(g.x)); mix(r(g.y)); });
      mix(G.projectiles.length); mix(G.zones ? G.zones.length : 0);
      mix(G.D.id); mix(G.D.n); mix(G.D.ashAcc); mix(G.D.questAcc);   // T-F0-05: el perfil de dificultad forma parte del estado
      return { hash: h, kills: G.kills, en: G.enemies.length, tick: __tick() };
    };
  };
async function seedRun(b, url, cps, block, wait) {
  const pg = await mk(b, url), hs = [];
  await E(pg, SEED_UTILS);
  for (const cp of cps) {
    let r = null;
    for (let guard = 0; guard < 100000; guard++) {
      const t = await E(pg, () => __tick()); if (t >= cp) break;
      r = await E(pg, n => __adv(n), Math.min(block, cp - t)); await sleep(pg, wait);
    }
    hs.push(r ? r.hash : -1);
    if (r) hs.info = r;
  }
  const leaks = await E(pg, () => ({ n: G.rngLeaks, st: G.rngLeakStack, g: G.rngGuard }));
  const st = await E(pg, () => G.state);
  await done(pg, 'seed-corrida'); return { hs, leaks, kills: hs.info && hs.info.kills, state: st };
}
async function seed() {
  console.log('--- RNG con semilla: sin ?seed es Math.random; con ?seed misma partida (hash exacto, con movimiento)');
  const b = await launch(); const U = 'reset=1&god=1&direct=1&all=1&noanchor=1&speed=0&hand=spark:1';
  let pg = await mk(b, U);
  ok(await E(pg, () => G.rng === Math.random && G.seed === null && !G.rngGuard), 'sin ?seed: G.rng ES Math.random (comportamiento identico al de siempre) y sin guardia');
  await done(pg, 'seed-off');
  pg = await mk(b, 'reset=1&seed=7&speed=0');
  const seq = await E(pg, () => { const a = []; G.rngSeed(5); for (let i = 0; i < 3; i++) a.push(G.rng()); G.rngSeed(5); return a.concat([G.rng()]); });
  ok(seq[0] === seq[3] && seq[0] !== seq[1] && seq.every(v => v >= 0 && v < 1), 'rngSeed(n) reinicia la secuencia mulberry32 ([0,1))');
  ok(await E(pg, () => G.rngGuard === true && typeof G.rng === 'function' && G.rng !== Math.random), 'con ?seed y ?dev=1: guardia activa');
  // guardia: G.rng dentro de G.fx o de draw se cuenta
  const gd = await E(pg, () => { G.rngLeaks = 0; G.rngLeakStack = null; G.fx.puff(10, 10, 3); const a = G.rngLeaks; G._inDraw = true; G.rng(); G._inDraw = false; const c = G.rngLeaks; G.rng(); const d = G.rngLeaks; G.rngLeaks = 0; G.rngLeakStack = null; return [a, c, d]; });
  ok(gd[0] === 0 && gd[1] === 1 && gd[2] === 1, 'guardia: fx.puff no consume G.rng; G.rng en draw se cuenta; fuera de draw/fx no (' + gd + ')');
  await done(pg, 'seed-api');
  const fxSrc = fs.readFileSync(path.join(ROOT, 'games/card-swarm/src/fx.js'), 'utf8');
  ok(!/G\.rnd\(/.test(fxSrc) && !/G\.rng\(/.test(fxSrc), 'src/fx.js no usa G.rnd( ni G.rng( (solo G.rndFx / Math.random)');
  const SC = [];   // [nombre, url sin calidad, [puntos de control]]
  for (const q of ['alta', 'baja']) SC.push([`bosque ${q}`, `${SEED_BASE}&seed=1234&q=${q}`, SEED_CP]);
  SC.push(['bosque media', `${SEED_BASE}&seed=1234&q=media`, [600, 1800, 3600]]);
  for (const bi of ['cripta', 'asfodelo', 'tundra', 'panal', 'crater']) SC.push([bi, `${SEED_BASE}&seed=1234&q=alta&biome=${bi}&nobos=1`, [600, 1800, 3000]]);
  for (const id of ['pastor', 'karceron', 'letea', 'yarlak', 'melaria', 'cenizar']) SC.push([`jefe ${id}`, `${SEED_BOSS(id)}&seed=77&q=alta`, id === 'karceron' ? [600, 3000, 6000] : [600, 1800, 3000]]);
  SC.push(['jefe karceron baja', `${SEED_BOSS('karceron')}&seed=77&q=baja`, [3000, 6000]]);
  let ticks = 0, leaks = 0, h1 = null;
  for (const [name, url, cps] of SC) {
    const A = await seedRun(b, url, cps, 600, 10), B = await seedRun(b, url, cps, 23, 6);
    const same = A.hs.length === B.hs.length && A.hs.every((h, i) => h === B.hs[i]) && A.hs.every(h => h !== -1);
    ticks += cps[cps.length - 1] * 2; leaks += A.leaks.n + B.leaks.n;
    ok(same, `${name}: hash identico en ${cps.length} puntos de control hasta el tick ${cps[cps.length - 1]} (bloques de 600 y de 23; ${A.kills} bajas)` + (same ? '' : ' -> ' + A.hs.join(',') + ' / ' + B.hs.join(',')));
    ok(A.leaks.n + B.leaks.n === 0 && A.leaks.g, `${name}: G.rngLeaks === 0` + (A.leaks.st || B.leaks.st ? ' ' + (A.leaks.st || B.leaks.st) : ''));
    if (name === 'bosque alta') h1 = A.hs;
  }
  console.log(`       ${SC.length} escenarios, ${ticks} ticks simulados en total (2 corridas cada uno)`);
  const C = await seedRun(b, `${SEED_BASE}&seed=99&q=alta`, [600, 1800, 3600], 600, 10);
  ok(h1 && C.hs[1] !== h1[2], 'otra semilla (99) => otra partida');
  await b.close();
}

// ---------------------------------------------------------------- T-F0-05 parte 2: perfil de dificultad por calidad (G.D)
async function diff() {
  console.log('--- perfil de dificultad por calidad: fijado al empezar, multiplicadores, recompensa, tope, ALTA identica a antes');
  const b = await launch(); const U = 'reset=1&god=1&direct=1&all=1&noanchor=1&nointro=1&speed=0&hand=spark:1';
  let pg = await mk(b, U + '&q=baja');
  // 1. el perfil se fija en startGame y no cambia con la calidad adaptativa; la siguiente expedicion usa el nuevo
  const p1 = await E(pg, () => {
    const a = { id: G.D.id, q: G.Q.level, n: G.D.n };
    G.Sys.setQuality('alta', true); const b1 = { id: G.D.id, q: G.Q.level };
    G.state = 'play'; G.startGame(); const c = { id: G.D.id, q: G.Q.level, n: G.D.n };
    return { a, b1, c, noRule: G.Q.enemyMul === undefined && G.Q.projCap === undefined, pc: G.B.projCap, tabla: JSON.stringify(G.B.diff) };
  });
  ok(p1.a.id === 'baja' && p1.a.n === 0.75, 'q=baja: el perfil de la expedicion es BAJA (n 0,75)');
  ok(p1.b1.id === 'baja' && p1.b1.q === 'alta', 'cambiar la calidad a mitad de la expedicion cambia los graficos pero NO el perfil');
  ok(p1.c.id === 'alta' && p1.c.n === 1, 'la siguiente expedicion (startGame) toma el perfil de la calidad vigente');
  ok(p1.noRule && p1.pc === 400, 'la calidad grafica ya no lleva reglas (sin enemyMul ni projCap en G.Q; G.B.projCap = 400 comun)');
  const T = JSON.parse(p1.tabla);
  ok(T.alta.n === 1 && T.alta.h === 1 && T.alta.d === 1 && T.alta.s === 1 && T.alta.x === 1 && T.media.n === 0.9 && T.media.h === 1.083 && T.media.d === 1.05 && T.media.s === 1.03 && T.media.x === 1.08 && T.baja.n === 0.75 && T.baja.h === 1.25 && T.baja.d === 1.1 && T.baja.s === 1.08 && T.baja.x === 1.22, 'tabla G.B.diff con los valores de partida de la especificacion (4.4)');
  // 2. perillas ?dq ?dn ... (con dev=1): ?dq fuerza el perfil sin tocar los graficos; ?dh pisa un valor
  await done(pg, 'diff-perfil');
  pg = await mk(b, U + '&q=alta&dq=media&dh=1.5');
  const p2 = await E(pg, () => ({ id: G.D.id, q: G.Q.level, h: G.D.h, n: G.D.n }));
  ok(p2.id === 'media' && p2.q === 'alta' && p2.h === 1.5 && p2.n === 0.9, '?dq=media fuerza el perfil sin cambiar los graficos; ?dh pisa la vida (' + JSON.stringify(p2) + ')');
  await done(pg, 'diff-perillas');
  pg = await mk(b, 'nodev&reset=1&direct=1&speed=0&god=1&q=alta&dq=baja&dn=0.1');
  ok(await E(pg, () => G.D.id === 'alta' && G.D.n === 1), 'sin dev=1 las perillas ?dq/?dn se ignoran');
  await done(pg, 'diff-nodev');
  // 3. multiplicadores: un normal los lleva; minijefe, jefe e invocado no
  pg = await mk(b, U + '&q=baja');
  const v = await E(pg, () => {
    const E = G.Enemies, out = {}, one = (prof, type, o) => { G.D = G.diffProfile(prof); const e = E.spawn(type, 400, 400, o); return { hp: e.maxHp, dmg: e.dmg, sb: e.spdBase, rew: e.dRew, sp: e.dSpd }; };
    ['worm', 'boar'].forEach(t => { out[t] = { a: one('alta', t), b: one('baja', t), m: one('media', t) }; });
    out.mini = { a: one('alta', 'mini_bulwark'), b: one('baja', 'mini_bulwark') };
    out.sum = { a: one('alta', 'worm', { summoned: true }), b: one('baja', 'worm', { summoned: true }) };
    out.esc = { a: one('alta', 'worm', { noprof: true }), b: one('baja', 'worm', { noprof: true }) };
    out.boss = { a: one('alta', 'boss', { hp: 1000 }), b: one('baja', 'boss', { hp: 1000 }) };
    G.mode = 'hunt'; out.hunt = { a: one('alta', 'worm'), b: one('baja', 'worm') }; G.mode = 'run'; G.enemies.length = 0;
    return out;
  });
  const near = (a, b) => Math.abs(a - b) < 1e-9;
  for (const t of ['worm', 'boar']) {
    ok(near(v[t].b.hp / v[t].a.hp, 1.25) && near(v[t].b.dmg / v[t].a.dmg, 1.1) && near(v[t].b.rew, 1.22) && near(v[t].b.sp, 1.08) && v[t].a.rew === 1 && near(v[t].b.sb, v[t].a.sb), `${t} normal en BAJA: vida x1,25, dano x1,10, recompensa 1,22, velocidad 1,08 (en dSpd, spdBase intacta); ALTA x1`);
    ok(near(v[t].m.hp / v[t].a.hp, 1.083) && near(v[t].m.dmg / v[t].a.dmg, 1.05) && near(v[t].m.rew, 1.08), `${t} normal en MEDIA: vida x1,083, dano x1,05, recompensa 1,08`);
  }
  const same = k => v[k].a.hp === v[k].b.hp && v[k].a.dmg === v[k].b.dmg && v[k].b.rew === undefined && v[k].b.sp === undefined;
  ok(same('mini') && same('sum') && same('esc') && same('boss') && same('hunt'), 'minijefe, jefe, invocados, escolta de minijefe y cacerias: sin perfil (' + ['mini', 'sum', 'esc', 'boss', 'hunt'].map(k => k + ':' + same(k)).join(' ') + ')');
  // velocidad: el desplazamiento se escala en update junto a speedMul, la telegrafia no
  const sp = await E(pg, () => { const r = {}; ['alta', 'baja'].forEach(pf => { G.D = G.diffProfile(pf); G.enemies.length = 0; const e = G.Enemies.spawn('worm', G.player.x + 300, G.player.y, {}); e.spawnT = 0; G.Enemies.update(16); r[pf] = e.spd; }); return r; });
  ok(near(sp.baja / sp.alta, 1.08), 'velocidad de desplazamiento de un normal en BAJA = x1,08 (' + (sp.baja / sp.alta).toFixed(4) + ')');
  // 4. recompensa por baja: XP y Ceniza de 100 bajas
  const rw = await E(pg, () => {
    const tot = {};
    ['alta', 'baja'].forEach(pf => {
      G.D = G.diffProfile(pf); let xp = 0, ash = 0, hearts = 0;
      for (let i = 0; i < 100; i++) {
        G.enemies.length = 0; G.gems.length = 0;
        const e = G.Enemies.spawn('boar', 400, 400); e.spawnT = 0; G.Combat.onKill(e, 'neutral');
        G.gems.forEach(g => { if (g.kind === 'xp') xp += g.v; else if (g.kind === 'ash') ash += Math.round(g.v); else hearts++; });
      }
      tot[pf] = { xp, ash, hearts };
    });
    return tot;
  });
  ok(near(rw.baja.xp / rw.alta.xp, 1.22), 'XP por gemas de 100 bajas: BAJA = ALTA x1,22 (' + rw.alta.xp + ' -> ' + rw.baja.xp + ')');
  ok(Math.abs(rw.baja.ash - rw.alta.ash * 1.22) <= 1.5, 'Ceniza de 100 bajas: BAJA = ALTA x1,22 con el resto fraccionario acumulado (' + rw.alta.ash + ' -> ' + rw.baja.ash + ')');
  await done(pg, 'diff-valores');
  // 5. presupuesto y tope: BAJA = ALTA x n
  pg = await mk(b, U + '&q=alta&seed=5&len=9');
  const cp = await E(pg, () => {
    const W = G.Waves, B = G.B, r = {};
    ['alta', 'baja'].forEach(pf => {
      G.D = G.diffProfile(pf); G.enemies.length = 0; W.budget = 0; W.t = 1499; G.runT = G.time = 120000; W.starT = 99999; W.openI = 99;   // T-F1-03: sin rebaños de apertura (el salto de reloj los lanzaria y contarian como gasto)
      const before = G.enemies.length; G.step(); const spent = G.enemies.reduce((s, e) => s + B.enemy[e.type].cost, 0);
      r[pf] = { budget: W.budget + spent, n: G.enemies.length - before };
      // tope: 70 perros vivos; ALTA (tope 80 a los 5 min) aun deja entrar, BAJA (60) no
      G.enemies.length = 0; for (let i = 0; i < 70; i++) G.Enemies.spawn('dog', 300 + i, 300, { noprof: true });
      W.budget = 50; W.t = 1499; G.runT = G.time = 300000; const n0 = G.enemies.length; G.step(); r[pf].cap = G.enemies.length - n0;
    });
    return r;
  });
  ok(Math.abs(cp.baja.budget / cp.alta.budget - 0.75) < 0.02, 'presupuesto por pulso (min 2): BAJA = ALTA x 0,75 (' + cp.alta.budget.toFixed(2) + ' -> ' + cp.baja.budget.toFixed(2) + ')');
  ok(cp.alta.cap > 0 && cp.baja.cap === 0, 'tope de enemigos en el min 5: con 70 vivos ALTA (80) aun genera (' + cp.alta.cap + ') y BAJA (60) no (' + cp.baja.cap + ')');
  await done(pg, 'diff-presupuesto');
  // 6. ALTA identica a antes: hash de la simulacion con semilla igual al medido en el commit anterior a la parte 2 (sin G.D en el hash)
  // regenerado en T-F1-03: los rebaños de apertura (5 s y 19 s) consumen G.rng y suman 18 Corderos; con ?open=0&pk1=60&xp2=0 sale el valor anterior (3569930420,1065409925,1194979460)
  for (const [GOLD, X, LAB] of [[[114209734, 4015489566, 1778485474], '', ''], [[3569930420, 1065409925, 1194979460], '&open=0&pk1=60&xp2=0', ' con ?open=0&pk1=60&xp2=0 (arranque anterior a T-F1-03)']]) {
    pg = await mk(b, `${SEED_BASE}&seed=1234&q=alta${X}`);
    await E(pg, () => {
      window.__t0 = Math.round(G.time / G.STEP); window.__tick = () => Math.round(G.time / G.STEP) - __t0;
      window.__adv = (n) => {
        const C = G.Cards, dirs = [[1, 0], [1, 1], [0, 1], [-1, 1], [-1, 0], [-1, -1], [0, -1], [1, -1], [0, 0]];
        for (let i = 0, g = 0; i < n && g < n * 4; g++) {
          if (G.state === 'cards') { const O = C.off; if (O) { O.modal = null; if (O.mode === 'level') C.skip(); else C.pick(0); } if (G.state === 'cards') G.state = 'play'; }
          const t = __tick(), blk = Math.floor(t / 45);
          const d = t < 300 ? dirs[8] : dirs[(Math.imul(blk + 1, 2654435761) >>> 0) % 9], l = Math.hypot(d[0], d[1]) || 1;
          G.input.joy = { active: d[0] !== 0 || d[1] !== 0, id: 1, ox: 100, oy: 400, x: d[0] / l, y: d[1] / l };
          const before = G.time; G.step(); if (G.time !== before) i++;
        }
        const r = n => Math.round(n * 1000); let h = 2166136261 >>> 0; const mix = v => { const s = String(v); for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619) >>> 0; } };
        mix(G.time); mix(G.runT); mix(G.kills); mix(r(G.player.x)); mix(r(G.player.y)); mix(r(G.player.hp)); mix(G.player.lvl || G.player.level); mix(G.player.xp); mix(G.player.ash);
        G.enemies.forEach(e => { mix(e.type); mix(r(e.x)); mix(r(e.y)); mix(r(e.hp)); });
        G.gems.forEach(g => { mix(g.kind || g.type); mix(r(g.x)); mix(r(g.y)); });
        mix(G.projectiles.length); mix(G.zones ? G.zones.length : 0);
        return h;
      };
    });
    const gh = [];
    for (const cpt of [600, 1800, 3600]) { const t = await E(pg, () => __tick()); gh.push(await E(pg, n => __adv(n), cpt - t)); }
    ok(gh.every((h, i) => h === GOLD[i]), 'ALTA con semilla 1234: mismo hash que antes de la parte 2' + LAB + ' (' + gh.join(',') + ')');
    await done(pg, 'diff-alta-igual' + X);
  }
  await b.close();
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
  ok(await E(pg, () => (G.state === 'play' || G.state === 'cards') && !G.Cine.active() && G.Save.data.cine.introSeen === true && G.Save.data.flags.fte.step === 'run1'), 'al terminar sale directo a la 1.ª expedición (T-F1-02; sin aviso por ser bot) y marca introSeen');
  ok(await E(pg, () => G.player && G.Save.data.cine.introSeen), 'guardado coherente');
  // repeticion: saltable y sin escribir en el guardado
  await E(pg, () => { G.Save.data.cine.introSeen = true; G.Save.data.cine.creditsSeen = false; G.Cine.playIntro({ replay: true }); });
  ok(await E(pg, () => G.Cine.info().locked === false), 'repeticion: saltable (boton SALTAR)');
  await stepN(pg, 30);
  const sk = await E(pg, () => { const r = G.Cine.skipRect(); G.input.mouse.x = r.x + 5 + (G.OX || 0); G.input.mouse.y = r.y + 5; G.input.pressed.Mouse0 = true; G.input.lock = 0; G.step(); return { st: G.state, act: G.Cine.active(), cs: G.Save.data.cine.creditsSeen }; });
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
  ok(mig.false.v === 13 && mig.false.intro === false && mig.false.backup, 'migracion v11->v12 (cuenta sin progreso): intro NO vista, copia swarmhand.fusion.save.v11');
  ok(mig.true.v === 13 && mig.true.intro === true && mig.true.entry.pastor === 1 && mig.true.runs === 4 && mig.true.bk.pastor === 1, 'migracion v11->v12 (con progreso): introSeen=true, entrySeen desde bossSeen, sin perdidas');
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
  ok(await E(pg, () => typeof Assets.cine3 === 'object' && typeof Assets.cine3.epilogue === 'function' && typeof G.Snd.cine3 === 'function'), 'Assets.cine3 es el arte (assets_cine3.js) y G.Snd.cine3 el audio, sin pisarse');
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
  const gal2 = await E(pg, () => { G.Save.data.cine.introSeen = true; G.Save.data.cine.entrySeen.pastor = 1; G.Cine.playEntry('pastor', {}); const i0 = G.Cine.info(); for (let i = 0; i < 40; i++) G.step(); const r = G.Cine.info().locked; const rc = G.Cine.skipRect(); G.input.mouse.x = rc.x + 5 + (G.OX || 0); G.input.mouse.y = rc.y + 5; G.input.pressed.Mouse0 = true; G.input.lock = 0; G.step(); return { locked: r, active: G.Cine.active(), st: G.state, es: JSON.stringify(G.Save.data.cine.entrySeen) }; });
  ok(!gal2.locked && !gal2.active && gal2.st === 'aldea', 'galeria: saltable con el boton SALTAR y vuelve a la aldea');
  ok(gal.same, 'galeria: no escribe en el guardado');
  const ui = await E(pg, () => { G.Aldea.open(false); G.Panels.open && G.Panels.open('menu'); return typeof G.Panels.current === 'function'; });
  await done(pg, 'galeria');
}



// Pistas de teclado que no deben verse en pantallas táctiles (T-F0-06)
const KBD_RE = /^[BDR]\s{2}-\s{2}|\b(Tab|Enter|Esc|Espacio|Flechas|WASD|Q\s?\/\s?E|Q E R|Mayús|Shift)\b|\[[A-Z0-9-]{1,5}\]|\bR \/ Enter|\b(clic|click)\b/i;
const kbdHints = d => d.texts.map(t => t.s).filter(s => KBD_RE.test(s));
const kbdOnly = async (pg, name) => { const kb = kbdHints(await TC.snap(pg, 2)); ok(kb.length === 0, `${name}: sin pistas de teclado en táctil` + (kb.length ? ' -> ' + kb.slice(0, 3).join(' | ') : '')); };

// T-F1-08: páginas de los paneles que se rehicieron después de la fase 3 (antes con 15 / 12): todas a 17 lógicos y botones de 66
const DENSE = {
  vesper: ['G.Panels.vesperTab(0); G.Panels.vesperPage(0)', 'G.Panels.vesperTab(0); G.Panels.vesperPage(1)', 'G.Panels.vesperTab(1); G.Panels.huntPage(0)', 'G.Panels.vesperTab(1); G.Panels.huntPage(1)', 'G.Panels.vesperTab(1); G.Panels.huntPage(2)'],
  rufo: ['G.Panels.rufoTab(0)', 'G.Panels.rufoTab(1)', 'G.Panels.rufoTab(2)'],
  cook: ['G.Panels.cookPage(0, 0)', 'G.Panels.cookPage(0, 1)', 'G.Panels.cookPage(0, 2)', 'G.Panels.cookPage(1, 0)'],
  logros: [null, 'G.Panels.logrosScroll(5)', 'G.Panels.logrosScroll(30)'],
  armor: ['G.Smith.setTab(0)', 'G.Smith.setTab(1)', 'G.Smith.setTab(1); G.Smith.ui.slot = 0; G.Smith.ui.sel = 1; G.Smith.ui.det = true', 'G.Smith.setTab(0); G.Smith.ui.slot = 1; G.Smith.ui.det = true', 'G.Smith.setTab(2)', 'G.Smith.setTab(2); G.Smith.ui.scroll = 6', 'G.Smith.setTab(3)', 'G.Smith.setTab(3); G.Smith.ui.pp = 1',
    // F2: detalle de talismán con "Trofeo de guardián: ..." (el nombre más largo) y Rescoldo (5 filas "Trofeo de guardián del bioma")
    ...['mn_tundra', 'bra_talis'].map(id => `G.Smith.setTab(1); G.Smith.ui.slot = 3; G.Smith.ui.sel = G.ArmorData.ofSlot(3).sort((a, b) => G.ArmorData.SETS[a.set].tier - G.ArmorData.SETS[b.set].tier).findIndex(p => p.id === '${id}'); G.Smith.ui.det = true`)],
  manual: ['G.Manual.setTab(0); G.Manual.select(9); G.Manual.setView(0)', 'G.Manual.setTab(0); G.Manual.select(9); G.Manual.setView(1)', 'G.Manual.setTab(1); G.Manual.select(12); G.Manual.setView(0)', 'G.Manual.setTab(1); G.Manual.select(12); G.Manual.setView(1)']
};
// Legibilidad de esos paneles a 844x390 y 740x360: letra >= 11 px reales, sin solapes ni desbordes, botones de 66 lógicos (>= 44 px reales) y 0 errores.
// Con SHOT_PANELS=<carpeta> guarda una captura de cada página (antes / después del rehacer).
async function denseLegibility(b) {
  const dir = process.env.SHOT_PANELS; if (dir) fs.mkdirSync(dir, { recursive: true });
  for (const [w, h] of [[844, 390], [740, 360]]) {
    const pg = await mkV(b, 'reset=1&all=1&speed=0&smith=1&manual=all&give=all:40,brasas:900&pf=5', w, h);
    await E(pg, () => { G.Dialog.close(); const S = G.Save.data; S.bossKills = { pastor: 1, karceron: 1, letea: 1, yarlak: 1, melaria: 1, cenizar: 1 }; S.flags.smithMet = 1; ['first', 'win', 'pastor', 'insig3'].forEach(a => { S.ach[a] = 1; }); G.Quests.accept(G.Quests.board()[0].id); });
    let bad = [], n = 0, small = [], kmin = 99;
    for (const pn of Object.keys(DENSE)) for (const x of DENSE[pn]) {
      await E(pg, ([n, x]) => { G.Aldea.open(false); G.Aldea.openPanel(n); if (x) new Function(x)(); }, [pn, x]); await sleep(pg, 150);
      const d = await TC.snap(pg, 2), iss = TC.analyze(d, { minSize: TC.MIN_MENU, minReal: 11 }); n++; kmin = Math.min(kmin, d.k || 1);
      iss.forEach(i => bad.push(pn + ': ' + i.msg));
      d.boxes.filter(bx => bx.k === 'button' && (bx.y1 - bx.y0 < 65.5 || bx.x1 - bx.x0 < 65.5)).forEach(bx => small.push(pn + ' "' + bx.label + '" ' + Math.round(bx.x1 - bx.x0) + 'x' + Math.round(bx.y1 - bx.y0)));
      if (dir) await pg.screenshot({ path: path.join(dir, `${w}x${h}_${pn}_${n}.jpg`), type: 'jpeg', quality: 55 });
    }
    ok(bad.length === 0, `legibilidad ${w}x${h}: ${n} páginas de Vesper, Rufo, Cocina, Logros, Herrería y Manual sin textos < 11 px reales (k ${kmin.toFixed(3)}), solapes ni desbordes` + (bad.length ? ' -> ' + bad.slice(0, 4).join(' | ') : ''));
    ok(small.length === 0, `botones ${w}x${h}: todos de 66 lógicos o más (${Math.round(66 * kmin)} px reales)` + (small.length ? ' -> ' + [...new Set(small)].slice(0, 4).join(' | ') : ''));
    await done(pg, 'legibilidad-' + w + 'x' + h);
  }
}

// ---------------------------------------------------------------- Texto: pantallas de victoria de los 6 jefes y menús sin solapes ni desbordes
async function text() {
  console.log('--- texto: victoria de los 6 jefes, derrota, pausa, Portal y paneles (844x390): sin solapes, desbordes ni fuentes < 11,5 px');
  // T-F0-07: Marlo es un mapache; ningún texto del juego lo llama cordero / corderito
  const lamb = ['aldea.js', 'panels.js', 'cine_intro.js', 'cine.js', 'dialog.js', 'quests.js', 'ending.js', 'assets_cine3.js'].filter(f => /corderit|cordero\b/i.test(fs.readFileSync(path.join(ROOT, 'games/card-swarm/src', f), 'utf8')));
  ok(lamb.length === 0, 'textos: Marlo no es cordero ni corderito' + (lamb.length ? ' (quedan en ' + lamb.join(',') + ')' : ''));
  const b = await launch();
  const report = async (pg, name, min) => { const d = await TC.snap(pg, 2); const iss = TC.analyze(d, { minSize: min || TC.MIN_MENU }).filter(i => i.k !== 'contraste' || true); const kb = kbdHints(d); ok(kb.length === 0, `${name}: sin pistas de teclado en táctil` + (kb.length ? ' -> ' + kb.slice(0, 3).join(' | ') : '')); ok(d.texts.length > 5 && iss.length === 0, `${name}: ${d.texts.length} textos, ${iss.length} problemas` + (iss.length ? ' -> ' + iss.slice(0, 3).map(i => i.msg).join(' | ') : '')); };
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
  // T-F1-08 fase 3: todos los paneles con letra 17 (G.Panels.minFor = G.MIN_UI en todos) y sus páginas (Portal, Archivo, Forja, Ajustes, Tablón y Cacería de Vesper,
  // Rufo, Cocina, Logros, Herrería y Manual)
  await E(pg, () => { const S = G.Save.data; S.bossKills = { pastor: 1, karceron: 1, letea: 1, yarlak: 1, melaria: 1, cenizar: 1 }; S.flags.smithMet = 1; ['first', 'win', 'pastor', 'insig3'].forEach(a => { S.ach[a] = 1; }); G.Quests.accept(G.Quests.board()[0].id); });
  const PAGES = { portal: [null, 'G.Panels.portalTab(2)', 'G.Panels.portalTab(1)'], archive: [null, 'G.Panels.archTab(1)', 'G.Panels.archTab(2)'], forge: [null, "G.Tree.view('det')", "G.Tree.setTab('trunk')"], settings: [null, 'G.Panels.setTab(1)'],
    vesper: DENSE.vesper, rufo: DENSE.rufo, cook: DENSE.cook, logros: DENSE.logros, armor: DENSE.armor, manual: DENSE.manual };
  const mins = [];
  for (const pn of ['portal', 'vesper', 'rufo', 'archive', 'cook', 'logros', 'menu', 'settings', 'forge', 'armor', 'manual', 'cine', 'errlog', 'privacy']) for (const pgx of PAGES[pn] || [null]) {
    const mn = await E(pg, ([n, x]) => { G.Aldea.open(false); G.Aldea.openPanel(n); if (n === 'cine' || n === 'errlog' || n === 'privacy') G.Panels.open(n); if (x) new Function(x)(); return G.Panels.minFor(n); }, [pn, pgx]); mins.push(pn + ':' + mn); await sleep(pg, 150); await report(pg, 'panel ' + pn + (pgx ? ' ' + pgx.replace(/^G\.\w+\./, '') : '') + ' (mín. ' + mn + ')', mn - 0.5); }
  ok(mins.every(x => /:17$/.test(x)) && (await E(pg, () => G.MIN_UI === 17 && G.MIN_DENSE === undefined && G.MIN_OLD === undefined)), 'G.Panels.minFor = 17 (G.MIN_UI) en todos los paneles; sin mínimos de 15 / 12' + (mins.every(x => /:17$/.test(x)) ? '' : ' -> ' + mins.filter(x => !/:17$/.test(x)).join(',')));
  // T-F0-06: más pantallas con pistas posibles (aldea con NPC cerca, oferta de cartas, tutorial de la partida, Herrería en cada pestaña)
  await E(pg, () => { G.Aldea.open(false); }); await sleep(pg, 200); await kbdOnly(pg, 'aldea');
  await E(pg, () => { G.Aldea.open(false); G.Aldea.openPanel('armor'); }); await sleep(pg, 150);
  for (const tb of [0, 1]) { await E(pg, t => { if (G.Smith.setTab) G.Smith.setTab(t); }, tb); await sleep(pg, 100); await kbdOnly(pg, 'herreria pestaña ' + tb); }
  await done(pg, 'texto-paneles');
  await denseLegibility(b);
  pg = await mk(b, 'reset=1&direct=1&all=1&god=1&speed=0&noanchor=1');
  await E(pg, () => { G.Save.data.anchors = []; G.startGame(); }); await sleep(pg, 500); await kbdOnly(pg, 'oferta de cartas');
  await E(pg, () => { G.Cards.skip(); }); await sleep(pg, 300); await E(pg, () => { for (let i = 0; i < 30; i++) G.step(); }); await kbdOnly(pg, 'partida (tutorial)');
  await done(pg, 'texto-partida');
  // T-F1-02 / T-F1-04: tarjeta "Antes de salir", banda de aviso y pantallas de fin (6 variantes) a 844x390 y 740x360
  for (const [w, h] of [[844, 390], [740, 360]]) {
    const tag = `${w}x${h}`;
    pg = await mkV(b, 'track=log&cine=0&reset=1&speed=0&seed=3', w, h);
    await E(pg, () => { G.TrackUI.open(() => {}, { fte: true }); }); await sleep(pg, 300); await report(pg, `tarjeta Antes de salir ${tag}`);
    await E(pg, () => { G.TrackUI.choose(false); G.Fte.launchFirst(); for (let i = 0; i < 40; i++) G.step(); }); await sleep(pg, 100);
    const dh = await TC.snap(pg, 1); ok(dh.texts.some(t => /moverte|WASD/.test(t.s)) && TC.analyze(dh, { minSize: WX === '&wide=0' ? 11.5 : TC.MIN_HUD }).filter(i => i.k === 'solape' || i.k === 'size').length === 0, `banda de aviso ${tag}: visible, 16 px y sin solapes`);
    await E(pg, () => { G.runT = G.time = 70000; G.player.hp = 0; G.player.dead = true; G.finish(false); }); await report(pg, `fin primera expedición ${tag}`); await done(pg, 'texto-fte-' + tag);
    const variants = { 'muerte': 'G.player.hp = 0; G.player.dead = true; G.finish(false);', 'abandono': 'G.finish(false);', 'práctica': '' };
    for (const [nm, code] of Object.entries(variants)) {
      pg = await mkV(b, nm === 'práctica' ? 'reset=1&all=1&speed=0&seed=3&boss=pastor&practice=1&nointro=1&cine=0' : 'reset=1&direct=1&all=1&speed=0&seed=3', w, h);
      await E(pg, c => { for (let i = 0; i < 20; i++) G.step(); G.runT = G.time = Math.max(G.time, 125000); new Function(c)(); if (G.state !== 'gameover') G.finish(false); }, code); await report(pg, `fin ${nm} ${tag}`); await done(pg, 'texto-fin-' + nm + tag);
    }
  }
  await b.close();
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
  ok((await E(pg, () => G.Save.VERSION)) === 13, 'el guardado está en la versión 13 (v10 retención; manualSeen se normaliza sin subirla)');
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
  const MR = await E(pg, () => { const R = G.Manual.rects(); return { next: R.next, row2: R.row(2), fil: R.fil, view: R.view }; });   // T-F1-08: rectángulos de la maquetación de 17
  await tap(pg, MR.next.x + MR.next.w / 2, MR.next.y + MR.next.h / 2); await sleep(pg, 100);   // siguiente página
  const st1 = await E(pg, () => G.Manual.state()); ok(st1.page === 1 && st1.sel === 5, `botón siguiente: página ${st0.page} -> ${st1.page}`);
  await tap(pg, MR.row2.x + 100, MR.row2.y + MR.row2.h / 2); await sleep(pg, 100);
  const st2 = await E(pg, () => G.Manual.state()); ok(st2.sel === 7, 'tocar una fila la selecciona (' + st2.sel + ')');
  await E(pg, () => { G.input.swipe = -1; }); await sleep(pg, 150);
  ok((await E(pg, () => G.Manual.state().sel)) === 8, 'deslizar a la izquierda = siguiente entrada');
  await tap(pg, MR.view.x + MR.view.w / 2, MR.view.y + MR.view.h / 2); await sleep(pg, 100);
  const sv = await E(pg, () => G.Manual.state().view); await tap(pg, MR.view.x + MR.view.w / 2, MR.view.y + MR.view.h / 2); await sleep(pg, 100);
  ok(sv === 1 && (await E(pg, () => G.Manual.state().view)) === 0, 'VER TEXTO / VER DEMO cambian la vista de la entrada');
  await tap(pg, MR.fil.x + MR.fil.w / 2, MR.fil.y + MR.fil.h / 2); await sleep(pg, 100);
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
  // 5. texto sin solapes en 8 entradas (844x390 lógico 960x540), en las dos vistas (FICHA y TEXTO), con letra 17 (T-F1-08)
  for (const [tab, i] of [[0, 0], [0, 3], [0, 9], [0, 27], [1, 0], [1, 4], [1, 12], [1, 14]]) for (const vw of [0, 1]) {
    await E(pg, ([tab, i, vw]) => { G.Manual.setFilter('all'); G.Manual.setQuery(''); G.Manual.setTab(tab); G.Manual.select(i); G.Manual.setView(vw); }, [tab, i, vw]); await sleep(pg, 250);
    const d = await TC.snap(pg, 2), iss = TC.analyze(d, { minSize: TC.MIN_MENU });
    ok(d.texts.length > 8 && iss.length === 0, `texto del Manual (${tab ? 'fusión' : 'carta'} ${i}, ${vw ? 'TEXTO' : 'FICHA'}): ${d.texts.length} textos, ${iss.length} problemas` + (iss.length ? ' -> ' + iss.slice(0, 3).map(x => x.msg).join(' | ') : ''));
  }
  await E(pg, () => G.Manual.setView(0));
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

// ---------------------------------------------------------------- Registro de errores en el dispositivo (src/diag.js, T-F0-11)
async function diag() {
  console.log('--- diag: captura de error y de promesa rechazada, límite de 20, copia del informe y pantalla en Ajustes');
  const b = await launch(); const pg = await mk(b, 'reset=1');
  await pg.ctx.grantPermissions(['clipboard-read', 'clipboard-write']).catch(() => {});
  ok(await E(pg, () => typeof Diag === 'object' && Diag.count() === 0), 'Diag existe y empieza vacío');
  // 1. captura: error con archivo y línea, y promesa rechazada
  await E(pg, () => {
    window.dispatchEvent(new ErrorEvent('error', { message: 'prueba rota', filename: 'http://x/src/hud.js', lineno: 42, colno: 7, error: new Error('prueba rota') }));
    window.dispatchEvent(new PromiseRejectionEvent('unhandledrejection', { promise: Promise.resolve(), reason: new Error('promesa rota') }));
  });
  const en = await E(pg, () => Diag.entries());
  ok(en.length === 2 && en[0].msg === 'prueba rota' && en[0].src === 'hud.js' && en[0].line === 42 && en[0].ctx.state && en[0].build, 'captura: mensaje, archivo, línea, estado del juego y versión (' + JSON.stringify(en[0]).slice(0, 120) + ')');
  ok(en[1].kind === 'promesa' && en[1].msg === 'promesa rota', 'captura: unhandledrejection');
  ok(await E(pg, () => JSON.parse(localStorage.getItem('swarmhand.fusion.errlog')).length === 2), 'se guarda en localStorage (swarmhand.fusion.errlog)');
  // 2. límite de 20 (se conservan los más nuevos) y repetidos agrupados
  const lim = await E(pg, () => { for (let i = 0; i < 30; i++) Diag.log('fallo ' + i); for (let i = 0; i < 5; i++) Diag.log('bucle'); const e = Diag.entries(); return { n: e.length, last: e[e.length - 1], first: e[0].msg, stored: JSON.parse(localStorage.getItem('swarmhand.fusion.errlog')).length }; });
  ok(lim.n === 20 && lim.stored === 20 && lim.last.msg === 'bucle' && lim.last.n === 5 && lim.first === 'fallo 11', 'límite de 20 (más nuevos) y el mismo fallo en bucle se cuenta (n=' + lim.n + ', bucle x' + lim.last.n + ', primero ' + lim.first + ')');
  // 3. informe y copia
  const rep = await E(pg, () => Diag.copy().then(ok => ({ ok, txt: Diag.text() })));
  ok(rep.ok && /bucle/.test(rep.txt) && /version: /.test(rep.txt), 'copiar informe: devuelve true y el texto lleva versión y errores');
  const clip = await E(pg, () => navigator.clipboard.readText().catch(() => null));
  ok(clip === null || /informe de errores/.test(clip), 'el portapapeles recibe el informe' + (clip === null ? ' (lectura no permitida en este navegador)' : ''));
  // 4. pantalla en Ajustes (táctil, sin pistas de teclado ni solapes) y vaciar
  await E(pg, () => { G.Aldea.open(false); G.Aldea.openPanel('settings'); }); await sleep(pg, 400);
  { await E(pg, () => G.Panels.setTab(1)); const r = await E(pg, () => G.Panels.setRects().sb.err); await tap(pg, r.x + r.w / 2, r.y + r.h / 2); await sleep(pg, 300); }   // T-F1-08: Informe de errores está en la 2.ª página de Ajustes
  ok(await E(pg, () => G.Panels.current()) === 'errlog', 'Ajustes: el botón Informe de errores abre la pantalla');
  const d = await TC.snap(pg, 2), iss = TC.analyze(d, { minSize: TC.MIN_MENU }); ok(iss.length === 0 && kbdHints(d).length === 0, 'pantalla del informe: ' + d.texts.length + ' textos, ' + iss.length + ' problemas' + (iss.length ? ' -> ' + iss.slice(0, 3).map(x => x.msg).join(' | ') : ''));
  await tap(pg, 650, 394); await sleep(pg, 300);
  ok(await E(pg, () => Diag.count()) === 0, 'VACIAR borra el registro');
  // 5. un fallo dentro del bucle se registra y el juego sigue
  await E(pg, () => { G.Aldea.open(false); const o = G.Hud.draw; G.Hud.draw = function () { G.Hud.draw = o; throw new Error('fallo de dibujo'); }; G.state = 'play'; });
  await sleep(pg, 400);
  const fr = await E(pg, () => ({ n: Diag.count(), k: Diag.entries().map(e => e.kind + ':' + e.msg).join('|') }));
  ok(fr.n >= 1 && /fotograma:fallo de dibujo/.test(fr.k), 'un fallo en un fotograma se registra y el bucle sigue (' + fr.k + ')');
  pg.errs = []; await done(pg, 'diag'); await b.close();
}

// ---------------------------------------------------------------- Parámetros de depuración cerrados sin ?dev=1 (src/dev.js, T-F0-03 reducida)
async function dev() {
  console.log('--- dev: give / pf / len / all / cmul / hand / peligro / reset / smith cerrados sin ?dev=1; ?god y ?seed no se tocan');
  const b = await launch(), E1 = (pg, fn) => E(pg, fn);
  // 1. sin dev=1: nada de lo que da recursos o cambia la dificultad
  let pg = await mk(b, 'nodev&give=all:30,brasas:900&pf=5&len=3&all=1&cmul=1&smith=1&speed=0&hand=spark:3&peligro=4');
  const r = await E1(pg, () => ({ dev: Dev.on, brasas: G.Save.data.brasas, parts: Object.keys(G.Save.data.parts).length, pf: G.Save.data.pf.earned, len: G.lenOverride || 0, all: G.fusionAll, smith: G.Armor.smithOn(), spd: G.speed, cmul: G.B.cardDmgMul, pel: G.peligroUrl, search: Dev.search }));
  ok(!r.dev && r.brasas === 0 && r.parts === 0 && r.pf === 1, 'sin dev=1: give y pf no cambian el guardado (brasas ' + r.brasas + ', partes ' + r.parts + ', pf ' + r.pf + ')');
  ok(!r.len && !r.all && !r.smith && r.spd === 1 && Math.abs(r.cmul - 0.98 * 3.5) < 1e-9 && !r.pel, 'sin dev=1: len, all, smith, speed, cmul y peligro se ignoran (cmul ' + r.cmul + ', speed ' + r.spd + ')');
  ok(!/give|cmul|pf=|smith|all=/.test(r.search), 'Dev.search no deja pasar los parámetros cerrados: "' + r.search + '"');
  await done(pg, 'dev-cerrado');
  // 2. reset=1 sin dev=1 no borra el guardado
  pg = await mk(b, 'nodev');
  await E1(pg, () => { G.Save.data.brasas = 777; G.Save.save(); });
  await pg.goto(`${base}/index.html?nosw=1&reset=1`); await sleep(pg, 600);
  ok((await E1(pg, () => G.Save.data.brasas)) === 777, 'sin dev=1: ?reset=1 no borra la partida');
  await pg.goto(`${base}/index.html?nosw=1&dev=1&reset=1`); await sleep(pg, 600);
  ok((await E1(pg, () => G.Save.data.brasas)) === 0, 'con dev=1: ?reset=1 borra la partida');
  await done(pg, 'dev-reset');
  // 3. con dev=1 todo sigue funcionando
  pg = await mk(b, 'reset=1&give=all:30,brasas:900&pf=5&len=3&all=1&cmul=1&smith=1&speed=0&peligro=4');
  const w = await E1(pg, () => ({ dev: Dev.on, brasas: G.Save.data.brasas, pf: G.Save.data.pf.earned, len: G.lenOverride, all: G.fusionAll, smith: G.Armor.smithOn(), spd: G.speed, cmul: G.B.cardDmgMul, pel: G.peligroUrl }));
  ok(w.dev && w.brasas === 900 && w.pf === 6 && w.len === 3 && w.all && w.smith && w.spd === 0 && Math.abs(w.cmul - 0.98) < 1e-9 && w.pel, 'con dev=1: give, pf, len, all, smith, speed, cmul y peligro funcionan (' + JSON.stringify(w) + ')');
  await done(pg, 'dev-abierto');
  // 4. ?god y ?seed no dependen de dev=1
  pg = await mk(b, 'nodev&god=0&seed=7');
  ok(await E1(pg, () => G.god === false), '?god=0 sigue funcionando sin dev=1');
  await done(pg, 'dev-god');
  pg = await mk(b, 'nodev');
  ok(await E1(pg, () => typeof G.god === 'boolean'), '?god no se toca (sin parámetro: por defecto ' + (await E1(pg, () => G.god)) + ')');
  await done(pg, 'dev-god2'); await b.close();
}

// ---------------------------------------------------------------- Guardado a prueba de pérdidas (src/save.js + src/pwa.js, T-F1-11)
async function save2() {
  console.log('--- save2: suma de comprobación, copias rotativas, corrupción, cuota llena, almacenamiento bloqueado, IndexedDB, importación maliciosa, ida y vuelta');
  const b = await launch();
  const reload = async (pg, extra) => { await pg.goto(`${base}/index.html?dev=1&nosw=1&${extra || ''}`); await sleep(pg, 900); };
  const toastTxt = pg => E(pg, () => { const t = [...document.querySelectorAll('div')].find(d => d.style.zIndex === '25' && d.style.display !== 'none'); return t ? t.textContent : ''; });
  let pg = await mk(b, 'reset=1');
  // 1. guardado sellado y copias rotativas
  const s1 = await E(pg, () => {
    const S = G.Save, K = S.KEYS;
    S.data.brasas = 500; S.save(); S.data.brasas = 600; S.save();
    const main = localStorage.getItem(S.KEY), rec = localStorage.getItem(K.rec), idx = JSON.parse(localStorage.getItem(K.idx));
    return { sealed: /,"_sum":"[0-9a-z]+\.[0-9a-z]+"\}$/.test(main), okMain: !!S.readRaw(main).d, mainB: JSON.parse(main).brasas, recB: JSON.parse(rec).brasas, idx, boot: S.boot, keys: Object.keys(localStorage) };
  });
  ok(s1.sealed && s1.okMain && s1.mainB === 600, 'el principal se guarda sellado con "_sum" y pasa la comprobación');
  ok(s1.recB === 500 && s1.idx.main >= s1.idx.reciente && s1.idx.reciente > 0, 'copia .reciente = la versión anterior (500 Brasas) con fecha en .copias');
  ok(s1.keys.every(k => k.startsWith('swarmhand.fusion.')), 'claves nuevas con el prefijo swarmhand.fusion.: ' + s1.keys.join(','));
  const rot = await E(pg, () => {
    const S = G.Save, K = S.KEYS, ix = JSON.parse(localStorage.getItem(K.idx)), old = Date.now() - 2 * 864e5;
    ix.dia = old; localStorage.setItem(K.idx, JSON.stringify(ix)); localStorage.setItem(K.day, localStorage.getItem(K.rec));
    S.data.brasas = 700; S.save();
    const ix2 = JSON.parse(localStorage.getItem(K.idx));
    return { day: JSON.parse(localStorage.getItem(K.day)).brasas, week: JSON.parse(localStorage.getItem(K.week)).brasas, tw: ix2.semana === old, td: ix2.dia > old };
  });
  ok(rot.day === 600 && rot.week === 500 && rot.tw && rot.td, 'rotación: la copia del día (>24 h) pasa a la de la semana y la del día se renueva (' + JSON.stringify(rot) + ')');
  // 2. JSON truncado -> copia más reciente, aviso al jugador, el dañado queda en .danado
  await E(pg, () => { const k = G.Save.KEY, m = localStorage.getItem(k); localStorage.setItem(k, m.slice(0, Math.floor(m.length / 2))); });
  await reload(pg);
  let r = await E(pg, () => ({ rc: G.Save.recovered, b: G.Save.data.brasas, st: G.state, bad: !!localStorage.getItem(G.Save.KEYS.bad), fixed: !!G.Save.readRaw(localStorage.getItem(G.Save.KEY)).d }));
  ok(r.rc && r.rc.from === 'reciente' && r.rc.reason === 'dañado' && r.b === 600 && r.fixed && r.bad, 'JSON truncado: se recupera la copia reciente (600 Brasas), el principal vuelve a ser válido y el dañado queda en .danado');
  ok(/dañado: se recuperó la copia más reciente/.test(await toastTxt(pg)) && (r.st === 'aldea' || r.st === 'title'), 'aviso claro al jugador: "' + (await toastTxt(pg)).slice(0, 90) + '" (estado ' + r.st + ')');
  // 3. sin principal (borrado) -> la última instantánea
  await E(pg, () => { G.Save.data.brasas = 610; G.Save.save(); G.Save.data.brasas = 620; G.Save.save(); localStorage.removeItem(G.Save.KEY); });
  await reload(pg);
  r = await E(pg, () => ({ rc: G.Save.recovered, b: G.Save.data.brasas }));
  ok(r.rc && r.rc.from === 'reciente' && r.rc.reason === 'ausente' && r.b === 610, 'principal borrado: recarga y recupera la última instantánea (610 Brasas)');
  // 4. suma que no cuadra (valor cambiado a mano en un JSON válido) -> no se usa el valor alterado
  await E(pg, () => { G.Save.data.brasas = 630; G.Save.save(); G.Save.data.brasas = 640; G.Save.save(); const k = G.Save.KEY; localStorage.setItem(k, localStorage.getItem(k).replace('"brasas":640', '"brasas":999999')); });
  await reload(pg);
  r = await E(pg, () => ({ rc: G.Save.recovered, b: G.Save.data.brasas }));
  ok(r.rc && r.rc.from === 'reciente' && r.b === 630, 'suma de comprobación alterada: se descarta y se usa la copia (630, no 999999)');
  // 5. forma imposible (parts no es un objeto) -> copia; tipos erróneos y fuera de rango en un guardado viejo sin sello -> se corrigen
  await E(pg, () => { const k = G.Save.KEY, d = JSON.parse(localStorage.getItem(k)); d.parts = 'nada'; delete d._sum; localStorage.setItem(k, JSON.stringify(d)); });
  await reload(pg);
  r = await E(pg, () => ({ rc: G.Save.recovered, b: G.Save.data.brasas, parts: typeof G.Save.data.parts }));
  ok(r.rc && r.rc.from === 'reciente' && r.parts === 'object', 'tipo erróneo en un campo base (parts = "nada"): se recupera la copia');
  await E(pg, () => { const k = G.Save.KEY, d = JSON.parse(localStorage.getItem(k)); delete d._sum; Object.assign(d, { brasas: 'mucho', runs: -4, pity: 9 }); d.parts = { wick: -5, frost: 7 }; d.cards.spark = 99; d.peligro.pastor = 50; d.pf.earned = 1e6; d.settings = { master: 7, music: 0.5, sfx: 0.5 }; localStorage.setItem(k, JSON.stringify(d)); });
  await reload(pg);
  r = await E(pg, () => { const d = G.Save.data; return { rc: G.Save.recovered, fx: G.Save.repairs.length, b: d.brasas, runs: d.runs, pity: d.pity, wick: d.parts.wick, frost: d.parts.frost, spark: d.cards.spark, pel: G.Save.pelMax('pastor'), pf: d.pf.earned, vol: d.settings.master, st: G.state }; });
  ok(!r.rc && r.fx >= 8 && r.b === 0 && r.runs === 0 && r.pity <= 1 && r.wick === 0 && r.frost === 7 && r.spark === 3 && r.pel === 5 && r.pf === 24 && r.vol === 1, 'valores fuera de rango y tipos erróneos en un guardado sin sello: se corrigen al cargar (' + r.fx + ' campos) y se conserva lo sano');
  // 6. versión futura en el principal: se conserva y no se pisa
  await E(pg, () => { const k = G.Save.KEY, d = JSON.parse(localStorage.getItem(k)); delete d._sum; d.v = 14; d.brasas = 1313; localStorage.setItem(k, JSON.stringify(d)); });
  await reload(pg);
  r = await E(pg, () => { const S = G.Save, before = localStorage.getItem(S.KEY); S.data.brasas = 1; const sv = S.save(); return { hold: S.hold, sv, same: localStorage.getItem(S.KEY) === before, v14: !!localStorage.getItem(S.KEY + '.v14'), v: JSON.parse(before).v }; });
  ok(r.hold && r.sv === false && r.same && r.v === 14 && r.v14, 'guardado de una versión futura: no se sobrescribe (copia .v14) y se juega en memoria');
  ok(/versión más nueva/.test(await toastTxt(pg)), 'aviso de versión futura con RECARGAR');
  await done(pg, 'save2-corrupcion');
  // 7. cuota llena simulada (total y parcial) y vuelta a la normalidad
  pg = await mk(b, 'reset=1');
  r = await E(pg, () => {
    const S = G.Save, K = S.KEYS, orig = Storage.prototype.setItem; S.data.brasas = 50; S.save();
    const before = localStorage.getItem(S.KEY);
    Storage.prototype.setItem = function () { throw new DOMException('lleno', 'QuotaExceededError'); };
    S.data.brasas = 4242; let threw = false, sv; try { sv = S.save(); } catch (e) { threw = true; }
    const o = { threw, sv, ok: S.ok, err: S.lastError, same: localStorage.getItem(S.KEY) === before, mem: S.data.brasas };
    localStorage.removeItem('x');
    // parcial: el principal no cabe mientras exista la copia de la semana (se libera y se reintenta)
    Storage.prototype.setItem = orig; localStorage.setItem(K.week, before);
    Storage.prototype.setItem = function (k, v) { if (k === S.KEY && this.getItem(K.week) !== null) throw new DOMException('lleno', 'QuotaExceededError'); return orig.call(this, k, v); };
    S.data.brasas = 4343; o.sv2 = S.save(); o.week = localStorage.getItem(K.week); o.b2 = JSON.parse(localStorage.getItem(S.KEY)).brasas;
    Storage.prototype.setItem = orig; S.data.brasas = 4444; o.sv3 = S.save(); o.ok3 = S.ok; o.b3 = JSON.parse(localStorage.getItem(S.KEY)).brasas;
    return o;
  });
  ok(!r.threw && r.sv === false && !r.ok && r.err === 'quota' && r.same && r.mem === 4242, 'cuota llena: save() no lanza, devuelve false, el principal anterior queda intacto y el progreso sigue en memoria');
  ok(/No queda espacio/.test(await toastTxt(pg)), 'cuota llena: aviso "No queda espacio..." (exportar)');
  ok(r.sv2 === true && r.week === null && r.b2 === 4343, 'cuota casi llena: libera lo prescindible (copia de la semana) y el principal se escribe');
  ok(r.sv3 === true && r.ok3 && r.b3 === 4444, 'cuando vuelve el espacio, se guarda con normalidad');
  // 8. copia en IndexedDB: si el navegador borra localStorage, se recupera de ahí
  r = await E(pg, () => new Promise(res => { G.Save.data.brasas = 777; G.Save.data.runs = 3; G.Save.save(); G.Save.flushIdb(ok => G.Save.idbRead(rec => res({ ok, b: rec && JSON.parse(rec.raw).brasas }))); }));
  ok(r.ok && r.b === 777, 'segunda copia en IndexedDB escrita (777 Brasas)');
  await E(pg, () => localStorage.clear());
  await reload(pg); await sleep(pg, 600);
  r = await E(pg, () => ({ rc: G.Save.recovered, b: G.Save.data.brasas, runs: G.Save.data.runs, main: JSON.parse(localStorage.getItem(G.Save.KEY)).brasas }));
  ok(r.rc && r.rc.from === 'idb' && r.b === 777 && r.runs === 3 && r.main === 777, 'localStorage vacío: se recupera la copia de IndexedDB y se vuelve a escribir el principal');
  ok(/copia interna del navegador/.test(await toastTxt(pg)), 'aviso de recuperación desde IndexedDB');
  // 9. ?reset=1 (dev) borra también las copias y la de IndexedDB
  await reload(pg, 'reset=1'); await sleep(pg, 300);
  r = await E(pg, () => new Promise(res => G.Save.idbRead(rec => { const K = G.Save.KEYS, has777 = x => !!x && JSON.parse(x).brasas === 777; res({ rec: !!rec && JSON.parse(rec.raw).brasas === 777, b: G.Save.data.brasas, rec2: [K.rec, K.day, K.week].some(k => has777(localStorage.getItem(k))), del: has777(localStorage.getItem(K.del)) }); })));
  ok(!r.rec && r.b === 0 && !r.rec2 && r.del, 'borrar el progreso: sin copias rotativas ni IndexedDB; queda .antes-de-borrar para restaurar a mano');
  await done(pg, 'save2-cuota-idb');
  // 10. almacenamiento bloqueado: el juego arranca y se juega en memoria
  {
    const ctx = await b.newContext({ viewport: { width: 844, height: 390 }, hasTouch: true, isMobile: true });
    await ctx.addInitScript(() => { Object.defineProperty(window, 'localStorage', { configurable: true, get() { throw new DOMException('bloqueado', 'SecurityError'); } }); });
    const p2 = await ctx.newPage(); p2.errs = []; p2.ctx = ctx;
    p2.on('console', m => { if (m.type() === 'error') p2.errs.push(m.text()); }); p2.on('pageerror', e => p2.errs.push('PAGEERR ' + e.message));
    await p2.goto(`${base}/index.html?dev=1&nosw=1&direct=1`); await sleep(p2, 1200);
    r = await E(p2, () => { const sv = G.Save.save(); return { ok: G.Save.ok, boot: G.Save.boot, sv, st: G.state, v: G.Save.data.v }; });
    ok(!r.ok && r.boot === 'sin-almacen' && r.sv === false && r.v === 13 && (r.st === 'play' || r.st === 'cards'), 'almacenamiento bloqueado: arranca y se juega (estado ' + r.st + '), save() devuelve false sin lanzar');
    ok(/bloquea el guardado/.test(await toastTxt(p2)), 'almacenamiento bloqueado: aviso al jugador');
    await done(p2, 'save2-bloqueado');
  }
  // 11. importación: maliciosa, dañada, fuera de rango, futura; nada cambia si se rechaza
  pg = await mk(b, 'reset=1&give=all:3,brasas:250');
  r = await E(pg, () => {
    const S = G.Save, b64 = o => 'SWARM1:' + btoa(unescape(encodeURIComponent(typeof o === 'string' ? o : JSON.stringify(o))));
    const base0 = JSON.parse(JSON.stringify(S.data)), mk = patch => Object.assign(JSON.parse(JSON.stringify(base0)), patch);
    const good = S.exportText(), before = localStorage.getItem(S.KEY);
    const cases = {
      proto: '{"v":12,"parts":{},"cards":{},"__proto__":{"polluted":1}}',
      protoDeep: '{"v":12,"parts":{"__proto__":{"polluted":1}},"cards":{}}',
      ctor: JSON.stringify(mk({ flags: { constructor: { prototype: { polluted: 1 } } } })),
      hugeStr: JSON.stringify(mk({ biome: 'x'.repeat(100000) })),
      hugeTxt: 'SWARM1:' + 'A'.repeat(900000),
      hugeArr: JSON.stringify(mk({ anchors: new Array(5000).fill('spark') })),
      neg: b64(mk({ brasas: -5 })), big: b64(mk({ brasas: 1e15 })), rank: b64(mk({ cards: { spark: 99 } })), pf: b64(mk({ pf: { earned: 999 } })), type: b64(mk({ runs: '5' })), inf: '{"v":12,"parts":{},"cards":{},"brasas":1e999}',
      future: b64(mk({ v: 14 })), noVer: b64(mk({ v: 'doce' })), trunc: good.slice(0, Math.floor(good.length * 0.6)), flip: good.slice(0, 40) + (good[40] === 'A' ? 'B' : 'A') + good.slice(41),
      garbage: 'hola, esto no es un guardado', js: 'alert(1)', arr: '[1,2,3]', badB64: 'SWARM1:%%%<script>'
    };
    const out = {};
    for (const k in cases) { const x = S.importText(cases[k]); out[k] = x.ok ? 'ACEPTADO' : x.err; }
    out.same = localStorage.getItem(S.KEY) === before && S.data.brasas === base0.brasas;
    out.polluted = ({}).polluted === undefined && Object.prototype.polluted === undefined;
    // textos con HTML / script: se aceptan neutralizados (sin < >) y no se ejecuta nada
    const html = mk({ flags: Object.assign({}, base0.flags, { nota: '<img src=x onerror="window.__pwn=1"><script>window.__pwn=1</script>' }) });
    html.loadouts = [{ name: '<b>X</b>', anchors: ['spark'], dish: null, len: 9 }, null, null];
    const xh = S.importText(b64(html)); out.longName = S.importText(b64(Object.assign(JSON.parse(JSON.stringify(html)), { loadouts: [{ name: '<script>window.__pwn=1</script>', anchors: ['spark'], dish: null, len: 9 }, null, null] }))).ok;
    if (!xh.ok) return Object.assign(out, { html: { ok: false, err: xh.err, nota: '', lo: '' } });
    out.html = { ok: xh.ok, nota: S.data.flags.nota, lo: S.data.loadouts[0].name, pwn: window.__pwn === undefined, noLt: !/[<>]/.test(localStorage.getItem(S.KEY)) };
    out.legacy = S.importText(JSON.stringify(mk({ brasas: 321 }))).ok && S.data.brasas === 321;   // texto viejo sin "_sum": se acepta si es válido
    return out;
  });
  const rej = ['proto', 'protoDeep', 'ctor', 'hugeStr', 'hugeTxt', 'hugeArr', 'neg', 'big', 'rank', 'pf', 'type', 'inf', 'future', 'noVer', 'trunc', 'flip', 'garbage', 'js', 'arr', 'badB64'];
  ok(rej.every(k => r[k] !== 'ACEPTADO'), 'importación: se rechazan los ' + rej.length + ' textos malos (' + rej.filter(k => r[k] === 'ACEPTADO').join(',') + ')');
  ok(r.same && r.polluted, 'importación rechazada: el guardado no cambia y Object.prototype no se contamina (__proto__ / constructor)');
  ok(/valores imposibles/.test(r.neg) && /valores imposibles/.test(r.rank) && /valores imposibles/.test(r.type) && /versión más nueva/.test(r.future) && /incompleto o dañado|no es un guardado/.test(r.trunc) && /demasiado grande/.test(r.hugeTxt), 'mensajes claros: rango "' + r.neg.slice(0, 60) + '", futuro, truncado, enorme');
  ok(r.html.ok && !/[<>]/.test(r.html.nota) && !/[<>]/.test(r.html.lo) && r.html.lo.length <= 12 && r.html.pwn && r.html.noLt && r.longName === false, 'HTML / script en textos: se neutraliza; un nombre de loadout largo con script se rechaza (nota "' + r.html.nota.slice(0, 40) + '", loadout "' + r.html.lo + '") y no se ejecuta');
  ok(r.legacy, 'un texto exportado antes de T-F1-11 (sin "_sum") se sigue importando');
  // 12. exportar -> importar ida y vuelta idéntica; restaurar desde Ajustes > Copias
  r = await E(pg, () => {
    const S = G.Save; S.data.brasas = 1234; S.data.runs = 7; S.data.loadouts[1] = { name: 'TANQUE', anchors: ['spark', 'dart'], dish: null, len: 10 }; S.data.hunts = { pastor: { 2: { wins: 1, tries: 3, best: 61.5 } } }; S.save();
    const t1 = S.exportText(), j1 = JSON.stringify(S.data), r1 = S.importText(t1), t2 = S.exportText(), j2 = JSON.stringify(S.data);
    return { ok: r1.ok, same: t1 === t2, sameData: j1 === j2, imp: !!localStorage.getItem(S.KEYS.imp) };
  });
  ok(r.ok && r.same && r.sameData && r.imp, 'exportar -> importar -> exportar: texto y datos idénticos; el anterior queda en .antes-de-importar');
  await E(pg, () => { G.Save.data.brasas = 1300; G.Save.save(); G.Save.data.brasas = 1400; G.Save.save(); G.Aldea.open(false); G.Aldea.openPanel('settings'); G.Panels.setTab(1); }); await sleep(pg, 400);
  { const r = await E(pg, () => G.Panels.setRects().sb.bak); await tap(pg, r.x + r.w / 2, r.y + r.h / 2); await sleep(pg, 300); }   // T-F1-08: Copias en la 2.ª página de Ajustes
  const modal = await E(pg, () => { const bs = [...document.querySelectorAll('button')].map(x => x.textContent); return { t: document.body.innerText.includes('Copias de seguridad'), bs }; });
  ok(modal.t && modal.bs.some(x => /RESTAURAR: COPIA RECIENTE/.test(x)), 'Ajustes > Copias: lista las copias con botón RESTAURAR (' + modal.bs.filter(x => /RESTAURAR/.test(x)).length + ')');
  const recB = await E(pg, () => { G.Save.data.brasas = 1500; G.Save.save(); const r0 = JSON.parse(localStorage.getItem(G.Save.KEYS.rec)).brasas; [...document.querySelectorAll('button')].find(x => /RESTAURAR: COPIA RECIENTE/.test(x.textContent)).click(); return r0; }); await sleep(pg, 300);
  const nowB = await E(pg, () => G.Save.data.brasas);
  ok(nowB === recB && recB !== 1500 && recB >= 1300, 'restaurar la copia reciente desde Ajustes (1500 -> ' + nowB + ' Brasas, las de la copia)');
  // 13. recordatorio de exportar y almacenamiento persistente
  r = await E(pg, () => { const d = G.Save.data; d.runs = 25; d.flags.expAt = 14; d.flags.remAt = 0; G.PWA.reminded = false; G.state = 'aldea'; const a = G.PWA.remindCheck(), t = [...document.querySelectorAll('div')].find(x => x.style.zIndex === '25').textContent, b2 = G.PWA.remindCheck(); return { a, b2, t, rem: d.flags.remAt }; });
  ok(r.a && !r.b2 && /11 expediciones sin exportar/.test(r.t) && /EXPORTAR/.test(r.t) && r.rem === 25, 'recordatorio de exportar tras 10 expediciones (una vez por sesión, con botón EXPORTAR)');
  ok(await E(pg, () => new Promise(res => G.Save.persist(p => res(p === null || typeof p === 'boolean')))), 'navigator.storage.persist() se pide sin errores');
  await done(pg, 'save2-import');
  await saveF2(b, reload);
  await b.close();
}
// F2 (SPEC-T-F1-07 8.1, opción A): las Insignias pasan a ser "trofeos de guardián" dentro de Trofeos SIN tocar el guardado (sigue v13, mismos campos).
// Guardado real de antes de F2 (fixtures/save-v13-pre-f2.json, hecho con el código de dacc6d4 por fixtures/gen-save-v13-pre-f2.js): carga sellado sin
// recuperación ni reparaciones, no pierde nada, cuenta igual (costes, piezas listas, logros, pedidos, saldos) y pasa por copias, sello e import estricto.
async function saveF2(b, reload) {
  const FX = JSON.parse(fs.readFileSync(path.join(__dirname, 'fixtures', 'save-v13-pre-f2.json'), 'utf8')), raw0 = JSON.parse(FX.raw);
  const pg = await mk(b, 'reset=1&direct=1&speed=0&seed=7');
  await E(pg, r => { localStorage.clear(); localStorage.setItem('swarmhand.fusion.save', r); }, FX.raw);
  await pg.goto(`${base}/index.html?dev=1&nosw=1&direct=1&speed=0&seed=7${WX}`); await sleep(pg, 900);
  let r = await E(pg, ref => {
    const S = G.Save, d = S.data, A = G.Armor, D = G.ArmorData, costs = {};
    D.PIECES.forEach(p => { costs[p.id] = [0, 1, 2, 3].map(k => A.cost(p, k)); });
    const now = { costs, ready: A.readyCount(), insCount: G.Minis.insigniaCount(), achCount: G.Ach.count(), achOk: G.Ach.DEFS.filter(a => a.ok(d)).map(a => a.id), pedOk: A.PED.filter(x => x.ok(d)).map(x => x.id),
      haveIns: Object.fromEntries(G.Minis.ALL.map(m => [m, A.have('ins', m)])), haveTro: { horn: A.have('tro', 'horn') }, costOK: Object.fromEntries(D.PIECES.map(p => [p.id, A.costOK(A.cost(p, 0))])) };
    const diff = Object.keys(ref).filter(k => JSON.stringify(ref[k]) !== JSON.stringify(now[k]));
    const rows = G.Res.rows(), tro = rows.find(x => x.id === 'trofeos');
    return { rc: S.recovered, rep: S.repairs.length, v: d.v, ins: d.insignias, insE: d.insigniasEver, tr: d.trophies, trE: d.trophiesEver, owned: d.armor.owned, ach: d.ach, diff, nRows: rows.length, ids: rows.map(x => x.id).join(), troHave: tro && tro.have, resOn: G.Res.on(), visIns: G.Res.visible('insignias') === G.Res.visible('trofeos') };
  }, FX.ref);
  const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
  ok(!r.rc && r.rep === 0 && r.v === 13, `F2: el guardado v13 real de antes de F2 carga sellado, sin recuperación ni reparaciones (v${r.v}, recuperado ${JSON.stringify(r.rc)}, ${r.rep} reparaciones)`);
  ok(same(r.ins, raw0.insignias) && same(r.insE, raw0.insigniasEver) && same(r.tr, raw0.trophies) && same(r.trE, raw0.trophiesEver) && same(r.owned, raw0.armor.owned) && same(r.ach, raw0.ach), 'F2: sin pérdida: Insignias antiguas (saldo y acumulado), trofeos, armadura y logros idénticos (' + JSON.stringify(r.ins) + ')');
  ok(r.diff.length === 0, 'F2: cuenta igual que el código de antes: costes de las 33 piezas (fabricar y 3 refuerzos), piezas listas, logros, pedidos, saldos de jefe y de guardián' + (r.diff.length ? ' -> distinto: ' + r.diff.join(',') : ''));
  ok(r.nRows === 6 && r.ids === 'ceniza,brasas,partes,esencia,pf,trofeos' && r.troHave === 1 + 3 && r.visIns, `F2: las Insignias siguen contando, ahora dentro de Trofeos: Archivo RECURSOS 6 filas, Trofeos = 1 de jefe + 3 de guardián = ${r.troHave}`);
  // Archivo COLECCIÓN, Logros y Lanudo con el guardado viejo: los nombres nuevos, ninguna "Insignia" en pantalla
  await E(pg, () => { G.Dialog.close(); G.Aldea.open(false); G.Aldea.openPanel('archive'); G.Panels.archTab(0); }); await sleep(pg, 150);
  let d = await TC.snap(pg, 2);
  ok(d.texts.some(t => t.s === 'TROFEOS DE GUARDIÁN 4/10') && !d.texts.some(t => /[Ii]nsignia/.test(t.s)) && TC.analyze(d, { minSize: TC.MIN_MENU }).length === 0, 'F2: Archivo COLECCIÓN dice "TROFEOS DE GUARDIÁN 4/10" (letra 17, sin problemas de texto) y ya no "INSIGNIAS"');
  const lg = await E(pg, () => G.Ach.DEFS.concat(G.Armor.PED).filter(a => /[Ii]nsignia/.test(a.name + a.desc + (a.lore || ''))).map(a => a.id));
  ok(lg.length === 0, 'F2: ningún logro ni pedido de Carapa nombra ya las Insignias' + (lg.length ? ' (' + lg.join(',') + ')' : ''));
  const lan = await E(pg, () => { let said = [], opts = null; const o = G.Dialog.say; G.Dialog.say = function (w, t, op) { said = said.concat(t); if (op) opts = op; return o.apply(this, arguments); };
    G.Dialog.close(); G.Aldea.talk('lanudo'); const tip = (opts || []).find(x => x.label === 'Consejo'); said = []; if (tip) tip.fn(); G.Dialog.say = o; G.Dialog.close(); return said; });
  ok(lan.length === 1 && /^(Cuerno del Carnero|Raíz de la Tejedora|Llave del Alcaide|Aguijón Real)\.\.\. /.test(lan[0]) && !/[Ii]nsignia/.test(lan[0]), 'F2: el consejo de Lanudo cuenta la historia de un trofeo de guardián del guardado viejo con su nombre nuevo ("' + String(lan[0]).slice(0, 40) + '...")');
  // gastar y ganar: el talismán de la Cripta pide los 2 trofeos de guardián del bioma (los mismos campos de siempre)
  r = await E(pg, () => { const S = G.Save.data, A = G.Armor, p = G.ArmorData.piece('mn_cripta'); S.bossKills.karceron = 1; const before = A.costOK(A.cost(p, 0)); G.Minis.collectInsignia({ ins: G.Minis.D.centinela.ins.id, mid: 'centinela' });
    const mid = { c: S.insignias.centinela, e: S.insigniasEver.centinela, ok: A.costOK(A.cost(p, 0)) }; S.brasas += 5000; S.parts.wick = 500; S.parts.rare = 5; const cr = A.craft('mn_cripta'); return { before, mid, cr: !!(cr && cr.ok !== false), after: { a: S.insignias.alcaide, c: S.insignias.centinela, ea: S.insigniasEver.alcaide, ec: S.insigniasEver.centinela } }; });
  ok(!r.before && r.mid.c === 1 && r.mid.e === 1 && r.cr && r.after.a === 0 && r.after.c === 0 && r.after.ea === 1 && r.after.ec === 1, 'F2: un trofeo de guardián nuevo se suma al saldo viejo y el talismán de la Cripta gasta los 2 del bioma (saldo 0, acumulado intacto): ' + JSON.stringify(r));
  // sello, copias rotativas e import estricto con el guardado viejo
  r = await E(pg, fx => {
    const S = G.Save, K = S.KEYS; S.save(); const main = localStorage.getItem(S.KEY), rec = localStorage.getItem(K.rec);
    const o = { sealed: /,"_sum":"[0-9a-z]+\.[0-9a-z]+"\}$/.test(main) && !!S.readRaw(main).d, v: JSON.parse(main).v, recOk: !!rec && !!S.readRaw(rec).d };
    const imp = S.importText(fx.exp); o.imp = imp.ok; o.ins = JSON.stringify(S.data.insignias); o.insE = JSON.stringify(S.data.insigniasEver); o.owned = JSON.stringify(S.data.armor.owned);
    const t1 = S.exportText(), r1 = S.importText(t1); o.round = r1.ok && S.exportText() === t1;
    const bad = JSON.parse(JSON.stringify(S.data)); bad.insignias.carnero = -3; o.badRej = !S.importText('SWARM1:' + btoa(unescape(encodeURIComponent(JSON.stringify(bad))))).ok;
    const fut = JSON.parse(JSON.stringify(S.data)); fut.v = 14; o.futRej = !S.importText('SWARM1:' + btoa(unescape(encodeURIComponent(JSON.stringify(fut))))).ok;
    return o;
  }, FX);
  ok(r.sealed && r.v === 13 && r.recOk, 'F2: tras cargarlo se guarda sellado con _sum, sigue siendo v13 (opción A: sin subir versión) y la copia .reciente es válida');
  ok(r.imp && r.ins === JSON.stringify(raw0.insignias) && r.insE === JSON.stringify(raw0.insigniasEver) && r.owned === JSON.stringify(raw0.armor.owned) && r.round, 'F2: el texto SWARM1 exportado por el código de antes se importa (estricto) sin pérdida y la ida y vuelta es idéntica');
  ok(r.badRej && r.futRej, 'F2: el import estricto sigue rechazando Insignias negativas y la versión 14');
  // un v12 del mismo guardado (antes de v13, sin sello): migra a v13 y conserva las Insignias
  await E(pg, r => { const d = JSON.parse(r); delete d._sum; d.v = 12; delete d.daily; delete d.flags.migrated13; localStorage.clear(); localStorage.setItem('swarmhand.fusion.save', JSON.stringify(d)); }, FX.raw);
  await reload(pg, 'direct=1&speed=0');
  r = await E(pg, () => ({ v: G.Save.data.v, ins: G.Save.data.insignias, insE: G.Save.data.insigniasEver, bak: !!localStorage.getItem(G.Save.KEY + '.v12'), cnt: G.Minis.insigniaCount(), tro: G.Res.have('trofeos') }));
  ok(r.v === 13 && same(r.ins, raw0.insignias) && same(r.insE, raw0.insigniasEver) && r.bak && r.cnt === 4 && r.tro === 4, 'F2: el mismo guardado como v12 migra a v13 (copia .v12) con las Insignias intactas, que cuentan como trofeos de guardián (' + r.cnt + '/10, Trofeos ' + r.tro + ')');
  await done(pg, 'save2-f2');
}

// ---------------------------------------------------------------- Analítica con consentimiento (T-F1-01: src/track.js, track_ui.js)
async function track() {
  console.log('--- track: consentimiento, nada sale ni se guarda antes de aceptar, rechazo y retirada, zona europea, adaptador none, cola, esquema, sin datos personales');
  const b = await launch(), PH = 'https://ph.test', LSK = 'swarmhand.fusion.track';
  const KEYP = 'track=on&trackhost=' + encodeURIComponent(PH) + '&trackkey=phc_test';
  // contexto nuevo con interceptor de red: apunta toda petición a otro origen (y responde con los códigos de `codes`, luego 200)
  async function mkT(url, codes = []) {
    const ctx = await b.newContext({ viewport: { width: 844, height: 390 }, hasTouch: true, isMobile: true }), pg = await ctx.newPage(); pg.errs = []; pg.ctx = ctx; pg.ext = []; pg.bodies = []; pg.codes = codes;
    pg.on('console', m => { if (m.type() === 'error' && !/ph\.test|net::ERR|Failed to load resource/.test(m.text())) pg.errs.push(m.text()); }); pg.on('pageerror', e => pg.errs.push('PAGEERR ' + e.message));
    await ctx.route(u => new URL(u).origin !== new URL(base).origin, r => {
      const q = r.request(), cors = { 'access-control-allow-origin': '*', 'access-control-allow-headers': '*', 'access-control-allow-methods': 'POST,OPTIONS' };
      if (q.method() === 'OPTIONS') return r.fulfill({ status: 204, headers: cors });
      pg.ext.push(q.url()); try { pg.bodies.push(JSON.parse(q.postData() || 'null')); } catch (e) { pg.bodies.push(null); }
      return r.fulfill({ status: pg.codes.length ? pg.codes.shift() : 200, headers: cors, body: '{}' });
    });
    await pg.goto(`${base}/index.html?dev=1&nosw=1&${url}`); await sleep(pg, 600);
    return pg;
  }
  const ST = pg => E(pg, () => G.Track.state()), LS = pg => E(pg, k => localStorage.getItem(k), LSK);
  const evs = pg => E(pg, () => G.Track.recent(500));
  const names = a => a.map(x => x.e);

  // 1. Antes de aceptar: ninguna petición, nada en localStorage, el aviso está pendiente; la cola va solo en memoria
  let pg = await mkT(KEYP + '&cine=0');
  ok(await E(pg, () => G.state) === 'privacy' && await E(pg, () => G.TrackUI.isOpen()), 'sin título (?cine=0): el aviso sale antes de la aldea para una cuenta nueva');
  let s = await ST(pg);
  ok(s.consent === null && s.adapter === 'posthog' && s.available && (await LS(pg)) === null, 'antes de elegir: consent null, nada de analítica en localStorage');
  ok(names(await evs(pg)).join() === 'first_open,session_start', 'la cola previa (solo en memoria) lleva first_open y session_start en ese orden');
  await E(pg, () => G.Track.flush(true)); await sleep(pg, 200);
  ok(pg.ext.length === 0, 'antes de aceptar: 0 peticiones a otro origen (incluido flush forzado)');
  const r = await E(pg, () => { const a = G.TrackUI.rects; return { y: a.yes, n: a.no }; });
  ok(r.y.w === r.n.w && r.y.h === r.n.h && r.y.y === r.n.y, 'los dos botones del aviso tienen el mismo tamaño y la misma altura');
  ok(/18 años/.test(await E(pg, () => G.TrackUI.TEXT.es.yes)) && /18/.test(await E(pg, () => G.TrackUI.TEXT.en.yes)) && /IP/.test(await E(pg, () => G.TrackUI.TEXT.es.body[0])), 'aviso: botón "Acepto (tengo 18 años o más)" y mención de la IP');
  // 2. Aceptar con un toque en el botón; first_open/session_start salen con cohorte; fallo 500 y luego 200 = reintento y cola vacía
  pg.codes.push(500);
  await sleep(pg, 500); await tap(pg, 290, 434); await sleep(pg, 300);
  s = await ST(pg);
  ok(s.consent === true && s.cohort && s.day_n === 0 && await E(pg, () => G.state) === 'aldea', 'toque en "Acepto": consent true, cohorte de hoy, y se pasa a la aldea');
  const stored = JSON.parse(await LS(pg));
  ok(stored.consent === true && stored.pv === '2026-11-14a' && stored.sessions.length === 1 && stored.q.length >= 3, 'se guarda {consent, pv, cohorte, sesiones, cola} solo tras aceptar');
  const ev0 = await evs(pg);
  ok(names(ev0).join() === 'first_open,session_start,analytics_on' && ev0.every(e => e.p.pv === '2026-11-14a' && e.p.cohort && e.p.day_n === 0), 'first_open, session_start, analytics_on con pv y cohorte (day_n 0)');
  const f1 = await E(pg, () => G.Track.flush(true)); s = await ST(pg);
  ok(f1 === false && s.queued === 3 && pg.ext.length === 1, 'servidor 500: la cola se conserva (3) y se reintentará');
  const f2 = await E(pg, () => G.Track.flush(true)); s = await ST(pg);
  const body = pg.bodies[1];
  ok(f2 === true && s.queued === 0 && pg.ext.length === 2 && pg.ext.every(u => u === PH + '/batch/'), 'reintento con 200: lote enviado a /batch/ y cola vacía');
  ok(body && body.api_key === 'phc_test' && body.batch.length === 3 && body.batch.every(e => e.distinct_id === s.sid && e.properties.$process_person_profile === false && e.properties.$geoip_disable === true), 'lote PostHog: clave pública, distinct_id = id de sesión, sin perfil de persona, GeoIP apagado');
  // 3. Sin datos personales y esquema válido en lo enviado
  const flat = JSON.stringify(body);
  ok(!/@/.test(flat) && !/https?:\/\//.test(flat.replace(/\$lib/g, '')) && !/Mozilla|Chrome|Linux/.test(flat) && !/"(name|email|ip|ua|userAgent|screen|iid|nombre|correo)"/i.test(flat), 'payload sin correo, URL, user agent ni claves de datos personales');
  ok(await E(pg, () => G.Track.recent(500).every(e => G.Track.validate(e).length === 0)), 'esquema: todo evento de la cola valida contra G.Track.SCHEMA / COMMON');
  // 4. Recargar: otra sesión, sess_n sube, sin first_open; los ids de sesión se guardan en local (máx. 10)
  await pg.reload(); await sleep(pg, 600);
  const ev1 = await evs(pg), s1 = await ST(pg);
  ok(names(ev1).join() === 'session_start' && ev1[0].p.sess_n === '2' && s1.consent === true && s1.sessions.length === 2 && await E(pg, () => G.state) === 'aldea', 'recarga: session_start (sess_n 2) sin first_open ni aviso; 2 ids de sesión en local');
  // 5. Retirada en Ajustes por la pantalla: vacía la cola, no vuelve a preguntar, y nada sale
  await E(pg, () => { G.Aldea.open(false); G.Aldea.openPanel('settings'); }); await sleep(pg, 400);
  await E(pg, () => G.Panels.setTab(1)); { const r = await E(pg, () => G.Panels.setRects().sb.priv); await tap(pg, r.x + r.w / 2, r.y + r.h / 2); }   /* T-F1-08: Privacidad en la 2.ª página de Ajustes */ await sleep(pg, 300);
  ok(await E(pg, () => G.Panels.current()) === 'privacy', 'Ajustes > Privacidad abre la pantalla');
  await tap(pg, 480, 122); await sleep(pg, 300);
  s = await ST(pg);
  const st2 = JSON.parse(await LS(pg));
  ok(s.consent === false && s.queued === 0 && st2.consent === false && !st2.q && !st2.cohort && !st2.sessions, 'retirar el permiso: cola vacía y solo se guarda la elección');
  const n0 = pg.ext.length; await E(pg, () => { G.Track('fusion', { id: 'x', replaced: '', run_s: 1, first: false }); return G.Track.flush(true); }); await sleep(pg, 200);
  ok(pg.ext.length === n0 && (await ST(pg)).queued === 0, 'tras retirar: los eventos nuevos no se encolan ni salen');
  await pg.reload(); await sleep(pg, 600);
  ok((await ST(pg)).consent === false && await E(pg, () => G.state) === 'aldea' && names(await evs(pg)).length === 0, 'rechazo persistente: al recargar no se vuelve a preguntar y no se encola nada');
  await tap(pg, 480, 122).catch(() => {});
  await E(pg, () => { G.Aldea.open(false); G.Aldea.openPanel('settings'); }); await sleep(pg, 400); await E(pg, () => G.Panels.setTab(1)); { const r = await E(pg, () => G.Panels.setRects().sb.priv); await tap(pg, r.x + r.w / 2, r.y + r.h / 2); }   /* T-F1-08: Privacidad en la 2.ª página de Ajustes */ await sleep(pg, 300); await tap(pg, 480, 122); await sleep(pg, 300);
  s = await ST(pg); const st3 = JSON.parse(await LS(pg));
  ok(s.consent === true && st3.late === true && !names(await evs(pg)).includes('first_open') && names(await evs(pg)).includes('analytics_on'), 'dar el permiso desde Ajustes: consent true, marcado late (fuera de la retención), analytics_on con where=ajustes');
  ok(await E(pg, () => G.Track.recent(5).find(e => e.e === 'analytics_on').p.where) === 'ajustes', 'analytics_on lleva where=ajustes');
  // 6. wipe
  await E(pg, () => G.Track.wipe()); ok((await LS(pg)) === null && (await ST(pg)).consent === null, 'wipe(): borra la clave de localStorage y vuelve a "sin elegir"');
  await pg.reload(); await sleep(pg, 600);
  ok(names(await evs(pg))[0] === 'first_open', 'tras wipe la siguiente carga vuelve a dar first_open');
  ok(pg.errs.length === 0, 'track (consentimiento): 0 errores de consola' + (pg.errs.length ? ' -> ' + pg.errs[0] : '')); await pg.close(); await pg.ctx.close();

  // 7. Rechazo con el botón "No, gracias": cola borrada, nada sale, no se vuelve a preguntar
  pg = await mkT(KEYP + '&cine=0'); await sleep(pg, 500); await tap(pg, 670, 434); await sleep(pg, 300);
  s = await ST(pg); const sn = JSON.parse(await LS(pg));
  ok(s.consent === false && s.queued === 0 && sn.consent === false && !sn.q && await E(pg, () => G.state) === 'aldea', '"No, gracias": cola borrada y solo se guarda la elección');
  await E(pg, () => G.Track.flush(true)); await pg.reload(); await sleep(pg, 600);
  ok(pg.ext.length === 0 && (await ST(pg)).consent === false && await E(pg, () => G.state) === 'aldea', 'rechazo persistente y 0 peticiones');
  await pg.close(); await pg.ctx.close();
  // Esc también es "No, gracias"
  pg = await mkT(KEYP + '&cine=0'); await sleep(pg, 600); await pg.keyboard.press('Escape'); await sleep(pg, 300);
  ok((await ST(pg)).consent === false, 'Esc en el aviso equivale a "No, gracias"'); await pg.close(); await pg.ctx.close();

  // 8. Zona horaria europea: ni aviso ni envío ni almacenamiento
  pg = await mkT(KEYP + '&cine=0&tracktz=Europe/Madrid');
  s = await ST(pg);
  ok(!s.available && s.reason === 'europa' && s.adapter === 'none' && await E(pg, () => G.state) === 'aldea' && !(await E(pg, () => G.Track.noticeDue())), 'zona horaria europea: sin aviso y adaptador none');
  const cb = await E(pg, () => { let called = 0; G.Track.prompt(() => called++); return { called, ok: G.Track.consent(true, 'ajustes') }; });
  await E(pg, () => G.Track.flush(true)); await sleep(pg, 200);
  ok(cb.called === 1 && cb.ok === false && (await LS(pg)) === null && pg.ext.length === 0, 'zona europea: consent() se ignora, nada en localStorage y 0 peticiones');
  ok(await E(pg, () => ['Europe/Paris', 'Atlantic/Canary', 'Atlantic/Reykjavik'].every(z => G.Track.isEurope(z)) && !G.Track.isEurope('America/Bogota') && !G.Track.isEurope('Atlantic/Bermuda')), 'lista de zonas europeas (Europe/*, Canarias, Madeira, Azores, Feroe, Reikiavik, Svalbard)');
  await pg.close(); await pg.ctx.close();

  // 9. Producción por defecto: adaptador none, bots y ?dev=1 apagados, 0 peticiones; nada guardado
  for (const [url, why] of [['track=0&' + KEYP.replace('track=on&', ''), '?track=0']]) {
    pg = await mkT(url + '&cine=0'); s = await ST(pg);
    ok(s.adapter === 'none' && !s.available, `${why}: adaptador none y sin aviso (${s.reason})`);
    await E(pg, () => { G.Track.consent(true); G.Track('run_start', {}); return G.Track.flush(true); }); await sleep(pg, 200);
    ok(pg.ext.length === 0 && (await LS(pg)) === null && s.queued === 0, `${why}: 0 peticiones y nada en localStorage`);
    await pg.close(); await pg.ctx.close();
  }
  pg = await mkT('cine=0'); s = await ST(pg);   // ?dev=1 sin track=: apagado
  ok(s.adapter === 'none' && !s.available, '?dev=1 / bot sin track=log|on: apagada (' + s.reason + ')'); await pg.close(); await pg.ctx.close();
  {   // sin ?dev=1 y sin forzar, aunque el navegador sea un bot: adaptador none
    const ctx = await b.newContext({ viewport: { width: 844, height: 390 } }), p2 = await ctx.newPage(); const ext = [];
    await ctx.route(u => new URL(u).origin !== new URL(base).origin, r => { ext.push(r.request().url()); r.abort(); });
    await p2.goto(`${base}/index.html?nosw=1&track=on&trackhost=${encodeURIComponent(PH)}&trackkey=phc_test&cine=0`); await sleep(p2, 600);
    const s2 = await E(p2, () => G.Track.state());
    ok(s2.adapter === 'none' && s2.reason === 'bot' && ext.length === 0 && (await E(p2, k => localStorage.getItem(k), LSK)) === null && await E(p2, () => G.state) === 'aldea', 'URL de producción en un bot: ?track=on sin ?dev=1 no activa nada (adaptador none, 0 peticiones)');
    await p2.close(); await ctx.close();
  }
  pg = await mkT('track=on&cine=0'); s = await ST(pg);   // sin host ni clave: none
  ok(s.adapter === 'none', 'adaptador posthog sin host ni clave pública phc_: se degrada a none'); await pg.close(); await pg.ctx.close();
  const cfgSrc = fs.readFileSync(path.join(ROOT, 'games/card-swarm/src/track.js'), 'utf8');
  ok(/T\.CFG = \{ adapter: 'none', host: '', key: '', sample: 1 \};/.test(cfgSrc) && !/phc_[A-Za-z0-9]{8}/.test(cfgSrc) && !/phx_[A-Za-z0-9]{8}/.test(cfgSrc), 'código fuente: adaptador por defecto none, sin clave (ni phx_)');

  // 10. Cola con tope (300), conserva first_open y run_end; límite por sesión
  pg = await mkT('track=log&cine=0'); await E(pg, () => { G.Track.CFG.sessionCap = 1e9; G.Track.consent(true, 'aviso'); });
  const q = await E(pg, () => { for (let i = 0; i < 400; i++) G.Track(i === 3 ? 'run_end' : 'fusion', i === 3 ? { biome: 'bosque', peril: 1, mode: 'normal', result: 'death', cause: 'worm', dur_s: 1, level: 1, kills: '0', boss_reached: false, first_card_s: 1, fusions: 0, powers: '', run_n: '1' } : { id: 'x' + i, replaced: '', run_s: i, first: false }); const r = G.Track.recent(1000); return { n: r.length, fo: r.some(e => e.e === 'first_open'), re: r.some(e => e.e === 'run_end'), stored: JSON.parse(localStorage.getItem('swarmhand.fusion.track')) }; });
  await sleep(pg, 100);
  ok(q.n === 300 && q.fo && q.re, `cola: tope de 300 eventos, se conservan first_open y run_end (n=${q.n})`);
  const q2 = await E(pg, () => { G.Track.CFG.sessionCap = 200; let k = 0; const before = G.Track.recent(1000).length; for (let i = 0; i < 50; i++) G.Track('fusion', { id: 'y', replaced: '', run_s: 1, first: false }); return { added: G.Track.recent(1000).length - before }; });
  ok(q2.added === 0, 'límite de seguridad por sesión (200): pasado el tope solo entran run_end, boss_end y session_end');
  await pg.close(); await pg.ctx.close();

  // 11. Una expedición completa con muerte (adaptador log, sin red): run_start -> run_end(death, cause), jefe, errores saneados, ningún envío en combate
  pg = await mkT('track=log&direct=1&seed=7&cine=0'); await E(pg, () => G.TrackUI.choose(true));   // el callback del aviso lanza la partida directa
  await E(pg, () => { for (let i = 0; i < 3000 && G.state !== 'play'; i++) { if (G.state === 'cards') { const O = G.Cards.off; if (O) { O.modal = null; if (O.mode === 'level') G.Cards.skip(); else G.Cards.pick(0); if (G.state === 'cards') G.state = 'play'; } } G.step(); } });
  ok(await E(pg, () => G.state) === 'play', 'partida en marcha (?direct=1)');
  const gate = await E(pg, async () => { G.Track.CFG.flushMs = 1; const r1 = await G.Track.flush(false); return { r1, q: G.Track.state().queued }; });
  ok(gate.r1 === false && gate.q > 0 && (await E(pg, () => G.Track.log.length)) === 0, 'con G.state en expedición, flush() sin forzar no envía nada');
  await E(pg, () => { for (let i = 0; i < 300; i++) G.step(); const p = G.player; G.lastHurtSrc = 'worm'; p.hp = 0; p.dead = true; for (let i = 0; i < 400 && G.state !== 'gameover'; i++) G.step(); });
  ok(await E(pg, () => G.state) === 'gameover', 'la partida termina en gameover');
  await E(pg, () => G.Track.flush(true)); await sleep(pg, 100);
  const lg = await E(pg, () => G.Track.log), nm = lg.map(x => x.e);
  ok(nm.indexOf('run_start') > 0 && nm.indexOf('run_end') > nm.indexOf('run_start'), 'run_start antes de run_end (' + nm.join(',') + ')');
  const re = lg.find(x => x.e === 'run_end'), rs = lg.find(x => x.e === 'run_start');
  ok(re.p.result === 'death' && re.p.cause === 'worm' && re.p.dur_s >= 5 && re.p.level >= 1 && re.p.run_n === '1' && rs.p.biome === 'bosque' && rs.p.mode === 'normal' && rs.p.peril === 1, 'run_end result=death con cause no vacía; run_start con bioma, modo y Peligro');
  ok((await E(pg, () => G.Track.log.every(e => G.Track.validate(e).length === 0))) && lg.every(e => e.p.god === false && e.p.sv === 1 && e.p.build && e.p.q), 'esquema válido: sv, build, god, q presentes en todos los eventos enviados');
  // errores saneados y con tope de 3 por sesión
  await E(pg, () => { for (let i = 0; i < 10; i++) Diag.log('fallo en https://x.y/z/a.js?token=abc123 C:\\Users\\yo\\a.js correo a@b.com num 123456789 ' + (i % 5), { src: 'http://h/src/hud.js', line: 3 }); G.Track.flush(true); }); await sleep(pg, 100);
  const er = await E(pg, () => G.Track.log.filter(e => e.e === 'error'));
  ok(er.length === 3 && er.every(e => !/https?:|@|Users|123456789|token/.test(e.p.msg) && e.p.msg.length <= 120 && e.p.src === 'hud.js'), 'error: como mucho 3 por sesión, sin URL, ruta, correo ni números largos en msg (' + er.length + ')');
  // cerrar a mitad de expedición y recargar: run_end con result=abandon
  await E(pg, () => { G.state = 'aldea'; G.Aldea.open(false); });
  await pg.goto(`${base}/index.html?dev=1&nosw=1&track=log&direct=1&seed=7&cine=0`); await sleep(pg, 700);
  await pg.goto(`${base}/index.html?dev=1&nosw=1&track=log&cine=0`); await sleep(pg, 700);
  const ab = (await evs(pg)).filter(e => e.e === 'run_end');
  ok(ab.length >= 1 && ab.some(e => e.p.result === 'abandon' && e.p.cause === 'quit'), 'cerrar en mitad de expedición y recargar: run_end con result=abandon');
  ok(pg.errs.length === 0, 'track (expedición): 0 errores de consola' + (pg.errs.length ? ' -> ' + pg.errs[0] : '')); await pg.close(); await pg.ctx.close();

  // 12. Jefe: boss_start antes de boss_end, mismo boss y Peligro
  pg = await mkT('track=log&boss=pastor&peligro=2&nointro=1&seed=3&cine=0'); await E(pg, () => G.TrackUI.choose(true));
  await E(pg, () => { for (let i = 0; i < 3000 && !(G.Boss.active || G.Boss.e); i++) { if (G.state === 'cards') { const O = G.Cards.off; if (O) { O.modal = null; if (O.mode === 'level') G.Cards.skip(); else G.Cards.pick(0); if (G.state === 'cards') G.state = 'play'; } } G.step(); } for (let i = 0; i < 200; i++) G.step(); G.finish(false); G.Track.flush(true); }); await sleep(pg, 100);
  const bl = await E(pg, () => G.Track.log.map(e => ({ e: e.e, boss: e.p.boss, peril: e.p.peril, result: e.p.result })));
  const bi = bl.findIndex(x => x.e === 'boss_start'), be = bl.findIndex(x => x.e === 'boss_end');
  ok(bi >= 0 && be > bi && bl[bi].boss === 'pastor' && bl[be].boss === 'pastor' && bl[bi].peril === 2 && bl[be].peril === 2 && bl[be].result === 'quit', 'boss_start antes de boss_end, mismo jefe y Peligro (' + JSON.stringify(bl.slice(bi, be + 1)) + ')');
  await pg.close(); await pg.ctx.close();

  // 13. Retención: day_return una sola vez por día, no cuenta el mismo día
  pg = await mkT('track=log&cine=0&trackdate=2026-11-14'); await E(pg, () => G.Track.consent(true, 'aviso'));
  await pg.goto(`${base}/index.html?dev=1&nosw=1&track=log&cine=0&trackdate=2026-11-14`); await sleep(pg, 600);
  ok(!names(await evs(pg)).includes('day_return'), 'mismo día: sin day_return');
  await pg.goto(`${base}/index.html?dev=1&nosw=1&track=log&cine=0&trackdate=2026-11-15`); await sleep(pg, 600);
  let dr = (await evs(pg)).filter(e => e.e === 'day_return');
  ok(dr.length === 1 && dr[0].p.day_n === 1 && dr[0].p.cohort === '2026-11-14', 'reloj +1 día: day_return con day_n = 1');
  await pg.goto(`${base}/index.html?dev=1&nosw=1&track=log&cine=0&trackdate=2026-11-15`); await sleep(pg, 600);
  dr = (await evs(pg)).filter(e => e.e === 'day_return');
  ok(dr.length === 1, 'segunda sesión del mismo día: day_return no se repite');
  await pg.close(); await pg.ctx.close();

  // 14. Coste en el bucle y archivos estáticos (política en español e inglés, enlazada y en el precache)
  pg = await mkT('track=log&cine=0'); await E(pg, () => G.Track.consent(true, 'aviso'));
  const perf = await E(pg, () => { G.Track.CFG.sessionCap = 1e9; const t0 = performance.now(); for (let i = 0; i < 20000; i++) G.Track('fusion', { id: 'x', replaced: '', run_s: 1, first: false }); return (performance.now() - t0) / 20000; });
  ok(perf < 0.05, `G.Track() es O(1): ${(perf * 1000).toFixed(1)} us por llamada`); await pg.close(); await pg.ctx.close();
  const G_DIR = path.join(ROOT, 'games/card-swarm'), swt = fs.readFileSync(path.join(G_DIR, 'sw.js'), 'utf8');
  const es = fs.readFileSync(path.join(G_DIR, 'privacidad.html'), 'utf8'), en = fs.readFileSync(path.join(G_DIR, 'privacy.html'), 'utf8');
  ok(/Bogot/.test(es) && /Colombia/.test(es) && /mailto:/.test(es) && /18 años/.test(es) && /Superintendencia/.test(es) && !/<script/i.test(es), 'privacidad.html: responsable, Colombia, contacto, menores de 18 y SIC; sin scripts');
  ok(/Bogot/.test(en) && /mailto:/.test(en) && /under 18/.test(en) && !/<script/i.test(en) && /privacidad\.html/.test(en), 'privacy.html (inglés) equivalente y enlazada con la española');
  ok(/privacidad\.html/.test(swt) && /privacy\.html/.test(swt) && /src\/track\.js/.test(swt) && /src\/track_ui\.js/.test(swt), 'precache: track.js, track_ui.js y las dos páginas de la política');
  const src = ['index.html', 'sw.js', ...fs.readdirSync(path.join(G_DIR, 'src')).map(f => 'src/' + f)].map(f => fs.readFileSync(path.join(G_DIR, f), 'utf8')).join('\n');
  ok(!/@gmail\.com/.test(src), 'el correo de contacto solo está en las páginas de la política (no en el código del juego)');
  await b.close();
}

// ---------------------------------------------------------------- Primera sesión (T-F1-02): src/fte.js, tarjeta "Antes de salir", avisos, aldea por pasos
const mkV = async (b, url, w = 844, h = 390) => {
  const ctx = await b.newContext({ viewport: { width: w, height: h }, hasTouch: true, isMobile: true }), pg = await ctx.newPage(); pg.errs = []; pg.ctx = ctx; pg.ext = [];
  pg.on('console', m => { if (m.type() === 'error' && !/ph\.test|net::ERR|Failed to load resource/.test(m.text())) pg.errs.push(m.text()); }); pg.on('pageerror', e => pg.errs.push('PAGEERR ' + e.message));
  await ctx.route(u => new URL(u).origin !== new URL(base).origin, r => { pg.ext.push(r.request().url()); return r.fulfill({ status: 200, headers: { 'access-control-allow-origin': '*', 'access-control-allow-headers': '*' }, body: '{}' }); });
  await pg.goto(`${base}/index.html?dev=1&nosw=1&${url}${WX}`); await sleep(pg, 700);
  return pg;
};
// colocar la partida en una expedición "a mano": pasos de simulación con joystick opcional
const fStep = (pg, n, joy) => E(pg, ([n, joy]) => { for (let i = 0; i < n; i++) { if (joy) G.input.joy = { active: true, id: 1, ox: 100, oy: 400, x: joy[0], y: joy[1] }; else G.input.joy = { active: false, id: null, ox: 0, oy: 0, x: 0, y: 0 }; G.step(); } G.input.joy = { active: false, id: null, ox: 0, oy: 0, x: 0, y: 0 }; }, [n, joy || null]);
const fteState = pg => E(pg, () => JSON.parse(JSON.stringify(G.Save.data.flags.fte)));
// cuenta nueva sin intro: cierra la tarjeta de privacidad (si salió) y lanza la 1.ª expedición como lo hace la tarjeta
const startFirst = pg => E(pg, () => { if (G.TrackUI.isOpen()) G.TrackUI.choose(true); G.Fte.launchFirst(); });

async function fte() {
  console.log('--- fte: primera sesión (intro completa, tarjeta Antes de salir, salida directa, avisos, aldea por pasos, cuentas existentes, ?fte=0)');
  const b = await launch(), PH = 'https://ph.test', KEYP = 'track=on&trackhost=' + encodeURIComponent(PH) + '&trackkey=phc_test';
  // 1-4, 11, 12. Flujo completo con un toque por escena de la intro; red vigilada
  let pg = await mkV(b, KEYP + '&cine=1&reset=1');
  ok((await E(pg, () => G.state)) === 'title', 'cuenta nueva con ?cine=1: arranca en el título');
  await sleep(pg, 600); await tap(pg, 480, 300);
  ok((await E(pg, () => G.state)) === 'cine', 'el toque del título lleva a la intro');
  const snap0 = await TC.snap(pg, 1);
  ok(!snap0.texts.some(t => /SALTAR/.test(t.s)) && (await E(pg, () => G.Cine.info().locked)), 'la intro se reproduce completa y bloqueada la 1.ª vez (sin SALTAR)');
  const tI = Date.now(); let n = 0;
  while ((await E(pg, () => G.state)) === 'cine' && Date.now() - tI < 70000) { await tap(pg, 480, 270); n++; await sleep(pg, 370); }
  ok((await E(pg, () => G.state)) === 'privacy', 'al acabar la intro aparece la tarjeta de privacidad (no la aldea) tras ' + ((Date.now() - tI) / 1000).toFixed(1) + ' s y ' + n + ' toques');
  await sleep(pg, 600);
  ok(pg.ext.length === 0 && (await E(pg, () => localStorage.getItem('swarmhand.fusion.track'))) === null, 'tarjeta abierta sin contestar: 0 peticiones y nada de analítica en localStorage');
  const card = await E(pg, () => ({ r: G.TrackUI.rects, t: G.TrackUI.TEXT.es })), snapC = await TC.snap(pg, 2);
  ok(card.r.yes.w === card.r.no.w && card.r.yes.h === card.r.no.h && card.r.yes.y === card.r.no.y && snapC.texts.some(t => /ANTES DE SALIR|BEFORE YOU GO/.test(t.s)) && /Acepto \(tengo 18 años o más\)/.test(card.t.yes) && card.t.no === 'No, gracias', 'tarjeta "Antes de salir": dos botones del mismo tamaño y altura; textos de consentimiento intactos');
  const iss = TC.analyze(snapC, { minSize: TC.MIN_MENU }); ok(iss.length === 0, 'tarjeta: ' + snapC.texts.length + ' textos, ' + iss.length + ' problemas' + (iss.length ? ' -> ' + iss.slice(0, 3).map(i => i.msg).join(' | ') : ''));
  const tT = Date.now(); await tap(pg, 290, 434);   // botón izquierdo: "Acepto"
  const reached = await waitState(pg, 'play', 6000), msPlay = Date.now() - tT;
  const info = await E(pg, () => ({ m: G.mode, bio: G.curBiome, len: G.RUN_LEN / 60000, pel: G.peligro, anch: G.Save.data.anchors.join(), f: G.Save.data.flags.fte }));
  ok(reached && msPlay <= 6000 && info.m === 'run' && info.bio === 'bosque' && info.len === 9 && info.pel === 1 && info.anch === 'spark', `1 toque (aceptar) y ${msPlay} ms hasta el combate: Bosque, Normal 9, Peligro I, ancla Chispa`);
  ok(info.f.priv === 'on' && info.f.step === 'run1' && info.f.introTry === 1, 'la elección queda guardada (priv on) y la salida es la expedición 1');
  const lg = await E(pg, () => { G.Track.flush(true); return G.Track.state(); });
  ok(lg.consent === true && lg.adapter === 'posthog', 'aceptar activa el consentimiento del aviso (adaptador de pruebas)');
  await done(pg, 'fte-flujo-on');
  // 4. SOLO en el dispositivo: 0 peticiones en toda la expedición
  pg = await mkV(b, KEYP + '&cine=0&reset=1');
  await E(pg, () => { G.Fte.start(); }); await sleep(pg, 600);
  await tap(pg, 670, 434); ok(await waitState(pg, 'play', 3000), 'botón "No, gracias": también lanza la 1.ª expedición');
  await sleep(pg, 4000); await E(pg, () => G.Track.flush(true)); await sleep(pg, 300);
  const f1 = await fteState(pg);
  ok(f1.priv === 'off' && pg.ext.length === 0 && (await E(pg, () => G.Track.state().consent)) === false, JSON.stringify([f1.priv, pg.ext, await E(pg, () => G.Track.state().consent)]) + 'rechazar: priv off, consent false y 0 peticiones de red en toda la expedición');
  await done(pg, 'fte-flujo-off');
  // 5, 6. Avisos en orden, una vez, cerrados por acción; recarga a mitad
  pg = await mkV(b, 'track=log&cine=0&reset=1&speed=0&seed=11'); await startFirst(pg);
  await fStep(pg, 30);
  const hint = () => E(pg, () => G.Fte.current());
  ok((await hint()) === 'move', 'aviso 1 "move" al empezar: ' + (await hint()));
  let sn = await TC.snap(pg, 1); ok(sn.texts.some(t => /Arrastra el pulgar a la izquierda para moverte/.test(t.s) && t.size >= 15.9), 'texto táctil del aviso a 16 px y sin teclas');
  await fStep(pg, 100, [1, 0]); ok((await hint()) !== 'move', 'se cierra al acumular 1,5 s de movimiento (por acción)');
  await E(pg, () => { const p = G.player; G.Combat.dropGem(p.x + 30, p.y, 'xp', 1); }); await fStep(pg, 3);
  ok((await hint()) === 'gems', 'aviso 2 "gems" cuando hay una gema en el suelo');
  const bar0 = await E(pg, () => G.Fte.xpBig()); ok(bar0 === true, 'mientras dura el aviso, la barra de experiencia es más alta');
  for (let i = 0; i < 3; i++) { await E(pg, () => { G.player.xp += 0.5; }); await fStep(pg, 2); }
  ok((await hint()) !== 'gems' && !(await E(pg, () => G.Fte.xpBig())), 'recoger 3 gemas cierra "gems" y la barra vuelve a su altura');
  await E(pg, () => { G.player.level = 2; G.pendingLevels = 1; }); await fStep(pg, 2); await sleep(pg, 200);
  const pk = await E(pg, () => ({ st: G.state, h: G.Save.data.flags.fte.hints.pick, ok: !!G.Cards.off.fteHint }));
  sn = await TC.snap(pg, 2);
  ok(pk.st === 'cards' && pk.h === 1 && pk.ok && sn.texts.some(t => /Elige una carta\. Si pone FUSIÓN/.test(t.s)), 'aviso 3 "pick": subtítulo en la 1.ª oferta de nivel');
  ok(TC.analyze(sn, { minSize: TC.MIN_MENU }).filter(i => i.k === 'solape').length === 0, '1.ª oferta: el título "¡NIVEL 2!" ya no se pisa con los huecos de poderes');
  await E(pg, () => { G.Fusion.grant('vapor', 1); G.Cards.closeOffer(); }); await fStep(pg, 3);
  ok((await hint()) === 'power', 'aviso 4 "power" al volver al combate con el primer poder');
  sn = await TC.snap(pg, 1); ok(sn.texts.some(t => /Tu poder está listo: tócalo \(abajo a la derecha\)/.test(t.s)), 'texto del aviso "power" (táctil)');
  await E(pg, () => { const p = G.player; G.player.actives[0].uses = 1; }); await fStep(pg, 2);   // (el uso real depende de que haya objetivo en rango; aquí se fija el contador que lee el aviso)
  ok((await hint()) !== 'power', 'usar el poder (uses > 0) cierra el aviso');
  const log = await E(pg, async () => { await G.Track.flush(true); return G.Track.log.filter(e => e.e === 'hint_shown' || e.e === 'hint_done').map(e => e.e + ':' + e.p.id + (e.p.by ? ':' + e.p.by : '')); });
  const order = log.filter(x => x.startsWith('hint_shown')).map(x => x.split(':')[1]);
  ok(order.join() === 'move,gems,pick,power' && log.filter(x => x.startsWith('hint_done')).length >= 4, 'analítica: hint_shown en orden move,gems,pick,power y un hint_done por aviso (' + log.length + ' eventos)');
  // recarga a mitad de la 1.ª expedición: no se repiten
  await pg.goto(`${base}/index.html?dev=1&nosw=1&track=log&cine=0&speed=0`); await sleep(pg, 700);
  await E(pg, () => { if (G.TrackUI.isOpen()) G.TrackUI.choose(false); G.Base.launch(); }); await fStep(pg, 600);
  const hs = await E(pg, () => ({ cur: G.Fte.current(), h: JSON.stringify(G.Save.data.flags.fte.hints) }));
  ok(hs.cur !== 'move' && /"move":1/.test(hs.h), 'recargar a mitad de la 1.ª expedición: el aviso "move" no se repite (' + hs.h + ')');
  await done(pg, 'fte-avisos');
  // 7, 8. Aldea por pasos y abandono antes de 60 s
  pg = await mkV(b, 'track=log&cine=0&reset=1&speed=0'); await startFirst(pg); await fStep(pg, 120);
  await E(pg, () => G.finish(false)); await sleep(pg, 100);
  let fs1 = await fteState(pg); ok(fs1.runs === 0 && fs1.step === 'run1', 'abandonar antes de 60 s no adelanta NPC (runs ' + fs1.runs + ')');
  const NPCS = ['lanudo', 'grum', 'vesper', 'ulalume', 'rufo', 'castana'];
  const vis = (runs) => E(pg, ([runs, ids]) => { const f = G.Save.data.flags.fte; f.runs = runs; f.step = runs >= 4 ? 'done' : 'village'; G.Aldea.open(true); const out = []; ids.forEach(id => { G.Aldea.pos.x = 5; G.Aldea.pos.y = 300; G.Aldea.goto(id); if (G.Aldea.state().target === id) out.push(id); }); return out.join(); }, [runs, NPCS]);
  const exp = { 1: 'lanudo', 2: 'lanudo,grum,vesper', 3: 'lanudo,grum,vesper,ulalume,rufo', 4: NPCS.join() };
  for (const r of [1, 2, 3, 4]) { const got = await vis(r); ok(got.split(',').sort().join() === exp[r].split(',').sort().join(), `tras la salida ${r} se pueden tocar: ${got}`); }
  await E(pg, () => { G.finish; }); 
  // salida >= 60 s cuenta
  await E(pg, () => { const f = G.Save.data.flags.fte; f.runs = 0; f.step = 'run1'; f.ann = 0; G.launchReq = null; G.startGame(); G.runT = G.time = 61000; G.finish(false); });
  fs1 = await fteState(pg); ok(fs1.runs === 1 && fs1.step === 'village', 'una salida de 61 s cuenta para presentar NPC');
  const toast = await E(pg, () => { G.Aldea.open(true); return G.Fte.data().ann; }); ok(toast === 1, 'la llegada se anuncia una vez (ann ' + toast + ')');
  const ar = await E(pg, () => G.Fte.arrival()); ok(ar === null, 'y no se repite al volver a abrir la aldea');
  await done(pg, 'fte-aldea');
  // 9. Guardados v9..v12 con progreso: legacy, aldea completa, sin tarjeta ni avisos
  for (const v of [9, 10, 11, 12]) {
    pg = await mkV(b, 'track=log&cine=0&reset=1&speed=0');
    await E(pg, v => { const d = JSON.parse(JSON.stringify(G.Save.data)); d.v = v; d.runs = 3; d.brasas = 120; delete d.flags.fte; if (v < 12) { delete d.cine; } localStorage.setItem('swarmhand.fusion.save', JSON.stringify(d)); }, v);
    await pg.goto(`${base}/index.html?dev=1&nosw=1&track=log&cine=0&speed=0`); await sleep(pg, 700);
    const lg2 = await E(pg, () => ({ f: G.Save.data.flags.fte, eng: G.Fte.engaged(), start: G.Fte.shouldStart() }));
    await E(pg, () => { if (G.TrackUI.isOpen()) G.TrackUI.choose(false); G.startGame(); }); await fStep(pg, 300);
    const got = await vis(0).catch(() => '');
    ok(lg2.f.legacy === 1 && lg2.f.step === 'done' && !lg2.eng && !lg2.start && (await E(pg, () => G.Fte.current())) === null, `guardado v${v} con progreso: legacy, sin tarjeta del flujo nuevo ni avisos`);
    ok(got.split(',').length === 6, `guardado v${v}: aldea completa (${got})`);
    await done(pg, 'fte-legacy-v' + v);
  }
  // cuenta con introSeen y runs 0: se trata como nueva
  pg = await mkV(b, 'track=log&cine=0&reset=1&speed=0');
  await E(pg, () => { const d = JSON.parse(JSON.stringify(G.Save.data)); d.cine.introSeen = true; delete d.flags.fte; localStorage.setItem('swarmhand.fusion.save', JSON.stringify(d)); });
  await pg.goto(`${base}/index.html?dev=1&nosw=1&track=log&cine=0&speed=0`); await sleep(pg, 700);
  const nw = await E(pg, () => ({ f: G.Save.data.flags.fte, start: G.Fte.shouldStart() })); ok(!nw.f.legacy && nw.f.step === '' && nw.start, 'introSeen con 0 salidas: cuenta nueva (empieza en la tarjeta)'); await done(pg, 'fte-introseen');
  // 10. ?fte=0
  pg = await mkV(b, 'track=log&cine=0&reset=1&speed=0&fte=0');
  await E(pg, () => { if (G.TrackUI.isOpen()) G.TrackUI.choose(false); G.startGame(); }); await fStep(pg, 300);
  const o = await E(pg, () => ({ en: G.Fte.enabled(), st: G.Fte.shouldStart(), cur: G.Fte.current() }));
  sn = await TC.snap(pg, 1); ok(!o.en && !o.st && o.cur === null && sn.texts.some(t => /Las cartas son infusiones/.test(t.s)), '?fte=0 restaura el flujo antiguo (ayuda de siempre, sin avisos nuevos)');
  await done(pg, 'fte-off');
  // 12. Cerrar a mitad de la intro: el 2.º intento es saltable
  pg = await mkV(b, 'cine=1&reset=1'); await sleep(pg, 600); await tap(pg, 480, 300); await sleep(pg, 1500);
  await pg.goto(`${base}/index.html?dev=1&nosw=1&cine=1`); await sleep(pg, 900); await tap(pg, 480, 300); await sleep(pg, 1200);
  const sk = await E(pg, () => ({ st: G.state, locked: G.Cine.info() && G.Cine.info().locked, tried: G.Fte.introTried() }));
  ok(sk.st === 'cine' && sk.locked === false && sk.tried, 'cerrar a mitad de la intro: la segunda vez es saltable (sin bloqueo)'); await done(pg, 'fte-intro2');
  // 11. Tiempos con un recolector (simulación de pasos): 1.ª oferta <= 20 s y 1.ª fusión <= 25 s de combate
  pg = await mkV(b, 'track=log&cine=0&reset=1&speed=0&seed=77'); await startFirst(pg);
  const tm = await E(pg, () => {
    const out = { offer: null, fuse: null }; let n = 0;
    while (n++ < 60 * 90 && !(out.offer && out.fuse)) {
      const p = G.player, gs = G.gems.filter(g => g.kind === 'xp');
      let tx = 0, ty = 0, bd = 1e9; gs.forEach(g => { const d = Math.hypot(g.x - p.x, g.y - p.y); if (d < bd) { bd = d; tx = g.x - p.x; ty = g.y - p.y; } });
      G.enemies.forEach(e => { const d = Math.hypot(e.x - p.x, e.y - p.y); if (d < 70) { tx -= (e.x - p.x) * 3; ty -= (e.y - p.y) * 3; } });
      const l = Math.hypot(tx, ty) || 1; G.input.joy = { active: gs.length > 0 || Math.hypot(tx, ty) > 0, id: 1, ox: 100, oy: 400, x: tx / l, y: ty / l };
      if (G.state === 'cards') { const O = G.Cards.off; if (O && O.mode === 'level') { if (out.offer == null) out.offer = (G.time - G.t0) / 1000; const i = O.cards.findIndex(id => G.Fusion.optionsFor(G.Cards.def(id).tag).length); if (i >= 0) { const fo = G.Fusion.optionsFor(G.Cards.def(O.cards[i]).tag)[0]; G.Fusion.fuse(fo.recipe, fo.slot, null, O.cards[i], () => G.Cards.closeOffer()); if (out.fuse == null && G.Fusion.fused) out.fuse = (G.time - G.t0) / 1000; } else G.Cards.pick(0); if (G.Cards.off) { G.Cards.off.modal = null; if (G.Cards.off.mode === 'level') G.Cards.skip(); } if (G.state === 'cards') G.state = 'play'; } }
      G.step(); if (G.player.dead) { out.dead = (G.time - G.t0) / 1000; break; }
    }
    return out;
  });
  ok(tm.offer != null && tm.offer <= 20, `bot recolector: 1.ª oferta de carta a los ${tm.offer == null ? '?' : tm.offer.toFixed(1)} s de combate (<= 20 s)${tm.dead ? ' [murió a ' + tm.dead.toFixed(0) + ' s]' : ''}`);
  ok(tm.fuse != null && tm.fuse <= 25, `bot recolector: 1.ª fusión a los ${tm.fuse == null ? '?' : tm.fuse.toFixed(1)} s de combate (<= 25 s)`);
  await done(pg, 'fte-tiempos'); await b.close();
}

// ---------------------------------------------------------------- Pantalla de fin (T-F1-04): src/endinfo.js y src/base.js
async function end() {
  console.log('--- end: pantalla de fin (récord, objetivos, consejo, variantes, detalle, botón con retardo)');
  const b = await launch();
  const fin = (pg, how) => E(pg, how => { G.step(); G.Loot.run.dmgBy = how && how.dmg || G.Loot.run.dmgBy; if (how && how.t) { G.runT = G.time = how.t * 1000; } if (how && how.die) { G.player.hp = 0; G.player.dead = true; } G.finish(!!(how && how.won)); }, how || {});
  const txt = async pg => (await TC.snap(pg, 2));
  const has = (d, re) => d.texts.some(t => re.test(t.s));
  // 1. récord nuevo
  let pg = await mk(b, 'reset=1&direct=1&speed=0&seed=3');
  await fin(pg, { t: 125, die: true });
  let r = await E(pg, () => ({ best: G.Save.data.stats.best.bosque, st: G.state, sm: G.Loot.summary.record }));
  let d = await txt(pg); ok(r.best && r.best.t === 125 && r.sm.isNew && has(d, /¡Nuevo récord!/) && has(d, /HAS CAÍDO/), 'récord nuevo: stats.best.bosque.t = 125 y aparece "¡Nuevo récord!" (' + JSON.stringify(r.best) + ')');
  ok(TC.analyze(d, { minSize: TC.MIN_MENU }).length === 0 && !kbdHints(d).length, 'fin por muerte: sin solapes, desbordes, fuentes < 12 ni teclas en táctil');
  // 10. DETALLE y VOLVER
  await sleep(pg, 50); await E(pg, () => { for (let i = 0; i < 45; i++) G.step(); });
  await E(pg, () => { G.input.mouse.x = 700; G.input.mouse.y = 150; G.input.pressed.Mouse0 = true; G.step(); });
  d = await txt(pg); ok((await E(pg, () => G.Base.endView())) === 'detail' && has(d, /BOTÍN/) && has(d, /VOLVER/) && !has(d, /Kills|BUILD/), 'DETALLE: botín completo y botón VOLVER (sin "Kills" ni "BUILD")');
  ok(TC.analyze(d, { minSize: TC.MIN_MENU }).length === 0 && !kbdHints(d).length, 'DETALLE: sin problemas de texto');
  await E(pg, () => { G.input.mouse.x = 780; G.input.mouse.y = 490; G.input.pressed.Mouse0 = true; G.step(); });
  ok((await E(pg, () => G.Base.endView())) === 'main', 'VOLVER regresa a la pantalla principal');
  await done(pg, 'end-record');
  // 2. abandono: título y récord intacto
  pg = await mk(b, 'reset=1&direct=1&speed=0&seed=3');
  await E(pg, () => { G.Save.data.stats.best.bosque = { t: 200, bossPct: 100, lvl: 5, kills: 10 }; });
  await fin(pg, { t: 90 });
  d = await txt(pg); r = await E(pg, () => G.Save.data.stats.best.bosque);
  ok(has(d, /EXPEDICIÓN ABANDONADA/) && has(d, /Conservas las partes/) && r.t === 200, 'abandono: "EXPEDICIÓN ABANDONADA" y el récord no cambia');
  ok(TC.analyze(d, { minSize: TC.MIN_MENU }).length === 0, 'abandono: sin problemas de texto'); await done(pg, 'end-abandono');
  // 3. god: sin récord
  pg = await mk(b, 'reset=1&direct=1&speed=0&seed=3&god=1');
  await fin(pg, { t: 125, die: false }); d = await txt(pg);
  ok((await E(pg, () => G.Save.data.stats.best.bosque)) === undefined && has(d, /Modo de pruebas: sin récord/), 'partida con god: no escribe récord y lo dice'); await done(pg, 'end-god');
  // 4. respaldo (7) cuando nada más aplica
  pg = await mk(b, 'reset=1&direct=1&speed=0&seed=3');
  const bk = await E(pg, () => { G.step(); const S = G.Save.data; S.peligro.pastor = 5; S.bossKills.pastor = 1; S.stats.best.bosque = { t: 400, bossPct: 0, lvl: 9, kills: 99 }; G.Tree.nearest = () => null; G.Quests.active = () => null;
    const sm = { won: true, quit: false, boss: { won: true, id: 'pastor', hpFrac: 0, time: 1000, first: false, unlocked: 0 }, parts: {}, total: 0, brasas: 0, newCards: [] }; G.EndInfo.fill(sm, { runSecs: 300, lvl: 9, hunt: false }); return sm.goals.map(g => g.id + ':' + g.text); });
  ok(bk.length >= 1 && /^record:Supera tu récord de/.test(bk[bk.length - 1]), 'sin objetivos de progreso: aparece el respaldo "Supera tu récord de ..." (' + bk.join(' | ') + ')'); await done(pg, 'end-respaldo');
  // 5. encargo a 14/20 como objetivo
  pg = await mk(b, 'reset=1&direct=1&speed=0&seed=3&god=0');
  await E(pg, () => { G.Quests.accept('bombs'); G.Save.data.quest.prog.bombs = 14; });
  await fin(pg, { t: 60, die: true }); d = await txt(pg);
  const gl = await E(pg, () => G.Loot.summary.goals.map(g => g.id + ':' + g.text + ':' + g.frac));
  ok(gl.some(x => /^quest:Encargo: Zarzales mayores 14\/20:0\.7/.test(x)) && has(d, /Encargo: Zarzales mayores 14\/20/), 'encargo activo a 14/20: aparece como objetivo con barra (' + gl.join(' | ') + ')');
  ok(TC.analyze(d, { minSize: TC.MIN_MENU }).length === 0, 'fin con objetivos: sin problemas de texto'); await done(pg, 'end-encargo');
  // 11. consejo por causa
  pg = await mk(b, 'reset=1&direct=1&speed=0&seed=3');
  await fin(pg, { t: 80, die: true, dmg: { fanner: 40, worm: 5 } }); d = await txt(pg);
  ok(has(d, /Te tumbaron los Zarzales/), 'consejo: con daño de fanner sale la línea de los Zarzales'); await done(pg, 'end-consejo');
  // 6. primera expedición
  pg = await mk(b, 'reset=1&cine=0&speed=0&seed=3');
  await startFirst(pg); await fStep(pg, 30); await E(pg, () => { G.runT = G.time = 70000; G.player.hp = 0; G.player.dead = true; G.finish(false); });
  d = await txt(pg); const bx = d.boxes.filter(x => x.k === 'button').map(x => x.label);
  ok(has(d, /PRIMERA EXPEDICIÓN/) && bx.includes('OTRA EXPEDICIÓN') && bx.includes('VOLVER A RESCOLDO') && has(d, /^Cada bicho deja algo/) && has(d, /^Las Brasas son el calor/) && !has(d, /Esencia|PF|nodos/), 'primera expedición: variante con VOLVER A RESCOLDO, las líneas res.partes.first y res.brasas.first y sin jerga (' + bx.join(',') + ')');
  ok(TC.analyze(d, { minSize: TC.MIN_MENU }).length === 0 && !kbdHints(d).length, 'primera expedición: sin problemas de texto'); await done(pg, 'end-primera');
  // 7. práctica
  pg = await mk(b, 'reset=1&all=1&speed=0&seed=3&boss=pastor&practice=1&nointro=1&cine=0');
  await E(pg, () => { for (let i = 0; i < 30; i++) G.step(); G.finish(false); }); d = await txt(pg);
  ok(has(d, /PRÁCTICA/) && !has(d, /teclas/i) && has(d, /REINICIAR PRÁCTICA/), 'práctica: panel de práctica sin la frase de teclas en táctil');
  { const pi = TC.analyze(d, { minSize: TC.MIN_MENU }); ok(pi.length === 0, 'práctica: sin problemas de texto' + (pi.length ? ' -> ' + pi.slice(0, 3).map(i => i.msg).join(' | ') : '')); } await done(pg, 'end-practica');
  // 8. victoria con bioma nuevo
  pg = await mk(b, 'reset=1&god=1&all=1&nointro=1&speed=0&seed=5&peligro=1&cine=0&hand=spark:3,shard:2,dart:1&boss=pastor');
  const wn = await E(pg, () => { for (let i = 0; i < 600 && !G.Boss.e; i++) G.step(); const e = G.Boss.e; if (e) { e.hp = 1; G.Enemies.kill(e); } for (let i = 0; i < 900 && G.state !== 'gameover'; i++) { G.step(); if (G.state === 'cards') { G.state = 'play'; } } return G.state; });
  d = await txt(pg);
  const g0 = await E(pg, () => (G.Loot.summary.goals || []).map(g => g.text)); ok(wn === 'gameover' && g0.length && /Cripta/.test(g0[0]) && has(d, /Cripta/) && has(d, /MANO GANADORA/), 'victoria con desbloqueo: el objetivo y el botón nombran la Cripta (' + g0[0] + ')');
  ok(TC.analyze(d, { minSize: TC.MIN_MENU }).length === 0, 'victoria: sin problemas de texto'); await done(pg, 'end-victoria');
  // 9. retardo de 600 ms
  pg = await mk(b, 'reset=1&direct=1&speed=0&seed=3');
  await fin(pg, { t: 80, die: true });
  await E(pg, () => { G.input.mouse.x = 300; G.input.mouse.y = 490; G.input.pressed.Mouse0 = true; G.step(); });
  const early = await E(pg, () => G.state);
  await E(pg, () => { for (let i = 0; i < 45; i++) G.step(); G.input.mouse.x = 300; G.input.mouse.y = 490; G.input.pressed.Mouse0 = true; G.step(); });
  const late = await E(pg, () => G.state);
  ok(early === 'gameover' && (late === 'play' || late === 'cards'), `el botón principal no responde antes de 600 ms (${early}) y sí después (${late})`); await done(pg, 'end-retardo');
  // botones de 68 px y OTRA EXPEDICIÓN con el objetivo
  pg = await mk(b, 'reset=1&direct=1&speed=0&seed=3'); await fin(pg, { t: 80, die: true }); d = await txt(pg);
  const bb = d.boxes.filter(x => x.k === 'button');
  ok(bb.length >= 2 && bb.every(x => x.y1 - x.y0 >= 68 - 0.5 * 0.722) && has(d, /^Objetivo: /), 'botones de >= 68 px lógicos y subtítulo "Objetivo: ..." (' + bb.map(x => x.label).join(',') + ')'); await done(pg, 'end-botones');
  // 740x360
  for (const [w, h] of [[740, 360]]) {
    pg = await mkV(b, 'reset=1&direct=1&speed=0&seed=3', w, h); await fin(pg, { t: 125, die: true }); d = await txt(pg);
    ok(TC.analyze(d, { minSize: TC.MIN_MENU }).length === 0 && !kbdHints(d).length, `fin a ${w}x${h}: sin problemas de texto`); await done(pg, 'end-740');
  }
  await b.close();
}

// ---------------------------------------------------------------- T-F1-08 (fases 0-2): pantalla ancha (?wide=1)
// Ancho lógico por forma de pantalla, simulación idéntica con cualquier ancho (ventana de juego fija de 960), HUD de combate dentro de la zona segura,
// objetivos táctiles, velo lateral y cambio de tamaño en plena partida. Todo con 0 errores de consola.
async function mkW(b, url, w, h, mob = true) {
  const ctx = await b.newContext({ viewport: { width: w, height: h }, hasTouch: mob, isMobile: mob }), pg = await ctx.newPage(); pg.errs = []; pg.ctx = ctx;
  pg.on('console', m => { if (m.type() === 'error') pg.errs.push(m.text()); }); pg.on('pageerror', e => pg.errs.push('PAGEERR ' + e.message));
  await pg.goto(`${base}/index.html?dev=1&nosw=1&${url}`); await sleep(pg, 600);
  return pg;
}
async function seedW(b, url, cps, w, h, mob, pre, mid) {   // corrida con semilla en un tamaño de ventana; mid(pg, i): acción tras el punto de control i
  const pg = await mkW(b, url, w, h, mob), hs = [];
  if (pre) await E(pg, pre);
  await E(pg, SEED_UTILS);
  const W = await E(pg, () => G.W);
  for (let i = 0; i < cps.length; i++) {
    let r = null;
    for (let guard = 0; guard < 100000; guard++) { const t = await E(pg, () => __tick()); if (t >= cps[i]) break; r = await E(pg, n => __adv(n), Math.min(600, cps[i] - t)); await sleep(pg, 8); }
    hs.push(r ? r.hash : -1);
    if (mid) await mid(pg, i);
  }
  const W2 = await E(pg, () => G.W);
  await done(pg, `wide-semilla ${w}x${h}`); return { hs, W, W2 };
}
// HUD de combate de un fotograma: textos (G.txt) y botones dibujados por G.Hud.draw y G.Sys.drawBar, en coordenadas de lienzo (las barras de jefe/guardián se marcan aparte)
const HUD_REC = () => {
  if (window.__HR) return;
  const R = window.__HR = { on: 0, boss: 0, texts: [], boxes: [] }, cvm = document.createElement('canvas').getContext('2d');
  const tf = (c, x, y) => { const m = c.getTransform(), rs = G.rs || 1; return { x: (m.a * x + m.c * y + m.e) / rs, y: (m.b * x + m.d * y + m.f) / rs, sc: m.a / rs }; };
  const oT = G.txt; G.txt = function (c, s, x, y, size, color, align) {
    if (R.on) { s = String(s); cvm.font = 'bold ' + size + 'px "Courier New", monospace'; const p = tf(c, x, y), w = cvm.measureText(s).width * p.sc, hh = size * p.sc, al = align || 'left', x0 = al === 'center' ? p.x - w / 2 : al === 'right' ? p.x - w : p.x;
      R.texts.push({ s, x0, x1: x0 + w, y0: p.y - hh / 2, y1: p.y + hh / 2, py: p.y, size: hh, color: color || '#fff', boss: R.boss > 0 }); }
    return oT.apply(this, arguments);
  };
  const oH = G.Hud.draw; G.Hud.draw = function (c) { R.on++; try { return oH.apply(this, arguments); } finally { R.on--; } };
  const oS = G.Sys.drawBar; G.Sys.drawBar = function (c) { R.on++; try { return oS.apply(this, arguments); } finally { R.on--; } };
  const oB = G.Boss.drawHud; G.Boss.drawHud = function (c) { R.boss++; try { return oB.apply(this, arguments); } finally { R.boss--; } };
  const oQ = G.Fusion.drawHud; G.Fusion.drawHud = function (c) { R.on++; try { return oQ.apply(this, arguments); } finally { R.on--; } };
};
async function hudSnap(pg) {
  await E(pg, HUD_REC);
  return E(pg, async () => {
    const R = window.__HR; R.texts = []; R.on = 0; await new Promise(r => requestAnimationFrame(r));
    const s = G.safe, F = G.Fusion; F.layout();
    const boxes = G.Sys.buttons().map(b => ({ id: 'sys-' + b.id, x0: b.x, y0: b.y, x1: b.x + b.w, y1: b.y + b.h, min: Math.min(b.w, b.h) }))
      .concat(F.BTN.map((b, i) => ({ id: 'poder' + (i + 1), x0: b.x - b.r, y0: b.y - b.r, x1: b.x + b.r, y1: b.y + b.r, min: 2 * b.hit })))
      .concat([{ id: 'AUTO', x0: F.AUTO.x, y0: F.AUTO.y, x1: F.AUTO.x + F.AUTO.w, y1: F.AUTO.y + F.AUTO.h, min: Math.min(F.AUTO.w, F.AUTO.h) }])
      .concat([0, 1, 2, 3, 4].map(i => { const r = G.Cards.slotRect(i, false); return { id: 'mano' + (i + 1), x0: r.x, y0: r.y, x1: r.x + r.w, y1: r.y + r.h, min: Math.min(r.w, r.h) }; }));
    return { texts: R.texts, boxes, W: G.W, safe: { l: s.l, r: s.r, t: s.t, b: s.b }, k: G.Sys.layout.k, state: G.state };
  });
}
async function wide() {
  console.log('--- T-F1-08 pantalla ancha: ancho por tamaño, simulación idéntica, zona segura, objetivos táctiles, velo y cambio de tamaño');
  const b = await launch();
  // 1. ancho lógico por tamaño (?wide=1) y clásico (?wide=0)
  const SZ = [[844, 390, 1, 1168], [740, 360, 1, 1110], [915, 412, 1, 1200], [932, 430, 1, 1170], [667, 375, 1, 960], [1024, 768, 0, 960], [1280, 720, 0, 960]];
  for (const [w, h, mob, W] of SZ) {
    for (const wd of [1, 0]) {
      const pg = await mkW(b, `reset=1&cine=0&wide=${wd}`, w, h, !!mob);
      const r = await E(pg, () => ({ W: G.W, OX: G.OX, cw: G.Sys.layout.cw, ch: G.Sys.layout.ch, cv: document.getElementById('game').width }));
      if (wd) ok(r.W === W && (w === 1024 ? r.ch === 576 : r.cw >= 0.99 * w) && r.OX === (W - 960) / 2, `?wide=1 a ${w}x${h}: G.W ${r.W} (esperado ${W}), lienzo ${r.cw}x${r.ch} CSS, G.OX ${r.OX}`);
      else ok(r.W === 960 && r.OX === 0, `?wide=0 a ${w}x${h}: G.W 960 y G.OX 0 (${r.W}, lienzo ${r.cw}x${r.ch})`);
      await done(pg, `wide-ancho ${w}x${h} wide=${wd}`);
    }
  }
  { const pg = await mkW(b, 'reset=1&cine=0', 844, 390); const r = await E(pg, () => ({ W: G.W, d: G.Sys.WIDE_DEFAULT })); ok(r.d === 1 && r.W === 1168, `sin perilla: valor por defecto WIDE_DEFAULT=${r.d} (fase 4: 1 => 1168; G.W ${r.W})`); await done(pg, 'wide-defecto'); }
  // 2. simulación idéntica: misma semilla y movimiento con ?wide=1 / ?wide=0 a 844x390, ?wide=1 a 915x412 (1200) y PC 1280x720
  const PRE_V = () => { G.Tree.fx.eraGlacial = true; G.Fusion.auto = true; };   // rayo (weapons.js strike) + era glacial + Descarga en AUTO: reglas de "enemigo visible"
  const SCW = [['bosque', `${SEED_BASE}&seed=1234&q=alta`, [600, 1800, 3600], null],
    ['rayo + era glacial + Descarga AUTO', 'reset=1&god=1&direct=1&all=1&noanchor=1&speed=0&seed=4321&q=alta&hand=storm:3,dart:3,spark:3&actives=descarga2', [600, 1800, 3600], PRE_V],
    ['jefe karceron (cámara sesgada)', `${SEED_BOSS('karceron')}&seed=77&q=alta&hand=storm:3,dart:3`, [600, 1800], PRE_V]];
  const VPS = [[844, 390, true, 'wide=1'], [844, 390, true, 'wide=0'], [915, 412, true, 'wide=1'], [1280, 720, false, 'wide=1']];
  let nRuns = 0;
  for (const [name, url, cps, pre] of SCW) {
    const res = [];
    for (const [w, h, mob, wd] of VPS) { res.push(await seedW(b, `${url}&${wd}`, cps, w, h, mob, pre)); nRuns++; }
    const same = res.every(r => r.hs.length === cps.length && r.hs.every((x, i) => x === res[0].hs[i] && x !== -1));
    ok(same, `${name}: hash idéntico en ${cps.length} puntos de control con G.W ${res.map(r => r.W).join(' / ')}` + (same ? '' : ' -> ' + res.map(r => r.hs.join(',')).join(' | ')));
  }
  // 7. cambio de tamaño en plena partida (844x390 -> 667x375): G.W 1168 -> 960 y la partida sigue igual
  { const url = `${SEED_BASE}&seed=1234&q=alta&wide=1`, cps = [600, 1200, 1800];
    const A = await seedW(b, url, cps, 844, 390, true, null, async (pg, i) => { if (i === 0) { await pg.setViewportSize({ width: 667, height: 375 }); await sleep(pg, 300); } });
    const B0 = await seedW(b, url, cps, 844, 390, true);
    ok(A.W === 1168 && A.W2 === 960 && A.hs.every((x, i) => x === B0.hs[i]), `cambio de tamaño en plena partida: G.W ${A.W} -> ${A.W2} y hash igual que sin el cambio`); nRuns += 2; }
  console.log(`       ${nRuns} corridas con semilla comparadas`);
  // 3-5. HUD de combate: dentro de la zona segura, sin solapes, objetivos táctiles (con muesca simulada ?safe=0,47,21,47 en los teléfonos)
  const HUDSZ = [[844, 390, 1], [740, 360, 1], [915, 412, 1], [932, 430, 1], [667, 375, 1], [1280, 720, 0]];
  const FORCE = () => { const C = G.Cards; C.combos.slice(0, 2).forEach(cb => { C.active[cb.k] = true; }); G.Quests.accept('bombs'); G.player.cdSlowT = 1500; G.player.cdSlowPct = 0.4; G.Loot.run.rare = 2; G.runBuff.dish = (G.Cook.DISHES[0] || {}).id; };
  for (const [w, h, mob] of HUDSZ) {
    for (const sc of ['run', 'boss']) {
      const url = sc === 'run' ? 'reset=1&god=1&direct=1&all=1&cine=0&speed=0&seed=5&hand=spark:3,ember:2,dart:1&actives=descarga2,vapor' : 'reset=1&god=1&all=1&cine=0&nointro=1&speed=0&seed=5&boss=cenizar&peligro=2&hand=spark:3,ember:2&actives=descarga2';
      const pg = await mkW(b, `${url}&wide=1${mob ? '&safe=0,47,21,47' : ''}`, w, h, !!mob);
      await E(pg, FORCE); await E(pg, () => { for (let i = 0; i < 400; i++) { if (G.state === 'cards') { G.Cards.skip(); G.state = 'play'; } G.step(); } G.state = 'play'; });
      const d = await hudSnap(pg), s = d.safe, X0 = s.l - 0.5, X1 = d.W - s.r + 0.5, Y0 = s.t - 0.5, Y1 = 540 - s.b + 0.5;
      const outT = d.texts.filter(t => t.x0 < X0 || t.x1 > X1 || t.y0 < Y0 || t.y1 > Y1), outB = d.boxes.filter(q => q.x0 < X0 || q.x1 > X1 || q.y0 < Y0 || q.y1 > Y1);
      ok(d.state === 'play' && d.texts.length > 8 && !outT.length && !outB.length, `HUD ${sc} a ${w}x${h} (G.W ${d.W}, seguro ${[s.l, s.r, s.t, s.b].map(Math.round)}): ${d.texts.length} textos y ${d.boxes.length} botones dentro de la zona segura` + (outT.length || outB.length ? ' -> ' + outT.slice(0, 3).map(t => t.s + ' ' + Math.round(t.x0) + '..' + Math.round(t.x1)).concat(outB.map(q => q.id)).join(' | ') : ''));
      // solapes entre el HUD anclado y el resto (los de la barra del jefe consigo misma son previos y no dependen del ancho: nombre / chips de Peligro, boss.js drawBar)
      const iss = [];
      for (let i = 0; i < d.texts.length; i++) for (let j = i + 1; j < d.texts.length; j++) {
        const a = d.texts[i], c2 = d.texts[j]; if (a.boss && c2.boss) continue;
        const r = TC.analyze({ texts: [a, c2].map(t => Object.assign({}, t, { color: '#fff' })), boxes: [], W: d.W }, { minSize: 1 }).filter(x => x.k === 'solape' || (x.k === 'pegadas' && !a.boss && !c2.boss)); iss.push(...r);   // con la barra del jefe solo cuenta pisarse
      }
      ok(!iss.length, `HUD ${sc} a ${w}x${h}: sin textos que se pisen ni líneas pegadas` + (iss.length ? ' -> ' + iss.slice(0, 3).map(i => i.msg).join(' | ') : ''));
      if (sc === 'run') {
        const k = d.k, sys = d.boxes.filter(q => /^sys-/.test(q.id)), pw = d.boxes.filter(q => /^poder|^AUTO/.test(q.id)), small = d.texts.filter(t => !t.boss).map(t => t.size * k).sort((a, b2) => a - b2);
        ok(sys.length === 2 && sys.every(q => q.min >= 64), `pausa y silencio a ${w}x${h}: 64x64 lógicos (${sys.map(q => q.id + ' ' + Math.round(q.min * k) + ' px reales').join(', ')})`);
        ok(pw.every(q => q.min * k >= 44 - 0.01), `poderes y AUTO a ${w}x${h}: objetivo táctil >= 44 px reales (${pw.map(q => q.id + ' ' + (q.min * k).toFixed(1)).join(', ')})`);
        console.log(`       (info) ${w}x${h}: texto del HUD más pequeño ${small[0].toFixed(1)} px reales; < 9,5 px: ${small.filter(v => v < 9.5).length} de ${small.length}`);
      }
      await done(pg, `wide-hud ${sc} ${w}x${h}`);
    }
  }
  // 6. velo y aparición: a 915x412 (G.W 1200) las apariciones dentro de la ventana de juego son las mismas con ?wide=1 y ?wide=0 (la ventana, no la pantalla, decide);
  //    las franjas fuera de la ventana llevan el velo (el borde de pantalla sale más oscuro que con el velo apagado)
  { const cnt = async (wd) => {
      const pg = await mkW(b, `reset=1&god=1&direct=1&all=1&noanchor=1&speed=0&seed=31&q=alta&hand=spark:1&wide=${wd}`, 915, 412);
      const r = await E(pg, () => { const seen = new Set(); let inWin = 0, n = 0, inStrip = 0; for (let i = 0; i < 3600; i++) { if (G.state === 'cards') { G.Cards.skip(); G.state = 'play'; } G.step();
        G.enemies.forEach(e => { if (e.spawnT > 0 && !seen.has(e)) { seen.add(e); n++; if (G.inPlay(e.x, e.y, 0)) inWin++; else if (e.x > G.cam.x && e.x < G.cam.x + G.W && e.y > G.cam.y && e.y < G.cam.y + G.VH) inStrip++; } }); }
        return { n, inWin, inStrip, W: G.W }; });
      await done(pg, `wide-aparicion wide=${wd}`); return r; };
    const A = await cnt(1), B0 = await cnt(0);
    ok(A.W === 1200 && A.n > 50 && A.n === B0.n && A.inWin === B0.inWin, `apariciones a 915x412: ${A.n} enemigos, ${A.inWin} dentro de la ventana de 960 con ?wide=1 y ${B0.inWin} con ?wide=0 (iguales); ${A.inStrip} en las franjas con velo`);
    const pg = await mkW(b, 'reset=1&god=1&direct=1&all=1&speed=0&seed=31&q=alta&hand=spark:1&wide=1', 915, 412);
    const v = await E(pg, () => {   // el velo pintado sobre blanco: 45 % en el borde de la pantalla, 0 % en el borde de la ventana de juego
      for (let i = 0; i < 60; i++) G.step(); G.syncCam();
      const cv = document.createElement('canvas'); cv.width = G.W; cv.height = G.H; const g = cv.getContext('2d'); g.fillStyle = '#fff'; g.fillRect(0, 0, G.W, G.H); G.drawVeil(g);
      const px = x => g.getImageData(Math.round(x), 270, 1, 1).data[0], wx = G.simCam.x - G.cam.x;
      return { W: G.W, edge: wx, a0: px(0), a1: px(wx + 1), mid: px(G.W / 2), b1: px(G.W - 1) };
    });
    ok(v.W === 1200 && v.edge > 0 && Math.abs(v.a0 - 255 * 0.55 - 7 * 0.45) < 6 && v.a1 > 248 && v.mid === 255 && Math.abs(v.b1 - v.a0) < 6, `velo lateral: borde de pantalla ${v.a0}/255 (45 % #07050c), borde de la ventana ${v.a1}, centro ${v.mid}, borde derecho ${v.b1} (ventana a ${Math.round(v.edge)} px)`);
    await done(pg, 'wide-velo'); }
  await b.close();
}

// ---------------------------------------------------------------- v10 retención (T-F1-05 / T-F1-06): reto diario, kits semanales, objetivos y racha
// Fecha simulada con G.Daily.setNow(ms) (equivale a ?dev=1&today=AAAA-MM-DD). Con ?dev=1 + parámetros cerrados el intento es PRUEBA: las pruebas del intento con premio ponen G.Daily.forceOfficial = true.
const DUTC = (s, h) => Date.UTC(+s.slice(0, 4), +s.slice(5, 7) - 1, +s.slice(8, 10), h == null ? 12 : h);
const ACC_FULL = () => { const S = G.Save.data; S.runs = 3; S.bossKills = { pastor: 1, karceron: 1, letea: 1, yarlak: 1, melaria: 1, cenizar: 1 }; };
const ACC_VET = () => { const S = G.Save.data; S.runs = 60; S.wins = 25; S.bossKills = { pastor: 4, karceron: 3, letea: 3, yarlak: 2, melaria: 2, cenizar: 1 }; S.pf.earned = 24;
  ['bra_helm', 'bra_chest', 'bra_greaves', 'bra_talis'].forEach(id => { S.armor.owned[id] = 3; }); S.armor.equipped = ['bra_helm', 'bra_chest', 'bra_greaves', 'bra_talis']; S.armor.seen.brasa = 1;
  S.nodes = { F1: { c: 'A' }, F2: { c: '1' }, F4: { c: '1' }, R2: { c: '1' }, R3: { c: '1' }, ANC: { c: '1' }, ASH: { c: '1' }, RT6: { c: '1' }, A1: { c: 'B' }, A4: { c: '1' } };
  S.cards.spark = 3; S.cards.ember = 3; S.cards.dagger = 3; S.anchors = ['ember', 'spark']; S.pending.dish = 'hogar'; S.pending.tonic = 1; S.peligro.pastor = 5; S.trophies.horn = 4; S.insignias.carnero = 2; S.quest.active = 'sheep'; G.Tree.sync(); G.Armor.dirty(); };
async function daily() {
  console.log('--- v10 retención: reto diario (semilla UTC, kit de la semana, un cobro, reloj, corte, mortal, campaña intacta, guardado v13), kits, objetivos y racha, pantallas');
  const b = await launch();
  const SP = process.env.SHOTS || '';
  const reload = async (pg, extra) => { await pg.goto(`${base}/index.html?dev=1&nosw=1&cine=0&${extra || ''}${WX}`); await sleep(pg, 900); };
  // 1. día UTC
  let pg = await mk(b, 'reset=1&cine=0&speed=0');
  let r = await E(pg, () => ({ a: G.Daily.dayKey(G.Daily.dayIndex(Date.UTC(2026, 10, 14, 23, 59, 59))), b: G.Daily.dayKey(G.Daily.dayIndex(Date.UTC(2026, 10, 15, 0, 0, 0))),
    w1: G.Daily.weekOf(G.Daily.dayIndex(Date.UTC(2026, 10, 15, 23, 59))), w2: G.Daily.weekOf(G.Daily.dayIndex(Date.UTC(2026, 10, 16, 0, 0))), dow: new Date(Date.UTC(2026, 10, 16)).getUTCDay() }));
  ok(r.a === '2026-11-14' && r.b === '2026-11-15', `día UTC: 23:59:59 -> ${r.a}, 00:00:00 -> ${r.b}`);
  ok(r.dow === 1 && r.w2 === r.w1 + 1, `la semana cambia el lunes 00:00 UTC (domingo 23:59 semana ${r.w1}, lunes 00:00 semana ${r.w2})`);
  // 2. reglas puras: misma fecha = mismo JSON en dos cargas y dos cuentas con todo abierto; instantánea fijada
  const rulesOf = () => { G.Daily.setNow(Date.UTC(2026, 10, 14, 12)); const x = G.Daily.rules(G.Daily.dayIndex()); return JSON.stringify(x); };
  const j1 = await E(pg, new Function('(' + ACC_FULL + ')(); return (' + rulesOf + ')();'));
  await done(pg, 'daily-reglas-1');
  pg = await mk(b, 'reset=1&cine=0&speed=0&seed=99');
  const j2 = await E(pg, new Function('(' + ACC_VET + ')(); return (' + rulesOf + ')();'));
  const R14 = JSON.parse(j1);
  ok(j1 === j2, 'reglas del 2026-11-14 idénticas en dos cargas y dos cuentas con todo abierto (nueva con 3 salidas y veterana)');
  ok(R14.key === '2026-11-14' && R14.biome === R14.perm[0] && R14.rv === 'r1' && R14.kv === 'k1' && JSON.stringify([R14.biome, R14.peligro, R14.mut, R14.kit, R14.comp]) === DAILY_SNAP, 'instantánea fijada del 2026-11-14: ' + JSON.stringify([R14.biome, R14.peligro, R14.mut, R14.kit, R14.comp]));
  await done(pg, 'daily-reglas-2');
  // 6. apertura y filtros de la cuenta; 7. 365 fechas
  pg = await mk(b, 'reset=1&cine=0&speed=0');
  r = await E(pg, () => {
    const S = G.Save.data, D = G.Daily, out = {};
    S.runs = 2; out.closed2 = !D.isOpen(); S.runs = 3; out.open3 = D.isOpen() && S.bossKills.pastor == null;
    let bos = true, pelOk = true;
    for (let d = 20000; d < 20060; d++) { const R = D.rules(d, { unlocked: ['bosque'], kills: {} }); if (R.biome !== 'bosque') bos = false; if (R.peligro > 2) pelOk = false; }
    out.bos = bos; out.pel2 = pelOk;
    const all = { unlocked: ['bosque', 'cripta', 'asfodelo', 'tundra', 'panal', 'crater'], kills: { pastor: 1, karceron: 1, letea: 1, yarlak: 1, melaria: 1 } };
    const cnt = { 2: 0, 3: 0, 4: 0 }; let fire = true, bud = true, fam = true, rng = true, first = true, dosBad = 0, r6 = true, n = 0;
    for (let d = 20400; d < 20765; d++) {
      const R = D.rules(d, all); n++; cnt[R.peligro]++;
      if (R.biome !== R.perm[0]) first = false;
      if ((R.biome === 'tundra' || R.biome === 'panal') && R.tags.indexOf('fire') < 0) fire = false;
      const w = R.mut.reduce((a, id) => a + D.mut(id).w, 0); if (w > { 2: 2, 3: 1.5, 4: 1 }[R.peligro] + 1e-9 || R.mut.length < 1) bud = false;
      if (new Set(R.mut.map(id => D.mut(id).fam)).size !== R.mut.length) fam = false;
      if (R.peligro < 2 || R.peligro > 4) rng = false;
      if (R.mut.indexOf('dos') >= 0 && (R.biome === 'tundra' || R.biome === 'panal') && !G.Kit.hasFire(G.Kit.get(R.kit))) dosBad++;
      const wk = []; (G.Boss.DEFS[R.boss].weak || []).forEach(x => wk.push(x.tag)); if (R.comp.length && !R.comp.some(t => wk.indexOf(t) >= 0) && G.Kit.TAGS.some(t => wk.indexOf(t) >= 0 && G.Kit.get(R.kit).tags.indexOf(t) < 0)) r6 = false;
    }
    Object.assign(out, { cnt, fire, bud, fam, rng, first, dosBad, r6, n });
    return out;
  });
  ok(r.closed2 && r.open3, 'el reto se abre tras la 3.ª expedición (2 salidas: cerrado; 3: abierto aunque no hayas vencido al Pastor)');
  ok(r.bos && r.pel2, 'cuenta con solo el Bosque: reto en el Bosque y Peligro <= II (reto suave), 60 días');
  ok(r.first, '365 días, cuenta completa: el bioma es siempre permutación[0]');
  ok(r.fire && r.dosBad === 0, '365 días: Fuego en la baraja siempre que toca Tundra o Panal (R4) y nunca "Dos etiquetas" sin Fuego allí (R5)');
  ok(r.bud && r.fam && r.rng && r.r6, '365 días: presupuesto de mutadores, familias distintas, al menos 1 mutador, Peligro II-IV y debilidad del jefe en el acompañamiento (R6)');
  const pc = k => Math.round(r.cnt[k] / r.n * 1000) / 10;
  ok(Math.abs(pc(2) - 35) <= 5 && Math.abs(pc(3) - 45) <= 5 && Math.abs(pc(4) - 20) <= 5, `reparto de Peligro en 365 días: II ${pc(2)} %, III ${pc(3)} %, IV ${pc(4)} % (objetivo 35/45/20 +-5)`);
  // kits: rotación de 104 semanas, potencia nivelada y reglas R1-R3
  r = await E(pg, () => {
    const K = G.Kit, out = { cnt: {}, rep: 0 }; let prev = null;
    for (let w = 8 * 300; w < 8 * 300 + 104; w++) { const k = K.ofWeek(w); out.cnt[k] = (out.cnt[k] || 0) + 1; if (k === prev) out.rep++; prev = k; }
    out.def = ['bosque', 'cripta', 'asfodelo', 'tundra', 'panal'].map(bi => { const bd = K.build('pantano', bi), v = K.view(bd); return [Math.round(v.stats.def * 10) / 10, bd.pfSpent]; });
    out.hog = ['bosque', 'panal'].map(bi => K.build('hogar', bi).pfSpent);
    const pt = K.build('pantano', 'tundra'), vt = K.build('ventisca', 'tundra'), cp = K.build('carmesi', 'panal'), fp = K.build('fragua', 'panal');
    out.r1 = [pt.fx.crampones, pt.dish, vt.fx.crampones, vt.dish]; out.r2 = [cp.fx.ahumador, cp.dish, fp.dish];
    const R = G.Daily.rules(20500, { unlocked: ['tundra'], kills: { letea: 1, yarlak: 1 } }, 'pantano');
    out.yar = [R.biome, R.boss, R.comp, R.tags.indexOf('fire') >= 0];
    out.mon = [K.ofWeek(G.Daily.weekOf(G.Daily.dayIndex(Date.UTC(2026, 10, 15, 23, 59)))), K.ofWeek(G.Daily.weekOf(G.Daily.dayIndex(Date.UTC(2026, 10, 16, 0, 0))))];
    return out;
  });
  ok(Object.keys(r.cnt).length === 8 && Object.values(r.cnt).every(n => n === 13) && r.rep === 0, '104 semanas: cada uno de los 8 kits sale 13 veces y nunca se repite el de la semana anterior ' + JSON.stringify(r.cnt));
  ok(r.mon[0] !== r.mon[1], `el kit cambia el lunes 00:00 UTC (domingo ${r.mon[0]}, lunes ${r.mon[1]})`);
  ok(JSON.stringify(r.def) === JSON.stringify([[12, 6], [20.7, 9], [27.6, 11], [34.5, 15], [41.4, 17]]), 'potencia nivelada con 4 piezas de un set: DEF 12 / 20,7 / 27,6 / 34,5 / 41,4 y PF del kit 6 / 9 / 11 / 15 / 17 ' + JSON.stringify(r.def));
  ok(r.r1[0] && r.r1[1] === 'caldobrasa' && r.r1[2] && r.r1[3] === 'pan', 'R1: Pantano en la Tundra recibe Crampones y Caldo de brasa; Ventisca (Pelaje Glacial) solo Crampones ' + JSON.stringify(r.r1));
  ok(r.r2[0] && r.r2[1] === 'sopa' && r.r2[2] === 'tostada', 'R2/R3: Carmesí (Jalea Real) en el Panal recibe el Ahumador sin Tostada; Fragua sí la recibe ' + JSON.stringify(r.r2));
  ok(r.yar[0] === 'tundra' && r.yar[1] === 'yarlak' && r.yar[3], 'R4/R6: Pantano contra Yarlak lleva Fuego de acompañamiento (debilidad del jefe) ' + JSON.stringify(r.yar));
  await done(pg, 'daily-reglas-365');
  // 3-5. Determinismo: misma fecha y mismas entradas, cuentas distintas (y con ?seed= y un encargo de caza) -> mismo hash; ALTA y BAJA. Kit idéntico (kit 1 y 4)
  const runDaily = async (acc, url, cps, extra) => {
    const p = await mk(b, url);
    const k = await E(p, new Function('(' + acc + ')(); ' + (extra || '') + ' G.Daily.setNow(' + DUTC('2026-11-14') + '); G.Aldea.open(false); G.Daily.start(false);' +
      ' const C = G.Cards, sl = C.slotOf(G.Kit.cur.anchor); return { god: G.god, A: JSON.stringify(G.Armor.get()), fx: JSON.stringify(G.Tree.fx), rk: G.Kit.cur.deck.map(id => G.Loot.rm(id)).join(), anc: G.player.hand.filter(Boolean).map(h => h.id).join(), rb: JSON.stringify(G.runBuff), hp: G.player.maxHp, slots: G.B.anchorSlots, seed: G.seed, mode: G.mode, len: G.RUN_LEN };'));
    await E(p, SEED_UTILS);
    const hs = [];
    for (const cp of cps) { let h = null; for (let g = 0; g < 1000; g++) { const t = await E(p, () => __tick()); if (t >= cp) break; h = await E(p, n => __adv(n), Math.min(600, cp - t)); } hs.push(h ? h.hash : -1); }
    const after = await E(p, () => { G.player.hurtT = 0; G.Boss.noHurt = 0; const h0 = G.player.hp; G.Player.hurt(G.player, 5, G.player.x + 20, G.player.y, { src: 'worm' }); const hit = G.player.hp < h0; G.finish(false); return { seed: G.seed, god: G.god, hit, A: JSON.stringify(G.Armor.get()), fx: JSON.stringify(G.Tree.fx) }; });
    return { p, k, hs, after };
  };
  const CPS = [600, 1800, 3600];
  for (const q of ['alta', 'baja']) {
    const A = await runDaily(ACC_FULL, `reset=1&cine=0&speed=0&q=${q}&dq=${q}`, CPS);
    const B = await runDaily(ACC_VET, `reset=1&cine=0&speed=0&q=${q}&dq=${q}&seed=99&god=1`, CPS);
    ok(A.hs.every(h => h !== -1) && JSON.stringify(A.hs) === JSON.stringify(B.hs), `determinismo del reto (${q}): cuenta nueva y veterana (con ?seed=99, ?god=1, plato y Tónico pendientes y encargo activo) -> mismo hash en los ticks ${CPS.join(', ')} ` + (JSON.stringify(A.hs) === JSON.stringify(B.hs) ? '' : JSON.stringify([A.hs, B.hs])));
    if (q === 'alta') {
      const same = ['A', 'fx', 'rk', 'anc', 'rb', 'hp', 'slots'].filter(f => A.k[f] !== B.k[f]);
      ok(!same.length, 'kit idéntico en las dos cuentas: Armor.get(), Tree.fx, rangos de la baraja, ancla, plato (runBuff) y vida máxima' + (same.length ? ' -> difieren ' + same.join(',') : ''));
      ok(A.k.god === false && B.k.god === false && A.k.slots === 1 && A.k.len === 540000 && A.k.mode === 'run', 'reto siempre mortal (también con ?god=1), 1 ancla y 9 min');
      ok(B.after.seed === 99 && A.after.seed === null && B.after.god === true, `al terminar: la semilla vuelve (?seed=99 -> ${B.after.seed}) y la inmortalidad de la cuenta se restaura (${B.after.god})`);
      ok(A.hs.length && (A.after.hit || B.after.hit), 'el jugador recibe daño en el reto');
      ok(B.after.A !== B.k.A && B.after.fx !== B.k.fx, 'tras el reto, Armor.get() y Tree.fx vuelven a ser los de la cuenta');
    }
    await done(A.p, 'daily-det-a-' + q); await done(B.p, 'daily-det-b-' + q);
  }
  // 8 y 14. Un solo cobro y campaña intacta (comparación profunda) + 1.10.8 nada del kit en el guardado
  pg = await mk(b, 'reset=1&cine=0&speed=0');
  r = await E(pg, new Function('(' + ACC_VET + ')();' + ` G.Daily.forceOfficial = true; G.Daily.setNow(${DUTC('2026-11-14')}); G.Aldea.open(false);
    const S = G.Save.data, pick = () => JSON.stringify({ runs: S.runs, wins: S.wins, bk: S.bossKills, pw: S.pelWins, pel: S.peligro, tr: S.trophies, ins: S.insignias, pf: S.pf, pity: S.pity, quest: S.quest, shop: S.shop, armor: S.armor, nodes: S.nodes, ever: S.ever, cards: S.cards, anchors: S.anchors, pending: S.pending, manual: S.manualSeen, trE: S.trophiesEver, insE: S.insigniasEver, ls: S.lossStreak });
    S.daily.obj.list = []; S.daily.obj.wlist = [];   // (sin objetivos: aquí solo se mide el premio del reto)
    const before = pick(), b0 = S.brasas, sh = S.daily.reto.medals;
    const out = { can0: G.Daily.canOfficial() };
    G.Daily.start(true);
    for (let i = 0; i < 1800; i++) { if (G.state === 'cards') { G.Cards.skip(); G.state = 'play'; } G.step(); }
    G.Save.save(); const raw = localStorage.getItem(G.Save.KEY); out.leak = /kitOvr|"fx":\\{"dosis/.test(raw) || JSON.parse(raw).armor.equipped[0] !== 'bra_helm';
    G.finish(false);
    out.paid1 = S.brasas - b0; out.can1 = G.Daily.canOfficial(); out.hist = S.daily.reto.hist.length; out.claims = Object.keys(S.daily.claims);
    out.same = pick() === before; out.diff = before === pick() ? '' : before.slice(0, 80) + ' / ' + pick().slice(0, 80);
    const b1 = S.brasas; G.Daily.retry(); for (let i = 0; i < 300; i++) { if (G.state === 'cards') { G.Cards.skip(); G.state = 'play'; } G.step(); } G.finish(false);
    out.paid2 = S.brasas - b1; out.retry = S.daily.reto.retry; out.hist2 = S.daily.reto.hist.length; out.same2 = pick() === before; out.dailyRuns = S.stats.dailyRuns;
    return out;`));
  ok(r.can0 && r.paid1 === 40 && !r.can1 && r.hist === 1, `intento con premio: paga una vez (+${r.paid1} Brasas de Participación) y gasta el intento del día (claims ${r.claims})`);
  ok(r.paid2 === 0 && r.hist2 === 1 && r.retry.best > 0, 'reintento: misma semilla, sin premio, no entra en el historial; guarda su mejor marca aparte ' + JSON.stringify(r.retry));
  ok(r.same && r.same2, 'campaña intacta tras el reto y el reintento: runs, wins, jefes, Peligro, trofeos, insignias, PF, pity, encargo, tienda, armadura, nodos, cartas, anclas, compras pendientes y manual' + (r.same ? '' : ' -> ' + r.diff));
  ok(!r.leak, 'guardar a mitad del reto no filtra el kit: el texto guardado no lleva kitOvr y su armadura es la de la cuenta');
  ok(r.dailyRuns === 2, 'stats.dailyRuns cuenta oficial + reintento (' + r.dailyRuns + ')');
  await reload(pg);
  r = await E(pg, () => { G.Daily.forceOfficial = true; G.Daily.setNow(Date.UTC(2026, 10, 14, 12)); G.Aldea.open(false); return { can: G.Daily.canOfficial(), b: G.Save.data.brasas, h: G.Save.data.daily.reto.hist.length }; });
  ok(!r.can && r.h === 1, 'recargar: el intento del día sigue gastado y no se paga otra vez');
  // 9-11. reloj
  r = await E(pg, () => {
    const D = G.Daily, out = {};
    D.setNow(Date.UTC(2026, 10, 13, 12)); D._backWarned = false; const msgs = D.onAldea(); out.back1 = !D.canOfficial() && D.today() === D.dayIndex(Date.UTC(2026, 10, 14)) && msgs.some(m => /hacia atrás/.test(m));
    D.setNow(Date.UTC(2026, 10, 17, 12)); out.fwd = D.canOfficial(); const b0 = G.Save.data.brasas; D.start(true); G.finish(false); out.fwdPaid = G.Save.data.brasas - b0;
    D.setNow(Date.UTC(2026, 10, 14, 12)); out.backTo14 = D.today() === D.dayIndex(Date.UTC(2026, 10, 14, 12)); out.can14 = D.canOfficial();
    D.setNow(Date.UTC(2026, 10, 10, 12)); out.reset = D.today() === D.dayIndex(Date.UTC(2026, 10, 10)) && G.Save.data.daily.maxDay === D.today(); out.can10 = D.canOfficial();
    D.setNow(Date.UTC(2026, 10, 17, 12)); out.again17 = D.canOfficial();
    return out;
  });
  ok(r.back1, 'reloj 1 día hacia atrás tras jugar: no hay intento con premio y sale el aviso E9');
  ok(r.fwd && r.fwdPaid > 0 && r.backTo14 && !r.can14, 'reloj adelante (D+3): se juega y paga; al volver a D, el de D (ya jugado) sigue gastado');
  ok(r.reset && r.can10 && !r.again17, 'reloj atrás más de 2 días: maxDay se reajusta; D+3 ya cobrado no se paga dos veces');
  await done(pg, 'daily-cobro');
  // 12. corte a mitad: punto de control, recarga, se cierra con lo guardado y paga una vez
  pg = await mk(b, 'reset=1&cine=0&speed=0');
  r = await E(pg, new Function('(' + ACC_FULL + ')();' + ` G.Daily.forceOfficial = true; G.Daily.setNow(${DUTC('2026-11-14')}); G.Aldea.open(false); G.Daily.start(true);
    for (let i = 0; i < 1300; i++) { if (G.state === 'cards') { G.Cards.skip(); G.state = 'play'; } G.step(); }
    const lv = G.Save.data.daily.reto.live; return { lv: lv && lv.score, b: G.Save.data.brasas };`));
  const b0 = r.b;
  await reload(pg, 'speed=0');
  r = await E(pg, () => ({ b: G.Save.data.brasas, live: G.Save.data.daily.reto.live, h: G.Save.data.daily.reto.hist.length, sc: G.Save.data.daily.reto.hist[0] && G.Save.data.daily.reto.hist[0].score, god: G.god, kit: !!G.Kit.cur }));
  ok(r.live === null && r.h === 1 && r.b - b0 === 40 && r.sc > 0 && !r.kit, `corte a mitad: al recargar el intento se cierra con el punto de control (${r.sc} puntos) y paga su medalla una vez (+${r.b - b0})`);
  await reload(pg, 'speed=0');
  r = await E(pg, () => ({ b: G.Save.data.brasas, h: G.Save.data.daily.reto.hist.length }));
  ok(r.h === 1 && r.b - b0 === 40, 'segunda recarga: no se paga otra vez');
  await done(pg, 'daily-corte');
  // 13. modo PRUEBA (?dev=1 con parámetros): sin marca ni historial, no gasta el intento
  pg = await mk(b, 'reset=1&cine=0&speed=0');
  r = await E(pg, new Function('(' + ACC_FULL + ')();' + ` G.Daily.setNow(${DUTC('2026-11-14')}); G.Aldea.open(false); const t = G.Daily.isTest(); G.Daily.start(true); const dv = G.daily.test; G.finish(false);
    const e = G.Daily.endRes; return { t, dv, h: G.Save.data.daily.reto.hist.length, best: G.Save.data.daily.reto.best, claims: Object.keys(G.Save.data.daily.claims).length, dev: e.entry.dev, paid: !!e.pay };`));
  ok(r.t && r.dv && r.h === 0 && !r.best && r.claims === 0 && r.dev === 1 && r.paid, 'modo PRUEBA (?dev=1 con parámetros): dev: 1, sin historial ni récord, no gasta el intento (y paga para probar el flujo)');
  // 16. historial de 30 y texto para compartir exacto
  r = await E(pg, () => {
    const D = G.Daily, R = G.Save.data.daily.reto;
    for (let i = 0; i < 31; i++) { R.hist.push({ rv: 'r1', day: 'x', dayN: 20000 + i, biome: 'bosque', boss: 'pastor', peligro: 2, mut: [], kit: 'fragua', score: i, base: i, mul: 1, medal: 0, won: false }); while (R.hist.length > 30) R.hist.shift(); }
    const e = { day: '2026-11-14', biome: 'tundra', peligro: 3, mut: ['veloz', 'sincor'], medal: 2, score: 4511, won: false, bossFrac: 0.62, kills: 812 };
    const w = Object.assign({}, e, { won: true, medal: 3, bt: 102000 });
    return { n: R.hist.length, first: R.hist[0].dayN, txt: D.shareText(e), won: D.shareText(w).split('\n')[4] };
  });
  ok(r.n === 30 && r.first === 20001, 'historial: con 31 retos quedan los 30 últimos');
  ok(r.txt === 'Swarm Hand - Reto 2026-11-14\nTundra, Peligro III\nEnjambre veloz + Sin corazones\nPLATA - 4.511 puntos\nJefe al 38 % - 812 bajas' && r.won === 'Jefe vencido en 1:42 - 812 bajas', 'texto para compartir: 5 líneas exactas (y con victoria "Jefe vencido en 1:42")');
  // 17. mutadores
  r = await E(pg, new Function('(' + ACC_FULL + ')();' + ` const D = G.Daily, out = {}; G.Daily.setNow(${DUTC('2026-11-14')}); G.Aldea.open(false);
    const base = D.rules(D.today()); const R = JSON.parse(JSON.stringify(base)); R.mut = ['veloz', 'marea', 'duros', 'sincor', 'bolsillo', 'cristal', 'sincambio', 'curtidos'];
    G.launchReq = { daily: true, official: false, rules: R }; G.Base.launch();
    const d0 = G.diffProfile(G.Q.level); out.D = [G.D.s / d0.s, G.D.n / d0.n, G.D.h / d0.h].map(v => Math.round(v * 100) / 100);
    out.m = [G.daily.heartMul, G.daily.pickMul, G.daily.dmgTaken, G.daily.noReroll, G.daily.guardMul];
    const g = G.Enemies.spawn('mini_bulwark', 300, 300); out.guard = Math.round(g.maxHp || g.hp); G.Enemies.kill && (g.hp = 0);
    G.player.ash = 999; G.Cards.open('level'); const c0 = G.Cards.off.cards.join(); G.Cards.reroll(); out.reroll = G.Cards.off.cards.join() === c0 && G.player.ash === 999; G.Cards.closeOffer();
    const hp0 = G.player.hp; G.player.hurtT = 0; G.Player.hurt(G.player, 10, G.player.x + 30, G.player.y, { src: 'worm' }); out.hurt = Math.round((hp0 - G.player.hp) * 100) / 100;
    G.finish(false);
    const R2 = D.rules(D.today(), null, 'fragua'); const dosR = JSON.parse(JSON.stringify(R2)); dosR.mut = ['dos']; dosR.comp = []; 
    out.dosDeck = D.rules(20517, { unlocked: ['bosque'], kills: {} }, 'fragua');
    return out;`));
  ok(JSON.stringify(r.D) === '[1.15,1.15,1.2]', 'mutadores de horda: velocidad x1,15, cantidad x1,15 y vida x1,2 sobre el perfil G.D ' + JSON.stringify(r.D));
  ok(r.m[0] === 0 && r.m[1] === 0.6 && r.m[2] === 1.2 && r.m[3] === true && r.m[4] === 1.35 && r.reroll, 'Sin corazones, Bolsillos cortos (x0,6), Piel de cristal (x1,2), Sin cambios (el cambio de oferta no cobra ni cambia) y Guardianes curtidos (x1,35) ' + JSON.stringify(r.m));
  await done(pg, 'daily-mutadores');
  // "Dos etiquetas": la baraja solo trae las 2 etiquetas del kit (busca un día con el mutador)
  pg = await mk(b, 'reset=1&cine=0&speed=0');
  r = await E(pg, () => { for (let d = 20000; d < 21000; d++) { const R = G.Daily.rules(d, { unlocked: ['bosque'], kills: {} }); if (R.mut.indexOf('dos') >= 0) { const kt = G.Kit.get(R.kit).tags; return { d, ok: R.comp.length === 0 && R.deck.every(id => { const c = G.Cards.def(id); return c.tag === 'neutral' || c.id === 'heart' || kt.indexOf(c.tag) >= 0; }), n: R.deck.length }; } } return null; });
  ok(r && r.ok && r.n >= 8 && r.n <= 11, 'Dos etiquetas: la baraja solo trae las 2 del kit y 3 neutrales (' + (r && r.n) + ' cartas)');
  await done(pg, 'daily-dos');
  // 15 / 15b. Migración v12 -> v13 con copia, cadena v9 -> v13, v13 que sobrevive a la recuperación e importación estricta
  pg = await mk(b, 'reset=1&cine=0&speed=0');
  await E(pg, () => { const S = G.Save; S.data.brasas = 321; S.data.runs = 7; S.data.parts.wick = 9; const d = JSON.parse(JSON.stringify(S.data)); d.v = 12; delete d.daily; delete d.flags.migrated13; localStorage.setItem(S.KEY, JSON.stringify(d)); window.__d12 = JSON.stringify(d); localStorage.setItem('__d12', JSON.stringify(d)); localStorage.removeItem(S.KEY + '.v12'); });
  await reload(pg, 'speed=0');
  r = await E(pg, () => { const S = G.Save, bk = !!localStorage.getItem(S.KEY + '.v12'); localStorage.setItem(S.KEY, localStorage.getItem('__d12')); S.load(); const d = JSON.parse(JSON.stringify(S.data)), o = JSON.parse(localStorage.getItem('__d12'));   // (se vuelve a cargar el v12 sin pasar por la aldea: solo la migración)
    const strip = x => { const y = JSON.parse(JSON.stringify(x)); delete y.v; delete y.daily; delete y._sum; if (y.flags) { delete y.flags.migrated13; delete y.flags.fte; } if (y.stats) delete y.stats.playMs; if (y.settings) delete y.settings.cine; const canon = v => Array.isArray(v) ? '[' + v.map(canon).join(',') + ']' : v && typeof v === 'object' ? '{' + Object.keys(v).sort().map(k => JSON.stringify(k) + ':' + canon(v[k])).join(',') + '}' : JSON.stringify(v); return canon(y); };   // (settings.cine lo rellena adopt desde v12)
    const a1 = strip(d), a2 = strip(o); let i = 0; while (i < a1.length && a1[i] === a2[i]) i++;
    return { v: d.v, bak: bk && !!localStorage.getItem(S.KEY + '.v12'), bakV: JSON.parse(localStorage.getItem(S.KEY + '.v12') || '{}').v, daily: JSON.stringify(d.daily) === JSON.stringify(S.freshDaily()), dd: JSON.stringify(d.daily).slice(0, 200), mig: d.flags.migrated13, same: a1 === a2, at: a1.slice(Math.max(0, i - 60), i + 60) + ' / ' + a2.slice(Math.max(0, i - 60), i + 60), b: d.brasas }; });
  ok(r.v === 13 && r.bak && r.bakV === 12 && r.mig === 1, 'migración v12 -> v13: copia swarmhand.fusion.save.v12 escrita antes de migrar y flags.migrated13');
  ok(r.daily && r.same && r.b === 321, 'migración v12 -> v13: daily con sus valores por defecto (racha 0, 2 Leñas) y el resto idéntico (comparación profunda)' + (r.daily && r.same ? '' : ' -> ' + (r.daily ? r.at : r.dd)));
  r = await E(pg, () => { const S = G.Save; const d = { v: 9, parts: { wick: 3 }, cards: { spark: 1 }, brasas: 50, runs: 2, bossKills: { pastor: 1 }, anchors: ['spark'], pf: { earned: 3 }, flags: {} };
    localStorage.setItem(S.KEY, JSON.stringify(d)); S.load(); return { v: S.data.v, b: S.data.brasas, dy: !!S.data.daily && S.data.daily.streak.wood === 2, chest: S.data.armor.owned.esq_chest }; });
  ok(r.v === 13 && r.b === 50 && r.dy, 'cadena v9 -> v13 entera: sin pérdidas y con daily');
  r = await E(pg, () => {
    const S = G.Save, K = S.KEYS, out = {};
    S.data.daily.streak.n = 9; S.data.daily.reto.hist.push({ rv: 'r1', day: '2026-11-14', dayN: 20771, biome: 'bosque', boss: 'pastor', peligro: 2, mut: ['veloz'], kit: 'fragua', score: 1234, base: 1000, mul: 1.2, medal: 1, won: false });
    S.data.brasas = 1; S.save(); S.data.brasas = 2; S.save(); localStorage.removeItem(S.KEY);
    S.load(); out.rec = S.recovered && S.recovered.from; out.n = S.data.daily.streak.n; out.h = S.data.daily.reto.hist.length;
    const txt = S.exportText(); const bad = JSON.parse(S.serialize(S.data).replace(/,"_sum":"[^"]+"\}$/, '}')); bad.daily.streak.wood = 7;
    out.imp1 = S.importText(JSON.stringify(bad)); const bad2 = JSON.parse(JSON.stringify(bad)); bad2.daily.streak.wood = 1; bad2.daily.reto.hist[0].score = -1; out.imp2 = S.importText(JSON.stringify(bad2));
    out.ok = S.importText(txt).ok;
    const k = S.KEY, d = JSON.parse(localStorage.getItem(k)); delete d._sum; d.daily.streak.wood = 7; d.daily.reto.hist[0].score = -1; localStorage.setItem(k, JSON.stringify(d)); S.load();
    out.fixed = [S.data.daily.streak.wood, S.data.daily.reto.hist[0].score, S.repairs.filter(x => /^daily\./.test(x)).length];
    localStorage.setItem(k + '.v12', localStorage.getItem('__d12')); out.restore = S.restore('v12'); out.rv = S.data.v; out.rd = !!S.data.daily;
    return out; });
  ok(r.rec === 'reciente' && r.n === 9 && r.h === 1, 'v13 con daily sobrevive a sellar, borrar el principal y recuperar desde .reciente');
  ok(!r.imp1.ok && /imposibles/.test(r.imp1.err) && /streak\.wood/.test(r.imp1.err) && !r.imp2.ok && /score/.test(r.imp2.err) && r.ok, 'importar un v13 con streak.wood = 7 o score = -1 se rechaza (rango); el exportado vuelve a entrar');
  ok(r.fixed[0] === 2 && r.fixed[1] === 0 && r.fixed[2] >= 2, 'al cargar, los rangos de daily se corrigen y quedan en S.repairs ' + JSON.stringify(r.fixed));
  ok(r.restore.ok && r.rv === 13 && r.rd, 'restaurar a mano la copia .v12 la migra a v13');
  await done(pg, 'daily-guardado');
  // ---- objetivos y racha (grupo obj del diseño)
  pg = await mk(b, 'reset=1&cine=0&speed=0');
  r = await E(pg, () => {
    const D = G.Daily, O = G.Obj, S = G.Save.data, out = {};
    S.runs = 1; D.setNow(Date.UTC(2026, 10, 14, 9)); G.Aldea.open(false);
    out.ids1 = S.daily.obj.list.map(e => e.id); out.wk = S.daily.obj.wlist.map(e => e.id);
    out.newAcc = out.ids1.concat(out.wk).filter(id => ['d_reto', 'd_pel2', 'w_oro', 'w_medal3'].indexOf(id) >= 0);
    S.bossKills.pastor = 1; S.peligro.pastor = 2; S.runs = 4; G.Aldea.open(false); out.stable = JSON.stringify(S.daily.obj.list.map(e => e.id)) === JSON.stringify(out.ids1);
    D.setNow(Date.UTC(2026, 10, 15, 9)); G.Aldea.open(false); const ids2 = S.daily.obj.list.map(e => e.id);
    out.noRepeat = ids2.every((id, i) => id !== out.ids1[i]); out.ids2 = ids2;
    // avance y pago automático una sola vez
    const ob = S.daily.obj; ob.list = [{ id: 'd_kills', goal: 300, prog: 0, done: 0, paid: 0 }, { id: 'd_mini', goal: 1, prog: 0, done: 0, paid: 0 }, { id: 'd_clean60', goal: 60, prog: 0, done: 0, paid: 0 }];
    ob.wlist = [{ id: 'w_kills', goal: 2000, prog: 0, done: 0, paid: 0 }, { id: 'w_oro', goal: 1, prog: 0, done: 0, paid: 0 }];
    const b0 = S.brasas; O.beginRun(); G.mode = 'run';
    for (let i = 0; i < 305; i++) O.onKill({ type: 'worm' });
    O.onKill({ type: 'mini_bulwark', mini: true });
    out.kills = [ob.list[0].prog, ob.list[0].done, ob.list[0].paid, ob.list[1].done, ob.wlist[0].prog]; out.paid = S.brasas - b0;
    const b1 = S.brasas; for (let i = 0; i < 10; i++) O.onKill({ type: 'worm' }); out.once = S.brasas === b1;
    G.Loot.run.clean = 61000; G.Fusion.stats.fusions = [{ id: 'vapor' }, { id: 'plasma' }]; O.runEnd({ runSecs: 120, total: 30 });
    out.clean = ob.list[2].done; out.wfuse = Object.keys(ob.wfuse).length;
    G.mode = 'practice'; O.beginRun(); const k0 = ob.wlist[0].prog; O.onKill({ type: 'worm' }); out.prac = ob.wlist[0].prog === k0; G.mode = 'run';
    // cambio gratis: 1 al día
    ob.list[1] = { id: 'd_power', goal: 20, prog: 0, done: 0, paid: 0 }; ob.rerollDay = 0;
    const r1 = O.reroll(1), r2 = O.reroll(1); out.reroll = [r1.ok, r2.ok, ob.list[1].id];
    // tope duro semanal
    ob.wpaid = { brasas: 350, parts: 128, rare: 1, trim: 0 }; const b2 = S.brasas, th0 = S.parts.thread || 0; ob.list[1] = { id: 'd_mini', goal: 1, prog: 0, done: 0, paid: 0 };
    O.debugApply({ minis: 1 }); out.cap = [S.brasas - b2, ob.wpaid.brasas, ob.wpaid.parts, ob.wpaid.trim];
    return out;
  });
  ok(r.newAcc.length === 0, 'cuenta nueva (1 expedición): sin d_reto, d_pel2, w_oro ni w_medal3 ' + JSON.stringify(r.ids1.concat(r.wk)));
  ok(r.stable, 'la lista del día es estable al volver a la aldea y al vencer a un jefe a media tarde');
  ok(r.noRepeat, 'día UTC nuevo: lista nueva sin repetir el objetivo de ayer de cada dificultad ' + JSON.stringify([r.ids1, r.ids2]));
  ok(r.kills[0] === 300 && r.kills[1] === 1 && r.kills[2] === 1 && r.kills[3] === 1 && r.kills[4] === 306 && r.paid === 8 + 12 && r.once, 'avance de bajas y guardián con pago automático una sola vez (+' + r.paid + ' Brasas) ' + JSON.stringify(r.kills));
  ok(r.clean === 1 && r.wfuse === 2 && r.prac, 'tiempo sin daño (60 s) y fusiones distintas de la semana avanzan; la práctica no avanza nada');
  ok(r.reroll[0] && !r.reroll[1] && r.reroll[2] !== 'd_power', 'cambio gratis: 1 al día; el segundo queda bloqueado ' + JSON.stringify(r.reroll));
  ok(r.cap[0] === 10 && r.cap[1] === 360 && r.cap[2] === 130 && r.cap[3] === 1, 'tope duro semanal (360 Brasas / 130 partes): el pago se recorta y se anota trim ' + JSON.stringify(r.cap));
  r = await E(pg, () => {
    const O = G.Obj, S = G.Save.data, out = { pats: 0, ok: 0, fails: [] }, d0 = 20700;
    for (let m = 0; m < 128; m++) { let bits = 0; for (let k = 0; k < 7; k++) if (m & (1 << k)) bits++; if (bits !== 5) continue; out.pats++;
      S.daily.streak = { n: 0, best: 0, last: 0, wood: 2, woodAcc: 0, miles: {} }; for (let k = 0; k < 7; k++) if (m & (1 << k)) O.played(d0 + k);
      if (S.daily.streak.n === 5) out.ok++; else out.fails.push(m); }
    S.daily.streak = { n: 12, best: 12, last: d0, wood: 0, woodAcc: 0, miles: {} }; O.notes = []; out.half = [O.played(d0 + 4), S.daily.streak.n];
    S.daily.streak = { n: 12, best: 12, last: d0, wood: 2, woodAcc: 0, miles: {} }; out.welcome = [O.played(d0 + 21), S.daily.streak.n];
    S.daily.streak = { n: 7, best: 7, last: d0, wood: 2, woodAcc: 0, miles: {} }; out.back = [O.played(d0 - 1).length, S.daily.streak.n, S.daily.streak.last];
    S.daily.streak = { n: 2, best: 2, last: d0, wood: 2, woodAcc: 0, miles: {} }; const res0 = JSON.stringify([S.brasas, S.parts, S.pf]); for (let k = 1; k <= 30; k++) O.played(d0 + k);
    out.miles = Object.keys(S.daily.streak.miles).join(); out.econ = res0 === JSON.stringify([S.brasas, S.parts, S.pf]); out.best = S.daily.streak.best;
    return out;
  });
  ok(r.pats === 21 && r.ok === 21, `racha 5 de 7: los ${r.pats} patrones conservan la racha (n = 5)` + (r.fails.length ? ' -> fallan ' + r.fails : ''));
  ok(/templó: racha 12 -> 6/.test(r.half[0].join()) && r.half[1] === 6, 'sin Leña y 3 días seguidos sin jugar: la racha baja a la mitad (aviso E7) ' + JSON.stringify(r.half));
  ok(/Has vuelto/.test(r.welcome[0].join()) && r.welcome[1] === 6, 'ausencia de 20 días: mitad y bienvenida (E8) ' + JSON.stringify(r.welcome));
  ok(r.back[0] === 0 && r.back[1] === 7, 'reloj hacia atrás: la racha ni sube ni baja');
  ok(r.miles === '3,7,14,21,28' && r.econ && r.best === 32, 'hitos de racha 3/7/14/21/28: solo cosméticos (Brasas, partes y PF iguales)');
  await done(pg, 'daily-obj');
  // ---- pantallas: texto >= 17, sin solapes; botones de 66; capturas
  const report = async (p, name, min) => { const d = await TC.snap(p, 2); const iss = TC.analyze(d, { minSize: min || TC.MIN_MENU }); const kb = kbdHints(d); ok(kb.length === 0 && d.texts.length > 5 && iss.length === 0, `${name}: ${d.texts.length} textos, ${iss.length} problemas, sin pistas de teclado` + (iss.length || kb.length ? ' -> ' + iss.slice(0, 3).map(i => i.msg).concat(kb.slice(0, 2)).join(' | ') : '')); if (SP) await p.screenshot({ path: path.join(SP, 'daily-' + name.replace(/[^a-z0-9]+/gi, '_') + '.png') }); };
  pg = await mk(b, 'reset=1&cine=0&give=brasas:5000');
  await E(pg, new Function('(' + ACC_FULL + ')();' + ` G.Save.data.runs = 5; G.Save.data.flags.smithMet = 1; G.Save.data.flags.smithGift = 1; G.Daily.forceOfficial = true; G.Daily.setNow(${DUTC('2026-11-14')}); G.Aldea.open(false); G.Aldea.pos.x = 700; G.Aldea.pos.y = 300;`));
  await sleep(pg, 400);
  { const d = await TC.snap(pg, 2), low = { texts: d.texts.filter(t => t.y0 >= 400 || /RACHA|RETO DEL/.test(t.s)), boxes: [], W: d.W, k: d.k }; const iss = TC.analyze(low, { minSize: TC.MIN_MENU });
    ok(low.texts.length >= 4 && iss.length === 0 && kbdHints(low).length === 0, 'aldea: chips RACHA y RETO DEL DÍA con letra >= 17 y sin solapes (' + low.texts.map(t => t.s).join(' / ') + ')' + (iss.length ? ' -> ' + iss.slice(0, 3).map(i => i.msg).join(' | ') : '')); if (SP) await pg.screenshot({ path: path.join(SP, 'daily-aldea.png') }); }
  const rc = await E(pg, () => { const c = G.RetoUI.rects().chips(); return [c.fire, c.reto]; });
  ok(rc.every(q => q.h >= 66), 'chips de la aldea de 66 de alto');
  await tap(pg, rc[1].x + 20, rc[1].y + 30); await sleep(pg, 300);
  ok((await E(pg, () => G.Panels.current())) === 'reto', 'tocar el chip RETO DEL DÍA abre el panel del reto');
  await report(pg, 'panel reto');
  const R0 = await E(pg, () => G.RetoUI.rects()); R0.tab = k => ({ x: 404 + k * 160, y: 0, w: 154, h: 66 });
  await tap(pg, R0.go.x + 50, R0.go.y + 30); await sleep(pg, 400);
  await report(pg, 'confirmacion');
  await tap(pg, R0.no.x + 50, R0.no.y + 30); await sleep(pg, 300);
  ok((await E(pg, () => G.state)) === 'aldea' && !(await E(pg, () => G.daily)), 'AÚN NO cierra la confirmación sin gastar el intento');
  await tap(pg, R0.kit.x + 50, R0.kit.y + 30); await sleep(pg, 300);
  for (const k of [0, 1, 2]) { await tap(pg, R0.tab(k).x + 40, 30); await sleep(pg, 200); await report(pg, 'ficha kit ' + ['armadura', 'forja', 'mano'][k]); }
  await tap(pg, R0.back.x + 40, R0.back.y + 30); await sleep(pg, 200);
  await tap(pg, R0.obj.x + 40, R0.obj.y + 30); await sleep(pg, 300);
  ok((await E(pg, () => G.Panels.current())) === 'diario', 'OBJETIVOS Y RACHA abre el panel DIARIO');
  for (const k of [0, 1]) { await tap(pg, R0.tab(k).x + 40, 30); await sleep(pg, 200); await report(pg, 'diario ' + ['objetivos', 'hoguera'][k]); }
  await E(pg, () => { G.Aldea.open(false); G.Aldea.openPanel('menu'); }); await sleep(pg, 200); await report(pg, 'menu con RETO Y OBJETIVOS');
  await E(pg, () => { G.Aldea.open(false); G.Aldea.openPanel('reto'); }); await sleep(pg, 200);
  await tap(pg, R0.go.x + 50, R0.go.y + 30); await sleep(pg, 400); await tap(pg, R0.yes.x + 50, R0.yes.y + 30); await sleep(pg, 400);
  r = await E(pg, () => ({ d: !!G.daily, off: G.daily && G.daily.official, st: G.state }));
  ok(r.d && r.off, 'EMPEZAR en la confirmación lanza el intento con premio');
  await E(pg, () => { for (let i = 0; i < 1200; i++) { if (G.state === 'cards') { G.Cards.skip(); G.state = 'play'; } G.step(); } });
  const dh = await TC.snap(pg, 1); ok(dh.texts.some(t => /^RETO\s+[\d.]+$/.test(t.s)) && TC.analyze(dh, { minSize: WX === '&wide=0' ? 11.5 : TC.MIN_HUD }).filter(i => i.k === 'solape').length === 0, 'chip del HUD "RETO  n" visible y sin solapes');
  if (SP) await pg.screenshot({ path: path.join(SP, 'daily-hud.png') });
  await E(pg, () => { G.state = 'paused'; G.Hud.pauseOpen(); }); await report(pg, 'pausa del reto');
  ok((await TC.snap(pg, 1)).texts.some(t => t.s === 'TERMINAR INTENTO'), 'pausa: TERMINAR INTENTO');
  await E(pg, () => { G.state = 'play'; G.finish(false); }); await sleep(pg, 700);
  await report(pg, 'resultado del reto');
  const Rr = await E(pg, () => G.RetoUI.rects());
  await tap(pg, Rr.share.x + 30, Rr.share.y + 30); await sleep(pg, 400);
  await E(pg, () => { G.Base.retry(); }); r = await E(pg, () => ({ d: !!G.daily, off: G.daily && G.daily.official }));
  ok(r.d && r.off === false, 'REINTENTAR (SIN PREMIO) relanza el reto sin premio');
  await E(pg, () => { G.finish(false); G.Base.open(true); }); await sleep(pg, 300);
  ok((await E(pg, () => G.state)) === 'aldea' && !(await E(pg, () => G.Kit.cur)), 'IR A LA ALDEA vuelve a Rescoldo sin kit en memoria');
  await done(pg, 'daily-pantallas');
  await b.close();
}
// ---------------------------------------------------------------- T-F1-07: economía presentada por pasos (src/res.js, studio/docs/SPEC-T-F1-07.md, sección 7)
// Cada comprobación cuenta los recursos de dos formas: el registro G.Res.shown() y una regex por recurso sobre TC.snap.
const RES_RX = { ceniza: /Ceniza/, brasas: /Brasas/, partes: /\b[Pp]artes?\b|Hebra|Pluma|Púa|Colmillo|Placa|Mecha|Escarcha|Jirón/, esencia: /Esencia|Rara x/, pf: /\bPF\b|punto.? de forja/i, trofeos: /trofeo|insignia/i };   // F2: las Insignias van dentro de Trofeos (una regex para las dos familias)
const resRx = d => Object.keys(RES_RX).filter(k => d.texts.some(t => RES_RX[k].test(t.s))).sort();
async function resSnap(pg, frames = 2) { const d = await TC.snap(pg, frames); const reg = await E(pg, () => G.Res.shown()); return { d, rx: resRx(d), reg, has: re => d.texts.some(t => re.test(t.s)) }; }
const sub = (a, allow) => a.every(x => allow.includes(x));
const resLoot = pg => E(pg, () => {   // guardián abatido (PF), Esencia, parte de jefe rota (trofeo de jefe) y trofeo de guardián
  const p = G.player, mid = G.Minis.ALL[0];
  G.Tree.onElite('mini_bulwark', { x: p.x, y: p.y, mini: true, slot: 1 });
  G.Loot.collect('rare'); G.Loot.run.boss = { id: 'pastor', parts: ['cuernos'], won: false }; G.Loot.collect('rare', 'horn');
  G.Minis.collectInsignia({ ins: G.Minis.D[mid].ins.id, mid: mid });
});
const resOffer = pg => E(pg, () => { G.player.level = Math.max(2, G.player.level + 1); G.pendingLevels = 1; for (let i = 0; i < 3 && G.state !== 'cards'; i++) G.step(); return G.state; });
const resEnd = (pg, secs) => E(pg, s => { G.runT = G.time = s * 1000; G.player.hp = 0; G.player.dead = true; G.finish(false); }, secs || 70);
const resDetail = pg => E(pg, () => { for (let i = 0; i < 45; i++) G.step(); G.input.mouse.x = 700; G.input.mouse.y = 150; G.input.pressed.Mouse0 = true; G.step(); return G.Base.endView(); });
const resLaunch = pg => E(pg, () => { G.Dialog.close(); G.Panels.closeAll(); G.Aldea.setPanel(null); G.launchReq = null; G.Base.launch(); for (let i = 0; i < 30; i++) { if (G.state === 'cards') G.Cards.pick(0); G.step(); } return G.state; });
const resSaid = pg => E(pg, () => { window.__said = []; if (!G.Dialog.__rw) { const o = G.Dialog.say; G.Dialog.say = function (w, t) { window.__said = window.__said.concat(t); return o.apply(this, arguments); }; G.Dialog.__rw = 1; } });
async function res() {
  console.log('--- res: economía presentada por pasos (T-F1-07): visibilidad de recursos por número de salidas');
  const b = await launch(), union = new Set(), add = a => a.forEach(x => union.add(x));
  const T = await (async () => { const pg = await mk(b, 'reset=1&direct=1&speed=0'); const t = await E(pg, () => G.Res.TXT); await pg.close(); await pg.ctx.close(); return t; })();
  const rxOf = s => new RegExp('^' + s.slice(0, 18).replace(/[.*+?^${}()|[\]\\¿?¡!]/g, '\\$&'));
  // 1. Salida 1 de una cuenta nueva: HUD, oferta y fin (principal y detalle) como mucho {Partes, Brasas}
  let pg = await mkV(b, 'track=log&cine=0&reset=1&speed=0&seed=3'); await startFirst(pg); await fStep(pg, 30);
  ok(await E(pg, () => G.Res.on() && !G.Res.visible('pf') && !G.Res.visible('ceniza') && G.Res.visible('partes')), 'cuenta nueva del flujo nuevo: G.Res activo; PF y Ceniza ocultos, Partes visibles');
  await resLoot(pg); await fStep(pg, 2);
  let s = await resSnap(pg, 1); add(s.rx); add(s.reg);
  ok(sub(s.rx, ['partes', 'brasas']) && sub(s.reg, ['partes', 'brasas']) && s.has(/GUARDIÁN DERRIBADO/) && !s.has(/PUNTO DE FORJA|INSIGNIA|TROFEO|Rara x/), `salida 1, combate (guardián, Esencia, trofeo de jefe y de guardián forzados): regex [${s.rx}] registro [${s.reg}], "¡GUARDIÁN DERRIBADO!" y sin PF / TROFEO / Rara x`);
  ok((await resOffer(pg)) === 'cards', 'salida 1: subida de nivel -> oferta');
  s = await resSnap(pg, 1); add(s.rx); add(s.reg);
  const rr = await E(pg, () => { const a = G.player.ash, n = G.Cards.off.rerolls; G.Cards.reroll(); G.input.pressed.KeyR = true; G.step(); return a === G.player.ash && (!G.Cards.off || G.Cards.off.rerolls === n); });
  ok(sub(s.rx, ['partes', 'brasas']) && !s.has(/REROLL/) && rr, `salida 1, oferta: sin contador de Ceniza ni REROLL (botón, tecla R y C.reroll no hacen nada); regex [${s.rx}]`);
  ok(TC.analyze(s.d, { minSize: TC.MIN_MENU }).length === 0, 'oferta sin REROLL: sin problemas de texto');
  await E(pg, () => G.Cards.closeOffer()); await resEnd(pg);
  s = await resSnap(pg); add(s.rx); add(s.reg);
  ok(sub(s.rx, ['partes', 'brasas']) && sub(s.reg, ['partes', 'brasas']) && s.has(rxOf(T['res.partes.first'])) && s.has(rxOf(T['res.brasas.first'])), `salida 1, fin: res.partes.first y res.brasas.first; regex [${s.rx}] registro [${s.reg}]`);
  ok((await resDetail(pg)) === 'detail', 'salida 1: detalle del botín');
  s = await resSnap(pg); add(s.rx); add(s.reg);
  ok(sub(s.rx, ['partes', 'brasas']) && sub(s.reg, ['partes', 'brasas']) && !s.has(/Prob\. de Esencia|PF libres/), `salida 1, detalle: sin Esencia, trofeos ni PF (regex [${s.rx}] registro [${s.reg}])`);
  const sm1 = await E(pg, () => ({ t: G.Loot.summary.total, rare: G.Loot.summary.rare, pf: G.Save.data.pf.earned, ins: Object.keys(G.Save.data.insignias).length, tr: G.Save.data.trophies.horn }));   // ins = trofeos de guardián (campo insignias)
  ok(sm1.rare >= 2 && sm1.pf >= 2 && sm1.ins >= 1 && sm1.tr === 1, 'lo ganado en silencio se guarda igual: Esencia ' + sm1.rare + ', PF ' + sm1.pf + ', trofeos de guardián ' + sm1.ins + ', trofeo de jefe ' + sm1.tr + ' (dentro de "+' + sm1.t + ' partes")');
  // 2. Aldea tras la salida 1: barra y Portal (DESTINO y SALIDA) solo {Brasas}; Rápida = "Menos botín, jefe antes"
  await E(pg, () => G.Base.open(true)); await sleep(pg, 100);
  s = await resSnap(pg); add(s.rx); add(s.reg);
  ok(sub(s.rx, ['brasas']) && sub(s.reg, ['brasas']) && !s.has(/DIARIO/), `aldea tras la salida 1: regex [${s.rx}] registro [${s.reg}] (sin el chip del Diario)`);
  await E(pg, () => { G.Aldea.openPanel('portal'); G.Panels.portalTab(0); }); await sleep(pg, 100);
  s = await resSnap(pg); add(s.rx); add(s.reg); const pd = s;
  await E(pg, () => { G.Save.data.len = 7; G.Panels.portalTab(2); }); await sleep(pg, 100);
  s = await resSnap(pg); add(s.rx); add(s.reg);
  ok(sub(pd.rx, ['brasas']) && sub(s.rx, ['brasas']) && sub(s.reg, ['brasas']) && s.has(/Menos botín, jefe antes/) && !s.has(/\bPF\b|Esencia/), `Portal tras la salida 1 (DESTINO [${pd.rx}], SALIDA [${s.rx}]): sin PF ni Esencia; Rápida = "Menos botín, jefe antes"`);
  // T-F1-08 / T-F1-07: Logros de Lanudo (todas sus páginas) y Forja (nodo épico "Exige 1 Esencia rara") no nombran trofeos (de jefe o de guardián), Esencia ni PF aún ocultos
  { const hid = await E(pg, () => ['trofeos', 'esencia', 'pf'].filter(k => !G.Res.visible(k)));
    const lg = []; let lgN = 0, ach = await E(pg, () => JSON.stringify(G.Save.data.ach));
    for (let sc = 0; sc < 40; sc += 5) { await E(pg, n => { G.Aldea.open(false); G.Aldea.openPanel('logros'); G.Panels.logrosScroll(n); }, sc); await sleep(pg, 80); s = await resSnap(pg); lgN += s.d.texts.length; s.rx.filter(k => hid.includes(k)).forEach(k => lg.push(k)); }
    const lgD = await E(pg, () => G.Ach.DEFS.map(a => G.Panels.achText(a)).filter(t => /[Ii]nsignia|[Tt]rofeo|Esencia|\bPF\b/.test(t.name + t.desc + t.lore)).length);
    ok(hid.length === 3 && lg.length === 0 && lgD === 0 && lgN > 40 && ach === (await E(pg, () => JSON.stringify(G.Save.data.ach))), `Logros tras la salida 1 (ocultos: ${hid}): ninguna página ni ficha los nombra (${[...new Set(lg)]}); los logros conseguidos no cambian`);
    await E(pg, () => { G.Aldea.open(false); G.Aldea.openPanel('forge'); G.Tree.showDetail('F8'); }); await sleep(pg, 100); s = await resSnap(pg);
    const fj = d => d.texts.map(t => t.s).join(' ');
    ok(!s.has(/Esencia/) && /Exige 1 parte rara/.test(fj(s.d)) && TC.analyze(s.d, { minSize: TC.MIN_MENU }).length === 0, 'Forja, nodo épico sin la Esencia presentada: "Exige 1 parte rara" (G.Res.fix), sin nombrar la Esencia');
    await E(pg, () => { G.Save.data.nodes.R3 = { c: '1' }; G.Aldea.open(false); G.Aldea.openPanel('forge'); G.Tree.showDetail('F8'); }); await sleep(pg, 100); s = await resSnap(pg);
    ok(/Exige 1 Esencia rara/.test(fj(s.d)), 'con la Esencia ya presentada (Rango III) el nodo vuelve a decir "Exige 1 Esencia rara"');
    await E(pg, () => { delete G.Save.data.nodes.R3; G.Panels.closeAll(); G.Aldea.setPanel(null); }); }
  await E(pg, () => { G.Save.data.len = 9; G.Panels.closeAll(); G.Aldea.setPanel(null); });
  // 3. Salida 2: igual que la 1
  ok((await resLaunch(pg)) === 'play' && (await fteState(pg)).runs === 1, 'salida 2 desde el Portal');
  await resLoot(pg); await fStep(pg, 2); s = await resSnap(pg, 1); add(s.rx); add(s.reg);
  ok(sub(s.rx, ['partes', 'brasas']) && sub(s.reg, ['partes', 'brasas']) && !s.has(/PUNTO DE FORJA|INSIGNIA|TROFEO|Rara x/), `salida 2, combate: regex [${s.rx}] registro [${s.reg}]`);
  await resOffer(pg); s = await resSnap(pg, 1); add(s.rx);
  ok(!s.has(/REROLL|Ceniza/), 'salida 2, oferta: sin REROLL ni Ceniza');
  await E(pg, () => G.Cards.closeOffer()); await resEnd(pg); s = await resSnap(pg); add(s.rx); add(s.reg);
  ok(sub(s.rx, ['partes', 'brasas', 'pf']) && sub(s.reg, ['partes', 'brasas', 'pf']), `salida 2, fin: [${s.rx}] (el PF ya puede aparecer: llega Grum)`);
  // 4. Aldea tras la salida 2: PF en la barra, en Grum (res.pf.first y res.pf.stored con el saldo real, una vez) y en Vesper
  await E(pg, () => G.Base.open(true)); await sleep(pg, 100); s = await resSnap(pg); add(s.rx); add(s.reg);
  ok(s.rx.includes('pf') && s.reg.includes('pf') && sub(s.rx, ['brasas', 'pf']), `aldea tras la salida 2: PF en la barra (regex [${s.rx}] registro [${s.reg}])`);
  await resSaid(pg); const pfFree = await E(pg, () => { G.Aldea.talk('grum'); return G.Tree.pfFree(); }); let said = await E(pg, () => window.__said);
  const st1 = pfFree === 1 ? T['res.pf.stored1'] : T['res.pf.stored'].replace('{0}', pfFree);
  ok(said[0] === T['res.pf.first'] && said[1] === st1 && /El hierro recuerda/.test(said[2] || ''), `Grum, 1.ª charla: res.pf.first + "${st1}" (PF libres ${pfFree}) y luego su línea`);
  const tg = await TC.snap(pg, 2); ok(TC.analyze(tg, { minSize: TC.MIN_MENU }).length === 0, 'charla de Grum: sin problemas de texto');
  await E(pg, () => { G.Dialog.close(); window.__said = []; G.Aldea.talk('grum'); }); said = await E(pg, () => window.__said);
  ok(!said.includes(T['res.pf.first']), 'la 2.ª charla con Grum no repite la línea del PF');
  await E(pg, () => { G.Dialog.close(); G.Aldea.openPanel('vesper'); }); await sleep(pg, 100); s = await resSnap(pg);
  ok(s.rx.includes('pf'), 'Vesper (Tablón) enseña el PF tras la salida 2');
  // 5. Salida 3 y su fin: {Partes, Brasas, PF}; el guardián ya da el aviso de PF; sigue sin REROLL
  ok((await resLaunch(pg)) === 'play', 'salida 3');
  await E(pg, () => { const p = G.player; G.Save.data.elites = {}; G.Tree.onElite('mini_bulwark', { x: p.x, y: p.y, mini: true, slot: 1 }); }); await fStep(pg, 2);
  s = await resSnap(pg, 1); add(s.rx); add(s.reg);
  ok(s.has(/PUNTO.? DE FORJA/) && sub(s.rx, ['partes', 'brasas', 'pf']) && s.reg.includes('pf'), `salida 3, combate: el guardián ya da "+1 PUNTO DE FORJA" (regex [${s.rx}])`);
  await resOffer(pg); s = await resSnap(pg, 1); add(s.rx);
  ok(!s.has(/REROLL|Ceniza/), 'salida 3, oferta: sigue sin REROLL');
  await E(pg, () => G.Cards.closeOffer()); await resEnd(pg); s = await resSnap(pg); add(s.rx); add(s.reg);
  await resDetail(pg); const s5 = await resSnap(pg); add(s5.rx); add(s5.reg);
  ok(sub(s.rx, ['partes', 'brasas', 'pf']) && sub(s5.rx, ['partes', 'brasas', 'pf']), `salida 3, fin [${s.rx}] y detalle [${s5.rx}]: {Partes, Brasas, PF}`);
  // 6. Criterio: la unión de lo mostrado en 1-5 tiene exactamente 3 recursos
  const U3 = [...union].sort();
  ok(U3.join() === 'brasas,partes,pf', 'CRITERIO: en las 3 primeras salidas se ven exactamente 3 recursos: ' + U3.join(', '));
  // 7. Aldea tras la salida 3: Rufo presenta la Ceniza; en la salida 4 vuelve el REROLL y la 1.ª oferta lleva res.ceniza.first
  await E(pg, () => G.Base.open(true)); await resSaid(pg); await E(pg, () => G.Aldea.talk('rufo')); said = await E(pg, () => window.__said);
  ok(said[0] === T['res.ceniza.rufo'], 'Rufo, 1.ª charla tras la salida 3: res.ceniza.rufo');
  ok((await resLaunch(pg)) === 'play', 'salida 4');
  s = await resSnap(pg, 1); ok(s.rx.includes('ceniza') && s.reg.includes('ceniza'), 'salida 4: Ceniza en el HUD');
  await resOffer(pg); s = await resSnap(pg, 1);
  ok(s.has(/REROLL/) && s.has(/Ceniza: \d+/) && s.has(rxOf(T['res.ceniza.first'])), 'salida 4, 1.ª oferta: REROLL, contador de Ceniza y res.ceniza.first');
  ok(await E(pg, () => { const n = G.Cards.off.rerolls; G.player.ash = 100; G.Cards.reroll(); return G.Cards.off.rerolls === n + 1; }), 'salida 4: el REROLL funciona');
  await done(pg, 'res-salidas');
  // 8. Esencia: oculta con R2; el Rango III la presenta con el saldo; los nodos T3 pasan de "Pide Rango de forja III" a su coste
  pg = await mkV(b, 'track=log&cine=0&reset=1&speed=0&seed=3'); await startFirst(pg);
  let r = await E(pg, () => { const S = G.Save.data, f = S.flags.fte; f.runs = 4; f.step = 'done'; S.nodes.R2 = { c: '1' }; S.parts.rare = 3; S.parts.thread = 200; S.parts.feather = 80; S.parts.plate = 40; S.brasas = 2000;
    const a = { v: G.Res.visible('esencia'), lk: G.Res.nodeLock(G.Tree.node('F8')) }; G.Aldea.open(false); G.Aldea.openPanel('forge'); G.Tree.showDetail('F8'); return a; });
  const f7 = await E(pg, () => G.Tree.node('F8').tier);
  s = await resSnap(pg); const ft = s;
  ok(!r.v && r.lk === T['res.locked.esencia'] && s.has(/Pide Rango de forja III/), `con R2 la Esencia sigue oculta; nodo ${f7}: "${r.lk}" en lugar del coste`);
  ok(TC.analyze(ft.d, { minSize: TC.MIN_MENU }).length === 0, 'Forja con "Pide Rango de forja III": sin problemas de texto');
  r = await E(pg, () => { const o = G.Tree.buy('R3'); return { o, v: G.Res.visible('esencia'), lk: G.Res.nodeLock(G.Tree.node('F8')) }; });
  ok(r.o.ok && r.o.res === 'esencia' && r.o.msg.indexOf(T['res.esencia.first']) === 0 && r.o.msg.indexOf(T['res.esencia.stored'].replace('{0}', 3)) > 0 && r.v && r.lk === null, 'comprar el Rango III: aviso res.esencia.first + "Guardabas 3 Esencias..." y desde ahí el nodo enseña su coste');
  await done(pg, 'res-esencia');
  // 9. Trofeos (de jefe y de guardián, F2): ocultos hasta vencer al Pastor; la escena de Carapa da sus líneas con los saldos; desde ahí, aviso "TROFEO: ..."
  pg = await mkV(b, 'track=log&cine=0&reset=1&speed=0&seed=3'); await startFirst(pg);
  r = await E(pg, () => { const S = G.Save.data, f = S.flags.fte; f.runs = 2; f.step = 'village'; S.trophies = { horn: 2, staff: 1 }; S.insignias = { [G.Minis.ALL[0]]: 1 }; return { t: G.Res.visible('trofeos'), i: G.Res.visible('insignias') }; });
  ok(!r.t && !r.i, 'sin vencer al Pastor: trofeos de jefe y de guardián ocultos (el alias \'insignias\' sigue a \'trofeos\')');
  await resSaid(pg); await E(pg, () => { G.Save.data.bossKills.pastor = 1; G.Aldea.open(true); for (let i = 0; i < 5; i++) G.Aldea.update(16); });
  said = await E(pg, () => window.__said);
  ok(said.includes(T['res.trofeos.first']) && said.includes(T['res.trofeos.stored'].replace('{0}', 3)) && said.includes(T['res.trofeos.guard']) && said.includes(T['res.trofeos.guardStored1']) && said.indexOf(T['res.trofeos.first']) < said.indexOf(T['res.trofeos.guard']) && said.indexOf(T['res.trofeos.guardStored1']) < said.findIndex(x => /Toma el set de Aldeano|Ya te dejé ropa/.test(x)) && !said.some(x => /[Ii]nsignia/.test(x)), 'escena de Carapa: trofeos de jefe ("Traes 3 trofeos..."), de guardián ("Ya traes un trofeo de guardián."), sin la palabra Insignia, y luego el regalo');
  const tc = await TC.snap(pg, 2); ok(TC.analyze(tc, { minSize: TC.MIN_MENU }).length === 0, 'escena de Carapa: sin problemas de texto');
  await resLaunch(pg); await E(pg, () => { const mid = G.Minis.ALL[1]; G.Minis.collectInsignia({ ins: G.Minis.D[mid].ins.id, mid: mid }); }); await fStep(pg, 1);
  s = await resSnap(pg, 1); ok(s.has(/^TROFEO: /) && !s.has(/INSIGNIA/) && s.reg.includes('trofeos'), 'con Carapa abierta, recoger un trofeo de guardián da el aviso "TROFEO: ..." (registro trofeos)');
  await E(pg, () => G.Minis.collectInsignia({ ins: G.Minis.D.yeti_mayor.ins.id, mid: 'yeti_mayor' })); await fStep(pg, 30); s = await resSnap(pg, 1);   // tras el 'pop' inicial (1/7 de 1,8 s), a letra 40
  { const bn = s.d.texts.find(t => /^TROFEO: /.test(t.s)), out = TC.analyze(s.d, { minSize: 0 }).filter(i => i.k === 'fuera' && /TROFEO/.test(i.msg));
    ok(bn && bn.s === 'TROFEO: GARRA DEL YETI MAYOR  (¡NUEVO!)' && out.length === 0, 'F2: el aviso más largo ("' + (bn && bn.s) + '", x ' + (bn && Math.round(bn.x0) + '..' + Math.round(bn.x1)) + ' de ' + s.d.W + ') cabe en pantalla (2 caracteres más corto que el de antes, "INSIGNIA: ...")' + out.map(i => ' -> ' + i.msg).join('')); }
  await E(pg, () => { G.Loot.run.boss = { id: 'pastor', parts: ['cuernos'], won: false }; G.Loot.collect('rare', 'horn'); }); await resEnd(pg); await resDetail(pg); s = await resSnap(pg);
  ok(s.reg.includes('trofeos') && s.has(/^\+1 Cuerno/), 'y el detalle del botín enseña la casilla del trofeo');
  await done(pg, 'res-carapa');
  // 10. Regla 5: vencer al Pastor en la salida 2 vuelve visibles PF, Ceniza y trofeos (la Esencia no)
  pg = await mkV(b, 'track=log&cine=0&reset=1&speed=0&seed=3'); await startFirst(pg);
  r = await E(pg, () => { const f = G.Save.data.flags.fte; f.runs = 1; f.step = 'village'; G.Save.data.bossKills.pastor = 1; const o = {}; G.Res.IDS.forEach(id => { o[id] = G.Res.visible(id); }); return o; });
  ok(r.pf && r.ceniza && r.trofeos && !('insignias' in r) && !r.esencia, 'regla 5: un jefe vencido en la salida 2 abre PF, Ceniza y trofeos (6 recursos, sin Insignias aparte); la Esencia sigue esperando al Rango III (' + JSON.stringify(r) + ')');
  await done(pg, 'res-regla5');
  // 11. Abandonar antes de 60 s no adelanta ningún recurso
  pg = await mkV(b, 'track=log&cine=0&reset=1&speed=0&seed=3'); await startFirst(pg); await fStep(pg, 120); await E(pg, () => G.finish(false)); await sleep(pg, 100);
  r = await E(pg, () => ({ runs: G.Fte.data().runs, pf: G.Res.visible('pf'), c: G.Res.visible('ceniza') }));
  ok(r.runs === 0 && !r.pf && !r.c, 'abandonar antes de 60 s no adelanta recursos (salidas ' + r.runs + ')');
  // 12. Archivo, pestaña RECURSOS: 6 filas siempre con el saldo real (F2: Trofeos = de jefe + de guardián)
  const arch = async (label, prep) => {
    const o = await E(pg, prep => { if (prep) new Function(prep)(); G.Dialog.close(); G.Aldea.open(false); G.Aldea.openPanel('archive'); G.Panels.archTab(2); const rows = G.Panels.resRows(), S = G.Save.data;
      const sum = o => Object.values(o || {}).reduce((a, b) => a + b, 0);
      const okv = rows.length === 6 && rows.map(r => r.id).join() === 'ceniza,brasas,partes,esencia,pf,trofeos' && rows[1].have === S.brasas && rows[3].have === (S.parts.rare || 0) && rows[4].have === G.Tree.pfFree() && rows[0].have === null && rows[5].have === sum(S.trophies) + sum(S.insignias);
      return { okv, soon: rows.filter(r => r.soon).map(r => r.id).join() }; }, prep || null);
    await sleep(pg, 100); const d = await TC.snap(pg, 2);
    const names = ['Ceniza', 'Brasas', 'Partes', 'Esencia rara', 'Puntos de Forja', 'Trofeos'].filter(n => d.texts.some(t => t.s === n)).length;
    ok(o.okv && names === 6 && !d.texts.some(t => /[Ii]nsignia/.test(t.s)), `Archivo RECURSOS (${label}): 6 filas con el saldo real (Trofeos = de jefe + de guardián), sin la palabra Insignia; por presentar: ${o.soon || 'ninguno'}`);
    return d;
  };
  let ad = await arch('cuenta nueva, 0 salidas');
  ok(TC.analyze(ad, { minSize: TC.MIN_MENU }).length === 0 && !kbdHints(ad).length, 'Archivo RECURSOS: sin problemas de texto');
  await arch('n = 1', "const f = G.Save.data.flags.fte; f.runs = 1; f.step = 'village'; G.Save.data.brasas = 321; G.Save.data.parts.rare = 2;");
  await arch('n = 4', "const f = G.Save.data.flags.fte; f.runs = 4; f.step = 'done'; G.Save.data.trophies = { horn: 2 }; G.Save.data.insignias = { carnero: 1, tejedora: 2 };");
  await arch('legacy', "const f = G.Save.data.flags.fte; f.legacy = 1;");
  await done(pg, 'res-archivo');
  // 13. Economía intacta: misma semilla y mismas acciones con ?res=0 y sin él dan el mismo resumen y el mismo guardado (salvo flags.res)
  const econ = async (extra) => {
    const p2 = await mkV(b, 'track=log&cine=0&reset=1&speed=0&seed=41' + extra); await startFirst(p2);
    const o = await E(p2, () => {
      for (let i = 0; i < 60 * 75; i++) { const p = G.player; G.input.joy = { active: true, id: 1, ox: 100, oy: 400, x: Math.cos(i / 90), y: Math.sin(i / 90) }; if (G.state === 'cards') { const O = G.Cards.off; if (O) { O.modal = null; if (O.mode === 'level') G.Cards.pick(0); else G.Cards.pick(0); } if (G.state === 'cards') G.state = 'play'; } p.hp = p.maxHp; G.step(); }
      G.input.joy = { active: false, id: null, ox: 0, oy: 0, x: 0, y: 0 }; G.finish(false);
      const sm = G.Loot.summary, d = JSON.parse(JSON.stringify(G.Save.data)); delete d.flags.res; if (d.stats) delete d.stats.playMs;
      return { sm: JSON.stringify({ parts: sm.parts, total: sm.total, brasas: sm.brasas, pf: sm.pfGained, rare: sm.rare, kills: sm.kills }), save: JSON.stringify(d), on: G.Res.on() };
    });
    await done(p2, 'res-economia' + (extra || '-on')); return o;
  };
  const eOn = await econ(''), eOff = await econ('&res=0');
  ok(eOn.on && !eOff.on && eOn.sm === eOff.sm, 'economía intacta: mismo resumen de botín con y sin ?res=0 (' + eOn.sm.slice(0, 90) + '...)');
  ok(eOn.save === eOff.save, 'economía intacta: mismo Save.data al terminar (salvo flags.res y playMs)');
  // 14. ?dev=1&res=0 y ?fte=0: todo visible desde la salida 1, REROLL incluido
  for (const q of ['res=0', 'fte=0']) {
    const p3 = await mkV(b, 'track=log&cine=0&reset=1&speed=0&seed=3&' + q);
    await E(p3, () => { if (G.TrackUI.isOpen()) G.TrackUI.choose(false); if (G.Fte.enabled()) G.Fte.launchFirst(); else G.startGame(); }); await fStep(p3, 30);
    await resLoot(p3); await fStep(p3, 1);
    let s3 = await resSnap(p3, 1); const hud = s3.rx;
    await resOffer(p3); s3 = await resSnap(p3, 1);
    ok(!(await E(p3, () => G.Res.on())) && hud.includes('ceniza') && (hud.includes('trofeos') || hud.includes('pf')) && s3.has(/REROLL/) && s3.has(/Ceniza: \d+/), `?${q}: todo visible desde la salida 1 (HUD [${hud}]) y REROLL en la oferta`);
    await done(p3, 'res-off-' + q);
  }
  // 15. Guardados v9-v12 con progreso: legacy, todo visible, ninguna línea de primera vez
  for (const v of [9, 10, 11, 12]) {
    const p4 = await mkV(b, 'track=log&cine=0&reset=1&speed=0');
    await E(p4, v => { const d = JSON.parse(JSON.stringify(G.Save.data)); d.v = v; d.runs = 3; d.brasas = 120; d.parts = { rare: 2, thread: 5 }; delete d.flags.fte; delete d.flags.res; if (v < 12) delete d.cine; localStorage.setItem('swarmhand.fusion.save', JSON.stringify(d)); }, v);
    await p4.goto(`${base}/index.html?dev=1&nosw=1&track=log&cine=0&speed=0${WX}`); await sleep(p4, 700);
    const o = await E(p4, () => { const all = G.Res.IDS.every(id => G.Res.visible(id)), fl = G.Res.first('pf') || G.Res.first('esencia') || G.Res.endLines(); return { on: G.Res.on(), all, fl, leg: G.Save.data.flags.fte.legacy }; });
    ok(o.leg === 1 && !o.on && o.all && o.fl === null, `guardado v${v} con progreso: legacy, los 6 recursos visibles y ninguna línea de primera vez`);
    await done(p4, 'res-legacy-v' + v);
  }
  // 16. Textos de las pantallas nuevas a 844x390 y 740x360 (fin de la salida 1, Grum, Carapa, Archivo RECURSOS, Forja con "Pide Rango de forja III")
  for (const [w, h] of [[844, 390], [740, 360]]) {
    const p5 = await mkV(b, 'track=log&cine=0&reset=1&speed=0&seed=3', w, h); await startFirst(p5); await fStep(p5, 20); await resEnd(p5);
    const rep = async (name) => { const d = await TC.snap(p5, 2); const iss = TC.analyze(d, { minSize: TC.MIN_MENU }); ok(d.texts.length > 3 && iss.length === 0 && !kbdHints(d).length, `${w}x${h} ${name}: ${d.texts.length} textos, ${iss.length} problemas` + (iss.length ? ' -> ' + iss.slice(0, 3).map(i => i.msg).join(' | ') : '')); };
    await rep('fin de la salida 1');
    await E(p5, () => { const f = G.Save.data.flags.fte; f.runs = 2; f.step = 'village'; G.Save.data.pf.earned = 3; G.Base.open(true); G.Aldea.talk('grum'); }); await sleep(p5, 200); await rep('charla de Grum (res.pf.first)');
    await E(p5, () => { G.Dialog.close(); G.Save.data.bossKills.pastor = 1; G.Save.data.trophies = { horn: 1 }; G.Aldea.open(true); for (let i = 0; i < 5; i++) G.Aldea.update(16); }); await sleep(p5, 200); await rep('escena de Carapa');
    await E(p5, () => { G.Dialog.close(); G.Aldea.openPanel('archive'); G.Panels.archTab(2); }); await sleep(p5, 150); await rep('Archivo RECURSOS');
    await E(p5, () => { G.Panels.closeAll(); G.Aldea.setPanel(null); G.Save.data.nodes.R2 = { c: '1' }; G.Aldea.openPanel('forge'); G.Tree.showDetail('F8'); }); await sleep(p5, 150); await rep('Forja, nodo T3 ("Pide Rango de forja III")');
    await done(p5, 'res-textos-' + w);
  }
  await b.close();
}
async function vibe() {
  console.log('--- T-F1-09: vibracion y destello (navigator.vibrate simulado)');
  const b = await launch(); let pg = await mk(b, 'reset=1&speed=0&direct=1&all=1&noanchor=1');
  const sim = () => E(pg, () => { window.__vib = []; navigator.vibrate = p => { window.__vib.push(p); return true; }; G.Save.data.settings = G.Save.data.settings || {}; delete G.Save.data.settings.vibe; G.Save.data.settings.cine = { calm: false, textSpeed: 1, soundCaps: true }; });
  await sim();
  let r = await E(pg, () => { const p = G.player; p.hurtT = 0; p.hp = p.maxHp; G.Player.hurt(p, 1, p.x + 10, p.y, { src: 'test' }); return { n: window.__vib.length, on: G.fx.vibeOn() }; });
  ok(r.on && r.n === 1, 'golpe recibido: vibra una vez (' + r.n + ')');
  r = await E(pg, () => { window.__vib.length = 0; G.fx.vibe('fuse'); G.fx.vibe('part'); return window.__vib.length; });
  ok(r === 2, 'fusion y parte de jefe vibran');
  r = await E(pg, () => { window.__vib.length = 0; G.Save.data.settings.vibe = 0; G.fx.vibe('fuse'); G.fx.vibe('part'); const p = G.player; p.hurtT = 0; G.Player.hurt(p, 1, p.x + 10, p.y, { src: 'test' }); G.fx.vibe('hurt'); return window.__vib.length; });
  ok(r === 0, 'ajuste apagado: no vibra');
  r = await E(pg, () => { window.__vib.length = 0; delete G.Save.data.settings.vibe; G.Save.data.settings.cine.calm = true; const off = G.fx.vibeOn(); G.fx.vibe('fuse'); const n0 = window.__vib.length; G.Save.data.settings.vibe = 1; const on = G.fx.vibeOn(); G.fx.vibe('fuse'); G.fx.pulseA = 0; G.fx.pulse(0.25); return { off, n0, on, n1: window.__vib.length, pa: G.fx.pulseA }; });
  ok(!r.off && r.n0 === 0 && r.on && r.n1 === 1, 'reducir destellos: apagado por defecto, pero se puede encender a mano');
  ok(r.pa <= 0.06, 'reducir destellos: el destello de pantalla casi no se ve (' + r.pa.toFixed(3) + ')');
  r = await E(pg, () => { G.Save.data.settings.cine.calm = false; G.fx.pulseA = 0; G.fx.pulse(0.9); const a = G.fx.pulseA; G.Save.save(); const back = G.Save.parse ? true : true; const raw = localStorage.getItem(Object.keys(localStorage).find(k => /save$|save\.v13$/.test(k)) || ''); return { a, saved: !raw || raw.indexOf('"vibe"') >= 0 }; });
  ok(r.a <= 0.25 && r.saved, 'destello normal tope 25 %; el ajuste vibe se guarda con el resto');
  // Ajustes: boton visible solo con la API
  r = await E(pg, () => { G.Panels.open('settings'); G.Panels.setTab(1); const a = G.fx.vibeSupported(); const rc = G.Panels.setRects().sb.vibe; return { a, rc }; });
  ok(r.a && r.rc.w === 320 && r.rc.h === 66, 'ajustes: boton de vibracion con API (66 de alto)');
  await E(pg, () => { navigator.vibrate = undefined; });
  ok(!(await E(pg, () => G.fx.vibeSupported() || G.fx.vibe('fuse'))), 'sin API: boton oculto y vibe no hace nada');
  await done(pg, 'vibe'); await b.close();
}
const DAILY_SNAP = '["tundra",3,["sincor","sincambio"],"lana",["fire","ice"]]';   // reglas r1 y kits k1 del 2026-11-14 (si se suben rv / kv, se actualiza)

(async () => {
  const run = { daily, fte, end, res, save2, dev, diag, track, manual, text, seed, diff, cine, cards, armor, armor2, iso, flow, powers, ui, village, touch, boss, balance, wide, vibe };
  if (mode === 'all') for (const k of Object.keys(run)) await run[k](); else await run[mode]();
  console.log(`\n${total - fails}/${total} OK`); process.exit(fails ? 1 : 0);
})().catch(e => { console.error(e); process.exit(2); });
