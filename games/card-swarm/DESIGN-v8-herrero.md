# Swarm Hand - Diseño v8: la Armera (Herrero de armaduras), defensa y más horas

Estado: DISEÑO / PLAN, sin código. Aplica a la versión Fusión (`games/card-swarm`); el clásico ya no está en `main` (ver nota en `README.md`). Amplía `DESIGN-v3-aldea.md` (Grum, PF, Rango de forja), `DESIGN-v4-jefes.md` (jefes, trofeos, Peligro), `DESIGN-v5-biomas.md` (familias, Tundra, Panal) y `DESIGN-fusion.md`/`README.md` (balance medido con bots).
Pedido del dueño: (1) subir el juego de ~10 h a algo más; (2) un herrero nuevo que fabrique ARMADURAS con partes de monstruos; (3) el oso actual sigue como está salvo sugerencia; (4) reajustar el balance. Las cifras son punto de partida y se calibran con los bots (`tools/card-swarm-bot/`). Las horas son estimaciones de modelo sobre las ~10 h que da el dueño (no hay telemetría de tiempo de juego en el código: se propone una, ver 6.3).

---

## A) Estado actual (leído del código)

### A.1 El oso: Grum, "el armero" actual
| Dato | Hoy |
|---|---|
| Quién | **Grum**, oso herrero (delantal, pañuelo rojo, martillo). Datos en `assets_village.js` (`NPCS.grum`, `grum()`), posición (108,340), forja `vil_forge` en (130,308), yunque y barriles al lado. Lógica en `aldea.js` (`NPC_ORDER`), diálogos en `aldea.js`/`tree.js` (`dialog.js` solo es el motor de burbujas: no contiene líneas de Grum). |
| Qué hace | Abre `P.open('forge')` = **árbol de forja** (`tree.js`): Tronco + 6 árboles de etiqueta, **Puntos de Forja (PF, techo 24)**, nodos de carta / mejora A/B / pasivo / set / maestría, **Rango de forja I-III** (R2/R3 del Tronco: +8 % de daño por rango de carta), **anclas** (1 + "Segunda ancla"), reespecializar (400 Brasas el árbol, 60/PF, devuelve 50 % de partes), hitos "Maestría de oficio" (+1 PF cada 4 nodos). |
| Rama "Ruta" | 7 nodos del Tronco (RT1-RT7) sin PF que **piden haber obtenido** un trofeo de jefe (no se consume): Crampones, Abrigo de escarcha, Brasa en el pecho (Tundra), Ahumador, Guantes, Jalea de reserva +10 HP (Panal), Aliento del Cráter (+10 % daño a jefes, 6 trofeos de Cenizar). Se leen de `Save.data.trophies`. |
| Economía | Partes comunes por enemigo (`L.DROPS` x `DROP_MUL` 0,70 x duración), Esencia rara (trofeos de jefe cuentan como Esencia: `boss.js` suelta el trofeo como parte `rare` con `g.trophy`), Brasas (`BRASAS_MIN` 18/min con crecimiento 8 %/min), `COST_MUL`, `TREE_PART_MUL` (fuego 1, hielo 0,5, rayo 0,75, veneno 1, sangre 0,8, acero 0,6). Medido v5: 7 min = 99 partes y ~175 Brasas; 9 min = 123 partes y ~226 Brasas. |
| Otros NPC | Vesper (Tablón/cacería), Rufo (trueque), Ulalume (Archivo, 3 loadouts), Lanudo (lore), Castaña (platos). |

### A.2 Defensa que existe hoy (no hay "armadura")
| Fuente | Efecto | Dónde |
|---|---|---|
| HP base | 100 (`B.player.hp`), +30 por rango de la carta Corazón (`lv('heart')`), +10 Jalea de reserva (Ruta), +12 Caldo del Hogar Reencendido | `main.js`, `cards.js` `recalc` |
| Cura | +20 % de vida máx. al subir de nivel (`lvheal`), +25 HP al fusionar (`fuseheal`), corazones de 12 HP, Sed de hierro, Hemotoxina, Vampiro/Pacto | `fusion.js`, `combat.js` |
| Reducción | **Bastión** (Acero, rama X): -10 % de todo; **platos** de Castaña (1 por salida): -15/-20/-25/-30 % por familia de fuente (`P.family`: ranged / blast / big / melee) | `player.js` `hurt` |
| Escudo | Sed (set Sangre): `p.shield` | `player.js` |
| Revivir | Corazón de brasa (maestría de Fuego): 1 vez por expedición | `player.js` |
| Invulnerabilidad | 600 ms tras cada golpe (`B.player.invuln`), 250 ms en daño `soft` | `player.js` |
| Daño recibido | `P.hurt(p, dmg, sx, sy, o)`: `dmg` ya viene escalado por `dmgMult` (+6 %/min virtual), Peligro (+10 %/nivel, tope +40 %) y `bossDmg`; tras `hurt` se aplican Bastión, plato, escudo. `?god=1` ignora. Contador `G.dbg.dmg` por fuente (`?dbg=1`). |
| Lo que NO existe | Reducción plana, resistencia por etiqueta del enemigo, esquiva, rebote (solo `thorns` como carta), equipo. Es el hueco que llena la Armera. |

Conclusión: el techo actual de reducción es ~37 % (Bastión x plato de melee), pero cuesta un nodo de PF y un plato por salida; no hay progresión de defensa por bioma, y la dificultad entre biomas no sube por daño (sube por familias y jefes).

---

## B) Concepto: la Armera

### B.1 Personaje
| | |
|---|---|
| Nombre | **Carapa**, "la Armera" (título: *Armera de Rescoldo*). Aviso de nomenclatura: Grum sigue siendo "el herrero/armero" de **armas** (cartas y talentos); Carapa fabrica **armaduras**. En el Portal/diálogos se usa "forja" para Grum y "taller" para Carapa. |
| Animal / silueta | **Armadilla** pequeña y redonda, caparazón de bandas segmentadas, gafas de aumento en la frente, cinta métrica al cuello, dedal en la pata, alfiletero en el cinturón. Color-guía: **azul petróleo `#3a7a86` + crema `#e8dcb0`** (los otros NPC son marrón/naranja/gris/morado/crema/rosa: queda única). Altura ~70 px (menor que Grum: 74 base). |
| Personalidad | Meticulosa, habladora, mide todo ("todo se mide"), orgullo de la costura doble. Cariñosamente quisquillosa con Marlo ("has crecido tres dedos"). Compite amistosamente con Grum. |
| Ubicación | **Taller-toldo** nuevo abajo a la izquierda: pies de Carapa en (262,452), toldo `vil_workshop` ancla (262,440), **maniquí** `vil_mannequin` (212,455) que muestra el equipo actual de Marlo, perchero `vil_armorrack` (310,452). Zona libre hoy (el área x 40-400, y 400-490 no tiene props; Lanudo está en 438,410). A ~150 px de Grum: se oyen sus pullas. Colisión: rectángulos del toldo y maniquí `[dx,dy,w,h]` como los demás props. |
| Cómo se desbloquea | Llega con la caravana **al volver de la primera victoria sobre el Pastor** (`bossKills.pastor > 0`): escena de 4 burbujas, gratis el set Aldeano (T0) y la receta del Pastor visible. Cuentas existentes: aparece ya en la primera apertura de la aldea tras actualizar (ver H). Hasta entonces el toldo se ve cerrado con un cartel "Vuelvo pronto" (anticipa la mecánica, sin spoiler). |
| Marca "!" | Verde: hay una pieza fabricable o mejorable con lo que tienes (igual que Grum con las mejoras); dorado: pedido nuevo. Aviso al volver: "Carapa tiene N piezas listas." |

