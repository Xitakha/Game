# Swarm Hand - Diseño v7: Jefe final de la historia (Cenizar, el Incendio Primero)

Estado: DISEÑO, sin código, sin commit. Se inserta entre la P6 (Melaria, hecha) y la P7 (Integración) como fase **P6.5**. Parte de `DESIGN-v4-jefes.md` (principios, regla de esquiva, partes, Peligro), `DESIGN-v5-biomas.md` (Portal de 5 destinos, plan P0-P8, decisiones del dueño) y del estado real de `src/boss.js` + `boss_karceron/letea/yarlak/melaria.js` leído en el README (motor de N fases con `nPh`, `HIT_CAP` 32, `EXIT`, `PELIGRO`, `hpCal`/`dmgK`, `geo`, `weak/resist` por fase, desesperado, Último aliento en Peligro V, `hunt`/`practice`). Todas las cifras son punto de partida para el boss-bot.

Convenciones: daño en HP del jugador (100 base); telegrafía en ms; salida en px; jugador a 190 px/s; **regla de esquiva `tele >= 250 + 1000 x salida / 190`** (columna "Regla"; el motor suma +100 ms de decisión en el suelo de Peligro); `HIT_CAP` 32 por golpe; máx. 60 proyectiles enemigos y 4 adds de jefe (6 en Peligro V).

---

## 0. Resumen en una pantalla

| Punto | Decisión |
|---|---|
| Jefe | **Cenizar, el Incendio Primero** (la brasa de la que nacieron los otros cinco). Bioma/destino nuevo: **Cráter del Hogar Quemado** (`crater`) |
| Desbloqueo | Se abre al haber vencido a los 5 jefes (`bossKills` de Pastor, Karceron, Letea, Yarlak y Melaria >= 1). Sexto chip del Portal (P7) |
| Estructura | **7 fases**, 6 puertas de fase (inmune 3 s), 1 desesperado ("Cadena Final") |
| F1 | Propia: presenta al jefe, la arena y el tono (algo más dura que un F1 normal) |
| F2-F6 | El ataque/habilidad MÁS FUERTE de cada jefe en orden (Pastor, Karceron, Letea, Yarlak, Melaria), cada uno con **una mecánica nueva** y **una Reliquia** rompible |
| F7 | **Rosario del Incendio**: cadena de 6 eslabones (los 5 ataques reinterpretados + cierre propio) con ventanas de esquiva justas; las Reliquias rotas **acortan la cadena** |
| HP | 36 000 x `hpCal` 3,6 = **129 600** a 9 min, Peligro I; duración objetivo p50 **~10,5-11,5 min** |
| Win rate bot (Peligro I, 25/50/25, 10 % lapsos) | **30-40 %** |
| Entrada | Modo `final` ("Asalto al Cráter"): estilo cacería (sin horda larga, 6 ofertas de carta de preparación), que es con lo que están calibradas las manos del boss-bot |
| Esfuerzo | ~17 días calendario (F-A 5 en paralelo, F-B 8, F-C 4) + 1 día en P7 + 2 en P8 |

---

## 1. Concepto, lore y nombre

**Nombre:** Cenizar, el Incendio Primero (título: "Rey de Ceniza"). Alternativas por si el dueño prefiere otro: Ignarr, Brasa Madre, Cinérea.

**Lore (4 líneas):** El incendio que arrasó el hogar de la aldea no fue un accidente: fue una brasa viva que se negó a apagarse. Esa brasa prendió el cayado del Pastor, despertó a Karceron, envenenó el río de Letea, heló a Yarlak y enloqueció a la Reina. Los cinco eran sus rescoldos, y al caer cada uno el fuego se concentró en el siguiente y más antiguo: Cenizar. Viste cómo se apagaban cinco llamas; ahora arde la que las encendió, y lleva puesta una **Reliquia** de cada una.

**Silueta (para arte):** figura alta de ceniza compactada con costillas de brasa, corona de cinco puntas (una por jefe) y capa de humo que se arrastra. Sostiene cinco Reliquias ancladas al cuerpo: Cayado (mano derecha), Núcleo de brasa (pecho), Ojo del Olvido (frente), Colmillo glacial (hombro izquierdo), Corona de cera (cabeza). Paleta: ceniza `#3a3440`, brasa `#ff6a1a`, núcleo blanco-amarillo `#fff2b0`, ojos que cambian por fase. Tamaño **288 x 256 px finales** (el mayor del juego; Karceron 256 x 224), `r` cuerpo 96. Vuela a ras (lift 30) y se desplaza 40 / 50 / 60 / 65 / 70 / 75 / 85 px/s por fase.

**Tono por fase:** F1 casa en ruinas y calma amenazante; F2-F6 "cada fase huele a un jefe que ya conoces, pero sucio de ceniza" (el jugador reconoce el patrón y la música); F7 todo a la vez.

**Intro (3,5 s, reutiliza la tabla 2.2 de v4):** la chimenea del Hogar Quemado se enciende, la brasa sube, Cenizar se forma; tarjeta "CENIZAR - El Incendio Primero"; rugido (shake 10/600) y la corona de cinco puntas se enciende una a una (5 chispas con 5 notas del leitmotiv).

---

## 2. Desbloqueo y encaje con la P7

- **Condición:** los cinco `bossKills` >= 1 (no exige Peligro). `Boss.BIOME_BOSS.crater = 'cenizar'`, `Save.data.bossKills.cenizar`, `Save.data.peligro.cenizar`. Guardado **v8** (`Save.VERSION = 8`), copia en `swarmhand.save.v7`; quien ya venció a los cinco ve el Cráter abierto sin más.
- **Portal (P7):** 6.º chip "CRÁTER" (bloqueado: "? CRÁTER" con la pista "Apaga las cinco llamas"). Ancho: 6 chips de ~148 px + huecos caben en 960 px; verificar en P7. Orden de desbloqueo como dato (`UNLOCK_ORDER`), ya previsto en v5.
- **Aldea:** al vencer a Melaria, Lanudo y Vesper dicen la frase gancho ("Queda el fuego que los encendió a todos"); aparece un brasero encendido en la plaza que activa el chip.
- **Modo `final` ("Asalto al Cráter"):** sin horda de 7:30 (un combate de 11 min más 7:30 de preámbulo sería de 18+ min y no es calibrable). Estructura: 6 ofertas de carta seguidas (como la preparación de cacería, `G.prep`), luego intro. HP **sin** el x0,75 de cacería (la calibración de las manos p25/p50/p75 ya es de 6 ofertas). Se puede repetir; recompensas únicas solo la 1.ª vez (sección 11).
- **P7 integra:** chip, Peligro I-V de Cenizar (sección 10), 6.º botón de Cacería/Practicar (fases 1-7), logros, diálogos. P6.5 entrega el jefe jugable por `?boss=cenizar`.

