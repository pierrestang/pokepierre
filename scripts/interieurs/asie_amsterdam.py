"""Intérieurs Gen 4 : Hanoï, Amsterdam, New Delhi, Rajasthan (voir scripts/interieurs_plans.py)."""
import json

import numpy as np
from PIL import Image, ImageDraw

from interieurs_plans import T, V2, crop, dppt_wall, rect, stretch, WALLS


def mm(i, iso=True, width=None, align='bottom'):
    """Élément n° i de g4-int-meubles, détouré au plus juste (cases entières, posé en bas)."""
    c0, r0, c1, r1 = json.loads((V2 / 'g4-int-meubles.elements.json').read_text())['elements'][i]
    return rect('g4-int-meubles', c0 * T, r0 * T, (c1 - c0 + 1) * T, (r1 - r0 + 1) * T, align=align, iso=iso,
                width=width)


def recolour(img, ramp):
    """Recolore une image d'après sa luminosité, sur une rampe de couleurs (sombre -> claire)."""
    a = np.array(img.convert('RGBA')).astype(float)
    lum = (a[..., 0] * 0.3 + a[..., 1] * 0.59 + a[..., 2] * 0.11) / 255
    ramp = np.array(ramp, float)
    pos = np.clip(lum, 0, 0.999) * (len(ramp) - 1)
    lo = pos.astype(int)
    f = (pos - lo)[..., None]
    rgb = ramp[lo] * (1 - f) + ramp[np.minimum(lo + 1, len(ramp) - 1)] * f
    out = a.copy()
    out[..., :3] = rgb
    return Image.fromarray(out.astype(np.uint8))


# Laque rouge et or du temple : le mur à panneaux crème recoloré.
LAQUE = [(40, 8, 10), (90, 16, 18), (140, 26, 26), (172, 34, 32), (192, 44, 36), (206, 58, 42), (232, 182, 84)]


def laque_wall():
    face, plinthe = dppt_wall(235)
    return [[recolour(t, LAQUE) for t in face], [recolour(t, LAQUE) for t in plinthe]]


WALLS.update({
    'aa-laque': laque_wall,
    'aa-vitre': lambda: dppt_wall(150),           # bureaux vitrés (Corning)
    'aa-tente': lambda: dppt_wall(295),           # toile rayée de la tente
})

# Sols en plus (planche dppt-int, rangée de la case pleine).
from interieurs_plans import FLOORS  # noqa: E402
FLOORS.update({'aa-tapis': 8})


def chest():
    """Coffre de bois cerclé de laiton (2 cases), une fiole qui brille dessus."""
    img = Image.new('RGBA', (2 * T, 2 * T))
    d = ImageDraw.Draw(img)
    out, wood, light, brass = (52, 30, 18, 255), (132, 76, 40, 255), (176, 112, 60, 255), (220, 176, 70, 255)
    d.rectangle((2, 14, 29, 30), fill=out)
    d.rectangle((3, 15, 28, 21), fill=light)
    d.rectangle((3, 22, 28, 29), fill=wood)
    d.line((3, 22, 28, 22), fill=out)
    for x in (8, 23):
        d.rectangle((x, 15, x + 1, 29), fill=brass)
    d.rectangle((14, 21, 17, 25), fill=brass)
    d.point((15, 23), fill=out)
    # La fiole.
    d.rectangle((14, 6, 17, 13), fill=(60, 40, 90, 255))
    d.rectangle((15, 8, 16, 12), fill=(150, 100, 230, 255))
    d.rectangle((15, 4, 16, 5), fill=(170, 120, 70, 255))
    d.point((15, 9), fill=(240, 220, 255, 255))
    return img


def cushion(colour):
    """Coussin de sol (une case)."""
    img = Image.new('RGBA', (T, T))
    d = ImageDraw.Draw(img)
    dark = tuple(int(c * 0.55) for c in colour) + (255,)
    d.rounded_rectangle((1, 5, 14, 14), 3, fill=dark)
    d.rounded_rectangle((2, 5, 13, 12), 3, fill=colour + (255,))
    d.rectangle((6, 8, 9, 9), fill=(236, 200, 90, 255))
    return img


