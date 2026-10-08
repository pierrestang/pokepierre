#!/usr/bin/env python3
"""Cartes Gen 4 de Saint-Ay à Hull, deuxième passe de dessin (octobre 2026) : enrichit le dessin des cartes générées par
scripts/g4_theme.py puis retouchées dans le créateur, sans rien changer à leur structure jouable.

Départ, portes, PNJ, objets, événements et obstacles conditionnels (props) restent tels quels. Seul le mobilier
(FURNITURE : réverbères, bancs, jardinières, tas de bois, rochers) ajoute des cases bloquantes : jamais sur un chemin,
des hautes herbes ou une case de l'histoire (scripts/export_story_points.mjs : PNJ, objets, portes, scénettes, rondes,
arrivées), et check_access refuse qu'une case ou un point qu'on atteignait ne s'atteigne plus. Il part de la carte du tag git avant-refonte-g4 (les retouches faites depuis dans le créateur
seraient perdues) et, carte par carte (PLANS) :
- prolonge les chemins de sable DPPt jusqu'aux portes et sous les boîtes aux lettres et jardinières (parvis), en
  refaisant les bords des cases voisines ;
- plante des massifs de fleurs (calque Sol : ils se traversent) et nuance les grandes pelouses (touffes d'herbe rase) ;
- pose des nénuphars et des rochers sur l'eau, des objets sur des cases déjà bloquantes, du mobilier ;
- retire les débris de retouches (bouts d'objets effacés).

Usage : python3 scripts/g4_enrich.py [id…]     (ids des cartes : saint-ay, montepilloy… ; sans id : toutes)
        python3 scripts/g4_enrich.py --plan id  : la grille de la carte (sols, cases bloquantes, points importants)
Puis : python3 scripts/audit_maps.py et node scripts/check_paths.js.
"""
import json
import random
import subprocess
import sys

import numpy as np
from PIL import Image
from scipy import ndimage

from convert_maps_v2 import Builder, load_catalog, ROOT, TILE
from ds_theme import TERRAINS, GRASS, GRASS_BITS

STRIDE = 100000
TAG = 'avant-refonte-g4'
GAME_ID = {'saint-ay': 'saintAy', 'route-de-montepilloy': 'routeMontepilloy', 'montepilloy': 'montepilloy',
           'bonsecours': 'routeBonsecours', 'prytanee': 'prytanee', 'bordeaux': 'bordeaux', 'hull': 'hull'}
FLOWERS = {'f': ('autotiles-g4', 0, 8), 'ƒ': ('autotiles-g4', 3, 4), 'o': ('dppt', 3, 0)}
LILY = [('g4-eau', 13, 80), ('g4-eau', 14, 80)]          # nénuphars (sur fond transparent)
ROCK_IN_WATER = ('dppt', 7, 145)                          # rocher cerclé d'écume

# Mobilier qui ajoute des collisions : (planche, colonne, rangée, largeur, hauteur, première rangée bloquante) ; les
# rangées du dessus passent au-dessus de Pierre.
FURNITURE = {
    # Un réverbère différent par ville (voir scripts/identites.py) : lanterne en bois à Saint-Ay, globe blanc au collège,
    # lanterne bleue au Prytanée, lanterne HGSS à Bordeaux ; Montépilloy n'en a pas (puits et meules de foin).
    'lanterne-bois': ('g4-clotures', 9, 76, 1, 2, 1),
    'globe': ('g4-mobilier', 0, 257, 2, 3, 2),
    'lanterne-bleue': ('g4-mobilier', 2, 257, 2, 4, 3),
    'lanterne-hgss': ('g4-mobilier', 6, 241, 2, 3, 2),
    'banc': ('g4-mobilier', 2, 277, 2, 2, 1),
    'jardiniere-rouge': ('g4-mobilier', 2, 279, 2, 1, 0),
    'jardiniere-orange': ('g4-mobilier', 4, 279, 2, 1, 0),
    'jardiniere-rose': ('g4-mobilier', 6, 279, 2, 1, 0),
    'bois': ('g4-mobilier', 1, 117, 2, 2, 1),          # tas de bois (seul : le bout de barbecue voisin est retiré)
    'rocher': ('dppt', 7, 146, 1, 1, 0),
}

