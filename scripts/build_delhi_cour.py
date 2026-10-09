#!/usr/bin/env python3
"""La cour de la fête, à New Delhi (octobre 2026) : un « intérieur » à ciel ouvert, src/data/builtInteriors/delhiCour.json.

On y entre par la porte du palais de grès (carte de New Delhi) ; c'est la cour du palais, un soir de fête. Même principe
et mêmes éléments que la carte de New Delhi (scripts/build_new_delhi.py, thème « New Delhi (palais moghols) » du
catalogue) : un dallage de grès, une couronne de palmiers (scripts/paint_forest.mjs), au fond trois pavillons à coupole,
au milieu la fontaine octogonale (on danse autour), deux mâts à fanions, des lanternes de bronze, le stand de chai, un
étal, des soucis. Rien de plus : une fête, sobre.

Le dessin est d'abord écrit comme une carte du créateur (src/data/builtMaps/delhi-cour.json, pour peindre les palmiers),
puis déplacé dans src/data/builtInteriors/delhiCour.json (relancer ensuite `python3 scripts/build_interiors.py --index`).

Usage : python3 scripts/build_delhi_cour.py
"""
import json
import subprocess
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))
from convert_maps_v2 import Builder, load_catalog, slugify  # noqa: E402
from g4_theme import convert_g4  # noqa: E402

ROOT = Path(__file__).resolve().parent.parent
STRIDE = 100000
W, H = 24, 18
THEME = 'new-delhi'
MAP_ID = 'delhi-cour'
EXIT = (11, 12)                                   # l'entrée (x), en bas : la sortie vers la carte de New Delhi


def ground():
    return ['.' * W if (y < 2 or y >= H - 2) else '..' + 'ɔ' * (W - 4) + '..' for y in range(H - 2)] + \
        ['.' * EXIT[0] + 'ɔɔ' + '.' * (W - EXIT[0] - 2) for _ in range(2)]


GROUND = ground()
SOLID = {'ɔ': False, '.': False}
FOREST = [(x, y) for y in range(H) for x in range(W)
          if (x < 2 or x >= W - 2 or y < 2 or y >= H - 2) and not (y >= H - 2 and x in EXIT)]

# Les éléments : (id du catalogue, x, y) = case en haut à gauche.
ELEMENTS = [
    # Au fond : trois pavillons à coupole (le palais), portes fermées.
    ('maison-coupole-doree', 2, 2),
    ('maison-mausolee', 9, 1),
    ('maison-coupole-doree-claire', 17, 2),
    # Les mâts à fanions et les lanternes, autour de la piste.
    ('mat-fanions', 3, 9), ('mat-fanions', 19, 9),
    ('lanterne-bronze', 7, 7), ('lanterne-bronze', 15, 7),
    # Au milieu : la fontaine octogonale.
    ('fontaine-octogonale', 10, 9),
    # Les côtés : le stand de chai, un étal ; des soucis.
    ('stand-chai', 2, 13),
    ('etal-raye-rose', 16, 13),
    *[('soucis', x, y) for x, y in ((8, 8), (15, 8), (7, 14), (16, 12), (2, 12), (21, 12))],
]


def catalogue_elements():
    cat = json.loads((ROOT / 'public' / 'assets' / 'v2' / 'catalogue.json').read_text())
    return {e['id']: e for e in cat['themes'][THEME]['elements']}


def stack(v):
    return [r for r in (v if isinstance(v, list) else [v]) if r is not None and r >= 0]


def cell(st):
    return st if len(st) > 1 else (st[0] if st else -1)


def main():
    out = ROOT / 'src' / 'data' / 'builtMaps' / f'{MAP_ID}.json'
    game_map = {'id': MAP_ID, 'name': 'Cour du palais', 'grid': GROUND, 'solid': SOLID, 'buildings': [],
                'spawn': {'x': EXIT[0], 'y': H - 3, 'facing': 'up'}}
    assert all(len(r) == W for r in GROUND) and len(GROUND) == H
    builder = Builder(load_catalog())
    m = convert_g4(builder, game_map, slugify)
    builder.save_auto_sheet()
    els = catalogue_elements()
    if 'catalogue' not in m['sheets']:
        m['sheets'].append('catalogue')
    slot = m['sheets'].index('catalogue') * STRIDE
    m['studio'] = {'theme': THEME, 'forest': [list(c) for c in FOREST], 'elements': [], 'fence': [], 'trees': 'g4-palmier'}
    for eid, x0, y0 in ELEMENTS:
        d = els[eid]
        for j, row in enumerate(d['tiles']):
            for i, k in enumerate(row):
                x, y = x0 + i, y0 + j
                if k < 0 or not (0 <= x < W and 0 <= y < H):
                    continue
                c = y * W + x
                layer = 'decor' if j >= d['over'] else 'dessus'
                m['layers'][layer][c] = cell(stack(m['layers'][layer][c]) + [slot + k])
                if d['solid'][j][i]:
                    m['solid'][c] = 1
        m['studio']['elements'].append({'id': eid, 'theme': THEME, 'x': x0, 'y': y0, 'prev': []})
    for x, y in FOREST:
        m['solid'][y * W + x] = 1
    out.write_text(json.dumps(m, ensure_ascii=False) + '\n')
    subprocess.run(['node', str(ROOT / 'scripts' / 'paint_forest.mjs'), MAP_ID], check=True)
    # Déplacé parmi les intérieurs : la cour s'ouvre comme une pièce (porte du palais, sortie en bas).
    m = json.loads(out.read_text())
    out.unlink()
    m['id'] = 'delhiCour'
    m['name'] = 'Cour du palais'
    m.pop('studio', None)
    (ROOT / 'src' / 'data' / 'builtInteriors' / 'delhiCour.json').write_text(json.dumps(m, ensure_ascii=False) + '\n')
    print(f'delhiCour : {W} x {H} -> src/data/builtInteriors/delhiCour.json')
    for y in range(H):
        print(f'{y:2} ' + ''.join('#' if m['solid'][y * W + x] else '.' for x in range(W)))


if __name__ == '__main__':
    main()
