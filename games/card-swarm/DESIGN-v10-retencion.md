# Swarm Hand - Diseño v10: retención (reto diario, objetivos y racha amable)

Tareas: **T-F1-05** (reto diario con semilla) y **T-F1-06** (objetivos diarios y semanales con racha amable) de `studio/docs/PLAN-MAESTRO.md` (líneas 431-451). Autor: game-designer. Estado: diseño con las decisiones del dueño del 2026-11-14 incorporadas; no hay código.

## Decisiones del dueño (2026-11-14)

| # | Pregunta | Decisión | Qué cambia en este documento |
|---|---|---|---|
| 1 | Inmortalidad en el reto | El reto se juega **SIEMPRE** sin inmortalidad, también con `?dev=1&god=1` | 1.1, 1.8, textos B4/B5, prueba 13 |
| 2 | Premio del reto | Solo materiales y medallas, **sin PF** (tabla recomendada) | 1.6 se mantiene; con el kit no cambia ninguna cifra (1.10.9) |
| 3 | Zona horaria | **UTC para todo** | 3.3 (ya era así; se quita la pregunta) |
| 4 | Equipo en el reto | **Kit igual para todos que rota cada semana**, no el equipo de la cuenta | Sección nueva **1.10 (kits semanales)**; 1.1 pasos 4-5 y tabla "qué cuenta"; 1.4 (huella), 1.5 (pantalla), textos A, guardado, archivos, pruebas, riesgos y esfuerzo |
| 5 | Cuándo se abre el reto | **Tras la 3.ª expedición** (`runs >= 3`); vencer al Pastor ya no lo abre | 1.1, 1.7, texto A17, disponibilidad de objetivos 2.2-2.3, pruebas |

Las preguntas nuevas que salen del sistema de kits están en la sección 6.

Condiciones que respeta este diseño (Decisiones del dueño, `PLAN-MAESTRO.md:818-844`, y principios de la sección 2, `:139-143`):
- El juego es un reto: objetivo de victorias de un jugador competente por Peligro I-V = 50/40/30/20/10 % (`:823`). El reto diario se juega en Peligro II-IV con mutadores que nunca facilitan la partida.
- Nada de pagar por ganar, nada de culpa: la racha no se pierde por faltar un día ni dos, y nunca vuelve a cero.
- Sin servidor y sin conexión: todo se deriva de la fecha del dispositivo y se guarda en `localStorage`.
- No hay modo corto de 4 minutos (`:827`): el reto dura lo mismo que una expedición Normal (9 min).
- La recompensa no rompe la economía (cifras y fuentes en 1.6 y 2.6).
- Anuncio recompensado futuro: "un segundo intento del reto diario" (`PLAN-MAESTRO.md:173`). Queda previsto en datos, sin implementar.

Desvíos respecto al texto del plan (justificados en su sección):
1. **Duración fija de 9 min** en vez de "elegida por la semilla" (1.1): las puntuaciones de días distintos se comparan y la economía del reto es más simple. No es el modo corto que el dueño descartó.
2. **Dos objetivos semanales** activos en vez de uno (2.2): uno normal y uno difícil. Aun así la suma semanal queda por debajo del tope de 2 expediciones (2.6).
3. **El Cráter no entra en el reto** (1.1): el Asalto a Cenizar es una pelea de estilo cacería, sin horda (`src/main.js:370`), y no encaja con las reglas del reto.
4. **El reto no da el botín normal de la expedición** (1.6): paga una tabla fija por medalla. Así no toca jefes vencidos, Peligro, trofeos ni PF de la campaña.
5. **Anclas, baraja y equipo los fija el kit de la semana** (decisión 4), no la semilla del día ni la cuenta. El plan decía "anclas fijadas por la semilla entre lo que el jugador tiene desbloqueado" (`PLAN-MAESTRO.md:433`). La semilla del día sigue eligiendo bioma, Peligro, mutadores y las 2 etiquetas de acompañamiento.

---

## 0. Qué existe ya y dónde engancha

| Pieza existente | Dónde | Uso en este diseño |
|---|---|---|
| Día de juego en UTC: `Q.dayIndex() = floor(Date.now()/86400000)` | `src/quests.js:156` | Misma definición de "día" para reto, objetivos y racha |
| Hash FNV-1a `hash(str)` y generador `rng(seed)` (mulberry32) | `src/quests.js:154-155` | Semillas de las reglas del día; conviene moverlos a `G.util` y reutilizarlos |
| RNG sembrable de la simulación `G.rngSeed(n)` | `src/main.js:154-165` | Semilla de la simulación del reto |
| Simulación reproducible por pasos (`G.step()`, `?speed=0`) | `README.md:130`, `studio/docs/SPEC-T-F0-05.md` | Prueba de determinismo |
| Perfil de dificultad por calidad `G.D` (n, h, d, s, x), fijado al empezar | `src/main.js:343-348`, `README.md:132-140` | Los mutadores de horda multiplican sobre `G.D`; el perfil queda anotado en cada resultado |
| Modos de salida `G.mode`: run, hunt, practice | `src/main.js:25`, `:367` | El reto es `G.mode = 'run'` con `G.daily` (objeto de reglas). No se crea un modo nuevo porque `waves.js:125` manda todo lo que no es `'run'` a la cacería |
| Ruta de la práctica que no gasta compras ni plato | `src/main.js:353-356` | El reto la reutiliza: sin Tónico, Imán ni plato |
| Fin de práctica sin botín (`L.endPractice`) | `src/loot.js:264-271`, `src/main.js:425` | Modelo de `L.endDaily` |
| Tabla de Peligro I-V | `src/boss.js:65-70` | Peligro del reto |
| Duraciones y balance de la meta | `src/loot.js:21-25`, `:49`, `:73-92` | Referencia de la economía |
| Tablón de Vesper: un encargo activo, rotación por día + expediciones | `src/quests.js:143-180`, `src/panels.js:89-207` | Los objetivos van en un panel aparte (2.6) |
| Marcas "!" de la aldea por NPC | `src/aldea.js:531-548` | Marca dorada en el Portal (reto pendiente) y en Vesper (objetivos nuevos) |
| Pestañas del Portal SALIDA / CARTAS | `src/panels.js:321`, `:419` | Nueva pestaña RETO |
| Pantalla de fin y botones | `src/base.js:8-12`, `:50-52`, `:143-147` | Variante del reto |
| Parámetros cerrados tras `?dev=1` | `src/dev.js:7-13` | Nuevo parámetro `today` (fecha simulada) |
| Guardado v12 con escritura segura, copias rotativas, IndexedDB, validador y recuperación (T-F1-11) | `src/save.js:29`, `:56-200`, `:276-351` (migrate), `:370-397` (load), `:400-429` (adopt), `:433-468` (exportar/importar) | Migración v12 -> v13 apoyada en todo eso (3.2) |

---

## 1. Reto diario (T-F1-05)

### 1.1 Reglas exactas

**Quién puede jugarlo.** Se abre al terminar la 3.ª expedición (`runs >= 3`; decisión 5). Antes no aparece: la primera sesión es de T-F1-02.

**Día y semilla.**
- Día del reto = fecha UTC `AAAA-MM-DD` (la misma base que el Tablón, `src/quests.js:156`). Cambia a las 00:00 UTC (01:00 en España en invierno y 02:00 en verano).
- Semilla de reglas: `hash('SH-reto|' + fecha + '|r1')`. Semilla de la simulación: `hash('SH-reto|' + fecha + '|s1')`. Son dos flujos separados: elegir las reglas no consume el RNG de la partida.
- `r1` es la versión de las reglas. Si se cambian las reglas o la tabla de mutadores, se sube a `r2` y el historial guarda la versión de cada entrada.

**Orden fijo de elección.** Todas las tiradas se hacen siempre en el mismo orden y en el mismo número, sea cual sea la cuenta. Los filtros de cada jugador se aplican después. Así dos cuentas con lo mismo desbloqueado reciben exactamente lo mismo.

1. **Bioma.** Permutación de `[bosque, cripta, asfodelo, tundra, panal]` (Fisher-Yates, 4 tiradas). Se juega el primer bioma de la permutación que el jugador tenga abierto (`Q.unlockedBiomes`, `src/quests.js:123-126`). Como los biomas se abren en cadena, quien lo tiene todo juega `permutación[0]` y una cuenta joven cae en un bioma anterior. El jefe es el de ese bioma (`G.Boss.bossFor`, `src/main.js:388`).
2. **Peligro del día.** 1 tirada: II 35 %, III 45 %, IV 20 %. Nunca I (es un reto) ni V (tope de un 10 % de victorias: frustraría a diario). **Excepción de novato:** si nunca has vencido a ese jefe, el reto se juega en Peligro II como máximo y la pantalla lo dice ("Reto suave").
3. **Mutadores.** Se baraja la tabla 1.2 (11 tiradas) y se eligen en ese orden hasta 2 que cumplan tres condiciones: familias distintas, sin incompatibilidades y suma de pesos dentro del presupuesto (Peligro II <= 2; III <= 1,5; IV <= 1). Siempre sale al menos 1. En el MVP solo entran los mutadores marcados "MVP".
4. **Baraja del día = 2 etiquetas del kit de la semana + 2 de acompañamiento.** Se barajan las 4 etiquetas que no son del kit (3 tiradas, que se hacen siempre) y se toman las 2 primeras. Con el mutador "Dos etiquetas" solo quedan las 2 del kit. Reglas de ajuste en 1.10.5: Fuego obligatorio en Tundra y Panal, y respuesta a las resistencias del jefe.
   - Cartas de ataque: las 3 de cada etiqueta (Fuego: Chispa, Bola de brasa, Anillo; Hielo: Esquirla, Nova, Ventisca; Rayo: Chispazo, Tormenta, Bobina; Veneno: Dardo, Charco, Nube; Sangre: Colmillo, Sangría, Murciélago; Acero: Daga, Hacha, Púas; `src/cards.js:13-42`).
   - Pasivas: la de cada etiqueta que la tenga (Manto, Cristal, Cascabel, Bilis, Afilar) y 3 de las 5 neutrales (Lana, Reloj, Pezuñas, Imán, Alforja; 2 tiradas para elegirlas).
   - Resultado: 14-19 cartas (8-11 con "Dos etiquetas"). Las ofertas solo salen de la baraja (`pool()`, `src/cards.js:116`).
5. **Ancla del kit.** La fija el kit de la semana (1.10.4): 1 ancla para todos, aunque la cuenta tenga el nodo "Segunda ancla" (`src/tree.js:176`). Se mantiene la regla de la 1.ª fusión ayudada y la 1.ª oferta con receta garantizada (`README.md:40`).

**Qué cuenta de tu progreso: nada de poder** (decisión 4). El reto se juega con el **kit de la semana** (1.10), igual para todos. Lo que la cuenta ha conseguido (armadura, árbol de forja, rangos, anclas, plato, compras de Rufo, refuerzos de Ruta, equipo de prueba) queda neutralizado durante el reto y no se toca (1.10.2). Siguen dependiendo de la cuenta solo dos cosas, y ninguna es de poder:
- **Qué bioma toca:** el primero de la permutación que tengas abierto, para no destripar biomas que no has visto.
- **La excepción de novato del Peligro:** si nunca has vencido al jefe del día, Peligro II como máximo.

El encargo de Vesper ni avanza ni pesa en el director (`qTarget()` devuelve null, `src/waves.js:99-100`). El `?seed=` de la URL no afecta: el reto usa su semilla y al terminar se restaura la anterior. El perfil de calidad del dispositivo (`G.D`) se aplica como en cualquier salida.

**Duración y reloj.** Normal, 9 min, con el jefe a las 7:30 (`G.setLen(9)`, `src/main.js:15`). No depende de `Save.data.len`.

**Inmortalidad.** El reto se juega siempre sin ella (decisión 1): `G.god = false` al empezar, aunque esté activa por defecto (`src/main.js:20`) e incluso con `?dev=1&god=1`. Al terminar el reto se restaura el valor anterior de `G.god`.

### 1.2 Mutadores (lista inicial de 12; 9 en el MVP)

Regla de T-F4-01 (`PLAN-MAESTRO.md:717`): ningún mutador hace la partida más fácil que la normal. Todos se validan con el banco de T-F2-01 antes de activarse.

| id | Nombre | Efecto | Familia | Peso | Enganche en el código | MVP |
|---|---|---|---|---|---|---|
| `veloz` | Enjambre veloz | Enemigos normales +15 % de velocidad | horda | 1 | `G.D.s x 1,15` (`src/main.js:343-347`) | sí |
| `marea` | Marea | +15 % de enemigos (presupuesto y tope) | horda | 1 | `G.D.n x 1,15` (`src/waves.js:142`, `:145`) | sí |
| `duros` | Pellejo duro | Enemigos normales +20 % de vida | horda | 1 | `G.D.h x 1,2` | sí |
| `sincor` | Sin corazones | Los enemigos no sueltan corazones | jugador | 1 | `heartP = 0` (`src/main.js:31`) | sí |
| `bolsillo` | Bolsillos cortos | Radio de recogida -40 % | jugador | 0,5 | `player.pickup x 0,6` | sí |
| `cristal` | Piel de cristal | Recibes +20 % de daño | jugador | 1 | multiplicador de daño recibido junto a `zoneDmg` | sí |
| `dos` | Dos etiquetas | La baraja solo trae las 2 etiquetas del kit | mano | 1 | baraja del día (1.1, paso 4); no sale en Tundra ni Panal si el kit no trae Fuego (1.10.5) | sí |
| `sincambio` | Sin cambios | No se puede pagar para cambiar la oferta | mano | 0,5 | `C.reroll` desactivado (`src/cards.js:238`) | sí |
| `curtidos` | Guardianes curtidos | Guardianes +35 % de vida | jefe | 1 | multiplicador sobre `guardHp` (`src/loot.js:21-25`) | sí |
| `furia` | Furia temprana | El jefe entra en furia 30 s antes | jefe | 1 | `fury - 30000` sobre la fila de Peligro (`src/boss.js:66-70`) | fase 2 |
| `pesados` | Poderes pesados | Enfriamiento de poderes +20 % | mano | 1 | factor de cooldown de poderes (`pcd`) | fase 2 |
| `cortamano` | Mano corta | 4 huecos de mano en vez de 5 | mano | 1,5 | `cards.js` (huecos); toca el invariante de la mano | fase 2 |

