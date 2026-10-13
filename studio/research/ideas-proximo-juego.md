# Ideas para el próximo juego (HTML5/JS, MVP 1-2 semanas)

Contexto: ya lanzamos Ember Flock (roguelite de oleadas). Tenemos generador procedural de sprites/VFX/audio (`games/survival-lamb/src/assets.js`, ver `studio/docs/asset-generator.md`). Referencias de mercado y fuentes en `viral-games-2026.md`. Escala del riesgo: B/M/A.

## Ranking

| # | Propuesta | Encaje con evidencia | Alcance MVP | Riesgo | Puntuación |
|---|---|---|---|---|---|
| 1 | Orbit Breaker (breakout roguelite) | Ball x Pit >2 M | Muy viable | M (saturación leve) | 9 |
| 2 | Debt Slot (tragaperras de deuda, ficticia) | CloverPit >1 M, Balatro | Muy viable | M (gambling) | 8,5 |
| 3 | Pachinko Pit (pinball de orbes) | Peglin, Ball x Pit | Viable | M | 8 |
| 4 | Card Swarm (survivors con cartas) | Vampire Crawlers 1 M | Viable | M | 7,5 |
| 5 | Pixel Pop (sort/shoot pixel art) | Pixel Flow >100 M USD | Viable, mucho contenido | A (niveles y UA) | 7 |
| 6 | Ash Idle (incremental con prestigio) | Idles Steam 2025 | Muy viable | M (nicho) | 7 |
| 7 | Hex Lines (puzzle de bloques con giro) | Block Blast | Viable | A (mercado dominado) | 6 |
| 8 | Flock Garden (cultivo/rebaño con temporizadores) | Grow a Garden | Viable | A (sin comunidad) | 5,5 |

---

