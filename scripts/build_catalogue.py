#!/usr/bin/env python3
"""Catalogue du créateur de cartes : les matières et les éléments entiers de chaque ville (son thème).

Le créateur ne fait plus peindre des cases : on peint des matières (herbe, chemin, sable, eau, hautes herbes, fleurs,
pavés, forêt), dont les bords se font tout seuls (planche « transitions »), et on pose des éléments entiers (maison,
arbre, banc, bateau…) qui savent où ils bloquent, où est leur porte et où ils se posent (terre ou eau). Chaque ville a
son thème : ses matières (ses pavés, sa forêt) et ses éléments dans sa palette (scripts/identites.py) ; le thème
« libre » propose tout, aux couleurs d'origine.

Écrit public/assets/v2/catalogue.png (les cases recolorées ou découpées), catalogue.json (thèmes, matières, éléments)
et ajoute la planche, masquée, au catalogue des planches (à relancer après scripts/build_v2_tiles.py).

Usage : python3 scripts/build_catalogue.py
"""
import json
import math
from pathlib import Path

import numpy as np
from PIL import Image
from scipy import ndimage

import identites as I
from fdf_ds_v2 import tint_stone, tint_martinique
from g4_theme import BUILDINGS, COBBLE, FENCES
from remove_shadows import shadowless

ROOT = Path(__file__).resolve().parent.parent
V2 = ROOT / 'public' / 'assets' / 'v2'
TILE = 16
COLS = 16                                  # largeur de la planche du catalogue, en cases

sheets = {}


def sheet(sid):
    if sid not in sheets:
        sheets[sid] = Image.open(V2 / f'{sid}.png').convert('RGBA')
    return sheets[sid]


def crop(sid, c, r, w=1, h=1):
    return sheet(sid).crop((c * TILE, r * TILE, (c + w) * TILE, (r + h) * TILE))


