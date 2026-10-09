"""Intérieurs HGSS : Paris (l'appartement, la tour de bureaux sur trois étages). Voir scripts/interieurs_plans.py et
docs/technique/interieurs-gen4.md. Les meubles dessinés ici (bouddhas, autels, lampes à beurre, moulins à prières,
thangkas, drapeaux de prières, batterie et micro, coffre) servaient aux pièces d'après Paris, retirées en octobre 2026 :
ils restent pour le catalogue d'intérieurs (scripts/interieurs/catalogue_int.py).

Chaque pièce part d'une vraie pièce de HeartGold / SoulSilver (pack de SirMaIo, scripts/hgss_rooms.py), retouchée :
'erase' (meubles retirés), 'paste' (morceaux d'autres pièces HGSS : portes d'ascenseur de la Tour Radio, murs, tapis de
sortie), meubles des planches du pack (interieurs_plans.sirmaio). Ne sont dessinés ici que ce que les jeux n'ont pas :
bouddhas, autels, lampes à beurre, moulins à prières, thangkas, drapeaux de prières, batterie et micro de Bercy, coffre
de Bali.
"""
from PIL import Image, ImageDraw

from interieurs_plans import *  # noqa: F401,F403
from interieurs_plans import T, sirmaio, stretch

RADIO = '012i_Goldenrod radio tower'
GOLD = '012i_Goldenrod interiors'
SPROUT = '006i_Sprout Tower'
# Morceau à coller : les portes rouges de l'ascenseur de la Tour Radio (3 x 2).
ELEVATOR_DOORS = (RADIO, 21, 29, 3, 2)


def hgss_layer(name, layer, x0, y0, w, h):
    """Un seul calque d'une pièce HGSS (ex. le tapis de sortie, dessiné dans le calque de sol Floor_B), en image."""
    import hgss_rooms as HG
    m = HG.load(name)
    cells = next(c for n, _, c, _ in m['layers'] if n == layer)
    img = Image.new('RGBA', (w * T, h * T))
    for y in range(h):
        for x in range(w):
            t = HG.tile_image(m, cells.get((x0 + x, y0 + y), 0))
            if t is not None:
                img.alpha_composite(t, (x * T, y * T))
    return img


# ---------- Ce que les jeux n'ont pas (style Gen 4 : contour sombre, deux ou trois tons) ----------
def canvas(w, h):
    img = Image.new('RGBA', (w * T, h * T))
    return img, ImageDraw.Draw(img)


OUT = (40, 36, 40, 255)


def chest():
    """Coffre en bois cerclé de fer (2 x 1)."""
    img, d = canvas(2, 1)
    d.rectangle((2, 3, 29, 15), fill=OUT)
    d.rectangle((3, 4, 28, 14), fill=(150, 96, 48, 255))
    d.rectangle((3, 4, 28, 7), fill=(186, 126, 66, 255))
    d.line((3, 8, 28, 8), fill=OUT)
    for x in (7, 24):
        d.rectangle((x, 4, x + 1, 14), fill=(110, 110, 120, 255))
    d.rectangle((14, 7, 17, 11), fill=(240, 200, 70, 255))
    d.point((15, 9), fill=OUT)
    return img


def buddha(gold=True):
    """Bouddha assis, doré (2 x 2), posé sur l'autel."""
    img, d = canvas(2, 2)
    body = (226, 172, 58, 255) if gold else (236, 232, 222, 255)
    shade = (176, 120, 34, 255) if gold else (190, 184, 170, 255)
    light = (252, 222, 120, 255) if gold else (252, 252, 248, 255)
    d.ellipse((4, 18, 27, 31), fill=OUT)                # jambes croisées
    d.ellipse((5, 19, 26, 30), fill=shade)
    d.ellipse((8, 9, 23, 27), fill=OUT)                 # buste
    d.ellipse((9, 10, 22, 26), fill=body)
    d.ellipse((11, 1, 20, 11), fill=OUT)                # tête
    d.ellipse((12, 2, 19, 10), fill=body)
    d.ellipse((14, 0, 17, 3), fill=OUT)
    d.point((15, 1), fill=shade)
    d.ellipse((13, 21, 18, 25), fill=light)             # mains jointes
    d.point((14, 4), fill=light)
    d.line((11, 13, 12, 20), fill=light)
    return img


