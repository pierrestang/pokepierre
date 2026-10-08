"""Intérieurs du Prytanée (internat) et de Bordeaux (agence, appartements, KEDGE, stade), refaits à partir de vraies
pièces de HeartGold / SoulSilver (pack de SirMaIo, scripts/hgss_rooms.py) : chaque plan part d'une pièce du jeu
('hgss' : carte Tiled, x0, y0, largeur, hauteur), retouchée ('erase', 'paste') et meublée de morceaux du pack ('items').

Les grilles logiques et les positions (PNJ, objets, escaliers, tapis) sont dans src/data/maps/interiors.js ; les décors
de l'histoire dessinés par le jeu (drapeaux, compteur électrique, désordre de la soirée, haltères) y sont placés.
Crédit : « Intérieurs HGSS ripés et préparés par SirMaIo ».
"""
import math

import numpy as np
from PIL import Image

from interieurs_plans import T, isolate  # noqa: F401

import hgss_rooms as HG

SHEETS = HG.SHEETS


def pack_px(sheet, x, y, w, h, width=None):
    """Morceau d'une planche du pack (rectangle en px de la planche, cases de 32 px), ramené à l'échelle du jeu, détouré
    (le plus grand morceau d'un seul tenant) et posé en bas d'une image de cases entières (centré sur `width` cases)."""
    a = np.array(Image.open(SHEETS / f'{sheet}.png').convert('RGBA'))
    for key in ((240, 91, 161), (255, 245, 104), (255, 0, 255)):
        a[(a[..., 0] == key[0]) & (a[..., 1] == key[1]) & (a[..., 2] == key[2])] = 0
    img = Image.fromarray(a).crop((x, y, x + w, y + h))
    img = img.resize((max(1, img.width // 2), max(1, img.height // 2)), Image.NEAREST)
    img = isolate(img)
    img = img.crop(img.getbbox())
    tw = width or math.ceil(img.width / T)
    th = math.ceil(img.height / T)
    out = Image.new('RGBA', (tw * T, th * T))
    out.alpha_composite(img, ((tw * T - img.width) // 2, out.height - img.height))
    return out


def hgss_piece(name, x0, y0, w, h, layers=('decor', 'dessus')):
    """Un meuble pris dans une vraie pièce HGSS (calques décor et dessus, sans le sol), en image de w x h cases."""
    r = HG.room(name, x0, y0, w, h)
    out = Image.new('RGBA', (w * T, h * T))
    for k in layers:
        for i, stack in enumerate(r[k]):
            for t in stack:
                out.alpha_composite(t, ((i % w) * T, (i // w) * T))
    return out


def props_piece(name, x0, y0, w, h, flip=False):
    """Un meuble d'une vraie pièce HGSS, seulement ses calques d'objets (Props) : sans le mur ni le sol de la pièce
    d'origine (pas de fenêtre ou d'étagère « fantôme » derrière), retourné si `flip`."""
    r = HG.room(name, x0, y0, w, h, only=('Props',))
    out = Image.new('RGBA', (w * T, h * T))
    for k in ('decor', 'dessus'):
        for i, stack in enumerate(r[k]):
            for t in stack:
                out.alpha_composite(t, ((i % w) * T, (i // w) * T))
    return out.transpose(Image.FLIP_LEFT_RIGHT) if flip else out


def cat_int(element_id):
    """Un élément du catalogue des intérieurs du créateur (public/assets/v2/catalogue-int.json), en image."""
    import json
    v2 = SHEETS.parents[3] / 'public' / 'assets' / 'v2'
    cat = json.loads((v2 / 'catalogue-int.json').read_text())
    sheet = Image.open(v2 / 'catalogue-int.png').convert('RGBA')
    cols = cat['cols']
    e = next(x for x in cat['themes']['libre']['elements'] if x['id'] == element_id)
    out = Image.new('RGBA', (e['w'] * T, e['h'] * T))
    for j, row in enumerate(e['tiles']):
        for i, k in enumerate(row):
            if k >= 0:
                out.alpha_composite(sheet.crop(((k % cols) * T, (k // cols) * T, (k % cols + 1) * T, (k // cols + 1) * T)),
                                    (i * T, j * T))
    return out


def wood_posts(img):
    """Les montants vert d'eau de la commode des maisons de Johto repeints en bois (les tons de son plateau) : plus de
    liseré vert sur les côtés."""
    a = np.array(img.convert('RGBA')).astype(int)
    r, g, b, al = a[..., 0], a[..., 1], a[..., 2], a[..., 3]
    teal = (al > 0) & (g > r + 25) & (b > r)
    lum = (r + g + b) / 3
    wood = [(92, 64, 40), (128, 92, 56), (160, 120, 72), (188, 150, 96)]     # du plus sombre au plus clair
    for (lo, hi), c in zip(((0, 95), (95, 125), (125, 155), (155, 256)), wood):
        sel = teal & (lum >= lo) & (lum < hi)
        a[sel, 0], a[sel, 1], a[sel, 2] = c
    return Image.fromarray(a.astype(np.uint8))


NB = '001i_Newbark houses'
ITEMS = {
    # Lit du héros de Bourg Geon (planche de sa maison), une case et demie de large.
    'pb-lit': {'img': lambda: pack_px('i_Player-House', 184, 548, 72, 96, width=2), 'solid': 2},
    # Commode et bibliothèque des maisons ordinaires de Johto.
    'pb-commode': {'img': lambda: pack_px('i_Basic_Houses', 160, 700, 64, 72, width=2), 'solid': 1},
    'pb-bibliotheque': {'img': lambda: pack_px('i_Basic_Houses', 192, 160, 64, 64, width=2), 'solid': 1},
    # Bureau et ordinateur de la chambre du héros (Bourg Geon, 2e maison).
    'pb-bureau-pc': {'img': lambda: hgss_piece(NB, 15, 35, 2, 2), 'solid': 1},
    'pb-plante': {'img': lambda: hgss_piece(NB, 19, 41, 1, 2), 'solid': 1},
    # Prytanée (internat), réharmonisé : commode aux montants de bois, bureau et ordinateur sans le mur de la chambre
    # de Bourg Geon derrière, bibliothèque et tapis tressé du catalogue des intérieurs, escalier qui monte (celui des
    # maisons de Bourg Geon, retourné pour longer le mur de droite).
    'pb-commode-bois': {'img': lambda: wood_posts(pack_px('i_Basic_Houses', 160, 700, 64, 72, width=2)), 'solid': 1},
    'pb-bureau-seul': {'img': lambda: props_piece(NB, 15, 35, 2, 2), 'solid': 1},
    'pb-bibliotheque-basse': {'img': lambda: cat_int('bibliotheque-basse'), 'solid': 1},
    'pb-bibliotheque-haute': {'img': lambda: cat_int('bibliotheque-haute'), 'solid': 1},
    'pb-tapis-tresse': {'img': lambda: cat_int('tapis-tresse'), 'solid': 0, 'flat': True},
    'pb-escalier-monte-d': {'img': lambda: props_piece(NB, 10, 53, 2, 4, flip=True), 'solid': 0},
}


RT = '012i_Goldenrod radio tower'
GI = '012i_Goldenrod interiors'
DORM_CLEAR = (3, 4, 11, 7)            # les bureaux, chaises, la table et son tapis de l'étage de la Tour Radio


def dorm():
    """Un dortoir du Prytanée (les deux étages sont la même chambrée) : l'étage de bureaux de la Tour Radio vidé, quatre
    lits par paires contre le mur du fond, une commode de chaque côté (montants en bois), une bibliothèque basse sous
    l'escalier de gauche, le bureau et son ordinateur, un tapis tressé au milieu, une plante dans le coin."""
    return {
        'hgss': (RT, 10, 51, 14, 12),
        'erase': [DORM_CLEAR],
        # La moquette bleue de l'étage de bureaux (dans le sol, décalée d'une demi-case) : recouverte de sol nu (même
        # parité, six colonnes à gauche).
        'paste': [{'from': (RT, 10 + (x - 6 if x < 13 else x - 8), 51 + y, 1, 1), 'to': (x, y), 'sol': True,
                   'only': ('Floor',)} for x in range(7, 14) for y in range(4, 11)],
        'items': [
            ['pb-tapis-tresse', 6, 9],
            *[['pb-lit', x, 4, {'solid': 3}] for x in (3, 5, 8, 10)],   # x 2 et 7 restent libres (escalier, allée)
            ['pb-commode-bois', 12, 7, {'solid': 2}], ['pb-commode-bois', 0, 8, {'solid': 2}],
            ['pb-bibliotheque-basse', 0, 5, {'solid': 2}],
            ['pb-bureau-seul', 2, 8],
            ['pb-plante', 0, 11],
        ],
    }


PLANS = {
    # Prytanée — hall de l'internat : le hall du côté boutiques de la gare de Doublonville (murs verts, sol à damier,
    # plantes, escalier au fond à droite), sans ses lampadaires ; deux fenêtres remplacées par du mur pour le drapeau
    # (dessiné par le jeu), une bibliothèque et le bureau de l'accueil.
    # L'angle en pente du fond à droite et la cage d'escalier qui semblait descendre sont remplacés par du mur droit et
    # du sol à damier ; l'escalier qui MONTE aux chambres longe le mur de droite (celui des maisons de Bourg Geon,
    # retourné), sa marche du bas (η) en x 9-10, rangée 3, qu'on aborde par la gauche.
    'dortoirHall': {
        'hgss': (GI, 47, 24, 11, 10),
        'erase': [(2, 4, 1, 2), (6, 4, 1, 2), (2, 7, 1, 2), (6, 7, 1, 2), (6, 0, 2, 3), (8, 0, 3, 7)],
        'paste': [{'from': (GI, 47 + 5, 24, 1, 3), 'to': (6, 0), 'sol': True},
                  {'from': (GI, 47 + 5, 24, 1, 3), 'to': (7, 0), 'sol': True},
                  # Les lampadaires sont dans le sol : recouverts par du sol nu de même motif.
                  *[{'from': (GI, 47 + 4, 24 + y, 1, 2), 'to': (x, y), 'sol': True} for x in (2, 6) for y in (4, 7)],
                  # Mur droit (sans la pente) et sol à damier (même parité, colonnes 4-5 sans lampadaire) à la place de
                  # la cage.
                  *[{'from': (GI, 47 + 5, 24, 1, 3), 'to': (x, 0), 'sol': True, 'only': ('Floor', 'Wall')} for x in (8, 9, 10)],
                  *[{'from': (GI, 47 + 4 + x % 2, 24 + y, 1, 1), 'to': (x, y), 'sol': True, 'only': ('Floor',)}
                    for x in (8, 9, 10) for y in range(3, 7)]],
        'items': [['pb-bibliotheque-haute', 1, 3], ['pb-bureau-seul', 4, 3],
                  ['pb-escalier-monte-d', 9, 4, {'solid': [[1, 1], [1, 1], [0, 0], [1, 1]], 'flat': True}]],
    },
    # Prytanée — dortoir (1er étage) : l'escalier de gauche monte au 2e, l'encadrement de droite descend au hall.
    'dortoir': {**dorm(), 'free': [[1, 3], [12, 3]]},
    # Prytanée — 2e étage : exactement la même chambrée (même dessin) ; l'escalier de gauche redescend.
    'dortoirEtage2': {**dorm(), 'free': [[1, 3]]},
    # Bordeaux — l'agence : le bureau du directeur de la Tour Radio (moquette rouge, grand bureau, plantes), comme
    # l'utilisateur l'a retouché (sans l'escalier), raccourci de deux rangées (9 x 10) : les rangées vides sous l'escalier
    # et sous le grand bureau retirées, si bien que les meubles reculent vers le fond.
    'agence': {
        'hgss': (RT, 10, 31, 9, 10), 'mat': 'rouge',
        'splice': [{'from': (RT, 10, y, 9, 1), 'to': (0, j)} for j, y in enumerate((35, 36, 37, 38, 39, 41, 42), start=3)],
        'erase': [(0, 1, 2, 2), (0, 7, 1, 1), (8, 7, 1, 1)],                # l'escalier ; les plantes coupées
        'paste': [{'from': (RT, 12, 32, 1, 1), 'to': (x, 1), 'sol': True, 'only': ('Floor', 'Wall')} for x in (0, 1)]
                 + [{'from': (RT, 12, 33, 1, 1), 'to': (x, 2), 'sol': True, 'only': ('Floor',)} for x in (0, 1)],
    },
    # Bordeaux — l'appartement : le salon de la grande maison de Bourg Geon (cuisine, télé, coin repas, porte à droite),
    # deux lits à la place des plantes du bas (Ousmane à gauche, Pierre à droite).
    'appartement': {
        'hgss': (NB, 29, 10, 13, 13),
        'erase': [(0, 10, 1, 2), (11, 10, 1, 2)],
        'items': [['pb-lit', 0, 11, {'bed': True, 'solid': 3}], ['pb-lit', 10, 11, {'solid': 3}]],
        'npc_on_solid': ['ousmane-lit'],
    },
    # Bordeaux — le studio de Paulfit : la salle de séjour de la maison de M. Pokémon (chaîne hi-fi, canapé, ordinateur) ;
    # ses haltères sont dessinés par le jeu.
    'studioPaulfit': {
        'hgss': ('004i_Mr Pokémon House', 10, 8, 12, 9),
        'block': [[2, 6], [9, 6]],
    },
    # Bordeaux — l'appartement de Rémi : une maison de Doublonville (cuisine, bibliothèque, table) et un lit ; le drapeau
    # américain est dessiné par le jeu.
    'appartRemi': {
        'hgss': (GI, 47, 8, 9, 8),
        'items': [['pb-lit', 0, 6, {'solid': 3}]],
    },
}
