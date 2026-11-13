# Plan maestro de Swarm Hand: divertido, adictivo y monetizable

Fecha de la revisión: 2026-11-12 · Commit revisado: `33197d4` (rama `claude/serene-pascal-bsxbz3`, igual que `main`).
Alcance: `games/card-swarm` (juego principal), `games/survival-lamb`, `games/card-swarm-clasico`, `tools/`, `studio/`, `.claude/agents/`, `.github/workflows/pages.yml`.
Esta revisión **no cambia código del juego ni balance**: solo diagnostica y planifica.
Actualización 2026-11-13: el dueño respondió las 17 preguntas de la sección 6; las respuestas están en la sección "Decisiones del dueño (2026-11-13)" y las tareas afectadas ya están ajustadas. `games/survival-lamb`, `games/card-swarm-clasico` y sus herramientas se retiraron de `main` (T-F0-13); lo que el diagnóstico dice de ellos es histórico.

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
- La batería `tests.js all` **no arranca** tal como está en el repositorio (ruta del navegador fija: ver T-F0-01). Con una copia temporal que solo cambia esa ruta, sin tocar el repo: **541 de 541 comprobaciones correctas, 0 fallos**, unos 10 minutos.
- `perf_bot.js` (misma copia temporal; Cráter, 110 enemigos, 4 poderes, semilla 1, 3 ejecuciones de 15 s, calidad MEDIA): 58 fps, p95 de fotograma 17 ms, CPU por fotograma 5 ms de media y 8 ms de p95, entre 6 y 10 fotogramas por encima de 33 ms. Son cifras de PC sin GPU real: sirven para comparar versiones, no para predecir el móvil.
- Las tres ejecuciones con la **misma semilla** dieron 600, 552 y 546 bajas: el combate no es reproducible.

---

## 1. Diagnóstico por áreas

### 1.1 Diversión y bucle central
- **Bien.** El bucle es sólido y tiene identidad: ataque básico automático, cartas como infusiones, 15 fusiones que dan poderes activos en 4 ranuras, 6 jefes con fases y partes rompibles, 5 niveles de Peligro (`src/boss.js:65-70`), cacería y práctica (`src/main.js:340-346`). Las decisiones de fusión (fusionar ya o guardar, reemplazar un poder) son decisiones de verdad. [V]
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
- **Bien.** La tabla de balance de la meta está centralizada (`src/loot.js`, sección BALANCE) y documentada con sus motivos; hay "pity" de Esencia (`src/loot.js:67-69`) y duraciones con riesgo/recompensa (`src/loot.js:21-25`). [V]
- **Falla.** Hay 7 monedas y recursos (Ceniza, Brasas, 8 partes, Esencia, PF, trofeos, insignias). Es profundidad para el veterano y ruido para el novato. [V]
- **Falla.** La economía de fabricación de armaduras T3-T6 no se ha validado (README v8.1, "Desvíos honestos"). La meta de ~16 h no está medida, aunque existe `stats.playMs` (`src/main.js:569`), que además cuenta título, pausa y aldea. [V]
- **No verificado.** Horas reales hasta cada hito: no hay simulador de progresión ni datos de jugadores. [N]

### 1.5 Balance y dificultad
- **Bien.** Hay perillas por URL para casi todo y un historial honesto de mediciones en el README. [V]
- **Falla.** Deudas confirmadas en el propio README: el reto con armadura no está demostrado (supervivencia saturada en el bot), `zoneDmg` x1,18-x1,44 sin calibrar, sets T3-T6 sin probar contra jefes, ruido de +-30 s con n=12. [V en README]
- **Falla.** La dificultad depende del dispositivo: la calidad gráfica cambia el tope de enemigos vivos (`src/mobile.js:24-26`, `enemyMul` 1 / 0,9 / 0,75, aplicado en `src/waves.js:145`). Un móvil arranca en MEDIA (medido) y por tanto con un 10 % menos de enemigos que un PC; en BAJA, un 25 % menos. Eso contradice "el juego es un reto" y hace que el balance medido en PC no sea el del móvil. [V]
- **Falla.** `cardDmgMul` x3,5 es una calibración global heredada del prototipo (`src/main.js:100`). Funciona, pero indica que las cifras de diseño y las reales están separadas. [V]
- **Matiz sobre el determinismo.** Los `Math.random` que quedan en los archivos de combate son cosméticos (partículas y sonidos; revisados uno a uno en `enemies.js`, `combat.js`, `fusion.js`, `weapons.js`, `boss*.js`, `player.js`). El combate no es reproducible con `?seed` (medido: 600, 552 y 546 bajas con la misma semilla), así que la causa es otra, probablemente el reloj real del bucle (`src/main.js:567-577`), la calidad adaptativa que cambia `enemyMul` y `projCap`, y los topes de partículas. [V el recuento y la medición; I la causa]
- **No verificado.** Peligro IV-V por debajo del objetivo en Karceron, Letea y Cenizar; Corrosión frente a jefes: no se volvió a medir aquí. [N]

### 1.6 Contenido
- **Bien.** 28 cartas, 15 fusiones, 6 biomas, 6 jefes, 2 minijefes por bioma, 7 sets de armadura, epílogo y créditos. Es mucho contenido para el tamaño del estudio. [V]
- **Falla.** No hay contenido repetible tras el final salvo subir Peligro: sin modo infinito, sin mutadores, sin eventos. [V]
- **Falla.** `games/survival-lamb` se publica en Pages sin controles táctiles (`MOVIL.md`, sección 6) y aparece en el índice público (`tools/site/index.html`). Da mala primera impresión en móvil. [V] **Resuelto 2026-11-13:** retirado del sitio y de `main` (T-F0-13).

### 1.7 Arte y VFX
- **Bien.** El arte procedural de la aldea, los jefes y los efectos tiene nivel y estilo coherente (capturas de esta revisión). [V]
- **Falla.** Marlo se ve como mapache y el guion lo llama "corderito" (decisión del dueño: es mapache; hay que corregir el texto, T-F0-07) (`src/cine_intro.js:147`, `src/aldea.js:104`, `:108`, `:213`). [V]
- **Falla.** En el segundo 8 de la intro la imagen es casi negra con rectángulos simples: parece arte de reserva (captura). [V la captura; I que sea reserva]
- **Falla.** No hay dirección de arte escrita (paleta, grosor de línea, reglas de legibilidad de telegrafías). 25 archivos `assets_*.js` suman ~17.000 líneas. [V]

### 1.8 Audio
- **Bien.** Audio procedural completo por familias y jefes; el audio se desbloquea con el primer toque y se suspende al salir. [V]
- **Falla.** Solo Tundra y Panal tienen pista propia; Bosque, Cripta, Asfódelo y Cráter comparten la pista `normal` (`src/main.js:395`). [V]
- **Falla.** `Assets.cine3` se define dos veces: como función de audio (`src/sfx_cine3.js:150`) y después como objeto de arte (`src/assets_cine3.js:645`), que pisa a la primera. Funciona por el orden de carga y por las guardas `typeof ... === 'object'`. [V]
- **No verificado.** Mezcla y volumen en altavoz de móvil. [N]

### 1.9 UI/UX y legibilidad móvil
- **Bien.** Objetivos táctiles de 48 px lógicos en lo principal, joystick flotante, letterbox con áreas seguras, tamaño mínimo de 12 px lógicos en menús (`src/main.js:171`, `:495`), aclarado automático de grises (`src/main.js:175-190`), ajustes de accesibilidad (reducir sacudidas y destellos). [V]
- **Falla.** 12 px lógicos son ~8,7 px reales en 844x390, y en combate el mínimo no se aplica: hay etiquetas de 8 a 11 px lógicos (5,8 a 7,9 px reales) en `hud.js`, `fusion.js` y `boss.js`. [V]
- **Falla.** Se desperdicia el 18 % del ancho en teléfonos 19,5:9 (medido). Ese espacio podría alojar joystick y botones sin tapar la arena. [V]
- **Falla.** La fuente es "Courier New" del sistema (`src/main.js:164`); en Android no existe y se sustituye por otra monoespaciada, con métricas distintas. [V el código; I el efecto]
- **Falla.** Solo horizontal; en vertical sale un aviso. Los portales web móviles traen mucho tráfico en vertical. [V]
- **No verificado.** Legibilidad en la mano del dueño, alcance del pulgar a los 4 poderes. [N]

### 1.10 Rendimiento
- **Bien.** Paso fijo a 60 Hz, caché de texto (`src/main.js:162-211`), calidad adaptativa, medidor `?perf=1`, bot de rendimiento y protocolo térmico (`MOVIL.md`, sección 7). [V]
- **Falla.** Carga: 92 scripts sin minificar ni agrupar (3,4 MB). GitHub Pages los comprime, pero son 92 peticiones y un análisis de 3,4 MB de JS en el arranque. [V]
- **Falla.** Asignaciones por fotograma en el dibujo (`filter` + `sort` de todos los enemigos en `src/main.js:516-519`) y ~20 `filter`/`sort` en los archivos de combate. No hay rejilla espacial para colisiones. [V el recuento; I el coste]
- **Medido en PC.** En el peor caso de `perf_bot.js` la CPU usa 5 ms de media por fotograma con ~105 enemigos (ver mediciones). Hay margen en escritorio; no dice nada del móvil. [V]
- **No verificado.** Frame-time en móvil real y calentamiento a 15 minutos. [N]

