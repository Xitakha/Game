# Calibración de los kits semanales y del reto diario (Swarm Hand)

Autor: balance-designer. Estado: **cerrado** (fases A-D medidas con bot; fase E, humano, pendiente). Unas 6.800 partidas en total.

Resumen: con las reglas r1 el bot hábil sacaba Oro el 54 % de los días (objetivo 25-35 %), con biomas del 29 % al 80 %. **Aplicado r2** (Peligro del día por bioma y fuera "Dos etiquetas", que facilita): **35 % (IC95 29-42) en los mismos 200 días**, con todos los biomas entre el 22 % y el 41 %. Las diferencias entre kits (unos 35 puntos) **no se resuelven** con palancas de potencia (medido) y quedan para el dueño (sección 8).
Referencia de diseño: `games/card-swarm/DESIGN-v10-retencion.md`, 1.10.6 (plan) y 8.1 (lo que quedó sin calibrar).

## 1. Objetivos medibles

Metas del dueño para un jugador competente: Peligro I/II/III/IV/V = 50/40/30/20/10 % de victorias. Para el reto (1.10.6):

| Qué | Objetivo | Tolerancia |
|---|---|---|
| Kit en su bioma, **sin mutadores** | II 45 %, III 35 %, IV 25 % de Oro | +-7 puntos por bioma (media de los 8 kits) |
| Kit con los mutadores del día | II 40 %, III 30 %, IV 20 % | +-7 puntos |
| Entre kits en la misma celda | sin kit dominante ni inútil | media por kit (5 biomas, n=240) dentro de +-10 puntos de la media general; ninguna celda kit x bioma por debajo del 10 % ni por encima del 60 % en Peligro III (criterio de salida de 1.10.6) |
| Mutadores | ninguno facilita | Oro con mutador <= Oro sin mutador (diferencia no positiva fuera del ruido) |
| Reto diario real (reglas del día) | Oro 25-35 % de los días | - |

Supuesto (no medido): el **bot hábil** sustituye al jugador competente (lo dice T-F2-01). Sus cifras **ordenan** kits y biomas; el valor absoluto hay que contrastarlo con el dueño en móvil (fase E).

## 2. Método

- **Herramienta nueva** `tools/card-swarm-bot/kit_bot.js` (opciones `KIT=` y `BIOME=` pedidas en 8.1, más `PEL=`, `MUT=`, `Q=`, `N=`, `SEED=`, `DAILY=1`, `KITPOW=`, `KITNODES=`). Juega el reto por pasos (`?speed=0`, `G.step()`), sin reloj real, así que **es reproducible bit a bit**: dos lotes iguales dan el mismo CSV (comprobado con 4 partidas sin y con esquiva de jefe; `diff` vacío). El ruido que queda es solo el de muestreo (binomial); por eso doy intervalos de Wilson al 95 %.
- **Bot hábil**: en la horda, la política de `play_bot.js` (repulsión de enemigos y proyectiles, recoge gemas sin peligro, prioriza fusiones, poderes en AUTO) decidida cada 5 ticks (83 ms). En la pelea con el jefe, el esquivador de telegrafías `dodge_fusion.js` (reacción 250 ms, 10 % de decisiones erróneas, azar sembrado). Sin inmortalidad (el reto la quita siempre; `G.god` no se ha tocado).
- **Celda**: kit, bioma, Peligro y mutadores forzados; la partida i usa el i-ésimo día (desde el día 20000+SEED) cuyo bioma es el de la celda y que no trae "Dos etiquetas". Ese día fija la semilla de la simulación y las 2 etiquetas de acompañamiento (con R4 y R6 aplicadas), así que la muestra recorre la variedad real de barajas.
- Calidad ALTA salvo que se diga. Perfil de dispositivo por `?dq=`.
- Análisis: `python3 tools/card-swarm-bot/calib/analiza.py <csv> [--metric won|m1|m2]`. Datos y registros en `tools/card-swarm-bot/calib/`.
- Hallazgo de método: **sin la esquiva de telegrafías el bot casi nunca gana** (Fragua 0/48 en Bosque, Cripta, Asfódelo y Tundra; 3 % en total con 353 partidas, `calib/explor_A_sinEsquivaJefe.csv`): llega al jefe pero solo le quita un 10-40 %. Con el suelo en 0 % no se puede comparar nada; por eso el bot hábil usa `dodge_fusion.js` en la pelea.

