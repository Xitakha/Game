# Swarm Hand - Diseño v10: retención (reto diario, objetivos y racha amable)

Tareas: **T-F1-05** (reto diario con semilla) y **T-F1-06** (objetivos diarios y semanales con racha amable) de `studio/docs/PLAN-MAESTRO.md` (líneas 431-451). Autor: game-designer. Estado: propuesta para el dueño; no hay código.

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

**Quién puede jugarlo.** Se abre al terminar la 3.ª expedición o al vencer al Pastor (`runs >= 3 || bossKills.pastor > 0`). Antes no aparece: la primera sesión es de T-F1-02.

**Día y semilla.**
- Día del reto = fecha UTC `AAAA-MM-DD` (la misma base que el Tablón, `src/quests.js:156`). Cambia a las 00:00 UTC (01:00 en España en invierno y 02:00 en verano).
- Semilla de reglas: `hash('SH-reto|' + fecha + '|r1')`. Semilla de la simulación: `hash('SH-reto|' + fecha + '|s1')`. Son dos flujos separados: elegir las reglas no consume el RNG de la partida.
- `r1` es la versión de las reglas. Si se cambian las reglas o la tabla de mutadores, se sube a `r2` y el historial guarda la versión de cada entrada.

**Orden fijo de elección.** Todas las tiradas se hacen siempre en el mismo orden y en el mismo número, sea cual sea la cuenta. Los filtros de cada jugador se aplican después. Así dos cuentas con lo mismo desbloqueado reciben exactamente lo mismo.

1. **Bioma.** Permutación de `[bosque, cripta, asfodelo, tundra, panal]` (Fisher-Yates, 4 tiradas). Se juega el primer bioma de la permutación que el jugador tenga abierto (`Q.unlockedBiomes`, `src/quests.js:123-126`). Como los biomas se abren en cadena, quien lo tiene todo juega `permutación[0]` y una cuenta joven cae en un bioma anterior. El jefe es el de ese bioma (`G.Boss.bossFor`, `src/main.js:388`).
2. **Peligro del día.** 1 tirada: II 35 %, III 45 %, IV 20 %. Nunca I (es un reto) ni V (tope de un 10 % de victorias: frustraría a diario). **Excepción de novato:** si nunca has vencido a ese jefe, el reto se juega en Peligro II como máximo y la pantalla lo dice ("Reto suave").
3. **Mutadores.** Se baraja la tabla 1.2 (11 tiradas) y se eligen en ese orden hasta 2 que cumplan tres condiciones: familias distintas, sin incompatibilidades y suma de pesos dentro del presupuesto (Peligro II <= 2; III <= 1,5; IV <= 1). Siempre sale al menos 1. En el MVP solo entran los mutadores marcados "MVP".
4. **Baraja del día.** Se barajan las 6 etiquetas (5 tiradas) y se toman las 4 primeras, o las 2 primeras con el mutador "Dos etiquetas". **Fuego obligatorio:** si `permutación[0]` es Tundra o Panal, Fuego entra en la baraja en lugar de la última etiqueta (los dos biomas piden Fuego, `src/panels.js:327-328`). Con biomas abiertos en cadena, un jugador solo cae en Tundra o Panal cuando uno de los dos es `permutación[0]`, así que la regla cubre a todos.
   - Cartas de ataque: las 3 de cada etiqueta elegida (Fuego: Chispa, Bola de brasa, Anillo; Hielo: Esquirla, Nova, Ventisca; Rayo: Chispazo, Tormenta, Bobina; Veneno: Dardo, Charco, Nube; Sangre: Colmillo, Sangría, Murciélago; Acero: Daga, Hacha, Púas; `src/cards.js:13-42`).
   - Pasivas: la de cada etiqueta elegida que la tenga (Manto, Cristal, Cascabel, Bilis, Afilar) y 3 de las 5 neutrales (Lana, Reloj, Pezuñas, Imán, Alforja; 2 tiradas para elegirlas).
   - Resultado: 14-19 cartas (8-11 con "Dos etiquetas"). Las ofertas solo salen de la baraja (`pool()`, `src/cards.js:116`).
5. **Ancla del día.** 1 tirada entre las cartas de ataque comunes de la baraja (`L.TIER = 'c'`, `src/loot.js:95-101`). Todos salen con 1 ancla, aunque tengan el nodo "Segunda ancla". Se mantiene la regla de la 1.ª fusión ayudada y la 1.ª oferta con receta garantizada (`README.md:40`).

