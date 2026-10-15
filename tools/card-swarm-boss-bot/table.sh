#!/bin/bash
# Tabla de victorias del bot esquivador por jefe y Peligro (J3).
# uso: table.sh <jefe> "<peligros>" <runs por build> [puerto] [hpcal] [extra]   p.ej.  table.sh letea "1 2 3 4 5" 12 8791
# INATTN=0.1 (por defecto) = 10 % de pasos distraídos, como la calibración de J1 (con 0 el bot es ~10-15 puntos más fácil).
# Salida: una línea por Peligro con victorias p25/p50/p75, duración mediana de las victorias y ponderado 25/50/25.
boss=$1; pels=${2:-1}; runs=${3:-8}; port=${4:-8765}; hpcal=${5:-0}; extra=${6:-}
cd "$(dirname "$0")"
FL=(${FORGE:-1 1 1 1 1})   # FORGE="1 1.1 1.2 1.35 1.45": multiplicador de daño de cartas (mano forjada) por Peligro I..V; se pasa como &cmul=
for pel in $pels; do
  res=""; w=0; durs=""
  for b in "p25|spark:2,dart:2,shard:1,hourglass:1,fang:1|0.25" "p50|spark:3,dart:2,shard:2,dagger:2,fang:1|0.5" "p75|spark:3,dart:3,shard:3,dagger:3,fang:3|0.25"; do
    n=${b%%|*}; r=${b#*|}; h=${r%%|*}; wt=${r##*|}
    out=$(node fight.js "{\"hand\":\"$h\",\"runs\":$runs,\"speed\":12,\"par\":4,\"noLevel\":true,\"react\":250,\"every\":100,\"mistakes\":0.1,\"inattn\":${INATTN:-0.1},\"hp0\":\"100\",\"boss\":\"$boss\",\"port\":$port,\"hpcal\":$hpcal,\"peligro\":$pel,\"extra\":\"$extra&cmul=${FL[$((pel-1))]}\"}" 2>&1)
    line=$(echo "$out" | grep RESUMEN)
    v=$(echo "$line" | sed 's/.* victorias \([0-9]*\/[0-9]*\) dur victorias.*/\1/'); a=${v%%/*}; t=${v##*/}
    d=$(echo "$line" | sed 's/.*dur victorias \([0-9,]*\) dur todas.*/\1/')
    [ -z "$t" ] && { a=0; t=1; v=ERR; }
    errs=$(echo "$out" | grep -c "PAGEERR")
    res="$res $n=$v"; durs="$durs [$d]"
    w=$(echo "$w + $wt * $a / $t" | bc -l)
    [ "$errs" != "0" ] && res="$res(ERR$errs)"
  done
  printf "%s P%s:%s  pond=%.0f%%  dur:%s\n" "$boss" "$pel" "$res" "$(echo "$w*100" | bc -l)" "$durs"
done
