# SPEC T-F0-05: simulación reproducible con `?seed` y dificultad equivalente por calidad

Estado: **borrador 2** (diagnóstico de reproducibilidad cerrado y comprobado con parche; compensación por calidad con una primera calibración con bot; lo que falta está en la sección 10).
Autor: `balance-designer`. Implementa: `programmer`. No se ha tocado el código del juego: todo lo medido se hizo sobre una copia fija del commit `d740894` con parches servidos en caliente por Playwright.

Las referencias `archivo:línea` son de `games/card-swarm/` en el commit `d740894`.

---

## Decisiones aprobadas (2026-11-13)

El dueño resolvió las tres decisiones de la sección 9:

1. El perfil de dificultad se **FIJA AL EMPEZAR** la expedición. Si la calidad adaptativa cambia a mitad, solo cambian los gráficos hasta la siguiente expedición.
2. Se **ACEPTA el daño extra por golpe** en MEDIA y BAJA (+5 % y +10 %).
3. Se **MANTIENE la reducción de enemigos**: -10 % en MEDIA y -25 % en BAJA.

Implementación de la parte 2 (2026-11-14): sección 12. Los valores de la tabla 4.4 quedan como valores de partida en una tabla de datos única (`G.B.diff`, `src/main.js`) con perillas por URL (`?dev=1`); el diseñador de balance los calibra después.

---

## 0. Resumen

1. **La simulación NO es reproducible hoy, ni siquiera avanzando por pasos con `G.step()` y calidad fija.** Dos corridas con la misma semilla y las mismas entradas divergen antes del tick 600 (10 s) en los 15 escenarios probados. La causa no es el reloj: son tres fugas del RNG sembrado, todas localizadas y comprobadas con parche.
2. Con las tres fugas tapadas (24 líneas en 9 archivos), **15 de 15 escenarios dan el mismo estado** a 9000 ticks, con dos semillas, y el mismo estado por pasos, en tiempo real a x1, x4 y x8, en vista móvil y de escritorio.
3. La varianza restante de `perf_bot.js` es del propio bot: corta por reloj de pared y rellena el enjambre con un `setInterval` que consume `G.rng`.
4. La calidad gráfica cambia reglas por tres vías: tope de enemigos (`enemyMul`), tope de proyectiles (`projCap`) y, por la fuga 1, el propio flujo de azar (`nums`, `agg`).
5. **Hallazgo que cambia el planteamiento**: en una expedición normal el tope de enemigos casi nunca actúa. Con el bot de guion, ALTA y la BAJA actual dan resultados idénticos en 12 de 12 semillas (hay unos 18 enemigos vivos de media frente a un tope de 30 a 105). El tope solo actúa cuando el jugador no da abasto, y entonces la BAJA actual no es más fácil sino más pobre: mismo daño recibido y un 29 % menos de bajas y de Ceniza.
6. Compensación propuesta para "menos enemigos, más duros y un poco más rápidos": un **perfil de dificultad por calidad fijado al empezar la expedición**, que escala a la vez el flujo de aparición y el tope, y compensa vida, daño, velocidad y recompensas por enemigo. Valores en la sección 4.4, con una primera calibración medida en 4.5.

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
`tools/card-swarm-bot/perf_bot.js`: (a) rellena el enjambre con `setInterval(..., 250)` de reloj real que llama a `G.rng` desde fuera de la simulación; (b) lee las bajas cuando se cumplen N segundos de pared, no en un tick fijo; (c) usa vista móvil sin `q=`, así que arranca en calidad automática.

Descomposición medida sobre `d740894` (cráter, enjambre 110, 4 poderes, semilla 1, 3 corridas por fila; bajas a los 33 s de pared o en el tick 1980):

| Variante | Bajas | Ticks de mundo | Qué queda de ruido |
|---|---|---|---|
| Bot actual, juego actual | 1040, 1044, 1013 | 1766 a 1797 | todo |
| Bot actual, fugas tapadas | 1007, 1028, 1012 | 1771 a 1782 | temporizador real y corte por reloj |
| Relleno por tick y corte en tick fijo, juego actual | 1138, 1134, 1106 | 1980 | solo las fugas del RNG |
| Relleno por tick y corte en tick fijo, fugas tapadas | 1140, 1133, 1133 | 1980 | ver nota |
| Relleno por tick, corte por reloj, fugas tapadas | 1064, 1061, 1108 | 1869 a 1870 | desfase de arranque |

