#!/bin/sh
# Cola 3: fase C (9 mutadores del MVP x Fragua y Pantano x Asfódelo, Peligro III, n=48; mismas semillas que la fase A -> comparación por pares)
# y calidades MEDIA / BAJA (Fragua y Pantano x 5 biomas, Peligro III, n=24; mismas semillas que la fase A).
B=${1:-http://localhost:8891}; D=tools/card-swarm-bot/calib
until grep -q "^--- " $D/exp_plato_te.log 2>/dev/null; do sleep 20; done
KIT=fragua,pantano BIOME=asfodelo PEL=3 MUT=veloz,marea,duros,sincor,bolsillo,cristal,dos,sincambio,curtidos N=48 SEED=1 PAR=4 OUT=$D/faseC_mut_alta.csv node tools/card-swarm-bot/kit_bot.js $B > $D/faseC_mut_alta.log 2>&1
for q in media baja; do KIT=fragua,pantano BIOME=all PEL=3 N=24 SEED=1 PAR=4 Q=$q OUT=$D/calidad_$q.csv node tools/card-swarm-bot/kit_bot.js $B > $D/calidad_$q.log 2>&1; done
