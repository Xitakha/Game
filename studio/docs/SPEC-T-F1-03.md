# SPEC T-F1-03: ritmo de los primeros 90 segundos de la expedición

Estado: **completo, pendiente de decisión del dueño**. Autor: diseño de balance. Fecha: 2026-11-14.
No toca código del juego: es una especificación para el programador.

Leyenda: [M] medido por mí en esta tarea, [H] heredado de otro documento y aún sin verificar aquí, [C] leído en el código, [I] inferido.

## 0. Estado de este documento

| Sección | Estado |
|---|---|
| 1. Medición del estado actual | Hecho: Bosque n=24 con 4 perfiles; otros 5 biomas n=12 con 2 perfiles; expedición entera n=16 |
| 2. Diagnóstico con archivo:línea | Hecho |
| 3. Objetivos de ritmo | Hecho |
| 4. Cambios antes -> después y validación | Hecho: Bosque 180 s (n=24, 4 perfiles), expedición entera (n=32, 2 perfiles) y otros 5 biomas (n=12, 2 perfiles) |
| 5. Lista para el programador, pruebas, riesgos, preguntas | Hecho |

## 1. Medición del estado actual

### 1.1 Método [M]

- Bot propio por pasos, fuera del repo (`pace_bot.js`, basado en `tools/card-swarm-bot/diff_bot.js`): `?dev=1&nosw=1&reset=1&god=0&dbg=1&direct=1&nointro=1&speed=0&seed=<s>&dq=alta&biome=<b>`, avanza con `G.step()`. Cuenta nueva (sin `all=1` ni `hand=`): la mano inicial es la de un jugador que empieza. Calidad ALTA.
- Semillas fijas 1..n. Se mide en tiempo de expedición (`G.runT`): el tiempo dentro de la ventana de cartas no cuenta. Sin muerte: la vida se repone cada tick y el daño se lee de `G.dbg.dmg` (daño bruto que habría recibido).
- Tres perfiles de movimiento:
  - **quieto**: no se mueve nunca (el "bot pasivo" del plan; peor caso de torpeza).
  - **novato**: cambia de dirección al azar cada 1,3 s (como el "novato" de `SPEC-T-F1-02-04.md`); no busca gemas.
  - **recolector**: va a la gema de XP más cercana y se aparta del enemigo que esté a menos de 70 px.
  - **hábil**: se mueve como el recolector y además lleva los poderes en AUTO (`G.Fusion.auto`). Es el perfil de referencia para "no adelantar poder".
  - Ninguno de los tres primeros usa nunca un poder activo: modelan a quien todavía no sabe que tiene un botón.
  - Todos eligen la carta que completa una fusión si la hay ("FUSIONAR YA"); si no, la primera.
- Métricas por tramo de 10 s: enemigos vivos (media y máximo; no cuenta ocultos), enemigos en pantalla, enemigos a menos de 200 px, bajas, daño, gemas de XP en el suelo, nivel.
- **"Sin nada que hacer" (definición):** porcentaje de ticks en los que no hay ningún enemigo ni proyectil enemigo a menos de 200 px del jugador. 200 px es 1,05 s de carrera del jugador y 2,9 s de marcha de un Cordero: dentro de ese radio hay que decidir algo; fuera, el básico (alcance 440 px, `src/fusion.js:19`) resuelve solo. Se da también el % de ticks con la pantalla vacía.
- Cifras: media ± error estándar entre semillas. La simulación por pasos es determinista, así que repetir un lote da lo mismo; el error es la variación entre semillas.

### 1.2 Bosque, primeros 180 s (n=24 por perfil, semillas 1..24) [M]

Hitos (segundos de expedición):

| Hito | quieto | novato | recolector |
|---|---|---|---|
| Primera baja | 3,3 ± 0,1 | 3,8 ± 0,2 | 3,3 ± 0,1 |
| Primer enemigo a < 200 px | 19,6 ± 1,0 | 7,9 ± 0,4 | 7,4 ± 0,4 |
| Primer golpe recibido | 52,6 ± 0,3 | 49,3 ± 6,3 (23/24) | 96,1 ± 5,7 (23/24) |
| Nivel 2 = primera carta | 82,6 ± 4,5 (57,7..109,7) | 35,1 ± 1,6 (20,8..49,9) | 14,3 ± 0,3 (12,6..18,2) |
| Primera fusión | igual que la carta | igual | igual (la primera oferta siempre completa receta) |
| Nivel 3 | 137,3 ± 0,6 | 109,9 ± 2,4 | 49,6 ± 0,3 |
| Nivel 4 | 159,8 ± 0,6 | 154,5 ± 1,7 | 82,6 ± 0,3 |
| Nivel 5 | fuera de 180 s | fuera de 180 s | 116,3 ± 0,4 |

Curva del recolector por tramo de 10 s:

| Tramo (s) | Vivos (media) | Vivos (máx.) | En pantalla | A < 200 px | Bajas | Daño | % sin nada que hacer | % pantalla vacía | Nivel al final |
|---|---|---|---|---|---|---|---|---|---|
| 0-10 | 3,1 | 6,0 | 1,7 | 0,1 | 7,6 | 0 | 95 | 27 | 1 |
| 10-20 | 5,9 | 8,7 | 3,8 | 0,5 | 14,5 | 0 | 69 | 2 | 2 |
| 20-30 | 7,2 | 10,3 | 4,8 | 0,8 | 16,0 | 0 | 57 | 1 | 2 |
| 30-40 | 9,3 | 11,7 | 6,7 | 1,5 | 18,4 | 0 | 37 | 0 | 2 |
| 40-50 | 10,4 | 12,9 | 8,3 | 2,0 | 19,6 | 0 | 27 | 0 | 2,7 |
| 50-60 | 6,3 | 10,5 | 4,1 | 0,6 | 21,1 | 0,7 | 66 | 6 | 3 |
| 60-70 | 4,7 | 7,8 | 2,6 | 0,1 | 16,1 | 0,7 | 83 | 10 | 3 |
| 70-80 | 5,3 | 9,0 | 2,9 | 0,1 | 15,8 | 2,1 | 82 | 12 | 3 |
| 80-90 | 5,8 | 9,5 | 3,3 | 0,2 | 18,1 | 1,1 | 73 | 8 | 4 |
| 90-120 | 6,0 | 10,4 | 3,4 | 0,2 | 56,3 | 6,0 | 73 | 6 | 5 |
| 120-150 | 6,6 | 11,0 | 4,0 | 0,2 | 57,5 | 8,6 | 67 | 5 | 5,3 |
| 150-180 | 7,1 | 12,5 | 4,3 | 0,3 | 63,3 | 10,0 | 63 | 4 | 6 |

