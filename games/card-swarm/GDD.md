# Swarm Hand (nombre de trabajo: "Card Swarm") — GDD
Alternativas: "Hexhand", "Dealt to the Swarm". Se propone **Swarm Hand**: se entiende en 2 palabras (enjambre + mano de cartas) y es buscable.

- **Género / plataforma:** Survivors auto-attack con deckbuilding ligero, vista cenital 2D. Navegador, Canvas 2D puro (mismo stack que Ember Flock, sin librerías). Teclado + ratón. Partida de 10-12 min.
- **Pitch (1 frase):** Survivors donde no atacas: tu **mano de 5 cartas** dispara sola, y cuando dos etiquetas de tu mano se tocan (Fuego + Hielo, Rayo + Veneno...) salta un **COMBO con nombre** que rompe el juego, mientras el enjambre te acecha.
- **Bucle central:** moverse esquivando -> las cartas atacan solas -> kills sueltan XP y Ceniza -> subir de nivel pausa y ofrece 3 cartas -> elegir / fusionar / reroll con Ceniza -> mano más rota -> jefe a los ~9:30 -> victoria o muerte con resumen de la mano.

## El giro propio (por qué NO es otro Ember Flock)
Ember Flock es un juego de **ejecución** (combo, roll, maldición: cada segundo decides con los dedos). Swarm Hand es un juego de **construcción**: el jugador solo mueve y las decisiones valiosas están en la mano. Cuatro diferencias, de más a menos importantes:
1. **Cero ataque manual.** Sin melee, sin roll, sin especial. Solo se mueve; el cuerpo es tu única defensa.
2. **Mano de 5 slots fija, visible siempre.** Cada carta enseña su cooldown girando. El slot lleno obliga a decidir qué se descarta (tensión Balatro).
3. **Combos por etiquetas, entendibles en un clip.** 6 etiquetas; si la mano contiene las dos de un par, se enciende una línea brillante entre ellas y aparece el banner "VAPOR!". Es el momento clip.
4. **Fusión + reroll con recurso.** Coger un duplicado fusiona (sube de nivel, no gasta slot). La Ceniza (recurso por kill) compra rerolls: más ceniza = más control del azar.
Además: flujo continuo sin oleadas ni pausas por oleada; la única pausa es la de elegir cartas.

La frase del clip: "Mira qué mano tengo" -> el enjambre arde, se congela y explota en cadena.

## Controles
| Acción | Entrada |
|---|---|
| Mover | WASD / flechas |
| Elegir carta ofrecida | 1 / 2 / 3 o clic |
| Reroll (cuesta Ceniza) | R o clic en botón |
| Descartar carta de la mano (da Ceniza) | En pantalla de cartas: Shift+1..5 o clic derecho en el slot |
| Slot lleno al coger carta nueva | Tras elegirla, pulsar 1..5 / clic en el slot a reemplazar (Esc cancela) |
| Pausa | Esc / P |
Nada más. Sin ratón en juego (solo en menús y cartas).

## Mecánicas clave
Unidades: px en arena 960x540 (puede ampliarse a 1280x720 de cámara con scroll como Ember Flock: se reutiliza `G.cam`), velocidades px/s, tiempos ms. Todo en un objeto de balance `G.B`.

### Jugador
- HP máx 100. Sin regeneración. Velocidad 190 px/s. Hitbox radio 10. Invulnerabilidad 600 ms tras daño + empuje 60 px (igual que Ember Flock).
- Radio de recogida de gemas: 60 px. Gemas de XP (verde) y Ceniza (naranja) vuelan al jugador al entrar en radio.
- Curación: 2 % de probabilidad por kill de soltar un corazón (+12 HP). Cartas de Sangre dan más.
- Empieza eligiendo **1 de 3 cartas iniciales** (Chispa, Esquirla, Dardo tóxico) y 15 Ceniza (= 1 reroll gratis al inicio).

