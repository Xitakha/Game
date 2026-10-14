# Swarm Hand (prototipo)

Survivors donde no atacas: tu **mano de 5 cartas** dispara sola y, cuando dos etiquetas de tu mano se tocan
(Fuego + Hielo, Rayo + Veneno...), salta un **COMBO con nombre**. Canvas 2D puro, sin librerías ni red.
Diseño completo en `GDD.md`. El motor (assets, enemigos, fx) viene de Ember Flock (`../survival-lamb/`), copiado aquí para que el juego sea autónomo.

## Cómo servirlo
```
cd games/card-swarm
python3 -m http.server 8123
# abrir http://localhost:8123/index.html
```
(También funciona abriendo `index.html` directamente.)

## Cómo se juega
- Muévete esquivando al enjambre. Las cartas atacan solas; cada una muestra su cooldown girando.
- Matar suelta gemas verdes (XP), naranjas (Ceniza) y, a veces, corazones. Al subir de nivel eliges 1 de 3 cartas.
- Coger un duplicado **fusiona** (Nv2/Nv3, no gasta slot). Con la mano llena eliges qué slot reemplazar.
- La oferta se sesga hacia cartas que activan un combo nuevo: se enciende una línea entre las cartas y sale el banner.
- Sobrevive hasta el **7:30**: aparece el Pastor Corrupto (1400 HP). Mátalo para ganar ("Mano ganadora"); tienes hasta el 9:00, y a los 2 min de su aparición entra en Furia. Si mueres, `R` para otra partida.

## Controles
| Acción | Entrada |
|---|---|
| Mover | WASD / flechas |
| Elegir carta | 1 / 2 / 3 o clic |
| Omitir la elección (solo al subir de nivel; sin penalización, +5 Ceniza) | 4 / Espacio o botón OMITIR |
| Reroll (15 Ceniza, +15 por reroll en la misma oferta) | R o botón |
| Descartar carta de la mano (+10 Ceniza) | Shift+1..5 o clic derecho en el slot (en la pantalla de cartas) |
| Slot a reemplazar con la mano llena | 1..5 o clic (Esc cancela) |
| Pausa | P / Esc |
| Reintentar (pantalla final) | R / Enter / botón |

## Contenido
- 26 cartas (16 de ataque + 10 pasivas), 6 etiquetas (Fuego, Hielo, Rayo, Veneno, Sangre, Acero) + Neutro.
- 12 combos: VAPOR, GAS EXPLOSIVO, CONGELACIÓN, SOBRECARGA, SANGRE ENVENENADA, FRENESÍ, FILO ELÉCTRICO, FILO GÉLIDO, FORJA, PLAGA CONGELADA, PACTO ARDIENTE, DESCARGA TÓXICA.
- Estados con tinte: quemado (naranja), ralentizado (azul), veneno (verde, apila), sangrado (rojo), aturdido (amarillo).
- Enemigos (entrada): Gusano 0:00, Arquero 0:45, Espinoso 1:30 (abanico de 3 espinas), Jabalí 2:00, Escudero 2:45 (escudo frontal x0.2: flanquea o usa área/orbitales/estados),
  Bomba 3:30, Polilla gélida 4:00 (orbe de hielo que ralentiza 35 % 2 s; se destruye con un golpe de carta), Sembrador 4:30 (zonas de esporas), Espectro 5:15 (teletransporte + tajo),
  Ascua 6:00 (carga con rastro de fuego), Brujo 6:45 (invoca gusanos; matarlo los disipa).
- Élites únicos: Coloso Escudero a 3:30 y Madre Colmena a 5:30 (desaparecen si siguen vivos al llegar el jefe). Jefe a 7:30: llamada del rebaño cada 20 s, esporas en fase 2.
- Director: los enemigos fuertes REEMPLAZAN a los débiles: `G.B.tierCurve` (tabla por minuto con multiplicador de peso y de tope `maxAlive` por tier: 0 gusano, 1 arquero/espinoso/bomba, 2 jabalí/escudero/polilla, 3 sembrador/ascua/espectro/brujo; suelo `G.B.tierFloor` 0.12 para que los viejos sigan saliendo). Además: tiers por tiempo, tope por tipo (`maxAlive`), "enemigo protagonista" rotativo cada 60 s (peso x2.2) y packs temáticos (Línea, Cruce, Pinza, Campo) desde 2:45.
- Telegrafía: rojo = daño directo, azul = hielo/ralentiza, verde ácido = zonas persistentes, morado = invocación/teletransporte. Todo ataque avisa >= 400 ms antes de hacer daño.
- Run de 9 minutos (`G.RUN_LEN`), jefe en `G.BOSS_T` = 7:30 con 1400 HP.

## Balance rápido
- `G.B.cardDmgMul` (main.js) = 0.98: multiplicador global del daño de todas las cartas (impactos, zonas, estados), aplicado en `Combat.deal`/`Combat.dot`. No toca el daño de enemigos.
- `G.B.skipAsh` = 5: Ceniza que da omitir una subida de nivel (cada omisión consume una subida pendiente de la cola).
- `G.B.tierCurve` / `tierFloor`: curva de reemplazo débil -> fuerte del director.

## Parámetros de depuración (URL)
- `?speed=4` acelera el tiempo de simulación x4.
- `?god=1` jugador invulnerable.
- `?t=240` empieza la partida en el segundo indicado: `?t=100` espinoso, `?t=180` escudero, `?t=270` polilla/sembrador, `?t=330` élites y espectro, `?t=380` ascua, `?t=410` brujo, `?t=450` jefe.
- `?dbg=1` cuenta el daño recibido por fuente en `G.dbg.dmg` (consola) para ajustar el balance. Combínalo con `?god=1&speed=4` para recorrer la run entera.
- Consola: `G.Enemies.spawn('blinker', x, y)` crea cualquier tipo (`fanner shield moth sower blinker scorcher mini_bulwark mini_hive boss`).
- `?biome=cripta|asfodelo` cambia el fondo.

## Estructura
`src/main.js` núcleo y balance (`G.B`: tabla de enemigos con coste, peso, entrada y `maxAlive`) · `player.js` (ralentización `p.slowT`) · `enemies.js` (IA, zonas `G.zones` con `team:'e'`, telegrafías) · `waves.js` (director) · `combat.js` (daño, estados, combos, gemas) ·
`weapons.js` (armas auto-fire) · `cards.js` (catálogo, mano, oferta, dibujo de cartas) · `hud.js` · `fx.js` · `sfx.js` (SFX por etiqueta y stinger) · `assets.js` (arte y audio procedural; ver `ASSETS_API.md`).
