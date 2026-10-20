# Swarm Hand - Diseño v5: Familias de monstruos por bioma + Tundra (Yarlak) + Panal (Reina Abeja)

Estado: DISEÑO para implementar, sin código. Amplía `DESIGN-v2.md` (roster, regla de legibilidad), `DESIGN-v3-aldea.md` (forja, economía) y `DESIGN-v4-jefes.md` (jefes, Peligro, cacería). Estado real del código leído para este documento: `src/main.js` (`G.B.enemy`, `G.B.tier`, `G.B.tierCurve`, `G.B.light`), `src/waves.js` (director, packs, `capOf`), `src/enemies.js` (IA por tipo, `G.zones`, `slowT/slowPct`, guardianes con `e.variant`), `src/boss.js` + `boss_karceron.js` + `boss_letea.js` (motor de jefes, `DEFS`, `PELIGRO`, `EXIT`), `src/loot.js` (`L.DUR`, `L.GUARANTEED`, `L.DROPS`), `README.md` (calibración medida con el bot) y `ASSETS_API.md`.
Todas las cifras son punto de partida y se afinan con el bot (`tools/card-swarm-boss-bot/`, `tools/card-swarm-balance-bot/`). Convención de unidades: tiempos en ms o `m:ss` (escala de 9:00, igual que `from` en `G.B.enemy`), distancias en px de juego, velocidades en px/s, el jugador se mueve a 190 px/s, tamaños de sprite como `base (final x2)`.

Orden del documento: Parte A (familias de los 3 biomas actuales, propuesta ya aprobada) - Parte B (Tundra/Yarlak y Panal/Reina Abeja) - Parte C (plan por fases, assets y presupuesto de arte) - preguntas al dueño - resumen.

---

## 0. Decisiones de diseño en una pantalla

1. **El tipo es el rol; el bioma pone la piel.** Las 11 claves de `G.B.enemy` (`worm archer fanner boar bomb shield moth sower blinker scorcher warlock`) siguen siendo roles de IA. Cada bioma declara qué roles usa y con qué piel/ajustes (nombre, sprite, HP/vel/daño relativos, tier, entrada, peso, tope). Así **encargos, drops, `tierCurve`, packs, `allow` de jefes y bot siguen funcionando sin tocar nada**. Solo los monstruos nuevos (sin rol equivalente) añaden claves nuevas.
2. **Una familia = 8-9 monstruos con 1 mecánica nueva como máximo cada uno** (regla v2) y **la misma masa de amenaza que hoy** (se conserva el peso total por tier, ver A.2).
3. **El jefe llama a los suyos**: sus invocaciones y sus `allow` de fase resuelven a la familia del bioma sin cambiar los jefes (A.7).
4. **Debilidades por material** (13 materiales x 6 etiquetas, ajuste +-25 %), no por monstruo: es una tabla de 13 filas (A.8).
5. **Orden del Portal**: Pastor (Bosque) - Karceron (Cripta) - Letea (Asfodelo) - **Yarlak (Tundra)** - **Reina Abeja (Panal)**. Cada destino se abre al vencer al jefe anterior (como hoy).
6. **Tundra** añade tres sistemas: hielo que resbala (parámetros fijos y justos, con nieve firme), ventisca (visibilidad, nunca oculta telegrafías) y medidor de Frío (lo mitigan Fuego, hogueras y platos).
7. **Panal** añade: arena hexagonal con celdas que se abren/cierran, miel pegajosa (ralentiza a todos los terrestres), humo (el Fuego seda al enjambre) y un enjambre con tope duro.
8. **Jefes**: Yarlak 4 fases + desesperado (8 ataques, 3 partes), Reina 3 fases + desesperado (8 ataques, 3 partes). HP iniciales por fórmula v4 y `hpCal` a medir: 25 500 y 23 040 a 9 min.
9. **Arte**: 120 sprites / 759 frames en total (114 nuevos + 6 variantes de paleta), generados por código en el estilo vectorial actual; cualquier cosa que no llegue deja su tipo/bioma desactivado (nunca placeholder).
10. **Plan**: 9 fases, ~38 días en un solo flujo o ~26 con dos flujos; cada familia se publica antes que los jefes nuevos.

---

# PARTE A - FAMILIAS DE MONSTRUOS POR BIOMA (Bosque, Cripta, Asfodelo)

## A.1 Mecanismo (cómo se implementa sin romper nada)

Datos nuevos en `G.B` (una sola tabla, comentada, junto a `G.B.enemy`):

- `G.B.fam[bioma].use` = diccionario `clave de rol -> ajustes`. Campos de cada entrada: `name` (nombre visible), `spr` (sprite), `tier` (0-3, sustituye a `G.B.tier[clave]` en ese bioma), `from` (entrada en ms), `w` (peso), `cost`, `maxAlive`, `capGrow` (opcional: crecimiento máximo del tope en tier 3, ver A.2), `hp`/`spd`/`dmg` (multiplicadores sobre el valor base de `G.B.enemy[clave]`), `mat` (material, A.8) y `mods` (parámetros de la mecánica nueva). Una clave que **no aparece** en `use` no existe en ese bioma.
- `G.B.fam[bioma].packs`, `.light` (tipos permitidos con jefe vivo), `.ponds` (nº de charcos fijos), `.star` (candidatos a "tipo protagonista").
- `G.B.tierOf(clave)` lee `fam[G.curBiome].use[clave].tier` y, si no existe, `G.B.tier[clave]`. `E.spawn(clave, x, y)` mantiene la firma: aplica `hp/spd/dmg`, el sprite y los `mods` leyendo la familia activa (`G.curBiome`).
- Monstruos **nuevos** (`dog chainer salamander leech headlet frostwolf honeyslug pollinator`) se registran como claves nuevas en `G.B.enemy` y solo aparecen en la `use` de su bioma.
- Depuración: `?fam=0` desactiva las familias (comportamiento v4 exacto, para A/B con el bot); `?biome=` y `?boss=` siguen mandando.

Qué NO cambia: `bp(m)`, `cap(m)`, `hpMult`, `dmgMult`, `speedMul`, `tierCurve`, `tierFloor`, `G.Q.enemyMul`, `capOf` (salvo leer `tierOf`), la rotación del "protagonista" (x2,2 cada 60 s), packs (15 % por pulso desde 2:45), élites/guardianes a 3:30 y 5:30, jefe a 5/6 de la run.

## A.2 Cómo el director selecciona la familia, y cómo se conservan `tierCurve` y `maxAlive`

1. Al empezar la run, `G.curBiome` fija la familia. En cada pulso (1,5 s) la lista `types` del director = claves de `G.B.enemy` que estén en `fam[G.curBiome].use`, con `from <= vt` (o adelantadas por el encargo activo) y, con jefe vivo, además en `bm.allow` (la intersección deja fuera lo que el bioma no tiene: no hay que tocar los `allow` de Pastor/Karceron).
2. El peso efectivo sigue siendo `w x tierMul(tierOf(clave), m) x (2,2 si es el protagonista) x (2,5 si es el objetivo del encargo)`. `tierMul` usa la misma `tierCurve` y el mismo suelo 0,12.
3. **Conservación de masa por tier** (regla de diseño obligatoria para cualquier familia): la suma de `w` de cada tier debe ser igual a la del roster actual, para que la mezcla por minuto no cambie aunque haya menos tipos.

| Tier | Suma de `w` (obligatoria) | Suma de `maxAlive` base legada | Mínimo aceptado en una familia |
|---|---|---|---|
| 0 | 55 | 40 | 40 (un solo tipo, el chaser) |
| 1 | 44 (archer 20 + fanner 14 + bomb 10) | 26 | >= 65 % = 17 |
| 2 | 29 (boar 10 + shield 9 + moth 10) | 19 | >= 58 % = 11 |
| 3 | 25 (sower 7 + blinker 7 + scorcher 6 + warlock 5) | 12 | >= 67 % = 8 |

4. **Topes**: `maxAlive` es por tipo; `capOf` los escala con la curva (tier 3 puede crecer hasta x2,4 al final). Como en tier 3 hay menos tipos, cada uno tiene `capGrow` (tope máximo del crecimiento): un zonificador no debe pasar de 5-6 vivos ni un embestidor de 4-5. Fórmula: `tope = round(maxAlive x min(capGrow, max(1, tierMul)))`. Sin `capGrow` se aplica el comportamiento actual.
5. El hueco que dejan los topes lo rellena el chaser de tier 0 (suelo 0,12), igual que hoy.
6. **Verificación obligatoria** (tarea de `tools-engineer`, "censo"): a los minutos 3, 6 y 9 de 20 runs con bot, la proporción de enemigos por tier de cada familia debe estar a +-10 puntos de la del roster legado, y la suma de enemigos vivos a +-8 %.

### Tabla por bioma y tier (qué entra y cuándo)

| Tier | Bosque (Pastor) | Cripta (Karceron) | Asfodelo (Letea) |
|---|---|---|---|
| 0 | Cordero corrupto 0:00 | Esqueleto 0:00 | Alma errante 0:00 |
| 1 | Zarzal menor 0:45, Zarzal mayor 1:30 | Arquero de huesos 0:45, Calavera explosiva 1:30 | Sanguijuela 0:45, Rana ácida 1:30 |
| 2 | Jabalí 2:00, Polilla de lana 4:00 | Calavera rodante 2:00, Carcelero menor 2:45, Salamandra de lava 4:00 | Cabeza menor 2:00, Medusa helada 3:00 |
| 3 | Perro pastor 2:45, Micelio 4:30, Zampoñero 6:45 | Guardián de cadenas 4:30, Alma prisionera 5:15, Ascua 6:00 | Lirio del olvido 4:30, Anguila eléctrica 6:00, Sacerdotisa ahogada 6:45 |
| Nº de tipos | 8 | 9 | 8 |

(El Perro pastor es "nuevo" y de tier 3 por amenaza aunque entra pronto: con tier 3 su peso crece con la curva y `capGrow` lo frena.)
Los 4 roles que el Bosque deja de usar (`shield`, `bomb`, `blinker`, `scorcher`) viven en la Cripta como Carcelero, Calavera explosiva, Alma prisionera y Ascua; el Coloso Escudero y la Madre Colmena (guardianes) siguen en el Bosque (ver B.7, guardianes).

## A.3 Familia del BOSQUE - el rebaño del Pastor Corrupto

Estética: lana negra y crema, púas moradas, ojos naranja `#ff9a2a`, ropa granate (paleta del Pastor). Tema: "todo lo que rodea al Pastor es su rebaño o su aprendiz".

### Tabla del director y estadísticas
Base de comparación: valores de `G.B.enemy`. HP/vel/daño = multiplicador sobre el rol base (entre paréntesis el valor final).

| Nombre | Clave (rol) | IA base | Tier | Entra | w | Coste | maxAlive (capGrow) | HP | Vel | Daño | Mat. |
|---|---|---|---|---|---|---|---|---|---|---|---|
| Cordero corrupto | `worm` | Gusano | 0 | 0:00 | 55 | 1 | 40 | x1 (14) | x1 (70) | x1 (6) | Lana |
| Zarzal menor | `archer` | Arquero | 1 | 0:45 | 26 | 3 | 12 | x1,2 (12) | x1 (60) | x1 (8) | Vegetal |
| Zarzal mayor | `fanner` | Espinoso | 1 | 1:30 | 18 | 4 | 8 | x1 (16) | x1 (55) | x1 (6 x3) | Vegetal |
| Jabalí | `boar` | Jabalí | 2 | 2:00 | 14 | 5 | 8 | x1 (45) | x1 (55 / carga 340) | x1 (14) | Carne |
| Polilla de lana | `moth` | Polilla | 2 | 4:00 | 15 | 4 | 6 | x1 (14) | x0,9 (72) | x1 (5) | Lana |
| Perro pastor (NUEVO) | `dog` | Strafe + arreo (nueva) | 3 | 2:45 | 8 | 5 | 3 (x1,5 -> 4) | 24 | 125 (órbita) / 320 (arreo) | 8 + empuje 55 px | Lana |
| Micelio | `sower` | Sembrador | 3 | 4:30 | 9 | 5 | 3 (x1,7 -> 5) | x1 (22) | x1 (45) | x1 (8/tick) | Vegetal |
| Zampoñero | `warlock` | Brujo | 3 | 6:45 | 8 | 8 | 2 (x2 -> 4) | x1 (30) | x1 (50) | 0 (invoca) | Carne |

Sumas de control: tier 1 = 44, tier 2 = 29, tier 3 = 25. Topes: T1 20/26 (77 %), T2 14/19 (74 %), T3 8/12 (67 %).

### Telegrafía, arte y mecánica nueva

| Nombre | Telegrafía (>= 400 ms; regla 250 + 1000 x salida/190) | Sprite (base -> final) | Frames (incl. 5 `die`) | Mecánica nueva que exige |
|---|---|---|---|---|
| Cordero corrupto | Contacto (sin telegrafía, como el Gusano) | `enemy_bos_cordero` 20x20 -> 40x40 | 11: idle 2, walk 4, die 5 | Ninguna |
| Zarzal menor | `aim` 400 ms (parpadeo amarillo + línea fina), 1 espina recta vel 220 | `enemy_bos_zarzal` 24x24 -> 48x48 (compartido) | 13: idle 2, walk 4, aim 1, fire 1, die 5 | Ninguna (proyectil `proj_thorn_small` ya existe) |
| Zarzal mayor | Cono rojo 40 grados 500 ms, 3 espinas -14/0/+14 | mismo sprite a escala 1,15 y tinte oscuro (0 arte extra) | - | Ninguna |
| Jabalí | Rectángulo rojo de carga 600 ms (existente) | `boar` (existente) | - | Ninguna |
| Polilla de lana | Orbe de lana crema con **anillo azul claro** (azul = ralentiza) 450 ms de carga; ralentiza 30 % durante 2 s (no 35 %) | `enemy_bos_polilla` 20x20 -> 40x40 (variante de paleta de `enemy_moth`) + `proj_wool_orb` 12x12 | 11: fly 4, charge 1, throw 1, die 5 (+2 proyectil) | Ninguna |
| Perro pastor | **Ladrido** 450 ms (frena, anillo rojo r 28, línea fina roja hacia el punto de arreo); luego arreo 250 ms. Salida 30 px: 250 + 158 = 408 <= 450 | `enemy_bos_perro` 26x18 -> 52x36 | 14: idle 2, walk 4, bark 1, dash 2, die 5 | **Órbita**: rodea al jugador a 170-200 px, w = 1,1 rad/s, 1,6 s; luego el arreo lo empuja hacia el centro de la arena (reutiliza el empuje del Escudero) |
| Micelio | Igual que el Sembrador: `arm` 900 ms (círculo punteado), zona r 42 durante 4 s | `enemy_sower` (existente, es un hongo caminante) | - | Ninguna |
| Zampoñero | `cast` 500 ms con anillo morado, 2 Corderos cada 6 s (máx. 6); matarlo los disipa | `enemy_bos_zamponero` 20x24 -> 40x48 (variante de `warlock` con zampoña) | 9: idle 2, cast 2, die 5 | Ninguna |