Incompatibles: `dos` con `cortamano` (deja la mano sin opciones), `marea` con `veloz` (los dos son de horda; ya lo impide la regla de familias).

**Rendimiento.** `marea` añade enemigos. En calidad BAJA sigue mandando el perfil `G.D.n` (x0,75 x 1,15 = 0,86); lo vigila `performance-engineer` con `perf_bot.js`.

### 1.3 Intentos por día

- **1 intento con premio por día** (el "oficial"). Se gasta al pulsar EMPEZAR en la confirmación, no al terminar. Así no compensa cerrar el juego si la partida empieza mal.
- **Reintentos ilimitados sin premio** después del oficial, con la misma semilla y las mismas reglas: sirven para aprender el día. Su mejor puntuación se muestra aparte ("mejor reintento") y no cuenta para medalla, récord ni premio.
- **Cierre o caída a mitad.** Cada 15 s de juego se guarda un punto de control (`daily.live`). Si el juego se cierra, en la siguiente carga el intento se da por terminado con la puntuación y los hitos guardados, y se paga su medalla. Nadie pierde el día por una llamada entrante.
- **Abandonar desde la pausa** termina el intento con lo que lleves.
- **Segundo intento por anuncio (previsto, sin implementar).** Campo `daily.extraDay`. Si algún día existe `G.Platform.canShowAds()` (T-F3-02/03), un botón en el resultado daría un 2.º intento con premio ese día. El oficial pasaría a ser el mejor de los dos y solo se pagaría la diferencia de medalla. Máximo 1 al día. No cambia la dificultad: no es pagar por ganar.

### 1.4 Puntuación y récord personal

Puntuación base del intento (todo sale del estado de la simulación, así que es determinista):

| Concepto | Puntos | Fuente |
|---|---|---|
| Tiempo vivo | 2 por segundo de expedición, máx. 1.080 (9 min) | `G.runT - G.t0` |
| Bajas | 1 por baja ponderada (suma de `e.dRew`; en ALTA es la baja real) | `src/loot.js:199` |
| Guardianes | 200 por guardián abatido, 50 por parte de guardián rota | `L.run.miniParts` (`src/quests.js:207`) |
| Jefe | 10 por cada 1 % de vida quitada (máx. 1.000) y 150 por parte rota | `binfo.hpFrac`, `bs.parts` (`src/loot.js:247`) |
| Victoria | +1.000, y +5 por cada PV que te quede | `G.won`, `G.player.hp` |

**Multiplicador del día** = 1 + 0,2 x (Peligro - 1) + 0,1 x (suma de pesos de los mutadores). Peligro II x1,2; III x1,4; IV x1,6. Ejemplo: III con `veloz` y `sincambio` = 1,4 + 0,15 = **x1,55**. Puntuación final = base x multiplicador, redondeada.

Por qué las bajas son ponderadas: en MEDIA y BAJA hay menos enemigos que valen más (`README.md:134-140`). Contar `dRew` deja la puntuación comparable entre dispositivos.

**Medallas por hitos, no por umbrales de puntos** (no hay que calibrar puntos por bioma):

| Medalla | Hito |
|---|---|
| Participación | Terminar el intento |
| Bronce | Seguir vivo cuando aparece el jefe (7:30) |
| Plata | Romper al menos 1 parte del jefe o quitarle al menos el 50 % de la vida |
| Oro | Vencer al jefe |

Objetivo de dificultad: que un jugador competente saque Oro en un 25-35 % de los días, la franja de Peligro III (`PLAN-MAESTRO.md:823`). Lo mide `balance-designer` con el banco; las palancas son los pesos de Peligro del paso 2 y el presupuesto de mutadores.

**Récord personal y marcador local:**
- `best`: mejor puntuación oficial de siempre (con fecha y medalla).
- Historial de los **últimos 30 días** con intento oficial (T-F1-05 paso 3).
- Medallero: Oros, Platas, Bronces y participaciones acumulados.
- "¡NUEVO RÉCORD!" cuando un oficial supera `best`.

**Dato preparado para una tabla en línea futura** (T-F1-05 paso 5). Cada entrada guarda `{ rv, day, biome, boss, peligro, mut, deckId, kit, kv, score, base, mul, medal, won, t, kills, bossFrac, parts, dq, build, dev }`. `kit` y `kv` son el kit de la semana y su versión (1.10). `dq` es el perfil de calidad y `build` el sello del service worker. Ya no hace falta la huella del equipo de la cuenta: con el kit, dos resultados del mismo día y del mismo perfil se comparan tal cual. No se envía nada a ningún sitio.

**Texto para compartir** (T-F1-05 paso 4): botón COMPARTIR. Usa `navigator.share` si existe y, si no, copia al portapapeles. Texto exacto en la sección 4.

### 1.5 Pantallas de entrada y de resultado

**Entrada: pestaña RETO del Portal** (tercera pestaña, junto a SALIDA y CARTAS, `src/panels.js:321`, `:419`). La pista "Tab: cambiar de página" (`src/panels.js:420`) se mueve a la derecha de las tres pestañas para que no se solape.

Distribución en 960x540 (texto >= 12 px lógicos):
- Arriba: título "RETO DEL DÍA" + fecha, y a la derecha la cuenta atrás hasta el próximo reto.
- Columna izquierda (DESTINO): icono del bioma (`Assets.drawDestIcon`), nombre, jefe y chip de Peligro. Debajo los mutadores, cada uno con icono y una línea de efecto.
- Columna derecha, arriba: **bloque KIT DE LA SEMANA** (1.10.7): emblema, nombre, lema, 4 piezas de armadura, ancla y botón VER KIT. Debajo: baraja (iconos de las etiquetas + número de cartas), tabla de premios por medalla y récord personal.
- Botón grande abajo a la derecha, `R_GO` (`src/panels.js:320`): EMPEZAR RETO o REINTENTAR (SIN PREMIO).
- Cuenta todavía cerrada: un solo texto centrado con la condición de apertura.

Al pulsar EMPEZAR RETO sale una confirmación modal de dos botones (EMPEZAR / AÚN NO). Recuerda que el intento cuenta aunque salgas.

**En partida.** Chip del HUD arriba al centro: "RETO  1.230" (puntos en vivo, sin el multiplicador) y, a la izquierda del chip, la medalla ya asegurada en pequeño. El HUD no lleva nada más.

**Resultado** (variante de `Bs.drawEnd`, `src/base.js:53-142`):
- Título: RETO SUPERADO (Oro) / RETO TERMINADO (el resto). Subtítulo: fecha, bioma y Peligro.
- Columna izquierda sin cambios: mano final, poderes y resumen del jefe.
- Panel derecho (sustituye al BOTÍN): medalla grande; desglose de puntos en 5 líneas (Tiempo, Bajas, Guardianes, Jefe, Victoria), multiplicador y total; récord del día o personal; premio cobrado; línea de objetivos diarios que avanzaron.
- Botones: izquierda REINTENTAR (SIN PREMIO) y derecha IR A LA ALDEA (`END_RETRY` / `END_BASE`, `src/base.js:8`). Botón pequeño COMPARTIR encima del panel.
- En un reintento, el panel dice "Reintento: sin premio" y enseña la medalla que habría sacado.

### 1.6 Recompensa (solo el intento oficial)

**De dónde salen las cifras.** Referencia: "expedición normal" (EN) = expedición Normal de 9 min de un jugador real que llega al jefe.
- Brasas: `21 x (m + 0,04 x m^2)` con el reloj congelado en el jefe, m = 7,5 -> 205 (`src/loot.js:74-76`, `:225`). A eso se suman la Ceniza sobrante x 0,015 y el jefe: 12-20 Brasas + 4-5 por parte, x Peligro (`src/boss.js:54`, `src/boss_cenizar.js:48`, `src/boss.js:66-70`). Medido con bot: 226 Brasas en 9 min con el `BRASAS_MIN` antiguo de 18 (`src/loot.js:84`), unas 260 con 21. Un jugador real muere antes y recoge menos: **EN ~ 200 Brasas**.
- Partes: 123 por expedición de 9 min con bot (`src/loot.js:84`); el jugador real saca ~x0,7 (`src/loot.js:89`): **EN ~ 85 partes**.
- Si vence: 1 Esencia segura del jefe (`src/loot.js:64`), 2-3 PF (`src/boss.js:54`) y trofeos.
- Precios de referencia: Tónico 80, Imán 120, parte en Rufo 24 Brasas (`src/loot.js:132`); carta común desde 156 Brasas (40 x 3,9, `src/loot.js:79`, `:107`).

| Medalla | Brasas | Partes | Esencia | PF | Frente a una EN |
|---|---|---|---|---|---|
| Participación | 40 | 10 | 0 | 0 | 20 % de las Brasas |
| Bronce | 90 | 25 | 0 | 0 | 45 % |
| Plata | 130 | 35 | 0 | 0 | 65 % |
| Oro | 180 | 45 | 1 | 0 | 90 % de las Brasas y la mitad de las partes; sin PF ni trofeos |

**Reparto de las partes** con la mezcla que da una expedición (proporciones de `L.EXPECT`, `src/loot.js:92`; redondeo por mayor resto):

| Premio | Hebra | Pluma | Púa | Colmillo | Placa | Mecha | Escarcha | Jirón |
|---|---|---|---|---|---|---|---|---|
| 10 | 5 | 1 | 1 | 1 | 0 | 1 | 0 | 1 |
| 25 | 12 | 3 | 3 | 2 | 1 | 2 | 1 | 1 |
| 35 | 17 | 4 | 4 | 2 | 1 | 3 | 2 | 2 |
| 45 | 21 | 5 | 6 | 3 | 2 | 4 | 2 | 2 |

**Justificación frente a la economía:**
- **Por minuto, el reto paga menos que la campaña.** Hasta el Oro queda por debajo de una EN ganada (sin PF, sin trofeos, la mitad de las partes). Quien juega el reto en lugar de una expedición no gana más deprisa. Lo que atrae es la medalla, el récord y el medallero.
- **Sin PF.** Los PF tienen techo (24, `src/loot.js:129`) y van atados a vencer jefes y minijefes. Darlos a diario adelantaría la build final y sería ventaja acumulada. **Decidido por el dueño (decisión 2): sin PF.**
- **Sin trofeos ni insignias.** Son la llave de la armadura de Carapa (`README.md:66-67`). Si el reto en Peligro IV los diera, se saltaría el desbloqueo de Peligro.
- **1 Esencia solo con Oro**, igual que la que da un jefe vencido. Como mucho 7 por semana con 7 Oros, cuando el objetivo de Oro es un 25-35 % de los días: en la práctica 2-3 por semana.
- **Cosmético:** cada medalla se apunta en el medallero. Los hitos de 10 y 30 Oros quedan reservados para las variantes de bufanda de T-F4-03 (`PLAN-MAESTRO.md:733-742`). Sin efecto en combate.

### 1.7 Presentación en la aldea y en el Portal

- **Marca dorada "!" sobre el Portal** cuando el reto está abierto y el oficial de hoy no se ha jugado (nuevo caso en `drawMarks`, `src/aldea.js:533-543`; hoy el Portal no tiene marca).
- **Burbuja corta al acercarse al Portal** (`src/aldea.js:341`): "Reto del día listo".
- **Lanudo** suma una línea a su repertorio de consejos (`src/aldea.js:176`): "Dicen que el Portal guarda un reto distinto cada día. Igual para todos."
- **Primera vez que se abre** (cuenta que acaba de cumplir la condición): aviso de una línea al volver a la aldea: "Nuevo en el Portal: el reto del día."
- Al abrir el Portal, la pestaña inicial sigue siendo SALIDA. La pestaña RETO lleva el chip "NUEVO" (como los destinos nuevos, `src/panels.js:469`) mientras el oficial de hoy esté pendiente.

### 1.8 Inmortalidad, trampas y `?dev=1`

| Situación | Qué pasa |
|---|---|
| Inmortalidad por defecto (Pages hasta T-FIN-01) | Se ignora en el reto: siempre se juega mortal (decisión 1). Aviso al empezar |
| `?dev=1&god=1` explícito | **También se ignora** (decisión 1: "siempre"). Con `?dev=1` el intento es PRUEBA por el propio `dev` (fila siguiente) |
| Cualquier parámetro con `?dev=1` (`cmul`, `hand`, `peligro`, `speed`, `dq`, `today`, `armset`...) | Intento **PRUEBA**: sin récord, sin historial, sin medalla en el medallero y sin gastar el oficial. Sí paga, para poder probar el flujo: con `?dev=1` ya existe `?give=`, así que proteger el premio no tiene sentido. `?armset=` y el resto de anulaciones de equipo no se aplican sobre el kit, salvo `?kit=<id>` (1.10.8) |
| `?seed=` en la URL (abierto, `src/dev.js:4`) | No afecta: el reto usa su semilla y al terminar `G.rngSeed` vuelve al valor anterior (`src/main.js:159-165`) |
| Práctica, cacería, Asalto | No son el reto; no tocan `daily` |

El modo PRUEBA se marca con `dev: 1` en el resultado; el chip del HUD dice "RETO (PRUEBA)".

### 1.9 Efectos del reto sobre la campaña (ninguno salvo el premio)

