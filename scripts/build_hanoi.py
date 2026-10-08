#!/usr/bin/env python3
"""Hanoï redessiné en Gen 4 (octobre 2026) : une carte du créateur, src/data/builtMaps/hanoi.json.

Le sol vient du convertisseur des cartes (scripts/convert_maps_v2.py, thème Gen 4 : rues, pavés, herbe, le lac
Hoàn Kiếm et ses bords, le ponton de l'îlot), d'après la grille GROUND ci-dessous ; les bâtiments et le mobilier sont
des éléments du catalogue du créateur (public/assets/v2/catalogue.json, posés comme le mode simple : rangées du haut
au-dessus de Pierre, collisions de l'élément, notés dans studio.elements pour que le créateur les reconnaisse).
De haut en bas :
- six maisons étroites (maisons-tubes, toits de couleurs) le long de la rue nord, dont ta maison (la 2e) et l'agence
  de voyage (boutique à auvent), une lanterne de bois dans chaque passage ;
- la grande rue est-ouest (vers l'aéroport, panneaux aux deux bouts : la bordure de sapins y est ouverte) ;
- le lac Hoàn Kiếm (nénuphars, roseaux, îlot de la cloche relié par un ponton), et le temple (palais doré : le temple
  au toit rouge) sur sa place pavée, entre cerisiers et palmier ;
- les maisons du sud, le petit marché (étals), la rue sud.
La grille du jeu (src/data/maps/hanoi.js, sourceGrid) reprend GROUND, avec les portes ('D') sur les portes dessinées
(DOORS, imprimées à la fin). convert_maps_v2.py ne refait pas Hanoï : c'est ce script.

Usage : python3 scripts/build_hanoi.py
"""
import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))
from convert_maps_v2 import Builder, load_catalog, slugify  # noqa: E402
from g4_theme import convert_g4  # noqa: E402

ROOT = Path(__file__).resolve().parent.parent
STRIDE = 100000

# Le sol (codes de src/data/tiles.js) : ɔ pavés, ɐ rue, . herbe, ~ lac, = ponton, T sapins.
PLAZA = 'ɔ' * 15
LAKE_ROW = '..' + '~' * 7 + '...' + '~' * 3 + '..' + PLAZA          # l'îlot en x 9-11
INNER = [
    *(['ɔ' * 32] * 6),                                               # 0-5   maisons nord, trottoir
    'ɐ' * 32, 'ɐ' * 32,                                              # 6-7   grande rue (aéroport aux deux bouts)
    'ɔ' * 32,                                                        # 8     trottoir, panneaux
    '.' * 17 + PLAZA,                                                # 9     parc ; place du temple
    '..' + '~' * 8 + '=' + '~' * 4 + '..' + PLAZA,                   # 10    le ponton vers l'îlot (x 10)
    LAKE_ROW, LAKE_ROW, LAKE_ROW,                                    # 11-13
    '..' + '~' * 13 + '..' + PLAZA,                                  # 14
    '.' * 17 + PLAZA,                                                # 15
    *(['ɔ' * 32] * 6),                                               # 16-21 trottoir, maisons sud, marché
    'ɐ' * 32, 'ɐ' * 32,                                              # 22-23 rue sud
    'ɔ' * 32, 'ɔ' * 32,                                              # 24-25
]
# La ville, entourée d'une bordure de sapins (blocs de 2 x 2, deux cases d'épaisseur), ouverte aux deux bouts de la
# grande rue (rangées 8-9 de la carte : l'aéroport). OFFSET : décalage des cases de la ville dans la carte.
OFFSET = 2
ROAD_ROWS = (6 + OFFSET, 7 + OFFSET)
GROUND = ['T' * 36] * 2 + [('ɐɐ' if y + OFFSET in ROAD_ROWS else 'TT') + row + ('ɐɐ' if y + OFFSET in ROAD_ROWS else 'TT')
                           for y, row in enumerate(INNER)] + ['T' * 36] * 2
SOLID = {'ɔ': False, 'ɐ': False, '.': False, '~': True, '=': False, 'T': True}

