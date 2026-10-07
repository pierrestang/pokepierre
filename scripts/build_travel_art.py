#!/usr/bin/env python3
"""Images du trajet en avion (FerryScene.playPlane), dans le style DS : l'avion de ligne vu de trois quarts (comme le
ferry du trajet en bateau), les nuages (trois tailles) et l'océan vu d'altitude avec ses îles (motif qui boucle à
l'horizontale).

Écrit public/assets/travel/avion.png, nuages.png (trois nuages côte à côte, voir CLOUDS) et ocean.png.
Usage : python3 scripts/build_travel_art.py
"""
import math
import random
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw
from scipy import ndimage

OUT = Path(__file__).resolve().parent.parent / 'public' / 'assets' / 'travel'

OUTLINE = (40, 48, 72, 255)
WHITE = (248, 248, 248, 255)
LIGHT = (220, 226, 236, 255)
MID = (176, 184, 204, 255)
SHADE = (132, 140, 164, 255)
BLUE = (48, 96, 200, 255)
BLUE_LIGHT = (96, 152, 240, 255)
WINDOW = (44, 60, 100, 255)
GLASS = (120, 176, 232, 255)


def outline(img, color=OUTLINE):
    """Un trait d'un pixel autour du dessin (à l'extérieur)."""
    a = np.array(img)
    solid = a[..., 3] > 0
    ring = ndimage.binary_dilation(solid, structure=np.array([[0, 1, 0], [1, 1, 1], [0, 1, 0]])) & ~solid
    a[ring] = color
    return Image.fromarray(a)


def plane():
    """Avion de ligne, nez à droite, vu de trois quarts (l'aile proche vers le bas de l'écran)."""
    W, H = 120, 64
    img = Image.new('RGBA', (W, H))
    d = ImageDraw.Draw(img)
    # Aile lointaine (derrière le fuselage, dans l'ombre).
    d.polygon([(58, 26), (74, 26), (52, 6), (44, 6)], fill=MID)
    d.line([(46, 7), (52, 7)], fill=LIGHT)
    # Dérive (queue), bleue, et plan horizontal lointain.
    d.polygon([(10, 26), (26, 26), (14, 3), (5, 3)], fill=BLUE)
    d.polygon([(8, 4), (12, 4), (20, 22), (17, 22)], fill=BLUE_LIGHT)
    d.polygon([(12, 26), (22, 26), (12, 18), (7, 18)], fill=MID)
    # Fuselage : un long cylindre, le nez arrondi à droite, la queue qui remonte.
    d.polygon([(6, 25), (20, 22), (100, 22), (100, 40), (22, 40), (10, 33)], fill=WHITE)
    d.ellipse((92, 22, 116, 40), fill=WHITE)
    # Ombre du bas du fuselage, reflet du haut.
    d.polygon([(10, 33), (22, 36), (104, 36), (113, 34), (108, 39), (100, 40), (22, 40)], fill=LIGHT)
    d.polygon([(22, 38), (100, 38), (106, 39), (100, 40), (22, 40)], fill=MID)
    d.line([(22, 23), (100, 23)], fill=(255, 255, 255, 255))
    # Bande bleue et hublots.
    d.polygon([(14, 30), (104, 30), (110, 32), (104, 33), (16, 33)], fill=BLUE)
    d.line([(16, 30), (104, 30)], fill=BLUE_LIGHT)
    for x in range(30, 94, 4):
        d.rectangle((x, 26, x + 1, 27), fill=WINDOW)
    # Cockpit.
    d.polygon([(104, 25), (110, 25), (113, 28), (105, 28)], fill=WINDOW)
    d.line([(106, 26), (109, 26)], fill=GLASS)
    # Porte avant.
    d.rectangle((96, 25, 98, 29), outline=SHADE)
    # Aile proche (devant, vers le bas), avec son réacteur.
    d.polygon([(52, 36), (72, 36), (52, 62), (40, 62)], fill=WHITE)
    d.polygon([(52, 36), (58, 36), (44, 62), (40, 62)], fill=LIGHT)
    d.line([(41, 61), (52, 61)], fill=MID)
    d.line([(72, 36), (52, 62)], fill=SHADE)
    d.ellipse((50, 44, 68, 53), fill=MID)
    d.ellipse((51, 44, 67, 51), fill=LIGHT)
    d.ellipse((63, 45, 68, 52), fill=SHADE)
    d.ellipse((64, 46, 67, 51), fill=WINDOW)
    # Plan horizontal proche.
    d.polygon([(12, 34), (24, 34), (14, 46), (6, 46)], fill=WHITE)
    d.line([(24, 34), (14, 46)], fill=SHADE)
    return outline(img)


