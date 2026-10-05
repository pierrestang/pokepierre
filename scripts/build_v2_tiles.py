#!/usr/bin/env python3
"""Planches de cases « V2 » pour le créateur de cartes (builder.html).

Lit les planches déposées dans ASSETTILESPOKEMONV2/ et les écrit, propres, dans public/assets/v2/ :
- cases de 16 px (les planches d'ekat99, dessinées en 16 px puis agrandies x2, sont remises à l'échelle) ;
- un catalogue public/assets/v2/catalog.json : pour chaque planche, son nom, sa taille en cases et la liste
  des cases vides (transparentes, ou barrées d'une croix rouge par l'auteur) que la palette n'affiche pas.

Usage : python3 scripts/build_v2_tiles.py
"""
import json
from pathlib import Path

import numpy as np
from PIL import Image
from scipy import ndimage

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / 'ASSETTILESPOKEMONV2'
OUT = ROOT / 'public' / 'assets' / 'v2'
TILE = 16

# (identifiant, nom affiché dans la palette, fichier source, facteur de réduction, auteur, génération : 4 = DS
# (Diamant / Perle / HeartGold), 3 = GBA (Rubis / Émeraude / Rouge Feu)[, fond à retirer]). Fond : un ensemble de
# couleurs (damier peint à la place de la transparence, retiré partout) ou 'blanc' (le blanc relié aux bords).
RMXP_FILL = {(255, 245, 104), (255, 0, 255), (240, 91, 161)}
SHEETS = [
    ('dppt', 'Extérieurs Diamant / Perle', '4th_gen_outdoor_tileset_by_akizakura16_da5h3mn.png', 2, 'akizakura16', 4),
    ('dppt-int', 'Intérieurs Diamant / Perle', '4th_gen_indoor_tileset_by_akizakura16_dac0c2w.png', 2, 'akizakura16', 4),
    ('hgss-int', 'Chambre HeartGold / SoulSilver', 'pokemon_hgss_interior_tiles_by_ultimatetraveler_d2tjym2.png', 1,
     'ultimatetraveler', 4, {(204, 204, 204), (178, 178, 178)}),
    ('ds-justin', 'Grande planche DPPt + HGSS (justin8964)', 'dppt_and_hgss_tileset_by_justin8964_dg9nal7.png', 1,
     'justin8964', 4, {(167, 167, 167), (220, 220, 220)}),
    ('ds-lightbulb', 'Grande planche DPPt + HGSS (lightbulb15)', 'pokemon_dppthgss_tileset_by_lightbulb15_d4eb7yc.png', 1,
     'lightbulb15', 4, {(184, 178, 145), (255, 251, 228)}),
    ('sinnoh-kyle', 'Sinnoh : bâtiments et objets (Kyle-Dove)', 'dp_tiles_for_public_by_kyle_dove_d1mjsuq.png', 1,
     'Kyle-Dove / Speedialga', 4, 'blanc'),
    ('biomes-kyle', 'Biomes (Kyle-Dove)', 'biome_tiles_public_by_kyle_dove_d4jdto6.png', 1, 'Kyle-Dove', 4),
    # Compilation « Ready to use Tilesets » d'Aki (eeveeexpo.com/resources/15), rangée dans eeveeexpo/ : chaque
    # planche est à créditer à son artiste (pas au compilateur).
    ('hgss-ext', 'HGSS extérieurs (Akizakura16, version récente)', 'eeveeexpo/akizakura16-hgss_xy1zPiF.png', 2, 'Akizakura16', 4),
    ('hgss-int2', 'HGSS intérieurs (Akizakura16, version récente)', 'eeveeexpo/akizakura16-hgss_zEcLp2S.png', 2, 'Akizakura16', 4),
    ('jesus-1', 'JesusCarrasco — nature verte', 'eeveeexpo/jesuscarrasco_90Ti2fE.png', 2, 'JesusCarrasco', 4),
    ('jesus-2', 'JesusCarrasco — nature rouge (automne)', 'eeveeexpo/jesuscarrasco_JMCgaSr.png', 2, 'JesusCarrasco', 4),
    ('jesus-3', 'JesusCarrasco — intérieurs', 'eeveeexpo/jesuscarrasco_dVHll7F.png', 2, 'JesusCarrasco', 4),
    ('kaliser', 'Kaliser — ville et nature', 'eeveeexpo/kaliser_4MkW96K.png', 2, 'Kaliser', 4),
    ('kyle-ext', 'Kyle-Dove — extérieurs', 'eeveeexpo/kyle-dove_BmmW5Ox.png', 2, 'Kyle-Dove', 4),
    ('lotus-1', 'LotusKing — arbres, clôtures, centres', 'eeveeexpo/lotusking_iLyLdM2.png', 2, 'LotusKing', 4),
    ('lotus-2', 'LotusKing — arbres, clôtures, centres (variante)', 'eeveeexpo/lotusking_oSBky9g.png', 2, 'LotusKing', 4),
    ('lotus-aigue', 'LotusKing / Aigue--marine — maisons', 'eeveeexpo/lotusking-aigue-marine_YCfbsjd.png', 2, 'Aigue--marine / LotusKing', 4),
    ('wilson-1', 'WilsonScarloxy — nature et maisons', 'eeveeexpo/wilsonscarloxy_pFSm87G.png', 2, 'WilsonScarloxy', 4),
    ('wilson-2', 'WilsonScarloxy — ville', 'eeveeexpo/wilsonscarloxy_x9PBgKi.png', 2, 'WilsonScarloxy', 4),
    ('sailor-1', 'SailorVicious — désert, eau, maisons', 'eeveeexpo/sailorvicious_fl0Fawh.png', 2, 'SailorVicious', 5),
    ('sailor-2', 'SailorVicious — désert, eau, maisons (variante)', 'eeveeexpo/sailorvicious_M1sYicX.png', 2, 'SailorVicious', 5),
    ('ultimo-ext', 'Gen 5 extérieurs (UltimoSpriter)', 'eeveeexpo/ultimospriter-gen5-exterieur_Cmm6Jjn.png', 2, 'UltimoSpriter', 5),
    ('gen5-int', 'Gen 5 intérieurs (Akizakura16, Shiney570, UltimoSpriter)', 'eeveeexpo/gen5-interieur-akizakura16-shiney570-ultimospriter_RriSFxo.png', 2, 'Akizakura16, Shiney570, UltimoSpriter', 5),
    ('magi-1', 'Magiscarf — ville et grottes', 'eeveeexpo/magiscarf_nYiXTiQ.png', 2, 'Magiscarf', 3),
    ('magi-2', 'Magiscarf — intérieurs', 'eeveeexpo/magiscarf_kIBvowP.png', 2, 'Magiscarf', 3),
    # Planches RMXP « Buildings / Nature / Urban » (cases de 16 px ; le vide est peint en jaune, magenta ou rose).
    ('rmxp-batiments', 'Bâtiments DS : arènes, centres, maisons (RMXP)', 'BuildingsRMXP.png', 1, '', 4, RMXP_FILL),
    ('rmxp-nature', 'Nature DS : sols, arbres, fleurs, rochers (RMXP)', 'NatureRMXP.png', 1, '', 4, RMXP_FILL),
    ('rmxp-urbain', 'Ville DS : routes, clôtures, mobilier (RMXP)', 'UrbanRMXP.png', 1, '', 4, RMXP_FILL),
    # Gen 4 Pack (Magiscarf, WesleyFG, SailorVicious, Kyle-Dove… voir « Gen 4 Pack/CREDITS.txt ») : dessiné en 32 px.
    ('g4-pack', 'Gen 4 Pack : nature, neige, chemins', 'Gen 4 Pack/Tilesets/Custom Outside tileset.png', 2, 'Gen 4 Pack (voir CREDITS)', 4),
    ('jared-bateaux', 'Bateaux, ferries et cargos (terriblejared)',
     'big_boats_small_boats_ferry_yacht_and_more_by_terriblejared_dmhfmtk-pre.png', 1, 'terriblejared', 4),
    ('jared-camping', 'Camping, caravanes, tentes et nature (terriblejared)',
     'large_campground_tileset_w_nature_tiles__by_terriblejared_dmex0km-pre.png', 1, 'terriblejared', 4),
    ('gen3', 'Nature', 'ekat_s_mega_gen_3_set_by_ekat99_deh8jtt-fullview.png', 2, 'ekat99', 3),
    ('halcyon', 'Extérieurs (Halcyon)', 'pokemon_halcyon_outdoors_by_ekat99_dfbfwa0.png', 2, 'ekat99', 3),
    ('ferme', 'Ferme et champs', 'deh8j8h-cb7f8f93-bb7c-4889-9a2b-968aba9bf39e.png', 1, '', 3),
    ('cerisiers', 'Fleurs, cerisiers et rails', 'deocy1g-9ee0ef53-81f0-41fd-927a-fea58544820f.png', 1, '', 3),
    ('foret', 'Forêt et falaises', 'deof85u-43b2871f-9219-4937-bfa4-e3b01864aed7.png', 1, '', 3),
    ('jungle', 'Jungle et hautes herbes', 'dequnwm-9dc2822f-86e6-489c-a99d-b7a27903b197.png', 1, '', 3),
    ('ville', 'Ville et jardins', 'deslp3a-64947b41-540e-457b-bef3-ff1c1712e4bd.png', 1, '', 3),
    ('montagne', 'Forêt sombre et montagne', 'dkee61c-0e6cfc58-5626-47af-b245-61bfbae6e21e.png', 1, '', 3),
]


