# SPEC T-F1-07: presentar la economía por pasos (pasos 1 y 4; diseño de los pasos 2 y 3)

Autor: `balance-designer`. Fecha: 2026-11-24. Estado: **pasos 1-3 implementados; F2 (Insignias dentro de Trofeos, 8.1) implementada con la opción A** (`src/res.js`, grupo de pruebas `res`; decisiones del dueño en la sección 11: sí a quitar el REROLL hasta la salida 4, sí a "vencer a un jefe lo enseña todo", ventana hasta el fin de la salida 3, F2 solo estudiada en 8.1). Estado original: solo diseño, sin código. Falta la revisión de presentación de `ux-designer` (posiciones y tamaños) y, para el paso 4, la decisión del dueño.
Tarea del plan: `studio/docs/PLAN-MAESTRO.md`, T-F1-07. Depende de T-F1-02 (`studio/docs/SPEC-T-F1-02-04.md`, ya implementada en `src/fte.js`).

Notación: **[C]** leído del código (con archivo y línea), **[M]** medido con bot en esta sesión, **[I]** inferido, **[P]** propuesta.

**Esta propuesta no toca ninguna cifra de balance.** Todo se sigue ganando, guardando y gastando igual que hoy; solo cambia *cuándo se enseña*. La única excepción de juego es la Ceniza (sección 3.4): durante las 3 primeras salidas se quita el botón REROLL. Eso quita una ayuda opcional y, por tanto, **no baja la dificultad** (si acaso la sube un poco). Lo digo claro porque es una decisión del dueño (pregunta 1).

---

## 0. Resumen

1. Hoy una cuenta nueva ve **6 o 7 recursos en sus 3 primeras salidas** y hasta los 7 en la primera [M, 16 cuentas de bot]: todas se traen partes de los 8 tipos, PF e Insignias en la salida 1, y algunas Esencia y trofeos. Incluso quien muere pronto ve 5, porque el detalle del botín y la pestaña SALIDA del Portal pintan siempre PF y Esencia [C].
2. Lo que de verdad se puede **gastar** en las 3 primeras salidas es solo Partes, Brasas y PF (en la forja de Grum, que llega tras la salida 2) y la Ceniza dentro de la expedición (REROLL). La Esencia no tiene uso hasta el Rango de forja III; trofeos e Insignias, hasta que abre Carapa (vencer al Pastor).
3. Propuesta: un registro central `G.Res` decide qué recurso se puede enseñar según un disparador por recurso. Con él, en las salidas 1-3 sin victoria sobre un jefe se ven exactamente **Partes, Brasas y PF**. Ceniza entra en la salida 4 (con Rufo y su Tónico), Esencia con el Rango III, trofeos e Insignias con Carapa. Lo ganado "en silencio" se revela con su cantidad la primera vez ("Has traído 4 chispas de forja").
4. El Archivo gana una pestaña **RECURSOS** que lo enseña todo, siempre.
5. Reversión: `G.B.resSteps = false` o `?dev=1&res=0`; las cuentas `legacy` de T-F1-02 lo ven todo como hoy.
6. Paso 4 (solo propuesta): recomiendo estudiar **Insignias dentro de Trofeos** (mismo sumidero, misma mecánica, cero pérdida de profundidad). Las demás fusiones, o no aportan o rompen algo; tabla en la sección 8.

---

## 1. Los siete recursos y qué cuenta como "mostrar"

Los siete del diagnóstico del plan (`PLAN-MAESTRO.md:48`): Ceniza, Brasas, Partes (8 comunes), Esencia rara, Puntos de Forja (PF), Trofeos de jefe e Insignias de guardián.

Fuera de alcance (no son economía de progreso, pero se citan en la sección 3.6): el contador "Salidas", la Leña y los farolillos de la racha (cosméticos, `src/objectives.js`), las medallas del reto diario.

**Mostrar un recurso** = dibujar en pantalla su contador, una cifra de ganancia o de coste con su nombre, su icono de recurso o un aviso que lo nombre ("+1 PUNTO DE FORJA"). No cuenta: el nombre de un nodo o de una carta ("Imán de brasas", "Ceniza viva"), la cinemática, el Manual ni el Archivo. Así se puede comprobar en pruebas con `textcheck` (regex por recurso) y con el registro de la sección 6.

**Salida** = la de `G.Fte.data().runs` (T-F1-02): cuenta si dura >= 60 s o se gana (`src/fte.js:126-132`). "Las 3 primeras salidas" = desde la primera expedición hasta la pantalla de fin de la salida 3, incluidas las visitas a la aldea tras la 1 y la 2. La aldea que se abre tras la salida 3 ya pertenece a la salida 4 [P, supuesto; pregunta 3].

---

## 2. Mapa de "primera vez que importa" (paso 1)

### 2.1 Del código [C]

Con el calendario de NPC de T-F1-02: Lanudo y Portal tras la salida 1; Grum y Vesper tras la 2; Ulalume y Rufo tras la 3; Castaña tras la 4; **vencer a cualquier jefe abre toda la aldea** (`src/fte.js:133-138`). Carapa abre al vencer al Pastor (`src/armor.js:30`).