Sinergias: el Perro cierra la salida del kiteo y lo manda hacia el enjambre; el Micelio y el Zampoñero castigan quedarse en el centro. Ya es "el Pastor": cada elemento es su rebaño.

## A.4 Familia de la CRIPTA DE BRASA - los presos de Karceron

Estética: hueso `#d8cfae`, magma `#ff6a1a`, hierro `#6b7385`, fondo violeta oscuro (paleta de Karceron). Tema: "presos, carceleros y fuego".

### Tabla del director y estadísticas

| Nombre | Clave | IA base | Tier | Entra | w | Coste | maxAlive (capGrow) | HP | Vel | Daño | Mat. |
|---|---|---|---|---|---|---|---|---|---|---|---|
| Esqueleto | `worm` | Gusano | 0 | 0:00 | 55 | 1 | 40 | x1,15 (16) | x0,95 (66) | x1 (6) | Hueso |
| Arquero de huesos | `archer` | Arquero | 1 | 0:45 | 30 | 3 | 14 | x1 (10) | x1 (60) | x1 (8) | Hueso |
| Calavera explosiva | `bomb` | Bomba | 1 | 1:30 | 14 | 2 | 6 | x1 (8) | x1 (105) | x1 (20, r 55) | Hueso |
| Calavera rodante | `boar` | Jabalí | 2 | 2:00 | 10 | 5 | 6 | x0,8 (36) | x1 (55 / rueda 300) | x1 (14) | Hueso |
| Carcelero menor | `shield` | Escudero | 2 | 2:45 | 10 | 5 | 6 | x1,1 (44) | x1 (48) | x1 (10) | Metal |
| Salamandra de lava (NUEVO) | `salamander` | Caminante con rastro (nueva) | 2 | 4:00 | 9 | 5 | 4 | 30 | 60 | 8 contacto + 5/400 ms en charco | Magma |
| Guardián de cadenas (NUEVO) | `chainer` | Distancia + proyectil de línea (nueva) | 3 | 4:30 | 8 | 6 | 3 (x1,5 -> 4) | 60 | 42 | 6 contacto + 6 cadena | Metal |
| Alma prisionera | `blinker` | Espectro | 3 | 5:15 | 9 | 6 | 4 | x1 (18) | x1 (65) | x1 (16) | Espectro |
| Ascua (magma) | `scorcher` | Ascua | 3 | 6:00 | 8 | 6 | 3 | x1 (30) | x1 (60 / dash 300) | x1 (12 + rastro 5) | Magma |

Sumas: tier 1 = 44, tier 2 = 29, tier 3 = 25. Topes: T1 20/26 (77 %), T2 16/19 (84 %), T3 10/12 (83 %). No usa `fanner`, `moth`, `sower` ni `warlock`; las invocaciones de Karceron (2 Ascuas + 1 Espectro) ya son de la familia.

### Telegrafía, arte y mecánica nueva

| Nombre | Telegrafía | Sprite | Frames | Mecánica nueva |
|---|---|---|---|---|
| Esqueleto | Contacto | `enemy_cri_esqueleto` 20x22 -> 40x44 | 11 | Ninguna |
| Arquero de huesos | `aim` 400 ms, flecha de hueso vel 220 | `enemy_cri_arquero` 22x22 -> 44x44 + `proj_bone_arrow` 16x6 | 13 (+2) | Ninguna |
| Calavera explosiva | Mecha 700 ms con parpadeo rojo, círculo r 60 (existente) | `enemy_cri_calavera_exp` 18x18 -> 36x36 | 12: walk 4, lit 2, prime 1, die 5 | Ninguna |
| Calavera rodante | `wind` 600 ms (rectángulo rojo 40 x 280). Rueda a 300 px/s; **rebota una vez** en pared/pilar: se aturde 400 ms ("ventana" x1,3) y muestra una flecha roja de 400 ms hacia el segundo tramo. Salida 50: 250 + 263 = 513 <= 600 | `enemy_cri_calavera_rod` 24x24 -> 48x48 | 15: idle 2, walk 2, wind 1, roll 4, stun 1, die 5 | **Rebote con segundo aviso** (reflejo de la trayectoria contra pared/obstáculo) |
| Carcelero menor | Empellón: `wind` 500 ms, abanico 90 grados alcance 40, `rec` 400 ms vulnerable (existente) | `enemy_cri_carcelero` 26x26 -> 52x52 | 14: idle 2, walk 4, wind 1, bash 1, rec 1, die 5 | Ninguna (escudo frontal x0,2 ya existe) |
| Salamandra de lava | Camina y deja **un charco cada 70 px** recorridos: r 22, `arm` 600 ms naranja punteado (sin daño) -> activo 5 s, 5/400 ms; máx. 6 charcos vivos por salamandra (se apaga el más viejo); al morir deja uno r 30 de 2 s. Salida 35: 434 <= 600 | `enemy_cri_salamandra` 30x16 -> 60x32 | 11: idle 2, slither 4, die 5 (charco = `fx_fire_cell` existente) | **Rastro continuo** de zonas (reutiliza `G.zones` y el rastro del Ascua, pero por distancia, no solo al cargar) |
| Guardián de cadenas | `wind` 700 ms (línea fina naranja hasta el jugador, fija los últimos 300 ms); lanza una cadena a 420 px/s, alcance 300: 6 de daño y **ralentiza 45 % durante 1,8 s** (aro azul bajo el jugador, el azul sigue significando "ralentizado"); cada 5 s | `enemy_cri_guardian_cadenas` 28x30 -> 56x60 + `proj_chain` 24x8 + `fx_chain_link` 16x16 | 14: idle 2, walk 4, wind 1, throw 2, die 5 (+3, +1) | **Proyectil de línea que ralentiza** (usa `p.slowT/slowPct`); no se puede interceptar con cartas, solo esquivar |
| Alma prisionera | Igual que el Espectro (`fade` 500 ms + tajo 350 ms) | `enemy_cri_alma` 22x26 -> 44x52 (variante de `enemy_blinker`, con grillete) | 11: float 2, fade 2, slash 2, die 5 | Ninguna |
| Ascua | Línea 600 ms, dash 500 ms con rastro de fuego (existente) | `enemy_scorcher` (existente) | - | Ninguna |

## A.5 Familia del ASFODELO DEL OLVIDO - el río de Letea

Estética: verde azulado `#2f6f6a`, crema `#e8e4d4`, acentos ácido `#7be34a`, hielo `#6ac8ff`, rayo `#ffe45a` (los tres colores de las cabezas de Letea). Tema: "el río del olvido: charcos, almas y cabezas que rebrotan". Nuevo en el bioma: **6 charcos fijos** (`G.ponds`, r 36) repartidos por la arena: decorado, punto de aparición de Sanguijuelas y Cabezas menores, y lugar donde "se esconde" lo que acecha.

### Tabla del director y estadísticas

| Nombre | Clave | IA base | Tier | Entra | w | Coste | maxAlive (capGrow) | HP | Vel | Daño | Mat. |
|---|---|---|---|---|---|---|---|---|---|---|---|
| Alma errante | `worm` | Gusano | 0 | 0:00 | 55 | 1 | 40 | x0,9 (13) | x1,1 (77) | x1 (6) | Espectro |
| Sanguijuela (NUEVO) | `leech` | Emboscada oculta (nueva) | 1 | 0:45 | 26 | 3 | 10 | 9 | 55 (nada 80) / lance 300 | 9 | Pantano |
| Rana ácida | `boar` | Jabalí (salto) | 1 | 1:30 | 18 | 4 | 8 | x0,5 (22) | x1 (55) + salto 220 px | 10 aterrizaje | Pantano |
| Cabeza menor (NUEVO) | `headlet` | Brota y muerde (nueva) | 2 | 2:00 | 14 | 5 | 5 | 30 | 0 (fija) | 12 mordisco | Pantano (Fuego x1,25) |
| Medusa helada | `moth` | Polilla | 2 | 3:00 | 15 | 4 | 6 | x1,1 (15) | x0,9 (72) | x1 (5) | Pantano (Fuego x1,25) |
| Lirio del olvido | `sower` | Sembrador | 3 | 4:30 | 9 | 5 | 3 (x1,7 -> 5) | x1 (22) | x1 (45) | 3/tick + enlentece cartas | Vegetal |
| Anguila eléctrica | `scorcher` | Ascua (hitscan) | 3 | 6:00 | 8 | 6 | 3 | x0,9 (27) | x1,1 (66) | 14 rayo + 10 contacto | Pantano (Rayo x0,75, Hielo x1) |
| Sacerdotisa ahogada | `warlock` | Brujo | 3 | 6:45 | 8 | 8 | 3 (x1,7 -> 5) | x1 (30) | x1 (50) | 0 (invoca) | Espectro |

Sumas: tier 1 = 44, tier 2 = 29, tier 3 = 25. Topes: T1 18/26 (69 %), T2 11/19 (58 %, el menor; lo compensa que la Cabeza menor puede reaparecer), T3 9/12 (75 %).

### Telegrafía, arte y mecánica nueva

| Nombre | Telegrafía | Sprite | Frames | Mecánica nueva |
|---|---|---|---|---|
| Alma errante | Contacto; semitransparente (alpha 0,8), **no colisiona con otros enemigos** (se apilan: ventaja para el área) | `enemy_asf_alma_errante` 20x22 -> 40x44 | 11 | Ninguna (solo sin separación entre enemigos) |
| Sanguijuela | Está **oculta en un charco** (solo se ve el anillo de ondas). Si el jugador pasa a < 150 px: burbujas + anillo rojo r 30 y línea al jugador 500 ms, **lance** recto de 140-220 px en 330 ms (9 de daño); queda **expuesta 1,2 s** (x1,3) y huye al charco. Salida 30: 408 <= 500 | `enemy_asf_sanguijuela` 18x10 -> 36x20 + `fx_pond_ripple` 48x24 | 10: swim 2, lunge 2, exposed 1, die 5 (+3) | **Oculto en charcos + emboscada con aviso** (estado `hidden`, `G.ponds`) |
| Rana ácida | Se agacha 500 ms; círculo rojo r 24 en el punto de aterrizaje (fijado al empezar, no predictivo); salto 400 ms; deja **charco ácido** r 28 (verde ácido, `arm` 600 ms, activo 3 s, 6/500 ms, usa el tipo de zona ácida de la Madre Colmena); descansa 700 ms (vulnerable). Ciclo ~2,6 s | `enemy_asf_rana` 26x22 -> 52x44 | 11: idle 2, crouch 1, air 1, land 1, rest 1, die 5 | **Salto balístico** (posición en arco, aterrizaje con zona) |
| Cabeza menor | **Brota de un charco**: burbujas y anillo rojo r 32 durante 700 ms, luego queda fija; muerde en un radio de 70 px con `wind` 500 ms (anillo rojo; salida 40: 461 <= 500). Si muere **sin quemarse** (el último golpe no es Fuego y no tiene quemadura), **rebrota en 8 s** con 60 % de HP, máx. 2 veces; solo da XP/Ceniza/drop la primera vez | `enemy_asf_cabeza_menor` 28x36 -> 56x72 | 17: emerge 4, idle 2, bite 2, stump 1, regrow 3, die 5 | **Rebrote y cauterización** (enseña la mecánica de las cabezas de Letea) |
| Medusa helada | Orbe de hielo: carga 450 ms (línea azul), ralentiza 35 % durante 2 s (existente); el orbe se destruye con cualquier golpe | `enemy_asf_medusa` 24x28 -> 48x56 (reusa `proj_frost_orb`) | 11: float 4, charge 1, throw 1, die 5 | Ninguna |
| Lirio del olvido | `arm` 900 ms, zona r 42 durante 4 s de **color turquesa `#7fffe0`** (nuevo color de peligro: "olvido"); dentro: 3 de daño cada 500 ms y las cartas **recargan 40 % más lento** (+2 s tras salir). Máx. 5 zonas por Lirio. Aparece un icono de reloj roto sobre la mano mientras dura | `enemy_asf_lirio` 22x24 -> 44x48 + `fx_olvido_zone` 96x96 | 13: idle 2, walk 4, sow 2, die 5 (+3) | **`p.cdSlow` (ms y %)**: los cooldowns de `weapons.js` avanzan a (1 - %) de velocidad |
| Anguila eléctrica | Carril rojo 18 x 300, `wind` 700 ms (fija los últimos 300 ms); **rayo instantáneo** de 150 ms sobre todo el carril (14) y después carga de 300 px/s (contacto 10); descansa 800 ms (vulnerable). Salida 20: 355 <= 700 | `enemy_asf_anguila` 40x14 -> 80x28 + `fx_lightning_lane` 32x32 (tile) | 14: idle 2, slither 4, wind 1, dash 1, rec 1, die 5 (+3) | **Línea instantánea telegrafiada** (daño de carril, sin rastro persistente) |
| Sacerdotisa ahogada | `cast` 500 ms (anillo morado), 2 Almas errantes cada 6 s (máx. 6); matarla las disipa | `enemy_asf_sacerdotisa` 24x28 -> 48x56 (variante de `warlock`) | 12: idle 2, float 3, cast 2, die 5 | Ninguna |

## A.6 Mecánicas nuevas de la Parte A (resumen para el programador)

| Id | Mecánica | La usan | Dónde cuelga | Riesgo |
|---|---|---|---|---|
| M1 | Órbita (strafe) + arreo con empuje hacia el centro | Perro pastor | `enemies.js` IA nueva `ai_dog` (estados `orbit -> bark -> dash -> rec`) | Bajo |
| M2 | Rebote de carga con segundo aviso | Calavera rodante | variante de `ai_boar` | Medio (colisión con pared/pilar) |
| M3 | Rastro continuo de zonas por distancia | Salamandra | `G.zones` con `life` 5000 | Bajo (límite 6 por salamandra) |
| M4 | Proyectil de línea que ralentiza | Guardián de cadenas | proyectil enemigo + `p.slowT` | Bajo |
| M5 | Charcos fijos `G.ponds`, enemigo oculto y emboscada | Sanguijuela, Cabeza menor | `enemies.js` + dibujo de suelo | Medio |
| M6 | Salto balístico | Rana ácida | variante de `ai_boar` | Bajo |
| M7 | Rebrote / cauterización (último golpe, `burnT`) | Cabeza menor | `Combat.kill` guarda `e.lastTag` | Medio |
| M8 | Línea instantánea telegrafiada | Anguila | variante de `ai_scorcher` | Bajo |
| M9 | `p.cdSlow` (cooldowns de cartas más lentos) | Lirio del olvido | `weapons.js` (un factor al avanzar el cooldown) + HUD | Medio (toca el núcleo de cartas; acotar 40 % y 2 s) |
| M10 | Sin separación entre enemigos | Alma errante | `enemies.js` (flag `nosep`) | Bajo |

