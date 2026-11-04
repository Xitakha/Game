# Swarm Hand - Diseño v3: Aldea, árbol de forja y economía rebalanceada

Estado: DISEÑO para implementar, sin código. Sustituye a la "Base de una página" (`src/base.js`) y amplía `PROPUESTA-crafteo.md` y `DESIGN-v2.md`.
Feedback del dueño tras jugar la Fase 1: (1) la Base es fría, quiere una aldea caminable con NPCs; (2) el drop es demasiado alto (3 crafts + 2 mejoras en una run de 7 min); (3) el crafteo debe ser un árbol de habilidades tipo WoW con decisiones.
Las cifras son punto de partida y se afinan con el bot (`?speed=25&god=1`, 16 runs). Todas las constantes de meta siguen en `src/loot.js`.

Resumen del lazo: **Aldea (caminar, hablar, forjar, aceptar encargo) -> Portal -> Expedición -> Botín (R = repetir sin pasar por la aldea) -> Aldea.**

---

## A) LA ALDEA

**Lore (una frase):** Rescoldo es la última aldea del rebaño que el Pastor Corrupto no quemó; sus habitantes, animales de todo tipo, sobreviven del botín que Marlo (un corderito con bufanda de brasa) trae de las expediciones.

### A.1 Mapa (una pantalla 960x540, sin cámara)

```
 y=0  +----------------------------------------------------------------------------+
      |  cielo / colinas (fondo)                                       [humo]      |
 y=170|  .-------.      .-------.         ( Carpa del      .-------.     ___|___   |
      |  |HERRERIA|     | TABLON |        Cocinera)        |ARCHIVO|     | PORTAL |  |
      |  | [yunque]|    | [papeles]|       (olla)           | [torre]|    | [arco] |  |
 y=260|  '--(1)---'     '--(2)---'         ((6))           '--(5)---'     '--(4)---'  |
      |      \            |           ,-----+-----.             |             /      |
 y=370|       ====== camino de tierra ===== ( FOGATA (3) ) ========================== |
      |                    Marlo nace aqui ^    Abuelo        (Mercader (7) en carro)|
 y=470|  hierba, vallas, barriles, farolillos                                          |
      +----------------------------------------------------------------------------+
        x=130        x=300             x=480              x=640     x=780     x=900
```

| # | Punto | x,y aprox. | Qué es |
|---|---|---|---|
| 1 | Herrería | 130,300 | Herrero; abre forja/árbol |
| 2 | Tablón de encargos | 300,300 | Cazadora de encargos |
| 3 | Plaza con fogata | 480,390 | Centro, Abuelo (lore), luz de ambiente |
| 4 | Portal de expedición | 900,300 | Arco de piedra con brasas; selector de duración |
| 5 | Archivo (torre baja) | 780,300 | Archivista; colección, loadouts, anclas |
| 6 | Carpa del cocinero | 560,280 | Opcional (Fase 2b); buff de comida |
| 7 | Carro del mercader | 650,400 | Trueque y tienda |

Zona caminable: franja y=290..490 (los edificios del fondo son decorado con puerta; los NPCs están en la puerta o en la calle, a y~330-420). Colisión: rectángulos simples (casas, barriles, vallas); Marlo no sale de los bordes. Velocidad 170 px/s (cruzar el mapa = 5 s). Marlo aparece junto a la fogata; tras una expedición reaparece junto al Portal.
**Viaje rápido:** tecla Tab / botón "AL PORTAL" teletransporta ante el Portal con un fundido de 0,3 s (para quien solo quiere repetir).

### A.2 Interacción y controles

| Acción | Teclado | Táctil |
|---|---|---|
| Mover | WASD / flechas | Joystick virtual flotante a la izquierda (zona x<400) |
| Hablar / usar | E (o Enter) | Botón grande "HABLAR" 96x96 px abajo-derecha; aparece solo con NPC a menos de 56 px |
| Cerrar panel / saltar diálogo | Esc / E | Botón X 44x44 / tocar la burbuja |
| Viaje rápido al Portal | Tab | Botón "PORTAL" 64x44, esquina inferior izquierda |

- Al acercarse (<56 px) el NPC se gira hacia Marlo, aparece un globo "E" flotante con latido y el nombre sobre la cabeza.
- **Burbujas de diálogo:** caja redondeada sobre el NPC, máx. 2 líneas x 38 caracteres, efecto máquina de escribir (35 car/s), E/toque avanza. Al final de la burbuja de saludo se abre el panel del NPC (o botones de 3 opciones: [Forjar] [Charlar] [Adiós]).
- Mientras hay panel abierto Marlo está quieto. Esc vuelve a la calle.
- Un NPC con novedad muestra un icono "!" (verde: algo forjable o encargo completado; dorado: encargo nuevo).