def is_red(p):
    r, g, b, a = p
    return a > 0 and r > 180 and g < 90 and b < 90


def is_blank(p):
    r, g, b, a = p
    return a < 16 or (r > 235 and g > 235 and b > 235)


def remove_background(img, bg):
    """Fond retiré : couleurs d'un damier peint (partout), ou blanc relié aux bords de la planche."""
    a = np.array(img.convert('RGBA'))
    rgb = a[:, :, :3].astype(int)
    if bg == 'blanc':
        white = (rgb >= 250).all(axis=2)
        labels, _ = ndimage.label(white)
        edge = set(np.unique(np.concatenate([labels[0], labels[-1], labels[:, 0], labels[:, -1]]))) - {0}
        mask = np.isin(labels, list(edge))
    else:
        mask = np.zeros(rgb.shape[:2], bool)
        for color in bg:
            mask |= (rgb == color).all(axis=2)
    a[mask] = 0
    return Image.fromarray(a)


def empty_tiles(img):
    """Numéros des cases vides d'une planche (voir empty_tile), calculés d'un coup."""
    a = np.array(img.convert('RGBA')).astype(int)
    rows, cols = a.shape[0] // TILE, a.shape[1] // TILE
    t = a[:rows * TILE, :cols * TILE].reshape(rows, TILE, cols, TILE, 4).transpose(0, 2, 1, 3, 4).reshape(rows, cols, -1, 4)
    r, g, b, al = t[..., 0], t[..., 1], t[..., 2], t[..., 3]
    blank = (al < 16) | ((r > 235) & (g > 235) & (b > 235))
    red = (al > 0) & (r > 180) & (g < 90) & (b < 90)
    n = TILE * TILE
    empty = (blank.sum(-1) == n) | ((red.sum(-1) >= 20) & (red.sum(-1) + blank.sum(-1) >= n - 4))
    return [int(i) for i in np.flatnonzero(empty.reshape(-1))]


