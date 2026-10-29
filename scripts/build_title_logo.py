"""Logo « PokéPierre » de l'écran titre, à partir de assets-source/logo-titre.png (2048 x 2048, fond blanc).

Le fond blanc (et le liseré blanc d'autocollant autour des lettres) est détouré par remplissage depuis les bords ; le
logo est recadré et réduit à SCALE fois sa taille à l'écran (WIDTH px de large sur l'écran de jeu de 360) : une image
lisse, que le jeu affiche réduite, avec lissage (pas en pixel art).
Vers public/assets/ui/title-logo.png (voir src/scenes/TitleScene.js).

Usage : python3 scripts/build_title_logo.py
"""
from collections import deque
from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / 'assets-source' / 'logo-titre.png'
OUT = ROOT / 'public' / 'assets' / 'ui' / 'title-logo.png'

WIDTH = 288        # largeur du logo à l'écran, en pixels de jeu
SCALE = 4          # résolution de l'image : SCALE pixels par pixel de jeu (le jeu est agrandi jusqu'à 4 fois)
WHITE = 228        # un pixel dont les trois canaux dépassent ce seuil fait partie du fond
GREY = 120         # pixel gris clair du liseré (trois canaux au-dessus, peu saturé)


def cut_background(im):
    """Rend transparents les pixels blancs reliés au bord de l'image."""
    w, h = im.size
    px = im.load()
    seen = bytearray(w * h)
    todo = deque((x, y) for x in range(w) for y in (0, h - 1))
    todo.extend((x, y) for y in range(h) for x in (0, w - 1))
    while todo:
        x, y = todo.popleft()
        if not (0 <= x < w and 0 <= y < h) or seen[y * w + x]:
            continue
        seen[y * w + x] = 1
        r, g, b, _ = px[x, y]
        if min(r, g, b) < WHITE:
            continue
        px[x, y] = (0, 0, 0, 0)
        todo.extend(((x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1)))
    return im


def main():
    im = cut_background(Image.open(SRC).convert('RGBA'))
    im = im.crop(im.getbbox())
    # Restes du liseré d'autocollant (gris clair, peu saturés) le long du bord : transparents aussi.
    px = im.load()
    for y in range(im.height):
        for x in range(im.width):
            r, g, b, a = px[x, y]
            if a and min(r, g, b) > GREY and max(r, g, b) - min(r, g, b) < 48:
                px[x, y] = (0, 0, 0, 0)
    width = WIDTH * SCALE
    height = round(im.height * width / im.width)
    out = im.resize((width, height), Image.LANCZOS)
    OUT.parent.mkdir(parents=True, exist_ok=True)
    out.save(OUT, optimize=True)
    print(f'ok -> {OUT.relative_to(ROOT)} ({width} x {height}, {SCALE} px par pixel de jeu)')


if __name__ == '__main__':
    main()
