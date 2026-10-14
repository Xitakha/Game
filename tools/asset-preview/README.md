# asset-preview
Visor y exportador de `games/survival-lamb/src/assets.js` (sprites, VFX, biomas, SFX y musica en capas).
Uso: abre `tools/asset-preview/index.html` (file:// o servidor estatico en la raiz del repo).
Sprites: boton "PNG spritesheet" por sprite y "Exportar atlas PNG" (+JSON). Sonido: sliders volumen/pitch/variacion, boton WAV por SFX (OfflineAudioContext) y "Exportar musica WAV"; intensidad 0..1 y pista normal/boss.
Selector de bioma (bosque/cripta) y arena animada con antorchas, niebla y vineta.
Para Swarm Hand v2 abrir `index.html?game=card-swarm` (carga assets.js + assets_enemies2.js).
Aldea de Rescoldo (Swarm Hand v3): con `?game=card-swarm` aparece la vista "Aldea" (hora dia/ocaso/noche, animacion de NPC, colisiones) y los sprites `npc_*`, `portrait_*`, `vil_*`, `ui_*` en la lista.
Jefes (Swarm Hand v4, J1): con `?game=card-swarm` aparece la vista "Jefe" (Pastor Corrupto: ataque/progreso, fase, velocidad, salto, herido/furia/desesperado/ventana/aturdido/inmune/rugido, partes rotas, muerte por dt, anclajes). Contrato en `games/card-swarm/ASSETS_API.md`; capturas en `studio/docs/capturas-jefes-j1/`.
