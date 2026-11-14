# Revisión de privacidad de la analítica de Swarm Hand (T-F1-01)

Fecha: 2026-11-14 · Autor: `monetization-analyst` · Se aplica a: `studio/docs/SPEC-T-F1-01.md` (decisiones del dueño del 2026-11-14).

---

## 0. Antes de leer: límites de este documento

- **No somos abogados. Este documento no es asesoría jurídica ni la sustituye.** Es una revisión de cumplimiento hecha por el estudio con el mayor rigor posible, para que el dueño entienda qué riesgos acepta y pueda implementar con criterios conservadores. Lo recomendable sigue siendo que un profesional (de Colombia, y a ser posible con experiencia en RGPD) lo revise antes o poco después de publicar.
- **En esta sesión no se pudo abrir ninguna fuente primaria.** Los dominios oficiales no resuelven en la red permitida: `eur-lex.europa.eu`, `www.edpb.europa.eu`, `www.boe.es`, `www.aepd.es`, `www.funcionpublica.gov.co`, `www.federalregister.gov`, `posthog.com`, `itch.io` (y antes `umami.is`, `goatcounter.com`, `developers.cloudflare.com`, `docs.crazygames.com`, `sdk.poki.com`). Para poder verificar en fuente primaria hay que permitir esos dominios en la configuración de red de la sesión. No hay nada marcado como **[P]**; las marcas que se usan son estas:
  - **[P]** verificado leyendo la fuente primaria (texto legal u oficial) en esta sesión. **Ninguno.**
  - **[O]** fuente oficial (norma, autoridad o proveedor) conocida **solo a través del resumen o la cita del buscador**, no leída entera.
  - **[S]** fuente secundaria: despachos, blogs, terceros.
  - **[N]** no verificado: conocimiento general del estudio o inferencia. Puede estar mal o desactualizado.
- Donde las fuentes se contradicen, se dice.

---

## 1. Resumen y recomendación

1. **Qué tratamos:** eventos de partida sin nombre, correo ni identificador persistente, un id de sesión aleatorio y, por fuerza, la **dirección IP** que llega al servidor de PostHog con cada envío (el diseño pide que PostHog la descarte). Por la IP y por el id de sesión, **tratamos esto como datos personales** aunque el objetivo sea el anonimato. Es la postura prudente.
2. **Regímenes que aplican:** Colombia (el responsable está allí: Ley 1581 de 2012 y su decreto reglamentario, autoridad: SIC), la UE (RGPD y directiva ePrivacy, porque el juego se ofrece a jugadores en la UE) y, si hay jugadores en EE. UU., la COPPA en lo relativo a menores de 13 años.
3. **Base jurídica: consentimiento previo, expreso e informado en todos los regímenes.** Es lo que exige Colombia en general, lo que exige ePrivacy para leer o guardar en el dispositivo con fines de analítica y lo que permite el RGPD. Por eso el aviso de opt-in del diseño es correcto y **no se debe rebajar a "aviso informativo"**.
4. **Lo más delicado:**
   - (a) **Menores.** En Colombia el tratamiento de datos de menores de 18 años necesita la autorización de su representante legal. Recomendación conservadora: **"Aceptar" solo para mayores de 18 años**, y quien no lo sea debe pulsar "No, gracias".
   - (b) **Representante en la UE (RGPD art. 27).** Al ser una analítica continua, probablemente hace falta designarlo si se tratan datos de jugadores de la UE. Recomendación conservadora: mientras no haya representante ni asesoría, **no enviar desde dispositivos con zona horaria europea** (sección 9).
   - (c) **GeoIP de PostHog**, que usa la IP antes de descartarla. Recomendación: desactivarlo o filtrarlo.
5. **Lista de comprobación** para `programmer` en la sección 13; **riesgos residuales** que el dueño acepta en la sección 14; **datos que debe aportar el dueño** en la sección 15.

---

## 2. Qué datos se tratan exactamente

Con el esquema de `SPEC-T-F1-01.md` (sección 3) y el adaptador PostHog:

| Dato | Origen | ¿Sale del dispositivo? | Quién lo recibe | ¿Dato personal? |
|---|---|---|---|---|
| Propiedades de los eventos (bioma, Peligro, duración, causa de muerte, nivel, jefe, fusión, compras, calidad gráfica, tipo de dispositivo `movil`/`tablet`/`pc`, idioma `es`/`en`/`otro`, versión del juego) | Juego | Sí, con consentimiento | PostHog (UE) | Por sí solas, no identifican. Combinadas con la IP, sí pueden asociarse a una persona determinable [N] |
| `sid`: id de sesión aleatorio | Juego (memoria) | Sí | PostHog | Seudónimo de corta vida: une los eventos de **una** sesión |
| `cohort` (fecha de primera apertura) y `day_n` | `localStorage` | Sí, como propiedad | PostHog | Poca información (una fecha), pero se repite en todas las sesiones del mismo dispositivo: ver riesgo R4 |
| `t`: marca de tiempo del evento | Juego | Sí | PostHog | Junto con la IP, sí |
| Mensajes de error (`error.msg`, recortados, sin rutas ni URL) | `diag.js` | Sí | PostHog | No deberían contener datos personales; se sanean (sección 13) |
| **Dirección IP** | Red (inevitable) | Sí, en cada petición | PostHog: con "Discard client IP data" activado **no se guarda con el evento**, aunque los procesos de GeoIP la usan antes de descartarla [O, https://posthog.com/docs/privacy/data-storage] | **Sí.** En la UE la IP se considera dato personal en muchos contextos (TJUE, asunto Breyer, C-582/14) [N: no abierto en esta sesión] |
| País o ciudad derivados de la IP (GeoIP) | PostHog | Se generan en el servidor | PostHog | Sí, con la ciudad. **Desactivar** (sección 13) |
| Cabecera `User-Agent` | Navegador (automática) | Sí | PostHog | Puede ayudar a identificar un dispositivo. No se puede quitar en `fetch`. Si PostHog la guarda al recibir por API: [N] |
| Cabecera `Origin` | Navegador | Sí | PostHog | No: es el dominio del juego |
| Cabecera `Referer` | Navegador | **No**: se suprime con `referrerPolicy: 'no-referrer'` | — | — |
| Cookies | — | **No**: `credentials: 'omit'` y sin librería de PostHog | — | — |
| `iid` (id de instalación), contadores locales, cola, elección de consentimiento | `localStorage` | **No** | Nadie | Se queda en el dispositivo |

Lo que **no** se trata: nombre, correo, edad o fecha de nacimiento, ubicación precisa, contactos, texto libre del jugador, contenido del guardado, identificadores de publicidad, huella del navegador (no se calcula).

**¿Son datos anónimos?** Probablemente no del todo, por la IP en tránsito y por el `sid`. El TJUE (EDPS c. SRB, C-413/23 P, 4 de septiembre de 2025) sostuvo que los datos seudonimizados no son siempre personales para quien los recibe si no tiene medios razonables de reidentificar, pero siguen siéndolo para quien sí los tiene [S, por ejemplo https://www.cliffordchance.com/insights/resources/blogs/talking-tech/en/articles/2025/09/pseudonymized-data-after-edps-v-srb.html · https://www.jonesday.com/es/insights/2025/09/cjeu-clarifies-scope-of-personal-data-in-edps-v-srb-decision]. Como PostHog recibe la IP, **no nos apoyamos en el anonimato**: tratamos todo con las reglas de los datos personales y decimos "anónimo" en el aviso solo en el sentido de "sin datos que te identifiquen directamente". Ver riesgo R1 sobre la palabra "anónimo".

---

## 3. Qué normas aplican y quién es quién

| Papel | Quién | Nota |
|---|---|---|
| Responsable del tratamiento (RGPD) / Responsable (Ley 1581) | El dueño, con el nombre comercial **"Xitakha Studio" (marcador pendiente de confirmar)**, con domicilio en **Colombia** | Hay que aclarar si actúa como persona natural o como sociedad (sección 15) |
| Encargado del tratamiento | PostHog (región UE) | Contrato de encargo (DPA): sección 8 |
| Plataformas | GitHub Pages (aloja el juego), itch.io (aloja el juego en un iframe) | Tratan datos de navegación por su cuenta, con sus propias políticas; nuestra analítica no pasa por ellas |

| Régimen | ¿Por qué aplica? | Estado |
|---|---|---|
| **Colombia: Ley 1581 de 2012** (régimen general de protección de datos), **Decreto 1377 de 2013** (reglamentario, compilado en el Decreto 1074 de 2015, arts. 2.2.2.25.x) | El responsable está en Colombia y la base de datos la gestiona desde allí | [O] (ver fuentes en la sección 16) |
| **UE: RGPD** (Reglamento 2016/679) | Art. 3.2: un responsable de fuera de la UE que ofrece bienes o servicios (aunque sean gratuitos) a personas en la UE o controla su comportamiento en la UE queda sujeto al RGPD [N: texto del art. 3.2 no abierto; directrices del CEPD 3/2018 vistas por resumen, ver sección 9] | Juego en español e inglés, publicado en web abierta e itch.io: es razonable suponer que se ofrece a jugadores de la UE |
| **UE: directiva ePrivacy 2002/58/CE, art. 5.3**, y su transposición en cada país (España: **LSSI art. 22.2**) | Leer o guardar información en el terminal del usuario necesita consentimiento salvo que sea estrictamente necesario para el servicio que pide el usuario [O, resoluciones de la AEPD citadas por el buscador: https://www.aepd.es/es/documento/2014-0083.pdf] | Que la LSSI se aplique a un prestador establecido en Colombia es dudoso [N]; **se cumple igualmente** por prudencia y porque coincide con el principio del estudio |
| **EE. UU.: COPPA** (16 CFR 312) | Solo si el servicio está "dirigido a menores de 13" o se sabe que se recogen datos de menores de 13 | Sección 10 |

**Autoridades:** en Colombia, la **Superintendencia de Industria y Comercio (SIC)**, Delegatura para la Protección de Datos Personales [O]; en la UE, cualquier autoridad de control del Estado donde resida el jugador (en España, la AEPD); sin establecimiento en la UE no hay "autoridad principal" (ventanilla única) [N].

---

## 4. Base jurídica y por qué pedimos consentimiento aunque no haya cookies

1. **ePrivacy art. 5.3 no se limita a las cookies.** Cubre cualquier almacenamiento o acceso a información en el terminal. La AEPD lo dice expresamente para el art. 22.2 LSSI ("por razones de estilo se acude al término cookies", pero abarca cualquier dispositivo de almacenamiento y recuperación de datos) [O, vía buscador]. El CEPD (Directrices 2/2023, versión 2.0 adoptada el 7 de octubre de 2024 según el PDF oficial; otra fuente da el 16 de octubre) interpreta el ámbito de forma amplia: incluye que un programa en el dispositivo envíe información generada allí, y excluye el tratamiento que se queda por completo en el dispositivo [S sobre el borrador: https://www.covingtonblogs.com/2023/11/20/edpb-issues-draft-guidelines-on-technical-scope-of-eprivacy-directive-storage-and-access-rules/; PDF oficial no abierto: https://www.edpb.europa.eu/system/files/2025-02/edpb_guidelines_202302_technical_scope_art_53_eprivacydirective_v2_es.pdf]. Nuestro `track.js` guarda en `localStorage` la fecha de primera apertura y contadores, y **ordena al navegador enviar** información del dispositivo: entra de lleno.
2. **Las exenciones para medición de audiencia (AEPD, CNIL) no nos sirven con seguridad.**
   - La AEPD (guía de enero de 2024) admite exenciones para medición de audiencia con condiciones: finalidad solo estadística, datos agregados, sin reutilización para otros fines, trazadores de hasta 13 meses y conservación máxima de 25 meses, e información en la política [S: https://finreg360.com/alerta/la-aepd-publica-la-guia-uso-de-cookies-para-herramientas-de-medicion-de-audiencias/ · https://files.griddo.ecija.com/ecija-aedp-cookies-audiencias.pdf; guía oficial no abierta: https://WWW.AEPD.ES/guias/guia-cookies-analiticas-externas.pdf].
   - La CNIL tiene un régimen parecido. Según terceros, desde el 1 de enero de 2026 sustituyó la lista de herramientas exentas por una autoevaluación, y su propia página indicaba estar en revisión [S: https://matomo.org/blog/2026/01/privacy-regulations-changes-2026-analytics/ · https://clickport.io/blog/privacy-analytics-france; oficial: https://www.cnil.fr/en/sheet-ndeg16-use-analytics-your-websites-and-applications].
   - Las exenciones se piensan para la medición "página por página" de un sitio. Nuestro esquema mide comportamiento dentro del juego (embudos, dificultad), lo que va más allá [N, inferencia]. Además, **Colombia no tiene exención equivalente**: allí rige la autorización previa con carácter general (siguiente punto).
3. **Colombia:** el principio de libertad exige consentimiento **previo, expreso e informado** del titular [O, Ley 1581 art. 4, vía buscador]. Colombia no tiene una ley específica de cookies; si una cookie o tecnología similar recoge datos personales, aplica la Ley 1581 [S: https://www.asuntoslegales.com.co/consumidor/conozca-los-aspectos-legales-que-debe-tener-en-cuenta-al-usar-cookies-en-sitios-web-3375211].
4. **RGPD:** con ePrivacy exigiendo consentimiento para el acceso al terminal, lo coherente es usar también el **consentimiento (art. 6.1.a)** como base del tratamiento posterior. El interés legítimo (art. 6.1.f) sería discutible y no sirve para la parte de ePrivacy [N].

**Conclusión:** consentimiento previo, libre, específico, informado e inequívoco, tan fácil de retirar como de dar, con prueba de que se dio. El diseño ya lo tiene. Solo falta la prueba (sección 6).

---

## 5. Qué exige cada régimen y cuál es el más estricto

| Punto | UE (RGPD + ePrivacy) | Colombia (Ley 1581 + Decreto 1377) | EE. UU. (COPPA) | Más estricto y qué hacemos |
|---|---|---|---|---|
| Consentimiento | Previo al acceso al terminal; libre, específico, informado, inequívoco; retirada tan fácil como darlo (RGPD art. 7) [N texto] | Autorización previa, expresa e informada [O]; el responsable debe **conservar prueba** de la autorización [N: Ley 1581 art. 17.b, de memoria] | Consentimiento verificable de los padres solo si hay datos personales de menores de 13 [O, resumen] | **Empate UE/Colombia; Colombia añade la prueba.** Opt-in con dos botones iguales y registro de la prueba sin identificar al jugador (sección 6) |
| Información al usuario | RGPD art. 13: identidad y contacto, finalidades, base, destinatarios, transferencias, plazo, derechos, retirada, reclamación ante autoridad [N texto] | Aviso de privacidad con nombre o razón social y datos de contacto del responsable, tratamiento y finalidad, derechos y cómo consultar la política [O, Decreto 1074 art. 2.2.2.25.3.3 vía buscador] + **política de tratamiento** con contenido mínimo (incluye domicilio, correo y teléfono según la lectura habitual del art. 13 del Decreto 1377: [N], el buscador no confirmó la lista completa) y fecha de entrada en vigencia | Política que explique los identificadores persistentes y su uso interno [S] | **Colombia** en forma (pide una política de tratamiento completa y datos de contacto físicos); **UE** en contenido (transferencias, plazo, autoridad). Política única que cumple ambos (sección 11) |
| Menores | 13 a 16 años según el país (16 por defecto, art. 8); España: 14 (LOPDGDD art. 7) [O, FAQ de la AEPD: https://www.aepd.es/preguntas-frecuentes/10-menores-y-educacion/FAQ-1001-cual-es-la-edad-para-que-los-menores-puedan-prestar-consentimiento-para-tratar-sus-datos-personales] | Tratamiento de datos de niños, niñas y adolescentes (**menores de 18**) prohibido salvo datos públicos o si respeta su interés superior y sus derechos fundamentales, **con autorización del representante legal** [O/S, Ley 1581 art. 7 y Decreto 1377 art. 12, vía conceptos de la SIC citados por el buscador] | Menores de 13 | **Colombia (18).** "Aceptar" solo para mayores de 18 (sección 10) |
| Derechos | Acceso, rectificación, supresión, limitación, oposición, portabilidad, retirada del consentimiento, reclamación ante la autoridad; art. 11 si no se puede identificar al interesado [N texto] | Conocer, actualizar, rectificar, pedir prueba de la autorización, ser informado del uso, quejarse ante la SIC, revocar y suprimir, acceso gratuito [N: Ley 1581 art. 8, de memoria]; plazos: consultas 10 días hábiles (+5) y reclamos 15 días hábiles (+8) [O, Ley 1581 arts. 14 y 15 vía buscador] | — | **Colombia en plazos** (10 y 15 días hábiles, más cortos que el mes del RGPD [N]). Se adoptan esos plazos (sección 7) |
| Conservación | Limitación del plazo (art. 5.1.e); referencia de la AEPD para medición: 25 meses como máximo [S] | Solo el tiempo necesario para la finalidad [N] | — | **13 meses** de eventos en bruto (por debajo de las referencias) |
| Transferencias / encargados | Encargado con contrato (art. 28); transferencia fuera del EEE con garantías (cláusulas tipo, etc.) [N texto] | Transmisión a un encargado con contrato de transmisión [N: Decreto 1377 art. 25, de memoria]; transferencia internacional a países con nivel adecuado: la SIC incluyó a los miembros de la UE y a EE. UU. en su lista (Circular Externa 005 de 2017) [S: https://www.hklaw.com/en/insights/publications/2017/08/cambios-en-la-transferencia-de-datos-personales-a · https://www.bu.com.co/es/insights/noticias/circular-externa-005-del-10082017; vigencia actual no confirmada] | — | Ambos: **DPA de PostHog** con cláusulas tipo (sección 8), revisado para que sirva también como contrato de transmisión colombiano |
| Registro | Registro de actividades (art. 30); la exención de menos de 250 empleados no aplica si el tratamiento no es ocasional [N] | Registro Nacional de Bases de Datos (RNBD): **no obligatorio para personas naturales** ni para sociedades con activos de hasta 100.000 UVT (Decreto 090 de 2018), que siguen sujetas al resto de la ley [S: https://actualicese.com/archivo/decreto-090-de-18-01-2018/ · https://www.bu.com.co/es/insights/noticias/empresas-bajo-la-lupa-de-la-sic-para-el-registro-de-bases-de-datos] | — | **UE**: llevar un registro interno simplificado (sección 12). RNBD probablemente no aplica |
| Representante | Art. 27 para responsables de fuera de la UE sujetos al art. 3.2, salvo tratamiento ocasional y de bajo riesgo [S] | — | — | **UE**: sección 9 |
| Brechas de seguridad | Notificar a la autoridad en 72 h si hay riesgo (art. 33) [N] | Informar a la SIC de violaciones de los códigos de seguridad [N: Ley 1581 art. 17.n, de memoria] | — | Plan mínimo: si se filtra la clave o PostHog notifica un incidente, el dueño evalúa y notifica |

---

## 6. Prueba del consentimiento sin identificar a nadie

- Cada aviso lleva una **versión** (`pv`, por ejemplo `2026-11-14a`), y el texto de cada versión queda en el repositorio (este documento y la spec).
- Al pulsar "Aceptar" se guarda en local `{consent: true, pv, at}` y se envía `analytics_on` con `pv` y la fecha. Todos los eventos llevan `pv`.
- Así, para cada sesión que envió datos existe en PostHog la prueba de que esa sesión aceptó una versión concreta del aviso, sin necesitar un id del jugador. Es una **interpretación nuestra** de cómo cumplir el deber colombiano de conservar la prueba con datos mínimos [N]; hay que confirmarlo con un profesional (riesgo R6).

---

## 7. Derechos del usuario y cómo ejercerlos sin identificador

| Derecho | Cómo se atiende |
|---|---|
| Retirar el consentimiento / revocar | Ajustes > Privacidad > interruptor. Efecto inmediato: no se envía nada más y se vacía la cola |
| Supresión de lo guardado en el dispositivo | Ajustes > Privacidad > "Borrar datos de analítica de este dispositivo" |
| Acceso a lo que se envía | Ajustes > Privacidad > "Ver qué se envía": muestra los últimos eventos de la cola y del último envío (local) |
| Acceso, supresión o prueba de autorización en PostHog | Ajustes muestra los **ids de las últimas 10 sesiones** (guardados solo en local, solo con consentimiento). El jugador los copia y escribe a `[CORREO DE CONTACTO]`. El dueño busca esos `distinct_id` en PostHog y responde o borra. Que PostHog permita borrar eventos por `distinct_id` en el plan gratuito: [N] |
| Si no aporta ids | Se le explica que no podemos identificarle porque no guardamos datos que lo permitan (RGPD art. 11 [N texto]); se le indica cómo retirar el consentimiento |
| Reclamación | Ante la SIC (Colombia) o la autoridad de su país de la UE; se dice en la política |
| Plazos de respuesta | Consultas en 10 días hábiles y reclamos en 15 días hábiles (el más estricto, Colombia [O]) |

---

## 8. PostHog como encargado; transferencias

- **Región UE:** según la lista de subencargados de PostHog, los datos de PostHog Cloud EU se guardan en AWS en Alemania [O, vía buscador: https://posthog.com/subprocessors]; terceros indican Frankfurt (eu-central-1) [S]. Hay otros subencargados (seguridad, bases de datos) cuya ubicación, según la misma página, sigue la región elegida [O, vía buscador]. **Que el soporte o la ingeniería de PostHog no accedan desde EE. UU.: no verificado [N]**; PostHog Inc. es una empresa estadounidense [S].
- **DPA:** el DPA de PostHog incorpora las cláusulas contractuales tipo de 2021 (Decisión 2021/914), módulo 2 [O, copia del PDF vía buscador: https://storage.googleapis.com/legal-public/PostHog%20Data%20Processing%20Agreement.pdf; página: https://posthog.com/dpa]. Según un tercero, PostHog firma el DPA a petición y ofrece un generador [S: https://complydog.com/blog/is-posthog-gdpr-compliant]. Si PostHog usa el Marco de Privacidad de Datos UE-EE. UU.: no encontrado [N].
- **IP:** el ajuste "Discard client IP data" (Settings > Project > IP data capture configuration) evita guardar la IP con los eventos; GeoIP y la detección de bots pueden usarla antes; según la doc. oficial, las organizaciones de la UE tienen la captura de IP desactivada por defecto [O, https://posthog.com/docs/privacy/data-storage vía buscador]. **Comprobarlo en la consola**, no darlo por hecho.
- **Colombia:** enviar a un encargado en la UE es una "transmisión"; la UE y EE. UU. figuraban en la lista de países adecuados de la SIC de 2017 [S]. El DPA de PostHog es un contrato pensado para el RGPD; si satisface el contenido del contrato de transmisión del Decreto 1377: [N] (riesgo R7).
- **Acción del dueño:** aceptar o generar el DPA en la consola de PostHog, guardar el PDF fuera del repositorio y anotar la fecha.

---

## 9. Ámbito del RGPD y representante en la UE (art. 27)

- Un responsable sin establecimiento en la UE al que se aplica el art. 3.2 debe designar por escrito un representante en la UE, salvo que el tratamiento sea **ocasional**, no incluya a gran escala categorías especiales de datos y sea improbable que suponga un riesgo [S: resúmenes de las Directrices 3/2018 del CEPD, versión 2.0 de 12 de noviembre de 2019: https://bdkadvokati.com/does-gdpr-apply-to-a-non-eu-entity-edpb-provides-a-guidance · https://www.datarep.com/?p=4533]. El CEPD entiende "ocasional" como lo que no se hace de forma regular y queda fuera del curso normal de la actividad [S].
- **Nuestra analítica es continua**, así que **lo más probable es que la excepción no aplique** y haga falta representante si se envían datos de jugadores de la UE [N, inferencia nuestra que coincide con la de los resúmenes].
- Hay servicios comerciales de representante RGPD; **no conocemos su precio** y no se inventa.
- **Opciones, de más a menos conservadora:**
  1. **Recomendada mientras no haya asesoría:** el juego **no envía analítica desde dispositivos con zona horaria europea** (`Intl.DateTimeFormat().resolvedOptions().timeZone` empieza por `Europe/`, o es `Atlantic/Canary`, `Atlantic/Madeira`, `Atlantic/Azores`, `Atlantic/Faroe`, `Atlantic/Reykjavik`, `Arctic/Longyearbyen`; lista que confirmará `programmer`). En esos dispositivos no se muestra el aviso y no sale nada; el juego y el resumen local funcionan igual. Es imperfecto (VPN, zonas mal configuradas), pero reduce mucho el tratamiento de datos de la UE. Como esto se decide en el propio dispositivo y no se envía, no es un dato tratado.
  2. Designar un representante en la UE y añadirlo a la política.
  3. Enviar desde la UE sin representante: **riesgo aceptado** (R2).
- La misma lógica vale para el Reino Unido (UK GDPR) [N]: la opción 1 la cubre.
- **Esto cambia la decisión del dueño** de "enviar en Pages e itch" solo para los dispositivos de Europa. Necesita su confirmación (sección 15).

---

## 10. Menores

- **Colombia:** se protege a niños, niñas y adolescentes (menores de 18). Su tratamiento está prohibido salvo datos de naturaleza pública o si respeta su interés superior y sus derechos fundamentales, con la autorización de su representante legal [O/S, ver sección 5]. No tenemos manera de obtener esa autorización en un juego web.
- **UE:** el consentimiento de un menor solo vale a partir de la edad que fije cada país (13 a 16); en España, 14 [O].
- **COPPA:** aplica a servicios "dirigidos a menores de 13" o a operadores que sepan que recogen datos de menores de 13. Entre los datos personales están los identificadores persistentes, incluida la IP, con una excepción para el "soporte de operaciones internas" si es lo único que se recoge y no se usa para contactar al menor ni para publicidad. Las enmiendas de 2025 entraron en vigor el 23 de junio de 2025, con cumplimiento hasta el 22 de abril de 2026, y exigen explicar en la política para qué se usan esos identificadores [S: https://www.skadden.com/insights/publications/2025/01/ftc-finalizes-long-awaited-child-online-privacy · https://www.lw.com/en/insights/2025/05/ftc-publishes-updates-to-coppa-rule; oficial no abierto: https://www.federalregister.gov/documents/2025/04/22/2025-05904/childrens-online-privacy-protection-rule]. El estilo del juego (personajes animales, aldea) **podría pesar** en la prueba de "dirigido a menores" [N] (riesgo R3).
- **Recomendación conservadora (la más estricta, Colombia):**
  - El juego se declara **no dirigido a menores** (coherente con T-F3-01).
  - El botón dice "**Acepto (tengo 18 años o más)**" y el aviso pide a los menores de 18 que pulsen "No, gracias".
  - No se pide la fecha de nacimiento (sería otro dato) ni se guarda la edad.
  - No hay publicidad ni contacto con el jugador a partir de estos datos.
  - Si el dueño sabe que un menor envió datos, borra las sesiones indicadas.
  - Coste: perdemos datos de adolescentes, una parte probablemente grande del público de juegos web (estimación, sin dato). Alternativa menos estricta (16, umbral por defecto del RGPD): riesgo R3.

---

## 11. Textos

### 11.1 Aviso en el juego (sustituye a la sección 5.2-5.3 de la spec; versión `pv = 2026-11-14a`)

**Español**

> **¿Nos ayudas a mejorar Swarm Hand?**
> Si aceptas, el juego enviará estadísticas de partida (bioma, duración, qué jefe te vence, errores del juego) a nuestro servicio de analítica, PostHog, con servidores en la Unión Europea. No enviamos tu nombre, ni tu correo, ni ningún identificador que te siga entre sesiones o dispositivos. Tu dirección IP llega al servidor al enviar, pero hemos configurado el servicio para no guardarla. Sin aceptar, nada sale de tu dispositivo y el juego es exactamente igual.
> Puedes retirar tu permiso cuando quieras en Ajustes > Privacidad.
> Si tienes menos de 18 años, pulsa "No, gracias".
> [ Acepto (tengo 18 años o más) ]  [ No, gracias ]  · Política de privacidad

**English**

> **Help us improve Swarm Hand?**
> If you accept, the game will send gameplay statistics (biome, run length, which boss beats you, game errors) to our analytics service, PostHog, with servers in the European Union. We never send your name, your email or any identifier that follows you across sessions or devices. Your IP address reaches the server when data is sent, but we have set the service not to store it. If you don't accept, nothing leaves your device and the game is exactly the same.
> You can withdraw your permission at any time in Settings > Privacy.
> If you are under 18, please tap "No, thanks".
> [ I accept (I am 18 or older) ]  [ No, thanks ]  · Privacy policy

### 11.2 Política de privacidad (para publicar en `privacy.html`)

Marcadores que hay que sustituir antes de publicar: `[NOMBRE DEL RESPONSABLE]` (provisional: **Xitakha Studio**, pendiente de confirmar), `[TIPO E IDENTIFICACIÓN]`, `[DOMICILIO]`, `[CORREO DE CONTACTO]`, `[TELÉFONO]`, `[FECHA DE VIGENCIA]`, `[URL]`, `[REPRESENTANTE UE]` (solo si se designa; si no, se borra la frase). **No escribir el correo real en el repositorio hasta que el coordinador lo confirme.**

---

#### Política de privacidad y de tratamiento de datos personales de Swarm Hand

Versión 2026-11-14a · Vigente desde [FECHA DE VIGENCIA]

**1. Quién es el responsable**
[NOMBRE DEL RESPONSABLE] ([TIPO E IDENTIFICACIÓN]), con domicilio en [DOMICILIO], Colombia. Contacto para todo lo relativo a tus datos: [CORREO DE CONTACTO] · [TELÉFONO].
[REPRESENTANTE UE: Nuestro representante en la Unión Europea a efectos del artículo 27 del RGPD es … , contacto … .]

**2. A qué se aplica**
A Swarm Hand en [URL] (GitHub Pages, incluida la versión instalable) y en itch.io. En portales de juegos (por ejemplo CrazyGames o Poki), Swarm Hand no envía datos a ningún servicio nuestro; allí aplica la política del portal.

**3. Qué datos tratamos y para qué**
- **Sin tu permiso no enviamos nada.** El juego guarda en tu dispositivo tu progreso y tus ajustes para poder funcionar; eso no sale de él.
- **Con tu permiso** (botón "Acepto" del aviso o interruptor en Ajustes > Privacidad), el juego envía estadísticas de partida: qué zona y nivel de peligro juegas, cuánto dura la partida, cómo termina, qué jefes aparecen y quién gana, qué fusiones y compras haces, qué calidad gráfica usa el juego, tipo de dispositivo (móvil, tableta u ordenador), idioma (español, inglés u otro), versión del juego, errores técnicos, la fecha de tu primera partida y cuántos días han pasado desde entonces, y un código aleatorio que solo vale para la sesión en curso.
- **No enviamos** tu nombre, tu correo, tu edad, tu ubicación precisa ni ningún identificador que te siga entre sesiones o dispositivos. No usamos estos datos para publicidad, no los vendemos, no hacemos perfiles de ti y no tomamos decisiones automatizadas sobre ti.
- Tu **dirección IP** y los datos técnicos que tu navegador envía siempre (por ejemplo el tipo de navegador) llegan a nuestro proveedor con cada envío; lo hemos configurado para no guardar la IP.
- **Para qué:** entender qué partes del juego divierten, cuáles son demasiado difíciles, dónde abandona la gente y qué errores hay, para mejorar el juego.
- Esta información estadística no te identifica directamente; aun así la tratamos con las garantías de los datos personales.

**4. Base legal**
Tu consentimiento previo, expreso e informado (Ley 1581 de 2012 de Colombia; artículo 6.1.a del Reglamento General de Protección de Datos de la UE, RGPD; y normas sobre el acceso al dispositivo, como el artículo 5.3 de la Directiva 2002/58/CE). Darlo es voluntario y no cambia nada del juego. Puedes retirarlo cuando quieras con la misma facilidad con que lo diste; la retirada no afecta a lo enviado antes.

**5. Menores de edad**
Swarm Hand no está dirigido a menores. Si tienes menos de 18 años, no aceptes el envío de estadísticas; el juego funciona igual. Si sabemos que se enviaron datos de un menor, los borraremos. Si eres madre, padre o tutor y crees que tu hijo o hija aceptó, escríbenos (punto 8).

**6. Quién recibe los datos**
Nuestro proveedor de analítica, **PostHog Inc.**, como encargado del tratamiento, con los datos alojados en su región de la Unión Europea (Alemania). Hemos aceptado su acuerdo de tratamiento de datos, que incluye las cláusulas contractuales tipo de la Comisión Europea para cualquier acceso desde fuera de la UE. Al enviar datos de Colombia a la UE se produce una transmisión internacional de datos a un encargado. No cedemos los datos a nadie más, salvo obligación legal.

**7. Cuánto tiempo los guardamos**
Las estadísticas de cada evento se guardan como máximo 13 meses y después se borran. Los totales agregados (por ejemplo "porcentaje de victorias contra un jefe") pueden conservarse porque ya no se refieren a nadie. Lo que guarda tu dispositivo se queda allí hasta que lo borres.

**8. Tus derechos y cómo ejercerlos**
Tienes derecho a conocer, acceder, actualizar, rectificar y suprimir tus datos, a pedir la prueba de tu autorización, a ser informado del uso que les damos, a revocar tu autorización, a oponerte y a limitar el tratamiento, y a la portabilidad cuando proceda. El ejercicio es gratuito.
- **En el juego:** Ajustes > Privacidad permite retirar el permiso, ver qué se envía y borrar los datos de analítica de tu dispositivo.
- **En nuestro proveedor:** como no guardamos datos que te identifiquen, necesitamos que nos ayudes a encontrar los tuyos. En Ajustes > Privacidad verás los códigos de tus últimas sesiones; cópialos y envíalos a [CORREO DE CONTACTO] indicando qué quieres hacer. Sin esos códigos no podremos localizar tus datos, porque no tenemos forma de saber cuáles son tuyos.
- **Plazos:** respondemos a las consultas en un máximo de 10 días hábiles y a los reclamos en un máximo de 15 días hábiles. Si no fuera posible, te diremos por qué y cuándo responderemos, dentro de los márgenes que permite la ley.
- **Reclamaciones:** puedes quejarte ante la **Superintendencia de Industria y Comercio** de Colombia (www.sic.gov.co) o, si vives en la Unión Europea, ante la autoridad de protección de datos de tu país (en España, la Agencia Española de Protección de Datos, www.aepd.es). Te agradeceremos que primero nos escribas para intentar resolverlo.

**9. Seguridad**
Los datos viajan cifrados (HTTPS). El juego no usa cookies para la analítica ni la librería de seguimiento del proveedor; solo envía los datos descritos.

**10. Cambios**
Si cambiamos esta política de forma importante, el juego te volverá a pedir permiso antes de enviar nada con las condiciones nuevas. Versiones anteriores: disponibles a petición.

---

#### Privacy and personal data processing policy of Swarm Hand

Version 2026-11-14a · Effective from [EFFECTIVE DATE]

**1. Who is responsible**
[CONTROLLER NAME] ([TYPE AND ID]), with registered address at [ADDRESS], Colombia. Contact for anything related to your data: [CONTACT EMAIL] · [PHONE].
[EU REPRESENTATIVE: Our representative in the European Union under Article 27 GDPR is … , contact … .]

**2. Scope**
Swarm Hand at [URL] (GitHub Pages, including the installable version) and on itch.io. On game portals (for example CrazyGames or Poki), Swarm Hand sends no data to any service of ours; the portal's policy applies there.

**3. What data we process and why**
- **Without your permission we send nothing.** The game stores your progress and settings on your device so it can work; that never leaves it.
- **With your permission** ("I accept" button in the notice, or the switch in Settings > Privacy), the game sends gameplay statistics: which area and danger level you play, how long a run lasts, how it ends, which bosses appear and who wins, which fusions and purchases you make, the graphics quality in use, device type (phone, tablet or computer), language (Spanish, English or other), game version, technical errors, the date of your first game and how many days have passed since, and a random code that is only valid for the current session.
- **We do not send** your name, email, age, precise location or any identifier that follows you across sessions or devices. We do not use this data for advertising, we do not sell it, we do not profile you and we make no automated decisions about you.
- Your **IP address** and the technical data your browser always sends (for example browser type) reach our provider with each transmission; we have configured it not to store the IP.
- **Purpose:** understanding which parts of the game are fun, which are too hard, where people stop playing and which errors occur, in order to improve the game.
- These statistics do not directly identify you; even so, we handle them with the safeguards that apply to personal data.

**4. Legal basis**
Your prior, express and informed consent (Colombian Law 1581 of 2012; Article 6(1)(a) of the EU General Data Protection Regulation, GDPR; and rules on access to your device, such as Article 5(3) of Directive 2002/58/EC). Giving it is optional and changes nothing in the game. You can withdraw it at any time as easily as you gave it; withdrawal does not affect data already sent.

**5. Minors**
Swarm Hand is not directed at minors. If you are under 18, do not accept sending statistics; the game works the same. If we learn that a minor's data was sent, we will delete it. If you are a parent or guardian and believe your child accepted, contact us (section 8).

**6. Who receives the data**
Our analytics provider, **PostHog Inc.**, as data processor, with the data hosted in its European Union region (Germany). We have accepted its data processing agreement, which includes the European Commission's standard contractual clauses for any access from outside the EU. Sending data from Colombia to the EU is an international transmission of data to a processor. We share the data with no one else, unless required by law.

**7. How long we keep it**
Event-level statistics are kept for at most 13 months and then deleted. Aggregated totals (for example "win rate against a boss") may be kept because they no longer relate to anyone. What your device stores stays there until you delete it.

**8. Your rights and how to exercise them**
You have the right to know, access, update, correct and delete your data, to request proof of your consent, to be informed of how we use it, to withdraw your consent, to object and to restrict processing, and to portability where applicable. Exercising them is free.
- **In the game:** Settings > Privacy lets you withdraw permission, see what is sent and delete the analytics data on your device.
- **At our provider:** since we keep no data that identifies you, we need your help to find yours. In Settings > Privacy you will see the codes of your latest sessions; copy them and send them to [CONTACT EMAIL] saying what you want us to do. Without those codes we cannot find your data, because we have no way of knowing which data is yours.
- **Response times:** we answer queries within 10 business days and complaints within 15 business days at most. If that is not possible, we will tell you why and when we will answer, within the limits allowed by law.
- **Complaints:** you can complain to Colombia's **Superintendencia de Industria y Comercio** (www.sic.gov.co) or, if you live in the European Union, to your country's data protection authority. We would appreciate it if you contacted us first so we can try to solve it.

**9. Security**
Data travels encrypted (HTTPS). The game uses no cookies for analytics and does not load the provider's tracking library; it only sends the data described above.

**10. Changes**
If we change this policy in a significant way, the game will ask for your permission again before sending anything under the new terms. Previous versions are available on request.

---

## 12. Registro de actividades de tratamiento (simplificado)

| Campo | Contenido |
|---|---|
| Tratamiento | Analítica de uso de Swarm Hand |
| Responsable | [NOMBRE DEL RESPONSABLE] (provisional: Xitakha Studio), Colombia, [CORREO DE CONTACTO] |
| Representante UE | Ninguno; se evita con el filtro por zona horaria (sección 9) o [REPRESENTANTE UE] |
| Finalidad | Mejorar diversión, dificultad, retención y estabilidad del juego |
| Base | Consentimiento (RGPD 6.1.a; Ley 1581 art. 9 [N]; ePrivacy 5.3) |
| Categorías de interesados | Jugadores mayores de 18 años que aceptan |
| Categorías de datos | Eventos de juego, id de sesión, fecha de cohorte, versión, tipo de dispositivo, idioma, errores; IP en tránsito (no guardada) |
| Categorías especiales | Ninguna |
| Destinatarios | PostHog Inc. (encargado), región UE |
| Transferencias | Colombia → UE (transmisión a encargado); posible acceso desde EE. UU. con cláusulas tipo |
| Plazo | 13 meses los eventos; agregados sin límite |
| Medidas | Opt-in, sin id persistente, IP descartada, GeoIP desactivado, HTTPS, sin cookies, clave secreta nunca en el cliente, acceso a la consola solo del dueño con segundo factor |
| Fecha | 2026-11-14; revisar cada vez que cambie el esquema (`sv`) o el aviso (`pv`) |

Evaluación de impacto (EIPD): no parece necesaria (sin categorías especiales, sin perfiles, sin decisiones automatizadas, volumen pequeño) [N]; volver a valorarlo si cambia el esquema.

---

## 13. Lista de comprobación de implementación (para `programmer` y para el dueño)

**Código (`programmer`)**
- [ ] Ninguna petición a otro origen antes de `consent === true` (prueba 11 de la spec, con `page.route('**')`).
- [ ] **Antes del consentimiento no se escribe nada de analítica en `localStorage`**: la cola previa vive solo en memoria. `cohort` se guarda al aceptar. Si se acepta tarde (desde Ajustes), `cohort` es la fecha de aceptación y se marca `late: true` para excluirlo de la retención.
- [ ] Sí se puede guardar la **elección** ("No, gracias") para no volver a preguntar: es el propio mecanismo de consentimiento [N].
- [ ] Botones "Acepto (tengo 18 años o más)" y "No, gracias" del mismo tamaño, color y peso; sin casillas premarcadas; cerrar el aviso de otra forma equivale a "No, gracias".
- [ ] Ajustes > Privacidad: interruptor (efecto inmediato, vacía la cola), "Ver qué se envía", "Ids de mis últimas sesiones" (copiables), "Borrar datos de analítica", enlace a la política.
- [ ] `fetch` con `credentials: 'omit'`, `referrerPolicy: 'no-referrer'`, `keepalive: true`; sin librería de PostHog; sin cookies.
- [ ] `distinct_id = sid` (nuevo en cada sesión, solo en memoria); nada de `iid` en la red.
- [ ] Todos los eventos con `pv` (versión del aviso); `analytics_on` con `pv` y fecha.
- [ ] Cambiar el texto del aviso cambia `pv` y vuelve a pedir el consentimiento.
- [ ] Mensajes de error saneados: sin URL, rutas, correos ni números largos (expresiones regulares), 120 caracteres.
- [ ] Filtro por zona horaria europea (sección 9) si el dueño lo confirma: ni aviso ni envío.
- [ ] `localStorage` no disponible (itch en iframe, modo privado): sin aviso y sin envío (no podemos recordar la elección ni la retirada).
- [ ] Apagada en `navigator.webdriver`, `?dev=1`, `localhost`, sin clave, en builds de portal.
- [ ] La clave del repositorio es solo la pública (`phc_…`). Ninguna clave personal (`phx_…`) en el código, en el repositorio ni en el chat.

**Consola de PostHog (el dueño)**
- [ ] Región UE.
- [ ] "Discard client IP data" activado (Settings > Project > IP data capture configuration) [O].
- [ ] GeoIP desactivado o filtrado para que no se guarden ciudad ni coordenadas; si solo se puede dejar el país, anotarlo y avisarnos [N: cómo se hace en la consola actual].
- [ ] Grabación de sesiones, encuestas, mapas de calor y "autocapture" desactivados (no usamos la librería, pero mejor apagado).
- [ ] DPA aceptado o generado; PDF guardado fuera del repositorio.
- [ ] Segundo factor en la cuenta.
- [ ] Recordatorio para borrar eventos de más de 13 meses si PostHog los guarda más tiempo [N: retención por defecto del plan gratuito].

**Publicación**
- [ ] `privacy.html` publicada con los marcadores sustituidos y enlazada desde el aviso, desde Ajustes y desde la ficha de itch.io.
- [ ] Ficha de itch.io: frase "Este juego envía estadísticas anónimas solo si aceptas; ver política" con enlace.

---

## 14. Riesgos residuales si se publica sin revisión profesional

| # | Riesgo | Probabilidad / impacto (estimación) | Recomendación conservadora |
|---|---|---|---|
| R1 | Llamar "anónimo" a algo que, por la IP en tránsito y el id de sesión, puede considerarse seudónimo | Media / bajo | En el aviso y la política no prometer "anónimo" sin más; usar "sin datos que te identifiquen directamente" (ya hecho en 11.1 y 11.2) |
| R2 | El RGPD aplica y hace falta representante en la UE (art. 27) | Media-alta si se envían datos desde la UE / medio | Filtro por zona horaria europea hasta tener representante o asesoría |
| R3 | Datos de menores: autorización del representante en Colombia (menores de 18); COPPA por estilo visual | Media / alto | Umbral de 18 años en el botón; juego no dirigido a menores; borrar si se sabe |
| R4 | `cohort` + `day_n` + IP en tránsito permiten enlazar sesiones del mismo dispositivo (seudónimo débil) | Baja / bajo | IP descartada; no exportar datos en bruto; si un profesional lo ve problemático, enviar solo `day_n` en `day_return` y `cohort` por semanas |
| R5 | PostHog guarda o usa más de lo configurado (User-Agent, GeoIP, accesos desde EE. UU.) | Baja-media / medio | Revisar la consola tras el primer día de datos y comprobar qué propiedades aparecen; avisarnos si hay `$ip`, ciudad o similares |
| R6 | La prueba de autorización sin identificador no satisface a la SIC | Media / bajo-medio | `pv` en cada evento y `analytics_on` por sesión; guardar cada versión del aviso con su fecha |
| R7 | El DPA de PostHog no cubre todo el contenido del contrato de transmisión colombiano | Media / bajo | Que un profesional colombiano lo mire una vez; mientras, conservar el DPA firmado |
| R8 | Obligaciones de información del prestador (por ejemplo, datos de identificación en la web) en Colombia o en la UE para servicios con actividad económica (donaciones) | Media / bajo | Publicar en la política nombre, identificación, domicilio y contacto completos |
| R9 | Exenciones nacionales y textos legales citados de memoria o por resumen (sección 0) | — / medio | Permitir los dominios oficiales y repetir la verificación, o pedir revisión profesional |
| R10 | itch.io tiene normas propias sobre datos en juegos que no encontramos | Baja / bajo | Leer los términos de itch.io (https://itch.io/about/terms) antes de activar el envío allí |

Si el dueño publica sin revisión profesional, **acepta estos riesgos**. Lo más prudente sería implementar con el adaptador `none` en producción y activar PostHog cuando estén resueltos al menos R2 y R3 (filtro europeo y umbral de 18 años implementados) y la política publicada con los datos reales.

---

## 15. Datos que el dueño debe aportar

1. **Nombre del responsable** tal como debe aparecer: "Xitakha Studio" es un marcador **pendiente de confirmar**. ¿Es nombre comercial de una persona natural o una sociedad registrada?
2. **Tipo e identificación:** persona natural o jurídica; si es sociedad, razón social y NIT. Si es persona natural, si quiere publicar su nombre completo (en Colombia la política exige identificar al responsable [N]).
3. **Domicilio** (ciudad y dirección, o al menos ciudad, según lo que confirme un profesional), **país: Colombia** (dato ya aportado).
4. **Correo de contacto** para la política: queda como `[CORREO DE CONTACTO]` hasta que el coordinador confirme que puede publicarse.
5. **Teléfono de contacto** (habitual en las políticas colombianas [N]); si no quiere publicar uno, decírnoslo para valorarlo.
6. **Fecha de vigencia** y **URL** donde se publicará la política.
7. **Decisiones:** (a) ¿acepta el umbral de 18 años? (b) ¿acepta el filtro por zona horaria europea mientras no haya representante en la UE? (c) ¿quiere designar un representante en la UE?

---

## 16. Fuentes (consultadas el 2026-11-14; ninguna abierta directamente, ver sección 0)

UE y España
- Directrices 2/2023 del CEPD (ámbito técnico del art. 5.3): https://www.edpb.europa.eu/system/files/2025-02/edpb_guidelines_202302_technical_scope_art_53_eprivacydirective_v2_es.pdf · resumen del borrador: https://www.covingtonblogs.com/2023/11/20/edpb-issues-draft-guidelines-on-technical-scope-of-eprivacy-directive-storage-and-access-rules/
- Directrices 3/2018 del CEPD (ámbito territorial y representante): resúmenes en https://bdkadvokati.com/does-gdpr-apply-to-a-non-eu-entity-edpb-provides-a-guidance · https://www.datarep.com/?p=4533 · https://mccannfitzgerald.com/knowledge/gdpr/five-key-elements-of-the-role-of-a-gdpr-representative
- LSSI art. 22.2 (vía resoluciones de la AEPD): https://www.aepd.es/es/documento/2014-0083.pdf
- AEPD, guía de cookies para medición de audiencia (enero de 2024): https://WWW.AEPD.ES/guias/guia-cookies-analiticas-externas.pdf · https://finreg360.com/alerta/la-aepd-publica-la-guia-uso-de-cookies-para-herramientas-de-medicion-de-audiencias/ · https://files.griddo.ecija.com/ecija-aedp-cookies-audiencias.pdf · https://www.iubenda.com/es/blog/understanding-the-spanish-dpa-guide-on-audience-measurement-cookies/
- AEPD, edad de consentimiento (LOPDGDD art. 7): https://www.aepd.es/preguntas-frecuentes/10-menores-y-educacion/FAQ-1001-cual-es-la-edad-para-que-los-menores-puedan-prestar-consentimiento-para-tratar-sus-datos-personales · https://www.aepd.es/infografias/infografia-consentimiento-menores.pdf
- CNIL, medición de audiencia: https://www.cnil.fr/en/sheet-ndeg16-use-analytics-your-websites-and-applications · cambios de 2026 (terceros): https://matomo.org/blog/2026/01/privacy-regulations-changes-2026-analytics/ · https://clickport.io/blog/privacy-analytics-france
- TJUE, EDPS c. SRB (C-413/23 P): https://www.cliffordchance.com/insights/resources/blogs/talking-tech/en/articles/2025/09/pseudonymized-data-after-edps-v-srb.html · https://www.jonesday.com/es/insights/2025/09/cjeu-clarifies-scope-of-personal-data-in-edps-v-srb-decision

Colombia
- Ley 1581 de 2012 (copia pública): https://www.unidadvictimas.gov.co/wp-content/uploads/Documentos/ley/Ley_1581_2012.pdf · art. 15: https://leyonline.co/laws/ley-1581-de-2012/articulo-15-reclamos
- Decreto 1377 de 2013: https://www.funcionpublica.gov.co/eva/gestornormativo/norma.php?i=53646 · compilado en el Decreto 1074 de 2015: https://normativa.colpensiones.gov.co/colpens/docs/decreto_1074_2015_pr026.htm
- Menores (conceptos de la SIC citados por el buscador): https://sedeelectronica.sic.gov.co/sites/default/files/normatividad/022019/Rad18_18267888PDG.PDF · https://www.ambitojuridico.com/sites/default/files/BancoMedios/Archivos/cpto-13198482-13.pdf
- Transferencias, Circular Externa 005 de 2017: https://www.hklaw.com/en/insights/publications/2017/08/cambios-en-la-transferencia-de-datos-personales-a · https://www.bu.com.co/es/insights/noticias/circular-externa-005-del-10082017
- RNBD, Decreto 090 de 2018: https://actualicese.com/archivo/decreto-090-de-18-01-2018/ · https://www.bu.com.co/es/insights/noticias/empresas-bajo-la-lupa-de-la-sic-para-el-registro-de-bases-de-datos
- Cookies en Colombia: https://www.asuntoslegales.com.co/consumidor/conozca-los-aspectos-legales-que-debe-tener-en-cuenta-al-usar-cookies-en-sitios-web-3375211 · https://www.asuntoslegales.com.co/consultorio/pixeles-cookies-y-tracking-tools-vs-la-proteccion-de-datos-3167533

EE. UU.
- COPPA, enmiendas de 2025: https://www.federalregister.gov/documents/2025/04/22/2025-05904/childrens-online-privacy-protection-rule · https://www.skadden.com/insights/publications/2025/01/ftc-finalizes-long-awaited-child-online-privacy · https://www.lw.com/en/insights/2025/05/ftc-publishes-updates-to-coppa-rule

Proveedores y plataformas
- PostHog: https://posthog.com/dpa · https://storage.googleapis.com/legal-public/PostHog%20Data%20Processing%20Agreement.pdf · https://posthog.com/subprocessors · https://posthog.com/docs/privacy/data-storage · https://posthog.com/docs/privacy/gdpr-compliance.md · tercero: https://complydog.com/blog/is-posthog-gdpr-compliant
- itch.io: https://itch.io/about/terms · https://www.itch.io/docs/legal/privacy-policy (no se encontró norma sobre datos dentro de juegos HTML5)
