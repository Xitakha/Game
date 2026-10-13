# Juegos virales y adictivos 2024-2026 (estudio de mercado)

Fecha del estudio: 2026-10-13. Autor: market-researcher.
Convención: **[V]** = dato con fuente citada (muchas son cifras del desarrollador o de trackers como AppMagic/Gamalytic/VGI, es decir estimaciones salvo que se diga "oficial"). **[S]** = suposición/análisis mío del loop (basado en conocimiento del género, no en una fuente concreta). Las cifras de terceros pueden variar entre trackers; donde hay conflicto se indica.

## Tabla comparativa

| # | Juego | Plataforma / género | Evidencia de viralidad | Replicabilidad HTML5 (equipo pequeño) |
|---|---|---|---|---|
| 1 | Balatro | PC/móvil, roguelite de póker | >5 M ventas (ene 2025, oficial) | Media |
| 2 | Megabonk | PC, survivors 3D | 1 M en 2 semanas; pico 82k-117k CCU | Media-baja (3D) / Alta en 2D |
| 3 | Ball x Pit | PC/consolas, brick-breaker roguelite | 1 M (dic 2025), >2 M (ago 2026) | Alta |
| 4 | Vampire Crawlers (+ familia Vampire Survivors/Brotato/Halls of Torment) | PC, deckbuilder / survivors | ~1 M en una semana (dev, abr 2026) | Alta (survivors) / Media (cartas) |
| 5 | CloverPit | PC, slot-machine roguelite | >1 M en ~2 meses | Alta |
| 6 | Schedule I | PC, sim de negocio ilegal (co-op) | Estimado 6-12 M copias; 414k CCU | Baja |
| 7 | Bongo Cat | PC, idle/overlay | Top 5 Steam por jugadores activos | Media (el exito no se monetiza) |
| 8 | Block Blast! | Móvil, puzzle de bloques | Nº1 descargas mundial 2025 (AppMagic); 300 M MAU (claim) | Alta |
| 9 | Pixel Flow | Móvil, hybrid-casual sort/puzzle | >100 M USD IAP; juego del año Pocket Gamer 2026 | Media-alta |
| 10 | Gossip Harbor | Móvil, merge + historia | ~677 M USD de por vida (est.), top merge | Baja (contenido + UA) |
| 11 | Grow a Garden | Roblox, idle/cultivo | 21-22 M CCU récord | Media (loop) / Baja (social/Roblox) |
| 12 | Bloxd.io | Navegador, voxel multijugador | 4,36 M visitas en mar 2026 | Baja (multijugador) |
| 13 | Peglin | PC/consolas, pachinko roguelite | Indie World ago 2024; sin cifra de ventas | Alta |
| 14 | Idle Steam 2025 (IdleOn, Revolution Idle, Ball x Pit en listas idle) | PC, incrementales | IdleOn >22 M USD 2025 (est.); Revolution Idle 2 M+ jugadores | Alta |

---

## Fichas

### 1. Balatro (LocalThunk / Playstack, 2024)
- **Qué es:** roguelite de póker: formas manos para superar una puntuación objetivo en un número limitado de manos/descartes, con comodines que rompen las reglas.
- **Por qué fue viral [V]:** más de 5 M de ventas en enero 2025 y >1 M en el primer mes; 98 % reseñas positivas (197k); versión móvil con >9 M USD en IAP a ene 2025. https://www.gematsu.com/2025/01/balatro-sales-top-five-million , https://statista.com/statistics/1546856/balatro-global-unit-sales . [S] Clips de "builds rotos" con números enormes: muy compartible.
- **Core loop [S]:** elegir cartas/descartar -> puntuar (fichas x multiplicador) -> ganar dinero -> tienda (comodines, mejoras) -> ante más difícil.
- **Mecánicas clave [S]:** comodines con reglas que se combinan, multiplicadores exponenciales, economía de interés, jefes con restricciones.
- **Retención [S]:** descubrir sinergias, desbloqueos, "una ronda más", dificultad por stakes.
- **Sesión:** 20-40 min por run [S].
- **Monetización:** premium (PC/consola); móvil de pago/IAP [V parcial].
- **Replicabilidad HTML5: MEDIA.** Código simple (cartas, DOM/canvas) y mucho diseño de contenido (decenas de comodines equilibrados). El riesgo es el balance y la sensación de "juice".

