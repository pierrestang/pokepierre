#!/usr/bin/env python3
"""L'aéroport (à Bordeaux), redessiné en Gen 4 (octobre 2026) : une carte du créateur, src/data/builtMaps/airport.json.

Dessiné au pixel près sur trois calques (sol, décor, au-dessus de Pierre), puis découpé en cases (planche à part :
public/assets/v2/aeroport.png, ajoutée masquée au catalogue des planches). De haut en bas :
- le tarmac et deux avions garés, en entier (l'avion du trajet, public/assets/travel/avion.png,
  scripts/build_travel_art.py) ;
- la baie vitrée (mur Gen 4) et le tableau des départs ;
- le guichet (comptoir d'enregistrement : on parle à l'hôtesse par-dessus, case '#' de la grille), la file entre ses
  poteaux à cordon ;
- la salle d'attente (rangées de sièges, petites valises) ;
- les portes vitrées vers Bordeaux (tapis de sortie).
22 x 14 cases : la carte tient en entier dans l'écran, les avions restent visibles. Meubles : planches DPPt
(interieurs_plans.py), le reste dessiné ici (pas d'ombre portée, comme dans le reste du jeu).
La grille logique est dans src/data/maps/airport.js (sourceGrid), accordée aux collisions écrites ici.

Usage : python3 scripts/build_airport.py
"""
import json
import sys
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw

sys.path.insert(0, str(Path(__file__).parent))
import interieurs_plans as P  # noqa: E402

ROOT = Path(__file__).resolve().parent.parent
V2 = ROOT / 'public' / 'assets' / 'v2'
T = 16
W, H = 22, 14                                    # la carte tient en entier dans l'écran (22,5 x 15 cases)
SHEET = 'aeroport'
COLS = 16
EXIT = [(10, 13), (11, 13)]
OUTLINE = (40, 44, 60, 255)


