import { TILE_SIZE as S } from '../data/tiles.js';
import { rect, sprite, hash } from './pixel.js';
import { pixelText } from './buildingArt.js';
import { mod2, inFullTreeBlock, inForest } from '../data/treeBlocks.js';

// Dessin procédural de chaque tuile (16x16), dans l'esprit de Rouge Feu.
// `at(x, y)` renvoie le code de la case voisine (undefined hors carte).

const C = {
  path: 0xa8e8bc, pathDot: 0xc8f8d8,
  grass: 0x78c890, grassTuft: 0x58a878, grassLight: 0xa8e0b8, grassEdge: 0xc0ecd0, grassEdge2: 0x98d8b0,
  water: 0x3890f0, waterDeep: 0x2878e0, waterWave: 0xa8d8ff,
  rim: 0xa85838, rimLight: 0xe0a070,
};

// Cases considérées comme « pelouse » pour le liseré clair des zones d'herbe.
const GRASSY = new Set(['.', 'f', 'ł', 'h', 'i', '♣', '≈', '♠', '¥', 'ĥ', 'ƀ', 'ƒ', 'F', 'S', 'M', 'R', 'W', 'D', 'U', 'O', 'Q', 'V', 'x']);

// Petits objets posés au sol (lanterne, drapeau, cabine…) : leur sol est celui de leurs voisins.
const SMALL_OBJECTS = new Set(['b', 'j', 'l', 'n', 'v', 't', 'y', 'c', 'e', 'a', 'd', 'g', 'p', 'H', 'z', '*', '&', '$', '!', '>', '<', '§', '¢', '€', 'þ', '¶', 'ň', 'ŕ']);

function objectOnGrass(x, y, at) {
  const around = [at(x, y - 1), at(x, y + 1), at(x - 1, y), at(x + 1, y)].filter(Boolean);
  return around.filter((c) => GRASSY.has(c)).length * 2 > around.length;
}

// Un arbre est posé sur l'herbe si la majorité de ses voisins (hors arbres) en est, sinon sur le chemin.
function treeOnGrass(x, y, at) {
  const around = [at(x, y - 1), at(x, y + 1), at(x - 1, y), at(x + 1, y)].filter((c) => c && c !== 'T');
  return around.length > 0 && around.filter((c) => GRASSY.has(c)).length * 2 > around.length;
}

// Un palmier est posé sur l'herbe si la majorité de ses voisins en est, sinon sur le sable.
function palmOnGrass(x, y, at) {
  const around = [at(x, y - 1), at(x, y + 1), at(x - 1, y), at(x + 1, y)];
  const grass = around.filter((c) => GRASSY.has(c)).length;
  const sandy = around.filter((c) => c === 's').length;
  return grass > sandy;
}

function isGrassy(x, y, at) {
  const c = at(x, y);
  if (c === 'Y') return palmOnGrass(x, y, at);
  if (c === 'T') return treeOnGrass(x, y, at);
  if (SMALL_OBJECTS.has(c)) return objectOnGrass(x, y, at);
  return GRASSY.has(c);
}

// Sapin conique façon Rouge Feu, dessiné par étages superposés aux bords en dents de scie.
// W = 32 (massif de 2x2 cases, 42 px de feuillage : dépasse de 12 px au-dessus du bloc)
// ou 16 (arbre d'une case, 22 px de feuillage).
const PINE = { k: 0x28582c, s: 0x2c6c34, d: 0x44903c, m: 0x6cb844, L: 0x9cd850, h: 0xd0f47c, t: 0x6c4828, T: 0x4c3018 };
const pineCache = {};
const PINE_H = { 32: 42, 16: 22 };
function pineShape(W) {
  if (pineCache[W]) return pineCache[W];
  const f = W / 32;
  const H = PINE_H[W];
  const fy = (H - 1) / 30;
  // [haut, bas, demi-largeur max] de chaque étage, du sommet vers le pied.
  const tiers = [[0, 9, 5], [4, 16, 9.5], [9, 23, 13], [15, 30, 16]].map(([a, b, h]) => [a * fy, b * fy, h * f]);
  const owner = [];                                                  // étage visible de chaque pixel (-1 : vide)
  for (let y = 0; y < H; y++) {
    owner.push([]);
    for (let x = 0; x < W; x++) {
      const dx = Math.abs(x + 0.5 - W / 2);
      let o = -1;
      tiers.forEach(([top, bottom, maxHalf], i) => {
        if (o !== -1) return;
        const tooth = [0, 1, 2, 1][Math.floor(dx) % 4] * fy * 1.2;  // bas de l'étage en dents de scie
        if (y < top || y > bottom - tooth) return;
        const hw = maxHalf * (y - top + 1.5) / (bottom - top + 1.5);
        if (dx < hw) o = i;
      });
      owner[y].push(o);
    }
  }
  pineCache[W] = owner;
  return owner;
}

// Dessine un sapin dont le pied est en (px + W/2, baseY).
function pine(g, px, baseY, W) {
  const owner = pineShape(W);
  const H = owner.length;
  const top = baseY - H - 1;
  g.fillStyle(0x1c5040, 0.35);                                        // ombre au sol
  g.fillRect(px + W * 0.12, baseY - 3, W * 0.76, 4);
  g.fillRect(px + W * 0.22, baseY + 1, W * 0.56, 1);
  const tw = W === 32 ? 6 : 4;                                        // tronc, à peine visible sous l'arbre
  rect(g, PINE.k, px + W / 2 - tw / 2 - 1, baseY - 4, tw + 2, 5);
  rect(g, PINE.t, px + W / 2 - tw / 2, baseY - 4, tw, 4);
  rect(g, PINE.T, px + W / 2, baseY - 4, tw / 2, 4);
  const at = (x, y) => (y >= 0 && y < H && x >= 0 && x < W ? owner[y][x] : -1);
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const o = at(x, y);
      if (o < 0) continue;
      const rel = (x + 0.5 - W / 2) / (W / 2);                        // -1 à gauche, +1 à droite
      let c;
      const edge = at(x - 1, y) < 0 || at(x + 1, y) < 0 || at(x, y - 1) < 0 || at(x, y + 1) < 0;
      const skirt = at(x, y + 1) > o;                                 // bord de l'étage posé sur celui du dessous
      if (edge) c = PINE.k;
      else if (skirt) c = rel < -0.2 ? PINE.d : PINE.s;
      else {
        // Ombre sous l'étage du dessus : 2 px sombres juste sous son bord.
        const underUpper = (at(x, y - 1) >= 0 && at(x, y - 1) < o) || (at(x, y - 2) >= 0 && at(x, y - 2) < o);
        if (underUpper) c = rel < -0.3 ? PINE.m : PINE.d;
        else if (rel < -0.45) c = (x + y) % 2 ? PINE.h : PINE.L;       // flanc éclairé, tramé
        else if (rel < -0.1) c = (x + y) % 2 ? PINE.L : PINE.m;
        else if (rel < 0.35) c = (x * 2 + y) % 5 === 0 ? PINE.L : PINE.m;
        else c = (x + y) % 2 ? PINE.d : PINE.m;
      }
      rect(g, c, px + x, top + y, 1, 1);
    }
  }
}

// Sol de sous-bois (façon Rouge Feu) : vert-bleu sombre, petites touffes.
function forestFloor(g, px, py, x, y) {
  rect(g, 0x4c9c78, px, py, S, S);
  const h = hash(x, y, 41);
  rect(g, 0x3c8468, px + (h % 10) + 2, py + ((h >> 4) % 10) + 3, 3, 1);
  rect(g, 0x68b890, px + ((h >> 8) % 12) + 1, py + ((h >> 12) % 12) + 1, 1, 1);
}

// Sol sous un sapin : celui qui domine autour de l'arbre (autour de tout le bloc pour un grand sapin).
function treeGround(g, px, py, x, y, at) {
  let around;
  if (inFullTreeBlock(x, y, at)) {
    const bx = x - mod2(x);
    const by = y - mod2(y);
    around = [];
    for (let i = -1; i <= 2; i++) {
      around.push([bx + i, by - 1], [bx + i, by + 2], [bx - 1, by + i], [bx + 2, by + i]);
    }
  } else {
    around = [[x, y - 1], [x, y + 1], [x - 1, y], [x + 1, y]];
  }
  const votes = { grass: 0, sand: 0, cobble: 0, path: 0 };
  for (const [nx, ny] of around) {
    const c = at(nx, ny);
    if (!c || c === 'T') continue;
    if (c === 'C') votes.cobble++;
    else if (c === 's' || c === 'w') votes.sand++;
    else if (c === 'P') votes.path++;
    else if (isGrassy(nx, ny, at)) votes.grass++;
  }
  const best = ['grass', 'sand', 'cobble', 'path'].reduce((a, b) => (votes[b] > votes[a] ? b : a));
  if (best === 'grass' && inFullTreeBlock(x, y, at) && inForest(x, y, at)) return forestFloor(g, px, py, x, y);
  if (best === 'sand') return sand(g, px, py, x, y);
  if (best === 'cobble') return cobble(g, px, py, x, y);
  if (best === 'path') return path(g, px, py, x, y);
  grass(g, px, py, x, y, at, { edges: false });
}


// Parterre façon Rouge Feu : deux fleurs rouges à cœur jaune et leurs feuilles.
const BLOOM = [
  '..kkk..',
  '.kRRRk.',
  'kRRWRRk',
  'kRYYYRk',
  'kRRYRRk',
  '.kRRRk.',
  'g.kkk.g',
  'gg...gg',
];
// `sway` : décalage des fleurs pour la deuxième image de l'animation (elles se balancent au vent).
function flowerPatch(g, px, py, x, y, sway = 0) {
  const white = hash(x, y, 23) % 5 === 0;
  const pal = white
    ? { k: 0x9098b0, R: 0xf8f8f8, W: 0xffffff, Y: 0xf8d030, g: 0x3c9848 }
    : { k: 0xa01818, R: 0xf04030, W: 0xf8a090, Y: 0xf8d030, g: 0x3c9848 };
  for (const [fx, fy] of [[1, 1], [8, 7]]) sprite(g, BLOOM, pal, px + fx + sway, py + fy);
}

// Deuxième image d'un parterre de fleurs ('f'), fleurs penchées d'un pixel (animation dans MapScene).

// Sol déjà posé par la couche Rouge Feu (voir art/frlgArt.js) : les fonctions de sol (herbe, sable, mer)
// ne dessinent rien, seuls les objets par-dessus sont dessinés.
let groundProvided = false;
export function setGroundProvided(provided) {
  groundProvided = provided;
}

function path(g, px, py, x, y) {
  rect(g, C.path, px, py, S, S);
  const h = hash(x, y);
  rect(g, C.pathDot, px + (h % 13) + 1, py + ((h >> 4) % 13) + 1, 1, 1);
  rect(g, C.pathDot, px + ((h >> 8) % 13) + 1, py + ((h >> 12) % 13) + 1, 2, 1);
}

function grass(g, px, py, x, y, at, { edges = true } = {}) {
  if (groundProvided) return;
  rect(g, C.grass, px, py, S, S);
  const h = hash(x, y, 1);
  // Petites touffes « ᵥᵥ » régulières, comme dans Rouge Feu : une case sur deux, en quinconce.
  if ((x + y) % 2 === 0) {
    const tx = px + 3 + (h % 3) + (y % 2) * 5;
    const ty = py + 5 + ((h >> 4) % 3);
    for (const dx of [0, 4]) {
      rect(g, C.grassTuft, tx + dx, ty, 1, 1);
      rect(g, C.grassTuft, tx + dx + 1, ty + 1, 1, 1);
      rect(g, C.grassTuft, tx + dx + 2, ty, 1, 1);
    }
  }
  if (at(x, y - 1) === 'ĥ') {
    g.fillStyle(0x1c5030, 0.25);                                     // ombre des hautes herbes du dessus
    g.fillRect(px, py, S, 2);
    g.fillStyle(0x1c5030, 0.12);
    g.fillRect(px, py + 2, S, 1);
  }
  if (!edges) return;
  // Liseré clair là où la pelouse touche le chemin.
  const edge = (dx, dy) => {
    const n = at(x + dx, y + dy);
    return n !== undefined && !isGrassy(x + dx, y + dy, at);
  };
  if (edge(0, -1)) { rect(g, C.grassEdge, px, py, S, 1); rect(g, C.grassEdge2, px, py + 1, S, 1); }
  if (edge(0, 1)) { rect(g, C.grassEdge, px, py + S - 1, S, 1); rect(g, C.grassEdge2, px, py + S - 2, S, 1); }
  if (edge(-1, 0)) { rect(g, C.grassEdge, px, py, 1, S); rect(g, C.grassEdge2, px + 1, py, 1, S); }
  if (edge(1, 0)) { rect(g, C.grassEdge, px + S - 1, py, 1, S); rect(g, C.grassEdge2, px + S - 2, py, 1, S); }
}

function water(g, px, py, x, y, at) {
  if (groundProvided) return;                                          // eau Rouge Feu déjà posée
  rect(g, C.water, px, py, S, S);
  rect(g, C.waterDeep, px, py + 7, S, 1);
  rect(g, C.waterDeep, px, py + 15, S, 1);
  const h = hash(x, y, 2);
  rect(g, C.waterWave, px + (h % 8) + 2, py + 3, 4, 1);
  rect(g, C.waterWave, px + ((h >> 5) % 8) + 3, py + 11, 3, 1);
  // Berge en terre sur les bords de l'étang.
  const bank = (dx, dy) => {
    const n = at(x + dx, y + dy);
    return n !== undefined && !['~', 'B', 'k', 'r'].includes(n);
  };
  if (bank(0, -1)) { rect(g, C.rim, px, py, S, 3); rect(g, C.rimLight, px, py, S, 1); }
  if (bank(-1, 0)) { rect(g, C.rim, px, py, 3, S); rect(g, C.rimLight, px, py, 1, S); }
  if (bank(1, 0)) { rect(g, C.rim, px + S - 3, py, 3, S); rect(g, C.rimLight, px + S - 1, py, 1, S); }
  if (bank(0, 1)) { rect(g, C.rim, px, py + S - 3, S, 3); }
}

// Pavés médiévaux : pierres irrégulières, joints sombres.
function cobble(g, px, py, x, y) {
  rect(g, 0x8c8478, px, py, S, S);
  const h = hash(x, y, 5);
  const stones = [
    [0, 0, 7, 5], [8, 0, 8, 5], [0, 6, 5, 5], [6, 6, 6, 5], [13, 6, 3, 5], [0, 12, 8, 4], [9, 12, 7, 4],
  ];
  stones.forEach(([sx, sy, w, hh], i) => {
    const light = (h >> i) & 1 ? 0xb8b0a4 : 0xaaa296;
    rect(g, light, px + sx + 1, py + sy + 1, w - 1, hh - 1);
    rect(g, 0xccc4b8, px + sx + 1, py + sy + 1, w - 1, 1);
  });
}

// Rempart : gros blocs de pierre, créneaux sur le bord tourné vers la ville.
function rampart(g, px, py, x, y, at) {
  rect(g, 0x5c5850, px, py, S, S);
  for (let r = 0; r < 4; r++) {
    const off = r % 2 ? 4 : 0;
    for (let c = -1; c < 3; c++) {
      const bx = c * 8 + off;
      const x0 = Math.max(bx + 1, 0);
      const x1 = Math.min(bx + 8, S);
      if (x1 > x0) {
        rect(g, 0x8c887c, px + x0, py + r * 4 + 1, x1 - x0, 3);
        rect(g, 0xa8a498, px + x0, py + r * 4 + 1, x1 - x0, 1);
      }
    }
  }
  const inside = (dx, dy) => {
    const n = at(x + dx, y + dy);
    return n !== undefined && n !== 'K';
  };
  const merlons = (horizontal, pos) => {
    for (let i = 0; i < S; i += 4) {
      if (horizontal) rect(g, 0x3c3830, px + i, py + pos, 2, 2);
      else rect(g, 0x3c3830, px + pos, py + i, 2, 2);
    }
  };
  if (inside(0, 1)) merlons(true, S - 2);
  if (inside(0, -1)) merlons(true, 0);
  if (inside(1, 0)) merlons(false, S - 2);
  if (inside(-1, 0)) merlons(false, 0);
}

function well(g, px, py, x, y, at) {
  grass(g, px, py, x, y, at);
  rect(g, 0x4c4c54, px + 2, py + 2, 12, 12);
  rect(g, 0x4c4c54, px + 1, py + 4, 14, 8);
  rect(g, 0x9c9ca4, px + 3, py + 3, 10, 10);
  rect(g, 0x9c9ca4, px + 2, py + 5, 12, 6);
  rect(g, 0xc0c0c8, px + 3, py + 3, 10, 1);
  rect(g, 0x2c5cb0, px + 5, py + 5, 6, 6);
  rect(g, 0x5888d8, px + 5, py + 5, 3, 1);
  rect(g, 0x6c4424, px + 1, py + 7, 14, 2);             // poutre du treuil
  rect(g, 0xc8a070, px + 7, py + 6, 2, 4);              // seau
}

// Tonneau en bois vu de trois quarts : couvercle, douves claires et sombres, deux cerclages de fer.
const BARREL = [
  '....kkkkkkkk....',
  '..kkDDDDDDDDkk..',
  '.kDwWWWWWWWWwDk.',
  '.kDWWwWWwWWwWDk.',
  '.kDwWWWWWWWWwDk.',
  '.kkDDDDDDDDDDkk.',
  '.kHHHHHHHHHHHhk.',
  'kLLWWWwWWwWWwDdk',
  'kLLWWWwWWwWWwDdk',
  'kLWWWWwWWwWWwDdk',
  'kHHHHHHHHHHHHhhk',
  'kLWWWWwWWwWWwDdk',
  'kLWWWWwWWwWWwDdk',
  '.kHHHHHHHHHHHhk.',
  '.kkWWWwWWwWWDkk.',
  '...kkkkkkkkkk...',
];
const BARREL_COLORS = {
  k: 0x382818, D: 0x6c4020, w: 0x985c28, W: 0xb87838, L: 0xd8a060, d: 0x54341c, H: 0xb0b0b8, h: 0x707078,
};
function barrel(g, px, py, x, y, at) {
  grass(g, px, py, x, y, at);
  g.fillStyle(0x000000, 0.2);
  g.fillRect(px + 2, py + 15, 13, 1);
  sprite(g, BARREL, BARREL_COLORS, px, py);
}

// Mur d'enceinte en béton, barbelés côté intérieur.
function barracksWall(g, px, py, x, y, at) {
  rect(g, 0x8c8470, px, py, S, S);
  for (let r = 0; r < 2; r++) {
    for (let c = 0; c < 2; c++) {
      const bx = c * 8 + (r ? 4 : 0);
      rect(g, 0xbcb49c, px + (bx % S) + 1, py + r * 8 + 1, Math.min(7, S - (bx % S) - 1), 7);
      rect(g, 0xd0c8b0, px + (bx % S) + 1, py + r * 8 + 1, Math.min(7, S - (bx % S) - 1), 1);
    }
  }
  const inside = (dx, dy) => {
    const n = at(x + dx, y + dy);
    return n !== undefined && n !== 'Z';
  };
  // Barbelés : fil sombre en zigzag le long du bord intérieur
  const wire = (horizontal, pos) => {
    for (let i = 0; i < S; i++) {
      const o = i % 4 < 2 ? 0 : 1;
      if (horizontal) rect(g, 0x3c3c40, px + i, py + pos + o, 1, 1);
      else rect(g, 0x3c3c40, px + pos + o, py + i, 1, 1);
    }
  };
  if (inside(0, 1)) wire(true, S - 3);
  if (inside(0, -1)) wire(true, 1);
  if (inside(1, 0)) wire(false, S - 3);
  if (inside(-1, 0)) wire(false, 1);
}

