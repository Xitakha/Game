# SPEC T-F0-05: simulación reproducible con `?seed` y dificultad equivalente por calidad

Estado: **borrador 1** (diagnóstico de reproducibilidad cerrado; compensación por calidad con valores iniciales y partes marcadas "pendiente de medir").
Autor: `balance-designer`. Implementa: `programmer`. No se ha tocado el código del juego: todo lo medido se hizo sobre una copia fija del commit `d740894` con parches servidos en caliente por Playwright.

Las referencias `archivo:línea` son de `games/card-swarm/` en el commit `d740894`.

---

## 0. Resumen

1. **La simulación NO es reproducible hoy, ni siquiera avanzando por pasos con `G.step()` y calidad fija.** Dos corridas con la misma semilla y las mismas entradas divergen antes del tick 600 (10 s) en los 15 escenarios probados. La causa no es el reloj: son tres fugas del RNG sembrado, todas localizadas y comprobadas con parche.
2. Con las tres fugas tapadas (24 líneas en 9 archivos), **15 de 15 escenarios dan el mismo estado** a 9000 ticks, con dos semillas, y el mismo estado por pasos, en tiempo real a x1, x4 y x8, en vista móvil y de escritorio.
3. La varianza restante de `perf_bot.js` es del propio bot: corta por reloj de pared y rellena el enjambre con un `setInterval` que consume `G.rng`.
4. La calidad gráfica cambia reglas por tres vías: tope de enemigos (`enemyMul`), tope de proyectiles (`projCap`) y, por la fuga 1, el propio flujo de azar (`nums`, `agg`).
5. Compensación propuesta para "menos enemigos, más duros y un poco más rápidos": un **perfil de dificultad por calidad fijado al empezar la expedición**, que escala a la vez el flujo de aparición y el tope, y compensa vida, daño, velocidad y recompensas por enemigo. Valores iniciales en la sección 4; quedan por calibrar con bots.

---

## 1. Objetivos medibles

| # | Objetivo | Cómo se mide |
|---|---|---|
| R1 | Misma semilla, misma calidad y mismas entradas por tick: estado idéntico | hash del estado en 12 puntos de control por calidad, igualdad exacta |
| R2 | El modo (pasos, tiempo real, `?speed`) no cambia el estado en un tick dado | mismo hash por pasos y en tiempo real x1/x4 |
| Q1 | XP y Ceniza por minuto en MEDIA y BAJA iguales a ALTA | bot con guion fijo, diferencia <= 5 % y dentro del ruido |
| Q2 | Presión entrante (daño recibido por minuto) en MEDIA y BAJA igual o mayor que en ALTA, sin pasar de +10 % | `?dbg=1`, `G.dbg.dmg` |
| Q3 | Victoria del bot hábil en MEDIA y BAJA: no más de 5 puntos por encima de ALTA ni más de 8 por debajo | banco de T-F2-01, n >= 150 por celda |
| Q4 | Los objetivos del dueño por Peligro I-V (50/40/30/20/10 %) se evalúan en ALTA; MEDIA y BAJA deben caer en la misma banda | banco de T-F2-01 |

---

## 2. Reproducibilidad: diagnóstico

### 2.1 Método

Arnés propio (fuera del repo) con Playwright sobre `tools/lib/browser.js`:

- URL base: `?nosw=1&dev=1&reset=1&direct=1&all=1&god=1&dbg=1&seed=1&q=alta&hand=spark:3,ember:3,dart:3,shard:2,ring:1` más el escenario.
- Entradas guionizadas **por tick de mundo**: quieto los primeros 300 ticks y después una dirección de 8 (o quieto) cada 45 ticks, elegida con un hash del número de bloque. Las ofertas de nivel se omiten de forma síncrona dentro del mismo tick.
- Hash FNV del estado cada 600 ticks: `G.time`, `G.runT`, bajas, jugador (posición, vida, nivel, XP, Ceniza), cada enemigo (tipo, posición, vida), gemas, proyectiles y número de zonas, con 3 decimales.
- Dos corridas por escenario, con bloques de `G.step()` de distinto tamaño (600 y 23) para que entre ellas se cuele un número distinto de fotogramas dibujados.
- Los arreglos se probaron sirviendo el archivo modificado con `page.route` (el repo no se toca).

