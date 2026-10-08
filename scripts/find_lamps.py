#!/usr/bin/env python3
"""Têtes de réverbère des cartes du créateur, pour les allumer la nuit (src/scenes/MapScene.js applyAmbience).

Une tête de réverbère, c'est la case du haut d'un réverbère dessiné : celle des éléments « réverbère » du catalogue
(catalogue.json : réverbère, réverbère victorien, à globe…) et toute case de n'importe quelle planche qui a exactement
la même image (copies sans ombre dans la planche auto), plus les têtes repérées à la main (SEEDS : réverbères venus des
anciennes cartes, sans élément du catalogue). Écrit src/data/lampTiles.json : { "refs": { "<planche>:<n°>": [cx, cy] } },
(cx, cy) : le milieu du dessin de la tête dans sa case, en pixels (le halo s'y centre).
Le jeu cherche ces cases dans les calques Décor et « au-dessus de Pierre » : un halo sur la tête, une flaque au pied.

À relancer après avoir posé de nouveaux réverbères d'un autre modèle : python3 scripts/find_lamps.py
"""
import glob
import json
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
V2 = ROOT / 'public' / 'assets' / 'v2'
OUT = ROOT / 'src' / 'data' / 'lampTiles.json'
STRIDE = 100000
LAMP_WORDS = ('reverb', 'réverb', 'lampad', 'globe')
# Têtes de réverbère sans élément du catalogue : (carte, x, y) de la case du haut.
SEEDS = [('prytanee', 9, 5), ('prytanee', 16, 5)]

cat = json.loads((V2 / 'catalog.json').read_text())
SH = {s['id']: s for s in cat['sheets']}
_imgs = {}


def tile_img(sid, k):
    if sid not in _imgs:
        _imgs[sid] = Image.open(V2 / SH[sid]['file']).convert('RGBA')
    c = SH[sid]['cols']
    return _imgs[sid].crop(((k % c) * 16, (k // c) * 16, (k % c) * 16 + 16, (k // c) * 16 + 16))


def tile(sid, k):
    return tile_img(sid, k).tobytes()


def centre(sid, k):
    box = tile_img(sid, k).getbbox() or (0, 0, 16, 16)
    return [(box[0] + box[2]) // 2, (box[1] + box[3]) // 2]


def stack(v):
    return [r for r in (v if isinstance(v, list) else [v]) if r >= 0]


def main():
    heads = set()
    catalogue = json.loads((V2 / 'catalogue.json').read_text())
    for t in catalogue['themes'].values():
        for e in t['elements']:
            if any(w in (e['id'] + e['name']).lower() for w in LAMP_WORDS):
                heads |= {tile('catalogue', k) for k in e['tiles'][0] if k >= 0}
    maps = {Path(f).stem: json.loads(Path(f).read_text()) for f in glob.glob(str(ROOT / 'src' / 'data' / 'builtMaps' / '*.json'))}
    for mid, x, y in SEEDS:
        b = maps[mid]
        for L in ('dessus', 'decor'):
            for r in stack(b['layers'][L][y * b['width'] + x]):
                heads.add(tile(b['sheets'][r // STRIDE], r % STRIDE))
    refs = {}
    for b in maps.values():
        for L in ('dessus', 'decor'):
            for v in b['layers'][L]:
                for r in stack(v):
                    sid, k = b['sheets'][r // STRIDE], r % STRIDE
                    if tile(sid, k) in heads:
                        refs[f'{sid}:{k}'] = centre(sid, k)
    OUT.write_text(json.dumps({'refs': dict(sorted(refs.items()))}, indent=1) + '\n')
    print(f'{len(refs)} case(s) de tête de réverbère -> {OUT.relative_to(ROOT)}')


if __name__ == '__main__':
    main()
