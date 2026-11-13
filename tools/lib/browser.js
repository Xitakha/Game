// Ayudante compartido: lanza Chromium con Playwright sin rutas fijas de version.
// Uso:  const { launch } = require('../lib/browser.js');  const b = await launch({ args: ['--no-sandbox'] });
// Orden del ejecutable: $PW_CHROME -> /opt/pw-browsers/chromium (enlace) -> chromium-* de mayor version
//   (chrome-linux/chrome, chrome-linux64/chrome) -> lanzamiento por defecto de Playwright.
// Modulo playwright: $PW_MODULE -> require('playwright') -> /opt/node-tools/node_modules/playwright.
const fs = require('fs'), path = require('path');

function loadPlaywright() {
  const tries = [process.env.PW_MODULE, 'playwright', '/opt/node-tools/node_modules/playwright'].filter(Boolean);
  let last;
  for (const t of tries) { try { return require(t); } catch (e) { last = e; } }
  throw new Error('No se encuentra el modulo playwright (prueba PW_MODULE=/ruta/a/playwright): ' + last.message);
}
const exeIn = (dir) => ['chrome-linux/chrome', 'chrome-linux64/chrome', 'chrome'].map(s => path.join(dir, s)).find(p => fs.existsSync(p));

function executablePath() {
  if (process.env.PW_CHROME && fs.existsSync(process.env.PW_CHROME)) return process.env.PW_CHROME;
  const root = process.env.PW_BROWSERS_DIR || '/opt/pw-browsers';
  const link = exeIn(path.join(root, 'chromium'));
  if (link) return link;
  let dirs = [];
  try { dirs = fs.readdirSync(root).filter(d => /^chromium-\d+$/.test(d)); } catch (e) {}
  dirs.sort((a, b) => parseInt(b.split('-')[1]) - parseInt(a.split('-')[1]));
  for (const d of dirs) { const p = exeIn(path.join(root, d)); if (p) return p; }
  return undefined; // Playwright usa su navegador por defecto
}

function launch(opts = {}) {
  const exe = executablePath();
  return loadPlaywright().chromium.launch(exe ? { ...opts, executablePath: exe } : opts);
}
module.exports = { launch, executablePath, loadPlaywright, get chromium() { return loadPlaywright().chromium; } };
