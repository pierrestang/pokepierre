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
from g4_theme import ASPHALT, BUILDINGS, COBBLE, FENCES, PIER
from remove_shadows import shadowless
from outline_buildings import outlined

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
    # Déjà posés sur les cartes générées (scripts/g4_theme.py), ajoutés au catalogue en octobre 2026.
    'stade': 'Rotonde', 'manoir': 'Manoir',
}

# Bâtiments de la bibliothèque Gen 4 (g4-batiments, choisis en octobre 2026 pour les quatre premières villes) :
# id : (nom, rectangle en pixels dans la planche, colonne de la porte, couleurs d'ombre opaque propres, thèmes[, options]).
# Le dessin est pris d'un seul tenant, sans ombre, le bas calé sur la grille ; la porte est sur la dernière rangée.
# Options : 'inside' (l'ombre n'est retirée qu'autour du bâtiment : un renfoncement sombre de la même couleur, sous un
# auvent, reste) ; 'tile' (le toit passe au rouge tuile commun, TILE_RED).
GRAY = (128, 128, 128)
DARK = (28, 35, 38)
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
    # Posés à la main sur Hull (octobre 2026), toits ramenés au même rouge tuile.
    'jardinieres': ('Immeuble à jardinières', (0, 13584, 112, 160), 3, (), ['hull'], {'tile'}),
    'rose-coeur': ('Maison rose à la porte en cœur', (208, 22752, 80, 112), 1, [DARK], ['hull'], {'tile'}),
    'rose-fenetres': ('Maison rose aux deux fenêtres', (192, 22640, 96, 112), 3, [DARK], ['hull'], {'tile'}),
    'auvent-vert': ('Boutique à auvent vert', (0, 12336, 80, 176), 1, [DARK], ['hull'], {'tile', 'inside'}),
    'vitraux': ('Maison aux vitraux', (253, 12336, 67, 144), 2, [DARK], ['hull'], {'tile'}),
    'volets': ('Maison aux volets', (0, 12512, 80, 128), 2, [DARK], ['hull'], {'tile'}),
    'boutique-store': ('Boutique au store rayé', (80, 12512, 80, 128), 1, [DARK], ['hull'], {'tile'}),
    # Posés à la main sur Hanoï (octobre 2026) : maisons de Johto (planche des bâtiments Gen 4).
    'vert-or': ('Maison vert et or', (224, 8752, 96, 128), 2, (), ['hanoi']),
    'bleue-lanternes': ('Maison bleue aux lanternes', (192, 18816, 112, 128), 3, (), ['hanoi']),
    'pagode': ('Pagode', (128, 18304, 112, 192), 3, (), ['hanoi']),
    'grande-bleue': ('Grande maison bleue', (16, 24096, 112, 96), 3, (), ['hanoi']),
    'noire': ('Maison noire', (112, 20224, 112, 112), 2, (), ['hanoi']),
    'violette': ('Petite maison violette', (240, 24784, 80, 96), 1, [(28, 35, 38)], ['hanoi']),
    'pilotis': ('Maison sur pilotis', (0, 1136, 48, 80), 1, (), ['hanoi']),
}


