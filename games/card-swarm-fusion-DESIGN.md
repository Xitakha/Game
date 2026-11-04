# Swarm Hand - Prototipo "Fusión": habilidades activas

Estado: DISEÑO para decidir, sin código. Prototipo AISLADO en `games/card-swarm-fusion/` (copia que hará el programador). `games/card-swarm/` no se toca.
Cifras orientativas: afinar con `?cmul`, el balance-bot y el boss-bot.

## 0. Lo que hay hoy (relevante)

| Pieza | Realidad en el código |
|---|---|
| Cartas | `cards.js`: 28 defs (18 ataque, 10 pasivas). 6 etiquetas (fire, ice, lightning, poison, blood, steel) + neutral. Cada carta de ataque ES su arma (proyectil, orbital, aura...) con su propio cooldown (`weapons.js`). |
| "Fusión" actual | `C.add`: coger una carta que ya tienes sube su Nv 1-3 (`LV`: daño x1 / x1,6 / x2,5; cd x1 / 0,85 / 0,7). NO es combinar etiquetas. |
| Combos actuales | `C.combos`: 12 combos PASIVOS por pareja de etiquetas presentes en la mano (vapor, gas, freeze, overload, bloodpoison, frenzy, edge_elec, edge_ice, forge, plague, pact, discharge). Se aplican dentro de `Combat.deal`/`poison`. |
| Mano | 5 slots; reemplazo (+10 Ceniza), descarte (+10), reroll `max(5, 15*(n+1)-desc)`, omitir (+5 Ceniza, solo en subida), oferta de 3 con sesgo de sinergia 70 %. |
| Inicio | Anclas de la Base (`anchorSlots` = 2, por defecto Chispa+Dardo) o elección inicial de 3. |
| Jugador | Solo se mueve (190 px/s), HP 100, sin ataque propio ni habilidad activa. |
| Jefes | `weak/resist` por etiqueta (x1,25 / x0,6-0,8); estados a la mitad en jefes; `HIT_CAP` 32 (solo golpes ENEMIGOS al jugador, no limita el daño del jugador). |
| Lienzo | 960x540 lógico. Mano HUD en `y=428`, `x=280+82i`. |

## 1. Idea y cambio de paradigma

Problema: hoy todas las cartas son armas; un activo no encaja si cada carta ya dispara sola.
Solución del prototipo:

- El jugador tiene un **Ataque básico** automático (nuevo): disparo al más cercano, 10 de daño, 650 ms.
- Las cartas de la mano son **Infusiones**: mejoran ese ataque básico según su etiqueta (no disparan por sí mismas).
- **Fusionar** dos cartas de etiquetas distintas crea un **Poder activo** con enfriamiento (slot aparte de la mano).

Es el cambio grande: se pierde la variedad de "armas" (orbitales, auras...) a cambio de un ataque básico claro + 2 poderes decisivos. Alternativa conservadora (cartas siguen disparando + activos extra) en "Decisiones abiertas" nº 1.

## 2. Modelo de datos

```
// Carta de mano (existente, reducida): { id, lvl 1-3 }  -> sin cd propio (infusión)
Infusión por etiqueta (tabla ACTIVES.infuse[tag]):  { dmgPerLv:[.2,.35,.5], effect }

// Poder activo (NUEVO) - definición estática en actives.js
{ id:'vapor', name:'Vapor', tags:['fire','ice'], recipe:'fire+ice' (clave ordenada alfabéticamente),
  kind:'cloud'|'beam'|'zone'|'volley'|'buff'|'nova'|'pull'|'boomerang'|'mark'|'discharge',
  icon, color, cd:ms, lv:[ {dmg, r, dur, tick, n, cd, ...}, {…} ],   // 2 niveles
  status:['blind','slow'], fxKey, sfxKey, desc }

// Slot activo en el jugador (runtime)
p.actives = [slot|null, slot|null]      // v0: longitud 1; v1: 2
slot = { id, lvl:1|2, cd, cdMax, flash, ready:bool, auto:bool(heredado de p.autoActives) }
p.autoActives = false                     // modo auto global (persistente en la sesión)
```

Reglas de daño del activo:

