#!/usr/bin/env python3
"""Intérieurs Gen 4 (octobre 2026) : chaque pièce du jeu redessinée avec les planches de la 4e génération.

Pour chaque intérieur décrit dans scripts/interieurs_plans.py (mur, sol, meubles posés case par case), écrit
src/data/builtInteriors/<id>.json au format des cartes du créateur (calques sol / décor / au-dessus de Pierre,
collisions), et src/data/builtInteriors/index.js qui les rassemble. Le jeu les branche sur les intérieurs de
src/data/maps/interiors.js (même taille, même grille logique : portes, tapis de sortie, PNJ et objets aux mêmes cases) ;
leur dessin remplace le rendu Rouge Feu.

Toutes les cases utilisées sont copiées dans une planche à part, public/assets/v2/interieurs.png (masquée dans le
créateur) : refaire la bibliothèque Gen 4 ne déplace rien. Les cases déjà dans la planche gardent leur numéro.

Une pièce retouchée à la main dans le créateur de cartes (marquée `retouche` par le serveur de dev, voir
vite.config.js) n'est plus redessinée, sauf avec --force ; les PNJ placés dans le créateur (`npcEdits`) sont toujours
gardés.

Usage : python3 scripts/build_interiors.py [id…] [--apercu <dossier>] [--essai] [--force]   (toutes les pièces par
défaut ; --essai : aperçus seulement, rien n'est écrit dans le projet ; --force : redessine aussi les pièces retouchées)
"""
import json
import re
import subprocess
import sys
from pathlib import Path

import numpy as np
from PIL import Image

sys.path.insert(0, str(Path(__file__).parent))
import interieurs_plans as P  # noqa: E402
import hgss_rooms as HG  # noqa: E402
import interior_models as IM  # noqa: E402

ROOT = Path(__file__).resolve().parent.parent
V2 = ROOT / 'public' / 'assets' / 'v2'
OUT = ROOT / 'src' / 'data' / 'builtInteriors'
TILE = 16
COLS = 16
SHEET = 'interieurs'
STRIDE = 100000


def no_shadow(tile):
    """La case sans ombre portée (pixels noirs semi-transparents : calques Shadow des pièces HGSS, ombres des meubles) :
    l'intérieur a la même direction artistique que l'extérieur, sans ombres (voir scripts/remove_shadows.py)."""
    a = np.array(tile.convert('RGBA'))
    shadow = (a[..., 3] > 0) & (a[..., 3] < 255) & (a[..., :3].astype(int).sum(-1) < 40)
    if not shadow.any():
        return tile
    a[shadow] = 0
    return Image.fromarray(a)


