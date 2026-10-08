#!/usr/bin/env python3
"""Refait les cartes extérieures du jeu avec les planches V2, en cartes du créateur de cartes.

Lit les cartes du jeu (via scripts/export_maps.mjs) et écrit une carte du créateur par ville dans
src/data/builtMaps/<id>.json, à retoucher ensuite dans builder.html :
- sol (calque « Sol ») : herbe, chemins, pavés, dalles, sable, eau, hautes herbes, fleurs, blé ; les bords des
  chemins, de la plage et de l'eau sont assemblés quart de case par quart de case à partir des blocs des planches
  (3 x 3 cases : coins et bords ; 2 x 2 : angles rentrants). Ces cases assemblées sont rangées dans une planche
  générée, public/assets/v2/auto.png (« Bordures automatiques » dans la palette) ;
- objets (calque « Décor ») : arbres (par blocs de 2 x 2), buissons, clôtures, panneaux, réverbères, rochers… ;
  le haut des arbres et des réverbères va sur le calque « Au-dessus de Pierre » ;
- bâtiments : chaque bâtiment (les cases toit / mur / porte reliées) est remplacé par une maison DS / Gen 4, porte
  en face de la porte du jeu ;
Deux thèmes : DS (Fort-de-France, scripts/ds_theme.py) et Gen 4 (les autres, scripts/g4_theme.py).
- collisions : celles du jeu (cases bloquantes de la grille) ; départ : celui de la carte.

Usage : python3 scripts/convert_maps_v2.py [<id du jeu>…] [--force | --force=<id>]   (sans id : de Fort-de-France à
Hull ; les cartes déjà là sont gardées, sauf --force ; ex. python3 scripts/convert_maps_v2.py hanoi amsterdam)
"""
import ast
import json
import subprocess
import sys
from pathlib import Path

from PIL import Image

from ds_theme import convert_ds
from g4_theme import convert_g4

ROOT = Path(__file__).resolve().parent.parent
V2 = ROOT / 'public' / 'assets' / 'v2'
OUT = ROOT / 'src' / 'data' / 'builtMaps'
TILE, HALF, STRIDE, EMPTY = 16, 8, 100000, -1
DEFAULT_MAPS = ['fortDeFrance', 'saintAy', 'routeMontepilloy', 'montepilloy', 'routeBonsecours', 'prytanee',
                'bordeaux', 'hull']


def slugify(name):
    """Même identifiant que le créateur de cartes (src/builder/mapModel.js slugify)."""
    import re
    import unicodedata
    s = unicodedata.normalize('NFD', name)
    s = ''.join(c for c in s if unicodedata.category(c) != 'Mn').lower()
    return re.sub(r'[^a-z0-9]+', '-', s).strip('-') or 'carte'


def load_catalog():
    return json.loads((V2 / 'catalog.json').read_text())


