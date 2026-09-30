import { parseGrid } from './parseGrid.js';
import { FLAGS } from '../story.js';
import { toAirport, airportSign } from './airportLinks.js';

const HARSH = { name: 'Harsh', color: 0x8c3cb0 };

// Hors de la carte : les rues et trottoirs se prolongent, pelouses ailleurs.
function outside(x, y, grid) {
  if (y >= 0 && y < grid.length) {
    const edge = grid[y][x < 0 ? 0 : grid[0].length - 1];
    if (['ɐ', 'ɔ'].includes(edge)) return edge;
  }
  return '.';
}

const NOT_HOME = ['[Texte provisoire] Personne ne répond...'];

// New Delhi — capitale de l'Inde, 32 x 26 cases.
// Légende : voir src/data/tiles.js (a = vache, d = tuk-tuk, g = drapeau indien,
// i = soucis, p = stand d'épices, k = lotus, Y = palmier)
export const newDelhiMap = {
  id: 'newDelhi',
  name: 'New Delhi',
  grid: parseGrid([
    'YYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYY', // 0  palmiers : bord de l'écran
    'ɔɔRRRRRRRRRɔɔRRRRRRRɔɔɔRRRRRRɔYɔ', // 1  havelis, palais moghol
    'ɔɔRRRRRRRRRYɔRRRRRRRɔYɔRRRRRRɔɔɔ', // 2
    'ɔɔWWWWWWWWWɔɔWWWWWWWɔɔɔWWWWWWYɔɔ', // 3
    'ɔɔWDWWDWWDWɔɔWWWDWWWɔɔɔWDWWDWɔɔɔ', // 4  portes
    'ɔpɔɔɔɔɔɔɔɔɔɔpɔɔɔɔɔɔɔaɔiɔɔɔɔɔɔpɔɔ', // 5  stands d'épices, vache sacrée
    'ɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐ', // 6  grande avenue (vers l'aéroport)
    'ɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐ', // 7
    'ɔ<ɔdɔɔɔɔɔɔaɔɔɔɔdɔɔɔɔɔɔɔɔɔɔɔdɔɔ>ɔ', // 8  tuk-tuks  panneaux aéroport
    '.Y.RRRRR.Y.........Y.......Y....', // 9  pelouses : India Gate
    '...RRRRR.....RRR.....~k~~k....i.', // 10 statue de Bouddha, bassin aux lotus
    '...WWWWW...g.RRR.g...~~~k~......', // 11 drapeaux indiens
    '...WWWWW.....WWW.....k~~~~...Y..', // 12
    '...WWWWW.Y.a.WWW................', // 13
    '..i.....i..........Y.i..i.a.i...', // 14 soucis
    '.Y.i......i.i...i.i...i.......Y.', // 15
    'ɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔ', // 16
    'ɔɔɔRRRRRRRRRɔpɔpɔpɔɔRRRRRRRRRɔɔɔ', // 17 université, marché aux épices, havelis
    'ɔɔɔRRRRRRRRRɔaɔɔɔɔɔɔRRRRRRRRRɔɔɔ', // 18
    'ɔɔɔWWWWWWWWWɔɔpɔpɔpɔWWWWWWWWWɔɔɔ', // 19
    'ɔɔɔWWWWDWWWWɔɔɔɔɔɔɔɔWDWWDWWDWɔɔɔ', // 20 portes
    'ɔɔɔɔɔɔɔɔɔɔɔɔdɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔdɔɔ', // 21
    'ɔɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɔ', // 22 rue sud
    'ɔɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɔ', // 23
    'ɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔaɔɔɔɔɔɔɔɔɔɔɔ', // 24
    'YYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYY', // 25 palmiers : bord de l'écran
  ]),
  doors: [
    { x: 3,  y: 4,  lockedDialogue: NOT_HOME },
    { x: 6,  y: 4,  lockedDialogue: NOT_HOME },
    { x: 9,  y: 4,  lockedDialogue: NOT_HOME },
    { x: 16, y: 4,  lockedDialogue: ['[Texte provisoire] Le palais est fermé aux visiteurs.'] },
    { x: 24, y: 4,  lockedDialogue: NOT_HOME },
    { x: 27, y: 4,  lockedDialogue: NOT_HOME },
    { x: 7,  y: 20, interior: 'delhiUniversity' },   // ton université d'échange
    { x: 21, y: 20, lockedDialogue: NOT_HOME },
    { x: 24, y: 20, lockedDialogue: NOT_HOME },
    { x: 27, y: 20, lockedDialogue: NOT_HOME },
  ],
  buildings: [
    { type: 'haveli', x: 2,  y: 1, variant: 0 },
    { type: 'haveli', x: 5,  y: 1, variant: 1 },
    { type: 'haveli', x: 8,  y: 1, variant: 2 },
    { type: 'mughalPalace', x: 13, y: 1 },
    { type: 'haveli', x: 23, y: 1, variant: 3 },
    { type: 'haveli', x: 26, y: 1, variant: 4 },
    { type: 'indiaGate', x: 3, y: 9 },
    { type: 'buddha', x: 13, y: 10 },
    { type: 'delhiUniversity', x: 3, y: 17 },
    { type: 'haveli', x: 20, y: 17, variant: 4 },
    { type: 'haveli', x: 23, y: 17, variant: 0 },
    { type: 'haveli', x: 26, y: 17, variant: 2 },
  ],
  npcs: [
    // Harsh, étudiant à l'université : il t'attend à la sortie et propose d'aller dans le désert.
    {
      id: 'harsh', ...HARSH, x: 8, y: 21, facing: 'left',
      ifFlags: [FLAGS.echangeCommence],
      unlessFlags: [FLAGS.potionDonnee],
      dialogue: [
        "[Harsh - texte provisoire] Salut ! Moi c'est Harsh, j'étudie à l'université avec toi.",
        'Ça te dirait de venir avec moi dans le désert du Rajasthan ?',
      ],
      after: ['[Harsh - texte provisoire] Alors, on part dans le désert ?'],
      setFlag: FLAGS.harshRencontre,
      ask: {
        question: 'Aller dans le désert avec Harsh ?',
        choices: [
          {
            label: 'Oui',
            dialogue: ['[Harsh - texte provisoire] Génial ! En route pour le Rajasthan !'],
            setFlags: [FLAGS.arriveeRajasthan],
            warp: { map: 'rajasthan', x: 2, y: 10, facing: 'right' },
          },
          { label: 'Non', dialogue: ['[Harsh - texte provisoire] Dommage ! Reviens me voir si tu changes d\'avis.'] },
        ],
      },
    },
    {
      id: 'harsh-retour', ...HARSH, x: 8, y: 21, facing: 'left',
      ifFlags: [FLAGS.potionDonnee],
      dialogue: ['[Harsh - texte provisoire] Quel voyage ! Va raconter ça à la professeure.'],
    },
  ],
  events: [
    // En sortant de l'université après le premier cours : Harsh t'aborde.
    {
      on: 'enter',
      ifFlags: [FLAGS.echangeCommence],
      unlessFlags: [FLAGS.harshRencontre],
      steps: [{ talk: 'harsh' }],
    },
  ],
  // Les deux bouts de la grande avenue mènent à l'aéroport.
  // Panneaux « Aéroport » à côté des sorties.
  objects: [airportSign(1, 8, false), airportSign(30, 8, true)],
  triggers: [toAirport(0, 6), toAirport(0, 7), toAirport(31, 6), toAirport(31, 7)],
  surroundings: { outside, border: 'Y', borderSkip: ['ɐ'] },
  spawn: { x: 1, y: 6, facing: 'right' },
};