Nota: en las dos últimas filas el arnés se instala 800 ms de pared después de cargar, así que el primer relleno cae un tick antes o después según la corrida. Las dos corridas con el mismo desfase dan exactamente 1133; la que arranca un tick antes da 1140, y con corte por reloj un tick de desfase llega a mover 47 bajas (4 %). Conclusión: una entrada que se aplica un tick antes o después cambia el resultado tanto como las fugas, así que un bot solo es reproducible si fija sus entradas por tick. Con n = 3 los rangos no permiten repartir la varianza en porcentajes por causa; lo que sí queda probado es qué condición la elimina.

En este entorno el rango del bot actual es del 3 %, menor que el 9 % del informe original (600 / 552 / 546); la diferencia es coherente con una máquina más cargada, donde entran menos ticks de mundo en el mismo tiempo de pared, pero eso no lo he medido.

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
- El perfil de dificultad por calidad se toma al empezar la expedición y no cambia (sección 4.6). Las pruebas pasan siempre `&q=alta|media|baja`.
- El tope de proyectiles pasa a ser regla común (sección 4.7).

Fuera (no se promete):
- Cuántos ticks caben en N segundos de pared. Las comparaciones se hacen por tick, nunca por segundos.
- Entradas enviadas por reloj real (`setInterval`, `waitForTimeout`, teclado de Playwright). Un bot reproducible fija las entradas por tick con `?speed=0` y `G.step()`, o desde un gancho por tick.
- El guardado: las pruebas usan `reset=1` (con `dev=1`).
- El encargo activo: `G.Quests.target()` (`src/quests.js:141`) sale del guardado y pondera la aparición en `src/waves.js`. Con `reset=1` no hay encargo activo, así que las pruebas no lo ven; en una partida real forma parte del estado inicial, igual que el árbol o la armadura. `Date.now()` (`src/quests.js:156`) solo decide qué encargos se ofrecen en el tablón.
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

Medido (bosque, 7:30 hasta el jefe, bot de guion que empieza con una carta y coge la primera oferta de cada nivel, `god=1` con la invulnerabilidad normal de 600 ms, media y error estándar):

| Régimen | Condición | n | Bajas | Nivel final | Ceniza | Daño recibido | Vivos de media | Tiempo en el tope |
|---|---|---|---|---|---|---|---|---|
| Normal (`cmul` por defecto) | ALTA | 12 | 843 +- 30 | 11,3 +- 0,2 | 1133 +- 40 | 1888 +- 168 | 18,5 | 0 % |
| Normal | BAJA actual (solo tope) | 12 | 843 +- 30 | 11,3 +- 0,2 | 1133 +- 40 | 1888 +- 168 | 18,5 | 0 % |
| Saturado (`cmul=1`) | ALTA | 6 | 674 +- 66 | 9,8 +- 0,5 | 845 +- 84 | 2996 +- 60 | 30,0 | 0 % |
| Saturado | BAJA actual (solo tope) | 6 | 481 +- 26 | 8,3 +- 0,2 | 600 +- 30 | 3041 +- 27 | 31,2 | 10 % |

Lectura:
- En régimen normal la BAJA actual es **idéntica** a ALTA semilla a semilla: el tope no actúa nunca. Hoy la calidad no cambia la dificultad de una expedición que va bien (ni ahorra enemigos al móvil).
- En régimen saturado la BAJA actual recibe el mismo daño (el límite lo ponen los 600 ms de invulnerabilidad) y consigue un 29 % menos de bajas, 1,5 niveles menos y un 29 % menos de Ceniza. No es más fácil: es más pobre.
- El máximo de proyectiles simultáneos fue 18 a 27 (casi todos enemigos), muy por debajo de `projCap` de BAJA (150). En expediciones normales `projCap` tampoco actúa. **Pendiente**: el peor caso artificial de `perf_bot` (enjambre de 110).

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