def brochures():
    """Présentoir à brochures (posé sur un comptoir)."""
    img = Image.new('RGBA', (T, T))
    d = ImageDraw.Draw(img)
    for i, c in enumerate([(70, 150, 220), (240, 180, 60), (90, 190, 120)]):
        x = 2 + i * 4
        d.rectangle((x, 6, x + 3, 14), fill=(40, 40, 50, 255))
        d.rectangle((x, 6, x + 2, 13), fill=c + (255,))
        d.line((x + 1, 8, x + 1, 9), fill=(255, 255, 255, 255))
    return img


def incense():
    """Brûle-parfum de laiton et ses bâtonnets (posé sur l'autel)."""
    img = Image.new('RGBA', (T, T))
    d = ImageDraw.Draw(img)
    d.rectangle((4, 10, 11, 14), fill=(110, 70, 20, 255))
    d.rectangle((5, 10, 10, 13), fill=(220, 170, 60, 255))
    d.line((5, 10, 10, 10), fill=(250, 220, 120, 255))
    for x, h in ((6, 3), (8, 1), (9, 4)):
        d.line((x, h, x, 9), fill=(150, 40, 30, 255))
        d.point((x, h), fill=(255, 150, 60, 255))
    return img


def laptop():
    """Ordinateur portable ouvert, sur un petit bureau (une case de haut, deux de dessin)."""
    desk = rect('jared-bateaux', 170, 1426, 14, 16)            # guéridon
    img = Image.new('RGBA', (T, 2 * T))
    img.alpha_composite(desk, (0, T))
    d = ImageDraw.Draw(img)
    d.rectangle((3, 12, 12, 19), fill=(40, 44, 56, 255))
    d.rectangle((4, 13, 11, 18), fill=(90, 170, 230, 255))
    d.line((5, 14, 9, 14), fill=(220, 240, 255, 255))
    d.rectangle((2, 19, 13, 21), fill=(170, 176, 190, 255))
    return img


def runner(n):
    """Tapis rouge en long : le petit tapis rayé allongé à n cases de haut."""
    img = mm(9).rotate(90, expand=True)
    return stretch(img, n).rotate(-90, expand=True)


