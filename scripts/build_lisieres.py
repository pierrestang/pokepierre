#!/usr/bin/env python3
"""Planche des lisières de forêt, pour l'assistant du créateur de cartes (« Refaire la bordure d'arbres »).

La forêt dense des bordures (g4-arbres 1740, 1741, 1752, 1753 = rmxp-nature 25..26, 1..2) est un tissu opaque : coupé
au bord, il fait des carrés sombres. La lisière se fait avec des arbres entiers de la même famille, détourés : l'arbre
de rmxp-nature (colonnes 20-21 : la pointe et le haut de la couronne d'un arbre, rangées 0-1, puis le bas de la couronne
et le tronc d'un autre, rangées 4-5 ; le vert d'herbe du fond retiré), et un buisson rond pour les cases seules
(planche DPPt 7, 106).

Chaque palette de forêt des villes (scripts/identites.py) a sa version : DPPt d'origine, chêne (Saint-Ay), automne
(Montépilloy). Pour chaque palette, 4 rangées : colonnes 0-1 l'arbre (2 x 4), colonne 2 le buisson (1 x 1), colonnes
3-4 le tissu dense de la palette (2 x 2 ; l'éditeur le compare aux cases de la carte pour reconnaître la palette).

Arbre rond (octobre 2026, l'arbre de toutes les bordures et forêts) : l'arbre rond de la planche DPPt (colonnes 0-2,
rangées 40-43, le morceau d'un seul tenant), posé sur 4 x 4 cases : centré sur son bloc de 2 x 2 (colonnes 1-2, rangées
2-3 de l'image), le bas de l'ombre sur le bas du bloc, la couronne qui déborde d'un tiers de case de chaque côté et
d'une case et demie vers le haut. Une version par palette, rangées 12 et suivantes (4 par palette), colonnes 0-3.

Écrit public/assets/v2/lisieres.png, lisieres.json et ajoute la planche, masquée, au catalogue (à relancer après
scripts/build_v2_tiles.py).

Usage : python3 scripts/build_lisieres.py
"""
import json
from pathlib import Path

import numpy as np
from PIL import Image

import identites as I

ROOT = Path(__file__).resolve().parent.parent
V2 = ROOT / 'public' / 'assets' / 'v2'
TILE = 16
MINT = (112, 216, 168)                      # le vert d'herbe du fond de rmxp-nature

VARIANTS = [
    ('dppt', 'forêt DPPt', lambda img: img),
    ('chene', 'chênes (Saint-Ay)', I.leaves(lambda h, val: 86 + (h - 120) * 0.3, sat=0.3)),
    ('automne', 'automne (Montépilloy)', I.leaves(lambda h, val: 12 + val * 32, sat=0.62)),
]


# Autres arbres de bordure, au choix par carte (octobre 2026) : les arbres ronds de la planche DPPt de la même famille
# (un arbre seul, rectangle en pixels) et des arbres de la bibliothèque Gen 4 ; chacun sur 4 x 4 cases comme l'arbre
# rond, à la suite de la planche (les cases déjà posées ne bougent pas).
EXTRA_TREES = [
    ('dppt-olive', 'arbre rond olive', 'dppt', (3, 717, 42, 51)),
    ('dppt-dore', 'arbre rond doré', 'dppt', (3, 781, 42, 51)),
    ('dppt-roux', 'arbre rond roux', 'dppt', (3, 845, 42, 51)),
    ('dppt-orange', 'arbre rond orange', 'dppt', (3, 909, 42, 51)),
    ('dppt-rose', 'cerisier en fleurs', 'dppt', (3, 973, 42, 51)),
    ('dppt-pointu', 'arbre pointu vert', 'dppt', (3, 1037, 42, 51)),
    ('dppt-pointu-olive', 'arbre pointu olive', 'dppt', (3, 1101, 42, 51)),
    ('dppt-pointu-brun', 'arbre pointu brun', 'dppt', (3, 1165, 42, 51)),
    ('dppt-pin-bleu', 'pin bleu', 'dppt', (3, 1229, 42, 51)),
    ('dppt-large', 'grand feuillu vert', 'dppt', (0, 1293, 47, 51)),
    ('dppt-large-jaune', 'grand feuillu jaune', 'dppt', (0, 1357, 47, 51)),
    ('dppt-large-orange', 'grand feuillu orange', 'dppt', (0, 1421, 47, 51)),
    ('dppt-large-rouge', 'grand feuillu rouge', 'dppt', (0, 1485, 47, 51)),
    ('dppt-large-pourpre', 'grand feuillu pourpre', 'dppt', (0, 1549, 47, 51)),
    ('g4-palmier', 'palmier', 'g4-arbres', (97, 2449, 46, 47)),
    ('g4-palmier-2', 'palmier (autre)', 'g4-arbres', (49, 3312, 46, 48)),
    ('g4-sapin-sombre', 'sapin sombre', 'g4-arbres', (128, 2880, 32, 47)),
]


def tile(img, c, r, w=1, h=1):
    return img.crop((c * TILE, r * TILE, (c + w) * TILE, (r + h) * TILE))


