import { parseGrid } from './parseGrid.js';
import { FLAGS } from '../story.js';

// Bornes du Chemin : coquille jaune, distance restante jusqu'à Saint-Jacques.
const MARKERS = [[6, 12], [18, 9], [30, 10], [47, 7], [54, 10], [68, 12]];
const PILGRIM_LINES = [
  '[Pèlerin - texte provisoire] ¡Buen Camino ! Encore un bel effort.',
  '[Pèlerine - texte provisoire] La vue sur la mer est magnifique, non ?',
  '[Pèlerin - texte provisoire] Saint-Jacques est tout près, courage !',
];

// Chemin de Saint-Jacques — la côte nord de l'Espagne, 96 x 20 cases (environ trois écrans) :
// la mer et ses criques au nord, prés et forêts, deux villages, et la cathédrale au bout, sur sa place pavée.
// Plus longue que l’écran : la caméra suit le joueur (comme sur toutes les cartes).
// Légende : voir src/data/tiles.js (§ = borne du Chemin, ç = chemin, ɔ = pavés, q = bus)
export const caminoMap = {
  id: 'camino',
  name: 'Chemin de Saint-Jacques',
  grid: parseGrid([
    'wwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwww', // 0  mer
    'wwwwwwwwwwwwwwsssssswwwwwwwwwwwwwwwwwwwwwwwwsssssswwwwwwwwwwwwwwwwwwssssswwwwwwwwwwwwwwwwwwwwwww', // 1
    'wwwwwwwwwwwwsssssssssswwwwwwwwwwwwwwwwwwwwsssssssssswwwwwwwwwwwwwwssssssssswwwwwwwwwwwwwwwwwwwww', // 2
    'ssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssss', // 3  plage
    '.............................RRRRR......RRRRR...................................ɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔ', // 4  premier village : deux maisons de pierre et un hórreo
    '.ƀ......ĥĥĥĥĥ......ŕ....f....RRRRR......RRRRR.......f...................ĥĥĥĥĥĥ..ɔɔɔɔRRRRRRRɔɔɔɔɔ', // 5  cathédrale de Saint-Jacques
    '...f....ĥĥĥĥĥ..f.............WWWWW..RR..WWWWWf........ŕ.....RRRRR.......ĥĥĥĥĥĥ..ɔɔɔɔRRRRRRRɔɔɔɔɔ', // 6  l'auberge des pèlerins
    '....f...ĥĥĥĥĥ..........ƀ.....WDWWW..RR..WDWWW..§............RRRRR.......ĥĥĥĥĥĥ..ɔɔɔɔRRRRRRRɔɔɔɔɔ', // 7
    '......ƀ.........ƀ.........çççççççççççççççççççççççççççççççç..WWWWW..RR...........ɔɔɔɔRRRRRRRɔɔɔɔɔ', // 8
    '..................§.......çççççççççççççççççççççççççççççççç..WDWWW..RR.......ƀ...ɔɔɔɔRRRRRRRɔɔɔɔɔ', // 9
    'çççççççççççççççççççççççççççç..§.......................§.ççççççççççççççççççççççççɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔ', // 10  le Chemin (entrée à l'ouest)
    'çççççççççççççççççççççççççççç............................ççççççççççççççççççççççççɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔ', // 11
    '......§..........................f..............ĥĥĥĥĥĥ..............§...........ɔɔɔɔɔɔɔɔɔɔɔqqqɔɔ', // 12  bus du retour
    '...........f........ĥĥĥĥĥĥ..ŕ.....ƀ.............ĥĥĥĥĥĥ.......f.............f....ɔɔɔɔɔɔɔɔɔɔɔqqqɔɔ', // 13
    '..TTTT....ƀ.........ĥĥĥĥĥĥ..........f.........TTTT........ƀ.......TTTT...ŕ....ƀ.ɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔ', // 14
    '..TTTT........................f........ƀ......TTTT............ƀ...TTTT..........ɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔ', // 15
    'TTTTTTTT..........TTTTTTTT..................TTTTTTTTTT..........TTTTTTTT........................', // 16  forêts
    'TTTTTTTT..........TTTTTTTT..................TTTTTTTTTT..........TTTTTTTT........................', // 17
    'TTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTT', // 18
    'TTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTT', // 19
  ]),
  doors: [
    { x: 30, y: 7, lockedDialogue: ['[Texte provisoire] ¡Hola ! Une maison de pierre galicienne.'] },
    { x: 41, y: 7, lockedDialogue: ['[Texte provisoire] Personne ne répond...'] },
    { x: 61, y: 9, lockedDialogue: ['[Texte provisoire] Une auberge de pèlerins, complète ce soir.'] },
  ],
  buildings: [
    { type: 'slateHouse', x: 29, y: 4 },
    { type: 'horreo', x: 36, y: 6 },
    { type: 'house', x: 40, y: 4 },
    { type: 'cottage', x: 60, y: 6 },
    { type: 'horreo', x: 67, y: 8 },
    { type: 'santiagoCathedral', x: 84, y: 5 },
    { type: 'bus', x: 91, y: 12 },
  ],
  npcs: [[22, 11], [48, 9], [72, 10]].map(([x, y], i) => ({
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
  // Autour : la mer au nord, la forêt au sud.
  surroundings: { outside: (x, y) => (y < 10 ? 'w' : 'T') },
  spawn: { x: 1, y: 10, facing: 'right' },
};