## A.7 Regla común 1: el jefe llama a los de su bioma

Cambios por datos, sin tocar la lógica de los jefes (las invocaciones piden claves de rol y la familia las viste):

| Jefe | Invocación | Qué sale ahora | Nota |
|---|---|---|---|
| Pastor (Llamada del rebaño, 2 en F1-F2, 3 en F3, cd 22 s) | `fanner`, `shield`, `moth` -> sustituir `shield` por `dog` | Zarzal mayor, Perro pastor, Polilla de lana (con el Cayado roto: Corderos) | El `light` del Bosque: `worm archer fanner moth` |
| Karceron (Penitentes) | 2 `scorcher` (+1 `blinker` en F3) | 2 Ascuas (+1 Alma prisionera) ya son de la familia | Peligro III+: +1 Guardián de cadenas en F3 (variante opcional) |
| Letea (Plañideras) | 3 `moth` | 3 Medusas heladas (4 en Peligro II) | `allow` de Letea: añadir `leech` y `boar` (Rana) para que el spawn de fase no quede solo en gusanos |
| Letea (cabeza rebrotando) | - | Opcional Peligro IV: cada cabeza que rebrota deja una Cabeza menor en el charco más cercano si hay hueco en el tope de adds | Refuerza el tutorial de cauterización |

Los `allow` de fase de Pastor y Karceron no cambian: el director intersecta con la familia. Para cada fase de cada jefe, la intersección no debe quedar vacía (test automático en el censo).

## A.8 Regla común 2: debilidades y resistencias por bioma (tabla completa, +-25 %)

Se definen por **material** (no por monstruo). Cada enemigo normal o guardián tiene un `mat` y opcionalmente 1-2 excepciones. El multiplicador se aplica en `Combat.deal`/`Combat.dot` sobre el daño de la etiqueta de la carta (también a los ticks de estados), **antes** de los multiplicadores de resonancia/talentos, y se limita a [0,75 ; 1,25]. Los jefes mantienen su propia tabla `weak/resist` (no se suman a esta). Los adds de un jefe sí usan los materiales de su familia.

| Material | Fuego | Hielo | Rayo | Veneno | Sangre | Acero | Quién |
|---|---|---|---|---|---|---|---|
| Carne | 1 | 1 | 1 | 1 | 1 | 1 | Jabalí (Bosque), Zampoñero |
| Lana | **1,25** | 0,75 | 1 | 1 | 1 | 1 | Cordero, Polilla de lana, Perro pastor |
| Vegetal | **1,25** | 1 | 1 | 0,75 | 0,75 | 1 | Zarzal (2), Micelio, Lirio del olvido |
| Hueso | 1 | 1 | 1 | 0,75 | 0,75 | **1,25** | Esqueleto, Arquero de huesos, Calavera (2) |
| Metal | 1 | 1 | **1,25** | 0,75 | 1 | 0,75 | Carcelero menor, Guardián de cadenas |
| Magma | 0,75 | **1,25** | 1 | 0,75 | 1 | 1 | Ascua, Salamandra de lava |
| Espectro | 1 | 1 | **1,25** | 1 | 0,75 | 0,75 | Alma prisionera, Alma errante, Sacerdotisa ahogada |
| Pantano | 1 | 0,75 | **1,25** | **1,25** | 1 | 1 | Sanguijuela, Rana, Cabeza menor, Medusa, Anguila |
| Pelaje | 1 | 0,75 | 1 | 1 | **1,25** | 1 | Lobezno, Cazador, Lobo, Oso, Yeti, Chamán (Tundra) |
| Escarcha | **1,25** | 0,75 | 1 | 1 | 1 | **1,25** | Murciélago de hielo, Estalagmita viva, Espíritu de nieve (Tundra) |
| Insecto | **1,25** | **1,25** | 1 | 0,75 | 1 | 1 | Obrera, Aguijonera, Zángano, Avispa, Polinizador, Nodriza (Panal) |
| Cera | **1,25** | 1 | 0,75 | 1 | 1 | 1 | Guardia de cera (Panal) |
| Miel | 1 | **1,25** | 1 | 0,75 | 1 | 1 | Larva explosiva, Babosa de miel (Panal) |

Excepciones por monstruo: Medusa helada y Cabeza menor Fuego x1,25 (el fuego cauteriza/derrite); Anguila eléctrica Rayo x0,75 y Hielo x1; Espíritu de nieve Acero x0,75 y Rayo x1,25 (incorpóreo); Yeti: su placa de hielo cuenta como Escarcha (ver B.3).

**Lectura por bioma** (lo que ve el jugador en el Portal como chips "mejor / peor", con los iconos `icon_weak`/`icon_resist` ya existentes):

| Bioma | Mejor | Peor | Coherencia con su jefe |
|---|---|---|---|
| Bosque | Fuego (5 de 8 tipos) | Hielo (lana), Veneno/Sangre (vegetal) | Pastor: Fuego x1,25, Veneno x0,8 |
| Cripta | Hielo (magma), Acero (hueso), Rayo (metal/espectro) | Fuego (magma), Veneno y Sangre (hueso) | Karceron: Hielo/Rayo, resiste Fuego/Veneno |
| Asfodelo | Rayo (7 de 8), Veneno (pantano) | Hielo, Acero y Sangre (espectro) | Letea: Veneno/Sangre/Rayo en el agua, Hielo x0,8 |
| Tundra | Sangre (pelaje), Fuego y Acero (escarcha) | Hielo (todo) | Yarlak: Fuego/Rayo, resiste Hielo x0,6 |
| Panal | Fuego e Hielo (insectos) | Veneno, Rayo (cera) | Reina: Fuego/Hielo, Veneno inmune, Rayo x0,8 |

Cada etiqueta tiene al menos un bioma donde brilla y uno donde sufre: ninguna build "gana gratis" y la elección del destino del Portal pasa a ser parte de la estrategia.
UI: los números de daño se tiñen (verde claro con "!" si x1,25; gris si x0,75) y el Portal muestra los chips del bioma elegido.

## A.9 Packs temáticos por bioma (15 % por pulso desde 2:45, coste = suma x 0,6, solo si están desbloqueados todos sus tipos)

| Bioma | Packs |
|---|---|
| Bosque | **Cruce**: 2 Zarzal mayor en lados opuestos. **Campo**: 2 Micelios + 4 Corderos. **Pastoreo**: 2 Perros pastores opuestos + 3 Corderos. **Fila del Zampoñero**: 2 Jabalíes en línea + Zampoñero detrás |
| Cripta | **Fila de presos** (línea): 3 Carceleros + 1 Alma prisionera detrás. **Hornos** (pinza): 2 Ascuas opuestas + 1 Salamandra. **Boliche**: 2 Calaveras rodantes opuestas + 3 Esqueletos. **Cadena de presos**: 1 Guardián de cadenas + 2 Carceleros |
| Asfodelo | **Pantano**: 3 Sanguijuelas junto a charcos + 3 Almas errantes. **Pinza eléctrica**: 2 Anguilas opuestas + 1 Medusa. **Campo de lirios**: 2 Lirios + 4 Almas. **Coro**: Sacerdotisa + 4 Almas |

(Packs de Tundra y Panal en B.3 y B.6.)

## A.10 Drops, XP y encargos

- `L.DROPS` sigue por clave de rol (las claves legadas conservan su parte). Monstruos nuevos: `dog` Colmillo 0,13; `salamander` Mecha 0,14; `chainer` Placa 0,14; `leech` Escarcha 0,13; `headlet` Púa 0,14 (solo la primera muerte). Todo x `L.DROP_MUL` 0,70 como hoy. XP/Ceniza: el valor del rol base +-1 (Perro 4/3, Salamandra 5/3, Guardián 6/3, Sanguijuela 2/1, Cabeza menor 4/3).
- Encargos de Vesper: siguen contando por clave de rol, así que "Caza 40 Polillas gélidas" cuenta Polillas de lana, Medusas o Murciélagos según el bioma, y el director da x2,5 de peso al objetivo solo si **existe en la familia del bioma elegido** (si el encargo es de un rol ausente en ese bioma, el Portal avisa "este encargo no avanza en este destino"). Nuevos encargos: "Cauteriza 12 Cabezas menores" (Asfodelo), "Apaga a 3 Perros pastores" (Bosque), "Rompe 10 Calaveras rodantes antes de que reboten" (Cripta).
- Economía v5 sin cambios: el censo exige que las partes por run medidas con el bot (123 a 9 min) queden a +-15 % del valor actual en cada bioma.

## A.11 Criterios de aceptación de la Parte A

1. Censo por tier (A.2) dentro de +-10 puntos y enemigos vivos +-8 % en los 3 biomas a los minutos 3/6/9.
2. Cada tipo aparece al menos una vez en el 95 % de las runs de 9 min con bot; ninguno supera su `maxAlive` ni su `capGrow`.
3. Auditoría automática de telegrafías: las 21 telegrafías nuevas cumplen `tele >= 250 + 1000 x salida/190` y son >= 400 ms (script `tools-engineer`).
4. Ningún tipo nuevo supera el 10 % de los enemigos en pantalla; máximo 60 proyectiles enemigos; sin regresión de fps (Pastor de referencia: 57,7 fps antes del jefe en Chromium sin GPU).
5. Bot de balance (8 runs por bioma): partes/Brasas/XP a +-15 % de los valores de README "Economía v5"; victoria del bot de jefe en Peligro I dentro de +-10 puntos de la tabla actual (Pastor 69 %, Karceron 60 %, Letea 52 %).
6. `?fam=0` reproduce v4 exactamente (misma semilla, mismos spawns).

---

# PARTE B - DOS BIOMAS Y DOS JEFES NUEVOS

## B.0 Visión común

| | Yarlak, el Coloso Gélido | Melaria, la Reina Abeja |
|---|---|---|
| Bioma | **Tundra** (hielo, ventisca, frío) | **Panal** (cera hexagonal, miel, zumbido) |
| Fantasía | Un mamut-glaciar que carga con inercia y manda a su manada | Una reina que gobierna un enjambre y se cura con jalea real |
| Mecánica de bioma | Hielo que resbala + ventisca + Frío | Celdas hexagonales + miel + humo |
| Jefe | 4 fases + desesperado, 8 ataques, 3 partes | 3 fases + desesperado, 8 ataques, 3 partes |
| Debilidad | Fuego, Rayo (F3-F4) | Fuego, Hielo (F2-F3) |
| Resistencia | Hielo x0,6, Veneno x0,8 | Veneno inmune (estados) y x0,5 directo, Rayo x0,8 |
| Familia | 9 monstruos | 9 monstruos |
| HP inicial (9 min, Peligro I) | base 8500 x hpCal 3,0 = **25 500** | base 7200 x hpCal 3,2 = **23 040** |

**Desbloqueo y orden de portal (justificado).** Pastor -> Karceron -> Letea -> **Yarlak** -> **Reina Abeja**.
- Yarlak va cuarto porque enseña tres sistemas nuevos (resbalar, Frío, ventisca) y su contrapeso natural es el Fuego, que es el primer árbol que casi todos los jugadores completan; Letea ya ha enseñado ralentizaciones por charcos (30 %) y ataques con "huecos", base de lectura de la ola de Yarlak.
- La Reina va última porque exige las habilidades más completas: priorizar objetivos (Polinizador), limpiar adds en área, leer varios sistemas a la vez (miel + enjambre + partes) y es la que más entidades puede tener en pantalla (mayor riesgo de rendimiento: se valida con todo lo demás ya estable).
- Reglas: el Portal muestra los 5 destinos como chips de 150 x 52 px (5 x 150 + huecos <= 960); `Boss.BIOME_BOSS` añade `tundra: 'yarlak'`, `panal: 'reina'`; `Save.data.bossKills` añade `yarlak` y `reina`; Tundra se abre al vencer a Letea, Panal al vencer a Yarlak. El orden se guarda como dato (`UNLOCK_ORDER`): si la mecánica de hielo diera problemas graves se puede publicar la Reina antes sin tocar código.
- Cada jefe nuevo da PF 2 (3 la primera vez) y +1 PF extra la primera vez en Peligro III y V, como los demás. El techo global de 24 PF **no cambia**: con 5 jefes se alcanzará antes, pero el cuello de botella sigue siendo Brasas (README "Economía v5").

---

## B.1 TUNDRA - el mundo (hielo, ventisca, Frío)

### B.1.1 Arena
Arena estándar 1440 x 810, suelo "hielo negro" (azul oscuro `#2a4f8a` con brillos `#9fd8ff`) con **5 parches de nieve firme** y el resto hielo.

| Elemento | Datos |
|---|---|
| Nieve firme | 5 discos: (270,200), (1170,200), (720,405), (270,610), (1170,610); r 110 (F1-F2), 90 (F3), 70 (F4 y desesperado). Textura de puntos crema `#e8eef5` (se distingue por **patrón**, no solo por color: hielo = diagonales brillantes, nieve = puntos). Borde de transición de 24 px |
| Hogueras | 5, una en el centro de cada parche; calor r 64 (-10 %/s de Frío dentro). En el desesperado crecen a r 120 |
| Estalagmitas (obstáculo) | 8 pilares de hielo r 22, 300 HP, bloquean proyectiles enemigos; los rompen la Embestida, la Cornada y el Alud; se reconstruyen a los 45 s con aviso. Posiciones: (480,280) (960,280) (480,530) (960,530) (720,240) (720,570) (300,405) (1140,405) |
| Grietas | 5 fisuras lineales (160-240 x 16 px) entre parches. Seguras de cruzar. Si el Pisotón cae a < 120 px, la grieta **se abre** 8 s en un tramo de agua helada (ralentiza 40 %, +6 de Frío/s, sin daño) |
| Invariante de justicia | desde **cualquier** punto de la arena hay nieve firme a **<= 260 px** del borde de algún parche (con parches de r 70: máximo medido en la geometría anterior 245 px; se valida con `G.Boss.iceCoverage()`) |

### B.1.2 Física del hielo (jugador y enemigos) - parámetros fijos y tablas

El jugador conserva la velocidad máxima de 190 px/s. Sobre hielo cambia **cómo llega** a esa velocidad y cómo se detiene. Modelo:
- Con entrada: la velocidad se acerca al objetivo (entrada x 190) con constante de tiempo **tau**: `v += (objetivo - v) x (1 - e^(-dt/tau))`.
- Sin entrada: la velocidad decae como `v x e^(-lambda x dt)` (fricción).
- Transición entre superficies: interpolación de tau/lambda en 120 ms (sin saltos).

