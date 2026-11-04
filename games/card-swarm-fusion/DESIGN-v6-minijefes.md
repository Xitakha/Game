# Swarm Hand - Diseño v6: Minijefes por bioma (fase P4.5)

Estado: DISEÑO para implementar, sin código. Amplía `DESIGN-v4-jefes.md` (reglas de jefe, regla de esquiva, HIT_CAP) y `DESIGN-v5-biomas.md` (familias, tabla de materiales A.8, Tundra y Panal). Estado real del código leído para este documento: `src/enemies.js` (`ai_bulwark`, `ai_hive`, `E.VARIANTS`, `E.minis`), `enemies_tundra.js`, `families.js`, `waves.js` (`spawnElite`, `W.MINI_LAST`), `main.js` (`G.B.enemy.mini_*`, `G.B.mini`), `loot.js` (`L.GUARANTEED`, `L.MINI_PART_BONUS`, `L.DUR`), `tree.js` (`T.onElite`), `combat.js` (`shieldHit`/`sacHit`), `boss.js` (`drawGuardBar`), `assets_enemies2.js`, `assets_fam3.js`, `README.md` ("Minijefes v5", "Guardianes", P0-P4).

Todas las cifras son punto de partida y se afinan con el bot (`tools/card-swarm-balance-bot/`). Unidades: ms, px de juego, px/s; el jugador va a 190 px/s y tiene 100 HP; sprites como `base -> final (x2)`; tiempos de run en escala virtual de 9:00 (`G.vt()`) salvo que se diga "real".

---

## 0. Decisión del dueño y lo que el código nos obliga a tener en cuenta

**Decisión (fase P4.5):** 2 minijefes por bioma, con identidad propia y sin repetirse entre biomas: el primero a 3:30 (presión, de cerca) y el segundo a 5:30 (control, te obliga a moverte). Panal = solo reserva.

**Cinco hallazgos en el código que condicionan el diseño:**
1. Hoy hay solo **dos tipos** de guardián (`mini_bulwark` 3:30 y `mini_hive` 5:30) y el bioma los viste con `e.variant` (`warden`, `wraith`, `yeti`, `ventisquero`). Situación actual: Bosque = Coloso + Madre Colmena; Cripta = Centinela + Madre Colmena sin variante; Asfódelo = Coloso (con 2 Almas) + Plañidera; Tundra = Yeti Centinela + Ventisquero.
2. **El Centinela de Brasa y la Plañidera Anegada NO tienen sprite propio**: son el Coloso y la Madre Colmena teñidos (`E.VARIANTS.tint`). Solo el Yeti y el Ventisquero tienen sprite (`enemy_mini_yeti`, `enemy_mini_ventisquero`, 32x32 -> 64x64, `assets_fam3.js`). Por eso en este documento "PULIDO" para Centinela y Plañidera significa **sprite propio derivado + ataques nuevos** (con un plan mínimo de reserva, ver 7.2).
3. Los medidores de parte actuales son asimétricos: el **Escudo** del Coloso gasta daño frontal bloqueado (30 % del HP máx.) y el **Saco** de la Colmena gasta el 40 % de TODO el daño recibido (28 % del HP máx.), por lo que el Saco solo se rompe tras ~70 % del HP en daño. Aquí cada parte declara `meter` (cuánto aguanta) y `share` (qué fracción del daño recibido lo gasta) para que se rompa entre el 45 % y el 65 % de la pelea.
4. Los élites **no escalan por minuto** (`E.spawn`: `hp = d.hp x guardHp`, `dmg = d.dmg`), así que los números de daño de este documento son **finales**. `guardHp` de `L.DUR` = 1,00 / 1,00 / 1,25 (Rápida / Normal / Larga).
5. Botín, PF y encargos cuelgan de la **clave de tipo** (`L.GUARANTEED[mini_bulwark]`, `L.MINI_PART_BONUS`, `S.elites[type]`, `quests 'colossus'/'hive'`). Con 8 tipos nuevos hay que migrarlos a **slot** (1 = 3:30, 2 = 5:30) para no regalar 8 PF "de primer élite" (ver 6.3).

**Decisiones de diseño tomadas aquí (todas son datos reversibles, sin preguntas al dueño):**
- El orden dentro de cada bioma es fijo por rol (slot 1 = presión, slot 2 = control), no aleatorio: aprendizaje progresivo y balance medible.
- Hidra Joven es slot 1 (presión, 3:30) y Plañidera slot 2 (control, 5:30); el Centinela de Brasa pasa del slot 1 actual al slot 2 y el Alcaide ocupa el slot 1 de la Cripta.
- Trofeo menor = **Insignia** (coleccionable cosmético, no cuenta como Esencia); 8/8 Insignias dan 1 Esencia una sola vez (logro). Sin impacto en la economía de Esencias.
- El Panal queda reservado: el diseño de B.6 ("Guardia Real" + "Reina Joven") se sustituye por **Avispón Real + Reina Joven** por decisión del dueño.

---

## 1. Tabla resumen (bioma x minuto x minijefe)

Entrada en escala virtual; real = virtual x (duración / 9 min). Ejemplo de real: Rápida 7 min -> 2:43 y 4:17; Normal 9 min -> 3:30 y 5:30; Larga 10 min -> 3:53 y 6:07. Jefe final a 5:50 / 7:30 / 8:20; `MINI_LAST` = 45 s reales antes (5:05 / 6:45 / 7:35), así que el slot 2 siempre cabe si el slot 1 cae antes de ~1 min tras su entrada.

| Bioma (jefe) | Slot 1: 3:30 virtual (presión) | Slot 2: 5:30 virtual (control) | Estado |
|---|---|---|---|
| Bosque (Pastor) | **Carnero Mayor** (NUEVO) | **Tejedora de Zarzas** (NUEVO) | Implementar |
| Cripta (Karceron) | **Alcaide de Hierro** (REDISEÑO del Coloso) | **Centinela de Brasa** (PULIDO+, pasa de 3:30 a 5:30) | Implementar |
| Asfódelo (Letea) | **Hidra Joven** (NUEVO) | **Plañidera Anegada** (PULIDO+) | Implementar |
| Tundra (Yarlak) | **Yeti Mayor** (PULIDO, mejora de `mini_yeti`) | **Ventisquero** (PULIDO) | Implementar |
| Panal (Melaria) | **Avispón Real** (reserva) | **Reina Joven** (Madre Colmena movida, reserva) | Solo reserva (P5/P6) |

Resumen de ficha (HP base Normal 9 min; Larga x1,25; TTK objetivo con la build de referencia 40-70 s):

| Minijefe | Rol | HP | Vel (enrage) px/s | `r` | Parte rompible (meter / share) | Debilidad principal | Parte exclusiva del bioma |
|---|---|---|---|---|---|---|---|
| Carnero Mayor | Presión | 2500 | 48 (62) | 26 | Cuernos (600 / 0,45; 1,0 mientras está aturdido) | Fuego (lana) | Jirón estático x3 |
| Tejedora de Zarzas | Control | 3000 | 34 (42) | 24 | Raíz madre (660 / 0,40) | Fuego (vegetal) | Polvo de escarcha x3 |
| Alcaide de Hierro | Presión | 2600 | 44 (59) | 24 | Escudo-reja (780 de daño frontal bloqueado) | Rayo (metal) | Púa de erizo x3 |
| Centinela de Brasa | Control | 2900 | 40 (52) | 24 | Núcleo de brasa (580 / x2,0 solo en ventana) | Hielo (magma) | Polvo de escarcha x3 |
| Hidra Joven | Presión | 2400 | 52 (68) | 24 (cabeza 14) | Cabeza (600 / golpes a la cabeza; rebrota) | Fuego, Rayo, Veneno | Placa de pavés x3 |
| Plañidera Anegada | Control | 3000 | 38 (46) | 24 | Velo (840 / 0,55) | Rayo (espectro) | Jirón estático x3 |
| Yeti Mayor | Presión | 2500 | 46 (62) | 28 | Placa de hielo (750; frontal o Fuego) | Fuego, Sangre | Mecha chamuscada x3 |
| Ventisquero | Control | 2800 | 38 (46) | 24 | Corazón de hielo (784 / 0,55) | Fuego, Acero | Púa de erizo x3 |

---

## 2. Reglas comunes a los 8 (y a los 2 de reserva)

### 2.1 Aparición, orden y límites
- **Entrada:** slot 1 a `vt >= 210 000 ms`, slot 2 a `vt >= 330 000 ms` (los mismos `at` de hoy; escalan con `G.vt()` según Rápida/Normal/Larga).
- **Nunca dos a la vez:** el slot 2 no entra mientras el slot 1 siga vivo, y espera además 10 s reales desde su muerte (para que el banner, la cura y la recogida de botín no se solapen).
- **Nunca cerca del jefe final:** `W.MINI_LAST` = 45 s reales; un minijefe pendiente a `runT >= BOSS_T - 45 000` se **omite** (no se pierde nada: simplemente no sale ese slot). Al aparecer el jefe final, el minijefe vivo desaparece en silencio (`kill(e, true)`), como hoy.
- **Encargo activo de tipo minijefe:** adelanta el slot objetivo a `min(at, 150 000)` (2:30 virtual, `Quests.EARLY`), pero el slot 2 sigue sin poder entrar antes que el slot 1.
- **Sin Peligro:** los minijefes no escalan con Peligro I-V (solo el jefe final). Cacería/práctica no los generan (no hay hordas).
- **Rápida (7 min):** `guardHp` 1,00 y mismas telegrafías (son tiempos fijos); si el TTK de Rápida sale > 70 s, bajar `guardHp[7]` a 0,92. **Larga (10 min):** `guardHp` 1,25; si el TTK p50 > 70 s, bajar a 1,15.

### 2.2 Presupuesto de HP y duración de la pelea
Medido en v5: el bot (mano p50, build "a medias") mata 2200 HP en 44 s a 3:30 (Σ nivel de cartas 8) y 2800 HP en 57 s a 5:30 (Σ 12), es decir **DPS efectivo ~50 y ~49**. Fórmula: `HP = DPS_ef x T_objetivo`, con DPS_ef(3:30) = 46 y DPS_ef(5:30) = 56 (descontando el 15 % de esquiva/reposicionamiento) y `T_objetivo` = 55 s. Se ajusta por rol: los de presión tienen más exposición (ventanas cortas y frecuentes), los de control menos (se alejan, absorben con la parte). Rango base permitido 2200-3200; el reparto de la tabla 1 sale de aquí.

### 2.3 Telegrafía y regla de esquiva
- Toda telegrafía **>= 400 ms**; `tele >= 250 + 1000 x salida_px / 190`; ataques de **>= 25 de daño nunca bajan de 800 ms**.
- **Tundra:** `tele >= 250 + 220 + 1000 x salida / 190` (la inercia del hielo, `tau` 220 ms) y el último 30 % de la telegrafía fija el contorno (en el resto, el último 25 %). Se auditan con `G.B.tele` (`ice:true`).
- **Daño máximo por golpe: `HIT_CAP` = 32** (el mismo de `boss.js`); los ataques normales de minijefe pasan de 28.
- Segunda telegrafía en enrage (dobles): nunca por debajo de la regla del ataque; las que ya muestran el círculo final desde el primer aviso (ondas de choque) lo conservan en pantalla todo el ataque.
- Colores (v2/v4): rojo = daño directo; naranja con borde amarillo = lava/fuego persistente; verde ácido `#7be34a` = zona persistente; turquesa `#7fffe0` = olvido (`cdSlow`); azul hielo = ralentiza/Frío; morado = invocación; **verde pálido `#b8ff9a` con cruz = curación enemiga** (mismo lenguaje que el Polinizador del Panal); dorado/blanco = ventana de daño.

### 2.4 Estructura de ataques: 2 propios + 1 firma
Cada minijefe tiene **2 ataques propios** (identidad de combate) y **1 ataque "firma"** que **anticipa una mecánica del jefe final de su bioma**; la firma se marca con doble contorno (como los ataques firma de v4) y su telegrafía es la más larga. El motor sigue la bolsa barajada sin repetir el último (`shuffleBag`, `bulwarkNext`); cada ataque tiene un `cd` mínimo y una condición de distancia (como `bulwarkOk`). Hay ataques extra que no cuentan como "propio/firma": el **enrage** (2.6) y el modo degradado tras romper la parte.

| Minijefe | Propio 1 | Propio 2 | Firma (anticipa) |
|---|---|---|---|
| Carnero Mayor | Cornada rastrera | Balido del rebaño | Embestida de cuernos (Embestida del carnero / Estampida del Pastor) |
| Tejedora de Zarzas | Raíces reptantes | Floración (cura con vainas) | Maraña de espinas (Esporas del Rebaño del Pastor) |
| Alcaide de Hierro | Golpe de reja | Llavero giratorio | Barrido de grilletes (Barrido de grilletes / Martillazo de Karceron) |
| Centinela de Brasa | Arremetida de brasa | Abanico de magma | Erupción del núcleo (Erupción del núcleo / Aliento de magma de Karceron) |
| Hidra Joven | Mordisco en picado | Escupitajo ácido | Sumersión (Sumersión de Letea; y rebrote/cauterización = su parte) |
| Plañidera Anegada | Lluvia de almas | Marea del olvido | Coro de plañideras (Plañideras / Coro del Olvido de Letea) |
| Yeti Mayor | Empellón helado | Pisotón de escarcha | Embestida con derrape (Embestida glaciar / Pisotón con hueco de Yarlak) |
| Ventisquero | Lluvia de carámbanos | Ventisca local | Ola de ventisca (Ventisca blanca de Yarlak) |