def lib_building(box, greys=(), sid='g4-batiments', shadow=False, dark=40, inside=False):
    """Un dessin de la bibliothèque (rectangle en pixels), d'un seul tenant, sans ombre (sauf `shadow` : végétation),
    le bas calé sur la grille. `inside` : l'ombre n'est retirée qu'hors du cadre du bâtiment (ses pixels qui ne sont
    pas de la couleur de l'ombre)."""
    x, y, w, h = box
    img = isolate(sheet(sid).crop((x, y, x + w, y + h)))
    if inside:
        a = np.array(img)
        grey = np.zeros(a.shape[:2], bool)
        for g in greys:
            grey |= np.abs(a[..., :3].astype(int) - g).sum(-1) < 6
        ys, xs = np.nonzero((a[..., 3] > 0) & ~grey)
        frame = np.zeros_like(grey)
        frame[ys.min():ys.max() + 1, xs.min():xs.max() + 1] = True
        cut = np.array(shadowless(img, greys=greys, dark=dark))
        a[~frame] = cut[~frame]
        img = Image.fromarray(a)
    elif not shadow:
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
    # Arbres de la planche des lisières (build_lisieres.py), au format de l'arbre de forêt (4 x 4, bloc de 2 x 2).
    'cerisier': ('Cerisier en fleurs', 'arbres', lambda: lis_tree('dppt-rose'), 3, 'land'),
    'arbre-olive': ('Arbre olive', 'arbres', lambda: lis_tree('dppt-olive'), 3, 'land'),
    'arbre-pointu': ('Arbre pointu', 'arbres', lambda: lis_tree('dppt-pointu'), 3, 'land'),
    'arbre-pointu-brun': ('Arbre pointu brun', 'arbres', lambda: lis_tree('dppt-pointu-brun'), 3, 'land'),
    'arbre-roux': ('Arbre roux', 'arbres', lambda: lis_tree('dppt-roux'), 3, 'land'),
    'feuillu-orange': ('Grand feuillu orange', 'arbres', lambda: lis_tree('dppt-large-orange'), 3, 'land'),
    'pin-bleu': ('Pin bleu', 'arbres', lambda: lis_tree('dppt-pin-bleu'), 3, 'land'),
    'sapin-sombre': ('Sapin sombre', 'arbres', lambda: lis_tree('g4-sapin-sombre'), 3, 'land'),
    'palmier-2': ('Palmier (autre)', 'arbres', lambda: lis_tree('g4-palmier-2'), 3, 'land'),
    # Plantes.
    'fougere': ('Fougère', 'plantes', lambda: lib_building((4, 401, 35, 34), sid='g4-plantes', shadow=True), -1, 'land'),
    # Posés à la main sur Hanoï (octobre 2026).
    'portique': ('Portique', 'mobilier', lambda: lib_building((128, 1904, 96, 64), sid='g4-mobilier', dark=300), 3, 'land'),
    'pont-arque': ('Pont arqué', 'eau', lambda: lib_building((240, 1392, 64, 64), sid='g4-ponts'), None, 'water'),
    'banniere-bleue': ('Bannière bleue', 'mobilier', lambda: lib_building((160, 3984, 32, 80), sid='g4-mobilier'), 4, 'land'),
    'champignon': ('Champignon', 'plantes', lambda: lib_building((17, 481, 14, 14), sid='g4-plantes', shadow=True), None, 'land'),
    'baies-sombres': ('Buisson à baies', 'plantes', lambda: lib_building((6, 564, 36, 28), sid='g4-plantes', shadow=True), -1, 'land'),
    'hortensias': ('Hortensias', 'plantes', lambda: lib_building((2, 643, 44, 29), sid='g4-plantes', shadow=True), -1, 'land'),
    'arbuste-taille': ('Arbuste taillé', 'plantes', lambda: lib_building((80, 248, 18, 24), sid='g4-plantes', shadow=True), -1, 'land'),
    'tronc-mousse': ('Tronc moussu', 'plantes', lambda: lib_building((17, 480, 30, 16), sid='g4-herbes', shadow=True), -1, 'land'),
    'oranger': ('Petit oranger', 'plantes', lambda: lib_building((17, 1278, 14, 29), sid='g4-herbes', shadow=True), -1, 'land'),
    'iris': ('Iris bleus', 'plantes', lambda: lib_building((50, 648, 12, 24), sid='g4-plantes', shadow=True), None, 'land'),
    'buisson-orange': ('Buisson à fleurs orange', 'plantes', lambda: lib_building((65, 1277, 14, 14), sid='g4-herbes', shadow=True), -1, 'land'),
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
    'poubelle-bleue': ('Poubelle bleue', 'mobilier', lambda: lib_building((31, 1032, 14, 24), sid='g4-mobilier'), -1, 'land'),
    'poubelle-rouge': ('Poubelle rouge', 'mobilier', lambda: lib_building((16, 1033, 14, 23), sid='g4-mobilier'), -1, 'land'),
    'feu': ('Feu de camp', 'mobilier', lambda: lib_building((54, 1869, 34, 29), sid='g4-mobilier'), -1, 'land'),
    'puits-pierre': ('Puits de pierre', 'mobilier', lambda: lib_building((219, 2958, 21, 45), sid='g4-mobilier'), -1, 'land'),
    'cloche': ('Cloche', 'mobilier', lambda: lib_building((13, 3041, 38, 37), sid='g4-mobilier'), -1, 'land'),
    'banc-blanc': ('Banc blanc', 'mobilier', lambda: lib_building((263, 3131, 34, 21), sid='g4-mobilier'), -1, 'land'),
    'annonces': ('Tableau d\'annonces', 'mobilier', lambda: lib_building((0, 3335, 16, 25), sid='g4-mobilier'), -1, 'land'),
    'lanterne-jardin': ('Lanterne de jardin', 'mobilier', lambda: lib_building((58, 3398, 20, 47), sid='g4-mobilier'), -1, 'land'),
    'poteau-indicateur': ('Poteau indicateur', 'mobilier', lambda: lib_building((224, 4180, 32, 27), sid='g4-mobilier'), -1, 'land'),
    'buches': ('Bûches', 'mobilier', lambda: lib_building((101, 4236, 22, 20), sid='g4-mobilier'), -1, 'land'),
    'table-jardin': ('Table de jardin', 'mobilier', lambda: lib_building((115, 4613, 89, 43), sid='g4-mobilier'), -2, 'land'),
    'tente': ('Tente', 'mobilier', lambda: lib_building((258, 2012, 59, 68), sid='g4-mobilier'), -3, 'land'),
    'tente-brune': ('Tente brune', 'mobilier', lambda: lib_building((130, 2013, 59, 67), sid='g4-mobilier'), -3, 'land'),
    'tente-violette': ('Tente violette', 'mobilier', lambda: lib_building((194, 2013, 59, 67), sid='g4-mobilier'), -3, 'land'),
    # Boîtes aux lettres de couleur (une famille : une pastille « couleur »).
    'boite-orange': ('Boîte aux lettres orange', 'mobilier', lambda: lib_building((16, 1576, 14, 26), sid='g4-mobilier'), -1, 'land'),
    'boite-verte': ('Boîte aux lettres verte', 'mobilier', lambda: lib_building((32, 1576, 14, 26), sid='g4-mobilier'), -1, 'land'),
    'boite-jaune': ('Boîte aux lettres jaune', 'mobilier', lambda: lib_building((48, 1576, 14, 26), sid='g4-mobilier'), -1, 'land'),
    'boite-bleue': ('Boîte aux lettres bleue', 'mobilier', lambda: lib_building((64, 1576, 14, 26), sid='g4-mobilier'), -1, 'land'),
    'panneau-bois': ('Panneau en bois', 'mobilier', lambda: lib_building((294, 4177, 20, 31), sid='g4-mobilier'), -1, 'land'),
    'oriflamme': ('Oriflamme', 'mobilier', lambda: lib_building((68, 4120, 23, 56), sid='g4-mobilier'), -1, 'land'),
    'reverbere-rouge': ('Réverbère rouge', 'mobilier', lambda: lib_building((274, 3396, 16, 40), sid='g4-mobilier'), -1, 'land'),
    'souche': ('Souche et hache', 'plantes', lambda: lib_building((262, 4181, 19, 27), sid='g4-mobilier', shadow=True), 1, 'land'),
    # Sur l'eau (toujours bloquante : rien à ajouter).
    'barque': ('Barque', 'eau', lambda: isolate(crop('g4-vehicules', 6, 10, 5, 3)), None, 'water'),
    'voilier': ('Voilier', 'eau', lambda: crop('g4-vehicules', 0, 59, 3, 2), None, 'water'),
    'voilier-bleu': ('Voilier bleu', 'eau', lambda: crop('g4-vehicules', 0, 62, 3, 2), None, 'water'),
    'peniche': ('Péniche', 'eau', lambda: crop('g4-vehicules', 0, 30, 6, 3), None, 'water'),
    'cargo': ('Cargo à grues', 'eau', lambda: isolate(crop('g4-vehicules', 0, 82, 9, 4)), None, 'water'),
    'rocher-mer': ('Rocher dans l\'eau', 'eau', lambda: crop('dppt', 7, 145), None, 'water'),
}