- **Recompensas**: `x = 1 / r`, donde `r` es la razón **medida** de bajas respecto a ALTA. No vale `1/n`: el director desperdicia parte del presupuesto en ALTA (se recorta a 2,5 pulsos y lo frenan los topes por tipo) y menos en BAJA, y los invocados no llevan perfil. Medido: con `n = 0,75` las bajas quedan en 0,82 a 0,86 de ALTA, y con `n = 0,90` en 0,93 a 0,94.
- **Vida**: `h = 1 + kh * (1/n - 1)`, con `kh = 0,75`.
  Justificación: sea `a` la parte del daño del jugador que es de área (cuyo rendimiento cae con la densidad, proporcional a `n`). La capacidad de limpieza es `(1 - a) + a*n` y la vida que entra por minuto es `n*h`. Igualar el cociente da `h = (1 - a)/n + a`, es decir `kh = 1 - a`. Con `kh = 0,75` se supone `a = 0,25`. Con `kh = 1` (todo daño a un objetivo) la vida total por minuto sería idéntica, pero las manos de área sufrirían un 33 % más en BAJA. `a` es una suposición: **se calibra con bots** (sección 5).
- **Velocidad**: `s` pequeño y fijo por nivel ("un poco más rápidos"). Solo desplazamiento, igual que `B.speedMul` (`src/main.js:112-116`): las telegrafías, las cargas, los lances y los proyectiles no cambian, de modo que la regla de esquiva (`tele >= 250 + 1000 * px / 190`) se cumple sin tocar nada.
- **Daño**: el jugador tiene 600 ms de invulnerabilidad tras cada golpe (`B.player.invuln`), así que hay dos regímenes. Disperso (golpes espaciados): daño por segundo proporcional a `n * s * d`; igualarlo pide `d = 1 / (n*s)`. Saturado (rodeado, un golpe cada 600 ms): daño por segundo proporcional a `d`; igualarlo pide `d = 1`. Se toma un punto intermedio que nunca baja la presión en saturado y queda algo corto en disperso, y se calibra.

### 4.4 Valores propuestos

| Calidad | `n` (flujo y tope) | `h` (vida) | `d` (daño) | `s` (velocidad) | `x` (recompensa) |
|---|---|---|---|---|---|
| ALTA | 1,00 | 1,000 | 1,00 | 1,00 | 1,00 |
| MEDIA | 0,90 | 1,083 | 1,05 | 1,03 | 1,08 |
| BAJA | 0,75 | 1,250 | 1,10 | 1,08 | 1,22 |

En BAJA: se generan un 25 % menos de enemigos (en la práctica mueren entre un 14 y un 18 % menos), cada uno aguanta un 25 % más, pega un 10 % más, corre un 8 % más y deja un 22 % más de XP, Ceniza y probabilidad de botín. La velocidad máxima de un normal (Perro, 125 px/s, minuto 9) pasa de 134 a 145 px/s, el 76 % de la del jugador (190).

Procedencia de cada valor:
- `n`: los de hoy (`enemyMul`), no se tocan. Decisión 3 de la sección 9.
- `h`: fórmula de 4.3 con `kh = 0,75`. Supuesto, sin calibrar todavía.
- `s`: elegido ("un poco"). Sin calibrar.
- `x`: medido (4.5).
- `d`: BAJA acotado por medición entre 1,08 y 1,15 (4.5); 1,10 es interpolación, no un valor medido. MEDIA 1,05 medido sin diferencia detectable.

### 4.5 Primera calibración (medida)

Mismo bot y método que en 4.1. El perfil se emuló con parches en caliente equivalentes a la sección 7. Cada fila se compara con la fila ALTA de 4.1 del mismo régimen.

