"""Personnages des planches DS et Émeraude fournies par l'utilisateur (usage personnel uniquement), vers
public/assets/characters/, au même format que frlg-npcs.png : une ligne de 12 images par personnage
(bas, haut, gauche, droite x debout, pas, pas), fond transparent, pieds sur la dernière ligne.

  dp-npcs.png (lettre d, images de 32 x 32) : PNJ de Diamant/Perle (assets-source/ds/dp-npcs.png), puis
    champions d'arène et Conseil 4 (assets-source/ds/dp-gym-leaders.png). Blocs de 96 x 128 px d'une couleur
    de fond chacun : 3 x 4 images de 32 x 32, dans l'ordre de la DS (voir DP_ORDER).
  bw-npcs.png (lettre n, 32 x 32) : personnages de Noir/Blanc (assets-source/ds/bw-overworld.png). Seuls les
    personnages sur deux colonnes sont repris : haut (debout, pas), bas (debout, pas), gauche (debout, pas),
    puis le second pas à gauche ; la droite est la gauche en miroir, l'autre pas haut/bas aussi.
  emerald-npcs.png (lettre h, 16 x 32) : champions d'arène et Conseil 4 d'Émeraude
    (assets-source/gba/emerald-gym-leaders.png) : bas / haut / gauche sur une colonne (la droite en miroir), une
    colonne par personnage, ou trois pour ceux qui marchent (voir EMERALD_COLUMNS).

Usage : python3 scripts/extract_more_npcs.py
"""
from pathlib import Path
from PIL import Image, ImageOps

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / 'assets-source'
OUT = ROOT / 'public' / 'assets' / 'characters'
DIRS = ('down', 'up', 'left', 'right')

# Images d'un bloc Diamant/Perle (lues ligne par ligne, 3 par ligne) pour chaque direction : debout, pas, pas.
DP_ORDER = {'down': (5, 8, 11), 'up': (0, 2, 10), 'left': (6, 3, 9), 'right': (1, 4, 7)}


def transparent(img, bg):
    img = img.convert('RGBA')
    img.putdata([(0, 0, 0, 0) if p[:3] == bg else p for p in img.getdata()])
    return img


def clear_edge_lines(img):
    """Efface une colonne de bord entièrement pleine (trait de séparation d'un bloc décalé d'un pixel)."""
    px = img.load()
    for x in (0, img.width - 1):
        if all(px[x, y][3] for y in range(img.height)):
            for y in range(img.height):
                px[x, y] = (0, 0, 0, 0)


def write(rows, w, h, name):
    """rows : une liste de 12 images (DIRS x debout, pas, pas) par personnage. Pieds calés en bas."""
    out = Image.new('RGBA', (w * 12, h * len(rows)), (0, 0, 0, 0))
    for k, frames in enumerate(rows):
        bottom = max(f.getbbox()[3] for f in frames if f.getbbox())
        for i, f in enumerate(frames):
            out.paste(f, (i * w, k * h + h - bottom), f)
    out.save(OUT / name)
    print(f'{len(rows)} personnages -> {(OUT / name).relative_to(ROOT)}')


