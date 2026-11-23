# SPEC T-F1-08: legibilidad y uso de la pantalla en móvil (ensanchar el área de juego)

Autor: diseño UX (móvil). Fecha: 2026-11-23. Estado: propuesta para implementar.
Decisión del dueño (PLAN-MAESTRO, "Decisiones del dueño", fila 7): **ensanchar el área de juego en teléfonos alargados**. La vía de "solo mover los controles a las franjas" queda descartada.

**Decisiones del dueño (2026-11-23), respuestas a la sección 5:**
1. Ensanchar el área de juego en teléfonos alargados (opción A).
2. Velo lateral suave en las franjas extra (0 a 45 %, `#07050c`) para que ningún teléfono tenga ventaja.
3. Ancho lógico máximo **1200**.
4. **Sin opción en Ajustes**: solo la perilla `?wide=0` para pruebas y vuelta atrás (`?wide=1` la activa mientras dure la implementación; por defecto pasa a 1 en la fase 4).
5. La línea "NORMAL 9 min - botín x1" sale del combate y se muestra en la pausa.
6. El arte de la aldea a todo el ancho queda para **después de la fase 2**.

**Estado (2026-11-23):** fases 0, 1 y 2 implementadas detrás de `?wide=1` (`WIDE_DEFAULT = 0` en `src/mobile.js`; la fase 4 lo pone a 1). Pruebas: grupo `wide` de `tools/card-swarm-bot/tests.js` y `WIDE=1 node tools/card-swarm-bot/tests.js <grupo>` para correr los grupos existentes con la pantalla ancha. Fases 3 y 4 pendientes.

Convenciones:
- **px lógicos**: coordenadas del juego (hoy 960x540).
- **px reales**: píxeles CSS en la pantalla del teléfono (lo que el ojo y el pulgar perciben). `real = lógico x k`, con `k` = alto CSS del lienzo / 540.
- **[MEDIDO]**: salió de Playwright (Chromium de `/opt/pw-browsers`, `isMobile`, `hasTouch`, DPR 2, servidor `tools/serve.py`, partida con `?direct=1&biome=bosque&god=1&nointro=1`) o de leer el código con archivo:línea.
- **[INFERIDO]**: cálculo o juicio mío a partir de lo medido; hay que confirmarlo al implementar.

---

## 1. Medición del estado actual

### 1.1 Cómo se pinta hoy [MEDIDO]

- `src/main.js:8`: `G.W = 960; G.H = 540` fijos. Arena `G.AW = 1440, G.AH = 810` (`main.js:9`).
- `src/mobile.js:132-157` (`fit()`): el lienzo conserva 16:9 dentro del área segura (`env(safe-area-inset-*)`), centrado, con franjas negras (letterbox). Resolución interna en móvil = CSS x DPR (máx. 2) limitada por la calidad (`Q.s`: alta 2, media 1,5, baja 1; `mobile.js:26-28,146-151`).
- Entrada: `main.js:269-272` convierte el toque a lógico con `G.W / r.width`. El joystick nace en `x < G.W / 2` (`main.js:274`).
- En combate `G.minFont = 0`; en aldea, cartas y fin `G.minFont = G.MIN_UI = 12` (`main.js:188, 524`). En pausa sube a 12 (`hud.js:147`).

### 1.2 Tabla por tamaño [MEDIDO]

`k` = escala real. "Ancho usado" = ancho del lienzo / ancho de la ventana. Textos medidos con `tools/card-swarm-bot/textcheck.js` en un fotograma (combate a los 60 s y aldea al abrir).

| Pantalla (CSS) | Relación | Lienzo (x, y, ancho, alto) | k | Ancho usado | Franjas negras | Textos de combate (px reales, mín.-máx.) | Textos de aldea (px reales) |
|---|---|---|---|---|---|---|---|
| 844x390 (iPhone 12-15) | 2,16 | 76, 0, 693, 390 | 0,722 | 82,1 % | 76 + 75 px laterales | 8,7 - 15,9 | 8,7 - 12,3 |
| 740x360 (Android pequeño) | 2,06 | 50, 0, 640, 360 | 0,667 | 86,5 % | 50 + 50 | **8,0** - 14,7 | **8,0** - 11,3 |
| 915x412 (Android 20:9) | 2,22 | 92, 0, 732, 412 | 0,762 | 80,0 % | 92 + 91 | 9,1 - 16,8 | 9,1 - 13,0 |
| 932x430 (iPhone Pro Max) | 2,17 | 84, 0, 764, 430 | 0,796 | 82,0 % | 84 + 84 | 9,5 - 17,5 | 9,5 - 13,5 |
| 667x375 (iPhone SE/8) | 1,78 | 1, 0, 666, 375 | 0,694 | 99,9 % | ninguna | 8,3 - 15,3 | 8,3 - 11,8 |
| 1024x768 (tableta 4:3) | 1,33 | 0, 96, 1024, 576 | 1,067 | 100 % (75 % del área) | 96 + 96 arriba/abajo | 12,8 - 23,5 | 12,8 - 18,1 |
| 1280x720 (PC) | 1,78 | 0, 0, 1280, 720 | 1,333 | 100 % | ninguna | 16 - 29,3 | 16 - 22,7 |
| 390x844 (retrato) | - | 0, 313, 390, 219 | 0,406 | - | - | aviso "Gira el teléfono" visible y partida en pausa: correcto | aviso visible: correcto |

