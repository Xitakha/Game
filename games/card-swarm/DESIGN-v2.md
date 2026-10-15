# Swarm Hand - DESIGN v2 (enemigos + protagonista)

Alcance: dos bloques independientes para dos implementadores en paralelo. A = `enemies.js`, `waves.js`, `main.js` (`G.B.enemy`) y sprites de enemigos en `assets.js`. B = solo el sprite `player` en `assets.js` (ver "Zonas de `assets.js`" al final para no pisarse). Sin código aquí; los valores son punto de partida a afinar jugando.

Diagnóstico del feedback: hoy solo hay 3 patrones (contacto, disparo recto, carga). No hay variedad que obligue a cambiar de posición, y el protagonista es un cordero con capa roja y corona de ojo rojo, demasiado cercano a Cult of the Lamb.

---------------------------------------------------------------------------------------------------

# PARTE A - ENEMIGOS

## A.0 Duración de la run y reglas generales
- **Run nueva: 9:00** (`G.RUN_LEN = 9*60000`). **Jefe a las 7:30** (`G.BOSS_T = 7.5*60000`), HP 1400 (antes 900), con fase 2 (<50 % HP: 7 espinas, +25 % vel. de ataque, 4 gusanos cada 12 s; ya está implementada en `ai_boss`). Los 1:30 restantes son margen para matarlo; si no muere a los 2 min, "Furia" (+50 % daño/vel., ya en el GDD).
- Curva de presupuesto: mantener `bp(m)=2+1.6m` y `cap(m)=min(30+10m,110)`. Con 7.5 min el pico de bp es ~14; suficiente. Si se siente flojo, subir la pendiente a 1.8.
- `hpMult(m)=min(3.2,1+0.22m)` y `dmgMult` sin cambios. Los élites y el jefe NO escalan por minuto.
- **Regla de legibilidad (obligatoria para todo ataque nuevo):**
  1. Telegrafía mínima 400 ms antes de que el ataque haga daño (zona roja `rgba(255,40,40,.12..0.37)` creciente en `drawGround`, igual que jabalí/jefe), salvo contacto de gusano.
  2. Un único color de peligro: rojo para daño directo; **azul claro (`#7fd4ff`) para hielo/ralentiza**; **verde ácido (`#9bff4a`) para zonas persistentes**; morado para invocación/teletransporte.
  3. Los proyectiles enemigos usan sprites propios (nombre en la tabla), nunca los de colores de etiqueta de cartas del jugador.
  4. Máximo 1 mecánica nueva por enemigo; el resto es "caminar hacia el jugador" o mantener distancia.
- **Mecánicas nuevas de soporte** (`enemies.js` / `player.js`):
  - **Ralentizar al jugador:** campo `p.slowT` (ms) y `p.slowPct` (0..1) aplicado a la velocidad de movimiento; tinte azul en el jugador y aro de hielo bajo él. No apila: refresca duración al máximo.
  - **Zonas de daño en suelo:** lista `G.zones` (x, y, r, kind, arm, life, dmg, tick). Fases `arm` (telegrafía, sin daño) y `active`. Se dibujan en `drawGround`.
  - **Escudo frontal:** flag `e.shield` con arco; el daño de cartas que llega desde el arco frontal se reduce al 20 % (chispa de rebote). `G.Combat.deal` debe recibir la posición de origen del golpe; si no la tiene (auras/orbitales/pulsos), cuenta como por la espalda para no frustrar al jugador. Los estados (veneno, quemadura) ignoran el escudo.
  - **Tope por tipo en pantalla** (`maxAlive`) en el director, para que los nuevos no saturen.

## A.1 Roster (11 enemigos normales + 2 élites + jefe)
Reutilizados (5, solo se tocan los valores marcados): gusano, arquero, jabalí, bomba, brujo. Nuevos (6). Costes y pesos para el director. HP/daño son valores base antes de escalar por minuto. "Radio" = hitbox `r`. Velocidades en px/s.

| Clave `type` | Nombre | Entra | HP | Vel. | Daño | Coste | Peso | Radio | maxAlive |
|---|---|---|---|---|---|---|---|---|---|
| `worm` | Gusano | 0:00 | 14 | 70 | 6 contacto (cd 700) | 1 | 55 | 10 | - |
| `archer` | Arquero | 0:45 | 10 | 60 | 8 | 3 | 20 | 11 | 10 |
| `fanner` | Espinoso (abanico) | 1:30 | 16 | 55 | 6 x3 | 4 | 14 | 11 | 8 |
| `boar` | Jabalí | 2:00 | 45 | 55 / carga 340 | 14 | 5 | 10 | 15 | 8 |
| `shield` | Escudero | 2:45 | 40 | 48 | 10 contacto (cd 900) | 5 | 9 | 13 | 6 |
| `bomb` | Bomba | 3:30 | 8 | 105 | 20 radio 55 | 2 | 10 | 10 | 8 |
| `moth` | Polilla gélida | 4:00 | 14 | 80 vuelo errático | 5 + ralentiza | 4 | 10 | 10 | 5 |
| `sower` | Sembrador | 4:30 | 22 | 45 | 8/tick en zona | 5 | 7 | 12 | 3 |
| `blinker` | Espectro (teletransporte) | 5:15 | 18 | 65 | 16 tajo | 6 | 7 | 11 | 4 |
| `scorcher` | Ascua (carga con rastro) | 6:00 | 30 | 60 / carga 300 | 12 + rastro 5/tick | 6 | 6 | 12 | 3 |
| `warlock` | Brujo (invocador) | 6:45 | 30 | 50 | 0 (invoca gusanos) | 8 | 5 | 13 | 2 |
| `mini_bulwark` | ELITE Coloso Escudero | 3:30 (único) | 420 | 42 | 22 | - | - | 22 | 1 |
| `mini_hive` | ELITE Madre Colmena | 5:30 (único) | 520 | 38 | 14 | - | - | 24 | 1 |
| `boss` | Pastor Corrupto | 7:30 | 1400 | 60 | 20 | - | - | 24 | 1 |

