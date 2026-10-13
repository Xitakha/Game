# Ember Flock — GDD
(Nombre de trabajo. Alternativas: "Cinder Lamb", "Last Flame of the Flock".)

- **Género / plataforma:** Action roguelite de supervivencia por oleadas, vista cenital 2D (top-down). Navegador (HTML5 + Phaser 3), teclado + ratón. Partida de 10-20 min.
- **Pitch (1 frase):** Eres un corderito encapuchado con una llama sagrada que defiende un claro maldito: combos de 3 golpes, esquivas con invulnerabilidad y una maldición de fuego contra oleadas de monstruos cada vez peores, eligiendo una carta de mejora tras cada una.
- **Bucle central:** Empieza oleada -> spawn escalonado de enemigos -> combate (combo / roll / especial) -> último enemigo muere -> pausa breve con curación pequeña -> elegir 1 de 3 cartas -> siguiente oleada. Cada 5 oleadas (5, 10, 15...) aparece un jefe en lugar de la oleada normal. Muerte = fin de partida con resumen (oleada alcanzada, kills, tiempo) y botón "Reintentar".

## Controles
| Acción | Teclado/ratón |
|---|---|
| Mover | WASD (también flechas) |
| Apuntar | Ratón (el ataque se orienta hacia el cursor) |
| Ataque melee (combo x3) | Click izquierdo o J (J ataca hacia la última dirección de movimiento/cursor) |
| Roll / esquiva | Espacio (hacia la dirección de movimiento; si está quieto, hacia atrás respecto al cursor) |
| Maldición (especial) | Click derecho o K |
| Elegir carta | Click, o teclas 1 / 2 / 3 |
| Pausa | Esc |

## Mecánicas clave
Unidades: píxeles en un arena de 960x540 (zoom fijo); velocidades en px/s; tiempos en ms. Todo configurable en un único objeto de balance.

### Jugador
- Vida: 100 (HP máx). Sin regeneración pasiva; +15 HP al terminar cada oleada (+30 tras jefe).
- Velocidad de movimiento: 190 px/s. Durante un golpe: 40 % de velocidad (76 px/s) para dar peso.
- Hitbox del cuerpo: círculo radio 10 px. Tamaño de sprite aprox. 32x32.
- Invulnerabilidad breve al recibir daño: 600 ms (parpadeo) + empuje de 60 px.

### Ataque melee (combo de 3 golpes)
Arco frontal frente al cursor, alcance 44 px desde el centro, ángulo 100 grados (golpe 3: 140 grados y alcance 52).
| Golpe | Daño | Windup | Activo | Recuperación | Avance | Empuje al enemigo |
|---|---|---|---|---|---|---|
| 1 | 10 | 80 ms | 80 ms | 120 ms | 14 px | 50 px |
| 2 | 10 | 70 ms | 80 ms | 120 ms | 14 px | 50 px |
| 3 (remate) | 18 | 110 ms | 100 ms | 260 ms | 30 px | 120 px |
- Ventana de encadenado: pulsar de nuevo durante los últimos 250 ms de recuperación continúa el combo; si no, el combo se reinicia tras 400 ms.
- Input buffer: 150 ms (un click un poco antes se encola).
- Cancelación: el roll puede cancelar la recuperación de cualquier golpe (no el windup).
- Crítico: 10 % de probabilidad base, x2 de daño.

### Roll / esquiva
- Duración: 280 ms; distancia 110 px (velocidad media ~390 px/s, curva ease-out).
- Invulnerable (i-frames): de 0 a 200 ms de los 280 (los últimos 80 ms son vulnerables, recuperación).
- Cooldown: 700 ms contados desde el inicio del roll. Sin consumo de resistencia (más simple).
- Mientras rueda no puede atacar; puede atravesar enemigos (sin colisión con ellos).
- Roll perfecto (bonus de feedback): si esquivas un golpe enemigo dentro de los i-frames, se muestra "!" y el especial recupera 15 % de su cooldown.