ITEMS = {
    'aa-allee': {'img': lambda: runner(5), 'solid': 0, 'flat': True},
    'aa-pupitre-bois': {'img': lambda: stretch(mm(117), 2), 'solid': 1},
    'aa-lit-bleu': {'img': lambda: mm(155), 'solid': 2},
    'aa-lit-mauve': {'img': lambda: mm(156), 'solid': 2},
    'aa-lit-rose': {'img': lambda: mm(157), 'solid': 2},
    'aa-fenetre': {'img': lambda: mm(20), 'solid': 0},
    'aa-fenetre-arc': {'img': lambda: mm(19), 'solid': 0},
    'aa-cuisiniere': {'img': lambda: mm(285), 'solid': 1},
    'aa-cuisine': {'img': lambda: mm(286), 'solid': 1},
    'aa-frigo': {'img': lambda: mm(51), 'solid': 1},
    'aa-plante': {'img': lambda: mm(27), 'solid': 1},
    'aa-plante-pot': {'img': lambda: mm(34), 'solid': 1},
    'aa-palmier': {'img': lambda: mm(136), 'solid': 1},
    'aa-tableau-vert': {'img': lambda: mm(79), 'solid': 0},
    'aa-carte': {'img': lambda: mm(78), 'solid': 0},
    'aa-carte-bleue': {'img': lambda: rect('jesus-3', 0, 41 * T, 2 * T, 2 * T), 'solid': 0},
    'aa-plage': {'img': lambda: rect('jesus-3', 3 * T, 41 * T, 3 * T, 2 * T), 'solid': 0},
    'aa-affiche': {'img': lambda: rect('jesus-3', 5 * T, 41 * T, T, 2 * T), 'solid': 0},
    'aa-etagere-livres': {'img': lambda: mm(124), 'solid': 1},
    'aa-etagere-bleue': {'img': lambda: mm(126), 'solid': 1},
    'aa-bibliotheque': {'img': lambda: mm(226), 'solid': 1},
    'aa-comptoir-4': {'img': lambda: stretch(mm(115), 4), 'solid': 1},
    'aa-autel-4': {'img': lambda: stretch(mm(116), 4), 'solid': 1},
    'aa-accueil': {'img': lambda: mm(108, iso=False), 'solid': 1},
    'aa-ordi-bureau': {'img': lambda: mm(225), 'solid': 1},
    'aa-armoire-labo': {'img': lambda: mm(234), 'solid': 1},
    'aa-machine': {'img': lambda: mm(253), 'solid': 1},
    'aa-vitrail': {'img': lambda: mm(284), 'solid': 0},
    'aa-statue': {'img': lambda: mm(212), 'solid': 1},
    'aa-urne': {'img': lambda: mm(112), 'solid': 1},
    'aa-bougeoir': {'img': lambda: mm(91), 'solid': 1},
    'aa-tableau-noir': {'img': lambda: mm(268), 'solid': 0},
    'aa-bureau-prof': {'img': lambda: mm(118), 'solid': 1},
    'aa-pupitre': {'img': lambda: mm(4), 'solid': 1},
    'aa-table': {'img': lambda: mm(125), 'solid': 1},
    'aa-etagere-pots': {'img': lambda: mm(97), 'solid': 1},
    'aa-tapis-rouge': {'img': lambda: mm(6), 'solid': 0, 'flat': True},
    'aa-tapis-rouge-v': {'img': lambda: mm(9), 'solid': 0, 'flat': True},
    'aa-tapis-bleu': {'img': lambda: mm(154, iso=False), 'solid': 0, 'flat': True},
    'aa-coffre': {'img': chest, 'solid': 1},
    'aa-coussin-rouge': {'img': lambda: cushion((190, 50, 60)), 'solid': 0, 'flat': True},
    'aa-coussin-or': {'img': lambda: cushion((220, 150, 40)), 'solid': 0, 'flat': True},
    'aa-coussin-bleu': {'img': lambda: cushion((60, 90, 170)), 'solid': 0, 'flat': True},
    'aa-brochures': {'img': brochures, 'solid': 0, 'flat': True},
    'aa-encens': {'img': incense, 'solid': 0, 'flat': True},
    'aa-portable': {'img': laptop, 'solid': 1},
}

