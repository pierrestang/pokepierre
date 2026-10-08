// Décor façon Rouge Feu / Vert Feuille, à partir des planches fournies par l'utilisateur (usage personnel
// uniquement), préparées par scripts/build_frlg_tiles.py dans public/assets/tiles/.
//
// Le rendu d'une carte se fait en trois couches (voir systems/tileRenderer.js) :
//   1. drawFrlgGround : le sol Rouge Feu (herbe, sable, plage, chemin, ponton ; la mer est une couche
//      animée sous la carte, voir addSeaLayer) ;
//   2. le dessin procédural (art/tileArt.js) pour tout ce qui n'a pas d'équivalent Rouge Feu
//      (boîte aux lettres, décors des autres pays…), sans son propre sol là où la couche 1 en a posé ;
//   3. drawFrlgOverlay : objets Rouge Feu posés sur le sol (hautes herbes, fleurs, buissons, panneaux,
//      barrières, rochers) puis bâtiments Rouge Feu.
// Les arbres et plantes hautes sont des images à part, triées en profondeur (voir frlgTallImage).

import { inFullTreeBlock, mod2 } from '../data/treeBlocks.js';

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
  g4Planches: 'g4-planches',      // le tas de planches de l'enclos à poules (idem)
  bigTree: 'rs-bigtree',
  farm: 'rs-farm',
  crates: 'rs-crates',
  smallTree: 'frlg-small-tree',
  frontier: 'emerald-frontier',
  boats: 'emerald-boats',
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
// Champ de blé de la campagne (frlg-fields.png).
const WHEAT = { sheet: FRLG_SHEETS.fields, sx: 0, sy: 0 };
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
// Poteaux de la lisse horizontale (FENCE.h) : x de celui de gauche et de celui de droite, largeur.
const FENCE_POST = { west: 1, east: 9, w: 7 };
const BEACH_ROCK = { sheet: FRLG_SHEETS.beachrock, sx: 0, sy: 0 };   // rocher gris sans écume, fond transparent
// Petit plateau rocheux herbeux (bloc de cases 'ɱ', au moins 3 x 3) : bords de falaise, dessus en herbe,
// escalier au bas (sauf dans les coins).
// ɱ : falaise et statues (bloquant), ɲ : herbe du sommet et escalier
const PLATEAU_CODES = ['ɱ', 'ɲ'];
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
const FRLG_TREE = { sheet: FRLG_SHEETS.props, sx: 95, sy: 33, w: 32, h: 45 };
// Sur la planche, un bout gris du décor voisin dépasse dans le coin en haut à droite de la découpe (3 x 2 px) :
// on ne copie pas ces pixels (sinon ils se voient à côté d'un sapin de bordure).
const TREE_STRAY = { w: 3, h: 2 };

// Bâtiments Rouge Feu : image entière, posée en bas de son emprise (footH cases de haut).
export const FRLG_BUILDINGS = {
  house: { sx: 208, sy: 22, w: 80, h: 72, footH: 4 },        // maison du Bourg Palette, porte en 2e colonne
  fishingHut: { sx: 507, sy: 25, w: 64, h: 63, footH: 4 },   // petite maison au toit orange
  // Saint-Ay : maisons de village (porte en 2e colonne, sauf mention).
  cottage: { sx: 24, sy: 22, w: 80, h: 64, footH: 4 },       // toit vert en chaume, jardinières fleuries
  greenHouse: { sx: 114, sy: 22, w: 80, h: 56, footH: 4 },   // petite maison au toit vert
  slateHouse: { sx: 300, sy: 24, w: 80, h: 55, footH: 4 },   // toit d'ardoise, porte rouge
  // Montépilloy et Prytanée.
  school: { sx: 620, sy: 242, w: 80, h: 71, footH: 4 },      // auvent vert et jardinières (fan-club), porte en 2e colonne
  lab: { sx: 528, sy: 342, w: 112, h: 72, footH: 4 },       // labo du Prof. Chen : 7 cases, porte en 4e colonne
  mansion: { sx: 296, sy: 126, w: 112, h: 124, footH: 8 },   // grand immeuble vert : 7 x 8 cases, porte en 4e colonne
  museum: { sx: 136, sy: 338, w: 176, h: 120, footH: 8 },    // musée à colonnes : 11 x 8 cases, porche au milieu (porte en 6e colonne)
  // Bâtiments encore libres de la planche : maisons (toits bleu, violet, à cheminée), Boutique, crèche.
  blueHouse: { sx: 395, sy: 24, w: 96, h: 56, footH: 4 },    // toit bleu : 6 cases, porte en 5e colonne
  purpleHouse: { sx: 579, sy: 25, w: 80, h: 56, footH: 4 },  // toit violet : porte en 3e colonne
  chimneyHouse: { sx: 673, sy: 26, w: 64, h: 72, footH: 4 }, // toit-terrasse à cheminée : 4 cases, porte en 2e colonne
  mart: { sx: 421, sy: 238, w: 64, h: 62, footH: 4 },        // Boutique : 4 cases, porte en 3e colonne
  dayCare: { sx: 421, sy: 343, w: 80, h: 72, footH: 4 },     // crèche : porte en 3e colonne
  // Zone de Combat d'Émeraude (scripts/extract_frontier.py) : petites maisons modernes de 3 cases (porte au
  // milieu) et palais doré (11 x 7 cases, porte en 6e colonne).
  frontierHouse: { sheet: FRLG_SHEETS.frontier, sx: 229, sy: 18, w: 48, h: 64, footH: 4 },
  frontierShop: { sheet: FRLG_SHEETS.frontier, sx: 294, sy: 26, w: 48, h: 56, footH: 4 },
  goldenPalace: { sheet: FRLG_SHEETS.frontier, sx: 281, sy: 361, w: 176, h: 112, footH: 7 },
  // Ferme de M. Bouly : gare du téléphérique du Mont Chimnée (Rubis/Saphir, scripts/extract_rs_buildings.py),
  // 6 x 4 cases, grande porte en 4e colonne.
  boulyFarm: { sheet: FRLG_SHEETS.farm, sx: 0, sy: 0, w: 96, h: 80, footH: 4 },
};