### La mano (slots, niveles, fusión)
- **5 slots.** Cada carta es de **ataque** (actúa sola con su cooldown) o **pasiva** (modifica). Las pasivas ocupan slot y también tienen etiqueta (cuentan para combos). Las de tag "Neutro" no hacen combo pero son potentes: coste de oportunidad.
- **Fusión:** si eliges una carta que ya tienes, no gasta slot: sube de nivel (máx. Nv3). Nv2 = daño x1.6, cooldown x0.85, área +10 %. Nv3 = daño x2.5, cooldown x0.70, área +20 %, y brilla dorada. Pasivas: efecto x1.5 (Nv2) y x2 (Nv3). Las cartas en Nv3 ya no salen en la oferta.
- **Mano llena + carta nueva:** hay que reemplazar un slot (la carta reemplazada se pierde y da +10 Ceniza).
- **Orden de slots:** irrelevante en el MVP (sin adyacencia). Fase 2: adyacencia tipo Balatro.

### Subida de nivel y oferta
- XP necesaria para pasar del nivel L al L+1: `8 + 6L` (L1->L2 = 14 XP; acumulado ~840 XP para el nivel 15; unas 14-16 subidas en 10 min, ver curva). Gema: Gusano 1, Arquero 2, Jabalí 4, Bomba 2, Brujo 6, Jefe 60.
- Pantalla de oferta: **3 cartas**, el juego se pausa. Todas "comunes" (sin rarezas, para recortar alcance).
- **Sesgo de sinergia (clave de diversión):** el 70 % de las ofertas garantiza al menos 1 carta cuya etiqueta forma un combo todavía inactivo con la mano actual; el 25 % de las ofertas incluye 1 duplicado de una carta que ya tienes (si no está en Nv3). No se repite una carta dentro de la misma oferta.
- Si la mano está llena, el sesgo prefiere duplicados (fusión) y cartas con combo.
- **Reroll:** coste 15 Ceniza el primero, +15 por cada reroll adicional en la misma oferta (15, 30, 45); el coste se reinicia en la siguiente subida de nivel. Muestra 3 cartas nuevas distintas.
- **Ceniza:** 1 por kill (Jabalí 3, Brujo 5, Jefe 30), x1.5 con Alforja de ceniza. Se gasta en rerolls; también se obtiene descartando (+10). Objetivo de diseño: ~700 de Ceniza en una run, ~2-3 rerolls por oferta de alto valor.
- No hay "saltar" oferta; sí hay "Descartar" para liberar slot.

### Etiquetas
FUEGO (rojo), HIELO (azul), RAYO (amarillo), VENENO (verde), SANGRE (carmesí oscuro), ACERO (gris). Más "Neutro" (sin etiqueta). Cada carta tiene 1 etiqueta (simple de leer; un icono en la esquina).

### Estados sobre enemigos
Quemado (3 dps, 2 s), Ralentizado (-35 % vel, 2 s), Envenenado (4 dps, 4 s, apila hasta 3 veces), Sangrado (5 dps, 3 s), Aturdido (0 vel, el tiempo indicado). Los estados refrescan duración, no se suman entre sí (salvo veneno). Cada estado tiene tinte visible (naranja, azul, verde, rojo) para que los combos se lean.

## Catálogo de cartas (26 implementadas)
Nota: el diseño original listaba 28; Bobina (9) y Murciélago (15) no entraron en el prototipo, así que el juego tiene 26 cartas (16 de ataque + 10 pasivas). La numeración de las tablas es la original.

Los valores son de Nv1. cd = cooldown base. Objetivo de balance: una carta de ataque suelta hace 10-16 dps; una mano de 5 con 2 combos y fusiones llega a 150-250 dps.