### B.2 Relación con Grum y reparto de papeles (sin pisarse)
| Tema | Grum (sin cambios) | Carapa (nueva) |
|---|---|---|
| Qué fabrica | Poder ofensivo: cartas, talentos, Rango de forja, anclas | Poder defensivo: 4 piezas de equipo, sets, refuerzos |
| Moneda propia | PF (techo 24) | **Sin PF**: Brasas + partes + trofeos + insignias (no toca el techo de PF) |
| Qué piden | Partes comunes, Esencias | Partes comunes del bioma + **trofeo de jefe** + **insignia de minijefe** |
| Ruta (RT1-RT7) | Se queda con Grum. Coexiste: Jalea +10 HP suma al tope de HP (ver C.6); los demás son situacionales | No las duplica |
| Vínculo | **Refuerzos**: el +2 pide Rango de forja II y el +3 Rango de forja III (Tronco de Grum): "Grum templa el metal" | Cada refuerzo dispara una línea de ambos |
| Diálogo cruzado | Grum: "Fina, la Carapa. Mucha costura, poco martillo." / "Eso aguantará." | Carapa: "Grum pega fuerte; yo me ocupo de que a ti te peguen menos." |

Sugerencia para el oso (mínima, opcional): (1) renombrar su título a "Herrero de armas" en el panel; (2) el nodo **Bastión** (-10 %) se mantiene pero entra en el CAP global de reducción (C.6); (3) añadir 3 líneas de diálogo que reconozcan a Carapa y el "temple". Nada más cambia en su árbol, PF, Ruta ni anclas. Alternativa descartada: mover la Ruta defensiva a Carapa (rompe cuentas con nodos ya comprados).

---

## C) Sistema de armaduras

### C.1 Slots y estadísticas (MVP = 4 slots)
| Slot | Peso DEF | Estadística propia | Escala por tier (base, antes de refuerzo) |
|---|---|---|---|
| **Yelmo** | x0,7 | **+HP máx** | T0 2 / T1 4 / T2 6 / T3 8 / T4 10 / T5 12 / T6 14 |
| **Peto** | x1,0 | **Resistencia de familia** (+% menos daño de la familia temática del set: melee, ranged, blast o big) | T1 3 % / T2 4 % / T3 5 % / T4 6,5 % / T5 8 % / T6 10 % |
| **Grebas** | x0,7 | **Aplomo**: -% de potencia y duración de ralentizaciones y de retroceso (hielo, miel, charcos, cadenas) y +ms de invulnerabilidad tras golpe | Aplomo T1 5 % / T2 8 / T3 12 / T4 16 / T5 22 / T6 28 %; i-frames +10 ms por tier desde T2 (+50 ms en T6) |
| **Talismán** | x0,6 | **Afinidad**: +% de daño de la etiqueta del set (única fuente ofensiva de la armadura) | T1 2 % / T2 3 / T3 4 / T4 5 / T5 6,5 / T6 8 % |

- **DEF** de una pieza = `DEFbase(tier) x pesoSlot x (1 + 0,15 x refuerzo)`. `DEFbase`: T0 2, T1 4, T2 6, T3 8, T4 10, T5 12, T6 14.
- **Refuerzo +1/+2/+3** multiplica DEF y la estadística propia por `1 + 0,15 x n` (máx. x1,45). El Sello (Peligro V) es cosmético.
- Se puede **mezclar** piezas de distintos sets (el bono de set pide 2 / 4 del mismo).
- Armadura NO da esquiva ni "rebote" salvo el bono 4 de Karceron: el juego es de movimiento y cartas automáticas; una esquiva aleatoria quita lectura. Las invulnerabilidades extra (Aplomo) son pequeñas y acotadas.

### C.2 Fórmula de defensa
```
DEF_total = suma de DEF de las 4 piezas equipadas
RD_armadura = DEF_total / (DEF_total + K)          K = 120 (perilla ?armk)
RD_familia  = 1 - (1-RD_armadura) * (1-resPeto_familia) * (1-set2_familia)
Multiplicador de daño recibido = max(1 - CAP, (1-RD_familia) * (1-Bastión) * (1-plato_familia) * (1-escudo...))   CAP = 0,45
```
| DEF_total | 6 (Aldeano) | 12 | 24 | 36 | 48 | 60,9 (T6 +3, máximo) |
|---|---|---|---|---|---|---|
| Reducción de armadura | 4,8 % | 9,1 % | 16,7 % | 23,1 % | 28,6 % | 33,7 % |

Curva suave (rendimientos decrecientes) en vez de reducción plana: los golpes pequeños del juego son de 5-8 de daño y una plana (p. ej. -3) los volvería inofensivos y rompería gusanos/polillas. Todo daño recibido es >= 1.

### C.3 Sets (uno por jefe, alineados a las 6 etiquetas) y bonos
Etiqueta del set = tema del jefe (no su debilidad): Pastor-Acero, Karceron-Fuego, Letea-Veneno, Yarlak-Hielo, Melaria-Sangre, Cenizar-Rayo. Parte principal por etiqueta (`L.MAIN`): Acero=Placa, Fuego=Mecha, Veneno=Púa, Hielo=Escarcha, Sangre=Colmillo, Rayo=Jirón. Secundaria: `L.SEC` (Hebra/Pluma). Así cada set tira de una parte distinta (la economía no se concentra en Hebra).