MAP_ELEMENTS_DIR = ROOT / 'assets-source' / 'elements-cartes'
MAP_ELEMENTS = json.loads((MAP_ELEMENTS_DIR / 'elements.json').read_text())

def lis_tree(vid):
    return crop('lisieres', 0, LIS_ROUND[vid], 4, 4)


# L'arbre rond de la planche des lisières (scripts/build_lisieres.py), par palette : sa première rangée.
LIS_ROUND = {v['id']: v['roundRow'] for v in json.loads((V2 / 'lisieres.json').read_text())['variants']}

# ---------- Thèmes ----------
COMMON = ['buisson', 'baies', 'arbuste-rose', 'rocher', 'panneau', 'boite-lettres', 'boite-orange', 'boite-verte',
          'boite-jaune', 'boite-bleue', 'banc', 'jardiniere-rouge',
          'jardiniere-orange', 'jardiniere-rose', 'pot', 'nenuphar', 'rocher-mer', 'barque', 'voilier']
THEMES = {
    'libre': {'name': 'Libre (toutes les couleurs d\'origine)', 'forest': 'dppt', 'paving': 'gris', 'lamp': 'reverbere',
              'extra': list(ELEMENTS)},
    'fort-de-france': {'name': 'Fort-de-France (tropicale)', 'forest': None, 'paving': None, 'lamp': 'reverbere-rose',
                       'extra': ['palmier', 'hibiscus', 'fleurs-tropicales', 'parasol', 'drapeau-martinique',
                                 'statue-blanche', 'voilier-bleu', 'etal', 'etal-bocaux', 'transat',
                                 'caisse', 'petite-fontaine', 'banc-blanc', 'reverbere-rouge', 'poubelle-bleue', 'palmier-2',
                                 'oranger', 'buisson-orange', 'fougere', 'cerisier']},
    'saint-ay': {'name': 'Saint-Ay (village de Loire)', 'forest': 'chene', 'paving': None, 'lamp': 'lanterne-bois',
                 'palette': 'saint-ay', 'extra': ['arbre-foret', 'peuplier', 'roseaux', 'bois', 'fontaine', 'massif',
                           'pique-nique', 'puits-pierre', 'lanterne-jardin', 'table-jardin', 'poubelle-rouge',
                           'arbre-olive', 'arbre-pointu', 'fougere', 'champignon', 'tronc-mousse', 'iris']},
    'route-de-montepilloy': {'name': 'Route de campagne', 'forest': 'dppt', 'paving': None, 'lamp': None,
                             'extra': ['arbre-foret', 'peuplier', 'poteau-indicateur', 'tente', 'feu', 'buches',
                                       'arbre-pointu', 'arbre-pointu-brun', 'champignon', 'tronc-mousse', 'baies-sombres',
                                       'tente-brune', 'tente-violette']},
    'montepilloy': {'name': 'Montépilloy (village agricole)', 'forest': 'automne', 'paving': None, 'lamp': None,
                    'extra': ['arbre-foret', 'puits', 'bois', 'banc-bois', 'abri-bois', 'souche',
                              'caisse', 'feu', 'buches', 'poteau-indicateur', 'table-jardin', 'poubelle-rouge',
                              'arbre-roux', 'feuillu-orange', 'baies-sombres', 'tronc-mousse', 'hortensias']},
    'bonsecours': {'name': 'Collège de Bonsecours', 'forest': 'pins', 'paving': None, 'lamp': 'globe',
                   'palette': 'bonsecours', 'extra': ['sapin', 'drapeau-france', 'velo', 'distributeur', 'affichage',
                             'pique-nique', 'fontaine', 'cloche', 'annonces', 'panneau-bois', 'poubelle-bleue',
                             'pin-bleu', 'sapin-sombre', 'fougere', 'champignon', 'arbuste-taille']},
    'prytanee': {'name': 'Prytanée (lycée militaire)', 'forest': 'haie', 'paving': 'gravier', 'lamp': 'lanterne-bleue',
                 'extra': ['haie', 'statue-bronze', 'drapeau-france', 'oriflamme', 'cloche', 'banc-blanc', 'poubelle-bleue',
                           'arbuste-taille', 'cerisier', 'hortensias', 'iris']},
    'bordeaux': {'name': 'Bordeaux (pierre blonde)', 'forest': None, 'paving': 'blond', 'lamp': 'lanterne-hgss',
                 'palette': 'bordeaux', 'extra': ['peniche', 'velo', 'cerisier', 'arbuste-taille', 'hortensias', 'oranger']},
    'hull': {'name': 'Hull (brique anglaise)', 'forest': None, 'paving': 'brique', 'lamp': 'reverbere-noir',
             'palette': 'hull', 'extra': ['cargo', 'cabine', 'velo', 'arbre-olive', 'arbuste-taille', 'hortensias', 'cerisier']},
    'hanoi': {'name': 'Hanoï (Johto)', 'forest': None, 'paving': None, 'lamp': 'lanterne-hgss',
              'extra': ['portique', 'pont-arque', 'banniere-bleue', 'cerisier', 'palmier', 'palmier-2', 'fleurs-tropicales',
                        'nenuphar', 'roseaux', 'cloche', 'etal', 'etal-bocaux', 'velo', 'oriflamme', 'fougere',
                        'lanterne-jardin', 'lanterne-bois', 'pot', 'hibiscus', 'arbuste-taille', 'reverbere-rouge']},
}
# Au moins cinq arbres par ville (octobre 2026).
MORE_TREES = {
    'fort-de-france': ['arbre-olive', 'arbre-pointu'],
    'saint-ay': ['cerisier'],
    'route-de-montepilloy': ['arbre-olive'],
    'montepilloy': ['arbre-pointu-brun', 'peuplier'],
    'bonsecours': ['arbre-foret', 'arbre-pointu'],
    'prytanee': ['arbre-foret', 'arbre-pointu', 'arbre-olive', 'pin-bleu'],
    'bordeaux': ['arbre-foret', 'arbre-olive', 'arbre-pointu', 'feuillu-orange'],
    'hull': ['arbre-foret', 'arbre-pointu', 'sapin-sombre'],
    'hanoi': ['arbre-pointu', 'pin-bleu'],
}
for _tid, _more in MORE_TREES.items():
    THEMES[_tid]['extra'] = THEMES[_tid]['extra'] + _more