### A.3 NPCs (animales con silueta distinta)

Marlo: cordero pequeño, bufanda naranja (reutiliza el sprite del jugador).

| NPC | Animal / silueta | Personalidad | Función | Diálogos mínimos |
|---|---|---|---|---|
| **Grum, herrero** | Oso grande, ancho, delantal de cuero, martillo al hombro, chispas | Parco, orgulloso de su oficio, habla de metal como de poesía | Panel de Forja: árbol de talentos, tronco, colección clásica (Fase 2a) | Saludo: "Trae partes. Yo hago el resto." / Primera vez: "El hierro recuerda. Elige bien qué camino le enseñas." / Sin puntos: "Sin chispa de forja no hay trabajo. Cumple encargos." / Tras forjar: "Eso aguantará." |
| **Vesper, cazadora de encargos** | Zorra delgada, orejas altas, capa con papeles clavados | Irónica, directa, apuesta por Marlo | Tablón con 3 encargos (aceptar/entregar/abandonar) | Saludo: "Hay bichos que molestan. Elige uno." / Encargo activo: "Aún te faltan {n}. No los dejes escapar." / Entrega: "Cobrado. Toma lo tuyo." / Tutorial: "Empieza por las Bombas: huelen a chamusquina." |
| **Rufo, mercader** | Mapache redondo, mochila enorme, cola rayada, carro | Regateador simpático, siempre "te hago un precio" | Trueque 3:1, venta de partes por Brasas, 2 ítems en venta | Saludo: "¿Cambiamos? Tres por una, sin preguntas." / Cupo agotado: "Hoy no me caben más trastos. Vuelve tras otra salida." / Sin Brasas: "El cariño no paga, cordero." |
| **Ulalume, archivista** (2b) | Búho alto, ojos enormes, sombrero de cartomante, cartas flotando | Misteriosa, habla de "lo que dicen tus cartas" | Colección de cartas, 3 loadouts, elegir anclas | Saludo: "Tus cartas susurran. ¿Las ordenamos?" / Combo visto: "Fuego y Hielo... qué vapor tan dramático." |
| **Portal / Puerta** (objeto, sin NPC) | Arco de piedra con brasas girando | - | Resumen de loadout, duración 7/9/10, encargo activo, botón SALIR | Texto del panel: "¿Listo, Marlo?" |
| **Abuelo Lanudo** | Carnero viejo, cuernos enroscados, bastón, sentado junto a la fogata | Nostálgico, repite historias | Ambiente: lore y consejos contextuales (rota 1 línea por visita) | "El Pastor era el mejor de nosotros..." / "Si te rodean, no corras en línea recta." / "Dos fuegos y un hielo hacen vapor, decía mi abuela." |
| **Tía Castaña, cocinera** (2b, opcional) | Erizo con gorro de chef, olla humeante | Maternal, insiste en que comas | Buff de comida para la siguiente expedición | Ver A.5 |

### A.4 Detalle por NPC

- **Herrero:** al hablar abre un panel de 4 pestañas: Fuego (arbol), Tronco, Clásica (recetas planas de la Fase 1 para cartas de otras etiquetas en 2a) y Colección (rejilla actual para fijar anclas, hasta que llegue la Archivista). Detalle del árbol en la sección B.
- **Vesper (Tablón):** 3 encargos visibles. Solo 1 activo a la vez. Objetivo persistente entre expediciones (el progreso no se pierde). Ejemplos y recompensas:

| Encargo | Meta | Recompensa |
|---|---|---|
| "Huele a chamusquina" (tutorial, fijo en Fase 2a) | 20 Bombas | 6 Mecha + 40 Brasas + 1 PF |
| "Caza 40 Polillas gélidas" | 40 Polillas | 12 Escarcha + 60 Brasas + 1 PF |
| "Mata al Coloso Escudero" (élite) | 1 élite | 8 Placa + 100 Brasas + 2 PF |
| "Vence al Pastor" (repetible) | jefe | 150 Brasas + 2 PF (3 PF la primera vez) |
| (2b) "Gana sin dejar vivo al Escudero a los 5:00" | condición | 2 PF + parte rara |

  **Orienta el farmeo:** el encargo activo se muestra en el HUD de la run ("Polillas 12/40") y avisa al director (`waves.js`): el tipo objetivo recibe peso x2.5 y adelanta su entrada a un máximo de 2:30 virtual (reutiliza el mecanismo del "enemigo protagonista" x2.2). Metas por tier: bajo 60, medio 40, alto 20, élite 1. Progreso se cuenta en `L.onKill` (ya por tipo).
