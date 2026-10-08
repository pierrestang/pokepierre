"""Plans des intérieurs Gen 4 (scripts/build_interiors.py) : murs, sols, meubles, et chaque pièce meuble par meuble.

Une pièce : {'wall': mur, 'floor': sol, 'items': [[meuble, x, y(, options)], …]} ; (x, y) = case du pied du meuble
(en bas à gauche) : un meuble au mur a son pied sur la plinthe (y = 1), un meuble de la pièce sur sa rangée. Options d'un meuble : 'solid' (rangées du bas qui bloquent, ou masque), 'flat' (rien au-dessus de
Pierre). Pièce : 'free' / 'block' (cases forcées), 'mat' (tapis de sortie : 'rouge', 'vert', None), 'void' (cases
noires en plus des 'X' de la grille).
La grille logique (tapis de sortie, escaliers) vient de src/data/maps/interiors.js ; les cases des PNJ et des objets
s'y accordent (voir les commentaires de chaque pièce).
"""
import math
from functools import lru_cache
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw
from scipy import ndimage

V2 = Path(__file__).resolve().parent.parent / 'public' / 'assets' / 'v2'
T = 16


@lru_cache(None)
def sheet(sid):
    return Image.open(V2 / f'{sid}.png').convert('RGBA')


def crop(sid, c, r, w=1, h=1):
    return sheet(sid).crop((c * T, r * T, (c + w) * T, (r + h) * T))


def px(sid, x, y, w, h):
    """Rectangle en pixels, posé en bas à gauche d'une image de cases entières."""
    img = sheet(sid).crop((x, y, x + w, y + h))
    out = Image.new('RGBA', (math.ceil(w / T) * T, math.ceil(h / T) * T))
    out.alpha_composite(img, (0, out.height - h))
    return out


def isolate(img):
    """Le plus grand morceau d'un seul tenant (et ce qui le touche), le reste effacé."""
    a = np.array(img)
    lab, n = ndimage.label(a[..., 3] > 0, structure=np.ones((3, 3)))
    if n > 1:
        keep = np.bincount(lab.ravel())[1:].argmax() + 1
        a[lab != keep] = 0
    return Image.fromarray(a)