# ---------- Plans, carte par carte ----------
# paths : cases d'herbe libres qui deviennent chemin ; force_path : chemin sous des cases bloquantes (boîtes aux lettres) ;
# flowers : massifs (f blanches, ƒ roses, o orange DPPt) ; lilies / rocks : sur l'eau ; objects : (planche, col,
# rangée, largeur, hauteur, x, y) sur des cases bloquantes (eau) ; clear : cases du calque Décor à vider (débris).
PLANS = {
    'saint-ay': {
        'force_path': [(16, 6), (16, 12)],                  # sable sous les boîtes aux lettres des chaumières
        'flowers': {
            'ƒ': [(22, 4), (22, 5), (22, 10), (22, 11), (23, 17), (23, 18)],   # le long des maisons
            'o': [(24, 14), (25, 14), (25, 15), (26, 15), (8, 21), (9, 21), (9, 22)],
            'f': [(24, 21), (26, 22), (25, 23), (22, 23)],
        },
        'lilies': [(1, 12), (4, 13), (7, 12), (2, 14), (6, 14), (3, 15)],
        'rocks': [(8, 13)],
        'furniture': [('lanterne-bois', 13, 8), ('lanterne-bois', 16, 14),
                      ('banc', 10, 14), ('banc', 23, 20), ('bois', 20, 11)],
    },
    'route-de-montepilloy': {
        'flowers': {                                         # bas-côtés fleuris, par touffes
            'ƒ': [(9, 5), (9, 6), (12, 9), (12, 10), (9, 17), (9, 18), (12, 22), (12, 23)],
            'f': [(12, 4), (9, 12), (9, 13), (12, 17), (12, 19), (9, 25)],
            'o': [(9, 9), (12, 13)],
        },
        'furniture': [('rocher', 9, 15), ('rocher', 12, 24)],
    },
    'montepilloy': {
        'force_path': [(7, 6), (22, 6)],                    # sable sous les boîtes aux lettres
        'flowers': {
            'ƒ': [(18, 21), (20, 21), (22, 21)],              # au bord de la mare
            'o': [(25, 3), (26, 3), (25, 4), (27, 4), (26, 8), (27, 8)],          # (le puits : identites.py)
            'f': [(2, 7), (28, 13), (29, 14)],
        },
        'lilies': [(20, 18), (22, 19), (19, 20)],
        'furniture': [('banc', 24, 17), ('jardiniere-rouge', 5, 6), ('jardiniere-rose', 26, 5)],
    },
    'bonsecours': {
        'flowers': {
            'ƒ': [(13, 9), (14, 9), (13, 10), (14, 10)],      # massif de la cour, près du panneau
            'o': [(2, 9), (3, 13), (2, 22), (20, 9), (21, 14), (20, 18)],
            'f': [(14, 22), (15, 22), (16, 23), (6, 22), (7, 22)],
        },
        'furniture': [('banc', 14, 7), ('globe', 9, 17), ('globe', 12, 20)],
    },
    'prytanee': {
        'flowers': {                                         # parterres symétriques des quatre pelouses
            'ƒ': [(10, 13), (11, 13), (10, 14), (11, 14), (23, 13), (24, 13), (23, 14), (24, 14),
                  (10, 18), (11, 18), (10, 19), (11, 19), (23, 18), (24, 18), (23, 19), (24, 19)],
            'o': [(12, 12), (13, 12), (21, 12), (22, 12), (12, 20), (13, 20), (21, 20), (22, 20)],
        },
        'furniture': [('lanterne-bleue', 14, 9), ('lanterne-bleue', 20, 9), ('lanterne-bleue', 14, 17),
                      ('lanterne-bleue', 20, 17),
                      ('jardiniere-rouge', 3, 13), ('jardiniere-rouge', 31, 13)],
    },
    'bordeaux': {
        'flowers': {
            'ƒ': [(1, 10), (4, 10), (12, 10), (17, 10), (20, 10), (28, 10)],
            'o': [(1, 16), (10, 16), (14, 16), (18, 16), (26, 16), (30, 16)],
        },
        # Péniches sur la Garonne (bateaux longs de terriblejared).
        'objects': [('g4-vehicules', 0, 30, 6, 3, 12, 12), ('g4-vehicules', 6, 34, 5, 2, 26, 13)],
        'furniture': [('lanterne-hgss', 4, 8), ('lanterne-hgss', 16, 8), ('lanterne-hgss', 28, 8), ('banc', 11, 9),
                      ('banc', 19, 9), ('lanterne-hgss', 10, 14), ('lanterne-hgss', 26, 14)],
    },
    'hull': {
        'flowers': {
            'ƒ': [(12, 37), (19, 37), (12, 39), (19, 39), (12, 40), (19, 40)],
            'o': [(15, 37), (16, 37)],
        },
        'lilies': [(13, 3), (16, 3)],                       # bassin du parc
        'rocks': [(25, 45), (28, 47)],                     # (le cargo des docks occupe l'ouest : identites.py)
        'furniture': [('banc', 15, 37)],
    },
}


