// Personnages : uniquement ceux de la quatrième génération (Diamant/Perle/Platine, HeartGold/SoulSilver), sprites
// officiels fournis par l'utilisateur (ASSETTILESPOKEMONV2/personnages/gen4-officiels), rassemblés par
// scripts/build_gen4_npcs.py dans public/assets/characters/gen4-npcs.png (liste et noms : gen4-npcs.json).
// Chaque personnage a un identifiant `g{n}` ; ses images s'appellent `{id}-{direction}-{0|1|2}` (0 = debout, 1 et 2 =
// les deux pas), dans la texture SHEETS.g.key. Une ligne de 12 images de 32 x 30 px par personnage (bas, haut, gauche,
// droite x debout, pas, autre pas), pieds alignés.
//   Quelques-uns : 198 Lucas (Pierre), 126-128 mamans, 138 Prof. Sorbier, 114-115 infirmières, 112-113 vendeurs,
//   32 marin, 67 pêcheur, 71 sage, 72 ancien, 87 policier, 63-64 serveur, serveuse, 22-25 gamins et gamines.
// Pas de portraits dans les dialogues (comme dans les jeux DS).

export const SHEETS = {
  g: { key: 'gen4-npcs', file: 'gen4-npcs.png', w: 32, h: 30, count: 204, label: 'Gen 4' },
};

const DIRS = ['down', 'up', 'left', 'right'];

export function preloadSpriteSheets(scene) {
  const base = `${import.meta.env.BASE_URL}assets/characters/`;
  for (const sheet of Object.values(SHEETS)) scene.load.image(sheet.key, base + sheet.file);
}

// Nomme les images de chaque personnage : une ligne de 12 images par personnage.
export function registerSpriteSheets(scene) {
  for (const letter of Object.keys(SHEETS)) {
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
