#!/bin/bash
# Comprobación de que los otros 6 kits no cambian (n=4 por celda, comparación bit a bit con base_k1) y reto real k2 (200 días, 20401-20600)
cd "$(dirname "$0")/../../../.."
D=tools/card-swarm-bot/calib/kits2
KIT=fragua,pantano,carmesi,lana,tempestad,hogar N=4 OUT=$D/otros_k2.csv bash $D/lote.sh 8931
DAILY=1 SEED=401 N=200 PAR=4 OUT=$D/reto_real_r2_k2.csv node tools/card-swarm-bot/kit_bot.js http://localhost:8931 | tail -3
