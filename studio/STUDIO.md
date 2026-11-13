# Estudio — Estructura y reglas

## Organigrama
```
Dueño (usuario)
   └── CEO ──────────────── único que habla con el dueño; planifica y delega
        ├── game-designer         concepto, mecánicas, GDD y contenido
        ├── balance-designer      balance numérico, economía y experimentos con bots
        ├── programmer            implementación del juego
        ├── performance-engineer  carga, frame-time, memoria y batería
        ├── ux-designer           UX/UI móvil, primera sesión, legibilidad y accesibilidad
        ├── art-director          dirección de arte, VFX y cinemáticas
        ├── audio-designer        música y efectos (busca libres o genera)
        ├── asset-scout           busca/descarga recursos gratuitos con licencia clara
        ├── tools-engineer        crea apps/scripts cuando no hay recurso gratis
        ├── qa-tester             pruebas, bugs, checklist de lanzamiento
        ├── monetization-analyst  monetización, analítica y privacidad
        ├── release-manager       CI, builds, publicación y documentación al día
        ├── marketing-manager     página del juego, textos, capturas, tráiler y comunidad
        └── market-researcher     estudia el mercado y propone ideas
```

## Plan vigente y modelos
- **Plan maestro de Swarm Hand:** [`studio/docs/PLAN-MAESTRO.md`](docs/PLAN-MAESTRO.md) (diagnóstico, monetización, tareas en 5 fases, decisiones del dueño del 2026-11-13).
- Cada agente lleva su modelo por defecto en la línea `model:` de `.claude/agents/<nombre>.md`. El CEO puede subirlo o bajarlo por tarea según la sección 3 del plan: Fable 5.2 para balance, arquitectura y revisiones de cierre; Opus 5.5 para diseño y revisión; Sonnet 5.5 para implementar; Haiku 5.5 para lo mecánico.
- Todo cambio de `src/` lo revisa un agente distinto del que lo escribió; los de balance y guardado, con Fable u Opus.

## Carpetas
| Carpeta | Contenido |
|---|---|
| `.claude/agents/` | Definición de cada agente |
| `studio/docs/` | Pipeline, decisiones, plantillas de documentos |
| `studio/assets/` | Biblioteca compartida de recursos + `ASSETS.md` (registro de licencias) |
| `studio/templates/` | Plantillas (GDD, ficha de juego) |
| `games/<nombre>/` | Un juego por carpeta (código, `GDD.md`, `assets/`) |
| `tools/` | Apps/utilidades internas creadas por tools-engineer (bots y pruebas de Swarm Hand, PWA, sitio de Pages) |

## Flujo (pipeline)
1. **Idea** — el dueño propone; CEO resume y define alcance (juego pequeño, jugable en navegador por defecto).
2. **Diseño** — game-designer escribe `games/<n>/GDD.md` (plantilla en `studio/templates/GDD.md`).
3. **Recursos** — asset-scout / audio-designer buscan gratis; si no hay → tools-engineer crea una herramienta.
4. **Producción** — programmer implementa por hitos pequeños.
5. **QA** — qa-tester prueba y reporta; programmer corrige.
6. **Entrega** — CEO presenta al dueño, commit y push.

## Reglas
- **Stack:** HTML5 + JavaScript vanilla sobre Canvas 2D, sin librerías ni motor (es lo que usa Swarm Hand) — se juega en navegador, sin instalación. Otro motor solo si el dueño lo pide.
- **Nada se publica sin pasar las pruebas** (`node tools/card-swarm-bot/tests.js all`); no se guardan claves ni contraseñas en el repositorio; las cuentas de itch.io, portales y tiendas las crea y es titular el dueño (el estudio prepara guías, nunca credenciales).
- **Recursos gratuitos:** preferir CC0 (Kenney.nl, OpenGameArt CC0, itch.io CC0, Freesound CC0, Google Fonts OFL). Evitar licencias NC/ND.
- **Todo recurso externo se registra** en `studio/assets/ASSETS.md` (nombre, URL, autor, licencia, juego que lo usa).
- Los agentes no hacen commit/push; lo hace el CEO al cerrar un hito.
- El CEO resume al dueño de forma breve; los detalles viven en los documentos.

## Estado de los juegos
- **Swarm Hand** (`games/card-swarm/`): la versión **Fusión** (antes prototipo `card-swarm-fusion`), publicada en `/card-swarm/`: ataque básico automático, cartas como infusiones, poderes activos por fusión de dos cartas; conserva aldea, Portal, 5 biomas + Cráter, 6 jefes, forja y PWA. Guardado `swarmhand.fusion.save`. Pruebas: `node tools/card-swarm-bot/tests.js all` (con `python3 tools/serve.py card-swarm 8811`), bots `play_bot.js`, `boss_bot.js`; `python3 tools/card-swarm-pwa/stamp.py` tras cualquier cambio de archivos. Documentación: `games/card-swarm/README.md` y `DESIGN-fusion.md`.
- **Swarm Hand clásico v5.6** y **Ember Flock** (prototipo anterior): RETIRADOS de `main` el 2026-11-13 por decisión del dueño (`games/card-swarm-clasico`, `games/survival-lamb` y las herramientas `tools/card-swarm-clasico-*`). Siguen en el historial de git; el clásico, además, en la rama remota `archive/card-swarm-clasico-v5.6`. `/card-swarm-fusion/` en Pages solo redirige a `/card-swarm/`. El sitio publica solo Swarm Hand.

## Integración continua y publicación
- `.github/workflows/tests.yml` ("Pruebas"): instala Node 22 y Playwright (versión fijada en `tools/package-lock.json`) con Chromium, levanta `tools/serve.py card-swarm 8811` y ejecuta `node tools/card-swarm-bot/tests.js all`. Corre en cada pull request y también la llama `pages.yml`. El registro (`pruebas.log`) se guarda como artefacto 14 días. Límite de 20 min (local: unos 10 min, casi todo esperas de tiempo real).
- `.github/workflows/pages.yml`: el trabajo `pruebas` (llama a `tests.yml`) es previo a `build` y `deploy`; si falla, no se publica nada. Un push a `main` ejecuta, pues, pruebas y luego despliegue (unos 10-12 min en total).
- Local: `cd tools && npm ci` instala Playwright; en esta máquina se usa `/opt/pw-browsers` (ver `tools/lib/browser.js`). Recomendado: proteger `main` exigiendo la comprobación "Batería completa" (ajuste del dueño en GitHub).
