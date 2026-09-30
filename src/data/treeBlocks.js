// Organisation des sapins ('T') et des palmiers ('Y'), partagée par le rendu et les collisions.
// Les sapins forment des blocs de 2x2 cases alignés sur les coordonnées paires : un bloc plein devient
// un grand sapin (2 cases de haut). Un grand sapin isolé (hors forêt) n'est solide que sur sa rangée du
// bas : on peut passer derrière, sur la rangée du haut, caché par le feuillage.
// `at(x, y)` renvoie le code de la case (undefined hors carte).

export const mod2 = (n) => ((n % 2) + 2) % 2;
const isTree = (at, x, y) => at(x, y) === 'T';

export function inFullTreeBlock(x, y, at) {
  const bx = x - mod2(x);
  const by = y - mod2(y);
  return isTree(at, bx, by) && isTree(at, bx + 1, by) && isTree(at, bx, by + 1) && isTree(at, bx + 1, by + 1);
}

// Un bloc de sapins fait partie d'une forêt s'il touche un autre sapin.
export function inForest(x, y, at) {
  const bx = x - mod2(x);
  const by = y - mod2(y);
  for (let i = 0; i < 2; i++) {
    if ([at(bx - 1, by + i), at(bx + 2, by + i), at(bx + i, by - 1), at(bx + i, by + 2)].includes('T')) return true;
  }
  return false;
}

// Rangée du haut d'un grand sapin isolé : praticable, le joueur y est caché derrière l'arbre.
export function isBehindTree(x, y, at) {
  return isTree(at, x, y) && mod2(y) === 0 && inFullTreeBlock(x, y, at) && !inForest(x, y, at);
}

// Cases où un personnage est caché par un feuillage (derrière un grand sapin isolé, ou juste au-dessus
// d'un palmier). Renvoie un Set de clés "x,y".
export function canopyTiles(grid) {
  const at = (x, y) => grid[y]?.[x];
  const hidden = new Set();
  grid.forEach((row, y) => row.forEach((c, x) => {
    if (isBehindTree(x, y, at)) hidden.add(`${x},${y}`);
    if (c === 'Y') hidden.add(`${x},${y - 1}`);
  }));
  return hidden;
}
