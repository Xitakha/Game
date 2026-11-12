# Swarm Hand en el móvil: pasos para el dueño

## 1. Activar GitHub Pages (una sola vez)
1. Sube los cambios a la rama `main` (el workflow `.github/workflows/pages.yml` ya está en el repo).
2. En GitHub: **Settings -> Pages -> Build and deployment -> Source: GitHub Actions**.
3. Ve a la pestaña **Actions**: el workflow "Desplegar en GitHub Pages" se lanza solo con cada push a `main` (o a mano con *Run workflow*). Tarda ~1 minuto.
4. Si el primer despliegue falla por el entorno `github-pages`, comprueba en Settings -> Environments que existe y permite la rama `main`.

## 2. URL final
- Índice: https://xitakha.github.io/Game/
- Swarm Hand: https://xitakha.github.io/Game/card-swarm/
- Ember Flock: https://xitakha.github.io/Game/survival-lamb/

Todas las rutas son relativas, así que funciona bajo la subruta `/Game/` (manifest y service worker incluidos, ámbito `/Game/card-swarm/`).

## 3. Instalar
- **Android (Chrome / Edge / Samsung Internet):** abre la URL, juega una vez con conexión; sale un aviso "Instalar" (o Ajustes del juego -> *Instalar app*, o menú del navegador -> *Instalar aplicación*). Se abre a pantalla completa y en horizontal.
- **iPhone / iPad (Safari):** abre la URL en Safari -> botón Compartir -> **Añadir a pantalla de inicio**. (Safari no ofrece botón automático ni Fullscreen API: instalada, se juega a pantalla completa.)
- Después de la primera carga el juego funciona **sin conexión**. Cuando subas una versión nueva, el juego muestra "Hay una versión nueva - RECARGAR" (nunca recarga solo en mitad de una expedición).

## 4. Controles táctiles
Aldea: joystick flotante en la mitad izquierda, botón HABLAR (96 px), PORTAL y menú. Expedición: joystick flotante a la izquierda, iconos de pausa y silencio arriba, tocar la carta para elegirla, OMITIR, REROLL y DESCARTAR (se pulsa y luego se toca la carta). El selector de duración del Portal (Rápida / Normal / Larga) son tres botones táctiles de 92 x 52 px. Todo lo demás (Tablón, Forja, Archivo, Portal, Cacería, Práctica, Ajustes) se maneja con toques. Calidad gráfica: Ajustes -> Gráficos (Auto / Alta / Media / Baja).

## 5. Copia del guardado
Ajustes -> **Exportar guardado** (texto + archivo, copiar o compartir) e **Importar guardado**. Úsalo antes de limpiar datos del navegador, cambiar de móvil o si el navegador avisa de que bloquea el guardado (modo privado).

## 6. Limitaciones conocidas
- Es un canvas 960x540: en un móvil de 6" los textos pequeños miden ~8 px CSS; el juego se ve mejor en tablet o con el móvil cerca. Los botones principales son >= 48 px lógicos (~35 px CSS en 844x390); algunas rejillas densas (nodos de la forja, cartas del Archivo, chips) quedan en 38-44 px lógicos.
- Vertical: solo muestra el aviso "gira el teléfono" (no hay layout vertical).
- iOS Safari: sin pantalla completa dentro del navegador y el audio solo arranca tras el primer toque; iOS puede borrar los datos de sitios que no se abren en ~7 días si no está instalada: exporta tu guardado.
- Calidad Auto baja efectos y topes de enemigos/proyectiles (hasta -25 % de enemigos vivos en Baja) si los fps bajan de 45; no vuelve a subir sola (se recuerda entre sesiones; vuelve a Auto desde Ajustes).
- Ember Flock solo tiene viewport y escalado básicos: no tiene controles táctiles.
- Para probar en local con service worker: `?nosw=1` lo desactiva y borra su caché (desarrollo). Tras tocar archivos del juego ejecuta `python3 tools/card-swarm-pwa/stamp.py` (el workflow lo hace solo).

## 7. Prueba termica de 15 min en movil real (con `?perf=1`)
Objetivo: ver si el movil se calienta y baja el rendimiento (throttling) en una expedicion larga. Solo medir; no hay umbral duro todavia.
1. Preparacion: bateria > 80 %, sin cargador, brillo al 50 %, modo ahorro desactivado, sin otras apps abiertas, mismo navegador siempre, temperatura ambiente anotada. Abre `.../card-swarm/index.html?perf=1&seed=1` (la semilla hace las ofertas y hordas repetibles). Juega con normalidad (Calidad: Auto) en el Crater o el bioma mas pesado que tengas desbloqueado, con 4 poderes en AUTO.
2. **Minuto 1**: cuando el overlay marque `min 2` (es decir, completado el minuto 1), anota fps, `frame avg/p95/max` y `cpu avg/p95`. Toca el overlay (copia el JSON) y pegalo en una nota; o desde un PC con depuracion remota (`chrome://inspect`) ejecuta `__perf.export()`.
3. **Minuto 15**: igual, al marcar `min 16`. Anota tambien lo mismo de los minutos intermedios (el JSON trae `minutes[]` con el resumen de cada minuto).
4. Anotar: modelo de movil y navegador, temperatura ambiente, bateria inicial y final (% gastado), sensacion de temperatura de la carcasa (tibio / caliente / no se puede sostener), calidad que el juego eligio (`quality` en el JSON, por si Auto bajo de nivel), n.º de enemigos tipico, tirones percibidos, `over33` (frames > 33 ms) y `fps` global.
5. Comparar min 1 vs min 15: que p95 y fps no empeoren de forma sostenida (referencia orientativa a confirmar: p95 <= 20 ms a 60 fps y < 5 % de frames > 33 ms). Una subida de p95 de minuto en minuto indica throttling termico. Repite con `&perf=1&seed=1` dos veces y usa la mediana.
6. Referencia de PC: `node tools/card-swarm-bot/perf_bot.js 30` (mismo escenario fijo). No son ms de movil: sirve para ver regresiones entre versiones.
