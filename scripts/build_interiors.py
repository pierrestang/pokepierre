#!/usr/bin/env python3
"""Intérieurs Gen 4 (octobre 2026) : chaque pièce du jeu redessinée avec les planches de la 4e génération.

Pour chaque intérieur décrit dans scripts/interieurs_plans.py (mur, sol, meubles posés case par case), écrit
src/data/builtInteriors/<id>.json au format des cartes du créateur (calques sol / décor / au-dessus de Pierre,
collisions), et src/data/builtInteriors/index.js qui les rassemble. Le jeu les branche sur les intérieurs de
src/data/maps/interiors.js (même taille, même grille logique : portes, tapis de sortie, PNJ et objets aux mêmes cases) ;
leur dessin remplace le rendu Rouge Feu.

Toutes les cases utilisées sont copiées dans une planche à part, public/assets/v2/interieurs.png (masquée dans le
créateur) : refaire la bibliothèque Gen 4 ne déplace rien. Les cases déjà dans la planche gardent leur numéro.

Usage : python3 scripts/build_interiors.py [id…] [--apercu <dossier>] [--essai]   (toutes les pièces par défaut ;
--essai : aperçus seulement, rien n'est écrit dans le projet)
"""
import json
import subprocess
import sys
from pathlib import Path

import numpy as np
from PIL import Image

sys.path.insert(0, str(Path(__file__).parent))
import interieurs_plans as P  # noqa: E402

ROOT = Path(__file__).resolve().parent.parent
V2 = ROOT / 'public' / 'assets' / 'v2'
OUT = ROOT / 'src' / 'data' / 'builtInteriors'
TILE = 16
COLS = 16
SHEET = 'interieurs'
STRIDE = 100000


