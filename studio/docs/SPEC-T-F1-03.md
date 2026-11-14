# SPEC T-F1-03: ritmo de los primeros 90 segundos de la expedición

Estado: **borrador en curso**. Autor: diseño de balance. Fecha: 2026-11-14.
No toca código del juego: es una especificación para el programador.

Leyenda: [M] medido por mí en esta tarea, [H] heredado de otro documento y aún sin verificar aquí, [C] leído en el código, [I] inferido.

## 0. Estado de este documento

| Sección | Estado |
|---|---|
| 1. Medición del estado actual | PENDIENTE (bot en preparación; todavía no hay ninguna cifra mía) |
| 2. Diagnóstico con archivo:línea | Parcial: solo lo leído en el código |
| 3. Objetivos de ritmo | PENDIENTE (dependen de 1) |
| 4. Cambios antes -> después y validación | PENDIENTE |
| 5. Lista para el programador, pruebas, riesgos, preguntas | PENDIENTE |

## 1. Medición del estado actual

Pendiente. Cifras heredadas, sin verificar todavía [H] (`studio/docs/PLAN-MAESTRO.md`, `studio/docs/SPEC-T-F1-02-04.md:41-48`):

- En los primeros 100 s nunca hubo más de 6 enemigos vivos; la vida bajó de 100 a 93 con un bot pasivo.
- Primera oferta de carta a 15,6 s (recolector) y 55,7 s (novato que solo esquiva).
- Primera fusión a 18,2 s / 58,3 s.

Método previsto: bot por pasos (`G.step()`, `?speed=0`, `?seed`, `?dev=1`, calidad ALTA), semillas fijas, dos perfiles (pasivo y recolector), sin muerte para poder comparar curvas completas; métricas por tramo de 10 s.

## 2. Diagnóstico (solo código, por ahora)

- [C] Presupuesto de aparición: `bp(m) = (2 + 1,6 m) x ...` por pulso de 1,5 s (`games/card-swarm/src/main.js:108`); el director acumula como mucho 2,5 pulsos (`src/waves.js:144`) y el primer pulso llega a 1,5 s (`src/waves.js:139-140`). En el segundo 0 eso son 2 puntos por pulso = 2 Gusanos cada 1,5 s (coste 1, `src/main.js:35`); en el segundo 60, 3,6 puntos.
- [C] Hasta el segundo 45 el único tipo es el Gusano (`from: 0`); Arquero a 45 s, Abanico a 90 s, Jabalí a 120 s (`src/main.js:35-38`). El tope global (`cap(m) = 30 + 10 m`, `src/main.js:109`) no interviene al principio: el límite real es el presupuesto.
- [C] Gusano: 14 de vida, velocidad 70 px/s, aparece a 500-580 px (`src/waves.js:15`): tarda unos 7 s en llegar al jugador (190 px/s), que además lo deja atrás sin esfuerzo.
- [C] Ataque básico: 10 de daño cada 500 ms (`src/fusion.js:16`) con `cardDmgMul` x3,43 (`src/main.js:100`). [I] Mata a un Gusano de un golpe, 2 bajas/s posibles frente a 1,33 apariciones/s: el jugador nunca se ve superado en el primer minuto.
- [C] XP: nivel 2 con 6 de XP (`xp.first`, `src/main.js:143`), cada gema de Gusano vale 1 x 0,5 = 0,5 (`gemMul`), es decir 12 gemas de Gusano; nivel 3 con `26 + 0,9 x 4 = 30` de XP (60 gemas de Gusano). Radio de recogida 60 px (`src/main.js:31`).

## 3-5. Pendiente
