#!/usr/bin/env python3
"""Objets posés sur les cartes (props des cartes du jeu) dessinés dans le style Gen 4 DS, faute d'asset (octobre 2026) :
le tracteur de M. Bouly et la caisse à outils de Jean (Montépilloy), la porte de Notre-Dame (Paris). Volumes ombrés, reflets, liseré gris très foncé
(32, 32, 32) comme les objets des cartes (scripts/outline_buildings.py), pas d'ombre portée.

Écrit public/assets/props/<nom>.png (voir src/art/propImages.js). Usage : python3 scripts/build_props.py
"""
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw
from scipy import ndimage

OUT = Path(__file__).resolve().parent.parent / 'public' / 'assets' / 'props'
EDGE = (32, 32, 32, 255)


def outline(img):
    """Liseré d'un pixel autour du dessin (dans l'image : le bord transparent devient gris très foncé)."""
    a = np.array(img)
    solid = a[..., 3] > 0
    ring = ndimage.binary_dilation(solid, structure=np.ones((3, 3))) & ~solid
    a[ring] = EDGE
    return Image.fromarray(a)


def wheel(d, cx, cy, r, hub):
    """Roue : pneu noir à crampons, jante jaune, moyeu."""
    d.ellipse((cx - r, cy - r, cx + r, cy + r), fill=(44, 42, 46, 255))
    for k in range(0, 360, 30):                                     # crampons
        v = np.deg2rad(k)
        x, y = cx + (r - 0.5) * np.cos(v), cy + (r - 0.5) * np.sin(v)
        d.point((round(x), round(y)), fill=(78, 76, 82, 255))
    d.ellipse((cx - r + 2, cy - r + 2, cx + r - 2, cy + r - 2), fill=(30, 28, 32, 255))
    d.ellipse((cx - hub, cy - hub, cx + hub, cy + hub), fill=(232, 192, 56, 255))
    d.ellipse((cx - hub + 1, cy - hub + 1, cx + hub - 1, cy + hub - 1), fill=(248, 220, 104, 255))
    d.point((cx, cy), fill=(150, 112, 30, 255))
    d.arc((cx - r, cy - r, cx + r, cy + r), 200, 260, fill=(110, 108, 116, 255))   # reflet du pneu


def tractor():
    """Tracteur rouge vu de trois quarts (vers la gauche), cabine vitrée, pot d'échappement chromé : 40 x 34 px."""
    img = Image.new('RGBA', (40, 34))
    d = ImageDraw.Draw(img)
    red, light, dark, deep = (206, 44, 38, 255), (240, 98, 74, 255), (150, 26, 26, 255), (104, 18, 20, 255)
    # Garde-boue arrière et cabine.
    d.rectangle((21, 4, 34, 6), fill=(60, 58, 64, 255))             # toit
    d.line((21, 4, 34, 4), fill=(110, 108, 118, 255))
    d.rectangle((22, 7, 23, 19), fill=(70, 68, 74, 255))            # montants
    d.rectangle((33, 7, 34, 19), fill=(70, 68, 74, 255))
    d.rectangle((24, 7, 32, 16), fill=(150, 206, 236, 255))         # vitre
    d.line((25, 8, 28, 8), fill=(228, 246, 255, 255))
    d.line((25, 9, 26, 9), fill=(228, 246, 255, 255))
    d.rectangle((26, 13, 30, 16), fill=(70, 50, 40, 255))           # siège
    # Capot et moteur.
    d.rounded_rectangle((4, 13, 26, 23), 3, fill=red)
    d.line((6, 13, 24, 13), fill=light)
    d.line((5, 14, 5, 21), fill=light)
    d.rectangle((6, 19, 25, 23), fill=dark)                         # bas de caisse
    d.rectangle((3, 15, 5, 22), fill=(176, 172, 168, 255))          # calandre
    for y in (16, 18, 20):
        d.line((3, y, 5, y), fill=(96, 92, 92, 255))
    d.point((4, 14), fill=(250, 240, 180, 255))                     # phare
    # Garde-boue arrière (au-dessus de la grosse roue).
    d.pieslice((18, 12, 38, 32), 180, 360, fill=red)
    d.arc((18, 12, 38, 32), 190, 300, fill=light)
    d.rectangle((18, 21, 38, 23), fill=deep)
    # Pot d'échappement.
    d.rectangle((11, 5, 12, 13), fill=(168, 168, 176, 255))
    d.point((11, 6), fill=(236, 236, 240, 255))
    d.rectangle((10, 4, 13, 5), fill=(70, 70, 76, 255))
    # Roues.
    wheel(d, 28, 24, 9, 3)
    wheel(d, 9, 27, 6, 2)
    return outline(img)


