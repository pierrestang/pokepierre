#!/usr/bin/env python3
"""Retire le halo de sol (cercle d'herbe jaune clair ou de sable beige) dessiné au pied de certains arbres et palmiers
(check-up visuel, octobre 2026) : l'arbre se pose directement sur le sol de la carte. Seuls les pixels de couleur de
halo reliés au vide autour de l'objet, dans le bas du dessin, sont retirés ; feuillage et tronc ne bougent pas.
Les cases touchées sont remplacées par des cases assemblées (planche auto, comme remove_shadows.py).

Usage : python3 scripts/remove_base_rings.py <carte> <x>,<y>,<w>,<h> [...]
"""
import json
import sys
from pathlib import Path

import numpy as np
from PIL import Image
from scipy import ndimage

sys.path.insert(0, str(Path(__file__).parent))
import remove_shadows as RS  # noqa: E402

ROOT = Path(__file__).resolve().parent.parent
STRIDE = 100000
TILE = 16
RING = [(176, 192, 90), (154, 172, 81), (187, 176, 155), (227, 216, 174), (146, 135, 116), (119, 133, 63)]
BOTTOM = 24                                        # px du bas du dessin où chercher le halo


def ring_mask(a):
    col = np.zeros(a.shape[:2], bool)
    for c in RING:
        col |= (np.abs(a[..., :3].astype(int) - c).sum(-1) <= 12) & (a[..., 3] > 0)
    outside = a[..., 3] == 0
    ys = np.nonzero(a[..., 3] > 0)[0]
    if not len(ys):
        return col & False
    low = np.zeros_like(col)
    low[max(0, ys.max() - BOTTOM + 1):, :] = True
    lab, _ = ndimage.label((col & low) | outside, structure=np.ones((3, 3)))
    keep = set(np.unique(lab[outside])) - {0}
    return col & low & np.isin(lab, list(keep))


def main(args):
    mid, rects = args[0], [tuple(map(int, r.split(','))) for r in args[1:]]
    from convert_maps_v2 import Builder, load_catalog
    bd = Builder(load_catalog())
    catalogue = json.loads((RS.V2 / 'catalogue.json').read_text())
    cat_img = Image.open(RS.V2 / 'catalogue.png').convert('RGBA')
    tile_of, _ = RS.object_test(bd, catalogue, cat_img)
    path = ROOT / 'src' / 'data' / 'builtMaps' / f'{mid}.json'
    m = json.loads(path.read_text())
    W, sheets = m['width'], m['sheets']
    if 'auto' not in sheets:
        sheets.append('auto')
    auto = sheets.index('auto') * STRIDE
    total = 0
    for x0, y0, w, h in rects:
        # L'objet entier (Décor + au-dessus), case par case, pour voir son contour.
        layers = {}
        big = Image.new('RGBA', (w * TILE, h * TILE))
        for L in ('decor', 'dessus'):
            for j in range(h):
                for i in range(w):
                    v = m['layers'][L][(y0 + j) * W + x0 + i]
                    st = [r for r in (v if isinstance(v, list) else [v]) if r >= 0]
                    layers[(L, i, j)] = st
                    for r in st:
                        big.alpha_composite(tile_of(sheets[r // STRIDE], r % STRIDE).convert('RGBA'), (i * TILE, j * TILE))
        mask = ring_mask(np.array(big))
        for (L, i, j), st in layers.items():
            sub = mask[j * TILE:(j + 1) * TILE, i * TILE:(i + 1) * TILE]
            if not sub.any() or not st:
                continue
            new = []
            for r in st:
                a = np.array(tile_of(sheets[r // STRIDE], r % STRIDE).convert('RGBA'))
                hit = sub & (a[..., 3] > 0)
                if not hit.any():
                    new.append(r)
                    continue
                a[hit] = 0
                total += 1
                t = Image.fromarray(a)
                if t.getbbox() is None:
                    continue
                k = bd.image_tile(t)
                RS.remember_kind(k, 'objet')
                new.append(auto + k)
            m['layers'][L][(y0 + j) * W + x0 + i] = new if len(new) > 1 else (new[0] if new else -1)
    path.write_text(json.dumps(m, ensure_ascii=False))
    bd.save_auto_sheet()
    RS.save_kinds()
    print(f'{mid} : {total} case(s) sans halo')


if __name__ == '__main__':
    main(sys.argv[1:])