Reproducir la fase A (unos 95 min con 4 núcleos):
```
python3 tools/serve.py card-swarm 8891 &      # cerrar por PID
KIT=all BIOME=all PEL=3 N=48 SEED=1 PAR=4 OUT=tools/card-swarm-bot/calib/faseA_P3_alta.csv node tools/card-swarm-bot/kit_bot.js http://localhost:8891
python3 tools/card-swarm-bot/calib/analiza.py tools/card-swarm-bot/calib/faseA_P3_alta.csv
```

## 3. Fase A: 8 kits x 5 biomas, Peligro III, sin mutadores, ALTA (n=48 por celda, 1.920 partidas, 0 errores de consola)

% de Oro (victoria) e IC95. Objetivo: 35 +-7.

| kit \ bioma | Bosque | Cripta | Asfódelo | Tundra | Panal | total (n=240) |
|---|---|---|---|---|---|---|
| fragua | 33 (22-47) | 83 (70-91) | 69 (55-80) | 77 (63-87) | 85 (73-93) | **70** (63-75) |
| ventisca | **10** (5-22) | 79 (66-88) | **10** (5-22) | 44 (31-58) | 42 (29-56) | **37** (31-43) |
| pantano | 48 (34-62) | 75 (61-85) | 23 (13-37) | 62 (48-75) | 42 (29-56) | 50 (44-56) |
| carmesi | 46 (33-60) | **100** (93-100) | 42 (29-56) | 71 (57-82) | 79 (66-88) | **68** (61-73) |
| lana | 29 (18-43) | 88 (75-94) | 56 (42-69) | 69 (55-80) | 69 (55-80) | 62 (56-68) |
| tempestad | 21 (12-34) | 92 (80-97) | 38 (25-52) | 44 (31-58) | 60 (46-73) | 51 (45-57) |
| alquimia | 35 (23-50) | 60 (46-73) | **6** (2-17) | 65 (50-77) | 23 (13-37) | **38** (32-44) |
| hogar | 50 (36-64) | 88 (75-94) | 60 (46-73) | 69 (55-80) | 73 (59-83) | **68** (62-74) |
| **media del bioma** (n=384) | **34** (30-39) | **83** (79-86) | **38** (33-43) | **62** (58-67) | **59** (54-64) | **55** (53-58) |

Llegar al jefe (Bronce o más): Bosque 66 %, Asfódelo 85 %, Cripta, Tundra y Panal 100 %. En el Bosque cuatro kits (Fragua, Ventisca, Lana, Tempestad) solo llegan al jefe un 42-48 % de las veces, frente al 73-98 % de Pantano, Carmesí, Alquimia y Hogar: el tramo de 6 PF y la armadura T1 +0 dejan la horda del Bosque en Peligro III muy dura para los kits sin control ni cura.

**Lectura (medido):**
1. **El reto en Peligro III es más fácil de lo previsto para el bot hábil**: 55 % de Oro frente al 35 % de meta. Bosque (34 %) y Asfódelo (38 %) están en objetivo; **Cripta (83 %), Tundra (62 %) y Panal (59 %) quedan muy por encima**, con intervalos que no tocan la meta.
2. **Hay kits dominantes y kits flojos**: la media por kit va del 37 % (Ventisca) y el 38 % (Alquimia) al 68-70 % (Carmesí, Hogar, Fragua). Son 33 puntos, con intervalos que no se solapan: no es ruido. El criterio de 1.10.6 (10 puntos) no se cumple.
3. **Celdas fuera del criterio de salida (10-60 % en Peligro III)**: por debajo, Alquimia en Asfódelo (6 %), Ventisca en Bosque (10 %) y en Asfódelo (10 %); por encima, 20 de las 40 celdas (todas las de la Cripta, la mayoría de las de Tundra y Panal y Fragua en Asfódelo).

## 4. Palancas y exploración

Orden de 1.10.6: (1) tramo de PF y potencia por bioma (`G.Kit.POWER`), (2) nodos del último tramo de cada kit, (3) refuerzo de la armadura nivelada, (4) pesos de los mutadores. No se toca ningún número de combate.

