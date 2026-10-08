#!/usr/bin/env python3
"""Fanions de la guirlande de fête (Fort-de-France, Joie de vivre) : découpés dans la guirlande animée FX_Flag01
(ASSETTILESPOKEMONV2/animations/drapeaux/guirlande-fanions.png : 4 images de 144 x 32, deux poteaux et sept fanions).

Écrit public/assets/decor/fanions.png : une planche de 7 x 2 cases de 20 x 16 px, un fanion par case, le haut (là où il
pend au fil) en haut de la case, centré. Rangée 0 : fanions au repos (image 2 de l'animation) ; rangée 1 : soulevés
par le vent (image 1). Le fil et la pose le long d'un fil sont faits dans le jeu (MapScene, décor `fanions`).

Usage : python3 scripts/build_fanions.py
"""
from pathlib import Path

import numpy as np
from PIL import Image
from scipy import ndimage

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / 'ASSETTILESPOKEMONV2' / 'animations' / 'drapeaux' / 'guirlande-fanions.png'
OUT = ROOT / 'public' / 'assets' / 'decor' / 'fanions.png'
FRAME_W, CELL_W, CELL_H, COUNT = 144, 20, 16, 7


def pennants(frame):
    """Les fanions d'une image, de gauche à droite : (image découpée au pixel près, sans le fil ni les poteaux)."""
    a = np.array(frame).astype(int)
    r, g, b = a[..., 0], a[..., 1], a[..., 2]
    gray = (abs(r - g) < 20) & (abs(g - b) < 20)          # le fil et les poteaux sont gris
    mask = (a[..., 3] > 0) & ~gray
    mask[:, :12] = mask[:, 132:] = False                   # les poteaux et leurs boules dorées
    labels, _ = ndimage.label(mask)
    found = []
    for k, sl in enumerate(ndimage.find_objects(labels), 1):
        if (sl[0].stop - sl[0].start) * (sl[1].stop - sl[1].start) <= 12:
            continue
        piece = a[sl].copy()
        piece[labels[sl] != k] = 0
        found.append((sl[1].start, Image.fromarray(piece.astype(np.uint8))))
    found.sort(key=lambda f: f[0])
    assert len(found) == COUNT, f'{len(found)} fanions trouvés au lieu de {COUNT}'
    return [img for _, img in found]


def main():
    sheet = Image.open(SRC).convert('RGBA')
    out = Image.new('RGBA', (COUNT * CELL_W, 2 * CELL_H))
    for row, index in enumerate((1, 0)):
        frame = sheet.crop((index * FRAME_W, 0, (index + 1) * FRAME_W, sheet.height))
        for col, img in enumerate(pennants(frame)):
            assert img.width <= CELL_W and img.height <= CELL_H, img.size
            out.alpha_composite(img, (col * CELL_W + (CELL_W - img.width) // 2, row * CELL_H))
    OUT.parent.mkdir(parents=True, exist_ok=True)
    out.save(OUT, optimize=True)
    print(f'{COUNT} fanions x 2 -> {OUT.relative_to(ROOT)}')


if __name__ == '__main__':
    main()
