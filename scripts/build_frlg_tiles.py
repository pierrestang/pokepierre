"""Prépare les planches de décor Rouge Feu / Vert Feuille (assets-source/frlg/, fournies par
l'utilisateur, usage personnel uniquement) pour le jeu, dans public/assets/tiles/ :

  frlg-outdoor.png   tuiles d'extérieur (16 x 16, une ligne transparente entre deux : pas de 17 px,
                     première tuile en 1, 1) — copie telle quelle ;
  frlg-rims.png      liserés d'herbe seuls (bordures du chemin de sable sans le sable), voir grass_rims ;
  frlg-ferry.png     ferry des îles Sevii détouré (voir ferry) ;
  frlg-pier.png      ponton (bord gauche, milieu, bord droit) sans l'eau sur ses côtés (voir pier) ;
  frlg-stairs.png    escalier du petit plateau en pierre blanche (voir white_stairs) ;
  frlg-props.png     planche de Hoeloe (arbre isolé, rocher, mer animée…), fond violet rendu transparent ;
  frlg-seven.png     carte de Seven Island (24 x 20 cases), sans le cadre ;
  frlg-buildings.png bâtiments entiers, fond blanc extérieur rendu transparent.
Toutes les couleurs sont ramenées à la même conversion GBA (voir gba_palette).

Usage : python3 scripts/build_frlg_tiles.py
"""
from collections import deque
from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / 'assets-source' / 'frlg'
OUT = ROOT / 'public' / 'assets' / 'tiles'


def clear_color(im, color):
    """Rend transparents tous les pixels d'une couleur (fond uni)."""
    im.putdata([(0, 0, 0, 0) if p == color else p for p in im.getdata()])
    return im


def gba_palette(im):
    """Ramène les couleurs à la même conversion GBA que la planche d'extérieur (composante x 8).
    Certaines planches ont été extraites avec composante x 255 / 31 (ex. 115, 205, 164 au lieu de
    112, 200, 160) : sans correction, on verrait des carrés de teinte différente entre les tuiles."""
    def fix(p):
        if p[3] == 0 or all(v % 8 == 0 for v in p[:3]):
            return p
        return tuple(round(v * 31 / 255) * 8 for v in p[:3]) + (p[3],)
    im.putdata([fix(p) for p in im.getdata()])
    return im


def clear_outside(im, color):
    """Rend transparents les pixels de `color` reliés au bord de l'image (fond autour des bâtiments),
    sans toucher au blanc à l'intérieur des bâtiments (vitres, enseignes)."""
    px = im.load()
    w, h = im.size
    queue = deque([(x, y) for x in range(w) for y in (0, h - 1)] + [(x, y) for y in range(h) for x in (0, w - 1)])
    seen = set()
    while queue:
        x, y = queue.popleft()
        if (x, y) in seen or not (0 <= x < w and 0 <= y < h) or px[x, y] != color:
            continue
        seen.add((x, y))
        px[x, y] = (0, 0, 0, 0)
        queue.extend(((x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1)))
    return im


def grass_rims(outdoor):
    """Liserés d'herbe seuls : les 12 tuiles de bordure du chemin de sable (colonnes 1-4, rangées 0-2 de
    la planche d'extérieur) sans leurs pixels de sable, à poser sur une plage bordée d'écume quand elle
    touche aussi l'herbe. Même disposition que la planche d'extérieur (pas de 17 px)."""
    tile = lambda c, r: outdoor.crop((1 + 17 * c, 1 + 17 * r, 17 + 17 * c, 17 + 17 * r))
    sand = set(tile(0, 0).getdata())
    out = Image.new('RGBA', (1 + 17 * 5, 1 + 17 * 3), (0, 0, 0, 0))
    for r in range(3):
        for c in range(1, 5):
            t = tile(c, r)
            t.putdata([(0, 0, 0, 0) if p in sand else p for p in t.getdata()])
            out.paste(t, (1 + 17 * c, 1 + 17 * r))
    return out


def white_stairs(outdoor):
    """Escalier du petit plateau (cases 20 et 21 de la rangée 17 de la planche d'extérieur) en pierre
    blanche : marches blanches, ombres des marches gris clair."""
    white = {
        (120, 120, 128, 255): (192, 192, 208, 255),
        (144, 160, 176, 255): (216, 216, 224, 255),
        (168, 184, 200, 255): (232, 232, 240, 255),
        (200, 216, 232, 255): (248, 248, 248, 255),
        (240, 240, 248, 255): (248, 248, 248, 255),
    }
    out = Image.new('RGBA', (32, 16), (0, 0, 0, 0))
    for i, c in enumerate((20, 21)):
        t = outdoor.crop((1 + 17 * c, 1 + 17 * 17, 17 + 17 * c, 17 + 17 * 17))
        t.putdata([white.get(p, p) for p in t.getdata()])
        out.paste(t, (i * 16, 0))
    return out