LIS_TREES = {'cerisier', 'arbre-olive', 'arbre-pointu', 'arbre-pointu-brun', 'arbre-roux', 'feuillu-orange', 'pin-bleu',
             'sapin-sombre', 'palmier-2'}
# Éléments qui gardent leurs couleurs dans les villes à feuillage recoloré.
KEEP_COLOURS = {'hibiscus', 'arbuste-rose', 'hortensias', 'iris', 'oranger', 'buisson-orange', 'champignon'} | LIS_TREES
# Matières en motif ajoutées en octobre 2026 (planches de la bibliothèque Gen 4, 2 x 2 cases qui se raccordent), dans
# toutes les villes : id, nom, planche, colonne, rangée.
PATTERNS = [
    ('chevrons', 'Pavés en chevrons', 'g4-sols', 11, 8),
    ('dallage-dore', 'Dallage doré', 'g4-sols', 12, 21),
    ('dalles', 'Dalles de pierre', 'g4-sols', 16, 12),
    ('parquet', 'Planches', 'g4-sols', 1, 42),
    ('terre', 'Terre', 'g4-herbes', 0, 46),
    ('pierres', 'Chemin de pierres', 'g4-herbes', 0, 50),
    # Ajoutées le 7 octobre 2026 (motif de 2 x 2, ou de la taille donnée : largeur, hauteur).
    ('rosaces', 'Carrelage à rosaces', 'g4-sols', 8, 80),
    ('eventail', 'Pavés en éventail', 'g4-sols', 9, 109),
    ('briques-jaunes', 'Briques jaunes', 'g4-sols', 1, 160),
    ('briques-sable', 'Briques sable', 'g4-sols', 4, 126, 4, 2),
    ('pierres-olive', 'Pierres vert olive', 'g4-sols', 17, 110, 4, 2),
]
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