- `Combat.deal(e, dmg, {tag, ...})` con **etiqueta dinámica**: por impacto se usa, de las 2 etiquetas del activo, la que mejor multiplica contra ese objetivo (debilidad del jefe/material). Si ambas resisten, la menos mala. Así un híbrido nunca es peor que su mejor mitad y el cambio en `Boss.mulIn` es nulo.
- Respeta `cardDmgMul`, debilidades del jefe (tope x1,25) y estados a la mitad en jefes.
- Los activos NO reciben bonos de Nv de carta; sí el multiplicador global de cooldown (tope -25 %).

## 3. Reglas de fusión

| Regla | Decisión |
|---|---|
| Qué se puede fusionar | Dos cartas de ataque en mano con etiquetas distintas que formen receta (tabla 4). Neutras y pasivas no fusionan. |
| Cuándo | (a) En la pantalla de oferta: una carta ofrecida que completa una receta con la mano muestra "FUSIÓN: Vapor" y al elegirla el jugador decide "Fusionar ya" o "Guardar en mano". (b) Botón "FUSIONAR" en la oferta para elegir dos cartas de la mano. Sin fusión fuera de la oferta (el juego no se pausa en combate). |
| Fuentes | Se **consumen las dos** (liberan 2 slots; pierdes sus infusiones: es el coste real). |
| Primera fusión (ayudada) | Se consume solo la carta ofrecida; la carta inicial se conserva. Además la 1.ª oferta tras el inicio garantiza una carta que forme receta con la carta inicial. |
| Coste en Ceniza | Ninguno (el coste es perder 2 infusiones). Parámetro `fuseAsh` = 0 para probar. |
| Misma receta otra vez | Sube el activo a **Nv2** (consume 2 cartas de nuevo). Tope Nv2. |
| Dos cartas iguales | Como hoy: sube el Nv de la infusión (1-3) = "versión mejorada del ataque básico". Renombrar el texto "FUSIÓN Nv" a "REFUERZO Nv" para no confundir. |
| 3.er activo | Si hay 2 activos, hay que elegir cuál reemplazar (confirmación). El reemplazado da +20 Ceniza. |
| 3 etiquetas | NO existe fusión triple. Un activo no se vuelve a fusionar con una tercera carta. Con 3 etiquetas en mano, el jugador elige qué pareja fusionar. |
| Parejas sin receta | Sangre+Hielo, Sangre+Rayo, Veneno+Acero: sin receta en v1 (la UI no las ofrece). Ver decisión 3. |
| Combos pasivos actuales | **Se desactivan los 12** (`C.combos` vacío con flag): ya se convierten 1:1 en las 12 fusiones. Si no, doble pago. |
| Resonancia / talentos del árbol / Rango de forja | Desactivados en el prototipo (`G.Tree.fx = {}`, `Loot.rm = 1`) para medir el diseño con "cuenta vacía". Guardado con otra clave de `localStorage` y otro `CACHE` en `sw.js`, para no tocar el progreso del juego real. |

## 4. Tabla de fusiones (12 = los 12 combos actuales, 1:1)

Daño tras `cardDmgMul`. DPS aprox. a Nv1. Estados: `blind` (NUEVO: pierde objetivo/no dispara a distancia; en jefes/élites no aplica, sustituido por +20 % de daño recibido).

