#!/usr/bin/env python3
"""Bibliothèque Gen 4 (DS) du créateur de cartes : tous les éléments des planches Gen 4, rangés par type.

Lit les planches Gen 4 de public/assets/v2/ (préparées par scripts/build_v2_tiles.py) et écrit une planche par type
d'élément (public/assets/v2/g4-<type>.png), ajoutées au catalogue ; les planches d'origine y restent (les cartes déjà
faites s'en servent) mais n'apparaissent plus dans la palette.

1. Herbe : le vert de fond de chaque planche est ramené au vert de Diamant / Perle (104, 208, 160), pour que tout se
   raccorde (les planches HGSS ont un vert plus jaune).
2. Éléments : chaque objet d'un seul tenant est un élément (un arbre, une maison, un bloc de sol…) ; un objet voisin qui
   partage une case reste à part (ses pixels sont écartés). Sur une planche quadrillée, l'élément garde ses cases
   (alignement d'origine) ; sur une planche posée au pixel près (justin8964, Kyle-Dove, terriblejared), il est recalé
   sur la grille de 16 px, en bas au centre.
3. Type : d'abord la zone de la planche où il se trouve (REGIONS, délimitées à l'œil ; un élément à cheval sur deux
   zones de types différents est coupé), puis les corrections élément par élément (OVERRIDES), enfin, hors zone,
   d'après la taille, l'opacité et les couleurs (classify).
4. Doublons : deux éléments de même taille et presque identiques (empreinte d'image) ; on garde celui de la meilleure
   planche (ordre de SOURCES : les planches soignées et quadrillées d'abord).

5. Cartes : les cartes du créateur qui utilisent la bibliothèque sont recalées sur les nouvelles planches (chaque case
   retrouvée au pixel près ; sinon gardée dans g4-archive) : on peut refaire la bibliothèque sans les abîmer.

Usage : python3 scripts/build_g4_library.py   (après build_v2_tiles.py ; convert_maps_v2.py ne change pas)
        G4_DEBUG=<dossier> python3 scripts/build_g4_library.py : planches de contrôle (éléments numérotés, planche et
        case d'origine) et mesures de chaque élément, pour vérifier le tri.
"""
import colorsys
import json
import os
from pathlib import Path

import numpy as np
from PIL import Image
from scipy import ndimage

ROOT = Path(__file__).resolve().parent.parent
V2 = ROOT / 'public' / 'assets' / 'v2'
TILE = 16
DPPT_GRASS = (104, 208, 160)

# Planches Gen 4, de la meilleure à la moins bonne (en cas de doublon, la première gagne) : (id, quadrillée ?, intérieur ?)
# Laissées de côté : « HGSS récentes » d'Akizakura16 (identiques aux planches DPPt), lightbulb15 (quasi identique à
# justin8964), les « Biomes » de Kyle-Dove (des cartes d'exemple, pas des éléments séparables).
SOURCES = [
    ('objets', False, False), ('autotiles-g4', True, False),
    ('dppt', True, False), ('dppt-int', True, True), ('hgss-int', True, True), ('jesus-3', True, True),
    ('rmxp-nature', True, False), ('rmxp-urbain', True, False), ('rmxp-batiments', True, False),
    ('kyle-ext', True, False), ('wilson-1', True, False), ('wilson-2', True, True), ('kaliser', True, False),
    ('lotus-1', True, False), ('lotus-2', True, False), ('lotus-aigue', True, False),
    ('jesus-1', True, False), ('jesus-2', True, False), ('g4-pack', True, False),
    ('sinnoh-kyle', False, False), ('ds-justin', False, False),
    ('jared-bateaux', False, False), ('jared-camping', False, False),
]

# Sections des planches quadrillées, en cases : (x0, y0, x1, y1, type) ; type None = d'après l'image ; 'skip' = ignoré
# (mentions « Credit: »). Hors section : d'après l'image. Les planches RMXP sont rangées en colonnes de 8 cases
# séparées par une colonne de pointillés (voir rmxp_strips).
def rmxp_strips(kinds):
    return [(9 * i + 1, 0, 9 * i + 9, 10_000, kind) for i, kind in enumerate(kinds)]


