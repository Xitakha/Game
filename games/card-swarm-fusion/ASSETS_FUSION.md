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
