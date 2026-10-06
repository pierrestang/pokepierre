"""Thème « DS » (Diamant / Perle) des cartes du créateur : voir scripts/convert_maps_v2.py.

Tout vient de la planche DPPt d'akizakura16 (public/assets/v2/dppt.png) : sols et leurs bordures, arbres, clôtures,
panneaux, maisons ; les palmiers (absents de Sinnoh) sont ceux de la planche Jungle, aux verts de DPPt ; le ferry vient
de la planche « objets » (yacht de Kyle-Dove). Les objets qui débordent sur leurs voisins (arbres de 3 cases de large,
maisons décalées d'une demi-case) sont empilés case par case puis fondus en une seule case (planche auto).
"""
import json
from collections import Counter

from PIL import Image

TILE, HALF = 16, 8
SHEET = 'dppt'

# ---------- Sols (planche DPPt) ----------
# `outer` : coin haut-gauche du bloc 3 x 3 (coins et bords), `center` : case pleine, `inner` : angles rentrants
# (l'autre terrain dans un seul coin) haut-gauche, haut-droit, bas-gauche, bas-droit.
TERRAINS = {
    'path': {'outer': (0, 0), 'center': (1, 1), 'inner': [(1, 4), (0, 4), (1, 3), (0, 3)]},     # chemin de sable
    'beach': {'outer': (5, 0), 'center': (6, 1), 'inner': [(7, 4), (6, 4), (7, 3), (6, 3)]},    # plage
    'water': {'outer': (5, 5), 'center': (6, 6), 'inner': [(7, 9), (6, 9), (7, 8), (6, 8)]},    # mer (bord d'écume)
    'dirt': {'outer': (0, 17), 'center': (1, 18), 'inner': [(1, 21), (0, 21), (1, 20), (0, 20)]},  # terre
    # Hautes herbes DS (autotile RMXP du Gen 4 Pack, planche « autotiles-g4 ») : bords en 3 x 3, angles rentrants dans
    # les quatre quarts de la case du haut.
    'tall': {'sheet': 'autotiles-g4', 'outer': (0, 1), 'center': (1, 2), 'inner': [(1, 0)] * 4},
}
# Fleurs DS animées du Gen 4 Pack (première image) : blanches ('f'), roses ('ƒ'), posées sur l'herbe.
FLOWERS = {'f': ('autotiles-g4', 0, 8), 'ƒ': ('autotiles-g4', 3, 4)}
GROUND_OF_CODE = {'ç': 'path', 's': 'beach', 'w': 'water', '~': 'water', 'G': 'water', 'ø': 'water', 'B': 'water',
                  'ɔ': 'dirt', 'ɐ': 'dirt'}
GRASS = (SHEET, 4, 0)
GRASS_BITS = [(SHEET, 4, 1), (SHEET, 4, 2), (SHEET, 3, 2), (SHEET, 3, 3)]
FLAT = {'f': (SHEET, 3, 1), 'ƒ': (SHEET, 3, 0)}                                 # fleurs blanches, fleurs orange

# Verts « menthe » (Gen 3, Jungle) -> verts de DPPt.
MINT = 'mint'
MINT_TO_DPPT = {(112, 200, 160): (104, 208, 160), (160, 224, 192): (168, 216, 176), (64, 176, 136): (88, 176, 136),
                (24, 160, 104): (78, 156, 120)}
SEA = 'sea'                                     # marque des cases de mer à recolorer (voir SEA_TO_DPPT)

# ---------- Objets ----------
# Tampons : liste de lignes de cases (planche, colonne, rangée[, MINT]), posées à partir de (dx, dy) relatif à la case
# d'origine du bloc ; les rangées au-dessus de `solid_from` (relatif) passent au-dessus de Pierre.
def stamp(sheet, col, row, w, h, mint=False):
    return [[(sheet, col + i, row + j, MINT) if mint else (sheet, col + i, row + j) for i in range(w)] for j in range(h)]


