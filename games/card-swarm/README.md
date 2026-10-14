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

## Bucle completo (v3: Aldea, Fase 2a)
**Aldea -> Portal -> Expedición -> Botín (R = repetir sin pasar por la aldea) -> Aldea.** La pantalla principal es **Rescoldo** (`src/aldea.js`), una aldea caminable de una pantalla
(960x540, escala a cualquier tamaño). Marlo se mueve con WASD / flechas (o el joystick táctil flotante de la mitad izquierda), interactúa con **E / Enter** (o el botón táctil
HABLAR de 96 px) a menos de 56 px de un NPC, y viaja al Portal con **Tab** (o el botón PORTAL) con un fundido de 0,3 s. Colisiones con los rectángulos de `Assets.VILLAGE.colliders`
y los límites de la zona caminable. Esc abre el menú (Colección, Ajustes, Borrar progreso con doble pulsación). El arte viene de `assets_village.js` (`Assets.drawVillage`);
si no existe, se dibuja un fallback de rectángulos. Luz: Día al abrir o tras ganar, Ocaso tras una derrota.
- **Grum (herrero):** abre la **Forja** (`src/tree.js`), un árbol por pestañas: **Fuego** (12 nodos completos), **Tronco** (Rango de forja II/III, Ceniza viva, Tercera ancla,
  Pezuñas/Imán/Alforja) y **Clásica** (recetas planas rebalanceadas para las cartas de Hielo, Rayo, Veneno, Sangre, Acero y el Reloj; los demás árboles llegan en la Fase 2b).
- **Vesper (encargos):** Tablón con 3 encargos fijos (tutorial "Huele a chamusquina": 20 Bombas -> 6 Mecha + 40 Brasas + 1 PF; 40 Polillas; el Coloso Escudero). Solo uno activo; el progreso
  persiste entre expediciones y se ve en el HUD de la run. El enemigo objetivo pesa **x2,5** en el director (`waves.js`) y su entrada se adelanta a 2:30 virtuales. Son repetibles.
- **Rufo (mercader):** **Trueque** (3 partes comunes por 1; Hebra 6 por 1; cupo de 4 por expedición, se reinicia al volver de una salida), **Vender** (6 Brasas por parte, Hebra 3) y
  **Comprar** (Tónico de ceniza 80: +40 Ceniza; Imán de bolsillo 120: radio x1,5; parte común 24, cupo 3). Las raras no se truecan ni se venden.
- **Portal:** mano al salir (anclas), selector 7 / 9 / 10 min, encargo activo, compras pendientes y SALIR. Tras el botín: R reintenta el mismo build, B vuelve a la aldea.
- **Ulalume (provisional):** colección de las 26 cartas y anclas (hasta que la Fase 2b añada loadouts). **Abuelo Lanudo** y **Tía Castaña**: diálogos de ambiente.
- **Anclas:** `G.B.anchorSlots` = 2 (3 con el nodo Tercera ancla). Se eligen en el Archivo de Ulalume o en el Portal. Los otros slots se llenan al subir de nivel con cartas desbloqueadas.
- **Duración:** 7 / 9 / 10 min (`?len=N` lo fuerza). `G.setLen()` escala jefe, élites, entrada de enemigos, curva del director, HP/daño y Furia mediante `G.vt()`.

### Árbol de forja y Puntos de Forja (PF)
- Cada nodo cuesta **PF + partes + Brasas** (tabla `L.NODE_TIER` en `loot.js`: T1 1 PF 10/5 partes 30 Brasas; T2 2 PF 16/7 60; T3 3 PF 24/9 100 + 1 Esencia; T4 4 PF 34/12 150 + 2 Esencias).
  T2 pide **Rango de forja II** y T3/T4 **Rango III** (Tronco). Tipos: carta (C), mejora A/B (M, +1 rango de la carta), pasivo (P), rama excluyente (X: Cenizas ardientes o Fundición),
  set (S: Emblema de Fuego) y maestría (Ma: Corazón de brasa, revive una vez por expedición). Un árbol de Fuego completo cuesta 20 PF.
- **Techo de 24 PF** ganados (`L.PF_CAP`): builds duras. Fuentes: 1 de regalo, encargos (1-2), primer élite de cada tipo (+1) y cada 4 nodos distintos forjados (+1, "Maestría de oficio").
  Compensación de 2 PF al migrar de v1.
