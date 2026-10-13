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
