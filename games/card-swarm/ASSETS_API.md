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