// Asphalte de la place d'armes, ligne blanche en bordure.
function asphalt(g, px, py, x, y, at) {
  rect(g, 0x6c7074, px, py, S, S);
  const h = hash(x, y, 7);
  rect(g, 0x7c8084, px + (h % 14) + 1, py + ((h >> 4) % 14) + 1, 1, 1);
  rect(g, 0x5c6064, px + ((h >> 8) % 14) + 1, py + ((h >> 12) % 14) + 1, 1, 1);
  const edge = (dx, dy) => {
    const n = at(x + dx, y + dy);
    // Pas de marquage au pied d'un bâtiment (avions, bus…) posé sur l'asphalte.
    return n !== undefined && !['A', 'J', 'Z', 'R', 'W', 'D', 'q'].includes(n);
  };
  if (edge(0, -1)) rect(g, 0xe8e8e0, px, py + 1, S, 1);
  if (edge(0, 1)) rect(g, 0xe8e8e0, px, py + S - 2, S, 1);
  if (edge(-1, 0)) rect(g, 0xe8e8e0, px + 1, py, 1, S);
  if (edge(1, 0)) rect(g, 0xe8e8e0, px + S - 2, py, 1, S);
}

// Mât avec le drapeau tricolore, sur la place d'armes.
function flagpole(g, px, py, x, y, at) {
  // Sur la place d'armes : asphalte ; ailleurs : le sol des voisins (pavés, herbe…).
  if (groundProvided) { /* sol Rouge Feu déjà posé */ }
  else if ([at(x - 1, y), at(x + 1, y), at(x, y - 1), at(x, y + 1)].includes('A')) asphalt(g, px, py, x, y, at);
  else smallObjectGround(g, px, py, x, y, at);
  rect(g, 0x9c9ca4, px + 5, py + 12, 6, 3);            // socle
  rect(g, 0x505058, px + 7, py + 1, 2, 13);            // mât
  rect(g, 0xd8d8e0, px + 7, py + 1, 1, 13);
  rect(g, 0x2848a8, px + 9, py + 2, 2, 6);             // drapeau
  rect(g, 0xf8f8f8, px + 11, py + 2, 2, 6);
  rect(g, 0xd83030, px + 13, py + 2, 2, 6);
}

function sandbags(g, px, py, x, y, at) {
  grass(g, px, py, x, y, at);
  const bag = (bx, by) => {
    rect(g, 0x7c6840, px + bx, py + by, 7, 4);
    rect(g, 0xd0b884, px + bx + 1, py + by, 5, 3);
    rect(g, 0xe0cc9c, px + bx + 1, py + by, 5, 1);
  };
  bag(0, 11); bag(5, 11); bag(10, 11);
  bag(2, 7); bag(8, 7);
  bag(5, 3);
}

function crate(g, px, py, x, y, at) {
  grass(g, px, py, x, y, at);
  rect(g, 0x2c3420, px + 1, py + 2, 14, 13);
  rect(g, 0x5c6c3c, px + 2, py + 3, 12, 11);
  rect(g, 0x7c8c54, px + 2, py + 3, 12, 1);
  rect(g, 0x3c4828, px + 2, py + 8, 12, 1);
  rect(g, 0xd8d0a0, px + 5, py + 5, 6, 2);             // marquage pochoir
  rect(g, 0x000000, px + 2, py + 15, 12, 1);
}

// Rivière (la Garonne) : eau brun-vert, quai de pierre là où elle touche la terre.
function river(g, px, py, x, y, at) {
  rect(g, 0x4a7a8a, px, py, S, S);
  rect(g, 0x3c6878, px, py + 7, S, 1);
  rect(g, 0x3c6878, px, py + 15, S, 1);
  const h = hash(x, y, 8);
  rect(g, 0x7aa4b0, px + (h % 8) + 2, py + 3, 5, 1);
  rect(g, 0x7aa4b0, px + ((h >> 5) % 8) + 3, py + 11, 4, 1);
  const quay = (dx, dy) => {
    const n = at(x + dx, y + dy);
    return n !== undefined && !['G', 'I'].includes(n);
  };
  if (quay(0, -1)) { rect(g, 0xa89c84, px, py, S, 3); rect(g, 0x2c4c58, px, py + 3, S, 1); }
  if (quay(0, 1)) { rect(g, 0xa89c84, px, py + S - 3, S, 3); rect(g, 0x2c4c58, px, py + S - 4, S, 1); }
}

// Pont de pierre (orienté nord-sud) : dalles, parapets côté rivière.
function bridge(g, px, py, x, y, at) {
  rect(g, 0xc8b898, px, py, S, S);
  for (let ly = 3; ly < S; ly += 4) rect(g, 0xb0a080, px, py + ly, S, 1);
  const h = hash(x, y, 9);
  rect(g, 0xb0a080, px + (h % 12) + 2, py + 1, 1, 2);
  const parapet = (side) => {
    const bx = side < 0 ? px : px + S - 3;
    rect(g, 0x8c7c60, bx, py, 3, S);
    rect(g, 0xe0d4b8, bx + (side < 0 ? 0 : 2), py, 1, S);
    for (let ly = 2; ly < S; ly += 6) rect(g, 0x6c5c44, bx, py + ly, 3, 1);
  };
  if (at(x - 1, y) === 'G') parapet(-1);
  if (at(x + 1, y) === 'G') parapet(1);
}

// Sol sous un petit objet : herbe si la majorité des voisins en est, sinon pavés.
// Sol d'un petit objet : 'grass', 'sand' ou 'cobble' selon ses voisins.
function objectGround(x, y, at) {
  const around = [at(x, y - 1), at(x, y + 1), at(x - 1, y), at(x + 1, y)].filter(Boolean);
  if (objectOnGrass(x, y, at)) return 'grass';
  if (around.filter((c) => ['s', '^'].includes(c)).length * 2 >= around.length) return 'sand';
  if (around.filter((c) => c === 'ē').length * 2 >= around.length) return 'earth';
  return 'cobble';
}

function smallObjectGround(g, px, py, x, y, at) {
  if (groundProvided) return;
  const ground = objectGround(x, y, at);
  if (ground === 'grass') grass(g, px, py, x, y, at);
  else if (ground === 'sand') sand(g, px, py, x, y);
  else if (ground === 'earth') redEarth(g, px, py, x, y);
  else cobble(g, px, py, x, y);
}

// Cabine téléphonique rouge anglaise (vue de dessus, un peu de face).
function phoneBooth(g, px, py, x, y, at) {
  // Cabine crème de Hull (la ville a son propre réseau téléphonique : ses cabines ne sont pas rouges).
  smallObjectGround(g, px, py, x, y, at);
  rect(g, 0x000000, px + 3, py + 15, 10, 1);
  rect(g, 0x6c6450, px + 3, py + 1, 10, 14);
  rect(g, 0xece4c8, px + 4, py + 2, 8, 12);
  rect(g, 0xfcf8e8, px + 4, py + 2, 8, 1);
  rect(g, 0x283c6c, px + 5, py + 3, 6, 1);           // bandeau « TELEPHONE »
  rect(g, 0xb8d8f0, px + 5, py + 5, 6, 7);           // vitres
  for (const ly of [7, 9]) rect(g, 0xece4c8, px + 5, py + ly, 6, 1);
  rect(g, 0xece4c8, px + 7, py + 5, 1, 7);
}

// Mât avec l'Union Jack (drapeau britannique simplifié).
function unionJack(g, px, py, x, y, at) {
  smallObjectGround(g, px, py, x, y, at);
  rect(g, 0x9c9ca4, px + 5, py + 13, 5, 2);
  rect(g, 0x505058, px + 6, py + 1, 2, 13);
  const fx = px + 8;
  const fy = py + 1;
  rect(g, 0x283c8c, fx, fy, 8, 6);
  for (let i = 0; i < 6; i++) {                     // diagonales blanches
    rect(g, 0xf8f8f8, fx + Math.round(i * 8 / 6), fy + i, 1, 1);
    rect(g, 0xf8f8f8, fx + 7 - Math.round(i * 8 / 6), fy + i, 1, 1);
  }
  rect(g, 0xf8f8f8, fx, fy + 2, 8, 2);              // croix blanche
  rect(g, 0xf8f8f8, fx + 3, fy, 2, 6);
  rect(g, 0xd02030, fx, fy + 2, 8, 1);              // croix rouge
  rect(g, 0xd02030, fx + 3, fy, 1, 6);
}

// Réverbère victorien noir.
function lamppost(g, px, py, x, y, at) {
  smallObjectGround(g, px, py, x, y, at);
  rect(g, 0x000000, px + 6, py + 15, 4, 1);
  rect(g, 0x202020, px + 6, py + 12, 4, 3);
  rect(g, 0x202020, px + 7, py + 5, 2, 8);
  rect(g, 0x202020, px + 5, py + 1, 6, 5);
  rect(g, 0xf8e088, px + 6, py + 2, 4, 3);
  rect(g, 0x202020, px + 7, py, 2, 1);
}

// Touffe de bambous : tiges vertes à nœuds, quelques feuilles.
function bamboo(g, px, py, x, y, at) {
  grass(g, px, py, x, y, at);
  rect(g, 0x000000, px + 2, py + 15, 12, 1);
  const h = hash(x, y, 10);
  [[2, 0x4c8c2c], [6, 0x6cac3c], [10, 0x5c9c34], [13, 0x7cbc4c]].forEach(([sx, col], i) => {
    const top = 1 + ((h >> (i * 2)) % 4);
    rect(g, col, px + sx, py + top, 2, 15 - top);
    for (let ny = top + 3; ny < 15; ny += 4) rect(g, 0x2c5c1c, px + sx, py + ny, 2, 1);
    rect(g, 0x8ccc5c, px + sx + 2, py + top + 1, 2, 1);
    rect(g, 0x8ccc5c, px + sx - 2, py + top + 3, 2, 1);
  });
}

// Lanterne rouge vietnamienne sur un poteau.
function lantern(g, px, py, x, y, at) {
  smallObjectGround(g, px, py, x, y, at);
  rect(g, 0x000000, px + 6, py + 15, 4, 1);
  rect(g, 0x5c3418, px + 7, py + 2, 2, 13);
  rect(g, 0x5c3418, px + 7, py + 2, 5, 1);
  rect(g, 0x901810, px + 9, py + 4, 6, 7);
  rect(g, 0xd83028, px + 10, py + 3, 4, 9);
  rect(g, 0xf05040, px + 10, py + 4, 1, 6);
  rect(g, 0xe8c040, px + 10, py + 3, 4, 1);
  rect(g, 0xe8c040, px + 10, py + 11, 4, 1);
  rect(g, 0xe8c040, px + 11, py + 12, 2, 2);        // pompon
}

// Drapeau vietnamien : fond rouge, étoile jaune.
function vietnamFlag(g, px, py, x, y, at) {
  smallObjectGround(g, px, py, x, y, at);
  rect(g, 0x9c9ca4, px + 3, py + 13, 5, 2);
  rect(g, 0x505058, px + 4, py + 1, 2, 13);
  rect(g, 0xd82820, px + 6, py + 1, 10, 7);
  rect(g, 0xf8d830, px + 10, py + 2, 2, 5);          // étoile
  rect(g, 0xf8d830, px + 8, py + 4, 6, 1);
  rect(g, 0xf8d830, px + 9, py + 5, 4, 1);
  rect(g, 0xf8d830, px + 9, py + 6, 1, 1);
  rect(g, 0xf8d830, px + 12, py + 6, 1, 1);
}

// Lotus sur l'eau du lac.
function lotus(g, px, py, x, y, at) {
  water(g, px, py, x, y, at);
  rect(g, 0x2c7c3c, px + 2, py + 5, 11, 8);
  rect(g, 0x2c7c3c, px + 3, py + 4, 9, 10);
  rect(g, 0x4ca85c, px + 3, py + 5, 9, 8);
  rect(g, 0x4888e8, px + 7, py + 9, 5, 1);           // encoche de la feuille
  rect(g, 0xf8a8c8, px + 5, py + 6, 5, 3);           // fleur
  rect(g, 0xf8d0e0, px + 6, py + 5, 3, 1);
  rect(g, 0xe86898, px + 7, py + 7, 1, 1);
}

// Pont rouge (façon pont Thê Húc) : planches rouges, rambardes sur les côtés côté eau.
function redBridge(g, px, py, x, y, at) {
  rect(g, 0xa82018, px, py, S, S);
  for (let ly = 1; ly < S; ly += 4) rect(g, 0xd83828, px + 2, py + ly, S - 4, 3);
  const water = (dx) => ['~', 'k'].includes(at(x + dx, y));
  if (water(-1)) { rect(g, 0x701008, px, py, 2, S); rect(g, 0xe8c040, px, py + 7, 2, 2); }
  if (water(1)) { rect(g, 0x701008, px + S - 2, py, 2, S); rect(g, 0xe8c040, px + S - 2, py + 7, 2, 2); }
}

// Stand de cuisine de rue vu de dessus : parasol rond rouge et jaune.
function foodStall(g, px, py, x, y, at) {
  smallObjectGround(g, px, py, x, y, at);
  rect(g, 0x6c4424, px + 1, py + 11, 14, 4);         // chariot
  rect(g, 0x8c5c2c, px + 2, py + 11, 12, 3);
  rect(g, 0x000000, px + 3, py + 15, 10, 1);
  rect(g, 0xa82018, px + 2, py + 1, 12, 10);
  rect(g, 0xa82018, px + 1, py + 3, 14, 6);
  rect(g, 0xd83828, px + 3, py + 2, 10, 8);
  rect(g, 0xd83828, px + 2, py + 4, 12, 4);
  rect(g, 0xf0c840, px + 7, py + 2, 2, 8);
  rect(g, 0xf0c840, px + 3, py + 5, 10, 2);
  rect(g, 0xf8e8a0, px + 7, py + 5, 2, 2);
}

// Scooter garé, vu de dessus.
function scooter(g, px, py, x, y, at) {
  smallObjectGround(g, px, py, x, y, at);
  rect(g, 0x000000, px + 5, py + 2, 6, 13);
  rect(g, 0x202020, px + 6, py + 1, 4, 3);            // roue avant
  rect(g, 0x202020, px + 6, py + 12, 4, 3);           // roue arrière
  rect(g, 0x3c6cb0, px + 5, py + 4, 6, 9);
  rect(g, 0x6c9cd8, px + 6, py + 4, 4, 1);
  rect(g, 0x5c3418, px + 6, py + 8, 4, 4);            // selle
  rect(g, 0x9c9ca4, px + 3, py + 4, 10, 1);           // guidon
}

// Vélos garés (deux, vus de dessus).
function bicycles(g, px, py, x, y, at) {
  smallObjectGround(g, px, py, x, y, at);
  const bike = (bx, color) => {
    rect(g, 0x202020, px + bx, py + 1, 3, 4);           // roue avant
    rect(g, 0x202020, px + bx, py + 11, 3, 4);          // roue arrière
    rect(g, color, px + bx + 1, py + 4, 1, 8);          // cadre
    rect(g, 0x404040, px + bx - 1, py + 4, 5, 1);       // guidon
    rect(g, 0x5c3418, px + bx, py + 9, 3, 2);           // selle
  };
  bike(3, 0x2848a8);
  bike(10, 0xc82828);
}

// Tulipes néerlandaises : rangées de fleurs colorées sur l'herbe.
function tulips(g, px, py, x, y, at) {
  grass(g, px, py, x, y, at);
  const colors = [0xe83848, 0xf8c830, 0xf070b0, 0xf08030];
  const h = hash(x, y, 11);
  for (let i = 0; i < 6; i++) {
    const tx = px + 1 + (i % 3) * 5;
    const ty = py + 2 + Math.floor(i / 3) * 7;
    const col = colors[(h + i) % colors.length];
    rect(g, 0x2c7c3c, tx + 1, ty + 3, 1, 3);            // tige
    rect(g, 0x3c9c4c, tx + 2, ty + 4, 1, 2);            // feuille
    rect(g, col, tx, ty, 3, 3);                         // fleur
    rect(g, col, tx, ty - 1, 1, 1);
    rect(g, col, tx + 2, ty - 1, 1, 1);
  }
}

// Drapeau néerlandais : rouge, blanc, bleu.
function dutchFlag(g, px, py, x, y, at) {
  smallObjectGround(g, px, py, x, y, at);
  rect(g, 0x9c9ca4, px + 3, py + 13, 5, 2);
  rect(g, 0x505058, px + 4, py + 1, 2, 13);
  rect(g, 0xc82830, px + 6, py + 1, 10, 2);
  rect(g, 0xf8f8f8, px + 6, py + 3, 10, 2);
  rect(g, 0x2848a8, px + 6, py + 5, 10, 2);
}

// Vache sacrée (vue de dessus, un peu de côté).
function cow(g, px, py, x, y, at) {
  smallObjectGround(g, px, py, x, y, at);
  rect(g, 0x000000, px + 2, py + 14, 12, 1);
  rect(g, 0x9c9488, px + 2, py + 5, 11, 7);
  rect(g, 0xf0ece0, px + 3, py + 5, 9, 6);           // corps clair
  rect(g, 0xc8c0b0, px + 3, py + 10, 9, 1);
  rect(g, 0x9c9488, px + 11, py + 3, 4, 5);           // tête
  rect(g, 0xf0ece0, px + 12, py + 4, 3, 3);
  rect(g, 0xe0c080, px + 11, py + 2, 1, 2);           // cornes
  rect(g, 0xe0c080, px + 14, py + 2, 1, 2);
  rect(g, 0xe88030, px + 11, py + 7, 4, 1);           // collier de soucis
  for (const lx of [3, 5, 9, 11]) rect(g, 0x6c6458, px + lx, py + 11, 1, 3);   // pattes
  rect(g, 0x6c6458, px + 1, py + 6, 1, 4);            // queue
}

// Tuk-tuk (rickshaw motorisé) vert et jaune, vu de dessus.
function tukTuk(g, px, py, x, y, at) {
  smallObjectGround(g, px, py, x, y, at);
  rect(g, 0x000000, px + 3, py + 14, 10, 1);
  rect(g, 0x202020, px + 7, py + 1, 2, 2);            // roue avant
  rect(g, 0x202020, px + 2, py + 11, 2, 3);           // roues arrière
  rect(g, 0x202020, px + 12, py + 11, 2, 3);
  rect(g, 0x1c6c34, px + 3, py + 3, 10, 10);
  rect(g, 0x2c9c4c, px + 4, py + 4, 8, 8);            // toit vert
  rect(g, 0xf0c830, px + 4, py + 9, 8, 3);            // arrière jaune
  rect(g, 0x9cc8e0, px + 5, py + 3, 6, 1);            // pare-brise
}

