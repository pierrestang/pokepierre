#!/usr/bin/env python3
"""Éléments déjà posés sur les cartes mais absents du catalogue du créateur (octobre 2026).

Sur chaque carte du créateur (src/data/builtMaps/*.json), l'image des objets (calques Décor et « au-dessus de Pierre »,
hors végétation : remove_shadows.object_test) est découpée en dessins d'un seul tenant :
- bâtiments : le corps qui reste après une ouverture de 10 px (dessin plein d'au moins 3 x 3 cases), avec ce qui le
  touche de plus épais que 5 px (comme outline_buildings.py) ;
- objets : le reste, pièce par pièce (pas les clôtures : longues et creuses, ce sont des matières).
Chaque dessin qui n'est pas déjà un élément du catalogue (même image, à la translation près) et pas déjà relevé ailleurs
est écrit dans assets-source/elements-cartes/ : <id>.png (déjà sans ombre et avec contour, comme sur la carte) et
elements.json (carte, position, rayon, collisions relevées sur la carte, rangée « au-dessus de Pierre », porte du jeu
s'il y en a une). Les noms se donnent ensuite à la main dans names.json ({id: nom} ; un id absent ou à null n'entre pas
au catalogue) ; scripts/build_catalogue.py ajoute les éléments nommés au thème de leur ville et à « Libre ».

Usage : python3 scripts/harvest_map_elements.py   (puis nommer, puis python3 scripts/build_catalogue.py)
"""
import hashlib
import json
import subprocess
import sys
from pathlib import Path

import numpy as np
from PIL import Image
from scipy import ndimage

sys.path.insert(0, str(Path(__file__).parent))
from remove_shadows import MAPS, STRIDE, TILE, V2, object_test  # noqa: E402

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / 'assets-source' / 'elements-cartes' / 'candidats'
OPEN, NEAR = 10, 5


def trimmed_key(a):
    """Clé d'une image RGBA (numpy) à la translation près : les pixels de son cadre."""
    ys, xs = np.nonzero(a[..., 3])
    if not len(ys):
        return None
    return hashlib.sha1(np.ascontiguousarray(a[ys.min():ys.max() + 1, xs.min():xs.max() + 1]).tobytes()).hexdigest()