def altar(w=4, color=(170, 40, 36, 255)):
    """Autel bas (w x 1) : nappe rouge bordée d'or."""
    img, d = canvas(w, 1)
    W = w * T
    d.rectangle((1, 2, W - 2, 15), fill=OUT)
    d.rectangle((2, 3, W - 3, 14), fill=color)
    d.rectangle((2, 3, W - 3, 5), fill=(236, 190, 70, 255))
    d.line((2, 12, W - 3, 12), fill=(236, 190, 70, 255))
    return img


def butter_lamp():
    """Lampe à beurre (coupelle de laiton et flamme), une case."""
    img, d = canvas(1, 1)
    d.polygon([(3, 9), (12, 9), (10, 14), (5, 14)], fill=OUT)
    d.polygon([(4, 10), (11, 10), (9, 13), (6, 13)], fill=(226, 176, 60, 255))
    d.ellipse((6, 2, 9, 8), fill=(248, 140, 40, 255))
    d.ellipse((7, 4, 8, 7), fill=(255, 236, 140, 255))
    return img


def lamp_row(n=4):
    """Rangée de lampes à beurre sur l'autel (n cases, au-dessus de la nappe)."""
    img, d = canvas(n, 1)
    lamp = butter_lamp().crop((2, 2, 14, 15))
    for k in range(n * 2):
        img.alpha_composite(lamp.resize((8, 9), Image.NEAREST), (k * 8, 7))
    return img


def incense():
    """Brûle-parfum de laiton avec trois bâtons d'encens (une case)."""
    img, d = canvas(1, 1)
    d.ellipse((2, 9, 13, 15), fill=OUT)
    d.ellipse((3, 10, 12, 14), fill=(196, 150, 60, 255))
    for x in (5, 8, 11):
        d.line((x, 3, x - 1, 10), fill=(120, 60, 40, 255))
        d.point((x, 2), fill=(250, 120, 60, 255))
    return img


def lotus():
    """Offrande de fleurs de lotus dans un bol (une case)."""
    img, d = canvas(1, 1)
    d.ellipse((2, 9, 13, 15), fill=OUT)
    d.ellipse((3, 10, 12, 14), fill=(236, 232, 222, 255))
    for x, y in ((4, 6), (8, 4), (11, 7)):
        d.ellipse((x - 3, y - 3, x + 3, y + 3), fill=(232, 120, 160, 255))
        d.point((x, y), fill=(255, 220, 230, 255))
    return img


def prayer_wheel():
    """Moulin à prières doré (une case de large, deux de haut)."""
    img, d = canvas(1, 2)
    d.rectangle((7, 2, 8, 30), fill=OUT)
    d.rectangle((2, 8, 13, 24), fill=OUT)
    d.rectangle((3, 9, 12, 23), fill=(220, 168, 56, 255))
    for y in (12, 16, 20):
        d.line((3, y, 12, y), fill=(160, 40, 36, 255))
    d.line((4, 9, 4, 23), fill=(252, 220, 120, 255))
    d.rectangle((4, 28, 11, 31), fill=OUT)
    return img


def thangka():
    """Tenture peinte (thangka) au mur, 1 x 2."""
    img, d = canvas(1, 2)
    d.rectangle((1, 2, 14, 29), fill=OUT)
    d.rectangle((2, 3, 13, 28), fill=(180, 50, 40, 255))
    d.rectangle((4, 6, 11, 22), fill=(236, 206, 120, 255))
    d.ellipse((5, 9, 10, 15), fill=(60, 120, 170, 255))
    d.ellipse((5, 15, 10, 21), fill=(220, 160, 50, 255))
    d.line((1, 1, 14, 1), fill=(120, 80, 40, 255))
    return img