Plan inicial (resultado en 4.1-4.2b y 5.4):
- Biomas demasiado fáciles (Cripta, Tundra, Panal): **bajar la potencia del kit** (refuerzo +1 -> +0 y, si no basta, menos PF). Esto sube la dificultad: cumple la regla del estudio.
- Kits dominantes (Fragua, Carmesí, Hogar): quitar o cambiar el nodo más fuerte de sus tramos.
- Kits flojos en celdas concretas (Ventisca en Bosque y Asfódelo, Alquimia en Asfódelo): aquí cualquier cambio **baja la dificultad en esas celdas**. Solo se propone si la medición lo justifica (criterio "ningún kit inútil", piso del 10 %) y queda marcado como decisión del dueño.

### 4.1 Potencia de la Cripta (palancas 1 y 3)

Cripta, Peligro III, sin mutadores, mismas semillas que la fase A (`calib/exp_cripta.sh`):

| Potencia del kit en la Cripta | n | Oro | IC95 |
|---|---|---|---|
| T2 +1, 9 PF (actual; mismas 192 semillas de la fase A) | 192 | 83 % | 77-87 |
| T2 **+0**, 9 PF | 192 | 82 % | 76-87 |
| T2 +0, **6 PF** | 192 | 75 % | 68-81 |

Comparación por pares (misma semilla): +0 gana 18 partidas que la base pierde y pierde 20 que la base gana (sin diferencia); +0 y 6 PF, 16 frente a 31 (McNemar p ~ 0,04: baja unos 8 puntos). Medido: quitar el refuerzo (DEF 20,7 -> 18) no cambia nada; quitar 3 PF baja 8 puntos. La potencia del kit casi no mueve el resultado en la Cripta: el bot llega siempre al jefe y Karceron en Peligro III cae ante casi cualquier kit (todos los kits traen Hielo o Rayo, o los recibe por R6, y Karceron es débil a los dos). **Conclusión: con las palancas del kit no se puede llevar la Cripta del 83 % al 35 %** sin desmontar el kit (dejarlo con menos PF que el Bosque). La palanca que sí actúa sobre todos los kits a la vez es el **Peligro del día** (sección 5).

### 4.2 Plato de los kits dominantes (palanca 2 bis)

Carmesí y Hogar con Té de brasas (+10 % XP) en vez de Sopa de hebra (+0,25 HP/s), P III, 5 biomas, n=24 por bioma, mismas semillas (`calib/exp_plato_te.csv`):

| kit | Sopa (fase A, mismas 120 semillas) | Té | partidas que solo gana la Sopa / solo el Té |
|---|---|---|---|
| Carmesí | 69 % | 62 % | 24 / 15 (McNemar p ~ 0,2: **no es un resultado**) |
| Hogar | 69 % | 68 % | 16 / 14 (sin diferencia) |

Segundo lote (`calib/exp_plato2.csv`, 5 biomas, n=24 por bioma, pares):

| kit | cambio | base | variante | solo base / solo variante | p |
|---|---|---|---|---|---|
| Fragua | Caldo -> Té | 72 % | 72 % | 13 / 13 | 1,0 |
| Ventisca | Pan -> Asado (-15 % daño de jefes) | 41 % | 48 % | 13 / 22 | 0,18 |
| Alquimia | Estofado -> Asado | 38 % | 43 % | 5 / 10 (n=92) | 0,30 |

Medido: el plato apenas mueve la victoria (diferencias de 0-8 puntos, ninguna fuera del ruido). No se propone cambiarlo.

### 4.2b PF del árbol por kit (palanca 1 por kit)

-3 PF en todos los biomas a los kits fuertes y +3 PF a los flojos, P III, 5 biomas, n=16 por bioma, pares (`calib/exp_pf_kit.csv`):

| kit | cambio | base | variante | solo base / solo variante | p |
|---|---|---|---|---|---|
| Fragua | -3 PF | 75 % | 72 % | 6 / 4 | 0,75 |
| Carmesí | -3 PF | 75 % | 70 % | 8 / 4 | 0,39 |
| Hogar | -3 PF | 68 % | 60 % | 13 / 7 | 0,26 |
| Lana | -3 PF | 58 % | 59 % | 4 / 5 | 1,0 |
| Ventisca | +3 PF | 44 % | 41 % | 4 / 2 | 0,69 |
| Alquimia | +3 PF | 38 % | 39 % | 7 / 8 | 1,0 |
| Tempestad | +3 PF | 46 % | 49 % | 2 / 4 (n=71) | 0,69 |