class Builder:
    """Construit les cartes et la planche des bordures assemblées (partagée par toutes les cartes)."""

    def __init__(self, catalog):
        self.catalog = catalog
        self.cols = {s['id']: s['cols'] for s in catalog['sheets']}
        self.images = {s['id']: Image.open(V2 / s['file']).convert('RGBA') for s in catalog['sheets'] if s['id'] != 'auto'}
        self.auto_tiles = []          # images 16 x 16 assemblées
        self.auto_index = {}          # clé d'assemblage -> numéro dans la planche auto
        # Les cases déjà assemblées gardent leur numéro (des cartes retouchées dans le créateur s'en servent) : on
        # repart de la planche et de ses clés (auto.json), les nouvelles cases s'ajoutent à la suite.
        keys_file = V2 / 'auto.json'
        if keys_file.exists() and (V2 / 'auto.png').exists():
            sheet = Image.open(V2 / 'auto.png').convert('RGBA')
            for i, key in enumerate(json.loads(keys_file.read_text())):
                col, row = i % (sheet.width // TILE), i // (sheet.width // TILE)
                self.auto_tiles.append(sheet.crop((col * TILE, row * TILE, (col + 1) * TILE, (row + 1) * TILE)))
                self.auto_index[ast.literal_eval(key)] = i
        self.sheet_info = {s['id']: {**s, 'emptySet': set(s['empty'])} for s in catalog['sheets']}
        objects = V2 / 'objets.json'
        self.objects = json.loads(objects.read_text()) if objects.exists() else {}

    def index(self, sheet, col, row):
        return row * self.cols[sheet] + col

    def tile_image(self, sheet, col, row):
        return self.images[sheet].crop((col * TILE, row * TILE, (col + 1) * TILE, (row + 1) * TILE))

    def quad_tile(self, sheet, quads):
        """Case assemblée de quatre quarts de cases d'une planche (bordures d'un terrain)."""
        key = ('quads', sheet, quads)
        if key not in self.auto_index:
            img = Image.new('RGBA', (TILE, TILE))
            for q, (col, row) in enumerate(quads):
                qx, qy = q % 2, q // 2
                src = self.tile_image(sheet, col, row)
                img.paste(src.crop((qx * HALF, qy * HALF, (qx + 1) * HALF, (qy + 1) * HALF)), (qx * HALF, qy * HALF))
            self.auto_index[key] = len(self.auto_tiles)
            self.auto_tiles.append(img)
        return self.auto_index[key]

    def composite(self, tiles, recolor):
        """Cases empilées (de bas en haut) fondues en une ; (planche, col, rangée, 'mint') : recolorée par `recolor`."""
        key = ('stack', tiles)
        if key not in self.auto_index:
            img = Image.new('RGBA', (TILE, TILE))
            for tile in tiles:
                sheet, col, row = tile[:3]
                part = self.auto_tiles[col].copy() if sheet == 'auto' else self.tile_image(sheet, col, row)
                if len(tile) > 3:
                    px = part.load()
                    for y in range(TILE):
                        for x in range(TILE):
                            r, g, b, a = px[x, y]
                            if a and (r, g, b) in recolor:
                                px[x, y] = (*recolor[(r, g, b)], a)
                img.alpha_composite(part)
            self.auto_index[key] = len(self.auto_tiles)
            self.auto_tiles.append(img)
        return self.auto_index[key]

    def image_tile(self, img):
        """Case assemblée à partir d'une image 16 x 16 (cases empilées, recoupées) : rangée une seule fois."""
        import hashlib
        key = ('img', hashlib.sha1(img.tobytes()).hexdigest())
        if key not in self.auto_index:
            self.auto_index[key] = len(self.auto_tiles)
            self.auto_tiles.append(img.copy())
        return self.auto_index[key]

    def save_auto_sheet(self):
        cols = 8
        rows = max(1, (len(self.auto_tiles) + cols - 1) // cols)
        sheet = Image.new('RGBA', (cols * TILE, rows * TILE))
        for i, img in enumerate(self.auto_tiles):
            sheet.paste(img, ((i % cols) * TILE, (i // cols) * TILE))
        sheet.save(V2 / 'auto.png', optimize=True)
        keys = [None] * len(self.auto_tiles)
        for key, i in self.auto_index.items():
            keys[i] = repr(key)
        (V2 / 'auto.json').write_text(json.dumps(keys))
        sheets = [s for s in self.catalog['sheets'] if s['id'] != 'auto']
        empty = list(range(len(self.auto_tiles), cols * rows))
        sheets.append({'id': 'auto', 'name': 'Cases assemblées (bordures, superpositions)', 'file': 'auto.png',
                       'cols': cols, 'rows': rows, 'empty': empty, 'author': 'assemblées', 'gen': 0})
        self.catalog['sheets'] = sheets
        (V2 / 'catalog.json').write_text(json.dumps(self.catalog, ensure_ascii=False))


# Cartes refaites dans le thème DS (Diamant / Perle, voir scripts/ds_theme.py).
DS_MAPS = {'fortDeFrance'}
# Cartes refaites dans le thème Gen 4 (planches Gen 4 seulement, voir scripts/g4_theme.py).
G4_MAPS = {'saintAy', 'routeMontepilloy', 'montepilloy', 'routeBonsecours', 'prytanee', 'bordeaux', 'hull'}


def main():
    # Toutes les cartes sont refaites ensemble : elles partagent la planche des cases assemblées (auto.png).
    ids = [a for a in sys.argv[1:] if not a.startswith('--')] or DEFAULT_MAPS
    exported = json.loads(subprocess.check_output(['node', str(ROOT / 'scripts' / 'export_maps.mjs'), *ids], cwd=ROOT))
    builder = Builder(load_catalog())
    OUT.mkdir(parents=True, exist_ok=True)
    force = [a.split('=', 1)[1] if '=' in a else '*' for a in sys.argv[1:] if a.startswith('--force')]
    # (L'ancien thème Gen 3 — planches halcyon, gen3, ferme… — a été retiré avec ces planches : toute carte refaite ici
    # prend le thème DS ou le thème Gen 4.)
    results = [convert_ds(builder, m, slugify) if m['id'] in DS_MAPS else convert_g4(builder, m, slugify)
               for m in exported]
    builder.save_auto_sheet()
    # Une carte déjà là n'est pas écrasée (elle a pu être retouchée dans le créateur) ; --force les refait toutes,
    # --force=<id> une seule (ex. --force=fortDeFrance).
    for game_map, built in zip(exported, results):
        out = OUT / f"{built['id']}.json"
        if out.exists() and '*' not in force and game_map['id'] not in force:
            print(f"{game_map['id']:18} déjà là, gardée (--force={game_map['id']} pour la refaire)")
            continue
        out.write_text(json.dumps(built, ensure_ascii=False) + '\n')
        print(f"{game_map['id']:18} -> src/data/builtMaps/{built['id']}.json ({built['width']}x{built['height']})")
    print(f'{len(builder.auto_tiles)} bordures assemblées (public/assets/v2/auto.png)')


if __name__ == '__main__':
    main()
