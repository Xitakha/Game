// FX2 lab: comparacion ANTES (arte anterior, ?fx2=0 equivalente: G.Fx2.on=false) / DESPUES en una hoja de prueba. Uso:
//   python3 tools/serve.py card-swarm 8812 &   (cerrar por PID)
//   node tools/fx2-lab/lab.js <escena> [salida.jpg] [base=http://localhost:8812]
// Escenas: ward | ice | boom | status | all     (imagen con dos columnas: ANTES | DESPUES; cada escena es una fila de 450 x 250)
const { launch } = require('../lib/browser.js');
const scene = process.argv[2] || 'all', out = process.argv[3] || '/tmp/fx2_' + scene + '.jpg', base = process.argv[4] || 'http://localhost:8812';
(async () => {
  const b = await launch({ args: ['--no-sandbox'] });
  const ctx = await b.newContext({ viewport: { width: 900, height: 1000 }, deviceScaleFactor: +process.env.DSF || 1 }), pg = await ctx.newPage(); const errs = [];
  pg.on('pageerror', e => errs.push(e.message)); pg.on('console', m => m.type() === 'error' && errs.push(m.text()));
  await pg.goto(base + '/index.html?dev=1&nosw=1&reset=1&direct=1&god=1&cine=0&biome=crater&nobos=1&seed=1'); await pg.waitForTimeout(900);
  const r = await pg.evaluate((scene) => {
    const B = G.FusionArt2, F2 = G.Fx2, W = 450, H = 250, list = scene === 'all' ? ['ward', 'ice', 'boom', 'status'] : [scene];
    const cv = document.createElement('canvas'); cv.width = W * 2; cv.height = H * list.length; cv.style.cssText = 'position:fixed;left:0;top:0;z-index:99999;width:' + W * 2 + 'px;height:' + H * list.length + 'px;max-width:none;max-height:none'; document.body.appendChild(cv);
    const c = cv.getContext('2d'); let T = 5000; Object.defineProperty(G, 'time', { get: () => T, set: () => {}, configurable: true });
    const dude = (x, y) => { c.fillStyle = '#e8b04a'; c.strokeStyle = '#0c0814'; c.lineWidth = 2; c.beginPath(); c.arc(x, y, 14, 0, 6.28); c.fill(); c.stroke(); c.fillStyle = '#0c0814'; c.fillRect(x - 5, y - 4, 3, 5); c.fillRect(x + 2, y - 4, 3, 5); };
    const mk = (x, y, f) => Object.assign({ x, y, r: 13, dead: false, hp: 10, burnT: 0, slowT: 0, slowPct: 0, poisonT: 0, corrodeT: 0 }, f);
    const SC = {
      ward(on) { [0.9, 0.5, 0.18].forEach((u, i) => { const x = 80 + i * 145, y = 130, r = i === 0 ? 66 : 56; if (on) B.wardBack(c, x, y, r, T / 1000, 1, u); dude(x, y); B.wardFront(c, x, y, r, T / 1000, 1, u); }); },
      ice(on) {
        for (let k = 0; k < 7; k++) B.lance(c, 40 + k * 22, 50 + k * 6, 0.25 + k * 0.08, k === 6);
        B.storm(c, 110, 175, 70, T / 1000, 1); B.fan(c, 230, 170, -0.4, 1.2, 170, 0.4); B.nova(c, 340, 70, 60, 0.4, 'ice'); B.nova(c, 365, 180, 70, 0.3, 'shatter');
        c.save(); c.translate(230, 60); B.icon(c, 'cristal', 0, 0, 22); c.restore();
      },
      boom(on, f) {
        const sp = [[60, 90, 'impact', 'plasma'], [150, 90, 'impact', 'forja'], [250, 90, 'strike', 1], [350, 90, 'nova', 'pact'], [110, 200, 'impact', 'descarga'], [230, 200, 'nova', 'ice']];
        const u = Math.min(0.99, f / 22 * 0.9 + 0.03);
        sp.forEach(([x, y, k, a]) => { if (k === 'impact') { B.impact(c, a, x, y, u * 0.6, 16); } else if (k === 'strike') B.strike(c, x, y + 30, u * 0.6, true); else B.nova(c, x, y, 40, u * 0.6, a); });
        B.axe(c, 340, 200, T / 1000, 1);
        if (on) B.fx2Draw(c);
      },
      status(on) {
        G.cam = G.cam || { x: 0, y: 0 }; const os = G.enemies, oc = [G.cam.x, G.cam.y]; G.cam.x = G.cam.y = 0;
        G.enemies = [mk(60, 130, { burnT: 5 }), mk(130, 130, { slowT: 5, slowPct: 0.3 }), mk(200, 130, { slowT: 5, slowPct: 0.7 }), mk(270, 130, { poisonT: 5 }), mk(340, 130, { corrodeT: 5 }), mk(400, 130, { burnT: 5, poisonT: 5 })];
        const tint = { 0: 'rgba(255,122,26,.38)', 1: 'rgba(74,168,255,.38)', 2: 'rgba(74,168,255,.38)', 3: 'rgba(91,224,58,.38)', 5: 'rgba(255,122,26,.38)' };
        G.enemies.forEach((e, i) => { c.fillStyle = '#6a5a8a'; c.strokeStyle = '#0c0814'; c.lineWidth = 2; c.beginPath(); c.arc(e.x, e.y, e.r, 0, 6.28); c.fill(); c.stroke(); if (tint[i]) { c.fillStyle = tint[i]; c.beginPath(); c.arc(e.x, e.y, e.r, 0, 6.28); c.fill(); } });
        if (on) B.fx2Draw(c); else B.status(c, 'corrode', 340, 130, 13, T / 1000);
        G.enemies = os; G.cam.x = oc[0]; G.cam.y = oc[1];
      }
    };
    list.forEach((nm, row) => [false, true].forEach(on => {
      F2.on = on; B.fx2Clear(); const nf = nm === 'boom' ? 23 : 1;
      for (let f = 0; f < nf; f++) {
        T += 16; c.save(); c.beginPath(); c.rect(on ? W : 0, row * H, W, H); c.clip(); c.translate(on ? W : 0, row * H);
        c.fillStyle = on ? '#243046' : '#2a2a3a'; c.fillRect(0, 0, W, H); c.fillStyle = 'rgba(255,255,255,0.06)'; for (let i = 0; i < W; i += 30) c.fillRect(i, 0, 1, H);
        SC[nm](on, f); if (on && nm === 'boom') (window.__dbg = window.__dbg || []).push(F2.pool.filter(p => p.k).length + '/' + F2.on + '/' + T); c.fillStyle = '#fff'; c.font = '12px sans-serif'; c.fillText((on ? 'DESPUES ' : 'ANTES ') + nm, 6, 14); c.restore();
      }
    }));
    F2.on = true; return {  pool: F2.pool.filter(p => p.k).map(p => [p.k, Math.round(p.x), Math.round(p.y), Math.round(p.z), Math.round(p.life)].join()).slice(0, 8), err: B.lastError && String(B.lastError.stack || B.lastError) };
  }, scene);
  await pg.screenshot({ path: out, type: 'jpeg', quality: 75, clip: process.env.CLIP ? JSON.parse(process.env.CLIP) : { x: 0, y: 0, width: 900, height: scene === 'all' ? 1000 : 250 } });
  console.log(JSON.stringify(r), 'errs', errs); await b.close();
})();
