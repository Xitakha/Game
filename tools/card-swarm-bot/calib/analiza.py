#!/usr/bin/env python3
"""Tablas de la calibración de kits (salida CSV de kit_bot.js).
Uso: python3 tools/card-swarm-bot/calib/analiza.py <csv> [<csv>...] [--by kit,biome] [--metric won|m1|m2] [--filter col=val]
Por defecto agrupa por kit x bioma y da % de Oro (victoria) con intervalo de Wilson al 95 %.
"""
import csv, sys, math, collections

def wilson(k, n, z=1.96):
    if n == 0:
        return (0.0, 0.0)
    p = k / n; d = 1 + z * z / n; c = (p + z * z / (2 * n)) / d
    h = z * math.sqrt(p * (1 - p) / n + z * z / (4 * n * n)) / d
    return (max(0.0, c - h), min(1.0, c + h))

def main():
    files, by, metric, flt = [], ['kit', 'biome'], 'won', []
    a = sys.argv[1:]; i = 0
    while i < len(a):
        if a[i] == '--by': by = a[i + 1].split(','); i += 2
        elif a[i] == '--metric': metric = a[i + 1]; i += 2
        elif a[i] == '--filter': flt.append(a[i + 1].split('=', 1)); i += 2
        else: files.append(a[i]); i += 1
    rows = []
    for f in files:
        with open(f) as fh:
            rows += list(csv.DictReader(fh))
    for k, v in flt:
        rows = [r for r in rows if r[k] == v]
    val = {'won': lambda r: int(r['won']), 'm1': lambda r: int(r['medal']) >= 1, 'm2': lambda r: int(r['medal']) >= 2}[metric]
    g = collections.OrderedDict()
    for r in rows:
        g.setdefault(tuple(r[b] for b in by), []).append(r)
    if len(by) == 2:   # tabla de doble entrada
        rk = list(dict.fromkeys(k[0] for k in g)); ck = list(dict.fromkeys(k[1] for k in g))
        print('| ' + by[0] + ' \\ ' + by[1] + ' | ' + ' | '.join(ck) + ' | total |')
        print('|---' * (len(ck) + 2) + '|')
        for r0 in rk:
            cells, tk, tn = [], 0, 0
            for c0 in ck:
                xs = g.get((r0, c0), [])
                k = sum(val(x) for x in xs); n = len(xs); tk += k; tn += n
                lo, hi = wilson(k, n)
                cells.append('%d (%d-%d) n=%d' % (round(100 * k / n), round(100 * lo), round(100 * hi), n) if n else '-')
            lo, hi = wilson(tk, tn)
            print('| ' + r0 + ' | ' + ' | '.join(cells) + ' | %d (%d-%d) n=%d |' % (round(100 * tk / max(1, tn)), round(100 * lo), round(100 * hi), tn))
        cells = []
        for c0 in ck:
            xs = [x for kk, v in g.items() if kk[1] == c0 for x in v]; k = sum(val(x) for x in xs); n = len(xs); lo, hi = wilson(k, n)
            cells.append('%d (%d-%d) n=%d' % (round(100 * k / n), round(100 * lo), round(100 * hi), n))
        xs = rows; k = sum(val(x) for x in xs); n = len(xs); lo, hi = wilson(k, n)
        print('| total | ' + ' | '.join(cells) + ' | %d (%d-%d) n=%d |' % (round(100 * k / max(1, n)), round(100 * lo), round(100 * hi), n))
    else:
        print('| ' + ' | '.join(by) + ' | n | % | IC95 | Bronce+ | Plata+ | t muerte med | pts medios |')
        print('|---' * (len(by) + 7) + '|')
        for key, xs in g.items():
            n = len(xs); k = sum(val(x) for x in xs); lo, hi = wilson(k, n)
            m1 = sum(int(x['medal']) >= 1 for x in xs); m2 = sum(int(x['medal']) >= 2 for x in xs)
            dt = sorted(int(x['t']) for x in xs if x['won'] == '0'); med = dt[len(dt) // 2] if dt else '-'
            pts = round(sum(int(x['score'] or 0) for x in xs) / n)
            print('| ' + ' | '.join(key) + ' | %d | %d | %d-%d | %d | %d | %s | %d |' % (n, round(100 * k / n), round(100 * lo), round(100 * hi), round(100 * m1 / n), round(100 * m2 / n), med, pts))

if __name__ == '__main__':
    main()
