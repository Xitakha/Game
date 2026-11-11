# Swarm Hand (antes "Fusión": prototipo v1, balance v2)

**Este es el juego publicado en https://xitakha.github.io/Game/card-swarm/** (el dueño aprobó el prototipo Fusión y sustituyó a la versión anterior). La versión clásica (mano de 5 cartas con combos pasivos, v5.6) quedó archivada en `../card-swarm-clasico/` (no se despliega; también en la rama remota `archive/card-swarm-clasico-v5.6`; su README: `../card-swarm-clasico/README-clasico.md`). Diseño de partida: `DESIGN-fusion.md`.
Los `DESIGN-v*.md`, `GDD.md`, `MOVIL.md`, etc. de esta carpeta son heredados del clásico (llevan una nota arriba); donde hablan de combos pasivos no aplican.
Arte y audio de los 8 poderes nuevos: `src/assets_fusion2.js` y `src/sfx_fusion2.js` (contrato en `ASSETS_FUSION.md`).

## Qué es
- **Ataque básico automático** del jugador: 10 de daño cada 500 ms (v1: 650) al enemigo más cercano (alcance 440). **Volley (v2)**: +1 disparo extra (80 % de daño) a otro objetivo, prefiriendo arqueros / brujos, por cada 4 niveles de infusión sumados (cada poder activo cuenta 2 por nivel); tope +3.
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
- **Topes por uso**: 400 de daño base por objetivo y uso; contra un jefe, 3 % de su vida máxima por uso (`?bosscap=`; se mide en daño base, antes de `cmul`/`bossmul`/debilidades). Los poderes hacen x3 de daño (`?pmul`) y recargan un 40 % antes (`?pcd`).

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

## Integración con el sistema heredado (v1)
Vuelve a estar activo: **aldea** (`?direct=1` salta directo a la partida, para pruebas), **Portal** (biomas bosque, cripta, asfódelo, tundra, panal, Cráter; duración; Cacería y Práctica), **6 jefes** (Pastor, Karceron, Letea, Yarlak, Melaria, Cenizar) con sus debilidades, **minijefes**, **árbol de forja** (Grum), Rangos de forja, **Archivo** (colección, 3 loadouts), **platos** de Tía Castaña, **misiones** del Tablón / Ruta y Resonancia, todo con la cuenta propia `swarmhand.fusion.save`.
- **Anclas**: 1 slot (la carta inicial, que se conserva en la 1.ª fusión); el nodo del tronco "Segunda ancla" da el 2.º. Cuenta nueva: Chispa de ancla; cartas desbloqueadas = las iniciales (Chispa, Esquirla, Dardo, Daga, Colmillo, Reloj). Rayo se desbloquea en la forja (para Plasma, Tormenta, Imán, Descarga hace falta).
- Efectos de talentos y Rangos: el Rango de forja (+8 % de daño por rango) multiplica la infusión y el arma auxiliar de esa carta; los talentos de armas auxiliares (Nova doble, Hacha II, etc.) siguen funcionando; los de cartas proyectil se trasladan a la infusión; Resonancia (3-4 cartas de la misma etiqueta) y sus sets siguen activos (compiten con fusionar etiquetas distintas: es decisión del jugador).
- **Textos del árbol (v2)**: los talentos de Chispa / Esquirla / Dardo dicen ahora que actúan sobre la infusión del básico y los 5 sets de Resonancia avisan de que valen para básico, poderes y armas auxiliares y que fusionar gasta cartas. Doble pago revisado: los 12 combos pasivos siguen apagados (`C.active = {}`), Pacto no suma el pasivo del original; la Resonancia (+25 % por etiqueta con 3 cartas) sí multiplica poderes de esa etiqueta, pero fusionar consume cartas y suele romper el set, así que es una decisión y no un doble cobro acumulable (no se ha medido con el bot).
- **Queda abierto**: los efectos de plato / Ruta sobre "combos" no existen en el original; no se ha jugado a mano una campaña completa (aldea -> 6 jefes -> Cráter) con el nuevo sistema, solo humo con bots (ver Balance).

