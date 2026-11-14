# SPEC T-F1-02 y T-F1-04: primera sesión y pantalla de fin

Autor: `ux-designer`. Fecha: 2026-11-14. Estado: especificación lista para implementar. Solo quedan las capturas de después.
Tareas del plan: `studio/docs/PLAN-MAESTRO.md`, T-F1-02 y T-F1-04. Respeta las decisiones del dueño del 2026-11-13: la intro no se acorta la primera vez, no hay modo corto, el juego es un reto, Marlo es mapache, en táctil no hay pistas de teclado y la inmortalidad de pruebas no se toca.

Notación: **[M]** medido en esta sesión; **[I]** inferido; **[P]** propuesta. "px lógicos" = lienzo de 960x540; "px CSS" = lo que ve el dueño. A 844x390 el lienzo se dibuja a 693x390 (escala 0,722 [M]); a 740x360, a 640x360 (escala 0,667, calculada).

Mínimos que uso en toda la especificación (de T-F1-08 y del lienzo):
- Texto de menú: >= 12 px lógicos (8,7 px CSS a 844x390). Texto de aviso en combate: >= 16 px lógicos (11,6 px CSS).
- Zona táctil: >= 44 px CSS, es decir >= 66 px lógicos de alto en el tamaño menor (740x360). Botón principal: 68 px lógicos de alto.
- Contraste >= 4,5:1 contra el fondo del panel; nada se distingue solo por color (siempre texto o icono además).

---

## A) Primera sesión (T-F1-02)

### A.1 Cómo lo medí

- Servidor `python3 tools/serve.py card-swarm 8835`, Chromium de `/opt/pw-browsers` con `tools/lib/browser.js`, contexto nuevo 844x390 `hasTouch` + `isMobile`, URL `index.html?cine=1` (fuerza título e intro: `src/cine.js:19-30`). Cuenta nueva (localStorage vacío).
- Toques con `touchscreen.tap` (eventos táctiles reales, `pointerType = touch`); joystick con `Input.dispatchTouchEvent` de CDP en la mitad izquierda.
- Dos políticas de movimiento en combate: **"recolector"** (va hacia la gema más cercana y se aparta de enemigos a < 70 px) y **"novato"** (da vueltas cambiando de dirección cada 1,3 s, como quien sigue el consejo de Lanudo "tú solo esquiva", `src/aldea.js:160`).
- Con el bot, `navigator.webdriver` pone `G.god = false` (`src/main.js:20`): la partida medida es la de reto, no la inmortal.
- El bot sabe dónde tocar. Los tiempos de aldea y Portal son una **cota inferior**: un humano tiene que descubrir los botones.
- Script y capturas (fuera del repo): `/tmp/claude-0/-home-user-Game/ac8df0e6-87e6-5837-9d6a-fa8dcc4300ed/scratchpad/fte/run.js`, carpetas `pasivo/` (novato) y `gemas/` (recolector).

### A.2 Flujo actual medido [M]

Reloj desde `page.goto`. Toques acumulados entre paréntesis.

| # | Pantalla | Qué pasa | Tiempo (recolector) | Toques | Código |
|---|---|---|---|---|---|
| 0 | Carga | servidor local | 1,7-1,8 s | 0 | `src/main.js:629-632` |
| 1 | Título | "TOCA PARA JUGAR" aparece a 0,7 s; el toque desbloquea audio | +1,4 s (espera del bot) | 1 | `src/cine_intro.js:195-207` |
| 2 | Intro | 6 viñetas bloqueadas, sin SALTAR; un toque completa la línea y el segundo pasa de escena | **26,9 s** sin tocar | 1 | `src/cine_intro.js:66-91`, `:168-180`; `src/cine.js:159-165` |
| 3 | Aldea | 7 NPC, barra de Brasas/PF/Salidas, "Sin encargo (habla con Vesper)", "!" sobre Vesper, botón PORTAL abajo a la izquierda y HABLAR abajo a la derecha. Nada dice adónde ir | 0,6 s (bot) | 2 | `src/aldea.js:54-90`, `:307`, `:571-573` |
| 4 | Aldea junto al Portal | viaje rápido; el botón de la derecha pasa a decir PORTAL | 0,7 s | 3 | `src/aldea.js:95-99`, `:573` |
| 5 | Portal | 48 textos: destino (6 biomas, 5 cerrados), duración, Peligro (solo I), encargo, compras y plato, pestaña CARTAS, SALIR | 0,1 s (bot) | 4 | `src/panels.js:368-399`, `:432`, `:498` |
| 6 | Combate | arranca en `play` (el ancla Chispa ya es arma, no hay oferta inicial: `src/main.js:412-416`) | **2,2 s desde el fin de la intro** | 4 | |
| 7 | Primer enemigo visible | | +2,3 s (novato: +3,0 s) | 4 | |
| 8 | Primera baja | el básico dispara solo | +4,2 s (novato: +3,7 s) | 4 | |
| 9 | Primera oferta de carta (Nv 2) | | **+15,6 s** (novato: **+55,7 s**) | 4 | `src/cards.js:156-160` |
| 10 | Primera carta elegida | toca la carta; como completa receta, abre la ventana FUSIÓN | +0,9 s | 5 | `src/cards.js:198-211` |
| 11 | Primera fusión | "FUSIONAR YA" (conserva la carta inicial) | **+18,2 s** desde el combate (novato: +58,3 s) | 6 | `src/fusion.js:169` |
| 12 | Segunda oferta (Nv 3) | | novato: +109 s | | |

