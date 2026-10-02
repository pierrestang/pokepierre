"""Icônes d'objets et bulles d'émotion de HeartGold/SoulSilver (planches fournies par l'utilisateur, usage
personnel uniquement) vers public/assets/ui/.

  item-icons.png + item-icons.json : atlas Phaser des icônes choisies (ICONS ci-dessous), une case de 32 x 32
    par icône, fond transparent. Source : assets-source/ds/hgss-items.png, icônes sur fond blanc ; chacune est
    repérée par sa boîte sur la planche, puis détourée (le blanc relié au bord devient transparent, le
    blanc à l'intérieur de l'icône reste). Les trois cannes existent aussi en petit (`<nom>-petite`, 14 x 14).
  emotes.png : les 24 bulles d'émotion (3 rangées de 8, 16 x 16 px chacune), fond orange rendu transparent.
    Source : assets-source/ds/hgss-emotions.png. Les bulles vont par deux (deux images d'une animation).
  postcards.png + postcards.json : cartes postales de la carte du voyage, une image de 256 x 160 par ville
    (POSTCARDS), prises dans les illustrations de lieux de Johto (assets-source/ds/hgss-location-art.png).

Usage : python3 scripts/build_ds_ui.py
"""
import json
from pathlib import Path
from PIL import Image
from pixels import clear_color, clear_outside

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / 'assets-source' / 'ds'
OUT = ROOT / 'public' / 'assets' / 'ui'
WHITE = (255, 255, 255)
CELL = 32

# Icône -> sa boîte sur la planche (x, y, largeur, hauteur).
ICONS = {
    'vieille-canne': (7, 378, 21, 22),      # Canne, Super Canne, Méga Canne (objets rares)
    'super-canne': (31, 373, 21, 21),
    'mega-canne': (56, 373, 22, 21),
    'coquillage': (13, 219, 20, 20),        # Grelot Coque
    'planches': (222, 100, 22, 22),         # Plaque couleur bois
    'corde': (209, 221, 22, 21),
    'diplome': (170, 413, 20, 16),
    'livre': (82, 374, 22, 20),
    'carnet': (611, 387, 22, 22),
    'carte': (12, 409, 20, 16),
    'cles': (197, 409, 22, 21),
    'sac': (39, 408, 22, 19),
    'billet': (144, 412, 21, 17),
    'potion': (66, 23, 15, 21),
    'piece-metal': (567, 184, 17, 18),      # Bloc de métal
    'amulette': (503, 384, 20, 22),
    'orbe-rouge': (372, 386, 14, 14),
    'orbe-bleue': (388, 386, 14, 14),
    'orbe-verte': (404, 386, 14, 14),
    'orbe-turquoise': (365, 305, 18, 19),
}


# Illustrations de Johto : deux colonnes de 8 lieux, chacun en 3 moments (matin, après-midi, nuit).
# Ville -> (colonne 0 ou 1, rangée, moment).
#   colonne 0 : grotte Sombre, tour Chétiflor, ruines d'Alpha, caves Jumelles, puits Ramoloss, bois aux Chênes,
#               parc National, tour Cendrée ; colonne 1 : tour Ferraille, îles Tourb., mont Creuset, route de
#               Glace, antre du Dragon, grotte Sombre (est), chutes Tohjo, route Victoire.
POSTCARDS = {
    'fortDeFrance': (1, 1, 0),      # îles Tourbillon, le matin : la mer autour de l'île
    'saintAy': (0, 5, 0),           # bois aux Chênes, le matin : la forêt de sapins
    'bordeaux': (0, 6, 1),          # parc National, l'après-midi
    'hanoi': (1, 4, 0),             # antre du Dragon : le pavillon sur l'eau, comme la tour de la Tortue
    'paris': (0, 6, 2),             # parc National, la nuit : les réverbères
    'corse': (1, 1, 1),             # îles Tourbillon, l'après-midi : côte rocheuse
    'sriLanka': (1, 6, 0),          # chutes Tohjo : cascade dans la jungle
    'thailand': (1, 0, 1),          # tour Ferraille : temple de bois
    'nepal': (1, 3, 0),             # route de Glace : la montagne
}
POSTCARD_X = ([69, 328, 587], [907, 1166, 1425])
POSTCARD_W, POSTCARD_H = 256, 160


