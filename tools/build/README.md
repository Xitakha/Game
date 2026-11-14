# Empaquetado de producción de Swarm Hand (T-F0-10)

Uso en 3 líneas:
1. `cd tools && npm ci` (una vez; instala esbuild y Playwright, solo desarrollo y CI).
2. `node tools/build/build.js [--out dist/card-swarm] [--sourcemap] [--no-god]` genera la carpeta de salida.
3. `python3 tools/serve.py dist/card-swarm 8822 &` y `node tools/card-swarm-bot/tests.js all http://localhost:8822` (cierra el servidor por PID).

El desarrollo local NO cambia: `games/card-swarm/index.html` sigue cargando los archivos sueltos de `src/`.

## Qué hace
- Lee el orden de las etiquetas `<script>` de `games/card-swarm/index.html` (incluido el `<script>` en línea que llama a `G.init()`).
- Minifica cada archivo con esbuild (`transform`, sin empaquetar: los nombres globales como `G` no se renombran porque son scripts clásicos de nivel superior) y los concatena en ese mismo orden en `swarm.<hash>.js`.
- Escribe `index.html` con una sola etiqueta `<script>`, copia `manifest.webmanifest` e `icons/`, y regenera `sw.js` con `tools/card-swarm-pwa/stamp.py` sobre la salida (precache = 9 archivos, versión = hash del contenido).
- No copia `src/` ni `*.md`. El nombre con hash permite caché HTTP larga sin servir código viejo.

## Opciones
- `--out <carpeta>`: salida (por defecto `dist/card-swarm`, ignorada por git).
- `--sourcemap`: genera `swarm.<hash>.js.map` (mapa índice con una sección por archivo fuente). Apagado por defecto y NO se publica en Pages.
- `--no-mangle`: minifica sin renombrar variables locales (para aislar un fallo atribuible al minificador).
- `--no-god`: para versiones externas (itch, portales, tienda; decisión del dueño). Fija `G.god` por defecto a falso sustituyendo en `src/main.js` el literal `qnum('god', (navigator.webdriver ? 0 : 1))` por `qnum('god', 0)`. Falla con error claro si ese literal cambia. Pages NO usa esta bandera: sigue con la inmortalidad por defecto hasta T-FIN-01. Nota: `?god=1` en la URL sigue funcionando; si un portal debe impedirlo, cerrarlo en `src/dev.js` (fuera del alcance de este build).

## Medir
`node tools/build/measure.js http://localhost:8811 5` imprime peticiones, bytes, bytes gzip y mediana de tiempos (Playwright, caché fría, sin red real).

## Límites conocidos
- Los scripts clásicos pasan a ser uno solo: una excepción al cargar un archivo detiene los siguientes (antes solo ese archivo). La batería lo detecta (0 errores de consola).
- Los nombres de archivo en trazas de error (`src/hud.js:42`) pasan a ser `swarm.<hash>.js:1:...`; usar `--sourcemap` para depurar en local.