Medido: **3 PF arriba o abajo no cambian la victoria de ningún kit** (todas las diferencias dentro del ruido). Tampoco el refuerzo de la armadura (4.1) ni el plato (4.2). Con el bot hábil, la potencia del kit (DEF, nodos, plato) pesa poco frente a la pelea con el jefe; lo que separa a los kits es su identidad (etiquetas, fusión firma, set). Comprobé si la diferencia la explica el cruce de etiquetas del kit con las debilidades y resistencias del jefe: no (Oro medio por "debilidades - resistencias" de -1 a +2: 57 / 56 / 59 / 46 % en P III, sin tendencia).

### 4.3 Calidades MEDIA y BAJA (Fragua y Pantano, 5 biomas, P III, n=24 por kit y bioma, pares con ALTA)

| bioma | ALTA | MEDIA | BAJA |
|---|---|---|---|
| Bosque | 46 % | 44 % (9 / 8) | 31 % (16 / 9, p = 0,23) |
| Cripta | 77 % | 79 % | 81 % |
| Asfódelo | 42 % | 44 % | 50 % (6 / 10) |
| Tundra | 79 % | 73 % | 84 % (n=25) |
| Panal | 69 % | 65 % | 88 % (n=24, base de esas semillas 88 %) |
| total (n=240) | 63 % | 61 % | 62 % (Fragua 72 -> 74, Pantano 49 -> 42) |

Medido: con el perfil `G.D` de MEDIA y BAJA el reto queda igual de difícil para el bot que en ALTA (ninguna diferencia fuera del ruido; la mayor, Bosque en BAJA, -15 puntos con p = 0,23). No hace falta ajustar nada por calidad. Lo que no se mide aquí: los fps reales de un móvil lento con `marea` (es trabajo de rendimiento).

## 5. Fase B (Peligro IV) y reto diario real

### 5.1 Peligro IV, sin mutadores (n=16 por celda, 640 partidas, `calib/faseB_P4_alta.csv`)

Objetivo: 25 +-7.

| kit \ bioma | Bosque | Cripta | Asfódelo | Tundra | Panal | total (n=80) |
|---|---|---|---|---|---|---|
| fragua | 12 | 25 | 19 | 75 | 62 | **39** (29-50) |
| ventisca | 6 | 44 | 0 | 12 | 6 | **14** (8-23) |
| pantano | 12 | 12 | 0 | 38 | 31 | 19 (12-29) |
| carmesi | 25 | 75 | 0 | 38 | 62 | **40** (30-51) |
| lana | 6 | 62 | 12 | 25 | 50 | 31 (22-42) |
| tempestad | 6 | 31 | 0 | 12 | 19 | **14** (8-23) |
| alquimia | 12 | 19 | 0 | 25 | 19 | **15** (9-24) |
| hogar | 19 | 31 | 0 | 50 | 56 | 31 (22-42) |
| **media** (n=128) | **12** (8-19) | **38** (30-46) | **4** (2-9) | **34** (27-43) | **38** (30-47) | **25** (22-29) |

Con n=16 cada celda tiene un IC95 de unos +-20 puntos: solo leo medias por kit y por bioma. Medido: **Peligro IV es la palanca fuerte** (de III a IV la media cae de 55 % a 25 %; la Cripta, de 83 % a 38 %). El orden de los kits se mantiene: Fragua y Carmesí arriba, Ventisca, Tempestad y Alquimia abajo.

### 5.1b Peligro II, sin mutadores (n=16 por celda, 640 partidas, `calib/faseB_P2_alta.csv`)

Objetivo: 45 +-7. Media 65 % (62-69). Por bioma: Bosque 40, Cripta 90, Asfódelo 54, Tundra 73, Panal 70. Por kit: Fragua 75, Carmesí 76, Hogar 70, Lana 69, Pantano 60, Alquimia 60, Tempestad 58, Ventisca 55.

### 5.1c Resumen de la escala de Peligro (media de los 8 kits, sin mutadores)

| bioma | II | III | IV |
|---|---|---|---|
| Bosque | 40 | 34 | 12 |
| Cripta | 90 | 83 | 38 |
| Asfódelo | 54 | 38 | 4 |
| Tundra | 73 | 62 | 34 |
| Panal | 70 | 59 | 38 |
| **media** | **65** (meta 45) | **55** (meta 35) | **25** (meta 25) |

Medido: de II a III el bot pierde solo 10 puntos y de III a IV, 30. En II y III el reto es unos 20 puntos más fácil que la meta; en IV está en la meta. Los biomas no son comparables con el mismo Peligro: la Cripta en IV (38 %) vale lo que el Bosque o el Asfódelo en III (34-38 %).

