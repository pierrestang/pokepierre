"""Intérieurs Gen 4 de Fort-de-France et de Saint-Ay (voir scripts/interieurs_plans.py pour le format).

Maisons claires et aérées (Diamant / Perle : la maison du héros), la cabane de pêche de Papa en planches, la cabane en
bois des cousins, la clinique de Saint-Ay en carrelage blanc. Ce qui n'existe pas dans les planches Gen 4 (cartons de
déménagement, caisses de poisson, râtelier des cannes, petite télé, console, coupe de fruits, table basse en bois) est
dessiné ici, dans les tons Gen 4 (contour brun sombre, deux nuances, reflet clair).
"""
from PIL import Image, ImageDraw

from interieurs_plans import T, rect, stretch, meuble, sheet  # noqa: F401

M = 'g4-int-meubles'
OUT = (58, 40, 30, 255)            # contour brun sombre des dessins faits ici


def canvas(w=1, h=1):
    return Image.new('RGBA', (w * T, h * T))


def box(d, x0, y0, x1, y1, fill, out=OUT):
    d.rectangle((x0, y0, x1, y1), fill=out)
    d.rectangle((x0 + 1, y0 + 1, x1 - 1, y1 - 1), fill=fill)


# ---------- Dessins ----------
def carton():
    """Carton de déménagement fermé (scotch sur le dessus)."""
    img = canvas()
    d = ImageDraw.Draw(img)
    d.rectangle((2, 15, 14, 15), fill=(0, 0, 0, 60))                 # ombre
    box(d, 1, 3, 14, 14, (206, 160, 98, 255))
    d.rectangle((2, 4, 13, 7), fill=(226, 186, 122, 255))            # dessus
    d.rectangle((2, 8, 13, 8), fill=(170, 124, 70, 255))             # arête
    d.rectangle((7, 4, 8, 13), fill=(232, 222, 190, 255))            # scotch
    d.rectangle((3, 10, 5, 11), fill=(120, 84, 48, 255))             # inscription
    return img


def crate(kind):
    """Caisse en bois ouverte : poissons, ou étiquette « À DONNER » (les cannes s'y posent, voir interiors.js)."""
    img = canvas()
    d = ImageDraw.Draw(img)
    d.rectangle((2, 15, 14, 15), fill=(0, 0, 0, 60))
    box(d, 0, 2, 15, 14, (168, 112, 60, 255))
    d.rectangle((1, 3, 14, 5), fill=(70, 46, 30, 255))               # intérieur sombre
    for y in (8, 11):
        d.line((1, y, 14, y), fill=(130, 84, 44, 255))               # planches
    d.line((1, 6, 14, 6), fill=(206, 150, 88, 255))
    if kind == 'poisson':
        for x, c in ((2, (120, 150, 190, 255)), (6, (160, 180, 210, 255)), (10, (110, 140, 180, 255))):
            d.ellipse((x, 1, x + 4, 5), fill=OUT)
            d.ellipse((x + 1, 2, x + 3, 4), fill=c)
    else:
        box(d, 4, 8, 11, 12, (240, 236, 220, 255), (90, 70, 50, 255))
        d.line((5, 10, 10, 10), fill=(200, 60, 50, 255))
    return img


def rod_rack():
    """Râtelier des cannes, contre le mur (2 cases) : un socle de bois percé de trois trous (x = 3, 11, 19) qui couvre
    la plinthe ; les cannes sont des décors posés selon l'histoire (interiors.js RACK_RODS)."""
    img = canvas(2, 2)
    d = ImageDraw.Draw(img)
    d.rectangle((0, 31, 25, 31), fill=(0, 0, 0, 60))
    box(d, 0, 22, 24, 31, (176, 118, 64, 255))
    d.rectangle((1, 23, 23, 25), fill=(206, 152, 92, 255))
    for x in (3, 11, 19):
        d.rectangle((x - 1, 23, x + 1, 24), fill=(60, 38, 22, 255))
    # Épuisette posée contre le mur, à droite.
    d.line((28, 6, 28, 31), fill=(90, 60, 34, 255))
    d.ellipse((24, 0, 32, 9), outline=(70, 70, 80, 255))
    for k in range(2, 8, 2):
        d.line((25, k, 31, k), fill=(150, 150, 160, 180))
    return img


