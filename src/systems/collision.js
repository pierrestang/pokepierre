import { getTile } from '../data/tiles.js';
import { isBehindTree } from '../data/treeBlocks.js';

// Renvoie une fonction (x, y) -> true si la case est praticable.
// Hors de la carte = bloqué. Exception : la rangée du haut d'un grand sapin isolé (on passe derrière).
export function createWalkableCheck(grid) {
  const at = (x, y) => grid[y]?.[x];
  return (x, y) => {
    const row = grid[y];
    if (!row || row[x] === undefined) return false;
    return !getTile(row[x]).solid || isBehindTree(x, y, at);
  };
}