- **Rufo (Mercader):** pestañas Trueque / Vender / Comprar.
  - Trueque: 3 partes comunes de un tipo -> 1 de otro común (Hebra vale la mitad: 6:1). Cupo: **4 trueques por expedición** (se reinicia al volver de una salida) para que no anule la escasez. Las raras no se truecan.
  - Vender sobrantes: 1 parte = 6 Brasas (Hebra 3); no vende raras.
  - Comprar (1 vez por expedición cada uno): "Tónico de ceniza" (80 Brasas: empiezas con +40 Ceniza) e "Imán de bolsillo" (120 Brasas: radio del imán x1,5 en la siguiente run). Comprar 1 parte común cualquiera: 24 Brasas, cupo 3.
- **Ulalume (Archivista, 2b):** rejilla de colección actual, 3 loadouts (nombre libre de 12 letras + 2 anclas + comida + duración), botón "Aplicar". Reutiliza la rejilla/anclas de `base.js`.
- **Portal:** panel con la mano al salir (2 anclas + 3 slots abiertos), selector 7/9/10 (misma lógica que `lenRect`), encargo activo, comida, "SALIR" (Enter). "Peligro I-V" gris con candado (fuera de alcance).

### A.5 Cocinera (opcional, 2b)
Un guiso por expedición, consume partes sobrantes: "Sopa de hebra" (6 Hebra: +25 HP máx), "Guiso de etiqueta" (4 partes de la etiqueta principal: +8 % daño de esa etiqueta toda la run), "Té de brasas" (30 Brasas: +10 % XP). Se muestra el icono del buff en el HUD.

### A.6 Reutilización y novedades

| Se reutiliza | Nuevo |
|---|---|
| `U.panel`, `U.button`, `U.part`, `U.wrap`, `U.inR`, `U.roman` (assets_ui.js/base.js) | `src/aldea.js`: escena (movimiento, colisión, NPCs, cámara fija, lluvia de luces) |
| `Cards.drawCard`, `slotRect`, `drawEmptySlot` (rejilla de colección, mano al salir) | `src/dialog.js`: burbujas, cola de líneas, máquina de escribir |
| `recipeRow` y fila de partes de `base.js` (costes en los nodos) | `src/tree.js`: datos del árbol, reglas y panel de UI |
| Selector de duración `LENS`, `launch()`, `G.startGame()` | `src/quests.js`: encargos, progreso, recompensas, hook al director |
| `Bs.updateEnd/drawEnd` (botín) se mantiene; "IR A LA BASE" pasa a "IR A LA ALDEA" | Dibujo de edificios/NPCs/decoración por código |
| `G.Save`, `G.Loot`, `G.input`, `G.txt`, sfx existentes (`card_select`, `fuse`, `flip`) | Sfx nuevos para audio-designer: pasos en hierba, yunque, moneda, abrir pergamino, viento del portal, fogata, murmullo de voz corta por NPC |

`G.Base.open()` pasa a llamar a `G.Aldea.open()`. `base.js` conserva `drawEnd`/`updateEnd` y las funciones de panel; su pantalla antigua se queda como panel "Colección" del Herrero.

### A.7 Cómo se dibuja (arte por código, estilo del juego)
- **Suelo:** degradado verde oscuro, camino de tierra como polígono con borde irregular, manchas de hierba (trazos cortos), piedras. Cuadrícula de seed fija para que no parpadee.
- **Edificios:** rectángulo con tejado triangular/curvo, puerta, ventana, detalle por oficio. Herrería: chimenea con humo animado y brasas, yunque y barril de agua. Tablón: poste con 6 papeles ondeando. Archivo: torre con ventana circular y estrellitas. Portal: dos pilares + arco con círculo de brasas que gira. Carpa: tela a rayas.
- **NPCs:** procedurales con formas simples (óvalo cuerpo, cabeza, orejas/cuernos/púas/pico según animal), outline 2 px oscuro como el resto del juego, idle con respiración (±2 px), parpadeo cada 3-5 s, orientación hacia Marlo. Cada uno con un rasgo cromático fuerte para silueta clara (oso marrón/rojo, zorra naranja/blanco, mapache gris/negro, búho morado/crema, erizo rosado, carnero crema/gris).
- **Marlo:** sprite existente, con animación de caminar (rebote de 3 px) y sombra elíptica. Ordenar por `y` para dibujar delante/detrás de los objetos.
- **Decoración:** vallas, barriles, cajas, farolillos que se balancean, banderines, hierba que se mece, 10-14 luciérnagas, humo de chimeneas y de la olla.
- **Luz de ambiente:** capa final con `globalCompositeOperation` y overlay de color: **Día** (neutro, cielo azul claro) tras ganar o al abrir el juego; **Ocaso** (tinte naranja-morado, ventanas encendidas) tras una derrota; **Noche** (azul oscuro con viñeta y fogata como foco radial parpadeante) a partir de 3 expediciones seguidas sin volver a ganar o cada 5 expediciones (Fase 2b). Fogata, farolillos y portal emiten glow radial aditivo.

