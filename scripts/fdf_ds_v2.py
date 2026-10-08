#!/usr/bin/env python3
"""Fort-de-France, refonte DS (octobre 2026) : refait le dessin de src/data/builtMaps/fort-de-france.json.

Part de la carte retouchée dans le créateur (tag git avant-refonte-fdf). Garde le départ, les portes, les places des
PNJ et des événements, le ponton, la maison, la cabane, le ferry et les grands arbres. Change le reste, avec les
planches Gen 4 seulement :
- côte et plage arrondies (ISLAND, SHORE : super-ellipses) ; ce qui tombe à l'eau disparaît (palmier du coin) ;
- sols (fleurs, grandes fleurs tropicales et coquillages compris : ils se traversent) : herbe DPPt nuancée, plage,
  chemins de sable DPPt vers la maison, la cabane et le mémorial, parvis jusqu'aux murs, raccord direct avec le ponton,
  clairière de sable clair au mémorial, hautes herbes posées exactement sur les cases 'ĥ' du jeu ;
- objets sur des cases déjà bloquantes : mémorial (statue en pierre blanche), drapeau de la Martinique entre deux pots,
  arbustes, buisson ; en mer : barque contre le ponton, deux voiliers ;
- mobilier qui ajoute des collisions (FURNITURE) : lampadaires, bancs, parasol, clôture, tas de bois.

Les cases assemblées vont dans la planche partagée auto.png (numéros existants gardés, voir convert_maps_v2.Builder).
Vérifie à la fin (check_access) que rien d'important n'est devenu inaccessible.

Usage : python3 scripts/fdf_ds_v2.py   (puis python3 scripts/audit_maps.py et node scripts/check_paths.js)
À lancer sur la carte d'avant la refonte : git checkout avant-refonte-fdf -- src/data/builtMaps/fort-de-france.json
public/assets/v2/auto.png public/assets/v2/auto.json (les retouches faites depuis dans le créateur seraient perdues).
"""
import json
import random
import subprocess
from collections import Counter
from pathlib import Path

import numpy as np
from PIL import Image
from scipy import ndimage

from convert_maps_v2 import Builder, load_catalog, ROOT, V2, TILE
from ds_theme import TERRAINS, GRASS, GRASS_BITS, SEA_TO_DPPT

MAP = ROOT / 'src' / 'data' / 'builtMaps' / 'fort-de-france.json'
STRIDE = 100000

# ---------- Contour de l'île (retours d'octobre 2026 : plus ronde) ----------
# Super-ellipses (centre, demi-axes en cases, exposant : 2 = ellipse, plus grand = plus carré). ISLAND : la côte (hors de
# la forme : la mer, bloquante) ; SHORE : le bord de l'herbe (entre les deux : la plage, de 2 à 3 cases). Le ponton garde
# ses cases.
ISLAND = (17.0, 13.5, 14.9, 12.6, 3.0)
SHORE = (17.0, 13.0, 12.4, 10.3, 3.0)


def inside(shape, x, y):
    cx, cy, a, b, p = shape
    return abs((x + 0.5 - cx) / a) ** p + abs((y + 0.5 - cy) / b) ** p <= 1


# Grandes fleurs tropicales à droite de l'allée : on les traverse (posées dans le calque Sol, plus bloquantes).
TALL_FLOWERS = [(19, 12), (20, 12), (19, 13), (20, 13), (19, 14), (20, 14)]
# Parvis : le sable du chemin va jusqu'aux murs, sous la jardinière et la boîte aux lettres (maison), sous la jardinière
# et le long de la façade (cabane), même sur ces cases bloquantes.
FORECOURT = [(13, 7), (14, 7), (16, 7), (17, 7), (13, 8), (14, 8), (17, 8),
             (24, 14), (25, 14), (27, 14), (28, 14), (27, 15), (28, 15)]