(Errores estándar: vivos ± 0,2-0,4; bajas por tramo de 10 s ± 0,3-0,8; % ± 1-4 puntos.)

Resumen por perfil:

| Tramo | Métrica | quieto | novato | recolector |
|---|---|---|---|---|
| 0-30 s | % sin nada que hacer | 97 ± 1 | 79 ± 1 | 74 ± 1 |
| 0-30 s | daño recibido | 0 | 1,3 ± 0,8 | 0 |
| 0-90 s | vivos (media) / máximo | 7,9 / 13,8 | 7,5 / 13,3 | 6,4 / 13,2 |
| 0-90 s | bajas | 142,8 ± 0,9 | 141,0 ± 0,7 | 147,3 ± 1,0 |
| 0-90 s | daño recibido | 130,8 ± 4,9 | 15,6 ± 2,3 | 4,6 ± 1,3 |
| 0-90 s | % sin nada que hacer | 61 ± 1 | 58 ± 1 | 66 ± 1 |
| 0-90 s | XP acumulada / nivel | 7,2 / 1,5 | 25,1 / 2,0 | 78,1 / 4,0 |
| 90-180 s | vivos (media) / máximo | 8,9 / 17,7 | 7,8 / 14,4 | 6,6 / 14,0 |
| 90-180 s | bajas | 184,2 ± 1,6 | 178,7 ± 1,4 | 176,9 ± 1,4 |
| 90-180 s | daño recibido | 418,7 ± 16,1 | 25,8 ± 3,6 | 24,5 ± 3,0 |
| 90-180 s | % sin nada que hacer | 44 ± 2 | 64 ± 2 | 68 ± 1 |
| 180 s | nivel / XP | 4,08 ± 0,06 / 101 | 4,08 ± 0,06 / 101 | 6,00 ± 0,00 / 206 ± 1 |

Lecturas [M]:

1. **Las bajas no dependen de cómo se juegue**: 141-147 en 90 s con los tres perfiles. El jugador mata todo lo que el director le da; el límite es la oferta de enemigos, no su capacidad.
2. **Un jugador que no se mueve no recibe ni un golpe de Cordero en 180 s**: todo el daño del perfil quieto es de Zarzales (486 de Zarzal menor y 63 de Zarzal mayor de media; 0 de Cordero). Su primer golpe llega a los 52,6 s, con el primer Zarzal (entra a los 45 s). Antes de eso el juego no puede hacerle daño.
3. El recolector pasa el 74 % de los primeros 30 s y el 66 % de los primeros 90 s sin nada a menos de 200 px. Entre los 60 y los 80 s (tras la segunda carta) sube al 82-83 %: es el tramo más plano.
4. El dato heredado "nunca más de 6 enemigos vivos en 100 s" **no se reproduce tal cual**: el máximo de vivos en 0-100 s es 13,2 ± 0,2 (recolector). Sí se parece a los enemigos **en pantalla**: 1,7-8,3 de media por tramo. La mayoría de los vivos está de camino, fuera de la cámara.
5. Primera carta: recolector 14,3 s (coincide con los 15,6 s heredados, medidos a mano con otro bot), novato 35,1 s (heredado 55,7 s: su novato recogía menos), quieto 82,6 s.

### 1.3 Bosque, expedición entera hasta el jefe (recolector, n=16, semillas 1..16) [M]

Línea base de economía para comprobar que la propuesta no la mueve:

| Punto | Nivel | XP acumulada | Bajas acumuladas |
|---|---|---|---|
| 90 s | 4,0 ± 0,0 | 78,4 ± 0,4 | 148,1 ± 1,1 |
| 180 s | 6,0 ± 0,0 | 206,2 ± 1,1 | 325,4 ± 2,1 |
| 300 s | 9,4 ± 0,1 | 468,2 ± 5,7 | 615,9 ± 3,4 |
| 450 s (llega el jefe) | 13,19 ± 0,10 | 1010 ± 12 | 1058 ± 5 |

Ceniza al llegar al jefe: 1413 ± 16. Daño bruto recibido en toda la expedición: 499 ± 32. (Este primer lote de 16 semillas se amplió después a 32; las cifras de n=32, que son las que se usan para comparar, están en 4.4: nivel 13,25 ± 0,08, XP 1024 ± 7, Ceniza 1452 ± 13.) A los 180 s el recolector tiene 206 de XP y el nivel 7 pide 216: está a 10 de XP de subir, así que cualquier XP extra en el arranque se nota en el nivel del minuto 3.

### 1.4 Perfil hábil (recolector + poderes en AUTO), Bosque, n=24 [M]

| Métrica | recolector (sin poderes) | hábil (AUTO) |
|---|---|---|
| Nivel 2 / 3 / 4 / 5 (s) | 14,3 / 49,6 / 82,6 / 116,3 | 14,3 / 49,0 / 83,4 / 116,3 |
| Bajas 0-90 s | 147,3 ± 1,0 | 145,8 ± 0,9 |
| Daño 0-90 s | 4,6 ± 1,3 | 5,7 ± 1,3 |
| % sin nada que hacer 0-30 / 0-90 / 90-180 s | 74 / 66 / 68 | 78 / 74 / 75 |
| Nivel y XP a los 180 s | 6,00 / 206 ± 1 | 6,04 ± 0,04 / 208 ± 1 |