// ---------- Sol ----------

// Cases posées sur l'herbe (le sable voisin reçoit un liseré d'herbe) : herbe, fleurs, buissons, arbres,
// barrières, panneaux, plateau du mémorial…
const GRASS_CODES = new Set(['.', 'f', 'ƒ', 'ĥ', 'ƀ', 'S', 'M', 'T', 'Ŧ', 'ɱ', 'ɲ', 'ƨ', 'ƚ', 'h', 'i', 'x', 'F', 'ʬ']);
const SAND_CODES = new Set(['s', 'ψ']);
const SEA_CODES = new Set(['w', 'ø']);
// Objets posés au sol dont le sol est celui de la majorité de leurs voisins.
const ON_NEIGHBOURS = new Set(['Y', 'ŕ', 'B', 'ɱ', 'ɸ', 'ʘ', 'ƫ', 'O', 'J',
  // objets des villes (réverbère, cabine, drapeaux, lanternes, étals, scooter, vélos, vache, tuk-tuk, terrasse,
  // métro, panneaux de l'aéroport, cactus, chameau, serpent, feu de camp)
  'l', 'b', 'e', 'v', 'g', 'n', 't', 'y', 'c', 'p', 'a', 'd', '$', '!', '>', '<', '*', 'H', 'z', '&',
  // chèvre, éléphant, drapeaux (thaï, népalais, de prière), borne du Chemin
  '¢', '€', 'þ', 'ň', '¶', '§']);
// Eau des villes : rivière, et ce qui la couvre (ponts, lotus) — posée comme un étang Rouge Feu.
const RIVER_CODES = new Set(['G', 'I', 'r', 'k']);

