"""Bordeaux — le stade (cérémonie de remise des diplômes) en vrai stade de foot (demande de l'utilisateur, octobre 2026) :
une tribune pleine au fond, une piste tout autour, un terrain d'herbe à bandes avec ses lignes blanches (ligne médiane,
rond central, surfaces de réparation, points de penalty), deux buts, et une petite estrade au milieu du haut du terrain
pour le directeur, centrée sur la ligne médiane. Rien n'existe pour ça dans les planches DS : dessiné ici, aux couleurs et au contour des décors Gen 4.

Ce plan remplace celui de prytanee_bordeaux.py (les groupes sont chargés par ordre alphabétique, celui-ci après).
Grille, PNJ et estrade : src/data/maps/interiors.js (stade).
"""
import random

from PIL import Image, ImageDraw

from interieurs_plans import T

W, H = 26, 14                         # la pièce : 2 rangées de tribune, puis 12 rangées de piste et de terrain
PH = H - 2                            # hauteur de l'image du terrain (piste comprise)
EXIT = (12, 13)                       # tapis de sortie (deux cases), dans la piste du bas : laissé vide dans l'image
GOAL_ROWS = range(4, 8)               # rangées (de l'image du terrain) occupées par les buts, dans la piste

OUT = (40, 44, 40, 255)
WHITE = (248, 248, 244, 255)
LINE_SHADE = (214, 228, 204, 255)


def _canvas(w, h):
    img = Image.new('RGBA', (w * T, h * T))
    return img, ImageDraw.Draw(img)