# ---------- Plan des sols (cases libres seulement ; l'eau et le ponton ne changent pas) ----------
# Allée principale de la maison au ponton (3 cases, centrée sur la porte), parvis devant la maison, branches vers la
# cabane de pêche (porte en 26, 14) et vers le mémorial (statues en 7-8, 14-15).
PATHS = (
    [(x, y) for y in range(9, 25) for x in (14, 15, 16)] + [(15, 7), (15, 8), (16, 8)]  # allée, du seuil au ponton
    + [(x, 9) for x in (13, 17)]                                                       # parvis
    + [(x, 15) for x in range(17, 27)] + [(x, 16) for x in range(17, 24)]              # vers la cabane
    + [(x, 9) for x in (14, 15, 16)]                                                    # parvis de la maison
    + [(x, y) for y in (15, 16) for x in range(10, 14)]                                # vers le mémorial
)
# Clairière de sable clair autour du mémorial (on s'y recueille ; la promeneuse s'y tient, en 9, 15).
CLEARING = [(x, y) for y in range(14, 17) for x in range(6, 10)] + [(7, 17), (8, 17)]
# Massifs de fleurs (sur l'herbe libre) : blanches 'f', roses 'ƒ', et les fleurs plates DPPt orange 'o'. Plantées
# comme dans une ville DS : bordures de l'allée, jardin de la maison, offrandes au mémorial, abords de la cabane,
# deux prés fleuris au nord ; pas de fleur isolée au milieu de l'herbe.
FLOWER_BEDS = {
    'ƒ': [(13, 11), (17, 11), (13, 18), (17, 18),                                               # bordures
          (18, 8), (21, 8), (21, 9), (22, 9),                                                    # jardin
          (5, 14), (5, 15),                                                                      # mémorial
          (28, 16), (29, 16), (25, 17), (26, 17)],                                               # cabane
    'f': [(13, 12), (17, 12), (13, 19), (17, 19),
          (8, 3), (9, 3), (10, 3), (9, 4), (22, 4), (23, 4), (24, 5), (23, 5),
          (10, 14), (10, 17), (6, 17), (9, 17)],
    'o': [(18, 9), (19, 9), (20, 9), (19, 10), (20, 10), (18, 10),
          (5, 9), (6, 9), (5, 10), (23, 12), (24, 12), (24, 13), (19, 17), (20, 17), (20, 18)],
}
FLAT_ORANGE = ('dppt', 3, 0)
FLOWERS = {'f': ('autotiles-g4', 0, 8), 'ƒ': ('autotiles-g4', 3, 4)}
# Coquillages, étoiles de mer et noix de coco sur la plage (cases de la planche « sols » : fond de sable retiré).
SHELLS = [('g4-sols', 0, 54), ('g4-sols', 1, 54), ('g4-sols', 2, 54), ('g4-sols', 2, 55)]
SHELL_SPOTS = [(6, 1), (25, 1), (3, 10), (31, 12), (4, 21), (9, 24), (21, 25), (29, 23), (3, 18)]

