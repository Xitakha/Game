#!/bin/bash
cd "$(dirname "$0")/../../../.."
D=tools/card-swarm-bot/calib/kits2
KIT=alquimia N=32 OUT=$D/sw_e.csv KITSIG='alquimia={"lv":[{"hit":6,"cd":9000},{"hit":8,"cd":9000}]}' KITNODES='alquimia=V1:A,S1:A,V4,S4,V3:A,ASH,S7,V7,V10,S3:B,V9:A' bash $D/lote.sh 8931
KIT=alquimia N=32 OUT=$D/sw_f.csv KITSIG='alquimia={"lv":[{"hit":6,"cd":7500},{"hit":8,"cd":7500}]}' bash $D/lote.sh 8931
