"""Intérieurs de Hull : les deux pubs, The Asylum, la bibliothèque, l'université, chez Léo, la coloc.

Depuis octobre 2026, ils partent de VRAIES pièces de HeartGold / SoulSilver (pack de SirMaIo, scripts/hgss_rooms.py),
retouchées par collages d'autres pièces HGSS : le premier pub est le salon de la tour Radio de Doublonville (comptoir en
U, canapés, tapis rouge), le second la maison de Fargas à Écorcia (boiseries, comptoirs en L), The Asylum le salon du
casino de Doublonville agrandi (bar et studio de la tour Radio), la bibliothèque le labo des Ruines Alpha, chez Léo le
grand salon de Bourg Geon, la coloc un appartement de Doublonville. Seule l'université garde son ancien plan (retouchée
par l'utilisateur dans le créateur). Les dessins plus bas servent encore à l'université et à la cible du second pub.
"""
import json
from functools import lru_cache
from pathlib import Path

from PIL import Image, ImageDraw

import hgss_rooms as HG
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
    'h-piste-grande': {'img': lambda: dance_floor(8, 5), 'solid': 0, 'flat': True},
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


# ---------- Meubles du catalogue des intérieurs (public/assets/v2/catalogue-int.json) ----------
# Un élément du catalogue (cases de la planche catalogue-int, sans ombre) comme meuble de plan : 'ci-<id>', ses
# collisions d'après le catalogue. Les tabourets et chaises sont « à plat » (sous les personnages assis dessus).
_V2 = Path(__file__).resolve().parents[2] / 'public' / 'assets' / 'v2'


@lru_cache(None)
def _catalogue_int():
    c = json.loads((_V2 / 'catalogue-int.json').read_text())
    return {e['id']: e for e in c['themes']['libre']['elements']}, Image.open(_V2 / 'catalogue-int.png').convert('RGBA'), c['cols']


