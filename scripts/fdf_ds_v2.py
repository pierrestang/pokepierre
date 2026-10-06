#!/usr/bin/env python3
"""Fort-de-France, refonte DS (octobre 2026) : refait le dessin de src/data/builtMaps/fort-de-france.json.

Part de la carte actuelle (retouchée dans le créateur) et ne touche jamais à sa structure jouable : collisions
(`solid`), départ, côte (les cases d'eau gardent leurs cases), ponton, maison, cabane, ferry et grands arbres restent
tels quels. Change le reste, avec les planches Gen 4 seulement :
- sols (fleurs et coquillages compris, qui se traversent) : herbe DPPt nuancée, plage, chemins de sable DPPt qui guident vers les trois lieux de l'île (la maison, la
  cabane de pêche, le mémorial), clairière de sable clair autour du mémorial, hautes herbes posées exactement sur les
  cases 'ĥ' du jeu (les jambes de Pierre s'y cachent), massifs de fleurs, coquillages et étoiles de mer sur la plage ;
- objets, sur des cases déjà bloquantes : mémorial de l'Anse Caffard (statue sur socle, en pierre blanche), mât au
  drapeau de la Martinique (rouge, vert, noir) et pot de fleurs, arbustes à baies, buisson rond ; en mer (toujours
  bloquante) : barque de pêcheur contre le ponton, deux voiliers au large.

Les cases assemblées vont dans la planche partagée auto.png (numéros existants gardés, voir convert_maps_v2.Builder).
Vérifie à la fin que les collisions et le départ sont restés identiques.

Usage : python3 scripts/fdf_ds_v2.py   (puis python3 scripts/audit_maps.py et node scripts/check_paths.js)
À lancer sur la carte d'avant la refonte (tag git avant-refonte-fdf) : relancé sur la carte refaite, il retrouve le
même dessin, mais pas les retouches faites entre-temps dans le créateur.
"""
import json
import random
import subprocess
from collections import Counter
from pathlib import Path

import numpy as np
from PIL import Image

from convert_maps_v2 import Builder, load_catalog, ROOT, V2, TILE
from ds_theme import TERRAINS, GRASS, GRASS_BITS

MAP = ROOT / 'src' / 'data' / 'builtMaps' / 'fort-de-france.json'
STRIDE = 100000

# ---------- Plan des sols (cases libres seulement ; l'eau et le ponton ne changent pas) ----------
# Allée principale de la maison au ponton (3 cases, centrée sur la porte), parvis devant la maison, branches vers la
# cabane de pêche (porte en 26, 14) et vers le mémorial (statues en 7-8, 14-15).
PATHS = (
    [(x, y) for y in range(9, 25) for x in (14, 15, 16)] + [(15, 7), (15, 8), (16, 8)]  # allée, du seuil au ponton
    + [(x, 9) for x in (13, 17)]                                                       # parvis
    + [(x, 15) for x in range(17, 27)] + [(x, 16) for x in range(17, 24)]              # vers la cabane
    + [(x, y) for y in (15, 16) for x in range(10, 14)]                                # vers le mémorial
)
# Clairière de sable clair autour du mémorial (on s'y recueille ; la promeneuse s'y tient, en 9, 15).
CLEARING = [(x, y) for y in range(14, 17) for x in range(6, 10)] + [(7, 17), (8, 17)]
# Massifs de fleurs (sur l'herbe libre) : blanches 'f', roses 'ƒ', et les fleurs plates DPPt orange 'o'. Plantées
# comme dans une ville DS : bordures de l'allée, jardin de la maison, offrandes au mémorial, abords de la cabane,
# deux prés fleuris au nord ; pas de fleur isolée au milieu de l'herbe.
FLOWER_BEDS = {
    'ƒ': [(13, 11), (17, 11), (13, 13), (17, 13), (13, 18), (17, 18), (13, 20), (17, 20),       # bordures
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
# Ce que les nouveaux objets remplacent : l'éolienne et son buisson flottant, la souche du mémorial, les fleurs
# bloquantes (cases du calque Décor / Au-dessus de Pierre vidées).
CLEAR = {
    'decor': [(19, 7), (20, 7), (7, 14), (8, 14), (7, 15), (8, 15), (12, 9), (24, 9), (27, 17), (24, 16)],
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


def main():
    m = json.loads(MAP.read_text())
    W, H = m['width'], m['height']
    solid0, spawn0 = list(m['solid']), dict(m['spawn'])
    bd = Builder(load_catalog())
    source = json.loads(subprocess.check_output(['node', str(ROOT / 'scripts' / 'export_audit.mjs')], cwd=ROOT))
    source = source['fortDeFrance']['source']
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

    # Sol actuel : eau, ponton (gardés), sable ou herbe (refaits).
    def kind(x, y):
        cell = m['layers']['sol'][y * W + x]
        top = cell[-1] if isinstance(cell, list) else cell
        if m['sheets'][top // STRIDE] == 'g4-mobilier':
            return 'pier'
        r, g, b = np.array(cell_img('sol', x, y))[..., :3].reshape(-1, 3).mean(0)
        if b > r + 30 and b > g:
            return 'water'
        return 'grass' if g > r + 20 else 'beach'

    ground = [[kind(x, y) for x in range(W)] for y in range(H)]
    keep = {(x, y) for y in range(H) for x in range(W) if ground[y][x] in ('water', 'pier')}
    for x, y in ((14, 7), (16, 7)):                  # sous les murs de la maison, de part et d'autre de la porte
        ground[y][x] = 'grass'
    for x, y in PATHS:
        if not solid(x, y):
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
    for name in ('decor', 'dessus'):
        cleared = set(CLEAR.get(name, []))
        for y in range(H):
            for x in range(W):
                if (x, y) in cleared:
                    continue
                cell = m['layers'][name][y * W + x]
                refs = [r for r in (cell if isinstance(cell, list) else [cell]) if r != -1]
                if name == 'decor' and not solid(x, y):
                    refs = [r for r in refs if m['sheets'][r // STRIDE] not in OLD_SPRINKLES]
                for r in refs:
                    stacks[name].setdefault((x, y), []).append(('ref', m['sheets'][r // STRIDE], r % STRIDE))

    rnd = random.Random(1830)        # l'année du naufrage de l'Anse Caffard : un tirage fixe, la carte ne bouge pas
    same_of = {'beach': {'beach', 'water', 'pier', 'path'}, 'path': {'path', 'beach'}, 'tall': {'tall'}}
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
            if all(qd == spec['center'] for qd in quads):
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

    # Objets.
    for obj in OBJECTS:
        sheet, c0, r0, w, h = obj['el']
        ax, ay = obj['at']
        full = bd.images[sheet].crop((c0 * TILE, r0 * TILE, (c0 + w) * TILE, (r0 + h) * TILE))
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
                assert layer == 'dessus' or solid(x, y), f'objet sur une case libre : {(x, y)}'
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

    out = {**m, 'sheets': sheets, 'layers': layers}
    assert out['solid'] == solid0 and out['spawn'] == spawn0, 'collisions ou départ changés'
    bd.save_auto_sheet()
    MAP.write_text(json.dumps(out, ensure_ascii=False) + '\n')
    print(f'Fort-de-France : {sum(1 for c in layers["decor"] if c != -1)} cases de décor, '
          f'{len(bd.auto_tiles)} cases assemblées ; collisions et départ inchangés')


if __name__ == '__main__':
    main()