Totales [M]:
- Del final de la intro al combate: **2,2 s y 3 toques** (cota inferior del bot).
- De abrir el juego a la primera fusión: **50,6 s y 6 toques** (recolector) o **90,8 s y 6 toques** (novato).
- La primera oferta garantiza receta en las dos partidas (Dardo tóxico -> Gas inflamable; Daga -> Forja), como dice el README.
- Pantalla de fin por abandono (pausa -> ABANDONAR -> "¿SEGURO? TOCA OTRA VEZ"): 3 toques; volver a la aldea, 1 más.

Lo que el bot no mide [I]: cuánto tarda un humano en descubrir el botón PORTAL. En la captura de la aldea no hay flecha, texto ni NPC que lo señale; el único consejo está dentro del menú de Lanudo (Consejo -> "Sal al Portal, chaval...", `src/aldea.js:160`) y el "!" llama hacia Vesper, que no lleva al combate. Estimo de 10 a 60 s según el jugador; T-F1-01 lo medirá.

Validación de la cifra de 30 s del dueño: con el flujo de hoy se cumple solo si el jugador encuentra el Portal a la primera; con el flujo propuesto el camino es fijo y medible en pruebas. Propongo **dos criterios**: en pruebas automáticas, <= 1 toque y <= 6 s del fin de la intro al primer paso de combate; en analítica, p75 <= 15 s. La cifra de 30 s queda como alarma (p90).

### A.3 Legibilidad medida en el recorrido [M] (textcheck, 844x390)

| Pantalla | Texto más pequeño | Problemas |
|---|---|---|
| Intro | "Toca: avanzar" a 10 px lógicos = **7,2 px CSS** (`src/cine.js:281`) | por debajo del mínimo |
| Aldea, Portal, pausa | 12 px lógicos = 8,7 px CSS | 0 |
| Combate (inicio) | "NORMAL 9 min - botín x1" y nombre de carta "Chispa" a 10 px lógicos = 7,2 px CSS | 2 (es de T-F1-08) |
| Oferta Nv 2 | 12 | **"¡NIVEL 2! ELIGE UNA CARTA" se pisa con los chips "libre" de los poderes** (36 px de solape, visible en la captura) |
| Ventana FUSIÓN | 12 | 11-16 avisos de líneas pegadas: casi todos son textos de la oferta que quedan debajo del velo [I]; el que sí se ve es el título NIVEL 2 pisado |
| Fin (abandono) | 12 | **pista de teclado en táctil**: "B - forjar, encargos y anclas" (`src/base.js:146`). El regex de `tests.js:1117` no la detecta |
| Barra de XP | 4 px lógicos de alto (`src/hud.js:131-132`) = 2,9 px CSS | casi invisible: el novato no ve que las gemas llenan algo |

A 740x360 [M] los mismos problemas, todo un 8 % más pequeño: 12 px lógicos = 8,0 px CSS; los textos de combate de 10 px lógicos = 6,7 px CSS; el título NIVEL 2 se pisa también con el número flotante de daño ("49!"). Recorrido completo a 740x360 (recolector, intro impaciente): combate a 15,4 s de abrir el juego, primera oferta a 16,8 s de combate, primera fusión a 19,4 s.

### A.4 Problemas, por impacto

1. **[M+I] Tras la intro no hay camino.** La aldea enseña 7 NPC, 3 recursos, un "!" que no lleva a jugar y dos botones genéricos. El primer combate depende de descubrir PORTAL y después de tocar SALIR en un panel de 48 textos.
2. **[M] El novato tarda casi 1 minuto en ver su primera carta** (55,7 s frente a 15,6 s). Nadie le dice que recoja gemas; Lanudo le dice lo contrario ("tú solo esquiva"); la barra de XP mide 2,9 px CSS. Ese minuto es justo el "primer minuto plano" del diagnóstico. (El ritmo de las oleadas es T-F1-03; aquí solo se enseña a recoger.)
3. **[M] La ayuda de combate actual es una frase de jerga**: "Las cartas son infusiones. Fusiona dos etiquetas distintas para crear un PODER (hasta 4: usa sus botones)." (`src/hud.js:135-140`), 9 s, encima del jugador, antes de que exista ninguna carta, infusión ni poder.
4. **[M] Tras la primera fusión nadie señala el botón del poder.** Aparece "1,5" en el botón de abajo a la derecha (captura `09_tras_fusion`); en el fin de partida el poder Forja figura con "0 usos".
5. **[M] La pantalla de fin no empuja** (ver B.1).
6. **[M] Al volver a la aldea hay 3 marcas "!", un ladrido de Ulalume ("¿Guardamos un mazo?") y un aviso**: tras 25 s de juego se piden decisiones de mazo, encargos y forja a la vez.
7. **[M] Textos pequeños y solapes** de A.3.

### A.5 Flujo propuesto, pantalla a pantalla [P]

Un flag nuevo en el guardado lleva el estado: `Save.data.flags.fte = { v: 1, step, runs, hints: {}, priv }` (solo `flags`, sin subir la versión del guardado, como permite T-F1-02).

#### Pantalla 0. Título (sin cambios)
"TOCA PARA JUGAR". 1 toque. Criterio: igual que hoy.

