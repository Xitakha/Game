# Swarm Hand - Diseño v4: Jefes de verdad (estilo Monster Hunter / Hades)

Estado: DISEÑO para implementar, sin código. Amplía `DESIGN-v2.md` (enemigos, regla de legibilidad) y `DESIGN-v3-aldea.md` (aldea, árbol, economía; allí "jefes mayores" y "Peligro I-V" estaban fuera de alcance: esta es la hoja de ruta para recuperarlos). Las cifras son punto de partida y se afinan con el bot (`?dbg=1&speed=4`).

**Feedback del dueño:** el Pastor se siente "un monstruo más en el tablero". Quiere jefes MASIVOS, con mucha vida y varias habilidades/fases.

**Diagnóstico con números (estado actual):**
- Pastor: 1400 HP, sprite 96x96 (3x un gusano de 32x32), `r` 24, un solo ciclo de 3 ataques cada 2,5 s, 2 fases (la fase 2 solo sube la cadencia y añade espinas/esporas).
- Una mano buena hace 150-250 dps contra enjambre. Contra un único objetivo (todos los proyectiles impactan, pero las áreas no se multiplican) estimamos **~80 dps efectivos** a los 7:30. 1400 HP / 80 = **17 s**. Eso es lo que se siente como "un bicho más".
- El jefe no tiene arena propia, ni partes, ni ventanas, ni presencia (sin intro, barra de vida pequeña de 14 px, misma música sin fases).

---

## 1. Principios del "jefe de verdad" cuando el jugador no ataca

El jugador solo se mueve (190 px/s) y las cartas disparan solas. Por tanto el reto NO puede ser "acertar golpes": tiene que ser **dónde estás, cuándo te mueves y qué te pones delante**. Diez reglas:

1. **Lectura de patrones.** Cada ataque tiene un nombre, una forma de telegrafía única y un sonido de aviso. El jugador debe poder decir "ahora viene la embestida" por la silueta de la telegrafía antes de ver al jefe.
2. **Regla de esquiva (obligatoria).** `telegrafía_ms >= 250 + 1000 * (distancia_a_la_salida_px / 190)`. Ejemplo: un salto con radio 120 pide >= 250 + 1000*130/190 = 930 -> usar 1000 ms. Los ataques de 25+ de daño nunca bajan de 800 ms. Reacción humana estimada: 250 ms. Peligro puede acortar la telegrafía como máximo -15 %, nunca por debajo de 600 ms en ataques grandes (solo 400 ms en los pequeños, igual que v2).
3. **Alternancia cerca / lejos (clave del juego).** Las cartas de proyectil alcanzan 300-460 px, pero orbitales, auras y pulsos (45-85 px) exigen estar pegado al jefe. Cada jefe mezcla ataques con **zona segura interior** (rosquilla: pegado al cuerpo no te toca) y **zona segura exterior** (lejos no te toca). Así ninguna build "gana gratis" y las builds de aura tienen su momento de gloria bailando junto al jefe.
4. **Arena que cambia.** Obstáculos (pilares, troncos, islas), peligros de suelo (lava, esporas, agua) y eventos de fase (marea de lava, fuego perimetral). Los pilares bloquean proyectiles enemigos (cobertura estilo Hades) y se destruyen con embestidas: la arena cambia sola durante el combate.
5. **Fases con puerta.** Al cruzar el umbral de HP el jefe se vuelve **inmune 3,0 s** (usa el flag `e.immune` que ya respeta `Combat.deal`), ruge, cambia de patrón y la arena muta. Además el HP no baja del umbral (`floor`) hasta que dispare la transición: esto garantiza una **duración mínima** aunque la build sea absurdamente fuerte.
6. **Ventanas de daño (el "castigo").** Tras ciertos ataques el jefe queda expuesto 1,5-5 s: recibe x1,25-x2 de daño (señal: aro dorado + "destello" en el cuerpo + sonido de campana). Es la contraparte de la telegrafía: sobrevivir a un ataque grande = recompensa. Se calibra para que las builds flojas necesiten las ventanas y las fuertes las aprovechen.
7. **Partes rompibles (MH).** Cada jefe tiene 3 partes con su propio medidor de rotura. Al romperse: (a) `derribo` de 3 s con x1,3 de daño, (b) cambian o se pierden ataques concretos, (c) suelta un corazón y un **trofeo** (parte rara exclusiva, conecta con el crafteo: ver 3.x y 4.5). Las partes cuentan como "enemigos hijos" para que las cartas con puntería automática las apunten solas si estás cerca de ellas: **colocarse junto a la cola/cuerno es una decisión posicional**.
8. **Debilidad elemental por etiqueta.** Cada jefe tiene 1-2 etiquetas débiles (x1,25) y 1-2 resistencias (x0,8 / x0,6). Se muestran como iconos junto a la barra. Premia las builds especializadas y crea la conversación "para el Karceron me hace falta Hielo". Los estados (quemadura/veneno) ya hacen la mitad de efecto en jefes (`C.slow` x0,5, aturdir ignorado): se mantiene.
9. **Enrage y "ataque desesperado".** A los 150 s de combate entra la **Furia progresiva** (+25 % daño y cadencia, luego +10 % cada 15 s, tope +100 %). A ~8 % de HP el jefe lanza su **ataque desesperado** (8-10 s, 100 % esquivable, jefe vulnerable x1,25 mientras lo lanza): final de película y riesgo/recompensa.
10. **Adds controlados, nunca inundar.** Máx. 4 adds de jefe vivos a la vez (6 en Peligro V). Los adds son siempre tipos ya existentes y sirven a un propósito (cortar el kiteo, cebar el área), no relleno. Durante las fases especiales se **para** el spawn normal (ver 5.4).

### 1.1 Cómo evitar que sea una esponja de HP
- La duración la dan **las mecánicas**, no los números: fases con puerta (mínimo ~15 s por fase), ventanas y partes. El HP solo decide cuánto dura "el resto".
- **Duración objetivo por jefe: 90-150 s** para una build mediana (p50). Build fuerte (p75): >= 60 s (suelo garantizado por las 3 puertas de fase). Build floja (p25): ~170-190 s con Furia, ganable pero tensa.
- **Daño por segundo contra jefe (DPS_ref), a medir con el bot:**

| Momento | p25 (floja) | p50 (media) | p75 (buena) |
|---|---|---|---|
| 3:30 (miniboss) | 15 | 25 | 45 |
| 5:30 (miniboss) | 30 | 50 | 90 |
| 7:30 (jefe final, run de 9 min) | 45 | **80** | 140 |

- **Fórmula de HP:** `HP = DPS_ref(p50) x exposición x T_objetivo`, con `exposición = 0,75` (el 25 % del tiempo el jugador esquiva/reposiciona y las cartas no llegan) y `T_objetivo = 100-120 s`. Para el jefe final: 80 x 0,75 x 110 = **6600**; se redondea por jefe (6000 / 7500 / 6600) según su exposición real (Karceron se mueve poco y es más fácil de alcanzar -> más HP; el Pastor persigue -> menos).
- **Escala por duración (7/9/10 min):** el DPS_ref cambia porque hay menos/más niveles: x0,75 / x1,00 / x1,10 (coincide con el factor de botín de `loot.js`). `HP = base x durMul`.
- **Escala por Peligro:** x1,00 / 1,15 / 1,30 / 1,50 / 1,75 (I-V). Se compensa con builds mejores (el árbol de forja avanzado), que es el motivo de existir de Peligro.
- **El jefe NO escala por minuto** (igual que hoy) y la Cacería (4.2) aplica x0,75.
- **Salvavidas para runs largas** (el jugador no regenera): +1 corazón (+12 HP) en cada transición de fase y en cada parte rota (hasta ~+90 HP en total si domina el combate).
- **Reloj:** al aparecer el jefe el cronómetro de la run se congela (`G.BOSS_T` sigue marcando la aparición). Ya no hay "9:00 como límite": el límite es la Furia. (En v2 el margen era 1:30; con combates de 90-150 s no cabe.)