| Parámetro | Nieve firme (= juego actual) | Hielo | Hielo con "Crampones" (nodo de Ruta) | Estado Escarcha (Frío 100 %) |
|---|---|---|---|---|
| tau de aceleración | 0 ms (instantáneo) | **220 ms** (95 % de la velocidad en 660 ms) | 140 ms | 300 ms |
| lambda de fricción | infinita (para en seco) | **2,2 s^-1** (vida media 315 ms) | 3,2 s^-1 | 1,8 s^-1 |
| Distancia de derrape desde 190 px/s | 0 | **86 px** | 59 px | 106 px |
| Velocidad máxima | 190 | 190 | 190 | 190 x 0,65 |
| Retroceso por golpe (kb 60 px) | x1 | x1,6, tope 100 px | x1,2 | x1,6 |
| Cambio de sentido (190 a -190) | instantáneo | 150 ms hasta cruzar cero | 95 ms | 205 ms |

Enemigos: tau generica **300 ms** (giran abiertos: es una virtud para las cartas de área); los que "cargan" tienen perfil propio (B.3). Los proyectiles y los jefes voladores no se ven afectados.

**Regla de esquiva adaptada al hielo** (sustituye a la de v4 en Tundra): `telegrafía >= 250 + 220 + 1000 x salida/190` ms (los 220 ms extra son el coste de arrancar: es tau). Los ataques de >= 25 de daño nunca bajan de 800 ms; el Peligro puede recortar como máximo -10 % y nunca por debajo de la regla. El último 30 % de la telegrafía (en vez del 25 %) deja el contorno sólido y fijo. En Tundra el recorte de Peligro se mide sobre este valor.
**Anti-frustración**: (1) nieve firme en todo el mapa a <= 260 px; (2) el derrape nunca supera 100 px aun con retroceso; (3) los jefes no usan ataques de 1 solo golpe de > 32; (4) opción en Ajustes > Accesibilidad **"Hielo suave"** (tau 140 ms, lambda 3,2, kb x1,2) y **"Ventisca ligera"** (radio de visión +80), por defecto desactivadas; (5) tau y lambda son constantes de `G.B.ice` para ajustar con el bot.

### B.1.3 Ventisca (visibilidad)
- Es una capa de pantalla, nunca del mundo: un recorte circular centrado en el jugador de **r 330 px** totalmente despejado y que desde 330 a 520 px sube a alpha 0,55 de bruma blanca con rayas de nieve en diagonal (loseta `fx_blizzard_tile` 256x256 desplazándose).
- Ciclo: calma 25 s (alpha máximo 0,15) -> ráfaga 8 s (0,45) con inclinación del viento 20 grados -> calma...; en el combate contra Yarlak las ráfagas las dispara su fase (F3 y F4 más densas; desesperado a 0,6).
- **Orden de dibujo**: mundo -> bruma -> **telegrafías, proyectiles enemigos y barras del jefe** (por encima de la bruma, con el contorno oscuro de siempre) -> HUD. Los enemigos lejanos pierden hasta un 35 % de opacidad, **las telegrafías no**. Criterio medible: contraste del contorno de una telegrafía sobre la bruma máxima >= 3:1.
- Rendimiento por calidad: Alta = 120 rayas + bruma; Media = 50 rayas; Baja = solo degradado estático en los bordes (cero partículas).

### B.1.4 Medidor de Frío
- Valor 0-100 %. Barra de 140 x 10 px bajo la barra de vida (icono `icon_frio` + número) y, en móvil, además una escarcha en las esquinas de la pantalla cuya opacidad sigue el valor (para leerlo sin mirar la barra).
- **Sube**: +1,5 %/s base en Tundra; x1,5 durante las ráfagas; +4 por tick del Aliento polar; +8 por Murciélago o Cazador que impacta; +6 por Cazador; x2 dentro de 200 px de un Chamán del aullido.
- **Baja**: -10 %/s dentro de una hoguera; -0,8 por baja con carta de Fuego (máx. -4/s); y pasivo por cartas en la mano: **Fuego -0,35 %/s por carta, Sangre -0,20, Hielo -0,15** (máx. 3 cartas por etiqueta). Una mano con 3 cartas de Fuego queda en +0,45 %/s (casi nunca se llena); una sin Fuego/Sangre/Hielo se llena en ~67 s y tendrá que ir a una hoguera.
- **Platos** (Tía Castaña): "Caldo de brasa" -35 % de ganancia (4 partes + 60 Brasas); nodos de Ruta: Abrigo de escarcha -30 %, Brasa en el pecho (B.7).
- **Efectos**: >= 40 % escarcha en los bordes; >= 70 % "Helado": -15 % de velocidad y tau +60 ms; **100 % = Escarcha**: -35 % de velocidad de movimiento y las cartas recargan 25 % más lento durante 5 s, el medidor baja a 55 % y hay 8 s de inmunidad al relleno. Nunca mata ni hace daño.
- Duración de la run: `L.DUR.cold` = 0,90 / 1,00 / 1,10 (Rápida/Normal/Larga) para que la exposición por minuto virtual sea comparable. Al aparecer el jefe el medidor pasa a 20 %. En cacería la ganancia base es x0,8 (no hay horda).

---

## B.2 YARLAK, EL COLOSO GÉLIDO (Tundra)

**Lore (1 línea):** Yarlak era el mamut que guardaba la última hoguera del norte; cuando se apagó, el hielo creció dentro de él, y el invierno camina ahora donde él pisa.

**Identidad y silueta:** mamut-glaciar. Cuerpo de mamut enorme con pelaje blanco-grisáceo `#e8eef5` (sombra `#8fa4bf`), **placas de hielo azul** `#9fd8ff`/`#2a4f8a` fusionadas en el lomo y el cuello (parte rompible), dos **colmillos curvos de marfil helado** `#f1ead2` de casi la mitad de su altura (partes rompibles), trompa que se alza para rugir y, en el pecho, bajo una costra translúcida, el **corazón helado** `#5ff0ff` que late (la ventana). Ojos: F1 azul claro `#8fdcff`, F2 blanco, F3 cian `#5ff0ff`, F4 amarillo pálido `#fff3a0` (sin rojo: el rojo es siempre peligro). Silueta reconocible en negro: cuerpo corto y alto, joroba, colmillos curvos hacia delante, trompa; sin cuernos ni lana de cordero (no se parece al Pastor).

**Tamaño:** 300 x 250 px finales incluidos colmillos y trompa (cuerpo 224 x 160 + cabeza 112 + colmillos 56 x 120). `r` del cuerpo 96. Velocidad de paso F1 55 / F2 65 / F3 75 / F4 85 px/s (el jugador 190). Camina (patas de ciclo 4 frames) y **no** vuela. Entrada: asoma entre la ventisca (alpha 0 -> 1 en 500 ms), un paso pesado (shake 3/90), segundo paso (6/180), tercer paso al centro con shake 8/220 y onda de nieve sin daño; sombra grande en `drawGround`.

**HP y calibración.** Base 8500; `hpCal` inicial **3,0**. `HP = base x hpCal x durMul x Peligro`:

| Duración | I (x1,00) | II (x1,15) | III (x1,30) | IV (x1,50) | V (x1,75) |
|---|---|---|---|---|---|
| Rápida 7 min (x0,75) | 19 125 | 21 994 | 24 863 | 28 688 | 33 469 |
| Normal 9 min (x1,00) | **25 500** | 29 325 | 33 150 | 38 250 | 44 625 |
| Larga 10 min (x1,10) | 28 050 | 32 258 | 36 465 | 42 075 | 49 088 |

Cálculo de partida (DPS medido contra un único objetivo: p25 120 / p50 210 / p75 295): el p50 con la mano de referencia (Chispa 3 Fuego x1,25; Dardo 2 Veneno x0,8; Esquirla 2 Hielo x0,6; Daga 2 y Colmillo 1 neutros) rinde ~195 de media; contando la Armadura (x0,75 hasta romperla) el p50 debe durar **125-145 s** (objetivo 90-150, Furia a 150 s). `hpCal` esperado entre 2,6 y 3,4: Yarlak es de los más largos (es móvil, su armadura protege y Hielo está resistido) pero más corto que el Pastor (4,0) porque tiene dos debilidades. Se mide con el bot (16 peleas por mano) y se ajusta **solo** `hpCal`. Las reglas `HIT_CAP` 32 y salvavidas (+1 corazón en cada puerta y cada parte rota) se heredan.

### Fases (4 + desesperado; 3 puertas)
| Fase | HP | Nombre | Cadencia | Qué cambia | Spawn normal (`allow`, tope) |
|---|---|---|---|---|---|
| F1 | 100-70 % | Primera nevada | 3,0 s | Ataques 1, 2, 3, 4, 7. Nieve firme r 110 | x0,25: `worm archer`, tope 15 |
| F2 | 70-45 % | La manada | 2,6 s | Añade 5 (Llamada), 6 (Alud). Las grietas pueden abrirse. Puerta inmune 3 s + 2 corazones | x0,25: `worm archer frostwolf`, tope 15 |
| F3 | 45-20 % | Corazón helado | 2,2 s | Añade 8 (Ventisca blanca). La costra del pecho se agrieta (el Corazón se aprecia). Nieve firme r 90. Ventisca más densa. Puerta + 2 corazones | x0,15: `worm`, tope 8 |
| F4 | 20-0 % | Invierno eterno | 1,9 s | Todos los ataques. Nieve firme r 70. Ventisca máxima; las hogueras no se apagan | 0 (solo adds del jefe) |
| Desesperado | < 8 % | Invierno Eterno | - | Ver abajo | 0; `kill(e, true)` a las zonas viejas |

HP no baja de 70 / 45 / 20 % hasta que dispare la transición. Cada fase dura >= ~15 s aunque la build sea absurda.

### Ataques (8) - tele = telegrafía (con la regla del hielo), salida = px para librarse
| # | Nombre | Fases | Telegrafía | Patrón | Daño | cd | Regla 250 + 220 + 1000 x salida/190 |
|---|---|---|---|---|---|---|---|
| 1 | **Pisotón de glaciar** | 1-4 | 1100 ms: círculo rojo r 130 bajo él, luego **anillo de hielo** con hueco de 70 grados | Pisa (shake 8/220); onda anular de 24 px de grosor a 190 px/s con hueco de 70 grados; brotan **3 estalagmitas** a 160-220 px (cada una se avisa 900 ms antes con un círculo rojo r 26; si caen sobre el jugador: 12 + empuje). Si cae a < 120 px de una grieta, la abre | 22 | 8 s | salida 110: 996 <= 1100 |
| 2 | **Embestida glaciar** (firma) | 1-4 | 1200 ms: carril rojo 110 x 560 que se fija los últimos 350 ms + **tramo de derrape** de 220 px dibujado punteado y más claro | Acelera de 0 a 460 px/s en 750 ms (inercia), recorre el carril y derrapa. Si choca con pared/estalagmita: aturdido 2,4 s (**ventana x1,35**) y rompe la estalagmita; sin choque: se detiene tras el derrape y descansa 1,2 s (x1,1). Doble contorno + viñeta roja | 30 | 9 s | salida 60: 786 <= 1200 |
| 3 | **Cornada ascendente** | 1-4 (requiere Colmillos) | 950 ms: cono rojo 90 grados, alcance 220 | Barre con los colmillos de abajo arriba; golpe y empuje de 90 px (en hielo hasta 100) | 24 | 7 s | salida 80: 891 <= 950 |
| 4 | **Aliento polar** | 1-4 | 1150 ms: cono azul 50 grados, alcance 480, flecha de barrido | Cono estático que barre 30 grados en 1,2 s: 7 de daño cada 250 ms y +5 de Frío por tick. Las estalagmitas lo bloquean | 7/tick | 11 s | salida 120: 1102 <= 1150 |
| 5 | **Llamada de la manada** | 2-4 | 900 ms: anillo morado + aullido | Invoca 2 Lobos de escarcha (F2), 3 (F3-F4); en F4 +1 Cazador. Tope de adds 4 (6 en Peligro V) | 0 | 20 s | - |
| 6 | **Alud** | 2-4 | 1000 ms para el primer impacto: círculos rojos r 50 (sombras) | 8 bloques caen en secuencia cada 220 ms sobre una línea que cruza la arena; los 3 primeros sobre la trayectoria del jugador. Cada bloque deja 6 s un **bloque de hielo** r 22 (obstáculo que bloquea proyectiles) | 18 | 14 s | salida 60: 786 <= 1000 |
| 7 | **Latido gélido** (ventana) | 1-4 | 1300 ms: rosquilla roja (interior 100, exterior 280); el pecho brilla | Pulso de onda r 280 con **zona segura interior** (pegado al cuerpo = seguro: premia auras/orbitales); +20 de Frío. Después el pecho queda abierto 4 s (5,5 s si la Armadura está rota): **Corazón x2,0**, cuerpo x1,35; la barra se pone blanca-azulada. Cierra con 1 Aliento corto avisado 700 ms | 20 | 22 s | salida 130: 1154 <= 1300 |
| 8 | **Ventisca blanca** | 3-4 | 1250 ms: flechas azules y banda roja de 120 px en un borde | 3 olas consecutivas (cada 1,5 s) de 120 px que cruzan la arena a 260 px/s con 1 hueco de 140 px cada una (posición avisada); empujan en su dirección. Durante 6 s la ventisca sube a alpha 0,45 | 14 + empuje | 24 s | salida 140: 1207 -> telegrafía 1250 |

Ningún ataque tiene un golpe > 32. Los ataques firma (2, 7) usan viñeta roja de 6 % y sonido ascendente; el 7 y el 2 cuentan con una **cuenta atrás** visible. Cadencia mínima entre ataques 0,3 s; saco barajado sin repetir.

**Ataque desesperado - Invierno Eterno (< 8 %):** 10 s. Yarlak se planta rugiendo en el centro y, durante 10 s: (a) la ventisca sube al máximo (alpha 0,6, radio despejado 260 px); (b) las 5 hogueras crecen a r 120 y los parches se encogen a r 70: son los únicos sitios donde el Frío baja; fuera, el Frío sube a +6 %/s (llegar a 100 solo ralentiza); (c) cada 1,4 s sale de él una **oleada de 12 carámbanos** (vel 170, 10 de daño) con 2 huecos de 45 grados, rotando 18 grados por oleada; (d) está quieto y vulnerable (cuerpo x1,25, Corazón x2,0, cuerpo expuesto con el pecho abierto). Si lo matas durante el desesperado: "congelado" de 400 ms antes de la muerte. **Siempre hay una hoguera a <= 215 px del borde de cualquier punto** (medido en la geometría anterior; se valida en tests).

