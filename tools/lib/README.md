# tools/lib: ayudantes compartidos
`browser.js`: lanza Chromium con Playwright sin rutas fijas de version.
1. En un script de `tools/<x>/`: `const { launch } = require('../lib/browser.js'); const b = await launch({ args: ['--no-sandbox'] });`
2. Ejecutable: `$PW_CHROME` -> `/opt/pw-browsers/chromium` -> `chromium-*` de mayor version -> navegador por defecto de Playwright (`$PW_BROWSERS_DIR` cambia la carpeta base).
3. Modulo playwright: `$PW_MODULE` -> `require('playwright')` -> `/opt/node-tools/node_modules/playwright`. Tambien exporta `executablePath()` para ver cual elige.
