"""Intérieurs Gen 4 : Paris (bistrot, appartement, entreprise sur trois étages, Bercy), Toulon (Yanis), Corse (les
parents, les voisins), Bali (la cabane), Sri Lanka, Thaïlande et Népal (temples). Voir scripts/interieurs_plans.py.

Les pièces bordées de 'X' (Toulon, Corse, Bali, temples, Bercy) prennent leur rangée 1 pour mur (`void`) : un mur de
deux rangées comme ailleurs ; ce qui y était (lits, autels, coffres) est posé contre ce mur.
"""
from PIL import Image, ImageDraw

from interieurs_plans import *  # noqa: F401,F403
from interieurs_plans import T, rect, stretch, WALLS, dppt_wall


def m(i, width=None, align='bottom'):
    """Élément n° i de g4-int-meubles, d'un seul tenant, rogné et posé dans le moins de cases possible."""
    import json
    c0, r0, c1, r1 = json.loads((V2 / 'g4-int-meubles.elements.json').read_text())['elements'][i]
    return rect('g4-int-meubles', c0 * T, r0 * T, (c1 - c0 + 1) * T, (r1 - r0 + 1) * T, align=align, width=width)


def canvas(w, h):
    img = Image.new('RGBA', (w * T, h * T))
    return img, ImageDraw.Draw(img)


OUT = (40, 36, 40, 255)


# ---------- Petits dessins dans le style Gen 4 (contour sombre, deux ou trois tons) ----------
def elevator():
    """Portes d'ascenseur en acier (2 x 2), voyant au-dessus."""
    img, d = canvas(2, 2)
    d.rectangle((1, 1, 30, 31), fill=OUT)
    d.rectangle((2, 2, 29, 31), fill=(150, 156, 166, 255))
    d.rectangle((4, 7, 27, 31), fill=OUT)
    for x0 in (5, 16):
        d.rectangle((x0, 8, x0 + 10, 31), fill=(196, 202, 212, 255))
        d.rectangle((x0 + 1, 9, x0 + 2, 30), fill=(228, 232, 240, 255))
    d.line((15, 8, 15, 31), fill=OUT)
    d.rectangle((12, 3, 19, 5), fill=(32, 32, 40, 255))
    d.point((14, 4), fill=(240, 200, 60, 255))
    d.point((17, 4), fill=(240, 200, 60, 255))
    return img


def mirror(w=2):
    """Grand miroir de bistrot au cadre doré (w x 2, au mur)."""
    img, d = canvas(w, 2)
    W = w * T
    d.rectangle((1, 2, W - 2, 29), fill=(120, 84, 30, 255))
    d.rectangle((2, 3, W - 3, 28), fill=(222, 178, 82, 255))
    d.rectangle((4, 5, W - 5, 26), fill=(150, 186, 196, 255))
    for k in range(3):
        d.line((8 + k * 8, 24, 16 + k * 8, 8), fill=(206, 228, 232, 255))
    return img


def chalk_menu():
    """Ardoise du menu (au mur)."""
    img, d = canvas(1, 1)
    d.rectangle((1, 1, 14, 14), fill=(110, 72, 40, 255))
    d.rectangle((2, 2, 13, 13), fill=(48, 60, 56, 255))
    for y in (4, 7, 10):
        d.line((4, y, 11, y), fill=(220, 220, 210, 255))
    return img


def bistro_table():
    """Petite table ronde de bistrot (marbre, pied en fonte), une case."""
    img, d = canvas(1, 1)
    d.ellipse((1, 3, 14, 10), fill=OUT)
    d.ellipse((2, 4, 13, 9), fill=(236, 232, 222, 255))
    d.ellipse((4, 5, 9, 7), fill=(250, 250, 246, 255))
    d.rectangle((7, 10, 8, 14), fill=OUT)
    d.rectangle((4, 14, 11, 15), fill=OUT)
    return img


def bistro_chair():
    """Chaise bistrot en rotin (une case)."""
    img, d = canvas(1, 1)
    d.rectangle((3, 1, 12, 6), fill=OUT)
    d.rectangle((4, 2, 11, 5), fill=(196, 138, 70, 255))
    d.line((4, 3, 11, 3), fill=(150, 98, 46, 255))
    d.rectangle((3, 7, 12, 10), fill=OUT)
    d.rectangle((4, 8, 11, 9), fill=(214, 160, 90, 255))
    d.line((4, 11, 4, 15), fill=OUT)
    d.line((11, 11, 11, 15), fill=OUT)
    return img


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


