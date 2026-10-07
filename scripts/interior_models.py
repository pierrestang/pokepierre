#!/usr/bin/env python3
"""Intérieurs partagés : un modèle (src/data/builtInteriors/modeles/<id>.json, dessin complet, nom « Maison type 1 »)
repris par plusieurs pièces du jeu, dont le JSON devient une fiche { id, name, modele, ajouts?, spawn?, beds?,
npcEdits? } (format : src/data/builtInteriors/compose.js, que le jeu utilise ; compose() ci-dessous en est le double).

- compose(fiche) : la pièce complète ;
- fiche(room, modele_id, modele) : la fiche d'une pièce dessinée en entier, ses différences avec le modèle en `ajouts` ;
- share(modele_id, nom, base, rooms) : fait du dessin de la pièce `base` un modèle et des pièces `rooms` (base comprise
  si elle y est) des fiches qui le reprennent, chacune avec ses différences propres.

Usage : python3 scripts/interior_models.py share <id-modele> "<Nom du type>" <pièce de base> <pièce> [<pièce>…]
        python3 scripts/interior_models.py list
"""
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
ROOMS = ROOT / 'src' / 'data' / 'builtInteriors'
MODELES = ROOMS / 'modeles'
STRIDE = 100000


def load_modele(mid):
    return json.loads((MODELES / f'{mid}.json').read_text())


def save(path, data):
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(data, ensure_ascii=False, separators=(',', ':')))


def _stack(v):
    return [] if v == -1 else (v if isinstance(v, list) else [v])


def _named(sheets, v):
    """Une case (au format des cartes) -> liste de (planche, numéro), pour comparer d'une pièce à l'autre."""
    return [(sheets[r // STRIDE], r % STRIDE) for r in _stack(v) if r >= 0]


def compose(room, modele=None):
    if not room.get('modele'):
        return room
    m = modele or load_modele(room['modele'])
    sheets = list(m['sheets'])

    def slot(name):
        if name not in sheets:
            sheets.append(name)
        return sheets.index(name)

    a = room.get('ajouts') or {}

    def remap(v):
        one = lambda r: r if r < 0 else slot(a['sheets'][r // STRIDE]) * STRIDE + r % STRIDE
        return [one(r) for r in v] if isinstance(v, list) else one(v)

    layers = {k: list(m['layers'][k]) for k in ('sol', 'decor', 'dessus')}
    for i, cell in (a.get('cells') or {}).items():
        for layer, v in cell.items():
            layers[layer][int(i)] = remap(v)
    solid = list(m['solid'])
    for i, v in (a.get('solid') or {}).items():
        solid[int(i)] = v
    out = {**m, 'id': room['id'], 'name': room.get('name', m.get('name')), 'modele': room['modele'],
           'sheets': sheets, 'layers': layers, 'solid': solid}
    out.pop('npcEdits', None)
    out.pop('beds', None)
    for k in ('spawn', 'beds', 'npcEdits'):
        if room.get(k):
            out[k] = room[k]
    return out


def fiche(room, mid, modele):
    """La fiche d'une pièce complète `room` qui reprend le modèle : ses cases et collisions différentes en `ajouts`."""
    if (room['width'], room['height']) != (modele['width'], modele['height']):
        raise ValueError(f"{room['id']} : {room['width']} x {room['height']}, le modèle {mid} fait "
                         f"{modele['width']} x {modele['height']}")
    sheets = []

    def enc(v):
        out = []
        for name, k in _named(room['sheets'], v):
            if name not in sheets:
                sheets.append(name)
            out.append(sheets.index(name) * STRIDE + k)
        return out[0] if len(out) == 1 else (out if out else -1)

    cells, solid = {}, {}
    for i in range(room['width'] * room['height']):
        for layer in ('sol', 'decor', 'dessus'):
            if _named(room['sheets'], room['layers'][layer][i]) != _named(modele['sheets'], modele['layers'][layer][i]):
                cells.setdefault(str(i), {})[layer] = enc(room['layers'][layer][i])
        if room['solid'][i] != modele['solid'][i]:
            solid[str(i)] = room['solid'][i]
    out = {'version': 1, 'id': room['id'], 'name': room.get('name', room['id']), 'modele': mid}
    if cells or solid:
        out['ajouts'] = {'sheets': sheets, 'cells': cells, 'solid': solid}
    for k in ('spawn', 'beds', 'npcEdits'):
        if room.get(k):
            out[k] = room[k]
    return out


def share(mid, name, base, rooms):
    base_map = compose(json.loads((ROOMS / f'{base}.json').read_text()))
    modele = {k: v for k, v in base_map.items() if k not in ('npcEdits', 'beds', 'modele', 'retouche')}
    modele.update(id=mid, name=name)
    save(MODELES / f'{mid}.json', modele)
    for rid in rooms:
        room = compose(json.loads((ROOMS / f'{rid}.json').read_text()))
        f = fiche(room, mid, modele)
        save(ROOMS / f'{rid}.json', f)
        n = len((f.get('ajouts') or {}).get('cells', {})) + len((f.get('ajouts') or {}).get('solid', {}))
        print(f'{rid} -> {mid} ({n} différence(s) propre(s))')


def users():
    """{ id du modèle : [pièces qui le reprennent] }."""
    out = {}
    for p in sorted(ROOMS.glob('*.json')):
        m = json.loads(p.read_text()).get('modele')
        if m:
            out.setdefault(m, []).append(p.stem)
    return out


def write_index():
    """src/data/builtInteriors/index.js : les pièces dessinées (imports statiques, lisibles par Vite et par Node) ; une
    pièce qui reprend un modèle y est recomposée (compose.js)."""
    rooms = sorted(p.stem for p in ROOMS.glob('*.json'))
    modeles = sorted(p.stem for p in MODELES.glob('*.json')) if MODELES.exists() else []
    js = lambda i: i.replace('-', '_')
    lines = ['// Généré par scripts/build_interiors.py (et scripts/interior_models.py) : les intérieurs dessinés en Gen 4',
             '// (voir src/data/maps/interiors.js) ; une pièce qui reprend un modèle partagé (modeles/) y est recomposée.',
             "import { composeInterior } from './compose.js';"]
    lines += [f"import modele_{js(m)} from './modeles/{m}.json' with {{ type: 'json' }};" for m in modeles]
    lines += [f"import {js(i)} from './{i}.json' with {{ type: 'json' }};" for i in rooms]
    lines += ['', 'export const MODELES = {', *[f"  '{m}': modele_{js(m)}," for m in modeles], '};', '']
    lines += ['export const BUILT_INTERIORS = {', *[f"  {js(i)}: composeInterior({js(i)}, MODELES)," for i in rooms], '};', '']
    (ROOMS / 'index.js').write_text('\n'.join(lines))


if __name__ == '__main__':
    args = sys.argv[1:]
    if args[:1] == ['share'] and len(args) >= 5:
        share(args[1], args[2], args[3], args[4:])
        write_index()
    elif args[:1] == ['list']:
        for mid, rooms in users().items():
            print(f"{mid} ({load_modele(mid)['name']}) : {', '.join(rooms)}")
    else:
        print(__doc__)