### 1.11 Calidad de código y arquitectura
- **Bien.** Sin dependencias, balance en un objeto, módulos por dominio, comentarios que explican el porqué, guardas `try/catch` para piezas opcionales. [V]
- **Falla.** Todo cuelga de los globales `G` y `Assets` y del orden de 92 etiquetas `<script>` (`index.html:29-120`). Líneas muy largas con varias sentencias; archivos de 1.000 a 1.900 líneas. Cada módulo nuevo exige tocar `index.html` y `sw.js`. [V]
- **Falla.** Los parámetros de depuración funcionan en producción: `?god`, `?give=all:30`, `?pf=`, `?reset=1`, `?cmul=` (`src/save.js:218-233`, `src/main.js:20`, `:100`). Cualquier tabla de récords o compra sería trivial de falsear, y `?reset=1` borra la partida con un enlace. [V]
- **Falla.** No hay captura global de errores: si algo falla en el móvil del dueño, no queda rastro. [V: sin `onerror` en `src/`]
- **Falla.** Todos los textos están en español dentro del código (~30 archivos), sin capa de traducción. Es el mayor coste oculto para publicar en portales. [V]

### 1.12 Pruebas y CI
- **Bien.** Batería amplia en `tools/card-swarm-bot/tests.js` (1.066 líneas, 13 grupos) más bots de partida, jefes y rendimiento. [V]
- **Falla grave.** Las herramientas tienen fija la ruta `/opt/pw-browsers/chromium-1194/chrome-linux/chrome` en 57 archivos de `tools/` (`tools/card-swarm-bot/tests.js:13`). En el contenedor actual el navegador es `chromium-1243` y **ninguna prueba ni bot arranca**. Existe un enlace estable, `/opt/pw-browsers/chromium`. [V]
- **Falla.** No hay CI de pruebas: `pages.yml` solo despliega y lo hace con cada push a `main`, sin puerta. [V]
- **Falla.** `tests.js` ejecuta `stamp.py` sobre el repositorio (`tools/card-swarm-bot/tests.js:39`): pasar las pruebas puede modificar `games/card-swarm/sw.js`. [V]
- **Falla.** Conteos desactualizados en la documentación (el README habla de 218 comprobaciones en `all`). [V]
- **Resultado de `tests.js all` en esta revisión** (copia temporal con la ruta corregida, sin tocar el repo): 541 de 541 correctas. El código del juego está sano; lo roto es la herramienta. [V]

### 1.13 Guardado y datos
- **Bien.** Esquema versionado v12 con cadena de migraciones y copia previa (`src/save.js:58-131`), relleno defensivo de campos (`:149-178`), exportar/importar como texto (`:181-199`), aviso si el navegador no deja guardar (`:50-57`). [V]
- **Falla.** Un solo punto de fallo: `localStorage` del navegador. iOS puede borrar datos de sitios no instalados tras ~7 días sin uso (`MOVIL.md`, sección 6). No hay copia rotativa automática ni recordatorio de exportar. [V]
- **Falla.** El guardado no tiene firma ni validación de rangos: exportar, editar e importar da cualquier progreso. Hoy no importa; con récords o compras, sí. [V]
- **Falla.** Al cambiar de dominio (portal, itch, TWA) el guardado no viaja: cada origen tiene su `localStorage`. [I]

### 1.14 PWA y distribución
- **Bien.** Service worker con precache versionado por hash, actualización solo cuando el jugador acepta y nunca en mitad de una expedición (`src/pwa.js:33-43`), manifest completo con iconos enmascarables, redirección del prototipo antiguo. [V]
- **Falla.** Solo se distribuye en GitHub Pages bajo `xitakha.github.io/Game/`: sin dominio propio, sin página de tienda, sin capturas ni tráiler. [V]
- **Falla.** `pages.yml` aún borra `assets_village_tmp.js`, que ya no existe: resto sin limpiar. [V]
- **No verificado.** Instalación y uso sin conexión en teléfono real (pendiente desde el ROADMAP). [N]

### 1.15 Analítica
- **Falla.** No hay ninguna: ni eventos, ni embudo, ni duración de sesión, ni causa de muerte agregada. Solo `stats.playMs` local. Sin datos no se puede afinar la retención ni negociar con un portal. [V]

### 1.16 Monetización
- **Falla.** No hay nada: ni anuncios, ni compras, ni donación, ni capa de plataforma para SDK de portales. [V]
- **A favor.** El diseño ya tiene sumideros y momentos naturales para recompensas opcionales (reroll, plato, tónico e imán de Rufo, duplicar Brasas del botín) que no tocan el reto del combate. [V que existen; I que sirven]

### 1.17 Marca y marketing
- **Falla.** Nombre sin comprobar frente a otros juegos o marcas, sin eslogan fijado fuera del título ("Apaga las seis llamas"), sin página, sin redes, sin tráiler; los nombres cómicos de los créditos estaban sin aprobar (`src/assets_cine3.js:568`); el dueño los aprobó el 2026-11-13 (T-F0-08). [V]

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
| B. Portales web con su SDK (CrazyGames, Poki) | Tráfico grande ya existente; ellos venden los anuncios y gestionan el consentimiento; reparto de ingresos | Curados: pueden rechazar; piden inglés y buen arranque; Poki prefiere exclusividad web (el dueño: solo si pagan muy bien); solo se permiten sus anuncios | Bajo a medio, proporcional a partidas; es la vía realista para un HTML5 sin presupuesto de adquisición | Capa de plataforma con eventos de juego y anuncios; build sin service worker ni enlaces externos; CrazyGames: descarga inicial <= 50 MB y <= 20 MB para portada móvil (el juego pesa 3,4 MB); Poki: se cita un objetivo de < 8 MB iniciales | Aceptar los términos del portal; el consentimiento de anuncios lo gestiona el portal | Bajo si solo hay recompensados y pausas en la aldea |
| C. Anuncios propios en Pages (AdSense para juegos H5 u otra red) | Control total | Tráfico propio casi nulo; hay que montar consentimiento (RGPD), política de privacidad y pasar la aprobación de la red; elegibilidad no verificada | Muy bajo con el tráfico actual | SDK de anuncios, gestor de consentimiento | Política de privacidad, consentimiento en EEE, declarar público objetivo | Medio: riesgo de anuncios invasivos |
| D. Play Store con TWA, gratis con compra única "Apoyar al estudio" (quita anuncios + cosméticos) | Presencia en tienda, instalación real, compra única honesta | Cuenta de desarrollador de pago; las cuentas personales nuevas necesitan prueba cerrada con 12 testers durante 14 días seguidos; las compras digitales deben usar Play Billing (Digital Goods API + Payment Request en TWA); mantenimiento de fichas y políticas | Bajo a medio; depende de la retención | Proyecto TWA, Digital Asset Links, dominio estable, productos en Play Console, asociar compras al jugador | Política de privacidad, ficha de seguridad de datos, clasificación por edades | Bajo |
| E. Premium de pago (itch o Steam con envoltorio) | Modelo limpio, encaja con el género en PC | El juego nació móvil y web; exige controles y resolución de PC pulidos, y una versión con más contenido | Incierto; es otra apuesta | Envoltorio de escritorio, logros de plataforma | Alta de tienda | Ninguno negativo |
| F. Pase de temporada o tienda de cosméticos con moneda de pago | Ingreso recurrente si hay comunidad | Exige eventos en vivo, servidor, antifraude y mucho contenido; prematuro | Nulo sin base de jugadores | Backend, validación de compras | Términos de compra, reembolsos, menores | Riesgo de desviar el diseño |

No se dan cifras de ingresos: dependen del tráfico y de la retención, que hoy no se miden. Cualquier número sería inventado.

### 2.2 Recomendación por fases

1. **Ahora (tras F0 y F1): opción A.** Publicar en itch.io gratis con donación voluntaria. Objetivo: comentarios de jugadores reales y primeras cifras de retención con analítica propia sin datos personales.
2. **Cuando D1 y la duración de sesión sean decentes: opción B.** Capa de plataforma única (`G.Platform`) y envío a CrazyGames (lanzamiento básico sin monetización, después completo con reparto) y solicitud a Poki. La exclusividad web que Poki prefiere solo se acepta si paga muy bien. Recompensados diseñados en la aldea y en el botín, nunca en combate.
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
- A los agentes existentes solo se les añade la línea `model:`; su texto no cambia. `ceo` queda sin ella a propósito: es el agente de la sesión principal y usa el modelo que elija el dueño al abrirla. La mención a Phaser y la lista de equipo de `ceo.md` se corrigen en T-F0-09 (permiso del dueño concedido el 2026-11-13).

---

## 5. Backlog priorizado

Formato de cada tarea: **objetivo y por qué** · **pasos** · **archivos** · **responsable (modelo, esfuerzo)** y apoyo · **dependencias** · **aceptación** · **pruebas** · **riesgo y reversión** · **tamaño** · **decisión del dueño**.

Resumen: F0 con 13 tareas, F1 con 10 (T-F1-10 descartada por el dueño), F2 con 8, F3 con 10, F4 con 6 y un cierre con 1 tarea (T-FIN-01, retirar la inmortalidad). Total: 48 (13 + 10 + 8 + 10 + 6 + 1).

### F0. Limpieza y deudas (13 tareas)

Meta de la fase: que lo publicado sea el juego real (con reto), que las pruebas vuelvan a correr y protejan cada despliegue, y que el estudio trabaje sobre documentación cierta.

