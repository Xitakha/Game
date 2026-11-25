// Genera tools/card-swarm-bot/fixtures/save-v13-pre-f2.json: un guardado v13 real hecho con el código de ANTES de F2 (Insignias dentro de Trofeos).
// Uso: git worktree add --detach <dir> dacc6d4; python3 tools/serve.py <dir>/games/card-swarm 8911 & (cerrar por PID);
//      cd tools && node card-swarm-bot/fixtures/gen-save-v13-pre-f2.js <salida.json> [http://localhost:8911]
// Juega una salida, recoge Insignias por su vía normal, un trofeo de jefe, fabrica un talismán (gasta Insignias: saldo < acumulado), cierra con G.finish
// y guarda por el camino normal (sellado con _sum). Anota también los valores de referencia de ese código (costes, piezas listas, logros, pedidos).
const { launch } = require('/home/user/Game/tools/lib/browser.js');
(async () => {
  const b = await launch({ args: ['--no-sandbox'] });
  const ctx = await b.newContext({ viewport: { width: 844, height: 390 }, hasTouch: true, isMobile: true }), pg = await ctx.newPage();
  const errs = []; pg.on('pageerror', e => errs.push(e.message)); pg.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
  await pg.goto((process.argv[3] || 'http://localhost:8911') + '/index.html?dev=1&nosw=1&reset=1&direct=1&speed=0&seed=7'); await pg.waitForTimeout(1200);
  const out = await pg.evaluate(() => {
    const S = G.Save.data;
    for (let i = 0; i < 60 * 80; i++) { if (G.state === 'cards') G.Cards.pick(0); G.player.hp = G.player.maxHp; G.step(); }
    ['carnero', 'tejedora', 'carnero', 'alcaide', 'avispon'].forEach(mid => G.Minis.collectInsignia({ ins: G.Minis.D[mid].ins.id, mid }));
    G.Loot.run.boss = { id: 'pastor', parts: ['cuernos'], won: true }; G.Loot.collect('rare', 'horn');
    S.bossKills.pastor = 1;
    G.finish(true);
    S.flags.smithMet = 1; S.brasas = Math.max(S.brasas, 3000); S.parts.thread = Math.max(S.parts.thread || 0, 200); S.parts.rare = Math.max(S.parts.rare || 0, 3);
    const cr = G.Armor.craft('mn_bosque');
    G.Quests.check && G.Quests.check();
    G.Save.save();
    const D = G.ArmorData, A = G.Armor, costs = {};
    D.PIECES.forEach(p => { costs[p.id] = [0, 1, 2, 3].map(r => A.cost(p, r)); });
    const ref = { costs, ready: A.readyCount(), insCount: G.Minis.insigniaCount(), achCount: G.Ach.count(), achOk: G.Ach.DEFS.filter(a => a.ok(S)).map(a => a.id), pedOk: A.PED.filter(d => d.ok(S)).map(d => d.id),
      haveIns: Object.fromEntries(G.Minis.ALL.map(m => [m, A.have('ins', m)])), haveTro: { horn: A.have('tro', 'horn') }, costOK: Object.fromEntries(D.PIECES.map(p => [p.id, A.costOK(A.cost(p, 0))])) };
    window.__ref = ref;
    return { ref, key: G.Save.KEY, keys: Object.keys(localStorage), ok: G.Save.ok, hold: G.Save.hold, cr: cr && (cr.ok !== undefined ? cr.ok : cr), v: S.v, ins: S.insignias, insE: S.insigniasEver, tro: S.trophies, troE: S.trophiesEver, ach: Object.keys(S.ach), raw: localStorage.getItem(G.Save.KEY), exp: G.Save.exportText(), owned: Object.keys(S.armor.owned) };
  });
  console.log(JSON.stringify({ key: out.key, keys: out.keys, sok: out.ok, hold: out.hold, errs, cr: out.cr, v: out.v, ins: out.ins, insE: out.insE, tro: out.tro, troE: out.troE, ach: out.ach, owned: out.owned, rawLen: out.raw && out.raw.length }, null, 1));
  require('fs').writeFileSync(process.argv[2], JSON.stringify({ about: 'Guardado v13 real hecho con el código de antes de F2 (commit dacc6d4): una salida jugada, 5 Insignias recogidas por G.Minis.collectInsignia, 1 trofeo del Pastor, el talismán mn_bosque fabricado (gasta 2 Insignias). raw = valor sellado de swarmhand.fusion.save; exp = texto SWARM1 de G.Save.exportText(); ref = valores de ese mismo código (costes de todas las piezas, piezas listas, logros, pedidos y saldos).', raw: out.raw, exp: out.exp, ref: out.ref }, null, 1) + '\n');
  await b.close();
})();
