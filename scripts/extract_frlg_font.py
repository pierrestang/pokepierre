"""Extrait la police des dialogues de Rouge Feu / Vert Feuille (assets-source/frlg/miscellaneous-fonts.png,
fournie par l'utilisateur, usage personnel uniquement) en police bitmap BMFont pour Phaser :
public/assets/fonts/frlg.png + frlg.xml.

Bloc « Normal » de la planche : texte gris foncé ombré de gris clair sur fond blanc, 5 lignes de glyphes
proportionnels collés les uns aux autres. On découpe sur l'encre seule (sans l'ombre) : chaque glyphe
est une suite de colonnes contenant de l'encre ; quelques glyphes collés ou en morceaux sont corrigés
à la main (SPLIT, MERGE). Chaque glyphe garde sa colonne d'ombre à droite ; avance = largeur d'encre + 1.

Usage : python3 scripts/extract_frlg_font.py
"""
import unicodedata
from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / 'assets-source' / 'frlg' / 'miscellaneous-fonts.png'
OUT = ROOT / 'public' / 'assets' / 'fonts'

X0, X1 = 258, 632                  # bloc « Normal »
CAP_TOPS = [17, 32, 45, 60, 74]    # haut des capitales de chaque ligne
TOP, HEIGHT = 3, 15                # une cellule : 3 px au-dessus des capitales (accents), 15 px de haut
BASE = 10                          # ligne de base dans la cellule
INK = (96, 96, 96)
SHADOW = (208, 208, 200)
SPACE = 4

# Caractères de chaque ligne, dans l'ordre des glyphes découpés (None : glyphe ignoré).
LINES = [
    list('ÀÁÂÄÇÈÉÊËÌÍÎÏÒÓÔÖŒÙÚÛÜ') + ['Ñ', None] + list('àáâäçèéêëìíîïòóôö'),
    list('œùúûüñ') + [None] * 4 + list('&+') + [None] * 3 + list('=;:¿¡') + [None] * 10 + list('%()'),
    list('↑↓←→<>') + [None] + list('0123456789!?.-·'),
    ['…', '“', '”', '‘', '’'] + list('♂♀₽,×/ABCDEFGHIJKLMNOPQRSTUVWXYZ'),
    list('abcdefghijklmnopqrstuvwxyz▶'),
]
# Glyphes à fusionner : (ligne, indice du premier morceau, nombre de morceaux).
MERGE = [(0, 36, 3), (3, 0, 3), (3, 3, 2), (3, 5, 2)]


def ink_runs(px, y0):
    cols = [any(px[x, y] == INK for y in range(y0, y0 + HEIGHT)) for x in range(X0, X1)]
    runs, start = [], None
    for i, c in enumerate(cols + [False]):
        if c and start is None:
            start = i
        if not c and start is not None:
            runs.append([X0 + start, i - start])
            start = None
    # Deux glyphes de 5 px collés (QR, Ñß, ºª…) : 11 px d'encre -> deux glyphes.
    out = []
    for x, w in runs:
        out.extend([[x, 5], [x + 6, 5]] if w == 11 else [[x, w]])
    return out


def main():
    im = Image.open(SRC).convert('RGB')
    px = im.load()
    glyphs = []   # (caractère, x, y0, largeur d'encre)
    for li, cap in enumerate(CAP_TOPS):
        y0 = cap - TOP
        runs = ink_runs(px, y0)
        for line, first, count in sorted(MERGE, key=lambda m: -m[1]):
            if line == li:
                end = runs[first + count - 1]
                runs[first:first + count] = [[runs[first][0], end[0] + end[1] - runs[first][0]]]
        chars = LINES[li]
        assert len(runs) == len(chars), f'ligne {li} : {len(runs)} glyphes pour {len(chars)} caractères'
        glyphs += [(c, x, y0, w) for c, (x, w) in zip(chars, runs) if c]

    # Planche : glyphes côte à côte (encre + colonne d'ombre), fond transparent.
    sheet_w = sum(w + 1 for _, _, _, w in glyphs)
    sheet = Image.new('RGBA', (sheet_w, HEIGHT), (0, 0, 0, 0))
    chars_xml = [f'<char id="32" x="0" y="0" width="0" height="0" xoffset="0" yoffset="0" xadvance="{SPACE}" page="0"/>']
    sx = 0
    for c, x, y0, w in glyphs:
        cell = im.crop((x, y0, x + w + 1, y0 + HEIGHT)).convert('RGBA')
        cell.putdata([p if p[:3] in (INK, SHADOW) else (0, 0, 0, 0) for p in cell.getdata()])
        if not unicodedata.decomposition(c) and c not in '“”‘’…':
            # Sans accent : les 3 rangées du haut ne contiennent que des restes de la ligne du dessus.
            for yy in range(TOP):
                for xx in range(w + 1):
                    cell.putpixel((xx, yy), (0, 0, 0, 0))
        sheet.paste(cell, (sx, 0))
        chars_xml.append(
            f'<char id="{ord(c)}" x="{sx}" y="0" width="{w + 1}" height="{HEIGHT}" xoffset="0" yoffset="0" '
            f'xadvance="{w + 1}" page="0"/>'
        )
        sx += w + 1

    OUT.mkdir(parents=True, exist_ok=True)
    sheet.save(OUT / 'frlg.png')
    xml = (
        '<?xml version="1.0"?>\n<font>\n'
        f'  <info face="frlg" size="{HEIGHT}"/>\n'
        f'  <common lineHeight="16" base="{BASE}" scaleW="{sheet_w}" scaleH="{HEIGHT}" pages="1"/>\n'
        '  <pages><page id="0" file="frlg.png"/></pages>\n'
        f'  <chars count="{len(chars_xml)}">\n    ' + '\n    '.join(chars_xml) + '\n  </chars>\n</font>\n'
    )
    (OUT / 'frlg.xml').write_text(xml, encoding='utf-8')
    print(f'{len(glyphs)} glyphes -> {(OUT / "frlg.png").relative_to(ROOT)}')


if __name__ == '__main__':
    main()
