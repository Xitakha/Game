# Swarm Hand - Propuesta: crafteo, farmeo y preparación de build (estilo Monster Hunter)

Estado: SUGERENCIA para decidir, sin implementar. Cifras orientativas a afinar jugando. Base actual: 26 cartas (16 ataque + 10 pasivas), 6 etiquetas + Neutro, 12 combos, mano de 5 slots, Nv1-3 por fusión en la run, Ceniza/reroll, roster de 11 enemigos + 2 élites + jefe, run de 9:00 (jefe a 7:30).

Idea en una línea: la run sigue siendo el "una más" caótico de siempre, pero antes de salir cazas con intención, forjas tus cartas con partes de monstruo y llevas una build preparada.

## 1. Loop completo y duración

| Fase | Qué pasa | Duración |
|---|---|---|
| Base / Forja (pre) | Elegir encargo y zona, equipar build, forjar lo pendiente | 1-3 min (menos de 30 s si repites build) |
| Expedición | Run actual (spawn continuo, subidas, combos). Modo "Cacería corta" opcional de 5 min con jefe/élite objetivo | 9 min (o 5) |
| Botín | Pantalla de resultados: partes por enemigo, partes raras destacadas, Brasas, progreso de encargo | 30-45 s |
| Forja (post) | Gastar partes: desbloquear, mejorar rango, gemas | 1-3 min |
| Equipar | Guardar loadout y volver a salir | 15 s |

Ciclo completo: 12-15 min. Regla de oro: desde la pantalla de botín hasta pisar la mazmorra de nuevo, máximo 3 clics ("Repetir loadout y salir").

## 2. Materiales y farmeo con intención

Cada enemigo suelta una parte común propia (afín a una etiqueta, para que farmear Fuego signifique cazar enemigos de fuego). Las partes no caducan.

| Enemigo | Parte común | Afinidad | Parte rara (3-4 %) |
|---|---|---|---|
| Gusano | Hebra de larva | Neutro | - |
| Arquero | Pluma emplumada | Acero/Neutro | - |
| Espinoso | Púa de erizo | Veneno | Savia espinosa |
| Jabalí | Colmillo de jabalí | Sangre | Cuero de carga |
| Escudero | Placa de pavés | Acero | Remache del escudo |
| Bomba | Mecha chamuscada | Fuego | - |
| Polilla gélida | Polvo de escarcha | Hielo | Ala de escarcha |
| Sembrador | Espora del sembrador | Veneno | Saco de esporas |
| Espectro | Jirón estático | Rayo | Esencia del vacío |
| Ascua | Escama de brasa | Fuego | Corazón de brasa |
| Brujo | Ojo del brujo | Sangre/Neutro | Cuenco ritual |
| Élite Coloso | Núcleo de pavés (Acero) | Acero | Cresta del Coloso |
| Élite Madre Colmena | Panal ámbar (Veneno) | Veneno | Aguijón real |
| Jefe Pastor | Lana corrupta + Cayado astillado | Sangre/Neutro | Cuerno del Pastor |

- **Probabilidades:** normal 30 % de soltar su parte común (se muestra como icono pequeño en el suelo; se recoge con el imán). Rara 3-4 % (solo tipos de coste 4 o más). Élite: 100 % de 2-3 partes + 35 % de rara. Jefe: 3 partes garantizadas + 40 % de rara + 1 "trofeo" de victoria.
- **Pity (anti-mala-suerte):** cada run sin rara de un tipo suma +1,5 % al siguiente drop de esa rara; al llegar a 100 % se resetea.
- **Elegir objetivo:** en la base escoges 1 encargo ("Caza 40 Sembradores"). El director multiplica x2,5 el peso del enemigo objetivo y adelanta su entrada (reutiliza el "enemigo protagonista" x2,2 y el parámetro `?t=`). Con un objetivo, una run de 5 min da ~25-35 partes de ese tipo.
- **Partir partes (viable en versión barata):** no hay hitbox por parte. En su lugar, una parte "tratada" depende de cómo muere: Sembrador muerto con Fuego suelta "Espora chamuscada" (mejor para recetas de Fuego+Veneno); Escudero matado por la espalda/estados suelta "Placa intacta". En élites y jefe, "romper" = bajar a 66 % y 33 % de vida: cada umbral roto garantiza 1 parte extra (el Coloso rompe su escudo en esos cortes). Detección sencilla: estado del enemigo y etiqueta del golpe final.

## 3. Crafteo de cartas