### 2.5 Parte rompible, derribo y trofeo menor
- 1 parte por minijefe con efecto **visible en el comportamiento** (quita/cambia ataques). Al romperse: banner `¡<PARTE> ROTA!` 1,5 s, `fx.hit(80)`, `fx.shake(8, 250)`, corazón (`miniHeart`), botín extra `L.MINI_PART_BONUS`, **ventana de exposición** x1,4-1,6 durante 3-4 s, sprite pasa a las animaciones `_np` (sin parte) y se suelta la **Insignia** del minijefe (trofeo menor).
- El medidor se declara como `meter` (valor absoluto) y `share` (fracción del daño recibido, post-multiplicadores, que lo gasta). Objetivo medido: la parte se rompe entre el 45 % y el 65 % del HP perdido en el 70 % de las peleas del bot de referencia, y se rompe antes de morir en >= 80 % de las peleas.
- El daño en ventana (`expT/expMul`) se multiplica antes del medidor, igual que hoy (`Combat.deal`).

### 2.6 Enrage al 50 % de HP
Rugido de 900 ms (sin atacar; `fx.shake(9, 400)`, anillo rojo, banner `¡<NOMBRE> SE ENFURECE!`), velocidad x1,2-1,35 (cada ficha), pausa entre ataques (`gap`) x0,65, y una mejora propia del ataque firma (versión doble/ampliada). El rugido es una **ventana de castigo ligera** (cuerpo x1,0, sin x). Barra: muesca blanca al 50 % (ya existe) y el nombre pasa a naranja.

### 2.7 Debilidades y resistencias (tabla A.8)
Hoy los guardianes **no** usan materiales (`E.spawn` salta `d.elite`). Se activa para los 8: cada minijefe declara `mat` (+ `mx` con excepciones) y se aplican los multiplicadores de A.8 limitados a [0,75 ; 1,25] **antes** de ventanas y resonancia (`G.B.matMul` en `Combat.deal/dot`, como los enemigos normales). Los números de daño usan el tinte verde/gris de A.8. Material por minijefe: Carnero = Lana; Tejedora = Vegetal; Alcaide = Metal; Centinela = Magma; Hidra Joven = Pantano con Fuego x1,25 (cauteriza); Plañidera = Espectro; Yeti Mayor = Pelaje (placa = Escarcha mientras está entera); Ventisquero = Escarcha. Los chips MEJOR/PEOR de la barra grande (`icon_weak` / `icon_resist`) salen de aquí.

### 2.8 Adds
Máximo **3 enemigos extra vivos** por minijefe (los que invoca el minijefe y los "escoltas" de entrada; los proyectiles y zonas no cuentan). Si el cap se alcanza, el ataque de invocación se ejecuta sin spawn (sigue haciendo su daño/efecto). Los adds son siempre tipos de la familia del bioma (se resuelven con `B.has`/`E.spawn`), no mueren con el minijefe pero se disipan si invocador y jefe final aparecen (`kill(e,true)` global de `spawnBoss`). El tope de 12 larvas de la Madre Colmena (`kidsMax`) desaparece.

### 2.9 Barra grande de guardián (generalizada)
Se mantiene `drawGuardBar` (520 x 16, y = 64, muesca al 50 %) y se añade: título con nombre y rol (`GUARDIÁN - PRESIÓN` / `- CONTROL`), **chips de debilidad/resistencia** (2 + 1 máx., 14 px, a la derecha), medidor de parte genérico (120 x 8 bajo la barra con el nombre de la parte; se pone dorado cuando la parte es el objetivo, p. ej. núcleo abierto), texto `xN EXPUESTO` con arco de cuenta atrás, y una **línea de estado** por minijefe: Hidra (`REBROTE EN 9 s - ¡QUÉMALA! 25/60`), Tejedora (`VAINAS 2`), Centinela (`NÚCLEO ABIERTO`). Banner de entrada 2 s: `¡GUARDIÁN: <NOMBRE>!` + subtítulo de 14 px (`<Apodo> del <Bioma>`).

### 2.10 Entrada, muerte y pivote
Entrada de 900 ms (`spawnT`) con anillo y sombra; muerte con 5 frames `die` a 9 fps. En vista inclinada (`view.js`) pivote en los pies: `Proj.footOf` = 28 px (Carnero 26, Alcaide 30, Yeti Mayor 30, Hidra 22, resto 28). `E.SHADOW` por tipo: 1,9-2,2 x ancho.

---

## 3. Cambios en el director de spawn (`waves.js`, `main.js`, `families.js`)

### 3.1 Tabla por bioma
Nuevo `G.B.minis`, una tabla junto a `G.B.fam` (mismo patrón: datos, no lógica):

| Campo | Significado |
|---|---|
| `G.B.minis.<bioma>.ready` | `true` solo cuando los dos minijefes del bioma están terminados (arte + audio + lógica). Si es `false`, el bioma usa el guardián legado (comportamiento v5 exacto). |
| `.slot1`, `.slot2` | `{ id, at }`: id del minijefe y minuto de entrada virtual (210 000 / 330 000). |
| `G.B.minis.def.<id>` | HP, vel, `r`, `sc`, dmg, `mat`/`mx`, parte (`key`, `name`, `meter`, `share`, `shareWin`), `bag` de ataques con `cd` y rango, `gap`, `expMul`, `enrage {spd, gap, ...}`, `adds {max, escort}`, `noSpawn` (roles normales que se suspenden mientras vive), `guaranteed`, `partBonus`, `insignia`, `spr`, `xp`/`ash`, `name`, `sub`. |

Contenido inicial: `bosque { slot1: carnero, slot2: tejedora }`, `cripta { alcaide, centinela }`, `asfodelo { hidra, planidera }`, `tundra { yeti_mayor, ventisquero }`, `panal { avispon, reina_joven, ready: false }`.

### 3.2 Orden y elección
- **Cuál sale primero/segundo:** lo decide el slot del bioma activo (`G.curBiome`); no hay azar. `W.minis.queue = [slot1, slot2]` se construye al empezar la run.
- **Reglas de entrada** (sustituyen al bucle de `W.update` que recorre `B.enemy[k].elite`): slot k entra si `vt >= at_k` (o adelantado por el encargo, 2.1), `E.minis().length == 0`, el slot k-1 ya salió y lleva >= 10 s muerto, y `runT < BOSS_T - MINI_LAST`. Si no entra antes de `BOSS_T - MINI_LAST`, se marca como hecho/omitido.
- `W.elitesDone` pasa de guardar tipos a guardar slots (`mini1`, `mini2`); `main.js:296` (arranque con `?boss=`/`?t=`) marca ambos slots como hechos.
- **Escoltas** (`spawnElite`): Alcaide = 2 Carceleros menores (`shield`, como el Coloso); Yeti Mayor = 2 Lobeznos (`worm`; antes 2 Yetis, demasiado peso en tier 2); Carnero, Tejedora, Centinela, Hidra, Plañidera, Ventisquero = ninguno. Los escoltas cuentan para el cap de 3 adds.
- **Supresión de normales:** la regla actual "sin `shield` mientras haya Coloso" se generaliza a `noSpawn` por minijefe: Alcaide y Yeti Mayor suspenden `shield`; Hidra Joven suspende `leech` y `headlet` (los charcos son suyos); Tejedora suspende `sower` (Micelio) para no mezclar zonas verdes. El resto, ninguno.
- **Música:** `W.eliteBoost` de 25 s (+0,15 de intensidad) se mantiene.

### 3.3 Cómo se sustituye el uso global de `mini_bulwark` / `mini_hive`
Los tipos `mini_bulwark` y `mini_hive` **dejan de usarse** en el flujo normal y quedan como guardián legado, accesible con `?minis=0` (A/B con el bot y regresión idéntica a v5). Los 8 minijefes se registran como tipos `mini_<id>` con `elite: true, mini: true, slot: 1|2` en `G.B.enemy` (con `from: Infinity`, `w: 0`, como hoy) y el resto del código pregunta por `e.mini` (nuevo) en lugar de por el nombre del tipo. Tabla completa de puntos de contacto en la sección 9.

---

## 4. Fichas de los 8 minijefes

Convenciones: `tele` = telegrafía en ms; "regla" = `250 + 1000 x salida/190` (+220 en Tundra); `cd` = tiempo mínimo desde su último uso; daño = final contra el jugador (<= 32). Sprites: clave en snake_case, tamaño `base -> final x2`, frames `0..N`, animaciones con `f` (frames) y `fps` como en `addV`. Todas las anims `*_np` = parte rota. Las anims de ataque que no tengan frame propio reutilizan el de `walk`. Todos los sprites miran a la DERECHA, contorno `#1b1124`, estilo vectorial de `assets.js`, sin `shadowBlur`.

### 4.1 CARNERO MAYOR (Bosque, slot 1, 3:30) - NUEVO

**Lore:** El morueco más viejo del rebaño; el Pastor le dejó los cuernos de hierro negro para que le abra camino.
**Rol:** presión; persigue sin kitear, siempre mirando al jugador.
**Silueta y tamaño:** cuadrúpedo bajo y ancho con cuernos enroscados que sobresalen 12 px por encima de la cabeza (silueta negra reconocible, como la del Pastor). Sprite 44x32 -> **88x64**; `r` 26; pivote de pies 26. Sombra elíptica de 1,9 x ancho.
**Paleta:** lana carbón `#2a2430` con manchas crema `#e8e4d4`, púas moradas `#8a3aa8` en el lomo, cuernos hueso/hierro `#b8a890` con veta granate `#6a1f2f`, ojos `#ff9a2a` (rojo `#ff3a2a` en enrage).
**Stats:** HP 2500, vel 48 (enrage 62), dmg base 22, `gap` 1000 ms (enrage 650), `expMul` 1,4.
**Entrada:** salta desde el borde de cámara (sombra creciente 900 ms) y aterriza con anillo de polvo.

| # | Ataque | tele | Patrón | Daño | cd | Esquiva / regla |
|---|---|---|---|---|---|---|
| P1 | **Cornada rastrera** | 650 ms: cuernos bajan, cono rojo 70 grados alcance 120 (rumbo fijo últimos 160 ms) | Embiste con la cabeza baja; empuje x1,2 | 22 | 4500 | Salir del cono de lado (~70 px): 618 <= 650. Solo si d < 120. |
| P2 | **Balido del rebaño** | 800 ms: anillo morado en el suelo y 2 círculos de aparición | Invoca 2 Corderos corruptos (`worm`, `summoned`) a su espalda; tope de adds 3 | 0 | 14 000 | Matar a los Corderos con área; no daña directo. |
| **F** | **Embestida de cuernos** (firma) | **900 ms**: doble contorno, rectángulo rojo 80 x 420 (fijo últimos 250 ms) y círculo rojo r 100 en el punto de parada; viñeta roja los últimos 300 ms | Carga a 400 px/s, 420 px. Al chocar o llegar: **onda** (anillo de 380 ms hasta r 100, 16). Si choca con **pared u obstáculo**: aturdido 1,6 s (**ventana x1,5**, cuernos clavados); si llega al final: descansa 1,4 s (**ventana x1,4**) | 28 (carga) / 16 (onda) | 9000 | Esquivar lateral (50 px): 513 <= 900; salir del círculo (100 px): 776 <= 900. Anticipa la Embestida del carnero y la Estampida del Pastor (mismo rectángulo rojo largo y mismo aturdimiento contra tronco). Solo si 130 <= d <= 430. |

**Parte rompible: CUERNOS.** `meter` 600 (24 % HP), `share` 0,45 (1,0 mientras está aturdido o descansando: golpearle con los cuernos clavados es la jugada). Se rompe en ~1200-1300 de daño (~50 %). Grietas visibles a 66 % y 33 %.
**Efecto al romperse:** derribo 3 s (x1,5, no ataca), corazón, banner `¡CUERNOS ROTOS!`, sprite `*_np`. A partir de ahí: la Embestida pasa a **Embestida a testa** (dmg 18, **sin onda**, **sin aturdimiento**, descansa 1,0 s x1,25, tele igual); la Cornada baja a alcance 80 y 16 de daño ("Coz"); el Balido se alarga a 20 000 ms. Menos amenaza, pero ya no puedes explotar los aturdimientos.
**Trofeo menor:** Insignia `trophy_mini_carnero` ("Insignia de Cuerno").
**Enrage (50 %):** vel 62; **Embestida doble** (2.ª tele **780 ms**, re-aim con 250 ms fijo; 780 >= 776 del anillo); Balido invoca 3 Corderos (tope 3); `gap` 650.
**Debilidades (A.8 Lana):** Fuego x1,25, Hielo x0,75. Ninguna otra.
**Drops:** garantizado `{ static: 3, plate: 2, thread: 2 }`, Esencia 35 %, +2 Jirón estático al romper los Cuernos, corazón, 1 fragmento de PF, Insignia. XP 30, Ceniza 20.