| Recurso | Se obtiene por primera vez | Se puede gastar por primera vez | Primer uso real | Dónde se ve hoy |
|---|---|---|---|---|
| **Ceniza** (moneda de la expedición, no se guarda) | Salida 1, segundo 0: se empieza con 15 (`src/player.js:10`); cada baja suelta gemas de Ceniza (`src/combat.js:335-338`) | Salida 1, primera oferta de carta (14-35 s según el jugador, `SPEC-T-F1-03.md`): REROLL cuesta 15, 30, 45... (`src/cards.js:154`); descartar da +10 y omitir +5 | REROLL en la 1.ª oferta de la salida 1. Fuera de la expedición: Tónico de Rufo (+40, 80 Brasas, `src/panels.js:325`) y nodo "Ceniza viva" del Tronco (+20, `src/tree.js:174`). Al final se convierte en Brasas al 1,5 % (`src/loot.js:73`) | HUD de combate siempre (`src/hud.js:125`, `:171`), oferta de carta (`src/cards.js:525`, `:536-550`), Portal "Tónico (+40 Ceniza)" (`src/panels.js:479`) |
| **Partes** (8 comunes) | Salida 1, primeros segundos: Hebra del Cordero/Gusano 12 % x 0,70 (`src/loot.js:49-51`) | Tras la salida 2 (Grum): nodos T1 cuestan 8 de la parte principal y 4 de la secundaria (`src/loot.js:127`, x0,8, `src/tree.js:247-248`). Vesper paga partes desde la salida 2; Rufo (trueque, venta) desde la 3; Castaña (platos) desde la 4 | Primer nodo de Grum tras la salida 2 | HUD de combate "Partes N" (`src/hud.js:126`, `:175`), fin (`src/base.js:125-141`, `:220`), Forja, Rufo, Castaña |
| **Brasas** | Fin de la salida 1: 21 por minuto con crecimiento + 1,5 % de la Ceniza (`src/loot.js:74-75`, `:228`) | Tras la salida 2 (Grum): un nodo T1 cuesta 150 (30 x 5, `src/loot.js:79`, `:127`); R2 300 | Primer nodo de Grum tras la salida 2 | Fin principal "+N Brasas" y "Las Brasas sirven para forjar en Rescoldo." (`src/base.js:220-221`), detalle, barra de la aldea (`src/aldea.js:586`), cabecera del Portal (`src/panels.js:32`, `:441`) |
| **PF** (Puntos de Forja) | **Antes de jugar**: la cuenta nace con 1 PF de regalo (`src/save.js:40`). En la salida 1: +1 por el primer guardián de cada hueco (3:30 y 5:30), fragmentos (2 = 1 PF) (`src/tree.js:226-238`); el Pastor da 3 la 1.ª vez | Tras la salida 2 (Grum): cada nodo T1 pide 1 PF | Primer nodo de Grum tras la salida 2 | Aviso de combate "+1 PUNTO DE FORJA" / "FRAGMENTO DE PUNTO DE FORJA" (`src/tree.js:235-236`); detalle del fin "PF libres N - nodos comprables M" **siempre** (`src/base.js:166`) y "+N Puntos de Forja"; barra de la aldea solo con Grum (`src/aldea.js:578`); Portal "PF x1" en SALIDA (`src/panels.js:466`) y en la etiqueta de Rápida "Menos botín, más PF" (`src/loot.js:22`); Vesper; objetivo "Forja: ..., faltan N Puntos de Forja" (`src/endinfo.js:48`, `src/tree.js:305`) |
| **Esencia rara** (la 9.ª parte) | Salida 1 si llega lejos: 0,8 % por baja de coste >= 6 (desde 5:15), 35 % por guardián, 100 % al matar al jefe, y cada trofeo cuenta como 1 Esencia (`src/loot.js:61-69`, `:187-207`, `:77`) | **Rango de forja III** (T3, T4 y Segunda ancla la piden; todos exigen R3, `src/tree.js:262`, `:176`) o armadura T4+ (Yarlak) | Primer nodo T3 o Segunda ancla, muchas salidas después [I: R2 + R3 = 900 Brasas, 72 Hebra, 24 Pluma, 8 Placa, al menos 4-6 salidas de bot hábil sin gastar nada más] | HUD "Rara xN" si hay (`src/hud.js:128`, `:176`); detalle del fin "Prob. de Esencia rara: X %" **siempre** (`src/base.js:151`); Portal "Esencia x1" (`src/panels.js:466`); objetivos semanales y reto Oro ("1 Esencia", `src/objectives.js:73`, `src/daily.js` TXT `prize3`) |
| **Trofeos** (de jefe) | Primera parte rota de un jefe (Pastor, desde 7:30 en Normal), aunque se pierda (`src/boss.js:46-48`, `src/loot.js:249`) | Carapa (vencer al Pastor): Yelmo, Peto y Grebas de la Esquila piden su trofeo (`src/armor_data.js:50-52`); nodos de Ruta, mucho después (Yarlak) | Primera pieza de la Esquila tras vencer al Pastor | Detalle del fin, icono "+1 Cuerno" (`src/base.js:135-140`); Portal, Peligro "2 trofeos" (solo con Peligro II abierto); Carapa; Ruta del Tronco |
| **Insignias** (de guardián) | Primer guardián abatido (Bosque 3:30) (`src/minis.js:310-321`) | Carapa: el Talismán pide las 2 Insignias del bioma (`src/armor_data.js:44`, `:53`) | Primer Talismán tras vencer al Pastor | Aviso de combate "INSIGNIA: ... (¡NUEVA!)" (`src/minis.js:321`); Archivo "INSIGNIAS x/10" (`src/panels.js:677`); logros; Carapa |

### 2.2 Medido: qué recibe hoy una cuenta nueva en sus 3 primeras salidas [M]

Objetivo de la medición: saber, en una cuenta nueva y sin gastar nada, qué recursos llegan en cada una de las 3 primeras salidas y cuándo hay algo que comprar.

Método: script `econ.js` (fuera del repo, en el scratchpad de la sesión), que reutiliza el bot de `tools/card-swarm-bot/play_bot.js` (esquiva, fusiona, usa AUTO). **No compra nada**, así que lo acumulado es una cota superior de lo disponible. Servidor `python3 tools/serve.py card-swarm 8871` (cerrado por PID al terminar), 844x390 táctil, `?dev=1&direct=1&speed=4`, Bosque Normal 9 min, Peligro I, sin inmortalidad (`navigator.webdriver`), una cuenta nueva por cuenta (`reset=1` solo en la salida 1), semillas `1000 + 10 x cuenta + salida`. Dos perfiles: **A** (recoge gemas cuando no hay peligro cerca) y **B** (`__gems = 0`: no va a por gemas). n = 8 cuentas por perfil x 3 salidas = 48 expediciones. Cifras: media ± error estándar; "x/8" = cuentas.

| | A, salida 1 | A, salida 2 | A, salida 3 | B, salida 1 | B, salida 2 | B, salida 3 |
|---|---|---|---|---|---|---|
| Duración (s; 450 = llega al Pastor, el reloj se congela) | 404 ± 23 | 396 ± 20 | 376 ± 21 | 384 ± 15 | 357 ± 19 | 368 ± 16 |
| Llega al Pastor / lo vence | 4/8 / 0 | 2/8 / 0 | 1/8 / 0 | 1/8 / **1** | 0 / 0 | 0 / 0 |
| Brasas de la salida (acumuladas) | 204 ± 15 (204) | 195 ± 13 (423) | 183 ± 14 (618) | 187 ± 12 (187) | 168 ± 12 (372) | 174 ± 10 (563) |
| Partes de la salida (tipos distintos) | 116 ± 9 (8) | 107 ± 12 (8) | 95 ± 11 (8) | 102 ± 7 (8) | 86 ± 8 (8) | 92 ± 6 (8) |
| Cuentas que ganan PF en la salida (PF libres acumulados) | 8/8 (4) | 7/8 (4-5) | 6/8 (5) | 8/8 (4) | 6/8 (4) | 5/8 (5) |
| Cuentas con Esencia en la salida | 3/8 | 4/8 | 4/8 | 2/8 | 5/8 | 5/8 |
| Cuentas con alguna Insignia (acumulado) | 8/8 | 8/8 | 8/8 | 8/8 | 8/8 | 8/8 |
| Cuentas con algún trofeo (acumulado) | 2/8 | 2/8 | 2/8 | 1/8 | 1/8 | 1/8 |
| Cuentas con >= 1 nodo de Grum comprable al volver | 6/8 | 8/8 | 8/8 | 7/8 | 8/8 | 8/8 |
| Cuentas que pueden pagar R2 | 0/8 | 8/8 | 8/8 | 0/8 | 7/8 | 8/8 |

