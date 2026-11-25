#!/bin/sh
# Cola 6 (palanca "PF por kit", P III, 5 biomas, n=16, pares con la fase A): -3 PF a los kits fuertes (Fragua, Carmesí, Hogar, Lana) y +3 PF a los flojos (Ventisca, Alquimia, Tempestad).
B=http://localhost:8891; D=tools/card-swarm-bot/calib; PIDF=${KITCAL_PIDF:-/tmp/kitcal_serve.pid}
until grep -q "^--- " $D/exp_plato2.log 2>/dev/null; do sleep 30; done
curl -s -o /dev/null $B/index.html || { setsid python3 tools/serve.py card-swarm 8891 > /dev/null 2>&1 & echo $! > $PIDF; sleep 2; }
KIT=fragua,carmesi,hogar,lana,ventisca,alquimia,tempestad BIOME=all PEL=3 N=16 SEED=1 PAR=4 KITPF=fragua=-3,carmesi=-3,hogar=-3,lana=-3,ventisca=3,alquimia=3,tempestad=3 OUT=$D/exp_pf_kit.csv node tools/card-swarm-bot/kit_bot.js $B > $D/exp_pf_kit.log 2>&1