def toolbox():
    """Caisse à outils de métal rouge, couvercle entrouvert : une clé et un tournevis dépassent (16 x 14 px)."""
    img = Image.new('RGBA', (16, 14))
    d = ImageDraw.Draw(img)
    red, light, dark = (200, 48, 40, 255), (240, 104, 84, 255), (132, 28, 26, 255)
    d.line((6, 1, 9, 1), fill=(80, 80, 88, 255))                    # poignée
    d.line((5, 2, 5, 3), fill=(80, 80, 88, 255))
    d.line((10, 2, 10, 3), fill=(80, 80, 88, 255))
    d.line((3, 1, 3, 5), fill=(190, 190, 198, 255))                 # tournevis
    d.point((3, 0), fill=(240, 196, 48, 255))
    d.line((12, 2, 13, 5), fill=(170, 170, 180, 255))               # clé
    d.rectangle((12, 1, 14, 2), fill=(170, 170, 180, 255))
    d.rectangle((1, 4, 14, 6), fill=light)                          # couvercle
    d.line((1, 4, 14, 4), fill=(255, 150, 130, 255))
    d.rectangle((1, 7, 14, 13), fill=red)                           # caisse
    d.line((1, 7, 14, 7), fill=dark)
    d.rectangle((1, 12, 14, 13), fill=dark)
    d.rectangle((7, 8, 8, 9), fill=(232, 196, 64, 255))             # fermoir
    d.line((2, 8, 2, 11), fill=light)
    return outline(img)


def cathedral_door():
    """La grande porte de Notre-Dame (Paris) : le dessin de la cathédrale n'a qu'une ouverture noire. Deux battants de bois
    sous l'arche, taillés à sa forme : image de 48 x 48 (les cases x 24-26, rangées 39-41 de la carte), l'ouverture en
    x 11-36, son sommet en marches (y 14, 9, puis 7 au milieu), le bas en y 37 (le seuil sombre du dessin reste dessous)."""
    img = Image.new('RGBA', (48, 48))
    d = ImageDraw.Draw(img)
    top = {x: (14 if x <= 13 or x >= 34 else 9 if x <= 16 or x >= 31 else 7) for x in range(11, 37)}
    wood, plank, light, iron = (150, 96, 52, 255), (116, 72, 38, 255), (186, 128, 70, 255), (84, 78, 80, 255)
    for x, t in top.items():
        d.line((x, t, x, 37), fill=wood)
        if (x - 11) % 4 == 3:
            d.line((x, t + 1, x, 37), fill=plank)                      # les planches
        d.point((x, t), fill=EDGE)                                       # le haut, sous l'arche
        d.point((x, t + 1), fill=light)
    for x in (11, 36):
        d.line((x, top[x], x, 37), fill=EDGE)                            # les montants
    d.line((23, 7, 23, 37), fill=EDGE)                                   # les deux battants
    d.line((24, 7, 24, 37), fill=plank)
    for y in (17, 29):                                                   # les pentures de fer
        d.line((12, y, 22, y), fill=iron)
        d.line((25, y, 35, y), fill=iron)
    for x in (21, 26):                                                   # les anneaux
        d.ellipse((x - 1, 22, x + 1, 24), outline=(232, 196, 64, 255))
    return img


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    for name, fn in (('tracteur', tractor), ('caisse-outils', toolbox), ('porte-notre-dame', cathedral_door)):
        fn().save(OUT / f'{name}.png')
        print(f'public/assets/props/{name}.png')


if __name__ == '__main__':
    main()
