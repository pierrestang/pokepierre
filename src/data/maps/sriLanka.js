import { parseGrid } from './parseGrid.js';
import { toAirport, airportSign } from './airportLinks.js';

// Hors de la carte : routes de terre, plage et mer se prolongent ; forêt ailleurs.
function outside(x, y, grid) {
  if (y >= 0 && y < grid.length) {
    const edge = grid[y][x < 0 ? 0 : grid[0].length - 1];
    if (['ē', 's', 'w'].includes(edge)) return edge;
  }
  return y >= grid.length ? 'w' : '.';
}

// Sri Lanka — terre rouge, plantations de thé, jungle, éléphants, stupa, un peu de côte, 32 x 26 cases.
// Légende : voir src/data/tiles.js (ē = terre rouge, ♠ = théier, € = éléphant)
export const sriLankaMap = {
  id: 'sriLanka',
  name: 'Sri Lanka',
  grid: parseGrid([
    'ƚƚƚƚƚƚƚƚƚƚƚƚƚƚƚƚƚƚƚƚƚƚƚƚƚƚƚƚƚƚƚƚ', // 0
    'ƚ...............ēē.............ƚ', // 1
    'ƚ.♠♠♠♠♠♠♠♠♠♠♠...ēēēēēēēēē...Y..ƚ', // 2
    'ƚ...............ēēēRRRRRē.ƚ....ƚ', // 3
    'ƚ.♠♠♠♠♠♠♠♠♠♠♠...ēēēRRRRRē....YYƚ', // 4
    'ƚ...............ēēēRRRRRē.ƚ€...ƚ', // 5
    'ƚ.♠♠♠♠♠♠♠♠♠♠♠...ēēēWWWWWē...ƚƚ.ƚ', // 6
    'ƚ...............ēēēWWDWWēYƚ..ƚYƚ', // 7
    'ƚ.♠♠♠♠♠♠♠♠♠♠♠...ēēēēēēēēēƚ€ƚ.YYƚ', // 8
    'ƚ...............ēēēēēēēēēƚƚƚ...ƚ', // 9
    'ƚ<..............ēē.......ƚƚƚYƚYƚ', // 10
    'ēēēēēēēēēēēēēēēēēēēēēēēēēēēēēēēē', // 11
    'ēēēēēēēēēēēēēēēēēēēēēēēēēēēēēēēē', // 12
    'ƚ.ēēēēēēēēēēēēē.ēēYƚ......fƚ...ƚ', // 13
    'ƚ.ēRRRēēRRRēēēē.ēēƚ.ƚ..f..ƚ..ƚƚƚ', // 14
    'ƚ.ēWWWēēWWWēēēē.ēē.....Y...ƚ..fƚ', // 15
    'ƚ.ēWDWēēWDWēēēē.ēēƚƚ..Y........ƚ', // 16
    'ƚ.ēēēēYēēēēēēēē.ēē......YƚY..ƚƚƚ', // 17
    'ƚ.ēēēēēēēēēē€ēē.ēē.ƚ.....ƚ....ƚƚ', // 18
    'ƚ.ƚēēēēēēēēēēēē.ēēƚƚ..Yƚ.......ƚ', // 19
    'ssssssssssssssssssssssssssssssss', // 20
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
  objects: [airportSign(1, 10, false)],
  // Ouest : la route mène à l'aéroport.
  triggers: [toAirport(0, 11), toAirport(0, 12)],
  surroundings: { outside, border: 'T', borderSkip: ['ē', 's', 'w'] },
  spawn: { x: 1, y: 11, facing: 'right' },
};
