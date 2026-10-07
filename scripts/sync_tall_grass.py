#!/usr/bin/env python3
"""Accorde les hautes herbes de la grille du jeu ('ĥ' de sourceGrid, src/data/maps/<fichier>.js) au dessin de la carte
du créateur : 'ĥ' là où des hautes herbes sont dessinées sur une case '.', '.' là où une case 'ĥ' n'a plus d'herbes
dessinées. Le jeu ne cache les jambes de Pierre (et n'agite l'herbe) que sur les cases 'ĥ' de sa grille.
Se fonde sur l'audit (scripts/audit_maps.py : herbes_hors_grille, herbe_sans_dessin).

Usage : python3 scripts/sync_tall_grass.py <id de carte du jeu> [<id>…]   (ex. saintAy bordeaux routeBonsecours)
"""
import json
import re
import subprocess
import sys
import tempfile
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent


def main():
    ids = sys.argv[1:]
    with tempfile.NamedTemporaryFile(suffix='.json') as tmp:
        subprocess.run(['python3', str(ROOT / 'scripts' / 'audit_maps.py'), '--json', tmp.name], cwd=ROOT,
                       check=True, stdout=subprocess.DEVNULL)
        report = json.loads(Path(tmp.name).read_text())
    for mid in ids:
        path = ROOT / 'src' / 'data' / 'maps' / f'{mid}.js'
        s = path.read_text()
        a = s.index('sourceGrid: parseGrid([')
        b = s.index(']),', a)
        lines = s[a:b].split('\n')
        rows = [(k, m) for k, line in enumerate(lines) if (m := re.match(r"(\s*)'([^']*)',(.*)$", line))]
        grid = [list(m.group(2)) for _, m in rows]
        added = removed = 0
        for x, y in report[mid]['herbes_hors_grille']:
            if grid[y][x] == '.':
                grid[y][x] = 'ĥ'
                added += 1
        for x, y in report[mid]['herbe_sans_dessin']:
            if grid[y][x] == 'ĥ':
                grid[y][x] = '.'
                removed += 1
        for (k, m), g in zip(rows, grid):
            lines[k] = f"{m.group(1)}'{''.join(g)}',{m.group(3)}"
        path.write_text(s[:a] + '\n'.join(lines) + s[b:])
        print(f'{mid} : +{added} hautes herbes, -{removed}')


if __name__ == '__main__':
    main()