---

## B) ÁRBOL DE CRAFTEO (tipo WoW)

### B.1 Reglas

- **7 árboles:** Tronco común + Fuego, Hielo, Rayo, Veneno, Sangre, Acero. Cada árbol tiene su raíz (carta inicial o primera carta de esa etiqueta).
- **Punto de Forja (PF):** moneda de talentos. Se ganan hasta un **techo de 24 PF** en total. Un árbol completo cuesta ~20 PF, así que puedes tener **un árbol casi completo + 4 PF de otro**. Eso obliga a especializarse (decisión de verdad, como en WoW).
- **Cada nodo cuesta PF + partes + Brasas.** Niveles de coste:

| Tier | PF | Partes (principal / secundaria) | Brasas | Extra | Requiere |
|---|---|---|---|---|---|
| T1 | 1 | 10 / 5 | 30 | - | Rango de forja I (inicial) |
| T2 | 2 | 16 / 7 | 60 | - | Rango de forja II (tronco) |
| T3 (carta épica) | 3 | 24 / 9 | 100 | 1 Esencia rara | Rango de forja III |
| T4 (maestría) | 4 | 34 / 12 | 150 | 2 Esencias raras | Rango de forja III |

  Parte principal por etiqueta (existente): Fuego=Mecha, Hielo=Escarcha, Rayo=Jirón, Veneno=Púa, Sangre=Colmillo, Acero=Placa; secundaria según `L.SEC`.
- **Tipos de nodo:** (C) Carta: desbloquea carta. (M) Mejora con elección A/B: se compra una sola vez y eliges A o B (consecuencia permanente hasta reespecializar). (P) Pasivo numérico. (X) Rama excluyente: dos nodos hermanos, solo uno. (S) Set/sinergia. (Ma) Maestría final.
- **Rango de carta:** `Save.cards[id]` pasa a ser 1 + número de nodos de mejora comprados de esa carta (máx. 3). `L.RANK_MUL` (+8 % por rango) se mantiene. Las mejoras A/B añaden el efecto cualitativo.
- **Prerrequisitos:** una línea entre nodos; "(A o B)" o "(A y B)". Nodo bloqueado = gris; disponible = borde pulsante; comprado = relleno con color de etiqueta; excluido = tachado.
- **Reespecializar:** devuelve los PF del nodo y de sus dependientes, devuelve el 50 % de las partes y cuesta 40 Brasas por PF devuelto. Un nodo de carta desactivado quita la carta de la colección (y de las anclas). El primer reespecializado es gratis. Botón "Reespecializar árbol" = 250 Brasas fijas.
- **Cómo se ganan PF** (media objetivo ~1 PF por expedición, techo 24 = ~20-24 expediciones):

| Fuente | PF |
|---|---|
| Encargo fácil / de objetivo | 1 |
| Encargo de élite / jefe | 2 (3 la primera vez del Pastor) |
| Primer élite abatido de cada tipo | 1 |
| Cada 4 nodos forjados (hito del Herrero: "Maestría de oficio") | 1 |
| Comienzo | 1 PF de regalo |

### B.2 Tronco común (no gasta PF salvo donde se indica)

| Nodo | Efecto | Coste |
|---|---|---|
| Rango de forja II | Abre los nodos T2 de todos los árboles | 30 Hebra, 10 Pluma, 100 Brasas |
| Rango de forja III | Abre T3 y T4 | 60 Hebra, 20 Pluma, 10 Placa, 300 Brasas (req. Rango II) |
| Ceniza viva (P) | Empiezas con +20 Ceniza | 1 PF, 20 Hebra |
| Tercera ancla (S) | `B.anchorSlots` 2 -> 3 | 3 PF, 2 Esencias, req. Rango III |
| Cartas neutras (C): Pezuñas, Imán, Alforja | Desbloquean la carta | 1 PF cada una, T1 en Hebra/Pluma |

(El Reloj de arena es gratis desde el inicio.) Talismán y gemas: fuera de alcance.

### B.3 Árbol de FUEGO completo (12 nodos)

