#!/usr/bin/env python3
"""Catalogue des intérieurs du créateur de cartes (mode simple, espace « Intérieurs ») : comme le catalogue des
extérieurs (scripts/build_catalogue.py -> catalogue.json), mais pour les pièces : sols et murs à peindre, meubles et déco
à poser, rangés par type de pièce. Données curées : scripts/interieurs/catalogue_int.py.

Écrit :
- public/assets/v2/catalogue-int.png : les cases (16 px, 16 colonnes). Planche qui ne fait que grandir : les anciens
  numéros ne bougent jamais quand on relance (les intérieurs déjà retouchés gardent leurs cases) ;
- public/assets/v2/catalogue-int.json : {"cols": 16, "themes": {id: {name, materials, elements}}} ;
- l'entrée « catalogue-int » de public/assets/v2/catalog.json.

Sans ombres portées (build_interiors.no_shadow sur chaque case, calques Shadow ignorés), sans rien d'identifiable Pokémon.

Usage : python3 scripts/build_interior_catalogue.py [--apercu <dossier>]   (aperçu : une planche par thème)
"""
import importlib.util
import json
import sys
from functools import lru_cache
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw
from scipy import ndimage

sys.path.insert(0, str(Path(__file__).resolve().parent))
import hgss_rooms as HG  # noqa: E402
import interieurs_plans as P  # noqa: E402
from build_interiors import no_shadow  # noqa: E402

ROOT = Path(__file__).resolve().parent.parent
V2 = ROOT / 'public' / 'assets' / 'v2'
SHEET = 'catalogue-int'
COLS = 16
T = 16

spec = importlib.util.spec_from_file_location('catalogue_int', ROOT / 'scripts' / 'interieurs' / 'catalogue_int.py')
C = importlib.util.module_from_spec(spec)
spec.loader.exec_module(C)


def clean(tile):
    """Pixels transparents remis à zéro : une case a la même clé avant et après un passage par le PNG."""
    a = np.array(tile.convert('RGBA'))
    a[a[..., 3] == 0] = 0
    return Image.fromarray(a)


