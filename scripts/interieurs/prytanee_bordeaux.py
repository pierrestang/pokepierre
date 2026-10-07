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
}


RT = '012i_Goldenrod radio tower'
GI = '012i_Goldenrod interiors'
DORM_CLEAR = (3, 4, 11, 7)            # les bureaux, chaises, la table et son tapis de l'étage de la Tour Radio


def dorm(extra=()):
    """Un dortoir du Prytanée : l'étage de bureaux de la Tour Radio vidé, quatre lits par paires contre le mur du fond,
    une commode de chaque côté, un bureau."""
    return {
        'hgss': (RT, 10, 51, 14, 12),
        'erase': [DORM_CLEAR],
        'items': [
            *[['pb-lit', x, 4, {'solid': 3}] for x in (3, 5, 8, 10)],   # x 2 et 7 restent libres (escalier, allée)
            ['pb-commode', 12, 7, {'solid': 2}], ['pb-commode', 0, 8, {'solid': 2}],
            *extra,
        ],
    }


PLANS = {
    # Prytanée — hall de l'internat : le hall du côté boutiques de la gare de Doublonville (murs verts, sol à damier,
    # plantes, escalier au fond à droite), sans ses lampadaires ; deux fenêtres remplacées par du mur pour le drapeau
    # (dessiné par le jeu), une bibliothèque et le bureau de l'accueil.
    'dortoirHall': {
        'hgss': (GI, 47, 24, 11, 10),
        'erase': [(2, 4, 1, 2), (6, 4, 1, 2), (2, 7, 1, 2), (6, 7, 1, 2), (6, 0, 2, 3)],
        'paste': [{'from': (GI, 47 + 5, 24, 1, 3), 'to': (6, 0), 'sol': True},
                  {'from': (GI, 47 + 5, 24, 1, 3), 'to': (7, 0), 'sol': True},
                  # Les lampadaires sont dans le sol : recouverts par du sol nu de même motif.
                  *[{'from': (GI, 47 + 4, 24 + y, 1, 2), 'to': (x, y), 'sol': True} for x in (2, 6) for y in (4, 7)]],
        'items': [['pb-bibliotheque', 1, 3], ['pb-bureau-pc', 4, 3]],
        'free': [[9, 6]],                              # le pied de l'escalier (η)
    },
    # Prytanée — dortoir (1er étage) : l'escalier de gauche monte au 2e, l'encadrement de droite descend au hall.
    'dortoir': {**dorm([['pb-bureau-pc', 2, 8]]), 'free': [[1, 3], [12, 3]]},
    # Prytanée — 2e étage : la même chambrée ; l'escalier de gauche redescend.
    'dortoirEtage2': {**dorm(), 'free': [[1, 3]]},
    # Bordeaux — l'agence : le bureau du directeur de la Tour Radio (moquette rouge, grand bureau, plantes, escalier).
    'agence': {
        'hgss': (RT, 10, 31, 9, 12), 'mat': 'rouge',
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
    # Bordeaux — KEDGE, la salle de l'oral : la salle de classe de l'école d'Écorcia ; la professeure derrière son bureau.
    # Bordeaux — le stade : le hall du portique du Parc et du Pokéathlon (moquette, comptoir en U : le pupitre du directeur).
    'stade': {
        'hgss': ('013i_Park-Pokéathlon Gate', 10, 8, 28, 11),
    },
}