Recursos distintos que una cuenta ve **hoy** [M + C], contando lo que ganó (avisos de combate, HUD, fin principal) más lo que se pinta siempre (Ceniza en el HUD; PF y Esencia en el detalle del botín y en la pestaña SALIDA del Portal):

| | Solo la salida 1, flujo principal | Ventana de 3 salidas, flujo principal | Ventana, abriendo el detalle o SALIDA |
|---|---|---|---|
| Perfil A (8 cuentas) | 5, 5, 5, 5, 5, 6, 7, 7 | 5, 6, 6, 6, 6, 6, 7, 7 | 6, 6, 6, 6, 6, 6, 7, 7 |
| Perfil B (8 cuentas) | 5, 5, 5, 5, 5, 5, 6, 7 | 6, 6, 6, 6, 6, 6, 6, 7 | 6, 6, 6, 6, 6, 6, 6, 7 |
| Con la propuesta (sin victoria) | 2 (Partes, Brasas) | 3 (+ PF) | 3 |

Lectura y límites:
- Las Insignias llegan en la salida 1 a **todas** las cuentas medidas (el guardián de 3:30 cae siempre) y el PF también. Esas dos son las que más ruido meten hoy: aviso de combate en la salida 1 y nada donde gastarlas hasta la salida 2 (PF) o hasta vencer al Pastor (Insignias).
- Brasas: tras la salida 1 ya alcanzan para un nodo T1 (150) en 6-7 de cada 8 cuentas; Grum llega tras la 2.ª, así que la espera no la marca la economía, sino el calendario de T-F1-02. No propongo cambiarlo.
- **Los dos perfiles salen casi iguales**: el perfil B no es un "novato" (el AUTO de los poderes lo lleva lejos y venció al Pastor en una salida 1). Ninguno de los dos es un jugador real que pierde a los 2 minutos; ese vería menos Insignias y PF, pero seguiría viendo 5 recursos (Ceniza, Partes, Brasas y, en el detalle o en SALIDA, PF y Esencia). La conclusión ("hoy se ven 5-7 recursos en la ventana; la propuesta deja 3") no depende del perfil.
- n = 8 por perfil: los porcentajes tienen un margen amplio (con 2/8, el intervalo del 95 % va de ~3 % a ~65 %). Sirven para ordenar, no para fijar cifras.
- Los bots no usan el REROLL, así que no miden lo que cambia la sección 3.4.

### 2.3 Lo que dice el mapa

- **Lo único que tiene uso en las 3 primeras salidas** (sin vencer a un jefe): Partes, Brasas y PF en la forja de Grum, y la Ceniza en la oferta de carta. Son 4 y el criterio pide 3: sobra uno.
- La Ceniza es el candidato natural a esperar: no se guarda entre salidas, su uso (REROLL) es opcional y la primera oferta ya garantiza receta (`README`, `SPEC-T-F1-02-04.md` A.2). Además Rufo, que vende el Tónico de Ceniza, llega justo tras la salida 3.
- La Esencia, los trofeos y las Insignias se **ganan** pronto pero no se pueden **usar** hasta mucho después. Hoy se enseñan desde la salida 1 y no sirven para nada todavía: es el ruido que denuncia el plan.
- Los PF llegan antes de poder gastarse (regalo + guardianes en la salida 1), pero Grum aparece en la salida 2. En la salida 1 y 2 el aviso "+1 PUNTO DE FORJA" no tiene a quién llevárselo.

---

## 3. Propuesta de presentación (diseño de los pasos 2 y 3) [P]

### 3.1 Regla general

1. **La economía no cambia.** Las gotas, los cobros, el guardado y los costes son los de hoy. Solo se decide si un recurso se *dibuja*.
2. Cada recurso tiene un **disparador**. Antes del disparador no se dibuja en HUD de combate, barra de la aldea, pantalla de fin (principal y detalle), Portal, avisos de combate ni textos de recompensa. Después se dibuja como hoy.
3. Lo ganado antes del disparador **se guarda igual** y se revela con su cantidad la primera vez ("Has traído N...").
4. Antes de su disparador, la Esencia y los trofeos se cuentan dentro de "partes" en los totales agregados (la Esencia ya es una parte: `L.PARTS` id `rare`; cada trofeo ya suma 1 Esencia). Así ninguna cifra miente: "+14 partes" incluye la Esencia.
5. **Vencer a un jefe abre todo** lo que dependa del calendario de salidas, igual que T-F1-02 abre toda la aldea (`src/fte.js:136`). Quien vence al Pastor en la salida 2 ya ha demostrado que puede con más. (Pregunta 2.)
6. **El Archivo lo enseña todo siempre** (sección 5).
7. Cuentas `legacy` (con progreso antes de T-F1-02) o con el flag apagado: todo visible, como hoy.

### 3.2 Disparadores

`n` = salidas contadas (`G.Fte.data().runs`); `J` = ha vencido a algún jefe (`bossKills`).