// Drapeau indien : safran, blanc, vert, roue bleue au centre.
function indianFlag(g, px, py, x, y, at) {
  smallObjectGround(g, px, py, x, y, at);
  rect(g, 0x9c9ca4, px + 3, py + 13, 5, 2);
  rect(g, 0x505058, px + 4, py + 1, 2, 13);
  rect(g, 0xf09030, px + 6, py + 1, 10, 2);
  rect(g, 0xf8f8f8, px + 6, py + 3, 10, 2);
  rect(g, 0x2c8c3c, px + 6, py + 5, 10, 2);
  rect(g, 0x283c8c, px + 10, py + 3, 2, 2);           // chakra
}

// Parterre de soucis (fleurs orange et jaunes).
function marigolds(g, px, py, x, y, at) {
  grass(g, px, py, x, y, at);
  const h = hash(x, y, 12);
  for (let i = 0; i < 7; i++) {
    const fx = px + 1 + ((h >> (i * 3)) % 12);
    const fy = py + 1 + ((h >> (i * 3 + 1)) % 12);
    const col = i % 2 ? 0xf0a020 : 0xe86818;
    rect(g, 0x2c7c3c, fx + 1, fy + 2, 1, 2);
    rect(g, col, fx, fy, 3, 3);
    rect(g, 0xf8d860, fx + 1, fy + 1, 1, 1);
  }
}

// Stand d'épices : auvent rayé, paniers de poudres colorées.
function spiceStall(g, px, py, x, y, at) {
  smallObjectGround(g, px, py, x, y, at);
  for (let i = 0; i < 16; i += 4) rect(g, i % 8 ? 0xf0c830 : 0xd83028, px + i, py + 1, 4, 5);
  rect(g, 0x6c4424, px + 1, py + 6, 14, 9);
  rect(g, 0x8c5c2c, px + 2, py + 7, 12, 7);
  const spices = [0xe8a020, 0xc83818, 0x8c2c18, 0x6c8c2c, 0xe8d040, 0xb85c20];
  spices.forEach((col, i) => {
    const sx = px + 3 + (i % 3) * 4;
    const sy = py + 8 + Math.floor(i / 3) * 3;
    rect(g, col, sx, sy, 3, 2);
  });
}

// Ordinateur posé sur un bureau (intérieur).
function computer(g, px, py, x) {
  furniture(g, px, py, x);
  rect(g, 0x202428, px + 3, py + 2, 10, 8);           // écran
  rect(g, 0x5ca0e0, px + 4, py + 3, 8, 6);
  rect(g, 0xf8f8f8, px + 5, py + 4, 5, 1);            // mail
  rect(g, 0xf8f8f8, px + 5, py + 6, 4, 1);
  rect(g, 0x202428, px + 7, py + 10, 2, 2);
  rect(g, 0x9ca0a8, px + 4, py + 12, 8, 2);           // clavier
}

// Dune de sable : bosse dorée avec rides et ombre.
function dune(g, px, py, x, y, at) {
  sand(g, px, py, x, y);
  const h = hash(x, y, 13);
  const top = 2 + (h % 4);
  rect(g, 0xc89850, px, py + top + 6, S, S - top - 6);
  rect(g, 0xe8c888, px + 1, py + top, 14, 8);
  rect(g, 0xe8c888, px + 3, py + top - 2, 10, 2);
  rect(g, 0xf8e0a8, px + 4, py + top - 1, 6, 1);
  rect(g, 0xd8b068, px + 2, py + top + 4, 10, 1);        // rides
  rect(g, 0xd8b068, px + 5, py + top + 7, 8, 1);
  rect(g, 0xb08040, px + 9, py + top + 1, 5, 7);         // versant à l'ombre
}

// Chameau (vu de côté, un peu de dessus).
function camel(g, px, py, x, y, at) {
  smallObjectGround(g, px, py, x, y, at);
  const body = 0xc89858;
  const dark = 0x8c6430;
  rect(g, 0x000000, px + 2, py + 15, 12, 1);
  rect(g, dark, px + 3, py + 6, 9, 5);
  rect(g, body, px + 3, py + 6, 9, 4);
  rect(g, body, px + 5, py + 3, 4, 3);                    // bosse
  rect(g, 0xe0b878, px + 6, py + 3, 2, 1);
  rect(g, body, px + 11, py + 2, 2, 6);                   // cou
  rect(g, body, px + 12, py + 1, 3, 2);                   // tête
  rect(g, 0x202020, px + 13, py + 1, 1, 1);
  rect(g, 0xd83028, px + 5, py + 6, 4, 2);                // tapis de selle
  rect(g, 0xf0c830, px + 5, py + 8, 4, 1);
  for (const lx of [4, 6, 9, 11]) rect(g, dark, px + lx, py + 10, 1, 5);   // pattes
}

// Petit serpent enroulé sur le sable.
function snake(g, px, py, x, y, at) {
  smallObjectGround(g, px, py, x, y, at);
  const c = 0x6c8c2c;
  const d = 0x3c5c18;
  rect(g, d, px + 3, py + 8, 9, 5);
  rect(g, c, px + 4, py + 9, 7, 3);
  rect(g, 0xa8c858, px + 5, py + 9, 2, 1);
  rect(g, d, px + 5, py + 6, 5, 3);
  rect(g, c, px + 6, py + 7, 3, 1);
  rect(g, c, px + 11, py + 5, 3, 3);                      // tête dressée
  rect(g, c, px + 10, py + 7, 2, 3);
  rect(g, 0x202020, px + 13, py + 5, 1, 1);
  rect(g, 0xd83028, px + 14, py + 7, 1, 1);               // langue
}

// Cactus.
function cactus(g, px, py, x, y, at) {
  smallObjectGround(g, px, py, x, y, at);
  const c = 0x4c8c3c;
  const d = 0x2c5c24;
  rect(g, 0x000000, px + 5, py + 15, 6, 1);
  rect(g, d, px + 6, py + 2, 4, 13);
  rect(g, c, px + 7, py + 2, 2, 13);
  rect(g, d, px + 2, py + 6, 4, 2);
  rect(g, d, px + 2, py + 3, 2, 4);
  rect(g, c, px + 3, py + 3, 1, 4);
  rect(g, d, px + 10, py + 8, 4, 2);
  rect(g, d, px + 12, py + 5, 2, 4);
  rect(g, c, px + 12, py + 5, 1, 4);
  rect(g, 0xf8c8d8, px + 7, py + 1, 2, 1);                // petite fleur
}

// Feu de camp : pierres, bûches, flammes.
function campfire(g, px, py, x, y, at) {
  smallObjectGround(g, px, py, x, y, at);
  for (const [sx, sy] of [[3, 10], [6, 12], [10, 12], [12, 9], [4, 7], [11, 6]]) rect(g, 0x8c8c84, px + sx, py + sy, 2, 2);
  rect(g, 0x6c4424, px + 4, py + 10, 8, 2);
  rect(g, 0x6c4424, px + 6, py + 8, 2, 5);
  rect(g, 0xd83818, px + 5, py + 4, 6, 6);
  rect(g, 0xf08020, px + 6, py + 3, 4, 6);
  rect(g, 0xf8d040, px + 7, py + 5, 2, 4);
}

// Aéroport : sol clair brillant, baies vitrées, comptoir, sièges, tableau des départs.
function terminalFloor(g, px, py, x, y) {
  rect(g, 0xe0e4e8, px, py, S, S);
  rect(g, 0xc8ccd4, px, py + S - 1, S, 1);
  rect(g, 0xc8ccd4, px + S - 1, py, 1, S);
  if ((x + y) % 2) rect(g, 0xf0f2f4, px + 2, py + 2, 5, 2);
}

function glassWall(g, px, py) {
  rect(g, 0x9cc8e8, px, py, S, S);
  rect(g, 0xc8e4f8, px + 2, py + 2, 4, 10);
  rect(g, 0x5c6c7c, px, py, S, 2);
  rect(g, 0x5c6c7c, px, py + S - 2, S, 2);
  rect(g, 0x5c6c7c, px + S - 1, py, 1, S);
}

function checkinCounter(g, px, py, x, y) {
  terminalFloor(g, px, py, x, y);
  rect(g, 0x283048, px, py + 3, S, 12);
  rect(g, 0x4c5c7c, px, py + 4, S, 10);
  rect(g, 0xd0d8e8, px, py + 3, S, 2);
  rect(g, 0x202428, px + 5, py + 5, 6, 4);                // écran
  rect(g, 0x5ca0e0, px + 6, py + 6, 4, 2);
}

function seats(g, px, py, x, y) {
  terminalFloor(g, px, py, x, y);
  rect(g, 0x505860, px, py + 12, S, 2);
  for (let i = 0; i < S; i += 5) {
    rect(g, 0x1c4c8c, px + i, py + 3, 4, 9);
    rect(g, 0x2c6cb0, px + i, py + 4, 4, 5);
  }
}

function departuresBoard(g, px, py, x, y) {
  terminalFloor(g, px, py, x, y);
  rect(g, 0x505860, px + 7, py + 11, 2, 5);
  rect(g, 0x101418, px, py + 1, S, 11);
  for (let ly = 3; ly < 11; ly += 2) {
    rect(g, 0xf8c830, px + 1, py + ly, 7, 1);
    rect(g, 0x60d060, px + 10, py + ly, 4, 1);
  }
}

// Terrasse de café parisien : petite table ronde et deux chaises en rotin.
function cafeTable(g, px, py, x, y, at) {
  smallObjectGround(g, px, py, x, y, at);
  rect(g, 0x000000, px + 4, py + 14, 8, 1);
  rect(g, 0x8c5c2c, px + 1, py + 5, 3, 7);               // chaise gauche
  rect(g, 0xc8a060, px + 1, py + 5, 3, 2);
  rect(g, 0x8c5c2c, px + 12, py + 5, 3, 7);              // chaise droite
  rect(g, 0xc8a060, px + 12, py + 5, 3, 2);
  rect(g, 0x404048, px + 7, py + 8, 2, 6);               // pied
  rect(g, 0x303038, px + 4, py + 5, 8, 4);               // plateau
  rect(g, 0xd8d8e0, px + 5, py + 5, 6, 3);
  rect(g, 0xf8f8f8, px + 6, py + 5, 2, 2);               // tasse
}

// Bouche de métro parisien (style Guimard) : rambarde verte, panneau « M ».
function metroEntrance(g, px, py, x, y, at) {
  smallObjectGround(g, px, py, x, y, at);
  rect(g, 0x1c3c24, px + 1, py + 6, 14, 9);
  rect(g, 0x404448, px + 3, py + 8, 10, 7);              // escalier
  for (let ly = 9; ly < 15; ly += 2) rect(g, 0x606468, px + 3, py + ly, 10, 1);
  rect(g, 0x2c6c3c, px + 1, py + 2, 2, 12);              // poteaux
  rect(g, 0x2c6c3c, px + 13, py + 2, 2, 12);
  rect(g, 0xf0c830, px, py, 4, 3);                       // lanternes
  rect(g, 0xf0c830, px + 12, py, 4, 3);
  rect(g, 0x2c6c3c, px + 4, py + 1, 8, 5);               // panneau
  rect(g, 0xf8f0d0, px + 6, py + 2, 1, 3);
  rect(g, 0xf8f0d0, px + 9, py + 2, 1, 3);
  rect(g, 0xf8f0d0, px + 7, py + 3, 2, 1);
}

// Podium de remise des diplômes (intérieur du stade) : estrade dorée à marches.
function podium(g, px, py, x, y, at) {
  rect(g, 0x8c6418, px, py, S, S);
  rect(g, 0xd8b040, px + 1, py + 1, S - 2, S - 2);
  rect(g, 0xf0d070, px + 1, py + 1, S - 2, 2);
  rect(g, 0xb08828, px + 1, py + 10, S - 2, 1);
  if (at(x, y - 1) !== '+') rect(g, 0xc82838, px, py, S, 3);   // tapis rouge en haut
}

// Panneau routier « Aéroport » : panneau bleu, avion blanc, flèche vers la sortie.
function airportSign(g, px, py, x, y, at, toRight) {
  smallObjectGround(g, px, py, x, y, at);
  rect(g, 0x000000, px + 6, py + 15, 4, 1);
  rect(g, 0x707078, px + 7, py + 8, 2, 7);               // poteau
  rect(g, 0xf4f4f4, px + 1, py + 1, 14, 9);              // bord blanc
  rect(g, 0x2c5cb0, px + 2, py + 2, 12, 7);
  const ax = toRight ? px + 3 : px + 8;                  // avion
  rect(g, 0xf4f4f4, ax, py + 5, 5, 1);
  rect(g, 0xf4f4f4, ax + 2, py + 3, 1, 5);
  rect(g, 0xf4f4f4, toRight ? ax : ax + 4, py + 4, 1, 3);
  const fx = toRight ? px + 10 : px + 3;                 // flèche
  rect(g, 0xf8d030, fx, py + 5, 3, 1);
  rect(g, 0xf8d030, toRight ? fx + 2 : fx, py + 4, 1, 3);
}

// Portes d'ascenseur en inox, avec les boutons d'appel.
function elevator(g, px, py, x, y, at) {
  innerWall(g, px, py, x, y, at);
  rect(g, 0x5c6068, px + 1, py + 1, 14, 15);
  rect(g, 0xb8c0c8, px + 2, py + 2, 12, 14);
  rect(g, 0x8c949c, px + 7, py + 2, 2, 14);               // jointure des portes
  rect(g, 0xd8e0e8, px + 3, py + 3, 2, 12);
  rect(g, 0x202428, px + 4, py, 8, 2);                    // affichage de l'étage
  rect(g, 0xf8a030, px + 7, py, 2, 1);
}

// Falaise : roche grise stratifiée, herbe au sommet si la terre est au-dessus... ou mer en contrebas.
function cliff(g, px, py, x, y, at) {
  rect(g, 0x6c6458, px, py, S, S);
  for (let ly = 2; ly < S; ly += 4) {
    rect(g, 0x9c9484, px, py + ly, S, 2);
    rect(g, 0xb8b0a0, px + ((x * 5 + ly) % 8), py + ly, 5, 1);
  }
  if (GRASSY.has(at(x, y + 1)) || at(x, y + 1) === 'P') {   // bord herbeux côté terre
    rect(g, 0x5ca848, px, py + S - 3, S, 3);
    for (let i = 1; i < S; i += 4) rect(g, 0x3c8c3c, px + i, py + S - 5, 2, 2);
  }
  if (['w', 's'].includes(at(x, y - 1))) rect(g, 0xf0f8ff, px, py, S, 1);   // écume au pied
}

// Borne du Chemin de Saint-Jacques : pierre avec la coquille jaune sur fond bleu.
function caminoMarker(g, px, py, x, y, at) {
  smallObjectGround(g, px, py, x, y, at);
  rect(g, 0x000000, px + 4, py + 15, 8, 1);
  rect(g, 0x8c8474, px + 4, py + 3, 8, 12);
  rect(g, 0xc8c0b0, px + 5, py + 4, 6, 10);
  rect(g, 0x2c5cb0, px + 5, py + 4, 6, 6);
  rect(g, 0xf0c830, px + 6, py + 5, 4, 1);             // coquille
  rect(g, 0xf0c830, px + 6, py + 6, 1, 3);
  rect(g, 0xf0c830, px + 8, py + 6, 1, 3);
  rect(g, 0xf0c830, px + 7, py + 8, 1, 1);
  rect(g, 0xf0c830, px + 6, py + 11, 4, 1);            // flèche jaune
}

// Rocher de montagne (Corse).
function mountainRock(g, px, py, x, y, at) {
  grass(g, px, py, x, y, at);
  const h = hash(x, y, 14);
  const top = 1 + (h % 3);
  rect(g, 0x4c4c48, px + 1, py + top + 2, 14, 13 - top);
  rect(g, 0x8c8c84, px + 2, py + top + 2, 12, 11 - top);
  rect(g, 0x8c8c84, px + 4, py + top, 8, 2);
  rect(g, 0xb8b8b0, px + 4, py + top, 4, 3);
  rect(g, 0x6c6c64, px + 9, py + top + 3, 4, 8);
}

// Maquis corse : buissons denses vert sombre, fleurs de ciste.
function maquis(g, px, py, x, y, at) {
  grass(g, px, py, x, y, at);
  const h = hash(x, y, 15);
  for (const [bx, by, r] of [[1, 6, 7], [7, 2, 8], [8, 8, 7]]) {
    rect(g, 0x2c4c1c, px + bx, py + by, r, r);
    rect(g, 0x4c6c2c, px + bx + 1, py + by + 1, r - 2, r - 2);
    rect(g, 0x6c8c3c, px + bx + 1, py + by + 1, 2, 1);
  }
  if (h % 2) rect(g, 0xf8e0f0, px + 4 + (h % 6), py + 4, 2, 2);
}

// Chèvre corse.
function goat(g, px, py, x, y, at) {
  smallObjectGround(g, px, py, x, y, at);
  rect(g, 0x000000, px + 3, py + 14, 10, 1);
  rect(g, 0x6c5c4c, px + 3, py + 6, 9, 5);
  rect(g, 0xe8e0d0, px + 3, py + 6, 9, 4);
  rect(g, 0x6c5c4c, px + 11, py + 3, 3, 5);            // tête
  rect(g, 0xe8e0d0, px + 12, py + 4, 2, 3);
  rect(g, 0x3c3428, px + 11, py + 2, 1, 2);            // cornes
  rect(g, 0x3c3428, px + 13, py + 2, 1, 2);
  for (const lx of [4, 6, 9, 11]) rect(g, 0x5c4c3c, px + lx, py + 10, 1, 4);
}

// Rizière en terrasse de Bali : eau verte, jeunes pousses alignées, muret.
function ricePaddy(g, px, py, x, y) {
  rect(g, 0x5ca848, px, py, S, S);
  rect(g, 0x7cc0a0, px + 1, py + 1, S - 2, S - 4);
  for (let ly = 3; ly < S - 3; ly += 3) {
    for (let lx = 2 + ((y + ly) % 2) * 2; lx < S - 1; lx += 4) rect(g, 0x3c9c3c, px + lx, py + ly, 1, 2);
  }
  rect(g, 0x6c5c30, px, py + S - 3, S, 3);             // muret de terre
  rect(g, 0x8c7c48, px, py + S - 3, S, 1);
}

// Terre rouge du Sri Lanka.
function redEarth(g, px, py, x, y) {
  rect(g, 0xc07048, px, py, S, S);
  const h = hash(x, y, 16);
  rect(g, 0xa85c38, px + (h % 13) + 1, py + ((h >> 4) % 13) + 1, 2, 1);
  rect(g, 0xd88c60, px + ((h >> 8) % 13) + 1, py + ((h >> 12) % 13) + 1, 1, 1);
  rect(g, 0xa85c38, px + ((h >> 16) % 13) + 1, py + ((h >> 20) % 13) + 1, 1, 1);
}

// Théier (plantation du Sri Lanka) : buisson taillé arrondi, vert vif.
function teaBush(g, px, py, x, y, at) {
  grass(g, px, py, x, y, at);
  rect(g, 0x1c5c24, px + 1, py + 5, 14, 9);
  rect(g, 0x3c8c3c, px + 2, py + 5, 12, 7);
  rect(g, 0x6cbc5c, px + 3, py + 5, 8, 2);
  rect(g, 0x9cdc7c, px + 4 + (x % 3) * 2, py + 6, 2, 1);
}

