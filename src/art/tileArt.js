import { TILE_SIZE as S } from '../data/tiles.js';
import { rect, sprite, hash } from './pixel.js';

// Dessin procédural de chaque tuile (16x16), dans l'esprit de Rouge Feu.
// `at(x, y)` renvoie le code de la case voisine (undefined hors carte).

const C = {
  path: 0xb0e2c0, pathDot: 0xc8f0d4,
  grass: 0x90d49c, grassTuft: 0x70bc80, grassEdge: 0xc8f4d4, grassEdge2: 0xa8e2b4,
  water: 0x4888e8, waterDeep: 0x3870d0, waterWave: 0x98c4f8,
  rim: 0xa85838, rimLight: 0xe0a070,
};

// Cases considérées comme « pelouse » pour le liseré clair des zones d'herbe.
const GRASSY = new Set(['.', 'f', 'h', 'i', '♣', '≈', '♠', '¥', 'F', 'S', 'M', 'R', 'W', 'D', 'U', 'O', 'Q', 'V', 'x']);

// Petits objets posés au sol (lanterne, drapeau, cabine…) : leur sol est celui de leurs voisins.
const SMALL_OBJECTS = new Set(['b', 'j', 'l', 'n', 'v', 't', 'y', 'c', 'e', 'a', 'd', 'g', 'p', 'H', 'z', '*', '&', '$', '!', '>', '<', '§', '¢', '€', 'þ', '¶', 'ň']);

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

const TREE = [
  '.....kkkkkk.....',
  '...kkmmllmmkk...',
  '..kmmllhhllmmk..',
  '.kdmmllhhllmmdk.',
  '.kdmmmllllmmmdk.',
  'kddkmmmmmmmmkddk',
  'kdmmkkmmmmkkmmdk',
  'kdmmllkmmkllmmdk',
  'kddmmllmmllmmddk',
  'kdddmmmmmmmmdddk',
  '.kddkkmmmmkkddk.',
  '.kdddddkkdddddk.',
  '..kkddddddddkk..',
  '....kkkttkkk....',
  '......kttk......',
  '......kkkk......',
];
const TREE_PAL = { k: 0x1c4a2c, d: 0x2c6c3c, m: 0x3c8c4c, l: 0x5cac5c, h: 0x94d484, t: 0x6c4c2c };

const PALM = [
  '....kkk..kkk....',
  '..kkllgkkgllkk..',
  '.kllggllllggllk.',
  'kllgkkgllgkkgllk',
  'kgk..kgccgk..kgk',
  'kk..kglccglk..kk',
  '...kgk.tT.kgk...',
  '...kk..tT..kk...',
  '.......tT.......',
  '......tT........',
  '......tT........',
  '......tT........',
  '.....tTT........',
  '.....tT.........',
  '....sttTs.......',
  '.....sss........',
];
const PALM_PAL = { k: 0x1c4a2c, g: 0x3c9c4c, l: 0x78cc60, c: 0x6c4020, t: 0xa87848, T: 0x6c4424 };

const FLOWER = [
  '................',
  '....RRR..RRR....',
  '...RWWRRRWWRR...',
  '...RWRRRRRRRD...',
  '....RRRYYRRD....',
  '..RRRRYYYYRRRR..',
  '.RWWRRYYYYRRRRD.',
  '.RWRRRRYYRRRRRD.',
  '..RRRDRRRRDRRD..',
  '...RRDRRRRRDD...',
  '....DDRRRRDD....',
  '..GG..DDDD..GG..',
  '.GGGG..gg..GGGG.',
  '..GGGg.gg.gGGG..',
  '....ggggggg.....',
];
const FLOWER_PAL = { R: 0xe83838, D: 0xa82020, W: 0xf8f8f8, Y: 0xf8d030, G: 0x48a848, g: 0x2f7f3f };