## v8: Carapa, la Armera (MVP del Herrero de armaduras)
Diseño: `DESIGN-v8-herrero.md` (decisiones del dueño: Carapa tras el Pastor, defensa DEF/(DEF+120) con tope global 45 %, `zoneDmg` creciente por bioma, sin PF en los costes, Marlo vestido en fase posterior, Grum casi igual, meta ~16 h). Arte `src/assets_armor.js`, audio `src/sfx_armor.js` (contratos en `ASSETS_API.md`).
- **Qué hay**: NPC Carapa y su taller en la aldea (aparece al volver de vencer al Pastor con una escena de 4 burbujas y el regalo del set Aldeano; las cuentas con el Pastor vencido la ven en la primera apertura tras actualizar), panel del taller (`src/smith.js`: EQUIPO / FABRICAR / SETS / PEDIDOS, comparación de DEF / HP / Aplomo / bonos antes de equipar, auto-equipar, doble toque = equipar, refuerzos +1..+3, Q/E o deslizar para pestañas, 1-4 slots), chip EQUIPO y "DEF X / recomendada Y" en el Portal, loadouts de Ulalume con `armor`, línea de DEF en la pausa y "Daño evitado por armadura" en el botín.
- **Piezas (12)**: 4 slots (Yelmo +HP, Peto resistencia de familia, Grebas Aplomo + ms de invulnerabilidad, Talismán Afinidad = +% de daño de la etiqueta del set) x 3 sets: Aldeano (T0, bono 2 = +4 HP), Esquila de Hierro (T1, Acero, melee; 4 piezas = Lana gruesa, cada 25 s el siguiente golpe -50 %), Carcelero de Brasa (T2, Fuego, explosiones; 4 piezas = Grilletes ardientes, pulso r70 de 20 de daño cada 6 s). Los sets de Letea, Yarlak, Melaria y Cenizar son solo datos nuevos en `src/armor_data.js`.
- **Defensa**: `DEF_total = sum(DEFbase[tier] x peso_slot x (1 + 0,15 x refuerzo))`, `RD = DEF/(DEF+K)` (K 120), `mult = max(0,55, (1-RD)(1-res familia)(1-Bastión)(1-plato))`. Esquila +1 completo = DEF 13,8 = 10,3 %. Mínimo por golpe >= 1. Topes: HP de armadura +25, Aplomo 40 %, +100 ms de invulnerabilidad, +10 % de daño por etiqueta, resistencia de familia (Peto + bono) 15 %.
- **Costes**: sin PF. Brasas + parte principal (x `TREE_PART_MUL` de la etiqueta) + secundaria + trofeo (Yelmo / Peto / Grebas) o las 2 insignias del bioma (Talismán), por tier T0 80 / T1 140 / T2 220 Brasas (Peto-unidad; Yelmo y Grebas x0,7, Talismán x0,6). Refuerzo +1 = 20 % de las Brasas y partes x0,5 y 1 trofeo; +2 = 30 %, x0,6, 1 trofeo, Rango de forja II (nodo R2 de Grum) y haber vencido al jefe en Peligro II; +3 = 40 %, x0,8, 2 trofeos, 1 Esencia, Rango III y Peligro III. Aldeano solo llega a +1.
- **Trofeos e insignias se gastan**: `trophies` / `insignias` son el saldo; `trophiesEver` / `insigniasEver` son el acumulado (Ruta de Grum, logros, Archivo y Lanudo leen de ahí).
- **Grum**: título "Herrero de armas" en su panel, 3 líneas nuevas sobre Carapa y los refuerzos +2/+3 piden Rango II/III. Nada más cambia en su árbol, PF, Ruta ni anclas.
- **Pedidos de Carapa (7) y logros (4)**: pedidos propios en la pestaña PEDIDOS (Tomar medidas, Costura doble, Mosaico, Refuerzo, Sin rasguños, Cazador de insignias, A pelo); logros Armero aficionado, Cuatro latidos, Refuerzo triple y Cordero sin lana.
- **Desvíos del diseño (honestos)**: (1) los refuerzos gastan CUALQUIER trofeo del jefe del set (no el de la pieza concreta; la fabricación sí pide el trofeo concreto): recorta el riesgo de RNG sin pity; no hay pity de trofeos; (2) las insignias pasan a ser saldo gastable (`insignias`) con `insigniasEver` acumulado, igual que los trofeos; (3) los pedidos de Carapa tienen su lista propia (no pasan por `quests.js`) y los logros son 4 en vez de 7; (4) `zoneDmg` solo está activo por defecto en Bosque y Cripta; (5) Peto / Grebas del set Aldeano (T0) usan 2 % y 3 % (el doc no da T0); (6) no hay `fx_armor_block`, botón EQUIPO en la pausa (solo la línea de DEF) ni modo "probar equipo"; (7) el retroceso de la Tundra se escala con el Aplomo después de su propio multiplicador; (8) `BRASAS_MIN` 21 no está validado con bots (el bot no mide economía).
- **Tiempo de juego**: `Save.data.stats.playMs` (ms reales con la página activa; se guarda cada 30 s) para medir las horas de verdad.
- **Guardado v10** (`swarmhand.fusion.save`; copia `swarmhand.fusion.save.v9` al migrar): `armor { owned, equipped, seen, stats, ped }`, `trophiesEver`, `insigniasEver`, `stats.playMs`, `flags.smithMet / smithGift`, `loadouts[i].armor`. Migración sin pérdida: regala el set Aldeano y, por cada jefe ya vencido (Pastor, Karceron), el Peto de su set, y equipa lo mejor.
- **Perillas por URL**: `?arm=0` (sin armadura, sin `zoneDmg` y `BRASAS_MIN` 18: simulación como antes), `?armk=120`, `?armcap=0.45`, `?zdmg=1,1.1,1.18,1.26,1.34,1.44` (valores por bioma; activa todos), `?zdmgall=1` (valores del doc en todos los biomas), `?armset=esquila:1[,carcelero:2]` o `?armtier=1&armref=1` (equipa ese set en memoria, sin tocar el guardado: para bots), `?armcost=1`, `?armhp=1`, `?armdmg=1`, `?smith=1` (Carapa desbloqueada), `?brasasmin=21`, `?give=horn:3,carnero:2` (trofeos e insignias; ids de `G.Boss.TROPHY` / `G.Minis.D`).