// Éléphant d'Asie (vu de côté).
function elephant(g, px, py, x, y, at) {
  smallObjectGround(g, px, py, x, y, at);
  const body = 0x8c8c94;
  rect(g, 0x000000, px + 1, py + 15, 14, 1);
  rect(g, 0x5c5c64, px + 2, py + 4, 11, 8);
  rect(g, body, px + 3, py + 4, 9, 7);
  rect(g, 0xa8a8b0, px + 4, py + 4, 5, 2);
  rect(g, body, px + 11, py + 3, 4, 6);                // tête
  rect(g, 0x6c6c74, px + 10, py + 4, 2, 4);            // oreille
  rect(g, body, px + 14, py + 8, 1, 5);                // trompe
  rect(g, 0xf4f0e0, px + 13, py + 8, 1, 2);            // défense
  rect(g, 0x202020, px + 12, py + 5, 1, 1);
  rect(g, 0xd83028, px + 5, py + 3, 5, 2);             // tapis cérémoniel
  rect(g, 0xf0c830, px + 5, py + 5, 5, 1);
  for (const lx of [3, 5, 9, 11]) rect(g, 0x5c5c64, px + lx, py + 11, 2, 4);
}

// Drapeau thaï : rouge, blanc, bleu (large), blanc, rouge.
// Drapeau de la Martinique : sol seulement, le mât et le drapeau sont un objet haut (voir TALL_KINDS).
function martiniqueFlag(g, px, py, x, y, at) {
  smallObjectGround(g, px, py, x, y, at);
}

// Mât du drapeau de la Martinique, haut comme la maison (image de 26 x 77, pied au bas de sa case), dessiné
// comme les objets de Rouge Feu : contour sombre continu, lumière venant du haut à gauche, trois tons par
// couleur (palette adoucie de la GBA), ombre ovale au sol. Mât fin à reflet, pommeau doré, socle de pierre.
// Le drapeau (19 x 12 : triangle rouge au mât, bande verte en haut, noire en bas) flotte au vent : une vague
// douce (±1 px) part du mât vers le bout ; `frame` (0 à 3) la fait avancer. Bosses éclairées, creux ombrés.
const MQ_FLAG_W = 19;
const MQ_FLAG_H = 12;
export const MQ_FLAG_FRAMES = 4;
const MQ_OUTLINE = 0x303038;
const MQ_COLORS = {                                                  // creux, face, bosse
  red: [0xb03030, 0xe04848, 0xf08878],
  green: [0x287848, 0x48a860, 0x88d088],
  black: [0x282830, 0x404048, 0x686870],
};

function tallMartiniqueFlag(g, px, py, frame = 0) {
  const R = (c, x, y, w, h) => rect(g, c, px + x, py + y, w, h);
  // Ombre ovale au sol, comme sous les objets du jeu.
  g.fillStyle(0x000000, 0.2);
  g.fillRect(px + 1, py + 74, 10, 2);
  g.fillRect(px + 2, py + 73, 8, 1);
  // Socle de pierre (contour, dessus clair, face ombrée).
  R(MQ_OUTLINE, 0, 67, 9, 8);
  R(0xd8d8e0, 1, 68, 7, 2);
  R(0xa8a8b8, 1, 70, 7, 4);
  R(0xf0f0f8, 1, 68, 2, 1);
  // Mât : contour, reflet blanc, ton moyen.
  R(MQ_OUTLINE, 3, 4, 3, 64);
  R(0xf0f0f8, 4, 4, 1, 63);
  R(0xb8c0d0, 4, 40, 1, 27);                                         // plus sombre vers le bas
  // Pommeau doré.
  R(MQ_OUTLINE, 3, 0, 3, 1);
  R(MQ_OUTLINE, 2, 1, 5, 3);
  R(0xe0b030, 3, 1, 3, 3);
  R(0xf8e080, 3, 1, 1, 2);
  R(0xb07818, 5, 3, 1, 1);

  const phase = (frame * Math.PI) / 2;
  const fx = 6;
  const fy = 6;
  const half = (MQ_FLAG_H - 1) / 2;
  let prev = 0;
  for (let c = 0; c < MQ_FLAG_W; c++) {
    const angle = c * 0.6 - phase;
    const dy = c < 3 ? 0 : Math.round(Math.sin(angle));            // accroché au mât, ondule ensuite
    const slope = c < 3 ? 0 : Math.cos(angle);
    const tone = slope < -0.5 ? 0 : slope > 0.6 ? 2 : 1;            // creux, face, bosse
    for (let r = 0; r < MQ_FLAG_H; r++) {
      const tri = c < Math.round(10 * (1 - Math.abs(r - half) / half));   // pointe à mi-largeur
      const part = tri ? 'red' : r < MQ_FLAG_H / 2 ? 'green' : 'black';
      R(MQ_COLORS[part][tone], fx + c, fy + dy + r, 1, 1);
    }
    // Contour continu : haut, bas, et marche d'un pixel quand l'ondulation change.
    R(MQ_OUTLINE, fx + c, fy + dy - 1, 1, 1);
    R(MQ_OUTLINE, fx + c, fy + dy + MQ_FLAG_H, 1, 1);
    if (dy !== prev) {
      R(MQ_OUTLINE, fx + c, fy + Math.min(dy, prev) - 1, 1, 1);
      R(MQ_OUTLINE, fx + c, fy + Math.max(dy, prev) + MQ_FLAG_H, 1, 1);
    }
    prev = dy;
  }
  R(MQ_OUTLINE, fx + MQ_FLAG_W, fy + prev, 1, MQ_FLAG_H);            // contour du bout
}

function thaiFlag(g, px, py, x, y, at) {
  smallObjectGround(g, px, py, x, y, at);
  rect(g, 0x9c9ca4, px + 3, py + 13, 5, 2);
  rect(g, 0x505058, px + 4, py + 1, 2, 13);
  rect(g, 0xd82830, px + 6, py + 1, 10, 1);
  rect(g, 0xf8f8f8, px + 6, py + 2, 10, 1);
  rect(g, 0x2c3c8c, px + 6, py + 3, 10, 2);
  rect(g, 0xf8f8f8, px + 6, py + 5, 10, 1);
  rect(g, 0xd82830, px + 6, py + 6, 10, 1);
}

// Neige (sol des hauteurs du Népal).
function snow(g, px, py, x, y) {
  rect(g, 0xf0f4f8, px, py, S, S);
  const h = hash(x, y, 17);
  rect(g, 0xd8e0ec, px + (h % 13) + 1, py + ((h >> 4) % 13) + 1, 3, 1);
  rect(g, 0xffffff, px + ((h >> 8) % 13) + 1, py + ((h >> 12) % 13) + 1, 2, 1);
}

// Sommet enneigé de l'Himalaya : roche grise, calotte blanche.
function snowyPeak(g, px, py, x, y) {
  snow(g, px, py, x, y);
  const h = hash(x, y, 18);
  const top = h % 3;
  for (let i = 0; i < 14 - top; i++) {
    const w = Math.min(16, 2 + i * 2);
    const x0 = px + 8 - Math.floor(w / 2);
    rect(g, i < 5 ? 0xf8fbff : 0x7c808c, x0, py + top + i + 2, w, 1);
    if (i >= 5) rect(g, 0x5c606c, x0 + Math.floor(w / 2), py + top + i + 2, Math.ceil(w / 2), 1);
  }
}

// Mât de drapeaux de prière tibétains (bleu, blanc, rouge, vert, jaune).
function prayerFlags(g, px, py, x, y, at) {
  smallObjectGround(g, px, py, x, y, at);
  rect(g, 0x6c4c2c, px + 1, py + 2, 2, 13);
  rect(g, 0x6c4c2c, px + 13, py + 2, 2, 13);
  const cols = [0x2c5cc8, 0xf8f8f8, 0xd83030, 0x3c9c4c, 0xf0c830];
  for (let i = 0; i < 5; i++) {
    rect(g, cols[i], px + 3 + i * 2, py + 3 + (i % 2), 2, 4);
    rect(g, cols[(i + 2) % 5], px + 3 + i * 2, py + 9 + ((i + 1) % 2), 2, 3);
  }
  rect(g, 0x9c8c6c, px + 3, py + 3, 10, 1);
  rect(g, 0x9c8c6c, px + 3, py + 9, 10, 1);
}

// Drapeau du Népal : deux fanions superposés, cramoisi bordé de bleu.
function nepalFlag(g, px, py, x, y, at) {
  smallObjectGround(g, px, py, x, y, at);
  rect(g, 0x9c9ca4, px + 3, py + 13, 5, 2);
  rect(g, 0x505058, px + 4, py + 1, 2, 13);
  for (let i = 0; i < 5; i++) {
    rect(g, 0x283c8c, px + 6, py + 1 + i, 7 - i, 1);
    rect(g, 0x283c8c, px + 6, py + 6 + i, 8 - i, 1);
    if (i < 4) {
      rect(g, 0xc82838, px + 6, py + 2 + i, 5 - i, 1);
      rect(g, 0xc82838, px + 6, py + 7 + i, 6 - i, 1);
    }
  }
  rect(g, 0xf8f8f8, px + 7, py + 3, 1, 1);
  rect(g, 0xf8f8f8, px + 7, py + 8, 2, 1);
}

// Champ de blé : terre brune et épis dorés en rangées.
function wheat(g, px, py, x, y) {
  rect(g, 0x8c6c3c, px, py, S, S);
  for (let ly = 1; ly < S; ly += 5) {
    for (let lx = (ly % 2) + 1; lx < S; lx += 3) {
      rect(g, 0xc8a038, px + lx, py + ly + 1, 1, 3);         // tige
      rect(g, 0xf0d060, px + lx, py + ly, 2, 2);             // épi
    }
  }
  if ((x + y) % 3 === 0) rect(g, 0xf8e080, px + 6, py + 7, 2, 1);
}

// Hautes herbes (façon Pokémon) : deux rangées de brins par case, pointe claire, flanc éclairé à gauche,
// pied sombre souligné d'un trait, rangées décalées.
const TALL_GRASS = [
  '....L.......L...',
  '....Lk..L...Lk..',
  'L...LLk.Lk..LLk.',
  'Lk..LLmdLLk.LLmd',
  'Lmk.LmmdLmmdLmmd',
  'mmddmmddmmddmmdd',
  'mdddmdddmdddmddd',
  'kkkkkkkkkkkkkkkk',
  '......L.......L.',
  '..L...Lk......Lk',
  'k.Lk..LLk.L...LL',
  'mdLLk.LLmdLk..LL',
  'mdLmmdLmmdLmk.Lm',
  'ddmmddmmddmmddmm',
  'ddmdddmdddmdddmd',
  'kkkkkkkkkkkkkkkk',
];
const TALL_PAL = { k: 0x1c5030, L: 0x9ce07c, m: 0x5cb45c, d: 0x3c8c48, '.': 0x347c4c };

// Couleur d'un pixel de touffe : chaque touffe a sa nuance (plus claire, normale ou plus sombre),
// tirée au hasard par touffe, pour casser l'effet de bloc.
const TALL_SHADES = [
  { k: 0x1c5030, L: 0x9ce07c, m: 0x5cb45c, d: 0x3c8c48 },
  { k: 0x1c5030, L: 0xb0ec8c, m: 0x6cc468, d: 0x489c50 },
  { k: 0x184828, L: 0x88d070, m: 0x4ca450, d: 0x347c40 },
];
function tuftColor(c, lx, ly, x, y) {
  const row = ly < 8 ? 0 : 1;
  const col = row === 0 ? (lx < 8 ? 0 : 1) : ((lx + 4) % 16 < 8 ? 2 : 3);
  return TALL_SHADES[hash(x, y, 50 + row * 4 + col) % 3][c];
}

// Coins arrondis : sur un coin extérieur de la zone, la touffe du coin n'est pas dessinée.
function tuftSkipped(lx, ly, up, down, left, right) {
  if (ly < 8) return (!up && !left && lx < 8) || (!up && !right && lx >= 8);
  const inLeft = (lx + 4) % 16 >= 12 || lx < 4;
  return (!down && !left && inLeft && lx < 8) || (!down && !right && lx >= 12);
}

// Relief : au bord d'une zone de hautes herbes, le sol sombre laisse voir la pelouse, les coins sont
// arrondis, les touffes du haut dépassent sur la case du dessus et la pelouse du dessous reçoit leur ombre.
function tallGrass(g, px, py, x, y, at) {
  const tall = (dx, dy) => at(x + dx, y + dy) === 'ĥ';
  const up = tall(0, -1);
  const down = tall(0, 1);
  const left = tall(-1, 0);
  const right = tall(1, 0);
  if (!up || !down || !left || !right) grass(g, px, py, x, y, at, { edges: false });
  TALL_GRASS.forEach((row, ly) => {
    for (let lx = 0; lx < S; lx++) {
      const c = row[lx];
      if (c === '.') {
        const inside = (up || ly >= 5) && (down || ly <= 12) && (left || lx >= 3) && (right || lx <= 12);
        if (inside) rect(g, TALL_PAL['.'], px + lx, py + ly, 1, 1);
      } else if (!tuftSkipped(lx, ly, up, down, left, right)) {
        rect(g, tuftColor(c, lx, ly, x, y), px + lx, py + ly, 1, 1);
      }
    }
  });
  if (!up) {
    // Pointes des touffes qui dépassent sur la case du dessus (déjà dessinée).
    TALL_GRASS.slice(0, 4).forEach((row, ly) => {
      for (let lx = 0; lx < S; lx++) {
        const c = row[lx];
        if (c !== '.' && !tuftSkipped(lx, ly, up, down, left, right)) rect(g, tuftColor(c, lx, ly, x, y), px + lx, py + ly - 3, 1, 1);
      }
    });
  }
}

// Buisson rond (façon Pokémon), contour sombre, reflets clairs.
function bush(g, px, py, x, y, at) {
  grass(g, px, py, x, y, at);
  rect(g, 0x000000, px + 3, py + 14, 10, 1);
  rect(g, 0x1c4c1c, px + 2, py + 3, 12, 11);
  rect(g, 0x1c4c1c, px + 1, py + 5, 14, 7);
  rect(g, 0x3c8c34, px + 3, py + 4, 10, 9);
  rect(g, 0x3c8c34, px + 2, py + 6, 12, 5);
  rect(g, 0x2c6c2c, px + 3, py + 10, 10, 2);
  // Grappes de feuilles : petits arcs clairs
  for (const [lx, ly] of [[4, 4], [9, 5], [5, 8], [10, 8]]) {
    rect(g, 0x5cb048, px + lx, py + ly, 3, 2);
    rect(g, 0x88d068, px + lx, py + ly, 2, 1);
    rect(g, 0x2c6c2c, px + lx, py + ly + 2, 3, 1);
  }
}

// Rocher sur la plage.
function beachRock(g, px, py, x, y, at) {
  smallObjectGround(g, px, py, x, y, at);
  rect(g, 0x000000, px + 3, py + 13, 10, 1);
  rect(g, 0x4c4c54, px + 2, py + 6, 12, 7);
  rect(g, 0x4c4c54, px + 4, py + 4, 8, 2);
  rect(g, 0x9c9ca8, px + 3, py + 6, 10, 6);
  rect(g, 0x9c9ca8, px + 5, py + 5, 6, 1);
  rect(g, 0xc8c8d0, px + 4, py + 6, 4, 2);
  rect(g, 0x70707c, px + 8, py + 9, 4, 3);
}

// Petites fleurs blanches et jaunes semées dans l'herbe.
function smallFlowers(g, px, py, x, y, at) {
  grass(g, px, py, x, y, at);
  const h = hash(x, y, 19);
  const spots = [[2, 3], [9, 2], [5, 8], [12, 7], [3, 12], [10, 12]];
  spots.forEach(([fx, fy], i) => {
    const c = (h >> i) & 1 ? 0xf8f8f8 : 0xf8d840;
    rect(g, c, px + fx, py + fy, 2, 2);
    rect(g, c, px + fx - 1, py + fy + 1, 1, 1);
    rect(g, c, px + fx + 2, py + fy + 1, 1, 1);
    rect(g, 0xe88838, px + fx, py + fy + 1, 1, 1);
  });
}

function blackboard(g, px, py, x, y, at) {
  innerWall(g, px, py, x, y, at);
  rect(g, 0x6c4424, px, py + 2, S, 11);
  rect(g, 0x2c4c3c, px, py + 3, S, 9);
  if (hash(x, y, 6) % 2) rect(g, 0xe8e8e0, px + 3, py + 5, 7, 1);
  rect(g, 0xe8e8e0, px + 2, py + 8, 10, 1);
}

// Barrière blanche façon Rouge Feu : poteau à chapeau arrondi, deux traverses, contour gris ardoise,
// ombre portée sur l'herbe. Verticale quand elle continue vers le haut ou le bas.
function fence(g, px, py, x, y, at) {
  const k = 0x58606c, w = 0xf8f8f8, s1 = 0xd0d4e0, s2 = 0x9ca4b4;
  const isFence = (dx, dy) => ['F', 'S'].includes(at(x + dx, y + dy));
  const left = isFence(-1, 0);
  const right = isFence(1, 0);
  const up = isFence(0, -1);
  const down = isFence(0, 1);
  g.fillStyle(0x000000, 0.15);                                      // ombre
  // Traverses horizontales
  for (const ry of [4, 9]) {
    const x0 = left ? 0 : 7;
    const x1 = right ? S : 9;
    if (x1 <= x0) continue;
    g.fillRect(px + x0, py + ry + 5, x1 - x0, 1);
    rect(g, k, px + x0, py + ry, x1 - x0, 4);
    rect(g, w, px + x0, py + ry + 1, x1 - x0, 1);
    rect(g, s1, px + x0, py + ry + 2, x1 - x0, 1);
  }
  // Poteau
  if (up || down) {
    // Clôture verticale : poteau continu, traverses vues de dessus, un chapeau par case
    const top = up ? 0 : 2;
    const bottom = down ? S : 14;
    rect(g, k, px + 5, py + top, 6, bottom - top);
    rect(g, w, px + 6, py + top + (up ? 0 : 1), 3, bottom - top - (up ? 0 : 1) - (down ? 0 : 1));
    rect(g, s1, px + 9, py + top + (up ? 0 : 1), 1, bottom - top - (up ? 0 : 1) - (down ? 0 : 1));
    rect(g, k, px + 5, py + 7, 6, 1);                               // jointure entre deux poteaux
    rect(g, s2, px + 6, py + 6, 4, 1);
    g.fillRect(px + 11, py + top + 1, 1, bottom - top - 1);          // ombre à droite
  } else {
    g.fillRect(px + 6, py + 15, 5, 1);
    rect(g, k, px + 6, py + 1, 4, 1);                                // chapeau arrondi
    rect(g, k, px + 5, py + 2, 6, 13);
    rect(g, w, px + 6, py + 2, 4, 12);
    rect(g, s1, px + 9, py + 3, 1, 11);
    rect(g, s2, px + 6, py + 13, 4, 1);
    rect(g, 0xffffff, px + 6, py + 2, 2, 1);
  }
}

