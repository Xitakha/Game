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
Aldea: joystick flotante en la mitad izquierda, botón HABLAR (96 px), PORTAL y menú. Expedición: joystick flotante a la izquierda, iconos de pausa y silencio arriba, tocar la carta para elegirla, OMITIR, REROLL y DESCARTAR (se pulsa y luego se toca la carta). Todo lo demás (Tablón, Forja, Archivo, Portal, Cacería, Práctica, Ajustes) se maneja con toques. Calidad gráfica: Ajustes -> Gráficos (Auto / Alta / Media / Baja).

## 5. Copia del guardado
Ajustes -> **Exportar guardado** (texto + archivo, copiar o compartir) e **Importar guardado**. Úsalo antes de limpiar datos del navegador, cambiar de móvil o si el navegador avisa de que bloquea el guardado (modo privado).

## 6. Limitaciones conocidas
- Es un canvas 960x540: en un móvil de 6" los textos pequeños miden ~8 px CSS; el juego se ve mejor en tablet o con el móvil cerca. Los botones principales son >= 48 px lógicos (~35 px CSS en 844x390); algunas rejillas densas (nodos de la forja, cartas del Archivo, chips) quedan en 38-44 px lógicos.
- Vertical: solo muestra el aviso "gira el teléfono" (no hay layout vertical).
- iOS Safari: sin pantalla completa dentro del navegador y el audio solo arranca tras el primer toque; iOS puede borrar los datos de sitios que no se abren en ~7 días si no está instalada: exporta tu guardado.
- Calidad Auto baja efectos y topes de enemigos/proyectiles (hasta -25 % de enemigos vivos en Baja) si los fps bajan de 45; no vuelve a subir sola (se recuerda entre sesiones; vuelve a Auto desde Ajustes).
- Ember Flock solo tiene viewport y escalado básicos: no tiene controles táctiles.
- Para probar en local con service worker: `?nosw=1` lo desactiva y borra su caché (desarrollo). Tras tocar archivos del juego ejecuta `python3 tools/card-swarm-pwa/stamp.py` (el workflow lo hace solo).