Notas de reajuste del existente: el Brujo pasa de 6:30 a 6:45 (la run ahora acaba antes); el Arquero entra antes (0:45) porque ahora hay más cosas con las que mezclarlo; el Jabalí se adelanta a 2:00 y el Escudero cubre el hueco "enemigo duro" hasta el élite.

## A.2 Ficha de comportamiento por enemigo
Todos usan la telegrafía de aparición existente (círculo rojo 400 ms). `t` en ms desde el inicio de cada estado. Estados sugeridos para `e.st`.

### Gusano (`worm`) - sin cambios
Persigue y daña al contacto. Silueta: larva morada con cuernitos rojos. Es la unidad base del enjambre.

### Arquero (`archer`) - sin cambios de IA
Mantiene 200-260 px, apunta 400 ms (parpadeo amarillo, frame `aim`) y dispara 1 flecha recta (vel. 220) cada 2.4 s. Azul con capucha.

### Espinoso (`fanner`) - disparo en abanico
- Silueta/paleta: erizo-cactus bípedo, bajo y ancho, cuerpo verde botella `#2f8f5a` con púas crema `#f4e8c8` y bandas naranja `#ff9a2a` en la punta de las púas.
- IA: mantiene 180-240 px (más cerca que el arquero). Cada 3.0 s: `aim` 500 ms (se infla, las púas se erizan, aparece cono rojo de 40 grados de apertura hacia el jugador con ancho fijo en los últimos 150 ms) -> dispara **3 espinas** a -14/0/+14 grados, vel. 190, daño 6 cada una, vida 3.5 s -> `rec` 300 ms (desinflado, no se mueve).
- Contrajuego: moverse perpendicular al cono; las 3 espinas se pueden esquivar entre los huecos si estás lejos.

### Jabalí (`boar`) - carga telegrafiada (existente)
Sin cambios de IA. Se mantiene el rectángulo rojo de carga. Es el "enemigo de línea recta".

### Escudero (`shield`) - escudo frontal
- Silueta/paleta: soldado achaparrado con gran pavés circular, armadura gris acero `#8fa0b8` y ropa granate `#8a2a3a`; el escudo mide ~60 % de su cuerpo y siempre apunta al jugador.
- IA: camina lento hacia el jugador con el escudo adelante. Escudo cubre arco frontal de 140 grados: daño de cartas desde ese arco x0.2. Si el jugador pasa por detrás/lado, recibe daño normal. Cada 4 s hace un **empellón**: `wind` 500 ms (retrocede 6 px, el escudo brilla, zona de abanico de 90 grados y alcance 40 en rojo) -> `bash` 150 ms (daño 10 y empuje 60 px al jugador) -> `rec` 400 ms (escudo bajado: **ventana de vulnerabilidad**, daño x1 de frente).
- Función de diseño: premia cartas de área/orbitales/estados y movimiento de flanqueo; castiga el spam de proyectiles frontales.

### Bomba (`bomb`) - sin cambios
Se enciende a <40 px, 700 ms de mecha con parpadeo rojo y círculo de 60 px, explota. Rojo/crema.

### Polilla gélida (`moth`) - ralentiza al jugador
- Silueta/paleta: polilla pequeña de alas anchas, blanco azulado `#d8f0ff`, cuerpo azul `#4aa8ff`, ojos amarillos, polvo de escarcha.
- IA: vuela con trayectoria sinusoidal (amplitud 40 px) acercándose hasta 170 px y orbita. Cada 3.5 s: `charge` 450 ms (alas juntas, orbe azul que crece sobre ella, línea de mira azul fina) -> lanza **1 orbe de hielo** lento (vel. 150, radio 8, daño 5). Al impactar: **ralentiza al jugador 35 % durante 2 s** (aro azul bajo el jugador, tinte azul). El orbe se destruye con cualquier golpe de carta (HP 1): se puede "limpiar" con cartas.
- Contacto con la polilla no ralentiza (solo daño 5, cd 900) para que la ralentización siempre tenga causa visible (el orbe).

