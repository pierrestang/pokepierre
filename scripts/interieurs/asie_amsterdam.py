"""Intérieurs Gen 4 : Hanoï, Amsterdam, New Delhi — de vraies pièces de HeartGold / SoulSilver (pack de
SirMaIo, scripts/hgss_rooms.py), retouchées pour le lieu (voir scripts/build_interiors.py : 'hgss', 'erase', 'paste').

Pièces de départ (cartes Tiled du pack, coordonnées en cases de la carte) :
- hanoiHome : la petite maison de Doublonville (cuisine, bibliothèque, table) ; le lit de la chambre de Bourg Geon.
- travelAgency : le bureau du directeur de la Tour Radio (moquette rouge, bureau sur tapis, plantes) ; l'accueil devient
  un comptoir.
- temple : le dernier étage de la tour Chétiflor (statues, parchemins, bois sombre) ; l'autel : la table dorée de la
  tente de la diseuse de bonne aventure.
- corning : un étage de bureaux de la Tour Radio (table de réunion, postes informatiques).
- coffeeShop : la fleuriste de Doublonville (plantes partout) ; le comptoir du vendeur : le bureau à fleurs du fond.
- maisonCommune : la chambre du héros de Bourg Geon (bureau et PC, télé, lit, tapis) ; un second lit.
- delhiUniversity : la classe de l'école de Mauville (tableau, bureau, plantes), sans pupitres ni chaises : la salle de
  la fête.
- delhiFort : le bas de l'arène de Mauville (dalles, piliers, marches, statues) : le vieux fort.
Le tapis rouge de sortie, quand la pièce d'origine n'en a pas (étages), vient de la maison de Mauville.
Crédit : « Intérieurs HGSS ripés et préparés par SirMaIo ».
"""

from PIL import Image

import hgss_rooms as HG

GH = '012i_Goldenrod interiors'
RADIO = '012i_Goldenrod radio tower'
BED = ('001i_Newbark houses', 10, 39, 3, 4)                      # le lit de la chambre de Bourg Geon


def exit_mat():
    """Le tapis rouge de sortie de la maison de Mauville (calque Floor_B de ses trois cases, sans le sol ni le liseré du
    seuil), pour les pièces d'étage qui n'en ont pas."""
    r = HG.room('006i_Violet houses', 12, 15, 3, 1)
    img = Image.new('RGBA', (3 * HG.T, HG.T))
    for i, stack in enumerate(r['sol']):
        if len(stack) > 1:
            img.alpha_composite(stack[1], (i * HG.T, 0))
    return img


ITEMS = {
    'aa-tapis': {'img': exit_mat, 'solid': 0, 'flat': True},
}

PLANS = {
    # Ta maison à Hanoï : la petite maison de Doublonville, et un lit contre le mur de gauche.
    'hanoiHome': {
        'hgss': (GH, 47, 8, 9, 8),
        'paste': [{'from': BED, 'to': (0, 3)}],
        'block': [[1, 4], [1, 5]],
    },
    # Agence de voyage : le bureau du directeur de la Tour Radio ; la directrice derrière son grand bureau.
    'travelAgency': {
        'hgss': (RADIO, 10, 31, 9, 12),
        'items': [['aa-tapis', 3, 11]],
    },
    # Temple : le dernier étage de la tour Chétiflor ; l'autel (table dorée) entre les statues du fond.
    'temple': {
        'hgss': ('006i_Sprout Tower', 76, 8, 13, 11),
        'paste': [{'from': (GH, 93, 11, 3, 1), 'to': (5, 4)}],
        'items': [['aa-tapis', 5, 10]],
        'block': [[5, 4], [6, 4], [7, 4]],
    },
    # Corning : un étage de bureaux de la Tour Radio ; Laurent au bout de la table de réunion. Sans les escaliers
    # (demande de l'utilisateur) : mur nu à leur place, une seconde armoire au fond à droite, un troisième poste de
    # travail (bureau, ordinateur, chaise) à gauche.
    'corning': {
        'hgss': (RADIO, 10, 51, 14, 12),
        'erase': [(0, 0, 2, 6), (12, 0, 2, 4)],                             # escaliers (et l'armoire, recollée)
        'paste': [{'from': (RADIO, 20, 51, 1, 2), 'to': (x, 0), 'sol': True, 'only': ('Floor', 'Wall_A')} for x in (0, 1, 13)]
                 + [{'from': (RADIO, 22, 51, 1, 2), 'to': (12, 0), 'sol': True, 'only': ('Floor', 'Wall')}]   # la fenêtre
                 # sol à motif, pris au même pas du motif (parité de x et de y)
                 + [{'from': (RADIO, 12 + x % 2, 59 + y % 2, 1, 1), 'to': (x, y), 'sol': True, 'only': ('Floor',)}
                    for x in (0, 1, 12, 13) for y in (2, 3)]
                 # l'armoire de gauche (sans le bas de l'escalier posé dessus), et sa jumelle au fond à droite
                 + [{'from': (RADIO, 10, 55, 2, 2), 'to': to, 'only': ('Props_A',)} for to in ((0, 4), (12, 2))]
                 + [{'from': (RADIO, 14, 55, 2, 2), 'to': (1, 6)},           # un poste de travail
                    {'from': (RADIO, 14, 57, 1, 1), 'to': (1, 8)}],          # et sa chaise
        'items': [['aa-tapis', 5, 11]],
    },
    # Coffee shop : la fleuriste de Doublonville ; le vendeur derrière le bureau fleuri du fond.
    'coffeeShop': {
        'hgss': (GH, 109, 7, 10, 9),
    },
    # Maison commune : la chambre du héros de Bourg Geon, un second lit à droite.
    'maisonCommune': {
        'hgss': ('001i_Newbark houses', 10, 33, 10, 10),
        'erase': [(9, 8, 1, 2)],
        'paste': [{'from': BED, 'to': (7, 6)}],
        'items': [['aa-tapis', 3, 9]],
        'block': [[0, 3], [1, 3], [2, 3], [1, 8], [8, 8]],
    },
    # Université de Delhi : la classe de l'école de Mauville, pupitres et chaises retirés (la grande salle de la fête) ;
    # le bureau du professeur reste (la table de la musique).
    'delhiUniversity': {
        'hgss': ('006i_Violet School ', 10, 8, 15, 11),
        'erase': [(2, 4, 7, 5)],
    },
    # Le vieux fort de New Delhi : le bas de l'arène de Mauville (dalles de pierre, grands piliers, balustrades, marches,
    # deux statues), sans l'arène elle-même ; le vieux sage sur la terrasse, au-dessus des marches.
    'delhiFort': {
        'hgss': ('006i_Violet Gym', 10, 43, 21, 16),
    },
}
