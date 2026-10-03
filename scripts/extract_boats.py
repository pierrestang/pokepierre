"""Bateaux d'Émeraude (assets-source/emerald/miscellaneous-exterior_tileset.png, planche fournie par l'utilisateur,
usage personnel) vers public/assets/tiles/emerald-boats.png : le voilier (port de Hull, de Toulon) et le long
bateau en bois (péniches des canaux d'Amsterdam), l'eau autour rendue transparente. Voir src/systems/tileRenderer.js
(addBoats).

Usage : python3 scripts/extract_boats.py
"""
from pathlib import Path
from PIL import Image
from pixels import clear_outside

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / 'assets-source' / 'emerald' / 'miscellaneous-exterior_tileset.png'
OUT = ROOT / 'public' / 'assets' / 'tiles' / 'emerald-boats.png'

# (x, y, largeur, hauteur) sur la planche, avec un peu d'eau autour ; dans la planche de sortie, le voilier en
# (0, 0), le long bateau en (56, 0).
BOATS = {
    'sailboat': (255, 913, 50, 41),
    'barge': (258, 967, 88, 34),
}
# Coin d'une case voisine (panneau) à effacer avant le détourage : (x, y, largeur, hauteur) dans le découpage.
ERASE = {'barge': (0, 0, 10, 9)}


def water(p):
    """Eau autour des bateaux : bleu vif, bleu-gris des canaux et leurs vaguelettes (le bleu domine)."""
    r, g, b = p[:3]
    return b >= 150 and b > r + 30 and b > g + 20


def keep_largest(im):
    """Garde la plus grande forme opaque d'un seul tenant (le bateau) : efface les bouts des cases voisines."""
    px = im.load()
    w, h = im.size
    seen, best = set(), []
    for sy in range(h):
        for sx in range(w):
            if (sx, sy) in seen or px[sx, sy][3] == 0:
                continue
            part, stack = [], [(sx, sy)]
            seen.add((sx, sy))
            while stack:
                x, y = stack.pop()
                part.append((x, y))
                for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1), (1, 1), (-1, -1), (1, -1), (-1, 1)):
                    n = (x + dx, y + dy)
                    if 0 <= n[0] < w and 0 <= n[1] < h and n not in seen and px[n][3]:
                        seen.add(n)
                        stack.append(n)
            if len(part) > len(best):
                best = part
    keep = set(best)
    for y in range(h):
        for x in range(w):
            if (x, y) not in keep:
                px[x, y] = (0, 0, 0, 0)
    return im


def main():
    im = Image.open(SRC).convert('RGBA')
    out = Image.new('RGBA', (152, 48), (0, 0, 0, 0))
    x0 = 0
    for name, (x, y, w, h) in BOATS.items():
        crop = im.crop((x, y, x + w, y + h))
        if name in ERASE:
            ex, ey, ew, eh = ERASE[name]
            crop.paste((0, 0, 0, 0), (ex, ey, ex + ew, ey + eh))
        boat = keep_largest(clear_outside(crop, water))
        boat = boat.crop(boat.getbbox())
        out.paste(boat, (x0, 0), boat)
        print(name, (x0, 0) + boat.size)
        x0 += 56
    out.save(OUT)
    print('ok ->', OUT.relative_to(ROOT))


if __name__ == '__main__':
    main()
