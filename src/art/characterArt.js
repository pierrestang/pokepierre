import Phaser from 'phaser';
import { rect } from './pixel.js';

// Personnages en pixel art, dessinés dans le code (aucune image Nintendo).
// Chaque personnage est une planche de 12 images de 16 x 24 px (personnage haut d'une case,
// environ 14 x 16 px, le haut de l'image reste libre pour les chapeaux) :
// 4 directions (bas, haut, gauche, droite) x 3 images (debout, pas gauche, pas droit).
// L'apparence (`look`) décrit la peau, les cheveux, la tenue et les accessoires.

export const FRAME_W = 16;
export const FRAME_H = 24;
export const DIRS = ['down', 'up', 'left', 'right'];

const OUTLINE = 0x202028;
const shade = (c, amount = 30) => Phaser.Display.Color.IntegerToColor(c).darken(amount).color;
const light = (c, amount = 20) => Phaser.Display.Color.IntegerToColor(c).lighten(amount).color;

// Apparence complète à partir d'une description partielle.
// look : { kind?, skin?, hair?, hairStyle?, top?, topStyle?, under?, bottom?, bottomStyle?, shoes?, accessory? }
//   hairStyle : 'short' | 'long' | 'ponytail' | 'bald'
//   topStyle : 'shirt' | 'croppedJacket' (veste courte ouverte, épaules larges) | 'closedJacket' | 'dress'
//   bottomStyle : 'pants' | 'wideJeans' | 'skirt'
//   accessory : 'mortarboard' (toque de diplômé) | 'chefHat' | 'cap' | 'glasses'
export function fullLook(look = {}) {
  return {
    kind: 'human',
    skin: 0xf0c8a0,
    hair: 0x5c3820,
    hairStyle: 'short',
    top: 0x4c7cc8,
    topStyle: 'shirt',
    under: 0xe8e8ec,
    bottom: 0x3c4c6c,
    bottomStyle: 'pants',
    shoes: 0x303038,
    accessory: null,
    backpack: null,
    ...look,
  };
}

// Apparence par défaut d'un personnage dont on ne connaît que la couleur (ancien carré de couleur).
export function lookFromColor(color, { hat = false } = {}) {
  return fullLook({ top: color, accessory: hat ? 'mortarboard' : null });
}

// ---------- Dessin d'une image ----------

// Corps dessinés à la main, pixel par pixel (lignes 15 à 22 de l'image ; la tête est dessinée par-dessus).
// Une image par direction et par temps de marche (debout, pas gauche, pas droit) ; la droite est le
// miroir de la gauche. Palette volontairement réduite : une couleur et son ombre par vêtement.
//   k contour · s peau · j/J/L veste (couleur, ombre, reflet) · p/P pantalon · w/W chaussures
//   a/A sac à dos (ou la veste pour qui n'en a pas)
const BODY = {
  down: [
    [
      '....kLjjjjJk....',
      '...kLjjjjjjJk...',
      '...kjJjjjjJjk...',
      '...ksJjjjjJsk...',
      '....kkPppPkk....',
      '.....kpPPpk.....',
      '....kwwkkwwk....',
      '.....kk..kk.....',
    ],
    [
      '....kLjjjjJk....',
      '...kLjjjjjjJk...',
      '...kjJjjjjJjk...',
      '...ksJjjjjJsk...',
      '....kkPppPkk....',
      '....kwwkPpk.....',
      '....kkk.kwwk....',
      '.........kk.....',
    ],
    [
      '....kLjjjjJk....',
      '...kLjjjjjjJk...',
      '...kjJjjjjJjk...',
      '...ksJjjjjJsk...',
      '....kkPppPkk....',
      '.....kpPkwwk....',
      '....kwwk.kkk....',
      '.....kk.........',
    ],
  ],
  up: [
    [
      '....kkkkkkkk....',
      '...kjkAAAAkjk...',
      '...kjkaaaakjk...',
      '...kskaaaaksk...',
      '....kkkkkkkk....',
      '.....kpPPpk.....',
      '....kwwkkwwk....',
      '.....kk..kk.....',
    ],
    [
      '....kkkkkkkk....',
      '...kjkAAAAkjk...',
      '...kjkaaaakjk...',
      '...kskaaaaksk...',
      '....kkkkkkkk....',
      '....kwwkPpk.....',
      '....kkk.kwwk....',
      '.........kk.....',
    ],
    [
      '....kkkkkkkk....',
      '...kjkAAAAkjk...',
      '...kjkaaaakjk...',
      '...kskaaaaksk...',
      '....kkkkkkkk....',
      '.....kpPkwwk....',
      '....kwwk.kkk....',
      '.....kk.........',
    ],
  ],
  left: [
    [
      '.....kLjjjkaak..',
      '.....kjjJjkAak..',
      '.....kjjJjkaak..',
      '.....kjsJjkkkk..',
      '......kpppk.....',
      '......kpPpk.....',
      '.....kwwwk......',
      '......kkk.......',
    ],
    [
      '.....kLjjjkaak..',
      '.....kjJjjkAak..',
      '.....kJjjjkaak..',
      '.....ksjjjkkkk..',
      '.....kpppppk....',
      '....kpk..kPk....',
      '...kwwk.kWWk....',
      '....kk...kk.....',
    ],
    [
      '.....kLjjjkaak..',
      '.....kjjjJkAak..',
      '.....kjjjJkaak..',
      '.....kjjjskkkk..',
      '.....kpppppk....',
      '....kPk..kpk....',
      '...kWWk.kwwk....',
      '....kk...kk.....',
    ],
  ],
};