def dp_blocks(path, bands):
    """Blocs de 96 x 128 d'une planche Diamant/Perle, ligne de blocs par ligne de blocs. Le fond d'un bloc se lit
    sur sa ligne du bas (les têtes dépassent parfois en haut) ; un bloc doit avoir ses quatre coins de ce fond."""
    im = Image.open(path).convert('RGB')
    px = im.load()
    rows = []
    for band in range(bands):
        y0 = band * 128
        x = 0
        while x < im.width:
            c = px[x, y0 + 127]
            x1 = x
            while x1 < im.width and px[x1, y0 + 127] == c:
                x1 += 1
            n = round((x1 - x) / 96)
            if n >= 1 and abs(x1 - x - 96 * n) <= 2 and c != (255, 255, 255):
                for k in range(n):
                    bx = x + 96 * k
                    if not all(px[cx, cy] == c for cx in (bx, min(bx + 95, im.width - 1)) for cy in (y0, y0 + 127)):
                        continue
                    cells = [transparent(im.crop((bx + (i % 3) * 32, y0 + (i // 3) * 32, bx + (i % 3) * 32 + 32, y0 + (i // 3) * 32 + 32)), c) for i in range(12)]
                    for img in cells:
                        clear_edge_lines(img)
                    rows.append([cells[i] for d in DIRS for i in DP_ORDER[d]])
            x = x1
    return rows


def bw_characters():
    im = Image.open(SRC / 'ds' / 'bw-overworld.png').convert('RGB')
    px = im.load()
    empty = {(255, 0, 255), (255, 255, 255)}
    W, H = im.width // 32, im.height // 32

    def bg(cx, cy):
        return px[cx * 32, cy * 32] if cx < W and cy < H else None

    def cell(cx, cy, c):
        return transparent(im.crop((cx * 32, cy * 32, cx * 32 + 32, cy * 32 + 32)), c)

    def filled(img):
        return img.getbbox() is not None and sum(1 for p in img.getdata() if p[3]) > 20

    rows = []
    for cy in range(H - 3):
        for cx in range(W - 1):
            c = bg(cx, cy)
            if c in empty:
                continue
            # Personnage sur deux colonnes : 2 x 3 cases de son fond, une 4e ligne à gauche seulement, et
            # rien de ce fond juste au-dessus (sinon on est au milieu d'un autre bloc).
            same = all(bg(cx + i, cy + j) == c for i in (0, 1) for j in (0, 1, 2, 3) if (i, j) != (1, 3))
            if not same or bg(cx + 1, cy + 3) not in empty or (cy > 0 and bg(cx, cy - 1) == c):
                continue
            up0, up1 = cell(cx, cy, c), cell(cx + 1, cy, c)
            dn0, dn1 = cell(cx, cy + 1, c), cell(cx + 1, cy + 1, c)
            lf0, lf1, lf2 = cell(cx, cy + 2, c), cell(cx + 1, cy + 2, c), cell(cx, cy + 3, c)
            if not all(filled(f) for f in (up0, up1, dn0, dn1, lf0, lf1, lf2)):
                continue
            m = ImageOps.mirror
            rows.append([dn0, dn1, m(dn1), up0, up1, m(up1), lf0, lf1, lf2, m(lf0), m(lf1), m(lf2)])
    return rows


# Colonnes de la planche d'Émeraude par personnage : une seule (debout), ou trois (pas, debout, pas).
EMERALD_COLUMNS = [[0], [1], [2], [3], [4, 5, 6], [7], [8], [9], [10, 11, 12], [13], [14], [15], [16],
                   [17, 18, 19], [20, 21, 22]]


def emerald_characters():
    im = Image.open(SRC / 'gba' / 'emerald-gym-leaders.png').convert('RGB')
    bg = (115, 197, 164)

    def column(i):
        x = 1 + 17 * i
        down, up, left = (transparent(im.crop((x, 1 + 33 * r, x + 16, 33 + 33 * r)), bg) for r in range(3))
        return down, up, left, ImageOps.mirror(left)

    rows = []
    for cols in EMERALD_COLUMNS:
        steps = [column(i) for i in (cols if len(cols) == 1 else (cols[1], cols[0], cols[2]))]
        if len(steps) == 1:
            steps *= 3
        rows.append([steps[s][d] for d in range(4) for s in range(3)])
    return rows


def main():
    write(dp_blocks(SRC / 'ds' / 'dp-npcs.png', 9) + dp_blocks(SRC / 'ds' / 'dp-gym-leaders.png', 2), 32, 32, 'dp-npcs.png')
    write(bw_characters(), 32, 32, 'bw-npcs.png')
    write(emerald_characters(), 16, 32, 'emerald-npcs.png')


if __name__ == '__main__':
    main()