**Sprite `enemy_mini_carnero`** (44x32 -> 88x64): 29 frames.
| Frames | Contenido |
|---|---|
| 0-1 | idle (respira) |
| 2-5 | walk (4) |
| 6 | horn-wind (cabeza baja, cuernos con brillo naranja) |
| 7 | horn-hit (cabeza arriba y adelante) |
| 8 | charge-wind (patas traseras hundidas, vapor por la nariz) |
| 9 | charge (cuerpo estirado, rayas de velocidad) |
| 10 | stun (cuernos clavados, ojos en espiral) |
| 11 | call (cabeza alta, balido, 3 notas moradas) |
| 12 | hurt |
| 13 | roar (enrage: ojos rojos, vapor) |
| 14-18 | die (5) |
| 19-20 | idle_np (sin cuernos: muñones) |
| 21-24 | walk_np (4) |
| 25 | charge-wind_np |
| 26 | charge_np (testa) |
| 27 | stun_np |
| 28 | coz-hit_np |

Anims: `idle` [0,1] 3 fps; `walk` [0,2,1,3,4,5] 7; `horn` [6,7] 8; `charge_wind` [8]; `charge` [9]; `stun` [10]; `call` [11]; `hurt` [12]; `roar` [13]; `die` [14..18] 9 fps; `idle_np` [19,20]; `walk_np` [19,21,20,22,23,24]; `charge_wind_np` [25]; `charge_np` [26]; `stun_np` [27]; `horn_np` [28].
**VFX/proyectiles:** todo por código (cono, rectángulo, anillo expansivo, círculos de aparición); `fx_horn_shard` 16x16 -> 32x32, 4 frames (esquirlas al romper) como partículas.
**SFX nuevos:** `ram_snort`, `ram_horn_scrape`, `ram_charge_wind`, `ram_charge_crash`, `ram_horn_break`, `ram_bleat`, `ram_stun`.

---

### 4.2 TEJEDORA DE ZARZAS (Bosque, slot 2, 5:30) - NUEVO

**Lore:** Hiló su red con las espinas del bosque quemado; lo que se enreda en ella alimenta a las zarzas.
**Rol:** control; mantiene 200-280 px, cierra el espacio con raíces y zonas, se cura con esporas.
**Silueta y tamaño:** torso humanoide de ramas sobre cuatro patas-raíz arácnidas, falda de raíces que arrastra, abdomen/bulbo de **raíz madre** colgando a la espalda (parte). Sprite 40x40 -> **80x80**; `r` 24; pivote 28.
**Paleta:** corteza `#3a2a1e`, hojas `#2f5a2a`, espinas moradas `#8a3aa8`, bulbo/esporas amarillo-verde `#c8e85a`, ojos naranja `#ff9a2a` (vínculo con el Pastor).
**Stats:** HP 3000, vel 34 (enrage 42, kitea con `kite(e, a, d, 200, 280)`), dmg base 14, `gap` 2200 (enrage 1500), `expMul` 1,4.
**Entrada:** brota del suelo (900 ms, raíces que se abren en cruz).

| # | Ataque | tele | Patrón | Daño | cd | Esquiva / regla |
|---|---|---|---|---|---|---|
| P1 | **Raíces reptantes** | 900 ms: 4 líneas rojas finas 26 x 260 desde ella hacia el jugador (3 sobre él y 1 sobre su trayectoria; fijas últimos 225 ms) | Cada línea erupciona con 250 ms de diferencia; raíz clavada 700 ms | 16 por raíz; **enreda** (ralentiza 45 % durante 1,5 s) | 6000 | Cruzar los huecos (25 px): 382 <= 900. No hace falta pegarse a ella. |
| P2 | **Floración** (cura) | 800 ms: 2 anillos verde pálido con cruz, r 40, a 120-200 px de ella | Brotan **2 Vainas de esporas** (adds: r 14, HP 90, pulso cada 1,5 s que cura a la Tejedora el 1,2 % de su HP máx. si está a <= 220 px; hilo verde pálido hasta ella). Tope 2 vainas | 0 | 16 000 | Priorizar las vainas (cualquier carta las mata; **Fuego las mata de un golpe**). Sin Raíz madre no puede usarla. |
| **F** | **Maraña de espinas** (firma) | **1000 ms**: doble contorno, 5 círculos verdes punteados r 55 que se cierran, a 120-180 px del jugador | 5 zonas activas 6 s: 7/500 ms y ralentiza 20 %; cierran el kiteo | 7/tick | 12 000 | Salir del círculo (65 px): 592 <= 1000. Anticipa las Esporas del Rebaño del Pastor (mismo patrón, 6 s). Tope 5 zonas vivas. |

**Parte rompible: RAÍZ MADRE.** `meter` 660 (22 % HP), `share` 0,40 de TODO el daño (se rompe tras ~1650 de daño, ~55 %). Bulbo luminoso a su espalda que se agrieta en 3 fases.
**Efecto al romperse:** arrancada: tropieza 1,2 s + **ventana x1,4 durante 3,5 s**, corazón; **ya no puede usar Floración** (se acaban las curas y las vainas que queden se pudren en 2 s); la Maraña dura **3,5 s** y sus zonas pierden 20 % de radio; las Raíces bajan a 2 líneas. Pasa de "curandera" a "tirador torpe".
**Trofeo menor:** `trophy_mini_tejedora` ("Insignia de Raíz").
**Enrage (50 %):** vel 42; Raíces 6 líneas; Maraña 7 zonas; **Estallido de zarzas** (una sola vez): tele **1150 ms**, círculo rojo r 140, 18 de daño y empuje; después queda expuesta x1,4 2,2 s (salida 150 px: 1039 <= 1150). `gap` 1500.
**Debilidades (A.8 Vegetal):** Fuego x1,25, Veneno x0,75, Sangre x0,75.
**Drops:** garantizado `{ frost: 3, thread: 3, feather: 1 }`, Esencia 35 %, +2 Polvo de escarcha al romper la Raíz madre, corazón, 1 fragmento de PF, Insignia. XP 40, Ceniza 25.

**Sprite `enemy_mini_tejedora`** (40x40 -> 80x80): 30 frames.
| Frames | Contenido |
|---|---|
| 0-1 | idle (flota/respira) |
| 2-5 | walk (levita, patas-raíz arrastran) |
| 6 | roots-wind (brazos clavados en el suelo) |
| 7 | roots-cast (brazos extendidos, raíces verdes) |
| 8 | bloom-wind (pecho abierto) |
| 9 | bloom-cast (esporas amarillo-verde) |
| 10 | thorn-wind (brazos arriba, espinas moradas) |
| 11 | thorn-cast (brazos hacia abajo) |
| 12 | burst-wind (hinchada, brillo) |
| 13 | burst (espinas radiales) |
| 14 | hurt |
| 15 | roar |
| 16-20 | die (5) |
| 21-22 | idle_np (sin bulbo: muñón rasgado) |
| 23-26 | walk_np (4) |
| 27 | roots-wind_np |
| 28 | thorn-wind_np |
| 29 | burst_np |

Anims: `idle` [0,1] 3; `walk` [0,2,1,3,4,5] 6; `roots` [6,7] 8; `bloom` [8,9] 8; `thorn` [10,11] 8; `burst` [12,13] 8; `hurt` [14]; `roar` [15]; `die` [16..20] 9; `idle_np` [21,22]; `walk_np` [21,23,22,24,25,26]; `roots_np` [27]; `thorn_np` [28]; `burst_np` [29]. (Sin `bloom_np`: la Floración ya no existe.)
**Sprites auxiliares NUEVOS:**
- `enemy_mini_pod` (Vaina de esporas) 14x14 -> 28x28, 9 frames: idle 0-1, pulse 2-3 (halo verde pálido), die 4-8; anims `idle` [0,1] 3, `pulse` [2,3] 6, `die` [4..8].
- `fx_root_spike` 24x48 -> 48x96, 4 frames (emerge 0-1, clavada 2, retrae 3), tileable en largo.
- `fx_thorn_patch` 64x64 -> 128x128, 3 frames (zona de espinas con pulso; cubre r 55 + borde).
**VFX por código:** líneas finas de raíz, círculos que se cierran, anillos verde pálido con cruz, hilo de cura (línea fina verde pálido de la vaina a la Tejedora, alpha 0,5), nova del Estallido.
**SFX nuevos:** `weaver_root_tele`, `weaver_root_erupt`, `weaver_bloom`, `weaver_pod_pulse`, `weaver_pod_pop`, `weaver_thorn_arm`, `weaver_burst`, `weaver_rootmother_break`.

---

### 4.3 ALCAIDE DE HIERRO (Cripta, slot 1, 3:30) - REDISEÑO del Coloso Escudero

**Lore:** Guardó las llaves de mil celdas; ahora las lleva al cinto y no le pesan: las celdas están vacías.
**Rol:** presión; escudo frontal, golpes cortos, grilletes de zona segura interior.
**Reinterpretación:** reutiliza el motor del Coloso (escudo frontal x0,2, `shieldHit`, ventanas) y sus dos ataques más sólidos (el empellón y los escudos giratorios, ahora "llaves"), **quita** el Pisoteo con ondas y la Embestida con onda de choque (esta última pasa al Centinela, que ya la tiene) y añade el Barrido de grilletes como firma.
**Silueta y tamaño:** guerrero acorazado con yelmo de reja, **escudo-puerta de celda** enorme (frontal, con bisagras y mirilla), cadena con grillete en el brazo libre y manojo de llaves en el cinturón. Sprite 36x36 -> **72x72**; `r` 24; pivote 30.
**Paleta:** hierro `#6b7385`, hierro oscuro `#3a4050`, brillo `#aab4c8`, ranura del yelmo y mirilla naranja `#ff6a1a`, llaves doradas `#ffd23a`, paño violeta `#4a3a6a`.
**Stats:** HP 2600, vel 44 (enrage 59), dmg base 22, `gap` 1000 (enrage 600), `expMul` 1,5, escudo frontal x0,2 (arco +-70 grados).
**Entrada:** 900 ms; llega con 2 Carceleros menores de escolta (`shield`).

| # | Ataque | tele | Patrón | Daño | cd | Esquiva / regla |
|---|---|---|---|---|---|---|
| P1 | **Golpe de reja** (antes Golpe de escudo) | 700 ms: cono rojo 90 grados alcance 105 (rumbo fijo últimos 200 ms) | Empellón con el escudo; empuje x1,4 | 22 | 4000 | Salir 60 px: 566 <= 700. Solo si d < 100. |
| P2 | **Llavero giratorio** (antes Escudos giratorios) | 650 ms: 3 llaves fantasma + círculo r 96; giran 3,2 s a r 80 (**tocarlas 12**); aviso de lanzamiento **500 ms** (carriles de 26 px) | Salen disparadas a 250 px/s | 12 (contacto y proyectil) | 11 000 | Fuera del círculo o entre carriles (23 px): 371 <= 500. |
| **F** | **Barrido de grilletes** (firma) | **1000 ms**: doble contorno, **rosquilla roja** radio interior 70 / exterior 230 en arco de 120 grados hacia el jugador (rumbo fijo últimos 250 ms) | La cadena barre el arco; **zona segura interior** (pegado al cuerpo) y exterior. Después el grillete queda clavado 1,4 s y tira de él: **ventana x1,4** | 26 | 9000 | Entrar hasta el cuerpo (premia auras) o salir > 230 (100 px: 776 <= 1000). Anticipa el Barrido de grilletes y el Martillazo de cadenas de Karceron. |

**Parte rompible: ESCUDO-REJA** (existente, ahora con nombre propio). `meter` = 30 % del HP máx. = **780**, gastado por el daño frontal bloqueado (antes de reducirlo, como hoy); por la espalda, orbitales, áreas y estados no lo gastan.
**Efecto al romperse:** cae el escudo (sin bloqueo), **ventana x1,5 durante 3 s**, corazón, banner `¡ESCUDO ROTO!`, +2 Placa de bonus. Además: sin el escudo el Golpe de reja pasa a **Puñetazo** (cono 70 grados alcance 85, 18 de daño, tele 600) y el Llavero deja de proteger su espalda (3 llaves, giran 2,4 s). Mantiene los Grilletes (más peligrosos: 26) para que la parte rota no lo vuelva trivial.
**Trofeo menor:** `trophy_mini_alcaide` ("Llave del Alcaide").
**Enrage (50 %):** vel 59, `gap` 600, descansos x0,7, Llavero de 4 llaves, **Barrido doble** (2.º barrido en sentido contrario, tele **720 ms**, salida 80 px: 671 <= 720).
**Debilidades (A.8 Metal):** Rayo x1,25, Veneno x0,75, Acero x0,75.
**Drops:** garantizado `{ spine: 3, plate: 2, thread: 2 }`, Esencia 35 %, +2 Placa al romper el escudo (como hoy), corazón, 1 fragmento de PF, Insignia. XP 30, Ceniza 20.

