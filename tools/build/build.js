#!/usr/bin/env node
// Empaquetado de producción de games/card-swarm (T-F0-10). Ver README.md.
// Lee el orden de <script> de index.html, minifica cada archivo (sin renombrar globales: son scripts clásicos),
// los concatena en UN solo JS y genera index.html, sw.js (stamp.py), manifest e iconos en la carpeta de salida.
const fs = require('fs'), path = require('path'), crypto = require('crypto'), { execFileSync } = require('child_process');
const esbuild = require('esbuild');

const ROOT = path.join(__dirname, '..', '..');
const args = process.argv.slice(2);
const flag = n => args.includes('--' + n);
const opt = (n, d) => { const i = args.indexOf('--' + n); return i >= 0 && args[i + 1] ? args[i + 1] : d; };
if (flag('help')) { console.log('Uso: node tools/build/build.js [--out dist/card-swarm] [--sourcemap] [--no-god] [--no-mangle]'); process.exit(0); }
const SRC = path.join(ROOT, 'games', 'card-swarm');
const OUT = path.resolve(ROOT, opt('out', 'dist/card-swarm'));
if (OUT === SRC || SRC.startsWith(OUT + path.sep) || ROOT.startsWith(OUT)) { console.error('Carpeta de salida peligrosa: ' + OUT); process.exit(1); }

(async () => {
  const html = fs.readFileSync(path.join(SRC, 'index.html'), 'utf8');
  // Etiquetas <script> en orden: con src (archivo) o en línea (se incorpora tal cual al final del paquete en su sitio)
  const re = /<script(?:\s[^>]*?\bsrc="([^"]+)"[^>]*)?>([\s\S]*?)<\/script>/g;
  const parts = []; let m, first = -1, last = -1;
  while ((m = re.exec(html))) {
    if (first < 0) first = m.index;
    last = m.index + m[0].length;
    parts.push(m[1] ? { file: m[1] } : { file: 'index.html#inline' + parts.length, code: m[2] });
  }
  if (!parts.length) throw new Error('index.html sin scripts');
  if (/<script[^>]*\stype=/.test(html)) throw new Error('index.html tiene <script type=...>: el empaquetado solo admite scripts clásicos');
  const between = html.slice(first, last).replace(re, '').trim();
  if (between) throw new Error('Hay contenido entre los <script>, no se puede reemplazar el bloque: ' + between.slice(0, 80));

  let godOff = false;
  const maps = []; let out = '', line = 0, bytesIn = 0;
  for (const p of parts) {
    let code = p.code !== undefined ? p.code : fs.readFileSync(path.join(SRC, p.file), 'utf8');
    if (flag('no-god') && p.file === 'src/main.js') {
      const from = "qnum('god', (navigator.webdriver ? 0 : 1))";
      if (!code.includes(from)) throw new Error('--no-god: no se encuentra «' + from + '» en src/main.js (¿cambió?). Actualiza tools/build/build.js.');
      code = code.replace(from, "qnum('god', 0)"); godOff = true;
    }
    bytesIn += Buffer.byteLength(code);
    const r = await esbuild.transform(code, {
      loader: 'js', minify: true, minifyIdentifiers: !flag('no-mangle'), legalComments: 'none',
      sourcefile: p.file, sourcemap: flag('sourcemap') ? 'external' : false, target: 'es2020',
    });
    const js = r.code.replace(/\n+$/, '') + '\n;\n';   // ';' por si un archivo termina sin punto y coma
    if (flag('sourcemap')) maps.push({ offset: { line, column: 0 }, map: JSON.parse(r.map) });
    out += js; line += js.split('\n').length - 1;
  }
  if (flag('no-god') && !godOff) throw new Error('--no-god: src/main.js no está en index.html');

  const hash = crypto.createHash('sha1').update(out).digest('hex').slice(0, 8);
  const bundle = 'swarm.' + hash + '.js';
  fs.rmSync(OUT, { recursive: true, force: true });
  fs.mkdirSync(OUT, { recursive: true });
  fs.writeFileSync(path.join(OUT, bundle), out + (flag('sourcemap') ? '//# sourceMappingURL=' + bundle + '.map\n' : ''));
  if (flag('sourcemap')) fs.writeFileSync(path.join(OUT, bundle + '.map'), JSON.stringify({ version: 3, file: bundle, sections: maps }));
  fs.writeFileSync(path.join(OUT, 'index.html'), html.slice(0, first) + '<script src="' + bundle + '"></script>' + html.slice(last));

  // Estáticos: manifest, iconos y el sw.js base (stamp.py lo regenera para esta salida). Nunca *.md ni src/.
  for (const f of ['manifest.webmanifest', 'sw.js']) fs.copyFileSync(path.join(SRC, f), path.join(OUT, f));
  fs.cpSync(path.join(SRC, 'icons'), path.join(OUT, 'icons'), { recursive: true });
  const stamp = execFileSync('python3', [path.join(ROOT, 'tools', 'card-swarm-pwa', 'stamp.py'), OUT]).toString().trim();

  const sz = fs.statSync(path.join(OUT, bundle)).size;
  console.log(`build: ${parts.length} scripts -> ${bundle}: ${(bytesIn / 1024).toFixed(0)} KB -> ${(sz / 1024).toFixed(0)} KB`);
  console.log(`build: ${stamp}`);
  console.log(`build: god por defecto ${godOff ? 'APAGADO (versión externa)' : 'como en el código fuente (Pages)'}; mapas de fuente ${flag('sourcemap') ? 'sí' : 'no'}; salida ${path.relative(ROOT, OUT)}`);
})().catch(e => { console.error('build FALLÓ: ' + e.message); process.exit(1); });
