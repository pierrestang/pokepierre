"""Prépare les planches de décor Rouge Feu / Vert Feuille (assets-source/frlg/, fournies par
l'utilisateur, usage personnel uniquement) pour le jeu, dans public/assets/tiles/ :

  frlg-outdoor.png   tuiles d'extérieur (16 x 16, une ligne transparente entre deux : pas de 17 px,
                     première tuile en 1, 1) — copie telle quelle ;
  frlg-rims.png      liserés d'herbe seuls (bordures du chemin de sable sans le sable), voir grass_rims ;
  frlg-ferry.png     ferry des îles Sevii détouré (voir ferry) ;
  frlg-stairs.png    escalier du petit plateau en pierre blanche (voir white_stairs) ;
  frlg-searock.png   rocher dans la mer, sans l'eau autour (voir sea_rock) ;
  frlg-rooms.png     trois pièces d'intérieur (11 x 9 cases) côte à côte (voir ROOMS) ;
  frlg-travel-sea.png  mer de la traversée en ferry (256 x 192, répétable) ;
  frlg-ferry-wake.png  ferry avec son sillage, pour la traversée (voir ferry_wake) ;
  frlg-townmap.png     carte du voyage : mer rayée, point de ville, tête de Red (voir town_map) ;
  frlg-beachrock.png   rocher de plage sans écume (voir beach_rock) ;
  frlg-center-items.png  ordinateur et télé murale du Centre Pokémon (voir center_items) ;
  emerald-trees.png    deux arbres tropicaux d'Émeraude, sur sable puis sur herbe (voir tropical_trees) ;
  rs-objects.png       meubles de Rubis/Saphir (planche d'objets), fond blanc extérieur rendu transparent ;
  rs-berries.png       quatre plantes à baies fleuries (voir berry_plants) ;
  frlg-fields.png      champs de la campagne : blé (hautes herbes dorées) puis terre labourée à pousses (voir fields) ;
  rs-stairs.png        escaliers encastrés dans le mur de la maison de Bourg-en-Vol, qui monte puis qui descend
                       (voir rs_stairs) ;
  frlg-props.png     planche de Hoeloe (arbre isolé, rocher, mer animée…), fond violet rendu transparent ;
  frlg-seven.png     carte de Seven Island (24 x 20 cases), sans le cadre ;
  frlg-buildings.png bâtiments entiers, fond blanc extérieur rendu transparent ;
  rs-cabane.png      cabane perchée de Fortree City (Rubis/Saphir), détourée de la forêt, avec deux pilotis ;
                     puis son intérieur (tronc, deux bancs), 128 x 96 px, à droite (voir cabane) ;
  rs-bigtree.png     gros arbre feuillu de Fortree City (3 cases de large), détouré de la forêt, tronc prolongé
                     jusqu'au sol (voir big_tree) ;
  frlg-shed.png      cabane de jardin au toit orange (3 x 4 cases) assemblée à partir de deux maisons de la
                     planche de bâtiments de fabnt (tilesets-tileset_1.png), voir shed ;
  frlg-car.png       voiture bleue de la famille, vue de côté (vers la gauche, puis vers la droite), réduite de
                     moitié (voir family_car). Planche « FRLG Tilesets - Cars » de pinkscales (DeviantArt), dans
                     assets-source/fan/ : libre pour un projet de fan non commercial, avec crédit à pinkscales.
Toutes les couleurs sont ramenées à la même conversion GBA (voir gba_palette).

Usage : python3 scripts/build_frlg_tiles.py
"""
from collections import deque
from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / 'assets-source' / 'frlg'
OUT = ROOT / 'public' / 'assets' / 'tiles'


def clear_color(im, color):
    """Rend transparents tous les pixels d'une couleur (fond uni)."""
    im.putdata([(0, 0, 0, 0) if p == color else p for p in im.getdata()])
    return im


def gba_palette(im):
    """Ramène les couleurs à la même conversion GBA que la planche d'extérieur (composante x 8).
    Certaines planches ont été extraites avec composante x 255 / 31 (ex. 115, 205, 164 au lieu de
    112, 200, 160) : sans correction, on verrait des carrés de teinte différente entre les tuiles."""
    def fix(p):
        if p[3] == 0 or all(v % 8 == 0 for v in p[:3]):
            return p
        return tuple(round(v * 31 / 255) * 8 for v in p[:3]) + (p[3],)
    im.putdata([fix(p) for p in im.getdata()])
    return im


