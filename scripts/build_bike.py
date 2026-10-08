#!/usr/bin/env python3
"""Pierre à vélo : le sprite officiel de Lucas à vélo (Diamant/Perle/Platine) pour le jeu.

Source : ASSETTILESPOKEMONV2/personnages/gen4-officiels/NPC_198_Lucas_bike.png (format RPG Maker XP, comme les autres
personnages : 4 x 4 images de 64 x 64 px au double de la taille ; rangées bas, gauche, droite, haut ; quatre images
de pédalage par direction).

Écrit public/assets/characters/pierre-velo.png : une rangée de 16 images de 32 x 32 px (bas, haut, gauche, droite x
quatre temps de pédalage ; la première est l'image à l'arrêt), le bas de la roue sur la dernière ligne comme les pieds
des personnages à pied (voir src/art/spriteSheets.js, 'velo-{direction}-{0..3}').

Usage : python3 scripts/build_bike.py
"""
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / 'ASSETTILESPOKEMONV2' / 'personnages' / 'gen4-officiels' / 'NPC_198_Lucas_bike.png'
OUT = ROOT / 'public' / 'assets' / 'characters' / 'pierre-velo.png'
RMXP_ROWS = {'down': 0, 'left': 1, 'right': 2, 'up': 3}
DIRS = ['down', 'up', 'left', 'right']          # ordre du jeu
SIZE = 32


def main():
    img = Image.open(SRC).convert('RGBA')
    small = img.resize((img.width // 2, img.height // 2), Image.NEAREST)
    # Le bas des roues, sur toutes les images : posé sur la dernière ligne de l'image du jeu.
    bottom = max(small.crop((s * SIZE, r * SIZE, (s + 1) * SIZE, (r + 1) * SIZE)).getbbox()[3]
                 for r in range(4) for s in range(4))
    shift = SIZE - bottom
    out = Image.new('RGBA', (16 * SIZE, SIZE))
    for d, name in enumerate(DIRS):
        r = RMXP_ROWS[name]
        for s in range(4):
            cell = small.crop((s * SIZE, r * SIZE, (s + 1) * SIZE, (r + 1) * SIZE))
            out.alpha_composite(cell, ((d * 4 + s) * SIZE, shift))
    out.save(OUT, optimize=True)
    print(f'16 images de {SIZE} x {SIZE} px -> {OUT.relative_to(ROOT)}')


if __name__ == '__main__':
    main()