| # | Receta | Nombre | Efecto (Nv1) | Daño | Radio / duración | CD | Nv2 | Estados | Sinergia con jefes (x1,25) |
|---|---|---|---|---|---|---|---|---|---|
| 1 | Fuego+Hielo | **Vapor** | Nube en el grupo más denso. Enemigos dentro: ciegos + lentos; ticks de daño | 6 por tick de 250 ms (24 dps) | r 90, 4 s | 14 s | r 110, 5 s, 8 por tick, cd 12 s | blind, slow 30 % | Melaria (Fuego+Hielo, ideal), Pastor F1-2 (Fuego). Karceron resiste Fuego, se usa Hielo. |
| 2 | Fuego+Rayo | **Plasma** | Rayo continuo perforante hacia el enemigo más cercano; gira 180 grados/s | 9 por tick de 120 ms (75 dps), máx. 12 objetivos por tick | largo 260, ancho 14, canaliza 2,5 s | 12 s | 3,5 s, ancho 20, 11 por tick | burn | Yarlak (Fuego y Rayo débiles), Karceron F3, Letea (Rayo x1,1). |
| 3 | Hielo+Rayo | **Tormenta de escarcha** | Zona que sigue al jugador; cada 0,5 s cae un rayo en un enemigo ralentizado (si no hay, al azar) | 18 por rayo, x1,5 si ralentizado (freeze) | r 110, 5 s | 15 s | r 130, 7 s, 24 por rayo | slow 40 %, aturde 0,5 s (no jefes) | Karceron (Hielo F1-2, Rayo F3), Letea (Rayo). |
| 4 | Veneno+Fuego | **Gas inflamable** | Lanza granada; deja nube de gas con veneno; al acabar (o si un golpe de Fuego la toca) detona | veneno +1 stack/0,5 s; detonación 45 | r 80, nube 5 s | 13 s | r 100, detonación 70, +6 por stack | poison, burn | Débil contra Karceron/Melaria (resisten Veneno/Fuego): anti-horda a propósito. |
| 5 | Veneno+Hielo | **Escarcha tóxica** | 3 esporas heladas al azar; explotan | 14 + 2 stacks | r 50 c/u | 12 s | 5 esporas, 18 de daño | slow 50 %, poison; el veneno dura +3 s en ralentizados y se propaga a 3 al morir (plague) | Letea F3 (Veneno), Melaria (solo Hielo, inmune al estado de veneno). |
| 6 | Sangre+Acero | **Sed de hierro** | 3 dagas orbitan al jugador; el ataque básico +40 % de cadencia; cada 5 golpes del básico cura 1 HP | 8 por contacto (tick 450 ms) | 6 s | 18 s | 8 s, cura máx. 10 HP por uso (Nv1: 6) | bleed | Letea F1-2 (Sangre), Pastor F3 (Acero). |
| 7 | Sangre+Fuego | **Pacto ardiente** | Pagas 12 % de tu HP actual (nunca bajas de 20 HP) y estallas en nova; durante el buff, +25 % de daño | 30 + 0,8 x HP pagado | r 120, buff 6 s | 16 s | pagas 10 %, nova 45, buff 8 s | burn, empuje | Pastor F1-2, Yarlak, Melaria. Alto riesgo en jefe (perder HP). |
| 8 | Acero+Rayo | **Imán** | Tira de los enemigos pequeños hacia ti 1,2 s (destruye flechas enemigas en el área) y descarga una cadena | 20 por salto, 3 saltos, hasta 8 objetivos | r 150, desvía proyectiles 3 s | 14 s | r 190, 5 saltos, tirón 1,8 s | stun 0,4 s al final (no jefes) | Letea/Karceron por el Rayo; ignora el tirón en jefes/élites (daño sí). Herramienta de supervivencia. |
| 9 | Fuego+Acero | **Forja** | Hacha incandescente gigante, ida y vuelta, perforante; **ignora el escudo frontal** y rompe placas de hielo | 35 por pasada | r 30, 3 s de vuelo | 11 s | 2 hachas, 45 | burn | Pastor (Fuego F1-2 y Acero F3: ideal), Coloso Escudero (rompe su escudo), Yeti (placa). |
| 10 | Hielo+Acero | **Filo gélido** | Abanico de 7 lanzas de hielo; crítico garantizado x2 contra ralentizados | 16 (x2 crit) | cono 120 grados, alcance 220 | 10 s | 12 lanzas, 20 | slow 35 % | Karceron F1-2 (Hielo). Combina con Esquirla como infusión. |
| 11 | Sangre+Veneno | **Hemotoxina** | Marca hasta 6 enemigos: sangrado + veneno x3; los marcados que mueren curan al jugador y propagan el veneno | sangrado 5 dps + veneno | 6 s, alcance 200 | 13 s | 9 marcados, cura máx. 3 HP por uso | bleed, poison | Letea (Sangre F1-2, Veneno F3: ideal). Débil contra Melaria/Karceron. |
| 12 | Veneno+Rayo | **Descarga tóxica** | Rayo global sobre los envenenados visibles: consume el veneno (8 por stack). Sin envenenados: aplica 1 stack a 5 enemigos (no daña) | 12 + 8 por stack | pantalla visible | 12 s | 12 por stack | poison (consume) | Letea F3; combina con infusión de Veneno. Requiere preparación. |