def flags_prayer(n):
    """Guirlande de drapeaux de prière tibétains (n cases, en haut du mur)."""
    img, d = canvas(n, 1)
    W = n * T
    d.line((0, 3, W, 3), fill=OUT)
    colors = [(60, 110, 200), (240, 240, 236), (200, 50, 40), (60, 160, 80), (240, 200, 50)]
    for k, x in enumerate(range(1, W - 4, 6)):
        c = colors[k % 5]
        d.rectangle((x, 4, x + 4, 10), fill=OUT)
        d.rectangle((x + 1, 4, x + 3, 9), fill=c + (255,))
    return img


def speaker(h=2):
    """Pile d'enceintes noires (1 x h)."""
    img, d = canvas(1, h)
    for k in range(h):
        y = k * T
        d.rectangle((1, y + 1, 14, y + 15), fill=OUT)
        d.rectangle((2, y + 2, 13, y + 14), fill=(58, 58, 66, 255))
        d.ellipse((4, y + 4, 11, y + 11), fill=(24, 24, 28, 255))
        d.ellipse((6, y + 6, 9, y + 9), fill=(110, 110, 124, 255))
    return img


def drums():
    """Batterie (2 x 1) : grosse caisse, caisses claires, cymbales."""
    img, d = canvas(2, 1)
    d.ellipse((9, 4, 22, 15), fill=OUT)
    d.ellipse((10, 5, 21, 14), fill=(200, 50, 50, 255))
    d.ellipse((12, 7, 19, 12), fill=(240, 236, 226, 255))
    for x in (2, 23):
        d.ellipse((x, 6, x + 7, 11), fill=OUT)
        d.ellipse((x + 1, 7, x + 6, 10), fill=(200, 50, 50, 255))
    for x in (0, 24):
        d.ellipse((x, 0, x + 8, 3), fill=(236, 196, 70, 255))
    return img


def mic():
    """Pied de micro (une case)."""
    img, d = canvas(1, 1)
    d.line((8, 3, 8, 14), fill=OUT)
    d.ellipse((6, 1, 10, 5), fill=(70, 70, 80, 255))
    d.line((5, 15, 11, 15), fill=OUT)
    return img


def stage(w=9, h=3):
    """Estrade de salle de concert (w x h cases), au style des planchers DS : plateau en planches (h - 1 rangées), nez
    doré à petites lampes de rampe, devant en bois sombre à panneaux."""
    img, d = canvas(w, h)
    W, top = w * T, (h - 1) * T
    d.rectangle((0, 0, W - 1, top + T - 1), fill=OUT)
    d.rectangle((1, 1, W - 2, top - 1), fill=(214, 168, 110, 255))                  # plateau
    for y in range(4, top, 5):
        d.line((1, y, W - 2, y), fill=(178, 130, 82, 255))                           # joints des planches
        d.line((1, y + 1, W - 2, y + 1), fill=(232, 196, 140, 255))
    for k, y in enumerate(range(1, top, 5)):
        for x in range(9 + (k % 2) * 13, W - 2, 26):
            d.line((x, y, x, min(top - 1, y + 3)), fill=(178, 130, 82, 255))         # bouts des planches
    d.rectangle((1, top, W - 2, top + 2), fill=(232, 192, 80, 255))                  # nez doré
    d.line((1, top + 3, W - 2, top + 3), fill=(150, 108, 40, 255))
    d.rectangle((1, top + 4, W - 2, top + T - 2), fill=(132, 80, 46, 255))           # devant
    for x in range(8, W - 2, 16):
        d.line((x, top + 5, x, top + T - 3), fill=(98, 58, 32, 255))                 # panneaux
        d.rectangle((x - 1, top, x + 1, top + 1), fill=(255, 244, 170, 255))         # lampes de rampe
    return img


