"""Bâtiments de la Zone de Combat d'Émeraude (assets-source/emerald/locations-battle_frontier_buildings.png, planche
fournie par l'utilisateur, usage personnel) vers public/assets/tiles/emerald-frontier.png : le fond gris uni devient
transparent, la bande verte du crédit en bas est retirée. Sert aux villes d'Asie (dojo, portail, palais doré) et
aux jardinières fleuries (voir FRLG_BUILDINGS dans src/art/frlgArt.js).

Usage : python3 scripts/extract_frontier.py
"""
from pathlib import Path
from PIL import Image
from pixels import clear_outside

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / 'assets-source' / 'emerald' / 'locations-battle_frontier_buildings.png'
OUT = ROOT / 'public' / 'assets' / 'tiles' / 'emerald-frontier.png'


def main():
    im = Image.open(SRC).convert('RGBA')
    im = im.crop((0, 0, im.width, 552))                     # sans la bande du crédit
    bg = im.getpixel((2, 2))[:3]
    clear_outside(im, bg)
    im.save(OUT)
    print('ok ->', OUT.relative_to(ROOT))


if __name__ == '__main__':
    main()
