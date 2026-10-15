# Patrones de loops adictivos y errores a evitar

Basado en `viral-games-2026.md`. Los patrones son análisis propio (marcados como tal) contrastado con los casos citados allí.

## Patrones comunes

1. **Concepto de una frase = género conocido + giro.** "Póker roguelite" (Balatro), "tragaperras + deuda" (CloverPit), "breakout + roguelite" (Ball x Pit). Se entiende en 5 s en un clip o en un tráiler. Los compradores lo describen como "X meets Y".
2. **Fricción mínima.** Una acción principal (apuntar, soltar, elegir). Run empieza en <10 s, sin tutoriales largos. Block Blast y los .io: un toque y juegas.
3. **Runs cortas y rejugables ("una más").** 1-3 min en móvil, 15-30 min en PC; la muerte enseña algo y el botón "Reintentar" está en pantalla.
4. **Recompensa variable.** Elegir 1 de 3 mejoras, drops raros (Bongo Cat, Grow a Garden), cofres, tiradas (CloverPit). El jugador no sabe qué saldrá, por eso mira la pantalla de elección.
5. **Números que explotan (power fantasy).** Multiplicadores (Balatro), enjambres (survivors), bolas que se fusionan (Ball x Pit). El pico emocional es el momento "me he roto el juego".
6. **Sinergias entre piezas.** El build emerge de combinar 2-3 elementos; da profundidad sin controles complejos y genera contenido compartible ("mira mi build").
7. **Progresión en dos capas.** Dentro de la run (nivel, mejoras) y entre runs (desbloqueos, base, prestigio). Siempre hay "algo que desbloquear pronto".
8. **Tensión con plazo o presión creciente.** Deudas con fecha (CloverPit), oleadas, límite de hueco (Block Blast, Pixel Flow). Crea decisiones y emoción.
9. **Clips compartibles / streameables.** Caos visual, reacciones, humor (Schedule I, Megabonk). Diseñar el momento "clip": un final de run espectacular, un resumen con captura, un build raro.
10. **Juice y sensación.** Screen shake medido, partículas, sonido por capas, números flotantes; en puzzle, ASMR (Pixel Flow). Nuestro generador procedural de VFX/audio encaja aquí.
11. **Precio/entrada bajos y partidas gratis en web.** Los hits PC son premium baratos con 1.0 pulido; en web/móvil, free con anuncios rewarded.
12. **Contenido vivo.** Actualizaciones gratuitas anunciadas (Ball x Pit, CloverPit hard mode) mantienen conversación y reseñas.
13. **Progreso pasivo / offline en idle.** Volver y ver números subir; temporizadores (Grow a Garden). Funciona para retención de DAU, no para ingresos por sí mismo (caso Bongo Cat).

## Qué hace falta para monetizar (resumen)
- PC: premium 5-20 USD, sin microtransacciones; el éxito viene de reseñas y streamers.
- Móvil/web: anuncios (intersticial + rewarded opcional), IAP de comodidad; requiere volumen o UA.
- Dato a tener en cuenta: virales sin dinero existen (Bongo Cat).

## Errores a evitar

| Error | Por qué duele |
|---|---|
| Copiar un hit 1:1 sin giro | Saturación (señales de "peak roguelite"); se pierde contra el original. |
| Run larga sin ritmo (>30 min en web) | El jugador web abandona; sin "una más". |
| Progresión sin variedad (solo +x % de daño) | Elecciones aburridas; hacen falta mejoras que cambien cómo juegas. |
| Mucho texto/tutorial antes de jugar | Se pierde al jugador en los primeros 30 s. |
| Dificultad injusta o picos de dificultad sin aviso | Frustración en vez de "casi lo logro". |
| Contenido insuficiente: 4-5 mejoras repetidas | La run 3 ya es la run 1. Mínimo ~25-30 opciones con sinergias en MVP. |
| Sin "momento clip" ni resumen compartible | Desperdicia el canal viral gratis. |
| Ignorar los primeros 10 s y el feedback (sonido, shake, números) | Se siente barato; el juice es la mitad de la adicción. |
| Gambling real o estética demasiado cercana | Riesgo de plataformas/edad; usar fichas ficticias, sin dinero real. |
| Multijugador/servidores para un estudio pequeño | Coste, moderación y masa crítica; evitar. |
| Alcance de 3D o live-ops (merge, 4X) | Los éxitos móviles en esa categoría dependen de equipos grandes y UA. |
| Balance sin telemetría | Sin datos de qué elige la gente no se puede afinar; añadir log simple de elecciones y causas de muerte. |

## Aplicación a nuestro estudio
- Aprovechar: arte/VFX/audio procedural, combate por oleadas (Ember Flock), sesiones cortas en navegador.
- Probar el giro en 1 frase antes de programar: si no cabe en una frase, no es viral.
- Diseñar "pantalla de fin de run" con captura/cadena de build para compartir.
