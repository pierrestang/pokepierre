import { parseGrid } from './parseGrid.js';
import { FLAGS } from '../story.js';

// Bornes du Chemin : coquille jaune, distance restante jusqu'à Saint-Jacques.
const MARKERS = [[6, 10], [18, 11], [30, 9], [42, 7], [54, 8], [66, 11]];
const PILGRIM_LINES = [
  '[Pèlerin - texte provisoire] ¡Buen Camino ! Encore un bel effort.',
  '[Pèlerine - texte provisoire] La vue sur les falaises est magnifique, non ?',
  '[Pèlerin - texte provisoire] Saint-Jacques est tout près, courage !',
];

// Chemin de Saint-Jacques — la côte nord de l'Espagne, 96 x 20 cases (environ trois écrans) :
// mer et falaises au nord, plages, prés et forêts, villages, et la cathédrale au bout.
// Carte défilante : la caméra suit le joueur.
// Légende : voir src/data/tiles.js (£ = falaise, § = borne du Chemin, P = chemin, q = bus)
export const caminoMap = {
  id: 'camino',
  name: 'Chemin de Saint-Jacques',
  scroll: true,
  grid: parseGrid([
    'wwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwww', // 0
    'wwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwww', // 1
    'wwwwwwwwwwwwwwwssssssswwwwwwwwwwwwwwwwwwwwwwwssssssswwwwwwwwwwwwwwwwwwwsssssswwwwwwwwwwwwwwwwwww', // 2
    '££££££££££££££sssssssss£££££££££££££££££££££sssssssss£££££££££££££££££ssssssss££££££££££££££££££', // 3
    '..............sssssssss.....................sssssssss.................ssssssss..CCCCCCCCCCCCCCCC', // 4
    '.f.T..T.T.TT..T......T..fT...RRRRR....RR...........T..f...RRRRR.......T.......T.CCCCRRRRRRRCCCCC', // 5
    '...ff.....T........T......T..RRRRR....RR.....T....TT...f..RRRRR.................CCCCRRRRRRRCCCCC', // 6
    '........T.....f........fTf...WWWWW........§.......f.......WWWWW...........T.....CCCCRRRRRRRCCCCC', // 7
    '...fT.T.T...f..f........f....WWDWW..PPPPPPPPPPPPP...f.§...WWDWW..........T..TfT.CCCCRRRRRRRCCCCC', // 8
    '..............TTT..fT.........§PPPPPPPPPPPPPPPPPPPPPPPP...............f.........CCCCRRRRRRRCCCCC', // 9
    'PPP...§..........Tf........PPPPPPPPP............fPPPPPPPPPP............T........CCCCCCCCCCCCCCCC', // 10
    'PPPPPPPP..........§..PPPPPPPPPP.................T......PPPPPPPPPP.§..........fPPCCCCCCCCCCCCCCCC', // 11
    '...PPPPPPPPPPPPPPPPPPPPPPPP.........RRRRR.........f...f....PPPPPPPPPPPPPPPPPPPPPCCCCCCCCCCCqqqCC', // 12
    'TT......PPPPPPPPPPPPP...............RRRRR..........TT............PPPPPPPPPPPPP..CCCCCCCCCCCqqqCC', // 13
    '.....T....f.............TT..........WWWWW.....T......fT.........RR..............CCCCCCCCCCCCCCCC', // 14
    'T..T.T..........T......f.TT.........WWDWW..........f..T.........RR....f...f.T...CCCCCCCCCCCCCCCC', // 15
    '.TTT...T.TTf....T..TT.TTT.T...................T...TTTTT...............TTT...TTTTCCCCCCCCCCCCCCCC', // 16
    'TTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTT', // 17
    'TTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTT', // 18
    'TTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTT', // 19
  ]),
  doors: [
    { x: 31, y: 8,  lockedDialogue: ['[Texte provisoire] ¡Hola ! Une maison de pierre galicienne.'] },
    { x: 38, y: 15, lockedDialogue: ['[Texte provisoire] Personne ne répond...'] },
    { x: 60, y: 8,  lockedDialogue: ['[Texte provisoire] Une auberge de pèlerins, complète ce soir.'] },
  ],
  buildings: [
    { type: 'stoneHouse', x: 29, y: 5, variant: 0 },
    { type: 'stoneHouse', x: 36, y: 12, variant: 1 },
    { type: 'horreo', x: 38, y: 5 },
    { type: 'stoneHouse', x: 58, y: 5, variant: 2 },
    { type: 'horreo', x: 64, y: 14 },
    { type: 'santiagoCathedral', x: 84, y: 5 },
    { type: 'bus', x: 91, y: 12 },
  ],
  npcs: [[24, 10], [50, 8], [73, 11]].map(([x, y], i) => ({
    id: `pelerin-${i}`, name: i === 1 ? 'Pèlerine' : 'Pèlerin', x, y, facing: 'down',
    color: [0x8c5c2c, 0x2c6c8c, 0x6c3c7c][i],
    dialogue: [PILGRIM_LINES[i]],
  })),
  objects: [
    ...MARKERS.map(([x, y], i) => ({
      x,
      y,
      dialogue: [`Chemin de Saint-Jacques : Saint-Jacques-de-Compostelle, ${(MARKERS.length - i) * 15} km.`],
    })),
    { x: 87, y: 9, dialogue: ['La cathédrale de Saint-Jacques-de-Compostelle ! Le bout du Chemin.'] },
    // Le bus du retour, derrière la cathédrale.
    ...[91, 92, 93].flatMap((x) => [12, 13].map((y) => ({
      x,
      y,
      readyDialogue: [
        '¡Buen Camino ! Vous voici à Saint-Jacques-de-Compostelle.',
        'Le bus vous ramène à Toulon, Yanis et toi.',
      ],
      setFlags: [FLAGS.caminoFini],
      warp: { map: 'toulon', x: 10, y: 5, facing: 'down' },
    }))),
  ],
  surroundings: 'T',
  spawn: { x: 1, y: 10, facing: 'right' },
};