# ---------- Couleurs (octobre 2026) ----------
# Un élément qui n'existe qu'en plusieurs couleurs n'apparaît qu'une fois dans le panneau, avec une pastille « couleur »
# qui ouvre ses teintes (studio.js) : les éléments d'une même famille ont `group` (l'id du premier) et `colour` (la
# couleur de leur pastille). Familles : même rayon, même taille et même silhouette (pixels pleins à 90 % communs).
ROOF_HUES = {'rouge': 0, 'orange': 28, 'vert': 120, 'bleu': 215, 'violet': 275}
ROOF_NAMES = {'rouge': 'toit rouge', 'orange': 'toit orange', 'vert': 'toit vert', 'bleu': 'toit bleu', 'violet': 'toit violet'}


def _hsv(a):
    rgb = a[..., :3].astype(float) / 255
    mx, mn = rgb.max(-1), rgb.min(-1)
    d = mx - mn
    h = np.zeros(mx.shape)
    r, g, b = rgb[..., 0], rgb[..., 1], rgb[..., 2]
    m = d > 0
    rm = m & (mx == r)
    gm = m & (mx == g) & ~rm
    bm = m & ~rm & ~gm
    h[rm] = ((g - b)[rm] / d[rm]) % 6
    h[gm] = (b - r)[gm] / d[gm] + 2
    h[bm] = (r - g)[bm] / d[bm] + 4
    s = np.where(mx > 0, d / np.where(mx > 0, mx, 1), 0)
    return h * 60, s, mx


