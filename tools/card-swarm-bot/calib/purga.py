#!/usr/bin/env python3
"""Quita de un CSV de kit_bot.js las filas que no forman par con la fase A (mismo kit, bioma e idx pero otro día) y las repetidas.
Así la siguiente ejecución con el mismo OUT= las vuelve a jugar con la semilla correcta. Uso: python3 purga.py <csv> [base=faseA_P3_alta.csv]"""
import csv, sys, os
H = os.path.dirname(os.path.abspath(__file__)); f = sys.argv[1]; base = sys.argv[2] if len(sys.argv) > 2 else os.path.join(H, 'faseA_P3_alta.csv')
A = {(r['kit'], r['biome'], r['idx']): r['day'] for r in csv.DictReader(open(base))}
rows = list(csv.DictReader(open(f))); seen = set(); keep = []
for r in rows:
    k = (r['kit'], r['biome'], r['pel'], r['mut'], r['idx'])
    if k in seen or A.get((r['kit'], r['biome'], r['idx'])) != r['day']: continue
    seen.add(k); keep.append(r)
if rows:
    w = csv.DictWriter(open(f, 'w'), fieldnames=list(rows[0].keys())); w.writeheader(); w.writerows(keep)
print(f, len(rows), '->', len(keep))