# ---------- Objets (posés sur des cases déjà bloquantes) ----------
# (planche, colonne, rangée, largeur, hauteur) de l'élément ; (x, y) de sa case en haut à gauche ; rangées du haut au-dessus
# de Pierre (sur des cases libres) jusqu'à `solid_from` (relatif).
OBJECTS = [
    # Mémorial de l'Anse Caffard : la statue sur socle de la planche « mobilier », en pierre blanche.
    {'el': ('g4-mobilier', 12, 80, 2, 2), 'at': (7, 14), 'solid_from': 0, 'tint': 'pierre'},
    # Drapeau de la Martinique (mât à oriflamme recoloré), planté entre deux pots de buis, à droite de la maison.
    {'el': ('g4-mobilier', 10, 249, 2, 5), 'at': (19, 3), 'solid_from': 4, 'tint': 'martinique'},
    {'el': ('g4-mobilier', 9, 249, 1, 2), 'at': (19, 6), 'solid_from': 1},
    {'el': ('g4-mobilier', 9, 249, 1, 2), 'at': (20, 6), 'solid_from': 1},
    # Plantes à baies ('ƨ') et buisson rond ('ƀ').
    {'el': ('g4-herbes', 4, 79, 1, 2), 'at': (12, 8), 'solid_from': 1},
    {'el': ('g4-herbes', 4, 79, 1, 2), 'at': (24, 8), 'solid_from': 1},
    {'el': ('g4-herbes', 4, 79, 1, 2), 'at': (27, 16), 'solid_from': 1},
    {'el': ('g4-herbes', 4, 71, 1, 1), 'at': (24, 16), 'solid_from': 0},
    # En mer : la barque du pêcheur contre le ponton, deux voiliers au large.
    {'el': ('g4-vehicules', 6, 11, 4, 2), 'at': (9, 28), 'solid_from': 0},
    {'el': ('g4-vehicules', 0, 59, 3, 2), 'at': (3, 28), 'solid_from': 0},
    {'el': ('g4-vehicules', 0, 62, 3, 2), 'at': (28, 29), 'solid_from': 0},
]
# Mobilier qui ajoute des collisions (octobre 2026, deuxième passe) : rangées `solid_from` incluses -> cases bloquantes
# nouvelles. Jamais sur un chemin, une porte, un PNJ, un objet ou un événement : main() vérifie que tout reste
# accessible depuis le point d'arrivée (voir check_access).
FURNITURE = [
    # Lampadaires DPPt aux deux carrefours de l'allée (tête au-dessus de Pierre).
    *[{'el': ('dppt', 7, 129, 1, 3), 'at': (x, y), 'solid_from': 2} for x in (13, 17) for y in (12, 19)],
    # Banc le long du chemin du mémorial, banc face à la mer sur la plage ouest.
    {'el': ('g4-mobilier', 2, 277, 2, 2), 'at': (11, 13), 'solid_from': 1},
    {'el': ('g4-mobilier', 2, 277, 2, 2), 'at': (3, 19), 'solid_from': 1},
    # Parasol et banc blanc sur la plage, à droite du ponton (l'ombre portée tombe dans l'eau : coupée).
    {'el': ('g4-mobilier', 6, 157, 4, 4), 'at': (21, 22), 'solid_from': 3},
    # Clôture blanche DPPt devant le jardin fleuri de la maison.
    *[{'el': ('dppt', 1, 128, 1, 1), 'at': (x, 11), 'solid_from': 0} for x in range(18, 22)],
    # Tas de bois contre la cabane de pêche (`isolate` : seul le tas, sans le bout de barbecue voisin sur la planche).
    {'el': ('g4-mobilier', 1, 117, 2, 2), 'at': (22, 13), 'solid_from': 1, 'isolate': True},
]
# Ce que les nouveaux objets remplacent : l'éolienne et son buisson flottant, la souche du mémorial, les fleurs
# bloquantes (cases du calque Décor / Au-dessus de Pierre vidées).
CLEAR = {
    'decor': [(19, 7), (20, 7), (7, 14), (8, 14), (7, 15), (8, 15), (12, 9), (24, 9), (27, 17), (24, 16),
              # Débris d'un arbre rond effacé lors de retouches (feuille sombre, points d'ombre) : derrière les bûches,
              # près du palmier de gauche.
              (22, 13), (8, 11), (5, 11)],
    'dessus': [(19, 4), (20, 4), (19, 5), (20, 5), (19, 6), (20, 6), (20, 3), (21, 3), (21, 4), (7, 13), (8, 13)],
}
# Petites fleurs et touffes des retouches précédentes (calque Décor) : remplacées par les massifs ci-dessus.
OLD_SPRINKLES = {'autotiles-g4'}


def tint_stone(img):
    """Pierre blanche : chaque pixel prend une nuance de blanc cassé selon sa clarté (contours gardés sombres)."""
    a = np.array(img).astype(float)
    lum = a[..., :3] @ [0.3, 0.59, 0.11]
    t = np.clip((lum - 40) / 150, 0, 1)
    light, dark = np.array([248, 244, 232]), np.array([120, 116, 112])
    rgb = dark + (light - dark) * t[..., None]
    rgb[lum < 45] = a[..., :3][lum < 45]
    a[..., :3] = rgb
    return Image.fromarray(a.astype(np.uint8))


