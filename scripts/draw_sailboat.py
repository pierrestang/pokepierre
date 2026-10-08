#!/usr/bin/env python3
"""Voilier de Fort-de-France au style DS (3 x 2 cases, net, contour fin, sans ombre), à la place du voilier très détaillé
aux bords flous (check-up visuel, octobre 2026). Coque blanche à liseré bleu, pont de bois, mât, grand-voile et foc
blancs à bande rose, fanion rouge. Le contour est le même que celui des bâtiments et du mobilier
(scripts/outline_buildings.py OUTLINE, 1 px).

Usage : python3 scripts/draw_sailboat.py [<carte> <x> <y>]   (défaut : fort-de-france 2 30, coin haut gauche)
  -> remplace les cases Décor du voilier (3 x 2) par les cases assemblées du nouveau dessin (planche auto).
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


def draw():
    img = Image.new('RGBA', (48, 32))
    d = ImageDraw.Draw(img)
    # Coque (proue à droite), liseré bleu, pont de bois.
    d.polygon([(5, 21), (43, 21), (39, 28), (9, 28)], fill=(244, 244, 236, 255))
    d.polygon([(8, 25), (41, 25), (40, 27), (9, 27)], fill=(206, 210, 214, 255))
    d.line((6, 23, 42, 23), fill=(64, 120, 200, 255))
    d.line((7, 24, 41, 24), fill=(48, 96, 176, 255))
    d.rectangle((7, 19, 41, 20), fill=(196, 146, 88, 255))
    d.line((7, 19, 41, 19), fill=(222, 176, 116, 255))
    # Mât et fanion.
    d.rectangle((23, 2, 23, 19), fill=(120, 84, 52, 255))
    d.polygon([(24, 2), (29, 3), (24, 4)], fill=(220, 56, 56, 255))
    # Grand-voile (à droite du mât) et foc (à gauche), bande rose.
    d.polygon([(24, 5), (24, 18), (37, 18)], fill=(250, 250, 250, 255))
    d.polygon([(24, 12), (24, 14), (31, 14), (29, 12)], fill=(236, 140, 160, 255))
    d.line((25, 17, 36, 17), fill=(214, 220, 230, 255))
    d.polygon([(22, 7), (22, 18), (12, 18)], fill=(244, 246, 250, 255))
    d.polygon([(22, 13), (22, 15), (17, 15), (18, 13)], fill=(236, 140, 160, 255))
    d.line((14, 17, 21, 17), fill=(210, 216, 228, 255))
    # Contour extérieur : toute case transparente qui touche le dessin.
    a = np.array(img)
    filled = a[..., 3] > 0
    ring = np.zeros_like(filled)
    ring[1:, :] |= filled[:-1, :]
    ring[:-1, :] |= filled[1:, :]
    ring[:, 1:] |= filled[:, :-1]
    ring[:, :-1] |= filled[:, 1:]
    a[ring & ~filled] = OUTLINE
    out = Image.fromarray(a)
    # Traits intérieurs : bord du pont et pied des voiles.
    d = ImageDraw.Draw(out)
    d.line((7, 21, 41, 21), fill=OUTLINE)
    d.line((12, 18, 37, 18), fill=OUTLINE)
    return out


def main(args):
    mid, x0, y0 = (args[0], int(args[1]), int(args[2])) if args else ('fort-de-france', 2, 30)
    from convert_maps_v2 import Builder, load_catalog
    bd = Builder(load_catalog())
    path = ROOT / 'src' / 'data' / 'builtMaps' / f'{mid}.json'
    m = json.loads(path.read_text())
    W = m['width']
    if 'auto' not in m['sheets']:
        m['sheets'].append('auto')
    slot = m['sheets'].index('auto')
    img = draw()
    for j in range(2):
        for i in range(3):
            k = bd.image_tile(img.crop((i * 16, j * 16, i * 16 + 16, j * 16 + 16)))
            RS.remember_kind(k)
            m['layers']['decor'][(y0 + j) * W + x0 + i] = slot * STRIDE + k
    path.write_text(json.dumps(m, ensure_ascii=False))
    bd.save_auto_sheet()
    RS.save_kinds()
    print(f'{mid} : voilier redessiné en ({x0}, {y0})')


if __name__ == '__main__':
    main(sys.argv[1:])