Usar los poderes no da más bajas ni más XP (no hay más enemigos que matar): solo vacía antes la pantalla. La diferencia entre los dos perfiles es menor que el error en todo salvo en el % sin nada que hacer.

### 1.5 Otros biomas, primeros 180 s (n=12 por celda, semillas 1..12) [M]

| Bioma | Perfil | Nv2 (s) | Nv3 (s) | Bajas 0-90 | Daño 0-90 | % sin nada 0-30 | % sin nada 0-90 | Máx. vivos 0-90 | Nivel a 180 s |
|---|---|---|---|---|---|---|---|---|---|
| Bosque (n=24) | recolector | 14,3 ± 0,3 | 49,6 ± 0,3 | 147,3 ± 1,0 | 4,6 ± 1,3 | 74 ± 1 | 66 ± 1 | 13,2 ± 0,2 | 6,00 |
| Bosque (n=24) | novato | 35,1 ± 1,6 | 109,9 ± 2,4 | 141,0 ± 0,7 | 15,6 ± 2,3 | 79 ± 1 | 58 ± 1 | 13,3 ± 0,3 | 4,08 ± 0,06 |
| Cripta | recolector | 14,2 ± 0,3 | 50,7 ± 0,4 | 147,0 ± 1,5 | 5,7 ± 2,4 | 73 ± 2 | 65 ± 1 | 13,6 ± 0,3 | 6,08 ± 0,08 |
| Cripta | novato | 35,4 ± 2,2 | 99,7 ± 4,1 | 142,1 ± 1,1 | 27,2 ± 3,3 | 78 ± 2 | 56 ± 1 | 14,3 ± 0,5 | 4,08 ± 0,08 |
| Asfódelo | recolector | 13,8 ± 0,2 | 49,7 ± 0,4 | 148,0 ± 1,1 | 3,2 ± 1,8 | 75 ± 1 | 65 ± 1 | 12,8 ± 0,4 | 6,08 ± 0,08 |
| Asfódelo | novato | 34,0 ± 1,4 | 94,6 ± 2,4 | 144,0 ± 0,9 | 26,4 ± 3,9 | 77 ± 2 | 53 ± 1 | 17,4 ± 1,1 | 5,00 |
| Tundra | recolector | 14,1 ± 0,2 | 50,4 ± 0,5 | 147,6 ± 1,5 | 4,9 ± 1,9 | 73 ± 1 | 68 ± 1 | 12,5 ± 0,3 | 6,08 ± 0,08 |
| Tundra | novato | 36,4 ± 2,7 | 113,2 ± 5,0 | 144,8 ± 1,0 | 15,0 ± 3,3 | 77 ± 1 | 58 ± 1 | 14,8 ± 0,5 | 4,17 ± 0,11 |
| Panal | recolector | 13,9 ± 0,2 | 49,0 ± 0,5 | 148,1 ± 1,1 | 7,8 ± 2,7 | 72 ± 1 | 66 ± 1 | 11,9 ± 0,3 | 6,25 ± 0,13 |
| Panal | novato | 35,4 ± 1,5 | 119,7 ± 3,3 | 142,7 ± 1,4 | 6,8 ± 2,0 | 75 ± 2 | 57 ± 1 | 13,4 ± 0,4 | 4,75 ± 0,13 |
| Cráter (`?biome=crater` en modo expedición) | recolector | 14,4 ± 0,3 | 50,1 ± 0,5 | 150,6 ± 1,8 | 7,8 ± 2,4 | 73 ± 2 | 65 ± 1 | 13,7 ± 0,4 | 6,08 ± 0,08 |
| Cráter | novato | 31,4 ± 1,7 | 105,0 ± 4,8 | 145,6 ± 1,4 | 13,6 ± 3,3 | 77 ± 2 | 53 ± 1 | 14,7 ± 0,5 | 4,58 ± 0,15 |

El arranque es el mismo en los seis biomas: las diferencias en los primeros 90 s caben en el error. Lo que se decida para el Bosque vale para todos. Aviso: el Cráter real es el Asalto (cacería sin hordas); aquí se forzó como expedición solo para completar la fila. Las cuentas de estas pruebas son nuevas: un jugador real llega a los biomas 2-6 con árbol y armadura, que no se midieron.

## 2. Diagnóstico

Causa principal [M + C]: **el básico mata más rápido de lo que el director ofrece, y lo hace lejos**. No es falta de daño enemigo ni de vida.