class Packer:
    """Cases de la planche « interieurs » : les anciennes gardent leur numéro, les nouvelles s'ajoutent à la fin."""
    def __init__(self):
        self.tiles, self.index = [], {}
        old = V2 / f'{SHEET}.png'
        if old.exists():
            img = Image.open(old).convert('RGBA')
            for k in range(img.width // TILE * (img.height // TILE)):
                t = img.crop(((k % COLS) * TILE, (k // COLS) * TILE, (k % COLS + 1) * TILE, (k // COLS + 1) * TILE))
                self.index.setdefault(t.tobytes(), k)
                self.tiles.append(t)

    def add(self, tile):
        if not np.array(tile)[..., 3].any():
            return -1
        key = tile.tobytes()
        if key not in self.index:
            self.index[key] = len(self.tiles)
            self.tiles.append(tile)
        return self.index[key]

    def save(self):
        rows = max(1, -(-len(self.tiles) // COLS))
        img = Image.new('RGBA', (COLS * TILE, rows * TILE))
        for k, t in enumerate(self.tiles):
            img.paste(t, ((k % COLS) * TILE, (k // COLS) * TILE))
        img.save(V2 / f'{SHEET}.png')
        catalog = json.loads((V2 / 'catalog.json').read_text())
        catalog['sheets'] = [s for s in catalog['sheets'] if s['id'] != SHEET]
        catalog['sheets'].append({'id': SHEET, 'name': 'Intérieurs Gen 4 du jeu (cases assemblées)', 'file': f'{SHEET}.png',
                                  'cols': COLS, 'rows': rows, 'empty': [], 'author': 'assemblées', 'gen': 4,
                                  'hidden': True})
        (V2 / 'catalog.json').write_text(json.dumps(catalog, ensure_ascii=False))
        return rows


def tiles_of(img):
    """Image (multiple de 16 px) -> lignes de cases."""
    a = img.convert('RGBA')
    return [[a.crop((i * TILE, j * TILE, (i + 1) * TILE, (j + 1) * TILE)) for i in range(a.width // TILE)]
            for j in range(a.height // TILE)]


def load_rooms():
    data = subprocess.check_output(['node', str(ROOT / 'scripts' / 'export_interiors.mjs')], cwd=ROOT)
    return json.loads(data)


def build_room(rid, src, plan, pack):
    """Calques et collisions d'une pièce. Renvoie (carte, image d'aperçu, problèmes)."""
    grid = src['grid']
    H, W = len(grid), len(grid[0])
    sol = [[] for _ in range(W * H)]
    decor = [[] for _ in range(W * H)]
    dessus = [[] for _ in range(W * H)]
    solid = [0] * (W * H)
    preview = Image.new('RGBA', (W * TILE, H * TILE), (0, 0, 0, 255))
    top_preview = Image.new('RGBA', (W * TILE, H * TILE))
    wall = P.wall(plan['wall'])
    floor = P.floor(plan['floor'])
    void = {(x, y) for y in range(H) for x in range(W) if grid[y][x] == 'X'}
    void |= {tuple(c) for c in plan.get('void', [])}
    inside = lambda x, y: 0 <= x < W and 0 <= y < H and (x, y) not in void

    def put(layer, x, y, tile):
        k = pack.add(tile)
        if k >= 0:
            layer[y * W + x].append(STRIDE * 0 + k)
            (top_preview if layer is dessus else preview).alpha_composite(tile, (x * TILE, y * TILE))

    # Sol, murs (deux rangées au-dessus du sol : la face, puis la plinthe), vide noir ailleurs.
    for y in range(H):
        for x in range(W):
            if inside(x, y):
                put(sol, x, y, floor[y % len(floor)][x % len(floor[0])])
            elif inside(x, y + 1):
                put(decor, x, y, wall[1][x % len(wall[1])])
                solid[y * W + x] = 1
            elif inside(x, y + 2) and (x, y + 1) in void:
                put(decor, x, y, wall[0][x % len(wall[0])])
                solid[y * W + x] = 1
            else:
                solid[y * W + x] = 1
    # Tapis de sortie.
    exits = sorted((x, y) for y in range(H) for x in range(W) if grid[y][x] == 'E')
    if exits and plan.get('mat', 'rouge'):
        mat = tiles_of(P.mat(plan.get('mat', 'rouge'), len(exits)))
        x0, y0 = exits[0]
        for i, t in enumerate(mat[0]):
            put(decor, x0 + i, y0, t)
    # Meubles : [nom, x, y] ((x, y) : la case du pied, en bas à gauche), dessinés dans l'ordre (le dernier par-dessus).
    beds = []
    for item in plan.get('items', []):
        name, x0, y0 = item[:3]
        opts = item[3] if len(item) > 3 else {}
        spec = {**P.item(name), **opts}
        img = spec['img']()
        y0 -= img.height // TILE - 1                  # (x, y) : la case du pied du meuble, en bas à gauche
        if spec.get('dx') or spec.get('dy'):          # décalage en pixels (un objet posé sur un meuble)
            dx, dy = spec.get('dx', 0), spec.get('dy', 0)
            up, left = -(-max(0, -dy) // TILE), -(-max(0, -dx) // TILE)
            canvas = Image.new('RGBA', (img.width + (left + 1) * TILE, img.height + (up + 1) * TILE))
            canvas.alpha_composite(img, (left * TILE + dx, up * TILE + dy))
            img, x0, y0 = canvas, x0 - left, y0 - up
            spec.setdefault('solid', 0)
        rows = tiles_of(img)
        h, w = len(rows), len(rows[0])
        if 'solid_top' in spec:                       # rangées du haut qui bloquent (un comptoir vu de face)
            mask = [[1 if j < spec['solid_top'] else 0 for _ in range(w)] for j in range(h)]
        else:
            blocks = spec.get('solid', 1)             # rangées du bas qui bloquent (ou masque)
            mask = blocks if isinstance(blocks, list) else [[1 if j >= h - blocks else 0 for _ in range(w)]
                                                             for j in range(h)]
        first_block = next((j for j, r in enumerate(mask) if any(r)), h)
        if spec.get('bed'):
            # Lit où dort un PNJ (`inBed`) : tout ce qui est sous l'oreiller passe au-dessus des personnages (la
            # couverture le recouvre), et le jeu sait où le coucher (built.beds : cases, milieu et haut du lit en px).
            bx0, by0, bx1, by1 = img.getbbox()
            beds.append({'x': x0, 'y': y0, 'w': w, 'h': h, 'cx': x0 * TILE + (bx0 + bx1) // 2,
                         'py': y0 * TILE + by0 + spec.get('pillow', 3)})
        for j, row in enumerate(rows):
            for i, t in enumerate(row):
                x, y = x0 + i, y0 + j
                if not (0 <= x < W and 0 <= y < H):
                    continue
                # Le haut d'un meuble debout au milieu de la pièce passe devant Pierre ; contre le mur, il reste au décor.
                over = j < first_block and inside(x, y) and not spec.get('flat')
                if spec.get('bed'):
                    over = j * TILE >= img.getbbox()[1] + spec.get('cover', 12)
                if spec.get('top'):                   # suspendu (boule à facettes, lustre) : au-dessus de tout
                    over = True
                put(dessus if over else decor, x, y, t)
                if mask[j][i]:
                    solid[y * W + x] = 1
    for x, y in plan.get('free', []):
        solid[y * W + x] = 0
    for x, y in plan.get('block', []):
        solid[y * W + x] = 1
    # Contrôles : PNJ sur une case libre, sorties libres, objets qu'on peut regarder.
    problems = []
    for n in src['npcs']:
        if solid[n['y'] * W + n['x']] and n['id'] not in plan.get('npc_on_solid', []):
            problems.append(f"PNJ {n['id']} sur une case bloquée ({n['x']}, {n['y']})")
    for x, y in exits:
        if solid[y * W + x]:
            problems.append(f'sortie bloquée ({x}, {y})')
    if src['spawn'] and solid[src['spawn']['y'] * W + src['spawn']['x']]:
        problems.append('arrivée sur une case bloquée')
    for y in range(H):
        for x in range(W):
            if grid[y][x] in 'ηξ' and solid[y * W + x]:
                problems.append(f'escalier bloqué ({x}, {y})')
    # Accessibilité depuis l'arrivée : sorties et escaliers atteints, PNJ et objets abordables (une case voisine).
    if src['spawn']:
        from collections import deque
        seen, todo = {(src['spawn']['x'], src['spawn']['y'])}, deque([(src['spawn']['x'], src['spawn']['y'])])
        while todo:
            cx, cy = todo.popleft()
            for nx, ny in ((cx + 1, cy), (cx - 1, cy), (cx, cy + 1), (cx, cy - 1)):
                if 0 <= nx < W and 0 <= ny < H and (nx, ny) not in seen and not solid[ny * W + nx]:
                    seen.add((nx, ny))
                    todo.append((nx, ny))
        near = lambda x, y: any(c in seen for c in ((x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1), (x, y)))
        for y in range(H):
            for x in range(W):
                if grid[y][x] in 'Eηξ' and (x, y) not in seen:
                    problems.append(f'sortie ou escalier inatteignable ({x}, {y})')
        for n in src['npcs']:
            if not near(n['x'], n['y']):
                problems.append(f"PNJ {n['id']} inabordable ({n['x']}, {n['y']})")
        for o in src['objects']:
            if not near(o['x'], o['y']):
                problems.append(f"objet inabordable ({o['x']}, {o['y']})")
    # Écarts avec la grille d'origine (à vérifier : un passage fermé, un meuble devenu traversable).
    was = lambda x, y: src['solid'].get(grid[y][x], False)
    closed = [(x, y) for y in range(H) for x in range(W) if solid[y * W + x] and not was(x, y)]
    opened = [(x, y) for y in range(H) for x in range(W) if not solid[y * W + x] and was(x, y)]
    if closed:
        problems.append(f'cases libres devenues bloquées : {closed}')
    if opened:
        problems.append(f'cases bloquées devenues libres : {opened}')
    preview.alpha_composite(top_preview)
    built = {
        'version': 1, 'id': rid, 'name': src['name'], 'width': W, 'height': H, 'sheets': [SHEET],
        'layers': {k: [c[0] if len(c) == 1 else (c if c else -1) for c in layer]
                   for k, layer in (('sol', sol), ('decor', decor), ('dessus', dessus))},
        'solid': solid, 'spawn': src['spawn'] or {'x': 0, 'y': 0, 'facing': 'down'},
    }
    if beds:
        built['beds'] = beds
    return built, preview, problems


def main():
    args = sys.argv[1:]
    essai = '--essai' in args                         # aperçus seulement : rien n'est écrit dans le projet
    args = [a for a in args if a != '--essai']
    apercu = None
    if '--apercu' in args:
        i = args.index('--apercu')
        apercu = Path(args[i + 1])
        args = args[:i] + args[i + 2:]
        apercu.mkdir(parents=True, exist_ok=True)
    rooms = load_rooms()
    pack = Packer()
    OUT.mkdir(parents=True, exist_ok=True)
    ids = args or list(P.PLANS)
    for rid in ids:
        if rid not in rooms:
            print(f'{rid} : intérieur inconnu')
            continue
        built, preview, problems = build_room(rid, rooms[rid], P.PLANS[rid], pack)
        if not essai:
            (OUT / f'{rid}.json').write_text(json.dumps(built, ensure_ascii=False, separators=(',', ':')))
        if apercu:
            preview.resize((preview.width * 3, preview.height * 3), Image.NEAREST).save(apercu / f'{rid}.png')
        print(f"{rid} : {built['width']} x {built['height']}" + ''.join(f'\n  ! {p}' for p in problems))
    if essai:
        return
    rows = pack.save()
    # Index des pièces dessinées (imports statiques : lisible par Vite et par Node).
    done = sorted(p.stem for p in OUT.glob('*.json'))
    lines = ['// Généré par scripts/build_interiors.py : les intérieurs dessinés en Gen 4 (voir src/data/maps/interiors.js).']
    lines += [f"import {i.replace('-', '_')} from './{i}.json' with {{ type: 'json' }};" for i in done]
    lines += ['', 'export const BUILT_INTERIORS = {', *[f"  {i.replace('-', '_')}," for i in done], '};', '']
    (OUT / 'index.js').write_text('\n'.join(lines))
    print(f'{len(ids)} pièces, {len(pack.tiles)} cases ({rows} rangées) -> public/assets/v2/{SHEET}.png')


if __name__ == '__main__':
    main()