Pantallas concretas a 844x390 y 740x360 [MEDIDO]:
- **Pausa**: 10 textos, mínimo 12 lógicos = 8,7 px reales (8,0 a 740x360); 6 de 10 por debajo de 11 px reales. Botones: CONTINUAR 260x40 px reales, GRÁFICOS/SONIDO 127x36, MANUAL 137x36, ABANDONAR 260x40 (a 740x360: 33-37 px de alto). **Todos por debajo de 44 px de alto.**
- **Elección de carta (subida de nivel)**: 32 textos, mínimo 8,7 px reales; **22 de 32 por debajo de 11 px reales** (28 de 32 a 740x360).

### 1.3 Elementos clave de combate, en px reales [MEDIDO en código, real = lógico x k]

| Elemento (archivo:línea) | Lógico | 844x390 (k 0,722) | 740x360 (k 0,667) | Veredicto |
|---|---|---|---|---|
| Reloj de la expedición `hud.js:104` | 22 | 15,9 | 14,7 | bien |
| "HP 100/100" `hud.js:96` | 13 | 9,4 | 8,7 | pequeño (dato vital) |
| "Jefe en 06:26" y línea de duración/botín `hud.js:105-109` | 12 | 8,7 | 8,0 | ilegible |
| Bajas / Ceniza / Partes `hud.js:112-117` | 15 | 10,8 | 10,0 | justo |
| "Encargo" `hud.js:123` | 11 | 7,9 | 7,3 | ilegible |
| Lista COMBOS `hud.js:81-85` | 12-13 | 8,7-9,4 | 8,0-8,7 | ilegible |
| Aviso de práctica `hud.js:102` | 10 | 7,2 | 6,7 | ilegible |
| Descripción del combo en el estandarte `hud.js:41` | 12 | 8,7 | 8,0 | ilegible |
| Reloj roto "-40%" `hud.js:74` | 11 | 7,9 | 7,3 | ilegible |
| Nombre en la carta de la mano ("Chispa") | 12 | 8,7 | 8,0 | ilegible |
| Botón AUTO `fusion.js:769` | 88x38 | 64x27 | 59x25 | **objetivo táctil demasiado bajo** |
| Botones de poder `fusion.js:769` (radio 38, zona de toque radio 44) | 76 de diámetro | 55 (toque 64) | 51 (toque 59) | bien |
| Pausa / silencio `mobile.js:199-204` | 48x48 | 34,7 | 32,0 | **por debajo de 44** |
| Pantalla completa (aldea) `mobile.js:203` | 48x48 | 34,7 | 32,0 | **por debajo de 44** |
| Carta de la mano `cards.js:264` | 72x96 | 52x69 | 48x64 | bien |
| Botones del menú de pausa `hud.js:152-158` | 50-56 de alto | 36-40 | 33-37 | **por debajo de 44** |

Qué se ve mal [MEDIDO en capturas]:
1. A 844x390, 151 px de ancho (18 %) son negro puro; a 915x412, 183 px (20 %).
2. El HUD de combate llena la franja superior central (reloj + 2 líneas grises de 8 px) y se monta sobre la arena; la esquina superior derecha (Bajas/Ceniza/Partes/Encargo) es una columna de textos de 8-11 px.
3. El texto de ayuda inicial (`hud.js:140-141`) ocupa todo el ancho en el centro de la arena, sobre el personaje.
4. Los botones de sistema (pausa, silencio, pantalla completa) son los objetivos táctiles más pequeños del juego.

### 1.4 Conclusión clave de la medición [INFERIDO de 1.2]

En todos los teléfonos apaisados el lienzo está **limitado por el alto**, no por el ancho. Ensanchar el área de juego **no agranda ni un píxel los textos**: `k` sigue siendo alto/540 (0,722 a 844x390). Ensanchar recupera el 18-20 % de pantalla negra para el mundo y da sitio a los lados para colocar el HUD y los controles sin tapar la arena; la legibilidad se arregla **además** subiendo los tamaños lógicos mínimos (sección 3.6). Las dos cosas van juntas: sin el ancho extra, los textos más grandes taparían la arena.

---

## 2. Opciones para ensanchar

### 2.0 Hallazgo que condiciona todas las opciones: la simulación depende hoy del ancho de vista [MEDIDO]

La cámara de render se usa como regla de juego en varios sitios. Si `G.W` cambia con la pantalla, **la partida cambia según el teléfono** y la prueba de semilla (hash) deja de ser igual:

