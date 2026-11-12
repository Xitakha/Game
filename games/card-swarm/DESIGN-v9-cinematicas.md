# Swarm Hand - Diseño v9: Cinemáticas (intro, entradas de jefe, victoria y cierre)

Estado: PLAN, sin código. Autor: director de cinemáticas y animación. Parte de `README.md`, `DESIGN-v7-jefe-final.md` (lore de Cenizar), `DESIGN-v4-jefes.md` (intro de 3,5 s, tabla 2.2), `DESIGN-v5-biomas.md`, `DESIGN-v3-aldea.md`, `src/ending.js`, `src/boss.js` (+ `boss_*.js`), `src/main.js`, `src/save.js`, `ASSETS_API.md`.
Todas las cifras de tiempo son punto de partida para ajustar con el dueño y con QA. Marcado **[PROPUESTA DE LORE]** = lo inventa este documento y necesita aprobación del dueño.

---

## 0. Resumen en una pantalla

| Punto | Decisión recomendada |
|---|---|
| Técnica | **Motor propio en canvas (`G.Cine`)**, no vídeo. 0 bytes de binarios, funciona offline en la PWA, mismo arte procedural, saltable, con subtítulos nativos |
| Piezas | A) Intro 45-55 s, 8 viñetas, 1.ª vez + repetible. B) Entradas de jefe: se queda la intro in-world de `boss.js` (ya existe, 3,5 s) y se le añade una capa `G.Cine` (tarjeta, cámara, subtítulo de 1 línea); versión larga 1.ª vez (~4,5 s), corta después (~1,6 s); Cenizar tiene prerrollo propio de ~6 s. C) Cierre: victoria in-world (6 s) + epílogo en el Hogar (~35 s) + créditos (~25 s) + aldea cambiada |
| Reutiliza de `ending.js` | `Assets.drawEndingScene`, `Assets.drawCredits`, pistas `cenizar_ending` / `cenizar_credits`, jingles y `ending_hearth`, la idea del diálogo. Se rehace el control de flujo (no pausa, destello blanco a pantalla completa, créditos con nombres de agentes, faltan Carapa y Rufo, la aldea nunca cambia) |
| Simulación | Las cinemáticas son SOLO dibujo + audio. Nunca llaman a `G.rng`, nunca avanzan `G.time` / `G.runT`, nunca tocan HP, fases ni `cadT` |
| Bots / pruebas | `?cine=0` apaga todo; `?direct=1`, `?boss=`, `?hunt=`, `?assault=`, `?practice=1` lo apagan por defecto salvo `?cine=1` |
| Guardado | v11 -> **v12**: `Save.data.cine = {introSeen, entrySeen{}, epilogueSeen, creditsSeen}` y `settings.cine`. `bossSeen` y `endingSeen` se mantienen |
| Esfuerzo | ~28 días de un flujo; ~19-21 con arte y audio en paralelo (sección 12) |
| Orden | Motor + intro -> entradas de jefe -> cierre y aldea -> pulido y accesibilidad |

---

## 1. Guion: INTRO (viñetas 1-8)

**Marco narrativo:** la cuenta Lanudo, el abuelo carnero ("repite historias", ya es el lore-NPC de la aldea), junto a la fogata de Rescoldo, de noche. Es la voz del narrador: no hace falta locución, salen globos de texto con máquina de escribir. **Marlo no habla** (jugador silencioso, globos de estilo 1 solo para narración). Tono: cuento junto al fuego, cálido y algo melancólico, con humor suave en los NPC (Vesper irónica, Castaña maternal). Duración objetivo 45-55 s con texto que avanza solo y se acelera con un toque.

Lore ya existente que se respeta: Rescoldo es "la última aldea del rebaño que el Pastor Corrupto no quemó"; Marlo es un corderito con bufanda de brasa; el Pastor "era el mejor de nosotros" (Lanudo); Cenizar es la brasa que se negó a apagarse, prendió el cayado del Pastor, despertó a Karceron, envenenó el río de Letea, heló a Yarlak y enloqueció a la Reina; el Hogar Quemado es lo que arrasó (v7); Yarlak guardaba "la última hoguera del norte"; Melaria devoró la jalea de sus hermanas.

**Hueco de lore y propuesta mínima [PROPUESTA DE LORE]:** el juego nunca explica por qué Marlo y por qué su bufanda es "de brasa". Propuesta: Marlo nació la noche del incendio y su bufanda guarda **una brasa mansa** (arde sin quemar), la única llama que el Incendio Primero no consiguió contagiar. Es el contrapunto de Cenizar (la brasa que se negó a apagarse frente a la brasa que no quema), da sentido al final (Marlo reenciende el brasero con SU brasa) y a que sea él quien pueda "apagar las seis llamas". No obliga a cambiar nada existente. Si el dueño prefiere no tocar el origen de Marlo, las viñetas 6 y el epílogo se reescriben sin la brasa mansa (alternativa en la sección 14).

| # | Viñeta | Imagen y cámara | Texto (borrador, español) | s |
|---|---|---|---|---|
| 1 | Fogata de Rescoldo (noche) | Plano abierto de la aldea, Lanudo y Marlo junto a la fogata; push-in lento hacia Lanudo. Estrellas con paralaje | LANUDO: "Siéntate, Marlo. Te voy a contar por qué esta aldea huele a ceniza." | 5 |
| 2 | El Hogar de antes (flashback cálido, tono ámbar) | La casa grande de la aldea con la chimenea encendida, siluetas de Grum, Castaña, Vesper, Ulalume; el Pastor pastoreando fuera. Pan horizontal | "Antes teníamos un Hogar. Una chimenea que jamás se apagaba y un Pastor que cuidaba de todos." | 6 |
| 3 | La brasa | Primer plano de la chimenea; una sola brasa salta, se niega a apagarse, el color vira de ámbar a naranja sucio. Cámara se acerca; música baja a un bordón | "Esa noche una brasa no quiso apagarse. Y lo que no se apaga... acaba por devorarlo todo." | 6 |
| 4 | Los cinco rescoldos | Cinco viñetas en fila (panel que se desplaza), cada una con silueta + color: el Pastor (morado, cayado), Karceron (naranja, cripta), Letea (turquesa, río), Yarlak (azul-blanco, nieve), Melaria (ámbar, panal). Cada panel enciende una chispa = 1 nota del leitmotiv (las 5 notas de `stg_cenizar_intro`) | "Prendió el cayado del Pastor. Despertó al Carcelero. Envenenó el río. Heló al gigante del norte. Y enloqueció a la Reina." | 9 |
| 5 | Rescoldo, lo que queda | Pan por la aldea en ruinas: Grum golpeando, Vesper escribiendo, Ulalume barajando, Castaña con la olla, Rufo contando monedas. Sprites reales de `Assets.drawNPC` | LANUDO: "Solo resistimos aquí. Un brasero apagado, un yunque, una olla... y unas cartas que ya no sabemos leer." | 7 |
| 6 | La bufanda | Primer plano de Marlo; la brasa mansa de su bufanda late en el color de la fogata; Lanudo señala. Cámara a Marlo, luz cálida | "Y entre las cenizas apareció un corderito con una bufanda que ardía sin quemar. Tú." | 6 |
| 7 | Las cartas | Ulalume baraja; las cartas flotan y se fusionan (guiño a la mecánica: dos iconos se funden en uno); Vesper guiña, Grum asiente | ULALUME: "Junta tus cartas, funde sus poderes. Un solo golpe no basta: hace falta un enjambre." VESPER: "Y volver de una pieza." | 7 |
| 8 | El Portal | Marlo camina al Portal (arco de piedra con brasas girando); se enciende. Plano de las seis llamas lejanas (cinco de colores + una blanca, Cenizar). Corte al título | Título: **SWARM HAND** y subtítulo "Apaga las seis llamas." | 6 |