Nueva función `L.endDaily(won)`, hermana de `L.endPractice` (`src/loot.js:264`), elegida en `G.finish` (`src/main.js:425`). Durante el reto y al terminar:
- No se sueltan partes, Esencias, trofeos ni insignias: `L.onKill` solo cuenta la baja y avisa a los objetivos (hoy suelta botín y da PF de élite, `src/loot.js:181-206`).
- No cambian `runs`, `wins`, `bossKills`, `pelWins`, `peligro`, `pity`, `lossStreak`, `shop`, `quest`, `pf`, ni los `flags` de logros (los pone `L.endRun`, `src/loot.js:232-252`). No se llama a `Armor.onRunEnd` ni a `Q.onRunEnd`.
- Al no subir `runs`, el Tablón no rota (`src/quests.js:157`) ni cambia la luz de la aldea (`src/aldea.js:67`).
- Sí avanzan los objetivos diarios y semanales (no tocan la simulación) y el día cuenta para la racha.
- El kit no escribe nada en el equipo real (1.10.8): armadura, nodos, rangos, anclas, plato y compras quedan igual.

### 1.10 Kits semanales (decisión 4)

#### 1.10.1 Idea

Cada semana (lunes 00:00 UTC, la misma semana que los objetivos, 2.4) el Portal presta a todos el mismo **kit**: 2 etiquetas, un ancla, 4 piezas de armadura, una lista de nodos del árbol, un plato y nada más. El progreso de la cuenta no da ninguna ventaja en el reto. Lo que cambia de un jugador a otro es la habilidad y conocer el kit. Cada kit tiene una identidad clara (su fusión firma y su bono de set) y rota para dar variedad. Fantasía: "el Portal te presta el equipo de un viajero de otro tiempo".

#### 1.10.2 Qué fija el kit y qué queda neutralizado

| Elemento | En el reto | Cómo (sin escribir en el guardado) |
|---|---|---|
| **Armadura** (4 piezas, refuerzos, equipo de prueba, `?armset`) | Las 4 piezas del kit, **niveladas al bioma** (1.10.3); los bonos de set de 2 y 4 piezas son los del set de cada pieza | Nueva capa `kitOvr` en `armor.js`, por encima de `ovr` y `trial` (`src/armor.js:19-43`). `A.eq()` y `A.ref()` la leen con `G.daily`; `A.calc` (`:49-73`) recibe el tier y el refuerzo nivelados |
| **Árbol de forja** (nodos, elecciones A/B, maestrías, Segunda ancla, Ruta) | Solo los nodos del kit que quepan en el **presupuesto de PF del bioma** (1.10.3), más la provisión de bioma (1.10.5) | `T.fx` se sustituye en memoria por el conjunto del kit al empezar (`src/tree.js:214`, `:374-387`) y se recalcula con `T.sync()` al terminar. **No se llama a `T.sync()` durante el reto**, porque recorta `S.anchors` (`:386`) |
| **Rangos de forja** de las cartas | Todas las cartas de la baraja a Rango I. Pasan a Rango II las que el kit sube con un nodo de mejora dentro del presupuesto (como en el árbol: "Chispa II") | `L.rm(id)` (`src/loot.js:159`) devuelve el rango del kit con `G.daily`. `Save.data.cards` no se toca |
| **Cartas disponibles** | Las de la baraja del día (1.1 paso 4), aunque la cuenta no las tenga | `pool()` (`src/cards.js:116`) y `F.unlockedCard` (`src/fusion.js:25`) responden con la baraja del día |
| **Anclas** | 1 ancla, la del kit | `Cards.reset` (`src/cards.js:69`) lee las anclas del kit; `G.B.anchorSlots = 1` mientras dura el reto |
| **Plato de Castaña** | El plato del kit, sin gastar el pendiente de la cuenta. En Tundra y Panal lo sustituye la provisión si hace falta (1.10.5) | `G.runBuff.fx = plato.fx` directo; no se llama a `G.Cook.begin()` (`src/main.js:356`), que gasta `pending.dish` |
| **Compras de Rufo** (Tónico, Imán) | Ninguna; no se gastan | Ruta de la práctica (`src/main.js:353-355`) |
| **Ceniza viva** (`ASH`, +20 de Ceniza al empezar) | Solo si el kit la incluye (todos los kits la tienen en el segundo tramo) | Va dentro de `T.fx` (`T.startAsh`, `src/tree.js:388`) |
| **HP base, velocidad, básico** | Los de siempre (`G.B.player`, `src/main.js:31`) | Sin cambios |
| **Perfil de calidad `G.D`** | El del dispositivo | Sin cambios (`src/main.js:343-348`) |

#### 1.10.3 Potencia por bioma (lo que hace que un mismo kit valga en todos)

El kit fija la **forma** (qué piezas, qué nodos, qué etiquetas). El **bioma** fija la **potencia**, con los valores que el juego ya da por buenos para ese bioma:

| Bioma | Tier y refuerzo de la armadura nivelada | DEF resultante (4 piezas de set) | DEF recomendada del juego (`REC_DEF`, `src/armor_data.js:89`) | Presupuesto de PF del árbol |
|---|---|---|---|---|
| Bosque | T1 +0 | 12,0 | 10 | 6 |
| Cripta | T2 +1 | 20,7 | 21 | 9 |
| Asfódelo | T3 +1 | 27,6 | 28 | 12 |
| Tundra | T4 +1 | 34,5 | 36 | 15 |
| Panal | T5 +1 | 41,4 | 43 | 18 |

- **DEF** = DEFbase[tier] x peso del hueco x (1 + 0,15 x refuerzo) (`src/armor_data.js:7-15`, `README.md:65`). Las otras estadísticas de cada hueco (HP del yelmo, resistencia del peto, Aplomo de las grebas, Afinidad del talismán) también usan el tier nivelado. Los talismanes de minijefe valen DEF x0,4 y su utilidad escala con el refuerzo, como siempre (`src/armor.js:55`, `:59`).
- **Presupuesto de PF:** estimación de lo que tiene una cuenta media al llegar a ese bioma (1 PF de regalo, 2-3 PF por jefe la primera vez, +1 por primer élite de cada hueco, fragmentos de minijefe y encargos; `src/loot.js:134`, `src/boss.js:54`). El kit toma, en orden, sus nodos hasta que el siguiente ya no cabe. Las cartas de la baraja se dan aparte, así que los nodos de carta (`C`) no entran en el kit ni cuestan presupuesto. Los rangos de forja R2/R3 (0 PF) no hacen falta: en el kit no hay requisitos de rango.
- Así, el mismo kit en el Bosque es un equipo de principiante y en el Panal uno de veterano, y cada bioma se juega con la potencia para la que se calibró su `zoneDmg` (`src/armor.js:13`).

#### 1.10.4 Catálogo inicial (8 kits)

Costes del árbol: T1 = 1 PF, T2 = 2, T4 = 4 (`L.NODE_TIER`, `src/loot.js:127-128`); `ASH` = 1 (`src/tree.js:174`). La columna "tramos" dice qué nodos entran con cada presupuesto (6 / 9 / 12 / 15 / 18). Las elecciones A/B de los nodos de mejora van entre paréntesis.

**K1 `fragua`: Fragua** (Fuego + Acero, fusión firma **Forja**)
- Fantasía: herrera de Rescoldo; hachas al rojo y escudos que no ceden.
- Ancla: `spark` (Chispa).
- Armadura: Carcelero de Brasa completo (`car_helm`, `car_chest`, `car_greaves`, `car_talis`). 2 piezas: +4 % de Fuego y +8 % de resistencia a explosiones. 4 piezas: Grilletes ardientes.
- Plato: `caldo` (Caldo de placa, -20 % de daño cuerpo a cuerpo).
- Árbol por tramos:
  - 6 PF: `F1`(B Ráfaga) 1, `A1`(A Cinco dagas) 1, `F4` Pulmón de fragua 1, `A4` Temple 1, `F7` Fundición 2.
  - 9 PF: + `ASH` 1, `F3`(A Metralla) 2.
  - 12 PF: + `A7` Bastión 2 (11; el siguiente no cabe).
  - 15 PF: + `A10` Filo eterno 2, `F10` Emblema de Fuego 2.
  - 18 PF: + `A3`(A Cuatro escudos) 2 (17).

**K2 `ventisca`: Ventisca** (Hielo + Rayo, fusión firma **Tormenta de escarcha**)
- Fantasía: pastora del norte que congela y remata con rayos.
- Ancla: `shard` (Esquirla).
- Armadura: Pelaje Glacial completo (`gla_helm`, `gla_chest`, `gla_greaves`, `gla_talis`). 2 piezas: +4 % de Hielo y Frío -15 %. 4 piezas: Corazón de hoguera.
- Plato: `pan` (Pan de pluma, +8 % de velocidad).
- Árbol por tramos:
  - 6 PF: `H1`(B Escarcha densa) 1, `Z2`(A Chispa viva) 1, `H4` Aliento gélido 1, `Z4` Pararrayos 1, `H3`(B Doble pulso) 2.
  - 9 PF: + `ASH` 1, `Z6` Cadena larga 2.
  - 12 PF: + `H6` Permafrost 2 (11).
  - 15 PF: + `H10` Cripta de hielo 2, `Z10` Eco de tormenta 2.
  - 18 PF: + `Z9`(A Dos rayos) 2 (17).

**K3 `pantano`: Pantano** (Veneno + Hielo, fusión firma **Escarcha tóxica**)
- Fantasía: curandera del Asfódelo; frena y envenena.
- Ancla: `dart` (Dardo tóxico).
- Armadura: Escama del Olvido completa (`esc_helm`, `esc_chest`, `esc_greaves`, `esc_talis`). 2 piezas: +4 % de Veneno y +8 % de resistencia a proyectiles. 4 piezas: Piel de pantano.
- Plato: `estofado` (Estofado de púas, -25 % de daño de proyectiles).
- Árbol por tramos:
  - 6 PF: `V1`(A Dosis doble) 1, `H1`(B Escarcha densa) 1, `V4` Savia amarga 1, `H4` Aliento gélido 1, `V3`(A Pantano) 2.
  - 9 PF: + `ASH` 1, `V6` Pandemia 2.
  - 12 PF: + `H7` Quebradizo 2 (11).
  - 15 PF: + `V10` Foco de infección 2, `H3`(B Doble pulso) 2.
  - 18 PF: + `V9`(B Miasma) 2 (17).

**K4 `carmesi`: Carmesí** (Sangre + Rayo, fusión firma **Zancada carmesí**)
- Fantasía: duelista que entra y sale a saltos y se cura cortando.
- Ancla: `fang` (Colmillo).
- Armadura: Jalea Real completa (`jal_helm`, `jal_chest`, `jal_greaves`, `jal_talis`). 2 piezas: +4 % de Sangre y miel -25 %. 4 piezas: Reina de la colmena.
- Plato: `sopa` (Sopa de hebra, +0,25 HP/s).
- Árbol por tramos:
  - 6 PF: `S1`(A Hemorragia) 1, `Z2`(B Sin pérdida) 1, `S4` Ansia 1, `Z4` Pararrayos 1, `S3`(B Sangrado profundo) 2.
  - 9 PF: + `ASH` 1, `S6` Vampiro 2.
  - 12 PF: + `Z7` Un solo rayo 2 (11).
  - 15 PF: + `S10` Pacto de sed 2, `Z10` Eco de tormenta 2.
  - 18 PF: + `Z9`(B Rayo ancho) 2 (17).

**K5 `lana`: Lana y Hierro** (Acero + Sangre, fusión firma **Sed de hierro**)
- Fantasía: guardián del rebaño; aguanta en el sitio y devuelve cada golpe.
- Ancla: `dagger` (Daga).
- Armadura: Esquila de Hierro completa (`esq_helm`, `esq_chest`, `esq_greaves`, `esq_talis`). 2 piezas: +4 % de Acero y +3 % de resistencia cuerpo a cuerpo. 4 piezas: Lana gruesa.
- Plato: `asado` (Asado de colmillo, -15 % de daño de élites y jefes).
- Árbol por tramos:
  - 6 PF: `A1`(B Perforante) 1, `S1`(B Arco amplio) 1, `A4` Temple 1, `S4` Ansia 1, `A3`(A Cuatro escudos) 2.
  - 9 PF: + `ASH` 1, `A6` Filo 2.
  - 12 PF: + `S7` Berserker 2 (11).
  - 15 PF: + `A10` Filo eterno 2, `S3`(A Cuatro marcas) 2.
  - 18 PF: + `A9`(A Hoja ancha) 2 (17).

**K6 `tempestad`: Tempestad** (Rayo + Fuego, fusión firma **Plasma**)
- Fantasía: chispa errante que quema todo lo que su rayo toca.
- Ancla: `zap` (Chispazo).
- Armadura mosaico, sin bono de 4: `bra_helm`, `bra_chest`, `bra_greaves` (Brasa Primera; 2 piezas: +4 % de Rayo y +3 % de resistencia a élites) + `mn_cripta` (Llave maestra, +1 HP por corazón).
- Plato: `te` (Té de brasas, +10 % de XP).
- Árbol por tramos:
  - 6 PF: `Z2`(A Chispa viva) 1, `F1`(A Pavesa) 1, `Z4` Pararrayos 1, `F4` Pulmón de fragua 1, `Z6` Cadena larga 2.
  - 9 PF: + `ASH` 1, `F3`(B Napalm) 2.
  - 12 PF: + `F6` Cenizas ardientes 2 (11).
  - 15 PF: + `Z10` Eco de tormenta 2, `F10` Emblema de Fuego 2.
  - 18 PF: + `Z9`(A Dos rayos) 2 (17).
- Sin la 4.ª pieza de Brasa a propósito: Última brasa (revivir, `src/armor.js:93`) es demasiado fuerte para un kit de rotación.