**Sprite `enemy_mini_alcaide`** (36x36 -> 72x72, REDISEÑO sobre el esqueleto de `enemy_mini_bulwark`): 31 frames.
| Frames | Contenido |
|---|---|
| 0-1 | idle |
| 2-5 | walk (4) |
| 6 | bash-wind (escudo atrás, mirilla brillante) |
| 7 | bash (impacto) |
| 8 | keys-wind (llavero alzado) |
| 9 | keys-orbit (brazo girando) |
| 10 | chain-wind (cadena sobre la cabeza, brillo naranja) |
| 11 | chain-sweep (brazo extendido) |
| 12 | rec (jadeando, grillete clavado) |
| 13 | hurt |
| 14 | roar |
| 15-19 | die (5) |
| 20-21 | idle_np (sin escudo: puerta colgando del brazo) |
| 22-25 | walk_np (4) |
| 26 | punch-wind_np |
| 27 | punch_np |
| 28 | chain-wind_np |
| 29 | chain-sweep_np |
| 30 | rec_np |

Anims: `idle` [0,1] 3; `walk` [0,2,1,3,4,5] 6; `bash` [6,7] 8; `keys` [8,9] 8; `chain` [10,11] 8; `rec` [12]; `hurt` [13]; `roar` [14]; `die` [15..19] 9; `idle_np` [20,21]; `walk_np` [20,22,21,23,24,25]; `bash_np` [26,27]; `chain_np` [28,29]; `rec_np` [30].
**Sprites auxiliares NUEVOS:** `fx_shackle_ball` 24x24 -> 48x48, 2 frames (volando, clavado); `proj_mini_key` 12x12 -> 24x24, 2 frames (giro). Reutiliza `fx_chain_link` 16x16 y `proj_chain` 24x8 de la Cripta (P1).
**VFX por código:** sector de rosquilla (arco 120 grados, radios 70/230), líneas de carril, cadena dibujada como eslabones entre el cuerpo y la bola, círculo r 96.
**SFX nuevos:** `warden_bash`, `warden_key_jingle`, `warden_key_orbit`, `warden_key_launch`, `warden_chain_wind`, `warden_chain_sweep`, `warden_chain_pin`, `warden_shield_hit`, `warden_shield_break`.

---

### 4.4 CENTINELA DE BRASA (Cripta, slot 2, 5:30) - PULIDO+ (hoy solo tinte del Coloso)

**Lore:** Soldado de guardia que no se enteró de que su fuego se apagó; el magma le sale por las juntas.
**Rol:** control; presión espacial con lava persistente, ventana de núcleo.
**Cambio respecto a hoy:** conserva su **Arremetida** (la Embestida con onda de choque, que deja de existir en el Alcaide), **sustituye** los Escudos giratorios por el **Abanico de magma**, añade los **charcos de lava** como consecuencia de sus dos ataques y la **Erupción del núcleo** como firma. Pasa de 3:30 a 5:30.
**Silueta y tamaño:** más esbelto y alto que el Alcaide: coraza agrietada de roca negra con pecho de rejilla que muestra el núcleo, hombrera de hierro asimétrica, brasas que gotean por las juntas. Sprite 32x40 -> **64x80**; `r` 24; pivote 30.
**Paleta:** roca `#201a2e`, magma `#ff6a1a`, lava `#ffd23a`, hierro `#6b7385`, núcleo `#ff9a2a` (apagado `#5a3a30`).
**Stats:** HP 2900, vel 40 (enrage 52), dmg base 22, `gap` 1400 (enrage 900), `expMul` 1,6 en la ventana del núcleo (1,5 en las demás).
**Entrada:** surge del suelo con grietas rojas y chorro de lava (900 ms).

| # | Ataque | tele | Patrón | Daño | cd | Esquiva / regla |
|---|---|---|---|---|---|---|
| P1 | **Arremetida de brasa** (existente) | 800 ms: carril rojo 64 x 300 (fijo últimos 300 ms) + círculo r 95 en el punto de parada | Carga a 340 px/s; al llegar anillo de 380 ms hasta r 95; **deja un charco de lava r 55** (4 s, 6/400 ms, naranja con borde amarillo, aviso punteado 600 ms); queda expuesto 1,6 s x1,5 | 24 (carga) / 16 (anillo) | 9000 | Lateral (42 px): 471 <= 800; anillo (105 px): 802 <= 800 + 880 (el círculo está visible todo el ataque). |
| P2 | **Abanico de magma** | 750 ms: 5 líneas rojas finas en abanico de 90 grados (18 grados entre ellas), rumbo fijo últimos 250 ms | 5 glóbulos de magma a 230 px/s, alcance 330; cada uno que llega al final **deja un charco r 26** (3 s, 5/400 ms) | 12 por glóbulo | 6000 | Quedarse entre dos líneas (40 px): 460 <= 750. |
| **F** | **Erupción del núcleo** (firma, ventana) | **1200 ms**: doble contorno, anillo rojo r 200 alrededor, el pecho se abre | Pulso en el disco r 200 (22); después el **pecho queda abierto 4 s**: el **Núcleo** recibe x2,0 en su medidor y la barra se pone dorada; cierra con 1 Arremetida corta | 22 | 20 000 | Salir del anillo (170 px): 1145 <= 1200. Luego entrar a castigar. Anticipa la Erupción del núcleo y la ventana de pecho abierto de Karceron. |

**Parte rompible: NÚCLEO DE BRASA.** `meter` 580 (20 % HP), solo se llena con el daño recibido **durante el pecho abierto** a x2,0 (daño base x2, sin ventana): con ~55 DPS efectivos cae en 1,3-2 ventanas. Visible solo en ventana (círculo `r` 16 en el pecho).
**Efecto al romperse:** derribo 4 s x1,6 (la Erupción desaparece), corazón, banner `¡NÚCLEO ROTO!`; **enfriado**: vel -20 %, los charcos duran 1,5 s y tienen r -30 %, el Abanico baja a 3 líneas. Sin Erupción ya no hay ventana grande, pero la pelea ha perdido su zonificación.
**Trofeo menor:** `trophy_mini_centinela` ("Brasa Latente").
**Enrage (50 %):** vel 52, `gap` 900; Arremetida doble (2.ª tele **600 ms**: carril 42 px: 471 <= 600; el círculo del anillo se conserva); Abanico de **7 líneas / 120 grados con salva doble** (2.ª salva 600 ms después, intercalada, aviso 500 ms); charcos de 6 s. Tope **8 charcos vivos** (el más viejo se apaga) para no inundar la arena ni el fps.
**Debilidades (A.8 Magma):** Hielo x1,25, Fuego x0,75, Veneno x0,75. Coherente con Karceron (Hielo templa el magma).
**Drops:** garantizado `{ frost: 3, feather: 2, thread: 2 }` (Escarcha + Pluma = receta de Hielo; la Cripta no suelta Escarcha), Esencia 35 %, +2 Polvo de escarcha al romper el núcleo (se enfría), corazón, 1 fragmento de PF, Insignia. XP 40, Ceniza 25.

**Sprite `enemy_mini_centinela`** (32x40 -> 64x80): 29 frames.
| Frames | Contenido |
|---|---|
| 0-1 | idle |
| 2-5 | walk (4) |
| 6 | charge-wind (juntas al rojo vivo) |
| 7 | charge (inclinado, rastro de brasas) |
| 8 | fan-wind (brazo alzado con palma magma) |
| 9 | fan-cast (brazo adelante) |
| 10 | core-wind (pecho resquebrajado, brillo) |
| 11 | core-open (pecho abierto, núcleo visible) |
| 12 | rec |
| 13 | hurt |
| 14 | roar |
| 15-19 | die (5) |
| 20-21 | idle_np (pecho apagado y oscuro) |
| 22-25 | walk_np (4) |
| 26 | charge-wind_np |
| 27 | fan-wind_np |
| 28 | fan-cast_np |

Anims: `idle` [0,1] 3; `walk` [0,2,1,3,4,5] 6; `charge` [6,7] 8; `fan` [8,9] 8; `core` [10,11] 6 (el juego mantiene 11); `rec` [12]; `hurt` [13]; `roar` [14]; `die` [15..19] 9; `idle_np` [20,21]; `walk_np` [20,22,21,23,24,25]; `charge_np` [26]; `fan_np` [27,28].
**Sprites auxiliares NUEVOS:** `proj_magma_glob` 16x16 -> 32x32, 2 frames (vuelo/impacto). Reutiliza `fx_lava_tile` 32x32 (charcos), `fx_fire_cell` 44x44 y `boss_karceron_lava_pool` (de Karceron).
**VFX por código:** abanico de líneas finas, carril + círculo de impacto, anillo del pulso, charcos con aviso punteado naranja y borde amarillo.
**SFX nuevos:** `sentinel_ember_charge`, `sentinel_dash`, `sentinel_fan_wind`, `sentinel_fan_spit`, `sentinel_puddle_hiss`, `sentinel_core_open`, `sentinel_core_pulse`, `sentinel_core_break`.

---

### 4.5 HIDRA JOVEN (Asfódelo, slot 1, 3:30) - NUEVO

**Lore:** Una cría de Letea que mordió antes de aprender a nadar; sus cuellos aún no saben cuántos son.
**Rol:** presión; una sola cabeza muy móvil que muerde y escupe; si la rompes **rebrota salvo que la cauterices con Fuego** (mecánica M7 de la Cabeza menor, a escala de minijefe).
**Silueta y tamaño:** cuerpo ovalado y bajo de serpiente (verde azulado con vientre crema) con aletas de cola, y **una cabeza larga** sobre un cuello de 3 segmentos (alcance 140 px). Cuerpo 40x32 -> **80x64**, cabeza 24x24 -> **48x48**, segmentos de cuello 12x12 -> 24x24. `r` cuerpo 24; **cabeza** hurtable hija `r` 14 (`e.partOf`). Pivote 22. Sale del charco más cercano (usa `G.ponds` solo como decorado/aparición: no depende de ellos).
**Paleta:** cuerpo `#2f6f6a`, vientre `#e8e4d4`, cabeza ácida `#7be34a`, ojos amarillos `#ffe45a`, herida `#c04040`, cauterizada `#5a3a30` con humo.
**Stats:** HP 2400 (el HP de la cabeza es parte del mismo pool), vel 52 (enrage 68), dmg base 20, `gap` 1100 (enrage 700), `expMul` 1,3.
**Entrada:** emerge del charco (burbujas 900 ms, anillo).

| # | Ataque | tele | Patrón | Daño | cd | Esquiva / regla |
|---|---|---|---|---|---|---|
| P1 | **Mordisco en picado** | 700 ms: la cabeza se echa atrás, línea roja 60 x 300 (fija últimos 250 ms) | La cabeza se lanza 300 px a 460 px/s y vuelve. Si falla, la cabeza queda **expuesta 1,2 s** (x1,3 solo a la cabeza) | 20 | 3500 | Lateral (40 px): 460 <= 700. Solo si 80 <= d <= 300. |
| P2 | **Escupitajo ácido** | 900 ms: 3 círculos verde ácido r 42 que se cierran, alrededor y delante del jugador | 3 charcos ácidos 4 s: 7/500 ms, ralentiza 15 % | 7/tick | 9000 | Salir del círculo (50 px): 513 <= 900. |
| **F** | **Sumersión** (firma) | **1000 ms**: burbujas en el sitio y **marca roja r 110** donde emergerá (fija últimos 250 ms), doble contorno | Se hunde 1,6 s (no objetivo de nada; la cabeza se retrae) y emerge bajo el jugador con erupción; después queda **expuesta 1,5 s x1,3** | 26 | 14 000 | Salir de la marca (110 px): 829 <= 1000 (>= 800 por daño >= 25). Anticipa la Sumersión de Letea. |
| (S) | **Coletazo** (solo sin cabeza) | 800 ms: rosquilla roja interior 60 / exterior 170 | Barrido de 360 grados de la cola; **zona segura interior** | 22 | 5000 | Pegarse al cuerpo o alejarse (60 px: 566 <= 800). Sustituye a P1 y P2 mientras la cabeza falte. |

**Parte rompible: CABEZA.** La cabeza es una hija hurtable (las cartas con puntería automática la apuntan cuando está más cerca, p. ej. al morder). `meter` 600 (25 % HP): el daño que recibe la cabeza cuenta también al cuerpo (100 %), x1,15 por ser parte. Se rompe habitualmente en 10-20 s.
**Efecto al romperse:** derribo 3 s, banner `¡CABEZA CORTADA!`, corazón; **herida abierta**: el cuerpo recibe x1,3 mientras dure, pierde Mordisco y Escupitajo y usa **Coletazo** + Sumersión. **Rebrota en 12 s** (aviso: anillo verde 700 ms sobre la herida) con 50 % de medidor (300), **a menos que se cauterice**: 60 de daño de **Fuego** (impacto o quemadura) sobre la herida durante esos 12 s (anillo naranja de progreso 0-60 en el muñón). **Cauterizada = la cabeza no vuelve** y +2 Placa de bonus (la herida humea). Máximo 2 rebrotes; a la tercera vez la cabeza se pierde igualmente. Es el tutorial de las 3 cabezas de Letea (cauterización con Fuego, M7).
**Trofeo menor:** `trophy_mini_hidra` ("Escama Joven"; el icono muestra humo si se cauterizó).
**Enrage (50 %):** vel 68, `gap` 700; **Mordisco doble** (2.º aviso 500 ms: 460 <= 500); Escupitajo con 5 charcos; Sumersión emerge con una onda de ácido (anillo r 70, sin daño extra).
**Debilidades (A.8 Pantano + excepción):** Rayo x1,25, Veneno x1,25, Fuego x1,25 (cauteriza, igual que Cabeza menor y Medusa), Hielo x0,75. Como el límite es 1,25, no se apilan.
**Drops:** garantizado `{ plate: 3, feather: 2, thread: 2 }` (el Asfódelo apenas suelta Placa y Pluma), Esencia 35 %, +2 Placa al cauterizar (o +1 si solo se rompió), corazón, 1 fragmento de PF, Insignia. XP 30, Ceniza 20. Encargo opcional: "Cauteriza la Hidra Joven".