### Sembrador (`sower`) - minas / zonas de daño
- Silueta/paleta: hongo caminante con sombrero grande moteado, sombrero magenta oscuro `#9a2a78` con motas crema, cuerpo beige `#d8c8a0`, bolsa de esporas en la espalda.
- IA: mantiene 200-280 px. Cada 4.5 s: `sow` 500 ms (agacha y sacude el sombrero) -> planta **1 zona de esporas** (radio 42) en la posición donde está el jugador en ese momento (no predictiva). La zona tiene `arm` 900 ms (círculo punteado verde ácido, sin daño; de rojo claro a verde sólido) y luego `active` 4 s: 8 de daño cada 500 ms al que esté dentro y -15 % velocidad a quien la pise. Máximo 5 zonas vivas por sembrador. Al morir deja una zona activa más pequeña (r 30, 2 s).
- Función: expulsa al jugador de su posición cómoda y recorta el espacio de kiteo; combo malo con el enjambre.

### Espectro (`blinker`) - teletransportador
- Silueta/paleta: túnica fantasma sin piernas, violeta translúcido `#8a6ae0` (alpha 0.85), ojos blancos vacíos, guadaña corta; gira a semitransparente al "desvanecerse".
- IA: flota hacia el jugador hasta 220 px. Cada 4.2 s: `fade` 500 ms (se vuelve casi transparente, marca violeta con anillo en una posición de reaparición **a 70 px del jugador, elegida al inicio del fade**, no sigue) -> teletransporta (puff morado) -> `slash` 350 ms (arco rojo de 100 grados, alcance 50, orientado al jugador, se fija en los últimos 150 ms) -> daño 16 -> `rec` 700 ms visible y vulnerable. No ataca mientras está transparente (inmune a proyectiles en `fade`).
- Contrajuego: salir del anillo en 500 ms o moverse tras ver el arco.

### Ascua (`scorcher`) - carga con rastro de fuego
- Silueta/paleta: serpiente-lagarto de brasas, cuerpo naranja oscuro `#c8501c` con vientre amarillo `#ffd23a` y grietas incandescentes; deja ascuas al caminar.
- IA: persigue lento. A <320 px: `wind` 600 ms (se enrolla, humo, línea de carga estrecha roja de 14 px de ancho y 220 px de largo) -> `dash` 500 ms a vel. 300 en línea recta, **dejando un rastro** (celda de 22 px cada 60 ms que se enciende ya en rojo, 2.5 s de vida, 5 de daño cada 400 ms) -> `rec` 700 ms jadeando (vulnerable).
- Diferencia con el Jabalí: el Jabalí es un golpe; el Ascua es **denegación de área** por zonas lineales que dura. No confundir el sprite: es largo y bajo, no corpulento.

### Brujo (`warlock`) - invocador (existente)
Mantiene 260 px de distancia, `cast` 500 ms con anillo morado, invoca 2 gusanos cada 6 s (máx. 6 invocados vivos). Añadir halo morado permanente como prioridad visual (ya indicado en el GDD) y un hilo de luz al invocar. Matarlo disipa sus gusanos invocados con puff (cambio opcional pero recomendado: premia perseguirlo).

### ELITE Coloso Escudero (`mini_bulwark`) - minijefe 3:30
- Versión grande (96 % del tamaño del jefe: sprite 64x64) del Escudero: armadura gris oscura `#5a6478` con detalles dorados, escudo con un ojo rojo. Super armor (no se interrumpe por empuje).
- Ciclo de 3.2 s: (a) **Embestida con escudo**: wind 700 ms, 90 grados de abanico a 100 px, empuje y 22 de daño; (b) **Pisotón en cono** con 3 ondas de choque concéntricas (anillo expansivo, 700 ms de telegrafía, daño 16); (c) tras cada 3 ataques `rec` 1200 ms con el escudo baja (daño x1.5 recibido de frente): la ventana clave.
- Escudo frontal siempre activo (x0.2). Recompensa: 10 XP-gemas (se suelta 1 gema "grande" de 30 XP), 20 Ceniza y un corazón garantizado.
- Se acompaña de 2 Escuderos normales (coste ya contado: no spawnea más Escuderos durante su vida).

### ELITE Madre Colmena (`mini_hive`) - minijefe 5:30
- Sprite 64x64: gran larva-abeja bulbosa morado-ámbar (`#7a3aa8` con panal `#ffb73a`), abdomen con celdas luminosas.
- Ciclo de 4 s: (a) **Escupe 3 larvas** (worm) en abanico con arco, que aterrizan a 90 px (círculos de aterrizaje rojos 500 ms); (b) **Nube ácida**: una zona persistente verde ácido de radio 55 bajo el jugador, `arm` 900 ms, activa 4 s (usa la mecánica del Sembrador); (c) cada 15 s, **Eclosión**: se hincha 800 ms (la barra de vida parpadea) y suelta 6 gusanos alrededor.
- **Al morir se divide**: genera 3 `splitter`-gusanos grandes (reutilizar `worm` con HP 40 y escala 1.3) que persiguen; esto da un cierre en dos tiempos.
- Recompensa: gema grande 40 XP, 25 Ceniza, 1 corazón.