## 1. Orbit Breaker (nombre de trabajo)
- **Pitch:** lanza orbes mágicos desde tu santuario, rebotando contra oleadas de monstruos que descienden; fusiona orbes para crear combos imposibles.
- **Core loop:** disparar (apuntar con ratón/dedo) -> rebotes dañan -> XP -> elegir 1 de 3 orbes/mejoras -> fusiones -> jefe cada 5 niveles -> run termina -> monedas para el santuario (meta).
- **Qué lo hace adictivo:** recompensa variable en cada elección; fusiones tipo "receta"; números que suben; rebotes caóticos fáciles de ver en clip; run de 10-15 min.
- **Referencias:** Ball x Pit (https://www.kitguru.net/gaming/mustafa-mahmoud/ball-x-pit-sells-1-million-copies-as-future-updates-officially-confirmed/), Peglin, Brick Breaker clásicos.
- **MVP 1-2 semanas:** 1 arena, 12-15 orbes con 4 efectos base (fuego, hielo, rayo, explosión) y 6 fusiones, 6 enemigos + 1 jefe, 25 mejoras, meta-tienda de 8 mejoras, ratón/táctil, pantalla de resumen compartible.
- **Riesgo:** M. Ball x Pit ya domina el concepto; el giro debe ser claro (tema, fusión de orbes, o ligarlo a Ember Flock como universo).
- **Arte procedural:** orbes brillantes generados con shading automático, partículas de rebote, enemigos simples (slimes, espectros); audio por capas con tono que sube en cada rebote (combo).

## 2. Debt Slot
- **Pitch:** una tragaperras maldita en una celda: gira para pagar deudas cada vez mayores usando amuletos que cambian las probabilidades (sin dinero real).
- **Core loop:** girar -> símbolos/combos pagan fichas -> comprar amuletos -> pagar la deuda antes del plazo -> subir de nivel de deuda -> run termina al fallar.
- **Adictivo:** RNG con control parcial (el jugador ajusta odds), sinergias de amuletos, tensión de plazo, sonidos de máquina.
- **Referencias:** CloverPit (https://www.gamedeveloper.com/business/slot-machine-roguelite-cloverpit-tops-1-million-sales), Balatro (https://www.gematsu.com/2025/01/balatro-sales-top-five-million).
- **MVP:** 5 rodillos/3 filas, 10 símbolos, 20 amuletos, 8 plazos de deuda, 1 jefe "acreedor", guardado local, sesión de 15-20 min.
- **Riesgo:** M. Sensibilidad de gambling (usar fichas ficticias, sin monetización de azar, evitar tiendas reales) y comparación con CloverPit; la atmósfera/tema debe diferenciarla. Bajo riesgo técnico.
- **Arte procedural:** UI de máquina dibujada por código, símbolos sencillos, luces y chispas, audio de rodillos y campanas.

## 3. Pachinko Pit
- **Pitch:** suelta bolas en un tablero de clavijas; los enemigos del fondo caen cuando aciertas combos de clavijas.
- **Loop:** soltar bola -> rebotar -> golpear clavijas y enemigos -> botín -> elegir reliquias -> siguiente tablero.
- **Adictivo:** previsibilidad parcial (físicas), suspense en cada bola, reliquias que modifican clavijas.
- **Referencias:** Peglin (https://turnbasedlovers.com/news/roguelite-peglin-bounces-to-playstation-and-xbox-on-may/).
- **MVP:** física con Matter.js, 3 tableros, 15 reliquias, 10 enemigos.
- **Riesgo:** M (Peglin existe; nicho más pequeño que breakout). **Arte:** clavijas y bolas procedurales, efectos de golpe y sonidos con tono variable.

## 4. Card Swarm
- **Pitch:** survivors donde tus mejoras son cartas que se combinan y juegas mientras el enjambre te acecha.
- **Loop:** moverse -> matar -> XP -> elegir carta -> combinar cartas en mazo-build -> jefe.
- **Referencias:** Vampire Crawlers (https://www.shacknews.com/article/148938/vampire-crawlers-one-million-one-week), Balatro. **MVP:** reutilizar el motor de Ember Flock; 30 cartas, 5 enemigos, 1 jefe.
- **Riesgo:** M (más cercano a lo que ya hicimos, riesgo de ser "otro Ember Flock"). **Arte:** cartas con marcos generados + sprites existentes.

## 5. Pixel Pop
- **Pitch:** ordena una cola de cañones de colores para "pintar" una imagen de pixel art destruyendo sus cuadros.
- **Loop:** planear orden -> disparan automático -> imagen aparece -> siguiente nivel; anuncios rewarded para pistas.
- **Referencias:** Pixel Flow (https://mobilegamer.biz/data-digest-pixel-flow-hits-100m-mays-top-games-neverness-to-everness-pokemon-go-more/).
- **MVP:** 30 niveles generados proceduralmente a partir de nuestro generador de sprites, 1 modo, mecánica de cola.
- **Riesgo:** A. Diseño de niveles y UA/distribución; la competencia móvil es fuerte. **Arte:** ideal, el generador crea las imágenes meta.

## 6. Ash Idle
- **Pitch:** reaviva una hoguera, automatiza cenizas, prestigia y desbloquea capas.
- **Loop:** clic/automatización -> números -> mejoras -> prestigio -> nuevo recurso -> capas.
- **Referencias:** idles Steam 2025 (https://appmagic.rocks/research/idle-steam-games-2026). **MVP:** 3 capas de prestigio, 25 mejoras, progreso offline.
- **Riesgo:** M. Se hace rápido, pero retención requiere profundidad; difícil destacar. **Arte:** efectos de fuego procedural, UI minimalista.

## 7. Hex Lines
- **Pitch:** puzzle de piezas sobre cuadrícula hexagonal con combos por líneas y reliquias roguelite entre rondas.
- **Referencias:** Block Blast (https://www.deconstructoroffun.com/blog/2026/1/19/from-tetris-to-block-blast-why-block-puzzles-never-stop-printing). **MVP:** tablero, 15 piezas, combos, mejoras entre partidas.
- **Riesgo:** A (mercado dominado, monetización por ads necesita volumen). **Arte:** fácil con formas y brillo procedural.

## 8. Flock Garden
- **Pitch:** cuida un pequeño rebaño y un huerto que crece en tiempo real, con eventos de tiempo limitado.
- **Referencias:** Grow a Garden (https://www.pocketgamer.biz/robloxs-grow-a-garden-hits-industry-record-213m-concurrent-users-surpassing-pubg-fortnite-and-more/). **MVP:** 10 cultivos, mercado, mascotas, temporizadores.
- **Riesgo:** A. El motor del éxito original era social y Roblox; en solitario en web la retención es débil. **Arte:** sprites de plantas procedurales.

---

## Recomendación top 3
1. **Orbit Breaker.** Mejor ratio evidencia/viabilidad: el género de Ball x Pit tiene demanda probada (>2 M), la física es sencilla en canvas, aprovecha nuestra experiencia en roguelite y el generador de VFX (partículas, audio por tono). Diferenciar con tema y fusiones; ligarlo a la lore de Ember Flock para cross-promo.
2. **Debt Slot.** Concepto de una frase potente y alcance pequeño, con tensión de plazos; cuidado con el diseño ético (fichas ficticias) y mucho "juice" de sonido. Alta probabilidad de clips.
3. **Pachinko Pit** (alternativa Card Swarm si se prefiere reutilizar motor). Comparte la base física de Orbit Breaker: si se hace el #1 se puede derivar como segundo juego. Si el dueño quiere minimizar riesgo técnico, elegir Card Swarm.

Siguiente paso sugerido: el game-designer escribe un GDD de una página de la #1 y la #2, y se hace un prototipo jugable de 2 días de cada una para probar el "feel" antes de comprometer las 2 semanas. Antes de elegir, confirmar con datos (wishlist/clips) en un prototipo web en itch.io.