def tint_martinique(img, x0, y0, box):
    """Oriflamme bleue -> drapeau de la Martinique : triangle rouge côté mât, vert en haut, noir en bas. `box` : le
    rectangle de l'oriflamme en pixels de l'élément entier, (x0, y0) : position de cette case dans l'élément."""
    a = np.array(img).astype(int)
    bx0, by0, bx1, by1 = box
    for y in range(TILE):
        for x in range(TILE):
            r, g, b, al = a[y, x]
            if not al or not (b > r + 30 and b > g):           # seulement le bleu de l'oriflamme
                continue
            X, Y = x0 + x, y0 + y
            u, v = (X - bx0) / max(1, bx1 - bx0), (Y - by0) / max(1, by1 - by0)
            shade = (r + g + b) / 3 / 140
            if u < 0.5 * (1 - abs(v - 0.5) * 2) + 0.05:
                base = (206, 32, 40)
            elif v < 0.5:
                base = (40, 150, 64)
            else:
                base = (36, 36, 40)
            a[y, x, :3] = [min(255, int(c * (0.75 + 0.35 * shade))) for c in base]
    return Image.fromarray(a.astype(np.uint8))


def cut_background(img):
    """Case de décor sur fond uni (sable) : la couleur la plus présente devient transparente."""
    a = np.array(img)
    px = [tuple(p) for p in a[..., :3].reshape(-1, 3)]
    bg = Counter(px).most_common(1)[0][0]
    near = (np.abs(a[..., :3].astype(int) - bg).sum(-1) < 24)
    a[near, 3] = 0
    return Image.fromarray(a)


def check_access(W, H, solid0, solid1, spawn, points, new_solid, protected, sea=frozenset()):
    """Le mobilier ne bloque rien : aucune case protégée n'est prise, toutes les cases libres qu'on atteignait depuis le
    point d'arrivée s'atteignent encore (sauf celles que la nouvelle côte a rendues à la mer, `sea`), et chaque PNJ,
    objet, porte ou déclencheur reste atteignable (sa case, ou une case voisine s'il est sur une case bloquante)."""
    taken = new_solid & protected
    assert not taken, f'mobilier sur une case protégée : {sorted(taken)}'

    def reach(solid):
        seen, todo = {(spawn['x'], spawn['y'])}, [(spawn['x'], spawn['y'])]
        while todo:
            cx, cy = todo.pop()
            for n in ((cx + 1, cy), (cx - 1, cy), (cx, cy + 1), (cx, cy - 1)):
                if 0 <= n[0] < W and 0 <= n[1] < H and n not in seen and not solid[n[1] * W + n[0]]:
                    seen.add(n)
                    todo.append(n)
        return seen

    before, after = reach(solid0), reach(solid1)
    lost = before - after - new_solid - sea
    assert not lost, f'cases devenues inaccessibles : {sorted(lost)}'
    for x, y, kind in points:
        near = [(x, y)] + [(x + dx, y + dy) for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1))]
        was = any(c in before for c in near)
        assert not was or any(c in after for c in near), f'{kind} en {(x, y)} devenu inaccessible'