Total ~52 s; con el texto acelerado por toques, 35-40 s. Reglas de texto: máx. 2 líneas de 38 caracteres en 844x390; fuente >= 14 px; máquina de escribir a 32 caracteres/s con un "bip" por palabra, no por letra (menos ruido); un toque completa la línea, otro avanza.

---

## 2. Técnica: motor propio vs vídeo (evaluación honesta)

| Criterio | Vídeo pregrabado (MP4/WebM) | Motor propio en canvas (`G.Cine`) |
|---|---|---|
| Peso en repo y despliegue | 40-60 s a 844x390 ~ 2-6 MB por vídeo (más si se quiere buena calidad). El repo hoy no tiene binarios: todo es código. Cada cambio de guion = re-renderizar y re-subir | ~60-90 KB de JS en total (6 archivos). Un cambio de texto es un diff de una línea |
| PWA offline / precache | Hay que meterlo en el precache del SW (`stamp.py` solo lista scripts) o falla offline; peso a cada actualización | Va en el precache normal |
| Móvil | Decodificador de hardware, pero WebM no es universal en Safari/iOS antiguo y MP4 H.264 exige otro códec; autoplay/inline con gestos; pantallas con notch y relación 844x390 pueden recortar | Mismo canvas 960x540 que el juego, mismo escalado; sin dependencias del códec |
| Estilo | Habría que renderizarlo FUERA de línea: el arte es procedural en tiempo de ejecución, así que se grabaría el canvas (MediaRecorder) y se perdería calidad y control | Usa los mismos `Assets.*` y música WebAudio: coherencia total |
| Saltar / pausar / accesibilidad | Se puede saltar, pero subtítulos incrustados no son configurables, sin "reducir destellos" | Texto real (subtítulos siempre), destellos y sacudidas obedecen a `G.shakeMul` y a un nuevo ajuste, pausa exacta |
| Localización y mantenimiento | Un vídeo por idioma | Texto en un array |
| Riesgo | Memoria y buffering en móviles de gama baja; audio del vídeo vs WebAudio del juego | Coste de dibujo (se acota en la sección 3) y trabajo de arte de fondos |

**Recomendación: motor propio.** Excepción: si el dueño quiere un vídeo "de tráiler" con calidad cinematográfica real (renderizado de otra herramienta), eso sería un proyecto aparte, no encaja con un estudio cuyo valor es el arte 100 % procedural. No se recomienda MediaRecorder para "grabar" el motor: no aporta nada y pesa.

Referencia de coste: `drawVillage` ~5 ms por frame en Chromium sin GPU; `drawBoss` de Cenizar ~5 ms. Una escena de cine con 4-5 capas horneadas + 2-3 sprites + texto debe costar <= 3 ms; presupuesto duro 6 ms/frame (probado con `?perf=1`).

---

## 3. El mini motor: `G.Cine` (`src/cine.js`)

### 3.1 Principios
1. **Draw-only.** `G.Cine` no importa nada de la simulación ni la modifica: no llama a `G.rng`, no avanza `G.time`, no toca HP, fases, `cadT` ni `bossSeen`. Lo que necesita de afuera (jugador, jefe) lo lee.
2. **Determinista.** Su reloj avanza solo con el `dt` fijo del juego (`G.STEP`) en `update(dt)`; nada de `Date.now`/`performance.now`. Su azar (estrellas, chispas, jitter) sale de un mulberry32 propio sembrado con el id del guion (`G.Cine.rng(id)`), nunca de `G.rng` ni de `Math.random` (el cosmético sigue pudiendo usar `G.rndFx`).
3. **Dos modos.** `full` (estado `G.state = 'cine'`: la cinemática manda, el mundo no corre: intro, epílogo, créditos, prerrollo de Cenizar) y `overlay` (se dibuja encima del mundo congelado por `G.frozen`: entradas de jefe, victoria).
4. **Datos, no código.** Un guion es una tabla de pistas; las escenas especiales son funciones de dibujo registradas por id.
5. **Siempre saltable, siempre pausable.**

### 3.2 Contrato (tentativo)
```
G.Cine.play(script, { mode:'full'|'overlay', first:bool, short:bool, onEnd(reason), onSkip() })
  reason = 'end' | 'skip' | 'off'
G.Cine.update(dt)  G.Cine.draw(ctx)  G.Cine.active()  G.Cine.skip()  G.Cine.pause(bool)
G.Cine.off            // true con ?cine=0: play() llama a onEnd('off') al instante, sin dibujar
G.Cine.rng(id)        // PRNG propio
```
Un `script` = `{ id, len, scenes:[...], tracks:[...], subs:true }` con estas pistas, cada una con `at` (ms) y, si procede, `dur`:

