#!/bin/bash
# Barrido del refuerzo de firma (n=16 por celda, mismas semillas que base_k1)
cd "$(dirname "$0")/../../../.."
D=tools/card-swarm-bot/calib/kits2
KIT=ventisca,alquimia N=16 OUT=$D/sw_a.csv KITSIG='ventisca={"lv":[{"r":150},{"r":170}]};alquimia={"lv":[{"hit":4},{"hit":5}]}' bash $D/lote.sh 8931
KIT=ventisca,alquimia N=16 OUT=$D/sw_b.csv KITSIG='ventisca={"lv":[{"r":150,"cd":12000},{"r":170,"cd":12000}]};alquimia={"lv":[{"hit":7},{"hit":9}]}' bash $D/lote.sh 8931
