"""Intérieurs de Montépilloy (grange de M. Bouly, maison de la famille, chambre des enfants, école) et du collège
Bonsecours (hall, couloir des casiers, salles de maths, de sciences et de français), refaits à partir de VRAIES pièces
HeartGold / SoulSilver (pack de SirMaIo, scripts/hgss_rooms.py) :

- école de Montépilloy, couloir des casiers et les trois salles du collège : la salle de classe de l'école de Mauville
  (Violet School), vidée ou garnie selon la pièce ; le collège garde ainsi les mêmes murs d'un étage à l'autre ;
- hall du collège : le hall de la Tour Radio de Doublonville (accueil en U, tapis rouge, salon, escalier qui monte) ;
- maison de Montépilloy et chambre des enfants : le salon et la chambre de la maison du héros à Bourg Geon ;
- grange de M. Bouly : la maison de Fargas à Écorce (bois, établi ; sans le four ni les meubles hauts), avec le foin de la ferme Meumeu et les
  caisses de l'entrepôt de Doublonville.
Escaliers, casiers (armoires métalliques), caisses : planches du pack (interieurs_plans.sirmaio). Seuls les tonneaux,
que le pack n'a pas (Benoît se cache dans l'un d'eux), sont dessinés ici, aux couleurs du bois de Fargas.
"""
from PIL import Image, ImageDraw

from interieurs_plans import T, sirmaio

VIOLET = '006i_Violet School '          # (sic : le nom de la carte du pack finit par une espace)
NEWBARK = '001i_Newbark houses'
WH = 'i_Warehouse'


# ---------- Le seul dessin fait ici ----------
def barrel():
    """Tonneau de bois cerclé (une case), aux couleurs du bois de la maison de Fargas."""
    img = Image.new('RGBA', (T, T))
    d = ImageDraw.Draw(img)
    line = (72, 48, 32, 255)
    d.ellipse((3, 13, 14, 16), fill=(0, 0, 0, 60))
    d.rounded_rectangle((2, 1, 13, 14), 3, fill=line)
    d.rounded_rectangle((3, 2, 12, 13), 3, fill=(184, 128, 72, 255))
    for x in (5, 8, 11):
        d.line((x, 4, x, 12), fill=(148, 96, 56, 255))
    d.line((4, 4, 4, 12), fill=(216, 168, 112, 255))
    for y in (5, 10):
        d.line((3, y, 12, y), fill=(96, 92, 100, 255))
        d.line((3, y + 1, 12, y + 1), fill=(152, 148, 156, 255))
    d.ellipse((4, 1, 11, 5), fill=(132, 84, 44, 255), outline=line)
    return img


ITEMS = {
    # Escaliers de l'entrepôt de Doublonville (montée encastrée dans le mur, descente dans le sol).
    'mc-monte-g': {'img': lambda: sirmaio(WH, 0, 13, 2, 3), 'solid': 0, 'flat': True},
    'mc-monte-d': {'img': lambda: sirmaio(WH, 6, 13, 2, 3), 'solid': 0, 'flat': True},
    'mc-descend-g': {'img': lambda: sirmaio(WH, 0, 16, 2, 2), 'solid': 0, 'flat': True},
    'mc-descend-d': {'img': lambda: sirmaio(WH, 6, 16, 2, 2), 'solid': 0, 'flat': True},
    # Casiers : les armoires métalliques de l'entrepôt (3 cases de large, contre le mur).
    'mc-casiers': {'img': lambda: sirmaio(WH, 5, 9, 3, 2), 'solid': 1},
    'mc-placard': {'img': lambda: sirmaio(WH, 5, 1, 3, 2), 'solid': 1},
    # Grange : caisses de l'entrepôt, foin et bidon de la ferme Meumeu, tonneaux.
    'mc-caisses': {'img': lambda: sirmaio(WH, 0, 9, 2, 3), 'solid': 2},
    'mc-foin': {'img': lambda: sirmaio('i_Moomoo-Farm', 0, 15, 4, 4), 'solid': 3},
    'mc-bidon': {'img': lambda: sirmaio('i_Moomoo-Farm', 4, 22, 1, 2), 'solid': 1},
    'mc-tonneau': {'img': barrel, 'solid': 1},
    # Bibliothèque et tableau de l'école (planche School).
    'mc-biblio': {'img': lambda: sirmaio('i_School', 3, 8, 1, 2), 'solid': 1},
}