---

## 2. Escala visual y presentación

### 2.1 Tamaño y construcción del sprite
- **Tamaño objetivo: 4-6x un enemigo normal.** Gusano = 32x32 finales; Escudero 48x48; élites 64x64. Jefe: **192-256 px finales** (base 96-128, rasterizado x2). Pantalla de juego 960x540: un jefe de 240 px ocupa ~44 % de la altura; no hace falta zoom, pero hay un **zoom de cámara opcional 0,9x** durante el combate para dar espacio de lectura (probar; si el escalado no entero emborrona el pixel-art, se deja en 1,0).
- **Multi-parte con anclajes (no un sprite monolítico).** Cada jefe es un conjunto de sprites pequeños (cuerpo, cabeza, brazos/cola/cuellos, accesorios) dibujados en orden de capas, con **pivote y ancla** por parte y animación por código (balanceo, respiración, golpes con interpolación y rotación). Ventajas: menos frames que dibujar, partes rompibles = simplemente se dejan de dibujar o cambian a su sprite `_broken`, y las partes sirven de hitbox hijas.
- **Hitboxes:** el cuerpo usa 1 círculo grande (`r` 70-95, hoy 24) y cada parte su círculo (`r` 22-34) que sigue a su ancla. Hurtbox contra el jugador de ataques de contacto = solo cuerpo.
- **Sombra grande:** elipse oscura (ancho = 0,9 x ancho del cuerpo, alto = 0,3 x, alpha 0,35) en `drawGround`; se encoge y oscurece cuando el jefe salta (sombra = telegrafía del salto).
- **Sacudidas de cámara** (usar `fx.shake(px, ms)`; opción de accesibilidad "reducir sacudidas" que las divide por 3): paso pesado 3 px/90 ms; golpe 6 px/180 ms; pisotón 8 px/220 ms; rugido de fase 10 px/600 ms; muerte 12 px/900 ms. Tope 12 px. Hit-stop de 80 ms al romper una parte y de 120 ms al morir (`fx.hit`).

### 2.2 Intro cinematográfica (3,5 s, primera vez no saltable; luego se salta pulsando tras 1 s)
| t (ms) | Qué pasa |
|---|---|
| 0 | Enemigos normales y proyectiles se congelan; el jugador es invulnerable y puede moverse. Barras negras de cine (48 px arriba/abajo) entran en 300 ms; la música baja a 30 %. |
| 0-800 | La cámara se desplaza al jefe y hace zoom 1,15 -> 1,0; el jefe emerge/aterriza (efecto de entrada propio de cada jefe, ver ficha). |
| 800-1800 | Aparece el nombre del jefe con efecto de barra de tinta: título grande (28 px) y subtítulo (14 px, "El Pastor Corrupto - Bestia del Rebaño"). Sonido grave. |
| 1800-2400 | Rugido: `fx.shake(10, 600)`, anillo de onda, hit-stop 80 ms, flash blanco del 20 %. La barra de vida se llena de izquierda a derecha en 600 ms. |
| 2400-3500 | Las barras de cine salen, la cámara vuelve al jugador, la música del jefe (fase 1) entra con golpe de tempo. Empieza el combate. |

### 2.3 Barra de vida grande (sustituye a la actual de 14 px)
- Ancho 640 px, alto 22 px, centrada arriba (y = 52). Marco decorado, nombre sobre la barra (18 px), título de fase a la derecha ("Fase II - Corrupción").
- **Segmentos de fase:** muescas verticales en los umbrales (65 % / 30 %...) con color de fase; los segmentos pasados se apagan.
- **Barra "fantasma"**: la parte de daño reciente se queda en color claro 400 ms y luego cae (da la sensación de golpe).
- **Marcas de partes (debajo de la barra):** 3 iconos de 16 px (cuerno, cayado...) con su medidor mini; se rompen con grieta y flash cuando el medidor llega a 0; al romperse quedan tachados en rojo.
- **Debilidades:** a la derecha, iconos de etiqueta existentes (x1,25 en verde, resistencia en gris con una flecha hacia abajo).
- **Ventana de daño:** la barra y el cuerpo pulsan en dorado y aparece la cuenta atrás de la ventana como arco fino bajo la barra.
- Barras de las partes: flotando sobre cada parte solo mientras está dañada (48 x 4 px).
- Los adds no tienen barra; el jefe siempre es la barra más grande de pantalla.

### 2.4 Música propia por fase
Una pista por jefe (a pedir a audio-designer) con 3 capas que se activan por fase y cambio de compás cuantizado (1 compás de crossfade); `Assets.music.setTrack('boss_<id>')` y `setIntensity(0.5 / 0.75 / 1.0)`. Al romper partes, un stinger corto (no corta la música). Pista de victoria de 2 compases. Detalle en la sección 7.2.

### 2.5 VFX de telegrafía (enormes y legibles)
Se mantiene el código de colores de v2 (rojo daño directo; azul hielo/ralentiza; verde ácido zonas persistentes; morado invocación) y se añaden reglas propias de jefe:
- **Naranja intenso con borde amarillo = lava / fuego persistente** (diferente del rojo plano de daño directo: el rojo es "esto te golpea ya"; el naranja es "el suelo está así un rato").
- **Dorado/blanco = ventana de daño** (nunca se usa para peligro).
- **Ataque firma (>= 25 de daño):** telegrafía con doble contorno y viñeta roja de 6 % en los bordes de pantalla que pulsa durante los últimos 300 ms; sonido ascendente 400->1200 Hz proporcional a la cuenta atrás.
- Formas disponibles (todas se dibujan por código con relleno de alfa creciente 0,12 -> 0,40 y contorno a 0,8, como `fan` y `drawZone` actuales): círculo, anillo con hueco, rosquilla (zona segura interior), cono, línea/rectángulo, abanico de líneas, rejilla de impactos.
- **Línea segura:** el último 25 % de la telegrafía el contorno se hace sólido y deja de seguir al jugador (fija el objetivo) para que el jugador sepa que ya no cambia.
- Proyectiles de jefe grandes (r 8-14), con estela y color propio; tope de 60 proyectiles enemigos simultáneos.

---

## 3. Roster: 3 jefes (uno por bioma)

Resumen:

| # | Jefe | Bioma | Identidad | HP base (9 min, Peligro I) | Duración objetivo p50 |
|---|---|---|---|---|---|
| 1 | **El Pastor Corrupto** (rediseño) | Bosque | Bestia que persigue, embiste y llama al rebaño. Combate dinámico, mucha carrera. | 6000 | ~100 s |
| 2 | **Karceron, el Carcelero de Brasa** | Cripta | Coloso de huesos y magma casi inmóvil. Arena con lava, cobertura y ventanas de pecho abierto. Estilo Hades. | 7500 | ~120 s |
| 3 | **Letea, la Hidra del Olvido** | Asfodelo | Tres cabezas con elementos distintos, cuerpo que se sumerge. Prioridad de objetivos y partes que rebrotan. | 6600 | ~110 s |

Convenciones de las fichas: daño en HP del jugador (100 base, el 1.er golpe de un ataque grande nunca pasa de 30); `cd` = enfriamiento mínimo de ese ataque; "cadencia" = pausa entre ataques (fase 1 / 2 / 3 abajo); daños de Peligro: +10 % por nivel sobre I (tope +40 %). Un ataque no se repite dos veces seguidas; los ataques firma se eligen con un "saco" (barajado) para no ser aleatorios injustos.

### 3.1 Tabla HP por duración y Peligro (todas las cifras = base x durMul x pelMul)

