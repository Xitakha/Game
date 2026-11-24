#!/bin/sh
# Exploración de la potencia nivelada de la Cripta (Peligro III, sin mutadores, 8 kits, n=24, semillas 1..). Uso: sh tools/card-swarm-bot/calib/exp_cripta.sh [base]
B=${1:-http://localhost:8891}; D=tools/card-swarm-bot/calib
KIT=all BIOME=cripta PEL=3 N=24 SEED=1 PAR=4 KITPOW=cripta=2/0/9 OUT=$D/exp_cripta_ref0.csv node tools/card-swarm-bot/kit_bot.js $B > $D/exp_cripta_ref0.log 2>&1
KIT=all BIOME=cripta PEL=3 N=24 SEED=1 PAR=4 KITPOW=cripta=2/0/6 OUT=$D/exp_cripta_ref0_pf6.csv node tools/card-swarm-bot/kit_bot.js $B > $D/exp_cripta_ref0_pf6.log 2>&1
