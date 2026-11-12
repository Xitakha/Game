# Plan maestro de Swarm Hand: divertido, adictivo y monetizable

Fecha de la revisión: 2026-11-12 · Commit revisado: `33197d4` (rama `claude/serene-pascal-bsxbz3`, igual que `main`).
Alcance: `games/card-swarm` (juego principal), `games/survival-lamb`, `games/card-swarm-clasico`, `tools/`, `studio/`, `.claude/agents/`, `.github/workflows/pages.yml`.
Esta revisión **no cambia código del juego ni balance**: solo diagnostica y planifica.

Cómo leer la evidencia:
- **[V]** verificado leyendo el código o midiendo en esta revisión (se cita `archivo:línea` o la medición).
- **[I]** inferencia razonada a partir de lo verificado; hay que confirmarla.
- **[N]** no se pudo verificar aquí (se dice por qué).

Mediciones propias de esta revisión (Chromium headless, vista 844x390 táctil, servidor local `tools/serve.py`; los tiempos no son los de un móvil real):
- Carga: 92 peticiones de script, 3,40 MB sin comprimir, evento `load` a ~1,8 s en local, 14,5 MB de memoria JS en la aldea, 0 errores de consola.
- Con DPR 3 el juego elige calidad MEDIA y un lienzo de 1392x783.
- En 844x390 el lienzo 16:9 ocupa 693 de 844 px de ancho (82 %): quedan dos franjas negras de ~75 px.
- Primera vez (`?cine=1`, cuenta nueva): título, un toque, intro de ~27 s que no se puede saltar, aldea.
- Primera expedición (cuenta nueva, `?god=0`, bot que camina en cuadrado y recoge pocas gemas): en 100 s hubo 157 bajas, nunca más de 6 enemigos vivos a la vez, la vida bajó de 100 a 93 y la primera oferta de carta por nivel llegó al segundo 55.
- La batería de pruebas `tests.js all` **no arrancó** en el contenedor actual: ver T-F0-01. El resultado de la ejecución con la ruta corregida está en la sección 1.12.

---

## 1. Diagnóstico por áreas

### 1.1 Diversión y bucle central
- **Bien.** El bucle es sólido y tiene identidad: ataque básico automático, cartas como infusiones, 15 fusiones que dan poderes activos en 4 ranuras, 6 jefes con fases y partes rompibles, 5 niveles de Peligro (`src/boss.js:65-70`), cacería y práctica (`src/main.js:340-345`). Las decisiones de fusión (fusionar ya o guardar, reemplazar un poder) son decisiones de verdad. [V]
- **Falla.** El primer minuto es plano: pocos enemigos, sin amenaza y sin decisiones (medición de arriba). En un survivors la diversión de los primeros 60-90 s decide si el jugador vuelve. [V la medición; I la consecuencia]
- **Falla.** El jugador real juega hoy con inmortalidad por defecto (`src/main.js:20`): nadie ha sentido el reto real del juego publicado. Todo juicio sobre "es divertido" está sin validar. [V]
- **No verificado.** Sensación de control con el joystick y los 4 botones en un teléfono real; solo hay pruebas automáticas táctiles. [N]

### 1.2 Adicción sana y retención
- **Bien.** Hay metaprogresión larga (árbol de forja, rangos, armaduras por sets, logros, Archivo, Ruta), encargos que rotan y una aldea que cambia con el progreso (`src/aldea.js:475-507`). [V]
- **Falla.** No existe ningún gancho de regreso diario: lo único ligado al calendario es la rotación del Tablón (`src/quests.js:156-157`). No hay reto diario, ni racha de visitas, ni recompensa de regreso, ni tabla de récords, ni objetivos "casi lo tienes" en la pantalla de fin. [V]
- **Falla.** La pantalla de derrota informa del botín pero no propone el siguiente objetivo concreto (captura de esta revisión: "PF libres 1 - nodos comprables 0"). [V]
- **No verificado.** Retención real D1/D7: no hay analítica. Referencia externa: mediana de móvil D1 ~22 % y D7 ~4 %, cuartil alto D1 algo más del 30 % (GameAnalytics 2026, vía resúmenes secundarios; ver fuentes). [N]

### 1.3 Onboarding y primera sesión
- **Bien.** Título e intro con buena factura; la primera fusión está ayudada y la primera oferta garantiza receta (README, "Reglas de fusión"); existe un encargo tutorial (`src/quests.js:21`); el Manual tiene demos animadas. [V]
- **Falla.** Del primer toque al primer combate hay ~27 s de intro no saltable (`src/cine_intro.js:3`), después una aldea con 7 NPC y hay que ir al Portal y pulsar "Salir". Para un jugador de portal web es demasiado antes de jugar. [V medición; I impacto]
- **Falla.** En táctil se muestran pistas de teclado: tecla "E" sobre los NPC y el Portal, "Tab: cambiar de página" (`src/panels.js:417`), "PELIGRO (Q/E)" (`src/panels.js:140`, `:487`), "Enter" en el botón de salida. [V capturas en 844x390 táctil antes de pulsar ninguna tecla]
- **Falla.** No hay tutorial de combate: nadie explica moverse, recoger gemas ni usar poderes. [V: sin resultados al buscar tutoriales fuera de `quests.js`]
- **Falla.** La cuenta nueva ve de golpe Brasas, PF, encargos, duración, Peligro, destino, compras y plato en el Portal. [V captura del Portal]

### 1.4 Progresión y economía
- **Bien.** La tabla de balance de la meta está centralizada (`src/loot.js`, sección BALANCE) y documentada con sus motivos; hay "pity" de Esencia (`src/loot.js:66-67`) y duraciones con riesgo/recompensa (`src/loot.js:22-26`). [V]
- **Falla.** Hay 7 monedas y recursos (Ceniza, Brasas, 8 partes, Esencia, PF, trofeos, insignias). Es profundidad para el veterano y ruido para el novato. [V]
- **Falla.** La economía de fabricación de armaduras T3-T6 no se ha validado (README v8.1, "Desvíos honestos"). La meta de ~16 h no está medida, aunque existe `stats.playMs` (`src/main.js:573`), que además cuenta título, pausa y aldea. [V]
- **No verificado.** Horas reales hasta cada hito: no hay simulador de progresión ni datos de jugadores. [N]

### 1.5 Balance y dificultad
- **Bien.** Hay perillas por URL para casi todo y un historial honesto de mediciones en el README. [V]
- **Falla.** Deudas confirmadas en el propio README: el reto con armadura no está demostrado (supervivencia saturada en el bot), `zoneDmg` x1,18-x1,44 sin calibrar, sets T3-T6 sin probar contra jefes, ruido de +-30 s con n=12. [V en README]
- **Falla.** La dificultad depende del dispositivo: la calidad gráfica cambia el tope de enemigos vivos (`src/mobile.js:24-26`, `enemyMul` 1 / 0,9 / 0,75, aplicado en `src/waves.js:145`). Un móvil arranca en MEDIA (medido) y por tanto con un 10 % menos de enemigos que un PC; en BAJA, un 25 % menos. Eso contradice "el juego es un reto" y hace que el balance medido en PC no sea el del móvil. [V]
- **Falla.** `cardDmgMul` x3,5 es una calibración global heredada del prototipo (`src/main.js:109`). Funciona, pero indica que las cifras de diseño y las reales están separadas. [V]
- **Matiz sobre el determinismo.** Los `Math.random` que quedan en los archivos de combate son cosméticos (partículas y sonidos; revisados uno a uno en `enemies.js`, `combat.js`, `fusion.js`, `weapons.js`, `boss*.js`, `player.js`). Si el combate sigue sin ser reproducible con `?seed`, la causa probable es otra: el reloj real del bucle (`src/main.js:571-580`), la calidad adaptativa que cambia `enemyMul` y `projCap`, y los topes de partículas. [V el recuento; I la causa]
- **No verificado.** Peligro IV-V por debajo del objetivo en Karceron, Letea y Cenizar; Corrosión frente a jefes: no se volvió a medir aquí. [N]

### 1.6 Contenido
- **Bien.** 28 cartas, 15 fusiones, 6 biomas, 6 jefes, 2 minijefes por bioma, 7 sets de armadura, epílogo y créditos. Es mucho contenido para el tamaño del estudio. [V]
- **Falla.** No hay contenido repetible tras el final salvo subir Peligro: sin modo infinito, sin mutadores, sin eventos. [V]
- **Falla.** `games/survival-lamb` se publica en Pages sin controles táctiles (`MOVIL.md`, sección 6) y aparece en el índice público (`tools/site/index.html`). Da mala primera impresión en móvil. [V]