#### T-F0-01 Reparar las herramientas de prueba (ruta del navegador)
- **Objetivo y por qué.** Hoy ninguna prueba ni bot arranca en el contenedor actual. Sin pruebas no se puede tocar nada con seguridad; es la base de todo lo demás.
- **Pasos.** (1) Crear `tools/lib/browser.js` que exporte `launch()` y resuelva el ejecutable en este orden: variable `PW_CHROME`, `/opt/pw-browsers/chromium`, el navegador por defecto de Playwright. (2) Sustituir la ruta fija en los 57 archivos de `tools/` que la contienen. (3) Hacer que `tests.js` no ejecute `stamp.py` sobre el repo: que trabaje sobre una copia temporal. (4) Pasar `tests.js all` y anotar el número real de comprobaciones.
- **Archivos.** `tools/lib/browser.js` (nuevo), `tools/card-swarm-bot/*.js`, `tools/card-swarm-iso/*.js`, `tools/fx2-lab/*.js`. (Los de `tools/card-swarm-clasico-*` se retiraron en T-F0-13: ya no hay que tocarlos y los archivos afectados son menos de 57.)
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

#### T-F0-03 Cerrar los parámetros de depuración en producción (la inmortalidad se retira al final: T-FIN-01)
- **Estado.** Reducida por decisión del dueño (2026-11-13): la inmortalidad por defecto **se queda por ahora** para que el dueño pruebe funcionalidades y se retira AL FINAL del plan (T-FIN-01). Aquí solo se cierran los parámetros de depuración.
- **Objetivo y por qué.** `?give`, `?pf`, `?cmul`, `?reset=1` funcionan en producción: cualquier récord o compra sería falseable y `?reset=1` borra la partida con un enlace.
- **Pasos.** (1) Los parámetros que alteran progreso o dificultad (`give`, `pf`, `cmul` y similares) solo se leen si la URL lleva `?dev=1` o el host es `localhost`. (2) `?reset=1` pide confirmación. (3) Los bots añaden `dev=1`. (4) **`?god` NO se toca aquí**: `G.god` sigue valiendo 1 por defecto y `?god=0` sigue funcionando sin `dev=1`, para no romper las pruebas del dueño ni los bots. Si cerrar alguno de los demás parámetros rompe lo que el dueño usa hoy para probar, se le avisa y se aplaza ese parámetro (puede seguir con `?dev=1`).
- **Archivos.** `src/main.js`, `src/save.js`, `src/armor.js`, `src/fusion.js`, `src/cine.js`, `tools/card-swarm-bot/*.js`.
- **Responsable.** `programmer` con Sonnet 5.5, esfuerzo bajo. Revisión: `qa-tester` (Sonnet).
- **Dependencias.** T-F0-01. Conviene hacerla después de T-F0-12.
- **Aceptación.** `?give=all:30` sin `dev=1` no cambia el guardado; `?reset=1` pide confirmación; con `?dev=1` todo sigue funcionando; la batería pasa.
- **Pruebas.** Grupo nuevo `dev` en `tests.js`: una comprobación por parámetro sensible, con y sin `dev=1`.
- **Riesgo y reversión.** Que el dueño pierda algún atajo de prueba: conserva `?dev=1`. Revertir el commit.
- **Tamaño.** S. **Decisión del dueño.** Resuelta: la inmortalidad se retira al final (T-FIN-01).

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
- **Pasos.** (1) Auditar qué lee la simulación fuera de `G.rng` y de `G.time`: reloj real, `G.Q.enemyMul`, `G.Q.projCap`, topes de partículas, `performance.now()`. (2) Separar "calidad visual" de "reglas". Decisión del dueño: en móviles lentos, **menos enemigos pero más duros y un poco más rápidos**. Se define un perfil de compensación por calidad (menos enemigos, más vida y algo más de velocidad) con presión de combate equivalente, que fija `balance-designer`; el mismo perfil se aplica siempre para una calidad dada. Como la calidad adaptativa puede cambiar a mitad de partida, las pruebas de semilla fijan la calidad (`?q=`) y la reproducibilidad se exige por calidad. (3) Modo de prueba que avance por pasos fijos (`G.step`) sin reloj real. (4) Prueba: dos ejecuciones con la misma semilla y las mismas entradas dan el mismo estado en 12 puntos de control.
- **Archivos.** `src/main.js`, `src/mobile.js`, `src/waves.js`, `src/enemies.js`, `src/fx.js`, `tools/card-swarm-bot/tests.js`.
- **Responsable.** `programmer` con Sonnet 5.5, esfuerzo alto. Diseño y revisión: `balance-designer` con Fable 5.2 (decide cómo se compensa la calidad BAJA; es una decisión de reto). Apoyo: `performance-engineer`.
- **Dependencias.** T-F0-01.
- **Aceptación.** Misma semilla y mismas entradas: estado idéntico (vida, bajas, posición, nivel) a los 60, 180 y 420 s, en ALTA y en BAJA.
- **Pruebas.** Grupo nuevo `seed` (al menos 12 puntos de control por calidad).
- **Riesgo y reversión.** La compensación (menos enemigos, más duros y rápidos) puede cambiar el reto en móvil: comprobar con el banco de T-F2-01 que la presión equivale a la de PC. Medir los fps con T-F2-07. Revertir por commit.
- **Tamaño.** M. **Decisión del dueño.** Resuelta: menos enemigos pero más duros y un poco más rápidos en móviles lentos.

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

#### T-F0-07 Marlo es mapache: corregir el texto
- **Estado.** Decidido por el dueño (2026-11-13): Marlo es MAPACHE. No se rehace el sprite (la opción 2b queda descartada).
- **Objetivo y por qué.** El protagonista se dibuja como mapache y el guion lo llama corderito. La identidad del personaje es parte de la marca.
- **Pasos.** Reescribir las líneas que dicen "cordero" o "corderito" referidas a Marlo (`src/cine_intro.js:147`, `src/aldea.js:104`, `:108`, `:213`, y la frase de la intro) y los documentos que lo repiten (`DESIGN-v9-cinematicas.md`, `DESIGN-v3-aldea.md`). No tocar el sprite ni las variantes con armadura. Cuidado: "cordero" puede ser legítimo en otros contextos (la bufanda, el rebaño de Ember Flock); revisar cada caso.
- **Archivos.** `src/cine_intro.js`, `src/aldea.js`, `src/player.js` (si hay comentarios), `games/card-swarm/DESIGN-v9-cinematicas.md`, `DESIGN-v3-aldea.md`.
- **Responsable.** `game-designer` con Sonnet 5.5, esfuerzo bajo, para los textos y `programmer` con Haiku para aplicarlos.
- **Dependencias.** Ninguna.
- **Aceptación.** Ningún texto contradice al sprite; `textcheck` pasa.
- **Pruebas.** Comprobación de que las cadenas antiguas ya no aparecen.
- **Riesgo y reversión.** Bajo. Revertir por commit.
- **Tamaño.** S. **Decisión del dueño.** Resuelta: mapache.

#### T-F0-08 Nombres de los créditos (RESUELTA)
- **Estado.** Resuelta el 2026-11-13: el dueño aprobó los nombres de los créditos, incluido el bloque "Nuestro jefe supremo". No hay cambio de código.
- **Pendiente menor.** Si algún texto de `CRED` (`src/assets_cine3.js:568`) cambia más adelante, `textcheck` sobre la pantalla de créditos.
- **Tamaño.** Cerrada. **Decisión del dueño.** Resuelta.

#### T-F0-09 Poner al día la documentación del estudio (hecha salvo los conteos)
- **Estado (2026-11-13).** Hecha: Phaser corregido a "Canvas 2D sin librerías", `ceo.md` con el equipo completo, `STUDIO.md` y `ROADMAP.md` al día, clásico y Ember Flock marcados como retirados. Pendiente: actualizar los conteos del README con el resultado de T-F0-01.
- **Objetivo y por qué.** `STUDIO.md` y `programmer.md` hablaban de Phaser, `ceo.md` no conocía a todo el equipo, el README cita conteos de pruebas antiguos.
- **Pasos.** (1) Corregir la mención a Phaser. (2) Añadir a `ceo.md` la lista completa de agentes. (3) Actualizar los conteos del README con el resultado de T-F0-01 (pendiente). (4) Marcar con una cabecera los documentos heredados del clásico. (5) El clásico sale de `main` (hecho en T-F0-13).
- **Archivos.** `studio/STUDIO.md`, `studio/docs/ROADMAP.md`, `.claude/agents/ceo.md`, `.claude/agents/programmer.md`, `games/card-swarm/README.md`, `games/card-swarm/*.md`.
- **Responsable.** `release-manager` con Haiku 5.5, esfuerzo bajo.
- **Dependencias.** Solo el paso 3 depende de T-F0-01.
- **Aceptación.** Ninguna mención a Phaser como stack del juego; conteos coinciden con la batería.
- **Pruebas.** Ninguna automática.
- **Riesgo y reversión.** Nulo.
- **Tamaño.** S. **Decisión del dueño.** Resuelta: permiso concedido para `ceo.md` y `programmer.md`; el clásico sale de `main`.

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

#### T-F0-13 Retirar Ember Flock y el clásico de `main` y del sitio (HECHA)
- **Estado.** Hecha el 2026-11-13 por decisión del dueño. Se eliminaron `games/survival-lamb` (12 archivos, 226 KB), `games/card-swarm-clasico` (85 archivos, 3,32 MB), `tools/card-swarm-clasico-balance-bot` (44 archivos, 470 KB) y `tools/card-swarm-clasico-boss-bot` (10 archivos, 47 KB). El historial de git los conserva; el clásico también está en la rama `archive/card-swarm-clasico-v5.6`. El índice y `pages.yml` ya no los mencionan; `/card-swarm-fusion/` sigue redirigiendo a `/card-swarm/`.
- **Pendiente.** `tools/asset-preview` abre por defecto `games/survival-lamb` y `tools/card-swarm-bot/baseline_bot.js` compara con el clásico: ambos quedan obsoletos y se ajustan o retiran cuando `tools-engineer` termine T-F0-01 (no se tocaron para no pisar ese trabajo).
- **Tamaño.** Cerrada. **Decisión del dueño.** Resuelta: se retiran del sitio y de `main`.

