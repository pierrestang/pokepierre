import { parseGrid } from './parseGrid.js';
import { FLAGS } from '../story.js';
import { toAirport, airportSign } from './airportLinks.js';

// Hors de la carte : la Seine, l'avenue et les trottoirs se prolongent ; herbe près de l'eau, pavés ailleurs.
function outside(x, y, grid) {
  if (y >= 0 && y < grid.length) {
    const edge = grid[y][x < 0 ? 0 : grid[0].length - 1];
    if (['G', 'ɐ', 'ɔ'].includes(edge)) return edge;
  }
  return 'ɔ';
}

const NOT_HOME = ['[Texte provisoire] Personne ne répond...'];

// Paris — tour Eiffel, Arc de Triomphe, Louvre, Notre-Dame, la Seine, cafés, bistrots et Bercy, 32 x 34 cases.
// Légende : voir src/data/tiles.js ($ = terrasse de café, ! = bouche de métro, J = drapeau français,
// l = réverbère, G = Seine, I = pont)
export const parisMap = {
  id: 'paris',
  name: 'Paris',
  grid: parseGrid([
    'ƀƀƀƀƀƀƀƀƀƀƀƀƀƀƀƀƀƀƀƀƀƀƀƀƀƀƀƀƀƀƀƀ', // 0  arbres : bord de l'écran
    'ɔɔRRRRRɔRRRRRɔRRRRRɔRRRRRɔRRRRRɔ', // 1  immeubles haussmanniens, bistrot, café
    'ɔɔRRRRRɔRRRRRɔRRRRRɔRRRRRɔRRRRRɔ', // 2
    'ɔɔWWWWWɔWWWWWɔWWWWWɔWWWWWɔWWWWWɔ', // 3
    'ɔɔWDWWWɔWDWWWɔWDWWWɔWDWWWɔWDWWWɔ', // 4  portes (bistrot : 2e à gauche)
    'ɔlɔɔɔɔɔ!ɔɔɔɔlɔɔɔ$$$ɔɔɔɔɔɔlɔɔɔɔlɔ', // 5  métro, terrasse du café, réverbères
    'ɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐ', // 6  avenue (ouest : Bordeaux, est : aéroport)
    'ɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐ', // 7
    'ɔɔɔlɔɔɔɔɔɔɔɔɔlɔɔɔɔɔɔlɔɔɔɔɔɔɔlɔ>ɔ', // 8  panneaux aéroport
    'ɔɔRRRRRɔɔɔɔɔɔɔɔɔ.ƀ...RRRRR.RRRRɔ', // 9  Arc de Triomphe, Champ-de-Mars, tour Eiffel, l'entreprise
    'ɔɔRRRRRɔɔɔɔɔɔɔɔɔ.....RRRRR.RRRRɔ', // 10
    'ɔɔWWWWWɔɔɔRRRRɔɔ..f..RRRRR.RRRRɔ', // 11 pyramide du Louvre
    'ɔɔWWWWWɔJɔWWWWɔɔ...f.WWWWW.WWWWɔ', // 12
    'ɔɔWWWWWɔɔɔWWWWɔɔ.....WWWWW.WDWWɔ', // 13 porte de l'entreprise
    'ɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔ.ƀ...WWWWW....ƀɔ', // 14
    'ɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔ..f.J..f...f.f.ɔ', // 15
    'ɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔ', // 16 quai
    'GGGGGGGIIGGGGGGGGGGGGGGGIIGGGGGG', // 17 la Seine et ses ponts
    'GGGGGGGIIGGGGGGGGGGGGGGGIIGGGGGG', // 18
    'ɔɔɔƀɔɔɔɔɔɔɔɔƀɔɔɔƀɔɔɔƀɔɔɔɔɔɔɔɔƀɔɔ', // 19 quai arboré
    'ɔɔRRRRRɔɔRRRRRRRɔRRRRRɔ.ƀ..f..ƀɔ', // 20 immeuble, Notre-Dame, café, square
    'ɔɔRRRRRɔɔRRRRRRRɔRRRRRɔ.....ƀ..ɔ', // 21
    'ɔɔWWWWWɔɔWWWWWWWɔWWWWWɔ..f.....ɔ', // 22
    'ɔɔWDWWWɔɔWWWDWWWɔWDWWWɔf..ƀ..f.ɔ', // 23 portes
    'ɔɔɔɔɔɔɔ!ɔɔɔɔɔɔɔlɔɔɔɔ$$ɔɔɔɔɔɔɔɔɔɔ', // 24
    'ɔɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐ', // 25 rue sud (est : Toulon)
    'ɔɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐ', // 26
    'ɔɔɔƀɔɔɔɔƀɔɔɔɔɔɔɔɔɔɔɔɔɔɔƀɔɔɔɔƀɔɔɔ', // 27
    'ɔ.ƀ.......ɔRRRRRRRRRRɔ..ƀ......ɔ', // 28 parc de Bercy, Accor Arena
    'ɔ...f.ƀ...ɔRRRRRRRRRRɔ....f.ƀ..ɔ', // 29
    'ɔf......ƀ.ɔWWWWWWWWWWɔ.f......ƀɔ', // 30
    'ɔ..ƀ...f..ɔWWWWDWWWWWɔ...ƀ...f.ɔ', // 31 porte de Bercy
    'ɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔ', // 32
    'ƀƀƀƀƀƀƀƀƀƀƀƀƀƀƀƀƀƀƀƀƀƀƀƀƀƀƀƀƀƀƀƀ', // 33 arbres : bord de l'écran
  ]),
  doors: [
    { x: 3,  y: 4,  lockedDialogue: NOT_HOME },
    { x: 9,  y: 4,  interior: 'bistro' },   // le bistrot : ta première mission à Paris
    { x: 15, y: 4,  lockedDialogue: ['[Texte provisoire] Le café est complet ! Essaie le bistrot à côté.'] },
    { x: 21, y: 4,  lockedDialogue: NOT_HOME },
    // Ton appartement (immeuble en haut à droite) : après avoir dit au chef que tu emménages.
    {
      x: 27, y: 4, interior: 'parisAppart',
      lock: { ifFlags: [FLAGS.emmenagementParis] },
      lockedDialogue: ["[Texte provisoire] C'est ton futur appartement. Va d'abord manger au bistrot !"],
    },
    // L'entreprise (à droite de la tour Eiffel) : une fois l'offre trouvée sur l'ordinateur.
    {
      x: 28, y: 13, interior: 'entreprise',
      lock: { ifFlags: [FLAGS.rechercheTravail] },
      lockedDialogue: ["[Texte provisoire] Une grande entreprise. Tu n'as rien à y faire pour l'instant."],
    },
    { x: 3,  y: 23, lockedDialogue: NOT_HOME },
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
    { type: 'slateHouse', x: 2, y: 1 },
    { type: 'bistro',   x: 8,  y: 1 },
    { type: 'cafe',     x: 14, y: 1 },
    { type: 'slateHouse', x: 20, y: 1 },
    { type: 'house', x: 26, y: 1 },
    { type: 'arcTriomphe', x: 2, y: 9 },
    { type: 'louvrePyramid', x: 10, y: 11 },
    { type: 'eiffelTower', x: 21, y: 9 },
    { type: 'officeTower', x: 27, y: 9 },
    { type: 'slateHouse', x: 2, y: 20 },
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
  surroundings: { outside, border: 'ƚ', borderSkip: ['G', 'ɐ'] },
  spawn: { x: 1, y: 6, facing: 'right' },
};