def small_tv():
    """Petite télé cathodique sur son meuble bas (1 x 2 cases)."""
    img = canvas(1, 2)
    d = ImageDraw.Draw(img)
    d.rectangle((1, 31, 15, 31), fill=(0, 0, 0, 60))
    box(d, 0, 20, 15, 30, (176, 116, 64, 255))                       # meuble
    d.line((1, 25, 14, 25), fill=(130, 84, 44, 255))
    d.point((7, 23), fill=(240, 220, 160, 255))
    d.point((7, 28), fill=(240, 220, 160, 255))
    box(d, 1, 7, 14, 20, (120, 124, 140, 255), (40, 40, 52, 255))    # télé
    d.rectangle((3, 9, 12, 17), fill=(52, 70, 110, 255))             # écran
    d.line((4, 10, 6, 10), fill=(150, 190, 230, 255))
    d.point((4, 11), fill=(150, 190, 230, 255))
    d.line((10, 5, 8, 7), fill=(40, 40, 52, 255))                    # antenne
    return img


def console():
    """Console de salon et sa manette, posées sur le meuble (une case, rien ne bloque)."""
    img = canvas()
    d = ImageDraw.Draw(img)
    box(d, 2, 9, 12, 14, (110, 96, 180, 255), (40, 32, 70, 255))
    d.rectangle((3, 10, 11, 10), fill=(150, 140, 220, 255))
    d.point((10, 12), fill=(240, 80, 80, 255))
    d.line((12, 13, 14, 15), fill=(40, 32, 70, 255))
    box(d, 11, 13, 15, 15, (90, 90, 100, 255), (40, 32, 70, 255))
    return img


def low_cabinet():
    """Meuble bas en bois (une case), contre le mur."""
    img = canvas()
    d = ImageDraw.Draw(img)
    d.rectangle((1, 15, 15, 15), fill=(0, 0, 0, 60))
    box(d, 0, 4, 15, 14, (176, 116, 64, 255))
    d.rectangle((1, 5, 14, 6), fill=(214, 160, 96, 255))
    d.line((1, 10, 14, 10), fill=(130, 84, 44, 255))
    d.point((7, 8), fill=(240, 220, 160, 255))
    d.point((7, 12), fill=(240, 220, 160, 255))
    return img


def plush(color):
    """Peluche (un ourson), assise."""
    img = canvas()
    d = ImageDraw.Draw(img)
    light = tuple(min(255, c + 45) for c in color[:3]) + (255,)
    for x in (3, 10):                                                # oreilles
        d.ellipse((x - 1, 1, x + 2, 4), fill=OUT)
        d.point((x, 2), fill=color)
    d.ellipse((3, 2, 12, 9), fill=OUT)                               # tête
    d.ellipse((4, 3, 11, 8), fill=color)
    d.ellipse((5, 5, 9, 8), fill=light)
    d.point((6, 5), fill=OUT)
    d.point((9, 5), fill=OUT)
    d.ellipse((3, 8, 12, 15), fill=OUT)                              # corps
    d.ellipse((4, 9, 11, 14), fill=color)
    d.ellipse((6, 10, 9, 13), fill=light)
    return img


def fruit_bowl():
    """Coupe de fruits des Antilles (mangues, bananes), posée sur la table."""
    img = canvas()
    d = ImageDraw.Draw(img)
    d.ellipse((2, 8, 13, 14), fill=OUT)
    d.ellipse((3, 9, 12, 13), fill=(236, 230, 214, 255))
    for x, c in ((3, (248, 196, 40, 255)), (7, (236, 120, 40, 255)), (9, (120, 190, 60, 255))):
        d.ellipse((x, 5, x + 4, 10), fill=OUT)
        d.ellipse((x + 1, 6, x + 3, 9), fill=c)
    return img


def wood_table(n, light=(214, 160, 96, 255), dark=(150, 96, 52, 255)):
    """Longue table de bois d'une case de haut (le plateau, le chant, deux pieds), sur n cases."""
    img = canvas(n, 1)
    d = ImageDraw.Draw(img)
    w = n * T
    d.rectangle((2, 15, w - 2, 15), fill=(0, 0, 0, 60))
    box(d, 0, 1, w - 1, 10, light)
    d.line((1, 2, w - 2, 2), fill=(236, 196, 132, 255))
    d.rectangle((1, 8, w - 2, 9), fill=dark)
    for x in (1, w - 4):
        d.rectangle((x, 10, x + 2, 14), fill=OUT)
        d.rectangle((x + 1, 10, x + 1, 13), fill=dark)
    return img


def cushion(color):
    """Gros coussin posé par terre."""
    img = canvas()
    d = ImageDraw.Draw(img)
    d.ellipse((1, 6, 14, 15), fill=OUT)
    d.ellipse((2, 7, 13, 14), fill=color)
    d.ellipse((4, 8, 8, 10), fill=tuple(min(255, c + 50) for c in color[:3]) + (255,))
    return img