| Sitio | Qué hace con `G.cam` + `G.W` |
|---|---|
| `weapons.js:197` | Rayo (strike): elige objetivo al azar **entre los enemigos visibles**; más ancho = más candidatos = otra tirada de `G.rng()`. |
| `weapons.js:323` | Era glacial: aturde y ralentiza **solo a los enemigos visibles**. |
| `fusion.js:316, 434, 589` | Poderes: objetivos y disparo automático (AUTO) filtrados por "visible". |
| `main.js:452-454` | La cámara se calcula dentro del paso de simulación con `G.W/2` y se fija con `G.AW - G.W`: en los bordes de la arena, su posición depende del ancho. |
| `boss.js:796, 801` | Objetivo de cámara de la intro del jefe con `G.W`. |
| `waves.js:12-21` | Aparición de enemigos en un anillo de radio 500-580 alrededor del jugador (vertical x0,8). Con 960 de ancho (mitad 480) **nunca se ven aparecer**; con 1168 (mitad 584) **aparecen dentro de la pantalla** por los lados. |

Nota: la vista inclinada (`view.js:13-17`, `G.VH = G.H / K`) ya hace que lo visible dependa de un ajuste. Es un problema previo y no lo arregla esta tarea, pero la solución de abajo lo deja preparado.

Regla obligatoria para cualquier opción: **la simulación usa una "ventana de juego" fija de 960 de ancho, centrada en el jugador, independiente de la pantalla**. Lo que hay fuera de esa ventana se ve, pero no cuenta para las reglas.

### Opción A. Ancho lógico variable, alto fijo 540 (RECOMENDADA)

`G.H = 540` fijo. `G.W = clamp(redondeo par de 540 x ancho/alto, 960, 1200)`. El lienzo llena el teléfono; el mundo se ve más ancho; el HUD se ancla a los bordes; los menús siguen diseñados a 960 y se centran.

- Pros: es lo que pidió el dueño; recupera todo el negro en 19,5:9 y 20:9; no recorta nada en vertical (la visión vertical, que es la escasa en apaisado, queda igual para todos); el arte de 960x540 sirve tal cual centrado; los menús no se rehacen de golpe; se revierte con `?wide=0`.
- Contras: hay que separar la cámara de juego de la de render (sección 2.0); revisar todo lo que usa coordenadas fijas del HUD (unas 60 posiciones en `hud.js`, `fusion.js`, `mobile.js`, `cards.js`, `boss.js`); +22-25 % de píxeles por fotograma; ventaja visual lateral (ver impacto).

### Opción B. Escala "cover" (llenar la pantalla recortando arriba y abajo)

El lienzo 960x540 se escala al ancho (k = 844/960 = 0,879 a 844x390) y se recorta el alto (se verían 444 de 540 lógicos).

- Pros: los textos crecen un 22 % sin tocar tamaños; cero franjas.
- Contras: **se pierde un 18 % de visión vertical**, que es justo la escasa: más difícil en teléfonos alargados que en PC, contra la regla de reto equivalente; todo lo anclado arriba o abajo (vida, mano, barra de experiencia, botones de poder) queda cortado y hay que moverlo; en 20:9 el recorte sube al 20 %; contradice "ensanchar". **Descartada.**

### Opción C. Mundo ensanchado + capa de interfaz a escala real propia

Como A, pero el HUD y los menús se dibujan en su propio sistema de coordenadas en px reales (una unidad = 1 px CSS x factor), separado del mundo.

- Pros: es la solución definitiva de legibilidad: tamaños mínimos garantizados en cualquier pantalla.
- Contras: reescribir todas las coordenadas de todas las pantallas (aldea, paneles, árbol, Archivo, cartas, fin, pausa): tamaño XL; mucho riesgo de regresión. **Descartada para esta tarea**; A deja el camino abierto (los anclajes de la sección 3.3 son el primer paso).

### Opción D. Solo mover controles a las franjas negras

Descartada por el dueño (2026-11-13).

### Impacto de la opción A

**Juego y dificultad.**
- Simulación: con la ventana de juego fija (2.0) el resultado de cada tirada es idéntico en todos los teléfonos. Criterio: mismo hash de semilla a 844x390, 667x375 y 1280x720, y con `?wide=0` y `?wide=1` (sección 4, pruebas).
- Visión: a 844x390 se ven 104 px lógicos más por cada lado (1168 frente a 960). Con velocidades de enemigo de 35 a 125 px/s, eso es entre 0,8 y 3 s más de aviso para lo que llega por los lados [INFERIDO]. No cambia la visión vertical. Es una ventaja moderada y solo de información.
- Compensación propuesta: **velo lateral**. Fuera de la ventana de juego (las franjas de pantalla que quedan fuera de los 960 de la ventana; normalmente dos de `(G.W - 960)/2`, y una sola más ancha cuando el jugador está junto a un muro), el mundo se dibuja con un degradado oscuro de 0 % (en el borde de la ventana) a 45 % (en el borde de la pantalla), color `#07050c`. El jugador ve que hay espacio y movimiento, pero el foco y la lectura fina quedan en la ventana justa de 960. Además, esconde la aparición de enemigos en el anillo de 500-580 (que con 960 nunca se veía). El velo se dibuja después del mundo y antes del HUD.
- Las telegrafías de suelo y los proyectiles enemigos se ven igual dentro y fuera del velo (el velo no los tapa del todo: 45 % máximo), así que nadie pierde información; solo se reduce la ventaja.
- Los bots y pruebas actuales corren a 844x390 (`tests.js:16`): tras el cambio, su simulación no cambia (la ventana de juego es 960), así que las mediciones de dificultad del plan (T-F1-0x de balance) siguen valiendo.