def stage(w):
    """Scène de concert (w x 2) : plancher sombre et nez de scène."""
    img, d = canvas(w, 2)
    W = w * T
    d.rectangle((0, 0, W - 1, 31), fill=(66, 54, 52, 255))
    for y in range(0, 26, 6):
        d.line((0, y, W - 1, y), fill=(52, 42, 40, 255))
    for x in range(0, W, 24):
        d.line((x, 0, x, 25), fill=(52, 42, 40, 255))
    d.rectangle((0, 26, W - 1, 31), fill=(28, 24, 30, 255))
    d.line((0, 26, W - 1, 26), fill=(236, 190, 70, 255))
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


def amp_row(n):
    """Rangée d'amplis et d'enceintes du fond de scène (n x 1)."""
    img, d = canvas(n, 1)
    for k in range(n):
        x = k * T
        d.rectangle((x + 1, 2, x + 14, 15), fill=OUT)
        d.rectangle((x + 2, 3, x + 13, 14), fill=(54, 54, 62, 255) if k % 2 else (40, 40, 48, 255))
        d.rectangle((x + 3, 5, x + 12, 12), fill=(28, 28, 32, 255))
        d.point((x + 4, 4), fill=(240, 80, 60, 255))
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


def spotlights(n):
    """Rampe de projecteurs colorés accrochée en haut du mur (n x 1)."""
    img, d = canvas(n, 1)
    W = n * T
    d.rectangle((0, 1, W - 1, 3), fill=(80, 80, 90, 255))
    colors = [(255, 90, 160), (80, 200, 255), (255, 220, 80), (170, 110, 255)]
    for k, x in enumerate(range(4, W - 4, 12)):
        d.rectangle((x, 4, x + 6, 10), fill=OUT)
        d.ellipse((x + 1, 7, x + 5, 11), fill=colors[k % 4] + (255,))
    return img


def screen(w):
    """Écran géant au-dessus de la scène (w x 1)."""
    img, d = canvas(w, 1)
    W = w * T
    d.rectangle((2, 1, W - 3, 14), fill=OUT)
    d.rectangle((3, 2, W - 4, 13), fill=(40, 60, 120, 255))
    for x in range(6, W - 8, 10):
        d.rectangle((x, 5, x + 4, 10), fill=(110, 170, 240, 255))
    return img


def barrier(w):
    """Barrière de sécurité devant la scène (w x 1)."""
    img, d = canvas(w, 1)
    W = w * T
    d.rectangle((0, 6, W - 1, 8), fill=OUT)
    d.rectangle((0, 7, W - 1, 7), fill=(170, 176, 186, 255))
    for x in range(1, W, 8):
        d.rectangle((x, 6, x + 1, 15), fill=OUT)
    d.rectangle((0, 13, W - 1, 14), fill=OUT)
    return img


def laptop_desk():
    """Petit bureau avec ordinateur portable (une case)."""
    img, d = canvas(1, 1)
    d.rectangle((0, 6, 15, 15), fill=OUT)
    d.rectangle((1, 7, 14, 10), fill=(196, 150, 96, 255))
    d.rectangle((1, 11, 14, 14), fill=(150, 104, 60, 255))
    d.rectangle((3, 1, 12, 7), fill=OUT)
    d.rectangle((4, 2, 11, 6), fill=(110, 170, 230, 255))
    return img


def plant_pot_med():
    """Citronnier en pot de terre cuite (1 x 2)."""
    img, d = canvas(1, 2)
    d.ellipse((1, 2, 14, 18), fill=(40, 90, 50, 255))
    d.ellipse((2, 3, 13, 17), fill=(70, 150, 70, 255))
    for x, y in ((5, 7), (9, 11), (10, 5), (4, 13)):
        d.ellipse((x - 1, y - 1, x + 1, y + 1), fill=(248, 220, 60, 255))
    d.rectangle((7, 17, 8, 22), fill=(110, 70, 40, 255))
    d.polygon([(3, 22), (12, 22), (11, 31), (4, 31)], fill=OUT)
    d.polygon([(4, 23), (11, 23), (10, 30), (5, 30)], fill=(200, 110, 70, 255))
    return img