**K7 `alquimia`: Alquimia** (Veneno + Sangre, fusión firma **Hemotoxina**)
- Fantasía: boticaria que marca a la manada y la deja caer sola.
- Ancla: `bleed` (Sangría).
- Armadura mosaico: `esc_helm`, `esc_greaves` (Escama: bono de 2) + `jal_chest` (Jalea, sin bono) + `mn_asfodelo` (Perla del río, +10 % de XP en el Asfódelo).
- Plato: `estofado` (Estofado de púas).
- Árbol por tramos:
  - 6 PF: `V1`(B Punta afilada) 1, `S1`(A Hemorragia) 1, `V4` Savia amarga 1, `S4` Ansia 1, `V3`(B Charco amplio) 2.
  - 9 PF: + `ASH` 1, `S6` Vampiro 2.
  - 12 PF: + `V7` Neurotoxina 2 (11).
  - 15 PF: + `V10` Foco de infección 2, `S3`(A Cuatro marcas) 2.
  - 18 PF: + `V9`(A Nube densa) 2 (17).

**K8 `hogar`: Hogar** (Fuego + Hielo, fusión firma **Vapor**)
- Fantasía: Marlo con lo puesto. Ropa de aldea, chispa y escarcha.
- Ancla: `ember` (Bola de brasa).
- Armadura: Aldeano completo (`ald_helm`, `ald_chest`, `ald_boots`, `ald_amulet`), nivelado como los demás. 2 piezas: +4 HP. Sin bono de 4.
- Plato: `sopa` (Sopa de hebra).
- Árbol por tramos:
  - 6 PF: `F1`(A Pavesa) 1, `H1`(A Perforante) 1, `F4` Pulmón de fragua 1, `H4` Aliento gélido 1, `H3`(A Onda ancha) 2.
  - 9 PF: + `ASH` 1, `F7` Fundición 2.
  - 12 PF: + `H7` Quebradizo 2 (11).
  - 15 PF: + `F10` Emblema de Fuego 2, `F3`(A Metralla) 2.
  - 18 PF: + `H10` Cripta de hielo 2 (17).
- Compensa su set más pobre con el árbol más ofensivo. Si en la calibración queda corto, la palanca es darle `F11` Corazón de brasa (4 PF) en lugar de los dos últimos nodos del tramo de 15.

**Cobertura del catálogo:**
- Etiquetas: Fuego 3 kits, Hielo 3, Rayo 3, Sangre 3, Veneno 2, Acero 2.
- 8 fusiones firma distintas de las 15 (Forja, Tormenta de escarcha, Escarcha tóxica, Zancada carmesí, Sed de hierro, Plasma, Hemotoxina, Vapor). Las otras 7 siguen saliendo con las etiquetas de acompañamiento.
- Los sets de armadura usados son todos menos Brasa Primera completa. Las maestrías T4 se quedan fuera de todos los kits (presupuesto y potencia).

#### 1.10.5 Cómo se elige el kit y cómo se combina con el día

**Kit de la semana:**
- Bolsa de 8: `ciclo = floor(semana / 8)`. El orden de los 8 kits en ese ciclo es una permutación de `hash('SH-kit|' + ciclo + '|k1')`, y el kit de la semana es `orden[semana mod 8]`.
- Cada kit sale una vez cada 8 semanas. Si el primero de un ciclo coincide con el último del anterior, se intercambia con el segundo. Así nunca se repite el kit de dos semanas seguidas y no hace falta recursión.
- `k1` es la versión del catálogo: si se retocan kits, se sube a `k2` y el historial anota `kv`.

**Reglas al combinar el kit con el día** (se aplican en este orden y sin tiradas nuevas, salvo donde se dice):

| # | Problema que evita | Regla |
|---|---|---|
| R1 | Kit sin respuesta al Frío en la Tundra | **Provisión de Tundra:** `RT1` Crampones siempre. Si el kit no lleva respuesta al Frío (2 piezas de Pelaje Glacial o `mn_tundra`), su plato pasa a ser `caldobrasa` (Caldo de brasa, -35 % de Frío) |
| R2 | Kit sin respuesta a la miel en el Panal | **Provisión de Panal:** `RT4` Ahumador siempre. Si el kit no lleva respuesta a la miel (2 piezas de Jalea Real o `mn_panal`), su plato pasa a ser `tostada` (Tostada de miel) |
| R3 | Frío o miel triviales si se suman todas las ayudas | Las provisiones solo se añaden si faltan; nunca se apilan plato de bioma + set + talismán |
| R4 | Tundra o Panal sin Fuego (los dos lo piden, `src/panels.js:330-331`) | Si el kit no trae Fuego, Fuego es una de las 2 etiquetas de acompañamiento (sustituye a la segunda) |
| R5 | "Dos etiquetas" deja al kit sin Fuego en Tundra o Panal | El mutador `dos` se descarta en la elección de mutadores si el bioma es Tundra o Panal y el kit no trae Fuego |
| R6 | Las 2 etiquetas del kit resistidas por el jefe (p. ej. Pantano, Veneno + Hielo, contra Yarlak, que resiste las dos, `src/boss_yarlak.js:38`) | Al menos una etiqueta de acompañamiento tiene que ser debilidad del jefe (`weak` de `G.Boss.DEFS`). Si no lo es, se cambia la primera por la primera debilidad del jefe en el orden de la tirada |
| R7 | Talismán de bioma ajeno sin efecto (Perla del río fuera del Asfódelo) | Se acepta: es parte de la identidad del kit y la calibración lo mide |
| R8 | Peligro IV con kit en su tramo más bajo (Bosque) y 2 mutadores | El presupuesto de mutadores ya baja a <= 1 en Peligro IV (1.1 paso 3); sin regla extra |

Las reglas R1-R6 son deterministas y dependen solo de (semana, día, bioma). Con el mismo bioma, dos cuentas reciben exactamente lo mismo.

#### 1.10.6 Calibración: a qué potencia y cómo se mide

**Objetivo de potencia:**
- Un jugador competente con el kit, en el bioma del día y sin mutadores, gana con los objetivos del dueño de su Peligro **+5 puntos** (II 45 %, III 35 %, IV 25 %).
- Con los mutadores del día, gana dentro del objetivo **+-7 puntos** (II 40 %, III 30 %, IV 20 %; `PLAN-MAESTRO.md:823`).
- **Entre kits, en la misma celda, no más de 10 puntos de diferencia de victorias.** Ningún kit debe ser "el de la semana fácil".

**Plan de calibración para `balance-designer`** (banco de T-F2-01; bot "competente" = bot hábil del banco; semillas fijas `SEED=n`; `speed=4`; `PAR=4`; no lanzar dos lotes a la vez, `README.md:159`):

| Fase | Celdas | n por celda | Partidas | Para qué |
|---|---|---|---|---|
| A. Kits contra biomas | 8 kits x 5 biomas, Peligro III, sin mutadores | 48 | 1.920 | Potencia base y diferencia entre kits; error típico ~6,6 puntos con p = 0,35 |
| B. Peligros | 8 kits x {Bosque, Panal} x {II, IV}, sin mutadores | 24 | 768 | Que la escala de Peligro se mantiene en los extremos |
| C. Mutadores | 9 mutadores MVP x 2 kits de referencia (`fragua`, `pantano`) x Asfódelo, Peligro III | 48 | 864 | Que cada mutador quita victorias (ninguno facilita, T-F4-01) y cuánto, para ajustar los pesos |
| D. Combinaciones límite | Las de R1-R6 (Pantano en Tundra, Carmesí en Panal, Tempestad en Cripta contra Karceron, que resiste Fuego) | 48 | ~300 | Que las reglas evitan los casos imposibles o triviales |
| E. Humano | 3-5 retos reales del dueño en móvil por fase (T-F2-06) | - | - | Contraste: el bot ordena, no fija el valor absoluto |

- **Métricas por celda:** % de victorias (Oro); % que llega al jefe (Bronce); % que rompe parte o quita el 50 % (Plata); tiempo de muerte (mediana y p25); vida mínima; daño evitado por armadura (%); puntuación media y su dispersión; Frío pico (Tundra) y segundos en miel (Panal); usos de la fusión firma.
- **Coste estimado:** A + B + C + D ~ 3.850 partidas de 9 min a `speed=4` con 4 en paralelo ~ 36 h de máquina. La fase A sola (~18 h) basta para el primer corte.
- **Palancas, en este orden:** (1) tramo de PF por bioma (la tabla de 1.10.3); (2) nodos del último tramo de cada kit; (3) refuerzo de la armadura nivelada (+0/+1/+2); (4) pesos de los mutadores. Nunca se tocan los números de combate del juego para cuadrar un kit.
- **Criterio de salida:** fase A dentro del objetivo y de la diferencia máxima entre kits; ningún mutador facilita en la fase C; ninguna celda de la fase D por debajo del 10 % ni por encima del 60 % en Peligro III.

#### 1.10.7 Cómo se presenta al jugador

**Bloque KIT DE LA SEMANA** en la pestaña RETO (columna derecha, arriba):
- Emblema del kit (32 px), nombre y lema de una línea.
- 4 iconos de pieza con su nombre corto debajo.
- Ancla (mini carta) y las 2 etiquetas del kit.
- Línea "Cambia el lunes" con la cuenta atrás.

**Botón VER KIT:** abre una ficha a pantalla completa con 3 pestañas.
- **ARMADURA:** cada pieza con su icono de `Assets` (el del taller), DEF/HP/Aplomo ya nivelados al bioma de hoy, y los bonos de set de 2 y 4 piezas.
- **FORJA:** los nodos activos hoy, con su nombre y descripción del árbol (`desc` y `ch` de `src/tree.js`), y los que entrarían con más presupuesto en gris ("en biomas más duros").
- **MANO:** ancla, etiquetas, plato y fusión firma con su efecto (texto de `src/fusion.js`).

Todo es de solo lectura y se cierra con VOLVER.

**Lo que aún no has descubierto:**
- **Piezas de armadura, nodos y cartas del kit** se muestran completos en la ficha del kit con la etiqueta "PRESTADO". **No cuentan como descubiertos**: no se marcan en el taller de Carapa (`armor.seen`), ni en el Manual (`manualSeen`, `src/manual.js:84-98`), ni en el árbol de Grum. El Manual no abre su entrada; en su lugar dice "Lo viste prestado en el reto". La ficha del kit ya es la explicación. Así no hay progreso falso: no se puede fabricar ni equipar nada que no se haya ganado.
- **Fusiones creadas en el reto sí cuentan** en `combosSeen` (`src/fusion.js:168`), como ya pasa hoy en cualquier salida. Es conocimiento, no poder: abre su entrada del Manual y cuenta para los logros Alquimista, Maestro de mezclas y Alquimista completo (`src/quests.js:359-364`), que no dan material.
- **Spoiler:** un jugador que solo ha visto el Bosque puede ver una pieza de Melaria o Cenizar en el kit. Se acepta como aliciente ("esto existe más adelante"). Pregunta 6 al dueño.

**Primera vez que ve un kit nuevo en la semana:** aviso de una línea al abrir la pestaña RETO: "Kit de la semana: Fragua". Marca `daily.kit.seenWeek`.

#### 1.10.8 Guardado y seguridad del equipo real

- **Nada del kit se escribe en el guardado.** El kit vive en `G.Kit` (memoria) y se arma al empezar el reto a partir de (semana, día, bioma). Al terminar o abandonar, `G.Kit.end()`:
  - quita `kitOvr` de la armadura;
  - recalcula `T.fx` con `T.sync()`;
  - restaura `G.B.anchorSlots`, `G.god`, la semilla y `G.runBuff`.
- **Campos nuevos mínimos en `daily`:** `kit: { seenWeek: 0 }` (para el aviso de kit nuevo). El historial anota `kit` y `kv` por entrada. No hace falta más.
- **Lo que no puede cambiar tras un reto** (prueba 20): `armor.owned`, `armor.equipped`, `armor.seen`, `nodes`, `ever`, `cards`, `anchors`, `pending`, `shop`, `pf`, `trophies`, `insignias`, `flags` de equipo y de logros, `manualSeen`. Solo `combosSeen`, `daily`, `stats.dailyRuns`, las Brasas y partes del premio y `stats.playMs` pueden cambiar.
- **Paso de seguridad:** `S.save()` escribe `S.data` entero. Como el kit nunca entra en `S.data`, un guardado a mitad del reto (punto de control de 15 s) no puede filtrarlo. La prueba lo comprueba guardando a mitad de reto y comparando.
- **Para probar:** `?dev=1&kit=<id>` fuerza un kit (parámetro cerrado; el intento es PRUEBA).

#### 1.10.9 Efecto en las recompensas

**El kit no cambia ninguna cifra de 1.6 ni de 2.6.**
- Las medallas dependen de hitos (llegar al jefe, romperle una parte, vencerlo). El kit fija la potencia por bioma y se calibra para que el Oro siga en un 25-35 % de los días, así que la frecuencia de cada medalla y el gasto semanal esperado no cambian.
- Al quitar la ventaja del veterano desaparece el riesgo que había en 5.3 ("reto flojo con equipo de veterano en el Bosque"): nadie saca Oro fácil por tener la cuenta avanzada.
- Si la calibración diera un Oro por encima del 35 %, se ajustan los kits, no la tabla de premios.

#### 1.10.10 Esfuerzo

| Trabajo | Quién | Tamaño |
|---|---|---|
| `src/kits.js` (catálogo, elección semanal, reglas R1-R6, `G.Kit.begin/end`) | programmer | M |
| Capa `kitOvr` en `armor.js` (tier y refuerzo nivelados en `A.calc`) | programmer (revisión Opus: toca daño recibido) | S-M |
| `T.fx` del kit, rangos (`L.rm`), anclas y plato | programmer | S |
| Ficha VER KIT (3 pestañas) y bloque del Portal | programmer + ux-designer | M |
| Emblemas de 8 kits | art-director / asset-scout | S |
| Pruebas `kit` (8 comprobaciones) | programmer / qa-tester | S |
| Calibración (fases A-D, ~36 h de máquina + análisis) | balance-designer | M-L |