| Set (tier, bioma) | Etiqueta | Familia del Peto | Bono 2 piezas | Bono 4 piezas |
|---|---|---|---|---|
| **Aldeano** (T0, sin jefe) | neutral | melee | +4 HP | Ninguno (aprendizaje) |
| **Esquila de Hierro** (T1, Bosque / Pastor) | Acero | melee | +4 % daño Acero; +3 % Res. melee | **Lana gruesa**: cada 25 s el siguiente golpe recibido hace -50 % |
| **Carcelero de Brasa** (T2, Cripta / Karceron) | Fuego | blast | +4 % daño Fuego; Res. blast +8 % | **Grilletes ardientes**: al recibir un golpe, pulso de r 70 (20 de daño, quema), 1 vez cada 6 s |
| **Escama del Olvido** (T3, Asfodelo / Letea) | Veneno | ranged | +4 % daño Veneno; Res. ranged +8 % | **Piel de pantano**: los charcos y el cdSlow del Lirio reducen su efecto a la mitad; la 1.ª muerte con Veneno de cada oleada cura 2 HP |
| **Pelaje Glacial** (T4, Tundra / Yarlak) | Hielo | melee | +4 % daño Hielo; Frío -15 % de ganancia | **Corazón de hoguera**: retroceso -50 % en hielo y las hogueras te curan 1 HP/s mientras estés en su radio |
| **Jalea Real** (T5, Panal / Melaria) | Sangre | big | +4 % daño Sangre; la miel ralentiza -25 % | **Reina de la colmena**: curas de nivel +5 puntos (20 % -> 25 %) y cada 20 muertes se crea un escudo de 6 HP |
| **Brasa Primera** (T6, Cráter / Cenizar) | Rayo | big | +4 % daño Rayo; +3 % Res. big | **Última brasa**: 1 vez por expedición, un golpe mortal te deja a 1 HP + 1,5 s invulnerable (no se acumula con Corazón de brasa: se gasta el que active antes) |

Bonos de daño de la armadura (Afinidad + bono 2): tope total **+10 %** de daño de una etiqueta. Ningún bono de set cambia la defensa más allá del CAP.

### C.4 Tabla de piezas (33)
Trofeos = los 3 del jefe (uno por pieza de Yelmo/Peto/Grebas); Talismán = las 2 **insignias** de los minijefes del bioma (cada bioma tiene 2: carnero/tejedora, alcaide/centinela, hidra/planidera, yeti mayor/ventisquero, avispón/reina joven). "Pu" = parte principal del set, "Sec" = secundaria. Las cantidades son las del **Peto-unidad** (tabla C.5) multiplicadas por el peso del slot.

| # | Set | Slot | Pieza | Material clave | Trofeo / insignia |
|---|---|---|---|---|---|
| 1 | Aldeano | Yelmo | Gorro de lana | Hebra | - |
| 2 | Aldeano | Peto | Chaleco acolchado | Hebra, Pluma | - |
| 3 | Aldeano | Grebas | Botas de trapo | Hebra | - |
| 4 | Aldeano | Talismán | Amuleto del hogar | Hebra, Brasas | - |
| 5 | Esquila de Hierro | Yelmo | Yelmo de cuernos | Placa | Cuerno del Pastor |
| 6 | Esquila de Hierro | Peto | Peto de vellón | Placa, Hebra | Vellón Calcinado |
| 7 | Esquila de Hierro | Grebas | Polainas de cayado | Placa, Pluma | Cayado Astillado |
| 8 | Esquila de Hierro | Talismán | Talismán de pastoreo | Placa, Colmillo | Insignias: Cuerno + Raíz |
| 9 | Carcelero de Brasa | Yelmo | Cráneo del alcaide | Mecha | Núcleo Latente |
| 10 | Carcelero de Brasa | Peto | Coraza de magma | Mecha, Placa | Nudillo de Magma |
| 11 | Carcelero de Brasa | Grebas | Grilletes ardientes | Mecha, Hebra | Grillete Ardiente |
| 12 | Carcelero de Brasa | Talismán | Llave de la cripta | Mecha, Jirón | Insignias: Llave del Alcaide + Brasa Latente |
| 13 | Escama del Olvido | Yelmo | Cresta de perla | Púa | Perla Helada |
| 14 | Escama del Olvido | Peto | Escamas de hidra | Púa, Escarcha | Colmillo Ácido |
| 15 | Escama del Olvido | Grebas | Sandalias de marea | Púa, Pluma | Ojo Tormentoso |
| 16 | Escama del Olvido | Talismán | Colgante del olvido | Púa, Jirón | Insignias: Escama Joven + Velo Anegado |
| 17 | Pelaje Glacial | Yelmo | Casco de colmillos | Escarcha | Colmillos de Yarlak |
| 18 | Pelaje Glacial | Peto | Placa glacial | Escarcha, Placa | Armadura de hielo |
| 19 | Pelaje Glacial | Grebas | Pezuñas de escarcha | Escarcha, Hebra | Corazón helado |
| 20 | Pelaje Glacial | Talismán | Garra del yeti | Escarcha, Colmillo | Insignias: Garra del Yeti Mayor + Esquirla de Corazón |
| 21 | Jalea Real | Yelmo | Corona de jalea | Colmillo | Corona de jalea real |
| 22 | Jalea Real | Peto | Manto de alas | Colmillo, Pluma | Alas |
| 23 | Jalea Real | Grebas | Espolones de aguijón | Colmillo, Hebra | Aguijón |
| 24 | Jalea Real | Talismán | Frasco de miel | Colmillo, Escarcha | Insignias: Aguijón Real + Corona de Cera |
| 25 | Brasa Primera | Yelmo | Corona de ceniza | Jirón | Corona de cera + Ojo del Olvido (Cenizar) |
| 26 | Brasa Primera | Peto | Corazón de Brasa Primera | Jirón, Mecha | Corazón de Ceniza + Núcleo (Cenizar) |
| 27 | Brasa Primera | Grebas | Pasos de ceniza | Jirón, Pluma | Colmillo glacial + Cayado (Cenizar) |
| 28 | Brasa Primera | Talismán | Rescoldo | Jirón, Esencia | 1 insignia de cada bioma (5) |
| 29-33 | **Piezas de minijefe** (alternativas de Talismán, 1 por bioma) | Talismán | Ver C.4b | - | Las 2 insignias del bioma + Esencia |

C.4b: las 5 piezas 29-33 son talismanes alternativos de bonos de **utilidad** (sin DEF extra: DEF x0,4): Bosque "Colmillo de arrastre" (+10 % radio de imán), Cripta "Llave maestra" (+1 HP por corazón recogido), Asfodelo "Perla del río" (+10 % XP de gemas de enemigos Pantano), Tundra "Brasa de bolsillo" (Frío -10 %), Panal "Gota de ámbar" (miel -15 %). Dan variedad sin inflar defensa. Si el alcance aprieta, 29-33 se difieren (el sistema tiene 28 piezas sin ellas).

