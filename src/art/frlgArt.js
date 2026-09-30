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
  pier: 'frlg-pier',
  stairs: 'frlg-stairs',
  searock: 'frlg-searock',
  rooms: 'frlg-rooms',
  centerItems: 'frlg-center-items',
  beachrock: 'frlg-beachrock',
  tropical: 'emerald-trees',
  travelSea: 'frlg-travel-sea',
  ferryWake: 'frlg-ferry-wake',
  townMap: 'frlg-townmap',
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
const BEACH_ROCK = { sheet: FRLG_SHEETS.beachrock, sx: 0, sy: 0 };   // rocher gris sans écume, fond transparent
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
const SEA_ROCK = { sheet: FRLG_SHEETS.searock, sx: 0, sy: 0 };   // sans l'eau autour : la mer animée passe dessous
// Ponton (sans l'eau de ses côtés : le sol dessous reste visible).
const PIER_TILE = (i) => ({ sheet: FRLG_SHEETS.pier, sx: i * S, sy: 0 });
const PIER = { left: PIER_TILE(0), mid: PIER_TILE(1), right: PIER_TILE(2) };

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
const ON_NEIGHBOURS = new Set(['Y', 'ŕ', 'B', 'ɱ', 'ɸ', 'ƫ']);

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

  // La mer n'est pas dessinée ici : c'est une couche animée sous la carte (voir addSeaLayer).
  if (ground === 'grass') blit(ctx, textures, GRASS[hash(x, y) % GRASS.length], px, py);
  else if (ground === 'pier') {
    // Sous le ponton : du sable là où il est bordé de terre, la mer (animée) ailleurs.
    const onLand = [groundAt(-1, 0), groundAt(1, 0)].some((g) => ['sand', 'path', 'grass'].includes(g));
    if (onLand) blit(ctx, textures, SAND_ON_GRASS.fill, px, py);
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
      blit(ctx, textures, borderTile(SAND_ON_SEA, isSea), px, py);   // partie transparente : la mer animée
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
const FRLG_ONLY = new Set(['.', 's', 'w', 'ç', '=', 'ĥ', 'ƀ', 'f', 'S', 'ł', 'ø', 'ŕ', 'T', 'ɱ', 'ɲ', 'Ŧ', 'M', 'ƫ']);

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
    case 'M': return drawPixels(ctx, MAILBOX, MAILBOX_COLORS, px + 2, py + S - MAILBOX.length);
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

export function drawFrlgTree(ctx, textures, px, py) {
  blit(ctx, textures, FRLG_TREE, px, py, FRLG_TREE.w, FRLG_TREE.h);
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
export function tallGrassCoverTexture(scene) {
  const key = 'frlg-grass-cover';
  if (!scene.textures.exists(key)) {
    const tex = scene.textures.createCanvas(key, S, S - GRASS_COVER_TOP);
    const src = scene.textures.get(FRLG_SHEETS.outdoor).getSourceImage();
    tex.getContext().drawImage(src, TALL_GRASS.sx, TALL_GRASS.sy + GRASS_COVER_TOP, S, S - GRASS_COVER_TOP, 0, 0, S, S - GRASS_COVER_TOP);
    tex.refresh();
  }
  return key;
}

// ---------- Intérieurs Rouge Feu ----------

// Intérieur « Rouge Feu » (`frlg: true` dans ses données, voir data/maps/interiors.js) : deux rangées de mur
// en haut de la pièce, parquet partout ailleurs, noir autour ; les meubles (`decor`) sont des blocs repris
// tels quels des pièces de frlg-rooms.png, le tapis de sortie est centré sur les cases 'E'.
// Les cases de meubles sont des 'm' (bloquantes) dans la grille ; ce qui n'a pas d'équivalent Rouge Feu
// (lit, escalier, cannes à pêche…) reste dessiné dans le code, sur le parquet.
const ROOM = (room, c, r) => ({ sheet: FRLG_SHEETS.rooms, sx: room * 11 * S + c * S, sy: r * S });
const WALL_TOP = ROOM(1, 8, 0);
const WALL = ROOM(1, 8, 1);
const FLOOR_UNDER_WALL = ROOM(1, 8, 2);
const FLOOR = ROOM(1, 8, 4);
const EXIT_MAT = { sheet: FRLG_SHEETS.rooms, sx: 59, sy: 116, w: 26, h: 16 };

// Meubles : { tile, w, h } (largeur et hauteur en cases). La plupart sont des blocs des pièces de
// frlg-rooms.png (fond de mur et de parquet compris) ; l'ordinateur et la télé murale viennent du Centre
// Pokémon (frlg-center-items.png, fond transparent).
const block = (room, c, r, w, h) => ({ tile: ROOM(room, c, r), w, h });
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
};

// Couche 1 d'un intérieur : mur (deux rangées du haut), noir (murs du bas et des côtés), parquet.
export function drawFrlgInteriorGround(ctx, textures, x, y, at) {
  const px = x * S;
  const py = y * S;
  if (at(x, y) === 'X') {
    if (y <= 1) return blit(ctx, textures, y === 0 ? WALL_TOP : WALL, px, py);
    ctx.fillStyle = '#000000';
    return ctx.fillRect(px, py, S, S);
  }
  return blit(ctx, textures, at(x, y - 1) === 'X' && y === 2 ? FLOOR_UNDER_WALL : FLOOR, px, py);
}

// Codes d'intérieur entièrement dessinés par les couches Rouge Feu.
export const FRLG_INTERIOR_ONLY = new Set(['X', 'o', 'm', 'E']);

// Couche 3 d'un intérieur : meubles, puis tapis de sortie sur chaque groupe de cases 'E' d'une rangée.
export function drawFrlgInteriorDecor(ctx, textures, interior) {
  for (const { kind, x, y } of interior.decor ?? []) {
    const { tile, w, h } = FRLG_DECOR[kind];
    blit(ctx, textures, tile, x * S, y * S, w * S, h * S);
  }
  interior.grid.forEach((row, y) => row.forEach((code, x) => {
    if (code !== 'E' || row[x - 1] === 'E') return;
    let n = 1;
    while (row[x + n] === 'E') n++;
    const cx = x * S + (n * S) / 2;
    blit(ctx, textures, EXIT_MAT, Math.round(cx - EXIT_MAT.w / 2), y * S, EXIT_MAT.w, EXIT_MAT.h);
  }));
}
