# SPEC T-F1-01: analítica anónima con aviso de privacidad (diseño)

Estado: **borrador 2, solo diseño (decisiones del dueño del 2026-11-14 incorporadas)**. Autor: `monetization-analyst`. Implementa: `programmer`. Fecha: 2026-11-14.
No se ha tocado el código del juego. Las referencias `archivo:línea` son de `games/card-swarm/` en la rama `claude/serene-pascal-bsxbz3` a esta fecha.

Decisión del dueño que enmarca esta spec (PLAN-MAESTRO, "Decisiones del dueño", fila 9 y fila 12): analítica **anónima, con envío a un servicio y aviso de privacidad**. Las cuentas las crea y las tiene el dueño; el estudio asesora y **nunca** guarda credenciales en el repositorio ni en el chat.

**Esto no es asesoría jurídica.** Todo lo que toca RGPD, ePrivacy (cookies y almacenamiento en el dispositivo), menores y textos legales debe revisarlo un profesional antes de activar el envío.

---

## Decisiones del dueño (2026-11-14)

Respuestas a las 5 preguntas de la sección 8 y cambios que provocan en esta spec:

| # | Pregunta | Decisión | Qué cambia |
|---|---|---|---|
| 1 | Servicio | **PostHog Cloud, región UE, por API directa** (lo recomendado) | Adaptador `posthog`; Umami queda solo como respaldo documentado |
| 2 | Momento del aviso | **Al abrir el juego por primera vez, DESPUÉS de la cinemática de inicio** (no al volver de la primera expedición) | Sección 5.1 reescrita |
| 3 | Identificador | **Retención sin id de jugador** (lo recomendado) | Sin cambios: sección 3.1 tal cual |
| 4 | Destinos con envío | **Pages (incluida la PWA) e itch.io** | Sección 6.3: tabla de adaptadores por destino; portales sin terceros |
| 5 | Revisión legal | El dueño **no tiene a nadie**; pide que la haga el estudio | Hecha en `studio/docs/REVISION-PRIVACIDAD.md` (no es asesoría jurídica; recomienda revisión profesional igualmente) |

Datos aportados para la política: responsable en **Colombia**; nombre provisional **"Xitakha Studio" (pendiente de confirmar)**; correo como marcador `[CORREO DE CONTACTO]` hasta que el coordinador confirme que se puede publicar.

Cambios que trae la revisión de privacidad (pendientes de que el dueño los confirme, ver `REVISION-PRIVACIDAD.md`, sección 15):
- Botón "Acepto (tengo 18 años o más)": el umbral pasa de 14 a **18 años**, el más estricto (Colombia).
- **Filtro por zona horaria europea**: en esos dispositivos no se muestra el aviso ni se envía nada mientras no haya representante en la UE (RGPD art. 27).
- Antes del consentimiento **no se escribe nada de analítica en `localStorage`** (la cola previa va solo en memoria).
- Todos los eventos llevan `pv` (versión del aviso), como prueba del consentimiento.
- Ajustes muestra los ids de las últimas 10 sesiones (solo en local) para poder ejercer los derechos.
- Peticiones con `credentials: 'omit'` y `referrerPolicy: 'no-referrer'`; GeoIP desactivado en PostHog.

Los textos del aviso y de la política vigentes son los de `REVISION-PRIVACIDAD.md` (sección 11); los de la sección 5 de esta spec quedan como historial.

---

## 0. Resumen en 6 líneas

1. **Recomendación:** PostHog Cloud con alojamiento en la UE, usado **sin su librería** (envío directo por HTTP desde nuestra capa `G.Track`), con eventos anónimos. **Alternativa:** Umami Cloud (plan gratuito "Hobby").
2. **Nada sale del dispositivo hasta que el jugador pulsa "Aceptar"** en el aviso (opt-in con dos botones del mismo peso). Interruptor en Ajustes para retirarlo cuando quiera.
3. **No se envía ningún identificador persistente.** Solo un id de sesión aleatorio que vive en memoria. La retención D1/D7 se calcula con contadores locales (fecha de primera apertura y "día N") que viajan como propiedades del evento, no con un id de jugador.
4. Esquema mínimo de 16 eventos (sección 3), cada uno con la pregunta que responde.
5. En portales (Poki, CrazyGames) el adaptador es "portal" o "ninguno": **no** se envía nada a terceros allí (Poki bloquea las peticiones externas por defecto; ver 1.3).
6. Coste estimado: 0 € mientras el volumen quede dentro del nivel gratuito (estimación de volumen en 1.4).

---

## 1. Comparativa de servicios y enfoques

### 1.1 Cómo se verificó (léelo antes de fiarte de las cifras)

- Desde esta sesión **no se pudieron abrir** las webs oficiales de GoatCounter, Umami, CrazyGames, Poki ni la documentación de Cloudflare (los dominios no resuelven en la red permitida). Todo lo de abajo viene de **resúmenes del buscador** sobre esas páginas (marcado **[B]**), de páginas de terceros (**[T]**) o es **[N] no verificado**. Lo que viene de la web oficial vía buscador es lo más fiable, pero aun así **hay que confirmarlo** en la web oficial antes de activar el envío. Para hacerlo desde aquí habría que permitir en la configuración de red de la sesión: `umami.is`, `goatcounter.com`, `posthog.com`, `developers.cloudflare.com`, `docs.crazygames.com`, `sdk.poki.com`.
- Fecha de todas las consultas: 2026-11-14. Los precios cambian a menudo: **no se inventa ninguno**; donde las fuentes se contradicen, se dice.

### 1.2 Tabla comparativa