def empty_tile(img, x0, y0):
    """Case vide : rien que du transparent (ou du blanc), ou la croix rouge « case vide » des planches."""
    px = [img.getpixel((x0 + x, y0 + y)) for y in range(TILE) for x in range(TILE)]
    reds = sum(map(is_red, px))
    blanks = sum(map(is_blank, px))
    if blanks == len(px):
        return True
    return reds >= 20 and reds + blanks >= len(px) - 4


# Objets isolés sur des planches non quadrillées (fond blanc ou décalés) : détourés et rangés, calés sur la grille,
# dans la planche « objets » : (nom, fichier source, rectangles x0, y0, x1, y1 en pixels — plusieurs morceaux sont
# recollés côte à côte —, auteur, largeur en cases imposée ou None). L'objet est centré en bas de son bloc : une
# largeur paire centre un arbre sur une limite de cases (pour un bloc de 2 x 2), impaire sur une case.
JUSTIN = 'dppt_and_hgss_tileset_by_justin8964_dg9nal7.png'
OBJECTS = [
    # Le yacht blanc, proue vers la gauche (le ferry de Fort-de-France, amarré au ponton).
    ('ferry', 'dp_tiles_for_public_by_kyle_dove_d1mjsuq.png', [(480, 405, 603, 450)], 'Kyle-Dove / Speedialga', None),
    ('palmier', JUSTIN, [(193, 1, 239, 48)], 'justin8964', 4),          # grand palmier DS (bloc de 2 x 2)
    ('palmier-petit', JUSTIN, [(261, 61, 299, 112)], 'justin8964', 3),  # palmier fin (une case)
    ('voilier', JUSTIN, [(642, 4, 731, 81)], 'justin8964', None),
    ('arbre', JUSTIN, [(2, 1, 46, 48)], 'justin8964', 4),               # arbre rond DS (bloc de 2 x 2)
    ('arbre-3', JUSTIN, [(2, 1, 46, 48)], 'justin8964', 3),             # le même, centré sur 3 cases
    # Ponton en planches transversales, poteaux sur les bords (3 x 3 cases, à répéter).
    ('ponton', 'dp_tiles_for_public_by_kyle_dove_d1mjsuq.png', [(7, 808, 55, 856)], 'Kyle-Dove / Speedialga', 3),
    ('mer', JUSTIN, [(848, 272, 880, 304)], 'Dewitty (justin8964)', 2),  # mer DS, motif de 2 x 2 cases (pleine)
]