---

## 3. Arena: el Cráter del Hogar Quemado

Arena estándar 1440 x 810, suelo de vidrio volcánico negro con vetas naranja; en el centro las ruinas del hogar de la aldea (chimenea, mesa y silla quemadas: decorado, sin colisión). **Principio: la arena muta por fase reutilizando los sistemas ya hechos** (no hay mecánicas de mundo nuevas en el motor).

| Elemento | Base (F1) | Mutación por fase |
|---|---|---|
| Pilares de ceniza | 6 pilares `r` 28, 300 HP, bloquean proyectiles, se reconstruyen a los 40 s | F2 los rompe el carril; F7 quedan 6 fijos (menos ruido visual) |
| Charcos de rescoldo (F1) | zonas grises 5 s | - |
| F3 | - | Sistema de lava + 3 islas `r` 120 de Karceron (`karceronCoverage`, isla a <= 264 px) |
| F4 | - | 3 charcos `r` 90 de Letea (ralentizan 30 %) + pilares de cristal |
| F5 | - | Física de hielo de la Tundra (`G.Tundra`, nieve firme `r` 90 -> 70, 5 hogueras, ventisca 0,45 y claro 330). Fallback si el gancho no se deja activar a mitad de pelea: solo tau/lambda sin Frío ni bruma |
| F6 | - | Sin celdas ni miel; solo anillos hexagonales (primitiva `hexring` ya soportada por el bot) |
| F7 | - | Arena limpia con 6 pilares; las cinco mutaciones "residuales" se dibujan como marcas en el suelo (cinco sellos) |

Invariantes a validar con tests (heredados): isla de F3 a <= 280 px de cualquier punto; nieve firme a <= 260 px en F5; camino sin zona letal en toda la Cadena (ver 8.3).

---

## 4. Cambios de motor necesarios (para el programador, sin escribir código aquí)

1. `DEFS.cenizar` con `phases` de longitud 7 (`nPh` ya es genérico), `gateCol`/`nameCol`/`winCol` por fase, `despairAt` 0,06, `pelHp` propio (tabla de HP por Peligro específica del jefe).
2. **Primitiva `chain`** (`S.chain`): planificador por línea de tiempo con eslabones, vista previa fantasma de toda la cadena (alpha 0,25, numerada) y fijación de objetivo por eslabón; reutiliza los manejadores `ATK` de los cinco jefes como "reinterpretaciones" (parámetros distintos, mismo `draw/hit`).
3. **Reliquias como partes ligadas a fase** (`part.phase = n`): solo apuntables en su fase; si no se rompen quedan "ardiendo" y suman un eslabón a la cadena de F7.
4. **Furia por fase** (150 s dentro de cada fase, se reinicia en la puerta) más Furia global a los 14 min.
5. **Mutación de arena en `onGate`** (activar/desactivar los sistemas de Karceron, Letea, Tundra) con limpieza explícita (zonas, proyectiles, adds).
6. HUD: barra con 7 segmentos, 5 marcas de Reliquia, glifos de cadena 1-6, cuenta atrás de Furia de fase.
7. Depuración: `?boss=cenizar&phase=1..7&hp=&peligro=&nointro=1`, `G.Boss.chainInfo()`, `G.Boss.chainReachable()` (test), `?cdmg=`, `?ccad=`, `?cgeo=`.

---

## 5. Tabla por fase

HP restante al final de cada fase (`thr`), HP de la fase y duración estimada a 9 min Peligro I (129 600 HP) con el DPS del boss-bot p50 (~210). Cadencia = pausa de inicio a inicio.

| Fase | Nombre | thr | % HP | HP fase | Dur. p50 | Cadencia | Ataque firma (mecánica nueva) | Reliquia (3,5 % HP) | Débil / resiste | Música (intensidad) | Stinger |
|---|---|---|---|---|---|---|---|---|---|---|---|
| F1 | Rescoldo | 0,90 | 10 | 12 960 | 62 s | 2,6 s | Zarpazo, Cometas, Barra de Rescoldo, Llamada (**Ceniza viva**) | - | Hielo x1,25, Acero x1,1 / Fuego x0,8 | `boss_cenizar` 0,50 | `intro` |
| F2 | Éxtasis de Cenizas | 0,76 | 14 | 18 144 | 86 s | 2,4 s | Éxtasis de Cenizas (**oleadas con inversión + carril**) | Cayado | Acero x1,25, Hielo x1,1 / Veneno x0,8 | 0,60 | `p2` |
| F3 | Réquiem Abrasador | 0,62 | 14 | 18 144 | 86 s | 2,2 s | Réquiem Abrasador (**islas que giran**) | Núcleo | Hielo x1,25, Rayo x1,25 / Fuego x0,6 | 0,70 | `p3` |
| F4 | Coro de los Tres Ríos | 0,47 | 15 | 19 440 | 93 s | 2,2 s (por voz) | Coro del Olvido (**Eco retardado**) | Ojo | Veneno x1,25, Sangre x1,25, Rayo x1,1 / Hielo x0,8 | 0,78 | `p4` |
| F5 | Invierno de Ceniza | 0,33 | 14 | 18 144 | 86 s | 2,0 s | Invierno de Ceniza (**hielo y brasa alternos**) | Colmillo | Fuego x1,25, Rayo x1,25 / Hielo x0,6 | 0,86 | `p5` |
| F6 | Enjambre de Brasas | 0,18 | 15 | 19 440 | 93 s | 1,9 s | Zumbido de Ceniza (**anillos bidireccionales**) | Corona | Fuego x1,25, Hielo x1,25 / Veneno inmune (estados) y x0,5, Rayo x0,8 | 0,93 | `p6` |
| F7 | El Incendio Primero | 0 | 18 | 23 328 | 111 s | 1,6 s | **Rosario del Incendio** (cadena) + Sol de Cenizar | Corazón de Ceniza (4 %, solo en la ventana) | Todas x1,1; Fuego x0,8 | 1,0 (cadena sube tono) | `p7` + `chain` |
| D | Cadena Final | < 0,06 | - | ~7 800 | 10-14 s | - | Rosario completo (6 eslabones + Eco), jefe expuesto x1,25 | - | - | 1,0 + `despair` | `despair` |

Total p50: 617 s de combate + 6 puertas x 3 s = ~635 s (10,6 min); con pausas por derribo/ventanas y reposicionamiento real, **10,5-11,5 min**. p75 (~295): ~7,6 min. p25 (~120): ~18 min, perderá por Furia/daño (esperado).