### F1. Retención y primera sesión (10 tareas)

Meta de la fase: que un jugador nuevo llegue al combate sin rodeos tras la intro, entienda qué hacer, quiera otra partida y tenga un motivo para volver mañana. Y poder medirlo.

#### T-F1-01 Analítica mínima y respetuosa
- **Objetivo y por qué.** Sin datos, la retención y el balance se ajustan a ciegas, y ningún portal ni tienda se puede evaluar.
- **Pasos.** (1) `monetization-analyst` define el esquema: `session_start`, `intro_end`, `run_start`, `level_up`, `fusion`, `run_end` (causa, tiempo, bioma, Peligro), `boss_start`, `boss_end`, `craft`, `quit_point`. (2) Capa `G.Track(evento, datos)` que siempre guarda un resumen local y, si hay consentimiento y proveedor, lo envía en lotes. (3) Sin identificadores personales: un id aleatorio por instalación. (4) Panel "Mis estadísticas" con el resumen local. (5) Decisión del dueño: analítica **anónima con envío a un servicio**, con aviso de privacidad. Antes de activar el envío: elegir el servicio (propuesta de `monetization-analyst`, pendiente), redactar un aviso de privacidad breve (adelanta el paso 2 de T-F3-01) y un interruptor en Ajustes. Revisión legal (consentimiento en la UE) pendiente de un profesional.
- **Archivos.** `src/track.js` (nuevo), llamadas en `src/main.js`, `src/loot.js`, `src/cards.js`, `src/fusion.js`, `src/boss.js`, `src/panels.js`.
- **Responsable.** `monetization-analyst` con Opus 5.5, esfuerzo medio (esquema, privacidad). Implementa `programmer` con Sonnet 5.5.
- **Dependencias.** T-F0-03.
- **Aceptación.** Una partida completa genera la secuencia esperada de eventos; antes de mostrar el aviso o con el interruptor apagado no sale ninguna petición de red; el resumen local sobrevive a recargar.
- **Pruebas.** Grupo `track`: 10 comprobaciones de secuencia y una de "cero red con el envío apagado o sin aviso mostrado".
- **Riesgo y reversión.** Privacidad: el envío va detrás del aviso y de un interruptor que lo apaga; los eventos llevan el valor de `god` para separar partidas inmortales de las de reto.
- **Tamaño.** M. **Decisión del dueño.** Resuelta: envío anónimo a un servicio con aviso de privacidad. Falta elegir el servicio.

#### T-F1-02 Primera sesión: de la intro al combate sin rodeos
- **Objetivo y por qué.** Tras la intro hay una aldea con 7 NPC antes de jugar. El jugador debe sentir el juego antes de leer. Decisión del dueño (2026-11-13): **la intro NO se acorta la primera vez**; el recorte se hace en lo que viene después.
- **Pasos.** (1) `ux-designer` especifica el flujo nuevo: título, toque, intro completa (~27 s), y primera expedición guiada al Bosque con la aldea reducida a lo imprescindible. (2) Tres avisos contextuales dentro de esa partida: moverse, recoger gemas, elegir carta; el cuarto llega con la primera fusión. (3) Al volver, la aldea se presenta por pasos: primero Lanudo y el Portal; el resto de NPC aparece con las salidas 2, 3 y 4. (4) Propuesta, sujeta a confirmar con el dueño: que la intro se pueda saltar a partir de la segunda vez (hoy está en el Archivo).
- **Archivos.** `src/cine_intro.js` (solo si se añade el salto en visitas posteriores), `src/cine.js`, `src/aldea.js`, `src/hud.js`, `src/cards.js`, `src/save.js` (flags nuevos, sin subir de versión si solo son `flags`).
- **Responsable.** `ux-designer` con Opus 5.5, esfuerzo alto (especificación con guion de pantallas). Implementa `programmer` con Sonnet 5.5, esfuerzo alto. Apoyo: `game-designer`, `art-director`.
- **Dependencias.** T-F0-06, T-F1-01 (para medir el antes y el después).
- **Aceptación.** En cuenta nueva, del final de la intro al primer enemigo pasan menos de 30 s (cifra a confirmar con la medición; el objetivo anterior de 60 s desde el primer toque ya no es alcanzable sin acortar la intro); el embudo `session_start` -> `run_start` se mide; las cuentas con progreso no ven nada nuevo.
- **Pruebas.** Grupo `fte` (primera vez): tiempos, avisos mostrados una sola vez, cuentas antiguas intactas, intro completa la primera vez.
- **Riesgo y reversión.** Tocar el arranque puede romper la migración de cuentas existentes: probar con guardados v9-v12. Un flag devuelve el flujo antiguo.
- **Tamaño.** L. **Decisión del dueño.** Resuelta: no se acorta la intro la primera vez.

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
- **Pasos.** (1) Con los datos de T-F0-12, fijar mínimos reales: 11 px CSS en menús y 9 px CSS en combate a 844x390. (2) Vía decidida por el dueño: **ensanchar el área de juego en teléfonos alargados** (ancho lógico variable, de 960 a ~1170, para llenar 19,5:9); joystick y botones pueden ocupar el espacio ganado sin tapar la arena. La opción de solo mover controles a las franjas queda descartada. (3) Incluir una fuente propia con licencia libre para que las métricas sean iguales en todos los dispositivos. (4) Rehacer las rejillas densas (árbol, Archivo) con zoom o paginación.
- **Archivos.** `src/mobile.js`, `src/main.js`, `src/hud.js`, `src/fusion.js`, `src/boss.js`, `src/tree.js`, `src/panels.js`, `index.html`, `studio/assets/ASSETS.md`.
- **Responsable.** `ux-designer` con Opus 5.5, esfuerzo alto (con Fable para el diseño de la vía elegida, que toca todo el HUD). Implementa `programmer` con Sonnet 5.5, esfuerzo alto. Apoyo: `asset-scout` (Haiku) busca la fuente; `performance-engineer` vigila el coste.
- **Dependencias.** T-F0-12.
- **Aceptación.** `textcheck` no encuentra texto por debajo de los mínimos en ninguna pantalla a 844x390 y 740x360; el dueño lee las 15 frases de la hoja sin acercar el móvil.
- **Pruebas.** Ampliar `textcheck.js` a combate y a dos tamaños de pantalla.
- **Riesgo y reversión.** La vía elegida puede romper posiciones fijas en muchas pantallas: hacerla detrás de un ajuste y por pantallas. Revertir por commit.
- **Tamaño.** L. **Decisión del dueño.** Resuelta: ensanchar el área de juego.

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

#### T-F1-10 Expedición corta de 4 minutos (DESCARTADA)
- **Estado.** Descartada por el dueño el 2026-11-13: no habrá modo corto de 4 minutos. No se diseña ni se prototipa (`?len=4`). La tarea no cuenta en el plan.
- **Nota.** Si los datos de T-F1-01 mostraran sesiones muy cortas, se puede volver a proponer, pero hace falta una decisión nueva del dueño.

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

### F2. Balance final (8 tareas)

Meta de la fase: demostrar con datos que el juego es un reto en todos los biomas y niveles de Peligro, con y sin armadura, y que la economía lleva a las ~16 horas previstas. Regla de la fase: **ningún ajuste baja la dificultad sin una medición que lo justifique y sin el visto bueno del dueño**.

#### T-F2-01 Banco de balance fiable
- **Objetivo y por qué.** Las mediciones actuales tienen n=12 y un ruido de +-30 s; el bot llega casi siempre al jefe, así que no distingue cambios. Sin un instrumento mejor, el balance final es opinión.
- **Pasos.** (1) `balance-designer` define la matriz: 6 biomas x Peligro I-V x 3 equipos (sin armadura, set del tier +1, set del tier +3) x 2 perfiles de bot (torpe y hábil). (2) Bot que esquiva telegrafías y recoge gemas, con habilidad regulable. (3) Ejecución por lotes con semillas fijas, n >= 30 por celda, intervalo de confianza. (4) Salida en CSV y resumen en Markdown. (5) Métricas: victoria, vida mínima, tiempo de pelea, daño evitado, muerte por fuente. (6) La salida compara cada celda con el objetivo de victorias del dueño por Peligro (sección "Decisiones del dueño"): I 50 %, II 40 %, III 30 %, IV 20 %, V 10 %.
- **Archivos.** `tools/card-swarm-balance/` (nuevo), reutiliza `play_bot.js`, `boss_fight.js`, `dodge_fusion.js`.
- **Responsable.** `tools-engineer` con Sonnet 5.5, esfuerzo alto. Diseño del experimento: `balance-designer` con Fable 5.2, esfuerzo alto. Lotes y tablas: `qa-tester` con Haiku 5.5.
- **Dependencias.** T-F0-01, T-F0-05.
- **Aceptación.** Dos lotes iguales difieren menos de 5 puntos de victoria por celda; el bot torpe pierde más que el hábil en todas las celdas.
- **Pruebas.** Prueba de humo del banco en CI con 2 celdas.
- **Riesgo y reversión.** Un bot no es un humano: sus cifras ordenan las celdas, no fijan el valor absoluto; se contrasta con T-F2-06. Es una herramienta: no afecta al juego.
- **Tamaño.** L. **Decisión del dueño.** Ninguna.