**Cinemáticas.** Las capas de `assets_cine.js` ya aceptan un ancho variable (`assets_cine.js:202-203`: `VW = w / s`, `pad` de paralaje) y `assets_cine3.js:373,410` escalan con `V.VW / 960`. Pero `cine_intro.js:9`, `cine_entry.js:9` y `ending.js:12` fijan `W = 960`. Regla: se dibujan centradas a 960 con franjas negras dentro del lienzo (pillarbox, lenguaje de cine aceptado), salvo las capas que ya usan `V.VW`, que se pintan al ancho completo. El botón SALTAR se ancla al borde derecho seguro.

**Pantallas y menús.** Diseñados a 960 con coordenadas literales (p. ej. `hud.js:152-158`, `cards.js:262-269`, `panels.js` con 11 usos de 480). Fase 1: se dibujan centrados en una columna de 960 con desplazamiento `G.OX = (G.W - 960) / 2`; el fondo oscuro de cada pantalla cubre `G.W` entero. Fase 3: los paneles densos (árbol, Archivo, cartas) usan el ancho extra para letra más grande.

**HUD de combate.** Se ancla a los bordes (sección 3.3). Es la parte que más gana: la columna derecha y la mano se alejan del centro y la arena queda libre.

**Rendimiento** [INFERIDO]. Píxeles por fotograma a 844x390, DPR 2, calidad alta: hoy 1386x780 = 1,08 Mpx; ancho 1682x780 = 1,31 Mpx (+21 %). A 915x412: +25 %. Afecta a todo lo que llena pantalla: suelo, niebla (`main.js:573`), viñeta (`main.js:586`), ventisca de la Tundra (`tundra.js:443-456`, lienzos de `G.W x G.H`), luciérnagas. La calidad automática (`mobile.js:60-81`) ya baja de nivel si cae por debajo de 45 fps. `performance-engineer` debe medir con `tools/card-swarm-bot/perf_bot.js` antes y después; si el coste supera el 15 % de tiempo de fotograma en "media", bajar `Q.s` de media de 1,5 a 1,35 en modo ancho.

### Recomendación

**Opción A** (ancho lógico variable de 960 a 1200, alto 540, ventana de juego fija de 960, velo lateral, HUD anclado, menús centrados en fase 1). Es la única que cumple la decisión del dueño sin quitar visión vertical, sin hacer el reto distinto según el teléfono y sin reescribir todas las pantallas de una vez. Se hace por fases detrás de `?wide=0/1`.

---

## 3. Diseño de la vía elegida

### 3.1 Cálculo del ancho lógico

En `mobile.js` `fit()`:
1. `w, h` = tamaño de la ventana visible (como hoy, `mobile.js:134-136`).
2. El lienzo ocupa **toda la ventana**, también bajo la muesca (el mundo se pinta debajo; el HUD respeta las zonas seguras, ver 3.2). Hoy se excluyen las zonas seguras del lienzo (`mobile.js:139`); eso cambia.
3. `ratio = w / h`. Si `wide` está activo y `ratio > 16/9`: `G.W = clamp(2 * round(540 * ratio / 2), 960, 1200)`. Si no: `G.W = 960`.
4. `k = min(w / G.W, h / 540)`. Lienzo CSS = `G.W x k` por `540 x k`, centrado (si `ratio > 1200/540 = 2,22`, quedan franjas laterales finas).
5. Resolución interna: `s` como hoy pero con `G.W` (`mobile.js:147-151`).
6. Si `G.W` cambia (giro, pantalla completa, barra del navegador que aparece), se invalidan las cachés que dependen de él: viñeta, ventisca y su neblina (`tundra.js:443, 455, 486`), velo lateral, caché de textos no (es por tamaño de letra).

Valores esperados [INFERIDO de la fórmula]:

| Pantalla | G.W | k | Ancho usado |
|---|---|---|---|
| 844x390 | 1168 | 0,722 | 99,9 % |
| 740x360 | 1110 | 0,667 | 100 % |
| 915x412 | 1200 | 0,763 | 100 % (1200 x 0,763 = 915) |
| 932x430 | 1170 | 0,796 | 99,9 % |
| 667x375 | 960 | 0,695 | 100 % |
| 1024x768 (tableta) | 960 | 1,067 | 100 % de ancho, franjas arriba/abajo como hoy |
| 1280x720 (PC) | 960 | 1,333 | 100 % |
| 2560x1080 (PC ultrapanorámico) | 1200 | 1,0 | 94 % (franjas finas) |