**Partes rompibles** (medidor = % del HP del jefe; hijas con hitbox propia; cuentan como enemigos para el apuntado)
| Parte | Medidor | Cómo se daña | Efecto al romperse (además de derribo 3 s x1,3, corazón y +1 trofeo) | Trofeo |
|---|---|---|---|---|
| Colmillos | 9 % | Daño directo (r 30, hz 1,15) | La Embestida pierde 20 px de ancho (110 -> 90) y deja de romper estalagmitas gordas a medias; **se pierde la Cornada ascendente** (ataque 3); el hocico queda al alcance | **Colmillo de Yarlak** |
| Armadura de hielo | 11 % | El 30 % del daño al cuerpo (x1,5 si es de Fuego: derrite) | Mientras está entera el cuerpo recibe x0,75. Al romperse: x1,0, se pierde la reflexión de Frío (con la armadura entera cada golpe cuerpo a cuerpo de un Hielo "da" +1 Frío al jugador), el **Latido gélido** dura 5,5 s, y el Corazón se ve a través de la grieta | **Placa Glaciar** |
| Corazón helado | 8 % | Solo apuntable con el pecho abierto (ventana); x2,0 y la barra se pone dorada-blanca (en esta pelea el aro de ventana es **blanco azulado**, no dorado) | Se acaba el Latido; **derribo largo 5 s x1,5**; entra el **modo Invierno profundo**: +20 % cadencia | **Corazón de Escarcha** |

**Debilidades:** Fuego x1,25 (F1-F4; sobre la Armadura x1,5 de desgaste) y Rayo x1,25 (F3-F4, hielo agrietado que conduce). **Resistencias:** Hielo x0,6, Veneno x0,8 (sin metabolismo). Se muestran junto a la barra con los iconos de etiqueta.
**Furia:** a los 150 s (120 en Peligro IV-V) +25 % daño y cadencia, luego +10 % cada 15 s, tope +100 %.
**Recompensa:** 14 Brasas + 4 por parte rota (x Peligro; mismo patrón que v5), 1 Esencia segura + 1 por trofeo, PF 2 (3 la primera vez; +1 la primera vez en Peligro III y V), garantizados `static 2, wick 2, thread 1` (el Rayo es la parte más escasa). Hasta 3 trofeos (2 por parte desde Peligro IV).
**Intro de 3,5 s** (tabla v4 2.2) con el título "Yarlak - El Coloso Gélido". **Música**: 78 BPM, ostinato grave de cuernos y viento; F2 aullidos de manada (seno con glissando); F3 latido de bombo sincronizado con el Corazón; F4 ruido blanco ascendente y coro grave; stingers `stg_yarlak_intro/p2/p3/p4/despair` por código.
**Cámara**: sesgo `camW` 0,35. Zoom de combate 0,9 opcional (`?zoom=0.9`).

---

## B.3 Familia de la TUNDRA - la manada de Yarlak (9 monstruos)

Estética: pelaje blanco-gris, hielo azul, colmillos de marfil; los ojos cian recuerdan al corazón de Yarlak. Todos se mueven con tau 300 ms (resbalan), salvo los voladores.

### Tabla del director y estadísticas
| Nombre | Clave | IA base | Tier | Entra | w | Coste | maxAlive (capGrow) | HP | Vel | Daño | Mat. |
|---|---|---|---|---|---|---|---|---|---|---|---|
| Lobezno de nieve | `worm` | Gusano | 0 | 0:00 | 55 | 1 | 40 | x0,85 (12) | x1,15 (80) | x0,85 (5) | Pelaje |
| Cazador de la ventisca | `archer` | Arquero | 1 | 0:45 | 22 | 3 | 8 | x1,2 (12) | x0,9 (55) | 8 + 6 Frío | Pelaje |
| Lobo de escarcha (manada) | `frostwolf` | Manada (nueva) | 1 | 1:30 | 22 | 3 c/u (manada de 3) | 9 | 20 | 90 (crucero) / 300 (lance) | 8 | Pelaje |
| Oso polar | `boar` | Jabalí (inercia) | 2 | 2:00 | 11 | 5 | 5 | x1,55 (70) | x0,9 (50) / 420 | 16 | Pelaje |
| Yeti | `shield` | Escudero (placa de hielo) | 2 | 2:45 | 9 | 5 | 5 | x1,4 (56) | x0,95 (46) | 10 + empuje | Pelaje (placa: Escarcha) |
| Murciélago de hielo | `moth` | Polilla (pica) | 2 | 3:30 | 9 | 4 | 6 | x0,85 (12) | x1,1 (90) / pica 350 | 6 + 8 Frío | Escarcha |
| Estalagmita viva | `sower` | Trampa (nueva) | 3 | 4:30 | 9 | 5 | 3 (x1,7 -> 5) | 40 | 0 (dormida) / 28 (se arrastra) | 14 | Escarcha |
| Espíritu de nieve | `blinker` | Espectro | 3 | 5:15 | 8 | 6 | 4 | x1 (18) | x0,95 (60) | 16 + empuje 100 | Escarcha (exc.) |
| Chamán del aullido | `warlock` | Brujo (aura) | 3 | 6:45 | 8 | 8 | 2 (x2 -> 4) | x1,05 (32) | x0,95 (48) | 0 | Pelaje |

Sumas: T1 44, T2 29, T3 25; topes T1 17/26 (65 %), T2 16/19, T3 9/12.

### Telegrafía, arte y mecánica (todas con la regla del hielo: tele >= 250 + 220 + 1000 x salida/190)
| Nombre | Telegrafía | Sprite | Frames | Mecánica nueva / uso del hielo |
|---|---|---|---|---|
| Lobezno de nieve | Contacto | `enemy_tun_lobezno` 20x16 -> 40x32 | 11 | Se pasa de largo al girar (derrape); amontona al enjambre |
| Cazador de la ventisca | `aim` 700 ms (línea roja y parpadeo; **siempre visible aunque esté en la bruma**); flecha helada vel 240, impacto: 8 + 6 de Frío. Salida 25: 602 | `enemy_tun_cazador` 24x28 -> 48x56 + `proj_ice_arrow` 16x6 | 14: idle 2, walk 4, aim 1, shoot 2, die 5 | Daño de Frío por impacto |
| Lobo de escarcha | **Manada**: 3 lobos rodean al jugador a 200 px y atacan en secuencia cada 1,2 s. Cada uno: `howl`/agacha 700 ms con línea roja de 40 px; lance de 300 px/s con **derrape** de 140 px más (se ve punteado). Salida 35: 654 <= 700 | `enemy_tun_lobo` 28x20 -> 56x40 | 15: idle 2, walk 4, howl 1, crouch 1, lunge 2, die 5 | **IA de manada** (líder + flancos, ataques escalonados) |
| Oso polar | `wind` 900 ms (rectángulo rojo 70 x 300 + tramo de derrape punteado 180 px); acelera a 420 px/s en 600 ms; **tras acabar patina 180 px**. Salida 55: 759 <= 900 | `enemy_tun_oso` 40x32 -> 80x64 | 15: idle 2, walk 4, wind 1, charge 2, slide 1, die 5 | **Embestida con inercia** (perfil de aceleración y derrape) |
| Yeti | Empellón: `wind` 800 ms (abanico 90 grados alcance 50), empuje 120 px que en hielo patina; placa frontal de hielo (x0,2): tras recibir **30 de daño de Fuego** se derrite y desaparece (frontal x1); `rec` 400 ms vulnerable. Salida 60: 786 <= 800 | `enemy_tun_yeti` 34x36 -> 68x72 + `fx_ice_slab` 24x28 | 15 (+2) | Escudo que cae con Fuego (reutiliza la "parte Escudo" del Coloso, con medidor propio) |
| Murciélago de hielo | Vuela errático; **pica**: línea fina roja 700 ms, 350 px/s, 6 + 8 de Frío; espera 2,5 s | `enemy_tun_murcielago` 24x16 -> 48x32 | 11: flap 4, dive 2, die 5 | Ataque en picado (sin orbe; la Medusa y la Polilla ya ralentizan) |
| Estalagmita viva | Parece una estalagmita de la arena pero con **ojos rojizos tenues**; si el jugador pasa a < 120 px: fisuras y anillo rojo r 40 durante 800 ms, erupción de púas (14); se arrastra a 28 px/s y se rearma cada 5 s. Salida 50: 733 <= 800. Al morir: 3 esquirlas de 3 de daño | `enemy_tun_estalagmita` 20x30 -> 40x60 | 12: dormant 1, wake 2, erupt 2, crawl 2, die 5 | **Trampa camuflada** (obstáculo hostil que bloquea proyectiles) |
| Espíritu de nieve | `fade` 600 ms (remolino de nieve en el sitio, `fx_snow_whirl` r 36, ralentiza 25 % durante 2 s) + tajo 350 ms que **empuja 100 px** | `enemy_tun_espiritu` 22x28 -> 44x56 + `fx_snow_whirl` 36x36 | 11 (+4) | Empuje que patina |
| Chamán del aullido | `cast` 600 ms, 2 Lobeznos cada 6 s (máx. 6); **aura de Frío** r 200 (la ganancia de Frío x2 dentro); matarlo disipa lobeznos y aura | `enemy_tun_chaman` 26x30 -> 52x60 | 11: idle 2, walk 2, howl 2, die 5 | **Aura de Frío** |

**Relación con Yarlak:** la Llamada de la manada invoca Lobos de escarcha (y Cazador en F4); las estalagmitas vivas se parecen a las que brotan del Pisotón (las suyas no tienen ojos y son inertes: diferencia de lectura); los Lobeznos son su descendencia, el Chamán su voz. Regla anti-confusión: **las estalagmitas del jefe tienen un brillo azul liso; las vivas, ojos rojizos tenues**.

**Packs de la Tundra:** **Manada**: 3 Lobos en abanico. **Cordada**: Oso + 2 Yetis en línea. **Pinza del aullido**: 2 Lobos opuestos + Chamán detrás. **Trampal**: 2 Estalagmitas vivas + 4 Lobeznos.
**Materiales y debilidades:** ver A.8 (Pelaje: Hielo x0,75 y Sangre x1,25; Escarcha: Fuego y Acero x1,25, Hielo x0,75).
**Guardianes (3:30 y 5:30):** **Yeti Centinela** (variante del Coloso: la Embestida con onda de choque patina 180 px más y su escudo se derrite con Fuego) y **Ventisquero** (variante de la Madre Colmena: Lluvia de larvas -> Lluvia de carámbanos, Marea ácida -> Ventisca local que sube el Frío). Reutilizan el motor `ai_bulwark` / `ai_hive` y el mismo botín, PF y encargos ("Mata al Coloso" cuenta).

---

## B.4 PANAL - el mundo (celdas, miel, humo, zumbido)

### B.4.1 Arena hexagonal de cera
Arena lógica 1440 x 810 con las cuatro esquinas recortadas por muros diagonales: **hexágono plano** de vértices (180,0) (1260,0) (1440,405) (1260,810) (180,810) (0,405) (~75 % del área). Los 4 muros diagonales son segmentos de colisión (el jugador y los enemigos terrestres no los cruzan, los proyectiles mueren al tocarlos). Suelo: celdas hexagonales de cera (radio 48 px, ~150 celdas) `#f0d98a` con bordes marrones `#7a4a14`.

| Elemento | Datos |
|---|---|
| Pilares de cera | 4 de r 28 y 300 HP en (480,300) (960,300) (480,510) (960,510); bloquean proyectiles; los rompen la Reina y el Zángano; se reconstruyen a los 40 s con aviso |
| Nidos | 6 celdas fijas en anillo de r 330 alrededor de (720,405); fuente de las larvas del Panal abierto |
| Colores | miel = **ámbar oscuro `#c97a14`** con burbujas (**nunca dorado puro**: el dorado/blanco es "ventana de daño"); en la pelea de la Reina el aro de ventana se pinta **blanco azulado** `#e6f7ff` porque la Reina es ámbar y dorada |
| Zumbido ambiente | capa de tinte `rgba(255,170,40,0.06)`, 24 motas de polen (Alta) / 12 / 0 y rayos de luz cálidos; el bucle de zumbido de 110-140 Hz sube de volumen y trémolo con el nº de abejas vivas (retroalimentación sonora del enjambre) |

### B.4.2 Celdas que se abren y se cierran
Cada celda tiene un estado: **cera** (suelo normal), **miel** (abierta, llena de miel) o **nido** (abierta con una larva que va a eclosionar).
- Miel: ralentiza **45 %** al jugador y **35 %** a los enemigos terrestres (los voladores no se ven afectados); no hace daño; dura 10 s y se sella con un fundido de 1 s. No apila con otras ralentizaciones (se aplica la mayor).
- La Reina y el entorno abren/cierran celdas con **telegrafía de 1000-1200 ms** (contorno marrón punteado que se llena de ámbar; sonido "pop" de cera). Una celda recién abierta tarda 600 ms en dar efecto.
- **Contrajuego**: un impacto de Fuego sobre una celda de miel la **carameliza** y sella al instante (máx. 2 por segundo): el Fuego vuelve a ser la herramienta del bioma.
- **Invariantes de justicia** (se validan con un test): máximo 24 celdas de miel a la vez en F1-F2 y 36 en F3 (x1,5 en Peligro IV); siempre >= 55 % de la arena libre de miel; siempre existe un camino sin miel entre el jugador y cualquier punto de la arena.
- Rendimiento: las celdas se pintan en un canvas fuera de pantalla que solo se repinta cuando cambia un estado; la comprobación del jugador es una conversión píxel-celda O(1).

### B.4.3 Humo (el enjambre se dispersa)
Cada impacto de Fuego sobre un monstruo del Panal o sobre una celda crea una **nube de humo** (r 36, 1,8 s, gris cálido `#9a8f84` alpha 0,35, máximo 6 a la vez). Los insectos dentro quedan **sedados**: -40 % de velocidad, no atacan (su temporizador de ataque se pausa), no reciben curación de Polinizador. La Reina no se seda, pero un golpe de humo durante su canal de Jalea real cuenta como daño para interrumpirla. Los insectos del Panal resisten el Veneno (x0,75) y la Reina es inmune a sus estados, así que Fuego y humo son "la respuesta" del bioma.

---

## B.5 LA REINA ABEJA - Melaria (Panal)

**Lore (1 línea):** Melaria no nació reina: devoró la jalea de todas sus hermanas y el panal creció a su alrededor como una jaula que ya no sabe abrirse.

**Identidad y silueta:** abeja reina colosal que **flota** (nunca toca el suelo salvo aturdida): tórax peludo ámbar `#f3a31f` y negro `#2a1b10`, abdomen alargado con celdas luminosas y un **aguijón** largo (parte rompible), dos pares de alas translúcidas `#e9f4ff` de 200 px de envergadura (parte rompible), cabeza con ojos compuestos grandes y una **corona de cera con jalea real** blanquecina `#fff3d6` (parte rompible). Silueta: abdomen en diagonal, alas abiertas en "V", corona. Ojos: F1 verde pálido, F2 ámbar, F3 blanco-rosado (sin rojo). No se parece al Pastor ni a la Madre Colmena (que es una larva).