| # | Causa | Dato | Dónde |
|---|---|---|---|
| D1 | Oferta por debajo de la capacidad de matar durante los primeros 30 s | Director: `bp(m) = 2 + 1,6 m` puntos por pulso de 1,5 s, es decir 1,33 Corderos/s en el segundo 0. Básico: un disparo cada 500 ms que mata al Cordero de un golpe (10 x 3,43 de daño contra 14 de vida) = 2 bajas/s = **20 bajas por tramo de 10 s como techo sin poderes** (medido: con más oferta las bajas se clavan en 20,0 ± 0,1). Oferta medida: 7,6 / 14,5 / 16,0 / 18,4 / 19,6 bajas en los cinco primeros tramos, iguales en todos los perfiles. Sobran unas 22 bajas de capacidad en 0-30 s y casi ninguna en 30-50 s | `src/main.js:108`, `src/waves.js:139-144`, `src/fusion.js:16`, `src/main.js:100`, `src/main.js:35` |
| D2 | Los enemigos mueren antes de llegar | Aparecen a 500-580 px, andan a 70 px/s (7-8 s de camino) y el básico alcanza a 440 px. De uno en uno no llega ninguno: 0 de daño de Cordero al perfil quieto en 180 s | `src/waves.js:15`, `src/main.js:35`, `src/fusion.js:19` |
| D3 | Goteo sin forma | El director reparte de uno en uno, en ángulos al azar alrededor del jugador. No hay grupos hasta los packs del 2:45; nada obliga a moverse | `src/waves.js:177-189`, packs en `src/waves.js:158-159` |
| D4 | Un solo tipo hasta los 45 s | Solo Cordero (`from: 0`); Zarzal menor a los 45 s, Zarzal mayor a los 90 s, Jabalí a los 120 s. El primer enemigo que puede herir a un jugador quieto es el Zarzal | `src/families.js` (familia del Bosque, `from`), `src/main.js:35-38` |
| D5 | La primera carta depende de saber que hay que recoger | Nivel 2 con 6 de XP = 12 gemas de Cordero (0,5 de XP cada una). Las bajas caen a 300-440 px y el radio de recogida es 60 px: el recolector tarda 14,3 s, el novato 35,1 s, el quieto 82,6 s. A los 30 s el quieto tiene 30 gemas en el suelo sin recoger | `src/main.js:143-144` (`xp.first`, `gemMul`), `src/main.js:31` (`pickup`), `src/combat.js:400` |
| D6 | Cada carta nueva vacía la pantalla | Tras la primera fusión (14 s) y la segunda carta (50 s) los vivos bajan de 10,4 a 4,7 y el % sin nada que hacer sube al 83 %: el poder crece a saltos y la oferta en línea recta | `src/main.js:108` frente a `src/fusion.js` |
| D7 | El tope de enemigos no interviene | `cap(m) = 30 + 10 m` y el máximo medido es 13: subir `cap` no cambia nada en el arranque | `src/main.js:109`, `src/waves.js:145` |

Lo que **no** es causa [M]: la cadencia de aparición del primer enemigo (primera baja a los 3,3 s) y el momento de la primera carta del recolector (14,3 s, ya dentro del objetivo de 20 s del plan).

## 3. Objetivos de ritmo

Medidos siempre en segundos de expedición, Bosque, ALTA, 9 min, cuenta nueva, semillas 1..24.

| # | Objetivo | Hoy | Meta | Por qué |
|---|---|---|---|---|
| O1 | Primera decisión de carta, jugando bien (recolector) | 14,3 ± 0,3 s | <= 12 s de media y <= 14 s en la peor semilla | El plan pide < 20 s y ya se cumple; se adelanta un poco porque la primera expedición sale directa tras la intro y la primera carta es además la primera fusión |
| O2 | Primera decisión de carta, jugando torpe (novato que no busca gemas) | 35,1 ± 1,6 s (peor semilla 49,9) | <= 20 s de media y <= 30 s en la peor semilla | Es la meta de `SPEC-T-F1-02-04.md` ("novato <= 30 s"). Sin carta no hay juego que enseñar |
| O3 | Primera amenaza real: un golpe si no te mueves | 52,6 s, y nunca de un Cordero | Entre 20 y 30 s, de Corderos | Hoy quedarse quieto es la mejor jugada durante 50 s. El juego tiene que pedir movimiento desde el primer medio minuto: eso es reto, no castigo, porque moverse basta para evitarlo |
| O4 | Primer pico de tensión | No existe: máximo 10,3 vivos en 10-30 s, 4-5 en pantalla | Un grupo que entre junto entre los segundos 19 y 30: >= 16 vivos de máximo | El primer poder (fusión a los ~11 s) necesita un grupo al que apuntar. Un pico seguido de un respiro, no un goteo |
| O5 | Tiempo sin nada que hacer en 0-30 s (hábil) | 78 ± 1 % | <= 55 % | Es la medida directa de "plano" |
| O6 | No adelantar poder | Nivel 3 / 4 / 5 del hábil a 49,0 / 83,4 / 116,3 s; nivel 6,04 y 208 de XP a los 180 s | Cada uno dentro de ± 3 s; nivel a 180 s igual; XP a 180 s menos la XP añadida a la curva dentro de ± 3 | El plan fija "nivel del minuto 3 dentro de ± 1"; se propone un criterio más estricto porque ± 1 nivel son 58 de XP y escondería un regalo |
| O7 | No cambiar la expedición a partir del minuto 2 | Bajas 120-180 s: 120,7 ± 1,1 (hábil) | Dentro del error | Todo el cambio ocurre antes del segundo 30 |
| O8 | Economía al llegar al jefe (recolector, n=32) | Nivel 13,25 ± 0,08; XP 1024 ± 7; Ceniza 1452 ± 13; 1057 ± 4 bajas | Nivel y XP (descontada la XP añadida) dentro del error; Ceniza dentro de + 2 % | Los objetivos de victoria del dueño (50/40/30/20/10 % por Peligro) se calibran en T-F2; esta tarea no debe moverlos |

Lo que **no** se propone como objetivo: "al menos 12 enemigos vivos en el segundo 30" (criterio del plan). Un instante concreto depende de la semilla; se sustituye por O4 (máximo en una ventana), que mide lo mismo y es estable.

## 4. Cambios propuestos

### 4.1 Tabla antes -> después

| # | Qué | Antes | Después | Efecto buscado |
|---|---|---|---|---|
| C1 | Rebaño de apertura 1 | no existe | A los 5 s: 8 Corderos juntos (un solo punto del anillo de aparición, dispersión ± 55 px), además del goteo normal | Primer contacto y primera carta antes (O1) |
| C2 | Rebaño de apertura 2 | no existe | A los 19 s: 10 Corderos juntos, igual que C1 | Primer pico y primera amenaza (O3, O4) |
| C3 | XP del nivel 2 al 3 | 30 | 39 (+9) | Devuelve exactamente la XP de los 18 Corderos nuevos (18 x 0,5 = 9): no se adelanta poder (O6) |
| C4 | Radio de recogida en el nivel 1 | 60 px | 150 px mientras el jugador es nivel 1; 60 px desde el nivel 2 | Primera carta del torpe (O2) |