### Ataque (16 implementadas; 18 en el diseño original)
| # | Carta | Etiqueta | Efecto Nv1 |
|---|---|---|---|
| 1 | Chispa | FUEGO | Proyectil al enemigo más cercano, 12 de daño + quemadura. cd 0.8 s |
| 2 | Bola de brasa | FUEGO | Proyectil lento (160 px/s), explota en radio 40, 22 de daño. cd 1.8 s |
| 3 | Anillo ardiente | FUEGO | 2 llamas orbitan a radio 60; 7 de daño por contacto (tick 0.4 s por enemigo). Permanente |
| 4 | Esquirla | HIELO | Proyectil, 10 de daño, ralentiza 2 s. cd 1.0 s |
| 5 | Nova helada | HIELO | Pulso radio 85 desde el jugador, 8 de daño, ralentiza 2.5 s (40 %). cd 3.5 s |
| 6 | Ventisca | HIELO | Aura radio 70 que sigue al jugador, 4 dps y ralentiza 25 % mientras dentro. Permanente |
| 7 | Chispazo | RAYO | Rayo salta entre 3 enemigos (alcance 110), 14 de daño (-20 % por salto). cd 1.4 s |
| 8 | Tormenta | RAYO | Cae un rayo en un enemigo aleatorio visible, 32 de daño en radio 30. cd 2.2 s |
| 9 | Bobina | RAYO | Coloca una torreta 6 s que dispara 6 de daño cada 0.4 s al más cercano (alcance 160). cd 6 s |
| 10 | Dardo tóxico | VENENO | Proyectil, 6 de daño + veneno. cd 0.9 s |
| 11 | Charco | VENENO | Charco radio 40 bajo el enemigo más cercano, 5 s, 6 dps + veneno. cd 3.5 s |
| 12 | Nube pútrida | VENENO | Aura radio 60, 3 dps + veneno. Permanente |
| 13 | Colmillo | SANGRE | Tajo en arco 90 grados hacia el más cercano, alcance 55, 18 de daño; al matar, 20 % de curar 3 HP (v5). cd 1.1 s |
| 14 | Sangría | SANGRE | Marca a 3 enemigos aleatorios cercanos: sangrado 5 dps durante 3 s. cd 2.0 s |
| 15 | Murciélago | SANGRE | Murciélago que persigue y pica a un enemigo (15 de daño) y rebota a otro. cd 1.6 s |
| 16 | Daga | ACERO | Lanza 3 dagas en abanico de 30 grados, 9 de daño cada una. cd 1.2 s |
| 17 | Hacha giratoria | ACERO | Boomerang que atraviesa, 22 de daño, ida y vuelta. cd 2.0 s |
| 18 | Escudo de púas | ACERO | 3 escudos orbitan a radio 45; 6 de daño y empuje 40 px. Permanente |

### Pasivas (10)
| # | Carta | Etiqueta | Efecto Nv1 |
|---|---|---|---|
| 19 | Manto de ceniza | FUEGO | Las cartas FUEGO hacen +25 % de daño |
| 20 | Cristal de escarcha | HIELO | Ralentizaciones +15 puntos de intensidad y +1 s de duración |
| 21 | Cascabel conductor | RAYO | Las cartas RAYO -20 % de cooldown y +1 salto/objetivo |
| 22 | Frasco de bilis | VENENO | Veneno +50 % de daño y apila hasta 5 |
| 23 | Corazón de lana | SANGRE | +30 HP máx y curación inmediata de 30 |
| 24 | Piedra de afilar | ACERO | Las cartas ACERO +25 % de daño y +10 % de crítico (x2) |
| 25 | Reloj de arena | Neutro | Todos los cooldowns -10 % |
| 26 | Pezuñas veloces | Neutro | +12 % de velocidad de movimiento |
| 27 | Imán de brasas | Neutro | Radio de recogida x2 y +20 % de XP |
| 28 | Alforja de ceniza | Neutro | +50 % de Ceniza y rerolls -5 de coste |

## Sinergias / combos (12) y Resonancia
Un combo se activa si la mano contiene **al menos una carta de cada una de las dos etiquetas** (ataque o pasiva). Se enciende una línea entre las cartas implicadas, suena un stinger y aparece el banner con el nombre. Los efectos usan los estados de arriba.

