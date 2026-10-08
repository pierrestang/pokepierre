#!/usr/bin/env python3
"""Contour des bâtiments et des objets harmonisé (octobre 2026) : un trait d'un pixel gris très foncé tout autour du dessin (toit,
murs, bas de façade), comme la maison de bois au toit bleu de la bibliothèque Gen 4. Le trait remplace la rangée de
pixels du bord du dessin (l'emprise ne change pas) ; un bord déjà sombre garde sa couleur.

- Catalogue du créateur : build_catalogue.py passe ses maisons par outlined() (après shadowless()).
- Cartes du créateur (src/data/builtMaps/*.json) : sur l'image de tous les objets de la carte (calques Décor et
  « au-dessus de Pierre », hors végétation : remove_shadows.is_object), chaque bâtiment (dessin d'un seul tenant d'au
  moins 3 x 3 cases, plein à plus de la moitié, pas sur l'eau ni bateau ou véhicule) reçoit le trait ; ses cases sont
  remplacées par leur version avec contour (cases du catalogue si elles y sont, sinon cases assemblées de la planche
  auto, numéros existants gardés). Le mobilier, les clôtures et la végétation ne changent pas.

Puis les objets (mobilier, clôtures, panneaux, lampadaires…, demandé ensuite) : le même trait autour de chaque dessin
d'un seul tenant, sauf les bateaux et véhicules et ce qui est posé sur l'eau ; la végétation garde son dessin.

Usage : python3 scripts/outline_buildings.py [id de carte…]   (toutes les cartes par défaut)
"""
import json
import sys
from pathlib import Path

import numpy as np
from PIL import Image
from scipy import ndimage

sys.path.insert(0, str(Path(__file__).parent))
from remove_shadows import MAPS, STRIDE, TILE, V2, object_test, remember_kind, save_kinds  # noqa: E402

OUTLINE = (32, 32, 32)
DARK = 50
VERBOSE = False
# Cases laissées telles quelles : le haut du toit et une clôture dans la même case assemblée (rien ne les sépare).
SKIP = {'prytanee': {(7, 2), (29, 2)}}
OPEN = 10                      # épaisseur (px) sous laquelle un dessin compte comme fin (clôture, poteau)                      # luminosité sous laquelle un bord est déjà un trait
NEAR = 5                       # épaisseur (px) sous laquelle un trait qui touche le bâtiment n'en fait pas partie
NOT_OUTLINED = {'g4-vehicules', 'objets', 'jared-bateaux'}     # bateaux, véhicules, ferry et palmiers
NOT_BUILDINGS = {'g4-vehicules', 'objets', 'jared-bateaux', 'g4-clotures', 'g4-mobilier', 'g4-ponts'}


def border(opaque):
    """Pixels du bord d'une silhouette : opaques, avec une voisine (haut, bas, gauche, droite) transparente ou hors image."""
    pad = np.pad(opaque, 1)
    inner = pad[:-2, 1:-1] & pad[2:, 1:-1] & pad[1:-1, :-2] & pad[1:-1, 2:]
    return opaque & ~inner


def paint(a, mask):
    """Le trait sur les pixels `mask` de `a` (RGBA), sauf ceux déjà sombres."""
    lum = a[..., :3].astype(int).mean(-1)
    m = mask & (lum >= DARK)
    a[m, :3] = OUTLINE
    a[m, 3] = 255
    return a


def same_tile(a, b, share=0.95):
    """Deux cases (PIL RGBA) presque identiques : même silhouette et au moins `share` des pixels pareils."""
    a, b = np.array(a).astype(int), np.array(b).astype(int)
    if ((a[..., 3] > 0) != (b[..., 3] > 0)).mean() > 0.03:
        return False
    return (np.abs(a - b).sum(-1) < 24).mean() >= share


def outlined(img):
    """L'image (PIL RGBA) avec le trait autour de sa silhouette."""
    a = np.array(img.convert('RGBA'))
    return Image.fromarray(paint(a, border(a[..., 3] >= 128)))


