#!/usr/bin/env python3
"""Objets Gen 4 de Saint-Ay (octobre 2026), posés par le jeu par-dessus la carte (voir MapScene, props) :

- public/assets/tiles/g4-planches.png : le tas de planches de l'enclos à poules, le « tas de bois » de la bibliothèque
  Gen 4 (g4-mobilier), détouré proprement : la planche est rééchantillonnée (bords flous, ombre semi-transparente,
  bout d'un objet voisin) ; on garde le dessin d'un seul tenant, en alpha net (pas d'ombre, comme tout le mobilier).
- public/assets/tiles/g4-cabane.png : la cabane perchée des cousins : la « Cabane de bois » Gen 4 (g4-batiments, toit
  de planches et cheminée, même liseré que les bâtiments) sur une plateforme de planches, des pilotis et une échelle
  sous la porte. Le jeu cale l'échelle sur la case où l'on monte (frlgArt.js CABANE_LADDER_X, écrit ici).

Usage : python3 scripts/build_saintay_props.py
"""
import json
import re
import sys
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw
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


def treehouse():
    """La cabane perchée : renvoie (image, x gauche de l'échelle dans l'image)."""
    _, box, _, greys, _ = B.LIB_BUILDINGS['cabane']
    hut = outlined(B.lib_building(box, greys))
    bx0, by0, bx1, by1 = hut.getbbox()
    hut = hut.crop((bx0, by0, bx1, by1))
    # Porte de la cabane : la zone bleue du bas du dessin (son milieu).
    h = np.array(hut).astype(int)
    blue = (h[..., 3] > 0) & (h[..., 2] > h[..., 0] + 40) & (h[..., 2] > 80)
    blue[: hut.height // 2] = False
    xs = np.nonzero(blue.any(0))[0]
    door_x = int((xs.min() + xs.max() + 1) // 2)
    deck_h, stilt_h, margin = 8, 26, 5
    W = hut.width + 2 * margin
    H = hut.height + deck_h + stilt_h
    img = Image.new('RGBA', (W, H))
    d = ImageDraw.Draw(img)
    c = {k: v + (255,) for k, v in WOOD.items()}
    deck_top = hut.height - 3                        # la cabane pose sur la plateforme
    stilt_top = deck_top + deck_h
    # Pilotis (quatre poteaux, les deux du fond plus sombres) et croisillons.
    for x, back in ((margin + 4, True), (W - margin - 9, True), (margin, False), (W - margin - 5, False)):
        y0 = stilt_top - (4 if back else 0)
        d.rectangle((x, y0, x + 4, H - 1), fill=c['k'])
        d.rectangle((x + 1, y0, x + 3, H - 2), fill=c['d'] if back else c['m'])
        if not back:
            d.line((x + 1, y0, x + 1, H - 2), fill=c['l'])
    # Plateforme : planches vues de dessus, puis la tranche.
    d.rectangle((0, deck_top, W - 1, stilt_top), fill=c['k'])
    d.rectangle((1, deck_top + 1, W - 2, stilt_top - 4), fill=c['l'])
    for x in range(1, W - 2, 7):
        d.line((x, deck_top + 1, x, stilt_top - 4), fill=c['m'])
    d.line((1, deck_top + 1, W - 2, deck_top + 1), fill=c['h'])
    d.rectangle((1, stilt_top - 3, W - 2, stilt_top - 1), fill=c['d'])
    img.alpha_composite(hut, (margin, 0))
    # Échelle sous la porte, de la plateforme jusqu'au sol.
    lx = margin + door_x - 6
    d.rectangle((lx, stilt_top - 1, lx + 1, H - 1), fill=c['k'])
    d.rectangle((lx + 10, stilt_top - 1, lx + 11, H - 1), fill=c['k'])
    d.line((lx + 1, stilt_top, lx + 1, H - 1), fill=c['l'])
    d.line((lx + 11, stilt_top, lx + 11, H - 1), fill=c['m'])
    for y in range(stilt_top + 3, H - 1, 5):
        d.rectangle((lx + 2, y, lx + 9, y + 1), fill=c['k'])
        d.line((lx + 2, y, lx + 9, y), fill=c['h'])
    return img, lx


def main():
    planks().save(OUT / 'g4-planches.png')
    img, ladder = treehouse()
    img.save(OUT / 'g4-cabane.png')
    # L'échelle (12 px) centrée sur sa case : décalage de l'image par rapport au bord gauche de cette case.
    art = ROOT / 'src' / 'art' / 'frlgArt.js'
    s = art.read_text()
    s = re.sub(r'export const G4_CABANE_LADDER_X = \d+;', f'export const G4_CABANE_LADDER_X = {ladder - 2};', s)
    art.write_text(s)
    print('g4-planches.png, g4-cabane.png', img.size, 'échelle en x =', ladder)


if __name__ == '__main__':
    main()