### Valores por defecto (v8 MVP)
| Palanca | Valor |
|---|---|
| `K` (defensa) / tope de reducción | 120 / 45 % (mult. mín. 0,55) |
| `zoneDmg` | Bosque x1,00, Cripta x1,10 (activos); Asfodelo 1,18, Tundra 1,26, Panal 1,34, Cráter 1,44 solo con `?zdmgall=1` o `?zdmg=` (aún no hay set de esos tiers) |
| `BRASAS_MIN` | 21 (antes 18; `?arm=0` o `?brasasmin=18` lo devuelven) |
| DEFbase T0 / T1 / T2 | 2 / 4 / 6 (x peso 0,7 / 1 / 0,7 / 0,6) |
| Refuerzo | +15 % de DEF y de la estadística por nivel |

### Balance v8 medido (bots, `speed=4`, `PAR=4`, n=12 por celda, cuenta vacía con `?armset=` para equipar el set en memoria)
Referencia sin armadura (`?arm=0`, idéntica bit a bit al código anterior): bosque 412 +- 38 s; la misma configuración por defecto (mismo código en la rama antigua) dio 380 +- 55 s: **el ruido entre lotes iguales es de ~+-30 s (ee 11-16)**, así que diferencias menores de ~40 s no son medibles.
| Celda (play_bot, hasta el jefe a 450 s) | Supervivencia | Daño evitado | HP perdidos/min |
|---|---|---|---|
| Bosque `?arm=0` / por defecto (sin armadura, zoneDmg 1,00) | 412 +- 38 / 380 +- 55 s | 0 % | 34 / 30 |
| Bosque Esquila +1 (DEF 13,8) | 412 +- 56 s | 20 % | 38 |
| Bosque Esquila +3 (DEF 17,4) | 436 +- 40 s | 22 % | 44 |
| Cripta `?arm=0` / sin armadura (zoneDmg 1,10) | 450 / 450 (12/12 llegan al jefe) | 0 % | 24 / 23 |
| Cripta Carcelero +1 (DEF 20,7) / +3 (DEF 26,1) | 450 / 450 | 16 % / 20 % | 24 / 24 |
| Cripta Esquila +1 (un tier menos) | 450 | 22 % | 22 |
| Pelea (boss_fight.js, mano p50 y 4 poderes, `hp0=999`) | Peligro I | Peligro III |
|---|---|---|
| Pastor `?arm=0` / Esquila +1 / Esquila +3 | 11/12, minHp 31 / 11/12, minHp 49 / 12/12, minHp 42 | 8/12, minHp 16 / 10/12, minHp 25 / 9/12, minHp 20 |
| Karceron `?arm=0` / sin armadura (x1,10) / Carcelero +1 / +3 | 10/12 / 11/12 / 11/12, minHp 51 / 12/12, minHp 52 | 8/12 / 7/12, minHp 13 / 8/12, minHp 17 / 8/12, minHp 29 (Aldeano solo: 7/12) |
Lectura honesta:
- Lo que SÍ se cumple: el daño evitado por armadura con el set del tier es del 16-22 % del bruto (objetivo 10-25 %); la vida mínima de la pelea sube (Pastor 31 -> 49, Karceron 34 -> 51 en Peligro I); con `?arm=0` la simulación es idéntica a la de antes y la cuenta vacía en el Bosque no cambia (380-412 s, mismo código).
- Lo que NO se puede confirmar con este bot: (1) el ratio de supervivencia >= 1,25 con set del tier +1 frente a sin armadura: en el Bosque la referencia ya llega a ~400 de los 450 s posibles (tope de ratio ~1,14) y en la Cripta los 12 bots llegan siempre al jefe, así que la supervivencia está saturada; (2) la caída de >= 20 puntos de victorias sin armadura del tier: `zoneDmg` x1,10 en la Cripta no mueve el win-rate (Karceron 10-11/12 en Peligro I; 8/12 -> 7/12 en Peligro III, dentro del ruido de +-3 victorias con n=12); (3) el tope de +20 puntos con +3: nunca se pasa del 100 % porque la línea base ya es 83-92 % en Peligro I; en Peligro III +1 y +3 quedan en 8-10/12 frente a 8/12. El daño medio por minuto del bot (HP perdidos) tiene demasiada dispersión para ver un +10 % de `zoneDmg` (23 frente a 24 por min).
- Por tanto los valores por defecto son los del diseño (sin retocar) y el equilibrio fino del reto (¿es `zoneDmg` 1,10 suficiente?) queda para una sesión humana en móvil; las perillas `?zdmg=`, `?armk=`, `?armcap=`, `?armdmg=` y `?armcost=` permiten ajustarlo sin recompilar. Con el bot no se midió Cripta con el set de un tier más ni Cenizar.