T-F1-05 pasa de **L** a **XL**: unos 3-4 días más de programación y la calibración aparte. Recomendación: sacar el MVP con **4 kits** (`fragua`, `ventisca`, `pantano`, `carmesi`) y bolsa de 4 (una rotación al mes). Los otros 4 entran cuando la fase A de esos 4 esté en objetivo. Pregunta 7 al dueño.

---

## 2. Objetivos diarios y semanales con racha amable (T-F1-06)

### 2.1 Cuántos a la vez y cuándo se abren

- **3 diarios** (uno fácil, uno medio, uno difícil) y **2 semanales** (uno normal, uno difícil).
- Se abren al terminar la primera expedición (`runs >= 1`). Es el gancho del día 2, antes incluso que el reto.
- **Avanzan solos** (no hay que aceptarlos) en expedición, cacería, Asalto y reto. En la práctica no avanzan, como los encargos (`src/quests.js:197`).
- **Se cobran solos** en cuanto se cumplen: aviso en partida y línea en la pantalla de fin. Nadie pierde un premio por no pasar por un NPC.
- **1 cambio gratis al día:** sustituye un diario no cumplido por otro de la misma dificultad.

### 2.2 Catálogo inicial de diarios (19)

Premios por dificultad (las cifras se justifican en 2.6):
- **Fácil:** 8 Brasas + 3 Hebra.
- **Medio:** 12 Brasas + 2 Hebra + 2 Pluma.
- **Difícil:** 18 Brasas + 3 Hebra + 3 partes de "la etiqueta del día". La etiqueta va en ciclo fijo por `díaÍndice mod 6`: Mecha, Escarcha, Jirón, Púa, Colmillo, Placa.

"Salida" = expedición, cacería, Asalto o reto (no práctica). "En una salida" = dentro de la misma partida; "en el día" = suma de todas las del día.

| id | Texto | Condición medible | Dificultad | Disponible si |
|---|---|---|---|---|
| `d_kills` | Derrota a 300 enemigos | Suma del día de bajas reales (`L.run.kills`) | Fácil | siempre |
| `d_runs` | Termina 2 salidas | Salidas terminadas en el día | Fácil | siempre |
| `d_level` | Llega a nivel 10 | `G.player.level >= 10` en una salida | Fácil | siempre |
| `d_fuse` | Crea una fusión | Fusiones en el día >= 1 | Fácil | siempre |
| `d_parts` | Recoge 25 partes | Suma del día de `L.run.total` | Fácil | siempre |
| `d_reto` | Juega el reto del día | Oficial terminado hoy | Fácil | reto abierto |
| `d_mini` | Derrota a un guardián | Minijefes abatidos en el día >= 1 | Medio | siempre |
| `d_reach` | Llega al jefe | Seguir vivo cuando aparece el jefe en una expedición o reto | Medio | siempre |
| `d_power` | Usa poderes 20 veces | Suma de `a.uses` (`src/base.js:83`) en una salida | Medio | siempre |
| `d_clean30` | Aguanta 30 s sin daño | `L.cleanSecs()` >= 30 en una salida (`src/loot.js:172`) | Medio | siempre |
| `d_fuse2` | Crea 2 fusiones distintas en una salida | Recetas distintas en la misma salida | Medio | siempre |
| `d_hunt` | Derrota a N [enemigo] | Encargo `hunt` del catálogo (`src/quests.js:21-41`) con el 60 % de su meta, solo de los que cumple `Q.feasible` | Medio | hay uno factible |
| `d_part` | Rompe una parte de jefe | Partes de jefe rotas en el día >= 1 (aunque pierdas) | Medio | siempre |
| `d_win` | Vence a un jefe | Victoria contra un jefe en salida | Difícil | siempre |
| `d_mini2` | Derrota a los 2 guardianes en una salida | 2 minijefes en la misma expedición o reto | Difícil | siempre |
| `d_clean60` | Aguanta 60 s sin daño | `L.cleanSecs()` >= 60 en una salida | Difícil | siempre |
| `d_wintag` | Gana con 3 cartas de una etiqueta | Victoria con 3 o más cartas de una misma etiqueta en la mano final (como `wintag`, `src/quests.js:239-242`) | Difícil | siempre |
| `d_pel2` | Vence a un jefe en Peligro II o más | Victoria con `peligro >= 2` | Difícil | algún jefe con Peligro II abierto |
| `d_parts3` | Rompe 3 partes de jefe en una salida | Partes de jefe rotas en la misma salida >= 3 | Difícil | siempre |

### 2.3 Catálogo inicial de semanales (9)

Premios: **Normal** 30 Brasas + 6 Hebra + 4 Pluma. **Difícil** 50 Brasas + 9 Hebra + 3 + 3 partes de las dos etiquetas siguientes del ciclo + **1 Esencia**.

| id | Texto | Condición medible | Dificultad | Disponible si |
|---|---|---|---|---|
| `w_days` | Juega 4 días distintos | Días con racha encendida esta semana | Normal | siempre |
| `w_kills` | Derrota a 2.000 enemigos | Suma semanal de bajas | Normal | siempre |
| `w_boss3` | Vence a 3 jefes | Victorias contra jefes en salida | Normal | siempre |
| `w_mini6` | Derrota a 6 guardianes | Suma semanal de minijefes | Normal | siempre |
| `w_medal3` | Saca 3 Bronces o mejor en el reto | Oficiales con medalla >= Bronce | Normal | reto abierto |
| `w_fuse8` | Crea 8 fusiones distintas | Recetas distintas en la semana | Normal | siempre |
| `w_oro` | Saca un Oro en el reto | Oficial con Oro | Difícil | reto abierto |
| `w_pelup` | Sube un Peligro | Ganar a un jefe en un Peligro que nunca habías ganado (`firstP`, `src/loot.js:234`) | Difícil | queda algún Peligro por subir |
| `w_parts8` | Rompe 8 partes de jefe | Suma semanal | Difícil | siempre |

### 2.4 Rotación por semilla

- **Día:** índice UTC (`src/quests.js:156`). **Semana:** empieza el lunes a las 00:00 UTC: `semana = floor((díaÍndice + 3) / 7)` (el día 0 de la época Unix fue jueves).
- **Diarios:** `r = rng(hash('SH-obj|' + fecha))`. De cada dificultad se filtran los objetivos disponibles para la cuenta, se quita el que salió ayer en esa misma dificultad y se elige uno con `r`.
- **Semanales:** igual con `hash('SH-obj-sem|' + semana)`, sin repetir los de la semana anterior.
- **Se fijan en el guardado al generarse** (`obj.day`, `obj.list`). Vencer al Pastor a media tarde no cambia la lista del día.
- **Cuándo rotan:** solo en la aldea o el título, nunca en partida. Una salida que cruza la medianoche cuenta para el día en que empezó; al volver a la aldea aparece el día nuevo.
- **Cambio gratis:** coge el siguiente candidato de la misma tirada (determinista) que no esté ya en la lista.
- Son locales: dos jugadores ven objetivos distintos si su progreso es distinto, y no pasa nada.

### 2.5 Racha amable ("la Hoguera de Rescoldo")

**Qué es un día jugado:** terminar al menos una salida de 60 s o más (también práctica) o el reto. Se mide con el reloj de la salida, no con el de pared.

**Cómo crece:** +1 por cada día jugado. Jugar varias veces el mismo día no suma más.

**Qué pasa al fallar días (se evalúa al jugar, no en segundo plano):**
- Sean `hueco` los días sin jugar entre el último día jugado y hoy.
- **El primer día perdido de un hueco es siempre gratis** (día de gracia).
- Cada día perdido más gasta 1 **Leña**. Tienes como mucho 2, empiezas con 2 y recuperas 1 por cada 5 días jugados.
- Si no hay Leña para cubrir el hueco, la racha **no vuelve a cero: baja a la mitad** (redondeo hacia abajo) y sigue con el día de hoy. La Leña se queda en 0 y se recupera jugando.
- Ausencia de 15 días o más: racha a la mitad y mensaje de bienvenida, sin hablar de pérdida.
- La mejor racha de siempre se guarda y nunca baja.

**Comprobación de la aceptación** (`PLAN-MAESTRO.md:448`: "5 de 7 días conserva la racha"). El peor patrón son 2 días seguidos sin jugar: el primero es gracia y el segundo gasta 1 de las 2 Leñas. Con 3 días seguidos sin jugar, gracia + 2 Leñas: también se conserva. La prueba recorre los 21 patrones de 5 de 7 (sección 5).

**Tope y recompensas:** solo cosméticas, para que la racha no mueva la economía ni presione:

| Racha | Recompensa (cosmética, en la aldea) |
|---|---|
| 3 | Primer farolillo encendido junto a la hoguera |
| 7 | Segundo farolillo y título "Vecino de Rescoldo" en el Archivo |
| 14 | Guirnalda de farolillos entre las casas |
| 21 | Chispas doradas en la hoguera |
| 28 | Hoguera mayor (llama más alta y cálida). **Tope:** a partir de aquí no hay más hitos; la cifra sigue contando hasta 99 |

Los cosméticos no se pierden si la racha baja. Sin notificaciones push ni "vas a perder tu racha".

### 2.6 Relación con el Tablón de Vesper: panel DIARIO propio, alojado por Vesper

**Decisión:** los objetivos **no** se mezclan con los encargos del Tablón. Van en un **panel nuevo, DIARIO**, al que se llega por dos caminos:
1. Una **tercera pestaña DIARIO** en el panel de Vesper (TABLÓN / CACERÍA / DIARIO; `tabRect(2)` cabe antes de la cabecera, `src/panels.js:112`, `:187`).
2. **Tocando el chip de la hoguera** en la aldea (arriba a la izquierda), aunque Vesper aún no se haya presentado (T-F1-02 presenta los NPC por pasos).

**Por qué no dentro del Tablón:**
- El Tablón funciona con un solo encargo activo que se acepta y se abandona (`src/quests.js:143-150`) y rota con cada expedición (`src/quests.js:157`). Los objetivos son varios a la vez, no se aceptan y rotan con el calendario. Mezclar las dos reglas en una lista confunde.
- El encargo activo cambia el director: su enemigo pesa x2,5 y entra antes (`src/waves.js:99-100`, `:175`). Los objetivos **no deben tocar la simulación** (determinismo del reto), así que tienen que ser otra cosa.
- Vesper es la de los encargos en la historia: alojarlos en su panel reutiliza su marca "!", su arte y su voz sin un NPC nuevo.

**Marcas:** Vesper lleva marca dorada si hay objetivos del día sin ver (`flags.dseen != hoy`), combinada con `Q.mark()` (`src/quests.js:287-291`): el verde de "encargo listo" manda sobre el dorado.

**Topes semanales de recompensa** (aceptación de T-F1-06: la suma semanal no supera el botín de 2 expediciones normales, `PLAN-MAESTRO.md:448`):

| | Brasas | Partes | Esencia | PF |
|---|---|---|---|---|
| 7 días x (8 + 12 + 18) | 266 | 7 x 13 = 91 | 0 | 0 |
| Semanal normal + difícil | 30 + 50 = 80 | 10 + 15 = 25 | 1 | 0 |
| Racha | 0 | 0 | 0 | 0 |
| **Máximo semanal posible** | **346** | **116** | **1** | **0** |
| 2 EN (referencia, 1.6) | ~400 | ~170 | ~2 si vence | 4-6 |
| **Tope duro en código** (`OBJ_WEEK_CAP`) | 360 | 130 | 1 | 0 |

El tope duro es una red de seguridad (errores, relojes raros). Si un pago lo superase, se recorta y se anota en `obj.week.trim`. Con el catálogo de arriba no se alcanza nunca.

Por qué no rompe la economía:
- Quien juega a diario cobra unas 38 Brasas al día en objetivos, un 15-20 % de lo que da una expedición: acelera algo, no salta etapas.
- Las partes escasas entran con cuentagotas: 3 al día de un tipo distinto cada día. Ningún tipo pasa de 6 por semana, menos de lo que dan 2 expediciones de Escarcha o Placa (`L.EXPECT`, `src/loot.js:92`, x `DROP_MUL` 0,7, `src/loot.js:49`).
- Los objetivos no dan PF, trofeos ni insignias. Esencia, solo 1 a la semana.

Total junto con el reto: el reto se juega en lugar de una expedición y paga menos por minuto (1.6), así que no se suma a este tope. Lo que se regala "por volver" es solo lo de esta tabla.

---

## 3. Datos de guardado nuevos y migración v12 -> v13

### 3.1 Campo nuevo `daily` (todo en `swarmhand.fusion.save`)

```
daily: {
  maxDay: 0,              // mayor día UTC visto (defensa ante reloj hacia atrás)
  claims: {},             // díaÍndice -> 1: días con oficial gastado (máx. 60 claves; se podan las más antiguas)
  reto: {
    seenDay: 0,           // último día en que se vio la pestaña RETO (chip NUEVO)
    official: null,       // resultado oficial de hoy (formato de 1.4) o null
    live: null,           // punto de control del intento en curso { day, base, hitos, t, rv } o null
    retry: { day: 0, best: 0, medal: 0 },
    extraDay: 0,          // previsto para el 2.º intento por anuncio (sin uso hasta T-F3-03)
    hist: [],             // últimos 30 resultados oficiales (formato de 1.4)
    best: null,           // { score, day, medal }
    medals: { part: 0, bronce: 0, plata: 0, oro: 0 },
    firstSeen: 0,         // 1 cuando ya se mostró "Nuevo en el Portal"
    kit: { seenWeek: 0 }  // última semana en que se avisó del kit (1.10.7). El kit en sí NUNCA se guarda (1.10.8)
  },
  obj: {
    day: 0, list: [],     // [{ id, goal, prog, done, paid }] 3 diarios del día
    rerollDay: 0,         // día en que se usó el cambio gratis
    yday: [],             // ids de ayer (para no repetir)
    week: 0, wlist: [],   // 2 semanales
    wprev: [],            // ids de la semana anterior
    wpaid: { brasas: 0, parts: 0, rare: 0, trim: 0 },   // pagado esta semana (tope duro)
    wdays: {}             // días jugados de esta semana (para w_days)
  },
  streak: { n: 0, best: 0, last: 0, wood: 2, woodAcc: 0, miles: {} }   // miles: { 3: 1, 7: 1, ... } cosméticos ganados
}
```

