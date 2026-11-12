# fx2-lab: comparacion ANTES/DESPUES del arte FX2 y medicion de coste
1. `python3 tools/serve.py card-swarm 8812 &` (cerrar por PID) y `node tools/fx2-lab/lab.js ward|ice|boom|status|all salida.jpg` (`DSF=2` para zoom).
2. `ACT=cristal,filo,forja,plasma STATUS=1 QUALITY=alta EXTRA='&fx2=0' node tools/fx2-lab/perf_fx2.js 20` vs sin `EXTRA` (con `&fx2prof=1` imprime ms por funcion).
3. Todo el arte nuevo esta en `games/card-swarm/src/assets_fx2.js` (ver `ASSETS_API.md`, seccion FX 2).