**Transición entre fases (puerta):** 3 s inmune, rugido (shake 10/600), banner de fase, cambio de música cuantizado, mutación de arena durante los 3 s, limpieza de adds y zonas (`kill(e, true)`), **3 corazones** (36 HP; en v4 eran 2: ver presupuesto de vida en 9.2) y las dos esquinas de la barra se apagan. El HP no baja del `thr` hasta que dispara la puerta (suelo de duración, regla 5 de v4).

---

## 6. Detalle de las fases F1-F6

### 6.1 F1 - Rescoldo (propia)

Cenizar flota cerca del centro; la nueva arena y su tono. Algo más desafiante que un F1 típico: 4 ataques y cadencia 2,6 s (Pastor 2,8 s).

| Ataque | Telegrafía (ms) | Patrón | Daño | cd | Salida | Regla | Comentario |
|---|---|---|---|---|---|---|---|
| Zarpazo de Rescoldo | 850 | arco 120 grados, alcance 210, hueco interior 50 (pegarse es seguro) | 24 | 6 s | 95 | 750 | enseña "cerca = seguro" |
| Cometas de Ceniza | 700 | 5 orbes en abanico 60 grados, v 210; dejan ceniza al caer | 10 c/u | 7 s | 35 | 434 | cobertura de pilares |
| Barra de Rescoldo | 1000 | rectángulo 60 x 520 desde el jefe que gira 100 grados en 1,4 s | 22 | 10 s | 110 | 829 | enseña a leer barridos |
| Llamada de Cenizas | 800 | anillo morado, 2 Ascuas (tope 4) | 0 | 20 s | - | - | adds de la familia de la Cripta |

**Mecánica nueva (Ceniza viva):** la ceniza que cae de Cometas y Barra queda 5 s como zona gris (5 de daño/400 ms, ralentiza 15 %; el gris es "peligro de suelo", no rojo). La arena se va llenando y limita el kiteo; el Fuego las "enciende" y las limpia (crea humo, no daño) como pista para builds.

### 6.2 F2 - Éxtasis de Cenizas (Pastor)

El ataque más fuerte del Pastor es el **Éxtasis del Rebaño** (9 s, anillos de espinas con 2 huecos de 45 grados cada 1,3 s, jefe expuesto x1,25).

| Ataque | Telegrafía | Patrón (reinterpretado) | Daño | cd | Salida | Regla |
|---|---|---|---|---|---|---|
| **Éxtasis de Cenizas** (firma) | 1200 (cayado clavado en el centro, huecos marcados con faros) | 7 oleadas de anillos de espinas (v 170, 2 huecos de 45 grados) cada 1,3 s; el giro **se invierte** entre la 3.ª y la 4.ª (+20 / -35 grados); entre la 4.ª y la 5.ª cruza un **carril de embestida** 90 x 1440 | 10 c/u; carril 24 | 30 s | huecos: radial (170 < 190, se huye); carril 55 | carril 539 (tele 900) |
| Zarpazo y Cometas de F1 | como F1 | - | - | - | - | - |
| Barra de Rescoldo | 1000 | solo si el Éxtasis no está activo | 22 | 10 s | 110 | 829 |

- **Mecánica nueva (inversión + carril):** el patrón de huecos no es lineal; la inversión se avisa con la flecha de los faros 700 ms antes (el último 30 % sólido). El carril obliga a abandonar el hueco que se tenía guardado.
- **Jefe quieto y expuesto x1,25** mientras dura (recompensa de leer bien). Furia por fase no corre durante el Éxtasis.
- **Reliquia Cayado (3,5 %):** rota, el Éxtasis dura 6 s con 5 oleadas y **sin carril**. Trofeo: Cayado de Ceniza.

### 6.3 F3 - Réquiem Abrasador (Karceron)

Más fuerte de Karceron: **Réquiem de Fuego** (toda la arena en lava salvo 3 islas que se encogen de `r` 120 a 70 en 8 s, 1 brasa/s sobre las islas, jefe expuesto x2,0 en el núcleo).

| Ataque | Telegrafía | Patrón | Daño | cd | Salida | Regla |
|---|---|---|---|---|---|---|
| **Réquiem Abrasador** (firma) | 2000 (grietas, islas en blanco pulsante) | lava 12/400 ms; 3 islas `r` 120 -> 80 en 8 s; brasa `r` 50 cada 1 s con 900 ms de aviso sobre islas; dura 12 s | 12/tick; brasa 18 | 32 s | isla <= 218 | 1397 |
| Martillazo de Cenizar | 900 | círculo `r` 90 fijo al empezar; deja la maza clavada 1,2 s (ventana x1,25) | 28 | 6 s | 100 | 776 |
| Lluvia de brasas | 900 por impacto | 6 meteoros cada 250 ms | 18 | 7 s | 65 | 592 |

- **Mecánica nueva (islas que giran):** las 3 islas orbitan el centro a 25 px/s (más lento que el jugador): hay que desplazarse con la isla, no solo llegar a ella. Test obligatorio: en todo instante hay una isla a <= 280 px de cualquier punto jugable.
- **Reliquia Núcleo (3,5 %, en el pecho, apuntable con la isla):** rota, las islas **no giran** y no bajan de `r` 95. Trofeo: Núcleo Ceniciento.

### 6.4 F4 - Coro de los Tres Ríos (Letea)

Más fuerte de Letea: **Coro del Olvido** (3 voces ancladas cantan ácido / cono helado / rayos en rotación cada 1,5 s a +30 % de tamaño, cuerpo expuesto x1,25).

| Ataque | Telegrafía | Patrón | Daño | cd | Salida | Regla |
|---|---|---|---|---|---|---|
| **Coro de los Tres Ríos** (firma) | 1000 (tres bocas se abren en 120 grados) | 12 s, una voz cada 1,5 s: ácido (3 charcos `r` 65, 6 s), cono helado 40 grados alcance 420 ralentiza 35 % 2 s, rayos (4 círculos `r` 58 secuenciales) | ácido 8/tick, hielo 14, rayo 22 | 28 s | 60 / 60 / 55 | 566 / 566 / 540 |
| Mordisco en picado (de la voz activa) | 700 | carril 70 x 320, fijo los últimos 480 ms | 22 | 5 s | 35 | 434 |
| Coletazo | 800 | rosquilla 110-240 (pegado o lejos es seguro) | 24 | 8 s | 75 | 650 |