function drawBody(g, P, L, dir, step, ox, skirt) {
  const rows = BODY[dir === 'right' ? 'left' : dir][step];
  const pack = P.pack ?? P.top;
  const pal = {
    k: OUTLINE, s: P.skin,
    j: P.top, J: P.topS, L: P.topL,
    p: skirt ? (L.topStyle === 'dress' ? P.top : P.bottom) : P.bottom,
    P: skirt ? shade(L.topStyle === 'dress' ? P.top : P.bottom, 20) : P.bottomS,
    w: P.shoes, W: P.shoesS,
    a: pack, A: P.packL ?? P.topL,
  };
  const side = dir === 'left' || dir === 'right';
  rows.forEach((row, i) => {
    for (let x = 0; x < 16; x++) {
      // Sans sac à dos : de profil, rien derrière le dos (colonnes du sac).
      if (!P.pack && side && i <= 3 && x >= 11) continue;
      const c = pal[row[x]];
      if (c === undefined) continue;
      const fx = dir === 'right' ? 15 - x : x;
      rect(g, c, ox + fx, 15 + i, 1, 1);
    }
  });
}

// Personnage haut d'une case (façon Pokémon) : tête ronde de 10 x 9, cheveux en volume avec mèche
// balayée et épis, petit corps, sac à dos d'aventurier en option (`backpack`).
// Tête y 6..14, buste y 14..18, jambes y 18..22, ombre y 21..23 (le bas de l'image est le bas de la case).
function drawHuman(g, L, dir, step, ox) {
  const P = {
    skin: L.skin, skinS: shade(L.skin, 15), blush: 0xf09890,
    hair: L.hair, hairS: shade(L.hair, 12), hairL: light(L.hair, 22),
    top: L.top, topS: shade(L.top, 25), topL: light(L.top, 18),
    under: L.under, bottom: L.bottom, bottomS: shade(L.bottom, 25), shoes: L.shoes, shoesS: shade(L.shoes, 25),
    pack: L.backpack, packS: L.backpack && shade(L.backpack, 25), packL: L.backpack && light(L.backpack, 20),
  };
  const side = dir === 'left' || dir === 'right';
  const flip = (x, w) => (dir === 'right' ? 16 - x - w : x);        // miroir pour la droite
  const R = (c, x, y, w, h) => { if (c !== undefined && c !== null && w > 0 && h > 0) rect(g, c, ox + (side ? flip(x, w) : x), y, w, h); };

  // Large ombre ronde sous les pieds
  g.fillStyle(0x000000, 0.3);
  g.fillRect(ox + 4, 20, 8, 1);
  g.fillRect(ox + 2, 21, 12, 2);
  g.fillRect(ox + 4, 23, 8, 1);

  const skirt = L.bottomStyle === 'skirt' || L.topStyle === 'dress';
  if (side) return drawHumanSide(g, ox, R, P, L, dir, step, skirt);

  const bob = step === 0 ? 0 : 1;
  const back = dir === 'up';

  drawBody(g, P, L, dir, step, ox, skirt);

  // --- Grosse tête (14 x 13, y 2..14), style Diamant-Perle : cheveux volumineux, petit visage en bas,
  // yeux brillants de 2 x 2 ---
  const T = 2 + bob;
  headShape(R, P, T);
  const spiky = L.hairStyle === 'short' && !L.accessory;
  if (L.hairStyle !== 'bald') {
    // Masse des cheveux (le haut et les côtés de la tête), avec reflet et ombre
    R(P.hair, 5, T + 1, 6, 1);
    R(P.hair, 3, T + 2, 10, 1);
    R(P.hair, 2, T + 3, 12, 4);
    R(P.hairL, 5, T + 2, 4, 1);
    R(P.hairL, 4, T + 3, 3, 1);
    R(P.hairL, 3, T + 4, 1, 1);
    R(P.hairS, 12, T + 4, 1, 3);
    if (spiky) {
      for (const [sx, sy] of [[4, 0], [8, -1], [11, 0]]) { R(OUTLINE, sx, T + sy, 2, 1); R(P.hair, sx, T + sy + 1, 2, 1); }
    }
    if (back) {
      R(P.hair, 2, T + 7, 12, 3);
      R(P.hairS, 3, T + 9, 10, 1);
      R(P.hair, 3, T + 10, 10, 1);
      R(P.skin, 5, T + 11, 6, 1);                                      // nuque
    } else {
      // Frange en mèches qui tombe sur le front, et côtés jusqu'aux joues
      R(P.hair, 2, T + 7, 3, 1);
      R(P.hair, 6, T + 7, 3, 1);
      R(P.hair, 11, T + 7, 3, 1);
      R(P.hair, 2, T + 8, 2, 2);
      R(P.hair, 12, T + 8, 2, 2);
      R(P.hairS, 5, T + 7, 1, 1);
      R(P.hairS, 9, T + 7, 2, 1);
    }
    if (L.hairStyle === 'long') {
      if (back) { R(OUTLINE, 1, T + 10, 14, 5); R(P.hair, 2, T + 10, 12, 4); }
      else {
        R(OUTLINE, 0, T + 7, 3, 9); R(OUTLINE, 13, T + 7, 3, 9);
        R(P.hair, 1, T + 7, 2, 8); R(P.hair, 13, T + 7, 2, 8);
      }
    }
    if (L.hairStyle === 'ponytail' && back) { R(OUTLINE, 6, T + 10, 4, 7); R(P.hair, 7, T + 10, 2, 6); }
  }
  if (!back) {
    // Yeux : sombres avec un reflet blanc en haut
    for (const ex of [4, 10]) {
      R(0x283048, ex, T + 8, 2, 2);
      R(0xffffff, ex + 1, T + 8, 1, 1);
    }
    R(P.blush, 3, T + 10, 1, 1);                                       // joues
    R(P.blush, 12, T + 10, 1, 1);
    R(P.skinS, 7, T + 10, 2, 1);                                       // bouche
  }
  drawAccessories(R, L, dir, false, bob - 5);
}

