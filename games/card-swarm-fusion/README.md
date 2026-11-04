# Swarm Hand: Fusión (prototipo v0)

Experimento **aislado** de "cartas activas" sobre una copia de `games/card-swarm/` (que no se ha tocado). Diseño de partida: `../card-swarm-fusion-DESIGN.md`.
El README del juego original (heredado de la copia, sin actualizar) está en `README-card-swarm-heredado.md`; los `DESIGN-*.md` / `GDD.md` de esta carpeta también son heredados.

## Qué es
- **Ataque básico automático** del jugador: 10 de daño cada 650 ms al enemigo más cercano (alcance 440).
- Las **cartas de ataque son INFUSIONES** del básico (ya no disparan solas): cada carta da +20 / +35 / +50 % de daño al básico (Nv 1-3) y un efecto de su etiqueta:
  Fuego quema (Nv3 explota), Hielo ralentiza (Nv3 congela 0,5 s la 1.ª vez), Rayo encadena 1 salto (Nv3: 2), Veneno 1 stack, Sangre 20 % de curar 1 HP (Nv3 sangrado), Acero atraviesa 1 (Nv3: 2) y 10 % de crítico.
  Dos cartas iguales = refuerzo de Nv (se llama "REFUERZO", no "fusión").
- **Fusión**: dos cartas de ataque de etiquetas distintas con receta crean un **PODER ACTIVO** (máx. 2) con enfriamiento. Las 4 recetas de v0:

| Receta | Poder | Efecto Nv1 | CD |
|---|---|---|---|
| Fuego + Hielo | **Vapor** | nube r90, 4 s en el grupo más denso: ciega (los enemigos normales persiguen un punto al azar; élites y jefes no se ciegan y reciben +20 %), ralentiza 30 %, 6 de daño / 250 ms | 14 s |
| Fuego + Rayo | **Plasma** | rayo perforante (largo 260, ancho 14) que gira 180 grados/s durante 2,5 s, 10 por tick de 140 ms, máx. 12 objetivos, quema | 12 s |
| Veneno + Fuego | **Gas inflamable** | granada que deja una nube de gas r80 5 s (+1 stack de veneno / 0,5 s) y detona al final (45, quema) | 13 s |
| Sangre + Acero | **Sed de hierro** | 3 dagas orbitan 6 s (8 por contacto, sangrado), el básico dispara +40 %, cada 5 golpes del básico curas 1 HP (máx. 6 por uso) | 18 s |

  Nv2 re-fusionando la misma receta (más radio / duración / daño, ver `RECIPES` en `src/fusion.js`). Las parejas sin receta (todas las demás de v0) no se pueden fusionar.
- Etiqueta dinámica: cada impacto del básico y de los poderes usa, de las etiquetas que lo componen, la que mejor multiplica contra ese objetivo (debilidades / resistencias de jefes y materiales). Los poderes no reciben bonos de Nv de carta.
- Topes por uso: 400 de daño por objetivo y uso; contra un jefe, 3 % de su vida máxima por uso (parámetro `?bosscap=`; el diseño proponía 1,5 %).

## Reglas de fusión implementadas
- Al subir de nivel, si una carta ofrecida completa una receta con una carta de tu mano, la carta muestra "FUSIÓN: nombre" y, al elegirla, sale una **ventana de confirmación**: `FUSIONAR YA` (dice qué cartas se consumen) / `A LA MANO` / `VOLVER`. Fusionar cuenta como tu elección de nivel.
- Botón `FUSIONAR CARTAS DE LA MANO` (en la oferta, bajo las cartas) para fusionar dos cartas que ya tienes; no gasta la elección.
- **1.ª fusión ayudada**: solo se consume la carta ofrecida; la carta inicial se conserva. Desde la 2.ª se consumen las dos cartas. La 1.ª oferta tras el inicio garantiza una carta que forme receta.
- Con 2 poderes, un poder nuevo pide **confirmar cuál reemplazar** (o cancelar); el reemplazado da +20 Ceniza.
- Combos pasivos desactivados (`C.combos = []`). Árbol, forja, Resonancia y anclas fuera: **cuenta vacía**, arranca directo en la partida (`?village=1` abre la aldea del original, sin probar).
- Pool de la prueba: 12 infusiones (2 por etiqueta: Chispa/Brasa, Esquirla/Nova, Chispazo/Tormenta, Dardo/Charco, Colmillo/Sangría, Daga/Hacha) + 5 pasivas (Lana, Pezuñas, Imán, Alforja, Reloj de arena). Las orbitales, auras, Bobina y Murciélago, y las pasivas de etiqueta, quedan fuera.

## Controles
| | Móvil | Escritorio |
|---|---|---|
| Disparar poder 1 / 2 | botones circulares grandes (radio 42, esquina inferior derecha) con barrido de enfriamiento y segundos | `Q` / `E` o clic en el botón |
| Modo AUTO | chip "AUTO" bajo los botones | `F` |
| Moverse | joystick flotante en la mitad izquierda | WASD / flechas |

