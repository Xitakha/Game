# Swarm Hand: Fusión (prototipo v1)

Experimento **aislado** de "cartas activas" sobre una copia de `games/card-swarm/` (que no se ha tocado). Diseño de partida: `../card-swarm-fusion-DESIGN.md`.
El README del juego original (heredado de la copia, sin actualizar) está en `README-card-swarm-heredado.md`; los `DESIGN-*.md` / `GDD.md` de esta carpeta también son heredados.
Arte y audio de los 8 poderes nuevos: `src/assets_fusion2.js` y `src/sfx_fusion2.js` (contrato en `ASSETS_FUSION.md`).

## Qué es
- **Ataque básico automático** del jugador: 10 de daño cada 650 ms al enemigo más cercano (alcance 440).
- Las **cartas de ataque son INFUSIONES** del básico: cada carta da +20 / +35 / +50 % de daño al básico (Nv 1-3) y el efecto de su etiqueta:
  Fuego quema (Nv3 explota), Hielo ralentiza (Nv3 congela 0,5 s la 1.ª vez), Rayo encadena 1 salto (Nv3: 2), Veneno 1 stack, Sangre 20 % de curar 1 HP (Nv3 sangrado), Acero atraviesa 1 (Nv3: 2) y 10 % de crítico.
  Dos cartas iguales = **REFUERZO** de Nv. Los talentos de las cartas proyectil del árbol (Pavesa, Ráfaga, Perforante, Escarcha densa, Dosis doble, Punta afilada) pasan a sus infusiones.
- **Pool completo (v1)**: las 28 cartas originales (con el desbloqueo de la forja). Las cartas que NO son proyectil (Bola de brasa, Nova, Chispazo, Tormenta, Colmillo, Sangría, Charco, Daga, Hacha, Bobina, Murciélago y las orbitales / auras: Anillo ardiente, Escudo de púas, Ventisca, Nube pútrida) conservan además su **arma original como auxiliar**: dispara cada `1,5x` su cooldown y al `60 %` de daño (`?auxmul=`, `?auxcd=`, `?aux=0` las apaga) y su infusión da solo la mitad de bono (+10 / +17,5 / +25 %). Así hay variedad sin duplicar el daño de las armas del original.
  Pasivas: todas las del original (Lana, Pezuñas, Imán, Alforja, Reloj y las de etiqueta: Manto, Cristal, Cascabel, Bilis, Afilar) se mantienen con su efecto original, que aquí actúa sobre la etiqueta de cada golpe (básico, poderes y armas auxiliares). El Reloj de arena baja el cooldown de poderes un 6 % por nivel (tope global -25 %).
- **Fusión**: dos cartas de ataque de etiquetas distintas con receta crean un **PODER ACTIVO** (máx. **4 slots**) con enfriamiento. Re-fusionar la misma receta = Nv2 (tope). Las 12 recetas (los 12 combos pasivos del original, 1:1):

| Receta | Poder | Efecto Nv1 | Nv2 | CD |
|---|---|---|---|---|
| Fuego + Hielo | **Vapor** | nube r90, 4 s en el grupo más denso: ciega (enemigos normales; élites y jefes +20 % de daño), ralentiza 30 %, 6 por tick de 250 ms | r110, 5 s, 8/tick | 14 s (12) |
| Fuego + Rayo | **Plasma** | rayo perforante (largo 260, ancho 14) que gira 180 grados/s durante 2,5 s, 10 por tick de 140 ms, máx. 12 objetivos, quema | 3,5 s, ancho 20, 12 | 12 s |
| Veneno + Fuego | **Gas inflamable** | granada que deja nube de gas r80 5 s (+1 veneno / 0,5 s) y detona (45, quema) | r100, 70 + 6 por stack | 13 s |
| Sangre + Acero | **Sed de hierro** | 3 dagas orbitan 6 s (8 por contacto, sangrado), el básico +40 % de cadencia, cada 5 golpes curas 1 HP (máx. 6) | 8 s, máx. 10 HP | 18 s |
| Hielo + Rayo | **Tormenta de escarcha** | zona r110 que te sigue 5 s: ralentiza 40 % y cada 0,5 s cae un rayo (18, x1,5 si ralentizado, aturde 0,5 s; si no hay ralentizados, al azar) | r130, 7 s, 24 | 15 s |
| Veneno + Hielo | **Escarcha tóxica** | 3 esporas heladas explotan (r50, 14, ralentiza 50 %, 2 stacks); el veneno dura +3 s en ralentizados y se propaga a 3 al morir | 5 esporas, 18 | 12 s |
| Sangre + Fuego | **Pacto ardiente** | pagas el 12 % de tu HP (nunca bajas de 20) y estallas en nova r120 (30 + 0,8 x HP pagado, quema, empuje); +25 % de daño 6 s | paga 10 %, nova 45, 8 s | 16 s |
| Acero + Rayo | **Imán** | tira de los enemigos pequeños 1,2 s (r150), destruye flechas 3 s y descarga 3 cadenas de 3 saltos (20); aturde 0,4 s (no jefes) | r190, 5 saltos, tirón 1,8 s | 14 s |
| Fuego + Acero | **Forja** | hacha gigante ida y vuelta (3 s), perfora, 35 por pasada + quema, **ignora el escudo frontal** y rompe placas | 2 hachas, 45 | 11 s |
| Hielo + Acero | **Filo gélido** | abanico de 7 lanzas (cono 120 grados, alcance 220), 16 (x2 contra ralentizados), ralentiza 35 % | 12 lanzas, 20 | 10 s |
| Sangre + Veneno | **Hemotoxina** | marca hasta 6 enemigos 6 s: sangrado + veneno x3; los marcados que mueren curan (máx. 2 HP por uso) y propagan veneno | 9 marcados, máx. 3 HP | 13 s |
| Veneno + Rayo | **Descarga tóxica** | rayo sobre todos los envenenados visibles: consume el veneno (12 + 8 por stack); sin envenenados aplica 1 stack a 5 enemigos | 12 por stack | 12 s |

  Sin receta (la UI no las ofrece): **Sangre+Hielo, Sangre+Rayo, Veneno+Acero**.