def main():
    rmxp = Image.open(V2 / 'rmxp-nature.png').convert('RGBA')
    dppt = Image.open(V2 / 'dppt.png').convert('RGBA')
    # L'arbre : rangées 0-1 (pointe, haut de la couronne) et 4-5 (bas de la couronne, tronc) des colonnes 20-21.
    tree = Image.new('RGBA', (2 * TILE, 4 * TILE))
    for k, r in enumerate((0, 1, 4, 5)):
        tree.paste(tile(rmxp, 20, r, 2, 1), (0, k * TILE))
    a = np.array(tree)
    a[(np.abs(a[..., :3].astype(int) - MINT).sum(-1) < 24)] = 0     # le fond d'herbe devient transparent
    tree = Image.fromarray(a)
    bush = tile(dppt, 7, 106)
    fill = tile(rmxp, 25, 1, 2, 2)
    # L'arbre rond : le morceau d'un seul tenant, centré sur 64 x 64, le bas de l'ombre en bas.
    from scipy import ndimage
    a = np.array(tile(dppt, 0, 40, 3, 4))
    lab, _ = ndimage.label(a[..., 3] > 0, structure=np.ones((3, 3)))
    a[lab != np.bincount(lab.ravel())[1:].argmax() + 1] = 0
    ys, xs = np.nonzero(a[..., 3])
    body = Image.fromarray(a).crop((xs.min(), ys.min(), xs.max() + 1, ys.max() + 1))
    round_tree = Image.new('RGBA', (4 * TILE, 4 * TILE))
    round_tree.alpha_composite(body, ((4 * TILE - body.width) // 2, 4 * TILE - body.height))
    ROUND_ROW = 4 * len(VARIANTS)
    sheet = Image.new('RGBA', (5 * TILE, 4 * TILE * len(VARIANTS) * 2))
    meta = []
    for k, (vid, name, fn) in enumerate(VARIANTS):
        y = k * 4 * TILE
        # Le feuillage prend la palette ; la rangée du tronc et de son ombre au sol reste telle quelle.
        t = fn(tree)
        t.paste(tree.crop((0, 3 * TILE, 2 * TILE, 4 * TILE)), (0, 3 * TILE))
        sheet.alpha_composite(t, (0, y))
        sheet.alpha_composite(fn(bush), (2 * TILE, y))
        f = fn(fill)
        sheet.alpha_composite(f, (3 * TILE, y))
        means = []
        for j in range(2):
            for i in range(2):
                px = np.array(f.crop((i * TILE, j * TILE, (i + 1) * TILE, (j + 1) * TILE)))[..., :3].reshape(-1, 3)
                means.append([round(float(v), 1) for v in px.mean(0)])
        sheet.alpha_composite(fn(round_tree), (0, (ROUND_ROW + 4 * k) * TILE))
        meta.append({'id': vid, 'name': name, 'row': k * 4, 'roundRow': ROUND_ROW + 4 * k, 'fillMeans': means})
    # Les autres arbres, après les rangées des palettes (rien ne bouge pour les cartes déjà faites).
    first = 4 * len(VARIANTS) * 2
    big = Image.new('RGBA', (sheet.width, (first + 4 * len(EXTRA_TREES)) * TILE))
    big.alpha_composite(sheet, (0, 0))
    sheets = {}
    for k, (vid, name, sid, (x, y, w, h)) in enumerate(EXTRA_TREES):
        src = sheets.setdefault(sid, Image.open(V2 / f'{sid}.png').convert('RGBA'))
        a = np.array(src.crop((x, y, x + w, y + h)))
        lab, _ = ndimage.label(a[..., 3] > 0, structure=np.ones((3, 3)))
        a[lab != np.bincount(lab.ravel())[1:].argmax() + 1] = 0
        body = Image.fromarray(a)
        cell = Image.new('RGBA', (4 * TILE, 4 * TILE))
        cell.alpha_composite(body, ((4 * TILE - w) // 2, 4 * TILE - h))
        big.alpha_composite(cell, (0, (first + 4 * k) * TILE))
        meta.append({'id': vid, 'name': name, 'row': None, 'roundRow': first + 4 * k, 'fillMeans': []})
    sheet = big
    sheet.save(V2 / 'lisieres.png', optimize=True)
    (V2 / 'lisieres.json').write_text(json.dumps({'cols': 5, 'variants': meta, 'tree': {'col': 0, 'w': 2, 'h': 4},
                                                  'bush': {'col': 2, 'h': 1},
                                                  'round': {'col': 0, 'w': 4, 'h': 4, 'ox': 1, 'oy': 2}},
                                                 ensure_ascii=False))
    catalog = json.loads((V2 / 'catalog.json').read_text())
    catalog['sheets'] = [s for s in catalog['sheets'] if s['id'] != 'lisieres']
    catalog['sheets'].append({'id': 'lisieres', 'name': 'Lisières de forêt (assistant)', 'file': 'lisieres.png', 'cols': 5,
                              'rows': sheet.height // TILE, 'empty': [], 'author': 'rmxp-nature, DPPt', 'gen': 4,
                              'hidden': True})
    (V2 / 'catalog.json').write_text(json.dumps(catalog, ensure_ascii=False))
    print(f'{len(VARIANTS)} palettes -> public/assets/v2/lisieres.png')


if __name__ == '__main__':
    main()
