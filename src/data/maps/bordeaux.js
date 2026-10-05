import { parseGrid } from './parseGrid.js';
// Le dessin de la carte : la version Gen 4 faite avec le créateur de cartes (scripts/convert_maps_v2.py, thème Gen 4,
// scripts/g4_theme.py) ; ses collisions s'imposent à la grille du jeu (voir builtGrid). La grille et les bâtiments
// d'origine restent la source de la conversion (sourceGrid, sourceBuildings).
import BUILT from '../builtMaps/bordeaux.json' with { type: 'json' };
import { builtGrid } from './builtGrid.js';
import { toAirport, airportSign } from './airportLinks.js';
import { FLAGS, ITEMS } from '../story.js';
import {
  ARRIVAL, FRONT_DOOR, MONTHS_LATER, OUSMANE_AT_DOOR, OUSMANE_REMINDS, REMI_AT_KEDGE,
} from '../bordeauxStory.js';

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

// Bordeaux — grande ville traversée par la Garonne, 32 x 26 cases. Scénario : voir data/bordeauxStory.js.
// Légende : voir src/data/tiles.js (A = rue, C = trottoir/quai, G = rivière, I = pont)
export const bordeauxMap = {
  id: 'bordeaux',
  name: 'Bordeaux',
  built: BUILT,
  sourceGrid: parseGrid([
    'ƀƀƀƀƀƀƀƀƀƀƀƀƀƀƀƀƀƀƀƀƀƀƀƀƀƀƀƀƀƀƀƀ', // 0  arbres : bord de l'écran
    'ɔɔɔRRRRRɔɔRRRRRRRRRRRRRRRRRRRRɔɔ', // 1  ton immeuble, l'agence, le studio de Paulfit, le stade
    'ɔɔɔRRRRRɔɔRRRRRRRRRRRRRRRRRRRRɔɔ', // 2
    'ɔɔɔWWWWWɔɔWWWWWWWWWWWWWWWWWWWWɔɔ', // 3
    'ɔɔɔWDWWWɔɔWDWWWWDWWWWWWWDWWWWWɔɔ', // 4  portes (stade : grande entrée)
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
    'ɔɔRRRRRɔɔɔɔRRRRRRRRRɔRRRRRɔɔɔɔɔɔ', // 17 immeuble, KEDGE, l'appartement de Rémi
    'ɔɔRRRRRɔɔɔɔRRRRRRRRRɔRRRRRɔɔɔɔɔɔ', // 18
    'ɔɔWWWWWɔɔɔɔWWWWWWWWWɔWWWWWɔɔɔɔɔɔ', // 19
    'ɔɔWDWWWɔɔɔɔWWWWDWWWWɔWWDWWɔɔɔɔɔɔ', // 20 portes
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
      lockedDialogue: ["C'est ton futur immeuble, mais tu n'as pas les clés. Va à l'agence."],
    },
    { x: 11, y: 4, interior: 'agence' },
    { x: 16, y: 4, interior: 'studioPaulfit' },                   // le studio de Paulfit
    // Le stade : la remise des diplômes, une fois le semestre de New Delhi terminé.
    {
      x: 24, y: 4, interior: 'stade',
      lock: { ifFlags: [FLAGS.semestreTermine] },
      lockedDialogue: ["Le stade est fermé : la remise des diplômes n'a pas encore lieu."],
    },
    { x: 3, y: 20, lockedDialogue: ['Ce n\'est pas chez toi.'] },
    // KEDGE : l'oral d'anglais, quelques mois après la soirée.
    {
      x: 15, y: 20, interior: 'kedge',
      lock: { ifFlags: [FLAGS.soireeFinie] },
      lockedDialogue: ["L'oral d'anglais, c'est pas aujourd'hui."],
    },
    { x: 23, y: 20, interior: 'appartRemi' },                     // l'appartement de Rémi, près du campus
  ],
  // Les bâtiments sont dans le dessin ; la liste d'origine sert à la conversion.
  buildings: [],
  sourceBuildings: [
    { type: 'slateHouse', x: 3, y: 1 },
    { type: 'agence',   x: 10, y: 1 },
    { type: 'frontierHouse', x: 15, y: 1 },
    { type: 'stadium',  x: 18, y: 1 },
    { type: 'house', x: 2, y: 17 },
    { type: 'kedge',    x: 11, y: 17 },
    { type: 'purpleHouse', x: 21, y: 17 },
  ],
  npcs: [
    // Ousmane, le coloc : devant l'immeuble à l'arrivée, puis pendant les préparatifs de la soirée.
    {
      id: 'ousmane-porte', name: 'Ousmane', x: 5, y: 5, facing: 'left',
      ifFlags: [FLAGS.bordeauxOuverture], unlessFlags: [FLAGS.ousmaneRencontre], script: OUSMANE_AT_DOOR,
    },
    {
      id: 'ousmane-rappel', name: 'Ousmane', x: 5, y: 5, facing: 'left',
      ifFlags: [FLAGS.preparatifs], unlessFlags: [FLAGS.soiree], script: OUSMANE_REMINDS,
    },
    // Rémi, devant KEDGE le jour de l'oral.
    {
      id: 'remi-kedge', name: 'Rémi', x: 16, y: 21, facing: 'left',
      ifFlags: [FLAGS.soireeFinie], unlessItems: [ITEMS.diplomeAnglais.id], dialogue: ['T\'inquiète, c\'est easy.'],
    },
  ],
  events: [
    { on: 'enter', ifFlags: [FLAGS.arriveeBordeaux], unlessFlags: [FLAGS.bordeauxOuverture], steps: ARRIVAL },
    // En sortant de la soirée.
    { on: 'enter', ifFlags: [FLAGS.soiree], unlessFlags: [FLAGS.soireeFinie], steps: MONTHS_LATER },
  ],
  // Panneaux « Aéroport » à côté des sorties ; les noms sur les portes.
  objects: [
    airportSign(30, 8, true),
    ...[15, 17].map((x) => ({ x, y: 4, dialogue: ['Sur la porte : « PAULFIT ».'] })),
    ...[22, 24].map((x) => ({ x, y: 20, dialogue: ['Sur la porte : « RÉMI ».'] })),
  ],
  triggers: [
    // Devant la porte de l'immeuble : Ousmane (voir bordeauxStory.js FRONT_DOOR).
    { x: 4, y: 5, script: FRONT_DOOR },
    // Devant KEDGE, le jour de l'oral : Rémi.
    { x: 15, y: 21, ifFlags: [FLAGS.soireeFinie], unlessFlags: [FLAGS.remiKedge], script: REMI_AT_KEDGE },
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
      dialogue: ['La route est bloquée.'],
      readyDialogue: ['Ton diplôme de Bordeaux en poche, tu prends la route de Paris !'],
      setFlags: [FLAGS.arriveeParis],
      warp: { map: 'paris', x: 1, y: 6, facing: 'right' },
    })),
    // Est : l'aéroport, débloqué par le diplôme d'anglais.
    ...[6, 7].map((y) => ({
      ...toAirport(31, y),
      ifItems: [ITEMS.diplomeAnglais.id],
      dialogue: ["L'aéroport ! Il te faut ton diplôme d'anglais pour partir : l'oral, c'est à KEDGE."],
    })),
  ],
  // Voiture en panne qui bloque la rue sud (vers Paris) jusqu'à la remise du diplôme de Bordeaux.
  props: [
    {
      type: 'brokenCar', x: 29, y: 22, w: 2, h: 2,
      unlessFlags: [FLAGS.diplomeBordeaux],
      dialogue: ['Une voiture en panne bloque la route. Impossible de passer pour l\'instant.'],
    },
  ],
  // Arbres seulement tout au bord de l'écran, sauf là où passent la rivière et les rues.
  surroundings: { outside, border: 'ƀ', borderSkip: ['G', 'ɐ'] },
  spawn: { x: 1, y: 6, facing: 'right' },
};

// La grille du jeu : celle d'origine, accordée aux collisions du dessin.
bordeauxMap.grid = builtGrid(bordeauxMap.sourceGrid, BUILT);