### Maldición (especial): "Llama Sagrada"
- Explosión de fuego en cono/anillo: círculo de radio 90 px centrado en el jugador (nova). Daño 35 a todo lo que alcance, aplica quemadura (5 daño/s durante 3 s = 15 total) y empuje de 100 px. No daña al jefe durante su "super armor" de carga (ver jefe).
- Cast: 200 ms de windup (el jugador queda quieto, vulnerable), 150 ms de recuperación.
- Cooldown: 8 s (anillo de enfriamiento en el HUD). Empieza disponible.
- Reduce cooldown: -0.5 s por cada 5 kills (mecánica de mejora, ver cartas) y por roll perfecto.

### Feedback de golpe ("juice")
Obligatorio en MVP, es el pilar de sensación:
- Hit-stop: congelar 50 ms al impactar (80 ms en golpe 3 y críticos, 120 ms al matar al jefe).
- Screen shake: 3 px / 80 ms al golpear; 6 px / 150 ms en golpe 3; 8 px / 200 ms al recibir daño; 10 px / 250 ms con la maldición.
- Flash blanco del enemigo 80 ms al ser golpeado; parpadeo rojo del jugador al recibir daño.
- Partículas: chispas al impactar (6-8), polvo al rodar, humo/ceniza al morir el enemigo, llamas en la maldición.
- Números de daño flotantes (blanco normal, amarillo crítico), 600 ms de duración.
- Squash & stretch ligero del sprite del jugador al atacar (scale 1.15 en 80 ms).
- SFX distinto por golpe 1/2/3 (el tono sube) y un "thud" más grave en el remate.

### Enemigos (5 tipos) — comportamiento simple
Todos usan estados mínimos: spawn (telegrafiado con círculo 500 ms, invulnerables) -> acción -> muerte. Contacto con el jugador solo daña donde se indica.

| Tipo | Rol | HP | Velocidad | Daño | Comportamiento |
|---|---|---|---|---|---|
| **Gusano** (Chaser) | Relleno | 20 | 80 px/s | 8 por contacto (cooldown 800 ms) | Camina directo al jugador. Aparece desde la oleada 1. |
| **Cultista arquero** (Ranged) | Presión a distancia | 15 | 70 px/s | 10 por proyectil | Mantiene distancia 220-300 px; cada 2.0 s se detiene 400 ms (telegrafía con brillo) y dispara 1 proyectil a 220 px/s. Desde oleada 3. |
| **Jabalí** (Charger) | Castiga quedarse quieto | 40 | 60 px/s (caminar), 380 px/s (carga) | 18 por embestida | Merodea hacia el jugador; a <250 px se planta 600 ms (línea roja telegrafiada), embiste en línea recta 450 ms, queda aturdido 900 ms (ventana de daño x1.5). Desde oleada 4. |
| **Bomba** (Exploder) | Obliga a moverse | 12 | 110 px/s | 25 en radio 60 px | Persigue; a <40 px se enciende 700 ms (parpadeo) y explota (también explota al morir si ya estaba encendido; matarlo antes de eso lo desactiva). Desde oleada 6. |
| **Brujo** (Summoner/Support) | Prioridad de objetivo | 30 | 50 px/s | 0 directo | Huye del jugador; cada 6 s invoca 2 Gusanos junto a sí (máx. 6 invocaciones vivas). Al morir, sus Gusanos siguen vivos. Desde oleada 8. |

Nota de alcance: MVP incluye solo Gusano, Arquero, Jabalí (3 tipos). Bomba y Brujo en fase 2.

### Jefe: "El Pastor Corrupto" (oleadas 5, 10, 15...)
- HP: 400 en la oleada 5 (+300 por cada aparición posterior; escala con la fórmula de abajo). Radio hitbox 24 px (sprite 96x96, versión ampliada o sprite propio).
- Velocidad: 70 px/s.
- Super armor durante ataques (no interrumpido por golpes; sí recibe daño y feedback reducido).
- **Fase 1 (100-50 % HP)** ciclo de 3 ataques, uno cada ~2.5 s con 700 ms de telegrafiado:
  1. *Golpe de cayado*: arco de 120 grados, alcance 80 px, daño 20.
  2. *Salto aplastante*: salta al lugar donde estaba el jugador (círculo rojo marcado 800 ms), radio 70 px, daño 25.
  3. *Abanico de espinas*: 5 proyectiles en abanico de 60 grados, 200 px/s, daño 10 cada uno.
