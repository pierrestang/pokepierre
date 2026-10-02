"""Bâtiments pris sur les planches de Rubis/Saphir fournies par l'utilisateur (usage personnel uniquement), vers
public/assets/tiles/ (voir FRLG_SHEETS et FRLG_BUILDINGS dans src/art/frlgArt.js).

  rs-farm.png : la gare du téléphérique du Mont Chimnée (assets-source/gba/rs-mt-chimney.png), qui sert de
    ferme à M. Bouly (Montépilloy). Le sol de cendre autour devient transparent : on remplit depuis les bords
    tout ce qui a la teinte rosée de la cendre, le contour sombre du bâtiment arrête le remplissage. Image recadrée
    sur le bâtiment (88 x 80 px), élargie à 96 px (6 cases) par du vide à droite.

Usage : python3 scripts/extract_rs_buildings.py
"""
from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / 'assets-source' / 'gba' / 'rs-mt-chimney.png'
OUT = ROOT / 'public' / 'assets' / 'tiles' / 'rs-farm.png'
BOX = (233, 508, 325, 594)          # 92 x 86 px, avec la marge de cendre autour


def ash(p):
    r, g, b = p[:3]
    return r > b + 25 and r > 150 and g < r - 20 and not (r > 200 and g > 120 and b < 90)


def main():
    img = Image.open(SRC).convert('RGBA').crop(BOX)
    px = img.load()
    W, H = img.size
    stack = [(x, y) for x in range(W) for y in (0, H - 1)] + [(x, y) for x in (0, W - 1) for y in range(H)]
    seen = set()
    while stack:
        p = stack.pop()
        if p in seen or not (0 <= p[0] < W and 0 <= p[1] < H):
            continue
        seen.add(p)
        if not ash(px[p]):
            continue
        px[p] = (0, 0, 0, 0)
        stack += [(p[0] + 1, p[1]), (p[0] - 1, p[1]), (p[0], p[1] + 1), (p[0], p[1] - 1)]
    # Restes du décor qui touchent le bord : ombre de la barrière au-dessus, câble du téléphérique à droite.
    for x in range(W):
        for y in range(H):
            if y < 2 or x >= 90:
                px[x, y] = (0, 0, 0, 0)
    img = img.crop(img.getbbox())
    out = Image.new('RGBA', (96, img.height), (0, 0, 0, 0))
    out.paste(img, (0, 0))
    out.save(OUT)
    print('ok ->', OUT.relative_to(ROOT))


if __name__ == '__main__':
    main()
