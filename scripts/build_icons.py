"""Logo du jeu : une Poké Ball en pixel art sur fond bleu, dessinée pixel par pixel sur une grille de 16 x 16,
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
    'B': (56, 104, 216, 255),     # fond bleu
    'b': (32, 64, 152, 255),      # bord du fond
    'l': (96, 144, 240, 255),     # reflet du fond
    'k': (24, 24, 32, 255),       # contour et bande noire
    'R': (224, 48, 48, 255),      # rouge
    'r': (160, 24, 40, 255),      # ombre du rouge
    'h': (255, 152, 144, 255),    # reflet du rouge
    'W': (248, 248, 248, 255),    # blanc
    'g': (184, 192, 208, 255),    # ombre du blanc
}
# La Poké Ball (12 x 12), posée au centre du fond bleu (16 x 16, bord sombre, reflet en haut).
BALL = [
    '....kkkk....',
    '..kkRRRRkk..',
    '.kRhhRRRRRk.',
    '.kRhRRRRRrk.',
    'kRRRkkkkRRrk',
    'kkkkkWWkkkkk',
    'kkkkkWWkkkkk',
    'kWWWkkkkWWgk',
    '.kWWWWWWWgk.',
    '.kWWWWWWggk.',
    '..kkggggkk..',
    '....kkkk....',
]


def grid():
    rows = [['b'] * 16] + [['b'] + ['B'] * 14 + ['b'] for _ in range(14)] + [['b'] * 16]
    rows[0][0] = rows[0][15] = rows[15][0] = rows[15][15] = '.'
    rows[1][1:15] = ['l'] * 14
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
    bg = Image.new('RGB', full.size, C['b'][:3])
    bg.paste(full, (0, 0), full)
    bg.save(OUT / 'apple-touch-icon.png')
    print('ok -> public/favicon.png, favicon.ico, icon-192.png, icon-512.png, apple-touch-icon.png')


if __name__ == '__main__':
    main()