def descente():
    """Escalier qui descend (ouverture grise de la planche Gen 4, ramenée à une case de large)."""
    src = rect(M, 108, 2849, 24, 31)
    a = src.crop((0, 0, 24, src.height))
    bx0 = (src.width - 24) // 2
    a = src.crop((bx0, 0, bx0 + 24, src.height))
    img = Image.new('RGBA', (T, src.height))
    img.paste(a.crop((0, 0, 4, a.height)), (0, 0))
    img.paste(a.crop((8, 0, 16, a.height)), (4, 0))
    img.paste(a.crop((20, 0, 24, a.height)), (12, 0))
    return img


def montee(width=2):
    """Escalier qui monte, rampes rouges (la maison du héros)."""
    return rect(M, 8, 1304, 32, 40)


# ---------- Meubles ----------
ITEMS = {
    'fsa-carton': {'img': carton, 'solid': 1},
    'fsa-carton-pose': {'img': carton, 'solid': 0, 'flat': True},
    'fsa-caisse-poisson': {'img': lambda: crate('poisson'), 'solid': 1},
    'fsa-caisse-donner': {'img': lambda: crate('donner'), 'solid': 1},
    'fsa-ratelier': {'img': rod_rack, 'solid': 1},
    'fsa-tele': {'img': small_tv, 'solid': 1},
    'fsa-console': {'img': console, 'solid': 0, 'flat': True},
    'fsa-fruits': {'img': fruit_bowl, 'solid': 0, 'flat': True},
    'fsa-coussin-rouge': {'img': lambda: cushion((214, 74, 70, 255)), 'solid': 1},
    'fsa-coussin-bleu': {'img': lambda: cushion((84, 120, 206, 255)), 'solid': 1},
    'fsa-table-2': {'img': lambda: wood_table(2), 'solid': 1},
    'fsa-table-3': {'img': lambda: wood_table(3), 'solid': 1},
    'fsa-table-salle': {'img': lambda: stretch(rect(M, 1, 851, 31, 29), 4), 'solid': 2},
    'fsa-table-attente': {'img': lambda: stretch(rect(M, 1, 851, 31, 29), 4), 'solid': 2},
    'fsa-etagere': {'img': lambda: rect(M, 16, 87, 16, 35), 'solid': 1},
    'fsa-armoire': {'img': lambda: rect(M, 1, 82, 15, 45), 'solid': 1},
    'fsa-vitrine': {'img': lambda: rect(M, 49, 180, 30, 28), 'solid': 1},
    'fsa-bibliotheque': {'img': lambda: rect(M, 80, 2134, 32, 42), 'solid': 1},
    'fsa-tele-meuble': {'img': lambda: rect(M, 64, 2534, 32, 30), 'solid': 1},
    'fsa-cuisine': {'img': lambda: rect(M, 2, 2705, 42, 30), 'solid': 1},
    'fsa-frigo': {'img': lambda: rect(M, 81, 467, 15, 29), 'solid': 1},
    'fsa-fenetre': {'img': lambda: rect(M, 12, 188, 24, 20), 'solid': 0, 'dy': -8},
    'fsa-plante-haute': {'img': lambda: rect(M, 48, 917, 16, 43), 'solid': 1},
    'fsa-plante-pot': {'img': lambda: rect(M, 32, 928, 16, 32), 'solid': 1},
    'fsa-plante-grasse': {'img': lambda: rect(M, 112, 3653, 16, 27), 'solid': 1},
    'fsa-bureau-pc': {'img': lambda: rect(M, 49, 2130, 30, 30), 'solid': 1},
    'fsa-pc-accueil': {'img': lambda: rect(M, 128, 2534, 32, 30), 'solid': 1},
    'fsa-lit-bleu': {'img': lambda: rect(M, 11, 1128, 30, 40), 'solid': 2},
    'fsa-lit-lavande': {'img': lambda: rect(M, 61, 1128, 28, 40), 'solid': 2},
    'fsa-lit-rose': {'img': lambda: rect(M, 107, 1128, 30, 40), 'solid': 2},
    'fsa-lit-blanc': {'img': lambda: rect(M, 11, 1176, 30, 40), 'solid': 2},
    'fsa-lit-enfant': {'img': lambda: rect(M, 122, 2144, 29, 32, width=2), 'solid': 2},
    'fsa-tapis': {'img': lambda: rect(M, 48, 4528, 46, 46), 'solid': 0, 'flat': True},
    'fsa-meuble-bas': {'img': low_cabinet, 'solid': 1},
    'fsa-carte': {'img': lambda: rect(M, 0, 3768, 32, 21), 'solid': 0, 'dy': -6},
    'fsa-tableau': {'img': lambda: rect(M, 32, 3769, 16, 19), 'solid': 0, 'dy': -6},
    'fsa-plage': {'img': lambda: rect(M, 48, 3767, 32, 22), 'solid': 0, 'dy': -6},
    'fsa-affiche': {'img': lambda: rect(M, 80, 3769, 16, 18), 'solid': 0, 'dy': -6},
    'fsa-note': {'img': lambda: rect(M, 96, 3764, 16, 24), 'solid': 0, 'dy': -4},
    'fsa-ourson': {'img': lambda: plush((170, 110, 60, 255)), 'solid': 0, 'flat': True},
    'fsa-ourson-rose': {'img': lambda: plush((230, 140, 170, 255)), 'solid': 0, 'flat': True},
    'fsa-cuisine-2': {'img': lambda: rect(M, 2, 2705, 30, 30), 'solid': 1},
    'fsa-coussins': {'img': lambda: rect(M, 49, 513, 15, 15), 'solid': 1},
    'fsa-commode': {'img': lambda: rect(M, 1, 851, 31, 29), 'solid': 1},
    'fsa-montee': {'img': montee, 'solid': [[0, 0], [0, 0], [1, 0]], 'flat': True},
    'fsa-descente': {'img': descente, 'solid': 0, 'flat': True},
}

