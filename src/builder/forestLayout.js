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
  // Un bloc peut dépasser du bord de la carte (dehors : de la forêt) : une bordure d'épaisseur impaire garde des arbres
  // entiers, coupés par le bord, au lieu de buissons.
  const forestOrOut = (x, y) => !inMap(x, y) || isForest(x, y);
  const cellsOf = (bx, by) => [[bx, by], [bx + 1, by], [bx, by + 1], [bx + 1, by + 1]];
  const full = (bx, by) => cellsOf(bx, by).some(([x, y]) => inMap(x, y)) && cellsOf(bx, by).every(([x, y]) => forestOrOut(x, y));
  // Choix des arbres (blocs de 2 x 2, qui peuvent se chevaucher un peu) :
  // 1. les arbres collés à chaque bord de la carte, chacun aligné sur son bord (haut, bas, gauche, droite) ;
  // 2. le reste de la forêt, sur la grille de 2 x 2 qui en garde le plus ;
  // 3. chaque case de forêt encore libre : l'arbre qui la couvre en chevauchant le moins (deux arbres plus serrés
  //    plutôt qu'un buisson). Une case qu'aucun arbre entier ne couvre devient un buisson.
  const blocks = [];
  const covered = new Map();                   // case -> nombre d'arbres qui la couvrent
  const chosen = new Set();
  const usable = (bx, by) => full(bx, by) && cellsOf(bx, by).some(([x, y]) => inMap(x, y) && inZone(x, y));
  const overlap = (bx, by) => cellsOf(bx, by).filter(([x, y]) => covered.has(y * W + x)).length;
  const take = (bx, by) => {
    chosen.add(`${bx},${by}`);
    blocks.push([bx, by, 0]);
    for (const [x, y] of cellsOf(bx, by)) if (inMap(x, y)) covered.set(y * W + x, (covered.get(y * W + x) ?? 0) + 1);
  };
  const edges = [
    [...Array(W - 1).keys()].map((x) => [x, 0]),
    [...Array(W - 1).keys()].map((x) => [x, H - 2]),
    [...Array(H - 1).keys()].map((y) => [0, y]),
    [...Array(H - 1).keys()].map((y) => [W - 2, y]),
  ];
  for (const edge of edges) for (const [bx, by] of edge) if (usable(bx, by) && !overlap(bx, by)) take(bx, by);
  let anchor = [0, 0];
  let most = -1;
  for (const ax of [0, 1]) {
    for (const ay of [0, 1]) {
      let n = 0;
      for (let by = ay - 2; by < H; by += 2) for (let bx = ax - 2; bx < W; bx += 2) if (usable(bx, by) && !overlap(bx, by)) n++;
      if (n > most) { most = n; anchor = [ax, ay]; }
    }
  }
  for (let by = anchor[1] - 2; by < H; by += 2) {
    for (let bx = anchor[0] - 2; bx < W; bx += 2) if (usable(bx, by) && !overlap(bx, by)) take(bx, by);
  }
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      if (!isForest(x, y) || !inZone(x, y) || covered.has(y * W + x)) continue;
      let best = null;
      for (const [bx, by] of [[x - 1, y - 1], [x, y - 1], [x - 1, y], [x, y]]) {
        if (!usable(bx, by) || chosen.has(`${bx},${by}`)) continue;
        const o = overlap(bx, by);
        if (!best || o < best[2]) best = [bx, by, o];
      }
      if (best) take(best[0], best[1]);
    }
  }
  blocks.sort((a, b) => a[1] - b[1] || a[0] - b[0]);
  const low = new Set();                       // blocs de la dernière rangée : le tissu reste derrière leurs cimes
  for (const [bx, by] of blocks) {
    if (by + 1 === H - 1) for (const [x, y] of cellsOf(bx, by)) if (inMap(x, y)) low.add(y * W + x);
  }
  // Blocs dessinés une case plus bas : la dernière rangée (troncs hors de la carte), les colonnes d'arbres qui la
  // rejoignent (un arbre juste au-dessus d'un arbre descendu, 2 ou 3 rangées plus haut), et, dans la moitié basse, les
  // blocs d'une rangée qui touchent un bloc descendu. Jamais si le tronc descendu tomberait sur une case libre.
  const shift = new Set();
  const trunkOk = (bx, by) => forestOrOut(bx, by + 2) && forestOrOut(bx + 1, by + 2);
  for (const [bx, by] of blocks) if (by + 1 === H - 1) shift.add(`${bx},${by}`);
  for (let changed = true; changed;) {
    changed = false;
    for (const [bx, by] of blocks) {
      const k = `${bx},${by}`;
      if (shift.has(k) || !trunkOk(bx, by)) continue;
      const below = [2, 3].some((d) => shift.has(`${bx},${by + d}`));
      const side = by >= Math.floor(H / 2) && (shift.has(`${bx - 2},${by}`) || shift.has(`${bx + 2},${by}`));
      if (below || side) { shift.add(k); changed = true; }
    }
  }
  for (const b of blocks) b[2] = shift.has(`${b[0]},${b[1]}`) ? 1 : 0;
  return {
    blocks,
    inBlock: (x, y) => covered.has(y * W + x),
    touchesOpen: (x, y) => !low.has(y * W + x) && [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => open(x + dx, y + dy)),
  };
}

// L'arbre rond (planche « lisieres », scripts/build_lisieres.py : l'arbre rond de DPPt, 4 x 4 cases, centré sur son bloc
// de 2 x 2) : les morceaux à poser pour un arbre dont le bloc commence en (bx, by), dans l'ordre de dessin.
// Disposition de HeartGold : un arbre tous les 2 cases en largeur et en hauteur ; on dessine de haut en bas (et de
// gauche à droite) : la couronne de l'arbre du dessous passe devant le tronc de celui du dessus.
// `dy` : 1 pour la dernière rangée de la carte (l'arbre descend d'une case : son tronc et son ombre sortent de la carte).
// Renvoie [{ x, y, index, trunk }] (trunk : la rangée du tronc et de l'ombre, dans le bloc).
export function roundTreePieces(lis, variant, bx, by, dy = 0) {
  const r = lis.round;
  const pieces = [];
  for (let j = 0; j < r.h; j++) {
    for (let i = 0; i < r.w; i++) {
      pieces.push({ x: bx - r.ox + i, y: by - r.oy + j + dy, index: (variant.roundRow + j) * lis.cols + r.col + i, trunk: j === r.h - 1 });
    }
  }
  return pieces;
}

// Ordre de dessin des arbres : de haut en bas, et dans une rangée de droite à gauche. Le dernier dessiné passe devant :
// l'arbre du dessous chevauche celui du dessus, l'arbre de gauche chevauche celui de droite.
export const treeOrder = (a, b) => a[1] - b[1] || b[0] - a[0];