- **Fase 2 (<50 % HP)**: +25 % velocidad de ataque, el abanico pasa a 7 proyectiles, y cada 12 s invoca 4 Gusanos. Efecto visual de rabia (tinte rojo) y shake.
- Recompensa: curación +30 HP y carta de rareza mínima Rara (ver mejoras).
- Para los jefes posteriores (oleada 10, 15...) el MVP solo reutiliza el mismo jefe con más vida y daño. Variantes de jefe distintas = fuera de alcance.

## Progresión / dificultad

### Curva de oleadas (fórmula)
Sea `n` el número de oleada (1, 2, 3...), solo para oleadas que no son de jefe.
- **Presupuesto de amenaza:** `P(n) = 6 + 3n + floor(n^1.5 / 2)`
  (n=1: 9; n=3: 17; n=4: 22; n=6: 31; n=8: 42; n=10: 55)
- Cada enemigo tiene un coste: Gusano 2, Arquero 3, Jabalí 5, Bomba 3, Brujo 6.
- Se rellena el presupuesto eligiendo al azar entre los tipos desbloqueados para esa oleada, con pesos: Gusano 50, Arquero 25, Jabalí 15, Bomba 10, Brujo 5 (solo cuentan los desbloqueados; se renormaliza). Nunca más de 1 Brujo por cada 8 de presupuesto.
- **Simultáneos máximos en pantalla:** `min(8 + n, 30)`; el resto de la oleada entra en tandas (cada 1.2 s mientras haya hueco).
- **Escalado de estadísticas:** `HP_enemigo = HP_base * (1 + 0.06 * (n-1))` y `daño = daño_base * (1 + 0.04 * (n-1))`, con tope en x2.5 de HP y x2.0 de daño.
- **Jefes** (n = 5, 10, 15...): sustituyen la oleada. Cuenta como oleada normal en numeración (la oleada 5 es el jefe), el escalado usa `k = n/5`: `HP_jefe = 400 + 300*(k-1)`, `daño = base * (1 + 0.15*(k-1))`. Durante el jefe, se spawnean 2 Gusanos extra cada 15 s para evitar que sea solo esquivar.
- Una oleada termina cuando todos los enemigos programados han muerto.

### Entre oleadas
1. Pausa de 1.5 s ("Oleada superada"), curación +15 HP (+30 tras jefe).
2. Pantalla de 3 cartas (juego pausado). Opción "Saltar" -> +10 HP (opcional, fase 2).
3. Cuenta atrás 2 s y siguiente oleada.

### Mejoras (cartas): ~12, todas con efecto numérico y acumulables salvo indicación
Rareza y pesos de aparición en la tirada: Común 60 %, Rara 30 %, Épica 10 % (tras jefe: 0/70/30). No se repiten dos copias en la misma mano de 3. Las no apilables dejan de salir una vez obtenidas.

| # | Nombre | Rareza | Efecto |
|---|---|---|---|
| 1 | Colmillo afilado | Común | +20 % daño melee (apilable hasta 5) |
| 2 | Pezuñas ligeras | Común | +12 % velocidad de movimiento (apilable) |
| 3 | Corazón de lana | Común | +25 HP máximos y curación inmediata de 25 |
| 4 | Pies de ceniza | Común | Roll: cooldown -150 ms (mín. 400 ms) |
| 5 | Ojo de brasa | Común | +10 % probabilidad de crítico (apilable) |
| 6 | Brasas hambrientas | Rara | Cada kill reduce 0.5 s el cooldown de la maldición |
| 7 | Remate pesado | Rara | El golpe 3 hace +50 % daño y su área sube a 160 grados |
| 8 | Roll de humo | Rara | El roll deja una estela de fuego 1.5 s que quema (5 dps) y dura +60 ms más de i-frames |
| 9 | Llama ampliada | Rara | La maldición tiene +40 % radio (126 px) y +15 daño |
| 10 | Sed de sangre | Épica | Robo de vida: 4 % del daño infligido (mín. 1 HP por golpe) |
| 11 | Llama doble | Épica | La maldición tiene 2 cargas (la segunda se recupera con su cooldown) |
| 12 | Cometa espectral | Épica | Cada 3 s, tu próximo golpe 1 lanza además un proyectil de fuego (12 daño, atraviesa) |