| # | Combo | Etiquetas | Efecto |
|---|---|---|---|
| 1 | **VAPOR** | Fuego + Hielo | El daño de cartas FUEGO contra enemigos ralentizados es +50 % y deja una nube de vapor (radio 40, 0.5 s, 8 de daño) |
| 2 | **GAS EXPLOSIVO** | Fuego + Veneno | Enemigos envenenados que mueren explotan: 25 de daño en radio 50 |
| 3 | **CONGELACIÓN** | Hielo + Rayo | Un rayo sobre un ralentizado lo aturde 0.8 s y hace x1.5 de daño |
| 4 | **SOBRECARGA** | Rayo + Fuego | Cada 6.º disparo de cartas Rayo o Fuego lanza una bola de plasma: 45 de daño, radio 60 |
| 5 | **SANGRE ENVENENADA** | Sangre + Veneno | Los envenenados también sangran (+3 dps); cada 15 kills de enemigos envenenados curan 4 HP |
| 6 | **FRENESÍ** | Sangre + Acero | Tras cada kill, 1.5 s de +30 % de velocidad de ataque (cooldowns -23 %) |
| 7 | **FILO ELÉCTRICO** | Acero + Rayo | Los proyectiles de ACERO, al impactar, encadenan 2 saltos de rayo de 8 de daño |
| 8 | **FILO GÉLIDO** | Hielo + Acero | El ACERO contra ralentizados es crítico garantizado (x2) |
| 9 | **FORJA** | Fuego + Acero | Proyectiles de ACERO dejan estela de fuego 1.2 s (5 dps) y queman |
| 10 | **PLAGA CONGELADA** | Veneno + Hielo | El veneno dura +3 s en ralentizados y al morir se propaga a 3 enemigos en radio 70 |
| 11 | **PACTO ARDIENTE** | Sangre + Fuego | Matar con FUEGO: 20 % de curar 4 HP (v5); +20 % de daño total mientras HP < 50 % |
| 12 | **DESCARGA TÓXICA** | Veneno + Rayo | Un rayo consume los stacks de veneno del objetivo: 8 de daño por stack, instantáneo |

Pares sin combo a propósito (fase 2): Sangre+Hielo, Veneno+Acero, Sangre+Rayo.

**Resonancia (anticombo de diversidad):** 3 cartas de la misma etiqueta = +25 % de daño a esa etiqueta; 4 o más = +50 % y el color de la mano se tiñe. Tensión de diseño: diversidad (más combos) vs. profundidad (resonancia). Fuera del MVP.

## Enemigos (5 + jefe), rediseño para enjambre
Se reutilizan los 5 + jefe de Ember Flock (mismos sprites y comportamientos) con **más cantidad, menos vida individual y escalado por minuto**. Spawn telegrafado 400 ms (círculo, reutilizado), contacto = daño con cooldown.
Escalado por minuto `m` (tiempo en minutos): `HP = base * (1 + 0.22 m)` (tope x3.2), `daño = base * (1 + 0.06 m)`.

| Tipo | HP base | Vel. | Daño | Coste | Desde | Notas (cambio frente a Ember Flock) |
|---|---|---|---|---|---|---|
| Gusano | 14 (antes 20) | 70 | 6 por contacto (cd 700 ms) | 1 | 0:00 | Relleno del enjambre. Sin cambios de IA |
| Arquero | 10 (antes 15) | 60 | 8 por proyectil | 3 | 1:30 | Mantiene 200-260 px, dispara cada 2.4 s (más lento: no hay roll) |
| Jabalí | 45 | 55 / carga 340 | 14 | 5 | 3:00 | Carga telegrafiada 600 ms, se aturde 900 ms: "mini-élite", suelta 3 Ceniza |
| Bomba | 8 (antes 12) | 105 | 20 radio 55 | 2 | 4:30 | Solo daña al jugador. Su explosión también la detona el Gas Explosivo |
| Brujo | 30 | 50 | 0 | 8 | 6:30 | Invoca 2 Gusanos cada 8 s (máx. 6 vivos); prioridad visual (halo) porque el jugador no apunta, así que tiene que acercarse |

### Jefe: El Pastor Corrupto (aparece en 9:30)
- HP 1800 (sin escalar por minuto). Radio 24, sprite 96x96 (existente). Velocidad 60.
- Ataques con super armor y telegrafía 700 ms, ciclo cada 2.5 s: cayado en arco (120 grados, alcance 80, daño 20), salto aplastante al sitio del jugador (radio 70, daño 25), abanico de 5 espinas (daño 10 cada una).
- Fase 2 (<50 % HP): +25 % velocidad de ataque, 7 espinas, 4 Gusanos cada 12 s.
- Mientras vive el jefe el director baja el spawn al 40 %.
- Como el jugador no ataca, el reto es **moverse mientras la mano lo funde**: mucho DPS buildado = jefe en ~25 s; mano floja = no se le puede matar y el enjambre sigue creciendo. Es el examen de la build.
- Matarlo = victoria (pantalla "Mano ganadora" con la mano final). Si no muere en 2 min, "Furia" (+50 % daño y vel.) para forzar final.