### Pruebas v8
`node tools/card-swarm-bot/tests.js armor` (guardado v10 y migración, panel con toques en 844x390, fabricar / equipar / reforzar, trofeos gastables con `*Ever`, fórmula de defensa y tope, `?arm=0`, `zoneDmg`, `playMs`, escena de Carapa). `all` = 218 comprobaciones, 0 errores de consola. Regresión: con Math.random sembrado y reloj sintético, 12 puntos de control de una partida (jugador quieto, recibiendo daño) son idénticos bit a bit entre el commit anterior (207bd24) y esta versión con `?arm=0`, y también con los valores por defecto en una cuenta vacía.

## Cómo probarlo
```
python3 tools/serve.py card-swarm 8811      # desde la raíz del repo -> http://localhost:8811/index.html
```
Parámetros de balance v2 (todos sin recompilar, valores por defecto entre paréntesis): `?cmul=` (3,5 daño global) `?bossmul=` (0,2 daño a jefes, encima de cmul) `?bosscap=` (0,03 tope de vida del jefe por uso de poder, en daño base) `?pmul=` (3 daño de poderes) `?pcd=` (0,6 factor de cooldown de poderes) `?pinf=` (0,25 bono del básico por nivel de poder activo) `?infmul=` (0,7 bono de las infusiones) `?bcd=` (500 ms cadencia del básico) `?bdmg=` (10) `?vstep=` (4 niveles por disparo extra; 0 = sin volley) `?vmax=` (3) `?vdmg=` (0,8) `?vpow=` (2) `?lvheal=` (0,20 cura de vida máx. al subir de nivel) `?fuseheal=` (25 PV al fusionar) `?xpfirst=` (6) `?xpmul=` (1) `?auxmul=` (0,4 daño de armas auxiliares) `?auxcd=` (1,5). Otros: `?direct=1` (sin aldea), `?all=1` (todas las cartas desbloqueadas), `?actives=vapor,plasma,forja2,hemo` (poderes de inicio; sufijo 2 = Nv2; ids: vapor plasma gas sed tormenta escarcha pacto iman forja filo hemo descarga), `?hand=spark:1,shard:1`, `?boss=pastor&nointro=1&prep=0`, `?assault=1` (Cenizar), `?god=1`, `?speed=4`, `?cmul=` (daño global), `?aux=0&auxmul=&auxcd=`, `?fuseAsh=`, `?bosscap=`, `?nosw=1`, `?reset=1`.