BIG_TREE = stamp(SHEET, 5, 80, 3, 4)            # grand arbre feuillu (bloc 'Ŧ' de 3 x 4)
TREE = stamp(SHEET, 0, 81, 3, 3)                # arbre rond (bloc 'T' de 2 x 2 : déborde d'une case à droite)
STATUE = stamp(SHEET, 6, 136, 2, 2)             # statue de pierre (mémorial)
PLAZA = stamp(SHEET, 3, 17, 4, 4)               # dallage de pierres (le plateau du mémorial, 4 x 4)
# Mer : le motif de 2 x 2 cases de Dewitty (planche « objets »), aux bleus de DPPt pour se raccorder à l'écume.
SEA_TO_DPPT = {(39, 108, 248): (24, 96, 216), (45, 126, 255): (32, 112, 224), (50, 148, 255): (40, 128, 224),
               (65, 176, 255): (72, 160, 224)}
OBJECTS = {
    'ƨ': (SHEET, 7, 111), 'ŕ': (SHEET, 7, 146), 'ø': (SHEET, 7, 145),   # plant à baies, rochers
    'S': (SHEET, 4, 135),
}
MAILBOX = [[(SHEET, 5, 134)], [(SHEET, 5, 135)]]
BUSH = [[(SHEET, 7, 106)], [(SHEET, 7, 107)]]   # petit buisson (le haut passe devant Pierre)
FENCE = {'tl': (0, 131), 'h': (1, 131), 'tr': (2, 131), 'v': (0, 132), 'bl': (0, 133), 'br': (2, 133),
         'post': (4, 131)}

# ---------- Bâtiments : tampon, cases bloquantes (colonnes, rangées) et porte, relatives au tampon ----------
HOUSES = {
    'house': {'stamp': stamp(SHEET, 0, 222, 7, 7), 'cols': range(1, 6), 'rows': range(1, 6), 'door': (3, 5)},
    'fishingHut': {'stamp': stamp(SHEET, 0, 253, 6, 6), 'cols': range(1, 6), 'rows': range(0, 5), 'door': (2, 4)},
}


def reshape_island(grid, power=9):
    """Île au contour de jeu DS : un carré aux coins bien arrondis (côtes droites, pas de marches d'escalier sur les
    diagonales), sur l'emprise de l'île du jeu ; une plage de 2 cases tout autour. Renvoie la nouvelle grille et les
    collisions des cases changées."""
    H, W = len(grid), len(grid[0])
    rows = [list(r) for r in grid]
    land = [(x, y) for y in range(H) for x in range(W) if grid[y][x] not in 'wøB=']
    x0, x1 = min(c[0] for c in land), max(c[0] for c in land)
    y0, y1 = min(c[1] for c in land), max(c[1] for c in land)
    cx, cy, a, b = (x0 + x1) / 2, (y0 + y1) / 2, (x1 - x0) / 2 + 0.5, (y1 - y0) / 2 + 0.5
    inside = lambda x, y: abs((x - cx) / a) ** power + abs((y - cy) / b) ** power <= 1
    changed = {}
    for y in range(H):
        for x in range(W):
            if inside(x, y) and rows[y][x] == 'w':
                rows[y][x] = 's'
            elif not inside(x, y) and rows[y][x] in 's.':
                rows[y][x] = 'w'
    water = lambda x, y: not (0 <= x < W and 0 <= y < H) or rows[y][x] in 'wø'
    for y in range(H):
        for x in range(W):
            near = any(water(x + dx, y + dy) for dx in range(-2, 3) for dy in range(-2, 3))
            if rows[y][x] in '.ĥfƒ' and near:
                rows[y][x] = 's'
            elif rows[y][x] == 's' and not near:
                rows[y][x] = '.'                     # l'herbe suit le contour, la plage garde ses 2 cases
    for y in range(H):
        for x in range(W):
            if rows[y][x] != grid[y][x]:
                changed[(x, y)] = 1 if rows[y][x] == 'w' else 0
    return [''.join(r) for r in rows], changed