#### T-F2-02 Calibrar el daño por zona y la armadura
- **Objetivo y por qué.** Hay que demostrar que con la armadura de su tier el bioma sigue siendo un reto, y que sin ella es claramente más duro. Hoy `zoneDmg` x1,18-x1,44 es valor de diseño sin medir.
- **Pasos.** (1) Objetivos por Peligro fijados por el dueño para un jugador competente: I 50 %, II 40 %, III 30 %, IV 20 %, V 10 % de victorias. `balance-designer` traduce esas cifras a objetivos del bot hábil por celda (con el set del tier del bioma; el bot hábil es un sustituto del jugador competente y se contrasta con T-F2-06) y propone una tolerancia. Sin armadura debe ser claramente más difícil (diferencia mínima a proponer). (2) Barrer `?zdmg=`, `?armk=`, `?armcap=`. (3) Proponer valores y aplicarlos. (4) Repetir el banco.
- **Archivos.** `src/armor.js`, `src/armor_data.js`, README (tabla de valores).
- **Responsable.** `balance-designer` con Fable 5.2, esfuerzo alto. Aplica `programmer` con Haiku 5.5 (cambio de constantes).
- **Dependencias.** T-F2-01.
- **Aceptación.** Las celdas de Peligro I-V con el equipo de su tier quedan dentro de 50/40/30/20/10 % y la tolerancia acordada; sin armadura quedan por debajo.
- **Pruebas.** Actualizar las comprobaciones de `armor` y `armor2` que fijan cifras.
- **Riesgo y reversión.** Sobreajustar al bot. Los valores son perillas: revertir es restaurar la tabla.
- **Tamaño.** M. **Decisión del dueño.** Resuelta: objetivos 50/40/30/20/10 % para Peligro I-V.

#### T-F2-03 Peligro IV y V de Karceron, Letea y Cenizar
- **Objetivo y por qué.** Están por debajo del objetivo de dificultad. El tramo alto es lo que retiene al jugador experto.
- **Pasos.** (1) Medir las 3 x 2 celdas. (2) Identificar qué ataque deja de presionar (telegrafía larga, hueco seguro, daño bajo). (3) Ajustar por patrón antes que por vida: nuevas combinaciones, ventanas más cortas, añadidos. (4) Verificar que toda telegrafía sigue cumpliendo la regla de esquiva.
- **Archivos.** `src/boss.js` (`PELIGRO`), `src/boss_karceron.js`, `src/boss_letea.js`, `src/boss_cenizar*.js`.
- **Responsable.** `balance-designer` con Fable 5.2, esfuerzo alto. Implementa `programmer` con Sonnet 5.5. Revisión de justicia de patrones: `game-designer` con Opus 5.5.
- **Dependencias.** T-F2-01.
- **Aceptación.** Victoria del bot hábil en Peligro IV y V dentro de los objetivos del dueño (20 % y 10 %, con la tolerancia de T-F2-02) en los tres jefes; ninguna telegrafía por debajo de la regla `250 + 1000 * px / 190` ms.
- **Pruebas.** Comprobación automática de la regla de esquiva sobre todos los ataques.
- **Riesgo y reversión.** Dificultad injusta en vez de difícil: revisión de patrones y práctica del dueño. Revertir por commit.
- **Tamaño.** M. **Decisión del dueño.** Objetivos resueltos (IV 20 %, V 10 %); ver los resultados antes de publicar.

#### T-F2-04 Corrosión y topes de daño a jefes
- **Objetivo y por qué.** El Virote corrosivo sube el daño a jefes; hay que saber cuánto y si rompe los topes por uso.
- **Pasos.** (1) Medir el tiempo de pelea con y sin Corrosión en 3 jefes. (2) Comprobar la interacción con debilidades y con el tope del 3 % por uso. (3) Ajustar `?corr` si la ventaja pasa del margen acordado.
- **Archivos.** `src/fusion.js`, `src/combat.js`.
- **Responsable.** `balance-designer` con Fable 5.2, esfuerzo medio.
- **Dependencias.** T-F2-01.
- **Aceptación.** La mejor build con Corrosión no acorta la pelea más de un 15 % frente a la mejor sin ella (cifra a confirmar con el dueño).
- **Pruebas.** Comprobación del tope combinado.
- **Riesgo y reversión.** Bajo; una constante.
- **Tamaño.** S. **Decisión del dueño.** Ninguna.

#### T-F2-05 Simulador de progresión y meta de 16 horas
- **Objetivo y por qué.** La economía de fabricación no está validada y la meta de horas no se ha medido. Una economía demasiado lenta aburre; demasiado rápida deja sin objetivos.
- **Pasos.** (1) Simulador sin navegador que juegue "cuentas" completas con tasas de victoria del banco y tablas de `loot.js`, `tree.js` y `armor_data.js`. (2) Salida: horas hasta cada jefe, cada set, cada rango y el final. (3) Detectar cuellos de botella por recurso. (4) Separar en `stats` el tiempo en combate del tiempo total.
- **Archivos.** `tools/card-swarm-economy/` (nuevo), `src/main.js` (contador separado).
- **Responsable.** `tools-engineer` con Sonnet 5.5, esfuerzo medio. Modelo y lectura: `balance-designer` con Fable 5.2.
- **Dependencias.** T-F2-01.
- **Aceptación.** Informe con horas por hito para jugador torpe, medio y hábil; el final cae entre 12 y 20 horas para el jugador medio (rango a confirmar).
- **Pruebas.** Pruebas unitarias del simulador con tablas pequeñas.
- **Riesgo y reversión.** El simulador simplifica: contrastar con `playMs` del dueño. No toca el juego.
- **Tamaño.** M. **Decisión del dueño.** Resuelta: la meta de ~16 horas se mantiene.

#### T-F2-06 Playtest humano estructurado
- **Objetivo y por qué.** El bot no sabe si algo es divertido o injusto. El dueño sí, pero ahora juega inmortal (se retira al final del plan, T-FIN-01; para el playtest usa `?god=0`).
- **Pasos.** (1) Guion de 5 sesiones: cuenta nueva hasta el Pastor, Karceron con armadura, un Peligro III, Cenizar, y una libre. (2) Tras cada una, 6 preguntas fijas y exportación de estadísticas. (3) `balance-designer` cruza las respuestas con el banco.
- **Archivos.** `studio/docs/PLAYTEST.md` (nuevo).
- **Responsable.** `qa-tester` con Sonnet 5.5, esfuerzo medio. Lectura: `balance-designer` con Fable 5.2.
- **Dependencias.** T-F0-03, T-F1-01. Mientras la inmortalidad siga por defecto (hasta T-FIN-01), las sesiones se juegan con `?god=0`.
- **Aceptación.** 5 sesiones registradas con causa de cada muerte y nota de diversión.
- **Pruebas.** No aplica.
- **Riesgo y reversión.** Una sola persona no es una muestra: sirve para detectar problemas, no para afinar décimas.
- **Tamaño.** M. **Decisión del dueño.** Sí: su tiempo.

#### T-F2-07 Auditoría de rendimiento en combate denso
- **Objetivo y por qué.** Un survivors que da tirones no engancha, y el móvil caliente cierra la partida. Además, T-F0-05 puede subir el número de enemigos en móvil.
- **Pasos.** (1) Perfil con `?perf=1` y el perfilador del navegador en el peor caso (Cráter, 110 enemigos, 4 poderes). (2) Lista ordenada de costes. (3) Candidatos ya vistos: `filter` + `sort` por fotograma (`src/main.js:516-519`), búsquedas de vecinos sin rejilla, degradados creados cada fotograma (`tundra.js`, `panal.js`, `enemies.js`), `shadowBlur` en cartas. (4) Aplicar las 3 de mayor retorno y medir.
- **Archivos.** `src/main.js`, `src/combat.js`, `src/enemies.js`, `src/weapons.js`, `src/fusion.js`, `src/tundra.js`, `src/panal.js`.
- **Responsable.** `performance-engineer` con Sonnet 5.5, esfuerzo alto; sube a Opus 5.5 si hay que introducir una rejilla espacial.
- **Dependencias.** T-F0-05, T-F0-12.
- **Aceptación.** p95 de fotograma en el escenario fijo de `perf_bot.js` al menos un 20 % menor que la línea base; en el móvil del dueño, menos del 5 % de fotogramas por encima de 33 ms (referencia de `MOVIL.md`).
- **Pruebas.** La prueba de semilla de T-F0-05 debe dar el mismo estado antes y después: optimizar no cambia la simulación.
- **Riesgo y reversión.** Cambiar el orden de resolución altera el balance: por eso la prueba de semilla. Revertir por commit.
- **Tamaño.** M. **Decisión del dueño.** Ninguna.

#### T-F2-08 Presupuesto de rendimiento y de carga en CI
- **Objetivo y por qué.** Evitar que el rendimiento se degrade sin que nadie lo vea.
- **Pasos.** (1) Guardar la línea base de `perf_bot.js` y del tamaño de `dist/`. (2) El CI avisa si p95 empeora más de un 15 % o el tamaño crece más de un 10 %. (3) Al principio solo aviso, sin bloquear.
- **Archivos.** `.github/workflows/tests.yml`, `tools/card-swarm-bot/perf_bot.js`, `tools/build/`.
- **Responsable.** `performance-engineer` con Sonnet 5.5, esfuerzo bajo. Apoyo: `release-manager`.
- **Dependencias.** T-F0-02, T-F0-10, T-F2-07.
- **Aceptación.** Un PR que añade trabajo inútil por fotograma recibe el aviso.
- **Pruebas.** PR de prueba.
- **Riesgo y reversión.** Ruido de los runners: umbral relativo y mediana de 3. Se puede desactivar.
- **Tamaño.** S. **Decisión del dueño.** Ninguna.

### F3. Monetización y publicación (10 tareas)

Meta de la fase: sacar el juego de GitHub Pages hacia donde hay jugadores, con una vía de ingresos que no toque el reto, y cumpliendo lo legal.

