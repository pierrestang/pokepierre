// Icônes d'objets de HeartGold/SoulSilver (planche fournie par l'utilisateur, usage personnel uniquement), et cartes
// postales tirées des illustrations de lieux de Johto ; préparées par scripts/build_ds_ui.py dans public/assets/ui.
// Les bulles d'émotion « ! » et « … » sont dessinées dans le code (systems/effects.js, ensureSmallBubbles).

export const ITEM_ICONS = 'item-icons';     // atlas : une image de 32 x 32 par icône, nommée (voir le script)
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

export function preloadUiIcons(scene) {
  const base = `${import.meta.env.BASE_URL}assets/ui/`;
  scene.load.atlas(ITEM_ICONS, `${base}item-icons.png`, `${base}item-icons.json`);
  scene.load.atlas(POSTCARDS, `${base}postcards.png`, `${base}postcards.json`);
}
