import { parseGrid } from './parseGrid.js';
import { toAirport, airportSign } from './airportLinks.js';

// Hors de la carte : la rivière, la rue et les quais se prolongent ; pavés ailleurs.
function outside(x, y, grid) {
  if (y >= 0 && y < grid.length) {
    const edge = grid[y][x < 0 ? 0 : grid[0].length - 1];
    if (['G', 'A', 'C'].includes(edge)) return edge;
  }
  return 'C';
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
    'CCRRRRRRRRRCCCCCCCCCRRRRRRRRRCCC', // 1
    'CCRRRRRRRRRCCCCCCCCCRRRRRRRRRCCC', // 2
    'CCWWWWWWWWWCCCCCCCCCWWWWWWWWWCCC', // 3
    'CCWDWWDWWDWCCCCCCCCCWDWWDWWDWCCC', // 4
    'CdCCCCCCCCCCtCtCnCdCCCCCCCCCCCtC', // 5
    'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA', // 6
    'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA', // 7
    'C<CCCCCCCCCCCCCCCCCCCCCCCCCCCC>C', // 8
    'C.Y.......CCCRRRRRCCC.Y........C', // 9
    'C...f...Y.CCCRRRRRCCC........Y.C', // 10
    'C.........CCþRRRRRþCC.....€....C', // 11
    'C....€....CCCWWWWWCCC..f....f..C', // 12
    'C......f..CCCWWDWWCCC..........C', // 13
    'C..Y......CCCCCCCCCCC....Y....YC', // 14
    'C.........CCCCCCCCCCC..........C', // 15
    'CCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCC', // 16
    'GGGGGGGIIGGGGGGGGGGGGGGIIGGGGGGG', // 17
    'GGGGGGGIIGGGGGGGGGGGGGGIIGGGGGGG', // 18
    'CCCtCtCCCCCtCtCCCtCtCCCCCCCtCtCC', // 19
    'CCRRRRRRRRRC.Y.....CRRRRRRRRRCCC', // 20
    'CCRRRRRRRRRC....fY.CRRRRRRRRRCCC', // 21
    'CCWWWWWWWWWC..f....CWWWWWWWWWCCC', // 22
    'CCWDWWDWWDWC...Y...CWDWWDWWDWCCC', // 23
    'CCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCC', // 24
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
  surroundings: { outside, border: 'T', borderSkip: ['G', 'A'] },
  spawn: { x: 1, y: 6, facing: 'right' },
};