#### T-F3-01 Decisión de modelo, privacidad y edad
- **Objetivo y por qué.** Todo lo demás de la fase depende de qué se monetiza, dónde y con qué obligaciones.
- **Pasos.** (1) Confirmar en la documentación oficial los datos de la sección 2 marcados como no verificados. (2) Redactar una política de privacidad breve y la ficha de datos. (3) Fijar el público objetivo (no dirigido a menores). (4) Cerrar la lista de recompensas permitidas (sección 2.3). (5) Guía paso a paso para que el dueño cree y gestione sus cuentas (itch.io, CrazyGames/Poki, Play Console) en `studio/docs/guias/`, sin credenciales ni datos de cobro en el repositorio.
- **Archivos.** `studio/docs/MONETIZACION.md` (nuevo), `games/card-swarm/privacy.html` (nuevo).
- **Responsable.** `monetization-analyst` con Opus 5.5, esfuerzo alto (sube a Fable para la recomendación final: afecta a dinero y privacidad).
- **Dependencias.** T-F1-01 con al menos 2 semanas de datos, si se quiere decidir con cifras.
- **Aceptación.** Documento con decisión firmada por el dueño, política publicada y lista de recompensas cerrada.
- **Pruebas.** No aplica.
- **Riesgo y reversión.** Decidir sin datos: por eso la fase 1 va antes. Es un documento.
- **Tamaño.** M. **Decisión del dueño.** Resuelta en lo principal: no hay nada vetado (donación, anuncios recompensados, compra de apoyo); exclusividad con Poki solo si pagan muy bien; las cuentas las crea y es titular el dueño (con guías del estudio, nunca credenciales). Los principios de la sección 2 (nada de pagar por ganar, anuncios solo si el jugador los pide y nunca en combate, sin azar de pago) siguen vigentes; revivir en combate y saltar jefes siguen fuera salvo nueva indicación. Falta: datos de cobro (los pone el dueño). **Aviso:** conviene que un profesional revise lo legal; este plan no es asesoría jurídica.

#### T-F3-02 Capa de plataforma
- **Objetivo y por qué.** Un único punto donde el juego habla con Pages, itch, cada portal o la tienda, para no ensuciar el código con SDK distintos.
- **Pasos.** (1) Interfaz `G.Platform`: `init`, `loadingDone`, `gameplayStart`, `gameplayStop`, `rewarded(motivo)`, `happyMoment`, `canShowAds`, `saveSync`. (2) Adaptador `null` por defecto (todo funciona, sin anuncios). (3) Adaptadores por portal en archivos aparte que solo entran en su build. (4) Llamar a `gameplayStart/Stop` en los cambios de estado de `src/main.js`.
- **Archivos.** `src/platform.js` (nuevo), `src/platform_*.js` (nuevos), `src/main.js`, `src/mobile.js`, `tools/build/`.
- **Responsable.** `programmer` con Sonnet 5.5, esfuerzo alto. Diseño de la interfaz y revisión: `monetization-analyst` con Opus 5.5.
- **Dependencias.** T-F0-10, T-F3-01.
- **Aceptación.** Con el adaptador `null` el juego es idéntico al actual (prueba de semilla); un adaptador simulado recibe los eventos en el orden correcto.
- **Pruebas.** Grupo `platform`: secuencia de eventos, pausa de audio durante un anuncio simulado, vuelta al juego.
- **Riesgo y reversión.** Un anuncio que no devuelve el control deja el juego colgado: tiempo máximo de espera. El adaptador `null` es la reversión.
- **Tamaño.** M. **Decisión del dueño.** Ninguna.

#### T-F3-03 Diseño de recompensas opcionales
- **Objetivo y por qué.** Ganar algo sin romper el reto ni la economía.
- **Pasos.** (1) Especificar cada punto de la sección 2.3: tope diario, texto, dónde aparece. (2) Simular su efecto con T-F2-05. (3) Implementar detrás de `G.Platform.canShowAds()`. (4) Si no hay anuncios disponibles, el botón no aparece.
- **Archivos.** `src/base.js`, `src/aldea.js`, `src/cards.js`, `src/loot.js`, `src/save.js`.
- **Responsable.** `game-designer` con Opus 5.5, esfuerzo medio. Revisión de economía: `balance-designer` con Fable 5.2. Implementa `programmer` con Sonnet 5.5.
- **Dependencias.** T-F3-02, T-F2-05.
- **Aceptación.** Un jugador que ve todos los anuncios posibles avanza como mucho un 25 % más rápido que uno que no ve ninguno (cifra a confirmar); ningún anuncio ocurre en estado `play`.
- **Pruebas.** Topes diarios, ausencia de botones sin adaptador, estado tras cancelar el anuncio.
- **Riesgo y reversión.** Sensación de juego "con trampa": pocas recompensas y bien etiquetadas. Flag de apagado.
- **Tamaño.** M. **Decisión del dueño.** Sí: aprobar la lista y el tope.

#### T-F3-04 Textos fuera del código e inglés
- **Objetivo y por qué.** Los portales grandes tienen público mundial; con el juego solo en español se pierde casi todo ese tráfico.
- **Pasos.** (1) Función `G.t(clave)` con tabla `es` y `en`. (2) Extraer textos por archivo, empezando por la primera sesión, HUD, cartas y Portal. (3) Traducción al inglés con glosario de nombres. (4) Revisar anchos: el inglés suele ser más corto, pero hay que comprobarlo. (5) Selector de idioma y detección por navegador.
- **Archivos.** `src/i18n.js`, `src/lang_es.js`, `src/lang_en.js` (nuevos) y los ~30 archivos con texto.
- **Responsable.** `programmer` con Sonnet 5.5, esfuerzo alto, para la capa y las primeras extracciones; la extracción masiva con Haiku 5.5; glosario y revisión de la traducción con `game-designer` en Opus 5.5.
- **Dependencias.** T-F0-06, T-F1-08.
- **Aceptación.** Con idioma `en`, la primera sesión completa y los menús principales no muestran ninguna cadena en español; `textcheck` pasa en los dos idiomas.
- **Pruebas.** Comprobación de claves sin traducir y de desbordes de texto por idioma.
- **Riesgo y reversión.** Cambio muy extenso: hacerlo por archivos, con la batería entre cada uno. El idioma por defecto sigue siendo español.
- **Tamaño.** L. **Decisión del dueño.** Resuelta: inglés para empezar y varios idiomas a futuro (la capa de i18n debe admitir más de dos). Pendiente de aclarar: si los nombres de personajes y cartas se traducen (la respuesta no lo cubría) y si el español sigue siendo el idioma por defecto.

#### T-F3-05 Builds por destino
- **Objetivo y por qué.** Cada destino pide cosas distintas: sin service worker en portales, sin enlaces externos, zip para itch.
- **Pasos.** (1) `build` con perfiles `pages`, `itch`, `crazygames`, `poki`, `twa`. (2) Cada perfil elige adaptador, quita o deja el SW y el aviso de instalación. (3) Informe de tamaño y número de archivos por perfil. (4) Lista de comprobación de requisitos por portal.
- **Archivos.** `tools/build/`, `studio/docs/PUBLICACION.md` (nuevo).
- **Responsable.** `release-manager` con Sonnet 5.5, esfuerzo medio. Apoyo: `tools-engineer`.
- **Dependencias.** T-F0-10, T-F3-02.
- **Aceptación.** Cada perfil genera un paquete que pasa la batería; el de portal no registra service worker ni abre enlaces externos.
- **Pruebas.** La batería contra cada perfil en CI (al menos el grupo `flow`).
- **Riesgo y reversión.** Divergencia entre perfiles: una sola base de código, diferencias solo en el adaptador.
- **Tamaño.** M. **Decisión del dueño.** Ninguna.

#### T-F3-06 Publicar en itch.io
- **Objetivo y por qué.** Primer contacto con jugadores reales, sin coste y sin compromisos.
- **Pasos.** (1) Página: descripción corta, 5 capturas, GIF de 10 s, etiquetas. (2) Subir el zip del perfil `itch`. (3) Donación voluntaria. (4) Recoger comentarios en un documento semanal.
- **Archivos.** `studio/docs/marketing/` (nuevo).
- **Responsable.** `marketing-manager` con Sonnet 5.5, esfuerzo medio. Apoyo: `release-manager`, `qa-tester` (Haiku) para las capturas.
- **Dependencias.** T-F0-03, T-F1-02, T-F3-05, T-F3-08.
- **Aceptación.** Página publicada; el juego carga y guarda dentro del marco de itch en móvil y escritorio.
- **Pruebas.** Prueba manual en el marco de itch.
- **Riesgo y reversión.** Primera impresión pobre si se publica antes de F1: respetar las dependencias. La página se puede ocultar.
- **Tamaño.** S. **Decisión del dueño.** Resuelta: la cuenta la crea y es titular el dueño; el estudio prepara una guía paso a paso (sin credenciales). Falta que la cree y apruebe la página.

#### T-F3-07 Envío a portales web
- **Objetivo y por qué.** Es la vía con más tráfico para un HTML5 y la que de verdad puede dar ingresos.
- **Pasos.** (1) Adaptador de CrazyGames y envío en lanzamiento básico. (2) Corregir lo que pida su revisión. (3) Solicitud a Poki con build y cifras de retención. (4) Exclusividad: solo se acepta una oferta de Poki si paga muy bien; `monetization-analyst` evalúa cada oferta con cifras y el dueño decide. (5) Guía de alta en cada portal en `studio/docs/guias/`.
- **Archivos.** `src/platform_crazygames.js`, `src/platform_poki.js`.
- **Responsable.** `release-manager` con Sonnet 5.5, esfuerzo medio. Apoyo: `programmer` (adaptadores), `monetization-analyst` (términos, con Opus 5.5).
- **Dependencias.** T-F3-02, T-F3-03, T-F3-04, T-F3-05.
- **Aceptación.** Juego aceptado en al menos un portal y eventos del SDK validados en su herramienta de pruebas.
- **Pruebas.** Las de `platform` con el SDK real en su modo de pruebas.
- **Riesgo y reversión.** Rechazo: es información útil; se corrige y se reenvía. Retirar el juego del portal.
- **Tamaño.** M. **Decisión del dueño.** Resuelta: cuentas del dueño con guía del estudio; exclusividad con Poki solo si pagan muy bien. Los términos de cada portal los acepta el dueño.