Validación de tu tabla: los 8 pares son coherentes y entran tal cual (cambios menores: Imán sin daño directo grande para ser táctico; Plasma limitado a 12 objetivos/tick). Se añaden 4 (Forja, Filo gélido, Hemotoxina, Descarga tóxica) porque son los combos pasivos actuales que de otro modo desaparecerían. Quedan sin receta 3 de las 15 parejas posibles.

### Infusiones de la mano (efecto en el ataque básico)

| Etiqueta | Infusión (por carta, escala con Nv 1-3: +20 / +35 / +50 % daño del básico) |
|---|---|
| Fuego | Quema (3 dps, 2 s); Nv3: el impacto explota (r 30). |
| Hielo | Ralentiza 25 % 1,5 s; Nv3: congela 0,5 s la primera vez. |
| Rayo | Encadena 1 salto (Nv3: 2) a -20 %. |
| Veneno | 1 stack de veneno (apila 3). |
| Sangre | 15 % de curar 1 HP al matar; Nv3: sangrado 3 s. |
| Acero | Atraviesa 1 enemigo (Nv3: 2) + 10 % de crítico. |
| Neutro/pasivas | Se mantienen solo: Corazón de lana, Pezuñas, Imán de brasas, Alforja, Reloj de arena (cd activos -6 %, tope global -25 %). Se QUITAN: Manto, Cristal, Cascabel, Bilis, Piedra de afilar (potenciaban combos/armas que ya no existen). |

El pool de cartas de ataque pasa a ~12 (2 por etiqueta: las cartas actuales pueden compartir infusión; solo cambia icono y nombre) para que el programador no tenga que rehacer las 18 armas.

## 5. Inicio de partida: 1 carta

Se usa `anchors[0]` del loadout (`anchorSlots = 1`). Sin loadout, elección inicial de 3 (hoy `['spark','shard','dart']`).

| Loadout (nombre sugerido) | Carta inicial | Infusión inicial | Recetas rápidas |
|---|---|---|---|
| Brasa | Chispa (Fuego) | quema | Vapor, Plasma, Gas, Forja, Pacto |
| Escarcha | Esquirla (Hielo) | ralentiza | Vapor, Tormenta, Escarcha tóxica, Filo |
| Plaga | Dardo (Veneno) | veneno | Gas, Escarcha tóxica, Hemotoxina, Descarga |
| Cacería | Colmillo (Sangre) | robo de vida | Sed de hierro, Pacto, Hemotoxina |
| Acero | Daga (Acero) | atraviesa | Sed de hierro, Imán, Forja, Filo |
| Rayo | Chispazo (Rayo) | encadena | Plasma, Tormenta, Imán, Descarga |

Rayo/Sangre/Acero quedan desbloqueables según el árbol actual; en el prototipo todas disponibles.

## 6. Flujo de ofertas (cambios mínimos en `cards.js`)

| Parte | Cambio |
|---|---|
| Ofrecer | Se mantienen 3 cartas, reroll, omitir, descartar y la cadencia de subidas de nivel. |
| Sesgo | `newCombos(tag)` pasa a `newRecipes(tag)`: la carta que completa una receta con la mano (y con un hueco de activo libre, o aunque no) sube su peso; se garantiza al menos 1 carta "de fusión" por oferta hasta tener 2 activos (v1) / 1 activo (v0), luego baja al 40 %. |
| Insignia | "COMBO: X" pasa a "FUSIÓN: Vapor" (dorado) y, al pasar el cursor, muestra la carta de la mano que se consumiría. |
| Elegir | Si completa receta: dos botones "FUSIONAR YA" / "A LA MANO". Si no: igual que hoy. |
| Mano llena | Menos frecuente (la fusión libera slots); reemplazar/descartar sin cambios. |
| Pantalla | Se añade en la parte inferior el panel "PODERES" con 1-2 slots (icono, nombre, Nv, CD). |
| Ritmo previsto | ~15 elecciones por run: la mano llena el 1.er minuto, 1.ª fusión ~minuto 1-2, 2.ª ~minuto 3-4, Nv2 de un activo ~minuto 6. |

## 7. UI y controles

