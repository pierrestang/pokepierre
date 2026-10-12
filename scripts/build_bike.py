#!/usr/bin/env python3
"""Pierre à vélo : les sprites officiels des héros à vélo (Diamant/Perle/Platine, HeartGold/SoulSilver), un par
apparence possible de Pierre (celle choisie dans le panneau PNJ, src/data/characterLooks.json).

Sources : ASSETTILESPOKEMONV2/personnages/gen4-officiels/NPC_<n>_<nom>_bike.png (format RPG Maker XP, comme les autres
personnages : 4 x 4 images de 64 x 64 px au double de la taille ; rangées bas, gauche, droite, haut ; quatre images
de pédalage par direction).

Écrit public/assets/characters/pierre-velo.png : une rangée par héros (ordre de BIKES, repris dans
src/art/spriteSheets.js BIKE_ROWS), 16 images de 32 x 32 px par rangée (bas, haut, gauche, droite x quatre temps de
pédalage ; la première est l'image à l'arrêt), le bas de la roue sur la dernière ligne comme les pieds des personnages
à pied (images 'velo-{sprite}-{direction}-{0..3}').

Usage : python3 scripts/build_bike.py
"""
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / 'ASSETTILESPOKEMONV2' / 'personnages' / 'gen4-officiels'
OUT = ROOT / 'public' / 'assets' / 'characters' / 'pierre-velo.png'
# Apparence de Pierre (sprite du jeu, gen4-npcs.json) -> son héros à vélo. Même ordre que BIKE_ROWS (spriteSheets.js).
BIKES = [
    ('g198', 'NPC_198_Lucas_bike.png'),
    ('g199', 'NPC_199_Lucas_bike.png'),
    ('g200', 'NPC_201_Dawn_bike.png'),
    ('g201', 'NPC_202_Dawn_bike.png'),
    ('g202', 'NPC_203_Ethan_bike.png'),
    ('g203', 'NPC_206_Lyra_bike.png'),
]
RMXP_ROWS = {'down': 0, 'left': 1, 'right': 2, 'up': 3}
DIRS = ['down', 'up', 'left', 'right']          # ordre du jeu
SIZE = 32


def bike_row(path):
    img = Image.open(path).convert('RGBA')
    small = img.resize((img.width // 2, img.height // 2), Image.NEAREST)
    # Le bas des roues, sur toutes les images : posé sur la dernière ligne de l'image du jeu.
    bottom = max(small.crop((s * SIZE, r * SIZE, (s + 1) * SIZE, (r + 1) * SIZE)).getbbox()[3]
                 for r in range(4) for s in range(4))
    shift = SIZE - bottom
    row = Image.new('RGBA', (16 * SIZE, SIZE))
    for d, name in enumerate(DIRS):
        r = RMXP_ROWS[name]
        for s in range(4):
            cell = small.crop((s * SIZE, r * SIZE, (s + 1) * SIZE, (r + 1) * SIZE))
            row.alpha_composite(cell, ((d * 4 + s) * SIZE, shift))
    return row


def main():
    out = Image.new('RGBA', (16 * SIZE, len(BIKES) * SIZE))
    for k, (_, name) in enumerate(BIKES):
        out.alpha_composite(bike_row(SRC / name), (0, k * SIZE))
    out.save(OUT, optimize=True)
    print(f'{len(BIKES)} héros à vélo, 16 images de {SIZE} x {SIZE} px chacun -> {OUT.relative_to(ROOT)}')


if __name__ == '__main__':
    main()