function sign(g, px, py) {
  const K = 0x503018;
  g.fillStyle(0x000000, 0.2);                            // ombre
  g.fillRect(px + 3, py + 14, 11, 2);
  rect(g, K, px + 6, py + 10, 4, 6);                     // pied
  rect(g, 0x8c5c30, px + 7, py + 10, 2, 5);
  rect(g, K, px + 1, py + 2, 14, 10);                    // cadre
  rect(g, 0xd8a060, px + 2, py + 3, 12, 8);              // planche
  rect(g, 0xf0c888, px + 2, py + 3, 12, 1);
  rect(g, 0xb88040, px + 2, py + 10, 12, 1);
  rect(g, 0xc08848, px + 2, py + 6, 12, 1);              // veine du bois
  rect(g, K, px + 4, py + 5, 7, 1);                      // « texte »
  rect(g, K, px + 4, py + 8, 5, 1);
}

function mailbox(g, px, py) {
  const k = 0x586070;
  rect(g, k, px + 7, py + 10, 3, 5);                   // pied
  rect(g, 0x9098a8, px + 8, py + 10, 1, 5);
  rect(g, k, px + 3, py + 3, 11, 8);                   // boîte
  rect(g, k, px + 4, py + 2, 9, 1);
  rect(g, 0xf0f0f8, px + 4, py + 3, 9, 7);
  rect(g, 0xb8c0d0, px + 4, py + 8, 9, 2);
  rect(g, k, px + 6, py + 5, 5, 1);                    // fente
  rect(g, 0x78a080, px + 5, py + 15, 7, 1);            // ombre
}

function sand(g, px, py, x, y) {
  if (groundProvided) return;
  rect(g, 0xf8e4a0, px, py, S, S);
  const h = hash(x, y, 3);
  const h2 = hash(x, y, 13);
  for (let i = 0; i < 4; i++) {                                     // grains sombres, un par quart
    const gx = px + (i % 2) * 8 + ((h >> (i * 6)) % 7);
    const gy = py + Math.floor(i / 2) * 8 + ((h >> (i * 6 + 3)) % 7);
    rect(g, 0xe0c488, gx, gy, i % 2 ? 2 : 1, 1);
  }
  for (let i = 0; i < 3; i++) {                                     // grains clairs
    rect(g, 0xfff4d0, px + ((h2 >> (i * 8)) % 15), py + ((h2 >> (i * 8 + 4)) % 15), 1, 1);
  }

}

// Pavés gris posés en chevrons, bordés de petites pierres blanches là où ils touchent autre chose.
function pavement(g, px, py, x, y, at) {
  rect(g, 0xb8bcc8, px, py, S, S);
  // Chevrons : briquettes 4x2 alternant horizontal / vertical, décalées à chaque rangée.
  for (let by = 0; by < S; by += 4) {
    for (let bx = 0; bx < S; bx += 4) {
      const cx = px + bx;
      const cy = py + by;
      if (((bx + by) / 4) % 2 === 0) {
        rect(g, 0xdcdee6, cx, cy, 3, 1);
        rect(g, 0xdcdee6, cx + 1, cy + 2, 3, 1);
      } else {
        rect(g, 0xdcdee6, cx, cy, 1, 3);
        rect(g, 0xdcdee6, cx + 2, cy + 1, 1, 3);
      }
    }
  }
  const other = (dx, dy) => {
    const n = at(x + dx, y + dy);
    return n !== undefined && n !== 'ç' && n !== 'ŝ';
  };
  const stones = (horizontal, fixed) => {
    for (let i = 0; i < S; i += 4) {
      const [sx, sy] = horizontal ? [px + i, py + fixed] : [px + fixed, py + i];
      rect(g, 0x9098a8, sx, sy, 4, 4);
      rect(g, 0xf8f8f8, sx, sy, 3, 3);
    }
  };
  if (other(0, -1)) stones(true, 0);
  if (other(0, 1)) stones(true, S - 4);
  if (other(-1, 0)) stones(false, 0);
  if (other(1, 0)) stones(false, S - 4);
}

// Barrière en rondins (poteaux ronds bruns), horizontale ou verticale selon les voisins.
// Petite barrière de jardin en rondins : piquets ronds bas reliés par une traverse. Les piquets sont
// alignés sur deux colonnes fixes (x 1 et 10 de la case) pour que les côtés tombent pile sur les coins.
function logFence(g, px, py, x, y, at) {
  grass(g, px, py, x, y, at);
  const is = (dx, dy) => at(x + dx, y + dy) === 'ł';
  const K = 0x3c2014;
  const horizontal = is(-1, 0) || is(1, 0);
  // Côté gauche ou droit d'un enclos : la clôture continue vers la droite ou vers la gauche au-dessus / en dessous.
  const rightSide = is(-1, -1) || is(-1, 1);
  const col = horizontal ? null : rightSide ? 10 : 1;
  const post = (lx, ly) => {
    g.fillStyle(0x000000, 0.18);
    g.fillRect(px + lx + 1, py + ly + 8, 4, 1);
    rect(g, K, px + lx, py + ly + 1, 5, 7);
    rect(g, K, px + lx + 1, py + ly, 3, 1);
    rect(g, 0x8c5030, px + lx + 1, py + ly + 2, 3, 5);
    rect(g, 0xb07040, px + lx + 1, py + ly + 2, 1, 5);
    rect(g, 0xe0b078, px + lx + 1, py + ly + 1, 3, 1);                // dessus du rondin
  };
  const vRail = (c, y0, y1) => {
    rect(g, K, px + c + 1, py + y0, 3, y1 - y0);
    rect(g, 0x9c6038, px + c + 2, py + y0, 1, y1 - y0);
  };
  if (horizontal) {
    const x0 = is(-1, 0) ? 0 : 2;
    const x1 = is(1, 0) ? S : 14;
    rect(g, K, px + x0, py + 9, x1 - x0, 3);                          // traverse
    rect(g, 0x9c6038, px + x0, py + 10, x1 - x0, 1);
    // Coin d'enclos : la traverse repart vers le bas (ou le haut) sous le piquet du coin.
    const cornerCol = is(-1, 0) && !is(1, 0) ? 10 : 1;
    if (is(0, 1)) vRail(cornerCol, 11, S);
    if (is(0, -1)) vRail(cornerCol, 0, 9);
    post(1, 5);
    post(10, 5);
  } else {
    vRail(col, is(0, -1) ? 0 : 6, is(0, 1) ? S : 12);
    post(col, 5);
  }
}

// Potager : terre retournée en sillons, rangées de salades et de carottes.
function vegetablePatch(g, px, py, x, y) {
  rect(g, 0x7c5030, px, py, S, S);
  for (let ly = 1; ly < S; ly += 5) {
    rect(g, 0x5c3820, px, py + ly + 3, S, 1);                         // creux du sillon
    rect(g, 0x9c6c40, px, py + ly, S, 1);                             // crête
  }
  // Deux variétés : une rangée de carottes et une rangée de salades (ordre alterné d'une case à l'autre).
  for (const ly of [2, 10]) {
    const carrots = (ly === 2) === (x % 2 === 0);
    for (const lx of [2, 9]) {
      if (carrots) {
        rect(g, 0xe87828, px + lx + 1, py + ly + 3, 2, 2);             // carotte
        rect(g, 0x3c9c3c, px + lx, py + ly, 1, 3);                     // fanes
        rect(g, 0x58b848, px + lx + 1, py + ly - 1, 2, 4);
        rect(g, 0x3c9c3c, px + lx + 3, py + ly, 1, 3);
      } else {
        rect(g, 0x1c5028, px + lx, py + ly, 5, 5);                     // salade
        rect(g, 0x68c050, px + lx + 1, py + ly, 3, 4);
        rect(g, 0x98e070, px + lx + 1, py + ly + 1, 2, 2);
        rect(g, 0x48a040, px + lx, py + ly + 2, 1, 2);
        rect(g, 0x48a040, px + lx + 4, py + ly + 2, 1, 2);
      }
    }
  }
}

// Falaise de roche brune (façon Rouge Feu) : arête herbeuse en haut, fissures, pied ombré.
function cliff2(g, px, py, x, y, at) {
  const isCliff = (dx, dy) => ['ĉ', 'ŝ'].includes(at(x + dx, y + dy));
  // Roche en gros blocs arrondis (4 par case, rangées décalées) : contour sombre, reflet en haut à gauche.
  rect(g, 0x5c3418, px, py, S, S);
  const shift = (y % 2) * 4;
  for (const [bx, by] of [[-8, 0], [0, 0], [8, 0], [-8, 8], [0, 8], [8, 8]]) {
    const rx = bx + (by ? shift : 4 - shift);
    const x0 = Math.max(rx, 0);
    const x1 = Math.min(rx + 8, S);
    if (x1 - x0 < 2) continue;
    const r = (c, dx, dy, w, h) => {
      const a = Math.max(rx + dx, x0);
      const b = Math.min(rx + dx + w, x1);
      if (b > a) rect(g, c, px + a, py + by + dy, b - a, h);
    };
    r(0xa86c3c, 1, 1, 6, 6);
    r(0xa86c3c, 0, 2, 8, 4);
    r(0xd09860, 1, 1, 4, 1);                                        // reflet
    r(0xd09860, 1, 2, 1, 2);
    r(0x7c4824, 2, 6, 5, 1);                                        // ombre du bas
    r(0x7c4824, 6, 3, 1, 3);
  }
  if (!isCliff(0, -1)) {                                             // arête : herbe qui déborde
    rect(g, C.grass, px, py, S, 3);
    rect(g, 0x58a878, px, py + 3, S, 1);
    rect(g, 0x5c3418, px, py + 4, S, 1);
  }
  if (!isCliff(0, 1)) { rect(g, 0x5c3418, px, py + S - 2, S, 2); }   // pied
  if (!isCliff(-1, 0)) { rect(g, 0x70401c, px, py, 1, S); rect(g, 0xd8a070, px + 1, py + 4, 1, S - 6); }
  if (!isCliff(1, 0)) { rect(g, 0x5c3418, px + S - 2, py, 2, S); }
}

// Escalier de pierre taillé dans la falaise.
function stairs(g, px, py, x, y, at) {
  rect(g, 0x70401c, px, py, S, S);
  for (let ly = 0; ly < S; ly += 4) {
    rect(g, 0xd8d0c0, px + 2, py + ly, S - 4, 3);
    rect(g, 0xf0ece0, px + 2, py + ly, S - 4, 1);
    rect(g, 0x9c9080, px + 2, py + ly + 3, S - 4, 1);
  }
}

// Eau de mer : bleu profond, vaguelettes en biais qui se raccordent d'une case à l'autre.
function seaWater(g, px, py, x, y) {
  if (groundProvided) return;
  rect(g, 0x4078e0, px, py, S, S);
  for (const [wx, wy] of [[0, 1], [8, 5], [0, 9], [8, 13]]) {
    const ox = (wx + (y % 2) * 4) % 16;
    rect(g, 0x70a0f8, px + ox, py + wy, 4, 1);                     // crête claire
    rect(g, 0x70a0f8, px + ox + 4, py + wy + 1, 2, 1);
    rect(g, 0x3068d0, px + ox + 1, py + wy + 1, 3, 1);             // creux sombre
  }
  if (hash(x, y, 4) % 3 === 0) rect(g, 0xa8c8f8, px + 10, py + 10, 2, 1);
}

// Rocher dans la mer (façon îles Sevii) : bloc gris cerclé d'écume.
function seaRock(g, px, py, x, y) {
  seaWater(g, px, py, x, y);
  rect(g, 0x305ec0, px + 1, py + 3, 14, 12);                       // eau plus sombre autour
  rect(g, 0x305ec0, px + 2, py + 2, 12, 14);
  rect(g, 0xd0e4f8, px + 2, py + 12, 12, 2);                       // écume
  rect(g, 0x404850, px + 3, py + 4, 10, 9);
  rect(g, 0x404850, px + 4, py + 3, 8, 11);
  rect(g, 0xa8b0b8, px + 4, py + 4, 8, 8);
  rect(g, 0xe0e4e8, px + 5, py + 5, 3, 2);
  rect(g, 0x70787c, px + 8, py + 8, 4, 3);
  rect(g, 0x70787c, px + 5, py + 10, 3, 1);
}

// Mer : écume blanche là où l'eau touche la terre (pas le ponton).
function sea(g, px, py, x, y, at) {
  if (groundProvided) return;
  seaWater(g, px, py, x, y);
  const shore = (dx, dy) => {
    const n = at(x + dx, y + dy);
    return n !== undefined && !['w', '~', '=', 'B', 'ø'].includes(n);
  };
  if (shore(0, -1)) { rect(g, 0xf0f8ff, px, py, S, 2); rect(g, 0xb8d8f8, px, py + 2, S, 1); }
  if (shore(0, 1)) { rect(g, 0xf0f8ff, px, py + S - 2, S, 2); rect(g, 0xb8d8f8, px, py + S - 3, S, 1); }
  if (shore(-1, 0)) { rect(g, 0xf0f8ff, px, py, 2, S); rect(g, 0xb8d8f8, px + 2, py, 1, S); }
  if (shore(1, 0)) { rect(g, 0xf0f8ff, px + S - 2, py, 2, S); rect(g, 0xb8d8f8, px + S - 3, py, 1, S); }
}

// Ponton orienté nord-sud : planches horizontales, poutres sur les bords extérieurs.
function pier(g, px, py, x, y, at) {
  rect(g, 0x5c3818, px, py, S, S);
  for (let ly = 0; ly < S; ly += 4) {
    rect(g, 0xb07840, px, py + ly, S, 3);
    rect(g, 0xc89058, px, py + ly, S, 1);
  }
  if (at(x - 1, y) !== '=') { rect(g, 0x5c3818, px, py, 2, S); rect(g, 0x3c2410, px + 1, py + 6, 2, 3); }
  if (at(x + 1, y) !== '=') { rect(g, 0x5c3818, px + S - 2, py, 2, S); rect(g, 0x3c2410, px + S - 3, py + 6, 2, 3); }
  // Bout du ponton : bitte d'amarrage sur le coin extérieur, et un rouleau de corde.
  const outerEdge = at(x - 1, y) !== '=' || at(x + 1, y) !== '=';
  if (outerEdge && at(x, y + 1) !== '=' && at(x, y + 1) !== undefined) {
    const bx = at(x - 1, y) !== '=' ? 2 : S - 7;
    rect(g, 0x303038, px + bx, py + 8, 5, 6);
    rect(g, 0x585868, px + bx + 1, py + 8, 3, 2);
    rect(g, 0x9098a8, px + bx + 1, py + 8, 1, 1);
    if (at(x - 1, y) !== '=') {
      rect(g, 0xc8a870, px + 9, py + 9, 5, 4);                        // corde enroulée
      rect(g, 0x8c7048, px + 10, py + 10, 3, 2);
      rect(g, 0xe0c890, px + 11, py + 10, 1, 1);
    }
  }
}

// Étoile de mer et coquillage posés sur le sable.
function starfish(g, px, py, x, y) {
  sand(g, px, py, x, y);
  const c = 0xf08850, k = 0xa84828;
  rect(g, k, px + 6, py + 4, 3, 9);
  rect(g, k, px + 3, py + 7, 9, 3);
  rect(g, k, px + 4, py + 11, 2, 2);
  rect(g, k, px + 9, py + 11, 2, 2);
  rect(g, c, px + 7, py + 5, 1, 7);
  rect(g, c, px + 4, py + 8, 7, 1);
  rect(g, c, px + 5, py + 11, 1, 1);
  rect(g, c, px + 9, py + 11, 1, 1);
  rect(g, 0xf8c8a0, px + 7, py + 8, 1, 1);
}

function shell(g, px, py, x, y) {
  sand(g, px, py, x, y);
  const k = 0xb07868;
  rect(g, k, px + 5, py + 6, 6, 5);
  rect(g, k, px + 7, py + 11, 2, 1);
  rect(g, 0xf8e0d0, px + 6, py + 7, 4, 3);
  rect(g, 0xe8b8a8, px + 7, py + 7, 1, 3);
  rect(g, 0xe8b8a8, px + 9, py + 7, 1, 3);
  rect(g, 0xfff4ec, px + 6, py + 7, 1, 1);
}

// Parasol rayé planté dans le sable (la toile dépasse sur la case du dessus).
function parasol(g, px, py, x, y) {
  sand(g, px, py, x, y);
  g.fillStyle(0x000000, 0.15);
  g.fillEllipse(px + 9, py + 13, 18, 6);
  rect(g, 0x8c7050, px + 7, py - 1, 2, 16);                           // mât
  rect(g, 0x5c3c20, px - 1, py - 8, 18, 8);                           // toile
  rect(g, 0x5c3c20, px + 1, py - 10, 14, 2);
  for (let i = 0; i < 4; i++) rect(g, i % 2 ? 0xf8f8f8 : 0xe84848, px + i * 4, py - 9 + (i === 0 || i === 3 ? 2 : 0), 4, i === 0 || i === 3 ? 5 : 7);
  rect(g, 0xffffff, px + 5, py - 9, 2, 1);
}

// Transat en toile bleue.
function deckchair(g, px, py, x, y) {
  sand(g, px, py, x, y);
  g.fillStyle(0x000000, 0.15);
  g.fillRect(px + 3, py + 14, 11, 2);
  rect(g, 0x6c5030, px + 3, py + 2, 10, 13);
  rect(g, 0x48a0d8, px + 4, py + 3, 8, 11);
  for (let ly = 4; ly < 14; ly += 3) rect(g, 0xf8f8f8, px + 4, py + ly, 8, 1);
  rect(g, 0x6c5030, px + 4, py + 8, 8, 1);                             // pliure du dossier
}

// Cabane de pêche : râtelier de cannes à pêche contre le mur, caisses de poissons, caisse « À DONNER ».
// Dessins au pixel près, contour sombre comme les meubles de Rouge Feu.
const HUT_C = {
  k: 0x383840, W: 0xc89058, w: 0x9c6834, D: 0x6c4424, d: 0x4c3018,
  F: 0xb8d0e8, f: 0x6888b8, e: 0x202028, P: 0xf8f8f0, p: 0xc8c8c0, R: 0xd84838,
};
function pixelArt(g, rows, px, py) {
  rows.forEach((row, ry) => [...row].forEach((c, rx) => {
    if (c !== '.') rect(g, HUT_C[c], px + rx, py + ry, 1, 1);
  }));
}

// Canne à pêche en bambou, contour sombre comme les objets de Rouge Feu : pied en (bx, by), `h` px de haut,
// penchée d'un pixel tous les 6 px vers `lean` (1 : droite, -1 : gauche). Poignée rouge, moulinet, scion fin.
export function fishingRod(g, bx, by, h, lean = 1) {
  const K = 0x303038;
  const xAt = (i) => bx + lean * Math.floor(i / 6);
  const tip = 4;                                                       // scion : fin, sans contour
  for (let i = 0; i < h - tip; i++) {                                  // contour
    rect(g, K, xAt(i) - 1, by - i, 3, 1);
  }
  rect(g, K, xAt(0) - 1, by + 1, 3, 1);
  for (let i = 0; i < h - tip; i++) {                                  // brin : bambou et ses nœuds
    const c = i < 6 ? (i === 0 || i === 5 ? 0x802020 : 0xd04838) : (i - 6) % 5 === 4 ? 0x7c5028 : 0xc89050;
    rect(g, c, xAt(i), by - i, 1, 1);
  }
  for (let i = h - tip; i < h; i++) rect(g, 0x585860, xAt(i), by - i, 1, 1);
  const rx = xAt(8) - lean * 3 - (lean < 0 ? 1 : 0);                   // moulinet, sur le côté
  rect(g, K, rx, by - 10, 3, 3);
  rect(g, 0xd0d8e0, rx + 1, by - 9, 1, 1);
}

