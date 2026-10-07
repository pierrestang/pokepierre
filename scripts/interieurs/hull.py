"""Intérieurs Gen 4 de Hull : les deux pubs, The Asylum, la bibliothèque, l'université, chez Léo, la coloc.

Pubs : la cabine de yacht de terriblejared (bois sombre, fenêtres, fauteuils verts, laiton) ; The Asylum : boîte de nuit
(mur de briques sombres, néons, cabine de DJ, enceintes, piste de dalles lumineuses, boule à facettes) dessinée ici dans
le style Gen 4 là où les planches n'ont rien.
"""
from PIL import Image, ImageDraw

from interieurs_plans import T, meuble, rect, stretch, isolate  # noqa: F401


# ---------- Dessins (style Gen 4 : contours sombres, reflets, ombres douces) ----------
def neon(color, motif):
    """Enseigne au néon (2 cases sur 1) : un tube coloré et son halo, sur le mur."""
    img = Image.new('RGBA', (2 * T, T))
    d = ImageDraw.Draw(img)
    r, g, b = color
    halo = (r, g, b, 70)
    tube = (min(255, r + 60), min(255, g + 60), min(255, b + 60), 255)
    core = (255, 250, 255, 255)
    if motif == 'verre':                       # un verre à cocktail
        pts = [(9, 3), (23, 3), (16, 9), (16, 13), (12, 13), (20, 13)]
        lines = [((9, 3), (23, 3)), ((9, 3), (16, 9)), ((23, 3), (16, 9)), ((16, 9), (16, 13)), ((12, 13), (20, 13))]
    elif motif == 'note':                      # une note de musique
        lines = [((19, 2), (19, 11)), ((19, 2), (25, 4)), ((25, 4), (25, 9))]
        pts = [(16, 12), (22, 10)]
    else:                                      # une vague
        lines = [((4, 9), (8, 5)), ((8, 5), (12, 9)), ((12, 9), (16, 5)), ((16, 5), (20, 9)), ((20, 9), (24, 5)),
                 ((24, 5), (28, 9))]
        pts = []
    for (a, b2) in lines:
        d.line((a, b2), fill=halo, width=4)
    for (a, b2) in lines:
        d.line((a, b2), fill=tube, width=2)
        d.line((a, b2), fill=core, width=1)
    for x, y in pts:
        if motif == 'note':
            d.ellipse((x - 3, y - 2, x + 3, y + 2), fill=tube, outline=halo)
    return img


def dj_booth():
    """Cabine de DJ (3 cases sur 2) : platines, table de mixage et ordinateur sur un meuble noir à liseré violet."""
    img = Image.new('RGBA', (3 * T, 2 * T))
    d = ImageDraw.Draw(img)
    out, body, top, edge = (24, 20, 30, 255), (52, 46, 64, 255), (84, 76, 100, 255), (176, 96, 232, 255)
    d.rectangle((1, 8, 46, 31), fill=out)
    d.rectangle((2, 9, 45, 18), fill=top)                 # plateau
    d.rectangle((2, 19, 45, 30), fill=body)               # façade
    d.line((2, 19, 45, 19), fill=edge)                    # liseré lumineux
    d.line((2, 29, 45, 29), fill=(36, 30, 44, 255))
    for x in (9, 38):                                     # platines
        d.ellipse((x - 6, 9, x + 6, 18), fill=(20, 18, 24, 255), outline=(130, 124, 140, 255))
        d.ellipse((x - 2, 12, x + 2, 15), fill=(220, 60, 120, 255))
        d.point((x + 4, 11), fill=(240, 240, 240, 255))
    d.rectangle((19, 10, 28, 17), fill=(30, 28, 36, 255))  # table de mixage
    for i, x in enumerate((21, 24, 27)):
        d.line((x, 11, x, 16), fill=(90, 90, 100, 255))
        d.rectangle((x - 1, 12 + i, x, 13 + i), fill=(120, 220, 255, 255))
    d.rectangle((20, 2, 28, 9), fill=(40, 40, 48, 255))   # ordinateur ouvert
    d.rectangle((21, 3, 27, 8), fill=(110, 200, 255, 255))
    d.point((22, 4), fill=(240, 255, 255, 255))
    for x in range(6, 44, 6):                             # voyants de la façade
        d.point((x, 24), fill=(120, 220, 255, 255) if x % 12 else (240, 110, 200, 255))
    return img