Escenarios (15): bosque desde 0:00, bosque desde 4:00, cripta, asfódelo, tundra, panal, cráter con 4 poderes, los seis jefes a Peligro III, bosque en BAJA y bosque con `god=0`.

### 2.2 Resultado principal (medido, 7200 ticks, semilla 1)

Número de escenarios sin ninguna divergencia entre las dos corridas:

| Parche aplicado | Deterministas | Escenarios que siguen divergiendo |
|---|---|---|
| Ninguno (código actual) | 0 / 15 | todos, antes del tick 600 |
| Fuga 1 | 10 / 15 | asfódelo, Karceron, Letea, Cenizar (y Melaria en una de dos tandas) |
| Fugas 1 + 2 | 12-13 / 15 | Karceron, Cenizar (y Melaria en una de dos tandas) |
| Fugas 1 + 2 + 3 | **15 / 15** | ninguno |

Repetido con las tres fugas tapadas a 9000 ticks con semillas 1 y 4242: 15 / 15 en ambas.

Tamaño del efecto sin parche (bajas a 7200 ticks, dos corridas de la misma semilla): cráter 367 y 337 (8,5 %), panal 313 y 292 (7 %), bosque 4:00 327 y 315, `god=0` 270 y 254. Es el mismo orden que el 600 / 552 / 546 que motivó la tarea.

### 2.3 Causas verificadas

**Fuga 1. Los efectos visuales consumen el RNG sembrado (causa principal).**
`src/fx.js` llama a `G.rnd` (sembrado) en 14 líneas: 61, 63, 64, 78, 79, 83, 86, 90, 94, 95, 108, 114, 128 y 131 (`hitspark`, `puff`, `curse`, `spark`, `dust`, `smoke`, `ember`, `flames`, `burst`, `bolt`, `num`). El comentario de `src/main.js:143` dice que las partículas usan `G.rndFx` y no consumen la secuencia; no es cierto para `fx.js`.
Esos efectos se disparan tras puertas `Math.random()` no sembradas repartidas por la lógica, por ejemplo `src/player.js:125` (`if (p.moving && Math.random() < 0.06) G.fx.dust(...)`), y otras en `combat.js`, `enemies.js`, `weapons.js`, `fusion.js`, `minis_atk.js` y los jefes. Cada vez que la puerta se abre, el efecto saca entre 1 y 5 números de la secuencia sembrada y desplaza todo lo que viene después (apariciones, ofertas, botín).
- Por qué la prueba actual no lo ve: el grupo `seed` de `tools/card-swarm-bot/tests.js` (línea 598) deja al jugador quieto 4000 ticks en el bosque; sin movimiento la puerta de `player.js:125` no se abre. Medido: quieto, 3600 ticks, 4 corridas, mismo hash; moviéndose, 4 corridas, 4 hashes distintos (bajas 97, 92, 99, 95).
- Además depende de la calidad: `fx.num` (`src/fx.js:122-131`) corta antes de consumir el RNG según `Q.nums` (70 / 40 / 18) y `Q.agg` (solo BAJA), así que la calidad altera la secuencia aunque el tope de enemigos no actúe.

**Fuga 2. Lógica que usa el RNG de efectos.**
`src/enemies.js:652`: `e.tgtT = G.rndFx(500, 2000)` fija cuándo la Sanguijuela vuelve a elegir charco. Es lógica y usa `Math.random`. Localizada volcando el estado tick a tick: la primera diferencia es la posición de una sanguijuela oculta (tick 623 en la corrida analizada) y precede a cualquier diferencia en el número de llamadas a `G.rng`. Afecta al Asfódelo y a la pelea de Letea.

**Fuga 3. Código de dibujo que consume el RNG sembrado.**
Ocho sitios sacan un número de `G.rng` en cada fotograma dibujado mientras algo tiembla, de modo que el resultado depende de los fps:
`src/boss.js:873`, `src/boss_cenizar.js:264`, `src/boss_karceron.js:535`, `src/boss_karceron.js:595`, `src/boss_letea.js:579`, `src/panal.js:583`, `src/tundra.js:392` y `src/enemies_tundra.js:319`.
Comprobación: con las fugas 1 y 2 tapadas, Karceron no diverge en 6 pares de corridas hechas en una sola llamada (sin ningún fotograma dibujado entre medias) y sí diverge cuando se intercalan fotogramas.

