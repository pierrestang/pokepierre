import { ITEMS } from './story.js';

// Pêche face à l'eau (voir MapScene.fishingSteps) : avec cette canne dans le sac, on peut lancer sa ligne devant
// toute case dont la tuile a un `water` (voir data/tiles.js). Prises possibles selon l'eau ; elles sont relâchées.
export const FISHING_ROD = ITEMS.vieilleCanne.id;

export const CATCHES = {
  sea: ['un maquereau', 'une sardine', 'un petit bar', 'une dorade'],
  pond: ['un gardon', 'une perche', 'une carpe', 'un poisson-chat'],
  river: ['une truite', 'un gardon', 'un goujon'],
};