**Qué cuenta de tu progreso y qué no** ("tu equipo, el reto del día"):

| Se aplica | No se aplica |
|---|---|
| Árbol de forja, Rangos de forja de las cartas que tienes, armadura equipada | Plato de Castaña, Tónico e Imán de Rufo: no se gastan ni se aplican (misma ruta que la práctica, `src/main.js:353-356`) |
| Las cartas de la baraja que aún no has desbloqueado entran "prestadas" a Rango I | Encargo de Vesper: ni avanza ni pesa en el director (`qTarget()` devuelve null, `src/waves.js:99-100`) |
| Perfil de dificultad del dispositivo (`G.D`, fijado al empezar) | `?seed=` de la URL: el reto usa su semilla y al terminar se restaura la anterior |

Por qué el equipo propio y no uno igual para todos: es lo barato y lo que el jugador espera (su progreso vale). El precio es que dos jugadores no compiten en igualdad. Para una tabla en línea futura cada resultado guarda la huella de su equipo (1.4), y el "kit igual para todos" queda como pregunta al dueño (sección 6).

**Duración y reloj.** Normal, 9 min, con el jefe a las 7:30 (`G.setLen(9)`, `src/main.js:15`). No depende de `Save.data.len`.

**Inmortalidad.** El reto se juega siempre sin ella, aunque `G.god` esté activo por defecto (`src/main.js:20`). Solo `?dev=1&god=1` explícito la permite, y entonces el intento es PRUEBA (1.8). Pregunta 1 al dueño.

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
| `dos` | Dos etiquetas | La baraja solo trae 2 etiquetas de ataque | mano | 1 | baraja del día (1.1, paso 4) | sí |
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

**Dato preparado para una tabla en línea futura** (T-F1-05 paso 5). Cada entrada guarda `{ rv, day, biome, boss, peligro, mut, deckId, score, base, mul, medal, won, t, kills, bossFrac, parts, dq, meta: { pfSpent, def }, build, god, dev }`. `dq` es el perfil de calidad, `meta` la huella del equipo, `build` el sello del service worker. No se envía nada a ningún sitio.

**Texto para compartir** (T-F1-05 paso 4): botón COMPARTIR. Usa `navigator.share` si existe y, si no, copia al portapapeles. Texto exacto en la sección 4.

### 1.5 Pantallas de entrada y de resultado

**Entrada: pestaña RETO del Portal** (tercera pestaña, junto a SALIDA y CARTAS, `src/panels.js:321`, `:419`). La pista "Tab: cambiar de página" (`src/panels.js:420`) se mueve a la derecha de las tres pestañas para que no se solape.

Distribución en 960x540 (texto >= 12 px lógicos):
- Arriba: título "RETO DEL DÍA" + fecha, y a la derecha la cuenta atrás hasta el próximo reto.
- Columna izquierda (DESTINO): icono del bioma (`Assets.drawDestIcon`), nombre, jefe y chip de Peligro. Debajo los mutadores, cada uno con icono y una línea de efecto.
- Columna derecha: baraja (iconos de las etiquetas + número de cartas + ancla), "Tu equipo cuenta" (una línea), tabla de premios por medalla y récord personal.
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
- **Sin PF.** Los PF tienen techo (24, `src/loot.js:129`) y van atados a vencer jefes y minijefes. Darlos a diario adelantaría la build final y sería ventaja acumulada. Es la pregunta 2 al dueño (la tarea pide decidir entre Brasas, PF y cosmético, `PLAN-MAESTRO.md:440`).
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
| Inmortalidad por defecto (Pages hasta T-FIN-01) | Se ignora en el reto: siempre se juega mortal. Aviso al empezar |
| `?dev=1&god=1` explícito | Se permite; el intento es **PRUEBA**: sin récord, sin historial, sin medalla en el medallero y sin gastar el oficial. Sí paga, para poder probar el flujo: con `?dev=1` ya existe `?give=`, así que proteger el premio no tiene sentido |
| Otros parámetros con `?dev=1` (`cmul`, `hand`, `peligro`, `speed`, `dq`, `today`...) | Intento PRUEBA, igual que arriba |
| `?seed=` en la URL (abierto, `src/dev.js:4`) | No afecta: el reto usa su semilla y al terminar `G.rngSeed` vuelve al valor anterior (`src/main.js:159-165`) |
| Práctica, cacería, Asalto | No son el reto; no tocan `daily` |

El modo PRUEBA se marca con `dev: 1` en el resultado; el chip del HUD dice "RETO (PRUEBA)".