// Sol Rouge Feu d'une case : 'grass' | 'sand' | 'sea' | 'path' | 'pier', ou null (sol procédural).
// `buildingFloor(x, y)` : vrai sous un bâtiment Rouge Feu.
export function frlgGroundOf(x, y, at, buildingFloor = () => false) {
  const code = at(x, y);
  if (code === undefined) return null;
  // Sous un bâtiment : de l'herbe, sauf sur sa rangée du bas quand elle est posée sur un chemin (le chemin passe
  // alors sous toute la façade, porche compris, sans bout d'herbe à côté de la porte).
  if (buildingFloor(x, y)) {
    const below = !buildingFloor(x, y + 1) && frlgGroundOf(x, y + 1, at, buildingFloor);
    if (['path', 'cobble', 'concrete'].includes(below)) return below;
    // Ailleurs, le sol le plus fréquent autour du bâtiment (pavés en ville, herbe à la campagne).
    return groundUnderBuilding(x, y, at, buildingFloor);
  }
  // Panneau planté sur des pavés ou des dalles : le même sol que ses voisins (sinon de l'herbe, comme d'habitude).
  if (code === 'S') {
    const paved = [[0, -1], [0, 1], [-1, 0], [1, 0]].map(([dx, dy]) => at(x + dx, y + dy))
      .filter((n) => n === 'ɔ' || n === 'ɐ');
    if (paved.length >= 2) return paved.filter((n) => n === 'ɔ').length * 2 >= paved.length ? 'cobble' : 'concrete';
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
  if (!best && code === 'ƫ') return 'grass';                 // au milieu d'une jungle
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
    // Pavés et dalles : continuent sous les objets posés dessus et sous les bâtiments des villes. Bordure contre l'herbe,
    // et au pied d'un bâtiment posé sur l'herbe (ex. l'internat du Prytanée), sauf devant sa porte : le pavé y entre
    // jusqu'au seuil.
    const code = ground === 'cobble' ? 'ɔ' : 'ɐ';
    const other = (dx, dy) => {
      const n = at(x + dx, y + dy);
      if (n === undefined || n === code || n === 'D') return false;
      if (['R', 'W'].includes(n) || buildingFloor(x + dx, y + dy)) {
        return groundUnderBuilding(x + dx, y + dy, at, buildingFloor) === 'grass';
      }
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
const FRLG_ONLY = new Set(['.', 's', 'w', 'ç', '=', 'ĥ', 'ƀ', 'f', 'S', 'ø', 'ŕ', 'T', 'ɱ', 'ɲ', 'Ŧ', 'M', 'ƫ', 'ƨ', 'ƚ', '~', 'F', 'ʬ', 'ɔ', 'ɐ', 'G']);

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
    case 'F': {
      const f = (dx, dy) => at(x + dx, y + dy) === 'F';
      const up = f(0, -1), down = f(0, 1), left = f(-1, 0), right = f(1, 0);
      // Côté vertical : aligné sur les coins. C'est le côté est d'un enclos si l'angle au bout de la barrière
      // (en remontant, sinon en descendant) part vers la gauche. Un bout sans angle (au bord d'une ouverture) ne
      // décide rien : c'est alors l'autre bout qui compte.
      const eastAt = (dy) => {
        let cy = y;
        while (at(x, cy + dy) === 'F') cy += dy;
        const toLeft = at(x - 1, cy) === 'F';
        const toRight = at(x + 1, cy) === 'F';
        if (cy === y || toLeft === toRight) return null;
        return toLeft;
      };
      const east = eastAt(-1) ?? eastAt(1);
      const side = east ? FENCE.right : FENCE.left;
      // Bout d'un côté vertical (au bord d'une ouverture) : le rail, et un poteau de la barrière horizontale par
      // dessus, centré sur le rail (poteau de droite de la pièce pour un côté est, de gauche pour un côté ouest).
      const endPost = () => {
        put(side);
        const dx = east ? FENCE_POST.east : FENCE_POST.west;
        blit(ctx, textures, { sheet: FENCE.h.sheet, sx: FENCE.h.sx + dx, sy: FENCE.h.sy }, px + dx, py, FENCE_POST.w, S);
      };
      if (down && !up) return right ? put(FENCE.tl) : left ? put(FENCE.tr) : endPost();
      if (up && !down) return right ? put(FENCE.bl) : left ? put(FENCE.br) : endPost();
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

// Texture d'une image de la planche `sheet` (w x h px depuis sx, sy), créée une fois sous le nom `key`.
function sheetTexture(scene, key, sheet, sx, sy, w, h) {
  if (!scene.textures.exists(key)) {
    const tex = scene.textures.createCanvas(key, w, h);
    blit(tex.getContext(), scene.textures, { sheet, sx, sy }, 0, 0, w, h);
    tex.refresh();
  }
  return key;
}

// Objets hauts des planches (arbres, plantes) : une image à part, triée en profondeur comme les personnages
// (voir systems/tileRenderer.js). Renvoie { key, x, y, baseY } (texture, coin haut-gauche et pied, en pixels)
// pour la case qui porte l'image, ou null.
//   T : grand sapin de Rouge Feu, ancré sur la case en bas à droite d'un bloc de 2 x 2 ;
//   ƫ : arbre tropical à racines d'Émeraude (bloc de 2 x 2, ancré en haut à gauche), variante sable ou herbe ;
//   ƨ : plante à baies fleurie de Rubis/Saphir (16 x 32, dépasse vers le haut), baies bleues ou fleurs rouges ;
//   Y : palmier des pays exotiques, le petit arbre de Rouge Feu sans son herbe, posé sur le sol de sa case.
const BERRY_VARIANTS = [2, 3];
// Arbres tropicaux ('ƫ') : un arbre par bloc de 2 x 2 cases. Une paire isolée commence où elle commence ; dans
// une jungle (plus de 2 cases de large ou de haut), les blocs sont calés sur les coordonnées paires, comme les
// sapins, pour que la carte et le décor autour se raccordent.
function tropicalTreeAnchor(x, y, at) {
  const start = (dx, dy) => {
    let n = 0;
    while (at(x - dx * (n + 1), y - dy * (n + 1)) === 'ƫ' && n < 64) n++;
    return n;                                                   // cases d'arbres avant celle-ci
  };
  const end = (dx, dy) => {
    let n = 0;
    while (at(x + dx * (n + 1), y + dy * (n + 1)) === 'ƫ' && n < 64) n++;
    return n;
  };
  const anchored = (before, after, coord) => (before + after + 1 > 2 ? mod2(coord) === 0 : before === 0);
  return anchored(start(1, 0), end(1, 0), x) && anchored(start(0, 1), end(0, 1), y);
}

export function frlgTallImage(scene, code, x, y, at) {
  if (code === 'T') {
    if (!inFullTreeBlock(x, y, at) || mod2(x) !== 1 || mod2(y) !== 1) return null;
    const key = 'tall-frlg-tree';
    if (!scene.textures.exists(key)) {
      const tex = scene.textures.createCanvas(key, FRLG_TREE.w, FRLG_TREE.h);
      drawFrlgTree(tex.getContext(), scene.textures, 0, 0);
      tex.refresh();
    }
    return { key, x: (x - 1) * S, y: (y + 1) * S - FRLG_TREE.h, baseY: (y + 1) * S - 1 };
  }
  if (code === 'ƫ') {
    if (!tropicalTreeAnchor(x, y, at)) return null;
    const sand = frlgGroundOf(x, y, at) === 'sand';
    const key = sheetTexture(scene, `emerald-tree-${sand ? 'sand' : 'grass'}`, FRLG_SHEETS.tropical, sand ? 0 : 2 * S, 0, 2 * S, 2 * S);
    return { key, x: x * S, y: y * S, baseY: (y + 2) * S - 1 };
  }
  if (code === 'ƨ') {
    const variant = BERRY_VARIANTS[hash(x, y) % BERRY_VARIANTS.length];
    const key = sheetTexture(scene, `rs-berry-${variant}`, FRLG_SHEETS.berries, variant * S, 0, S, 2 * S);
    return { key, x: x * S, y: (y - 1) * S, baseY: (y + 1) * S - 1 };
  }
  if (code === 'Y') return { key: FRLG_SHEETS.smallTree, x: x * S, y: y * S, baseY: (y + 1) * S - 1 };
  return null;
}

function drawFrlgTree(ctx, textures, px, py) {
  const { w, h } = FRLG_TREE;
  blit(ctx, textures, FRLG_TREE, px, py, w - TREE_STRAY.w, TREE_STRAY.h);
  blit(ctx, textures, { ...FRLG_TREE, sy: FRLG_TREE.sy + TREE_STRAY.h }, px, py + TREE_STRAY.h, w, h - TREE_STRAY.h);
}

// ---------- Voiture de la famille ----------

// Voiture bleue (frlg-car.png, cases de 42 x 30 px) : vue de côté vers la gauche, vers la droite, puis de dos.
export const FAMILY_CAR = { sheet: FRLG_SHEETS.car, w: 42, h: 30 };
export function familyCarImage(scene, x, y, facing = 'right') {
  const tex = scene.textures.get(FAMILY_CAR.sheet);
  if (!tex.has('right')) {
    tex.add('left', 0, 0, 0, FAMILY_CAR.w, FAMILY_CAR.h);
    tex.add('right', 0, FAMILY_CAR.w, 0, FAMILY_CAR.w, FAMILY_CAR.h);
    tex.add('back', 0, 2 * FAMILY_CAR.w, 0, FAMILY_CAR.w, FAMILY_CAR.h);
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
  computer: CENTER_ITEM(0, 1, 2),       // ordinateur
  crtTv: { ...RS(558, 84, 16, 27, 1, 1), back: 11 },    // télé sur son meuble (Rubis/Saphir), le pied au niveau des meubles du mur
  console: { ...RS(486, 50, 13, 16, 1, 1) },   // console et manette
  bed: RS(488, 79, 24, 32, 2, 2),       // lit
  computerDesk: { sprite: { sheet: 'frlg-desk', sx: 0, sy: 0 }, pw: 32, ph: 30, w: 2, h: 2, back: 11 },   // bureau avec ordinateur (sans tabouret)
  pottedPlant: RS(630, 50, 16, 15, 1, 1),   // petite plante en pot
  chalkboard: RS(369, 51, 64, 18, 4, 1),   // tableau vert (au mur)
  schoolDesk: RS(498, 128, 32, 22, 2, 1),  // pupitre avec des livres
  paperDesk: RS(539, 129, 32, 20, 2, 1),   // pupitre avec des copies
  longTable: RS(506, 50, 48, 16, 3, 1),    // longue table en bois (bureau du maître)
  shelf: RS(519, 80, 32, 31, 2, 2),        // étagère à livres
  wardrobe: RS(602, 119, 15, 28, 1, 2),     // armoire en bois (portes en haut, tiroirs en bas)
  carton: { sprite: { sheet: 'frlg-carton', sx: 0, sy: 0 }, pw: 15, ph: 14, w: 1, h: 1 },        // carton de déménagement
  smallCarton: { sprite: { sheet: 'frlg-carton', sx: 15, sy: 0 }, pw: 11, ph: 9, w: 1, h: 1 },   // petit carton (sur un meuble)
  // Bar et boîte de nuit (Hull), dessinés dans le code faute d'équivalent Rouge Feu (texture 'frlg-bar', voir
  // ensureBarTexture) : comptoir en bois (bouts gauche, droit et milieu), pompes à bière posées dessus, étagère à
  // bouteilles fixée au mur (y = 1, au-dessus du barman), tabourets, table ronde, cible de fléchettes ; cabine de DJ
  // (platines, table de mixage, ordinateur), enceintes, néons et boule à facettes.
  // Casier métallique du collège (texture 'frlg-locker', voir ensureLockerTexture), adossé au mur du fond : il
  // monte sur le mur (`back`) comme les grands meubles des pièces.
  locker: { sprite: { sheet: 'frlg-locker', sx: 0, sy: 0 }, pw: 16, ph: 30, w: 1, h: 1, back: 14 },
  barCounterL: { sprite: { sheet: 'frlg-bar', sx: 16, sy: 0 }, pw: 16, ph: 16, w: 1, h: 1 },
  barCounter: { sprite: { sheet: 'frlg-bar', sx: 0, sy: 0 }, pw: 16, ph: 16, w: 1, h: 1 },
  barCounterR: { sprite: { sheet: 'frlg-bar', sx: 32, sy: 0 }, pw: 16, ph: 16, w: 1, h: 1 },
  beerTaps: { sprite: { sheet: 'frlg-bar', sx: 48, sy: 0 }, pw: 12, ph: 14, w: 1, h: 1 },
  bottleShelf: { sprite: { sheet: 'frlg-bar', sx: 64, sy: 0 }, pw: 32, ph: 30, w: 2, h: 1 },
  barStool: { sprite: { sheet: 'frlg-bar', sx: 96, sy: 0 }, pw: 10, ph: 11, w: 1, h: 1 },
  pubTable: { sprite: { sheet: 'frlg-bar', sx: 112, sy: 0 }, pw: 16, ph: 18, w: 1, h: 1 },
  pintPair: { sprite: { sheet: 'frlg-bar', sx: 112, sy: 18 }, pw: 10, ph: 6, w: 1, h: 1 },
  dartboard: { sprite: { sheet: 'frlg-bar', sx: 128, sy: 0 }, pw: 14, ph: 14, w: 1, h: 2 },
  djBooth: { sprite: { sheet: 'frlg-bar', sx: 144, sy: 0 }, pw: 48, ph: 24, w: 3, h: 1 },
  speaker: { sprite: { sheet: 'frlg-bar', sx: 192, sy: 0 }, pw: 14, ph: 28, w: 1, h: 1 },
  neonPink: { sprite: { sheet: 'frlg-bar', sx: 208, sy: 0 }, pw: 32, ph: 8, w: 2, h: 2 },
  neonCyan: { sprite: { sheet: 'frlg-bar', sx: 208, sy: 8 }, pw: 32, ph: 8, w: 2, h: 2 },
  discoBall: { sprite: { sheet: 'frlg-bar', sx: 240, sy: 0 }, pw: 10, ph: 14, w: 1, h: 1 },
  // Caisses en bois du marché de Slateport (rs-crates.png, scripts/extract_rs_buildings.py).
  fishCrate: { sprite: { sheet: FRLG_SHEETS.crates, sx: 15, sy: 0 }, pw: 15, ph: 16, w: 1, h: 1 },
  giveCrate: { sprite: { sheet: FRLG_SHEETS.crates, sx: 30, sy: 0 }, pw: 15, ph: 16, w: 1, h: 1 },   // « À DONNER »
  greenCrate: { sprite: { sheet: FRLG_SHEETS.crates, sx: 45, sy: 0 }, pw: 15, ph: 16, w: 1, h: 1 },  // légumes verts
  orangeCrate: { sprite: { sheet: FRLG_SHEETS.crates, sx: 60, sy: 0 }, pw: 15, ph: 16, w: 1, h: 1 }, // oranges
  tomatoCrate: { sprite: { sheet: FRLG_SHEETS.crates, sx: 75, sy: 0 }, pw: 15, ph: 16, w: 1, h: 1 }, // tomates
  jar: { sprite: { sheet: FRLG_SHEETS.crates, sx: 90, sy: 0 }, pw: 15, ph: 16, w: 1, h: 1 },         // jarre
};

// Mobilier de bar et de boîte de nuit (voir FRLG_DECOR barCounter…), dessiné au pixel près dans les tons de
// Rouge Feu : bois sombre, contours brun-noir, reflets clairs.
// Casier métallique bleu (16 x 30) : contour sombre, porte avec trois fentes d'aération, poignée et étiquette.
function ensureLockerTexture(textures) {
  if (textures.exists('frlg-locker')) return;
  const tex = textures.createCanvas('frlg-locker', 16, 30);
  const ctx = tex.getContext();
  const R = (c, x, y, w, h) => { ctx.fillStyle = c; ctx.fillRect(x, y, w, h); };
  R('#38486c', 0, 0, 16, 30);                             // contour
  R('#6c88b8', 1, 1, 14, 28);                             // porte
  R('#90a8d0', 1, 1, 14, 1);                              // reflet du haut
  R('#90a8d0', 1, 1, 1, 28);
  R('#4c6494', 14, 1, 1, 28);                             // ombre du bord droit
  for (const y of [4, 6, 8]) R('#38486c', 4, y, 8, 1);    // fentes d'aération
  R('#f0f0e8', 5, 12, 6, 3);                              // étiquette
  R('#a0a0a8', 6, 13, 4, 1);
  R('#d8d8e0', 11, 17, 2, 4);                             // poignée
  R('#38486c', 12, 18, 1, 3);
  R('#4c6494', 1, 26, 14, 2);                             // socle
  tex.refresh();
}

function ensureBarTexture(textures) {
  if (textures.exists('frlg-bar')) return;
  const tex = textures.createCanvas('frlg-bar', 256, 32);
  const ctx = tex.getContext();
  const R = (c, x, y, w, h) => { ctx.fillStyle = c; ctx.fillRect(x, y, w, h); };
  const disc = (cx, cy, r, c) => {
    for (let y = Math.floor(cy - r); y <= cy + r; y++) {
      for (let x = Math.floor(cx - r); x <= cx + r; x++) if ((x + 0.5 - cx) ** 2 + (y + 0.5 - cy) ** 2 <= r * r) R(c, x, y, 1, 1);
    }
  };
  const K = '#382820';
  const WOOD = { hi: '#f0c088', top: '#d89858', mid: '#a86838', dark: '#784828' };

  // Comptoir : plateau verni, façade à panneaux, plinthe. Le bout gauche et le bout droit sont arrondis.
  const counter = (ox, left, right) => {
    R(K, ox, 0, 16, 16);
    R(WOOD.top, ox, 1, 16, 4);
    R(WOOD.hi, ox, 1, 16, 1);
    R(WOOD.dark, ox, 6, 16, 1);
    R(WOOD.mid, ox, 7, 16, 7);
    R(WOOD.dark, ox + 7, 8, 1, 5);
    R(WOOD.dark, ox + 15, 8, 1, 5);
    R(WOOD.top, ox + 1, 8, 1, 5);
    R(WOOD.top, ox + 9, 8, 1, 5);
    R(K, ox, 14, 16, 2);
    if (left) { R(K, ox, 1, 1, 14); ctx.clearRect(ox, 0, 1, 1); ctx.clearRect(ox, 15, 1, 1); }
    if (right) { R(K, ox + 15, 1, 1, 14); ctx.clearRect(ox + 15, 0, 1, 1); ctx.clearRect(ox + 15, 15, 1, 1); }
  };
  counter(0, false, false);
  counter(16, true, false);
  counter(32, false, true);

  // Pompes à bière : trois manches (rouge, or, vert) sur leur socle chromé, et l'égouttoir.
  [[1, '#d04040'], [5, '#e0b030'], [9, '#40a050']].forEach(([x, c]) => {
    R(K, 48 + x - 1, 0, 4, 11);
    R(c, 48 + x, 1, 2, 3);
    R('#f8f8f8', 48 + x, 1, 1, 1);
    R('#303038', 48 + x, 4, 2, 6);
    R('#c8c8d8', 48 + x - 1, 10, 4, 2);
  });
  R('#888898', 48, 12, 12, 2);
  R(K, 48, 13, 12, 1);

  // Étagère à bouteilles fixée au mur : cadre en bois, miroir, trois rangées de bouteilles.
  R(K, 64, 0, 32, 30);
  R(WOOD.dark, 65, 1, 30, 28);
  R('#a0b8c8', 66, 2, 28, 25);
  R('#c8dce8', 67, 3, 3, 22);
  const BOTTLES = ['#408850', '#c08030', '#783818', '#d8e8f0', '#a03040', '#305890'];
  [9, 17, 25].forEach((y, row) => {
    for (let i = 0; i < 6; i++) {
      const x = 67 + i * 4 + (row % 2);
      const c = BOTTLES[(i + row * 2) % BOTTLES.length];
      R(K, x - 1, y - 6, 4, 6);
      R(c, x, y - 5, 2, 5);
      R(c, x, y - 7, 1, 2);
      R('#f8f8f8', x, y - 4, 1, 1);
    }
    R(WOOD.top, 66, y, 28, 2);
    R(K, 66, y + 2, 28, 1);
  });

  // Tabouret de bar : assise rouge rembourrée, pied chromé, socle.
  R(K, 96, 0, 10, 4);
  R('#c03838', 97, 0, 8, 3);
  R('#e86868', 98, 0, 6, 1);
  R('#b8b8c8', 100, 4, 2, 5);
  R(K, 98, 9, 6, 2);
  R('#888898', 99, 9, 4, 1);

  // Table ronde de pub : plateau en bois, pied central, socle.
  R(K, 114, 2, 12, 1);
  R(K, 113, 3, 14, 6);
  R(K, 114, 9, 12, 1);
  R(WOOD.top, 114, 3, 12, 5);
  R(WOOD.hi, 115, 3, 10, 1);
  R(WOOD.mid, 114, 8, 12, 1);
  R(WOOD.dark, 119, 10, 2, 5);
  R(K, 116, 15, 8, 2);
  // Deux pintes (à poser sur une table) : verre, bière ambrée, mousse.
  [[112, 18], [117, 18]].forEach(([x, y]) => {
    R(K, x, y, 5, 6);
    R('#d89830', x + 1, y + 2, 3, 3);
    R('#f8f0e0', x + 1, y + 1, 3, 1);
    R('#f0c060', x + 1, y + 2, 1, 3);
  });

  // Cible de fléchettes : anneaux noirs, crème, rouges et verts, et le centre.
  disc(135, 7, 7, '#202020');
  disc(135, 7, 6, '#f0e0c0');
  disc(135, 7, 5, '#c03030');
  disc(135, 7, 4, '#202020');
  disc(135, 7, 3, '#40a050');
  disc(135, 7, 2, '#f0e0c0');
  disc(135, 7, 1, '#c03030');
  R('#d8d0c0', 140, 4, 2, 1);                                   // une fléchette plantée

  // Cabine de DJ : meuble à bandes lumineuses, deux platines, table de mixage, ordinateur allumé.
  R(K, 144, 8, 48, 16);
  R('#505060', 145, 9, 46, 4);
  R('#303040', 145, 13, 46, 10);
  R('#f050b0', 146, 15, 44, 1);
  R('#40d0f0', 146, 19, 44, 1);
  for (const cx of [153, 183]) {
    disc(cx, 10.5, 4, '#202028');
    disc(cx, 10.5, 2.5, '#606070');
    R('#f05050', cx, 10, 1, 1);
  }
  R('#202028', 163, 9, 10, 4);
  [164, 167, 170].forEach((x) => R('#e0e040', x, 10, 1, 1));
  R(K, 164, 1, 9, 8);
  R('#c0c0d0', 165, 2, 7, 6);
  R('#80e8ff', 166, 3, 5, 4);

  // Enceinte : caisse noire, tweeter et grand haut-parleur.
  R(K, 192, 0, 14, 28);
  R('#303038', 193, 1, 12, 26);
  disc(199, 7, 3.5, '#686878');
  disc(199, 7, 1.5, '#202028');
  disc(199, 18, 5, '#686878');
  disc(199, 18, 2.5, '#202028');
  R('#484858', 194, 25, 10, 1);

  // Néons (rose, puis cyan) : tube lumineux et son halo, deux fixations.
  [[0, '#ff60c0', '#ffd0f0', '#ff60c060'], [8, '#40d8ff', '#d0f8ff', '#40d8ff60']].forEach(([y, c, hi, glow]) => {
    R(glow, 208, y + 1, 32, 6);
    R(c, 209, y + 3, 30, 2);
    R(hi, 210, y + 3, 28, 1);
    R('#606070', 212, y + 5, 2, 2);
    R('#606070', 234, y + 5, 2, 2);
  });

  // Boule à facettes, suspendue à son fil.
  R('#888898', 244, 0, 1, 4);
  disc(245, 9, 5, '#606078');
  for (let y = 5; y < 14; y++) for (let x = 241; x < 250; x++) {
    if ((x + 0.5 - 245) ** 2 + (y + 0.5 - 9) ** 2 <= 16 && (x + y) % 2 === 0) R('#e0e0f8', x, y, 1, 1);
  }
  R('#ffffff', 243, 7, 1, 1);
  tex.refresh();
}

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

// Bureau avec ordinateur de Rubis/Saphir (rs-objects.png, 32 x 39 px) sans son tabouret vert : on garde le bureau
// (30 premières rangées), on efface le tabouret et on redessine le pied droit, symétrique du pied gauche.
function ensureDeskTexture(textures) {
  if (textures.exists('frlg-desk')) return;
  const tex = textures.createCanvas('frlg-desk', 32, 30);
  const ctx = tex.getContext();
  ctx.drawImage(textures.get(FRLG_SHEETS.rsObjects).getSourceImage(), 448, 74, 32, 30, 0, 0, 32, 30);
  ctx.clearRect(5, 26, 27, 4);                            // tabouret, sous le bureau
  ctx.clearRect(31, 24, 1, 2);
  const leg = ctx.getImageData(0, 24, 6, 6);              // pied gauche (avec le bord avant du bureau)
  const mirror = ctx.createImageData(6, 6);
  for (let y = 0; y < 6; y++) {
    for (let x = 0; x < 6; x++) {
      for (let c = 0; c < 4; c++) mirror.data[(y * 6 + x) * 4 + c] = leg.data[(y * 6 + 5 - x) * 4 + c];
    }
  }
  ctx.putImageData(mirror, 26, 24);
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
// fond (rangée juste sous le mur), il remonte jusqu'à toucher le mur (voir `back`).
// `dx`, `dy` : décalage en pixels (ex. petit carton posé sur un bureau).
export function decorSpritePosition(interior, { kind, x, y, dx = 0, dy = 0 }) {
  const d = FRLG_DECOR[kind];
  const px = x * S + Math.round((d.w * S - d.pw) / 2);
  const bottomAligned = (y + d.h) * S - d.ph;
  const againstWall = interior.grid[y - 1]?.[x] === 'X';
  // Contre le mur du fond : le haut du meuble touche le bas du gris (il couvre la plinthe, 8 px au-dessus de sa case).
  // Un meuble sans profondeur dessinée (télé, console) a alors le pied au niveau des meubles du mur (8 px dans sa case).
  // `back` : rangée de l'image où commence l'arrière du meuble (ce qui dépasse au-dessus, comme l'écran du bureau
  // ou la télé, mord sur le mur).
  const wallTop = y * S - 8 - (d.back ?? 0);
  return { px: px + dx, py: (againstWall ? Math.min(wallTop, bottomAligned) : bottomAligned) + dy };
}

// Lit de l'intérieur sous la case (x, y) : coin haut-gauche de son image, en pixels (voir CharacterSprite, `bed`).
export function bedAt(interior, x, y) {
  // Intérieur redessiné en Gen 4 (scripts/build_interiors.py) : ses lits sont dans le dessin, la couverture au-dessus
  // des personnages ; on couche le PNJ au milieu du lit, la tête sur l'oreiller.
  if (interior.built) {
    const b = (interior.built.beds ?? []).find((o) => x >= o.x && x < o.x + o.w && y >= o.y && y < o.y + o.h);
    return b && { px: b.cx - 12, py: b.py, gen4: true };
  }
  const bed = (interior.decor ?? []).find((o) => o.kind === 'bed' && x >= o.x && x < o.x + 2 && y >= o.y && y < o.y + 2);
  return bed && decorSpritePosition(interior, bed);
}

// Bas du lit (drap replié et couverture), redessiné par-dessus un personnage couché : image de rs-objects.png.
export const BED_LOWER = { sheet: FRLG_SHEETS.rsObjects, sx: 488, sy: 79 + 13, w: 24, h: 16 };

// Couche 3 d'un intérieur : meubles, puis tapis de sortie sur chaque groupe de cases 'E' d'une rangée.
export function drawFrlgInteriorDecor(ctx, textures, interior) {
  ensureCartonTexture(textures);
  ensureDeskTexture(textures);
  ensureLockerTexture(textures);
  ensureBarTexture(textures);
  const roomW = interior.grid[0].length * S;
  interior.grid.forEach((row, y) => row.forEach((code, x) => {
    const st = STAIRS_IN_WALL[code];
    if (!st) return;
    // Centré sur la case, sans dépasser les bords de la pièce ; bas du cadre 2 px sous le haut de la case.
    const px = Math.max(0, Math.min(roomW - st.w, x * S + Math.round((S - st.w) / 2)));
    blit(ctx, textures, st, px, y * S + 2 - st.h, st.w, st.h);
  }));
  // Meubles en cases (fenêtres, étagères…) d'abord, puis les objets posés par-dessus (télé, console, plantes…),
  // qui peuvent mordre sur le mur ou sur une fenêtre.
  const decor = interior.decor ?? [];
  for (const item of decor) {
    const d = FRLG_DECOR[item.kind];
    if (!d.sprite) blit(ctx, textures, d.tile, item.x * S, item.y * S, d.w * S, d.h * S);
  }
  for (const item of decor) {
    const d = FRLG_DECOR[item.kind];
    if (!d.sprite) continue;
    const { px, py } = decorSpritePosition(interior, item);
    blit(ctx, textures, d.sprite, px, py, d.pw, d.ph);
  }
  interior.grid.forEach((row, y) => row.forEach((code, x) => {
    if (code !== 'E' || row[x - 1] === 'E') return;
    let n = 1;
    while (row[x + n] === 'E') n++;
    const cx = x * S + (n * S) / 2;
    blit(ctx, textures, EXIT_MAT, Math.round(cx - EXIT_MAT.w / 2), y * S, EXIT_MAT.w, EXIT_MAT.h);
  }));
}
