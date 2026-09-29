import { parseGrid } from './parseGrid.js';
import { toAirport, airportSign } from './airportLinks.js';

// Hors de la carte : la grande rue et les trottoirs se prolongent, sol de ville ailleurs.
function outside(x, y, grid) {
  if (y >= 0 && y < grid.length) {
    const edge = grid[y][x < 0 ? 0 : grid[0].length - 1];
    if (['A', 'C'].includes(edge)) return edge;
  }
  return 'C';
}

const NOT_HOME = ["[Texte provisoire] Personne ne répond..."];

// Hull — ville anglaise à l'allure londonienne, 32 x 26 cases (comme Bordeaux).
// Légende : voir src/data/tiles.js (b = cabine téléphonique, j = Union Jack, l = réverbère, q = bus)
export const hullMap = {
  id: 'hull',
  name: 'Hull',
  grid: parseGrid([
    'TTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTT', // 0  arbres : bord de l'écran
    'CCRRRRRCRRRRRCRRRRRCRRRRRC....TC', // 1  maisons mitoyennes, pub
    'CCRRRRRCRRRRRCRRRRRCRRRRRC.T...C', // 2
    'CCWWWWWCWWWWWCWWWWWCWWWWWC...T.C', // 3
    'CCWWDWWCWWDWWCWDWWWCWWDWWC.....C', // 4  portes
    'ClCCCCCbCCCCClCCCCCbCCCCClCCCClC', // 5  réverbères, cabines
    'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA', // 6  grande rue (vers l'aéroport)
    'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA', // 7
    'C<CCCClCCCCCCCCCCClCCCCCCCCClC>C', // 8  panneaux aéroport
    'CAqqqA..T...T.RRR..............C', // 9  arrêt de bus, Big Ben
    'CAqqqA........RRR.T.RRRRRRR...fC', // 10 château
    'CCCRRRRRRRRR..RRR...RRRRRRR.T..C', // 11 université
    'CCCRRRRRRRRR.TRRR...RRRRRRRf...C', // 12
    'CCCWWWWWWWWW..WWW.j.WWWWWWW..T.C', // 13
    'CCCWWWWDWWWW..WWW...WWWDWWW....C', // 14 portes de l'université et du château
    'CCbCCCCCCCCClCCCCCCClCCCCCCCCbCC', // 15
    'CAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAC', // 16 rue sud
    'CAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAC', // 17
    'CCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCC', // 18
    'CCRRRRRCRRRRRCRRRRRC.T....f..T.C', // 19 maisons, deuxième pub, parc
    'CCRRRRRCRRRRRCRRRRRC..f.T......C', // 20
    'CCWWWWWCWWWWWCWWWWWC......j.f.TC', // 21
    'CCWWDWWCWWDWWCWDWWWC..T....T...C', // 22 portes
    'CCCCCCCCCCCCCCCCCCCC.....f.....C', // 23
    'CCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCC', // 24
    'TTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTT', // 25 arbres : bord de l'écran
  ]),
  doors: [
    { x: 4,  y: 4,  lockedDialogue: NOT_HOME },
    { x: 10, y: 4,  interior: 'hullHouse' },   // Romain et Paul
    { x: 15, y: 4,  lockedDialogue: ["[Texte provisoire] The pub is closed. Revenez plus tard !"] },
    { x: 22, y: 4,  lockedDialogue: NOT_HOME },
    { x: 7,  y: 14, interior: 'hullUniversity' },
    { x: 23, y: 14, lockedDialogue: ['[Texte provisoire] Le château est fermé aux visiteurs.'] },
    { x: 4,  y: 22, lockedDialogue: NOT_HOME },
    { x: 10, y: 22, lockedDialogue: NOT_HOME },
    { x: 15, y: 22, lockedDialogue: ["[Texte provisoire] The pub is closed. Revenez plus tard !"] },
  ],
  buildings: [
    { type: 'terrace', x: 2,  y: 1, variant: 0 },
    { type: 'terrace', x: 8,  y: 1, variant: 1 },
    { type: 'pub',     x: 14, y: 1 },
    { type: 'terrace', x: 20, y: 1, variant: 2 },
    { type: 'bus',     x: 2,  y: 9 },
    { type: 'university', x: 3, y: 11 },
    { type: 'bigBen',  x: 14, y: 9 },
    { type: 'castle',  x: 20, y: 10 },
    { type: 'terrace', x: 2,  y: 19, variant: 3 },
    { type: 'terrace', x: 8,  y: 19, variant: 1 },
    { type: 'pub',     x: 14, y: 19 },
  ],
  // Le bus rouge (arrêt à côté de l'université) : navette pour l'aéroport.
  objects: [2, 3, 4].flatMap((x) => [9, 10].map((y) => ({
    ...toAirport(x, y),
    readyDialogue: ["Tu prends le bus rouge pour l'aéroport."],
  }))).concat([airportSign(1, 8, false), airportSign(30, 8, true)]),
  // Les deux bouts de la grande rue mènent à l'aéroport.
  triggers: [toAirport(0, 6), toAirport(0, 7), toAirport(31, 6), toAirport(31, 7)],
  surroundings: { outside, border: 'T', borderSkip: ['A'] },
  spawn: { x: 1, y: 6, facing: 'right' },
};
