"""Thème Gen 4 (Diamant / Perle / Platine, HeartGold / SoulSilver) des cartes du créateur : voir scripts/convert_maps_v2.py.

Toutes les cases viennent des planches Gen 4 : la planche DPPt d'akizakura16 (dppt : sols, eau, arbres, clôtures,
mobilier, maisons), les hautes herbes et fleurs du Gen 4 Pack (autotiles-g4), le ponton (objets) et la bibliothèque
Gen 4 rangée par type (g4-<type> : forêt dense, blé, pavés, bitume, terrain de foot, bâtiments, véhicules).

Le dessin suit la grille du jeu (portes, chemins, eau, hautes herbes au même endroit) :
- sol : chaque terrain avec ses bords assemblés quart de case par quart de case (chemin, plage, mer, étang, blé,
  terrain de foot) ; pavés et bitume en ville ;
- arbres 'T' : la forêt dense DPPt (deux arbres par bloc de 2 x 2, en rangs serrés), cimes au-dessus de Pierre ;
- bâtiments : pour chaque type du jeu, un bâtiment Gen 4 dont la porte tombe sur la porte du jeu ; ses collisions
  suivent le dessin (le bas bloque sur la hauteur de l'emprise du jeu, le haut du toit passe devant Pierre) ;
- objets : buissons, clôtures (bois à la campagne, blanches en ville), panneaux, réverbères, bus, bateaux…
"""
import hashlib
import json
from collections import Counter
from pathlib import Path

from PIL import Image

TILE = 16
DPPT = 'dppt'

# Éléments de la bibliothèque Gen 4 (planches g4-<type>), désignés par leur origine « planche@colonne,rangée » : leur
# emplacement dans les planches change quand la bibliothèque est rangée autrement (scripts/build_g4_library.py, qui écrit
# g4-index.json) ; lib() le retrouve. (dx, dy) : une case du bloc de l'élément, à partir de son coin haut-gauche.
INDEX = json.loads((Path(__file__).resolve().parent.parent / 'public' / 'assets' / 'v2' / 'g4-index.json').read_text())


def lib(origin, dx=0, dy=0):
    e = INDEX[origin]
    return (e['sheet'], e['col'] + dx, e['row'] + dy)