```
                           (F0) CHISPA   gratis (raiz)
                          /                       \
         [F1] Chispa II  M T1 1PF            [F2] Bola de brasa  C T1 1PF
         A Pavesa  |  B Rafaga                     |            \
          |             \                          |             \
   [F4] Pulmon P   [F5] Manto de ceniza C T2 2PF   |     [F3] Bola II  M T2 2PF
   T1 1PF          (req F1 o F2)                   |      A Metralla | B Napalm
   (req F1)        /               \               |        (req F2)
                  /                 \              |           |
     [F6] Cenizas ardientes X  [F7] Fundicion X    |           |
     T2 2PF  (elige UNA)       T2 2PF              |           |
                  \                 /              |           |
                   \               /               |           |
                 [F10] Emblema de Fuego  S T2 2PF  |    [F8] Anillo ardiente C T3 3PF +1 Esencia
                 (req F6 o F7)                     |     (req F3 y F5)
                            \                      |           |
                             \                     |    [F9] Anillo II  M T2 2PF
                              \                    |     A Corona | B Cometa
                               \                   |           |
                                +------------------+-----------+
                                                   |
                              [F11] CORAZON DE BRASA  Ma T4 4PF + 2 Esencias
                              (req F9 y F10)
```

| Nodo | Efecto concreto |
|---|---|
| F0 Chispa | Carta inicial, Rango I |
| F1 Chispa II (M) | Rango II (+8 % daño) y elección: **A Pavesa** quemadura dura +2 s y +30 % de su daño / **B Ráfaga** cooldown -15 % |
| F2 Bola de brasa (C) | Desbloquea la carta (común) |
| F3 Bola II (M) | Rango II y elección: **A Metralla** explota además en 3 fragmentos de 8 de daño / **B Napalm** deja suelo ardiente 2 s (4 dps, radio 40) |
| F4 Pulmón de fragua (P) | +8 % de daño de cartas Fuego |
| F5 Manto de ceniza (C) | Desbloquea la pasiva (rara): Fuego +25 % daño |
| F6 Cenizas ardientes (X) | Enemigo quemado que muere deja 3 s de fuego en el suelo (radio 35): para enjambres |
| F7 Fundición (X) | Cartas Fuego ignoran la mitad del escudo del Escudero (frontal x0,2 -> x0,5) y +15 % de daño a élites: para blindados y jefe |
| F8 Anillo ardiente (C, épica) | Desbloquea la carta (épica); exige la Esencia rara |
| F9 Anillo II (M) | Rango II y elección: **A Corona** 3 llamas en vez de 2 / **B Cometa** órbita radio +25 % y +20 % daño |
| F10 Emblema de Fuego (S) | Activa el set: 3 cartas Fuego en la mano final +25 % daño Fuego; 4+ "Pira" (las quemaduras se propagan al morir) |
| F11 Corazón de brasa (Ma) | Una vez por expedición, al llegar a 0 HP revives con 40 % de vida y explosión de radio 120 (60 de daño) |

Coste total del árbol (con una de F6/F7): 20 PF, ~168 Mecha, ~70 Hebra, ~1200 Brasas, 3 Esencias. Cada decisión A/B y la X de F6/F7 cambia la build (enjambre vs blindados, más llamas vs más área).
**Build mínima jugable (~6 expediciones):** F1, F2, F5 y F3 (6 PF, 52 Mecha). Con Chispa+Esquirla ya hay VAPOR; el sinergia nueva es Manto + Bola de brasa en la mano.

### B.4 Resumen de los otros árboles

| Árbol | Raíz / cartas | Mejoras A/B (ejemplos) | Rama excluyente | Set 4+ | Maestría (T4) |
|---|---|---|---|---|---|
| Hielo | Esquirla (gratis) -> Nova, Cristal de escarcha, Ventisca (épica) | Esquirla: atraviesa / ralentiza más; Nova: radio +25 % / dos pulsos | Permafrost (ralentización 45 %) vs Quebradizo (+30 % daño a ralentizados) | Cripta: ralentizados <15 % vida mueren congelados | Era glacial: cada 60 s pulso que congela 2 s a todos en pantalla |
| Rayo | Chispazo (raíz, T1 1PF) -> Cascabel, Tormenta (épica) | Chispazo: +2 saltos / sin pérdida por salto; Tormenta: dos rayos / área mayor | Cadena larga vs Un rayo, mucho daño (x2 daño, -1 salto) | Eco: cada 8.º rayo se repite solo | Ojo de la tormenta: cada 10 s cae un rayo sobre cada élite/jefe |
| Veneno | Dardo (gratis) -> Charco, Nube pútrida, Frasco de bilis | Dardo: 4 stacks / daño inicial x2; Charco: dura 8 s / radio +30 % | Pandemia (propaga al morir) vs Neurotoxina (5 stacks aturden 1 s) | Pandemia: +1 stack al kill | Plaga: el veneno nunca expira en élites |
| Sangre (menor, 3 cartas) | Colmillo (gratis) -> Sangría, Corazón de lana | Colmillo: cura x2 / arco 120 grados; Sangría: 4 marcas / sangrado +40 % | Vampiro (curación) vs Berserker (+35 % daño con menos de 40 % HP) | Sed: 3 kills = escudo de 10 HP | Pacto de sangre: cada 25 kills revives 15 HP y +10 % daño 5 s |
| Acero | Daga (gratis) -> Escudo de púas, Piedra de afilar, Hacha giratoria (épica) | Daga: 5 dagas / perforante; Púas: 4 escudos / empuje x2 | Filo (críticos) vs Bastión (reducción de daño 10 %) | Filo eterno: críticos reducen 0,3 s todos los cooldowns | Tormenta de acero: las dagas rebotan 1 vez y el Hacha dobla su arco |