| Jefe | Duración | I (x1,00) | II (x1,15) | III (x1,30) | IV (x1,50) | V (x1,75) |
|---|---|---|---|---|---|---|
| Pastor (6000) | 7 min (x0,75) | 4500 | 5175 | 5850 | 6750 | 7875 |
| | 9 min (x1,00) | 6000 | 6900 | 7800 | 9000 | 10500 |
| | 10 min (x1,10) | 6600 | 7590 | 8580 | 9900 | 11550 |
| Karceron (7500) | 7 min | 5625 | 6470 | 7310 | 8440 | 9840 |
| | 9 min | 7500 | 8625 | 9750 | 11250 | 13125 |
| | 10 min | 8250 | 9490 | 10730 | 12380 | 14440 |
| Letea (6600) | 7 min | 4950 | 5690 | 6435 | 7425 | 8660 |
| | 9 min | 6600 | 7590 | 8580 | 9900 | 11550 |
| | 10 min | 7260 | 8350 | 9440 | 10890 | 12710 |

Las partes tienen HP como % del HP total del jefe en ese momento (se recalcula al spawnear): así escalan solas.

---

### 3.2 JEFE 1 - EL PASTOR CORRUPTO (Bosque) - rediseño

**Lore (1 línea):** El pastor que cuidaba el rebaño bebió la ceniza del incendio y ahora el rebaño es su carne: lo guía con un cayado que ya no es de madera.

**Silueta:** centauro-carnero. Cuerpo cuadrúpedo de carnero enorme, lana negra con púas moradas en el lomo, y sobre él el torso encapuchado del pastor. Cuernos enroscados grandes que enmarcan la cabeza (silueta reconocible en negro), cayado gigante con farol corrupto. Paleta: lana carbón `#2a2430`, púas moradas `#8a3aa8`, ojos y farol naranja `#ff9a2a`, ropa granate `#6a1f2f`. **Tamaño:** huella 200 x 190 px finales (cuerpo 192x144 + cuernos y cayado que sobresalen). `r` cuerpo 74. Velocidad F1 65 / F2 80 / F3 95 px/s (el jugador va a 190). **Entrada:** salta desde fuera de cámara y aterriza en el centro (sombra creciente 800 ms, onda de impacto sin daño, polvo).

**HP:** 6000 (tabla 3.1). **Arena:** 6 troncos grandes (`r` 28, obstáculos que bloquean proyectiles; se destruyen al chocar con la embestida del jefe tras dejarlo aturdido).

**Fases**
| Fase | HP | Nombre | Cadencia entre ataques | Qué cambia |
|---|---|---|---|---|
| F1 | 100-65 % | El Rebaño | 2,8 s | Ataques 1-5 y 6. Spawn normal al 25 % solo tipos ligeros. |
| F2 | 65-30 % | La Corrupción | 2,3 s | Añade 7 (Esporas). Aparecen espinas en los bordes (zonas verdes lentas que reducen el espacio). Transición inmune 3 s con 2 corazones. |
| F3 | 30-0 % | Cenizas | 1,9 s | Añade 8 (Estampida). El perímetro arde: el área jugable se reduce un 15 % en 20 s (llama naranja en el borde, daño 10/400 ms). Spawn normal 0. Transición inmune 3 s con 2 corazones. |
| Desesperado | < 8 % | Éxtasis del Rebaño | - | Ataque final (ver abajo). |

**Ataques**
| # | Nombre | Fases | Telegrafía | Patrón | Daño | cd | Cómo se esquiva |
|---|---|---|---|---|---|---|---|
| 1 | Barrido de cayado | F1-F3 | 800 ms (cayado se alza, arco rojo 180 grados, alcance 190) | Arco frontal que gira hacia el jugador los primeros 500 ms y se fija. | 24 | 5 s | Moverse detrás del jefe o salir del alcance. Rosquilla: alcance mínimo 40, pegarse al cuerpo trasero es seguro. |
| 2 | Embestida del carnero | F1-F3 | 900 ms (cuernos bajan, rectángulo rojo 90 x 520 px) | Carga a 520 px/s en línea recta. Si choca con tronco/pared: aturdido 2,4 s (**ventana x1,35**). | 30 | 9 s | Esquivar lateral en cuanto se fija la línea (últimos 300 ms). Colocar un tronco entre ambos: el tronco se rompe y el jefe se aturde. |
| 3 | Pisotón sísmico | F1-F3 | 700 ms (cuerpo se eleva, anillo rojo creciente) | Dos ondas anulares con 0,4 s de separación, velocidad 200 px/s, grosor 24 px, con **hueco de 60 grados** visible en la telegrafía. | 20 | 8 s | Atravesar el hueco o alejarse a más de 300 px (alejarse a 190 px/s basta contra 200). |
| 4 | Salto aplastante | F1-F3 | 1000 ms (la sombra del jefe cae sobre el jugador, círculo rojo r 120) | Salta al sitio donde estaba el jugador al inicio y cae. Deja 6 espinas decorativas 3 s (sin daño en F1). | 30 | 10 s | Salir del círculo en 700 ms; la sombra fija la posición a 250 ms del impacto. Tras caer: **ventana x1,25 de 1,5 s** (clava el cayado). |
| 5 | Abanico de espinas | F1-F3 | 600 ms (cono rojo 70 grados) | F1: 7 espinas; F2: 9; F3: 11, vel. 220 px/s, 3 anillos en F3. | 10 c/u | 6 s | Cobertura (los troncos las bloquean) o moverse perpendicular por los huecos. |
| 6 | Llamada del rebaño | F1-F3 | 800 ms (anillo morado, aullido) | Invoca 2 enemigos de {Espinoso, Escudero, Polilla} con telegrafía de aparición morada de 800 ms. F3: 3. Tope 4 adds de jefe vivos. | 0 (los adds hacen su daño) | 22 s | Cortar: romper el Cayado cambia a gusanos (ver partes). |
| 7 | Esporas del Rebaño | F2-F3 | 1000 ms (3 círculos verdes punteados r 60 que se cierran) | 3 zonas en triángulo a 140-200 px del jugador, activas 6 s, 8 de daño/500 ms y ralentiza 15 %. | 8/tick | 12 s | Salir del círculo; las zonas limitan el kiteo (cierran un lado de la arena). |
| 8 | Estampida | F3 | 700 ms la 1.a línea | 3 embestidas encadenadas con re-aim de 500 ms entre ellas (cada una 90 x 420 px). Termina aturdido 2,0 s (ventana x1,35). | 24 c/u | 14 s | Mover perpendicular tres veces; usar troncos como escudo. |

**Ataque desesperado - Éxtasis del Rebaño (< 8 % HP):** el Pastor clava el cayado en el centro (rugido, 10 px shake) y durante 9 s la arena se tiñe de morado: cada 1,3 s sale una **oleada de anillos de espinas con 2 huecos de 45 grados** (velocidad 170 px/s, 10 daño) desde el cayado, rotando 20 grados por oleada; el jefe está quieto y **vulnerable x1,25**. Si el jugador mata al jefe durante el éxtasis, todo se detiene con un "congelado" de 400 ms antes de la muerte.

**Partes rompibles** (medidor de rotura = % del HP del jefe)
| Parte | Medidor | Efecto al romperse (además de derribo 3 s x1,3 y corazón) | Trofeo |
|---|---|---|---|
| Cuernos (cabeza) | 9 % | Embestida (2/8) pierde el empuje y el aturdimiento solo ocurre contra tronco, ya no contra pared; el hocico queda a la vista (diseño: más fácil alcanzar la cabeza). | **Cuerno del Pastor** |
| Cayado (mano) | 8 % | La Llamada del rebaño solo invoca gusanos y se alarga a 30 s; Barrido de cayado se sustituye por un golpe de puño corto (alcance 110, 18 de daño). | **Cayado Astillado** |
| Vellón (lomo) | 11 % | Mientras el Vellón está intacto el cuerpo recibe x0,8 (lana gruesa). Al romperse, el jefe recibe x1,0 en el cuerpo y las Espinas (5) pierden 2 espinas; el lomo queda ardiendo (efecto visual de brasas). | **Vellón Calcinado** |