| Recurso | Se muestra desde | Por qué entonces | Antes, qué pasa |
|---|---|---|---|
| Partes | Siempre (salida 1) | Se recogen desde el primer minuto y son lo que Grum pide | — |
| Brasas | Siempre (fin de la salida 1) | Es lo que se trae a casa; no está en el HUD de combate | — |
| PF | `n >= 2` o `J` (= Grum visible, `G.Fte.npcVisible('grum')`) | Es cuando se pueden gastar | Se ganan en silencio; el aviso de combate del guardián pasa a "¡GUARDIÁN DERRIBADO!" |
| Ceniza | `n >= 3` o `J` (= Rufo visible) | Rufo vende el Tónico; la salida 4 ya no tiene avisos de T-F1-02 | Se gana y se convierte en Brasas igual; no hay REROLL (3.4) |
| Esencia | Rango de forja III comprado, o Yarlak vencido, o la cuenta ya tiene un nodo/pieza que la pide disponible | Antes no hay nada que la pida | Cuenta como parte en los totales; sin "Rara xN" ni "Prob. de Esencia rara"; en textos de recompensa sale como "1 parte rara" |
| Trofeos | Carapa abierta (`G.Armor.smithOn()`) | Antes no hay nada que los pida | La parte rota se celebra igual ("¡CUERNOS ROTOS!", "Partes rotas: Cuernos" en el fin); el trofeo se recoge y se suma como parte |
| Insignias | Carapa abierta | Igual | Se recoge con su sonido, sin el aviso "INSIGNIA: ..." |

Recuento en la ventana de las 3 primeras salidas sin victoria: **Partes (salida 1), Brasas (fin de la salida 1), PF (aldea tras la salida 2) = 3**. Cumple el criterio. Con victoria sobre el Pastor en la ventana, el criterio no aplica por la regla 5 (la prueba lo comprueba aparte).

### 3.3 Qué cambia en cada superficie

| Superficie | Hoy [C] | Propuesta [P] |
|---|---|---|
| HUD de combate, columna derecha | "Ceniza N", "Partes N", "Rara xN" (`src/hud.js:124-128`, `:169-176`) | "Ceniza N" solo con Ceniza visible; "Rara xN" solo con Esencia visible. "Partes N" igual (ya incluye la Esencia) |
| Oferta de carta | "Ceniza: N", REROLL "15 Ceniza", DESCARTAR "+10 Ceniza", OMITIR "+5 Ceniza" (`src/cards.js:525`, `:536-550`) | Sin Ceniza visible: no hay contador ni botón REROLL; DESCARTAR y OMITIR siguen, sin la línea de Ceniza (la Ceniza se suma igual) |
| Avisos de combate | "+1 PUNTO DE FORJA" / "FRAGMENTO DE PUNTO DE FORJA" (`src/tree.js:235-236`); "INSIGNIA: ..." (`src/minis.js:321`) | Sin PF visible: "¡GUARDIÁN DERRIBADO!" y sin número flotante de PF. Sin Insignias visibles: sin aviso (el sonido queda) |
| Fin, pantalla principal | "+N partes · +N Brasas"; "+N Puntos de Forja"; objetivo "Forja: ..." (`src/base.js:220-222`, `src/endinfo.js:48`) | PF solo con PF visible; el objetivo "Forja" solo con Grum visible. Línea de primera vez (sección 4) en la salida 1 |
| Fin, detalle del botín | Rejilla de las 9 partes y trofeos; "Prob. de Esencia rara"; "+N Puntos de Forja"; "PF libres - nodos comprables"; "Duración ...: partes y Brasas x1, PF x, Esencia x" (`src/base.js:125-166`) | Rejilla sin la casilla de Esencia ni de trofeos mientras no se vean (sus unidades ya están en "+N partes" del título); sin la fila de Esencia y sin "PF libres" mientras no se vean; la línea de duración solo nombra lo visible |
| Barra de la aldea | Brasas siempre, PF con Grum (ya), Salidas | Igual (T-F1-02 ya lo hace bien) |
| Portal, DESTINO | Peligro solo con Peligro II abierto (ya); "Brasas x / 2 trofeos" dentro de Peligro | Igual: Peligro II solo se abre venciendo al Pastor, y entonces Carapa ya está |
| Portal, SALIDA | "Botín x1  PF x1  Esencia x1"; etiqueta de Rápida "Menos botín, más PF", "+40 % PF"; Larga "Esencia x1,5"; compras "Tónico (+40 Ceniza)" (`src/panels.js:465-466`, `:479`; `src/loot.js:22-24`) | Solo los visibles. Rápida sin PF visible: "Menos botín, jefe antes" (es verdad: el jefe sale a 5:50). Compras ya salen solo con Rufo o Castaña |
| Forja de Grum | Costes de todos los nodos con sus iconos; T3, T4 y Segunda ancla con Esencia; Ruta con trofeos; "Ceniza viva" | Nodos que piden Esencia: en lugar del coste, "Pide Rango de forja III" (no se pueden comprar antes de todos modos). Ruta: "Se abre tras vencer a Yarlak". "Ceniza viva": "Se abre cuando Rufo vuelva" hasta que la Ceniza sea visible (el PF se puede gastar en cualquier otro nodo) |
| Vesper (encargos) | Recompensa "N partes, N Brasas, 1 PF" | Igual: Vesper llega con Grum, el PF ya es visible |
| Objetivos (Diario) y reto | Semanal "..., 1 Esencia"; reto "Oro: +1 Esencia"; ficha VER KIT "Activos hoy (N PF)" | Esencia como "1 parte rara" hasta su disparador. Ver 3.6 para el resto |
| Rufo | Rejilla de partes para vender, "Las raras no se venden" | Sin la casilla de Esencia antes de su disparador |
| Archivo | Colección e Insignias | + pestaña RECURSOS (sección 5) |

### 3.4 La Ceniza en las salidas 1-3: efecto en el reto

- Sin Ceniza visible no hay REROLL. Quitar el REROLL **quita una opción**, no da poder: la dificultad no baja. Para un novato puede subir un poco si una oferta le sale mal. No lo puedo medir con bots: ninguno de `tools/` usa el REROLL. Lo medirá la analítica (T-F1-01) comparando el uso del REROLL en la salida 4 con cuentas antiguas.
- La primera oferta ya garantiza receta de fusión, así que el aprendizaje de T-F1-02 (elegir, fusionar, usar el poder) no depende del REROLL.
- La Ceniza se sigue sumando y se convierte en Brasas al terminar como hoy: el botín no cambia ni una Brasa.
- Alternativas (pregunta 1): (a) dejar la Ceniza visible desde la salida 1 y aceptar 4 recursos en la ventana; (b) fusionar Ceniza y Brasas (sección 8, F1), que es un cambio de economía con su propia medición.

### 3.5 Revelación de lo guardado

La primera vez que un recurso pasa a visible, si la cuenta ya tiene saldo, la línea de primera vez lleva la cantidad (claves `*.stored` de la sección 4). Ejemplos: Grum, al presentarse: "Has traído 4 chispas de forja sin saberlo..."; Carapa, en su escena: "Guardas 3 trofeos del Pastor y 2 insignias...". Se dice una vez por recurso (`flags.res.intro[id] = 1`).

