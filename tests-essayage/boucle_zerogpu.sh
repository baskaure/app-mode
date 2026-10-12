#!/bin/bash
# Retente FitDiT toutes les 10 min (quota ZeroGPU anonyme ~3 min GPU, rechargé avec le temps), par ordre de priorité.
cd "$(dirname "$0")"
LISTE="P3_G1 P1_G2 P1_G3 P2_G3 P3_G2 P2_G2 P4_G2 P4_G3 P3_G3h"
fin=$(( $(date +%s) + ${1:-5400} ))
while [ $(date +%s) -lt $fin ]; do
  reste=0
  for pg in $LISTE; do
    P=${pg%_*}; G=${pg#*_}
    [ -f resultats/brut/fitdit_${P}_${G}.png ] && continue
    reste=1
    out=$(timeout 600 ~/.local/bin/uvx --with gradio_client --with pillow python -I run_tryon.py fitdit $P $G 2>&1 | tail -1)
    echo "$(date +%H:%M) $out"
    echo "$out" | grep -q "quota" && break
  done
  [ $reste = 0 ] && break
  sleep 600
done
