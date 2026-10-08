#!/usr/bin/env python3
"""Contour d'un objet précis d'une carte du créateur (check-up visuel, octobre 2026) : le même trait d'un pixel gris
très foncé que les bâtiments et le mobilier (scripts/outline_buildings.py outlined), pour un objet que l'outil général
laisse de côté (posé sur l'eau : les pontons de bois). L'objet est l'ensemble des cases Décor du rectangle donné ; ses
cases sont remplacées par leur version avec contour (cases assemblées de la planche auto).

Usage : python3 scripts/outline_objects.py <carte>:<x>,<y>,<w>,<h>[:<côtés>] [...]
  côtés : lettres g (gauche), d (droite), h (haut), b (bas) à tracer (défaut : gdhb) ; ex. « gd » pour une passerelle
  qui relie deux chemins (pas de trait à ses bouts).
"""
import json
import sys
from pathlib import Path

from PIL import Image

sys.path.insert(0, str(Path(__file__).parent))
import remove_shadows as RS  # noqa: E402
from outline_buildings import outlined  # noqa: E402

TILE = 16
STRIDE = 100000


def stack(v):
    return [r for r in (v if isinstance(v, list) else [v]) if r >= 0]


def main(args):
    from convert_maps_v2 import Builder, load_catalog
    bd = Builder(load_catalog())
    catalogue = json.loads((RS.V2 / 'catalogue.json').read_text())
    cat_img = Image.open(RS.V2 / 'catalogue.png').convert('RGBA')
    tile_of, _ = RS.object_test(bd, catalogue, cat_img)
    for arg in args:
        mid, rect, *rest = arg.split(':')
        sides = rest[0] if rest else 'gdhb'
        x0, y0, w, h = (int(v) for v in rect.split(','))
        path = RS.MAPS / f'{mid}.json'
        m = json.loads(path.read_text())
        W, sheets = m['width'], m['sheets']
        if 'auto' not in sheets:
            sheets.append('auto')
        slot = sheets.index('auto')
        img = Image.new('RGBA', (w * TILE, h * TILE))
        for j in range(h):
            for i in range(w):
                for r in stack(m['layers']['decor'][(y0 + j) * W + x0 + i]):
                    img.alpha_composite(tile_of(sheets[r // STRIDE], r % STRIDE).convert('RGBA'), (i * TILE, j * TILE))
        out = outlined(img)
        # Côtés sans trait : on y remet les pixels d'origine (le bord qui touche un chemin, une plage).
        for side, box in (('h', (0, 0, w * TILE, 1)), ('b', (0, h * TILE - 1, w * TILE, h * TILE)),
                          ('g', (0, 0, 1, h * TILE)), ('d', (w * TILE - 1, 0, w * TILE, h * TILE))):
            if side not in sides:
                out.paste(img.crop(box), box[:2])
        changed = 0
        for j in range(h):
            for i in range(w):
                c = (y0 + j) * W + x0 + i
                if not stack(m['layers']['decor'][c]):
                    continue
                t = out.crop((i * TILE, j * TILE, (i + 1) * TILE, (j + 1) * TILE))
                k = bd.image_tile(t)
                RS.remember_kind(k)
                m['layers']['decor'][c] = slot * STRIDE + k
                changed += 1
        path.write_text(json.dumps(m, ensure_ascii=False))
        print(f'{mid} ({x0}, {y0}) : contour sur {changed} case(s)')
    bd.save_auto_sheet()
    RS.save_kinds()


if __name__ == '__main__':
    main(sys.argv[1:])
