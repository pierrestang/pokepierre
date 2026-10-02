import { parseGrid } from './parseGrid.js';
import { toAirport, airportSign } from './airportLinks.js';

// Hors de la carte : la route, la plage et la mer se prolongent ; jungle ailleurs.
function outside(x, y, grid) {
  if (y >= 0 && y < grid.length) {
    const edge = grid[y][x < 0 ? 0 : grid[0].length - 1];
    if (['ç', 's', 'w'].includes(edge)) return edge;
  }
  return y >= grid.length ? 'w' : 'ƫ';
}

// Sri Lanka — jungle, plantation de thé, éléphants, stupa, village de cases, plage, 32 x 26 cases.
// Légende : voir src/data/tiles.js (ƫ = arbre tropical, ♠ = théier, € = éléphant, Y = palmier)
export const sriLankaMap = {
  id: 'sriLanka',
  name: 'Sri Lanka',
  grid: parseGrid([
    'ƫƫƫƫƫƫƫƫƫƫƫƫƫƫƫƫƫƫƫƫƫƫƫƫƫƫƫƫƫƫƫƫ', // 0  jungle
    'ƫƫƫƫƫƫƫƫƫƫƫƫƫƫƫƫƫƫƫƫƫƫƫƫƫƫƫƫƫƫƫƫ', // 1
    'ƫƫ........................ƫƫ..ƫƫ', // 2
    'ƫƫ.♠♠♠♠♠♠♠♠♠♠♠.....RRRRR..ƫƫ..ƫƫ', // 3  plantation de thé, temple (stupa)
    'ƫƫ..............ƫƫfRRRRR......ƫƫ', // 4
    'ƫƫ.♠♠♠♠♠♠♠♠♠♠♠..ƫƫ.RRRRR..€...ƫƫ', // 5
    'ƫƫ.................WWWWW......ƫƫ', // 6
    'ƫƫ.♠♠♠♠♠♠♠♠♠♠♠.....WWDWWƨ.....ƫƫ', // 7
    'ƫƫ................ƨ.çç.....ƫƫ.ƫƫ', // 8
    'ƫƫ<.................çç...f.ƫƫ.ƫƫ', // 9
    'ççççççççççççççççççççççççççççççƫƫ', // 10  route (ouest : l'aéroport)
    'ççççççççççççççççççççççççççççççƫƫ', // 11
    'ƫƫ....çç....................ƨ.ƫƫ', // 12
    'ƫƫƨ...çç....f...ƨ..........€..ƫƫ', // 13
    'ƫƫ.RRRççRRR........ŦŦŦ..ƫƫ....ƫƫ', // 14  cases du village, grand arbre
    'ƫƫ.WWWççWWW...ƫƫ...ŦŦŦ..ƫƫ....ƫƫ', // 15
    'ƫƫ.WDWççWDW...ƫƫ...ŦŦŦ...ĥĥĥĥ.ƫƫ', // 16
    'ƫƫ.ççççççççç.€.....ŦŦŦ...ĥĥĥĥ.ƫƫ', // 17
    'ƫƫ.ççççççççç.....f.....ƨ.....fƫƫ', // 18
    'ƫƫ............................ƫƫ', // 19
    'sssYsssssYsssssYssssssYsssssYsss', // 20  plage
    'ssssssssssssssssssssssssssssssss', // 21
    'wwwwwwwwwwwwwwwwwwwwwwwwwwwwwwww', // 22
    'wwwwwwwwwwwwwwwwwwwwwwwwwwwwwwww', // 23
    'wwwwwwwwwwwwwwwwwwwwwwwwwwwwwwww', // 24
    'wwwwwwwwwwwwwwwwwwwwwwwwwwwwwwww', // 25
  ]),
  doors: [
    { x: 21, y: 7, interior: 'sriLankaTemple' },   // le temple (stupa)
    { x: 4,  y: 16, lockedDialogue: ['[Texte provisoire] Ayubowan ! Personne à la maison.'] },
    { x: 9,  y: 16, lockedDialogue: ['[Texte provisoire] Ayubowan ! Personne à la maison.'] },
  ],
  buildings: [
    { type: 'stupa', x: 19, y: 3 },
    { type: 'hut', x: 3, y: 14 },
    { type: 'hut', x: 8, y: 14 },
  ],
  objects: [airportSign(2, 9, false)],
  // Ouest : la route mène à l'aéroport.
  triggers: [toAirport(0, 10), toAirport(0, 11)],
  surroundings: { outside },
  spawn: { x: 1, y: 10, facing: 'right' },
};