**Debilidades:** Fuego x1,25 (lana inflamable; F1-F2) y Acero x1,25 (esquila, F3). **Resistencia:** Veneno x0,8 (carne corrupta).

**Condiciones.** Victoria: HP 0 (se matan todos los adds en silencio, se limpian zonas, como hoy). Derrota: HP del jugador 0. Furia a los 150 s.

**Recompensa:** 150 Brasas + 40 por parte rota (hasta 270); 1 Esencia segura (como hoy); hasta 3 trofeos (uno por parte rota antes de la muerte); PF 2 (3 la 1.a vez, como en v3). Garantizados: `{fang:2, thread:2, feather:1}` (v3).

---

### 3.3 JEFE 2 - KARCERON, EL CARCELERO DE BRASA (Cripta)

**Lore:** Custodió las puertas de la cripta durante mil años; la ceniza del rebaño lo despertó con hambre y ahora cada preso que se escapa alimenta su fuego.

**Silueta:** torso de esqueleto gigante que emerge de un charco de magma. Dos brazos enormes (izquierdo con grillete y cadena, derecho con una maza de piedra), caja torácica abierta con un núcleo naranja que late, cráneo con corona de cuernos pequeños. Paleta: hueso `#d8cfae`, magma `#ff6a1a`, lava amarilla `#ffd23a`, fondo oscuro violeta `#201a2e`, cadenas hierro `#6b7385`. **Tamaño:** 256 x 224 px finales (cuerpo 192x160 + brazos 80x112 cada uno). `r` cuerpo 90. **Casi inmóvil:** se arrastra entre 3 puntos de anclaje a 25 px/s (la arena se juega alrededor de él). **Entrada:** surge del suelo (la lava se abre, 700 ms de temblor y 4 grietas rojas crecen, luego sube el torso).

**HP:** 7500. **Arena:** 4 pilares de hueso (`r` 30, 300 HP, bloquean proyectiles, los destruyen sus brazos y se reconstruyen cada 40 s con aviso), 2 charcos de lava fijos (`r` 70, 10 de daño/400 ms, naranja con borde amarillo) y 3 islas de piedra seguras para la fase 3 (`r` 120).

**Fases**
| Fase | HP | Nombre | Cadencia | Qué cambia |
|---|---|---|---|---|
| F1 | 100-65 % | Despertar | 3,0 s | Ataques 1-3, 5, 6. Spawn normal 25 %. |
| F2 | 65-30 % | La Fragua | 2,4 s | Añade 4 (Aliento), 7 (Penitentes). El borde de la arena se llena de lava (margen 100 px). Transición inmune 3 s, 2 corazones. |
| F3 | 30-0 % | Marea de lava | 2,0 s | Añade 8 (Marea). Cada 25 s el 60 % de la arena se inunda 8 s, solo las 3 islas son seguras. Spawn normal 0. Transición inmune 3 s, 2 corazones. |
| Desesperado | < 8 % | Réquiem de Fuego | - | Final (abajo). |

**Ataques**
| # | Nombre | Fases | Telegrafía | Patrón | Daño | cd | Cómo se esquiva |
|---|---|---|---|---|---|---|---|
| 1 | Martillazo de cadenas | F1-F3 | 900 ms (círculo rojo r 90 con la sombra de la maza) | Golpea el punto donde estaba el jugador; deja grieta 2 s (borde, sin daño). Tras el golpe la maza queda clavada 1,2 s (**ventana x1,25** en el brazo derecho). | 28 | 6 s | Salir del círculo; moverse al lado contrario de la maza. |
| 2 | Barrido de grilletes | F1-F3 | 1000 ms (rosquilla roja: radio interior 110, exterior 340, en arco de 140 grados) | El brazo izquierdo barre un arco; **zona segura interior** (pegado al torso) y exterior. | 26 | 9 s | Entrar hasta el cuerpo (premia builds de aura) o salir a más de 340. |
| 3 | Lluvia de brasas | F1-F3 | 900 ms por impacto (círculos naranja-rojos r 55) | 6 meteoros escalonados cada 250 ms: los 3 primeros sobre el jugador y su trayectoria, los otros 3 sobre posiciones aleatorias. Deja 2 charcos de brasas pequeños 3 s. | 18 | 7 s | Moverse continuo; no quedarse quieto. |
| 4 | Aliento de magma | F2-F3 | 1100 ms (cono rojo 50 grados, alcance 560) | Cono que barre 40 grados a 30 grados/s durante 1,2 s, 40 dps efectivos (ticks de 8/200 ms). | 8/tick | 12 s | Correr tangencial más rápido que el barrido (190 px/s vs ~200 px de arco a 400 px). Los pilares bloquean el cono. |
| 5 | Estallido de costillas | F1-F3 | 700 ms (12 líneas rojas finas desde el torso) | 12 púas de hueso (vel. 250 px/s) salen radiales; en F2 se repiten 2 veces con giro de 15 grados; en F3 3 veces. | 12 c/u | 8 s | Quedarse entre dos líneas o detrás de un pilar. |
| 6 | Erupción del núcleo (**ventana**) | F1-F3 | 900 ms (anillo rojo r 250, pecho se abre) | Pulso de onda (r 250) y el pecho queda abierto 4 s: el **Núcleo de Lava** (parte, `r` 34) recibe x2,0 y la barra se pone dorada. Ataca con 1 Estallido al cerrarse. | 20 | 20 s | Salir del anillo (250 px = 1,3 s de carrera + 900 ms: telegrafía 1200 ms si estás pegado). Luego entrar a castigar. |
| 7 | Liberar Penitentes | F2-F3 | 800 ms (grilletes brillan, 4 círculos de aparición morados) | Invoca 2 Ascuas (F2) o 2 Ascuas + 1 Espectro (F3). Tope 4 adds. | 0 | 18 s | Priorizar áreas; el Espectro tiene telegrafía propia. |
| 8 | Marea de lava | F3 | 2000 ms (el suelo se agrieta; 3 islas se iluminan en blanco) | Inunda el 60 % de la arena 8 s (naranja con borde amarillo, 12 de daño/400 ms). Siempre 3 islas seguras con espacio para el jugador. | 12/tick | 25 s | Ir a una isla (la más cercana al jugador). Cuenta atrás visible en el borde. |

**Ataque desesperado - Réquiem de Fuego (< 8 %):** el Carcelero se hunde un instante y toda la arena se inunda salvo las 3 islas, que se encogen un 10 % por segundo durante 8 s hasta `r` 70. Cae una Lluvia de brasas continua (1 impacto por segundo, r 50) sobre las islas. El jefe está expuesto (pecho abierto, x2,0 en el núcleo). Si el jugador no llega a una isla muere por lava: **siempre hay una isla a menos de 280 px de cualquier punto** (verificar en las pruebas).

**Partes rompibles**
| Parte | Medidor | Efecto al romperse | Trofeo |
|---|---|---|---|
| Brazo-Maza (derecho) | 10 % | Pierde Martillazo (1); el brazo cae y forma un nuevo obstáculo/cobertura; pasa a usar Barrido con muñón (alcance 200, 22 de daño). | **Nudillo de Magma** |
| Brazo-Grillete (izquierdo) | 9 % | Pierde Barrido de grilletes (2) y cae una zona de lava pequeña bajo el brazo; las cadenas dejan de proteger al núcleo: **Erupción dura 5,5 s en vez de 4**. | **Grillete Ardiente** |
| Núcleo de Lava (pecho) | 8 % (solo visible en ventana) | Se rompe en una Erupción: se acaba la Erupción y el jefe queda en derribo largo 5 s con x1,5 de daño, pero entra en **modo hambriento**: +20 % cadencia. | **Núcleo Latente** |