### 5.2 Reto diario real con las reglas r1 (antes del cambio; k1): 200 días seguidos (días 20401-20600), ALTA (`DAILY=1`, `calib/reto_real_r1.csv`)

Reglas tal cual: bioma, Peligro (35/45/20), mutadores, kit de la semana y baraja del día; cuenta con todo abierto.

| | n | Oro | IC95 | Bronce+ | Plata+ |
|---|---|---|---|---|---|
| **todos los días** | 200 | **54 %** | 48-61 | 90 % | 86 % |
| Peligro II | 68 | 65 % | 53-75 | 90 % | 90 % |
| Peligro III | 97 | 53 % | 43-62 | 89 % | 85 % |
| Peligro IV | 35 | 40 % | 26-56 | 94 % | 80 % |
| Bosque / Asfódelo | 32 / 45 | 31 % / 29 % | | 66 % / 80 % | |
| Cripta / Tundra / Panal | 51 / 47 / 25 | 80 % / 53 % / 80 % | | 100 % | |

**Medido: con las reglas actuales el bot hábil saca Oro el 54 % de los días** (objetivo 25-35 %; el intervalo entero queda por encima). El reto diario, tal como está, no es el desafío que pide el diseño: el problema no es un kit, es el reparto de Peligro y la diferencia entre biomas.

### 5.3 Los mutadores en el reto real

Con las celdas de las fases A y B (kit x bioma x Peligro, sin mutadores) se predice el Oro de cada uno de los 200 días medidos: **54,7 % esperado sin mutadores frente a 54,5 % real con ellos**. El modelo acierta el total (valida que las fases A-B describen el reto) y dice que **los mutadores del día, en conjunto, no quitan victorias al bot**: la pelea con el jefe decide y casi todos los mutadores tocan la horda. Detalle por mutador en la fase C (sección 6).

### 5.4 Cambio aplicado: Peligro del día por bioma (reglas r2)

Como la potencia del kit casi no mueve el resultado (4.1, 4.2, 4.2b) y los mutadores en conjunto tampoco (5.3), la palanca que queda para que el reto sea un reto es el **Peligro del día**. Con el mismo Peligro los biomas no se parecen, así que la tabla depende del bioma (la misma tirada en la misma posición; solo cambia cómo se traduce, así que el número y el orden de tiradas no cambian):

| bioma | r1 (II / III / IV) | **r2** (II / III / IV) | Oro del bot sin mutadores, modelo fases A-B: r1 -> r2 |
|---|---|---|---|
| Bosque | 35 / 45 / 20 | 0 / 70 / 30 | 32 -> **28 %** |
| Cripta | 35 / 45 / 20 | 0 / 0 / 100 | 76 -> **38 %** |
| Asfódelo | 35 / 45 / 20 | 0 / 90 / 10 | 37 -> **35 %** |
| Tundra | 35 / 45 / 20 | 0 / 0 / 100 | 61 -> **34 %** |
| Panal | 35 / 45 / 20 | 0 / 0 / 100 | 59 -> **38 %** |
| **media** | | | **53 -> 34 %** (objetivo 25-35 %) |

Se mantienen: nunca Peligro I ni V; la excepción de novato (Peligro II como máximo si nunca has vencido a ese jefe); el presupuesto de mutadores por Peligro (2 / 1,5 / 1). Además r2 saca del MVP el mutador "Dos etiquetas" porque facilita (sección 6).

### 5.5 Validación directa de r2: los mismos 200 días (20401-20600), ALTA (`calib/reto_real_r2.csv`)

| | r1 (antes) | **r2 (aplicado)** |
|---|---|---|
| **Oro, todos los días** (n=200) | 54 % (48-61) | **35 % (29-42)** |
| Bronce+ / Plata+ | 90 % / 86 % | 92 % / 84 % |
| Bosque / Cripta / Asfódelo / Tundra / Panal | 31 / 80 / 29 / 53 / 80 % | 22 / 38 / 39 / 41 / 32 % |
| Peligro III / IV (n) | 53 % (97) / 40 % (35) | 32 % (60) / 36 % (140) |