| Pista | Qué hace |
|---|---|
| `scene {id, layers[], size}` | Fondo en capas con factor de paralaje (0 = fijo, 1 = sigue la cámara). Se hornea UNA vez a un canvas fuera de pantalla al empezar la escena y se libera al acabar (máx. 3 canvases vivos, ~2 MB cada uno) |
| `cam {x,y,zoom,from,to,ease}` | Cámara por claves (pan / push-in). Sin rotación. Con "reducir movimiento" el pan se convierte en fundido cruzado |
| `tween {target,prop,from,to,ease}` | Interpola cualquier propiedad numérica (alfa, posición, escala). Easings: lineal, easeInOut, easeOutBack, easeOutCubic |
| `actor {id, draw, x, y, z}` | Sprite o dibujo (`Assets.drawNPC`, `drawMarloPose`, siluetas) con capa por `z` |
| `dlg {who, text, voice, hold}` | Globo de diálogo con `Assets.drawBubble`, retrato opcional, máquina de escribir; un toque completa la línea y otro avanza |
| `title {text, sub}` | Cartel centrado (nombre de jefe, "SWARM HAND") |
| `sfx {name,vol,pitch}` / `music {track,intensity}` / `stinger {name}` | Audio. Si falta el recurso, silencio (como ya hace `ending.js`) |
| `flash {color,a,ms}` | Destello; pasa por el filtro de accesibilidad (3.4) |
| `shake {amp,ms}` | Delega en `G.fx.shake` (ya respeta `G.shakeMul`) |
| `letterbox {in,out,bar}` | Barras de cine (ya existen en `boss.js`: 48 px) |
| `fade {from,to,color}` | Fundido |

### 3.3 Entrada, salto y pausa
- **Saltar:** botón SALTAR visible arriba a la derecha (>= 88x40 px lógicos, zona de toque cómoda) y tecla Esc. Un toque en el resto de la pantalla = avanzar línea (en `full`) y NO salta, para que no se pierda una cinemática por un toque accidental. Tras el salto: `onEnd('skip')`, la música vuelve a la pista del contexto, el audio de la cinemática se corta con un fundido de 150 ms.
- Entradas de jefe (`overlay`): cualquier toque / Espacio / Enter tras 800 ms salta (hoy solo si ya vista y tras 1 s); sin botón visible, sólo la pista pequeña "Toca para saltar" (ya existe).
- **Pausa:** `visibilitychange` (hidden) y `blur` ponen `G.Cine.pause(true)` (hoy el `blur` solo pausa el estado `'play'`, no el `'ending'`: bug a corregir también para `ending.js`). Se detiene el reloj y se silencia la música; al volver aparece "TOCA PARA CONTINUAR" y se reanuda desde el mismo `t`.
- `step()` de `main.js` gana un `case 'cine': G.Cine.update(dt)` y el dibujado un `if (G.state === 'cine')`. En `overlay`, `boss.js` llama a `G.Cine.update/draw` desde su propio `updIntro`/`drawIntro`, sin tocar `G.state`.

### 3.4 Accesibilidad (ajustes nuevos, en AJUSTES)
- **Subtítulos:** siempre activos (el diálogo ES texto). Opción "Descripción de sonidos" (por defecto ON en las cinemáticas): líneas cortas tipo "[rugido]" para los hitos sonoros clave.
- **Reducir destellos** (nuevo, además de `settings.shake`): los `flash` pasan a un oscurecimiento del 20-30 % de alfa y nunca más de 2 por segundo; sin parpadeo blanco a pantalla completa (hoy `ending.js` hace un `fillRect` blanco de 300 ms al encender el brasero y `boss.js` pone `S.flash = 0.5` al rugir). Por defecto se hereda de `prefers-reduced-motion`.
- **Reducir sacudidas:** ya existe (`G.shakeMul` 1/3). Las cinemáticas solo llaman a `G.fx.shake`.
- **Reducir movimiento de cámara:** pan/zoom -> fundidos cruzados.
- **Texto:** velocidad ("Normal / Rápida / Instantánea") y "Avanzar solo" (ON por defecto: cada línea se queda según su longitud, ~60 ms por carácter, mínimo 1,8 s).
- Contraste: globo con borde y fondo oscuro, texto >= 14 px, sin texto sobre zonas con destello.

### 3.5 Rendimiento y memoria
Cada escena hornea sus capas una vez; en el frame solo hay `drawImage` + 2-3 sprites + texto; sin `shadowBlur`; calidad Baja (`G.Q.level === 'baja'`) quita partículas de ambiente y reduce capas de paralaje a 2. Objetivo >= 40 fps en móvil 844x390; medir con `?perf=1`. Los canvases se liberan al terminar (`canvas.width = 0`).

---

## 4. INTRO: cuándo se muestra

| Caso | Comportamiento |
|---|---|
| Cuenta nueva (sin `Save.data.cine.introSeen`) | Tras el primer toque (desbloquea el audio; verificar si ya existe una pantalla de título: no la he visto en el código, si no existe, añadir un "TOCA PARA JUGAR" mínimo que a la vez desbloquea WebAudio) -> intro -> aldea con la cámara en Marlo |
| Cuenta con progreso previa a la v9 (hay runs, bossKills o PF) | La migración la marca como vista (`introSeen = true`): NO se le obliga a verla |
| Volver a verla | AJUSTES (o MENU) -> "Cinemáticas" -> galería con Intro, Final (tras `endingSeen`) y entradas de jefe vistas. Reproducir no escribe en el guardado |
| Jugador recurrente | Nunca se bloquea: no hay intro si `introSeen`. Un reinicio de cuenta (`?reset=1` / borrar guardado) la vuelve a mostrar |
| Saltarla | Cuenta como vista (se marca a los 3 s de reproducción o al terminar/saltar) |
| URLs de prueba | `?direct=1`, `?boss=`, `?hunt=`, `?assault=` no la muestran; `?cine=1` la fuerza; `?cine=0` la apaga siempre |
| Qué sigue | Fundido a la aldea; la primera vez, Marlo aparece junto a la fogata y el aviso de ayuda actual (tutorial) sigue su curso |

---

## 5. ENTRADAS DE JEFE (B)

### 5.1 Estado actual (leído en `boss.js`)
- `S.spawn` crea el jefe con `e.mode = 'intro'`, `G.frozen = true` (simulación congelada) e `e.immune`; `updIntro` corre una línea de tiempo de 3,5 s: aterriza (800 ms), ruge (1800 ms), música (2400 ms), fin 3500 ms; `drawIntro` pinta barras de cine de 48 px y una tarjeta con retrato, nombre y título. Cada jefe puede añadir `H.intro` (Karceron surge de la lava, Letea emerge del estanque con 3 cabezas, Yarlak asoma entre la ventisca con 3 pasos y onda de nieve, Melaria baja del techo del panal, Cenizar se forma con 5 chispas de la corona). El Pastor usa la entrada genérica (cae del cielo).
- `S.camTarget` ya hace el zoom y el pan de cámara hacia el jefe.
- La primera vez no se puede saltar; después, tras 1 s con Espacio/Enter/toque. `bossSeen[id]` se marca al terminar. `G.nointro` (`?nointro=1`) y práctica (desde el segundo intento) lo omiten.
- `S.noHurtNow()` y `S.intro` garantizan que el jugador no recibe daño durante la intro.