def _rgb(h, s, v):
    c = v * s
    hp = (h / 60) % 6
    x = c * (1 - np.abs(hp % 2 - 1))
    z = np.zeros_like(h)
    k = np.floor(hp).astype(int)
    r = np.select([k == 0, k == 1, k == 2, k == 3, k == 4, k == 5], [c, x, z, z, x, c])
    g = np.select([k == 0, k == 1, k == 2, k == 3, k == 4, k == 5], [x, c, c, x, z, z])
    b = np.select([k == 0, k == 1, k == 2, k == 3, k == 4, k == 5], [z, z, x, c, c, x])
    mm = v - c
    return np.stack([r + mm, g + mm, b + mm], -1)


def roof_hue(img, rows=None):
    """La teinte dominante des pixels saturés du haut de l'image (le toit), ou None."""
    a = np.array(img.convert('RGBA'))[:rows]
    h, s, v = _hsv(a)
    sel = (a[..., 3] > 0) & (s > 0.3) & (v > 0.25)
    if sel.sum() < 40:
        return None
    hist, edges = np.histogram(h[sel], bins=36, range=(0, 360))
    return float(edges[hist.argmax()] + 5)


def roof_pixels(a, src_hue, spread=24, rows=None, min_s=0.2):
    """Les pixels de la teinte `src_hue` (± spread degrés, assez saturés) ; seulement le toit si on donne `rows` : les
    zones de cette teinte d'un seul tenant qui touchent le haut de la maison (`rows` premières lignes de pixels) ; les
    murs de la même teinte, séparés par le liseré, n'en sont pas."""
    h, s, v = _hsv(a)
    dh = (h - src_hue + 180) % 360 - 180
    sel = (a[..., 3] > 0) & (np.abs(dh) <= spread) & (s > min_s)
    if rows is not None:
        lab, _ = ndimage.label(sel, structure=np.ones((3, 3)))
        top = set(np.unique(lab[:rows][sel[:rows]])) - {0}
        sel = np.isin(lab, list(top))
        bottom = np.nonzero((a[..., 3] > 0).any(1))[0][-1]
        sel[bottom - TILE + 1:] = False                # la rangée du bas (porte, soubassement) garde ses couleurs
    return sel, dh, s, v


def recolour(img, src_hue, dst_hue, spread=24, rows=None):
    """Les pixels de la teinte `src_hue` passent à la teinte `dst_hue` (le toit seulement avec `rows`, roof_pixels)."""
    a = np.array(img.convert('RGBA'))
    sel, dh, s, v = roof_pixels(a, src_hue, spread, rows)
    rgb = _rgb((dst_hue + dh) % 360, s, v)
    out = a.copy()
    out[sel, :3] = np.clip(rgb[sel] * 255 + 0.5, 0, 255).astype(np.uint8)
    return Image.fromarray(out)


# Rouge tuile commun des toits de Hull (octobre 2026) : teinte, saturation et luminosité médianes du toit ; le relief
# (écarts à la médiane) est gardé, un peu adouci sur les toits très contrastés.
TILE_RED = (11, 0.68, 0.72)


def roof_rows(img):
    """Hauteur en pixels du haut du dessin, où commence le toit."""
    rows_with = np.nonzero(np.array(img.convert('RGBA'))[..., 3].any(1))[0]
    top, bottom = int(rows_with[0]), int(rows_with[-1])
    return top + max(TILE, int((bottom - top) * 0.3))


