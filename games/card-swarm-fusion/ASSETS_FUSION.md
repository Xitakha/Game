
## Audio (sfx_fusion2.js)

Archivo `src/sfx_fusion2.js` (procedural WebAudio, sin ficheros). Cargar con `<script>` DESPUÉS de `sfx.js` y `sfx_fusion.js`. Se reproducen con `G.Snd.play(nombre, pitch)`. Atajo: `G.Snd.fx2(id, tipo, pitch)` con tipo `cast|hit|zone|ready|fuse`. Verificado en Chromium headless (render offline): 45 sonidos sin silencio, pico max 0,26 (sin saturar), sin errores de consola.

ids de poder: `tormenta` (Tormenta de escarcha), `toxica` (Escarcha tóxica), `pacto` (Pacto ardiente), `iman` (Imán), `forja` (Forja), `filo` (Filo gélido), `hemo` (Hemotoxina), `descarga` (Descarga tóxica). Los 4 primeros poderes siguen en `sfx_fusion.js`.

| Nombre | Uso |
|---|---|
| `fx_<id>` | Lanzamiento (p. ej. `fx_forja`) |
| `fx_<id>_hit` | Impacto / tick (corto; limitar con el throttle de `S.play`, p. ej. 1 cada 80-120 ms) |
| `fx_<id>_zone` | Loop corto de zona/canal (~0,4 s, volumen bajo; repetir cada ~450 ms mientras dure) |
| `fx_<id>_ready` | Cooldown listo, con tono propio por poder |
| `fx_<id>_fuse` | Fusión conseguida, con tonalidad propia (incluye el lanzamiento al final) |
| `fx_replace` | Reemplazo de un poder por otro |
| `fx_btn_ready` | Botón activo listo (brillo agudo breve, para el pulso dorado del botón) |
| `fx_btn_cancel` | Cooldown cancelado / pulsación rechazada en los 4 botones |

Nota para el programador: `S.play` no tiene throttle por defecto para estos nombres (MIN en `sfx.js` solo cubre los antiguos); ya limita a 4 voces por nombre.
