// Planches de personnages fournies par l'utilisateur (usage personnel uniquement), dans
// public/assets/characters/. Chaque personnage a un identifiant : `t{n}` (TownsPeople2) ou `f{n}`
// (Rouge Feu / Vert Feuille). Ses images s'appellent `{id}-{direction}-{0|1|2}` (0 = debout,
// 1 et 2 = les deux pas), dans la texture SHEETS[lettre].key.
//
// TownsPeople2 (lettre t) :
//   TownsPeople2_Animations.png : 16 personnages en grille 4 x 4, chacun sur 3 colonnes x 4 lignes
//     d'images de 18 x 26 px. Lignes : bas, gauche, droite, haut ; colonnes : pas, debout, pas.
//   TownsPeople2_Trainers.png : les 16 portraits en pied (64 x 64 px), dans le même ordre.
//   0 garçon casquette (short)   1 blouson de cuir        2 boucher chauve        3 cheveux bleus, costume
//   4 garçon casquette (jean)    5 blonde                 6 vieille marchande     7 écolière aux cheveux verts
//   8 brune au sac               9 gouvernante            10 dame au chapeau      11 policier
//   12 blond à lunettes          13 majordome             14 vieil homme à canne  15 policier au burger
//
// Rouge Feu / Vert Feuille (lettre f) : frlg-npcs.png, générée par scripts/extract_frlg.py.
//   77 personnages, un par ligne : 12 images de 16 x 24 px (bas, haut, gauche, droite x debout, pas, pas).
//   Quelques-uns : 0 Red, 1 Leaf, 2 Blue, 3 Prof. Chen, 12 infirmière, 16 vendeur, 24 et 38 chauves,
//   26 vieux sage, 32 randonneur, 39 agent en uniforme, 40-41 Team Rocket, 50 cuisinier, 51 capitaine.
//
// Émeraude (lettre h) : emerald-npcs.png (scripts/extract_more_npcs.py), même format que Rouge Feu, en 16 x 32 :
//   15 champions et membres du Conseil 4.

export const PORTRAITS = 'townsfolk-portraits';
// Portraits des dresseurs d'Émeraude (scripts/extract_emerald_trainers.py) : images `e{colonne},{rangée}`.
export const EMERALD_PORTRAITS = 'emerald-portraits';
export const PORTRAIT_SIZE = 64;

export const SHEETS = {
  t: { key: 'townsfolk', file: 'TownsPeople2_Animations.png', w: 18, h: 26, count: 16, label: 'TownsPeople' },
  f: { key: 'frlg', file: 'frlg-npcs.png', w: 16, h: 24, count: 77, label: 'Rouge Feu' },
  h: { key: 'emerald-npcs', file: 'emerald-npcs.png', w: 16, h: 32, count: 15, label: 'Émeraude' },
};

const DIRS = ['down', 'up', 'left', 'right'];
const TOWNSFOLK_ROWS = ['down', 'left', 'right', 'up'];
const TOWNSFOLK_COLUMN_OF_STEP = [1, 0, 2];

export function preloadSpriteSheets(scene) {
  const base = `${import.meta.env.BASE_URL}assets/characters/`;
  for (const sheet of Object.values(SHEETS)) scene.load.image(sheet.key, base + sheet.file);
  scene.load.image(PORTRAITS, `${base}TownsPeople2_Trainers.png`);
  scene.load.image(EMERALD_PORTRAITS, `${base}emerald-trainers.png`);
}

