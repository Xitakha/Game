# Assets API (src/assets.js)

Generador de recursos 100% original, sin dependencias ni ficheros externos. Script clasico:
`<script src="src/assets.js"></script>` -> `window.Assets`. Todo se genera al cargar (sprites) o tras un gesto (audio).

## Sprites
Dibujo vectorial por codigo en canvas (desde v3; antes pixel-art), rasterizado a x2 (`Assets.scale`). Los personajes miran a la DERECHA (voltear con scale -1 o rotar al apuntar). Tamanos = pixeles finales.

`Assets.sprite(name, frame)` -> `HTMLCanvasElement`. `frame`: numero (cicla), `'anim'` o `'anim:n'` (p. ej. `'walk:2'`).
`Assets.animFrame(name, anim, tMs)` -> canvas segun fps. `Assets.frames(name)`, `Assets.info(name)`, `Assets.list()`.
`Assets.addToPhaser(scene.textures)` registra cada frame como textura `"name:frame"` (p. ej. `player:3`).

| name | tam | frames / animaciones |
|---|---|---|
| player | 48x48 | 0-1 idle, 2-5 walk, 6-8 attack (windup/golpe/recuperacion), 9-12 roll, 13 hurt |
| worm | 32x32 | 0-1 walk |
| archer | 40x40 | 0-1 walk, 2 shoot |
| boar | 48x36 | 0-1 walk, 2 charge |
| bomb | 32x32 | 0-1 walk, 2-3 lit (parpadeo) |
| warlock | 40x48 | 0-1 idle, 2 cast |
| boss (Pastor Corrupto) | 96x96 | 0-1 idle, 2 swing (cayado), 3 slam |
| arrow / thorn / fireball | 24x10 / 20x10 / 20x20 | arrow 0-1, thorn 0, fireball 0-1 (proyectiles, apuntan a la derecha) |
| slash | 44x64 | 0-2 arco del tajo; origen = centro del jugador (x=4, y=32) |
| explosion | 64x64 | 0-2 |
| spark, ember | 6x6 | 0-1 |
| smoke, dust | 16x16, 12x12 | 0-2, 0-1 |
| flame | 16x20 | 0-2 |
| shadow | 28x12 | 0 (sombra bajo personajes) |
| ground0..ground5 | 32x32 | tiles de suelo oscuro de bosque, sin costuras (ground0 = liso, usar mayoritariamente) |
| rock0 rock1 rock2 | 28x22, 36x26, 18x14 | decoracion |
| grass0..2, mushroom | 16x16 | decoracion |
| rune0, rune1 | 32x32 | runas brillantes semitransparentes para el suelo |
| ritual_circle | 128x128 | circulo ritual central semitransparente |

Animaciones con nombre (`Assets.info(n).anims`): player idle/walk/attack/roll/hurt; worm walk; archer walk/shoot; boar walk/charge; bomb walk/lit; warlock idle/cast; boss idle/swing/slam; slash swing; etc.
Los tintes (flash blanco, rojo de dano, rabia del jefe) se hacen en el juego (tint de Phaser o globalCompositeOperation).

## Audio (WebAudio, sin muestras)
- `Assets.unlock()` -> `Promise<boolean>`: crea/reanuda el AudioContext. Llamar dentro de un gesto (click/tecla). Ademas el script se engancha solo al primer pointerdown/keydown. Antes del gesto `sfx()` no suena (devuelve false) y `music.start()` queda pendiente y arranca al desbloquear.
- `Assets.sfx(name, {pitch=1, vol=1})`: `hit, hit_heavy, roll, hurt, enemy_die, pickup, card_select, special, boss_roar, wave_start` y extras `shoot, explosion, game_over`. Tip: golpes 1/2/3 -> `sfx('hit',{pitch:1}/{pitch:1.15}/{pitch:1.3})` y `hit_heavy` en el remate.
- `Assets.music.start() / stop() / setIntensity(0|1) / isPlaying()`: loop procedural oscuro (bajo saw, bombo/caja/charles, arpegio menor, pad; Am-Am-F-E-Am-Dm-F-E, 108 BPM; intensidad 1 = jefe: 128 BPM, bombo a negras, mas arpegio).
- `Assets.setVolume({master, sfx, music})` (0-1), `Assets.setMuted(bool)`, `Assets.isUnlocked()`, `Assets.sfxNames()`.

