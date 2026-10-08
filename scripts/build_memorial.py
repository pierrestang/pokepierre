#!/usr/bin/env python3
"""Le mémorial de l'Anse Caffard (Cap 110, Fort-de-France) en élément de carte : les six statues de pierre blanche
d'origine (dessin de src/art/tileArt.js CAP_STATUE, même disposition CAP_LAYOUT : trois derrière, deux au milieu,
une devant), en cases de 16 px, pour qu'il soit dans le dessin de la carte (visible dans le jeu et dans le créateur).

Écrit assets-source/elements-cartes/memorial-cap110.png et son entrée dans elements.json (4 x 3 cases : la rangée
du haut, les têtes du fond, passe au-dessus de Pierre ; le reste bloque comme les cases du mémorial). Ensuite :
python3 scripts/build_catalogue.py.
"""
import json
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / 'assets-source' / 'elements-cartes'

CAP_STATUE = [
    '.....kkkk.....',
    '....kLLLLk....',
    '...kLLLLLmk...',
    '...kLLLLLmk...',
    '...kLmLLmmk...',
    '....kLLLmk....',
    '..kkkmmmmkkk..',
    '.kLLLkmmmkLLk.',
    'kLLLLLkkkLLLmk',
    'kLLLmLLLLLLmmk',
    'kLLLmLLLLLmmmk',
    '.kLLkLLLLkmmk.',
    '.kLLkLLLLkmmk.',
    '.kLLkLLLLkmmk.',
    '.kLmkLLLLkmmk.',
    '.kmmkLLLmkmmk.',
    '.kkkkmmmmkkkk.',
    'kddddddddddddk',
    'kddddddddddddk',
    '.kkkkkkkkkkkk.',
]
COLORS = {'k': (0x5c, 0x58, 0x50), 'L': (0xf0, 0xec, 0xe4), 'm': (0xc8, 0xc0, 0xb4), 'd': (0xa8, 0xa0, 0x94)}
LAYOUT = [(11, -4), (25, -4), (39, -4), (18, 4), (32, 4), (25, 12)]   # coin de chaque statue / coin du groupe
TOP = 16                                                             # une rangée au-dessus du groupe (les têtes)


def draw():
    img = Image.new('RGBA', (64, 48))
    px = img.load()
    for sx, sy in LAYOUT:
        for x in range(14):                                          # ombre au pied
            for y in (19, 20):
                X, Y = sx + 1 + x, TOP + sy + y
                if 0 <= X < 64 and 0 <= Y < 48 and px[X, Y][3] == 0:
                    px[X, Y] = (0, 0, 0, 51)
        for ry, row in enumerate(CAP_STATUE):
            for rx, c in enumerate(row):
                if c != '.':
                    px[sx + rx, TOP + sy + ry] = COLORS[c] + (255,)
    return img


def main():
    draw().save(OUT / 'memorial-cap110.png')
    elements = json.loads((OUT / 'elements.json').read_text())
    elements = [e for e in elements if e['id'] != 'memorial-cap110']
    elements.append({
        'id': 'memorial-cap110', 'map': 'fort-de-france', 'x': 6, 'y': 13, 'w': 4, 'h': 3, 'cat': 'mobilier',
        'place': 'land', 'solid': [[0, 0, 0, 0], [1, 1, 1, 1], [0, 1, 1, 0]], 'over': 1, 'door': None,
        'name': "Mémorial de l'Anse Caffard", 'from': 'tileArt.capStatues',
    })
    (OUT / 'elements.json').write_text(json.dumps(elements, ensure_ascii=False, indent=1))
    print('assets-source/elements-cartes/memorial-cap110.png')


if __name__ == '__main__':
    main()