// Cannes du râtelier (au-dessus du socle, voir fishingRods) : trois, puis celle que Papa garde.
const RACK_RODS = [[3, 26, 1], [9, 22, 1], [19, 24, 1]];
export function drawRackRods(g, px, py, count) {
  const base = py + 8;
  for (const [bx, h, lean] of RACK_RODS.slice(0, count)) fishingRod(g, px + bx, base + 2, h, lean);
  pixelArt(g, ROD_STAND, px, base);                                    // socle par-dessus les pieds des cannes
  pixelArt(g, ROD_STAND, px + S, base);
}

// Tête d'épuisette : cercle et filet.
const NET_HEAD = [
  '.kkkkk.',
  'kPpPpPk',
  'kpPpPpk',
  'kPpPpPk',
  '.kPpPk.',
  '..kkk..',
];

// Râtelier : socle en bois percé, deux cannes (case de gauche) ou une canne et une épuisette (de droite).
const ROD_STAND = [
  '.kkkkkkkkkkkkkk.',
  'kWWWWWWWWWWWWWWk',
  'kWdWWWWdWWWWdWWk',
  'kkkkkkkkkkkkkkkk',
  'kwwwwwwwwwwwwwwk',
  'kwDwwwwwwwwwwDwk',
  'kDDDDDDDDDDDDDDk',
  '.kkkkkkkkkkkkkk.',
];
function fishingRods(g, px, py, x, y) {
  floor(g, px, py, x, y);
  g.fillStyle(0x000000, 0.2);
  g.fillRect(px + 1, py + 15, 15, 1);
  const base = py + 8;
  // Les cannes sont posées par-dessus, selon l'histoire (décor `rodsOnRack`).
  if (x % 2 === 1) {
    // Épuisette posée contre le mur : manche et filet.
    rect(g, 0x383840, px + 10, py - 13, 1, 23);
    rect(g, 0x9c6834, px + 11, py - 13, 1, 23);
    pixelArt(g, NET_HEAD, px + 8, py - 19);
  }
  pixelArt(g, ROD_STAND, px, base);
}

// Caisse de poissons à claire-voie, vue de haut et de face : poissons argentés dans la caisse.
const FISH_CRATE = [
  '.kkkkkkkkkkkkkk.',
  'kWWWWWWWWWWWWWWk',
  'kWdFFFfedFFFFedk',
  'kWdfFFFFdfFFFFdk',
  'kWFFFFedFFFfddWk',
  'kkkkkkkkkkkkkkkk',
  'kWWWWWWWWWWWWWWk',
  'kwwwwwwwwwwwwwwk',
  'kdkdddddddddkddk',
  'kWWWWWWWWWWWWWWk',
  'kwwwwwwwwwwwwwwk',
  'kDDDDDDDDDDDDDDk',
  '.kkkkkkkkkkkkkk.',
];
function fishCrate(g, px, py, x, y) {
  floor(g, px, py, x, y);
  g.fillStyle(0x000000, 0.2);
  g.fillRect(px + 2, py + 15, 14, 1);
  pixelArt(g, FISH_CRATE, px, py + 2);
}

// Décors qui changent avec l'histoire, dessinés par-dessus la carte (voir `decals` dans MapScene) :
// cannes à pêche qui dépassent de la caisse « À DONNER » (`count` : 1 ou 2), case (x, y) en pixels px, py.
const DECALS = {
  rodsInCrate(g, px, py, { count = 2 } = {}) {
    const rods = [[5, 14, -1], [10, 17, 1]].slice(0, count);
    for (const [bx, h, lean] of rods) fishingRod(g, px + bx, py + 6, h, lean);
  },
  rodsOnRack(g, px, py, { count = 3 } = {}) {
    drawRackRods(g, px, py, count);
  },
  // Vieille corde enroulée, cachée dans les hautes herbes (Saint-Ay).
  rope(g, px, py) {
    drawRope(g, px, py);
  },
  // Tablier du pont ferroviaire de Newland Avenue, au-dessus de la rue : poutre d'acier bleu avec le nom de la
  // rue peint dessus, rails sur le dessus. (x, y) : case en haut à gauche ; `w` cases de large.
  railBridge(g, px, py, { w = 6 } = {}) {
    const W = w * S;
    rect(g, 0x1c2c48, px, py - 6, W, 30);
    rect(g, 0x2c4c7c, px, py - 5, W, 22);
    rect(g, 0x5c7cac, px, py - 5, W, 1);
    for (let x = 4; x < W; x += 12) rect(g, 0x243c64, px + x, py - 4, 2, 20);          // rivets et montants
    rect(g, 0x6c6c6c, px, py - 10, W, 4);                                                // ballast et rails
    rect(g, 0xb0b0b0, px, py - 9, W, 1);
    rect(g, 0xb0b0b0, px, py - 7, W, 1);
    rect(g, 0xf0f0e8, px + 6, py + 2, W - 12, 9);                                       // bandeau peint
    pixelText(g, 'NEWLAND AVENUE', px + Math.round((W - 61) / 2), py + 4, 1, 0x1c2c48);
    rect(g, 0x000000, px, py + 24, W, 1);
  },
  // Le pont de la Humber, au loin sur l'estuaire : deux hautes tours, câbles en guirlande, tablier fin
  // (tout petit, gris-bleu, dans la brume). `w` cases de large.
  humberBridge(g, px, py, { w = 8 } = {}) {
    const W = w * S;
    const C = 0x8898b0;
    const deck = py + 10;
    rect(g, C, px, deck, W, 2);
    for (const tx of [Math.round(W * 0.2), Math.round(W * 0.8)]) {
      rect(g, C, px + tx - 1, deck - 22, 3, 26);
      rect(g, 0xa8b8d0, px + tx - 1, deck - 22, 1, 26);
    }
    const t1 = Math.round(W * 0.2);
    const t2 = Math.round(W * 0.8);
    for (let x = 0; x <= W; x++) {                                          // câble porteur
      let y;
      if (x < t1) y = deck - 22 + Math.round((22 * (t1 - x)) / t1 * 0.8);
      else if (x > t2) y = deck - 22 + Math.round((22 * (x - t2)) / (W - t2) * 0.8);
      else { const u = (x - t1) / (t2 - t1); y = deck - 22 + Math.round(20 * 4 * u * (1 - u)); }
      rect(g, 0x9aaac0, px + x, py + (y - py), 1, 1);
      if (x % 4 === 0 && y < deck) rect(g, 0xb0bccc, px + x, y + 1, 1, deck - y - 1);   // suspentes
    }
    rect(g, 0x506078, px, deck + 2, W, 1);
  },
  // Les pintes de la bande, posées sur une table du pub (sur deux cases).
  pints(g, px, py) {
    for (const [dx, dy] of [[4, 2], [11, 4], [19, 2], [25, 5]]) {
      rect(g, 0x303038, px + dx - 1, py + dy - 1, 6, 10);
      rect(g, 0xd89830, px + dx, py + dy + 2, 4, 6);               // bière
      rect(g, 0xf8f0e0, px + dx, py + dy, 4, 2);                   // mousse
      rect(g, 0xf0c060, px + dx, py + dy + 3, 1, 4);
    }
  },
  // Piste de danse de l'Asylum : dalles lumineuses de couleurs (w x h cases), posée au sol.
  danceFloor(g, px, py, { w = 4, h = 3 } = {}) {
    const colors = [0x9040d0, 0x3070e0, 0xe04090, 0x30b0c0];
    for (let y = 0; y < h * 2; y++) {
      for (let x = 0; x < w * 2; x++) {
        rect(g, 0x201828, px + x * 8, py + y * 8, 8, 8);
        rect(g, colors[(x + y * 3) % colors.length], px + x * 8 + 1, py + y * 8 + 1, 6, 6);
        rect(g, 0xf8e8ff, px + x * 8 + 2, py + y * 8 + 2, 2, 1);
      }
    }
  },
  // Cabane des cousins, selon l'emplacement choisi : dans le grand arbre, sur pilotis au bord du lac, ou
  // au milieu du champ de blé. (x, y) : case en bas à gauche d'un bloc de 2 x 2 cases.
  cabane(g, px, py, { place = 'champ' } = {}) {
    const ox = px;
    const oy = py + S - 34;                                             // bas du dessin sur le bas de la case
    const K = 0x383028;
    if (place === 'arbre') {
      rect(g, K, ox + 2, oy - 2, 28, 4);                                // plateforme dans les branches
      rect(g, 0xa87040, ox + 3, oy - 1, 26, 2);
      rect(g, 0xd8c890, ox + 26, oy + 2, 1, 22);                        // échelle de corde
      rect(g, 0xd8c890, ox + 29, oy + 2, 1, 22);
      for (let y = 4; y < 24; y += 4) rect(g, 0xa87040, ox + 26, oy + y, 4, 1);
    } else if (place === 'etang') {
      for (const x of [4, 12, 20, 26]) { rect(g, K, ox + x, oy + 22, 3, 12); rect(g, 0x806040, ox + x + 1, oy + 22, 1, 12); }   // pilotis
      rect(g, K, ox + 1, oy + 20, 30, 4);                               // ponton
      rect(g, 0xb08050, ox + 2, oy + 21, 28, 2);
    }
    const base = place === 'arbre' ? oy - 22 : oy;                      // la cabane
    const top = place === 'etang' ? base - 2 : base + 4;
    rect(g, K, ox + 4, top + 8, 24, 14);                                // murs en planches
    rect(g, 0xc89058, ox + 5, top + 9, 22, 12);
    for (let y = top + 12; y < top + 21; y += 3) rect(g, 0x9c6834, ox + 5, y, 22, 1);
    rect(g, K, ox + 13, top + 13, 6, 9);                                // porte
    rect(g, 0x5c3c20, ox + 14, top + 14, 4, 8);
    rect(g, K, ox + 21, top + 11, 4, 4);                                // fenêtre
    rect(g, 0x9cc8e8, ox + 22, top + 12, 2, 2);
    for (let i = 0; i < 9; i++) rect(g, K, ox + 2 + i, top + 8 - i, 28 - 2 * i, 1);   // toit
    for (let i = 1; i < 8; i++) rect(g, i % 2 ? 0xd84838 : 0xb83028, ox + 3 + i, top + 8 - i, 26 - 2 * i, 1);
    rect(g, 0xf8f8f0, ox + 7, top + 16, 4, 3);                          // panneau « QG »
    rect(g, 0xd83030, ox + 8, top + 17, 2, 1);
  },
};

export function drawDecal(g, kind, px, py, options) {
  DECALS[kind]?.(g, px, py, options);
}

// Tas de planches de la ferme (Saint-Ay), posé sur l'herbe (sol Rouge Feu dessous).
const PLANKS = [
  '................',
  '..kkkkkkkkkkkk..',
  '.kWWWWWWWWWWWWk.',
  '.kwwwwwwwwwwwwk.',
  'kkkkkkkkkkkkkkk.',
  'kWWWWWWWWWWWWWk.',
  'kwwwwwwwwwwwwwkk',
  'kkkkkkkkkkkkkkWk',
  '.kWWWWWWWWWWWkwk',
  '.kwwwwwwwwwwwkkk',
  'kkkkkkkkkkkkkkk.',
  'kWWWWWWWWWWWWWWk',
  'kwwwwwwwwwwwwwwk',
  'kDDDDDDDDDDDDDDk',
  '.kkkkkkkkkkkkkk.',
];
function planksPile(g, px, py) {
  if (!groundProvided) grass(g, px, py, 0, 0);
  g.fillStyle(0x000000, 0.2);
  g.fillRect(px + 1, py + 15, 15, 1);
  pixelArt(g, PLANKS, px, py + 1);
}

// Bitte d'amarrage en bois au bord du lac (Saint-Ay), poteau étroit sur la gauche de la case ; la corde
// est un décor à part (DECALS.rope), cachée dans les hautes herbes.
const BOLLARD = [
  '.kkkk.',
  'kWWWWk',
  'kwwwwk',
  '.kWwk.',
  '.kWwk.',
  '.kWwk.',
  '.kWwk.',
  '.kWwk.',
  '.kWwk.',
  '.kWwk.',
  'kWWwwk',
  'kDDDDk',
  '.kkkk.',
];
function bollard(g, px, py) {
  if (!groundProvided) grass(g, px, py, 0, 0);
  g.fillStyle(0x000000, 0.2);
  g.fillRect(px + 2, py + 15, 5, 1);
  pixelArt(g, BOLLARD, px + 1, py + 2);
}

// Vieille corde enroulée en spirale sur l'herbe, un bout qui dépasse (brins clairs et sombres alternés).
const ROPE_COLORS = { o: 0x543c24, L: 0xf0d8a0, M: 0xd0a868, N: 0x966e3c };
const ROPE = [
  '.oooo...........',
  'oLMNMo..........',
  '.oooMNo.oooooo..',
  '.....oNoLMNLMLo.',
  '.....oMLooooooMo',
  '....oMoLNMLNLoNo',
  '....oNoMooooMoMo',
  '....oMoNLMNMooNo',
  '....oNMoooooNMo.',
  '.....oNMNMNMNo..',
  '......ooooooo...',
];
export function drawRope(g, px, py) {
  g.fillStyle(0x000000, 0.18);                                         // ombre du rouleau
  g.fillRect(px + 5, py + 15, 10, 1);
  ROPE.forEach((row, ry) => [...row].forEach((c, rx) => {
    if (c !== '.') rect(g, ROPE_COLORS[c], px + rx, py + 4 + ry, 1, 1);
  }));
}

// Remblai en briques du pont ferroviaire de Newland Avenue (Hull) : briques rouges, couronnement de pierre.
function railEmbankment(g, px, py, x, y, at) {
  rect(g, 0x5c2418, px, py, S, S);
  for (let r = 0; r < 4; r++) {
    for (let c = 0; c < 3; c++) {
      const bx = px + c * 6 - (r % 2 ? 3 : 0);
      rect(g, r % 2 ? 0xa04830 : 0xb05438, Math.max(px, bx) + 1, py + r * 4 + 1, 4, 2);
    }
  }
  if (at(x, y - 1) !== 'ʕ') { rect(g, 0x9c9c94, px, py, S, 3); rect(g, 0xc8c8c0, px, py, S, 1); }
}

// Caisse « À DONNER » : caisse vide avec son étiquette de papier (texte griffonné au feutre rouge).
const GIVE_CRATE = [
  '.kkkkkkkkkkkkkk.',
  'kWWWWWWWWWWWWWWk',
  'kWddddddddddddWk',
  'kWddddddddddddWk',
  'kkkkkkkkkkkkkkkk',
  'kWWWkkkkkkkkWWWk',
  'kwwwkPPPPPPkwwwk',
  'kdddkPRRpRPkdddk',
  'kWWWkPpRRRPkWWWk',
  'kwwwkPPPPPPkwwwk',
  'kDDDkkkkkkkkDDDk',
  'kDDDDDDDDDDDDDDk',
  '.kkkkkkkkkkkkkk.',
];
function giveCrate(g, px, py, x, y) {
  floor(g, px, py, x, y);
  g.fillStyle(0x000000, 0.2);
  g.fillRect(px + 2, py + 15, 14, 1);
  pixelArt(g, GIVE_CRATE, px, py + 2);
}



// Sol sous un palmier (le palmier lui-même est dessiné dans la passe des grands objets, drawTall).
// Mémorial de l'Anse Caffard (Cap 110, Martinique) : six silhouettes de pierre blanche, tête baissée,
// épaules voûtées, sur leur socle, vues de face (elles regardent la mer, vers le bas), en trois rangées
// (trois derrière, deux au milieu, une devant). Elles se dressent sur le petit plateau rocheux Rouge Feu
// des cases 'ɱ' / 'ɲ' (4 x 4, voir art/frlgArt.js : les statues sont au fond, sur les deux rangées du haut ;
// la rangée d'herbe devant elles et l'escalier sont praticables) : c'est un objet haut (voir TALL_KINDS), ancré sur la case
// en haut à gauche du plateau. Statue : 14 x 20 px.
const CAP_STATUE = [
  '.....kkkk.....',
  '....kLLLLk....',
  '...kLLLLLmk...',
  '...kLLLLLmk...',
  '...kLmLLmmk...',
  '....kLLLmk....',
  '..kkkmmmmkkk..',
  '.kLLLkmmmkLLk.',
  'kLLLLLkkkLLLmk',
  'kLLLmLLLLLLmmk',
  'kLLLmLLLLLmmmk',
  '.kLLkLLLLkmmk.',
  '.kLLkLLLLkmmk.',
  '.kLLkLLLLkmmk.',
  '.kLmkLLLLkmmk.',
  '.kmmkLLLmkmmk.',
  '.kkkkmmmmkkkk.',
  'kddddddddddddk',
  'kddddddddddddk',
  '.kkkkkkkkkkkk.',
];
const CAP_STATUE_C = { k: 0x5c5850, L: 0xf0ece4, m: 0xc8c0b4, d: 0xa8a094 };
// Position (coin haut-gauche) de chaque statue par rapport au coin du plateau, du fond vers l'avant.
const CAP_LAYOUT = [[11, -4], [25, -4], [39, -4], [18, 4], [32, 4], [25, 12]];

function capStatues(g, px, py) {
  for (const [sx, sy] of CAP_LAYOUT) {
    g.fillStyle(0x000000, 0.2);                                     // ombre au pied
    g.fillRect(px + sx + 1, py + sy + 19, 14, 2);
    CAP_STATUE.forEach((row, ry) => [...row].forEach((c, rx) => {
      if (c !== '.') rect(g, CAP_STATUE_C[c], px + sx + rx, py + sy + ry, 1, 1);
    }));
  }
}

function palm(g, px, py, x, y, at) {
  const around = [at(x, y - 1), at(x, y + 1), at(x - 1, y), at(x + 1, y)];
  if (groundProvided) return;                                          // sol Rouge Feu déjà posé
  if (palmOnGrass(x, y, at)) grass(g, px, py, x, y, at);
  else if (around.includes('C') && !around.includes('s')) cobble(g, px, py, x, y);   // palmier en ville
  else sand(g, px, py, x, y);
}