**Medido: con r2 el bot hábil saca Oro el 35 % de los días (IC95 29-42), frente al 54 % (48-61) de r1. Los intervalos no se solapan.** Cae en el borde alto del objetivo (25-35 %) y los cinco biomas quedan entre el 22 % y el 41 % (antes, del 29 % al 80 %). **Este cambio sube la dificultad del reto**; no baja la de nada.

Por qué en el borde alto y no en el centro: el bot esquiva las telegrafías con reacción de 250 ms y conocimiento perfecto de las zonas de peligro. Si el jugador real esquiva peor, el reto quedará más duro que estas cifras, no más fácil. Subirlo más exigiría Peligro V (el diseño lo descarta) o meter Peligro IV en el Asfódelo (allí IV da un 4 %).

Riesgos: (1) en Peligro IV el presupuesto de mutadores es 1, así que los días de Cripta, Tundra y Panal traen 1 mutador o 2 de peso 0,5: hay menos variedad; (2) el multiplicador de puntuación sigue atado al Peligro, así que un día de Cripta (IV) puntúa más que uno de Bosque (III); las marcas solo se comparan dentro del mismo día, así que no importa; (3) cambiar `rv` cambia los retos de cada fecha (el historial guarda `rv` por entrada, como estaba previsto).

## 6. Fase C: mutadores (Asfódelo, Peligro III, Fragua y Pantano, n=48 por kit, 864 partidas, pares con la fase A)

`calib/faseC_mut_alta.csv`; `python3 tools/card-swarm-bot/calib/pares.py tools/card-swarm-bot/calib/faseC_mut_alta.csv --by mut [--metric m1|m2]`. Base de las mismas 96 semillas: Oro 46 %, Plata+ 83 %, Bronce+ 89 %.

| mutador (peso) | Oro con mutador | solo base / solo mutador (p) | Plata+ | Bronce+ | lectura |
|---|---|---|---|---|---|
| cristal (1) | **27 %** | 19 / 1 (p < 0,001) | 66 % (18 / 1) | 72 % | el que más quita, con diferencia |
| marea (1) | 34 % | 25 / 14 (0,11) | 81 % | 86 % | quita (no significativo) |
| bolsillo (0,5) | 35 % | 20 / 10 (0,10) | 88 % | 91 % | quita Oro (no significativo) |
| duros (1) | 36 % | 20 / 11 (0,15) | 72 % (0,06) | 75 % (19 / 6, p = 0,01) | quita |
| sincor (1) | 38 % | 17 / 9 (0,17) | 74 % | 76 % (21 / 9, p = 0,04) | quita |
| veloz (1) | 45 % | 20 / 19 (1,0) | 85 % | 92 % | neutro para el bot |
| sincambio (0,5) | 46 % | 0 / 0 | 83 % | 89 % | sin efecto medible: el bot nunca paga cambios de oferta |
| curtidos (1) | 52 % | 12 / 18 (0,36) | 85 % | 89 % | neutro (+6, dentro del ruido) |
| **dos (1)** | 52 % | 13 / 19 (0,38) | **98 %** (1 / 15, p < 0,001) | **99 %** (1 / 11, p = 0,01) | **facilita** |

Decisión aplicada: **"Dos etiquetas" sale del MVP** (`mvp: false` en `G.Daily.MUT`). Concentra la baraja, el bot llega antes a sus fusiones y saca Bronce y Plata mucho más (Fragua: Oro 69 -> 90 %, 3 / 13, p = 0,02). Incumple T-F4-01 ("ningún mutador facilita"). Quitarlo sube la dificultad. Su código sigue (R5 y la baraja recortada), por si se rediseña.

Sin cambios, con nota: `curtidos` y `veloz` no quitan victorias al bot (+6 y -1, dentro del ruido). No facilitan de forma medible, así que se quedan. Pero su peso 1 vale más de lo que hacen y `cristal`, con el mismo peso, quita 19 puntos. No retoco los pesos: el Oro del reto ya está en objetivo con r2, y subir el peso de `cristal` a 1,5 lo echaría de todos los días de Peligro IV, lo que haría el reto más fácil. `sincambio` no se puede medir con este bot.

## 7. Fase D: combinaciones límite (R1-R6), de las celdas de las fases A y B