**Sprite `enemy_mini_hidra`** (cuerpo, 40x32 -> 80x64): 26 frames.
| Frames | Contenido |
|---|---|
| 0-1 | idle |
| 2-5 | slither (4) |
| 6 | dive-wind (ondas y burbujas, se hunde) |
| 7 | dive (solo burbujas y ondas) |
| 8 | emerge (erupción de agua) |
| 9 | tail-wind (cola alzada, sin cabeza) |
| 10 | tail-hit |
| 11 | hurt |
| 12 | roar |
| 13-17 | die (5) |
| 18-19 | idle_np (muñón sangrando) |
| 20-23 | slither_np (4) |
| 24 | stump-burn_np (cauterizado, humo) |
| 25 | stump-bud_np (brote de la cabeza) |

Anims: `idle` [0,1] 3; `walk` = `slither` [0,2,1,3,4,5] 7; `dive` [6,7] 6; `emerge` [8]; `tail` [9,10] 8; `hurt` [11]; `roar` [12]; `die` [13..17] 9; `idle_np` [18,19]; `slither_np` [18,20,19,21,22,23]; `burn_np` [24]; `bud_np` [25].
**Sprite `enemy_mini_hidra_head`** (cabeza, 24x24 -> 48x48): 9 frames: 0 idle, 1 lunge-wind, 2 lunge (boca abierta), 3 spit-wind (hinchada), 4 spit, 5 hurt, 6 exposed (mareada), 7 severed (cae), 8 regrow (brote pequeño); anims `idle` [0], `lunge` [1,2] 8, `spit` [3,4] 8, `hurt` [5], `exposed` [6], `severed` [7], `regrow` [8].
**Sprite `enemy_mini_hidra_neck`** (12x12 -> 24x24): 1 frame, segmentos que el juego encadena (seguimiento de 3 segmentos; sin `shadowBlur`).
**VFX por código:** línea de mordisco, círculos de ácido que se cierran, marca roja de emersión, anillo de rebrote (verde) y de cauterización (naranja con contador), humo del muñón (4 partículas). Reutiliza `fx_pond_ripple`, `fx_pond`.
**SFX nuevos:** `hydra_lunge_wind`, `hydra_lunge`, `hydra_spit_wind`, `hydra_spit`, `hydra_dive`, `hydra_emerge`, `hydra_sever`, `hydra_sizzle` (cauterización), `hydra_regrow`.

---

### 4.6 PLAÑIDERA ANEGADA (Asfódelo, slot 2, 5:30) - PULIDO+ (hoy solo tinte de la Madre Colmena)

**Lore:** Lloró tanto en el río que el río la lloró de vuelta; ahora llora por todos los que olvidan.
**Rol:** control; flota a 150-230 px, invoca almas y siembra zonas de olvido que enlentecen las cartas.
**Cambio respecto a hoy:** conserva Lluvia (ahora "de almas") y Marea (ahora "del olvido": turquesa, con `p.cdSlow`), añade el Coro de plañideras como firma, cambia la Bolsa por el **Velo**, y recorta las larvas (tope de adds 3, antes 12).
**Silueta y tamaño:** figura velada flotante sin pies, vestido que gotea y se pierde en bruma, **velo** translúcido turquesa sobre el rostro (parte), brazos largos alzados. Sprite 36x40 -> **72x80**; `r` 24; pivote 28.
**Paleta:** turquesa `#2f9a9a`, crema `#e8e4d4`, velo `#7fffe0` (alpha 0,7), morado hilo `#6a4a9a`, ojos blancos.
**Stats:** HP 3000, vel 38 (enrage 46), kitea 150-230, dmg base 14, `gap` 2600 (enrage 1900), `expMul` 1,4.
**Entrada:** emerge del suelo en una columna de agua (900 ms).

| # | Ataque | tele | Patrón | Daño | cd | Esquiva / regla |
|---|---|---|---|---|---|---|
| P1 | **Lluvia de almas** (antes Lluvia de larvas) | 750 ms: 5 círculos rojos r 26 que se cierran (7 en enrage) | Cada impacto 14; deja un **Alma errante** (`worm`) si hay cap de adds | 14 | 8000 | Salir del círculo (36 px): 440 <= 750. |
| P2 | **Marea del olvido** (antes Marea ácida) | 1000 ms: 4 círculos turquesa r 50 (5 en enrage) en anillo a 115 px del jugador | Zonas 5,5 s: **3-4/500 ms y `p.cdSlow` 40 % durante 2 s** (turquesa `#7fffe0`, icono del reloj roto en HUD). Tope 5 zonas vivas | 4/tick | 12 000 | Salir (60 px): 566 <= 1000. |
| **F** | **Coro de plañideras** (firma) | **800 ms**: doble contorno, 2 círculos morados r 30 en el suelo a 140-220 px del jugador | Invoca 2 **Medusas heladas** (`moth`, `summoned`; ralentizan 35 %). Tope de adds 3. Anticipa las Plañideras de Letea (3 Polillas/Medusas) y el Coro del Olvido | 0 | 18 000 | Matar a las Medusas con área; las Medusas lanzan el orbe de hielo de la familia. |

**Parte rompible: VELO.** `meter` 840 (28 % HP), `share` 0,55 de TODO el daño (se rompe tras ~1530 de daño, ~51 %). El velo ondea y se rasga a 66 % y 33 %.
**Efecto al romperse:** ventana **x1,4 durante 3,5 s**, 3 Almas errantes (cap), corazón, banner `¡VELO ROTO!`; **desaparece la Lluvia de almas**, la Marea del olvido baja su `cdSlow` a **25 %** y su radio a 42, y el Coro tarda +50 % (`cd` 27 000). Sin velo se le ve el rostro: ya no puede llorar sobre ti desde lejos, pero sigue llamando.
**Trofeo menor:** `trophy_mini_planidera` ("Velo Anegado").
**Enrage (50 %): Estallido de lamento** (una sola vez, tele **1150 ms**, círculo rojo r 150 que se llena; 14 de daño y 3 Almas errantes con cap; queda **expuesta x1,4 2,2 s**; salida 160 px: 1090 <= 1150) y desde entonces vel 46, `gap` 1900, Marea de 5 zonas, Lluvia de 7. Reemplaza a la Hinchazón cada 9 s por un Coro cada 14 s.
**Debilidades (A.8 Espectro):** Rayo x1,25, Sangre x0,75, Acero x0,75. Coherente con Letea (en el agua el Rayo es el aliado del bioma).
**Drops:** garantizado `{ static: 3, feather: 2, thread: 2 }` (el Asfódelo no suelta Jirón estático, la parte principal de Rayo), Esencia 35 %, +2 Jirón estático al romper el velo, corazón, 1 fragmento de PF, Insignia. XP 40, Ceniza 25.

**Sprite `enemy_mini_planidera`** (36x40 -> 72x80): 32 frames.
| Frames | Contenido |
|---|---|
| 0-1 | idle (flota) |
| 2-5 | float/walk (4, vaivén) |
| 6 | rain-wind (brazos arriba, lágrimas) |
| 7 | rain-cast (brazos abajo) |
| 8 | tide-wind (velo ondea turquesa) |
| 9 | tide-cast |
| 10 | choir-wind (boca abierta, 2 notas moradas) |
| 11 | choir-cast |
| 12 | burst-wind (hinchada, brillo) |
| 13 | burst (ondas radiales) |
| 14 | hurt |
| 15 | roar |
| 16-20 | die (5) |
| 21-22 | idle_np (sin velo, rostro) |
| 23-26 | float_np (4) |
| 27 | tide-wind_np |
| 28 | tide-cast_np |
| 29 | choir-wind_np |
| 30 | choir-cast_np |
| 31 | burst_np |

Anims: `idle` [0,1] 3; `float` y `walk` [0,2,1,3,4,5] 7; `rain` [6,7] 8; `tide` [8,9] 8; `choir` [10,11] 8; `burst` [12,13] 8; `hurt` [14]; `roar` [15]; `die` [16..20] 9; `idle_np` [21,22]; `float_np` [21,23,22,24,25,26]; `tide_np` [27,28]; `choir_np` [29,30]; `burst_np` [31]. (Sin `rain_np`.)
**VFX:** reutiliza `fx_olvido_zone` (96x96, P2), `fx_pond`, `icon_olvido` del HUD (P2) y la Medusa `enemy_asf_medusa`; sin sprites nuevos de proyectil.
**SFX nuevos:** `weeper_wail_wind`, `weeper_soul_rain`, `weeper_choir`, `weeper_veil_tear`, `weeper_burst`, `weeper_zone_hum` (o reutilizar `olvido_hum` / `olvido_chime`).

---

### 4.7 YETI MAYOR (Tundra, slot 1, 3:30) - PULIDO (mejora de `mini_yeti`)

**Lore:** El yeti más viejo de la manada; su placa de hielo es un casco que lleva puesto desde el último invierno.
**Rol:** presión; embiste con derrape, empuja y patina; la placa de hielo es su armadura.
**Cambio respecto a hoy:** es el Yeti Centinela con la bolsa de 4 ataques reducida a **3** (se quitan los Escudos giratorios, que no encajan con el hielo), la Embestida alargada con **derrape visible**, el Pisotón con **hueco** y la placa con un medidor propio. Escala de render x1,25 (precedente: Zarzal mayor x1,15 sin arte nuevo): 32x32 -> **80x80** efectivos; `r` 28. Sin tocar la geometría base del sprite.
**Silueta y paleta:** (ya existente) yeti de pelo blanco `#dfe8f2` con hombreras y escudo de hielo, grietas cian `#7fe8ff`; ojos cian. Casco/placa de hielo azul `#9fd8ff`.
**Stats:** HP 2500, vel 46 (enrage 62), dmg base 22, `gap` 1000 (enrage 650), `expMul` 1,5, **tau 300 ms** de los terrestres de la Tundra (patina al girar).
**Entrada:** 900 ms; llega con 2 Lobeznos de escolta (`worm`).
**Regla del hielo (`tele >= 470 + 1000 x salida/190`)**; el último 30 % de cada telegrafía fija el contorno.

| # | Ataque | tele | Patrón | Daño | cd | Esquiva / regla |
|---|---|---|---|---|---|---|
| P1 | **Empellón helado** (antes Golpe de escudo) | 800 ms: cono rojo 90 grados alcance 100 | Empuje x1,6 (tope 100 px) y **+6 de Frío** | 22 | 4000 | Salir 60 px: 786 <= 800. Solo si d < 100. |
| P2 | **Pisotón de escarcha** (antes Pisoteo con ondas) | 1150 ms: círculo r 125 y **hueco de 70 grados** señalado hacia el jugador | 3 ondas de hielo (v 190, grosor 24, separadas 250 ms) con hueco de 70 grados; **+4 de Frío** por onda | 16 por onda | 10 000 | Atravesar el hueco o alejarse (125 px: 1128 <= 1150). Anticipa el Pisotón de glaciar de Yarlak (anillo con hueco de 70 grados). |
| **F** | **Embestida con derrape** (firma) | **850 ms**: doble contorno, carril rojo 70 x 580 (360 px de carga + **220 px de derrape punteado**), fijo últimos 255 ms, y círculo r 100 en el punto de parada | Carga a 380 px/s; los últimos 220 px frenan (derrape); al parar, anillo de 380 ms hasta r 100 (16). Descansa 1,6 s **x1,5 (ventana)**. Contra una estalagmita rota y la ventana se alarga 0,4 s | 28 (carga) / 16 (anillo) | 9000 | Lateral (45 px): 707 <= 850; anillo (100 px): 996, el círculo está visible desde el primer aviso (850 + ~1000 ms de carrera). Anticipa la Embestida glaciar de Yarlak. |

**Parte rompible: PLACA DE HIELO.** `meter` 750 (30 % HP, existente). Se gasta con el **daño frontal bloqueado** (arco +-70, x0,2) **o con cualquier daño de Fuego desde cualquier ángulo** (igual que el Yeti Centinela de hoy); mientras esté entera la placa cuenta como material Escarcha (Fuego x1,25, Acero x1,25, Hielo x0,75).
**Efecto al romperse:** la placa se derrite (350 ms), ventana x1,5 3 s, corazón, banner `¡PLACA ROTA!`, +2 Mecha de bonus. Sin placa: la Embestida pierde **45 % del derrape** (220 -> 120 px) y su anillo baja a r 60; el Empellón sigue igual; el Yeti es más lento de girar (tau 360 ms). Fuego sigue siendo "la respuesta" de la Tundra.
**Trofeo menor:** `trophy_mini_yeti_mayor` ("Garra del Yeti Mayor").
**Enrage (50 %):** vel 62, `gap` 650; **doble Embestida** (2.ª tele **720 ms**, carril 45 px: 707 <= 720, el círculo del anillo permanece); el Empellón añade 2.º golpe.
**Debilidades (A.8 Pelaje):** Sangre x1,25, Hielo x0,75; con la placa entera: Fuego x1,25, Acero x1,25 (Escarcha). Coherente con Yarlak (Fuego/Rayo).
**Drops:** garantizado `{ wick: 3, plate: 2, thread: 2 }` (la Tundra no suelta Mecha ni Púa), Esencia 35 %, +2 Mecha al romper la placa, corazón, 1 fragmento de PF, Insignia. XP 30, Ceniza 20.