## Progresión / dificultad (curva de 10-12 min)
Director de spawn por **presupuesto continuo** (adaptación de `waves.js`): cada 1.5 s se añade `Bp(m) = 2 + 1.6 m` de presupuesto (m = minutos, decimal) que se gasta en tipos desbloqueados con pesos Gusano 55, Arquero 20, Jabalí 10, Bomba 10, Brujo 5 (renormalizados; nunca más de 1 Brujo por cada 12 de presupuesto). Tope de enemigos en pantalla: `min(30 + 10 m, 110)`. Spawn en anillo fuera de cámara.

| Tiempo | m | Pulso Bp | Tope pantalla | Enemigos nuevos | Sensación |
|---|---|---|---|---|---|
| 0:00-1:30 | 0-1.5 | 2-4 | 30-45 | Gusano | Tutorial implícito: primera carta + primer nivel a ~0:20 |
| 1:30-3:00 | 1.5-3 | 4-7 | 45-60 | Arquero | Mano de 3 cartas, primer combo |
| 3:00-4:30 | 3-4.5 | 7-9 | 60-75 | Jabalí | La mano se llena; empieza el dilema de slots |
| 4:30-6:30 | 4.5-6.5 | 9-12 | 75-95 | Bomba | Presión máxima de enjambre; fusiones Nv2 |
| 6:30-9:30 | 6.5-9.5 | 12-17 | 95-110 | Brujo | "Me he roto el juego" vs. muerte (zona de derrota media: 7-9 min) |
| 9:30-~11 | >9.5 | 17+ | 110 | Jefe (spawn al 40 %) | Examen final |

- Objetivos: jugador medio muere entre el 6:00 y el 9:00; uno bueno derrota al jefe en ~10:30 (run de ~11 min); mala build muere antes del 5:00.
- Subidas esperadas: ~14-16 en una run completa (XP total ~800), primera a ~0:20, luego una cada 35-45 s.
- Ritmo de dopamina: combo nuevo cada ~2 min, cada fusión aprox. cada 90 s.

## Meta mínima (opcional, post-MVP)
- Solo local (`localStorage`): mejor tiempo y mejor mano (iconos de las 5 cartas) y 3 "cartas bloqueadas" que se desbloquean al ganar una vez (Bobina, Murciélago, Charco). Sin tienda ni monedas.
- Resumen de run compartible: captura de la mano final con los combos activos (candidato a clip).

## HUD
- **Abajo centro (principal): la mano.** 5 cartas con marco, icono, etiqueta (icono de color) y nivel (estrellas). Barrido de cooldown sobre cada carta. Líneas brillantes entre cartas con combo activo.
- **Izquierda, columna:** combos activos con nombre e icono (parpadean al activarse), y debajo contadores de Resonancia (post-MVP).
- **Arriba izquierda:** barra de vida `HP 82/100`. **Arriba centro:** tiempo `04:32` y barra del siguiente combo del nivel (opcional). **Arriba derecha:** kills, Ceniza.
- **Barra de XP** fina en el borde inferior con número de nivel.
- **Pantalla de oferta:** 3 cartas grandes con nombre, etiqueta, descripción corta y "vista previa de combo": si la carta activa un combo nuevo se ve resaltada y rotulada con su nombre, y las dos cartas implicadas de la mano se iluminan. Botón Reroll con coste y Ceniza actual; mano visible debajo para decidir descartes.
- **Pantallas:** título (Jugar), pausa, Game Over / Victoria con tiempo, kills, nivel y la **mano final con sus combos**, y Reintentar. Avisos "¡COMBO!", "¡FUSIÓN!", "¡JEFE!".
- Feedback (juice reutilizado): hit-stop mínimo (30 ms solo en el jefe y kills en masa, no en cada golpe), shake al recibir daño, números de daño (agrupados/agregados cuando hay muchos), partículas por estado, flash blanco.

