// Décor façon Rouge Feu / Vert Feuille, à partir des planches fournies par l'utilisateur (usage personnel
// uniquement), préparées par scripts/build_frlg_tiles.py dans public/assets/tiles/.
//
// Le rendu d'une carte se fait en trois couches (voir systems/tileRenderer.js) :
//   1. drawFrlgGround : le sol Rouge Feu (herbe, sable, plage, chemin, ponton ; la mer est une couche
//      animée sous la carte, voir addSeaLayer) ;
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
  stairs: 'frlg-stairs',
  searock: 'frlg-searock',
  rooms: 'frlg-rooms',
  centerItems: 'frlg-center-items',
  rsObjects: 'rs-objects',
  beachrock: 'frlg-beachrock',
  tropical: 'emerald-trees',
  berries: 'rs-berries',
  rsStairs: 'rs-stairs',
  fields: 'frlg-fields',
  travelSea: 'frlg-travel-sea',
  ferryWake: 'frlg-ferry-wake',
  townMap: 'frlg-townmap',
  car: 'frlg-car',
  cabane: 'rs-cabane',
  bigTree: 'rs-bigtree',
  farm: 'rs-farm',
  crates: 'rs-crates',
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
const CONCRETE_ON_GRASS = borderSet(12);  // dalles grises bordées d'herbe (place d'armes du Prytanée)
const COBBLE_ON_GRASS = borderSet(15);    // pavés gris bordés d'herbe (rues de Montépilloy)
const SAND_ON_SEA = borderSet(27);      // plage bordée d'écume (partie transparente : la mer dessous)
const GRASS_RIMS = borderSet(0, FRLG_SHEETS.rims);   // liseré d'herbe seul, posé sur une plage à écume

const GRASS = [O(6, 2), O(6, 2), O(6, 0), O(6, 1), O(7, 1)];
const TALL_GRASS = O(7, 0);
const FLOWERS = O(7, 2);
const BUSH = O(7, 12);
const SMALL_TREE = O(8, 0);    // petit arbre (celui qu'on coupe dans les jeux Pokémon)
const SIGN = O(23, 3);
// Champs de la campagne (frlg-fields.png) : blé doré, terre labourée à pousses.
const WHEAT = { sheet: FRLG_SHEETS.fields, sx: 0, sy: 0 };
const SOIL = { sheet: FRLG_SHEETS.fields, sx: 16, sy: 0 };
// Étang bordé de terre (planche d'extérieur, bloc 3 x 3) : rectangulaire, sans coins intérieurs.
const POND = {
  tl: O(10, 0), top: O(11, 0), tr: O(12, 0),
  left: O(10, 1), fill: O(11, 1), right: O(12, 1),
  bl: O(10, 2), bottom: O(11, 2), br: O(12, 2),
};
POND.innerTL = POND.innerTR = POND.innerBL = POND.innerBR = POND.fill;
// Barrière blanche du Bourg Palette (poteaux et lisses) : coins, côtés verticaux, lisses horizontales.
const FENCE = {
  tl: O(6, 11), h: O(7, 11), tr: O(8, 11),
  left: O(6, 12), right: O(8, 12),
  bl: O(6, 13), br: O(8, 13),
};
const BEACH_ROCK = { sheet: FRLG_SHEETS.beachrock, sx: 0, sy: 0 };   // rocher gris sans écume, fond transparent
// Barrière en rondins debout de la planche d'extérieur : deux rondins par case, rangées comme côtés.
const LOGS = O(7, 17);
// Petit plateau rocheux herbeux (bloc de cases 'ɱ', au moins 3 x 3) : bords de falaise, dessus en herbe,
// escalier au bas (sauf dans les coins).
// ɱ : falaise et statues (bloquant), ɲ : herbe du sommet et escalier ; ɟ / ɺ : même butte, sans statues
const PLATEAU_CODES = ['ɱ', 'ɲ', 'ɟ', 'ɺ'];
const PLATEAU = {
  tl: O(19, 15), top: [O(20, 15), O(21, 15)], tr: O(22, 15),
  left: O(19, 16), grass: O(20, 16), right: O(22, 16),
  bl: O(19, 17), br: O(22, 17),
  stairs: [0, 1].map((i) => ({ sheet: FRLG_SHEETS.stairs, sx: i * S, sy: 0 })),   // escalier blanc
};
const SEA_ROCK = { sheet: FRLG_SHEETS.searock, sx: 0, sy: 0 };   // sans l'eau autour : la mer animée passe dessous
// Ponton en bois de Rouge Feu (quai de la planche d'extérieur, colonnes 9 à 13) : planches sur les cases
// du ponton, rambardes sur poteaux dans les cases voisines ; au bout, une poutre ferme les planches, et
// l'ombre du ponton et ses pieux se voient dans l'eau juste après.
const PIER = {
  start: { left: O(10, 22), right: O(12, 22) },
  mid: { left: O(10, 22), right: O(12, 22) },
  end: { left: O(10, 23), right: O(12, 23) },
};
const PIER_RAIL = {
  left: { start: O(9, 21), mid: O(9, 22), end: O(9, 23) },
  right: { start: O(13, 21), mid: O(13, 22), end: O(13, 23) },
};
const pierPart = (y, at, x) => (at(x, y - 1) !== '=' ? 'start' : at(x, y + 1) !== '=' ? 'end' : 'mid');