Límite superior 1200 (no 1170) para cubrir los Android 20:9 (2400x1080), que son mayoría [INFERIDO]; el plan decía "~1170". Con 1200 la mitad del ancho es 600, todavía por encima del anillo de aparición (580): la aparición queda dentro del velo lateral, no en zona limpia.

Perilla: `?wide=0` fuerza 960 (comportamiento actual). `?wide=1` (por defecto tras la fase 4) activa el ancho. Mientras dure la implementación, el valor por defecto es `0` y se activa con `?wide=1`.

### 3.2 Zonas seguras

- Insets en px CSS (`mobile.js:123-128`, simulables con `?safe=t,r,b,l`) se pasan a lógicos: `G.safe = { l: inset.l / k, r: inset.r / k, t: inset.t / k, b: inset.b / k }`.
- Margen fijo adicional `G.M = 12` lógicos (8,7 px reales a 844x390) para no pegar nada al borde ni a las esquinas redondeadas.
- Rectángulo seguro del HUD: `x` de `G.safe.l + G.M` a `G.W - G.safe.r - G.M`; `y` de `G.safe.t + G.M` a `540 - G.safe.b - G.M` (la barra de experiencia es la única excepción: va pegada al borde inferior y puede quedar bajo el indicador de inicio de iOS, porque es decorativa y el dato está en "NV").
- Ejemplo iPhone 13 apaisado (insets reales 47/47 laterales, 21 inferior) [INFERIDO]: `G.safe.l = r = 65`, `b = 29` lógicos.

### 3.3 Reglas de anclaje del HUD de combate (estado `play`)

Coordenadas: `L = G.safe.l + G.M`, `R = G.W - G.safe.r - G.M`, `T = G.safe.t + G.M`, `B = 540 - G.safe.b - G.M`, `CX = G.W / 2`.

| Elemento | Hoy | Nuevo anclaje | Tamaño nuevo (lógico) | Real a 844x390 / 740x360 |
|---|---|---|---|---|
| Barra de vida | x 16, y 14, 220x18 (`hud.js:95`) | x L, y T, 240x22 | texto "HP 100/100" 16 | 11,6 / 10,7 |
| Pausa | x 246 (`mobile.js:200`) | esquina **superior derecha**: x R-64, y T, 64x64 | icono 26 | 46 / 43 |
| Silencio | x 298 | a la izquierda de pausa: x R-136, y T, 64x64 | | 46 / 43 |
| Reloj | CX, y 20, 22 | CX, y T+12, 26 | 26 | 18,8 / 17,3 |
| "Jefe en 06:26" | CX, y 42, 12 | CX, y T+38, 15 | 15 | 10,8 / 10,0 |
| Línea de duración y botín (`hud.js:109`) | CX, y 60, 12 | **se quita del combate** y pasa a la pausa (ya está la info en la Base antes de salir) | 15 en pausa | |
| Bajas / Ceniza / Partes / Rara | columna derecha x G.W-16 (`hud.js:112-118`) | columna derecha, alineada a R-144 (a la izquierda de silencio y pausa), filas de 22 | 16 | 11,6 / 10,7 |
| Encargo | etiqueta 11 + texto 14 | bajo la columna derecha, x R, y T+76: etiqueta 13 y texto 15 | 13 / 15 | 9,4 / 10,8 |
| COMBOS | x 16, y 64 (`hud.js:78-87`) | x L, bajo la barra de vida (y T+40), filas de 22 | 14 | 10,1 / 9,3 |
| Mano | x 8 + i x 77, y 430, 72x96 (`cards.js:264`) | x L + i x 84, y B-104, 78x104 | nombre 14 | carta 56x75 / 52x69 |
| "NV" | x 408 (`hud.js:134`) | a la derecha de la mano: x L + 5 x 84 + 6, y B-12 | 17 | 12,3 / 11,3 |
| Reloj roto | x 424, y 470 (`hud.js:63`) | encima de "NV": x L + 5 x 84 + 22, y B-60 | "-40%" 14 | 10,1 / 9,3 |
| Botones de poder | centros fijos 906/826/892/810 (`fusion.js:769`) | arco anclado a la esquina inferior derecha: centros (R-44, B-38), (R-128, B-28), (R-58, B-122), (R-142, B-112); radio 40, zona de toque 48 | número 18 | diámetro 58 / 53 |
| AUTO | 88x38 en x 700 (`fusion.js:769`) | 96x64 a la izquierda del arco: x R-196-96, y B-64 | 16 | 69x46 / 64x43 |
| Barra de experiencia | 0 a G.W, alto 8 | igual, todo `G.W` | | |
| Ayuda inicial (`hud.js:140-141`) y avisos de primera expedición (`fte.js:108`) | centro de la arena (y 300-322 y 74) | franja superior central, bajo el reloj (y T+62), ancho máx. 640, partida en 2 líneas si no cabe | 16 y 15 | 11,6 y 10,8 |
| Estandarte de combo (`hud.js:23-48`) | 0..G.W, y 96-206 | igual, centrado en CX; la descripción sube de 12 a 15 | 15 | 10,8 |
| Barra del jefe, minijefe y furia (`boss.js`, `minis.js:395`, `boss_cenizar.js:650`) | centradas con `G.W` | sin cambio de posición (ya usan `G.W/2`); comprobar que no pisan la columna derecha | | |
| Joystick | nace en `x < G.W/2` (`main.js:274`) | igual (ahora 584 de ancho a 844x390); no nace a menos de 72 lógicos de un botón | | |

