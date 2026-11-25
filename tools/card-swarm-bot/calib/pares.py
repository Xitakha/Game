#!/usr/bin/env python3
"""Comparación por pares (misma celda y misma semilla) de un CSV de variante contra la fase A (P III, sin mutadores).
Uso: python3 tools/card-swarm-bot/calib/pares.py <csv_variante> [--by kit|mut|kit,mut|kit,biome] [--base faseA_P3_alta.csv] [--metric won|m1|m2|score]
Da: n, % base, % variante, diferencia, partidas que solo gana la base / solo la variante y p de McNemar (exacta, dos colas)."""
import csv, sys, os, collections, math
H = os.path.dirname(os.path.abspath(__file__))
a = sys.argv[1:]; f = a[0]; by = ['kit', 'mut']; base = 'faseA_P3_alta.csv'; metric = 'won'
if '--by' in a: by = a[a.index('--by') + 1].split(',')
if '--base' in a: base = a[a.index('--base') + 1]
if '--metric' in a: metric = a[a.index('--metric') + 1]
val = {'won': lambda r: int(r['won']), 'm1': lambda r: int(int(r['medal']) >= 1), 'm2': lambda r: int(int(r['medal']) >= 2), 'score': lambda r: int(r['score'])}[metric]
A = {(r['kit'], r['biome'], r['idx']): r for r in csv.DictReader(open(os.path.join(H, base) if not os.path.exists(base) else base))}
g = collections.OrderedDict(); bad = 0
for r in csv.DictReader(open(f)):
    b = A.get((r['kit'], r['biome'], r['idx']))
    if not b: continue
    if b['day'] != r['day']: bad += 1; continue   # semilla distinta (no es un par)
    g.setdefault(tuple(r[k] for k in by), []).append((val(b), val(r)))
def mcn(x, y):
    n = x + y
    if n == 0: return 1.0
    k = min(x, y); p = sum(math.comb(n, i) for i in range(k + 1)) / 2 ** n
    return min(1.0, 2 * p)
print('| ' + ' | '.join(by) + ' | n | base | variante | dif | solo base / solo variante | p |')
print('|---' * (len(by) + 6) + '|')
for k, v in g.items():
    n = len(v); sb = sum(x for x, _ in v); sv = sum(y for _, y in v)
    if metric == 'score':
        print('| ' + ' | '.join(k) + ' | %d | %d | %d | %+d | - | - |' % (n, sb / n, sv / n, (sv - sb) / n)); continue
    x = sum(1 for p, q in v if p > q); y = sum(1 for p, q in v if q > p)
    print('| ' + ' | '.join(k) + ' | %d | %d %% | %d %% | %+d | %d / %d | %.2f |' % (n, round(100 * sb / n), round(100 * sv / n), round(100 * (sv - sb) / n), x, y, mcn(x, y)))
if bad: print('(descartadas %d filas con otro día: no son pares)' % bad)