**Debilidades:** Hielo x1,25 (templa el magma, "Quebrado": F1-F2) y Rayo x1,25 (F3: las grietas se abren). **Resistencias:** Fuego x0,6, Veneno x0,5 (sin carne).

**Recompensa:** 160 Brasas + 40 por parte (hasta 280); 1 Esencia segura; hasta 3 trofeos; PF 2 (3 la 1.a vez). Garantizados nuevos: `{plate:2, wick:2, static:1}`.

---

### 3.4 JEFE 3 - LETEA, LA HIDRA DEL OLVIDO (Asfodelo)

**Lore:** Bebe del río del olvido; cada cabeza recuerda un pueblo que ya nadie nombra, y las tres lo cobran con colmillos.

**Silueta:** cuerpo de serpiente gruesa y ondulada que sale de un estanque, cola con aletas, tres cabezas sobre cuellos largos que se estiran en la arena. Paleta: cuerpo verde azulado `#2f6f6a`, vientre crema `#e8e4d4`, cabeza verde `#7be34a` (ácido), cabeza azul `#6ac8ff` (hielo), cabeza amarilla `#ffe45a` (rayo). **Tamaño:** cuerpo 224 x 128 px; cuellos de hasta 220 px, cabezas 64x64 finales. Huella ~300 x 220. `r` cuerpo 80; el cuerpo está casi fijo (se desplaza 30 px/s entre 2 charcos), las **cabezas** se mueven con muelles por los cuellos de 6 segmentos. **Entrada:** el estanque burbujea 800 ms, las 3 cabezas emergen una a una (300 ms de diferencia) y la tercera ruge.

**HP:** 6600. **Arena:** 3 charcos de agua (`r` 90, ralentizan 30 % al jugador sin daño; Letea se sumerge en ellos), 4 pilares de cristal (`r` 26, bloquean proyectiles y rayos; Rayo del cielo destruye 1 si cae sobre él), borde de la arena con orillas.

**Fases**
| Fase | HP | Nombre | Cadencia (por cabeza) | Qué cambia |
|---|---|---|---|---|
| F1 | 100-65 % | Tres memorias | 3,2 s | Ataques 1-4, 5. Una cabeza ataca cada 1,1 s (escalonadas). Spawn normal 25 %. |
| F2 | 65-30 % | Marea | 2,6 s | Añade 6 (Sumersión), 7 (Marea). Los charcos crecen un 20 %. Transición inmune 3 s con 2 corazones. |
| F3 | 30-0 % | Antídoto | 2,2 s | Añade 8 (Plañideras). **Muda su sangre**: la debilidad pasa a Veneno. Cabezas rotas rebrotan más rápido. Spawn normal 0. Transición inmune 3 s con 2 corazones. |
| Desesperado | < 8 % | Coro del Olvido | - | Final (abajo). |

**Ataques**
| # | Nombre | Fases | Telegrafía | Patrón | Daño | cd | Cómo se esquiva |
|---|---|---|---|---|---|---|---|
| 1 | Mordisco en picado | F1-F3 | 700 ms (cabeza se echa atrás, línea roja 70 x 320 px) | Una cabeza se lanza en línea recta hasta 320 px y vuelve. Si falla, queda **expuesta 1,0 s** (x1,25 a esa cabeza). | 22 | 4 s | Esquivar lateral; el golpe fijo en los últimos 250 ms. |
| 2 | Escupitajo ácido (cabeza verde) | F1-F3 | 900 ms (3 círculos verdes r 50 que se cierran) | 3 charcos ácidos activos 6 s, 8/tick de 500 ms, ralentiza 15 %. | 8/tick | 10 s | Salir del círculo, pensar en el espacio que ocupan. |
| 3 | Aliento helado (cabeza azul) | F1-F3 | 900 ms (cono azul 40 grados, alcance 420) | Cono estático 0,8 s, ralentiza 35 % durante 2 s. | 14 | 9 s | Salir del cono; combinado con otras cabezas, es la que hay que vigilar primero. |
| 4 | Rayo del cielo (cabeza amarilla) | F1-F3 | 1000 ms (4 círculos amarillos r 45 alrededor y delante del jugador, secuencial) | 4 rayos cayendo cada 250 ms; en F3 son 6 y siguen una línea hacia el jugador. | 22 | 10 s | Moverse a través de los huecos; los pilares de cristal absorben el rayo. |
| 5 | Coletazo | F1-F3 | 800 ms (rosquilla roja interior 110 / exterior 240) | Barrido 360 grados de la cola; **zona segura interior** (pegado al cuerpo) y exterior. | 24 | 8 s | Pegarse al cuerpo o alejarse a más de 240 px. |
| 6 | Sumersión | F2-F3 | 1000 ms (burbujas en el charco; marca roja r 140 donde emergerá) | Letea se hunde 2,5 s (inmune; las cabezas siguen vivas pero no atacan) y emerge bajo el jugador con una erupción. | 28 | 16 s | Salir de la marca roja; mientras está hundida, buen momento para romper cabezas. |
| 7 | Marea | F2-F3 | 1200 ms (flechas azules y banda roja de 90 px en un borde) | Ola de 90 px de ancho cruza toda la arena a 220 px/s, con 2 huecos de 100 px (pilares). | 20 | 18 s | Cruzar por un hueco o saltar a un pilar. |
| 8 | Plañideras | F3 | 800 ms (3 círculos morados) | Invoca 3 Polillas gélidas (tope 4 adds). | 0 | 20 s | Las polillas ralentizan: priorizar áreas. |

**Ataque desesperado - Coro del Olvido (< 8 %):** las 3 cabezas, ancladas en tres posiciones, cantan durante 9 s: cada 1,5 s una de ellas lanza su patrón (ácido / cono helado / rayos) en rotación, a mayor tamaño (+30 %); el cuerpo está expuesto (x1,25). Las cabezas rotas no cantan, así que **romper cabezas antes del coro lo hace más fácil**.

**Partes rompibles (las 3 cabezas)**
| Parte | Medidor | Efecto al romperse | Trofeo |
|---|---|---|---|
| Cabeza verde (ácido) | 8 % | Pierde Escupitajo (2); la herida **rebrota en 18 s** a menos que se cauterice con Fuego (daño de Fuego sobre la herida abierta 3 s); si rebrota, vuelve con 50 % de medidor. | **Colmillo Ácido** |
| Cabeza azul (hielo) | 8 % | Pierde Aliento helado (3); mismo rebrote. | **Perla Helada** |
| Cabeza amarilla (rayo) | 8 % | Pierde Rayo del cielo (4); mismo rebrote. | **Ojo Tormentoso** |

Si las 3 cabezas están rotas a la vez: **Cuerpo desnudo** (derribo largo 6 s, x1,5 y el cuerpo queda sin cobertura). Es la gran ventana del jefe.

**Debilidades:** Sangre x1,25 (herida abierta, F1-F2) y Veneno x1,25 (F3, tras mudar la sangre); Rayo x1,1 en el agua (charcos). **Resistencia:** Hielo x0,8 (agua fría).

**Recompensa:** 150 Brasas + 40 por cabeza (hasta 270); 1 Esencia segura; hasta 3 trofeos; PF 2 (3 la 1.a vez). Garantizados: `{spine:2, frost:2, fang:1}`.

---

### 3.5 Debilidades y trofeos conectan con el árbol (resumen)
Las 6 etiquetas quedan cubiertas: Fuego/Acero (Pastor), Hielo/Rayo (Karceron), Sangre/Veneno (Letea).
Cada jefe tiene 3 trofeos. **Cada trofeo cuenta como 1 Esencia** para los nodos T3/T4 (v3 B.1) de las dos etiquetas afines al jefe; así el jefe que castiga una etiqueta es el que da su Esencia (el jugador que quiere completar el árbol de Hielo va a cazar a Karceron). Trofeos extra desde Peligro IV (4.4).