def main():
    from convert_maps_v2 import Builder, load_catalog
    bd = Builder(load_catalog())
    catalogue = json.loads((V2 / 'catalogue.json').read_text())
    cat_img = Image.open(V2 / 'catalogue.png').convert('RGBA')
    tile_of, is_object = object_test(bd, catalogue, cat_img)
    cols = catalogue['cols']
    sheet = np.array(cat_img)

    # Les images des éléments du catalogue (tous thèmes).
    known = set()
    for t in catalogue['themes'].values():
        for e in t['elements']:
            a = np.zeros((e['h'] * TILE, e['w'] * TILE, 4), np.uint8)
            for j, row in enumerate(e['tiles']):
                for i, k in enumerate(row):
                    if k >= 0:
                        a[j * TILE:(j + 1) * TILE, i * TILE:(i + 1) * TILE] = sheet[(k // cols) * TILE:(k // cols + 1) * TILE,
                                                                               (k % cols) * TILE:(k % cols + 1) * TILE]
            known.add(trimmed_key(a))

    game = json.loads(subprocess.check_output(['node', str(ROOT / 'scripts' / 'export_audit.mjs')], cwd=ROOT))
    doors_of = {g['file']: [(p['x'], p['y']) for p in g['pts'] if p['k'] == 'door'] for g in game.values()}

    OUT.mkdir(parents=True, exist_ok=True)
    found = []
    seen = set()
    for path in sorted(MAPS.glob('*.json')):
        mid = path.stem
        m = json.loads(path.read_text())
        W, H = m['width'], m['height']
        sheets = m['sheets']
        big = Image.new('RGBA', (W * TILE, H * TILE))
        for layer in ('decor', 'dessus'):
            for i, cell in enumerate(m['layers'][layer]):
                for r in (cell if isinstance(cell, list) else [cell]):
                    if r < 0:
                        continue
                    img = tile_of(sheets[r // STRIDE], r % STRIDE)
                    if is_object(sheets[r // STRIDE], r % STRIDE, img):
                        big.alpha_composite(img, ((i % W) * TILE, (i // W) * TILE))
        a = np.array(big)
        opaque = a[..., 3] >= 128
        # Bâtiments.
        body = ndimage.binary_opening(opaque, structure=np.ones((OPEN, OPEN)))
        lab, _ = ndimage.label(body)
        keep = np.zeros(lab.max() + 1, bool)
        for c, sl in enumerate(ndimage.find_objects(lab), 1):
            h, w = sl[0].stop - sl[0].start, sl[1].stop - sl[1].start
            keep[c] = h >= 3 * TILE and w >= 3 * TILE and (lab[sl] == c).sum() >= 0.5 * h * w
        fine = ndimage.binary_opening(opaque, structure=np.ones((NEAR, NEAR)))
        lab2, _ = ndimage.label(fine)
        pieces = []
        for c2 in np.unique(lab2[keep[lab] & (lab2 > 0)]):
            pieces.append(('maisons', lab2 == c2))
        houses = np.zeros_like(opaque)
        for _, p in pieces:
            houses |= p
        # Objets : le reste.
        rest = (a[..., 3] > 0) & ~ndimage.binary_dilation(houses)
        lab3, _ = ndimage.label(rest, structure=np.ones((3, 3)))
        for c3, sl in enumerate(ndimage.find_objects(lab3), 1):
            px = lab3[sl] == c3
            h, w = sl[0].stop - sl[0].start, sl[1].stop - sl[1].start
            if px.sum() < 30:
                continue
            if max(h, w) >= 4 * TILE and px.sum() < 0.3 * h * w:        # clôture : une matière, pas un élément
                continue
            if h > 8 * TILE or w > 8 * TILE:
                continue
            pieces.append(('mobilier', lab3 == c3))
        for cat, mask in pieces:
            ys, xs = np.nonzero(mask)
            x0, y0, x1, y1 = xs.min() // TILE, ys.min() // TILE, xs.max() // TILE + 1, ys.max() // TILE + 1
            img = a[y0 * TILE:y1 * TILE, x0 * TILE:x1 * TILE].copy()
            img[~mask[y0 * TILE:y1 * TILE, x0 * TILE:x1 * TILE]] = 0
            key = trimmed_key(img)
            if key in known or key in seen:
                continue
            seen.add(key)
            cells = [(x, y) for y in range(y0, y1) for x in range(x0, x1)
                     if mask[y * TILE:(y + 1) * TILE, x * TILE:(x + 1) * TILE].sum() >= 16]
            solid = [[1 if (x, y) in cells and m['solid'][int(y * W + x)] else 0 for x in range(x0, x1)] for y in range(y0, y1)]
            # Sur l'eau : surtout de l'eau dessous.
            water = 0
            for x, y in cells:
                st = m['layers']['sol'][y * W + x]
                st = [r for r in (st if isinstance(st, list) else [st]) if r >= 0]
                if st:
                    mean = np.array(tile_of(sheets[st[0] // STRIDE], st[0] % STRIDE))[..., :3].reshape(-1, 3).astype(int).mean(0)
                    water += mean[2] > mean[0] + 40 and mean[2] > mean[1]
            place = 'water' if water > 0.5 * len(cells) else 'land'
            if place == 'water':
                cat = 'eau'
            door = next(([int(x - x0), int(y - y0)] for x, y in doors_of.get(mid, []) if x0 <= x < x1 and y0 <= y < y1), None)
            if cat == 'maisons' and door is None:
                door = [int((x1 - x0) // 2), int(y1 - y0 - 1)]
            first = next((j for j, row in enumerate(solid) if any(row)), None)
            eid = f'{mid}-{len([f for f in found if f["map"] == mid]) + 1}'
            Image.fromarray(img).save(OUT / f'{eid}.png')
            found.append({'id': eid, 'map': mid, 'x': int(x0), 'y': int(y0), 'w': int(x1 - x0), 'h': int(y1 - y0),
                          'cat': cat, 'place': place, 'solid': solid, 'over': int(first or 0),
                          'door': door})
    (OUT / 'elements.json').write_text(json.dumps(found, ensure_ascii=False, indent=1))
    by = {}
    for f in found:
        by.setdefault((f['map'], f['cat']), 0)
        by[(f['map'], f['cat'])] += 1
    for k, n in sorted(by.items()):
        print(k, n)
    print(len(found), 'éléments absents du catalogue ->', OUT.relative_to(ROOT))


if __name__ == '__main__':
    main()