#### Pantalla 1. Intro completa (sin cambios de contenido)
- Se ve entera y bloqueada la primera vez (decisión del dueño). Los toques siguen adelantando líneas y escenas (`src/cine.js:159-165`); no se quita.
- Único cambio: "Toca: avanzar" pasa de 10 a 12 px lógicos y de `rgba(200,190,220,0.55)` a `#b4a8c8` (`src/cine.js:281`).
- Si el jugador cierra el juego a mitad de la intro, al volver la intro empieza de nuevo pero con SALTAR (flag `fte.introTry = 1` al empezar; `first` en `src/cine_intro.js:170` pasa a ser `!introSeen && !fte.introTry`). Así nadie ve dos veces una intro bloqueada.
- Medido [M] (740x360, un toque cada 450 ms): la intro bloqueada se comprime de 26,9 s a **10,0 s con 21 toques**. El bloqueo solo quita el botón SALTAR; el impaciente ya la acorta él solo.

#### Pantalla 2. "Antes de salir": aviso de privacidad y salida directa (nueva)
El dueño quiere el aviso de privacidad al abrir el juego por primera vez, después de la cinemática. Propongo que esa tarjeta **sea a la vez el paso que lleva al combate**: cualquiera de sus dos botones lanza la primera expedición. Así el aviso no añade pasos: sustituye a los 3 toques de aldea y Portal.

- Cuándo: al terminar la intro (`onEnd` de `afterTitle`, `src/cine_intro.js:187-193`) si `!flags.fte.priv`. También aparece si se abre el juego sin haber terminado la primera expedición.
- Fondo: el último fotograma de la intro (fogata) oscurecido al 70 %, o la aldea desenfocada si no hay fotograma.
- Panel: x 150, y 70, 660x400 px lógicos, borde `#ffd27a`.
- Textos exactos (pendiente de que `monetization-analyst` cierre el texto legal de T-F1-01; esta es la versión de diseño):
  - Título, 24 px, `#ffd27a`, centrado en y 108: **"Antes de salir"**
  - Cuerpo, 15 px, `#e8e0f0`, izquierda en x 182, de y 150 a 260, interlineado 22: **"Guardamos tus partidas en este dispositivo. Si nos dejas, enviaremos también datos anónimos de juego (cuánto duras, dónde caes) para equilibrar el reto. Sin nombre, sin correo, sin anuncios personalizados. Puedes cambiarlo en Ajustes."**
  - Enlace, 13 px, `#9dd8ff`, subrayado, y 282: **"Leer el aviso completo"** (zona táctil 300x48 px lógicos; abre el texto completo en un panel con VOLVER).
- Botones, los dos del mismo tamaño y peso visual (sin patrón oscuro; consentimiento explícito):
  - Izquierda x 182, y 330, 290x68: **"ENVIAR DATOS ANÓNIMOS"**, subtítulo 12 px "y salir a la expedición".
  - Derecha x 488, y 330, 290x68: **"SOLO EN MI DISPOSITIVO"**, subtítulo 12 px "y salir a la expedición".
  - Mismo color de fondo (`#3a2f48`) y borde (`#ffd27a`) en los dos.
- Al tocar cualquiera: guarda `flags.fte.priv = 'on' | 'off'` y el interruptor de Ajustes, `fte.step = 'run1'`, y llama a `G.startGame()` con Bosque, Normal 9 min, Peligro I, ancla Chispa (los valores por defecto de hoy). No se pasa por la aldea.
- Si el envío está apagado o el aviso no se ha contestado, no sale ninguna petición de red (criterio de T-F1-01).
- Criterio: del fin de la intro al primer paso de `play`, 1 toque y <= 6 s en prueba automática.

#### Pantalla 3. Primera expedición con avisos integrados (cambia la ayuda de `src/hud.js:135-140`)
Bosque normal, sin cambios de dificultad (el reto no se toca; el ritmo lo ajusta T-F1-03). Se sustituye la ayuda inicial de dos líneas por **cuatro avisos de una línea**, uno cada vez, cada uno con condición de salida por acción (aprender haciendo).

Banda de aviso: x 230, y 74, 500x44 px lógicos, fondo `rgba(10,6,18,0.82)`, borde 2 px `#ffd27a`, icono de 28 px a la izquierda, texto 16 px `#ffffff` centrado. No tapa el temporizador (y < 60), ni la mano (abajo a la izquierda), ni los botones de poder (abajo a la derecha). Entra con un fundido de 200 ms; con "Reducir destellos" no parpadea ni late. Nunca pausa el juego.

| Id | Cuándo aparece | Texto exacto (táctil) | Texto (teclado) | Icono | Se cierra cuando | Tope |
|---|---|---|---|---|---|---|
| `move` | al empezar la 1.ª expedición | "Arrastra el pulgar a la izquierda para moverte" | "Muévete con WASD o las flechas" | pulgar | el jugador acumula 1,5 s de movimiento | 12 s |
| `gems` | al cerrarse `move`, si ya hay una gema en el suelo (si no, cuando caiga la primera) | "Recoge las gemas: llenan tu barra de nivel" | igual | gema | recoge 3 gemas | 15 s; reaparece una vez si a los 25 s de combate no ha subido de nivel |
| `pick` | en la 1.ª oferta (Nv 2), como subtítulo bajo el título de la oferta, 14 px `#ffe9a0` | "Elige una carta. Si pone FUSIÓN, crea un poder con tu mano" | igual | ninguno | elige carta | la oferta |
| `power` | justo al cerrar la ventana tras la primera fusión | "Tu poder está listo: tócalo (abajo a la derecha)" + anillo de 4 px `#ffd27a` alrededor del botón del poder | "Tu poder está listo: pulsa Q" | dedo | usa el poder o activa AUTO | 10 s |