**Causa 4. El bot de rendimiento no es reproducible por diseño.**
`tools/card-swarm-bot/perf_bot.js`: (a) rellena el enjambre con `setInterval(..., 250)` de reloj real que llama a `G.rng` desde fuera de la simulación; (b) lee las bajas cuando se cumplen N segundos de pared, no en un tick fijo; (c) usa vista móvil sin `q=`, así que arranca en calidad automática. Descomposición numérica: **pendiente de repetir sobre `d740894`** (la tanda previa se hizo mientras el árbol de trabajo cambiaba y no la doy por válida).

**Causa 5. La calidad cambia reglas** (ver sección 3).

### 2.4 Causas descartadas (medido, con las tres fugas tapadas)

| Sospecha | Experimento | Resultado |
|---|---|---|
| Reloj real y `G.speed` | bosque 4:00, 7200 ticks: pasos frente a tiempo real x4 y x8 | mismo hash en los 12 puntos de control (final: 314 bajas, hash 1069180839) |
| Número variable de pasos por fotograma | ídem, más bloques de 600, 211, 37, 23, 7 y 1 pasos | mismo hash |
| Vista móvil frente a escritorio | tiempo real x4 en 844x390 táctil y en 1280x720 | mismo hash |
| Orden de arrays, `Object.keys`, ordenaciones | cubierto por lo anterior | sin divergencia |
| `performance.now()` / `Date.now()` en lógica | lectura: `enemies.js:120, 159, 580, 691` y `fusion.js:102` solo limitan sonidos | sin efecto en el estado |
| Calidad adaptativa cambiando en mitad de la partida | en este entorno la calidad automática no cambió en ninguna corrida (se quedó en MEDIA) | no fue causa de la varianza observada aquí; sí es un riesgo real en un móvil lento (sección 3) |

A x1 en tiempo real (3600 ticks) las corridas coinciden entre sí y con la de pasos en todos los puntos comparables.

Inferido, no medido: por debajo de 10 fps (`raw > 100 ms`, `src/main.js:569`) o cuando se agotan los 6 pasos por fotograma (`src/main.js:572-575`) el juego descarta tiempo y va a cámara lenta. No rompe la reproducibilidad por tick, pero da más tiempo de reacción en dispositivos muy lentos. Queda fuera de esta tarea; se anota para T-F2-07.

---

## 3. Reproducibilidad: diseño

### 3.1 Regla

> La simulación (todo lo que cuelga de `updateWorld`) solo lee azar de `G.rng` / `G.rnd`. El dibujo y los efectos solo leen de `Math.random` / `G.rndFx`. Ninguna puerta de lógica usa `Math.random`. La calidad gráfica no entra en ninguna regla salvo a través del perfil de dificultad fijado al empezar la expedición.

### 3.2 Cambios (los tres parches probados)

1. `src/fx.js`: las 14 llamadas `G.rnd(` pasan a `G.rndFx(`.
2. `src/enemies.js:652`: `G.rndFx(500, 2000)` pasa a `G.rnd(500, 2000)`.
3. Los 8 sitios de dibujo de la fuga 3: `G.rng()` pasa a `Math.random()`.
4. Corregir el comentario de `src/main.js:142-143`.

Estos cambios no alteran el balance: solo cambian qué generador pinta una partícula o un temblor. Sin `?seed` ambos generadores son `Math.random`, así que el juego normal no cambia.

### 3.3 Guardia para que no vuelva a pasar

- `G.rngGuard` (solo con `?seed` y `?dev=1`): `draw()` marca `G._inDraw = true` al entrar y `false` al salir; las funciones de `fx` marcan `G._inFx`. Si se llama a `G.rng` con cualquiera de las dos marcas, se cuenta en `G.rngLeaks` y se guarda la primera pila. La prueba exige `G.rngLeaks === 0`.
- Prueba estática: `grep` en `tests.js` que falle si `src/fx.js` contiene `G.rnd(` o `G.rng(`.

### 3.4 Qué fija el modo semilla y qué queda fuera