// Grand arbre isolé (32 x 45 px) de la planche de Hoeloe : 2 cases de large, dépasse de 13 px au-dessus.
export const FRLG_TREE = { sheet: FRLG_SHEETS.props, sx: 95, sy: 33, w: 32, h: 45 };

// Bâtiments Rouge Feu : image entière, posée en bas de son emprise (footH cases de haut).
export const FRLG_BUILDINGS = {
  house: { sx: 208, sy: 22, w: 80, h: 72, footH: 4 },        // maison du Bourg Palette, porte en 2e colonne
  fishingHut: { sx: 507, sy: 25, w: 64, h: 63, footH: 4 },   // petite maison au toit orange
  // Saint-Ay : maisons de village (porte en 2e colonne, sauf mention).
  cottage: { sx: 24, sy: 22, w: 80, h: 64, footH: 4 },       // toit vert en chaume, jardinières fleuries
  greenHouse: { sx: 114, sy: 22, w: 80, h: 56, footH: 4 },   // petite maison au toit vert
  slateHouse: { sx: 300, sy: 24, w: 80, h: 55, footH: 4 },   // toit d'ardoise, porte rouge
  blueHouse: { sx: 395, sy: 24, w: 96, h: 56, footH: 4 },    // toit bleu, 6 cases, porte en 3e colonne
  clinic: { sx: 421, sy: 343, w: 80, h: 72, footH: 4 },      // toit orange (pension), porte au milieu
  // Montépilloy et Prytanée.
  school: { sx: 620, sy: 242, w: 80, h: 71, footH: 4 },      // auvent vert et jardinières (fan-club), porte en 2e colonne
  lab: { sx: 528, sy: 342, w: 112, h: 72, footH: 4 },       // labo du Prof. Chen : 7 cases, porte en 4e colonne
  mansion: { sx: 296, sy: 126, w: 112, h: 124, footH: 8 },   // grand immeuble vert : 7 x 8 cases, porte en 4e colonne
  museum: { sx: 136, sy: 338, w: 176, h: 120, footH: 8 },    // musée à colonnes : 11 x 8 cases, porche au milieu (porte en 6e colonne)
  // Ferme de M. Bouly : gare du téléphérique du Mont Chimnée (Rubis/Saphir, scripts/extract_rs_buildings.py),
  // 6 x 4 cases, grande porte en 4e colonne.
  boulyFarm: { sheet: FRLG_SHEETS.farm, sx: 0, sy: 0, w: 96, h: 80, footH: 4 },
};

// ---------- Sol ----------

// Cases posées sur l'herbe (le sable voisin reçoit un liseré d'herbe) : herbe, fleurs, buissons, arbres,
// barrières, panneaux, plateau du mémorial…
const GRASS_CODES = new Set(['.', 'f', 'ƒ', 'ĥ', 'ƀ', 'S', 'M', 'ł', 'T', 'Ŧ', 'ɱ', 'ɲ', 'ν', 'ƨ', 'ƚ', 'h', 'i', 'x', 'F', 'ʬ', 'ʭ', 'ʀ', 'ɓ', 'ɟ', 'ɺ']);
const SAND_CODES = new Set(['s', 'ʂ', 'ɕ', 'ƥ', 'ʈ', 'ψ']);
const SEA_CODES = new Set(['w', 'ø']);
// Objets posés au sol dont le sol est celui de la majorité de leurs voisins.
const ON_NEIGHBOURS = new Set(['Y', 'ŕ', 'B', 'ɱ', 'ɸ', 'ƫ', 'O', 'Q', 'V', 'J',
  // objets des villes (réverbère, cabine, drapeaux, lanternes, étals, scooter, vélos, vache, tuk-tuk, terrasse,
  // métro, panneaux de l'aéroport, cactus, chameau, serpent, feu de camp)
  'l', 'b', 'j', 'e', 'v', 'g', 'n', 't', 'y', 'c', 'p', 'a', 'd', '$', '!', '>', '<', '*', 'H', 'z', '&']);
// Eau des villes : rivière, et ce qui la couvre (ponts, lotus) — posée comme un étang Rouge Feu.
const RIVER_CODES = new Set(['G', 'I', 'r', 'k']);

// Sol Rouge Feu d'une case : 'grass' | 'sand' | 'sea' | 'path' | 'pier', ou null (sol procédural).
// `buildingFloor(x, y)` : vrai sous un bâtiment Rouge Feu.
export function frlgGroundOf(x, y, at, buildingFloor = () => false) {
  const code = at(x, y);
  if (code === undefined) return null;
  // Sous un bâtiment : de l'herbe, sauf sur le pas d'une porte qui donne sur un chemin (visible sous le porche).
  if (buildingFloor(x, y)) {
    const below = code === 'D' && frlgGroundOf(x, y + 1, at, buildingFloor);
    return ['path', 'cobble', 'concrete'].includes(below) ? below : 'grass';
  }
  if (GRASS_CODES.has(code)) return 'grass';
  if (SAND_CODES.has(code)) return 'sand';
  if (SEA_CODES.has(code)) return 'sea';
  if (code === 'ç') return 'path';
  if (code === 'ɔ') return 'cobble';
  if (code === 'ɐ') return 'concrete';
  if (code === '=') return 'pier';
  if (code === '~' || RIVER_CODES.has(code)) return 'pond';
  if (['R', 'W', 'D'].includes(code)) return groundUnderBuilding(x, y, at, buildingFloor);
  if (!ON_NEIGHBOURS.has(code)) return null;
  if (code === 'B') return boatOnPond(x, y, at) ? 'pond' : 'sea';
  const counts = {};
  for (const [dx, dy] of [[0, -1], [0, 1], [-1, 0], [1, 0]]) {
    const n = at(x + dx, y + dy);
    const kind = GRASS_CODES.has(n) ? 'grass' : SAND_CODES.has(n) ? 'sand' : SEA_CODES.has(n) ? 'sea'
      : n === 'ɔ' ? 'cobble' : n === 'ɐ' ? 'concrete' : null;
    if (kind) counts[kind] = (counts[kind] ?? 0) + 1;
  }
  const best = Object.keys(counts).sort((a, b) => counts[b] - counts[a])[0];
  return best === 'sea' ? 'sand' : best ?? null;
}

