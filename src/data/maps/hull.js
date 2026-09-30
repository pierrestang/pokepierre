import { parseGrid } from './parseGrid.js';
import { toAirport, airportSign } from './airportLinks.js';

// Hors de la carte : la grande rue et les trottoirs se prolongent, sol de ville ailleurs.
function outside(x, y, grid) {
  if (y >= 0 && y < grid.length) {
    const edge = grid[y][x < 0 ? 0 : grid[0].length - 1];
    if (['ɐ', 'ɔ'].includes(edge)) return edge;
  }
  return 'ɔ';
}

const NOT_HOME = ["[Texte provisoire] Personne ne répond..."];

// Hull — ville anglaise à l'allure londonienne, 32 x 26 cases (comme Bordeaux).
// Légende : voir src/data/tiles.js (b = cabine téléphonique, j = Union Jack, l = réverbère, q = bus)
export const hullMap = {
  id: 'hull',
  name: 'Hull',
  grid: parseGrid([
    'ƚƚƚƚƚƚƚƚƚƚƚƚƚƚƚƚƚƚƚƚƚƚƚƚƚƚƚƚƚƚƚƚ', // 0  arbres : bord de l'écran
    'ɔɔRRRRRɔRRRRRɔRRRRRɔRRRRRɔ....ƚɔ', // 1  maisons mitoyennes, pub
    'ɔɔRRRRRɔRRRRRɔRRRRRɔRRRRRɔ.ƚ...ɔ', // 2
    'ɔɔWWWWWɔWWWWWɔWWWWWɔWWWWWɔ...ƚ.ɔ', // 3
    'ɔɔWDWWWɔWDWWWɔWDWWWɔWDWWWɔ.....ɔ', // 4  portes
    'ɔlɔɔɔɔɔbɔɔɔɔɔlɔɔɔɔɔbɔɔɔɔɔlɔɔɔɔlɔ', // 5  réverbères, cabines
    'ɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐ', // 6  grande rue (vers l'aéroport)
    'ɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐ', // 7
    'ɔ<ɔɔɔɔlɔɔɔɔɔɔɔɔɔɔɔlɔɔɔɔɔɔɔɔɔlɔ>ɔ', // 8  panneaux aéroport
    'ɔɐqqqɐ..ƚ...ƚ.RRR..............ɔ', // 9  arrêt de bus, Big Ben
    'ɔɐqqqɐ........RRR.ƚ.RRRRRRR...fɔ', // 10 château
    'ɔɔɔRRRRRRRRR..RRR...RRRRRRR.ƚ..ɔ', // 11 université
    'ɔɔɔRRRRRRRRR.ƚRRR...RRRRRRRf...ɔ', // 12
    'ɔɔɔWWWWWWWWW..WWW.j.WWWWWWW..ƚ.ɔ', // 13
    'ɔɔɔWWWWDWWWW..WWW...WWWDWWW....ɔ', // 14 portes de l'université et du château
    'ɔɔbɔɔɔɔɔɔɔɔɔlɔɔɔɔɔɔɔlɔɔɔɔɔɔɔɔbɔɔ', // 15
    'ɔɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɔ', // 16 rue sud
    'ɔɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɔ', // 17
    'ɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔ', // 18
    'ɔɔRRRRRɔRRRRRɔRRRRRɔ.ƚ....f..ƚ.ɔ', // 19 maisons, deuxième pub, parc
    'ɔɔRRRRRɔRRRRRɔRRRRRɔ..f.ƚ......ɔ', // 20
    'ɔɔWWWWWɔWWWWWɔWWWWWɔ......j.f.ƚɔ', // 21
    'ɔɔWDWWWɔWDWWWɔWDWWWɔ..ƚ....ƚ...ɔ', // 22 portes
    'ɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔ.....f.....ɔ', // 23
    'ɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔ', // 24
    'ƚƚƚƚƚƚƚƚƚƚƚƚƚƚƚƚƚƚƚƚƚƚƚƚƚƚƚƚƚƚƚƚ', // 25 arbres : bord de l'écran
  ]),
  doors: [
    { x: 3,  y: 4,  lockedDialogue: NOT_HOME },
    { x: 9, y: 4,  interior: 'hullHouse' },   // Romain et Paul
    { x: 15, y: 4,  lockedDialogue: ["[Texte provisoire] The pub is closed. Revenez plus tard !"] },
    { x: 21, y: 4,  lockedDialogue: NOT_HOME },
    { x: 7,  y: 14, interior: 'hullUniversity' },
    { x: 23, y: 14, lockedDialogue: ['[Texte provisoire] Le château est fermé aux visiteurs.'] },
    { x: 3,  y: 22, lockedDialogue: NOT_HOME },
    { x: 9, y: 22, lockedDialogue: NOT_HOME },
    { x: 15, y: 22, lockedDialogue: ["[Texte provisoire] The pub is closed. Revenez plus tard !"] },
  ],
  buildings: [
    { type: 'house', x: 2, y: 1 },
    { type: 'slateHouse', x: 8, y: 1 },
    { type: 'pub',     x: 14, y: 1 },
    { type: 'cottage', x: 20, y: 1 },
    { type: 'bus',     x: 2,  y: 9 },
    { type: 'university', x: 3, y: 11 },
    { type: 'bigBen',  x: 14, y: 9 },
    { type: 'castle',  x: 20, y: 10 },
    { type: 'slateHouse', x: 2, y: 19 },
    { type: 'house', x: 8, y: 19 },
    { type: 'pub',     x: 14, y: 19 },
  ],
  // Le bus rouge (arrêt à côté de l'université) : navette pour l'aéroport.
  objects: [2, 3, 4].flatMap((x) => [9, 10].map((y) => ({
    ...toAirport(x, y),
    readyDialogue: ["Tu prends le bus rouge pour l'aéroport."],
  }))).concat([airportSign(1, 8, false), airportSign(30, 8, true)]),
  // Les deux bouts de la grande rue mènent à l'aéroport.
  triggers: [toAirport(0, 6), toAirport(0, 7), toAirport(31, 6), toAirport(31, 7)],
  surroundings: { outside, border: 'ƚ', borderSkip: ['ɐ'] },
  spawn: { x: 1, y: 6, facing: 'right' },
};