Lo que **no** cambia: `bp`, `cap`, `xp.first` (6), la vida, el daño y la velocidad del Cordero, la cadencia y el daño del básico, la entrada del Zarzal (45 s), y nada posterior al segundo 30. Los rebaños no se pagan del presupuesto del director: son 18 enemigos más en toda la expedición (+1,7 % de bajas).

Por qué estos números [M]:

- Los rebaños caben en la capacidad que sobra: sobran ~22 bajas del básico en 0-30 s (D1) y se añaden 18.
- Un rebaño de menos de ~12 Corderos que llega solo nunca toca a un jugador quieto (cruzan 440 px de alcance en 6,3 s y el básico mata 12,6 en ese tiempo). El de 10 a los 19 s llega junto con el goteo (16 bajas por tramo), y por eso sí llega: primer golpe del quieto a los 25,7 ± 0,8 s.
- 150 px es el radio más pequeño de los probados que cumple O2 (ver 4.3).

### 4.2 Validación: Bosque, 180 s, n=24 por perfil, semillas 1..24 [M]

Parche temporal aplicado en el navegador del bot (sobrescribe `G.B.xpNeed`, cambia `G.B.player.pickup` según el nivel y lanza los rebaños desde el gancho de pruebas `G.onTick`); no hay cambios en `games/`.

| Métrica | Perfil | Antes | Después | Lectura |
|---|---|---|---|---|
| Primera carta = primera fusión (s) | hábil / recolector | 14,3 ± 0,3 (12,6..18,2) | 10,8 ± 0,2 (9,2..12,2) | O1 cumplido |
| | novato | 35,1 ± 1,6 (20,8..49,9) | 14,5 ± 0,6 (9,6..20,8) | O2 cumplido |
| | quieto | 82,6 ± 4,5 | 23,4 ± 0,9 | |
| Primer golpe recibido (s) | quieto | 52,6 ± 0,3 | 25,7 ± 0,8 | O3 cumplido |
| | novato | 49,3 ± 6,3 | 21,1 ± 2,4 | |
| | hábil | 88,0 ± 6,2 | 91,6 ± 7,2 | sin cambio |
| Máximo de vivos en 10-30 s (rango entre semillas) | hábil | 8..14 | 16..21 | O4 cumplido |
| En pantalla, tramo 20-30 s | hábil | 4,2 ± 0,3 | 8,9 ± 0,5 | |
| Bajas 0-30 s | hábil | 39,0 ± 0,4 | 54,9 ± 0,6 | |
| % sin nada que hacer 0-30 s | hábil | 78 ± 1 | 52 ± 2 | O5 cumplido |
| | recolector | 74 ± 1 | 41 ± 2 | |
| | novato | 79 ± 1 | 54 ± 1 | |
| % sin nada que hacer 45-90 s | hábil | 78,4 ± 0,9 | 77,7 ± 1,1 | **sin cambio: sigue plano** (ver 4.5) |
| Nivel 3 / 4 / 5 (s) | hábil | 49,0 / 83,4 / 116,3 (± 0,3-0,4) | 49,1 / 82,4 / 115,9 (± 0,3-0,4) | O6 cumplido (diferencias <= 1 s) |
| Nivel y XP a los 180 s | hábil | 6,04 ± 0,04 / 208 ± 1 | 6,00 ± 0,00 / 217 ± 1 (217 - 9 = 208) | O6 cumplido |
| Bajas 90-180 s | hábil | 176,8 ± 1,1 | 175,8 ± 1,8 | O7 cumplido |
| Daño recibido 0-90 s | hábil | 5,7 ± 1,3 | 5,3 ± 1,4 | sin cambio |
| | novato | 15,6 ± 2,3 | 31,4 ± 2,6 | sube |
| | recolector (nunca usa el poder) | 4,6 ± 1,3 | 42,3 ± 7,2 | **sube mucho** |
| | quieto | 130,8 ± 4,9 | 264,9 ± 12,7 | quedarse quieto mata antes |
| Nivel 3 (s) | recolector (nunca usa el poder) | 49,6 ± 0,3 | 60,3 ± 1,1 | se retrasa 10 s; el nivel 5 llega a 117,8 frente a 116,3 |
| Ceniza a los 180 s | hábil | 336 ± 4 | 360 ± 5 | + 24 (los 18 Corderos nuevos sueltan ~1 de Ceniza cada uno) |

Sentido del cambio en dificultad, dicho claro: **la propuesta no baja la dificultad en ningún perfil medido; la sube para quien no se mueve y para quien no usa su primer poder**, y la deja igual para el jugador hábil. La única ayuda es C4 (la primera carta llega antes al torpe): adelanta su primera fusión unos 20 s, pero no su nivel a los 3 minutos (novato: 4,08 ± 0,06 antes, 4,17 ± 0,08 después; dentro del error).

### 4.3 Variantes medidas y descartadas [M] (Bosque, n=24)

