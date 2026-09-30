// Décor façon Rouge Feu / Vert Feuille, à partir des planches fournies par l'utilisateur (usage personnel
// uniquement), préparées par scripts/build_frlg_tiles.py dans public/assets/tiles/.
//
// Le rendu d'une carte se fait en trois couches (voir systems/tileRenderer.js) :
//   1. drawFrlgGround : le sol Rouge Feu (herbe, sable, plage, mer, chemin, ponton) ;
//   2. le dessin procédural (art/tileArt.js) pour tout ce qui n'a pas d'équivalent Rouge Feu
//      (palmiers, boîte aux lettres, décors des autres pays…), sans son propre sol là où la couche 1 en a posé ;
//   3. drawFrlgOverlay : objets Rouge Feu posés sur le sol (hautes herbes, fleurs, buissons, panneaux,
//      barrières, rochers) puis bâtiments Rouge Feu.
// Les grands arbres sont des objets hauts à part, triés en profondeur (voir frlgTallTexture).

import { inFullTreeBlock, inForest, mod2 } from '../data/treeBlocks.js';

const S = 16;

export const FRLG_SHEETS = {
  outdoor: 'frlg-outdoor',
  props: 'frlg-props',
  seven: 'frlg-seven',
  buildings: 'frlg-buildings',
  rims: 'frlg-rims',
  ferry: 'frlg-ferry',
  pier: 'frlg-pier',
  stairs: 'frlg-stairs',
};

export function preloadFrlg(scene) {
  const base = `${import.meta.env.BASE_URL}assets/tiles/`;
  for (const key of Object.values(FRLG_SHEETS)) scene.load.image(key, `${base}${key}.png`);
}

// ---------- Tuiles ----------

// Tuile de la planche d'extérieur (colonne, rangée) : pas de 17 px, première tuile en (1, 1).
const O = (c, r) => ({ sheet: FRLG_SHEETS.outdoor, sx: 1 + 17 * c, sy: 1 + 17 * r });
// Case de la carte de Seven Island (colonne, rangée).
const SEVEN = (c, r) => ({ sheet: FRLG_SHEETS.seven, sx: c * S, sy: r * S });

// Jeux de bordures (13 tuiles) : remplissage, 4 bords, 4 coins extérieurs, 4 coins intérieurs.
// Le bord est dessiné sur la case du terrain, du côté où l'on touche « l'autre » terrain.
function borderSet(row, sheet = FRLG_SHEETS.outdoor) {
  const T = (c, r) => ({ sheet, sx: 1 + 17 * c, sy: 1 + 17 * r });
  return {
    fill: sheet === FRLG_SHEETS.outdoor ? T(0, row) : null,
    left: T(1, row), right: T(2, row), top: T(3, row), bottom: T(4, row),
    bl: T(1, row + 1), br: T(2, row + 1), tl: T(3, row + 1), tr: T(4, row + 1),
    innerBR: T(1, row + 2), innerBL: T(2, row + 2), innerTR: T(3, row + 2), innerTL: T(4, row + 2),
  };
}
const SAND_ON_GRASS = borderSet(0);     // chemin de sable bordé d'herbe
const SAND_ON_SEA = borderSet(27);      // plage bordée d'écume (partie transparente : la mer dessous)
const GRASS_RIMS = borderSet(0, FRLG_SHEETS.rims);   // liseré d'herbe seul, posé sur une plage à écume

const GRASS = [O(6, 2), O(6, 2), O(6, 0), O(6, 1), O(7, 1)];
const TALL_GRASS = O(7, 0);
const FLOWERS = O(7, 2);
const BUSH = O(7, 12);
const SIGN = O(23, 3);
const BEACH_ROCK = { sheet: FRLG_SHEETS.props, sx: 140, sy: 3 };   // rocher gris, fond transparent
// Barrière en rondins debout de la planche d'extérieur : deux rondins par case, rangées comme côtés.
const LOGS = O(7, 17);
// Petit plateau rocheux herbeux (bloc de cases 'ɱ', au moins 3 x 3) : bords de falaise, dessus en herbe,
// escalier au bas (sauf dans les coins).
const PLATEAU_CODES = ['ɱ', 'ɲ'];   // ɱ : falaise et statues (bloquant), ɲ : herbe du sommet et escalier
const PLATEAU = {
  tl: O(19, 15), top: [O(20, 15), O(21, 15)], tr: O(22, 15),
  left: O(19, 16), grass: O(20, 16), right: O(22, 16),
  bl: O(19, 17), br: O(22, 17),
  stairs: [0, 1].map((i) => ({ sheet: FRLG_SHEETS.stairs, sx: i * S, sy: 0 })),   // escalier blanc
};
const SEA_ROCK = { sheet: FRLG_SHEETS.seven, sx: 41, sy: 279 };
// Ponton (sans l'eau de ses côtés : le sol dessous reste visible).
const PIER_TILE = (i) => ({ sheet: FRLG_SHEETS.pier, sx: i * S, sy: 0 });
const PIER = { left: PIER_TILE(0), mid: PIER_TILE(1), right: PIER_TILE(2) };
const seaTile = (x, y) => SEVEN(mod2(x), 14 + mod2(y));   // motif de vagues sur 2 x 2 cases