Pruebas y bots (Chromium de `/opt/pw-browsers`, 844x390 táctil, `tools/card-swarm-bot/`):
- `node tools/card-swarm-bot/tests.js [all|iso|flow|powers|ui|village|touch|boss|balance|armor]` (0 errores de consola en cada una; `iso` ahora comprueba PWA: manifest, caché `fusionhand-*`, precache completo, guardado `swarmhand.fusion.*`).
- `play_bot.js <n> <cmul> [sinPoderes] [base] [speed] [all] [extra]` partidas completas con 4 poderes en AUTO; `baseline_bot.js <n>` mismo bot sobre el clásico (`python3 tools/serve.py card-swarm-clasico 8812`); `boss_bot.js <n> [jefes] [sinPoderes]` pelea por jefe con 4 poderes fijados por URL.

## Balance
Ver "Balance medido" al final (números reales, ruido y límites del bot).

## Guardado y PWA (convivencia con el clásico)
- Guardado en `localStorage` `swarmhand.fusion.save`. El guardado clásico `swarmhand.save` (y sus copias `.v2`-`.v8`) NO se lee, migra ni borra: queda intacto por si se reabre el clásico.
- `sw.js`: caché `fusionhand-<hash>` (NO empieza por `swarmhand-`: el `activate` del clásico borraba las `swarmhand-*` del origen). `manifest.webmanifest`: `id`/`start_url`/`scope` `./` (mismo `id` que el clásico: quien lo tenía instalado recibe el juego nuevo como actualización de la misma app, con sus datos nuevos en blanco).
- `tools/card-swarm-pwa/stamp.py` (único; el precache sale de `index.html`). `.github/workflows/pages.yml` despliega solo `games/card-swarm` en `/card-swarm/`; `/card-swarm-fusion/` es solo una redirección (`tools/site/card-swarm-fusion-redirect.html` + `card-swarm-fusion-sw.js`, que desregistra el SW del prototipo).

## Cambios sobre el código copiado (marcados con `FUSION`)
Nuevos: `src/fusion.js`, `src/assets_fusion.js`, `src/assets_fusion2.js`, `src/sfx_fusion.js`, `src/sfx_fusion2.js`. Editados: `cards.js` (anclas, pool por desbloqueo, ofertas con receta, ventana de fusión, botón, chips de poderes, mano a la izquierda), `weapons.js` (las cartas proyectil ya no disparan; exporta orbitales / auras / FIRE para las auxiliares), `combat.js` (buff de Pacto, marca de Hemotoxina, plaga de Escarcha tóxica), `enemies.js` (`blindT`), `hud.js`, `base.js`, `main.js`, `tree.js` (anclas 1/2), `save.js`, `panels.js` / `quests.js` (textos), `pwa.js`, `sw.js`, `index.html`, `manifest.webmanifest`.

## Balance v2 (medido, bot de esquiva con recogida de gemas)
Herramientas: `play_bot.js <n> <cmul> [sinPoderes] [base] [speed] [all] [extra]` (variable `PAR=4` = 4 partidas en paralelo; **no lanzar dos lotes a la vez: la carga de CPU falsea los resultados**), `baseline_bot.js` (original, puerto 8812), `boss_fight.js` (copia adaptada del `fight.js` del original, con `dodge_fusion.js`; el original no se toca), `speed=4`, n=12-16 por celda. Cambio de método: el bot ahora recoge gemas cuando no hay peligro (como un jugador); esto no altera al original (382 +- 60, 374 +- 45, 409 +- 45 en tres lotes).