def clear_outside(im, color):
    """Rend transparents les pixels de `color` reliés au bord de l'image (fond autour des bâtiments),
    sans toucher au blanc à l'intérieur des bâtiments (vitres, enseignes)."""
    px = im.load()
    w, h = im.size
    queue = deque([(x, y) for x in range(w) for y in (0, h - 1)] + [(x, y) for y in range(h) for x in (0, w - 1)])
    seen = set()
    while queue:
        x, y = queue.popleft()
        if (x, y) in seen or not (0 <= x < w and 0 <= y < h) or px[x, y] != color:
            continue
        seen.add((x, y))
        px[x, y] = (0, 0, 0, 0)
        queue.extend(((x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1)))
    return im


def grass_rims(outdoor):
    """Liserés d'herbe seuls : les 12 tuiles de bordure du chemin de sable (colonnes 1-4, rangées 0-2 de
    la planche d'extérieur) sans leurs pixels de sable, à poser sur une plage bordée d'écume quand elle
    touche aussi l'herbe. Même disposition que la planche d'extérieur (pas de 17 px)."""
    tile = lambda c, r: outdoor.crop((1 + 17 * c, 1 + 17 * r, 17 + 17 * c, 17 + 17 * r))
    sand = set(tile(0, 0).getdata())
    out = Image.new('RGBA', (1 + 17 * 5, 1 + 17 * 3), (0, 0, 0, 0))
    for r in range(3):
        for c in range(1, 5):
            t = tile(c, r)
            t.putdata([(0, 0, 0, 0) if p in sand else p for p in t.getdata()])
            out.paste(t, (1 + 17 * c, 1 + 17 * r))
    return out


def white_stairs(outdoor):
    """Escalier du petit plateau (cases 20 et 21 de la rangée 17 de la planche d'extérieur) en pierre
    blanche : marches blanches, ombres des marches gris clair."""
    white = {
        (120, 120, 128, 255): (192, 192, 208, 255),
        (144, 160, 176, 255): (216, 216, 224, 255),
        (168, 184, 200, 255): (232, 232, 240, 255),
        (200, 216, 232, 255): (248, 248, 248, 255),
        (240, 240, 248, 255): (248, 248, 248, 255),
    }
    out = Image.new('RGBA', (32, 16), (0, 0, 0, 0))
    for i, c in enumerate((20, 21)):
        t = outdoor.crop((1 + 17 * c, 1 + 17 * 17, 17 + 17 * c, 17 + 17 * 17))
        t.putdata([white.get(p, p) for p in t.getdata()])
        out.paste(t, (i * 16, 0))
    return out


def sea_rock(seven):
    """Rocher dans la mer de Seven Island (16 x 16 en 41, 279) sans l'eau autour : la mer animée passe
    dessous (voir src/art/frlgArt.js)."""
    sea = set(seven.crop((0, 14 * 16, 32, 16 * 16)).getdata())
    rock = seven.crop((41, 279, 57, 295))
    rock.putdata([(0, 0, 0, 0) if p in sea else p for p in rock.getdata()])
    return rock


# Pièces d'intérieur Rouge Feu (11 x 9 cases chacune), rangées côte à côte dans frlg-rooms.png :
# 0 = maison de Three Island (cuisine, frigo, étagères, table), 1 = maison du dresseur de Seven Island
# (bibliothèques, placards jaunes), 2 = maison inutilisée de Seven Island (fenêtres à rideaux, panneau),
# 3 = maison de Lostelle à Three Island (bureau au globe).
ROOMS = [
    ('maps__towns_buildings_etc._-three_island.png', (400, 376)),
    ('maps__towns_buildings_etc._-seven_island.png', (648, 24)),
    ('maps__towns_buildings_etc._-seven_island.png', (848, 192)),
    ('maps__towns_buildings_etc._-three_island.png', (400, 544)),
]
ROOM_W, ROOM_H = 11 * 16, 9 * 16


