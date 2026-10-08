#!/usr/bin/env python3
"""Personnages de la quatrième génération (Diamant/Perle/Platine, HeartGold/SoulSilver) pour le jeu.

Source : ASSETTILESPOKEMONV2/personnages/gen4-officiels/ (sprites officiels mis au format RPG Maker XP par Neo-Spriteman
et Vanilla Sunshine : planches de 4 x 4 images de 64 x 64 px, le personnage dessiné au double de sa taille ; rangées
bas, gauche, droite, haut ; colonnes debout, pas, debout, autre pas). Seuls les personnages à pied (pas les variantes
vélo, surf, pêche…, ni les Pokémon et objets).

Écrit public/assets/characters/gen4-npcs.png (un personnage par ligne, 12 images : bas, haut, gauche, droite x debout,
pas, autre pas ; le format des planches Rouge Feu de src/art/spriteSheets.js), à la taille d'origine, recadré sur
l'emprise commune de tous les personnages (pieds alignés), et gen4-npcs.json (la liste : identifiant g{n}, fichier,
nom).

Usage : python3 scripts/build_gen4_npcs.py
"""
import json
import re
from pathlib import Path

import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / 'ASSETTILESPOKEMONV2' / 'personnages' / 'gen4-officiels'
OUT = ROOT / 'public' / 'assets' / 'characters'
VARIANT = re.compile(r'_(bike|bike_hop|bike_stop|fishing|heal|HM|poketch|run|save|surf|watering|VSseeker|Contest|ladder|'
                     r'shake|Rocket|Pokeathlon)\.png$')
RMXP_ROWS = {'down': 0, 'left': 1, 'right': 2, 'up': 3}
DIRS = ['down', 'up', 'left', 'right']          # ordre des planches du jeu
STEPS = [0, 1, 3]                               # debout, pas, autre pas


def frames(path):
    """Les 16 images du personnage, ramenées à leur taille d'origine (32 x 32)."""
    img = Image.open(path).convert('RGBA')
    cell = img.width // 4
    small = img.resize((img.width // 2, img.height // 2), Image.NEAREST)
    c = cell // 2
    return {(d, s): small.crop((s * c, r * c, (s + 1) * c, (r + 1) * c)) for d, r in RMXP_ROWS.items() for s in range(4)}, c


def main():
    files = sorted(p for p in SRC.glob('NPC_*.png') if not VARIANT.search(p.name))
    chars = []
    box = [10_000, 10_000, -1, -1]
    for p in files:
        fr, c = frames(p)
        for im in fr.values():
            a = np.array(im)[..., 3] > 0
            if a.any():
                ys, xs = np.nonzero(a)
                box = [min(box[0], xs.min()), min(box[1], ys.min()), max(box[2], xs.max()), max(box[3], ys.max())]
        chars.append((p, fr))
    x0, y0, x1, y1 = box
    w, h = x1 - x0 + 1, y1 - y0 + 1
    sheet = Image.new('RGBA', (12 * w, len(chars) * h))
    meta = []
    for i, (p, fr) in enumerate(chars):
        for d, dirname in enumerate(DIRS):
            for k, s in enumerate(STEPS):
                sheet.paste(fr[(dirname, s)].crop((x0, y0, x1 + 1, y1 + 1)), ((d * 3 + k) * w, i * h))
        name = re.sub(r'^NPC_\d+_?', '', p.stem).replace('_', ' ') or p.stem
        meta.append({'id': f'g{i}', 'file': p.name, 'name': name})
    sheet.save(OUT / 'gen4-npcs.png', optimize=True)
    (OUT / 'gen4-npcs.json').write_text(json.dumps({'w': int(w), 'h': int(h), 'characters': meta}, ensure_ascii=False, indent=1))
    print(f'{len(chars)} personnages, images de {w} x {h} px -> public/assets/characters/gen4-npcs.png')


if __name__ == '__main__':
    main()
