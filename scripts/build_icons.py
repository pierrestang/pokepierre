"""Logo du jeu : une Poké Ball en pixel art, en aplats (« flat », sans ombre ni reflet), sur fond bleu uni, dessinée pixel par pixel sur une grille de 16 x 16,
puis agrandie sans lissage. Icône de l'onglet (favicon), de l'écran d'accueil (iPhone, Android) et du
manifeste, vers public/.

Usage : python3 scripts/build_icons.py
"""
from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / 'public'

C = {
    '.': (0, 0, 0, 0),
    'B': (56, 112, 224, 255),     # fond bleu
    'k': (24, 24, 32, 255),       # contour et bande noire
    'R': (232, 56, 56, 255),      # rouge
    'W': (248, 248, 248, 255),    # blanc
}
# La Poké Ball (12 x 12), posée au centre du fond bleu uni (16 x 16).
BALL = [
    '....kkkk....',
    '..kkRRRRkk..',
    '.kRRRRRRRRk.',
    '.kRRRRRRRRk.',
    'kRRRkkkkRRRk',
    'kkkkkWWkkkkk',
    'kkkkkWWkkkkk',
    'kWWWkkkkWWWk',
    '.kWWWWWWWWk.',
    '.kWWWWWWWWk.',
    '..kkWWWWkk..',
    '....kkkk....',
]


def grid():
    rows = [['B'] * 16 for _ in range(16)]
    rows[0][0] = rows[0][15] = rows[15][0] = rows[15][15] = '.'          # coins arrondis
    for y, line in enumerate(BALL):
        for x, c in enumerate(line):
            if c != '.':
                rows[y + 2][x + 2] = c
    return [''.join(r) for r in rows]


LOGO = grid()


def logo(size):
    im = Image.new('RGBA', (16, 16))
    im.putdata([C[c] for row in LOGO for c in row])
    return im.resize((size, size), Image.NEAREST)


def main():
    logo(32).save(OUT / 'favicon.png')
    logo(48).save(OUT / 'favicon.ico', sizes=[(16, 16), (32, 32), (48, 48)])
    logo(192).save(OUT / 'icon-192.png')
    logo(512).save(OUT / 'icon-512.png')
    # iPhone : pas de transparence (les coins seraient noirs), iOS arrondit lui-même.
    full = logo(180)
    bg = Image.new('RGB', full.size, C['B'][:3])
    bg.paste(full, (0, 0), full)
    bg.save(OUT / 'apple-touch-icon.png')
    print('ok -> public/favicon.png, favicon.ico, icon-192.png, icon-512.png, apple-touch-icon.png')


if __name__ == '__main__':
    main()