REGIONS = {
    'dppt': [(0, 0, 8, 5, 'sols'), (0, 5, 8, 17, 'eau'), (0, 17, 8, 30, 'sols'), (0, 30, 8, 40, 'sols'),
             (0, 40, 8, 115, 'arbres'), (0, 115, 8, 125, None), (0, 125, 4, 134, 'clotures'), (4, 125, 8, 134, None),
             (0, 134, 8, 150, None), (0, 150, 8, 10_000, 'batiments')],
    'autotiles-g4': [(0, 0, 3, 4, 'herbes'), (3, 0, 6, 4, 'sols'), (0, 4, 3, 8, 'herbes'), (3, 4, 7, 5, 'plantes'),
                     (0, 8, 4, 9, 'plantes'), (4, 8, 8, 9, 'eau')],
    # Colonne 4 de rmxp-nature : rebords de falaise, puis dallage, eau, petites plantes ; colonne 2 de rmxp-urbain :
    # rails, caisses, ombres, exemple de cascade (écartés), ponts, marches, margelles.
    'rmxp-nature': [(37, 0, 46, 38, 'rochers'), (37, 38, 46, 44, 'sols'), (37, 44, 46, 52, 'eau'), (37, 52, 46, 10_000, None)]
                   + rmxp_strips(['sols', 'sols', 'arbres', None, None, 'rochers', 'rochers', 'rochers', 'rochers',
                                  'rochers', 'rochers']),
    'rmxp-urbain': [(19, 0, 28, 9, 'ponts'), (19, 9, 28, 20, 'mobilier'), (19, 20, 28, 37, 'skip'),
                    (19, 37, 28, 55, 'ponts'), (19, 55, 28, 10_000, None), (28, 26, 37, 31, 'mobilier')]
                   + rmxp_strips(['sols', 'sols', None, 'clotures', 'mobilier', 'mobilier']),
    'rmxp-batiments': rmxp_strips(['batiments'] * 18),
    'kyle-ext': [(0, 0, 8, 2, 'skip'), (0, 40, 4, 43, 'rochers'), (0, 43, 4, 48, 'arbres'), (4, 40, 8, 48, 'herbes'),
                 (0, 48, 8, 90, 'arbres'), (4, 90, 8, 98, 'arbres'), (0, 90, 8, 122, 'rochers'),
                 (0, 130, 6, 142, 'arbres'), (0, 122, 8, 132, 'sols'), (5, 156, 8, 160, 'plantes'),
                 (4, 142, 8, 160, 'arbres'), (0, 142, 4, 160, 'sols'), (0, 166, 8, 190, 'arbres'),
                 (0, 190, 8, 194, 'batiments'), (0, 194, 8, 200, 'ponts'), (0, 200, 8, 206, 'clotures'),
                 (0, 206, 8, 210, 'skip')],
    'kaliser': [(0, 0, 8, 2, 'skip'), (0, 6, 2, 14, 'clotures'), (0, 6, 8, 15, 'arbres'), (0, 15, 8, 20, 'rochers'),
                (0, 24, 8, 42, 'arbres'), (0, 40, 8, 10_000, 'batiments')],
    'lotus-1': [(0, 0, 8, 2, 'skip'), (0, 2, 8, 22, 'arbres'), (0, 22, 8, 25, None), (0, 25, 8, 37, 'clotures'),
                (0, 37, 8, 10_000, 'batiments')],
    'lotus-2': [(0, 0, 8, 2, 'skip'), (0, 2, 8, 22, 'arbres'), (0, 22, 8, 25, None), (0, 25, 8, 37, 'clotures'),
                (0, 37, 8, 10_000, 'batiments')],
    'lotus-aigue': [(0, 0, 8, 2, 'skip'), (0, 2, 8, 10_000, 'batiments')],
    'jesus-1': [(0, 0, 8, 2, 'skip'), (0, 2, 8, 7, 'herbes'), (0, 16, 8, 52, 'arbres'), (0, 70, 8, 10_000, 'batiments')],
    'jesus-2': [(0, 0, 8, 2, 'skip'), (0, 2, 8, 7, 'herbes'), (0, 16, 8, 52, 'arbres'), (0, 70, 8, 10_000, 'batiments')],
    # Grande planche de justin8964 (au pixel près, coordonnées en cases) : zones vues à l'œil ; la première qui
    # contient le centre d'un élément l'emporte.
    'ds-justin': [
        (40, 0, 47, 6, 'vehicules'), (112, 32, 124, 39, 'vehicules'), (204, 62, 220, 72, 'vehicules'),
        (144, 32, 154, 44, 'mobilier'),
        (0, 0, 32, 16, 'arbres'), (32, 0, 40, 32, 'eau'), (40, 6, 46, 32, 'eau'), (46, 22, 62, 32, 'eau'),
        (54, 4, 62, 12, 'mobilier'), (62, 16, 80, 23, 'clotures'), (62, 0, 96, 32, 'mobilier'),
        (96, 0, 128, 32, 'sols'), (32, 32, 40, 40, 'rochers'), (40, 32, 52, 56, 'ponts'), (52, 32, 62, 63, 'sols'),
        (64, 32, 75, 44, 'ponts'), (75, 32, 88, 44, 'rochers'),
        (200, 16, 224, 32, 'eau'), (168, 0, 224, 32, 'rochers'), (224, 0, 232, 8, 'plantes'), (224, 0, 256, 32, 'sols'),
        (208, 80, 256, 128, 'skip'),
        (0, 64, 168, 128, 'batiments'), (128, 32, 256, 128, 'batiments')],
    'jared-bateaux': [(0, 86, 18, 98, 'int-meubles'), (0, 98, 8, 104, 'int-sols'), (8, 98, 18, 106, 'batiments'),
                      (9, 106, 15, 110, 'mobilier')],
    'jared-camping': [
        (0, 0, 32, 28, 'vehicules'), (24, 26, 32, 30, 'vehicules'), (0, 26, 20, 48, 'mobilier'),
        (16, 28, 32, 36, 'clotures'), (32, 24, 44, 34, 'mobilier'), (36, 4, 52, 22, 'skip'), (44, 0, 56, 4, 'plantes'),
        (52, 4, 56, 12, 'plantes'), (44, 16, 56, 32, 'arbres'), (24, 36, 56, 48, 'vehicules'), (32, 48, 44, 56, 'ponts'),
        (0, 48, 56, 58, 'mobilier')],
    'sinnoh-kyle': [
        (16, 0, 50, 4, 'skip'), (50, 0, 63, 16, 'skip'),
        (26, 4, 38, 8, 'mobilier'), (32, 8, 38, 12, 'mobilier'), (0, 12, 4, 16, 'mobilier'), (8, 48, 20, 54, 'mobilier'),
        (39, 4, 44, 12, 'arbres'), (0, 16, 10, 20, 'arbres'), (0, 20, 4, 24, 'plantes'),
        (30, 24, 46, 28, 'vehicules'), (26, 28, 30, 34, 'vehicules'),
        (0, 32, 10, 44, 'batiments'), (16, 4, 63, 54, 'batiments')],
    'wilson-1': [(0, 0, 8, 2, 'skip'), (0, 2, 8, 12, 'sols'), (0, 12, 8, 16, 'rochers'), (0, 20, 8, 21, 'rochers'),
                 (0, 21, 8, 30, 'arbres'), (0, 32, 4, 36, 'clotures'), (0, 36, 8, 40, 'mobilier'),
                 (0, 40, 8, 57, 'batiments'), (0, 57, 8, 60, 'skip')],
    'wilson-2': [(0, 0, 8, 2, 'skip'), (0, 44, 8, 48, 'skip')], 'g4-pack': [
        (2, 0, 7, 6, 'arbres'), (0, 14, 6, 22, 'rochers'), (0, 21, 4, 30, 'arbres'), (0, 30, 3, 36, 'clotures'),
        (2, 37, 6, 39, 'plantes'), (0, 39, 2, 42, 'plantes'), (0, 42, 8, 46, 'ponts'), (0, 46, 6, 50, 'rochers'),
        (0, 50, 8, 54, 'sols'), (0, 54, 5, 58, 'rochers'), (0, 58, 8, 66, 'batiments'), (0, 66, 2, 68, 'arbres'),
        (0, 68, 8, 71, 'ponts'), (0, 71, 8, 75, 'batiments'), (4, 93, 8, 97, 'mobilier'), (4, 97, 8, 106, 'ponts'),
        (0, 104, 4, 108, 'arbres'), (4, 154, 8, 160, 'clotures'), (0, 160, 8, 170, 'clotures'),
        (0, 79, 8, 160, 'batiments'), (0, 196, 8, 202, 'mobilier'), (0, 208, 8, 214, 'batiments'),
        (0, 236, 5, 244, 'batiments'), (0, 214, 8, 252, 'rochers')], 'jesus-3': [(0, 0, 8, 2, 'skip')],
}
# Corrections élément par élément (vus à l'œil sur les planches de contrôle, G4_DEBUG) : éléments hors section
# que les règles de classify rangent mal (un pont, une fontaine ou un bassin pris pour un bâtiment…).
# Clé : « planche@colonne,rangée » (case en haut à gauche de l'élément sur sa planche d'origine).
OVERRIDES = {
    'dppt@0,115': 'herbes', 'dppt@0,138': 'mobilier', 'ds-justin@0,33': 'mobilier', 'ds-justin@0,44': 'mobilier',
    'ds-justin@0,55': 'ponts', 'ds-justin@11,50': 'ponts', 'ds-justin@112,40': 'eau', 'ds-justin@12,44': 'mobilier',
    'ds-justin@120,41': 'vehicules', 'ds-justin@128,10': 'ponts', 'ds-justin@128,17': 'herbes',
    'ds-justin@128,20': 'herbes', 'ds-justin@128,26': 'mobilier', 'ds-justin@13,36': 'mobilier',
    'ds-justin@131,17': 'herbes', 'ds-justin@131,20': 'herbes', 'ds-justin@134,17': 'mobilier',
    'ds-justin@137,27': 'mobilier', 'ds-justin@139,0': 'eau', 'ds-justin@144,24': 'ponts',
    'ds-justin@144,9': 'mobilier', 'ds-justin@150,18': 'mobilier', 'ds-justin@154,0': 'rochers',
    'ds-justin@18,32': 'mobilier', 'ds-justin@18,40': 'ponts', 'ds-justin@32,40': 'ponts',
    'ds-justin@47,0': 'rochers', 'ds-justin@47,6': 'eau', 'ds-justin@54,0': 'rochers', 'ds-justin@63,54': 'rochers',
    'ds-justin@64,48': 'mobilier', 'ds-justin@68,48': 'vehicules', 'ds-justin@7,31': 'ponts',
    'ds-justin@73,55': 'eau', 'ds-justin@75,44': 'mobilier', 'ds-justin@8,38': 'ponts', 'ds-justin@88,32': 'mobilier',
    'ds-justin@96,32': 'sols', 'ds-justin@96,38': 'mobilier', 'g4-pack@0,0': 'herbes', 'g4-pack@0,170': 'rochers',
    'g4-pack@0,173': 'rochers', 'g4-pack@0,181': 'rochers', 'g4-pack@0,189': 'eau', 'g4-pack@0,8': 'sols',
    'g4-pack@3,31': 'eau', 'jesus-1@0,52': 'mobilier', 'jesus-1@0,7': 'eau', 'jesus-1@2,58': 'rochers',
    'jesus-1@2,63': 'rochers', 'jesus-1@4,53': 'ponts', 'jesus-1@6,61': 'ponts', 'jesus-1@6,65': 'ponts',
    'jesus-2@0,7': 'eau', 'kaliser@0,2': 'herbes', 'kaliser@2,2': 'plantes', 'kaliser@2,20': 'eau',
    'kaliser@4,2': 'sols', 'kyle-ext@0,10': 'herbes', 'kyle-ext@0,18': 'herbes', 'kyle-ext@0,2': 'herbes',
    'kyle-ext@0,26': 'herbes', 'kyle-ext@0,34': 'eau', 'kyle-ext@4,34': 'eau', 'rmxp-nature@28,7': 'plantes',
    'rmxp-nature@29,48': 'arbres', 'rmxp-nature@31,11': 'mobilier', 'rmxp-nature@31,7': 'plantes',
    'rmxp-urbain@19,56': 'mobilier', 'rmxp-urbain@19,61': 'mobilier', 'sinnoh-kyle@3,47': 'mobilier',
    'wilson-1@0,16': 'herbes',
}
# Éléments trop petits pour être un bâtiment (étiquettes « GRASS », « BUG »… des arènes) : ignorés dans une section
# de bâtiments.
MIN_BUILDING = 3
# Cases de remplissage peintes (damier rose et jaune du Gen 4 Pack).
FILLERS = {(255, 174, 201), (239, 228, 176)}
# Éléments de la planche « objets » (découpés à la main, voir build_v2_tiles.py OBJECTS).
OBJECT_KINDS = {'ferry': 'vehicules', 'voilier': 'vehicules', 'palmier': 'arbres', 'palmier-petit': 'arbres',
                'arbre': 'arbres', 'ponton': 'ponts', 'mer': 'eau'}