### 1.7 Arte y VFX
- **Bien.** El arte procedural de la aldea, los jefes y los efectos tiene nivel y estilo coherente (capturas de esta revisión). [V]
- **Falla.** Marlo se ve como mapache y el guion lo llama "corderito" (`src/cine_intro.js:147`, `src/aldea.js:104`, `:108`, `:213`). [V]
- **Falla.** En el segundo 8 de la intro la imagen es casi negra con rectángulos simples: parece arte de reserva (captura). [V la captura; I que sea reserva]
- **Falla.** No hay dirección de arte escrita (paleta, grosor de línea, reglas de legibilidad de telegrafías). 25 archivos `assets_*.js` suman ~17.000 líneas. [V]

### 1.8 Audio
- **Bien.** Audio procedural completo por familias y jefes; el audio se desbloquea con el primer toque y se suspende al salir. [V]
- **Falla.** Solo Tundra y Panal tienen pista propia; Bosque, Cripta, Asfódelo y Cráter comparten la pista `normal` (`src/main.js:392`). [V]
- **Falla.** `Assets.cine3` se define dos veces: como función de audio (`src/sfx_cine3.js:150`) y después como objeto de arte (`src/assets_cine3.js:645`), que pisa a la primera. Funciona por el orden de carga y por las guardas `typeof ... === 'object'`. [V]
- **No verificado.** Mezcla y volumen en altavoz de móvil. [N]

### 1.9 UI/UX y legibilidad móvil
- **Bien.** Objetivos táctiles de 48 px lógicos en lo principal, joystick flotante, letterbox con áreas seguras, tamaño mínimo de 12 px lógicos en menús (`src/main.js:176`, `:545`), aclarado automático de grises (`src/main.js:180-195`), ajustes de accesibilidad (reducir sacudidas y destellos). [V]
- **Falla.** 12 px lógicos son ~8,7 px reales en 844x390, y en combate el mínimo no se aplica: hay etiquetas de 8 a 11 px lógicos (5,8 a 7,9 px reales) en `hud.js`, `fusion.js` y `boss.js`. [V]
- **Falla.** Se desperdicia el 18 % del ancho en teléfonos 19,5:9 (medido). Ese espacio podría alojar joystick y botones sin tapar la arena. [V]
- **Falla.** La fuente es "Courier New" del sistema (`src/main.js:163`); en Android no existe y se sustituye por otra monoespaciada, con métricas distintas. [V el código; I el efecto]
- **Falla.** Solo horizontal; en vertical sale un aviso. Los portales web móviles traen mucho tráfico en vertical. [V]
- **No verificado.** Legibilidad en la mano del dueño, alcance del pulgar a los 4 poderes. [N]

### 1.10 Rendimiento
- **Bien.** Paso fijo a 60 Hz, caché de texto (`src/main.js:196-222`), calidad adaptativa, medidor `?perf=1`, bot de rendimiento y protocolo térmico (`MOVIL.md`, sección 7). [V]
- **Falla.** Carga: 92 scripts sin minificar ni agrupar (3,4 MB). GitHub Pages los comprime, pero son 92 peticiones y un análisis de 3,4 MB de JS en el arranque. [V]
- **Falla.** Asignaciones por fotograma en el dibujo (`filter` + `sort` de todos los enemigos en `src/main.js:500-503`) y ~20 `filter`/`sort` en los archivos de combate. No hay rejilla espacial para colisiones. [V el recuento; I el coste]
- **No verificado.** Frame-time en móvil real y calentamiento a 15 minutos. `perf_bot.js` no se pudo ejecutar por la ruta de Chromium (T-F0-01). [N]

### 1.11 Calidad de código y arquitectura
- **Bien.** Sin dependencias, balance en un objeto, módulos por dominio, comentarios que explican el porqué, guardas `try/catch` para piezas opcionales. [V]
- **Falla.** Todo cuelga de los globales `G` y `Assets` y del orden de 92 etiquetas `<script>` (`index.html:28-119`). Líneas muy largas con varias sentencias; archivos de 1.000 a 1.900 líneas. Cada módulo nuevo exige tocar `index.html` y `sw.js`. [V]
- **Falla.** Los parámetros de depuración funcionan en producción: `?god`, `?give=all:30`, `?pf=`, `?reset=1`, `?cmul=` (`src/save.js:217-231`, `src/main.js:20`, `:109`). Cualquier tabla de récords o compra sería trivial de falsear, y `?reset=1` borra la partida con un enlace. [V]
- **Falla.** No hay captura global de errores: si algo falla en el móvil del dueño, no queda rastro. [V: sin `onerror` en `src/`]
- **Falla.** Todos los textos están en español dentro del código (~30 archivos), sin capa de traducción. Es el mayor coste oculto para publicar en portales. [V]

### 1.12 Pruebas y CI
- **Bien.** Batería amplia en `tools/card-swarm-bot/tests.js` (1.066 líneas, 13 grupos) más bots de partida, jefes y rendimiento. [V]
- **Falla grave.** Las herramientas tienen fija la ruta `/opt/pw-browsers/chromium-1194/chrome-linux/chrome` en 57 archivos de `tools/` (`tools/card-swarm-bot/tests.js:13`). En el contenedor actual el navegador es `chromium-1243` y **ninguna prueba ni bot arranca**. Existe un enlace estable, `/opt/pw-browsers/chromium`. [V]
- **Falla.** No hay CI de pruebas: `pages.yml` solo despliega y lo hace con cada push a `main`, sin puerta. [V]
- **Falla.** `tests.js` ejecuta `stamp.py` sobre el repositorio (`tools/card-swarm-bot/tests.js:39`): pasar las pruebas puede modificar `games/card-swarm/sw.js`. [V]
- **Falla.** Conteos desactualizados en la documentación (el README habla de 218 comprobaciones en `all`). [V]
- **Resultado de `tests.js all` en esta revisión** (copia temporal con la ruta corregida, sin tocar el repo): ver la nota al final de esta sección, añadida al terminar la ejecución.

### 1.13 Guardado y datos
- **Bien.** Esquema versionado v12 con cadena de migraciones y copia previa (`src/save.js:63-136`), relleno defensivo de campos (`:141-177`), exportar/importar como texto (`:180-198`), aviso si el navegador no deja guardar (`:50-57`). [V]
- **Falla.** Un solo punto de fallo: `localStorage` del navegador. iOS puede borrar datos de sitios no instalados tras ~7 días sin uso (`MOVIL.md`, sección 6). No hay copia rotativa automática ni recordatorio de exportar. [V]
- **Falla.** El guardado no tiene firma ni validación de rangos: exportar, editar e importar da cualquier progreso. Hoy no importa; con récords o compras, sí. [V]
- **Falla.** Al cambiar de dominio (portal, itch, TWA) el guardado no viaja: cada origen tiene su `localStorage`. [I]

### 1.14 PWA y distribución
- **Bien.** Service worker con precache versionado por hash, actualización solo cuando el jugador acepta y nunca en mitad de una expedición (`src/pwa.js:36-46`), manifest completo con iconos enmascarables, redirección del prototipo antiguo. [V]
- **Falla.** Solo se distribuye en GitHub Pages bajo `xitakha.github.io/Game/`: sin dominio propio, sin página de tienda, sin capturas ni tráiler. [V]
- **Falla.** `pages.yml` aún borra `assets_village_tmp.js`, que ya no existe: resto sin limpiar. [V]
- **No verificado.** Instalación y uso sin conexión en teléfono real (pendiente desde el ROADMAP). [N]

### 1.15 Analítica
- **Falla.** No hay ninguna: ni eventos, ni embudo, ni duración de sesión, ni causa de muerte agregada. Solo `stats.playMs` local. Sin datos no se puede afinar la retención ni negociar con un portal. [V]

### 1.16 Monetización
- **Falla.** No hay nada: ni anuncios, ni compras, ni donación, ni capa de plataforma para SDK de portales. [V]
- **A favor.** El diseño ya tiene sumideros y momentos naturales para recompensas opcionales (reroll, plato, tónico e imán de Rufo, duplicar Brasas del botín) que no tocan el reto del combate. [V que existen; I que sirven]

