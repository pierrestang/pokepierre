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
// Planches DS et Émeraude (scripts/extract_more_npcs.py), même format que Rouge Feu, en plus grand :
//   d : dp-npcs.png, 89 personnages de Diamant/Perle en 32 x 32 (0-78 PNJ, 79-88 champions et Conseil 4).
//   n : bw-npcs.png, 63 personnages de Noir/Blanc en 32 x 32.
//   h : emerald-npcs.png, 15 champions et membres du Conseil 4 d'Émeraude en 16 x 32.

export const PORTRAITS = 'townsfolk-portraits';
// Portraits des dresseurs d'Émeraude (scripts/extract_emerald_trainers.py) : images `e{colonne},{rangée}`.
export const EMERALD_PORTRAITS = 'emerald-portraits';
export const PORTRAIT_SIZE = 64;

export const SHEETS = {
  t: { key: 'townsfolk', file: 'TownsPeople2_Animations.png', w: 18, h: 26, count: 16, label: 'TownsPeople' },
  f: { key: 'frlg', file: 'frlg-npcs.png', w: 16, h: 24, count: 77, label: 'Rouge Feu' },
  d: { key: 'dp-npcs', file: 'dp-npcs.png', w: 32, h: 32, count: 89, label: 'Diamant/Perle' },
  n: { key: 'bw-npcs', file: 'bw-npcs.png', w: 32, h: 32, count: 63, label: 'Noir/Blanc' },
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
  for (const letter of ['f', 'd', 'n', 'h']) {
    const sheet = SHEETS[letter];
    const texture = scene.textures.get(sheet.key);
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
