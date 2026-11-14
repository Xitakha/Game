# Empaquetado de producción (T-F0-10)

Herramienta: `tools/build/` (README con el uso). Pages publica `dist/card-swarm` (un JS minificado, `index.html`, `sw.js` sellado, manifest, iconos); el desarrollo sigue con `games/card-swarm` y sus archivos sueltos.

Medido en local (Playwright, caché fría, mediana de 7):

| | Sueltos | Empaquetado |
|---|---|---|
| Peticiones | 97 | 4 |
| Bytes | 3,40 MB | 2,08 MB |
| gzip | 1,06 MB | 0,70 MB (-33 %) |
| Tiempo hasta `G.state` | ~1,64 s | ~1,61 s |

Batería completa contra el paquete: 658/658 (igual que con archivos sueltos). CI: la batería completa corre con archivos sueltos (`tests.yml`); `pages.yml` añade una prueba de humo (dev, diag, flow, boss, iso) contra el paquete antes de desplegar.
Versiones externas (itch, portales, tienda): `node tools/build/build.js --no-god` (inmortalidad apagada por defecto). No activado en Pages.