| | **A. PostHog Cloud UE** (API HTTP, sin librería) | **B. Umami Cloud** (Hobby) | **C. GoatCounter** (alojado) | **D. Endpoint propio** (Cloudflare Worker + almacenamiento) | **E. GameAnalytics** (SDK JS) |
|---|---|---|---|---|---|
| Eventos personalizados con propiedades | Sí, con propiedades libres [B] | Sí: "custom events" y "event properties" en todos los planes [B, docs.umami.is/docs/cloud] | Solo como "ruta" (el nombre del evento es la ruta); sin propiedades estructuradas [B] | Sí, lo que diseñemos | Sí, eventos de juego (progresión, diseño, recursos, error) [N detalle] |
| Embudos y retención ya hechos | Sí: embudos, retención, tableros (producto de "product analytics") [B] | Hay informes; si incluye embudos y retención en Hobby: [N] | No | No: hay que construir consultas y tablero | Sí, tableros de juego estándar [N detalle] |
| Nivel gratuito | 1 millón de eventos/mes de analítica de producto, sin tarjeta [B, posthog.com/faq]; después precio por evento que baja con el volumen [B, posthog.com/docs/product-analytics/pricing.md] | Gratis hasta 100.000 eventos/mes [T]; webs incluidas: **las fuentes se contradicen (1 o 3)** [T]; retención de datos 6 meses según una fuente [T]. Siguiente plan desde 20 $/mes [T] | Gratis para uso **no comercial**, financiado por donaciones [B, goatcounter.com]; precio comercial: **las fuentes se contradicen** (5 $, 9 $, 15 €/mes) [T] | Workers gratis: 100.000 peticiones/día [T, cita la doc. de límites]; D1 gratis: límites diarios de lecturas y escrituras [T]; **fechas de aplicación de límites contradictorias** en la propia doc. de Cloudflare [B] | Gratis [N condiciones actuales] |
| Cookies / almacenamiento en el navegador | Sin librería: **ninguno por su parte** (lo controla nuestro código). Su librería tiene modo sin cookies con hash diario en el servidor [B, posthog.com/docs/product-analytics/cookieless-tracking] | Se anuncia sin cookies [N: no se pudo leer la doc.] | Sin cookies ni localStorage [B, goatcounter.com/privacy] | Ninguno por su parte | El SDK genera un id de usuario propio y lo persiste [B, docs.gameanalytics.com] |
| IP | La recibe el servidor (inevitable en cualquier servicio). Opción de descartar la IP del cliente en ajustes del proyecto: [N] | [N] | [N] | La recibe el worker; podemos no guardarla nunca | [N] |
| Datos en la UE | Sí, región UE a elegir al crear la cuenta [B, posthog.com/faq]; terceros dicen Frankfurt (AWS eu-central-1) [T]. Empresa con sede en EE. UU. [T] | **No encontrado** dónde aloja Umami Cloud [N] | [N] | Red global de Cloudflare; localización garantizada en la UE: [N] | [N] |
| ¿Exige consentimiento (RGPD/ePrivacy)? | Con nuestro diseño (sin id persistente enviado), quizá no; **pero nuestro principio es pedirlo igualmente** (ver 1.5) | Igual que A | GoatCounter opina que "probablemente no" hace falta aviso [B, goatcounter.com/gdpr]; es su opinión, no una garantía | Igual que A | **Sí**: su política para desarrolladores exige pedir consentimiento al abrir el juego, antes de enviar nada, y permitir retirarlo en ajustes [B, gameanalytics.com/developer-policy] |
| Portales | Poki bloquea peticiones externas por defecto [B]; CrazyGames: sin regla encontrada sobre analítica de terceros [B] | Igual | Igual | Igual | **Es de los pocos que Poki puede aprobar caso a caso**, con política de privacidad publicada [B, sdk.poki.com/external-resources] |
| Sin conexión (cola y reenvío) | Lo hace nuestra cola; el envío por lotes encaja | Nuestra cola; si su API acepta lotes: [N] (probablemente un evento por petición) | Nuestra cola; un evento por petición | Nuestra cola, lotes a medida | El SDK tiene cola propia [N] |
| Peso en el juego | ~0 KB del proveedor; nuestro adaptador ~2-3 KB (estimación) | ~0 KB si usamos su API directa; su script, [N] | ~0 KB con el píxel `/count` [B, goatcounter.com/help/pixel] | ~0 KB en el cliente; el worker es aparte | SDK de terceros: tamaño [N] |
| CSP estricta | Sí: solo `connect-src` al host de ingesta UE | Sí: `connect-src` a su host | Sí: `img-src` o `connect-src` | Sí: `connect-src` a nuestro worker | Requiere `script-src` y `connect-src` de terceros (más superficie) |
| Trabajo del dueño | Crear cuenta y proyecto, copiar la clave pública | Crear cuenta y web, copiar el id de web | Crear cuenta, copiar el código del sitio | **El más alto**: cuenta Cloudflare, desplegar worker, base de datos, mantener consultas | Cuenta y juego; dos claves (una de ellas secreta: no debe ir al cliente) [N] |

Fuentes de la tabla (consultadas 2026-11-14, vía buscador):
- PostHog: https://posthog.com/faq · https://posthog.com/pricing · https://posthog.com/docs/product-analytics/pricing.md · https://posthog.com/docs/product-analytics/cookieless-tracking · https://posthog.com/docs/libraries/js/persistence · https://posthog.com/eu · terceros: https://europeanstack.pages.dev/software/posthog
- Umami: https://docs.umami.is/docs/cloud · https://umami.is/docs/cloud/faq · terceros: https://www.toolpick.dev/pricing/umami · https://comparetiers.com/tools/umami · https://freetier.co/directory/products/umami
- GoatCounter: https://goatcounter.com/ · https://www.goatcounter.com/gdpr · https://goatcounter.com/privacy · https://goatcounter.com/help/events · https://goatcounter.com/help/pixel · terceros: https://toolradar.com/tools/goatcounter/pricing
- Cloudflare: https://developers.cloudflare.com/workers/about/pricing · https://developers.cloudflare.com/d1/platform/pricing/ · https://developers.cloudflare.com/changelog/post/2026-09-01-d1-free-tier-limit-enforcement/ · https://developers.cloudflare.com/d1/platform/release-notes · terceros: https://www.activepieces.com/blog/cloudflare-workers-pricing-2026-free-vs-paid-plans.md
- GameAnalytics: https://docs.gameanalytics.com/integrations/sdk/javascript/ · https://gameanalytics.com/developer-policy/ · https://docs.gameanalytics.com/event-tracking-and-integrations/advanced-tracking/external-user-id
- Portales: https://sdk.poki.com/external-resources · https://sdk.poki.com/requirements · https://docs.crazygames.com/requirements/intro/ · https://docs.crazygames.com/resources/partners/ · https://docs.crazygames.com/requirements/gameplay/

