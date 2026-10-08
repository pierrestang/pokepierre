#!/usr/bin/env python3
"""Pièces HGSS du pack de SirMaIo (ASSETTILESPOKEMONV2/references/hgss-interieurs/tiled) : lecture des cartes Tiled et
découpe d'une pièce en cases de 16 px, à l'échelle du jeu (les planches du pack sont en cases de 32 px).

- Calques : Floor_* -> sol ; Wall_*, Shadow_*, Props_* et Black du niveau 1 -> décor ; niveaux 2 et plus (suffixe _2…_6)
  -> au-dessus de Pierre (haut des plantes, dossiers…), sauf Black (vide noir, au décor). Les calques techniques
  (passages, systemtags, borders, terrain) ne sont pas dessinés.
- Collisions : calque « passages » (case vide : praticable ; autre case : bloquée).
- `rooms(tmx)` : les pièces d'une carte (zones d'un seul tenant), pour choisir ; `room(tmx, x0, y0, w, h)` : une pièce.

Crédit : « Intérieurs HGSS ripés et préparés par SirMaIo » (ASSETTILESPOKEMONV2/credits/sirmaio.txt).

Usage : python3 scripts/hgss_rooms.py [carte…] [--apercu <dossier>]   (liste les pièces et en fait des aperçus)
"""
import os
import re
import sys
import xml.etree.ElementTree as ET
from functools import lru_cache
from pathlib import Path

import numpy as np
from PIL import Image
from scipy import ndimage

ROOT = Path(__file__).resolve().parent.parent
TILED = ROOT / 'ASSETTILESPOKEMONV2' / 'references' / 'hgss-interieurs' / 'tiled'
SHEETS = ROOT / 'ASSETTILESPOKEMONV2' / 'tilesets' / 'interieurs' / 'hgss-sirmaio'
T = 16
TECH = re.compile(r'passage|systemtag|terrain|border', re.I)
FLIP_H, FLIP_V, FLIP_D = 0x80000000, 0x40000000, 0x20000000


def maps():
    return sorted(p.stem for p in (TILED / 'Maps').glob('*.tmx'))


