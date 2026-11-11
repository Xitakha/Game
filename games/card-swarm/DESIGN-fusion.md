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
| `tools/card-swarm-clasico-balance-bot` | (1) Puntuación de la oferta: prioridad a cartas "FUSIÓN" mientras haya hueco de activo (+40), luego refuerzo. (2) Elegir "FUSIONAR YA". (3) Disparar cada activo cuando `slot.cd<=0` y haya >= 3 enemigos en radio (o `p.hp<60 %` para Imán/Pacto). (4) Métricas nuevas: tiempo de la 1.ª fusión, nº de usos por activo, daño por activo. Copia en `tools/card-swarm-fusion-balance-bot/`. |
| `tools/card-swarm-clasico-boss-bot` | Dispara activos al abrirse una ventana de vulnerabilidad o cuando el jefe tiene la debilidad activa; nunca en telegrafía de ataque letal. Reutiliza su esquiva sin cambios. Prueba por jefe con 2 activos fijados por URL (`?actives=plasma,forja`). |
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

## 14. Fusiones 13-15 (las 3 parejas que faltaban)

Cierra la decisión abierta nº 3 con la opción "crear 3 poderes más": pasan a ser 15 recetas = las 15 parejas posibles (6 etiquetas). Mismas reglas de la sección 3 (se consumen las dos cartas, Nv2 por re-fusión, 4 slots, sin fusión triple). Cifras = base ANTES de `?pmul` (x3 por defecto) y `?pcd` (x0,6), igual que la tabla de la sección 4; el `cd` se guarda en la receta como los demás (`lv:[{...cd}]`).

Hueco de diseño que rellenan (los 12 actuales son casi todos "daño + estado" sobre enemigos): **defensa activa (escudo)**, **movimiento activo (embestida)** y **debilitar a un objetivo (vulnerabilidad)**. Ninguno repite el `kind` de los 12 (`cloud beam gas orbit storm spores pact magnet axe fan mark discharge`).

### 14.1 Tabla

| # | Receta (`RKEY`) | Nombre / id | `kind` | Fantasía | Nv1 | Nv2 | CD base |
|---|---|---|---|---|---|---|---|
| 13 | `blood+ice` (a:'blood', b:'ice') | **Cristal de sangre** / `cristal` | `ward` | La sangre se cuaja en una coraza de cristal carmesí que te rodea; al romperse, estalla en esquirlas heladas. | Escudo 30 PV, 6 s. Los enemigos que te tocan sufren slow 30 %. Al romperse o caducar: onda r 100, daño 20 + 1,5 x PV absorbidos, slow 50 % 2 s y aturde 0,6 s (no jefes). | Escudo 45, 8 s, onda r 120, daño 30 + 1,5 x absorbido. | 17 s |
| 14 | `blood+lightning` (a:'blood', b:'lightning') | **Zancada carmesí** / `zancada` | `dash` | Un latido eléctrico te lanza en línea recta, sangre y chispas tras de ti. | Embestida de 180 px hacia donde te mueves (si estás quieto, hacia el enemigo más cercano; si no hay, no se lanza). Invulnerable 0,25 s. Daño 24 a hasta 10 enemigos del trayecto + 1 salto de rayo (-20 %). Estela eléctrica 2,5 s (ancho 30, 8 de daño por tick de 400 ms, aturde 0,3 s a no jefes). Cura 1 PV por enemigo normal golpeado (máx. 4 por uso). | Distancia 240 y **2 cargas** (la 2.ª en 2,5 s sin coste extra). Daño 30, cura máx. 6. | 15 s |
| 15 | `poison+steel` (a:'poison', b:'steel') | **Virote corrosivo** / `virote` | `bolt` | Un virote pesado de ballesta con punta envenenada que oxida la armadura del enemigo. | Dispara al enemigo de más vida en alcance 440 (prioridad jefe/élite). Atraviesa hasta 3 en línea (largo 300): 55 de daño al 1.º, -20 % por cada siguiente. Aplica 2 stacks de veneno y **Corrosión**: el objetivo recibe +20 % de daño de TODAS tus fuentes 6 s (jefes/élites: +10 %, dentro del tope x1,25). El veneno de los atravesados se propaga a 2 vecinos (r 60). | 5 atravesados, 80 de daño, Corrosión 8 s y +25 % (jefes +12 %). | 12 s |