### JEFE Pastor Corrupto (`boss`) - 7:30
Mantiene sus 3 ataques (cayado en arco, salto aplastante, abanico de espinas) y fase 2. Cambios para que sea "examen del roster":
- Pasa de 900 a 1400 HP.
- Cada 20 s lanza una **llamada del rebaño**: invoca 2 enemigos aleatorios ya desbloqueados de entre `fanner`, `shield`, `moth` (los 3 telegrafían su aparición 600 ms).
- En fase 2, además de los 4 gusanos cada 12 s, planta 2 zonas de esporas (mecánica del Sembrador) en posiciones aleatorias a 140 px del jugador cada 10 s.
- Mientras vive el jefe, el director baja el spawn al 40 % y **solo permite tipos "ligeros"**: `worm`, `archer`, `fanner`, `bomb`, `moth` (cada uno con su peso; ver A.4). Los élites no reaparecen.
- Matar al jefe = victoria; el temporizador de 9:00 es solo límite (Furia a los 2 min tras su aparición).

## A.3 Sprites de enemigos (nombres exactos y frames)
Convenciones del repo (ver cabecera de `assets.js`): vectorial `addV(name, w, h, frames[], {lw:1.4}, anims)`, coordenadas base y rasterizado x2, miran a la DERECHA, contorno `#1b1124`, 1 sombra + 1 brillo por parte. Todos los enemigos usan el helper `dyingFrames(...)` para 5 frames de muerte (caída + disolución en brasas) tras los frames normales, anim `die` con `DIE_ANIM`. Los 5 existentes NO se tocan: `worm` (16x16), `archer` (20x20), `boar` (24x18), `bomb`, `warlock`, `boss` (48x48 base, 96x96 final). El Brujo ya existe como sprite `warlock`.

Frames mínimos por sprite nuevo (índice = orden en el array; anims con esos índices). `idle` y `walk` se alternan; `attack` es la telegrafía/ataque.

| Nombre sprite (`B.enemy[x].spr`) | Tamaño base (final x2) | Frames normales (0..n) | Anims | Die |
|---|---|---|---|---|
| `enemy_fanner` | 20x18 (40x36) | 0 idle, 1 idle2, 2-5 walk (4), 6 aim (inflado, púas erectas), 7 fire (desinflado, 1 frame) | `idle` [0,1], `walk` [0,2,1,3,4,5] 8fps, `aim` [6], `shoot` [7,1] | +5 |
| `enemy_shield` | 24x24 (48x48) | 0 idle, 1 idle2, 2-5 walk (4), 6 wind (retrocede), 7 bash (adelante, escudo golpea), 8 rec (escudo bajo, expuesto) | `idle` [0,1], `walk` [0,2,1,3,4,5] 7fps, `bash` [6,7,8] 10fps | +5 |
| `enemy_moth` | 20x20 (40x40) | 0 alas arriba, 1 alas medias, 2 alas abajo, 3 alas medias2, 4 charge (alas juntas, orbe en las patas), 5 throw | `fly` [0,1,2,3] 14fps, `charge` [4], `throw` [5,0] | +5 |
| `enemy_sower` | 22x22 (44x44) | 0 idle, 1 idle2, 2-5 walk (4), 6 sow-down (agachado, sombrero sacude), 7 sow-up (esporas saliendo) | `idle` [0,1], `walk` [0,2,1,3,4,5] 7fps, `sow` [6,7,0] 8fps | +5 |
| `enemy_blinker` | 20x24 (40x48) | 0 float, 1 float2, 2 fade (alpha ~0.4, anillo en los pies), 3 fade2 (alpha ~0.15), 4 slash-wind (guadaña arriba), 5 slash-hit (guadaña abajo, arco blanco) | `idle` [0,1] 5fps, `fade` [2,3] 10fps, `slash` [4,5,0] 12fps | +5 |
| `enemy_scorcher` | 28x16 (56x32) | 0 idle, 1 idle2, 2-5 slither (4), 6 wind (enrollado, humo), 7 dash (estirado, motion lines), 8 rec (jadeo, boca abierta) | `idle` [0,1], `walk` [0,2,1,3,4,5] 9fps, `charge` [6,7], `rec` [8] | +5 |
| `enemy_mini_bulwark` | 32x32 (64x64) | 0 idle, 1 idle2, 2-5 walk (4), 6 bash-wind, 7 bash, 8 stomp-wind (pie arriba), 9 stomp, 10 rec (escudo bajo) | `idle`, `walk` 6fps, `bash` [6,7], `stomp` [8,9], `rec` [10] | +5 |
| `enemy_mini_hive` | 32x32 (64x64) | 0 idle, 1 idle2, 2-5 float (4), 6 spit (boca abierta), 7 acid (abdomen goteando), 8 swell (hinchado, brilla), 9 burst | `idle`, `float` 7fps, `spit` [6], `acid` [7], `swell` [8,9] | +5 |

