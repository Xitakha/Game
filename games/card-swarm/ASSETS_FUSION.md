# Arte procedural de poderes (Fusión) - contrato

Archivos: `src/assets_fusion.js` (vapor, plasma, gas, sed; `G.FusionArt`) y `src/assets_fusion2.js` (los otros 8 + botones, infusiones, estados y VFX; `G.FusionArt2`).
Integración (para el programador): añadir `<script src="src/assets_fusion2.js">` DESPUÉS de `assets_fusion.js`. No requiere más cambios para los iconos: `assets_fusion2.js` envuelve `G.FusionArt.icon`, así que `G.FusionArt.icon(c, 'forja', x, y, s)` ya funciona.
Seguridad: cada función de `G.FusionArt2` hace `save/restore` y traga errores (`G.FusionArt2.lastError`); con `c` nulo o id desconocido no dibuja o pinta un círculo dorado. Usa `G.time` (ms) para animar y `G.fg` (calidad plana) si existe. Todo es vector, sin imágenes ni asignaciones por frame.
Probado en Chromium sobre el juego real: 0 errores (captura `studio/docs/capturas-fusion/arte_fusion2_galeria.jpg`).

## Ids
Poderes: `vapor plasma gas sed tormenta escarcha pacto iman forja filo hemo descarga` (`G.FusionArt2.ids`). Etiquetas: `fire ice lightning poison blood steel` (`.tags`). Estados: `blind slow freeze burn poison bleed stun mark` (`.states`). Colores: `G.FusionArt2.COLORS[id|tag]`.

## Funciones (c = ctx; u = progreso 0..1; t = segundos; s/r = radio en px lógicos)
| Función | Uso |
|---|---|
| `icon(c,id,x,y,s)` | Icono centrado, s = radio. Tamaños usados: 11 (HUD), 22 (oferta), 0,55 x radio del botón. Los 12 ids. |
| `btn(c,id,x,y,r,state,cdFrac,auto)` | Botón completo (radio 42 en móvil). `state`: `ready` (pulso dorado, aro dorado), `cd` (barrido oscuro, `cdFrac` = fracción RESTANTE 0..1), `active` (aro blanco), `press` (escala 0,92), `off` (vacío, 35 % alfa). `auto` pone punto dorado. El texto de segundos lo pinta el HUD. |
| `infuse(c,tag,x,y,s,lvl)` | Icono de infusión en disco (s ~ 14-20) con 1-3 puntos de nivel debajo. |
| `status(c,kind,x,y,s,t)` | Marca de estado sobre enemigo de radio s. |
| `mark(c,x,y,s,t)` | Reticle rosa de Hemotoxina (= status `mark`). |
| `storm(c,x,y,r,t,alpha)` | Tormenta de escarcha: zona nevada (r 110 / 130 en Nv2). |
| `strike(c,x,y,u,big)` | Rayo que cae del cielo; `big` = rayo global de Descarga tóxica (verde-amarillo). Dura ~0,25-0,4 s. |
| `spore(c,x,y,t,s)` / `sporeBurst(c,x,y,r,u)` | Espora de Escarcha tóxica (s 8) y su explosión (r 50). |
| `nova(c,x,y,r,u,kind)` | Onda: `pact` (defecto, r 120), `ice`, `magnet`, `toxic`. |
| `aura(c,x,y,t,alpha,r)` | Llamas alrededor del jugador durante el buff de Pacto ardiente (r 26). |
| `magnet(c,x,y,r,t,alpha)` | Campo del Imán (r 150 / 190) con líneas que se pliegan hacia dentro. |
| `chain(c,pts,t,rgb)` | Cadena eléctrica por `[{x,y},..]` (Imán, Tormenta); un solo trazo por cadena. |
| `axe(c,x,y,t,sc)` | Hacha de Forja en vuelo, gira con t (sc 1 = r 30). |
| `lance(c,x,y,ang,crit)` | Lanza de hielo de Filo gélido (crit = dorada). |
| `fan(c,x,y,ang,spread,range,u)` | Cono de lanzamiento del abanico (120 grados = 2,09 rad, alcance 220). |
| `drain(c,x0,y0,x1,y1,u)` | Gota de sangre del marcado que muere hacia el jugador (Hemotoxina). |
| `cast(c,id,x,y,u)` | Destello de lanzamiento sobre el jugador, color por poder (~0,3 s). |
| `impact(c,id,x,y,u,s)` | Chispas de impacto por poder (~0,2 s). |

