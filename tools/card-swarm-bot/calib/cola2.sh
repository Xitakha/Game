#!/bin/sh
# Cola 2 (palanca "plato" de los kits dominantes): Carmesí y Hogar con Té de brasas en vez de Sopa de hebra, Peligro III, 5 biomas, n=24 (mismas semillas que la fase A).
B=${1:-http://localhost:8891}; D=tools/card-swarm-bot/calib

KIT=carmesi,hogar BIOME=all PEL=3 N=24 SEED=1 PAR=4 KITDISH=carmesi=te,hogar=te OUT=$D/exp_plato_te.csv node tools/card-swarm-bot/kit_bot.js $B > $D/exp_plato_te.log 2>&1