| Régimen | Perfil | n | Bajas | Nivel final | Nivel al minuto 5 | Ceniza | Daño recibido |
|---|---|---|---|---|---|---|---|
| Normal | ALTA | 12 | 843 +- 30 | 11,3 +- 0,2 | 8,9 +- 0,1 | 1133 +- 40 | 1888 +- 168 |
| Normal | BAJA con `x = 1,333`, `d = 1,15` | 12 | 694 +- 24 | 12,0 +- 0,2 | 9,0 +- 0,1 | 1261 +- 71 | 1938 +- 201 |
| Normal | BAJA con `x = 1,215`, `d = 1,08` | 12 | 725 +- 23 | 11,3 +- 0,3 | 8,3 +- 0,1 | 1149 +- 28 | 1676 +- 179 |
| Normal | MEDIA con `x = 1,111`, `d = 1,05` | 12 | 782 +- 25 | 11,8 +- 0,3 | 9,1 +- 0,1 | 1216 +- 42 | 1890 +- 161 |
| Normal | MEDIA con `x = 1,08`, `d = 1,05` | 12 | 794 +- 33 | 11,5 +- 0,4 | 8,8 +- 0,2 | 1204 +- 50 | 1830 +- 224 |
| Saturado | ALTA | 6 | 674 +- 66 | 9,8 +- 0,5 | 7,8 +- 0,5 | 845 +- 84 | 2996 +- 60 |
| Saturado | BAJA con `x = 1,333`, `d = 1,15` | 6 | 478 +- 43 | 9,3 +- 0,4 | 7,3 +- 0,3 | 813 +- 69 | 3645 +- 45 |
| Saturado | BAJA con `x = 1,215`, `d = 1,08` | 6 | 574 +- 56 | 9,7 +- 0,5 | 7,7 +- 0,4 | 875 +- 80 | 3098 +- 129 |
| Saturado | MEDIA con `x = 1,111`, `d = 1,05` | 6 | 603 +- 68 | 9,5 +- 0,6 | 7,3 +- 0,5 | 845 +- 91 | 3010 +- 114 |

Qué es resultado y qué no:
- **Resultado**: `x = 1/n` sobrecompensa. En BAJA daba +0,7 niveles (unos 2 errores estándar) y +11 % de Ceniza. Con `x = 1,215` el nivel final (11,3 frente a 11,3) y la Ceniza (+1,5 %) quedan iguales en los dos regímenes.
- **Resultado**: en saturado, `d = 1,15` sube el daño recibido un 22 % (3645 frente a 2996, más de 8 errores estándar): fuera del objetivo Q2. Con `d = 1,08` queda en +3 % +- 5 %.
- **No es resultado**: el daño recibido en régimen normal. Su desviación entre semillas es del 31 %, y con n = 12 el error de una diferencia es del 13 %; ni el +3 % de `d = 1,15` ni el -11 % de `d = 1,08` se distinguen de cero. Por eso `d` de BAJA queda acotado, no fijado.
- **A vigilar**: con `x = 1,215` BAJA va 0,6 niveles por detrás al minuto 5 (8,3 frente a 8,9, unos 4 errores estándar) y lo recupera al final. Es un arranque algo más lento, en la dirección difícil.
- En MEDIA ninguna diferencia supera 1,5 errores estándar.
- Todo esto es un bioma (bosque), un bot torpe de guion y sin muerte. Ordena opciones; no sustituye al banco de T-F2-01 ni al playtest.

Perillas de exploración (con `?dev=1`, antes de fijar valores): `?dn=`, `?dh=`, `?dd=`, `?ds=`, `?dx=` sobrescriben el perfil; `?dq=alta|media|baja` fuerza el perfil sin cambiar los gráficos (permite medir BAJA en un PC con gráficos ALTA y aislar reglas de rendimiento).

### 4.6 Cambio de calidad a mitad de partida

**Propuesta: el perfil se fija al empezar la expedición** (`G.startGame`), a partir de la calidad vigente en ese momento, y no cambia hasta la siguiente.

- Si la calidad automática baja en mitad de la partida, cambian solo los gráficos (resolución, partículas, niebla); las reglas siguen. La siguiente expedición ya empieza con el perfil nuevo (`qlast` se guarda, `src/mobile.js:74`).
- Si el jugador cambia la calidad a mano en la pausa, igual: efecto en reglas desde la siguiente expedición. El menú debe decirlo ("se aplica a los enemigos en la próxima expedición").
- El perfil se guarda en el resumen de la partida (`G.D.id`), para récords, reto diario y analítica.
- Coste: una expedición que empieza en MEDIA y cae a BAJA termina con el número de enemigos de MEDIA (como mucho 9 minutos).

Alternativa descartada por ahora: aplicar el perfil nuevo a los enemigos que nacen después del cambio. Mantiene mejor los fps, pero mezcla dos reglas en una partida, hace que el resultado dependa de cuándo cayeron los fps y complica récords y reto diario. Si T-F2-07 demuestra que los fps no aguantan, se revisa.

### 4.7 Proyectiles