---

## 4. Integración

### 4.1 Cuándo aparece
- **Jefe final:** a `G.BOSS_T` = 5/6 de la run (5:50 en 7 min; **7:30 en 9 min**; 8:20 en 10 min), como hoy. El bioma decide el jefe (bosque = Pastor, cripta = Karceron, asfodelo = Letea). Mientras vive el jefe el reloj de la run se congela. La música cambia a la del jefe tras la intro.
- **Cuenta atrás de aviso:** a 30 s del jefe, el HUD muestra "Jefe en 0:30" (ya existe) y el director deja de comprar élites nuevos.
- **Miniboss opcional a media partida (J3):** los élites actuales se elevan a "guardianes": **Coloso Escudero (3:30)**: HP 420 -> 700, 1 parte (**Escudo**, medidor 25 %: rompe el escudo frontal y deja de recibir x0,2) y una fase (<50 %: ciclo 2,6 s). **Madre Colmena (5:30)**: HP 520 -> 1050, 1 parte (**Abdomen**, medidor 20 %: la Eclosión pasa a soltar 3 gusanos en vez de 6 y deja una nube ácida). Sin intro larga: banner de 2 s y la barra grande. Cálculo: 25 dps x 0,7 x 40 s = 700; 50 x 0,7 x 30 = 1050. Recompensa: sin cambios (v2).

### 4.2 Cacería de jefe (encargo de Vesper)
- **Encargo nuevo en el Tablón:** "Cacería: El Pastor / Karceron / Letea". Aparece tras derrotar al jefe una vez en una run normal; permite repetirlo sin hacer los 7:30 de preámbulo.
- **Modo sin hordas** (`mode=hunt`): arena propia (la del bioma del jefe, 1200 x 700 para no perder el foco), **sin spawn de enemigos normales**; solo los adds propios del jefe + 1 "oleada de limpieza" ocasional de 3 gusanos cada 25 s para que las cartas de área tengan algo que hacer.
- **Preparación (60-75 s):** el jugador llega con su loadout (anclas) y juega **6 ofertas de carta seguidas** (como niveles 2-7, sin esperar a XP) para llenar la mano; luego entra el jefe. Equivale al DPS de ~minuto 4-5: **DPS_ref cacería = 55**. Por eso **HP de cacería = x0,75** de la base (Pastor 4500 en I) y la recompensa de partes del enjambre no existe.
- **Recompensa:** misma que el jefe en run (Brasas, trofeos, PF), pero **sin la Esencia segura ni PF repetidos** (los PF solo en el primer kill de cada jefe y por Peligro, ver 4.4), para que no sea un farmeo gratis. Los trofeos sí (es el objetivo de cacería): tiempo de cacería ~3-4 min en total.
- **"Practicar":** versión sin recompensa, sin Peligro, para aprender patrones (el jefe, con HP x0,5).
- **Dentro de la aldea:** Vesper dice "Hay una bestia que merece la pena. ¿Vamos?"; el panel muestra el icono del jefe, sus debilidades y las partes con trofeo.

### 4.3 Peligro I-V (por jefe; se desbloquea al vencer el nivel anterior de ese jefe)
Todo es acumulativo. Además de HP x1,00 / 1,15 / 1,30 / 1,50 / 1,75 y daño +10 % por nivel (tope +40 %).

| Nivel | Cambio de mecánica (genérico) | Ejemplo Pastor | Ejemplo Karceron | Ejemplo Letea |
|---|---|---|---|---|
| I | Base | - | - | - |
| II | +1 add en las invocaciones; telegrafías -10 % | Llamada del rebaño invoca 3 | Penitentes invoca 3 | Plañideras invoca 4 |
| III | 1 ataque nuevo o variante (el 4.º de cada fase) | Embestida doble (2 + 2) | Lluvia de brasas con 9 impactos | Rayo del cielo desde F1 con 6 rayos |
| IV | Furia a los 120 s; medidores de parte +30 %; derribos 2,4 s | Éxtasis dura 12 s | Marea de lava cada 20 s | Cabezas rebrotan en 14 s |
| V | Fase 4 "Último aliento" (7-3 % HP: dos ataques desesperados seguidos); tope de adds 6 | Dos éxtasis | Réquiem + Marea | Coro + Sumersión |

- **Recompensas por Peligro:** Brasas x(1 + 0,25 x (nivel - 1)), 1 PF extra la 1.ª vez en Peligro III y V (con el tope global de 24 PF intacto), a partir de Peligro IV cada parte rota suelta **2 trofeos**.
- **Recomendación de entrada:** DPS_ref >= 110 (árbol de forja con maestría) para Peligro IV-V. Mostrarlo en el Portal.

### 4.4 Director de spawn y jefes
`waves.js` hoy: con jefe el presupuesto baja a 40 % y solo permite `B.light`. Nuevo: cada fase del jefe declara `spawnMul` y `allow`.

| Momento | Spawn normal | Tipos permitidos | Tope normal en pantalla |
|---|---|---|---|
| Intro | 0 | - | congelados |
| F1 | x0,25 | gusano, arquero, bomba | 15 |
| Transición de fase (3 s) | 0 | - | - |
| F2 | x0,25 | gusano, arquero, espinoso | 15 |
| Ataque firma (telegrafía + ejecución) | pausa total | - | - |
| F3 | 0 (solo los adds del jefe) | - | 6 adds |
| Desesperado | 0 | - | 0 (limpia las zonas viejas con `kill(e, true)`) |
| Cacería | 0 salvo oleada de limpieza | gusano | 6 |
| Tras la muerte | `kill(e, true)` a todos como hoy | - | - |

Regla: nunca más de 4 adds del jefe + 15 normales vivos a la vez (19 enemigos máx.; en móvil, tope total de 40 entidades con jefe).

### 4.5 Conexión con el crafteo (v3)
- Trofeos = Esencia afín (3.5). Además "Trofeo" es un tipo de parte nuevo en `loot.js` (`L.PARTS`): 9 iconos nuevos en `assets_ui.js` (`UI.part`).
- Garantizados de `L.GUARANTEED` por jefe (listados en cada ficha).
- PF: Pastor 2 (3 la 1.ª vez); Karceron 2 (3 la 1.ª vez); Letea 2 (3 la 1.ª vez); +1 PF en Peligro III y V la primera vez que se vence cada uno. El tope de 24 PF no cambia.
- Encargos nuevos para el tablón: "Rompe el cuerno" (romper una parte concreta) y "Derrótalo sin que te alcance el Salto aplastante" (2.º ejemplo de condición, 2b).

---

## 5. Sistemas de código necesarios (para el programador)