def ci_img(eid):
    els, sheet_img, cols = _catalogue_int()
    e = els[eid]
    out = Image.new('RGBA', (e['w'] * T, e['h'] * T))
    for j, row in enumerate(e['tiles']):
        for i, k in enumerate(row):
            if k >= 0:
                out.alpha_composite(sheet_img.crop(((k % cols) * T, (k // cols) * T, (k % cols + 1) * T, (k // cols + 1) * T)),
                                    (i * T, j * T))
    return out


def _ci_item(eid, **opts):
    els, _, _ = _catalogue_int()
    return {'img': lambda: ci_img(eid), 'solid': els[eid]['solid'], **opts}


for _eid in ('comptoir-bar', 'etagere-bouteilles', 'table-rouge-g', 'table-rouge-d', 'table-pub', 'table-bois',
             'tonneau', 'lampe-laiton', 'canape-brun', 'long-comptoir', 'mange-debout', 'cible', 'plante-grasse'):
    ITEMS[f'ci-{_eid}'] = _ci_item(_eid)
for _eid in ('pompes-biere', 'pintes', 'menu'):                     # posés sur le comptoir
    ITEMS[f'ci-{_eid}'] = _ci_item(_eid, solid=0)
for _eid in ('tabouret-bar', 'tabouret-bar-vert'):
    ITEMS[f'ci-{_eid}'] = _ci_item(_eid, solid=0, flat=True)


NB = '001i_Newbark houses'
GI = '012i_Goldenrod interiors'
RA = '074i_Ruins of Alph Lab'
RT = '012i_Goldenrod radio tower'
GC = '012i_Goldenrod game corner'
AZ = '010i_Azalea Houses'


# Les pubs : la maison de Fargas à Écorcia (AZ, coin (10, 25), 16 x 10) ; boiseries aux rangées 0-2, tatamis aux
# rangées 3-6, marche rouge en 7, plancher aux rangées 8-9 (le tapis de sortie en (3, 9)).
def _cols(width):
    return list(range(width)) if isinstance(width, int) else list(width)


def fargas_floor(width, rows):
    """Plancher (rangées 8-9 de la maison de Fargas) sur les rangées `rows`, colonne par colonne (`width` : largeur, ou
    la colonne d'origine de chaque colonne de la pièce)."""
    out = []
    for tx, sx in enumerate(_cols(width)):
        for ty in rows:
            row = 33 + ty % 2
            src = sx + 4 if row == 34 and 2 <= sx <= 4 else sx          # la rangée 9 sans le tapis de sortie
            out.append({'from': (AZ, 10 + src, row, 1, 1), 'to': (tx, ty), 'sol': True, 'only': ('Floor',)})
    return out


def fargas_wall_base(width):
    """Le bas des boiseries (rangée 2) remis après l'effacement du mobilier."""
    return [{'from': (AZ, 10 + sx, 27, 1, 1), 'to': (tx, 2), 'only': ('Wall',)} for tx, sx in enumerate(_cols(width))]


# Premier pub : la maison de Fargas élargie (20 x 11) : 4 colonnes de boiseries nues insérées après la 8e (colonnes
# 5 et 6 d'origine), une rangée de plancher en plus.
PUB_A_COLS = list(range(8)) + [5, 6, 5, 6] + list(range(8, 16))
PUB_A_ROWS = list(range(9)) + [8, 9]


def stretched(name, cols, rows, pick):
    """Pièce agrandie case par case. cols / rows : colonnes et rangées de la carte d'origine, dans l'ordre ; une entrée
    None est insérée ; pick(x, y, ix, iy) donne la case d'origine d'une case insérée (ix / iy : colonne / rangée insérée
    ou None). Renvoie (collages, cases libres)."""
    paste, free = [], []
    for ty, sy in enumerate(rows):
        for tx, sx in enumerate(cols):
            src = pick(sx, sy, tx, ty)
            paste.append({'from': (name, src[0], src[1], 1, 1), 'to': (tx, ty), 'sol': True})
            r = HG.room(name, src[0], src[1], 1, 1)
            # Libre : une case d'origine praticable, ou du tapis nu (case insérée, canapé retiré).
            if r['sol'][0] and (not r['solid'][0] or len(src) > 2):
                free.append([tx, ty])
    return paste, free


def blocked(pieces):
    """Cases bloquées par des meubles collés (leurs passages), pour les rebloquer après les cases libérées."""
    out = []
    for p in pieces:
        name, sx, sy, w, h = p['from']
        r = HG.room(name, sx, sy, w, h)
        for i in range(w * h):
            if r['solid'][i] and (r['decor'][i] or r['dessus'][i]):
                out.append([p['to'][0] + i % w, p['to'][1] + i // w])
    return out


# The Asylum : le salon du casino de Doublonville (17 x 14, colonnes 8-24, rangées 8-21), élargi de 8 colonnes et allongé
# de 4 rangées insérées au milieu ; une case insérée reprend le motif pur du tapis (colonnes 14-15, rangées 14-15, selon
# la parité), les murs du haut leur colonne (rideaux et piliers), les murs des côtés leur rangée 14.
AS_COLS = list(range(8, 14)) + [None] * 8 + list(range(14, 25))
AS_ROWS = list(range(8, 15)) + [None] * 4 + list(range(15, 22))


def _as_pick(sx, sy, tx, ty):
    """Case d'origine d'une case du salon agrandi ; un 3e élément : tapis nu, toujours praticable."""
    if sx is None:
        sx = 14 + (tx - 6) % 2
        if sy is not None and sy >= 18:
            return 14, sy                             # le bas : bordure et tapis de sortie seulement en 16-17
        if sy is None:
            return sx, 14 + (ty - 7) % 2, 'tapis'
        if sy in (12, 13, 16, 17):
            return sx, 14 + sy % 2, 'tapis'
        return (sx, sy, 'tapis') if 12 <= sy <= 17 else (sx, sy)
    if sy is None:
        if sx <= 12 or sx >= 20:
            return sx, 14
        return sx, 14 + (ty - 7) % 2, 'tapis'
    if sx in (15, 16, 17, 18) and sy in (12, 13):    # le canapé du haut laisse la place au DJ
        return 14 + sx % 2, 14 + sy % 2, 'tapis'
    if sx in (15, 16, 17) and sy in (14, 15):
        return sx, sy, 'tapis'
    return sx, sy


_as_paste, _as_free = stretched(GC, AS_COLS, AS_ROWS, _as_pick)
# Le mur du fond, désencombré (retour de l'utilisateur) : le mur nu du casino (calque Wall_A, sans rideaux, statues
# derrière vitre ni tableau), en rythme régulier : le mur d'origine entier (colonnes 10-22 : pilier, fenêtre en arc,
# niche, fenêtre, pilier), puis encore une fenêtre et une niche (10-17) ; le pilier de la colonne 22 et celui de la 10
# se raccordent en un seul.
AS_BACK = dict(zip(range(2, 23), list(range(10, 23)) + list(range(10, 18))))
for _p in _as_paste:
    _tx, _ty = _p['to']
    if _ty <= 2 and _tx in AS_BACK:
        _p['from'] = (GC, AS_BACK[_tx], _p['from'][2], 1, 1)
        _p['only'] = ('Floor', 'Wall_A')
    if _ty == 3 and _tx in (2, 22):                  # les pots des plantes d'angle (leur feuillage était au mur)
        _p['only'] = ('Floor', 'Wall')
    # Les petits murs des recoins du bas (arches d'angle, rangées 12-14) : au-dessus, le vide noir du casino laisse
    # place au bord de la salle et au sol, comme les rangées voisines (le haut du petit mur n'est plus noir).
    if _ty == 11 and _tx in (2, 3, 21, 22):
        _p['from'] = (GC, AS_COLS[_tx], 14, 1, 1)
    if _ty == 12 and _tx in (2, 3, 21, 22):          # le haut du petit mur : sa corniche est un meuble (plus bas)
        _p['only'] = ('Floor',)
# … et le sol de la salle derrière ce haut de mur (le casino n'en a pas là).
_as_paste += [{'from': (GC, AS_COLS[tx], 14, 1, 1), 'to': (tx, 12), 'sol': True, 'only': ('Floor',)}
              for tx in (2, 3, 21, 22)]


def wall_top_no_ceiling(sx, sy):
    """Haut d'un petit mur du casino sans le bord du plafond (noir pur) dessiné dans la case : la corniche seule."""
    import numpy as np
    r = HG.room(GC, sx, sy, 1, 1, only=('Wall',))
    img = Image.new('RGBA', (T, T))
    for t in r['decor'][0] + r['dessus'][0]:
        img.alpha_composite(t)
    a = np.array(img)
    a[(a[..., 0] == 0) & (a[..., 1] == 0) & (a[..., 2] == 0)] = 0
    return Image.fromarray(a)


for _tx in (2, 3, 21, 22):
    ITEMS[f'h-corniche-{_tx}'] = {'img': (lambda sx=AS_COLS[_tx]: wall_top_no_ceiling(sx, 16)), 'solid': 1, 'flat': True}
# Le bar (comptoir de la tour Radio, ses deux bouts) en haut à gauche ; le DJ (console et table à micros du studio de la
# tour Radio) au milieu du fond ; des guéridons et chaises du salon à droite.
AS_FURNITURE = [
    {'from': (RT, 13, 118, 4, 2), 'to': (3, 4)}, {'from': (RT, 20, 118, 4, 2), 'to': (7, 4)},
    {'from': (RT, 26, 58, 2, 2), 'to': (13, 4)}, {'from': (RT, 29, 58, 3, 2), 'to': (15, 4)},
    {'from': (GC, 21, 12, 2, 2), 'to': (21, 7)}, {'from': (GC, 21, 12, 2, 2), 'to': (21, 10)},
]

PLANS = {
    # Premier pub : le salon de la tour Radio (23 x 12). Le comptoir en U au fond à gauche : le barman dedans, les
    # clients commandent depuis la rangée 7 (le comptoir en rangée 8) ; la bande aux deux tables basses à canapés, à
    # droite ; le tapis de sortie en bas à gauche (1, 11).
    'hullPubA': {
        'hgss': (AZ, 10, 25, 20, 11),
        'splice': [{'from': (AZ, 10 + sx, 25 + sy, 1, 1), 'to': (tx, ty)}
                   for ty, sy in enumerate(PUB_A_ROWS) for tx, sx in enumerate(PUB_A_COLS)],
        'erase': [(0, 2, 20, 9)],
        'paste': fargas_floor(PUB_A_COLS, range(2, 10)) + fargas_wall_base(PUB_A_COLS),
        'items': [
            # Le bar : long comptoir (on commande par-dessus, la rangée 5 ; le barman derrière, rangée 4), étagères à
            # bouteilles au mur, pompes et pintes dessus, tonneaux aux deux bouts (on ne passe pas derrière).
            ['ci-etagere-bouteilles', 2, 2], ['ci-etagere-bouteilles', 6, 2],
            ['ci-long-comptoir', 2, 5, {'solid': [[0] * 7, [1] * 7]}],
            ['ci-pompes-biere', 3, 4], ['ci-pompes-biere', 6, 4], ['ci-pintes', 4, 4], ['ci-pintes', 8, 4],
            ['ci-tonneau', 1, 4], ['ci-tonneau', 1, 3], ['ci-tonneau', 9, 4], ['ci-lampe-laiton', 9, 3],
            *[['ci-tabouret-bar', x, 6] for x in (3, 5, 7)],
            # Les deux tables de la bande (une commande chacun), tabourets autour.
            ['ci-table-bois', 13, 6], ['ci-table-bois', 13, 9],
            *[['ci-tabouret-bar', x, y] for x in (12, 15) for y in (5, 8)],
            # Banquettes le long du mur de droite, petites tables rondes près de l'entrée, la cible au mur.
            ['ci-table-rouge-g', 16, 5], ['ci-table-rouge-d', 18, 5],
            ['ci-table-rouge-g', 16, 9], ['ci-table-rouge-d', 18, 9],
            ['ci-table-pub', 7, 9], ['ci-tabouret-bar', 6, 9], ['ci-tabouret-bar', 8, 9],
            ['ci-table-pub', 10, 7], ['ci-tabouret-bar', 9, 7], ['ci-tabouret-bar', 11, 7],
            ['cible', 11, 2], ['ci-tonneau', 0, 9], ['ci-tonneau', 19, 10],
        ],
    },
    # Second pub : la maison de Fargas (16 x 10), en pub anglais. Boiseries et fenêtres d'origine ; plancher partout (plus
    # de tatamis) ; le comptoir en U de droite, nu, est le bar (barmaid dedans), l'étagère à bouteilles au mur derrière,
    # pompes à bière et pintes dessus ; deux banquettes rouges à gauche (des habitués), la table de la bande au milieu
    # (tabourets), la cible au mur (l'habitué devant), deux petites tables rondes près de l'entrée, des tonneaux ;
    # sortie (3, 9).
    'hullPubB': {
        'hgss': (AZ, 10, 25, 16, 10),
        'erase': [(0, 2, 16, 8)],
        'paste': fargas_floor(16, range(2, 9)) + fargas_wall_base(16) + [
            {'from': (AZ, 21, 28, 5, 4), 'to': (11, 3), 'only': ('Props_A_1',)},     # le bar en U
            {'from': (AZ, 17, 30, 2, 2), 'to': (7, 5), 'only': ('Props_A_1',)},      # la table de la bande
        ],
        'items': [
            ['ci-etagere-bouteilles', 11, 2], ['ci-pompes-biere', 12, 3], ['ci-pompes-biere', 14, 3],
            ['ci-pintes', 13, 3], ['ci-pintes', 11, 4], ['cible', 7, 2],
            ['ci-table-rouge-g', 0, 5], ['ci-table-rouge-d', 2, 5],
            ['ci-table-rouge-g', 0, 8], ['ci-table-rouge-d', 2, 8],
            *[['ci-tabouret-bar', x, y] for x, y in ((6, 5), (9, 5), (6, 6), (9, 6))],
            ['ci-table-pub', 6, 8], ['ci-tabouret-bar', 5, 8], ['ci-tabouret-bar', 7, 8],
            ['ci-table-pub', 10, 8], ['ci-tabouret-bar', 9, 8], ['ci-tabouret-bar', 11, 8],
            ['ci-tonneau', 15, 8], ['ci-tonneau', 15, 9], ['ci-tonneau', 14, 9],
        ],
        'free': [[x, y] for x in (12, 13, 14) for y in (5, 6)],                     # dans le bar
    },
    # The Asylum : le salon du casino de Doublonville agrandi (25 x 18, voir _as_pick) ; le bar en haut à gauche, le DJ
    # au fond, la piste au milieu du grand tapis (x 6-14, y 7-11) ; sortie (16, 16).
    'hullAsylum': {
        'hgss': (GC, 60, 60, len(AS_COLS), len(AS_ROWS)),
        'paste': _as_paste + AS_FURNITURE,
        'free': _as_free,
        'block': blocked(AS_FURNITURE),
        'items': [[f'h-corniche-{tx}', tx, 12] for tx in (2, 3, 21, 22)],
    },
    # Bibliothèque Brynmor Jones : le labo des Ruines Alpha (11 x 13), ses machines remplacées par deux tables de
    # lecture à coussins (appartements de Doublonville), deux rayonnages de plus en haut à gauche ; sortie (3, 11).
    'hullLibrary': {
        'hgss': (RA, 10, 8, 11, 13),
        'erase': [(3, 4, 8, 6), (2, 3, 1, 1)],
        'paste': [{'from': (GI, 51, 12, 4, 2), 'to': (3, 5)}, {'from': (GI, 51, 12, 4, 2), 'to': (7, 5)},
                  {'from': (RA, 17, 8, 4, 3), 'to': (0, 0)}],
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
    # Chez Léo : le grand salon de Bourg Geon (13 x 13 : cuisine, télé, canapés autour de la table) ; la sortie est sur
    # le côté droit (11, 6), comme dans le jeu.
    'hullHouse': {'hgss': (NB, 29, 10, 13, 13)},
    # La coloc : un appartement de Doublonville (9 x 8 : cuisine, bibliothèque, table à coussins) et le lit de Pierre
    # (chambre de Bourg Geon) ; sortie (3, 7).
    'hullColoc': {
        'hgss': (GI, 47, 8, 9, 8),
        'paste': [{'from': (NB, 10, 40, 2, 3), 'to': (0, 4)}],
        'block': [[0, 4], [1, 4], [0, 5], [1, 5], [0, 6], [1, 6]],
    },
}
