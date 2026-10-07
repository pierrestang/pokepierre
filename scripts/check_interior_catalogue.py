#!/usr/bin/env python3
"""Vérifie public/assets/v2/catalogue-int.json (scripts/build_interior_catalogue.py) : chaque case citée existe dans
catalogue-int.png et n'est pas vide, tiles et solid ont les dimensions annoncées, les ids sont uniques, chaque thème est
inclus dans « libre », l'entrée de catalog.json correspond à la planche.

Usage : python3 scripts/check_interior_catalogue.py
"""
import json
import sys
from pathlib import Path

import numpy as np
from PIL import Image

V2 = Path(__file__).resolve().parent.parent / 'public' / 'assets' / 'v2'
T = 16


def main():
    cat = json.loads((V2 / 'catalogue-int.json').read_text())
    img = np.array(Image.open(V2 / 'catalogue-int.png').convert('RGBA'))
    cols = cat['cols']
    n = (img.shape[1] // T) * (img.shape[0] // T)
    errors = []

    def tile_ok(k, where):
        if k == -1:
            return
        if not (0 <= k < n):
            errors.append(f'{where} : case {k} hors de la planche ({n})')
            return
        t = img[(k // cols) * T:(k // cols + 1) * T, (k % cols) * T:(k % cols + 1) * T]
        if not t[..., 3].any():
            errors.append(f'{where} : case {k} vide')

    themes = cat['themes']
    if list(themes)[0] != 'libre':
        errors.append('le premier thème doit être « libre »')
    libre = themes['libre']
    for kind in ('materials', 'elements'):
        ids = [x['id'] for x in libre[kind]]
        if len(ids) != len(set(ids)):
            errors.append(f'{kind} : ids en double dans « libre »')
    for tid, th in themes.items():
        for kind in ('materials', 'elements'):
            for x in th[kind]:
                if x not in libre[kind]:
                    errors.append(f'{tid} : {x["id"]} absent de « libre »')
        for m in th['materials']:
            if m['kind'] not in ('pattern', 'wall'):
                errors.append(f'{m["id"]} : sorte de matière inconnue {m["kind"]}')
            w = len(m['tiles'][0])
            if any(len(r) != w for r in m['tiles']):
                errors.append(f'{m["id"]} : rangées de longueurs différentes')
            for r in m['tiles']:
                for k in r:
                    tile_ok(k, m['id'])
        for e in th['elements']:
            if len(e['tiles']) != e['h'] or any(len(r) != e['w'] for r in e['tiles']):
                errors.append(f'{e["id"]} : tiles ne fait pas {e["w"]} x {e["h"]}')
            if len(e['solid']) != e['h'] or any(len(r) != e['w'] for r in e['solid']):
                errors.append(f'{e["id"]} : solid ne fait pas {e["w"]} x {e["h"]}')
            if not 0 <= e['over'] <= e['h']:
                errors.append(f'{e["id"]} : over hors limites')
            if all(k < 0 for r in e['tiles'] for k in r):
                errors.append(f'{e["id"]} : aucune case')
            for r in e['tiles']:
                for k in r:
                    tile_ok(k, e['id'])
    sheet = next((s for s in json.loads((V2 / 'catalog.json').read_text())['sheets'] if s['id'] == 'catalogue-int'), None)
    if not sheet:
        errors.append('catalog.json : pas d\'entrée catalogue-int')
    elif sheet['cols'] != cols or sheet['rows'] != img.shape[0] // T:
        errors.append('catalog.json : dimensions de catalogue-int différentes de la planche')
    for e in errors:
        print('!', e)
    print(f'{len(libre["materials"])} matières, {len(libre["elements"])} éléments, {len(themes)} thèmes : '
          + ('OK' if not errors else f'{len(errors)} problème(s)'))
    return 1 if errors else 0


if __name__ == '__main__':
    sys.exit(main())
