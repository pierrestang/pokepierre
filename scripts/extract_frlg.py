"""Extrait les personnages de la planche Rouge Feu / Vert Feuille (assets-source/frlg-npcs.png,
fournie par l'utilisateur) vers public/assets/characters/frlg-npcs.png.

Planche source : cases de 16 x 24 px sur fond orange (vert pour les sprites inutilisés), séparées
d'un pixel blanc, 17 px entre deux colonnes. Une ligne = un personnage :
  - 12 cases (+ parfois une 13e pose ignorée) : bas, haut, gauche, droite x (pas, debout, pas) ;
  - 4 cases : bas, haut, gauche, droite, debout seulement (répété pour les pas).
Sortie : une ligne de 12 images de 16 x 24 par personnage (bas, haut, gauche, droite x debout, pas, pas),
fond transparent, pieds alignés en bas.

Usage : python3 scripts/extract_frlg.py
"""
from pathlib import Path
from PIL import Image
from pixels import clear_color, pack_characters

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / 'assets-source' / 'frlg-npcs.png'
OUT = ROOT / 'public' / 'assets' / 'characters' / 'frlg-npcs.png'

BG = {(255, 127, 39, 255), (34, 177, 76, 255)}
WHITE = (255, 255, 255, 255)
XS = [9 + 17 * i for i in range(13)]
CHARACTERS_END = 2185   # après : Pokémon et objets divers
FW, FH = 16, 24
STEP_ORDER = (1, 0, 2)   # debout d'abord, puis les deux pas


def main():
    im = Image.open(SRC).convert('RGBA')
    px = im.load()
    rows = []
    for y in range(1, CHARACTERS_END):
        x = XS[0]
        if px[x, y] in BG and px[x, y - 1] == WHITE and px[x, y + FH] == WHITE and px[x + FW - 1, y + FH - 1] != WHITE:
            rows.append((y, sum(1 for cx in XS if px[cx, y] in BG)))

    def cell(x, y):
        return clear_color(im.crop((x, y, x + FW, y + FH)), BG)

    characters = [
        [cell(XS[d * 3 + c], y) for d in range(4) for c in STEP_ORDER] if n >= 12 else [cell(XS[f // 3], y) for f in range(12)]
        for y, n in rows
    ]
    out = pack_characters(characters, FW, FH)       # pieds calés sur la dernière ligne
    OUT.parent.mkdir(parents=True, exist_ok=True)
    out.save(OUT)
    print(f'{len(rows)} personnages -> {OUT.relative_to(ROOT)}')


if __name__ == '__main__':
    main()
