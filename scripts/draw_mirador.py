#!/usr/bin/env python3
"""Miradors de la route de Montépilloy au style DS (4 x 5 cases, net, contour fin, sans ombre), à la place des tours
très ombrées de la bibliothèque Gen 4 (check-up visuel, octobre 2026) : toit à quatre pans rouge tuile (le rouge commun
des toits, build_catalogue.py TILE_RED), cabane de planches à fenêtre, plancher, pilotis croisillonnés et échelle au
milieu. Le contour est celui des bâtiments et du mobilier (outline_buildings.py OUTLINE, 1 px).
Les deux premières rangées (toit et cabane) passent au-dessus de Pierre ; les pilotis restent dans les deux colonnes du
milieu (déjà bloquées).

Usage : python3 scripts/draw_mirador.py [<carte> <x> <y> …]   (défaut : route-de-montepilloy 4 10 et 16 10)
"""
import json
import sys
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw

sys.path.insert(0, str(Path(__file__).parent))
import remove_shadows as RS  # noqa: E402

ROOT = Path(__file__).resolve().parent.parent
OUTLINE = (32, 32, 32, 255)
STRIDE = 100000
OVER = 2                      # rangées au-dessus de Pierre

ROOF = [(222, 112, 84, 255), (190, 84, 60, 255), (150, 60, 44, 255)]         # rouge tuile : clair, moyen, sombre
WOOD = [(214, 160, 100, 255), (178, 122, 70, 255), (132, 86, 48, 255), (96, 60, 34, 255)]


def ring(a):
    filled = a[..., 3] > 0
    r = np.zeros_like(filled)
    r[1:, :] |= filled[:-1, :]
    r[:-1, :] |= filled[1:, :]
    r[:, 1:] |= filled[:, :-1]
    r[:, :-1] |= filled[:, 1:]
    return r & ~filled


def draw():
    img = Image.new('RGBA', (64, 80))
    d = ImageDraw.Draw(img)
    # Pilotis (colonnes du milieu : 16 à 47 px) : deux poteaux, croisillons, échelle.
    for x in (18, 43):
        d.rectangle((x, 31, x + 2, 77), fill=WOOD[2])
        d.line((x, 31, x, 77), fill=WOOD[1])
    for y0, y1 in ((38, 56), (56, 74)):
        d.line((21, y0, 42, y1), fill=WOOD[3], width=2)
        d.line((42, y0, 21, y1), fill=WOOD[3], width=2)
    d.rectangle((28, 31, 29, 77), fill=WOOD[1])
    d.rectangle((34, 31, 35, 77), fill=WOOD[1])
    for y in range(35, 77, 6):
        d.line((30, y, 33, y), fill=WOOD[0])
    # Plancher de la cabane.
    d.rectangle((14, 28, 49, 31), fill=WOOD[2])
    d.line((14, 28, 49, 28), fill=WOOD[1])
    # Cabane de planches, ouverture sombre.
    d.rectangle((15, 16, 48, 27), fill=WOOD[1])
    for y in (19, 22, 25):
        d.line((15, y, 48, y), fill=WOOD[2])
    d.rectangle((22, 18, 41, 25), fill=(52, 44, 40, 255))
    d.line((22, 18, 41, 18), fill=(84, 72, 64, 255))
    d.rectangle((31, 18, 32, 25), fill=WOOD[1])
    # Toit à quatre pans (tuiles en rangées), faîtage court.
    d.polygon([(24, 2), (39, 2), (58, 17), (5, 17)], fill=ROOF[1])
    d.polygon([(24, 2), (31, 2), (31, 17), (5, 17)], fill=ROOF[0])
    for y in (6, 10, 14):
        x0 = 24 - (y - 2) * 19 // 15
        x1 = 39 + (y - 2) * 19 // 15
        d.line((x0, y, x1, y), fill=ROOF[2])
    d.line((5, 17, 58, 17), fill=ROOF[2])
    a = np.array(img)
    a[ring(a)] = OUTLINE
    out = Image.fromarray(a)
    d = ImageDraw.Draw(out)
    d.line((5, 18, 58, 18), fill=OUTLINE)            # bord du toit sur la cabane
    d.line((14, 32, 49, 32), fill=OUTLINE)           # dessous du plancher
    return out


def place(m, bd, x0, y0, img):
    W = m['width']
    if 'auto' not in m['sheets']:
        m['sheets'].append('auto')
    slot = m['sheets'].index('auto') * STRIDE
    for j in range(5):
        for i in range(4):
            c = (y0 + j) * W + x0 + i
            m['layers']['decor'][c] = -1
            m['layers']['dessus'][c] = -1
            tile = img.crop((i * 16, j * 16, i * 16 + 16, j * 16 + 16))
            if tile.getbbox() is None:
                continue
            k = bd.image_tile(tile)
            RS.remember_kind(k)
            m['layers']['dessus' if j < OVER else 'decor'][c] = slot + k


def main(args):
    mid = args[0] if args else 'route-de-montepilloy'
    spots = [(int(args[i]), int(args[i + 1])) for i in range(1, len(args), 2)] or [(4, 10), (16, 10)]
    from convert_maps_v2 import Builder, load_catalog
    bd = Builder(load_catalog())
    path = ROOT / 'src' / 'data' / 'builtMaps' / f'{mid}.json'
    m = json.loads(path.read_text())
    img = draw()
    for x0, y0 in spots:
        place(m, bd, x0, y0, img)
        print(f'{mid} : mirador redessiné en ({x0}, {y0})')
    path.write_text(json.dumps(m, ensure_ascii=False))
    bd.save_auto_sheet()
    RS.save_kinds()


if __name__ == '__main__':
    main(sys.argv[1:])
