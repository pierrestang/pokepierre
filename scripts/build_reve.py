#!/usr/bin/env python3
"""Le rêve de la fin du jeu (octobre 2026) : une carte du créateur, src/data/builtMaps/reve.json.

Composée case par case avec deux planches du Pokémon Gaia Project (PixelMister, d'après zetavares852 ; voir
ASSETTILESPOKEMONV2/credits/gaia-pixelmister.txt) :
- « gaia-distorsion » (le Monde Distorsion) : le vide bleu, la grande plate-forme de brique (découpée en neuf morceaux
  pour l'agrandir), les îlots flottants, les arbres qui poussent de travers, le tourbillon ;
- « gaia-colonne » (les ruines de la Colonne Lance) : quatre colonnes brisées aux coins de la plate-forme, deux
  tablettes gravées sur des îlots.
Les deux planches sont aussi copiées dans public/assets/v2/ et ajoutées au catalogue des planches (créateur), comme
scripts/build_v2_tiles.py (où elles sont inscrites) le refait à chaque passage.

Pierre est au centre de la plate-forme (14, 10) ; les personnages autour (src/data/maps/reve.js).
La carte est un premier jet : elle peut être retouchée dans le créateur (--force efface ces retouches).

Usage : python3 scripts/build_reve.py [--force]
"""
import json
import sys
from pathlib import Path

from PIL import Image

sys.path.insert(0, str(Path(__file__).parent))
from build_v2_tiles import empty_tiles  # noqa: E402

ROOT = Path(__file__).resolve().parent.parent
V2 = ROOT / 'public' / 'assets' / 'v2'
SRC = ROOT / 'ASSETTILESPOKEMONV2' / 'tilesets' / 'exterieurs'
STRIDE = 100000
W, H = 28, 22
MAP_ID = 'reve'

# Planches : (id, nom, fichier) ; cases de 16 px, 8 par rangée.
SHEETS = [
    ('gaia-distorsion', 'Gaia Project : Monde Distorsion (PixelMister)', 'monde-distorsion_gaia-pixelmister.png'),
    ('gaia-colonne', 'Gaia Project : ruines de la Colonne Lance (PixelMister)', 'colonne-lance-ruines_gaia-pixelmister.png'),
]
D, C = 0, 1          # index des planches dans `sheets` de la carte
COLS = 8


def ensure_sheets():
    """Copie les planches dans public/assets/v2 et les inscrit au catalogue des planches (remplace l'entrée existante)."""
    path = V2 / 'catalog.json'
    catalog = json.loads(path.read_text())
    for sid, name, filename in SHEETS:
        img = Image.open(SRC / filename).convert('RGBA')
        img.save(V2 / f'{sid}.png', optimize=True)
        entry = {'id': sid, 'name': name, 'file': f'{sid}.png', 'cols': img.width // 16, 'rows': img.height // 16,
                 'empty': empty_tiles(img), 'author': 'Gaia Project (PixelMister)', 'gen': 4}
        catalog['sheets'] = [s for s in catalog['sheets'] if s['id'] != sid] + [entry]
    path.write_text(json.dumps(catalog, ensure_ascii=False))


def ref(sheet, c, r):
    return sheet * STRIDE + r * COLS + c


def main():
    out = ROOT / 'src' / 'data' / 'builtMaps' / f'{MAP_ID}.json'
    if out.exists() and '--force' not in sys.argv:
        sys.exit(f'{MAP_ID}.json existe déjà : rien n\'est écrit ; --force pour le refaire')
    ensure_sheets()
    n = W * H
    sol = [[ref(D, 4, 125)] for _ in range(n)]    # le vide : le bleu uni du Monde Distorsion ; la plate-forme par-dessus
    decor = [[] for _ in range(n)]
    dessus = [[] for _ in range(n)]
    solid = [1] * n

    def put(layer, x, y, r):
        if 0 <= x < W and 0 <= y < H:
            layer[y * W + x].append(r)

    def stamp(sheet, c0, r0, w, h, x0, y0, over=0, block_rows=None):
        """Recopie un bloc de la planche ; ses `over` premières rangées passent au-dessus de Pierre ; `block_rows` :
        rangées du bloc qui bloquent (None : aucune)."""
        for j in range(h):
            for i in range(w):
                x, y = x0 + i, y0 + j
                put(dessus if j < over else decor, x, y, ref(sheet, c0 + i, r0 + j))
                if block_rows and j in block_rows and 0 <= x < W and 0 <= y < H:
                    solid[y * W + x] = 1

    # La grande plate-forme centrale, 14 x 10 (x 7-20, y 5-14), découpée dans la plate-forme de la planche
    # (colonnes 1-6, rangées 99-103) : coins, bords, milieu ; dessous, la falaise sombre (rangée 104).
    px0, py0, pw, ph = 7, 5, 14, 10
    for j in range(ph):
        for i in range(pw):
            c = 1 if i == 0 else 6 if i == pw - 1 else 2 + (i - 1) % 4
            r = 99 if j == 0 else 103 if j == ph - 1 else 100 + (j - 1) % 3
            put(sol, px0 + i, py0 + j, ref(D, c, r))       # le sol où l'on marche
            solid[(py0 + j) * W + px0 + i] = 0
    for i in range(pw):
        c = 1 if i == 0 else 6 if i == pw - 1 else 2 + (i - 1) % 4
        put(decor, px0 + i, py0 + ph, ref(D, c, 104))

    # Quatre colonnes brisées aux coins (2 x 4 : les trois rangées du haut au-dessus de Pierre, le socle bloque).
    for (c0, x0, y0) in [(0, 7, 5), (6, 19, 5), (2, 7, 11), (4, 19, 11)]:
        top = 8 if c0 in (0, 2) else 9
        h = 12 - top
        stamp(C, c0, top, 2, h, x0, y0 + 4 - h, over=h - 1, block_rows={h - 1})

    # Îlots flottants autour : petites plates-formes, arbres de travers, le tourbillon, deux tablettes gravées.
    stamp(D, 1, 52, 3, 4, 1, 2)            # îlot de brique (haut gauche)
    stamp(D, 0, 63, 6, 2, 1, 17)           # arbre couché (bas gauche)
    stamp(D, 0, 115, 3, 5, 23, 1)          # arbre debout (haut droite)
    stamp(D, 0, 126, 3, 5, 2, 9)           # arbre à l'envers (gauche)
    stamp(D, 3, 118, 5, 6, 22, 15)         # le tourbillon (bas droite)
    stamp(D, 1, 106, 3, 3, 24, 9)          # éclats de plate-forme (droite)
    stamp(C, 0, 16, 3, 3, 10, 18)          # tablette gravée, sous la plate-forme
    stamp(C, 3, 16, 3, 3, 16, 0)           # tablette gravée, au-dessus

    def cell(st):
        return st if len(st) > 1 else (st[0] if st else -1)

    m = {
        'version': 1, 'id': MAP_ID, 'name': 'Rêve', 'width': W, 'height': H,
        'sheets': [s[0] for s in SHEETS],
        'layers': {'sol': [cell(s) for s in sol], 'decor': [cell(s) for s in decor], 'dessus': [cell(s) for s in dessus]},
        'solid': solid, 'spawn': {'x': 14, 'y': 10, 'facing': 'down'},
    }
    out.write_text(json.dumps(m, ensure_ascii=False) + '\n')
    print(f'{MAP_ID} : {W} x {H} -> {out.relative_to(ROOT)}')


if __name__ == '__main__':
    main()
