import { parseGrid } from './parseGrid.js';
import { FLAGS } from '../story.js';

// Le bateau amarré au ponton : départ vers Saint-Ay une fois les souvenirs de la famille réunis.
const BOAT = {
  requiresSouvenirs: ['souvenir-maman', 'souvenir-papa', 'souvenir-manon'],
  dialogue: ["Tu n'es pas encore prêt à partir."],
  readyDialogue: ['Tu as réuni les souvenirs de ta famille.', 'Tu embarques pour Saint-Ay !'],
  setFlags: [FLAGS.departFortDeFrance],
  // Arrivée : au bord de l'étang de Saint-Ay, à côté de son bateau.
  warp: { map: 'saintAy', x: 11, y: 17, facing: 'left' },
};
const BOAT_POS = { x: 11, y: 16, w: 3, h: 2 };

// Fort-de-France — petite île de départ, 20 x 18 cases.
// Légende : voir src/data/tiles.js (w = mer, s = sable, = = ponton, Y = palmier, B = bateau)
export const fortDeFranceMap = {
  id: 'fortDeFrance',
  name: 'Fort-de-France',
  grid: parseGrid([
    'wwwwwwwwwwwwwwwwwwww', // 0
    'wwwwwwwwwwwwwwwwwwww', // 1
    'wwwsssssssssssssswww', // 2  plage
    'wwsYs..........sYsww', // 3
    'wws..ff......ff..sww', // 4
    'wws..............sww', // 5
    'wws.Y..RRRRR.....sww', // 6  maison au centre
    'wws....RRRRR.....sww', // 7
    'wws....WWWWW...Y.sww', // 8
    'wws....WDWWW.....sww', // 9  porte
    'wws.....P........sww', // 10
    'wws..Y..PPP...Y..sww', // 11
    'wws......PP......sww', // 12
    'wws.ff...PP...ff.sww', // 13
    'wwsYs....PP....sYsww', // 14
    'wwwsssssssssssssswww', // 15
    'wwwwwwwww==BBBwwwwww', // 16 ponton + bateau amarré
    'wwwwwwwww==BBBwwwwww', // 17
  ]),
  doors: [{ x: 8, y: 9, interior: 'ffHouse' }],
  buildings: [
    { type: 'house', x: 7, y: 6 },
    { type: 'boat', x: BOAT_POS.x, y: BOAT_POS.y },
  ],
  // Chaque case du bateau réagit quand on lui fait face (Entrée / Espace).
  objects: Array.from({ length: BOAT_POS.w * BOAT_POS.h }, (_, i) => ({
    x: BOAT_POS.x + (i % BOAT_POS.w),
    y: BOAT_POS.y + Math.floor(i / BOAT_POS.w),
    ...BOAT,
  })),
  // Autour de l'île, l'écran est rempli de mer (au lieu des arbres par défaut).
  surroundings: 'w',
  spawn: { x: 8, y: 10, facing: 'down' },
};