### 1.3 Descartados y por qué

- **Plausible:** no tiene plan gratuito permanente (prueba de 30 días) y las propiedades personalizadas están en el plan Business, no en el básico [B, https://plausible.io/docs/subscription-plans; precios de los planes intermedios contradictorios entre terceros]. Choca con "coste cero al principio".
- **Cloudflare Web Analytics:** gratis y sin cookies, pero según varias fuentes **no admite eventos personalizados** (solo páginas vistas) [T, sin confirmación oficial; https://developers.cloudflare.com/analytics/web-analytics/getting-started/web-analytics-spa/]. Un juego de una sola página con Canvas no aprende nada de páginas vistas.
- **Google Analytics:** Poki bloquea los productos de Google en todos los casos [B, https://sdk.poki.com/requirements]; además exige consentimiento y gestor de cookies. Descartado.
- **GoatCounter** queda en la tabla como referencia de lo más ligero, pero sin propiedades, sin embudos y con duda sobre si un juego con donaciones es "uso comercial". No sirve para medir dificultad por jefe y Peligro.

### 1.4 Volumen esperado (estimación)

Con el esquema de la sección 3, una sesión típica genera unos 15-40 eventos (estimación: 1 de sesión, 2-4 expediciones con inicio, fin, jefes y fusiones, compras y ajustes). Con 1 millón de eventos al mes gratis en PostHog [B], caben del orden de 25.000-65.000 sesiones al mes **de jugadores que aceptan**. Con los 100.000 de Umami Hobby [T], unas 2.500-6.500. Hoy el tráfico de Pages es casi nulo (PLAN-MAESTRO 2.1), así que cualquiera de los dos basta al principio; el muestreo (sección 6.5) está para cuando no.

### 1.5 Privacidad y consentimiento: postura del estudio

- **ePrivacy (art. 5.3) cubre leer o guardar cosas en el dispositivo**, no solo cookies. Guardar en `localStorage` la fecha de primera apertura con fines de analítica es, en principio, acceso al terminal. Hay exenciones nacionales para medición de audiencia (Francia, CNIL: finalidad limitada, datos anónimos, sin cruces con terceros, trazadores de 13 meses como máximo; desde 2026 la CNIL pasó a autoevaluación en vez de lista de herramientas, según terceros) y en España la AEPD publicó en enero de 2024 una guía sobre cookies de medición de audiencia que contempla exenciones con condiciones [T]. Fuentes: https://www.cnil.fr/en/sheet-ndeg16-use-analytics-your-websites-and-applications · https://WWW.AEPD.ES/guias/guia-cookies-analiticas-externas.pdf · https://www.iubenda.com/es/blog/understanding-the-spanish-dpa-guide-on-audience-measurement-cookies/ · https://truendo.com/en/blog/what-is-audience-measurement-cookies-consent-exemption
- **No nos apoyamos en ninguna exención.** Nuestro principio 5 ("nada sale del dispositivo sin consentimiento") y la decisión del dueño (aviso de privacidad) llevan a lo mismo: **opt-in**. Nada se envía hasta que el jugador pulsa "Aceptar". Así el riesgo legal baja mucho y el diseño no depende de cómo interprete cada autoridad la exención. Coste: perdemos a quien no acepta (sesgo de muestra; ver 4.4).
- **Revisión profesional pendiente** de: texto del aviso, base jurídica, si la fecha de primera apertura y el "día N" bastan para considerar los datos anónimos o son seudónimos, encargo de tratamiento con el proveedor (DPA) y transferencia internacional si el proveedor es de EE. UU. aunque aloje en la UE.

---

## 2. Recomendación

**Opción: PostHog Cloud, región UE, usado por su API HTTP directa, sin su librería.**
**Alternativa: Umami Cloud, plan Hobby, por su API directa.**

Por qué PostHog:
1. **Responde a las preguntas que importan sin construir nada:** embudos de primera sesión, retención por cohorte y tasa de victoria por jefe y Peligro salen de sus "insights" estándar con las propiedades que enviamos. Divertido y adictivo se miden con retención D1/D7 y con "cuántos juegan una segunda expedición"; monetizable se decide después (T-F3-01) con esos datos.
2. **Coste cero con margen:** 1 millón de eventos/mes gratis [B] es unas 10 veces lo de Umami Hobby [T].
3. **Datos en la UE** a elegir al crear la cuenta [B].
4. **Sin script de terceros:** nuestro código decide qué sale, cuándo y con qué. Sin cookies, sin almacenamiento del proveedor, CSP fácil, el bucle del juego intacto.
5. **Lotes**: su ingesta admite enviar varios eventos por petición (endpoint de lotes; ruta exacta [N], ver 6.3), lo que encaja con la cola sin conexión.

Contras honestos de PostHog: es un producto grande (la consola puede abrumar al dueño; por eso la sección 4 dice exactamente qué tableros crear); empresa con sede en EE. UU. aunque los datos estén en la UE [T]; sin su librería algunas funciones (grabación de sesiones, banderas) no se usan, y no las queremos.

Por qué Umami como alternativa: consola mucho más simple, eventos con propiedades [B], gratis; peor en límite (100.000/mes [T]), región de alojamiento no encontrada [N] y embudos y retención en el plan gratuito sin confirmar [N]. Si al dueño PostHog le resulta inmanejable, cambiar de adaptador es un archivo.

**En portales (Poki, CrazyGames): ni PostHog ni Umami.** Adaptador "portal" (eventos de juego al SDK del portal vía `G.Platform`, T-F3-02) o "ninguno". El resumen local sigue funcionando. Si algún día hace falta analítica propia en Poki, GameAnalytics es el candidato que Poki puede aprobar caso a caso [B], pero exige su SDK y su propio consentimiento: decisión aparte.

**itch.io:** el juego corre en un iframe de otro dominio y, con cookies de terceros bloqueadas, `localStorage` puede no estar disponible [T, foros de itch.io: https://itch.io/t/2636350/localstorage-doesnt-work-for-html5-games-on-ipad-by-default · https://bugnet.io/blog/fix-html5-game-cookies-blocked-third-party-itch-embed]. No se encontró norma de itch.io que prohíba analítica propia [N]. Con `localStorage` bloqueado, `G.Track` funciona en memoria y no calcula retención (ver 6.4).

---

## 3. Esquema de eventos mínimo

### 3.1 Identificadores y rotación

| Dato | Qué es | Dónde vive | ¿Se envía? | Rotación |
|---|---|---|---|---|
| `sid` | Id de sesión: 16 caracteres hex de `crypto.getRandomValues` | Solo memoria | **Sí** (se usa como `distinct_id` en el proveedor) | Nuevo en cada sesión (apertura del juego, o vuelta tras más de 30 min en segundo plano) |
| `cohort` | Fecha de la primera apertura, `AAAA-MM-DD` en UTC | `localStorage` (estado de analítica) | Sí, como propiedad | No rota; se borra con "Borrar datos de analítica" o al borrar el guardado |
| `day_n` | Días naturales (UTC) desde `cohort` | Se calcula | Sí, como propiedad | — |
| `iid` | Id aleatorio de instalación (como pide el plan) | `localStorage` | **No, nunca sale del dispositivo** | Solo sirve para el muestreo estable y el panel local |

Por qué así: con un id persistente enviado tendríamos un seudónimo del jugador entre sesiones; sin él, el proveedor no puede enlazar dos sesiones de la misma persona. La retención se calcula igual de bien con `day_return` (3.3), que el propio dispositivo dispara una sola vez por día. Lo que se pierde: embudos que crucen sesiones de una misma persona (por ejemplo "¿quién compró en el taller en su tercera sesión?"). Si el dueño los quiere, la pregunta 3 de la sección 8 propone un id rotatorio de 30 días; **no está en este diseño por defecto**.

Nunca se envía: nombre, correo, texto libre del jugador, `navigator.userAgent` completo, resolución exacta de pantalla, idioma completo del sistema (solo `es`/`en`/`otro`), contenido del guardado, IP (no la mandamos nosotros; la ve el servidor: ver 1.2).

### 3.2 Propiedades comunes (en todos los eventos)

| Propiedad | Valores | Para qué |
|---|---|---|
| `sv` | versión del esquema (entero, empieza en 1) | Interpretar datos tras cambios |
| `build` | `Diag.build` (hash de `sw.js`) | Comparar versiones |
| `plat` | `pages`, `pwa` (instalada), `itch`, `portal`, `twa` | Separar públicos |
| `dev` | `movil`, `tablet`, `pc` (por tamaño y táctil, sin modelo) | Dificultad y rendimiento por tipo |
| `q` | `alta`, `media`, `baja` (calidad efectiva) | La dificultad depende de la calidad (T-F0-05) |
| `god` | `true`/`false` | **Separar partidas inmortales de las de reto** (obligatorio por el plan) |
| `lang` | `es`, `en`, `otro` | Idioma |
| `cohort`, `day_n` | ver 3.1 | Retención |
| `t` | marca de tiempo ISO del momento del evento (no del envío) | Orden y eventos enviados tarde |

### 3.3 Eventos

Convención: nombres en inglés `snake_case` (estables aunque el juego se traduzca), valores cortos, sin acentos. Las "buckets" (tramos) reducen detalle donde el número exacto no aporta.

| # | Evento | Cuándo se dispara | Propiedades propias | Pregunta que responde |
|---|---|---|---|---|
| 1 | `first_open` | Primera vez que arranca el juego en esta instalación (no existe estado de analítica previo). Si el jugador acepta el aviso más tarde, se envía en ese momento con su `t` original | `has_save` (había guardado de antes de la analítica) | ¿Cuántos jugadores nuevos llegan y de qué plataforma? Denominador de la retención |
| 2 | `session_start` | Cada sesión nueva (ver `sid`) | `sess_n` (número de sesión local, tramos 1, 2, 3, 4-5, 6-10, 11+), `bg_return` (vuelve de segundo plano) | ¿Cuántas sesiones por día y cuántas por jugador? |
| 3 | `day_return` | Primer `session_start` de cada día natural UTC con `day_n >= 1`; una sola vez por día y dispositivo | `day_n` (ya común) | **Retención D1, D7, D30** sin id persistente |
| 4 | `intro_end` | Al terminar o saltar la intro (`cine_intro.js`) | `watched_s`, `skipped` (bool), `first` (bool) | ¿Cuántos abandonan durante la intro de ~27 s no saltable? (embudo 4.1) |
| 5 | `run_start` | Al salir por el Portal a una expedición | `biome`, `peril` (1-5), `mode` (`normal`, `caceria`, `practica`), `dur` (opción de duración), `run_n` (expediciones locales, tramos), `armor_t` (tier medio de armadura equipada) | ¿Qué juegan y con qué preparación? |
| 6 | `run_end` | Al terminar la expedición por cualquier causa, incluida salir desde pausa | `biome`, `peril`, `mode`, `result` (`win`, `death`, `quit`), `cause` (familia de enemigo, id de jefe o `quit`), `dur_s`, `level`, `kills` (tramos), `boss_reached` (bool), `first_card_s` (segundo de la primera oferta de carta), `fusions` (número), `powers` (lista de poderes con usos: `"id:n,id:n"`, ver nota), `run_n` | Dificultad real, causa de muerte, ritmo del primer minuto. **Sustituye al `level_up` del plan** (el nivel y el ritmo van aquí, sin 20 eventos por partida) |
| 7 | `boss_start` | Al aparecer el jefe (jefe "visto") | `boss`, `peril`, `run_s` (segundo de la expedición), `hp_pct` (vida del jugador en tramos de 10) | ¿Cuántos llegan a cada jefe y en qué estado? |
| 8 | `boss_end` | Al vencer al jefe, morir ante él o salir durante la pelea | `boss`, `peril`, `result` (`win`, `death`, `quit`), `fight_s`, `hp_pct`, `parts` (partes rotas) | **Tasa de victoria por jefe y Peligro** frente al objetivo del dueño (I 50 %, II 40 %, III 30 %, IV 20 %, V 10 %) |
| 9 | `fusion` | Al crear una fusión | `id`, `replaced` (id del poder sustituido o vacío), `run_s`, `first` (primera fusión de la instalación) | ¿Se entienden las fusiones? ¿Cuáles se eligen? |
| 10 | `power_first_use` | La primera vez que el jugador usa cada poder (una vez por poder e instalación) | `id`, `run_s` (tiempo desde que lo obtuvo) | ¿Encuentran el botón del poder? Los usos totales van agregados en `run_end.powers` |
| 11 | `shop_buy` | Compra o fabricación en la aldea (forja, árbol, herrero, encargos) | `where` (`forja`, `arbol`, `herrero`, `tablon`), `item`, `cur` (moneda), `cost` (tramos), `run_n` | ¿En qué gastan? ¿Llega la primera compra pronto? (sustituye al `craft` del plan) |
| 12 | `manual_open` | Al abrir el Manual | `from` (`aldea`, `pausa`, `otro`), `page` (página al cerrar), `open_s` (tiempo abierto) | ¿Se usa el Manual? ¿Dónde se pierden? |
| 13 | `settings_quality` | Cambio manual de calidad en Ajustes, o el primer cambio automático de cada sesión | `from`, `to`, `auto` (bool) | ¿Cuántos dispositivos bajan de calidad? (afecta al balance, T-F0-05) |
| 14 | `error` | Cada `Diag.log` (`src/diag.js:15`), como mucho 3 por sesión y sin repetir el mismo mensaje | `kind`, `msg` (120 caracteres, sin rutas ni URL), `src` (nombre de archivo), `line`, `state` | ¿Hay fallos en dispositivos reales que no vemos? |
| 15 | `session_end` | Al pasar a segundo plano (`visibilitychange` oculto o `pagehide`) si la sesión dura más de 5 s | `dur_s` (visible), `play_s` (en expedición), `runs` (expediciones en la sesión), `state` (`titulo`, `intro`, `aldea`, `expedicion`, `jefe`, `pausa`, `fin`) | Duración de sesión y **punto de abandono** (sustituye al `quit_point` del plan) |
| 16 | `analytics_on` | Al pulsar "Aceptar" en el aviso o activar el interruptor | `where` (`aviso`, `ajustes`) | ¿Desde dónde se activa? (no hay evento al rechazar: con el rechazo no sale nada) |

Notas:
- **Poder usado:** un evento por uso daría cientos por partida y no responde a nada que no responda el agregado. Por eso: primer uso (evento 10) y recuento por partida (`run_end.powers`).
- **`run_end` al cerrar la pestaña en mitad de una expedición:** no da tiempo a nada fiable. Se guarda la expedición abierta en el estado local; en la siguiente sesión se envía `run_end` con `result: "abandon"` y la duración conocida.
- `cause` reutiliza los identificadores internos de familia y jefe (`families.js`, `boss*.js`); `programmer` debe exponer una tabla única en `track.js` para que no cambien de nombre por accidente.

---

## 4. Embudos y tableros para el dueño

Todos se construyen en PostHog con "Insights" y se agrupan en un tablero "Swarm Hand". **Filtro común: `god = false`** salvo en los tableros de primera sesión, y separar por `plat` cuando haya más de una plataforma.

### 4.1 Primera sesión (embudo, mismo `sid`)
`first_open` → `intro_end` → `run_start` (con `run_n = 1`) → `run_end` (primera) → `run_start` (segunda) → `session_end`.
- Lo que se mira: dónde cae más gente. Valores de referencia del propio juego: ninguno todavía (no hay datos). Hipótesis del plan: la caída gorda está entre `intro_end` y el primer `run_start` (aldea con 7 NPC, T-F1-02).
- Complementos: mediana de `first_card_s` y de `dur_s` en la primera expedición; reparto de `session_end.state` en las sesiones con `sess_n = 1`.

### 4.2 Retención
- **D1** de una cohorte = número de `day_return` con `day_n = 1` y esa `cohort` / número de `first_open` de esa `cohort`. Igual para D7 (`day_n = 7`) y D30.
- Gráfico semanal por cohorte (tendencia, no valores sueltos: con pocos jugadores un día no dice nada).
- Referencia externa (no son nuestros datos): mediana de juegos móviles D1 ~22 % y D7 ~4 %, cuartil alto D1 algo más del 30 % [T, resúmenes del informe GameAnalytics 2026 citados en PLAN-MAESTRO 2.4; no verificado contra el informe original]. Un juego web de portal no es comparable sin más.
- Además: sesiones por jugador activo y día (`session_start` / `day_return`), duración mediana de sesión (`session_end.dur_s`).

### 4.3 Dificultad por jefe y Peligro
- Tabla: filas `boss`, columnas `peril`, celda = `boss_end` con `result = win` / todos los `boss_end`. Se colorea frente al objetivo del dueño (I 50 %, II 40 %, III 30 %, IV 20 %, V 10 %).
- Alcance: `boss_start` / `run_start` por bioma y Peligro (¿llegan al jefe?).
- Causa de muerte: `run_end` con `result = death`, desglose por `cause`, por bioma.
- Por calidad: la misma tabla separada por `q` (comprueba la equivalencia de T-F0-05 en dispositivos reales).
- **No se saca ninguna conclusión de celdas con menos de 30 peleas** (mismo umbral que T-F2-01).

### 4.4 Cuidado al leer
- Solo vemos a quien acepta. Quien acepta probablemente está más comprometido: la retención real será algo menor que la medida (estimación, sin dato).
- Mientras Pages tenga la inmortalidad por defecto, la dificultad solo vale con `god = false`.

---

## 5. Aviso de privacidad, interruptor y menores

### 5.1 Cuándo y cómo se muestra
- **Decisión del dueño (2026-11-14):** se muestra **al abrir el juego por primera vez, justo después de la cinemática de inicio** y antes de la aldea. Nunca interrumpe la intro ni el combate.
- Si la intro no se reproduce (`?cine=0`, cinemáticas apagadas), el aviso aparece al llegar por primera vez a la aldea.
- Si el jugador cierra el juego durante la intro, se muestra al terminarla en la siguiente sesión.
- No se muestra en dispositivos con zona horaria europea mientras esté activo el filtro de `REVISION-PRIVACIDAD.md` (sección 9), ni si `localStorage` no está disponible.
- Hasta que el jugador decide, `first_open`, `session_start` e `intro_end` esperan **solo en memoria** (nada en `localStorage`) y **no salen**. Si acepta, se envían con su `t` original; si rechaza, se descartan.
- *Texto anterior, sustituido:* "Aparece en la aldea, la primera vez que se vuelve de la primera expedición".
- Dos botones del **mismo tamaño, color y posición equivalente**: "Aceptar" y "No, gracias". Sin casillas premarcadas, sin "seguir jugando = aceptar".
- Si rechaza: se **borra la cola** y no se vuelve a preguntar (salvo desde Ajustes).
- Enlace "Más información" a `privacy.html` (página de T-F3-01, que esta tarea adelanta en versión mínima; Poki exige política publicada y enlazada desde el juego si algún día se aprobara un servicio externo allí [B]).

> **Sustituido (2026-11-14):** los textos vigentes del aviso (versión `pv = 2026-11-14a`, umbral de 18 años, mención de PostHog y de la IP) están en `REVISION-PRIVACIDAD.md`, sección 11.1. Los de 5.2 y 5.3 quedan como historial.

### 5.2 Texto en español (pantalla del juego)

> **¿Nos ayudas a mejorar Swarm Hand?**
> Si aceptas, el juego enviará estadísticas anónimas de partida (qué bioma juegas, cuánto duras, qué jefe te vence, errores del juego) a nuestro servicio de analítica, alojado en la Unión Europea. No enviamos tu nombre, ni tu correo, ni ningún identificador que te siga entre sesiones o dispositivos. Sin aceptar, nada sale de tu dispositivo y el juego es exactamente igual.
> Puedes cambiarlo cuando quieras en Ajustes > Privacidad.
> Si tienes menos de 14 años, pulsa "No, gracias".
> [ Aceptar ]  [ No, gracias ]  · Más información

### 5.3 Texto en inglés

> **Help us improve Swarm Hand?**
> If you accept, the game will send anonymous gameplay statistics (which biome you play, how long you last, which boss beats you, game errors) to our analytics service, hosted in the European Union. We never send your name, your email or any identifier that follows you across sessions or devices. If you don't accept, nothing leaves your device and the game is exactly the same.
> You can change this at any time in Settings > Privacy.
> If you are under 14, please tap "No, thanks".
> [ Accept ]  [ No, thanks ]  · More info

(La edad de 14 años sigue la ley española, LOPDGDD art. 7; en otros países de la UE va de 13 a 16. Ver 5.5: **revisión profesional**.)

### 5.4 Ajustes > Privacidad
- Interruptor "Enviar estadísticas anónimas" (apagado hasta que se acepte).
- Al apagarlo: se vacía la cola y se para el envío en el acto. Al encenderlo: se envía `analytics_on`.
- Botón "Borrar datos de analítica de este dispositivo": borra `cohort`, contadores, cola e `iid` (empieza como instalación nueva).
- Texto explicativo de una línea y enlace a "Más información".
- El "Informe de errores" que ya existe (`diag.js`) no cambia: sigue siendo local y copiable a mano.

### 5.5 Menores
- El juego **no está dirigido a menores** (PLAN-MAESTRO T-F3-01, paso 3) y no pedimos la edad (pedirla sería recoger un dato más).
- Defensa en capas: opt-in, nada personal, el aviso pide a los menores de 14 que rechacen, y en portales no hay envío a terceros.
- **Para el profesional:** si basta esto sin verificación de edad; la edad aplicable fuera de España; COPPA si hay jugadores en EE. UU. (en principio no se recogen datos personales, pero la IP la ve el servidor); si el aviso debe mencionar el proveedor por su nombre y el encargo de tratamiento.

---

## 6. Diseño técnico para `programmer`

### 6.1 Archivos
- `src/track.js` (nuevo): la capa. Se carga **justo después de `diag.js`** en `index.html` (antes que `main.js`) para poder enganchar `Diag.log`.
- `privacy.html` (nuevo, estático, sin scripts) con el texto largo; se añade al precache (ver 6.8).
- Llamadas en `src/main.js`, `src/cine_intro.js`, `src/loot.js`, `src/cards.js`, `src/fusion.js`, `src/boss.js`, `src/panels.js`, `src/manual.js`, `src/smith.js`, `src/tree.js`, `src/mobile.js` (calidad y ciclo de vida).
- Pantalla del aviso y sección de Ajustes en `src/panels.js` (o donde vivan Ajustes), dibujadas en Canvas como el resto.

### 6.2 API pública

```
G.Track(name, props)          // encola; O(1); nunca lanza; nunca hace red en la llamada
G.Track.consent(true|false)   // desde el aviso o el interruptor
G.Track.state()               // { consent: null|true|false, enabled, adapter, queued, sid, cohort, day_n }
G.Track.flush()               // fuerza un intento de envío (lo usa pagehide)
G.Track.wipe()                // "Borrar datos de analítica"
G.Track.log                   // con ?dev=1&track=log: array de eventos "enviados" (para pruebas)
```

### 6.3 Adaptadores
Interfaz: `{ name, send(batch) -> Promise<bool> }`. Uno solo activo.

| Adaptador | Cuándo | Qué hace |
|---|---|---|
| `none` | Por defecto mientras no haya clave; portales sin permiso; `localhost` | No hace red. La cola no crece (se descartan) pero el resumen local sí |
| `log` | `?dev=1&track=log` | Copia a `G.Track.log` y a la consola; **sin red**. Para pruebas |
| `posthog` | Pages / PWA / itch con clave configurada y consentimiento | `fetch(HOST + '/batch/', {method:'POST', keepalive:true, body})` con `api_key` (clave **pública** de proyecto), `distinct_id = sid` y cada evento marcado como anónimo (sin perfil de persona: propiedad `$process_person_profile: false` según la doc. de PostHog). **[N] Confirmar en la documentación de PostHog la ruta de lotes, el host UE de ingesta (se cita `eu.i.posthog.com`) y esa propiedad antes de implementar.** |
| `umami` | Si el dueño elige la alternativa | `POST` a su endpoint de envío, un evento por petición [N: confirmar formato] |
| `portal` | Builds de portal | Reenvía solo hitos de juego a `G.Platform` (T-F3-02): inicio y fin de partida. Nada a terceros |

**Adaptador por destino (decisión del dueño, 2026-11-14):**

| Destino | Adaptador | Envío a terceros | Cómo se elige |
|---|---|---|---|
| GitHub Pages (web y PWA instalada) | `posthog` | Sí, con consentimiento, a PostHog UE | Valor por defecto de `CFG` en el código fuente una vez exista la clave |
| itch.io | `posthog` | Sí, con consentimiento, a PostHog UE. Si `localStorage` no está disponible en el iframe: ni aviso ni envío | `build.js --track=posthog` |
| Portales (CrazyGames, Poki y similares) | `portal` (o `none` hasta que exista `G.Platform`) | **No**, nunca | `build.js --track=portal` |
| Play Store (TWA), si llega | Por decidir (ficha de seguridad de datos) | — | — |
| Local, bots, `?dev=1` | `none` / `log` | No | Sección 6.6 |

En todos los destinos con `posthog` se aplican además el filtro por zona horaria europea (si el dueño lo confirma) y la lista de comprobación de `REVISION-PRIVACIDAD.md`, sección 13. Todas las peticiones salen con `credentials: 'omit'` y `referrerPolicy: 'no-referrer'`.

Configuración (datos **públicos**, se pueden commitear): `G.Track.CFG = { adapter: 'none', host: '', key: '', sample: 1 }` al principio de `track.js`. La clave de proyecto de PostHog (`phc_...`) está pensada para ir en el cliente; **la clave personal de API (`phx_...`) es secreta y no se usa nunca**.

### 6.4 Cola sin conexión
- Clave `localStorage`: `swarmhand.fusion.track` → `{ v:1, iid, cohort, lastDay, sessN, runN, consent, sampled, firstUse:{}, openRun:null, q:[...] }`. Con `localStorage` bloqueado (itch en iframe, modo privado): todo en memoria, sin `day_return` ni `first_open` fiables (se marca `ls:false` en `session_start`).
- **Tope: 300 eventos o 96 KB serializados** (lo que llegue antes). Al pasarse, se descartan primero los más viejos que no sean `first_open`, `day_return`, `run_end` o `boss_end`.
- Eventos con más de 7 días en cola se descartan (no aportan y el proveedor podría rechazarlos [N]).
- Sin consentimiento aún (`consent: null`): la cola vive **solo en memoria** (no se escribe nada de analítica en `localStorage`, ni siquiera `iid` o `cohort`). Al aceptar se crea el estado persistente (`cohort` = hoy; si se acepta más tarde desde Ajustes, `late: true` para excluirlo de la retención). Con `consent: false` solo se guarda la elección, para no volver a preguntar. Ver `REVISION-PRIVACIDAD.md`, sección 13.
- Persistencia de la cola: con retardo (cada 10 s como mucho y en `pagehide`), nunca en cada evento.

### 6.5 Envío, muestreo y rendimiento
- `G.Track()` solo valida, añade las propiedades comunes y hace `push`. Ni `JSON.stringify` ni red en esa llamada.
- Envío fuera del bucle del juego: temporizador cada 30 s (`setTimeout`, y `requestIdleCallback` cuando exista), y además tras `run_end` y en `visibilitychange` oculto/`pagehide` (`fetch` con `keepalive`; `sendBeacon` como respaldo si `fetch` falla).
- **Nunca envía durante el combate** salvo en `pagehide`: si `G.state` es expedición, espera a la aldea o al fin de partida.
- Lotes de 50 como máximo. Si falla: reintento con espera exponencial 30 s, 1, 2, 4… hasta 30 min; `navigator.onLine === false` no intenta.
- Muestreo por instalación: `sampled = random() < CFG.sample`, decidido una vez y guardado. Los `error` también se muestrean (no queremos tormentas). Por defecto `sample: 1`.
- Límite de seguridad: como mucho 200 eventos por sesión; pasado eso solo `run_end`, `boss_end`, `session_end`.

### 6.6 Cuándo está apagada (adaptador forzado a `none`, sin red)
- `navigator.webdriver` (bots y pruebas; mismo criterio que `cine.js:30`).
- `?dev=1` (salvo `&track=log`, que tampoco hace red).
- `?track=0`.
- `location.hostname` es `localhost` o `127.0.0.1`.
- Sin consentimiento (`consent !== true`).
- `CFG.key` vacío.

### 6.7 Pruebas (grupo `track` en `tools/card-swarm-bot/tests.js`)
Todas con `?dev=1&track=log` salvo la 11 y la 12.
1. Primera carga: `first_open` y `session_start` en ese orden, con `sv`, `build`, `god`, `q`, `cohort` y `day_n = 0`.
2. Recargar: `session_start` sin `first_open`; `sess_n` sube.
3. Cambiar el reloj a +1 día (fecha simulada): sale `day_return` con `day_n = 1` una sola vez aunque haya dos sesiones ese día.
4. Fin de intro: `intro_end` con `first = true`.
5. Expedición completa con muerte: `run_start` → (`fusion`)* → `run_end` con `result = death` y `cause` no vacío.
6. Jefe: `boss_start` antes de `boss_end`; mismo `boss` y `peril`.
7. Cerrar en mitad de expedición y recargar: `run_end` con `result = abandon`.
8. Compra en la aldea: `shop_buy` con `where` e `item`.
9. `Diag.log` repetido 10 veces: como mucho 3 eventos `error`, sin rutas ni URL en `msg`.
10. La cola respeta el tope (300) y conserva `first_open` y `run_end` al recortar.
11. **Cero red**: con `consent` nulo, con `consent = false`, con `navigator.webdriver` y con `?dev=1`, interceptando todas las peticiones (Playwright `page.route('**')`): ninguna petición a otro origen durante una partida completa.
12. Con consentimiento y un adaptador falso (servidor local que responde 500 y después 200): reintento, envío en lote, cola vacía al final; ningún envío con `G.state` en combate.
13. Rendimiento: `perf_bot.js` con la analítica en `log` no empeora la p95 de fotograma más allá del ruido medido (comparar con y sin).
14. `G.Track.wipe()` borra la clave de `localStorage` y la siguiente carga vuelve a dar `first_open`.

### 6.8 Service worker y empaquetado
- **Service worker (`sw.js`)**: no hay que tocarlo. Las peticiones a otro origen y las que no son `GET` no se interceptan (comprobado en `sw.js`, manejador `fetch`: `if (req.method !== 'GET') return;` y `if (url.origin !== location.origin) return;`). `track.js` entra solo en el precache porque `stamp.py` lee las etiquetas `<script>` de `index.html`; `privacy.html` hay que añadirlo a la lista de `stamp.py` (hoy solo lee scripts, `link` locales, manifiesto e iconos) o enlazarlo con un `<link rel="privacy-policy">` en `index.html`, que `stamp.py` ya recoge.
- **Empaquetado (`tools/build/build.js`)**: `track.js` se concatena solo, por orden de `index.html`. Añadir una opción `--track=<adapter>` que sustituya el `adapter` de `CFG` (igual que `--no-god`), con error claro si el literal cambia: builds de portal con `--track=portal` o `--track=none`; itch con `posthog` si el dueño lo aprueba. Copiar `privacy.html` a la salida.
- **CSP**: hoy `index.html` no declara CSP (comprobado). Si se añade, basta `connect-src 'self' <host de ingesta UE>`; no hace falta `script-src` de terceros. El `<script>` en línea final (`G.init()`) obligaría a un hash o a sacarlo a archivo; fuera de esta tarea.

### 6.9 Resumen local "Mis estadísticas" (paso 4 del plan)
Independiente del consentimiento (no sale del dispositivo): expediciones, victorias por jefe y Peligro, mejor tiempo, causa de muerte más frecuente. Se alimenta de los mismos eventos antes de la cola. Diseño de pantalla: `ux-designer`.

---

## 7. Guía para el dueño: crear la cuenta de PostHog

Hazlo tú, con tu correo. **No nos pases contraseñas, códigos ni claves personales.** Los nombres de menús pueden variar: si algo no coincide, dímelo y lo ajustamos.

1. Entra en https://posthog.com y pulsa "Get started" / registrarse.
2. **Elige la región "EU"** (Unión Europea) en el registro. Es importante: no se puede cambiar después sin crear otra cuenta [N: confirmar].
3. Crea la organización (pon "Swarm Hand" o tu estudio) y un proyecto llamado "Swarm Hand".
4. Si te ofrece instalar su fragmento de código, **sáltalo**: no lo usamos.
5. En Settings > Project > "IP data capture configuration", activa **"Discard client IP data"**. Según la doc. de PostHog, en las organizaciones de la UE viene activado por defecto, pero compruébalo [B, https://posthog.com/docs/privacy/data-storage]. Desactiva también el enriquecimiento GeoIP (o al menos que no guarde ciudad ni coordenadas) si la consola lo permite, y dinos qué opciones viste.
6. No actives grabación de sesiones, encuestas ni nada más: no las usamos.
7. Revisa el plan: debe ser el gratuito. **No añadas tarjeta.** Si te la pide, para y avísanos.
8. Busca y lee el acuerdo de tratamiento de datos (DPA) que ofrezca PostHog: lo necesitará el profesional que revise lo legal.
9. Copia **la clave pública del proyecto** ("Project API key", empieza por `phc_`) y **el host de la región UE** que te indique la consola. Eso es lo único que nos pasas. Es pública por diseño: acaba dentro del juego.
10. **Nunca** nos pases una "Personal API key" (empieza por `phx_`): esa es secreta.
11. (Opcional) Invita a nadie más por ahora.

Cuando nos lo pases, `programmer` lo pone en `CFG`, se publica en Pages con el envío detrás del aviso, y en una semana creamos juntos los tableros de la sección 4.

---

## 8. Preguntas para el dueño

**Respondidas el 2026-11-14:** ver "Decisiones del dueño (2026-11-14)" al principio. Las nuevas preguntas que abre la revisión de privacidad están en `REVISION-PRIVACIDAD.md`, sección 15.

1. **¿PostHog (recomendado) o Umami?** PostHog: más límite gratis y embudos/retención listos, consola más compleja. Umami: más simple, menos límite.
2. **¿Mostrar el aviso tras la primera expedición (recomendado) o al abrir el juego por primera vez?** Al abrir es más simple, pero añade otra pantalla antes de jugar.
3. **¿Te basta la retención sin id de jugador (recomendado), o quieres un id anónimo que rote cada 30 días** para seguir a un mismo jugador entre sesiones? Más análisis, algo menos de privacidad y más riesgo legal.
4. **¿Activamos el envío en itch.io** además de Pages, o solo en Pages al principio?
5. **¿Tienes ya a alguien para la revisión legal** (aviso, menores, proveedor)? Sin esa revisión, recomendamos dejar el envío desactivado (adaptador `none`) aunque el código esté listo.

---

## 9. Qué no se pudo verificar

- Precios y límites exactos de Umami (número de webs en Hobby: las fuentes dicen 1 o 3), GoatCounter (precio comercial contradictorio), Cloudflare (fecha de aplicación de límites de D1 contradictoria) y Plausible (planes intermedios).
- Región de alojamiento de Umami Cloud; si Umami Hobby incluye embudos y retención; formato de su API de envío.
- Ruta exacta de lotes y host UE de ingesta de PostHog, la propiedad de eventos sin perfil y la opción de descartar IP.
- Si CrazyGames permite analítica de terceros (no se encontró regla; tampoco se pudo abrir su documentación).
- Normas de itch.io sobre analítica propia.
- Peso actual del SDK de GameAnalytics y dónde guarda su id.
- Todo lo legal (exenciones CNIL/AEPD aplicadas a `localStorage`, edad de consentimiento por país, COPPA): requiere profesional.
