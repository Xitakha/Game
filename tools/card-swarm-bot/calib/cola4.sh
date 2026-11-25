#!/bin/sh
# Cola 4 (palanca "plato", P III, 5 biomas, n=24, mismas semillas que la fase A): Fragua con Té (nerf) y Ventisca / Alquimia con Asado de colmillo (candidatos a subir).
B=${1:-http://localhost:8891}; D=tools/card-swarm-bot/calib
until grep -q "^--- " $D/calidad_baja.log 2>/dev/null; do sleep 20; done
KIT=fragua,ventisca,alquimia BIOME=all PEL=3 N=24 SEED=1 PAR=4 KITDISH=fragua=te,ventisca=asado,alquimia=asado OUT=$D/exp_plato2.csv node tools/card-swarm-bot/kit_bot.js $B > $D/exp_plato2.log 2>&1