def build_postcards():
    im = Image.open(SRC / 'hgss-location-art.png').convert('RGB')
    atlas = Image.new('RGB', (POSTCARD_W, POSTCARD_H * len(POSTCARDS)))
    frames = {}
    for i, (city, (col, row, moment)) in enumerate(POSTCARDS.items()):
        x = POSTCARD_X[col][moment]
        y = 30 + 195 * row + 16                                       # sous la bande noire du haut
        atlas.paste(im.crop((x, y, x + POSTCARD_W, y + POSTCARD_H)), (0, i * POSTCARD_H))
        frames[city] = {'frame': {'x': 0, 'y': i * POSTCARD_H, 'w': POSTCARD_W, 'h': POSTCARD_H}}
    atlas.save(OUT / 'postcards.png')
    (OUT / 'postcards.json').write_text(json.dumps({'frames': frames, 'meta': {'image': 'postcards.png'}}, indent=1))
    print(f'{len(frames)} cartes postales -> public/assets/ui/postcards.png')


SMALL_RODS = ['vieille-canne', 'super-canne', 'mega-canne']
SMALL_ROD = 14


def cut_out(crop):
    """Blanc relié au bord de la case -> transparent."""
    return clear_outside(crop.convert('RGBA'), WHITE)


def build_icons():
    im = Image.open(SRC / 'hgss-items.png').convert('RGB')
    atlas = Image.new('RGBA', (CELL * (len(ICONS) + len(SMALL_RODS)), CELL), (0, 0, 0, 0))
    frames = {}
    for i, (name, (x, y, w, h)) in enumerate(ICONS.items()):
        icon = cut_out(im.crop((x - 1, y - 1, x + w + 1, y + h + 1)))
        w, h = icon.size
        atlas.paste(icon, (i * CELL + (CELL - w) // 2, (CELL - h) // 2), icon)
        frames[name] = {'frame': {'x': i * CELL, 'y': 0, 'w': CELL, 'h': CELL}}
    # Petites cannes (14 x 14, au centre de leur case) : les cannes posées dans la cabane de pêche.
    for k, name in enumerate(SMALL_RODS):
        i = len(ICONS) + k
        x, y, w, h = ICONS[name]
        icon = cut_out(im.crop((x - 1, y - 1, x + w + 1, y + h + 1)))
        icon = icon.crop(icon.getbbox()).resize((SMALL_ROD, SMALL_ROD), Image.NEAREST)
        atlas.paste(icon, (i * CELL + (CELL - SMALL_ROD) // 2, (CELL - SMALL_ROD) // 2), icon)
        frames[f'{name}-petite'] = {'frame': {'x': i * CELL, 'y': 0, 'w': CELL, 'h': CELL}}
    atlas.save(OUT / 'item-icons.png')
    (OUT / 'item-icons.json').write_text(json.dumps({'frames': frames, 'meta': {'image': 'item-icons.png'}}, indent=1))
    print(f'{len(frames)} icônes -> public/assets/ui/item-icons.png')


def build_emotes():
    im = Image.open(SRC / 'hgss-emotions.png').convert('RGBA')
    xs = [4, 20, 38, 54, 72, 88, 106, 122]
    ys = [4, 21, 38]
    out = Image.new('RGBA', (16 * 8, 16 * 3), (0, 0, 0, 0))
    for r, y in enumerate(ys):
        for c, x in enumerate(xs):
            cell = im.crop((x, y, x + 15, y + 16))
            out.paste(clear_color(cell, (255, 128, 0)), (c * 16, r * 16))
    out.save(OUT / 'emotes.png')
    print('24 bulles -> public/assets/ui/emotes.png')


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    build_icons()
    build_emotes()
    build_postcards()


if __name__ == '__main__':
    main()