// Grand arbre isolé (32 x 45 px) de la planche de Hoeloe : 2 cases de large, dépasse de 13 px au-dessus.
export const FRLG_TREE = { sheet: FRLG_SHEETS.props, sx: 95, sy: 33, w: 32, h: 45 };

// Bâtiments Rouge Feu : image entière, posée en bas de son emprise (footH cases de haut).
export const FRLG_BUILDINGS = {
  house: { sx: 208, sy: 22, w: 80, h: 72, footH: 4 },        // maison du Bourg Palette, porte en 2e colonne
  fishingHut: { sx: 507, sy: 25, w: 64, h: 63, footH: 4 },   // petite maison au toit orange
};

// ---------- Sol ----------

// Cases posées sur l'herbe (le sable voisin reçoit un liseré d'herbe) : herbe, fleurs, buissons, arbres,
// barrières, panneaux, plateau du mémorial…
const GRASS_CODES = new Set(['.', 'f', 'ƒ', 'ĥ', 'ƀ', 'S', 'M', 'ł', 'T', 'Ŧ', 'ɱ', 'ɲ', 'ν', 'h', 'i', 'x', 'F']);
const SAND_CODES = new Set(['s', 'ʂ', 'ɕ', 'ƥ', 'ʈ', 'ψ', 'χ']);
const SEA_CODES = new Set(['w', 'ø']);
// Objets posés au sol dont le sol est celui de la majorité de leurs voisins.
const ON_NEIGHBOURS = new Set(['Y', 'ŕ', 'B', 'ɱ', 'ɸ']);

// Sol Rouge Feu d'une case : 'grass' | 'sand' | 'sea' | 'path' | 'pier', ou null (sol procédural).
// `buildingFloor(x, y)` : vrai sous un bâtiment Rouge Feu.
export function frlgGroundOf(x, y, at, buildingFloor = () => false) {
  const code = at(x, y);
  if (code === undefined) return null;
  if (buildingFloor(x, y)) return 'grass';
  if (GRASS_CODES.has(code)) return 'grass';
  if (SAND_CODES.has(code)) return 'sand';
  if (SEA_CODES.has(code)) return 'sea';
  if (code === 'ç') return 'path';
  if (code === '=') return 'pier';
  if (!ON_NEIGHBOURS.has(code)) return null;
  if (code === 'B') return boatOnPond(x, y, at) ? null : 'sea';
  const counts = {};
  for (const [dx, dy] of [[0, -1], [0, 1], [-1, 0], [1, 0]]) {
    const n = at(x + dx, y + dy);
    const kind = GRASS_CODES.has(n) ? 'grass' : SAND_CODES.has(n) ? 'sand' : SEA_CODES.has(n) ? 'sea' : null;
    if (kind) counts[kind] = (counts[kind] ?? 0) + 1;
  }
  const best = Object.keys(counts).sort((a, b) => counts[b] - counts[a])[0];
  return best === 'sea' ? 'sand' : best ?? null;
}

// Bateau : sur la mer, sauf si l'une de ses cases touche un étang ('~').
function boatOnPond(x, y, at) {
  const seen = new Set();
  const stack = [[x, y]];
  while (stack.length) {
    const [cx, cy] = stack.pop();
    if (seen.has(`${cx},${cy}`) || at(cx, cy) !== 'B') continue;
    seen.add(`${cx},${cy}`);
    for (const [dx, dy] of [[0, -1], [0, 1], [-1, 0], [1, 0]]) {
      if (at(cx + dx, cy + dy) === '~') return true;
      stack.push([cx + dx, cy + dy]);
    }
  }
  return false;
}