- **Reespecializar:** botón DESHACER en un nodo (él y sus dependientes: 40 Brasas por PF devuelto) o REESPECIALIZAR el árbol (250 Brasas); devuelve los PF y el **50 % de las partes**; el
  **primer reespecializado es gratis**. Quitar un nodo de carta quita la carta de la colección y de las anclas. Los nodos heredados de v1 no se pueden deshacer.
- Efectos reales en la run (`G.Tree.fx`, leídos por `cards.js`, `combat.js`, `weapons.js`, `player.js`): Pavesa (quemadura +2 s y +30 %), Ráfaga (cooldown de Chispa -15 %), Metralla (3 fragmentos de 8),
  Napalm (suelo ardiente 2 s, 4 dps, radio 40), Pulmón (+8 % Fuego), Cenizas ardientes (fuego 3 s al morir un quemado), Fundición (escudo del Escudero x0,5 y +15 % a élites/jefe), Corona (3 llamas),
  Cometa (órbita +25 % y +20 % daño), Emblema (3 cartas Fuego: +25 % daño; 4+: Pira, las quemaduras se propagan), Corazón de brasa, Ceniza viva (+20 Ceniza), Tercera ancla.
- Teclas del panel: flechas mover, **F** forjar / elegir A, **G** elegir B, **U** deshacer nodo, **R** reespecializar, **Q/E** o 1-3 cambian de pestaña, Esc sale. Táctil: tocar un nodo lo selecciona,
  deslizar en horizontal cambia de pestaña.

### Economía (hotfix incluido, ver `DESIGN-v3-aldea.md` sección C y `src/loot.js`)
- **Partes:** 8 comunes (Hebra, Pluma, Púa, Colmillo, Placa, Mecha, Escarcha, Jirón) con drops de **12-15 %** por muerte (antes 30-35 %) + Esencia rara (**0,8 %**, pity +0,4 % por run sin rara hasta +4 %;
  élites 20 %; el Pastor da 1 segura). Garantías: Coloso 2 Placa + 1 Pluma, Madre Colmena 2 Púa + 2 Hebra, Pastor 2 Colmillo + 2 Hebra + 1 Pluma.
- **Brasas:** 12 % de la Ceniza sobrante + 10 por minuto (+40 si ganas). `L.EXPECT` x0,42.
- **Guardado v2** (`swarmhand.save`, `src/save.js`): partes, Brasas, rangos, anclas, PF, nodos y elecciones, encargos, cupos de Rufo, compras pendientes, flags. Migración automática desde v1 sin perder
  progreso; si el guardado está corrupto, se empieza de cero sin romper (try/catch).
- **Medido con el bot** (`?speed=25&god=1`, jugador que recoge partes y mata al jefe; 16 runs de 7 min y 10 de 9 min con la política "build mínima primero"): 7 min = **119 partes/run, 9,5 Mecha,
  ~2,1 Esencias** (el Pastor suma 1), ~254 Brasas; 9 min = 148 partes/run, 12,8 Mecha, ~314 Brasas. Con un jugador real (x0,7) salen ~7 Mecha por run de 7 min. Build mínima (Chispa II, Bola de brasa, Rango II,
  Manto de ceniza, Bola II) completa tras la **5.ª expedición** del bot (teórico; ~6-7 con un jugador que a veces muere); árbol de Fuego completo (13 nodos) tras la 15.ª. Los PF llegan a ~1,3 por run con encargos.

## Teclas de la forja anterior
La Base de una página (`base.js`) ya no existe como pantalla: `base.js` conserva el botín y el lanzador; la colección vive en el Archivo.

## Cómo se juega
- Muévete esquivando al enjambre. Las cartas atacan solas; cada una muestra su cooldown girando.
- Matar suelta gemas verdes (XP), naranjas (Ceniza) y, a veces, corazones. Al subir de nivel eliges 1 de 3 cartas.
- Coger un duplicado **fusiona** (Nv2/Nv3, no gasta slot). Con la mano llena eliges qué slot reemplazar.
- La oferta se sesga hacia cartas que activan un combo nuevo: se enciende una línea entre las cartas y sale el banner.
- Sobrevive hasta el **7:30**: aparece el Pastor Corrupto (1400 HP). Mátalo para ganar ("Mano ganadora"); a los 2 min de su aparición entra en Furia. Si mueres, `R` repite la expedición.

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
| Reintentar mismo build (pantalla final) | R / Enter / botón |
| Ir a la Aldea desde el botín | B / Esc / botón |
| Aldea: mover / hablar / portal / menú | WASD o flechas / E o Enter / Tab / Esc |
| Táctil | toque = clic; joystick flotante a la izquierda (aldea y expedición); botón HABLAR 96 px; deslizar = cambiar pestaña |