**Relación con la Madre Colmena:** la Madre Colmena (guardián a 5:30) pasa a ser en el Panal la **"Reina Joven"** (crisálida): mismo motor, mismo botín y encargos, con piel ámbar y un sprite de variante; es el aviso de lo que viene. La "Eclosión" de la Reina es la versión adulta de la Eclosión de la Colmena.

**Tamaño:** 240 x 230 px finales con alas plegadas (envergadura 300 con alas abiertas). Cuerpo `r` 70 (hitbox); vuela a 60 / 70 / 80 px/s (F1/F2/F3) a una altura visual de +40 px (sombra propia, más pequeña mientras se eleva). Entrada: el techo del panal se abre en el hexágono central, desciende con 700 ms de zumbido, sacude (shake 6/180), llama (rugido zumbante). Cámara: `camW` 0,4.

**HP y calibración.** Base 7200, `hpCal` inicial **3,2** (algo menor que Yarlak porque los adds roban parte del daño de las cartas de puntería automática; se ajusta con el bot).

| Duración | I (x1,00) | II (x1,15) | III (x1,30) | IV (x1,50) | V (x1,75) |
|---|---|---|---|---|---|
| Rápida 7 min (x0,75) | 17 280 | 19 872 | 22 464 | 25 920 | 30 240 |
| Normal 9 min (x1,00) | **23 040** | 26 496 | 29 952 | 34 560 | 40 320 |
| Larga 10 min (x1,10) | 25 344 | 29 146 | 32 947 | 38 016 | 44 352 |

Objetivo p50: 100-140 s. El p50 con la mano de referencia pierde ~15 % por la Veneno (inmune) y la Rayo (x0,8) y gana por Fuego: se espera `hpCal` entre 2,8 y 3,6.

### Fases (3 + desesperado)
| Fase | HP | Nombre | Cadencia | Qué cambia | Spawn normal |
|---|---|---|---|---|---|
| F1 | 100-65 % | Corte real | 3,0 s | Ataques 1, 2, 3, 4 (pequeña), 7. Hasta 12 celdas de miel por eventos | x0,25: `worm archer`, tope 15 |
| F2 | 65-30 % | Enjambre | 2,5 s | Añade 5 (Panal abierto), 6 (Torbellino). Hasta 24 celdas; nidos activos. Puerta inmune 3 s + 2 corazones | x0,25: `worm archer bomb`, tope 15 |
| F3 | 30-0 % | Reina furiosa | 2,0 s | Añade 8 (Eclosión masiva). Hasta 36 celdas de miel. La Reina brilla. Puerta + 2 corazones | 0 (solo adds del jefe) |
| Desesperado | < 8 % | Zumbido Mortal | - | Ver abajo | 0 |

### Ataques (8) - regla v4 estándar `tele >= 250 + 1000 x salida/190` (suelo de 800 ms si el daño es >= 25)
| # | Nombre | Fases | Telegrafía | Patrón | Daño | cd | Regla |
|---|---|---|---|---|---|---|---|
| 1 | **Estocada real** | 1-3 (requiere Aguijón) | 900 ms: carril rojo 70 x 420 desde su aguijón (el abdomen apunta; fijo los últimos 300 ms) | Se lanza hacia atrás 150 ms y estoca 380 px/s. Si falla queda **expuesta 1,0 s** (x1,25) | 26 | 6 s | salida 50: 513 <= 900 |
| 2 | **Zumbido en picado** (firma) | 1-3 | 1000 ms: sombra creciente en el suelo (círculo rojo r 100) y la Reina asciende | Cae sobre el punto donde estaba el jugador al empezar, onda de aire. Si aterriza sobre **miel** queda **atrapada 2,4 s (aturdida, ventana x1,35)**; si no, se eleva en 0,8 s. Doble contorno + viñeta | 28 | 10 s | salida 100: 776 <= 1000 |
| 3 | **Lluvia de aguijones** | 1-3 (requiere Aguijón) | 600 ms: cono rojo 80 grados | 9 / 11 / 13 aguijones (F1/F2/F3), vel 230 | 9 c/u | 6 s | salida 30: 408 <= 600 |
| 4 | **Llamada del enjambre** | 1-3 | 800 ms: anillo morado + zumbido | F1: 2 Obreras; F2: 2 Obreras + 1 Zángano (+1 Polinizador, máx. 1); F3: 3 + 1. Con la Corona rota solo Obreras. Tope 4 adds (6 en Peligro V); las Larvas cuentan 0,5 | 0 | 20 s | - |
| 5 | **Panal abierto** | 2-3 | 1200 ms: 7-9 celdas en torno al jugador con contorno punteado marrón + 2-3 nidos pulsando en rojo | Las celdas se llenan de miel (10 s); los nidos eclosionan una Larva explosiva a los 1,5 s | 0 (miel) / explosión 18 | 14 s | ok |
| 6 | **Torbellino alado** | 2-3 (requiere Alas) | 1100 ms: rosquilla roja (interior 100, exterior 260) | Gira y su viento empuja al jugador hacia fuera; golpe en la rosquilla. **Zona segura interior** (pegado al cuerpo) | 18 | 12 s | salida 90: 724 <= 1100 |
| 7 | **Jalea real** (curación) | 1-3 (requiere Corona) | Canal de 1600 ms (aura blanco-verdosa, icono de cruz; barra de canal) | Se cura el 2,5 % de su HP máximo. **Se interrumpe** si recibe >= 1,2 % de su HP máximo en daño durante el canal (~173 dps) o si se rompe la Corona: queda aturdida 1,0 s (x1,25) | 0 | 24 s | - |
| 8 | **Eclosión masiva** | 3 | 1200 ms: el abdomen se hincha y brilla | Suelta 4 Larvas explosivas en anillo (6 en Peligro V). Después el abdomen queda **hinchado** 3 s: x1,3 de daño | 18 c/u (explosión) | 18 s | salida 60: 776 <= 1200 |

**Ataque desesperado - Zumbido Mortal (< 8 %):** 10 s. La Reina flota quieta en el centro (alas abiertas, expuesta x1,25) y las celdas se pintan en **anillos hexagonales** concéntricos. Cada 1,3 s un anillo (de fuera hacia dentro, 5 anillos) se enciende en rojo 900 ms y hiere 18 durante 200 ms; cada anillo tiene **2 huecos de 2 celdas** en posiciones avisadas. No hay miel en esos 10 s. En los últimos 2 s aterriza aturdida. Si muere durante él: "congelado" de 400 ms.

**Partes rompibles**
| Parte | Medidor | Efecto al romperse (además de derribo 3 s x1,3, corazón y trofeo) | Trofeo |
|---|---|---|---|
| Alas | 9 % | **Aterriza**: cae al suelo, afectada por la miel (-45 %), alcanzable por orbitales/auras; pierde Torbellino (6); el Picado pasa a "Salto corto" (r 100, sin ascenso) | **Ala de Reina** |
| Aguijón | 9 % | Pierde Estocada real (1) y Lluvia de aguijones (3); usa en su lugar un golpe de ala corto (alcance 110, 18 de daño). | **Aguijón Real** |
| Corona de jalea real | 10 % | Pierde Jalea real (7); la Llamada solo invoca Obreras (tope de adds -2); suelta una gota de jalea que cura 20 HP al jugador (1 vez) | **Jalea Real** |

**Debilidades:** Fuego x1,25 (siempre; con humo) y Hielo x1,25 (F2-F3: el enjambre se aletarga). **Resistencias:** Veneno: **inmune a los estados de veneno** (no apila) y daño directo x0,5; Rayo x0,8 (la cera aísla). Humo y Fuego dispersan al enjambre pero **no sedan a la Reina**.
**Furia:** a los 150 s (120 en IV-V), igual que los demás.
**Recompensa:** 14 Brasas + 4 por parte (x Peligro), 1 Esencia segura + 1 por trofeo, PF 2 (3 la primera vez; +1 en III y V), garantizados `wick 2, frost 2, thread 2`. Música: 124 BPM, sierra detonada con trémolo (zumbido) + marimba de cera; F2 pizzicato de enjambre; F3 coro disonante y percusión; stingers `stg_reina_intro/p2/p3/despair`.

---

## B.6 Familia del PANAL - la colmena (9 monstruos)

Estética: ámbar `#f3a31f`, negro `#2a1b10`, cera `#f0d98a`, alas translúcidas. Los voladores (Aguijonera, Zángano, Avispa, Polinizador, Nodriza) ignoran la miel y los obstáculos bajos; los terrestres (Obrera, Larva, Guardia, Babosa) quedan atrapados en ella (y la Babosa es inmune).

### Tabla del director y estadísticas
| Nombre | Clave | IA base | Tier | Entra | w | Coste | maxAlive (capGrow) | HP | Vel | Daño | Mat. | Vuela |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Obrera | `worm` | Gusano | 0 | 0:00 | 55 | 1 | 40 | x0,9 (13) | x1,1 (77) | x1 (5) | Insecto | no |
| Abeja aguijonera | `archer` | Arquero (vuelo) | 1 | 0:45 | 28 | 3 | 12 | x1 (10) | x1 (60) | x1 (8) | Insecto | sí |
| Larva explosiva | `bomb` | Bomba | 1 | 1:30 | 16 | 2 | 6 | x1 (8) | x0,95 (100) | 18 (r 55) | Miel | no |
| Zángano | `boar` | Jabalí (vuelo) | 2 | 2:00 | 10 | 5 | 6 | x0,9 (40) | x1,1 (60 / carga 360) | x1 (14) | Insecto | sí |
| Guardia de cera | `shield` | Escudero | 2 | 2:45 | 10 | 5 | 6 | x1,1 (44) | x0,95 (46) | x1 (10) | Cera | no |
| Babosa de miel (NUEVO) | `honeyslug` | Zonificador lento (nueva) | 2 | 3:30 | 9 | 5 | 4 | 36 | 35 | 4 contacto | Miel | no |
| Polinizador (NUEVO) | `pollinator` | Soporte (nueva) | 3 | 4:30 | 8 | 6 | 2 (x1,5 -> 3) | 24 | 70 | 0 | Insecto | sí |
| Avispa | `blinker` | Espectro (zumbido) | 3 | 5:15 | 9 | 6 | 4 | x0,9 (16) | x1,3 (85) | x0,9 (14) | Insecto | sí |
| Nodriza | `warlock` | Brujo | 3 | 6:45 | 8 | 8 | 2 | x1 (30) | x1 (50) | 0 | Insecto | sí |

Sumas: T1 44, T2 29, T3 25; topes T1 18/26 (69 %), T2 16/19, T3 8/12 (67 %).

### Telegrafía, arte y roles
| Nombre | Rol | Telegrafía | Sprite | Frames | Mecánica nueva |
|---|---|---|---|---|---|
| Obrera | Chaser terrestre | Contacto; en miel va a 50 | `enemy_pan_obrera` 18x18 -> 36x36 | 11 | Ninguna |
| Abeja aguijonera | Tirador volador | `aim` 400 ms, aguijón recto vel 230 | `enemy_pan_aguijonera` 22x22 -> 44x44 + `proj_stinger` 16x6 | 14: idle 2, fly 4, aim 1, shoot 2, die 5 | Flag `fly` |
| Larva explosiva | Kamikaze con miel | Mecha 700 ms (círculo r 60); al explotar deja un **charco de miel** r 36 de 5 s | `enemy_pan_larva` 18x14 -> 36x28 | 12: crawl 4, lit 2, prime 1, die 5 | Charco de miel |
| Zángano | Embestidor volador | `wind` 600 ms (rectángulo 60 x 300), carga 360 px/s; si choca con un pilar o muro: aturdido 1 s. Salida 45: 487 <= 600 | `enemy_pan_zangano` 28x24 -> 56x48 | 15: idle 2, fly 4, wind 1, charge 2, stun 1, die 5 | Ninguna (vuela) |
| Guardia de cera | Tanque con escudo | Empellón 500 ms (existente); **escudo de cera frontal x0,2** que se funde: 40 de daño de Fuego sobre el escudo lo destruye (frontal x1) | `enemy_pan_guardia` 26x26 -> 52x52 + `fx_wax_shield` | 15 (+2) | Escudo rompible con Fuego |
| Babosa de miel | Zonificador | Escupe cada 4 s un proyectil lento (vel 140, `proj_honey_glob`) que aterriza donde estaba el jugador (círculo ámbar punteado 500 ms) y deja **miel** r 34 durante 6 s (3 de daño directo); además deja un rastro de miel r 26 cada 60 px | `enemy_pan_babosa` 30x16 -> 60x32 | 13: idle 2, crawl 4, spit 2, die 5 | **Charcos de miel** de enemigo (ralentizan al jugador y a los terrestres) |
| Polinizador | **Curandero** | Pulsa cada 3,5 s: `pulse` 500 ms (anillo verde pálido `#b8ff9a` con cruz); cura a los aliados en r 120 un 20 % de su HP máx. en 2 s. Mantiene 280 px del jugador y huye | `enemy_pan_polinizador` 24x24 -> 48x48 + `fx_pollen_pulse` 60x60 | 11: float 4, pulse 2, die 5 (+4) | **Curación de aliados** (HoT) |
| Avispa | Asesino rápido | Zumbido: `fade` 500 ms (borrón y anillo en la posición de reaparición), tajo 350 ms (arco 100 grados), 14 de daño | `enemy_pan_avispa` 22x22 -> 44x44 | 15: idle 2, fly 4, fade 2, sting 2, die 5 | Ninguna (IA del Espectro) |
| Nodriza | Invocador | `cast` 500 ms, 2 Larvas explosivas cada 6 s (máx. 4 invocadas) | `enemy_pan_nodriza` 26x28 -> 52x56 | 13: idle 2, fly 4, cast 2, die 5 | Ninguna |

**Sinergias entre ellos:** la Guardia con Fuego se derrite y el Polinizador detrás de una línea de Guardias mantiene la formación viva (prioridad de objetivo); Larvas y Nodriza llenan el suelo de miel que atrapa a Obreras y Guardias pero no a las voladoras; la Babosa fija al jugador para las Avispas. Contrajuego: Fuego (humo sedante, derrite el escudo, carameliza la miel), áreas y matar al Polinizador primero.
**Packs del Panal:** **Falange** (línea): 3 Guardias + 1 Nodriza detrás. **Abejorros** (cruce): 2 Zánganos en lados opuestos. **Campo de flores**: 2 Polinizadores + 4 Obreras. **Avispero** (pinza): 2 Avispas + 1 Babosa.
**Cura al jefe:** si hay un Polinizador vivo durante la pelea con la Reina, su pulso también cura a la Reina un 1 % de su HP máx. por pulso (tope 1 Polinizador de jefe a la vez).
**Guardianes (3:30 y 5:30):** **Guardia Real** (variante del Coloso con escudo de cera que se funde con Fuego) y **Reina Joven** (la Madre Colmena actual, con piel ámbar).