class Packer:
    """Cases de la planche « interieurs » : les anciennes gardent leur numéro, les nouvelles s'ajoutent à la fin. Toutes
    sans ombre (no_shadow), anciennes comprises : les pièces retouchées dans le créateur le sont aussi."""
    def __init__(self):
        self.tiles, self.index = [], {}
        old = V2 / f'{SHEET}.png'
        if old.exists():
            img = Image.open(old).convert('RGBA')
            for k in range(img.width // TILE * (img.height // TILE)):
                t = no_shadow(img.crop(((k % COLS) * TILE, (k // COLS) * TILE, (k % COLS + 1) * TILE, (k // COLS + 1) * TILE)))
                self.index.setdefault(t.tobytes(), k)
                self.tiles.append(t)

    def add(self, tile):
        tile = no_shadow(tile)
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


def hgss_base(plan):
    """Pièce partie d'une vraie pièce HGSS (scripts/hgss_rooms.py) : {'sol', 'decor', 'dessus', 'solid', 'w', 'h'},
    retouchée par plan['splice'] (bandes remplacées), plan['erase'] (rectangles vidés de leurs meubles, sol gardé et
    praticable) et plan['paste'] (morceaux
    d'autres pièces HGSS collés : {'from': (carte, x, y, w, h), 'to': (x, y), 'sol': False})"""
    import hgss_rooms as HG
    name, x0, y0, w, h = plan['hgss']
    r = HG.room(name, x0, y0, w, h)
    # plan['splice'] : des bandes d'une pièce HGSS qui remplacent tout (calques et collisions) à cet endroit, avant
    # erase et paste : pour raccourcir une pièce (ex. la clinique : le haut du labo, puis la rangée des lits).
    for p in plan.get('splice', []):
        sname, sx, sy, sw, sh = p['from']
        piece = HG.room(sname, sx, sy, sw, sh)
        tx, ty = p['to']
        for y in range(sh):
            for x in range(sw):
                X, Y = tx + x, ty + y
                if 0 <= X < w and 0 <= Y < h:
                    j, i = y * sw + x, Y * w + X
                    for k in ('sol', 'decor', 'dessus', 'solid'):
                        r[k][i] = piece[k][j]
    for ex, ey, ew, eh in plan.get('erase', []):
        for y in range(ey, ey + eh):
            for x in range(ex, ex + ew):
                i = y * w + x
                r['decor'][i], r['dessus'][i] = [], []
                r['solid'][i] = 0 if r['sol'][i] else 1
    for p in plan.get('paste', []):
        sname, sx, sy, sw, sh = p['from']
        piece = HG.room(sname, sx, sy, sw, sh, only=p.get('only'))
        tx, ty = p['to']
        for y in range(sh):
            for x in range(sw):
                X, Y = tx + x, ty + y
                if not (0 <= X < w and 0 <= Y < h):
                    continue
                j, i = y * sw + x, Y * w + X
                if not (piece['decor'][j] or piece['dessus'][j] or (p.get('sol') and piece['sol'][j])):
                    continue
                if p.get('sol') and piece['sol'][j]:
                    r['sol'][i] = piece['sol'][j]
                r['decor'][i] = r['decor'][i] + piece['decor'][j]
                r['dessus'][i] = r['dessus'][i] + piece['dessus'][j]
                r['solid'][i] = 1 if (piece['solid'][j] and (piece['decor'][j] or piece['dessus'][j])) else r['solid'][i]
    return r


def suggested_grid(base):
    """Grille logique proposée pour une pièce HGSS : 'X' hors du sol, 'm' bloqué, 'o' libre, 'E' sur le tapis rouge
    de sortie (case libre de la dernière rangée de sol, au dessin surtout rouge)."""
    w, h = base['w'], base['h']
    rows = []
    for y in range(h):
        row = ''
        for x in range(w):
            i = y * w + x
            c = 'X' if not base['sol'][i] else ('m' if base['solid'][i] else 'o')
            last = y == h - 1 or not base['sol'][(y + 1) * w + x]
            if c == 'o' and last and base['decor'][i]:
                a = np.array(base['decor'][i][-1].convert('RGBA')).astype(int)
                vis = a[..., 3] > 0
                if vis.sum() > 40 and ((a[..., 0] > a[..., 1] + 60) & vis).sum() > 0.4 * vis.sum():
                    c = 'E'
            row += c
        rows.append(row)
    return rows


def build_room(rid, src, plan, pack):
    """Calques et collisions d'une pièce. Renvoie (carte, image d'aperçu, problèmes)."""
    grid = src['grid']
    H, W = len(grid), len(grid[0])
    base = hgss_base(plan) if 'hgss' in plan else None
    size_problem = None
    if base and (base['w'], base['h']) != (W, H):
        size_problem = (f"taille {base['w']} x {base['h']} différente de la grille du jeu ({W} x {H}) ; grille proposée :\n      "
                        + '\n      '.join(f"'{r}'," for r in suggested_grid(base)))
        W, H = base['w'], base['h']
        grid = suggested_grid(base)
    sol = [[] for _ in range(W * H)]
    decor = [[] for _ in range(W * H)]
    dessus = [[] for _ in range(W * H)]
    solid = [0] * (W * H)
    preview = Image.new('RGBA', (W * TILE, H * TILE), (0, 0, 0, 255))
    top_preview = Image.new('RGBA', (W * TILE, H * TILE))
    void = {(x, y) for y in range(H) for x in range(W) if grid[y][x] == 'X'}
    void |= {tuple(c) for c in plan.get('void', [])}
    inside = lambda x, y: 0 <= x < W and 0 <= y < H and (x, y) not in void

    def put(layer, x, y, tile):
        tile = no_shadow(tile)
        k = pack.add(tile)
        if k >= 0:
            layer[y * W + x].append(STRIDE * 0 + k)
            (top_preview if layer is dessus else preview).alpha_composite(tile, (x * TILE, y * TILE))

    if base:
        # Vraie pièce HGSS : ses calques et ses collisions tels quels (son tapis de sortie compris).
        for i in range(W * H):
            for layer, k in ((sol, 'sol'), (decor, 'decor'), (dessus, 'dessus')):
                for t in base[k][i]:
                    put(layer, i % W, i // W, t)
            solid[i] = base['solid'][i]
        inside = lambda x, y: 0 <= x < W and 0 <= y < H and bool(base['sol'][y * W + x])
    else:
        wall = P.wall(plan['wall'])
        floor = P.floor(plan['floor'])
    # Sol, murs (deux rangées au-dessus du sol : la face, puis la plinthe), vide noir ailleurs.
    for y in range(H if not base else 0):
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
    if exits and plan.get('mat', None if base else 'rouge'):
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
    problems = [size_problem] if size_problem else []
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
    if '--index' in args:                             # seulement l'index des pièces (src/data/builtInteriors/index.js)
        IM.write_index()
        return
    essai = '--essai' in args                         # aperçus seulement : rien n'est écrit dans le projet
    force = '--force' in args                         # redessine aussi les pièces retouchées dans le créateur
    args = [a for a in args if a not in ('--essai', '--force')]
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
    made = set()                                      # modèles déjà dessinés pendant ce passage
    for rid in ids:
        if rid not in rooms:
            print(f'{rid} : intérieur inconnu')
            continue
        old_file = OUT / f'{rid}.json'
        old = json.loads(old_file.read_text()) if old_file.exists() else {}
        plan = P.PLANS[rid]
        # Plan partagé (plan['modele'] = (id, « Nom du type »)) : le dessin va dans le modèle, la pièce devient une
        # fiche qui le reprend (voir scripts/interior_models.py) ; un modèle retouché dans le créateur est gardé.
        if plan.get('modele'):
            mid, mname = plan['modele']
            # Une pièce retouchée dans le créateur qui n'est pas encore une fiche : on ne la remplace pas sans --force
            # (son dessin serait perdu) ; avec --force, ses PNJ placés, son départ et ses lits sont gardés.
            if old.get('retouche') and not old.get('modele') and not force and not essai:
                print(f'{rid} : retouchée dans le créateur, pas encore partagée (--force pour la passer au modèle {mid})')
                continue
            mfile = IM.MODELES / f'{mid}.json'
            mold = json.loads(mfile.read_text()) if mfile.exists() else {}
            if mid not in made and not (mold.get('retouche') and not force) and not essai:
                built, preview, problems = build_room(rid, rooms[rid], plan, pack)
                built.update(id=mid, name=mold.get('name', mname))
                built.pop('npcEdits', None)
                IM.save(mfile, built)
                print(f"modèle {mid} ({built['name']}) : {built['width']} x {built['height']}"
                      + ''.join(f'\n  ! {p}' for p in problems))
            made.add(mid)
            if not essai:
                fiche = {'version': 1, 'id': rid, 'name': old.get('name') or rooms[rid]['name'], 'modele': mid}
                for k in ('spawn', 'beds', 'npcEdits', 'ajouts'):
                    if old.get(k) and (old.get('modele') == mid or (k != 'ajouts' and not old.get('modele'))):
                        fiche[k] = old[k]
                IM.save(old_file, fiche)
                print(f'{rid} : reprend le modèle {mid}')
            continue
        if old.get('modele'):
            print(f"{rid} : reprend le modèle {old['modele']} (partagé), gardée ; on modifie le modèle dans le créateur")
            continue
        if old.get('retouche') and not force and not essai:
            print(f'{rid} : retouchée dans le créateur, gardée (--force pour la redessiner)')
            continue
        built, preview, problems = build_room(rid, rooms[rid], plan, pack)
        if old.get('npcEdits'):                       # PNJ placés dans le créateur : gardés
            built['npcEdits'] = old['npcEdits']
        if old.get('name'):                           # nom donné dans le créateur : gardé, sans « - à modifier »
            built['name'] = re.sub(r'\s*-\s*à (modifier|refaire|remplacer.*)$', '', old['name']).strip() or built['name']
        if not essai:
            (OUT / f'{rid}.json').write_text(json.dumps(built, ensure_ascii=False, separators=(',', ':')))
        if apercu:
            preview.resize((preview.width * 3, preview.height * 3), Image.NEAREST).save(apercu / f'{rid}.png')
        print(f"{rid} : {built['width']} x {built['height']}" + ''.join(f'\n  ! {p}' for p in problems))
    if essai:
        return
    rows = pack.save()
    IM.write_index()                                   # index des pièces dessinées (et des modèles partagés)
    print(f'{len(ids)} pièces, {len(pack.tiles)} cases ({rows} rangées) -> public/assets/v2/{SHEET}.png')


if __name__ == '__main__':
    main()
