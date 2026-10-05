#!/usr/bin/env python3
"""Personnages de Pokémon Noir et Blanc (planche de Barubary, The Spriters Resource) : découpés, prêts à servir.

La planche range chaque personnage dans un bloc de couleur unie, sur une grille d'images de 32 x 32 (les directions de
haut en bas, les pas de gauche à droite ; les cases manquantes sont blanches). Pour chaque bloc (cases voisines de même
couleur de fond), le fond et le blanc sont rendus transparents et le bloc est enregistré tel quel dans
ASSETTILESPOKEMONV2/bw_personnages/NNN.png ; personnages.png montre tous les blocs numérotés. Rien n'est branché au jeu.
Un bloc peut contenir deux personnages côte à côte (ex. un garçon et une fille sur le même fond).

Usage : python3 scripts/extract_bw_characters.py
"""
import json
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / 'assets-source' / 'ds' / 'bw-overworld.png'
OUT = ROOT / 'ASSETTILESPOKEMONV2' / 'bw_personnages'
CELL = 32
WHITE = (255, 255, 255)


def main():
    OUT.mkdir(exist_ok=True)
    a = np.array(Image.open(SRC).convert('RGBA'))
    rows, cols = a.shape[0] // CELL, a.shape[1] // CELL
    # Couleur de fond de chaque case : son coin haut-gauche (les sprites n'y touchent pas).
    bg = {(c, r): tuple(int(v) for v in a[r * CELL, c * CELL, :3]) for r in range(rows) for c in range(cols)}

    def has_sprite(c, r):
        cell = a[r * CELL:(r + 1) * CELL, c * CELL:(c + 1) * CELL, :3].astype(int)
        back = np.array(bg[(c, r)])
        other = ~((cell == back).all(axis=2) | (cell == WHITE).all(axis=2))
        return other.sum() > 20

    # Blocs : cases voisines de même fond (hors blanc), qui contiennent au moins un sprite.
    seen, blocks = set(), []
    for r in range(rows):
        for c in range(cols):
            if (c, r) in seen or bg[(c, r)] == WHITE:
                continue
            color, todo, cells = bg[(c, r)], [(c, r)], []
            seen.add((c, r))
            while todo:
                cc, rr = todo.pop()
                cells.append((cc, rr))
                for n in ((cc + 1, rr), (cc - 1, rr), (cc, rr + 1), (cc, rr - 1)):
                    if n in bg and n not in seen and bg[n] == color:
                        seen.add(n)
                        todo.append(n)
            if any(has_sprite(*cell) for cell in cells):
                blocks.append((color, cells))

    index = []
    for i, (color, cells) in enumerate(sorted(blocks, key=lambda b: (min(y for _, y in b[1]), min(x for x, _ in b[1])))):
        c0, c1 = min(x for x, _ in cells), max(x for x, _ in cells)
        r0, r1 = min(y for _, y in cells), max(y for _, y in cells)
        crop = a[r0 * CELL:(r1 + 1) * CELL, c0 * CELL:(c1 + 1) * CELL].copy()
        rgb = crop[:, :, :3].astype(int)
        crop[(rgb == color).all(axis=2) | (rgb == WHITE).all(axis=2)] = 0
        # Les cases hors du bloc (voisins d'une autre couleur) sont effacées aussi.
        for r in range(r0, r1 + 1):
            for c in range(c0, c1 + 1):
                if (c, r) not in cells:
                    crop[(r - r0) * CELL:(r - r0 + 1) * CELL, (c - c0) * CELL:(c - c0 + 1) * CELL] = 0
        Image.fromarray(crop).save(OUT / f'{i:03}.png')
        index.append({'id': i, 'cols': c1 - c0 + 1, 'rows': r1 - r0 + 1, 'source': [c0 * CELL, r0 * CELL]})

    (OUT / 'index.json').write_text(json.dumps(index))
    # Planche-contact : tous les blocs, numérotés.
    per_row, thumb = 10, 112
    sheet = Image.new('RGBA', (per_row * thumb, -(-len(index) // per_row) * (thumb + 14)), (70, 90, 70, 255))
    d = ImageDraw.Draw(sheet)
    for e in index:
        img = Image.open(OUT / f"{e['id']:03}.png")
        img.thumbnail((thumb - 6, thumb - 6))
        x, y = (e['id'] % per_row) * thumb, (e['id'] // per_row) * (thumb + 14)
        sheet.alpha_composite(img, (x + 3, y + 14))
        d.text((x + 3, y + 1), f"{e['id']} ({e['cols']}x{e['rows']})", fill=(255, 255, 0, 255))
    sheet.save(OUT / 'personnages.png')
    print(f'{len(index)} blocs -> {OUT}')


if __name__ == '__main__':
    main()
