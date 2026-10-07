"""Intérieurs Gen 4 de Montépilloy (grange de M. Bouly, maison de la famille, chambre des enfants, école) et du
collège Bonsecours (hall, couloir des casiers, salles de maths, de français et de sciences).

Ce que les planches Gen 4 n'ont pas (tonneaux, casiers, pupitres d'élèves, paillasses, panneaux de liège, bottes de
paille, pot de miel) est dessiné ici, dans leurs couleurs : contour sombre, deux tons et un reflet, ombre portée
semi-transparente en bas à droite, comme les meubles DPPt.
"""
import json

import numpy as np
from PIL import Image, ImageDraw

from interieurs_plans import T, V2, crop, rect, stretch, isolate, sheet  # noqa: F401

LINE = (56, 48, 48, 255)          # contour des meubles DPPt
SHADOW = (0, 0, 0, 70)


def _elements():
    return json.loads((V2 / 'g4-int-meubles.elements.json').read_text())['elements']


def me(i, **kw):
    """Élément n° i de g4-int-meubles, détouré au pixel (rect)."""
    c0, r0, c1, r1 = _elements()[i]
    return rect('g4-int-meubles', c0 * T, r0 * T, (c1 - c0 + 1) * T, (r1 - r0 + 1) * T, **kw)


def canvas(w, h):
    return Image.new('RGBA', (w * T, h * T))


def shadowed(img):
    """Ombre portée DPPt : le dessin décalé de (2, 2) en noir semi-transparent, sous lui."""
    a = np.array(img)
    sh = np.zeros_like(a)
    m = a[..., 3] > 0
    sh[2:, 2:][m[:-2, :-2]] = SHADOW
    out = Image.fromarray(sh)
    out.alpha_composite(img)
    return out


def recolor(img, dst_rgb, src_pred):
    """Les pixels qui répondent à src_pred(r, g, b) passent à la teinte de dst_rgb (même luminosité relative)."""
    a = np.array(img).astype(float)
    r, g, b = a[..., 0], a[..., 1], a[..., 2]
    sel = src_pred(r, g, b) & (a[..., 3] > 0)
    lum = (r + g + b) / 3 / 140
    for k, c in enumerate(dst_rgb):
        a[..., k][sel] = np.clip(c * lum[sel], 0, 255)
    return Image.fromarray(a.astype(np.uint8))


# ---------- Dessins ----------
def barrel():
    """Tonneau de bois cerclé (une case)."""
    img = Image.new('RGBA', (T, T))
    d = ImageDraw.Draw(img)
    d.rounded_rectangle((1, 1, 13, 14), 3, fill=LINE)
    d.rounded_rectangle((2, 2, 12, 13), 3, fill=(176, 112, 56, 255))
    for x in (4, 7, 10):
        d.line((x, 3, x, 12), fill=(140, 84, 40, 255))
    d.line((3, 3, 3, 12), fill=(212, 150, 88, 255))
    for y in (4, 10):
        d.line((2, y, 12, y), fill=(84, 80, 88, 255))
        d.line((2, y + 1, 12, y + 1), fill=(128, 124, 132, 255))
    d.ellipse((3, 1, 11, 4), fill=(120, 72, 36, 255), outline=LINE)
    return shadowed(img)


def produce_crate(kind):
    """Caisse de légumes ou de fruits (caisses du marché de la bibliothèque Gen 4, g4-mobilier)."""
    if kind == 'tomates':
        return rect('g4-mobilier', 4, 1952, 16, 18, iso=False)
    if kind == 'oranges':
        return rect('g4-mobilier', 4, 1968, 16, 17, iso=False)
    if kind == 'salades':
        tom = rect('g4-mobilier', 4, 1952, 16, 18, iso=False)
        return recolor(tom, (96, 196, 72), lambda r, g, b: (r > g + 40) & (r > b + 40))
    raise KeyError(kind)