## Mapa poder -> arte
| Poder | Botón/icono | Lanzamiento | Zona / en vuelo | Impacto / fin | Estados |
|---|---|---|---|---|---|
| tormenta | nube + rayo | cast | `storm` sigue al jugador | `strike` + `impact` | slow, stun |
| escarcha | espora + cristal | cast | `spore` x3 | `sporeBurst` | slow, poison |
| pacto | corazón en llamas | cast + `nova('pact')` | `aura` 6 s | nova | burn |
| iman | herradura | cast | `magnet` + `chain` | `nova('magnet')` | stun |
| forja | hacha | cast | `axe` | `impact('forja')` | burn |
| filo | 3 lanzas | `fan` | `lance` x7 | `impact('filo')` | slow, freeze |
| hemo | gota + calavera | cast | `mark` por marcado | `drain` | bleed, poison, mark |
| descarga | gota + rayo | cast | - | `strike(big)` por envenenado + `impact('descarga')` | poison |

Pendiente: variantes distintas de Nv2 (solo se escala radio/cantidad desde la lógica); ids antiguos (vapor, plasma, gas, sed) mantienen sus funciones de `assets_fusion.js` (`cloud`, `beam`, `dagger`, `nade`).

## Audio fusiones 13-15 (`src/sfx_fusion3.js`)

Cargar DESPUÉS de `sfx_fusion2.js` (`<script src="src/sfx_fusion3.js">`). Ids: `cristal` (ward), `zancada` (dash), `virote` (bolt). Mismo API: `G.Snd.play('fx_<id>[_hit|_zone|_ready|_fuse]', pitch)` o `G.Snd.fx2(id, 'cast'|'hit'|'zone'|'ready'|'fuse', pitch)`. 15 sonidos, añadidos a `S.fx2names` (y `S.fx3names`). ROOT: cristal 1,26, zancada 0,95, virote 0,67. Volumen máx. 0,18.
Duraciones: cristal 0,4 / hit 0,35 / zone 0,3 (bucle ~450 ms); zancada 0,3 / hit 0,1 / zone 0,25 (bucle ~450 ms); virote 0,35 / hit 0,25 / zone = eco suave de hit (no se usa, sin campo). `_ready` ~0,3 s, `_fuse` ~0,9 s. Verificado en Chromium: 0 errores.

## Fusiones 13-15 (`src/assets_fusion3.js`)
Cristal de sangre (`cristal`), Zancada carmesí (`zancada`), Virote corrosivo (`virote`). Cargar DESPUÉS de `assets_fusion2.js` (el programador añade el `<script>`). Extiende `G.FusionArt2` (envuelve las funciones previas; los ids viejos siguen igual) y `G.FusionArt.icon`. Mismas garantías: save/restore, errores en `lastError`, `G.time`, `G.fg`. Probado en Chromium: 0 errores, ~0,56 ms por galería completa (captura `studio/docs/capturas-herrero/arte_fusion3_galeria.jpg`).

`ids` pasa a 15; `states` incluye `corrode`; `COLORS`: `cristal #d86a98`, `zancada #ff6a7a`, `virote #9ad05a`.

| Función | Capa | Uso |
|---|---|---|
| `icon(c,id,x,y,s)` / `btn(c,id,...)` | HUD | Los 3 ids nuevos (s 11 / 22 / 0,55 x r38). `btn` mantiene su API (para estos ids usa una copia propia, porque el `btn` de fusion2 no los conoce). |
| `ward(c,x,y,r,t,alpha,u)` | aire | Bucle alrededor del jugador, r 56 / 66; `t` seg; `u` = escudo restante 0..1 (8 esquirlas, 6 bajo 0,5; grietas bajo 0,6; parpadea con `u<0.2`, que equivale al último segundo: pasar `u` real o `1 - tRestante/dur`). |
| `shatter(c,x,y,r,u)` = `nova(c,x,y,r,u,'shatter')` | suelo | Onda de rotura r 100 / 120, `u` 0..1 en ~450 ms (rojo oscuro a azul hielo). |
| `trail(c,x0,y0,x1,y1,u)` | suelo | Estela de Zancada, `u` = edad 0..1 (2,5 s), ancho 30; se desvanece con `u`. Llamar una vez por campo. |
| `dashGhost(c,x,y,ang,u)` | aire | 3 postimágenes rojas detrás de (x,y) en dirección `ang`; ~250 ms (`addFx` kind `dash`). |
| `virote(c,x,y,ang,u)` | aire | Proyectil 40x8 con halo verde y rastro; vuelo ~180 ms. Impacto: `impact(c,'virote',x,y,u,14)`. |
| `status(c,'corrode',x,y,s,t)` | aire | Corrosión: 3 gotas verdes que caen + línea punteada óxido bajo el enemigo (`s` = radio, `t` seg). |
| `cast(c,id,x,y,u)` / `impact(c,id,x,y,u,s)` | - | Aceptan `cristal`, `zancada`, `virote`. |
