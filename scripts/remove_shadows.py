#!/usr/bin/env python3
"""Retire l'ombre portée des bâtiments, du mobilier et des objets (octobre 2026) : sans elle, les bâtiments des
différentes planches (DPPt, bibliothèque Gen 4) vont ensemble. La végétation et les éléments naturels (arbres, buissons,
plantes, fleurs, rochers, roseaux) gardent la leur.

Deux sortes d'ombre :
- DPPt : des pixels noirs semi-transparents (noir, opacité < 100 %) : retirés pixel par pixel ;
- bibliothèque Gen 4 (g4-batiments) : un gris opaque (SHADOW_GREYS) autour du contour : retiré seulement s'il est
  relié à l'extérieur du dessin (les murs, derrière le contour noir, ne sont jamais touchés).

Sur les cartes du créateur (src/data/builtMaps/*.json), chaque case de bâtiment ou d'objet des calques Décor et
« au-dessus de Pierre » est remplacée par sa version sans ombre (cases assemblées de la planche auto, numéros existants
gardés). Le catalogue du créateur (scripts/build_catalogue.py) passe ses maisons et son mobilier par shadowless().

Usage : python3 scripts/remove_shadows.py [id de carte…]   (toutes les cartes par défaut)
"""
import hashlib
import json
import sys
from pathlib import Path

import numpy as np
from PIL import Image
from scipy import ndimage

ROOT = Path(__file__).resolve().parent.parent
V2 = ROOT / 'public' / 'assets' / 'v2'
MAPS = ROOT / 'src' / 'data' / 'builtMaps'
TILE = 16
STRIDE = 100000
SHADOW_GREYS = [(75, 79, 82)]                 # ombre opaque des bâtiments de la bibliothèque Gen 4

# Planches de végétation et d'éléments naturels : leur ombre reste.
NATURE_SHEETS = {'lisieres', 'g4-arbres', 'g4-herbes', 'g4-plantes', 'rmxp-nature', 'autotiles-g4', 'g4-eau',
                 'g4-rochers', 'transitions'}
DPPT_COLS = 8
DPPT_NATURE = {(7, 145), (7, 146), (7, 106), (7, 107)}    # rochers, buissons ronds parmi les objets DPPt


def semi_black(a):
    """Pixels d'ombre DPPt : noirs (ou presque) et semi-transparents."""
    return (a[..., 3] > 0) & (a[..., 3] < 255) & (a[..., :3].astype(int).sum(-1) < 40)


def opaque_shadow(a):
    """Gris d'ombre opaque relié à l'extérieur du dessin (pixels transparents ou bord de l'image)."""
    grey = np.zeros(a.shape[:2], bool)
    for g in SHADOW_GREYS:
        grey |= (np.abs(a[..., :3].astype(int) - g).sum(-1) < 6) & (a[..., 3] == 255)
    outside = a[..., 3] == 0
    lab, _ = ndimage.label(grey | outside)
    keep = set(np.unique(lab[outside])) - {0}
    border = np.zeros_like(grey)
    border[0, :] = border[-1, :] = border[:, 0] = border[:, -1] = True
    keep |= set(np.unique(lab[grey & border])) - {0}
    return grey & np.isin(lab, list(keep))


def shadowless(img, opaque=True):
    """L'image sans son ombre portée (PIL RGBA)."""
    a = np.array(img.convert('RGBA'))
    remove = semi_black(a)
    if opaque:
        remove |= opaque_shadow(a)
    a[remove] = 0
    return Image.fromarray(a)


# ---------- Cartes ----------