### 3.6 Fugas fuera de T-F1-07 (las anoto; las decide quien lleve esas tareas)

- El Diario de objetivos se abre tras 1 expedición (`src/objectives.js:12`) y su chip aparece en la aldea de la salida 1 con recompensas en Brasas y partes, además de la Leña de la racha. Recomiendo que el chip llegue con Vesper (`n >= 2`), que es quien da encargos. Es de T-F1-06.
- El reto diario se abre con `S.runs >= 3` (`src/daily.js:15`), que cuenta también las salidas de menos de 60 s. Una cuenta con abandonos lo ve dentro de la ventana, con su ficha de kit que nombra PF. Recomiendo pedir además `n >= 3` en cuentas del flujo nuevo. Es de T-F1-05.

---

## 4. Líneas de primera vez y claves de texto [P]

Una sola vez por cuenta y por recurso, en el sitio donde el recurso empieza a importar. Tono de cuento junto al fuego: frases cortas, concretas, con la voz del NPC cuando la hay. Todas caben en una línea de 17 px lógicos de la columna de 960 (<= 70 caracteres) salvo las de diálogo, que ya se envuelven.

| Clave | Texto (es) | Dónde y cuándo |
|---|---|---|
| `res.partes.first` | Cada bicho deja algo: hebras, plumas, púas. Grum sabe darles forma. | Fin de la salida 1, bloque LO GANADO, bajo "+N partes · +N Brasas" (sustituye a "Las Brasas sirven para forjar en Rescoldo.") |
| `res.brasas.first` | Las Brasas son el calor que traes a casa. Con ellas se paga la forja. | Fin de la salida 1, segunda línea de LO GANADO |
| `res.pf.first` | Un Punto de Forja es la chispa del herrero: sin ella, el hierro no aprende. | Primera charla con Grum (primera línea del diálogo, antes de "El hierro recuerda...") |
| `res.pf.stored` | Has traído {0} chispas de forja sin saberlo. Gástalas aquí, conmigo. | Segunda línea de esa charla si `pfFree > 0` (con 1: "Has traído una chispa de forja...", clave `res.pf.stored1`) |
| `res.ceniza.first` | La Ceniza solo vive en la expedición: cambia cartas antes de que se enfríe. | Subtítulo de la primera oferta de carta con Ceniza visible (mismo hueco que el aviso `pick` de T-F1-02) |
| `res.ceniza.rufo` | ¿Ceniza? Se te escapa entre los dedos cada vuelta. Con un Tónico empiezas con más. | Primera charla con Rufo, si la Ceniza ya es visible |
| `res.esencia.first` | La Esencia rara casi nunca cae. El Rango III te deja forjar con ella. | Toast al comprar el Rango de forja III (o al vencer a Yarlak) |
| `res.esencia.stored` | Guardabas {0} Esencias raras entre las partes. Ahora sirven. | Segunda línea del toast si hay saldo |
| `res.trofeos.first` | Cada parte que rompes a un jefe deja su trofeo. Carapa cose con ellos. | Escena de Carapa (`src/aldea.js:241-246`), antes de "Toma el set de Aldeano" |
| `res.trofeos.stored` | Traes {0} trofeos del Pastor: dan para un yelmo, un peto o unas grebas. | Misma escena, si hay saldo |
| `res.insignias.first` | Los guardianes dejan insignias. Con las dos de un bosque, te coso un talismán. | Misma escena, tras los trofeos |
| `res.guardDown` | ¡GUARDIÁN DERRIBADO! | Aviso de combate que sustituye a "+1 PUNTO DE FORJA" mientras el PF no es visible |
| `res.rareAsPart` | 1 parte rara | Textos de recompensa mientras la Esencia no es visible |
| `res.rapidaTag` | Menos botín, jefe antes | Etiqueta de Rápida mientras el PF no es visible |
| `res.locked.esencia` | Pide Rango de forja III | Coste de nodos con Esencia en la Forja |
| `res.locked.ruta` | Se abre tras vencer a Yarlak | Nodos de Ruta |
| `res.locked.ash` | Se abre cuando Rufo vuelva | Nodo "Ceniza viva" |

Claves del Archivo (pestaña RECURSOS), una fila por recurso: `res.<id>.name`, `res.<id>.how` (cómo se consigue), `res.<id>.use` (para qué sirve), con `<id>` en `ceniza, brasas, partes, esencia, pf, trofeos, insignias`, más `res.tab` ("RECURSOS"), `res.soon` ("Lo conocerás más adelante") y `res.have` ("Tienes {0}"). Textos propuestos:

| `<id>` | `name` | `how` | `use` |
|---|---|---|---|
| ceniza | Ceniza | La sueltan los bichos durante la expedición. No se guarda. | Cambiar la oferta de cartas. Al volver, un poco se vuelve Brasas. |
| brasas | Brasas | Las traes al volver: más cuanto más aguantas. | Pagar la forja, la armadura, la cocina y a Rufo. |
| partes | Partes | Las sueltan los bichos: cada familia, la suya. | Forjar nodos, coser armadura, cocinar y cambiar con Rufo. |
| esencia | Esencia rara | Casi nunca cae: guardianes, jefes y bichos fuertes. Cada trofeo trae una. | Nodos de Rango III, cartas épicas y armadura alta. |
| pf | Puntos de Forja | Primer guardián de cada hueco, jefes, encargos y logros. | Aprender nodos del árbol de Grum. |
| trofeos | Trofeos | Romper partes de un jefe. | Armadura de Carapa y nodos de Ruta. |
| insignias | Insignias | Derribar guardianes. | Talismanes de Carapa. |

Las tablas van en `G.Res.TXT` con el mismo formato que `G.Daily.TXT` (`t('clave', a, b...)` sustituye `{0}`), lista para la capa de T-F3-04.

---

## 5. El Archivo siempre lo enseña todo [P]

- El Archivo se abre siempre desde MENÚ > ARCHIVO (`src/panels.js:867`), haya llegado Ulalume o no. Se añade una tercera pestaña **RECURSOS** junto a COLECCIÓN y ANCLAS.
- Siete filas fijas en el orden de la sección 1: icono, nombre, saldo actual ("Tienes N"; la Ceniza dice "Solo en la expedición"), `how` y `use`. Los recursos que aún no se han presentado se enseñan igual, con su saldo real y la marca "Lo conocerás más adelante". Nada se oculta aquí.
- La pestaña no depende del flag de pasos: con o sin él, igual.
- Encaje en pantalla (columna de 960, letra 17, botones de 66) a cargo de `ux-designer`.