PLANS = {
    # Hanoï — la maison-tube : étroite et chaude (murs beiges, parquet en damier) ; le lit sous la fenêtre, la petite
    # cuisine au fond, deux plantes, un tapis rouge au milieu.
    'hanoiHome': {
        'wall': 'beige', 'floor': 'damier-bois',
        'items': [
            ['aa-fenetre', 2, 1], ['aa-tableau-vert', 6, 0],
            ['aa-lit-bleu', 0, 3], ['aa-cuisiniere', 4, 2],
            ['aa-plante', 0, 4], ['aa-plante', 7, 4],
            ['aa-tapis-rouge', 3, 4],
        ],
    },
    # Hanoï — l'agence de voyage : cartes du monde au mur, présentoirs de brochures (étagères), le comptoir et son
    # ordinateur, des affiches de plages.
    'travelAgency': {
        'wall': 'bleu', 'floor': 'carrelage',
        'items': [
            ['aa-etagere-bleue', 0, 2], ['aa-carte-bleue', 2, 1], ['aa-carte', 4, 0], ['aa-plage', 5, 1],
            ['aa-affiche', 7, 1], ['aa-etagere-livres', 8, 2],
            ['aa-comptoir-4', 3, 3], ['aa-brochures', 3, 3, {'dy': -8}], ['aa-brochures', 5, 3, {'dy': -8}],
            ['aa-plante-pot', 0, 5], ['aa-plante-pot', 9, 5],
        ],
    },
    # Hanoï — la pagode : laque rouge et or, vitrail au fond, l'autel doré et ses brûle-parfums, un tapis rouge de
    # l'entrée à l'autel, des plantes de part et d'autre.
    'temple': {
        'wall': 'aa-laque', 'floor': 'dalles',
        'items': [
            ['aa-vitrail', 4, 1],
            ['aa-plante', 0, 2], ['aa-autel-4', 3, 2],
            ['aa-encens', 3, 2, {'dy': -9}], ['aa-encens', 6, 2, {'dy': -9}],
            ['aa-bougeoir', 7, 2, {'solid': 0}], ['aa-plante', 9, 2],
            ['aa-allee', 4, 7], ['aa-allee', 5, 7],
            ['aa-palmier', 0, 5], ['aa-palmier', 9, 5],
            ['aa-plante-pot', 0, 7], ['aa-plante-pot', 9, 7],
        ],
    },
    # Amsterdam — Corning : bureaux vitrés, armoires de labo et machine au fond, l'accueil, six postes de travail.
    'corning': {
        'wall': 'aa-vitre', 'floor': 'carrelage-gris',
        'items': [
            ['aa-armoire-labo', 0, 2], ['aa-carte', 3, 0], ['aa-affiche', 6, 1], ['aa-machine', 10, 2],
            ['aa-accueil', 4, 3],
            *[['aa-ordi-bureau', x, y] for x in (0, 4, 8) for y in (5, 7)],
        ],
    },
    # Amsterdam — le coffee shop : boiseries, le comptoir et sa caisse, la machine, des étagères de bocaux ; une
    # table et des plantes en salle.
    'coffeeShop': {
        'wall': 'bois', 'floor': 'chevrons',
        'items': [
            ['comptoir-caisse', 0, 2], ['bureau-laiton', 3, 2], ['aa-frigo', 4, 2], ['aa-etagere-pots', 5, 2],
            ['aa-etagere-bleue', 6, 2],
            ['aa-plante', 0, 4], ['aa-table', 6, 4],
            ['aa-plante', 0, 6], ['aa-plante', 7, 6],
        ],
    },
    # Amsterdam — la maison commune : deux lits, le bureau et son ordinateur entre eux, l'ordinateur portable de
    # Pierre à droite (le mail), une plante.
    'maisonCommune': {
        'wall': 'creme', 'floor': 'parquet-clair',
        'items': [
            ['aa-affiche', 2, 1],
            ['aa-lit-bleu', 0, 3], ['aa-ordi-bureau', 3, 2], ['aa-lit-mauve', 6, 3],
            ['aa-plante', 0, 5], ['aa-portable', 7, 5],
            ['aa-tapis-bleu', 2, 5],
        ],
    },
    # New Delhi — l'université : murs jaunes, tableau vert, bibliothèques, le bureau du professeur, huit pupitres.
    'delhiUniversity': {
        'wall': 'jaune', 'floor': 'parquet',
        'items': [
            ['aa-bibliotheque', 0, 2], ['aa-tableau-noir', 4, 1], ['aa-bibliotheque', 10, 2],
            ['aa-bureau-prof', 5, 3],
            *[['aa-pupitre-bois', x, y] for x in (1, 4, 7, 10) for y in (5, 7)],
        ],
    },
    # Rajasthan — la tente : toile rayée, tapis orné, le coffre et la potion au fond, des bougeoirs de laiton, des
    # coussins.
    'tente': {
        'wall': 'aa-tente', 'floor': 'aa-tapis',
        'items': [
            ['aa-bougeoir', 0, 2], ['aa-coffre', 3, 2], ['aa-bougeoir', 7, 2],
            ['aa-coussin-rouge', 2, 3], ['aa-coussin-or', 5, 3], ['aa-coussin-bleu', 1, 4], ['aa-coussin-rouge', 6, 4],
            ['aa-bougeoir', 0, 5], ['aa-bougeoir', 7, 5],
        ],
    },
}