# ---------- Sols : bloc 3 x 3 (coins et bords) sur l'herbe, case pleine, angles rentrants (haut-gauche, haut-droit,
# bas-gauche, bas-droit) ----------
TERRAINS = {
    'path': {'sheet': DPPT, 'outer': (0, 0), 'center': (1, 1), 'inner': [(1, 4), (0, 4), (1, 3), (0, 3)]},
    'beach': {'sheet': DPPT, 'outer': (5, 0), 'center': (6, 1), 'inner': [(7, 4), (6, 4), (7, 3), (6, 3)]},
    'sea': {'sheet': DPPT, 'outer': (5, 5), 'center': (6, 6), 'inner': [(7, 9), (6, 9), (7, 8), (6, 8)]},
    # Étang, lac, rivière : rives de terre ; les angles rentrants sont les coins de l'îlot du dessous.
    'pond': {'sheet': DPPT, 'outer': (0, 5), 'center': (1, 6), 'inner': [(2, 10), (0, 10), (2, 8), (0, 8)]},
    'tall': {'sheet': 'autotiles-g4', 'outer': (0, 1), 'center': (1, 2), 'inner': [(1, 0)] * 4},
    'wheat': {'sheet': lib('kyle-ext@5,41')[0], 'outer': lib('kyle-ext@5,41')[1:], 'center': lib('kyle-ext@5,41', 1, 1)[1:],
              'inner': [lib('kyle-ext@5,41', 1, 1)[1:]] * 4},
}
GRASS = (DPPT, 4, 0)
GRASS_BITS = [(DPPT, 4, 1), (DPPT, 4, 2), (DPPT, 3, 2), (DPPT, 3, 3)]
FLOWERS = {'f': ('autotiles-g4', 0, 8), 'ƒ': ('autotiles-g4', 3, 4)}
# Ville : pavés en chevrons (g4-sols, bloc gris-bleu) et bitume (g4-sols, la route au car).
COBBLE = [lib('ds-justin@232,16', 12 + i % 2, 8 + i // 2) for i in range(4)]
ASPHALT = [lib('ds-justin@52,44', 2 + i % 2, 9 + i // 2) for i in range(4)]
# Remblai du pont de chemin de fer (Hull) : murets de briques rouges (g4-sols).
BRICK = [lib('ds-justin@232,16', 9, 6), lib('ds-justin@232,16', 9, 7)]
# Terrain de foot : la pelouse au cadre blanc (g4-sols), coins et bords pris dans le carré de 4 x 4.
PITCH = {part: lib('rmxp-urbain@1,43', dx, dy) for part, (dx, dy) in {
    'tl': (0, 0), 't': (1, 0), 'tr': (3, 0), 'l': (0, 1), 'c': (4, 0), 'r': (3, 1),
    'bl': (0, 3), 'b': (1, 3), 'br': (3, 3)}.items()}

GROUND_OF_CODE = {'ç': 'path', 's': 'beach', 'w': 'sea', 'ø': 'sea', '~': 'pond', 'G': 'pond', 'B': 'pond',
                  'ĥ': 'tall', 'ʬ': 'wheat', 'ɔ': 'cobble', 'ɐ': 'asphalt', '=': 'pond', 'I': 'pond'}
CITY = {'cobble', 'asphalt'}

# ---------- Objets simples : [(planche, col, rangée) de haut en bas] ; la case du bas sur la case de l'objet, les autres
# au-dessus de Pierre ----------
OBJECTS = {
    'ƀ': [(DPPT, 7, 106)],                          # buisson rond
    'ƨ': [(DPPT, 7, 111)],                          # plant à baies
    'ŕ': [(DPPT, 7, 146)],                          # rocher
    'S': [(DPPT, 4, 135)],                          # panneau de bois
    '>': [(DPPT, 4, 135)],
    'M': [(DPPT, 5, 134), (DPPT, 5, 135)],          # boîte aux lettres rouge
    'l': [(DPPT, 7, 129), (DPPT, 7, 130)],          # réverbère
    'b': [(DPPT, 6, 134), (DPPT, 6, 135)],          # cabine
    'ʘ': [(DPPT, 5, 129), (DPPT, 5, 130)],          # mât et bannière (le drapeau de la cour)
}
FENCES = {
    'bois': {'tl': (0, 131), 'h': (1, 131), 'tr': (2, 131), 'v': (0, 132), 'bl': (0, 133), 'br': (2, 133), 'post': (4, 131)},
    'blanche': {'tl': (0, 128), 'h': (1, 128), 'tr': (2, 128), 'v': (0, 129), 'bl': (0, 130), 'br': (2, 130), 'post': (4, 128)},
}
# Forêt dense (g4-arbres, 2 x 4 : deux rangs d'arbres) ; tronc d'un arbre DPPt pour le bas de la lisière.
FOREST = lib('rmxp-nature@25,1')
# Ponton et ponts de bois (g4-mobilier, le ponton retouché de Fort-de-France) : bord gauche, milieu, bord droit ; deux
# rangées qui alternent.
PIER = [[lib('rmxp-urbain@22,10', 1 + c, 1 + r) for c in range(3)] for r in range(2)]

# ---------- Bâtiments ----------
# Un bâtiment : planche, case en haut à gauche, largeur, hauteur (en cases), porte (colonne, rangée dans le
# tampon) ; seuls les pixels d'un seul tenant avec la porte sont pris (pas les morceaux des voisins de la planche) ;
# planche « lib:<origine> » : un élément de la bibliothèque Gen 4 (col, row : décalage dans son bloc) ; `shift` : décalage en pixels
# (portes à cheval sur deux cases) ; `doors` : autres cases de porte (colonnes) sur la rangée de la porte ; `cols` :
# colonnes du tampon gardées (des travées de fenêtres retirées pour rétrécir une façade), `w` et `door` comptés après.
def b(sheet, col, row, w, h, door, shift=0, doors=(), cols=None):
    if sheet.startswith('lib:'):
        sheet, col, row = lib(sheet[4:], col, row)
    return {'sheet': sheet, 'col': col, 'row': row, 'w': w, 'h': h, 'door': door, 'shift': shift,
            'doors': doors, 'cols': cols}


BUILDINGS = {
    'rouge': b(DPPT, 0, 221, 8, 7, (3, 6)),                       # maison au toit rouge (la famille, Fort-de-France)
    'chaume': b(DPPT, 0, 277, 7, 6, (3, 4)),                      # chaumière aux cheminées
    'chaume-grande': b(DPPT, 0, 285, 7, 6, (3, 5)),               # grande chaumière
    'ardoise': b(DPPT, 0, 515, 6, 7, (2, 6)),                     # maison au toit bleu
    'mauve': b(DPPT, 0, 313, 6, 6, (2, 5)),                       # toit mauve, murs verts
    'orange': b(DPPT, 0, 291, 6, 6, (2, 5)),                      # toit orange, porte en bois
    'verriere': b(DPPT, 0, 557, 7, 6, (3, 5)),                    # grande maison à verrière bleue
    'ecole': b(DPPT, 0, 369, 6, 9, (2, 8)),                       # immeuble à grande porte
    'casino': b(DPPT, 0, 174, 6, 6, (2, 5)),                      # façade à néons et auvent
    'temple': b(DPPT, 0, 335, 7, 7, (3, 6)),                      # temple au clocher
    'vitrine': b(DPPT, 0, 385, 6, 7, (2, 6)),                     # bâtiment vitré
    'abri': b(DPPT, 0, 399, 4, 4, (2, 3)),                        # petit abri
    'mauve-2': b('lib:dppt@0,313', 0, 0, 6, 6, (2, 5)),
    'grange': b('lib:kaliser@0,205', 1, 0, 6, 6, (2, 5), doors=(3,)),   # sans son aile droite
    'boutique': b('lib:lotus-1@0,411', 0, 0, 5, 10, (1, 9)),
    'stade': b('lib:ds-justin@41,86', 5, 0, 11, 10, (5, 9)),
    'manoir': b('lib:ds-justin@75,85', 0, 0, 9, 9, (3, 8), cols=(0, 2, 3, 4, 5, 6, 8)),   # une travée de moins par aile
    'palais': b('lib:ds-justin@163,32', 0, 0, 12, 12, (5, 11), shift=-8),
    'longere': b('lib:ds-justin@16,107', 0, 0, 11, 7, (5, 6)),     # longue bâtisse au toit orange
    'bleue': b('lib:lotus-1@0,182', 0, 0, 6, 6, (2, 5)),
    'grise': b('lib:lotus-1@0,140', 0, 0, 6, 6, (2, 5)),
    'tuiles': b('lib:lotus-1@0,124', 0, 0, 6, 6, (2, 5)),
}
# Bâtiment Gen 4 de chaque type du jeu ; THEMES : variantes par carte (une ville, un style).
BUILDING_OF_TYPE = {
    'house': 'rouge', 'cottage': 'chaume', 'slateHouse': 'ardoise', 'greenHouse': 'mauve', 'purpleHouse': 'mauve-2',
    'school': 'orange', 'boulyFarm': 'grange', 'lab': 'verriere', 'mansion': 'manoir', 'museum': 'longere',
    'dayCare': 'chaume-grande', 'agence': 'boutique', 'frontierHouse': 'abri', 'stadium': 'stade', 'kedge': 'verriere',
    'university': 'verriere', 'asylum': 'casino', 'pub': 'orange', 'minster': 'temple', 'theDeep': 'vitrine',
}
THEMES = {
    'bordeaux': {'house': 'bleue', 'slateHouse': 'grise'},
    'hull': {'house': 'bleue', 'slateHouse': 'grise', 'school': 'ardoise', 'asylum': 'tuiles'},
}
FENCE_OF_MAP = {'prytanee': 'blanche', 'hull': 'blanche', 'bordeaux': 'blanche'}

# Véhicules et bateaux (g4-vehicules) : élément, case en haut à gauche, taille ; posés en bas à gauche de leur emprise.
VEHICLES = {
    'bus': {'at': lib('jared-camping@15,13', 0, 1), 'w': 4, 'h': 3},
    'boat': {'at': lib('jared-bateaux@0,129', 5, 1), 'w': 3, 'h': 2},
    'ferry': {'at': lib('sinnoh-kyle@38,25'), 'w': 8, 'h': 3},     # le yacht du ferry de Fort-de-France
}


class G4:
    """Une carte en thème Gen 4. Les cases empilées sont fondues dans la planche des cases assemblées (auto)."""

    def __init__(self, builder, game_map):
        self.bd = builder
        self.map = game_map
        self.grid = game_map['grid']
        self.H, self.W = len(self.grid), len(self.grid[0])
        self.stacks = {name: {} for name in ('sol', 'decor', 'dessus')}
        self.solid = {}
        self.doors = set()                      # cases de porte des bâtiments posés (toujours franchissables)

    # ----- outils -----
    def at(self, x, y):
        return self.grid[y][x] if 0 <= x < self.W and 0 <= y < self.H else None

    def put(self, layer, x, y, tile):
        if 0 <= x < self.W and 0 <= y < self.H and tile is not None and not self.empty(tile):
            self.stacks[layer].setdefault((x, y), []).append(tile)

    def empty(self, tile):
        if tile[0] == 'img':
            return tile[2].getbbox() is None
        if tile[0] == 'auto':
            return False
        sheet, col, row = tile
        info = self.bd.sheet_info[sheet]
        return row * info['cols'] + col in info['emptySet']

    def stamp(self, spec, left, top, layer_of_row, solid_of_cell=None):
        """Pose un tampon (bâtiment, véhicule) : sa case (i, j) sur la case (left + i, top + j) de la carte, au calque
        layer_of_row(j). Avec un décalage en pixels, les cases sont recoupées dans la planche."""
        sheet, col, row, w, h = spec['sheet'], spec['col'], spec['row'], spec['w'], spec['h']
        shift = spec.get('shift', 0)
        cols = spec.get('cols')
        if cols:
            w = len(cols)
        seed = spec.get('door') or spec.get('seed')
        if shift or seed:
            img = self.element_image(sheet, col, row, w, h, seed, cols)
            for j in range(h):
                for i in range(-1, w + 1):
                    px = i * TILE - shift
                    tile = img.crop((px, j * TILE, px + TILE, (j + 1) * TILE))
                    src = col + (cols[i] if cols else i) if 0 <= i < w else None
                    if not shift and src is not None and tile.tobytes() == self.bd.tile_image(sheet, src, row + j).tobytes():
                        self.put(layer_of_row(j), left + i, top + j, (sheet, src, row + j))   # case de la planche
                    else:
                        self.put(layer_of_row(j), left + i, top + j, ('img', self.key(tile), tile))
            return
        for j in range(h):
            for i in range(w):
                self.put(layer_of_row(j), left + i, top + j, (sheet, col + i, row + j))

    def element_image(self, sheet, col, row, w, h, door=None, cols=None):
        cols = cols or range(w)
        img = Image.new('RGBA', (len(cols) * TILE, h * TILE))
        for j in range(h):
            for i, c in enumerate(cols):
                img.paste(self.bd.tile_image(sheet, col + c, row + j), (i * TILE, j * TILE))
        if door is not None:
            # Seule la partie d'un seul tenant qui contient la porte : les bouts des voisins de la planche sont écartés.
            import numpy as np
            from scipy import ndimage
            arr = np.array(img)
            labels, _ = ndimage.label(arr[:, :, 3] > 0, structure=np.ones((3, 3)))
            keep = labels[door[1] * TILE + TILE // 2, door[0] * TILE + TILE // 2]
            if keep:
                arr[labels != keep] = 0
                img = Image.fromarray(arr)
        return img

    @staticmethod
    def key(img):
        return hashlib.sha1(img.tobytes()).hexdigest()

    def tile_img(self, tile):
        if tile[0] == 'img':
            return tile[2]
        if tile[0] == 'auto':
            return self.bd.auto_tiles[tile[1]].copy()
        return self.bd.tile_image(*tile)

    # ----- sol -----
    def grounds(self):
        own = lambda c: GROUND_OF_CODE.get(c, 'grass' if c in '.fƒɱɲ' else None)
        g = [[own(self.grid[y][x]) for x in range(self.W)] for y in range(self.H)]
        for _ in range(6):
            for y in range(self.H):
                for x in range(self.W):
                    if g[y][x] is None:
                        near = Counter(g[y + dy][x + dx] for dx, dy in ((0, -1), (0, 1), (-1, 0), (1, 0))
                                       if 0 <= x + dx < self.W and 0 <= y + dy < self.H and g[y + dy][x + dx]
                                       and g[y + dy][x + dx] not in ('tall', 'wheat', 'pond', 'sea'))
                        if near:
                            g[y][x] = near.most_common(1)[0][0]
        for y in range(self.H):
            for x in range(self.W):
                code = self.grid[y][x]
                if g[y][x] is None:
                    g[y][x] = 'grass'
                if code in 'RWD':                  # sous les bâtiments : le sol de la rue (ville) ou de l'herbe
                    g[y][x] = g[y][x] if g[y][x] in CITY else 'grass'
        self.ground = g

    def terrain_tile(self, x, y, name, same):
        spec = TERRAINS[name]
        other = lambda dx, dy: 0 <= x + dx < self.W and 0 <= y + dy < self.H and self.ground[y + dy][x + dx] not in same
        quads = []
        ox, oy = spec['outer']
        for q in range(4):
            qx, qy = q % 2, q // 2
            dx, dy = (1 if qx else -1), (1 if qy else -1)
            v, h, d = other(0, dy), other(dx, 0), other(dx, dy)
            if v and h:
                quads.append((ox + 2 * qx, oy + 2 * qy))
            elif v:
                quads.append((ox + 1, oy + 2 * qy))
            elif h:
                quads.append((ox + 2 * qx, oy + 1))
            elif d:
                quads.append(spec['inner'][q])
            else:
                quads.append(spec['center'])
        if all(qd == spec['center'] for qd in quads):
            return (spec['sheet'], *spec['center'])
        return ('auto', self.bd.quad_tile(spec['sheet'], tuple(quads)))

    def paint_ground(self):
        sea_obj = self.bd.objects.get('mer')
        for y in range(self.H):
            for x in range(self.W):
                g, code = self.ground[y][x], self.grid[y][x]
                if g in ('grass', 'tall', 'wheat'):
                    bit = (x * 73 + y * 151) % 29 == 0 and code == '.'
                    self.put('sol', x, y, GRASS_BITS[(x + y) % len(GRASS_BITS)] if bit else GRASS)
                if g == 'grass':
                    if code in FLOWERS:
                        self.put('decor', x, y, FLOWERS[code])
                elif g == 'cobble':
                    self.put('sol', x, y, COBBLE[(x % 2) + 2 * (y % 2)])
                elif g == 'asphalt':
                    self.put('sol', x, y, ASPHALT[(x % 2) + 2 * (y % 2)])
                elif g == 'tall':
                    self.put('sol', x, y, self.terrain_tile(x, y, 'tall', {'tall'}))
                elif g == 'wheat':
                    self.put('sol', x, y, self.terrain_tile(x, y, 'wheat', {'wheat'}))
                elif g == 'sea':
                    tile = self.terrain_tile(x, y, 'sea', {'sea'})
                    if tile[0] != 'auto' and sea_obj:
                        tile = ('objets', sea_obj['col'] + x % 2, sea_obj['row'] + y % 2)
                    self.put('sol', x, y, tile)
                elif g == 'pond':
                    # En ville, l'eau est bordée de quais (pas de rive de terre contre les pavés) : on la prolonge.
                    self.put('sol', x, y, self.terrain_tile(x, y, 'pond', {'pond', 'cobble', 'asphalt', 'sea'}))
                elif g == 'beach':
                    self.put('sol', x, y, self.terrain_tile(x, y, 'beach', {'beach', 'sea'}))
                elif g == 'path':
                    self.put('sol', x, y, self.terrain_tile(x, y, 'path', {'path'}))

    # ----- forêt -----
    def paint_forest(self):
        """Cases 'T' : la forêt dense, deux arbres par bloc de 2 x 2, alignés sur le bord bas et le bord gauche de
        chaque massif ; la rangée du haut de chaque arbre passe au-dessus de Pierre quand il est juste dessous."""
        sheet, col0, row0 = FOREST
        is_t = lambda x, y: self.at(x, y) == 'T'
        for y in range(self.H):
            for x in range(self.W):
                if not is_t(x, y):
                    continue
                left = x
                while is_t(left - 1, y):
                    left -= 1
                bottom = y
                while is_t(x, bottom + 1):
                    bottom += 1
                px = (x - left) % 2
                py = 1 - (bottom - y) % 2               # rangée 1 : le bas d'un arbre, rangée 0 : son haut
                tile = (sheet, col0 + px, row0 + 2 + py)
                # Haut d'un arbre au-dessus d'une case libre : au-dessus de Pierre (il passe derrière la cime).
                self.put('decor', x, y, tile)
            # Lisière du haut : la cime du rang du dessus déborde sur la case libre au-dessus d'un massif.
        for y in range(self.H):
            for x in range(self.W):
                if is_t(x, y) and not is_t(x, y - 1) and y > 0:
                    bottom = y
                    while is_t(x, bottom + 1):
                        bottom += 1
                    if (bottom - y) % 2 == 0:            # la case du haut est le bas d'un arbre : sa cime au-dessus
                        left = x
                        while is_t(left - 1, y):
                            left -= 1
                        self.put('dessus', x, y - 1, (sheet, col0 + (x - left) % 2, row0 + 2))

    # ----- objets -----
    def paint_objects(self):
        fence = FENCES[FENCE_OF_MAP.get(self.map['id'], 'bois')]
        for y in range(self.H):
            for x in range(self.W):
                code = self.grid[y][x]
                if code in OBJECTS:
                    tiles = OBJECTS[code]
                    for k, tile in enumerate(reversed(tiles)):
                        self.put('decor' if k == 0 else 'dessus', x, y - k, tile)
                elif code == 'F':
                    f = lambda dx, dy: self.at(x + dx, y + dy) == 'F'
                    n, s_, w, e = f(0, -1), f(0, 1), f(-1, 0), f(1, 0)
                    kind = (('t' if s_ else 'b') + ('l' if e else 'r')) if (w or e) and (n or s_) else \
                        'h' if (w or e) else 'v' if (n or s_) else 'post'
                    self.put('decor', x, y, (DPPT, *fence[kind]))
                elif code in '=I':
                    same = lambda dx: self.at(x + dx, y) == code
                    c = 1 if same(-1) and same(1) else 2 if same(-1) else 0 if same(1) else 1
                    self.put('decor', x, y, PIER[y % 2][c])
                elif code == 'ʕ':
                    self.put('decor', x, y, BRICK[y % 2])

    # ----- bâtiments -----
    def components(self):
        seen, comps = set(), []
        for y in range(self.H):
            for x in range(self.W):
                if self.grid[y][x] in 'RWD' and (x, y) not in seen:
                    comp, st = [], [(x, y)]
                    seen.add((x, y))
                    while st:
                        cx, cy = st.pop()
                        comp.append((cx, cy))
                        for n in ((cx + 1, cy), (cx - 1, cy), (cx, cy + 1), (cx, cy - 1)):
                            if n not in seen and self.at(*n) is not None and self.at(*n) in 'RWD':
                                seen.add(n)
                                st.append(n)
                    comps.append(comp)
        return comps

    def paint_buildings(self):
        theme = {**BUILDING_OF_TYPE, **THEMES.get(self.map['id'], {})}
        for bld in self.map['buildings']:
            kind = bld['type']
            if kind in ('footballPitch',):
                self.paint_pitch(bld)
                continue
            if kind in VEHICLES:
                self.paint_vehicle(bld)
                continue
            if kind not in theme:
                continue
            # Les cases de l'emprise de ce bâtiment (les emprises voisines collées sont séparées par les x des bâtiments).
            xs_next = sorted(o['x'] for o in self.map['buildings'] if o['y'] == bld['y'] and o['x'] > bld['x'])
            comp = next((c for c in self.components() if (bld['x'], bld['y']) in c), None)
            if not comp:
                continue
            limit = xs_next[0] if xs_next else 10_000
            comp = [c for c in comp if bld['x'] <= c[0] < limit]
            doors = sorted(c for c in comp if self.grid[c[1]][c[0]] == 'D')
            if not doors:
                continue
            spec = BUILDINGS[theme[kind]]
            dx, dy = doors[0]
            left, top = dx - spec['door'][0], dy - spec['door'][1]
            foot_top = min(c[1] for c in comp)
            foot_h = dy - foot_top + 1
            first_solid = spec['door'][1] - foot_h + 1      # rangée du tampon où commence le bas qui bloque
            for c in comp:
                self.solid[c] = 0
            self.stamp(spec, left, top, lambda j: 'decor' if j >= first_solid else 'dessus')
            # Collisions : les cases du bas (hauteur de l'emprise du jeu) bien couvertes par le bâtiment.
            img = self.element_image(spec['sheet'], spec['col'], spec['row'], spec['w'], spec['h'], spec['door'], spec['cols'])
            for j in range(max(0, first_solid), spec['door'][1] + 1):
                for i in range(-1, len(spec['cols'] or range(spec['w'])) + 1):
                    px = i * TILE - spec['shift']
                    cell = img.crop((px + 2, j * TILE + 2, px + TILE - 2, (j + 1) * TILE - 2))
                    whole = img.crop((px, j * TILE, px + TILE, (j + 1) * TILE))
                    opaque = sum(1 for a in cell.getchannel('A').getdata() if a > 200)
                    full = sum(1 for a in whole.getchannel('A').getdata() if a == 255)
                    # Bloque : le centre de la case bien couvert, ou la case pleine à plus de moitié (un bord de toit).
                    if opaque > 0.4 * cell.width * cell.height or full >= 0.5 * TILE * TILE:
                        self.solid[(left + i, top + j)] = 1
            for col in (spec['door'][0], *spec['doors']):
                self.solid[(left + col, dy)] = 0
                self.doors.add((left + col, dy))

    def paint_pitch(self, bld):
        x0, y0, w, h = bld['x'], bld['y'], bld.get('w', 7), bld.get('h', 6)
        for j in range(h):
            for i in range(w):
                v = 't' if j == 0 else 'b' if j == h - 1 else ''
                hz = 'l' if i == 0 else 'r' if i == w - 1 else ''
                part = (v + hz) or ('c' if not (v or hz) else v or hz)
                part = {'tl': 'tl', 'tr': 'tr', 'bl': 'bl', 'br': 'br'}.get(part, part)
                self.stacks['sol'][(x0 + i, y0 + j)] = [PITCH[part]]

    def paint_vehicle(self, bld):
        v = VEHICLES[bld['type']]
        cells = [(x, y) for y in range(self.H) for x in range(self.W)
                 if self.grid[y][x] in 'qB' and abs(x - bld['x']) < 6 and abs(y - bld['y']) < 4]
        cells = self.connected(cells, (bld['x'], bld['y']))
        if not cells:
            return
        x1, y1 = max(c[0] for c in cells), max(c[1] for c in cells)
        x0 = min(c[0] for c in cells)
        if bld['type'] == 'ferry':
            left = x1 - v['w'] + 1                     # proue contre le ponton, l'arrière sort de la carte
        else:
            left = x0 + ((x1 - x0 + 1) - v['w']) // 2
        top = y1 - v['h'] + 1
        sheet, col, row = v['at']
        # Seuls les pixels d'un seul tenant avec le centre du véhicule (pas un voisin de la planche).
        spec = {'sheet': sheet, 'col': col, 'row': row, 'w': v['w'], 'h': v['h'], 'seed': (v['w'] // 2, v['h'] // 2)}
        self.stamp(spec, left, top, lambda j: 'dessus' if j == 0 and v['h'] > 2 else 'decor')

    def connected(self, cells, start):
        cells = set(cells)
        if start not in cells:
            return []
        out, st = {start}, [start]
        while st:
            cx, cy = st.pop()
            for n in ((cx + 1, cy), (cx - 1, cy), (cx, cy + 1), (cx, cy - 1)):
                if n in cells and n not in out:
                    out.add(n)
                    st.append(n)
        return sorted(out)

    # ----- carte -----
    def build(self, slugify):
        self.grounds()
        self.paint_ground()
        self.paint_forest()
        self.paint_objects()
        self.paint_buildings()
        sheets = []

        def ref(sheet, index):
            if sheet not in sheets:
                sheets.append(sheet)
            return sheets.index(sheet) * 100000 + index

        layers = {}
        for name, stack in self.stacks.items():
            cells = [-1] * (self.W * self.H)
            for (x, y), tiles in stack.items():
                if len(tiles) == 1 and tiles[0][0] not in ('img', 'auto'):
                    sheet, col, row = tiles[0]
                    cells[y * self.W + x] = ref(sheet, self.bd.index(sheet, col, row))
                elif len(tiles) == 1 and tiles[0][0] == 'auto':
                    cells[y * self.W + x] = ref('auto', tiles[0][1])
                else:
                    img = Image.new('RGBA', (TILE, TILE))
                    for t in tiles:
                        img.alpha_composite(self.tile_img(t).convert('RGBA'))
                    cells[y * self.W + x] = ref('auto', self.bd.image_tile(img))
            layers[name] = cells
        game_solid = self.map['solid']
        flat = [self.solid.get((x, y), 1 if game_solid.get(self.grid[y][x]) else 0)
                for y in range(self.H) for x in range(self.W)]
        # Une case du Décor pleine à plus de moitié bloque (deux bâtiments voisins qui la couvrent chacun en partie),
        # sauf les portes et ce qu'on traverse (fleurs, pontons, ponts).
        for (x, y), tiles in self.stacks['decor'].items():
            if flat[y * self.W + x] or (x, y) in self.doors or self.grid[y][x] in 'fƒ=I':
                continue
            img = Image.new('RGBA', (TILE, TILE))
            for t in tiles:
                img.alpha_composite(self.tile_img(t).convert('RGBA'))
            if sum(1 for a in img.getchannel('A').getdata() if a == 255) >= 0.5 * TILE * TILE:
                flat[y * self.W + x] = 1
        spawn = self.map.get('spawn') or {'x': self.W // 2, 'y': self.H // 2, 'facing': 'down'}
        return {'version': 1, 'id': slugify(self.map['name']), 'name': self.map['name'], 'width': self.W,
                'height': self.H, 'sheets': sheets, 'layers': layers, 'solid': flat,
                'spawn': {'x': spawn['x'], 'y': spawn['y'], 'facing': spawn.get('facing', 'down')}}


def convert_g4(builder, game_map, slugify):
    return G4(builder, game_map).build(slugify)