def honey_jar():
    img = Image.new('RGBA', (T, T))
    d = ImageDraw.Draw(img)
    d.rounded_rectangle((3, 4, 12, 14), 3, fill=LINE)
    d.rounded_rectangle((4, 5, 11, 13), 2, fill=(236, 168, 40, 255))
    d.line((5, 6, 5, 11), fill=(252, 220, 120, 255))
    d.rectangle((4, 2, 11, 4), fill=LINE)
    d.rectangle((5, 2, 10, 3), fill=(200, 64, 56, 255))
    d.rectangle((6, 8, 9, 10), fill=(248, 240, 216, 255))
    return shadowed(img)


def hay_bale():
    """Botte de paille (une case)."""
    img = Image.new('RGBA', (T, T))
    d = ImageDraw.Draw(img)
    d.rectangle((0, 3, 14, 14), fill=LINE)
    d.rectangle((1, 4, 13, 13), fill=(228, 196, 96, 255))
    d.rectangle((1, 4, 13, 6), fill=(244, 220, 136, 255))
    for x in range(2, 13, 3):
        d.line((x, 7, x + 1, 13), fill=(196, 160, 72, 255))
    for x in (4, 10):
        d.line((x, 4, x, 13), fill=(160, 104, 56, 255))
    return shadowed(img)


def straw():
    """Brins de paille par terre (à plat, on marche dessus)."""
    img = Image.new('RGBA', (T, T))
    d = ImageDraw.Draw(img)
    for (x, y, dx, dy) in [(2, 3, 4, 1), (8, 6, 3, -1), (4, 10, 4, 1), (11, 12, 3, 0), (1, 13, 3, -1)]:
        d.line((x, y, x + dx, y + dy), fill=(228, 196, 96, 220))
        d.point((x + dx, y + dy), fill=(196, 160, 72, 220))
    return img


def tools():
    """Outils posés sur l'établi (clé, marteau), à poser avec un décalage."""
    img = Image.new('RGBA', (2 * T, T))
    d = ImageDraw.Draw(img)
    d.line((3, 10, 11, 6), fill=LINE, width=3)
    d.line((3, 10, 11, 6), fill=(168, 172, 184, 255), width=1)
    d.ellipse((10, 4, 14, 8), fill=(168, 172, 184, 255), outline=LINE)
    d.rectangle((19, 5, 21, 12), fill=(150, 96, 48, 255), outline=LINE)
    d.rectangle((16, 3, 25, 6), fill=(112, 116, 128, 255), outline=LINE)
    return img


def locker(color=(96, 136, 200)):
    """Casier métallique du collège (une case de large, il monte sur le mur)."""
    img = Image.new('RGBA', (T, 2 * T))
    d = ImageDraw.Draw(img)
    r, g, b = color
    d.rectangle((0, 2, 15, 31), fill=LINE)
    d.rectangle((1, 3, 14, 30), fill=(r, g, b, 255))
    d.rectangle((1, 3, 14, 4), fill=(min(255, r + 48), min(255, g + 48), min(255, b + 48), 255))
    d.line((1, 3, 1, 30), fill=(min(255, r + 40), min(255, g + 40), min(255, b + 40), 255))
    d.line((14, 4, 14, 30), fill=(r - 36, g - 36, b - 36, 255))
    for y in (7, 9, 11):
        d.line((4, y, 11, y), fill=(r - 50, g - 50, b - 50, 255))
    d.rectangle((5, 14, 10, 16), fill=(240, 240, 232, 255))
    d.rectangle((11, 19, 12, 23), fill=(216, 216, 224, 255))
    d.rectangle((1, 28, 14, 30), fill=(r - 50, g - 50, b - 50, 255))
    return img