def tile_roof(img):
    """Le toit (zone de la teinte dominante du haut du dessin) au rouge tuile commun."""
    rows = roof_rows(img)
    hue = roof_hue(img, rows)
    if hue is None:
        return img
    a = np.array(img.convert('RGBA'))
    sel, _, s, v = roof_pixels(a, hue, 24, rows, min_s=0.3)
    th, ts, tv = TILE_RED
    ms, mv = np.median(s[sel]), np.median(v[sel])
    rel_v = np.clip(v / mv, 0, 3) ** 0.8
    rgb = _rgb(np.full(v.shape, float(th)), np.clip(ts * (s / ms) ** 0.5, 0, 1), np.clip(tv * rel_v, 0, 1))
    out = a.copy()
    out[sel, :3] = np.clip(rgb[sel] * 255 + 0.5, 0, 255).astype(np.uint8)
    return Image.fromarray(out)


def add_roof_variants(pack, elements, img, solid_from, door):
    """Les autres couleurs de toit d'une maison (thème Libre) : une famille avec la maison de base."""
    base = elements[-1]
    roof = roof_rows(img)
    hue = roof_hue(img, roof)
    if hue is not None:
        area = recolour(img, hue, (hue + 180) % 360, rows=roof)
        changed = (np.array(area) != np.array(img.convert('RGBA'))).any(-1).sum()
        a0 = np.array(img.convert('RGBA'))
        roof_px = (np.array(area) != a0).any(-1)
        if changed < 0.15 * (a0[..., 3] > 0).sum() or _hsv(a0)[1][roof_px].mean() < 0.35:
            hue = None                                 # pas de grand toit bien coloré (toit gris…) : pas de variantes
    if hue is None:
        return
    for cname, dst in ROOF_HUES.items():
        if min(abs(dst - hue), 360 - abs(dst - hue)) < 40:
            continue                                   # déjà de cette couleur
        entry = element_entry(pack, f"{base['id']}-{cname}", f"{base['name']} ({ROOF_NAMES[cname]})", 'maisons',
                              recolour(img, hue, dst, rows=roof), solid_from, 'land', door=door)
        entry['group'] = base['id']
        elements.append(entry)
    if elements[-1] is not base:
        base['group'] = base['id']


