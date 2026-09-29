import { TILES } from '../tiles.js';

// Convertit un tableau de lignes ("TT..PP") en tableau 2D de codes : grid[y][x].
// Vérifie que toutes les lignes ont la même largeur et que les codes existent.
export function parseGrid(rows) {
  const width = rows[0].length;
  return rows.map((row, y) => {
    if (row.length !== width) {
      throw new Error(`Ligne ${y} : largeur ${row.length}, attendu ${width}`);
    }
    return [...row].map((code, x) => {
      if (!TILES[code]) throw new Error(`Code inconnu "${code}" en (${x}, ${y})`);
      return code;
    });
  });
}