def isolate(img, seed=None):
    """Seul le morceau d'un seul tenant (celui de la case `seed` (col, rangée), sinon le plus grand)."""
    a = np.array(img)
    labels, n = ndimage.label(a[..., 3] > 0, structure=np.ones((3, 3)))
    if not n:
        return img
    keep = labels[seed[1] * TILE + TILE // 2, seed[0] * TILE + TILE // 2] if seed else 0
    if not keep:
        keep = np.bincount(labels.ravel())[1:].argmax() + 1
    a[labels != keep] = 0
    return Image.fromarray(a)


def cut_mint(img, color=(112, 216, 168)):
    a = np.array(img)
    a[(np.abs(a[..., :3].astype(int) - color).sum(-1) < 24)] = 0
    return Image.fromarray(a)


def cut_background(img):
    """Fond uni (la couleur la plus présente) rendu transparent."""
    a = np.array(img)
    px = a[..., :3].reshape(-1, 3)
    vis = a[..., 3].reshape(-1) > 0
    vals, counts = np.unique(px[vis], axis=0, return_counts=True)
    bg = vals[counts.argmax()]
    a[(np.abs(a[..., :3].astype(int) - bg).sum(-1) < 30)] = 0
    return Image.fromarray(a)


# ---------- Palettes ----------
FOREST_FN = {
    'dppt': lambda img: img,
    'chene': I.leaves(lambda h, val: 86 + (h - 120) * 0.3, sat=0.3),
    'automne': I.leaves(lambda h, val: 12 + val * 32, sat=0.62),
}
pink_lamp = lambda img: I.hsv_map(img, lambda h, s, val: (
    np.where((s > 0.12) & (val <= 0.8), 340, np.where(val > 0.8, 45, h)),
    np.where((s > 0.12) & (val <= 0.8), 0.5, np.where(val > 0.8, 0.35, s)),
    np.where((s > 0.12) & (val <= 0.8), np.minimum(1, val * 1.35), val)))
bronze = lambda img: I.hsv_map(img, lambda h, s, val: (np.where(s > 0.05, 34, h), np.where(s > 0.05, 0.5, s), val))


def flag(fn):
    def apply(img):
        a = np.array(img).astype(int)
        blue = (a[..., 3] > 0) & (a[..., 2] > a[..., 0] + 30) & (a[..., 2] > a[..., 1])
        ys, xs = np.nonzero(blue)
        box = (xs.min(), ys.min(), xs.max(), ys.max())
        return fn(img, box)
    return apply


def martinique(img, box):
    out = Image.new('RGBA', img.size)
    for j in range(img.height // TILE):
        for i in range(img.width // TILE):
            t = img.crop((i * TILE, j * TILE, (i + 1) * TILE, (j + 1) * TILE))
            out.paste(tint_martinique(t, i * TILE, j * TILE, box), (i * TILE, j * TILE))
    return out


# ---------- Éléments ----------
# id : (nom, rayon, image(), rangée où commence le bas qui bloque (None : rien ne bloque), où il se pose, porte)
# Rayons : maisons, arbres, plantes, mobilier, eau. Les maisons viennent de g4_theme.BUILDINGS (porte connue).
def building(name):
    spec = BUILDINGS[name]
    img = Image.new('RGBA', (spec['w'] * TILE, spec['h'] * TILE))
    for j in range(spec['h']):
        for i in range(spec['w']):
            img.paste(crop(spec['sheet'], spec['col'] + i, spec['row'] + j), (i * TILE, j * TILE))
    return isolate(img, spec['door']), spec


BUILDING_NAMES = {
    'rouge': 'Maison au toit rouge', 'chaume': 'Chaumière', 'chaume-grande': 'Grande chaumière',
    'ardoise': 'Maison au toit bleu', 'mauve': 'Maison mauve', 'orange': 'Maison au toit orange',
    'verriere': 'Grande maison à verrière', 'ecole': 'Immeuble', 'casino': 'Façade à auvent', 'temple': 'Temple',
    'vitrine': 'Bâtiment vitré', 'abri': 'Petit abri', 'grange': 'Grange', 'boutique': 'Boutique',
    'longere': 'Longère', 'bleue': 'Maison bleue', 'grise': 'Maison grise', 'tuiles': 'Maison aux tuiles',
}

# Bâtiments de la bibliothèque Gen 4 (g4-batiments, choisis en octobre 2026 pour les quatre premières villes) :
# id : (nom, rectangle en pixels dans la planche, colonne de la porte, couleurs d'ombre opaque propres, thèmes).
# Le dessin est pris d'un seul tenant, sans ombre, le bas calé sur la grille ; la porte est sur la dernière rangée.
GRAY = (128, 128, 128)
LIB_BUILDINGS = {
    'toit-orange': ('Case au toit orange', (69, 12257, 54, 79), 1, (), ['fort-de-france']),
    'toit-vert': ('Maison au toit vert d\'eau', (122, 23336, 96, 114), 2, (), ['fort-de-france']),
    'toit-rose': ('Petite maison rose', (14, 23913, 75, 84), 2, (), ['fort-de-france']),
    'boutique-auvent': ('Boutique à auvent', (1, 6710, 68, 71), 2, (), ['fort-de-france']),
    'ardoise-verte': ('Maison d\'ardoise', (201, 14291, 78, 102), 2, (), ['saint-ay']),
    'bois-bleu': ('Maison de bois au toit bleu', (122, 14040, 96, 114), 2, (), ['saint-ay']),
    'pierre': ('Maison de pierre', (8, 14874, 95, 96), 3, [(25, 25, 25)], ['saint-ay']),
    'lucarne': ('Grande maison à lucarne', (194, 16643, 94, 108), 2, [(28, 35, 38), (25, 44, 38)], ['saint-ay']),
    'chaumiere-doree': ('Chaumière dorée', (224, 8384, 128, 107), 3, [GRAY], ['montepilloy']),
    'cabane': ('Cabane de bois', (97, 12081, 77, 79), 1, (), ['montepilloy']),
    'colombages': ('Maison à colombages', (5, 16032, 102, 125), 3, [GRAY], ['montepilloy']),
    'remise': ('Remise en rondins', (0, 12769, 84, 99), 2, (), ['montepilloy']),
    'college': ('Grand bâtiment de pierre', (7, 13745, 98, 127), 3, (), ['bonsecours']),
    'internat': ('Bâtiment à colonnes', (163, 16374, 74, 122), 2, (), ['bonsecours']),
    'gymnase': ('Immeuble vitré', (80, 22049, 80, 95), 2, (), ['bonsecours']),
}


def lib_building(box, greys=(), sid='g4-batiments', shadow=False, dark=40):
    """Un dessin de la bibliothèque (rectangle en pixels), d'un seul tenant, sans ombre (sauf `shadow` : végétation),
    le bas calé sur la grille."""
    x, y, w, h = box
    img = isolate(sheet(sid).crop((x, y, x + w, y + h)))
    if not shadow:
        img = shadowless(img, greys=greys, dark=dark)
    bx0, by0, bx1, by1 = img.getbbox()
    if sid == 'g4-batiments':
        left = (x + bx0) % TILE                   # garde le calage de la planche (colonne de la porte)
        tw = math.ceil((left + bx1 - bx0) / TILE)
    else:                                         # un objet : centré sur le moins de cases possible
        tw = math.ceil((bx1 - bx0) / TILE)
        left = (tw * TILE - (bx1 - bx0)) // 2
    th = math.ceil((by1 - by0) / TILE)
    out = Image.new('RGBA', (tw * TILE, th * TILE))
    out.alpha_composite(img.crop((bx0, by0, bx1, by1)), (left, th * TILE - (by1 - by0)))
    return out


ELEMENTS = {
    # Arbres (le bas, ou le tronc, bloque ; la cime passe devant Pierre).
    'arbre-foret': ('Arbre de forêt', 'arbres', lambda: crop('lisieres', 0, LIS_ROUND['dppt'], 4, 4), 3, 'land'),
    'palmier': ('Palmier', 'arbres', lambda: isolate(crop('g4-arbres', 9, 153, 3, 3)), 2, 'land'),
    'peuplier': ('Peuplier', 'arbres', lambda: isolate(crop('g4-arbres', 6, 147, 3, 4)), 3, 'land'),
    'sapin': ('Grand sapin', 'arbres', lambda: isolate(crop('g4-arbres', 0, 147, 3, 6)), 5, 'land'),
    # Plantes.
    'buisson': ('Buisson rond', 'plantes', lambda: crop('dppt', 7, 106), 0, 'land'),
    'baies': ('Arbuste à baies', 'plantes', lambda: crop('g4-herbes', 4, 79, 1, 2), 1, 'land'),
    'arbuste-rose': ('Arbuste fleuri', 'plantes', lambda: crop('g4-plantes', 5, 38, 1, 2), 1, 'land'),
    'hibiscus': ('Hibiscus', 'plantes', lambda: I.hibiscus(crop('g4-plantes', 5, 38, 1, 2)), 1, 'land'),
    'haie': ('Haie taillée', 'plantes', lambda: crop('g4-herbes', 5, 44, 3, 1), 0, 'land'),
    'fleurs-tropicales': ('Grandes fleurs', 'plantes', lambda: crop('g4-plantes', 1, 37, 2, 3), None, 'land'),
    'roseaux': ('Roseaux', 'eau', lambda: cut_background(crop('g4-eau', 13, 91)), None, 'water'),
    'nenuphar': ('Nénuphar', 'eau', lambda: crop('g4-eau', 13, 80), None, 'water'),
    # Mobilier.
    'banc': ('Banc', 'mobilier', lambda: crop('g4-mobilier', 2, 277, 2, 2), 1, 'land'),
    'jardiniere-rouge': ('Jardinière rouge', 'mobilier', lambda: crop('g4-mobilier', 2, 279, 2, 1), 0, 'land'),
    'jardiniere-orange': ('Jardinière orange', 'mobilier', lambda: crop('g4-mobilier', 4, 279, 2, 1), 0, 'land'),
    'jardiniere-rose': ('Jardinière rose', 'mobilier', lambda: crop('g4-mobilier', 6, 279, 2, 1), 0, 'land'),
    'panneau': ('Panneau', 'mobilier', lambda: crop('dppt', 4, 135), 0, 'land'),
    'boite-lettres': ('Boîte aux lettres', 'mobilier', lambda: crop('dppt', 5, 134, 1, 2), 1, 'land'),
    'cabine': ('Cabine téléphonique', 'mobilier', lambda: crop('dppt', 6, 134, 1, 2), 1, 'land'),
    'pot': ('Pot de buis', 'mobilier', lambda: crop('g4-mobilier', 9, 249, 1, 2), 1, 'land'),
    'velo': ('Vélo', 'mobilier', lambda: crop('g4-mobilier', 17, 71), 0, 'land'),
    'rocher': ('Rocher', 'mobilier', lambda: crop('dppt', 7, 146), 0, 'land'),
    'bois': ('Tas de bois', 'mobilier', lambda: isolate(crop('g4-mobilier', 1, 117, 2, 2)), 1, 'land'),
    'puits': ('Puits', 'mobilier', lambda: isolate(crop('g4-clotures', 6, 24, 3, 2)), 1, 'land'),
    'parasol': ('Parasol et banc', 'mobilier', lambda: crop('g4-mobilier', 6, 157, 4, 4), 3, 'land'),
    'statue-bronze': ('Statue de bronze', 'mobilier', lambda: bronze(isolate(crop('g4-mobilier', 9, 77, 3, 5))), 3, 'land'),
    'statue-blanche': ('Statue de pierre', 'mobilier', lambda: tint_stone(crop('g4-mobilier', 12, 80, 2, 2)), 0, 'land'),
    'drapeau-france': ('Drapeau français', 'mobilier', lambda: I.flag_france(crop('g4-mobilier', 10, 249, 2, 5)), 4, 'land'),
    'drapeau-martinique': ('Drapeau de la Martinique', 'mobilier',
                           lambda: flag(martinique)(crop('g4-mobilier', 10, 249, 2, 5)), 4, 'land'),
    'reverbere': ('Réverbère', 'mobilier', lambda: crop('dppt', 7, 129, 1, 3), 2, 'land'),
    'reverbere-rose': ('Réverbère rose', 'mobilier', lambda: pink_lamp(crop('dppt', 7, 129, 1, 3)), 2, 'land'),
    'reverbere-noir': ('Réverbère victorien', 'mobilier', lambda: I.victorian(crop('dppt', 7, 129, 1, 3)), 2, 'land'),
    'lanterne-bois': ('Lanterne de bois', 'mobilier', lambda: crop('g4-clotures', 9, 76, 1, 2), 1, 'land'),
    'globe': ('Réverbère à globe', 'mobilier', lambda: crop('g4-mobilier', 0, 257, 2, 3), 2, 'land'),
    'lanterne-bleue': ('Lanterne bleue', 'mobilier', lambda: crop('g4-mobilier', 2, 257, 2, 4), 3, 'land'),
    'lanterne-hgss': ('Lanterne', 'mobilier', lambda: crop('g4-mobilier', 6, 241, 2, 3), 2, 'land'),
    # Mobilier de la bibliothèque Gen 4 (g4-mobilier, octobre 2026).
    'fontaine': ('Fontaine', 'mobilier', lambda: lib_building((176, 2513, 63, 63), sid='g4-mobilier'), 1, 'land'),
    'petite-fontaine': ('Petite fontaine', 'mobilier', lambda: lib_building((85, 2383, 54, 49), sid='g4-mobilier'), 2, 'land'),
    'etal': ('Étal de marché', 'mobilier', lambda: lib_building((0, 2306, 56, 53), sid='g4-mobilier'), 2, 'land'),
    'etal-bocaux': ('Étal aux bocaux', 'mobilier', lambda: lib_building((115, 2170, 73, 54), sid='g4-mobilier'), 2, 'land'),
    'transat': ('Transat', 'mobilier', lambda: lib_building((33, 2368, 34, 48), sid='g4-mobilier'), 1, 'land'),
    'caisse': ('Grande caisse', 'mobilier', lambda: lib_building((143, 512, 50, 66), sid='g4-mobilier'), 1, 'land'),
    'massif': ('Massif de fleurs', 'mobilier', lambda: lib_building((0, 776, 68, 61), sid='g4-mobilier'), 1, 'land'),
    'pique-nique': ('Table de pique-nique', 'mobilier', lambda: lib_building((102, 4187, 36, 37), sid='g4-mobilier'), 1, 'land'),
    'banc-bois': ('Banc de bois', 'mobilier', lambda: lib_building((34, 4228, 30, 28), sid='g4-mobilier'), 1, 'land'),
    'abri-bois': ('Abri de bois', 'mobilier', lambda: lib_building((135, 1906, 81, 78), sid='g4-mobilier', dark=120), 3, 'land'),
    'distributeur': ('Distributeur', 'mobilier', lambda: lib_building((165, 4229, 21, 27), sid='g4-mobilier'), 1, 'land'),
    'affichage': ('Panneau d\'affichage', 'mobilier', lambda: lib_building((135, 4234, 18, 22), sid='g4-mobilier'), 1, 'land'),
    'souche': ('Souche et hache', 'plantes', lambda: lib_building((262, 4181, 19, 27), sid='g4-mobilier', shadow=True), 1, 'land'),
    # Sur l'eau (toujours bloquante : rien à ajouter).
    'barque': ('Barque', 'eau', lambda: isolate(crop('g4-vehicules', 6, 10, 5, 3)), None, 'water'),
    'voilier': ('Voilier', 'eau', lambda: crop('g4-vehicules', 0, 59, 3, 2), None, 'water'),
    'voilier-bleu': ('Voilier bleu', 'eau', lambda: crop('g4-vehicules', 0, 62, 3, 2), None, 'water'),
    'peniche': ('Péniche', 'eau', lambda: crop('g4-vehicules', 0, 30, 6, 3), None, 'water'),
    'cargo': ('Cargo à grues', 'eau', lambda: isolate(crop('g4-vehicules', 0, 82, 9, 4)), None, 'water'),
    'rocher-mer': ('Rocher dans l\'eau', 'eau', lambda: crop('dppt', 7, 145), None, 'water'),
}

# L'arbre rond de la planche des lisières (scripts/build_lisieres.py), par palette : sa première rangée.
LIS_ROUND = {v['id']: v['roundRow'] for v in json.loads((V2 / 'lisieres.json').read_text())['variants']}

# ---------- Thèmes ----------
COMMON = ['buisson', 'baies', 'arbuste-rose', 'rocher', 'panneau', 'boite-lettres', 'banc', 'jardiniere-rouge',
          'jardiniere-orange', 'jardiniere-rose', 'pot', 'nenuphar', 'rocher-mer', 'barque', 'voilier']
THEMES = {
    'libre': {'name': 'Libre (toutes les couleurs d\'origine)', 'forest': 'dppt', 'paving': 'gris', 'lamp': 'reverbere',
              'extra': list(ELEMENTS)},
    'fort-de-france': {'name': 'Fort-de-France (tropicale)', 'forest': None, 'paving': None, 'lamp': 'reverbere-rose',
                       'extra': ['palmier', 'hibiscus', 'fleurs-tropicales', 'parasol', 'drapeau-martinique',
                                 'statue-blanche', 'voilier-bleu', 'etal', 'etal-bocaux', 'transat',
                                 'caisse', 'petite-fontaine']},
    'saint-ay': {'name': 'Saint-Ay (village de Loire)', 'forest': 'chene', 'paving': None, 'lamp': 'lanterne-bois',
                 'palette': 'saint-ay', 'extra': ['arbre-foret', 'peuplier', 'roseaux', 'bois', 'fontaine', 'massif',
                           'pique-nique']},
    'route-de-montepilloy': {'name': 'Route de campagne', 'forest': 'dppt', 'paving': None, 'lamp': None,
                             'extra': ['arbre-foret', 'peuplier']},
    'montepilloy': {'name': 'Montépilloy (village agricole)', 'forest': 'automne', 'paving': None, 'lamp': None,
                    'extra': ['arbre-foret', 'puits', 'bois', 'banc-bois', 'abri-bois', 'souche',
                              'caisse']},
    'bonsecours': {'name': 'Collège de Bonsecours', 'forest': 'pins', 'paving': None, 'lamp': 'globe',
                   'palette': 'bonsecours', 'extra': ['sapin', 'drapeau-france', 'velo', 'distributeur', 'affichage',
                             'pique-nique', 'fontaine']},
    'prytanee': {'name': 'Prytanée (lycée militaire)', 'forest': 'haie', 'paving': 'gravier', 'lamp': 'lanterne-bleue',
                 'extra': ['haie', 'statue-bronze', 'drapeau-france']},
    'bordeaux': {'name': 'Bordeaux (pierre blonde)', 'forest': None, 'paving': 'blond', 'lamp': 'lanterne-hgss',
                 'palette': 'bordeaux', 'extra': ['peniche', 'velo']},
    'hull': {'name': 'Hull (brique anglaise)', 'forest': None, 'paving': 'brique', 'lamp': 'reverbere-noir',
             'palette': 'hull', 'extra': ['cargo', 'cabine', 'velo']},
}
PAVING_FN = {'gris': lambda img: img, 'blond': I.tint(40, 0.20, 1.1), 'brique': I.tint(16, 0.34, 0.66)}
FOREST_PATTERN = {'pins': ('g4-arbres', 0, 270, 4, 4, None), 'haie': ('g4-plantes', 5, 10, 1, 1, I.greener(0.72))}


class Packer:
    """Range les images dans la planche du catalogue (cases de 16 px, rangées de COLS cases). Les cases déjà dans la
    planche gardent leur numéro (les cartes y renvoient) ; les nouvelles s'ajoutent à la fin."""
    def __init__(self):
        self.tiles = []
        self.index = {}
        old = V2 / 'catalogue.png'
        if old.exists():
            img = Image.open(old).convert('RGBA')
            for k in range(img.width // TILE * (img.height // TILE)):
                t = img.crop(((k % COLS) * TILE, (k // COLS) * TILE, (k % COLS + 1) * TILE, (k // COLS + 1) * TILE))
                self.index.setdefault(t.tobytes(), k)
                self.tiles.append(t)

    def add_tile(self, img):
        key = img.tobytes()
        if key not in self.index:
            self.index[key] = len(self.tiles)
            self.tiles.append(img)
        return self.index[key]

    def add(self, img):
        """Une image de w x h cases -> les numéros de ses cases (-1 : case vide), rangée par rangée."""
        w, h = img.width // TILE, img.height // TILE
        out = []
        for j in range(h):
            row = []
            for i in range(w):
                t = img.crop((i * TILE, j * TILE, (i + 1) * TILE, (j + 1) * TILE))
                row.append(self.add_tile(t) if t.getbbox() else -1)
            out.append(row)
        return out

    def save(self):
        rows = math.ceil(len(self.tiles) / COLS)
        img = Image.new('RGBA', (COLS * TILE, rows * TILE))
        for k, t in enumerate(self.tiles):
            img.paste(t, ((k % COLS) * TILE, (k // COLS) * TILE))
        img.save(V2 / 'catalogue.png', optimize=True)
        return rows


def solid_mask(img, solid_from, thin=False):
    """Cases qui bloquent : à partir de la rangée `solid_from`, le centre bien couvert ou la case pleine à moitié
    (la règle de g4_theme pour les bâtiments)."""
    w, h = img.width // TILE, img.height // TILE
    mask = [[0] * w for _ in range(h)]
    if solid_from is None:
        return mask
    a = np.array(img)[..., 3]
    for j in range(solid_from, h):
        for i in range(w):
            cell = a[j * TILE + 2:(j + 1) * TILE - 2, i * TILE + 2:(i + 1) * TILE - 2]
            whole = a[j * TILE:(j + 1) * TILE, i * TILE:(i + 1) * TILE]
            if (cell > 200).sum() > (0.08 if thin else 0.4) * cell.size or (whole == 255).sum() >= 0.5 * TILE * TILE:
                mask[j][i] = 1
    return mask


def element_entry(pack, eid, name, cat, img, solid_from, place, door=None, theme_fn=None):
    if theme_fn:
        img = theme_fn(img)
    # Bâtiments et mobilier sans ombre portée (scripts/remove_shadows.py) ; la végétation garde la sienne.
    if cat in ('maisons', 'mobilier'):
        img = shadowless(img)
    w, h = img.width // TILE, img.height // TILE
    # Un objet fin (mât, pied de réverbère) bloque dès qu'il occupe un peu la case ; un bâtiment, s'il la couvre bien.
    mask = solid_mask(img, solid_from, thin=cat != 'maisons')
    if door:
        mask[door[1]][door[0]] = 0
    return {'id': eid, 'name': name, 'cat': cat, 'w': w, 'h': h, 'tiles': pack.add(img), 'solid': mask,
            # Rangées au-dessus de Pierre (le toit, la cime) : au-dessus de la première rangée qui bloque.
            'over': solid_from if solid_from is not None else 0, 'place': place, 'door': door}


def ocean_swaps(pack):
    """Fort-de-France : les cases du lagon et du rivage qui ont de l'eau claire, avec l'océan à la place (une version
    par position dans le motif 2 x 2 de l'océan). Le pinceau Mer les pose autour de lui : plus de carré de lagon dans
    les angles du rivage. Clé : « n° de la case auto:position » -> n° dans la planche du catalogue."""
    auto = sheet('auto')
    cols = auto.width // TILE
    tile = lambda k: np.array(auto.crop(((k % cols) * TILE, (k // cols) * TILE, (k % cols + 1) * TILE, (k // cols + 1) * TILE)))
    lagoon = np.unique(tile(1418)[..., :3].reshape(-1, 3), axis=0).astype(int)
    m = json.loads((ROOT / 'src' / 'data' / 'builtMaps' / 'fort-de-france.json').read_text())
    slot = m['sheets'].index('auto')
    used = {r % 100000 for c in m['layers']['sol'] for r in (c if isinstance(c, list) else [c]) if r >= 0 and r // 100000 == slot}
    swaps = {}
    for k in sorted(used):
        a = tile(k)
        px = a[..., :3].astype(int).reshape(-1, 1, 3)
        near = ((np.abs(px - lagoon[None]).sum(-1).min(-1) < 20).reshape(TILE, TILE)) & (a[..., 3] > 0)
        if not near.any():
            continue
        for p in range(4):
            out = a.copy()
            out[near] = tile(48 + p)[near]
            swaps[f'{k}:{p}'] = pack.add_tile(Image.fromarray(out))
    return swaps


def main():
    pack = Packer()
    themes = {}
    for tid, t in THEMES.items():
        pal = I.palette(**I.BUILDING_PALETTES[t['palette']]) if t.get('palette') else None
        leaves = FOREST_FN.get(t['forest']) if t['forest'] in FOREST_FN else None
        elements = []
        # Maisons (dans la palette de la ville).
        for bid, bname in BUILDING_NAMES.items():
            img, spec = building(bid)
            h = spec['h']
            solid_from = max(1, h - math.ceil(h * 0.55))
            elements.append(element_entry(pack, f'maison-{bid}', bname, 'maisons', img, solid_from, 'land',
                                          door=list(spec['door']), theme_fn=pal))
        for bid, (bname, box, door_col, greys, where) in LIB_BUILDINGS.items():
            if tid != 'libre' and tid not in where:
                continue
            img = lib_building(box, greys)
            h = img.height // TILE
            solid_from = max(1, h - math.ceil(h * 0.55))
            elements.append(element_entry(pack, f'maison-{bid}', bname, 'maisons', img, solid_from, 'land',
                                          door=[door_col, h - 1], theme_fn=pal))
        ids = list(dict.fromkeys(COMMON + t['extra'] + ([t['lamp']] if t['lamp'] else [])))
        for eid in ids:
            name, cat, fn, solid_from, place = ELEMENTS[eid]
            img = fn()
            if eid == 'arbre-foret' and t['forest'] in FOREST_FN:                 # l'arbre rond, palette de la ville
                img = crop('lisieres', 0, LIS_ROUND[t['forest']], 4, 4)
            elif cat in ('arbres', 'plantes') and leaves and eid not in ('hibiscus', 'arbuste-rose'):
                img = leaves(img)
            entry = element_entry(pack, eid, name, cat, img, solid_from, place)
            if eid == 'arbre-foret':                     # l'arbre rond bloque son bloc de 2 x 2 (colonnes 1-2)
                entry['solid'] = [[1 if j >= 2 and i in (1, 2) else 0 for i in range(4)] for j in range(4)]
                entry['over'] = 2
            elements.append(entry)
        # Matières.
        materials = [
            {'id': 'herbe', 'name': 'Herbe', 'kind': 'plain', 'tile': ['dppt', 4], 'solid': 0},
            {'id': 'chemin', 'name': 'Chemin', 'kind': 'kit', 'terrain': 'path', 'solid': 0},
            {'id': 'sable', 'name': 'Sable' if t['paving'] != 'gravier' else 'Gravier', 'kind': 'kit', 'terrain': 'beach',
             'solid': 0},
            {'id': 'hautes-herbes', 'name': 'Hautes herbes', 'kind': 'kit', 'terrain': 'tall', 'solid': 0},
            {'id': 'mer', 'name': 'Mer', 'kind': 'kit', 'terrain': 'sea', 'solid': 1},
            {'id': 'etang', 'name': 'Étang', 'kind': 'kit', 'terrain': 'pond', 'solid': 1},
            {'id': 'fleurs-blanches', 'name': 'Fleurs blanches', 'kind': 'overlay', 'tile': ['autotiles-g4', 64], 'solid': 0},
            {'id': 'fleurs-roses', 'name': 'Fleurs roses', 'kind': 'overlay', 'tile': ['autotiles-g4', 35], 'solid': 0},
            {'id': 'fleurs-orange', 'name': 'Fleurs orange', 'kind': 'overlay', 'tile': ['dppt', 3], 'solid': 0},
        ]
        if tid == 'fort-de-france':
            # La mer et le lagon de la carte (cases fabriquées de la planche « auto » : océan en motif 2 x 2, eau claire).
            for x in materials:
                if x['id'] == 'mer':
                    x['center'] = [['auto', 48], ['auto', 49], ['auto', 50], ['auto', 51]]
                    x['swap'] = ocean_swaps(pack)
            materials.insert(6, {'id': 'lagon', 'name': 'Lagon', 'kind': 'tile', 'tiles': [[['auto', 1418]]],
                                 'cls': 'lagoon', 'solid': 1})
        # Clôture : les angles et les jonctions se choisissent d'après les voisines (comme g4_theme.paint_objects).
        style = 'blanche' if tid in ('prytanee', 'hull', 'bordeaux') else 'bois'
        materials.append({'id': 'cloture', 'name': 'Clôture blanche' if style == 'blanche' else 'Clôture', 'kind': 'fence',
                          'pieces': {k: r * 8 + c for k, (c, r) in FENCES[style].items()}, 'solid': 1})
        if t['paving'] in PAVING_FN:
            fn = PAVING_FN[t['paving']]
            tiles = [[pack.add_tile(fn(crop(*c))) for c in COBBLE[r * 2:(r + 1) * 2]] for r in range(2)]
            materials.append({'id': 'paves', 'name': 'Pavés', 'kind': 'pattern', 'tiles': tiles, 'solid': 0})
        if t['forest'] in FOREST_FN:
            fill = FOREST_FN[t['forest']](crop('g4-arbres', 0, 145, 2, 2))
            materials.append({'id': 'foret', 'name': 'Forêt', 'kind': 'forest', 'variant': t['forest'],
                              'tiles': pack.add(fill), 'solid': 1})
        elif t['forest'] in FOREST_PATTERN:
            sid, c, r, w, h, fn = FOREST_PATTERN[t['forest']]
            img = crop(sid, c, r, w, h)
            materials.append({'id': 'foret', 'name': 'Forêt' if t['forest'] == 'pins' else 'Haie d\'enceinte',
                              'kind': 'pattern', 'tiles': pack.add(fn(img) if fn else img), 'solid': 1})
        themes[tid] = {'name': t['name'], 'lamp': t['lamp'], 'materials': materials, 'elements': elements}
    rows = pack.save()
    (V2 / 'catalogue.json').write_text(json.dumps({'cols': COLS, 'themes': themes}, ensure_ascii=False))
    catalog = json.loads((V2 / 'catalog.json').read_text())
    catalog['sheets'] = [s for s in catalog['sheets'] if s['id'] != 'catalogue']
    catalog['sheets'].append({'id': 'catalogue', 'name': 'Catalogue du créateur (matières et éléments)',
                              'file': 'catalogue.png', 'cols': COLS, 'rows': rows, 'empty': [], 'author': 'assemblées',
                              'gen': 4, 'hidden': True})
    (V2 / 'catalog.json').write_text(json.dumps(catalog, ensure_ascii=False))
    n = sum(len(t['elements']) for t in themes.values())
    print(f'{len(themes)} thèmes, {n} éléments, {len(pack.tiles)} cases -> public/assets/v2/catalogue.png')


if __name__ == '__main__':
    main()
