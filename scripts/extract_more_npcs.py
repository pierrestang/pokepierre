"""Champions d'arène et Conseil 4 d'Émeraude (assets-source/gba/emerald-gym-leaders.png, fournie par l'utilisateur,
usage personnel uniquement) vers public/assets/characters/emerald-npcs.png (lettre h), au même format que
frlg-npcs.png : une ligne de 12 images de 16 x 32 par personnage (bas, haut, gauche, droite x debout, pas, pas),
fond transparent, pieds sur la dernière ligne. Sur la planche : bas / haut / gauche sur une colonne (la droite en
miroir), une colonne par personnage, ou trois pour ceux qui marchent (voir EMERALD_COLUMNS).

Usage : python3 scripts/extract_more_npcs.py
"""
from pathlib import Path
from PIL import Image, ImageOps
from pixels import clear_color, pack_characters

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / 'assets-source'
OUT = ROOT / 'public' / 'assets' / 'characters' / 'emerald-npcs.png'


# Colonnes de la planche d'Émeraude par personnage : une seule (debout), ou trois (pas, debout, pas).
EMERALD_COLUMNS = [[0], [1], [2], [3], [4, 5, 6], [7], [8], [9], [10, 11, 12], [13], [14], [15], [16],
                   [17, 18, 19], [20, 21, 22]]


def emerald_characters():
    im = Image.open(SRC / 'gba' / 'emerald-gym-leaders.png').convert('RGB')
    bg = (115, 197, 164)

    def column(i):
        x = 1 + 17 * i
        down, up, left = (clear_color(im.crop((x, 1 + 33 * r, x + 16, 33 + 33 * r)).convert('RGBA'), bg) for r in range(3))
        return down, up, left, ImageOps.mirror(left)

    rows = []
    for cols in EMERALD_COLUMNS:
        steps = [column(i) for i in (cols if len(cols) == 1 else (cols[1], cols[0], cols[2]))]
        if len(steps) == 1:
            steps *= 3
        rows.append([steps[s][d] for d in range(4) for s in range(3)])
    return rows


def main():
    rows = emerald_characters()
    pack_characters(rows, 16, 32).save(OUT)
    print(f'{len(rows)} personnages -> {OUT.relative_to(ROOT)}')


if __name__ == '__main__':
    main()