- **Mecánica nueva (Eco):** cada voz deja un **eco**: repite su mismo patrón 2,0 s después desde la posición espejo (180 grados), dibujado como contorno punteado desde el momento en que sonó la voz original, con aviso completo de 900 ms antes de dañar. El jugador memoriza dos secuencias a la vez; solo se castiga si no se lee el contorno.
- **Reliquia Ojo (3,5 %, en la frente):** rota, **sin Eco** y las voces cantan cada 1,8 s. Trofeo: Ojo Anegado.

### 6.5 F5 - Invierno de Ceniza (Yarlak)

Más fuerte de Yarlak: **Invierno Eterno** (ventisca 0,6, hogueras `r` 120, Frío +6 %/s fuera de ellas, 7 oleadas de carámbanos con 2 huecos de 45 grados cada 1,4 s, jefe quieto, Corazón x2,0).

| Ataque | Telegrafía (regla del hielo +220 ms) | Patrón | Daño | cd | Salida | Regla |
|---|---|---|---|---|---|---|
| **Invierno de Ceniza** (firma) | 1300 (la ceniza blanquea el suelo, hogueras crecen) | 12 s: 7 oleadas de 12 carámbanos (v 170, 2 huecos de 45 grados, giro 18 grados) cada 1,4 s, **alternando con ráfagas de brasas** sobre las hogueras | carámbano 10, brasa 16 | 30 s | hueco / hoguera 130 | 1154 |
| Ventisca blanca | 1250 | 3 olas de 120 px a 260 px/s con 1 hueco de 140 px, empujan | 14 | 24 s | 140 | 1207 |
| Cornada de ceniza | 950 | cono 90 grados alcance 220, empuje 90 | 24 | 7 s | 80 | 891 |

- **Mecánica nueva (hielo y brasa alternos):** durante el Invierno, las hogueras protegen del Frío pero **cada 2,8 s** se encienden en brasa (círculo `r` 120, 900 ms de aviso naranja, 16 de daño): hay que salir de la hoguera cuando arde y volver cuando pasa. Es un reloj posicional.
- **Física:** hielo de la Tundra con tau 220 / lambda 2,2 y la regla del hielo; todos los ataques de la fase llevan `ice:true`; opción "Hielo suave" respetada.
- **Reliquia Colmillo (3,5 %, hombro):** rota, **Frío a la mitad** y las hogueras quedan en `r` 120 permanente sin brasas alternas. Trofeo: Colmillo de Ceniza.

### 6.6 F6 - Enjambre de Brasas (Melaria)

Más fuerte de Melaria: **Zumbido Mortal** (10 s, 5 anillos hexagonales de fuera hacia dentro cada 1,3 s, 900 ms de aviso y 200 ms de daño, 2 huecos de ~150 px, aterriza aturdida x1,25).

| Ataque | Telegrafía | Patrón | Daño | cd | Salida | Regla |
|---|---|---|---|---|---|---|
| **Zumbido de Ceniza** (firma) | 1000 (anillos fantasma numerados) | 12 s, 5 anillos hexagonales (R = k x 83, grosor 32, 2 huecos de ~150 px): los impares **contraen** y los pares **expanden** | 18 | 30 s | hueco / entre anillos <= 100 | 776 |
| Estocada de Cenizar | 900 | carril 168 x 420 fijo los últimos 300 ms | 26 | 6 s | 99 | 771 |
| Llamada del enjambre | 800 | 2 Avispas + 1 Polinizador de ceniza (máx. 1), tope 4 adds | 0 | 20 s | - | - |

- **Mecánica nueva (anillos bidireccionales):** dos sentidos de anillo se cruzan, así que los huecos de dos anillos consecutivos no están alineados: la ruta segura serpentea. Último 30 % de cada aviso fijo y sólido.
- **Cierre:** los últimos 2 s aterriza aturdido (ventana x1,25), como el original.
- **Reliquia Corona (3,5 %, cabeza):** rota, todos los anillos **contraen** (sin sentido inverso) y desaparece la Llamada. Trofeo: Corona de Ceniza.

---

## 7. Reliquias y debilidades (resumen)

| Reliquia | Fase | Medidor (% HP total) | Al romperse (además de derribo 3 s x1,3, corazón y trofeo) | Eslabón de F7 que desaparece |
|---|---|---|---|---|
| Cayado | F2 | 3,5 % | Éxtasis corto, sin carril | 1 Doble Embestida |
| Núcleo | F3 | 3,5 % | Islas sin giro y sin encoger de 95 | 2 Doble Martillazo |
| Ojo | F4 | 3,5 % | Sin Eco | 3 Coro de tres conos |
| Colmillo | F5 | 3,5 % | Frío x0,5, sin brasas alternas | 4 Ventisca doble |
| Corona | F6 | 3,5 % | Anillos solo contraen, sin Llamada | 5 Zumbido en espiral |
| Corazón de Ceniza | F7 | 4 % | Derribo 5 s x1,5, +20 % cadencia | (el 6.º, Sol, siempre queda) |

- Una Reliquia solo es apuntable en su fase; fuera de ella queda grisácea e invulnerable. Si no se rompe, queda "ardiendo" y **su eslabón entra en la cadena de F7** (el jugador ve cuántos glifos quedan). Rota = cadena más corta y más corazones: decisión de riesgo (romper cuesta tiempo y posición, pero alivia F7).
- 3,5 % de 129 600 = 4 536 HP por Reliquia, ~21 s de DPS p50 apuntado. Peligro IV: +30 % de medidor.
- **Cobertura de etiquetas:** Hielo (F1, F3, F6), Acero (F1, F2), Rayo (F3, F5), Veneno/Sangre (F4), Fuego (F5, F6), todas x1,1 en F7. Resistencias moderadas (Fuego x0,8 base) para no invalidar una build en toda la pelea; cada etiqueta brilla en al menos una fase.

---

## 8. F7 - El Incendio Primero: Rosario del Incendio (cadena)

### 8.1 Qué es
Cenizar ata los cinco ataques en una **cadena sin respiro**: el siguiente eslabón empieza a telegrafiarse antes de que el anterior termine, y su zona segura se coloca a <= 60 px de la zona segura del anterior (solapamiento por construcción). La dificultad está en la **gestión del tiempo y del espacio**, no en una telegrafía injusta: **cada eslabón respeta `tele >= 250 + 1000 x salida / 190`** y mantiene su telegrafía completa. Antes de la cadena hay un **Anuncio** de 1500 ms con los glifos 1-6 sobre el jefe (los eslabones que existen) y la silueta fantasma de todos los eslabones (alpha 0,25). Cada eslabón fija su objetivo en el último 30 % (contorno sólido).