def pier(seven):
    """Ponton en bois de Seven Island (bord gauche, milieu, bord droit : cases 7, 8, 9 de la rangée 16)
    aux bords couleur bois, sans l'eau sur ses côtés (teintes de la mer rendues transparentes) : posé sur la plage, il laisse
    voir le sable dessous."""
    sea = set(seven.crop((0, 14 * 16, 32, 16 * 16)).getdata())
    # Bords bleu-gris (le ponton d'origine est posé dans l'eau) recolorés en bois foncé.
    wood = {(64, 72, 104, 255): (112, 80, 48, 255), (120, 120, 128, 255): (144, 112, 64, 255)}
    out = Image.new('RGBA', (48, 16), (0, 0, 0, 0))
    for i, c in enumerate((7, 8, 9)):
        t = seven.crop((c * 16, 16 * 16, c * 16 + 16, 17 * 16))
        t.putdata([(0, 0, 0, 0) if p in sea else wood.get(p, p) for p in t.getdata()])
        out.paste(t, (i * 16, 0))
    return out


def ferry(sheet):
    """Ferry des îles Sevii (écran d'exemple « Heading to », proue à droite), détouré : l'eau autour
    (ses teintes bleues, relevées hors du ferry) est enlevée par remplissage depuis les bords, puis
    l'écume du sillage (tout ce qui est à gauche du contour sombre de la coque) et les reflets isolés."""
    water = {p for x in range(552, 800) for y in range(48, 160)
             if not (640 <= x <= 722 and 78 <= y <= 128)
             for p in [sheet.getpixel((x, y))] if p[2] - p[0] > 60}
    im = sheet.crop((640, 78, 722, 128))
    px = im.load()
    w, h = im.size
    queue = deque([(x, y) for x in range(w) for y in (0, h - 1)] + [(x, y) for y in range(h) for x in (0, w - 1)])
    seen = set()
    while queue:
        x, y = queue.popleft()
        if (x, y) in seen or not (0 <= x < w and 0 <= y < h) or px[x, y] not in water:
            continue
        seen.add((x, y))
        px[x, y] = (0, 0, 0, 0)
        queue.extend(((x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1)))
    dark = lambda p: p[3] and sum(p[:3]) < 400
    for y in range(h):
        first = next((x for x in range(w) if dark(px[x, y])), w)
        for x in range(first):
            px[x, y] = (0, 0, 0, 0)
    # Garde le plus grand morceau (le ferry) : reflets et gouttes isolés enlevés.
    seen, parts = set(), []
    for y in range(h):
        for x in range(w):
            if px[x, y][3] and (x, y) not in seen:
                part, queue = [], deque([(x, y)])
                seen.add((x, y))
                while queue:
                    a, b = queue.popleft()
                    part.append((a, b))
                    for n in ((a + 1, b), (a - 1, b), (a, b + 1), (a, b - 1)):
                        if 0 <= n[0] < w and 0 <= n[1] < h and px[n][3] and n not in seen:
                            seen.add(n)
                            queue.append(n)
                parts.append(part)
    for part in sorted(parts, key=len)[:-1]:
        for p in part:
            px[p] = (0, 0, 0, 0)
    im = im.crop(im.getbbox())
    # Pointe d'écume restée collée à gauche de la coque.
    px = im.load()
    for y in range(im.height):
        for x in range(4):
            if px[x, y][3] and sum(px[x, y][:3]) > 600:
                px[x, y] = (0, 0, 0, 0)
    return im.crop(im.getbbox())


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    rgba = lambda name: Image.open(SRC / name).convert('RGBA')

    outdoor = rgba('tilesets-tileset_2.png')
    outdoor.save(OUT / 'frlg-outdoor.png')
    grass_rims(outdoor).save(OUT / 'frlg-rims.png')
    white_stairs(outdoor).save(OUT / 'frlg-stairs.png')
    gba_palette(clear_color(rgba('tilesets-tileset.png'), (153, 51, 204, 255))).save(OUT / 'frlg-props.png')
    seven = gba_palette(rgba('maps__towns_buildings_etc._-seven_island.png').crop((8, 24, 392, 344)))
    seven.save(OUT / 'frlg-seven.png')
    pier(seven).save(OUT / 'frlg-pier.png')
    gba_palette(clear_outside(rgba('tilesets-buildings.png'), (255, 255, 255, 255))).save(OUT / 'frlg-buildings.png')
    gba_palette(ferry(rgba('maps-seagallop_ferry.png'))).save(OUT / 'frlg-ferry.png')
    print('ok ->', OUT.relative_to(ROOT))


if __name__ == '__main__':
    main()
