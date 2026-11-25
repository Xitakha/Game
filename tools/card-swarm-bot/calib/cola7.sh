#!/bin/sh
# Cola 7: completa la fase C (reanuda lo que falte en faseC_mut_alta.csv).
B=http://localhost:8891; D=tools/card-swarm-bot/calib; PIDF=${KITCAL_PIDF:-/tmp/kitcal_serve.pid}
until grep -aq "^--- " $D/exp_pf_kit.log 2>/dev/null; do sleep 30; done
curl -s -o /dev/null $B/index.html || { setsid python3 tools/serve.py card-swarm 8891 > /dev/null 2>&1 & echo $! > $PIDF; sleep 2; }
KIT=fragua,pantano BIOME=asfodelo PEL=3 MUT=veloz,marea,duros,sincor,bolsillo,cristal,dos,sincambio,curtidos N=48 SEED=1 PAR=4 OUT=$D/faseC_mut_alta.csv node tools/card-swarm-bot/kit_bot.js $B > $D/faseC_mut_alta2.log 2>&1