`projCap` deja de depender de la calidad para las reglas: un único valor de regla (`G.B.projCap = 400` enemigos, `600` jugador, los de ALTA hoy). Con menos enemigos hay menos proyectiles de por sí. Medido: en expediciones normales el máximo simultáneo fue 18 a 27, así que el cambio no altera nada en juego real. **Pendiente de medir**: el peor caso artificial (cráter, enjambre 110, 4 poderes), que es donde 150 / 225 podría actuar; si actúa, quitarlo sube el coste de dibujo y lo valida T-F2-07.

### 4.8 Jefes, minijefes y esbirros

- **Jefes** (`boss.js` y `boss_*.js`): nada. Vida, daño, telegrafías y `PELIGRO` iguales en todas las calidades. Los objetivos 50/40/30/20/10 % dependen sobre todo de la pelea de jefe y no deben moverse por calidad.
- **Minijefes y guardianes** (`elite`, `G.Minis`): nada.
- **Esbirros invocados por un jefe o minijefe** (larvas de la Madre Colmena, invocaciones de ataque): nada; son parte del patrón.
- **Normales que el director sigue enviando con el jefe vivo** (`G.Boss.spawnMode()`, tipos ligeros): llevan el perfil, con `n` aplicado a `bm.cap` y a `bm.mul` como hoy se aplica `enemyMul` a `bm.cap`.
- **Cacería y práctica** (`huntUpdate`, 3 gusanos cada 25 s): sin perfil (no hay horda que compensar).

### 4.9 Efectos que cuentan bajas

Con menos bajas, todo lo que se dispara "por baja" rinde menos y haría MEDIA y BAJA más difíciles por una vía no buscada. Inventario (enemigos con perfil; los demás, factor 1):

| Sitio | Qué hace hoy | Con perfil |
|---|---|---|
| `src/combat.js:334` | gema de XP de valor `d.xp` | valor por `x` |
| `src/combat.js:336` | gusano, arquero y bomba: 50 % de soltar 2 de Ceniza | probabilidad por `x` |
| `src/combat.js:337` | resto: gema de Ceniza de valor `d.ash` | valor por `x`, con el resto fraccionario acumulado en un contador de la partida (no redondear cada gema: `src/combat.js:394` redondea al recoger y sesgaría) |
| `src/combat.js:338` | corazón con probabilidad `B.player.heartP` | probabilidad por `x` |
| `src/loot.js:199` | pieza de botín con probabilidad `d[1] * DROP_MUL * dur().parts` | probabilidad por `x` (tope 1) |
| `src/combat.js:183` | Colmillo: cura con probabilidad `B.heal.chance` por baja | probabilidad por `x` |
| `src/combat.js:361` | Pacto ardiente: ídem con bajas de Fuego | probabilidad por `x` |
| `src/combat.js:363` | Sangre envenenada: cura cada 15 bajas | sumar `x` por baja y curar al cruzar cada múltiplo de 15 |
| `src/armor.js:91-92` | sets Pantano (cura por baja envenenada, con enfriamiento de 20 s) y Reina (escudo cada 20 bajas) | Reina: sumar `x`; Pantano no cambia (lo limita el enfriamiento) |
| `src/quests.js:192` | progreso de encargos por baja | sumar `x` y contar la parte entera |
| `src/loot.js:183` | `R.kills[t]` del resumen | número real |
| `src/enemies.js:162`, `src/hud.js:111` | `G.kills` en pantalla | número real |

En la emulación solo se escalaron las cinco primeras filas; el resto no se ha medido.

---

## 5. Plan de medición con bots (equivalencia ALTA / MEDIA / BAJA)

Requisito previo: sección 3 implementada (sin reproducibilidad el ruido entre lotes iguales tapa efectos del 5 al 8 %).

Todo por pasos (`?speed=0`, `G.step()`), con `?dq=` para aislar reglas de rendimiento, semillas 1..N iguales en las tres calidades.

