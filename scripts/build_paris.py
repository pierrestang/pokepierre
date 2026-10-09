#!/usr/bin/env python3
"""Paris redessiné en Gen 4 (octobre 2026) : une carte du créateur, src/data/builtMaps/paris.json.

Comme Hanoï, Amsterdam et New Delhi (scripts/build_hanoi.py, build_amsterdam.py, build_new_delhi.py) : le sol vient du
convertisseur (scripts/convert_maps_v2.py, thème Gen 4 : avenue, pavés, jardin, Seine) d'après la grille GROUND ; les
bâtiments et le mobilier sont des éléments du thème « Paris (monuments et cafés) » du catalogue (scripts/build_catalogue.py :
des bâtiments et objets de la bibliothèque Gen 4 qui n'y étaient pas encore), posés comme le mode simple ; la bordure est
une forêt d'arbres ronds du créateur (studio.forest), dessinée par scripts/paint_forest.mjs.
De haut en bas :
- au nord : un immeuble crème, le bistrot à auvent, le café à terrasse, l'opéra, l'immeuble d'ardoise, l'immeuble aux
  balcons fleuris (ton appartement) ;
- la grande avenue est-ouest (ouest : la route de Bordeaux ; est : l'aéroport) ;
- le Grand Palais, le jardin au bassin et ses platanes, la tour de bureaux vitrée (l'entreprise) ;
- la Seine (un yacht, une péniche) et ses deux ponts de pierre ;
- au sud : un pavillon d'ardoise, la cathédrale (Notre-Dame), la boutique au store rayé (le café), la grande salle
  (Bercy), un square ;
- la rue sud (est : la route de Toulon).
La grille du jeu (src/data/maps/paris.js, sourceGrid) reprend GROUND, les portes sur les portes dessinées (imprimées à
la fin).

La carte a été retouchée à la main depuis dans le créateur (52 x 48 : dôme de Bercy, Louvre, musée-gare au nord ; Notre-Dame
et la tour au sud) : le jeu suit ce dessin retouché (grille et portes de src/data/maps/paris.js), et --force l'effacerait.

Usage : python3 scripts/build_paris.py [--force]   (une carte retouchée dans le créateur : --force efface ces retouches)
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
W, H = 44, 48
THEME = 'paris'
MAP_ID = 'paris'

# Rangées de la carte : 0-1 bordure ; 2-10 immeubles du nord (portes en rangée 10) ; 11-12 grande avenue (ouverte aux
# deux bouts) ; 13 trottoir ; 14-24 monuments et jardin (portes en rangée 24) ; 25 quai ; 26-29 la Seine (elle sort de
# la carte) ; 30-31 quai sud ; 32-43 le sud (portes en rangée 43) ; 44-45 rue sud (ouverte à l'est) ; 46-47 bordure.
AVENUE = (11, 12)
GARDEN = (range(14, 29), range(14, 25))
SEINE = range(26, 30)
BRIDGES = ((8, 26), (31, 26))                  # ponts de pierre de 4 x 4 (case en haut à gauche)
SQUARE = (range(38, 42), range(32, 44))
SOUTH_STREET = (44, 45)


def ground():
    rows = []
    for y in range(H):
        row = ''
        for x in range(W):
            edge = x < 2 or x >= W - 2 or y < 2 or y >= H - 2
            if y in AVENUE or (y in SOUTH_STREET and not (x < 2 or y >= H - 2)):
                c = 'ɐ'
            elif y in SEINE:
                c = 'I' if any(bx <= x < bx + 4 for bx, _ in BRIDGES) else '~'
            elif edge:
                c = '.'
            elif (x in GARDEN[0] and y in GARDEN[1]) or (x in SQUARE[0] and y in SQUARE[1]):
                c = '.'
            else:
                c = 'ɔ'
            row += c
        rows.append(row)
    return rows


GROUND = ground()
SOLID = {'ɔ': False, 'ɐ': False, '.': False, '~': True, 'I': False}
FOREST = [(x, y) for y in range(H) for x in range(W)
          if (x < 2 or x >= W - 2 or y < 2 or y >= H - 2) and y not in AVENUE and y not in SEINE
          and not (x >= W - 2 and y in SOUTH_STREET)]

# Les éléments : (id du catalogue, x, y) = case en haut à gauche, dans la carte.
ELEMENTS = [
    # Le nord (portes en rangée 10).
    ('maison-immeuble-creme', 2, 5),
    ('maison-cafe-auvent', 8, 5),                    # le bistrot
    ('maison-cafe-terrasse', 14, 5),                 # le café (complet)
    ('maison-opera', 20, 2),
    ('maison-immeuble-ardoise', 30, 4),
    ('maison-immeuble-fleuri', 35, 2),               # ton appartement
    ('reverbere-globe', 7, 8), ('reverbere-globe', 13, 8), ('reverbere-globe', 19, 8), ('reverbere-globe', 29, 8),
    # Le trottoir : le panneau de l'aéroport.
    ('panneau', 41, 13),
    # Monuments et jardin (portes en rangée 24).
    ('maison-grand-palais', 2, 15),
    ('haie-jardiniere', 14, 14), ('haie-jardiniere', 24, 14),
    ('platane', 14, 17), ('bassin-fontaine', 18, 15), ('platane', 25, 17),
    ('banc-metal', 15, 23), ('banc-metal', 26, 23),
    ('if-cone', 17, 23), ('if-cone', 25, 23),
    ('maison-tour-verre', 30, 13),                   # l'entreprise
    ('drapeau-france', 40, 19),
    # La Seine et ses ponts.
    ('pont-pierre-vertical', *BRIDGES[0]), ('pont-pierre-vertical', *BRIDGES[1]),
    ('yacht-blanc', 18, 26), ('peniche', 37, 27),
    ('reverbere-lanterne', 5, 29), ('reverbere-lanterne', 16, 29), ('reverbere-lanterne', 27, 29),
    ('reverbere-lanterne', 38, 29),
    # Le sud (portes en rangée 43).
    ('maison-pavillon-ardoise', 2, 38),
    ('maison-cathedrale', 9, 31),                    # Notre-Dame
    ('maison-fleuriste', 21, 39),                    # le café (fermé)
    ('parasol-cafe', 21, 34),
    ('statue-socle', 25, 34),
    ('maison-arene', 29, 36),                        # Bercy
    ('platane', 38, 32), ('arbre-grille', 38, 38), ('haie-bac', 2, 33),
    ('reverbere-globe', 8, 41), ('reverbere-globe', 20, 41), ('reverbere-globe', 28, 41),
]
# Collisions corrigées : les ponts de pierre se traversent par leurs deux colonnes du milieu.
SOLID_FIX = {'pont-pierre-vertical': [[1, 0, 0, 1]] * 4}


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
    game_map = {'id': MAP_ID, 'name': 'Paris', 'grid': GROUND, 'solid': SOLID, 'buildings': [],
                'spawn': {'x': 1, 'y': AVENUE[0], 'facing': 'right'}}
    assert all(len(r) == W for r in GROUND) and len(GROUND) == H
    builder = Builder(load_catalog())
    m = convert_g4(builder, game_map, slugify)
    builder.save_auto_sheet()
    els = catalogue_elements()
    if 'catalogue' not in m['sheets']:
        m['sheets'].append('catalogue')
    slot = m['sheets'].index('catalogue') * STRIDE
    m['studio'] = {'theme': THEME, 'forest': [list(c) for c in FOREST], 'elements': [], 'fence': [], 'trees': 'dppt'}
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
