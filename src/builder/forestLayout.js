// Disposition d'une forêt en rangées d'arbres (règle commune au bouton « Refaire la bordure d'arbres » de l'assistant,
// au pinceau Forêt du mode simple et à scripts/identites.py forest_trees) :
// - chaque bloc de 2 x 2 de la forêt (grille calée pour en garder le plus) porte un arbre entier, posé de haut en bas
//   (la cime de l'arbre du dessous passe devant le tronc de celui du dessus) ;
// - le tissu sombre reste seulement derrière, sur les cases qui ne touchent pas une case libre (les bords de la carte
//   comptent comme de la forêt) ;
// - les arbres de la dernière rangée de la carte sont dessinés une case plus bas : leurs cimes vont jusqu'au bord et
//   leurs troncs sortent de la carte (sinon le tronc, en haut de sa case, laisse une bande d'herbe sous la bordure) ;
//   les colonnes d'arbres qui descendent jusqu'à elle descendent aussi (angles du bas sans trou), et, dans la moitié
//   basse, les blocs d'une rangée qui touchent un bloc descendu, si leur tronc tombe sur de la forêt ; le décalage avec
//   la bordure du haut se fait dans les angles du haut (scripts/identites.py shifted_blocks : même règle) ;
// - une case de forêt hors des blocs qui touche une case libre devient un buisson.
//
// `isForest(x, y)` : la case est de la forêt ; `inZone(x, y)` : la case peut changer. Renvoie
// { blocks: [[bx, by, dy]…] (de haut en bas ; dy : décalage du dessin, 1 sur la dernière rangée), inBlock(x, y),
// touchesOpen(x, y) }.
export function layoutForest(W, H, isForest, inZone = () => true) {
  const inMap = (x, y) => x >= 0 && y >= 0 && x < W && y < H;
  const open = (x, y) => inMap(x, y) && !isForest(x, y);
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
  const low = new Set();                       // blocs de la dernière rangée : le tissu reste derrière leurs cimes
  for (let by = anchor[1]; by < H - 1; by += 2) {
    for (let bx = anchor[0]; bx < W - 1; bx += 2) {
      if (!full(bx, by)) continue;
      for (const [x, y] of [[bx, by], [bx + 1, by], [bx, by + 1], [bx + 1, by + 1]]) {
        covered.add(y * W + x);
        if (by + 1 === H - 1) low.add(y * W + x);
      }
      if ([[bx, by], [bx + 1, by], [bx, by + 1], [bx + 1, by + 1]].every(([x, y]) => inZone(x, y))) blocks.push([bx, by, 0]);
    }
  }
  // Blocs dessinés une case plus bas.
  const have = new Set(blocks.map(([bx, by]) => `${bx},${by}`));
  const shift = new Set();
  for (const [bx, by] of blocks) {
    let y = by;
    while (have.has(`${bx},${y}`) && y + 1 < H - 1) y += 2;
    if (have.has(`${bx},${y}`) && y + 1 === H - 1) shift.add(`${bx},${by}`);
  }
  for (let changed = true; changed;) {
    changed = false;
    for (const [bx, by] of blocks) {
      const k = `${bx},${by}`;
      if (shift.has(k) || by < Math.floor(H / 2)) continue;
      const belowOk = isForest(bx, by + 2) && isForest(bx + 1, by + 2);
      if (belowOk && (shift.has(`${bx - 2},${by}`) || shift.has(`${bx + 2},${by}`))) { shift.add(k); changed = true; }
    }
  }
  for (const b of blocks) b[2] = shift.has(`${b[0]},${b[1]}`) ? 1 : 0;
  return {
    blocks,
    inBlock: (x, y) => covered.has(y * W + x),
    touchesOpen: (x, y) => !low.has(y * W + x) && [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => open(x + dx, y + dy)),
  };
}
