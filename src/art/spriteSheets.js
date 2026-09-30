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

export const PORTRAITS = 'townsfolk-portraits';
export const PORTRAIT_SIZE = 64;

export const SHEETS = {
  t: { key: 'townsfolk', file: 'TownsPeople2_Animations.png', w: 18, h: 26, count: 16 },
  f: { key: 'frlg', file: 'frlg-npcs.png', w: 16, h: 24, count: 77 },
};

const DIRS = ['down', 'up', 'left', 'right'];
const TOWNSFOLK_ROWS = ['down', 'left', 'right', 'up'];
const TOWNSFOLK_COLUMN_OF_STEP = [1, 0, 2];

export function preloadSpriteSheets(scene) {
  const base = `${import.meta.env.BASE_URL}assets/characters/`;
  for (const sheet of Object.values(SHEETS)) scene.load.image(sheet.key, base + sheet.file);
  scene.load.image(PORTRAITS, `${base}TownsPeople2_Trainers.png`);
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

  const f = SHEETS.f;
  const frlg = scene.textures.get(f.key);
  for (let i = 0; i < f.count; i++) {
    DIRS.forEach((dir, d) => {
      for (let step = 0; step < 3; step++) frlg.add(`f${i}-${dir}-${step}`, 0, (d * 3 + step) * f.w, i * f.h, f.w, f.h);
    });
  }
}

// Texture et hauteur d'image d'un personnage (`t4`, `f0`…).
export function sheetOf(id) {
  return SHEETS[id[0]];
}