### 1.9 Efectos del reto sobre la campaña (ninguno salvo el premio)

Nueva función `L.endDaily(won)`, hermana de `L.endPractice` (`src/loot.js:264`), elegida en `G.finish` (`src/main.js:425`). Durante el reto y al terminar:
- No se sueltan partes, Esencias, trofeos ni insignias: `L.onKill` solo cuenta la baja y avisa a los objetivos (hoy suelta botín y da PF de élite, `src/loot.js:181-206`).
- No cambian `runs`, `wins`, `bossKills`, `pelWins`, `peligro`, `pity`, `lossStreak`, `shop`, `quest`, `pf`, ni los `flags` de logros (los pone `L.endRun`, `src/loot.js:232-252`). No se llama a `Armor.onRunEnd` ni a `Q.onRunEnd`.
- Al no subir `runs`, el Tablón no rota (`src/quests.js:157`) ni cambia la luz de la aldea (`src/aldea.js:67`).
- Sí avanzan los objetivos diarios y semanales (no tocan la simulación) y el día cuenta para la racha.

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
    firstSeen: 0          // 1 cuando ya se mostró "Nuevo en el Portal"
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

- **Zona horaria: UTC para todo** (reto, objetivos, semana y racha). Es lo que ya usa el Tablón, es la única base que sirve para una tabla en línea futura y evita dos medianoches distintas. La pantalla enseña la cuenta atrás en horas y minutos ("Nuevo reto en 5 h 12 min"), así nadie tiene que saber qué es UTC. Pregunta 3 al dueño (hora local para objetivos y racha).
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
| A9 equipo | `Cuenta tu equipo: armadura, árbol y rangos.` |
| A10 sin plato | `Sin plato ni compras de Rufo.` |
| A11 cabecera premios | `PREMIO (solo el intento con premio)` |
| A12 premios | `Participar 40  ·  Bronce 90  ·  Plata 130  ·  Oro 180 Brasas` |
| A13 extra oro | `Oro: +1 Esencia. Bronce: llega al jefe. Plata: rómpele una parte.` |
| A14 récord | `Tu mejor marca: 4.210 (Plata, 9 nov)` |
| A14b sin récord | `Aún no tienes marca. Hoy puede ser el día.` |
| A15 botón | `EMPEZAR RETO` / sub: `intento con premio: 1 de 1` |
| A16 botón tras jugar | `REINTENTAR (SIN PREMIO)` / sub: `hoy: Plata, 4.210` |
| A17 cerrado | `El reto del día se abre tras tu 3.ª expedición o al vencer al Pastor.` |

### B. Confirmación y avisos al empezar

