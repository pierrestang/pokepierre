#!/usr/bin/env python3
"""Amsterdam redessiné en Gen 4 (octobre 2026) : une carte du créateur, src/data/builtMaps/amsterdam.json.

D'après la carte retouchée à la main dans le créateur (maisons de canal au toit rose, manoir à pignons, fontaine,
canaux, bordure d'arbres d'automne dorés), remise en ordre comme Hanoï (scripts/build_hanoi.py) : le sol vient du
convertisseur (scripts/convert_maps_v2.py, thème Gen 4 : rue, pavés des quais, canaux, ponts de planches) d'après la
grille GROUND ; les bâtiments et le mobilier sont des éléments du thème « Amsterdam (canaux) » du catalogue
(scripts/build_catalogue.py), posés comme le mode simple (rangées du haut au-dessus de Pierre, collisions de l'élément,
notés dans studio.elements) ; la bordure d'arbres est la forêt du créateur (studio.forest, arbre rond doré), dessinée
par scripts/paint_forest.mjs avec la même règle que le créateur (src/builder/forestLayout.js).
De haut en bas :
- les maisons du nord : une maison de canal, le manoir à pignons (Corning), la maison de canal à la porte en cœur (la
  maison commune), la maison à pignon rouge ;
- la grande rue est-ouest (vers l'aéroport, panneaux aux deux bouts : la bordure est ouverte) et le quai ;
- le premier canal (une péniche), deux ponts de planches ;
- les maisons de canal du sud (le coffee shop : porte et fleurs), la petite place à la fontaine ;
- le quai sud et le second canal.
La grille du jeu (src/data/maps/amsterdam.js, sourceGrid) reprend GROUND, avec les portes ('D') sur les portes dessinées
(imprimées à la fin).

La carte a été retouchée à la main depuis dans le créateur (maisons remontées, place à la fontaine fleurie, jardinières) :
le jeu suit ce dessin retouché (portes de src/data/maps/amsterdam.js), et --force l'effacerait.

Usage : python3 scripts/build_amsterdam.py [--force]   (puis node scripts/paint_forest.mjs amsterdam ; la carte retouchée
dans le créateur : --force efface ces retouches)
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
THEME = 'amsterdam'

# Le sol (codes de src/data/tiles.js) : ɔ pavés des quais, ɐ rue, ~ canal, I pont de planches, . herbe (la bordure,
# repeinte en forêt par paint_forest.mjs). Rangées de la carte :
#   0-1 bordure ; 2-9 maisons du nord ; 10-11 grande rue (ouverte aux deux bouts) ; 12 quai ; 13-15 premier canal ;
#   16 quai ; 17-24 maisons du sud et la place ; 25 quai sud ; 26-27 second canal (il sort de la carte) ; 28-29 bordure.
STREET = (10, 11)
CANALS = (range(13, 16), range(26, 28))
BRIDGES = (6, 7, 27, 28)                       # deux ponts de deux cases sur le premier canal


def ground():
    rows = []
    for y in range(H):
        row = []
        for x in range(W):
            edge = x < 2 or x >= W - 2 or y < 2 or y >= H - 2
            if y in STREET:
                c = 'ɐ'
            elif y in CANALS[0]:
                c = 'I' if x in BRIDGES else '~'
            elif y in CANALS[1]:
                c = '~'
            elif edge:
                c = '.'
            else:
                c = 'ɔ'
            row.append(c)
        rows.append(''.join(row))
    return rows


GROUND = ground()
SOLID = {'ɔ': False, 'ɐ': False, '.': False, '~': True, 'I': False}
# La bordure : de la forêt, sauf là où passent la rue et les canaux.
FOREST = [(x, y) for y in range(H) for x in range(W)
          if (x < 2 or x >= W - 2 or y < 2 or y >= H - 2) and y not in STREET and y not in CANALS[0] and y not in CANALS[1]]

# Les éléments : (id du catalogue, x, y) = case en haut à gauche, dans la carte.
ELEMENTS = [
    # Maisons du nord (portes en rangée 9).
    ('maison-canal-fenetres', 2, 2),
    ('maison-manoir-pignons', 8, 4),                 # Corning
    ('maison-canal-porte', 18, 2),                   # la maison commune
    ('reverbere-noir', 24, 7),
    ('maison-pignon-rouge', 25, 2),
    ('arbuste-taille', 32, 8),
    # Le quai nord : réverbères, vélos, panneaux de l'aéroport.
    ('panneau', 2, 12), ('panneau', 33, 12),
    ('reverbere-noir', 4, 10), ('reverbere-noir', 21, 10), ('reverbere-noir', 31, 10),
    ('velo', 16, 12), ('velo', 17, 12),
    # Le premier canal : une péniche.
    ('peniche', 14, 13),
    # Maisons du sud (portes en rangée 24) et la place à la fontaine.
    ('maison-canal-porte-fleurs', 2, 17),            # le coffee shop
    ('maison-canal-fleurs', 7, 17),
    ('maison-canal-basse', 12, 18),
    ('maison-canal-fenetres', 17, 17),
    ('maison-canal-porte', 22, 17),
    ('arbre-roux', 28, 15), ('fontaine', 29, 20), ('banc-bois', 32, 17),
    ('jardiniere-rose', 28, 24),
    # Le quai sud.
    ('reverbere-noir', 11, 23), ('reverbere-noir', 26, 23),
    ('velo', 20, 25),
]
# Collisions corrigées : les ailes du manoir (rangée 4 de l'élément) sont des murs.
SOLID_FIX = {'maison-manoir-pignons': [[0] * 11, [0] * 11, [1] * 11, [1] * 11, [1] * 11,
                                       [0, 0, 0, 0, 1, 0, 1, 0, 0, 0, 0]]}


def catalogue_elements():
    cat = json.loads((ROOT / 'public' / 'assets' / 'v2' / 'catalogue.json').read_text())
    return {e['id']: e for e in cat['themes'][THEME]['elements']}


def stack(v):
    return [r for r in (v if isinstance(v, list) else [v]) if r is not None and r >= 0]


def cell(st):
    return st if len(st) > 1 else (st[0] if st else -1)


def main():
    out = ROOT / 'src' / 'data' / 'builtMaps' / 'amsterdam.json'
    if out.exists() and '--force' not in sys.argv:
        sys.exit('amsterdam.json existe déjà (retouché dans le créateur) : rien n\'est écrit ; --force pour le refaire')
    game_map = {'id': 'amsterdam', 'name': 'Amsterdam', 'grid': GROUND, 'solid': SOLID, 'buildings': [],
                'spawn': {'x': 1, 'y': STREET[0], 'facing': 'right'}}
    assert all(len(r) == W for r in GROUND) and len(GROUND) == H
    builder = Builder(load_catalog())
    m = convert_g4(builder, game_map, slugify)
    builder.save_auto_sheet()
    els = catalogue_elements()
    if 'catalogue' not in m['sheets']:
        m['sheets'].append('catalogue')
    slot = m['sheets'].index('catalogue') * STRIDE
    m['studio'] = {'theme': THEME, 'forest': [list(c) for c in FOREST], 'elements': [], 'fence': [], 'trees': 'dppt-dore'}
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
    seen, todo = set(), [(2, STREET[0])]
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
    subprocess.run(['node', str(ROOT / 'scripts' / 'paint_forest.mjs'), 'amsterdam'], check=True)
    print(f'amsterdam : {W} x {H} -> {out.relative_to(ROOT)}')
    for eid, x, y in doors:
        print(f'  porte {eid} : ({x}, {y})')


if __name__ == '__main__':
    main()