# (type, nom dans la palette, rayon de la palette du créateur, voir src/builder/builder.js PALETTE_GROUPS). L'ordre
# compte pour les doublons (le premier type gagne) : la palette, elle, suit l'ordre des rayons.
CATEGORIES = [
    ('arbres', 'Arbres', 'Végétation'),
    ('plantes', 'Fleurs et plantes', 'Végétation'),
    ('herbes', 'Herbes et buissons', 'Végétation'),
    ('sols', 'Sols et chemins', 'Sols et chemins'),
    ('eau', 'Eau', 'Eau'),
    ('rochers', 'Rochers et falaises', 'Relief'),
    ('clotures', 'Clôtures et barrières', 'Mobilier urbain'),
    ('ponts', 'Ponts, escaliers et pontons', 'Mobilier urbain'),
    ('batiments', 'Bâtiments', 'Bâtiments'),
    ('vehicules', 'Bateaux et véhicules', 'Décor'),
    ('mobilier', 'Mobilier et objets', 'Mobilier urbain'),
    ('int-sols', 'Intérieurs : sols et murs', 'Intérieurs'),
    ('int-meubles', 'Intérieurs : meubles', 'Intérieurs'),
]


def harmonize_grass(a):
    """Le vert de fond le plus présent (grandes zones unies d'herbe claire) devient le vert DPPt."""
    rgb = a[:, :, :3].astype(int)
    opaque = a[:, :, 3] == 255
    r, g, b = rgb[..., 0], rgb[..., 1], rgb[..., 2]
    grass = opaque & (g >= 150) & (g > r + 20) & (g > b + 10)
    if grass.sum() < 500:
        return a
    colors, counts = np.unique(rgb[grass], axis=0, return_counts=True)
    base = tuple(int(v) for v in colors[np.argmax(counts)])
    if base == DPPT_GRASS:
        return a
    # Les nuances très proches du vert de fond (± 10) suivent, pour ne pas laisser de mouchetures.
    near = opaque & (np.abs(rgb - np.array(base)).max(axis=2) <= 10)
    a = a.copy()
    a[near, :3] = DPPT_GRASS
    return a