// Tuile d'un jeu de bordures, `other(dx, dy)` : vrai si la case voisine est de l'autre terrain.
function borderTile(set, other) {
  const n = other(0, -1), s = other(0, 1), w = other(-1, 0), e = other(1, 0);
  if (n && w) return set.tl;
  if (n && e) return set.tr;
  if (s && w) return set.bl;
  if (s && e) return set.br;
  if (n) return set.top;
  if (s) return set.bottom;
  if (w) return set.left;
  if (e) return set.right;
  if (other(-1, -1)) return set.innerTL;
  if (other(1, -1)) return set.innerTR;
  if (other(-1, 1)) return set.innerBL;
  if (other(1, 1)) return set.innerBR;
  return set.fill;
}

function hash(x, y) {
  let h = (x * 374761393 + y * 668265263) >>> 0;
  h = ((h ^ (h >>> 13)) * 1274126177) >>> 0;
  return (h ^ (h >>> 16)) >>> 0;
}

function blit(ctx, textures, tile, px, py, w = S, h = S) {
  ctx.drawImage(textures.get(tile.sheet).getSourceImage(), tile.sx, tile.sy, w, h, px, py, w, h);
}

// Couche 1 : sol de la case (x, y). Renvoie vrai si un sol Rouge Feu a été posé.
export function drawFrlgGround(ctx, textures, x, y, at, buildingFloor) {
  const ground = frlgGroundOf(x, y, at, buildingFloor);
  if (!ground) return false;
  const px = x * S;
  const py = y * S;
  const groundAt = (dx, dy) => (at(x + dx, y + dy) === undefined ? ground : frlgGroundOf(x + dx, y + dy, at, buildingFloor));

  if (ground === 'grass') blit(ctx, textures, GRASS[hash(x, y) % GRASS.length], px, py);
  else if (ground === 'sea') blit(ctx, textures, seaTile(x, y), px, py);
  else if (ground === 'pier') {
    // Sous le ponton : du sable là où il est bordé de terre, la mer ailleurs (visible sur ses bords).
    const onLand = [groundAt(-1, 0), groundAt(1, 0)].some((g) => ['sand', 'path', 'grass'].includes(g));
    blit(ctx, textures, onLand ? SAND_ON_GRASS.fill : seaTile(x, y), px, py);
    const left = at(x - 1, y) !== '=';
    const right = at(x + 1, y) !== '=';
    blit(ctx, textures, left ? PIER.left : right ? PIER.right : PIER.mid, px, py);
  } else if (ground === 'sand') {
    // Écume dès que la mer touche un côté ou un coin (avec le liseré d'herbe par-dessus si l'herbe touche
    // aussi), sinon bordure d'herbe.
    const isSea = (dx, dy) => groundAt(dx, dy) === 'sea';           // le ponton n'est pas de l'eau
    const isGrass = (dx, dy) => groundAt(dx, dy) === 'grass';
    const orth = (test) => [[0, -1], [0, 1], [-1, 0], [1, 0]].some(([dx, dy]) => test(dx, dy));
    const diag = (test) => [[-1, -1], [1, -1], [-1, 1], [1, 1]].some(([dx, dy]) => test(dx, dy));
    if (orth(isSea) || diag(isSea)) {
      blit(ctx, textures, seaTile(x, y), px, py);
      blit(ctx, textures, borderTile(SAND_ON_SEA, isSea), px, py);
      const rim = borderTile(GRASS_RIMS, isGrass);   // la plage touche aussi l'herbe : liseré par-dessus
      if (rim) blit(ctx, textures, rim, px, py);
    } else {
      blit(ctx, textures, borderTile(SAND_ON_GRASS, isGrass), px, py);
    }
  } else if (ground === 'path') {
    // Chemin de sable : continue sous les bâtiments, sur le ponton et dans le sable de la plage.
    const other = (dx, dy) => {
      const n = at(x + dx, y + dy);
      return n !== undefined && !['ç', 'R', 'W', 'D', '=', 's'].includes(n) && !buildingFloor(x + dx, y + dy);
    };
    blit(ctx, textures, borderTile(SAND_ON_GRASS, other), px, py);
  }
  return true;
}

// Codes entièrement dessinés par les couches Rouge Feu (le dessin procédural les ignore).
const FRLG_ONLY = new Set(['.', 's', 'w', 'ç', '=', 'ĥ', 'ƀ', 'f', 'S', 'ł', 'ø', 'ŕ', 'T', 'ɱ', 'ɲ', 'Ŧ']);