def disco_ball():
    """Boule à facettes suspendue (une case, au-dessus des personnages)."""
    img = Image.new('RGBA', (T, T))
    d = ImageDraw.Draw(img)
    d.line((8, 0, 8, 3), fill=(150, 150, 160, 255))
    d.ellipse((3, 3, 13, 13), fill=(120, 124, 140, 255), outline=(60, 60, 72, 255))
    for (x, y, c) in [(5, 6, 230), (7, 5, 250), (9, 6, 200), (11, 8, 170), (6, 9, 190), (8, 8, 255), (10, 11, 160),
                      (5, 11, 150), (8, 11, 210)]:
        d.rectangle((x, y, x + 1, y), fill=(c, c, min(255, c + 10), 255))
    d.point((6, 5), fill=(255, 255, 255, 255))
    return img


def dance_floor(w, h):
    """Piste de dalles lumineuses (w x h cases, 4 dalles par case), couleurs en diagonale, bords en relief."""
    img = Image.new('RGBA', (w * T, h * T))
    d = ImageDraw.Draw(img)
    colors = [(150, 70, 220), (60, 120, 230), (230, 70, 150), (60, 190, 200)]
    for y in range(h * 2):
        for x in range(w * 2):
            r, g, b = colors[(x + y * 3) % len(colors)]
            x0, y0 = x * 8, y * 8
            d.rectangle((x0, y0, x0 + 7, y0 + 7), fill=(28, 22, 36, 255))
            d.rectangle((x0 + 1, y0 + 1, x0 + 6, y0 + 6), fill=(r, g, b, 255))
            d.line((x0 + 1, y0 + 1, x0 + 6, y0 + 1), fill=(min(255, r + 70), min(255, g + 70), min(255, b + 70), 255))
            d.line((x0 + 1, y0 + 6, x0 + 6, y0 + 6), fill=(r * 2 // 3, g * 2 // 3, b * 2 // 3, 255))
            d.point((x0 + 2, y0 + 2), fill=(255, 245, 255, 255))
    return img


def bar_stool(seat=(200, 56, 64)):
    """Tabouret de bar : assise ronde sur un pied chromé."""
    img = Image.new('RGBA', (T, T))
    d = ImageDraw.Draw(img)
    r, g, b = seat
    d.line((8, 8, 8, 13), fill=(70, 70, 80, 255), width=2)
    d.line((5, 14, 11, 14), fill=(70, 70, 80, 255))
    d.ellipse((3, 3, 12, 9), fill=(r, g, b, 255), outline=(r // 3, g // 3, b // 3, 255))
    d.line((5, 4, 9, 4), fill=(min(255, r + 50), min(255, g + 60), min(255, b + 60), 255))
    return img


def high_table():
    """Mange-debout : plateau rond sombre sur un pied."""
    img = Image.new('RGBA', (T, 2 * T))
    d = ImageDraw.Draw(img)
    d.line((8, 18, 8, 29), fill=(50, 46, 58, 255), width=2)
    d.ellipse((4, 28, 12, 31), fill=(40, 36, 46, 255))
    d.ellipse((1, 12, 14, 19), fill=(64, 56, 80, 255), outline=(24, 20, 30, 255))
    d.line((4, 14, 10, 14), fill=(120, 110, 140, 255))
    return img


def pub_table():
    """Table ronde de pub : plateau de bois sombre verni sur un pied central."""
    img = Image.new('RGBA', (T, T))
    d = ImageDraw.Draw(img)
    d.ellipse((4, 13, 12, 15), fill=(0, 0, 0, 60))
    d.line((8, 9, 8, 14), fill=(52, 34, 24, 255), width=2)
    d.ellipse((1, 2, 14, 10), fill=(108, 66, 40, 255), outline=(48, 28, 18, 255))
    d.arc((3, 3, 12, 8), 200, 300, fill=(160, 110, 70, 255))
    return img


def desk2():
    """Le bureau à la carte de la cabine de yacht, ramené à 2 cases de large."""
    img = rect('jared-bateaux', 132, 1440, 34, 28)
    a = img.crop((0, 0, img.width, img.height))
    bx0, by0, bx1, by1 = a.getbbox()
    a = a.crop((bx0 + 1, 0, bx1 - 1, a.height))
    out = Image.new('RGBA', (2 * T, img.height))
    out.alpha_composite(a, (0, 0))
    return out


ITEMS = {
    'h-table-pub': {'img': pub_table, 'solid': 1},
    'h-pupitre': {'img': desk2, 'solid': 1},
    'h-table-basse': {'img': lambda: stretch(meuble(122), 4), 'solid': 2},
    'h-neon-rose-verre': {'img': lambda: neon((230, 70, 170), 'verre'), 'solid': 0},
    'h-neon-cyan-note': {'img': lambda: neon((60, 200, 240), 'note'), 'solid': 0},
    'h-neon-rose-vague': {'img': lambda: neon((230, 70, 170), 'vague'), 'solid': 0},
    'h-neon-violet-note': {'img': lambda: neon((170, 90, 240), 'note'), 'solid': 0},
    'h-dj': {'img': dj_booth, 'solid': 1},
    'h-boule': {'img': disco_ball, 'solid': 0, 'top': True},
    'h-piste': {'img': lambda: dance_floor(4, 3), 'solid': 0, 'flat': True},
    'h-tabouret': {'img': bar_stool, 'solid': 0, 'flat': True},
    'h-tabouret-vert': {'img': lambda: bar_stool((70, 150, 90)), 'solid': 0, 'flat': True},
    'h-mange-debout': {'img': high_table, 'solid': 1},
    'h-enceinte': {'img': lambda: meuble(237), 'solid': 1},
    # Mobilier Gen 4 (g4-int-meubles, voir les planches numérotées).
    'h-tableau-vert': {'img': lambda: meuble(268), 'solid': 0},
    'h-bibliotheque': {'img': lambda: meuble(226), 'solid': 1},
    'h-bibliotheque-basse': {'img': lambda: meuble(124), 'solid': 1},
    'h-fenetre': {'img': lambda: meuble(20), 'solid': 0},
    'h-fenetre-ronde': {'img': lambda: meuble(19), 'solid': 0},
    'h-palmier': {'img': lambda: meuble(136), 'solid': 1},
    'h-plante': {'img': lambda: meuble(306), 'solid': 1},
    'h-table-bois': {'img': lambda: meuble(125), 'solid': 2},
    'h-table-lecture': {'img': lambda: stretch(meuble(115), 4), 'solid': 2},
    'h-bureau-prof': {'img': lambda: meuble(117), 'solid': 1},
    'h-lit': {'img': lambda: isolate(meuble(155)), 'solid': 2},
    'h-ordinateur': {'img': lambda: meuble(225), 'solid': 1},
    'h-cuisiniere': {'img': lambda: meuble(285), 'solid': 1},
    'h-frigo': {'img': lambda: meuble(51), 'solid': 1},
    'h-etagere': {'img': lambda: meuble(141), 'solid': 1},
    'h-tele': {'img': lambda: meuble(168), 'solid': 1},
    'h-carte': {'img': lambda: rect('g4-int-meubles', 0, 0, 1, 1) if False else meuble(309).crop((0, 0, 48, 32)), 'solid': 0},
}


PLANS = {
    # Premier pub : le comptoir au fond (rangée 3), le barman derrière (rangée 2), l'étagère à bouteilles au mur ; les
    # habitués au comptoir (rangée 4) ; deux tables rondes de la bande de chaque côté de l'entrée.
    'hullPubA': {
        'wall': 'cabine', 'floor': 'bois-roux',
        'items': [
            ['bouteilles-6', 1, 1], ['cible', 8, 0], ['plante-violette', 0, 2], ['lampe-laiton', 9, 2],
            ['bar-7', 1, 4], ['pompes', 2, 3, {'dy': -6}], ['pompes', 6, 3, {'dy': -6}], ['pintes', 1, 3, {'dy': -8}],
            ['pintes', 1, 6, {'dy': -4}], ['pintes', 8, 6, {'dy': -4}],
            ['fauteuil-vert', 0, 6], ['h-table-pub', 1, 6], ['fauteuil-vert', 2, 6],
            ['fauteuil-vert', 7, 6], ['h-table-pub', 8, 6], ['fauteuil-vert', 9, 6],
        ],
    },
    # Second pub : boiseries sombres, comptoir court au fond à gauche (la barmaid au bout), cible de fléchettes où joue
    # l'habitué, néon au mur ; cinq tables rondes et leurs tabourets (on s'y assoit), l'allée de l'entrée libre.
    'hullPubB': {
        'wall': 'bois-sombre', 'floor': 'bois-roux',
        'items': [
            ['bouteilles-3', 0, 1], ['bar-3', 0, 3], ['pompes', 1, 2, {'dy': -6}], ['pintes', 2, 2, {'dy': -8}],
            ['cible', 5, 0], ['h-neon-rose-verre', 7, 0], ['plante-violette', 9, 2],
            *[it for x, y in ((1, 4), (4, 4), (7, 4), (1, 6), (7, 6)) for it in (
                ['h-tabouret-vert', x - 1, y], ['h-table-pub', x, y], ['h-tabouret-vert', x + 1, y])],
            ['pintes', 1, 6, {'dy': -4}], ['pintes', 4, 4, {'dy': -4}], ['pintes', 7, 4, {'dy': -4}],
        ],
    },
    # The Asylum : le bar à gauche (bouteilles, tabourets), la cabine de DJ entre deux enceintes au fond, des néons au
    # mur, la piste de dalles lumineuses (où il faut rejoindre la bande) et la boule à facettes ; des mange-debout à droite.
    'hullAsylum': {
        'wall': 'brique', 'floor': 'pierre-sombre',
        'items': [
            ['h-piste', 4, 6],
            ['bouteilles-3', 0, 1], ['bar-3', 0, 3], ['pompes', 1, 2, {'dy': -6}],
            ['h-tabouret', 1, 3], ['h-tabouret', 2, 3],
            ['h-enceinte', 3, 2], ['h-dj', 4, 2], ['h-enceinte', 7, 2],
            ['h-neon-rose-verre', 0, 0], ['h-neon-cyan-note', 5, 0], ['h-neon-violet-note', 8, 0], ['h-neon-rose-vague', 10, 0],
            *[it for y in (3, 5, 7) for it in (['h-mange-debout', 10, y], ['h-tabouret', 11, y])],
            ['pintes', 10, 5, {'dy': -10}],
            ['h-boule', 5, 3, {'dx': 8}],
        ],
        'free': [[8, 2], [9, 2], [10, 2], [11, 2]],
    },
    # Bibliothèque Brynmor Jones : rayonnages contre le mur de part et d'autre d'une fenêtre, grande table de lecture au
    # milieu (la bande révise autour), moquette rouge, deux palmiers près de l'entrée.
    'hullLibrary': {
        'wall': 'bibliotheque', 'floor': 'moquette-rouge',
        'items': [
            ['h-bibliotheque', 0, 2], ['h-bibliotheque', 2, 2], ['h-fenetre', 5, 1],
            ['h-bibliotheque', 8, 2], ['h-bibliotheque', 10, 2],
            ['h-table-lecture', 4, 5], ['lampe-laiton', 4, 5, {'dy': -12, 'solid': 0}], ['lampe-laiton', 7, 5, {'dy': -12, 'solid': 0}],
            ['h-palmier', 0, 7], ['h-palmier', 11, 7],
        ],
    },
    # Université : amphithéâtre ; le tableau vert au mur, une bibliothèque dans chaque coin, le bureau du professeur, deux
    # rangées de pupitres.
    'hullUniversity': {
        'wall': 'beige', 'floor': 'damier-bois',
        'items': [
            ['h-bibliotheque', 0, 2], ['h-tableau-vert', 4, 1], ['h-bibliotheque', 10, 2],
            ['h-bureau-prof', 5, 3],
            *[['h-pupitre', x, y] for y in (5, 7) for x in (1, 4, 7, 10)],
        ],
    },
    # Chez Léo : cuisine (cuisinière, frigo), fenêtre, étagère, la table au milieu ; Romain, Prophecy et Léo autour.
    'hullHouse': {
        'wall': 'creme', 'floor': 'parquet',
        'items': [
            ['h-cuisiniere', 0, 2], ['h-fenetre', 3, 1], ['h-etagere', 5, 2], ['h-frigo', 7, 2],
            ['h-table-basse', 2, 5],
        ],
    },
    # La coloc : le lit de Pierre, la fenêtre, le bureau et son ordinateur, une plante, la table.
    'hullColoc': {
        'wall': 'papier-peint', 'floor': 'parquet-clair',
        'items': [
            ['h-lit', 0, 3], ['h-fenetre', 2, 1], ['h-ordinateur', 4, 2], ['h-plante', 7, 2],
            ['h-table-basse', 4, 5],
        ],
    },
}