# Fonds à retirer autour des objets : blanc, et le damier gris des planches de justin8964.
BACKGROUNDS = {(167, 167, 167), (220, 220, 220)}


def cut_out(img):
    """Fond (blanc ou damier gris, relié aux bords) rendu transparent."""
    img = img.convert('RGBA')
    px = img.load()
    w, h = img.size
    # Le damier gris marque la transparence partout (même à l'intérieur, ex. entre les haubans d'un voilier).
    for y in range(h):
        for x in range(w):
            if px[x, y][:3] in BACKGROUNDS:
                px[x, y] = (0, 0, 0, 0)
    stack = [(x, y) for x in range(w) for y in (0, h - 1)] + [(x, y) for y in range(h) for x in (0, w - 1)]
    seen = set()
    while stack:
        x, y = stack.pop()
        if (x, y) in seen or not (0 <= x < w and 0 <= y < h):
            continue
        seen.add((x, y))
        r, g, b, a = px[x, y]
        if a == 0 or (r > 245 and g > 245 and b > 245) or (r, g, b) in BACKGROUNDS:
            px[x, y] = (0, 0, 0, 0)
            stack += [(x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1)]
    # Seul le plus grand morceau d'un seul tenant est gardé (un voisin qui dépasse dans le cadre est effacé).
    pieces, seen = [], set()
    for y0 in range(h):
        for x0 in range(w):
            if px[x0, y0][3] == 0 or (x0, y0) in seen:
                continue
            piece, todo = [], [(x0, y0)]
            seen.add((x0, y0))
            while todo:
                x, y = todo.pop()
                piece.append((x, y))
                for n in ((x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1)):
                    if 0 <= n[0] < w and 0 <= n[1] < h and n not in seen and px[n][3]:
                        seen.add(n)
                        todo.append(n)
            pieces.append(piece)
    for piece in sorted(pieces, key=len)[:-1]:
        for xy in piece:
            px[xy] = (0, 0, 0, 0)
    return img.crop(img.getbbox())


def fill_tile(img, w, h):
    """Motif de fond (ex. la mer) sur w x h pixels : les trous (rangée ou colonne manquante) reprennent le pixel voisin."""
    out = Image.new('RGBA', (w, h))
    out.paste(img, (0, 0))
    px = out.load()
    for y in range(h):
        for x in range(w):
            if px[x, y][3] == 0:
                px[x, y] = px[x, y - 1] if y else px[x - 1, y]
    return out