def rooms(rgba):
    out = Image.new('RGBA', (ROOM_W * len(ROOMS), ROOM_H), (0, 0, 0, 0))
    for i, (name, (x, y)) in enumerate(ROOMS):
        out.paste(rgba(name).crop((x, y, x + ROOM_W, y + ROOM_H)), (i * ROOM_W, 0))
    out = gba_palette(out)
    # Les plantes de la pièce 0 sont dans la colonne du bord, au parquet plus sombre : partout où l'on voit
    # ce parquet sombre (couleurs de la case vide 0, 5), on remet le parquet normal (case 8, 4 de la pièce 1)
    # au même endroit, pour que les plantes se posent n'importe où dans une pièce.
    tile = lambda room, c, r: out.crop((room * ROOM_W + c * 16, r * 16, room * ROOM_W + c * 16 + 16, r * 16 + 16))
    dark = set(tile(0, 0, 5).getdata())
    floor = tile(1, 8, 4).load()
    px = out.load()
    for y in range(16, 5 * 16):
        for x in range(16):
            if px[x, y] in dark:
                px[x, y] = floor[x, y % 16]
    return out


def cut_out(im, background):
    """Rend transparents les pixels des couleurs `background` reliés au bord de l'image, puis ne garde que
    le plus grand morceau (l'objet)."""
    px = im.load()
    w, h = im.size
    queue = deque([(x, y) for x in range(w) for y in (0, h - 1)] + [(x, y) for y in range(h) for x in (0, w - 1)])
    seen = set()
    while queue:
        x, y = queue.popleft()
        if (x, y) in seen or not (0 <= x < w and 0 <= y < h) or px[x, y] not in background:
            continue
        seen.add((x, y))
        px[x, y] = (0, 0, 0, 0)
        queue.extend(((x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1)))
    keep_largest(im)
    return im


def center_items(three):
    """Ordinateur (case 11, rangées 1-2) et télé murale (cases 7-8, rangées 0-1) du Centre Pokémon de
    Three Island (origine 400, 24), sans le mur ni le sol du centre : 16 x 32 puis 32 x 32, côte à côte."""
    cell = lambda c, r, w=1, h=1: three.crop((400 + c * 16, 24 + r * 16, 400 + (c + w) * 16, 24 + (r + h) * 16))
    background = set()
    for c, r in ((12, 3), (6, 5), (3, 3), (10, 0), (12, 0), (13, 0), (5, 0), (6, 0), (9, 0)):
        background |= set(cell(c, r).getdata())
    out = Image.new('RGBA', (48, 32), (0, 0, 0, 0))
    out.paste(cut_out(cell(11, 1, 1, 2), background), (0, 0))
    out.paste(cut_out(cell(7, 0, 2, 2), background), (16, 0))
    return out


def beach_rock(props):
    """Rocher gris de la planche de Hoeloe (16 x 16 en 140, 3) sans l'écume blanche autour : posé sur le
    sable, il ne doit pas avoir de contour blanc."""
    rock = props.crop((140, 3, 156, 19))
    foam = {(200, 216, 232, 255), (240, 240, 248, 255)}
    px = rock.load()
    queue = deque([(x, y) for x in range(16) for y in range(16) if px[x, y][3] == 0])
    seen = set(queue)
    while queue:
        x, y = queue.popleft()
        for n in ((x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1)):
            if 0 <= n[0] < 16 and 0 <= n[1] < 16 and n not in seen and px[n] in foam:
                seen.add(n)
                px[n] = (0, 0, 0, 0)
                queue.append(n)
    return rock


def tropical_trees(emerald):
    """Arbres tropicaux à racines d'Émeraude (planche d'extérieur, 32 x 32 chacun), sans leur fond : sur le
    sable (cases 72-73, 15-16) puis sur l'herbe (cases 78-79, 17-18), côte à côte."""
    out = Image.new('RGBA', (64, 32), (0, 0, 0, 0))
    for i, (c, r, background) in enumerate((
        (72, 15, {(216, 200, 128, 255), (208, 176, 104, 255), (224, 216, 160, 255)}),
        (78, 17, {(112, 192, 160, 255), (64, 176, 128, 255), (160, 208, 192, 255)}),
    )):
        tree = emerald.crop((c * 16, r * 16, c * 16 + 32, r * 16 + 32))
        # Deux rangées du haut : restes des racines roses de l'arbre rangé au-dessus dans la planche.
        px = tree.load()
        for y in range(2):
            for x in range(32):
                if px[x, y][:3] in ((128, 88, 88), (152, 112, 112), (184, 144, 136)):
                    px[x, y] = (0, 0, 0, 0)
        out.paste(cut_out(tree, background), (i * 32, 0))
    return out