def main(ids):
    sys.path.insert(0, str(Path(__file__).parent))
    from convert_maps_v2 import Builder, load_catalog
    bd = Builder(load_catalog())
    catalogue = json.loads((V2 / 'catalogue.json').read_text())
    cat_cols = catalogue['cols']
    cat_img = Image.open(V2 / 'catalogue.png').convert('RGBA')
    # Cases du catalogue qui sont de la végétation (arbres, plantes, eau) : leur ombre reste.
    nature_cat = {k for t in catalogue['themes'].values() for e in t['elements'] if e['cat'] in ('arbres', 'plantes', 'eau')
                  for row in e['tiles'] for k in row if k >= 0}
    keys = {i: k for k, i in bd.auto_index.items()}
    # Cases du catalogue par image : un élément du mode simple garde ses cases de catalogue (sa version sans ombre, que
    # build_catalogue.py y range), pour que le créateur le reconnaisse toujours (gomme, sélection).
    cat_by_bytes = {}
    for k in range(cat_img.width // TILE * (cat_img.height // TILE)):
        t = cat_img.crop(((k % cat_cols) * TILE, (k // cat_cols) * TILE, (k % cat_cols + 1) * TILE, (k // cat_cols + 1) * TILE))
        cat_by_bytes.setdefault(t.tobytes(), k)

    def tile_of(sheet, k):
        if sheet == 'auto':
            return bd.auto_tiles[k].convert('RGBA')
        if sheet == 'catalogue':
            return cat_img.crop(((k % cat_cols) * TILE, (k // cat_cols) * TILE, (k % cat_cols + 1) * TILE,
                                 (k // cat_cols + 1) * TILE))
        return bd.tile_image(sheet, k % bd.sheet_info[sheet]['cols'], k // bd.sheet_info[sheet]['cols']).convert('RGBA')

    def is_object(sheet, k, img):
        if sheet in NATURE_SHEETS:
            return False
        if sheet == 'dppt':
            c, r = k % DPPT_COLS, k // DPPT_COLS
            return r >= 125 and (c, r) not in DPPT_NATURE
        if sheet == 'catalogue':
            return k not in nature_cat
        if sheet == 'auto':
            key = keys.get(k)
            if not key or key[0] not in ('img', 'stack'):
                return False
            # Une case assemblée surtout verte (feuillage recoloré, palmier) est de la végétation.
            a = np.array(img)
            vis = a[..., 3] == 255
            if not vis.any():
                return True
            r, g, b = (a[..., i][vis].astype(int) for i in range(3))
            return ((g > r + 15) & (g > b)).mean() < 0.25
        return True                               # bâtiments, mobilier, clôtures, véhicules…

    total = 0
    for path in sorted(MAPS.glob('*.json')):
        mid = path.stem
        if ids and mid not in ids:
            continue
        m = json.loads(path.read_text())
        W, H = m['width'], m['height']
        sheets = m['sheets']
        ref = lambda sheet, k: (sheets.index(sheet) if sheet in sheets else sheets.append(sheet) or len(sheets) - 1) * STRIDE + k
        # Ombre opaque (bâtiments de la bibliothèque Gen 4, aussi posés depuis le catalogue) : sur l'image de tous les
        # bâtiments et objets de la carte (pour voir leur contour).
        big = Image.new('RGBA', (W * TILE, H * TILE))
        for layer in ('decor', 'dessus'):
            for i, cell in enumerate(m['layers'][layer]):
                for r in (cell if isinstance(cell, list) else [cell]):
                    if r < 0:
                        continue
                    img = tile_of(sheets[r // STRIDE], r % STRIDE)
                    if is_object(sheets[r // STRIDE], r % STRIDE, img):
                        big.alpha_composite(img, ((i % W) * TILE, (i // W) * TILE))
        grey_mask = opaque_shadow(np.array(big))
        changed = 0
        emptied = set()
        for layer in ('decor', 'dessus'):
            cells = m['layers'][layer]
            for i, cell in enumerate(cells):
                stack = cell if isinstance(cell, list) else [cell]
                new = []
                for r in stack:
                    if r < 0:
                        new.append(r)
                        continue
                    sheet, k = sheets[r // STRIDE], r % STRIDE
                    img = tile_of(sheet, k)
                    if not is_object(sheet, k, img):
                        new.append(r)
                        continue
                    a = np.array(img)
                    remove = semi_black(a)
                    if True:                      # ombre opaque reliée à l'extérieur du contour
                        x, y = i % W, i // W
                        remove |= grey_mask[y * TILE:(y + 1) * TILE, x * TILE:(x + 1) * TILE] & (a[..., 3] == 255)
                    if not remove.any():
                        new.append(r)
                        continue
                    a[remove] = 0
                    changed += 1
                    clean = Image.fromarray(a)
                    if clean.getbbox() is None:
                        emptied.add(i)            # une case qui n'était que de l'ombre : retirée
                        continue
                    k2 = cat_by_bytes.get(clean.tobytes()) if sheet == 'catalogue' else None
                    new.append(ref('catalogue', k2) if k2 is not None else ref('auto', bd.image_tile(clean)))
                cells[i] = new if len(new) > 1 else (new[0] if new else -1)
        # Une case qui ne portait que de l'ombre ne bloque plus (sauf sur l'eau : l'ombre d'un bateau).
        freed = 0
        for i in emptied:
            if not m['solid'][i] or m['layers']['decor'][i] not in (-1, []):
                continue
            sol = m['layers']['sol'][i]
            sol = [r for r in (sol if isinstance(sol, list) else [sol]) if r >= 0]
            if sol:
                a = np.array(tile_of(sheets[sol[0] // STRIDE], sol[0] % STRIDE))[..., :3].reshape(-1, 3).astype(int).mean(0)
                if a[2] > a[0] + 40:
                    continue
            m['solid'][i] = 0
            freed += 1
        if changed:
            path.write_text(json.dumps(m, ensure_ascii=False))
        print(f'{mid:22} {changed} case(s) sans ombre, {freed} case(s) libérée(s)')
        total += changed
    bd.save_auto_sheet()
    return total


if __name__ == '__main__':
    main(set(sys.argv[1:]))