Cada árbol se construye con la plantilla de Fuego (12 nodos, ~20 PF); Sangre queda con ~10 nodos.

### B.5 UI del árbol (canvas 960x540)
- **Pestañas por árbol** en la parte superior (7 iconos de 48 px: tronco + 6 etiquetas con su color). Sin pan/zoom obligatorio: cada árbol cabe entero en la pantalla (6 filas x 3 columnas, nodos de 56 px, separación 90x70).
- **Nodos:** círculo de 56 px con icono (carta, flecha, escudo...) y borde de color; las mejoras A/B se dibujan como círculo partido en dos mitades; los nodos X hermanos conectan con una "V" de línea punteada.
- **Panel de detalle** a la derecha (reutiliza `U.panel`, 300 px): nombre, texto, requisitos, fila de coste con `recipeRow` (partes + Brasas + PF), botón grande COMPRAR (44+ px alto). Los A/B salen como dos botones de elección.
- **Cabecera:** PF "usados/ganados / techo 24", Brasas, botón REESPECIALIZAR (doble pulsación). Contador de PF en rojo si no se puede asignar.
- **Navegación:** táctil = tocar un nodo lo selecciona y muestra el detalle; tocar COMPRAR confirma; deslizar en horizontal cambia de pestaña; teclado = flechas mueven la selección, Q/E o 1-7 cambian de pestaña, F compra (misma tecla de la Fase 1), Esc sale.
- **Opcional (2b):** zoom ligero con pellizco/rueda x0,75-1,25 y arrastre si el árbol de Fuego se queda corto en móvil.
- Un nodo comprado: destello dorado y `fuse` como ahora.

---

## C) ECONOMÍA REBALANCEADA

### C.1 Objetivos
- 1.ª expedición de 7 min: partes para **1 craft + ~1/3 del segundo** (hoy: 3 crafts + 2 mejoras).
- Primera build (2 anclas buenas + sinergia): **6-8 expediciones**.
- Set cohesivo completo (un árbol terminado con su Emblema): **15-20 expediciones**.
- Los PF son el segundo cuello de botella a propósito (~1 por run), así nadie termina el árbol de golpe aunque tenga muchas partes.

### C.2 Nueva tabla de drops (`L.DROPS`)

| Enemigo | Parte | Antes | Ahora |
|---|---|---|---|
| worm | Hebra | 30 % | 12 % |
| warlock | Hebra | 35 % | 14 % |
| archer | Pluma | 32 % | 13 % |
| fanner | Púa | 33 % | 14 % |
| sower | Púa | 35 % | 14 % |
| boar | Colmillo | 33 % | 14 % |
| shield | Placa | 33 % | 14 % |
| bomb | Mecha | 30 % | 13 % |
| scorcher | Mecha | 35 % | 15 % |
| moth | Escarcha | 33 % | 14 % |
| blinker | Jirón | 35 % | 15 % |

- **Rara (Esencia):** `RARE_P` 0,035 -> **0,008** (~1 %), solo coste >= 6 (Espectro, Ascua, Brujo); `PITY_STEP` 0,015 -> **0,004** por run sin rara, tope +4 %. Élites: probabilidad de rara 0,35 -> **0,20**. El Pastor sigue dando 1 segura.
- **Garantías (`L.GUARANTEED`):** Coloso `{plate:2, feather:1}`, Madre Colmena `{spine:2, thread:2}`, Pastor `{fang:2, thread:2, feather:1}` (antes 3/1, 3/2, 2/3/2).
- **Brasas:** `BRASAS_ASH` 0,20 -> **0,12**; `BRASAS_MIN` 15 -> **10** por minuto (+40 por victoria se mantiene). Resultado ~285 por run de 9 min (antes ~460); el coste de los nodos (30-150) y del tronco (100-300) lo consume sin que sobren.

