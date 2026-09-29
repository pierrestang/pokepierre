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
    'TTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTT', // 0
    'T...............ēē.............T', // 1
    'T.♠♠♠♠♠♠♠♠♠♠♠...ēēēēēēēēē...Y..T', // 2
    'T...............ēēēRRRRRē.T....T', // 3
    'T.♠♠♠♠♠♠♠♠♠♠♠...ēēēRRRRRē....YYT', // 4
    'T...............ēēēRRRRRē.T€...T', // 5
    'T.♠♠♠♠♠♠♠♠♠♠♠...ēēēWWWWWē...TT.T', // 6
    'T...............ēēēWWDWWēYT..TYT', // 7
    'T.♠♠♠♠♠♠♠♠♠♠♠...ēēēēēēēēēT€T.YYT', // 8
    'T...............ēēēēēēēēēTTT...T', // 9
    'T<..............ēē.......TTTYTYT', // 10
    'ēēēēēēēēēēēēēēēēēēēēēēēēēēēēēēēē', // 11
    'ēēēēēēēēēēēēēēēēēēēēēēēēēēēēēēēē', // 12
    'T.ēēēēēēēēēēēēē.ēēYT......fT...T', // 13
    'T.ēRRRēēRRRēēēē.ēēT.T..f..T..TTT', // 14
    'T.ēWWWēēWWWēēēē.ēē.....Y...T..fT', // 15
    'T.ēWDWēēWDWēēēē.ēēTT..Y........T', // 16
    'T.ēēēēYēēēēēēēē.ēē......YTY..TTT', // 17
    'T.ēēēēēēēēēē€ēē.ēē.T.....T....TT', // 18
    'T.Tēēēēēēēēēēēē.ēēTT..YT.......T', // 19
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
