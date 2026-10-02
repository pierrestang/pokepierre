import { parseGrid } from './parseGrid.js';
import { toAirport, airportSign } from './airportLinks.js';

// Hors de la carte : la rivière, la rue et les quais se prolongent ; pavés ailleurs.
function outside(x, y, grid) {
  if (y >= 0 && y < grid.length) {
    const edge = grid[y][x < 0 ? 0 : grid[0].length - 1];
    if (['G', 'ɐ', 'ɔ'].includes(edge)) return edge;
  }
  return 'ɔ';
}

const CLOSED = ['[Texte provisoire] Sawasdee ! Personne à la maison.'];
const HOUSES = [[2, 1], [5, 1], [8, 1], [20, 1], [23, 1], [26, 1], [2, 20], [5, 20], [8, 20], [20, 20], [23, 20], [26, 20]];

// Thaïlande — Bangkok : compartiments colorés, wat aux toits dorés, tuk-tuks, éléphants,
// rivière Chao Phraya et marché sur le quai, 32 x 26 cases.
// Légende : voir src/data/tiles.js (þ = drapeau thaï, d = tuk-tuk, t = stand, € = éléphant)
export const thailandMap = {
  id: 'thailand',
  name: 'Thaïlande',
  grid: parseGrid([
    'ƚƚƚƚƚƚƚƚƚƚƚƚƚƚƚƚƚƚƚƚƚƚƚƚƚƚƚƚƚƚƚƚ', // 0
    'ɔɔRRRRRRRRRɔɔɔɔɔɔɔɔɔRRRRRRRRRɔɔɔ', // 1
    'ɔɔRRRRRRRRRɔɔɔɔɔɔɔɔɔRRRRRRRRRɔɔɔ', // 2
    'ɔɔWWWWWWWWWɔɔɔɔɔɔɔɔɔWWWWWWWWWɔɔɔ', // 3
    'ɔɔWDWWDWWDWɔɔɔɔɔɔɔɔɔWDWWDWWDWɔɔɔ', // 4
    'ɔdɔɔɔɔɔɔɔɔɔɔtɔtɔnɔdɔɔɔɔɔɔɔɔɔɔɔtɔ', // 5
    'ɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐ', // 6
    'ɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐ', // 7
    'ɔ<ɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔ>ɔ', // 8
    'ɔ.Y.......ɔɔɔRRRRRɔɔɔ.Y........ɔ', // 9
    'ɔ...f...Y.ɔɔɔRRRRRɔɔɔ........Y.ɔ', // 10
    'ɔ.........ɔɔþRRRRRþɔɔ.....€....ɔ', // 11
    'ɔ....€....ɔɔɔWWWWWɔɔɔ..f....f..ɔ', // 12
    'ɔ......f..ɔɔɔWWDWWɔɔɔ..........ɔ', // 13
    'ɔ..Y......ɔɔɔɔɔɔɔɔɔɔɔ....Y....Yɔ', // 14
    'ɔ.........ɔɔɔɔɔɔɔɔɔɔɔ..........ɔ', // 15
    'ɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔ', // 16
    'GGGGGGGIIGGGGGGGGGGGGGGIIGGGGGGG', // 17
    'GGGGGGGIIGGGGGGGGGGGGGGIIGGGGGGG', // 18
    'ɔɔɔtɔtɔɔɔɔɔtɔtɔɔɔtɔtɔɔɔɔɔɔɔtɔtɔɔ', // 19
    'ɔɔRRRRRRRRRɔ.Y.....ɔRRRRRRRRRɔɔɔ', // 20
    'ɔɔRRRRRRRRRɔ....fY.ɔRRRRRRRRRɔɔɔ', // 21
    'ɔɔWWWWWWWWWɔ..f....ɔWWWWWWWWWɔɔɔ', // 22
    'ɔɔWDWWDWWDWɔ...Y...ɔWDWWDWWDWɔɔɔ', // 23
    'ɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔ', // 24
    'ƚƚƚƚƚƚƚƚƚƚƚƚƚƚƚƚƚƚƚƚƚƚƚƚƚƚƚƚƚƚƚƚ', // 25
  ]),
  doors: [
    { x: 15, y: 13, interior: 'watInterieur' },   // le wat : l'objet magique
    ...HOUSES.map(([x, y]) => ({ x: x + 1, y: y + 3, lockedDialogue: CLOSED })),
  ],
  buildings: [
    ...HOUSES.map(([x, y], i) => ({ type: 'tubeHouse', x, y, variant: i })),
    { type: 'wat', x: 13, y: 9 },
  ],
  objects: [airportSign(1, 8, false), airportSign(30, 8, true)],
  triggers: [toAirport(0, 6), toAirport(0, 7), toAirport(31, 6), toAirport(31, 7)],
  surroundings: { outside, border: 'T', borderSkip: ['G', 'ɐ'] },
  spawn: { x: 1, y: 6, facing: 'right' },
};
