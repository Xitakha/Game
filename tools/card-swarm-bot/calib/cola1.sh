#!/bin/sh
# Cola 1: Peligro IV y II (8 kits x 5 biomas, n=16, sin mutadores) y reto diario real (200 días seguidos desde el día 20401, reglas r1 y kits k1 sin tocar).
B=${1:-http://localhost:8891}; D=tools/card-swarm-bot/calib
while pgrep -f "OUT=$D/exp_cripta" >/dev/null || pgrep -f "kit_bot.js" >/dev/null; do sleep 10; done
KIT=all BIOME=all PEL=4 N=16 SEED=1 PAR=4 OUT=$D/faseB_P4_alta.csv node tools/card-swarm-bot/kit_bot.js $B > $D/faseB_P4_alta.log 2>&1
DAILY=1 N=200 SEED=401 PAR=4 OUT=$D/reto_real_r1.csv node tools/card-swarm-bot/kit_bot.js $B > $D/reto_real_r1.log 2>&1
KIT=all BIOME=all PEL=2 N=16 SEED=1 PAR=4 OUT=$D/faseB_P2_alta.csv node tools/card-swarm-bot/kit_bot.js $B > $D/faseB_P2_alta.log 2>&1