Mientras está el aviso `gems`, la barra de XP pasa de 4 a 10 px lógicos de alto con el texto "NV 1" a 14 px; vuelve a 4 px cuando se cierra. (Que la barra sea siempre más alta es de T-F1-08.)

Cada aviso se ve como mucho una vez por cuenta (`flags.fte.hints[id] = 1`).

Además, en la 1.ª oferta, el título "¡NIVEL 2! ELIGE UNA CARTA" no debe pisar la fila de chips de poder "libre": baja el título a y 30 o esconde los chips "libre" mientras no haya ningún poder (es lo que medí como solape).

Cambio de texto en Lanudo (`src/aldea.js:160`): "Sal al Portal, chaval. Las cartas atacan solas: tú solo esquiva, y no corras en línea recta." pasa a **"Sal al Portal, chaval. Las cartas atacan solas: tú esquiva y recoge las gemas, y no corras en línea recta."**

#### Pantalla 4. Fin de la primera expedición
La pantalla de fin de la parte B con la variante "primera expedición" (B.4).

#### Pantalla 5. Aldea reducida, presentada por pasos
La aldea se ve por primera vez **al volver** de la 1.ª expedición. Los NPC aún no presentados no se dibujan ni se pueden tocar; su casa o puesto se queda con el cartel "VUELVO PRONTO" que ya existe en el arte del puesto. El HUD superior de la aldea solo muestra los recursos de los NPC presentes (encaja con T-F1-07).

| Llega tras... | NPC presentados | Aviso al entrar (toast de `flash`, texto exacto) | Por qué entonces |
|---|---|---|---|
| Salida 1 | Lanudo, Portal | "Lanudo quiere hablar contigo." Lanudo con "!" y una frase de bienvenida al hablarle: "Has vuelto entero. Eso ya es mucho. Las Brasas que traes sirven para forjar; pronto te presento a Grum." | lo mínimo: volver a salir |
| Salida 2 | + Grum (forja), + Vesper (encargos; activa el encargo tutorial `bombs`, `src/quests.js:21`) | "Grum ha encendido la forja. Vesper tiene un encargo para ti." | ya hay Brasas y 1 PF que gastar |
| Salida 3 | + Ulalume (Archivo y anclas), + Rufo (tienda) | "Ulalume abre su carpa. Rufo ha vuelto con mercancía." | ya hay cartas desbloqueadas que fijar y partes que vender |
| Salida 4 | + Tía Castaña (cocina) | "Tía Castaña tiene la olla al fuego." | el plato es una ayuda opcional |
| Vencer al Pastor | + Carapa (sin cambios, `src/aldea.js:228-237`) | (como hoy) | |

Reglas:
- Cada llegada se anuncia una vez y el NPC nuevo lleva "!" hasta la primera charla.
- El "!" de los NPC ya conocidos sigue como hoy.
- Si el jugador abandona la expedición antes de 60 s, esa salida no cuenta para presentar NPC (evita saltarse pasos abandonando).
- El Portal en las salidas 1-3: la sección PELIGRO solo aparece cuando hay más de un nivel abierto (`G.Save.pelMax(bid) > 1`); "COMPRAS Y PLATO" aparece cuando llegan Rufo o Castaña; "ENCARGO ACTIVO" con Vesper. El destino, el jefe y su debilidad ("El Pastor sufre más con Fuego y Acero") **se muestran siempre**: es información para superar el reto (regla 6).
- El Archivo de Ulalume sigue enseñando todo cuando llega (T-F1-07).

#### Criterios medibles de la primera sesión

| Métrica | Hoy [M] | Meta [P] | Cómo se mide |
|---|---|---|---|
| Fin de la intro -> primer paso de combate | 2,2 s y 3 toques (bot que sabe dónde tocar); humano sin medir | <= 6 s y 1 toque (prueba); p75 <= 15 s (analítica) | `fte` en tests y `intro_end` -> `run_start` |
| Combate -> primera oferta de carta | 15,6 s (recolector) / 55,7 s (novato) | recolector <= 20 s (ya cumple); novato <= 30 s (avisos + T-F1-03) | bot recolector y bot novato que obedece el aviso `gems` |
| Combate -> primera fusión | 18,2 s / 58,3 s; 2 toques desde la oferta | <= 25 s (recolector) y 2 toques | `fusion` con `t` |
| Primera fusión -> primer uso del poder | sin medir; en el fin de la partida, "0 usos" | <= 10 s | evento `power_use` |
| Abrir el juego -> primera fusión | 6 toques | 4 toques (título, privacidad, carta, FUSIONAR YA) | prueba `fte` |
| Pistas de teclado en táctil en el recorrido | 1 ("B - ...") | 0 | `kbdHints` ampliado |
| Texto < 12 px lógicos en menús del recorrido | 1 ("Toca: avanzar") | 0 | grupo `text` |

#### Cuentas existentes
- Al cargar un guardado: si `runs > 0` o `cine.introSeen === true`, se escribe `flags.fte = { v: 1, step: 'done', legacy: 1 }` y no cambia nada: aldea completa, Portal completo, sin avisos ni tarjeta de privacidad del flujo nuevo. (El aviso de privacidad para cuentas existentes lo decide T-F1-01: propongo un toast en la aldea con "Ver aviso", que no bloquea.)
- Cuenta con `introSeen` y `runs === 0` (vio la intro con la versión anterior y no jugó): se trata como nueva desde la pantalla 2.
- Interruptor de vuelta atrás: `?fte=0` (pruebas) y `G.B.fte = false` (código) devuelven el flujo antiguo.
- Probar con guardados v9, v10, v11 y v12 (riesgo citado en el plan).

