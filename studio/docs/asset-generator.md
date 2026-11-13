# Generador de recursos (Ember Flock)
> Histórico: `games/survival-lamb` se retiró de `main` el 2026-11-13 (sigue en el historial de git). El mismo patrón de recursos procedurales vive hoy en `games/card-swarm/src/assets*.js`; las rutas de abajo ya no existen en `main`.

`games/survival-lamb/src/assets.js` genera sprites, VFX, biomas y audio sin ficheros ni red. API: `games/survival-lamb/ASSETS_API.md`.
Visor/exportador (PNG spritesheet, WAV): `tools/asset-preview/index.html`. Nuevos juegos pueden copiar el patron (dibujo por codigo + shading automatico + audio por capas).