- **Desbloqueo:** una carta es una receta. Ej.: Hacha giratoria = 6 Placa de pavés + 4 Pluma + 30 Brasas. Las 3 cartas iniciales (Chispa, Esquirla, Dardo) y 5 más vienen gratis.
- **Rango de forja (permanente, I-V)**, distinto del Nv1-3 de la run. Cada rango da +8 % de daño y -3 % de cooldown (tope aprox. +32 % en V). Ej. Chispa II: 5 Mecha + 3 Hebra + 40 Brasas; Chispa III: 8 Mecha + 2 Escama de brasa + 90 Brasas. Rango III abre 1 hueco de gema; Rango V da una variante exclusiva (Chispa V: atraviesa a 1 enemigo).
- **Rarezas:** Común (rango máx. III), Rara (V), Épica (V + variante; exige parte rara). Las épicas son las 5-6 cartas más rotas (Tormenta, Hacha, Murciélago...).
- **Fusión de forja (Fase 3):** dos cartas de etiquetas distintas se funden en una híbrida (Chispa + Esquirla = Chispa de vapor) que cuenta como ambas etiquetas. Muy potente, por eso cuesta una parte de jefe.
- **Desmontar:** devuelve el 70 % de las partes invertidas (sin Brasas) y deja volver a rango anterior. Así no se castiga probar builds. El primer rediseño del día es gratis.
- **Anti-grind:**
  1. Cualquier receta pide como máximo 3 tipos de parte y su coste total se pensó para completarse en 1-2 runs de cacería.
  2. Trueque 3:1 de comunes por cualquier otra común.
  3. Las Brasas (moneda de forja) = 20 % de la Ceniza sobrante de la run, más 15 por minuto sobrevivido.
  4. Primer set completo en unas 5 runs (~1 h). Contenido de rango V es para quien quiera, no obligatorio para ganar.

## 4. Build en la base

- **Colección (inventario):** todas las cartas que has forjado, con su rango. La oferta de subida en la run solo muestra cartas de tu colección (así forjar amplía las ofertas y es útil per se).
- **Mano de 5 slots en la run:** viene precargada con tus anclas (ver sección 5). Se conserva todo lo de hoy (fusión, reemplazo, descarte).
- **Loadouts guardados:** 3 al inicio (5 más tarde), con nombre y icono ("Tormenta tóxica"). Botón "Repetir".
- **Sets por etiqueta (el "armor set" de este juego):** reutiliza la Resonancia del GDD pero con habilidad de set. Cuentan las cartas de la mano final en la run. Se desbloquea al forjar el "Emblema" del set (parte rara de esa etiqueta + trofeo).

| Set | 3 cartas | 4+ cartas (habilidad de set) |
|---|---|---|
| Fuego | +25 % daño Fuego | "Pira": las quemaduras se propagan al morir |
| Hielo | +25 % daño Hielo | "Cripta": ralentizados mueren congelados <15 % vida |
| Rayo | +25 % daño Rayo | "Eco": cada 8.º rayo se repite solo |
| Veneno | +25 % daño Veneno | "Pandemia": veneno +1 stack al kill |
| Sangre | +25 % daño Sangre | "Sed": 3 kills = escudo de 10 HP |
| Acero | +25 % daño Acero | "Filo eterno": críticos reducen 0,3 s todos los cooldowns |

Tensión intencionada: set (3-4 de la misma etiqueta) vs combos (diversidad).
- **Gemas (opcional, Fase 3):** 1 hueco por carta de rango III+. Gemas de efecto pequeño ("+10 % área", "-8 % cd", "+2 HP por kill") hechas con partes. Sin gemas el juego es completo.
- **Talismán (1 hueco, Fase 2):** elige una Bendición pasiva: ej. "Fuego x2 de peso en las ofertas", "empieza con 40 Ceniza", "imán x1,5". Esto da control del sesgo de oferta sin romper el azar.

## 5. Integración con lo existente: dos alternativas

**A) "La run parte de tu build" (estilo MH puro).** La mano de 5 sale ya montada desde la base (cartas con su rango). Las subidas de nivel solo mejoran (Nv, fusión) o permiten cambiar un slot.
- Pros: la preparación es protagonista; builds reproducibles; sensación de cazador.
- Contras: mata buena parte del "mira qué mano me ha salido"; menos variedad entre runs; la oferta pierde sentido; riesgo de resolver el juego con una build meta; más pantallas de gestión.

**B) Híbrido recomendado: 2 anclas + 3 slots abiertos.** Entras con 2 cartas ancla de tu loadout (con rango) y el talismán. Los otros 3 slots se llenan en la run con subidas aleatorias, del pool de tu colección. El sesgo de sinergia (70 %), fusión, Ceniza, reroll y los 12 combos funcionan igual. La Resonancia/Set cuenta con la mano final.
- Pros: conserva el gancho del "una más" y el momento clip de combo; la preparación ya cambia la run (anclas = plan A y qué cartas pueden aparecer); alcance menor; se presta a MVP rápido.
- Contras: menos control que en A; hay que explicar bien "ancla" frente a "mano" (un solo texto en pantalla).