def school_desk(content='livres', wood=(212, 164, 104)):
    """Pupitre d'élève de deux cases : plateau de bois, pieds métalliques ; des livres ou des copies dessus."""
    img = Image.new('RGBA', (2 * T, 2 * T))
    d = ImageDraw.Draw(img)
    r, g, b = wood
    top = 14
    d.rectangle((1, top, 30, top + 9), fill=LINE)
    d.rectangle((2, top + 1, 29, top + 6), fill=(r, g, b, 255))
    d.line((2, top + 1, 29, top + 1), fill=(min(255, r + 30), min(255, g + 30), min(255, b + 30), 255))
    d.rectangle((2, top + 7, 29, top + 8), fill=(r - 60, g - 60, b - 60, 255))
    for x in (3, 27):
        d.rectangle((x, top + 9, x + 1, 31), fill=(120, 124, 136, 255))
        d.point((x, 31), fill=LINE)
    if content == 'livres':
        d.rectangle((6, top - 1, 13, top + 4), fill=LINE)
        d.rectangle((7, top, 12, top + 3), fill=(200, 72, 64, 255))
        d.rectangle((15, top, 22, top + 4), fill=LINE)
        d.rectangle((16, top + 1, 21, top + 3), fill=(72, 112, 200, 255))
    elif content == 'copies':
        d.rectangle((7, top, 14, top + 5), fill=(250, 250, 244, 255), outline=(176, 176, 168, 255))
        for y in (top + 2, top + 4):
            d.line((9, y, 13, y), fill=(120, 140, 200, 255))
        d.line((19, top + 1, 24, top + 4), fill=(232, 192, 48, 255), width=2)
    return shadowed(img)


def lab_bench(n=3):
    """Paillasse de sciences : plateau noir, caisson clair, évier et éprouvettes."""
    w = n * T
    img = Image.new('RGBA', (w, 2 * T))
    d = ImageDraw.Draw(img)
    top = 12
    d.rectangle((0, top, w - 2, 31), fill=LINE)
    d.rectangle((1, top + 1, w - 3, top + 7), fill=(64, 68, 80, 255))
    d.line((1, top + 1, w - 3, top + 1), fill=(104, 108, 124, 255))
    d.rectangle((1, top + 8, w - 3, 30), fill=(224, 224, 216, 255))
    for x in range(T, w - 2, T):
        d.line((x, top + 9, x, 30), fill=(176, 176, 168, 255))
        d.point((x - 3, top + 13), fill=(120, 120, 128, 255))
    d.rectangle((4, top + 3, 12, top + 6), fill=(168, 196, 220, 255), outline=(40, 44, 56, 255))
    d.line((8, top - 2, 8, top + 3), fill=(176, 180, 192, 255))
    # Porte-éprouvettes.
    x0 = w - 20
    d.rectangle((x0, top + 4, x0 + 13, top + 6), fill=(168, 112, 64, 255), outline=LINE)
    for k, c in enumerate([(232, 72, 72), (72, 184, 104), (88, 136, 232), (240, 200, 64)]):
        x = x0 + 2 + k * 3
        d.rectangle((x, top - 3, x + 1, top + 4), fill=(236, 244, 248, 255))
        d.rectangle((x, top + 1, x + 1, top + 4), fill=(*c, 255))
    # Bécher.
    d.rectangle((x0 - 9, top, x0 - 4, top + 5), fill=(220, 236, 244, 255), outline=(120, 140, 160, 255))
    d.rectangle((x0 - 8, top + 3, x0 - 5, top + 4), fill=(120, 216, 176, 255))
    return shadowed(img)