export function isFrlgOnly(code) {
  return FRLG_ONLY.has(code);
}

// Couche 3 : objet posé sur le sol de la case (x, y).
export function drawFrlgOverlay(ctx, textures, x, y, at) {
  const code = at(x, y);
  const px = x * S;
  const py = y * S;
  const put = (tile) => blit(ctx, textures, tile, px, py);
  switch (code) {
    case 'ĥ': return put(TALL_GRASS);
    case 'f': return put(FLOWERS);
    case 'ƀ': return put(BUSH);
    case 'S': return put(SIGN);
    case 'ŕ': return put(BEACH_ROCK);
    case 'ø': return put(SEA_ROCK);
    case 'ł': return put(LOGS);
    case 'ɱ':
    case 'ɲ': {
      // Position de la case dans son bloc : bords, coins, dessus en herbe, escalier au bas.
      const inBlock = (cx, cy) => PLATEAU_CODES.includes(at(cx, cy));
      let bx = x;
      let by = y;
      while (inBlock(bx - 1, y)) bx--;
      while (inBlock(x, by - 1)) by--;
      const first = x === bx;
      const last = !inBlock(x + 1, y);
      const alt = (x - bx) % 2;
      if (y === by) return put(first ? PLATEAU.tl : last ? PLATEAU.tr : PLATEAU.top[alt]);
      if (!inBlock(x, y + 1)) return put(first ? PLATEAU.bl : last ? PLATEAU.br : PLATEAU.stairs[alt]);
      return put(first ? PLATEAU.left : last ? PLATEAU.right : PLATEAU.grass);
    }
    case 'Ŧ': {
      // Grand arbre feuillu de la planche d'extérieur (3 x 4 cases) : case de même position dans le bloc.
      let bx = x;
      let by = y;
      while (at(bx - 1, y) === 'Ŧ' && x - bx < 2) bx--;
      while (at(x, by - 1) === 'Ŧ' && y - by < 3) by--;
      return put(O(14 + x - bx, 12 + y - by));
    }
    default:
  }
}

// Bâtiment Rouge Feu : image à part (texture `frlg-building-<type>`), triée en profondeur comme les
// personnages pour qu'ils passent derrière le toit. Renvoie l'image, ou null si ce type est dessiné par le code.
export function addFrlgBuilding(scene, b) {
  const def = FRLG_BUILDINGS[b.type];
  if (!def) return null;
  const key = `frlg-building-${b.type}`;
  if (!scene.textures.exists(key)) {
    const tex = scene.textures.createCanvas(key, def.w, def.h);
    blit(tex.getContext(), scene.textures, { sheet: FRLG_SHEETS.buildings, sx: def.sx, sy: def.sy }, 0, 0, def.w, def.h);
    tex.refresh();
  }
  const bottom = (b.y + def.footH) * S;
  return scene.add.image(b.x * S, bottom - def.h, key).setOrigin(0).setDepth(10 + (bottom - 1) / 10000);
}

// Cases couvertes par les bâtiments Rouge Feu d'une carte : fonction (x, y) -> booléen.
export function frlgBuildingFloor(buildings = []) {
  const cells = new Set();
  for (const b of buildings) {
    const def = FRLG_BUILDINGS[b.type];
    if (!def) continue;
    for (let dy = 0; dy < def.footH; dy++) {
      for (let dx = 0; dx < def.w / S; dx++) cells.add(`${b.x + dx},${b.y + dy}`);
    }
  }
  return (x, y) => cells.has(`${x},${y}`);
}

// Grand arbre Rouge Feu : ancré sur la case en bas à droite d'un bloc de 2 x 2 sapins.
// Renvoie { x, y, w, h, baseY } (en pixels, coin haut-gauche de l'image) ou null.
export function frlgTree(code, x, y, at) {
  if (code !== 'T' || !inFullTreeBlock(x, y, at) || mod2(x) !== 1 || mod2(y) !== 1) return null;
  const px = (x - 1) * S;
  const py = (y - 1) * S;
  return { x: px, y: py + 2 * S - FRLG_TREE.h, w: FRLG_TREE.w, h: FRLG_TREE.h, baseY: py + 2 * S - 1, forest: inForest(x, y, at) };
}

export function drawFrlgTree(ctx, textures, px, py) {
  blit(ctx, textures, FRLG_TREE, px, py, FRLG_TREE.w, FRLG_TREE.h);
}