**Sprite `enemy_mini_yeti`** (32x32 -> 64x64, escalado x1,25 en juego): hoy 16 frames (0-10 normales, 11-15 `die`). **Se añaden 15 frames al final** sin cambiar los índices existentes:
| Frames nuevos | Contenido |
|---|---|
| 16-17 | idle_np (sin placa: casco derretido, pelo mojado) |
| 18-21 | walk_np (4) |
| 22 | bash-wind_np |
| 23 | bash_np |
| 24 | stomp-wind_np |
| 25 | stomp_np |
| 26 | rec_np |
| 27 | charge-wind (agachado, patas abiertas) |
| 28 | charge-slide (derrapando: patas delante, nieve) |
| 29 | hurt |
| 30 | roar (enrage) |

Anims nuevas: `charge` [27,28] 8; `idle_np` [16,17]; `walk_np` [16,18,17,19,20,21]; `bash_np` [22,23]; `stomp_np` [24,25]; `rec_np` [26]; `hurt` [29]; `roar` [30]. Las existentes (`idle`, `walk`, `bash`, `stomp`, `rec`, `die`) no cambian.
**VFX/proyectiles:** reutiliza `fx_ice_slab` (placa), `obs_ice_pillar`, `fx_snow_whirl`; la onda de hielo del Pisotón y el carril de derrape se dibujan por código; `fx_ice_shard` 16x16 -> 32x32 (4 partículas al romper la placa, generadas por código).
**SFX nuevos:** `yetim_roar`, `yetim_bash`, `yetim_stomp`, `yetim_charge_wind`, `yetim_slide` (pitch según velocidad), `yetim_ring`, `yetim_plate_crack`, `yetim_plate_break`.

---

### 4.8 VENTISQUERO (Tundra, slot 2, 5:30) - PULIDO

**Lore:** Un copo de viento viejo que olvidó cómo caer; allí donde pasa, el invierno se queda un rato más.
**Rol:** control; flota a 150-230 px, siembra ventiscas locales que suben el Frío, llueve carámbanos y abre olas.
**Cambio respecto a hoy:** conserva Lluvia (de carámbanos) y Marea (Ventisca local), **elimina** los spawns de larvas (ahora Lobeznos con cap 3 y solo en la Lluvia), añade la **Ola de ventisca** como firma, renombra la Bolsa a **Corazón de hielo** y su Estallido pasa a la regla del hielo.
**Silueta y tamaño:** (existente) copo/ráfaga con corona de cristales, falda de nubes, 3 carámbanos colgantes y brazos de hielo; cara enfadada oscura. Sprite 32x32 -> **64x64**; `r` 24; pivote 28.
**Paleta:** blanco azulado `#eef4fc`, cristal `#cfeeff`, hielo `#9fd8ff`, cara `#2a4f8a`, ojos cian `#7fe8ff`.
**Stats:** HP 2800, vel 38 (enrage 46), kitea 150-230, dmg base 14, `gap` 2600 (enrage 1900), `expMul` 1,4.
**Entrada:** 900 ms; una ráfaga de ventisca densa (alpha 0,45) cubre 4 s.

| # | Ataque | tele | Patrón | Daño | cd | Esquiva / regla |
|---|---|---|---|---|---|---|
| P1 | **Lluvia de carámbanos** (antes Lluvia de larvas) | 750 ms: 5 círculos rojos r 26 que se cierran (7 en enrage) | Cada impacto 14; deja un Lobezno (`worm`) solo si hay cap | 14 | 8000 | Salir (36 px): 659 <= 750. |
| P2 | **Ventisca local** (existente) | 1000 ms: 4 círculos azules r 50 (5 en enrage) en anillo a 115 px del jugador | Zonas 5,5 s: 4/500 ms, ralentiza 15 % y **+14 % de Frío/s** dentro. Tope 5 zonas | 4/tick | 12 000 | Salir (60 px): 786 <= 1000. Las hogueras (r 64) anulan el Frío. |
| **F** | **Ola de ventisca** (firma) | **1150 ms**: doble contorno, banda roja de 100 px de grosor y 520 px de largo en un borde, flechas blancas y **1 hueco de 140 px** | 2 olas separadas 1,2 s (3 en enrage) cruzan 480 px a 260 px/s: empujan 90 px y **+10 de Frío** | 14 | 14 000 | Cruzar por el hueco (120 px): 1102 <= 1150. Anticipa la Ventisca blanca de Yarlak (olas numeradas con hueco). |

**Parte rompible: CORAZÓN DE HIELO.** `meter` 784 (28 % HP, existente en "Bolsa"), `share` 0,55 de TODO el daño (~51 % de la pelea). El corazón brilla cian en el pecho y se agrieta a 66 % y 33 %.
**Efecto al romperse:** ventana **x1,4 durante 3,5 s**, corazón (de recuperación), banner `¡CORAZÓN ROTO!`, +2 Púa de bonus; **desaparece la Lluvia de carámbanos**, la Ventisca local sube solo **+6 % de Frío/s** y la Ola pierde un hueco de 140 -> 180 px (más fácil de leer). El Ventisquero deja de ser tan peligroso para el Frío.
**Trofeo menor:** `trophy_mini_ventisquero` ("Esquirla de Corazón").
**Enrage (50 %): Estallido de ventisca** (una sola vez): tele **1250 ms**, círculo rojo r 130, 14 de daño y **+20 de Frío**, 2 olas inmediatas; queda **expuesto x1,4 2,2 s** (salida 140 px: 1207 <= 1250 con la regla del hielo). Después vel 46, `gap` 1900, Ola de 3 hileras y Marea de 5 zonas.
**Debilidades (A.8 Escarcha):** Fuego x1,25, Acero x1,25, Hielo x0,75.
**Drops:** garantizado `{ spine: 3, feather: 2, thread: 2 }` (la Tundra no suelta Púa), Esencia 35 %, +2 Púa al romper el corazón, corazón, 1 fragmento de PF, Insignia. XP 40, Ceniza 25.

**Sprite `enemy_mini_ventisquero`** (32x32 -> 64x64): hoy 15 frames (0-9 normales, 10-14 `die`). **Se añaden 12 frames al final**, sin cambiar índices existentes:
| Frames nuevos | Contenido |
|---|---|
| 15 | wave-wind (brazos extendidos, soplando) |
| 16 | wave-cast (ráfaga horizontal) |
| 17 | hurt |
| 18 | roar |
| 19-20 | idle_np (corazón roto: pecho agrietado, sin brillo) |
| 21-24 | float_np (4) |
| 25 | blow_np (ventisca local) |
| 26 | wave-wind_np |

Anims nuevas: `wave` [15,16] 8; `hurt` [17]; `roar` [18]; `idle_np` [19,20]; `float_np` [19,21,20,22,23,24]; `blow_np` [25]; `wave_np` [26,16]. Las existentes no cambian (`spit` [6] = Lluvia de carámbanos, `acid`/`blizzard` [7] = Ventisca local, `swell` [8,9] = Estallido).
**Sprite auxiliar NUEVO:** `fx_blizz_wave` 32x32 -> 64x64, 4 frames (loseta de la banda de la ola, se repite a lo largo de 520 px).
**SFX nuevos:** `vent_howl`, `vent_zone_hum`, `vent_wave_wind`, `vent_wave`, `vent_heart_crack`, `vent_burst` (reutiliza `icicle_fall` / `icicle_hit` / `wind_gust` del Yarlak para la Lluvia).

---

## 5. Reserva: Panal (Melaria) - NO se implementa ahora

El Panal no existe aún (P5/P6). Se reserva su sitio en `G.B.minis.panal` con `ready: false`: si por error se lanzara, el director usa el guardián legado. **Sustituye** el diseño de B.6 ("Guardia Real" y "Reina Joven" como variante del Coloso/Colmena).

| Slot | Minijefe | Estado |
|---|---|---|
| 1 (3:30, presión) | **Avispón Real** | Reserva, voladora |
| 2 (5:30, control) | **Reina Joven** (Madre Colmena movida al Panal) | Reserva, motor `ai_hive` / legado con piel ámbar |

### 5.1 Reina Joven (la Madre Colmena actual, movida)
**Lore:** La crisálida de Melaria; todavía cree que puede ser reina.
**Resumen:** misma lógica que la Madre Colmena v5 (Escupitajo, Ácido, Lluvia de larvas, Marea, Estallido al 50 %, Saco) con piel ámbar `#f3a31f` y negro `#2a1b10`; el Ácido pasa a **charcos de miel** (r 50, ralentiza 45 %, celda abierta 10 s) y el Estallido a **Eclosión** (larvas explosivas del Panal, tope de adds 3). Parte: **Abdomen/Saco** (28 %, share 0,4). Débil a Fuego x1,25 / Hielo x1,25 (Insecto), resiste Veneno x0,75. Sprite `enemy_mini_reina_joven` 36x36 -> 72x72, **26 frames provisionales** (idle 0-1, float 2-5, spit 6, honey 7, swell 8, burst 9, rain-wind 10, hurt 11, roar 12, die 13-17, `*_np` 18-25). Parte exclusiva provisional del Panal (que hoy no suelta Púa ni Escarcha): `{ frost: 3, thread: 3, feather: 1 }`. HP 2900.

### 5.2 Avispón Real
**Lore:** El guardaespaldas de Melaria; zumba antes de que lo veas.
**Resumen:** rápido (vuela, ignora la miel; sprite 30x28 -> **60x56**, `r` 22, vel 78 / 100 enrage), HP 2300. Ataques: **Picado de aguijón** (tele 650: carril 60 x 340, fijo últimos 160 ms; 24 de daño; si choca con pilar o muro, aturdido 1 s x1,35; salida 45 px: 487 <= 650), **Zumbido envolvente** (órbita 2 s a 160 px y abanico de 5 aguijones, tele 600, 9 c/u), y firma **Estocada real** (tele 900, carril 70 x 380 desde el aguijón; si falla, expuesto 1,0 s x1,25; 26 de daño; anticipa la Estocada real de Melaria). Parte: **Aguijón** (`meter` 24 %, share 0,45): al romperse pierde la Estocada y el Picado doble, usa un golpe de ala corto (alcance 90, 16). Débil a Fuego (humo: lo seda 1 s, -40 % vel) e Hielo x1,25. Parte exclusiva provisional: `{ spine: 3, thread: 2, feather: 2 }`. Sprite `enemy_mini_avispon` **26 frames** (idle 0-1, fly 2-5, dash-wind 6, dash 7, stun 8, sting-wind 9, sting 10, hurt 11, roar 12, die 13-17, `*_np` 18-25).
**Insignias reservadas:** `trophy_mini_avispon`, `trophy_mini_reina_joven`.
**SFX reservados (para P5/P6):** `avispon_buzz`, `avispon_charge`, `avispon_sting`, `reinaj_honey_squelch`, `reinaj_hatch`.
**Nota:** estas fichas no se dibujan ni se programan ahora; el único trabajo presente es dejar la entrada de datos y el hueco de arte documentado, para no tener que reabrir el director cuando llegue el Panal.

---

## 6. Botín, PF y economía

### 6.1 Botín garantizado, parte exclusiva y bonus por parte
Se conserva el total de partes por minijefe (7 garantizadas + 2 de bonus), pero **la parte principal ya no es la del arquetipo, sino la que le falta al bioma** (README, "P1 pendiente: economía inicial"; recetas `L.MAIN`/`L.SEC`: Hielo = Escarcha + Pluma, Rayo = Jirón + Hebra, Veneno = Púa + Hebra, Acero = Placa + Pluma, Fuego = Mecha + Hebra).

| Minijefe | Garantizado (`L.GUARANTEED`) | Bonus al romper la parte (`L.MINI_PART_BONUS`) | Por qué esa parte | Receta que desbloquea |
|---|---|---|---|---|
| Carnero Mayor | `static 3, plate 2, thread 2` | `static +2` | Bosque: Jirón 5,4/run (el más bajo) y Placa solo "huésped" | Rayo (Jirón + Hebra) |
| Tejedora de Zarzas | `frost 3, thread 3, feather 1` | `frost +2` | Bosque: Escarcha 5,3/run (el segundo más bajo) | Hielo (Escarcha + Pluma) |
| Alcaide de Hierro | `spine 3, plate 2, thread 2` | `plate +2` (como el Coloso) | Cripta: "casi nada de Púa" | Veneno (Púa + Hebra) |
| Centinela de Brasa | `frost 3, feather 2, thread 2` | `frost +2` | Cripta: no suelta Escarcha | Hielo (Escarcha + Pluma) |
| Hidra Joven | `plate 3, feather 2, thread 2` | `plate +2` (cauterizada) / `+1` (solo rota) | Asfódelo: "apenas Pluma / Placa" | Acero (Placa + Pluma) |
| Plañidera Anegada | `static 3, feather 2, thread 2` | `static +2` | Asfódelo: no suelta Jirón | Rayo (Jirón + Hebra) |
| Yeti Mayor | `wick 3, plate 2, thread 2` | `wick +2` | Tundra: sin Mecha | Fuego (Mecha + Hebra) |
| Ventisquero | `spine 3, feather 2, thread 2` | `spine +2` | Tundra: sin Púa | Veneno (Púa + Hebra) |
| (res.) Reina Joven | `frost 3, thread 3, feather 1` | `thread +2` | Panal: sin Escarcha | provisional |
| (res.) Avispón Real | `spine 3, thread 2, feather 2` | `spine +2` | Panal: sin Púa | provisional |

