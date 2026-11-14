# SPEC T-F1-03: ritmo de los primeros 90 segundos de la expedición

Estado: **borrador en curso**. Autor: diseño de balance. Fecha: 2026-11-14.
No toca código del juego: es una especificación para el programador.

Leyenda: [M] medido por mí en esta tarea, [H] heredado de otro documento y aún sin verificar aquí, [C] leído en el código, [I] inferido.

## 0. Estado de este documento

| Sección | Estado |
|---|---|
| 1. Medición del estado actual | Bosque: hecho (n=24, 3 perfiles; partida entera n=16). Otros 5 biomas: en curso |
| 2. Diagnóstico con archivo:línea | Hecho |
| 3. Objetivos de ritmo | PENDIENTE |
| 4. Cambios antes -> después y validación | PENDIENTE (variantes en medición) |
| 5. Lista para el programador, pruebas, riesgos, preguntas | PENDIENTE |

## 1. Medición del estado actual

### 1.1 Método [M]

- Bot propio por pasos, fuera del repo (`pace_bot.js`, basado en `tools/card-swarm-bot/diff_bot.js`): `?dev=1&nosw=1&reset=1&god=0&dbg=1&direct=1&nointro=1&speed=0&seed=<s>&dq=alta&biome=<b>`, avanza con `G.step()`. Cuenta nueva (sin `all=1` ni `hand=`): la mano inicial es la de un jugador que empieza. Calidad ALTA.
- Semillas fijas 1..n. Se mide en tiempo de expedición (`G.runT`): el tiempo dentro de la ventana de cartas no cuenta. Sin muerte: la vida se repone cada tick y el daño se lee de `G.dbg.dmg` (daño bruto que habría recibido).
- Tres perfiles de movimiento:
  - **quieto**: no se mueve nunca (el "bot pasivo" del plan; peor caso de torpeza).
  - **novato**: cambia de dirección al azar cada 1,3 s (como el "novato" de `SPEC-T-F1-02-04.md`); no busca gemas.
  - **recolector**: va a la gema de XP más cercana y se aparta del enemigo que esté a menos de 70 px.
  - Los tres eligen la carta que completa una fusión si la hay ("FUSIONAR YA"); si no, la primera.
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

Ceniza al llegar al jefe: 1413 ± 16. Daño bruto recibido en toda la expedición: 499 ± 32. A los 180 s el recolector tiene 206 de XP y el nivel 7 pide 216: está a 10 de XP de subir, así que cualquier XP extra en el arranque se nota en el nivel del minuto 3.

### 1.4 Otros biomas

En curso.

## 2. Diagnóstico

Causa principal [M + C]: **el básico mata más rápido de lo que el director ofrece, y lo hace lejos**. No es falta de daño enemigo ni de vida.

| # | Causa | Dato | Dónde |
|---|---|---|---|
| D1 | Oferta por debajo de la capacidad de matar | Director: `bp(m) = 2 + 1,6 m` puntos por pulso de 1,5 s, es decir 1,33 Corderos/s en el segundo 0 y 2,4 puntos/s en el 60. Básico: un disparo cada 500 ms que mata al Cordero de un golpe (10 x 3,43 de daño contra 14 de vida) = 2 bajas/s. Medido: 7,6 bajas en 0-10 s, 14-20 por tramo después, iguales en los tres perfiles | `src/main.js:108`, `src/waves.js:139-144`, `src/fusion.js:16`, `src/main.js:100`, `src/main.js:35` |
| D2 | Los enemigos mueren antes de llegar | Aparecen a 500-580 px, andan a 70 px/s (7-8 s de camino) y el básico alcanza a 440 px. De uno en uno no llega ninguno: 0 de daño de Cordero al perfil quieto en 180 s | `src/waves.js:15`, `src/main.js:35`, `src/fusion.js:19` |
| D3 | Goteo sin forma | El director reparte de uno en uno, en ángulos al azar alrededor del jugador. No hay grupos hasta los packs del 2:45; nada obliga a moverse | `src/waves.js:177-189`, packs en `src/waves.js:158-159` |
| D4 | Un solo tipo hasta los 45 s | Solo Cordero (`from: 0`); Zarzal menor a los 45 s, Zarzal mayor a los 90 s, Jabalí a los 120 s. El primer enemigo que puede herir a un jugador quieto es el Zarzal | `src/families.js` (familia del Bosque, `from`), `src/main.js:35-38` |
| D5 | La primera carta depende de saber que hay que recoger | Nivel 2 con 6 de XP = 12 gemas de Cordero (0,5 de XP cada una). Las bajas caen a 300-440 px y el radio de recogida es 60 px: el recolector tarda 14,3 s, el novato 35,1 s, el quieto 82,6 s. A los 30 s el quieto tiene 30 gemas en el suelo sin recoger | `src/main.js:143-144` (`xp.first`, `gemMul`), `src/main.js:31` (`pickup`), `src/combat.js:400` |
| D6 | Cada carta nueva vacía la pantalla | Tras la primera fusión (14 s) y la segunda carta (50 s) los vivos bajan de 10,4 a 4,7 y el % sin nada que hacer sube al 83 %: el poder crece a saltos y la oferta en línea recta | `src/main.js:108` frente a `src/fusion.js` |
| D7 | El tope de enemigos no interviene | `cap(m) = 30 + 10 m` y el máximo medido es 13: subir `cap` no cambia nada en el arranque | `src/main.js:109`, `src/waves.js:145` |

Lo que **no** es causa [M]: la cadencia de aparición del primer enemigo (primera baja a los 3,3 s) y el momento de la primera carta del recolector (14,3 s, ya dentro del objetivo de 20 s del plan).

## 3-5. Pendiente
