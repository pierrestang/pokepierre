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
  rs-stairs.png        escaliers encastrés dans le mur de la maison de Bourg-en-Vol, qui monte puis qui descend
                       (voir rs_stairs) ;
  frlg-props.png     planche de Hoeloe (arbre isolé, rocher, mer animée…), fond violet rendu transparent ;
  frlg-seven.png     carte de Seven Island (24 x 20 cases), sans le cadre ;
  frlg-buildings.png bâtiments entiers, fond blanc extérieur rendu transparent.
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
    gba_palette(center_items(rgba('maps__towns_buildings_etc._-three_island.png'))).save(OUT / 'frlg-center-items.png')
    seagallop = rgba('maps-seagallop_ferry.png')
    gba_palette(seagallop.crop((288, 24, 544, 216))).save(OUT / 'frlg-travel-sea.png')
    gba_palette(ferry_wake(seagallop)).save(OUT / 'frlg-ferry-wake.png')
    gba_palette(town_map(rgba('miscellaneous-town_map.png'))).save(OUT / 'frlg-townmap.png')
    rs_objects = Image.open(ROOT / 'assets-source' / 'rs' / 'backgrounds-objects.png').convert('RGBA')
    gba_palette(clear_outside(rs_objects, (255, 255, 255, 255))).save(OUT / 'rs-objects.png')
    print('ok ->', OUT.relative_to(ROOT))


if __name__ == '__main__':
    main()
