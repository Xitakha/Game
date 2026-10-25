// PRUEBAS de los minijefes por bioma (P4.5, DESIGN-v6-minijefes.md s.11). uso: node p45_tests.js http://localhost:8842 [tele|parts|enrage|loot|flow|all]
// Simulación determinista por pasos (sin tiempo real): fuerza cada ataque y mide la telegrafía real; rompe partes; comprueba enrage, botín y el flujo del director.
const { chromium } = require('/opt/node-tools/node_modules/playwright');
const base = process.argv[2] || 'http://localhost:8842', MODE = process.argv[3] || 'all';
const IDS = ['carnero', 'tejedora', 'alcaide', 'centinela', 'hidra', 'planidera', 'yeti_mayor', 'ventisquero'];
let fails = 0; const ok = (c, m) => { if (!c) fails++; console.log((c ? 'OK     ' : 'FALLO  ') + m); };
const STEP = `window.__step = function (n) { var dt = 1000 / 60; for (var i = 0; i < n; i++) { G.time += dt; if (!(G.Boss.active || G.Boss.defeated) && G.mode === 'run') G.runT += dt; G.Player.update(G.player, dt); G.Weapons.update(dt); G.Enemies.update(dt); G.Combat.update(dt); if (G.Tundra && G.Tundra.update) G.Tundra.update(dt); G.Waves.update(dt); G.Hud.update(dt); G.fx.update(dt); G.player.hp = G.player.maxHp; G.pendingLevels = 0; if (G.state === 'cards') G.state = 'play'; } };`;
async function open(b, qs, errs) {
  const pg = await b.newPage({ viewport: { width: 960, height: 540 } });
  pg.on('pageerror', e => errs.push('PAGEERR ' + e.message + ' ' + (e.stack || '').split('\n').slice(1, 3).join('|'))); pg.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
  await pg.goto(`${base}/index.html?reset=1&dbg=1&god=1&nosw=1&hand=spark:3,dart:3,shard:2,dagger:2,fang:2&${qs}`); await pg.waitForTimeout(300);
  await pg.evaluate(STEP); return pg;
}
async function spawnMini(pg, id) {
  await pg.evaluate((id) => { G.sfx = function () {}; G.startGame(); G.state = 'play'; G.god = true; __step(80); const e = G.Enemies.minis()[0]; if (!e || e.mid !== id) throw new Error('no sale ' + id); }, id);
}
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--no-sandbox'] });
  const errs = [];
  if (MODE === 'tele' || MODE === 'all') {
    const audit = await (async () => { const pg = await open(b, 'mini=carnero', errs); const r = await pg.evaluate(() => G.B.minis.teleAudit()); await pg.close(); return r; })();
    ok(audit.length >= 25 && audit.every(a => a.ok), `auditoría estática de telegrafías: ${audit.length} entradas, ${audit.filter(a => !a.ok).length} incumplen ${JSON.stringify(audit.filter(a => !a.ok))}`);
    for (const id of IDS) {
      const pg = await open(b, 'mini=' + id, errs); await spawnMini(pg, id);
      const names = await pg.evaluate(() => Object.keys(G.Minis.ATK[G.Enemies.minis()[0].mid]));
      for (const name of names) for (const enr of [false, true]) {
        const r = await pg.evaluate(([name, enr]) => {
          const e = G.Enemies.minis()[0], p = G.player, A = G.Minis.ATK[e.mid][name];
          if (enr && !A.double) return null;
          G.enemies.forEach(q => { if (q !== e) q.dead = true; }); G.zones.length = 0; G.projectiles.length = 0;
          e.hp = e.maxHp; e.part.broken = false; e.part.hp = e.part.max; e.enraged = enr; e.st = 'move'; e.cd = {}; e.atk = null; e.expT = 0; e.untarget = false; e.hide = false;
          const ang = Math.random() * 6.28; e.x = G.AW / 2; e.y = G.AH / 2; p.x = e.x + 190; p.y = e.y; e.force = name; e.atkT = 0;
          const segs = [], hits = []; const oh = G.Player.hurt; G.Player.hurt = function (pl, dmg) { hits.push(dmg); return false; };
          let last = null, t0 = 0;
          for (let i = 0; i < 700; i++) { __step(1); p.x = e.x + 190 * 0 + 190; p.y = e.y; if (e.st !== last) { segs.push([e.st, i]); last = e.st; } if (e.st === 'move' && segs.length > 2) break; }
          G.Player.hurt = oh;
          const tele = []; for (let i = 0; i < segs.length; i++) if (segs[i][0] === 'tele') tele.push(Math.round(((segs[i + 1] ? segs[i + 1][1] : 700) - segs[i][1]) * 1000 / 60));
          return { tele, hits: hits.map(h => Math.round(h)), A: { dmg: A.dmg, exit: enr && A.exit2 != null ? A.exit2 : A.exit, ice: !!e.D.ice } };
        }, [name, enr]);
        if (!r) continue;
        const need = [].concat(r.A.exit || 0); const mx = Math.max(...need); const rule = 250 + (r.A.ice ? 220 : 0) + 1000 * mx / 190;
        const t1 = r.tele[0], good = r.tele.length >= 1 && r.tele.every((t, i) => t >= 380 && (mx === 0 || t >= rule - 17) && (i > 0 || !(r.A.dmg >= 25) || t >= 780)) && r.hits.every(h => h <= 32);
        ok(good, `${id}.${name}${enr ? ' (enrage)' : ''}: tele ${JSON.stringify(r.tele)} ms (regla ${Math.round(rule)}), golpes ${JSON.stringify(r.hits)}`);
      }
      await pg.close();
    }
  }
  if (MODE === 'parts' || MODE === 'all') for (const id of IDS) {
    const pg = await open(b, 'mini=' + id, errs); await spawnMini(pg, id);
    const r = await pg.evaluate((id) => {
      const e = G.Enemies.minis()[0], p = G.player; G.enemies.forEach(q => { if (q !== e) q.dead = true; });
      e.x = G.AW / 2; e.y = G.AH / 2; p.x = e.x - 150; p.y = e.y; const out = { id, hp0: e.hp };
      // parte: daño según su modo
      const P = e.part; let n = 0, dealt = 0;
      if (P.mode === 'core') { e.coreOpen = true; e.expMul = 1.6; e.expT = 99999; }
      while (!P.broken && n++ < 3000) {
        const tag = e.D.id === 'hidra' || e.D.id === 'yeti_mayor' ? 'fire' : 'steel';
        const sx = e.x + Math.cos(e.fa || 0) * 40, sy = e.y + Math.sin(e.fa || 0) * 40;
        dealt += G.Combat.deal(e, 30, { tag, sx, sy, proj: true }) || 0;
        e.hp = Math.max(e.hp, 100);
      }
      out.broke = P.broken; out.dealt = Math.round(dealt); out.pct = Math.round(dealt / e.maxHp * 100);
      out.ban = G.Enemies.minis()[0] === e; out.exp = Math.round(e.expT); out.gems = G.gems.filter(g => g.kind === 'insignia').length; out.hearts = G.gems.filter(g => g.kind === 'heart').length;
      out.parts = G.gems.filter(g => g.kind === 'part').length;
      return out;
    }, id);
    ok(r.broke && r.gems === 1 && r.hearts >= 1, `${id}: parte rota con ${r.dealt} de daño (${r.pct} % del HP) insignia ${r.gems} corazón ${r.hearts} bonus ${r.parts} ventana ${r.exp} ms`);
    await pg.close();
  }
  if (MODE === 'enrage' || MODE === 'all') for (const id of IDS) {
    const pg = await open(b, 'mini=' + id, errs); await spawnMini(pg, id);
    const r = await pg.evaluate(() => {
      const e = G.Enemies.minis()[0], p = G.player; G.enemies.forEach(q => { if (q !== e) q.dead = true; });
      e.x = G.AW / 2; e.y = G.AH / 2; p.x = e.x + 200; p.y = e.y; e.hp = e.maxHp * 0.49; let st = []; let seen = false;
      for (let i = 0; i < 90; i++) { __step(1); p.x = e.x + 200; if (e.st === 'enrage') seen = true; }
      return { enraged: e.enraged, seen, spd: e.D.spdE };
    });
    ok(r.enraged && r.seen, `${id}: enrage al 50 % (rugido 900 ms, velocidad ${r.spd})`);
    await pg.close();
  }
  if (MODE === 'loot' || MODE === 'all') for (const id of IDS) {
    const pg = await open(b, 'mini=' + id, errs); await spawnMini(pg, id);
    const r = await pg.evaluate(() => {
      const e = G.Enemies.minis()[0]; G.enemies.forEach(q => { if (q !== e) q.dead = true; });
      const pf0 = G.Save.data.pf.frag || 0, el0 = Object.keys(G.Save.data.elites).length;
      G.Combat.deal(e, 1e7, { tag: 'steel' }); G.Enemies.update(16);
      const parts = {}; G.gems.filter(g => g.kind === 'part').forEach(g => parts[g.part] = (parts[g.part] || 0) + 1);
      return { id: e.mid, parts, slotKey: Object.keys(G.Save.data.elites), frag: G.Save.data.pf.frag, pf: G.Save.data.pf.earned, dead: e.dead, xp: G.gems.filter(g => g.kind === 'xp').length, q: G.Loot.GUARANTEED['mini_' + e.mid] };
    });
    ok(r.dead && r.slotKey.indexOf('mini_slot' + (IDS.indexOf(id) % 2 + 1)) >= 0 && r.q && Object.keys(r.q.parts).length === 3, `${id}: muerte ${r.dead}, elites ${JSON.stringify(r.slotKey)}, PF ${r.pf} frag ${r.frag}, partes ${JSON.stringify(r.parts)} (garantizado ${JSON.stringify(r.q && r.q.parts)})`);
    await pg.close();
  }
  if (MODE === 'flow' || MODE === 'all') for (const bio of ['bosque', 'cripta', 'asfodelo', 'tundra']) for (const len of [9, 7, 10]) {
    const pg = await open(b, `biome=${bio}&len=${len}`, errs);
    const r = await pg.evaluate(() => {
      G.sfx = function () {}; G.startGame(); G.state = 'play'; G.god = true; G.player.x = 700; G.player.y = 400;
      const ev = [], seen = {}; let both = 0; const tmax = G.BOSS_T + 3000;
      while (G.runT < tmax && G.state !== 'gameover' && !G.Boss.active) {
        __step(6); G.player.x = 700 + Math.cos(G.time / 900) * 60; G.player.y = 400 + Math.sin(G.time / 700) * 40;
        const ms = G.Enemies.minis(); if (ms.length > 1) both++;
        ms.forEach(m => { if (!seen[m.mid]) { seen[m.mid] = Math.round(G.vt() / 1000); } });
        // el bot mata al minijefe 25 s tras su entrada
        ms.forEach(m => { m.alive = (m.alive || 0) + 100; if (m.alive > 25000) G.Combat.deal(m, 1e7, { tag: 'steel' }); });
        G.enemies.forEach(q => { if (!q.mini && !q.isPod && q.type !== 'boss') q.dead = true; }); // sin hordas: solo el flujo
      }
      return { seen, both, bossSpawned: G.Waves.bossSpawned, runT: Math.round(G.runT / 1000), biome: G.curBiome, done: G.Waves.elitesDone };
    });
    const exp1 = 210, exp2 = 330; const k = Object.keys(r.seen);
    ok(r.both === 0 && k.length === 2 && Math.abs(r.seen[k[0]] - exp1) <= 20 && Math.abs(r.seen[k[1]] - exp2) <= 40 && r.biome === bio, `${bio} ${len} min: slot1 ${k[0]} a ${r.seen[k[0]]} s virtuales, slot2 ${k[1]} a ${r.seen[k[1]]} s virtuales, coexistencias ${r.both}`);
    await pg.close();
  }
  console.log('ERRORES DE CONSOLA:', errs.length, errs.slice(0, 5));
  ok(errs.length === 0, '0 errores de consola');
  console.log(fails ? `RESULTADO: ${fails} FALLO(S)` : 'RESULTADO: TODO OK'); await b.close(); process.exit(fails ? 1 : 0);
})();
