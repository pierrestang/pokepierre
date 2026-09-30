"""Portraits des dresseurs d'Émeraude (assets-source/emerald-trainers.png, fournie par l'utilisateur, usage
personnel uniquement) vers public/assets/characters/emerald-trainers.png, fond rendu transparent.

Planche source : portraits de 64 x 64 px sur fond vert, dans une grille au pas de 65 px (lignes vert foncé),
premier portrait en (1, 1). Le jeu les désigne par « colonne,rangée » (voir src/art/spriteSheets.js).

Usage : python3 scripts/extract_emerald_trainers.py
"""
from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / 'assets-source' / 'emerald-trainers.png'
OUT = ROOT / 'public' / 'assets' / 'characters' / 'emerald-trainers.png'
BACKGROUND = {(112, 192, 160, 255), (78, 99, 61, 255)}   # fond et lignes de la grille


def main():
    im = Image.open(SRC).convert('RGBA')
    im.putdata([(0, 0, 0, 0) if p in BACKGROUND else p for p in im.getdata()])
    im.save(OUT)
    print('ok ->', OUT.relative_to(ROOT))


if __name__ == '__main__':
    main()
