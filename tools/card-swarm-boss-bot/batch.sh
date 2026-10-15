#!/bin/bash
# uso: batch.sh etiqueta hpcal react every mistakes runs [inattn] [hp0] [boss] [port]
tag=$1; hpcal=$2; react=$3; every=$4; mis=$5; runs=${6:-12}; boss=${9:-pastor}; port=${10:-8765}
for b in "p25|spark:2,dart:2,shard:1,hourglass:1,fang:1" "p50|spark:3,dart:2,shard:2,dagger:2,fang:1" "p75|spark:3,dart:3,shard:3,dagger:3,fang:3"; do
  n=${b%%|*}; h=${b#*|}
  echo "== $tag $boss $n"
  node fight.js "{\"hand\":\"$h\",\"runs\":$runs,\"speed\":12,\"par\":4,\"noLevel\":true,\"react\":$react,\"every\":$every,\"mistakes\":$mis,\"inattn\":${7:-0},\"hp0\":\"${8:-100}\",\"boss\":\"$boss\",\"port\":$port,\"hpcal\":$hpcal}" 2>&1 | grep -E "RESUMEN|PAGEERR" | sed 's/{"hand.*"anchors":""[^}]*}//' | cut -c1-700
done