Reglas generales:
- Nada del HUD (salvo la barra de experiencia y velos/destellos de pantalla completa) fuera del rectángulo seguro.
- Los destellos de pantalla completa (`hud.js:43, 148`) cubren `G.W` y siguen respetando "reducir destellos" como hoy.
- En PC (teclado), los textos con teclas siguen con `G.hint`; en táctil no se muestran teclas (regla del estudio).

### 3.4 Tamaños mínimos NUEVOS (en px reales, y su equivalente lógico)

Mínimos medidos en el peor teléfono soportado, **740x360** (k 0,667). Se comprueba también a 844x390.

| Contexto | Mínimo real | Lógico necesario a 740x360 | Lógico a 844x390 da |
|---|---|---|---|
| Menús, aldea, paneles, cartas, fin, pausa | 11 px | **17** (`G.MIN_UI = 17`) | 12,3 px |
| HUD de combate (datos que el jugador lee) | 9,5 px | **14** (`G.MIN_HUD = 14`) | 10,1 px |
| Datos vitales (vida, reloj, número de poder) | 11 px | 16 | 11,6 px |
| Etiquetas del mundo (nombres sobre enemigos, números de daño) | 8 px | 12 | 8,7 px |
| Objetivo táctil (botón dibujado o zona de toque) | 44 px de lado | **66** | 47,7 px |

Notas:
- El plan pedía "11 px CSS en menús y 9 px CSS en combate a 844x390". Lo endurezco a medirlo a 740x360 porque `textcheck` debe pasar en los dos tamaños (aceptación de T-F1-08); a 844x390 sale holgado.
- Un botón puede dibujarse más pequeño (mín. 56 lógicos) si su zona de toque llega a 66 (relleno invisible). Dos zonas de toque no pueden solaparse.
- `G.MIN_UI` sube de 12 a 17 **por fases** (3.5 y sección 4): subirlo de golpe desborda casi todas las pantallas.
- Fuente propia: T-F1-08 paso (3) pide una fuente con licencia libre; los tamaños de esta tabla están medidos con "Courier New" negrita y hay que volver a medir al cambiarla.

### 3.5 Menús, aldea, título y cinemáticas

- **Menús (cartas, pausa, paneles de la aldea, taller, árbol, Archivo, manual, fin de expedición)**: fase 1, columna de 960 centrada con `G.OX`. El velo/fondo de la pantalla cubre `0..G.W`. Los botones de cerrar ("X") se anclan a la esquina superior derecha segura, no a la columna. Fase 3: árbol (`tree.js`) y Archivo usan `G.W` completo (más columnas o letra más grande) y paginación/zoom según T-F1-08 paso 4.
- **Pausa en combate**: columna centrada; botones a 66 de alto mínimo (hoy 50-56); la línea de duración y botín (quitada del HUD) se muestra aquí.
- **Aldea**: el mapa pintado es de 960x540 (`aldea.js:3`, `assets_village.js:804-816`), con colisiones en coordenadas de 960. Fase 1: se dibuja centrado en `G.OX` y las franjas laterales se rellenan prolongando el color del borde del mapa (columna de 1 px estirada) con el velo lateral oscuro encima; Marlo no puede salir de los 960. El HUD de la aldea (Brasas/PF/Salidas arriba a la izquierda, silencio/pantalla completa, menú arriba a la derecha, PORTAL abajo a la izquierda, HABLAR abajo a la derecha) se ancla a los bordes seguros con las mismas reglas que el combate. Fase posterior (arte): ampliar el mapa a 1200 de ancho con decorado lateral (pedir a `art-director`).
- **Título** (`G.Cine.titleDraw`): fondo a `G.W` completo (las capas con `V.VW` ya lo admiten); logotipo y botones centrados en `CX`.
- **Cinemáticas**: ver impacto en la sección 2. Subtítulos centrados en `CX`, ancho máx. 760, letra mínima 17 lógica. SALTAR (`cine.js:167`, hoy 104x40) pasa a x `R-120`, y `T`, 120x66.

### 3.6 Tabletas y PC

- Tabletas 4:3 y 16:10: `G.W = 960` (no se ensancha); franjas arriba/abajo como hoy. Sus `k` (1,0-1,3) ya dan textos grandes.
- PC: misma fórmula que el móvil (una ventana muy ancha también se ensancha hasta 1200). Resolución interna en escritorio: `G.W x 540` pixelado, como hoy con 960.
- Retrato: sin cambios (aviso "Gira el teléfono" y pausa; medido correcto).

