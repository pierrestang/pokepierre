#!/usr/bin/env python3
"""Montépilloy agrandie de 3 cases en largeur et 3 en hauteur (octobre 2026), sur la carte retouchée dans le créateur.

Colonnes et rangées dupliquées (aucune ne traverse une maison) : la colonne x 15 (la grand-rue passe de 2 à 3 cases),
x 3 (la ferme de M. Bouly), x 28 (la prairie) ; les rangées y 16 (entre le chemin de la ferme et le champ), 21 et 22
(le champ et la mare). Une case d'origine (x, y) devient (nx(x), ny(y)).

Change src/data/builtMaps/montepilloy.json (calques, collisions, départ, éléments posés du mode simple). Les
coordonnées du jeu (maps/montepilloy.js, montepilloyStory.js, les cartes voisines) sont mises à jour à la main avec la
même règle. Ensuite, dans le créateur : « Corriger les transitions » et « Refaire la bordure d'arbres ».

Deuxième étape (36 x 30, octobre 2026) : une carte bordée d'arbres doit avoir des dimensions paires (les arbres font
2 x 2 cases ; voir docs/technique/createur-de-cartes.md). Colonne x 32 (la prairie, contre la bordure droite) et
rangée y 17 (sous le chemin de la ferme) dupliquées ; à chaque sortie (rangées du haut et du bas), une bande d'herbe
d'une case le long de la grand-rue (x 14), pour que la forêt de gauche fasse aussi un nombre pair de cases.

Usage : python3 scripts/grow_montepilloy.py   (32 x 26 -> 35 x 29, puis 35 x 29 -> 36 x 30)
"""
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
MAP = ROOT / 'src' / 'data' / 'builtMaps' / 'montepilloy.json'
COLS = [3, 15, 28]            # colonnes dupliquées (la copie se place juste après)
ROWS = [16, 21, 22]
COLS2 = [32]                  # deuxième étape : dimensions paires
ROWS2 = [17]


def nx(x):
    return x + sum(x > c for c in COLS)


def ny(y):
    return y + sum(y > r for r in ROWS)


def grow(cells, w, h, cols=COLS, rows_=ROWS):
    """Un calque (liste ligne par ligne) agrandi : colonnes puis rangées dupliquées."""
    rows = [cells[y * w:(y + 1) * w] for y in range(h)]
    out_rows = []
    for y, row in enumerate(rows):
        new = []
        for x, c in enumerate(row):
            new.append(c)
            if x in cols:
                new.append(c)
        out_rows.append(new)
        if y in rows_:
            out_rows.append(list(new))
    return [c for r in out_rows for c in r]


def step2(m):
    """35 x 29 -> 36 x 30, et la bande d'herbe des sorties."""
    w, h = m['width'], m['height']
    for layer in m['layers']:
        m['layers'][layer] = grow(m['layers'][layer], w, h, COLS2, ROWS2)
    m['solid'] = grow(m['solid'], w, h, COLS2, ROWS2)
    m['width'], m['height'] = W, H = w + 1, h + 1
    nx2 = lambda x: x + (x > 32)
    ny2 = lambda y: y + (y > 17)
    m['spawn'] = {**m['spawn'], 'x': nx2(m['spawn']['x']), 'y': ny2(m['spawn']['y'])}
    st = m.get('studio')
    if st:
        for el in st.get('elements', []):
            el['prev'] = [[ny2(i // w) * W + nx2(i % w), v] for i, v in el.get('prev', [])]
            el['x'], el['y'] = nx2(el['x']), ny2(el['y'])
        st['forest'] = [[nx2(x), ny2(y)] for x, y in st.get('forest', [])]
        st['fence'] = [[nx2(x), ny2(y)] for x, y in st.get('fence', [])]
    # La bande d'herbe des sorties : la forêt de x 14 (hors carte de toute la bordure) devient de l'herbe.
    sheets = m['sheets']
    grass = sheets.index('dppt') * 100000 + 4
    for y in (0, 1, H - 2, H - 1):
        i = y * W + 14
        m['layers']['sol'][i] = grass
        m['layers']['decor'][i] = -1
        m['layers']['dessus'][i] = -1
        m['solid'][i] = 0
    return m


def main():
    m = json.loads(MAP.read_text())
    if (m['width'], m['height']) == (35, 29):
        MAP.write_text(json.dumps(step2(m), ensure_ascii=False))
        print('35 x 29 -> 36 x 30')
        return
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