Reglas de detalle:

- **Cristal de sangre**: el escudo es `p.shield` (el mismo del set Sangre 4+ / Reina). Se aplica DESPUÉS de la Defensa (`Armor.reduce`) y antes de bajar PV. Tope temporal 45 (el tope 20 del set no lo recorta); al terminar se retira solo lo que quede del escudo del poder, no el del set. Recastear con el escudo activo está bloqueado (`s.st` activo). El daño de la onda cuenta el escudo REALMENTE absorbido (tope 45 -> máx. 87 de daño base antes de `pmul`). Jefes: sin aturdimiento ni slow doble; tope por uso `bossCap`.
- **Zancada carmesí**: respeta paredes y límites del mapa (se corta en la colisión). Invulnerabilidad = `p.hurtT = 250` (no toca la Defensa). No se puede lanzar durante telegrafía letal del jefe en modo auto. La estela es un `field` (cuenta en `maxFields` = 4 y en el tope de 2 zonas de activo). Daño de la embestida y de la estela: etiqueta dinámica `pickTag(['blood','lightning'])`.
- **Virote corrosivo**: Corrosión = nuevo estado `e.corrodeT` / `e.corrodeMul`, aplicado como factor final en `hitE` y en `F.basicHit` (el básico y las infusiones también se benefician). No se acumula (se refresca la duración). En jefes el factor se suma a la debilidad y el total sigue topado en x1,25 (por eso su uso estrella son las fases SIN debilidad activa). No aplica veneno a inmunes (Melaria) pero sí Corrosión. No rompe escudos frontales ni placas (eso es de Forja).

### 14.2 Cómo se diferencian de los 12 existentes

| Nuevo | Parecidos | Por qué no duplica |
|---|---|---|
| Cristal | Pacto (paga PV y buff), Sed (cura), Imán (supervivencia) | Único poder que da **escudo** y que convierte el daño recibido en daño infligido; no cura ni sube daño. Imán desvía/tira; Cristal absorbe. |
| Zancada | Imán (supervivencia), Forja (línea) | Único poder que **mueve al jugador** (reposicionamiento + i-frames). Forja es un proyectil; Zancada es el propio jugador. |
| Virote | Forja (perfora), Hemotoxina (marca), Descarga (consume veneno) | Daño directo secundario; su valor es la **vulnerabilidad global** que potencia a los otros poderes y al básico. No es DoT ni marca de curación y no consume stacks. |

### 14.3 Balance (mismo criterio que la sección 8)

| Poder | DPS efectivo orientativo (Nv1, con `pmul` 3) | Ciclo útil (cd x `pcd` 0,6) | Riesgo / contrapeso |
|---|---|---|---|
| Cristal | Onda ~(20+45) x 3 = ~195 al romper (peor caso con escudo lleno) | 17 s x 0,6 = ~10 s, escudo 6 s (60 % de uptime si se usa al llegar el golpe) | Defensivo: 30 PV son 30 % de la vida base; no se acumula con otro escudo. Sin objetivo cercano no suma daño. Con el ciclo de 10 s sobreescala si hay Reloj de arena: respetar tope -25 %. |
| Zancada | 24 x 3 = 72 por enemigo en línea; hasta ~720 en horda densa + estela ~60 dps | 15 s x 0,6 = 9 s | Daño alto solo en pasillos de horda; la cura (4 PV) está topada. Con 2 cargas (Nv2) no puede lanzarse sin cooldown por defecto. |
| Virote | 55 x 3 = 165 al 1.º; el valor real es +20 % durante 6 s | 12 s x 0,6 = 7,2 s (Corrosión ~83 % de uptime en un único objetivo, jefe: ~+10 %) | Poco daño propio; si se apilan Virote + Plasma + Hemo en un jefe el tope x1,25 lo contiene. Perilla de pruebas: `?corr=<f>` (defecto 1) escala el % de Corrosión. |

