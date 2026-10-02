import { parseGrid } from './parseGrid.js';
import { toAirport, airportSign } from './airportLinks.js';
import { FLAGS, ITEMS } from '../story.js';

// Hors de la carte (bandes qui complètent l'écran) : la Garonne, les rues et les trottoirs
// de chaque rangée se prolongent ; ailleurs, herbe près de l'eau, sol de ville sinon.
function outside(x, y, grid) {
  const W = grid[0].length;
  const H = grid.length;
  if (y >= 0 && y < H) {
    const edge = grid[y][x < 0 ? 0 : W - 1];
    if (['G', 'ɐ', 'ɔ'].includes(edge)) return edge;
  }
  const riverRows = grid.map((row, i) => (row[0] === 'G' ? i : null)).filter((i) => i !== null);
  const distance = Math.min(...riverRows.map((r) => Math.abs(r - y)));
  return distance <= 4 ? '.' : 'ɔ';
}

// Bordeaux — grande ville traversée par la Garonne, 32 x 26 cases.
// Légende : voir src/data/tiles.js (A = rue, C = trottoir/quai, G = rivière, I = pont)
export const bordeauxMap = {
  id: 'bordeaux',
  name: 'Bordeaux',
  grid: parseGrid([
    'ƀƀƀƀƀƀƀƀƀƀƀƀƀƀƀƀƀƀƀƀƀƀƀƀƀƀƀƀƀƀƀƀ', // 0  arbres : bord de l'écran
    'ɔɔɔRRRRRɔɔRRRRRɔɔɔRRRRRRRRRRRRɔɔ', // 1  ton immeuble, l'agence, le stade
    'ɔɔɔRRRRRɔɔRRRRRɔɔɔRRRRRRRRRRRRɔɔ', // 2
    'ɔɔɔWWWWWɔɔWWWWWɔɔɔWWWWWWWWWWWWɔɔ', // 3
    'ɔɔɔWDWWWɔɔWDWWWɔɔɔWWWWWWDWWWWWɔɔ', // 4  portes (stade : grande entrée)
    'ɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔ', // 5  trottoir
    'ɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐ', // 6  avenue (ouest : Prytanée, est : aéroport)
    'ɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐ', // 7
    'ɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔ>ɔ', // 8  panneaux aéroport
    '..ƀ...ƀɔɔ.ƀ...ƀ...ƀ...ƀɔɔ.ƀ...ƀ.', // 9  quai arboré (herbe près de l'eau)
    '.......ɔɔ..............ɔɔ.......', // 10
    'ɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔ', // 11 quai
    'GGGGGGGIIGGGGGGGGGGGGGGIIGGGGGGG', // 12 la Garonne et ses deux ponts
    'GGGGGGGIIGGGGGGGGGGGGGGIIGGGGGGG', // 13
    'GGGGGGGIIGGGGGGGGGGGGGGIIGGGGGGG', // 14
    'ɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔ', // 15 quai sud
    '....ƀ..ɔɔ...ƀ...ƀ...ƀ..ɔɔ...ƀ...', // 16
    'ɔɔRRRRRɔɔɔɔRRRRRRRRRɔɔɔɔɔɔɔɔɔɔɔɔ', // 17 immeuble, KEDGE
    'ɔɔRRRRRɔɔɔɔRRRRRRRRRɔɔɔɔɔɔɔɔɔɔɔɔ', // 18
    'ɔɔWWWWWɔɔɔɔWWWWWWWWWɔɔɔɔɔɔɔɔɔɔɔɔ', // 19
    'ɔɔWDWWWɔɔɔɔWWWWDWWWWɔɔɔɔɔɔɔɔɔɔɔɔ', // 20 portes
    'ɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔƀ', // 21
    'ɔɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐ', // 22 rue sud (vers Paris, bloquée par une voiture en panne)
    'ɔɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐ', // 23
    'ɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔƀ', // 24
    'ƀƀƀƀƀƀƀƀƀƀƀƀƀƀƀƀƀƀƀƀƀƀƀƀƀƀƀƀƀƀƀƀ', // 25 arbres : bord de l'écran
  ]),
  doors: [
    // Ton immeuble : il faut les clés de l'agence.
    {
      x: 4, y: 4, interior: 'appartement',
      lock: { ifItems: [ITEMS.clesAppartement.id] },
      lockedDialogue: ["[Texte provisoire] C'est ton futur immeuble, mais tu n'as pas encore les clés. Va à l'agence."],
    },
    { x: 11, y: 4, interior: 'agence' },
    // Le stade : la remise des diplômes, une fois le semestre de New Delhi terminé.
    {
      x: 24, y: 4, interior: 'stade',
      lock: { ifFlags: [FLAGS.semestreTermine] },
      lockedDialogue: ["[Texte provisoire] Le stade est fermé : la remise des diplômes n'a pas encore lieu."],
    },
    { x: 3, y: 20, lockedDialogue: ['[Texte provisoire] Ce n\'est pas chez toi.'] },
    // KEDGE : une fois installé dans l'appartement.
    {
      x: 15, y: 20, interior: 'kedge',
      lock: { ifFlags: [FLAGS.appartementVisite] },
      lockedDialogue: ["[Texte provisoire] Va d'abord poser tes affaires dans ton appartement."],
    },
  ],
  buildings: [
    { type: 'slateHouse', x: 3, y: 1 },
    { type: 'agence',   x: 10, y: 1 },
    { type: 'stadium',  x: 18, y: 1 },
    { type: 'house', x: 2, y: 17 },
    { type: 'kedge',    x: 11, y: 17 },
  ],
  // Panneaux « Aéroport » à côté des sorties.
  objects: [airportSign(30, 8, true)],
  triggers: [
    // Ouest : retour au Prytanée (arrivée à sa porte nord).
    ...[6, 7].map((y) => ({
      x: 0,
      y,
      readyDialogue: ['Tu retournes au Prytanée.'],
      warp: { map: 'prytanee', x: 24, y: 1, facing: 'down' },
    })),
    // Sud-est : la route de Paris, libre une fois le diplôme de Bordeaux en poche.
    ...[22, 23].map((y) => ({
      x: 31,
      y,
      ifFlags: [FLAGS.diplomeBordeaux],
      dialogue: ['[Texte provisoire] La route est bloquée.'],
      readyDialogue: ['Ton diplôme de Bordeaux en poche, tu prends la route de Paris !'],
      setFlags: [FLAGS.arriveeParis],
      warp: { map: 'paris', x: 1, y: 6, facing: 'right' },
    })),
    // Est : l'aéroport, débloqué par le diplôme d'anglais.
    ...[6, 7].map((y) => ({
      ...toAirport(31, y),
      ifItems: [ITEMS.diplomeAnglais.id],
      dialogue: ["[Texte provisoire] L'aéroport ! Il te faut ton diplôme d'anglais pour y aller."],
    })),
  ],
  // Voiture en panne qui bloque la rue sud (vers Paris) jusqu'à la remise du diplôme de Bordeaux.
  props: [
    {
      type: 'brokenCar', x: 29, y: 22, w: 2, h: 2,
      unlessFlags: [FLAGS.diplomeBordeaux],
      dialogue: ['[Texte provisoire] Une voiture en panne bloque la route. Impossible de passer pour l\'instant.'],
    },
  ],
  // Arbres seulement tout au bord de l'écran, sauf là où passent la rivière et les rues.
  surroundings: { outside, border: 'ƚ', borderSkip: ['G', 'ɐ'] },
  spawn: { x: 1, y: 6, facing: 'right' },
};