def cloud(w, h, seed):
    """Nuage en boules, blanc, ombré de bleu dessous, liseré bleu clair."""
    rnd = random.Random(seed)
    img = Image.new('RGBA', (w, h))
    d = ImageDraw.Draw(img)
    puffs = []
    n = max(4, w // 12)
    for i in range(n):
        cx = 8 + (w - 16) * i / (n - 1)
        r = rnd.randint(h // 4, h // 2 - 2) if 0 < i < n - 1 else h // 4
        cy = h - r - 3 - rnd.randint(0, 3)
        puffs.append((cx, cy, r))
    for cx, cy, r in puffs:                                    # ombre (bas)
        d.ellipse((cx - r, cy - r + 3, cx + r, cy + r + 3), fill=(168, 196, 236, 255))
    for cx, cy, r in puffs:                                    # corps
        d.ellipse((cx - r, cy - r, cx + r, cy + r), fill=(250, 252, 255, 255))
    for cx, cy, r in puffs:                                    # reflets
        d.ellipse((cx - r * 0.55, cy - r * 0.7, cx - r * 0.05, cy - r * 0.3), fill=(255, 255, 255, 255))
    d.rectangle((6, h - 5, w - 7, h - 3), fill=(168, 196, 236, 255))
    return outline(img, (150, 182, 228, 255))


def ocean(w=360, h=168, seed=7):
    """L'océan vu d'altitude : bleu profond, vaguelettes, quelques îles (sable, herbe, arbres) ; boucle à l'horizontale."""
    rnd = random.Random(seed)
    img = Image.new('RGBA', (w, h), (40, 104, 200, 255))
    d = ImageDraw.Draw(img)
    for _ in range(140):                                       # vaguelettes
        x, y = rnd.randrange(w), rnd.randrange(h)
        c = rnd.choice([(72, 136, 224, 255), (56, 120, 216, 255), (120, 176, 240, 255)])
        for dx in (-w, 0, w):
            d.line((x + dx, y, x + dx + rnd.randint(3, 6), y), fill=c)
    for cx, cy, rx, ry in [(70, 120, 26, 14), (230, 40, 18, 10), (300, 130, 12, 7)]:
        for dx in (-w, 0, w):
            x = cx + dx
            d.ellipse((x - rx - 5, cy - ry - 4, x + rx + 5, cy + ry + 4), fill=(96, 168, 232, 255))   # haut-fond
            d.ellipse((x - rx - 2, cy - ry - 2, x + rx + 2, cy + ry + 2), fill=(240, 220, 160, 255))  # plage
            d.ellipse((x - rx, cy - ry, x + rx, cy + ry), fill=(88, 176, 88, 255))                    # herbe
            for k in range(rx // 4):
                tx, ty = x - rx // 2 + k * 5, cy - 2 + (k % 2) * 4
                d.ellipse((tx - 3, ty - 3, tx + 3, ty + 2), fill=(48, 128, 64, 255))
                d.point((tx - 1, ty - 2), fill=(120, 200, 112, 255))
    return img


CLOUDS = [(72, 30), (52, 24), (36, 18)]


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    plane().save(OUT / 'avion.png')
    sheet = Image.new('RGBA', (sum(w for w, _ in CLOUDS), max(h for _, h in CLOUDS)))
    x = 0
    for i, (w, h) in enumerate(CLOUDS):
        sheet.alpha_composite(cloud(w, h, i + 3), (x, sheet.height - h))
        x += w
    sheet.save(OUT / 'nuages.png')
    ocean().save(OUT / 'ocean.png')
    print('public/assets/travel : avion.png, nuages.png, ocean.png')


if __name__ == '__main__':
    main()
