# Estudio — Estructura y reglas

## Organigrama
```
Dueño (usuario)
   └── CEO ──────────── único que habla con el dueño; planifica y delega
        ├── game-designer     concepto, mecánicas, GDD, balance
        ├── programmer        implementación del juego
        ├── asset-scout       busca/descarga recursos gratuitos con licencia clara
        ├── audio-designer    música y efectos (busca libres o genera)
        ├── tools-engineer    crea apps/scripts cuando no hay recurso gratis
        └── qa-tester         pruebas, bugs, checklist de lanzamiento
```

## Carpetas
| Carpeta | Contenido |
|---|---|
| `.claude/agents/` | Definición de cada agente |
| `studio/docs/` | Pipeline, decisiones, plantillas de documentos |
| `studio/assets/` | Biblioteca compartida de recursos + `ASSETS.md` (registro de licencias) |
| `studio/templates/` | Plantillas (GDD, ficha de juego) |
| `games/<nombre>/` | Un juego por carpeta (código, `GDD.md`, `assets/`) |
| `tools/` | Apps/utilidades internas creadas por tools-engineer |

## Flujo (pipeline)
1. **Idea** — el dueño propone; CEO resume y define alcance (juego pequeño, jugable en navegador por defecto).
2. **Diseño** — game-designer escribe `games/<n>/GDD.md` (plantilla en `studio/templates/GDD.md`).
3. **Recursos** — asset-scout / audio-designer buscan gratis; si no hay → tools-engineer crea una herramienta.
4. **Producción** — programmer implementa por hitos pequeños.
5. **QA** — qa-tester prueba y reporta; programmer corrige.
6. **Entrega** — CEO presenta al dueño, commit y push.

## Reglas
- **Stack por defecto:** HTML5 + JavaScript (Phaser 3 o canvas) — se juega en navegador, sin instalación. Otro motor solo si el dueño lo pide.
- **Recursos gratuitos:** preferir CC0 (Kenney.nl, OpenGameArt CC0, itch.io CC0, Freesound CC0, Google Fonts OFL). Evitar licencias NC/ND.
- **Todo recurso externo se registra** en `studio/assets/ASSETS.md` (nombre, URL, autor, licencia, juego que lo usa).
- Los agentes no hacen commit/push; lo hace el CEO al cerrar un hito.
- El CEO resume al dueño de forma breve; los detalles viven en los documentos.