// Contour et peau de la grosse tête (haut en y = T) : 14 de large, 13 de haut, bien arrondie.
function headShape(R, P, T) {
  R(OUTLINE, 5, T, 6, 1);
  R(OUTLINE, 3, T + 1, 10, 1);
  R(OUTLINE, 2, T + 2, 12, 1);
  R(OUTLINE, 1, T + 3, 14, 7);
  R(OUTLINE, 2, T + 10, 12, 1);
  R(OUTLINE, 3, T + 11, 10, 1);
  R(OUTLINE, 5, T + 12, 6, 1);
  R(P.skin, 5, T + 1, 6, 1);
  R(P.skin, 3, T + 2, 10, 1);
  R(P.skin, 2, T + 3, 12, 7);
  R(P.skin, 3, T + 10, 10, 1);
  R(P.skin, 5, T + 11, 6, 1);
  R(P.skinS, 12, T + 7, 1, 3);                                        // ombre douce sur la joue droite
  R(P.skinS, 5, T + 11, 6, 1);                                        // menton
}

// Vue de profil (tournée vers la gauche ; `R` fait le miroir pour la droite) : grosse tête ronde,
// visage à l'avant avec un petit nez, mèche vers l'avant ; corps dessiné à la main (sac, foulée, bras).
function drawHumanSide(g, ox, R, P, L, dir, step, skirt) {
  const bob = step === 0 ? 0 : 1;

  drawBody(g, P, L, dir, step, ox, skirt);

  const T = 2 + bob;
  headShape(R, P, T);
  const spiky = L.hairStyle === 'short' && !L.accessory;
  if (L.hairStyle !== 'bald') {
    R(P.hair, 5, T + 1, 6, 1);
    R(P.hair, 3, T + 2, 10, 1);
    R(P.hair, 2, T + 3, 12, 4);
    R(P.hair, 7, T + 7, 7, 4);                                         // arrière de la tête
    R(P.hairL, 4, T + 2, 4, 1);
    R(P.hairL, 3, T + 3, 3, 1);
    R(P.hairS, 12, T + 5, 1, 5);
    R(P.hair, 2, T + 7, 2, 1);                                         // mèche vers l'avant
    if (spiky) for (const [sx, sy] of [[6, -1], [10, 0]]) { R(OUTLINE, sx, T + sy, 2, 1); R(P.hair, sx, T + sy + 1, 2, 1); }
    if (L.hairStyle === 'long') { R(OUTLINE, 8, T + 9, 7, 8); R(P.hair, 9, T + 9, 5, 7); }
    if (L.hairStyle === 'ponytail') { R(OUTLINE, 13, T + 4, 3, 7); R(P.hair, 14, T + 5, 1, 5); }
  }
  R(P.skin, 8, T + 8, 2, 2);                                           // oreille
  R(P.skinS, 9, T + 9, 1, 1);
  R(0x283048, 3, T + 8, 2, 2);                                         // œil brillant
  R(0xffffff, 3, T + 8, 1, 1);
  R(P.blush, 4, T + 10, 1, 1);
  drawAccessories(R, L, dir, true, bob - 5);
}