| Clave | Texto |
|---|---|
| B1 confirmación | `¿Empiezas tu intento con premio?` |
| B2 detalle | `Si sales o cierras el juego, cuenta lo que lleves.` |
| B3 botones | `EMPEZAR` / `AÚN NO` |
| B4 sin inmortalidad | `Reto sin inmortalidad: aquí se juega de verdad.` |
| B5 prueba | `Modo prueba: este reto no guarda marca.` |
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
| `src/quests.js` | Mover `hash`/`rng` (`:154-155`) a `G.util` o exportarlos (`Q.hash`, `Q.rng`). `Q.onKill`, `Q.onMiniPart`, `Q.onRunEnd`, `Q.tick` no actúan con `G.daily` (`:196-245`). `Q.target()` devuelve null con `G.daily` (`:141`) |
| `src/main.js` | `G.startGame` (`:349-419`): si `G.launchReq.daily`, poner `G.daily = rules`, `setLen(9)`, bioma, jefe y Peligro del reto, sin compras ni plato (como `prac`, `:353-356`), `G.god = false` salvo `Dev.on && god=1`, `G.rngSeed(simSeed)` y guardar la semilla anterior. Al resetear, `G.daily = null` si no es un reto. `G.diffProfile` (`:343-347`): aplicar los mutadores de horda sobre `n`, `h`, `s`. Corazones y radio de recogida según mutador. `G.finish` (`:425`): con `G.daily`, `G.Loot.endDaily(won)`; después restaurar la semilla |
| `src/loot.js` | `L.onKill` (`:181`): con `G.daily`, solo `R.kills`, suma de `dRew` y `G.Obj.on('kill')`; sin botín ni `Tree.onElite`. `L.endDaily(won)` nuevo (resumen para la pantalla, sin tocar la campaña; 1.9). `L.endRun`: avisar a `G.Obj` y a la racha (`playedToday`) |
| `src/cards.js` | `pool()` (`:116`): con `G.daily`, solo cartas de la baraja; prestadas a Rango I si no están desbloqueadas. Anclas: las del día en vez de `Save.data.anchors`. `C.reroll` (`:238`): bloqueado con `sincambio`. Avisar a `G.Obj` al fusionar |
| `src/waves.js` | Nada, si `Q.target()` ya devuelve null con `G.daily` (`:99-100`). Comprobar que `G.D.n` modificado se lee en `:142` y `:145` |
| `src/boss.js`, `src/minis*.js` | No soltar trofeos ni insignias con `G.daily` (o descartarlos en `L.collect`). `furia` (fase 2) sobre `pel()` (`:77-81`) |
| `src/player.js` | Multiplicador de daño recibido del mutador `cristal`; `pickup` y `heartP` del reto |
| `src/base.js` | Variante de `drawEnd` para el reto (1.5, textos C). `Bs.retry` (`:12`) relanza el reto sin premio con la misma semilla. Línea de objetivos en la pantalla normal (coordinar con T-F1-04) |
| `src/panels.js` | Portal: pestaña RETO (`ptabRect(2)`, `:321`; `updPortal`/`drawPortal`, `:369-498`), mover la pista Tab (`:420`) y confirmación modal. Vesper: pestaña DIARIO (`tabRect(2)`, `:112`, `:178`, `:187`); panel DIARIO también abrible desde la aldea (`P.open('diario')`) |
| `src/aldea.js` | Marca dorada del Portal (`drawMarks`, `:533-543`), marca de objetivos en Vesper, chip de la hoguera (toque = panel DIARIO), burbujas (`:341`) y línea de Lanudo (`:176`). Cosméticos de racha (farolillos, guirnalda, chispas, hoguera mayor) |
| `src/hud.js` | Chip del reto (B6), banners de medalla asegurada (B7) y de objetivos (E1-E2). Botón TERMINAR INTENTO en la pausa |
| `src/save.js` | Solo lo de 3.2, encima de T-F1-11 y en un commit aparte: `VERSION = 13`, `freshDaily()`, paso v12 -> v13 en `migrate`, `daily` en `fresh`, `adopt` y el validador `rules`. Nada de copias ni de escritura: eso ya lo hace T-F1-11 |
| `src/dev.js` | Añadir `'today'` a `CLOSED` (`:8`) |
| `index.html` | Cargar `daily.js` y `objectives.js` (después de `quests.js` y `loot.js`). El precache del service worker sale de `index.html` (`README.md:153`) |
| `src/track.js` (si ya existe T-F1-01) | Eventos `daily_start`, `daily_end` (medalla, puntos, `dq`, `god`), `obj_done`, `streak` |
| `tools/card-swarm-bot/tests.js` | Grupos `daily` y `obj` (abajo), incluidos en `all` |
| `README.md` | Sección "v10 retención" con perillas, pruebas y desvíos |

### 5.2 Pruebas a añadir