Más `stats.dailyRuns` (número de retos jugados, oficiales + reintentos) y `flags.dseen` (último día de objetivos vistos).

### 3.2 Migración v12 -> v13 (sobre el guardado seguro de T-F1-11)

T-F1-11 (otro agente, `src/save.js`) ya pone la escritura segura, las copias y la recuperación, y no sube la versión (sigue en v12, `src/save.js:2`, `:29`). Esta migración **no duplica nada de eso**: añade el paso v12 -> v13 y declara el campo nuevo en su validador. Lo que se reutiliza tal cual:
- **Copia antes de migrar:** `S.load` escribe `swarmhand.fusion.save.v12` antes de llamar a `migrate` (`src/save.js:378`). No hay que añadir ninguna copia.
- **Escritura segura, copias rotativas (`.reciente`, `.dia`, `.semana`) e IndexedDB:** `S.save` (`src/save.js:194-200`). El campo `daily` viaja dentro del guardado sellado con `_sum` (`:85-94`) sin hacer nada más.
- **Recuperación:** `fromBackups` (`src/save.js:361-369`) migra cualquier copia con `migrate()`. Al subir a `VERSION = 13`, `candidates()` ya incluye `.v12` (`:358`), y `S.backups()` la enseña en Ajustes (`:473`).
- **Exportar e importar:** `exportText` e `importText` (`src/save.js:433-468`) pasan por `readRaw(json, true)` + `migrate`. Un texto v12 exportado antes se importa y migra; uno v13 entra tal cual.

Cambios propios de v13 (todos en `src/save.js`):
1. `VERSION = 13` (`:29`) y una línea v13 en la cabecera de historial (`:9`).
2. `function freshDaily()` con la estructura de 3.1, junto a `freshCine` / `freshArmor` (`:54-55`), y `daily: freshDaily()` en `fresh()` (`:35-52`).
3. En `migrate`, tras el paso v11 -> v12 (`:343-349`): `if (d.v === 12) { d.v = 13; d.flags = isObj(d.flags) ? d.flags : {}; d.flags.migrated13 = 1; if (!isObj(d.daily)) d.daily = freshDaily(); }`. Solo añade; no toca nada de lo existente.
4. **Validador** (`rules`, `:120-151`): `'daily'` entra en la lista de `obj(d, k)` (`:138`) y lleva un bloque propio de rangos. Con él, al cargar se corrige y al importar se rechaza, igual que el resto:
   - Días (`maxDay`, `obj.day`, `obj.rerollDay`, `streak.last`, `reto.seenDay`, `reto.extraDay`): 0 a 1e6. Semana (`obj.week`): 0 a 2e5.
   - `streak.n` y `streak.best`: 0 a 1e5. `streak.wood`: 0 a 2. `streak.woodAcc`: 0 a 5.
   - Puntuaciones (`score`, `base`, `retry.best`, `best.score`): 0 a 1e7. Medalla: 0 a 3. Peligro: 2 a 4.
   - `obj.wpaid.brasas`: 0 a 1e4; `parts`: 0 a 1e4; `rare`: 0 a 10.
   - `claims` con `map(..., 0, 1)`.
5. **Límites de `clean()`** (`:96-118`: listas de 64 como máximo, 1.000 claves, profundidad 8 y textos de 200): el diseño cabe con margen. `hist` llega a 30 entradas, `claims` a 60 claves, `list` a 3, `wlist` a 2 y la entrada más honda está a profundidad 5 (`daily.reto.hist[i].meta.pfSpent`). Así que **el recorte de `hist` a 30 y de `claims` a 60 lo hace `G.Daily` al escribir**, no el validador. En los resultados no se guarda ningún texto largo (el texto para compartir se genera al vuelo).
6. **`S.adopt`** (`:400-429`): añadir `'daily'` a la lista de objetos obligatorios (`:404`) y rellenar los subcampos que falten con los de `freshDaily()`, como hace `cine` (`:416-417`). `hist` debe ser lista (si no, `[]`).
7. **Tamaño:** 30 entradas de ~300 bytes = ~9 KB, muy lejos de `MAX_RAW` = 512 KB (`:64`).

Cuentas existentes: racha 0 con 2 Leñas. El reto aparece en cuanto se cumple la condición (casi todas las cuentas con progreso ya la cumplen). Los objetivos se generan en la primera visita a la aldea. Cadena v9 -> v13 probada entera.

**Dónde tocamos lo de T-F1-11:**
- Restaurar a mano una copia `.dia` o `.semana`, o importar un texto viejo, devuelve también un `daily` viejo. El oficial de hoy podría volver a jugarse, pero también se pierde lo que se cobró, así que no hay ganancia neta (5.4).
- La recuperación automática de IndexedDB comprueba que no se haya jugado desde el arranque mirando `runs` y `brasas` (`src/save.js:266`). El reto no sube `runs`, pero sí paga Brasas, así que esa guarda sigue funcionando.

**Orden de trabajo:** primero se cierra T-F1-11 (grupo `save2`). Esta migración va en un commit aparte encima, para que la revisión de `qa-tester` sea limpia.

### 3.3 Reloj y zona horaria

- **Zona horaria: UTC para todo** (reto, objetivos, semana y racha). Es lo que ya usa el Tablón, es la única base que sirve para una tabla en línea futura y evita dos medianoches distintas. La pantalla enseña la cuenta atrás en horas y minutos ("Nuevo reto en 5 h 12 min"), así nadie tiene que saber qué es UTC. Decidido por el dueño (decisión 3).
- **Día efectivo** = `max(díaReloj, maxDay)` cuando el reloj va hacia atrás 1 o 2 días: no se repite ningún premio y no pasa nada más.
- **Reloj atrás más de 2 días:** se asume que el reloj anterior estaba mal (por ejemplo, un móvil con el año equivocado). `maxDay` se reajusta al reloj actual y el juego sigue. `claims` impide cobrar dos veces un oficial ya cobrado, y los objetivos ya pagados de un día no se regeneran porque `obj.day` solo avanza.
- **Reloj adelante:** da acceso anticipado al día futuro, pero no duplica nada. Al volver al reloj real, ese día ya figura en `claims`. La racha puede bajar por el hueco que crea el propio salto: se lo hace uno mismo.
- **Racha con el reloj atrás:** si `hoy < streak.last`, se fija `streak.last = hoy` sin sumar ni restar.
- **Sin paranoia:** no se detecta trampa, no hay avisos acusadores, no se bloquea la cuenta. El único texto es el informativo de la sección 4 (E9).
- **Fecha simulada para pruebas:** `?dev=1&today=AAAA-MM-DD` (nuevo parámetro cerrado en `src/dev.js:8`). `G.Daily.now()` es la única fuente de fecha de todo este diseño.

---

## 4. Textos exactos (español; líneas cortas para 844x390)

Mayúsculas en títulos y botones como en el resto del juego. Números con punto de millar ("4.210"). Fechas cortas en español ("14 nov"). Sin emojis (la fuente monoespaciada del lienzo no los tiene).

### A. Pestaña RETO del Portal

| Clave | Texto |
|---|---|
| A1 pestaña | `RETO` |
| A2 título | `RETO DEL DÍA  ·  14 nov` |
| A3 lema | `Igual para todos hoy. Un intento con premio.` |
| A4 cuenta atrás | `Nuevo reto en 5 h 12 min` |
| A5 destino | `TUNDRA  ·  Yarlak  ·  Peligro III` |
| A5b novato | `Reto suave: Peligro II hasta que venzas a este jefe.` |
| A6 cabecera mutadores | `MUTADORES` |
| A7 ejemplo mutador | `Enjambre veloz: enemigos +15 % de velocidad.` |
| A8 baraja | `BARAJA: 16 cartas  ·  Ancla: Chispa` |
| A9 cabecera kit | `KIT DE LA SEMANA  ·  cambia en 3 d 5 h` |
| A10 aviso kit | `Equipo prestado: tu progreso no cuenta aquí.` |
| A10b ejemplo | `FRAGUA  ·  Fuego y Acero  ·  Ancla: Chispa` |
| A10c lema (uno por kit) | Fragua `Hachas al rojo, escudos que no ceden.` · Ventisca `Congela y remata con rayos.` · Pantano `Frena y envenena.` · Carmesí `Entra, corta, cúrate, sal.` · Lana y Hierro `Aguanta y devuelve cada golpe.` · Tempestad `Lo que el rayo toca, arde.` · Alquimia `Marca a la manada y déjala caer.` · Hogar `Con lo puesto: chispa y escarcha.` |
| A10d botón | `VER KIT` |
| A10e ficha, pestañas | `ARMADURA` · `FORJA` · `MANO` · `VOLVER` |
| A10f ficha, armadura | `Nivelada a Tundra: DEF 34` · `2 piezas: +4 % de Hielo y Frío -15 %.` |
| A10g ficha, forja | `Activos hoy (15 PF)` · `En biomas más duros:` |
| A10h ficha, mano | `Fusión firma: Forja (Fuego + Acero)` · `Plato: Caldo de placa` |
| A10i provisión | `Provisión de Tundra: Crampones y Caldo de brasa.` / `Provisión de Panal: Ahumador y Tostada de miel.` |
| A10j etiqueta | `PRESTADO` |
| A10k Manual | `Lo viste prestado en el reto.` |
| A10l kit nuevo | `Kit de la semana: Fragua` |
| A11 cabecera premios | `PREMIO (solo el intento con premio)` |
| A12 premios | `Participar 40  ·  Bronce 90  ·  Plata 130  ·  Oro 180 Brasas` |
| A13 extra oro | `Oro: +1 Esencia. Bronce: llega al jefe. Plata: rómpele una parte.` |
| A14 récord | `Tu mejor marca: 4.210 (Plata, 9 nov)` |
| A14b sin récord | `Aún no tienes marca. Hoy puede ser el día.` |
| A15 botón | `EMPEZAR RETO` / sub: `intento con premio: 1 de 1` |
| A16 botón tras jugar | `REINTENTAR (SIN PREMIO)` / sub: `hoy: Plata, 4.210` |
| A17 cerrado | `El reto del día se abre tras tu 3.ª expedición.` |

### B. Confirmación y avisos al empezar

| Clave | Texto |
|---|---|
| B1 confirmación | `¿Empiezas tu intento con premio?` |
| B2 detalle | `Si sales o cierras el juego, cuenta lo que lleves.` |
| B3 botones | `EMPEZAR` / `AÚN NO` |
| B4 sin inmortalidad | `Reto sin inmortalidad: aquí se juega de verdad.` |
| B5 prueba (`?dev=1`) | `Modo prueba: este reto no guarda marca.` |
| B6 chip del HUD | `RETO  1.230` (en prueba: `RETO (PRUEBA)  1.230`) |
| B7 medalla asegurada (banner) | `¡BRONCE ASEGURADO!` / `¡PLATA ASEGURADA!` |
| B8 pausa, botón | `TERMINAR INTENTO` / sub: `cuenta lo que llevas` |

### C. Resultado

| Clave | Texto |
|---|---|
| C1 título | `RETO SUPERADO` (Oro) / `RETO TERMINADO` |
| C2 subtítulo | `14 nov  ·  Tundra  ·  Peligro III` |
| C3 medalla | `ORO` / `PLATA` / `BRONCE` / `PARTICIPACIÓN` |
| C4 desglose | `Tiempo  900` · `Bajas  812` · `Guardianes  450` · `Jefe  770` · `Victoria  0` |
| C5 multiplicador | `Peligro y mutadores  x1,55` |
| C6 total | `TOTAL  4.511` |
| C7 récord | `¡NUEVO RÉCORD!` / `Tu mejor: 5.020` |
| C8 premio | `Premio: +130 Brasas, +35 partes` (Oro: `+180 Brasas, +45 partes, +1 Esencia`) |
| C8b reintento | `Reintento: sin premio. Habrías sacado Plata.` |
| C9 objetivos | `Objetivos: 2/3 de hoy cumplidos` |
| C10 botones | `REINTENTAR (SIN PREMIO)` / sub `misma semilla` · `IR A LA ALDEA` / sub `objetivos y racha` |
| C11 compartir | `COMPARTIR` · aviso: `Resultado copiado.` |
| C12 cortado | `Tu intento se cortó. Cuenta lo que llevabas: 2.340 (Bronce).` |

**Texto para compartir (exacto, 5 líneas):**
```
Swarm Hand - Reto 2026-11-14
Tundra, Peligro III
Enjambre veloz + Sin corazones
PLATA - 4.511 puntos
Jefe al 38 % - 812 bajas
```
Con victoria, la última línea es `Jefe vencido en 1:42 - 812 bajas`.

### D. Aldea, racha y panel DIARIO

