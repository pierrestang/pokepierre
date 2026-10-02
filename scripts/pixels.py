"""Petits outils d'image partagés par les scripts qui préparent les planches (Pillow).

`match` désigne les pixels visés : une couleur (RGB, comparée sans l'alpha, ou RGBA, comparée en entier), un
ensemble de couleurs du même genre, ou une fonction pixel -> bool.
"""
from collections import deque
from PIL import Image

CLEAR = (0, 0, 0, 0)


def matcher(match):
    if callable(match):
        return match
    colors = match if isinstance(match, (set, frozenset)) else {match}
    if all(len(c) == 3 for c in colors):
        return lambda p: p[:3] in colors
    return lambda p: p in colors


def clear_color(im, match):
    """Rend transparents tous les pixels visés (fond uni)."""
    m = matcher(match)
    im.putdata([CLEAR if m(p) else p for p in im.getdata()])
    return im


def clear_outside(im, match):
    """Rend transparents les pixels visés reliés au bord de l'image (le fond autour d'un objet), sans toucher aux
    mêmes couleurs à l'intérieur de l'objet (vitres, reflets…). L'image doit être en RGBA."""
    m = matcher(match)
    px = im.load()
    w, h = im.size
    queue = deque([(x, y) for x in range(w) for y in (0, h - 1)] + [(x, y) for y in range(h) for x in (0, w - 1)])
    seen = set()
    while queue:
        x, y = queue.popleft()
        if (x, y) in seen or not (0 <= x < w and 0 <= y < h) or not m(px[x, y]):
            continue
        seen.add((x, y))
        px[x, y] = CLEAR
        queue.extend(((x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1)))
    return im


def pack_characters(rows, w, h):
    """Planche de personnages au format de frlg-npcs.png : une ligne de 12 images de w x h par personnage (bas,
    haut, gauche, droite x debout, pas, pas), chaque personnage descendu pour que ses pieds touchent le bas."""
    out = Image.new('RGBA', (w * 12, h * len(rows)), CLEAR)
    for k, frames in enumerate(rows):
        bottom = max(f.getbbox()[3] for f in frames if f.getbbox())
        for i, f in enumerate(frames):
            out.paste(f, (i * w, k * h + h - bottom), f)
    return out
