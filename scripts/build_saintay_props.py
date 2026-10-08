#!/usr/bin/env python3
"""Objets Gen 4 de Saint-Ay (octobre 2026), posés par le jeu par-dessus la carte (voir MapScene, props) :

- public/assets/tiles/g4-planches.png : le tas de planches de l'enclos à poules, le « tas de bois » de la bibliothèque
  Gen 4 (g4-mobilier), détouré proprement : la planche est rééchantillonnée (bords flous, ombre semi-transparente,
  bout d'un objet voisin) ; on garde le dessin d'un seul tenant, en alpha net (pas d'ombre, comme tout le mobilier).
(La cabane perchée Gen 4 a été abandonnée : le jeu garde la cabane de Rubis/Saphir, rs-cabane.png.)

Usage : python3 scripts/build_saintay_props.py
"""
import json
import sys
from pathlib import Path

import numpy as np
from PIL import Image
from scipy import ndimage

sys.path.insert(0, str(Path(__file__).parent))
import build_catalogue as B  # noqa: E402
from outline_buildings import outlined  # noqa: E402

ROOT = Path(__file__).resolve().parent.parent
V2 = ROOT / 'public' / 'assets' / 'v2'
OUT = ROOT / 'public' / 'assets' / 'tiles'
T = 16


def clean_cutout(img, threshold=150):
    """Alpha net : les pixels francs gardés (opaques), le flou et l'ombre retirés ; seul le grand morceau d'un seul
    tenant reste ; les trous d'un pixel dans le dessin sont bouchés avec la couleur voisine."""
    a = np.array(img.convert('RGBA')).astype(int)
    solid = a[..., 3] >= threshold
    # L'ombre : sombre et peu opaque dans la planche d'origine.
    lab, n = ndimage.label(solid, structure=np.ones((3, 3)))
    if n > 1:
        solid = lab == np.bincount(lab.ravel())[1:].argmax() + 1
    solid = ndimage.binary_fill_holes(solid)
    out = np.zeros_like(a)
    out[solid, :3] = a[solid, :3]
    out[solid, 3] = 255
    # Pixels bouchés (alpha faible à l'origine) : couleur du voisin le plus proche bien opaque.
    weak = solid & (a[..., 3] < threshold)
    if weak.any():
        _, (iy, ix) = ndimage.distance_transform_edt(~(solid & ~weak), return_indices=True)
        out[weak, :3] = a[iy[weak], ix[weak], :3]
    return Image.fromarray(out.astype(np.uint8))


def planks():
    d = json.loads((V2 / 'g4-mobilier.elements.json').read_text())['elements'][224]
    c0, r0, c1, r1 = d
    src = Image.open(V2 / 'g4-mobilier.png').convert('RGBA').crop((c0 * T, r0 * T, (c1 + 1) * T, (r1 + 1) * T))
    img = clean_cutout(src)
    bx0, by0, bx1, by1 = img.getbbox()
    img = img.crop((bx0, by0, bx1, by1))
    out = Image.new('RGBA', (2 * T, 2 * T))
    out.alpha_composite(img, ((2 * T - img.width) // 2, 2 * T - img.height))
    return outlined(out)


WOOD = {'k': (52, 36, 30), 'd': (96, 64, 44), 'm': (132, 92, 60), 'l': (170, 124, 82), 'h': (204, 160, 110)}


def main():
    planks().save(OUT / 'g4-planches.png')
    print('g4-planches.png')


if __name__ == '__main__':
    main()