def main(ids):
    from convert_maps_v2 import Builder, load_catalog
    bd = Builder(load_catalog())
    catalogue = json.loads((V2 / 'catalogue.json').read_text())
    cat_cols = catalogue['cols']
    cat_img = Image.open(V2 / 'catalogue.png').convert('RGBA')
    cat_by_bytes = {}
    for k in range(cat_img.width // TILE * (cat_img.height // TILE)):
        t = cat_img.crop(((k % cat_cols) * TILE, (k // cat_cols) * TILE, (k % cat_cols + 1) * TILE, (k // cat_cols + 1) * TILE))
        cat_by_bytes.setdefault(t.tobytes(), k)
    tile_of, is_object = object_test(bd, catalogue, cat_img)
    # Cases du catalogue qui ne sont pas des maisons : mobilier, matières (clôture, pavés…). Les autres (aussi les
    # anciennes versions des maisons, que des cartes gardent) comptent comme bâtiments.
    other_cat = {k for t in catalogue['themes'].values() for e in t['elements'] if e['cat'] != 'maisons'
                 for row in e['tiles'] for k in row if k >= 0}
    def ints(v):
        if isinstance(v, bool):
            return
        if isinstance(v, int):
            yield v
        elif isinstance(v, (list, dict)):
            for x in (v.values() if isinstance(v, dict) else v):
                yield from ints(x)
    other_cat |= {k for t in catalogue['themes'].values() for mat in t['materials']
                  for key in ('tile', 'tiles', 'pattern', 'kit', 'overlay', 'fence') for k in ints(mat.get(key)) if k >= 0}

    def is_building(sheet, k, img):
        if sheet in NOT_BUILDINGS or not is_object(sheet, k, img):
            return False
        return k not in other_cat if sheet == 'catalogue' else True

    for path in sorted(MAPS.glob('*.json')):
        mid = path.stem
        if ids and mid not in ids:
            continue
        m = json.loads(path.read_text())
        W, H = m['width'], m['height']
        sheets = m['sheets']
        ref = lambda sheet, k: (sheets.index(sheet) if sheet in sheets else sheets.append(sheet) or len(sheets) - 1) * STRIDE + k
        sheet_k = lambda r: (sheets[r // STRIDE], r % STRIDE)
        big = Image.new('RGBA', (W * TILE, H * TILE))
        for layer in ('decor', 'dessus'):
            for i, cell in enumerate(m['layers'][layer]):
                for r in (cell if isinstance(cell, list) else [cell]):
                    if r < 0:
                        continue
                    sheet, k = sheets[r // STRIDE], r % STRIDE
                    img = tile_of(sheet, k)
                    if is_building(sheet, k, img):        # sans clôtures ni mobilier : la maison seule
                        big.alpha_composite(img, ((i % W) * TILE, (i // W) * TILE))
        a = np.array(big)
        opaque = a[..., 3] >= 128
        # Les cases assemblées surtout vertes (classées végétation : un toit-jardin, un palmier) comptent comme pleines
        # pour trouver le bord, sans être repeintes : un toit-jardin n'est pas un trou dans l'immeuble.
        greens = Image.new('RGBA', (W * TILE, H * TILE))
        for layer in ('decor', 'dessus'):
            for i, cell in enumerate(m['layers'][layer]):
                for r in (cell if isinstance(cell, list) else [cell]):
                    if r >= 0 and sheets[r // STRIDE] == 'auto' and not is_object('auto', r % STRIDE, tile_of('auto', r % STRIDE)):
                        greens.alpha_composite(tile_of('auto', r % STRIDE), ((i % W) * TILE, (i // W) * TILE))
        green = np.array(greens)[..., 3] >= 128
        # Un trou entièrement entouré par le dessin (morceau de toit posé dans le calque Sol, case par case) n'est pas un
        # bord : bouché pour trouver le contour.
        filled = ndimage.binary_fill_holes(opaque) & ~opaque
        # Les clôtures et objets fins (souvent des cases assemblées, qu'on ne reconnaît pas à leur planche) disparaissent
        # à l'ouverture : il reste le corps des bâtiments.
        body = ndimage.binary_opening(opaque, structure=np.ones((OPEN, OPEN)))
        lab, n = ndimage.label(body)
        keep = np.zeros(n + 1, bool)
        sol = m['layers']['sol']

        def on_water(cells):
            """Le dessin est surtout posé sur l'eau (bateau, rocher dans la mer)."""
            water = 0
            for cy, cx in cells:
                st = sol[cy * W + cx]
                st = [r for r in (st if isinstance(st, list) else [st]) if r >= 0]
                if st:
                    mean = np.array(tile_of(sheets[st[0] // STRIDE], st[0] % STRIDE))[..., :3].reshape(-1, 3).astype(int).mean(0)
                    water += mean[2] > mean[0] + 40 and mean[2] > mean[1]
            return water > 0.5 * len(cells)

        def object_tile(sheet, k, img=None):
            return sheet not in NOT_OUTLINED and is_object(sheet, k, img if img is not None else tile_of(sheet, k))
        for c, sl in enumerate(ndimage.find_objects(lab), 1):
            ys, xs = sl
            h, w = ys.stop - ys.start, xs.stop - xs.start
            if h < 3 * TILE or w < 3 * TILE or (lab[sl] == c).sum() < 0.5 * h * w:
                continue
            cells = {(y // TILE, x // TILE) for y, x in zip(*np.nonzero(lab[sl] == c)) for y, x in [(y + ys.start, x + xs.start)]}
            if on_water(cells):
                continue
            keep[c] = True
            if VERBOSE:
                print("   ", mid, (xs.start // TILE, ys.start // TILE), w, h)
        # Le bâtiment entier : son dessin sans les traits de moins de NEAR px (barreaux de clôture, poteaux) qui le
        # touchent ; les cheminées et les bords restent.
        fine = ndimage.binary_opening(opaque, structure=np.ones((NEAR, NEAR)))
        lab2, n2 = ndimage.label(fine)
        ids2 = np.unique(lab2[keep[lab] & (lab2 > 0)])
        region = np.isin(lab2, ids2) & (lab2 > 0)
        mask = border(opaque | filled | green) & region
        core = ndimage.binary_dilation(keep[lab], iterations=2)
        changed = 0
        made = {}                                  # (calque, case) -> cases refaites ici

        def apply(mask, accept, skip=()):
            nonlocal changed
            for layer in ('decor', 'dessus'):
                cells = m['layers'][layer]
                for i, cell in enumerate(cells):
                    x, y = i % W, i // W
                    if (x, y) in skip:
                        continue
                    cm = mask[y * TILE:(y + 1) * TILE, x * TILE:(x + 1) * TILE]
                    if not cm.any():
                        continue
                    stack = cell if isinstance(cell, list) else [cell]
                    new = []
                    for r in stack:
                        if r < 0:
                            new.append(r)
                            continue
                        sheet, k = sheets[r // STRIDE], r % STRIDE
                        img = tile_of(sheet, k)
                        t = np.array(img)
                        tm = cm & (t[..., 3] >= 128)
                        if not tm.any() or not accept(sheet, k, img, t, x, y):
                            new.append(r)
                            continue
                        before = t.copy()
                        paint(t, tm)
                        if np.array_equal(before, t):
                            new.append(r)
                            continue
                        changed += 1
                        clean = Image.fromarray(t)
                        k2 = cat_by_bytes.get(clean.tobytes()) if sheet == 'catalogue' else None
                        if k2 is not None:
                            new.append(ref('catalogue', k2))
                        else:
                            k3 = bd.image_tile(clean)
                            remember_kind(k3)                # repeint d'un objet : reste un objet
                            new.append(ref('auto', k3))
                        made.setdefault((layer, i), set()).add(new[-1])
                    cells[i] = new if len(new) > 1 else (new[0] if new else -1)

        # 1. Bâtiments. Une case qui n'est pas surtout du bâtiment (barreaux de clôture contre un toit) ne change pas.
        def building_tile(sheet, k, img, t, x, y):
            mine = t[..., 3] >= 128
            part = core[y * TILE:(y + 1) * TILE, x * TILE:(x + 1) * TILE][mine].mean() if mine.any() else 0
            return is_building(sheet, k, img) and part >= 0.3
        apply(mask, building_tile, SKIP.get(mid, ()))

        # 2. Objets (mobilier, clôtures, panneaux, lampadaires…) : le même trait autour de chaque dessin, sauf les
        # bateaux et véhicules, et ce qui est posé sur l'eau. Un bord déjà tracé (bâtiment) ne change plus.
        objs = Image.new('RGBA', (W * TILE, H * TILE))
        plants = Image.new('RGBA', (W * TILE, H * TILE))
        for layer in ('decor', 'dessus'):
            for i, cell in enumerate(m['layers'][layer]):
                for r in (cell if isinstance(cell, list) else [cell]):
                    if r < 0:
                        continue
                    sheet, k = sheets[r // STRIDE], r % STRIDE
                    img = tile_of(sheet, k)
                    to = objs if object_tile(sheet, k, img) else plants if sheet != 'lisieres' else None
                    if to is not None:
                        to.alpha_composite(img, ((i % W) * TILE, (i // W) * TILE))
        o_opaque = np.array(objs)[..., 3] >= 128
        p_opaque = (np.array(plants)[..., 3] >= 128) & ~o_opaque
        olab, on = ndimage.label(o_opaque, structure=np.ones((3, 3)))
        # Un objet collé à une plante plus grande que lui et qui tient dans sa largeur en fait partie (pied d'un
        # palmier) : pas de trait. Une clôture qui longe une haie ou un arbre garde le sien.
        plab, _ = ndimage.label(p_opaque, structure=np.ones((3, 3)))
        pboxes = ndimage.find_objects(plab)
        pareas = np.bincount(plab.ravel())
        okeep = np.zeros(on + 1, bool)
        for c, sl in enumerate(ndimage.find_objects(olab), 1):
            ys, xs = sl
            px = olab[sl] == c
            cells = {((y + ys.start) // TILE, (x + xs.start) // TILE) for y, x in zip(*np.nonzero(px))}
            okeep[c] = not on_water(cells)
            big_sl = (slice(max(0, ys.start - 1), ys.stop + 1), slice(max(0, xs.start - 1), xs.stop + 1))
            near = ndimage.binary_dilation(olab[big_sl] == c) & (plab[big_sl] > 0)
            for pl in np.unique(plab[big_sl][near]):
                pys, pxs = pboxes[pl - 1]
                if px.sum() < pareas[pl] <= 16 * TILE * TILE and xs.start >= pxs.start - 4 and xs.stop <= pxs.stop + 4:
                    okeep[c] = False
        o_filled = ndimage.binary_fill_holes(o_opaque) & ~o_opaque
        apply(border(o_opaque | o_filled | green) & okeep[olab], lambda sheet, k, img, t, x, y: object_tile(sheet, k, img))

        # Maisons et mobilier posés en mode simple : leurs cases refaites deviennent celles du catalogue (la version avec contour),
        # pour que le créateur les reconnaisse toujours (sélection, gomme, remplacement), même si un objet collé
        # changeait le contour d'un pixel.
        for el in (m.get('studio') or {}).get('elements', []):
            t = catalogue['themes'].get(el['theme']) or catalogue['themes']['libre']
            d = next((e for e in t['elements'] if e['id'] == el['id']), None)
            if not d or d['cat'] not in ('maisons', 'mobilier'):
                continue
            # La fiche doit encore correspondre au dessin : au moins la moitié de ses cases sont exactement celles du
            # catalogue à cet endroit (sinon l'élément a été remplacé ou redessiné à la main : on n'y touche pas).
            spots = [(j, i2, k) for j, row in enumerate(d['tiles']) for i2, k in enumerate(row)
                     if k >= 0 and 0 <= el['x'] + i2 < W and 0 <= el['y'] + j < H]
            def present(j, i2, k):
                c = (el['y'] + j) * W + el['x'] + i2
                st = m['layers']['decor' if j >= d['over'] else 'dessus'][c]
                return ref('catalogue', k) in (st if isinstance(st, list) else [st])
            if not spots or sum(present(*sp) for sp in spots) < 0.5 * len(spots):
                continue
            for j, row in enumerate(d['tiles']):
                for i2, k in enumerate(row):
                    x, y = el['x'] + i2, el['y'] + j
                    if k < 0 or not (0 <= x < W and 0 <= y < H):
                        continue
                    layer = 'decor' if j >= d['over'] else 'dessus'
                    c = y * W + x
                    stack = m['layers'][layer][c]
                    stack = stack if isinstance(stack, list) else [stack]
                    want = ref('catalogue', k)
                    if want in stack:
                        continue
                    ours = [r for r in stack if r in made.get((layer, c), ())]
                    # Seulement si la case du catalogue est presque la même (une fiche d'élément peut ne plus
                    # correspondre au dessin : maison remplacée ou déplacée à la main).
                    if len(ours) == 1 and same_tile(tile_of(*sheet_k(ours[0])), tile_of('catalogue', k)):
                        stack = [want if r == ours[0] else r for r in stack]
                        m['layers'][layer][c] = stack if len(stack) > 1 else stack[0]
        if changed:
            path.write_text(json.dumps(m, ensure_ascii=False))
        print(f'{mid:22} {int(keep.sum())} bâtiment(s), {changed} case(s) avec contour')
    bd.save_auto_sheet()
    save_kinds()


if __name__ == '__main__':
    main(set(sys.argv[1:]))