def pendulum_clock():
    """Horloge comtoise (corse), 1 x 2."""
    img, d = canvas(1, 2)
    d.rectangle((3, 0, 12, 31), fill=OUT)
    d.rectangle((4, 1, 11, 30), fill=(140, 90, 50, 255))
    d.ellipse((5, 2, 10, 8), fill=(240, 236, 222, 255))
    d.rectangle((6, 11, 9, 24), fill=(90, 56, 30, 255))
    d.ellipse((6, 19, 9, 22), fill=(236, 190, 70, 255))
    return img


def bamboo_wall():
    """Mur de bambou (face et soubassement)."""
    tile = Image.new('RGBA', (T, 2 * T))
    d = ImageDraw.Draw(tile)
    for k, x in enumerate((0, 5, 10)):
        base = (196, 180, 96, 255) if k % 2 else (176, 160, 80, 255)
        d.rectangle((x, 0, x + 4, 2 * T - 1), fill=base)
        d.line((x, 0, x, 2 * T - 1), fill=(120, 104, 50, 255))
        d.line((x + 1, 0, x + 1, 2 * T - 1), fill=(222, 210, 140, 255))
        for y in ((k * 7) % 13, (k * 7) % 13 + 13, (k * 7) % 13 + 26):
            if y < 2 * T:
                d.line((x, y, x + 4, y), fill=(120, 104, 50, 255))
    d.rectangle((15, 0, 15, 2 * T - 1), fill=(120, 104, 50, 255))
    d.rectangle((0, 2 * T - 3, T - 1, 2 * T - 1), fill=(100, 70, 40, 255))
    return [[tile.crop((0, 0, T, T))], [tile.crop((0, T, T, 2 * T))]]


def stone_wall():
    """Mur de pierres sèches corses (face) et soubassement de bois."""
    tile = Image.new('RGBA', (T, 2 * T), (150, 140, 124, 255))
    d = ImageDraw.Draw(tile)
    stones = [(0, 0, 8, 6), (9, 0, 15, 5), (0, 7, 5, 13), (6, 6, 15, 12), (0, 14, 9, 20), (10, 13, 15, 20),
              (0, 21, 6, 25), (7, 21, 15, 25)]
    for k, (x0, y0, x1, y1) in enumerate(stones):
        d.rectangle((x0, y0, x1, y1), fill=(96, 88, 78, 255))
        d.rectangle((x0 + 1, y0 + 1, x1 - 1, y1 - 1), fill=(186, 176, 156, 255) if k % 2 else (166, 156, 138, 255))
        d.line((x0 + 1, y0 + 1, x1 - 1, y0 + 1), fill=(210, 202, 184, 255))
    d.rectangle((0, 26, 15, 31), fill=(110, 72, 40, 255))
    d.line((0, 26, 15, 26), fill=(60, 40, 24, 255))
    d.line((0, 28, 15, 28), fill=(140, 96, 56, 255))
    return [[tile.crop((0, 0, T, T))], [tile.crop((0, T, T, 2 * T))]]


def temple_wall(base, trim):
    """Mur de temple peint (face unie, frise dorée, soubassement)."""
    tile = Image.new('RGBA', (T, 2 * T), base + (255,))
    d = ImageDraw.Draw(tile)
    d.rectangle((0, 0, 15, 2), fill=trim + (255,))
    d.rectangle((0, 3, 15, 3), fill=(60, 40, 30, 255))
    for x in range(0, 16, 4):
        d.polygon([(x, 4), (x + 3, 4), (x + 1, 7)], fill=trim + (255,))
    d.rectangle((0, 22, 15, 31), fill=tuple(int(c * 0.6) for c in base) + (255,))
    d.line((0, 22, 15, 22), fill=trim + (255,))
    d.line((0, 31, 15, 31), fill=(40, 30, 26, 255))
    return [[tile.crop((0, 0, T, T))], [tile.crop((0, T, T, 2 * T))]]