| Clave | Texto |
|---|---|
| D1 chip de la hoguera (encendida) | `Racha 6  ·  hoy encendida` |
| D2 chip (pendiente) | `Racha 6  ·  juega una salida hoy` |
| D3 burbuja del Portal | `Reto del día listo` |
| D4 primera vez | `Nuevo en el Portal: el reto del día.` |
| D5 Lanudo | `Dicen que el Portal guarda un reto distinto cada día. Igual para todos.` |
| D6 Vesper, objetivos nuevos | `Hoy tengo tres recados cortos. Mira la pestaña DIARIO.` |
| D7 pestaña | `DIARIO` |
| D8 cabecera diarios | `HOY  ·  cambian en 5 h 12 min` |
| D9 cabecera semanales | `ESTA SEMANA  ·  cambian el lunes` |
| D10 fila | `Derrota a 300 enemigos   180/300   +8 Brasas, 3 Hebra` |
| D11 fila cumplida | `CUMPLIDO  ·  cobrado` |
| D12 botón cambiar | `CAMBIAR` / sub `1 gratis al día` · usado: `mañana` |
| D13 racha, cabecera | `HOGUERA DE RESCOLDO` |
| D14 racha, estado | `Racha 6 días  ·  mejor 11  ·  Leña 2/2` |
| D15 racha, explicación | `Un día sin jugar no apaga nada. Más días gastan Leña.` |
| D16 próximo hito | `Próximo farolillo: día 7` |
| D17 tope | `Hoguera mayor encendida. La racha sigue contando.` |

### E. Avisos (banner en partida o aviso en la aldea, 2-3 s)

| Clave | Texto |
|---|---|
| E1 objetivo cumplido | `¡OBJETIVO! +12 Brasas` |
| E2 semanal cumplido | `¡OBJETIVO SEMANAL! +50 Brasas, +1 Esencia` |
| E3 racha sube | `Racha: 7 días` |
| E4 hito | `¡Se enciende un farolillo en Rescoldo!` |
| E5 gracia | `Ayer descansaste. Tu racha sigue: 7.` |
| E6 leña | `La Leña mantuvo la hoguera. Te queda 1.` |
| E7 baja a la mitad | `La hoguera se templó: racha 12 -> 6. ¡A por ella!` |
| E8 bienvenida | `¡Has vuelto! La hoguera te guardó la mitad: racha 6.` |
| E9 reloj atrás | `La fecha del dispositivo ha ido hacia atrás. Lo de hoy ya está cobrado.` |
| E10 tope semanal (solo si se recorta) | `Tope semanal de objetivos alcanzado.` |

---

## 5. Lista para el programador, pruebas, riesgos y abuso

### 5.1 Cambios por archivo

| Archivo | Cambio |
|---|---|
| `src/daily.js` (nuevo) | `G.Daily`: `now()` (con `?today=`), `dayIndex()`, `dayKey()`, `effDay()` y reglas del reloj (3.3); `rules(dayKey, save)` puro y determinista (1.1); tabla `MUT` (1.2); `available()`, `canOfficial()`, `start(official)`; `tick()` (puntuación en vivo y punto de control cada 15 s); `score()`, `medal()`; `finish(won)` (pago por medalla, historial, récord, claims); `recoverLive()` al cargar; `shareText()`; `entry()` (formato de 1.4) |
| `src/objectives.js` (nuevo) | `G.Obj`: catálogos (2.2, 2.3), `ensure()` (genera o rota día y semana solo en la aldea o el título), `on(evento, datos)` (kill, fuse, mini, part, runEnd, level, power, daily), `pay()` con `OBJ_WEEK_CAP`, `reroll(i)`, `mark()`; racha: `playedToday(secs)` y algoritmo de 2.5 |
| `src/kits.js` (nuevo) | `G.Kit`: catálogo `KITS` (1.10.4, datos puros con ids reales), `ofWeek(semana)` (bolsa de 8, 1.10.5), `build(kit, bioma, jefe, mutadores)` (tramo de PF, armadura nivelada, provisiones R1-R3, etiquetas R4-R6), `begin(k)` / `end()` (instala y quita las capas en memoria, 1.10.8), `view(k)` (datos de la ficha VER KIT) |
| `src/armor.js` | Capa `kitOvr` por encima de `ovr` / `trial` (`:19-43`): `A.eq()` y `A.ref()` la leen con `G.daily`; `A.calc` (`:49-73`) acepta `tierOf` y refuerzo nivelados. `A.modeSet` (`:104`) quita `trial` en el reto. Nada se escribe en `SV().armor` |
| `src/tree.js` | `T.fx` sustituible en memoria (`:214`) mientras dura el reto; `T.sync()` (`:374-387`) solo al terminar. `T.startAsh` (`:388`) sin cambios |
| `src/manual.js` | Las entradas de cartas, piezas o nodos vistos solo en un kit no se abren; texto A10k. Las fusiones siguen por `combosSeen` (`:84-85`) |
| `src/quests.js` | Mover `hash`/`rng` (`:154-155`) a `G.util` o exportarlos (`Q.hash`, `Q.rng`). `Q.onKill`, `Q.onMiniPart`, `Q.onRunEnd`, `Q.tick` no actúan con `G.daily` (`:196-245`). `Q.target()` devuelve null con `G.daily` (`:141`) |
| `src/main.js` | `G.startGame` (`:349-419`): si `G.launchReq.daily`, poner `G.daily = rules`, `setLen(9)`, bioma, jefe y Peligro del reto, sin compras ni plato de la cuenta (como `prac`, `:353-356`; el plato del kit va directo a `G.runBuff.fx`), `G.Kit.begin(kit)`, `G.god = false` siempre (decisión 1), `G.rngSeed(simSeed)` y guardar la semilla y el `G.god` anteriores. Al resetear, `G.daily = null` si no es un reto. `G.diffProfile` (`:343-347`): aplicar los mutadores de horda sobre `n`, `h`, `s`. Corazones y radio de recogida según mutador. `G.finish` (`:425`): con `G.daily`, `G.Loot.endDaily(won)`; después restaurar la semilla |
| `src/loot.js` | `L.onKill` (`:181`): con `G.daily`, solo `R.kills`, suma de `dRew` y `G.Obj.on('kill')`; sin botín ni `Tree.onElite`. `L.endDaily(won)` nuevo (resumen para la pantalla, sin tocar la campaña; 1.9). `L.endRun`: avisar a `G.Obj` y a la racha (`playedToday`) |
| `src/cards.js` | `pool()` (`:116`): con `G.daily`, solo cartas de la baraja (prestadas). Rangos del kit por `L.rm` (`src/loot.js:159`). Anclas: la del kit en vez de `Save.data.anchors` (`Cards.reset`, `:69`). `C.reroll` (`:238`): bloqueado con `sincambio`. Avisar a `G.Obj` al fusionar |
| `src/waves.js` | Nada, si `Q.target()` ya devuelve null con `G.daily` (`:99-100`). Comprobar que `G.D.n` modificado se lee en `:142` y `:145` |
| `src/boss.js`, `src/minis*.js` | No soltar trofeos ni insignias con `G.daily` (o descartarlos en `L.collect`). `furia` (fase 2) sobre `pel()` (`:77-81`) |
| `src/player.js` | Multiplicador de daño recibido del mutador `cristal`; `pickup` y `heartP` del reto |
| `src/base.js` | Variante de `drawEnd` para el reto (1.5, textos C). `Bs.retry` (`:12`) relanza el reto sin premio con la misma semilla. Línea de objetivos en la pantalla normal (coordinar con T-F1-04) |
| `src/panels.js` | Portal: pestaña RETO (`ptabRect(2)`, `:321`; `updPortal`/`drawPortal`, `:369-498`), mover la pista Tab (`:420`) y confirmación modal. Vesper: pestaña DIARIO (`tabRect(2)`, `:112`, `:178`, `:187`); panel DIARIO también abrible desde la aldea (`P.open('diario')`) |
| `src/aldea.js` | Marca dorada del Portal (`drawMarks`, `:533-543`), marca de objetivos en Vesper, chip de la hoguera (toque = panel DIARIO), burbujas (`:341`) y línea de Lanudo (`:176`). Cosméticos de racha (farolillos, guirnalda, chispas, hoguera mayor) |
| `src/hud.js` | Chip del reto (B6), banners de medalla asegurada (B7) y de objetivos (E1-E2). Botón TERMINAR INTENTO en la pausa |
| `src/save.js` | Solo lo de 3.2, encima de T-F1-11 y en un commit aparte: `VERSION = 13`, `freshDaily()`, paso v12 -> v13 en `migrate`, `daily` en `fresh`, `adopt` y el validador `rules`. Nada de copias ni de escritura: eso ya lo hace T-F1-11 |
| `src/dev.js` | Añadir `'today'` y `'kit'` a `CLOSED` (`:8`) |
| `index.html` | Cargar `kits.js` (después de `armor_data.js`, `tree.js` y `cards.js`), `daily.js` y `objectives.js` (después de `quests.js` y `loot.js`). El precache del service worker sale de `index.html` (`README.md:153`) |
| `src/track.js` (si ya existe T-F1-01) | Eventos `daily_start`, `daily_end` (medalla, puntos, `dq`, `god`), `obj_done`, `streak` |
| `tools/card-swarm-bot/tests.js` | Grupos `daily`, `kit` y `obj` (abajo), incluidos en `all` |
| `tools/card-swarm-bot/` (banco T-F2-01) | Opción `KIT=<id>` y `BIOME=` en el bot de partida para las fases A-D de 1.10.6 |
| `README.md` | Sección "v10 retención" con perillas, pruebas y desvíos |

### 5.2 Pruebas a añadir

**Grupo `daily`** (fecha con `?dev=1&today=`; partidas por pasos con `?speed=0` y `G.step()`):
1. `dayKey` de 2026-11-14T23:59:59Z = `2026-11-14` y de 2026-11-15T00:00:00Z = `2026-11-15`.
2. `rules('2026-11-14', cuentaCompleta)` da el mismo JSON en dos cargas de página y en dos cuentas con todo abierto (instantánea fijada en la prueba).
3. **Determinismo del reto:** misma fecha, mismo kit, mismo bioma y mismas entradas por tick (aunque las cuentas sean distintas) -> mismo hash del estado (vida, bajas, posición, nivel, mano, puntuación) en los ticks 600, 1800 y 3600. Se hace en ALTA y en BAJA (`?dq=`), igual que el grupo `seed` de T-F0-05.
4. Misma fecha con un encargo de caza activo y sin él -> mismo hash (el encargo no toca el director en el reto).
5. Misma fecha con `?seed=99` en la URL -> mismo hash que sin él; después del reto, `G.seed` vuelve a 99.
6. Cuenta con solo el Bosque -> reto en Bosque y Peligro <= II; cuenta completa -> bioma `permutación[0]`. Cuenta con 2 expediciones -> reto cerrado; con 3 -> abierto (decisión 5), haya vencido o no al Pastor.
7. 365 fechas: Fuego en la baraja siempre que `permutación[0]` sea Tundra o Panal; presupuesto de mutadores respetado; familias distintas; Peligro entre II y IV; reparto de Peligro dentro de +-5 puntos de 35/45/20.
8. Un solo cobro: oficial terminado -> paga una vez; reintento -> no paga; recargar -> no paga otra vez.
9. **Cambio de fecha hacia atrás (1 día):** oficial jugado el día D; con el reloj en D-1 no hay oficial ni premio y sale el aviso E9.
10. **Reloj adelante y vuelta:** jugar el oficial en D+3 (paga) y volver a D. El oficial de D se puede jugar si no se había jugado; al llegar de verdad a D+3 no paga otra vez.
11. Reloj atrás más de 2 días: `maxDay` se reajusta y ningún día de `claims` se cobra dos veces.
12. Corte a mitad: con `daily.live` guardado y la página recargada, el intento se cierra con esa puntuación y se paga su medalla una vez (aviso C12).
13. Inmortalidad: con la inmortalidad por defecto **y** con `?dev=1&god=1`, el reto arranca con `G.god === false` y el jugador recibe daño. Al terminar, `G.god` vuelve a su valor. Con `?dev=1` el resultado es `dev: 1`, no entra en `hist` ni en `best` y no gasta el oficial.
14. Sin efecto en la campaña: tras un reto, `runs`, `wins`, `bossKills`, `pelWins`, `peligro`, `trophies`, `insignias`, `pf`, `pity`, `quest` y `shop` quedan iguales (comparación profunda) y el Tablón no rota.
15. Migración v12 -> v13: existe `swarmhand.fusion.save.v12` (la escribe `S.load`); `daily` tiene sus valores por defecto; el resto del guardado es idéntico (comparación profunda sin `v`, `flags.migrated13`, `daily` ni `_sum`). Cadena v9 -> v13.
15b. Con T-F1-11: un v13 con `daily` sobrevive a escribir, sellar, borrar el principal y recuperar desde `.reciente` y desde IndexedDB. Importar un v13 con `streak.wood = 7` o `score = -1` se rechaza (`rango`), y al cargarlo se corrige y queda anotado en `S.repairs`. Restaurar una copia `.v12` la migra a v13. El grupo `save2` sigue pasando entero.
16. Historial: con 31 retos, quedan 30 entradas; el texto para compartir coincide carácter a carácter con 4.C.
17. Mutadores MVP: con cada uno activo, la métrica que cambia lo hace en el sentido esperado (velocidad, número de enemigos, sin corazones, recogida, daño recibido, baraja, reroll bloqueado, vida de los guardianes).