### 2. Megabonk (Vedinad, sep 2025)
- **Qué es:** survivors en 3D con salto, deslizamiento y estética low-poly retro.
- **Viral [V]:** 1 M copias en ~2 semanas (dev), VGI estima ~1,3 M; pico de 117k CCU (VGI) / 82k según otra nota; creador en solitario; boca a boca y streaming. https://gameworldobserver.com/2025/10/03/megabonk-is-a-new-indie-hit-on-steam-the-games-sales-have-surpassed-one-million-copies , https://www.thegamer.com/megabonk-peak-player-count-steam-rival-hades-2-double-balatro/ . La afirmación de TikTok no está confirmada en las fuentes.
- **Core loop [S]:** moverse y saltar en mapa -> armas automáticas matan -> XP -> elegir mejora -> cofres/botines -> jefe final -> meta-desbloqueos.
- **Mecánicas [S]:** movimiento expresivo (slide-jump), builds con sinergias, "romper el juego" visual.
- **Retención [S]:** meta-progresión de personajes/armas, builds locas, clips.
- **Sesión:** 15-25 min [S]. **Monetización:** premium barato.
- **Replicabilidad: MEDIA-BAJA en 3D, ALTA si se hace 2D** (nosotros ya tenemos Ember Flock y un generador de sprites).

### 3. Ball x Pit (Kenny Sun / Devolver, oct 2025)
- **Qué es:** mezcla de breakout/Arkanoid con roguelite y construcción de base.
- **Viral [V]:** >300k en 5 días, 1 M en dic 2025 (Devolver), >2 M según nota ago 2026 (fecha aproximada). https://www.kitguru.net/gaming/mustafa-mahmoud/ball-x-pit-sells-1-million-copies-as-future-updates-officially-confirmed/ , https://www.pushsquare.com/news/2026/08/devolvers-brilliant-roguelite-dopamine-factory-ball-x-pit-is-a-smash-hit-at-2-million-sales
- **Core loop:** lanzar bolas que rebotan y dañan a enemigos que avanzan -> XP -> elegir/fusionar bolas (60+) -> jefe -> construir base entre runs. Ciclo [V parcial].
- **Mecánicas [S]:** bolas con efectos (fuego, veneno, explosión) y fusiones, caos de rebotes, "números que suben".
- **Retención:** fusiones, personajes, base como meta. **Sesión:** 15-25 min [S]. **Monetización:** premium.
- **Replicabilidad: ALTA.** Física de rebotes 2D trivial en canvas; el trabajo es el catálogo de bolas y efectos. Mejor candidato a emular.

### 4. Familia Vampire Survivors: Vampire Crawlers, Brotato, Halls of Torment
- **Qué es:** survivors (auto-ataque, mover para esquivar, enjambre de enemigos, build exponencial). Vampire Crawlers (abr 2026) es un spin-off de cartas/dungeon crawler.
- **Viral [V]:** Vampire Crawlers ~1 M en la primera semana (dev, todas las plataformas; Raijin estima 521k solo en Steam). https://www.shacknews.com/article/148938/vampire-crawlers-one-million-one-week , https://www.vgchartz.com/article/467659/vampire-crawlers-debuts-on-the-steam-charts/ . Halls of Torment >1 M ventas https://www.tweaktown.com/news/107495/vampire-survivors-like-halls-of-torment-breaks-1-million-sales-coming-to-playstation-and-xbox/index.html . Brotato "10 M" solo en una guía secundaria: no verificado. El género tiene su propia página de Wikipedia https://en.wikipedia.org/wiki/Vampire_Survivors%E2%80%93like . Señal de saturación: "Peak Roguelite" https://spawnpointmarketing.substack.com/p/roguelite-fatigue-is-brewing-on-the
- **Core loop [S]:** matar -> gemas XP -> subir nivel -> elegir 1 de 3 mejoras -> pantalla llena de efectos -> jefe/tiempo -> oro para meta-mejoras.
- **Retención [S]:** evoluciones de armas, desbloqueo de personajes, runs cortas.
- **Monetización:** premium + DLC (PC); freemium en móvil.
- **Replicabilidad: ALTA.** Es literalmente el género de Ember Flock; el riesgo es la saturación y diferenciarse.