### 1.17 Marca y marketing
- **Falla.** Nombre sin comprobar frente a otros juegos o marcas, sin eslogan fijado fuera del título ("Apaga las seis llamas"), sin página, sin redes, sin tráiler; los nombres cómicos de los créditos están sin aprobar (`src/assets_cine3.js:568`). [V]

### 1.18 Organización del estudio
- **Bien.** Roles claros, encargos autocontenidos, regla de que solo el CEO hace commit. [V]
- **Falla.** La documentación del estudio está desfasada: `STUDIO.md` y `programmer.md` dicen "Phaser 3 por defecto" y el juego es Canvas 2D sin librerías; `ceo.md` no nombra a `market-researcher`; el ROADMAP mezcla histórico del clásico con lo vigente. [V]
- **Falla.** Ningún agente tiene modelo asignado y faltan roles para lo que viene: balance, rendimiento, UX móvil, monetización y analítica, publicación, dirección de arte, marketing. [V]
- **Falla.** `qa-tester` no puede corregir y `programmer` no tiene criterio de "hecho" con pruebas obligatorias; no hay revisión cruzada definida. [V]

---

## 2. Estrategia de monetización

Principios que no se negocian (derivan de lo que pide el dueño):
1. **Nada de pagar por ganar.** Ninguna compra ni anuncio baja la dificultad de un jefe ni salta un nivel de Peligro.
2. **Anuncios solo si el jugador los pide** (recompensados) y nunca dentro de un combate.
3. **Sin azar de pago** (cajas, gacha) y sin energía ni temporizadores que bloqueen jugar.
4. **Primero retención, luego dinero.** Sin D1 medido no tiene sentido optimizar ingresos.

### 2.1 Opciones comparadas

| Opción | Pros | Contras | Ingreso esperable (cualitativo) | Requisitos técnicos | Requisitos legales | Impacto en la experiencia |
|---|---|---|---|---|---|---|
| A. itch.io gratis con "paga lo que quieras" y enlace de apoyo | Cero integración, público afín a roguelites, comentarios directos, no exige inglés | Poco tráfico orgánico; las donaciones son escasas | Muy bajo; sirve para validar y juntar comunidad | Zip del juego (límite citado en foros: ~1.000 archivos; el juego tiene ~100) | Cuenta del dueño y datos de cobro | Ninguno |
| B. Portales web con su SDK (CrazyGames, Poki) | Tráfico grande ya existente; ellos venden los anuncios y gestionan el consentimiento; reparto de ingresos | Curados: pueden rechazar; piden inglés y buen arranque; Poki prefiere exclusividad web; solo se permiten sus anuncios | Bajo a medio, proporcional a partidas; es la vía realista para un HTML5 sin presupuesto de adquisición | Capa de plataforma con eventos de juego y anuncios; build sin service worker ni enlaces externos; CrazyGames: descarga inicial <= 50 MB y <= 20 MB para portada móvil (el juego pesa 3,4 MB); Poki: se cita un objetivo de < 8 MB iniciales | Aceptar los términos del portal; el consentimiento de anuncios lo gestiona el portal | Bajo si solo hay recompensados y pausas en la aldea |
| C. Anuncios propios en Pages (AdSense para juegos H5 u otra red) | Control total | Tráfico propio casi nulo; hay que montar consentimiento (RGPD), política de privacidad y pasar la aprobación de la red; elegibilidad no verificada | Muy bajo con el tráfico actual | SDK de anuncios, gestor de consentimiento | Política de privacidad, consentimiento en EEE, declarar público objetivo | Medio: riesgo de anuncios invasivos |
| D. Play Store con TWA, gratis con compra única "Apoyar al estudio" (quita anuncios + cosméticos) | Presencia en tienda, instalación real, compra única honesta | Cuenta de desarrollador de pago; las cuentas personales nuevas necesitan prueba cerrada con 12 testers durante 14 días seguidos; las compras digitales deben usar Play Billing (Digital Goods API + Payment Request en TWA); mantenimiento de fichas y políticas | Bajo a medio; depende de la retención | Proyecto TWA, Digital Asset Links, dominio estable, productos en Play Console, asociar compras al jugador | Política de privacidad, ficha de seguridad de datos, clasificación por edades | Bajo |
| E. Premium de pago (itch o Steam con envoltorio) | Modelo limpio, encaja con el género en PC | El juego nació móvil y web; exige controles y resolución de PC pulidos, y una versión con más contenido | Incierto; es otra apuesta | Envoltorio de escritorio, logros de plataforma | Alta de tienda | Ninguno negativo |
| F. Pase de temporada o tienda de cosméticos con moneda de pago | Ingreso recurrente si hay comunidad | Exige eventos en vivo, servidor, antifraude y mucho contenido; prematuro | Nulo sin base de jugadores | Backend, validación de compras | Términos de compra, reembolsos, menores | Riesgo de desviar el diseño |

No se dan cifras de ingresos: dependen del tráfico y de la retención, que hoy no se miden. Cualquier número sería inventado.

### 2.2 Recomendación por fases

1. **Ahora (tras F0 y F1): opción A.** Publicar en itch.io gratis con donación voluntaria. Objetivo: comentarios de jugadores reales y primeras cifras de retención con analítica propia sin datos personales.
2. **Cuando D1 y la duración de sesión sean decentes: opción B.** Capa de plataforma única (`G.Platform`) y envío a CrazyGames (lanzamiento básico sin monetización, después completo con reparto) y solicitud a Poki. Antes hay que decidir la exclusividad web que Poki prefiere. Recompensados diseñados en la aldea y en el botín, nunca en combate.
3. **Solo si B demuestra retención: opción D.** Play Store con TWA y compra única de apoyo. Los datos del portal dirán si compensa el coste de la cuenta, los 12 testers y el mantenimiento.
4. **Descartado por ahora:** C (poco tráfico y mucha carga legal), F (prematuro). E queda como idea para una edición de PC si el juego tiene tirón.

### 2.3 Dónde pueden ir las recompensas opcionales sin tocar el reto

| Momento | Recompensa | Por qué no trivializa |
|---|---|---|
| Pantalla de botín | +50 % de Brasas de esa expedición (tope diario) | Acelera la meta, no el combate; ya existe la duración Larga con x1,15 |
| Aldea, carro de Rufo | Un Tónico o Imán gratis al día | Ya se compran con Brasas |
| Aldea, Tía Castaña | Un plato gratis al día | Ya existe y tiene cupo de 1 por salida |
| Oferta de cartas | 1 reroll extra por expedición | El reroll ya existe; no da poder directo |
| Reto diario | Un segundo intento | No afecta a la campaña |

Queda fuera, salvo que el dueño diga lo contrario: revivir en combate, saltar jefes, comprar trofeos o Esencia.

### 2.4 Fuentes consultadas (2026-11)