| combinación | P III (fase A, n=48) | P IV (fase B, n=16) | con r2 |
|---|---|---|---|
| Pantano en la Tundra (R1, Caldo de brasa y Crampones) | 62 % | 38 % | IV: 38 % |
| Carmesí en el Panal (R2/R3, sin Tostada) | 79 % | 62 % | IV: 62 % |
| Tempestad en la Cripta contra Karceron (resiste Fuego) | 92 % | 31 % | IV: 31 % |
| Pantano contra Yarlak (R4/R6, Fuego de acompañamiento) | = Pantano en la Tundra | | |

Medido: ninguna regla deja una combinación imposible (todas por encima del 30 % en su Peligro r2). Ninguna queda trivial, salvo Carmesí en el Panal (62 % en IV, por encima del 60 %; n=16, IC95 39-82). Es un caso del problema general de Carmesí (sección 8), no de R2/R3.

## 8. Diferencias entre kits: no resueltas (decisión del dueño)

Oro esperado de cada kit en cada bioma con r2 (modelo de las fases A-B, sin mutadores; celdas de P II y IV con n=16, así que cada cifra tiene +-20 puntos):

| kit | Bosque | Cripta | Asfódelo | Tundra | Panal | **media** | reto real r2 (n) |
|---|---|---|---|---|---|---|---|
| fragua | 27 | 25 | 64 | 75 | 62 | **51** | 76 % (17) |
| carmesi | 40 | 75 | 38 | 38 | 62 | **50** | 50 % (22) |
| hogar | 41 | 31 | 54 | 50 | 56 | 46 | 50 % (28) |
| lana | 22 | 62 | 52 | 25 | 50 | 42 | 48 % (21) |
| pantano | 37 | 12 | 21 | 38 | 31 | 28 | 39 % (28) |
| tempestad | 16 | 31 | 34 | 12 | 19 | 23 | 18 % (28) |
| alquimia | 29 | 19 | **6** | 25 | 19 | **19** | 18 % (28) |
| ventisca | **9** | 44 | **9** | 12 | **6** | **16** | **4 %** (28) |

**Medido: el criterio de 1.10.6 (no más de 10 puntos entre kits) no se cumple.** Hay unos 35 puntos entre Fragua y Carmesí, arriba, y Ventisca y Alquimia, abajo. El orden es el mismo en P II, III y IV y en el reto real. Una semana de Ventisca, el bot saca Oro el 4-16 % de los días; una de Fragua, el 50-76 %. Hay celdas por debajo del 10 % ("kit inútil" ese día): Ventisca en Bosque, Asfódelo y Panal, y Alquimia en el Asfódelo.

Lo que probé y **no sirve** (todo medido por pares, sección 4): refuerzo de la armadura +1 -> +0, -3 / +3 PF por kit, cambiar el plato. Ninguna palanca de potencia mueve un kit más de 8 puntos. La diferencia tampoco la explica el cruce de etiquetas con las debilidades del jefe. Viene de la identidad del kit (fusión firma, set de armadura, cómo juega el AUTO de poderes con esas cartas), y eso es diseño, no números.

No he aplicado nada a los kits:
- Subir a los kits flojos **bajaría la dificultad** de sus semanas, y no hay palanca de potencia que funcione.
- Para bajar a los fuertes haría falta Peligro V (descartado en el diseño) o tocar su identidad.

Opciones para el dueño (pregunta 1):
- (a) **Peligro por kit además de por bioma**: las semanas de Ventisca y Alquimia, III donde r2 pone IV. Baja la dificultad de esas semanas, de un 16-19 % a un 30 % estimado.
- (b) **Permitir Peligro V en el reto** solo para Fragua y Carmesí en Tundra y Panal. Sube su dificultad.
- (c) **Rediseñar Ventisca y Alquimia** (fusión firma, etiquetas o set), trabajo de game-designer, y volver a medir con `kit_bot.js`.
- (d) Aceptar semanas fáciles y difíciles.

Recomiendo (c), y mientras tanto (d). La (a) es la vía rápida, pero baja la dificultad.

## 9. Puntuación, premios y objetivos

Reparto esperado de medallas por intento (modelo fases A-B, 8 kits):

| | Participación | Bronce | Plata | Oro | Brasas por reto | partes | Esencias por semana (7 retos) |
|---|---|---|---|---|---|---|---|
| r1 | 10 % | 4 % | 33 % | 53 % | 146 | 37 | 3,7 |
| **r2** | 10 % | 7 % | 49 % | 34 % | 135 | 35 | **2,4** |