### 5. CloverPit (Panik Arcade, sep 2025)
- **Qué es:** estás encerrado en una celda con una máquina tragaperras y un cajero; hay que pagar deudas crecientes con plazos.
- **Viral [V]:** 500k en 8 días, >1 M en ~2 meses; top 10 global de Steam; pico >20k CCU; llegó a Game Pass. https://www.pcgamer.com/games/roguelike/slot-machine-roguelike-cloverpit-sells-1-million-copies-and-its-developer-celebrates-the-payout-by-adding-its-most-requested-feature-yet/ , https://www.gamedeveloper.com/business/slot-machine-roguelite-cloverpit-tops-1-million-sales . Etiqueta de marketing: "hijo de Balatro y Buckshot Roulette".
- **Core loop:** tirar de la palanca -> ver símbolos/combos -> monedas -> comprar amuletos que alteran probabilidades -> pagar la deuda antes del plazo [V parcial].
- **Mecánicas [S]:** probabilidades manipulables, charms, tensión del plazo y atmósfera de horror.
- **Retención:** build de amuletos, desbloqueos, dificultad. **Sesión:** 20-40 min [S]. **Monetización:** premium.
- **Replicabilidad: ALTA** en mecánica (RNG + UI); la atmósfera es el diferenciador y el generador procedural puede cubrirlo. Ojo con la percepción de "gambling".

### 6. Schedule I (TVGS, mar 2025)
- **Qué es:** simulador de imperio de drogas ("Breaking Bad"-like), 1-4 jugadores, en acceso anticipado.
- **Viral [V]:** 414k de pico en el primer fin de semana; estimaciones de 6,3-11,7 M copias y ~154 M USD (Gamalytic, no oficial); impulsado por Twitch y TikTok. https://en.wikipedia.org/wiki/Schedule_I_(video_game) , https://gamalytic.com/game/3164500 , https://www.thegamer.com/schedule-1-tiktok-streamer/
- **Loop [S]:** producir -> vender -> reinvertir -> ampliar -> evitar policía/rivales; co-op caótico.
- **Replicabilidad: BAJA** (3D, escala, co-op). Lección: el tema y el humor "streameable".

### 7. Bongo Cat (Irox Games, mar 2025)
- **Qué es:** gato en el escritorio que reacciona a tus teclas y clics; drops aleatorios cada 30 min que se venden en el Mercado de Steam.
- **Viral [V]:** top 5 de Steam por jugadores activos (>150k CCU); posible parte de bots (dato secundario). Ingresos del dev: ~2-4 k USD/mes netos; lo usan como marketing para su siguiente juego (Oku). https://www.xda-developers.com/bongo-cat-taking-over-steam/ , https://www.gamespot.com/articles/viral-steam-hit-bongo-cat-doesnt-actually-make-any-money/1100-6532777/
- **Lección:** "jugar" pasivo + drops temporizados = gran retención de métrica, pero poco dinero.
- **Replicabilidad: MEDIA** técnicamente trivial; no es un buen modelo de negocio salvo como embudo.