Meta: con `?actives=cristal,zancada,virote` el bot de balance no debe superar +10 puntos de victoria sobre una mano de 3 poderes existentes (Vapor, Plasma, Forja). Los tres suben el uso de `F.stats.uses` pero `F.stats.dmg` de Cristal/Zancada/Virote se espera MENOR que el de Plasma/Forja (son de utilidad); es correcto. Cada uno mantiene el tope por uso (`perTargetCap` 400, `bossCap` 3 %).

### 14.4 Interacción con debilidades por tag y sets

| Jefe | Cristal (blood+ice) | Zancada (blood+lightning) | Virote (poison+steel) |
|---|---|---|---|
| Letea (Sangre F1-2 x1,25, Rayo x1,1, Hielo x0,8; F3 Veneno x1,25) | Sangre x1,25 | Sangre x1,25 (F1-2) | Veneno x1,25 (F3); Acero neutral en F1-2 |
| Karceron (Hielo F1-2 / Rayo F3 x1,25; resiste Fuego y Veneno) | Hielo x1,25 (F1-2) | Rayo x1,25 (F3) | Veneno x0,5: usa Acero (neutral); su Corrosión es útil aquí |
| Melaria (Fuego/Hielo; Veneno inmune, Rayo x0,8) | Hielo x1,25 (F2-3) | Sangre neutral | Acero neutral; sin veneno; Corrosión funciona |
| Yarlak (Fuego/Rayo; resiste Hielo x0,6) | Sangre neutral (evita el Hielo) | Rayo x1,25 (F3-4) | Acero neutral; Veneno x0,8 |
| Pastor (Fuego F1-2, Acero F3) | Neutral | Neutral | Acero x1,25 (F3) |

(`pickTag` elige siempre la mejor de las dos etiquetas, así que ninguno es peor que su mitad. Revisar Cenizar: su tabla cambia por fase.)

Sets: Sangre 4+ (+10 escudo cada 3 muertes) convive con Cristal (escudo en `p.shield`); Hielo 4+ (Cripta, ralentizado <15 % muere congelado) sinergia con el slow de Cristal; Veneno 4+ (Epidemia) sinergia con la propagación de Virote. Defensa: Zancada no pasa por `Armor.reduce` (i-frames) y Cristal sí se resta después de ella, de modo que el tope de reducción global 45 % no se rompe. Set Acero 4+ (Filo eterno) no afecta (los poderes no critican).

### 14.5 Cambios de código previstos en `fusion.js` (informativo, no se escriben aquí)

- 3 entradas nuevas en `F.recipes` (`id`, `name`, `short`: 'Cristal', 'Zancada', 'Virote'; `a/b/color/kind/sfx/desc/lv[2]`); `RKEY` y `C.combos` se rellenan solos.
- `CAST.ward / CAST.dash / CAST.bolt`; el estado de `ward` y `dash` vive en `slot.st` (como `beam`/`orbit`); la estela de `dash` como `field`.
- `autoOK`: `ward` -> HP < 70 % y >= 2 enemigos a 120 px, o jefe presente con ataque inminente; `dash` -> HP < 50 % y >= 3 enemigos a 120 px (escape) o >= 5 enemigos alineados; `bolt` -> jefe/élite en alcance, o >= 2 enemigos si no hay jefe.
- `fire()`: añadir `'cristal','zancada','virote'` a la lista de `addFx cast`. `?actives=cristal,zancada2,virote` ya funciona con el parser actual (`[a-z]+?` con sufijo 2).
- `F.endText`, `snapshot`, botones, chips, `drawHud`: sin cambios (usan `RBY`).
- Pool de ofertas: las 3 parejas pasan a ofrecer "FUSIÓN" (ya no hay parejas sin receta; quitar la fila "Parejas sin receta" de la sección 3).
- Bots: `?actives=` acepta los ids nuevos; el boss-bot dispara Virote al abrirse una ventana de vulnerabilidad y Cristal antes de un ataque telegrafiado, nunca Zancada durante telegrafía letal.

### 14.6 Contrato para arte (`asset-scout`, vía `assets_fusion*.js`) 

Procedural por código, sin imágenes (misma convención que `assets_fusion2.js`: `save/restore`, tragar errores, `G.time` para animar, `G.fg` para calidad plana, 0 asignaciones por frame). Entregar como `src/assets_fusion3.js`, cargado DESPUÉS de `assets_fusion2.js`, que extiende `G.FusionArt2` y envuelve `G.FusionArt.icon` igual que `assets_fusion2.js` (conjunto `NEW` ampliado). Actualizar `ASSETS_FUSION.md`.

