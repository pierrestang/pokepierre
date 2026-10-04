import { parseGrid } from './parseGrid.js';

// Route de Montépilloy — entre Saint-Ay (au sud) et Montépilloy (au nord), 24 x 30 cases comme la route de
// Bonsecours : un chemin de terre en lacet à travers la campagne (champs de blé, mare, sapins, hautes
// herbes). Le déménagement se fait en voiture (voir saintAyStory.js CAR) ; la route s'ouvre ensuite, à pied, entre
// les deux villages.
// Légende : voir src/data/tiles.js (ç = chemin, ʬ = blé, ~ = mare, ĥ = hautes herbes, ƀ = buisson)
export const routeMontepilloyMap = {
  id: 'routeMontepilloy',
  name: 'Route de Montépilloy',
  grid: parseGrid([
    'TTTTTTTTTTççTTTTTTTTTTTT', // 0  nord : Montépilloy
    'TTTTTTTTTTççTTTTTTTTTTTT', // 1
    'TT...f...Sçç....TT....TT', // 2
    'TT........ççĥĥĥ.TT....TT', // 3
    'TT.ʬʬʬʬʬʬ.ççĥĥĥ...TTTTTT', // 4  champ de blé
    'TT.ʬʬʬʬʬʬ.ççĥĥĥ...TTTTTT', // 5
    'TT.ʬʬʬʬʬʬ.çç......TTTTTT', // 6
    'TT.ʬʬʬʬʬʬ.çç......TTTTTT', // 7
    'TT.ʬʬʬʬʬʬ.çççççç......TT', // 8
    'TT.ʬʬʬʬʬʬ.çççççç....f.TT', // 9
    'TT.ʬʬʬʬʬʬ.....çç......TT', // 10
    'TT.ʬʬʬʬʬʬ.....ççf~~~~.TT', // 11  mare
    'TT.ʬʬʬʬʬʬ.....çç.~~~~fTT', // 12
    'TT.ʬʬʬʬʬʬ...ƀ.ççf~~~~.TT', // 13
    'TT.f..........çç..ʬʬʬʬTT', // 14
    'TT.......f....çç..ʬʬʬʬTT', // 15
    'TTTTTT........çç..ʬʬʬʬTT', // 16
    'TTTTTT........çç....ƀ.TT', // 17
    'TTTTTT....çççççç......TT', // 18
    'TTTTTT..ƀ.çççççç......TT', // 19
    'TT........çç..........TT', // 20
    'TT..ĥĥĥĥĥ.çç..........TT', // 21
    'TT..ĥĥĥĥĥ.çç.ƀ....TTTTTT', // 22
    'TT..ĥĥĥĥĥ.çç..ĥĥĥ.TTTTTT', // 23
    'TT..ĥĥĥĥĥ.çç..ĥĥĥ.TTTTTT', // 24
    'TT..ĥĥĥĥĥ.çç..ĥĥĥ.TTTTTT', // 25
    'TT.ƀ......ççS.ĥĥĥ.ʬʬʬʬTT', // 26
    'TT.....f..çç......ʬʬʬʬTT', // 27
    'TTTTTTTTTTççTTTTTTTTTTTT', // 28  sud : Saint-Ay
    'TTTTTTTTTTççTTTTTTTTTTTT', // 29
  ]),
  // Deux passants sur la route.
  npcs: [
    {
      id: 'promeneuse-route', name: 'Promeneuse', x: 17, y: 9, facing: 'left',
      dialogue: ['Il paraît que les grenouilles de cette mare chantent en canon le soir.', 'Moi, je les écoute tous les jours.'],
    },
    {
      id: 'gamin-route', name: 'Gamin', x: 9, y: 21, facing: 'right',
      dialogue: ['J\'ai perdu mon cerf-volant dans les sapins…', 'Si tu le vois, il est rouge. Ou bleu. Je sais plus.'],
    },
  ],
  objects: [
    { x: 12, y: 26, dialogue: ['Route de Montépilloy — Nord : Montépilloy. Sud : Saint-Ay.'] },
    { x: 9, y: 2, dialogue: ['Montépilloy, Oise. Plus que quelques pas.'] },
  ],
  triggers: [
    // Sud : Saint-Ay.
    ...[10, 11].map((x) => ({ x, y: 29, warp: { map: 'saintAy', x: 14, y: 1, facing: 'down' } })),
    // Nord : Montépilloy.
    ...[10, 11].map((x) => ({ x, y: 0, warp: { map: 'montepilloy', x: 14, y: 24, facing: 'up' } })),
  ],
  surroundings: 'T',
  spawn: { x: 10, y: 27, facing: 'up' },
};