Cadena completa de Peligro I (t en ms desde el inicio de la cadena; "tele" = duración de la telegrafía; "impacto" = instante de daño):

| # | Eslabón | Reinterpretación | tele inicia | tele | impacto | Zona / patrón | Daño | Salida (px) | Regla | Margen |
|---|---|---|---|---|---|---|---|---|---|---|
| 0 | Anuncio | glifos 1-6 | 0 | 1500 | - | sin daño; el jugador se reposiciona | 0 | - | - | - |
| 1a | Doble Embestida | Estampida del Pastor | 1500 | 900 | 2400 | carril 100 x 560 fijo los últimos 300 ms | 24 | 55 | 539 | +361 |
| 1b | (2.ª carga) | re-aim | 2700 | 600 | 3300 | segundo carril, 300 ms de línea fija | 24 | 55 | 539 | +61 |
| 2a | Doble Martillazo | Martillazo de Karceron | 2700 | 900 | 3600 | círculo `r` 90 fijo al empezar; maza clavada | 28 | 100 | 776 | +124 |
| 2b | | | 3300 | 900 | 4200 | segundo círculo `r` 90 | 28 | 100 | 776 | +124 |
| 3 | Coro de tres conos | Coro de Letea | 3850 | 950 | 4800 | 3 conos 40 grados alcance 420 desde 3 anclas a 120 grados (ácido / hielo / rayo); sectores libres de 80 grados | 14 / 14+slow / 22 | 110 | 829 | +121 |
| 4 | Ventisca doble | Ventisca/Invierno de Yarlak | 4200 | 1100 | 5300 | 2 olas de 120 px a 260 px/s cada 1,5 s con 1 hueco de 140 px (colocado siempre en un sector libre del Coro); contacto en el eje corto | 14 + empuje | 140 | 987 | +113 |
| 5 | Zumbido en espiral | Zumbido Mortal de Melaria | 6000 | 900 | 6900 | 3 anillos hexagonales (grosor 32, 2 huecos de 150 px) cada 700 ms; impactos 6900 / 7600 / 8300; el primero alineado al hueco de la 2.ª ola | 18 | 80 | 671 | +229 |
| 6 | **Sol de Cenizar** (cierre propio) | pulso de rosquilla | 7600 | 1300 | 8900 | rosquilla interior 120 (pegado al cuerpo seguro) / exterior 330, onda r 330; luego jefe agotado 4 s (cuerpo x1,5, Corazón x2,0) | 22 | 120 | 882 | +418 |

Duración total: ~8,9 s de peligro + 1,5 s de anuncio + 4 s de ventana. Daño máximo si se falla todo: 24+24+28+28+14+22+14+18x3+22 > 230 (letal por diseño; un fallo suelto cuesta 14-28, el bot/humano que falla 3-4 eslabones muere).

**Huecos entre impactos consecutivos (la "tensión" de la cadena):** 2400 -> 3300 (900) -> 3600 (300) -> 4200 (600) -> 4800 (600) -> 5300 (500) -> 6800 (ola 2) -> 6900 -> 7600 (700) -> 8300 (700) -> 8900 (600). Esos son los puntos "justos" que se calibran.

### 8.2 Citas y frecuencia
- F7 alterna **citas individuales** (los 5 ataques fuertes reinterpretados, uno por vez, con su telegrafía normal de F2-F6) y la cadena. Cadencia entre acciones 1,6 s; cd de la cadena 16 s. Un saco barajado sin repetición; la primera cadena sale a los 8 s de la fase para que el jugador la lea.
- Cada Reliquia rota quita un eslabón (columna de 7); el eslabón 6 (Sol) siempre queda. Con las 5 rotas, F7 es una cita + Sol: la pelea sigue siendo F7 pero lo difícil se desactiva (premio por jugar las F2-F6).

### 8.3 Reglas de justicia de la cadena (validar con tests)
1. Cada eslabón respeta la regla de esquiva por separado (tabla de 8.1), y la telegrafía de Peligro no baja de la regla +100 ms (el eslabón 1b y el 3 ya están en el suelo: no admiten el -10 %).
2. **Alcanzabilidad:** `G.Boss.chainReachable()` busca, por tiempo y con velocidad 190 px/s (123 px/s con la ralentización del eslabón 3 si se recibe), un camino sin daño desde 200 posiciones de partida aleatorias: debe existir >= 95 % de las veces, y 100 % desde la posición "óptima" del Anuncio.
3. **Solapamiento de zonas seguras:** distancia entre zona segura del eslabón k y la del k+1 <= 60 px (se garantiza al generar la cadena: el hueco de la ola se coloca en un sector libre del Coro; el primer anillo, alineado con el hueco de la ola).
4. **Nunca más de 3 zonas letales simultáneas** y <= 40 proyectiles por eslabón (<= 60 global).
5. **Ralentización:** si el jugador recibe el cono helado (eslabón 3), el eslabón 4 pasaría a requerir 250 + 1000 x 140 / 123 = 1388 ms; es el castigo previsto por fallar (el jugador ya pagó daño).
6. Color por eslabón: contorno con el color del jefe original (morado Pastor, naranja Karceron, turquesa Letea, azul-blanco Yarlak, ámbar Melaria, blanco Cenizar) y relleno rojo de daño; el número del glifo se muestra sobre cada zona.

### 8.4 Desesperado: Cadena Final (< 6 % HP)
Rosario completo (los 6 eslabones, ignora las Reliquias rotas) más un **Eco** (la cadena se repite en espejo con los dos primeros eslabones), 14 s, 100 % esquivable (se valida con un bot sin lapsos >= 90 %), jefe expuesto x1,25 entre eslabones. Peligro V: dos Cadenas Finales (6 % y 3 %).

---

## 9. HP, duración y calibración

### 9.1 Fórmulas

`HP = 36 000 x hpCal x durMul(0,75 / 1 / 1,10) x Peligro(HP)` con **hpCal inicial 3,6** (el de Melaria; el DPS real vs único blanco ya medido es ~210 para la mano p50, ver README) y `dmgK` inicial 1,3.

| Duración run | I | II | III | IV | V |
|---|---|---|---|---|---|
| Factor HP de Peligro (propio de Cenizar) | 1,00 | 1,10 | 1,20 | 1,30 | 1,40 |
| 7 min (x0,75) | 97 200 | 106 920 | 116 640 | 126 360 | 136 080 |
| 9 min (x1,00) | **129 600** | 142 560 | 155 520 | 168 480 | 181 440 |
| 10 min (x1,10) | 142 560 | 156 816 | 171 072 | 185 328 | 199 584 |