| Función (en `G.FusionArt2`) | Tamaño / duración | Descripción |
|---|---|---|
| `icon(c,'cristal',x,y,s)` | s = 11 (HUD), 22 (oferta), 0,55 x radio del botón (38) | Gota de sangre dentro de un cristal hexagonal azul hielo con aristas blancas; brillo suave aditivo. Colores: `#d02048` + `#6ac8ff` sobre contorno `#0c0814`. |
| `icon(c,'zancada',x,y,s)` | igual | Silueta en carrera con estela en zigzag (rayo) rojo y amarillo `#ffe45a`; 2 gotas de sangre saliendo. |
| `icon(c,'virote',x,y,s)` | igual | Virote de ballesta horizontal con punta metálica `#c8d0e0` y 2 gotas verdes `#7be34a` que gotean y corroen (puntitos). |
| `ward(c,x,y,r,t,alpha,u)` | r 56 (Nv1) / 66 (Nv2); `u` = fracción de escudo restante 0..1 | VFX en bucle alrededor del jugador: 6-8 esquirlas de cristal carmesí-azul en órbita lenta; se agrietan al bajar `u`; parpadeo en el último segundo. Se dibuja en `drawAir` mientras `s.st` esté activo. |
| `shatter(c,x,y,r,u)` | r 100 / 120, ~450 ms | Onda: anillo de esquirlas que salen disparadas (`kind` nuevo de `nova`: llamar `nova(c,x,y,r,u,'shatter')`). Rojo oscuro -> azul hielo. Va en `drawGround`. |
| `trail(c,x0,y0,x1,y1,u)` | largo 180/240, ancho 30, ~2,5 s, `u` 0..1 | Estela de la Zancada: línea con chispas amarillas y gotas rojas que se desvanece; reutilizar `zig` y `bolt` internos. Va en `drawGround` (como campo). |
| `dashGhost(c,x,y,ang,u)` | ~250 ms | 3 postimágenes rojas del jugador desvaneciéndose a lo largo de la embestida (`addFx` kind `dash`). |
| `virote(c,x,y,ang,u)` | 40 x 8 px, vuelo ~180 ms | Proyectil del Virote con halo verde; rastro corto. Impacto con `impact(c,'virote',x,y,u,14)` (chispas verdes y grises, ~200 ms). |
| `status(c,'corrode',x,y,s,t)` | s = radio del enemigo; bucle | Marca de Corrosión sobre el enemigo: 3 gotas verdes que goteando y una línea punteada naranja-oxido bajo el sprite. Estado nuevo (`G.FusionArt2.states` +`corrode`). |
| `cast(c,id,x,y,u)` e `impact(c,id,...)` | ~0,3 s / ~0,2 s | Añadir los 3 ids con su color (`cristal` `#d86a98`, `zancada` `#ff6a7a`, `virote` `#9ad05a`). |
| `btn(c,id,...)` | radio 38 (`BTN`) | Sin cambios de API: solo necesita que `icon` conozca los 3 ids. |

Entradas de datos: ampliar `COL` con `cristal`, `zancada`, `virote` (mismos colores) y `ids` (15 en total). Las capas siguen el orden actual: suelo (`shatter`, `trail`) y aire (`ward`, `dashGhost`, `virote`, `status`).

### 14.7 Contrato para audio (`audio-designer`, vía `sfx_fusion*.js`)

Convención de `sfx_fusion2.js`: funciones `V.fx_<id>[_tipo](p)` con `tone`/`hiss` de `G.Snd` y `p` = factor de tono. Entregar como `src/sfx_fusion3.js`, cargado DESPUÉS de `sfx_fusion2.js`; añadir los ids a `S.fx2names` (regex) y a `ROOT` para `_ready` y `_fuse` (tonos propios, sin chocar con los existentes: `cristal` 1,26, `zancada` 0,95, `virote` 0,67; ya usados 0,7-1,19).

