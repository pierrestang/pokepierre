// Icônes d'objets et bulles d'émotion de HeartGold/SoulSilver (planches fournies par l'utilisateur, usage
// personnel uniquement), et cartes postales tirées des illustrations de lieux de Johto ; préparées par
// scripts/build_ds_ui.py dans public/assets/ui/.

export const ITEM_ICONS = 'item-icons';     // atlas : une image de 32 x 32 par icône, nommée (voir le script)
export const EMOTES = 'emotes';             // 24 bulles de 16 x 16, 3 rangées de 8
export const POSTCARDS = 'postcards';       // cartes postales de la carte du voyage (256 x 160), par id de ville

// Icône de chaque objet de l'histoire (id de data/story.js ITEMS).
const ICON_OF_ITEM = {
  'coquillage-nacre': 'coquillage',
  'canne-a-peche': 'super-canne',
  'vieille-canne': 'vieille-canne',
  planches: 'planches',
  corde: 'corde',
  baccalaureat: 'diplome',
  'cles-appartement': 'cles',
  'diplome-anglais': 'livre',
  'diplome-hull': 'carnet',
  'objet-chance': 'amulette',
  marchandise: 'sac',
  'billet-new-delhi': 'billet',
  'potion-magique': 'potion',
  'diplome-bordeaux': 'carte',
  'piece-tracteur': 'piece-metal',
  'objet-magique-bali': 'orbe-turquoise',
  'objet-magique-sri-lanka': 'orbe-rouge',
  'objet-magique-thailande': 'orbe-verte',
  'objet-magique-nepal': 'orbe-bleue',
};

// Image de l'atlas pour un objet (null s'il n'a pas d'icône).
export const itemIcon = (id) => ICON_OF_ITEM[id] ?? null;

// Bulles : les deux images de l'animation de chaque émotion.
export const EMOTE_FRAMES = {
  dots: [0, 1],        // « … »
  note: [2, 3],        // note de musique
  happy: [4, 5],
  grumpy: [6, 7],
  surprise: [8, 9],    // « ! »
  heart: [10, 11],
  question: [16, 17],  // « ? »
  dizzy: [18, 19],
  sad: [20, 21],
};

export function preloadUiIcons(scene) {
  const base = `${import.meta.env.BASE_URL}assets/ui/`;
  scene.load.atlas(ITEM_ICONS, `${base}item-icons.png`, `${base}item-icons.json`);
  scene.load.atlas(POSTCARDS, `${base}postcards.png`, `${base}postcards.json`);
  scene.load.spritesheet(EMOTES, `${base}emotes.png`, { frameWidth: 16, frameHeight: 16 });
}