// Nomme les images de chaque planche (voir plus haut) et les portraits `p{n}`.
export function registerSpriteSheets(scene) {
  const t = SHEETS.t;
  const townsfolk = scene.textures.get(t.key);
  const portraits = scene.textures.get(PORTRAITS);
  for (let i = 0; i < t.count; i++) {
    const bx = (i % 4) * 3;
    const by = Math.floor(i / 4) * 4;
    TOWNSFOLK_ROWS.forEach((dir, r) => {
      TOWNSFOLK_COLUMN_OF_STEP.forEach((col, step) => {
        townsfolk.add(`t${i}-${dir}-${step}`, 0, (bx + col) * t.w, (by + r) * t.h, t.w, t.h);
      });
    });
    portraits.add(`p${i}`, 0, (i % 4) * PORTRAIT_SIZE, Math.floor(i / 4) * PORTRAIT_SIZE, PORTRAIT_SIZE, PORTRAIT_SIZE);
  }

  const emerald = scene.textures.get(EMERALD_PORTRAITS);
  for (let c = 0; c < 10; c++) {
    for (let r = 0; r < 11; r++) emerald.add(`e${c},${r}`, 0, 1 + 65 * c, 1 + 65 * r, PORTRAIT_SIZE, PORTRAIT_SIZE);
  }

  // Planches au format Rouge Feu : une ligne de 12 images par personnage.
  for (const letter of ['f', 'h']) {
    const sheet = SHEETS[letter];
    const texture = withWalkFrames(scene, sheet);
    for (let i = 0; i < sheet.count; i++) {
      DIRS.forEach((dir, d) => {
        for (let step = 0; step < 3; step++) {
          texture.add(`${letter}${i}-${dir}-${step}`, 0, (d * 3 + step) * sheet.w, i * sheet.h, sheet.w, sheet.h);
        }
      });
    }
  }
}

// Texture et hauteur d'image d'un personnage (`t4`, `f0`…).
export function sheetOf(id) {
  return SHEETS[id[0]];
}

// Certains personnages des planches n'ont qu'une image par direction (les « pas » sont identiques à l'image debout) :
// ils glisseraient sans bouger les jambes. On leur fabrique deux pas : les jambes (le bas du personnage) décalées d'un
// pixel d'un côté puis de l'autre, et tout le personnage qui rebondit d'un pixel, comme la démarche de Rouge Feu.
// La planche est recopiée dans une texture canvas (même clé) avant de nommer ses images.
const LEGS = 5;             // hauteur des jambes, en pixels, depuis le bas du personnage

function withWalkFrames(scene, sheet) {
  const source = scene.textures.get(sheet.key).getSourceImage();
  const canvas = document.createElement('canvas');
  canvas.width = source.width;
  canvas.height = source.height;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  ctx.drawImage(source, 0, 0);
  const { w, h } = sheet;
  const cell = (col, row) => ctx.getImageData(col * w, row * h, w, h);
  const same = (a, b) => a.data.every((v, i) => v === b.data[i]);
  for (let row = 0; row < sheet.count; row++) {
    DIRS.forEach((dir, d) => {
      const still = cell(d * 3, row);
      if (!same(still, cell(d * 3 + 1, row)) || !same(still, cell(d * 3 + 2, row))) return;
      [-1, 1].forEach((side, k) => ctx.putImageData(stepFrame(still, w, h, side), (d * 3 + 1 + k) * w, row * h));
    });
  }
  scene.textures.remove(sheet.key);
  return scene.textures.addCanvas(sheet.key, canvas);
}

// Un pas fabriqué à partir de l'image debout : personnage remonté d'un pixel, jambes décalées de `side` pixel(s).
function stepFrame(still, w, h, side) {
  const out = new ImageData(w, h);
  const src = still.data;
  let bottom = h - 1;
  while (bottom > 0 && ![...Array(w).keys()].some((x) => src[(bottom * w + x) * 4 + 3])) bottom--;
  const legsTop = bottom - LEGS + 1;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 4;
      if (!src[i + 3]) continue;
      const tx = y >= legsTop ? x + side : x;
      const ty = y - 1;                                              // tout le personnage rebondit d'un pixel
      if (tx < 0 || tx >= w || ty < 0) continue;
      const o = (ty * w + tx) * 4;
      for (let c = 0; c < 4; c++) out.data[o + c] = src[i + c];
    }
  }
  return out;
}