def cork_board(w=1):
    """Panneau de liège avec des affiches punaisées (au mur)."""
    img = Image.new('RGBA', (w * T, T))
    d = ImageDraw.Draw(img)
    d.rectangle((0, 1, w * T - 1, 14), fill=(120, 72, 40, 255))
    d.rectangle((1, 2, w * T - 2, 13), fill=(200, 148, 92, 255))
    papers = [(2, 3, 6, 9, (250, 250, 244)), (8, 4, 13, 11, (252, 236, 150)), (4, 9, 9, 12, (200, 228, 250))]
    for k in range(w):
        for x0, y0, x1, y1, c in papers:
            d.rectangle((x0 + k * T, y0, x1 + k * T, y1), fill=(*c, 255))
            d.point(((x0 + x1) // 2 + k * T, y0), fill=(220, 56, 56, 255))
    return img


def poster(colors):
    """Petite affiche colorée (au mur)."""
    img = Image.new('RGBA', (T, T))
    d = ImageDraw.Draw(img)
    d.rectangle((3, 1, 12, 13), fill=LINE)
    d.rectangle((4, 2, 11, 12), fill=(250, 250, 240, 255))
    for k, c in enumerate(colors):
        d.rectangle((5, 3 + 3 * k, 10, 4 + 3 * k), fill=(*c, 255))
    return img


def wall_clock():
    return me(76)


def stairs_up():
    """Escalier qui monte, dans son cadre de bois (jesus-3), dessiné sur le mur au-dessus de la case η."""
    return rect('jesus-3', 3 * T, 21 * T - 4, 2 * T, 2 * T + 4, iso=False)


def stairs_down():
    """Ouverture dans le mur et marches qui descendent (jesus-3), au-dessus de la case ξ."""
    return rect('jesus-3', T, 20 * T, T + 8, 2 * T, iso=False)


# ---------- Meubles ----------
ITEMS = {
    # Grange.
    'mc-tonneau': {'img': barrel, 'solid': 1},
    'mc-caisse-tomates': {'img': lambda: produce_crate('tomates'), 'solid': 1},
    'mc-caisse-oranges': {'img': lambda: produce_crate('oranges'), 'solid': 1},
    'mc-caisse-salades': {'img': lambda: produce_crate('salades'), 'solid': 1},
    'mc-miel': {'img': honey_jar, 'solid': 1},
    'mc-paille': {'img': hay_bale, 'solid': 1},
    'mc-brins': {'img': straw, 'solid': 0, 'flat': True},
    'mc-outils': {'img': tools, 'solid': 0, 'flat': True},
    'mc-etabli': {'img': lambda: me(115), 'solid': 1},                    # longue table de bois brun
    # Fenêtres, cadres, horloge, affichage.
    'mc-fenetre': {'img': lambda: rect('jesus-3', 17, 297, 30, 16, iso=False), 'solid': 0},   # fenêtre (2 x 1), au mur
    'mc-fenetre-rideaux': {'img': lambda: me(184), 'solid': 0},           # fenêtre à rideaux (2 x 2)
    'mc-fenetre-petite': {'img': lambda: rect('jesus-3', 0, 288, 16, 11, iso=False), 'solid': 0},
    'mc-vitrine': {'img': lambda: me(20), 'solid': 1},                     # vitrine à deux étagères (2 x 2)
    'mc-carte-monde': {'img': lambda: rect('jesus-3', 0, 664, 32, 20, iso=False), 'solid': 0},
    'mc-tableau-paysage': {'img': lambda: rect('jesus-3', 48, 664, 33, 20, iso=False), 'solid': 0},
    'mc-cadre': {'img': lambda: rect('jesus-3', 32, 664, 16, 20, iso=False), 'solid': 0},
    'mc-note': {'img': lambda: rect('jesus-3', 80, 658, 16, 26, iso=False), 'solid': 0},
    'mc-liege': {'img': cork_board, 'solid': 0},
    'mc-liege-2': {'img': lambda: cork_board(2), 'solid': 0},
    'mc-affiche-a': {'img': lambda: poster([(220, 80, 72), (72, 128, 220), (88, 184, 96)]), 'solid': 0},
    'mc-affiche-b': {'img': lambda: poster([(240, 192, 56), (200, 96, 200), (72, 184, 200)]), 'solid': 0},
    'mc-horloge': {'img': wall_clock, 'solid': 0},
    # Maison.
    'mc-cuisine': {'img': lambda: me(277), 'solid': 1},                  # évier, plaques et placards (3 x 2)
    'mc-frigo': {'img': lambda: me(51), 'solid': 1},
    'mc-meuble-tele': {'img': lambda: me(99), 'solid': 1},
    'mc-tele': {'img': lambda: me(45), 'solid': 0, 'flat': True},
    'mc-table-4': {'img': lambda: stretch(me(125), 4), 'solid': 2},
    'mc-chaise': {'img': lambda: me(14), 'solid': 0, 'flat': True},
    'mc-arbuste': {'img': lambda: me(27), 'solid': 2},                    # petit arbre en pot (1 x 2)
    'mc-arbre-pot': {'img': lambda: me(34), 'solid': 2},                  # arbre en pot rose (1 x 3)
    'mc-plante': {'img': lambda: me(306), 'solid': 1},
    'mc-plante-2': {'img': lambda: me(308), 'solid': 1},
    'mc-tapis-bleu': {'img': lambda: me(153), 'solid': 0, 'flat': True},
    'mc-tapis-rouge': {'img': lambda: me(9), 'solid': 0, 'flat': True},
    'mc-lit-bleu': {'img': lambda: me(155), 'solid': 2},
    'mc-lit-ciel': {'img': lambda: me(156), 'solid': 2},
    'mc-lit-rose': {'img': lambda: me(157), 'solid': 2},
    'mc-lit-blanc': {'img': lambda: me(158), 'solid': 2},
    'mc-bibliotheque': {'img': lambda: me(124), 'solid': 2},             # bibliothèque basse (2 x 2)
    'mc-bibliotheque-haute': {'img': lambda: me(137), 'solid': 1},       # haute, contre le mur (2 x 3)
    'mc-bibliotheque-verte': {'img': lambda: me(141), 'solid': 2},
    'mc-bibliotheque-bois': {'img': lambda: me(226), 'solid': 1},
    'mc-escalier-monte': {'img': stairs_up, 'solid': 0},
    'mc-escalier-descend': {'img': stairs_down, 'solid': 0},
    # École et collège.
    'mc-tableau-vert': {'img': lambda: me(268), 'solid': 0},             # tableau vert (4 x 2), au mur
    'mc-tableau-vert-dessin': {'img': lambda: me(269), 'solid': 0},
    'mc-tableau-vert-2': {'img': lambda: me(270), 'solid': 0},
    'mc-tableau-vert-3': {'img': lambda: me(271), 'solid': 0},
    'mc-bureau-prof': {'img': lambda: me(115), 'solid': 1},
    'mc-pupitre-livres': {'img': lambda: school_desk('livres'), 'solid': 1},
    'mc-pupitre-copies': {'img': lambda: school_desk('copies'), 'solid': 1},
    'mc-pupitre-bleu': {'img': lambda: school_desk('livres', (120, 168, 224)), 'solid': 1},
    'mc-pupitre-vert': {'img': lambda: school_desk('copies', (136, 200, 120)), 'solid': 1},
    'mc-pupitre-rouge': {'img': lambda: school_desk('livres', (232, 136, 120)), 'solid': 1},
    'mc-pupitre-jaune': {'img': lambda: school_desk('copies', (236, 204, 104)), 'solid': 1},
    'mc-accueil': {'img': lambda: stretch(me(108, align='top'), 3), 'solid_top': 1},   # comptoir d'accueil (3 x 1, vu de face)
    'mc-casier': {'img': locker, 'solid': 1},
    'mc-casier-vert': {'img': lambda: locker((96, 176, 136)), 'solid': 1},
    'mc-casier-rouge': {'img': lambda: locker((208, 104, 96)), 'solid': 1},
    'mc-armoire': {'img': lambda: me(35), 'solid': 1},                   # meuble à tiroirs (1 x 2)
    'mc-armoire-grise': {'img': lambda: me(49), 'solid': 1},             # armoire métallique (1 x 3)
    'mc-paillasse': {'img': lab_bench, 'solid': 1},
    'mc-vitrine-labo': {'img': lambda: me(46), 'solid': 1},              # vitrine blanche (1 x 3)
    'mc-vitrine-verte': {'img': lambda: me(208), 'solid': 1},            # vitrine du labo (2 x 3)
    'mc-machine': {'img': lambda: me(235), 'solid': 1},                  # appareil de mesure
}


# ---------- Pièces ----------
PLANS = {
    # Grange de M. Bouly : murs de planches, plancher clair, paille par terre ; l'établi et ses outils sous la
    # fenêtre, les caisses de salades et d'oranges, les tonneaux de grain au fond à droite (celui du coin cache la pièce
    # de tracteur), les tonneaux de cidre à gauche, la caisse de tomates et le pot de miel.
    'boulyBarn': {
        'wall': 'bois', 'floor': 'parquet-clair', 'mat': 'rouge',
        'items': [
            ['mc-fenetre', 3, 0], ['mc-liege', 6, 0], ['mc-horloge', 6, 1, {'dy': -2}],
            ['mc-etabli', 0, 2], ['mc-outils', 0, 2, {'dy': -9}],
            ['mc-caisse-salades', 5, 2], ['mc-caisse-oranges', 6, 2],
            ['mc-tonneau', 7, 2], ['mc-tonneau', 8, 2], ['mc-tonneau', 8, 3],
            ['mc-tonneau', 0, 4], ['mc-tonneau', 0, 5],
            ['mc-caisse-tomates', 6, 5], ['mc-miel', 7, 5],
            ['mc-brins', 2, 4], ['mc-brins', 5, 6], ['mc-brins', 7, 7], ['mc-brins', 3, 3], ['mc-brins', 1, 7],
        ],
    },
    # Maison de Montépilloy : cuisine et frigo à gauche, fenêtre, la télé sur son meuble, la table du dîner au milieu
    # (Papa et Maman au-dessus, Jean à droite), deux arbustes en pot, l'escalier qui monte en haut à droite.
    'montHouse': {
        'wall': 'beige', 'floor': 'damier-bois',
        'items': [
            ['mc-cuisine', 0, 2], ['mc-fenetre-rideaux', 4, 1], ['mc-frigo', 6, 2],
            ['mc-meuble-tele', 7, 2], ['mc-tele', 7, 1, {'dy': -1}], ['mc-cadre', 2, 1, {'dy': -2}],
            ['mc-escalier-monte', 8, 1],
            ['mc-tapis-bleu', 3, 6], ['mc-table-4', 3, 5],
            ['mc-arbuste', 0, 6], ['mc-arbuste', 9, 6],
        ],
    },
    # Chambre des enfants : quatre lits de couleurs contre le mur, une fenêtre et un tableau entre eux, une plante et
    # la bibliothèque en bas ; l'escalier qui descend en haut à droite.
    'montHouseUp': {
        'wall': 'creme', 'floor': 'parquet',
        'items': [
            ['mc-lit-bleu', 0, 3], ['mc-lit-ciel', 3, 3], ['mc-lit-rose', 6, 3], ['mc-lit-blanc', 9, 3],
            ['mc-fenetre-petite', 2, 0], ['mc-cadre', 8, 1, {'dy': -2}], ['mc-affiche-a', 5, 0], ['mc-affiche-b', 11, 0],
            ['mc-escalier-descend', 12, 1],
            ['mc-plante', 0, 5], ['mc-bibliotheque', 10, 6],
            ['mc-tapis-rouge', 5, 6],
        ],
    },
    # École de Montépilloy : salle de classe d'enfants, murs jaunes, tableau vert dessiné, bureau du maître, pupitres de
    # couleurs, carte du monde et affiches, deux arbustes près de la porte.
    'school': {
        'wall': 'jaune', 'floor': 'parquet-clair',
        'items': [
            ['mc-fenetre', 1, 0], ['mc-tableau-vert-dessin', 5, 1], ['mc-fenetre', 11, 0],
            ['mc-affiche-a', 3, 0], ['mc-affiche-b', 10, 0], ['mc-horloge', 9, 0],
            ['mc-bureau-prof', 5, 2],
            ['mc-pupitre-rouge', 1, 4], ['mc-pupitre-bleu', 4, 4], ['mc-pupitre-vert', 7, 4], ['mc-pupitre-jaune', 10, 4],
            ['mc-pupitre-bleu', 1, 6], ['mc-pupitre-jaune', 4, 6], ['mc-pupitre-rouge', 7, 6], ['mc-pupitre-vert', 10, 6],
            ['mc-arbuste', 0, 8], ['mc-arbuste', 13, 8],
        ],
    },
    # Collège Bonsecours, le hall : comptoir d'accueil de la principale au milieu, panneaux de liège, bibliothèque,
    # fenêtre, trois casiers, deux vitrines à livres sur les côtés, arbres en pot à l'entrée ; un escalier qui monte à
    # chaque bout.
    'bonsecours': {
        'wall': 'menthe', 'floor': 'carrelage',
        'items': [
            ['mc-escalier-monte', 0, 1], ['mc-escalier-monte', 12, 1],
            ['mc-bibliotheque-haute', 2, 2], ['mc-liege', 4, 1, {'dy': -6}], ['mc-fenetre', 6, 0],
            ['mc-casier', 8, 2], ['mc-casier-vert', 9, 2], ['mc-casier-rouge', 10, 2], ['mc-liege', 11, 1, {'dy': -6}],
            ['mc-accueil', 4, 4],
            ['mc-bibliotheque-verte', 0, 5], ['mc-bibliotheque-verte', 12, 5],
            ['mc-arbre-pot', 0, 8], ['mc-arbre-pot', 13, 8],
        ],
    },
    # Le couloir des casiers : une rangée de casiers de couleurs, l'armoire du surveillant, des fenêtres et un panneau
    # d'affichage ; escalier qui monte à gauche, qui descend à droite.
    'bonsecoursCasiers': {
        'wall': 'gris', 'floor': 'carrelage-gris', 'mat': None,
        'items': [
            ['mc-escalier-monte', 0, 1], ['mc-fenetre-petite', 2, 0], ['mc-fenetre-petite', 3, 0],
            ['mc-casier', 4, 2], ['mc-casier-vert', 5, 2], ['mc-casier', 6, 2], ['mc-casier-rouge', 7, 2],
            ['mc-casier', 8, 2], ['mc-casier-vert', 9, 2],
            ['mc-liege', 10, 1, {'dy': -6}], ['mc-armoire', 11, 2], ['mc-fenetre-petite', 12, 0],
            ['mc-escalier-descend', 13, 1],
            ['mc-plante', 0, 5], ['mc-plante', 13, 5],
        ],
    },
    # Salle de maths : tableau vert couvert d'équations, bureau du professeur, quatre rangées de pupitres, fenêtres,
    # horloge et affiches ; escaliers aux deux bouts.
    'bonsecoursMaths': {
        'wall': 'creme', 'floor': 'carrelage',
        'items': [
            ['mc-escalier-monte', 0, 1], ['mc-fenetre', 2, 0], ['mc-tableau-vert', 5, 1], ['mc-horloge', 9, 0],
            ['mc-fenetre', 10, 0], ['mc-escalier-descend', 13, 1],
            ['mc-bureau-prof', 6, 2],
            ['mc-pupitre-livres', 1, 4], ['mc-pupitre-copies', 4, 4], ['mc-pupitre-livres', 7, 4], ['mc-pupitre-copies', 10, 4],
            ['mc-pupitre-copies', 1, 6], ['mc-pupitre-livres', 4, 6], ['mc-pupitre-copies', 7, 6], ['mc-pupitre-livres', 10, 6],
            ['mc-arbuste', 0, 8], ['mc-arbuste', 13, 8],
        ],
    },
    # Salle de français : bibliothèques au mur de chaque côté du tableau, tableau vert, bureau, pupitres, plantes.
    'bonsecoursFrancais': {
        'wall': 'bibliotheque', 'floor': 'parquet',
        'items': [
            ['mc-bibliotheque', 0, 1], ['mc-bibliotheque', 2, 1], ['mc-tableau-vert-2', 5, 1],
            ['mc-bibliotheque', 9, 1], ['mc-bibliotheque', 11, 1], ['mc-escalier-descend', 13, 1],
            ['mc-bureau-prof', 6, 2],
            ['mc-pupitre-copies', 1, 4], ['mc-pupitre-livres', 4, 4], ['mc-pupitre-copies', 7, 4], ['mc-pupitre-livres', 10, 4],
            ['mc-pupitre-livres', 1, 6], ['mc-pupitre-copies', 4, 6], ['mc-pupitre-livres', 7, 6], ['mc-pupitre-copies', 10, 6],
            ['mc-arbuste', 0, 8], ['mc-arbuste', 13, 8],
        ],
    },
    # Salle de sciences : paillasses noires avec évier et éprouvettes, vitrine du labo, tableau vert, appareils.
    'bonsecoursSciences': {
        'wall': 'gris', 'floor': 'carrelage-gris',
        'items': [
            ['mc-escalier-descend', 0, 1], ['mc-fenetre', 2, 0], ['mc-tableau-vert-3', 5, 1], ['mc-affiche-a', 10, 0],
            ['mc-affiche-b', 11, 0], ['mc-vitrine-labo', 13, 2],
            ['mc-bureau-prof', 6, 2],
            ['mc-paillasse', 2, 4], ['mc-paillasse', 8, 4], ['mc-paillasse', 2, 6], ['mc-paillasse', 8, 6],
            ['mc-arbuste', 0, 8], ['mc-arbuste', 13, 8],
        ],
    },
}