### 8. Block Blast! (Hungry Studio, 2023-2025)
- **Qué es:** puzzle de colocar piezas en un tablero 8x8 y limpiar líneas, sin límite de tiempo.
- **Viral [V]:** AppMagic: nº 1 en descargas mundiales de 2025; la empresa dice 70 M DAU / 300 M MAU (no verificado); terceros estiman 54-104 M MAU en 2026; ha bajado desde su pico. https://www.pocketgamer.biz/block-blast-reaches-70m-daily-active-users-and-300m-monthly-active-users-worldwide/ , https://www.deconstructoroffun.com/blog/2026/1/19/from-tetris-to-block-blast-why-block-puzzles-never-stop-printing
- **Core loop:** recibir 3 piezas -> colocarlas -> limpiar filas/columnas -> combos -> puntuación récord; muerte cuando no cabe.
- **Retención [S]:** récord personal, combos/rachas, sin presión de tiempo, sesiones de 1-3 min.
- **Monetización [V parcial]:** principalmente anuncios (intersticiales + un rewarded). Ahora hay versión sin anuncios en Apple Arcade.
- **Replicabilidad: ALTA** como juego; la distribución (UA) es lo difícil. El nicho está dominado.

### 9. Pixel Flow (Loom Games, ago 2025)
- **Qué es:** hybrid-casual de "sort/puzzle": cola de tiradores de colores que disparan a un cuadro de pixel art, hay que ordenar la cola para eliminar todos los píxeles.
- **Viral [V]:** >100 M USD IAP (AppMagic); ~200 M USD de gasto bruto en el primer año (est.); >30 M descargas; Scopely compra la mayoría de Loom (>1.000 M USD de valoración); Juego del Año Pocket Gamer 2026; clones (Color Pixel Shooter ~140k USD/día). https://mobilegamer.biz/data-digest-pixel-flow-hits-100m-mays-top-games-neverness-to-everness-pokemon-go-more/ , https://www.pocketgamer.biz/pixel-flow-wins-game-of-the-year-at-the-pocket-gamer-mobile-games-awards-2026/ , https://www.deconstructoroffun.com/blog/2026/2/13/pixel-flow-the-publishers-dream
- **Loop [S]:** planificar orden -> dispara automático -> ver emerger pixel art -> siguiente nivel; satisfacción ASMR, puzzle de planificación con límite de espacio.
- **Monetización [V]:** IAP + anuncios (30-40 % ingresos por ads, DoF).
- **Replicabilidad: MEDIA-ALTA** (mecánica sencilla; hay que producir muchos niveles con arte pixel, que nuestro generador puede ayudar a crear). El riesgo es el diseño de niveles y UA.

### 10. Gossip Harbor: Merge & Story (Microfun, 2024-2026)
- **Qué es:** merge-2 con narrativa y decoración.
- **Viral/éxito [V]:** nº 1 en merge desde oct 2024; >100 M USD netos/mes en mar 2026; ~677 M USD por vida (est.); el género merge hizo 1.300 M USD en H1 2026 (+74 %). https://www.blog.udonis.co/mobile-marketing/mobile-games/gossip-harbor , https://segwise.ai/blog/gossip-harbor-creative-strategy-analysis
- **Loop [S]:** fusionar objetos -> completar pedidos -> energía -> avanzar historia/decoración. **Monetización:** IAP de energía/gemas + anuncios.
- **Replicabilidad: BAJA** como producto completo (live-ops, contenido infinito, UA millonaria). Se puede hacer un mini-merge, no competir.

### 11. Grow a Garden (Roblox, 2025)
- **Qué es:** cultivar plantas que crecen con el tiempo, vender cosechas, comprar semillas raras; eventos y mascotas.
- **Viral [V]:** récord de 21,3-21,9 M de jugadores simultáneos (jun-jul 2025); hay confusión de fuentes con un 22,3 M que puede ser de Steal a Brainrot. https://www.pocketgamer.biz/robloxs-grow-a-garden-hits-industry-record-213m-concurrent-users-surpassing-pubg-fortnite-and-more/ , https://www.notebookcheck.net/Roblox-achieves-record-breaking-47-4-million-concurrent-players-in-August-despite-recent-legal-controversies.1096346.0.html
- **Loop [S]:** plantar -> esperar (minutos reales) -> cosechar -> vender -> mejoras/semillas raras -> eventos de tiempo limitado. Temporizadores + rareza + FOMO + componente social (trading, regalos).
- **Monetización [S]:** Robux (aceleradores, pases), eventos.
- **Replicabilidad: MEDIA** el loop; BAJA la parte social/distribución.