#### Accesibilidad y legibilidad a 844x390
- Avisos de combate: 16 px lógicos (11,6 px CSS a 844x390; 10,7 a 740x360). Botones de la tarjeta de privacidad y de la pantalla de fin: 68 px lógicos de alto (49 px CSS a 844x390, 45 a 740x360).
- Ningún aviso depende del color: todos llevan icono y texto. El anillo del botón de poder lleva además el texto del aviso.
- "Reducir destellos": sin pulsos ni parpadeos en la banda ni en el anillo (el anillo queda fijo). "Reducir sacudidas": los avisos no sacuden nada.
- Contraste: blanco sobre `rgba(10,6,18,0.82)` > 15:1; `#ffe9a0` sobre el fondo de la oferta > 10:1.
- En táctil, ningún texto nombra teclas; en escritorio, sí (columna "teclado" de la tabla de avisos y `G.hint`).

#### Analítica necesaria (se añade al esquema de T-F1-01)
Todos con `t` (ms desde `session_start`), `taps` (toques acumulados en la sesión), `god` y `fte_v`.
- `session_start`, `title_tap`, `intro_end {skipped, ms, taps_in_intro}`, `privacy_choice {on|off, ms_on_screen}`.
- `run_start {n_run, biome, len, peligro, from: 'fte'|'portal'|'retry'}`.
- `hint_shown {id}`, `hint_done {id, ms, by: 'action'|'timeout'}`.
- `level_up {lvl, runT}`, `card_pick {lvl, fused}`, `fusion {id, runT}`, `power_use {id, n}` (solo el primero de cada poder).
- `run_end {cause: 'death'|'quit'|'win', runT, biome, peligro, lvl, top_src}`.
- `end_screen {kind, goal_ids, record_new, ms_on_screen, choice: 'again'|'aldea'|'detail'}`.
- `aldea_open {n_run, npcs_visible}`, `npc_intro {id}`, `quit_point {state}` al ocultarse la página.
El embudo de antes y después: `session_start -> intro_end -> privacy_choice -> run_start -> level_up(2) -> fusion -> run_end -> end_screen.choice -> run_start(2)`.

---

## B) Pantalla de fin (T-F1-04)

### B.1 Estado actual [M]

Captura `11_fin_abandono.jpg` (abandono a los 25 s, primera partida, 844x390). Código: `src/base.js:50-146`.
- Arriba "HAS CAÍDO" (38 px), también al abandonar: `endTitle` no distingue abandono de muerte (`src/base.js:50-52`; `G.finish(false)` en los dos casos, `src/hud.js:173`).
- "Tiempo 00:25 - Kills 28 - Nivel 2": "Kills" en inglés.
- Izquierda: mano final (5 huecos, 4 vacíos), "PODERES: Forja Nv1, 0 usos".
- Derecha: "BOTÍN (+2 partes)", "+10 Brasas total 10", "Prob. de Esencia rara: 1.2%", "Duración Normal (9 min): partes y Brasas x1", "PF libres 1 - nodos comprables 0".
- Botones: "REINTENTAR MISMO BUILD / anclas: Chispa" (naranja) e "IR A LA ALDEA / B - forjar, encargos y anclas" (azul), del mismo tamaño.

Problemas:
1. No hay ningún objetivo: ni récord, ni "te falta poco", ni por qué has caído. Es la hoja del botín.
2. Dos botones del mismo peso: no hay acción principal. "BUILD" es jerga en inglés.
3. Pista de teclado en táctil: "B - forjar, encargos y anclas".
4. Abandonar y morir se ven igual.
5. Jerga sin explicar en la 1.ª partida: "Esencia rara", "PF", "nodos comprables".
6. El 60 % de la pantalla de la primera partida está vacía (cartas vacías, panel de botín casi vacío).
7. [M] Derrota por muerte y victoria del Pastor a 844x390 y 740x360: 0 solapes en textcheck, pero las cuatro muestran "B - forjar, encargos y anclas" en táctil. En la victoria, "¡PELIGRO II DESBLOQUEADO!" (el mejor gancho para volver) va en 13 px dentro de la lista del botín, a la misma altura visual que "Duración Normal (9 min)". La derrota por muerte en la 1.ª partida es idéntica al abandono salvo las cifras.

### B.2 Datos que ya existen y datos nuevos
Existen: `L.summary` (partes, Brasas, PF, cartas nuevas, encargo, jefe con `hpFrac`, partes rotas, trofeos, desbloqueo de Peligro: `src/loot.js:220-261`), `S.runs`, `S.wins`, `S.lossStreak` (`src/loot.js:249-252`), `hunts[jefe][P].best` (`src/loot.js:239`), progreso de encargo (`G.Quests.progress`, `src/quests.js:133-140`), `G.Tree.availableCount/pfFree`.
Nuevos [P]:
- `S.stats.best[bioma] = { t, bossPct, lvl, kills }`: mejor tiempo sobrevivido en expedición normal por bioma, mínima vida del jefe (0 = vencido) y nivel. Solo `mode === 'run'` y sin `god` (las partidas inmortales no ponen récords).
- Contador de daño recibido por fuente siempre activo, por expedición: hoy solo existe con `?dbg=1` (`src/main.js:172`, `src/player.js:42`). Se guarda solo en memoria (`L.run.dmgBy`), no en el guardado.
- `G.Tree.nearest()`: el nodo comprable más cercano y lo que falta (recurso y cantidad).