- Etiqueta dinámica: cada impacto del básico y de los poderes usa, de las etiquetas que lo componen, la que mejor multiplica contra ese objetivo (debilidades / resistencias de jefes y materiales). Los poderes no reciben bonos de Nv de carta.
- **Topes por uso**: 400 de daño por objetivo y uso; contra un jefe, 3 % de su vida máxima por uso (`?bosscap=`; el diseño proponía 1,5 %).

## Reglas de fusión
- Al subir de nivel, si una carta ofrecida completa una receta con una carta de tu mano, muestra "FUSIÓN: nombre" y al elegirla sale una **ventana**: `FUSIONAR YA` (dice qué cartas se consumen) / `A LA MANO` / `VOLVER`. Fusionar cuenta como tu elección de nivel.
- Botón `FUSIONAR CARTAS DE LA MANO` (en la oferta) para fusionar dos cartas que ya tienes; no gasta la elección.
- **1.ª fusión ayudada**: solo se consume la carta ofrecida; la carta inicial (ancla 1) se conserva. Desde la 2.ª se consumen las dos. La 1.ª oferta tras el inicio garantiza una carta que forme receta.
- Con 4 poderes, un 5.º pide **confirmar cuál reemplazar** (o cancelar); el reemplazado da +20 Ceniza.
- Los 12 combos pasivos del original están **desactivados** (son las recetas). `C.combos` solo se usa como lista informativa (Base, Archivo, consejos de Lanudo, misiones "Alquimista" / "Maestro de mezclas" = crear 5 / 12 fusiones).

## Controles
| | Móvil (844x390) | Escritorio |
|---|---|---|
| Poderes 1-4 | 4 botones circulares (radio 38 = unos 55 px) en arco en la esquina inferior derecha, con barrido de enfriamiento, segundos, nombre y estado | `Q` `E` `R` `Espacio` (o `1` `2` `3` `4`), o clic en el botón. (`W` queda para moverse.) |
| Modo AUTO | chip "AUTO" a la izquierda del arco | `F` |
| Moverse | joystick flotante en la mitad izquierda | WASD / flechas |
| Mano de cartas | **abajo a la izquierda** (x 8-393); el NV va a su derecha | igual |

Los botones están en x >= 772 (el joystick solo nace en x < 480); no se solapan con la mano, pausa / silencio (arriba a la izquierda) ni con el HUD (probado con dos dedos: joystick mantenido + los 4 botones, `fusion_tests.js touch` / `ui`). Vertical 390x844: solo el aviso "gira el teléfono" (como el original). Modo AUTO: dispara un poder listo si hay objetivo útil (>= 3 enemigos para nubes / tormenta / gas, >= 4 para Imán, 2 para dagas / esporas / filo / marca, 1 para Plasma / Forja, >= 2 envenenados para Descarga, HP >= 40 % para Pacto; jefe presente baja los umbrales).