#### T-F3-08 Identidad y material de marca
- **Objetivo y por qué.** Sin capturas, icono cuidado y un vídeo corto, nadie hace clic.
- **Pasos.** (1) Comprobar que "Swarm Hand" no choca con otro juego o marca (el nombre ya es definitivo; esto solo detecta un conflicto legal para avisar). (2) Guía de una página: logotipo, paleta, tono. (3) 8 capturas y un vídeo de 20-30 s grabados con los bots. (4) Textos corto y largo en español e inglés.
- **Archivos.** `studio/docs/marketing/`, `games/card-swarm/icons/`.
- **Responsable.** `art-director` con Opus 5.5, esfuerzo medio, para la guía y la selección; `marketing-manager` con Sonnet 5.5 para textos y montaje; capturas con Haiku 5.5.
- **Dependencias.** T-F0-07, T-F1-08.
- **Aceptación.** Carpeta con material listo para itch y portales, aprobada por el dueño.
- **Pruebas.** No aplica.
- **Riesgo y reversión.** Nombre en conflicto: mejor saberlo antes de publicar.
- **Tamaño.** M. **Decisión del dueño.** Resuelta: "Swarm Hand" es el nombre definitivo (si la comprobación del paso 1 encuentra un conflicto, se informa al dueño; no se renombra por cuenta propia). Falta la aprobación del material.

#### T-F3-09 Evaluar la Play Store con TWA
- **Objetivo y por qué.** Tener presencia en tienda puede valer la pena, pero cuesta dinero, tiempo y obligaciones. Se decide con datos del portal.
- **Pasos.** (1) Informe de costes y requisitos confirmados en fuentes oficiales: cuenta, prueba cerrada con 12 testers 14 días, Digital Asset Links, dominio estable, Play Billing para compras. (2) Prototipo de TWA con Bubblewrap en pista interna. (3) Recomendación de seguir o no.
- **Archivos.** `studio/docs/PLAY-STORE.md` (nuevo), `tools/twa/` (nuevo).
- **Responsable.** `release-manager` con Sonnet 5.5, esfuerzo medio. Decisión: `monetization-analyst` con Opus 5.5.
- **Dependencias.** T-F3-07 con datos.
- **Aceptación.** Informe con costes, plazos y recomendación; prototipo instalable en un dispositivo.
- **Pruebas.** Instalación en el móvil del dueño.
- **Riesgo y reversión.** Gastar en una cuenta que no se usa: por eso primero el informe.
- **Tamaño.** M. **Decisión del dueño.** La cuenta la crea y es titular el dueño (guía del estudio). Sigue pendiente de decidir: pagar la cuenta de desarrollador y conseguir 12 testers.

#### T-F3-10 Compra de apoyo y cosméticos (solo diseño)
- **Objetivo y por qué.** Preparar una compra única honesta para cuando haya tienda: quitar anuncios y un lote cosmético.
- **Pasos.** (1) Definir qué incluye. (2) Diseñar 3 cosméticos de la bufanda de Marlo que no afecten al juego. (3) Especificar cómo se guarda el derecho de compra sin servidor y qué límites tiene.
- **Archivos.** `studio/docs/MONETIZACION.md`.
- **Responsable.** `game-designer` con Opus 5.5, esfuerzo bajo. Apoyo: `art-director`, `monetization-analyst`.
- **Dependencias.** T-F3-01.
- **Aceptación.** Especificación aprobada; nada se implementa hasta T-F3-09.
- **Pruebas.** No aplica.
- **Riesgo y reversión.** Ninguno.
- **Tamaño.** S. **Decisión del dueño.** La compra de apoyo no está vetada; falta decidir qué incluye.

### F4. Contenido y eventos en vivo (6 tareas)

Meta de la fase: dar motivos para seguir jugando después del final. Solo empieza si F1-F3 muestran que hay jugadores que llegan lejos.

#### T-F4-01 Eventos semanales con mutadores
- **Objetivo y por qué.** Variedad barata reutilizando la semilla del reto diario.
- **Pasos.** (1) Lista de 10 mutadores (enemigos rápidos, solo dos etiquetas, sin corazones, doble élite). (2) Uno por semana, elegido por la fecha. (3) Recompensa cosmética o de Brasas con tope.
- **Archivos.** `src/daily.js`, `src/waves.js`, `src/cards.js`, `src/panels.js`.
- **Responsable.** `game-designer` con Opus 5.5, esfuerzo medio. Implementa `programmer` con Sonnet 5.5. Revisión: `balance-designer` con Fable 5.2.
- **Dependencias.** T-F1-05.
- **Aceptación.** Cada mutador cambia la forma de jugar y ninguno hace la partida más fácil que la normal según el banco.
- **Pruebas.** Una comprobación por mutador.
- **Riesgo y reversión.** Mutadores injustos: banco y práctica. Tabla de datos, fácil de retirar.
- **Tamaño.** M. **Decisión del dueño.** Ninguna.

#### T-F4-02 Final de partida extendido: Peligro VI o modo sin fin
- **Objetivo y por qué.** El jugador que acaba el juego necesita un techo más alto.
- **Pasos.** (1) Elegir entre un Peligro VI por jefe o un modo sin fin con marcador. (2) Diseñar la escalada. (3) Medir con el banco.
- **Archivos.** `src/boss.js`, `src/waves.js`, `src/save.js`.
- **Responsable.** `balance-designer` con Fable 5.2, esfuerzo alto. Implementa `programmer` con Sonnet 5.5.
- **Dependencias.** T-F2-03.
- **Aceptación.** El bot hábil no supera el nuevo techo de forma consistente.
- **Pruebas.** Celdas nuevas en el banco.
- **Riesgo y reversión.** Poco. Contenido opcional.
- **Tamaño.** M. **Decisión del dueño.** Sí: cuál de las dos opciones.

#### T-F4-03 Cosméticos ganables
- **Objetivo y por qué.** Recompensas visibles que no alteran el balance: buenas para logros, retos y, más adelante, para la compra de apoyo.
- **Pasos.** (1) Sistema de aspecto para la bufanda y la estela. (2) 6 variantes ligadas a logros y al reto diario. (3) Selector en el Archivo.
- **Archivos.** `src/assets.js`, `src/player.js`, `src/panels.js`, `src/save.js`.
- **Responsable.** `art-director` con Opus 5.5, esfuerzo medio. Implementa `programmer` con Sonnet 5.5.
- **Dependencias.** T-F0-07.
- **Aceptación.** Cambiar de aspecto no altera ninguna cifra de combate (prueba de semilla).
- **Pruebas.** Prueba de semilla con y sin cosmético.
- **Riesgo y reversión.** Bajo.
- **Tamaño.** M. **Decisión del dueño.** Ninguna.

#### T-F4-04 Más profundidad de builds
- **Objetivo y por qué.** Mantener viva la decisión central del juego: qué fusionar.
- **Pasos.** (1) Con datos de uso, detectar fusiones que nadie elige y las que siempre se eligen. (2) Rediseñar las 3 peores. (3) Proponer un tercer nivel de fusión o sinergias entre poderes.
- **Archivos.** `src/fusion.js`, `src/cards.js`, `DESIGN-fusion.md`.
- **Responsable.** `game-designer` con Opus 5.5, esfuerzo alto. Números: `balance-designer` con Fable 5.2. Implementa `programmer` con Sonnet 5.5.
- **Dependencias.** T-F1-01, T-F2-01.
- **Aceptación.** Ninguna fusión por debajo del 3 % de uso ni por encima del 20 % en los datos (umbrales a confirmar).
- **Pruebas.** Las del grupo `powers` actualizadas.
- **Riesgo y reversión.** Romper el balance cerrado en F2: repetir el banco.
- **Tamaño.** L. **Decisión del dueño.** Ninguna.

#### T-F4-05 Repaso de arte y cinemáticas
- **Objetivo y por qué.** Subir el acabado de lo primero que ve el jugador y de lo que sale en capturas.
- **Pasos.** (1) Guía de arte de una página. (2) Sustituir las viñetas de la intro que aún parecen de reserva. (3) Revisar la legibilidad de telegrafías en los 6 biomas.
- **Archivos.** `src/assets_cine*.js`, `src/cine_intro.js`, `studio/docs/ARTE.md` (nuevo).
- **Responsable.** `art-director` con Opus 5.5, esfuerzo alto.
- **Dependencias.** T-F1-02.
- **Aceptación.** Las 6 viñetas de la intro aprobadas por el dueño; contraste de telegrafías medido sobre cada suelo.
- **Pruebas.** Capturas comparadas y coste de dibujo medido.
- **Riesgo y reversión.** Coste de rendimiento del arte nuevo: medir con `perf`.
- **Tamaño.** M. **Decisión del dueño.** Aprobar el arte.