### C.5 Recetas y costes (Peto-unidad; los demás slots x0,7 / x0,7 / x0,6 con redondeo hacia arriba)
No hay PF. Las cantidades de parte principal se multiplican por `L.TREE_PART_MUL` de la etiqueta del set (acero 0,6, hielo 0,5, rayo 0,75, sangre 0,8, fuego/veneno 1: ya calibrado para que cada parte tarde lo mismo).

| Tier | Parte principal | Secundaria | Brasas | Trofeo | Esencia rara | Req. de desbloqueo |
|---|---|---|---|---|---|---|
| T0 | 14 Hebra | 4 Pluma | 80 | - | - | Carapa en la aldea |
| T1 | 12 | 5 | 140 | 1 | - | Pastor vencido |
| T2 | 16 | 7 | 220 | 1 | - | Karceron vencido |
| T3 | 22 | 9 | 320 | 1 | - | Letea vencida |
| T4 | 30 | 12 | 440 | 1 | 1 | Yarlak vencido |
| T5 | 40 | 16 | 600 | 1 | 1 | Melaria vencida |
| T6 | 52 | 20 | 800 | 2 (dos de los 6 de Cenizar por pieza) | 2 | Cenizar vencido |

- **Refuerzos** (por pieza): +1 = 20 % de las Brasas base, partes x0,5, 1 trofeo; +2 = 30 % de Brasas, partes x0,6, 1 trofeo, **requiere Rango de forja II** y **haber vencido a ese jefe en Peligro II**; +3 = 40 % de Brasas, partes x0,8, 2 trofeos, 1 Esencia, **Rango de forja III** y **Peligro III vencido**. (Talismanes: las insignias hacen de trofeo.)
- **Coste total por set** (4 piezas, sin refuerzo): T1 ~420 Brasas, T2 ~660, T3 ~960, T4 ~1320, T5 ~1800, T6 ~2400. Con refuerzos hasta +3 (x1,9): ~10 000 Brasas los 6 sets al completo; un jugador "principal" (el mejor set por tier, +1/+2) gasta ~4-5 mil.
- **Reciclaje**: desmontar una pieza devuelve el 50 % de las partes, el 50 % de las Brasas y el trofeo/insignia **no**. Cambiar de set no es gratis pero no pierde todo (la reespecialización de Grum ya sigue la misma lógica).
- **Ajuste de ingresos** que se propone medir: `BRASAS_MIN` 18 -> 21 (+15 %) para que Grum y Carapa no se compitan por el mismo recurso (ver G).
- **Trofeos como material**: se gastan de un contador nuevo; las lecturas de Ruta y logros pasan a `trophiesEver` (ver H). Un trofeo sigue contando como Esencia para Grum al soltarse (es intencional: una pieza de caza paga doble).

### C.6 CAP de defensa (que siga siendo un reto)
| Magnitud | CAP | Razón |
|---|---|---|
| Multiplicador de daño recibido (todas las fuentes: armadura + Bastión + platos + set) | **min 0,55 (45 % de reducción)** | Hoy máximo teórico ~37 %; con armadura sin tope pasaría del 58 %. |
| Reducción de armadura sola | 33,7 % (sale de la curva, K=120) | Rendimientos decrecientes. |
| HP de armadura (solo Yelmo) | +25 | HP total máximo razonable ~135 + corazones. |
| Aplomo (ralentizaciones/retroceso) | 40 % | Nunca inmune a hielo/miel: los jefes de bioma siguen enseñando. |
| Invulnerabilidad extra | +100 ms (700 ms total) | Menos riesgo de "inmortalidad" en zonas de daño continuo. |
| Daño de armadura (Afinidad + bono 2) | +10 % de una etiqueta | La ofensiva sigue siendo de las cartas. |
| Resistencia por familia (Peto + bono 2 + plato) | -15 % del Peto y del bono 2 juntos | Evitar sets que anulen una familia. |
| Mínimo por golpe | >= 1 | - |
| Jefes: telegrafía | Sin cambios | La regla de esquiva de v4 sigue; la armadura no relaja la lectura. |

### C.7 Progresión por bioma (cuántas piezas y cuándo)
| Fase de campaña | Tier recomendado | Defensa recomendada (DEF_total) |
|---|---|---|
| Bosque (Pastor) | T0-T1 | 6-14 |
| Cripta | T2 | 18-24 |
| Asfodelo | T3 | 24-32 |
| Tundra | T4 | 32-40 |
| Panal | T5 | 38-48 |
| Cráter | T6 | 45-60 |
El Portal muestra, por destino, "Armadura recomendada: DEF X (tu DEF: Y)" y un color (verde/ámbar/rojo).

---

## D) UI

### D.1 Panel de la Armera (canvas 960x540; en móvil 844x390 la escala es ~0,72)
```
+------------------------------------------------------------------------------------+
| TALLER DE CARAPA          Brasas 1.240   DEF 41 -> RD 25,5 % (CAP 45 %)     [X]    |
| [EQUIPO] [FABRICAR] [SETS] [PEDIDOS]                          Sets: 2/4 Esquila     |
|------------------+-----------------------------------+-----------------------------|
| MANIQUI (Marlo)  |  Lista del slot elegido           |  DETALLE / COMPARAR         |
| [Yelmo ][Talism.]|  (filas 64 px: icono, nombre,     |  Nombre, set, tier, +n      |
| [ Peto ]         |   DEF, estado)                    |  DEF 12,0 (equipada 9,6)  + |
| [Grebas]         |  Equipada | Fabricada | Falta     |  HP +8 | Aplomo 12 % | ...  |
| Chip: bonos de   |                                   |  Coste: partes + Brasas +   |
| set activos      |                                   |  trofeo (icono + n/n)       |
|                  |                                   |  [EQUIPAR] / [FABRICAR]     |
+------------------+-----------------------------------+-----------------------------+
| "Recibes x0,83 del daño en Tundra con este equipo"          [AUTO-EQUIPAR]          |
+------------------------------------------------------------------------------------+
```
| Elemento | Detalle |
|---|---|
| Pestañas | EQUIPO (equipar/refuerzos), FABRICAR (nuevas piezas con la receta), SETS (colección y bonos 2/4), PEDIDOS (misiones de Carapa). Q/E o deslizar cambian de pestaña (igual que `tree.js`); 1-4 los slots. |
| Maniquí | 4 casillas de 72x72 (52 px reales en 844x390, >= 44 px táctil). Cada una muestra el icono, el +n y un punto de color de set. Tocar = elige slot y abre la lista. |
| Comparación | Al seleccionar una pieza: flechas verdes/rojas con deltas de DEF_total, RD, HP, Aplomo, bonos de set ganados/perdidos, y la frase "recibes x0,83 del daño en <bioma del Portal> (Peligro N)". |
| Equipar | Botón grande 56 px de alto, tecla E/Enter; doble toque en la fila = equipar. "AUTO-EQUIPAR" elige mayor DEF por slot (nunca rompe un set activo sin avisar). |
| Estado de piezas | Fabricada / Falta (gris con lista de requisitos: "Vence a Letea", "Falta 1 trofeo: Perla Helada"). Piezas bloqueadas por jefe muestran silueta + candado, sin spoiler del nombre del material hasta que se desbloquea el set. |
| Accesos | Hablar con Carapa; chip "EQUIPO" en el Portal (abre el mismo panel sin caminar, como el chip de loadout); botón "EQUIPO" en la pausa (solo lectura). |
| HUD en run | Sin cambios. En pausa: DEF, RD, HP total y bonos de set. En el botín: "Daño evitado por armadura: N" (nuevo `L.run.blocked`; refuerza la sensación de valor). |
| Rendimiento | Iconos de pieza = 1 silueta por slot x 7 paletas + emblema (ver I), cache por canvas como el resto de `assets_ui.js`. |

