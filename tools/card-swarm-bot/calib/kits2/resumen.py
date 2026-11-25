#!/usr/bin/env python3
"""Resumen de lotes "kit en su día r2" (lote.sh): Oro por kit y bioma, media por kit (5 biomas, mismo peso) con IC95 de Wilson,
y comparación por pares (misma celda e idx) contra un CSV base. Uso: resumen.py variante.csv [base.csv] [--kit k1,k2]"""
import csv, sys, math, collections
B = ['bosque', 'cripta', 'asfodelo', 'tundra', 'panal']
def wil(k, n, z=1.96):
    if not n: return (0, 0)
    p = k / n; d = 1 + z * z / n; c = (p + z * z / (2 * n)) / d; h = z * math.sqrt(p * (1 - p) / n + z * z / (4 * n * n)) / d
    return (max(0, c - h), min(1, c + h))
def load(f):
    out = {}
    for r in csv.DictReader(open(f)): out[(r['kit'], r['biome'], r['pel'], r['idx'])] = r
    return out
def tab(d, kits=None):
    by = collections.defaultdict(list)
    for (k, b, p, i), r in d.items(): by[(k, b)].append(r)
    ks = kits or sorted(set(k for k, b in by))
    print('kit | ' + ' | '.join(B) + ' | media (IC95) | Bronce+ | n')
    allw = []
    for k in ks:
        cells = []; w = n = br = 0
        for b in B:
            a = by.get((k, b), []); wk = sum(int(x['won']) for x in a); cells.append('%d' % round(100 * wk / len(a)) if a else '-'); w += wk; n += len(a); br += sum(int(x['medal']) >= 1 for x in a)
        lo, hi = wil(w, n); allw.append(w / max(1, n))
        print('%s | %s | %d (%d-%d) | %d | %d' % (k, ' | '.join(cells), round(100 * w / max(1, n)), round(100 * lo), round(100 * hi), round(100 * br / max(1, n)), n))
    print('media de kits: %.1f' % (100 * sum(allw) / len(allw)))
def pairs(v, b):
    by = collections.defaultdict(lambda: [0, 0, 0, 0])
    for key, r in v.items():
        if key not in b: continue
        x, y = int(b[key]['won']), int(r['won']); c = by[key[0]]
        c[0] += 1; c[1] += x; c[2] += y; c[3] += (x and not y) - 0
        c.append((x, y))
    for k, c in by.items():
        prs = c[4:]; sb = sum(1 for x, y in prs if x and not y); sv = sum(1 for x, y in prs if y and not x); n = len(prs)
        m = sb + sv; p = 1.0 if m == 0 else min(1, 2 * sum(math.comb(m, i) for i in range(0, min(sb, sv) + 1)) / 2 ** m)
        print('pares %s: n=%d base %d %% -> variante %d %% | solo base %d / solo variante %d | McNemar p=%.3f' % (k, n, round(100 * sum(x for x, y in prs) / n), round(100 * sum(y for x, y in prs) / n), sb, sv, p))
if __name__ == '__main__':
    a = [x for x in sys.argv[1:] if not x.startswith('--')]
    kits = None
    if '--kit' in sys.argv: kits = sys.argv[sys.argv.index('--kit') + 1].split(','); a = [x for x in a if x != ','.join(kits)]
    v = load(a[0]); tab(v, kits)
    if len(a) > 1: pairs(v, load(a[1]))