def wall_column(x0, y0, to_x, rows=2):
    """Recolle une colonne de mur propre de la salle de Mauville (ses `rows` rangées du haut) en x = to_x."""
    return {'from': (VIOLET, x0, y0, 1, rows), 'to': (to_x, 0)}


# La salle de Mauville : x 10, y 8, 15 x 11 dans la carte du pack. Murs : rangées 0-1 ; plante (0) et télé (1-2) en
# haut à gauche, bibliothèque (13-14) en haut à droite, bureau du maître (4-6, 3), pupitres (2-4 et 6-8, rangées 5 et 7 ;
# chaises rangées 6 et 8), machine (13-14, 4-6), plantes en bas (0 et 14, 9-10), tapis de sortie (5, 10).
CLASSROOM = (VIOLET, 10, 8, 15, 11)
CLEAN_WALL = 17                                  # colonne de mur sans fenêtre (x 7 de la salle)
TOP_LEFT = [[0, 1, 3, 2]]                        # plante et télé du haut à gauche
TOP_RIGHT = [[13, 1, 2, 2]]                      # bibliothèque du haut à droite
DESKS = [[2, 3, 7, 6], [4, 3, 3, 1]]             # pupitres, chaises et bureau du maître
MACHINE = [[13, 4, 2, 3]]
MAT = [[5, 10, 1, 1]]
# Le tapis de sortie est dans le sol (cases 4 à 6) : on y recolle le parquet propre de la même rangée (motif aligné).
NO_MAT = [{'from': (VIOLET, sx, 18, 1, 1), 'to': (x, 10), 'sol': True} for x, sx in ((4, 12), (5, 17), (6, 12))]
WALL_LEFT = [wall_column(CLEAN_WALL, 8, x) for x in (0, 1, 2)]
WALL_RIGHT = [wall_column(CLEAN_WALL, 8, x) for x in (13, 14)]


