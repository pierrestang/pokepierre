"""Intérieurs Gen 4 du Prytanée (internat) et de Bordeaux (agence, appartements, KEDGE, stade).

Voir scripts/interieurs_plans.py (format des plans) et scripts/build_interiors.py. Les positions des PNJ, objets,
escaliers et tapis de sortie sont celles de src/data/maps/interiors.js ; les décors dessinés dans le code (drapeaux,
compteur électrique, gobelets, haltères) gardent leur place libre sur le mur ou au sol.
"""
import math

import numpy as np
from PIL import Image, ImageDraw

import interieurs_plans as core
from interieurs_plans import T, crop, isolate, meuble, sheet, WALLS  # noqa: F401


# ---------- Outils ----------
def mm(i, w=None, align='bottom'):
    """Meuble n° i de g4-int-meubles, détouré au plus juste, centré sur `w` cases (le moins possible sinon)."""
    img = isolate(meuble(i))
    img = img.crop(img.getbbox())
    tw, th = w or math.ceil(img.width / T), math.ceil(img.height / T)
    out = Image.new('RGBA', (tw * T, th * T))
    out.alpha_composite(img, ((tw * T - img.width) // 2, out.height - img.height if align == 'bottom' else 0))
    return out


def piece(img, box, w, top=4, h=2):
    """Un morceau (x, y, l, h en px) d'une image, accroché au mur : centré sur `w` cases, son haut à `top` px du haut
    d'une image de `h` cases (pied du meuble sur la plinthe : y = 1)."""
    part = img.crop((box[0], box[1], box[0] + box[2], box[1] + box[3]))
    part = part.crop(part.getbbox())
    out = Image.new('RGBA', (w * T, h * T))
    out.alpha_composite(part, ((w * T - part.width) // 2, top))
    return out


def on_wall(img, w, top=6):
    """Un meuble mural (fenêtre, tableau) sur les deux rangées du mur."""
    img = img.crop(img.getbbox())
    out = Image.new('RGBA', (w * T, 2 * T))
    out.alpha_composite(img, ((w * T - img.width) // 2, top))
    return out


def centered(img, w):
    """Image centrée en largeur sur `w` cases (un escalier d'une case dessiné un peu plus large)."""
    img = img.crop(img.getbbox())
    out = Image.new('RGBA', (w * T, math.ceil(img.height / T) * T))
    out.alpha_composite(img, ((w * T - img.width) // 2, out.height - img.height))
    return out


DECO = lambda: meuble(309)          # carte, petit tableau, marine, notes, panneau suspendu, plante, boîtier


def stairs_down():
    """Cage d'escalier qui descend : la porte de l'escalier (283), les marches assombries et inversées."""
    img = isolate(meuble(283))
    img = img.crop(img.getbbox())
    a = np.array(img).astype(float)
    inner = a[6:-2, 3:-3].copy()
    inner = inner[::-1]
    inner[..., :3] *= np.linspace(0.35, 0.8, inner.shape[0])[:, None, None]
    a[6:-2, 3:-3] = inner
    return centered(Image.fromarray(a.clip(0, 255).astype(np.uint8)), 3)


def stadium_seats():
    """Gradins : deux sièges bleus par case sur une marche de béton (deux rangées de case : dossier, assise)."""
    img = Image.new('RGBA', (T, T), (150, 150, 158, 255))
    d = ImageDraw.Draw(img)
    d.rectangle((0, 14, 15, 15), fill=(110, 110, 120, 255))
    for x in (1, 9):
        d.rectangle((x, 2, x + 5, 9), fill=(40, 80, 168, 255))
        d.rectangle((x, 2, x + 5, 3), fill=(88, 136, 224, 255))
        d.rectangle((x - 1, 9, x + 6, 12), fill=(52, 100, 192, 255))
        d.line((x - 1, 12, x + 6, 12), fill=(28, 52, 110, 255))
    return img


def podium():
    """Estrade de la remise des diplômes : plancher rouge bordé d'or, deux cases sur deux (on monte dessus)."""
    img = Image.new('RGBA', (2 * T, 2 * T))
    d = ImageDraw.Draw(img)
    d.rectangle((0, 0, 31, 31), fill=(150, 40, 48, 255))
    d.rectangle((0, 0, 31, 31), outline=(214, 172, 64, 255))
    d.rectangle((1, 1, 30, 30), outline=(110, 26, 34, 255))
    for y in (8, 16, 24):
        d.line((2, y, 29, y), fill=(132, 34, 42, 255))
    return img


def lectern():
    """Pupitre du directeur (bois, micro)."""
    img = Image.new('RGBA', (T, 2 * T))
    d = ImageDraw.Draw(img)
    d.rectangle((3, 14, 12, 29), fill=(120, 76, 40, 255), outline=(60, 36, 20, 255))
    d.rectangle((1, 10, 14, 15), fill=(156, 104, 56, 255), outline=(60, 36, 20, 255))
    d.line((8, 3, 8, 10), fill=(50, 50, 56, 255))
    d.ellipse((6, 1, 10, 5), fill=(70, 70, 78, 255))
    return img


def banner(color):
    """Bannière accrochée au mur du stade."""
    img = Image.new('RGBA', (T, T))
    d = ImageDraw.Draw(img)
    d.line((1, 1, 14, 1), fill=(90, 70, 40, 255))
    d.polygon([(3, 2), (12, 2), (12, 13), (7, 10), (3, 13)], fill=color, outline=(40, 30, 30, 255))
    d.line((5, 5, 10, 5), fill=(240, 220, 120, 255))
    return img


def exercise_mat():
    """Tapis de sol bleu (salle de sport)."""
    img = Image.new('RGBA', (2 * T, T))
    d = ImageDraw.Draw(img)
    d.rounded_rectangle((1, 3, 30, 13), 2, fill=(64, 112, 184, 255), outline=(36, 64, 116, 255))
    for x in (8, 16, 24):
        d.line((x, 4, x, 12), fill=(52, 92, 156, 255))
    return img


def weight_bench():
    """Banc de musculation avec sa barre."""
    img = Image.new('RGBA', (2 * T, T))
    d = ImageDraw.Draw(img)
    d.rectangle((6, 6, 25, 10), fill=(40, 40, 48, 255))
    d.rectangle((7, 6, 24, 8), fill=(200, 48, 48, 255))
    d.line((8, 11, 8, 14), fill=(60, 60, 68, 255))
    d.line((23, 11, 23, 14), fill=(60, 60, 68, 255))
    d.line((2, 3, 29, 3), fill=(160, 160, 170, 255))
    for x in (2, 27):
        d.rectangle((x, 0, x + 2, 6), fill=(50, 50, 58, 255))
    return img


# Pelouse du stade : l'herbe DPPt, tondue en bandes de deux cases.
_old_floor = core.floor


def _floor(name):
    if name == 'pb-pelouse':
        g = crop('dppt', 4, 0)
        a = np.array(g).astype(float)
        a[..., :3] *= 0.9
        dark = Image.fromarray(a.clip(0, 255).astype(np.uint8))
        return [[g, g, dark, dark]]
    return _old_floor(name)


core.floor = _floor
WALLS['pb-beton'] = lambda: core.dppt_wall(165)


# ---------- Meubles ----------
ITEMS = {
    'pb-lit-metal': {'img': lambda: mm(156, 2), 'solid': 2},
    'pb-lit-bleu': {'img': lambda: mm(155, 2), 'solid': 2},
    'pb-lit-rose': {'img': lambda: mm(157, 2), 'solid': 2},
    'pb-casier-gris': {'img': lambda: mm(47), 'solid': 1},
    'pb-casier-gris-2': {'img': lambda: mm(49), 'solid': 1},
    'pb-casier-vert': {'img': lambda: mm(48), 'solid': 1},
    'pb-armoire-metal': {'img': lambda: mm(47), 'solid': 2},
    'pb-vitrine': {'img': lambda: mm(208, 2), 'solid': 1},
    'pb-bibliotheque': {'img': lambda: mm(138, 2), 'solid': 1},
    'pb-bibliotheque-bois': {'img': lambda: mm(226, 2), 'solid': 1},
    'pb-etagere': {'img': lambda: mm(151, 2), 'solid': 2},
    'pb-etagere-livres': {'img': lambda: mm(124, 2), 'solid': 2},
    'pb-accueil': {'img': lambda: mm(116, 3), 'solid': 1},
    'pb-bureau-bois': {'img': lambda: mm(115, 3), 'solid': 1},
    'pb-bureau-gris': {'img': lambda: mm(282, 3), 'solid': 1},
    'pb-bureau': {'img': lambda: mm(4, 2), 'solid': 1},
    'pb-bureau-pc': {'img': lambda: mm(225, 2), 'solid': 2},
    'pb-pupitre': {'img': lambda: mm(285, 2), 'solid': 1},
    'pb-plante': {'img': lambda: mm(27), 'solid': 1},
    'pb-grande-plante': {'img': lambda: mm(34), 'solid': 1},
    'pb-fenetre': {'img': lambda: on_wall(meuble(20), 2, 3), 'solid': 0},
    'pb-tableau-vert': {'img': lambda: on_wall(meuble(268), 4, 4), 'solid': 0},
    'pb-carte': {'img': lambda: piece(DECO(), (0, 8, 32, 21), 2), 'solid': 0},
    'pb-marine': {'img': lambda: piece(DECO(), (48, 6, 32, 24), 2), 'solid': 0},
    'pb-petit-tableau': {'img': lambda: piece(DECO(), (32, 8, 16, 21), 1), 'solid': 0},
    'pb-notes': {'img': lambda: piece(DECO(), (80, 8, 16, 22), 1), 'solid': 0},
    'pb-panneau': {'img': lambda: piece(DECO(), (96, 4, 16, 25), 1, top=2), 'solid': 0},
    'pb-frigo': {'img': lambda: mm(51), 'solid': 1},
    'pb-cuisine': {'img': lambda: mm(277, 3), 'solid': 1},
    'pb-tele': {'img': lambda: mm(264, 2), 'solid': 1},
    'pb-canape': {'img': lambda: mm(17, 3), 'solid': 1},
    'pb-tapis-bleu': {'img': lambda: mm(153), 'solid': 0, 'flat': True},
    'pb-tapis-rouge': {'img': lambda: mm(6, 2), 'solid': 0, 'flat': True},
    'pb-chaise': {'img': lambda: mm(161), 'solid': 1},
    'pb-tapis-sport': {'img': exercise_mat, 'solid': 0, 'flat': True},
    'pb-banc-muscu': {'img': weight_bench, 'solid': 1},
    'pb-escalier-monte': {'img': lambda: centered(isolate(meuble(283)), 3), 'solid': 0, 'flat': True},
    'pb-escalier-descend': {'img': stairs_down, 'solid': 0, 'flat': True},
    'pb-gradins': {'img': stadium_seats, 'solid': 1},
    'pb-podium': {'img': podium, 'solid': 0, 'flat': True},
    'pb-pupitre-orateur': {'img': lectern, 'solid': 1},
    'pb-banniere-rouge': {'img': lambda: banner((176, 36, 48, 255)), 'solid': 0},
    'pb-banniere-bleue': {'img': lambda: banner((40, 72, 160, 255)), 'solid': 0},
}


# ---------- Pièces ----------
PLANS = {
    # Prytanée — hall de l'internat : mur gris austère, dallage ; bibliothèque, tableau d'affichage, drapeau (dessiné
    # dans le code, en 3-4), fenêtre, deux casiers métalliques, vitrine des trophées, escalier qui monte en 11 ; accueil
    # du planton (bureau gris, il se tient derrière), deux étagères, deux plantes de part et d'autre de l'entrée.
    'dortoirHall': {
        'wall': 'pb-beton', 'floor': 'carrelage-gris',
        'items': [
            ['pb-bibliotheque', 0, 2], ['pb-panneau', 2, 1], ['pb-fenetre', 5, 1],
            ['pb-casier-gris', 7, 2], ['pb-casier-gris-2', 8, 2], ['pb-vitrine', 9, 2],
            ['escalier-monte-gris', 11, 2],
            ['pb-etagere', 0, 5], ['pb-etagere', 10, 5],
            ['pb-bureau-gris', 4, 4],
            ['pb-plante', 0, 7], ['pb-plante', 11, 7],
        ],
    },
    # Prytanée — la chambre (1er étage) : quatre lits métalliques alignés contre le mur, fenêtres et tableau d'affichage,
    # armoires métalliques par paires, le bureau commun ; escalier qui monte (11) et qui descend (13).
    'dortoir': {
        'wall': 'olive', 'floor': 'parquet-clair',
        'items': [
            ['pb-fenetre', 2, 1], ['pb-panneau', 5, 1], ['pb-fenetre', 7, 1],
            ['pb-lit-metal', 0, 3], ['pb-lit-metal', 3, 3], ['pb-lit-metal', 6, 3], ['pb-lit-metal', 9, 3],
            ['escalier-monte-gris', 11, 2], ['escalier-descend-gris', 13, 2],
            ['pb-armoire-metal', 0, 6], ['pb-armoire-metal', 1, 6], ['pb-armoire-metal', 12, 6],
            ['pb-armoire-metal', 13, 6],
            ['pb-bureau', 2, 5],
        ],
    },
    # Prytanée — dortoir des terminales (2e étage) : même ordre, une marine au mur ; escalier qui descend (13).
    'dortoirEtage2': {
        'wall': 'olive', 'floor': 'parquet-clair',
        'items': [
            ['pb-fenetre', 2, 1], ['pb-marine', 7, 1], ['pb-fenetre', 10, 1],
            ['pb-lit-metal', 0, 3], ['pb-lit-metal', 3, 3], ['pb-lit-metal', 6, 3], ['pb-lit-metal', 9, 3],
            ['escalier-descend-gris', 13, 2],
            ['pb-armoire-metal', 0, 6], ['pb-armoire-metal', 1, 6], ['pb-armoire-metal', 12, 6],
            ['pb-armoire-metal', 13, 6],
        ],
    },
    # Bordeaux — l'agence immobilière : murs beiges, carrelage clair ; classeur bleu et casier, fenêtre, étagère à
    # dossiers ; le bureau de l'agent face à l'entrée ; annonces au mur, une plante.
    'agence': {
        'wall': 'beige', 'floor': 'carrelage',
        'items': [
            ['pb-casier-vert', 0, 2], ['pb-casier-gris', 1, 2], ['pb-fenetre', 3, 1], ['pb-notes', 5, 1],
            ['pb-bibliotheque-bois', 6, 2],
            ['pb-bureau-bois', 2, 3], ['pb-grande-plante', 7, 7],
        ],
    },
    # Bordeaux — l'appartement d'Ousmane et Pierre : deux lits (Ousmane dort dans celui de gauche, le matin après la
    # soirée), coin cuisine et frigo, le compteur au mur en 5 (dessiné dans le code, sa case devant reste libre),
    # bureau avec ordinateur, fenêtre et tableau ; un grand tapis au milieu du salon (la piste de la soirée).
    'appartement': {
        'wall': 'creme', 'floor': 'parquet-clair', 'npc_on_solid': ['ousmane-lit'],
        'items': [
            ['pb-tapis-bleu', 4, 7],
            ['pb-lit-bleu', 0, 3, {'bed': True}], ['pb-fenetre', 3, 1], ['pb-marine', 9, 1],
            ['pb-cuisine', 2, 2], ['pb-frigo', 6, 2],
            ['pb-bureau-pc', 7, 3], ['pb-lit-rose', 10, 3],
        ],
    },
    # Bordeaux — le studio de Paulfit, fan de musculation : mur gris, sol bleu ; lit, fenêtre, casiers ; tapis de sol et
    # banc de musculation (les haltères sont dessinés dans le code en 6-4 et 1-5).
    'studioPaulfit': {
        'wall': 'gris', 'floor': 'metal', 'block': [[6, 4], [1, 5]],
        'items': [
            ['pb-lit-bleu', 0, 3], ['pb-fenetre', 3, 1], ['pb-casier-gris', 6, 2], ['pb-casier-vert', 7, 2],
            ['pb-tapis-sport', 2, 5], ['pb-banc-muscu', 5, 5],
        ],
    },
    # Bordeaux — l'appartement de Rémi : lit, bureau avec ordinateur ; le drapeau américain au mur (dessiné dans le
    # code en 3-4) ; une plante.
    'appartRemi': {
        'wall': 'bleu', 'floor': 'damier-bois',
        'items': [
            ['pb-lit-bleu', 0, 3], ['pb-bureau-pc', 6, 3], ['pb-plante', 5, 2],
        ],
    },
    # Bordeaux — KEDGE, la salle d'examen : école moderne (mur bleu-gris, sol gris) ; tableau vert, deux bibliothèques,
    # le bureau du professeur ; deux rangées de pupitres de part et d'autre de l'allée ; quatre plantes.
    'kedge': {
        'wall': 'bleu', 'floor': 'carrelage',
        'items': [
            ['pb-bibliotheque-bois', 0, 2], ['pb-tableau-vert', 4, 1], ['pb-bibliotheque-bois', 10, 2],
            ['pb-bureau-bois', 5, 3],
            ['pb-bureau', 1, 5], ['pb-bureau', 8, 5], ['pb-bureau', 1, 7], ['pb-bureau', 8, 7],
            ['pb-plante', 0, 6], ['pb-plante', 11, 6], ['pb-plante', 0, 8], ['pb-plante', 11, 8],
        ],
    },
    # Bordeaux — le stade, remise des diplômes : gradins bleus (rangées 1-2), bannières au mur, pelouse tondue en
    # bandes ; l'estrade rouge (on y monte, en 9-10 x 4-5) et le pupitre du directeur à côté.
    'stade': {
        'wall': 'pb-beton', 'floor': 'pb-pelouse', 'void': [],
        'items': [
            *[['pb-gradins', x, y] for x in range(1, 19) for y in (1, 2)],
            ['pb-podium', 9, 5],
            *[['pb-banniere-rouge' if x % 4 == 2 else 'pb-banniere-bleue', x, 0] for x in range(2, 18, 2)],
        ],
    },
}