def terrain():
    """Piste (une case tout autour), herbe à bandes, lignes, buts : W x PH cases, à poser sous la tribune."""
    img, d = _canvas(W, PH)
    rnd = random.Random(7)
    # Piste en tartan, un liseré blanc côté herbe.
    d.rectangle((0, 0, W * T - 1, PH * T - 1), fill=(190, 96, 70, 255))
    for _ in range(900):
        x, y = rnd.randrange(W * T), rnd.randrange(PH * T)
        d.point((x, y), fill=(206, 116, 88, 255))
    # Herbe : bandes de deux cases, deux verts, quelques brins plus clairs.
    for c in range(1, W - 1):
        col = (106, 182, 74, 255) if (c // 2) % 2 else (92, 166, 64, 255)
        d.rectangle((c * T, T, c * T + T - 1, (PH - 1) * T - 1), fill=col)
    for _ in range(500):
        x, y = rnd.randrange(T, (W - 1) * T), rnd.randrange(T, (PH - 1) * T)
        d.point((x, y), fill=(126, 198, 92, 255))
    d.rectangle((T - 1, T - 1, (W - 1) * T, (PH - 1) * T), outline=(232, 226, 210, 255))

    def line(box, **k):
        d.rectangle(box, outline=WHITE, **k)

    # Lignes du terrain (2 px), à 6 px du bord de l'herbe.
    x0, y0, x1, y1 = T + 6, T + 6, (W - 1) * T - 7, (PH - 1) * T - 7
    cx, cy = (x0 + x1) // 2, (y0 + y1) // 2
    for k in (0, 1):
        line((x0 + k, y0 + k, x1 - k, y1 - k))
    d.rectangle((cx - 1, y0, cx, y1), fill=WHITE)                               # ligne médiane
    for r in (30, 29):
        d.ellipse((cx - r, cy - r, cx + r, cy + r), outline=WHITE)              # rond central
    d.rectangle((cx - 2, cy - 2, cx + 1, cy + 1), fill=WHITE)
    box_w, box_h, small_w, small_h = 50, 104, 18, 52
    for side in (0, 1):
        bx = x0 if side == 0 else x1 - box_w
        sx = x0 if side == 0 else x1 - small_w
        for k in (0, 1):
            line((bx + k, cy - box_h // 2 + k, bx + box_w - k, cy + box_h // 2 - k))       # surface de réparation
            line((sx + k, cy - small_h // 2 + k, sx + small_w - k, cy + small_h // 2 - k))  # surface de but
        px = x0 + 36 if side == 0 else x1 - 36
        d.rectangle((px - 1, cy - 1, px + 1, cy + 1), fill=WHITE)              # point de penalty
    # Buts : filet gris, montants blancs, posés dans la piste contre la ligne de but.
    gy0, gy1 = GOAL_ROWS[0] * T + 4, (GOAL_ROWS[-1] + 1) * T - 4
    for gx0, gx1 in ((2, x0 + 2), (x1 - 2, W * T - 3)):
        d.rectangle((gx0, gy0, gx1, gy1), fill=(60, 64, 64, 255))
        for x in range(gx0 + 2, gx1, 3):
            d.line((x, gy0 + 1, x, gy1 - 1), fill=(200, 204, 204, 255))
        for y in range(gy0 + 2, gy1, 3):
            d.line((gx0 + 1, y, gx1 - 1, y), fill=(200, 204, 204, 255))
        d.rectangle((gx0, gy0, gx1, gy0 + 1), fill=WHITE)
        d.rectangle((gx0, gy1 - 1, gx1, gy1), fill=WHITE)
        post = gx1 - 1 if gx0 < W * T // 2 else gx0
        d.rectangle((post, gy0, post + 1, gy1), fill=WHITE)
        d.rectangle((gx0, gy0 - 1, gx1, gy0 - 1), fill=OUT)
        d.rectangle((gx0, gy1 + 1, gx1, gy1 + 1), fill=OUT)
    # Tapis de sortie (deux cases) dans la piste du bas, comme les tapis rouges des intérieurs DS.
    ex, ey = EXIT
    mx0, my0 = ex * T + 2, (ey - 2) * T + 3
    d.rectangle((mx0, my0, mx0 + 2 * T - 5, my0 + T - 7), fill=(120, 40, 48, 255))
    d.rectangle((mx0 + 2, my0 + 2, mx0 + 2 * T - 7, my0 + T - 9), fill=(232, 56, 56, 255))
    d.rectangle((mx0 + 4, my0 + 3, mx0 + 2 * T - 9, my0 + 4), fill=(248, 120, 104, 255))
    return img


def terrain_mask():
    """Cases bloquées de l'image du terrain : les deux buts, dans la piste."""
    return [[1 if (x in (0, W - 1) and y in GOAL_ROWS) else 0 for x in range(W)] for y in range(PH)]


def tribune():
    """Tribune pleine (W x 2 cases) : gradins gris, sièges bleus et blancs, la foule par-dessus, rambarde en bas."""
    img, d = _canvas(W, 2)
    rnd = random.Random(11)
    d.rectangle((0, 0, W * T - 1, 2 * T - 1), fill=(118, 122, 136, 255))
    d.rectangle((0, 0, W * T - 1, 2), fill=OUT)
    skins = [(248, 208, 168), (224, 172, 128), (176, 120, 80), (120, 80, 56)]
    hairs = [(48, 40, 36), (120, 72, 40), (232, 200, 120), (32, 32, 40), (176, 64, 40)]
    shirts = [(200, 48, 48), (48, 96, 200), (240, 240, 236), (48, 160, 72), (232, 184, 48), (40, 40, 56)]
    for row in range(4):
        y = 4 + row * 7
        d.rectangle((0, y + 5, W * T - 1, y + 6), fill=(92, 96, 110, 255))               # marche
        for x in range(1, W * T - 5, 6):
            seat = (56, 92, 196, 255) if (x // 6 + row) % 5 else (236, 236, 236, 255)
            d.rectangle((x, y + 1, x + 4, y + 4), fill=seat)
            d.line((x, y + 4, x + 4, y + 4), fill=(32, 48, 112, 255))
            if rnd.random() < 0.72:                                                  # un spectateur
                d.rectangle((x, y + 1, x + 4, y + 4), fill=rnd.choice(shirts) + (255,))
                d.rectangle((x + 1, y - 2, x + 3, y), fill=rnd.choice(skins) + (255,))
                d.line((x + 1, y - 2, x + 3, y - 2), fill=rnd.choice(hairs) + (255,))
    d.rectangle((0, 2 * T - 4, W * T - 1, 2 * T - 1), fill=(236, 236, 230, 255))   # rambarde
    d.line((0, 2 * T - 4, W * T - 1, 2 * T - 4), fill=OUT)
    for x in range(0, W * T, 16):
        d.line((x, 2 * T - 3, x, 2 * T - 1), fill=(160, 160, 160, 255))
    return img


def estrade():
    """Petite estrade de remise des diplômes (4 x 2) : dessus en tapis rouge à bord doré, devant en bois."""
    img, d = _canvas(4, 2)
    w = 4 * T
    d.rectangle((0, 2, w - 1, 2 * T - 1), fill=OUT)
    d.rectangle((1, 3, w - 2, T + 5), fill=(196, 44, 52, 255))
    d.rectangle((3, 5, w - 4, T + 3), fill=(220, 64, 70, 255))
    d.rectangle((1, T + 6, w - 2, T + 7), fill=(232, 192, 80, 255))
    d.rectangle((1, T + 8, w - 2, 2 * T - 2), fill=(140, 88, 52, 255))
    for x in range(8, w - 2, 12):
        d.line((x, T + 9, x, 2 * T - 3), fill=(104, 64, 36, 255))
    return img


ITEMS = {
    'st-terrain': {'img': terrain, 'solid': terrain_mask(), 'flat': True},
    'st-tribune': {'img': tribune, 'solid': 2, 'flat': True},
    'st-estrade': {'img': estrade, 'solid': 2, 'flat': True},
}

PLANS = {
    'stade': {
        'wall': 'gris', 'floor': 'vert',
        'items': [['st-terrain', 0, H - 1], ['st-tribune', 0, 1], ['st-estrade', 11, 5]],
        'npc_on_solid': ['directeur', 'directeur-fin'],
    },
}
