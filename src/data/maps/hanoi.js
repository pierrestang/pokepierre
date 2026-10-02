import { parseGrid } from './parseGrid.js';
import { toAirport, airportSign } from './airportLinks.js';
import { FLAGS, ITEMS } from '../story.js';

// Hors de la carte : les rues et trottoirs se prolongent, végétation ailleurs.
function outside(x, y, grid) {
  if (y >= 0 && y < grid.length) {
    const edge = grid[y][x < 0 ? 0 : grid[0].length - 1];
    if (['ɐ', 'ɔ'].includes(edge)) return edge;
  }
  return '.';
}

const NOT_HOME = ['[Texte provisoire] Personne ne répond...'];

// Hanoï — capitale du Vietnam, 32 x 26 cases (comme Bordeaux et Hull).
// Légende : voir src/data/tiles.js (x = bambous, n = lanterne, v = drapeau, k = lotus,
// r = pont rouge, t = stand de rue, y = scooter, ~ = lac Hoàn Kiếm)
export const hanoiMap = {
  id: 'hanoi',
  name: 'Hanoï',
  grid: parseGrid([
    'ƀƀƀƀƀƀƀƀƀƀƀƀƀƀƀƀƀƀƀƀƀƀƀƀƀƀƀƀƀƀƀƀ', // 0  buissons : bord de l'écran
    'ɔɔRRRRRRRRRɔɔRRRRRɔɔRRRRRR.ƫƫ..ɔ', // 1  maisons-tubes, agence de voyage
    'ɔɔRRRRRRRRRYɔRRRRRYɔRRRRRR.ƫƫ.Yɔ', // 2
    'ɔɔWWWWWWWWWɔɔWWWWWɔɔWWWWWWf...fɔ', // 3
    'ɔɔWDWWDWWDWɔɔWDWWWɔɔWDWWDW..f..ɔ', // 4  portes (ta maison : 2e à gauche)
    'ɔnɔɔɔɔɔɔɔɔɔnɔɔɔɔɔtɔnɔɔɔɔɔɔnɔɔɔɔɔ', // 5  lanternes, stand, scooters
    'ɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐ', // 6  rue (vers l'aéroport)
    'ɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐ', // 7
    'ɔ<ɔɔnɔɔɔɔɔɔɔnɔɔɔɔɔɔɔnɔɔɔɔɔɔɔnɔ>ɔ', // 8  panneaux aéroport
    '.Y.............Y....RRRRR....ƚ.ɔ', // 9  lac Hoàn Kiếm, pagode
    '..~~~~~r~~~~k~~.ƚ.Y.RRRRR.....ƚɔ', // 10
    '..~~k~~r~~RR~~~.....RRRRR..v...ɔ', // 11 tour de la Tortue, drapeau
    '..~~~~~r~~RR~~~..ƚ..WWWWW......ɔ', // 12
    '..~k~k~r~~~~~~~.....WWDWW....ƚ.ɔ', // 13 porte de la pagode
    '..~~~~~r~~k~~k~.ƚ..n.....n.....ɔ', // 14
    '.Y.............Y............Y..ɔ', // 15
    'ɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔ', // 16
    'ɔɔRRRRRRRRRɔtɔtɔtɔtɔRRRRRRRRRɔɔɔ', // 17 maisons-tubes, marché
    'ɔɔRRRRRRRRRnɔɔɔɔɔɔɔnRRRRRRRRRɔɔɔ', // 18
    'ɔɔWWWWWWWWWɔɔtɔtɔtɔɔWWWWWWWWWɔɔɔ', // 19
    'ɔɔWDWWDWWDWɔɔɔɔɔɔɔɔɔWDWWDWWDWɔɔɔ', // 20
    'ɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔyɔɔ', // 21
    'ɔɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɔ', // 22 rue sud
    'ɔɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɔ', // 23
    'ɔɔɔɔɔɔɔɔɔɔyɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔ', // 24
    'ƀƀƀƀƀƀƀƀƀƀƀƀƀƀƀƀƀƀƀƀƀƀƀƀƀƀƀƀƀƀƀƀ', // 25 buissons : bord de l'écran
  ]),
  doors: [
    { x: 3,  y: 4,  lockedDialogue: NOT_HOME },
    { x: 6,  y: 4,  interior: 'hanoiHome' },          // ta maison
    { x: 9,  y: 4,  lockedDialogue: NOT_HOME },
    { x: 14, y: 4,  interior: 'travelAgency' },       // agence de voyage
    { x: 21, y: 4,  lockedDialogue: NOT_HOME },
    { x: 24, y: 4,  lockedDialogue: NOT_HOME },
    // La pagode (le temple) : on y entre en guidant les touristes.
    {
      x: 22, y: 13, interior: 'temple',
      lock: { ifFlags: [FLAGS.touristesSuivent] },
      lockedDialogue: ['[Texte provisoire] La pagode est un lieu de recueillement.'],
    },
    { x: 3,  y: 20, lockedDialogue: NOT_HOME },
    { x: 6,  y: 20, lockedDialogue: NOT_HOME },
    { x: 9,  y: 20, lockedDialogue: NOT_HOME },
    { x: 21, y: 20, lockedDialogue: NOT_HOME },
    { x: 24, y: 20, lockedDialogue: NOT_HOME },
    { x: 27, y: 20, lockedDialogue: NOT_HOME },
  ],
  buildings: [
    { type: 'tubeHouse', x: 2,  y: 1, variant: 0 },
    { type: 'tubeHouse', x: 5,  y: 1, variant: 1 },
    { type: 'tubeHouse', x: 8,  y: 1, variant: 2 },
    { type: 'travelAgency', x: 13, y: 1 },
    { type: 'tubeHouse', x: 20, y: 1, variant: 3 },
    { type: 'tubeHouse', x: 23, y: 1, variant: 4 },
    { type: 'turtleTower', x: 10, y: 11 },
    { type: 'pagoda', x: 20, y: 9 },
    { type: 'tubeHouse', x: 2,  y: 17, variant: 2 },
    { type: 'tubeHouse', x: 5,  y: 17, variant: 4 },
    { type: 'tubeHouse', x: 8,  y: 17, variant: 0 },
    { type: 'tubeHouse', x: 20, y: 17, variant: 1 },
    { type: 'tubeHouse', x: 23, y: 17, variant: 3 },
    { type: 'tubeHouse', x: 26, y: 17, variant: 2 },
  ],
  npcs: [
    // Devant l'agence, après ton premier jour : deux touristes à guider jusqu'au temple.
    {
      id: 'touriste-1', name: 'Anna', x: 15, y: 5, facing: 'left', color: 0xe0a0d0,
      ifFlags: [FLAGS.travailEtape1],
      unlessFlags: [FLAGS.touristesSuivent],
      dialogue: [
        "[Anna - texte provisoire] Bonjour ! Tu travailles à l'agence ?",
        'Tu pourrais nous emmener visiter le temple ?',
        "D'accord ! Tu acceptes de les guider jusqu'à la pagode.",
      ],
      setFlag: FLAGS.touristesSuivent,
    },
    {
      id: 'touriste-2', name: 'Tom', x: 16, y: 5, facing: 'left', color: 0x80c0e0,
      ifFlags: [FLAGS.travailEtape1],
      unlessFlags: [FLAGS.touristesSuivent],
      dialogue: ["[Tom - texte provisoire] On aimerait tellement voir le temple !"],
    },
    // Après la visite, ils restent devant la pagode.
    {
      id: 'touriste-1-merci', name: 'Anna', x: 21, y: 14, facing: 'right', color: 0xe0a0d0,
      ifFlags: [FLAGS.visiteTerminee],
      dialogue: ['[Anna - texte provisoire] Merci encore pour la visite !'],
    },
    {
      id: 'touriste-2-merci', name: 'Tom', x: 23, y: 14, facing: 'left', color: 0x80c0e0,
      ifFlags: [FLAGS.visiteTerminee],
      dialogue: ['[Tom - texte provisoire] Super visite, merci !'],
    },
  ],
  events: [
    // En sortant de l'agence après le premier jour : Anna t'interpelle.
    {
      on: 'enter',
      ifFlags: [FLAGS.travailEtape1],
      unlessFlags: [FLAGS.touristesSuivent],
      steps: [{ talk: 'touriste-1' }],
    },
    // En sortant du temple avec l'objet de chance : les touristes te remercient.
    {
      on: 'enter',
      ifFlags: [FLAGS.touristesSuivent],
      ifItems: [ITEMS.objetChance.id],
      unlessFlags: [FLAGS.visiteTerminee],
      steps: [
        { speaker: 'Anna', say: ['[Anna - texte provisoire] Quel temple magnifique ! Merci pour la visite.'] },
        { speaker: 'Tom', say: ['[Tom - texte provisoire] Oui, merci beaucoup !'] },
        { setFlag: FLAGS.visiteTerminee },
      ],
    },
  ],
  // Les deux bouts de la rue mènent à l'aéroport.
  // Panneaux « Aéroport » à côté des sorties.
  objects: [airportSign(1, 8, false), airportSign(30, 8, true)],
  triggers: [toAirport(0, 6), toAirport(0, 7), toAirport(31, 6), toAirport(31, 7)],
  surroundings: { outside, border: 'ƀ', borderSkip: ['ɐ'] },
  spawn: { x: 1, y: 6, facing: 'right' },
};