def rect(sid, x, y, w, h, align='bottom', iso=True, width=None):
    """Rectangle en pixels d'une planche (un meuble pas calé sur la grille), d'un seul tenant (`iso`), posé dans une
    image de cases entières : en bas (`align='bottom'`) ou en haut, centré en largeur (ou sur `width` cases)."""
    img = sheet(sid).crop((x, y, x + w, y + h))
    if iso:
        img = isolate(img)
    bx0, by0, bx1, by1 = img.getbbox()
    img = img.crop((bx0, by0, bx1, by1))
    tw = width or math.ceil(img.width / T)
    th = math.ceil(img.height / T)
    out = Image.new('RGBA', (tw * T, th * T))
    out.alpha_composite(img, ((tw * T - img.width) // 2, out.height - img.height if align == 'bottom' else 0))
    return out


def stretch(img, n, edge=6):
    """Le meuble allongé à n cases : les bords gardés, le milieu répété."""
    a = img.convert('RGBA')
    bx0, by0, bx1, by1 = a.getbbox()
    a = a.crop((bx0, 0, bx1, a.height))
    left, right = a.crop((0, 0, edge, a.height)), a.crop((a.width - edge, 0, a.width, a.height))
    mid = a.crop((edge, 0, a.width - edge, a.height))
    out = Image.new('RGBA', (n * T, a.height))
    out.alpha_composite(left, (0, 0))
    x = edge
    while x < n * T - edge:
        out.alpha_composite(mid.crop((0, 0, min(mid.width, n * T - edge - x), a.height)), (x, 0))
        x += mid.width
    out.alpha_composite(right, (n * T - edge, 0))
    return out


def sirmaio(sheet, c, r, w=1, h=1, iso=False):
    """Morceau d'une planche du pack HGSS de SirMaIo (ASSETTILESPOKEMONV2/tilesets/interieurs/hgss-sirmaio/<sheet>.png,
    cases de 32 px, fond rose ou jaune retiré), ramené à l'échelle du jeu (cases de 16 px). Crédit : SirMaIo."""
    path = V2.parent.parent.parent / 'ASSETTILESPOKEMONV2' / 'tilesets' / 'interieurs' / 'hgss-sirmaio' / f'{sheet}.png'
    a = np.array(Image.open(path).convert('RGBA'))
    for key in ((240, 91, 161), (255, 245, 104), (255, 0, 255)):
        a[(a[..., 0] == key[0]) & (a[..., 1] == key[1]) & (a[..., 2] == key[2])] = 0
    img = Image.fromarray(a).crop((c * 32, r * 32, (c + w) * 32, (r + h) * 32)).resize((w * T, h * T), Image.NEAREST)
    return isolate(img) if iso else img


def meuble(i):
    """Élément n° i de la planche g4-int-meubles (voir g4-int-meubles.elements.json)."""
    import json
    c0, r0, c1, r1 = json.loads((V2 / 'g4-int-meubles.elements.json').read_text())['elements'][i]
    return crop('g4-int-meubles', c0, r0, c1 - c0 + 1, r1 - r0 + 1)


# ---------- Murs : (face, plinthe), une case de large (ou plusieurs, en motif) ----------
def dppt_wall(row, cols=(0,)):
    return [[crop('dppt-int', c, row + 2) for c in cols], [crop('dppt-int', c, row + 3) for c in cols]]


WALLS = {
    'creme': lambda: dppt_wall(140),             # crème, plinthe bleue (maison)
    'beige': lambda: dppt_wall(220),             # beige, plinthe en bois (maison)
    'bois': lambda: dppt_wall(275),              # panneaux de bois
    'boiserie': lambda: dppt_wall(215),          # lambris sombre
    'bois-sombre': lambda: dppt_wall(260),       # boiseries très sombres
    'brique': lambda: dppt_wall(255),            # brique sombre
    'technique': lambda: dppt_wall(280),         # mur sombre à voyants bleus
    'rideaux': lambda: dppt_wall(300),           # tentures violettes
    'bibliotheque': lambda: dppt_wall(235),      # panneaux crème et bois
    'vert': lambda: dppt_wall(210),              # vert à soubassement
    'gris': lambda: dppt_wall(165),
    'olive': lambda: dppt_wall(160),
    'bleu': lambda: dppt_wall(230),
    'jaune': lambda: dppt_wall(205),
    'menthe': lambda: dppt_wall(200),
    'papier-peint': lambda: dppt_wall(245),
    'cabine': lambda: cabin_wall(),              # bois sombre et fenêtres (cabine de yacht de terriblejared)
}


def cabin_wall():
    """Le mur de la cabine (fenêtres tous les 14 px) ramené à une case de 16 px : le montant entre deux fenêtres
    doublé."""
    y = 86 * T + 10
    src = sheet('jared-bateaux').crop((70, y, 84, y + 2 * T))
    tile = Image.new('RGBA', (T, 2 * T))
    tile.paste(src.crop((0, 0, 2, 2 * T)), (0, 0))
    tile.paste(src, (2, 0))
    return [[tile.crop((0, 0, T, T))], [tile.crop((0, T, T, 2 * T))]]

FLOORS = {
    'parquet': 0, 'parquet-clair': 80, 'damier-bois': 24, 'chevrons': 96, 'planches-sombres': 64, 'brique': 68,
    'losanges-sombres': 44, 'pierre-sombre': 92, 'carrelage': 48, 'carrelage-gris': 52, 'moquette-rouge': 4,
    'tapis-orange': 8, 'vert': 12, 'bleu': 16, 'menthe': 20, 'rose': 28, 'losanges-bleus': 32, 'losanges-verts': 36,
    'losanges-mauves': 40, 'metal': 56, 'dalles': 60, 'olive': 72, 'damier': 76, 'losanges-gris': 84, 'bois-roux': 88,
    'carreaux-bleus': 100, 'jaune': 104, 'vert-d-eau': 108, 'gris-fleuri': 112, 'damier-noir': 128,
}


def wall(name):
    return WALLS[name]()


def floor(name):
    return [[crop('dppt-int', 0, FLOORS[name])]]


def mat(color, n):
    """Tapis de sortie de n cases de large."""
    src = {'rouge': (5, 6), 'vert': (5, 6)}[color]
    img = Image.new('RGBA', (n * T, T))
    base = meuble(5)                                  # petit tapis rouge (2 x 1)
    a = np.array(base)
    ys, xs = np.nonzero(a[..., 3])
    body = base.crop((xs.min(), ys.min(), xs.max() + 1, ys.max() + 1))
    body = body.resize((n * T - 4, body.height), Image.NEAREST)
    img.alpha_composite(body, (2, (T - body.height) // 2))
    return img


# ---------- Dessins faits ici (dans le style Gen 4) ----------
def dartboard():
    """Cible de fléchettes accrochée au mur (une case)."""
    img = Image.new('RGBA', (T, T))
    d = ImageDraw.Draw(img)
    d.ellipse((1, 1, 14, 14), fill=(40, 32, 30, 255))
    d.ellipse((2, 2, 13, 13), fill=(232, 220, 190, 255))
    for k, (r, c) in enumerate([(5, (200, 56, 48, 255)), (3, (40, 120, 72, 255)), (1, (200, 56, 48, 255))]):
        d.ellipse((7.5 - r, 7.5 - r, 7.5 + r, 7.5 + r), fill=c)
    for x0, y0, x1, y1 in [(7, 2, 8, 13), (2, 7, 13, 8)]:
        d.line((x0, y0, x1, y1), fill=(40, 32, 30, 160))
    return img


def _shade(c, k):
    return tuple(max(0, min(255, int(v * k))) for v in c) + (255,)


def _steps(d, y, wood, fade):
    k = 1.0
    while y > 6:
        d.rectangle((2, y - 4, 13, y - 2), fill=_shade(wood, k))         # le giron
        d.line((2, y - 4, 13, y - 4), fill=_shade(wood, k * 1.18))       # le nez de marche, éclairé
        d.rectangle((2, y - 1, 13, y), fill=_shade(wood, k * 0.62))      # la contremarche
        y -= 5
        k *= fade


def _rails(d, top, bottom, rail):
    for x0, hi in ((0, 1), (14, 14)):
        d.rectangle((x0, top, x0 + 1, bottom), fill=_shade(rail, 1.0))
        d.line((hi, top, hi, bottom), fill=_shade(rail, 1.45))


def stairs_up(wood=(186, 128, 76), rail=(118, 74, 42)):
    """Escalier qui monte (comme dans HeartGold/SoulSilver) : une case de large, les marches de bois qui s'enfoncent
    dans le mur (3 rangées : les deux du mur et la case de l'escalier), plus sombres vers le haut, entre deux limons."""
    img = Image.new('RGBA', (T, 3 * T))
    d = ImageDraw.Draw(img)
    d.rectangle((1, 0, 14, 47), fill=(24, 18, 16, 255))                 # la trémie, dans l'ombre
    _steps(d, 47, wood, 0.9)
    _rails(d, 0, 47, rail)
    for yy in range(10):                                                 # le haut se perd dans l'ombre de l'étage
        d.line((2, yy, 13, yy), fill=(16, 12, 10, 255 - yy * 18))
    d.rectangle((0, 44, 1, 47), fill=_shade(rail, 0.7))                  # pieds des limons
    d.rectangle((14, 44, 15, 47), fill=_shade(rail, 0.7))
    return img


def stairs_down(wood=(186, 128, 76), rail=(118, 74, 42), rim=(200, 176, 140)):
    """Escalier qui descend : une trémie dans le sol contre le mur (2 rangées : la plinthe et la case de l'escalier),
    les marches qui s'enfoncent vers le mur en s'assombrissant, une rampe de chaque côté avec sa boule."""
    img = Image.new('RGBA', (T, 2 * T))
    d = ImageDraw.Draw(img)
    d.rectangle((1, 2, 14, 31), fill=(20, 16, 14, 255))
    _steps(d, 31, wood, 0.82)
    d.line((1, 31, 14, 31), fill=_shade(rim, 1.0))                       # le bord du plancher
    _rails(d, 2, 31, rail)
    for x0 in (0, 14):
        d.ellipse((x0 - 1, 26, x0 + 2, 29), fill=_shade(rail, 1.3), outline=_shade(rail, 0.6))   # boule de rampe
    for yy in range(2, 12):
        d.line((2, yy, 13, yy), fill=(12, 10, 8, 255 - (yy - 2) * 16))
    return img


def beer_taps():
    """Pompes à bière en laiton (posées sur le comptoir)."""
    img = Image.new('RGBA', (T, T))
    d = ImageDraw.Draw(img)
    dark, brass, light = (70, 48, 30, 255), (196, 150, 60, 255), (248, 220, 130, 255)
    d.rectangle((2, 11, 13, 13), fill=dark)
    d.rectangle((3, 11, 12, 12), fill=brass)
    for x in (4, 8, 11):
        d.rectangle((x - 1, 3, x + 1, 11), fill=dark)
        d.line((x, 4, x, 10), fill=brass)
        d.point((x, 4), fill=light)
        d.rectangle((x - 1, 1, x + 1, 3), fill=(40, 40, 40, 255))
    return img


def pints():
    """Deux pintes (une brune, une blonde)."""
    img = Image.new('RGBA', (T, T))
    d = ImageDraw.Draw(img)
    for x, beer in ((3, (60, 34, 22, 255)), (9, (226, 160, 40, 255))):
        d.rectangle((x, 6, x + 4, 13), fill=(40, 40, 46, 255))
        d.rectangle((x + 1, 8, x + 3, 12), fill=beer)
        d.rectangle((x + 1, 7, x + 3, 7), fill=(250, 248, 236, 255))
        d.point((x + 1, 9), fill=(255, 255, 255, 200))
    return img


# ---------- Meubles ----------
# nom : {'img': () -> image en cases entières, 'solid': rangées du bas qui bloquent (ou masque), 'flat': tout au décor}
ITEMS = {
    # Pub (cabine de yacht de terriblejared : bois sombre, fauteuils verts, laiton), en pixels dans jared-bateaux.
    'comptoir-caisse': {'img': lambda: rect('jared-bateaux', 196, 1386, 38, 30), 'solid': 2},
    'bureau-laiton': {'img': lambda: rect('jared-bateaux', 246, 1389, 20, 27), 'solid': 2},
    'fauteuil-vert': {'img': lambda: rect('jared-bateaux', 140, 1394, 15, 20), 'solid': 0, 'flat': True},
    'lampe-laiton': {'img': lambda: rect('jared-bateaux', 170, 1390, 14, 24), 'solid': 1},
    'plante-violette': {'img': lambda: rect('jared-bateaux', 182, 1383, 18, 32), 'solid': 1},
    'table-ronde': {'img': lambda: rect('jared-bateaux', 140, 1420, 16, 20), 'solid': 1},
    'guéridon': {'img': lambda: rect('jared-bateaux', 170, 1426, 14, 16), 'solid': 1},
    'pouf-vert': {'img': lambda: rect('jared-bateaux', 170, 1455, 12, 18), 'solid': 1},
    'bureau-carte': {'img': lambda: rect('jared-bateaux', 132, 1440, 34, 28), 'solid': 1},
    # Comptoir du bar : la longue table de bois sombre, allongée ; l'étagère à bouteilles derrière, au mur.
    'bar': {'img': lambda: rect('jared-bateaux', 126, 1476, 46, 26, align='top'), 'solid_top': 1},
    'bouteilles': {'img': lambda: rect('jared-bateaux', 126, 1518, 46, 26), 'solid': 0},
    'pompes': {'img': beer_taps, 'solid': 0, 'flat': True},
    'pintes': {'img': pints, 'solid': 0, 'flat': True},
    'tapis-vert': {'img': lambda: rect('jared-bateaux', 198, 1466, 44, 34), 'solid': 0, 'flat': True},
    'cible': {'img': dartboard, 'solid': 0},
    # Escaliers d'intérieur (une case de large), posés sur la case η (monte) ou ξ (descend), qui reste libre.
    'escalier-monte': {'img': stairs_up, 'solid': 0, 'flat': True},
    'escalier-descend': {'img': stairs_down, 'solid': 0, 'flat': True},
    'escalier-monte-clair': {'img': lambda: stairs_up((214, 172, 120), (150, 104, 62)), 'solid': 0, 'flat': True},
    'escalier-descend-clair': {'img': lambda: stairs_down((214, 172, 120), (150, 104, 62)), 'solid': 0, 'flat': True},
    'escalier-monte-gris': {'img': lambda: stairs_up((176, 176, 172), (96, 100, 108)), 'solid': 0, 'flat': True},
    'escalier-descend-gris': {'img': lambda: stairs_down((176, 176, 172), (96, 100, 108), (190, 190, 190)),
                              'solid': 0, 'flat': True},
}
for _n in (3, 4, 5, 6, 7, 8):
    ITEMS[f'bar-{_n}'] = {'img': (lambda n: lambda: stretch(ITEMS['bar']['img'](), n))(_n), 'solid_top': 1}
    ITEMS[f'bouteilles-{_n}'] = {'img': (lambda n: lambda: stretch(ITEMS['bouteilles']['img'](), n))(_n), 'solid': 0}


def item(name):
    return ITEMS[name]


# ---------- Pièces ----------
PLANS = {
    # Hull : voir scripts/interieurs/hull.py.
}


# ---------- Pièces des autres villes : un fichier par groupe dans scripts/interieurs/ ----------
# Chaque fichier définit ITEMS (meubles en plus, noms préfixés si besoin) et PLANS ; il peut importer d'ici les outils
# (crop, rect, stretch, meuble, isolate, ITEMS…) : `from interieurs_plans import *`.
def _load_groups():
    import importlib.util
    folder = Path(__file__).resolve().parent / 'interieurs'
    for path in sorted(folder.glob('*.py')):
        spec = importlib.util.spec_from_file_location(f'interieurs.{path.stem}', path)
        mod = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(mod)
        ITEMS.update(getattr(mod, 'ITEMS', {}))
        PLANS.update(getattr(mod, 'PLANS', {}))


_load_groups()
