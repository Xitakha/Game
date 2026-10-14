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
- **Rufo (mercader):** **Trueque** (3 partes comunes por 1; Hebra 6 por 1; cupo de 4 por expedición, se reinicia al volver de una salida), **Vender** (3 Brasas por parte, Hebra 1; v5, antes 6 / 3) y
  **Comprar** (Tónico de ceniza 80: +40 Ceniza; Imán de bolsillo 120: radio x1,5; parte común 24, cupo 3). Las raras no se truecan ni se venden.
- **Portal:** mano al salir (anclas), selector 7 / 9 / 10 min, encargo activo, compras pendientes y SALIR. Tras el botín: R reintenta el mismo build, B vuelve a la aldea.
- **Ulalume (provisional):** colección de las 26 cartas y anclas (hasta que la Fase 2b añada loadouts). **Abuelo Lanudo** y **Tía Castaña**: diálogos de ambiente.
- **Anclas:** `G.B.anchorSlots` = 2 (3 con el nodo Tercera ancla). Se eligen en el Archivo de Ulalume o en el Portal. Los otros slots se llenan al subir de nivel con cartas desbloqueadas.
- **Duración:** 7 / 9 / 10 min (`?len=N` lo fuerza). `G.setLen()` escala jefe, élites, entrada de enemigos, curva del director, HP/daño y Furia mediante `G.vt()`.

### Árbol de forja y Puntos de Forja (PF)
- Cada nodo cuesta **PF + partes + Brasas** (tabla base `L.NODE_TIER` en `loot.js` x `L.COST_MUL.node` = partes x0,8 y Brasas x5, v5: T1 1 PF 8/4 partes 150 Brasas; T2 2 PF 13/6 300; T3 3 PF 20/8 500 + 1 Esencia; T4 4 PF 28/10 750 + 2 Esencias; Rango II 300 Brasas, Rango III 600).
  T2 pide **Rango de forja II** y T3/T4 **Rango III** (Tronco). Tipos: carta (C), mejora A/B (M, +1 rango de la carta), pasivo (P), rama excluyente (X: Cenizas ardientes o Fundición),
  set (S: Emblema de Fuego) y maestría (Ma: Corazón de brasa, revive una vez por expedición). Un árbol de Fuego completo cuesta 20 PF.
- **Techo de 24 PF** ganados (`L.PF_CAP`): builds duras. Fuentes: 1 de regalo, encargos (1-2), primer élite de cada tipo (+1), **fragmentos de minijefe (v5: cada Coloso/Colmena abatido da 1 fragmento, 2 = +1 PF)**, jefe (2; 3 la primera vez) y cada 4 nodos distintos forjados (+1, "Maestría de oficio").
  Compensación de 2 PF al migrar de v1.
- **Reespecializar:** botón DESHACER en un nodo (él y sus dependientes: 60 Brasas por PF devuelto, v5) o REESPECIALIZAR el árbol (400 Brasas); devuelve los PF y el **50 % de las partes**; el
  **primer reespecializado es gratis**. Quitar un nodo de carta quita la carta de la colección y de las anclas. Los nodos heredados de v1 no se pueden deshacer.
- Efectos reales en la run (`G.Tree.fx`, leídos por `cards.js`, `combat.js`, `weapons.js`, `player.js`): Pavesa (quemadura +2 s y +30 %), Ráfaga (cooldown de Chispa -15 %), Metralla (3 fragmentos de 8),
  Napalm (suelo ardiente 2 s, 4 dps, radio 40), Pulmón (+8 % Fuego), Cenizas ardientes (fuego 3 s al morir un quemado), Fundición (escudo del Escudero x0,5 y +15 % a élites/jefe), Corona (3 llamas),
  Cometa (órbita +25 % y +20 % daño), Emblema (3 cartas Fuego: +25 % daño; 4+: Pira, las quemaduras se propagan), Corazón de brasa, Ceniza viva (+20 Ceniza), Tercera ancla.
- Teclas del panel: flechas mover, **F** forjar / elegir A, **G** elegir B, **U** deshacer nodo, **R** reespecializar, **Q/E** o 1-3 cambian de pestaña, Esc sale. Táctil: tocar un nodo lo selecciona,
  deslizar en horizontal cambia de pestaña.