### B.3 Diseño propuesto (960x540 px lógicos)

Jerarquía: 1) qué ha pasado, 2) qué te falta para lo siguiente, 3) botón OTRA EXPEDICIÓN con ese objetivo, 4) lo ganado en dos líneas, 5) aldea y detalle como secundarios.

```
y  0 ┌──────────────────────────────────────────────────────────────────────────┐
   │                 HAS CAÍDO  (34 px, centrado, y 34)                        │
   │   Bosque  ·  Normal 9 min  ·  04:12  ·  128 bajas  ·  Nivel 7  (15 px, y 68)│
y 88├────────────── IZQUIERDA x 20, w 450 ─────────┬──── DERECHA x 490, w 450 ──┤
   │ TU MARCA EN EL BOSQUE         (13, y 104)    │ LO GANADO        (13, y 104)│
   │ ¡Nuevo récord! 04:12 (antes 03:05) (20,y 132)│ +14 partes  ·  +60 Brasas    │
   │ [barra 410x12: 04:12 / 07:30 Pastor] (y 156) │   (16, y 132)               │
   │                                              │ +1 Punto de Forja (16,y 156)│
   │ TE FALTA POCO                 (13, y 190)    │ [mini cartas nuevas 46x50, │
   │ ◆ Encargo: Zarzales mayores 14/20 (14,y 216) │  y 176-226, solo si hay]    │
   │   [barra 300x10]              (y 234)        │ Toca para ver el botín      │
   │ ◆ Forja: Rango II, faltan 8 Hebras (14,y 262)│  completo (12, y 244)       │
   │   [barra 300x10]              (y 280)        │ (todo el panel 450x170 es   │
   │                                              │  zona táctil -> DETALLE)    │
   │ CONSEJO                       (13, y 312)    │ TU MANO  (13, y 280)        │
   │ Te tumbaron los Zarzales: aléjate cuando     │ [5 mini cartas 52x58, y 292]│
   │ abran su abanico.        (14, y 336-356)     │ Poderes: Gas Nv1 (12 usos)  │
   │                                              │  (12, y 368)                │
y444├──────────────────────────────────────────────┴─────────────────────────────┤
   │ [OTRA EXPEDICIÓN  x 20 y 456 w 600 h 68]      [ALDEA x 636 y 456 w 304 h 68]│
   │  22 px; subtítulo 13 px con el objetivo 1      18 px; subt. 12 "forja y     │
   │                                                encargos" (si hay NPC)      │
y540└──────────────────────────────────────────────────────────────────────────┘
```

Reglas de disposición:
- Todo texto >= 12 px lógicos; títulos de bloque 13 px `#b4a8c8`; contenido 14-16 px; cifras clave 20 px.
- Columnas fijas; una línea que no cabe se envuelve como mucho en 2 líneas y se recorta con "..." (`wrapLines`, `src/base.js:44-49`).
- Botón principal: naranja (`#c8641e`, borde `#ffd27a`), 600x68. Secundario: `#2a3a5a`, 304x68. El principal está a la izquierda, al alcance del pulgar izquierdo; el secundario a la derecha.
- Un toque en el panel LO GANADO abre la vista DETALLE = el panel de botín actual (`src/base.js:98-141`) con un botón VOLVER (304x68). Nada de la información de hoy se pierde: se ordena.
- Teclado (solo escritorio, con `G.hint`): Enter/R = otra expedición, B/Esc = aldea, D = detalle. En táctil no aparece ninguna tecla.
- El botón principal ignora toques durante los primeros 600 ms (evita el toque accidental del dedo que seguía en el joystick al morir).

Textos de OTRA EXPEDICIÓN (título fijo **"OTRA EXPEDICIÓN"**; el subtítulo es el objetivo número 1, máximo 44 caracteres):
- "Objetivo: llega al Pastor (07:30)"
- "Objetivo: supera tu récord de 04:12"
- "Objetivo: deja al Pastor por debajo del 34 %"
- "Objetivo: Zarzales mayores 14/20"
- "Objetivo: vence al Pastor en Peligro II"
En cacería y asalto el título pasa a "OTRA CACERÍA" / "OTRO ASALTO" (como hoy) y en práctica "REINICIAR PRÁCTICA" con su panel de fases actual (sin la frase "teclas 1-3" en táctil, `src/base.js:154`).

#### Elección de objetivos ("TE FALTA POCO")
Se calculan candidatos y se muestran los 2 primeros por este orden de prioridad, saltando los que no se puedan cumplir en 1-2 partidas (estimación: lo que falta / lo ganado en esta partida <= 2; si esta partida ganó 0, se usa la media de las 3 últimas):
1. Expedición sin llegar al jefe: "Llega al Pastor: aparece a las 07:30" (barra runT / BOSS_T).
2. Llegó al jefe y perdió: "Deja al Pastor por debajo del 34 %" (barra 1 - hpFrac).
3. Encargo activo: "Encargo: <label> <prog>/<goal>".
4. Nodo de forja más cercano: "Forja: <nombre>, faltan <n> <recurso>".
5. Carta por forjar más barata: "Carta: <nombre>, faltan <n> <recurso>".
6. Peligro siguiente tras una victoria: "Vence al <jefe> en Peligro <N+1>".
7. Respaldo (siempre existe, garantiza el criterio "al menos un objetivo"): "Supera tu récord de <mm:ss>" o, sin récord, "Aguanta hasta las <mm:ss + 1:00>".