---

## B.7 Integración común de los dos biomas nuevos

### Peligro I-V (tabla v4 4.3, acumulativa; en cada fila lo propio de cada jefe)
| Nivel | HP x | Daño | Telegrafía | Yarlak | Reina Abeja |
|---|---|---|---|---|---|
| I | 1,00 | +0 % | 100 % | Base | Base |
| II | 1,15 | +10 % | -10 % (con suelo de esquiva) | La Llamada invoca 3 Lobos (4 en F4) | La Llamada invoca +1 add (3 Obreras) |
| III | 1,30 | +20 % | -10 % | **Aliento polar de ida y vuelta** (barre 30 grados y vuelve) y Alud de 12 bloques | **Picado doble** (2.º picado tras re-aim de 600 ms con 300 ms de línea fija) |
| IV | 1,50 | +30 % | -10 % | Furia a 120 s, partes +30 %, derribos 2,4 s, ventisca de r 300 y Frío x1,3 | Furia a 120 s, partes +30 %, derribos 2,4 s, miel x1,5 (máx. celdas) |
| V | 1,75 | +40 % | -10 % | **Último aliento**: dos Inviernos Eternos seguidos (el 2.º con solo 3 hogueras), tope de adds 6 | **Último aliento**: dos Zumbidos Mortales seguidos, tope de adds 6 |

Reglas heredadas: `HIT_CAP` 32; ningún recorte de telegrafía baja de la regla de esquiva (de hielo en Tundra: +220 ms); 2 corazones en el segundo desesperado. Brasas x(1 + 0,25 x (nivel - 1)); trofeos x2 por parte en IV-V; PF extra +1 la primera vez en III y V.

### Cacería y práctica
Misma regla que v4 4.2 y J3: tras vencer al jefe una vez, Vesper ofrece la cacería (6 ofertas de preparación, sin hordas, HP x0,75, sin Esencia segura, PF solo en la primera victoria por Peligro) y "Practicar" (HP x0,5, sin recompensas, reinicio rápido con la mano guardada). Particularidades: en Tundra la ganancia de Frío es x0,8 y empieza en 20 %; la oleada de limpieza (3 de la familia T0 cada 25 s) usa el chaser del bioma (Lobezno / Obrera); las tarjetas de cacería muestran los chips de debilidades y los 3 trofeos.

### Duraciones (Rápida 7 / Normal 9 / Larga 10)
Sin cambios en `L.DUR` salvo un campo nuevo `cold` (0,90 / 1,00 / 1,10) para el Frío. HP del jefe por `durMul` x0,75 / 1 / 1,10 (tablas en B.2 y B.5); botín, PF y Esencia por la fila de `L.DUR` como hoy. El jefe aparece a 5/6 de la run (5:50, 7:30, 8:20).

### Impacto en el árbol de forja (sin tocar el techo de 24 PF)
- **Trofeos nuevos** (6; contarán como 1 Esencia cada uno, como hoy): Colmillo de Yarlak, Placa Glaciar, Corazón de Escarcha, Ala de Reina, Aguijón Real, Jalea Real. Esencia "afín" a Fuego/Rayo (Yarlak) y a Fuego/Hielo (Reina).
- **Rama "Ruta" del Tronco** (6 nodos, **no cuestan PF**, cuestan Brasas y partes, y **requieren haber obtenido el trofeo** (no se consume)): refuerzos situacionales de cada bioma, para no desequilibrar el poder base.
| Nodo | Requisito | Efecto | Coste (partes + Brasas v5) |
|---|---|---|---|
| Crampones | Colmillo de Yarlak | tau del hielo 220 -> 140 ms; retroceso x1,2 | 8 Placa + 300 |
| Abrigo de escarcha | Placa Glaciar | Ganancia de Frío x0,7 | 8 Hebra + 300 |
| Brasa en el pecho | Corazón de Escarcha | Hogueras +30 % de radio; cada carta de Fuego -0,5 %/s de Frío | 6 Mecha + 450 |
| Ahumador | Aguijón Real | El humo dura +40 % (2,5 s) y su radio sube a 50 | 6 Mecha + 300 |
| Guantes de apicultor | Ala de Reina | La miel ralentiza 25 % en lugar de 45 % | 8 Hebra + 300 |
| Jalea de reserva | Jalea Real | +10 HP máximo | 8 Pluma + 450 |
- **Recetas**: ningún árbol nuevo ni carta nueva en esta fase (fuera de alcance). Opcional futuro: 1 carta por bioma (p. ej. Hielo "Carámbano", Veneno "Avispero") desbloqueada por trofeo.
- **Platos de Tía Castaña** (1 por expedición, cupo actual): Caldo de brasa (-35 % ganancia de Frío), Tostada de miel (miel -50 % de ralentización), Té de humo (humo +50 %). Costes: 4-6 partes + 40-60 Brasas.
- **Encargos de Vesper** nuevos: "Caza 30 Lobos de escarcha", "Gana en Tundra sin pasar del 70 % de Frío", "Vence a Yarlak sin que te alcance la Embestida", "Rompe el Aguijón de la Reina", "Apaga 10 Polinizadores", "Vence a la Reina con 3+ cartas de Fuego", "Sobrevive 60 s sin pisar miel". Logros nuevos para el Abuelo (4): vencer a cada uno, "Cálido corazón" (vencer a Yarlak con el Frío por debajo del 50 % toda la pelea), "Ni una gota" (Reina sin pisar miel).
- Portal: 5 destinos; chips de debilidades; recomendación "Lleva Fuego" en Tundra y Panal. Guardado v5: `bossKills` y `peligro` con `yarlak` y `reina`; migración trivial desde v4 (valores por defecto).

### Rendimiento (fps) y límites de entidades
- Jefe: máx. **4 adds** (6 en Peligro V), **60 proyectiles enemigos**; normales con jefe <= 15 y 6-0 según fase; en móvil, tope total de 40 entidades con jefe. Las Larvas cuentan 0,5 add. El Alud y los carámbanos se limitan a 60 proyectiles; las hogueras y estalagmitas son obstáculos (no entidades de IA).
- Tundra: bruma = 1 loseta que se desplaza (4 `drawImage`), 120 / 50 / 0 rayas por calidad; el suelo de hielo se hornea una vez; las cuentas de la física (tau, lambda) son O(entidades). Panal: miel en canvas fuera de pantalla; nube de abejas decorativa = partículas (24 / 12 / 0), no entidades; cada pieza de jefe en un canvas cacheado (como Letea) y sin `shadowBlur`.
- Calidad: en Baja, sin bruma animada (solo degradado de bordes), sin polen, 30 % de partículas; el modo Auto baja de nivel como hoy.
- Objetivo medible: en Chromium sin GPU, Yarlak y la Reina no pueden estar más de **3 fps por debajo** del Pastor medido en la misma sesión; en móvil emulado 844x390, >= 40 fps en Media.

### Legibilidad en móvil
- Telegrafías >= 3 px de contorno y alfa máximo 0,4 de relleno (nunca tapan a Marlo); el contorno de las de jefe nuevo siempre por encima de la bruma.
- Distinción por **forma/patrón**, no solo color: hielo (diagonales) vs nieve firme (puntos); miel (burbujas + borde marrón) vs cera lisa; humo (volutas grises) vs nube de esporas.
- Código de colores: rojo daño directo, azul hielo/ralentiza, verde ácido zonas persistentes, morado invocación, naranja intenso = lava/fuego persistente, **turquesa = olvido (cartas)**, **ámbar oscuro = miel**, dorado/blanco = ventana (blanco azulado en la Reina).
- Barra de Frío con cifra y escarcha en esquinas; barra de parte y medidor de ventana como en v4; textos mínimos de 12 px; botones del Portal >= 52 px; opciones "Hielo suave", "Ventisca ligera" y la existente "reducir sacudidas".

### Calibración inicial y bot
- El bot esquivador de `tools/card-swarm-boss-bot/` necesita tres añadidos (tarea de `tools-engineer`): (1) modelo de movimiento con tau/lambda para planificar la esquiva con derrape; (2) lectura del Frío y búsqueda de hogueras/nieve firme; (3) lectura de celdas de miel y de las nubes de humo. Mismas manos p25/p50/p75, 12 peleas por mano y celda.
- Objetivo de victoria ponderado 25/50/25 por Peligro (media de los 5 jefes): 60 % / 55 % / 51 % / 37 % / 24 % (I-V); cada jefe nuevo dentro de +-10 puntos de esa fila. Duración de victorias p50: 90-150 s; p75 >= 60 s; p25 con Furia ~180 s.

---

# PARTE C - PLAN DE IMPLEMENTACIÓN POR FASES (todo)

Agentes: `game-designer` (diseño/ajustes), `programmer` (lógica y arte por código en `assets_*.js`, como hasta ahora), `tools-engineer` (bots, censo, auditorías), `qa-tester` (Playwright, móvil, regresión), `audio-designer` (música y SFX procedurales), `asset-scout` (referencias de silueta/paleta originales, actualizar `studio/assets/ASSETS.md`). No hay artista externo: el arte es vectorial por código.

## C.1 Fases

| Fase | Entregables | Días | Agentes | Depende de | Publicable |
|---|---|---|---|---|---|
| **P0 Infraestructura de familias** | `G.B.fam`, `tierOf`, `E.spawn` con override, `?fam=0`, tabla de materiales en `Combat.deal`, packs por bioma, `light` por bioma, herramienta de **censo** | 2 | programmer, tools-engineer, qa-tester | - | Sí (sin cambios visibles; regresión 0) |
| **P1 Familias Bosque + Cripta** | 5 + 8 sprites, 3 proyectiles; M1-M4; 21 telegrafías auditadas; 4 packs nuevos; SFX | 5 | programmer, audio-designer, qa-tester | P0 | Sí (v5.1: "los monstruos cambian de bioma") |
| **P2 Familia Asfodelo** | 8 sprites, charcos fijos `G.ponds`, M5-M10, `p.cdSlow` + HUD, cauterización; SFX | 4 | programmer, audio-designer, qa-tester | P0 | Sí (v5.2) |
| **P3 Mundo de hielo + familia Tundra** | Física de hielo, Frío + HUD + hogueras, ventisca, arena Tundra (suelo, parches, grietas, estalagmitas), 9 monstruos, 2 guardianes, packs; `?biome=tundra` | 5 | programmer, audio-designer, qa-tester, tools-engineer (bot con hielo) | P0 | No (bloqueada hasta Yarlak) |
| **P4 Yarlak** | Boss multi-parte (15 sprites), 8 ataques, 4 fases + desesperado, 3 partes, intro, música/stingers, `iceCoverage()`, calibración con bot | 6 | programmer, audio-designer, tools-engineer, qa-tester, game-designer (ajuste) | P3 | Sí (v5.3: Tundra + Yarlak, se abre al vencer a Letea) |
| **P5 Mundo del Panal + familia** | Arena hexagonal con muros diagonales, celdas y miel (canvas), humo, 9 monstruos, 2 guardianes, curación de aliados, vuelo; `?biome=panal` | 4 | programmer, audio-designer, qa-tester | P0 (P3 no necesaria) | No |
| **P6 Reina Abeja** | Boss multi-parte (16 sprites), 8 ataques, 3 fases + desesperado, 3 partes, intro, música, calibración con bot | 6 | programmer, audio-designer, tools-engineer, qa-tester | P5 | Sí (v5.4: Panal + Reina, se abre al vencer a Yarlak) |
| **P7 Integración** | Portal de 5 destinos, desbloqueos, Peligro I-V y variantes de ambos jefes, cacería/práctica, rama "Ruta", 3 platos, 7 encargos, 4 logros, guardado v5 | 3 | programmer, game-designer | P4, P6 | Sí (v5.5) |
| **P8 Balance, rendimiento y cierre** | 16 peleas por jefe y Peligro con el bot, censo final, perfiles de fps, pruebas móviles, `README.md` y `ASSETS_API.md` actualizados | 3 | tools-engineer, qa-tester, game-designer, programmer | P7 | Sí (v5.6 estable) |

Total: **38 días en un solo flujo**. Con dos flujos de programmer en paralelo tras P0 (A: P1 -> P2 -> P5 -> P6; B: P3 -> P4; luego P7/P8 juntos): **~26 días de calendario** (2 + máx(5+4+4+6, 5+6) + 6 de P7/P8 con solape).
Orden recomendado de publicación: P0 -> P1 -> P2 -> (P3+P4) -> (P5+P6) -> P7 -> P8. Entre fases no se publican biomas incompletos: si el boss de un bioma no llega, el destino sigue bloqueado ("? TUNDRA") y sus tipos nunca salen en otros biomas.

## C.2 Criterios de aceptación medibles (por fase)

| Fase | Criterio |
|---|---|
| P0 | `?fam=0` idéntico a v4 (misma semilla); censo y auditoría de telegrafías ejecutables; 0 errores de consola; tests existentes en verde |
| P1-P2 | Criterios A.11. Cada tipo >= 1 aparición en el 95 % de las runs; telegrafías >= regla; bot de balance a +-15 % en partes/Brasas/XP |
| P3 | Física: a 190 px/s sin entrada el jugador se detiene a **86 +-8 px** y alcanza el 95 % de la velocidad en **660 +-60 ms** (test unitario); `iceCoverage() <= 260`; Frío: 3 cartas de Fuego dan <= +0,5 %/s, mano sin Fuego/Sangre/Hielo llena en 55-75 s; contraste del contorno de telegrafías sobre bruma >= 3:1; fps de horda >= Pastor - 3 |
| P4 | Bot Peligro I ponderado 25/50/25: 60-70 % de victorias; p50 90-150 s; p75 >= 60 s; 4 adds y 60 proyectiles máx.; romper cada parte cambia el comportamiento y suelta su trofeo; Invierno Eterno 100 % esquivable (bot sin lapsos lo supera >= 90 %); hoguera a <= 215 px del borde de cualquier punto |
| P5 | Celdas: <= 24/36 de miel, >= 55 % libre y camino sin miel (test); estado de celda cambia en < 1 ms/frame; el humo sedan y el Polinizador cura (test unitario); 0 errores |
| P6 | Bot Peligro I: 60-70 %; p50 100-140 s; Jalea real se interrumpe en >= 60 % de las peleas p50 y en < 30 % de las p25 (la mecánica importa); cada parte se rompe en >= 70 % de las p50; adds <= 4; Zumbido Mortal 100 % esquivable |
| P7 | Flujo táctil completo aldea -> Vesper -> Portal (5 destinos) -> expedición -> jefe -> botín -> aldea con 0 errores; desbloqueo en cadena persiste al recargar; migración v4 -> v5 sin pérdida |
| P8 | Tabla de victorias por Peligro (media de los 5 jefes): 60 / 55 / 51 / 37 / 24 % +-10; fps en Chromium sin GPU no menor que el Pastor - 3; móvil 844x390 >= 40 fps en Media; todas las capturas en `studio/docs/capturas-v5/` |