PLANS = {
    # Grange de M. Bouly (maison de Fargas, 11 x 10) : l'établi au fond à gauche, le fond à droite dégagé (sacs de
    # charbon) ; tonneaux à gauche (Benoît dans le premier), caisses de légumes au milieu, grand tas de foin en bas à
    # droite (la pièce du tracteur dessous), bidon de lait.
    # Sans le four en briques ni les deux meubles hauts du fond à gauche (on aurait dit des enceintes), demande de
    # l'utilisateur : le mur nu remis derrière le four.
    'boulyBarn': {
        'hgss': ('010i_Azalea Houses', 10, 7, 11, 10),
        'erase': [[1, 6, 1, 1], [4, 5, 1, 1], [10, 7, 1, 1], [6, 1, 4, 5], [0, 2, 2, 2]],
        'paste': [{'from': ('010i_Azalea Houses', 14, 7, 1, 3), 'to': (x, 0), 'sol': True, 'only': ('Floor', 'Wall')}
                  for x in (6, 7, 8, 9)]
                 + [{'from': ('010i_Azalea Houses', 14, 9, 1, 1), 'to': (0, 2), 'sol': True, 'only': ('Floor', 'Wall')},
                    {'from': ('010i_Azalea Houses', 13, 9, 1, 1), 'to': (1, 2), 'sol': True, 'only': ('Floor', 'Wall')}]
                 # sol de pierre uni à la place du socle du four
                 + [{'from': ('010i_Azalea Houses', 15, 15, 1, 1), 'to': (x, y), 'sol': True, 'only': ('Floor',)}
                    for x in range(6, 11) for y in range(3, 7)],
        'items': [
            ['mc-tonneau', 0, 5], ['mc-tonneau', 0, 6], ['mc-tonneau', 1, 5],
            ['mc-caisses', 4, 6], ['mc-foin', 7, 9], ['mc-bidon', 6, 9],
        ],
    },
    # Maison de Montépilloy (salon de la maison du héros, Bourg Geon, 11 x 10) : escalier à gauche, télé, cuisine, frigo ;
    # la table du dîner sur le grand tapis.
    'montHouse': {
        'hgss': (NEWBARK, 10, 53, 11, 10),
        'block': [[5, 6], [6, 6], [5, 7], [6, 7]],
        'free': [[0, 2], [1, 2]],
    },
    # Chambre des enfants (chambre du héros, Bourg Geon, 10 x 10) : l'escalier qui descend en haut à gauche, bureau et
    # ordinateur, télé ; quatre lits côte à côte en bas (Pierre, Manon, Jean, Fanny), le tapis au milieu.
    # Un seul lit (le lit d'origine de la chambre), quel que soit le nombre d'enfants (demande de l'utilisateur), sans le
    # petit tapis clair dessous.
    'montHouseUp': {
        'hgss': (NEWBARK, 10, 33, 10, 10),
        'paste': [{'from': (NEWBARK, 10, 38, 4, 2), 'to': (0, y), 'sol': True} for y in (7, 8)],
        'block': [[x, y] for x in range(3) for y in (7, 8, 9)],
        'free': [[0, 3], [1, 3]],
    },
    # École de Montépilloy : la salle de classe de Mauville telle quelle (tableau, bureau du maître, pupitres).
    'school': {
        'hgss': CLASSROOM,
    },
    # Hall du collège (Tour Radio de Doublonville, 25 x 12) : la principale dans l'accueil en U, le tapis rouge, le coin
    # lecture (canapés), l'escalier qui monte aux casiers en haut à droite.
    'bonsecours': {
        'hgss': ('012i_Goldenrod radio tower', 10, 111, 25, 12),
        'free': [[23, 2], [24, 2], [23, 3], [24, 3]],
    },
    # Couloir des casiers (salle de Mauville vidée) : six casiers métalliques au fond, le placard d'entretien ;
    # l'escalier qui monte en maths à gauche, celui qui descend au hall à droite.
    'bonsecoursCasiers': {
        'hgss': CLASSROOM,
        'erase': TOP_LEFT + TOP_RIGHT + DESKS + [[4, 2, 3, 1]] + MACHINE + MAT,
        # Le tableau vert (x 3-6) laisse place au mur : les casiers s'y adossent.
        'paste': WALL_LEFT + WALL_RIGHT + [wall_column(CLEAN_WALL, 8, x) for x in (3, 4, 5, 6)] + NO_MAT,
        'items': [
            ['mc-monte-g', 0, 2], ['mc-descend-d', 13, 2],
            ['mc-casiers', 4, 2], ['mc-casiers', 7, 2], ['mc-placard', 10, 2],
        ],
        'free': [[0, 2], [1, 2], [13, 2], [14, 2]],
        'block': [[x, 2] for x in range(4, 13)],
    },
    # Salle de maths (ta classe) : l'escalier qui redescend aux casiers à gauche, celui qui monte en sciences à droite.
    'bonsecoursMaths': {
        'hgss': CLASSROOM,
        'erase': TOP_LEFT + TOP_RIGHT + MAT,
        'paste': WALL_LEFT + WALL_RIGHT + NO_MAT,
        'items': [['mc-descend-g', 0, 2], ['mc-monte-d', 13, 2]],
        'free': [[0, 2], [1, 2], [13, 2], [14, 2]],
    },
    # Salle de sciences : deux vitrines de labo (celle de Mauville et une du labo d'Orme), escalier qui monte en français à gauche, qui redescend en
    # maths à droite.
    'bonsecoursSciences': {
        'hgss': CLASSROOM,
        'erase': TOP_LEFT + TOP_RIGHT + MAT,
        'paste': WALL_LEFT + WALL_RIGHT + NO_MAT + [{'from': ('001i_Newbark-Lab', 16, 12, 2, 3), 'to': (11, 4)}],
        'items': [['mc-monte-g', 0, 2], ['mc-descend-d', 13, 2]],
        'free': [[0, 2], [1, 2], [13, 2], [14, 2]],
    },
    # Salle de français, tout en haut : l'escalier qui redescend à gauche ; des bibliothèques le long du mur.
    'bonsecoursFrancais': {
        'hgss': CLASSROOM,
        'erase': TOP_LEFT + MAT,
        'paste': WALL_LEFT + NO_MAT,
        'items': [['mc-descend-g', 0, 2]] + [['mc-biblio', x, 2] for x in (9, 10, 11, 12)],
        'free': [[0, 2], [1, 2]],
    },
}
