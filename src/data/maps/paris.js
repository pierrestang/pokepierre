import { parseGrid } from './parseGrid.js';
import { FLAGS } from '../story.js';
import { toAirport, airportSign } from './airportLinks.js';

// Hors de la carte : la Seine, l'avenue et les trottoirs se prolongent ; herbe près de l'eau, pavés ailleurs.
function outside(x, y, grid) {
  if (y >= 0 && y < grid.length) {
    const edge = grid[y][x < 0 ? 0 : grid[0].length - 1];
    if (['G', 'A', 'C'].includes(edge)) return edge;
  }
  return 'C';
}

const NOT_HOME = ['[Texte provisoire] Personne ne répond...'];

// Paris — tour Eiffel, Arc de Triomphe, Louvre, Notre-Dame, la Seine, cafés, bistrots et Bercy, 32 x 34 cases.
// Légende : voir src/data/tiles.js ($ = terrasse de café, ! = bouche de métro, J = drapeau français,
// l = réverbère, G = Seine, I = pont)
export const parisMap = {
  id: 'paris',
  name: 'Paris',
  grid: parseGrid([
    'TTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTT', // 0  arbres : bord de l'écran
    'CCRRRRRCRRRRRCRRRRRCRRRRRCRRRRRC', // 1  immeubles haussmanniens, bistrot, café
    'CCRRRRRCRRRRRCRRRRRCRRRRRCRRRRRC', // 2
    'CCWWWWWCWWWWWCWWWWWCWWWWWCWWWWWC', // 3
    'CCWWDWWCWDWWWCWDWWWCWWDWWCWWDWWC', // 4  portes (bistrot : 2e à gauche)
    'ClCCCCC!CCCClCCC$$$CCCCCClCCCClC', // 5  métro, terrasse du café, réverbères
    'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA', // 6  avenue (ouest : Bordeaux, est : aéroport)
    'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA', // 7
    'CCClCCCCCCCCClCCCCCClCCCCCCClC>C', // 8  panneaux aéroport
    'CCRRRRRCCCCCCCCC.T...RRRRR.RRRRC', // 9  Arc de Triomphe, Champ-de-Mars, tour Eiffel, l'entreprise
    'CCRRRRRCCCCCCCCC.....RRRRR.RRRRC', // 10
    'CCWWWWWCCCRRRRCC..f..RRRRR.RRRRC', // 11 pyramide du Louvre
    'CCWWWWWCJCWWWWCC...f.WWWWW.WWWWC', // 12
    'CCWWWWWCCCWWWWCC.....WWWWW.WDWWC', // 13 porte de l'entreprise
    'CCCCCCCCCCCCCCCC.T...WWWWW....TC', // 14
    'CCCCCCCCCCCCCCCC..f.J..f...f.f.C', // 15
    'CCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCC', // 16 quai
    'GGGGGGGIIGGGGGGGGGGGGGGGIIGGGGGG', // 17 la Seine et ses ponts
    'GGGGGGGIIGGGGGGGGGGGGGGGIIGGGGGG', // 18
    'CCCTCCCCCCCCTCCCTCCCTCCCCCCCCTCC', // 19 quai arboré
    'CCRRRRRCCRRRRRRRCRRRRRC.T..f..TC', // 20 immeuble, Notre-Dame, café, square
    'CCRRRRRCCRRRRRRRCRRRRRC.....T..C', // 21
    'CCWWWWWCCWWWWWWWCWWWWWC..f.....C', // 22
    'CCWWDWWCCWWWDWWWCWDWWWCf..T..f.C', // 23 portes
    'CCCCCCC!CCCCCCClCCCC$$CCCCCCCCCC', // 24
    'CAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA', // 25 rue sud (est : Toulon)
    'CAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA', // 26
    'CCCTCCCCTCCCCCCCCCCCCCCTCCCCTCCC', // 27
    'C.T.......CRRRRRRRRRRC..T......C', // 28 parc de Bercy, Accor Arena
    'C...f.T...CRRRRRRRRRRC....f.T..C', // 29
    'Cf......T.CWWWWWWWWWWC.f......TC', // 30
    'C..T...f..CWWWWDWWWWWC...T...f.C', // 31 porte de Bercy
    'CCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCC', // 32
    'TTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTT', // 33 arbres : bord de l'écran
  ]),
  doors: [
    { x: 4,  y: 4,  lockedDialogue: NOT_HOME },
    { x: 9,  y: 4,  interior: 'bistro' },   // le bistrot : ta première mission à Paris
    { x: 15, y: 4,  lockedDialogue: ['[Texte provisoire] Le café est complet ! Essaie le bistrot à côté.'] },
    { x: 22, y: 4,  lockedDialogue: NOT_HOME },
    // Ton appartement (immeuble en haut à droite) : après avoir dit au chef que tu emménages.
    {
      x: 28, y: 4, interior: 'parisAppart',
      lock: { ifFlags: [FLAGS.emmenagementParis] },
      lockedDialogue: ["[Texte provisoire] C'est ton futur appartement. Va d'abord manger au bistrot !"],
    },
    // L'entreprise (à droite de la tour Eiffel) : une fois l'offre trouvée sur l'ordinateur.
    {
      x: 28, y: 13, interior: 'entreprise',
      lock: { ifFlags: [FLAGS.rechercheTravail] },
      lockedDialogue: ["[Texte provisoire] Une grande entreprise. Tu n'as rien à y faire pour l'instant."],
    },
    { x: 4,  y: 23, lockedDialogue: NOT_HOME },
    { x: 12, y: 23, lockedDialogue: ['[Texte provisoire] Notre-Dame est en travaux.'] },
    { x: 18, y: 23, lockedDialogue: ['[Texte provisoire] Le café est fermé.'] },
    // Bercy : le concert, après le verre avec Hugues et Thomas.
    {
      x: 15, y: 31, interior: 'bercy',
      lock: { ifFlags: [FLAGS.verreBistro] },
      lockedDialogue: ['[Texte provisoire] Pas de concert ce soir à Bercy.'],
    },
  ],
  buildings: [
    { type: 'immeuble', x: 2,  y: 1, variant: 0 },
    { type: 'bistro',   x: 8,  y: 1 },
    { type: 'cafe',     x: 14, y: 1 },
    { type: 'immeuble', x: 20, y: 1, variant: 2 },
    { type: 'immeuble', x: 26, y: 1, variant: 1 },
    { type: 'arcTriomphe', x: 2, y: 9 },
    { type: 'louvrePyramid', x: 10, y: 11 },
    { type: 'eiffelTower', x: 21, y: 9 },
    { type: 'officeTower', x: 27, y: 9 },
    { type: 'immeuble', x: 2,  y: 20, variant: 2 },
    { type: 'notreDame', x: 9, y: 20 },
    { type: 'cafe',     x: 17, y: 20 },
    { type: 'bercy',    x: 11, y: 28 },
  ],
  events: [
    // À l'arrivée : ta première mission.
    {
      on: 'enter',
      unlessFlags: [FLAGS.repasParis, FLAGS.parisAccueil],
      steps: [
        { say: ['[Texte provisoire] Bienvenue à Paris !', "Première mission : aller manger au bistrot (2e bâtiment en haut à gauche)."] },
        { setFlag: FLAGS.parisAccueil },
      ],
    },
  ],
  // Panneaux « Aéroport » à côté des sorties.
  objects: [airportSign(30, 8, true)],
  triggers: [
    // Ouest : retour à Bordeaux par la route (arrivée dans la rue sud).
    ...[6, 7].map((y) => ({
      x: 0,
      y,
      readyDialogue: ['Tu reprends la route de Bordeaux.'],
      warp: { map: 'bordeaux', x: 30, y: 22, facing: 'left' },
    })),
    // Est : l'aéroport.
    toAirport(31, 6),
    toAirport(31, 7),
    // Rue sud, vers l'est : Toulon, une fois la rupture conventionnelle acceptée.
    ...[25, 26].map((y) => ({
      x: 31,
      y,
      ifFlags: [FLAGS.ruptureConventionnelle],
      dialogue: ['[Texte provisoire] La route du sud... Tu as encore des choses à faire à Paris.'],
      readyDialogue: ['Tu prends la route du sud, direction Toulon et la mer !'],
      setFlags: [FLAGS.arriveeToulon],
      warp: { map: 'toulon', x: 1, y: 6, facing: 'right' },
    })),
  ],
  surroundings: { outside, border: 'T', borderSkip: ['G', 'A'] },
  spawn: { x: 1, y: 6, facing: 'right' },
};