---

## 6. Estado, API y flag de reversión [P]

- **Estado**: `Save.data.flags.res = { v: 1, intro: { <id>: 1 } }`. Solo `flags`: no sube la versión del guardado (como T-F1-02). Se normaliza al cargar con `|| {}`.
- **Módulo nuevo** `src/res.js` (`G.Res`), solo UI: nunca toca `G.rng` ni la simulación.
  - `G.Res.on()` = `G.B.resSteps !== false && G.Fte.enabled() && !G.Fte.data().legacy`.
  - `G.Res.visible(id)`: `true` si `!on()`; si no, aplica la tabla 3.2.
  - `G.Res.first(id)`: devuelve la línea de primera vez (con la cantidad si hay saldo) una sola vez y marca `intro[id]`; `null` si ya se dijo o si no es visible.
  - `G.Res.mark(id)`: cada sitio que dibuja un recurso lo anota en un conjunto por pantalla (`G.Res.shown`), que las pruebas leen. En producción es un `Set` que se vacía cada fotograma; coste despreciable.
  - `G.Res.TXT` y `G.Res.t(clave, ...)`.
- **Flag de reversión**: `G.B.resSteps` (por defecto `true`). Con `?dev=1&res=0` se pone a `false` al cargar (mismo patrón que `?fte=0`, `src/fte.js:11`). Con `false`, `visible()` devuelve siempre `true` y `first()` devuelve `null`: todo como hoy, incluidos el REROLL y los textos de siempre. `?fte=0` también lo apaga (sin aldea por pasos, los disparadores no tienen sentido).
- **Cuentas existentes**: las `legacy` de T-F1-02 (`runs > 0` o `introSeen` al cargar) lo ven todo. Una cuenta nueva que llega a `step: 'done'` (salida 4) sigue con los disparadores de Esencia, trofeos e Insignias: no dependen del calendario.
- **`sw.js`**: añadir `src/res.js` al precache (el grupo `iso` lo comprueba).
- **Notas de la implementación** (programador, 2026-11-24): `G.Res.on()` pide además `step !== ''` (cuentas que nunca entraron por la intro del flujo nuevo: bots, `?direct=1`, `?cine=0`, lo ven todo, igual que T-F1-02 no las engancha; si no, se quedarían con 0 salidas contadas para siempre). "Ceniza viva" cuenta como bloqueado (`G.Tree.status`) mientras la Ceniza no se ve, así que tampoco entra en "mejoras listas". Las fugas de 3.6 se aplican: Diario con Vesper (`G.Obj.isOpen`) y reto con 3 salidas contadas o un jefe vencido (`G.Daily.isOpen`), solo en cuentas del flujo nuevo. "1 Esencia" -> "1 parte rara" pasa por `G.Res.fix` en los textos de `G.Daily.t`, `G.Obj.t`, `G.Obj.rewardText` y `G.Quests.rewardText`.

---

## 7. Pruebas de visibilidad por número de salidas

Grupo nuevo **`res`** en `tools/card-swarm-bot/tests.js`, 844x390 táctil, `speed=0` y `G.step`. Cada comprobación cuenta los recursos de dos formas: el registro `G.Res.shown` y un `TC.snap` con una regex por recurso (`/Ceniza/`, `/Brasas/`, `/\bpartes?\b|Hebra|Pluma|Púa|Colmillo|Placa|Mecha|Escarcha|Jirón/`, `/Esencia|Rara x/`, `/\bPF\b|Punto.? de Forja/`, `/[Tt]rofeo/`, `/[Ii]nsignia/`). Las dos deben coincidir.

1. Cuenta nueva, salida 1 (forzando un guardián abatido, una Esencia y una parte de jefe rota): HUD de combate, oferta de carta y fin (principal y detalle) muestran como mucho {Partes, Brasas}. Sin "+1 PUNTO DE FORJA", sin "INSIGNIA", sin "Rara x", sin REROLL.
2. Aldea tras la salida 1 (`n = 1`): barra y Portal (DESTINO y SALIDA) solo {Brasas}; el Portal no dice "PF" ni "Esencia"; la etiqueta de Rápida es "Menos botín, jefe antes".
3. Salida 2: igual que la 1.
4. Aldea tras la salida 2 (`n = 2`): aparece PF en la barra, en Grum y en Vesper; Grum dice `res.pf.first` y `res.pf.stored` con el saldo real, una sola vez.
5. Salida 3 y su fin: {Partes, Brasas, PF}; el guardián ya da "+1 PUNTO DE FORJA"; sigue sin REROLL.
6. **Criterio**: la unión de lo mostrado en 1-5 tiene exactamente 3 recursos.
7. Aldea tras la salida 3 (`n = 3`): Rufo dice `res.ceniza.rufo`; en la salida 4 vuelve el REROLL y la 1.ª oferta lleva `res.ceniza.first`.
8. Esencia: oculta con R2; al comprar R3 sale el toast con el saldo; desde ahí "Rara x" y la fila del detalle. Los nodos T3 pasan de "Pide Rango de forja III" a su coste.
9. Trofeos e Insignias: ocultos hasta vencer al Pastor; la escena de Carapa da las tres líneas con sus saldos; desde ahí, aviso "INSIGNIA" y casillas de trofeo en el botín.
10. Regla 5: vencer al Pastor en la salida 2 vuelve visibles PF, Ceniza, trofeos e Insignias (la Esencia no: sigue esperando al R3).
11. Abandonar antes de 60 s no adelanta ningún recurso (se apoya en `fte.runs`).
12. El Archivo, pestaña RECURSOS: 7 filas en cualquier momento (cuenta nueva sin salidas, `n = 1`, `n = 4`, legacy), con el saldo real de cada uno.
13. Economía intacta: misma semilla y mismas acciones con `?res=0` y sin él dan el mismo `L.summary` (partes, Brasas, PF, Esencia) y el mismo `Save.data` al terminar, salvo `flags.res`.
14. `?dev=1&res=0` y `?fte=0`: todo visible desde la salida 1, REROLL incluido.
15. Guardados v9-v12 con progreso: legacy, todo visible, ninguna línea de primera vez.
16. Textos: las pantallas nuevas (fin de la salida 1, charla de Grum, escena de Carapa, Archivo RECURSOS, Forja con nodos "Pide Rango de forja III") pasan el grupo `text` a 844x390 y 740x360.

