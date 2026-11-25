#!/usr/bin/env python3
"""Oro esperado del reto (sin mutadores) para una tabla de Peligro por bioma, a partir de las celdas medidas en las fases A y B.
Uso: python3 tools/card-swarm-bot/calib/tabla_peligro.py  (edita TABLAS abajo)"""
import csv, collections, os
H = os.path.dirname(os.path.abspath(__file__))
m = collections.defaultdict(lambda: [0, 0])
for f in ['faseA_P3_alta.csv', 'faseB_P2_alta.csv', 'faseB_P4_alta.csv']:
    for r in csv.DictReader(open(os.path.join(H, f))):
        x = m[(r['kit'], r['biome'], int(r['pel']))]; x[0] += 1; x[1] += int(r['won'])
K = ['fragua', 'ventisca', 'pantano', 'carmesi', 'lana', 'tempestad', 'alquimia', 'hogar']; B = ['bosque', 'cripta', 'asfodelo', 'tundra', 'panal']
TABLAS = {
    'r1 (35/45/20 en todos)': {b: {2: .35, 3: .45, 4: .20} for b in B},
    'propuesta r2': {'bosque': {3: .7, 4: .3}, 'cripta': {4: 1}, 'asfodelo': {3: .9, 4: .1}, 'tundra': {4: 1}, 'panal': {4: 1}},
}
for name, T in TABLAS.items():
    print('==', name)
    per_b = {b: sum(w * m[(k, b, p)][1] / m[(k, b, p)][0] for k in K for p, w in T[b].items()) / len(K) for b in B}
    per_k = {k: sum(w * m[(k, b, p)][1] / m[(k, b, p)][0] for b in B for p, w in T[b].items()) / len(B) for k in K}
    print('  por bioma:', {b: round(100 * v) for b, v in per_b.items()})
    print('  por kit:  ', {k: round(100 * v) for k, v in per_k.items()})
    print('  media: %d %%   rango entre kits: %d-%d' % (round(100 * sum(per_b.values()) / len(B)), round(100 * min(per_k.values())), round(100 * max(per_k.values()))))