Fijado con `?seed=<n>`:
- `G.rng` (ya existe).
- El perfil de dificultad por calidad se toma al empezar la expedición y no cambia (sección 4.5). Las pruebas pasan siempre `&q=alta|media|baja`.
- El tope de proyectiles pasa a ser regla común (sección 4.6).

Fuera (no se promete):
- Cuántos ticks caben en N segundos de pared. Las comparaciones se hacen por tick, nunca por segundos.
- Entradas enviadas por reloj real (`setInterval`, `waitForTimeout`, teclado de Playwright). Un bot reproducible fija las entradas por tick con `?speed=0` y `G.step()`, o desde un gancho por tick.
- El guardado: las pruebas usan `reset=1` (con `dev=1`).
- El encargo diario (`src/quests.js:156` usa `Date.now()` para el día y el objetivo pondera el spawn en `src/waves.js`): **pendiente de comprobar** si con `reset=1` hay encargo activo; si lo hay, el modo semilla debe fijar el día.
- Igualdad entre motores de navegador distintos (las funciones trigonométricas pueden diferir en el último bit). La garantía es por navegador.

### 3.5 Prueba: hash a N ticks

Sustituye al grupo `seed` actual.

- URL: `dev=1&reset=1&god=1&direct=1&all=1&noanchor=1&speed=0&seed=1234&hand=spark:3,ember:3,dart:3,shard:2,ring:1&q=<calidad>`.
- Entradas: guion por tick con movimiento (obligatorio: sin movimiento la prueba no ve la fuga 1).
- Puntos de control: ticks 600, 1800, 3600, 5400, 7200, 10800, 14400, 18000, 21600, 25200 más dos intermedios (12 por calidad; incluyen los 60, 180 y 420 s de la aceptación del plan).
- Calidades: ALTA y BAJA (24 puntos). Dos corridas por calidad con distinto tamaño de bloque (600 y 23) y una espera entre bloques para que se dibujen fotogramas.
- Tolerancia: **igualdad exacta** del hash. No hay tolerancia numérica: una diferencia de un bit se amplifica en pocos segundos, así que un umbral no significaría nada.
- Extras baratos: (a) un jefe con columnas que tiemblan (Karceron, 6000 ticks) para cubrir la fuga 3; (b) Asfódelo 3000 ticks para la fuga 2; (c) otra semilla da otro hash; (d) `G.rngLeaks === 0`.
- Coste medido del arnés: unos 0,5 a 1 ms por tick en este entorno; 25200 ticks por 4 corridas son del orden de 1 a 2 minutos.

---

## 4. Dificultad equivalente por calidad: diseño

### 4.1 Qué pasa hoy

- `src/mobile.js:26-28`: `enemyMul` 1 / 0,9 / 0,75 y `projCap` 400 / 260 / 150 para ALTA / MEDIA / BAJA.
- `src/waves.js:145`: `cap = max(6, round(cap(m) * G.Q.enemyMul))`. Solo se escala el **tope**; el presupuesto de aparición `B.bp(m)` no.
- `src/enemies.js:192`: un proyectil enemigo no nace si ya hay más de `projCap` (BAJA: los enemigos disparan menos).
- `src/weapons.js:20`: un proyectil del jugador no nace si hay más de `projCap * 1,5` (BAJA: el jugador pierde daño).
- La calidad automática baja un nivel tras 3 s por debajo de 45 fps (`src/mobile.js:60-80`), en mitad de la expedición.

Medido: con una mano fuerte (5 cartas a nivel 3 y `cmul` por defecto) el tope no llega a actuar. En bosque 4:00 hay entre 4 y 16 enemigos vivos frente a un tope de 70 o más, y ALTA, MEDIA y BAJA dan **el mismo hash** a 7200 ticks. Es decir, hoy la diferencia entre dispositivos solo existe cuando el jugador mata despacio y se llena el tope: BAJA es más fácil justo para quien va peor. **Pendiente de medir**: qué fracción del tiempo actúa el tope con un jugador sin armadura y mano normal (censo con `G.Waves.census()`).

### 4.2 Principio