1. **Modelo de jefe data-driven** (`src/bosses.js`): objeto por jefe con `hp`, `size`, `phases[]` (umbral, cadencia, ataques permitidos, spawnMul), `attacks{}` (telegrafía ms, forma, daño, cd, fase), `parts[]` (ancla, medidor %, efecto), `weak/resist`, `arena{obstacles, hazards, events}`, `loot`. `enemies.js` conserva `ai_boss` como adaptador mientras exista el jefe viejo.
2. **Partes como entidades hijas** en `G.enemies` con `e.part = { parent, anchor, hz, meter }`; así `Combat.nearest/inRange/chain` y orbitales funcionan sin cambios. En `Combat.deal`: (a) todo el daño de la parte también cuenta para el padre (pass 100 %), (b) multiplicador de parte (`hz` 1,15; núcleo x2,0 en ventana), (c) multiplicadores de debilidad/resistencia por etiqueta, (d) multiplicador de ventana, (e) flag `e.immune` en puertas de fase (ya respetado).
3. **Máquina de fases** (HP threshold + puerta inmune 3 s + `floor` de HP hasta que dispare la transición) y **máquina de ataque** (`tele -> act -> rec` con timeline por eventos; cuenta atrás visible para el HUD).
4. **Primitivas de peligro**: círculo, anillo con hueco, rosquilla, cono, línea/rectángulo, barrido, oleada, rejilla; cada una con `draw(telegrafía)`, `hit(jugador)` y `fija objetivo` a los últimos 25 %. Las `G.zones` actuales ya cubren círculos; añadir formas.
5. **Obstáculos** (`G.obstacles`: círculos): colisión del jugador, bloqueo de proyectiles enemigos, destrucción por embestida/brazos, reconstrucción.
6. **Eventos de arena** (lava creciente, marea, perímetro ardiendo, isla segura): capa de dibujo de suelo y chequeo de daño por casilla; la "isla segura a < 280 px" se valida en tests.
7. **Intro/cámara**: bloqueo de simulación de enemigos (`G.frozen`), barras de cine, zoom de cámara (`G.cam.zoom`), orquestador por línea de tiempo (tabla 2.2).
8. **HUD**: barra grande con segmentos, fantasma, marcas de parte, debilidades, ventana; barras de parte flotantes.
9. **Render multi-parte**: capas con pivote/ancla/rotación por parte; cache en canvas de cada parte rasterizada; cuellos de la Hidra como cadena de 6 segmentos con seguimiento (follow-the-leader). Sin `shadowBlur` (rendimiento).
10. **Director** (`waves.js`): `W.bossMode = {spawnMul, allow, cap}` por fase; pausa de spawn durante ataques firma.
11. **Loot/Save/Quests**: trofeos en `loot.js`; flags `bossKills[id]`, `peligro[id]`, `partsBroken`; encargo de cacería en `quests.js`; `?mode=hunt`.
12. **Depuración**: `?boss=pastor|karceron|letea`, `&phase=2`, `&hp=0.3`, `&danger=3`, `&nointro=1`, `&god=1`, `&dbg=1` (contador de daño recibido por ataque en `G.dbg.dmg`, ya existe por fuente).

---

## 6. Plan de implementación

### Fase J1 - Un jefe completo: Pastor rediseñado (~6-7 días)
Alcance: infraestructura + jefe 1 de punta a punta.
- Sistemas 1-9 y 12 de la sección 5 en su versión mínima (formas: círculo, anillo con hueco, cono, línea).
- Pastor: sprite multi-parte (8 partes), 3 fases + desesperado, **6 ataques** (Barrido, Embestida, Pisotón sísmico, Salto, Abanico, Llamada del rebaño; Esporas y Estampida entran en J1b si hay tiempo), 3 partes rompibles con trofeo y derribo, troncos en la arena, debilidades Fuego/Acero.
- Barra de vida grande, intro de 3,5 s, música con 3 capas, SFX de telegrafía y de rotura.
- HP 6000 (x durMul). Pruebas: ver criterios.
**Criterios de aceptación J1:**
1. Con `?boss=pastor&god=0` y una build p50 (bot), la duración está en 80-130 s; con p25 llega a Furia sin romper el juego; con p75 dura >= 60 s.
2. Todo ataque cumple la regla de esquiva (2): un humano que se mueve no recibe daño "gratis" (revisión con `?dbg=1`).
3. Máx. 4 adds de jefe y 60 proyectiles; 60 fps en un portátil medio y >= 40 fps en móvil de gama media (probar con `?speed=1`).
4. Romper cada parte cambia visiblemente el comportamiento y suelta su trofeo.
5. Transición de fase: 3 s de inmunidad, 2 corazones, rugido, cambio de música cuantizado.

### Fase J2 - Jefes 2 y 3 (~7-8 días)
- Karceron: obstáculos de hueso, lava, ventana de núcleo, Marea de lava, Réquiem. Sprite multi-parte (7 partes).
- Letea: cuellos de 6 segmentos, 3 cabezas con rebrote y cauterización, Sumersión, Marea de agua, charcos que ralentizan. Sprite (cuerpo, cola, 3 cabezas, 3 cuellos x 6 segmentos).
- Esporas y Estampida del Pastor, si quedaron fuera.
- Música y SFX de los dos jefes; trofeos (6 iconos más).
- Elección del jefe por bioma (`?biome=` y Portal).

### Fase J3 - Peligro y cacería dedicada (~4-5 días)
- Peligro I-V por jefe (tabla 4.3), selector en Portal y en el tablón de Vesper, desbloqueo por victoria.
- Modo cacería (`mode=hunt`), preparación de 6 ofertas, "Practicar", encargos de Vesper.
- Miniboss opcionales (Coloso Escudero y Madre Colmena con partes).
- Balance con bot (16 runs por jefe y por Peligro), ajuste de `DPS_ref` y de HP.

### 6.1 Assets nuevos (para asset-scout / artista; todo se genera por código en el estilo vectorial de `assets.js`; contorno `#1b1124`, rasterizado x2)
Nombres, tamaños base (final x2):

**Pastor Corrupto** (`assets_boss_pastor.js`)
| Nombre | Base (final) | Frames |
|---|---|---|
| `boss_pastor_body` | 96 x 72 (192 x 144) | 2 (idle respiración) + 4 (piernas/trote, se usan como `boss_pastor_leg` sobre ancla) |
| `boss_pastor_leg` | 20 x 36 (40 x 72) | 4 (ciclo de trote) |
| `boss_pastor_torso` | 48 x 56 (96 x 112) | 3 (idle, wind-up de cayado, golpe) |
| `boss_pastor_head` | 32 x 32 (64 x 64) | 3 (neutro, rugido, daño) |
| `boss_pastor_horn_l` / `_r` | 24 x 32 (48 x 64) | 2 (entero, roto) |
| `boss_pastor_staff` | 20 x 88 (40 x 176) | 2 (entero, roto) + faro con 2 frames de brillo |
| `boss_pastor_fleece` | 56 x 40 (112 x 80) | 2 (entero, roto/brasas) |
| `boss_pastor_eyes` | 12 x 6 | 3 (por fase: naranja, rojo, blanco) |

**Karceron** (`assets_boss_karceron.js`)
| Nombre | Base (final) | Frames |
|---|---|---|
| `boss_karceron_torso` | 96 x 80 (192 x 160) | 3 (cerrado, abriendo, abierto con núcleo) |
| `boss_karceron_skull` | 40 x 40 (80 x 80) | 3 (neutro, rugido, daño) |
| `boss_karceron_arm_l` (grillete) | 40 x 56 (80 x 112) | 3 (reposo, barrido, roto) |
| `boss_karceron_arm_r` (maza) | 40 x 56 (80 x 112) | 3 (reposo, golpe, roto) + `_mace` 36x36 (clavada) |
| `boss_karceron_core` | 28 x 28 | 3 (latido, expuesto, roto) |
| `boss_karceron_lava_pool` | 112 x 40 | 3 (burbujeo) |
| `obs_bone_pillar` | 30 x 48 | 3 (entero, agrietado, escombro) |
| `fx_lava_tile` | 32 x 32 | 4 (tileable, naranja/amarillo) |
| `fx_island_stone` | 120 x 80 (isla segura) | 1 |

**Letea** (`assets_boss_letea.js`)
| Nombre | Base (final) | Frames |
|---|---|---|
| `boss_letea_body` | 112 x 64 (224 x 128) | 3 (idle, sumergiéndose, emergiendo) |
| `boss_letea_tail` | 48 x 32 | 2 (reposo, coletazo) |
| `boss_letea_head_acid` / `_ice` / `_bolt` | 32 x 32 (64 x 64) | 4 cada una (neutro, preparación, ataque, daño) + 1 herida abierta |
| `boss_letea_neck` | 16 x 16 (segmento, tileable) | 3 (por color) |
| `fx_water_pool` | 64 x 48 | 3 (onda) |
| `obs_crystal_pillar` | 26 x 52 | 3 (entero, agrietado, escombro) |
| `fx_lightning_strike` | 48 x 160 | 3 (columna) |