| Fase | Qué | Bot | n | Métricas | Aceptación |
|---|---|---|---|---|---|
| A | Economía | guion fijo, `god=1` | 50 semillas por calidad, 6 biomas, hasta el jefe | XP total, nivel al minuto 3 / 5 / 7, Ceniza, piezas de botín | MEDIA y BAJA dentro de +-5 % de ALTA y dentro de 2 errores estándar |
| B | Presión entrante | guion fijo y bot hábil, `god=1&dbg=1`, regímenes normal y saturado | 200 por calidad en normal, 30 en saturado | daño recibido por minuto por fuente, golpes por minuto | entre 1,00 y 1,10 de ALTA |
| C | Capacidad de limpieza | guion fijo, 3 manos (un objetivo, área, mixta) | 20 por mano y calidad | enemigos vivos medios, fracción de tiempo en el tope, bajas * `x` por minuto | vivos / tope dentro de +-0,05 de ALTA en las tres manos; si la mano de área se desvía, ajustar `kh` |
| D | Supervivencia | bot hábil de T-F2-01, `god=0`, sin armadura y con set | 150 por celda (Peligro I, III, V) | victoria, vida mínima, minuto de muerte | victoria: no más de +5 puntos ni menos de -8 respecto a ALTA |

Ruido medido en la primera pasada (desviación entre semillas, bot de guion): bajas 12 %, nivel final 6 %, Ceniza 12 %, daño recibido 31 % en régimen normal y 5 % en saturado. De ahí salen los n: para ver un 5 % de diferencia en daño recibido en régimen normal hacen falta unas 200 corridas por calidad (error de la diferencia 3 %); para bajas y Ceniza bastan 50. Cada corrida de 7:30 tarda unos 25 s por pasos, así que la fase B completa son del orden de 1,5 horas con 3 procesos.

Para la victoria: con n = 150 y una tasa del 30 %, el error estándar es 3,7 puntos y el de una diferencia 5,3; una diferencia menor de 10 puntos entre dos celdas no es un resultado por sí sola, por eso las fases A a C (métricas continuas) deciden los valores y la D solo confirma. Antes de cada fase se corre dos veces el lote de ALTA con semillas distintas para tener el ruido entre lotes iguales.

Orden de ajuste, una perilla cada vez: `x` con la fase A (por bioma, porque depende de cuántos invocados tiene cada familia); `h` con la fase C; `s` fijo; `d` con la fase B; confirmación con D.

---

## 6. Riesgos

| Riesgo | Efecto | Mitigación |
|---|---|---|
| `x` calibrado en un solo bioma | en biomas con muchos invocados la razón de bajas cambia y la economía se desvía | fase A por bioma; `x` puede ser un valor por bioma si hace falta |
| `kh` o `d` mal supuestos | BAJA más fácil o más difícil que ALTA | perillas por URL, fases B y C antes de fijar; ante la duda, quedarse del lado difícil |
| Golpes un 10 % más grandes en BAJA | más muertes por un solo error | es la dirección aceptada por el principio de reto; vigilar "muerte por fuente" en la fase D |
| Perfil fijado al empezar | una partida entera con más enemigos de los que el móvil mueve | `qlast` persistente; T-F2-07 mide fps; alternativa de 4.6 en reserva |
| Quitar `projCap` como regla | más proyectiles dibujados en BAJA | medir el máximo real; recorte solo visual si hace falta |
| Tapar las fugas cambia la secuencia de todas las semillas | las cifras de bots anteriores con `?seed` dejan de ser comparables | rehacer la línea base tras el cambio; anotarlo en el README |
| Reproducibilidad solo por navegador | un reto diario verificado en servidor no podría reproducir la partida | fuera de alcance; anotado |
| Menos enemigos cambia la sensación de enjambre | BAJA se siente menos "survivors" | es la decisión del dueño; el playtest en móvil decide si `n = 0,75` es aceptable |