### D.2 Cambios en otros paneles
Portal (`panels.js`): línea "DEF recomendada / tu DEF" y color por chip de destino; Archivo/Ulalume: cada loadout guarda `armor` (4 ids); Vesper (cacería): muestra "Trofeos que te faltan" y bandera "pedido de Carapa".

---

## E) Integración con el resto del juego

| Sistema | Integración |
|---|---|
| **Loadouts** (Ulalume, 3 slots) | Cada loadout añade `armor: [yelmo, peto, grebas, talisman]`. "Aplicar" equipa si las piezas existen; si falta alguna, avisa. Migración: `armor: null`. |
| **Platos** (Castaña) | Se mantienen y se apilan, pero entran en el CAP (0,55 de multiplicador mínimo). Los platos de resistencia siguen siendo mejores contra una familia concreta; la armadura es amplia pero menor: así no se anulan. |
| **Peligro I-V** | La armadura **no escala con Peligro** (decisión; ver L). El Peligro sube HP/daño del jefe; la armadura +2/+3 exigen Peligro II/III. El Portal avisa por Peligro: I (+0/+1), II (+1), III (+2), IV (+2/+3), V (+3 y set completo). |
| **Trofeos** | Se gastan al fabricar y reforzar (contador nuevo); `trophiesEver` mantiene Ruta, logros y el Archivo. Se muestran en la pared del taller (decoración que crece con los trofeos totales). Peligro IV+ ya da 2 trofeos por parte (v4 4.3): cubre el +3. Pity: tras 3 cacerías seguidas sin el trofeo deseado, la siguiente lo garantiza (parte rota concreta). |
| **Insignias de minijefes** | Solo Talismanes. Los 10 minijefes (2 por bioma) pasan a tener un objetivo concreto. |
| **Misiones nuevas** (Pedidos de Carapa; 8 al inicio, rotación mínima) | "Tomar medidas": fabrica 1 pieza. "Costura doble": 4 piezas de un set. "Sin rasguños": gana una expedición sin recibir daño con armadura de tier >= 2 (reusa `L.cleanSecs`). "Probar el yelmo": rompe una parte de jefe con el set de ese jefe. "Cazador de insignias": 2 insignias en una salida. "Encargo de la Reina": vence a Melaria con Jalea Real a 4 piezas. "Mosaico": equipa 4 sets distintos. "A pelo": vence a un jefe sin armadura equipada (Peligro II, título "Cordero sin lana"). Recompensas: Brasas, partes del bioma, 1 Esencia en los difíciles. Entran en `quests.js` como encargos de condición. |
| **Logros** (`G.Ach`, Lanudo) | Armero aficionado, Cuatro latidos (set 4/4), Mosaico, Refuerzo triple, Sello de Peligro V (cosmético), Cordero sin lana, Colgante completo (10 insignias). |
| **Cacería y Práctica** | Cacería: usa la armadura equipada; el panel de Vesper lista los trofeos y la pieza para la que sirven; la preparación (6 ofertas) no cambia. Práctica: armadura puesta, sin recompensa; un modo "probar equipo" fuerza ver el multiplicador real sin gastar. HP de jefe en cacería x0,75 (v4) no cambia. |
| **Rufo** | Trueque 3:1 y compra de partes ayudan con la parte limitante (sin cambios); no vende trofeos ni insignias. |
| **Anclas / cartas / fusión** | Sin cambios. Resonancia (3-4 cartas de una etiqueta) y Afinidad suman, dentro del tope de +10 % de la armadura. |
| **Tundra / Panal** | Aplomo y los bonos del set reducen derrape, retroceso, Frío y miel. Ruta (Crampones, Abrigo, Guantes) sigue siendo útil: se prueba en el bot que Pelaje Glacial + Ruta no baje el Frío por debajo de un mínimo (tope de Aplomo 40 %). |

---

## F) Extensión de horas: de ~10 h a ~15-18 h sin relleno

Principio: ninguna hora nueva es "grind" puro. Cada pieza pide algo distinto (parte del bioma, trofeo de una pelea concreta, insignia de un minijefe, un Peligro superado) y todas empujan a **revisitar contenido ya construido** con un motivo (rompe esta parte, vence a ese minijefe, juega en esa etiqueta).

| Sistema | Qué obliga a hacer | Horas añadidas jugador "principal" | Completista |
|---|---|---|---|
| Fabricar el set de cada bioma | 3-6 salidas por set para la parte principal + Brasas; trueque ayuda | 1,5 | 2,5 |
| Cacerías de trofeos | 3 por set para fabricar + 4 más por pieza para refuerzos; cada cacería ~4 min (con intentos fallidos x1,6) | 1,0 | 2,5 |
| Refuerzos +2/+3 gated por Peligro II/III | 12 victorias extra de jefe (6 jefes x 2 Peligros) con el set puesto | 1,0 | 2,0 |
| Insignias de minijefes (talismanes) | Matar a cada minijefe (aparecen 3:30 y 5:30 de run); algunos por lote | 0,5 | 1,0 |
| Pedidos y logros de Carapa | 8 pedidos + 7 logros | 0,5 | 1,0 |
| Peligro IV-V con equipo (hoy solo para quien ya tiene mano muy fuerte) | La defensa los hace accesibles: más gente los intenta | 0,5 | 1,5 |
| Rejugar con otro set / etiqueta (presets, bonos 4) | Cambiar de set por jefe o por Peligro | 1,0 | 0 (ya contado) |
| **Total** | | **+6,0 h (~16 h)** | **+10,5 h (~20,5 h)** |