### Economía (v5; histórico en `DESIGN-v3-aldea.md` sección C)
Meta de la pasada v5: **una expedición de 7 min = 1 craft de carta O 1 mejora de talento (no ambas); una de 9-10 min = 1 craft + medio extra.** Lo que fuerza el "o" es que las **Brasas** son la moneda compartida
y su faucet por run (~175 / 226 / 254 a 7 / 9 / 10 min) alcanza para ~1 craft o ~1 nodo; las partes limitan qué se compra, no cuánto. Todas las constantes están nombradas en `src/loot.js`:
- **Drops:** probabilidades de `L.DROPS` (12-15 %) x `L.DROP_MUL` = **0,70** (8-10 %). Esencia rara `L.RARE_P` 0,8 % sin cambios (el Pastor da 1 segura + 3 trofeos).
- **Garantías:** Coloso `plate 3 + feather 2 + thread 2` y Madre Colmena `spine 3 + thread 3 + feather 1`, Esencia 35 % (antes 2+1 / 2+2, 20 %); romper su parte suelta `L.MINI_PART_BONUS` (Coloso +2 Placa, Colmena +2 Hebra); Pastor sin cambios.
- **Costes:** `L.COST_MUL` = `recipe { parts 1,25 ; brasas 3,9 }` (recetas planas: p. ej. Nova helada 4 Escarcha + 6 Pluma + 40 Brasas -> 5 + 7 + 156) y `node { parts 0,8 ; brasas 5,0 }` (árbol: ver tabla de nodos arriba; Ceniza viva y Tercera ancla ahora piden Brasas 150 / 300). Las Esencias raras no se escalan.
- **Brasas por run:** `Brasas = 1,5 % de la Ceniza + 18 x (m + 0,04 m^2)` (m = minutos del reloj de la run, `L.BRASAS_MIN` / `L.BRASAS_GROW`; la run larga rinde más que proporcionalmente) + jefe (`DEFS.pastor.brasas` **12** + 4 por parte rota; antes 150 + 40) + 0 por ganar (`L.BRASAS_WIN`; antes 12 % + 10/min + 40).
- **PF:** sin cambios en costes ni techo (24); la fuente nueva son los fragmentos de minijefe (+1 PF por run si caen los dos). Con ~3 PF por run el cuello son las Brasas, no los PF.
- **Trueque y tienda (coherentes con la escasez):** trueque 3:1 (Hebra 6:1) y cupos 4 / 3 sin cambios; **vender** baja a 3 Brasas por parte (Hebra 1; antes 6 / 3) para que vender el sobrante no duplique el faucet; tienda sin cambios (Tónico 80, Imán 120, parte 24); reespecializar 60 Brasas por PF o 400 el árbol (antes 40 / 250). Encargos repetidos: partes y Brasas x0,5 (`Quests.REPEAT_MUL`).
- **Guardado v2** (`swarmhand.save`, `src/save.js`): partes, Brasas, rangos, anclas, PF (+ `pf.frag`), nodos y elecciones, encargos, cupos de Rufo, compras pendientes, flags. Migración automática desde v1; guardado corrupto = empezar de cero (try/catch).

| Medido con el bot (8 runs por duración, mismas condiciones) | 7 min antes | 7 min ahora | 9 min antes | 9 min ahora | 10 min antes | 10 min ahora |
|---|---|---|---|---|---|---|
| Partes por run | 129,6 | **99,0** | 150,5 | **123,3** | 172,5 | **136,5** |
| Mecha (Fuego) por run | 10,3 | 6,9 | 9,6 | 11,0 | 14,0 | 11,5 |
| Brasas por run (boss ganado, 3 partes rotas) | 539 | **175** | 606 | **226** | 636 | **254** |
| Crafts de carta por run (campaña de 5 runs, "lo más barato primero", con arrastre) | 3,98 | **1,00** | 4,85 | **1,20** | 5,56 | **1,22** |
| Mejoras de talento por run (ídem) | 2,15 | **1,00** | 2,15 | **1,40** | 2,42 | **1,40** |
| Crafts + talentos por run (mixto: gasta lo más barato de ambos) | 4,49 | **1,00** | 4,96 | **1,40** | 6,05 | **1,60** |
| Primera run desde cero (mixto) | 4,2 | **1** | 4,9 | **1** | 6,1 | **1** |

El "antes" (3-4 cartas por run) coincide con lo que contó el dueño; el bot es un jugador que recoge casi todo y mata siempre al jefe (god), un humano saca ~x0,7 de partes. Cómo repetirlo: `tools/card-swarm-balance-bot/` (más abajo).

## Teclas de la forja anterior
La Base de una página (`base.js`) ya no existe como pantalla: `base.js` conserva el botín y el lanzador; la colección vive en el Archivo.