// Accessoires (toque, chapeau de cuisinier, casquette, lunettes), communs à toutes les vues.
function drawAccessories(R, L, dir, side, hy) {
  if (L.accessory === 'mortarboard') {
    R(OUTLINE, 1, 6 + hy, 14, 3);
    R(0x181820, 2, 6 + hy, 12, 2);
    R(0x3c3c48, 4, 6 + hy, 6, 1);
    R(0xe8c040, side ? 11 : 13, 7 + hy, 1, 4);
  } else if (L.accessory === 'chefHat') {
    // Toque de cuisinier : courte et bombée, posée sur le haut de la tête (entièrement dans l'image).
    const top = Math.max(0, 6 + hy);
    R(OUTLINE, 3, top, 10, 6);
    R(OUTLINE, 2, top + 1, 12, 3);
    R(0xf8f8f8, 3, top + 1, 10, 3);
    R(0xf8f8f8, 4, top + 4, 8, 1);
    R(0xffffff, 4, top + 1, 4, 1);
    R(0xd8d8e0, 3, top + 3, 10, 1);
  } else if (L.accessory === 'cap') {
    const cc = L.capColor ?? 0xc83030;
    R(OUTLINE, 2, 6 + hy, 12, 5);
    R(cc, 3, 7 + hy, 10, 3);
    R(light(cc, 20), 5, 7 + hy, 4, 1);
    if (dir === 'down') { R(OUTLINE, 3, 11 + hy, 10, 1); R(shade(cc, 20), 4, 10 + hy, 8, 1); }
    else if (side) { R(OUTLINE, 0, 9 + hy, 5, 2); R(shade(cc, 20), 0, 9 + hy, 4, 1); }
  } else if (L.accessory === 'glasses' && dir !== 'up') {
    if (side) R(OUTLINE, 2, 13 + hy, 4, 1);
    else { R(OUTLINE, 3, 13 + hy, 4, 1); R(OUTLINE, 9, 13 + hy, 4, 1); R(OUTLINE, 7, 13 + hy, 2, 1); }
  }
}