## Estilo visual y audio
- **Visual:** mismo universo (cordero encapuchado en el claro maldito, paleta oscura con acentos cálidos) para reusar todo el arte. Lo nuevo: **cartas** estilo naipe oscuro con marco por etiqueta (rojo, azul, amarillo, verde, carmesí, gris) y símbolo central; proyectiles con colores de etiqueta para que se lea el caos. Arena `bosque` por defecto; `cripta` como variante de fondo para la fase 2.
- **Audio:** reutiliza la música procedural en capas (la intensidad sube con los minutos, pista `boss` para el jefe). SFX nuevos: voltear carta, fusión, reroll, stinger de combo (uno corto y gratificante, el sonido de marca del juego), gema, subida de nivel, tick de estados.

## Qué se reutiliza de Ember Flock / qué es nuevo
| Sistema | Origen en `games/survival-lamb/src/` | Estado |
|---|---|---|
| Núcleo, bucle de paso fijo, balance `G.B`, entrada, cámara | `main.js` | Reutilizar tal cual; añadir estado `choosing` (pausa en oferta) |
| Jugador: movimiento, hitbox, i-frames, empuje, vida, sprite, daño y muerte | `player.js` | Reutilizar solo movimiento/daño/render. **Eliminar** melee, roll y nova |
| Enemigos y sus 5 IAs + jefe y sus ataques | `enemies.js` | Reutilizar; **cambiar stats** (tabla) y añadir sistema de estados (quemado, ralentizado, veneno, sangrado, aturdido) |
| Generador de oleadas | `waves.js` | Reutilizar la idea de presupuesto/costes/pesos; **sustituir** el control por oleadas por spawn continuo por pulso de tiempo |
| Cartas (mejoras stat-only) y pantalla de selección | `cards.js` | Reutilizar la pantalla de 3 cartas, teclas 1/2/3 y clic; **reescribir** el modelo de datos (etiquetas, niveles, mano de slots, fusión, reroll, sesgo) |
| HUD | `hud.js` | Reutilizar barras y texto; **nuevo**: mano de cartas, combos, Ceniza, XP |
| FX: hit-stop, shake, partículas, números de daño, cadáveres | `fx.js` | Reutilizar; añadir agrupación de números de daño y tintes por estado |
| Sprites, animaciones, VFX, biomas, arena, audio procedural (`Assets`) | `assets.js` | Reutilizar 100 %. **Añadir**: marcos de carta, iconos de etiquetas y de las 26 cartas, gemas (XP/Ceniza), proyectiles (dardo, esquirla, daga, hacha, orbe), rayo, charco, estela y SFX nuevos |
| Sistema de armas auto-fire (proyectil, aura, orbital, pulso, rayo, torreta, boomerang, tajo) | no existe | **Nuevo** (el grueso del trabajo) |
| Combos por etiquetas, resonancia, fusión, reroll, Ceniza, XP/gemas, descarte | no existe | **Nuevo** |
| Pantalla de victoria con la mano final | `hud.js` (Game Over) | Adaptar |

## Recursos necesarios (y fuente prevista)
Todo lo posible se genera por código en `assets.js` (como Ember Flock); se registra en `studio/assets/ASSETS.md`.

### Para asset-scout
| Recurso | Descripción | Fuente / búsqueda |
|---|---|---|
| Iconos de las 26 cartas y 6 etiquetas | Glifos simples reconocibles (llama, copo, rayo, gota, colmillo/murciélago, daga, hacha...) | Generados por código; referencia: game-icons.net (CC BY 3.0, solo si se atribuye), Kenney "Game Icons" CC0 |
| Marco de carta + reverso | Naipe oscuro, 6 colores de borde, estrellas de nivel, brillo dorado Nv3 | Generado por código; "kenney ui pack cards" CC0 como referencia |
| Gemas de XP y Ceniza, corazón | Pequeñas, con brillo | Generadas por código |
| Proyectiles y VFX por etiqueta | Dardo, esquirla, daga, hacha, rayo, charco, vapor, plasma, estela de fuego, onda de hielo | Reutilizar `fireball`, `flame`, `shockwave`, `hitspark`; resto por código; "kenney particle pack" CC0 |
| Fuente | Tipografía de título tipo naipe / pixel legible a tamaño pequeño | Google Fonts OFL ("Pixelify Sans", "MedievalSharp", "Press Start 2P") |