## Vista inclinada tipo Hades (Nivel 1, `src/view.js`)
Solo cambia el DIBUJO de la expedición; posiciones, colisiones, daño, distancias, movimiento e input siguen en el plano plano de siempre (arriba = arriba en pantalla).
- **Activación:** `?view=iso` (o `?view=flat` para forzar la plana) y **Ajustes > "Vista inclinada (exped.)"** en el menú de Rescoldo (se guarda en `settings.view` del save, con try/catch). Por defecto, la vista plana. La URL gana al save.
- **Cómo funciona:** el mundo se dibuja con `ctx.scale(1, G.B.isoK)` (`isoK` = 0,62; ajustable 0,5-0,75, constante nombrada en `main.js`/`view.js`). Todo lo que es SUELO (zonas de cartas y enemigas, telegrafías del jefe y minijefes: círculos, conos, arcos, carriles, anillos, ondas, esporas, aura, anillos y rayos de fx, resplandor ritual, niebla) se dibuja igual dentro de esa transformación, así que el borde visual coincide exactamente con el área lógica de daño (elipses, conos y carriles aplastados). Todo lo DE PIE (jugador, enemigos, jefe, troncos, cadáveres, gemas, proyectiles, órbitas, partículas, números de daño, barras de vida, llamas de antorcha) se envuelve en `Proj.up(c, x, y[, foot])` / `Proj.down(c)`, que deshace el aplastado alrededor del punto lógico: el sprite se ve sin deformar, centrado en `(x, y*isoK)`, ordenado por y (`sortY`). Jefe y minijefes usan pivote en los pies (`Proj.footOf`: 88 / 24 px) para que sus pies caigan en `(y+foot)*isoK`.
- **Suelo:** `Assets.arena` se pre-renderiza UNA vez en un canvas offscreen ya aplastado (`Proj.flatten`, cacheado por canvas de origen; se rehace al cambiar de bioma). Sin trapecio (se priorizó el aplastado simple). Limitación: los props que `Assets.arena` hornea en el suelo (columnas, lápidas, postes de antorcha, velas) quedan aplastados a 0,62; las llamas se bajan para casar con el poste aplastado.
- **Proyectiles:** de pie, con dirección visual proyectada (`Proj.ang(a) = atan2(sin a * K, cos a)`). Suelo y zonas, en cambio, giran en el plano lógico y se aplastan solas.
- **Cámara:** la arena aplastada (1440 x 810 x 0,62 = 502 px) cabe en la altura de 540: en vista inclinada la cámara solo se desplaza en horizontal (`G.VH` = alto lógico visible = H / K; `Proj.clampCamY` centra la arena si cabe). `G.VH` lo usan culling de gemas, objetivo automático de armas y la intro del jefe. HUD, cartas, barra del jefe y UI no se proyectan. El apuntado con ratón no existe en la expedición, pero `Proj.unx/uny` (`y_lógica = y_pantalla / isoK`) queda listo.
- **Aldea (Rescoldo):** NO se proyecta: `Assets.drawVillage` es un fondo pintado con su propia perspectiva lateral (no es un suelo plano), aplastarlo lo estropearía. La opción solo afecta a las expediciones.
- **Nivel 2 (isométrica 45°):** solo hay que cambiar `Proj.begin` (matriz del mundo), `Proj.up` / `Proj.ang` / `Proj.un*` (la inversa) y `Proj.flatten` (pre-render del suelo); ningún dibujo de juego tendría que tocarse.
- **Rendimiento (Chromium headless, render por software, 960x540):** horda 60 fps plana / 60 iso; jefe 55,5 / 53,8 (fase 2 con ataque 56,8 / 59,0); estrés con 110 enemigos añadidos ~50 fps en ambas. Sin regresión en la plana (`Proj.up/down` son no-ops).
- **Herramientas:** `tools/card-swarm-iso/` (`caps.js` capturas plana/iso, `merge.py` las une lado a lado, `perf.js` fps + toggle + táctil, `stress.js`). Capturas en `studio/docs/capturas-vista-iso/*_lado.png`.

## Cómo se juega
- Muévete esquivando al enjambre. Las cartas atacan solas; cada una muestra su cooldown girando.
- Matar suelta gemas verdes (XP), naranjas (Ceniza) y, a veces, corazones. Al subir de nivel eliges 1 de 3 cartas.
- Coger un duplicado **fusiona** (Nv2/Nv3, no gasta slot). Con la mano llena eliges qué slot reemplazar.
- La oferta se sesga hacia cartas que activan un combo nuevo: se enciende una línea entre las cartas y sale el banner.
- Sobrevive hasta el **7:30** (a 5/6 de la run): aparece el Pastor Corrupto, un jefe masivo con intro, fases, partes rompibles y ataque desesperado (ver "Jefes v4" abajo). Mientras vive, el reloj de la run se congela. Mátalo para ganar ("Mano ganadora"); a los 150 s de combate entra la Furia progresiva. Si mueres, `R` repite la expedición.

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
- Minijefes (v5, ver "Minijefes v5"): Coloso Escudero a 3:30 y Madre Colmena a 5:30 (escala de 9:00; nunca coexisten y desaparecen si siguen vivos al llegar el jefe). Jefe a 7:30: El Pastor Corrupto v4 (8 ataques, 3 fases + Éxtasis, 3 partes rompibles; sección "Jefes v4").
- Director: los enemigos fuertes REEMPLAZAN a los débiles: `G.B.tierCurve` (tabla por minuto con multiplicador de peso y de tope `maxAlive` por tier: 0 gusano, 1 arquero/espinoso/bomba, 2 jabalí/escudero/polilla, 3 sembrador/ascua/espectro/brujo; suelo `G.B.tierFloor` 0.12 para que los viejos sigan saliendo). Además: tiers por tiempo, tope por tipo (`maxAlive`), "enemigo protagonista" rotativo cada 60 s (peso x2.2) y packs temáticos (Línea, Cruce, Pinza, Campo) desde 2:45.
- Telegrafía: rojo = daño directo, azul = hielo/ralentiza, verde ácido = zonas persistentes, morado = invocación/teletransporte. Todo ataque avisa >= 400 ms antes de hacer daño.
- Run estándar de 9 minutos (`G.RUN_LEN`, 7 / 9 / 10 desde la Base), jefe en `G.BOSS_T` = 5/6 de la run (7:30 en 9 min); HP del jefe por fórmula y calibración (ver "Jefes v4").

## Balance rápido
- `G.B.anchorSlots` = 2: cartas ancla de la expedición (ver Bucle completo).
- `G.B.cardDmgMul` (main.js) = 0.98: multiplicador global del daño de todas las cartas (impactos, zonas, estados), aplicado en `Combat.deal`/`Combat.dot`. No toca el daño de enemigos.
- `G.B.skipAsh` = 5: Ceniza que da omitir una subida de nivel (cada omisión consume una subida pendiente de la cola).
- `G.B.tierCurve` / `tierFloor`: curva de reemplazo débil -> fuerte del director.
- **v5 (pasada de balance):** `G.B.xp` (curva de XP, `gemMul`, `lenMul`; tabla de niveles esperados en el comentario de `main.js`), `G.B.heal` (probabilidad y cantidad de curación), `G.B.speedRamp` (velocidad creciente),
  `G.B.mini` (minijefes) y en `loot.js`: `L.DROP_MUL`, `L.COST_MUL`, `L.BRASAS_*`, `L.MINI_PART_BONUS`, `L.PF_SOURCES.miniFrag`. Resumen y tablas en las secciones "Balance v5" de abajo.

