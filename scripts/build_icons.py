"""Logo du jeu : Poké Ball verte sur carré vert à coins arrondis, à partir de assets-source/icone-pokeball-verte.png
(2048 x 2048, le carré posé sur un fond vert sombre). Icône de l'onglet (favicon), de l'écran d'accueil (iPhone,
Android) et du manifeste, vers public/.

Usage : python3 scripts/build_icons.py
"""
from pathlib import Path
from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / 'public'
SRC = ROOT / 'assets-source' / 'icone-pokeball-verte.png'

BOX = (78, 75, 1968, 1965)  # le carré à coins arrondis dans la source (le reste : fond vert sombre)
RADIUS = 198                # rayon de ses coins (en px de la source)


def mask(size, inset):
    """Masque du carré à coins arrondis, légèrement rentré pour éliminer le liseré sombre des coins."""
    m = Image.new('L', (size, size), 0)
    ImageDraw.Draw(m).rounded_rectangle((inset, inset, size - 1 - inset, size - 1 - inset), RADIUS - inset, fill=255)
    return m


def sources():
    square = Image.open(SRC).convert('RGB').crop(BOX)
    n = square.width
    # Plein cadre (iPhone, Android) : le système arrondit lui-même, plus que la source (coins sombres cachés).
    full = square
    # Onglet : coins transparents.
    tab = square.convert('RGBA')
    tab.putalpha(mask(n, 4))
    return full, tab


def main():
    full, tab = sources()
    small = lambda im, s: im.resize((s, s), Image.LANCZOS)
    small(tab, 32).save(OUT / 'favicon.png')
    small(tab, 48).save(OUT / 'favicon.ico', sizes=[(16, 16), (32, 32), (48, 48)])
    small(full, 192).save(OUT / 'icon-192.png')
    small(full, 512).save(OUT / 'icon-512.png')
    # iPhone : pas de transparence (les coins seraient noirs), iOS arrondit lui-même.
    small(full, 180).save(OUT / 'apple-touch-icon.png')
    print('ok -> public/favicon.png, favicon.ico, icon-192.png, icon-512.png, apple-touch-icon.png')


if __name__ == '__main__':
    main()