| Variante | Resultado | Por qué se descarta |
|---|---|---|
| Solo radio de nivel 1 = 150 px | Novato 19,9 ± 0,4 s (15,8..24,4); quieto 55,9 s; recolector 13,3 s | Cumple O2 sola, pero no toca O3-O5. Queda dentro de la propuesta |
| Radio de nivel 1 = 250 px | Novato 14,1 ± 0,4 s; quieto 22,6 ± 0,5 s | Da la carta incluso sin moverse: enseña lo contrario de lo que se quiere. Es la opción si el dueño prefiere más ayuda |
| Rebaños de 10, 14 y 16 a los 20, 40 y 70 s (+40 Corderos) con +12 / +8 de XP en los niveles 2 y 3 | Hábil: daño 0-90 s 14,2 ± 3,3, nivel a 180 s igual. Recolector sin poderes: daño 0-90 s **147 ± 12** y nivel 3 a los 76,7 s | Pasados los 30 s no sobra capacidad del básico: quien no usa el poder se ahoga. Mataría al novato en su primera expedición |
| Rebaños de 6, 8, 8 y 10 a los 6, 20, 36 y 66 s (+32) | Recolector sin poderes: daño 0-90 s 83,8 ± 8,5; hábil 7,8 ± 2,5 | Igual, menos grave |
| Los mismos rebaños pagados del presupuesto del director (sin enemigos de más) a los 20, 40 y 70 s | Recolector casi como hoy: % sin nada que hacer 0-90 s 61 ± 1 frente a 66 ± 1; daño 7,0 ± 2,0 frente a 4,6 ± 1,3 (hábil no medido) | No cambia la economía en nada, pero tampoco el ritmo: el básico deshace el grupo antes de que llegue |
| Propuesta + rebaños pagados del presupuesto a los 38 y 66 s | Hábil: % sin nada que hacer 0-90 s 63 ± 2 frente a 64 ± 2 (sin diferencia). Recolector sin poderes: daño 0-90 s 53,8 ± 7,5 frente a 42,3 ± 7,2 (dentro del ruido) | No aporta nada medible |
| Segundo rebaño de 14 en dos grupos opuestos, +11 de XP | Hábil: % sin nada 0-30 s 47 ± 2. Recolector sin poderes: daño 0-90 s 77,5 ± 7,3 | Más pico, pero casi dobla el daño del que no usa el poder |

### 4.4 Economía al llegar al jefe y otros biomas [M]

Bosque, expedición entera hasta que aparece el jefe (450 s), **n=32 por celda** (semillas 1..32, en dos lotes de 16). "Dif." es después menos antes; "EE dif." es el error estándar de esa diferencia; z = Dif. / EE dif.

| Perfil | Métrica | Antes | Después | Dif. | EE dif. | z | Lectura |
|---|---|---|---|---|---|---|---|
| hábil | Bajas | 1067 ± 4 | 1086 ± 3 | +20 | 5 | 3,9 | los 18 Corderos nuevos |
| hábil | Nivel | 13,34 ± 0,09 | 13,47 ± 0,09 | +0,13 | 0,12 | 1,0 | dentro del ruido |
| hábil | XP acumulada | 1041 ± 5 | 1060 ± 7 | +19 (+10 descontando los 9 añadidos a la curva) | 9 | 2,2 (1,1 descontando) | el avance neto cabe en el ruido |
| hábil | Ceniza | 1471 ± 11 | 1500 ± 10 | +29 (+2,0 %) | 15 | 1,9 | lo esperado por 18 Corderos es +18 (+1,2 %) |
| hábil | Daño bruto recibido | 334 ± 14 | 385 ± 21 | +51 (+15 %) | 25 | 2,0 | dudoso; ver nota |
| recolector (sin poderes) | Bajas | 1057 ± 4 | 1077 ± 3 | +20 | 5 | 4,2 | los 18 Corderos nuevos |
| recolector | Nivel | 13,25 ± 0,08 | 13,28 ± 0,08 | +0,03 | 0,11 | 0,3 | dentro del ruido |
| recolector | XP acumulada | 1024 ± 7 | 1044 ± 6 | +20 (+11 descontando 9) | 10 | 2,1 (1,2 descontando) | el avance neto cabe en el ruido |
| recolector | Ceniza | 1452 ± 13 | 1480 ± 10 | +28 (+1,9 %) | 16 | 1,7 | como el hábil |
| recolector | Daño bruto recibido | 448 ± 22 | 466 ± 16 | +19 | 28 | 0,7 | dentro del ruido |

Lectura [M]: el nivel al llegar al jefe no cambia (O8 cumplido: +0,03 y +0,13 niveles con error 0,11-0,12). La Ceniza sube un 2 % (justo en el límite fijado; lo esperado por construcción es +1,2 %). La XP total sube 19-20, de los que 9 son los que la curva pide de más: el avance neto es +10 ± 9, sin efecto en el nivel.

Nota sobre el ruido: el primer lote (semillas 1..16) daba para el recolector +64 de Ceniza (z 2,7) y +29 de XP neta (z 1,8); el segundo lote (17..32) dio -7 de Ceniza y -7 de XP neta. Con n=16 el ruido entre lotes iguales es de ese tamaño (±25 de Ceniza, ±16 de XP), así que ninguna cifra de expedición entera de este documento debe leerse con más precisión que esa. El +15 % de daño del hábil (z 2,0) está en el mismo caso: no aparece en los primeros 180 s (25,4 ± 2,6 antes, 24,8 ± 3,1 después) ni en el recolector, y no hay mecanismo que lo explique; va en el sentido de más reto, no de menos. Queda como punto a vigilar en la matriz de T-F2.

Otros biomas con la propuesta, 180 s, n=12, semillas 1..12 (antes -> después):