**Grupo `daily`** (fecha con `?dev=1&today=`; partidas por pasos con `?speed=0` y `G.step()`):
1. `dayKey` de 2026-11-14T23:59:59Z = `2026-11-14` y de 2026-11-15T00:00:00Z = `2026-11-15`.
2. `rules('2026-11-14', cuentaCompleta)` da el mismo JSON en dos cargas de página y en dos cuentas con todo abierto (instantánea fijada en la prueba).
3. **Determinismo del reto:** misma fecha, mismo guardado y mismas entradas por tick -> mismo hash del estado (vida, bajas, posición, nivel, mano, puntuación) en los ticks 600, 1800 y 3600. Se hace en ALTA y en BAJA (`?dq=`), igual que el grupo `seed` de T-F0-05.
4. Misma fecha con un encargo de caza activo y sin él -> mismo hash (el encargo no toca el director en el reto).
5. Misma fecha con `?seed=99` en la URL -> mismo hash que sin él; después del reto, `G.seed` vuelve a 99.
6. Cuenta con solo el Bosque -> reto en Bosque y Peligro <= II; cuenta completa -> bioma `permutación[0]`.
7. 365 fechas: Fuego en la baraja siempre que `permutación[0]` sea Tundra o Panal; presupuesto de mutadores respetado; familias distintas; Peligro entre II y IV; reparto de Peligro dentro de +-5 puntos de 35/45/20.
8. Un solo cobro: oficial terminado -> paga una vez; reintento -> no paga; recargar -> no paga otra vez.
9. **Cambio de fecha hacia atrás (1 día):** oficial jugado el día D; con el reloj en D-1 no hay oficial ni premio y sale el aviso E9.
10. **Reloj adelante y vuelta:** jugar el oficial en D+3 (paga) y volver a D. El oficial de D se puede jugar si no se había jugado; al llegar de verdad a D+3 no paga otra vez.
11. Reloj atrás más de 2 días: `maxDay` se reajusta y ningún día de `claims` se cobra dos veces.
12. Corte a mitad: con `daily.live` guardado y la página recargada, el intento se cierra con esa puntuación y se paga su medalla una vez (aviso C12).
13. Inmortalidad: con la inmortalidad por defecto, el reto arranca con `G.god === false`; con `?dev=1&god=1` el resultado es `dev: 1`, no entra en `hist` ni en `best` y no gasta el oficial.
14. Sin efecto en la campaña: tras un reto, `runs`, `wins`, `bossKills`, `pelWins`, `peligro`, `trophies`, `insignias`, `pf`, `pity`, `quest` y `shop` quedan iguales (comparación profunda) y el Tablón no rota.
15. Migración v12 -> v13: existe `swarmhand.fusion.save.v12` (la escribe `S.load`); `daily` tiene sus valores por defecto; el resto del guardado es idéntico (comparación profunda sin `v`, `flags.migrated13`, `daily` ni `_sum`). Cadena v9 -> v13.
15b. Con T-F1-11: un v13 con `daily` sobrevive a escribir, sellar, borrar el principal y recuperar desde `.reciente` y desde IndexedDB. Importar un v13 con `streak.wood = 7` o `score = -1` se rechaza (`rango`), y al cargarlo se corrige y queda anotado en `S.repairs`. Restaurar una copia `.v12` la migra a v13. El grupo `save2` sigue pasando entero.
16. Historial: con 31 retos, quedan 30 entradas; el texto para compartir coincide carácter a carácter con 4.C.
17. Mutadores MVP: con cada uno activo, la métrica que cambia lo hace en el sentido esperado (velocidad, número de enemigos, sin corazones, recogida, daño recibido, baraja, reroll bloqueado, vida de los guardianes).

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
| El reto con equipo de veterano en el Bosque es flojo | Pasa poco: con todo abierto el bioma es uniforme entre 5. Si molesta, la pregunta 4 (kit igual para todos) |
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

1. **¿El reto ignora la inmortalidad por defecto?** Recomiendo **sí**: el reto siempre se juega mortal, aunque en Pages la inmortalidad siga activa para tus pruebas. Si no, nadie en Pages podría sacar una medalla de verdad hasta T-FIN-01. Para probar el flujo con inmortalidad queda `?dev=1&god=1` (modo PRUEBA).
2. **¿Qué da el reto?** Recomiendo **Brasas + partes, 1 Esencia con el Oro y medallas cosméticas, sin PF** (tabla 1.6). Los PF tienen techo y van atados a vencer jefes: darlos a diario adelanta la build final. Alternativa si quieres más tirón: +1 PF con el primer Oro de cada semana.
3. **¿Hora UTC o local?** Recomiendo **UTC para todo**, con la cuenta atrás visible. En España el día cambia a la 1:00 o las 2:00; en América, entre las 19:00 y las 21:00. La alternativa es hora local para objetivos y racha y UTC solo para el reto: más natural, pero son dos medianoches distintas.
4. **¿Cada uno con su equipo o un kit igual para todos?** Recomiendo **cada uno con su equipo** para el MVP (árbol, rangos y armadura cuentan; plato y compras no). Un kit igual para todos sería más justo y prepararía una tabla en línea, pero hay que equilibrarlo por bioma: es otra tarea.
5. **¿Cuándo se abre el reto?** Recomiendo **tras la 3.ª expedición o al vencer al Pastor**, lo que llegue antes. Los objetivos diarios se abren desde la 1.ª expedición, para que el día 2 ya haya un motivo para volver.

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
| Sonido: medalla asegurada en partida | HUD | < 0,6 s | Suave; no debe tapar las telegrafías |
| Sonido: jingle de resultado (3 variantes por medalla) | Resultado | 1-2 s | Puede derivar de `win` / `boss_die` |
| Sonido: objetivo cumplido | Banner | < 0,4 s | Puede reutilizar `card_select` con otro tono |
| Sonido: farolillo encendido | Aldea | < 1 s | Crepitar cálido |
