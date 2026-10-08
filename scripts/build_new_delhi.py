#!/usr/bin/env python3
"""New Delhi redessiné en Gen 4 (octobre 2026) : une carte du créateur, src/data/builtMaps/new-delhi.json.

Comme Hanoï et Amsterdam (scripts/build_hanoi.py, build_amsterdam.py) : le sol vient du convertisseur
(scripts/convert_maps_v2.py, thème Gen 4 : grande avenue, trottoirs, jardins, bassin) d'après la grille GROUND ; les
bâtiments et le mobilier sont des éléments du thème « New Delhi (palais moghols) » du catalogue (scripts/build_catalogue.py :
des bâtiments et objets de la bibliothèque Gen 4 qui n'y étaient pas encore), posés comme le mode simple ; la bordure est
une forêt de palmiers du créateur (studio.forest, arbre « g4-palmier »), dessinée par scripts/paint_forest.mjs.
De haut en bas :
- au nord, le long de la grande avenue : l'université (le bâtiment à coupole et lanternes dorées), le palais de grès
  (fermé aux visiteurs), la porte du fort et le minaret ;
- la grande avenue est-ouest (vers l'aéroport, panneaux aux deux bouts : la bordure est ouverte) ;
- les jardins : la grande arche (India Gate), un palmier, le bassin aux lotus, la fontaine octogonale, les soucis ;
- au sud : maisons à toit plat et à coupole dorée, la tente du bazar, les étals et le stand de chai ;
- la rue sud.
La grille du jeu (src/data/maps/newDelhi.js, sourceGrid) reprend GROUND, la bordure en 'Y', les portes sur les portes
dessinées (imprimées à la fin).

Usage : python3 scripts/build_new_delhi.py [--force]   (une carte retouchée dans le créateur : --force efface ces retouches)
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
W, H = 36, 30
THEME = 'new-delhi'
MAP_ID = 'new-delhi'

# Rangées de la carte : 0-11 bâtiments du nord (le palais monte jusqu'en haut) ; 12-13 grande avenue (ouverte aux deux
# bouts) ; 14 trottoir ; 15-18 jardins (bassin aux lotus en x 16-21) ; 19 allée ; 20-25 maisons du sud et le bazar ;
# 26-27 rue sud ; 28-29 bordure.
AVENUE = (12, 13)
GARDEN = range(15, 19)
POOL = (range(16, 22), range(16, 18))      # le bassin aux lotus (x, rangées), entouré d'herbe
SOUTH_STREET = (26, 27)
PALACE = (range(12, 24), range(0, 2))      # pas de palmiers sous le palais


def ground():
    rows = []
    for y in range(H):
        row = ''
        for x in range(W):
            edge = x < 2 or x >= W - 2 or y < 2 or y >= H - 2
            if y in AVENUE:
                c = 'ɐ'
            elif edge:
                c = '.'
            elif y in GARDEN:
                c = '~' if x in POOL[0] and y in POOL[1] else '.'
            elif y in SOUTH_STREET:
                c = 'ɐ'
            else:
                c = 'ɔ'
            row += c
        rows.append(row)
    return rows


GROUND = ground()
SOLID = {'ɔ': False, 'ɐ': False, '.': False, '~': True}
FOREST = [(x, y) for y in range(H) for x in range(W)
          if (x < 2 or x >= W - 2 or y < 2 or y >= H - 2) and y not in AVENUE
          and not (x in PALACE[0] and y in PALACE[1])]

# Les éléments : (id du catalogue, x, y) = case en haut à gauche, dans la carte.
ELEMENTS = [
    # Le nord (portes en rangée 11).
    ('maison-coupole-lanternes', 3, 3),              # l'université
    ('mat-fanions', 10, 8),
    ('maison-palais-gres', 12, 0),                   # le palais (fermé)
    ('maison-porte-fort', 24, 5),                    # la porte du fort (fermée)
    ('maison-minaret', 30, 2),
    # Le trottoir : panneaux de l'aéroport, lanternes.
    ('panneau', 2, 14), ('panneau', 33, 14),
    ('lanterne-bronze', 9, 12), ('lanterne-bronze', 21, 12), ('lanterne-bronze', 28, 12),
    # Les jardins.
    ('india-gate', 4, 15),
    ('palmier-g4', 12, 16),
    ('nenuphar', 17, 16), ('nenuphar', 20, 17),
    ('fleurs-tulipes', 22, 16),
    ('fontaine-octogonale', 26, 15),
    ('palmier-g4', 30, 16),
    *[('soucis', x, y) for x, y in ((2, 16), (3, 18), (11, 15), (14, 18), (15, 15), (25, 18), (33, 17), (31, 15))],
    # Le sud (portes en rangée 25).
    ('maison-toit-plat', 2, 21),
    ('maison-coupole-doree', 7, 20),
    ('maison-tente-bazar', 12, 20),                  # le bazar
    ('etal-raye-bleu', 17, 23),
    ('stand-chai', 23, 23),
    ('maison-coupole-gres', 27, 20),
    ('lanterne-bronze', 32, 23),
]
# Collisions corrigées : rien pour l'instant.
SOLID_FIX = {}


def catalogue_elements():
    cat = json.loads((ROOT / 'public' / 'assets' / 'v2' / 'catalogue.json').read_text())
    return {e['id']: e for e in cat['themes'][THEME]['elements']}


def stack(v):
    return [r for r in (v if isinstance(v, list) else [v]) if r is not None and r >= 0]


def cell(st):
    return st if len(st) > 1 else (st[0] if st else -1)


def main():
    out = ROOT / 'src' / 'data' / 'builtMaps' / f'{MAP_ID}.json'
    if out.exists() and '--force' not in sys.argv:
        sys.exit(f'{MAP_ID}.json existe déjà : rien n\'est écrit ; --force pour le refaire')
    game_map = {'id': MAP_ID, 'name': 'New Delhi', 'grid': GROUND, 'solid': SOLID, 'buildings': [],
                'spawn': {'x': 1, 'y': AVENUE[0], 'facing': 'right'}}
    assert all(len(r) == W for r in GROUND) and len(GROUND) == H
    builder = Builder(load_catalog())
    m = convert_g4(builder, game_map, slugify)
    builder.save_auto_sheet()
    els = catalogue_elements()
    if 'catalogue' not in m['sheets']:
        m['sheets'].append('catalogue')
    slot = m['sheets'].index('catalogue') * STRIDE
    m['studio'] = {'theme': THEME, 'forest': [list(c) for c in FOREST], 'elements': [], 'fence': [], 'trees': 'g4-palmier'}
    doors = []
    for eid, x0, y0 in ELEMENTS:
        d = els[eid]
        solid = SOLID_FIX.get(eid, d['solid'])
        prev = []
        for j, row in enumerate(d['tiles']):
            for i, k in enumerate(row):
                x, y = x0 + i, y0 + j
                if k < 0 or not (0 <= x < W and 0 <= y < H):
                    continue
                c = y * W + x
                layer = 'decor' if j >= d['over'] else 'dessus'
                m['layers'][layer][c] = cell(stack(m['layers'][layer][c]) + [slot + k])
                if solid[j][i]:
                    prev.append([c, m['solid'][c]])
                    m['solid'][c] = 1
        m['studio']['elements'].append({'id': eid, 'theme': THEME, 'x': x0, 'y': y0, 'prev': prev})
        if d.get('door'):
            doors.append((eid, x0 + d['door'][0], y0 + d['door'][1]))
    for x, y in FOREST:
        m['solid'][y * W + x] = 1
    # Les cases libres qu'on n'atteint pas depuis la rue (derrière les maisons, sous les toits) : bloquées.
    seen, todo = set(), [(2, AVENUE[0])]
    while todo:
        x, y = todo.pop()
        if (x, y) in seen or not (0 <= x < W and 0 <= y < H) or m['solid'][y * W + x]:
            continue
        seen.add((x, y))
        todo += [(x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1)]
    for y in range(H):
        for x in range(W):
            if (x, y) not in seen:
                m['solid'][y * W + x] = 1
    out.write_text(json.dumps(m, ensure_ascii=False) + '\n')
    subprocess.run(['node', str(ROOT / 'scripts' / 'paint_forest.mjs'), MAP_ID], check=True)
    print(f'{MAP_ID} : {W} x {H} -> {out.relative_to(ROOT)}')
    for eid, x, y in doors:
        print(f'  porte {eid} : ({x}, {y})')


if __name__ == '__main__':
    main()