def convert_ds(builder, game_map, slugify):
    grid = game_map['grid']
    solid = {}
    if game_map['id'] == 'fortDeFrance':
        grid, solid = reshape_island(grid)
    H, W = len(grid), len(grid[0])
    at = lambda x, y: grid[y][x] if 0 <= x < W and 0 <= y < H else None
    stacks = {name: {} for name in ('sol', 'decor', 'dessus')}

    def put(layer, x, y, tile):
        if 0 <= x < W and 0 <= y < H and tile and not empty(tile):
            stacks[layer].setdefault((x, y), []).append(tile)

    def empty(tile):
        sheet, col, row = tile[:3]
        if sheet == 'auto':
            return False
        info = builder.sheet_info[sheet]
        return row * info['cols'] + col in info['emptySet']

    def obj(name):
        info = builder.objects[name]
        return info, stamp('objets', info['col'], info['row'], info['w'], info['h'])

    def put_stamp(rows, x, y, solid_from=0):
        for j, line in enumerate(rows):
            for i, tile in enumerate(line):
                put('decor' if j >= solid_from else 'dessus', x + i, y + j, tile)

    # Sol de chaque case : son terrain, ou (objets, bâtiments) le plus fréquent autour.
    def own(code):
        if code == 'ĥ':
            return 'tall'
        return GROUND_OF_CODE.get(code, 'grass' if code in '.fƒʬɱɲ' else None)

    ground = [[own(grid[y][x]) for x in range(W)] for y in range(H)]
    for _ in range(4):
        for y in range(H):
            for x in range(W):
                if ground[y][x] is None:
                    near = Counter(ground[y + dy][x + dx] for dx, dy in ((0, -1), (0, 1), (-1, 0), (1, 0))
                                   if 0 <= x + dx < W and 0 <= y + dy < H and ground[y + dy][x + dx])
                    ground[y][x] = near.most_common(1)[0][0] if near else None
    for y in range(H):
        for x in range(W):
            if ground[y][x] is None or grid[y][x] in 'RWD':
                ground[y][x] = 'grass'
            if grid[y][x] == '=':
                ground[y][x] = 'water'

    for y in range(H):
        for x in range(W):
            g = ground[y][x]
            code = grid[y][x]
            if g == 'grass':
                tile = GRASS_BITS[(x + y) % len(GRASS_BITS)] if (x * 73 + y * 151) % 29 == 0 and code == '.' else GRASS
                put('sol', x, y, tile)
                if code in FLOWERS:
                    put('decor', x, y, FLOWERS[code])
                continue
            spec = TERRAINS[g]
            sheet = spec.get('sheet', SHEET)
            same = {'beach', 'water'} if g == 'beach' else {g}       # la plage va jusqu'à l'eau, l'écume est sur l'eau
            other = lambda dx, dy: 0 <= x + dx < W and 0 <= y + dy < H and ground[y + dy][x + dx] not in same
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
            if all(qd == spec['center'] for qd in quads) and g == 'water' and 'mer' in builder.objects:
                info = builder.objects['mer']
                put('sol', x, y, ('objets', info['col'] + x % 2, info['row'] + y % 2, SEA))
            elif all(qd == spec['center'] for qd in quads):
                put('sol', x, y, (sheet, *spec['center']))
            else:
                put('sol', x, y, ('auto', builder.quad_tile(sheet, tuple(quads)), 0))

    # Objets.
    taken = set()

    def block(code, bw, bh, x, y):
        cells = [(x + i, y + j) for j in range(bh) for i in range(bw)]
        return cells if all(at(cx, cy) == code and (cx, cy) not in taken for cx, cy in cells) else None

    for y in range(H):
        for x in range(W):
            code = grid[y][x]
            if (x, y) in taken:
                continue
            if code == 'Ŧ':
                cells = block('Ŧ', 3, 4, x, y)
                if cells:
                    # Grand arbre : l'arbre rond DS centré en bas du bloc ; la rangée du haut reste libre.
                    taken.update(cells)
                    info, tree = obj('arbre-3')
                    put_stamp(tree, x, y + 4 - info['h'], solid_from=1)
                    for i in range(3):
                        solid[(x + i, y)] = 0
                    continue
            if code in 'Ŧƫ':
                cells = block(code, 2, 2, x, y)
                if cells:
                    taken.update(cells)
                    info, palm = obj('palmier')                     # 4 de large, centré sur le bloc ; pied en bas
                    put_stamp(palm, x - 1, y + 2 - info['h'], solid_from=info['h'] - 2)
                    continue
            if code in 'Ŧƫƚ':
                info, palm = obj('palmier-petit')                   # 3 de large, centré sur la case
                put_stamp(palm, x - 1, y + 1 - info['h'], solid_from=info['h'] - 1)
            elif code == 'T':
                cells = block('T', 2, 2, x, y)
                taken.update(cells or [(x, y)])
                info, tree = obj('arbre' if cells else 'arbre-3')
                put_stamp(tree, x - 1 if cells else x - 1, y + (2 if cells else 1) - info['h'], solid_from=info['h'] - (2 if cells else 1))
            elif code == 'M':
                put_stamp(MAILBOX, x, y - 1, solid_from=1)
            elif code == 'ɸ':
                solid[(x, y)] = 0                           # pas de drapeau dessiné (aucune planche n'en a) : on passe
            elif code == 'ƀ':
                put_stamp(BUSH, x, y - 1, solid_from=1)
            elif code == 'F':
                n, s_, w, e = (at(x, y - 1) == 'F', at(x, y + 1) == 'F', at(x - 1, y) == 'F', at(x + 1, y) == 'F')
                kind = (('t' if s_ else 'b') + ('l' if e else 'r')) if (w or e) and (n or s_) else \
                    'h' if (w or e) else 'v' if (n or s_) else 'post'
                put('decor', x, y, (SHEET, *FENCE[kind]))
            elif code == '=':
                # Ponton DS (planches transversales) : bords à poteaux à gauche et à droite, motif de 3 rangées.
                info = builder.objects['ponton']
                left, right = at(x - 1, y) == '=', at(x + 1, y) == '='
                col = 1 if left and right else 2 if left else 0 if right else 1
                put('decor', x, y, ('objets', info['col'] + col, info['row'] + y % info['h']))
            elif code in OBJECTS:
                put('decor', x, y, OBJECTS[code])

    # Île : un palmier dans chaque coin de la pelouse (sur 2 x 2 cases d'herbe libres, loin des autres objets).
    if game_map['id'] == 'fortDeFrance':
        free = lambda x, y: all(at(x + i, y + j) == '.' for i in range(-1, 3) for j in range(-1, 3))
        grass = [(x, y) for y in range(H) for x in range(W) if grid[y][x] == '.']
        gx0, gx1 = min(c[0] for c in grass), max(c[0] for c in grass)
        gy0, gy1 = min(c[1] for c in grass), max(c[1] for c in grass)
        info, palm = obj('palmier')
        for corner_x, corner_y, sx, sy in ((gx0, gy0, 1, 1), (gx1 - 1, gy0, -1, 1), (gx0, gy1 - 1, 1, -1), (gx1 - 1, gy1 - 1, -1, -1)):
            spot = next(((corner_x + sx * d, corner_y + sy * e) for k in range(12) for d in range(k + 1) for e in [k - d]
                         if free(corner_x + sx * d, corner_y + sy * e)), None)
            if spot:
                x, y = spot
                put_stamp(palm, x - 1, y + 2 - info['h'], solid_from=info['h'] - 2)
                for i in range(2):
                    for j in range(2):
                        solid[(x + i, y + j)] = 1

    # Mémorial : la statue sur l'herbe, au centre, un massif de fleurs à chaque coin.
    memorial = [(x, y) for y in range(H) for x in range(W) if grid[y][x] in 'ɱɲ']
    if memorial:
        x0, y0 = min(c[0] for c in memorial), min(c[1] for c in memorial)
        x1, y1 = max(c[0] for c in memorial), max(c[1] for c in memorial)
        put_stamp(STATUE, x0 + 1, y0 + 1)
        for x, y in memorial:
            solid[(x, y)] = 0
        for i in range(2):
            for j in range(2):
                solid[(x0 + 1 + i, y0 + 1 + j)] = 1
        for x, y in ((x0, y0), (x1, y0), (x0, y1), (x1, y1)):
            put('decor', x, y, FLOWERS['ƒ'])

    # Bâtiments.
    for b in game_map['buildings']:
        spec = HOUSES.get(b['type'])
        door = next(((x, y) for y in range(H) for x in range(W) if grid[y][x] == 'D' and comp_has(grid, b, x, y)), None)
        if not spec or not door:
            continue
        comp = component(grid, b['x'], b['y'])
        for c in comp:
            solid[c] = 0
        left, top = door[0] - spec['door'][0], door[1] - spec['door'][1]
        # Le toit au-dessus de l'emprise du jeu passe devant Pierre (il marche derrière la maison).
        put_stamp(spec['stamp'], left, top, solid_from=min(c[1] for c in comp) - top)
        for r in spec['rows']:
            for c in spec['cols']:
                solid[(left + c, top + r)] = 0 if (c, r) == spec['door'] else 1

    # Ferry : le yacht, proue vers le ponton, sur les cases 'B'.
    boats = [(x, y) for y in range(H) for x in range(W) if grid[y][x] == 'B']
    if boats:
        info = builder.objects['ferry']
        bx, by = min(c[0] for c in boats), min(c[1] for c in boats)
        top = by + 2 - info['h']
        pier = [(x, y) for y in range(H) for x in range(W) if grid[y][x] == '=']
        if pier:                                     # amarré contre le ponton, à mi-longueur
            bx = max(c[0] for c in pier) + 1
            top = (min(c[1] for c in pier) + max(c[1] for c in pier)) // 2 - info['h'] // 2 + 1
        put_stamp(stamp('objets', info['col'], info['row'], info['w'], info['h']), bx, top)
        for c in boats:
            solid[c] = 0
        for j in range(info['h']):
            for i in range(info['w']):
                solid[(bx + i, top + j)] = 1

    # Un voilier au large, côté gauche de la carte : en pleine mer, à quelques cases de la côte (bien visible).
    if 'voilier' in builder.objects and boats:
        info, boat = obj('voilier')
        best = None
        for y in range(H - info['h']):
            for x in range(W // 2 - info['w']):
                cells = [(x + i, y + j) for j in range(-1, info['h'] + 1) for i in range(-1, info['w'] + 1)]
                if all(0 <= cx < W and 0 <= cy < H and ground[cy][cx] == 'water' and grid[cy][cx] == 'w' for cx, cy in cells):
                    score = min(abs(cx - lx) + abs(cy - ly) for cx, cy in [(x, y)] for lx, ly in
                                [(lx, ly) for ly in range(H) for lx in range(W) if ground[ly][lx] != 'water'])
                    if score >= 2 and (best is None or (score, y) < (best[0], best[2])):
                        best = (score, x, y)
        if best:
            _, sx, sy = best
            put_stamp(boat, sx, sy)
            for j in range(info['h']):
                for i in range(info['w']):
                    solid[(sx + i, sy + j)] = 1

    # Calques : une case seule telle quelle, plusieurs cases empilées fondues en une.
    sheets = []

    def ref(sheet, index):
        if sheet not in sheets:
            sheets.append(sheet)
        return sheets.index(sheet) * 100000 + index

    layers = {}
    for name, stack in stacks.items():
        cells = [-1] * (W * H)
        for (x, y), tiles in stack.items():
            tiles = [(*t[:3], MINT) if len(t) > 3 and t[3] == MINT else t for t in tiles]
            if len(tiles) == 1 and len(tiles[0]) == 3:
                sheet, col, row = tiles[0]
                cells[y * W + x] = ref(sheet, col if sheet == 'auto' else builder.index(sheet, col, row))
            else:
                cells[y * W + x] = ref('auto', builder.composite(tuple(tiles), {**MINT_TO_DPPT, **SEA_TO_DPPT}))
        layers[name] = cells

    game_solid = game_map['solid']
    flat_solid = [solid.get((x, y), 1 if game_solid.get(grid[y][x]) else 0) for y in range(H) for x in range(W)]
    spawn = game_map.get('spawn') or {'x': W // 2, 'y': H // 2, 'facing': 'down'}
    return {'version': 1, 'id': slugify(game_map['name']), 'name': game_map['name'], 'width': W, 'height': H,
            'sheets': sheets, 'layers': layers, 'solid': flat_solid,
            'spawn': {'x': spawn['x'], 'y': spawn['y'], 'facing': spawn.get('facing', 'down')}}


def component(grid, x, y):
    """Cases toit / mur / porte reliées à (x, y)."""
    H, W = len(grid), len(grid[0])
    seen, stack = {(x, y)}, [(x, y)]
    while stack:
        cx, cy = stack.pop()
        for n in ((cx + 1, cy), (cx - 1, cy), (cx, cy + 1), (cx, cy - 1)):
            if n not in seen and 0 <= n[0] < W and 0 <= n[1] < H and grid[n[1]][n[0]] in 'RWD':
                seen.add(n)
                stack.append(n)
    return seen


def comp_has(grid, b, x, y):
    return (x, y) in component(grid, b['x'], b['y'])