Sobre el reto: respecto a la BAJA de hoy, la propuesta no baja la dificultad en ninguna medición hecha. En régimen saturado sube el daño recibido entre un 3 y un 22 % según `d` y devuelve la progresión que el tope quitaba. En régimen normal, donde hoy BAJA es idéntica a ALTA, la primera pasada no distingue el daño recibido de cero y no puedo descartar todavía que quede hasta un 10 % por debajo: es lo que la fase B tiene que cerrar antes de fijar `d`. Si saliera por debajo, se sube `d` hacia 1,15; esa decisión no se toma sin la medición.

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
| `src/waves.js` | 144-145: presupuesto `bp * G.D.n` y tope `round(cap * G.D.n)` en lugar de `G.Q.enemyMul` |
| `src/enemies.js` | al nacer un normal (no élite, no jefe, no invocado por jefe o minijefe, no cacería): `hp *= G.D.h`, `dmg *= G.D.d`, velocidad `* G.D.s`, y guardar `e.dx = G.D.x`; 192: usar `G.B.projCap` |
| `src/weapons.js` | 20: usar `G.B.projCap * 1,5` |
| `src/loot.js`, `src/combat.js` | recompensas y efectos por baja multiplicados por `e.dx` (lista de 4.9) |
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
2. **Más daño por golpe en MEDIA y BAJA** (+5 % y +10 %). El dueño dijo "más duros y un poco más rápidos"; el daño no lo mencionó. Sin él, con menos enemigos llegan menos golpes y la presión entrante bajaría cuando los golpes son espaciados (según el modelo, en torno a un 10-19 %; no medido sin `d`).
3. **Magnitud de la reducción**: mantener -10 % y -25 % de enemigos generados, o reducir menos si T-F2-07 muestra que los móviles aguantan. Dato para decidir: hoy el tope no ahorra nada en una expedición normal (18 vivos de media); con el perfil, BAJA baja a 14-15 vivos de media.

## 10. Pendiente de medir

- Fases A a D completas con el banco de T-F2-01 (otros biomas, bot hábil, `god=0`, Peligro I, III y V).
- `d` de BAJA: 200 corridas por calidad en régimen normal (hoy acotado entre 1,08 y 1,15).
- `kh` (vida) con manos de un objetivo, de área y mixtas; `s` no se ha variado.
- Efectos por baja de 4.9 que no entraron en la emulación (curas por baja, encargos, sets).
- Máximo de proyectiles en el peor caso de `perf_bot`.
- Cámara lenta por debajo de 10 fps (inferida del código, sin medir).
- fps reales en móvil con el perfil fijado al empezar (T-F2-07).

## 11. Cómo se midió (para repetirlo)

- Copia fija del juego con `git archive d740894` servida con `tools/serve.py`; Chromium de Playwright vía `tools/lib/browser.js`, vista 844x390 táctil salvo donde se indica escritorio.
- Los bots de `tools/` necesitan ya `dev=1` en la URL para `hand`, `actives`, `speed`, `cmul`, `reset` y `all`.
- El arnés (entradas por tick, hash, parches en caliente) no está en el repo; la prueba `seed` de la sección 3.5 y el banco de T-F2-01 deben absorber lo que haga falta de él. Punto clave a conservar: los ticks se cuentan como `round(G.time / G.STEP)` desde el inicio de la expedición, nunca desde que se instala el bot.

---

## 12. Implementación de la parte 2 (2026-11-14) y medición posterior

### 12.1 Qué se hizo

- Tabla única `G.B.diff` en `src/main.js`, perfil `G.D = G.diffProfile(G.Q.level)` en `G.startGame` (fijado al empezar la expedición). Perillas con `?dev=1` (en `CLOSED` de `src/dev.js`): `?dq=` y `?dn ?dh ?dd ?ds ?dx`.
- `enemyMul` y `projCap` fuera de `LV` (`src/mobile.js`); `G.B.projCap = 400` (enemigos; jugador 1,5 veces) como regla común (`enemies.js`, `weapons.js`).
- `waves.js`: presupuesto por pulso `* G.D.n` y tope `round(cap * G.D.n)` (también con el jefe vivo, sobre `bm.mul` y `bm.cap`).
- `enemies.js`: al nacer, un normal del director en modo `run` (no jefe, no élite, no `summoned`, no `noprof`, no Asalto) lleva `hp * h`, `dmg * d`, `e.dRew = x` y `e.dSpd = s`; `update` multiplica solo el desplazamiento (`speedMul * dSpd`). La escolta de minijefes (`waves.js`, `minis.js`) nace con `noprof`.
- Recompensas por `e.dRew`: XP y Ceniza (con resto en `G.D.ashAcc`), corazón, 50 % de Ceniza del gusano/arquero/bomba, botín y botín "huésped" (`loot.js`, tope 1), Colmillo, Pacto ardiente, Sangre envenenada (contador que suma `x` y cura al cruzar cada múltiplo de 15), escudo del set Reina (ídem cada 20), encargos (`G.D.questAcc`). `G.kills` y `R.kills` cuentan bajas reales. Pantano no cambia. La probabilidad de Esencia por pity no se escala (no está en el inventario 4.9).
- `G.D.id` en `G.Loot.summary.diff`; el perfil entra en el hash de `seed`.
- ALTA exacta: todos los factores valen 1 (multiplicación exacta) y los acumuladores solo actúan con `x != 1`. Comprobado: hash con semilla 1234 en los ticks 600, 1800 y 3600 idéntico al del commit anterior (3569930420, 1065409925, 1194979460); prueba `diff`.
- Pruebas nuevas, grupo `diff` de `tools/card-swarm-bot/tests.js`: perfil fijado y estable ante `setQuality`, siguiente expedición cambia; tabla; perillas (y que sin `dev=1` se ignoran); multiplicadores en gusano y jabalí y ausencia en minijefe, jefe, invocado, escolta y cacería; velocidad; XP y Ceniza de 100 bajas; presupuesto y tope; ALTA idéntica. `seed` mezcla `G.D` en el hash (ALTA, MEDIA y BAJA con semilla).
- La prueba "enemyMul / projCap por calidad" del punto 10 de la sección 8 no existía (grep sin resultados): no hubo nada que adaptar.