Esencia rara: 35 % en cada uno (`rare: 0.35`, sin cambio; x`L.DUR.rare`). Redondeo estocástico y `L.DUR.parts` como hoy.
Cada minijefe suelta además un **corazón** (el de la parte rota, como hoy) y su **Insignia** al romper la parte.

### 6.2 Fragmentos de PF
1 fragmento por minijefe abatido (`T.onElite`, x`L.DUR.pf`: 1,4 en Rápida); 2 fragmentos = +1 PF. Con los 2 slots por run: **+1 PF por run completa**, igual que hoy.

### 6.3 Migración de "primer élite" y encargos
- `Save.data.elites[type]` (+1 PF la primera vez) pasa a guardarse por **slot** (`mini_slot1`, `mini_slot2`): como mucho +2 PF de por vida, como hoy. Migración: `elites.mini_bulwark` -> `mini_slot1`, `elites.mini_hive` -> `mini_slot2` (sin perder nada, copia de seguridad `swarmhand.save.v5`, guardado v6).
- Encargos `colossus` y `hive` (mismo id, guardados intactos) pasan a pedir "el guardián del primer/segundo aviso": `target: 'slot1'` / `'slot2'`, `name`: "Derriba al guardián del primer aviso" (descripción: el nombre del minijefe del bioma activo; recompensa `plate 8` -> la parte exclusiva del slot) y "Derriba al guardián del segundo aviso". `Quests.feasible` los marca cumplibles en los biomas con `ready`. Encargos opcionales nuevos (pool +3): "Rompe los Cuernos del Carnero", "Cauteriza la Hidra Joven", "Rompe 3 partes de guardián en una run".
- **Insignias** (`Save.data.insignias[id]`): 8 coleccionables que se ven en el Archivo de Ulalume; el Abuelo Lanudo cuenta su historia al conseguir cada una; **3** = logro "Cazador de guardianes", **8/8** = logro + 1 Esencia rara (una vez). No cuentan como Esencia para los nodos T3/T4 (decisión 0), para no tocar la economía.

### 6.4 Efecto esperado en la economía (a validar con el censo)
Total de partes por run constante (sigue siendo ~14-16 por los dos minijefes); lo que cambia es **de qué parte**. Objetivos: partes por run en cada bioma a +-8 % del valor de README (123,3 a 9 min), Brasas sin cambio (los minijefes no dan Brasas), y la parte exclusiva de cada bioma sube de <= 1,5 a >= 4 por run (p. ej. Cripta: Escarcha 0 -> ~3,5 con el Centinela). Riesgo conocido: +2 Polvo de escarcha del bonus duplica el suministro de Escarcha del Bosque (5,3/run): `L.TREE_PART_MUL.ice` = 0,5 ya compensa; se mide y, si el primer nodo de Hielo baja de 1,1 a < 1 run, se baja el bonus a +1.

---

## 7. Presupuesto de arte

Todo se genera por código en el estilo vectorial de `assets.js` (`addV`, `withDie`, `WALKSEQ`), como los guardianes de `assets_fam3.js`. Archivos propuestos: `assets_minis1.js` (Bosque y Cripta), `assets_minis2.js` (Asfódelo y Tundra). Prioridad de entrega: idle/walk/die, luego poses de ataque y `*_np`, luego auxiliares y Insignias.

### 7.1 Totales (implementación actual, sin reserva)

| Minijefe | Condición | Sprites | Frames |
|---|---|---|---|
| Carnero Mayor | NUEVO | `enemy_mini_carnero` | 29 |
| Tejedora de Zarzas | NUEVO | `enemy_mini_tejedora` (30), `enemy_mini_pod` (9), `fx_root_spike` (4), `fx_thorn_patch` (3) | 46 |
| Hidra Joven | NUEVO | `enemy_mini_hidra` (26), `enemy_mini_hidra_head` (9), `enemy_mini_hidra_neck` (1) | 36 |
| Alcaide de Hierro | REDISEÑO | `enemy_mini_alcaide` (31), `fx_shackle_ball` (2), `proj_mini_key` (2) | 35 |
| Centinela de Brasa | PULIDO+ (sprite propio nuevo) | `enemy_mini_centinela` (29), `proj_magma_glob` (2) | 31 |
| Plañidera Anegada | PULIDO+ (sprite propio nuevo) | `enemy_mini_planidera` | 32 |
| Yeti Mayor | PULIDO (+15 frames al final del existente) | `enemy_mini_yeti` | 15 |
| Ventisquero | PULIDO (+12 frames) | `enemy_mini_ventisquero` (12), `fx_blizz_wave` (4) | 16 |
| Insignias (8) | NUEVO | `trophy_mini_carnero`, `_tejedora`, `_alcaide`, `_centinela`, `_hidra`, `_planidera`, `_yeti_mayor`, `_ventisquero`: 16x16 -> 32x32, 2 frames cada una (normal, bloqueada) | 16 |
| **Total** | | **23 sprites nuevos + 2 existentes ampliados** | **256 frames** |

Reserva (no dibujar ahora): `enemy_mini_avispon` 26 + `enemy_mini_reina_joven` 26 + 2 Insignias x 2 = **56 frames**.

### 7.2 Plan mínimo si el arte no llega (nunca placeholder)
Si el arte de un minijefe no está listo, su bioma mantiene `ready: false` y usa el guardián legado. Reducción posible sin cambiar diseño: Centinela y Plañidera pueden salir con el sprite actual teñido (`E.VARIANTS.tint`) más solo 5 frames nuevos (core-wind, core-open, fan-wind, fan-cast, rec; y rain, tide, choir, burst, roar) añadidos a `enemy_mini_bulwark` / `enemy_mini_hive` -> ahorro de ~35 frames, a costa de que sigan pareciéndose al Coloso y a la Colmena. Se recomienda **no** hacerlo (el objetivo del dueño es identidad propia).

### 7.3 UI y Archivo
- `trophy_mini_*` en `assets_ui.js` (`UI.part`), y un icono `icon_boss_part_head` / `icon_boss_part_core` / `icon_boss_part_veil` para la barra grande de guardián (16x16 -> 32x32, 6 iconos, ya se pueden reutilizar los de jefe si coinciden en forma).

---

## 8. Audio (para `audio-designer`)

Procedural en WebAudio, estilo `sfx_fam1/2/3.js` (`Assets.sfxFam*[nombre] = {kind, fam, min}`), <= 4 voces por nombre, `vary` 0,1, **un único rugido a la vez** (el rugido de enrage y el de entrada no se pisan).

**Comunes (6):** `mini_spawn_roar` (rugido grave de entrada, reutiliza `boss_roar` pitch 1,3 + capa), `mini_enrage_roar`, `mini_part_break` (crujido + campana), `mini_expose_chime` (campana de ventana, hoy `card_select` pitch 1,6), `mini_die`, `mini_insignia` (tintineo corto).
**Stingers por código (`assets_peligro.js` style, voces `stg_*`):** `stg_mini_spawn`, `stg_mini_enrage`, `stg_mini_part`, `stg_mini_die`. La pista de run no cambia (se mantiene `W.eliteBoost` +0,15 de intensidad 25 s).
**Por minijefe (61):**
- Carnero (7): `ram_snort`, `ram_horn_scrape`, `ram_charge_wind`, `ram_charge_crash`, `ram_horn_break`, `ram_bleat`, `ram_stun`.
- Tejedora (8): `weaver_root_tele`, `weaver_root_erupt`, `weaver_bloom`, `weaver_pod_pulse`, `weaver_pod_pop`, `weaver_thorn_arm`, `weaver_burst`, `weaver_rootmother_break`.
- Alcaide (9): `warden_bash`, `warden_key_jingle`, `warden_key_orbit`, `warden_key_launch`, `warden_chain_wind`, `warden_chain_sweep`, `warden_chain_pin`, `warden_shield_hit`, `warden_shield_break`.
- Centinela (8): `sentinel_ember_charge`, `sentinel_dash`, `sentinel_fan_wind`, `sentinel_fan_spit`, `sentinel_puddle_hiss`, `sentinel_core_open`, `sentinel_core_pulse`, `sentinel_core_break`.
- Hidra Joven (9): `hydra_lunge_wind`, `hydra_lunge`, `hydra_spit_wind`, `hydra_spit`, `hydra_dive`, `hydra_emerge`, `hydra_sever`, `hydra_sizzle`, `hydra_regrow`.
- Plañidera (6): `weeper_wail_wind`, `weeper_soul_rain`, `weeper_zone_hum`, `weeper_choir`, `weeper_veil_tear`, `weeper_burst`.
- Yeti Mayor (8): `yetim_roar`, `yetim_bash`, `yetim_stomp`, `yetim_charge_wind`, `yetim_slide`, `yetim_ring`, `yetim_plate_crack`, `yetim_plate_break`.
- Ventisquero (6): `vent_howl`, `vent_zone_hum`, `vent_wave_wind`, `vent_wave`, `vent_heart_crack`, `vent_burst`.
**Total: 67 SFX nuevos (6 comunes + 61) + 4 stingers.** Los `tele` suenan una vez al empezar cada aviso (como en P1/P2); regla de volumen: el aviso es ~6 dB más suave que el golpe, el golpe de firma +3 dB. Reserva Panal: `avispon_buzz`, `avispon_charge`, `avispon_sting`, `reinaj_honey_squelch`, `reinaj_hatch` (no ahora).

---

## 9. Qué cambia en el código (puntos de contacto, para el programador)

Sin código aquí; esta es la lista de lo que hay que tocar (grep del estado actual):

| Archivo | Hoy | Cambio |
|---|---|---|
| `main.js:55-56` | `B.enemy.mini_bulwark/mini_hive` (HP, spr, `at`, `name`) | Se mantienen como legado (`?minis=0`); se añaden 8 `mini_<id>` (reserva: 2 más con `ready:false`) con `elite:true, mini:true, slot, from: Infinity, w:0` |
| `main.js:62-71` | `B.mini.bulwark/hive` | Nuevo `B.minis` (3.1) con `def` por id; `B.mini` queda para el legado |
| `main.js:296` | `elitesDone = {mini_bulwark, mini_hive}` | `{mini1, mini2}` |
| `waves.js:35-37` | `spawnElite`: variante por bioma y 2 escoltas | `spawnElite(slot)`: lee `B.minis[bioma]`, escolta por minijefe, banner con nombre/subtítulo |
| `waves.js:126-130` | bucle sobre `B.enemy[k].elite` | cola de slots (3.2); regla de 10 s y de `MINI_LAST` |
| `waves.js:157, 172` | `shield` bloqueado mientras viva `mini_bulwark` | `noSpawn` por minijefe |
| `enemies.js:57-60, 166` | init de `mini_bulwark`/`mini_hive`; la Colmena se divide en 3 gusanos | init por `def`; sin división |
| `enemies.js:757-1015` | `ai_bulwark`, `ai_hive`, `E.VARIANTS`, `E.variant`, `bulwarkNext`, `hiveNext` | Nuevo `ai_mini` data-driven (bolsa, partes, enrage, ventanas) que reutiliza las funciones probadas (carga con onda, órbitas, zonas, lluvia); legado intacto detrás de `?minis=0` |
| `enemies.js:1015` | `E.minis()` filtra por `type` | filtra por `q.mini` (y el legado también) |
| `enemies.js:1349, 1402-1403, 1415-1416, 1452-1453, 1497, 1515, 1542-1546` | dibujo, anims, sombras, tintes de los dos tipos | tabla `E.MINI_ANIM[id]` (anim por estado), `SHADOW`, `E.drawMini`; `*_np` por parte rota |
| `combat.js:137-138, 155, 185-186` | `shieldHit` si `mini_bulwark`, `sacHit` si `mini_hive`, placa del Yeti | `G.Minis.onHit(e, dmg, tag, ctx)` genérico: `meter/share/shareWin`, `frontal`, `fuego`, ventana; `e.mat` para `matMul` (y activar en `E.spawn` para `mini`) |
| `loot.js:61-62, 69` | `L.GUARANTEED`, `L.MINI_PART_BONUS` por tipo | por id de minijefe (tabla 6.1); `Loot.onMiniPart` suelta Insignia |
| `quests.js:44-47` | `colossus`/`hive` con `target` de tipo | `target: 'slot1'/'slot2'` |
| `tree.js:208-212` | `S.elites[type]` | `S.elites['mini_slot'+n]` |
| `boss.js:918, 922-939` | `drawGuardBar` con `shieldMax`/`sacMax` | barra genérica con chips, parte genérica y línea de estado |
| `view.js` | `Proj.footOf` 88/24 | pivote por id (2.10) |
| `save.js` | guardado v5 | v6: `insignias`, `elites` por slot; migración con copia en `swarmhand.save.v5` |
| `families.js` | sin guardianes | nada que tocar (los adds se piden por rol y la familia los viste) |
| Depuración | `?t=`, `?biome=`, `E.forceMini` | `?mini=<id>` (fuerza ese minijefe al empezar), `?minis=0` (legado), `?minis=1`, `G.Enemies.forceMini(e, 'embestida')` con los ataques nuevos, `G.dbg.atk` por minijefe, `G.Minis.info()` |