## Contenido
- 26 cartas (16 de ataque + 10 pasivas; el GDD original listaba 28, Bobina y Murciélago no se implementaron), 6 etiquetas (Fuego, Hielo, Rayo, Veneno, Sangre, Acero) + Neutro.
- 12 combos: VAPOR, GAS EXPLOSIVO, CONGELACIÓN, SOBRECARGA, SANGRE ENVENENADA, FRENESÍ, FILO ELÉCTRICO, FILO GÉLIDO, FORJA, PLAGA CONGELADA, PACTO ARDIENTE, DESCARGA TÓXICA.
- Estados con tinte: quemado (naranja), ralentizado (azul), veneno (verde, apila), sangrado (rojo), aturdido (amarillo).
- Enemigos (entrada): Gusano 0:00, Arquero 0:45, Espinoso 1:30 (abanico de 3 espinas), Jabalí 2:00, Escudero 2:45 (escudo frontal x0.2: flanquea o usa área/orbitales/estados),
  Bomba 3:30, Polilla gélida 4:00 (orbe de hielo que ralentiza 35 % 2 s; se destruye con un golpe de carta), Sembrador 4:30 (zonas de esporas), Espectro 5:15 (teletransporte + tajo),
  Ascua 6:00 (carga con rastro de fuego), Brujo 6:45 (invoca gusanos; matarlo los disipa).
- Élites únicos: Coloso Escudero a 3:30 y Madre Colmena a 5:30 (desaparecen si siguen vivos al llegar el jefe). Jefe a 7:30: llamada del rebaño cada 20 s, esporas en fase 2.
- Director: los enemigos fuertes REEMPLAZAN a los débiles: `G.B.tierCurve` (tabla por minuto con multiplicador de peso y de tope `maxAlive` por tier: 0 gusano, 1 arquero/espinoso/bomba, 2 jabalí/escudero/polilla, 3 sembrador/ascua/espectro/brujo; suelo `G.B.tierFloor` 0.12 para que los viejos sigan saliendo). Además: tiers por tiempo, tope por tipo (`maxAlive`), "enemigo protagonista" rotativo cada 60 s (peso x2.2) y packs temáticos (Línea, Cruce, Pinza, Campo) desde 2:45.
- Telegrafía: rojo = daño directo, azul = hielo/ralentiza, verde ácido = zonas persistentes, morado = invocación/teletransporte. Todo ataque avisa >= 400 ms antes de hacer daño.
- Run estándar de 9 minutos (`G.RUN_LEN`, 7 / 9 / 10 desde la Base), jefe en `G.BOSS_T` = 5/6 de la run (7:30 en 9 min) con 1400 HP.

## Balance rápido
- `G.B.anchorSlots` = 2: cartas ancla de la expedición (ver Bucle completo).
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
- `?reset=1` borra el guardado (ojo: se borra en cada recarga mientras esté en la URL). `?pf=<n>` añade Puntos de Forja (techo 24). `?give=wick:20,frost:5,brasas:100` (o `all:30`) añade partes/Brasas; partes: `thread feather spine fang plate wick frost static rare`.
- `?len=7` fuerza la duración de la run en minutos (sin tocar el guardado).

## Estructura
`src/main.js` núcleo y balance (`G.B`: tabla de enemigos con coste, peso, entrada y `maxAlive`) · `player.js` (ralentización `p.slowT`) · `enemies.js` (IA, zonas `G.zones` con `team:'e'`, telegrafías) · `waves.js` (director) · `combat.js` (daño, estados, combos, gemas) ·
`weapons.js` (armas auto-fire) · `cards.js` (catálogo, mano, oferta filtrada por colección, anclas, dibujo de cartas) · `loot.js` (tabla de balance de botín/forja) · `save.js` (localStorage v2 con migración) · `aldea.js` (aldea, NPCs, movimiento) · `dialog.js` (burbujas) · `panels.js` (Tablón, Rufo, Portal, Archivo, menú) · `tree.js` (árbol de forja) · `quests.js` (encargos) · `base.js` (pantalla de botín y lanzador) · `assets_village.js` (arte de la aldea) · `assets_ui.js` (iconos de partes y botones por código) · `hud.js` · `fx.js` · `sfx.js` (SFX por etiqueta y stinger) · `assets.js` (arte y audio procedural; ver `ASSETS_API.md`).
