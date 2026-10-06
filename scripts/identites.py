#!/usr/bin/env python3
"""Identité visuelle de chaque ville (octobre 2026, après la revue d'ensemble) : sols, bordures, mobilier urbain,
palettes de bâtiments et élément signature propres à chaque carte, de Fort-de-France à Hull.

Part des cartes de scripts/g4_enrich.py (de Saint-Ay à Hull, recalculées depuis le tag avant-refonte-g4) et, pour
Fort-de-France, de la carte du tag avant-identites (avec ses retouches faites dans le créateur). Chaque ville (VILLES)
applique ses opérations : recolorations (bâtiments, pavés, forêt, réverbères), remplacements (bordure, sol), objets et
mobilier. Le mobilier qui ajoute des cases bloquantes passe par g4_enrich.check_access (jamais sur un chemin, une porte,
une case de l'histoire ; rien ne devient inaccessible).

Recolorations : un même modèle de bâtiment n'apparaît pas tel quel dans plus de deux villes ; au-delà, il est recoloré
(brique et ardoise à Hull, pierre blonde et zinc à Bordeaux…).

Usage : python3 scripts/identites.py [id…]      (sans id : toutes les villes)
Puis : python3 scripts/audit_maps.py et node scripts/check_paths.js.
"""
import colorsys
import json
import subprocess
import sys

import numpy as np
from PIL import Image
from scipy import ndimage

import g4_enrich as G
from convert_maps_v2 import Builder, load_catalog, ROOT, TILE

STRIDE = 100000
BUILDING_SHEETS = {'g4-batiments'}