def berry_plants():
    """Quatre plantes à baies arrivées à maturité (Rubis/Saphir, planche des arbres à baies, fond en damier
    rendu transparent) : arbuste rose, pêcher, baies bleues, fleurs rouges ; 16 x 32 chacune, posées en bas.
    Le jeu n'utilise que les baies bleues et les fleurs rouges."""
    sheet = Image.open(ROOT / 'assets-source' / 'rs' / 'miscellaneous-berry_trees.png').convert('RGBA')
    checker = {(142, 255, 146, 255), (255, 196, 222, 255)}
    sheet.putdata([(0, 0, 0, 0) if p in checker else p for p in sheet.getdata()])
    out = Image.new('RGBA', (64, 32), (0, 0, 0, 0))
    for i, x in enumerate((160, 640, 736, 1024)):
        plant = sheet.crop((x, 30, x + 16, 66))
        plant = plant.crop(plant.getbbox())
        out.paste(plant, (i * 16 + (16 - plant.width) // 2, 32 - plant.height))
    return out


def ferry(sheet):
    """Ferry des îles Sevii (écran d'exemple « Heading to », proue à droite), détouré : l'eau autour
    (ses teintes bleues, relevées hors du ferry) est enlevée par remplissage depuis les bords, puis
    l'écume du sillage (tout ce qui est à gauche du contour sombre de la coque) et les reflets isolés."""
    water = {p for x in range(552, 800) for y in range(48, 160)
             if not (640 <= x <= 722 and 78 <= y <= 128)
             for p in [sheet.getpixel((x, y))] if p[2] - p[0] > 60}
    im = sheet.crop((640, 78, 722, 128))
    px = im.load()
    w, h = im.size
    queue = deque([(x, y) for x in range(w) for y in (0, h - 1)] + [(x, y) for y in range(h) for x in (0, w - 1)])
    seen = set()
    while queue:
        x, y = queue.popleft()
        if (x, y) in seen or not (0 <= x < w and 0 <= y < h) or px[x, y] not in water:
            continue
        seen.add((x, y))
        px[x, y] = (0, 0, 0, 0)
        queue.extend(((x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1)))
    dark = lambda p: p[3] and sum(p[:3]) < 400
    for y in range(h):
        first = next((x for x in range(w) if dark(px[x, y])), w)
        for x in range(first):
            px[x, y] = (0, 0, 0, 0)
    keep_largest(im)                    # reflets et gouttes isolés enlevés
    im = im.crop(im.getbbox())
    # Pointe d'écume restée collée à gauche de la coque.
    px = im.load()
    for y in range(im.height):
        for x in range(4):
            if px[x, y][3] and sum(px[x, y][:3]) > 600:
                px[x, y] = (0, 0, 0, 0)
    return im.crop(im.getbbox())


def ferry_wake(sheet):
    """Ferry avec son sillage (écran d'exemple « Heading to », proue à droite), pour la traversée : l'eau
    (ses teintes bleues) est enlevée par remplissage depuis les bords, reflets isolés enlevés."""
    blue = {p for x in range(560, 800) for y in range(50, 160) for p in [sheet.getpixel((x, y))] if p[2] - p[0] > 60}
    im = sheet.crop((552, 64, 722, 136))
    px = im.load()
    w, h = im.size
    queue = deque([(x, y) for x in range(w) for y in (0, h - 1)] + [(x, y) for y in range(h) for x in (0, w - 1)])
    seen = set()
    while queue:
        x, y = queue.popleft()
        if (x, y) in seen or not (0 <= x < w and 0 <= y < h) or px[x, y] not in blue:
            continue
        seen.add((x, y))
        px[x, y] = (0, 0, 0, 0)
        queue.extend(((x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1)))
    keep_largest(im)
    return im.crop(im.getbbox())


def keep_largest(im):
    """Ne garde que le plus grand morceau opaque de l'image (enlève les reflets et gouttes isolés)."""
    px = im.load()
    w, h = im.size
    seen, parts = set(), []
    for y in range(h):
        for x in range(w):
            if px[x, y][3] and (x, y) not in seen:
                part, queue = [], deque([(x, y)])
                seen.add((x, y))
                while queue:
                    a, b = queue.popleft()
                    part.append((a, b))
                    for n in ((a + 1, b), (a - 1, b), (a, b + 1), (a, b - 1)):
                        if 0 <= n[0] < w and 0 <= n[1] < h and px[n][3] and n not in seen:
                            seen.add(n)
                            queue.append(n)
                parts.append(part)
    for part in sorted(parts, key=len)[:-1]:
        for p in part:
            px[p] = (0, 0, 0, 0)


def town_map(sheet):
    """Éléments de la carte de Rouge Feu pour la carte du voyage, côte à côte : mer rayée (16 x 16),
    point de ville (8 x 8), tête de Red (16 x 16, fond orange rendu transparent)."""
    out = Image.new('RGBA', (40, 16), (0, 0, 0, 0))
    out.paste(sheet.crop((274, 1104, 290, 1120)), (0, 0))
    out.paste(sheet.crop((538, 98, 546, 106)), (16, 0))
    head = clear_color(sheet.crop((732, 42, 748, 58)), (255, 127, 39, 255))
    out.paste(head, (24, 0))
    return out


# Escaliers de la maison du héros à Bourg-en-Vol (Rubis/Saphir) : cadre de bois encastré dans le mur,
# 23 x 23 px, pieds des montants posés sur le parquet. Qui monte, puis qui descend (planche des intérieurs).
RS_STAIRS = [(316, 50), (508, 50)]
RS_STAIRS_W, RS_STAIRS_H = 23, 23
RS_WALL = {(208, 208, 176), (176, 176, 160), (248, 248, 248)}
RS_FLOOR = {(176, 160, 72), (200, 192, 88), (168, 136, 56), (144, 112, 40)}


def rs_stairs():
    sheet = Image.open(ROOT / 'assets-source' / 'rs' / 'backgrounds-interior_areas.png').convert('RGBA')
    out = Image.new('RGBA', (RS_STAIRS_W * len(RS_STAIRS), RS_STAIRS_H), (0, 0, 0, 0))
    for i, (x0, y0) in enumerate(RS_STAIRS):
        im = sheet.crop((x0, y0, x0 + RS_STAIRS_W, y0 + RS_STAIRS_H))
        px = im.load()
        for y in range(RS_STAIRS_H):
            for x in range(RS_STAIRS_W):
                rgb = px[x, y][:3]
                # Le mur autour du cadre (hors des montants) et le parquet sous le cadre disparaissent.
                if rgb in RS_WALL and (x in (0, RS_STAIRS_W - 1) or y == 0 or y >= 21):
                    px[x, y] = (0, 0, 0, 0)
                elif y >= 21 and rgb in RS_FLOOR:
                    px[x, y] = (0, 0, 0, 0)
        out.paste(im, (i * RS_STAIRS_W, 0))
    return out


# Blé : les hautes herbes de Rouge Feu (colonne 7, rangée 0), vertes passées au doré.
# Le fond d'herbe (112, 200, 160) reste vert : les épis dorés poussent sur l'herbe, sans bord net autour du champ.
WHEAT_COLORS = {
    (160, 224, 192): (248, 232, 152), (64, 176, 136): (208, 160, 64),
    (56, 144, 48): (184, 128, 40), (56, 88, 16): (120, 80, 24), (24, 160, 104): (168, 112, 40),
}


def fields(outdoor):
    out = Image.new('RGBA', (32, 16), (0, 0, 0, 0))
    wheat = outdoor.crop((1 + 17 * 7, 1, 1 + 17 * 7 + 16, 17)).convert('RGBA')
    wheat.putdata([WHEAT_COLORS.get(p[:3], p[:3]) + (255,) for p in wheat.getdata()])
    out.paste(wheat, (0, 0))
    # Terre labourée : sillons horizontaux (crête claire, terre, sillon sombre) et jeunes pousses sur les crêtes,
    # décalées d'un sillon à l'autre.
    ridge, soil, furrow = (200, 144, 88), (168, 112, 64), (112, 72, 40)
    leaf, leaf_light = (56, 144, 48), (112, 200, 96)
    px = out.load()
    for y in range(16):
        for x in range(16):
            px[16 + x, y] = (ridge, soil, soil, furrow)[y % 4] + (255,)
    for row, y in enumerate((1, 5, 9, 13)):
        for x in ((3, 11) if row % 2 == 0 else (7, 15)):
            px[16 + x, y - 1] = leaf_light + (255,)
            for dx in (-1, 0, 1):
                px[16 + (x + dx) % 16, y] = leaf + (255,)
    return out


# Voitures de pinkscales : 2 colonnes (vers la gauche, vers la droite) x 5 couleurs, cases de 96 x 64 px,
# voiture de 84 x 60 px à partir de (4, 4). Dessinées pour des cases de 32 px : réduites de moitié (un pixel
# sur deux, décalé de 1 pour garder les contours).
CAR_W, CAR_H = 42, 30


def family_car():
    sheet = Image.open(ROOT / 'assets-source' / 'fan' / 'pinkscales-frlg-cars.png').convert('RGBA')
    out = Image.new('RGBA', (2 * CAR_W, CAR_H), (0, 0, 0, 0))
    blue = 4
    for col in range(2):
        car = sheet.crop((col * 96 + 4, blue * 64 + 4, col * 96 + 88, blue * 64 + 64))
        px = car.load()
        for y in range(CAR_H):
            for x in range(CAR_W):
                out.putpixel((col * CAR_W + x, y), px[2 * x + 1, 2 * y + 1])
    return out


# Cabane perchée de Fortree City (planche rs/backgrounds-fortree_city.png, carte calée sur (5, 5)) : feuillage,
# cabane, plateforme de rondins et échelle, détourés en effaçant le motif de forêt qui se répète derrière ;
# deux pilotis sous la plateforme. L'échelle occupe les colonnes 32 à 47 de l'image (une case). À droite,
# l'intérieur de la cabane (tronc au milieu, deux bancs).
CABANE_BOX = (141, 22, 205, 113)
CABANE_ROOM = (331, 734, 459, 830)


def cabane():
    sheet = Image.open(ROOT / 'assets-source' / 'rs' / 'backgrounds-fortree_city.png').convert('RGBA')
    src = sheet.load()
    ox, oy = 5, 5
    tiles = {}
    for ty in range(4):
        for tx in range(14, 20):
            t = tuple(src[ox + tx * 16 + x, oy + ty * 16 + y] for y in range(16) for x in range(16))
            tiles[t] = tiles.get(t, 0) + 1
    forest = max(tiles, key=tiles.get)                      # case de forêt la plus fréquente
    x0, y0, x1, y1 = CABANE_BOX
    w, h = x1 - x0, y1 - y0
    hut = Image.new('RGBA', (w, h), (0, 0, 0, 0))
    o = hut.load()
    for y in range(h):
        for x in range(w):
            p = src[x0 + x, y0 + y]
            if p != forest[((y0 + y - oy) % 16) * 16 + (x0 + x - ox) % 16]:
                o[x, y] = p
    # Bas de la plateforme : dernière rangée presque pleine (les touffes d'herbe dessous n'atteignent pas 50 px).
    bottom = max(y for y in range(h) if sum(1 for x in range(w) if o[x, y][3]) > 50)
    palette = {o[x, y][:3] for y in range(bottom - 12, bottom + 1) for x in range(w) if o[x, y][3]}
    for y in range(bottom + 1, h):                          # sous la plateforme : l'échelle seule
        for x in range(w):
            if not 24 <= x < 40 or o[x, y][:3] not in palette:
                o[x, y] = (0, 0, 0, 0)
    keep = set(max(components(o, w, h), key=len))          # sans les pixels isolés
    for y in range(h):
        for x in range(w):
            if (x, y) not in keep:
                o[x, y] = (0, 0, 0, 0)
            elif y >= 60 and not 24 <= x < 40 and o[x, y][1] > o[x, y][0] + 20 and o[x, y][1] > o[x, y][2] + 20:
                o[x, y] = (0, 0, 0, 0)                      # touffes d'herbe sous la plateforme
    outside = set()
    todo = deque([(x, y) for x in range(w) for y in (0, h - 1)] + [(x, y) for y in range(h) for x in (0, w - 1)])
    while todo:
        x, y = todo.popleft()
        if (x, y) in outside or not (0 <= x < w and 0 <= y < h) or o[x, y][3]:
            continue
        outside.add((x, y))
        todo.extend([(x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1)])
    for y in range(60):                                     # trous dans le feuillage : rebouchés
        for x in range(w):
            if not o[x, y][3] and (x, y) not in outside:
                o[x, y] = src[x0 + x, y0 + y]
    # Échelle décalée de 8 px vers la droite (colonnes 32 à 47) : la cabane posée sur deux sapins de la grille
    # (blocs de 2 x 2 cases), l'échelle tombe sur une case entière. Sur la plateforme, le haut de l'échelle
    # laisse place aux planches voisines.
    before = hut.copy().load()
    for y in range(bottom - 4, h):
        for x in range(24, 32):
            o[x, y] = before[x + 16, y] if y <= bottom else (0, 0, 0, 0)
        for x in range(24, 40):
            o[x + 8, y] = before[x, y]
    dark, wood, light = (72, 72, 88, 255), (168, 136, 64, 255), (216, 192, 96, 255)
    for px in (5, 55):                                      # pilotis, accrochés sous la plateforme
        for y in range(bottom - 1, h):
            for dx, c in enumerate((dark, light, wood, dark)):
                o[px + dx, y] = c
        for dx in range(4):
            o[px + dx, h - 1] = dark
    out = Image.new('RGBA', (w + 128, max(h, 96)), (0, 0, 0, 0))
    out.paste(hut, (0, 0))
    out.paste(sheet.crop(CABANE_ROOM), (w, 0))
    return out


def components(o, w, h):
    seen = set()
    for sy in range(h):
        for sx in range(w):
            if not o[sx, sy][3] or (sx, sy) in seen:
                continue
            comp, todo = [], deque([(sx, sy)])
            seen.add((sx, sy))
            while todo:
                x, y = todo.popleft()
                comp.append((x, y))
                for dx in (-1, 0, 1):
                    for dy in (-1, 0, 1):
                        n = (x + dx, y + dy)
                        if 0 <= n[0] < w and 0 <= n[1] < h and n not in seen and o[n][3]:
                            seen.add(n)
                            todo.append(n)
            yield comp


# Cabane de jardin (Saint-Ay) : maisons au toit orange de tilesets-tileset_1.png (tuiles de 16 px séparées par
# une ligne blanche : pas de 17 px). Colonnes : le bord gauche et la porte de la maison à jardinières, puis un
# mur nu de la maison voisine, fermé par le bord droit de la première (sans sa fenêtre ni sa jardinière).
FARM_X = [17, 34, 51, 68, 85]                 # colonnes de tuiles des deux maisons
FARM_ROWS = [721, 738, 755, 772]              # maison à porte et jardinières
PLAIN_ROWS = [806, 823, 840, 857]             # maison à deux fenêtres
def shed():
    sheet = Image.open(SRC / 'tilesets-tileset_1.png').convert('RGBA')
    tile = (lambda sx, sy: sheet.crop((sx, sy, sx + 16, sy + 16)))
    out = Image.new('RGBA', (48, 16 * len(FARM_ROWS)), (255, 255, 255, 255))
    for r, (sy, plain) in enumerate(zip(FARM_ROWS, PLAIN_ROWS)):
        out.paste(tile(FARM_X[0], sy), (0, 16 * r))
        out.paste(tile(FARM_X[1], sy), (16, 16 * r))
        out.paste(tile(FARM_X[2], plain), (32, 16 * r))
        out.paste(tile(FARM_X[4], sy).crop((13, 0, 16, 16)), (45, 16 * r))     # bord droit
    # Fond blanc de la planche rendu transparent depuis les bords (le blanc des fenêtres reste).
    w, h = out.size
    o = out.load()
    todo = deque([(x, y) for x in range(w) for y in (0, h - 1)] + [(x, y) for y in range(h) for x in (0, w - 1)])
    while todo:
        x, y = todo.popleft()
        if not (0 <= x < w and 0 <= y < h) or o[x, y] != (255, 255, 255, 255):
            continue
        o[x, y] = (0, 0, 0, 0)
        todo.extend([(x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1)])
    return out


# Gros arbre feuillu de Fortree City (planche rs/backgrounds-fortree_city.png) : feuillage de 3 cases sur un
# tronc d'une case. Détouré de la forêt comme la cabane ; dans la planche, le bas du tronc se perd dans la
# forêt : il est prolongé de quelques rangées, avec des racines sombres et une ombre au sol.
BIG_TREE_BOX = (197, 109, 245, 150)           # du haut du feuillage jusqu'au bas du tronc intact


def big_tree():
    sheet = Image.open(ROOT / 'assets-source' / 'rs' / 'backgrounds-fortree_city.png').convert('RGBA')
    src = sheet.load()
    ox, oy = 5, 5
    tiles = {}
    for ty in range(4):
        for tx in range(14, 20):
            t = tuple(src[ox + tx * 16 + x, oy + ty * 16 + y] for y in range(16) for x in range(16))
            tiles[t] = tiles.get(t, 0) + 1
    forest = max(tiles, key=tiles.get)
    x0, y0, x1, y1 = BIG_TREE_BOX
    w, h = x1 - x0, y1 - y0
    base = 6                                    # rangées ajoutées sous le tronc
    tree = Image.new('RGBA', (w, h + base), (0, 0, 0, 0))
    o = tree.load()
    for y in range(h):
        for x in range(w):
            p = src[x0 + x, y0 + y]
            if p != forest[((y0 + y - oy) % 16) * 16 + (x0 + x - ox) % 16]:
                o[x, y] = p
    keep = set(max(components(o, w, h), key=len))
    for y in range(h):
        for x in range(w):
            if (x, y) not in keep:
                o[x, y] = (0, 0, 0, 0)
    outside = set()
    todo = deque([(x, y) for x in range(w) for y in (0, h - 1)] + [(x, y) for y in range(h) for x in (0, w - 1)])
    while todo:
        x, y = todo.popleft()
        if (x, y) in outside or not (0 <= x < w and 0 <= y < h) or o[x, y][3]:
            continue
        outside.add((x, y))
        todo.extend([(x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1)])
    for y in range(h):                          # trous dans le feuillage : rebouchés
        for x in range(w):
            if not o[x, y][3] and (x, y) not in outside:
                o[x, y] = src[x0 + x, y0 + y]
    trunk = [o[x, h - 1] for x in range(w)]     # dernière rangée intacte du tronc, répétée
    dark = (48, 48, 72, 255)
    for y in range(h, h + base):
        for x in range(w):
            if trunk[x][3]:
                o[x, y] = trunk[x]
    for x in range(w):                          # racines : contour sombre en bas, un peu évasé
        if trunk[x][3]:
            o[x, h + base - 1] = dark
    for x in (min(x for x in range(w) if trunk[x][3]) - 1, max(x for x in range(w) if trunk[x][3]) + 1):
        o[x, h + base - 1] = dark
        o[x, h + base - 2] = dark
    return tree


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    rgba = lambda name: Image.open(SRC / name).convert('RGBA')

    outdoor = rgba('tilesets-tileset_2.png')
    outdoor.save(OUT / 'frlg-outdoor.png')
    grass_rims(outdoor).save(OUT / 'frlg-rims.png')
    white_stairs(outdoor).save(OUT / 'frlg-stairs.png')
    props = gba_palette(clear_color(rgba('tilesets-tileset.png'), (153, 51, 204, 255)))
    props.save(OUT / 'frlg-props.png')
    beach_rock(props).save(OUT / 'frlg-beachrock.png')
    seven = gba_palette(rgba('maps__towns_buildings_etc._-seven_island.png').crop((8, 24, 392, 344)))
    seven.save(OUT / 'frlg-seven.png')
    sea_rock(seven).save(OUT / 'frlg-searock.png')
    gba_palette(clear_outside(rgba('tilesets-buildings.png'), (255, 255, 255, 255))).save(OUT / 'frlg-buildings.png')
    gba_palette(ferry(rgba('maps-seagallop_ferry.png'))).save(OUT / 'frlg-ferry.png')
    rooms(rgba).save(OUT / 'frlg-rooms.png')
    emerald = Image.open(ROOT / 'assets-source' / 'emerald' / 'miscellaneous-exterior_tileset.png').convert('RGBA')
    gba_palette(tropical_trees(emerald)).save(OUT / 'emerald-trees.png')
    gba_palette(berry_plants()).save(OUT / 'rs-berries.png')
    gba_palette(rs_stairs()).save(OUT / 'rs-stairs.png')
    gba_palette(fields(outdoor)).save(OUT / 'frlg-fields.png')
    gba_palette(center_items(rgba('maps__towns_buildings_etc._-three_island.png'))).save(OUT / 'frlg-center-items.png')
    seagallop = rgba('maps-seagallop_ferry.png')
    gba_palette(seagallop.crop((288, 24, 544, 216))).save(OUT / 'frlg-travel-sea.png')
    gba_palette(ferry_wake(seagallop)).save(OUT / 'frlg-ferry-wake.png')
    gba_palette(town_map(rgba('miscellaneous-town_map.png'))).save(OUT / 'frlg-townmap.png')
    rs_objects = Image.open(ROOT / 'assets-source' / 'rs' / 'backgrounds-objects.png').convert('RGBA')
    gba_palette(clear_outside(rs_objects, (255, 255, 255, 255))).save(OUT / 'rs-objects.png')
    gba_palette(family_car()).save(OUT / 'frlg-car.png')
    gba_palette(cabane()).save(OUT / 'rs-cabane.png')
    gba_palette(shed()).save(OUT / 'frlg-shed.png')
    gba_palette(big_tree()).save(OUT / 'rs-bigtree.png')
    print('ok ->', OUT.relative_to(ROOT))


if __name__ == '__main__':
    main()