# Les éléments : (id du catalogue, x, y) = case en haut à gauche, dans la ville (sans la bordure, voir OFFSET).
ELEMENTS = [
    # Maisons nord (porte en rangée 4), ta maison la 2e, l'agence la 4e ; une lanterne dans chaque passage entre deux
    # maisons (on ne passe pas derrière).
    ('maison-toit-orange', 1, 0), ('maison-toit-orange', 6, 0), ('maison-toit-orange-violet', 11, 0),
    ('maison-boutique-auvent', 16, 1), ('maison-toit-orange-vert', 21, 0), ('maison-toit-orange-bleu', 26, 0),
    *[('lanterne-bois', x, 4) for x in (0, 5, 10, 15, 20, 25, 30, 31)],
    ('panneau', 1, 8), ('panneau', 30, 8),
    # Le lac : nénuphars, roseaux, la cloche sur l'îlot.
    ('nenuphar', 3, 11), ('nenuphar', 5, 13), ('nenuphar', 7, 10), ('nenuphar', 12, 11), ('nenuphar', 13, 13),
    ('nenuphar', 4, 14), ('roseaux', 2, 10), ('roseaux', 14, 14), ('cloche', 9, 12),
    ('fleurs-tropicales', 0, 12), ('fleurs-tropicales', 15, 9),
    # Le temple (palais doré), porte en (22, 15) ; cerisiers et palmier.
    ('maison-temple-rouge', 19, 9), ('cerisier', 27, 9), ('cerisier', 27, 12), ('palmier-2', 15, 12),
    ('lanterne-bois', 0, 15), ('lanterne-bois', 16, 15), ('lanterne-bois', 31, 15),
    # Maisons sud (porte en rangée 21) et le marché ; des pots dans les passages.
    ('maison-toit-orange', 1, 17), ('maison-toit-orange-violet', 6, 17), ('maison-toit-orange-bleu', 10, 17),
    ('etal', 14, 19), ('etal', 17, 19), ('velo', 15, 18),
    ('maison-toit-orange-vert', 21, 17), ('maison-toit-orange', 26, 17),
    ('pot', 0, 20), ('pot', 5, 20), ('pot', 25, 20), ('pot', 30, 20), ('pot', 31, 20),
]


def catalogue_elements():
    cat = json.loads((ROOT / 'public' / 'assets' / 'v2' / 'catalogue.json').read_text())
    out = {}
    for t in cat['themes'].values():
        for e in t['elements']:
            out.setdefault(e['id'], e)
    return out


def stack(v):
    return [r for r in (v if isinstance(v, list) else [v]) if r is not None and r >= 0]


def cell(st):
    return st if len(st) > 1 else (st[0] if st else -1)


def main():
    game_map = {'id': 'hanoi', 'name': 'Hanoï', 'grid': GROUND, 'solid': SOLID, 'buildings': [],
                'spawn': {'x': 1, 'y': ROAD_ROWS[0], 'facing': 'right'}}
    assert all(len(r) == 36 for r in GROUND) and len(GROUND) == 30
    builder = Builder(load_catalog())
    m = convert_g4(builder, game_map, slugify)
    builder.save_auto_sheet()
    W = m['width']
    els = catalogue_elements()
    if 'catalogue' not in m['sheets']:
        m['sheets'].append('catalogue')
    slot = m['sheets'].index('catalogue') * STRIDE
    m['studio'] = {'theme': 'libre', 'forest': [], 'elements': []}
    doors = []
    for eid, x0, y0 in ELEMENTS:
        x0, y0 = x0 + OFFSET, y0 + OFFSET
        d = els[eid]
        prev = []
        for j, row in enumerate(d['tiles']):
            for i, k in enumerate(row):
                x, y = x0 + i, y0 + j
                if k < 0 or not (0 <= x < W and 0 <= y < m['height']):
                    continue
                c = y * W + x
                layer = 'decor' if j >= d['over'] else 'dessus'
                m['layers'][layer][c] = cell(stack(m['layers'][layer][c]) + [slot + k])
                if d['solid'][j][i]:
                    prev.append([c, m['solid'][c]])
                    m['solid'][c] = 1
        m['studio']['elements'].append({'id': eid, 'theme': 'libre', 'x': x0, 'y': y0, 'prev': prev})
        if d.get('door'):
            doors.append((eid, x0 + d['door'][0], y0 + d['door'][1]))
    # Les cases libres qu'on n'atteint pas depuis la rue (derrière les maisons, sous les toits) : bloquées.
    H = m['height']
    seen, todo = set(), [(0, ROAD_ROWS[0])]
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
    out = ROOT / 'src' / 'data' / 'builtMaps' / 'hanoi.json'
    out.write_text(json.dumps(m, ensure_ascii=False) + '\n')
    print(f'hanoi : {W} x {m["height"]} -> {out.relative_to(ROOT)}')
    for eid, x, y in doors:
        print(f'  porte {eid} : ({x}, {y})')


if __name__ == '__main__':
    main()