Los botones están en x >= 744 (el joystick solo nace en x < 480) y no se solapan con la mano ni con los botones de pausa / silencio de `mobile.js` (comprobado en `fusion_tests.js touch`; el toque en el botón se procesa en `pointerdown` antes del joystick y no genera clic). Modo AUTO: dispara un poder listo si hay >= 3 enemigos cerca (nube / gas), 1 (plasma), 2 (dagas) o un jefe.

## Cómo probarlo
```
python3 tools/serve.py card-swarm-fusion 8811      # desde la raíz del repo -> http://localhost:8811/index.html
```
Parámetros útiles: `?actives=vapor,plasma` (poderes de inicio; `vapor2` = Nv2), `?hand=spark:1,shard:1`, `?boss=pastor&nointro=1&prep=0`, `?god=1`, `?speed=4`, `?cmul=` (daño global), `?fuseAsh=`, `?bosscap=`, `?nosw=1`, `?reset=1`.
Pruebas (Chromium de `/opt/pw-browsers`, 844x390 táctil): `node tools/card-swarm-fusion-bot/fusion_tests.js [all|iso|flow|powers|touch|boss]`; bot de partidas completas para calibrar: `node tools/card-swarm-fusion-bot/play_bot.js <n> <cmul> [1 = sin poderes]`.

## Aislamiento respecto al juego original
- Guardado en `localStorage` `swarmhand.fusion.save` (el original usa `swarmhand.save`; no se leen ni se tocan entre sí).
- `sw.js`: caché `fusionhand-<hash>` (a propósito NO empieza por `swarmhand-`: el `activate` del original borra todas las cachés `swarmhand-*` de su origen). `manifest.webmanifest`: `id` `swarm-hand-fusion/`, nombre "Swarm Hand: Fusión", `start_url`/`scope` `./` (relativos a `/card-swarm-fusion/`; el scope del original `/card-swarm/` no lo cubre). Título propio.
- `tools/card-swarm-pwa/stamp_fusion.py` (copia de `stamp.py` apuntando a esta carpeta; el original no se ha editado). `.github/workflows/pages.yml` solo añade un bloque que copia `games/card-swarm-fusion` a `_site/card-swarm-fusion` y ejecuta ese stamp. Enlace en `tools/site/index.html`.
- Los iconos de la app son los del original (copia).

## Cambios sobre el código copiado (todos marcados con `FUSION` o `Fusion`)
`src/fusion.js` (lógica), `src/assets_fusion.js` (iconos y VFX procedurales), `src/sfx_fusion.js` (SFX procedurales) son nuevos. Editados: `cards.js` (pool, ofertas con receta, ventana de fusión, botón, chips de poderes, sin cooldown de carta), `weapons.js` (las cartas ya no disparan; `W.update` llama a `G.Fusion.update`; proyectil `basic` con perforación por contador), `enemies.js` (estado `blindT`), `hud.js` (botones, textos), `base.js` (texto final), `main.js` (botón en `pointerdown`, arranque directo), `save.js` / `pwa.js` / `sw.js` / `index.html` / `manifest.webmanifest` (aislamiento).

## Qué falta (v0 -> v1)
- Solo **4 de las 12 fusiones** del diseño; faltan Tormenta de escarcha, Escarcha tóxica, Pacto ardiente, Imán, Forja, Filo gélido, Hemotoxina y Descarga tóxica (las parejas Hielo+Rayo, Veneno+Hielo, Sangre+Fuego, Acero+Rayo, Fuego+Acero, Hielo+Acero, Sangre+Veneno y Veneno+Rayo hoy no fusionan).
- Sin integración con aldea, árbol ni forja; el final de partida lleva a "Reintentar" o a la aldea heredada (sin verificar con cuenta vacía).
- Nv2 de cada poder sin pulir (sin VFX distinto); sin arte ni sonido propios por poder más allá de glifos y SFX procedurales; sin bot de balance ni de jefes adaptados (hay `play_bot.js`, un bot crudo).
- Aviso "poder listo" solo con sonido y pulso; falta indicar objetivos (previsualizar el área de la nube).
- Sin medición de rendimiento en móvil real ni con 2 poderes y horda máxima (solo humo en Chromium).

## Decisiones tomadas / abiertas
Tomadas (por el dueño, según las recomendaciones del diseño): cartas = infusiones; se consumen las dos cartas salvo la 1.ª fusión ayudada; parejas sin receta no fusionan; Nv2 re-fusionando; cuenta vacía; máx. 2 poderes con reemplazo confirmado.
Abiertas:
1. **Balance global.** Con el daño del diseño (básico 10 / 650 ms) el bot muere muy pronto; ver "Balance" abajo. Hay que decidir el multiplicador de daño definitivo y si el básico debe escalar con el nivel del jugador.
2. **Tope contra jefes** (3 % por uso en lugar de 1,5 %): con 1,5 % los poderes casi no cuentan contra un jefe de ~24.000 HP.
3. **Qué hacer con las parejas sin receta** cuando haya 12 recetas (3 siguen sin pareja) y si conviene la "fusión inestable".
4. ¿Un poder debe poder dispararse con enemigos no visibles / sin objetivo (hoy no: "sin objetivo")?
5. Reemplazo de poderes: ¿pedir confirmación también al reforzar, o permitir reordenar el slot Q / E?