# Lits où dort un PNJ (`inBed`) : la couverture reste au décor (rien au-dessus de Pierre, qui passe devant le lit) ;
# le jeu couche le PNJ la tête sur l'oreiller.
SLEEP = {'bed': True, 'cover': 99, 'pillow': 6}


# ---------- Pièces ----------
PLANS = {
    # Fort-de-France — maison familiale, rez-de-chaussée : murs jaune pâle, parquet clair ; étagère et vitrine, la télé
    # et la console de Manon, la cuisine (un carton posé sur le plan de travail) et le frigo au mur du fond ; la table
    # du salon et sa coupe de fruits ; l'escalier qui monte, à droite ; des cartons partout.
    'ffHouse': {
        'wall': 'jaune', 'floor': 'parquet-clair',
        'items': [
            ['fsa-etagere', 0, 2], ['fsa-vitrine', 1, 2], ['fsa-fenetre', 3, 1], ['fsa-tele', 3, 2],
            ['fsa-meuble-bas', 4, 2], ['fsa-console', 4, 2, {'dy': -9}], ['fsa-plage', 9, 1],
            ['fsa-cuisine', 5, 2], ['fsa-carton-pose', 5, 2, {'dy': -8}], ['fsa-frigo', 8, 2],
            ['escalier-monte-clair', 10, 2],
            ['fsa-plante-haute', 0, 5, {'solid': 2}],
            ['fsa-table-salle', 4, 5], ['fsa-fruits', 5, 4, {'dy': -6}],
            ['fsa-carton', 1, 3], ['fsa-carton', 2, 7],
            ['fsa-plante-grasse', 10, 7, {'flat': True}], ['fsa-carton', 10, 6],
        ],
    },
    # Fort-de-France — la chambre de Pierre et Manon : deux lits (bleu, rose), le bureau avec l'ordinateur et un petit
    # carton dessus, une plante ; l'escalier qui descend ; des cartons.
    'ffHouseUp': {
        'wall': 'creme', 'floor': 'parquet-clair',
        'items': [
            ['fsa-tableau', 0, 1], ['fsa-fenetre', 4, 1],
            ['fsa-lit-bleu', 0, 3], ['fsa-bureau-pc', 2, 2], ['fsa-carton-pose', 3, 2, {'dy': -12}],
            ['fsa-lit-rose', 4, 3], ['fsa-plante-grasse', 6, 2],
            ['fsa-carton', 6, 3], ['escalier-descend-clair', 8, 2],
            ['fsa-carton', 0, 5], ['fsa-carton', 3, 5], ['fsa-carton', 8, 5],
        ],
    },
    # Fort-de-France — la cabane de pêche de Papa : planches, fenêtre et panneau ; le râtelier des cannes à gauche,
    # caisses de poisson et carton au fond, la caisse « À DONNER » en bas à gauche, une plante.
    'ffHut': {
        'wall': 'bois', 'floor': 'planches-sombres',
        'items': [
            ['fsa-fenetre', 2, 1], ['fsa-note', 4, 1], ['fsa-ratelier', 0, 2],
            ['fsa-caisse-poisson', 3, 2], ['fsa-caisse-poisson', 4, 2], ['fsa-carton', 5, 2],
            ['fsa-plante-haute', 6, 4, {'solid': 2}],
            ['fsa-caisse-donner', 0, 4], ['fsa-carton', 6, 5],
        ],
    },
    # Saint-Ay — la maison de la famille : murs crème, parquet ; la cuisine et le frigo à gauche, une fenêtre, la télé à
    # droite et l'escalier qui monte ; la table de la salle à manger au milieu, deux plantes.
    'playerHouse': {
        'wall': 'creme', 'floor': 'parquet',
        'items': [
            ['fsa-cuisine-2', 0, 2], ['fsa-frigo', 2, 2], ['fsa-fenetre', 4, 1],
            ['fsa-plante-grasse', 6, 2], ['fsa-tele', 7, 2], ['escalier-monte', 9, 2],
            ['fsa-table-salle', 3, 5], ['fsa-fruits', 4, 4, {'dy': -6}],
            ['fsa-plante-haute', 0, 5], ['fsa-plante-haute', 9, 5],
        ],
    },
    # Saint-Ay — la chambre des enfants : trois lits (Pierre en bleu, Manon en rose, Fanny dans son petit lit), fenêtre
    # et tableau, deux plantes ; l'escalier qui descend.
    'playerHouseUp': {
        'wall': 'papier-peint', 'floor': 'parquet-clair',
        'items': [
            ['fsa-fenetre', 2, 1], ['fsa-tableau', 7, 1],
            ['fsa-lit-bleu', 0, 3], ['fsa-lit-rose', 3, 3], ['fsa-lit-enfant', 6, 3, SLEEP],
            ['escalier-descend', 9, 2],
            ['fsa-plante-grasse', 0, 5], ['fsa-plante-grasse', 9, 5],
        ],
        'npc_on_solid': ['fanny-lit'],
    },
    # Saint-Ay — la maison de Felix : murs menthe, damier de bois ; armoire et étagère, la télé et la console, une
    # fenêtre, la bibliothèque ; la table au milieu, une plante.
    'felixHouse': {
        'wall': 'menthe', 'floor': 'damier-bois',
        'items': [
            ['fsa-armoire', 0, 2], ['fsa-etagere', 1, 2], ['fsa-tele', 4, 2],
            ['fsa-meuble-bas', 5, 2], ['fsa-console', 5, 2, {'dy': -9}], ['fsa-fenetre', 6, 1], ['fsa-bibliotheque', 8, 2],
            ['fsa-table-salle', 3, 5], ['fsa-plante-haute', 0, 6, {'solid': 2}],
        ],
    },
    # Saint-Ay — la cabane des cousins : planches ; la commode et sa plante contre le mur, un tableau ; deux longues
    # tables (Felix derrière la première, Joshua et Yanis derrière la seconde) avec des peluches entre elles ; un tapis
    # et deux gros coussins.
    'cabane': {
        'wall': 'bois', 'floor': 'bois-roux',
        'items': [
            ['fsa-tableau', 1, 1], ['fsa-carte', 5, 1],
            ['fsa-meuble-bas', 3, 2], ['fsa-meuble-bas', 4, 2], ['fsa-plante-grasse', 4, 2, {'dy': -9, 'flat': True}],
            ['fsa-tapis', 2, 6],
            ['fsa-table-3', 0, 3], ['fsa-coussins', 3, 3], ['fsa-ourson', 3, 3, {'dy': -6}],
            ['fsa-coussins', 4, 3], ['fsa-ourson-rose', 4, 3, {'dy': -6}], ['fsa-table-3', 5, 3],
            ['fsa-coussin-rouge', 0, 5], ['fsa-coussin-bleu', 7, 5],
        ],
    },
    # Saint-Ay — la clinique : murs vert d'eau, carrelage blanc ; trois lits (Maman, Fanny, un lit libre), une fenêtre et
    # le panneau d'affichage ; le poste d'accueil avec son ordinateur à droite ; la table de la salle d'attente, des
    # plantes.
    'hospital': {
        'wall': 'menthe', 'floor': 'carrelage',
        'items': [
            ['fsa-fenetre', 3, 1], ['fsa-affiche', 10, 1], ['fsa-tableau', 7, 1],
            ['fsa-lit-blanc', 0, 3, SLEEP], ['fsa-lit-blanc', 3, 3, SLEEP], ['fsa-lit-lavande', 6, 3],
            ['fsa-pc-accueil', 12, 2],
            ['fsa-table-attente', 5, 6],
            ['fsa-plante-haute', 0, 7, {'solid': 2}], ['fsa-plante-haute', 13, 7, {'solid': 2}],
        ],
        'npc_on_solid': ['maman-hopital', 'fanny-hopital'],
    },
}