## Parámetros de depuración (URL)
- `?speed=4` acelera el tiempo de simulación x4.
- `?god=1` jugador invulnerable.
- `?t=240` empieza la partida en el segundo indicado: `?t=100` espinoso, `?t=180` escudero, `?t=270` polilla/sembrador, `?t=330` élites y espectro, `?t=380` ascua, `?t=410` brujo, `?t=450` jefe.
- `?dbg=1` cuenta el daño recibido por fuente en `G.dbg.dmg` (consola) para ajustar el balance. Combínalo con `?god=1&speed=4` para recorrer la run entera.
- Minijefes: `G.Enemies.minis()` los lista y `G.Enemies.forceMini(e, 'charge')` fuerza un ataque (`bash stomp charge shields` / `spit acid rain tide`); con `?dbg=1` `G.dbg.atk` cuenta los ataques usados y `G.dbg.heal` la cura bruta por fuente (`fang pact bloodpoison gem card`).
- Consola: `G.Enemies.spawn('blinker', x, y)` crea cualquier tipo (`fanner shield moth sower blinker scorcher mini_bulwark mini_hive boss`).
- `?biome=cripta|asfodelo` cambia el fondo (y fuerza el destino).
- **Jefes v4:** `?boss=pastor` salta directo a la pelea (con intro; `&nointro=1` la omite), `?peligro=<n>` (1-5; solo Peligro I tiene UI), `&phase=2|3` empieza en esa fase, `&hp=0.3` fija el HP (fracción), `&hpcal=<n>` sustituye la calibración de HP, `&hand=spark:3,ember:2` carga una mano de prueba (cartas:nivel), `&dbg=1` cuenta el daño por fuente (`boss_salto`, `boss_pisoton`...). Consola: `G.Boss.info()`, `G.Boss.force('salto')`, `G.Boss.breakKey('cuernos')`, `G.Boss.gate()`, `G.Boss.hazards()` (telegrafías activas, lo que usa el bot).
- `?reset=1` borra el guardado (ojo: se borra en cada recarga mientras esté en la URL). `?pf=<n>` añade Puntos de Forja (techo 24). `?give=wick:20,frost:5,brasas:100` (o `all:30`) añade partes/Brasas; partes: `thread feather spine fang plate wick frost static rare`.
- `?view=iso` activa la vista inclinada tipo Hades (`?view=flat` la plana); ver su sección.
- `?len=7` fuerza la duración de la run en minutos (sin tocar el guardado).

## Estructura
`src/main.js` núcleo y balance (`G.B`: tabla de enemigos con coste, peso, entrada y `maxAlive`) · `player.js` (ralentización `p.slowT`) · `enemies.js` (IA, zonas `G.zones` con `team:'e'`, telegrafías) · `waves.js` (director) · `combat.js` (daño, estados, combos, gemas) ·
`weapons.js` (armas auto-fire) · `cards.js` (catálogo, mano, oferta filtrada por colección, anclas, dibujo de cartas) · `loot.js` (tabla de balance de botín/forja) · `save.js` (localStorage v2 con migración) · `aldea.js` (aldea, NPCs, movimiento) · `dialog.js` (burbujas) · `panels.js` (Tablón, Rufo, Portal, Archivo, menú) · `tree.js` (árbol de forja) · `quests.js` (encargos) · `base.js` (pantalla de botín y lanzador) · `assets_village.js` (arte de la aldea) · `assets_ui.js` (iconos de partes y botones por código) · `boss.js` (jefes v4: fases, ataques, partes, intro, barra, arena) · `assets_boss.js` (arte del Pastor, solo dibujo) · `hud.js` · `fx.js` · `sfx.js` (SFX por etiqueta y stinger) · `assets.js` (arte y audio procedural; ver `ASSETS_API.md`).

