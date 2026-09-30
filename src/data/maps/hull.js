import { parseGrid } from './parseGrid.js';
import { toAirport, airportSign } from './airportLinks.js';

// Hors de la carte : la grande rue et les trottoirs se prolongent, sol de ville ailleurs.
function outside(x, y, grid) {
  if (y >= grid.length) return '~';                              // l'estuaire de la Humber
  if (y >= 0) {
    const edge = grid[y][x < 0 ? 0 : grid[0].length - 1];
    if (['ɐ', 'ɔ', '~'].includes(edge)) return edge;
  }
  return 'ɔ';
}

const NOT_HOME = ["[Texte provisoire] Personne ne répond..."];

// Hull (Kingston upon Hull) — ville portuaire du Yorkshire sur l'estuaire de la Humber, 32 x 30 cases, façon
// Rouge Feu : en haut, maisons mitoyennes et pub, cabines téléphoniques crème (propres à Hull) ; la grande rue
// (vers l'aéroport) ; au centre, l'arrêt du bus local bleu et crème, l'université, Queen's Gardens (bassin et
// monument à William Wilberforce) et le Guildhall à colonnes ; en bas, la vieille ville (vieux pub), The Deep
// (l'aquarium) sur le quai, puis la Humber : Victoria Pier et le ferry de nuit pour Rotterdam.
// Légende : voir src/data/tiles.js (ɔ = pavés, ɐ = dalles, ~ = estuaire, = = ponton, B = ferry, b = cabine
// téléphonique, j = Union Jack, l = réverbère, q = bus, S = panneau, f = fleurs, ƚ = petit arbre)
export const hullMap = {
  id: 'hull',
  name: 'Hull',
  grid: parseGrid([
    'ƚƚƚƚƚƚƚƚƚƚƚƚƚƚƚƚƚƚƚƚƚƚƚƚƚƚƚƚƚƚƚƚ', // 0
    'ƚƚRRRRRƚRRRRRƚRRRRRƚRRRRRƚRRRRRƚ', // 1
    'ƚƚRRRRRƚRRRRRƚRRRRRƚRRRRRƚRRRRRƚ', // 2
    'ƚƚWWWWWƚWWWWWƚWWWWWƚWWWWWƚWWWWWƚ', // 3
    'ɔɔWDWWWɔWDWWWɔWDWWWɔWDWWWɔWDWWWɔ', // 4
    'ɔlɔɔɔɔbɔɔɔɔɔlɔɔɔɔɔbɔɔɔɔɔlɔɔɔɔɔɔɔ', // 5
    'ɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐ', // 6
    'ɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐ', // 7
    'ɔ<ɔɔɔɔlɔɔɔɔɔɔɔɔɔɔɔlɔɔɔɔɔɔɔɔɔɔɔ>ɔ', // 8
    'ɔɐqqqɐɔɔɔɔɔɔɔƚ.RR.jƚRRRRRRRRRRRɔ', // 9
    'ɔɐqqqɐɔɔɔɔɔɔɔ..RRS..RRRRRRRRRRRɔ', // 10
    'ɔɔɔRRRRRRRRRɔf.....fRRRRRRRRRRRɔ', // 11
    'ɔɔɔRRRRRRRRRɔf~~~~~fWWWWWWWWWWWɔ', // 12
    'ɔɔɔWWWWWWWWWɔf~~~~~fWWWWWWWWWWWɔ', // 13
    'ɔɔɔWWWWDWWWWɔf~~~~~fWWWWWWWWWWWɔ', // 14
    'ɔɔbɔɔɔɔɔɔɔɔɔlf.....fɔfffWWWfffɔɔ', // 15
    'ɔɔɔɔɔɔɔɔɔɔɔɔɔƚ.....ƚɔfffWDWfffɔɔ', // 16
    'ɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐ', // 17
    'ɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐ', // 18
    'ɔɔɔɔɔlɔɔɔɔɔɔɔɔɔɔɔlɔɔɔɔɔɔɔɔɔɔɔlɔɔ', // 19
    'ɔɔRRRRRɔRRRRRɔRRRRRɔɔɔɔɔRRRRRRɔɔ', // 20
    'ɔɔRRRRRɔRRRRRɔRRRRRɔɔjɔɔRRRRRRɔɔ', // 21
    'ɔɔWWWWWɔWWWWWɔWWWWWɔbɔɔɔWWWWWWɔɔ', // 22
    'ɔɔWDWWWɔWDWWWɔWDWWWɔɔɔɔɔWDWWWWɔɔ', // 23
    'ɔɔSɔɔɔɔɔlɔɔɔɔɔɔɔɔɔɔɔlɔɔɔɔɔɔɔɔɔɔɔ', // 24
    '~~~~~~~~~~==~~~~~~~~~~~~~~~~~~~~', // 25
    '~~~~~~~~~~==~BBBB~~~~~~~~~~~~~~~', // 26
    '~~~~~~~~~~==~BBBB~~~~~~~~~~~~~~~', // 27
    '~~~~~~~~~~==~~~~~~~~~~~~~~~~~~~~', // 28
    '~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~', // 29
  ]),
  doors: [
    { x: 3, y: 4, lockedDialogue: NOT_HOME },
    { x: 9, y: 4, interior: 'hullHouse' },   // Romain et Paul
    { x: 15, y: 4, lockedDialogue: ["The pub is closed. Revenez plus tard !"] },
    { x: 21, y: 4, lockedDialogue: NOT_HOME },
    { x: 27, y: 4, lockedDialogue: NOT_HOME },
    { x: 7, y: 14, interior: 'hullUniversity' },
    { x: 25, y: 16, lockedDialogue: ["Le Guildhall, la mairie de Hull. Les bureaux sont fermés aujourd'hui."] },
    { x: 3, y: 23, lockedDialogue: NOT_HOME },
    { x: 9, y: 23, lockedDialogue: NOT_HOME },
    { x: 15, y: 23, lockedDialogue: ["Ye Olde White Harte, le plus vieux pub de la ville. Fermé pour l'instant."] },
    { x: 25, y: 23, lockedDialogue: ["The Deep, l'aquarium de Hull. Les requins dorment : reviens demain !"] },
  ],
  buildings: [
    { type: 'house', x: 2, y: 1 },
    { type: 'slateHouse', x: 8, y: 1 },
    { type: 'pub', x: 14, y: 1 },
    { type: 'cottage', x: 20, y: 1 },
    { type: 'slateHouse', x: 26, y: 1 },
    { type: 'bus', x: 2, y: 9, variant: 'hull' },
    { type: 'university', x: 3, y: 11 },
    { type: 'wilberforce', x: 15, y: 9 },
    { type: 'museum', x: 20, y: 9 },
    { type: 'slateHouse', x: 2, y: 20 },
    { type: 'house', x: 8, y: 20 },
    { type: 'pub', x: 14, y: 20 },
    { type: 'theDeep', x: 24, y: 20 },
    { type: 'ferry', x: 13, y: 26 },
  ],
  // Le bus local (arrêt à côté de l'université) : navette pour l'aéroport.
  objects: [2, 3, 4].flatMap((x) => [9, 10].map((y) => ({
    ...toAirport(x, y),
    readyDialogue: ["Tu prends le bus pour l'aéroport."],
  }))).concat([
    airportSign(1, 8, false),
    airportSign(30, 8, true),
    { x: 17, y: 10, dialogue: ["Queen's Gardens."] },
    ...[15, 16].map((x) => ({
      x, y: 10,
      dialogue: [
        'Le monument à William Wilberforce, né à Hull en 1759.',
        "Il a consacré sa vie à faire abolir la traite des esclaves dans l'Empire britannique.",
      ],
    })),
    { x: 2, y: 24, dialogue: ["Ouest : le pont de la Humber, l'un des plus longs ponts suspendus du monde."] },
    ...[12, 13, 14, 15, 16].flatMap((x) => [26, 27].map((y) => ({
      x, y, dialogue: ['Le ferry de nuit pour Rotterdam, amarré au bout de Victoria Pier.'],
    }))),
  ]),
  // Les deux bouts de la grande rue mènent à l'aéroport.
  triggers: [toAirport(0, 6), toAirport(0, 7), toAirport(31, 6), toAirport(31, 7)],
  surroundings: { outside, border: 'ƚ', borderSkip: ['ɐ', '~'] },
  spawn: { x: 1, y: 6, facing: 'right' },
};