Proyectiles y VFX nuevos (de enemigos), todos 2 frames (animación por `q.t`) salvo indicación:
| Nombre sprite | Tamaño base | Descripción |
|---|---|---|
| `proj_thorn_small` | 8x4 | Espina del Espinoso (crema con punta naranja). Distinto del existente `thorn` del jefe |
| `proj_frost_orb` | 12x12 | Orbe de hielo (azul claro con núcleo blanco y chispas) |
| `fx_spore_zone` | 48x48 (3 frames: arm punteado / active A / active B) | Disco de esporas verde ácido. Escalable en dibujo (r 30..55) |
| `fx_fire_cell` | 22x22 (3 frames) | Celda de llama baja del rastro del Ascua (rojo-naranja, 3 frames de parpadeo) |
| `fx_blink_ring` | 24x24 (2 frames) | Anillo violeta de reaparición del Espectro |
| `fx_shield_spark` | 12x12 (1 frame) | Chispa blanca al rebotar un golpe en el escudo (instanciar con `fx.part`) |

Orden del arte (prioridad si hay poco tiempo): `enemy_fanner`, `enemy_shield`, `enemy_sower`, `enemy_moth` -> luego `enemy_blinker`, `enemy_scorcher` -> élites -> VFX. Si algo no llega, el tipo se queda desactivado en `B.enemy` (`from: Infinity`), nunca con placeholder.

## A.4 Tabla de tiers por tiempo (qué entra en cada minuto)
`bp` = presupuesto por pulso (1.5 s) y `cap` = tope en pantalla, con run de 9:00 y jefe a 7:30. Pesos efectivos entre los desbloqueados (se renormalizan).

| Tramo | m | bp | cap | Entran (nuevos en negrita) | Sensación / objetivo |
|---|---|---|---|---|---|
| 0:00-0:45 | 0-0.75 | 2-3.2 | 30-37 | Gusano | Tutorial; primera carta y primer nivel |
| 0:45-1:30 | 0.75-1.5 | 3.2-4.4 | 37-45 | **Arquero** | Aprender a esquivar un proyectil |
| 1:30-2:00 | 1.5-2 | 4.4-5.2 | 45-50 | **Espinoso** | Primer patrón de dispersión: moverse lateral |
| 2:00-2:45 | 2-2.75 | 5.2-6.4 | 50-58 | **Jabalí** | Amenaza de línea; ya hay 4 verbos |
| 2:45-3:30 | 2.75-3.5 | 6.4-7.6 | 58-65 | **Escudero** | Primer enemigo que "resiste": hay que flanquear |
| 3:30 (única vez) | 3.5 | - | - | **ELITE Coloso Escudero** (+ aviso banner) | Primer pico; recompensa gema grande |
| 3:30-4:00 | 3.5-4 | 7.6-8.4 | 65-70 | **Bomba** | Presión de enjambre |
| 4:00-4:30 | 4-4.5 | 8.4-9.2 | 70-75 | **Polilla gélida** | Aprender a priorizar objetivos (limpiar orbes) |
| 4:30-5:15 | 4.5-5.25 | 9.2-10.4 | 75-83 | **Sembrador** | Espacio se reduce; zonas de esporas |
| 5:15-5:30 | 5.25-5.5 | 10.4-10.8 | 83-85 | **Espectro** | Amenaza desde cualquier ángulo |
| 5:30 (única vez) | 5.5 | - | - | **ELITE Madre Colmena** (+ banner) | Examen de la build a media partida |
| 6:00-6:45 | 6-6.75 | 11.6-12.8 | 90-97 | **Ascua** | Denegación de área lineal; mezcla total |
| 6:45-7:30 | 6.75-7.5 | 12.8-14 | 97-105 | **Brujo** | Prioridad de objetivo: "perseguir al invocador" |
| 7:30-9:00 | 7.5-9 | 14-16.4 | 105-110 | **JEFE** (+ solo tipos ligeros al 40 %) | Examen final |

Reglas del director (cambios en `waves.js`, sin tocar `spawnPos`):
1. Cada tipo con `maxAlive` no se elige si ya se alcanzó (se filtra en `opts`).
2. **Rotación de sabor:** cada 60 s se elige 1 "tipo protagonista" entre los desbloqueados que no sean gusano ni élites y se le multiplica x2.2 el peso durante esa pausa (banner opcional pequeño). Evita que cada minuto sea igual y hace que un clip enseñe un enemigo distinto.
3. **Packs** (grupos temáticos de 1 pulso): al 15 % por pulso desde 2:45, se compra un pack en vez de un spawn: (a) "Línea": 3 Escuderos + 1 Brujo detrás; (b) "Cruce": 2 Espinosos en lados opuestos; (c) "Pinza": 2 Ascuas + 1 Polilla; (d) "Campo": 2 Sembradores + 4 Gusanos. Cada pack tiene su coste acumulado y solo se compra si ya están desbloqueados todos sus tipos.
4. **Élites:** a 3:30 y 5:30, spawnear una vez, fuera de presupuesto, con banner "¡ELITE!" (2 s). Posición en el borde, no encima del jugador. Si siguen vivos al 7:30, desaparecen al spawnear el jefe (`kill(e, true)`).
5. La música sube de intensidad a cada élite (`Assets.music.setIntensity`) y pasa a `boss` con el jefe (ya existe).