#### Consejo según la causa
Fuente con más daño recibido en la expedición (`L.run.dmgBy`). Tabla de 1 línea por fuente (texto exacto lo completa `game-designer`; ejemplos):
- `fanner` (Zarzal mayor): "Te tumbaron los Zarzales: aléjate cuando abran su abanico."
- contacto genérico: "Te rodearon: muévete en círculos amplios, no en línea recta."
- jefe: "El <jefe> pega fuerte en <ataque>: mira el suelo, avisa antes."
- sin datos: "Recoge gemas: cada nivel es una carta más."
Si murió con un poder sin usar ("0 usos"), ese consejo gana: "Tenías Gas sin usar: tócalo en cuanto se cargue."

### B.4 Variantes

| Caso | Título (color) | Línea 2 | Bloque izquierdo | Botones |
|---|---|---|---|---|
| Primera expedición (cualquier final) | "PRIMERA EXPEDICIÓN" `#ffd27a` | igual | "TU MARCA EN EL BOSQUE: 04:12" (sin "nuevo récord"), "TE FALTA POCO" con 1 objetivo (llegar al Pastor), consejo | OTRA EXPEDICIÓN y **"VOLVER A RESCOLDO"** (subtítulo "Lanudo quiere hablar contigo"). Sin jerga de Esencia ni PF en LO GANADO: "+2 partes · +10 Brasas" y "Las Brasas sirven para forjar en Rescoldo." |
| Derrota por muerte | "HAS CAÍDO" `#ff6a6a` | | completo | OTRA EXPEDICIÓN / ALDEA |
| Abandono | **"EXPEDICIÓN ABANDONADA"** `#e0b8c8` | + "Conservas las partes recogidas." | récord no se actualiza (no cuenta como intento de récord); objetivos sí | igual |
| Victoria (normal) | "MANO GANADORA" `#ffd24a` | "<jefe> vencido en mm:ss" | "TU MARCA": tiempo de pelea y "¡Nuevo récord!" si lo es; objetivo 1 = Peligro siguiente o bioma nuevo ("Se abre la Cripta: Karceron te espera") | OTRA EXPEDICIÓN (subtítulo con el destino nuevo si se abrió) / ALDEA |
| Récord nuevo (cualquier caso) | la línea del récord en `#9dffb4` con la etiqueta de texto "¡Nuevo récord!" (no solo color) | | | |
| Cuenta completa (nada que desbloquear) | | | objetivos 6-7 (Peligro, récord) | |
| Práctica | como hoy (`src/base.js:148-155`) sin la frase de teclas en táctil | | | |
| Victoria final (Cenizar) | sin cambios: va primero el epílogo (`src/main.js:427-433`) | | | |
| Partida inmortal (`G.god`) | igual, pero sin récords: la línea dice "Modo de pruebas: sin récord" en 12 px `#9a8fb0` | | | |

### B.5 Criterios de aceptación
- Tras cualquier derrota, abandono o victoria hay al menos 1 objetivo visible, y su texto está también en el subtítulo de OTRA EXPEDICIÓN.
- Todo texto >= 12 px lógicos; 0 solapes, desbordes y pistas de teclado en táctil (grupo `text`) a 844x390 y 740x360.
- Botones >= 68 px lógicos de alto.
- La información del botín de hoy sigue accesible en DETALLE.
- El toque en OTRA EXPEDICIÓN no se acepta antes de 600 ms.

---

## C) Para el programador

### C.1 Cambios por archivo
- `src/save.js`: `flags.fte` (sin subir versión); al cargar, marcar `legacy` si `runs > 0 || cine.introSeen`. `stats.best` dentro de `stats` (ya existe `stats.playMs`, `src/save.js:39`): crear con `|| {}`.
- `src/cine_intro.js`: `afterTitle` (`:187-193`): si `fte.step !== 'done'` y `!fte.priv`, al acabar la intro abrir la tarjeta de privacidad en lugar de ir a la aldea. `fte.introTry` para que el segundo intento sea saltable (`:170`).
- `src/cine.js:281`: "Toca: avanzar" a 12 px y color `#b4a8c8`.
- **Nuevo** `src/fte.js`: tarjeta "Antes de salir", avisos `move/gems/pick/power` (estado, condiciones, dibujo de la banda), calendario de NPC por salida, `?fte=0`. Añadir al precache de `sw.js` (el grupo `iso` lo comprueba).
- `src/hud.js:135-140`: quitar la ayuda de dos líneas cuando `fte` está activo (dejarla para `legacy`); llamar a `G.Fte.drawHint`. Barra de XP alta durante `gems` (`:131-132`).
- `src/cards.js`: subtítulo `pick` en la 1.ª oferta; título NIVEL que no pise los chips "libre".
- `src/fusion.js`: aviso `power` tras la primera fusión y anillo en el botón; evento `power_use`.
- `src/aldea.js`: `NPC_ORDER` filtrado por `G.Fte.npcVisible(id)` en `ints()` y en el dibujo; toasts de llegada; texto de Lanudo (`:160`).
- `src/panels.js`: secciones del Portal condicionadas (Peligro, compras/plato, encargo).
- `src/player.js:42`: contador `dmgBy` siempre activo en `L.run` (sin tocar `G.dbg`).
- `src/loot.js`: `endRun` guarda `stats.best[bioma]` (no si `G.god`, no si abandono) y deja en `summary` `record: { prev, now, isNew }`, `goals: [...]`, `tip`, `quit: bool`.
- `src/main.js`: `G.finish(won, cause)` con `cause = 'quit'` desde la pausa (`src/hud.js:173`).
- `src/base.js`: nuevo `drawEnd` (B.3) con vista DETALLE = el panel actual; botones y teclas nuevas; quitar "B - ..." en táctil; "Kills" -> "bajas"; "BUILD" desaparece.
- `src/tree.js`: `T.nearest()`.
- `src/quests.js`: lectura del encargo activo para objetivos (sin cambios de reglas).
- Analítica: llamadas a `G.Track` (T-F1-01) en los puntos de A.5.