# ---------- Couleurs ----------
def hsv_map(img, fn):
    """Applique fn(h, s, v) -> (h, s, v) (tableaux, h en degrés) aux pixels visibles d'une image RGBA."""
    a = np.array(img.convert('RGBA')).astype(float) / 255
    rgb, alpha = a[..., :3], a[..., 3]
    mx, mn = rgb.max(-1), rgb.min(-1)
    v = mx
    s = np.where(mx > 0, (mx - mn) / np.maximum(mx, 1e-6), 0)
    d = np.maximum(mx - mn, 1e-6)
    r, g, b = rgb[..., 0], rgb[..., 1], rgb[..., 2]
    h = np.select([mx == r, mx == g], [((g - b) / d) % 6, (b - r) / d + 2], (r - g) / d + 4) * 60
    h = np.where(mx == mn, 0, h)
    h2, s2, v2 = fn(h.copy(), s.copy(), v.copy())
    h2, s2, v2 = h2 % 360, np.clip(s2, 0, 1), np.clip(v2, 0, 1)
    c = v2 * s2
    x = c * (1 - np.abs((h2 / 60) % 2 - 1))
    m = v2 - c
    k = (h2 // 60).astype(int)
    rr = np.choose(k % 6, [c, x, 0 * c, 0 * c, x, c])
    gg = np.choose(k % 6, [x, c, c, x, 0 * c, 0 * c])
    bb = np.choose(k % 6, [0 * c, 0 * c, x, c, c, x])
    out = np.stack([rr + m, gg + m, bb + m], -1)
    vis = alpha > 0
    rgb2 = np.where(vis[..., None], out, rgb)
    return Image.fromarray((np.dstack([rgb2, alpha]) * 255).round().astype(np.uint8))


def palette(roof=None, wall=None, wood=None, glass_keep=True, wall_min=0.45):
    """Recoloration d'un bâtiment : `roof`, `wall`, `wood` = (teinte, saturation, facteur de clarté) des pixels de toit
    (couleurs vives), de mur (clairs et peu saturés) et de bois (bruns). Les contours sombres et les vitres claires
    restent."""
    def fn(h, s, v):
        dark = v < 0.22
        glass = glass_keep & (h > 180) & (h < 230) & (v > 0.78) & (s < 0.45)
        brown = (h >= 15) & (h <= 45) & (s >= 0.25) & (s < 0.75) & (v < 0.75)
        vivid = (s >= 0.35) & ~brown
        light = (s < 0.35) & (v >= wall_min)
        for mask, spec in ((vivid, roof), (light, wall), (brown, wood)):
            if spec is None:
                continue
            m = mask & ~dark & ~glass
            th, ts, tv = spec
            h = np.where(m, th, h)
            s = np.where(m, np.minimum(1, ts * (0.6 + 0.8 * s)), s)
            v = np.where(m, v * tv, v)
        return h, s, v
    return lambda img: hsv_map(img, fn)


def tint(hue, sat, value=1.0, only=None):
    """Teinte uniforme (garde la clarté) ; `only(h, s, v)` : masque des pixels concernés."""
    def fn(h, s, v):
        m = only(h, s, v) if only else np.ones_like(h, bool)
        return np.where(m, hue, h), np.where(m, sat, s), np.where(m, v * value, v)
    return lambda img: hsv_map(img, fn)


# ---------- Carte en cours de transformation ----------
class Ville:
    def __init__(self, bd, map_id, m, kinds):
        self.bd, self.id, self.m, self.kinds = bd, map_id, m, kinds
        self.W, self.H = m['width'], m['height']
        self.solid0 = list(m['solid'])
        self.new_solid = set()
        self.cache = {}
        self.notes = []

    # Références de cases.
    def ref(self, sheet, index):
        if sheet not in self.m['sheets']:
            self.m['sheets'].append(sheet)
        return self.m['sheets'].index(sheet) * STRIDE + index

    def ref_img(self, r):
        sheet, k = self.m['sheets'][r // STRIDE], r % STRIDE
        if sheet == 'auto':
            return self.bd.auto_tiles[k]
        c = self.bd.cols[sheet]
        return self.bd.tile_image(sheet, k % c, k // c)

    def img_ref(self, img):
        return self.ref('auto', self.bd.image_tile(img))

    def stack(self, layer, x, y):
        cell = self.m['layers'][layer][y * self.W + x]
        return [r for r in (cell if isinstance(cell, list) else [cell]) if r != -1]

    def set_stack(self, layer, x, y, refs):
        self.m['layers'][layer][y * self.W + x] = (refs[0] if len(refs) == 1 else refs) if refs else -1

    def cell_img(self, layer, x, y):
        out = Image.new('RGBA', (TILE, TILE))
        for r in self.stack(layer, x, y):
            out.alpha_composite(self.ref_img(r))
        return out

    def sheet_of(self, r):
        return self.m['sheets'][r // STRIDE]

    def solid(self, x, y):
        return bool(self.solid0[y * self.W + x]) or (x, y) in self.new_solid

    # Recolorations.
    def recolor_cells(self, cells, layers, fn):
        """Toute la pile de chaque case (calques donnés) fondue puis recolorée."""
        for x, y in cells:
            for layer in layers:
                if self.stack(layer, x, y):
                    self.set_stack(layer, x, y, [self.img_ref(fn(self.cell_img(layer, x, y)))])

    def recolor_refs(self, select, fn, layers=('sol', 'decor', 'dessus')):
        """Chaque case posée qui répond à select(planche, index, image) est remplacée par sa version recolorée."""
        for layer in layers:
            for y in range(self.H):
                for x in range(self.W):
                    refs = self.stack(layer, x, y)
                    new = []
                    for r in refs:
                        sheet, k = self.sheet_of(r), r % STRIDE
                        if select(sheet, k):
                            key = (r, id(fn))
                            if key not in self.cache:
                                self.cache[key] = self.img_ref(fn(self.ref_img(r)))
                            r = self.cache[key]
                        new.append(r)
                    if new != refs:
                        self.set_stack(layer, x, y, new)

    def building_cells(self, rects=None):
        """Cases des bâtiments : celles qui portent une case de bâtiment (calques Décor et Au-dessus), plus les cases
        assemblées enclavées entre elles ; ou, si `rects`, les rectangles (x0, y0, x1, y1) donnés."""
        if rects:
            return {(x, y) for x0, y0, x1, y1 in rects for y in range(y0, y1 + 1) for x in range(x0, x1 + 1)}
        cells = set()
        for y in range(self.H):
            for x in range(self.W):
                for layer in ('decor', 'dessus'):
                    if any(self.sheet_of(r) in BUILDING_SHEETS for r in self.stack(layer, x, y)):
                        cells.add((x, y))
        return cells

    # Objets et mobilier.
    def element(self, sheet, c0, r0, w, h, isolate=False, cut=False, fn=None):
        full = self.bd.images[sheet].crop((c0 * TILE, r0 * TILE, (c0 + w) * TILE, (r0 + h) * TILE))
        arr = np.array(full)
        if cut:                       # fond uni (eau, sable) retiré : la couleur la plus présente
            px = arr[..., :3].reshape(-1, 3)
            vals, counts = np.unique(px[arr[..., 3].reshape(-1) > 0], axis=0, return_counts=True)
            bg = vals[counts.argmax()]
            arr[(np.abs(arr[..., :3].astype(int) - bg).sum(-1) < 30)] = 0
        if isolate:
            labels, _ = ndimage.label(arr[..., 3] > 0)
            arr[labels != np.bincount(labels.ravel())[1:].argmax() + 1] = 0
        full = Image.fromarray(arr)
        return fn(full) if fn else full

    def place(self, img, ax, ay, solid_from, block=True, min_fill=12):
        """Pose une image (cases entières) en (ax, ay) : rangées >= solid_from dans le Décor (bloquantes si `block`),
        les autres au-dessus de Pierre."""
        w, h = img.width // TILE, img.height // TILE
        for j in range(h):
            for i in range(w):
                tile = img.crop((i * TILE, j * TILE, (i + 1) * TILE, (j + 1) * TILE))
                if not tile.getbbox():
                    continue
                x, y = ax + i, ay + j
                layer = 'decor' if j >= solid_from else 'dessus'
                self.set_stack(layer, x, y, self.stack(layer, x, y) + [self.img_ref(tile)])
                if layer == 'decor' and block and not self.solid(x, y) and (np.array(tile)[..., 3] > 200).sum() >= min_fill:
                    self.new_solid.add((x, y))

    def clear(self, cells, layers=('decor', 'dessus')):
        for x, y in cells:
            for layer in layers:
                self.set_stack(layer, x, y, [])

    def finish(self, protected, points):
        """Vérifie l'accessibilité (mobilier) puis écrit les nouvelles collisions."""
        G.check_access(self.id, self.W, self.H, self.solid0, self.new_solid, protected, points)
        for x, y in self.new_solid:
            self.m['solid'][y * self.W + x] = 1


VILLES = {}


def ville(map_id):
    def deco(fn):
        VILLES[map_id] = fn
        return fn
    return deco


def base(bd, map_id):
    """La carte de départ : celle de g4_enrich (Saint-Ay à Hull), ou celle du tag avant-identites (Fort-de-France)."""
    if map_id in G.PLANS:
        m, _ = G.enrich(bd, map_id)
    else:
        m = json.loads(subprocess.check_output(['git', 'show', f'avant-identites:src/data/builtMaps/{map_id}.json'],
                                               cwd=ROOT))
    return m


def main():
    ids = sys.argv[1:] or list(VILLES)
    G.GAME_ID.setdefault('fort-de-france', 'fortDeFrance')
    G.STORY_POINTS = json.loads(subprocess.check_output(['node', str(ROOT / 'scripts' / 'export_story_points.mjs')],
                                                        cwd=ROOT))
    bd = Builder(load_catalog())
    done = {}
    for map_id in ids:
        m = base(bd, map_id)
        v = Ville(bd, map_id, m, G.classify(bd, m))
        _, pts = G.game_points(map_id)
        story = {tuple(c) for c in G.STORY_POINTS[G.GAME_ID.get(map_id, 'fortDeFrance')]}
        protected = pts | story | {(x, y) for y in range(v.H) for x in range(v.W) if v.kinds[y][x] in ('path', 'tall')}
        VILLES[map_id](v)
        v.finish(protected, pts | story)
        done[map_id] = v
    bd.save_auto_sheet()
    for map_id, v in done.items():
        (ROOT / 'src' / 'data' / 'builtMaps' / f'{map_id}.json').write_text(json.dumps(v.m, ensure_ascii=False) + '\n')
        print(f'{map_id:22} {len(v.new_solid)} cases bloquantes ajoutées' + (' ; ' + ' ; '.join(v.notes) if v.notes else ''))


# ---------- Villes ----------
from g4_theme import COBBLE  # noqa: E402  (pavés en chevrons des villes : 4 cases)

DPPT_COLS = 8
dppt = lambda c, r: r * DPPT_COLS + c
DPPT_LAMP = {dppt(7, 129), dppt(7, 130), dppt(7, 131)}
DPPT_TREE = {dppt(7, 106), dppt(7, 107)}                 # petit arbre rond des pelouses de ville ('ƀ')


def is_cobble(v):
    keys = {(t[0], v.bd.index(*t)) for t in COBBLE}
    return lambda sheet, k: (sheet, k) in keys


def building_cells_all(v):
    """Bâtiments de la bibliothèque Gen 4 et maisons de la planche DPPt (rangées 150 et plus), avec les cases
    assemblées enclavées entre eux."""
    cells = set()
    for y in range(v.H):
        for x in range(v.W):
            for layer in ('decor', 'dessus'):
                for r in v.stack(layer, x, y):
                    sheet, k = v.sheet_of(r), r % STRIDE
                    if sheet in BUILDING_SHEETS or (sheet == 'dppt' and k // DPPT_COLS >= 150):
                        cells.add((x, y))
    for _ in range(2):
        for y in range(v.H):
            for x in range(v.W):
                if (x, y) in cells:
                    continue
                around = sum((x + dx, y + dy) in cells for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)))
                auto = any(v.sheet_of(r) == 'auto' for layer in ('decor', 'dessus') for r in v.stack(layer, x, y))
                if auto and around >= 2:
                    cells.add((x, y))
    return cells


def victorian(img):
    """Réverbère DPPt (poteau bleu-vert, globe clair) -> fonte noire, lumière chaude."""
    def fn(h, s, v):
        light = v > 0.8
        metal = (s > 0.12) & ~light
        h = np.where(light, 48, h)
        s = np.where(light, 0.45, np.where(metal, 0.08, s))
        v = np.where(metal, v * 0.35, v)
        return h, s, v
    return hsv_map(img, fn)


def greener(value, hue=None):
    """Herbe et feuillages (verts) plus sombres ou d'une autre teinte."""
    def fn(h, s, v):
        g = (h > 70) & (h < 175) & (s > 0.15)
        return (np.where(g, hue, h) if hue is not None else h), s, np.where(g, v * value, v)
    return lambda img: hsv_map(img, fn)


@ville('hull')
def hull(v):
    """Ville anglaise : brique rouge et ardoise sombre, pavés de brique, herbe sombre sous la pluie, réverbères
    victoriens ; signature : les docks, un cargo à grues à quai."""
    v.recolor_cells(building_cells_all(v), ('decor', 'dessus'),
                    palette(roof=(215, 0.12, 0.62), wall=(6, 0.62, 0.86), wood=(8, 0.55, 0.8)))
    v.recolor_refs(is_cobble(v), tint(16, 0.34, 0.66), layers=('sol',))
    v.recolor_cells([(x, y) for y in range(v.H) for x in range(v.W)], ('sol',), greener(0.8, hue=135))
    v.recolor_refs(lambda sheet, k: sheet == 'dppt' and k in DPPT_LAMP, victorian, layers=('decor', 'dessus'))
    v.place(v.element('g4-vehicules', 0, 82, 9, 4, isolate=True), 0, 43, solid_from=0)
    v.notes.append('cargo à grues (planche Véhicules) ; brique : recoloration (pas de texture de brique sur les murs)')


@ville('bordeaux')
def bordeaux(v):
    """Grande ville de pierre blonde : façades et pavés blonds, toits de zinc, platanes ; signature : la grille en fer
    forgé des quais de la Garonne."""
    v.recolor_cells(building_cells_all(v), ('decor', 'dessus'),
                    palette(roof=(212, 0.16, 0.92), wall=(40, 0.30, 1.05), wood=(36, 0.32, 1.0), wall_min=0.3))
    v.recolor_refs(is_cobble(v), tint(40, 0.20, 1.1), layers=('sol',))
    v.recolor_refs(lambda sheet, k: sheet == 'dppt' and k in DPPT_TREE, greener(1.12, hue=82),
                   layers=('decor', 'dessus'))
    rail = v.element('g4-clotures', 0, 48, 4, 1)
    pieces = [rail.crop((i * TILE, 0, (i + 1) * TILE, TILE)) for i in range(4)]
    runs = [(0, 6), (9, 11), (18, 22), (25, 31)]          # quai nord, entre les ponts et la grande péniche
    for x0, x1 in runs:
        for x in range(x0, x1 + 1):
            piece = pieces[0] if x == x0 else pieces[3] if x == x1 else pieces[1 + x % 2]
            v.place(piece, x, 12, solid_from=0)
    v.notes.append('pas de tonneaux dans la bibliothèque : signature reportée sur la grille du quai')


FOREST = {1740, 1741, 1752, 1753}                        # la forêt dense des bordures (g4-arbres, motif de 2 x 2)
is_forest = lambda sheet, k: sheet == 'g4-arbres' and k in FOREST


def leaves(hue_fn, sat=None):
    """Feuillage recoloré : chaque vert prend la teinte hue_fn(h, v) (garde la clarté)."""
    def fn(h, s, v):
        g = (h > 60) & (h < 180) & (s > 0.12)
        h2 = np.where(g, hue_fn(h, v), h)
        s2 = np.where(g, np.maximum(s, sat) if sat else s, s)
        return h2, s2, v
    return lambda img: hsv_map(img, fn)


@ville('saint-ay')
def saint_ay(v):
    """Village de Loire : maisons de tuffeau blanc à toit d'ardoise, chênes vert olive, lanternes de bois ;
    signature : les roseaux au bord de l'étang."""
    woodpile = {(20, 11), (21, 11), (20, 12), (21, 12)}           # le tas de bois de g4_enrich reste du bois
    v.recolor_cells(building_cells_all(v) - woodpile, ('decor', 'dessus'),
                    palette(roof=(214, 0.16, 0.95), wall=(46, 0.07, 1.12), wood=(42, 0.13, 1.7)))
    v.recolor_refs(is_forest, leaves(lambda h, val: 86 + (h - 120) * 0.3, sat=0.3), layers=('decor', 'dessus'))
    reeds = [v.element('g4-eau', 13, r, 1, 1, cut=True) for r in (91, 92)]
    for i, (x, y) in enumerate([(7, 9), (8, 10), (8, 11), (8, 12), (5, 15), (0, 15)]):
        assert v.solid(x, y) and v.kinds[y][x] == 'water', (x, y)
        v.place(reeds[i % 2], x, y, solid_from=0)


@ville('montepilloy')
def montepilloy(v):
    """Village agricole de l'Oise : forêt d'automne, sans réverbères ; signature : le puits de pierre, et les meules
    de foin près des champs."""
    v.recolor_refs(is_forest, leaves(lambda h, val: 12 + val * 32, sat=0.62), layers=('decor', 'dessus'))
    v.place(v.element('g4-clotures', 6, 24, 3, 2, isolate=True), 2, 8, solid_from=1)
    hay = v.element('g4-arbres', 0, 305, 4, 1, isolate=True)
    v.place(hay, 21, 22, solid_from=0)
    v.place(hay, 24, 20, solid_from=0)
    v.notes.append('murets de pierre abandonnés : aucun muret Gen 4 ne suit le tracé des clôtures existantes')


DPPT_WOOD_FENCE = {dppt(c, r): dppt(c, r - 3) for c in range(5) for r in range(131, 134)}   # bois -> blanc (même plan)


def swap_refs(v, mapping, sheet='dppt', layers=('decor', 'dessus')):
    """Remplace des cases d'une planche par d'autres (même rôle, ex. clôture de bois -> clôture blanche)."""
    for layer in layers:
        for y in range(v.H):
            for x in range(v.W):
                refs = v.stack(layer, x, y)
                new = [v.ref(sheet, mapping[r % STRIDE]) if v.sheet_of(r) == sheet and r % STRIDE in mapping else r
                       for r in refs]
                if new != refs:
                    v.set_stack(layer, x, y, new)


def fill_border(v, tile_of):
    """Bordure de forêt remplacée : chaque case de forêt (Décor) prend tile_of(x, y) ; les bouts de forêt au-dessus
    de cases libres disparaissent."""
    for y in range(v.H):
        for x in range(v.W):
            for layer in ('decor', 'dessus'):
                refs = v.stack(layer, x, y)
                if not any(is_forest(v.sheet_of(r), r % STRIDE) for r in refs):
                    continue
                rest = [r for r in refs if not is_forest(v.sheet_of(r), r % STRIDE)]
                if layer == 'decor' or v.solid(x, y):
                    rest.append(v.img_ref(tile_of(x, y)))
                v.set_stack(layer, x, y, rest)


def flag_france(img):
    """Oriflamme bleue -> drapeau français (bandes verticales bleu, blanc, rouge sur la largeur de l'oriflamme)."""
    a = np.array(img).astype(int)
    blue = (a[..., 3] > 0) & (a[..., 2] > a[..., 0] + 30) & (a[..., 2] > a[..., 1])
    ys, xs = np.nonzero(blue)
    x0, x1 = xs.min(), xs.max() + 1
    for y, x in zip(ys, xs):
        band = (x - x0) * 3 // (x1 - x0)
        shade = a[y, x, :3].sum() / 3 / 150
        base = [(36, 60, 168), (240, 240, 244), (214, 40, 48)][band]
        a[y, x, :3] = [min(255, int(c * (0.78 + 0.3 * shade))) for c in base]
    return Image.fromarray(a.astype(np.uint8))


def gravel(v, cells):
    """Allées de gravier clair (plage claire DPPt) à la place des pavés : bords d'herbe seulement contre les pelouses."""
    from ds_theme import TERRAINS
    spec = TERRAINS['beach']
    grassy = lambda x, y: 0 <= x < v.W and 0 <= y < v.H and v.kinds[y][x] in ('grass', 'flowers', 'tall')
    for x, y in cells:
        quads = []
        ox, oy = spec['outer']
        for q in range(4):
            qx, qy = q % 2, q // 2
            dx, dy = (1 if qx else -1), (1 if qy else -1)
            vv, hh, dd = grassy(x, y + dy), grassy(x + dx, y), grassy(x + dx, y + dy)
            quads.append((ox + 2 * qx, oy + 2 * qy) if vv and hh else (ox + 1, oy + 2 * qy) if vv
                         else (ox + 2 * qx, oy + 1) if hh else spec['inner'][q] if dd else spec['center'])
        ref = (v.ref('dppt', v.bd.index('dppt', *spec['center'])) if all(q == spec['center'] for q in quads)
               else v.ref('auto', v.bd.quad_tile('dppt', tuple(quads))))
        v.set_stack('sol', x, y, [ref])


@ville('bonsecours')
def bonsecours(v):
    """Collège : bâtiment scolaire de brique au toit gris, clôtures blanches, forêt de sapins sombres, globes blancs ;
    signature : le drapeau français de la cour, avec un râtelier à vélos."""
    v.recolor_cells(building_cells_all(v), ('decor', 'dessus'),
                    palette(roof=(210, 0.1, 0.78), wall=(8, 0.5, 0.88), wood=(10, 0.45, 0.85), wall_min=0.4))
    swap_refs(v, DPPT_WOOD_FENCE)
    # Poteaux de bois pris dans des cases assemblées : blanchis aussi (cases 'F' de la grille du jeu).
    _, _src = G.game_points(v.id)
    fence = [(x, y) for y, row in enumerate(G.json.loads(G.subprocess.check_output(
        ['node', str(ROOT / 'scripts' / 'export_audit.mjs')], cwd=ROOT))['routeBonsecours']['source'])
        for x, c in enumerate(row) if c == 'F']
    whiten = lambda img: hsv_map(img, lambda h, s_, val: (
        h, np.where((h < 45) & (s_ > 0.25) & (val > 0.2), 0.04, s_),
        np.where((h < 45) & (s_ > 0.25) & (val > 0.2), np.minimum(1, val * 1.6 + 0.15), val)))
    v.recolor_cells(fence, ('decor',), whiten)
    pines = v.bd.images['g4-arbres'].crop((0, 270 * TILE, 4 * TILE, 274 * TILE))
    fill_border(v, lambda x, y: pines.crop(((x % 4) * TILE, (y % 4) * TILE, (x % 4 + 1) * TILE, (y % 4 + 1) * TILE)))
    v.place(v.element('g4-mobilier', 10, 249, 2, 5, fn=flag_france), 18, 5, solid_from=4)
    v.place(v.element('g4-mobilier', 9, 249, 1, 2), 18, 8, solid_from=1)        # un pot de buis au pied du mât
    for x, (c, r) in zip((16, 17), ((17, 71), (18, 71))):
        v.place(v.element('g4-mobilier', c, r, 1, 1), x, 14, solid_from=0)
    v.notes.append('bâtiment scolaire : recoloration (pas de bâtiment plus massif à la même emprise) ; '
                   'terrain de sport abandonné (pas la place sans toucher aux chemins)')


@ville('prytanee')
def prytanee(v):
    """Lycée militaire : allées de gravier clair, enceinte de haie taillée, lanternes bleues ; signature : la statue
    de bronze sur sa pelouse."""
    cobble = is_cobble(v)
    cells = [(x, y) for y in range(v.H) for x in range(v.W)
             if any(cobble(v.sheet_of(r), r % STRIDE) for r in v.stack('sol', x, y))]
    gravel(v, cells)
    hedge = greener(0.72)(v.bd.images['g4-plantes'].crop((5 * TILE, 10 * TILE, 6 * TILE, 11 * TILE)))
    fill_border(v, lambda x, y: hedge)
    bronze = lambda img: hsv_map(img, lambda h, s, val: (np.where(s > 0.05, 34, h), np.where(s > 0.05, 0.5, s), val))
    v.place(v.element('g4-mobilier', 9, 77, 3, 5, isolate=True, fn=bronze), 11, 10, solid_from=3, min_fill=90)
    v.notes.append("mur d'enceinte en pierre abandonné pour une haie taillée (pas de mur de pierre à motif répétable)")


def retile(v, land, cells):
    """Sol refait (plage DPPt et mer DS de Fort-de-France) sur `cells`, d'après land(x, y) : plage sur la terre, mer
    ailleurs, bords d'écume assemblés quart par quart."""
    from ds_theme import TERRAINS, SEA_TO_DPPT
    for x, y in cells:
        name = 'beach' if land(x, y) else 'water'
        spec = TERRAINS[name]
        other = (lambda dx, dy: not land(x + dx, y + dy)) if name == 'beach' else (lambda dx, dy: land(x + dx, y + dy))
        quads = []
        ox, oy = spec['outer']
        for q in range(4):
            qx, qy = q % 2, q // 2
            dx, dy = (1 if qx else -1), (1 if qy else -1)
            vv, hh, dd = other(0, dy), other(dx, 0), other(dx, dy)
            quads.append((ox + 2 * qx, oy + 2 * qy) if vv and hh else (ox + 1, oy + 2 * qy) if vv
                         else (ox + 2 * qx, oy + 1) if hh else spec['inner'][q] if dd else spec['center'])
        if all(q == spec['center'] for q in quads) and name == 'water':
            info = v.bd.objects['mer']
            tile = ('objets', info['col'] + x % 2, info['row'] + y % 2, 'sea')
            ref = v.ref('auto', v.bd.composite((tile,), SEA_TO_DPPT))
        elif all(q == spec['center'] for q in quads):
            ref = v.ref('dppt', v.bd.index('dppt', *spec['center']))
        else:
            ref = v.ref('auto', v.bd.quad_tile('dppt', tuple(quads)))
        v.set_stack('sol', x, y, [ref])


def hibiscus(img):
    """Arbuste à fleurs roses -> hibiscus rouge vif."""
    return hsv_map(img, lambda h, s, val: (np.where((h > 290) | (h < 20), 356, h),
                                           np.where((h > 290) | (h < 20), np.maximum(s, 0.85), s), val))


@ville('fort-de-france')
def fort_de_france(v):
    """Touches tropicales : lagon turquoise le long de la plage, hibiscus rouges, réverbères roses, un seul modèle de
    palmier ; la poche laissée par la barque devient une langue de sable reliée à la plage."""
    W, H = v.W, v.H
    # Langue de sable : les cases libres sans issue (ancienne barque) et la mer qui les sépare de la plage.
    spit = {(x, y) for x in range(9, 13) for y in range(26, 30)}
    for x, y in spit:
        v.solid0[y * W + x] = 0
        v.m['solid'][y * W + x] = 0
        v.clear([(x, y)])
    water = lambda x, y: not (0 <= x < W and 0 <= y < H) or (v.kinds[y][x] == 'water' and (x, y) not in spit)
    land = lambda x, y: not water(x, y)
    around = {(x + dx, y + dy) for x, y in spit for dx in (-1, 0, 1) for dy in (-1, 0, 1)
              if 0 <= x + dx < W and 0 <= y + dy < H and v.sheet_of(v.stack('sol', x + dx, y + dy)[-1]) != 'g4-mobilier'}
    retile(v, land, around)
    for x, y in spit:
        v.kinds[y][x] = 'other'
    # Lagon : la mer qui touche la plage, en turquoise clair.
    shallow = [(x, y) for y in range(H) for x in range(W) if water(x, y) and v.solid(x, y)
               and any(land(x + dx, y + dy) for dx in range(-2, 3) for dy in range(-2, 3))]
    shallow += [(x, y) for y in range(H) for x in range(W) if land(x, y)       # bouts d'eau des bords de plage
                and any(water(x + dx, y + dy) for dx in (-1, 0, 1) for dy in (-1, 0, 1))]
    blue = lambda h, s: (h > 180) & (h < 255) & (s > 0.2)
    v.recolor_cells(shallow, ('sol',), lambda img: hsv_map(img, lambda h, s, val: (
        np.where(blue(h, s), 191, h), np.where(blue(h, s), np.minimum(s, 0.62), s),
        np.where(blue(h, s), np.minimum(1, 0.42 + 0.62 * val), val))))
    # Réverbères roses à la place des réverbères DPPt de l'allée (même emprise : tête au-dessus, pied bloquant).
    # Le réverbère DPPt recoloré en rose (le réverbère rose de la planche Clôtures a un pied trop fin pour se lire
    # comme un obstacle).
    pink = v.element('dppt', 7, 129, 1, 3, fn=lambda img: hsv_map(img, lambda h, s, val: (
        np.where((s > 0.12) & (val <= 0.8), 340, np.where(val > 0.8, 45, h)),
        np.where((s > 0.12) & (val <= 0.8), 0.5, np.where(val > 0.8, 0.35, s)),
        np.where((s > 0.12) & (val <= 0.8), np.minimum(1, val * 1.35), val))))
    for x, y in ((13, 12), (17, 12), (13, 19), (17, 19)):
        v.clear([(x, y), (x, y + 1)], ('dessus',))
        v.clear([(x, y + 2)], ('decor',))
        v.place(pink, x, y, solid_from=2)
    # Un seul palmier : le palmier de plage (g4-arbres, 3 x 3) remplace le grand palmier et le petit palmier.
    palm = v.bd.images['g4-arbres'].crop((9 * TILE, 153 * TILE, 12 * TILE, 156 * TILE))
    for x0, y0, x1, y1 in ((24, 17, 27, 19), (18, 20, 21, 22), (8, 9, 10, 12)):
        cells = [(x, y) for y in range(y0, y1 + 1) for x in range(x0, x1 + 1)]
        for x, y in cells:
            for layer in ('decor', 'dessus'):
                v.set_stack(layer, x, y, [r for r in v.stack(layer, x, y) if v.sheet_of(r) != 'objets'])
    small = palm.copy()
    for i in (0, 2):                                      # petit palmier : seul le pied du milieu touche le sol
        small.paste(Image.new('RGBA', (TILE, TILE)), (i * TILE, 2 * TILE))
    v.place(palm, 25, 17, solid_from=2)
    v.place(palm, 19, 20, solid_from=2)
    v.place(small, 8, 10, solid_from=2)
    v.clear([(13, 15), (23, 15)])                          # bouts de palme égarés sur le chemin
    red = v.element('g4-plantes', 5, 38, 1, 2, fn=hibiscus)
    for x, y in ((22, 6), (5, 11), (29, 16)):
        v.place(red, x, y, solid_from=1)
    v.notes.append('langue de sable (9..12, 26..29) : 8 cases libérées et reliées à la plage')


@ville('route-de-montepilloy')
def route_de_montepilloy(v):
    """Route de campagne : allée de peupliers sur les bas-côtés ; la forêt DPPt d'origine reste (seule carte à la
    garder). Épouvantail abandonné (absent de la bibliothèque)."""
    poplar = v.element('g4-arbres', 6, 147, 3, 4, isolate=True)
    for x, rows in ((9, (4, 8, 11, 16, 20, 24)), (12, (7, 11, 18, 21))):
        for y in rows:
            v.place(poplar, x - 1, y - 3, solid_from=3, min_fill=60)
    v.notes.append('épouvantail abandonné : absent de la bibliothèque')


if __name__ == '__main__':
    main()
