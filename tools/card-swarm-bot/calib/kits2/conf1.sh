#!/bin/bash
cd "$(dirname "$0")/../../../.."
D=tools/card-swarm-bot/calib/kits2
KIT=ventisca,alquimia N=32 OUT=$D/v2_firma.csv KITSIG='ventisca={"lv":[{"r":150},{"r":170}]};alquimia={"lv":[{"hit":6,"cd":9000},{"hit":8,"cd":9000}]}' bash $D/lote.sh 8931
