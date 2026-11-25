#!/bin/sh
# Cola 5 (reanudable: kit_bot.js salta lo que ya está en cada CSV). Comprueba el servidor antes de cada lote y lo levanta si hace falta.
#   exp_plato_te: Carmesí y Hogar con Té en vez de Sopa (P III, 5 biomas, n=24)
#   faseC_mut_alta: 9 mutadores x Fragua y Pantano x Asfódelo, P III, n=48 (pares con la fase A)
#   calidad_media / calidad_baja: Fragua y Pantano x 5 biomas, P III, n=24 (pares con la fase A)
#   exp_plato2: Fragua con Té; Ventisca y Alquimia con Asado (P III, 5 biomas, n=24)
B=http://localhost:8891; D=tools/card-swarm-bot/calib; PIDF=${KITCAL_PIDF:-/tmp/kitcal_serve.pid}
srv() { curl -s -o /dev/null http://localhost:8891/index.html || { setsid python3 tools/serve.py card-swarm 8891 > /dev/null 2>&1 & echo $! > $PIDF; sleep 2; }; }
run() { srv; env "$@" PAR=4 SEED=1 node tools/card-swarm-bot/kit_bot.js $B; }
run KIT=carmesi,hogar BIOME=all PEL=3 N=24 KITDISH=carmesi=te,hogar=te OUT=$D/exp_plato_te.csv > $D/exp_plato_te.log 2>&1
run KIT=fragua,pantano BIOME=asfodelo PEL=3 MUT=veloz,marea,duros,sincor,bolsillo,cristal,dos,sincambio,curtidos N=48 OUT=$D/faseC_mut_alta.csv > $D/faseC_mut_alta.log 2>&1
run KIT=fragua,pantano BIOME=all PEL=3 N=24 Q=media OUT=$D/calidad_media.csv > $D/calidad_media.log 2>&1
run KIT=fragua,pantano BIOME=all PEL=3 N=24 Q=baja OUT=$D/calidad_baja.csv > $D/calidad_baja.log 2>&1
run KIT=fragua,ventisca,alquimia BIOME=all PEL=3 N=24 KITDISH=fragua=te,ventisca=asado,alquimia=asado OUT=$D/exp_plato2.csv > $D/exp_plato2.log 2>&1