// Chat (vu de face / de dos / de profil), pour le chat de Jean.
function drawCat(g, L, dir, step, ox) {
  const fur = L.fur ?? 0xe89030;
  const r = (c, x, y, w, h) => rect(g, c, ox + x, y, w, h);
  const side = dir === 'left' || dir === 'right';
  const flip = (x, w) => (dir === 'right' ? 16 - x - w : x);
  const R = (c, x, y, w, h) => r(c, side ? flip(x, w) : x, y, w, h);
  g.fillStyle(0x000000, 0.22);
  g.fillRect(ox + 3, 22, 10, 2);
  const b = step === 0 ? 0 : 1;
  if (side) {
    R(OUTLINE, 3, 15, 10, 6);
    R(fur, 4, 16, 8, 4);
    R(OUTLINE, 2, 11, 6, 6);                                            // tête
    R(fur, 3, 12, 4, 4);
    R(OUTLINE, 3, 10, 1, 2); R(OUTLINE, 6, 10, 1, 2);                   // oreilles
    R(OUTLINE, 4, 13, 1, 1);
    R(OUTLINE, 12, 12 - b, 2, 5);                                       // queue
    R(fur, 12, 13 - b, 1, 3);
    for (const lx of [4, 6, 9, 11]) R(OUTLINE, lx + (lx % 2 ? b : -b), 20, 1, 3);
  } else {
    R(OUTLINE, 4, 15, 8, 7);
    R(fur, 5, 16, 6, 5);
    R(OUTLINE, 3, 9, 10, 7);                                            // tête
    R(fur, 4, 10, 8, 5);
    R(OUTLINE, 3, 7, 2, 3); R(OUTLINE, 11, 7, 2, 3);                    // oreilles
    R(fur, 4, 8, 1, 2); R(fur, 11, 8, 1, 2);
    if (dir === 'down') { R(OUTLINE, 5, 12, 1, 1); R(OUTLINE, 10, 12, 1, 1); R(0xe87090, 7, 13, 2, 1); }
    else R(OUTLINE, 11, 13 - b, 2, 6);                                  // queue vue de dos
    R(OUTLINE, 5, 21, 2, 2 - b); R(OUTLINE, 9, 21, 2, 1 + b);
  }
}

// Texture (planche de 12 images) d'une apparence, mise en cache par sa description.
export function characterTexture(scene, look) {
  const L = fullLook(look);
  const key = `char-${JSON.stringify(L)}`;
  if (scene.textures.exists(key)) return key;
  const g = scene.make.graphics({}, false);
  DIRS.forEach((dir, d) => {
    for (let step = 0; step < 3; step++) {
      const ox = (d * 3 + step) * FRAME_W;
      if (L.kind === 'cat') drawCat(g, L, dir, step, ox);
      else drawHuman(g, L, dir, step, ox);
    }
  });
  g.generateTexture(key, FRAME_W * 12, FRAME_H);
  g.destroy();
  const texture = scene.textures.get(key);
  DIRS.forEach((dir, d) => {
    for (let step = 0; step < 3; step++) texture.add(`${dir}-${step}`, 0, (d * 3 + step) * FRAME_W, 0, FRAME_W, FRAME_H);
  });
  return key;
}
