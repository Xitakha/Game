#!/bin/bash
# Lote "kit en su día r2": Bosque y Asfódelo en Peligro III, Cripta, Tundra y Panal en IV; sin mutadores; mismas semillas (SEED=1).
# Uso: KIT=ventisca N=32 OUT=archivo.csv [KITARMOR=... KITANCHOR=... KITNODES=... KITDISH=...] bash lote.sh <puerto>
cd "$(dirname "$0")/../../../.."
P=${1:-8931}
BIOME=bosque,asfodelo PEL=3 SEED=1 PAR=${PAR:-4} node tools/card-swarm-bot/kit_bot.js http://localhost:$P | tail -4
BIOME=cripta,tundra,panal PEL=4 SEED=1 PAR=${PAR:-4} node tools/card-swarm-bot/kit_bot.js http://localhost:$P | tail -5
