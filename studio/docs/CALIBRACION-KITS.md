# Calibración de los kits semanales y del reto diario (Swarm Hand)

Autor: balance-designer. Estado: **en curso**. Fase A completa (1.920 partidas); fases B-D y exploración de palancas en marcha. Este documento se actualiza al cerrar cada lote.
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

## 4. Palancas y exploración (en curso)

Orden de 1.10.6: (1) tramo de PF y potencia por bioma (`G.Kit.POWER`), (2) nodos del último tramo de cada kit, (3) refuerzo de la armadura nivelada, (4) pesos de los mutadores. No se toca ningún número de combate.

Plan:
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

### 5.2 Reto diario real con las reglas actuales (r1, k1): 200 días seguidos (días 20401-20600), ALTA (`DAILY=1`, `calib/reto_real_r1.csv`)

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

## 6. Qué queda sin medir (a fecha de este corte)

- Fases B (Peligro II y IV), C (mutadores), D (combinaciones límite R1-R6) y calidades MEDIA / BAJA.
- Reto diario real con las reglas del día (`DAILY=1`).
- La correspondencia bot hábil -> jugador competente (fase E, humano en móvil).
- Puntuación y tabla de premios: sin cambios propuestos todavía.
