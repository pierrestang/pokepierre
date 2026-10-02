import { rect, hash } from './pixel.js';

// Intérieur de la cabane des cousins (Saint-Ay), dessiné dans le code : 128 x 128 px (8 x 8 cases), une seule
// image (voir interiors.cabane). Mur du fond en planches avec une fenêtre ouverte sur les feuilles, guirlande de
// fanions, plan de la cabane punaisé, lanterne ; coffre au trésor contre le mur ; coussins des cousins derrière
// une table basse en planches posée sur deux caisses ; caisse de BD, corde enroulée, trappe de l'échelle.
// La table est aussi une image à part (CABANE_TABLE), redessinée par-dessus les cousins assis derrière.

export const CABANE_ROOM = 'cabane-room';
export const CABANE_TABLE = 'cabane-table';
export const TABLE_Y = 42;            // haut de l'image de la table (pixels de la pièce)
export const TABLE_H = 22;

const K = 0x403020;
const FLOOR = [0xe8b070, 0xd8a060, 0xd09458];
const WALL = [0xc87848, 0xb86c40, 0xa86038];

function floor(g) {
  for (let row = 0; row * 7 < 128; row++) {
    const y = 34 + row * 7;
    const c = FLOOR[row % 3];
    rect(g, c, 0, y, 128, 7);
    rect(g, 0xf0c888, 0, y, 128, 1);                                   // arête éclairée
    rect(g, 0x9c6430, 0, y + 6, 128, 1);                               // joint
    for (let x = (row * 37) % 29; x < 128; x += 29 + (row % 3) * 6) {
      rect(g, 0x9c6430, x, y + 1, 1, 5);                               // bout de planche
      rect(g, 0x7c4c24, x + 3, y + 3, 1, 1);                           // clou
    }
  }
}

function backWall(g) {
  for (let row = 0; row < 6; row++) {
    const y = row * 6;
    rect(g, WALL[row % 3], 0, y, 128, 6);
    rect(g, 0xd88c58, 0, y, 128, 1);
    rect(g, 0x784028, 0, y + 5, 128, 1);
    for (let x = (row % 2) * 16 + 10; x < 128; x += 32) rect(g, 0x784028, x, y + 1, 1, 4);
  }
  rect(g, 0x6c3c20, 0, 32, 128, 3);                                    // plinthe
  rect(g, K, 0, 35, 128, 1);
  // Poteaux d'angle.
  for (const x of [0, 122]) {
    rect(g, 0x8c5030, x, 0, 6, 128);
    rect(g, 0xa86440, x + 1, 0, 1, 128);
    rect(g, K, x === 0 ? 6 : 121, 0, 1, 128);
  }
}

// Fenêtre ouverte : feuillage et ciel, montants en bois.
function window_(g) {
  const x0 = 50;
  const y0 = 5;
  const w = 28;
  const h = 21;
  rect(g, K, x0 - 1, y0 - 1, w + 2, h + 2);
  rect(g, 0xb8e0f8, x0, y0, w, h);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const n = hash(x >> 1, y >> 1, 7) % 100;
      if (n < 55 || y > h - 6) rect(g, n % 3 === 0 ? 0x386c28 : n % 3 === 1 ? 0x58a040 : 0x80c058, x0 + x, y0 + y, 1, 1);
    }
  }
  rect(g, 0x9c6434, x0, y0 + 9, w, 2);                                 // traverse
  rect(g, 0x9c6434, x0 + 13, y0, 2, h);                                // montant
  rect(g, 0xd09458, x0 - 2, y0 + h, w + 4, 2);                          // appui
  rect(g, K, x0 - 2, y0 + h + 2, w + 4, 1);
}

// Guirlande de fanions, plan punaisé, lanterne.
function wallDecor(g) {
  const flags = [0xe04838, 0xf0c030, 0x3878d8, 0x48a848];
  for (let x = 9; x < 46; x++) rect(g, 0x5c3c20, x, 4 + Math.round(Math.sin(((x - 9) / 37) * Math.PI) * 3), 1, 1);
  for (let i = 0; i < 6; i++) {
    const x = 11 + i * 6;
    const y = 5 + Math.round(Math.sin(((x - 9) / 37) * Math.PI) * 3);
    for (let r = 0; r < 5; r++) rect(g, flags[i % 4], x + Math.floor(r / 2), y + r, 5 - 2 * Math.floor(r / 2), 1);
  }
  // Plan de la cabane : feuille, dessin bleu d'une cabane dans un arbre, punaise rouge.
  rect(g, K, 87, 9, 20, 17);
  rect(g, 0xf8f4e8, 88, 10, 18, 15);
  rect(g, 0x3c64c0, 95, 13, 6, 1);
  rect(g, 0x3c64c0, 94, 14, 8, 1);
  rect(g, 0x3c64c0, 95, 15, 1, 4);
  rect(g, 0x3c64c0, 100, 15, 1, 4);
  rect(g, 0x3c64c0, 95, 18, 6, 1);
  rect(g, 0x3c64c0, 97, 19, 2, 5);
  rect(g, 0x48a848, 90, 21, 4, 3);
  rect(g, 0xd83828, 96, 9, 2, 2);
  // Lanterne suspendue.
  rect(g, 0x5c3c20, 114, 0, 1, 8);
  rect(g, K, 111, 8, 7, 11);
  rect(g, 0xf8e070, 112, 10, 5, 7);
  rect(g, 0xfff8c8, 113, 11, 2, 3);
  rect(g, 0x6c4c2c, 111, 8, 7, 2);
  rect(g, 0x6c4c2c, 111, 17, 7, 2);
}

