import { parseGrid } from './parseGrid.js';
import { FLAGS } from '../story.js';
import { toAirport, airportSign } from './airportLinks.js';

// Hors de la carte : le boulevard, les quais, la plage et la mer se prolongent.
function outside(x, y, grid) {
  if (y >= 0 && y < grid.length) {
    const edge = grid[y][x < 0 ? 0 : grid[0].length - 1];
    if (['ɐ', 'ɔ', 's', 'w'].includes(edge)) return edge;
  }
  return y >= grid.length ? 'w' : 'ɔ';
}

const NOT_HOME = ['[Texte provisoire] Personne ne répond...'];
// Bateaux du port (3x2 chacun), à examiner.
const BOATS = [[5, 15], [11, 14], [11, 17]];
const FERRY = 2; // le bateau du bas, au ponton de droite : ferry pour la Corse

// Toulon — ville côtière : maisons provençales, port, plage, phare, 32 x 26 cases.
// Légende : voir src/data/tiles.js (w = mer, s = sable, = = ponton, B = bateau)
export const toulonMap = {
  id: 'toulon',
  name: 'Toulon',
  grid: parseGrid([
    'ƀƀƀƀƀƀƀƀƀƀƀƀƀƀƀƀƀƀƀƀƀƀƀƀƀƀƀƀƀƀƀƀ', // 0  pins : bord de l'écran
    'ɔɔRRRRRɔRRRRRɔRRRRRɔRRRRRɔRRRRRɔ', // 1  maisons provençales (Yanis : 2e maison)
    'ɔɔRRRRRɔRRRRRɔRRRRRɔRRRRRɔRRRRRɔ', // 2
    'ɔɔWWWWWɔWWWWWɔWWWWWɔWWWWWɔWWWWWɔ', // 3
    'ɔɔWWDWWɔWWDWWɔWWDWWɔWWDWWɔWWDWWɔ', // 4  portes
    'ɔYɔɔɔɔɔYɔɔɔɔɔYɔɔɔɔɔYɔɔɔɔɔYɔɔɔɔlɔ', // 5  palmiers
    'ɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐ', // 6  boulevard (ouest : Paris, est : aéroport)
    'ɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐ', // 7
    'ɔɔɔɔɔɔlɔɔɔɔɔɔɔɔɔɔɔlɔɔɔɔɔɔɔɔɔɔɔ>ɔ', // 8
    'ɔɔYɔɔɔɔɔɔɔɔɔYɔɔRRRRRɔRRRRRɔ.Y..ɔ', // 9  place du marché, maisons, jardin
    'ɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔRRRRRɔRRRRRɔf...ɔ', // 10
    'ɔɔɔtɔtɔɔɔtɔtɔɔɔWWWWWɔWWWWWɔ...Yɔ', // 11 étals du marché
    'ɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔWWDWWɔWWDWWɔ..f.ɔ', // 12
    'ɔɔɔɔɔɔlɔɔɔɔɔlɔɔɔlɔɔɔɔɔlɔɔɔɔɔɔɔɔɔ', // 13 quai du port
    'wwww=wwwww=BBBwwwwwsYsssYsssRRsY', // 14 port (pontons, bateaux), plage, phare
    'wwww=BBBww=BBBwwwwwsssssssssRRss', // 15
    'wwww=BBBww=wwwwwwwwsssssssssRRss', // 16
    'wwww=wwwww=BBBwwwwwsssssssssssss', // 17
    'wwww=wwwww=BBBwwwwwwsssssssssssw', // 18
    'wwwwwwwwwwwwwwwwwwwwwwwwwwwwwwww', // 19 la Méditerranée
    'wwwwwwwwwwwwwwwwwwwwwwwwwwwwwwww', // 20
    'wwwwwwwwwwwwwwwwwwwwwwwwwwwwwwww', // 21
    'wwwwwwwwwwwwwwwwwwwwwwwwwwwwwwww', // 22
    'wwwwwwwwwwwwwwwwwwwwwwwwwwwwwwww', // 23
    'wwwwwwwwwwwwwwwwwwwwwwwwwwwwwwww', // 24
    'wwwwwwwwwwwwwwwwwwwwwwwwwwwwwwww', // 25
  ]),
  doors: [
    { x: 4,  y: 4,  lockedDialogue: NOT_HOME },
    { x: 10, y: 4,  interior: 'yanisAppart' },   // l'appartement de Yanis
    { x: 16, y: 4,  lockedDialogue: NOT_HOME },
    { x: 22, y: 4,  lockedDialogue: NOT_HOME },
    { x: 28, y: 4,  lockedDialogue: NOT_HOME },
    { x: 17, y: 12, lockedDialogue: NOT_HOME },
    { x: 23, y: 12, lockedDialogue: NOT_HOME },
  ],
  buildings: [
    { type: 'provencalHouse', x: 2,  y: 1, variant: 0 },
    { type: 'provencalHouse', x: 8,  y: 1, variant: 1 },
    { type: 'provencalHouse', x: 14, y: 1, variant: 2 },
    { type: 'provencalHouse', x: 20, y: 1, variant: 3 },
    { type: 'provencalHouse', x: 26, y: 1, variant: 4 },
    { type: 'provencalHouse', x: 15, y: 9, variant: 2 },
    { type: 'provencalHouse', x: 21, y: 9, variant: 0 },
    // Voiliers d'Émeraude ; le ferry pour la Corse est celui de Rouge Feu.
    ...BOATS.map(([x, y], i) => ({ type: i === FERRY ? 'ferry' : 'boat', x, y })),
    { type: 'lighthouse', x: 28, y: 14 },
  ],
  objects: [
    airportSign(30, 8, true),
    ...BOATS.flatMap(([bx, by], i) => [0, 1, 2].flatMap((dx) => [0, 1].map((dy) => (i === FERRY
      ? {
          // Deuxième quête de Toulon : le ferry pour la Corse, rendre visite à tes parents.
          x: bx + dx,
          y: by + dy,
          ifFlags: [FLAGS.chezYanis],
          dialogue: ["[Texte provisoire] Le ferry pour la Corse. Va d'abord saluer Yanis."],
          readyDialogue: ['Tu embarques sur le ferry pour la Corse, chez tes parents !'],
          warp: { map: 'corse', x: 11, y: 18, facing: 'up' },
        }
      : {
          x: bx + dx,
          y: by + dy,
          dialogue: ['[Texte provisoire] Un joli voilier amarré au port de Toulon.'],
        })))),
  ],
  events: [
    // À l'arrivée : la mission.
    {
      on: 'enter',
      unlessFlags: [FLAGS.toulonAccueil],
      steps: [
        { say: ['[Texte provisoire] Bienvenue à Toulon !', "Mission : rejoindre l'appartement de Yanis (2e maison en haut à gauche)."] },
        { setFlag: FLAGS.toulonAccueil },
      ],
    },
  ],
  triggers: [
    // Ouest : retour à Paris (arrivée dans la rue sud).
    ...[6, 7].map((y) => ({
      x: 0,
      y,
      readyDialogue: ['Tu remontes vers Paris.'],
      warp: { map: 'paris', x: 30, y: 25, facing: 'left' },
    })),
    // Est : l'aéroport.
    toAirport(31, 6),
    toAirport(31, 7),
  ],
  surroundings: { outside, border: 'T', borderSkip: ['ɐ', 'w', 's', 'ɔ'] },
  spawn: { x: 1, y: 6, facing: 'right' },
};