// Grand palmier (36 x 40 px, pied au centre du bas de sa case) : tronc à écailles légèrement courbé,
// onze palmes épaisses aux bords dentelés avec nervure claire.
const PALM_C = { k: 0x1c4c28, d: 0x2c7c38, m: 0x48a848, L: 0x7cd05c, h: 0xc0f080, tk: 0x4c2c14, t1: 0xc89058, t2: 0x9c6834, t3: 0x6c4424 };
const PALM_W = 36;
const PALM_H = 40;
let palmPixels = null;
function palmSprite() {
  if (palmPixels) return palmPixels;
  const W = PALM_W;
  const H = PALM_H;
  const grid = Array.from({ length: H }, () => Array(W).fill(null));
  const set = (x, y, c) => { if (x >= 0 && x < W && y >= 0 && y < H) grid[y][x] = c; };
  const cx = 18;
  const cy = 13;
  // Tronc : du pied (17, 39) à la couronne, courbé vers la gauche au milieu ; écailles en chevrons.
  for (let y = H - 1; y >= cy; y--) {
    const t = (H - 1 - y) / (H - 1 - cy);
    const mid = Math.round(17 - Math.sin(t * Math.PI) * 2.5 + t);
    const w = t < 0.12 ? 6 : 5;
    const ring = (H - 1 - y) % 4;
    for (let dx = -1; dx <= w; dx++) {
      const x = mid - Math.floor(w / 2) + dx;
      let c;
      if (dx === -1 || dx === w) c = 'tk';
      else if (ring === 0) c = dx === Math.floor(w / 2) ? 't3' : 't2';  // bord d'écaille
      else if (dx <= 1) c = 't1';
      else if (dx >= w - 1) c = 't3';
      else c = ring === 1 ? 't1' : 't2';
      set(x, y, c);
    }
  }
  // Palmes : [angle (degrés), longueur, courbure vers le bas]
  // Palmes en arc : elles partent vers le haut puis retombent (angle négatif = vers le haut).
  const leaves = [[-160, 16, 1.1], [-20, 16, 1.1], [-125, 13, 1.3], [-55, 13, 1.3], [-92, 9, 1.5], [170, 13, 0.7], [10, 13, 0.7], [135, 10, 0.6], [45, 10, 0.6]];
  const leaf = Array.from({ length: H }, () => Array(W).fill(0));
  const rib = Array.from({ length: H }, () => Array(W).fill(false));
  for (const [deg, len, droop] of leaves) {
    const a = (deg * Math.PI) / 180;
    for (let t = 0; t <= 1; t += 0.015) {
      const x = cx + Math.cos(a) * t * len;
      const y = cy + Math.sin(a) * t * len + droop * t * t * len;
      const r = 3.4 * Math.pow(Math.sin(Math.PI * Math.min(t * 1.15, 1)), 0.7) + 0.6;   // large au milieu, pointue au bout
      for (let yy = Math.floor(y - r); yy <= Math.ceil(y + r); yy++) {
        for (let xx = Math.floor(x - r); xx <= Math.ceil(x + r); xx++) {
          if (xx < 0 || xx >= W || yy < 0 || yy >= H) continue;
          if ((xx + 0.5 - x) ** 2 + (yy + 0.5 - y) ** 2 <= r * r) leaf[yy][xx] = 1;
        }
      }
      if (t > 0.1 && t < 0.9) {
        const rx = Math.round(x);
        const ry = Math.round(y);
        if (ry >= 0 && ry < H && rx >= 0 && rx < W) rib[ry][rx] = true;
      }
    }
  }
  // Bords dentelés : on creuse une encoche sur le bord inférieur des palmes, un pixel sur trois.
  const on0 = (x, y) => y >= 0 && y < H && x >= 0 && x < W && leaf[y][x];
  const notches = [];
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      if (on0(x, y) && !on0(x, y + 1) && !rib[y][x] && x % 3 === 0 && Math.abs(x - cx) > 8) notches.push([x, y]);
    }
  }
  notches.forEach(([x, y]) => { leaf[y][x] = 0; });
  const on = (x, y) => y >= 0 && y < H && x >= 0 && x < W && leaf[y][x];
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      if (!leaf[y][x]) continue;
      if (!on(x - 1, y) || !on(x + 1, y) || !on(x, y - 1) || !on(x, y + 1)) set(x, y, 'k');
      else if (rib[y][x]) set(x, y, 'h');
      else if (!on(x, y - 2)) set(x, y, 'L');
      else if (!on(x, y + 2)) set(x, y, 'd');
      else set(x, y, (x + y) % 4 === 0 ? 'L' : 'm');
    }
  }
  palmPixels = grid;
  return grid;
}

function tallPalm(g, px, py) {
  const grid = palmSprite();
  const ox = px + S / 2 - PALM_W / 2;
  const oy = py + S - grid.length;
  g.fillStyle(0x000000, 0.18);                                      // ombre au pied
  g.fillRect(px + 2, py + 13, 12, 3);
  grid.forEach((row, y) => row.forEach((c, x) => { if (c) rect(g, PALM_C[c], ox + x, oy + y, 1, 1); }));
}

// Objets hauts (sapins, palmiers) : ils dépassent de leurs cases et passent devant les personnages qui
// sont derrière eux. Sur les cartes, chacun est une image triée en profondeur (voir tallObject) ;
// dans le décor autour des cartes, ils sont dessinés directement avec drawTall.
// Géométrie de chaque sorte, relative au coin haut-gauche de sa case (ou de son bloc) :
// left / top : décalage de l'image, w / h : taille, base : y du pied (tri en profondeur).
const TALL_KINDS = {
  pine32: { left: 0, top: -12, w: 32, h: 45, base: 31, draw: (g, px, py) => pine(g, px, py + 31, 32) },
  pine16: { left: 0, top: -8, w: 16, h: 25, base: 15, draw: (g, px, py) => pine(g, px, py + 15, 16) },
  palm: { left: -10, top: -24, w: 36, h: 40, base: 15, draw: (g, px, py) => tallPalm(g, px, py) },
  capStatues: { left: 0, top: -6, w: 64, h: 40, base: 31, draw: (g, px, py) => capStatues(g, px, py) },
  mqFlag: { left: 3, top: -61, w: 26, h: 77, base: 15, frames: MQ_FLAG_FRAMES, draw: (g, px, py, frame) => tallMartiniqueFlag(g, px + 3, py - 60, frame) },
};

// Objet haut ancré sur la case (x, y), ou null : { kind, px, py } (coin haut-gauche de sa case / son bloc).
function tallAnchor(code, x, y, at) {
  if (code === 'Y') return { kind: 'palm', px: x * S, py: y * S };
  if (code === 'ɸ') return { kind: 'mqFlag', px: x * S, py: y * S };
  if (code === 'ɱ') {
    const plateau = (c) => c === 'ɱ' || c === 'ɲ';
    return plateau(at(x - 1, y)) || plateau(at(x, y - 1)) ? null : { kind: 'capStatues', px: x * S, py: y * S };
  }
  if (code !== 'T') return null;
  if (!inFullTreeBlock(x, y, at)) return { kind: 'pine16', px: x * S, py: y * S };
  // Grand sapin : ancré sur la dernière case de son bloc (en bas à droite).
  if (mod2(x) === 1 && mod2(y) === 1) return { kind: 'pine32', px: (x - 1) * S, py: (y - 1) * S };
  return null;
}

export function drawTall(g, code, x, y, at) {
  const a = tallAnchor(code, x, y, at);
  if (a) TALL_KINDS[a.kind].draw(g, a.px, a.py);
}

// Description d'un objet haut pour le rendu en image : { kind, x, y (coin de l'image), w, h, baseY }.
export function tallObject(code, x, y, at) {
  const a = tallAnchor(code, x, y, at);
  if (!a) return null;
  const k = TALL_KINDS[a.kind];
  return { kind: a.kind, x: a.px + k.left, y: a.py + k.top, w: k.w, h: k.h, baseY: a.py + k.base };
}

// Dessine un objet haut dans sa propre texture (coin haut-gauche en 0, 0).
export function drawTallKind(g, kind, frame = 0) {
  const k = TALL_KINDS[kind];
  k.draw(g, -k.left, -k.top, frame);
}

// Nombre d'images d'un objet haut animé (1 s'il est fixe).
export function tallFrames(kind) {
  return TALL_KINDS[kind].frames ?? 1;
}

function floor(g, px, py, x, y = 0) {
  if (groundProvided) return;                                        // parquet Rouge Feu déjà posé
  // Lames en diagonale, alternées d'une case à l'autre : effet de chevrons.
  rect(g, 0xe8c890, px, py, S, S);
  const flip = (x + y) % 2 === 1;
  for (let i = -S; i < S; i += 4) {
    for (let t = 0; t < S; t++) {
      const lx = flip ? S - 1 - t : t;
      const ly = t + i;
      if (ly >= 0 && ly < S) rect(g, 0xd0a870, px + lx, py + ly, 1, 1);
    }
  }
}

// Mur intérieur façon Rouge Feu : le mur du fond montre son papier peint (lambris en bas, fenêtre de
// temps en temps) ; les autres murs sont vus de dessus : bord sombre avec une arête claire côté pièce.
function innerWall(g, px, py, x, y, at) {
  const room = (dx, dy) => { const c = at(x + dx, y + dy); return c !== undefined && c !== 'X' && c !== 'N' && c !== '¤'; };
  if (room(0, 1)) {
    rect(g, 0xf0e4b8, px, py, S, S);                                  // papier peint
    for (let lx = 1; lx < S; lx += 4) rect(g, 0xe4d4a0, px + lx, py + 1, 1, 8);
    rect(g, 0x584838, px, py, S, 1);                                  // haut du mur
    rect(g, 0xb08050, px, py + 9, S, 5);                              // lambris
    rect(g, 0xd0a068, px, py + 9, S, 1);
    for (let lx = 3; lx < S; lx += 8) rect(g, 0x906038, px + lx, py + 10, 1, 4);
    rect(g, 0x604028, px, py + 14, S, 2);                             // plinthe
    if (x % 4 === 2 && !['m', 'u', 'L', 'τ', 'κ', 'φ', 'η', 'ξ', 'λ', 'π', 'δ', 'ψ'].includes(at(x, y + 1))) {    // fenêtre
      rect(g, 0x584838, px + 3, py + 1, 10, 8);
      rect(g, 0x88c0f0, px + 4, py + 2, 8, 6);
      rect(g, 0xd0e8f8, px + 4, py + 2, 8, 2);
      rect(g, 0xf8f8f8, px + 4, py + 2, 2, 1);
      rect(g, 0x584838, px + 7, py + 2, 1, 6);
      rect(g, 0xf8f8f8, px + 2, py + 8, 12, 1);                       // rebord
    }
    return;
  }
  rect(g, 0x302838, px, py, S, S);                                    // mur vu de dessus
  rect(g, 0x484058, px + 1, py + 1, S - 2, S - 2);
  if (room(0, -1)) rect(g, 0x9890a8, px, py, S, 2);
  if (room(-1, 0)) rect(g, 0x9890a8, px, py, 2, S);
  if (room(1, 0)) rect(g, 0x9890a8, px + S - 2, py, 2, S);
}

// Meuble : contre le mur du fond, un buffet à étagères ; ailleurs, une table en bois.
function furniture(g, px, py, x, y = 0, at = () => undefined) {
  floor(g, px, py, x, y);
  const K = 0x503018;
  if (at(x, y - 1) === 'X') {
    rect(g, K, px, py - 6, S, 21);                                    // buffet (dépasse sur le mur)
    rect(g, 0xb87840, px + 1, py - 5, S - 2, 19);
    rect(g, 0xd89858, px + 1, py - 5, S - 2, 2);
    rect(g, 0x805028, px + 1, py + 1, S - 2, 1);                      // étagère
    const books = [0xd84838, 0x3868c8, 0x48a048, 0xe8b830, 0x9048b0];
    for (let i = 0; i < 5; i++) rect(g, books[(x + i) % 5], px + 2 + i * 2 + (i > 2 ? 1 : 0), py - 3, 2, 4);
    rect(g, 0x906030, px + 2, py + 3, 5, 9);                          // portes
    rect(g, 0x906030, px + 9, py + 3, 5, 9);
    rect(g, 0xf0c848, px + 6, py + 7, 1, 1);
    rect(g, 0xf0c848, px + 9, py + 7, 1, 1);
    g.fillStyle(0x000000, 0.2);
    g.fillRect(px + 1, py + 15, S - 2, 1);
    return;
  }
  // Table (se prolonge avec les cases de table voisines, dans les deux sens)
  const joinL = at(x - 1, y) === 'm' && at(x - 1, y - 1) !== 'X';
  const joinR = at(x + 1, y) === 'm' && at(x + 1, y - 1) !== 'X';
  const joinU = at(x, y - 1) === 'm';
  const joinD = at(x, y + 1) === 'm';
  const x0 = joinL ? 0 : 1;
  const x1 = joinR ? S : S - 1;
  const top = joinU ? 0 : 2;
  const bottom = joinD ? S : 12;
  const ix0 = x0 + (joinL ? 0 : 1);
  const iw = x1 - ix0 - (joinR ? 0 : 1);
  if (!joinD) {
    g.fillStyle(0x000000, 0.18);
    g.fillRect(px + x0 + 1, py + 13, x1 - x0 - 1, 2);
  }
  rect(g, K, px + x0, py + top, x1 - x0, bottom - top);
  rect(g, 0xc88850, px + ix0, py + top + (joinU ? 0 : 1), iw, bottom - top - (joinU ? 0 : 1) - (joinD ? 0 : 3));
  if (!joinU) rect(g, 0xe0a870, px + ix0, py + top + 1, iw, 1);
  if (!joinD) {
    rect(g, 0x985c30, px + ix0, py + 9, iw, 2);                       // chant de la table
    if (!joinL) rect(g, K, px + 2, py + 12, 2, 3);                    // pieds
    if (!joinR) rect(g, K, px + S - 4, py + 12, 2, 3);
  }
}

// Lit sur une ou deux cases (tête de lit en haut, couverture en dessous).
// Lit façon Rouge Feu (14 x 30 px sur deux cases 'L') : tête et pied de lit en bois, oreiller blanc,
// drap, couverture bleue à motif ; dessiné en entier depuis la case du haut.
const BED = [
  '.kkkkkkkkkkkk.',
  'kWWWWWWWWWWWWk',
  'kWwwwwwwwwwwWk',
  'kkkkkkkkkkkkkk',
  'kSSSSSSSSSSSSk',
  'kSPPPPPPPPPPSk',
  'kSPPPPPPPPPpSk',
  'kSppppppppppSk',
  'kSSSSSSSSSSSSk',
  'kLLLLLLLLLLLLk',
  'kBBBBBBBBBBBBk',
  'kBBbBBBBBBbBBk',
  'kBbbbBBBBbbbBk',
  'kBBbBBBBBBbBBk',
  'kBBBBBBBBBBBBk',
  'kBBBBBbbBBBBBk',
  'kBBBBbbbbBBBBk',
  'kBBBBBbbBBBBBk',
  'kBBBBBBBBBBBBk',
  'kBBbBBBBBBbBBk',
  'kBbbbBBBBbbbBk',
  'kBBbBBBBBBbBBk',
  'kBBBBBBBBBBBBk',
  'kbbbbbbbbbbbbk',
  'kkkkkkkkkkkkkk',
  'kWWWWWWWWWWWWk',
  'kwwwwwwwwwwwwk',
  '.kkkkkkkkkkkk.',
];
const BED_C = {
  k: 0x404048, W: 0xc88c50, w: 0x946030, S: 0xf0f0f8, P: 0xf8f8f8, p: 0xc8d0e0,
  L: 0x90b0f0, B: 0x5878d0, b: 0x3858a8,
};

function bed(g, px, py, x, y = 0, at = () => undefined) {
  floor(g, px, py, x, y);
  if (at(x, y - 1) === 'L') return;                                 // dessiné depuis la case du haut
  g.fillStyle(0x000000, 0.18);                                       // ombre au pied
  g.fillRect(px + 2, py + 30, 13, 2);
  BED.forEach((row, ry) => [...row].forEach((c, rx) => {
    if (c !== '.') rect(g, BED_C[c], px + 1 + rx, py + 2 + ry, 1, 1);
  }));
}

// Plante verte en pot (feuillage qui dépasse sur la case du dessus).
function plant(g, px, py, x, y) {
  floor(g, px, py, x, y);
  g.fillStyle(0x000000, 0.2);
  g.fillRect(px + 3, py + 14, 10, 2);
  rect(g, 0x6c3018, px + 4, py + 9, 8, 6);                          // pot
  rect(g, 0xc86838, px + 5, py + 9, 6, 5);
  rect(g, 0xe08850, px + 5, py + 9, 6, 1);
  const K = 0x1c5028;
  for (const [lx, ly, w, h] of [[2, -2, 5, 6], [9, -3, 5, 7], [5, -5, 6, 7], [1, 3, 5, 5], [10, 3, 5, 5], [5, 2, 6, 7]]) {
    rect(g, K, px + lx, py + ly, w, h);
    rect(g, 0x48a048, px + lx + 1, py + ly + 1, w - 2, h - 2);
    rect(g, 0x78c860, px + lx + 1, py + ly + 1, w - 3, 1);
  }
}

// Lampe sur pied (abat-jour clair, halo).
function floorLamp(g, px, py, x, y) {
  floor(g, px, py, x, y);
  g.fillStyle(0xfff0b0, 0.18);                                       // halo
  g.fillCircle(px + 8, py - 1, 8);
  g.fillStyle(0x000000, 0.2);
  g.fillRect(px + 4, py + 14, 8, 2);
  rect(g, 0x303038, px + 5, py + 13, 6, 2);                          // socle
  rect(g, 0x505060, px + 7, py + 1, 2, 12);                          // pied
  rect(g, 0x6c5c40, px + 3, py - 6, 10, 8);                          // abat-jour
  rect(g, 0xf8e8b0, px + 4, py - 5, 8, 6);
  rect(g, 0xfff8e0, px + 4, py - 5, 3, 6);
  rect(g, 0xd8c890, px + 4, py + 0, 8, 1);
}

// Bureau en bois avec lampe de bureau et livres.
function desk(g, px, py, x, y) {
  floor(g, px, py, x, y);
  const K = 0x503018;
  g.fillStyle(0x000000, 0.18);
  g.fillRect(px + 1, py + 14, 15, 2);
  rect(g, K, px, py + 1, S, 13);
  rect(g, 0xc88850, px + 1, py + 2, 14, 5);                          // plateau
  rect(g, 0xe0a870, px + 1, py + 2, 14, 1);
  rect(g, 0x985c30, px + 1, py + 7, 14, 6);                          // façade
  rect(g, 0xb87440, px + 2, py + 8, 6, 4);                           // tiroir
  rect(g, 0xf0c848, px + 4, py + 10, 2, 1);
  rect(g, 0xd84838, px + 10, py - 1, 2, 4);                          // livres
  rect(g, 0x3868c8, px + 12, py, 2, 3);
  rect(g, 0x48a048, px + 14, py - 1, 1, 4);
  rect(g, 0x303038, px + 3, py - 1, 1, 4);                           // lampe de bureau
  rect(g, 0x303038, px + 2, py - 3, 4, 2);
  rect(g, 0xf8e070, px + 3, py - 1, 2, 1);
}

// Télévision sur un meuble bas, avec une console (clin d'œil à Rouge Feu).
function tv(g, px, py, x, y) {
  floor(g, px, py, x, y);
  const K = 0x282830;
  rect(g, 0x503018, px, py + 8, S, 8);                               // meuble
  rect(g, 0xb07840, px + 1, py + 9, 14, 6);
  rect(g, 0xc88850, px + 1, py + 9, 14, 1);
  rect(g, K, px + 1, py - 4, 14, 13);                                // écran
  rect(g, 0x606878, px + 2, py - 3, 12, 11);
  rect(g, 0x3c5c90, px + 3, py - 2, 10, 8);
  rect(g, 0x88b8f0, px + 4, py - 1, 3, 2);
  rect(g, 0x9ca4b0, px + 5, py + 12, 6, 2);                          // console
  rect(g, 0x4858a0, px + 6, py + 12, 2, 1);
}

