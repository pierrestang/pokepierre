#!/usr/bin/env python3
"""Check-up visuel : harmonise des assets repérés par scripts/audit_assets.py (src/builder/ecarts.json) sans les
redessiner : retire l'ombre portée (pixels sombres semi-transparents, même bleutés sur l'eau) et rend nets les bords
flous (le liseré extérieur à demi transparent devient plein ou vide), comme le reste des assets DS du jeu.
Cartes du créateur : chaque case touchée est remplacée par une case assemblée (planche auto, voir remove_shadows.py).

Usage : python3 scripts/harmonize_assets.py <carte>:<x>,<y>,<w>,<h> [...]
"""
import json
import sys
from pathlib import Path

import numpy as np
from PIL import Image

sys.path.insert(0, str(Path(__file__).parent))
import remove_shadows as RS  # noqa: E402

ROOT = Path(__file__).resolve().parent.parent
MAPS = ROOT / 'src' / 'data' / 'builtMaps'
STRIDE = 100000


def clean(img):
    a = np.array(img.convert('RGBA')).astype(int)
    alpha = a[..., 3]
    shadow = (alpha > 0) & (alpha < 230) & (a[..., :3].sum(-1) < 200)
    a[shadow] = 0
    alpha = a[..., 3]
    # Liseré extérieur flou : un pixel semi-transparent qui touche le vide devient plein (≥ 128) ou vide.
    empty = alpha == 0
    near = np.zeros_like(empty)
    near[1:, :] |= empty[:-1, :]
    near[:-1, :] |= empty[1:, :]
    near[:, 1:] |= empty[:, :-1]
    near[:, :-1] |= empty[:, 1:]
    fringe = (alpha > 0) & (alpha < 255) & near
    a[fringe & (alpha >= 128), 3] = 255
    a[fringe & (alpha < 128)] = 0
    return Image.fromarray(a.astype(np.uint8))


def main(args):
    from convert_maps_v2 import Builder, load_catalog
    bd = Builder(load_catalog())
    catalogue = json.loads((RS.V2 / 'catalogue.json').read_text())
    cat_img = Image.open(RS.V2 / 'catalogue.png').convert('RGBA')
    tile_of, _ = RS.object_test(bd, catalogue, cat_img)
    by_map = {}
    for arg in args:
        mid, rect = arg.split(':')
        by_map.setdefault(mid, []).append(tuple(int(v) for v in rect.split(',')))
    for mid, rects in by_map.items():
        path = MAPS / f'{mid}.json'
        m = json.loads(path.read_text())
        W, sheets = m['width'], m['sheets']
        ref = lambda sheet, k: (sheets.index(sheet) if sheet in sheets else sheets.append(sheet) or len(sheets) - 1) * STRIDE + k
        changed = 0
        for x0, y0, w, h in rects:
            for y in range(y0, y0 + h):
                for x in range(x0, x0 + w):
                    i = y * W + x
                    for layer in ('decor', 'dessus'):
                        cell = m['layers'][layer][i]
                        stack = cell if isinstance(cell, list) else [cell]
                        new = []
                        for r in stack:
                            if r < 0:
                                new.append(r)
                                continue
                            img = tile_of(sheets[r // STRIDE], r % STRIDE)
                            c = clean(img)
                            if c.tobytes() == img.convert('RGBA').tobytes():
                                new.append(r)
                                continue
                            changed += 1
                            if c.getbbox() is None:
                                continue
                            k = bd.image_tile(c)
                            RS.remember_kind(k)
                            new.append(ref('auto', k))
                        m['layers'][layer][i] = new if len(new) > 1 else (new[0] if new else -1)
        path.write_text(json.dumps(m, ensure_ascii=False))
        print(f'{mid} : {changed} case(s) harmonisée(s)')
    bd.save_auto_sheet()
    RS.save_kinds()


if __name__ == '__main__':
    main(sys.argv[1:])
