"""Fort-de-France : lecture du sol de la carte (herbe, plage, mer, chemin, hautes herbes, ponton) d'après ses cases.
Utilisé par identites.py (côte ronde, sans lagon)."""
import re

from ds_theme import TERRAINS, GRASS, GRASS_BITS

STRIDE = 100000
QUADS = re.compile(r"\('quads', '(\w[\w-]*)', \(\((\d+), (\d+)\), \((\d+), (\d+)\), \((\d+), (\d+)\), \((\d+), (\d+)\)\)\)")


def block(spec):
    ox, oy = spec['outer']
    cells = {(ox + i, oy + j) for i in range(3) for j in range(3)} | {tuple(c) for c in spec['inner']} | {spec['center']}
    return cells


BEACH = block(TERRAINS['beach'])
PATH = block(TERRAINS['path']) if 'path' in TERRAINS else set()
GRASSES = {tuple(GRASS[1:])} | {tuple(t[1:]) for t in GRASS_BITS}


def read_ground(bd, m, kinds):
    W, H = m['width'], m['height']
    keys = {i: k for k, i in bd.auto_index.items()}
    out = [[None] * W for _ in range(H)]
    for y in range(H):
        for x in range(W):
            cell = m['layers']['sol'][y * W + x]
            refs = [r for r in (cell if isinstance(cell, list) else [cell]) if r >= 0]
            sheet = m['sheets'][refs[-1] // STRIDE] if refs else None
            k = kinds[y][x]
            if sheet == 'g4-mobilier':
                g = 'pier'
            elif k in ('water', 'path', 'tall'):
                g = k
            else:
                g = 'other'
                r = refs[0] if refs else -1
                s0 = m['sheets'][r // STRIDE] if r >= 0 else None
                if s0 == 'dppt':
                    cr = ((r % STRIDE) % 8, (r % STRIDE) // 8)
                    g = 'grass' if cr in GRASSES or cr in {(4, 0), (4, 1), (4, 2), (3, 2), (3, 3)} else \
                        'beach' if cr in BEACH else 'path' if cr in PATH else 'other'
                elif s0 == 'auto':
                    key = keys.get(r % STRIDE)
                    if key and key[0] == 'quads' and key[1] == 'dppt':
                        qs = set(key[2])
                        g = 'beach' if qs <= BEACH else 'path' if qs <= PATH else 'other'
            out[y][x] = g
    return out