Un tope más bajo solo no es "menos enemigos": si el tope no actúa, no cambia nada, y si actúa, regala aire. La compensación tiene que valer en los dos regímenes, así que se escala **el flujo** (presupuesto por pulso) **y** el tope con el mismo factor, y cada enemigo normal lleva los multiplicadores de su perfil desde que nace.

Perfil de dificultad `G.D` (uno por expedición):

| Símbolo | Qué escala | Dónde |
|---|---|---|
| `n` | número de enemigos: presupuesto por pulso y tope global | `waves.js` |
| `h` | vida de los enemigos normales | al nacer |
| `d` | daño de contacto y de proyectil de los enemigos normales | al nacer |
| `s` | velocidad de desplazamiento de los enemigos normales | junto a `B.speedMul` |
| `x` | recompensa por baja: XP por gema, Ceniza, probabilidad de botín y de corazón, y efectos "por baja" | al morir |

### 4.3 Fórmulas

Con `n` dado por la calidad:

- **Recompensas**: `x = 1 / n`. Exacto: bajas por minuto por `n`, recompensa por baja por `1/n`, XP y Ceniza por minuto sin cambio.
- **Vida**: `h = 1 + kh * (1/n - 1)`, con `kh = 0,75`.
  Justificación: sea `a` la parte del daño del jugador que es de área (cuyo rendimiento cae con la densidad, proporcional a `n`). La capacidad de limpieza es `(1 - a) + a*n` y la vida que entra por minuto es `n*h`. Igualar el cociente da `h = (1 - a)/n + a`, es decir `kh = 1 - a`. Con `kh = 0,75` se supone `a = 0,25`. Con `kh = 1` (todo daño a un objetivo) la vida total por minuto sería idéntica, pero las manos de área sufrirían un 33 % más en BAJA. `a` es una suposición: **se calibra con bots** (sección 5).
- **Velocidad**: `s` pequeño y fijo por nivel ("un poco más rápidos"). Solo desplazamiento, igual que `B.speedMul` (`src/main.js:112-116`): las telegrafías, las cargas, los lances y los proyectiles no cambian, de modo que la regla de esquiva (`tele >= 250 + 1000 * px / 190`) se cumple sin tocar nada.
- **Daño**: el jugador tiene 600 ms de invulnerabilidad tras cada golpe (`B.player.invuln`), así que hay dos regímenes. Disperso (golpes espaciados): daño por segundo proporcional a `n * s * d`; igualarlo pide `d = 1 / (n*s)`. Saturado (rodeado, un golpe cada 600 ms): daño por segundo proporcional a `d`; igualarlo pide `d = 1`. Se toma un punto intermedio que nunca baja la presión en saturado y queda algo corto en disperso, y se calibra.

### 4.4 Valores iniciales

| Calidad | `n` | `h` (vida) | `d` (daño) | `s` (velocidad) | `x` (recompensa) |
|---|---|---|---|---|---|
| ALTA | 1,00 | 1,000 | 1,00 | 1,00 | 1,000 |
| MEDIA | 0,90 | 1,083 | 1,05 | 1,03 | 1,111 |
| BAJA | 0,75 | 1,250 | 1,15 | 1,08 | 1,333 |

Presión resultante según el modelo (1,00 = igual que ALTA; es cálculo, no medición):

| Magnitud | Fórmula | MEDIA | BAJA |
|---|---|---|---|
| XP y Ceniza por minuto | `n * x` | 1,000 | 1,000 |
| Vida que entra por minuto | `n * h` | 0,975 | 0,938 |
| Vida que entra / capacidad de limpieza (`a = 0,25`) | `n*h / (1 - a + a*n)` | 1,000 | 1,000 |
| Golpes para matar un enemigo | `h` | 1,083 | 1,250 |
| Daño entrante, régimen disperso | `n * s * d` | 0,973 | 0,932 |
| Daño entrante, régimen saturado | `d` | 1,050 | 1,150 |
| Tamaño de cada golpe recibido | `d` | 1,050 | 1,150 |
| Velocidad máxima de un normal (Perro, 125 px/s, minuto 9) | `125 * 1,072 * s` | 138 | 145 (76 % de la del jugador, 190) |

Lectura: en BAJA hay un 25 % menos de enemigos, cada uno aguanta un 25 % más, pega un 15 % más y corre un 8 % más. El golpe individual más grande sube la varianza (más riesgo de muerte por un error), que es la dirección segura respecto al principio de reto. Los valores de `d` y `s` son los que más dudas tienen y los que el banco debe confirmar.

