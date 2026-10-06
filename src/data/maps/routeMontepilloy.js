import { parseGrid } from './parseGrid.js';
// Le dessin de la carte : la version Gen 4 faite avec le créateur de cartes (scripts/convert_maps_v2.py, thème Gen 4,
// scripts/g4_theme.py) ; ses collisions s'imposent à la grille du jeu (voir builtGrid). La grille et les bâtiments
// d'origine restent la source de la conversion (sourceGrid, sourceBuildings).
import BUILT from '../builtMaps/route-de-montepilloy.json' with { type: 'json' };
import { builtGrid } from './builtGrid.js';

// Route de Montépilloy — entre Saint-Ay (au sud) et Montépilloy (au nord), 24 x 30 cases comme la route de
// Bonsecours : un chemin de terre tout droit entre deux champs de blé clôturés, sapins en bordure. Le déménagement
// se fait en voiture (voir saintAyStory.js CAR) ; la route s'ouvre ensuite, à pied, entre les deux villages.
// Légende : voir src/data/tiles.js (ç = chemin, ʬ = blé, F = clôture, T = sapins)
export const routeMontepilloyMap = {
  id: 'routeMontepilloy',
  name: 'Route de Montépilloy',
  built: BUILT,
  sourceGrid: parseGrid([
    'TTTTTTTTTTççTTTTTTTTTTTT', // 0  nord : Montépilloy
    'TTTTTTTTTTççTTTTTTTTTTTT', // 1
    'TTFFFFFFFSçç.FFFFFFFFFTT', // 2  deux champs de blé clôturés, collés aux sapins
    'TTFʬʬʬʬʬF.çç.FʬʬʬʬʬʬʬFTT', // 3
    'TTFʬʬʬʬʬF.çç.FʬʬʬʬʬʬʬFTT', // 4
    'TTFʬʬʬʬʬF.çç.FʬʬʬʬʬʬʬFTT', // 5
    'TTFʬʬʬʬʬF.çç.FʬʬʬʬʬʬʬFTT', // 6
    'TTFʬʬʬʬʬF.çç.FʬʬʬʬʬʬʬFTT', // 7
    'TTFʬʬʬʬʬF.çç.FʬʬʬʬʬʬʬFTT', // 8
    'TTFʬʬʬʬʬF.çç.FʬʬʬʬʬʬʬFTT', // 9
    'TTFʬʬʬʬʬF.çç.FʬʬʬʬʬʬʬFTT', // 10
    'TTFʬʬʬʬʬF.çç.FʬʬʬʬʬʬʬFTT', // 11
    'TTFʬʬʬʬʬF.çç.FʬʬʬʬʬʬʬFTT', // 12
    'TTFʬʬʬʬʬF.çç.FʬʬʬʬʬʬʬFTT', // 13
    'TTFʬʬʬʬʬF.çç.FʬʬʬʬʬʬʬFTT', // 14
    'TTFʬʬʬʬʬF.çç.FʬʬʬʬʬʬʬFTT', // 15
    'TTFʬʬʬʬʬF.çç.FʬʬʬʬʬʬʬFTT', // 16
    'TTFʬʬʬʬʬF.çç.FʬʬʬʬʬʬʬFTT', // 17
    'TTFʬʬʬʬʬF.çç.FʬʬʬʬʬʬʬFTT', // 18
    'TTFʬʬʬʬʬF.çç.FʬʬʬʬʬʬʬFTT', // 19
    'TTFʬʬʬʬʬF.çç.FʬʬʬʬʬʬʬFTT', // 20
    'TTFʬʬʬʬʬF.çç.FʬʬʬʬʬʬʬFTT', // 21
    'TTFʬʬʬʬʬF.çç.FʬʬʬʬʬʬʬFTT', // 22
    'TTFʬʬʬʬʬF.çç.FʬʬʬʬʬʬʬFTT', // 23
    'TTFʬʬʬʬʬF.çç.FʬʬʬʬʬʬʬFTT', // 24
    'TTFʬʬʬʬʬF.çç.FʬʬʬʬʬʬʬFTT', // 25
    'TTFʬʬʬʬʬF.ççSFʬʬʬʬʬʬʬFTT', // 26
    'TTFFFFFFF.çç.FFFFFFFFFTT', // 27
    'TTTTTTTTTTççTTTTTTTTTTTT', // 28  sud : Saint-Ay
    'TTTTTTTTTTççTTTTTTTTTTTT', // 29
  ]),
  // Deux passants sur la route.
  npcs: [
    {
      id: 'promeneuse-route', name: 'Promeneuse', x: 12, y: 14, facing: 'left',
      dialogue: ['Le blé est haut cette année.', 'Quand le vent souffle, on dirait la mer, en jaune.'],
    },
    {
      id: 'gamin-route', name: 'Gamin', x: 9, y: 21, facing: 'right',
      dialogue: ['J\'ai perdu mon cerf-volant dans les champs…', 'Si tu le vois, il est rouge. Ou bleu. Je sais plus.'],
    },
  ],
  objects: [
    { x: 12, y: 26, dialogue: ['Route de Montépilloy'] },
    { x: 9, y: 2, dialogue: ['Montépilloy'] },
  ],
  triggers: [
    // Sud : Saint-Ay.
    ...[10, 11].map((x) => ({ x, y: 29, warp: { map: 'saintAy', x: 14, y: 1, facing: 'down' } })),
    // Nord : Montépilloy.
    ...[10, 11].map((x) => ({ x, y: 0, warp: { map: 'montepilloy', x: 16, y: 28, facing: 'up' } })),
  ],
  surroundings: 'T',
  spawn: { x: 10, y: 27, facing: 'up' },
};

// La grille du jeu : celle d'origine, accordée aux collisions du dessin.
routeMontepilloyMap.grid = builtGrid(routeMontepilloyMap.sourceGrid, BUILT);