// Coffre au trésor contre le mur (cases 3-4 de la rangée 2).
function chest(g) {
  g.fillStyle(0x000000, 0.2);
  g.fillRect(52, 46, 26, 2);
  rect(g, K, 51, 29, 26, 18);
  rect(g, 0xb87440, 52, 30, 24, 7);                                    // couvercle
  rect(g, 0xd89458, 52, 30, 24, 1);
  rect(g, 0x8c5028, 52, 37, 24, 9);                                    // caisse
  rect(g, K, 52, 37, 24, 1);
  for (const x of [56, 70]) rect(g, 0xa8a8b0, x, 30, 2, 16);           // ferrures
  rect(g, 0xf0c838, 62, 36, 4, 5);                                     // serrure
  rect(g, K, 63, 38, 2, 2);
}

// Coussins où les cousins s'assoient (cases 1, 2, 5, 6 de la rangée 2).
function cushions(g) {
  const colors = [0xd84848, 0x3c78d0, 0x48a848, 0xe8b830];
  [1, 2, 5, 6].forEach((col, i) => {
    const x = col * 16 + 2;
    rect(g, K, x, 40, 12, 7);
    rect(g, K, x - 1, 41, 14, 5);
    rect(g, colors[i], x, 41, 12, 5);
    rect(g, 0xffffff, x + 2, 41, 4, 1);
  });
}

// Table basse : une grande planche sur deux caisses, cartes, lampe de poche et plan posés dessus.
// Dessinée à (0, oy) : la pièce l'a en TABLE_Y, l'image à part en 0.
export function drawTable(g, oy = TABLE_Y) {
  const y = oy;
  g.fillStyle(0x000000, 0.22);
  g.fillRect(8, y + TABLE_H - 1, 114, 2);
  // Caisses-pieds.
  for (const x of [10, 104]) {
    rect(g, K, x - 1, y + 9, 16, 13);
    rect(g, 0xb87c44, x, y + 10, 14, 11);
    rect(g, 0x8c5c30, x, y + 14, 14, 1);
    rect(g, 0x8c5c30, x, y + 18, 14, 1);
    for (let i = 0; i < 11; i++) rect(g, 0x8c5c30, x + Math.round((i * 13) / 10), y + 10 + i, 1, 1);
  }
  // Plateau.
  rect(g, K, 5, y + 1, 118, 10);
  rect(g, K, 6, y, 116, 12);
  rect(g, 0xe8b070, 6, y + 1, 116, 6);
  rect(g, 0xf8d098, 6, y + 1, 116, 1);
  rect(g, 0xb87c44, 6, y + 7, 116, 4);                                 // chant
  for (const x of [44, 84]) rect(g, 0xa86c38, x, y + 1, 1, 6);          // planches
  // Objets posés : cartes, lampe de poche, plan.
  rect(g, K, 33, y + 2, 7, 5);
  rect(g, 0xf8f8f8, 34, y + 3, 5, 3);
  rect(g, 0xd83828, 36, y + 4, 1, 1);
  rect(g, 0x3c64c0, 61, y + 3, 7, 3);
  rect(g, 0xf8e070, 68, y + 3, 2, 3);
  rect(g, 0xf8f4e8, 90, y + 2, 9, 5);
  rect(g, 0x3c64c0, 92, y + 4, 5, 1);
}

// Caisse de BD (case 7 de la rangée 4).
function comicsCrate(g) {
  g.fillStyle(0x000000, 0.2);
  g.fillRect(108, 79, 14, 2);
  rect(g, K, 106, 65, 16, 15);
  rect(g, 0xb87c44, 107, 69, 14, 10);
  rect(g, 0x8c5c30, 107, 73, 14, 1);
  rect(g, 0xe04838, 108, 66, 4, 3);
  rect(g, 0x3878d8, 112, 65, 4, 4);
  rect(g, 0xf0c030, 116, 66, 4, 3);
}

// Corde enroulée sur le plancher (case 0 de la rangée 6).
function rope(g) {
  for (const [w, h, c] of [[14, 8, 0xc8a060], [10, 6, 0xa8803c], [6, 4, 0xc8a060]]) {
    const x = 16 - w / 2;
    const y = 104 - h / 2;
    rect(g, K, x, y, w, h);
    rect(g, c, x + 1, y + 1, w - 2, h - 2);
  }
  rect(g, 0x8c6430, 15, 103, 2, 2);
}

// Trappe de l'échelle (cases 3-4 de la rangée 7) : on descend par là.
function hatch(g) {
  rect(g, K, 49, 113, 30, 15);
  rect(g, 0x2c2018, 50, 114, 28, 14);
  rect(g, 0x9c6434, 56, 114, 2, 14);
  rect(g, 0x9c6434, 70, 114, 2, 14);
  for (let y = 117; y < 128; y += 4) rect(g, 0xc08850, 58, y, 12, 2);
  rect(g, 0xd09458, 48, 112, 32, 1);
}

// Crée les deux textures (pièce et table) si besoin.
export function ensureCabaneTextures(scene) {
  if (scene.textures.exists(CABANE_ROOM)) return;
  const g = scene.make.graphics({ x: 0, y: 0 }, false);
  floor(g);
  backWall(g);
  window_(g);
  wallDecor(g);
  chest(g);
  cushions(g);
  drawTable(g);
  comicsCrate(g);
  rope(g);
  hatch(g);
  g.generateTexture(CABANE_ROOM, 128, 128);
  g.clear();
  drawTable(g, 0);
  g.generateTexture(CABANE_TABLE, 128, TABLE_H + 1);
  g.destroy();
}
