#!/usr/bin/env python3
"""Le désordre du lendemain de la soirée de Bordeaux (appartement, voir interiors.appartement), dans le style DS :
gobelets rouges renversés, canettes écrasées, boîte de pizza entamée, paquet de chips, bouteilles, confettis, couette en
vrac sur le lit.

Écrit public/assets/props/desordre.png : une rangée d'images (cases de 16 px, la couette en fait 2), dans l'ordre de
MESS_FRAMES de src/art/partyMess.js.
Usage : python3 scripts/build_party_mess.py
"""
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw
from scipy import ndimage

OUT = Path(__file__).resolve().parent.parent / 'public' / 'assets' / 'props'
INK = (56, 40, 40, 255)
SHADOW = (0, 0, 0, 60)


def outline(img, color=INK):
    a = np.array(img)
    solid = a[..., 3] > 100
    ring = ndimage.binary_dilation(solid, structure=np.array([[0, 1, 0], [1, 1, 1], [0, 1, 0]])) & ~solid
    a[ring] = color
    return Image.fromarray(a)


def with_shadow(draw_fn, size=(16, 16), shadow=(3, 12, 14, 15)):
    img = Image.new('RGBA', size)
    ImageDraw.Draw(img).ellipse(shadow, fill=SHADOW)
    obj = Image.new('RGBA', size)
    draw_fn(ImageDraw.Draw(obj))
    img.alpha_composite(outline(obj))
    return img


def cups(d):
    red, light, rim = (216, 48, 56, 255), (248, 112, 112, 255), (248, 244, 236, 255)
    # Un gobelet debout.
    d.polygon([(2, 5), (7, 5), (6, 12), (3, 12)], fill=red)
    d.line([(3, 6), (3, 11)], fill=light)
    d.line([(2, 5), (7, 5)], fill=rim)
    # Un gobelet couché, ouverture vers la droite, une flaque.
    d.ellipse((9, 11, 15, 14), fill=(232, 196, 96, 200))
    d.polygon([(8, 8), (13, 9), (13, 12), (8, 12)], fill=red)
    d.line([(9, 9), (12, 9)], fill=light)
    d.line([(13, 9), (13, 12)], fill=rim)


def cans(d):
    for (x, y, c) in [(2, 7, (64, 112, 216)), (8, 9, (72, 168, 88)), (11, 4, (196, 200, 212))]:
        r, g, b = c
        d.polygon([(x, y), (x + 4, y - 1), (x + 5, y + 3), (x + 1, y + 4)], fill=(r, g, b, 255))
        d.line([(x + 1, y), (x + 4, y - 1)], fill=(min(255, r + 70), min(255, g + 70), min(255, b + 70), 255))
        d.point((x + 2, y + 2), fill=(240, 240, 248, 255))


def pizza(d):
    d.rectangle((1, 5, 14, 13), fill=(232, 208, 160, 255))               # boîte ouverte
    d.rectangle((2, 6, 13, 12), fill=(244, 228, 192, 255))
    d.rectangle((1, 2, 14, 5), fill=(212, 184, 136, 255))                # couvercle relevé
    d.line([(3, 3), (12, 3)], fill=(200, 64, 56, 255))
    d.polygon([(4, 11), (9, 7), (10, 11)], fill=(248, 200, 88, 255))      # la dernière part
    d.line([(4, 11), (10, 11)], fill=(208, 152, 72, 255))
    for p in ((7, 9), (8, 10)):
        d.point(p, fill=(200, 56, 48, 255))


def chips(d):
    d.polygon([(3, 4), (11, 3), (12, 11), (4, 12)], fill=(232, 176, 40, 255))   # paquet
    d.polygon([(3, 4), (11, 3), (11, 5), (3, 6)], fill=(200, 56, 48, 255))
    d.rectangle((6, 7, 9, 9), fill=(248, 232, 168, 255))
    for p in ((12, 13), (14, 11), (10, 14), (1, 13)):                     # chips renversées
        d.ellipse((p[0] - 1, p[1] - 1, p[0] + 1, p[1] + 1), fill=(248, 216, 112, 255))


def bottles(d):
    d.polygon([(1, 10), (9, 8), (10, 11), (2, 13)], fill=(56, 120, 72, 255))     # couchée
    d.polygon([(9, 8), (13, 7), (13, 9), (10, 11)], fill=(56, 120, 72, 255))
    d.line([(2, 10), (8, 9)], fill=(136, 200, 144, 255))
    d.rectangle((11, 2, 13, 9), fill=(120, 72, 40, 255))                          # debout
    d.rectangle((11, 0, 12, 2), fill=(120, 72, 40, 255))
    d.line([(11, 3), (11, 8)], fill=(184, 128, 88, 255))


def confetti():
    img = Image.new('RGBA', (16, 16))
    d = ImageDraw.Draw(img)
    colors = [(232, 64, 96), (64, 160, 232), (248, 200, 64), (96, 200, 120), (176, 96, 232)]
    pts = [(2, 3), (6, 9), (11, 2), (13, 12), (4, 13), (9, 6), (14, 7), (1, 9), (8, 14), (12, 5)]
    for i, (x, y) in enumerate(pts):
        d.rectangle((x, y, x + 1, y), fill=colors[i % len(colors)] + (255,))
    return img


def duvet():
    """Couette en vrac et oreiller de travers (posés sur le lit de Pierre, 2 cases de large)."""
    img = Image.new('RGBA', (32, 16))
    obj = Image.new('RGBA', (32, 16))
    d = ImageDraw.Draw(obj)
    d.ellipse((3, 3, 12, 8), fill=(248, 244, 240, 255))                 # oreiller de travers
    d.polygon([(2, 7), (14, 4), (28, 8), (26, 15), (12, 15), (3, 13)], fill=(232, 152, 176, 255))
    for line in [((6, 9), (13, 7)), ((14, 7), (22, 11)), ((9, 13), (18, 10))]:
        d.line(line, fill=(200, 104, 136, 255))
    d.line([(15, 6), (24, 9)], fill=(248, 192, 208, 255))
    img.alpha_composite(outline(obj))
    return img


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    frames = [with_shadow(cups), with_shadow(cans), with_shadow(pizza), with_shadow(chips), with_shadow(bottles),
              confetti(), duvet()]
    sheet = Image.new('RGBA', (sum(f.width for f in frames), 16))
    x = 0
    for f in frames:
        sheet.alpha_composite(f, (x, 0))
        x += f.width
    sheet.save(OUT / 'desordre.png')
    print('public/assets/props/desordre.png')


if __name__ == '__main__':
    main()
