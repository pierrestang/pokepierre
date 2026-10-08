#!/usr/bin/env python3
"""Remplace un asset d'une carte du créateur par des éléments du catalogue, comme le mode simple (studio.js
placeElement) : vider une zone (Décor et « au-dessus de Pierre », collisions libérées ; le sol reste), puis poser des
éléments entiers (cases du catalogue, rangées du haut au-dessus de Pierre, collisions de l'élément, noté dans
studio.elements pour que le créateur les reconnaisse).

Usage : python3 scripts/place_elements.py <carte> clear:<x>,<y>,<w>,<h> … put:<id>@<x>,<y> …
"""
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
MAPS = ROOT / 'src' / 'data' / 'builtMaps'
STRIDE = 100000


def elements():
    cat = json.loads((ROOT / 'public' / 'assets' / 'v2' / 'catalogue.json').read_text())
    out = {}
    for t in cat['themes'].values():
        for e in t['elements']:
            out.setdefault(e['id'], e)
    return out


def stack(v):
    return [r for r in (v if isinstance(v, list) else [v]) if r >= 0]


def cell(st):
    return st if len(st) > 1 else (st[0] if st else -1)


def main(mid, ops):
    path = MAPS / f'{mid}.json'
    m = json.loads(path.read_text())
    W, H = m['width'], m['height']
    els = elements()
    if 'catalogue' not in m['sheets']:
        m['sheets'].append('catalogue')
    slot = m['sheets'].index('catalogue') * STRIDE
    studio = m.setdefault('studio', {'theme': 'libre', 'forest': [], 'elements': []})
    for op in ops:
        kind, arg = op.split(':', 1)
        if kind == 'clear':
            x0, y0, w, h = map(int, arg.split(','))
            for y in range(y0, y0 + h):
                for x in range(x0, x0 + w):
                    i = y * W + x
                    m['layers']['decor'][i] = -1
                    m['layers']['dessus'][i] = -1
                    m['solid'][i] = 0
            studio['elements'] = [e for e in studio['elements']
                                  if not (x0 <= e['x'] < x0 + w and y0 <= e['y'] < y0 + h)]
        elif kind == 'put':
            eid, pos = arg.split('@')
            x0, y0 = map(int, pos.split(','))
            d = els[eid]
            prev = []
            for j, row in enumerate(d['tiles']):
                for i, k in enumerate(row):
                    x, y = x0 + i, y0 + j
                    if k < 0 or not (0 <= x < W and 0 <= y < H):
                        continue
                    c = y * W + x
                    layer = 'decor' if j >= d['over'] else 'dessus'
                    m['layers'][layer][c] = cell(stack(m['layers'][layer][c]) + [slot + k])
                    if d['solid'][j][i]:
                        prev.append([c, m['solid'][c]])
                        m['solid'][c] = 1
            studio['elements'].append({'id': eid, 'theme': 'libre', 'x': x0, 'y': y0, 'prev': prev})
            door = d.get('door')
            print(f'{eid} posé en ({x0}, {y0})' + (f', porte en ({x0 + door[0]}, {y0 + door[1]})' if door else ''))
    path.write_text(json.dumps(m, ensure_ascii=False))


if __name__ == '__main__':
    main(sys.argv[1], sys.argv[2:])