## A.5 Recompensas y balance de XP/Ceniza
| Tipo | XP | Ceniza |
|---|---|---|
| fanner | 3 | 1 |
| shield | 5 | 3 |
| moth | 3 | 1 |
| sower | 5 | 3 |
| blinker | 6 | 3 |
| scorcher | 6 | 3 |
| warlock | 6 | 5 |
| mini_bulwark | 30 | 20 |
| mini_hive | 40 | 25 |
Revisar `xp` y `ash` en `B.enemy`; el total de XP de la run de 9 min debe seguir en ~1000 (subidas cada ~40 s).

## A.6 Criterio de aceptación (enemigos)
- En una run de 9:00 el jugador ve **al menos 9 tipos distintos** y cada uno lo hiere de una forma diferente (contacto, flecha, abanico, carga, empellón, explosión, hielo, zona, tajo teletransportado, rastro).
- Cada ataque nuevo se puede esquivar siempre que el jugador vea la telegrafía (400 ms o más); verificar con `?god=0` que un jugador que se mueve no recibe daño "gratis".
- Ningún tipo nuevo ocupa más de 10 % de enemigos en pantalla (por `maxAlive`).
- `?t=` permite saltar a cada tramo para probar (`?t=100`, `?t=270`, `?t=330`, `?t=400`).

---------------------------------------------------------------------------------------------------

# PARTE B - PROTAGONISTA

## B.1 Concepto
- **Nombre de trabajo:** **Marlo, el Tahúr** (mapache). Alternativas: "Ringo", "Pica".
- **Especie:** mapache (antifaz natural = "jugador de póker", manos ágiles, cola anillada). Silueta totalmente distinta del cordero: cuerpo estilizado y alargado, **cola grande rayada que asoma por detrás**, orejas redondeadas pequeñas, hocico alargado. El cordero es una bola de lana con cuernos y capa; Marlo tiene silueta de "L" (cabeza baja, cola alta).
- **Rasgos:** antifaz oscuro, hocico crema, orejas con borde oscuro, ojos grandes ámbar con pupila vertical suave, **visera de crupier verde** (media visera translúcida sobre la frente), **manguitos remangados** y **chaleco** azul petróleo con botón dorado en forma de pica. Postura relajada, ligeramente encorvada, sonrisa de medio lado (siempre "se guarda un as").
- **Paleta (distinta del rojo/crema del cordero):**
  - Pelaje: gris azulado `#7f8fa6` (sombra `#586579`, brillo `#aab8cc`)
  - Antifaz y patas/guantes: carbón `#2a2c3a` (sombra `#181a24`)
  - Hocico, vientre y cola clara: crema ceniza `#e8e4d4` (sombra `#b9b4a0`)
  - Chaleco: teal `#1fa8a0` (sombra `#126a70`, brillo `#58d6c8`)
  - Visera de crupier: verde jade `#2ec27e` translúcido (alpha 0.9) con banda `#1a6a46`
  - Acento: ámbar/mostaza `#f3a31f` (sombra `#b46c10`) para ojos, botón y detalles de las cartas
- **Accesorio de tema:** lleva una **baraja en abanico sujeta con la mano trasera/cinturón** (4-5 naipes finos en abanico a la cintura, con una carta flotando). El abanico de cartas SUSTITUYE a la espada: la carta en la mano delantera ocupa la posición del arma (misma ancla que `sword` en `lamb`: [20,16]->[23,8]). Las cartas muestran 4 colores de etiqueta como pequeñas marcas (rojo, azul, amarillo, verde) para enlazar con el juego, y el reverso es teal con un rombo ámbar. Cola con 4 anillos oscuros; en la punta, un pequeño dado o ficha de ceniza naranja prendida como adorno.
- **Mini-lore (una frase):** "Marlo apostó la ceniza de su pueblo contra el Pastor Corrupto y perdió; ahora juega la mano de su vida repartiendo cartas que combaten solas."
- **Personalidad:** socarrón, sereno bajo presión, nunca ataca con la mano: "reparte". Su animación idle es de barajar y su cara siempre sonríe, salvo en herido.

## B.2 Cómo dibujarlo (estilo actual de `assets.js`)
Reutilizar el pipeline vectorial existente sin cambios de API: `addV('player', 24, 24, frames, null, anims)`, helpers `V`, `Pblob`, `Pclosed`, `Ppoly`, `Prr`, `Pcirc`, `v.part`, `v.cluster`, `v.stick`, `v.eye`, `v.dot`, `v.line`. Orientación derecha. Contorno `#1b1124` grueso irregular, `lw` ~1.5 en cuerpo, 0.9 en detalles; 1 sombra y 1 brillo por parte. Sustituir la paleta `K` y las funciones `lamb`/`sword`/`ball` por una función `racoon(v, o)` con la misma firma de opciones (`by`, `legs`, `lift`, `fl`, `ear`, `hurt`, `blink`, `fury`, y `sword` renombrado a `card` con las mismas coordenadas de anclaje). Mantener `walkPose(k)` y `plWalk(k)` tal cual.