| Configuración (bosque, cuenta vacía, hasta el jefe a 450 s) | v1 (antes) | v2 (ahora) |
|---|---|---|
| Original `card-swarm` (referencia) | 374-409 s (n=12) | igual |
| Fusión con 4 poderes en AUTO | 255 +- 59 s (n=16, con gemas); 240 +- 15 sin gemas | **396 +- 55 s (n=12)**, 0 muertes <150 s (v1: 2/16) |
| Fusión SIN fusionar (infusiones + auxiliares) | 241 +- 86 (v1 sin gemas) | 423 +- 41 s (n=12) |
| 1.ª fusión | 48 s (el bot no recogía gemas) | 18 s |
| Pastor, mano normal (p50), 4 poderes | 1/4 (n pequeño) | **8/12 (67 %)** |
| Pastor, misma mano, SIN poderes | 0/3 | **1/12** |
| Pastor original (boss-bot, misma mano) | 6/8 (75 %) | igual |

Victorias del boss-bot con la mano p50 (n=8; original / Fusión v2): Pastor 6/8 / 5/8 (62 %, n=8) y 8/12; Karceron 4/8 / 7/8; Letea 4/8 / 6/8; Yarlak 6/8 / 5/8; Melaria 5/8 / 8/8; Cenizar 0/8 / 0/8. Karceron, Melaria y Letea quedan algo más fáciles que el original; sin ajuste por jefe (`bossmul` es global).

Qué se cambió y por qué (cada paso medido con el bot):
- **Causa del hueco**: el original se cura 130-300 PV por partida con los combos pasivos Pacto / Sangre envenenada, que en la Fusión pasaron a poderes activos. Ahora hay cura por nivel (20 % de vida máx.) y 25 PV por fusión (`lvheal`, `fuseheal`).
- Básico más rápido (650 -> 500 ms) y volley; recoger gemas movió la 1.ª fusión a ~18 s (garantizada en la 1.ª oferta). Con x1,0 de `xpfirst` no cambia nada: la XP la limita recoger gemas.
- Poderes: x3 daño, cooldown x0,6, y cada poder activo sube el básico un 25 % por nivel y cuenta para el volley (compensa las cartas que se consumen al fusionar). Infusiones x0,7 y auxiliares x0,4 para que no fusionar no sea superior.
- Jefes: el x3,5 global dejaba al Pastor en 28 s (original: ~120 s); `bossmul` 0,2 lo lleva a ~95 s y 62-67 % de victoria.
- Sin cambio: `cmul` 3,5, `bosscap` 3 % (no se probó 1,5 %).

Lectura honesta / desvíos:
- **En el bosque, el bot con poderes (396 +- 55) NO sobrevive más que sin ellos (423 +- 41)**: la diferencia no es medible (y es negativa). Contra jefes sí: Pastor 8/12 con poderes frente a 1/12 sin ellos. El bot solo usa el AUTO del juego (no dispara "en el momento útil"); no se ha afinado el AUTO.
- Supervivencia de la Fusión (396) dentro de ~5 % del original (~380). Ningún bot gana el bosque completo (0/12); antes de `bossmul` el bot sin poderes ganaba 5-8/12, lo que indicaba demasiado daño contra el jefe.
- Cada fusión tiene papel (control: Vapor, Tormenta, Imán, Tóxica; área: Gas, Plasma, Filo, Descarga; jefe: Forja, Plasma, Pacto; cura: Sed, Hemo, Pacto/nivel), pero no se midió cada poder aislado.
- Pruebas: `fusion_tests.js all` (incl. `balance`) 0 errores de consola; algunos tests se hicieron robustos (`bcd=60000&aux=0` para que el básico no mate a los blancos). Sin medición en móvil real ni campaña completa.