- Objetivo de diseño: jugador medio ~16 h (rango 15-18). El completista a ~20 h es endgame voluntario (todo +3 y Peligro V), por encima del rango pedido a propósito.
- El incremento depende de los costes (C.5) y de la tasa de trofeos; se calibra con bots y con la telemetría de 6.3, no se garantiza por fórmula.
- Lo que NO se hace para alargar: bloqueos por tiempo real, aleatoriedad pura en piezas, multiplicar HP de jefes, ni encadenar misiones "mata 500". Los trofeos tienen pity y las insignias se consiguen en runs normales.

---

## G) Balance

### G.1 Qué cambia y por qué
| Palanca | Cambio | Motivo |
|---|---|---|
| Daño de enemigos y jefes por bioma (`zoneDmg`, **nuevo**) | Bosque 1,00 / Cripta 1,10 / Asfodelo 1,18 / Tundra 1,26 / Panal 1,34 / Cráter 1,44 (multiplicador sobre el daño actual; el Peligro se aplica encima) | Hace que la armadura sea necesaria y comparable: un equipo de tier con +1 devuelve el daño neto a ~1,0 de hoy; sin armadura el bioma duele +10 a +44 %. Bosque no cambia (cuentas nuevas intactas). |
| HP base | 100, sin cambio | El HP lo da el Yelmo (máx +25) y la Jalea, no la base. |
| Curas | Sin cambio en cifras; `lvheal` 20 % y 25 HP/fusión siguen; los corazones de 12 HP pierden peso relativo con más HP: no se compensa | Evitar sobre-curar. Revisar con el bot. |
| Bastión (Acero) | -10 % se mantiene, entra en el CAP | Sin nerf, solo tope global. |
| Jefes | HP y ataques sin cambio; su daño sí lleva `zoneDmg` (los jefes usan `dmgMul()`); telegrafías intactas | Mantener la regla de esquiva de v4. |
| Hordas/director | Sin cambios (tier, `maxAlive`, packs) | La dificultad extra es de daño, no de cantidad (rendimiento móvil). |
| Peligro | Sin cambios de números; el Portal muestra defensa recomendada | Armadura y Peligro no se multiplican entre sí de forma explícita. |
| Brasas | `BRASAS_MIN` 18 -> 21 (+15 %), a validar con bot | Un segundo sumidero grande. |
| Daño evitado | Nueva métrica (`L.run.blocked`) | Calibración y feedback al jugador. |

### G.2 Comprobación aritmética (equipo del tier, refuerzo +1, K=120)
| Bioma | DEF_total | RD | `zoneDmg` | Daño neto vs hoy | EHP vs hoy (HP incl.) |
|---|---|---|---|---|---|
| Bosque (T1) | 13,8 | 10,3 % | 1,00 | x0,90 | ~+15 % |
| Cripta (T2) | 20,7 | 14,7 % | 1,10 | x0,94 | ~+10 % |
| Asfodelo (T3) | 27,6 | 18,7 % | 1,18 | x0,96 | ~+8 % |
| Tundra (T4) | 34,5 | 22,3 % | 1,26 | x0,98 | ~+6 % |
| Panal (T5) | 41,4 | 25,6 % | 1,34 | x1,00 | ~+4 % |
| Cráter (T6) | 48,3 | 28,7 % | 1,44 | x1,03 | ~+5 % |
Con +3: daño neto ~x0,88-0,95 (más cómodo, el premio por Peligro II/III). Sin armadura de tier: x1,10 a x1,44. Sobre-equipado (un tier más): ~-6 pts.

### G.3 Objetivos medibles (bots: `play_bot.js`, `boss_bot.js`, `boss_fight.js`, `PAR=4`, speed 4, n >= 12-16 por celda; **no lanzar dos lotes a la vez**)
Referencia v2: bosque 396 +- 55 s de supervivencia; victorias con mano p50: Pastor 8/12, Karceron 7/8, Letea 6/8, Yarlak 5/8, Melaria 8/8, Cenizar 0/8 (el bot es burdo: se comparan **deltas**).

| Métrica | Objetivo |
|---|---|
| Supervivencia bosque, sin armadura | 396 +- 15 s (no cambia, `zoneDmg` 1,00) |
| Supervivencia por bioma, con set del tier +1 vs sin armadura | Ratio >= 1,25 (la armadura importa) y <= 1,8 con +3 (no es trivial) |
| Win-rate de jefe, set del tier +1 | Dentro de +-8 pts de la referencia v2 |
| Win-rate de jefe, sin armadura del tier | Cae >= 20 pts (p. ej. Yarlak 62 % -> <= 42 %) |
| Win-rate con +3 | <= referencia + 20 pts (nunca > 90 %) |
| Cenizar | 0/8 (bot) -> 15-30 % con T6 +1 humano-equivalente (se valida a mano) |
| TTK de jefe | Cambia <= -8 % por Afinidad + bono 2 (tope +10 % daño) |
| Daño recibido por minuto (`G.dbg.dmg`) del equipo del tier | +-8 % del baseline del bioma sin `zoneDmg` ni armadura |
| Daño evitado por armadura (`L.run.blocked`) | 10-25 % del daño bruto con equipo del tier |
| Primera pieza T1 | <= 2 expediciones tras vencer al Pastor |
| Set T1 completo | 3-5 expediciones; set T6 completo 9-12 |
| Mortalidad en el primer minuto | No sube (0 muertes < 150 s como en v2) |

### G.4 Perillas por URL (sin recompilar)
`?arm=0` (apaga armadura y `zoneDmg`: comportamiento v7 exacto) · `?armk=120` (K) · `?armcap=0.45` · `?zdmg=1,1.1,1.18,1.26,1.34,1.44` (por bioma) · `?armset=esquila:1` o `?armset=glacial:3` (equipa el set completo en ese refuerzo, para los bots) · `?armtier=` · `?armcost=1` (multiplicador de costes) · `?armhp=1` · `?smith=1` (Carapa desbloqueada) · `?give=` ampliado a trofeos e insignias (`?give=ytusk:3,tr_core:2`) · `?brasasmin=21` · `?dbg=1` (muestra RD aplicada y daño evitado por fuente).

---

## H) Guardado (versión siguiente = 10)
Clave `swarmhand.fusion.save` (sin cambios). `VERSION` 9 -> **10** con copia en `swarmhand.fusion.save.v9` (patrón existente en `S.load`) y migración sin pérdida.