**Grupo `kit`:**
1. **Kit idéntico para dos cuentas distintas la misma semana:** una cuenta nueva con 3 expediciones y otra con todo vencido, armadura T6 +3 y 24 PF. En el mismo bioma (`?dev=1&biome=` en la prueba), `A.get()`, `T.fx`, `L.rm(id)` de cada carta de la baraja, anclas, `G.runBuff.fx` y vida máxima al empezar son idénticos (comparación profunda).
2. **El equipo real no cambia tras el reto:** comparación profunda antes y después de un reto completo, de un abandono y de un cierre a mitad con recuperación del punto de control. Campos: `armor` (entero), `nodes`, `ever`, `cards`, `anchors`, `pending`, `shop`, `pf`, `trophies`, `insignias`, `manualSeen`, `flags` salvo `daily`. Además, tras el reto, `A.get()` y `T.fx` vuelven a ser los de la cuenta.
3. **Guardar a mitad de reto no filtra el kit:** `S.save()` en el tick 1800; el texto guardado no contiene `kitOvr` y su `armor` es el de antes.
4. **Determinismo con kit:** la prueba 3 del grupo `daily`, con las dos cuentas de la prueba 1, da el mismo hash.
5. **Rotación:** en 104 semanas seguidas nunca se repite el kit de la semana anterior y cada kit sale exactamente 13 veces. El lunes 00:00 UTC cambia el kit; el domingo 23:59 no.
6. **Reglas R1-R6:** Pantano en Tundra recibe Crampones + Caldo de brasa + Fuego de acompañamiento; Ventisca en Tundra recibe Crampones sin Caldo; Carmesí en Panal recibe Ahumador sin Tostada; `dos` nunca sale en Tundra o Panal con un kit sin Fuego; contra Yarlak, Pantano tiene una etiqueta de acompañamiento que es debilidad del jefe.
7. **Potencia nivelada:** con 4 piezas de un set, la DEF del kit es 12,0 / 20,7 / 27,6 / 34,5 / 41,4 en Bosque / Cripta / Asfódelo / Tundra / Panal; el PF gastado del kit es 6 / 9 / 11 / 15 / 17.
8. **Descubrimiento:** tras un reto con `fragua` en una cuenta nueva, `combosSeen.forja` puede pasar a 1 si se fusionó, pero `armor.seen`, `manualSeen` de piezas y cartas, y `cards` no cambian; el Manual muestra A10k para Hacha giratoria si estaba en la baraja.

**Grupo `obj`** (fecha simulada):
1. La lista del día es estable al recargar y al vencer a un jefe a mitad del día.
2. Al cambiar el día UTC se genera una lista nueva sin repetir el objetivo de ayer de cada dificultad.
3. Avance de bajas, fusión, tiempo sin daño y guardián; la práctica no hace avanzar nada.
4. Pago automático una sola vez, con el aviso E1.
5. Cambio gratis: 1 al día; el segundo queda bloqueado hasta mañana.
6. La semana empieza el lunes a las 00:00 UTC: un domingo a las 23:59 y un lunes a las 00:00 caen en semanas distintas.
7. Tope duro: forzar pagos por encima de `OBJ_WEEK_CAP` -> se recortan y se anota `trim`.
8. **Racha 5 de 7:** los 21 patrones posibles de 5 días jugados de 7 conservan la racha (n = 5 al final empezando de 0).
9. Sin Leña y 3 días seguidos sin jugar -> racha a la mitad (aviso E7).
10. Reloj hacia atrás: la racha ni sube ni baja.
11. Ausencia de 20 días -> mitad y aviso E8.
12. Los hitos de racha solo dan cosméticos: Brasas, partes, Esencia y PF iguales antes y después.
13. Cuenta nueva (1 expedición): no recibe `d_reto`, `d_pel2`, `w_oro` ni `w_medal3`.

### 5.3 Riesgos

| Riesgo | Mitigación |
|---|---|
| T-F0-05 no está cerrado: la simulación aún no es reproducible (`SPEC-T-F0-05.md:24`) | T-F1-05 depende de T-F0-05 (`PLAN-MAESTRO.md:436`). La prueba 3 es la puerta: sin ella el reto no sale |
| Distinta calidad = distinta horda (`G.D`) entre dispositivos | Asumido por decisión del dueño (menos enemigos y más duros en BAJA). Cada resultado guarda `dq`, las bajas son ponderadas y "mismo reto" significa mismo perfil |
| Cambios futuros del juego rompen la comparación entre días | Versión de reglas `rv` en la semilla y en cada entrada; el récord personal puede filtrar por `rv` |
| Un kit sale mucho más fuerte o débil que los demás ("semana fácil") | Calibración 1.10.6 con diferencia máxima de 10 puntos entre kits; palancas por kit sin tocar el combate; versión `kv` para retocar |
| Las capas del kit en memoria se filtran al equipo real (error de programación) | Pruebas 2-3 del grupo `kit`; `T.sync()` y quitar `kitOvr` en `G.Kit.end()`, también al abandonar y al recuperar un punto de control |
| Spoiler de piezas de sets que el jugador no ha visto | Pregunta 6 al dueño; alternativa: silueta y nombre "???" hasta descubrir el set |
| Coste de la calibración (~36 h de máquina) | MVP con 4 kits (pregunta 7); la fase A sola da el primer corte |
| Inflación de la economía | Tabla 2.6 con tope duro; el reto paga menos por minuto que la campaña (1.6) |
| Rendimiento de `marea` en móviles lentos | Sobre `G.D.n`; `performance-engineer` mide con `perf_bot.js` antes de activarlo |
| Texto que no cabe en 844x390 | Textos de la sección 4 con línea máxima ~60 caracteres; capturas en 844x390 dentro de la prueba de UI |
| Presión o culpa | Sin push, sin cuenta atrás roja, sin "vas a perder"; gracia + Leña + mitad en vez de cero |

### 5.4 Abuso posible (y si merece la pena cerrarlo)

| Abuso | Efecto | Respuesta |
|---|---|---|
| Adelantar el reloj | Juega antes los días futuros; no duplica | Aceptado |
| Exportar el guardado, o restaurar una copia `.dia` / `.semana` de T-F1-11 (`src/save.js:433-490`), jugar el oficial y volver a la copia para repetir hasta sacar Oro | Al volver a la copia también se pierde el premio cobrado, así que solo "mejora" la medalla | Aceptado. Opcional y barato: guardar `claims` también en una clave aparte `swarmhand.fusion.dailyclaims`, fuera de las copias rotativas, y unirla (máximo) al importar o restaurar. Si se hace, se pacta con T-F1-11 para que `freeSpace()` (`:192`) no la borre |
| Aprender el día en otro navegador y luego jugar el oficial | Ventaja de conocer el día | Aceptado (no hay tabla en línea) |
| Cerrar el juego para "repetir" el oficial | No funciona: se gasta al empezar y el punto de control lo cierra | Cerrado |
| Salidas de 60 s para encender la racha | Solo da cosméticos | Aceptado |
| `?dev=1` para inflar | Ya permite `?give=` | Fuera de alcance; el intento queda PRUEBA |

---

## 6. Preguntas para el dueño

Las preguntas 1-5 quedaron respondidas el 2026-11-14 (ver "Decisiones del dueño" al principio). Quedan estas, nuevas por el sistema de kits:

6. **¿Se muestran en el kit piezas de sets que el jugador aún no ha visto?** Por ejemplo, la Jalea Real de Melaria a quien solo conoce el Bosque. Recomiendo **sí, completas y marcadas PRESTADO**: es un aliciente y la ficha explica lo que hacen. No cuentan como descubiertas, así que no se fabrican ni se equipan. Alternativa: silueta con "???" hasta descubrir el set.
7. **¿MVP con 4 kits o con los 8?** Recomiendo **4 kits** (Fragua, Ventisca, Pantano, Carmesí), una rotación al mes. Así la calibración baja a la mitad y el reto sale antes. Los otros 4 entran cuando los primeros estén en objetivo.
8. **¿Kit de la semana o kit del día?** Decidiste semanal y el diseño es semanal. Solo confirmo que te parece bien que, dentro de la semana, la variedad diaria venga del bioma, el Peligro, los mutadores y las 2 etiquetas de acompañamiento. Recomiendo **sí** (aprender un kit durante 7 días también da su gracia).

---

## 7. Recursos para asset-scout, art-director y audio-designer

Todo puede ser procedural en el estilo de `src/assets_*.js` y `src/sfx_*.js`. No hace falta nada externo.

| Recurso | Uso | Tamaño | Notas |
|---|---|---|---|
| 4 iconos de medalla (Participación, Bronce, Plata, Oro) | Portal, resultado, HUD, medallero | 16, 24 y 48 px | Legibles en 844x390; cada medalla con una silueta distinta, no solo con color (daltonismo) |
| 12 iconos de mutador | Portal y resultado | 16 px | Una forma por familia (horda, jugador, mano, jefe) |
| Chip de la hoguera con 3 estados (encendida, pendiente, mayor) | Aldea | ~28 px | Animación de llama de 2-4 fotogramas |
| Farolillos (2), guirnalda, chispas doradas, hoguera mayor | Aldea, hitos de racha | según la escena de `src/assets_village.js` | Medir el coste de dibujo con `perf` |
| Icono "RETO" para la pestaña y la marca del Portal | Portal | 16 px | Puede reutilizar `ui_mark_gold` |
| 8 emblemas de kit (Fragua, Ventisca, Pantano, Carmesí, Lana y Hierro, Tempestad, Alquimia, Hogar) | Pestaña RETO, ficha VER KIT, resultado, historial | 16 y 32 px | Combinan los colores de sus 2 etiquetas (`G.TAGS`) con un símbolo propio |
| Sello "PRESTADO" | Ficha VER KIT, Manual | ~12 px de alto | Texto sobre cinta; reutiliza la fuente del juego |
| Sonido: kit nuevo de la semana | Pestaña RETO | < 0,6 s | Puede derivar de `card_select` |
| Sonido: medalla asegurada en partida | HUD | < 0,6 s | Suave; no debe tapar las telegrafías |
| Sonido: jingle de resultado (3 variantes por medalla) | Resultado | 1-2 s | Puede derivar de `win` / `boss_die` |
| Sonido: objetivo cumplido | Banner | < 0,4 s | Puede reutilizar `card_select` con otro tono |
| Sonido: farolillo encendido | Aldea | < 1 s | Crepitar cálido |

---

## 8. Estado de la implementación (programmer, 2026-11-23)

Implementado en esta tanda (T-F1-05 y T-F1-06, MVP con los 8 kits por decisión del dueño): `src/kits.js`, `src/daily.js`, `src/objectives.js`, `src/reto_ui.js`, guardado v13 (`src/save.js`) y ganchos mínimos en `main.js`, `armor.js`, `cards.js`, `fusion.js`, `loot.js`, `quests.js`, `combat.js`, `player.js`, `enemies.js`, `minis.js`, `smith.js`, `panels.js`, `aldea.js`, `base.js`, `hud.js`, `dev.js` e `index.html`. Pruebas: grupo `daily` de `tools/card-swarm-bot/tests.js` (incluye lo de los grupos `kit` y `obj` de 5.2).

### 8.1 Sin calibrar (pendiente de balance-designer, 1.10.6)

**Actualización (balance-designer, 2026-11-25):** fases A-D medidas; informe en `studio/docs/CALIBRACION-KITS.md`. Aplicado: reglas **r2** (Peligro del día por bioma, `G.Daily.PEL_W`, y `dos` fuera del MVP). Kits (k1), presupuesto y pesos de mutadores, puntuación y premios: medidos y sin cambios. Lo que sigue en esta lista es el estado anterior.
- **Los 8 kits** llevan exactamente los valores de 1.10.3-1.10.4 (tramos de PF 6/9/12/15/18, tier y refuerzo por bioma, piezas, nodos, platos). No se ha corrido ninguna fase A-D. Palancas en `G.Kit.POWER` y `G.Kit.KITS` (`src/kits.js`); si se tocan, subir `G.Kit.KV` a `k2`.
- **Pesos de Peligro** (35/45/20), **presupuesto de mutadores** (2 / 1,5 / 1) y **pesos de cada mutador** (`G.Daily.MUT`): los del diseño. Si cambian, subir `G.Daily.RV` a `r2`.
- **Puntuación y multiplicador** (1.4) y **tabla de premios** (1.6): tal cual el diseño.
- Falta en el banco de T-F2-01 la opción `KIT=<id>` / `BIOME=` para el bot de partida (5.1, última fila de `tools/`): hoy se puede forzar con `?dev=1&kit=<id>` y lanzar el reto con `G.Daily.start(false)`.

### 8.2 Desvíos respecto al diseño
1. **Entrada del reto**: no hay pestaña RETO en el Portal (no cabía una 4.ª pestaña de 154 de ancho con letra 17 junto al cierre). El reto se abre desde el **chip RETO DEL DÍA** de la aldea (junto a PORTAL), desde **MENÚ > RETO Y OBJETIVOS** y, el diario, desde el chip RACHA y la pestaña DIARIO de Vesper. Por eso tampoco hay marca dorada sobre el Portal: el chip lleva el borde dorado y una medalla mientras el intento de hoy está pendiente.
2. **Aviso de kit nuevo** (A10l): etiqueta NUEVO junto al nombre del kit en la pestaña del reto, no un aviso flotante (pisaba la cabecera).
3. **`d_hunt`** (objetivo diario "Derrota a N [enemigo]") no está: dependía de los encargos de caza y de `Q.feasible` por bioma; el catálogo diario queda en 18.
4. **Racha a la mitad**: la cifra que se muestra (E7, E8) es la mitad y el día de hoy no suma encima ("12 -> 6").
5. **Manual "Lo viste prestado en el reto"** (A10k): no implementado. Lo prestado no se marca como visto en ningún sitio (no cuenta como descubierto), pero el Manual tampoco recuerda que lo viste en un kit.
6. **Modo PRUEBA**: con `?dev=1` y cualquier parámetro cerrado de `src/dev.js` (o `today`, `kit`, `god`, `reto`). `?dev=1` a secas juega el intento con premio.
7. **Burbuja "Reto del día listo" del Portal** (D3) y **sonidos nuevos** (sección 7): no hechos; se usan `card_select` y los banners existentes. Emblemas de kit: no hay arte (se usa el color del kit y los iconos de etiqueta).
8. **Tabla en línea**: solo el dato preparado en cada entrada de `daily.reto.hist` (formato de 1.4, con `build` vacío si el service worker no lo expone). El 2.º intento por anuncio solo tiene el campo `extraDay`.