def window(w=2):
    """Fenêtre à petits carreaux et rideaux (w x 2, au mur)."""
    img, d = canvas(w, 2)
    W = w * T
    d.rectangle((3, 2, W - 4, 27), fill=OUT)
    d.rectangle((4, 3, W - 5, 26), fill=(240, 240, 232, 255))
    d.rectangle((6, 5, W - 7, 24), fill=(140, 196, 236, 255))
    d.line((W // 2, 5, W // 2, 24), fill=(240, 240, 232, 255))
    d.line((6, 14, W - 7, 14), fill=(240, 240, 232, 255))
    d.line((8, 22, 12, 7), fill=(200, 230, 248, 255))
    for x0 in (1, W - 6):
        d.rectangle((x0, 1, x0 + 4, 29), fill=(160, 50, 50, 255))
        d.line((x0 + 1, 2, x0 + 1, 28), fill=(200, 80, 70, 255))
    return img


def woven_mat(w=3):
    """Natte de paille tressée (w x 1, au sol)."""
    img, d = canvas(w, 1)
    W = w * T
    d.rectangle((1, 2, W - 2, 14), fill=(150, 116, 60, 255))
    d.rectangle((2, 3, W - 3, 13), fill=(214, 184, 112, 255))
    for x in range(3, W - 3, 4):
        d.line((x, 3, x, 13), fill=(190, 158, 90, 255))
    for y in (6, 10):
        d.line((2, y, W - 3, y), fill=(176, 142, 78, 255))
    return img


def checker(a=(236, 232, 222), b=(44, 42, 48)):
    """Carrelage en damier noir et blanc (motif de 2 x 2 cases de 16 px, carreaux de 8 px)."""
    tiles = []
    for j in range(2):
        row = []
        for i in range(2):
            t = Image.new('RGBA', (T, T))
            d = ImageDraw.Draw(t)
            for yy in range(2):
                for xx in range(2):
                    c = a if (xx + yy) % 2 == 0 else b
                    d.rectangle((xx * 8, yy * 8, xx * 8 + 7, yy * 8 + 7), fill=c + (255,))
                    d.line((xx * 8, yy * 8 + 7, xx * 8 + 7, yy * 8 + 7), fill=tuple(int(v * 0.85) for v in c) + (255,))
            row.append(t)
        tiles.append(row)
    return tiles


import interieurs_plans as _P  # noqa: E402
_floor = _P.floor
_CUSTOM_FLOORS = {'pv-damier': checker}
_P.floor = lambda name: _CUSTOM_FLOORS[name]() if name in _CUSTOM_FLOORS else _floor(name)

WALLS['pv-bambou'] = bamboo_wall
WALLS['pv-pierre'] = stone_wall
WALLS['pv-temple-blanc'] = lambda: temple_wall((236, 228, 210), (210, 160, 60))
WALLS['pv-wat'] = lambda: temple_wall((176, 44, 40), (236, 190, 70))
WALLS['pv-monastere'] = lambda: temple_wall((150, 40, 36), (60, 120, 170))
WALLS['pv-mediterranee'] = lambda: dppt_wall(205)


# ---------- Meubles ----------
ITEMS = {
    # Bureau, cuisine, salon (g4-int-meubles).
    'pv-bureau-pc': {'img': lambda: m(225), 'solid': 1},
    'pv-bureau-pc-bleu': {'img': lambda: m(266), 'solid': 1},
    'pv-chaise-bureau': {'img': lambda: m(254), 'solid': 0, 'flat': True},
    'pv-grande-table': {'img': lambda: m(121), 'solid': 2},
    'pv-table-carree': {'img': lambda: m(125), 'solid': 1},
    'pv-table-jaune': {'img': lambda: m(122), 'solid': 1},
    'pv-tele': {'img': lambda: m(168), 'solid': 1},
    'pv-canape-bleu': {'img': lambda: m(17), 'solid': 1},
    'pv-banquette-verte': {'img': lambda: m(133), 'solid': 1},
    'pv-lit': {'img': lambda: m(155), 'solid': 2},
    'pv-lit-rose': {'img': lambda: m(157), 'solid': 2},
    'pv-frigo': {'img': lambda: m(260), 'solid': 1},
    'pv-cuisine': {'img': lambda: m(277), 'solid': 1},
    'pv-evier': {'img': lambda: m(276), 'solid': 1},
    'pv-plante': {'img': lambda: m(34), 'solid': 1},
    'pv-plante-haute': {'img': lambda: m(136), 'solid': 1},
    'pv-plante-pot': {'img': lambda: m(306), 'solid': 1},
    'pv-arbuste': {'img': lambda: m(27), 'solid': 1},
    'pv-tableau-mer': {'img': lambda: m(80), 'solid': 0},
    'pv-tableau-carte': {'img': lambda: m(78), 'solid': 0},
    'pv-tableau-paysage': {'img': lambda: m(79), 'solid': 0},
    'pv-fenetre': {'img': window, 'solid': 0},
    'pv-urne': {'img': lambda: m(112), 'solid': 1},
    'pv-natte': {'img': woven_mat, 'solid': 0, 'flat': True},
    'pv-fenetre-ronde': {'img': lambda: m(19), 'solid': 0},
    'pv-horloge': {'img': lambda: m(76), 'solid': 0},
    'pv-pc': {'img': lambda: m(250), 'solid': 1},
    'pv-chaise': {'img': lambda: m(11), 'solid': 1},
    'pv-chaise-dos': {'img': lambda: m(12), 'solid': 1},
    'pv-commode': {'img': lambda: m(97), 'solid': 1},
    'pv-or': {'img': lambda: m(113), 'solid': 1},
    'pv-vitrail': {'img': lambda: m(284), 'solid': 0},
    'pv-tapis-bleu': {'img': lambda: m(153), 'solid': 0, 'flat': True},
    'pv-tapis-rond': {'img': lambda: m(203), 'solid': 0, 'flat': True},
    'pv-bibliotheque': {'img': lambda: m(124), 'solid': 1},
    'pv-vitrine': {'img': lambda: m(137), 'solid': 1},
    'pv-comptoir-zinc': {'img': lambda: m(282), 'solid': 1},
    'pv-statue': {'img': lambda: m(212), 'solid': 1},
    # Dessins faits ici.
    'pv-ascenseur': {'img': elevator, 'solid': 0},
    'pv-miroir': {'img': mirror, 'solid': 0},
    'pv-ardoise': {'img': chalk_menu, 'solid': 0},
    'pv-table-bistrot': {'img': bistro_table, 'solid': 1},
    'pv-chaise-bistrot': {'img': bistro_chair, 'solid': 1},
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
    'pv-scene': {'img': lambda: stage(12), 'solid': 0, 'flat': True},
    'pv-enceinte': {'img': speaker, 'solid': 1},
    'pv-amplis-16': {'img': lambda: amp_row(16), 'solid': 0},
    'pv-batterie': {'img': drums, 'solid': 0, 'flat': True},
    'pv-micro': {'img': mic, 'solid': 0, 'flat': True},
    'pv-projecteurs-16': {'img': lambda: spotlights(16), 'solid': 0},
    'pv-ecran-8': {'img': lambda: screen(8), 'solid': 0},
    'pv-barriere-12': {'img': lambda: barrier(12), 'solid': 0, 'flat': True},
    'pv-bureau-portable': {'img': laptop_desk, 'solid': 1},
    'pv-citronnier': {'img': plant_pot_med, 'solid': 1},
    'pv-comtoise': {'img': pendulum_clock, 'solid': 1},
}
ITEMS['pv-zinc-4'] = {'img': lambda: stretch(m(282), 4), 'solid': 1}
ITEMS['pv-miroir-3'] = {'img': lambda: mirror(3), 'solid': 0}


# ---------- Pièces ----------
ROW1 = lambda w: [[x, 1] for x in range(1, w - 1)]

PLANS = {
    # Paris — le bistrot : comptoir en zinc de chaque côté du passe-plat (le cuisinier en (4, 2)), grand miroir et
    # ardoises au mur, damier noir et blanc ; petites tables rondes en marbre et chaises en rotin (rangées 4 et 6).
    'bistro': {
        'wall': 'boiserie', 'floor': 'pv-damier',
        'items': [
            ['pv-zinc-4', 0, 2], ['pv-zinc-4', 6, 2],
            ['pv-miroir-3', 1, 1, {'dy': -4}], ['pv-miroir-3', 6, 1, {'dy': -4}],
            ['pv-ardoise', 4, 0, {'dy': 4}], ['pv-ardoise', 5, 0, {'dy': 4}],
            *[it for x in (0, 3, 6) for y in (4, 6) if (x, y) != (3, 6)
              for it in (['pv-chaise-bistrot', x, y], ['pv-table-bistrot', x + 1, y])],
            ['pv-table-bistrot', 3, 6],                 # l'arrivée (4, 6) reste libre
            ['pv-plante-pot', 9, 4], ['pv-plante-pot', 9, 6],
        ],
    },
    # Paris — ton appartement : parquet en point de Hongrie, lit contre le mur, bureau, fenêtre et tableau,
    # l'ordinateur (objet) sur un petit bureau en (7, 5).
    'parisAppart': {
        'wall': 'creme', 'floor': 'chevrons',
        'items': [
            ['pv-lit', 0, 3], ['pv-fenetre', 2, 1], ['pv-bureau-pc', 4, 2], ['pv-tableau-paysage', 6, 1],
            ['pv-plante', 0, 5], ['pv-bureau-portable', 7, 5], ['pv-tapis-bleu', 2, 5],
        ],
    },
    # Paris — l'entreprise (rez-de-chaussée) : bibliothèque, fenêtre, panneau ; l'accueil (longue table et écran) ;
    # l'open space : trois rangées de bureaux avec ordinateurs ; ascenseur en (10, 1) et (11, 1).
    'entreprise': {
        'wall': 'gris', 'floor': 'carrelage-gris',
        'void': [[10, 1], [11, 1]],
        'items': [
            ['pv-bibliotheque', 0, 2], ['pv-fenetre', 3, 1], ['pv-tableau-carte', 7, 1, {'dy': -6}],
            ['pv-ascenseur', 10, 1],
            ['pv-comptoir-zinc', 4, 3], ['pv-pc', 7, 3],
            *[['pv-bureau-pc', x, y] for x in (0, 4, 8) for y in (5, 7)],
        ],
    },
    # Étage du manager : moquette bleue, son bureau au centre, quatre postes sur les côtés, plantes.
    'entrepriseManager': {
        'wall': 'bleu', 'floor': 'bleu',
        'void': [[10, 1], [11, 1]],
        'items': [
            ['pv-fenetre', 1, 1], ['pv-tableau-paysage', 6, 1, {'dy': -6}], ['pv-ascenseur', 10, 1],
            ['pv-grande-table', 4, 3, {'solid': 1}], ['pv-pc', 7, 3],
            *[['pv-bureau-pc-bleu', x, y] for x in (0, 10) for y in (5, 7)],
            ['pv-plante-pot', 3, 2], ['pv-plante-pot', 8, 2],
        ],
    },
    # Dernier étage, le directeur : boiseries, moquette rouge, grand bureau en bois, canapé, vitrines, tableau doré.
    'entrepriseDirecteur': {
        'wall': 'bois', 'floor': 'moquette-rouge',
        'void': [[10, 1], [11, 1]],
        'items': [
            ['pv-fenetre-ronde', 1, 1], ['pv-tableau-mer', 6, 1, {'dy': -6}], ['pv-ascenseur', 10, 1],
            ['pv-grande-table', 4, 3, {'solid': 1}], ['pv-pc', 7, 3],
            ['pv-vitrine', 0, 5], ['pv-vitrine', 0, 7], ['pv-canape-bleu', 9, 5, {'solid': 1}],
            ['pv-bibliotheque', 10, 7],
            ['pv-plante-haute', 3, 2], ['pv-plante-haute', 8, 2],
        ],
    },
    # Paris — Bercy : mur sombre à voyants, rampe de projecteurs, écran géant ; amplis au fond de la scène (rangée 1,
    # en mur), piles d'enceintes sur les côtés ; la scène (rangées 2-3) avec batterie et micro ; la fosse.
    'bercy': {
        'wall': 'technique', 'floor': 'pierre-sombre', 'void': ROW1(18),
        'items': [
            ['pv-projecteurs-16', 1, 0], ['pv-ecran-8', 5, 0, {'dy': 4}], ['pv-amplis-16', 1, 1],
            ['pv-scene', 3, 3],
            ['pv-enceinte', 1, 2], ['pv-enceinte', 2, 2], ['pv-enceinte', 15, 2], ['pv-enceinte', 16, 2],
            ['pv-batterie', 12, 2, {'dy': -9}], ['pv-micro', 9, 2, {'dy': -7}],
        ],
    },
    # Toulon — chez Yanis : murs jaune pâle, carreaux bleus, lit contre le mur, citronniers, cuisine, table.
    'yanisAppart': {
        'wall': 'pv-mediterranee', 'floor': 'carreaux-bleus', 'void': ROW1(10),
        'items': [
            ['pv-lit-rose', 1, 2], ['pv-fenetre', 3, 1], ['pv-cuisine', 5, 1], ['pv-tableau-mer', 8, 1, {'dy': -6}],
            ['pv-citronnier', 1, 4], ['pv-citronnier', 8, 4],
            ['pv-tapis-bleu', 3, 4],
        ],
    },
    # Corse — chez tes parents : pierres sèches, parquet, cuisine contre le mur, grande table au milieu, horloge.
    'corseParents': {
        'wall': 'pv-pierre', 'floor': 'parquet',
        'void': ROW1(10),
        'items': [
            ['pv-cuisine', 1, 1], ['pv-fenetre', 4, 1], ['pv-comtoise', 7, 1], ['pv-commode', 8, 1],
            ['pv-table-carree', 4, 4, {'solid': 2}],
        ],
    },
    # Corse — chez Léo et Théo : même maison de pierre, chambre de jeunes (télé, canapé, bibliothèque).
    'corseVoisins': {
        'wall': 'pv-pierre', 'floor': 'damier-bois',
        'void': ROW1(10),
        'items': [
            ['pv-bibliotheque', 1, 1], ['pv-fenetre', 4, 1], ['pv-tele', 6, 1],
            ['pv-table-jaune', 4, 4, {'solid': 2}], ['pv-natte', 1, 5],
        ],
    },
    # Bali — la cabane de bambou : plancher clair, le coffre au fond (objet en (4, 1) et (5, 1)), plantes.
    'baliCabane': {
        'wall': 'pv-bambou', 'floor': 'parquet-clair', 'void': ROW1(8),
        'items': [
            ['pv-arbuste', 1, 1], ['pv-coffre', 4, 1], ['pv-arbuste', 6, 1], ['pv-natte', 2, 3],
        ],
    },
    # Sri Lanka — temple : murs blancs à frise dorée, dalles ; bouddha blanc sur l'autel (objets (4..7, 1)), fleurs de
    # lotus et encens ; lampes dans les coins.
    'sriLankaTemple': {
        'wall': 'pv-temple-blanc', 'floor': 'dalles', 'void': ROW1(12),
        'items': [
            ['pv-autel', 4, 1], ['pv-bouddha-blanc', 5, 1, {'dy': -6}],
            ['pv-lotus', 4, 1, {'dy': -5}], ['pv-lotus', 7, 1, {'dy': -5}],
            ['pv-encens', 1, 3], ['pv-encens', 10, 3],
            ['pv-lotus', 2, 1], ['pv-lotus', 9, 1],
        ],
    },
    # Thaïlande — wat : murs rouges à frise dorée, parquet sombre ; grand bouddha doré sur l'autel, lampes et lotus.
    'watInterieur': {
        'wall': 'pv-wat', 'floor': 'bois-roux', 'void': ROW1(12),
        'items': [
            ['pv-autel-or', 4, 1], ['pv-bouddha', 5, 1, {'dy': -6}],
            ['pv-lotus', 4, 1, {'dy': -5}], ['pv-lotus', 7, 1, {'dy': -5}],
            ['pv-lampe-beurre', 1, 3], ['pv-lampe-beurre', 10, 3],
            ['pv-urne', 1, 1], ['pv-urne', 8, 1],
        ],
    },
    # Népal — monastère : murs rouge sombre, tapis rouge ; autel aux lampes à beurre (objets (4..7, 1)), thangkas,
    # drapeaux de prière, moulins à prières dans les coins.
    'monastere': {
        'wall': 'pv-monastere', 'floor': 'moquette-rouge', 'void': ROW1(12),
        'items': [
            ['pv-drapeaux-8', 2, 0],
            ['pv-autel', 4, 1], ['pv-bouddha', 5, 1, {'dy': -6}], ['pv-lampes', 4, 1, {'dy': -4}],
            ['pv-thangka', 2, 1], ['pv-thangka', 9, 1],
            ['pv-moulin', 1, 3], ['pv-moulin', 10, 3],
        ],
    },
}
