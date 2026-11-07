// REGRESIÓN 0 de la P3 en las PELEAS DE JEFE: simulación determinista (Math.random sembrado desde addInitScript, ruta fija del jugador, god) de Pastor / Karceron / Letea contra el código anterior (HEAD servido aparte).
// Compara un hash por segundo (vida del jefe, fase, adds, proyectiles, posiciones) y reporta el primer segundo en que difieren. uso: node p3_regress_boss.js http://localhost:8812 http://localhost:8813 [segundos=90]
const { chromium } = require('/opt/node-tools/node_modules/playwright');
const now = process.argv[2] || 'http://localhost:8812', before = process.argv[3] || 'http://localhost:8813', SECS = +(process.argv[4] || 90);
let fails = 0; const ok = (c, m) => { if (!c) fails++; console.log((c ? 'OK     ' : 'FALLO  ') + m); };
async function run(b, base, boss, fam) {
  const pg = await b.newPage({ viewport: { width: 960, height: 540 } }); const errs = [];
  pg.on('pageerror', e => errs.push(e.message));
  await pg.addInitScript(() => { let s = 777; Math.random = () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; });
  await pg.goto(`${base}/index.html?reset=1&god=1&dbg=1&boss=${boss}&nointro=1&hand=spark:3,dart:2,shard:2,dagger:2,fang:1&nosw=1&speed=0.00001${fam}`); await pg.waitForTimeout(400);
  const out = await pg.evaluate(SECS => {
    G.sfx = function () {}; try { Assets.sfx = function () {}; G.Snd.play = function () {}; } catch (e) { /* sin audio */ }
    G.state = 'play'; G.god = true; const dt = 1000 / 60, hs = []; let t = 0;
    function hash() { let h = 0; const add = v => { h = (Math.imul(h, 31) + Math.round(v * 10)) | 0; }; const bo = G.Enemies.boss();
      add(bo ? bo.hp : -1); add(bo ? bo.phase : 0); add(bo ? bo.x : 0); add(bo ? bo.y : 0); G.enemies.forEach(e => { add(e.x); add(e.y); add(e.hp); }); add(G.player.x); add(G.player.y); add(G.projectiles.length); add(G.zones.length); add(G.kills); return h; }
    while (t < SECS * 1000) {
      const a = t / 2300; G.input.joy = { active: true, id: 1, ox: 0, oy: 0, x: Math.cos(a) * 0.9, y: Math.sin(a * 0.8) * 0.9 };
      if (G.state === 'cards') { try { G.Cards.off.mode === 'level' ? G.Cards.skip() : G.Cards.pick(0); } catch (e) {} G.state = 'play'; }
      G.time += dt; if (!(G.Boss.active || G.Boss.defeated) && G.mode === 'run') G.runT += dt;
      G.Player.update(G.player, dt); G.Weapons.update(dt); G.Enemies.update(dt); G.Combat.update(dt); if (G.Tundra && G.Tundra.update) G.Tundra.update(dt); G.Waves.update(dt); G.Hud.update(dt); G.fx.update(dt);
      G.player.hp = G.player.maxHp; G.pendingLevels = 0; t += dt;
      if (Math.round(t) % 1000 < dt) hs.push(hash());
    }
    return { hs, boss: G.Enemies.boss() ? G.Enemies.boss().hp : 0, bossId: G.bossId };
  }, SECS);
  await pg.close(); return { out, errs };
}
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--no-sandbox'] });
  for (const boss of ['yarlak']) for (const fam of ['', '&fam=0']) {
    const A = await run(b, now, boss, fam), B = await run(b, before, boss, fam);
    let first = -1; for (let i = 0; i < Math.min(A.out.hs.length, B.out.hs.length); i++) if (A.out.hs[i] !== B.out.hs[i]) { first = i; break; }
    ok(first < 0 && A.out.hs.length === B.out.hs.length && !A.errs.length, `${boss} ${fam || 'auto'}: pelea idéntica al código anterior durante ${A.out.hs.length} s (jefe ${A.out.bossId}, HP ${Math.round(A.out.boss)}) ${first >= 0 ? 'primer segundo distinto: ' + first : ''} ${A.errs.slice(0, 2).join('|')}`);
  }
  console.log(fails ? `RESULTADO: ${fails} FALLO(S)` : 'RESULTADO: TODO OK'); await b.close(); process.exit(fails ? 1 : 0);
})();