class Packer:
    """Cases de la planche : les anciennes gardent leur numéro, les nouvelles s'ajoutent à la fin."""
    def __init__(self):
        self.tiles, self.index = [], {}
        old = V2 / f'{SHEET}.png'
        if old.exists():
            img = Image.open(old).convert('RGBA')
            for k in range(img.width // T * (img.height // T)):
                t = clean(img.crop(((k % COLS) * T, (k // COLS) * T, (k % COLS + 1) * T, (k // COLS + 1) * T)))
                self.index.setdefault(t.tobytes(), k)
                self.tiles.append(t)
            while self.tiles and not np.array(self.tiles[-1])[..., 3].any():     # fin de la dernière rangée
                self.tiles.pop()

    def add(self, tile):
        tile = clean(no_shadow(tile.convert('RGBA')))
        if not np.array(tile)[..., 3].any():
            return -1
        key = tile.tobytes()
        if key not in self.index:
            self.index[key] = len(self.tiles)
            self.tiles.append(tile)
        return self.index[key]

    def save(self):
        rows = max(1, -(-len(self.tiles) // COLS))
        img = Image.new('RGBA', (COLS * T, rows * T))
        for k, t in enumerate(self.tiles):
            img.paste(t, ((k % COLS) * T, (k // COLS) * T))
        img.save(V2 / f'{SHEET}.png')
        catalog = json.loads((V2 / 'catalog.json').read_text())
        entry = {'id': SHEET, 'name': 'Catalogue des intérieurs', 'file': f'{SHEET}.png', 'cols': COLS, 'rows': rows,
                 'empty': [], 'author': 'SirMaIo (HGSS) et dessins du projet', 'gen': 4, 'hidden': True}
        sheets = catalog['sheets']
        at = next((i for i, s in enumerate(sheets) if s['id'] == SHEET), None)
        if at is None:
            sheets.append(entry)
        else:
            sheets[at] = entry
        (V2 / 'catalog.json').write_text(json.dumps(catalog, ensure_ascii=False))
        return rows


# ---------- Sources HGSS ----------

def layers_of(name, prefixes):
    m = HG.load(name)
    return m, [(lv, c) for n, lv, c, vis in m['layers'] if vis and n.startswith(prefixes)]


@lru_cache(None)
def map_layer_image(name, prefixes):
    """Image RGBA des calques choisis de toute la carte, origine (ox, oy) en cases, et masque des pixels de niveau 1."""
    m, layers = layers_of(name, prefixes)
    pts = [xy for _, c in layers for xy in c]
    ox, oy = min(p[0] for p in pts), min(p[1] for p in pts)
    W, H = max(p[0] for p in pts) - ox + 1, max(p[1] for p in pts) - oy + 1
    img = Image.new('RGBA', (W * T, H * T))
    low = Image.new('RGBA', (W * T, H * T))
    for lv, c in sorted(layers, key=lambda t: t[0]):
        for (x, y), g in c.items():
            t = HG.tile_image(m, g)
            if t is None:
                continue
            img.alpha_composite(t, ((x - ox) * T, (y - oy) * T))
            if lv <= 1:
                low.alpha_composite(t, ((x - ox) * T, (y - oy) * T))
    a = np.array(img)
    lab, _ = ndimage.label(a[..., 3] > 0, structure=np.ones((3, 3)))
    return a, np.array(low)[..., 3] > 0, lab, ox, oy


def hgss_piece(name, x, y, w, h, prefixes):
    """Le meuble d'un seul tenant (au pixel près) dont les cases font le rectangle (x, y, w, h) : image (w x h cases),
    masque des cases occupées, masque des cases à pixels de niveau 1 (posées au sol, pas au-dessus de Pierre)."""
    a, low, lab, ox, oy = map_layer_image(name, prefixes)
    px0, py0 = (x - ox) * T, (y - oy) * T
    region = lab[py0:py0 + h * T, px0:px0 + w * T]
    best, best_n = None, 0
    for k in np.unique(region):
        if k == 0:
            continue
        ys, xs = np.nonzero(lab == k)
        if xs.min() // T != px0 // T or ys.min() // T != py0 // T or -(-(xs.max() + 1) // T) != px0 // T + w \
                or -(-(ys.max() + 1) // T) != py0 // T + h:
            continue
        n = len(xs)
        if n > best_n:
            best, best_n = k, n
    if best is None:
        raise ValueError(f'aucun meuble de {w} x {h} cases en ({x}, {y}) sur {name}')
    mask = lab[py0:py0 + h * T, px0:px0 + w * T] == best
    b = a[py0:py0 + h * T, px0:px0 + w * T].copy()
    b[~mask] = 0
    lowc = low[py0:py0 + h * T, px0:px0 + w * T] & mask
    occupied = [[bool(mask[j * T:(j + 1) * T, i * T:(i + 1) * T].any()) for i in range(w)] for j in range(h)]
    ground = [[bool(lowc[j * T:(j + 1) * T, i * T:(i + 1) * T].any()) for i in range(w)] for j in range(h)]
    return Image.fromarray(b), occupied, ground


def passable(name, x, y, w, h):
    """Cases praticables d'après le calque passages de la carte (1 : bloquée)."""
    return HG.room(name, x, y, w, h)['solid']


# ---------- Éléments ----------

def cells(img):
    return [[img.crop((i * T, j * T, (i + 1) * T, (j + 1) * T)) for i in range(img.width // T)]
            for j in range(img.height // T)]


def element(eid, name, cat, src, pack):
    kind = src[0]
    flat = cat in ('tapis',) or eid == 'tapis-sortie'
    wall = cat == 'deco'
    if kind in ('hg', 'hgmur'):
        _, mname, x, y, w, h = src
        prefixes = ('Props',) if kind == 'hg' else ('Wall_B', 'Wall_C', 'Wall_D')
        img, occupied, ground = hgss_piece(mname, x, y, w, h, prefixes)
        blocked = passable(mname, x, y, w, h)
        solid = [[0 if (flat or wall) else (1 if occupied[j][i] and blocked[j * w + i] else 0) for i in range(w)]
                 for j in range(h)]
        # Un meuble posé au milieu d'une pièce bloque au moins sa rangée du bas occupée.
        if not (flat or wall) and not any(any(r) for r in solid):
            last = max(j for j in range(h) if any(occupied[j]))
            solid[last] = [1 if occupied[last][i] else 0 for i in range(w)]
    else:
        spec = P.item(src[1])
        img = spec['img']()
        if spec.get('dx') or spec.get('dy'):
            dx, dy = spec.get('dx', 0), spec.get('dy', 0)
            up = -(-max(0, -dy) // T)
            canvas = Image.new('RGBA', (img.width, img.height + (up + (1 if dy > 0 else 0)) * T))
            canvas.alpha_composite(img, (dx if dx > 0 else 0, up * T + dy))
            img = canvas
        h, w = img.height // T, img.width // T
        if flat or wall:
            solid = [[0] * w for _ in range(h)]
        elif 'solid_top' in spec:
            solid = [[1 if j < spec['solid_top'] else 0 for _ in range(w)] for j in range(h)]
        else:
            blocks = spec.get('solid', 1)
            solid = blocks if isinstance(blocks, list) else [[1 if j >= h - blocks else 0 for _ in range(w)]
                                                             for j in range(h)]
            if spec.get('flat'):
                solid = [[0] * w for _ in range(h)]
    rows = cells(img)
    tiles = [[pack.add(t) for t in row] for row in rows]
    h, w = len(tiles), len(tiles[0])
    # Rangées du haut posées au-dessus de Pierre : celles qui ne bloquent pas, au-dessus de la première qui bloque
    # (le haut d'un meuble debout) ; rien pour un tapis, la déco murale ou un objet posé à plat.
    first = next((j for j, r in enumerate(solid) if any(r)), h)
    over = 0 if (flat or wall) else first
    # Rangées entièrement vides (un objet décalé) : retirées en haut et en bas.
    while h > 1 and all(t < 0 for t in tiles[0]):
        tiles, solid, h, over = tiles[1:], solid[1:], h - 1, max(0, over - 1)
    while h > 1 and all(t < 0 for t in tiles[-1]):
        tiles, solid, h = tiles[:-1], solid[:-1], h - 1
    return {'id': eid, 'name': name, 'cat': cat, 'w': w, 'h': h, 'tiles': tiles, 'solid': solid, 'over': over,
            'place': 'land', 'door': None}


def floor(mid, name, src, pack):
    _, mname, x, y = src
    r = HG.room(mname, x, y, 2, 2, only=('Floor',))
    tiles = []
    for j in range(2):
        row = []
        for i in range(2):
            img = Image.new('RGBA', (T, T))
            for t in r['sol'][j * 2 + i]:
                img.alpha_composite(t)
            row.append(pack.add(img))
        tiles.append(row)
    return {'id': mid, 'name': name, 'kind': 'pattern', 'tiles': tiles, 'solid': 0}


def wall(mid, name, src, pack):
    _, mname, x, y, h = src
    r = HG.room(mname, x, y, 2, h, only=('Floor', 'Wall_A'))
    tiles = []
    for j in range(h):
        imgs = []
        for i in range(2):
            img = Image.new('RGBA', (T, T))
            for k in ('sol', 'decor', 'dessus'):
                for t in r[k][j * 2 + i]:
                    img.alpha_composite(t)
            imgs.append(img)
        # Une rangée de vide noir (le dessus du mur, hors de la pièce) n'est pas du mur.
        a = np.array([np.array(im) for im in imgs])
        if (a[..., 3] == 0).all() or ((a[..., :3].astype(int).sum(-1) < 30) | (a[..., 3] == 0)).mean() > 0.9:
            continue
        tiles.append([pack.add(im) for im in imgs])
    return {'id': mid, 'name': name, 'kind': 'wall', 'tiles': tiles, 'solid': 1}


def build():
    pack = Packer()
    themes = {tid: {'name': tname, 'materials': [], 'elements': []} for tid, tname in C.THEMES}
    for mid, name, ths, src in C.FLOORS:
        mat = floor(mid, name, src, pack)
        for t in ['libre', *ths]:
            themes[t]['materials'].append(mat)
    for mid, name, ths, src in C.WALLS:
        mat = wall(mid, name, src, pack)
        for t in ['libre', *ths]:
            themes[t]['materials'].append(mat)
    for eid, name, cat, ths, src in C.ELEMENTS:
        el = element(eid, name, cat, src, pack)
        for t in ['libre', *ths]:
            themes[t]['elements'].append(el)
    rows = pack.save()
    out = {'cols': COLS, 'themes': themes}
    (V2 / f'{SHEET}.json').write_text(json.dumps(out, ensure_ascii=False, separators=(',', ':')))
    n = {t: (len(v['materials']), len(v['elements'])) for t, v in themes.items()}
    print(f'{SHEET}.png : {len(pack.tiles)} cases ({rows} rangées) ; thèmes (matières, éléments) : {n}')
    return out


def preview(cat, folder):
    """Une planche par thème : matières puis éléments, avec leur nom."""
    folder.mkdir(parents=True, exist_ok=True)
    sheet = Image.open(V2 / f'{SHEET}.png').convert('RGBA')
    tile = lambda k: sheet.crop(((k % COLS) * T, (k // COLS) * T, (k % COLS + 1) * T, (k // COLS + 1) * T))
    for tid, th in cat['themes'].items():
        items = [(m['name'], m['tiles']) for m in th['materials']] + [(e['name'], e['tiles']) for e in th['elements']]
        cw, chh, per_row = 132, 120, 8
        img = Image.new('RGBA', (per_row * cw, -(-len(items) // per_row) * chh), (96, 112, 96, 255))
        d = ImageDraw.Draw(img)
        for n, (name, tiles) in enumerate(items):
            h, w = len(tiles), len(tiles[0])
            im = Image.new('RGBA', (w * T, h * T))
            for j in range(h):
                for i in range(w):
                    if tiles[j][i] >= 0:
                        im.alpha_composite(tile(tiles[j][i]), (i * T, j * T))
            z = min(124 / im.width, 96 / im.height, 3)
            im = im.resize((max(1, int(im.width * z)), max(1, int(im.height * z))), Image.NEAREST)
            X, Y = (n % per_row) * cw, (n // per_row) * chh
            img.alpha_composite(im, (X + 4, Y + 20))
            d.text((X + 3, Y + 3), name[:22], fill=(255, 255, 200))
        img.save(folder / f'{tid}.png')


if __name__ == '__main__':
    cat = build()
    if '--apercu' in sys.argv:
        preview(cat, Path(sys.argv[sys.argv.index('--apercu') + 1]))