### 5.2 Decisión
**No se saca la entrada fuera del mundo.** Los jefes entran con sus sprites reales, en su arena real, con la cámara real: eso es lo que da peso y no cuesta nada de arte nuevo. Se añade una capa `G.Cine` en modo `overlay` y se parametriza la duración. Ventajas: cero cambios de simulación, las telegrafías, `cadT = 1200`, HP, fases y bots siguen intactos.

| Versión | Duración | Contenido | Cuándo |
|---|---|---|---|
| Larga | **~4,5 s** (hoy 3,5) | Lo actual + 1 s de "presagio" al inicio (la arena se oscurece y suena la nota del tema del jefe) + subtítulo de una línea con una frase de lore del propio jefe + tarjeta con retrato | 1.ª vez que el jugador se enfrenta al jefe (`!cine.entrySeen[id]`) |
| Corta | **~1,6 s** | Barras de cine, jefe aparece ya posado con su pose de rugido de 400 ms, tarjeta de nombre rápida (sin subtítulo), stinger | Resto de veces (farmeo, cacería, Peligro) |
| Omitida | 0 s | Sin cámara ni tarjeta | `?cine=0`, `?nointro=1`, `?direct=1`, bots; práctica a partir del 2.º intento (ya existe) |

Duración total con corta: tras 1,6 s el combate empieza con el mismo `cadT = 1200`: el jugador tiene el mismo margen que hoy. El "fin de la intro" sigue fijando `e.cadT = 1200`; no se retrasa nada.

### 5.3 Integración con `boss.js` (cambios mínimos, para el programador)
1. En `S.intro` añadir `len` (3500 por defecto; 4500 larga; 1600 corta) en lugar de los literales `3490/3500/2400/2600`, y escalar los hitos: `roar` a `0.51 x len`, `music` a `0.69 x len`. El `H.intro` de cada jefe ya usa tiempos absolutos hasta ~2000-2400 ms, así que con la versión corta (1,6 s) se usa un `H.introShort(e, I, t)` o simplemente se llama a `H.intro` con `t` escalado (`t' = t x 3500 / len`) manteniendo los mismos hitos.
2. Selección de versión: `I.mode = G.Cine.off ? 'off' : seen ? 'short' : 'long'`, con `seen = !!(Save.cine.entrySeen[id] || Save.bossSeen[id])` (migración: `bossSeen` ya cuenta como visto).
3. `drawIntro` delega en `G.Cine.entryOverlay(e, I)` (tarjeta, subtítulo, barras); la lógica actual queda de reserva si `G.Cine` falta.
4. Saltar: pasa a poderse siempre a partir de 800 ms (primera vez incluida, para accesibilidad); al saltar se ejecutan de golpe los efectos de estado que dependen del tiempo (música, `S.barFill = 1`, `e.lift = 0`, `cullHorde()` si no se hizo) para que el estado final sea idéntico al de la intro completa. Esto ya lo hace `I.t = 3500` en el código actual y es la regla: **la salida de la intro debe ser la misma por cualquier camino**.
5. Nada de `G.rng`: los efectos usan `fx.*` (cosmético).
6. Peligro IV+: el stinger `peligro` a +700 ms se mantiene en la larga y se omite en la corta.
7. `hunt` y `practice`: corta por defecto (la cacería es farmeo). `final` (Asalto al Cráter): Cenizar usa su versión especial (5.5) aunque sea Cacería, solo la primera vez.

### 5.4 Qué cinemática tiene cada jefe (larga; la corta es el mismo plano comprimido)
| Jefe | Entrada actual | Mejora de la larga (sólo overlay y música) | Subtítulo (lore, 1 línea) | Color del cartel |
|---|---|---|---|---|
| **El Pastor Corrupto** ("Bestia del Rebaño") | Cae del cielo, onda y polvo | Luz cenital sobre el claro; el rebaño (siluetas) se aparta; el cayado centellea (1.ª brasa del hilo) | "El Pastor era el mejor de nosotros." (Lanudo) | morado `#c090ff` |
| **Karceron** ("Coloso de Huesos y Magma") | Surge del suelo con lava y grietas | Cadenas que caen; cámara baja y sube con él (tilt corto) | "Despertó entre sus propios grilletes." | naranja `#ff9a3c` |
| **Letea** ("la hidra del Asfódelo") | Tres cabezas emergen del estanque, de 300 ms en 300 ms | Cada cabeza con su color (ácido, hielo, rayo) y su nota; el reflejo del estanque | "El río del olvido tiene tres voces." | turquesa `#2f6f6a` |
| **Yarlak** ("El invierno que camina") | Asoma entre la ventisca, 3 pasos pesados y onda de nieve | Cámara con pequeño vaivén en cada paso (sacudida reducible); respiración de vaho | "Guardaba la última hoguera del norte." | azul-blanco `#bfeaff` |
| **Melaria** (la Reina Abeja) | Baja del techo del panal con 700 ms de zumbido | Zumbido en estéreo, cera que gotea, las avispas orbitan un segundo | "Devoró la jalea de sus hermanas." | ámbar `#f3a31f` |
| **Cenizar** | La chimenea se enciende, la brasa sube, se forma, 5 gemas de la corona con 5 notas | **Prerrollo propio (5.5)** | ver 5.5 | blanco-brasa `#fff2b0` |

(Para Karceron/Letea/Pastor las frases de lore no están en los DESIGN leídos; son propuestas cortas y consistentes con sus títulos y con la historia de la intro; revisar con el dueño.)

### 5.5 Cenizar, entrada larga (jefe final)
Antes de la intro estándar, **prerrollo `full` de ~6 s** (solo la 1.ª vez; no cuenta en el reloj de la run ni en `G.time`: es un estado `'cine'` aparte, se reproduce justo antes de `S.spawn`):
1. 0-2 s: el Hogar Quemado desde arriba, ruinas, silencio; entra la cámara por el techo roto.
2. 2-4 s: el brasero de Marlo (la brasa mansa de la bufanda) contra el suelo de brasas; las grietas del cráter se iluminan una a una en los cinco colores de los jefes (pentágono de sellos = `Assets.CRATER.seals`).
3. 4-6 s: corte a negro, cartel "CENIZAR - El Incendio Primero", y se arranca la intro estándar de 3,5 s (la forma que se levanta y la corona de 5 gemas).
La 2.ª vez y siguientes: solo la intro estándar corta (1,6 s) más el rugido. En Cacería/Práctica de Cenizar: corta. Un jugador que quiera verla otra vez la tiene en la galería.