| Campo | Contenido |
|---|---|
| `armor` | `{ owned: { pieceId: refuerzo 0-3 }, equipped: [yelmo, peto, grebas, talisman] (ids|null), seen: {setId:1}, stats: { blocked, crafts } }` |
| `trophiesEver` | Copia de `trophies` (acumulativo, nunca se gasta). Ruta, logros y Archivo leen de aquí. `trophies` pasa a ser el saldo gastable. |
| `insigniasEver` | Igual para insignias. |
| `loadouts[i].armor` | `null` o 4 ids. |
| `flags.smithMet`, `flags.smithGift` | Escena vista y regalo entregado. |
| `stats.playMs` | Contador de tiempo de juego (para medir las horas reales). |
| `pelWins`, `bossKills`, `peligro`, `hunts` | Ya existen: dan los requisitos de refuerzos y desbloqueo. |

Migración v9 -> v10: (1) `trophiesEver = copy(trophies)`, `insigniasEver = copy(insignias)`; (2) `armor` vacío; (3) **regalo de bienvenida** para no dejar a nadie contra un muro: set Aldeano completo (4 piezas) y, por cada jefe ya vencido, el **Peto** de su set a refuerzo 0 (equipado el mejor por defecto). Quien ya venció a los 5 jefes parte con ~5 petos + Aldeano; la cuenta conserva todo (partes, Brasas, PF, rangos, trofeos, logros). (4) `adopt()` rellena `armor`/`loadouts[].armor` con valores por defecto y `S.importText` acepta la v10 y rechaza versiones mayores como hoy. (5) Auditoría previa de lecturas de `S.trophies`/`S.insignias` (`tree.js` Ruta, `quests.js`, logros, `panels.js`) para pasarlas a `*Ever`.

---

## I) Contratos de arte y audio

### I.1 Arte (tools-engineer; por código en el estilo vectorial de `assets_village.js` / `assets_ui.js`, contorno `#1b1124`, rasterizado x2)
| Nombre | Base (final) | Frames | Uso |
|---|---|---|---|
| `npc_carapa` (en `NPCS.carapa`: nombre "Carapa", título "Armera", color `#3a7a86`, `top`/`sw` coherentes con los demás) | ~28x36 (56x72) | idle 2, trabajo (aguja) 3, hablar 2, sorpresa 1 | NPC |
| `vil_workshop` | 96x72 (192x144) | 1 (+2 de farolillo) | toldo y mesa de costura |
| `vil_mannequin` | 28x48 (56x96) | 1 base + capas por set | muestra el equipo real de Marlo (usa `armorIcon` apilados) |
| `vil_armorrack` | 40x56 | 1 | decoración |
| `vil_trophy_wall` | 64x40 | 1 + 21 mini-trofeos | pared que crece con `trophiesEver` |
| `Assets.armorIcon(setId, slot, refuerzo)` | 32x32 (64x64) | 4 siluetas x 7 paletas + emblema + chapita +1/+2/+3 + sello Peligro V | 33 iconos sin dibujar 33 sprites |
| `icon_set_<id>` (7) y `icon_def`, `icon_hp_armor`, `icon_aplomo`, `icon_afinidad` | 24x24 | 1 | stats y sets |
| `fx_armor_block` | 32x32 | 3 | destello en Marlo cuando la reducción >= 20 % |
| Marlo vestido (fase 2) | overlay sobre `player` (idle/walk/hurt/die) | 14 frames x set | opcional |
Paletas: Aldeano `#b8a878`, Esquila `#9aa4b0`, Carcelero `#ff6a1a`, Escama `#2f6f6a`, Glacial `#9fd8ff`, Jalea `#ffd23a`, Brasa Primera `#ff9a3c` con detalles `#ffe45a`.

### I.2 Audio (audio-designer; archivo `sfx_armor.js`, registrar como los demás `sfx_*.js`)
| Id | Descripción |
|---|---|
| `armor_anvil` | Yunque pequeño y agudo (distinto del de Grum: más ligero, dos golpes) al fabricar |
| `armor_stitch` | Costura rápida (tela/cuero) al fabricar piezas de Aldeano o de tela |
| `armor_equip_light` / `armor_equip_heavy` | Hebillas y tela / placas metálicas al equipar según tier |
| `armor_upgrade` | Golpe + campanilla ascendente al refuerzo; versión +3 con eco |
| `armor_set2` / `armor_set4` | Stingers cortos al activar bono 2 / 4 |
| `armor_hit` | Golpe amortiguado y metálico que se mezcla con `hurt` cuando la reducción >= 20 % |
| `armor_trophy` | Al consumir un trofeo (madera/hueso) |
| `smith_voice` | Murmullo corto de Carapa (tick-tick de caparazón), 3 variantes, a la vez que la máquina de escribir de `dialog.js` |
| `workshop_amb` (opcional) | Bucle ligero de taller en la aldea, volumen bajo |
Deben cumplir el volumen master/sfx de Ajustes y no taparse con `fuse`/`card_select`.

### I.3 Datos y texto (game-designer)
`armor_data.js` (datos puros): 33 piezas, `DEFbase`, recetas, bonos, familias; diálogos de Carapa (máx. 2 líneas x 38 caracteres); 8 pedidos y 7 logros. Ejemplos de diálogo: Saludo "Coge aire. Voy a medirte otra vez; has crecido." · Primera vez "Soy Carapa. Cosí mi primer yelmo a los siete años." · Tras fabricar "Costura doble. Aguantará lo que tú no." · Sin partes "Sin partes no hay coraza. Yo coso, no hago milagros." · Tundra con lana "¿La Tundra con un chaleco? El frío no perdona." · Grum: "Fina, la Carapa. Mucha costura, poco martillo."

---

## J) Riesgos
| Riesgo | Mitigación |
|---|---|
| Inflación de defensa (armadura + Bastión + platos + Jalea + corazones) | CAP global 45 %, tope de HP de armadura +25, rendimientos decrecientes, medir EHP con bots |
| Muro de dificultad para cuentas con jefes ya vencidos (`zoneDmg`) | Regalo de bienvenida (Peto por jefe vencido); `?arm=0` para comparar; `zoneDmg` se puede aplanar sin recompilar |
| Brasas insuficientes (Grum + Carapa) | +15 % `BRASAS_MIN`, costes con `?armcost`; revisar tras bot |
| RNG de trofeos (rotura de partes) | Pity de trofeo, Peligro IV+ da x2, insignias salen de runs normales |
| Romper Ruta/logros al gastar trofeos | `trophiesEver`/`insigniasEver` + auditoría de lecturas antes de tocar |
| Complejidad de UI en móvil | 3 columnas con 4 slots, tiles >= 52 px reales, botón de 56 px, comparación en frase, auto-equipar |
| Doble pago de trofeo (Esencia + material) | Intencional y acotado: la Esencia de Grum sale de trofeos; armadura pide pocas Esencias |
| El bot no mide bien la defensa (esquiva todo) | Medir daño recibido por minuto y `blocked`, no solo supervivencia; sesión humana en móvil |
| Arte: 33 piezas | Siluetas por slot x paleta de set; piezas 29-33 diferibles |
| Rendimiento (HUD/maniquí) | Cache por canvas, sin `shadowBlur` |
| Sensación de "obligatorio" | Reto "A pelo" (título), `zoneDmg` solo sube con el bioma, Peligro no cambia con armadura |