# ---------- Dessins faits ici ----------
def departures_board(w, h):
    """Tableau des départs : écran noir encadré, lignes de destinations en points jaunes et verts."""
    img = Image.new('RGBA', (w, h))
    d = ImageDraw.Draw(img)
    d.rectangle((0, 0, w - 1, h - 1), fill=(40, 44, 60, 255))
    d.rectangle((2, 2, w - 3, h - 3), fill=(16, 18, 28, 255))
    d.rectangle((2, 2, w - 3, 6), fill=(48, 96, 200, 255))
    d.line((4, 4, 20, 4), fill=(240, 240, 248, 255))
    rows = [(10, (248, 208, 64)), (15, (248, 208, 64)), (20, (120, 224, 120)), (25, (248, 208, 64))]
    for y, c in rows:
        if y > h - 5:
            break
        for x in range(5, w - 22, 2):
            if (x // 2 + y) % 7:
                d.point((x, y), fill=c + (255,))
        for x in range(w - 18, w - 6, 2):
            d.point((x, y), fill=(240, 240, 248, 255))
    return img


def seat_row(n):
    """Rangée de sièges d'aéroport (n places, vus de face) : coques bleues sur une poutre grise."""
    img = Image.new('RGBA', (n * T, 2 * T))
    d = ImageDraw.Draw(img)
    d.rectangle((1, 25, n * T - 2, 27), fill=(120, 128, 148, 255))          # poutre
    for leg in (4, n * T - 6):
        d.rectangle((leg, 27, leg + 1, 31), fill=(96, 104, 124, 255))
    for i in range(n):
        x = i * T
        d.rounded_rectangle((x + 2, 6, x + 13, 18), radius=3, fill=(56, 104, 200, 255))      # dossier
        d.line((x + 4, 8, x + 11, 8), fill=(104, 152, 240, 255))
        d.rounded_rectangle((x + 1, 16, x + 14, 25), radius=2, fill=(72, 128, 224, 255))      # assise
        d.line((x + 3, 18, x + 12, 18), fill=(128, 176, 248, 255))
    a = np.array(img)
    solid = a[..., 3] > 0
    from scipy import ndimage
    ring = ndimage.binary_dilation(solid) & ~solid
    a[ring] = OUTLINE
    return Image.fromarray(a)


def stanchions(n, gap=()):
    """Poteaux à cordon (n cases, un poteau par case, cordon rouge entre deux poteaux ; `gap` : cases sans cordon à
    droite)."""
    img = Image.new('RGBA', (n * T, T))
    d = ImageDraw.Draw(img)
    for i in range(n):
        if i + 1 < n and i not in gap:
            d.line((i * T + 8, 6, (i + 1) * T + 8, 6), fill=(200, 48, 56, 255), width=2)
            d.line((i * T + 8, 5, (i + 1) * T + 8, 5), fill=(240, 104, 104, 255))
    for i in range(n):
        x = i * T + 8
        d.ellipse((x - 3, 12, x + 3, 15), fill=(96, 100, 116, 255), outline=OUTLINE)
        d.rectangle((x - 1, 4, x, 13), fill=(200, 204, 216, 255))
        d.point((x - 1, 5), fill=(248, 248, 255, 255))
        d.ellipse((x - 2, 2, x + 1, 5), fill=(176, 180, 196, 255), outline=OUTLINE)
    return img


def glass_doors(n):
    """Portes vitrées coulissantes (au bas de la salle), ouvertes sur le dehors."""
    img = Image.new('RGBA', (n * T, T))
    d = ImageDraw.Draw(img)
    d.rectangle((0, 0, n * T - 1, 2), fill=(120, 128, 148, 255))
    d.rectangle((0, 0, 2, T - 1), fill=(120, 128, 148, 255))
    d.rectangle((n * T - 3, 0, n * T - 1, T - 1), fill=(120, 128, 148, 255))
    return img


# ---------- Composition ----------
def counter(n):
    """Comptoir d'enregistrement (n cases, une rangée) : plateau clair, façade bleue à liseré blanc, contour sombre."""
    img = Image.new('RGBA', (n * T, T))
    d = ImageDraw.Draw(img)
    d.rectangle((0, 0, n * T - 1, T - 1), fill=OUTLINE)
    d.rectangle((1, 1, n * T - 2, 5), fill=(232, 236, 244, 255))              # plateau
    d.line((1, 1, n * T - 2, 1), fill=(252, 252, 255, 255))
    d.rectangle((1, 6, n * T - 2, T - 3), fill=(72, 112, 200, 255))           # façade
    d.line((1, 9, n * T - 2, 9), fill=(232, 236, 244, 255))
    d.rectangle((1, T - 2, n * T - 2, T - 2), fill=(48, 72, 136, 255))
    return img


def monitor():
    """Petit écran d'enregistrement posé sur le comptoir (vu de dos, côté voyageur)."""
    img = Image.new('RGBA', (10, 9))
    d = ImageDraw.Draw(img)
    d.rectangle((0, 0, 9, 6), fill=OUTLINE)
    d.rectangle((1, 1, 8, 5), fill=(160, 168, 188, 255))
    d.rectangle((4, 7, 5, 8), fill=OUTLINE)
    return img


def suitcase(color):
    """Petite valise à roulettes, à l'échelle d'un personnage."""
    img = Image.new('RGBA', (11, 15))
    d = ImageDraw.Draw(img)
    d.rectangle((3, 0, 7, 3), outline=OUTLINE)                                # poignée
    d.rounded_rectangle((0, 3, 10, 13), radius=2, fill=OUTLINE)
    d.rounded_rectangle((1, 4, 9, 12), radius=1, fill=color + (255,))
    light = tuple(min(255, c + 48) for c in color) + (255,)
    d.line((2, 5, 8, 5), fill=light)
    d.line((3, 8, 7, 8), fill=tuple(max(0, c - 40) for c in color) + (255,))
    d.point((2, 14), fill=OUTLINE)
    d.point((8, 14), fill=OUTLINE)
    return img


def main():
    sol = Image.new('RGBA', (W * T, H * T), (0, 0, 0, 255))
    decor = Image.new('RGBA', (W * T, H * T))
    dessus = Image.new('RGBA', (W * T, H * T))
    solid = np.ones((H, W), np.uint8)
    hall = [(x, y) for y in range(6, 13) for x in range(1, W - 1)] + EXIT

    # Tarmac (bitume Gen 4) et marquage jaune ; deux avions garés, en entier (la carte tient dans l'écran), sans ombre.
    from g4_theme import ASPHALT
    tar = [[P.crop(*ASPHALT[j * 2 + i]) for i in range(2)] for j in range(2)]
    for y in range(4):
        for x in range(W):
            sol.paste(tar[y % 2][x % 2], (x * T, y * T))
    d = ImageDraw.Draw(sol)
    for x in range(0, W * T, 12):
        d.rectangle((x, 60, x + 6, 61), fill=(240, 200, 64, 255))
    plane = Image.open(ROOT / 'public' / 'assets' / 'travel' / 'avion.png').convert('RGBA')
    plane = plane.crop(plane.getbbox())
    top = (4 * T - plane.height) // 2
    decor.alpha_composite(plane, (12, top))
    decor.alpha_composite(plane.transpose(Image.FLIP_LEFT_RIGHT), (W * T - 12 - plane.width, top))

    # Le hall : sol carrelé ; la baie vitrée (rangées 4-5) et le tableau des départs au-dessus du guichet.
    floor = P.floor('carrelage')[0][0]
    for x, y in hall:
        sol.paste(floor, (x * T, y * T))
        solid[y, x] = 0
    wall = P.wall('vitre') if 'vitre' in P.WALLS else P.dppt_wall(150)
    for x in range(W):
        decor.alpha_composite(wall[0][0], (x * T, 4 * T))
        decor.alpha_composite(wall[1][0], (x * T, 5 * T))
    decor.alpha_composite(departures_board(6 * T, 28), (7 * T, 4 * T + 2))

    # Le côté du personnel (rangée 6) : deux plantes ; l'hôtesse derrière le guichet, en x 10.
    palm = P.meuble(136)
    for cx in (1, W - 2):
        decor.alpha_composite(palm, (cx * T, 7 * T - palm.height))
    solid[6, :] = 1
    # Le guichet (rangée 7, x 7-13 : on parle à l'hôtesse par-dessus, case '#') ; deux écrans posés dessus ; un cordon
    # de chaque côté, on ne passe pas derrière.
    decor.alpha_composite(counter(7), (7 * T, 7 * T))
    for sx in (8, 12):
        decor.alpha_composite(monitor(), (sx * T + 3, 7 * T - 5))
    decor.alpha_composite(stanchions(6), (1 * T, 7 * T))
    decor.alpha_composite(stanchions(7), (14 * T, 7 * T))
    solid[7, 1:W - 1] = 1
    # La file : poteaux à cordon (rangée 9), ouverte en x 9-10, face à l'hôtesse.
    decor.alpha_composite(stanchions(5), (4 * T, 9 * T))
    decor.alpha_composite(stanchions(5), (11 * T, 9 * T))
    solid[9, 4:9] = 1
    solid[9, 11:16] = 1
    # La salle d'attente : deux rangées de sièges (rangées 10-11), une petite valise au bout de chacune.
    for x0 in (2, 15):
        row = seat_row(5)
        decor.alpha_composite(row, (x0 * T, 12 * T - row.height))
        solid[10:12, x0:x0 + 5] = 1                    # dossiers et assises
    for cx, color in ((7, (200, 64, 64)), (14, (72, 152, 88))):
        bag = suitcase(color)
        decor.alpha_composite(bag, (cx * T + (T - bag.width) // 2, 12 * T - bag.height))
        solid[11, cx] = 1
    # Portes vitrées et tapis de sortie.
    decor.alpha_composite(glass_doors(2), (EXIT[0][0] * T, EXIT[0][1] * T))
    mat = P.mat('rouge', 2)
    decor.alpha_composite(mat, (EXIT[0][0] * T, EXIT[0][1] * T))
    for x, y in EXIT:
        solid[y, x] = 0

    # Découpage en cases.
    sheet_tiles, index = [], {}
    def add(tile):
        if not np.array(tile)[..., 3].any():
            return -1
        key = tile.tobytes()
        if key not in index:
            index[key] = len(sheet_tiles)
            sheet_tiles.append(tile)
        return index[key]
    layers = {}
    for name, img in (('sol', sol), ('decor', decor), ('dessus', dessus)):
        cells = []
        for y in range(H):
            for x in range(W):
                k = add(img.crop((x * T, y * T, (x + 1) * T, (y + 1) * T)))
                cells.append(k)
        layers[name] = cells
    rows = -(-len(sheet_tiles) // COLS)
    out = Image.new('RGBA', (COLS * T, rows * T))
    for k, t in enumerate(sheet_tiles):
        out.paste(t, ((k % COLS) * T, (k // COLS) * T))
    out.save(V2 / f'{SHEET}.png')
    built = {
        'version': 1, 'id': 'airport', 'name': 'Aéroport', 'width': W, 'height': H, 'sheets': [SHEET],
        'layers': layers, 'solid': [int(v) for v in solid.ravel()],
        'spawn': {'x': 10, 'y': 12, 'facing': 'up'},
    }
    (ROOT / 'src' / 'data' / 'builtMaps' / 'airport.json').write_text(json.dumps(built, ensure_ascii=False, separators=(',', ':')))
    catalog = json.loads((V2 / 'catalog.json').read_text())
    catalog['sheets'] = [s for s in catalog['sheets'] if s['id'] != SHEET]
    catalog['sheets'].append({'id': SHEET, 'name': "Aéroport (cases assemblées)", 'file': f'{SHEET}.png', 'cols': COLS,
                              'rows': rows, 'empty': [], 'author': 'assemblées', 'gen': 4, 'hidden': True})
    (V2 / 'catalog.json').write_text(json.dumps(catalog, ensure_ascii=False))
    preview = sol.copy()
    preview.alpha_composite(decor)
    preview.alpha_composite(dessus)
    print(f'airport : {W} x {H}, {len(sheet_tiles)} cases -> public/assets/v2/{SHEET}.png')
    if len(sys.argv) > 1:
        preview.resize((preview.width * 2, preview.height * 2), Image.NEAREST).save(sys.argv[1])
    for y in range(H):
        print(''.join('#' if solid[y, x] else '.' for x in range(W)))


if __name__ == '__main__':
    main()