Perillas de exploración (con `?dev=1`, antes de fijar valores): `?dn=`, `?dh=`, `?dd=`, `?ds=`, `?dx=` sobrescriben el perfil; `?dq=alta|media|baja` fuerza el perfil sin cambiar los gráficos (permite medir BAJA en un PC con gráficos ALTA y aislar reglas de rendimiento).

### 4.5 Cambio de calidad a mitad de partida

**Propuesta: el perfil se fija al empezar la expedición** (`G.startGame`), a partir de la calidad vigente en ese momento, y no cambia hasta la siguiente.

- Si la calidad automática baja en mitad de la partida, cambian solo los gráficos (resolución, partículas, niebla); las reglas siguen. La siguiente expedición ya empieza con el perfil nuevo (`qlast` se guarda, `src/mobile.js:74`).
- Si el jugador cambia la calidad a mano en la pausa, igual: efecto en reglas desde la siguiente expedición. El menú debe decirlo ("se aplica a los enemigos en la próxima expedición").
- El perfil se guarda en el resumen de la partida (`G.D.id`), para récords, reto diario y analítica.
- Coste: una expedición que empieza en MEDIA y cae a BAJA termina con el número de enemigos de MEDIA (como mucho 9 minutos).

Alternativa descartada por ahora: aplicar el perfil nuevo a los enemigos que nacen después del cambio. Mantiene mejor los fps, pero mezcla dos reglas en una partida, hace que el resultado dependa de cuándo cayeron los fps y complica récords y reto diario. Si T-F2-07 demuestra que los fps no aguantan, se revisa.

### 4.6 Proyectiles

`projCap` deja de depender de la calidad para las reglas: un único valor de regla (`G.B.projCap = 400` enemigos, `600` jugador, los de ALTA hoy). Con menos enemigos hay menos proyectiles de por sí. **Pendiente de medir**: máximo de `G.projectiles.length` en el peor caso (cráter, enjambre 110, 4 poderes) para saber si 150 / 225 llegaba a actuar en BAJA. Si actuaba, hoy BAJA recorta a la vez daño del jugador y disparos enemigos, y quitarlo sube el coste de dibujo: lo valida T-F2-07.

### 4.7 Jefes, minijefes y esbirros

- **Jefes** (`boss.js` y `boss_*.js`): nada. Vida, daño, telegrafías y `PELIGRO` iguales en todas las calidades. Los objetivos 50/40/30/20/10 % dependen sobre todo de la pelea de jefe y no deben moverse por calidad.
- **Minijefes y guardianes** (`elite`, `G.Minis`): nada.
- **Esbirros invocados por un jefe o minijefe** (larvas de la Madre Colmena, invocaciones de ataque): nada; son parte del patrón.
- **Normales que el director sigue enviando con el jefe vivo** (`G.Boss.spawnMode()`, tipos ligeros): llevan el perfil, con `n` aplicado a `bm.cap` y a `bm.mul` como hoy se aplica `enemyMul` a `bm.cap`.
- **Cacería y práctica** (`huntUpdate`, 3 gusanos cada 25 s): sin perfil (no hay horda que compensar).

### 4.8 Efectos que cuentan bajas

Con menos bajas, todo lo que se dispara "por baja" rinde menos y haría BAJA más difícil por una vía no buscada. Deben escalar con `x`: probabilidad de cura por baja (`B.heal`, Colmillo y Pacto), contador de Sangre envenenada (cada 15 bajas), progreso de encargos por tipo, botín y corazones. `G.kills` en pantalla sigue siendo el número real. **Pendiente**: inventario completo de sitios (lo añado en la siguiente revisión de este documento).

---

## 5. Plan de medición con bots (equivalencia ALTA / MEDIA / BAJA)

Requisito previo: sección 3 implementada (sin reproducibilidad el ruido entre lotes iguales tapa efectos del 5 al 8 %).

Todo por pasos (`?speed=0`, `G.step()`), con `?dq=` para aislar reglas de rendimiento, semillas 1..N iguales en las tres calidades.

