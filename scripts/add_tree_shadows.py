#!/usr/bin/env python3
"""Ombre douce au pied d'arbres (check-up visuel, octobre 2026) : à la place de l'ancien halo de sol jaune / beige
(retiré par remove_base_rings.py), une ellipse sombre semi-transparente de la même largeur, posée sous l'arbre (en
bas de la pile du calque Décor). Le halo d'origine est relu dans une version git de la carte (--ref).

Usage : python3 scripts/add_tree_shadows.py <carte> --ref <commit> <x>,<y>,<w>,<h> [...]
"""
import json
import subprocess
import sys
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw

sys.path.insert(0, str(Path(__file__).parent))
import remove_shadows as RS  # noqa: E402
from remove_base_rings import ring_mask  # noqa: E402

ROOT = Path(__file__).resolve().parent.parent
STRIDE = 100000
T = 16
ALPHA = 64


def main(args):
    mid = args[0]
    ref = args[args.index('--ref') + 1]
    rects = [tuple(map(int, r.split(','))) for r in args[args.index('--ref') + 2:]]
    from convert_maps_v2 import Builder, load_catalog
    bd = Builder(load_catalog())
    catalogue = json.loads((RS.V2 / 'catalogue.json').read_text())
    cat_img = Image.open(RS.V2 / 'catalogue.png').convert('RGBA')
    tile_of, _ = RS.object_test(bd, catalogue, cat_img)
    rel = f'src/data/builtMaps/{mid}.json'
    old = json.loads(subprocess.run(['git', 'show', f'{ref}:{rel}'], capture_output=True, text=True, cwd=ROOT).stdout)
    path = ROOT / rel
    m = json.loads(path.read_text())
    W, sheets = m['width'], m['sheets']
    if 'auto' not in sheets:
        sheets.append('auto')
    auto = sheets.index('auto') * STRIDE
    for x0, y0, w, h in rects:
        big = Image.new('RGBA', (w * T, h * T))
        for L in ('decor', 'dessus'):
            for j in range(h):
                for i in range(w):
                    v = old['layers'][L][(y0 + j) * W + x0 + i]
                    for r in (v if isinstance(v, list) else [v]):
                        if r >= 0:
                            big.alpha_composite(tile_of(old['sheets'][r // STRIDE], r % STRIDE).convert('RGBA'), (i * T, j * T))
        ring = ring_mask(np.array(big))
        ys, xs = np.nonzero(ring)
        if not len(xs):
            print(f'({x0},{y0}) : pas de halo trouvé')
            continue
        shade = Image.new('RGBA', big.size)
        bx0, bx1, by1 = xs.min(), xs.max(), ys.max()
        hgt = max(4, min(8, (by1 - ys.min() + 1)))
        ImageDraw.Draw(shade).ellipse((bx0 + 1, by1 - hgt + 1, bx1 - 1, by1), fill=(0, 0, 0, ALPHA))
        for j in range(h):
            for i in range(w):
                t = shade.crop((i * T, j * T, (i + 1) * T, (j + 1) * T))
                if t.getbbox() is None:
                    continue
                k = bd.image_tile(t)
                RS.remember_kind(k, 'objet')
                c = (y0 + j) * W + x0 + i
                v = m['layers']['decor'][c]
                st = [r for r in (v if isinstance(v, list) else [v]) if r >= 0]
                m['layers']['decor'][c] = [auto + k] + st if st else auto + k
        print(f'({x0},{y0}) : ombre {bx1 - bx0 + 1} x {hgt} px')
    path.write_text(json.dumps(m, ensure_ascii=False))
    bd.save_auto_sheet()
    RS.save_kinds()


if __name__ == '__main__':
    main(sys.argv[1:])