| Elemento | Móvil | Escritorio |
|---|---|---|
| Disparo manual | Botón grande circular por activo (radio lógico 44, dentro de la zona del pulgar derecho: activo 1 en `(880,470)`, activo 2 en `(800,490)`; verificar que no choca con el control de movimiento de `mobile.js`). | Teclas `Q` (activo 1) y `E` (activo 2); clic en el icono del HUD también dispara. |
| Círculo de enfriamiento | Barrido radial sobre el icono (mismo estilo que `drawCard`) + segundos restantes; al estar listo: pulso dorado + sonido corto. | Igual, en el HUD sobre la mano. |
| Modo auto | Interruptor "AUTO" pequeño junto a los botones (toca para activar); persistente en la partida. | Tecla `F` (`R` es reroll y `Tab` está bloqueada por el navegador en `main.js`). |
| Reglas del auto | Dispara cuando está listo Y hay objetivo útil: >= 3 enemigos en el radio (Vapor, Tormenta, Imán, Gas, Filo), cualquiera en alcance (Plasma, Forja, Hemotoxina), HP < 70 % (Pacto), jefe presente (Descarga con envenenados). Nunca dispara Pacto con HP < 40 %. | Igual |
| Aviso de receta | Banner "¡FUSIÓN! Vapor" reutiliza `G.Hud.banner` y el stinger `fuse`. | Igual |
| Apuntado | Automático (al más cercano/denso). Sin puntería manual en v0-v1. | Igual |

## 8. Balance: qué quitar y qué dejar

Objetivo: DPS total similar al actual (`cardDmgMul` y calibración del bot); el reto debe seguir igual. Ajustes:

| Fuente de poder actual | En el prototipo | Motivo |
|---|---|---|
| 5 armas autónomas a Nv3 (x2,5) | Se sustituyen por 1 básico + infusiones (5 infusiones Nv3 = básico x3,5, ~50 dps) | Queda menos daño continuo |
| Activos | 2 poderes ~25-75 dps equivalentes cada uno, ciclo útil 25-40 % del tiempo | Compensan, con control (slow, blind, tirón) |
| Combos pasivos x1,5, +20 %, etc. | Fuera (sustituidos por los activos) | Evita doble bono |
| Pasivas de etiqueta, Resonancia, Rango de forja, Árbol | Fuera | Prueba con cuenta vacía |
| Reloj de arena y cd | Tope global -25 % (activos incluidos) | Evita activos casi permanentes |
| Curación (Colmillo, Pacto, Sed de hierro, Hemotoxina) | Tope por activación (3-10 HP) + `B.heal` sin cambios | El juego sigue exigiendo esquivar |
| Primera fusión gratuita | Sí, pero el activo no sube de Nv1 hasta la re-fusión | No se vuelve trivial |

Meta de calibración: con el bot, supervivencia al jefe 40-60 % (igual a la referencia de `card-swarm`), y que quitar los activos baje esa cifra notablemente (mínimo -25 puntos).

## 9. Bots (cambios mínimos)

| Bot | Cambio |
|---|---|
| `tools/card-swarm-balance-bot` | (1) Puntuación de la oferta: prioridad a cartas "FUSIÓN" mientras haya hueco de activo (+40), luego refuerzo. (2) Elegir "FUSIONAR YA". (3) Disparar cada activo cuando `slot.cd<=0` y haya >= 3 enemigos en radio (o `p.hp<60 %` para Imán/Pacto). (4) Métricas nuevas: tiempo de la 1.ª fusión, nº de usos por activo, daño por activo. Copia en `tools/card-swarm-fusion-balance-bot/`. |
| `tools/card-swarm-boss-bot` | Dispara activos al abrirse una ventana de vulnerabilidad o cuando el jefe tiene la debilidad activa; nunca en telegrafía de ataque letal. Reutiliza su esquiva sin cambios. Prueba por jefe con 2 activos fijados por URL (`?actives=plasma,forja`). |
| Parámetros de prueba | `?fusion=1` (activar), `?actives=a,b` (activos de inicio), `?fuseAsh=`, `?cmul`. |

## 10. Rendimiento