### 5.6 No romper telegrafías ni balance (reglas, verificables)
1. `G.frozen = true` durante toda la entrada (ya es así); las cinemáticas no lo quitan ni lo ponen.
2. Sin escrituras en `e.hp`, `e.phase`, `e.cadT` fuera de las que ya hace `updIntro`; sin consumo de `G.rng`.
3. Hash de estado (como el test `seed`) a los N ticks tras la entrada: idéntico con `?cine=0` y con la entrada larga/corta (misma semilla, mismas entradas).
4. La corta no recorta el tiempo de reacción: el combate empieza igual con `cadT = 1200`.
5. En práctica (`G.mode === 'practice'`) y bots, `cine=0` por defecto.
6. `cullHorde()` (el rugido dispersa al rebaño) se ejecuta siempre, también al saltar.

---

## 6. CIERRE (C): victoria, epílogo, créditos y aldea

### 6.1 Evaluación de `src/ending.js`
| Aspecto | Hoy | Veredicto |
|---|---|---|
| Disparo | `G.finish(true)` -> `G.Ending.begin()` si 1.ª victoria y `G.cenizarFinal.first` (no Práctica), después de `stg_cenizar_win` y tras calcular el botín | Se mantiene el disparo; **se evita que el jingle de victoria y el `stg_cenizar_ending` se pisen** (hoy ambos suenan) |
| Escena | `Assets.drawEndingScene` (brasa -> hogar se recompone -> 5 siluetas -> amanecer) con el respaldo por código si falta | **Reutilizar** tal cual, es arte ya hecho |
| Créditos | `Assets.drawCredits` + lista `CREDITS` | **Reutilizar** el dibujo; **rehacer el contenido** (nombra a agentes "game-designer", "programmer"..., y al dueño como "el dueño del estudio": decidir con el dueño) |
| Diálogo | 5 personajes, 2,6 s cada uno, fijo | **Rehacer** con `G.Cine` (máquina de escribir, avanzable, retratos reales, añadir Carapa y Rufo y un gesto de Marlo) |
| Tiempos | Constantes `T_*` en ms, sin pausa | **Rehacer** como guion de pistas, con pausa y salto por escenas |
| Accesibilidad | Destello blanco a pantalla completa de 300 ms en `T_LIGHT`; sin pausa al ir a segundo plano (el `blur` solo afecta a `'play'`) | **Corregir** |
| Aldea | `endingSeen` solo se guarda: `aldea.js` no lo lee. Los "3 detalles de aldea reconstruida" (tejado nuevo, farolillos, estandarte) solo existen en el respaldo de `ending.js` | **Implementar de verdad** (6.4) |
| Repetible | No | Galería de cinemáticas |
| Salto | Primer toque pasa a créditos, segundo termina | Se conserva: es buena idea |

### 6.2 Secuencia propuesta (todo saltable; ~70 s la primera vez)
1. **Victoria in-world (`overlay`, ~6 s)** sobre la muerte de Cenizar (que ya dura 4 s de simulación: `deathMs: 4000`): barras de cine, el color se desatura salvo la brasa, cámara hacia el pecho (`anchors.core`), la última brasa parpadea y se apaga; banner "CENIZAR DERROTADO" ya existe. Marlo se detiene y la bufanda late una vez. Sin cambiar `e.dying`.
2. **Silencio de 1,5 s**, luego `stg_cenizar_win` (fanfarria breve, 4 compases) sin música debajo.
3. **Epílogo en el Hogar (`full`, ~35 s)**: reutiliza `drawEndingScene`. Beats: negro "Cenizar se apaga..." -> el Hogar en ruinas con una única brasa -> Marlo entra y suelta del cuello **su brasa mansa** en la chimenea (sin destello blanco: halo cálido) -> el fuego prende y se recompone la casa -> llegan los amigos -> diálogo breve -> amanece.
4. **Créditos (~25 s)** con `drawCredits` sobre el amanecer; lista final aprobada por el dueño.
5. **Salida:** pantalla de botín (como hoy) y después la aldea con el mundo cambiado y un cartel de 3 s "Amanece en Rescoldo".

Diálogo del epílogo (borrador; cada línea con retrato, la voz de cada uno ya está definida en el lore de la aldea):
- LANUDO: "El fuego se ha apagado... y las cenizas, al fin, descansan." (se conserva)
- VESPER: "Sabía que no me equivocaba contigo. La apuesta la he perdido encantado." (se conserva)
- CASTAÑA: "Ven, cielo, que hay caldo caliente. Y esta vez no huele a humo." (se conserva)
- GRUM: "Reconstruir lleva tiempo, chaval. Pero ya hay un hogar donde clavar el primer clavo." (se conserva)
- CARAPA (nueva, la Armera; presentar su voz con el dueño): "Te he hecho una bufanda nueva. Por si acaso la otra decide quedarse a vivir en la chimenea."
- RUFO (nuevo): "Cuento esto como el mejor trato de mi vida: cero monedas y un invierno menos."
- ULALUME: "Las cartas lo dicen, Marlo: la mano ganadora eres tú." (se conserva)
Si el dueño no quiere nuevas voces, se queda con las cinco originales. Marlo sigue sin hablar.

### 6.3 Créditos
Contenido a decidir con el dueño (pregunta abierta 4). Estructura propuesta: título SWARM HAND, "Un juego del Mini Estudio", Dirección, Diseño, Programación, Arte, Música y sonido, Pruebas (los puestos que ya están en `ending.js`, con o sin nombres de agente), y cierre "Y a ti, Marlo, que apagaste las seis llamas. GRACIAS POR JUGAR". Música: `cenizar_credits` (ya existe). Velocidad 32 px/s (ya ajustada), pulsar acelera x3.