| Fase | Qué | Bot | n | Métricas | Aceptación |
|---|---|---|---|---|---|
| A | Economía | guion fijo, `god=1` | 30 semillas por calidad, 9 min | XP total, nivel al minuto 3 / 5 / 7, Ceniza, piezas de botín | MEDIA y BAJA dentro de +-5 % de ALTA y dentro de 2 errores estándar |
| B | Presión entrante | guion fijo, `god=1&dbg=1` | 30 por calidad | daño recibido por minuto por fuente, golpes por minuto | entre 1,00 y 1,10 de ALTA |
| C | Capacidad de limpieza | guion fijo, 3 manos (un objetivo, área, mixta) | 20 por mano y calidad | enemigos vivos medios, fracción de tiempo en el tope, bajas * `x` por minuto | vivos / tope dentro de +-0,05 de ALTA en las tres manos; si la mano de área se desvía, ajustar `kh` |
| D | Supervivencia | bot hábil de T-F2-01, `god=0`, sin armadura y con set | 150 por celda (Peligro I, III, V) | victoria, vida mínima, minuto de muerte | victoria: no más de +5 puntos ni menos de -8 respecto a ALTA |

Ruido esperado: con n = 150 y una tasa del 30 %, el error estándar es 3,7 puntos y el de una diferencia 5,3; una diferencia menor de 10 puntos entre dos celdas no es un resultado por sí sola, por eso las fases A a C (métricas continuas) deciden los valores y la D solo confirma. Antes de cada fase se corre dos veces el lote de ALTA con semillas distintas para tener el ruido entre lotes iguales.

Orden de ajuste, una perilla cada vez: `x` no se toca (es exacta); `h` con la fase C; `s` fijo; `d` con la fase B; confirmación con D.

---

## 6. Riesgos

| Riesgo | Efecto | Mitigación |
|---|---|---|
| `kh` o `d` mal supuestos | BAJA más fácil o más difícil que ALTA | perillas por URL, fases B y C antes de fijar; ante la duda, quedarse del lado difícil |
| Golpes un 15 % más grandes en BAJA | más muertes por un solo error | es la dirección aceptada por el principio de reto; vigilar "muerte por fuente" en la fase D |
| Perfil fijado al empezar | una partida entera con más enemigos de los que el móvil mueve | `qlast` persistente; T-F2-07 mide fps; alternativa de 4.5 en reserva |
| Quitar `projCap` como regla | más proyectiles dibujados en BAJA | medir el máximo real; recorte solo visual si hace falta |
| Tapar las fugas cambia la secuencia de todas las semillas | las cifras de bots anteriores con `?seed` dejan de ser comparables | rehacer la línea base tras el cambio; anotarlo en el README |
| Reproducibilidad solo por navegador | un reto diario verificado en servidor no podría reproducir la partida | fuera de alcance; anotado |
| Menos enemigos cambia la sensación de enjambre | BAJA se siente menos "survivors" | es la decisión del dueño; el playtest en móvil decide si `n = 0,75` es aceptable |

Este cambio **no baja la dificultad** en ninguna calidad según el modelo; sube ligeramente MEDIA y BAJA en régimen saturado. Si la medición mostrara lo contrario, se corrige antes de fijar valores.

---

## 7. Cambios por archivo (para el programador)

Paso 1, reproducibilidad (sin cambio de balance):

| Archivo | Cambio |
|---|---|
| `src/fx.js` | líneas 61, 63, 64, 78, 79, 83, 86, 90, 94, 95, 108, 114, 128, 131: `G.rnd(` pasa a `G.rndFx(` |
| `src/enemies.js` | 652: `G.rndFx(500, 2000)` pasa a `G.rnd(500, 2000)` |
| `src/boss.js` 873, `src/boss_cenizar.js` 264, `src/boss_karceron.js` 535 y 595, `src/boss_letea.js` 579, `src/panal.js` 583, `src/tundra.js` 392, `src/enemies_tundra.js` 319 | `G.rng()` pasa a `Math.random()` |
| `src/main.js` | corregir el comentario de 142-143; `G.rngGuard` y marca `G._inDraw` alrededor de `draw()` (solo `?seed` con `?dev=1`) |
| `tools/card-swarm-bot/perf_bot.js` | relleno del enjambre desde un gancho por tick (cada 15 ticks) en vez de `setInterval`; `q=` explícito; informar las bajas en un tick fijo además del tiempo de pared |
| `tools/card-swarm-bot/tests.js` | grupo `seed` nuevo (sección 3.5) |