## Uso rapido
```js
ctx.drawImage(Assets.sprite('player', 'walk:' + step), x - 24, y - 24);
Assets.sfx('hit', { pitch: 1.15 }); Assets.music.start();
```
Vista previa: `tools/asset-preview/index.html` (abrir con un servidor estatico o file://).


---
# Ampliacion v2 (todo aditivo: nada de lo anterior cambia de nombre ni de indice de frame)

## Estilo
Shading automatico a 4 tonos (base, luz calida arriba-izquierda, sombra violeta abajo-derecha, sombra profunda inferior) + contorno oscuro unico `#120c1a`. Paleta: violetas oscuros, lana crema, acentos rojo/naranja.
`frame` acepta tambien `'anim:n'` para cualquier animacion; las de una pasada (`loop:false`, p. ej. `die`) se quedan en el ultimo frame. Nuevas utilidades: `Assets.animDuration(name, anim)` (ms), `Assets.hasAnim(name, anim)`.

## Animaciones nuevas (los frames viejos conservan su indice; los nuevos van detras)
| sprite | anims |
|---|---|
| player | `idle` (respira + parpadeo), `walk` (6 frames: 2,3,14,4,5,15), `attack` (anticipacion 16, windup 6, impacto 7, recuperacion 8, retorno 17), `die` (13 + 19-23: cae, disuelve en brasas) |
| worm | `walk` 6, `attack` (6-8), `die` |
| archer | `walk` 6, `shoot` (nock 7, draw 2, release 8, rec 9), `aim`, `idle`, `die` |
| boar | `walk` 6, `attack` (escarba 7, carga 2, impacto 8, rec 9), `charge`, `idle`, `die` |
| bomb | `walk` 6, `lit`, `prime` (se hincha), `die` |
| warlock | `idle` (parpadeo), `cast` (anticipacion 3, cast 2, rec 4), `die` |
| boss | `idle` (balanceo + ojos), `swing` (6,2,7), `slam` (8,3,9), `die` |
`die` existe en todos los enemigos y el jugador (5 frames, 9 fps, no cicla). Uso: `Assets.animFrame(spr, 'die', msDesdeMuerte)`.

## VFX nuevos
| name | tam | notas |
|---|---|---|
| slash_1, slash_2, slash_3 | 44x64 | estela por golpe del combo (1: baja, 2: sube, 3: remate ancho con doble arco). 4 frames, mismo origen que `slash` (x=4,y=32). Usar `slash_<paso+1>` |
| shockwave | 96x96 | onda de choque, 5 frames, centrada |
| hitspark | 32x32 | chispas de impacto, 4 frames, centrada |
| smoke_big | 32x32 | humo 3 tonos, 5 frames |
| curse_flame | 20x28 | llama de la maldicion animada (6 frames, purpura-rojo-naranja) |
| torch_flame, torch_light | 16x24, 64x64 | llama (6 frames) y halo aditivo (3 frames de parpadeo) |
| shadow | 28x12 | ahora con borde suave |
| flame, explosion | | mismos frames/nombres, mejor dibujo; explosion 0-4 |
Ambiente: `Assets.vignette(w,h,{strength,inner,tint})` canvas cacheado; `Assets.drawFog(ctx,w,h,tMs,{alpha,layers,speed})`; `Assets.drawLight(ctx,x,y,tMs,scale)`; `Assets.drawTorch(ctx,x,y,tMs)` / `drawTorchFire` (base del poste en x,y).

## Biomas
`Assets.setBiome('bosque'|'cripta')` (defecto bosque), `getBiome()`, `biomes()`, `biomeInfo(name)`. Cambia los sprites por nombre: `ground0..ground9` (10 tiles; 6-9 nuevos), `rock0-2`, `grass0-2`, `mushroom`, `rune0..rune3`, y nuevos `bush0 bush1`, `bones0-2`, `stump0 stump1` (tocon / columna rota), `grave`, `torch`, `fog0 fog1`. Llamar antes de construir el suelo (el juego acepta `?biome=cripta`).
`Assets.decorate(ctx, w, h, {seed, wall, avoid, torches, density})` esparce arbustos/huesos/tocones/tumbas/runas del bioma sobre un canvas y devuelve `{torches:[{x,y}]}` para animar con `drawTorchFire`.
`addToPhaser` registra ademas `name@bioma:i`.

## Audio
- SFX: capas golpe grave + chasquido + ruido filtrado + reverb compartida (convolucion). `Assets.sfx(name,{pitch,vol,vary})`: `vary` (defecto 0.07) = variacion aleatoria de pitch por llamada. Nuevos: `hit_1 hit_2 hit_3` (combo), `whoosh`, `shockwave`, `flame`, `boss_die`, `step`.
- Musica en capas `pad / bass / perc / arp / melody`: `music.setIntensity(0..1)` las activa progresivamente (0: pad+bajo, .2-.4 percusion, .4-.6 arpegio, .65-.85 melodia; `true/false` = 1/0). `music.setTrack('normal'|'boss')`: la pista del jefe (Re menor, 142 BPM, galope de bajo, bombo doble) fuerza todas las capas. `getIntensity/getTrack/tracks/layers`.
  Cambio de comportamiento: `setIntensity(1)` ya no significa jefe; usar `setTrack('boss')` (waves.js ya lo hace).
- `Assets.getVolume()`.
- Export: `Assets.renderSfx(name,{pitch,vol,vary})` -> Promise<AudioBuffer>; `renderMusic({track,intensity,bars})`; `audioBufferToWav(buf)` -> Blob; `exportSfxWav`, `exportMusicWav` (OfflineAudioContext, sin red).

## Integracion en el juego (solo visual/audio, sin tocar logica)
fx.js: `hitspark/shockwave/puff/curse/corpse/drawCorpses` (particulas animadas con `anim:true`); player.js: walk/idle/die por anim, `slash_n`, onda + llamas en la maldicion; enemies.js: cadaver con anim `die`, walk de 6 frames, llama de maldicion; main.js: suelo con 9 variantes, `decorate`, antorchas con luz, niebla y vineta, `?biome=`; waves.js: intensidad por oleada y pista de jefe.

## Herramienta
`tools/asset-preview/index.html`: exporta PNG spritesheet (por sprite o atlas+JSON) y WAV (por SFX y musica), sliders de volumen/pitch/variacion, selector de bioma/pista e intensidad.


---
# v3: pasada de arte (estilo Cult of the Lamb + Hades). Tamanos, nombres e indices de frame NO cambian
- Sprites vectoriales: contorno oscuro grueso e irregular, color plano + 1 sombra + 1 brillo (ya no hay shading/contorno automatico por pixel). Jugador: cordero de lana cream, cara gris, ojos grandes, capa roja con ribete y cascabel, corona con ojo rojo. Enemigos: gusano morado, arquero azul, jabali naranja, bomba roja, brujo-ciervo amarillo, jefe carnero morado con astas.
- VFX: tajos gruesos naranja/blanco con contorno rojo oscuro y lineas de velocidad; llamas rojas/naranjas (verdes en `asfodelo`); explosion/humo con contorno.
- `ritual_circle` ahora depende del bioma (anillo de piedra + pentagrama brillante; calaveras en cripta). Nuevos sprites por bioma: `column` (28x44 base -> 56x88), `edge0/edge1` (80x56), y compartido `candle` (12x20).
- Biomas: `bosque` (claro de piedra musgosa, velas, hierba alta, lapidas con simbolo rojo), `cripta` (Hades: adoquin oscuro, huesos, costillas, urnas, antorchas grandes, borde de lava), `asfodelo` (nuevo: losas esmeralda, fuegos verdes). `?biome=asfodelo` funciona; `torch_flame`/`torch_light` cambian de color por bioma.
- `Assets.arena(w,h,{seed,wall})` -> `{canvas, torches:[{x,y,o}], ritual:{x,y,r}}`: fondo completo (exterior azul oscuro/lava, plataforma, circulo ritual central, decoracion, bordes). main.js lo usa en `buildGround`.
- Animar en runtime: `Assets.drawTorchFire(ctx,x,y,t,o)` acepta `o` de cada entrada de `torches` (`candle`, `scale`); `Assets.drawRitualGlow(ctx,x,y,t,r)` pulso aditivo del pentagrama; `Assets.drawFireflies(ctx,w,h,t,{count,view})` luciernagas (bosque) / brasas (cripta, asfodelo). `Assets.vignette` mas fuerte, tinte por bioma (azul/morado, rojo oscuro, verde oscuro).
- Cambios en src/main.js (solo visual): `buildGround` usa `Assets.arena`; draw anade glow ritual, luciernagas y vineta 0.8. Sin cambios de logica ni hitboxes.


---
# Swarm Hand v2 - sprites nuevos (src/assets_enemies2.js, cargado tras assets.js)
Nombres y frames EXACTOS (contrato; no cambian). Todos miran a la DERECHA. Tamano final = base x2. `die` = 5 frames, 9 fps, no cicla (`Assets.animFrame(n,'die',ms)`). Los indices `die` van justo despues de los frames normales.
Uso: `Assets.sprite('enemy_fanner','walk:'+i)`, `Assets.animFrame('enemy_fanner','walk',t)`, `Assets.info(n).anims`.

| sprite | final | frames normales | anims (fps) | die |
|---|---|---|---|---|
| enemy_fanner (Espinoso) | 40x36 | 0 idle, 1 idle2, 2-5 walk, 6 aim (inflado), 7 fire | idle [0,1] 4; walk [0,2,1,3,4,5] 8; aim [6]; shoot [7,1] 8 | 8-12 |
| enemy_shield (Escudero) | 48x48 | 0 idle, 1 idle2, 2-5 walk, 6 wind, 7 bash, 8 rec | idle [0,1] 4; walk [0,2,1,3,4,5] 7; bash [6,7,8] 10; wind [6]; rec [8] | 9-13 |
| enemy_moth (Polilla) | 40x40 | 0-3 alas (arriba, media, abajo, media2), 4 charge, 5 throw | fly [0,1,2,3] 14; charge [4]; throw [5,0] 8 | 6-10 |
| enemy_sower (Sembrador) | 44x44 | 0 idle, 1 idle2, 2-5 walk, 6 sow-down, 7 sow-up | idle [0,1] 4; walk [0,2,1,3,4,5] 7; sow [6,7,0] 8 | 8-12 |
| enemy_blinker (Espectro) | 40x48 | 0 float, 1 float2, 2 fade (alpha .4 + anillo), 3 fade2 (alpha .15), 4 slash-wind, 5 slash-hit | idle [0,1] 5; fade [2,3] 10; slash [4,5,0] 12 | 6-10 |
| enemy_scorcher (Ascua) | 56x32 | 0 idle, 1 idle2, 2-5 slither, 6 wind (enrollado), 7 dash (estirado), 8 rec (jadeo) | idle [0,1] 4; walk [0,2,1,3,4,5] 9; charge [6,7] 10; rec [8] | 9-13 |
| enemy_mini_bulwark (Coloso) | 64x64 | 0 idle, 1 idle2, 2-5 walk, 6 bash-wind, 7 bash, 8 stomp-wind, 9 stomp, 10 rec | idle [0,1] 3; walk [0,2,1,3,4,5] 6; bash [6,7] 8; stomp [8,9] 8; rec [10] | 11-15 |
| enemy_mini_hive (Madre Colmena) | 64x64 | 0 idle, 1 idle2, 2-5 float, 6 spit, 7 acid, 8 swell, 9 burst | idle [0,1] 3; float [0,2,1,3,4,5] 7; spit [6]; acid [7]; swell [8,9] 8 | 10-14 |

Nota: `idle` del Espectro/Polilla se usa tambien como "flotar". Los sprites del Espectro en `fade` ya llevan alpha y anillo dibujados; `fx_blink_ring` es el anillo en el SUELO del punto de reaparicion.

Proyectiles / VFX (anim `loop` en los de varios frames, salvo indicado):
| sprite | final | frames | notas |
|---|---|---|---|
| proj_thorn_small | 16x8 | 0-1 (`loop` 10fps) | espina del Espinoso, apunta a la derecha (rotar al angulo) |
| proj_frost_orb | 24x24 | 0-1 (`loop` 8fps) | orbe de hielo centrado |
| fx_spore_zone | 96x96 | 0 arm (punteado), 1-2 active (`active` [1,2] 4fps) | centrado, disco que ocupa todo el lienzo (r=48 final); escalar a r deseado (r 30..55 de juego => escala r/48 sobre el canvas) |
| fx_fire_cell | 44x44 | 0-2 (`loop` 10fps) | celda de 22 px de juego; centrada |
| fx_blink_ring | 48x48 | 0-1 (`loop` 8fps) | anillo violeta en el suelo, centrado |
| fx_shield_spark | 24x24 | 0 | chispa blanca centrada (usar con `fx.part`) |
| fx_freeze_ring | 40x16 | 0-1 (`loop` 6fps) | aro de hielo bajo los pies del jugador, centrado |

Helpers de dibujo (para extender): `Assets._h` expone `addV, V, Pclosed, Ppoly, Pblob, Prr, Pcirc, dyingFrames, DIE_ANIM, PH, OLC, rrand, puff, mkCanvas`.

# Swarm Hand v2 - protagonista
`player` (24x24 -> 48x48): ahora Marlo, el Tahur (mapache gris azulado, chaleco teal, visera jade, abanico de cartas en vez de espada). Indices de frame y anims IDENTICOS a v1 (idle, walk, attack, attack_hit, roll, hurt, die; frames 0-23).


---
# Aldea v3 "Rescoldo" (src/assets_village.js, cargado tras assets_ui.js; solo arte, sin logica)
Script clasico que extiende `window.Assets`. Mismo estilo (contorno grueso, color plano + sombra + brillo). Todos los tamanos "final" = base x2 = pixeles reales en el canvas 960x540. Los NPC miran a la DERECHA (voltear con `scale(-1,1)`). `t` SIEMPRE en milisegundos (`performance.now()`/`Date.now()`), igual que `Assets.animFrame`.

## 1) Funcion principal
`Assets.drawVillage(ctx, t, opts)` dibuja la aldea completa en 960x540 (cielo, suelo, caminos, edificios, props, NPCs, humo, luciernagas, luz).
opts (todos opcionales):
- `time`: 0..1 ciclo (0 = dia, 0.5 = ocaso [defecto], 1 = noche) o `'dia'|'ocaso'|'noche'`. Interpola cielo, tinte y luces. Nunca queda ilegible (tinte maximo ~55 %, la fogata/farolas/portal abren luz).
- `actors`: `[{ y, draw(ctx) }]` entidades a ordenar con el decorado por `y` (pies). Marlo va aqui: `{y: marlo.y + pies, draw: c => c.drawImage(...)}`. Un actor con `y` menor que el `sort` de un prop se dibuja detras de el.
- `npcs`: `true` (defecto: dibuja los 6 NPC idle en su sitio) | `false` (los dibujas tu con `Assets.drawNPC`) | `{ grum:{anim:'work', flip:true, x, y, hidden:true}, ... }` (override por NPC).
- `light` (true): capa de luz/tinte/brillos; `false` para dibujarla aparte con `Assets.drawVillageLight(ctx, t, opts)` (despues de actores y antes de la UI).
- `fireflies` (true), `smoke` (true: humo de la chimenea, olla y chispas), `vignette` (true).
`Assets.villageTime(name)` -> numero (`'dia'->0`, `'ocaso'->0.5`, `'noche'->1`).

## 2) Datos para la logica: `Assets.VILLAGE`
- `VILLAGE.w/h` 960/540; `VILLAGE.walk` = `{x:20,y:290,w:920,h:200}` zona caminable sugerida.
- `VILLAGE.spots`: `{ marloStart:{x,y}, portalReturn:{x,y}, bonfire:{x,y}, portal:{x,y}, forge:{x,y}, board:{x,y}, archive:{x,y}, tent:{x,y}, cart:{x,y} }` (px; y = base/puerta de cada edificio; `portal` = donde ponerse para entrar).
- `VILLAGE.npcs`: `{ grum:{name,title,x,y,flip,color,icon...}, vesper, rufo, ulalume, lanudo, castana }`. `x,y` = PIES del NPC (ancla), `flip` = orientacion por defecto.
- `VILLAGE.colliders`: `[{x,y,w,h,id}]` rectangulos sugeridos (edificios, anvil, cart, fogata, olla, troncos, vallas).
- `VILLAGE.props`: lista de props `{id,spr,x,y,sort}` (x,y = ancla bottom-center del sprite; `sort` = y de ordenacion).

## 3) NPCs (6)
Sprites `npc_grum`, `npc_vesper`, `npc_rufo`, `npc_ulalume`, `npc_lanudo`, `npc_castana`. TODOS 40x42 base = **80x84 final**, ancla = pies en (40, 80): `ctx.drawImage(Assets.sprite('npc_grum',0), x-40, y-80)`. Frames comunes: 0 idle, 1 idle2 (inspira), 2 parpadeo, 3-6 accion, 7 hablar (boca pequena), 8 hablar (boca abierta), 9 feliz (ojos ^ ^).
Anims: `idle` (respira + parpadeo cada ~5 s), `work` (accion propia), `talk` (mueve la boca), `happy`.
| NPC | animal / rasgo | `work` |
|---|---|---|
| grum | oso grande marron, pañuelo rojo, delantal de cuero, martillo al hombro | martillazo con chispas (golpea hacia la derecha-abajo: yunque a su derecha) |
| vesper | zorra delgada naranja/blanca, orejas altas, capa verde con papeles clavados | escribe con pluma en un pergamino |
| rufo | mapache grueso gris oscuro/antifaz negro, sombrero granate con pluma, chaleco mostaza, mochila ENORME | cuenta monedas (la moneda salta) |
| ulalume | buho morado, ojos amarillos enormes, sombrero de cartomante, cartas flotando | baraja/gira las cartas |
| lanudo | carnero crema, cuernos enroscados, baston, sentado en un tronco (ya incluido en el sprite) | gesticula/cuenta batallitas, golpea el baston |
| castana | erizo rosado, gorro de chef, delantal, cuchara | remueve la olla |
Helpers: `Assets.drawNPC(ctx, name, x, y, t, {anim:'idle', flip:false, scale:1, shadow:true, alpha:1, tOff})` (dibuja sombra + frame animado; x,y = pies). `Assets.NPC_NAMES`.
Retratos/emotes: `portrait_<npc>` (96x96 final, marco incluido; frames 0 neutro, 1 feliz, 2 hablando). `Assets.drawPortrait(ctx, name, x, y, {mood:0|1|2, size:96})` (x,y esquina sup. izq.).
Emotes sueltos: `emote` 16x16 base = 32x32 final, frames 0 corazon, 1 '!', 2 '?', 3 nota musical, 4 '...', 5 moneda, 6 destello, 7 gota de sudor. Se dibujan sobre la cabeza (~y-90).

## 4) UI de aldea
- `ui_bubble`: 9-slice de globo de dialogo, 24x24 base = 48x48 final, **borde de corte 16 px** por lado; frames 0 crema (NPC), 1 violeta oscuro (Marlo/narracion), 2 dorado (encargo). `ui_bubble_tail` 14x10 base = 28x20 final, mismos 3 frames, apunta ABAJO (rotar/voltear para arriba).
  `Assets.drawBubble(ctx, x, y, w, h, {style:0|1|2, tail:'down'|'up'|null, tailX:<x absoluta de la punta>, alpha:1})`: x,y = esquina sup. izq. de la caja; padding de texto recomendado 12 px. Colores de texto: estilo 0 `#2a1e3c`, estilo 1 `#fdf6e3`, estilo 2 `#3a2410`.
- `ui_mark_gold` / `ui_mark_green` (marcador '!' de misión: dorado = encargo nuevo, verde = completado/forjable): 14x22 base = 28x44 final, frames 0-3 (brillo girando), anim `shine` 6 fps. Poner centrado sobre la cabeza (y-96) con rebote `sin(t/300)*3` por codigo.
- `ui_key_e` 18x18 base = 36x36 final, frames 0 normal, 1 pulsada; anim `pulse` 2 fps. `ui_key_tab` 28x18 base = 56x36 final (mismos frames). `ui_arrow` flecha ABAJO 14x14 base = 28x28 final, frames 0-1 (anim `bob` 3 fps); rotar para otras direcciones.
- `fx_portal_glow` 64x64 base = 128x128 final, 4 frames (anim `loop` 6 fps): brillo del portal para dibujar centrado con `globalCompositeOperation='lighter'`. (drawVillage ya lo pone en el portal.)

## 5) Props / edificios como sprites sueltos (por si quieres componer tu escena)
Ancla = bottom-center salvo cielo/suelo (origen 0,0 a 960x540). Tamano final:
`vil_sky` 960x540 (frames 0 dia, 1 ocaso, 2 noche) | `vil_ground` 960x540 (transparente arriba, camino y plaza horneados) | `vil_forge` 192x152 | `vil_anvil` 44x28 | `vil_board` 128x136 (anim `wave` 3 fps, 3 frames) | `vil_archive` 144x192 | `vil_portal` 168x192 (anim `swirl` 8 fps, 6 frames) | `vil_tent` 144x128 | `vil_pot` 52x48 (anim `fire`, 3 frames) | `vil_cart` 136x104 | `vil_bonfire` 80x68 (anim `fire` 10 fps, 6 frames) | `vil_tree0` 112x144, `vil_tree1` 88x140, `vil_tree2` 88x120 (anim `sway` 1.2 fps, 2 frames) | `vil_lantern` 28x84 | `vil_torch` 24x68 (anim `fire` 9 fps, 4 frames) | `vil_fence` 64x32 | `vil_barrel` 32x40 | `vil_crate` 36x32 | `vil_hay` 44x28 | `vil_bush` 48x32 | `vil_bunting` 200x48 (anim `sway` 2 fps, 3 frames) | `vil_sign` 88x68 | `vil_cloud` 96x32 (2 frames).

## Notas finales Aldea v3 (valores reales del codigo)
- `VILLAGE.npcs[n]` = `{name, title, x, y, flip, color, top, sw, off}`: `top` = altura de la cabeza sobre los pies (px, para anclar burbuja/marcador `!`: y - top - 8), `sw` = radio X de sombra. Posiciones: grum (108,340), vesper (352,348), rufo (744,436 flip), ulalume (772,352 flip), lanudo (438,410), castana (538,352). Interaccion sugerida a <56 px de (x,y).
- `VILLAGE.spots`: marloStart (470,440), portalReturn (850,360), bonfire (480,402), portal (872,330; el arco ocupa x 788-956, y 116-308), forge (130,308), board (300,308), archive (715,308), tent (560,308), cart (668,426).
- Burbuja: la caja visible ocupa `x+2..x+w-2, y+3..y+h-4`; con `tail:'down'` la colita sale por debajo (+20 px), con `'up'` por arriba (-14 px). Sin `tail` (`tail:null`) solo caja.
- Orden de dibujo: cada prop tiene `sort`; los actores usan SUS PIES (`y`). Marlo con `y` > 308 queda delante de los edificios; con y<308 detras.
- `Assets.drawVillageLight(ctx,t,opts)` incluye vineta y el brillo del portal. Coste medido: ~5 ms/frame para `drawVillage` completo (Chromium headless).
- Vista previa: `tools/asset-preview/index.html?game=card-swarm` (seccion "Aldea Rescoldo": hora, animacion de NPC, colisiones). Capturas: `studio/docs/capturas-aldea/`.


---
# Jefes v4 (J1): Pastor Corrupto, centauro-carnero (src/assets_boss.js, cargado tras assets_village.js; solo arte, sin logica)
Script clasico que extiende `window.Assets`. Estilo del juego (contorno grueso, color plano + sombra + brillo). Tamanos "final" = base x2. Todo mira a la DERECHA (el dibujo compuesto voltea con `facing`). `t` SIEMPRE en ms. Diseno: `DESIGN-v4-jefes.md` 3.2. Vista previa: `tools/asset-preview/index.html?game=card-swarm` -> seccion "Jefe" (selector de ataque/progreso, fase, vel., salto, herido/furia/desesperado/ventana/aturdido/inmune/rugido, partes rotas, muerte, anclajes). Capturas: `studio/docs/capturas-jefes-j1/`.

## 1) Dibujar al jefe compuesto (lo unico que necesita la logica)
`Assets.drawBoss('pastor', ctx, x, y, state)` dibuja sombra grande + aura + jefe + efectos propios (polvo, esporas, estrellas, aro de ventana, campo de inmunidad). Devuelve `{canvas,ox,oy,pose,layout}`.
- **(x,y) = posicion logica de la entidad = centro del cuerpo (circulo de colision `r` 74)**. El sprite se coloca solo: los pies quedan en `y + 88` (`Assets.BOSS.pastor.gy`), la sombra en `y + 82`. **Ordenar por profundidad con `y + 88`** (pies) contra Marlo.
- Tamano visual aprox.: 250 de alto x 250 de ancho (incl. cuernos y cayado en reposo: de y-182 a y+88; de x-100 a x+130). El circulo logico `r` 74 cubre el barril; cuernos/cabeza/cayado sobresalen (usar `bossAnchors` para hitboxes hijas).
- Coste medido: ~2.8 ms/frame en Chromium headless sin GPU (1 canvas 640x470 compartido + 20 drawImage). Cachea sprites una sola vez; no hay `shadowBlur`.
- `Assets.renderBoss('pastor', state)` -> `{canvas, ox, oy}`: solo el jefe (sin sombra/aura/fx de suelo), el canvas es COMPARTIDO y se sobrescribe en cada llamada (para subirlo a una textura Phaser: origen del suelo en (ox,oy), el pie queda en oy, la posicion logica en (ox, oy-88)).
- `Assets.drawBossShadow(ctx,x,y,state)` (sombra sola; con `state.lift` se encoge y oscurece = telegrafia del salto). `state.noShadow`/`state.noFx` desactivan sombra / aura+fx.

### state (todo opcional salvo `t`; el jefe no guarda estado propio, lo pintas desde tu IA)
| campo | tipo | efecto |
|---|---|---|
| `t` | ms | reloj para idle/trote/parpadeos (obligatorio) |
| `facing` | 1 / -1 | 1 mira a la derecha, -1 a la izquierda |
| `phase` | 1-3 | ojos: F1 naranja, F2 rojo, F3 blanco; F3 suma brasas en el lomo |
| `moving` | 0..1 o bool | trote de patas (4 frames, diagonales alternas) |
| `speed` | px/s | velocidad real: marca el ritmo de trote (65 F1 / 80 F2 / 95 F3 = lento y pesado; >=400 = galope) |
| `hurt` | 0..1 o bool | flash blanco sobre la silueta + retroceso + cabeza "dano" (usar 0.6-1 durante ~100 ms) |
| `broken` | `{cuernos,cayado,vellon}` bool | cuernos: muñones; cayado: palo astillado y SIN farol (ni brillo); vellon: manto quemado con grietas y brasas que suben |
| `windup` + `wp` | nombre + 0..1 | **telegrafia** del ataque; `wp` = progreso (tiempo/duracion_telegrafia). Sin `wp` hace bucle de 1,1 s (solo preview) |
| `strike` + `sp` | nombre + 0..1 | **golpe/ejecucion** del ataque; `sp` = progreso. `strike` tiene prioridad sobre `windup` |
| `lift` | px | altura del salto (0 = suelo). Con `lift>2` se pliegan las patas, el cuerpo se alza `lift` px y la sombra se achica |
| `enraged` | bool | Furia: ojos rojos, tinte rojo pulsante y llamas rojas de aura |
| `desperate` | bool | Exstasis del Rebano: cayado clavado, puas al maximo, ojos blancos, aura morada, anillo de runas, temblor. Equivale a `windup:'extasis'` |
| `exposed` | bool | ventana de dano: aro dorado en el suelo (fx_window_ring) + tinte dorado pulsante |
| `stun` | bool | aturdido tras chocar (embestida): cabeza gacha, estrellitas, cayado caido |
| `immune` | bool | puerta de fase (3 s): tinte azulado + campo de puntos alrededor |
| `roar` | 0..1 | rugido (intro / cambio de fase): cabeza arriba boca abierta, brazos abiertos, temblor |
| `dying` + `dt` | bool + ms | muerte (ver 4); `dt` = ms desde que muere; `Assets.BOSS.pastor.deathMs` = 3200 (a partir de ahi no dibuja nada) |
| `alpha` | 0..1 | transparencia global (p. ej. entrada) |

Nombres de ataque (`windup` / `strike`; `Assets.bossPoseNames()`): `barrido` (arco con cayado), `embestida`, `pisoton`, `salto`, `abanico`, `llamada`, `esporas`, `estampida`, `extasis`. Lectura de cada pose (para que la telegrafia por silueta funcione, regla 1 del doc):
| ataque | windup (wp 0->1) | strike (sp 0->1) |
|---|---|---|
| barrido | cayado se alza hacia atras/arriba sobre la cabeza, torso atras | barrido de 180 grados hacia delante, torso adelante, cabeza ruge |
| embestida | cabeza y cuernos bajan, agacha el tren delantero, la pata delantera escarba, polvo, ojos rojos, cayado como lanza | galope (`speed` >= 520), cabeza gacha, lineas de velocidad y polvo detras |
| pisoton | se encabrita (tren delantero arriba, patas plegadas, brazos arriba) | pisa de golpe: cuerpo +8 px, temblor, polvo (la onda la dibujas con `drawBossWave`) |
| salto | se agacha (cuerpo aplastado), ojos se encienden | aterrizaje: aplasta, cayado se clava hacia delante, polvo |
| abanico | puas del lomo se erizan y brillan, brazos abiertos, retrocede 3 px | puas al maximo con brillo naranja, rebote |
| llamada | cayado en vertical, cabeza arriba y aullido, anillo de runas moradas en el suelo, farol brillante | pisotazo con cayado |
| esporas | se encorva, el vellon tiembla y suelta nubes verdes (fx_spore_puff) | estallido de esporas |
| estampida | igual que embestida pero mas rapida/agitada | galope |
| extasis | (estado fijo) cayado clavado, aura morada | - |
Duraciones de telegrafia: las del doc (barrido 800, embestida 900, pisoton 700, salto 1000, abanico 600, llamada 800, esporas 1000, estampida 700 ms): el dibujo no impone tiempos, solo reparte la pose por `wp`.

## 2) Anclajes y hitboxes hijas
`Assets.bossAnchors('pastor', state)` -> objeto con `{x,y,r}` en px **relativos a (x,y) de la entidad**, ya con `facing` y `lift` aplicados (sumar a la posicion del jefe). Sigue las animaciones: usa el MISMO state que `drawBoss`.
| clave | que es | r | reposo (facing 1) |
|---|---|---|---|
| `body` | centro del barril (hurtbox de contacto) | 74 | (0, -4) |
| `head` | cabeza | 26 | (55, -105) |
| `cuernos` | parte rompible "cuernos" | 30 | (51, -130) |
| `cayado` | parte rompible "cayado" (farol) | 26 | (87, -58) |
| `vellon` | parte rompible "vellon" (lomo) | 34 | (-26, -40) |
| `hand` / `shoulder` / `mouth` / `eyes` / `staffTip` | mano que agarra el cayado, hombro, hocico (origen de esporas/rugido), ojos, punta del cayado | 12/10/10/8/8 | - |
| `feet` | suelo bajo el cuerpo (orden de profundidad) | 0 | (0, 88) |
| `groundShadow` | centro de la sombra | 86 | (0, 82) |
Valores de reposo exactos: llamar a la funcion (cambian con la pose, p. ej. en `embestida` la cabeza avanza a x=104 y en `barrido` el cayado sube a y=-126).

## 3) Piezas sueltas (sprites; anclas y pivotes para quien quiera recomponer)
Todos en `Assets.sprite(name, frame)`. El dibujo compuesto usa jerarquia cuerpo -> torso -> cabeza/hombros -> cuernos/ojos; mano y cayado por cinematica inversa simple (el brazo se estira 0,7-1,45x hasta la mano). Coordenadas en espacio L: origen = suelo bajo el centro del cuerpo, +x adelante, +y abajo (la entidad esta en (0,-88)).
| sprite | final | frames | pivote/ancla (px finales, dentro del sprite) -> colocacion en L |
|---|---|---|---|
| `boss_pastor_body` | 192x144 | 0-1 idle (respiracion, ~1,6 Hz) | arriba-izq en (-96,-174); rota/aplasta alrededor de los pies traseros (-55,-8) |
| `boss_pastor_leg` | 40x72 | 0-3 trote lado cercano (contacto, bajo el cuerpo, atras, levantada), 4-7 lado lejano (mas oscuro) | cadera (20,10) -> caderas en x -62 (lejana trasera), -50, 44 (lejana delantera), 56 (cercana delantera), y=-62. Diagonales en fase |
| `boss_pastor_torso` | 96x112 | 0 idle, 1 windup (puas erizadas), 2 golpe | cintura = centro-abajo (48,112) -> (46,-84); gira alrededor de la cintura |
| `boss_pastor_head` | 64x64 | 0 neutro, 1 rugido, 2 dano/aturdido | cuello (32,56) -> torso+(8,-80), escala x1,2 al dibujar |
| `boss_pastor_eyes` | 24x12 | 0 naranja, 1 rojo, 2 blanco | centro (12,6) -> cabeza (0,-33). Brillo aditivo aparte |
| `boss_pastor_horn_l` / `_r` | 48x64 | 0 entero, 1 roto (muñon) | base (16,60) -> cabeza (-20,-42) rot -0.42 (lejano) y (-6,-44) (cercano), escala 0,78 |
| `boss_pastor_staff` | 40x176 | 0-1 entero (farol, 6 fps), 2 roto | agarre (20,100) -> en la mano; punta de hierro 76 px bajo el agarre; farol 66 px sobre el agarre |
| `boss_pastor_arm` | 44x84 | 0 cercano, 1 lejano (oscuro), 2 punyo | hombro (22,12); mano a ~56 px |
| `boss_pastor_fleece` | 112x80 | 0 entero (manto + 8 puas moradas), 1 roto/brasas | base-centro (56,80) -> (-26,-96); se escala en y con `abanico` |
| `boss_pastor_portrait` | 96x96 | 0 neutro, 1 furia, 2 herido (marco incluido) | `Assets.drawBossPortrait('pastor', ctx, x, y, {size:96, mood:0|1|2})` (x,y esquina sup. izq.) para barra e intro |

## 4) Muerte espectacular (`dying:true, dt:ms`)
0-150 ms flash blanco; 0-800 tambalea (parpadeos blancos, temblor, rugido de dolor); 500 ms: cuernos, cayado y vellon salen despedidos girando (solo las piezas que no estuvieran ya rotas); 800-1800 cae de rodillas (patas plegadas, cabeza gacha); 1800-3200 se desintegra en brasas (cuadros + brasas aditivas). A los 3200 no pinta nada (puedes quitar la entidad). Recomendado: `fx.shake(12, 900)`, hit-stop 120 ms, y para "congelado de 400 ms" del Exstasis basta con no avanzar `dt`.

## 5) Telegrafias y ondas (dibujan en `ctx`, coordenadas de juego)
- `Assets.drawBossTele(ctx, kind, x, y, o)`: `kind` = `circle{r}` | `arc{r,inner,arc}` (barrido: `arc` 180 grados, `inner` 40 = rosquilla) | `cone{r,arc}` (abanico 70 grados) | `rect`/`lane{w,len}` (embestida 90x520, estampida 90x420) | `ring{r,th,gap}` (pisoton: anillo creciente con hueco de 60 grados y chevrones verdes en el hueco) | `donut{r,inner}` | `summon{r}` (llamada, morado con runas) | `spore{r}` (esporas, verde punteado que se cierra).
  `o`: `p` 0..1 progreso (relleno alfa 0,12->0,40 + capa de progreso), `a` angulo (rad), `color` (`red|green|purple|orange|gold|blue`; por defecto rojo, `summon` morado, `spore` verde), `fix` (por defecto `p>=0.75`: contorno SOLIDO = objetivo fijado; antes es discontinuo y animado), `sig:true` ataque firma (doble contorno), `t` ms. Alfa maximo ~0,4: Marlo siempre se ve debajo.
- `Assets.drawBossWave(ctx, x, y, r, {th:24, gap:rad (0 = sin hueco), a:centro del hueco, style:0 rojo|1 morado (extasis)|2 verde, alpha})`: onda anular con hueco, hecha con `fx_shockwave_seg` (un segmento por ~46 px).
- `Assets.drawBossVignette(ctx, W, H, p, '255,30,20')` vineta roja de ataque firma; `Assets.drawBossArenaTint(ctx, W, H, t, a)` tinte morado de arena del Exstasis.

## 6) VFX / proyectiles / arena / iconos nuevos (nombre, tam final, frames, ancla)
| sprite | final | frames (anim) | notas |
|---|---|---|---|
| `proj_boss_thorn` | 32x16 | 0-1 (`loop` 10 fps) | pua grande morada con punta naranja; apunta a la derecha (rotar al angulo); centrada |
| `fx_shockwave_seg` | 128x32 | 0 rojo, 1 morado, 2 verde | segmento de onda (lo usa `drawBossWave`) |
| `fx_boss_crack` | 96x96 | 0-2 (`grow`, no cicla) | grieta del suelo (salto, pisoton), centrada |
| `fx_part_break` | 128x128 | 0-4 (`burst` 14 fps, no cicla) | estallido al romper una parte; centrado en la parte |
| `fx_window_ring` | 128x128 | 0-3 (`loop` 8 fps) | aro dorado; el dibujo compuesto ya lo usa si `exposed` |
| `fx_boss_spike` | 28x44 | 0-3 (`rise` [0,1,2] 12 fps; `sink` [3,0]) | estaca de suelo (espinas del Salto, F2); ancla = base-centro (14,42) |
| `fx_charge_trail` | 96x56 | 0-3 (`puff` 10 fps) | polvo de la embestida; centrado, mira a la derecha (voltear segun direccion) |
| `fx_spore_puff` | 32x32 | 0-3 (`puff` 8 fps) | nube de espora/vellon, centrada (escalar 1-2,5x) |
| `obs_log` | 64x64 | 0 entero, 1 agrietado, 2 escombro | tronco de arena; ancla = centro del circulo de colision (32,40) -> dibujar en (x-32, y-40); r de colision 28 |
| `fx_thorn_patch` | 80x56 | 0-2 (`sway` [0,1,2,1] 3 fps) | zarzal de espinas de borde F2 (verde): ancla centro (40,38); escalable para cubrir la zona lenta |
| `trophy_pastor_horn` / `_staff` / `_fleece` | 32x32 | 0 normal, 1 ROTO (gris con aspa roja) | icono de parte para la barra (dibujar a 16x16 = escala 0,5) y trofeo de botin |
| `icon_weak` / `icon_resist` | 24x24 | 1 | flecha verde arriba / gris abajo (12 px a escala 0,5) |
Reusa existentes: `fx_fire_cell` (44x44, celdas del perimetro ardiendo F3, naranja), `shockwave` (onda sin dano del aterrizaje de la entrada), `smoke_big`, `explosion`.

## 7) Notas para la logica / HUD
- **No tapar a Marlo**: todas las telegrafias <= 0,4 de alfa y sin relleno solido; el jefe se ordena por `y + 88` (si Marlo esta mas abajo se dibuja delante). El aura/aro de ventana van en el suelo bajo el jefe.
- Entrada: `drawBoss` con `windup:'salto', wp` (agachado) -> `lift` creciente (aire) -> `strike:'salto'` al aterrizar + `shockwave` + `fx.shake(8,220)`. Rugido de intro/fase: `roar` 0->1 ~600 ms.
- Partes: hitboxes hijas = `bossAnchors().cuernos/cayado/vellon`; al romperse pon `broken.X=true` y lanza `fx_part_break` en el ancla.
- Cayado roto: sin farol (la Llamada del rebano pasa a gusanos); cuernos rotos: se ve el muñon; vellon roto: brasas visibles desde cualquier distancia.
- Nombres de jefes/fases para la barra: `Assets.BOSS.pastor` = `{name:'El Pastor Corrupto', title:'Bestia del Rebaño', phases:['El Rebaño','La Corrupción','Cenizas'], despair:'Éxtasis del Rebaño', r:74, gy:88, w:250, h:250, deathMs:3200}`; `Assets.bossIds()`, `Assets.bossInfo(id)`.
- Karceron y Letea (J2) usaran la misma API (`drawBoss(id,...)`, `bossAnchors`, `drawBossPortrait`); sus sprites iran en `assets_boss_karceron.js`/`assets_boss_letea.js` segun la lista 6.1 del diseno.


---
# Jefes v4 (J2): Karceron y Letea (src/assets_boss2.js, cargado tras assets_boss.js; solo arte, sin logica)
Misma API que el Pastor (`assets_boss.js` NO cambia): `Assets.drawBoss(id, ctx, x, y, state)`, `Assets.renderBoss(id, state)`, `Assets.bossAnchors(id, state)`, `Assets.drawBossShadow(ctx, x, y, state)` (para los jefes nuevos exige `state.id`), `Assets.drawBossPortrait(id, ctx, x, y, {size, mood})`, `Assets.BOSS[id]`, `Assets.bossIds()` (= pastor, karceron, letea), `Assets.bossInfo(id)`. `Assets.bossPoseNames(id)` devuelve los nombres de ataque (sin id = los del Pastor, como antes). `drawBossTele` se AMPLIA con kinds nuevos (los viejos no cambian). (x,y) = centro del cuerpo (circulo de colision `r`); ordenar por profundidad con `y + Assets.BOSS[id].gy`. Todo en px de juego (final = base x2), `t` en ms. Vista previa: `tools/asset-preview/index.html?game=card-swarm&boss=karceron|letea` (seccion "Jefe": selector de jefe, ataque, progreso, estados, partes rotas, muerte, anclajes, arena de ejemplo; y seccion "Arbol de forja"). Capturas: `studio/docs/capturas-jefes-j2/`.
Coste medido (Chromium headless sin GPU, mediana de 700 frames con ataques variados, jefe + sombra + aura + fx): Pastor 0,9 ms, Karceron 1,9 ms, Letea 1,6 ms por frame. Un canvas compartido por jefe con rect sucio (solo se limpia/copia lo dibujado); sin `shadowBlur`; resplandores con sprites cacheados.

| id | `r` (cuerpo) | `gy` (charco: pies/sombra) | tamano visual | deathMs | fases (barra) | desesperado |
|---|---|---|---|---|---|---|
| `karceron` | 90 | 78 | torso+cabeza 256 de ancho, y -142..+118; brazos de reposo hasta x +-250, y +190; al atacar los brazos llegan a ~400 px | 3600 | Despertar / La Fragua / Marea de lava | Réquiem de Fuego |
| `letea` | 80 | 56 | cuerpo 224x128 y estanque 360x128 (y -52..+120); cuellos+cabezas hasta y -230 / x +-180 en reposo; mordisco hasta 320 px desde la base del cuello | 3600 | Tres memorias / Marea / Antídoto | Coro del Olvido |
`Assets.BOSS[id]` = `{id, name, title, r, gy, w, h, deathMs, windups, phases, despair, parts}` (`parts` de Karceron: `maza grillete nucleo` r34; de Letea: `acid ice bolt` r26).

## State comun (todo opcional salvo `t`)
`t` ms | `phase` 1-3 (ojos/tinte; Letea F3 = sangre muda, tinte verde toxico) | `hurt` 0..1 (flash blanco) | `enraged` | `desperate` (pose fija del ataque desesperado) | `exposed` (ventana: aro dorado + tinte) | `stun` (derribo: cabeza gacha, brazos/cabezas caidos, estrellas) | `immune` (puerta de fase: tinte azul + campo punteado) | `roar` 0..1 | `dying`+`dt` (ms desde la muerte; a `deathMs` no pinta nada) | `alpha` | `windup`+`wp` (telegrafia, wp 0..1) | `strike`+`sp` (ejecucion, sp 0..1; tiene prioridad) | `noShadow` / `noFx` (quita sombra / aura+efectos de frente). Sin `wp`/`sp` las poses hacen bucle (solo preview).
**Karceron** (se dibuja de frente: NO se voltea con `facing`; `facing` solo desplaza un poco la mirada):
- `broken:{maza, grillete, nucleo}` bool. `maza`: el brazo DER desaparece (queda un muñon; la logica coloca `obs_karceron_arm` como cobertura); `grillete`: el IZQ desaparece y queda una cadena suelta, sin cadena sobre el pecho; `nucleo`: nucleo hecho esquirlas, pecho entreabierto y modo hambriento.
- `open` 0..1 pecho abierto (si no se da: lo deduce de `windup:'erupcion'` y `desperate`). Para la ventana de 4 s: `open:1, exposed:true`.
- `sunk` 0..1 hundido en la lava (1 = invisible, los brazos se desvanecen) | `emerge` 0..1 entrada (~1500 ms: 0 = bajo tierra con grietas de lava y ceniza; 0.35 empieza a subir; 1 = completo) | `hungry` (ojos rojos, mas brasas; se activa solo con `broken.nucleo`) | `moving`/`speed` (arrastre: ondas en el charco).
- `tx,ty` punto de impacto del martillazo, relativo a (x,y) (se recorta a 400 px) | `aim` rad (centro del arco del `barrido`; direccion del `aliento`) | `stuck` (tras el golpe, maza clavada en tx,ty).
- Ataques (`windup` / `strike`; `Assets.bossPoseNames('karceron')`): `martillazo` (brazo DER: wp la maza sube sobre el hombro; sp 0-0.4 baja a (tx,ty) y se clava, salpica lava; despues temblor), `barrido` (brazo IZQ: wp se arma en el extremo del arco (aim-70 grados); sp barre 140 grados con la cadena arrastrando), `brasas` (ambos brazos arriba, cabeza atras, brasas; sp: golpean el suelo), `aliento` (cabeza hacia `aim`, mandibula abierta; en sp sale el chorro de fuego desde `mouth` hasta 560 px siguiendo `aim` cada frame), `costillas` (puas de hueso asoman entre las costillas, brazos al pecho; sp: las abre), `erupcion` (wp abre el pecho y el nucleo late; sp: pulso naranja de r 250 desde el pecho), `penitentes` (brazos arriba, cadenas laxas, grilletes brillan), `marea` (se hunde un poco, brazos abiertos, ruge, grietas de lava alrededor del charco; sp: golpea el suelo), `requiem` (= `desperate`: semi-hundido, pecho abierto, brazos al cielo, ojos blancos).
**Letea** (`facing` 1/-1 voltea cuerpo y cola; cabezas y cuellos usan coordenadas absolutas relativas a (x,y), no se voltean):
- `submerge` 0..1 (0 fuera, 1 hundida: desaparece bajo la linea de agua con cuellos y cabezas, burbujas y ondas) | `emerge` 0..1 entrada (~1800 ms: el cuerpo sube, luego cada cabeza emerge escalonada 300 ms en orden acid, ice, bolt; la ultima ruge) | `roar`.
- `heads:{acid:H, ice:H, bolt:H}`, `H = {windup, wp, strike, sp, aim, tx, ty, hurt, broken, regrow, cauter, exposed, down}`:
  - ataques de cabeza (`windup`/`strike`): `mordisco` (cualquiera: wp tira atras y abre la boca; sp 0-0.45 se lanza en linea recta 320 px desde la base del cuello hacia `aim` y 0.45-1 vuelve), `escupitajo` (acid: se yergue y brilla verde; sp: embiste 36 px y escupe), `aliento` (ice: inhala; sp: boca abierta + niebla helada en cono de 420 px hacia `aim`), `rayo` (bolt: mira al cielo, chisporrotea; sp: baja la cabeza), `coro` (canta; arcos de sonido).
  - `aim` rad hacia donde ataca | `tx,ty` (opcional) posicion ABSOLUTA de la cabeza, manda sobre la animacion (la logica puede mover la cabeza ella misma y usar `bossAnchors` para el hitbox) | `hurt` 0..1 (cabeza "dano" + brillo blanco) | `broken` = cabeza cortada (muñon corto con herida abierta de su color) | `regrow` 0..1 (brote que crece en el muñon; a 0.97 vuelve la cabeza entera) | `cauter` 0..1 (llamas sobre el muñon; con 1 queda un muñon negro sin rebrote) | `exposed` (aro dorado en la cabeza) | `down` (cabeza caida).
- Ataques de cuerpo (`windup`/`strike` en el state raiz): `coletazo` (wp se enrosca; sp la cola barre 360 grados a radio 85-225 con estela; empieza en el lado opuesto a `facing`), `sumersion` (wp: se hunde con burbujas; sp: emerge con erupcion de agua; maneja `submerge` solo si no se pasa), `marea` (se yergue, cabezas arriba, rugido), `plaideras` (las 3 cabezas cantan con brillo morado), `coro` (= `desperate`: cabezas arriba cantando; combinar con `heads.X.strike:'coro'` si se quiere cada una por separado). Los nombres de cabeza (`mordisco`, `escupitajo`, `aliento`, `rayo`) tambien salen en `Assets.bossPoseNames('letea')`.

## Anclas (`Assets.bossAnchors(id, state)`, `{x,y,r}` relativas a (x,y); siguen la animacion: usar el MISMO state que `drawBoss`)
**karceron** (reposo): `body` (0,0) r90 | `skull` (0,-102) r30 | `maza` (205,30) r34 = cabeza de la maza (parte Brazo-Maza; con martillazo/stuck = (tx,ty) recortado) | `grillete` (-170,112) r34 = mano IZQ (parte Brazo-Grillete) | `nucleo` (0,-10) r34 (pecho; la logica lo activa solo en ventana) | `mouth` (0,-66) (origen del aliento) | `chest` (0,-10) (origen de costillas y erupcion) | `shoulderR/L` (+-98,-58) | `elbowR/L` (+-169,12) r16 | `feet` (0,78) | `groundShadow` (0,86) r130. Con `broken.maza/grillete` el ancla de la parte pasa al hombro.
**letea** (reposo, las cabezas oscilan +-9 px): `body` (0,0) r80 | `acid` (-140,-109) | `ice` (8,-170) | `bolt` (132,-122) (r26: centro de cada cabeza; cabeza cortada = el muñon) | `mouth_acid/ice/bolt` (origen de proyectil/cono: 26 px delante de la cabeza) | `neckBase_acid/ice/bolt` (-52,-24) (0,-34) (52,-24) | `tail` (punta de la cola, reposo (-204,54)) r30 | `feet` (0,56) | `groundShadow` (0,64) r170. Mordisco: la cabeza llega a `neckBase + 320*(cos aim, sin aim)`.

## Telegrafias nuevas: `Assets.drawBossTele(ctx, kind, x, y, o)` (mismas `o`: `p` 0..1, `a`, `color`, `fix`, `sig`, `t`; alfa maximo ~0,4)
| kind | parametros | uso |
|---|---|---|
| `mace` | `r:90` | martillazo: circulo rojo con la sombra de la maza que cae y mira |
| `meteor` | `r:55` | lluvia de brasas: naranja (lava/fuego persistente) con aspa de impacto |
| `ribs` | `n:12, len:420, a` | estallido de costillas: lineas radiales finas con flechas |
| `breath` | `r:560, arc:50 grados (rad), sweep:40 grados (rad), a` | aliento: cono + arco de barrido con flecha |
| `erupt` | `r:250` | erupcion: anillo rojo con ondas que convergen |
| `flood` | `rect:{x,y,w,h}, islands:[{x,y,r}]` | marea de lava: suelo se tine de naranja y se agrieta; islas blancas pulsantes; `p` = cuenta atras |
| `acid` | `r:50` | escupitajo: verde con burbujas |
| `frost` | `r:420, arc:40 grados (rad), a` | aliento helado: cono azul con cristales (origen = boca de la cabeza) |
| `bolt` | `r:45` | rayo: amarillo con aspa de rayo |
| `bubbles` | `r:140` | sumersion: marca roja de emersion con burbujas |
Sirven los viejos: `donut {r:240, inner:110}` coletazo, `lane {w:70, len:320}` mordisco (origen = `neckBase`), `arc {r:340, inner:110, arc:140 grados}` barrido de grilletes, `summon {r}` penitentes/plañideras. `drawBossBand(ctx, x, y, a, len, th, o)` = ola/marea: (x,y) centro del borde delantero, `a` direccion de avance, `len` ancho perpendicular, `th` grosor detras del borde, `o.gaps:[[desde,hasta],...]` huecos en px a lo largo del borde (0..len), `o.style` 'water'|'lava', `o.tele:true` (rojo con flechas, usa `o.p`), `o.alpha`, `o.t`.

## Arena y VFX (funciones; (x,y) siempre = centro del circulo de colision; r = radio de colision del juego)
- `Assets.drawPillar(ctx, 'bone'|'crystal', x, y, {hp:0..1, rebuild:0..1, struck:bool, alpha})`: elige entero (hp>0.5), agrietado (>0) o escombro (0); con hp 0 y `rebuild`>0 se dibuja el aviso de reconstruccion. Ordenar por `y`+18.
- `Assets.drawLavaPool(ctx, x, y, r, t, {alpha})` (r 70) | `drawWaterPool(ctx, x, y, r, t, {acid:bool, alpha})` (agua r90, acido r50) | `drawEmberPatch(ctx, x, y, r, t, a)` (r~30) | `drawIsland(ctx, x, y, r, {lit:0..1, crack:bool, alpha, t})` (r120) | `drawLightning(ctx, x, y, p, {r, scale, t})` (p 0..1: aparece, destella y se apaga; (x,y) = punto de impacto) | `drawLavaFlood(ctx, rect, islands, t, a)` (marea activa: lava con borde amarillo en cada isla; dibujar las islas despues) | `drawLavaEdge(ctx, rect, margin, t, a)` (borde de lava de la F2).
- Sprites (final, ancla): `obs_bone_pillar` 60x96 (frames 0 entero, 1 agrietado, 2 escombro, 3 reconstruyendo; ancla (30,66)) | `fx_lava_pool` 160x160 (disco r70 centrado; anim `bubble`) | `fx_lava_tile` 64x64 tileable (`flow`) | `fx_island_stone` 256x256 (disco r120; 0 normal, 1 iluminada, 2 agrietada) | `fx_ember_patch` 72x72 (3 fr) | `fx_boss_crack_lava` 96x96 (3 fr `grow`) | `fx_lava_splash` 96x96 (5 fr `burst`) | `proj_ember_big` 32x32 (3 fr `loop`, cae hacia abajo, centrado) | `proj_bone_spike` 28x12 (2 fr `loop`, apunta a la derecha, centrada) | `obs_karceron_arm` 112x64 (brazo caido como cobertura: 0 entero, 1 agrietado; ancla centro) | `boss_karceron_mace` 80x128 (maza suelta; agarre en (40,100)).
- Letea: `fx_water_pool` 200x200 (disco r90; `ripple`; escalar r/90) | `fx_acid_puddle` 120x120 (disco r50; `bubble`) | `obs_crystal_pillar` 52x104 (0 entero, 1 agrietado, 2 escombro, 3 reflejo de rayo; ancla (26,78)) | `fx_lightning_strike` 96x320 (3 fr `strike`; punto de impacto = (48,312)) | `proj_acid_glob` 28x28 (2 fr `loop`) | `fx_water_splash` 96x96 (5 fr `burst`) | `fx_letea_pond` 360x128 (estanque propio, ya incluido en el dibujo del jefe) | `boss_letea_head_acid|ice|bolt` 64x64 (0 neutro, 1 preparacion, 2 ataque, 3 dano, 4 herida abierta, 5 brote, 6 cauterizada; cuello en (10,32), centro (28,32), mira a +x) | `boss_letea_body` 224x128 (0 idle, 1 hundiendose, 2 emergiendo) | `boss_letea_tail` 96x64 (aleta de la punta; union en (8,32)).
- Piezas de Karceron (por si se recompone): `boss_karceron_cavity|torso` 192x160 (0 cerrado, 1 abriendo, 2 abierto), `_skull` 80x80 (0 neutro, 1 rugido, 2 dano; cuello (40,72)), `_eyes` 56x16 (3 fases), `_shoulder` 72x64, `_bone` 28x80 (hueso largo, se estira), `_joint` 44x44, `_hand_l|r` 68x72, `_stump`, `_core` 56x56 (0 latido, 1 expuesto, 2 roto), `_lava_pool` 224x80.
- Retratos: `boss_karceron_portrait`, `boss_letea_portrait` (96x96, mood 0 neutro, 1 furia, 2 herido) via `drawBossPortrait`. Trofeos (32x32, frame 0 normal / 1 ROTO con aspa roja; dibujar a 16x16 = escala 0,5): `trophy_karceron_mace` `trophy_karceron_shackle` `trophy_karceron_core` `trophy_letea_acid` `trophy_letea_ice` `trophy_letea_bolt`. Icono de debilidad/resistencia con etiqueta: `Assets.drawWeakIcon` (ver Arbol).

## Notas para la logica / HUD (J2)
- Marlo nunca queda tapado por telegrafias (alfa <= 0,4, sin relleno solido); el jefe se ordena por `y + gy`. Los brazos de Karceron se ven delante de Marlo si este esta mas abajo que `y + gy`.
- Karceron: la maza clavada y los brazos al atacar salen fuera del circulo `r`; usar `bossAnchors().maza/grillete` para las hitboxes. El pulso de la erupcion y el chorro del aliento ya los dibuja el jefe (solo visual; el dano lo pone la logica).
- Letea: para el mordisco pasa `heads.X.windup='mordisco', wp` y luego `strike`, con `aim`; el hitbox sigue `anchors[X]`. `submerge` y `emerge` dibujan burbujas y ondas solos; el splash de la emersion sale en `sumersion` (strike) y en la entrada.
- Ventanas: `exposed` (aro dorado en el suelo; en Karceron ademas aro sobre el nucleo si `open>0.5`; en Letea, `heads.X.exposed` marca una sola cabeza).

---
# Arbol de forja (Fase 2b) (src/assets_tree.js, tras assets_boss2.js; solo arte)
Todo dibuja en `ctx` con coordenadas de juego (960x540), sin `shadowBlur`. Colores de etiqueta = `G.TAGS` (`Assets.TREE_TAGS`): fire `#ff7a2a`, ice `#6ac8ff`, lightning `#ffe45a`, poison `#7be34a`, blood `#d02048`, steel `#b8c0cc`, neutral `#c8b8e8`.
- `Assets.drawTreeNode(ctx, x, y, o)`: marco del nodo (centro x,y). `o`: `type` ('root'|'C'|'M'|'P'|'X'|'S'|'Ma'|'R'), `tag`, `state` ('locked'|'avail'|'owned'|'excluded'), `choice` ('A'|'B'|null; para M comprado resalta esa mitad), `sel` bool (anillo de seleccion), `t` ms, `r` (28 por defecto), `dim`. Dibuja halo pulsante (`avail`), base, mitades A|B (`M`), anillo punteado (`X`), anillo dorado (`S`, `Ma` con 4 puntas), hexagono (`R`), candado (`locked`), relleno+brillo y destello (`owned`), aspa roja (`excluded`). NO dibuja el icono ni el nombre ni el coste.
- `Assets.drawTreeIcon(ctx, name, x, y, s, o)`: icono centrado de radio ~s (12-15 en un nodo de 28). `name`: `root card upgrade passive branch set mastery rank trunk tag_fire tag_ice tag_lightning tag_poison tag_blood tag_steel`. `o.color` (defecto: color de la etiqueta / blanco), `o.dim`. Devuelve false si el nombre no existe (usar `G.Cards.glyph` para los iconos de carta existentes).
- `Assets.drawTreeLink(ctx, x0, y0, x1, y1, o)`: conector entre CENTROS de nodos. `o`: `state` ('locked' gris | 'avail' punteado animado | 'owned' brillante con puntos que fluyen), `color`, `kind` ('and' | 'or' rombo central | 'xor' "V" punteada roja), `inset` (radio a recortar en cada extremo; 28), `t`.
- `Assets.drawTreeTab(ctx, x, y, tag, o)`: pestana 48x48 (x,y = esquina sup. izq.; incluye 'neutral' para el tronco); `o`: `sel`, `dim`, `t`, `badge` (numero de nodos disponibles, chapa dorada).
- `Assets.drawTreeBurst(ctx, x, y, p, color)`: destello al comprar (p 0..1, ~600 ms): anillo + rayos aditivos.
- `Assets.drawWeakIcon(ctx, tag, x, y, {resist:bool, mult:'1.25', size:24})`: icono de etiqueta con flecha verde arriba (debilidad) o gris abajo (resistencia, icono apagado) y multiplicador opcional a la derecha; (x,y) = esquina sup. izq.
- Sprites: `tree_tag_<tag>` (48x48; frame 0 color, 1 apagado) para fire ice lightning poison blood steel neutral; `tree_ico_<name>` (32x32, blanco, para tintar) para root card upgrade passive branch set mastery rank trunk.

---
# Audio familias P1 (Bosque y Cripta) (src/sfx_fam1.js, tras sfx.js; solo audio)
Procedural WebAudio, se llama igual que el resto: `Assets.sfx('nombre', {pitch=1, vol=1, vary=0.1})` (pitch +-10 % por defecto; devuelve false si aun no hay gesto, si esta silenciado o si se supera el limite). Limites por nombre: <= 4 voces simultaneas y una separacion minima (ms) para que muchos enemigos no saturen. `Assets.sfxNames()` y `Assets.renderSfx/exportSfxWav` los incluyen; `Assets.sfxFam1[nombre]` = `{kind, fam, min}`. Los SFX existentes no cambian.
Tipos: **tele** = telegrafia (bajo, tono distintivo; usar `vol` ~0.6-1 al inicio del aviso, NUNCA en el impacto), **impact** = golpe/disparo/explosion, **move** = movimiento/ambiente.

| Nombre | Tipo | Cuando llamarlo |
|---|---|---|
| `lamb_bleat` | move | Cordero corrupto: aparicion/muerte esporadica (min 140 ms) |
| `thorn_shot` | impact | Zarzal dispara espina(s) (min 60) |
| `moth_flutter` | move | Polilla de lana volando/cargando (min 120) |
| `wool_puff` | impact | Orbe de lana lanzado / impacto del orbe (min 80) |
| `spore_puff` | tele | Micelio: inicio del `arm` de 900 ms (min 150) |
| `zampona_pipe` | tele | Zamponero: inicio del `cast` de 500 ms (min 300) |
| `dog_bark` | tele | Perro pastor: inicio del ladrido de 450 ms (dos ladridos; min 300) |
| `dog_dash` | move | Perro pastor: arranque del arreo (min 150) |
| `bone_rattle` | move | Esqueleto: traqueteo al andar/aparecer (min 130) |
| `bone_arrow` | impact | Arquero de huesos lanza el hueso (min 70) |
| `skull_explode` | impact | Calavera explosiva detona (min 90) |
| `skull_roll` | tele | Calavera rodante: inicio del `wind` de 600 ms y del aviso del segundo tramo (min 200) |
| `skull_bounce` | impact | Calavera rodante rebota en pared (min 80) |
| `chain_rattle` | tele | Guardian de cadenas: grillete/cadena durante el `wind` de 700 ms (min 160) |
| `chain_throw` | move | Guardian lanza la cadena (min 120) |
| `chain_hit` | impact | La cadena alcanza al jugador (ralentiza; min 120) |
| `shield_bash` | impact | Carcelero: golpe/empellon de escudo (min 120) |
| `ember_crackle` | move | Ascua (magma): chisporroteo al moverse (min 100) |
| `lava_trail_hiss` | move | Salamandra/Ascua dejando rastro (min 150) |
| `lava_pool` | tele | Charco de lava: al empezar el `arm` de 600 ms (burbujeo; min 160) |
| `soul_whisper` | tele | Alma prisionera: inicio del `fade` de 500 ms (min 250) |
| `soul_blink` | move | Alma prisionera: teletransporte (min 150) |

Consejos: llamar a los `tele` una vez al empezar el aviso (no por frame); los `move` a lo sumo cada 0.3-1 s por enemigo; para un enjambre usar `vol` 0.5-0.7 si hay > 5 en pantalla. Vista previa: `tools/asset-preview/index.html?game=card-swarm` (los `tele` tienen borde dorado).


---
# Familias P1 (Bosque y Cripta) (src/assets_fam1.js, cargado tras assets_enemies2.js; solo arte, sin logica)
Script clasico que extiende `window.Assets`. Mismo estilo que `assets_enemies2.js`. Diseno: `DESIGN-v5-biomas.md` A.3, A.4, C.4-A. Todos miran a la DERECHA (voltear con scale -1). Tamano "base" x2 = final (px reales del canvas devuelto por `Assets.sprite`). `die` = 5 frames, 9 fps, no cicla, indices justo despues de los normales (`Assets.animFrame(n,'die',msDesdeMuerte)`). Los frames se precomponen al cargar: en juego es un `drawImage`. `Assets.FAM1 = {bosque:[nombres], cripta:[nombres]}` lista todo. Ancla sugerida de enemigos: pies = (final_w/2, final_h-4).
Paleta (para que 100 enemigos se lean): Bosque = lana crema/negra, puas moradas, ojos naranja, granate, corteza marron. Cripta = hueso, hierro gris, magma naranja, cuero/rojo oscuro. Ninguna usa el verde/azul/rojo planos de los sprites antiguos.

## Bosque
| sprite | base -> final | frames (indices) | anims (fps) | notas |
|---|---|---|---|---|
| `enemy_bos_cordero` | 20x20 -> 40x40 | 11: 0-1 idle, 2-5 walk, 6-10 die | idle [0,1] 4; walk [0,2,1,3,4,5] 9; die | oveja crema con cara negra y puas moradas en el lomo (`worm`) |
| `enemy_bos_zarzal` | 24x24 -> 48x48 | 13: 0-1 idle, 2-5 walk, 6 aim, 7 fire, 8-12 die | idle 3; walk 7; aim [6]; fire [7]; shoot [7,1] 8; die | arbusto de corteza con espinas moradas (`archer`; Zarzal mayor = mismo sprite a escala 1,15 + tinte). `aim` = espinas amarillas y cuerpo inflado; `fire` = una espina saliendo a la derecha |
| `enemy_bos_perro` | 26x18 -> 52x36 | 14: 0-1 idle, 2-5 walk, 6 bark, 7-8 dash, 9-13 die | idle 4; walk 11; bark [6]; dash [7,8] 14; die | border collie negro/crema con collar granate; `bark` = hocico arriba y boca abierta con rayitas de sonido (anillo rojo lo pone el juego) |
| `enemy_bos_polilla` | 20x20 -> 40x40 | 11: 0-3 fly, 4 charge, 5 throw, 6-10 die | fly [0,1,2,3] 14 (`idle` = igual); charge [4]; throw [5,0] 8; die | polilla de lana crema/marron con antenas naranja. `charge` lleva el orbe de lana con anillo azul claro entre las patas |
| `enemy_bos_zamponero` | 20x24 -> 40x48 | 9: 0-1 idle, 2-3 cast, 4-8 die | idle [0,1] 4 (`walk` = igual, 6 fps); cast [2,3] 6; cast_hold [3]; die | fauno de cuernos de cabra, tunica granate, zampona. `cast` 3 = anillo morado y notas |
| `proj_wool_orb` | 12x12 -> 24x24 | 2 | `loop` [0,1] 8 | orbe de lana crema con anillo azul claro punteado (azul = ralentiza), centrado |

Reusados SIN arte nuevo (como pide el doc): Jabalí = `boar`; Micelio = `enemy_sower`; espina del Zarzal = `proj_thorn_small` (16x8 final, apunta a la derecha); Zarzal mayor = `enemy_bos_zarzal` x1,15 con tinte oscuro. No hay pieles de Jabalí (el doc no las pide).

## Cripta
| sprite | base -> final | frames (indices) | anims (fps) | notas |
|---|---|---|---|---|
| `enemy_cri_esqueleto` | 20x22 -> 40x44 | 11: 0-1 idle, 2-5 walk, 6-10 die | idle 4; walk [0,2,1,3,4,5] 8; die | esqueleto con garrote, grillete y paño violeta (`worm`) |
| `enemy_cri_arquero` | 22x22 -> 44x44 | 13: 0-1 idle, 2-5 walk, 6 aim, 7 fire, 8-12 die | idle 4; walk 8; aim [6]; fire [7]; shoot [6,7,1] 8; die | calavera con capucha violeta y arco de hueso; `aim` = cuerda tensa + flecha encajada |
| `proj_bone_arrow` | 16x6 -> 32x12 | 2 | `loop` [0,1] 10 | flecha de hueso con plumas naranja, apunta a la derecha (rotar al angulo), centrada |
| `enemy_cri_calavera_exp` | 18x18 -> 36x36 | 12: 0-3 walk, 4-5 lit, 6 prime, 7-11 die | walk [0,1,2,3] 9 (`idle` = igual); lit [4,5] 10; prime [6]; die | calavera flotante con mecha y grietas de magma; `prime` = hinchada, aro rojo, grietas blancas |
| `enemy_cri_calavera_rod` | 24x24 -> 48x48 | 15: 0-1 idle, 2-3 walk, 4 wind, 5-8 roll, 9 stun, 10-14 die | idle 3; walk [2,3] 5; wind [4]; roll [5,6,7,8] 16; stun [9]; die | calavera grande con aro de hierro y puas; `roll` gira 90 grados por frame con rayas de velocidad (el juego puede ademas rotar el sprite) |
| `enemy_cri_carcelero` | 26x26 -> 52x52 | 14: 0-1 idle, 2-5 walk, 6 wind, 7 bash, 8 rec, 9-13 die | idle 4; walk 7; wind [6]; bash [6,7,8] 10; rec [8]; die | casco de hierro con ranura naranja y puerta de celda como escudo (`shield`). `wind` = escudo atras con marco naranja, `bash` = impacto, `rec` = jadeando y bajo |
| `enemy_cri_salamandra` | 30x16 -> 60x32 | 11: 0-1 idle, 2-5 slither, 6-10 die | idle 3; slither [0,2,1,3,4,5] 8 (`walk` = igual); die | lagarto negro con grietas de magma y vientre naranja. El charco es `fx_fire_cell` (existente) |
| `enemy_cri_guardian_cadenas` | 28x30 -> 56x60 | 14: 0-1 idle, 2-5 walk, 6 wind, 7-8 throw, 9-13 die | idle 3; walk 6; wind [6]; throw [7,8] 8; die | encapuchado rojo oscuro con cadenas cruzadas y candado dorado. `wind` = cadena girando sobre la cabeza; `throw` = brazo extendido (frame 8 con chispas) |
| `proj_chain` | 24x8 -> 48x16 | 3 | `loop` [0,1,2] 12 | cadena con gancho a la DERECHA (cabeza); rotar al angulo; centrada; para alargarla dibujar varios o estirar en x |
| `fx_chain_link` | 16x16 -> 32x32 | 1 | - | eslabon grande con halo azul claro: marca de impacto/ralentizado de la cadena (azul = ralentizado). Centrado |
| `enemy_cri_alma` | 22x26 -> 44x52 | 11: 0-1 float, 2-3 fade, 4-5 slash, 6-10 die | float [0,1] 5 (`idle` = igual); fade [2,3] 10; slash [4,5,0] 12; die | espiritu palido con uniforme de preso y grillete con cadena rota. Los frames `fade` ya llevan alpha y el anillo naranja en el suelo (sin `fx_blink_ring`); el resto alpha 0,9 |

Reusados sin arte nuevo: Ascua = `enemy_scorcher`; charco de lava = `fx_fire_cell` (44x44 final, centrado). Calavera explosiva usa la telegrafia circular existente.
Vista previa: `tools/asset-preview/index.html?game=card-swarm` -> seccion "Familias P1" (cada sprite con todas sus animaciones y prueba de 100 enemigos mezclados). Capturas: `studio/docs/capturas-p1/`.

---
# Audio familias P2 (Asfodelo del Olvido) (src/sfx_fam2.js, tras sfx_fam1.js; solo audio)
Mismo patron y API que P1: `Assets.sfx('nombre', {pitch=1, vol=1, vary=0.1})`; <= 4 voces por nombre y separacion minima (ms); `Assets.sfxNames()`, `renderSfx`, `exportSfxWav` los incluyen; `Assets.sfxFam2[nombre]` = `{kind, fam:'asfodelo', min}`. Tipos: **tele** (bajo, distintivo, solo al inicio del aviso, `vol` 0.6-1), **impact**, **move**. Los SFX existentes no cambian.
Timbres: charco = burbujas ascendentes; hielo = cristalino agudo; olvido = campana/zumbido turquesa que BAJA de tono (tiempo lento); anguila = chasquido seco (sin crepitar largo).

| Nombre | Tipo | Cuando llamarlo |
|---|---|---|
| `pond_swim` | move | Sanguijuela/Alma en charco: nada, ondas (min 160) |
| `pond_bubble` | tele | Sanguijuela: burbujas al inicio del aviso de emboscada de 500 ms (min 200) |
| `leech_lunge` | move | Sanguijuela: lance de 330 ms (min 110) |
| `frog_crouch` | tele | Rana: inicio de la agachada de 500 ms / circulo rojo (min 200) |
| `frog_hop` | move | Rana: despegue del salto (min 120) |
| `frog_land` | impact | Rana: aterrizaje (min 100) |
| `frog_splash` | impact | Rana: chapoteo al crearse el charco acido (min 110) |
| `head_emerge` | tele | Cabeza menor: brota del charco, 700 ms (min 220) |
| `head_bite` | impact | Cabeza menor: mordisco (min 90) |
| `head_regrow` | tele | Cabeza menor: inicio del rebrote de 8 s / su `regrow` (min 250) |
| `head_burn` | impact | Cabeza menor muere quemada (cauterizacion; Fuego) (min 100) |
| `medusa_charge` | tele | Medusa: carga de 450 ms del orbe (min 220) |
| `medusa_throw` | move | Medusa: lanza el orbe (min 110) |
| `orb_shatter` | impact | Orbe de hielo destruido por un golpe (min 80) |
| `olvido_sow` | move | Lirio: siembra la zona (min 140) |
| `olvido_chime` | tele | Zona del olvido: inicio del `arm` de 900 ms; tono que baja (min 260) |
| `olvido_hum` | move | Zona activa / jugador dentro (ralentizado, baja de tono; a lo sumo cada 1-2 s; min 400) |
| `eel_charge` | tele | Anguila: inicio del `wind` de 700 ms (min 200) |
| `eel_zap` | impact | Anguila: rayo instantaneo de 150 ms (seco y corto, distinto a rayos de cartas; min 90) |
| `eel_dash` | move | Anguila: arranque de la carga (min 130) |
| `priestess_chant` | tele | Sacerdotisa: inicio del `cast` de 500 ms (min 350) |
| `priestess_summon` | impact | Sacerdotisa: aparecen las 2 Almas (min 150) |
| `drown_whisper` | tele | Alma errante: susurro esporadico/aparicion (bajar `vol` en enjambre; min 260) |
| `drown_wail` | move | Alma errante: lamento al morir/disiparse (min 300) |

Consejo: con muchos enemigos usar `vol` 0.5-0.7 en `drown_*`, `pond_swim` y `head_*`. Vista previa: `tools/asset-preview/index.html?game=card-swarm` (los `tele` con borde dorado).


---
# Familias P2 (Asfodelo) (src/assets_fam2.js, cargado tras assets_fam1.js; solo arte, sin logica)
Script clasico que extiende `window.Assets` (mismo estilo y reglas que P1: miran a la DERECHA, base x2 = final, `die` = 5 frames 9 fps sin ciclo al final de los frames, ancla de enemigos = (final_w/2, final_h-4)). Diseno: `DESIGN-v5-biomas.md` A.5, C.4-A. `Assets.FAM2.asfodelo` lista todo. Paleta: verde azulado #2f6f6a, crema #e8e4d4, acentos acido #7be34a / hielo #6ac8ff / rayo #ffe45a; olvido #7fffe0.

| sprite | base -> final | frames (indices) | anims (fps) | notas |
|---|---|---|---|---|
| `enemy_asf_alma_errante` | 20x22 -> 40x44 | 11: 0-1 idle, 2-5 walk, 6-10 die | idle 4; walk [0,2,1,3,4,5] 8; die | voluta teal clara con alpha 0,8 YA horneado (no volver a aplicar alpha) |
| `enemy_asf_sanguijuela` | 18x10 -> 36x20 | 10: 0-1 swim, 2-3 lunge, 4 exposed, 5-9 die | swim [0,1] 7 (`idle` = igual); lunge [2,3] 14; exposed [4]; die | gusano oliva con franja roja y ventosa dentada; `exposed` = panza crema boca arriba |
| `enemy_asf_rana` | 26x22 -> 52x44 | 11: 0-1 idle, 2 crouch, 3 air, 4 land, 5 rest, 6-10 die | idle 3; crouch [2]; air [3]; land [4] (salpicaduras); rest [5]; hop [2,3,4] 6; die | rana verde acido, ojos saltones; `rest` = ojos cerrados y lengua fuera |
| `enemy_asf_medusa` | 24x28 -> 48x56 | 11: 0-3 float, 4 charge, 5 throw, 6-10 die | float/idle [0..3] 6; charge [4] (orbe azul entre tentaculos); throw [5,0] 8; die | proyectil: `proj_frost_orb` (existente, 12x12 base) |
| `enemy_asf_cabeza_menor` | 28x36 -> 56x72 | 17: 0-3 emerge, 4-5 idle, 6-7 bite, 8 stump, 9-11 regrow, 12-16 die | emerge [0..3] 7 sin ciclo; idle [4,5] 3; bite [6,7] 8 (6 = aviso, cabeza atras; 7 = embestida a +x, alcance ~+20 px final); stump [8]; regrow [9,10,11] 4 sin ciclo; die | cuello+cabeza de serpiente con cresta acido/hielo/rayo, incluye su aro de agua en la base (pies = base del aro) |
| `enemy_asf_lirio` | 22x24 -> 44x48 | 13: 0-1 idle, 2-5 walk, 6-7 sow, 8-12 die | idle 3; walk [0,2,1,3,4,5] 7; sow [6,7] 6; die | nenufar con flor crema y bulbo turquesa; `sow` = petalos abiertos con esporas |
| `enemy_asf_anguila` | 40x14 -> 80x28 | 14: 0-1 idle, 2-5 slither, 6 wind, 7 dash, 8 rec, 9-13 die | idle 4; slither/walk [2..5] 10; wind [6] (chispas, rayas encendidas); dash [7] (recta, boca abierta, estela); rec [8] (apagada, ojos X); die | |
| `enemy_asf_sacerdotisa` | 24x28 -> 48x56 | 12: 0-1 idle, 2-4 float, 5-6 cast, 7-11 die | idle 3; float/walk [2,3,4] 5; cast [5,6] 6; cast_hold [6]; die | el anillo morado del `cast` va dibujado a los pies |

## VFX / props (nombre, base -> final, frames, anims)
- `fx_pond_ripple` 48x24 -> 96x48, 3 fr (`ripple` 3 fps): SOLO anillos de ondas centrados (donde se oculta la Sanguijuela).
- `fx_pond` 80x48 -> 160x96, 3 fr (`ripple` 3 fps): charco fijo; agua de ~r36-40 final centrada en (80,52) con juncos y piedras (sobresalen del radio). Dibujar en el suelo, ordenar por y.
- `fx_olvido_zone` 48x48 -> 96x96, 3 fr: 0 = aviso (`arm`, aro punteado), 1-2 = activa (`active` 3 fps); disco turquesa #7fffe0 de r42 final centrado.
- `fx_lightning_lane` 32x32 -> 64x64, 3 fr (`loop` 18 fps): tile de rayo horizontal repetible en x (empalma en y central). Para el carril de 300 px: repetir y rotar al angulo; el rayo ocupa ~+-22 px de alto final.
- `fx_frog_acid` 30x30 -> 60x60, 3 fr (`bubble` 4 fps): charco acido de la rana (r28 final), centrado.
- `icon_olvido` 16x16 -> 32x32, 2 fr (`loop` 2 fps): reloj roto turquesa para el estado 'olvido' (dibujar a 16x16 = escala 0,5 si hace falta).
- `fx_ambush_bubbles` 24x24 -> 48x48, 4 fr (`rise` 8 fps, 3 = estallido): burbujas del aviso de emboscada/brote.
Vista previa: `tools/asset-preview/index.html?game=card-swarm` -> "Familias P1 y P2", familia Asfodelo, casilla "mezclar las 3 familias" (prueba de 100). Capturas: `studio/docs/capturas-p2/`. Nota: `sw.js` aun no precachea `assets_fam2.js`.

# Audio Tundra P3 (src/sfx_fam3.js, tras sfx_fam2.js; solo audio)
Mismo patron y API que P1/P2: `Assets.sfx('nombre', {pitch=1, vol=1, vary=0.1})`; <= 4 voces por nombre y separacion minima (ms); `sfxNames()`, `renderSfx`, `exportSfxWav` los incluyen; `Assets.sfxFam3[nombre]` = `{kind, fam:'tundra', min}`. Tipos: **tele** (glissando sostenido/ascendente o crujido en cadena, solo al inicio del aviso, `vol` 0.6-1), **impact** (golpe grave + ruido corto), **move** (bajo y sutil). Los SFX existentes no cambian. Con muchos enemigos: `vol` 0.4-0.6 en `ice_slide`, `ice_brake`, `snow_step`, `ice_step`, `wolf_run`, `bat_flap`.

| Nombre | Tipo | Cuando llamarlo |
|---|---|---|
| `ice_slide` | move | Derrape en hielo (jugador/enemigos); subtil, `pitch` segun velocidad (0.9-1.2), `vol` 0.5 en enjambre (min 260) |
| `ice_brake` | move | Frenada/cambio de sentido en hielo (min 220) |
| `snow_step` | move | Paso en nieve firme: crunch apagado (min 140; `vol` 0.5 enemigos) |
| `ice_step` | move | Paso en hielo: tic agudo y duro, distinto de la nieve (min 140) |
| `ice_crack` | tele | Hielo que se fisura antes de romperse (min 220) |
| `ice_break` | impact | Rotura de hielo (min 90) |
| `wind_gust` | tele | Aviso de rafaga de ventisca (min 600) |
| `cold_warn` | tele | Frio al 70 %: tiritona (min 700) |
| `cold_freeze` | impact | Frio al 100 %: Escarcha (min 800) |
| `cold_slow` | move | Jugador ralentizado por el Frio (tono que baja; min 500) |
| `heart_beat` | move | Latido, cuando el Frio > 85 % (cada ~1 s; min 380) |
| `campfire_crackle` | move | Hoguera cercana (<= 250 px): llamar cada ~1 s, `vol` por distancia (min 500) |
| `wolf_howl` | tele | Lobo de escarcha: howl/agacha de 700 ms (min 350) |
| `wolf_lunge` | move | Lobo: lance de 300 px/s (min 110) |
| `wolf_run` | move | Lobo/Lobezno: carrera (pasos; min 160) |
| `yeti_wind` | tele | Yeti: wind del empellon de 800 ms (min 300) |
| `yeti_bash` | impact | Yeti: empellon/golpe (min 110) |
| `yeti_step` | move | Yeti: pisada pesada (min 240) |
| `bat_flap` | move | Murcielago de hielo: aleteo errático (min 120) |
| `bat_screech` | tele | Murcielago: inicio de la linea de pica de 700 ms (min 250) |
| `bat_dive` | impact | Murcielago: impacto de la pica (min 110) |
| `stalag_crack` | tele | Estalagmita viva: fisuras/anillo de 800 ms (min 250) |
| `stalag_erupt` | impact | Estalagmita viva: erupcion de puas (min 110) |
| `snow_whisper` | tele | Espiritu de nieve: fade/remolino de 600 ms (min 260) |
| `snow_slash` | impact | Espiritu de nieve: tajo que empuja (min 100) |
| `hunter_aim` | tele | Cazador: aim de 700 ms (min 250) |
| `hunter_shot` | move | Cazador: disparo de la flecha helada (min 120) |
| `bear_roar` | tele | Oso polar: wind de 900 ms (rugido grave, un solo rugido a la vez; min 400) |
| `bear_charge` | move | Oso polar: arranque de la embestida (min 140) |
| `bear_slide` | move | Oso polar: patina 180 px al acabar (min 200) |
| `icicle_fall` | tele | Carambano que cae: silbido descendente (min 200) |
| `icicle_hit` | impact | Carambano impacta (min 80) |

## Ventisca ambiental: `Assets.wind(intensity)`
Bucle suave de viento (ruido filtrado con rachas y silbido). `intensity` 0..1 regula el volumen (se puede llamar cada frame o al cambiar ciclo: calma ~0.25, rafaga ~0.8); `Assets.wind(0)` lo apaga con fundido y libera los nodos. Sigue mute/volumen SFX/suspend. Devuelve false si apagado o sin gesto. `Assets.windLevel()` = ultimo valor.

## Musica `tundra`: `Assets.music.setTrack('tundra')`
Sin tocar `assets.js` ni la logica: `sfx_fam3.js` intercepta `Assets.music` (start/stop/setIntensity/setTrack/getTrack/tracks/isPlaying) y toca la pista en su propio contexto (62 BPM, Re menor/pentatonica, bajo grave + pad helado siempre; campanas con eco desde intensidad ~0.15, cristales desde ~0.4, pulso de corazon desde ~0.6). `setTrack('normal'|'boss')` vuelve a las originales y reanuda si estaba sonando. `tracks()` incluye 'tundra'; `renderMusic({track:'tundra',bars,intensity})` y `exportMusicWav` funcionan. No incluye aun `boss_yarlak` ni stingers (pendiente: piden hooks de Boss).


---
# Tundra P3 (src/assets_fam3.js, cargado tras assets_fam2.js; solo arte, sin logica; NO incluye a Yarlak = P4)
Script clasico que extiende `window.Assets`. Mismo estilo que P1/P2 (contorno #1b1124, color plano + sombra + brillo, miran a la DERECHA, base x2 = final, `die` = 5 frames 9 fps sin ciclo). `Assets.FAM3.tundra` lista todos los sprites. Diseno: `DESIGN-v5-biomas.md` B.1, B.3, C.4-B. `t` en ms. Ancla de enemigos = (final_w/2, final_h-4). Vista previa: `tools/asset-preview/index.html?game=card-swarm` -> "Familias" -> Tundra (hoja, anims, arena con parches, ventisca regulable, prueba de 100). Capturas: `studio/docs/capturas-p3/`.
Paleta: pelaje #e8eef5/#8fa4bf, hielo #9fd8ff/#5aa8e8/#2a4f8a/#1b2f66, marfil #f1ead2, ojos cian #5ff0ff. Acentos: lobezno orejas rosa palido; cazador bufanda ambar; lobo puas de hielo en el lomo; oso cristales azules + cicatriz; yeti cara azul + placa; murcielago alas de cristal + cuerpo indigo; estalagmita ojos ROJIZOS tenues; espiritu lila; chaman craneo de lobo + runas VIOLETA.

## Familia (9)
| sprite | base -> final | frames | anims (fps) | notas |
|---|---|---|---|---|
| `enemy_tun_lobezno` (worm) | 20x16 -> 40x32 | 11: 0-1 idle, 2-5 walk, 6-10 die | idle 4; walk [0,2,1,3,4,5] 9; die | cachorro esponjoso |
| `enemy_tun_cazador` (archer) | 24x28 -> 48x56 | 14: 0-1 idle, 2-5 walk, 6 aim, 7 shoot (suelta), 8 recupera, 9-13 die | idle 3; walk 7; aim [6]; shoot [7,8] 8; die | `aim` = arco tensado con flecha helada (proyectil `proj_ice_arrow`); sale por la derecha |
| `enemy_tun_lobo` (frostwolf) | 28x20 -> 56x40 | 15: 0-1 idle, 2-5 walk, 6 howl, 7 crouch, 8-9 lunge, 10-14 die | idle 3; walk 10; howl [6]; crouch [7]; lunge [8,9] 8; die | howl = hocico al cielo con ondas; crouch = agachada con orejas atras; lunge 8 en el aire, 9 aterrizando |
| `enemy_tun_oso` (boar) | 40x32 -> 80x64 | 15: 0-1 idle, 2-5 walk, 6 wind, 7-8 charge, 9 slide, 10-14 die | idle 3; walk 8; wind [6]; charge [7,8] 12; slide [9]; die | wind = cabeza baja y zarpa que escarba; slide = patina con las patas por delante y nieve |
| `enemy_tun_yeti` (shield) | 34x36 -> 68x72 | 24: 0-1 idle, 2-5 walk, 6 wind, 7 bash, 8 rec, 9 melt (placa agrietada y goteando), 10-14 die, y SIN PLACA: 15-16 idle_np, 17-20 walk_np, 21 wind_np, 22 bash_np, 23 rec_np | idle 3; walk 6; wind [6]; bash [6,7,8] 10; rec [8]; melt [9]; die; `idle_np walk_np wind_np bash_np rec_np` | Al perder la placa (30 de dano de Fuego) cambia a las anims `*_np`. `fx_ice_slab` = la placa suelta |
| `enemy_tun_murcielago` (moth) | 24x16 -> 48x32 | 11: 0-3 flap, 4-5 dive, 6-10 die | flap/idle/fly/walk [0..3] 14; dive [4,5] 10; die | |
| `enemy_tun_estalagmita` (sower) | 20x30 -> 40x60 | 12: 0 dormant, 1-2 wake, 3-4 erupt, 5-6 crawl, 7-11 die | dormant/idle [0]; wake [1,2] 8 sin ciclo; erupt [3,4] 10 sin ciclo; crawl/walk [5,6] 4; die | ojos rojizos TENUES (la del jefe es azul liso y sin ojos) |
| `enemy_tun_espiritu` (blinker) | 22x28 -> 44x56 | 11: 0-1 float, 2-3 fade, 4-5 slash, 6-10 die | idle/float/walk [0,1] 5; fade [2,3] 10; slash [4,5,0] 12; die | `fade` ya lleva alpha 0,42/0,16 y aro punteado en el suelo; el remolino es `fx_snow_whirl` |
| `enemy_tun_chaman` (warlock) | 26x30 -> 52x60 | 11: 0-1 idle, 2-3 walk, 4-5 howl, 6-10 die | idle 3; walk [2,3] 5; howl [4,5] 5; die | el aura r 200 la dibuja el juego (el sprite solo da las ondas del aullido) |

## Guardianes (variantes; MISMOS indices y anims que el Coloso/Madre Colmena)
| sprite | base -> final | frames | anims |
|---|---|---|---|
| `enemy_mini_yeti` (Yeti Centinela) | 32x32 -> 64x64 | 16: 0-1 idle, 2-5 walk, 6 bash-wind, 7 bash, 8 stomp-wind, 9 stomp, 10 rec, 11-15 die | idle [0,1] 3; walk [0,2,1,3,4,5] 6; bash [6,7] 8; stomp [8,9] 8; rec [10]; die. Hombreras y escudo de hielo (se derrite con Fuego) |
| `enemy_mini_ventisquero` | 32x32 -> 64x64 | 15: 0-1 idle, 2-5 float, 6 spit (carambano), 7 acid = ventisca local, 8 swell, 9 burst, 10-14 die | idle 3; float/walk 7; spit [6]; acid/blizzard [7]; swell [8,9] 8; die. Flota (sin patas) |

## Proyectiles y VFX (base -> final, frames, anims, ancla)
| sprite | final | frames | notas |
|---|---|---|---|
| `proj_ice_arrow` | 32x12 | 2 (`loop` 10) | flecha, apunta a la derecha, centrada |
| `proj_icicle` | 28x56 | 2 (`loop` 8) | carambano con la PUNTA ABAJO (cae), centrado |
| `fx_ice_slab` | 48x56 | 2 (0 entera, 1 agrietada; `melt` sin ciclo 3) | placa del Yeti, centrada |
| `fx_snow_whirl` | 72x72 | 4 (`loop` 8) | disco r ~33 final, centrado: remolino del Espiritu (ralentiza) |
| `fx_ice_crack` | 192x48 | 3 (`grow` 3 fps sin ciclo; `closed` [0], `open` [2]) | grieta horizontal centrada: 0 cerrada, 1 abriendose, 2 abierta (agua helada); rotar/escalar a lo largo |
| `obs_ice_pillar` | 52x104 | 3 (0 entero, 1 agrietado, 2 escombro) | pilar r 22; ancla de la colision = (26,82) final (base elipse en y 94): dibujar en (x-26, y-82). Azul liso sin ojos |
| `fx_campfire` | 40x48 | 4 (`burn` 8) | ancla (20,38) = centro del suelo de la hoguera |
| `fx_blizzard_tile` | 256x256 | 3 (`loop` 10) | loseta SIN costuras de rayas diagonales (20 grados), alfa propio |
| `fx_ice_block` | 44x44 | 3 (0 entero, 1 agrietado, 2 derritiendose; `melt` sin ciclo 3) | bloque del Alud, centrado |
| `fx_ice_burst` | 96x96 | 5 (`burst` 14 sin ciclo) | estallido de esquirlas (pilar roto, bloque), centrado |
| `fx_skid_trail` | 96x32 | 3 (`fade` 6 sin ciclo) | estela de derrape: dos rayones, apunta a la derecha (extremo derecho = el que patina); rotar |
| `fx_ice_breath` | 128x128 | 4 (`puff` 10 sin ciclo; `loop`) | nube de aliento helado, centrada (tick del Aliento polar) |
| `fx_snow_puff` | 64x64 | 4 (`puff` 12 sin ciclo) | polvareda de nieve (lance, patinazo, impacto), centrada ligeramente baja |
| `fx_ice_debris` | 96x64 | 3 (`glint` 3) | hielo roto en el suelo |
| `fx_snow_pool` | 96x64 | 3 (`idle` 2) | charco de nieve/aguanieve (ralentiza) |
| `decor_tundra` | 56x56 | 6: 0 cristales, 1 estalagmitas, 2 monton de nieve, 3 monton con hierba seca, 4 roca con nieve, 5 rama seca | ancla base-centro (28,52) |
| `tile_ice` | 64x64 | 6 | losetas de hielo SIN costuras (diagonales brillantes) |
| `tile_snow_patch` | 64x64 | 3 | losetas de nieve firme SIN costuras (PUNTOS) |
| `icon_frio` | 24x24 | 2 (0 normal, 1 helado; `loop` 2) | copo, icono del medidor |

## Bioma `tundra` (`Assets.setBiome('tundra')`)
- `Assets.biomes()` incluye `'tundra'`; `getBiome()` devuelve `'tundra'`; `biomeInfo('tundra')`. Se implementa por envoltorio sobre las funciones existentes (assets.js NO se toca): con tundra activa, `sprite('ground0..9')` = hielo (32x32 final), `rock/grass/mushroom/bush/bones/stump/grave/column/edge/torch/fog0/fog1/rune` = versiones de tundra (`runeN` vacias); `vignette()` por defecto azul; `drawFireflies()` dibuja nieve (`drawSnowfall`); `drawRitualGlow()` no hace nada; `decorate()` esparce `decor_tundra`; `addToPhaser` registra tambien `name@tundra:i`.
- `Assets.arena(w,h,{seed,wall,snowR})` en tundra -> `{canvas, torches:[], ritual:null, snow:[{x,y,r}], fires:[{x,y,r:64}], cracks:[{x,y,len,a}], pillars:[{x,y,r:22}]}`. Posiciones del doc B.1.1 escaladas por `w/1440` (`Assets.TUNDRA_SPOTS` = coordenadas base 1440x810). `snowR` 110 por defecto (90/70 en F3/F4: regenerar la arena o dibujar encima). El canvas lleva horneados: hielo con diagonales/brillos, 5 parches de NIEVE (disco crema con borde festoneado y PUNTOS + transicion de 24 px punteada), 5 grietas largas (visuales, seguras), estalagmitas decorativas del borde, viñeta azul. Las hogueras y los pilares NO estan horneados (dinamicos): usar `fires`/`pillars` con las funciones de abajo. Coste de generacion ~10 ms.

## Funciones de dibujo
- `Assets.drawBlizzard(ctx, t, intensity, o)`: capa de ventisca de PANTALLA. `intensity` = alfa del doc (0,15 calma / 0,45 rafaga / 0,6 desesperado; <=0 no dibuja). `o`: `w,h` (defecto el canvas), `px,py` centro despejado en pantalla (el jugador; defecto el centro), `clear` 330, `outer` 520 (bruma blanca sube a ~intensity*1,22 en `outer`), `quality` `'alta'|'media'|'baja'` (o 2|1|0; defecto alta), `wind` rad (0,35). Alta = bruma + 2 capas de rayas; Media = 1 capa; Baja = solo degradado estatico en bordes (sin particulas). **Orden de dibujo: mundo -> drawBlizzard -> telegrafias, proyectiles enemigos y barras del jefe -> HUD** (la funcion nunca dibuja encima de lo que pintes despues). Coste medido (Chromium headless SIN GPU, 960x540, mediana): ~0,8 ms por encima de un blit a pantalla completa en Alta/Media y ~0,1 ms en Baja; con GPU es menor. Un canvas de trabajo interno de media resolucion se reutiliza (sin asignaciones por frame).
- `Assets.drawSnowfall(ctx, w, h, t, {count 70, view})`: copos y destellos en coordenadas de mundo (= lo que hace `drawFireflies` en tundra).
- `Assets.drawCampfire(ctx, x, y, t, {r 64, scale 1, ring true, light true, alpha})`: hoguera con luz calida aditiva y aro punteado del radio de calor (`r`; en el desesperado pasar `r:120`, `scale` 1,4).
- `Assets.drawIcePillar(ctx, x, y, {hp 0..1, rebuild 0..1, struck, alpha})`: igual que `drawPillar` (entero hp>0,5, agrietado >0, escombro 0; con hp 0 y `rebuild`>0 aro de aviso + fantasma). (x,y) = centro de la colision; ordenar por y+12.
- `Assets.drawColdBar(ctx, x, y, value, t, {w 140, h 10, text true, frozen, alpha})`: icono de copo + barra 140x10 + "NN%"; `value` 0-100; marcas en 40 y 70; azul claro <40, mas blanco con pulso desde 70, borde destellante a 100 / `frozen`. (x,y) esquina sup. izq.; devuelve el ancho total (w+58). Pensada bajo la barra de vida.
- `Assets.drawColdVignette(ctx, W, H, value, t, {alpha})`: escarcha azul en bordes y esquinas (canvas cacheado + alfa): nada <20, suave 20-40, clara >=40, intensa >=70, blanqueada a 100.
- `Assets.drawFlake(ctx, x, y, r, {color, rot, alpha})`: copo vectorial suelto.
