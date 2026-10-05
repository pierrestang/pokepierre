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
- bâtiments : chaque bâtiment (les cases toit / mur / porte reliées) est remplacé par la maison V2 dont la taille
  colle le mieux, posée sur le bas de son emprise, porte en face de la porte du jeu ;
- collisions : celles du jeu (cases bloquantes de la grille) ; départ : celui de la carte.

Usage : python3 scripts/convert_maps_v2.py [--force | --force=<id>]   (de Fort-de-France à Hull ; les cartes déjà
là sont gardées, sauf --force)
"""
import ast
import json
import subprocess
import sys
from collections import Counter
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

# ---------- Sols ----------
# Bloc d'un terrain dans une planche, sur de l'herbe : `outer` = coin haut-gauche du bloc 3 x 3 (coins et bords),
# `center` = la case pleine, `inner` = les angles rentrants (l'herbe dans un seul coin) : haut-gauche, haut-droit,
# bas-gauche, bas-droit. `beach` : le même bloc, bordé de sable au lieu d'herbe (l'eau le long de la plage) ; les
# angles qui manquent reprennent ceux de l'herbe.
def inner_block(col, row):
    return [(col, row), (col + 1, row), (col, row + 1), (col + 1, row + 1)]


TERRAINS = {
    'path': {'outer': (0, 13), 'center': (1, 14), 'inner': inner_block(3, 14)},       # chemin de sable
    'beach': {'outer': (5, 21), 'center': (6, 22), 'inner': inner_block(3, 24)},      # plage
    'cobble': {'outer': (5, 18), 'center': (6, 19), 'inner': inner_block(3, 20)},     # pavés ronds
    'brick': {'outer': (0, 16), 'center': (1, 19), 'inner': inner_block(3, 18)},      # dalles de pierre
    'water': {'outer': (0, 204), 'center': (1, 205), 'inner': inner_block(3, 204),    # eau (mer, étang, rivière)
              'beach': {'outer': (5, 204), 'inner': [(3, 206), (4, 206), (3, 205), (4, 205)]}},
}
TERRAIN_SHEET = 'halcyon'
GROUND_OF_CODE = {
    'ç': 'path', 's': 'beach', 'ɔ': 'cobble', 'ɐ': 'brick',
    'w': 'water', '~': 'water', 'G': 'water', 'ø': 'water', 'B': 'water',
}
# Cases pleines (pas de bord) : planche, colonne, rangée.
GRASS = [('halcyon', 0, 0)]
FLAT = {
    'ĥ': ('halcyon', 1, 3),      # hautes herbes
    'f': ('halcyon', 1, 72),     # fleurs
    'ƒ': ('halcyon', 3, 72),     # petites fleurs
    'ʬ': ('halcyon', 1, 100),    # champ de blé
    'ɲ': ('halcyon', 0, 0),      # herbe du sommet du mémorial
}

# Verts « menthe » des planches Gen 3 / Jungle / Forêt -> verts de Halcyon (la même herbe partout).
MINT = 'mint'
MINT_TO_HALCYON = {
    (112, 200, 160): (150, 203, 124), (160, 224, 192): (168, 211, 146),
    (64, 176, 136): (132, 195, 102), (24, 160, 104): (95, 159, 100),
}

# ---------- Objets (calque Décor ; `top` : la case du dessus, sur le calque « Au-dessus de Pierre ») ----------
OBJECTS = {
    'ƀ': {'decor': ('gen3', 0, 9, MINT)},                             # buisson
    'ƨ': {'decor': ('gen3', 7, 25, MINT)},                            # plante à baies (fleurs rouges)
    'ŕ': {'decor': ('gen3', 4, 9, MINT)},                             # rocher
    'ø': {'decor': ('gen3', 5, 9, MINT)},                             # rocher dans la mer
    'S': {'decor': ('ferme', 1, 24)},                                 # panneau
    '>': {'decor': ('ferme', 1, 24)},
    'M': {'decor': ('ville', 7, 20)},                                 # boîte aux lettres
    'l': {'decor': ('ville', 6, 30), 'top': ('ville', 6, 29)},        # réverbère
    'I': {'decor': ('halcyon', 6, 195)},                              # pont
}
# Petit palmier (1 case de large, 3 de haut : palmes au-dessus de Pierre, stipe, pied) : petits arbres des îles
# ('ƚ') et arbres tropicaux ('ƫ', deux palmiers par bloc de 2 x 2).
PALM = [('jungle', 7, 15, MINT), ('jungle', 7, 16, MINT), ('jungle', 7, 17, MINT)]
# Grand arbre feuillu, 3 x 4 cases (bloc de cases 'Ŧ') : l'arbre rond de la planche Gen 3.
BIG_TREE = {'sheet': 'gen3', 'col': 0, 'row': 2, 'w': 3, 'h': 4}
# Ponton (planches, bords gauche et droit) ; plage : coquillages et touffes éparpillés ; herbe : brindilles.
PIER = {'left': ('halcyon', 5, 195), 'mid': ('halcyon', 6, 195), 'right': ('halcyon', 7, 195)}
BEACH_BITS = [('halcyon', 6, 24), ('halcyon', 7, 24), ('halcyon', 6, 25), ('halcyon', 7, 25), ('halcyon', 5, 24)]
GRASS_BITS = [('halcyon', 6, 0), ('halcyon', 7, 0), ('halcyon', 6, 1)]
# Grand arbre pour un bloc de 2 x 2 cases 'T' : cime (au-dessus de Pierre), feuillage, tronc.
TREE = {'top': [('halcyon', 6, 26), ('halcyon', 7, 26)], 'mid': [('halcyon', 6, 27), ('halcyon', 7, 27)],
        'trunk': [('halcyon', 6, 28), ('halcyon', 7, 28)]}
# Clôture en bois (l'enclos de la planche Ferme) : rails, côtés et coins.
FENCE = {'h': ('ferme', 1, 25), 'v': ('ferme', 0, 27), 'post': ('ferme', 0, 25),
         'tl': ('ferme', 0, 25), 'tr': ('ferme', 2, 25), 'bl': ('ferme', 0, 28), 'br': ('ferme', 2, 28)}

# ---------- Bâtiments V2 : planche, colonne, rangée, largeur, hauteur, colonne de la porte ----------
BUILDINGS = {
    'grise': ('halcyon', 0, 129, 5, 7, 2),         # grande maison grise
    'double': ('halcyon', 0, 139, 7, 5, 3),        # maison double en bois
    'verte': ('halcyon', 0, 145, 5, 5, 2),         # maison au toit vert
    'mauve': ('halcyon', 0, 150, 4, 5, 1),         # maison mauve
    'rouge': ('halcyon', 2, 156, 5, 4, 2),         # centre au toit rouge
    'pierre': ('halcyon', 0, 177, 6, 6, 1),        # chaumière de pierre
    'chaumiere': ('halcyon', 0, 183, 5, 6, 2),     # petite chaumière
    'grange': ('halcyon', 0, 193, 5, 8, 2),        # grange
    'hall': ('halcyon', 0, 225, 5, 7, 2),          # grand bâtiment
    'salle': ('ville', 0, 43, 6, 6, 3),            # grande salle au toit vert
}
# Maison V2 de chaque type de bâtiment du jeu (les autres : la plus proche en taille).
BUILDING_OF_TYPE = {
    'house': 'rouge', 'fishingHut': 'chaumiere', 'cottage': 'pierre', 'slateHouse': 'verte', 'greenHouse': 'verte',
    'purpleHouse': 'mauve', 'school': 'hall', 'lab': 'rouge', 'dayCare': 'chaumiere', 'mansion': 'grise',
    'museum': 'salle', 'boulyFarm': 'grange', 'agence': 'double', 'frontierHouse': 'pierre', 'kedge': 'hall',
    'university': 'salle', 'asylum': 'double', 'pub': 'double', 'minster': 'hall', 'theDeep': 'salle',
    'stadium': 'salle',
}


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

    def auto_tile(self, terrain, quads):
        """Case de bord assemblée : `quads` = pour chaque quart (haut-gauche, haut-droit, bas-gauche, bas-droit)
        la case source (colonne, rangée) du bloc du terrain."""
        key = (terrain, quads)
        if key not in self.auto_index:
            img = Image.new('RGBA', (TILE, TILE))
            for q, (col, row) in enumerate(quads):
                qx, qy = q % 2, q // 2
                src = self.tile_image(TERRAIN_SHEET, col, row)
                img.paste(src.crop((qx * HALF, qy * HALF, (qx + 1) * HALF, (qy + 1) * HALF)), (qx * HALF, qy * HALF))
            self.auto_index[key] = len(self.auto_tiles)
            self.auto_tiles.append(img)
        return self.auto_index[key]

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

    def recolored(self, sheet, col, row):
        """Case d'une planche « menthe », aux verts de Halcyon (rangée dans la planche auto)."""
        key = ('mint', sheet, col, row)
        if key not in self.auto_index:
            img = self.tile_image(sheet, col, row)
            px = img.load()
            for y in range(TILE):
                for x in range(TILE):
                    r, g, b, a = px[x, y]
                    if a and (r, g, b) in MINT_TO_HALCYON:
                        px[x, y] = (*MINT_TO_HALCYON[(r, g, b)], a)
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

    # ---------- Une carte ----------

    def convert(self, game_map):
        grid = game_map['grid']
        H, W = len(grid), len(grid[0])
        at = lambda x, y: grid[y][x] if 0 <= x < W and 0 <= y < H else None
        sheets = []

        def ref(sheet, index):
            if sheet not in sheets:
                sheets.append(sheet)
            return sheets.index(sheet) * STRIDE + index

        layers = {name: [EMPTY] * (W * H) for name in ('sol', 'decor', 'dessus')}

        def put(layer, x, y, tile):
            if 0 <= x < W and 0 <= y < H and tile:
                sheet, col, row = tile[:3]
                if len(tile) > 3 and tile[3] == MINT:
                    layers[layer][y * W + x] = ref('auto', self.recolored(sheet, col, row))
                else:
                    layers[layer][y * W + x] = ref(sheet, self.index(sheet, col, row))

        def blocks(code, bw, bh, x, y):
            """Le bloc bw x bh de cases `code` qui commence en (x, y), s'il est libre."""
            cells = [(x + i, y + j) for j in range(bh) for i in range(bw)]
            return cells if all(at(cx, cy) == code and (cx, cy) not in taken for cx, cy in cells) else None

        def palm(x, y):
            put('dessus', x, y - 1, PALM[0])
            put('decor', x, y, PALM[1])
            put('decor', x, y + 1, PALM[2])

        taken = set()
        # Sol de chaque case : son terrain, ou (objet, bâtiment) le terrain le plus fréquent autour.
        def own_ground(code):
            if code in GROUND_OF_CODE:
                return GROUND_OF_CODE[code]
            return 'grass' if code in ('.', 'ĥ', 'f', 'ƒ', 'ʬ', 'ɲ') else None

        ground = [[own_ground(grid[y][x]) for x in range(W)] for y in range(H)]
        for _ in range(3):                     # les objets prennent le sol de leurs voisins (en plusieurs passes)
            for y in range(H):
                for x in range(W):
                    if ground[y][x] is None:
                        near = Counter(ground[y + dy][x + dx] for dx, dy in ((0, -1), (0, 1), (-1, 0), (1, 0))
                                       if 0 <= x + dx < W and 0 <= y + dy < H and ground[y + dy][x + dx])
                        if near:
                            ground[y][x] = near.most_common(1)[0][0]
        for y in range(H):
            for x in range(W):
                if ground[y][x] is None or grid[y][x] in 'RWD':
                    ground[y][x] = 'grass'          # sous les bâtiments : de l'herbe
                if grid[y][x] in ('=', 'I'):
                    ground[y][x] = 'water'          # pontons et ponts : sur l'eau

        for y in range(H):
            for x in range(W):
                code = grid[y][x]
                g = ground[y][x]
                if g == 'grass':
                    put('sol', x, y, FLAT.get(code) or GRASS[(x * 7 + y * 13) % len(GRASS)])
                    continue
                spec = TERRAINS[g]
                # La plage s'arrête au bord de l'eau sans liseré (c'est l'eau qui porte le bord de sable).
                same = {'beach', 'water'} if g == 'beach' else {g}
                other = lambda dx, dy: (0 <= x + dx < W and 0 <= y + dy < H) and ground[y + dy][x + dx] not in same
                beach = lambda dx, dy: (0 <= x + dx < W and 0 <= y + dy < H) and ground[y + dy][x + dx] == 'beach'
                quads = []
                for q in range(4):
                    qx, qy = q % 2, q // 2
                    dx, dy = (1 if qx else -1), (1 if qy else -1)
                    v, h, d = other(0, dy), other(dx, 0), other(dx, dy)
                    # Bordé de sable de ce côté : le bloc « sur la plage », s'il existe.
                    sandy = 'beach' in spec and ((v and beach(0, dy)) or (h and beach(dx, 0)) or (not v and not h and d and beach(dx, dy)))
                    block = {**spec, **spec['beach']} if sandy else spec
                    ox, oy = block['outer']
                    if v and h:
                        quads.append((ox + (2 if qx else 0), oy + (2 if qy else 0)))
                    elif v:
                        quads.append((ox + 1, oy + (2 if qy else 0)))
                    elif h:
                        quads.append((ox + (2 if qx else 0), oy + 1))
                    elif d:
                        quads.append(block['inner'][q])
                    else:
                        quads.append(spec['center'])
                quads = tuple(quads)
                if all(qd == spec['center'] for qd in quads):
                    put('sol', x, y, (TERRAIN_SHEET, *spec['center']))
                else:
                    layers['sol'][y * W + x] = ref('auto', self.auto_tile(g, quads))

        # Objets.
        for y in range(H):
            for x in range(W):
                h = (x * 73 + y * 151) % 23
                if grid[y][x] == 's' and h == 0:
                    put('decor', x, y, BEACH_BITS[(x + y) % len(BEACH_BITS)])
                elif grid[y][x] == '.' and h == 5:
                    put('decor', x, y, GRASS_BITS[(x * 3 + y) % len(GRASS_BITS)])
        for y in range(H):
            for x in range(W):
                code = grid[y][x]
                if code == 'Ŧ' and (x, y) not in taken:
                    cells = blocks('Ŧ', BIG_TREE['w'], BIG_TREE['h'], x, y)
                    if cells:
                        taken.update(cells)
                        for j in range(BIG_TREE['h']):
                            for i in range(BIG_TREE['w']):
                                put('decor', x + i, y + j, (BIG_TREE['sheet'], BIG_TREE['col'] + i, BIG_TREE['row'] + j, MINT))
                    else:
                        taken.add((x, y))
                        palm(x, y)
                elif code == 'ƫ' and (x, y) not in taken:
                    cells = blocks('ƫ', 2, 2, x, y)
                    taken.update(cells or [(x, y)])
                    palm(x, y)
                    if cells:
                        palm(x + 1, y)
                elif code == 'ƚ':
                    palm(x, y)
                elif code == '=':
                    left, right = at(x - 1, y) == '=', at(x + 1, y) == '='
                    put('decor', x, y, PIER['mid'] if left and right else PIER['right'] if left else PIER['left'] if right else PIER['mid'])
                elif code == 'T' and (x, y) not in taken:
                    block = [(x, y), (x + 1, y), (x, y + 1), (x + 1, y + 1)]
                    if all(at(bx, by) == 'T' and (bx, by) not in taken for bx, by in block):
                        taken.update(block)
                        for i in range(2):
                            put('dessus', x + i, y - 1, TREE['top'][i])
                            put('decor', x + i, y, TREE['mid'][i])
                            put('decor', x + i, y + 1, TREE['trunk'][i])
                    else:
                        taken.add((x, y))
                        put('decor', x, y, OBJECTS['ƚ']['decor'])
                        put('dessus', x, y - 1, OBJECTS['ƚ']['top'])
                elif code == 'F':
                    n, s_, w, e = (at(x, y - 1) == 'F', at(x, y + 1) == 'F', at(x - 1, y) == 'F', at(x + 1, y) == 'F')
                    if (w or e) and (n or s_):
                        kind = ('t' if s_ else 'b') + ('l' if e else 'r')
                    elif w or e:
                        kind = 'h'
                    elif n or s_:
                        kind = 'v'
                    else:
                        kind = 'post'
                    put('decor', x, y, FENCE[kind])
                elif code in OBJECTS:
                    put('decor', x, y, OBJECTS[code]['decor'])
                    if 'top' in OBJECTS[code] and y > 0 and layers['dessus'][(y - 1) * W + x] == EMPTY:
                        put('dessus', x, y - 1, OBJECTS[code]['top'])

        # Bâtiments : composantes reliées de cases toit / mur / porte. Leurs collisions suivent la maison V2 posée.
        building_solid = {}
        seen = set()
        for y in range(H):
            for x in range(W):
                if grid[y][x] not in 'RWD' or (x, y) in seen:
                    continue
                comp, stack = [], [(x, y)]
                seen.add((x, y))
                while stack:
                    cx, cy = stack.pop()
                    comp.append((cx, cy))
                    for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                        n = (cx + dx, cy + dy)
                        if n not in seen and at(*n) is not None and at(*n) in 'RWD':
                            seen.add(n)
                            stack.append(n)
                kinds = [b['type'] for b in game_map['buildings'] if (b['x'], b['y']) in set(comp)]
                building_solid.update(self.place_building(comp, grid, put, W, H, kinds[0] if kinds else None))

        solid = [building_solid.get((x, y), 1 if game_map['solid'].get(grid[y][x]) else 0) for y in range(H) for x in range(W)]
        spawn = game_map.get('spawn') or {'x': W // 2, 'y': H // 2, 'facing': 'down'}
        return {
            'version': 1, 'id': slugify(game_map['name']), 'name': game_map['name'], 'width': W, 'height': H,
            'sheets': sheets, 'layers': layers, 'solid': solid,
            'spawn': {'x': spawn['x'], 'y': spawn['y'], 'facing': spawn.get('facing', 'down')},
        }

    def place_building(self, comp, grid, put, W, H, kind):
        xs = [c[0] for c in comp]
        ys = [c[1] for c in comp]
        x0, x1, y0, y1 = min(xs), max(xs), min(ys), max(ys)
        bw, bh = x1 - x0 + 1, y1 - y0 + 1
        doors = sorted(x for x, y in comp if grid[y][x] == 'D')
        # La maison V2 la plus proche en taille (la largeur compte double), sans dépasser de plus d'une case.
        if kind in BUILDING_OF_TYPE:
            sheet, col, row, w, h, door = BUILDINGS[BUILDING_OF_TYPE[kind]]
        else:
            fits = [b for b in BUILDINGS.values() if b[3] <= bw + 1] or list(BUILDINGS.values())
            sheet, col, row, w, h, door = min(fits, key=lambda b: abs(b[3] - bw) * 2 + abs(b[4] - bh))
        # Calée sur le bas de l'emprise ; porte en face de la porte du jeu si possible, sinon centrée.
        left = (doors[0] - door) if doors else x0 + (bw - w) // 2
        left = max(x0 - 1, min(left, x1 + 1 - w + 1))
        top = y1 - h + 1
        # Collisions : l'emprise du jeu devient libre, la maison posée bloque (de sa rangée du haut dans l'emprise à son
        # pied), sauf sa porte.
        solid = {c: 0 for c in comp}
        for dy in range(max(0, y0 - top), h):
            for dx in range(w):
                solid[(left + dx, top + dy)] = 0 if (dx == door and dy == h - 1) else 1
        for dy in range(h):
            for dx in range(w):
                x, y = left + dx, top + dy
                if not (0 <= x < W and 0 <= y < H):
                    continue
                index = self.index(sheet, col + dx, row + dy)
                if index in set(next(s for s in self.catalog['sheets'] if s['id'] == sheet)['empty']):
                    continue
                # Ce qui dépasse au-dessus de l'emprise (le haut du toit) passe devant Pierre.
                put('decor' if y >= y0 else 'dessus', x, y, (sheet, col + dx, row + dy))
        return solid


# Cartes refaites dans le thème DS (Diamant / Perle, voir scripts/ds_theme.py).
DS_MAPS = {'fortDeFrance'}
# Cartes refaites dans le thème Gen 4 (planches Gen 4 seulement, voir scripts/g4_theme.py).
G4_MAPS = {'saintAy', 'routeMontepilloy', 'montepilloy', 'routeBonsecours', 'prytanee', 'bordeaux', 'hull'}
def main():
    # Toutes les cartes sont refaites ensemble : elles partagent la planche des cases assemblées (auto.png).
    ids = DEFAULT_MAPS
    exported = json.loads(subprocess.check_output(['node', str(ROOT / 'scripts' / 'export_maps.mjs'), *ids], cwd=ROOT))
    builder = Builder(load_catalog())
    OUT.mkdir(parents=True, exist_ok=True)
    force = [a.split('=', 1)[1] if '=' in a else '*' for a in sys.argv[1:] if a.startswith('--force')]
    results = [convert_ds(builder, m, slugify) if m['id'] in DS_MAPS else convert_g4(builder, m, slugify)
               if m['id'] in G4_MAPS else builder.convert(m) for m in exported]
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