Notas de balance: el techo de poder se pretende alto pero no roto; cualquier suma de multiplicadores se calcula aditiva dentro de la misma estadística. La dificultad crece más rápido que la mejora media para forzar derrota hacia las oleadas 12-20 en partidas normales (objetivo de diseño: jugador medio muere en la oleada 8-12; hábil llega a 15+ y derrota 2 jefes).

## Estilo visual y audio
- **Visual:** Pixel art top-down 16x16 o 32x32, paleta oscura (violetas y verdes apagados de fondo) con acentos cálidos naranja-rojo para la llama del jugador y los efectos de impacto, para que el combate se lea. Arena cerrada de una sola pantalla 960x540 (suelo de hierba/tierra oscura con rocas y runas en los bordes, un círculo ritual central). Cámara fija con shake.
- **Audio:** Música oscura-ritual con ritmo, loop de combate (~2 min) más una variante más intensa para jefe; SFX contundentes y secos (golpes, cortes, impactos, fuego, UI de cartas, muerte de enemigo, daño al jugador, aviso de jefe).
- **Tono:** Cuento siniestro-simpático (corderito vs monstruos del bosque).

## HUD
- **Arriba izquierda:** barra de vida (corazones o barra roja) con número `HP 82/100`.
- **Arriba centro:** "OLEADA 7" y debajo enemigos restantes (`Quedan 12`). En jefe: nombre y barra de vida grande del jefe abajo-centro.
- **Arriba derecha:** kills totales y tiempo de partida.
- **Abajo izquierda:** icono de la maldición con anillo de cooldown y tecla `K / ClickDer`; icono del roll con cooldown y tecla `Espacio`.
- **Abajo centro (pequeño):** iconos de mejoras activas (con contador xN si apilan).
- **Pantalla de cartas:** 3 cartas grandes con nombre, icono, rareza (color: gris/azul/púrpura) y descripción; hover resalta; teclas 1/2/3.
- **Pantallas:** título (botón Jugar), pausa, Game Over con estadísticas y Reintentar.
- **Avisos:** texto grande "¡JEFE!" y "Oleada superada".

## Recursos necesarios (y fuente prevista)
Preferir CC0 y registrar todo en `studio/assets/ASSETS.md`. Todo sprite debe ser top-down y con tamaño de tile coherente (16 o 32 px).

### Gráficos (asset-scout)
| Recurso | Descripción | Términos de búsqueda |
|---|---|---|
| Personaje jugador | Sprite top-down con idle, caminar, 3 ataques o 1 ataque reutilizable, roll, daño, muerte (4 direcciones o 2 con flip) | "top down hero sprite CC0", "kenney tiny dungeon", "kenney roguelike characters", "opengameart top down knight 4 direction", "itch.io free top down character pixel" |
| Enemigos: gusano/slime, cultista, jabalí, bomba, brujo | 5 sprites pequeños con idle/walk | "top down monster sprites CC0", "opengameart slime top down", "kenney tiny dungeon monsters", "LPC monsters", "itch.io free pixel monsters top down" |
| Jefe | Sprite grande (64-96 px) tipo pastor/ogro, o escalar uno existente | "top down boss sprite CC0", "opengameart large monster boss pixel" |
| Suelo y decorado | Tileset de hierba/tierra oscura, rocas, árboles, runas | "top down tileset dark forest CC0", "kenney roguelike modern/ rpg tiles", "opengameart dungeon floor tileset" |
| Proyectiles y efectos | Bala/flecha mágica, llama, chispa de impacto, humo, explosión | "pixel fire effect spritesheet CC0", "kenney particle pack", "opengameart explosion spritesheet", "hit spark sprite" |
| UI | Marcos de carta, corazones/barras, iconos de habilidad | "kenney ui pack", "kenney game icons", "pixel ui health bar CC0" |
| Fuente | Tipografía pixel o de cuento oscuro | "Google Fonts Press Start 2P OFL", "Pixelify Sans", "MedievalSharp OFL" |