## C.3 Riesgos

| Riesgo | Prob. | Impacto | Mitigación |
|---|---|---|---|
| **Carga de arte** (120 sprites / 759 frames) | Alta | Alto | Variantes de paleta para 6 sprites, reutilizar `enemy_sower`, `boar`, `enemy_scorcher`, `fx_fire_cell`, `proj_frost_orb`; orden de prioridad por fase; tipos/biomas sin arte quedan desactivados (nunca placeholder); P1/P2 dibujan primero lo básico (idle/walk/die) y las telegrafías llegan al final |
| **Mecánica de hielo** (frustración, bugs de colisión con paredes/obstáculos) | Media | Alto | Parámetros fijos en `G.B.ice`; nieve firme a <= 260 px; opción "Hielo suave"; bot con tau; probarla en P3 antes de diseñar los ataques de P4; si no funciona, se publica el Panal primero (el orden de desbloqueo es un dato) |
| **Balance** (13 materiales x 6 etiquetas, 5 jefes, Peligro I-V) | Alta | Medio | Tabla de materiales en datos; censo + bot; `hpCal` como única palanca por jefe; desactivar materiales con `?fam=0` |
| **Rendimiento** (Panal, ventisca, Alud) | Media | Alto | Topes duros (4 adds, 60 proyectiles, 40 entidades en móvil), cachés en canvas, calidad adaptativa, medición por fase |
| **Toque a `weapons.js` (`cdSlow`)** | Media | Medio | Un solo factor, tope 40 %/2 s, test de que no se aplica a jefes ni se apila |
| **Complejidad del director** (familias x packs x jefes) | Media | Medio | Una sola fuente de verdad (`G.B.fam`), intersección con `allow`, test de que ninguna fase queda sin spawn |
| **Encargos rotos por roles ausentes** | Media | Bajo | Aviso en el Portal y comprobación al ofrecer encargos |
| **Legibilidad** (miel vs dorado, ventisca vs telegrafía) | Media | Alto | Colores y orden de dibujo definidos en B.1.3 y B.4.1, contraste medido, aro blanco azulado en la Reina |
| **Dependencia entre fases por `player.js`** (física y ralentizaciones) | Baja | Medio | La física solo lee `G.curBiome`; en los otros biomas tau = 0 |

## C.4 Lista de assets nuevos (para `programmer`; todo vectorial por código, contorno `#1b1124`, mira a la derecha; tamaño base -> final; frames incluyen 5 de `die` en enemigos)

### A) Familias de los 3 biomas actuales (29 sprites / 278 frames)
| Grupo | Sprite (base -> final) | Frames |
|---|---|---|
| Bosque | `enemy_bos_cordero` 20x20->40x40 (11), `enemy_bos_zarzal` 24x24->48x48 (13), `enemy_bos_perro` 26x18->52x36 (14), `enemy_bos_polilla` 20x20 (11, variante de paleta), `enemy_bos_zamponero` 20x24 (9, variante), `proj_wool_orb` 12x12 (2) | 60 |
| Cripta | `enemy_cri_esqueleto` 20x22 (11), `enemy_cri_arquero` 22x22 (13), `enemy_cri_calavera_exp` 18x18 (12), `enemy_cri_calavera_rod` 24x24 (15), `enemy_cri_carcelero` 26x26 (14), `enemy_cri_salamandra` 30x16 (11), `enemy_cri_guardian_cadenas` 28x30 (14), `enemy_cri_alma` 22x26 (11, variante), `proj_bone_arrow` 16x6 (2), `proj_chain` 24x8 (3), `fx_chain_link` 16x16 (1) | 107 |
| Asfodelo | `enemy_asf_alma_errante` 20x22 (11), `enemy_asf_sanguijuela` 18x10 (10), `enemy_asf_rana` 26x22 (11), `enemy_asf_medusa` 24x28 (11), `enemy_asf_cabeza_menor` 28x36 (17), `enemy_asf_anguila` 40x14 (14), `enemy_asf_lirio` 22x24 (13), `enemy_asf_sacerdotisa` 24x28 (12), `fx_pond_ripple` 48x24 (3), `fx_olvido_zone` 48x48 (3), `fx_lightning_lane` 32x32 (3), `fx_pond` 80x48 (3) | 111 |

### B) Tundra y Yarlak (39 sprites / 238 frames)
| Grupo | Sprite (base -> final) | Frames |
|---|---|---|
| Familia | `enemy_tun_lobezno` 20x16 (11), `_cazador` 24x28 (14), `_lobo` 28x20 (15), `_oso` 40x32 (15), `_yeti` 34x36 (15), `_murcielago` 24x16 (11), `_estalagmita` 20x30 (12), `_espiritu` 22x28 (11), `_chaman` 26x30 (11) | 115 |
| FX y arena | `proj_ice_arrow` 16x6 (2), `proj_icicle` 14x28 (2), `fx_ice_slab` 24x28 (2), `fx_snow_whirl` 36x36 (4), `tile_ice` 32x32 x6, `tile_snow_patch` x3, `fx_ice_crack` 96x24 (3), `obs_ice_pillar` 26x52 (3), `fx_campfire` 20x24 (4), `fx_blizzard_tile` 128x128 (3), `fx_ice_block` 22x22 (3), `fx_ice_burst` 48x48 (5), `decor_tundra` (6) | 46 |
| Guardianes | `enemy_mini_yeti` 32x32 (16, variante), `enemy_mini_ventisquero` 32x32 (15, variante) | 31 |
| Boss Yarlak | `boss_yarlak_body` 112x80 (2), `_head` 56x56 (4), `_tusk_l` y `_tusk_r` 28x60 (2+2), `_armor` 80x48 (3), `_heart` 28x28 (3), `_leg` 24x56 (8), `_eyes` 24x10 (4), `_portrait` 96x96 (3), `trophy_yarlak_tusk/plate/heart` 32x32 (6), `fx_yarlak_breath` 64x64 (4), `fx_yarlak_pulse` 128x128 (4), `fx_ice_shockwave` (1) | 46 |

### C) Panal y Reina (40 sprites / 230 frames)
| Grupo | Sprite (base -> final) | Frames |
|---|---|---|
| Familia | `enemy_pan_obrera` 18x18 (11), `_aguijonera` 22x22 (14), `_larva` 18x14 (12), `_zangano` 28x24 (15), `_guardia` 26x26 (15), `_babosa` 30x16 (13), `_polinizador` 24x24 (11), `_avispa` 22x22 (15), `_nodriza` 26x28 (13) | 119 |
| FX y arena | `tile_hex_wax` 48x42 (4), `fx_honey_cell` 56x48 (4), `fx_cell_open` (4), `fx_nest_cell` (3), `fx_honey_puddle` 36x36 (3), `fx_smoke_puff` 20x20 (4), `fx_pollen_pulse` 60x60 (4), `proj_stinger` 16x6 (2), `proj_honey_glob` 14x14 (2), `obs_wax_pillar` 28x52 (3), `fx_swarm_cloud` 32x24 (4), `fx_wax_wall` (3), `fx_wax_shield` (2), `decor_panal` (4) | 46 |
| Guardián | `enemy_mini_guardia_real` 32x32 (16, variante); la Reina Joven reutiliza `enemy_mini_hive` con tinte | 16 |
| Boss Reina | `boss_reina_thorax` 80x64 (2), `_abdomen` 88x72 (4), `_head` 48x48 (4), `_crown` 36x28 (3), `_wing_front` y `_wing_back` 100x56 (5+5), `_sting` 24x44 (3), `_legs` 20x40 (4), `_eyes` 20x10 (3), `_portrait` 96x96 (3), `trophy_reina_wing/sting/jelly` 32x32 (6), `fx_royal_jelly` 48x48 (4), `fx_hex_ring` 128x112 (3) | 49 |

### D) UI y aldea compartidos (12 sprites / 13 frames)
`icon_frio` 16x16 (2), `tree_ico_ruta_*` x6 32x32, 2 iconos de destino del Portal, 3 iconos de plato.

### E) Presupuesto de arte total
| Concepto | Sprites | Frames |
|---|---|---|
| A) Familias existentes | 29 | 278 |
| B) Tundra + Yarlak | 39 | 238 |
| C) Panal + Reina | 40 | 230 |
| D) UI compartida | 12 | 13 |
| **Total** | **120** (114 nuevos + 6 variantes de paleta) | **759** |

Por fase de entrega: P1 17 sprites / 167 frames; P2 12 / 111; P3 24 / 192 (incluye guardianes); P4 15 / 46; P5 24 / 181 (incluye guardián); P6 16 / 49; P7 12 / 13. Prioridad dentro de cada fase: idle/walk/die de los enemigos más frecuentes (tier 0-1), luego los de ataque, luego proyectiles y FX; jefes: cuerpo y partes, luego poses de ataque, luego retrato y trofeos.

## C.5 Audio (para `audio-designer`; procedural en WebAudio, estilo actual, <= 4 voces simultáneas por tipo, variación de pitch +-10 %)
- **Música**: `boss_yarlak` (78 BPM, 3 capas + stingers `intro/p2/p3/p4/despair`), `boss_reina` (124 BPM, 3 capas + stingers), bucles ambientales `amb_tundra_wind` y `amb_panal_hum` (zumbido que sigue el nº de abejas).
- **SFX Parte A**: `bone_arrow`, `skull_roll`, `skull_bounce`, `chain_throw`, `chain_hit`, `lava_trail_hiss`, `pond_bubble`, `frog_hop`, `frog_splash`, `leech_lunge`, `head_emerge`, `head_burn`, `eel_charge`, `eel_zap`, `olvido_chime`, `dog_bark`, `dog_dash`, `wool_puff`, `zampona_pipe`.
- **SFX Tundra**: `ice_slide` (pitch según velocidad), `ice_crack`, `ice_shatter`, `snow_step`, `wind_gust` (aviso), `cold_warn` (tiritona al 70 %), `cold_freeze` (100 %), `campfire_loop`, `wolf_howl`, `wolf_lunge`, `bat_screech`, `bear_roar`, `yeti_bash`, `boss_roar_yarlak`, `mammoth_step`, `tusk_crash`, `ice_breath`, `icicle_rain`, `heart_beat`.
- **SFX Panal**: `hum_loop`, `wing_buzz_boss`, `bee_sting`, `honey_squelch`, `honey_drip`, `cell_open`, `cell_close`, `smoke_hiss`, `pollen_chime`, `wax_shield_hit`, `larva_burst`, `drone_charge`, `wasp_zip`, `boss_roar_reina`, `jelly_channel`.
- Regla heredada: un único rugido a la vez; los SFX frecuentes cortos y bajos.

## C.6 Qué se puede publicar entre fases
- **v5.1 (tras P1)**: Bosque y Cripta con nuevas familias; Asfodelo sigue con el roster antiguo (`fam` solo activa por bioma lista).
- **v5.2 (tras P2)**: las tres familias; las debilidades por material ya se notan en las builds.
- **v5.3 (tras P4)**: Tundra + Yarlak (Peligro I; el Portal los muestra a partir de vencer a Letea).
- **v5.4 (tras P6)**: Panal + Reina.
- **v5.5 (tras P7)**: Peligro I-V, cacería, Ruta, platos, encargos y logros.
- **v5.6 (tras P8)**: balance y rendimiento ajustados.
Nada de esto exige perder partidas guardadas (guardado v5 compatible hacia atrás).

---

## Preguntas al dueño (solo las que son realmente suyas)

1. **¿El Bosque pierde Escudero, Bomba, Espectro y Ascua?** En la propuesta aprobada esos cuatro roles solo aparecen en la Cripta (Carcelero, Calavera explosiva, Alma prisionera, Ascua), así que el primer bioma tendría 8 tipos en vez de 11 y el Coloso Escudero seguiría como guardián. Mi recomendación es **sí** (cada bioma queda con identidad propia); si prefieres que el Bosque conserve alguno como "huésped", se puede dejar al 40 % de peso sin coste de arte.
2. **¿Aceptas poder permanente situacional sin Puntos de Forja** (la rama "Ruta": Crampones, Ahumador, etc., que se desbloquean al obtener los trofeos de Yarlak y la Reina)? Propongo que sí, porque solo sirven en su bioma y alivian la frustración del hielo/miel sin tocar el techo de 24 PF; la alternativa es no dar poder nuevo y dejar solo cosmética y platos.

---

## Resumen (máx. 12 líneas)
1. Las claves de rol (`worm`, `archer`, `boar`...) se mantienen; cada bioma les pone piel y ajustes con `G.B.fam` (8-9 tipos por bioma), así que encargos, drops, packs, `tierCurve`, `maxAlive` y bot siguen valiendo; masa por tier conservada (55/44/29/25) y censo obligatorio.
2. Bosque (8), Cripta (9) y Asfodelo (8) quedan definidos con tier, entrada, coste, HP/vel/daño relativos, telegrafía >= regla, sprite y frames; 10 mecánicas nuevas (órbita, rebote, rastro, cadena, charcos ocultos, salto, rebrote, línea instantánea, `cdSlow`).
3. Debilidades por material (13 x 6, +-25 %): lana-Fuego, magma-Hielo, asfodelo-Rayo, etc.; los jefes llaman a su familia sin cambiar su código.
4. Orden de portal: Pastor, Karceron, Letea, Yarlak, Reina; cada uno se abre al vencer al anterior.
5. Tundra: hielo con tau 220 ms y derrape de 86 px, nieve firme a <= 260 px, ventisca que nunca tapa telegrafías, Frío que mitigan Fuego/Sangre/Hielo/hogueras.
6. Yarlak (mamut-glaciar): 4 fases, 8 ataques (regla +220 ms en hielo), Colmillos/Armadura/Corazón, HP inicial 25 500; familia de 9.
7. Reina Melaria: 3 fases, 8 ataques, Alas/Aguijón/Corona, miel y celdas hexagonales, humo, Veneno inmune; HP inicial 23 040; familia de 9 con Polinizador curandero.
8. Forja: 6 trofeos nuevos y rama "Ruta" sin PF; Peligro I-V con variantes; cacería y duraciones con un campo nuevo (`cold`).
9. Plan en 9 fases (P0-P8), 38 días en un flujo o ~26 con dos; publicable tras P1, P2, P4, P6, P7 y P8.
10. Arte: 120 sprites / 759 frames (114 nuevos + 6 variantes); riesgo principal: arte y física de hielo, mitigados con prioridad, variantes y orden de desbloqueo como dato.
11. Preguntas: ¿el Bosque pierde 4 roles?, ¿poder permanente "Ruta" sin PF?