### C.2 Pruebas nuevas en `tools/card-swarm-bot/tests.js`
Grupo **`fte`** (cuenta nueva con `?cine=1`, 844x390 táctil, `speed=0` y `G.step` cuando sea posible):
1. La intro se reproduce completa y bloqueada la primera vez (sin SALTAR).
2. Al acabar la intro aparece la tarjeta de privacidad; ningún `fetch`/`sendBeacon` antes de contestarla.
3. Cualquiera de sus dos botones llega a `play` en 1 toque; Bosque, Normal 9, Peligro I.
4. Con "SOLO EN MI DISPOSITIVO", 0 peticiones de red en toda la expedición.
5. Los avisos `move`, `gems`, `pick`, `power` se muestran en orden, una sola vez, y se cierran por acción.
6. Al recargar a mitad de la 1.ª expedición, no se repiten avisos ya vistos.
7. Al volver de la salida 1 solo se pueden tocar Lanudo y el Portal; tras la 2, Grum y Vesper; tras la 3, Ulalume y Rufo; tras la 4, Castaña.
8. Abandonar antes de 60 s no adelanta NPC.
9. Guardados v9, v10, v11 y v12 con progreso: `fte.legacy`, aldea completa, sin tarjeta ni avisos.
10. `?fte=0` restaura el flujo antiguo.
11. Tiempos: de `intro_end` a `run_start` <= 6 s; bot recolector: primera oferta <= 20 s y primera fusión <= 25 s de combate.
12. Segundo arranque tras cerrar a mitad de la intro: la intro es saltable.

Grupo **`end`** (8 del plan + 3):
1. Récord nuevo: `stats.best` se actualiza y aparece "¡Nuevo récord!".
2. Abandono: título "EXPEDICIÓN ABANDONADA" y el récord no cambia.
3. Partida con `god`: no escribe récord.
4. Sin objetivos de progreso (cuenta completa con `all=1`): aparece el respaldo 7.
5. Encargo activo a 14/20: aparece como objetivo con su barra.
6. Primera expedición: variante con "VOLVER A RESCOLDO".
7. Práctica: panel de práctica sin "teclas" en táctil.
8. Victoria con desbloqueo de bioma: el subtítulo nombra el destino nuevo.
9. El botón principal no responde antes de 600 ms.
10. DETALLE muestra el panel de botín completo y VOLVER regresa.
11. Consejo por causa: con daño forzado de `fanner`, aparece la línea de los Zarzales.

Grupo **`text`**: añadir las pantallas nuevas (tarjeta de privacidad, banda de aviso, fin en sus 6 variantes) a 844x390 y 740x360, y ampliar `KBD_RE` (`tests.js:1117`) para cazar "B  -" y "D  -" al principio de un subtítulo.

### C.3 Riesgos
- Migración de cuentas: un error en la detección de `legacy` escondería NPC a un jugador con progreso. Mitigación: prueba 9 de `fte` y la regla "ante la duda, legacy".
- El aviso de privacidad es texto legal: el de esta especificación es de diseño; el definitivo lo cierra `monetization-analyst` con revisión profesional (pendiente en T-F1-01).
- Saltar la aldea antes de la 1.ª partida esconde a Lanudo y su historia hasta la vuelta; la intro ya cuenta lo esencial.
- El objetivo "llegar al Pastor" puede frustrar si el Bosque es demasiado duro para un novato; es el reto que pidió el dueño, y T-F2 lo calibra.
- `src/fte.js` y los avisos tocan el HUD que T-F1-08 va a ensanchar: anclar la banda al centro de `G.W`, no a 480.

### C.4 Decisiones del dueño (3 preguntas)
1. **¿La primera expedición sale directamente tras la intro, sin pasar por la aldea?** Recomiendo que sí: el aviso de privacidad es el único paso intermedio y la aldea se descubre al volver. Alternativa: aldea con solo Lanudo y el Portal antes de salir (cuesta unos 10-20 s y 2 toques [I]).
2. **Criterio de tiempo**: propongo cambiar "menos de 30 s del final de la intro al primer enemigo" por "1 toque y <= 6 s en prueba; p75 <= 15 s en analítica", con 30 s como alarma. ¿De acuerdo?
3. **Aviso de privacidad con dos botones que llevan los dos a jugar** ("ENVIAR DATOS ANÓNIMOS" / "SOLO EN MI DISPOSITIVO"), del mismo tamaño y color. ¿Te parece bien que la elección sea a la vez el "empezar"? Recomiendo que sí: no alarga el camino y es una elección explícita.

---

## Capturas
Antes (fuera del repo, JPEG): `/tmp/claude-0/-home-user-Game/ac8df0e6-87e6-5837-9d6a-fa8dcc4300ed/scratchpad/fte/` -> `pasivo/` (844x390, novato), `gemas/` (844x390, recolector, con abandono y vuelta a la aldea), `imp740/` (740x360, intro impaciente), `ends/` (muerte y victoria en los dos tamaños).
Pendiente: capturas de después, tras implementar.
