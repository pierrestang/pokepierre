#!/usr/bin/env python3
"""L'aéroport (à Bordeaux), redessiné en Gen 4 (octobre 2026) : une carte du créateur, src/data/builtMaps/airport.json.

Dessiné au pixel près sur trois calques (sol, décor, au-dessus de Pierre), puis découpé en cases (planche à part :
public/assets/v2/aeroport.png, ajoutée masquée au catalogue des planches). De haut en bas :
- le tarmac et deux avions (l'avion du trajet, public/assets/travel/avion.png, scripts/build_travel_art.py) ;
- la baie vitrée (mur Gen 4) et le tableau des départs ;
- le tapis à bagages, le guichet (comptoir d'enregistrement : on parle à l'hôtesse par-dessus, case '#' de la grille),
  la file entre ses poteaux à cordon ;
- la salle d'attente (rangées de sièges, valises, plantes) ;
- les portes vitrées vers Bordeaux (tapis de sortie).
Meubles : planches DPPt (interieurs_plans.py), aéroport de TobalCR (ASSETTILESPOKEMONV2/tilesets/interieurs/
aeroport_tobalcr.png : valises, tapis à bagages, comptoirs ; crédit dans credits/tobalcr.txt), le reste dessiné ici.
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
TOBAL = ROOT / 'ASSETTILESPOKEMONV2' / 'tilesets' / 'interieurs' / 'aeroport_tobalcr.png'
T = 16
W, H = 24, 18
SHEET = 'aeroport'
COLS = 16
EXIT = [(11, 17), (12, 17)]
OUTLINE = (40, 44, 60, 255)


def tobal(x, y, w, h):
    return P.isolate(Image.open(TOBAL).convert('RGBA').crop((x, y, x + w, y + h)))


def trim(img):
    return img.crop(img.getbbox())


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
def main():
    sol = Image.new('RGBA', (W * T, H * T), (0, 0, 0, 255))
    decor = Image.new('RGBA', (W * T, H * T))
    dessus = Image.new('RGBA', (W * T, H * T))
    solid = np.ones((H, W), np.uint8)
    hall = [(x, y) for y in range(7, 17) for x in range(1, 23)] + EXIT

    # Tarmac (bitume Gen 4) et marquage jaune ; deux avions garés.
    from g4_theme import ASPHALT
    tar = [[P.crop(*ASPHALT[j * 2 + i]) for i in range(2)] for j in range(2)]
    for y in range(5):
        for x in range(W):
            sol.paste(tar[y % 2][x % 2], (x * T, y * T))
    d = ImageDraw.Draw(sol)
    for x in range(0, W * T, 12):
        d.rectangle((x, 72, x + 6, 73), fill=(240, 200, 64, 255))
    plane = Image.open(ROOT / 'public' / 'assets' / 'travel' / 'avion.png').convert('RGBA')
    shadow = Image.new('RGBA', plane.size)
    shadow.paste((0, 0, 0, 70), (0, 0), plane)
    for px, py, flip in ((26, 6, False), (234, 8, True)):
        p = plane.transpose(Image.FLIP_LEFT_RIGHT) if flip else plane
        s = shadow.transpose(Image.FLIP_LEFT_RIGHT) if flip else shadow
        decor.alpha_composite(s, (px + 4, py + 8))
        decor.alpha_composite(p, (px, py))

    # Le hall : sol carrelé ; la baie vitrée (rangées 5-6) et le tableau des départs.
    floor = P.floor('carrelage')[0][0]
    for x, y in hall:
        sol.paste(floor, (x * T, y * T))
        solid[y, x] = 0
    wall = P.wall('vitre') if 'vitre' in P.WALLS else P.dppt_wall(150)
    for x in range(W):
        decor.alpha_composite(wall[0][0], (x * T, 5 * T))
        decor.alpha_composite(wall[1][0], (x * T, 6 * T))
    decor.alpha_composite(departures_board(6 * T, 28), (9 * T, 5 * T + 2))

    # Tapis à bagages contre la baie, derrière le guichet (rangée 7).
    belt = trim(tobal(160, 96, 96, 37))
    belt = P.stretch(belt.crop((0, belt.height - 20, belt.width, belt.height)), 12)
    decor.alpha_composite(belt, (6 * T, 8 * T - belt.height))
    solid[7, 6:18] = 1
    # Le guichet (rangée 9, x 6-17) : façades de comptoirs d'enregistrement ; deux écrans posés dessus.
    counter = trim(tobal(78, 256, 38, 32))
    for i in range(0, 12 * T, counter.width):
        piece = counter.crop((0, 0, min(counter.width, 12 * T - i), counter.height))
        decor.alpha_composite(piece, (6 * T + i, 10 * T - counter.height))
    # Deux écrans d'enregistrement posés sur le comptoir, de part et d'autre de l'hôtesse.
    screen = trim(Image.open(TOBAL).convert('RGBA').crop((128, 16, 160, 46)))
    for sx in (8, 14):
        decor.alpha_composite(screen, (sx * T, 9 * T - screen.height + 8))
    solid[9, 6:18] = 1
    # Le côté du personnel : un cordon de chaque côté du guichet (rangée 8), on ne passe pas derrière.
    decor.alpha_composite(stanchions(5), (1 * T, 8 * T))
    decor.alpha_composite(stanchions(5), (18 * T, 8 * T))
    solid[8, 1:6] = 1
    solid[8, 18:23] = 1
    # La file : poteaux à cordon (rangée 11), ouverte en x 11-12 face à l'hôtesse.
    decor.alpha_composite(stanchions(5), (6 * T, 11 * T))
    decor.alpha_composite(stanchions(5), (13 * T, 11 * T))
    solid[11, 6:11] = 1
    solid[11, 13:18] = 1
    # La salle d'attente : quatre rangées de sièges, des valises, des plantes.
    for x0, y0 in ((2, 13), (2, 15), (16, 13), (16, 15)):
        row = seat_row(5)
        decor.alpha_composite(row, (x0 * T, (y0 + 1) * T - row.height))
        solid[y0, x0:x0 + 5] = 1
    for (sx, sy, cx, cy) in ((64, 344, 7, 13), (96, 344, 1, 15), (160, 344, 21, 15), (128, 344, 21, 13)):
        bag = trim(tobal(sx, sy, 32, 60))
        decor.alpha_composite(bag, (cx * T + (T - bag.width) // 2, (cy + 1) * T - bag.height))
        solid[cy, cx] = 1
    palm = P.meuble(136)
    for cx in (1, 22):
        decor.alpha_composite(palm, (cx * T, 8 * T - palm.height + T))
        solid[7, cx] = 1
    # Portes vitrées et tapis de sortie.
    decor.alpha_composite(glass_doors(2), (11 * T, 17 * T))
    mat = P.mat('rouge', 2)
    decor.alpha_composite(mat, (11 * T, 17 * T))
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
        'spawn': {'x': 11, 'y': 15, 'facing': 'up'},
    }
    (ROOT / 'src' / 'data' / 'builtMaps' / 'airport.json').write_text(json.dumps(built, ensure_ascii=False, separators=(',', ':')))
    catalog = json.loads((V2 / 'catalog.json').read_text())
    catalog['sheets'] = [s for s in catalog['sheets'] if s['id'] != SHEET]
    catalog['sheets'].append({'id': SHEET, 'name': "Aéroport (cases assemblées)", 'file': f'{SHEET}.png', 'cols': COLS,
                              'rows': rows, 'empty': [], 'author': 'assemblées, TobalCR', 'gen': 4, 'hidden': True})
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