## Jefes v4 (fase J1): El Pastor Corrupto
Lógica en `src/boss.js` (arte en `assets_boss.js`, API en `ASSETS_API.md`). Diseño: `DESIGN-v4-jefes.md`. Cambios en otros módulos: `enemies.js` (el jefe vive en `G.enemies`, sus partes son entidades hijas `type:'bosspart'`; troncos bloquean proyectiles; `G.frozen` en la intro), `combat.js` (hooks `Boss.mulIn/afterHit/dealPart` en `deal` y `dot`), `waves.js` (director por fase), `hud.js`, `loot.js`/`save.js`/`base.js`/`panels.js` (trofeos, recompensas, destino del Portal), `player.js` (troncos, invulnerable en la intro), `main.js` (reloj `G.runT`, cámara con zoom).
- **Reloj:** `G.runT` es el reloj de la run y se congela mientras el jefe vive; `G.time` sigue (temporizadores, animación). El HUD muestra `G.runT` en gris.
- **Destino (Portal):** BOSQUE / CRIPTA / ASFODELO decide el jefe (J1: siempre el Pastor). Cripta se abre al vencer al Pastor; Asfodelo al vencer al jefe de la Cripta (aún no existe: queda bloqueado, "? ASFODELO"). Peligro: tabla `Boss.PELIGRO` (HP, daño +10 %/nivel, telegrafía -10 %, +1 add, Furia 120 s, partes +30 %, Brasas) lista, pero solo Peligro I tiene UI (`?peligro=n` para probar; las variantes de ataque III-V no están).
- **HP:** `6000 x hpCal x durMul(0,75/1/1,10 por 7/9/10 min) x Peligro`. **`hpCal` = 4,0** (24000 a 9 min, 18000 a 7, 26400 a 10; Peligro II-V: 27600 / 31200 / 36000 / 42000 a 9 min): la fórmula del doc supone DPS_ref p50 = 80 pero el DPS real contra un único blanco es ~2,6x mayor (medido con el bot: p25 ~120, p50 ~210, p75 ~295; la exposición real es ~100 %, no 75 %, porque las cartas disparan mientras esquivas). Con hpCal 4,0 el p50 dura ~120 s. Cambiar solo `DEFS.pastor.hpCal`.
- **Intro de 3,5 s** (no saltable la primera vez; luego Espacio / Enter / toque tras 1 s): barras de cine, cámara al jefe con zoom 1,15 -> 1, caída con sombra y onda, tarjeta con retrato y nombre, rugido (sacudida 10/600, hit-stop 80 ms, flash), la barra se llena, el rugido dispersa al rebaño (quedan los 12 normales más cercanos), entra la música de jefe. Mundo enemigo congelado y jugador invulnerable.
- **Fases con puerta:** el HP no baja del 65 % / 30 % hasta que dispara la transición (3 s inmune, rugido, 2 corazones, tarjeta de fase, música +intensidad). F2 añade Esporas y el zarzal de borde (zonas lentas 20 %); F3 añade Estampida y el perímetro ardiente (se cierra ~44 px en 20 s, 10 de daño/400 ms; el Éxtasis lo apaga). A <8 % HP: **Éxtasis del Rebaño** (9 s, arena morada, oleadas de anillos con 2 huecos de 45 grados cada 1,3 s, jefe quieto y expuesto x1,25; si muere durante el éxtasis hay un "congelado" de 400 ms).
- **Ataques** (telegrafía con `Assets.drawBossTele`, contorno sólido en el último 25-33 %; firma = Embestida, Salto, Estampida: doble contorno + viñeta + aviso ascendente; saco barajado, sin repetir, con cooldown y condición de distancia; cadencia 2,8 / 2,3 / 1,9 s de inicio a inicio, mínimo 0,3 s de respiro):

| Ataque | Fases | Telegrafía | Daño | Exit (px) | Regla 250 ms + exit/190 |
|---|---|---|---|---|---|
| Barrido de cayado (puño con el Cayado roto: 110 px, 18) | 1-3 | 800 ms, arco 180 grados r 190 (hueco interior 40) | 24 | <= 95 | 750 <= 800 |
| Embestida del carnero | 1-3 | 900 ms, carril 90 x 520, línea fija los últimos 300 ms | 30 | 55 | 540 <= 900 |
| Pisotón sísmico | 1-3 | 700 ms, 2 ondas (0,4 s) con hueco de 60 grados, v 200 | 20 | huir radial (200 vs 190: no alcanza) o hueco | ok |
| Salto aplastante | 1-3 | 1000 ms, círculo r 120 donde estaba el jugador al empezar, ventana x1,25 1,5 s al caer | 30 | 130 | 936 <= 1000 |
| Abanico de espinas | 1-3 | 600 ms, cono 70 grados; 7/9/11 espinas (-2 sin Vellón), 3 salvas en F3 | 10 c/u | ~30 (huecos) | ok |
| Llamada del rebaño | 1-3 | 800 ms, anillo morado + aparición morada | 0 | - | adds (tope 4 vivos, 6 en Peligro V) |
| Esporas del Rebaño | 2-3 | 1000 ms, 3 círculos verdes r 60 a 140-200 px del jugador, 6 s | 8/tick | 70 | 620 <= 1000 |
| Estampida | 3 | 700 ms + 2 re-aim de 600 ms (el doc dice 500: con 300 ms de línea fija se cumple la regla), 3 carriles 90 x 420, termina aturdido 2 s x1,35 | 24 c/u | 55 | 540 <= 600 |
- **Partes** (entidades hijas con hitbox de `Assets.bossAnchors`, medidor = % del HP del jefe; el daño de área que toca cuerpo y parte cuenta una sola vez): Cuernos 9 % (la Embestida pierde empuje y solo aturde contra tronco), Cayado 8 % (Llamada solo gusanos y cd 30 s; el Barrido pasa a puñetazo), Vellón 11 % (mientras está entero el cuerpo recibe x0,8; **se desgasta con el 22 % del daño al cuerpo** porque queda dentro del círculo del cuerpo y los proyectiles nunca lo tocaban; al romperse x1,0 y -2 espinas). Romper una parte: derribo 3 s x1,3 (interrumpe el ataque), corazón, **trofeo** (Cuerno del Pastor, Cayado Astillado, Vellón Calcinado; **cada trofeo cuenta como 1 Esencia** genérica en J1) y +40 Brasas.
- **Debilidades:** Fuego x1,25 (F1-F2), Acero x1,25 (F3); resistencia Veneno x0,8; iconos en la barra. Ventanas (x1,25 / x1,35 aturdido / x1,3 derribo / x1,25 éxtasis; gana la mayor) con aro dorado y arco de cuenta atrás. **Furia:** a los 150 s de combate +25 % de daño y cadencia, +10 % cada 15 s (tope +100 %).
- **Recompensas:** 12 Brasas + 4 por parte rota (x Peligro; v5, antes 150 + 40: las Brasas salen ahora sobre todo del reloj de la run); las partes rotas pagan Brasas y sueltan trofeo aunque pierdas; PF 2 (3 la primera vez; techo global 24 intacto); garantizados `fang x2, thread x2, feather x1` + 1 Esencia segura. La pantalla final muestra jefe, tiempo o % de vida restante, partes rotas, trofeos y el desglose de Brasas.
- **Hecho como fallback (no se tocó el arte/audio):** solo existen las pistas `normal` y `boss` -> la música de jefe sube de intensidad por fase (0,55 / 0,78 / 1,0) sin capas cuantizadas ni stinger propio (se usa el SFX `special`); no hay SFX propios de jefe (se reutilizan `boss_roar`, `hit_heavy`, `shockwave`, `whoosh`...); zoom de combate 0,9 no implementado (solo el de la intro); iconos de etiqueta de la barra son chips de color con 3 letras + las flechas `icon_weak/icon_resist`; "reducir sacudidas" en Ajustes divide por 3 (`G.shakeMul`), tope 12 px.
- **No incluido (J2/J3):** Karceron y Letea, cacería de Vesper, UI de Peligro II-V y sus variantes, miniboss con partes.