El factor propio de Peligro (1,00-1,40 en lugar de 1,00-1,75) evita peleas de 20 min en IV-V; se gestiona con `pelHp` en `DEFS` (motor nuevo, ver 4). Los demás multiplicadores de `PELIGRO` (daño +10 %/nivel, tele -10 % con suelo, adds, partes, Furia 120 s) se mantienen. Reparto por fase: sección 5.

### 9.2 Presupuesto de vida (clave en una pelea de 11 min)
El jugador no regenera. Datos del boss-bot: ~60-140 de daño recibido por pelea de 2-3 min. A 11 min la proyección es 300-450 de daño. Aporte de curación previsto:

| Fuente | Cantidad | HP |
|---|---|---|
| Vida inicial | - | 100 |
| Puertas de fase | 6 x 3 corazones de 12 | 216 |
| Reliquias rotas | 5 x 1 corazón | 60 |
| Corazón de Ceniza roto | 1 corazón | 12 |
| Plato / Tónico | según el jugador | (opcional) |
| **Total típico** | | ~390 |

Es un punto a calibrar con el bot (palanca: corazones por puerta 2-4 y gotas por ventana).

### 9.3 Furia y duración
- **Furia por fase:** a los 150 s dentro de una misma fase, +25 % de daño y cadencia (+10 % cada 15 s, tope +100 %), se reinicia en la puerta. Evita estancamiento en builds flojas sin castigar el total.
- **Furia global:** a los 14 min, +10 % cada 15 s adicional (tope +50 % acumulado), por seguridad. Peligro IV-V: 120 s por fase.
- Duración objetivo p50: 10,5-11,5 min (ver 5). p25 no ganará; p75 ~7-8 min.

### 9.4 Objetivos de win rate del boss-bot (10 % de lapsos, 12 peleas por mano, ponderado 25/50/25)

| Peligro | p25 | p50 | p75 | Ponderado objetivo | Duración p50 de victorias |
|---|---|---|---|---|---|
| I | 0-5 % | 35-45 % | 65-75 % | **30-40 %** | 9-12 min |
| II | 0 % | 30-40 % | 60-70 % | 25-35 % | 9-12 min |
| III | 0 % | 20-30 % | 50-60 % | 20-28 % | 10-13 min |
| IV | 0 % | 10-20 % | 40-50 % | 12-20 % | 10-13 min |
| V | 0 % | 0-10 % | 25-35 % | 6-12 % | hasta 14 min |

(Los jefes anteriores van de 60 a 24 %; el final queda ~25-30 puntos por debajo en Peligro I.) Aprendizajes aplicados de Yarlak/Melaria: subir `hpCal` solo alarga; `dmgK` casi no cuenta por el `HIT_CAP`; la palanca eficaz es el **potencial de daño** (`geo`: agrandar las zonas hasta consumir la holgura de la regla sin tocar la telegrafía) y reducir los márgenes de la cadena. Se parte de `geo` x1,3 en las firmas y se ajusta por fases. El bot necesita aprender: cadena con vista previa (planificar 2 eslabones), `hexring` bidireccional, islas móviles, carámbanos con ráfagas de brasa.

---

## 10. Peligro I-V de Cenizar

Acumulativo, sobre la tabla común (HP propio de 9.1):

| Nivel | Cambio de mecánica | Cadena de F7 | Desesperado |
|---|---|---|---|
| I | Base | 6 eslabones (con Reliquias intactas) | Cadena Final x1 |
| II | +1 add en Llamadas (Cenizas y Enjambre); telegrafías -10 % con suelo de regla | igual | igual |
| III | Variante: Éxtasis con carril doble, Martillazo triple en F3, Eco de 3 s en F4 | **7.º eslabón "Eco"** (repite el 1 a mitad de cadena) | igual |
| IV | Furia por fase a 120 s; medidores de Reliquia +30 %; derribos 2,4 s; ventisca de F5 con claro 300 y Frío x1,3 | cadena con **segundo Anuncio fantasma recortado a 1000 ms** | Cadena Final x1, 16 s |
| V | Último aliento: dos Cadenas Finales (6 % y 3 %), 6 adds, 3 corazones en cada puerta (compensación) | todo lo anterior | x2 |

Por golpe nunca >32 (`HIT_CAP`); trofeos x2 por Reliquia en IV-V; Brasas x1,00 / 1,25 / 1,50 / 1,75 / 2,00; PF extra 1.ª vez en III y V (techo global de 24 PF intacto).

---

## 11. Recompensas

| Recompensa | Detalle | Cuándo |
|---|---|---|
| Trofeos (6) | Cayado de Ceniza, Núcleo Ceniciento, Ojo Anegado, Colmillo de Ceniza, Corona de Ceniza, Corazón de Ceniza; cuentan como 1 Esencia y se guardan en `Save.data.trophies` para la rama "Ruta" (los 6 desbloquean un nodo final "Aliento del Cráter": +10 % de daño contra jefes si se completa la colección; sin PF, mismo criterio que "Ruta") | uno por Reliquia rota antes de la muerte |
| **Insignia** | Insignia 11, "Brasa Primera" (`Save.data.insignias`, no cuenta para los logros de 3 y 8 como las del Panal); se muestra en el Archivo | 1.ª victoria |
| **Título** | "Apagafuegos" (perfil/Archivo, también en el nombre del héroe en la barra de aldea) y "Cenizas al Viento" (derrota sin romper ninguna Reliquia) | 1.ª victoria / desafío |
| **Plato** | "Caldo del Hogar Reencendido" (Tía Castaña): +12 HP máx. y +1 corazón extra en las puertas de fase de la siguiente expedición (consumible; el doc de platos fija el resto) | desbloquea al vencer; ingredientes: Colmillo/Placa/Mecha |
| **Ítem final** | "Brasa Primera": gema de colección y estatua del Hogar en la plaza de la aldea (cosmético, sin poder). No añade PF por el techo de 24 | 1.ª victoria |
| Brasas / PF | 20 Brasas + 5 por Reliquia (x Peligro); PF 3 la primera vez, 2 después (techo 24 global; ya probablemente alcanzado) | cada victoria |
| Garantizados | `{plate:2, wick:2, thread:2, static:1, frost:1, spine:1, fang:1}` x multiplicador de Peligro | cada victoria |
| **Final de la historia** | Cinemática de 40-60 s al vencer por primera vez: el brasero de la plaza vuelve a arder, diálogo final de Lanudo, Vesper, Castaña, Grum y Ulalume, créditos cortos y vuelta a la aldea con la aldea "reconstruida" (3 detalles visuales). `Save.data.endingSeen = true` | 1.ª victoria |