| Bioma | Perfil | Primera carta (s) | Primer golpe (s) | % sin nada 0-30 s | Daño 0-90 s | Nivel a 180 s |
|---|---|---|---|---|---|---|
| Cripta | recolector | 14,2 -> 10,8 ± 0,2 | 88,6 -> 62,8 ± 8,9 | 73 -> 43 ± 2 | 5,7 -> 34,6 ± 8,2 | 6,08 -> 6,00 |
| Cripta | novato | 35,4 -> 16,2 ± 1,1 | 38,5 -> 24,4 ± 4,7 | 78 -> 60 ± 1 | 27,2 -> 33,4 ± 6,4 | 4,08 -> 4,00 |
| Asfódelo | recolector | 13,8 -> 11,0 ± 0,2 | 110,2 -> 50,3 ± 7,0 | 75 -> 33 ± 1 | 3,2 -> 27,5 ± 7,0 | 6,08 -> 6,00 |
| Asfódelo | novato | 34,0 -> 16,0 ± 0,8 | 39,9 -> 27,5 ± 5,2 | 77 -> 55 ± 1 | 26,4 -> 40,6 ± 4,4 | 5,00 -> 4,92 ± 0,08 |
| Tundra | recolector | 14,1 -> 11,3 ± 0,3 | 98,0 -> 42,6 ± 3,8 | 73 -> 38 ± 2 | 4,9 -> 47,0 ± 8,0 | 6,08 -> 6,08 |
| Tundra | novato | 36,4 -> 17,2 ± 0,8 | 45,8 -> 49,2 ± 13,8 | 77 -> 57 ± 2 | 15,0 -> 11,6 ± 2,8 | 4,17 -> 4,67 ± 0,14 |
| Panal | recolector | 13,9 -> 10,7 ± 0,2 | 91,5 -> 55,6 ± 3,6 | 72 -> 36 ± 2 | 7,8 -> 23,8 ± 4,0 | 6,25 -> 6,33 ± 0,14 |
| Panal | novato | 35,4 -> 14,9 ± 1,0 | 61,9 -> 41,8 ± 10,4 | 75 -> 52 ± 2 | 6,8 -> 14,8 ± 3,1 | 4,75 -> 4,75 |
| Cráter (forzado) | recolector | 14,4 -> 10,8 ± 0,3 | 87,8 -> 56,0 ± 6,8 | 73 -> 41 ± 3 | 7,8 -> 39,6 ± 7,2 | 6,08 -> 6,00 |
| Cráter (forzado) | novato | 31,4 -> 15,6 ± 0,9 | 49,9 -> 23,2 ± 3,6 | 77 -> 59 ± 2 | 13,6 -> 32,2 ± 4,9 | 4,58 -> 4,50 ± 0,15 |

El efecto es el mismo en los seis biomas. Única celda que se sale: el novato de la Tundra sube medio nivel a los 180 s (4,17 ± 0,11 -> 4,67 ± 0,14, unas 2,8 veces el error de la diferencia); con 10 celdas comparadas, una así entra en lo esperable por azar, pero se anota. En el Panal el parche no comprobó `G.Panal.inside` para la dispersión del rebaño (el punto base sí); la implementación real debe hacerlo (5.1). El perfil hábil no se midió fuera del Bosque.

### 4.5 Lo que esta propuesta no arregla [M]

Para el jugador hábil el tramo de 45 a 90 s sigue igual de plano (78 % del tiempo sin nada a menos de 200 px), y los minutos 2 y 3 también (75 %). La causa es D6: cada carta multiplica la capacidad de matar y la oferta crece en línea recta. No se puede corregir añadiendo enemigos en ese tramo sin ahogar a quien todavía no usa los poderes (variantes de 4.3) y sin inflar la XP. Corregirlo es rehacer la curva `bp` contra la capacidad real por nivel: es trabajo de T-F2 (balance por Peligro con el bot hábil), no de esta tarea. Se deja medido como línea base.

## 5. Para el programador

### 5.1 Cambios por archivo

1. `games/card-swarm/src/main.js`, tabla `G.B`:
   - `player`: añadir `pickup1: 150` (radio de recogida mientras `G.player.level === 1`).
   - `xp`: añadir `early: { 2: 9 }` y sumar en `xpNeed`: `return (L === 1 ? x.first : Math.round(x.base + x.lin * L + x.quad * L * L)) + (x.early[L] || 0);`. Con esto `xpNeed(2)` pasa de 30 a 39 y ningún otro nivel cambia. El HUD ya lee `B.xpNeed` (`src/hud.js:129`).
   - Nuevo bloque `open: { packs: [[5000, 8], [19000, 10]], spread: 55 }` (ms de tiempo virtual, número de Corderos, dispersión en px).
   - Perillas solo con `?dev=1` (vía `qnum`, que ya lee `Dev.search`): `?open=0` (sin rebaños), `?pk1=<px>` (radio de nivel 1), `?xp2=<n>` (XP extra del nivel 2). Actualizar el comentario de la tabla de niveles (`src/main.js:129-142`).
2. `games/card-swarm/src/waves.js`:
   - `W.reset` (`:8`): añadir `W.openI = 0`.
   - En `W.update`, solo en modo `run`, después de calcular `vt` (`:126`) y antes del `return` del pulso (`:139`): mientras `W.openI < B.open.packs.length` y `vt >= packs[W.openI][0]`, lanzar el rebaño y sumar 1 a `W.openI`. Si el jefe ya salió (`W.bossSpawned`) o `G.t0 > 0` (`?t=`), marcar los rebaños como hechos sin lanzarlos.
   - Lanzar un rebaño: un solo `spawnPos()`; `n = Math.max(1, Math.round(num * G.D.n))` (respeta el perfil de dificultad por calidad de T-F0-05: MEDIA 7 y 9, BAJA 6 y 8); por cada Cordero `E.spawn('worm', x, y)` con `x, y = pos ± G.rnd(-spread, spread)` acotado a la arena (`G.WALL + 30`). En el Panal, repetir el sorteo si `!G.Panal.inside(x, y, 30)` (como hace `spawnPos`, `:17`). **No** restar de `W.budget` y no pasar `noprof` ni `summoned` (deben dar XP, Ceniza y contar para encargos como cualquier Cordero).
   - Usa la telegrafía de aparición normal (`spawnTelegraph` 400 ms, `src/main.js:106`). Los rebaños nacen a 500-580 px, fuera o en el borde de la cámara: no hay ataque nuevo, así que la regla de esquiva (`tele >= 250 + 1000 * px / 190`) no aplica; un Cordero a 70 px/s tarda más de 4 s en llegar desde el borde.
   - Usar `G.rng`/`G.rnd` (nunca `Math.random`) para que `?seed` siga siendo reproducible.
3. `games/card-swarm/src/combat.js:400`: sustituir `B.player.pickup` por `(p.level === 1 ? B.player.pickup1 : B.player.pickup)`. Los multiplicadores de imán siguen aplicándose encima.
4. `games/card-swarm/README.md`: tabla de antes y después de 4.1 y las cifras de 4.2.
5. No tocar: `bp`, `cap`, `xp.first`, `B.enemy`, `families.js`, `fusion.js`.