### Para audio-designer
| Recurso | Descripción | Fuente / búsqueda |
|---|---|---|
| Stinger de COMBO | 0.5-0.8 s, ascendente, gratificante; variaciones por combo (pitch) | Procedural en `Assets.sfx`; referencia: "level up jingle short cc0" |
| Voltear / elegir carta, fusión, reroll | Cartón/papel + chime | "card flip cc0", "kenney casino audio", procedural |
| Gema y subida de nivel | Pickup corto agudo; level up más largo | `pickup` existente + nuevo `level_up` |
| Rayo y trueno, hielo, veneno, tick de estado | Sonidos cortos distinguibles por etiqueta | "lightning zap cc0", "ice crack cc0", procedural |
| Música | Reutilizar loop por capas + pista de jefe | Existente |
Regla: los SFX de disparo automático deben ser muy cortos y bajos de volumen (pueden sonar 10 por segundo); limitar a 4 voces simultáneas por tipo.

## Alcance mínimo jugable (MVP) — prototipo ESTRICTO de 2 días
Objetivo: demostrar que "la mano + combos" es divertida, no hacer el juego completo.

**Día 1 — núcleo auto-attack:**
1. Reusar `main/player/fx/assets`: jugador solo con movimiento (sin melee/roll/nova), HP 100, daño por contacto.
2. Spawn continuo por pulso de tiempo (`Bp`) con **3 enemigos**: Gusano, Arquero, Jabalí.
3. Sistema de cartas de ataque auto-fire con **8 cartas**: Chispa, Esquirla, Dardo tóxico, Daga (proyectiles), Anillo ardiente (orbital), Nova helada (pulso), Chispazo (rayo), Colmillo (tajo).
4. XP/gemas, subida de nivel, pausa y oferta de 3 cartas (1/2/3 o clic), mano de **5 slots** con HUD básico (cooldown giratorio) y fusión Nv2.

**Día 2 — lo que lo hace único:**
5. Estados: quemado, ralentizado, envenenado (sin tintes complejos: tinte de color basta).
6. **4 combos**: VAPOR, GAS EXPLOSIVO, CONGELACIÓN, FRENESÍ, con línea entre cartas y banner + stinger. Añadir las 4 pasivas necesarias (Manto de ceniza, Cristal de escarcha, Frasco de bilis, Corazón de lana) -> **12 cartas totales** en el MVP.
7. Ceniza + reroll + descarte, y sesgo de sinergia en la oferta.
8. **Run corta de 6 min** (parámetro `RUN_LEN`), con el jefe del Pastor a los 5:00 usando solo cayado y salto aplastante y HP 900; victoria al matarlo.
9. Pantalla de Game Over / Victoria con la mano final y Reintentar. 6-8 SFX mínimos reutilizando `Assets.sfx` + stinger de combo.

**Criterio de aceptación:** una persona nueva entiende en 30 s qué hacer, ve al menos un combo antes del minuto 3, la partida se puede ganar o perder con builds distintas, y un clip de 15 s muestra mano + enjambre + banner de combo. **Pregunta a validar con el prototipo:** ¿pulsa "una más" después de ver su mano final?

## Fuera de alcance
- Las 16 cartas restantes, 8 combos restantes, Resonancia, adyacencia de slots, rarezas.
- Bomba y Brujo (excepto si sobra tiempo), jefe fase 2, run completa de 10-12 min (el MVP juega 6 min; el resto es solo escalado de números).
- Meta-progresión, desbloqueos, guardado, tienda; solo se prevé mejor tiempo local en post-MVP.
- Múltiples jefes, mapas o biomas, móvil/táctil, gamepad, multijugador, localización, rebind de teclas.
- Ataque manual, roll o habilidades activas (contradicen el giro del juego).