def build_objects():
    """Planche « objets » : chaque objet sur son propre bloc de cases ; renvoie l'entrée du catalogue et les positions."""
    pieces = []
    for name, f, boxes, author, width in OBJECTS:
        parts = [cut_out(Image.open(SRC / f).crop(box)) for box in boxes]
        img = Image.new('RGBA', (sum(p.width for p in parts), max(p.height for p in parts)))
        x = 0
        for part in parts:
            img.alpha_composite(part, (x, img.height - part.height))
            x += part.width
        if name == 'mer':
            img = fill_tile(parts[0], 2 * TILE, 2 * TILE)
        pieces.append((name, img, author, width))
    cols = 16
    placed, x, y, row_h = [], 0, 0, 0
    for name, img, author, width in pieces:
        w, h = width or -(-img.width // TILE), -(-img.height // TILE)
        if x + w > cols:
            x, y, row_h = 0, y + row_h, 0
        placed.append((name, img, x, y, w, h))
        x += w
        row_h = max(row_h, h)
    rows = y + row_h
    sheet = Image.new('RGBA', (cols * TILE, rows * TILE))
    for name, img, cx, cy, w, h in placed:
        # Calé en bas au centre de son bloc.
        sheet.alpha_composite(img, (cx * TILE + (w * TILE - img.width) // 2, cy * TILE + h * TILE - img.height))
    sheet.save(OUT / 'objets.png', optimize=True)
    empty = empty_tiles(sheet)
    (OUT / 'objets.json').write_text(json.dumps({n: {'col': cx, 'row': cy, 'w': w, 'h': h} for n, _, cx, cy, w, h in placed}))
    return {'id': 'objets', 'name': 'Objets DS (ferry, palmiers, ponton…)', 'file': 'objets.png', 'cols': cols,
            'rows': rows, 'empty': empty, 'author': ', '.join(sorted({p[2] for p in pieces})), 'gen': 4}


# Autotiles RMXP du Gen 4 Pack (hautes herbes, chemin de terre, herbe enneigée : blocs de 3 x 4 cases une fois réduits ;
# fleurs : 4 images d'animation ; reflets de l'eau) rangés dans une planche « autotiles ».
AUTOTILES = ['grass', 'dirt path', 'snow grass', 'Flowers1', 'Flowers2', 'water shine']
# Le liseré d'herbe claire (vert-jaune) des hautes herbes et du chemin de terre du Gen 4 Pack, au vert de la planche
# Diamant / Perle (raccord avec son herbe) : toute nuance claire et jaunâtre devient l'herbe DPPt.
def g4_grass_to_dppt(img):
    a = np.array(img).astype(int)
    r, g, b, al = a[..., 0], a[..., 1], a[..., 2], a[..., 3]
    light = (al > 0) & (r >= 155) & (g >= 195) & (b <= 150) & (g > r) & (g > b)
    mid = (al > 0) & (r >= 155) & (g >= 180) & (g < 195) & (b <= 150) & (g > r) & (g > b)
    a[light, :3] = (104, 208, 160)
    a[mid, :3] = (104, 200, 160)
    return Image.fromarray(a.astype(np.uint8))


def build_autotiles():
    pieces = []
    for name in AUTOTILES:
        img = Image.open(SRC / 'Gen 4 Pack' / 'Autotiles' / f'{name}.png').convert('RGBA')
        scale = 1 if name == 'water shine' else 2
        img = img.resize((img.width // scale, img.height // scale), Image.NEAREST)
        pieces.append(g4_grass_to_dppt(img) if name in ('grass', 'dirt path') else img)
    cols = 8
    rows_needed, x, y, row_h, placed = 0, 0, 0, 0, []
    for img in pieces:
        w, h = -(-img.width // TILE), -(-img.height // TILE)
        if x + w > cols:
            x, y, row_h = 0, y + row_h, 0
        placed.append((img, x, y))
        x += w
        row_h = max(row_h, h)
    rows = y + row_h
    sheet = Image.new('RGBA', (cols * TILE, rows * TILE))
    for img, cx, cy in placed:
        sheet.alpha_composite(img, (cx * TILE, cy * TILE))
    sheet.save(OUT / 'autotiles-g4.png', optimize=True)
    (OUT / 'autotiles-g4.json').write_text(json.dumps({n: {'col': cx, 'row': cy} for n, (_, cx, cy) in zip(AUTOTILES, placed)}))
    return {'id': 'autotiles-g4', 'name': 'Hautes herbes, chemin, neige, fleurs (Gen 4 Pack)', 'file': 'autotiles-g4.png',
            'cols': cols, 'rows': rows, 'empty': empty_tiles(sheet), 'author': 'Gen 4 Pack (voir CREDITS)', 'gen': 4}


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    catalog = []
    for sheet_id, name, filename, scale, author, gen, *bg in SHEETS:
        img = Image.open(SRC / filename).convert('RGBA')
        if bg:
            img = remove_background(img, bg[0])
        if scale > 1:
            img = img.resize((img.width // scale, img.height // scale), Image.NEAREST)
        # Taille arrondie au multiple de 16 au-dessus (le bord de la planche n'est pas perdu).
        cols, rows = -(-img.width // TILE), -(-img.height // TILE)
        padded = Image.new('RGBA', (cols * TILE, rows * TILE))
        padded.paste(img, (0, 0))
        img = padded
        empty = empty_tiles(img)
        img.save(OUT / f'{sheet_id}.png', optimize=True)
        catalog.append({'id': sheet_id, 'name': name, 'file': f'{sheet_id}.png', 'cols': cols, 'rows': rows,
                        'empty': empty, 'author': author, 'gen': gen})
        print(f'{sheet_id:10} {cols}x{rows} cases, {len(empty)} vides')
    catalog.append(build_objects())
    catalog.append(build_autotiles())
    (OUT / 'catalog.json').write_text(json.dumps({'tile': TILE, 'sheets': catalog}, ensure_ascii=False))


if __name__ == '__main__':
    main()