// Canapé (se prolonge avec les cases voisines).
function sofa(g, px, py, x, y, at) {
  floor(g, px, py, x, y);
  const K = 0x1c3c48;
  const l = at(x - 1, y) === 'σ';
  const r = at(x + 1, y) === 'σ';
  g.fillStyle(0x000000, 0.18);
  g.fillRect(px + 1, py + 14, 15, 2);
  rect(g, K, px + (l ? 0 : 1), py + 1, S - (l ? 0 : 1) - (r ? 0 : 1), 14);
  rect(g, 0x3c8c9c, px + (l ? 0 : 2), py + 2, S - (l ? 0 : 2) - (r ? 0 : 2), 6);   // dossier
  rect(g, 0x5cacbc, px + (l ? 0 : 2), py + 2, S - (l ? 0 : 2) - (r ? 0 : 2), 1);
  rect(g, 0x48a0b0, px + (l ? 0 : 2), py + 8, S - (l ? 0 : 2) - (r ? 0 : 2), 5);   // assise
  rect(g, 0x70c0cc, px + 4, py + 9, 7, 2);                           // coussin
  if (!l) rect(g, 0x2c7080, px + 1, py + 5, 2, 9);                   // accoudoirs
  if (!r) rect(g, 0x2c7080, px + S - 3, py + 5, 2, 9);
}

// Canapé vu de dos (tourné vers le haut, face à la télé) : assise en haut, dossier haut en bas.
function sofaBack(g, px, py, x, y, at) {
  floor(g, px, py, x, y);
  const K = 0x1c3c48;
  const l = at(x - 1, y) === 'ς';
  const r = at(x + 1, y) === 'ς';
  const x0 = l ? 0 : 1;
  const w = S - x0 - (r ? 0 : 1);
  g.fillStyle(0x000000, 0.2);
  g.fillRect(px + x0, py + 15, w, 1);
  rect(g, K, px + x0, py + 2, w, 13);
  rect(g, 0x48a0b0, px + x0 + (l ? 0 : 1), py + 3, w - (l ? 0 : 1) - (r ? 0 : 1), 4);   // assise
  rect(g, 0x70c0cc, px + x0 + (l ? 0 : 1), py + 3, w - (l ? 0 : 1) - (r ? 0 : 1), 1);
  rect(g, 0x3c8c9c, px + x0 + (l ? 0 : 1), py + 7, w - (l ? 0 : 1) - (r ? 0 : 1), 7);   // dossier
  rect(g, 0x5cacbc, px + x0 + (l ? 0 : 1), py + 7, w - (l ? 0 : 1) - (r ? 0 : 1), 1);
  rect(g, 0x2c7080, px + x0 + (l ? 0 : 1), py + 11, w - (l ? 0 : 1) - (r ? 0 : 1), 1);   // coutures
  if (!l) rect(g, 0x2c7080, px + 1, py + 2, 2, 12);                  // accoudoirs
  if (!r) rect(g, 0x2c7080, px + S - 3, py + 2, 2, 12);
}

// Tapis à motif (on marche dessus), bordure là où il s'arrête.
function rug(g, px, py, x, y, at) {
  const is = (dx, dy) => at(x + dx, y + dy) === 'ρ';
  rect(g, 0xc84848, px, py, S, S);
  for (let i = 0; i < 4; i++) rect(g, 0xe07060, px + 4 + (i % 2) * 6, py + 3 + Math.floor(i / 2) * 7, 2, 2);
  rect(g, 0xf0c060, px + 7, py + 7, 2, 2);
  const border = (horizontal, pos) => {
    if (horizontal) { rect(g, 0x882828, px, py + pos, S, 2); rect(g, 0xf0c060, px, py + pos + (pos ? -1 : 2), S, 1); }
    else { rect(g, 0x882828, px + pos, py, 2, S); rect(g, 0xf0c060, px + pos + (pos ? -1 : 2), py, 1, S); }
  };
  if (!is(0, -1)) border(true, 0);
  if (!is(0, 1)) border(true, S - 2);
  if (!is(-1, 0)) border(false, 0);
  if (!is(1, 0)) border(false, S - 2);
}

// Escalier : vers le haut (marches qui montent contre le mur) ou vers le bas (trémie sombre).
// Escaliers façon Rouge Feu, sur une case contre le mur du fond.
// Qui monte (16 x 48 px : la case et les deux rangées de mur au-dessus) : ouverture sombre dans le mur,
// limons de bois, marches claires qui s'assombrissent en s'enfonçant dans l'ouverture.
// Qui descend (16 x 20 px : la case, 4 px sur le mur) : trémie cerclée de bois, marches qui plongent
// vers le noir.
const STAIRS_K = 0x302820;
function stairsInside(g, px, py, x, y, up) {
  floor(g, px, py, x, y);
  const R = (c, dx, dy, w, h) => rect(g, c, px + dx, py + dy, w, h);
  if (up) {
    const top = -2 * S;
    R(STAIRS_K, 0, top + 4, S, 3 * S - 4);                           // contour de l'ouverture
    R(0x181418, 1, top + 5, S - 2, 2 * S);                           // fond sombre
    const treads = [0x2c2418, 0x4c3c28, 0x6c5434, 0x8c6c40, 0xac8850, 0xc8a060, 0xdcb470, 0xe8c888, 0xf0d8a0];
    treads.forEach((c, i) => {
      const ly = top + 12 + i * 4;
      R(c, 3, ly, 10, 3);                                           // marche
      R(i < 4 ? 0x100c10 : 0x8c6030, 3, ly + 3, 10, 1);             // contremarche
    });
    R(0x6c4420, 1, top + 8, 2, 2 * S + 8);                           // limons
    R(0x6c4420, S - 3, top + 8, 2, 2 * S + 8);
    R(0xa06c38, 1, S - 12, 2, 12);
    R(0xa06c38, S - 3, S - 12, 2, 12);
    g.fillStyle(0x000000, 0.18);                                     // ombre au pied
    g.fillRect(px + 1, py + S - 1, S - 2, 1);
  } else {
    R(STAIRS_K, 0, -4, S, S + 4);                                    // cadre de bois
    R(0x946030, 1, -3, S - 2, 2);
    const treads = [0xf0d8a0, 0xd8b478, 0xb08c58, 0x886840, 0x604a2c, 0x3c2c1c];
    treads.forEach((c, i) => {
      R(c, 2, -1 + i * 3, S - 4, 2);                                  // marche
      R(0x181410, 2, 1 + i * 3, S - 4, 1);
    });
    R(0x6c4420, 1, -1, 1, S);                                        // bords de la trémie
    R(0x6c4420, S - 2, -1, 1, S);
  }
}

// Plan de travail de cuisine : évier ou plaques, selon la case.
function counter(g, px, py, x, y) {
  floor(g, px, py, x, y);
  rect(g, 0x484858, px, py - 2, S, 17);
  rect(g, 0xe8ecf0, px, py - 1, S, 7);                               // plan
  rect(g, 0xffffff, px, py - 1, S, 1);
  rect(g, 0xb8c0cc, px, py + 6, S, 8);                               // façade
  rect(g, 0x9098a8, px + 7, py + 7, 1, 6);
  if (x % 2) {
    rect(g, 0x7888a0, px + 3, py + 1, 10, 4);                        // évier
    rect(g, 0xa8c8e8, px + 4, py + 2, 8, 2);
    rect(g, 0x9098a8, px + 7, py - 2, 2, 2);
  } else {
    for (const cx of [3, 9]) { rect(g, 0x303038, px + cx, py + 1, 4, 3); rect(g, 0xd84838, px + cx + 1, py + 2, 2, 1); }
  }
}

// Réfrigérateur (dépasse sur le mur).
function fridge(g, px, py, x, y) {
  floor(g, px, py, x, y);
  g.fillStyle(0x000000, 0.2);
  g.fillRect(px + 2, py + 15, 13, 1);
  rect(g, 0x484858, px + 1, py - 9, 14, 24);
  rect(g, 0xf0f4f8, px + 2, py - 8, 12, 22);
  rect(g, 0xd0d8e0, px + 11, py - 8, 3, 22);
  rect(g, 0x9098a8, px + 2, py - 1, 12, 1);
  rect(g, 0x707888, px + 3, py - 5, 1, 3);                           // poignées
  rect(g, 0x707888, px + 3, py + 2, 1, 4);
  rect(g, 0xf06060, px + 7, py - 6, 2, 2);                           // aimant
}

function exitMat(g, px, py, x) {
  floor(g, px, py, x);
  rect(g, 0x882028, px + 1, py + 2, 14, 12);
  rect(g, 0xd84848, px + 2, py + 3, 12, 10);
  for (let i = 0; i < 12; i += 3) rect(g, 0xf0d060, px + 2 + i, py + 5, 2, 6);
}

export function drawTile(g, code, x, y, at, fallbackColor) {
  const px = x * S;
  const py = y * S;
  switch (code) {
    case 'P': return path(g, px, py, x, y);
    case '.': return grass(g, px, py, x, y, at);
    case 'T':
      return treeGround(g, px, py, x, y, at);            // le sapin est un objet haut (voir tallObject)
    case '~': return water(g, px, py, x, y, at);
    case 'f': grass(g, px, py, x, y, at); return flowerPatch(g, px, py, x, y);
    case 'F': grass(g, px, py, x, y, at); return fence(g, px, py, x, y, at);
    case 'S': grass(g, px, py, x, y, at); return sign(g, px, py);
    case 'M': grass(g, px, py, x, y, at); return mailbox(g, px, py);
    case 's': return sand(g, px, py, x, y);
    case 'w': return sea(g, px, py, x, y, at);
    case 'ø': return seaRock(g, px, py, x, y);
    case 'ç': return pavement(g, px, py, x, y, at);
    case 'ł': return logFence(g, px, py, x, y, at);
    case 'ν': return vegetablePatch(g, px, py, x, y);
    case 'ʂ': return starfish(g, px, py, x, y);
    case 'ɕ': return shell(g, px, py, x, y);
    case 'ƥ': return parasol(g, px, py, x, y);
    case 'ʈ': return deckchair(g, px, py, x, y);
    case 'ψ': return fishingRods(g, px, py, x, y);
    case 'χ': return fishCrate(g, px, py, x, y);
    case 'ʁ': return giveCrate(g, px, py, x, y);
    case 'ʀ': return planksPile(g, px, py);
    case 'ʕ': return railEmbankment(g, px, py, x, y, at);
    case 'ɓ': return bollard(g, px, py);
    case 'ĉ': return cliff2(g, px, py, x, y, at);
    case 'ŝ': return stairs(g, px, py, x, y, at);
    case '=': return pier(g, px, py, x, y, at);
    case 'Y': return palm(g, px, py, x, y, at);
    case 'B': // le bateau est dessiné par-dessus (buildingArt) ; eau d'étang ou de mer dessous
      if (groundProvided) return undefined;                           // eau Rouge Feu déjà posée
      return [at(x - 1, y), at(x + 1, y), at(x, y - 1), at(x, y + 1)].includes('~')
        ? water(g, px, py, x, y, at)
        : sea(g, px, py, x, y, at);
    case 'C': return cobble(g, px, py, x, y);
    case 'K': return rampart(g, px, py, x, y, at);
    case 'U': return well(g, px, py, x, y, at);
    case 'O': return barrel(g, px, py, x, y, at);
    case 'N': return blackboard(g, px, py, x, y, at);
    case 'Z': return barracksWall(g, px, py, x, y, at);
    case 'G': return river(g, px, py, x, y, at);
    case 'b': return phoneBooth(g, px, py, x, y, at);
    case 'x': return bamboo(g, px, py, x, y, at);
    case 'n': return lantern(g, px, py, x, y, at);
    case 'v': return vietnamFlag(g, px, py, x, y, at);
    case 'k': return lotus(g, px, py, x, y, at);
    case 'r': return redBridge(g, px, py, x, y, at);
    case 't': return foodStall(g, px, py, x, y, at);
    case 'y': return scooter(g, px, py, x, y, at);
    case 'c': return bicycles(g, px, py, x, y, at);
    case 'h': return tulips(g, px, py, x, y, at);
    case 'e': return dutchFlag(g, px, py, x, y, at);
    case 'a': return cow(g, px, py, x, y, at);
    case 'd': return tukTuk(g, px, py, x, y, at);
    case 'g': return indianFlag(g, px, py, x, y, at);
    case 'i': return marigolds(g, px, py, x, y, at);
    case 'p': return spiceStall(g, px, py, x, y, at);
    case 'u': return computer(g, px, py, x);
    case '^': return dune(g, px, py, x, y, at);
    case 'H': return camel(g, px, py, x, y, at);
    case 'z': return snake(g, px, py, x, y, at);
    case '*': return cactus(g, px, py, x, y, at);
    case '&': return campfire(g, px, py, x, y, at);
    case '_': return terminalFloor(g, px, py, x, y);
    case '|': return glassWall(g, px, py);
    case '#': return checkinCounter(g, px, py, x, y);
    case '%': return seats(g, px, py, x, y);
    case '@': return departuresBoard(g, px, py, x, y);
    case '$': return cafeTable(g, px, py, x, y, at);
    case '!': return metroEntrance(g, px, py, x, y, at);
    case '>': return airportSign(g, px, py, x, y, at, true);
    case '<': return airportSign(g, px, py, x, y, at, false);
    case '+': return podium(g, px, py, x, y, at);
    case '¤': return elevator(g, px, py, x, y, at);
    case '£': return cliff(g, px, py, x, y, at);
    case '§': return caminoMarker(g, px, py, x, y, at);
    case '▲': return mountainRock(g, px, py, x, y, at);
    case '♣': return maquis(g, px, py, x, y, at);
    case '¢': return goat(g, px, py, x, y, at);
    case '≈': return ricePaddy(g, px, py, x, y);
    case 'ē': return redEarth(g, px, py, x, y);
    case '♠': return teaBush(g, px, py, x, y, at);
    case '€': return elephant(g, px, py, x, y, at);
    case 'þ': return thaiFlag(g, px, py, x, y, at);
    case '¥': return wheat(g, px, py, x, y);
    case 'ĥ': return tallGrass(g, px, py, x, y, at);
    case 'ƀ': return bush(g, px, py, x, y, at);
    case 'ŕ': return beachRock(g, px, py, x, y, at);
    case 'ƒ': return smallFlowers(g, px, py, x, y, at);
    case 'ñ': return snow(g, px, py, x, y);
    case 'Ñ': return snowyPeak(g, px, py, x, y);
    case '¶': return prayerFlags(g, px, py, x, y, at);
    case 'ň': return nepalFlag(g, px, py, x, y, at);
    case 'ɸ': return martiniqueFlag(g, px, py, x, y, at);
    case 'j': return unionJack(g, px, py, x, y, at);
    case 'l': return lamppost(g, px, py, x, y, at);
    case 'q': return rect(g, 0x6c7074, px, py, S, S);   // bus dessiné par-dessus (buildingArt)
    case 'I': return bridge(g, px, py, x, y, at);
    case 'A': return asphalt(g, px, py, x, y, at);
    case 'J': return flagpole(g, px, py, x, y, at);
    case 'Q': return sandbags(g, px, py, x, y, at);
    case 'V': return crate(g, px, py, x, y, at);
    case 'o': return floor(g, px, py, x, y);
    case 'X': return innerWall(g, px, py, x, y, at);
    case 'm': return furniture(g, px, py, x, y, at);
    case 'E': return exitMat(g, px, py, x);
    case 'L': return bed(g, px, py, x, y, at);
    case 'π': return plant(g, px, py, x, y);
    case 'λ': return floorLamp(g, px, py, x, y);
    case 'δ': return desk(g, px, py, x, y);
    case 'τ': return tv(g, px, py, x, y);
    case 'σ': return sofa(g, px, py, x, y, at);
    case 'ς': return sofaBack(g, px, py, x, y, at);
    case 'ρ': return rug(g, px, py, x, y, at);
    case 'η': return stairsInside(g, px, py, x, y, true);
    case 'ξ': return stairsInside(g, px, py, x, y, false);
    case 'κ': return counter(g, px, py, x, y);
    case 'φ': return fridge(g, px, py, x, y);
    case 'R':
    case 'W':
    case 'D':
      // Recouverts par le dessin du bâtiment : on met dessous le sol voisin,
      // visible dans les petits interstices (bord du toit…).
      return groundUnderBuilding(g, px, py, x, y, at);
    default:
      rect(g, fallbackColor, px, py, S, S);
  }
}

// Sol sous un bâtiment (visible dans les interstices) : celui qui domine autour.
function groundUnderBuilding(g, px, py, x, y, at) {
  if (groundProvided) return;                                          // sol Rouge Feu déjà posé
  const BUILDING = ['R', 'W', 'D'];
  // Dans chaque direction, le premier vrai sol rencontré (arbres et baies vitrées ignorés) : on vote.
  const around = [];
  for (const [dx, dy] of [[0, -1], [0, 1], [-1, 0], [1, 0]]) {
    for (let d = 1; d < 12; d++) {
      const c = at(x + dx * d, y + dy * d);
      if (!c) break;
      if (BUILDING.includes(c) || ['T', 'Y', '|'].includes(c)) continue;
      around.push({ c, x: x + dx * d, y: y + dy * d });
      break;
    }
  }
  const kind = ({ c, x: nx, y: ny }) => {
    if (['~', 'k'].includes(c)) return 'water';
    if (SMALL_OBJECTS.has(c)) return objectGround(nx, ny, at);
    if (c === 'C') return 'cobble';
    if (c === 'ç') return 'pavement';
    if (c === 'A') return 'asphalt';
    if (['s', '^'].includes(c)) return 'sand';
    if (c === '_') return 'terminal';
    if (c === 'ē') return 'earth';
    if (isGrassy(nx, ny, at)) return 'grass';
    return 'path';
  };
  const counts = {};
  around.forEach((n) => { counts[kind(n)] = (counts[kind(n)] ?? 0) + 1; });
  if ((counts.water ?? 0) * 2 >= around.length) return water(g, px, py, x, y, at);
  // Le plus fréquent ; à égalité : herbe, puis pavés, puis asphalte, puis chemin.
  const best = ['grass', 'pavement', 'cobble', 'sand', 'earth', 'asphalt', 'terminal', 'path'].reduce((a, b) => ((counts[b] ?? 0) > (counts[a] ?? 0) ? b : a));
  if (best === 'grass') return rect(g, C.grass, px, py, S, S);
  if (best === 'sand') return sand(g, px, py, x, y);
  if (best === 'pavement') return pavement(g, px, py, x, y, () => 'ç');
  if (best === 'terminal') return terminalFloor(g, px, py, x, y);
  if (best === 'earth') return redEarth(g, px, py, x, y);
  if (best === 'cobble') return cobble(g, px, py, x, y);
  if (best === 'asphalt') return rect(g, 0x6c7074, px, py, S, S);
  path(g, px, py, x, y);
}
