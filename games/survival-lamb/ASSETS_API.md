# Assets API (src/assets.js)

Generador de recursos 100% original, sin dependencias ni ficheros externos. Script clasico:
`<script src="src/assets.js"></script>` -> `window.Assets`. Todo se genera al cargar (sprites) o tras un gesto (audio).

## Sprites
Pixel-art dibujado por codigo en canvas, escala x2 (`Assets.scale`), nearest-neighbor. Los personajes miran a la DERECHA (voltear con scale -1 o rotar al apuntar). Tamanos = pixeles finales.

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