def rect(x0, y0, x1, y1):
    """Cases d'un rectangle, bornes incluses."""
    return [(x, y) for y in range(y0, y1 + 1) for x in range(x0, x1 + 1)]


def load(map_id):
    raw = subprocess.check_output(['git', 'show', f'{TAG}:src/data/builtMaps/{map_id}.json'], cwd=ROOT)
    return json.loads(raw)


PATH_BLOCK = {(c, r) for c in range(3) for r in range(5)}      # bloc du chemin DPPt (bords, centre, angles)
GRASS_TILES = {GRASS[1:], *(t[1:] for t in GRASS_BITS)}


def classify(bd, m):
    """Sol de chaque case : 'grass', 'path', 'tall' (hautes herbes), 'water' ou 'other' (pavés, bitume, blé…), d'après
    la case posée (planche DPPt, ou clé d'assemblage de auto.json) ; l'eau d'après sa couleur."""
    W, H = m['width'], m['height']
    keys = json.loads((ROOT / 'public' / 'assets' / 'v2' / 'auto.json').read_text())

    def kind_of(sheet, k):
        if sheet == 'auto':
            key = keys[k] or ''
            if key.startswith("('quads', 'dppt'"):
                quads = eval(key)[2]
                return 'path' if all(q in PATH_BLOCK for q in quads) else None
            if key.startswith("('quads', 'autotiles-g4'"):
                return 'tall'
            return None
        c = bd.cols[sheet]
        at = (k % c, k // c)
        if sheet == 'dppt' and at in PATH_BLOCK:
            return 'path'
        if sheet == 'dppt' and at in GRASS_TILES:
            return 'grass'
        if sheet == 'autotiles-g4' and at[0] < 3 and at[1] < 4:
            return 'tall'
        return None

    def img(x, y):
        out = Image.new('RGBA', (TILE, TILE))
        cell = m['layers']['sol'][y * W + x]
        for r in (cell if isinstance(cell, list) else [cell]):
            if r != -1:
                sheet, k = m['sheets'][r // STRIDE], r % STRIDE
                out.alpha_composite(bd.auto_tiles[k] if sheet == 'auto'
                                    else bd.tile_image(sheet, k % bd.cols[sheet], k // bd.cols[sheet]))
        return np.array(out)[..., :3].reshape(-1, 3).astype(int)

    kinds = []
    for y in range(H):
        row = []
        for x in range(W):
            cell = m['layers']['sol'][y * W + x]
            refs = [r for r in (cell if isinstance(cell, list) else [cell]) if r != -1]
            kind = kind_of(m['sheets'][refs[-1] // STRIDE], refs[-1] % STRIDE) if len(refs) == 1 else None
            if kind is None:
                r, g, b = img(x, y).mean(0)
                kind = 'water' if b > r + 60 and b > g + 10 else 'other'
            row.append(kind)
        kinds.append(row)
    return kinds


def game_points(map_id):
    data = json.loads(subprocess.check_output(['node', str(ROOT / 'scripts' / 'export_audit.mjs')], cwd=ROOT))
    g = data[GAME_ID[map_id]]
    pts = set()
    for p in g['pts']:
        w, h = p.get('w') or 1, p.get('h') or 1
        pts |= {(p['x'] + i, p['y'] + j) for i in range(w) for j in range(h)}
        if p['k'] == 'door':
            pts.add((p['x'], p['y'] + 1))
    return g, pts


def plan(map_id):
    bd = Builder(load_catalog())
    m = load(map_id)
    W, H = m['width'], m['height']
    kinds = classify(bd, m)
    g, pts = game_points(map_id)
    char = {'grass': '.', 'path': ':', 'tall': '"', 'water': '~', 'other': '_'}
    print('    ' + ''.join(str(x % 10) for x in range(W)))
    for y in range(H):
        row = ''
        for x in range(W):
            c = char[kinds[y][x]]
            if m['solid'][y * W + x]:
                c = '#' if c != '~' else '≈'
            if (x, y) in pts:
                c = '@'
            row += c
        print(f'{y:3} {row}  {g["source"][y]}')
    # Décor sur des cases libres (hors fleurs) : des débris de retouches s'y cachent.
    from collections import defaultdict
    loose = defaultdict(list)
    for i, cell in enumerate(m['layers']['decor']):
        if m['solid'][i]:
            continue
        for r in (cell if isinstance(cell, list) else [cell]):
            if r != -1 and m['sheets'][r // STRIDE] != 'autotiles-g4':
                loose[(m['sheets'][r // STRIDE], r % STRIDE)].append((i % W, i // W))
    for k, cells in sorted(loose.items(), key=lambda kv: len(kv[1])):
        if len(cells) <= 2:
            print('  décor libre', k, cells)


def neighbors8(x, y):
    return [(x + dx, y + dy) for dy in (-1, 0, 1) for dx in (-1, 0, 1) if dx or dy]


STORY_POINTS = None          # cases de l'histoire par carte (scripts/export_story_points.mjs), lues une fois


def check_access(map_id, W, H, solid0, new_solid, protected, points):
    """Le mobilier ne bloque rien : aucune case protégée (chemins, hautes herbes, PNJ, objets, portes et cases devant,
    déclencheurs, cases des scénettes et des rondes, arrivées) n'est prise ; toute case libre qu'on atteignait depuis
    le départ ou un point de l'histoire s'atteint encore ; chaque point atteignable le reste (sa case, ou une voisine)."""
    taken = new_solid & protected
    assert not taken, f'{map_id} : mobilier sur une case protégée : {sorted(taken)}'
    solid1 = list(solid0)
    for x, y in new_solid:
        solid1[y * W + x] = 1

    def reach(solid):
        starts = [(x, y) for x, y in points if 0 <= x < W and 0 <= y < H and not solid[y * W + x]]
        seen, todo = set(starts), list(starts)
        while todo:
            cx, cy = todo.pop()
            for n in ((cx + 1, cy), (cx - 1, cy), (cx, cy + 1), (cx, cy - 1)):
                if 0 <= n[0] < W and 0 <= n[1] < H and n not in seen and not solid[n[1] * W + n[0]]:
                    seen.add(n)
                    todo.append(n)
        return seen

    before, after = reach(solid0), reach(solid1)
    lost = before - after - new_solid
    assert not lost, f'{map_id} : cases devenues inaccessibles : {sorted(lost)}'
    for x, y in points:
        near = [(x, y), (x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1)]
        assert not any(c in before for c in near) or any(c in after for c in near), \
            f'{map_id} : point {(x, y)} devenu inaccessible'


def enrich(bd, map_id):
    """Applique le plan de la carte ; renvoie la carte et un résumé. Les collisions et le départ ne changent pas."""
    plan_ = PLANS[map_id]
    m = load(map_id)
    W, H = m['width'], m['height']
    solid0, spawn0 = list(m['solid']), dict(m['spawn'])
    kinds = classify(bd, m)
    _, pts = game_points(map_id)
    story = {tuple(c) for c in STORY_POINTS[GAME_ID[map_id]]}
    solid = lambda x, y: bool(solid0[y * W + x])
    # Emprise du mobilier (toutes ses rangées) : pas de fleurs dessous.
    furniture_cells = {(x + i, y + j) for name, x, y in plan_.get('furniture', [])
                       for j in range(FURNITURE[name][4]) for i in range(FURNITURE[name][3])}
    decor_empty = lambda x, y: all(r == -1 for r in (lambda c: c if isinstance(c, list) else [c])(
        m['layers']['decor'][y * W + x]))
    done = {'chemin': 0, 'fleurs': 0, 'touffes': 0, 'eau': 0, 'objets': 0, 'vidées': 0}

    def ref(sheet, index):
        if sheet not in m['sheets']:
            m['sheets'].append(sheet)
        return m['sheets'].index(sheet) * STRIDE + index

    def tile_ref(t):
        return ref(t[0], bd.index(*t))

    # Chemins : nouvelles cases, puis bords refaits sur elles et leurs voisines de chemin.
    new = set()
    for x, y in plan_.get('paths', []):
        assert not solid(x, y) and kinds[y][x] == 'grass' and (x, y) not in pts, f'{map_id} : chemin en {(x, y)}'
        new.add((x, y))
    for x, y in plan_.get('force_path', []):
        new.add((x, y))
    for x, y in new:
        kinds[y][x] = 'path'
    redraw = new | {n for c in new for n in neighbors8(*c)
                    if 0 <= n[0] < W and 0 <= n[1] < H and kinds[n[1]][n[0]] == 'path'}
    spec = TERRAINS['path']
    for x, y in redraw:
        other = lambda dx, dy: 0 <= x + dx < W and 0 <= y + dy < H and kinds[y + dy][x + dx] != 'path'
        quads = []
        ox, oy = spec['outer']
        for q in range(4):
            qx, qy = q % 2, q // 2
            dx, dy = (1 if qx else -1), (1 if qy else -1)
            v, h, d = other(0, dy), other(dx, 0), other(dx, dy)
            quads.append((ox + 2 * qx, oy + 2 * qy) if v and h else (ox + 1, oy + 2 * qy) if v
                         else (ox + 2 * qx, oy + 1) if h else spec['inner'][q] if d else spec['center'])
        m['layers']['sol'][y * W + x] = (tile_ref(('dppt', *spec['center'])) if all(q == spec['center'] for q in quads)
                                         else ref('auto', bd.quad_tile('dppt', tuple(quads))))
        done['chemin'] += 1

    # Fleurs (calque Sol, sur l'herbe libre et sans décor).
    grass_img = bd.tile_image(*GRASS)
    for code, cells in plan_.get('flowers', {}).items():
        for x, y in cells:
            assert not solid(x, y) and (x, y) not in pts, f'{map_id} : fleurs sur {(x, y)}'
            if kinds[y][x] != 'grass' or not decor_empty(x, y) or (x, y) in furniture_cells:
                print(f'  {map_id} : fleurs en {(x, y)} ignorées (sol {kinds[y][x]})')
                continue
            img = grass_img.copy()
            img.alpha_composite(bd.tile_image(*FLOWERS[code]))
            m['layers']['sol'][y * W + x] = ref('auto', bd.image_tile(img))
            kinds[y][x] = 'flowers'
            done['fleurs'] += 1

    # Touffes d'herbe rase sur les grandes pelouses unies (1 case sur 20, tirage fixe).
    rnd = random.Random(map_id)
    plain = ref('dppt', bd.index(*GRASS))
    for y in range(1, H - 1):
        for x in range(1, W - 1):
            if (m['layers']['sol'][y * W + x] == plain and not solid(x, y) and decor_empty(x, y) and (x, y) not in pts
                    and all(kinds[ny][nx] == 'grass' for nx, ny in neighbors8(x, y)) and rnd.random() < 0.05):
                m['layers']['sol'][y * W + x] = tile_ref(rnd.choice(GRASS_BITS))
                done['touffes'] += 1

    # Sur l'eau (toujours bloquante) : nénuphars, rochers ; objets sur des cases bloquantes.
    def put_decor(x, y, img):
        cell = m['layers']['decor'][y * W + x]
        stack = [r for r in (cell if isinstance(cell, list) else [cell]) if r != -1]
        m['layers']['decor'][y * W + x] = stack + [ref('auto', bd.image_tile(img))] if stack else ref('auto', bd.image_tile(img))

    for i, (x, y) in enumerate(plan_.get('lilies', [])):
        assert solid(x, y) and kinds[y][x] == 'water', f'{map_id} : nénuphar hors de l\'eau en {(x, y)}'
        put_decor(x, y, bd.tile_image(*LILY[i % len(LILY)]))
        done['eau'] += 1
    for x, y in plan_.get('rocks', []):
        assert solid(x, y) and kinds[y][x] == 'water', f'{map_id} : rocher hors de l\'eau en {(x, y)}'
        put_decor(x, y, bd.tile_image(*ROCK_IN_WATER))
        done['eau'] += 1
    for sheet, c0, r0, w, h, ax, ay in plan_.get('objects', []):
        for j in range(h):
            for i in range(w):
                img = bd.tile_image(sheet, c0 + i, r0 + j)
                if img.getbbox():
                    assert solid(ax + i, ay + j), f'{map_id} : objet sur une case libre {(ax + i, ay + j)}'
                    put_decor(ax + i, ay + j, img)
        done['objets'] += 1
    # Mobilier : cases bloquantes nouvelles, vérifiées ensuite (check_access).
    new_solid = set()
    for name, ax, ay in plan_.get('furniture', []):
        sheet, c0, r0, w, h, solid_from = FURNITURE[name]
        full = bd.images[sheet].crop((c0 * TILE, r0 * TILE, (c0 + w) * TILE, (r0 + h) * TILE))
        if name == 'bois':
            arr = np.array(full)
            labels, _ = ndimage.label(arr[..., 3] > 0)
            arr[labels != np.bincount(labels.ravel())[1:].argmax() + 1] = 0
            full = Image.fromarray(arr)
        for j in range(h):
            for i in range(w):
                img = full.crop((i * TILE, j * TILE, (i + 1) * TILE, (j + 1) * TILE))
                if not img.getbbox():
                    continue
                x, y = ax + i, ay + j
                if j >= solid_from:
                    put_decor(x, y, img)
                    # Bloquante si la case est vraiment pleine (une ombre portée, semi-transparente, ne bloque pas).
                    if not solid(x, y) and (np.array(img)[..., 3] > 200).sum() >= 12:
                        new_solid.add((x, y))
                else:
                    cell = m['layers']['dessus'][y * W + x]
                    stack = [r for r in (cell if isinstance(cell, list) else [cell]) if r != -1]
                    m['layers']['dessus'][y * W + x] = stack + [ref('auto', bd.image_tile(img))]
        done['mobilier'] = done.get('mobilier', 0) + 1
    protected = pts | story | {(x, y) for y in range(H) for x in range(W) if kinds[y][x] in ('path', 'tall')}
    check_access(map_id, W, H, solid0, new_solid, protected, pts | story)
    for x, y in new_solid:
        m['solid'][y * W + x] = 1

    for x, y in plan_.get('clear', []):
        m['layers']['decor'][y * W + x] = -1
        done['vidées'] += 1

    changed = {(i % W, i // W) for i in range(W * H) if m['solid'][i] != solid0[i]}
    assert changed == new_solid and m['spawn'] == spawn0, f'{map_id} : collisions ou départ changés'
    return m, done


def main():
    args = sys.argv[1:]
    if args and args[0] == '--plan':
        for map_id in args[1:]:
            print(f'== {map_id}')
            plan(map_id)
        return
    global STORY_POINTS
    STORY_POINTS = json.loads(subprocess.check_output(['node', str(ROOT / 'scripts' / 'export_story_points.mjs')], cwd=ROOT))
    bd = Builder(load_catalog())
    results = {map_id: enrich(bd, map_id) for map_id in (args or PLANS)}
    bd.save_auto_sheet()
    for map_id, (m, done) in results.items():
        if not done.get('mobilier'):
            done.pop('mobilier', None)
        (ROOT / 'src' / 'data' / 'builtMaps' / f'{map_id}.json').write_text(json.dumps(m, ensure_ascii=False) + '\n')
        print(f'{map_id:22} ' + ', '.join(f'{k} {v}' for k, v in done.items() if v)
              + ' ; collisions ajoutées seulement par le mobilier, tout reste accessible')


if __name__ == '__main__':
    main()