### 6.4 La aldea cambiada ("Rescoldo reconstruido")
Estado visible que se decide con `Save.data.endingSeen` (y `cine.epilogueSeen` para la escena del primer regreso):
1. **Tejado nuevo** en las casas, **farolillos** colgados y **estandarte** rojo-ámbar (los tres del respaldo de `ending.js`, ahora en la aldea).
2. **Brasero de la plaza encendido a llama plena** (antes de la victoria arde como brasa roja, tal como pide v7 al vencer a Melaria; resuelve la contradicción "el brasero ya está encendido" / "vuelve a arder") y la **estatua del Hogar** (v7: "Brasa Primera", cosmética).
3. Marlo con la bufanda con la brasa mansa visible (sprite `player` + halo).
4. **Escena corta al volver (6-8 s, saltable)**: la cámara recorre la plaza, Lanudo dice "Amanece en Rescoldo." y se marca `cine.epilogueSeen`.
5. Opcional MVP+: la aldea recupera detalles de forma gradual con cada jefe vencido (stage 0 a 6). No entra en el MVP.
Implementación: `Assets.drawVillageRebuilt(ctx, t, {stage:0|1})` dibuja encima del decorado (como capa en `actors`/`drawVillageLight`) sin tocar `assets_village.js`; `aldea.js` lo llama si `endingSeen`.

---

## 7. Arte necesario por pieza (agente de arte; todo procedural, contorno `#1b1124`, rasterizado x2)

Convención de nombres: nuevo `src/assets_cine.js` (+ `assets_cine2.js` si crece), cargado tras `assets_armor2.js`; API en `ASSETS_API.md` al entregar. Sin `shadowBlur`.

| Pieza | Recurso | Detalle | Prioridad |
|---|---|---|---|
| Motor | Ninguno (cuadros de reserva por código) | El motor funciona con rectángulos y degradados mientras llega el arte | - |
| A. Intro | 5 fondos en capas (cielo, lejano, medio, cercano, primer plano): fogata nocturna, Hogar cálido, chimenea (primer plano de la brasa), aldea en ruinas, Portal | `Assets.drawCineBg(ctx, id, {w, h, layer, t})`; formato de capa pensado para pan de hasta 1280x540 | Alta |
| A. Intro | **Panel de los cinco rescoldos**: 5 mini-escenas con silueta + color | Reutilizar siluetas de los jefes ya hechos: `Assets.drawSilhouette(ctx, id, x, y, {color, glow})` (un envoltorio que pinta el sprite en negro con aura); casi sin arte nuevo | Alta |
| A. Intro | **Marlo**: poses `idle`, `look` (mira arriba), `scarf` (la brasa de la bufanda late), `walk` | `Assets.drawMarloPose(ctx, pose, x, y, t, {flip, scale})`; reutiliza el sprite `player` y `drawMarloArmor` como base | Alta |
| A. Intro | **Lanudo narrando**: ya existen frames 7-8 de habla; falta un plano más cercano (retrato `portrait_lanudo` 96x96 existe) | Reutilizable | Media |
| A. Intro | Logo **SWARM HAND** con brasas | `Assets.drawTitleLogo(ctx, x, y, {p})` (letras de brasa, 3 estados de encendido) | Alta |
| A. Intro | Efectos: `fx_ember_scarf` (halo de la bufanda), cartas flotantes que se funden | 2 efectos; las cartas pueden reutilizar `ui_card_*` | Media |
| B. Entradas | **Cartel de jefe** (`Assets.drawNamePlate(ctx, id, x, y, {p, w})`): marco de 9-slice con color del jefe | 1 sprite, 6 paletas | Alta |
| B. Entradas | Retrato grande de jefe (192x192, 3 frames) por jefe | Los actuales son 96x96; escalar x2 se ve blando. Alternativa MVP: usar el retrato de 96 y poner un halo | Media |
| B. Entradas | Presagio: viñeta oscura + rayo de luz cenital (Pastor), cadenas (Karceron), reflejo del estanque (Letea), vaho (Yarlak), cera que gotea (Melaria) | Capas de fx que se superponen al mundo (`Assets.drawEntryOmen(ctx, id, p)`), 5 funciones pequeñas | Media |
| B. Cenizar (prerrollo) | Vista cenital del Cráter: reutiliza `Assets.arena('crater')`, `CRATER.seals`, `drawCraterSeals` | Sin arte nuevo salvo una luz de grietas progresiva | Media |
| C. Victoria | **Pecho de Cenizar** con la última brasa (zoom a `anchors.core`) y su apagado | Ya existe en la animación de muerte (`dying`); solo falta una función de zoom cinematográfico | Baja |
| C. Epílogo | `drawEndingScene` existente (placeholder de siluetas): **sustituir las 5 siluetas por `Assets.drawNPC`** y añadir Carapa y Rufo | Marlo suelta la brasa (pose `scarf` -> `give`) | Alta |
| C. Epílogo | Aldea reconstruida: `Assets.drawVillageRebuilt` (tejados, farolillos, estandarte, brasero a llama plena, estatua del Hogar) | 4-5 sprites pequeños de overlay | Alta |
| C. Créditos | Fondo del amanecer: ya existe | Reutilizable | - |

Presupuesto de arte: ~28 sprites/funciones, <= 70 frames; menos que un jefe y su bioma. Reutiliza casi todo del juego actual.

---

## 8. Audio necesario (audio-designer)

Archivo nuevo `src/sfx_cine.js`, cargado tras `sfx_armor2.js` (y entrada en `index.html` y `sw.js`).

| Pieza | Recurso | Detalle |
|---|---|---|
| Intro | **Pista `cine_intro`** (~60 s, no en bucle, 66-72 BPM, Mi frigio como el tema del fuego): fogata y bordón cálido (1-2), cuerda y arpegio en el flashback (2), tensión grave con una nota seca (3), 5 notas del leitmotiv (una por viñeta del panel, las 5 que ya usa `stg_cenizar_intro`) (4), pad melancólico (5), calidez al final con la nota mansa (6), cartas: chime arpegiado (7), crescendo y golpe del título (8) | Contrato: `Assets.music.setTrack('cine_intro')`, `Assets.music.start()`, `Assets.music.setIntensity(0..1)` por viñeta; fin no en bucle; devolver a `normal` con `setTrack('normal')` |
| Intro | SFX: `cine_blip_<voz>` (bip de máquina de escribir por personaje: Lanudo grave, Vesper brillante, Castaña suave, Grum seco, Ulalume etéreo, Rufo rápido, Carapa metálico; Marlo ninguno), `cine_swoosh` (transición), `cine_ember` (la brasa que salta), `cine_title_hit` (golpe de título) | <= 4 voces, pitch +-10 % como el resto |
| B. Entradas | `cine_name_plate` (golpe corto de cartel, un tono por jefe pasando `pitch`), `cine_omen` (presagio grave de 1 s) | Los stingers de intro ya existen (`stg_<jefe>_intro`; `stg_cenizar_intro` con las 5 chispas): reutilizar |
| B. Cenizar | `cine_cenizar_preroll` (pad + 5 grietas que se encienden), y el rugido y la 5.ª nota que ya existen | |
| C. Victoria | Reutiliza `stg_cenizar_death` (~6 s), `boss_die`, `stg_cenizar_win` | Orden: death -> silencio 1,5 s -> win -> ending (hoy se pisan) |
| C. Epílogo | `cenizar_ending` y `stg_cenizar_ending`, `ending_hearth`: reutilizar. Nuevo `cine_give_ember` (la brasa mansa entra en la chimenea: chasquido + campana suave) | |
| C. Créditos | `cenizar_credits`: reutilizar | |
| Aldea reconstruida | `cine_village_dawn` (pad de amanecer de 4 s) y mezcla ambiente: grillos y fuego cálido en el `normal` de aldea | Opcional |
| Voz | **Sin locución**; solo bips y música (decisión del dueño, sección 14) | Coste de voz real: fuera del alcance |