Mínimo viable gráfico: Kenney Tiny Dungeon / Roguelike Characters + Kenney Particle Pack + Kenney UI Pack (todo CC0, mismo estilo).

### Audio (audio-designer)
| Recurso | Términos de búsqueda |
|---|---|
| Música combate (loop) | "dark ritual loop CC0", "opengameart dark fantasy battle loop", "Kevin MacLeod CC0"/"Eric Skiff" (verificar licencia), "itch.io free dark chiptune music" |
| Música jefe (loop) | "boss battle music loop CC0 opengameart" |
| SFX golpe 1/2/3 | "sword swing whoosh CC0", "melee hit impact freesound CC0", "Kenney impact sounds" |
| SFX roll | "dash whoosh cc0", "cloth swoosh short" |
| SFX maldición/fuego | "fire burst cast cc0", "flame whoosh explosion freesound" |
| SFX enemigos | "monster hit squish", "monster death pop", "arrow shoot", "boar charge grunt", "explosion small" |
| SFX jugador/UI | "player hurt grunt 8-bit", "ui card select click", "level up jingle short", "boss roar warning" |
Sugerencia: Kenney Impact Sounds, Kenney Digital Audio, Freesound CC0, jsfxr/ChipTone para generar los que falten.

## Alcance mínimo jugable (MVP)
Objetivo: una sesión de programación (~4-6 h), todo en una escena de Phaser sin menús complejos.
1. Arena 960x540 con paredes invisibles, jugador con WASD + ratón, vida 100, sprite placeholder aceptable.
2. Melee con combo x3 (valores de la tabla), buffer, avance, hit-stop y shake.
3. Roll con i-frames y cooldown.
4. Maldición "Llama Sagrada" (nova de radio 90, daño 35, cooldown 8 s) con anillo de cooldown. Sin quemadura en MVP (solo daño y empuje).
5. 3 enemigos: Gusano, Arquero, Jabalí (con telegrafía básica).
6. Generador de oleadas con la fórmula `P(n)`; oleada termina al morir todos; +15 HP al superar.
7. Pantalla de 3 cartas con 6 mejoras (Colmillo afilado, Pezuñas ligeras, Corazón de lana, Pies de ceniza, Brasas hambrientas, Remate pesado), todas stat-only.
8. Jefe en oleada 5 con 2 ataques (cayado y salto aplastante), sin fase 2.
9. HUD básico (vida, oleada, cooldowns, barra del jefe) y Game Over con Reintentar.
10. Feedback: flash, números de daño, hit-stop, shake, y 6-8 SFX mínimos + 1 loop de música.
Criterio de aceptación: se puede jugar de oleada 1 a la 5 (jefe) sin errores, y el combate "se siente" contundente.

## Fuera de alcance
- Meta-progresión entre partidas, guardado, tienda, desbloqueos, monedas.
- Mejoras más complejas (cometa espectral, llama doble, estela de humo, robo de vida) -> fase 2 junto a Bomba y Brujo y la fase 2 del jefe.
- Varios jefes distintos, varios mapas, biomas, objetos del suelo.
- Multijugador, mando/gamepad, móvil/táctil, lógica de seeds.
- Animaciones complejas por dirección (8 direcciones), cinemáticas, diálogos, historia.
- Ajustes avanzados (rebind de teclas, opciones gráficas), idiomas múltiples.
