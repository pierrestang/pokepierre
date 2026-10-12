"""Logo du jeu : Poké Ball sur fond bleu à coins arrondis, à partir de assets-source/logo.png (2048 x 2048).
Icône de l'onglet (favicon), de l'écran d'accueil (iPhone, Android) et du manifeste, vers public/.

Usage : python3 scripts/build_icons.py
"""
from pathlib import Path
from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / 'public'
SRC = ROOT / 'assets-source' / 'logo.png'

BLUE = (8, 52, 118)   # fond bleu du logo
RADIUS = 375          # rayon des coins arrondis de la source (en px, sur 2048)


def mask(size, inset):
    """Masque du carré à coins arrondis, légèrement rentré pour éliminer le liseré blanc des coins de la source."""
    m = Image.new('L', (size, size), 0)
    ImageDraw.Draw(m).rounded_rectangle((inset, inset, size - 1 - inset, size - 1 - inset), RADIUS - inset, fill=255)
    return m


def sources():
    src = Image.open(SRC).convert('RGB')
    n = src.width
    # Plein cadre (iPhone, Android) : coins repeints en bleu, le système arrondit lui-même.
    full = Image.new('RGB', (n, n), BLUE)
    full.paste(src, (0, 0), mask(n, 12))
    # Onglet : coins transparents.
    tab = src.convert('RGBA')
    tab.putalpha(mask(n, 6))
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