Reglas: el motor no reproduce nada si falta el recurso (silencio); cualquier `music` de una cinemática se corta con un fundido al saltar; los bips se desactivan con "Texto instantáneo".

---

## 9. Guardado (v11 -> v12), pruebas y QA

### 9.1 Guardado
- `Save.VERSION = 12`, copia de seguridad `swarmhand.fusion.save.v11` al migrar (el patrón ya existe).
- Campos nuevos: `cine: { introSeen:false, introVer:1, entrySeen:{pastor:0,...}, epilogueSeen:false, creditsSeen:false }` y `settings.cine: { flash:true, mode:'auto', textSpeed:1, autoAdvance:true, soundCaps:true }`.
- Migración sin pérdida: `introSeen = true` si ya hay progreso (`runs>0` o algún `bossKills` o `bossSeen`); `entrySeen[id] = bossSeen[id]`; `creditsSeen = endingSeen`; `epilogueSeen = endingSeen`.
- Se mantienen `bossSeen` y `endingSeen` (otros sistemas los leen). Qué marca cada cosa: intro (a los 3 s de reproducción, o al terminar/saltar), entrada de jefe (al terminar o saltar la entrada, como hoy: `bossSeen`), epílogo (al terminar o saltar a créditos), créditos (al terminar o salir).
- `Save.import`/export: añade `cine` a la lista de claves objeto saneadas (como `armor`).

### 9.2 Pruebas (`tools/card-swarm-bot/tests.js cine`)
1. Motor: mismas entradas -> mismo hash de estado visible en puntos de control; las pistas disparan exactamente una vez; `skip()` dispara `onEnd('skip')` una vez y deja audio y estado coherentes.
2. Pausa: con `document.hidden` el reloj no avanza; al volver continúa desde el mismo `t`.
3. No toca la simulación: con `?seed=<n>` y `G.step()`, el hash del estado tras N ticks de un jefe es idéntico con `?cine=0`, con entrada larga y con corta; `G.rng()` consume la misma secuencia.
4. Intro: cuenta nueva la reproduce; segunda carga no; `?direct=1` y bots no; migración v11 -> v12 sin intro para cuentas con progreso; galería la reproduce sin escribir en el guardado.
5. Entradas: cada uno de los 6 jefes con `larga`, `corta` y `cine=0`: duración medida (+-100 ms), saltable a los 800 ms, `e.cadT` final = 1200, `S.noHurtNow()` true durante toda la entrada, `cullHorde` ejecutado también al saltar.
6. Cierre: victoria de Cenizar 1.ª vez dispara la secuencia; repetir no; Práctica no; salto a créditos y a botín; la aldea refleja `endingSeen`.
7. Accesibilidad: con `settings.cine.flash` ningún frame supera alfa 0,3 de destello; con `shake` activo la amplitud real <= 4 px; subtítulos presentes en todas las líneas.
8. Rendimiento: `perf_bot` con la cinemática activa, p95 de CPU por frame <= 6 ms de dibujo; sin fugas de canvas (contar canvases antes y después).
9. 0 errores de consola en `all`; PWA: `iso` comprueba que los scripts nuevos están en el precache.
10. Regresión: con `?cine=0`, los 12 puntos de control bit a bit idénticos al commit anterior (como en v8).

### 9.3 QA a mano (móvil real 844x390)
Intro completa en vertical y horizontal, salto por botón y por Esc, llamada entrante / segundo plano a mitad de cinemática, audio tras volver, lectura del texto a distancia, accesibilidad (reducir destellos con una persona sensible), ver las 6 entradas dos veces (larga y corta), final completo con el epílogo y la aldea cambiada.

---

## 10. Perillas y compatibilidad con bots y modos

| Perilla | Efecto |
|---|---|
| `?cine=0` | Todo apagado: sin intro, sin entradas (`G.nointro = true`), sin epílogo (va directo al botín), sin prerrollo de Cenizar. Para bots y regresión |
| `?cine=1` | Fuerza las versiones largas y la intro aunque la URL sea de prueba |
| `?cine=short` | Fuerza las entradas cortas |
| `?nointro=1` | Se conserva (omite la entrada de jefe, sigue existiendo) |
| `?direct=1`, `?boss=`, `?hunt=`, `?assault=`, `?practice=1` | `cine=0` por defecto (se puede forzar con `?cine=1`) |
| `?ending=1` | Salta a la secuencia final para probarla (como `?assault=1` para Cenizar) |

---

## 11. Riesgos

| Riesgo | Mitigación |
|---|---|
| Cansancio en el farmeo | Entrada corta de 1,6 s y saltable; omitida en práctica |
| La intro bloquea a quien vuelve | `introSeen` por migración; se puede saltar; galería para repetirla |
| Cambiar los tiempos de `updIntro` rompe `H.intro` de cada jefe | Escalar `t` en vez de reescribir los hitos; test por jefe de la secuencia de hitos |
| Estado distinto según se salte o no | Una sola ruta de salida de intro; test de hash de estado |
| Memoria en móvil (canvases de fondos de intro) | Hornear por escena y liberar; <= 3 vivos |
| Audio: el jingle de victoria pisa el del final; música no se corta al saltar | Orden fijo y `music.stop()` con fundido |
| Pausa en segundo plano | `visibilitychange`+`blur` también en `'cine'` y `'ending'` |
| Destellos/sacudidas (sensibilidad) | Ajuste "Reducir destellos" y `shakeMul` |
| Coste de arte de los fondos | Siluetas de los jefes ya hechos, `drawEndingScene` y `drawNPC` reutilizados; MVP con degradados y paneles |
| Alcance del lore inventado (brasa mansa) | Marcado como propuesta; alternativa neutra preparada |
| `index.html` / `sw.js` / `stamp.py`: scripts nuevos fuera del precache | Test `iso` del precache ya existente |