### C.3 Cuenta esperada de partes por expedición

Base: ~1090 kills por run de 9 min (≈350 partes / 0,32 antes); el factor de drop medio baja a ~0,13/0,32 = **x0,42**. Duración: 7 min = x0,78, 9 min = x1,0, 10 min = x1,10 (ya medido en `loot.js`).
"Realista" = x0,7 (se muere antes del jefe, partes sin recoger).

| Parte | 9 min (teórico) | 7 min | 10 min | 9 min realista |
|---|---|---|---|---|
| Hebra | 67 | 52 | 74 | 47 |
| Pluma | 15 | 12 | 16 | 11 |
| Púa | 18 | 14 | 20 | 13 |
| Colmillo | 9 | 7 | 10 | 6 |
| Placa | 6 | 5 | 7 | 4 |
| Mecha | 12,6 | 9,8 | 13,9 | 8,8 |
| Escarcha | 5,5 | 4,3 | 6,1 | 3,9 |
| Jirón | 7,6 | 5,9 | 8,4 | 5,3 |
| Esencia | ~1,1 | ~0,9 | ~1,2 | ~0,8 |
| Brasas | ~285 | ~215 | ~315 | ~200 |

Más el trueque (+~2,5 partes/run útiles con el cupo de 4) y las recompensas de encargos (6-12 partes + PF).

**Verificación con el árbol de Fuego (Mecha, parte limitante):**
- 1.ª run de 7 min: 9,8 Mecha teóricas x0,7 = 6,9 + 6 de recompensa del encargo tutorial = **12,9** -> alcanza un T1 (10 Mecha, 5 Hebra, 30 Brasas, 1 PF) y queda ~29 % del segundo. Cumple "1 craft + ~1/3".
- Build mínima (F1+F2+F5+F3 = 52 Mecha, 6 PF): Mecha efectiva ~10/run con trueque -> 5 runs; los PF (1/run) piden 6; **~6-7 expediciones**. Cumple.
- Árbol de Fuego completo (168 Mecha, 20 PF): Mecha 17 runs, PF 20 runs; **~18-20 expediciones** (con encargos a Bombas/Ascuas, ~15). Cumple.
- Esencias: 3 por árbol vs ~1/run: no limitan, pero se sienten (1-2 por semana de juego).

### C.4 Qué tocar en `src/loot.js`
1. `L.DROPS`: nuevas probabilidades de la tabla C.2.
2. `L.GUARANTEED`: valores nuevos y `rare` 0,35 -> 0,20 (jefe sigue en 1,0).
3. `L.RARE_P` = 0.008, `L.PITY_STEP` = 0.004 (y limitar el pity a 0.04 en `endRun`).
4. `L.BRASAS_ASH` = 0.12, `L.BRASAS_MIN` = 10.
5. `L.EXPECT`: multiplicar cada valor por 0,42 -> `{thread:67, feather:15, spine:18, fang:9, plate:6, wick:13, frost:5.5, static:7.6, rare:1}`. **Hotfix inmediato:** con solo los puntos 1-5 el sistema actual de recetas por fracción del suministro (`L.COST`, `L.recipe`) ya se reescala sin tocar nada más, y el dueño puede rejugar mientras se construye la aldea.
6. Nuevo (cuando llegue el árbol): `L.NODE_TIER = { T1:{pf:1,main:10,sec:5,brasas:30}, T2:{pf:2,main:16,sec:7,brasas:60}, T3:{pf:3,main:24,sec:9,brasas:100,rare:1}, T4:{pf:4,main:34,sec:12,brasas:150,rare:2} }`, `L.PF_CAP = 24`, `L.PF_SOURCES`, `L.TRADE = { ratio:3, hebraRatio:6, cupo:4 }`, `L.SELL = 6` (Hebra 3), `L.BUY = { tonic:80, magnet:120, part:24 }`. Las recetas de nodo se leen de datos en `tree.js`, no de `L.recipe`.
7. Verificar con el bot (16 runs en cuenta vacía) y ajustar solo `DROPS` si el 7 min da fuera de 8-12 Mecha teóricas.

---

## D) ALCANCE EN FASES

