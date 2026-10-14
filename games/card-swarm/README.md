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
- Élites únicos: Coloso Escudero a 3:30 y Madre Colmena a 5:30 (desaparecen si siguen vivos al llegar el jefe). Jefe a 7:30: El Pastor Corrupto v4 (8 ataques, 3 fases + Éxtasis, 3 partes rompibles; sección "Jefes v4").
- Director: los enemigos fuertes REEMPLAZAN a los débiles: `G.B.tierCurve` (tabla por minuto con multiplicador de peso y de tope `maxAlive` por tier: 0 gusano, 1 arquero/espinoso/bomba, 2 jabalí/escudero/polilla, 3 sembrador/ascua/espectro/brujo; suelo `G.B.tierFloor` 0.12 para que los viejos sigan saliendo). Además: tiers por tiempo, tope por tipo (`maxAlive`), "enemigo protagonista" rotativo cada 60 s (peso x2.2) y packs temáticos (Línea, Cruce, Pinza, Campo) desde 2:45.
- Telegrafía: rojo = daño directo, azul = hielo/ralentiza, verde ácido = zonas persistentes, morado = invocación/teletransporte. Todo ataque avisa >= 400 ms antes de hacer daño.
- Run estándar de 9 minutos (`G.RUN_LEN`, 7 / 9 / 10 desde la Base), jefe en `G.BOSS_T` = 5/6 de la run (7:30 en 9 min); HP del jefe por fórmula y calibración (ver "Jefes v4").

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
- `?biome=cripta|asfodelo` cambia el fondo (y fuerza el destino).
- **Jefes v4:** `?boss=pastor` salta directo a la pelea (con intro; `&nointro=1` la omite), `?peligro=<n>` (1-5; solo Peligro I tiene UI), `&phase=2|3` empieza en esa fase, `&hp=0.3` fija el HP (fracción), `&hpcal=<n>` sustituye la calibración de HP, `&hand=spark:3,ember:2` carga una mano de prueba (cartas:nivel), `&dbg=1` cuenta el daño por fuente (`boss_salto`, `boss_pisoton`...). Consola: `G.Boss.info()`, `G.Boss.force('salto')`, `G.Boss.breakKey('cuernos')`, `G.Boss.gate()`, `G.Boss.hazards()` (telegrafías activas, lo que usa el bot).
- `?reset=1` borra el guardado (ojo: se borra en cada recarga mientras esté en la URL). `?pf=<n>` añade Puntos de Forja (techo 24). `?give=wick:20,frost:5,brasas:100` (o `all:30`) añade partes/Brasas; partes: `thread feather spine fang plate wick frost static rare`.
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
- **Recompensas:** 150 Brasas + 40 por parte rota (x Peligro); las partes rotas pagan Brasas y sueltan trofeo aunque pierdas; PF 2 (3 la primera vez; techo global 24 intacto); garantizados `fang x2, thread x2, feather x1` + 1 Esencia segura. La pantalla final muestra jefe, tiempo o % de vida restante, partes rotas, trofeos y el desglose de Brasas.
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