### 12. Bloxd.io (navegador)
- **Qué es:** mundos voxel multijugador gratis en el navegador (minijuegos tipo Minecraft).
- **Evidencia [V débil]:** 4,36 M visitas en mar 2026 (Similarweb vía blog), >8 M cuentas, ~27k pico simultáneo (WebGameDB). Fuentes de tipo SEO: baja confianza. https://news.viverse.com/post/bloxd-io-free-browser-game-on-viverse . No encontré datos verificables de Poki/CrazyGames ni otro breakout io 2025-26. One Million Checkboxes (2024) es un caso viral web simple: https://en.wikipedia.org/wiki/One_Million_Checkboxes
- **Replicabilidad: BAJA** (servidores, moderación, comunidad). Como contraste: lo que sí es replicable es el formato "juego web sin fricción, un clic y juegas".

### 13. Peglin (Red Nexus Games, 1.0 en 2024)
- **Qué es:** pachinko/Peggle roguelite: lanzas orbes contra clavijas y enemigos. Salió en consolas en 2025.
- **Evidencia [V]:** destacado en Indie World (ago 2024), PS/Xbox en mayo 2025; no hay cifra pública de ventas en lo que encontré. https://turnbasedlovers.com/news/roguelite-peglin-bounces-to-playstation-and-xbox/ (Es un ejemplo de mecánica "física + build".)
- **Replicabilidad: ALTA** (física Matter.js/Phaser), variante cercana a Ball x Pit.

### 14. Idles en Steam 2025 (IdleOn, Revolution Idle, Spirit City, etc.)
- **Evidencia [V]:** según AppMagic, IdleOn (MMO incremental F2P) generó >22 M USD en 2025; Spirit City y Cast n Chill >5,3 M USD; The Farmer Was Replaced >4,5 M; Revolution Idle 2 M+ jugadores (página de Steam). https://appmagic.rocks/research/idle-steam-games-2026 , https://store.steampowered.com/app/2763740/Revolution_Idle/ . El género crece: 16 idle con >1.000 reseñas en 2024 y 12 solo en la primera mitad de 2025 (https://howtomarketagame.com/2025/08/04/2025-q2-games-that-are-selling/ ).
- **Loop [S]:** automatizar -> números exponenciales -> prestigio/reset con bonus permanente -> nuevas capas. Retención por progreso offline.
- **Replicabilidad: ALTA** (todo es UI y matemáticas), pero el éxito real depende de profundidad de capas de prestigio y de la comunidad.

---

## Lectura de mercado (resumen)
- 2025-26 premió la **mezcla de un género conocido con un gancho nuevo** (Balatro = póker + roguelite; CloverPit = tragaperras + deuda; Ball x Pit = breakout + roguelite + base; Vampire Crawlers = survivors + cartas).
- Móvil: ganan los **puzles hybrid-casual y merge** por monetización con anuncios e IAP, pero requieren UA grande; el mercado de descargas cae (-12 % en H1 2026 según Sensor Tower vía Singular, https://www.singular.net/blog/top-mobile-games/ ).
- Hay señales de **saturación roguelite** (https://spawnpointmarketing.substack.com/p/roguelite-fatigue-is-brewing-on-the ): diferenciación temática y gancho de 1 frase son clave.
- Datos no encontrados/no verificados: Brotato 10 M (solo fuente secundaria), 3 M de Slay the Spire 2 en una semana, datos de Poki/CrazyGames, y números de Archero 2/Survivor.io.

## Fuentes principales
Todas citadas en línea arriba; las de ventas son anuncios del desarrollador o estimaciones de trackers (VGI, Gamalytic, AppMagic, Raijin). Consultadas en 2026-10-13.
