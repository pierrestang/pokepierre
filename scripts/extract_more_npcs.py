"""Champions d'arène et Conseil 4 d'Émeraude (assets-source/gba/emerald-gym-leaders.png, fournie par l'utilisateur,
usage personnel uniquement) vers public/assets/characters/emerald-npcs.png (lettre h), au même format que
frlg-npcs.png : une ligne de 12 images de 16 x 32 par personnage (bas, haut, gauche, droite x debout, pas, pas),
fond transparent, pieds sur la dernière ligne. Sur la planche : bas / haut / gauche sur une colonne (la droite en
miroir), une colonne par personnage, ou trois pour ceux qui marchent (voir EMERALD_COLUMNS).

Les planches DS (assets-source/ds/) ne sont plus utilisées pour les personnages.

Usage : python3 scripts/extract_more_npcs.py
"""
from pathlib import Path
from PIL import Image, ImageOps

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / 'assets-source'
OUT = ROOT / 'public' / 'assets' / 'characters'
DIRS = ('down', 'up', 'left', 'right')



def transparent(img, bg):
    img = img.convert('RGBA')
    img.putdata([(0, 0, 0, 0) if p[:3] == bg else p for p in img.getdata()])
    return img


def write(rows, w, h, name):
    """rows : une liste de 12 images (DIRS x debout, pas, pas) par personnage. Pieds calés en bas."""
    out = Image.new('RGBA', (w * 12, h * len(rows)), (0, 0, 0, 0))
    for k, frames in enumerate(rows):
        bottom = max(f.getbbox()[3] for f in frames if f.getbbox())
        for i, f in enumerate(frames):
            out.paste(f, (i * w, k * h + h - bottom), f)
    out.save(OUT / name)
    print(f'{len(rows)} personnages -> {(OUT / name).relative_to(ROOT)}')


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
    write(emerald_characters(), 16, 32, 'emerald-npcs.png')


if __name__ == '__main__':
    main()