# ---------- Meubles ----------
ITEMS = {
    # Planches du pack HGSS (SirMaIo).
    'pv-comptoir-cafe': {'img': lambda: sirmaio('i_Olivine-Café', 0, 6, 3, 2), 'solid_top': 1},
    'pv-caisse': {'img': lambda: sirmaio('i_Olivine-Café', 4, 11, 1, 1, iso=True), 'solid': 0, 'flat': True},
    'pv-assiette': {'img': lambda: sirmaio('i_Olivine-Café', 4, 8, 1, 1, iso=True), 'solid': 0, 'flat': True},
    'pv-sauce': {'img': lambda: sirmaio('i_Olivine-Café', 5, 8, 1, 2, iso=True), 'solid': 0, 'flat': True},
    'pv-plante-cafe': {'img': lambda: sirmaio('i_Olivine-Café', 7, 6, 1, 2), 'solid': 1},
    'pv-menu': {'img': lambda: sirmaio('i_Olivine-Café', 7, 1, 1, 1, iso=True), 'solid': 0},
    # Le tapis de sortie rouge d'une maison de Doublonville (calque Floor_B).
    'pv-tapis-sortie': {'img': lambda: hgss_layer(GOLD, 'Floor_B_1', 49, 15, 3, 1), 'solid': 0, 'flat': True},
    # Dessinés ici.
    'pv-coffre': {'img': chest, 'solid': 1},
    'pv-bouddha': {'img': buddha, 'solid': 0},
    'pv-bouddha-blanc': {'img': lambda: buddha(False), 'solid': 0},
    'pv-autel': {'img': altar, 'solid': 1},
    'pv-autel-or': {'img': lambda: altar(4, (200, 150, 40, 255)), 'solid': 1},
    'pv-lampes': {'img': lamp_row, 'solid': 0, 'flat': True},
    'pv-lampe-beurre': {'img': butter_lamp, 'solid': 1},
    'pv-encens': {'img': incense, 'solid': 1},
    'pv-lotus': {'img': lotus, 'solid': 0, 'flat': True},
    'pv-moulin': {'img': prayer_wheel, 'solid': 1},
    'pv-thangka': {'img': thangka, 'solid': 0},
    'pv-drapeaux-8': {'img': lambda: flags_prayer(8), 'solid': 0},
    'pv-enceinte': {'img': speaker, 'solid': 1},
    'pv-batterie': {'img': drums, 'solid': 0, 'flat': True},
    'pv-micro': {'img': mic, 'solid': 0, 'flat': True},
    'pv-scene': {'img': stage, 'solid': 3, 'flat': True},
}


# ---------- Pièces ----------
PLANS = {
    # Paris — ton appartement : le salon de M. Pokémon (aquarium, lit, ordinateur et ses câbles, table, bibliothèque).
    'parisAppart': {'hgss': ('004i_Mr Pokémon House', 10, 8, 12, 9)},
    # Paris — l'entreprise, rez-de-chaussée : le hall de la Tour Radio (accueil en U, grand tapis, salon) ; l'escalier
    # remplacé par les portes rouges de l'ascenseur (22..24, 0..1).
    'entreprise': {
        'hgss': (RADIO, 10, 111, 25, 12),
        'erase': [(23, 0, 2, 4)],
        'paste': [{'from': (RADIO, 30, 111, 2, 2), 'to': (23, 0)}, {'from': ELEVATOR_DOORS, 'to': (22, 0)}],
    },
    # Paris — 1er étage : un plateau de bureaux de la Tour Radio ; l'ascenseur en haut à gauche (0..2, 0..1).
    'entrepriseManager': {
        'hgss': (RADIO, 10, 71, 14, 12),
        'erase': [(0, 0, 2, 4)],
        'paste': [{'from': (RADIO, 14, 71, 2, 2), 'to': (0, 0)}, {'from': ELEVATOR_DOORS, 'to': (0, 0)}],
    },
    # Paris — dernier étage : le bureau du directeur de la Tour Radio (tapis rouge, plantes, grand bureau).
    'entrepriseDirecteur': {
        'hgss': (RADIO, 10, 31, 9, 12),
        'erase': [(0, 0, 2, 4)],
        'paste': [{'from': (RADIO, 13, 31, 2, 2), 'to': (0, 0)}, {'from': ELEVATOR_DOORS, 'to': (0, 0)}],
    },
}