**Recomendación: B.** El gancho actual es la construcción emergente en la run; A lo sustituye y compite con un juego de gestión. B añade capas sin quitar la actual. Si en pruebas la preparación pesa poco, subir a 3 anclas es un único parámetro (`ANCHORS`).

Reglas de integración: Ceniza y reroll intactos (la Ceniza no se gasta en la base; el sobrante pasa a Brasas al 20 %). Rango no se acumula sin tope con el Nv de la run: Nv3 (x2,5) x Rango V (x1,32) ya es suficiente. Todo el escalado extra se compensa con "Peligro" (sección 6).

## 6. Meta-progresión y objetivos

- **Rangos de cazador (RC 1-10):** suben con encargos; desbloquean zonas, huecos de loadout y recetas épicas.
- **Encargos:** 3 en tablón (uno fácil, uno de objetivo, uno de condición: "gana sin Escudero vivo en 5:00"). Recompensan partes/Brasas.
- **Jefes mayores** (post-MVP): cada uno con su cola de materiales y 2-3 cartas épicas propias. Ideas: Reina Colmena (Veneno, cartas de enjambre), Coloso Fundido (Fuego/Acero), Heraldo del Vacío (Rayo). El Pastor sería el "jefe de rango 3".
- **Peligro I-V:** al ganar con una build, se desbloquea el siguiente: +25 % HP enemiga y +20 % drops por nivel, más una regla (ej. Peligro III: enjambre con Escudos adicionales). Rango V solo sirve para quien quiera reto, gran fuente de rarezas.

## 7. Riesgos y mitigaciones

| Riesgo | Mitigación |
|---|---|
| Grind excesivo | Costes en 3 tipos de parte máximo, pity, trueque 3:1, encargos dirigidos, nada caduca |
| Pierde gracia del "una más" | Mantener 3 de 5 slots abiertos; un botón "Salir ya" desde el botín; el resumen final enseña la mano y el botín juntos |
| Complejidad en móvil (a futuro) | Base en una sola pantalla con 3 pestañas (Cartas, Forja, Loadout), recetas con botón "Mejorar" autoseleccionando materiales; loadout en 1 toque |
| Build meta que mata la variedad | Techo de rango limitado (+32 %), sets con tensión vs combos, Peligro como contrapeso |
| Se rompe el balance con recursos persistentes | Variable `G.B.meta` única; test con `?god=1&speed=4` y runs de "cuenta vacía" |

## 8. Alcance MVP por fases

**Fase 1 (3-4 días, núcleo mínimo):**
- Sí: guardado en `localStorage`; 8 partes (una por cada uno de 8 tipos de enemigo) con drop 30 % y pantalla de botín; pantalla de Base de 1 página (colección de las 26 cartas, bloqueadas/desbloqueadas, mejora de Rango I-III con 2 recetas por carta, elegir 2 anclas); "Salir" que carga la mano con las anclas; Brasas desde Ceniza sobrante.
- No: sets, gemas, talismán, desmontar, partir partes, encargos/zonas, jefes mayores, fusión de forja, Peligro.

**Fase 2 (3 días):** partes raras y pity, élites con umbrales, 3 loadouts, desmontar, Talismán, Emblemas y Sets.
**Fase 3 (4-5 días):** encargos y Rangos de cazador, gemas, cartas híbridas, Peligro I-III, primer jefe mayor.

**Se reutiliza del código:** `Cards.defs` (catálogo y etiquetas), `Cards.add`/`pool()` (filtrar por colección), `Cards.reset` (precarga de anclas), `Cards.snapshot` y la pantalla de fin (mano final + botín), `Cards.drawCard/slotRect` (la Base dibuja cartas con el mismo código), `LV` de `weapons.js` (multiplicador de rango como factor extra), tablas `B.enemy` con `xp`/`ash` (añadir `drop`), el "enemigo protagonista" de `waves.js` (encargo objetivo), `?t=` y `?god=` para pruebas. Nuevo: capa de guardado, pantalla Base, tabla de recetas, hook de drop en la muerte de enemigo, pantalla de botín.

## 9. Preguntas para el dueño

1. **Alternativa:** ¿prefieres A (la run parte de tu build completa) o B (2 anclas + 3 slots aleatorios)? Mi recomendación es B; A es una elección legítima si buscas un MH más puro y menos roguelite.
2. **Duración y ritmo del farmeo:** ¿mantenemos la run de 9 min o añadimos una "Cacería corta" de 5 min con objetivo? ¿Cuánta hora de juego esperas para la primera build completa (propuesta: ~1 h)?
3. **Plataforma y alcance:** ¿Fase 1 (3-4 días) con un solo jefe y guardado local es suficiente para validar, o quieres desde el inicio sets y encargos? ¿Y se piensa en móvil, que obliga a simplificar la Base ya?