Cacería, práctica y Asalto no cambian (los rebaños solo salen en modo `run`; el radio de nivel 1 sí aplica en la preparación, donde no hay gemas).

Orden de trabajo: un cambio cada vez (C4, luego C1+C2+C3 juntos: los rebaños sin C3 adelantan poder y no deben entrar solos).

### 5.2 Pruebas a añadir en `tools/card-swarm-bot/tests.js`

Grupo `balance`, punto de control nuevo `ritmo` (regresión con semilla). Bot de guion por pasos como `diff_bot.js`: `?dev=1&nosw=1&reset=1&god=0&dbg=1&direct=1&nointro=1&speed=0&biome=bosque&dq=alta&seed=<s>`, vida repuesta cada tick, elige la carta que completa fusión (botón "FUSIONAR YA") y si no la primera, nunca usa poderes. Movimiento "recolector": si hay un enemigo a menos de 70 px (descontado su radio), se aleja de él; si no, va a la gema de XP más cercana; si no hay, se queda quieto. Semillas 1..8, hasta los 180 s de `G.runT`.

| Comprobación | Umbral | Medido con la propuesta (n=24) | Medido hoy |
|---|---|---|---|
| `G.B.xpNeed(1)`, `xpNeed(2)`, `xpNeed(3)` | 6, 39, 34 | | 6, 30, 34 |
| Primera oferta de carta, cada semilla | <= 14 s | 9,2..12,2 | 12,6..18,2 |
| Primera oferta, media de las 8 | <= 12 s | 10,8 ± 0,2 | 14,3 ± 0,3 |
| Máximo de enemigos vivos entre 10 y 30 s, cada semilla | >= 15 | 17..24 | 8..14 |
| Bajas en 0-30 s, cada semilla | >= 42 | 43..51 | 34..41 |
| Nivel a los 180 s, cada semilla | 6 | 6..6 | 6..6 |
| XP acumulada a los 180 s, media de las 8 | entre 205 y 226 | 216 ± 1 (192,5..225,5 por semilla) | 206 ± 1 |
| Con el jugador quieto (mismas semillas): primer golpe | entre 15 y 35 s | 25,7 ± 0,8 | 52,6 ± 0,3 |
| Con `?open=0&pk1=60&xp2=0`: primera oferta media | entre 13 y 16 s | | 14,3 ± 0,3 (la línea base sigue reproducible) |
| Modo cacería (`?hunt=pastor`): ningún rebaño | 0 Corderos antes del jefe | | |
| `?dq=baja`: tamaño de los rebaños | 6 y 8 | | |

Los umbrales por semilla llevan un margen de 1-2 unidades sobre el rango medido con 24 semillas. Si el programador mueve el orden de llamadas a `G.rng`, las cifras por semilla cambian pero deben seguir dentro. La prueba de semilla existente (hash de la partida) cambiará de valor: hay que regenerarlo.

Además, repetir `diff_bot.js` (ALTA / MEDIA / BAJA) tras el cambio para comprobar que la equivalencia de T-F0-05 no se mueve.

### 5.3 Riesgos

1. **El que no usa su primer poder recibe más daño** (42 ± 7 en 90 s frente a 5; medido con un bot que nunca pulsa el poder). No es letal con 100 de vida y la cura del 20 % al subir de nivel, pero depende de que el aviso `power` de T-F1-02 funcione. Si el playtest del dueño lo ve duro, la perilla es el tamaño del segundo rebaño (10 -> 8) con `xp.early` 9 -> 8.
2. **Quedarse quieto mata antes** (265 de daño en 90 s frente a 131). Es intencionado (O3); coincide con el aviso `move` de T-F1-02.
3. **Ceniza**: +2 % al llegar al jefe (medido, n=32; +1,2 % esperado por construcción). Si no se quiere ni eso, los Corderos de rebaño pueden no soltar Ceniza (un indicador en `E.spawn`), a costa de una regla más.
4. **Aviso `gems` de T-F1-02**: con 150 px en el nivel 1 las gemas cercanas vuelan solas; la condición de cierre "recoge 3 gemas" se cumplirá casi siempre sin que el jugador haga nada. El aviso sigue siendo cierto, pero conviene que `ux-designer` decida si lo mantiene en el nivel 1 o lo mueve al nivel 2, cuando el radio vuelve a 60 px.
5. **Los bots no son jugadores**: el movimiento del recolector es simple (no esquiva en grupo). Las cifras ordenan opciones; el juicio de "se siente bien" es del playtest del dueño. Con la inmortalidad activa por defecto (`src/main.js:20`) el dueño no notará el daño: hay que probar con `?god=0`.
6. **Biomas 2-6 con equipo**: validado solo con cuenta nueva. Con árbol y armadura el jugador mata más rápido y los rebaños pesan menos; no puede ser más difícil que lo medido.
7. **Reversión**: `open.packs: []`, `xp.early: {}`, `pickup1: 60` devuelven el juego actual exacto.

### 5.4 Decisiones del dueño

1. **¿Aceptas que el primer medio minuto sea más exigente para quien no se mueve o no usa su primer poder?** Recomendación: sí. No baja la dificultad en ningún caso medido y es lo que hace que el arranque deje de ser plano; el jugador hábil no recibe más daño.
2. **Radio de recogida del nivel 1: 150 px (recomendado) o 250 px.** Con 150 la primera carta del torpe llega a los 14,5 s y sigue habiendo que moverse; con 250 llega incluso sin moverse (22,6 s). 250 es más ayuda de la necesaria.
3. **¿El cambio vale para todas las expediciones o solo para la primera?** Recomendación: todas. Es la misma regla siempre, el veterano gana 3,5 s hasta su primera carta y nada más, y evita un caso especial en el código y en las pruebas.
