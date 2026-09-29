import { getTile } from '../data/tiles.js';

// Renvoie une fonction (x, y) -> true si la case est praticable.
// Hors de la carte = bloqué.
export function createWalkableCheck(grid) {
  return (x, y) => {
    const row = grid[y];
    if (!row || row[x] === undefined) return false;
    return !getTile(row[x]).solid;
  };
}
