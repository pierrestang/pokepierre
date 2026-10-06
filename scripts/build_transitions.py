#!/usr/bin/env python3
"""Planche des transitions entre matières, pour l'assistant du créateur de cartes (src/builder/assistant.js).

Pour chaque matière (chemin, plage, mer, étang, hautes herbes), toutes les cases de bord possibles, assemblées quart de
case par quart de case comme le font les scripts de conversion (ds_theme, g4_theme : même découpage, mêmes blocs de la
planche DPPt et du Gen 4 Pack). Chaque quart prend un des cinq morceaux du bloc de la matière : 0 coin extérieur, 1 bord
horizontal (l'autre matière au-dessus ou au-dessous), 2 bord vertical (à gauche ou à droite), 3 angle rentrant (l'autre
matière dans la diagonale seulement), 4 plein. Case n° matière x 625 + somme(morceau du quart q x 5^q), q = haut-gauche,
haut-droit, bas-gauche, bas-droit : l'éditeur calcule la case voulue sans fabriquer d'image.

Écrit public/assets/v2/transitions.png (25 cases de large), transitions.json (les matières et leurs blocs) et ajoute la
planche, masquée, au catalogue. À relancer après scripts/build_v2_tiles.py (qui réécrit le catalogue).

Usage : python3 scripts/build_transitions.py
"""
import json
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
V2 = ROOT / 'public' / 'assets' / 'v2'
TILE, HALF, COLS, PER = 16, 8, 25, 625

# Blocs des matières (colonne, rangée) : `outer` = coin haut-gauche du bloc 3 x 3 (coins et bords), `center` = case
# pleine, `inner` = angles rentrants haut-gauche, haut-droit, bas-gauche, bas-droit. Les mêmes que les scripts.
TERRAINS = [
    {'id': 'path', 'name': 'chemin', 'sheet': 'dppt', 'outer': [0, 0], 'center': [1, 1],
     'inner': [[1, 4], [0, 4], [1, 3], [0, 3]]},
    {'id': 'beach', 'name': 'sable', 'sheet': 'dppt', 'outer': [5, 0], 'center': [6, 1],
     'inner': [[7, 4], [6, 4], [7, 3], [6, 3]]},
    {'id': 'sea', 'name': 'mer', 'sheet': 'dppt', 'outer': [5, 5], 'center': [6, 6],
     'inner': [[7, 9], [6, 9], [7, 8], [6, 8]]},
    {'id': 'pond', 'name': 'étang', 'sheet': 'dppt', 'outer': [0, 5], 'center': [1, 6],
     'inner': [[2, 10], [0, 10], [2, 8], [0, 8]]},
    {'id': 'tall', 'name': 'hautes herbes', 'sheet': 'autotiles-g4', 'outer': [0, 1], 'center': [1, 2],
     'inner': [[1, 0]] * 4},
]


def source(t, q, piece):
    """La case de la planche d'où vient le quart `q` pour le morceau `piece`."""
    (ox, oy), qx, qy = t['outer'], q % 2, q // 2
    return [(ox + 2 * qx, oy + 2 * qy), (ox + 1, oy + 2 * qy), (ox + 2 * qx, oy + 1), tuple(t['inner'][q]),
            tuple(t['center'])][piece]


def main():
    sheets = {t['sheet']: Image.open(V2 / f"{t['sheet']}.png").convert('RGBA') for t in TERRAINS}
    out = Image.new('RGBA', (COLS * TILE, len(TERRAINS) * PER // COLS * TILE))
    for ti, t in enumerate(TERRAINS):
        img = sheets[t['sheet']]
        for code in range(PER):
            tile = Image.new('RGBA', (TILE, TILE))
            for q in range(4):
                piece = code // 5 ** q % 5
                c, r = source(t, q, piece)
                qx, qy = q % 2, q // 2
                part = img.crop((c * TILE + qx * HALF, r * TILE + qy * HALF, c * TILE + (qx + 1) * HALF,
                                 r * TILE + (qy + 1) * HALF))
                tile.paste(part, (qx * HALF, qy * HALF))
            k = ti * PER + code
            out.paste(tile, ((k % COLS) * TILE, (k // COLS) * TILE))
    out.save(V2 / 'transitions.png', optimize=True)
    (V2 / 'transitions.json').write_text(json.dumps({'per': PER, 'cols': COLS, 'terrains': TERRAINS}, ensure_ascii=False))
    catalog = json.loads((V2 / 'catalog.json').read_text())
    catalog['sheets'] = [s for s in catalog['sheets'] if s['id'] != 'transitions']
    catalog['sheets'].append({'id': 'transitions', 'name': 'Transitions entre matières (assistant)',
                              'file': 'transitions.png', 'cols': COLS, 'rows': out.height // TILE, 'empty': [],
                              'author': 'assemblées', 'gen': 4, 'hidden': True})
    (V2 / 'catalog.json').write_text(json.dumps(catalog, ensure_ascii=False))
    print(f'{len(TERRAINS)} matières x {PER} cases -> public/assets/v2/transitions.png')


if __name__ == '__main__':
    main()