Pruebas existentes que hay que actualizar:
- `tests.js:2000` (grupo `end`, "primera expedición"): busca "Las Brasas sirven para forjar en Rescoldo"; pasa a buscar `res.partes.first` y `res.brasas.first`. La parte `!has(d, /Esencia|PF|nodos/)` se mantiene y ahora se cumple también en la vista de detalle.
- Las del grupo `fte` y `end` que abran la oferta de carta o el detalle del botín en una cuenta nueva y esperen REROLL, "Prob. de Esencia rara" o "PF libres": revisar con `?res=0` o ajustar a lo nuevo. No he encontrado otras al leer `tests.js`; el programador debe pasar la batería entera.
- `textcheck`: añadir las pantallas del punto 16.

---

## 8. Paso 4: ¿se puede fusionar algún recurso? (solo propuesta; decide el dueño)

| # | Fusión | A favor | En contra | Profundidad que se pierde | Coste y riesgo | Recomendación |
|---|---|---|---|---|---|---|
| F2 | **Insignias dentro de Trofeos** ("trofeos de jefe" y "trofeos de guardián") | Mismo sumidero (Carapa), misma mecánica (saldo gastable + acumulado, `src/armor.js:132-133`), el código ya llama a sus sprites `trophy_mini_*` y el comentario dice "trofeo menor" (`src/panels.js:676`). Baja de 7 a 6 nombres | Hay que reescribir textos de logros ("Insignias 3/8/10"), del Archivo y de Carapa; los dos subtipos siguen existiendo en las recetas | Ninguna: cada pieza sigue pidiendo su trofeo concreto | Bajo: solo textos y una sección del Archivo. Sin cambio de balance | **Sí, estudiarla** |
| F3 | **Esencia como "parte rara"** (la 9.ª parte, sin nombre propio) | Ya es una parte en el código (`L.PARTS`, id `rare`) y el diseño de 3.1 ya la trata así antes del R3. Baja a 6 (o 5 con F2) | Pierde su identidad de "premio gordo" y el color propio; la regla de pity y "no se vende" quedan como excepción de una parte | Poca en mecánica, algo en emoción | Bajo, solo textos | Opcional. Lo de 3.1 ya da casi todo el beneficio sin renombrar nada |
| F1 | **Ceniza dentro de Brasas** (una sola moneda: en la expedición se recogen Brasas; REROLL las gasta del botín de esa salida) | Un nombre menos; resuelve la Ceniza del criterio sin quitar el REROLL; tema coherente | Cambia la economía: la Ceniza al final de una salida (600-1.900 [M]) frente a sus Brasas (~140-240 [M]); habría que reescalar, y cada REROLL pasaría a costar progreso de la meta. Toca Tónico, "Ceniza viva", Alforja, mutadores del reto y encargos | Cambia una decisión: hoy el REROLL es gratis para la meta; con la fusión, es un intercambio poder ahora / forja después. Puede ser más profundo o simplemente castigar | Alto: recalibrar con bots (economía v5) y revisar todas las cartas con Ceniza | No ahora. Solo si el dueño quiere el REROLL desde la salida 1 y no acepta 4 recursos |
| F4 | PF dentro de Brasas | Un nombre menos | Los PF son la barrera de habilidad (se ganan venciendo guardianes, jefes y encargos, con tope de 24, `src/loot.js:129`); las Brasas se ganan por tiempo. Fusionarlos deja comprar poder solo con repetir salidas | Mucha: el árbol dejaría de premiar el reto | Medio-alto | **No** |
| F5 | Trofeos dentro de Esencia | Ya suman 1 Esencia | Las piezas piden trofeos concretos (Cuerno, Vellón, Cayado) | Toda la recolección por parte rota | — | **No** |

### 8.1 Estudio de F2: Insignias dentro de Trofeos (implementado con la opción A)

Decisión del dueño (2026-11-24): primero solo se estudió; después del estudio, el dueño pidió aplicarla. No cambia ninguna cifra de balance.

**Implementación (programador, 2026-11-24, opción A, sin migración).** Un solo recurso "Trofeos" con dos familias: de jefe (`S.trophies`, tipo `tro`) y de guardián (`S.insignias`, tipo `ins`; las 10 Insignias de antes). El guardado sigue en v13 con los cuatro campos de siempre; `_sum`, copias e import estricto no cambian. `G.Res.IDS` pasa a 6 recursos; `visible('insignias')` queda como alias de `trofeos` (mismo disparador: Carapa) y `G.Res.have('trofeos')` suma las dos familias. Escena de Carapa: `res.trofeos.first` + `res.trofeos.stored` (solo los de jefe) + `res.trofeos.guard` + `res.trofeos.guardStored` (los de guardián), con la clave de intro `insignias` de antes para no repetir la línea a quien ya la oyó. Nombres propios: "Insignia de Cuerno" -> "Cuerno del Carnero", "Insignia de Raíz" -> "Raíz de la Tejedora" (los otros ocho ya eran nombres propios). Aviso de combate `TROFEO: <NOMBRE>  (¡NUEVO!)` (más corto que el de antes: el más largo cabe también en el lienzo de 960). Archivo COLECCIÓN "TROFEOS DE GUARDIÁN x/10" (letra 17); Carapa "Trofeo de guardián: ..." / "Trofeo de guardián del bioma"; logros "Cazador de guardianes", "Coleccionista de trofeos", "Colección completa", "Colgante completo" y el pedido "Cazador de trofeos" (mismos ids `insig3/8/10`, `armcol`, `p6`, mismas condiciones y premios). Pruebas: `save2` (guardado real v13 de antes de F2 en `tools/card-swarm-bot/fixtures/save-v13-pre-f2.json`, con los costes, piezas listas, logros y pedidos que daba aquel código), `res` (6 recursos, Carapa, aviso) y legibilidad de los talismanes.

**Qué cambia para el jugador.** Un solo nombre de recurso, "Trofeos", con dos familias: *trofeos de jefe* (los de hoy: Cuerno, Cayado, Vellón...) y *trofeos de guardián* (las 10 Insignias de hoy, con sus nombres propios: "Insignia de Cuerno" pasaría a "Trofeo de guardián: Cuerno del Carnero", o se conserva el nombre propio y solo cambia la familia). Los recuentos pasan de 7 a 6 recursos en el Archivo y en la tabla de la sección 3.2. Carapa sigue pidiendo lo mismo: cada pieza pide su trofeo concreto; el Talismán, los 2 trofeos de guardián de su bioma.