Logros nuevos (P7): "Apagafuegos" (vencer a Cenizar), "Desatado" (romper las 5 Reliquias en una pelea), "Sin una chispa" (vencer sin que te alcance ninguna cadena).

---

## 12. Checkpoints entre fases

| Modo | Checkpoint | Razón |
|---|---|---|
| Asalto normal (`final`) | **Ninguno**; el jugador cae y pierde el intento. Las 6 puertas dan 3 corazones, 3 s de inmunidad y la barra muestra la fase para planificar | mantiene el riesgo de un jefe final; las puertas ya sirven de "descanso" |
| Cacería (repetir) | Ninguno (igual que el resto de jefes) | evita farmeo |
| **Practicar** | Sí, "reintentar desde la fase N" (teclas 1-7), mano guardada y HP x0,5 | aprender F7 sin repetir 10 min; sin recompensas |
| Propuesta opcional (decisión 3) | **Brasero de Fase** en la puerta F4->F5 (mitad): reposo de 3 s, cura +2 corazones extra, una vez por intento | alternativa si se considera que 11 min sin pausa es excesivo |

---

## 13. Requisitos de arte (contrato para tools-engineer / programmer)

Archivo nuevo `src/assets_boss5.js`. API: `Assets.drawBoss('cenizar')` con alias `'incendio'`, `Assets.bossAnchors('cenizar')`, `armor/skid/aim/open/broken` como el resto, dibujo de reserva por código si faltara. Todo vectorial por código, contorno `#1b1124`, rasterizado x2; sin `shadowBlur`.

| Sprite | Tamaño base -> final | Frames | Notas |
|---|---|---|---|
| `boss_cenizar_torso` | 112 x 96 -> 224 x 192 | 4 (idle, rugido, ventana abierta, daño) | cuerpo `r` 96 |
| `boss_cenizar_head` | 48 x 48 -> 96 x 96 | 4 | corona de cinco puntas (la Corona de Melaria es parte aparte) |
| `boss_cenizar_arm_l` / `_arm_r` | 40 x 64 -> 80 x 128 | 3 + 3 (reposo, ataque, roto) | brazo derecho porta el Cayado |
| `boss_cenizar_cloak` | 96 x 64 | 4 (humo ondulante) | capa de humo, parte decorativa |
| `reliq_cayado` / `_nucleo` / `_ojo` / `_colmillo` / `_corona` | 20-36 px | 3 c/u (activa, apagada, rota) | 15 frames |
| `boss_cenizar_core` (Corazón de Ceniza) | 28 x 28 | 3 (latido, expuesto, roto) | solo F7 |
| `boss_cenizar_eyes` | 24 x 10 | 7 (uno por fase) | colores por fase |
| `boss_cenizar_portrait` | 96 x 96 | 3 | tarjeta de intro |
| `trophy_cenizar_*` (6) | 32 x 32 | 12 (entero + roto) | + icono Insignia 11 |
| `fx_cenizar_glyph` (1-6) | 32 x 32 | 12 (activo, ejecutado) | glifos de cadena |
| `fx_chain_ghost` | variable | 1 | contorno fantasma de eslabón |
| `fx_ash_puddle` | 36 x 36 | 3 | Ceniza viva de F1 |
| `fx_ember_ring` | 128 x 128 | 4 | oleadas de F2 y F5 |
| `fx_sol_pulse` | 128 x 128 | 4 | Sol de Cenizar |
| `fx_cenizar_shatter` | 64 x 64 | 5 | rotura de Reliquia |
| `obs_ash_pillar` | 28 x 52 | 3 | |
| `tile_crater` + `decor_crater` | 32 x 32 | 6 + 6 | suelo y ruinas del hogar |

Reutilizables sin arte nuevo: `fx_hex_ring` (Melaria), `proj_icicle`, `fx_lava_tile`, `obs_ice_pillar`/pilares de cristal, `fx_fire_cell`, campfire. Presupuesto: **~34 sprites / ~100 frames** (menos que cualquier jefe+bioma anterior, porque la arena es mezcla de las ya existentes). Prioridad: torso, cabeza, brazos y Reliquias; luego glifos y FX de cadena; luego retrato y trofeos.

---

## 14. Requisitos de audio (contrato para audio-designer)

Archivo nuevo `src/sfx_cenizar.js`. Pista `boss_cenizar` (96 BPM -> 132 BPM al llegar a F7), 4 capas activables por fase; API: `Assets.music.setTrack('boss_cenizar')`, `setPhase(1..7)`, `setDespair(bool)` y **`setChain(n)`** (nuevo: sube un tono y un tambor por eslabón, 1-6, para marcar el ritmo del Rosario).

| Fase | Música / leitmotiv | Stinger |
|---|---|---|
| F1 | Percusión grave, cuerda frotada; tema propio de cuatro notas (el "fuego") | `stg_cenizar_intro` (5 chispas = 5 notas; la 5.ª es el tema) |
| F2 | Cita de la zampoña disonante del Pastor + tambor | `stg_cenizar_p2` |
| F3 | Yunque, cadenas, sirena (Karceron) | `stg_cenizar_p3` |
| F4 | Arpegio acuático con eco (Letea) | `stg_cenizar_p4` |
| F5 | Viento, campana y cuerdas heladas (Yarlak) | `stg_cenizar_p5` |
| F6 | Zumbido de enjambre sintetizado (Melaria) | `stg_cenizar_p6` |
| F7 | Collage de los cinco motivos sobre el tema del fuego, tempo subiendo | `stg_cenizar_p7` |
| Cadena | Tick por eslabón, anuncio con glifos (`chain_announce`), ejecución (`chain_hit`), cierre (`sol_pulse`) | `stg_cenizar_chain` |
| Desesperado | Tema a pleno, coro sintético | `stg_cenizar_despair` |
| Victoria | Fanfarria de 4 compases + silencio + brasa del hogar (`ending_hearth`) | `stg_cenizar_win` |

SFX nuevos (~22): `cenizar_roar`, `cenizar_hover`, `relic_glow`, `relic_break` (con `stg_part`), `ash_fall`, `ash_puddle`, `ember_wave`, `spike_ring`, `lane_charge`, `island_rotate`, `lava_rise`, `echo_ping`, `ice_creak`, `ember_flare`, `hex_ring_in`, `hex_ring_out`, `chain_announce`, `chain_hit`, `sol_charge`, `sol_pulse`, `gate_thud`, `ending_hearth`. Reglas heredadas: <= 4 voces por tipo, pitch +-10 %, un solo rugido a la vez, aviso ascendente 400 -> 1200 Hz para los firmas.

---