| Id de sonido | Cuándo | Duración | Descripción |
|---|---|---|---|
| `fx_cristal` | Lanzar | ~0,4 s | Tintineo de vidrio ascendente (triangle 1600 -> 2400 Hz) + gota grave (sine 90 -> 60 Hz) + brillo `hiss highpass`. |
| `fx_cristal_hit` | Romperse (onda) | ~0,35 s | Estallido de cristal: ruido `highpass` 6000 -> 3000 + notas dispersas cortas + golpe grave sordo. |
| `fx_cristal_zone` | Bucle mientras dura el escudo (cada ~450 ms) | ~0,3 s | Zumbido cristalino muy suave (sine ~2800 Hz, vol 0,02) + latido grave (sine 70 Hz, doble pulso). |
| `fx_cristal_ready` / `_fuse` | Cooldown listo / fusión | ~0,3 / ~0,9 s | Generados por el bucle `ROOT` (k = 1,26). |
| `fx_zancada` | Embestida | ~0,3 s | Latigazo: `hiss bandpass` 1500 -> 4000 + chasquido eléctrico (sawtooth 1800 -> 90) + golpe sordo de sangre (sine 110 -> 55). |
| `fx_zancada_hit` | Cada enemigo golpeado (throttle 90 ms en código) | ~0,1 s | Chispa corta + impacto carnoso (`lowpass` 600). |
| `fx_zancada_zone` | Estela, bucle cada ~450 ms | ~0,25 s | Crepitar (square 800/1100 Hz, vol 0,025) + `hiss highpass` suave. |
| `fx_zancada_ready` / `_fuse` | idem | idem | `ROOT` k = 0,95. |
| `fx_virote` | Disparo | ~0,35 s | Cuerda de ballesta (tone triangle 300 -> 120 Hz, 0,1 s) + silbido de virote (`hiss bandpass` 2500 -> 900) + toc metálico grave. |
| `fx_virote_hit` | Impacto + Corrosión | ~0,25 s | Clang metálico (triangle 900 -> 400) + siseo ácido (`hiss lowpass` 1400 -> 300) que continúa unas décimas. |
| `fx_virote_zone` | No se usa (no hay campo); definir vacío o como alias de `_hit` bajo volumen por si el programador lo llama | - | - |
| `fx_virote_ready` / `_fuse` | idem | idem | `ROOT` k = 0,67. |

Genéricos: reutilizar `fx_btn_ready`, `fx_btn_cancel` ("sin objetivo"), `fx_replace`, `fx_fusion` y el stinger `fuse`. Volumen: Cristal y Zancada por debajo de Pacto/Plasma (0,22 máx.); Virote ~0,15 el disparo; nada por encima de 0,28 para no tapar la música ni los avisos de telegrafía de jefes.

### 14.8 Recursos para `asset-scout` y `audio-designer` (lista)

- Arte (3 iconos 32x32 vectoriales por código: `cristal`, `zancada`, `virote`; 5 VFX: `ward`, `shatter`, `trail`/`dashGhost`, `virote` en vuelo + impacto, estado `corrode`). Si el scout encuentra hojas de sprites, usar solo como referencia de estilo; el contrato manda el procedural (paleta de `COL`).
- Audio (9 SFX nuevos: `fx_cristal`, `_hit`, `_zone`; `fx_zancada`, `_hit`, `_zone`; `fx_virote`, `_hit`; más 3 `_ready` y 3 `_fuse` por el bucle `ROOT`). Prioridad si hay poco tiempo: lanzamiento y `_hit` de cada uno (6).

### 14.9 Criterios de éxito adicionales

| Métrica | Umbral |
|---|---|
| Aparición de las 3 nuevas | Cada una entre 5 % y 25 % de las partidas (como las 12) |
| Uso por partida | >= 10 usos manuales de media por poder fusionado; ninguno < 10 % del total |
| Cristal | Absorbe >= 15 PV por uso de media (si no, es decorativo) |
| Zancada | >= 1 de cada 3 usos con >= 2 enemigos golpeados; sin muertes del jugador por quedarse "atrapado" tras la embestida |
| Virote | Sube el daño total del resto de poderes y del básico >= 8 % medido en jefes; no más de +10 % de victoria del bot (ver 14.3) |
| Rendimiento | Sin caída bajo 55 fps con Zancada (estela) + 1 nube + Plasma activos |