**Guardado.** Hoy hay cuatro campos: `trophies` / `trophiesEver` (saldo / acumulado de jefe) e `insignias` / `insigniasEver` (saldo / acumulado de guardián, más `brasa_primera`). Dos opciones:
- **A (recomendada): sin tocar el guardado.** Los cuatro campos se quedan; solo cambia la presentación (textos, Archivo, avisos). Cero migración, cero riesgo para `_sum` y las copias. Es la vía si F2 es solo de nombre.
- B: fusionar en `trophies` con prefijo (`g:carnero`). Exige subir la versión (v13 -> v14), copia `swarmhand.fusion.save.v13`, migración de saldo y acumulado, y reescribir `armor.js:132-164` (`A.have`, `A.haveAny`, gasto por `kind`), logros (`quests.js:305-326`, `armor.js:255`), Ruta (`tree.js` `trophiesHave`) y el Archivo. No aporta nada al jugador frente a A.

**Migración (solo con B).** `trophies[k] += 0` para los de jefe; `trophies['g:' + mid] = insignias[mid]` y lo mismo con `*Ever`; `brasa_primera` se queda como insignia de jefe final (título). Prueba: guardados v9-v13 con insignias y trofeos dan el mismo `A.readyCount()`, los mismos logros y la misma Ruta antes y después.

**Textos que cambian (con A o B).**
- Aviso de combate `INSIGNIA: <nombre> (¡NUEVA!)` (`src/minis.js:321`) -> `TROFEO DE GUARDIÁN: <nombre>`.
- Archivo: "INSIGNIAS x/10" (`src/panels.js`, pestaña COLECCIÓN) y la fila `res.insignias.*` de RECURSOS (se funde con `res.trofeos.*`: "Romper partes de un jefe o derribar guardianes." / "Armadura y talismanes de Carapa, nodos de Ruta.").
- Logros: "Cazador de guardianes", "Coleccionista de insignias", "Colección completa", "Colgante completo", "Cazador de insignias" (descripciones y lore).
- Carapa: requisitos del Talismán (`src/smith.js:129-130`, `:223`) y la línea `res.insignias.first` (se funde con `res.trofeos.first`).
- Lanudo: la historia de cada Insignia (`src/aldea.js`, `told_ins_*`).
- Manual y textos de diseño (`DESIGN-v6-minijefes.md`).

**Pruebas.** Grupo `res`: la regex de Insignias desaparece y la de Trofeos cubre las dos familias; `armor` y `armor2`: mismos costes; `save2`: solo con B.

**Coste.** Con A, pequeño (S): unas 15 cadenas y una fila menos en el Archivo. Con B, M (migración y pruebas). Recomendación: A, cuando el dueño lo decida.

---

## 9. Tamaño de la implementación

**M** (como dice el plan), unas 450-550 líneas tocadas:

| Pieza | Archivos | Estimación |
|---|---|---|
| `G.Res`: estado, disparadores, `first`, `mark`, TXT, flag | `src/res.js` (nuevo), `src/save.js` (normalizar `flags.res`), `sw.js` | ~140 líneas |
| HUD de combate y oferta de carta | `src/hud.js`, `src/cards.js` | ~30 |
| Avisos de PF e Insignia | `src/tree.js`, `src/minis.js` | ~15 |
| Pantalla de fin y objetivos | `src/base.js`, `src/endinfo.js` | ~50 |
| Portal, Rufo, Forja (nodos bloqueados), Archivo RECURSOS | `src/panels.js`, `src/tree.js` | ~150 (el Archivo es la mitad) |
| Líneas de Grum, Rufo, Carapa, toast de Esencia | `src/aldea.js` | ~30 |
| Textos de recompensa ("1 parte rara", Rápida) | `src/objectives.js`, `src/daily.js`, `src/loot.js` (solo `tag`/`gives`, no cifras) | ~20 |
| Pruebas `res` (16) y ajustes de `end` y `text` | `tools/card-swarm-bot/tests.js`, `textcheck.js` | ~200 |

Responsables según el plan: `ux-designer` (Opus) cierra la presentación de las secciones 3.3 y 5; implementa `programmer` (Sonnet, esfuerzo medio). Sin migración de guardado.

---

## 10. Riesgos

- **Esconder algo que hace falta.** Mitigación: solo se esconde lo que no se puede gastar todavía (tabla 2.1); el Archivo lo enseña todo; el flag lo devuelve todo.
- **Sorpresa al revelar.** Un jugador con 3 Esencias guardadas puede preguntarse por qué no las vio. Mitigación: la revelación dice la cantidad y que estaban "entre las partes"; los totales nunca mintieron.
- **REROLL ausente 3 salidas.** Quita una herramienta opcional; no baja el reto. No medible con los bots actuales; lo mide la analítica.
- **Victoria temprana.** Con la regla 5, quien vence al Pastor dentro de la ventana ve casi todo de golpe (Carapa, trofeos, Insignias, Ceniza). Es el mismo salto que ya da T-F1-02 con la aldea. Medido: 1 victoria en 48 expediciones de bot (perfil B, salida 1); ocurre, pero es raro.
- **Textos dispersos.** Muchos sitios dibujan recursos; si uno se olvida de preguntar a `G.Res`, la prueba 6 lo caza (regex sobre `TC.snap`).
- **T-F1-08** sigue moviendo el HUD: los cambios de 3.3 son de "dibujar o no", no de posición.

---

## 11. Preguntas para el dueño

1. **Ceniza y REROLL.** Para cumplir "no más de 3 recursos en las 3 primeras salidas" sin tocar la economía, propongo que el REROLL (y el contador de Ceniza) no aparezca hasta la salida 4. No baja la dificultad: quita una ayuda opcional. ¿Lo aceptas, o prefieres el REROLL desde el principio y 4 recursos en esas salidas?
2. **Victoria temprana.** ¿Vencer a un jefe en las 3 primeras salidas lo enseña todo de golpe (como ya pasa con la aldea en T-F1-02), o se mantiene el calendario de recursos aunque se gane?
3. **Ventana.** ¿"Las 3 primeras salidas" acaban en la pantalla de fin de la salida 3 (mi supuesto), o incluyen la aldea que viene después (entonces Rufo y la Ceniza tendrían que esperar una salida más)?
4. **Paso 4.** ¿Quieres que se estudie fusionar Insignias dentro de Trofeos (F2)? Es solo de textos y no cambia el balance. Las demás fusiones no las recomiendo ahora.
