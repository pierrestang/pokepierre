#!/usr/bin/env python3
"""Le grand repas partagé de New Delhi (octobre 2026) : le tapis garni posé par terre au milieu de la cour, et l'assiette
qu'on tend à Pierre. Deux ressources de fans choisies par l'utilisateur (voir assets-source/fan/food/CREDITS.txt) :
- les plats de « Free Pixel foods » (ghostpixxells, itch.io, CC0) : icônes de 32 px, ramenées à 16 px (chaque bloc de
  2 x 2 pixels prend sa couleur la plus fréquente, la plus sombre en cas d'égalité : les contours restent) ;
- la vaisselle Gen 4 de « Cafe, Restaurant and Bar Tiles » (PeekyChew, DeviantArt, crédit demandé) : les assiettes
  blanches devant chaque convive et la carafe d'eau, à l'échelle du jeu.
Le tapis tissé (bordure ocre, champ rouge, petits motifs) est dessiné ici, liseré gris très foncé comme les objets
(scripts/build_props.py), sans ombre portée.

Écrit public/assets/props/repas.png (4 x 2 cases, posé à plat sous les personnages) et public/assets/props/plat.png
(l'assiette qui glisse vers Pierre, étape `pass`). Usage : python3 scripts/build_meal.py
"""
from collections import Counter
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / 'assets-source' / 'fan' / 'food'
OUT = ROOT / 'public' / 'assets' / 'props'
EDGE = (32, 32, 32, 255)

# ghostpixxells : l'image d'aperçu (680 x 800) montre les icônes de 32 px agrandies deux fois, dans une grille de 64 px
# (case (rangée, colonne) en (20 + 64 c, 78 + 64 r)), sur un fond gris.
FOODS = SRC / 'ghostpixxells-preview.png'
FOOD_BG = (199, 199, 199)
FOOD = {
    'riz': (8, 3),          # le riz parfumé, en grand bol
    'boulettes': (6, 9),    # les boulettes en sauce
    'pakoras': (2, 4),      # les beignets
    'dal': (8, 6),          # le bol de lentilles
    'galette': (7, 2),      # la galette pliée
}
# PeekyChew : boîtes (x0, y0, x1, y1) dans la planche ; le fond (les couleurs du bord de la boîte) est retiré.
DISHES = SRC / 'peekychew-cafe-restaurant-bar.png'
PLATE = (241, 95, 255, 109)
CARAFE = (258, 112, 271, 129)


def is_shadow(p):
    r, g, b = p[:3]
    return p[3] > 0 and max(r, g, b) - min(r, g, b) < 10 and 60 < r < 190


def food_icon(r, c):
    """L'icône de 32 px (la phase de l'agrandissement qui colle le mieux), puis réduite à 16 px."""
    im = Image.open(FOODS).convert('RGBA')
    x0, y0 = 20 + 64 * c, 78 + 64 * r
    best = None
    for dx, dy in ((0, 0), (1, 0), (0, 1), (1, 1)):
        crop = im.crop((x0 + dx, y0 + dy, x0 + dx + 64, y0 + dy + 64))
        small = crop.resize((32, 32), Image.NEAREST)
        err = sum(a != b for a, b in zip(small.resize((64, 64), Image.NEAREST).getdata(), crop.getdata()))
        if best is None or err < best[0]:
            best = (err, small)
    icon = best[1]
    # Le fond, et l'ombre portée grise sous les plats (pas d'ombres portées dans le jeu) : transparents.
    icon.putdata([(0, 0, 0, 0) if p[:3] == FOOD_BG or is_shadow(p) else p for p in icon.getdata()])
    out = Image.new('RGBA', (16, 16))
    for y in range(16):
        for x in range(16):
            px = [icon.getpixel((2 * x + i, 2 * y + j)) for i in (0, 1) for j in (0, 1)]
            opaque = [p for p in px if p[3] > 128]
            if len(opaque) < 2:
                continue
            counts = Counter(opaque).most_common()
            top = [k for k, v in counts if v == counts[0][1]]
            out.putpixel((x, y), min(top, key=lambda p: sum(p[:3])))
    return out.crop(out.getbbox())


def dish(box):
    """Un objet de la planche de PeekyChew, détouré : les couleurs du bord de la boîte sont le sol."""
    im = Image.open(DISHES).convert('RGBA').crop(box)
    w, h = im.size
    border = {im.getpixel((x, y))[:3] for x in range(w) for y in range(h) if x in (0, w - 1) or y in (0, h - 1)}
    im.putdata([(0, 0, 0, 0) if p[:3] in border else p for p in im.getdata()])
    return im.crop(im.getbbox())


def mat(w, h):
    """Le tapis tissé : liseré, bordure ocre, champ rouge, petits motifs clairs."""
    img = Image.new('RGBA', (w, h))
    px = img.load()
    for y in range(h):
        for x in range(w):
            edge = x in (0, w - 1) or y in (0, h - 1)
            border = x < 3 or x >= w - 3 or y < 3 or y >= h - 3
            if edge:
                px[x, y] = EDGE
            elif border:
                px[x, y] = (216, 160, 64, 255) if (x + y) % 4 else (184, 128, 48, 255)
            else:
                px[x, y] = (168, 56, 40, 255)
                if (x - 3) % 6 in (2, 3) and (y - 3) % 6 == 3:
                    px[x, y] = (200, 92, 56, 255)
    return img


def place(canvas, item, cx, cy):
    """Pose `item` centré sur (cx, cy)."""
    canvas.alpha_composite(item, (round(cx - item.width / 2), round(cy - item.height / 2)))


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    foods = {k: food_icon(*rc) for k, rc in FOOD.items()}
    plate, carafe = dish(PLATE), dish(CARAFE)
    W, H = 64, 32
    img = mat(W, H)
    # Une assiette devant chaque coin (les convives des côtés), les plats au milieu, la carafe entre deux.
    for cx, cy in ((9, 9), (W - 8, 9), (9, H - 9), (W - 8, H - 9)):
        place(img, plate, cx, cy)
    place(img, foods['riz'], 24, 11)
    place(img, foods['boulettes'], 40, 11)
    place(img, foods['pakoras'], 24, 23)
    place(img, foods['dal'], 40, 22)
    place(img, carafe, 50, 16)
    img.save(OUT / 'repas.png')
    # L'assiette tendue à Pierre : la galette.
    served = foods['galette']
    served.save(OUT / 'plat.png')
    print('repas.png, plat.png ->', OUT.relative_to(ROOT))


if __name__ == '__main__':
    main()