#### T-F4-06 Música propia para cada bioma
- **Objetivo y por qué.** Cuatro de los seis biomas comparten pista. La música distinta refuerza la sensación de avanzar.
- **Pasos.** (1) Dirección sonora por bioma en media página. (2) Pistas procedurales para Cripta, Asfódelo y Cráter. (3) Mezcla revisada en altavoz de móvil.
- **Archivos.** `src/assets.js` (música), `src/sfx*.js`, `src/main.js:395`.
- **Responsable.** `audio-designer` con Sonnet 5.5, esfuerzo medio; la dirección sonora con Opus 5.5.
- **Dependencias.** Ninguna.
- **Aceptación.** Cada bioma suena distinto en una prueba a ciegas del dueño; sin cortes al cambiar de intensidad.
- **Pruebas.** Comprobación de que cada bioma selecciona su pista.
- **Riesgo y reversión.** Coste de CPU del audio procedural: medir.
- **Tamaño.** M. **Decisión del dueño.** Aprobar las pistas.

---

### Cierre del plan (1 tarea)

#### T-FIN-01 Retirar la inmortalidad por defecto
- **Objetivo y por qué.** El juego es inmortal salvo `?god=0` (`src/main.js:20`) para que el dueño pruebe funcionalidades. Decisión del dueño (2026-11-13): se retira AL FINAL del plan. Mientras tanto el reto real no se juega por defecto y el balance se valida con `?god=0` (bots y playtest).
- **Pasos.** (1) `G.god` pasa a valer 0 por defecto. (2) `?god=1` solo se lee con `?dev=1` o en `localhost` (conserva el modo de prueba del dueño). (3) Los bots ya usan `?god=0`/`dev=1`. (4) Revisar que analítica y récords ignoren partidas con `god=1`.
- **Archivos.** `src/main.js`, `src/save.js`, `tools/card-swarm-bot/*.js`.
- **Responsable.** `programmer` con Sonnet 5.5, esfuerzo bajo. Revisión: `qa-tester`.
- **Dependencias.** Todo el plan que el dueño quiera probar con inmortalidad; T-F0-03.
- **Aceptación.** En URL limpia `G.god === false`; con `?dev=1&god=1` sigue el modo inmortal; la batería pasa.
- **Pruebas.** Ampliar el grupo `dev` de T-F0-03.
- **Riesgo y reversión.** **Dudoso, a confirmar con el dueño:** T-F3-06 (itch) y T-F3-07 (portales) publican el juego a jugadores reales. Publicar con inmortalidad por defecto daría una imagen falsa del reto; propuesta: esas publicaciones salen con `god` apagado (perfil de build) o T-FIN-01 se adelanta a antes de T-F3-06. Revertir el commit.
- **Tamaño.** S. **Decisión del dueño.** Resuelta: se retira al final del plan (la fecha exacta respecto a la publicación queda por confirmar).

---

## 6. Preguntas al dueño (respondidas el 2026-11-13; ver "Decisiones del dueño")

1. **Inmortalidad.** ¿Desde cuándo quieres jugar sin ella? Mientras esté puesta no se puede validar el reto (T-F0-03).
2. **Marlo.** ¿Mapache o corderito? (T-F0-07)
3. **Créditos.** ¿Apruebas los nombres cómicos o los cambias? (T-F0-08)
4. **Qué es "reto" en números.** ¿Qué porcentaje de intentos debería ganar un jugador competente en Peligro I, III y V? (T-F2-02, T-F2-03)
5. **Móviles lentos.** ¿Menos enemigos pero más duros, o el mismo número aunque baje la fluidez? (T-F0-05)
6. **Intro.** ¿Aceptas acortarla la primera vez para llegar antes al combate? (T-F1-02)
7. **Pantalla.** ¿Ensanchamos el área de juego en teléfonos alargados o solo movemos los controles a las franjas? (T-F1-08)
8. **Modo corto.** ¿Quieres una expedición de 4 minutos? (T-F1-10)
9. **Datos.** ¿Analítica solo local, o envío anónimo a un servicio con aviso de privacidad? (T-F1-01)
10. **Dinero.** ¿Qué te parece aceptable: solo donación, anuncios recompensados, compra única de apoyo? ¿Hay algo vetado? (T-F3-01, T-F3-03)
11. **Idioma.** ¿Traducimos al inglés? ¿Se traducen los nombres de personajes y cartas? (T-F3-04)
12. **Cuentas.** ¿Quién crea y es titular de las cuentas de itch.io, portales y Play Console, y con qué datos de cobro? (T-F3-06, T-F3-07, T-F3-09)
13. **Exclusividad.** Si Poki pide exclusividad en web, ¿la aceptarías? (T-F3-07)
14. **Nombre.** ¿"Swarm Hand" es definitivo? (T-F3-08)
15. **Ember Flock y el clásico.** ¿Se retiran del sitio y de `main`? (T-F0-13, T-F0-09)
16. **Meta de horas.** ¿Siguen siendo ~16 horas hasta el final? (T-F2-05)
17. **Permisos.** ¿Permites corregir `ceo.md` y `programmer.md` para quitar la mención a Phaser y listar a todo el equipo? (T-F0-09)

## Decisiones del dueño (2026-11-13)

Respuestas a las 17 preguntas de la sección 6 y qué tareas ajustan.

| # | Tema | Decisión | Tareas afectadas |
|---|---|---|---|
| 1 | Inmortalidad | Se retira AL FINAL del plan; por ahora se queda para probar funcionalidades. En T-F0-03 solo queda cerrar los parámetros de depuración (`give`, `pf`, `cmul`, `reset`) tras `?dev=1`; `?god` no se toca. Si eso rompe lo que el dueño usa para probar, se avisa y se aplaza. | T-F0-03 (reducida), T-FIN-01 (nueva), T-F2-06 |
| 2 | Marlo | Es MAPACHE. Se corrige el texto/lore que dice corderito; el sprite no se rehace. | T-F0-07 |
| 3 | Créditos | Nombres aprobados, incluido el bloque "Nuestro jefe supremo". | T-F0-08 (resuelta) |
| 4 | Qué es "reto" | Objetivo de victorias de un jugador competente: Peligro I 50 %, II 40 %, III 30 %, IV 20 %, V 10 %. Primero respondió "50, 40, 30, 20" (cuatro cifras para tres niveles) y después aclaró la serie completa. Ya no está pendiente. | T-F2-01, T-F2-02, T-F2-03 |
| 5 | Móviles lentos | Menos enemigos pero más duros y un poco más rápidos. | T-F0-05 |
| 6 | Intro | NO se acorta la primera vez. | T-F1-02 |
| 7 | Pantalla | Ensanchar el área de juego en teléfonos alargados. | T-F1-08 |
| 8 | Modo corto | NO: descartado. | T-F1-10 (descartada) |
| 9 | Analítica | Anónima, con envío a un servicio y aviso de privacidad. Falta elegir el servicio. | T-F1-01, T-F3-01 |
| 10 | Ingresos | Nada vetado: donación, anuncios recompensados y compra de apoyo. Los principios de la sección 2 siguen. | T-F3-01, T-F3-03, T-F3-10 |
| 11 | Idioma | Inglés para empezar; a futuro varios idiomas. Sin aclarar: nombres propios y cartas, e idioma por defecto. | T-F3-04 |
| 12 | Cuentas | Las crea y es titular el dueño; el estudio prepara guías paso a paso, nunca credenciales. | T-F3-01, T-F3-06, T-F3-07, T-F3-09 |
| 13 | Poki | Exclusividad solo si pagan muy bien. | T-F3-07 |
| 14 | Nombre | "Swarm Hand" es definitivo. | T-F3-08 |
| 15 | Ember Flock y clásico | Se retiran del sitio y de `main`. Hecho. | T-F0-13 (hecha), T-F0-09 |
| 16 | Meta de horas | ~16 horas, se mantiene. | T-F2-05 |
| 17 | Permisos | Concedido para corregir `ceo.md` y `programmer.md`. Hecho. | T-F0-09 |

Pendiente o dudoso tras estas decisiones: servicio de analítica (1), traducción de nombres propios e idioma por defecto (11), datos de cobro (12), y si se publica en itch o portales con la inmortalidad aún activa (ver T-FIN-01).

## 7. Los 5 primeros pasos recomendados

Hecho el 2026-11-13: T-F0-13 (retirada de Ember Flock y del clásico), T-F0-09 (salvo los conteos del README) y la resolución de T-F0-08. Decididas pero con trabajo pendiente: T-F0-07 (texto de Marlo).

1. **T-F0-01**: reparar las herramientas de prueba. Hoy no corre ninguna y todo lo demás depende de ellas.
2. **T-F0-12**: que el dueño haga la sesión guiada de 20 minutos en su móvil. Es la mayor incógnita y no cuesta desarrollo.
3. **T-F0-02 y T-F0-03**: pruebas en cada PR y cerrar los parámetros de depuración (la inmortalidad se queda hasta T-FIN-01), en ese orden.
4. **T-F0-05**: simulación reproducible y dificultad equivalente en todos los dispositivos (menos enemigos, más duros y rápidos en móviles lentos). Desbloquea el balance, el reto diario y los récords.
5. **T-F1-01 y T-F1-02**: analítica mínima (con aviso de privacidad) y la primera sesión sin rodeos tras la intro completa. A partir de ahí cada cambio se puede medir.

## 8. Qué quedó sin revisar

- Rendimiento, legibilidad, instalación y uso sin conexión en un teléfono real.
- Frame-time en móvil: `perf_bot.js` solo se ejecutó en PC sin GPU real.
- Lectura línea a línea de los ~17.000 renglones de arte procedural y de los archivos de sonido: solo se revisó su estructura y sus puntos de contacto.
- Balance de Peligro IV-V y de Corrosión: no se volvió a medir.
- Documentación oficial de CrazyGames y Poki: no accesible desde esta sesión.
- `games/survival-lamb` y `games/card-swarm-clasico`: solo estructura y estado, no su código (retirados de `main` el 2026-11-13).