---

## 10. Plan de implementación

Diseño -> arte + audio + lógica **en paralelo** -> calibración con el bot. Estimación en días-persona de un solo flujo y en tres flujos (programmer / artista / audio-designer).

| Paso | Qué | Responsable | Días | Salida |
|---|---|---|---|---|
| **0** | Este documento + aprobación | game-designer / dueño | hecho | Fichas cerradas |
| **1a** | Infraestructura: `G.B.minis`, cola de slots, `ai_mini` data-driven, `G.Minis.onHit` (partes), barra genérica, `matMul` en minijefes, migración de guardado y encargos, `?mini=`, `?minis=0` | programmer | 4 | Los dos minijefes legados corren sobre el motor nuevo sin cambio visible; regresión 0 |
| **1b** | Arte tanda A: Alcaide, Centinela, Plañidera (re-skin con piezas nuevas), ampliación de Yeti y Ventisquero | artista | 4 | 5 sprites listos |
| **1c** | Audio tanda A (Alcaide, Centinela, Plañidera, Yeti, Ventisquero): 37 SFX + 6 comunes + 4 stingers | audio-designer | 1,5 | |
| **2** | Lógica Cripta + Tundra + Plañidera: Alcaide (Barrido de grilletes), Centinela (Abanico, charcos, Erupción), Yeti Mayor (derrape, Pisotón con hueco), Ventisquero (Ola), Plañidera (Coro, cdSlow) | programmer | 5 | `cripta`, `tundra` y Plañidera `ready` en pruebas |
| **3** | Arte tanda B: Carnero, Tejedora (+auxiliares), Hidra (+cabeza, cuello), Insignias | artista | 4 | 18 sprites listos |
| **3b** | Audio tanda B: Carnero, Tejedora, Hidra, 24 SFX | audio-designer | 1 | |
| **4** | Lógica Bosque + Asfódelo: Carnero (embestida con obstáculos), Tejedora (vainas, cura), Hidra (cabeza hija, rebrote, cauterización) | programmer | 6 | `bosque` y `asfodelo` `ready` |
| **5** | Calibración con el bot (16 runs por minijefe, 3 duraciones; ver 11) y ajuste de HP/partes/tele | programmer + tools-engineer | 3 | Tabla de resultados en README |
| **6** | Pruebas finales: auditoría de telegrafías, censo, regresión de jefes, fps, móvil, flujo aldea-portal-run-botín, capturas | tools-engineer | 2 | `minis2_tests.js all` verde |
| **7** | Panal (reserva): solo se mantiene la entrada de datos; arte/lógica en P5/P6 | - | - | |

Total aproximado: **~21 días en un solo flujo, ~12-13 con tres flujos en paralelo** (arte y audio van detrás de la lógica un paso). Publicación por bioma gracias a `ready`: tras el paso 2 se publican Cripta y Tundra (Asfódelo con Plañidera y el Coloso legado), tras el 4 el resto. Orden de entrega recomendado dentro de la lógica: lo que ya existe (Yeti, Ventisquero, Centinela, Plañidera, Alcaide) antes que lo nuevo (Carnero, Tejedora, Hidra).

---

## 11. Criterios de aceptación (medibles)

Herramientas: `tools/card-swarm-balance-bot/` (`minis.js` ya mide telegrafías; se amplía con `minis2_tests.js data|tele|parts|director|flow|all`, `minis_ttk.js` para duración de pelea). Todas las medidas con servidor local (`python3 tools/serve.py card-swarm <puerto>`).

**Duración de la pelea (build de referencia = bot con mano p50, `?god=1&speed=20`, 16 peleas por minijefe y por duración):**
1. TTK mediano de cada minijefe **entre 40 y 70 s** (Normal) y entre 36 y 75 s en Rápida y Larga; p25 (mano floja) <= 100 s; p75 (mano buena) >= 30 s.
2. La parte se rompe antes de la muerte en >= 80 % de las peleas y entre el 45 % y el 65 % del HP perdido en >= 70 % de ellas.
3. Cada ataque se usa >= 1,5 veces por pelea de media (con `G.dbg.atk`); el enrage ocurre en el 100 % de las peleas.

**Peligrosidad (bot esquivador **sin** `god`, 24 runs por minijefe, run completa hasta el jefe o la muerte):**
4. **Ninguna muerte del jugador > 35 % de las partidas del bot por minijefe** (muerte atribuida: el jugador muere con el minijefe vivo o < 15 s tras su muerte). Daño medio recibido del minijefe por pelea entre 20 y 45 HP (p90 <= 80), medido por `G.dbg.dmg` (fuentes `mini_<id>_<ataque>`).
5. 0 incumplimientos de la **auditoría de telegrafías** (`G.B.teleAudit()` ampliado a los 28 ataques y 6 variantes de enrage): `tele >= 400`, `tele >= regla` (con +220 en la Tundra), >= 800 si el daño >= 25, y **ningún golpe > 32**.
6. Máximo **3 adds vivos extra** por minijefe y <= 60 proyectiles enemigos (`G.eprojectiles`); máx. 8 charcos del Centinela y 5 zonas de la Maraña/Marea/Ventisca simultáneos.

**Director:**
7. En el 100 % de las runs god de 9 min de cada bioma, el slot 1 aparece a 3:30 +-15 s y el slot 2 a 5:30 +-30 s (Rápida/Larga equivalentes); **0 eventos de dos minijefes vivos a la vez**, 0 entradas dentro de `MINI_LAST`, y al aparecer el jefe final el minijefe vivo desaparece en silencio (probado con `?t=450`).
8. `?minis=0` reproduce v5 exacto (misma semilla, mismas altas hasta el jefe; prueba `p3_regress.js` ampliada).

**Economía:**
9. Partes por run (bot, 8 runs por bioma y duración) a +-8 % del valor de README (123,3 a 9 min, 99 a 7 min, 136,5 a 10 min); la parte exclusiva de cada bioma sube a >= 4 por run; Brasas sin cambio; PF por run completa = +1 (2 fragmentos), primer élite = +1 PF por slot (migración probada).

**Regresión y rendimiento:**
10. **Regresión 0 de los jefes finales:** peleas aisladas (`?boss=pastor|karceron|letea|yarlak`) con estado idéntico bit a bit al commit anterior (`p3_regress_boss.js`); y victoria del bot en Peligro I dentro de +-10 puntos de las tablas de README (Pastor 69 %, Karceron 60 %, Letea 52 %, Yarlak 88 %) en una **run completa** que pasa por los dos minijefes del bioma.
11. **fps >= lo anterior** (Chromium sin GPU, 960x540, 3 rondas alternadas): pelea de minijefe >= pelea de minijefe legado - 1 fps y horda sin cambio (referencia 56-60 fps); táctil 844x390 sin pérdida (59 fps).
12. **0 errores de consola** en: 8 minijefes x 3 duraciones x vista plana/iso, flujo aldea -> Portal -> run -> botín -> aldea con victoria y derrota en los 4 biomas, migración de guardado v5 -> v6 (y guardado corrupto), `?mini=<id>` para cada id.
13. Legibilidad: capturas con 100 enemigos + minijefe en cada bioma; contraste de telegrafías en la ventisca >= 3:1 (se mide como en P3).

---

## 12. Riesgos

| # | Riesgo | Prob. | Impacto | Mitigación |
|---|---|---|---|---|
| 1 | **Alcance de arte** (256 frames, 23 sprites nuevos, 6 con partes rotas) | Alta | Alto | Entrega por bioma con `ready`; el que no llegue deja su bioma con el guardián legado (nunca placeholder); prioridad idle/walk/die > ataques > `_np` > auxiliares. |
| 2 | **Hidra Joven (cabeza hija + rebrote + cauterización)** toca `Combat.nearest`, `e.partOf` y `lastTag`/`burnT`; el mayor riesgo técnico | Media | Medio | Reutilizar M7 y el patrón de partes hijas de Letea; probar primero con `?mini=hidra`; plan B: la cabeza no es hija, es solo un medidor y un cambio de animación. |
| 3 | **Muerte del jugador por zonas persistentes** (Tejedora, Centinela, Plañidera, Ventisquero) y soft-lock de espacio | Media | Alto | Topes de zonas/charcos (5 y 8), 6 s máx. de vida, invariantes de la Tundra (nieve firme <= 260 px, hogueras anulan Frío) y test "siempre existe un camino libre a < 220 px"; `cdSlow` tope 40 %/2 s (M9). |
| 4 | **Economía de partes**: la parte exclusiva puede disparar Escarcha/Jirón/Púa/Mecha, 4 biomas distintos | Media | Medio | Censo 6.4; bonus de parte rota bajable (+2 -> +1) y `L.TREE_PART_MUL` ya compensa; no se toca el techo de 24 PF. |
| 5 | **Dificultad desbalanceada** (Tejedora curando, Centinela con lava, Ventisquero con Frío) | Media | Alto | Calibración con bot (paso 5) con `?mini=` y HP/`share` como únicas palancas; criterios 1-4. |
| 6 | **Migración de guardado y encargos** (`elites` por slot, `colossus`/`hive`) | Baja | Alto | Mismos ids, copia de seguridad `swarmhand.save.v5`, prueba con guardado corrupto; `?minis=0` como salida. |
| 7 | **Regresión de los jefes finales** (el jugador llega con otro HP/mano al jefe) | Media | Medio | Criterio 10 con run completa; los minijefes no dan Brasas ni PF extra; corazones iguales a hoy. |
| 8 | **Fps** (cuello y vainas de la Tejedora, 8 charcos, 10-15 partículas al romper partes) | Baja | Medio | Topes duros, sin `shadowBlur`, partículas al 60 %/30 % en Media/Baja (`G.Q`), medición paso 6. |
| 9 | **Confusión de lectura en la Tundra** (ola de ventisca sobre la bruma, derrape punteado) | Media | Medio | Telegrafías sobre la bruma (2.ª pasada), colores sólidos, doble contorno en firmas, regla del hielo con +220 ms. |
| 10 | **Panal se retrasa o cambia** (Avispón Real y Reina Joven) | Alta | Bajo | Solo reserva de datos; si el Panal se descarta, su `ready` queda `false` y no cuesta nada. |

---

## Resumen (máx. 10 líneas)
1. 8 minijefes (2 por bioma) + 2 de reserva (Panal), con orden fijo por rol: slot 1 a 3:30 (presión) y slot 2 a 5:30 (control), escalados por `G.vt()`; nunca dos a la vez ni dentro de `MINI_LAST`.
2. Nuevos: Carnero Mayor, Tejedora de Zarzas, Hidra Joven; rediseño: Alcaide de Hierro; pulido: Centinela y Plañidera (hoy solo son un tinte del Coloso/Colmena, requieren sprite propio), Yeti Mayor y Ventisquero.
3. Cada uno: 2 ataques propios + 1 firma que anticipa una mecánica del jefe, parte rompible con efecto, enrage al 50 %, Insignia (trofeo menor), debilidades por material A.8, HP 2400-3000, daño <= 32, telegrafías >= 400 ms con regla de esquiva (+220 ms en la Tundra), <= 3 adds.
4. Director: tabla `G.B.minis` por bioma con `ready`; los tipos `mini_bulwark`/`mini_hive` quedan como legado (`?minis=0`); botín y PF migran a slot; encargos `colossus`/`hive` pasan a "primer/segundo aviso".
5. Partes exclusivas: Jirón (Carnero, Plañidera), Escarcha (Tejedora, Centinela), Púa (Alcaide, Ventisquero), Placa (Hidra), Mecha (Yeti Mayor); recetas coherentes (`L.MAIN`/`L.SEC`); total de partes por run sin cambio.
6. Arte: 23 sprites nuevos + 2 ampliados, 256 frames (reserva Panal: 56); audio: 67 SFX + 4 stingers.
7. Plan en 7 pasos: infraestructura -> arte + audio + lógica en paralelo (Cripta/Tundra primero, Bosque/Asfódelo después) -> calibración con bot; ~21 días en un flujo, ~12-13 en paralelo.
8. Aceptación: TTK 40-70 s con la build de referencia, ningún minijefe mata a > 35 % de las partidas del bot, 0 incumplimientos de telegrafía, 0 errores de consola, regresión 0 de los jefes finales, fps >= anterior, partes por run a +-8 %.
9. Riesgos principales: volumen de arte, Hidra (cabeza hija/cauterización) y zonas persistentes que maten al jugador; mitigados con `ready` por bioma, topes de zonas y plan B de la cabeza.
10. Sin preguntas al dueño: las decisiones de orden, Insignias sin Esencia y partes exclusivas son datos reversibles.