### Fase 2a (aldea + primer árbol), ~5-6 días
- Aldea caminable con colisión, luz Día/Ocaso, joystick y botón HABLAR táctiles, viaje rápido.
- 4 NPCs + objeto: **Grum** (árbol de Fuego completo + tronco + pestaña "Clásica" con las recetas planas rebalanceadas para cartas de otras etiquetas + pestaña Colección para anclas), **Rufo** (trueque, venta, 2 ítems), **Vesper** (tablón con 3 encargos fijos: Bombas, Polillas, Coloso), Portal (duración, loadout, encargo, SALIR) y el Abuelo como decorado con 3 frases.
- Persistencia `Save` v2 (PF, nodos, elecciones, encargos, cupo de trueque, flags de "ya hablaste"). Migración de v1: se conservan rangos de cartas y se dan 2 PF de compensación.
- Rebalanceo de `loot.js` (C.4) y hooks: contar kills para encargos, dar PF, adelantar y pesar al enemigo objetivo.
- **Criterios de aceptación:** una run de 7 min en cuenta vacía permite 1 craft; la build mínima tarda 6-8 runs; el viaje Botín -> Portal -> run tarda menos de 20 s con viaje rápido; el árbol de Fuego se juega entero en táctil.

### Fase 2b, ~5 días
Árboles de Hielo, Rayo, Veneno, Sangre y Acero; Ulalume (loadouts, 3 slots) y Tía Castaña (comida); pool rotatorio de 8-10 encargos, encargos de condición; noche; zoom del árbol; reespecialización completa; sets activos de las 6 etiquetas.

### Fuera de alcance
Gemas, talismán, desmontar, partir partes, Peligro I-V, cartas híbridas, jefes mayores, mapa con cámara scrolleable, sonido de voz por palabra, multiples zonas de expedición.

### Riesgos
| Riesgo | Mitigación |
|---|---|
| Caminar añade fricción al "una más" | R en el botín repite sin pasar por la aldea; viaje rápido Tab; aldea de 5 s de cruce |
| Árbol complejo en móvil | 1 árbol por pestaña, nodos 56 px, detalle en panel fijo, sin zoom obligatorio |
| Techo de PF frustra | Reespecializar con 50 % de partes y primer reset gratis; mostrar "PF libres" siempre |
| Economía demasiado lenta | Todo en `loot.js`; encargos al objetivo reducen ~25 % las runs de farmeo; se mide con bot antes de tocar la UI |
| Trabajo de arte por código (7 NPCs, 6 edificios) | 2a solo dibuja 4 NPCs + objeto; reutilizar una función `drawAnimal(c, kind, ...)` con parámetros |
| Escudero/F7: interferencia con el multiplicador frontal x0,2 | Aplicar en `Combat.deal` como un solo factor leído desde el nodo |
| Migración de guardado v1 | Valores por defecto en `S.load` (patrón ya existente) y compensación de PF |

### Pregunta al dueño
**¿Quieres builds "duras" (techo de 24 PF y reespecializar cuesta Brasas y el 50 % de las partes: decisiones con consecuencias reales) o "blandas" (reespecializar gratis o casi gratis y poder probar de todo)?** Propongo duras, que es lo que describiste, con el primer reset gratis.

---

## Resumen
1. La Base pasa a ser Rescoldo: aldea de una pantalla (960x540) con Marlo caminable (WASD/joystick, E/botón grande) y 6 puntos: Herrería, Tablón, Fogata, Mercader, Archivo y Portal (+cocinera opcional).
2. NPCs animales con nombre y silueta: Grum (oso, forja), Vesper (zorra, encargos), Rufo (mapache, trueque 3:1), Ulalume (búho, colección/loadouts), Abuelo Lanudo (lore), Tía Castaña (comida).
3. El encargo activo orienta el farmeo: el director da x2,5 de peso al enemigo objetivo y adelanta su entrada.
4. Crafteo = 7 árboles (tronco + 6 etiquetas) con nodos de carta, mejora A/B, pasivo, rama excluyente, set y maestría; el Fuego completo tiene 12 nodos y ~20 PF.
5. Los PF (techo 24, ~1 por expedición: encargos, élites, jefe, hitos) obligan a especializarse; reespecializar cuesta Brasas y devuelve 50 % de partes.
6. Drops comunes bajan de 30-35 % a 12-15 %, rara a 0,8 % con pity suave y Brasas -40 %: 1.ª run de 7 min = 1 craft; build mínima en 6-8 runs; árbol completo en 15-20.
7. Hotfix inmediato: multiplicar `L.EXPECT` por 0,42 y aplicar los valores de drops/Brasas de C.4.
8. Fase 2a: aldea + Grum (Fuego+tronco) + Rufo + Vesper (3 encargos) + Portal; Fase 2b: resto de árboles, Archivista, cocinera, más encargos.
9. Riesgos principales: fricción de caminar (mitigada con R y viaje rápido) y UI del árbol en móvil.
10. Pregunta al dueño: ¿builds duras (techo de PF, respec caro) o blandas?