function path(g, px, py, x, y) {
  rect(g, C.path, px, py, S, S);
  const h = hash(x, y);
  rect(g, C.pathDot, px + (h % 13) + 1, py + ((h >> 4) % 13) + 1, 1, 1);
  rect(g, C.pathDot, px + ((h >> 8) % 13) + 1, py + ((h >> 12) % 13) + 1, 2, 1);
}

function grass(g, px, py, x, y, at) {
  rect(g, C.grass, px, py, S, S);
  const h = hash(x, y, 1);
  for (let i = 0; i < 2; i++) {
    const tx = px + ((h >> (i * 8)) % 11) + 2;
    const ty = py + ((h >> (i * 8 + 4)) % 11) + 3;
    rect(g, C.grassTuft, tx, ty, 1, 2);
    rect(g, C.grassTuft, tx + 2, ty, 1, 2);
    rect(g, C.grassTuft, tx + 1, ty + 1, 1, 2);
  }
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

function barrel(g, px, py, x, y, at) {
  grass(g, px, py, x, y, at);
  rect(g, 0x4c2c14, px + 3, py + 2, 10, 13);
  rect(g, 0x4c2c14, px + 2, py + 4, 12, 9);
  rect(g, 0xa86c34, px + 4, py + 3, 8, 11);
  rect(g, 0xa86c34, px + 3, py + 5, 10, 7);
  rect(g, 0xc88c4c, px + 4, py + 3, 8, 2);
  rect(g, 0x707078, px + 3, py + 6, 10, 1);             // cerclages
  rect(g, 0x707078, px + 3, py + 11, 10, 1);
  rect(g, 0x000000, px + 4, py + 15, 8, 1);
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
  if ([at(x - 1, y), at(x + 1, y), at(x, y - 1), at(x, y + 1)].includes('A')) asphalt(g, px, py, x, y, at);
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
  const ground = objectGround(x, y, at);
  if (ground === 'grass') grass(g, px, py, x, y, at);
  else if (ground === 'sand') sand(g, px, py, x, y);
  else if (ground === 'earth') redEarth(g, px, py, x, y);
  else cobble(g, px, py, x, y);
}

// Cabine téléphonique rouge anglaise (vue de dessus, un peu de face).
function phoneBooth(g, px, py, x, y, at) {
  smallObjectGround(g, px, py, x, y, at);
  rect(g, 0x000000, px + 3, py + 15, 10, 1);
  rect(g, 0x701414, px + 3, py + 1, 10, 14);
  rect(g, 0xc82828, px + 4, py + 2, 8, 12);
  rect(g, 0xe84848, px + 4, py + 2, 8, 1);
  rect(g, 0xf0f0e0, px + 5, py + 3, 6, 1);           // bandeau « TELEPHONE »
  rect(g, 0xb8d8f0, px + 5, py + 5, 6, 7);           // vitres
  for (const ly of [7, 9]) rect(g, 0xc82828, px + 5, py + ly, 6, 1);
  rect(g, 0xc82828, px + 7, py + 5, 1, 7);
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

function blackboard(g, px, py, x, y, at) {
  innerWall(g, px, py, x, y, at);
  rect(g, 0x6c4424, px, py + 2, S, 11);
  rect(g, 0x2c4c3c, px, py + 3, S, 9);
  if (hash(x, y, 6) % 2) rect(g, 0xe8e8e0, px + 3, py + 5, 7, 1);
  rect(g, 0xe8e8e0, px + 2, py + 8, 10, 1);
}

function fence(g, px, py, x, y, at) {
  const k = 0x606870, w = 0xf8f8f8, s = 0xb8c0c8;
  const joins = (dx) => ['F', 'S'].includes(at(x + dx, y));
  // Traverses (vers les voisins de clôture)
  for (const ry of [6, 10]) {
    const x0 = joins(-1) ? 0 : 6;
    const x1 = joins(1) ? S : 10;
    rect(g, k, px + x0, py + ry - 1, x1 - x0, 4);
    rect(g, w, px + x0, py + ry, x1 - x0, 1);
    rect(g, s, px + x0, py + ry + 1, x1 - x0, 1);
  }
  // Poteau
  rect(g, k, px + 5, py + 3, 6, 12);
  rect(g, w, px + 6, py + 4, 4, 10);
  rect(g, s, px + 9, py + 4, 1, 10);
  rect(g, 0x78a080, px + 5, py + 15, 6, 1); // ombre
}

function sign(g, px, py) {
  rect(g, 0x5c3818, px + 7, py + 10, 3, 6);            // pied
  rect(g, 0x5c3818, px + 1, py + 2, 14, 10);           // cadre
  rect(g, 0xd8a058, px + 2, py + 3, 12, 8);            // planche
  rect(g, 0xf0c880, px + 2, py + 3, 12, 1);
  rect(g, 0x8c5c28, px + 4, py + 6, 8, 1);             // « texte »
  rect(g, 0x8c5c28, px + 4, py + 8, 6, 1);
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
  rect(g, 0xf2e0a8, px, py, S, S);
  const h = hash(x, y, 3);
  rect(g, 0xdcc488, px + (h % 13) + 1, py + ((h >> 4) % 13) + 1, 1, 1);
  rect(g, 0xdcc488, px + ((h >> 8) % 13) + 1, py + ((h >> 12) % 13) + 1, 2, 1);
  rect(g, 0xfff4d0, px + ((h >> 16) % 13) + 1, py + ((h >> 20) % 13) + 1, 1, 1);
}

// Mer : écume blanche là où l'eau touche la terre (pas le ponton).
function sea(g, px, py, x, y, at) {
  rect(g, 0x3c80e0, px, py, S, S);
  rect(g, 0x3070d0, px, py + 7, S, 1);
  rect(g, 0x3070d0, px, py + 15, S, 1);
  const h = hash(x, y, 4);
  rect(g, 0x88bcf8, px + (h % 8) + 2, py + 3, 4, 1);
  rect(g, 0x88bcf8, px + ((h >> 5) % 8) + 3, py + 11, 3, 1);
  const shore = (dx, dy) => {
    const n = at(x + dx, y + dy);
    return n !== undefined && !['w', '~', '=', 'B'].includes(n);
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
}

function palm(g, px, py, x, y, at) {
  const around = [at(x, y - 1), at(x, y + 1), at(x - 1, y), at(x + 1, y)];
  if (palmOnGrass(x, y, at)) grass(g, px, py, x, y, at);
  else if (around.includes('C') && !around.includes('s')) cobble(g, px, py, x, y);   // palmier en ville
  else sand(g, px, py, x, y);
  // Ombre au pied (semi-transparente)
  g.fillStyle(0x000000, 0.18);
  g.fillRect(px + 4, py + 14, 7, 2);
  sprite(g, PALM, PALM_PAL, px, py); // les 's' du motif restent transparents
}

function floor(g, px, py, x) {
  rect(g, 0xe8c890, px, py, S, S);
  for (const ly of [0, 5, 10, 15]) rect(g, 0xc8a068, px, py + ly, S, 1);
  const off = (x % 2) * 8;
  rect(g, 0xc8a068, px + off, py + 1, 1, 4);
  rect(g, 0xc8a068, px + ((off + 5) % S), py + 6, 1, 4);
  rect(g, 0xc8a068, px + ((off + 11) % S), py + 11, 1, 4);
}

function innerWall(g, px, py, x, y, at) {
  rect(g, 0xd8d0c0, px, py, S, S);
  rect(g, 0xc0b8a8, px, py + 4, S, 1);
  rect(g, 0xc0b8a8, px, py + 10, S, 1);
  // Plinthe au pied du mur, côté pièce
  const below = at(x, y + 1);
  if (below && below !== 'X') rect(g, 0x806850, px, py + S - 3, S, 3);
  else if (at(x, y - 1) && at(x, y - 1) !== 'X') rect(g, 0x806850, px, py, S, 2);
}

function furniture(g, px, py, x) {
  floor(g, px, py, x);
  rect(g, 0x583018, px + 1, py + 2, 14, 13);
  rect(g, 0xa86838, px + 2, py + 3, 12, 11);
  rect(g, 0xc88850, px + 2, py + 3, 12, 3);
  rect(g, 0x583018, px + 7, py + 8, 2, 1);
}

function bed(g, px, py, x) {
  floor(g, px, py, x);
  rect(g, 0x707888, px + 1, py + 1, 14, 15);          // cadre
  rect(g, 0xf8f8f8, px + 2, py + 2, 12, 13);          // drap
  rect(g, 0xe0e8f4, px + 3, py + 3, 10, 4);           // oreiller
  rect(g, 0x6890d8, px + 2, py + 8, 12, 7);           // couverture
  rect(g, 0x88acf0, px + 2, py + 8, 12, 1);
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
      if (treeOnGrass(x, y, at)) grass(g, px, py, x, y, at);
      else if ([at(x - 1, y), at(x + 1, y), at(x, y - 1), at(x, y + 1)].includes('C')) cobble(g, px, py, x, y);
      else path(g, px, py, x, y);
      return sprite(g, TREE, TREE_PAL, px, py);
    case '~': return water(g, px, py, x, y, at);
    case 'f': grass(g, px, py, x, y, at); return sprite(g, FLOWER, FLOWER_PAL, px, py);
    case 'F': grass(g, px, py, x, y, at); return fence(g, px, py, x, y, at);
    case 'S': grass(g, px, py, x, y, at); return sign(g, px, py);
    case 'M': grass(g, px, py, x, y, at); return mailbox(g, px, py);
    case 's': return sand(g, px, py, x, y);
    case 'w': return sea(g, px, py, x, y, at);
    case '=': return pier(g, px, py, x, y, at);
    case 'Y': return palm(g, px, py, x, y, at);
    case 'B': // le bateau est dessiné par-dessus (buildingArt) ; eau d'étang ou de mer dessous
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
    case 'ñ': return snow(g, px, py, x, y);
    case 'Ñ': return snowyPeak(g, px, py, x, y);
    case '¶': return prayerFlags(g, px, py, x, y, at);
    case 'ň': return nepalFlag(g, px, py, x, y, at);
    case 'j': return unionJack(g, px, py, x, y, at);
    case 'l': return lamppost(g, px, py, x, y, at);
    case 'q': return rect(g, 0x6c7074, px, py, S, S);   // bus dessiné par-dessus (buildingArt)
    case 'I': return bridge(g, px, py, x, y, at);
    case 'A': return asphalt(g, px, py, x, y, at);
    case 'J': return flagpole(g, px, py, x, y, at);
    case 'Q': return sandbags(g, px, py, x, y, at);
    case 'V': return crate(g, px, py, x, y, at);
    case 'o': return floor(g, px, py, x);
    case 'X': return innerWall(g, px, py, x, y, at);
    case 'm': return furniture(g, px, py, x);
    case 'E': return exitMat(g, px, py, x);
    case 'L': return bed(g, px, py, x);
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
  const best = ['grass', 'cobble', 'sand', 'earth', 'asphalt', 'terminal', 'path'].reduce((a, b) => ((counts[b] ?? 0) > (counts[a] ?? 0) ? b : a));
  if (best === 'grass') return rect(g, C.grass, px, py, S, S);
  if (best === 'sand') return sand(g, px, py, x, y);
  if (best === 'terminal') return terminalFloor(g, px, py, x, y);
  if (best === 'earth') return redEarth(g, px, py, x, y);
  if (best === 'cobble') return cobble(g, px, py, x, y);
  if (best === 'asphalt') return rect(g, 0x6c7074, px, py, S, S);
  path(g, px, py, x, y);
}