Orden de capas (de atrás hacia delante), coordenadas aproximadas en el lienzo 24x24:
1. **Cola** (detrás): sinuosa, grande, `Pclosed` de ~6 puntos desde (6, 17+by) hacia arriba-izquierda hasta (1.5, 10+by), pelaje `#7f8fa6` con 4 anillos `#2a2c3a` (se dibujan con `Ppoly` recortadas dentro de la forma usando `x.clip`), punta crema; balanceo con `fl` (`tailSway` = fl*0.6 en x de la punta).
2. **Patas** (2): `Prr` pequeñas carbón `#2a2c3a` en (9..11, 19.3) y (14..16, 19.3), igual que el cordero, con `legs/lift`.
3. **Brazo trasero**: pequeño `Pblob` carbón en (6, 16.4+by) sosteniendo el abanico de cartas a la cintura (4-5 naipes en `Ppoly` rotados -25..+25 grados, borde crema).
4. **Cuerpo + chaleco**: cuerpo ovalado `Pblob(12,15.5+by, 5.2, 5.4)` en gris azulado; chaleco `Pclosed` teal sobre el torso con solapa en V y un botón ámbar en forma de pica (punto + triángulo, 1.6 px). Manguitos remangados crema en las muñecas.
5. **Orejas**: dos `Pcirc` de radio 1.9 en (8.2, 5+by) y (15.8, 5+by); interior carbón `#2a2c3a`, `ea` las baja 0.8 px al andar.
6. **Cabeza**: `Pblob(12.6, 9.2+by, 5.6, 4.4)` gris azulado; **antifaz** carbón: banda `Pclosed` que cruza ojos con dos picos hacia arriba; **hocico** crema `Pblob(16.2, 11, 2.8, 2)` con nariz carbón `v.dot(18.3,10.6,0.7)` y bigotes cortos blancos opcionales.
7. **Ojos**: `v.eye` sobre antifaz, `white:'#f3a31f'` (ámbar) y `pc` carbón, `lx:0.5`, radio ~1.9. Variantes: blink (línea ámbar), hurt (X ámbar en vez de ojos), fury (cejas inclinadas, ojos más amarillos).
8. **Visera de crupier**: banda `Prr` verde jade translúcida sobre la frente (14 x 2 en (5.5, 5.2+by)) con arco de plástico: se dibuja la parte con `globalAlpha = 0.9` y brillo `#9bf0c8`.
9. **Boca**: sonrisa de lado `Pblob(14.8,12.6+by,0.9,0.6)` carbón; en herido, boca abierta rosada `#ff6a8a` igual que el cordero; en `fury`, sonrisa ancha con un colmillo.
10. **Carta en mano delantera**: reemplaza a `sword(...)`. Rectángulo `Prr` crema 3x4.6 con borde carbón, marca de color (pica ámbar), brazo delantero carbón desde (17, 16+by). En los frames de ataque (6,7,8,16,17) la carta se lanza: rotación 0 -> -35 -> +10 grados y deja 2 líneas de movimiento.
11. **Roll (9-12)**: Marlo hecho un ovillo con la cola envolviéndolo; `ball(k)` -> `ballRacoon(k)` con la cola como anillo exterior (anillos rayados), una oreja asomando, la cara con antifaz visible a `k*PI/2` y 1 naipe asomando. Mantener la rotación por `k`.

## B.3 Frames y animaciones (nombre del sprite: `player`, 24x24, sin cambios de tamaño)
Mantener EXACTAMENTE los índices de frame actuales para no romper `player.js`, `fx` ni el HUD (se redibuja el contenido, no el orden). El array de funciones queda:

| Índice | Contenido actual (cordero) | Nuevo contenido (Marlo) |
|---|---|---|
| 0 | idle A | Idle A: de pie, carta entre dos dedos, cola hacia atrás |
| 1 | idle B (`by:1`) | Idle B: baja 1 px, cola se balancea (+1), orejas -1 |
| 2,3,4,5 | walk 0,1,3,4 | Walk 0,1,3,4 (rebote + cola ondea) |
| 6 | atk-1 | Carta arriba (preparación) |
| 7 | atk-2 | Lanzamiento extendido hacia delante, ojos entrecerrados |
| 8 | atk-3 | Recogida, carta abajo |
| 9,10,11,12 | roll 0..3 | Ovillo con cola, 4 rotaciones |
| 13 | herido | Herido (ver B.4) |
| 14,15 | walk 2,5 | Walk 2,5 |
| 16 | atk antes | Anticipación del lanzamiento (carta atrás) |
| 17 | atk después | Seguimiento (carta delante, cola hacia arriba) |
| 18 | parpadeo | Parpadeo (idle con línea ámbar en los ojos) |
| 19-23 | muerte (5) | Muerte (5): generadas por `dyingFrames(plDraw.hurt, 24, 24, ...)` con el mismo set de opciones (rot hacia la derecha, `ash:false`, `dx`, `dis`) |

