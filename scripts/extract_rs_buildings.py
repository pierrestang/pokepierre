"""Bâtiments et objets pris sur les planches de Rubis/Saphir fournies par l'utilisateur (usage personnel
uniquement), vers public/assets/tiles/ (voir FRLG_SHEETS, FRLG_BUILDINGS et FRLG_DECOR dans src/art/frlgArt.js).

  rs-farm.png : la gare du téléphérique du Mont Chimnée (assets-source/gba/rs-mt-chimney.png), qui sert de
    ferme à M. Bouly (Montépilloy). Le sol de cendre autour devient transparent : on remplit depuis les bords
    tout ce qui a la teinte rosée de la cendre, le contour sombre du bâtiment arrête le remplissage. Image recadrée
    sur le bâtiment (88 x 80 px), élargie à 96 px (6 cases) par du vide à droite.

  rs-crates.png : caisses en bois du marché de Slateport (assets-source/rs/backgrounds-slateport_city.png),
    15 x 16 px chacune, côte à côte : caisse vide, caisse de poissons (trois poissons argentés dessinés dedans),
    caisse « À DONNER » (la vide, avec une étiquette blanche griffonnée de rouge).

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


SLATEPORT = ROOT / 'assets-source' / 'rs' / 'backgrounds-slateport_city.png'
CRATES_OUT = ROOT / 'public' / 'assets' / 'tiles' / 'rs-crates.png'
EMPTY_CRATE = (103, 584)
CRATE_W, CRATE_H = 15, 16


def crate(im, x, y):
    c = im.crop((x, y, x + CRATE_W, y + CRATE_H)).convert('RGBA')
    px = c.load()
    dark = lambda p: sum(p[:3]) < 250
    # Coins hors du contour (fond du marché) -> transparents : on remplit depuis les bords jusqu'au contour.
    stack = [(i, j) for i in range(CRATE_W) for j in (0, CRATE_H - 1)] + [(i, j) for i in (0, CRATE_W - 1) for j in range(CRATE_H)]
    seen = set()
    while stack:
        p = stack.pop()
        if p in seen or not (0 <= p[0] < CRATE_W and 0 <= p[1] < CRATE_H) or dark(px[p]):
            continue
        seen.add(p)
        px[p] = (0, 0, 0, 0)
        stack += [(p[0] + 1, p[1]), (p[0] - 1, p[1]), (p[0], p[1] + 1), (p[0], p[1] - 1)]
    return c


def build_crates():
    im = Image.open(SLATEPORT).convert('RGB')
    empty = crate(im, *EMPTY_CRATE)
    # Caisse de poissons : la caisse vide, trois poissons argentés couchés dedans (intérieur : x 3-11, y 3-8).
    fish = empty.copy()
    px = fish.load()
    silver, belly, tail, eye = (184, 196, 216, 255), (240, 244, 248, 255), (120, 136, 168, 255), (32, 32, 48, 255)
    for fx, fy in ((5, 3), (3, 5), (6, 7)):
        for i in range(1, 6):
            px[fx + i, fy] = silver
            px[fx + i, fy + 1] = belly
        px[fx, fy] = tail
        px[fx, fy + 1] = tail
        px[fx + 4, fy] = eye
    give = empty.copy()
    gx = give.load()
    for i in range(4, 11):
        for j in range(9, 14):
            gx[i, j] = (64, 48, 32, 255) if i in (4, 10) or j in (9, 13) else (248, 248, 240, 255)
    for i in range(6, 9):
        gx[i, 11] = (216, 56, 40, 255)
    out = Image.new('RGBA', (CRATE_W * 3, CRATE_H), (0, 0, 0, 0))
    for k, c in enumerate((empty, fish, give)):
        out.paste(c, (k * CRATE_W, 0))
    out.save(CRATES_OUT)
    print('ok ->', CRATES_OUT.relative_to(ROOT))


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
    build_crates()


if __name__ == '__main__':
    main()
