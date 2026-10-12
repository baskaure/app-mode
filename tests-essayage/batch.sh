#!/bin/bash
# Usage : batch.sh <demo> [essais_max]  — lance les 12 essayages, avec relances si la démo est saturée
cd "$(dirname "$0")"
demo=$1; tries=${2:-4}
for P in P1 P2 P3 P4; do
  for G in G1 G2 G3; do
    [ "$P" = "P3" ] && [ "$G" = "G3" ] && G=G3h
    for i in $(seq 1 $tries); do
      [ -f resultats/brut/${demo}_${P}_${G}.png ] && break
      timeout 600 ~/.local/bin/uvx --with gradio_client --with pillow python -I run_tryon.py $demo $P $G 2>&1 | tail -1
      [ -f resultats/brut/${demo}_${P}_${G}.png ] || sleep 20
    done
  done
done