---

## 4. Cambios por archivo, fases y aceptación

Orden recomendado. Cada fase es un commit (o pocos) y se puede revertir sola. Durante las fases 1-3, `?wide=1` activa el ancho; el valor por defecto pasa a `1` en la fase 4.

### Fase 0. Ventana de juego fija (sin cambio visible)
- `main.js`: nuevo `G.SW = 960` y `G.simCam = {x, y}` calculado en el paso de simulación con la fórmula de `main.js:452-454` pero con `G.SW` (incluido el suavizado 0,15 y `G.Boss.camTarget`). `G.cam` (render) se deriva de `G.simCam` al dibujar: `G.cam.x = clamp(G.simCam.x + G.SW/2 - G.W/2, 0, G.AW - G.W)`, `G.cam.y = G.simCam.y`. Así nunca se ve vacío más allá del muro (la arena mide 1440 y `G.W` como mucho 1200); cerca de un muro la ventana de juego deja de estar centrada en pantalla y el velo lateral la sigue (se dibuja fuera de `[G.simCam.x - G.cam.x, G.simCam.x - G.cam.x + 960]`). `G.cam` deja de escribirse dentro del paso de simulación.
- Nueva función `G.inPlay(x, y, m)` (ventana de juego: `G.simCam` + `G.SW x G.VH`). Sustituye a las comprobaciones de `weapons.js:197, 323`, `fusion.js:316` y cualquier otra regla de juego. El culling de dibujo (`combat.js:419`, `panal.js:479`, `tundra.js:378`, `assets_fx2.js:364`, `boss.js:903`) sigue con `G.cam` y `G.W`.
- El apuntado con ratón o dedo (pantalla a mundo) usa `G.cam` de render: es entrada del jugador, no regla, y no rompe la reproducibilidad.
- `boss.js:796, 801`: el objetivo de cámara de la intro del jefe se calcula sobre `G.simCam`.
- Aceptación: hash de semilla igual al de antes de la fase 0 (la fase no cambia nada con `G.W = 960`); `tests.js seed` pasa.

### Fase 1. Lienzo ancho y menús centrados
- `mobile.js` `fit()`: cálculo de 3.1; lienzo a ventana completa; `G.safe`; perilla `?wide=`; invalidar cachés al cambiar `G.W`.
- `main.js`: `G.OX = (G.W - 960) / 2`; en `draw()`, los estados de menú (`aldea`, `privacy`, `title`, `cine`, `cards`, `gameover`, y el bloque de pausa) se dibujan con `translate(G.OX, 0)` tras pintar su fondo a `G.W`; en `pt()` (`main.js:269-272`) se guarda `inp.mouse` en coordenadas de pantalla y se expone `G.UI.m()` que devuelve el puntero menos `G.OX` para los menús. Revisar todo `G.UI.inR(…, m)` de menús.
- `ending.js`, `cine_entry.js`, `cine_intro.js`: dibujar con `translate(G.OX, 0)` y franjas negras (pillarbox).
- Velo lateral (`main.js`, tras el mundo y antes del HUD), solo si `G.W > 960`.
- Aceptación: a 844x390 con `?wide=1`, el lienzo mide 843-844 px de ancho y `G.W = 1168`; ninguna pantalla deja de responder a toques (prueba `touch` y `ui` de `tests.js` pasan con `?wide=1`); hash de semilla igual con `?wide=0` y `?wide=1`.

### Fase 2. HUD de combate anclado
- `hud.js` (todo `H.draw`, `drawCombosList`, `H.drawCdSlow`, `drawPause`), `cards.js:264` (mano), `fusion.js:769` (arco y AUTO como función de `R`/`B`, no constantes), `mobile.js:199-204` (botones de sistema), `fte.js:108`, `cook`/encargos (`G.Cook.drawHud`, `G.Quests`), `boss.js` (barra), `minis.js:395-422`, `boss_cenizar.js:650`: aplicar la tabla de 3.3.
- Aceptación: a 844x390, 740x360 y 932x430 con `?safe=0,47,21,47`: ningún texto ni botón del HUD fuera del rectángulo seguro; ningún objetivo táctil del combate menor de 44 px reales; ningún texto del HUD menor de 9,5 px reales a 740x360 (salvo etiquetas del mundo, mín. 8).

### Fase 3. Mínimos de menús y pantallas densas
- `main.js:188`: `G.MIN_UI` de 12 a 17, pantalla por pantalla (empezar por pausa, elección de carta, fin de expedición; luego aldea y paneles; al final árbol y Archivo con paginación o zoom).
- `panels.js`, `smith.js`, `tree.js`, `manual.js`, `cards.js`, `base.js`, `aldea.js`: rehacer alturas de fila y botones (mín. 66 de alto) para que quepan con 17.
- Aceptación: `textcheck` sin textos por debajo de 11 px reales en menús ni solapes/desbordes a 844x390 y 740x360.

