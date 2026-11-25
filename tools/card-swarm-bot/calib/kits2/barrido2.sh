#!/bin/bash
cd "$(dirname "$0")/../../../.."
D=tools/card-swarm-bot/calib/kits2
KIT=alquimia N=16 OUT=$D/sw_c.csv KITSIG='alquimia={"lv":[{"hit":6,"cd":9000},{"hit":8,"cd":9000}]}' bash $D/lote.sh 8931
KIT=alquimia N=16 OUT=$D/sw_d.csv KITSIG='alquimia={"lv":[{"hit":10,"cd":8000,"dur":7000},{"hit":12,"cd":8000,"dur":7000}]}' bash $D/lote.sh 8931