## Balance medido (v1, histórico)
Herramienta: el MISMO bot de esquiva (solo se mueve, elige cartas, AUTO para los poderes) sobre el original (`baseline_bot.js`, puerto 8812) y sobre la copia (`play_bot.js`), `speed=4`, cuenta vacía salvo indicación, 844x390. Es un bot burdo: **no llega a ganar ninguna partida ni en el original (0/8)**, así que la meta del diseño (victoria del bot 40-60 %, activos = +25 puntos) **no se puede medir con él**; se compara el tiempo de supervivencia (muerte, en s de partida; el jefe aparece a los 450 s). Media +- desviación típica (n); el error típico de la media es sd/raíz(n), es decir 12-30 s.

| Configuración | Supervivencia | Victorias |
|---|---|---|
| **Original** `card-swarm` | **377 +- 51 s** (n=8; rango 312-450; un bot llegó al jefe con el 71 % de su vida) | 0/8 |
| Fusión v1, `cmul` 3,5 (por defecto), con 4 poderes | 264 +- 34 s (n=8) | 0/8 |
| Fusión, `cmul` 5 | 251 +- 72 s (n=8) | 0/8 |
| Fusión, `cmul` 8 | 206 +- 75 s (n=6) | 0/6 |
| Fusión, `cmul` 2 | 195 +- 33 s (n=6) | 0/6 |
| Fusión, `cmul` 3,5, SIN poderes (solo infusiones + auxiliares) | 241 +- 86 s (n=8) | 0/8 |
| Fusión, `cmul` 3,5, todas las cartas desbloqueadas (`all=1`) | 250 +- 48 s (n=6) | 0/6 |

Lectura honesta:
- **El multiplicador x3,5 se mantiene**: entre 3,5 y 8 la supervivencia del bot no mejora (251 / 206: ruido, no tendencia); con x2 sí empeora (195). La supervivencia del bot la limita el cerco de enemigos, no el DPS. Con las armas auxiliares el daño total ya es mayor que en v0 (v0 no las tenía).
- La Fusión es **más difícil que el original para este bot**: ~30 % menos de supervivencia (264 frente a 377 s; diferencia de ~110 s, unos 5 errores típicos, no es ruido). Hay muertes muy tempranas (98-151 s) con cualquier configuración: el arranque con un solo ataque básico sobre el enemigo más cercano es débil hasta la 1.ª fusión (~45-55 s). Es un reto, pero no está calibrado a "igual que el original": hace falta un jugador humano o el bot de balance completo (`tools/card-swarm-balance-bot`, **no adaptado**) para afinar.
- **Los poderes aportan poco para este bot**: 264 +- 34 s con poderes frente a 241 +- 86 s sin ellos (no distinguible con n=8). Contra jefes (boss_bot, mano y 4 poderes fijados por URL, jefe a los 450 s; n=3 salvo Pastor con poderes n=4):

| Jefe | Con 4 poderes: victorias / vida del jefe al morir | Sin poderes |
|---|---|---|
| Pastor | 1/4 (muertes con el jefe al 67, 14, 30 %) | 0/3 (55, 75, 49 %) |
| Karceron | 0/2 (70, 73 %) | 0/3 (85, 74, 76 %) |
| Letea | 0/2 (81, 86 %) | sin medir |
| Yarlak | 0/2 (64, 74 %) | 0/3 (75, 81, 71 %) |
| Melaria | 0/2 (57, 70 %) | 0/3 (70, 47, 75 %) |
| Cenizar | 0/2 (95, 86 %) | sin medir |

  Los poderes quitan de media ~10 puntos de vida del jefe, con mucha dispersión; el Pastor (Forja + Plasma + Pacto, debilidades de Fuego y Acero) es el único derrotado. No se ha medido el boss-bot original (`tools/card-swarm-boss-bot`) para comparar jefe a jefe.
- Topes por uso (400 por objetivo, 3 % de la vida del jefe) sin cambios: con el tope al 3 %, un poder da como máximo ~730 de daño por uso a un jefe de ~24.000 PV; no se han probado 1,5 %.
- Rendimiento: humo en Chromium de escritorio con horda de 100 enemigos, 4 poderes en AUTO y mano completa: ~58 fps, frame máximo 41 ms, 0 errores. Sin medición en móvil real.