### Fase 4. Por defecto y limpieza
- `?wide` por defecto `1`. Actualizar comentarios de cabecera de `mobile.js:2-3`, `aldea.js:3`, `panels.js:1`, `smith.js:1`, `fusion.js:767-768` (hablan de 960x540 fijo y escala 0,72).
- Medición de rendimiento (`perf_bot.js`) en las tres calidades, antes y después.

### Pruebas a añadir en `tools/card-swarm-bot/tests.js` (grupo nuevo `wide`)
1. **Ancho por tamaño**: a 844x390, 740x360, 915x412, 932x430, 667x375, 1024x768, 1280x720 (`isMobile` en los cinco primeros): `G.W` igual a la tabla de 3.1 y ancho del lienzo >= 99 % de la ventana en los teléfonos (salvo 1024x768: alto del lienzo 576). Con `?wide=0`: `G.W = 960` en todos.
2. **Simulación idéntica**: `seedRun` (`tests.js:712`) con la misma semilla y movimiento a 844x390 `?wide=1`, 844x390 `?wide=0` y 1280x720: los hashes de todos los puntos de control son iguales. Repetir con un arma que usa "visible" (rayo, `actives=` del poder con objetivo) para cubrir `weapons.js:197` y `fusion.js:434`.
3. **Zona segura**: con `?safe=0,47,21,47` a 844x390, todos los textos y botones del HUD (grabados por `textcheck.snap`) dentro de `[G.safe.l, G.W - G.safe.r] x [G.safe.t, 540 - G.safe.b]`.
4. **Tamaños**: ampliar `textcheck.analyze` con `o.k` (escala real) para que `minSize` sea en px reales; correr en combate (con combos activos, encargo, práctica y reloj roto forzados), pausa, cartas, aldea, fin, a 844x390 y 740x360.
5. **Objetivos táctiles**: recoger los rectángulos de `G.UI.button`, `G.Sys` (botones de sistema), `G.Fusion.BTN`/`AUTO` y la mano: lado menor x k >= 44 px a 740x360.
6. **Velo y aparición**: con `?wide=1` a 915x412 (`G.W = 1200`), ningún enemigo recién aparecido (`spawnT > 0`) dentro de la ventana de juego de 960.
7. **Cambio de tamaño en plena partida**: pasar de 844x390 a 667x375 durante el combate: `G.W` pasa de 1168 a 960, 0 errores de consola, y el hash sigue igual que sin el cambio.

### Riesgos y reversión
- Coordenadas literales olvidadas (botón que se dibuja en un sitio y se toca en otro). Mitigación: menús centrados con un único `G.OX` y prueba 5. Reversión: `?wide=0`, y por commit de fase.
- Rendimiento en gama baja (+21-25 % de píxeles). Mitigación: calidad automática existente y ajuste de `Q.s`. Reversión: `?wide=0`.
- Diferencia de dificultad entre teléfonos. Mitigación: ventana de juego fija, velo lateral y prueba 2.
- Subir `G.MIN_UI` desborda paneles. Mitigación: fase 3 pantalla por pantalla con `textcheck`.

---

## 5. Preguntas para el dueño

1. **Velo lateral.** Para que ningún teléfono tenga ventaja, propongo oscurecer suavemente (hasta un 45 %) las dos franjas extra de los lados: se ven, pero el foco queda en el centro. ¿Lo quieres así o prefieres el mundo extra sin oscurecer? *Recomiendo el velo.*
2. **Ancho máximo.** El plan hablaba de ~1170 (iPhone). Propongo 1200 para que los Android 20:9 también llenen la pantalla. ¿De acuerdo? *Recomiendo 1200.*
3. **Ajuste visible.** ¿Quieres una opción en Ajustes ("Pantalla: ancha / clásica") o basta con la perilla de URL `?wide=0` para pruebas? *Recomiendo solo la perilla: menos opciones, y el ancho no cambia la partida.*
4. **Línea de duración y botín.** Para liberar la arena propongo quitar del combate la línea "NORMAL 9 min - botín x1" (8 px reales hoy) y mostrarla en la pausa. ¿Te vale? *Recomiendo sí.*
5. **Aldea ancha.** En la fase 1 la aldea se ve centrada con los lados rellenos y oscurecidos. ¿Encargamos ya al arte ampliar el mapa de la aldea a todo el ancho, o lo dejamos para después? *Recomiendo después de la fase 2.*

---

## Capturas "antes" (no están en el repo)

Tomadas en el scratchpad de la sesión de diseño: combate, aldea, pausa y cartas a 844x390 y 740x360; combate y aldea a 915x412, 932x430, 667x375, 1024x768, 1280x720 y retrato 390x844. Para repetirlas: servidor `python3 tools/serve.py card-swarm <puerto>` y la URL `index.html?dev=1&nosw=1&reset=1&god=1&nointro=1&direct=1&biome=bosque&t=60` con Playwright `isMobile`, `hasTouch`, DPR 2. Las capturas "después" se toman con `&wide=1` al cerrar cada fase.