@lru_cache(None)
def tileset(tsx_name):
    """Image du jeu de cases (fond rose ou jaune retiré) et ses dimensions, ou None (jeu technique ou absent)."""
    path = TILED / 'Tilesets' / tsx_name
    if TECH.search(tsx_name) or not path.exists():
        return None
    t = ET.parse(path).getroot()
    img = t.find('image')
    src = SHEETS / os.path.basename(img.get('source'))
    if not src.exists():
        return None
    a = np.array(Image.open(src).convert('RGBA'))
    for key in ((240, 91, 161), (255, 245, 104), (255, 0, 255)):
        a[(a[..., 0] == key[0]) & (a[..., 1] == key[1]) & (a[..., 2] == key[2])] = 0
    tw = int(t.get('tilewidth'))
    return {'img': Image.fromarray(a), 'tw': tw, 'th': int(t.get('tileheight')),
            'cols': int(t.get('columns') or 0) or a.shape[1] // tw}


@lru_cache(None)
def load(name):
    """Carte Tiled : {'w', 'h', 'layers': [(nom, niveau, {(x, y): gid})], 'sets': [(firstgid, tsx)]}."""
    m = ET.parse(TILED / 'Maps' / f'{name}.tmx').getroot()
    sets = sorted((int(ts.get('firstgid')), os.path.basename(ts.get('source'))) for ts in m.findall('tileset'))
    layers = []
    for layer in m.iter('layer'):
        data = layer.find('data')
        cells = {}
        chunks = data.findall('chunk')
        if chunks:
            for c in chunks:
                cx, cy, cw = int(c.get('x')), int(c.get('y')), int(c.get('width'))
                for i, v in enumerate(int(v) for v in (c.text or '').replace('\n', '').split(',') if v.strip()):
                    if v:
                        cells[(cx + i % cw, cy + i // cw)] = v
        else:
            w = int(layer.get('width'))
            for i, v in enumerate(int(v) for v in (data.text or '').replace('\n', '').split(',') if v.strip()):
                if v:
                    cells[(i % w, i // w)] = v
        n = layer.get('name', '')
        mm = re.search(r'_(\d+)$', n)
        layers.append((n, int(mm.group(1)) if mm else 1, cells, layer.get('visible') != '0'))
    return {'w': int(m.get('width')), 'h': int(m.get('height')), 'layers': layers, 'sets': sets}


def tile_image(m, gid):
    """La case (16 px) d'un gid de la carte, retournements compris, ou None."""
    raw = gid & 0x1FFFFFFF
    if not raw:
        return None
    fg, tsx = max((s for s in m['sets'] if s[0] <= raw), key=lambda s: s[0])
    ts = tileset(tsx)
    if not ts:
        return None
    k = raw - fg
    c = ts['cols']
    t = ts['img'].crop(((k % c) * ts['tw'], (k // c) * ts['th'], (k % c + 1) * ts['tw'], (k // c + 1) * ts['th']))
    if gid & FLIP_D:
        t = t.transpose(Image.TRANSPOSE)
    if gid & FLIP_H:
        t = t.transpose(Image.FLIP_LEFT_RIGHT)
    if gid & FLIP_V:
        t = t.transpose(Image.FLIP_TOP_BOTTOM)
    return t.resize((T, T), Image.NEAREST) if t.width != T else t


def kind(name, level):
    if TECH.search(name):
        return None
    if name.startswith('Black'):
        return 'decor'
    if name.startswith('Floor'):
        return 'sol'
    if name.startswith('Shadow'):
        return None                 # pas d'ombres portées (même direction artistique que l'extérieur)
    return 'decor' if level <= 1 else 'dessus'


def room(name, x0, y0, w, h, only=None):
    """Une pièce : {'w', 'h', 'sol', 'decor', 'dessus': [[images…] par case], 'solid': [0/1]}. `only` : seulement les
    calques dont le nom commence ainsi (ex. ('Floor', 'Wall') : le mur nu, sans les meubles posés devant)."""
    m = load(name)
    out = {k: [[] for _ in range(w * h)] for k in ('sol', 'decor', 'dessus')}
    solid = [1] * (w * h)
    passages = next((c for n, _, c, _ in m['layers'] if n.lower().startswith('passage')), None)
    for n, level, cells, visible in m['layers']:
        k = kind(n, level)
        if not k or not visible or (only and not n.startswith(tuple(only))):
            continue
        for (x, y), gid in cells.items():
            if x0 <= x < x0 + w and y0 <= y < y0 + h:
                t = tile_image(m, gid)
                if t is not None and np.array(t)[..., 3].any():
                    out[k][(y - y0) * w + (x - x0)].append(t)
    # Praticable : une case de sol sans passage bloquant.
    for y in range(h):
        for x in range(w):
            i = y * w + x
            floor = bool(out['sol'][i])
            blocked = passages is not None and passages.get((x0 + x, y0 + y), 0) != 0
            solid[i] = 0 if floor and not blocked else 1
    out.update(w=w, h=h, solid=solid)
    return out


def rooms(name):
    """Les pièces de la carte : groupes de cases dessinées (sol, murs, meubles ; ni vide noir ni calques techniques)
    d'un seul tenant, séparés par du vide, qui contiennent du sol ; (x0, y0, w, h)."""
    m = load(name)
    floor, drawn = set(), set()
    for n, level, cells, visible in m['layers']:
        if not visible or TECH.search(n) or n.startswith('Black'):
            continue
        drawn |= set(cells)
        if n.startswith('Floor'):
            floor |= set(cells)
    if not floor:
        return []
    ox = min(p[0] for p in drawn)
    oy = min(p[1] for p in drawn)
    grid = np.zeros((max(p[1] for p in drawn) - oy + 1, max(p[0] for p in drawn) - ox + 1), bool)
    for x, y in drawn:
        grid[y - oy, x - ox] = True
    lab, n = ndimage.label(grid)
    keep = {lab[y - oy, x - ox] for x, y in floor}
    out = []
    for k, sl in enumerate(ndimage.find_objects(lab), 1):
        if k in keep and (sl[0].stop - sl[0].start) * (sl[1].stop - sl[1].start) >= 16:
            out.append((sl[1].start + ox, sl[0].start + oy, sl[1].stop - sl[1].start, sl[0].stop - sl[0].start))
    return sorted(out, key=lambda r: (r[1], r[0]))


def render(r):
    img = Image.new('RGBA', (r['w'] * T, r['h'] * T), (0, 0, 0, 255))
    for k in ('sol', 'decor', 'dessus'):
        for i, stack in enumerate(r[k]):
            for t in stack:
                img.alpha_composite(t, ((i % r['w']) * T, (i // r['w']) * T))
    return img


if __name__ == '__main__':
    args = sys.argv[1:]
    apercu = None
    if '--apercu' in args:
        i = args.index('--apercu')
        apercu = Path(args[i + 1])
        args = args[:i] + args[i + 2:]
        apercu.mkdir(parents=True, exist_ok=True)
    for name in args or maps():
        for k, (x0, y0, w, h) in enumerate(rooms(name)):
            print(f'{name} #{k} : x {x0}, y {y0}, {w} x {h}')
            if apercu:
                render(room(name, x0, y0, w, h)).save(apercu / f'{name} #{k}.png')