def group_colours(elements, pack):
    """Familles de couleurs : `group` et `colour` (pastille) sur les éléments d'une même silhouette."""
    def image(e):
        a = np.zeros((e['h'] * TILE, e['w'] * TILE, 4), np.uint8)
        for j, row in enumerate(e['tiles']):
            for i, k in enumerate(row):
                if k >= 0:
                    a[j * TILE:(j + 1) * TILE, i * TILE:(i + 1) * TILE] = np.array(pack.tiles[k])
        return a
    imgs = {e['id']: image(e) for e in elements}
    for e in elements:
        a = imgs[e['id']]
        h, s, v = _hsv(a)
        sel = (a[..., 3] > 0) & (s > 0.25) & (v > 0.2)
        px = a[sel][:, :3] if sel.sum() >= 10 else a[a[..., 3] > 0][:, :3]
        if len(px):
            # La couleur la plus fréquente parmi les pixels colorés (arrondie), pour la pastille.
            q = (px // 24) * 24 + 12
            vals, counts = np.unique(q, axis=0, return_counts=True)
            r, g, b = vals[counts.argmax()]
            e['colour'] = f'#{int(r):02x}{int(g):02x}{int(b):02x}'
    for i, e in enumerate(elements):
        if e.get('group'):
            continue
        mask = imgs[e['id']][..., 3] > 0
        for f in elements[i + 1:]:
            if f.get('group') or f['cat'] != e['cat'] or (f['w'], f['h']) != (e['w'], e['h']):
                continue
            m2 = imgs[f['id']][..., 3] > 0
            inter = (mask & m2).sum()
            if inter >= 0.9 * max(mask.sum(), m2.sum()) and not np.array_equal(imgs[e['id']], imgs[f['id']]):
                e['group'] = e['id']
                f['group'] = e['id']


def element_entry(pack, eid, name, cat, img, solid_from, place, door=None, theme_fn=None):
    if theme_fn:
        img = theme_fn(img)
    if solid_from is not None and solid_from < 0:              # compté depuis le bas : -1, la dernière rangée
        solid_from += img.height // TILE
    # Bâtiments et mobilier sans ombre portée (scripts/remove_shadows.py) ; la végétation garde la sienne.
    if cat in ('maisons', 'mobilier'):
        img = shadowless(img)
    # Bâtiments et mobilier : un trait gris très foncé autour du dessin, le même pour tous (scripts/outline_buildings.py).
    if cat in ('maisons', 'mobilier'):
        img = outlined(img)
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
            if tid == 'libre':
                add_roof_variants(pack, elements, img, solid_from, list(spec['door']))
        for bid, (bname, box, door_col, greys, where, *opts) in LIB_BUILDINGS.items():
            opts = opts[0] if opts else set()
            if tid != 'libre' and tid not in where:
                continue
            img = lib_building(box, greys, inside='inside' in opts)
            if 'tile' in opts:
                img = tile_roof(img)
            h = img.height // TILE
            solid_from = max(1, h - math.ceil(h * 0.55))
            elements.append(element_entry(pack, f'maison-{bid}', bname, 'maisons', img, solid_from, 'land',
                                          door=[door_col, h - 1], theme_fn=None if 'tile' in opts else pal))
            if tid == 'libre':
                add_roof_variants(pack, elements, img, solid_from, [door_col, h - 1])
        # Éléments relevés sur les cartes (scripts/harvest_map_elements.py, choisis et nommés dans
        # assets-source/elements-cartes/elements.json) : dans le thème de leur carte et dans Libre ; l'image vient de la
        # carte (sans ombre, avec contour), les collisions aussi.
        for me in MAP_ELEMENTS:
            if tid != 'libre' and tid != me['map']:
                continue
            img = Image.open(MAP_ELEMENTS_DIR / f"{me['id']}.png").convert('RGBA')
            entry = element_entry(pack, me['id'], me['name'], me['cat'], img, me['over'], me['place'], door=me['door'])
            entry['solid'] = [row[:] for row in me['solid']]
            if me['door']:
                entry['solid'][me['door'][1]][me['door'][0]] = 0
            elements.append(entry)
        ids = list(dict.fromkeys(COMMON + t['extra'] + ([t['lamp']] if t['lamp'] else [])))
        for eid in ids:
            name, cat, fn, solid_from, place = ELEMENTS[eid]
            img = fn()
            if eid == 'arbre-foret' and t['forest'] in FOREST_FN:                 # l'arbre rond, palette de la ville
                img = crop('lisieres', 0, LIS_ROUND[t['forest']], 4, 4)
            elif cat in ('arbres', 'plantes') and leaves and eid not in KEEP_COLOURS:
                img = leaves(img)
            entry = element_entry(pack, eid, name, cat, img, solid_from, place)
            if eid == 'arbre-foret' or eid in LIS_TREES:  # l'arbre rond bloque son bloc de 2 x 2 (colonnes 1-2)
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
        for mid, mname, sid, c, r, *size in PATTERNS:
            pw, ph = size or (2, 2)
            materials.append({'id': mid, 'name': mname, 'kind': 'pattern',
                              'tiles': [[pack.add_tile(crop(sid, c + i, r + j)) for i in range(pw)] for j in range(ph)],
                              'solid': 0})
        # Ponton : un plancher de 2 cases de large (les bords gauche et droit du ponton de Fort-de-France), qu'on peint
        # sur l'eau pour faire un pont ; on marche dessus.
        materials.append({'id': 'ponton', 'name': 'Ponton', 'kind': 'pattern',
                          'tiles': [[pack.add_tile(crop(*PIER[j][i])) for i in (0, 2)] for j in range(2)],
                          'solid': 0})
        materials.append({'id': 'bitume', 'name': 'Bitume', 'kind': 'pattern',
                          'tiles': [[pack.add_tile(crop(*ASPHALT[j * 2 + i])) for i in range(2)] for j in range(2)],
                          'solid': 0})
        if t['forest'] in FOREST_FN:
            fill = FOREST_FN[t['forest']](crop('g4-arbres', 0, 145, 2, 2))
            materials.append({'id': 'foret', 'name': 'Forêt', 'kind': 'forest', 'variant': t['forest'],
                              'tiles': pack.add(fill), 'solid': 1})
        elif t['forest'] in FOREST_PATTERN:
            sid, c, r, w, h, fn = FOREST_PATTERN[t['forest']]
            img = crop(sid, c, r, w, h)
            materials.append({'id': 'foret', 'name': 'Forêt' if t['forest'] == 'pins' else 'Haie d\'enceinte',
                              'kind': 'pattern', 'tiles': pack.add(fn(img) if fn else img), 'solid': 1})
        group_colours(elements, pack)
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