### Calibración con el bot (Peligro I)
Bot esquivador (`tools/card-swarm-boss-bot/`: `bot.js` se inyecta en la página, `fight.js`/`batch.sh` lanzan las peleas con Playwright + Chromium, `caps.js` hace las capturas de `studio/docs/capturas-jefes-j1-logica/`; sirve con `python3 tools/serve.py card-swarm 8765`): lee las telegrafías vía `G.Boss.hazards()` + zonas + proyectiles, reacciona 250 ms después de verlas, decide cada 100 ms, un 10 % de pasos "distraído" (ignora telegrafías) y un 10 % de movimiento al azar; llega al jefe con 60-100 HP. Tres manos fijas a 9 min (ver tabla): duración y victorias del bot.

| Build | DPS efectivo | Duración (s) | Victorias |
|---|---|---|---|
| p25: Chispa2 Dardo2 Esquirla1 Reloj Colmillo1 | ~120 | 190-226 (Furia desde 150 s) | 9/40 (23 %) |
| p50: Chispa3 Dardo2 Esquirla2 Daga2 Colmillo1 | ~210 | 110-136 (mediana 121) | 32/40 (80 %) |
| p75: 5 cartas de inicio al Nv3 | ~295 | 80-96 (mediana 86) | 36/40 (90 %) |

Ponderado 25/50/25: **68 % de victoria** (objetivo ~65 %; 40 peleas por build). Sensibilidad a la atención del bot (24 peleas por build): 5 % de lapsos -> p25 50 % / p50 96 % / p75 100 % (ponderado ~85 %); 22 % -> 4 % / 33 % / 75 % (~36 %). Con reacción 320 ms + decisión cada 150 ms (fuera de la regla de esquiva: 320 + 150 + 630 > 1000 ms del Salto) el bot recibe Salto/Pisotón continuamente y baja a ~45 %. Muertes tempranas (13-35 s) = llegar con 60-70 HP y comerse bombas (29) y Pisotón; las pérdidas del p50 son mayormente por daño acumulado, no por ráfagas. Partidas completas (bot con el mismo perfil, god hasta el jefe, 28 niveles, mano de inicio al Nv3, jefe con la horda real): 7/8 victorias, 80-92 s (hpCal 3,5 entonces). Un humano real puede salir distinto: el bot lee la geometría exacta de cada telegrafía; si el 65 % real queda lejos, ajustar solo `hpCal` (más largo = más difícil) o la cadencia de fase. Rendimiento (Chromium headless sin GPU): 60 fps con horda antes del jefe, 56-58 fps en la pelea (fase 1 y fase 2 con zarzal/esporas) a 960x540, 59,8 fps a 844x390 con pantalla táctil (el joystick flotante mueve al jugador); máx 60 proyectiles enemigos, 4 adds de jefe, 12-15 normales.

## Balance v5 (pasada de experiencia, minijefes, curación, velocidad y drops)
Feedback del dueño tras jugar la aldea y una expedición de 7 min. Todo medido con `tools/card-swarm-balance-bot/` (ver al final); "antes" = el código anterior a esta pasada, mismo bot, mismas condiciones.

### 1. Experiencia
- `G.B.xp`: nivel L -> L+1 cuesta `round(26 + 0,9 L^2)` (L=1: 6; antes `8 + 6 L`) y cada gema de XP vale x**0,5** (`gemMul`) x `lenMul` (7 min x1,30 / 9 min x1,00 / 10 min x0,885: las runs cortas comprimen el director y dan más kills por minuto).
- Objetivo: la build completa (5 cartas Nv3 = nivel ~14-15 con el bot) llega al ~77 % de la run (poco antes del jefe), no a la mitad. Tabla (nivel al empezar cada minuto; el jefe congela el reloj de la run, por eso el nivel se estanca en 15 al final):