## 15. Riesgos

### 15.1 Rendimiento
| Riesgo | Mitigación |
|---|---|
| **HIT_CAP 32**: Peligro V + Furia multiplican; en la cadena, 5-7 golpes consecutivos | El cap se mantiene por golpe; el potencial de daño se regula con `geo` y el número de eslabones, no con el daño unitario; Furia por fase con tope |
| **Proyectiles <= 60**: Éxtasis (2 anillos x ~24 espinas) + carámbanos (12 por oleada) + Cometas | Máx. 2 oleadas vivas por patrón, pooling, eslabones con <= 40; el contador `G.dbg` cuenta el pico por fase |
| **Coste de dibujo**: jefe más grande (288 x 256, ~10 capas), telegrafías numeradas, hasta 12 zonas, ventisca en F5 | Caché por parte y por primitiva (como Melaria 1,9 ms), capas de FX solo cuando existen, calidad Baja con `noFx` y glifos simplificados, fantasma de cadena en 1 solo dibujo por frame; objetivo **>= Pastor - 3 fps** en Chromium sin GPU y >= 40 fps en móvil 844x390 |
| **Mutaciones de arena** (activar Tundra o lava a mitad de pelea) | Limpieza explícita y test de regresión 0 de los otros jefes; fallback de F5 sin bruma |
| **Duración 11 min** (fatiga, memoria de PWA en móvil) | Perf soak de 12 min; liberar canvases de fases pasadas |

### 15.2 Balance
| Riesgo | Mitigación |
|---|---|
| **Pelea demasiado larga** si el jugador es débil | Furia por fase, puertas con corazones, Practicar desde fase N, decisión 1 (HP reducible) |
| **Cadena imposible o aburrida** | Validador `chainReachable`, márgenes mínimos de la tabla 8.1, bot con planificación; si el humano falla en masa, subir tele de eslabones 1b, 3 y 4 (están en el suelo de la regla) |
| **Combinación F2-F6 desigual**: unas fases mucho más difíciles que otras | Win rate por fase del bot (muertes por fase) en F-C; reparto de HP por fase como palanca |
| **Builds dañadas por resistencias** | Debilidades que rotan por fase (sección 7); Fuego x0,8 solo en F1-F4 y x1,25 en F5-F6 |
| **Presupuesto de vida** (9.2) | Corazones por puerta/Reliquia como palanca; el bot no regenera igual que el jugador |
| **Complejidad de implementación** (7 fases x 5 sistemas ajenos) | Reutilizar manejadores de los otros jefes parametrizados; una fase por commit con tests; ver plan |
| **Win rate engañoso** (el bot gana más que el humano, README) | Meta del bot 30-40 %; el humano debe quedar por debajo; palancas `hpCal`, `geo`, márgenes de cadena |

---

## 16. Plan por sub-fases (P6.5)

| Sub-fase | Contenido | Agentes | Días (calendario) | Entregable |
|---|---|---|---|---|
| **F-A (en paralelo)** | **Diseño aprobado** (este doc + decisiones, 0,5 d); **arte** `assets_boss5.js` (torso, cabeza, brazos, Reliquias, glifos, FX, arena, trofeos: ~34 sprites / ~100 frames) en 5 d; **audio** `sfx_cenizar.js` (pista de 4 capas + 10 stingers + ~22 SFX) en 3 d; asset-scout referencias de silueta/paleta | game-designer, programmer (arte), audio-designer, asset-scout | 5 | API de arte/audio + dibujo de reserva por código |
| **F-B Lógica** | `src/boss_cenizar.js` y cambios de motor (sección 4): 7 fases y puertas, 6 firmas reinterpretadas, 5 Reliquias, **primitiva de cadena**, mutaciones de arena, Furia por fase, `pelHp`, modo `final` y Cacería/Practicar de 7 fases, HUD, `?boss=cenizar`; tests `p65_tests.js` (datos, telegrafías con la regla, Reliquias, cadena, alcanzabilidad, Peligro) | programmer, qa-tester | 8 (solapa 2-3 d con el arte) | jefe jugable con arte de reserva |
| **F-C Calibración** | Boss-bot nuevo (planificación de cadena, hexring bidireccional, islas móviles); 12 peleas x 3 manos x 5 Peligros; ajustar `hpCal`/`geo`/márgenes/corazones; perfiles de fps y móvil; regresión 0 de los otros 5 jefes | tools-engineer, qa-tester, game-designer | 4 | tabla de victorias, duración y fps; README actualizado |
| **Total P6.5** | | | **~17 d** (14-15 si arte y lógica se solapan) | v5.4b: Cenizar jugable por `?boss=cenizar` y oculto del Portal |

**Encaje con P7/P8:** P6.5 va **antes** de la P7 para que la integración lo trate como el 6.º jefe. P7 gana **+1 día** (6.º chip del Portal, Peligro variantes III-V, Cacería/Practicar de 7 fases, logros, diálogos, final y guardado v8). P8 gana **+2 días** (balance de Peligro I-V del 6.º jefe, fps y móvil). Total del plan v5: de 38 a ~58 días de un flujo (~41 con dos flujos). Publicable: v5.4b (jefe oculto), v5.5 (P7, jefe visible en el Portal), v5.6 (P8).

---

## 17. Decisiones abiertas para el dueño

1. **Duración:** ¿10-12 min en Peligro I (HP ~130 000, 7 fases largas) o una versión de 7-8 min (HP ~90 000, F7 igual de intensa)? Recomendación: 10-11 min; si se juega en móvil de forma habitual, reducir a ~8 min.
2. **Cómo se llega al jefe:** ¿"Asalto al Cráter" estilo cacería (6 ofertas, sin horda, recomendado y calibrable) o una expedición completa con 7:30 de horda antes del jefe (más épico, pero la pelea se vuelve de 18+ min y sin calibración fiable)?
3. **Checkpoints:** ¿ninguno en expedición (recomendado) o un "Brasero de Fase" a mitad (F4->F5)? En Practicar sí hay reintento desde la fase N en ambos casos.
4. **Reliquias y cadena:** ¿las Reliquias rotas acortan la cadena de F7 (recomendado, premia jugar F2-F6) o prefieres una cadena fija para que todos vean el combo completo?
5. **Final de la historia:** ¿cinemática y créditos al vencer por primera vez (más trabajo de arte y de diálogos) y luego Peligro I-V como "post-juego", o un cierre mínimo (banner de victoria, título y Insignia) en la P6.5 y la cinemática en la P8? Y, aparte: ¿aceptas el nombre Cenizar o prefieres Ignarr / Brasa Madre / Cinérea?