Con r2, las Esencias por semana (2,4) caen en lo que suponía el diseño (2-3, 1.6), y el reto sigue pagando menos que una expedición normal (unas 200 Brasas). **Tabla de premios sin cambios**: solo materiales y medallas, sin PF (decisión del dueño), como ya estaba. Puntuación y multiplicador: sin cambios. La puntuación media apenas cambia (6.782 -> 6.811). Objetivos (`objectives.js`): sin cambios. `w_oro` ("Saca un Oro en el reto") pasa a ser más difícil, como corresponde a un objetivo semanal difícil. Plata (romper una parte o quitar media vida) sale casi en la mitad de los intentos: es una medalla de consuelo frecuente, no un problema de dificultad.

## 10. Cambios aplicados y pruebas

- `games/card-swarm/src/daily.js`: `Dl.RV = 'r2'`; `Dl.PEL_W` (tabla de 5.4) y `pelOf(biome, u)` (la tirada de Peligro se traduce después de elegir el bioma; mismas tiradas y en el mismo orden); mutador `dos` con `mvp: false`. Nada más: kits, potencia, pesos de mutadores, puntuación, premios y objetivos quedan igual. `kits.js` y `objectives.js` sin tocar; `G.Kit.KV` sigue en `k1`.
- `tools/card-swarm-bot/tests.js` (grupo `daily`): `DAILY_SNAP` del 2026-11-14 con r2 (`["panal",4,["bolsillo","sincambio"],"lana",["fire","ice"]]`); `R14.rv === 'r2'`; el reparto de Peligro de 365 días se comprueba por bioma contra `PEL_W` (+-12 puntos y 0 donde la tabla da 0), en vez de 35/45/20; "Dos etiquetas" comprueba que no sale en 1.000 días y que, forzada, recorta la baraja.
- Resultado: `tests.js daily` **93/93 OK**; `seed` **69/69 OK** y `diff` **26/26 OK** (hashes de la simulación de partidas normales idénticos: el cambio solo toca las reglas del reto). `G.god` y el balance general (armaduras, `zoneDmg`, Peligro IV-V de campaña) sin tocar.
- Herramienta: `tools/card-swarm-bot/kit_bot.js` (nuevo). `dodge_fusion.js` admite `rng`, `onlyBoss` y `noCards`, con el comportamiento anterior por defecto. Scripts y datos en `tools/card-swarm-bot/calib/`: `analiza.py`, `pares.py`, `purga.py`, `tabla_peligro.py`, `cola*.sh` y los CSV y registros de cada lote.

## 11. Qué queda sin medir

- **La correspondencia bot hábil -> jugador competente** (fase E): 3-5 retos del dueño en móvil con r2. Es la medición que decide si el 35 % del bot es un 35 % humano.
- `sincambio` (el bot no paga cambios de oferta), y `furia`, `pesados` y `cortamano` (fuera del MVP).
- Fase C solo en el Asfódelo y con 2 kits; mutadores en otros biomas y kits, sin medir.
- Celdas de P II y IV con n=16 (+-20 puntos por celda): bastan para medias por bioma y por kit, no para celdas sueltas.
- Rendimiento de `marea` en móviles lentos (fps).
- Por qué Ventisca y Alquimia rinden poco (uso del AUTO con sus fusiones firma, set): sin diagnosticar.
- Incidencias del método: un lote se cortó por falta de memoria (Chromium crecía con los contextos; arreglado renovando el navegador cada 30 partidas) y el servidor se cayó varias veces porque otro proceso compartía el archivo de PID. Las filas afectadas se rehicieron. `kit_bot.js` reanuda lo que falta y reintenta si no hay servidor. El ruido entre lotes iguales es 0 (determinista), así que los intervalos dados son solo de muestreo.

## 12. Preguntas para el dueño

1. **Diferencias entre kits** (sección 8): ¿(a) Peligro más bajo en las semanas de los kits flojos (baja la dificultad de esas semanas), (b) Peligro V en el reto para los kits fuertes en Tundra y Panal, (c) rediseñar Ventisca y Alquimia o (d) aceptarlo? Recomiendo (c), y (d) mientras tanto.
2. **¿Confirmas r2?** Sube el reto de un 54 % a un 35 % de días con Oro para el bot. Ya está aplicado en el código y es fácil de revertir (`Dl.RV`, `Dl.PEL_W = null`).
3. **"Dos etiquetas" fuera del MVP**: ¿se rediseña (por ejemplo, más un mutador de jefe obligatorio) o se queda fuera?
