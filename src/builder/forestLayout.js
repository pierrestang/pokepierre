// Disposition d'une forêt en rangées d'arbres (règle commune au bouton « Refaire la bordure d'arbres » de l'assistant,
// au pinceau Forêt du mode simple et à scripts/identites.py forest_trees) :
// - chaque bloc de 2 x 2 de la forêt (grille calée pour en garder le plus) porte un arbre entier, posé de haut en bas
//   (la cime de l'arbre du dessous passe devant le tronc de celui du dessus) ;
// - le tissu sombre reste seulement derrière, sur les cases qui ne touchent pas une case libre (les bords haut, gauche
//   et droit de la carte comptent comme de la forêt ; le bas comme une case libre : la dernière rangée montre ses
//   troncs sur l'herbe, pas une bande sombre) ;
// - une case de forêt hors des blocs qui touche une case libre devient un buisson.
//
// `isForest(x, y)` : la case est de la forêt ; `inZone(x, y)` : la case peut changer. Renvoie
// { blocks: [[bx, by]…] (de haut en bas), inBlock(x, y), touchesOpen(x, y) }.
export function layoutForest(W, H, isForest, inZone = () => true) {
  const inMap = (x, y) => x >= 0 && y >= 0 && x < W && y < H;
  const open = (x, y) => (inMap(x, y) && !isForest(x, y)) || (y >= H && x >= 0 && x < W);
  const full = (bx, by) => isForest(bx, by) && isForest(bx + 1, by) && isForest(bx, by + 1) && isForest(bx + 1, by + 1);
  let anchor = [0, 0];
  let most = -1;
  for (const ax of [0, 1]) {
    for (const ay of [0, 1]) {
      let n = 0;
      for (let by = ay; by < H - 1; by += 2) for (let bx = ax; bx < W - 1; bx += 2) if (full(bx, by) && inZone(bx, by)) n++;
      if (n > most) { most = n; anchor = [ax, ay]; }
    }
  }
  const blocks = [];
  const covered = new Set();
  for (let by = anchor[1]; by < H - 1; by += 2) {
    for (let bx = anchor[0]; bx < W - 1; bx += 2) {
      if (!full(bx, by)) continue;
      for (const [x, y] of [[bx, by], [bx + 1, by], [bx, by + 1], [bx + 1, by + 1]]) covered.add(y * W + x);
      if ([[bx, by], [bx + 1, by], [bx, by + 1], [bx + 1, by + 1]].every(([x, y]) => inZone(x, y))) blocks.push([bx, by]);
    }
  }
  return {
    blocks,
    inBlock: (x, y) => covered.has(y * W + x),
    touchesOpen: (x, y) => [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => open(x + dx, y + dy)),
  };
}
