#!/bin/sh
# Cola 8: rehace las partidas sin par de calidad MEDIA (las que se jugaron con la tabla de Peligro por bioma activa por error, 01:39-02:19 UTC).
B=http://localhost:8891; D=tools/card-swarm-bot/calib; PIDF=${KITCAL_PIDF:-/tmp/kitcal_serve.pid}
until grep -aq "^--- " $D/faseC_mut_alta2.log 2>/dev/null; do sleep 30; done
curl -s -o /dev/null $B/index.html || { setsid python3 tools/serve.py card-swarm 8891 > /dev/null 2>&1 & echo $! > $PIDF; sleep 2; }
python3 $D/purga.py $D/calidad_media.csv
KIT=fragua,pantano BIOME=all PEL=3 N=24 SEED=1 PAR=4 Q=media OUT=$D/calidad_media.csv node tools/card-swarm-bot/kit_bot.js $B > $D/calidad_media2.log 2>&1