| Riesgo | Mitigación |
|---|---|
| Plasma: rayo continuo tocando muchos enemigos | Máx. 12 objetivos por tick y tick de 120 ms; reutilizar el `inRange` por cuadrícula del enjambre (110 enemigos máx.). |
| Nubes y zonas (`Combat.zone`) acumuladas | Máx. 2 zonas de activo simultáneas; ticks agrupados cada 250-500 ms. |
| Proyectiles (Filo gélido 12 lanzas, Escarcha tóxica, Forja x2) | Pool compartido con tope de proyectiles del jugador (80); si se supera, se descartan los más viejos. |
| Cadenas (Imán, Tormenta) | Un solo rayo visual por cadena y tope de 8 objetivos. |
| `HIT_CAP` 32 | Solo limita golpes enemigos; los activos NO usan `HIT_CAP`, pero cada activo tiene tope de daño por uso (aprox. 400 en una horda, jefe: tope de 1,5 % de su HP máx. por uso) para que ninguno rompa los jefes. |
| Estado `blind` y tirón | Se aplican solo a enemigos normales; jefes/élites ignoran (evita romper IA y telegrafías). |

## 11. Plan por fases

| Fase | Contenido | Tiempo estimado |
|---|---|---|
| v0 | Copia aislada; ataque básico + infusiones; 1 slot activo; 4 fusiones (Vapor, Plasma, Gas inflamable, Sed de hierro); disparo manual (botón móvil + `Q`); CD con círculo; inicio con 1 carta; primera fusión ayudada; combos pasivos desactivados. Sin auto, sin Nv2, sin bots. | 3-4 días |
| v1 | 12 fusiones; 2 slots y reemplazo; Nv2 por re-fusión; modo auto; panel "PODERES"; ajuste de bots; calibración con `?cmul`; informe de métricas. | 4-5 días |
| v2 (opcional) | Sonido/arte propios por activo, parejas sin receta, integración con la Base y el árbol si gusta. | según resultado |

Recursos para `asset-scout` / `audio-designer` (v1): iconos 32x32 de 12 poderes (o glifos procedurales en `assets`), VFX: nube, rayo continuo, zona de tormenta, granada, esporas, nova, tirón magnético, hacha, abanico de hielo, marcas, rayo global; ~12 SFX de lanzamiento (+ "listo" y "fusión" ya existen: `fuse`, `combo`), 1 sonido de botón. Prioridad v0: 4 iconos, 4 VFX y 4 SFX.

## 12. Criterios de éxito

| Métrica | Umbral "gusta" |
|---|---|
| El jugador crea al menos 1 fusión en los 3 primeros minutos | >= 80 % de las partidas |
| Usos de activos por partida (manual) | >= 20 de media; ningún activo con uso < 10 % del total |
| Variedad | Cada una de las 12 fusiones aparece en > 5 % de las partidas; ninguna > 25 % |
| Dificultad | Victoria del bot de balance dentro de ±15 puntos de la referencia del juego base |
| Sin activos | Con los activos desactivados la victoria cae >= 25 puntos (importan) |
| Rendimiento | >= 55 fps en móvil medio con horda máxima y 2 activos |
| Sensación (prueba con el dueño, 5 partidas) | "Quiero hacer una más para probar otra fusión": >= 3 de 5 partidas lo piden |

## 13. Decisiones abiertas

1. **Cartas con arma propia o solo infusión.** ¿Las cartas de la mano siguen disparando como hoy (conservador: menos riesgo, más caos de efectos) o se convierten en infusiones del básico (propuesta: lectura clara, más trabajo en `weapons.js`)? Recomendación: infusión.
2. **Fuentes de la fusión.** ¿Se consumen las dos cartas (propuesta) o solo una? Consumir ambas da más tensión, pero hace más lenta la build.
3. **Parejas sin receta (Sangre+Hielo, Sangre+Rayo, Veneno+Acero).** ¿Sin fusión, "fusión inestable" con activo genérico, o crear 3 poderes más?
4. **Subida de Nv de activos.** Re-fusión (propuesta) frente a pagar Ceniza (~60) con una carta de la etiqueta. La segunda da un uso nuevo a la Ceniza.
5. **Meta de cuenta.** ¿El prototipo parte de cuenta vacía (propuesta) o conserva árbol y Rango de forja? Con ellos, el balance es más difícil de leer.