---

## 12. Fases, esfuerzo y orden recomendado

(Días de calendario de un flujo; "en paralelo" = arte/audio mientras el programador avanza.)

| Fase | Contenido | Agentes | Días |
|---|---|---|---|
| **F0** | Decisiones del dueño (sección 14), guion final, lista de créditos | game-designer, dueño | 0,5-1 |
| **F1 Motor + intro** | `cine.js` (pistas, cámara, tweens, capas, diálogo, skip, pausa), ajustes (flash/texto), guardado v12 + migración, galería mínima en AJUSTES, intro con arte de reserva | programmer, qa-tester | 5 |
| **F1 en paralelo** | Arte de intro (fondos, poses de Marlo, logo, siluetas) | artist | 5 |
| **F1 en paralelo** | Audio: `cine_intro`, bips por voz, swoosh, golpe de título | audio-designer | 3 |
| **F2 Entradas de jefe** | `I.len` y versión corta/larga/omitida en `boss.js`, `G.Cine.entryOverlay`, overlays por jefe (1 día cada uno, Pastor+Karceron+Letea en 3 y Yarlak+Melaria en 2), prerrollo de Cenizar (3), tests por jefe | programmer, qa-tester | 9 |
| **F2 en paralelo** | Cartel de jefe + presagios (5 funciones) + retrato grande opcional | artist | 4 |
| **F2 en paralelo** | `cine_name_plate`, `cine_omen`, `cine_cenizar_preroll` | audio-designer | 1,5 |
| **F3 Cierre** | Victoria in-world, epílogo con `G.Cine` (reutiliza `drawEndingScene`), Carapa y Rufo, créditos finales, aldea reconstruida y escena de regreso | programmer, qa-tester | 6 |
| **F3 en paralelo** | `drawVillageRebuilt`, Marlo `give`, retratos nuevos | artist | 3 |
| **F3 en paralelo** | `cine_give_ember`, amanecer, ajuste del orden de jingles | audio-designer | 1,5 |
| **F4 Pulido** | Pruebas de accesibilidad y rendimiento, QA en móvil real, README y `ASSETS_API.md` | qa-tester, tools-engineer | 3 |
| **Total** | | | **~26-28 d de un flujo (~19-21 con paralelo)** |

**MVP mínimo (si el dueño quiere algo ya):** F1 con intro de 5 viñetas (sin panel de 5 rescoldos animado), F2 solo con versión corta/larga y cartel (sin presagios), F3 solo con créditos mejorados y aldea reconstruida: ~12 días.

### Criterios de éxito
1. La intro se ve una sola vez, se puede saltar en <= 1 toque, dura <= 55 s y funciona offline (PWA).
2. Ninguna cuenta con progreso previo la ve obligatoriamente tras actualizar.
3. Las 6 entradas de jefe: larga <= 4,5 s la 1.ª vez (Cenizar +6 s de prerrollo), corta <= 1,6 s después, saltables, y el combate empieza con `cadT = 1200` en todos los casos.
4. Hash de simulación idéntico con `?cine=0`, con corta y con larga (0 diferencias); regresión bit a bit de los 12 puntos de control.
5. 0 errores de consola en `tests.js all` (incluyendo el nuevo `cine`); >= 40 fps en móvil 844x390 durante cinemáticas.
6. Con "Reducir destellos" no hay destellos blancos a pantalla completa; el texto es legible en 844x390.
7. Tras el final la aldea es visiblemente distinta y el jugador puede volver a ver el final desde la galería.

---

## 13. Resumen de entregables de código (para el programador, sin escribir código aquí)

Nuevos: `src/cine.js` (motor), `src/cine_intro.js` (guion A), `src/cine_boss.js` (entradas B), `src/cine_ending.js` (epílogo y créditos C), `src/assets_cine.js`, `src/sfx_cine.js`. Editados: `boss.js` (`I.len`, delegar `drawIntro`), `boss_*.js` (solo si el escalado de `t` no basta), `main.js` (`case 'cine'`, arranque de la intro, `?cine=`, `blur`/`visibilitychange`), `ending.js` (pasa a usar `G.Cine`; se conserva el contrato `G.Ending.begin/active`), `aldea.js` (lee `endingSeen`), `save.js` (v12), `panels.js` (ajustes y galería), `index.html`, `sw.js`, `stamp.py`, `README.md`, `ASSETS_API.md`.

---

## 14. Preguntas abiertas que solo el dueño puede decidir

1. **Tono:** ¿cuento junto al fuego, cálido y algo melancólico (propuesto), más épico y oscuro, o más cómico?
2. **Duración y obligatoriedad:** ¿intro de ~50 s (propuesto, saltable con botón) o más corta (~25 s, 4 viñetas)? ¿Se permite saltar la PRIMERA vez o debe verse al menos una vez?
3. **Voz:** ¿solo texto con bips (propuesto, sin coste) o interés en voz grabada/sintetizada en el futuro?
4. **Créditos:** ¿se mantienen los puestos por agente (game-designer, programmer...) y "el dueño del estudio", o se usan nombres reales / un "Estudio" genérico?
5. **Lore inventado:** ¿se aprueba la "brasa mansa" de Marlo (nació la noche del incendio y es la llama que Cenizar no pudo contagiar)? Alternativa neutra: la intro omite el origen de Marlo y el epílogo reenciende el brasero sin brasa propia.
6. **Nuevas voces:** ¿se añaden Carapa y Rufo al epílogo? ¿Se quiere que cada jefe tenga un subtítulo de lore en su entrada larga (las frases de Karceron, Letea y el Pastor son propuestas mías)?
7. **Orden de cierre:** ¿el final se muestra antes del botín (propuesto, mantiene el orden actual) o tras él, para que el jugador vea antes sus recompensas?
8. **Aldea cambiada:** ¿solo tras vencer a Cenizar (MVP) o también cambios graduales con cada jefe?
9. **Primera vez de las entradas:** ¿se puede saltar desde el primer segundo o se deja la primera entrada de cada jefe sin saltar (como hoy)? Se recomienda poder saltarla a partir de 800 ms.
10. **Pantalla de título:** ¿existe o se añade un "TOCA PARA JUGAR" que desbloquee el audio antes de la intro?