def segment(a, gridded):
    """Éléments d'une planche : (x0, y0, x1, y1, masque) en pixels, cadres calés sur les cases si `gridded` ; le
    masque (pixels de l'élément dans son cadre) écarte les pixels d'un voisin qui partage une case.
    Chaque objet d'un seul tenant (au pixel près) est un élément ; un morceau presque entièrement dans le cadre d'un
    autre (une ombre, une fenêtre détachée) le rejoint. Ainsi une clôture posée à côté d'un banc reste à part."""
    alpha = a[:, :, 3] > 24
    if not gridded:                                # planches au pixel près : un pixel d'écart ne sépare pas
        alpha = ndimage.binary_dilation(alpha, iterations=1)
    labels, _ = ndimage.label(alpha, structure=np.ones((3, 3)))
    boxes = []
    for label, sl in enumerate(ndimage.find_objects(labels), 1):
        y0, y1, x0, x1 = sl[0].start, sl[0].stop, sl[1].start, sl[1].stop
        if (y1 - y0) * (x1 - x0) < 40:
            continue
        if gridded:
            x0, y0 = x0 // TILE * TILE, y0 // TILE * TILE
            x1, y1 = -(-x1 // TILE) * TILE, -(-y1 // TILE) * TILE
        boxes.append([x0, y0, x1, y1, {label}])
    # Morceau presque entièrement (60 %) dans le cadre d'un autre : réunis, jusqu'à ce que plus rien ne bouge.
    area = lambda b: (b[2] - b[0]) * (b[3] - b[1])
    merged = True
    while merged:
        merged = False
        boxes.sort(key=area, reverse=True)
        out = []
        for b in boxes:
            for o in out:
                ix = min(o[2], b[2]) - max(o[0], b[0])
                iy = min(o[3], b[3]) - max(o[1], b[1])
                if ix > 0 and iy > 0 and ix * iy >= 0.6 * area(b):
                    o[0], o[1], o[2], o[3] = min(o[0], b[0]), min(o[1], b[1]), max(o[2], b[2]), max(o[3], b[3])
                    o[4] |= b[4]
                    merged = True
                    break
            else:
                out.append(b)
        boxes = out
    # Une très grande zone d'un seul tenant (ex. une suite de blocs de sol collés) est découpée en blocs de 8 x 8 cases.
    out = []
    for x0, y0, x1, y1, ids in boxes:
        parts = [(x0, y0, x1, y1)]
        if gridded and (x1 - x0) * (y1 - y0) > (12 * TILE) ** 2:
            parts = [(bx, by, min(bx + 8 * TILE, x1), min(by + 8 * TILE, y1))
                     for by in range(y0, y1, 8 * TILE) for bx in range(x0, x1, 8 * TILE)]
        for px0, py0, px1, py1 in parts:
            mask = np.isin(labels[py0:py1, px0:px1], list(ids))
            if not gridded:
                mask = ndimage.binary_dilation(mask, iterations=1)   # rend le pixel de bord pris par la dilatation
            if (mask & (a[py0:py1, px0:px1, 3] > 24)).any():
                out.append((px0, py0, px1, py1, mask))
    return out


def elements(sheet_id, a, gridded, interior):
    """Éléments d'une planche, avec leur type imposé par sa section (ou None : d'après l'image)."""
    if sheet_id == 'objets':
        info = json.loads((V2 / 'objets.json').read_text())
        for name, o in info.items():
            if name in OBJECT_KINDS:
                yield (o['col'] * TILE, o['row'] * TILE, (o['col'] + o['w']) * TILE, (o['row'] + o['h']) * TILE,
                       OBJECT_KINDS[name], None)
        return
    regions = REGIONS.get(sheet_id, [])
    # Un morceau à cheval sur deux sections de types différents est coupé à leur limite (ex. sable, herbe et eau
    # collés en haut de dppt, un bateau collé à l'eau) ; sinon il prend le type de la section de son centre.
    def kind_at(x0, y0, x1, y1):
        cx, cy = (x0 + x1) / 2 / TILE, (y0 + y1) / 2 / TILE
        return next((k for rx0, ry0, rx1, ry1, k in regions if rx0 <= cx < rx1 and ry0 <= cy < ry1), None)

    for x0, y0, x1, y1, mask in segment(a, gridded):
        pieces = [(x0, y0, x1, y1)]
        if regions:
            near = [r for r in regions if r[0] * TILE < x1 and x0 < r[2] * TILE and r[1] * TILE < y1 and y0 < r[3] * TILE]
            xs = sorted({x0, x1} | {v * TILE for r in near for v in (r[0], r[2]) if x0 < v * TILE < x1})
            ys = sorted({y0, y1} | {v * TILE for r in near for v in (r[1], r[3]) if y0 < v * TILE < y1})
            cut = [(px0, py0, px1, py1) for px0, px1 in zip(xs, xs[1:]) for py0, py1 in zip(ys, ys[1:])]
            if len({kind_at(*c) for c in cut}) > 1:
                pieces = cut
        for px0, py0, px1, py1 in pieces:
            part = mask[py0 - y0: py1 - y0, px0 - x0: px1 - x0]
            if (part & (a[py0:py1, px0:px1, 3] > 24)).any():
                yield px0, py0, px1, py1, kind_at(px0, py0, px1, py1), part


def is_text(img):
    """Mention écrite (« Credit: … ») : surtout des pixels très sombres, sur peu de hauteur."""
    a = np.array(img).astype(int)
    px = a[a[:, :, 3] > 24][:, :3]
    return len(px) > 0 and img.height <= 2 * TILE and (px.max(axis=1) < 70).mean() > 0.6


def features(img):
    """Mesures d'un élément : taille en cases, opacité, part de chaque famille de couleurs."""
    a = np.array(img).astype(int)
    h, w = a.shape[:2]
    alpha = a[:, :, 3]
    px = a[alpha > 24][:, :3] / 255.0
    if len(px) == 0:
        return None
    wt, ht = -(-w // TILE), -(-h // TILE)
    opaque = (alpha == 255).mean()
    hsv = np.array([colorsys.rgb_to_hsv(*p) for p in px[:: max(1, len(px) // 1500)]])
    hue, sat, val = hsv[:, 0] * 360, hsv[:, 1], hsv[:, 2]
    green = ((hue > 70) & (hue < 170) & (sat > 0.2)).mean()
    blue = ((hue > 185) & (hue < 250) & (sat > 0.3)).mean()
    autumn = (((hue < 45) | (hue > 330)) & (sat > 0.45) & (val > 0.4)).mean()
    flower = ((((hue > 280) | (hue < 20)) & (sat > 0.35)) | ((hue > 40) & (hue < 65) & (sat > 0.5)) | ((sat < 0.12) & (val > 0.9))).mean()
    grey = ((sat < 0.18) & (val > 0.25) & (val < 0.85)).mean()
    brown = ((hue > 15) & (hue < 45) & (sat > 0.25) & (sat < 0.75) & (val < 0.75)).mean()
    # Remplissage du bas (quart inférieur, pixels pleins) : une maison a des murs jusqu'en bas, un arbre un tronc.
    solid = alpha >= 200
    rows = solid[h - max(1, h // 4):]
    base = rows.sum() / max(1, rows.shape[0] * w)
    # Aplats : part des paires de pixels voisins (pleins) de même couleur ; un toit, un mur en ont beaucoup, un
    # feuillage pointillé peu.
    pair = solid[:, 1:] & solid[:, :-1]
    same = (a[:, 1:, :3] == a[:, :-1, :3]).all(axis=2) & pair
    flat = same.sum() / max(1, pair.sum())
    return dict(wt=wt, ht=ht, opaque=opaque, base=base, flat=flat, green=green, blue=blue, autumn=autumn, flower=flower, grey=grey,
                brown=brown, white=(val > 0.85).mean(), dark=(val < 0.3).mean())


def classify(f, interior, source):
    """Type d'un élément d'après ses mesures (voir features)."""
    if f is None:
        return None
    wt, ht, opaque = f['wt'], f['ht'], f['opaque']
    green, blue, autumn, flower, grey, brown = f['green'], f['blue'], f['autumn'], f['flower'], f['grey'], f['brown']
    if interior:
        return 'int-sols' if opaque > 0.95 else 'int-meubles'
    if source.startswith('jared-bateaux') or (blue < 0.4 and wt >= 6 and ht <= 4 and grey + f['white'] > 0.5 and green < 0.1):
        return 'vehicules'
    # Grand élément : un bâtiment (plein, des murs et des fenêtres), sauf un bouquet d'arbres (vert, ajouré).
    if wt >= 4 and ht >= 4:
        if opaque < 0.6 and (green + autumn) > 0.45:
            return 'arbres'
        if blue > 0.6 and opaque > 0.9 and f['grey'] + f['dark'] < 0.12:     # pas un toit bleu (fenêtres, contours)
            return 'eau'
        return 'batiments'
    if opaque > 0.95:
        if blue > 0.35 and f['white'] + grey > 0.3 and f['blue'] < 0.7:   # glace, givre : un sol
            return 'sols'
        if blue > 0.35:
            return 'eau'
        if green > 0.55:
            return 'herbes'
        return 'sols'
    if blue > 0.5 and opaque > 0.6 and wt <= 6 and ht <= 6 and grey + f['dark'] < 0.15:
        return 'eau'
    if wt >= 4 and ht >= 4 and green < 0.3:
        return 'batiments'
    if ht >= 2 and wt >= 2 and (green + autumn) > 0.45 and (opaque < 0.85 or (ht >= 3 and opaque < 0.97)):
        return 'arbres'
    if autumn > 0.5 and ht <= 2:                   # tas de feuilles mortes
        return 'herbes'
    if wt <= 2 and ht <= 2 and flower > 0.25 and opaque < 0.9:
        return 'plantes'
    if (wt >= 3 and ht <= 2) or (ht >= 3 and wt <= 1):
        if green < 0.3 and (brown + grey) > 0.35:
            return 'clotures'
    if wt <= 2 and ht <= 2 and flower > 0.12 and green > 0.15:
        return 'plantes'
    if green > 0.45:
        return 'herbes'
    if (grey + brown) > 0.55 and green < 0.15 and wt <= 4 and ht <= 4:
        return 'rochers'
    return 'mobilier'


def fingerprint(img):
    """Empreinte d'image (taille en cases + d-hash 16 x 16 sur fond neutre) pour repérer les doublons."""
    bg = Image.new('RGBA', img.size, (128, 128, 128, 255))
    bg.alpha_composite(img)
    small = np.array(bg.convert('L').resize((17, 16), Image.BILINEAR)).astype(int)
    bits = (small[:, 1:] > small[:, :-1]).flatten()
    return (-(-img.width // TILE), -(-img.height // TILE)), bits


def descriptor(img, wt, ht):
    """Ce qui fait se ressembler deux éléments, en un vecteur : couleurs (teintes pondérées par la saturation, gris
    clairs ou sombres, couleur moyenne), taille (en cases) et forme (silhouette ramenée à 8 x 8, posée en bas au
    centre d'un carré, comme on la voit sur la planche)."""
    a = np.array(img).astype(float) / 255
    alpha = a[:, :, 3]
    px = a[alpha > 0.1]
    if not len(px):
        return np.zeros(16 + 3 + 2 + 64)
    rgb = px[:, :3]
    mx, mn = rgb.max(1), rgb.min(1)
    sat = np.where(mx > 0, (mx - mn) / np.maximum(mx, 1e-6), 0)
    hue = np.array([colorsys.rgb_to_hsv(*p)[0] for p in rgb[:: max(1, len(rgb) // 2000)]])
    sat_s, val_s = sat[:: max(1, len(rgb) // 2000)], mx[:: max(1, len(rgb) // 2000)]
    colored = sat_s > 0.18
    hues = np.histogram(hue[colored], bins=12, range=(0, 1), weights=(sat_s * val_s)[colored])[0]
    greys = np.histogram(val_s[~colored], bins=4, range=(0, 1))[0]
    hist = np.concatenate([hues, greys]).astype(float)
    hist /= max(hist.sum(), 1e-6)
    side = max(img.width, img.height)
    square = np.zeros((side, side))
    square[side - img.height:, (side - img.width) // 2:(side - img.width) // 2 + img.width] = alpha
    shape = np.array(Image.fromarray((square * 255).astype(np.uint8)).resize((8, 8), Image.BILINEAR)) / 255
    size = np.log2([wt, ht])
    # Poids : couleur, taille et forme comptent autant.
    return np.concatenate([hist * 3.0, rgb.mean(0) * 1.5, size * 1.4, shape.flatten() * 0.35])


def order_by_similarity(items):
    """Éléments rangés pour que chacun ait pour voisins ceux qui lui ressemblent le plus (couleur, taille, forme) :
    regroupement hiérarchique (Ward) et ordre des feuilles optimal (deux voisins de la liste aussi proches que
    possible), coupé en familles d'une huitaine d'éléments. Chaque famille commence une nouvelle ligne de la planche
    (`group`, voir pack) et y est rangée de la plus haute à la plus basse (les lignes se remplissent mieux) : en
    faisant défiler la palette, on voit des familles d'éléments semblables, et les familles proches se suivent."""
    if len(items) < 3:
        return items
    from scipy.cluster.hierarchy import fcluster, leaves_list, linkage, optimal_leaf_ordering
    from scipy.spatial.distance import pdist
    vectors = np.array([descriptor(it['img'], it['wt'], it['ht']) for it in items])
    dist = pdist(vectors)
    tree = optimal_leaf_ordering(linkage(dist, 'ward'), dist)
    leaves = list(leaves_list(tree))
    family = fcluster(tree, t=max(1, len(items) // 8), criterion='maxclust')
    rank = {i: k for k, i in enumerate(leaves)}
    first = {}                                      # chaque famille à la place de son premier élément dans l'ordre
    for i in leaves:
        first.setdefault(family[i], rank[i])
    order = sorted(range(len(items)), key=lambda i: (first[family[i]], -items[i]['ht'], -items[i]['wt'], rank[i]))
    for i in order:
        items[i]['group'] = int(family[i])
    return [items[i] for i in order]


def pack(items, cols):
    """Rangement en étagères, dans l'ordre de `items` (voir order_by_similarity) : renvoie la planche et la position de
    chaque élément (alignés sur la grille)."""
    x, y, shelf, placed = 0, 0, 0, []
    group = None
    for it in items:
        # Une nouvelle famille d'éléments semblables commence une nouvelle ligne.
        if x + it['wt'] > cols or (it.get('group') != group and x > 0):
            x, y, shelf = 0, y + shelf, 0
        group = it.get('group')
        placed.append((it, x, y))
        x += it['wt']
        shelf = max(shelf, it['ht'])
    rows = max(1, y + shelf)
    sheet = Image.new('RGBA', (cols * TILE, rows * TILE))
    for it, cx, cy in placed:
        img = it['img']
        # Calé en bas au centre de son bloc de cases (déjà aligné pour les planches quadrillées).
        sheet.alpha_composite(img, (cx * TILE + (it['wt'] * TILE - img.width) // 2, cy * TILE + it['ht'] * TILE - img.height))
    return sheet, rows, [[cx, cy, it['wt'], it['ht']] for it, cx, cy in placed]


def split_touching(mask):
    """Objets d'un masque, sans souder deux objets qui se touchent sur quelques pixels (pied d'un tronc contre la
    cime de l'arbre du dessous) : séparés sur le masque érodé, puis chaque pixel rendu à l'objet le plus proche ; un
    objet trop fin pour l'érosion (un poteau) reste à part."""
    core, n = ndimage.label(ndimage.binary_erosion(mask, iterations=3))
    whole, m = ndimage.label(mask, structure=np.ones((3, 3)))
    out = np.zeros(mask.shape, int)
    if n:
        _, (iy, ix) = ndimage.distance_transform_edt(core == 0, return_indices=True)
        out = np.where(mask, core[iy, ix], 0)
    for k in range(1, m + 1):                      # morceaux sans cœur : objets à part entière
        part = whole == k
        if not core[part].any():
            n += 1
            out[part] = n
    return out, n


def element_map(sheet, cols, rows, rects):
    """Objet de chaque case d'une planche : objets séparés au pixel près (pixels pleins seulement : une ombre ou un
    tronc qui touche l'objet voisin ne les relie pas) ; une case va à l'objet qui y a le plus de pixels, une case
    d'ombre seule à l'objet juste au-dessus. Renvoie ({'elements': [[x0, y0, x1, y1]…], 'owner': [[objet, nombre]…]}),
    `owner` en plages (numéro d'objet par case, de gauche à droite puis de haut en bas ; -1 : aucun)."""
    a = np.array(sheet)
    solid = a[:, :, 3] >= 200
    # Séparés d'abord par leur emplacement sur la planche (deux éléments rangés l'un contre l'autre se touchent),
    # puis au pixel près dans chaque emplacement (un élément découpé peut en contenir plusieurs).
    labels = np.zeros(solid.shape, int)
    count = 0
    for cx, cy, w, h in rects:
        ys, xs = slice(cy * TILE, (cy + h) * TILE), slice(cx * TILE, (cx + w) * TILE)
        part, n = split_touching(solid[ys, xs])
        labels[ys, xs] = np.where(part > 0, part + count, 0)
        count += n
    t = labels[: rows * TILE, : cols * TILE].reshape(rows, TILE, cols, TILE).transpose(0, 2, 1, 3).reshape(rows, cols, -1)
    owner = np.full((rows, cols), -1, int)
    for r in range(rows):
        for c in range(cols):
            vals = t[r, c][t[r, c] > 0]
            if len(vals) >= 8:
                owner[r, c] = np.bincount(vals).argmax()
    rect_of = np.full((rows, cols), -1, int)
    for k, (cx, cy, w, h) in enumerate(rects):
        rect_of[cy:cy + h, cx:cx + w] = k
    alpha = a[: rows * TILE, : cols * TILE, 3].reshape(rows, TILE, cols, TILE).transpose(0, 2, 1, 3).reshape(rows, cols, -1)
    for r in range(1, rows):                       # ombres seules : à l'objet du dessus
        for c in range(cols):
            if owner[r, c] < 0 and (alpha[r, c] > 24).any() and owner[r - 1, c] >= 0 and rect_of[r, c] == rect_of[r - 1, c]:
                owner[r, c] = owner[r - 1, c]
    ids = {}
    boxes = []
    flat = []
    for r in range(rows):
        for c in range(cols):
            o = owner[r, c]
            if o < 0:
                flat.append(-1)
                continue
            if o not in ids:
                ids[o] = len(boxes)
                boxes.append([c, r, c, r])
            b = boxes[ids[o]]
            b[0], b[1], b[2], b[3] = min(b[0], c), min(b[1], r), max(b[2], c), max(b[3], r)
            flat.append(ids[o])
    runs = []
    for v in flat:
        if runs and runs[-1][0] == v:
            runs[-1][1] += 1
        else:
            runs.append([v, 1])
    return {'elements': boxes, 'owner': runs}


def empty_tiles(img, cols, rows):
    a = np.array(img)[:, :, 3]
    t = a[: rows * TILE, : cols * TILE].reshape(rows, TILE, cols, TILE).transpose(0, 2, 1, 3).reshape(rows, cols, -1)
    return [int(i) for i in np.flatnonzero((t <= 24).all(-1).reshape(-1))]


DEBUG = Path(os.environ['G4_DEBUG']) if os.environ.get('G4_DEBUG') else None


def debug_sheet(sheet, rects, items, path):
    """Planche de contrôle (G4_DEBUG=<dossier>) : chaque élément encadré, avec son numéro et sa planche d'origine."""
    from PIL import ImageDraw
    path.parent.mkdir(parents=True, exist_ok=True)
    out = Image.new('RGBA', sheet.size, (70, 70, 70, 255))
    out.alpha_composite(sheet)
    d = ImageDraw.Draw(out)
    for k, ((cx, cy, w, h), it) in enumerate(zip(rects, items)):
        d.rectangle([cx * TILE, cy * TILE, (cx + w) * TILE - 1, (cy + h) * TILE - 1], outline=(255, 0, 0, 255))
        d.text((cx * TILE + 2, cy * TILE + 1), f"{k} {it['source'][:6]}@{it['at']}", fill=(255, 255, 0, 255))
    out.save(path)


MAPS_DIR = ROOT / 'src' / 'data' / 'builtMaps'
ARCHIVE = 'g4-archive'


def used_library_tiles(catalog):
    """Cases de la bibliothèque (planches g4-…) utilisées par les cartes du créateur, avec leur image actuelle : la
    bibliothèque refaite range ses éléments autrement, les cartes sont alors recalées (voir remap_maps)."""
    info = {s['id']: s for s in catalog['sheets']}
    images, used = {}, {}
    for f in sorted(MAPS_DIR.glob('*.json')):
        m = json.loads(f.read_text())
        for layer in m['layers'].values():
            for cell in layer:
                for ref in (cell if isinstance(cell, list) else [cell]):
                    if ref is None or ref < 0:
                        continue
                    sheet, index = m['sheets'][ref // 100_000], ref % 100_000
                    if not sheet.startswith('g4-') or sheet not in info or (sheet, index) in used:
                        continue
                    if sheet not in images:
                        images[sheet] = np.array(Image.open(V2 / info[sheet]['file']).convert('RGBA'))
                    cols = info[sheet]['cols']
                    x, y = index % cols * TILE, index // cols * TILE
                    used[sheet, index] = images[sheet][y:y + TILE, x:x + TILE].copy()
    return used


def remap_maps(used, entries):
    """Recale les cartes du créateur sur la bibliothèque refaite : chaque case utilisée est retrouvée, au pixel près,
    dans les nouvelles planches ; une case introuvable (morceau d'un ancien élément) va dans la planche d'archive
    g4-archive (masquée dans la palette). Renvoie l'entrée de catalogue de l'archive (ou None)."""
    if not used:
        return None
    found = {}
    for e in entries:
        a = np.array(Image.open(V2 / e['file']).convert('RGBA'))
        for i in range(e['cols'] * e['rows']):
            x, y = i % e['cols'] * TILE, i // e['cols'] * TILE
            found.setdefault(a[y:y + TILE, x:x + TILE].tobytes(), (e['id'], i))
    archived, new_ref = [], {}
    for key, tile in used.items():
        hit = found.get(tile.tobytes())
        if hit is None:
            hit = (ARCHIVE, len(archived))
            archived.append(tile)
        new_ref[key] = hit
    archive = None
    if archived:
        cols = 16
        rows = -(-len(archived) // cols)
        sheet = np.zeros((rows * TILE, cols * TILE, 4), np.uint8)
        for i, tile in enumerate(archived):
            sheet[i // cols * TILE:(i // cols + 1) * TILE, i % cols * TILE:(i % cols + 1) * TILE] = tile
        Image.fromarray(sheet).save(V2 / f'{ARCHIVE}.png', optimize=True)
        archive = {'id': ARCHIVE, 'name': 'Bibliothèque Gen 4 : cases des anciennes cartes', 'file': f'{ARCHIVE}.png',
                   'cols': cols, 'rows': rows, 'empty': empty_tiles(Image.fromarray(sheet), cols, rows),
                   'author': 'voir les planches Gen 4', 'gen': 4, 'hidden': True}
    for f in sorted(MAPS_DIR.glob('*.json')):
        m = json.loads(f.read_text())
        sheets = list(m['sheets'])
        changed = False

        def fix(ref):
            nonlocal changed
            if ref is None or ref < 0:
                return ref
            key = (m['sheets'][ref // 100_000], ref % 100_000)
            if key not in new_ref:
                return ref
            sheet, index = new_ref[key]
            if sheet not in sheets:
                sheets.append(sheet)
            changed = True
            return sheets.index(sheet) * 100_000 + index

        for name, layer in m['layers'].items():
            m['layers'][name] = [[fix(r) for r in c] if isinstance(c, list) else fix(c) for c in layer]
        if changed:
            m['sheets'] = sheets
            f.write_text(f'{json.dumps(m)}\n')
    print(f'Cartes recalées : {len(used)} cases ({len(archived)} gardées dans {ARCHIVE})')
    return archive


def main():
    catalog = json.loads((V2 / 'catalog.json').read_text())
    sheets = {s['id']: s for s in catalog['sheets']}
    used = used_library_tiles(catalog)
    kept, seen = {c: [] for c, *_ in CATEGORIES}, {}       # seen : taille en cases -> empreintes déjà gardées
    stats = {'éléments': 0, 'doublons': 0}
    for sheet_id, gridded, interior in SOURCES:
        if sheet_id not in sheets:
            continue
        a = np.array(Image.open(V2 / sheets[sheet_id]['file']).convert('RGBA'))
        rgb = a[:, :, :3].astype(int)
        for color in FILLERS:
            a[(rgb == color).all(axis=2)] = 0
        if sheet_id.startswith('rmxp-'):
            for x in range(0, a.shape[1], 9 * TILE):           # colonnes de pointillés
                a[:, x: x + TILE] = 0
        a = harmonize_grass(a)
        for x0, y0, x1, y1, category, mask in elements(sheet_id, a, gridded, interior):
            crop = a[y0:y1, x0:x1].copy()
            if mask is not None:
                crop[~mask] = 0
            if not gridded:
                ys, xs = np.nonzero(crop[:, :, 3] > 0)
                crop = crop[ys.min(): ys.max() + 1, xs.min(): xs.max() + 1]
            img = Image.fromarray(crop)
            feats = features(img)
            forced = category
            if category is None:
                category = OVERRIDES.get(f'{sheet_id}@{x0 // TILE},{y0 // TILE}') or classify(feats, interior, sheet_id)
            if not category or category == 'skip' or is_text(img):
                continue
            size, bits = fingerprint(img)
            if category == 'batiments' and min(size) < MIN_BUILDING:
                continue
            if size[0] == 1 and size[1] >= 16:            # pointillés qui séparent les colonnes des planches RMXP
                continue
            stats['éléments'] += 1
            prints = seen.setdefault(size, [])
            if prints and (np.count_nonzero(np.array(prints) != bits, axis=1) <= 6).any():
                stats['doublons'] += 1
                continue
            prints.append(bits)
            kept[category].append({'img': img, 'wt': size[0], 'ht': size[1], 'source': sheet_id,
                                   'at': f'{x0 // TILE},{y0 // TILE}', 'forced': forced,
                                   'f': {k: round(float(v), 2) for k, v in (feats or {}).items()}})

    entries = []
    index = {}
    for cat_id, label, group in CATEGORIES:
        items = kept[cat_id]
        if not items:
            continue
        cols = max(8, min(24, max(it['wt'] for it in items)))
        items = [it for it in items if it['wt'] <= cols]
        # G4_ORDER=taille : l'ancien rangement (les plus hauts d'abord), pour comparer.
        items = sorted(items, key=lambda it: (-it['ht'], -it['wt'])) if os.environ.get('G4_ORDER') == 'taille' \
            else order_by_similarity(items)
        sheet, rows, rects = pack(items, cols)
        sheet.save(V2 / f'g4-{cat_id}.png', optimize=True)
        if DEBUG:
            debug_sheet(sheet, rects, items, DEBUG / f'{cat_id}.png')
            (DEBUG / f'{cat_id}.json').write_text('\n'.join(
                json.dumps([k, it['source'], it['at'], it['forced'], it['f'], r]) for k, (it, r) in enumerate(zip(items, rects))))
        (V2 / f'g4-{cat_id}.elements.json').write_text(json.dumps(element_map(sheet, cols, rows, rects), separators=(',', ':')))
        for it, (cx, cy, w, h) in zip(items, rects):
            index[f"{it['source']}@{it['at']}"] = {'sheet': f'g4-{cat_id}', 'col': cx, 'row': cy, 'w': w, 'h': h}
        authors = sorted({sheets[it['source']].get('author') or it['source'] for it in items})
        entries.append({'id': f'g4-{cat_id}', 'name': label, 'file': f'g4-{cat_id}.png', 'cols': cols, 'rows': rows,
                        'empty': empty_tiles(sheet, cols, rows), 'author': ', '.join(authors), 'gen': 4,
                        'category': cat_id, 'group': group,
                        # Objet de chaque case (voir element_map) : le créateur s'en sert pour ranger chaque case posée
                        # (sol, décor, au-dessus de Pierre) et régler ses collisions.
                        'elementsFile': f'g4-{cat_id}.elements.json'})
        print(f'{label:28} {len(items):5} éléments  ({cols} x {rows} cases)')

    # Catalogue : les planches de type remplacent les planches Gen 4 d'origine dans la palette (masquées, gardées).
    for s in catalog['sheets']:
        if s.get('gen') == 4 and not s.get('category'):
            s['hidden'] = True
    # Planches d'origine dont on connaît les éléments (des cartes s'en servent) : objets découpés, autotiles.
    objets = json.loads((V2 / 'objets.json').read_text())
    for s in catalog['sheets']:
        if s['id'] == 'objets':
            s['elements'] = [[o['col'], o['row'], o['w'], o['h'], OBJECT_KINDS.get(name, 'mobilier')] for name, o in objets.items()]
        elif s['id'] == 'autotiles-g4':
            s['elements'] = [[x0, y0, x1 - x0, y1 - y0, kind] for x0, y0, x1, y1, kind in REGIONS['autotiles-g4']]
    # Emplacement de chaque élément, d'après son origine (« planche@colonne,rangée ») : scripts/g4_theme.py désigne
    # ainsi les éléments qu'il pose, quel que soit leur rangement.
    (V2 / 'g4-index.json').write_text(json.dumps(index, separators=(',', ':')))
    archive = remap_maps(used, entries)
    catalog['sheets'] = [s for s in catalog['sheets'] if not s.get('category') and s['id'] != ARCHIVE] + entries
    if archive:
        catalog['sheets'].append(archive)
    (V2 / 'catalog.json').write_text(json.dumps(catalog, ensure_ascii=False))
    print(f"{stats['éléments']} éléments lus, {stats['doublons']} doublons écartés")


if __name__ == '__main__':
    main()