Paso 2, perfil de dificultad (cambio de reglas, detrás de perillas hasta calibrar):

| Archivo | Cambio |
|---|---|
| `src/main.js` | `G.B.diff = { alta: {n,h,d,s,x}, media: {...}, baja: {...} }` con la tabla 4.4; `G.B.projCap`; en `G.startGame`, `G.D = perfil(G.Q.level)` con las perillas `?dq ?dn ?dh ?dd ?ds ?dx` (con `dev=1`) |
| `src/mobile.js` | quitar `enemyMul` y `projCap` de `LV` (quedan solo ajustes visuales); texto del menú de calidad |
| `src/waves.js` | 142-145: presupuesto `bp * G.D.n` y tope `round(cap * G.D.n)` en lugar de `G.Q.enemyMul` |
| `src/enemies.js` | al nacer un normal (no élite, no jefe, no invocado por jefe o minijefe, no cacería): `hp *= G.D.h`, `dmg *= G.D.d`, velocidad `* G.D.s`, y guardar `e.dx = G.D.x`; 192: usar `G.B.projCap` |
| `src/weapons.js` | 20: usar `G.B.projCap * 1,5` |
| `src/loot.js`, `src/combat.js` | recompensas y efectos por baja multiplicados por `e.dx` (lista de 4.8) |
| `src/hud.js` / fin de expedición | guardar `G.D.id` en el resumen |
| `games/card-swarm/README.md` | antes y después de cada valor |

---

## 8. Pruebas a añadir en `tools/card-swarm-bot/tests.js`

1. `seed`: 12 puntos de control por calidad (ALTA y BAJA), con movimiento, dos tamaños de bloque, igualdad exacta (3.5).
2. `seed-boss`: Karceron 6000 ticks con fotogramas intercalados, mismo hash (fuga 3).
3. `seed-asf`: Asfódelo 3000 ticks, mismo hash (fuga 2).
4. `seed-guard`: `G.rngLeaks === 0` tras las anteriores; `src/fx.js` sin `G.rnd(`.
5. `seed-mode`: mismo hash por pasos y en tiempo real x4 en el tick 3600.
6. `diff-profile`: el perfil se fija en `startGame` y no cambia al llamar a `G.Sys.setQuality` en mitad de la partida; cambia en la siguiente.
7. `diff-values`: con `q=baja`, un gusano nace con vida, daño y velocidad multiplicados por la tabla; un jefe y un minijefe, no.
8. `diff-xp`: XP total por gemas de 100 bajas en BAJA = XP de 133 bajas equivalentes en ALTA (+-1 gema).
9. `diff-cap`: tope y presupuesto por pulso en el minuto 5 = valores de ALTA por `n`.
10. La prueba actual que comprueba `enemyMul` o `projCap` por calidad, si existe, se adapta (**pendiente de localizar**).

---

## 9. Decisiones que necesitan al dueño

1. **Perfil fijado al empezar la expedición** (propuesta) o cambio inmediato a mitad de partida si el móvil se ahoga.
2. **Más daño por golpe en MEDIA y BAJA** (+5 % y +15 %). El dueño dijo "más duros y un poco más rápidos"; el daño no lo mencionó. Sin él, la presión entrante en BAJA quedaría en torno a un 19 % por debajo de ALTA cuando los golpes son espaciados, es decir, más fácil.
3. **Magnitud de la reducción**: mantener -10 % y -25 % de enemigos, o reducir menos si T-F2-07 muestra que los móviles aguantan.

## 10. Pendiente de medir (se actualizará en este documento)

- Descomposición de la varianza de `perf_bot.js` sobre `d740894`.
- Fracción del tiempo en que actúa el tope de enemigos con mano normal.
- Máximo de proyectiles simultáneos en el peor caso.
- Inventario de efectos por baja y de puntos de nacimiento de enemigos (líneas exactas).
- Encargo diario con `reset=1`.
- Primera pasada de las fases A y B con el perfil emulado por parche.