### 12.2 Medición posterior a la implementación (sin retocar valores)

`node tools/card-swarm-bot/diff_bot.js 8 both bosque`: bosque, semillas 1 a 8 iguales en las tres calidades, por pasos, hasta el jefe (7:30), bot de guion (movimiento por tick, primera oferta de cada nivel, `god=0` con la vida repuesta cada tick, por tanto con la invulnerabilidad normal de 600 ms), `dbg=1`. Valores por defecto de la tabla. Media +- error estándar, n = 8 por celda.

| Régimen | Calidad | Bajas | Nivel final | Nivel min 5 | Ceniza | Daño recibido |
|---|---|---|---|---|---|---|
| Normal | ALTA | 1078 +- 5 | 13,0 +- 0,0 | 8,9 +- 0,1 | 1816 +- 164 | 410 +- 65 |
| Normal | MEDIA | 976 +- 7 | 13,6 +- 0,3 | 8,6 +- 0,3 | 2112 +- 150 | 426 +- 56 |
| Normal | BAJA | 834 +- 14 | 13,3 +- 0,3 | 8,4 +- 0,3 | 1776 +- 160 | 545 +- 177 |
| Saturado (`cmul=1`) | ALTA | 940 +- 14 | 13,0 +- 0,2 | 9,0 +- 0,3 | 1729 +- 151 | 1656 +- 183 |
| Saturado | MEDIA | 890 +- 14 | 13,0 +- 0,3 | 8,9 +- 0,3 | 1388 +- 123 | 1614 +- 122 |
| Saturado | BAJA | 792 +- 8 | 12,1 +- 0,1 | 8,1 +- 0,2 | 1462 +- 95 | 1400 +- 120 |

Lectura (sin ajustar nada; la calibración es del diseñador de balance):
- Bajas reales: MEDIA 0,91 y BAJA 0,77 de ALTA en normal; 0,95 y 0,84 en saturado. Es lo esperado (n 0,90 y 0,75, un poco más por el director).
- Nivel final y Ceniza: en régimen normal MEDIA y BAJA quedan dentro de unos 2 errores estándar de ALTA (Ceniza de MEDIA +16 %, 1,3 errores estándar de la diferencia aproximadamente). En saturado BAJA queda 0,9 niveles y un 15 % de Ceniza por debajo y MEDIA un 20 % de Ceniza por debajo: la compensación `x` no basta en saturado en este bot.
- Daño recibido: normal, +4 % MEDIA y +33 % BAJA con un error de +-30 % (no distinguible de cero). Saturado: -2 % MEDIA y -15 % BAJA (unos 1,2 errores estándar de la diferencia en BAJA): el daño extra por golpe no compensa en ese régimen en esta medición, contrario a lo que daba la emulación de 4.5 (+3 % con `d` 1,08).
- Las cifras de daño recibido no son comparables con las de 4.1 y 4.5 (aquí unos 410 frente a 1888): otro bot, y la pérdida de reproducibilidad de la parte 1 cambió las semillas. Solo valen las comparaciones entre filas de esta tabla.
- Alcance: un bioma, un bot de guion, sin muerte; no sustituye a las fases A a D de la sección 5.