Anims (sin cambiar nombres ni orden): `idle` (secuencia actual, el 18 es el parpadeo, el 1 el balanceo), `walk` [2,3,14,4,5,15] 12 fps, `attack` [16,6,7,8,17] 18 fps, `attack_hit` [7], `roll` [9,10,11,12] 14 fps, `hurt` [13], `die` [13,19,20,21,22,23]. Hay que dejar el campo `plDie0` calculado igual (=19) y el objeto `plDraw.hurt` accesible para `dyingFrames`.

Sprites auxiliares nuevos, opcionales (no reemplazan nada): `player_card` (10x14, 2 frames: carta girando con marca de etiqueta) para el HUD de la mano (icono de retrato junto a la barra de vida) y `player_portrait` (32x32, 3 frames: neutro, sonrisa, herido) para pantallas de Game Over / Victoria / elección de carta.

## B.4 Cómo se ve en cada estado
- **Idle:** de pie, peso en una pierna, **baraja a la cintura**; la carta de la mano delantera "se cuela" entre los dedos cada 1.5 s (frame 1). Cola con vaivén lento (2 px). Parpadea (frame 18) cada ~3 s; la visera brilla una vez cada 5 s (opcional, alpha en un frame).
- **Andar (walk):** ciclo de 6 frames a 12 fps como el cordero. Rebote de 1 px en los pasos con apoyo; la cola ondea con retraso respecto al cuerpo (+1/-1 px) y las orejas bajan 1 px en el rebote. Baraja a la cintura rebota ligeramente, la carta delantera sube/baja 1 px.
- **Herido (frame 13, también base de la muerte):** cuerpo comprimido (`by:1`), cola erizada (sube y se ensancha, anillos más contrastados), **ojos como X ámbar**, boca abierta rosa, **visera torcida** (inclinada 15 grados y un pico asomando por un lado), **una carta sale volando** de la baraja a la cintura (naipe en el aire a la derecha-arriba, 6x8). En el juego el flash blanco/tinte de daño ya lo aplica `fx`, no se dibuja en el sprite. Dura 1 frame (hurt anim con 0.6 s de i-frames parpadeando ya existentes).
- **Muerte:** cae de lado hacia la derecha (misma rotación que el cordero) y el abanico de cartas se desparrama (5 naipes sueltos en el frame 21 a 23; se pueden dibujar como pequeñas partículas en el canvas del frame fuente antes de `dyingFrames`).
- **Ralentizado (nuevo estado de la Parte A):** sin sprite propio; tinte azul `#7fd4ff` a alpha 0.35 aplicado por `player.js` / `fx.spr` (opción `tint`) y aro de hielo bajo los pies (`fx_freeze_ring`, 20x8, 2 frames, pedir a Parte A o dibujar con `fx.ring`).

## B.5 Reglas de compatibilidad y criterios de aceptación
- No cambiar `addV('player', 24, 24, ...)` (tamaño final 48x48) ni el orden/anims de arriba; las colisiones usan `p.r = 10`.
- La silueta debe reconocerse en 24x24 a 48 px final: cola grande visible por detrás, orejas redondas, hocico alargado. Test: aplicar un filtro de silueta negra; no debe parecerse a un cordero (sin cuernos, sin nube de lana, sin capa).
- La paleta no contiene el rojo `#d6302b` ni el crema de lana `#f7f0dc`; el único acento cálido es el ámbar `#f3a31f` y las marcas de color de las cartas.
- Debe leerse sobre el fondo del bosque oscuro y de la cripta: el contraste lo da el chaleco teal y la visera verde jade contra el gris azulado (revisar con `?biome=cripta`).
- Mostrar el cambio en el HUD: ícono de retrato en la esquina de la barra de vida (opcional, `player_portrait`) y que el banner de COMBO use el color ámbar de Marlo.

---------------------------------------------------------------------------------------------------

# Zonas de `assets.js` (para trabajar en paralelo sin conflictos)
- **Implementador B (protagonista)**: sólo toca el bloque "JUGADOR" (líneas ~287-381: tabla `K`, `sword`, `lamb`, `ball`, `walkPose`, `plWalk`, `plDraw`, `pl`, `addV('player'...)`). No tocar `shade`/`outline`/`dyingFrames`/helpers.
- **Implementador A (enemigos)**: añade las funciones y `addV` de enemigos nuevos **al final del bloque de enemigos** (después de `warlock`/`boss`, antes de props/biomas), sin tocar los existentes, y los proyectiles/VFX a continuación. Para evitar conflictos de merge, A puede crear un archivo nuevo `src/assets_enemies2.js` que se cargue después de `assets.js` (usa `Assets` + helpers; si los helpers no son accesibles, pedir exportarlos a un único objeto interno `Assets._kit` en un cambio mínimo y común).
- Registrar los nuevos recursos en `studio/assets/ASSETS.md` y actualizar `README.md` (run de 9:00, jefe a 7:30, lista de enemigos, nuevo protagonista).
- Contraste B con A: la única dependencia compartida es el estado `slow` del jugador (A lo define en `player.js`; B solo necesita el tinte azul, que ya es una opción de `fx.spr`).