---

## K) PLAN POR FASES

Dependencias: F0 -> (F1a | F1b | F1c | F1d en paralelo) -> F2 -> F3 -> F4 -> F5. Esfuerzo en días-persona; el calendario con paralelo se indica.

| Fase | Contenido | Dueño | Esfuerzo | Depende de |
|---|---|---|---|---|
| **F0 Decisiones y contratos** | Cerrar las 6 decisiones (L); congelar `armor_data.js` (tablas C.1-C.5), contratos I.1/I.2 | game-designer + CEO | 1 d | - |
| **F1a Lógica** | `armor.js` (DEF, RD, CAP, equipar, fabricar, refuerzos, requisitos), hooks en `player.js` (`hurt`), `cards.js` (HP), `combat`/`weapons` (Afinidad, bonos), `zoneDmg`, perillas URL, `?dbg`; guardado v10 + migración | programador | 3 d | F0 |
| **F1b Arte** | Carapa, toldo, maniquí, perchero, iconos por slot x paleta, emblemas, `fx_armor_block` | tools-engineer | 3 d | F0 |
| **F1c Audio** | `sfx_armor.js` (9 sonidos) | audio-designer | 1 d | F0 |
| **F1d Texto** | Diálogos de Carapa y reacciones, 8 pedidos, 7 logros, textos de bonos | game-designer | 1 d | F0 |
| **F2 UI + Aldea** | Panel (4 pestañas), toldo y colisiones, burbujas, Portal (recomendada), loadouts, botín (`blocked`), pausa | programador | 4 d | F1a + F1b (parcial) |
| **F3 Integración** | Pedidos y logros en `quests.js`, desbloqueo por jefe, trofeos/insignias (`*Ever`), cacería/práctica, ajustes de Grum (título + 3 líneas), `L.PARTS`/`give` | programador | 2 d | F2 |
| **F4 Calibración** | Adaptar `play_bot`/`boss_bot` (`?armset=`), barrido de K, `zoneDmg`, costes, `BRASAS_MIN`; 16 runs por celda; informe | tools-engineer | 3 d | F3 |
| **F5 QA y salida** | `fusion_tests` (village, ui, touch, balance), móvil 844x390, PWA (`stamp.py`), README y GDD actualizados | tools-engineer | 1 d | F4 |
**Total ~18 d-persona; calendario ~9-10 días con la paralelización de F1.**

**MVP jugable primero (corte propuesto, ~9 d-persona, ~5-6 días de calendario):** Carapa + 4 slots + sets Aldeano, Esquila de Hierro y Carcelero de Brasa (12 piezas), `zoneDmg` solo en Bosque/Cripta, refuerzo +1 y +2 (+3 con Peligro III), UI completa, loadouts, guardado v10, migración y regalo. Luego se publican los sets de Letea, Yarlak, Melaria y Cráter como paquetes de **solo datos + paleta + diálogo + calibración** (~1 día cada uno), y al final los talismanes de minijefe y el overlay en Marlo.

### Criterios de éxito
1. Cuenta vacía: sin cambios hasta vencer al Pastor (supervivencia bosque 396 +- 15 s sin armadura).
2. Con `?arm=0`, comportamiento idéntico a la versión actual (misma semilla, mismos números).
3. Tabla G.3 cumplida con bots (n >= 12-16): ratios de supervivencia, caídas de win-rate sin armadura, tope con +3.
4. Todo el flujo (hablar, fabricar, equipar, reforzar, loadout) se completa en móvil 844x390 con tiles >= 44 px táctiles, 0 errores de consola (`fusion_tests`).
5. Cuenta existente con 5-6 jefes vencidos: guardado migrado sin pérdida, regalo entregado, dificultad jugable en Cripta/Cráter con el Peto de regalo (bot con 1 pieza dentro de +-15 % de win-rate del baseline).
6. Cada pieza de un set pide algo distinto (parte del bioma + trofeo + insignia/Peligro); ningún material es "gratis" por pura Hebra después de T0.
7. Telemetría `playMs` instalada y, tras jugar, estimación de horas por bucle entre 15 y 18 h (jugador medio).

---

## L) Decisiones abiertas para el dueño (con recomendación)
| # | Decisión | Opciones | Recomendación |
|---|---|---|---|
| 1 | **Personaje y momento de llegada** | (a) Carapa, armadilla, llega tras vencer al Pastor; (b) llega desde la primera salida; (c) otro animal | (a): el primer jefe ya enseña "hay un reto"; antes sería ruido. |
| 2 | **Forma de la defensa** | (a) DEF con curva suave y CAP 45 %; (b) reducción plana; (c) por etiqueta de enemigo | (a): evita que los golpes de 5-8 se anulen y reutiliza las 4 familias que ya existen (`P.family`). |
| 3 | **Dureza de "sin armadura"** | (a) `zoneDmg` creciente por bioma (+10 a +44 %); (b) opcional solo en Peligro; (c) sin cambio | (a): es lo que hace que la armadura valga y alarga la campaña; (b) si quieres que sea completamente opcional. |
| 4 | **Costes: PF o no** | (a) sin PF (Brasas + partes + trofeos + insignias); (b) PF | (a): el techo de 24 PF es de Grum; mezclar frenaría ambos. |
| 5 | **Marlo vestido en pantalla** | (a) MVP solo maniquí + chapita de set; (b) overlay completo desde el MVP | (a) y overlay en una fase posterior (14 frames x 7 sets de arte). |
| 6 | **Papel de Grum** | (a) igual + "temple" (refuerzos +2/+3 piden Rango II/III) + 3 líneas; (b) mover la Ruta defensiva a Carapa; (c) sin ningún vínculo | (a): une a los dos sin tocar su árbol ni invalidar nodos ya comprados. |
| 7 (extra) | **Meta de horas** | (a) ~16 h el jugador medio (completista ~20 h); (b) tope duro 18 h | (a): el completista es endgame voluntario; mide con `playMs` y ajusta costes. |
