// Genera los iconos PWA de Swarm Hand por código (canvas de Chromium) y los guarda como PNG pequeños en games/card-swarm/icons/.
// Uso: node make-icons.js   (usa el Playwright/Chromium del estudio)
const { chromium } = require('/opt/node-tools/node_modules/playwright');
const fs = require('fs'), path = require('path');
const OUT = path.join(__dirname, '..', '..', 'games', 'card-swarm', 'icons');
(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--no-sandbox'] });
  const pg = await b.newPage();
  const jobs = [['icon-192.png', 192, 'any'], ['icon-512.png', 512, 'any'], ['maskable-192.png', 192, 'mask'], ['maskable-512.png', 512, 'mask'], ['apple-touch-icon.png', 180, 'apple']];
  for (const [name, size, kind] of jobs) {
    const b64 = await pg.evaluate(([size, kind]) => {
      const cv = document.createElement('canvas'); cv.width = cv.height = size; const c = cv.getContext('2d'), u = size / 512;
      // fondo: 'any' = cuadrado redondeado; 'mask' y 'apple' = a sangre (el sistema recorta)
      const full = kind !== 'any';
      c.save();
      if (!full) { const r = 96 * u; c.beginPath(); c.moveTo(r, 0); c.arcTo(size, 0, size, size, r); c.arcTo(size, size, 0, size, r); c.arcTo(0, size, 0, 0, r); c.arcTo(0, 0, size, 0, r); c.closePath(); c.clip(); }
      const g = c.createRadialGradient(size / 2, size * 0.45, size * 0.05, size / 2, size / 2, size * 0.75);
      g.addColorStop(0, '#3a2a55'); g.addColorStop(1, '#0d0a14'); c.fillStyle = g; c.fillRect(0, 0, size, size);
      c.restore();
      // contenido en la zona segura (maskable: ~60 % central)
      const k = kind === 'mask' ? 0.62 : kind === 'apple' ? 0.8 : 0.86;
      c.save(); c.translate(size / 2, size / 2); c.scale(k, k); c.translate(-size / 2, -size / 2);
      const cards = [[-20, '#4aa8e8', 0.1], [20, '#6ad84a', 0.1], [0, '#ff8a3c', 1]];
      cards.forEach(([deg, col, main]) => {
        c.save(); c.translate(size / 2, size * 0.8); c.rotate(deg * Math.PI / 180);
        const w = 190 * u, h = 270 * u;
        c.fillStyle = 'rgba(0,0,0,0.45)'; c.fillRect(-w / 2 + 6 * u, -h + 8 * u, w, h);
        c.fillStyle = '#1b1229'; c.fillRect(-w / 2, -h, w, h);
        c.fillStyle = col; c.globalAlpha = 0.25; c.fillRect(-w / 2, -h, w, h * 0.3); c.globalAlpha = 1;
        c.lineWidth = 12 * u; c.strokeStyle = col; c.strokeRect(-w / 2 + 6 * u, -h + 6 * u, w - 12 * u, h - 12 * u);
        c.restore();
      });
      // llama en la carta central
      c.save(); c.translate(size / 2, size * 0.8 - 135 * u); c.scale(u, u); c.lineJoin = 'round';
      const s = 78;
      c.fillStyle = '#ff9a3c'; c.strokeStyle = '#0c0814'; c.lineWidth = 9;
      c.beginPath(); c.moveTo(0, -s); c.bezierCurveTo(s * 0.3, -s * 0.5, s * 0.85, -s * 0.2, s * 0.65, s * 0.4); c.bezierCurveTo(s * 0.5, s * 0.95, -s * 0.5, s * 0.95, -s * 0.65, s * 0.4);
      c.bezierCurveTo(-s * 0.8, -s * 0.1, -s * 0.2, -s * 0.4, 0, -s); c.fill(); c.stroke();
      c.fillStyle = '#ffe9a0'; c.beginPath(); c.moveTo(0, -s * 0.1); c.bezierCurveTo(s * 0.4, s * 0.3, s * 0.3, s * 0.75, 0, s * 0.75); c.bezierCurveTo(-s * 0.3, s * 0.75, -s * 0.4, s * 0.3, 0, -s * 0.1); c.fill();
      c.restore();
      c.restore();
      return cv.toDataURL('image/png').split(',')[1];
    }, [size, kind]);
    fs.writeFileSync(path.join(OUT, name), Buffer.from(b64, 'base64'));
    console.log(name, fs.statSync(path.join(OUT, name)).size, 'bytes');
  }
  await b.close();
  // paleta de 48 colores (iconos de ~3-10 KB en vez de ~250 KB)
  require('child_process').execFileSync('python3', ['-c', `
from PIL import Image
import os, sys
d = sys.argv[1]
for f in sorted(os.listdir(d)):
    if f.endswith('.png'):
        Image.open(os.path.join(d, f)).convert('RGBA').quantize(colors=48, method=Image.Quantize.FASTOCTREE, dither=Image.Dither.NONE).save(os.path.join(d, f), optimize=True)
`, OUT]);
})();