Los sitios oficiales `docs.crazygames.com` y `developers.poki.com` no se pudieron abrir desde esta sesión (dominios fuera de la red permitida); los datos de portales proceden de los resúmenes del buscador sobre esas páginas y de guías de terceros. **Hay que confirmarlos en la documentación oficial antes de decidir.**
- CrazyGames, requisitos técnicos y FAQ: https://docs.crazygames.com/requirements/technical/ · https://docs.crazygames.com/requirements/intro/ · https://docs.crazygames.com/faq/
- Poki, requisitos y acuerdos: https://sdk.poki.com/requirements · https://sdk.poki.com/deals · guía de terceros: https://app.cinevva.com/guides/publish-game-poki
- Comparativa de portales (terceros): https://playgama.com/blog/?p=14181
- Play Billing en TWA (oficial): https://developer.chrome.com/docs/android/trusted-web-activity/play-billing · https://developer.chrome.com/docs/android/trusted-web-activity/receive-payments-play-billing
- Regla de 12 testers y 14 días (ayuda oficial y guías): https://support.google.com/googleplay/android-developer/answer/14151465?hl=en · https://www.testerscommunity.com/guides/how-many-testers-do-you-need-google-play
- itch.io, límites de juegos HTML5 (foros; documentación oficial en https://itch.io/docs/creators/html5): https://itch.io/t/5327199/too-many-files-in-zip-to-load-game
- Retención (resúmenes del informe de GameAnalytics 2026 y otros): https://gameindustrylibrary.com/documents/gameanalytics-mobile-and-pc-game-benchmarks-in-2026-sponsored-by-pwn-games · https://segwise.ai/blog/mobile-gaming-app-user-retention-strategies · https://appagent.com/?p=61637

No verificado: elegibilidad de AdSense para juegos H5, porcentajes exactos de reparto de cada portal y si los portales exigen inglés (es lo habitual, pero no salió en los resultados).

---

## 3. Criterio para asignar modelos

| Modelo | Identificador | Úsalo para | No lo uses para |
|---|---|---|---|
| Fable 5.2 | `claude-fable-5-2` | Decisiones caras de revertir: balance y economía, arquitectura, diseño de experimentos, revisión crítica final de una fase | Implementar, renombrar, capturas |
| Opus 5.5 | `claude-opus-5-5` | Diseño de sistemas y de experiencia, especificaciones, revisión de código delicado, estrategia de monetización | Tareas con receta clara |
| Sonnet 5.5 | `claude-sonnet-5-5` | Implementación general, herramientas, pruebas nuevas, integración de SDK | Decidir el balance o la arquitectura |
| Haiku 5.5 | `claude-haiku-5-5` | Trabajo mecánico: sustituciones, inventarios con grep, capturas, repetir pruebas, actualizar documentos | Cualquier cosa con ambigüedad |

Reglas:
1. **Paga por el riesgo, no por el tamaño.** Una tarea pequeña que puede romper el reto (un multiplicador de daño) va a Fable; una grande pero mecánica (extraer 2.000 textos) va a Haiku con una muestra revisada por Opus.
2. **Separa pensar de teclear.** El modelo caro escribe la especificación y el criterio de aceptación; Sonnet implementa; Haiku repite y mide.
3. **Sube un escalón** si la tarea falla dos veces, si toca guardado o migraciones, o si afecta a dinero o privacidad.
4. **Baja un escalón** cuando la tarea ya tiene especificación cerrada y pruebas que la cubren.
5. **Esfuerzo:** bajo para lo mecánico, medio por defecto, alto solo en balance, arquitectura y revisiones de cierre de fase.
6. **Revisión cruzada:** todo cambio de `src/` lo revisa un agente distinto del que lo escribió; los de balance y guardado, con Fable u Opus.

---

## 4. Agentes

| Agente | Estado | Rol | Herramientas | Modelo por defecto | Súbelo cuando | Bájalo cuando |
|---|---|---|---|---|---|---|
| `ceo` | existe | Habla con el dueño, prioriza, delega, hace commit | Agent, Read, Write, Edit, Glob, Grep, Bash, WebSearch, WebFetch, AskUserQuestion | El de la sesión principal (recomendado Fable 5.2) | Planificación de fase y revisión de cierre | Sesiones de puro despacho de tareas: Opus 5.5 |
| `game-designer` | existe | Mecánicas, contenido, especificaciones de sistemas | Read, Write, Edit, Glob, Grep, WebSearch, WebFetch | Opus 5.5 | Sistemas que cambian el bucle (reto diario, eventos): Fable | Redactar textos y diálogos: Sonnet |
| `balance-designer` | **nuevo** | Balance numérico, economía, diseño de experimentos con bots | Read, Write, Edit, Glob, Grep, Bash | Fable 5.2 | Ya está arriba | Lanzar lotes ya definidos y tabular: Haiku |
| `programmer` | existe | Implementa el juego | Read, Write, Edit, Glob, Grep, Bash, WebSearch, WebFetch | Sonnet 5.5 | Guardado, migraciones, bucle principal: Opus | Sustituciones mecánicas: Haiku |
| `performance-engineer` | **nuevo** | Mide y optimiza carga, frame-time, memoria y batería | Read, Write, Edit, Glob, Grep, Bash | Sonnet 5.5 | Rediseño de estructuras (rejilla espacial, bucle): Opus | Repetir mediciones: Haiku |
| `ux-designer` | **nuevo** | UX/UI móvil, onboarding, legibilidad y accesibilidad | Read, Write, Edit, Glob, Grep, Bash | Opus 5.5 | Rediseño del primer minuto o del HUD completo: Fable | Auditorías con lista cerrada y capturas: Haiku |
| `art-director` | **nuevo** | Dirección de arte, VFX y cinemáticas (cubre al "director de cinemáticas") | Read, Write, Edit, Glob, Grep, Bash | Opus 5.5 | Identidad visual o rediseño de un personaje: Fable | Variantes y retoques con guía cerrada: Sonnet |
| `audio-designer` | existe | Música y efectos procedurales | Read, Write, Edit, Glob, Grep, Bash, WebSearch, WebFetch | Sonnet 5.5 | Dirección sonora de un bioma entero: Opus | Ajustes de volumen: Haiku |
| `tools-engineer` | existe | Bots, simuladores, empaquetado | Read, Write, Edit, Glob, Grep, Bash, WebSearch, WebFetch | Sonnet 5.5 | Diseño del banco de balance: Opus | Arreglos de rutas y scripts: Haiku |
| `qa-tester` | existe | Pruebas, informes, lista de entrega | Read, Write, Edit, Glob, Grep, Bash | Sonnet 5.5 | Investigar un fallo intermitente: Opus | Pasar la batería y capturar: Haiku |
| `monetization-analyst` | **nuevo** | Monetización, analítica, privacidad y lectura de datos | Read, Write, Edit, Glob, Grep, Bash, WebSearch, WebFetch | Opus 5.5 | Decisión de modelo de negocio: Fable | Tabular eventos y exportes: Haiku |
| `release-manager` | **nuevo** | CI, builds, publicación en Pages, itch, portales y tienda | Read, Write, Edit, Glob, Grep, Bash, WebSearch, WebFetch | Sonnet 5.5 | Estrategia de ramas y puertas de calidad: Opus | Listas de comprobación y notas de versión: Haiku |
| `marketing-manager` | **nuevo** | Página de tienda, textos, capturas, tráiler, comunidad | Read, Write, Edit, Glob, Grep, Bash, WebSearch, WebFetch | Sonnet 5.5 | Posicionamiento y nombre: Opus | Recortar capturas, variantes de texto: Haiku |
| `market-researcher` | existe | Estudia el mercado y propone ideas | Read, Write, Edit, Glob, Grep, WebSearch, WebFetch | Sonnet 5.5 | Informe que decide el siguiente juego: Opus | Recopilar fichas: Haiku |
| `asset-scout` | existe | Busca recursos libres y registra licencias | Read, Write, Edit, Glob, Grep, Bash, WebSearch, WebFetch | Haiku 5.5 | Dudas de licencia: Sonnet | Ya está abajo |

Decisiones sobre agentes:
- No se crea un "director de cinemáticas" aparte: lo cubre `art-director`, porque el motor de cinemáticas ya existe y lo pendiente es arte y ritmo.
- No se amplía `game-designer` con el balance: quien diseña una mecánica no debe ser quien certifica sus números.
- A los agentes existentes solo se les añade la línea `model:`; su texto no cambia. La mención a Phaser y la lista de equipo de `ceo.md` se corrigen en T-F0-09, con permiso del dueño.

---

## 5. Backlog priorizado

Formato de cada tarea: **objetivo y por qué** · **pasos** · **archivos** · **responsable (modelo, esfuerzo)** y apoyo · **dependencias** · **aceptación** · **pruebas** · **riesgo y reversión** · **tamaño** · **decisión del dueño**.

Resumen: F0 con 13 tareas, F1 con 11, F2 con 8, F3 con 10, F4 con 6. Total: 48.

### F0. Limpieza y deudas (13 tareas)

Meta de la fase: que lo publicado sea el juego real (con reto), que las pruebas vuelvan a correr y protejan cada despliegue, y que el estudio trabaje sobre documentación cierta.

#### T-F0-01 Reparar las herramientas de prueba (ruta del navegador)
- **Objetivo y por qué.** Hoy ninguna prueba ni bot arranca en el contenedor actual. Sin pruebas no se puede tocar nada con seguridad; es la base de todo lo demás.
- **Pasos.** (1) Crear `tools/lib/browser.js` que exporte `launch()` y resuelva el ejecutable en este orden: variable `PW_CHROME`, `/opt/pw-browsers/chromium`, el navegador por defecto de Playwright. (2) Sustituir la ruta fija en los 57 archivos de `tools/` que la contienen. (3) Hacer que `tests.js` no ejecute `stamp.py` sobre el repo: que trabaje sobre una copia temporal. (4) Pasar `tests.js all` y anotar el número real de comprobaciones.
- **Archivos.** `tools/lib/browser.js` (nuevo), `tools/card-swarm-bot/*.js`, `tools/card-swarm-iso/*.js`, `tools/fx2-lab/*.js`, `tools/card-swarm-clasico-*/**`.
- **Responsable.** `tools-engineer` con Sonnet 5.5, esfuerzo bajo (el diseño del ayudante es corto; la sustitución es mecánica y puede delegarse en Haiku). Apoyo: `qa-tester` (Haiku) pasa la batería.
- **Dependencias.** Ninguna.
- **Aceptación.** `grep -r "chromium-1194" tools/` devuelve 0; `tests.js all` termina con 0 fallos; tras pasarla, `git status` está limpio.
- **Pruebas.** La propia batería; una comprobación nueva que falle si `sw.js` cambia durante las pruebas.
- **Riesgo y reversión.** Bajo. Revertir el commit.
- **Tamaño.** S. **Decisión del dueño.** Ninguna.

#### T-F0-02 Pruebas automáticas en cada PR y puerta antes de desplegar
- **Objetivo y por qué.** `pages.yml` publica cualquier push a `main` sin comprobar nada. Un error llega directo al móvil del dueño y, más adelante, a los jugadores.
- **Pasos.** (1) Nuevo workflow `tests.yml`: instala Playwright con Chromium en el runner, levanta `tools/serve.py`, ejecuta `tests.js all` en PR y en push a `main`. (2) En `pages.yml`, hacer que el despliegue dependa de ese trabajo. (3) Guardar el registro como artefacto. (4) Quitar la línea `rm -f _site/card-swarm/src/assets_village_tmp.js`.
- **Archivos.** `.github/workflows/tests.yml` (nuevo), `.github/workflows/pages.yml`.
- **Responsable.** `release-manager` con Sonnet 5.5, esfuerzo medio. Apoyo: `tools-engineer`.
- **Dependencias.** T-F0-01.
- **Aceptación.** Un PR con un fallo deliberado queda en rojo y no despliega; uno correcto despliega; duración del trabajo por debajo de 15 minutos.
- **Pruebas.** PR de prueba con un fallo forzado, que luego se cierra sin fusionar.
- **Riesgo y reversión.** Pruebas inestables que bloqueen despliegues: permitir un reintento y marcar las inestables. Revertir el workflow.
- **Tamaño.** M. **Decisión del dueño.** Aceptar que un despliegue tarde unos minutos más.

#### T-F0-03 Retirar la inmortalidad por defecto y cerrar los parámetros de depuración
- **Objetivo y por qué.** El juego publicado es inmortal salvo `?god=0` (`src/main.js:20`). Mientras siga así, nadie juega el reto real y el balance no se puede validar. Además `?give`, `?pf`, `?cmul`, `?reset=1` funcionan en producción.
- **Pasos.** (1) `G.god` pasa a valer 0 por defecto. (2) Todos los parámetros que alteran progreso o dificultad solo se leen si la URL lleva `?dev=1` o el host es `localhost`. (3) `?reset=1` pide confirmación. (4) Los bots añaden `dev=1`.
- **Archivos.** `src/main.js`, `src/save.js`, `src/armor.js`, `src/fusion.js`, `src/cine.js`, `tools/card-swarm-bot/*.js`.
- **Responsable.** `programmer` con Sonnet 5.5, esfuerzo bajo. Revisión: `qa-tester` (Sonnet).
- **Dependencias.** T-F0-01. Conviene hacerla después de T-F0-12, para que el dueño acabe sus pruebas actuales.
- **Aceptación.** En URL limpia `G.god === false`; `?give=all:30` sin `dev=1` no cambia el guardado; la batería pasa.
- **Pruebas.** Grupo nuevo `dev` en `tests.js`: 6 comprobaciones, una por parámetro sensible, con y sin `dev=1`.
- **Riesgo y reversión.** Que el dueño pierda su modo de prueba: conserva `?dev=1&god=1`. Revertir el commit.
- **Tamaño.** S. **Decisión del dueño.** Fecha a partir de la cual quiere jugar sin inmortalidad.

#### T-F0-04 Deshacer la doble definición de `Assets.cine3`
- **Objetivo y por qué.** Audio y arte escriben la misma propiedad y funciona por orden de carga. Un cambio de orden (por ejemplo al empaquetar en T-F0-10) dejaría el epílogo sin arte o sin sonido.
- **Pasos.** (1) El audio queda solo en `G.Snd.cine3` y `Assets.sfxCine3`. (2) Borrar `A.cine3 = cine3` de `src/sfx_cine3.js:150`. (3) Quitar las guardas `typeof ... === 'object'` que ya no hacen falta.
- **Archivos.** `src/sfx_cine3.js`, `src/aldea.js`, `src/ending.js`, `ASSETS_API.md`.
- **Responsable.** `programmer` con Haiku 5.5, esfuerzo bajo (cambio mecánico con especificación cerrada). Revisión: `audio-designer`.
- **Dependencias.** T-F0-01.
- **Aceptación.** Solo `assets_cine3.js` asigna `Assets.cine3`; el grupo `cine` de la batería pasa.
- **Pruebas.** Una comprobación: `typeof Assets.cine3 === 'object' && typeof G.Snd.cine3 === 'function'`.
- **Riesgo y reversión.** Mínimo. Revertir.
- **Tamaño.** S. **Decisión del dueño.** Ninguna.

#### T-F0-05 Simulación reproducible con `?seed` y dificultad igual en todos los dispositivos
- **Objetivo y por qué.** Sin reproducibilidad no hay balance fiable, ni reto diario, ni récords comparables. Y hoy el móvil juega con menos enemigos que el PC (`src/mobile.js:24-26`, `src/waves.js:145`).
- **Pasos.** (1) Auditar qué lee la simulación fuera de `G.rng` y de `G.time`: reloj real, `G.Q.enemyMul`, `G.Q.projCap`, topes de partículas, `performance.now()`. (2) Separar "calidad visual" de "reglas": `enemyMul` y `projCap` dejan de depender de la calidad o se compensan de forma que el reto sea equivalente. (3) Modo de prueba que avance por pasos fijos (`G.step`) sin reloj real. (4) Prueba: dos ejecuciones con la misma semilla y las mismas entradas dan el mismo estado en 12 puntos de control.
- **Archivos.** `src/main.js`, `src/mobile.js`, `src/waves.js`, `src/enemies.js`, `src/fx.js`, `tools/card-swarm-bot/tests.js`.
- **Responsable.** `programmer` con Sonnet 5.5, esfuerzo alto. Diseño y revisión: `balance-designer` con Fable 5.2 (decide cómo se compensa la calidad BAJA; es una decisión de reto). Apoyo: `performance-engineer`.
- **Dependencias.** T-F0-01.
- **Aceptación.** Misma semilla y mismas entradas: estado idéntico (vida, bajas, posición, nivel) a los 60, 180 y 420 s, en ALTA y en BAJA.
- **Pruebas.** Grupo nuevo `seed` (al menos 12 puntos de control por calidad).
- **Riesgo y reversión.** Quitar la reducción de enemigos puede bajar los fps en móviles modestos: medir con T-F2-07 y, si hace falta, compensar con enemigos más duros en vez de menos. Revertir por commit.
- **Tamaño.** M. **Decisión del dueño.** Si acepta que un móvil lento vea menos enemigos pero más resistentes, o prefiere el mismo número aunque baje la fluidez.

#### T-F0-06 Quitar las pistas de teclado en pantallas táctiles
- **Objetivo y por qué.** "E", "Tab", "Q/E" y "Enter" en un teléfono confunden y dan aspecto de port sin terminar.
- **Pasos.** (1) Inventario con grep de todos los textos de ayuda con nombres de tecla. (2) Función única `G.hint(tecla, textoTactil)` que elige según `G.Sys.isTouch()`. (3) Sustituir los textos. (4) Capturas antes y después en 844x390.
- **Archivos.** `src/panels.js`, `src/aldea.js`, `src/base.js`, `src/hud.js`, `src/fusion.js`, `src/smith.js`, `src/tree.js`, `src/manual.js`.
- **Responsable.** `ux-designer` con Haiku 5.5 para el inventario y la lista de textos; `programmer` con Sonnet 5.5, esfuerzo bajo, para el cambio.
- **Dependencias.** T-F0-01.
- **Aceptación.** En modo táctil, ninguna de las pantallas del inventario muestra nombres de tecla; en escritorio siguen saliendo.
- **Pruebas.** Ampliar `textcheck.js` con una lista negra de nombres de tecla en modo táctil.
- **Riesgo y reversión.** Bajo. Revertir.
- **Tamaño.** S. **Decisión del dueño.** Ninguna.

#### T-F0-07 Marlo: mapache o corderito
- **Objetivo y por qué.** El protagonista se dibuja como mapache y el guion lo llama corderito. La identidad del personaje es parte de la marca.
- **Pasos.** (1) El dueño elige. (2a) Si es mapache: reescribir las líneas que dicen "cordero" o "corderito" y la frase de la intro. (2b) Si es cordero: rediseñar el sprite de Marlo y sus variantes con armadura.
- **Archivos.** (2a) `src/cine_intro.js`, `src/aldea.js`, `DESIGN-v9-cinematicas.md`. (2b) `src/assets.js`, `src/assets_armor*.js`, `src/assets_cine*.js`.
- **Responsable.** (2a) `game-designer` con Sonnet 5.5, esfuerzo bajo, para los textos y `programmer` con Haiku para aplicarlos. (2b) `art-director` con Opus 5.5, esfuerzo alto.
- **Dependencias.** Decisión del dueño.
- **Aceptación.** Ningún texto contradice al sprite; `textcheck` pasa.
- **Pruebas.** Comprobación de que las cadenas antiguas ya no aparecen (2a) o capturas aprobadas por el dueño (2b).
- **Riesgo y reversión.** (2b) es cara y toca muchas piezas. Revertir por commit.
- **Tamaño.** S (2a) o L (2b). **Decisión del dueño.** Sí: qué es Marlo.

#### T-F0-08 Aprobar los nombres de los créditos
- **Objetivo y por qué.** Los créditos llevan nombres cómicos sin aprobar; es la firma del estudio.
- **Pasos.** (1) Listar los textos de `CRED` en `src/assets_cine3.js:568`. (2) El dueño los aprueba o cambia. (3) Aplicar.
- **Archivos.** `src/assets_cine3.js`, `src/ending.js`.
- **Responsable.** `marketing-manager` con Haiku 5.5, esfuerzo bajo.
- **Dependencias.** Ninguna.
- **Aceptación.** Lista firmada por el dueño en el PR.
- **Pruebas.** `textcheck` sobre la pantalla de créditos.
- **Riesgo y reversión.** Nulo.
- **Tamaño.** S. **Decisión del dueño.** Sí: los nombres.

#### T-F0-09 Poner al día la documentación del estudio
- **Objetivo y por qué.** `STUDIO.md` y `programmer.md` hablan de Phaser, `ceo.md` no conoce a todo el equipo, el README cita conteos de pruebas antiguos. Los agentes leen esto al empezar y heredan los errores.
- **Pasos.** (1) Corregir la mención a Phaser por "Canvas 2D sin librerías". (2) Añadir a `ceo.md` la lista completa de agentes. (3) Actualizar los conteos del README con el resultado de T-F0-01. (4) Marcar con una cabecera los documentos heredados del clásico. (5) Decidir si `games/card-swarm-clasico` sale de `main` (ya existe la rama de archivo).
- **Archivos.** `studio/STUDIO.md`, `.claude/agents/ceo.md`, `.claude/agents/programmer.md`, `games/card-swarm/README.md`, `games/card-swarm/*.md`.
- **Responsable.** `release-manager` con Haiku 5.5, esfuerzo bajo.
- **Dependencias.** T-F0-01.
- **Aceptación.** Ninguna mención a Phaser como stack del juego; conteos coinciden con la batería.
- **Pruebas.** Ninguna automática.
- **Riesgo y reversión.** Nulo.
- **Tamaño.** S. **Decisión del dueño.** Permiso para editar `ceo.md` y `programmer.md`; si se retira el clásico de `main`.

#### T-F0-10 Empaquetado para producción (un solo archivo minificado)
- **Objetivo y por qué.** 92 peticiones y 3,4 MB de JS sin minificar penalizan la primera carga, que es donde se pierde al jugador de portal. Además deja el juego listo para los límites de los portales.
- **Pasos.** (1) Script `tools/build/build.py` o `build.js` que lea el orden de `index.html`, concatene, minifique sin renombrar globales y genere `dist/` con un `index.html` de una sola etiqueta. (2) `stamp.py` trabaja sobre `dist/`. (3) El desarrollo sigue con los 92 archivos. (4) `pages.yml` despliega `dist/`. (5) Medir antes y después.
- **Archivos.** `tools/build/` (nuevo), `tools/card-swarm-pwa/stamp.py`, `.github/workflows/pages.yml`.
- **Responsable.** `tools-engineer` con Sonnet 5.5, esfuerzo medio. Apoyo: `performance-engineer` mide; `release-manager` integra.
- **Dependencias.** T-F0-02, T-F0-04.
- **Aceptación.** La batería pasa contra `dist/`; peticiones de script <= 3; tamaño transferido con compresión al menos un 40 % menor que hoy (estimación a confirmar con la medición).
- **Pruebas.** La batería acepta `base=` apuntando a `dist/`; CI la pasa en ambos modos.
- **Riesgo y reversión.** Un minificador puede romper código que depende de nombres: usar solo eliminación de espacios y comentarios al principio. `pages.yml` puede volver a publicar la carpeta sin empaquetar.
- **Tamaño.** M. **Decisión del dueño.** Ninguna.

#### T-F0-11 Registro de errores en el dispositivo
- **Objetivo y por qué.** Si el juego falla en el móvil del dueño o de un jugador, hoy no queda rastro.
- **Pasos.** (1) `window.onerror` y `unhandledrejection` guardan los últimos 20 errores (mensaje, archivo, línea, estado del juego, versión) en `localStorage`. (2) Botón "Copiar informe" en Ajustes. (3) Aviso discreto tras un error.
- **Archivos.** `src/main.js` o `src/diag.js` (nuevo), `src/panels.js`, `index.html`, `sw.js` vía `stamp.py`.
- **Responsable.** `programmer` con Sonnet 5.5, esfuerzo bajo.
- **Dependencias.** T-F0-01.
- **Aceptación.** Un error provocado aparece en el informe con archivo y línea; el juego no se queda en negro.
- **Pruebas.** 3 comprobaciones nuevas: captura, límite de 20, copia.
- **Riesgo y reversión.** Bajo. Revertir.
- **Tamaño.** S. **Decisión del dueño.** Ninguna.

#### T-F0-12 Sesión guiada en el móvil del dueño
- **Objetivo y por qué.** Nada se ha probado en teléfono real: rendimiento, textos, instalación, uso sin conexión. Es la mayor incógnita del proyecto y solo el dueño puede despejarla.
- **Pasos.** (1) `qa-tester` prepara una hoja de 20 minutos: instalar, jugar 2 expediciones (una con `?god=0`), prueba térmica de `MOVIL.md` sección 7, modo avión, lista de 15 textos que leer en voz alta, alcance de los 4 botones. (2) El dueño la rellena y pega el JSON de `?perf=1`. (3) `ux-designer` y `performance-engineer` convierten el resultado en tareas.
- **Archivos.** `studio/docs/PRUEBA-MOVIL.md` (nuevo).
- **Responsable.** `qa-tester` con Haiku 5.5, esfuerzo bajo, para la hoja; `ux-designer` con Opus 5.5 para leer los resultados.
- **Dependencias.** Ninguna.
- **Aceptación.** Hoja rellena con modelo de móvil, fps, p95 y lista de textos ilegibles.
- **Pruebas.** No aplica.
- **Riesgo y reversión.** Ninguno.
- **Tamaño.** S. **Decisión del dueño.** Sí: dedicar 20 minutos.

#### T-F0-13 Ember Flock en el sitio público
- **Objetivo y por qué.** El índice de Pages enlaza un juego sin controles táctiles. Quien entre desde el móvil se lleva mala impresión del estudio.
- **Pasos.** (1) Elegir: retirarlo del índice, marcarlo "solo escritorio" o darle joystick. (2) Aplicar en `tools/site/index.html` y, si procede, en `pages.yml`.
- **Archivos.** `tools/site/index.html`, `.github/workflows/pages.yml`, `games/survival-lamb/`.
- **Responsable.** `release-manager` con Haiku 5.5, esfuerzo bajo (retirar o etiquetar). Si se le dan controles: `programmer` con Sonnet 5.5.
- **Dependencias.** Ninguna.
- **Aceptación.** Desde un móvil no se llega a un juego injugable.
- **Pruebas.** Comprobación manual.
- **Riesgo y reversión.** Nulo.
- **Tamaño.** S. **Decisión del dueño.** Sí: qué hacer con Ember Flock.

### F1. Retención y primera sesión (11 tareas)

Meta de la fase: que un jugador nuevo esté combatiendo en menos de un minuto, entienda qué hacer, quiera otra partida y tenga un motivo para volver mañana. Y poder medirlo.

#### T-F1-01 Analítica mínima y respetuosa
- **Objetivo y por qué.** Sin datos, la retención y el balance se ajustan a ciegas, y ningún portal ni tienda se puede evaluar.
- **Pasos.** (1) `monetization-analyst` define el esquema: `session_start`, `intro_end`, `run_start`, `level_up`, `fusion`, `run_end` (causa, tiempo, bioma, Peligro), `boss_start`, `boss_end`, `craft`, `quit_point`. (2) Capa `G.Track(evento, datos)` que siempre guarda un resumen local y, si hay consentimiento y proveedor, lo envía en lotes. (3) Sin identificadores personales: un id aleatorio por instalación. (4) Panel "Mis estadísticas" con el resumen local.
- **Archivos.** `src/track.js` (nuevo), llamadas en `src/main.js`, `src/loot.js`, `src/cards.js`, `src/fusion.js`, `src/boss.js`, `src/panels.js`.
- **Responsable.** `monetization-analyst` con Opus 5.5, esfuerzo medio (esquema, privacidad). Implementa `programmer` con Sonnet 5.5.
- **Dependencias.** T-F0-03.
- **Aceptación.** Una partida completa genera la secuencia esperada de eventos; sin consentimiento no sale ninguna petición de red; el resumen local sobrevive a recargar.
- **Pruebas.** Grupo `track`: 10 comprobaciones de secuencia y una de "cero red sin consentimiento".
- **Riesgo y reversión.** Privacidad: empezar solo con el modo local. Un interruptor apaga el envío.
- **Tamaño.** M. **Decisión del dueño.** Sí: solo local, o envío a un servicio (cuál) con aviso de privacidad.

#### T-F1-02 Primera sesión: combate en menos de 60 segundos
- **Objetivo y por qué.** Hoy hay ~27 s de intro obligatoria y luego una aldea con 7 NPC antes de jugar. El jugador debe sentir el juego antes de leer.
- **Pasos.** (1) `ux-designer` especifica el flujo nuevo: título, toque, 6-8 s de intro abreviada (el resto se ve al volver), primera expedición directa en el Bosque. (2) Tres avisos contextuales dentro de esa partida: moverse, recoger gemas, elegir carta; el cuarto llega con la primera fusión. (3) Al volver, la aldea se presenta por pasos: primero Lanudo y el Portal; el resto de NPC aparece con las salidas 2, 3 y 4. (4) La intro completa queda en el Archivo.
- **Archivos.** `src/cine_intro.js`, `src/cine.js`, `src/aldea.js`, `src/hud.js`, `src/cards.js`, `src/save.js` (flags nuevos, sin subir de versión si solo son `flags`).
- **Responsable.** `ux-designer` con Opus 5.5, esfuerzo alto (especificación con guion de pantallas). Implementa `programmer` con Sonnet 5.5, esfuerzo alto. Apoyo: `game-designer`, `art-director`.
- **Dependencias.** T-F0-06, T-F1-01 (para medir el antes y el después).
- **Aceptación.** En cuenta nueva, del primer toque al primer enemigo pasan menos de 60 s; el embudo `session_start` → `run_start` se mide; las cuentas con progreso no ven nada nuevo.
- **Pruebas.** Grupo `fte` (primera vez): tiempos, avisos mostrados una sola vez, cuentas antiguas intactas.
- **Riesgo y reversión.** Tocar el arranque puede romper la migración de cuentas existentes: probar con guardados v9-v12. Un flag devuelve el flujo antiguo.
- **Tamaño.** L. **Decisión del dueño.** Sí: si acepta acortar la intro la primera vez.

#### T-F1-03 Ritmo de los primeros 90 segundos de la expedición
- **Objetivo y por qué.** El primer minuto es plano (medido). Hay que dar acción y una primera decisión pronto, sin bajar el reto del resto de la partida.
- **Pasos.** (1) Medir con bot recolector: instante de cada subida de nivel y enemigos vivos por tramo de 10 s. (2) Proponer cambios solo en el arranque: más enemigos débiles en los primeros 45 s, primera subida antes del segundo 20, radio de recogida inicial mayor que decae. (3) Comprobar que la curva a partir del minuto 2 no cambia.
- **Archivos.** `src/main.js` (tabla `G.B`: `bp`, `cap`, `xp.first`, `player.pickup`), `src/waves.js`.
- **Responsable.** `balance-designer` con Fable 5.2, esfuerzo alto (es balance del bucle central). Implementa `programmer` con Sonnet 5.5. Apoyo: `tools-engineer` para el bot.
- **Dependencias.** T-F0-05.
- **Aceptación.** Con bot recolector y semilla fija: primera oferta de carta antes del segundo 20, al menos 12 enemigos vivos en el segundo 30, y nivel en el minuto 3 dentro de +-1 respecto a hoy.
- **Pruebas.** Punto de control nuevo en el grupo `balance`.
- **Riesgo y reversión.** Regalar poder temprano trivializa el Bosque: por eso se fija el nivel del minuto 3. Las cifras son perillas; revertir es cambiar la tabla.
- **Tamaño.** M. **Decisión del dueño.** Ninguna si se respeta el criterio; se le enseña el antes y el después.

#### T-F1-04 Pantalla de fin que empuja a la siguiente partida
- **Objetivo y por qué.** El momento de la derrota es donde se decide "otra más" o cerrar. Hoy solo se informa del botín.
- **Pasos.** (1) Especificar tres bloques: récord personal de esa ruta (tiempo, vida que le quedaba al jefe), "te falta poco" (los 2 objetivos más cercanos: una carta, un nodo, un logro, un encargo) y consejo según la causa de muerte (ya se cuenta el daño por fuente con `G.dbg`). (2) Implementar con datos que ya existen en `L.summary`.
- **Archivos.** `src/base.js`, `src/hud.js`, `src/loot.js`, `src/quests.js`, `src/save.js` (récords por ruta en `stats`).
- **Responsable.** `ux-designer` con Opus 5.5, esfuerzo medio. Implementa `programmer` con Sonnet 5.5.
- **Dependencias.** T-F1-01.
- **Aceptación.** Tras cualquier derrota se muestra al menos un objetivo alcanzable en 1-2 partidas; todo texto >= 12 px lógicos.
- **Pruebas.** 8 comprobaciones: récord nuevo, sin objetivos, cuenta completa, práctica.
- **Riesgo y reversión.** Sobrecargar la pantalla: máximo 3 líneas nuevas. Revertir.
- **Tamaño.** M. **Decisión del dueño.** Ninguna.

#### T-F1-05 Reto diario con semilla
- **Objetivo y por qué.** Es el gancho de regreso más barato y honesto: una partida igual para todos cada día, con su marca.
- **Pasos.** (1) Semilla = fecha UTC; bioma, anclas y duración fijados por la semilla entre lo que el jugador tiene desbloqueado. (2) Un intento con recompensa al día; reintentos sin recompensa. (3) Marcador local de los últimos 30 días. (4) Texto para compartir el resultado. (5) Dejar preparado el dato para una tabla en línea futura.
- **Archivos.** `src/daily.js` (nuevo), `src/panels.js` (Portal o Tablón), `src/save.js` (campo `daily`, migración v13), `src/loot.js`.
- **Responsable.** `game-designer` con Opus 5.5, esfuerzo medio, para reglas y recompensa. Implementa `programmer` con Sonnet 5.5, esfuerzo alto (toca guardado: revisión con Opus). Apoyo: `balance-designer` para la recompensa.
- **Dependencias.** T-F0-05.
- **Aceptación.** Dos dispositivos con la misma fecha reciben las mismas ofertas y oleadas; la recompensa se cobra una vez; cambiar la hora del sistema hacia atrás no la repite.
- **Pruebas.** Grupo `daily`: semilla por fecha, un cobro, migración v12 → v13 con copia.
- **Riesgo y reversión.** Migración de guardado: copia previa como en las anteriores. El modo se puede ocultar con un flag.
- **Tamaño.** L. **Decisión del dueño.** Sí: qué da el reto diario (Brasas, PF, cosmético).

#### T-F1-06 Objetivos diarios y semanales con racha amable
- **Objetivo y por qué.** Dar un motivo corto para abrir el juego cada día sin castigar al que falta.
- **Pasos.** (1) Tres objetivos diarios generados a partir de los encargos existentes y uno semanal. (2) Racha de visitas con un día de gracia: no se pierde por faltar una vez. (3) Recompensas modestas y con tope. (4) Indicador en la aldea.
- **Archivos.** `src/quests.js`, `src/aldea.js`, `src/panels.js`, `src/save.js`.
- **Responsable.** `game-designer` con Opus 5.5, esfuerzo medio. Implementa `programmer` con Sonnet 5.5. Apoyo: `balance-designer` para los topes.
- **Dependencias.** T-F1-05 (comparte la migración v13).
- **Aceptación.** Un jugador que entra 5 de 7 días conserva la racha; la suma semanal de recompensas no supera el botín de 2 expediciones normales.
- **Pruebas.** 10 comprobaciones con fecha simulada.
- **Riesgo y reversión.** Inflación de la economía: por eso el tope. Flag de apagado.
- **Tamaño.** M. **Decisión del dueño.** Ninguna si se respeta el tope.

#### T-F1-07 Presentar la economía por pasos
- **Objetivo y por qué.** Siete recursos de golpe abruman. Hay que enseñarlos cuando hacen falta.
- **Pasos.** (1) Mapa de "primera vez que importa" de cada recurso. (2) Ocultar en HUD, botín y Portal lo que aún no se puede usar. (3) Una línea de explicación la primera vez que aparece cada uno. (4) Revisar si algún recurso puede fusionarse con otro sin perder profundidad, solo como propuesta.
- **Archivos.** `src/aldea.js`, `src/base.js`, `src/panels.js`, `src/hud.js`.
- **Responsable.** `balance-designer` con Fable 5.2, esfuerzo medio, para el mapa y la propuesta; `ux-designer` con Opus 5.5 para la presentación; `programmer` con Sonnet 5.5.
- **Dependencias.** T-F1-02.
- **Aceptación.** En las 3 primeras salidas de una cuenta nueva no se muestran más de 3 recursos distintos.
- **Pruebas.** Comprobaciones de visibilidad por número de salidas.
- **Riesgo y reversión.** Esconder algo que el jugador necesita: el Archivo siempre lo muestra todo. Flag.
- **Tamaño.** M. **Decisión del dueño.** Solo si se propone eliminar o fusionar un recurso.

#### T-F1-08 Legibilidad y uso de la pantalla en móvil
- **Objetivo y por qué.** Textos de 6 a 9 px reales y un 18 % de pantalla en negro. Si no se lee, no se juega.
- **Pasos.** (1) Con los datos de T-F0-12, fijar mínimos reales: 11 px CSS en menús y 9 px CSS en combate a 844x390. (2) Elegir la vía: (a) ancho lógico variable (de 960 a ~1170) para llenar 19,5:9, o (b) mantener 960x540 y sacar joystick y botones a las franjas. (3) Incluir una fuente propia con licencia libre para que las métricas sean iguales en todos los dispositivos. (4) Rehacer las rejillas densas (árbol, Archivo) con zoom o paginación.
- **Archivos.** `src/mobile.js`, `src/main.js`, `src/hud.js`, `src/fusion.js`, `src/boss.js`, `src/tree.js`, `src/panels.js`, `index.html`, `studio/assets/ASSETS.md`.
- **Responsable.** `ux-designer` con Opus 5.5, esfuerzo alto (sube a Fable si se elige la vía a, que toca todo el HUD). Implementa `programmer` con Sonnet 5.5, esfuerzo alto. Apoyo: `asset-scout` (Haiku) busca la fuente; `performance-engineer` vigila el coste.
- **Dependencias.** T-F0-12.
- **Aceptación.** `textcheck` no encuentra texto por debajo de los mínimos en ninguna pantalla a 844x390 y 740x360; el dueño lee las 15 frases de la hoja sin acercar el móvil.
- **Pruebas.** Ampliar `textcheck.js` a combate y a dos tamaños de pantalla.
- **Riesgo y reversión.** La vía (a) puede romper posiciones fijas en muchas pantallas: hacerla detrás de un ajuste y por pantallas. Revertir por commit.
- **Tamaño.** L. **Decisión del dueño.** Sí: vía (a) o (b).

#### T-F1-09 Respuesta física y sonora en los momentos clave
- **Objetivo y por qué.** Subir de nivel, fusionar y romper una parte de jefe deben sentirse. Es barato y aumenta el placer del bucle.
- **Pasos.** (1) Vibración corta opcional (`navigator.vibrate`) en golpe recibido, fusión y parte rota, con ajuste. (2) Revisar que cada uno de esos momentos tenga destello, sonido y pausa breve coherentes. (3) Respetar "reducir destellos".
- **Archivos.** `src/fx.js`, `src/player.js`, `src/fusion.js`, `src/boss.js`, `src/panels.js`.
- **Responsable.** `programmer` con Sonnet 5.5, esfuerzo bajo. Apoyo: `audio-designer`, `art-director`.
- **Dependencias.** Ninguna.
- **Aceptación.** Ajuste de vibración visible solo donde existe la API; apagado por defecto en "reducir destellos".
- **Pruebas.** 4 comprobaciones con `navigator.vibrate` simulado.
- **Riesgo y reversión.** Molestia: ajuste para apagarlo.
- **Tamaño.** S. **Decisión del dueño.** Ninguna.

#### T-F1-10 Evaluar una expedición corta para sesiones de móvil
- **Objetivo y por qué.** La partida mínima dura 7 minutos más la aldea. En portales y en móvil, muchas sesiones son de 3-5 minutos.
- **Pasos.** (1) Diseñar una "Incursión" de 4 minutos con jefe reducido o minijefe y botín proporcional. (2) Simular su efecto en la economía. (3) Prototipo detrás de `?len=4`. (4) Decidir con datos de T-F1-01.
- **Archivos.** `src/loot.js` (`L.DUR`), `src/main.js`, `src/boss.js`, `src/panels.js`.
- **Responsable.** `balance-designer` con Fable 5.2, esfuerzo medio. Implementa `programmer` con Sonnet 5.5.
- **Dependencias.** T-F0-05, T-F1-01.
- **Aceptación.** Botín por minuto de la Incursión entre el 85 % y el 100 % del de la Rápida; no desbloquea Peligro.
- **Pruebas.** Fila nueva en las pruebas de duraciones.
- **Riesgo y reversión.** Convertirse en la forma óptima de farmear: por eso el tope de botín por minuto. Es una fila de tabla.
- **Tamaño.** M. **Decisión del dueño.** Sí: si quiere un modo corto.

#### T-F1-11 Guardado a prueba de pérdidas
- **Objetivo y por qué.** Perder el progreso es la forma más segura de perder al jugador. Hoy depende de un único `localStorage`.
- **Pasos.** (1) Copia rotativa: 3 instantáneas (última, de ayer, de la semana). (2) Segunda copia en IndexedDB. (3) Recordatorio de exportar cada 10 salidas y aviso específico en iOS sin instalar. (4) Validación de rangos al importar. (5) Documentar cómo viajaría el guardado a otro dominio.
- **Archivos.** `src/save.js`, `src/pwa.js`, `src/panels.js`.
- **Responsable.** `programmer` con Opus 5.5, esfuerzo medio (el guardado es código delicado: se sube un escalón). Revisión: `qa-tester` con Sonnet 5.5.
- **Dependencias.** T-F0-01.
- **Aceptación.** Borrar la clave principal y recargar recupera la última instantánea; un guardado corrupto no deja el juego en blanco.
- **Pruebas.** Grupo `save2`: 12 comprobaciones de recuperación, corrupción e importación fuera de rango.
- **Riesgo y reversión.** Un error aquí pierde partidas: nunca se sobrescribe sin copia previa. Revertir por commit.
- **Tamaño.** M. **Decisión del dueño.** Ninguna.

