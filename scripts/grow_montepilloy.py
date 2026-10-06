#!/usr/bin/env python3
"""Montépilloy agrandie de 3 cases en largeur et 3 en hauteur (octobre 2026), sur la carte retouchée dans le créateur.

Colonnes et rangées dupliquées (aucune ne traverse une maison) : la colonne x 15 (la grand-rue passe de 2 à 3 cases),
x 3 (la ferme de M. Bouly), x 28 (la prairie) ; les rangées y 16 (entre le chemin de la ferme et le champ), 21 et 22
(le champ et la mare). Une case d'origine (x, y) devient (nx(x), ny(y)).

Change src/data/builtMaps/montepilloy.json (calques, collisions, départ, éléments posés du mode simple). Les
coordonnées du jeu (maps/montepilloy.js, montepilloyStory.js, les cartes voisines) sont mises à jour à la main avec la
même règle. Ensuite, dans le créateur : « Corriger les transitions » et « Refaire la bordure d'arbres ».

Usage : python3 scripts/grow_montepilloy.py   (une seule fois : la carte doit faire 32 x 26)
"""
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
MAP = ROOT / 'src' / 'data' / 'builtMaps' / 'montepilloy.json'
COLS = [3, 15, 28]            # colonnes dupliquées (la copie se place juste après)
ROWS = [16, 21, 22]


def nx(x):
    return x + sum(x > c for c in COLS)


def ny(y):
    return y + sum(y > r for r in ROWS)


def grow(cells, w, h):
    """Un calque (liste ligne par ligne) agrandi : colonnes puis rangées dupliquées."""
    rows = [cells[y * w:(y + 1) * w] for y in range(h)]
    out_rows = []
    for y, row in enumerate(rows):
        new = []
        for x, c in enumerate(row):
            new.append(c)
            if x in COLS:
                new.append(c)
        out_rows.append(new)
        if y in ROWS:
            out_rows.append(list(new))
    return [c for r in out_rows for c in r]


def main():
    m = json.loads(MAP.read_text())
    assert (m['width'], m['height']) == (32, 26), 'déjà agrandie'
    w, h = m['width'], m['height']
    for layer in m['layers']:
        m['layers'][layer] = grow(m['layers'][layer], w, h)
    m['solid'] = grow(m['solid'], w, h)
    m['width'], m['height'] = w + len(COLS), h + len(ROWS)
    m['spawn'] = {**m['spawn'], 'x': nx(m['spawn']['x']), 'y': ny(m['spawn']['y'])}
    st = m.get('studio')
    if st:
        W = m['width']
        # La verrière (l'école) a été déplacée de 4 cases à droite avec l'outil Déplacer : sa note suit le dessin.
        for el in st.get('elements', []):
            dx = 0
            if el['id'] == 'maison-verriere' and (el['x'], el['y']) == (15, 8):
                dx = 4
                el['x'] += dx
            el['prev'] = [[ny(i // w) * W + nx(i % w + dx), v] for i, v in el.get('prev', [])]
            el['x'], el['y'] = nx(el['x']), ny(el['y'])
        st['forest'] = [[nx(x), ny(y)] for x, y in st.get('forest', [])]
        st['fence'] = [[nx(x), ny(y)] for x, y in st.get('fence', [])]
    MAP.write_text(json.dumps(m, ensure_ascii=False))
    print(f"{w} x {h} -> {m['width']} x {m['height']}")


if __name__ == '__main__':
    main()