def main():
    m = json.loads(MAP.read_text())
    W, H = m['width'], m['height']
    solid0, spawn0 = list(m['solid']), dict(m['spawn'])
    bd = Builder(load_catalog())
    exported = json.loads(subprocess.check_output(['node', str(ROOT / 'scripts' / 'export_audit.mjs')], cwd=ROOT))
    source = exported['fortDeFrance']['source']
    # Cases à garder accessibles : PNJ, objets, portes (et la case devant), déclencheurs. Cases interdites au mobilier :
    # celles-là, les chemins, la clairière du mémorial, les hautes herbes.
    points = [(p['x'], p['y'], p['k']) for p in exported['fortDeFrance']['pts']]
    points += [(p['x'], p['y'] + 1, 'devant une porte') for p in exported['fortDeFrance']['pts'] if p['k'] == 'door']
    protected = ({(x, y) for x, y, _ in points} | set(PATHS) | set(CLEARING)
                 | {(x, y) for y, row in enumerate(source) for x, c in enumerate(row) if c == 'ĥ'})
    solid = lambda x, y: bool(solid0[y * W + x])

    def tile_img(sheet, ref):
        c = bd.cols[sheet]
        if sheet == 'auto':
            return bd.auto_tiles[ref]
        return bd.images[sheet].crop(((ref % c) * TILE, (ref // c) * TILE, (ref % c + 1) * TILE, (ref // c + 1) * TILE))

    def cell_img(layer, x, y):
        out = Image.new('RGBA', (TILE, TILE))
        cell = m['layers'][layer][y * W + x]
        for ref in (cell if isinstance(cell, list) else [cell]):
            if ref != -1:
                out.alpha_composite(tile_img(m['sheets'][ref // STRIDE], ref % STRIDE))
        return out

    # Ponton : ses cases gardent leur dessin. Ailleurs : mer, plage ou herbe d'après le contour de l'île.
    def is_pier(x, y):
        cell = m['layers']['sol'][y * W + x]
        top = cell[-1] if isinstance(cell, list) else cell
        return top != -1 and m['sheets'][top // STRIDE] == 'g4-mobilier'

    def was_water(x, y):
        r, g, b = np.array(cell_img('sol', x, y))[..., :3].reshape(-1, 3).mean(0)
        return b > r + 30 and b > g

    old_water = {(x, y) for y in range(H) for x in range(W) if not is_pier(x, y) and was_water(x, y)}
    ground = [['pier' if is_pier(x, y) else 'grass' if inside(SHORE, x, y) else 'beach' if inside(ISLAND, x, y)
               else 'water' for x in range(W)] for y in range(H)]
    keep = {(x, y) for y in range(H) for x in range(W) if ground[y][x] == 'pier'}
    sea = {(x, y) for y in range(H) for x in range(W) if ground[y][x] == 'water'}
    for x, y in sea:
        assert (x, y) not in protected or (x, y) in old_water, f'la côte avale un point important : {(x, y)}'
    # Collisions de base : la mer ; sur terre, celles d'avant (objets), sauf les fleurs hautes, désormais traversables.
    base = [1 if (x, y) in sea else 0 if (x, y) in old_water or (x, y) in TALL_FLOWERS else solid0[y * W + x]
            for y in range(H) for x in range(W)]
    solid = lambda x, y: bool(base[y * W + x])
    for x, y in PATHS:
        if not solid(x, y):
            ground[y][x] = 'path'
    for x, y in FORECOURT:
        ground[y][x] = 'path'
    for x, y in CLEARING:
        if not solid(x, y) or (x, y) in ((7, 14), (8, 14), (7, 15), (8, 15)):
            ground[y][x] = 'beach'
    for y in range(H):
        for x in range(W):
            if source[y][x] == 'ĥ' and not solid(x, y):
                ground[y][x] = 'tall'

    # ---------- Calques ----------
    stacks = {name: {} for name in ('sol', 'decor', 'dessus')}
    flowers = {}                                     # fleurs hautes : leurs cases, posées sur le sol plus bas
    for name in ('decor', 'dessus'):
        cleared = set(CLEAR.get(name, []))
        for y in range(H):
            for x in range(W):
                if (x, y) in cleared:
                    continue
                cell = m['layers'][name][y * W + x]
                refs = [r for r in (cell if isinstance(cell, list) else [cell]) if r != -1]
                # Ce que la nouvelle côte met à l'eau (palmier du coin, rochers de la plage) disparaît avec son ombre.
                if (x, y) in sea and ((x, y) not in old_water or name == 'dessus'):
                    continue
                if (x, y) in sea:                    # en mer : bateaux et rochers restent, pas un bout de feuillage
                    refs = [r for r in refs if m['sheets'][r // STRIDE] != 'g4-arbres']
                if (x, y) in TALL_FLOWERS:
                    flowers.setdefault((x, y), []).extend(refs)
                    continue
                if name == 'decor' and not solid(x, y):
                    refs = [r for r in refs if m['sheets'][r // STRIDE] not in OLD_SPRINKLES]
                for r in refs:
                    stacks[name].setdefault((x, y), []).append(('ref', m['sheets'][r // STRIDE], r % STRIDE))

    rnd = random.Random(1830)        # l'année du naufrage de l'Anse Caffard : un tirage fixe, la carte ne bouge pas
    same_of = {'beach': {'beach', 'water', 'pier', 'path'}, 'path': {'path', 'beach', 'pier'}, 'tall': {'tall'},
               'water': {'water', 'pier'}}
    for y in range(H):
        for x in range(W):
            if (x, y) in keep:
                cell = m['layers']['sol'][y * W + x]
                for r in (cell if isinstance(cell, list) else [cell]):
                    if r != -1:
                        stacks['sol'].setdefault((x, y), []).append(('ref', m['sheets'][r // STRIDE], r % STRIDE))
                continue
            g = ground[y][x]
            if g == 'grass':
                lone = all(ground[y + dy][x + dx] == 'grass' for dx in (-1, 0, 1) for dy in (-1, 0, 1)
                           if 0 <= x + dx < W and 0 <= y + dy < H)
                tile = rnd.choice(GRASS_BITS) if lone and not solid(x, y) and rnd.random() < 0.09 else GRASS
                stacks['sol'][(x, y)] = [('tile', *tile)]
                continue
            spec = TERRAINS[g]
            sheet = spec.get('sheet', 'dppt')
            same = same_of[g]
            other = lambda dx, dy: 0 <= x + dx < W and 0 <= y + dy < H and ground[y + dy][x + dx] not in same
            quads = []
            ox, oy = spec['outer']
            for q in range(4):
                qx, qy = q % 2, q // 2
                dx, dy = (1 if qx else -1), (1 if qy else -1)
                v, h, d = other(0, dy), other(dx, 0), other(dx, dy)
                quads.append((ox + 2 * qx, oy + 2 * qy) if v and h else (ox + 1, oy + 2 * qy) if v
                             else (ox + 2 * qx, oy + 1) if h else spec['inner'][q] if d else spec['center'])
            if all(qd == spec['center'] for qd in quads) and g == 'water':
                info = bd.objects['mer']                # la mer DS de Dewitty, aux bleus de DPPt (voir ds_theme)
                tile = ('objets', info['col'] + x % 2, info['row'] + y % 2, 'sea')
                stacks['sol'][(x, y)] = [('auto', bd.composite((tile,), SEA_TO_DPPT))]
            elif all(qd == spec['center'] for qd in quads):
                stacks['sol'][(x, y)] = [('tile', sheet, *spec['center'])]
            else:
                stacks['sol'][(x, y)] = [('auto', bd.quad_tile(sheet, tuple(quads)))]

    # Fleurs, coquillages.
    def free_grass(x, y):
        return not solid(x, y) and ground[y][x] == 'grass' and (x, y) not in stacks['decor']
    for code, spots in FLOWER_BEDS.items():
        for x, y in spots:
            if free_grass(x, y):
                tile = FLAT_ORANGE if code == 'o' else FLOWERS[code]
                stacks['sol'][(x, y)] = [('tile', *GRASS), ('tile', *tile)]   # des fleurs rases : un sol
    shells = [bd.image_tile(cut_background(bd.tile_image(*s))) for s in SHELLS]
    for i, (x, y) in enumerate(SHELL_SPOTS):
        if not solid(x, y) and ground[y][x] == 'beach' and (x, y) not in stacks['decor']:
            stacks['sol'][(x, y)].append(('auto', shells[i % len(shells)]))

    for (x, y), refs in flowers.items():
        stacks['sol'][(x, y)] += [('ref', m['sheets'][r // STRIDE], r % STRIDE) for r in refs]

    # Objets (sur des cases déjà bloquantes), puis mobilier (cases bloquantes nouvelles).
    new_solid = set()
    for obj in OBJECTS + FURNITURE:
        sheet, c0, r0, w, h = obj['el']
        ax, ay = obj['at']
        full = bd.images[sheet].crop((c0 * TILE, r0 * TILE, (c0 + w) * TILE, (r0 + h) * TILE))
        if obj.get('isolate'):
            arr = np.array(full)
            labels, _ = ndimage.label(arr[..., 3] > 0)
            biggest = np.bincount(labels.ravel())[1:].argmax() + 1
            arr[labels != biggest] = 0
            full = Image.fromarray(arr)
        box = None
        if obj.get('tint') == 'martinique':
            arr = np.array(full).astype(int)
            blue = (arr[..., 3] > 0) & (arr[..., 2] > arr[..., 0] + 30) & (arr[..., 2] > arr[..., 1])
            ys, xs = np.nonzero(blue)
            box = (xs.min(), ys.min(), xs.max(), ys.max())
        for j in range(h):
            for i in range(w):
                img = full.crop((i * TILE, j * TILE, (i + 1) * TILE, (j + 1) * TILE))
                if not img.getbbox():
                    continue
                if obj.get('tint') == 'pierre':
                    img = tint_stone(img)
                elif obj.get('tint') == 'martinique':
                    img = tint_martinique(img, i * TILE, j * TILE, box)
                x, y = ax + i, ay + j
                layer = 'decor' if j >= obj['solid_from'] else 'dessus'
                if layer == 'decor' and not solid(x, y):
                    assert obj in FURNITURE, f'objet sur une case libre : {(x, y)}'
                    new_solid.add((x, y))
                stacks[layer].setdefault((x, y), []).append(('auto', bd.image_tile(img)))

    # ---------- Écriture : une case seule telle quelle, plusieurs fondues en une ----------
    sheets = []

    def ref(sheet, index):
        if sheet not in sheets:
            sheets.append(sheet)
        return sheets.index(sheet) * STRIDE + index

    def img_of(item):
        if item[0] == 'auto':
            return bd.auto_tiles[item[1]]
        if item[0] == 'ref':
            return tile_img(item[1], item[2])
        return bd.tile_image(*item[1:4])

    def ref_of(item):
        if item[0] == 'auto':
            return ref('auto', item[1])
        if item[0] == 'ref':
            return ref(item[1], item[2])
        return ref(item[1], bd.index(*item[1:4]))

    layers = {}
    for name, stack in stacks.items():
        cells = [-1] * (W * H)
        for (x, y), items in stack.items():
            if len(items) == 1:
                cells[y * W + x] = ref_of(items[0])
            else:
                img = Image.new('RGBA', (TILE, TILE))
                for it in items:
                    img.alpha_composite(img_of(it))
                cells[y * W + x] = ref('auto', bd.image_tile(img))
        layers[name] = cells

    solid1 = list(base)
    for x, y in new_solid:
        solid1[y * W + x] = 1
    check_access(W, H, solid0, solid1, spawn0, points, new_solid, protected, sea)
    out = {**m, 'sheets': sheets, 'layers': layers, 'solid': solid1}
    assert out['spawn'] == spawn0, 'départ changé'
    bd.save_auto_sheet()
    MAP.write_text(json.dumps(out, ensure_ascii=False) + '\n')
    print(f'Fort-de-France : {sum(1 for c in layers["decor"] if c != -1)} cases de décor, '
          f'{len(bd.auto_tiles)} cases assemblées, {len(new_solid)} cases bloquantes ajoutées ; tout reste accessible')


if __name__ == '__main__':
    main()