## Integración con el juego original (v1)
Vuelve a estar activo: **aldea** (`?direct=1` salta directo a la partida, para pruebas), **Portal** (biomas bosque, cripta, asfódelo, tundra, panal, Cráter; duración; Cacería y Práctica), **6 jefes** (Pastor, Karceron, Letea, Yarlak, Melaria, Cenizar) con sus debilidades, **minijefes**, **árbol de forja** (Grum), Rangos de forja, **Archivo** (colección, 3 loadouts), **platos** de Tía Castaña, **misiones** del Tablón / Ruta y Resonancia, todo con la cuenta propia `swarmhand.fusion.save`.
- **Anclas**: 1 slot (la carta inicial, que se conserva en la 1.ª fusión); el nodo del tronco "Segunda ancla" da el 2.º. Cuenta nueva: Chispa de ancla; cartas desbloqueadas = las iniciales (Chispa, Esquirla, Dardo, Daga, Colmillo, Reloj). Rayo se desbloquea en la forja (para Plasma, Tormenta, Imán, Descarga hace falta).
- Efectos de talentos y Rangos: el Rango de forja (+8 % de daño por rango) multiplica la infusión y el arma auxiliar de esa carta; los talentos de armas auxiliares (Nova doble, Hacha II, etc.) siguen funcionando; los de cartas proyectil se trasladan a la infusión; Resonancia (3-4 cartas de la misma etiqueta) y sus sets siguen activos (compiten con fusionar etiquetas distintas: es decisión del jugador).
- **Qué NO se ha adaptado / queda abierto**: los textos del árbol conservan las descripciones del original ("carta Fuego +8 %"...) y no indican que el talento actúe sobre la infusión; no se ha repasado talento por talento el posible doble pago de los sets de Resonancia con los poderes; los efectos de plato / Ruta sobre "combos" no existen en el original; no se ha jugado a mano una campaña completa (aldea -> 6 jefes -> Cráter) con el nuevo sistema, solo humo con bots (ver Balance).

## Cómo probarlo
```
python3 tools/serve.py card-swarm-fusion 8811      # desde la raíz del repo -> http://localhost:8811/index.html
```
Parámetros: `?direct=1` (sin aldea), `?all=1` (todas las cartas desbloqueadas), `?actives=vapor,plasma,forja2,hemo` (poderes de inicio; sufijo 2 = Nv2; ids: vapor plasma gas sed tormenta escarcha pacto iman forja filo hemo descarga), `?hand=spark:1,shard:1`, `?boss=pastor&nointro=1&prep=0`, `?assault=1` (Cenizar), `?god=1`, `?speed=4`, `?cmul=` (daño global), `?aux=0&auxmul=&auxcd=`, `?fuseAsh=`, `?bosscap=`, `?nosw=1`, `?reset=1`.

Pruebas y bots (Chromium de `/opt/pw-browsers`, 844x390 táctil, `tools/card-swarm-fusion-bot/`):
- `node fusion_tests.js [all|iso|flow|powers|ui|village|touch|boss]` (0 errores de consola en cada una; `iso` comprueba que `games/card-swarm/` y sus herramientas siguen intactos).
- `play_bot.js <n> <cmul> [sinPoderes] [base] [speed] [all] [extra]` partidas completas con 4 poderes en AUTO; `baseline_bot.js <n>` mismo bot sobre el original (`python3 tools/serve.py card-swarm 8812`); `boss_bot.js <n> [jefes] [sinPoderes]` pelea por jefe con 4 poderes fijados por URL.

## Balance
Ver la sección "Balance medido" al final (números reales, ruido y límites del bot).

## Aislamiento respecto al juego original
- Guardado en `localStorage` `swarmhand.fusion.save` (el original usa `swarmhand.save`; no se leen ni se tocan).
- `sw.js`: caché `fusionhand-<hash>` (NO empieza por `swarmhand-`: el `activate` del original borra todas las `swarmhand-*` de su origen). `manifest.webmanifest`: `id` `swarm-hand-fusion/`, `start_url`/`scope` `./`. Título propio.
- `tools/card-swarm-pwa/stamp_fusion.py` (copia de `stamp.py`; el precache sale de `index.html`, ya incluye `assets_fusion2.js` y `sfx_fusion2.js`). `.github/workflows/pages.yml` solo añade un bloque que copia `games/card-swarm-fusion` a `_site/card-swarm-fusion` y ejecuta ese stamp.

## Cambios sobre el código copiado (marcados con `FUSION`)
Nuevos: `src/fusion.js`, `src/assets_fusion.js`, `src/assets_fusion2.js`, `src/sfx_fusion.js`, `src/sfx_fusion2.js`. Editados: `cards.js` (anclas, pool por desbloqueo, ofertas con receta, ventana de fusión, botón, chips de poderes, mano a la izquierda), `weapons.js` (las cartas proyectil ya no disparan; exporta orbitales / auras / FIRE para las auxiliares), `combat.js` (buff de Pacto, marca de Hemotoxina, plaga de Escarcha tóxica), `enemies.js` (`blindT`), `hud.js`, `base.js`, `main.js`, `tree.js` (anclas 1/2), `save.js`, `panels.js` / `quests.js` (textos), `pwa.js`, `sw.js`, `index.html`, `manifest.webmanifest`.