**Proyectiles y VFX comunes de jefe**
| Nombre | Base | Notas |
|---|---|---|
| `proj_boss_thorn` | 16 x 8 | 2 frames (púa grande morada) |
| `proj_bone_spike` | 14 x 6 | 2 frames |
| `proj_ember_big` | 16 x 16 | 3 frames (meteoro) |
| `proj_acid_glob` | 14 x 14 | 2 frames |
| `fx_shockwave_seg` | 64 x 16 | 1 (segmento de onda para dibujar el anillo) |
| `fx_boss_crack` | 48 x 48 | 3 (grieta del suelo) |
| `fx_part_break` | 64 x 64 | 5 (estallido al romper una parte) |
| `fx_window_ring` | 64 x 64 | 4 (aro dorado de ventana) |
| `ui_boss_frame` | por código (640 x 36) | marco de barra |
| `icon_part_*` (9 trofeos) | 16 x 16 cada uno | `trophy_pastor_horn`, `trophy_pastor_staff`, `trophy_pastor_fleece`, `trophy_karceron_mace`, `trophy_karceron_shackle`, `trophy_karceron_core`, `trophy_letea_acid`, `trophy_letea_ice`, `trophy_letea_bolt` |
| `icon_weak` / `icon_resist` | 12 x 12 | flecha verde hacia arriba / gris hacia abajo, sobre los iconos de etiqueta existentes |

Orden de arte si falta tiempo: Pastor (J1) -> trofeos -> Karceron -> Letea -> VFX comunes. Si algo no llega, el jefe no se activa (nunca con placeholder).

### 6.2 Audio nuevo (para audio-designer)
- **Música por jefe** (procedural en capas, Web Audio; 3 capas activables por fase + intro stinger + victoria):
  - Pastor: 96 BPM, flauta/zampoña disonante (triángulo + detune), tambor de marcha; F2 añade coro grave, F3 añade percusión rápida y distorsión.
  - Karceron: 70 BPM, yunque y cadenas rítmicas, coro grave (sierra filtrada); F2 añade ritmo de fragua, F3 añade lava burbujeante y sirena.
  - Letea: 110 BPM, arpegios acuáticos (seno + eco), coro femenino sintético; F2 añade oleaje, F3 añade rayos y disonancia.
- **SFX (todos con variación de pitch +-10 %):** `boss_roar_pastor/karceron/letea` (3 rugidos con carácter), `boss_tele_tick` (ascendente 400-1200 Hz según tiempo restante), `boss_phase_change` (stinger 1,2 s), `boss_window_open` (campana), `boss_part_break` (crujido + golpe + stinger corto), `boss_stomp`, `boss_shockwave`, `boss_charge` (resoplido), `boss_death` (largo 3 s), `chain_clank`, `mace_slam`, `bone_crack`, `lava_loop`, `lava_flood`, `water_wave`, `head_bite`, `hiss`, `acid_spit`, `ice_breath`, `lightning_strike`, `spore_pop`, `trophy_drop` (campanilla grave).
- Regla: los SFX frecuentes (púas, ticks) cortos y bajos; limitar a 4 voces simultáneas por tipo; un único rugido a la vez.

---

## 7. Riesgos
| Riesgo | Mitigación |
|---|---|
| **Legibilidad** con muchos proyectiles + telegrafías + adds + hordas | Tope de 60 proyectiles y 19 enemigos con jefe (40 entidades en móvil); regla de colores; fase 3 sin spawn normal; las telegrafías de jefe son siempre más grandes y opacas que las de enemigos normales; opción de accesibilidad "telegrafías de alto contraste". |
| **Rendimiento en móvil** (sprites de 256 px, gradientes, ecuaciones de formas) | Cachear partes en canvases; sin `shadowBlur`; telegrafías por rellenos planos; máx. 12 partículas por impacto de jefe; cuellos de Letea 6 segmentos; zoom 0,9x desactivable. |
| **Balance** (la varianza de builds hace que 15 s o 5 min) | Puertas de fase (suelo de duración), Furia (techo), corazones por fase, ventanas escalan el DPS flojo, HP por duración y Peligro; medir con bot 16 runs por jefe y ajustar solo `hp`/`DPS_ref`. |
| **Cartas sin puntería** apuntan al más cercano (jefe gigante y adds compiten) | El jefe tiene `r` grande, así que casi siempre es el "más cercano"; los adds los atacan las áreas. Verificar con p25 que los adds no se acumulan; si pasa, bajar el tope a 3. |
| **Partes**: cartas disparan al cuerpo en vez de a la parte | Las partes son entidades hijas (se prefieren si están a menor distancia): el diseño premia colocarse cerca; si no se rompen nunca en pruebas, subir `hz` a 1,25 o bajar el medidor al 6 %. |
| **Dificultad**: ataques injustos o frustrantes | Regla de esquiva, línea fija en el último 25 %, ningún ataque de más de 30 de daño, corazones por fase, "Practicar" (4.2). |
| **Arte**: 3 jefes multi-parte son mucho trabajo | J1 solo hace uno; las partes se reutilizan (variantes de color de huesos); si no llega Letea, el bioma Asfodelo usa el Pastor. |
| **Duración de la run**: con combates de 90-150 s el cronómetro de 9:00 no cabe | Reloj congelado con jefe vivo (1.1). |

---

## 8. Preguntas para el dueño (solo las que son suyas)
1. **¿El jefe lo decide el bioma (cada destino del Portal tiene su jefe) o quieres que el Portal permita elegir jefe libremente desde el principio?** Propongo bioma (3 destinos con jefe fijo) y que los biomas 2 y 3 se desbloqueen al vencer el anterior.
2. **¿Qué dificultad quieres para el jefe en Peligro I: "lo gana una build media la mayoría de veces" (~65 % de victoria al llegar al jefe) o "soulslike" (~30 %)?** Propongo ~65 % para I-II y dejar la dureza a Peligro III-V.

---

## Resumen (10 líneas)
1. Diagnóstico: Pastor = 1400 HP / 80 dps = 17 s; no tiene arena, partes, ventanas ni presencia.
2. Principios: lectura de patrones, regla de esquiva (telegrafía >= 250 ms + tiempo de salida), alternancia cerca/lejos, puertas de fase inmunes, ventanas de daño, partes rompibles, Furia progresiva, adds acotados.
3. HP por fórmula: `HP = DPS_ref(80) x 0,75 x T(110 s)`; Pastor 6000, Karceron 7500, Letea 6600; escala x0,75/1/1,1 por duración y x1-1,75 por Peligro; duración objetivo 90-150 s.
4. Escala: 192-256 px, sprites multi-parte con anclajes, sombra grande, intro de 3,5 s, barra de 640 px con segmentos de fase y marcas de partes, música por fase.
5. Roster: Pastor (centauro-carnero, 8 ataques), Karceron (coloso de huesos y magma, lava y núcleo-ventana, 8 ataques), Letea (hidra de 3 cabezas con rebrote, 8 ataques); cada uno con ataque desesperado.
6. Debilidades cubren las 6 etiquetas; 9 trofeos (3 por jefe) cuentan como Esencia afín en el árbol de la aldea.
7. Integración: jefe a 5/6 de la run, cacería de Vesper sin hordas (HP x0,75, 6 ofertas de preparación), Peligro I-V, director con spawn parado en ataques firma y F3.
8. Plan: J1 Pastor completo + infraestructura (6-7 d), J2 jefes 2 y 3 (7-8 d), J3 Peligro, cacería y miniboss (4-5 d).
9. Riesgos: legibilidad (tope 60 proyectiles / 19 enemigos), rendimiento móvil, balance con bot.
10. Preguntas: jefe por bioma vs libre, y objetivo de dificultad en Peligro I.