| Minuto | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | Build completa (5 x Nv3) |
|---|---|---|---|---|---|---|---|---|---|---|---|
| 7 min antes | 5,0 | 8,0 | 12,0 | 16,0 | 20,1 | 24,0 | 25,3 | | | | 3:23 |
| **7 min ahora** | 3,0 | 6,0 | 8,0 | 10,0 | 12,6 | 14,9 | 15,0 | | | | **5:23** (jefe a 5:50) |
| 9 min antes | 5,0 | 8,0 | 11,0 | 14,1 | 17,8 | 21,6 | 25,3 | 28,0 | | | 3:46 |
| **9 min ahora** | 3,0 | 5,0 | 6,0 | 8,0 | 10,0 | 12,0 | 14,0 | 15,0 | 15,0 | | **6:55** (jefe a 7:30) |
| 10 min antes | 5,0 | 7,9 | 10,1 | 13,1 | 17,0 | 20,0 | 24,0 | 27,9 | 29,8 | 30,0 | 4:02 |
| **10 min ahora** | 3,0 | 4,0 | 6,0 | 7,0 | 9,0 | 11,0 | 12,0 | 14,0 | 15,0 | 15,0 | **7:46** (jefe a 8:20) |

El bot es algo más eficiente que una persona (siempre fusiona, recoge casi todas las gemas): un humano llegará a la build completa justo al aparecer el jefe. Cartas Nv3 por minuto (7 min, antes -> ahora): min 2 3,0 -> 1,4; min 3 4,0 -> 2,3; min 4 5,0 -> 3,0; min 5 5,0 -> 4,0; min 6 5,0 -> 5,0.

### 2. Minijefes v5 (`enemies.js`, constantes en `G.B.mini`)
HP 420 / 520 -> **2200 / 2800** (el bot los mata en 44-57 s con la build a medias, Σ nivel de cartas 8 y 12; antes en 7-21 s, media 14 s, con la build ya completa), enrage al 50 % de vida, una **parte rompible** y ventanas de exposición, 2 ataques nuevos cada uno (los 2 originales se mantienen), botín garantizado mayor y PF.
La telegrafía de todo ataque nuevo es >= 400 ms y cumple la regla de esquiva (`tele >= 250 + 1000 x px_de_salida / 190`); medido en el juego con `tools/card-swarm-balance-bot/minis.js`.

| Minijefe | Ataque | Telegrafía (medida) | Salida (px) | Regla | Notas |
|---|---|---|---|---|---|
| Coloso Escudero | Golpe de escudo (original) | 700 ms, cono 90 grados r 100 | ~60 | 570 <= 700 | |
| | Pisoteo con ondas (original) | 700 ms, círculo r 125, 3 ondas (4 enrage) | huir/saltar la onda | ok | |
| | **Embestida con onda de choque** (nuevo) | **800 ms** (carril rojo 64 x 300 fijo los últimos 300 ms + círculo r 95 en el punto de parada); carga a 340 px/s; anillo de 380 ms que crece hasta r 95 | 42 (carril) / 105 (anillo) | 471 <= 800 / 800 <= 800+880 | queda **expuesto x1,5 1,6 s**; enrage: doble embestida (2.ª telegrafía 600 ms) |
| | **Escudos giratorios** (nuevo) | **650 ms** (fantasmas + círculo r 96), 3 s giran a r 80 (4 en enrage; tocarlos 12 de daño), aviso de lanzamiento **500 ms** (carriles de 26 px) y salen a 250 px/s | 23 (carril) / fuera del círculo 96 | 371 <= 500 | |
| | **Parte: Escudo** | medidor azul bajo la barra: el daño FRONTAL bloqueado (antes de reducirlo) gasta el 30 % del HP máx.; al romperse cae el escudo (sin bloqueo), ventana x1,5 3 s, corazón y +2 Placa | | | atacar por la espalda / orbitales / áreas no lo gasta |
| | Enrage al 50 % | rugido 900 ms, vel x1,35, descansos x0,7, escudos 4, ondas 4, doble embestida | | | muesca blanca en la barra |
| Madre Colmena | Escupitajo y Ácido (originales) | 500 ms / 900 ms (zona) | | ok | |
| | **Lluvia de larvas** (nuevo) | **750 ms**: 5 círculos rojos r 26 (7 en enrage) que se cierran; al caer 14 de daño y dejan una larva | 36 | 440 <= 750 | tope de 12 larvas suyas vivas |
| | **Marea ácida** (nuevo) | **1000 ms**: 4 charcos r 50 (5 en enrage) en anillo a 115 px del jugador, 5,5 s | 60 | 566 <= 1000 | |
| | **Estallido de enjambre** (nuevo, al 50 % de vida) | **1150 ms**: círculo rojo r 150 que se llena; revienta con onda (14 de daño) y 8 larvas; queda **expuesta x1,4 2,2 s**; a partir de ahí Hinchazón cada 9 s (8 larvas), vel x1,2, descansos 2,2 s | 160 | 1090 <= 1150 | |
| | **Parte: Saco de larvas** | medidor verde: absorbe el 40 % de TODO el daño hasta el 28 % del HP máx.; al romperse: ventana x1,4 3,5 s, 6 larvas, corazón, +2 Hebra y desaparece la Lluvia | | | |

