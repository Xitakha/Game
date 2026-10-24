// REGRESIÓN 0 de la P3 contra el código anterior (commit HEAD servido aparte): simulación determinista del bucle completo (director + IA + cartas + combate) con Math.random sembrado
// y una ruta del jugador fija; compara un hash del estado (enemigos, vidas, bajas, proyectiles) a los 30 / 60 / 120 / 200 s de partida. Debe ser IDÉNTICO en Bosque / Cripta / Asfódelo,
// con ?fam=0, auto y ?fam=1. uso: node p3_regress.js http://localhost:8812 http://localhost:8813 [segundos=200]
const { chromium } = require('/opt/node-tools/node_modules/playwright');
const now = process.argv[2] || 'http://localhost:8812', before = process.argv[3] || 'http://localhost:8813', SECS = +(process.argv[4] || 200);
let fails = 0; const ok = (c, m) => { if (!c) fails++; console.log((c ? 'OK     ' : 'FALLO  ') + m); };
async function run(b, base, bio, fam, seed) {
  const pg = await b.newPage({ viewport: { width: 960, height: 540 } }); const errs = [];
  pg.on('pageerror', e => errs.push(e.message)); pg.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
  await pg.goto(`${base}/index.html?reset=1&god=1&dbg=1&biome=${bio}${fam !== '' ? '&fam=' + fam : ''}&hand=spark:3,dart:3,shard:2,dagger:2,fang:2&nosw=1`); await pg.waitForTimeout(400);
  const out = await pg.evaluate(([seed, SECS]) => {
    G.sfx = function () {}; try { Assets.sfx = function () {}; G.Snd.play = function () {}; } catch (e) { /* sin audio */ }   // el audio limita por tiempo real y consume Math.random: fuera de la prueba
    let s = seed; Math.random = () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
    G.startGame(); G.state = 'play'; G.god = true;
    const dt = 1000 / 60, hs = {}; G.Waves.reset(); G.enemies.length = 0; G.player.x = 720; G.player.y = 405;
    let t = 0;
    function hash() { let h = 0; const add = v => { h = (Math.imul(h, 31) + Math.round(v * 100)) | 0; };
      G.enemies.forEach(e => { add(e.x); add(e.y); add(e.hp); add(e.st ? e.st.length : 0); }); add(G.player.x); add(G.player.y); add(G.player.hp); add(G.kills); add(G.projectiles.length); add(G.zones.length); add(G.gems.length); add(G.player.level); return h; }
    while (t < SECS * 1000) {
      const a = t / 2600; G.input.joy = { active: true, id: 1, ox: 0, oy: 0, x: Math.cos(a) * 0.9, y: Math.sin(a * 0.7) * 0.9 };
      if (G.state === 'cards') { try { G.Cards.off.mode === 'level' ? G.Cards.skip() : G.Cards.pick(0); } catch (e) {} G.state = 'play'; }
      G.time += dt; G.runT += dt; G.Player.update(G.player, dt); G.Weapons.update(dt); G.Enemies.update(dt); G.Combat.update(dt); if (G.Tundra && G.Tundra.update) G.Tundra.update(dt); G.Waves.update(dt); G.Hud.update(dt); G.fx.update(dt);
      G.player.hp = G.player.maxHp; t += dt;
      if (G.pendingLevels > 0) { G.pendingLevels = 0; }
      const sec = Math.round(t / 1000); if (Math.abs(t - sec * 1000) < dt / 2 && [30, 60, 120, 200, 300, 400].indexOf(sec) >= 0) hs[sec] = hash() + ':' + G.enemies.length + ':' + G.kills;
    }
    return hs;
  }, [seed, SECS]);
  await pg.close(); return { out, errs };
}
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--no-sandbox'] });
  for (const bio of ['bosque', 'cripta', 'asfodelo']) for (const fam of ['0', '', '1']) {
    const A = await run(b, now, bio, fam, 4242), B = await run(b, before, bio, fam, 4242);
    const same = JSON.stringify(A.out) === JSON.stringify(B.out);
    ok(same && !A.errs.length && Object.keys(A.out).length >= 3, `${bio} fam=${fam || 'auto'}: estado idéntico al código anterior en ${Object.keys(A.out).join('/')} s ${same ? '' : 'AHORA ' + JSON.stringify(A.out) + ' ANTES ' + JSON.stringify(B.out)} ${A.errs.slice(0, 2).join('|')}`);
  }
  console.log(fails ? `RESULTADO: ${fails} FALLO(S)` : 'RESULTADO: TODO OK'); await b.close(); process.exit(fails ? 1 : 0);
})();