// Sol sous un bâtiment dessiné par le code (visible dans ses interstices) : dans chaque direction, le premier
// sol hors du bâtiment ; on garde le plus fréquent (herbe par défaut).
function groundUnderBuilding(x, y, at, buildingFloor) {
  const votes = {};
  for (const [dx, dy] of [[0, -1], [0, 1], [-1, 0], [1, 0]]) {
    for (let d = 1; d < 12; d++) {
      const n = at(x + dx * d, y + dy * d);
      if (n === undefined) break;
      if (['R', 'W', 'D'].includes(n)) continue;
      const kind = frlgGroundOf(x + dx * d, y + dy * d, at, buildingFloor);
      if (kind) votes[kind] = (votes[kind] ?? 0) + 1;
      break;
    }
  }
  const best = Object.keys(votes).sort((a, b) => votes[b] - votes[a])[0] ?? 'grass';
  return best === 'sea' ? 'sand' : best === 'pier' ? 'grass' : best;
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

// Comme borderTile, mais quart de case par quart de case (8 x 8 px) : chaque quart prend la bordure de ses
// deux côtés. Un chemin d'une seule case de large garde ainsi sa bordure des deux côtés, et ses bouts.
function blitBorderQuadrants(ctx, textures, set, other, px, py) {
  const H = S / 2;
  for (const [qx, qy] of [[0, 0], [1, 0], [0, 1], [1, 1]]) {
    const dx = qx ? 1 : -1;
    const dy = qy ? 1 : -1;
    const v = other(0, dy);
    const h = other(dx, 0);
    let tile;
    if (v && h) tile = set[`${qy ? 'b' : 't'}${qx ? 'r' : 'l'}`];
    else if (v) tile = qy ? set.bottom : set.top;
    else if (h) tile = qx ? set.right : set.left;
    else if (other(dx, dy)) tile = set[`inner${qy ? 'B' : 'T'}${qx ? 'R' : 'L'}`];
    else tile = set.fill;
    ctx.drawImage(textures.get(tile.sheet).getSourceImage(), tile.sx + qx * H, tile.sy + qy * H, H, H, px + qx * H, py + qy * H, H, H);
  }
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

  // La mer n'est pas dessinée ici : c'est une couche animée sous la carte (voir addSeaLayer).
  if (ground === 'grass') blit(ctx, textures, GRASS[hash(x, y) % GRASS.length], px, py);
  else if (ground === 'pier') {
    const where = pierPart(y, at, x);
    blit(ctx, textures, at(x - 1, y) === '=' ? PIER[where].right : PIER[where].left, px, py);
    if (where === 'end') {                                          // poutre du bout
      ctx.fillStyle = '#a07040';
      ctx.fillRect(px, py + S - 4, S, 1);
      ctx.fillStyle = '#604020';
      ctx.fillRect(px, py + S - 3, S, 3);
    }
  } else if (ground === 'sand') {
    // Écume dès que la mer touche un côté ou un coin (avec le liseré d'herbe par-dessus si l'herbe touche
    // aussi), sinon bordure d'herbe.
    const isSea = (dx, dy) => groundAt(dx, dy) === 'sea';           // le ponton n'est pas de l'eau
    const isGrass = (dx, dy) => groundAt(dx, dy) === 'grass';
    const orth = (test) => [[0, -1], [0, 1], [-1, 0], [1, 0]].some(([dx, dy]) => test(dx, dy));
    const diag = (test) => [[-1, -1], [1, -1], [-1, 1], [1, 1]].some(([dx, dy]) => test(dx, dy));
    if (orth(isSea) || diag(isSea)) {
      blit(ctx, textures, borderTile(SAND_ON_SEA, isSea), px, py);   // partie transparente : la mer animée
      const rim = borderTile(GRASS_RIMS, isGrass);   // la plage touche aussi l'herbe : liseré par-dessus
      if (rim) blit(ctx, textures, rim, px, py);
    } else {
      blit(ctx, textures, borderTile(SAND_ON_GRASS, isGrass), px, py);
    }
  } else if (ground === 'cobble' || ground === 'concrete') {
    // Pavés et dalles : continuent sous les bâtiments et les objets posés dessus.
    const code = ground === 'cobble' ? 'ɔ' : 'ɐ';
    const other = (dx, dy) => {
      const n = at(x + dx, y + dy);
      if (n === undefined || n === code || ['R', 'W', 'D'].includes(n) || buildingFloor(x + dx, y + dy)) return false;
      const g = groundAt(dx, dy);
      return g !== 'cobble' && g !== 'concrete';        // pas de liseré entre pavés et dalles
    };
    blit(ctx, textures, borderTile(ground === 'cobble' ? COBBLE_ON_GRASS : CONCRETE_ON_GRASS, other), px, py);
  } else if (ground === 'pond') {
    // Rive de terre sur chaque bord qui touche la terre ferme (le ponton est sur l'eau : pas de rive).
    blit(ctx, textures, borderTile(POND, (dx, dy) => !['pond', 'pier'].includes(groundAt(dx, dy))), px, py);
  } else if (ground === 'path') {
    // Chemin de sable : continue sous les bâtiments, sur le ponton et dans le sable de la plage.
    const other = (dx, dy) => {
      const n = at(x + dx, y + dy);
      return n !== undefined && !['ç', 'R', 'W', 'D', '=', 's'].includes(n) && !buildingFloor(x + dx, y + dy);
    };
    blitBorderQuadrants(ctx, textures, SAND_ON_GRASS, other, px, py);
  }
  return true;
}

// Codes entièrement dessinés par les couches Rouge Feu (le dessin procédural les ignore).
const FRLG_ONLY = new Set(['.', 's', 'w', 'ç', '=', 'ĥ', 'ƀ', 'f', 'S', 'ł', 'ø', 'ŕ', 'T', 'ɱ', 'ɲ', 'Ŧ', 'M', 'ƫ', 'ƨ', 'ƚ', '~', 'F', 'ʬ', 'ʭ', 'ɔ', 'ɐ', 'ɟ', 'ɺ', 'G']);

export function isFrlgOnly(code) {
  return FRLG_ONLY.has(code);
}

// Couche 3 : objet posé sur le sol de la case (x, y).
export function drawFrlgOverlay(ctx, textures, x, y, at) {
  const code = at(x, y);
  const px = x * S;
  const py = y * S;
  const put = (tile) => blit(ctx, textures, tile, px, py);
  // Au bout du ponton, dans l'eau : son ombre et ses deux pieux.
  if (code !== '=' && at(x, y - 1) === '=') {
    ctx.fillStyle = 'rgba(16, 24, 72, 0.35)';
    ctx.fillRect(px, py, S, 4);
    ctx.fillStyle = '#503018';
    const post = at(x - 1, y - 1) === '=' ? S - 4 : 1;
    ctx.fillRect(px + post, py, 3, 6);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.fillRect(px + post - 1, py + 6, 5, 1);                     // clapotis au pied du pieu
  }
  // Rambardes du ponton, posées dans les cases de part et d'autre.
  if (code !== '=') {
    if (at(x + 1, y) === '=' && at(x + 2, y) === '=') put(PIER_RAIL.left[pierPart(y, at, x + 1)]);
    if (at(x - 1, y) === '=' && at(x - 2, y) === '=') put(PIER_RAIL.right[pierPart(y, at, x - 1)]);
  }
  switch (code) {
    case 'ĥ': return put(TALL_GRASS);
    case 'ʬ': return put(WHEAT);
    case 'ʭ': return put(SOIL);
    case 'F': {
      const f = (dx, dy) => at(x + dx, y + dy) === 'F';
      const up = f(0, -1), down = f(0, 1), left = f(-1, 0), right = f(1, 0);
      // Côté vertical : aligné sur les coins. C'est le côté est d'un enclos si l'angle au bout de la barrière
      // (en remontant, sinon en descendant) part vers la gauche.
      const eastAt = (dy) => {
        let cy = y;
        while (at(x, cy + dy) === 'F') cy += dy;
        if (cy === y) return null;
        return at(x - 1, cy) === 'F' && at(x + 1, cy) !== 'F';
      };
      const side = (eastAt(-1) ?? eastAt(1)) ? FENCE.right : FENCE.left;
      if (down && !up) return put(right ? FENCE.tl : left ? FENCE.tr : side);
      if (up && !down) return put(right ? FENCE.bl : left ? FENCE.br : side);
      if (up && down) return put(side);
      return put(FENCE.h);
    }
    case 'f': return put(FLOWERS);
    case 'ƀ': return put(BUSH);
    case 'ƚ': return put(SMALL_TREE);
    case 'S': return put(SIGN);
    case 'ŕ': return put(BEACH_ROCK);
    case 'M': return drawPixels(ctx, MAILBOX, MAILBOX_COLORS, px + 2, py + S - MAILBOX.length);
    case 'ø': return put(SEA_ROCK);
    case 'ł': return put(LOGS);
    case 'ɱ':
    case 'ɲ':
    case 'ɟ':
    case 'ɺ': {
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

// Boîte aux lettres (12 x 14 px, calée en bas de sa case) aux couleurs de Rouge Feu : caisson blanc à
// fente, petit drapeau rouge, poteau, ombre au pied.
const MAILBOX = [
  '..########..',
  '.#wwwwwwww#r',
  '#wwwwwwwwwo#r',
  '#ww######wo#r',
  '#wwwwwwwwwo#',
  '#wwwwwwwwwo#',
  '#oooooooooo#',
  '.##########.',
  '.....#p.....',
  '.....#p.....',
  '.....#p.....',
  '....####....',
  '...ssssss...',
];
const MAILBOX_COLORS = { '#': '#485060', w: '#f8f8f8', o: '#b8c0d0', r: '#e04040', p: '#a07848', s: 'rgba(0,0,0,0.2)' };

function drawPixels(ctx, rows, colors, px, py) {
  rows.forEach((row, y) => [...row].forEach((c, x) => {
    if (!colors[c]) return;
    ctx.fillStyle = colors[c];
    ctx.fillRect(px + x, py + y, 1, 1);
  }));
}

// Bâtiment Rouge Feu : image à part (texture `frlg-building-<type>`), triée en profondeur comme les
// personnages pour qu'ils passent derrière le toit. Renvoie l'image, ou null si ce type est dessiné par le code.
export function addFrlgBuilding(scene, b) {
  const def = FRLG_BUILDINGS[b.type];
  if (!def) return null;
  const key = `frlg-building-${b.type}`;
  if (!scene.textures.exists(key)) {
    const tex = scene.textures.createCanvas(key, def.w, def.h);
    blit(tex.getContext(), scene.textures, { sheet: def.sheet ?? FRLG_SHEETS.buildings, sx: def.sx, sy: def.sy }, 0, 0, def.w, def.h);
    tex.refresh();
  }
  const bottom = (b.y + def.footH) * S;
  return scene.add.image(b.x * S, bottom - def.h, key).setOrigin(0).setDepth(10 + (bottom - 1) / 10000);
}

// Cases couvertes par les bâtiments Rouge Feu d'une carte : fonction (x, y) -> booléen.
// Seules les cases de bâtiment (R, W, D) de l'emprise comptent : une case d'herbe dans l'emprise garde son sol
// et ses bordures.
export function frlgBuildingFloor(buildings = [], at = () => 'R') {
  const cells = new Set();
  for (const b of buildings) {
    const def = FRLG_BUILDINGS[b.type];
    if (!def) continue;
    for (let dy = 0; dy < def.footH; dy++) {
      for (let dx = 0; dx < def.w / S; dx++) {
        if (!['R', 'W', 'D'].includes(at(b.x + dx, b.y + dy))) continue;
        cells.add(`${b.x + dx},${b.y + dy}`);
      }
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

// Arbre tropical à racines d'Émeraude (bloc de 2 x 2 cases 'ƫ', 32 x 32 px) : ancré sur la case en haut à
// gauche du bloc ; variante « sable » ou « herbe » selon le sol autour. Renvoie { key, x, y, baseY } ou null.
export function frlgTropicalTree(scene, code, x, y, at) {
  if (code !== 'ƫ' || at(x - 1, y) === 'ƫ' || at(x, y - 1) === 'ƫ') return null;
  const sand = frlgGroundOf(x, y, at) === 'sand';
  const key = `emerald-tree-${sand ? 'sand' : 'grass'}`;
  if (!scene.textures.exists(key)) {
    const tex = scene.textures.createCanvas(key, 2 * S, 2 * S);
    blit(tex.getContext(), scene.textures, { sheet: FRLG_SHEETS.tropical, sx: sand ? 0 : 2 * S, sy: 0 }, 0, 0, 2 * S, 2 * S);
    tex.refresh();
  }
  return { key, x: x * S, y: y * S, baseY: (y + 2) * S - 1 };
}

// Plante à baies fleurie de Rubis/Saphir (case 'ƨ', 16 x 32 px, dépasse vers le haut) : baies bleues ou
// fleurs rouges (variantes 2 et 3 de rs-berries.png) selon la case. Renvoie { key, x, y, baseY } ou null.
const BERRY_VARIANTS = [2, 3];
export function frlgBerryPlant(scene, code, x, y) {
  if (code !== 'ƨ') return null;
  const variant = BERRY_VARIANTS[hash(x, y) % BERRY_VARIANTS.length];
  const key = `rs-berry-${variant}`;
  if (!scene.textures.exists(key)) {
    const tex = scene.textures.createCanvas(key, S, 2 * S);
    blit(tex.getContext(), scene.textures, { sheet: FRLG_SHEETS.berries, sx: variant * S, sy: 0 }, 0, 0, S, 2 * S);
    tex.refresh();
  }
  return { key, x: x * S, y: (y - 1) * S, baseY: (y + 1) * S - 1 };
}

export function drawFrlgTree(ctx, textures, px, py) {
  blit(ctx, textures, FRLG_TREE, px, py, FRLG_TREE.w, FRLG_TREE.h);
}

// ---------- Voiture de la famille ----------

// Voiture bleue vue de côté (frlg-car.png : vers la gauche, puis vers la droite), 42 x 30 px.
export const FAMILY_CAR = { sheet: FRLG_SHEETS.car, w: 42, h: 30 };
export function familyCarImage(scene, x, y, facing = 'right') {
  const tex = scene.textures.get(FAMILY_CAR.sheet);
  if (!tex.has('right')) {
    tex.add('left', 0, 0, 0, FAMILY_CAR.w, FAMILY_CAR.h);
    tex.add('right', 0, FAMILY_CAR.w, 0, FAMILY_CAR.w, FAMILY_CAR.h);
  }
  return scene.add.image(x, y, FAMILY_CAR.sheet, facing);
}

// Bande de campagne du trajet en voiture (répétable horizontalement, ROAD_STRIP_W px de large) : rangée de
// grands arbres, fleurs, barrière blanche, route de terre bordée d'herbe, buissons et champ de blé.
export const ROAD_STRIP_W = 256;
export const ROAD_TOP = 80;       // haut de la route dans la bande (3 cases : bord, milieu, bord)
export function roadStripTexture(scene, height) {
  const key = 'travel-road';
  if (scene.textures.exists(key)) return key;
  const tex = scene.textures.createCanvas(key, ROAD_STRIP_W, height);
  const ctx = tex.getContext();
  const textures = scene.textures;
  const cols = ROAD_STRIP_W / S;
  for (let y = 0; y < height; y += S) {
    for (let c = 0; c < cols; c++) blit(ctx, textures, GRASS[(c * 7 + y) % GRASS.length], c * S, y);
  }
  for (let x = 0; x < ROAD_STRIP_W; x += 32) drawFrlgTree(ctx, textures, x, 2);
  for (let c = 0; c < cols; c++) {
    if (c % 4 === 1 || c % 4 === 2) blit(ctx, textures, FLOWERS, c * S, 48);
    blit(ctx, textures, FENCE.h, c * S, 64);
    blit(ctx, textures, SAND_ON_GRASS.top, c * S, ROAD_TOP);
    blit(ctx, textures, SAND_ON_GRASS.fill, c * S, ROAD_TOP + S);
    blit(ctx, textures, SAND_ON_GRASS.bottom, c * S, ROAD_TOP + 2 * S);
    if (c % 5 === 3) blit(ctx, textures, BUSH, c * S, 128);
    if (c % 5 === 0) blit(ctx, textures, SMALL_TREE, c * S, 128);
    for (let y = 144; y < height; y += S) blit(ctx, textures, WHEAT, c * S, y);
  }
  tex.refresh();
  return key;
}

// ---------- Cabane des cousins ----------

// rs-cabane.png : la cabane perchée de Fortree City (64 x 91 px, l'échelle occupe les colonnes 32 à 47), puis
// son intérieur (128 x 128 px, 8 x 8 cases) : la pièce de Fortree sans tronc, meublée d'objets de Rubis/Saphir
// (voir scripts/build_frlg_tiles.py, CABANE_FURNITURE).
const CABANE_FRAMES = {
  hut: [0, 0, 64, 91],
  room: [64, 0, 128, 128],
  // Les deux longues tables, redessinées par-dessus les cousins assis derrière (voir interiors.cabane).
  tableLeft: [64 + 2, 42, 48, 16],
  tableRight: [64 + 78, 42, 48, 16],
};
export const CABANE_LADDER_X = 32;
export function cabaneFrame(scene, name) {
  const tex = scene.textures.get(FRLG_SHEETS.cabane);
  if (!tex.has(name)) tex.add(name, 0, ...CABANE_FRAMES[name]);
  return name;
}

// ---------- Mer animée ----------

// La mer de Seven Island (motif de vagues de 32 x 32) est une couche sous la carte, qui glisse
// doucement pixel par pixel ; la carte la laisse voir partout où il y a de l'eau (mer, écume de la
// plage, sous le ponton, autour des rochers et du ferry).
export function addSeaLayer(scene, width, height, margin = 40 * S) {
  const key = 'frlg-sea';
  if (!scene.textures.exists(key)) {
    const tex = scene.textures.createCanvas(key, 2 * S, 2 * S);
    for (let y = 0; y < 2; y++) for (let x = 0; x < 2; x++) blit(tex.getContext(), scene.textures, SEVEN(x, 14 + y), x * S, y * S);
    tex.refresh();
  }
  const layer = scene.add.tileSprite(-margin, -margin, width + 2 * margin, height + 2 * margin, key)
    .setOrigin(0).setDepth(-2);
  let t = 0;
  scene.time.addEvent({
    delay: 200,
    loop: true,
    callback: () => {
      t++;
      layer.tilePositionX = t % (2 * S);
      layer.tilePositionY = Math.floor(t / 2) % (2 * S);
    },
  });
  return layer;
}

// ---------- Hautes herbes ----------

// Bas de la tuile de hautes herbes (10 rangées du bas), posé devant le personnage qui s'y tient : comme
// dans Rouge Feu, ses jambes disparaissent dans les feuilles. Renvoie la clé de la texture.
export const GRASS_COVER_TOP = 6;
export function tallGrassCoverTexture(scene, code = 'ĥ') {
  const tile = code === 'ʬ' ? WHEAT : TALL_GRASS;
  const key = code === 'ʬ' ? 'frlg-wheat-cover' : 'frlg-grass-cover';
  if (!scene.textures.exists(key)) {
    const tex = scene.textures.createCanvas(key, S, S - GRASS_COVER_TOP);
    const src = scene.textures.get(tile.sheet).getSourceImage();
    tex.getContext().drawImage(src, tile.sx, tile.sy + GRASS_COVER_TOP, S, S - GRASS_COVER_TOP, 0, 0, S, S - GRASS_COVER_TOP);
    tex.refresh();
  }
  return key;
}

// ---------- Intérieurs Rouge Feu ----------

// Intérieur « Rouge Feu » (`frlg: true` dans ses données, voir data/maps/interiors.js) : deux rangées de mur
// en haut de la pièce, parquet partout ailleurs, noir autour ; les meubles (`decor`) sont des blocs repris
// tels quels des pièces de frlg-rooms.png, le tapis de sortie est centré sur les cases 'E'.
// Les cases de meubles sont des 'm' (bloquantes) dans la grille ; ce qui n'a pas d'équivalent Rouge Feu
// (escaliers, râtelier de cannes à pêche…) reste dessiné dans le code, sur le parquet.
const ROOM = (room, c, r) => ({ sheet: FRLG_SHEETS.rooms, sx: room * 11 * S + c * S, sy: r * S });
const WALL_TOP = ROOM(1, 8, 0);
const WALL = ROOM(1, 8, 1);
const FLOOR_UNDER_WALL = ROOM(1, 8, 2);
const FLOOR = ROOM(1, 8, 4);
const EXIT_MAT = { sheet: FRLG_SHEETS.rooms, sx: 59, sy: 116, w: 26, h: 16 };

// Meubles : { tile, w, h } (largeur et hauteur en cases). La plupart sont des blocs des pièces de
// frlg-rooms.png (fond de mur et de parquet compris) ; l'ordinateur et la télé murale viennent du Centre
// Pokémon (frlg-center-items.png, fond transparent) ; lit, télé, bureaux et escaliers de Rubis/Saphir.
const block = (room, c, r, w, h) => ({ tile: ROOM(room, c, r), w, h });
// Meuble de Rubis/Saphir (rs-objects.png) : image de w x h px, centrée et posée en bas de son emprise
// (fw x fh cases).
const RS = (sx, sy, w, h, fw, fh) => ({ sprite: { sheet: FRLG_SHEETS.rsObjects, sx, sy }, pw: w, ph: h, w: fw, h: fh });
const CENTER_ITEM = (sx, w, h) => ({ tile: { sheet: FRLG_SHEETS.centerItems, sx, sy: 0 }, w, h });
export const FRLG_DECOR = {
  plant: block(0, 0, 3, 1, 2),          // plante en pot
  blueShelf: block(0, 1, 1, 1, 2),      // étagère bleue
  glassCabinet: block(0, 2, 1, 2, 2),   // vitrine et vase
  painting: block(0, 4, 0, 1, 2),       // tableau au mur
  kitchen: block(0, 8, 1, 2, 2),        // évier et cuisinière
  fridge: block(0, 10, 1, 1, 2),        // frigo
  table: block(0, 4, 4, 4, 2),          // table et quatre chaises
  bookshelf: block(1, 0, 0, 2, 3),      // bibliothèque
  cabinet: block(1, 3, 1, 1, 2),        // placard jaune
  window: block(2, 4, 0, 2, 2),         // fenêtre à rideaux
  notice: block(2, 9, 0, 1, 2),         // panneau d'affichage
  desk: block(3, 2, 1, 1, 2),           // bureau avec un globe
  computer: CENTER_ITEM(0, 1, 2),       // ordinateur
  tv: CENTER_ITEM(16, 2, 2),            // télé murale
  crtTv: RS(558, 84, 16, 27, 1, 1),     // télé sur son meuble (Rubis/Saphir)
  console: RS(486, 50, 13, 16, 1, 1),   // console et manette
  bed: RS(488, 79, 24, 32, 2, 2),       // lit
  computerDesk: RS(448, 74, 32, 39, 2, 2),   // bureau avec ordinateur et tabouret
  pottedPlant: RS(630, 50, 16, 15, 1, 1),   // petite plante en pot
  chalkboard: RS(369, 51, 64, 18, 4, 1),   // tableau vert (au mur)
  schoolDesk: RS(498, 128, 32, 22, 2, 1),  // pupitre avec des livres
  paperDesk: RS(539, 129, 32, 20, 2, 1),   // pupitre avec des copies
  longTable: RS(506, 50, 48, 16, 3, 1),    // longue table en bois (bureau du maître)
  shelf: RS(519, 80, 32, 31, 2, 2),        // étagère à livres
  carton: { sprite: { sheet: 'frlg-carton', sx: 0, sy: 0 }, pw: 15, ph: 14, w: 1, h: 1 },        // carton de déménagement
  smallCarton: { sprite: { sheet: 'frlg-carton', sx: 15, sy: 0 }, pw: 11, ph: 9, w: 1, h: 1 },   // petit carton (sur un meuble)
  // Caisses en bois du marché de Slateport (rs-crates.png, scripts/extract_rs_buildings.py).
  crate: { sprite: { sheet: FRLG_SHEETS.crates, sx: 0, sy: 0 }, pw: 15, ph: 16, w: 1, h: 1 },
  fishCrate: { sprite: { sheet: FRLG_SHEETS.crates, sx: 15, sy: 0 }, pw: 15, ph: 16, w: 1, h: 1 },
  giveCrate: { sprite: { sheet: FRLG_SHEETS.crates, sx: 30, sy: 0 }, pw: 15, ph: 16, w: 1, h: 1 },   // « À DONNER »
  greenCrate: { sprite: { sheet: FRLG_SHEETS.crates, sx: 45, sy: 0 }, pw: 15, ph: 16, w: 1, h: 1 },  // légumes verts
  orangeCrate: { sprite: { sheet: FRLG_SHEETS.crates, sx: 60, sy: 0 }, pw: 15, ph: 16, w: 1, h: 1 }, // oranges
  tomatoCrate: { sprite: { sheet: FRLG_SHEETS.crates, sx: 75, sy: 0 }, pw: 15, ph: 16, w: 1, h: 1 }, // tomates
  jar: { sprite: { sheet: FRLG_SHEETS.crates, sx: 90, sy: 0 }, pw: 15, ph: 16, w: 1, h: 1 },         // jarre
};

// Cartons de déménagement, dessinés au pixel près dans les couleurs du carton de Rouge Feu :
// grand carton (15 x 14) et petit carton scotché (11 x 9), côte à côte dans la texture 'frlg-carton'.
function ensureCartonTexture(textures) {
  if (textures.exists('frlg-carton')) return;
  const tex = textures.createCanvas('frlg-carton', 26, 14);
  const ctx = tex.getContext();
  const R = (c, x, y, w, h) => { ctx.fillStyle = c; ctx.fillRect(x, y, w, h); };
  const box = (ox, oy, w, h, lid) => {
    const K = '#584028';
    R(K, ox, oy, w, h);                                   // contour
    R('#e0b070', ox + 1, oy + 1, w - 2, lid);              // dessus
    R('#c89050', ox + 1, oy + 1 + lid, w - 2, h - lid - 2); // face
    R('#a87038', ox + 1, oy + h - 3, w - 2, 1);            // ombre en bas de la face
    R(K, ox + 1, oy + 1 + lid, w - 2, 1);                  // arête
    R('#f0f0e0', ox + (w >> 1) - 1, oy + 1, 2, lid + 3);   // scotch
    R('#f8e0a8', ox + 1, oy + 1, w - 2, 1);                // reflet
  };
  box(0, 0, 15, 14, 5);
  R('#584028', 3, 9, 5, 1);                               // inscription au feutre
  R('#584028', 3, 11, 3, 1);
  box(15, 0, 11, 9, 3);
  tex.refresh();
}

// Couche 1 d'un intérieur : mur (deux rangées du haut), noir (murs du bas et des côtés), parquet.
export function drawFrlgInteriorGround(ctx, textures, x, y, at) {
  const px = x * S;
  const py = y * S;
  if (at(x, y) === 'X') {
    if (y <= 1) return blit(ctx, textures, y === 0 ? WALL_TOP : WALL, px, py);
    ctx.fillStyle = '#000000';
    return ctx.fillRect(px, py, S, S);
  }
  return blit(ctx, textures, ['X', '¤'].includes(at(x, y - 1)) && y === 2 ? FLOOR_UNDER_WALL : FLOOR, px, py);
}

// Codes d'intérieur entièrement dessinés par les couches Rouge Feu.
export const FRLG_INTERIOR_ONLY = new Set(['X', 'o', 'm', 'E', 'η', 'ξ']);

// Escaliers de Rubis/Saphir (maison de Bourg-en-Vol), encastrés dans le mur au-dessus de leur case :
// η monte, ξ descend. Cadre de 23 x 23 px, pieds des montants sur le parquet.
const STAIRS_IN_WALL = {
  η: { sheet: FRLG_SHEETS.rsStairs, sx: 0, sy: 0, w: 23, h: 23 },
  ξ: { sheet: FRLG_SHEETS.rsStairs, sx: 23, sy: 0, w: 23, h: 23 },
};

// Coin haut-gauche (en pixels) d'un meuble de Rubis/Saphir : posé en bas de son emprise ; contre le mur du
// fond (rangée juste sous le mur), il remonte au besoin pour que son haut morde d'au moins 4 px sur la plinthe.
// `dx`, `dy` : décalage en pixels (ex. petit carton posé sur un bureau).
export function decorSpritePosition(interior, { kind, x, y, dx = 0, dy = 0 }) {
  const d = FRLG_DECOR[kind];
  const px = x * S + Math.round((d.w * S - d.pw) / 2);
  const bottomAligned = (y + d.h) * S - d.ph;
  const againstWall = interior.grid[y - 1]?.[x] === 'X';
  return { px: px + dx, py: (againstWall ? Math.min(y * S - 4, bottomAligned) : bottomAligned) + dy };
}

// Lit de l'intérieur sous la case (x, y) : coin haut-gauche de son image, en pixels (voir CharacterSprite, `bed`).
export function bedAt(interior, x, y) {
  const bed = (interior.decor ?? []).find((o) => o.kind === 'bed' && x >= o.x && x < o.x + 2 && y >= o.y && y < o.y + 2);
  return bed && decorSpritePosition(interior, bed);
}

// Bas du lit (drap replié et couverture), redessiné par-dessus un personnage couché : image de rs-objects.png.
export const BED_LOWER = { sheet: FRLG_SHEETS.rsObjects, sx: 488, sy: 79 + 13, w: 24, h: 16 };

// Couche 3 d'un intérieur : meubles, puis tapis de sortie sur chaque groupe de cases 'E' d'une rangée.
export function drawFrlgInteriorDecor(ctx, textures, interior) {
  ensureCartonTexture(textures);
  const roomW = interior.grid[0].length * S;
  interior.grid.forEach((row, y) => row.forEach((code, x) => {
    const st = STAIRS_IN_WALL[code];
    if (!st) return;
    // Centré sur la case, sans dépasser les bords de la pièce ; bas du cadre 2 px sous le haut de la case.
    const px = Math.max(0, Math.min(roomW - st.w, x * S + Math.round((S - st.w) / 2)));
    blit(ctx, textures, st, px, y * S + 2 - st.h, st.w, st.h);
  }));
  for (const item of interior.decor ?? []) {
    const d = FRLG_DECOR[item.kind];
    if (d.sprite) {
      const { px, py } = decorSpritePosition(interior, item);
      blit(ctx, textures, d.sprite, px, py, d.pw, d.ph);
    } else blit(ctx, textures, d.tile, item.x * S, item.y * S, d.w * S, d.h * S);
  }
  interior.grid.forEach((row, y) => row.forEach((code, x) => {
    if (code !== 'E' || row[x - 1] === 'E') return;
    let n = 1;
    while (row[x + n] === 'E') n++;
    const cx = x * S + (n * S) / 2;
    blit(ctx, textures, EXIT_MAT, Math.round(cx - EXIT_MAT.w / 2), y * S, EXIT_MAT.w, EXIT_MAT.h);
  }));
}