- **No se solapan:** la Colmena espera a que el Coloso caiga (nunca hay dos minijefes), ninguno entra en los últimos 45 s antes del jefe final (`Waves.MINI_LAST`) y al aparecer el Pastor se retiran en silencio (la intro limpia zonas y proyectiles).
- **Botín:** `L.GUARANTEED` (Coloso 3 Placa + 2 Pluma + 2 Hebra, Colmena 3 Púa + 3 Hebra + 1 Pluma, Esencia 35 %) + bonus por parte rota + corazón; **PF:** el primer minijefe de cada tipo (+1, ya existía) y 1 fragmento por kill (2 = +1 PF: matar los dos en una run da +1 PF).
- **Legibilidad:** rojo = daño directo, verde ácido = zonas persistentes, aro dorado y `x1,5 EXPUESTO` sobre la barra durante las ventanas, contorno oscuro en las telegrafías (se leen sobre el círculo rojo del ritual).
- Medido (god, 8 runs por duración; ataques por run con jugador casi inmortal): Coloso `bash 2,6 / stomp 2,9 / embestida 3,0 / escudos 3,2`, Colmena `escupitajo 3,2 / ácido 3,2 / lluvia 2,9 / marea 3,1 / hinchazón 2,4`, enrage 1,0 cada uno; escudo y saco rotos en 8/8 runs. Capturas: `studio/docs/capturas-balance-v5/` (`b*` Coloso, `h*` Colmena, `e*` flujo aldea-portal-botín).

### 3. Curación
La única curación "por golpe" era el robo de vida: **Pacto ardiente** (Sangre + Fuego: +2 HP por kill de Fuego, ~85-90 % de toda la cura que no viene de corazones) y **Colmillo** (+1 HP por kill). Ahora curan solo con `G.B.heal.chance` = **20 %** por kill:
Pacto ardiente **4 HP** (media 0,8 HP por kill de Fuego, -60 %) y Colmillo **3 HP** (0,6 por kill, -40 %). Medido con una mano fija (Chispa3 Bola3 Colmillo3 Dardo2 Daga2, 6 runs de 9 min, cura cruda sin corazones): **2,85 -> 1,36 HP/s (-52 %)**; Pacto 2,60 -> 1,13 HP/s; corazones de suelo (0,7-0,8 HP/s) sin cambios.
Revisados y **sin cambiar**: Sangre envenenada (4 HP cada 15 kills de envenenados, ~0,18 HP/s), Corazón de lana (+30 vida máx. y cura 30 una vez al elegir la carta), corazones (2 % por kill, 12 HP; los élites sueltan 24 y romper una parte de jefe/minijefe suelta 1), 2 corazones al cambiar de fase del Pastor, y el nodo **Corazón de brasa** (F11, maestría: revive una vez por expedición con el 40 %). No hay otro nodo, set ni combo que cure.

### 4. Velocidad creciente de los enemigos
`G.B.speedRamp` = +0,8 % por minuto virtual (`G.vt()`, escala de 9:00, igual que `hpMult`/`dmgMult`) con tope **+25 %**, solo sobre `e.spd` de los enemigos **normales** (no élites, no jefe, no adds del jefe; el jefe sigue con su Furia). La velocidad de ataque
(carga del Jabalí 380, dash del Ascua 300, flechas, ondas) y todas las telegrafías son tiempos fijos, no cambian. Velocidad media de los normales (multiplicador sobre la base, medido con el bot): 7 min 1,006 / 1,016 / 1,027 / 1,036 / 1,046 / 1,057 (min 1-6; antes 1,000 siempre), 9 min 1,005 ... 1,052 (min 7) ... 1,060 (jefe), 10 min 1,004 ... 1,061; con el tope no se alcanza en ninguna duración (haría falta una run de ~31 min virtuales).
Regla de esquiva: el enemigo normal más rápido es la Bomba (105 px/s base) = 131 px/s con el tope, menos que el jugador (190). Con una ralentización del 40 % (114 px/s) la Bomba al tope sería algo más rápida, pero una Bomba encendida solo avanza ~23 px durante su mecha (0,25 x vel x 0,7 s) y el margen de salida sigue siendo ~97 px sobre los 70 del radio. Los 700 ms de mecha, los 600 ms del Jabalí / Ascua y el resto de telegrafías no dependen de la velocidad, así que `tele >= 250 + 1000 x salida / 190` se cumple igual (Bomba 618 <= 700; Jabalí 381 <= 600).

### Herramientas de prueba v5 (`tools/card-swarm-balance-bot/`; `python3 tools/serve.py card-swarm <puerto>`; Playwright + Chromium, sin instalar nada)
- `run.js` (bot de balance: kitea, recoge gemas, fusiona; `?dbg=1&god=1&speed=20`; `{"base","len","runs","par","hand","god","hpBoost","noLevel","label"}`) + `bot_page.js` (se inyecta; registra nivel, cartas Nv3, velocidad de enemigos, cura, partes y TTK de minijefes por minuto) + `summarize.js <label>` (tablas).
- `campaign.js <url> <label>`: gasta el botín de las runs medidas como lo haría un jugador (campaña de 5 runs con arrastre, lo más barato primero) con las funciones de coste de la página indicada (`before` vs `after`).
- `minis.js`: fuerza cada ataque de los minijefes, mide la duración de cada telegrafía y hace capturas; `e2e.js`: aldea -> Tab -> portal -> expedición -> jefe -> botín -> R / B -> forja / compras -> nueva salida; `dump.js`: recetas y nodos con coste.
