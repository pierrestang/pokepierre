import { parseGrid } from './parseGrid.js';
import { toAirport, airportSign } from './airportLinks.js';
import { FLAGS } from '../story.js';

// Hors de la carte : les canaux, la rue et les quais se prolongent ; pavés ailleurs.
function outside(x, y, grid) {
  if (y >= 0 && y < grid.length) {
    const edge = grid[y][x < 0 ? 0 : grid[0].length - 1];
    if (['G', 'ɐ', 'ɔ'].includes(edge)) return edge;
  }
  return 'ɔ';
}

const NOT_HOME = ['[Texte provisoire] Personne ne répond...'];

// Amsterdam — canaux, péniches (longs bateaux en bois d'Émeraude, 6 x 2 cases), moulin, vélos et parcs fleuris, 32 x 26 cases.
// Légende : voir src/data/tiles.js (G = canal, I = pont, c = vélos, f = fleurs, e = drapeau)
export const amsterdamMap = {
  id: 'amsterdam',
  name: 'Amsterdam',
  grid: parseGrid([
    'ƀƀƀƀƀƀƀƀƀƀƀƀƀƀƀƀƀƀƀƀƀƀƀƀƀƀƀƀƀƀƀƀ', // 0  arbres : bord de l'écran
    'ɔɔRRRRRRRRRɔɔɔRRRRRRRɔɔRRRRRRɔɔɔ', // 1  maisons, CORNING
    'ɔɔRRRRRRRRRƀɔɔRRRRRRRɔɔRRRRRRƀɔɔ', // 2
    'ɔɔWWWWWWWWWɔɔɔWWWWWWWɔɔWWWWWWɔƀɔ', // 3
    'ɔɔWWDWWWDWWɔɔɔWWWDWWWɔɔWWWWDWɔɔɔ', // 4  portes (maison commune : 2e à gauche)
    'ɔcɔɔɔɔɔɔɔɔɔccɔɔɔɔɔɔɔeɔcɔɔɔɔɔɔccɔ', // 5  vélos, drapeau
    'ɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐ', // 6  rue (vers l'aéroport)
    'ɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐ', // 7
    'ɔ<ƀɔɔɔɔɔɔɔƀɔɔɔƀɔɔɔɔɔƀɔɔɔɔɔɔɔƀɔ>ɔ', // 8  quai arboré  panneaux aéroport
    'GGGGGGIIGGGGGGGGGGGGGGGGIIGGGGGG', // 9  premier canal et ses ponts
    'GGGGGGIIGGGGGGGGGGGGGGGGIIGGGGGG', // 10
    'ɔɔɔɔɔɔɔɔɔɔƀɔɔɔɔɔɔɔɔɔƀɔɔɔɔɔɔɔƀɔɔɔ', // 11
    'ɔɔɔRRRRRɔRRRRRɔɔɔɔf.ƀ.RRR.f.ff.ɔ', // 12 coffee shop, crèche, moulin et fleurs
    'ɔɔɔRRRRRɔRRRRRɔɔɔɔ.f..RRR..f..eɔ', // 13
    'ɔɔɔWWWWWɔWWWWWɔɔɔɔ..f.WWW...f..ɔ', // 14
    'ɔɔɔWDWWWɔWWDWWɔɔɔɔ.f..WWW.f..f.ɔ', // 15 portes (coffee shop : à gauche)
    'ɔɔcɔɔɔɔɔɔɔɔɔɔɔɔɔccɔɔɔɔɔɔɔɔɔɔɔɔɔɔ', // 16
    'GGGGGGIIGGGGGGGGGGGGGGGGIIGGGGGG', // 17 deuxième canal
    'GGGGGGIIGGGGGGGGGGGGGGGGIIGGGGGG', // 18
    'ɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔƀɔɔɔɔƀɔɔɔɔɔɔɔɔƀɔɔ', // 19
    'ɔɔRRRRRɔRRRRRRRRRRɔƀ...f....f.ƀɔ', // 20 maisons, parc fleuri
    'ɔɔRRRRRɔRRRRRRRRRRɔ.f...f.ƀ....ɔ', // 21
    'ɔɔWWWWWɔWWWWWWWWWWɔ..f.....f...ɔ', // 22
    'ɔɔWDWWWɔWDWWWWDWWWɔ...f..ƀ....fɔ', // 23
    'ɔɔɔɔɔɔɔɔɔɔɔccɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔ', // 24
    'ƀƀƀƀƀƀƀƀƀƀƀƀƀƀƀƀƀƀƀƀƀƀƀƀƀƀƀƀƀƀƀƀ', // 25 arbres : bord de l'écran
  ]),
  doors: [
    { x: 4,  y: 4,  lockedDialogue: NOT_HOME },
    // La maison commune (avec Romain) : ouverte quand Romain t'a donné rendez-vous.
    {
      x: 8, y: 4, interior: 'maisonCommune',
      lock: { ifFlags: [FLAGS.romainDemande] },
      lockedDialogue: ["[Texte provisoire] C'est votre maison commune, mais il n'y a personne pour l'instant."],
    },
    { x: 17, y: 4,  interior: 'corning' },
    { x: 27, y: 4,  lockedDialogue: NOT_HOME },
    // Le coffee shop : une fois que Romain t'a demandé la marchandise.
    {
      x: 4, y: 15, interior: 'coffeeShop',
      lock: { ifFlags: [FLAGS.romainDemande] },
      lockedDialogue: ["[Texte provisoire] Rien à faire ici pour l'instant."],
    },
    { x: 11, y: 15, lockedDialogue: NOT_HOME },
    { x: 3,  y: 23, lockedDialogue: NOT_HOME },
    { x: 9,  y: 23, lockedDialogue: NOT_HOME },
    { x: 14, y: 23, lockedDialogue: NOT_HOME },
  ],
  buildings: [
    { type: 'purpleHouse', x: 2, y: 1 },
    { type: 'chimneyHouse', x: 7, y: 1 },
    { type: 'lab', x: 14, y: 1 },                 // CORNING
    { type: 'blueHouse', x: 23, y: 1 },
    { type: 'houseboat', x: 9, y: 9 },
    { type: 'houseboat', x: 16, y: 9 },
    { type: 'school', x: 3, y: 12 },              // le coffee shop : auvent vert, jardinières
    { type: 'dayCare', x: 9, y: 12 },
    { type: 'windmill', x: 22, y: 12 },
    { type: 'houseboat', x: 10, y: 17 },
    { type: 'houseboat', x: 17, y: 17 },
    { type: 'house', x: 2, y: 20 },
    { type: 'slateHouse', x: 8, y: 20 },
    { type: 'greenHouse', x: 13, y: 20 },
  ],
  npcs: [
    // Romain t'attend à la sortie de CORNING, après ton premier rendez-vous avec Laurent.
    {
      id: 'romain-dehors', name: 'Romain', x: 18, y: 5, facing: 'left', color: 0xc0602c,
      ifFlags: [FLAGS.stageCorning],
      unlessFlags: [FLAGS.romainDemande],
      dialogue: [
        '[Romain - texte provisoire] Hé ! Tu sors du boulot ?',
        'Tu peux passer au coffee shop acheter la marchandise ?',
        'Rejoins-moi ensuite à notre maison commune (2e maison en haut à gauche).',
      ],
      setFlag: FLAGS.romainDemande,
    },
  ],
  events: [
    // En sortant de CORNING : Romain t'interpelle.
    {
      on: 'enter',
      ifFlags: [FLAGS.stageCorning],
      unlessFlags: [FLAGS.romainDemande],
      steps: [{ talk: 'romain-dehors' }],
    },
  ],
  // Les deux bouts de la rue mènent à l'aéroport.
  // Panneaux « Aéroport » à côté des sorties.
  objects: [airportSign(1, 8, false), airportSign(30, 8, true)],
  triggers: [toAirport(0, 6), toAirport(0, 7), toAirport(31, 6), toAirport(31, 7)],
  surroundings: { outside, border: 'ƀ', borderSkip: ['G', 'ɐ'] },
  spawn: { x: 1, y: 6, facing: 'right' },
};
