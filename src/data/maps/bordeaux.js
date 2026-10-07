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

// Bordeaux — grande ville traversée par la Garonne, 32 x 36 cases (redessinée dans le créateur, octobre 2026 ; la grille
// du jeu est tirée du dessin). Scénario : voir data/bordeauxStory.js.
// Légende : voir src/data/tiles.js (A = rue, C = trottoir/quai, G = rivière, I = pont)
export const bordeauxMap = {
  id: 'bordeaux',
  name: 'Bordeaux',
  built: BUILT,
  sourceGrid: parseGrid([
    'ƀƀƀƀƀƀƀƀƀƀƀƀƀƀƀƀƀƀƀƀƀƀƀƀƀƀƀƀƀƀƀƀ', // 0  arbres : bord de l'écran
    'ƀƀƀƀƀƀƀƀƀƀƀƀƀƀƀƀƀƀƀƀƀƀƀƀƀƀƀƀƀƀƀƀ', // 1
    'ƀƀ.............ɔɔɔɔɔɔɔɔɔɔɔɔ...ƀƀ', // 2
    'ƀƀ..WWWW.WWWWWɔɔɔɔɔɔɔɔɔɔɔɔɔɔ..ƀƀ', // 3
    'ƀƀ..WWWWWWWWWWɔɔɔɔɔɔɔɔɔɔɔɔɔɔ..ƀƀ', // 4
    'ƀƀ.ɔWWWWWWWWWWɔɔWWWWWWWWWWWɔ.ƀƀƀ', // 5
    '...ɔWDWWWWWDWWɔɔWWWWWWWWWWWɔɔ...', // 6  portes : ton immeuble (5), l'agence (11) ; ouest : Prytanée
    'ɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔWWWWWWWWWWWɔɔɔɔɔ', // 7
    'ɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔWWWWWWWWWWɔɔɔɔɔɔ', // 8
    'ɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔWWWWWWWWɔɔɔɔɔƀƀ', // 9
    'ƀƀ.ɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔWWDWWɔɔɔɔɔ.ƀƀ', // 10  porte du stade
    'ƀƀ....ɔɔɔɔ....ɔɔɔɔɔɔɔɔɔɔɔɔɔɔ..ƀƀ', // 11
    'ƀƀ.....ɔɔ...WW..ɔɔɔɔɔɔɔɔɔɔ....ƀƀ', // 12
    'ƀƀ.....ɔɔ..............ɔɔ...GGGG', // 13
    '.......ɔɔ.WWW.WWW.WWW..ɔɔ.WWGGGG', // 14
    'GGGGGGGIIGGGGGGGGGGGGGGɔɔGGGGGGG', // 15  la Garonne et ses deux ponts (x 7-8, 23-24)
    'GGGGGGGIIGGGGGGGGGGGGGGIIGGGGGGG', // 16
    'GGGGGGGIIGGGGGGGGGGGGGGIIGGGGGGG', // 17
    'ƀƀƀGGGGIIGGGGGGGGGGGGGGIIGGGGGGG', // 18
    'GGGGGGGIIGGGGGGGGGGGGGGIIGGGGGGG', // 19
    'ƀƀIIIIIɔɔGGGGGGGGGGGGGGIIGGGGGGG', // 20
    'ƀƀ.....ɔɔ......WW.WWW..ɔɔ.WGGGGG', // 21
    'ƀƀ.....ɔɔ..............ɔɔ.WGGGGG', // 22
    'ƀƀ..ɔɔɔɔɔɔɔɔɔɔ........ɔɔɔɔ......', // 23
    'ƀƀ.ɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔ..ƀƀ', // 24
    'ƀƀ.ɔWWWWWWWWWɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔ.ƀƀƀ', // 25
    'ƀƀ.ɔWWWWWWWWWɔɔɔWWWWɔɔWWWWɔɔɔɔɔɔ', // 26
    'ƀƀ.ɔWWWWWWWWWɔɔɔWWWWɔɔWWWWWɔɔɔɔɔ', // 27
    'ƀƀ.ɔWWWWWWWWWɔɔɔWWWWɔɔWWWWWɔɔɔɔɔ', // 28
    'ƀƀ.ɔɔɔɔɔDWɔɔɔɔɔɔWDWWɔɔWDWWWɔ....', // 29  portes : KEDGE (8), le studio de Paulfit (17), Rémi (23) ; est : route de Paris
    'ƀƀ.ɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔ..ƀƀ', // 30
    'ƀƀ.ɔɔɔɔɔɔɔɔɔɔɔɔ...ɔɔɔɔɔɔɔɔ....ƀƀ', // 31
    'ƀƀ..ɔɔɔɔɔɔɔɔɔɔ................ƀƀ', // 32
    'ƀƀ............................ƀƀ', // 33
    'ƀƀƀƀƀƀƀƀƀƀƀƀƀƀƀƀƀƀƀƀƀƀƀƀƀƀƀƀƀƀƀƀ', // 34  arbres : bord de l'écran
    'ƀƀƀƀƀƀƀƀƀƀƀƀƀƀƀƀƀƀƀƀƀƀƀƀƀƀƀƀƀƀƀƀ', // 35
  ]),
  doors: [
    // Ton immeuble (en haut à gauche) : il faut les clés de l'agence.
    {
      x: 5, y: 6, interior: 'appartement',
      lock: { ifItems: [ITEMS.clesAppartement.id] },
      lockedDialogue: ["C'est ton futur immeuble, mais tu n'as pas les clés. Va à l'agence."],
    },
    { x: 11, y: 6, interior: 'agence' },                          // la boutique à auvent
    // Le stade (la rotonde) : la remise des diplômes, une fois le semestre de New Delhi terminé.
    {
      x: 21, y: 10, interior: 'stade',
      lock: { ifFlags: [FLAGS.semestreTermine] },
      lockedDialogue: ["Le stade est fermé : la remise des diplômes n'a pas encore lieu."],
    },
    // KEDGE (le grand bâtiment de pierre, en bas à gauche) : l'oral d'anglais, quelques mois après la soirée.
    {
      x: 8, y: 29, interior: 'kedge',
      lock: { ifFlags: [FLAGS.soireeFinie] },
      lockedDialogue: ["L'oral d'anglais, c'est pas aujourd'hui."],
    },
    { x: 17, y: 29, interior: 'studioPaulfit' },                  // le studio de Paulfit
    { x: 23, y: 29, interior: 'appartRemi' },                     // l'appartement de Rémi, près du campus
  ],
  // Les bâtiments sont dans le dessin ; la liste d'origine sert à la conversion.
  buildings: [],
  // Redessinée à la main (octobre 2026) : plus de bâtiments d'origine à convertir.
  sourceBuildings: [],
  npcs: [
    // Ousmane, le coloc : devant l'immeuble à l'arrivée, puis pendant les préparatifs de la soirée.
    {
      id: 'ousmane-porte', name: 'Ousmane', x: 6, y: 7, facing: 'left',
      ifFlags: [FLAGS.bordeauxOuverture], unlessFlags: [FLAGS.ousmaneRencontre], script: OUSMANE_AT_DOOR,
    },
    {
      id: 'ousmane-rappel', name: 'Ousmane', x: 6, y: 7, facing: 'left',
      ifFlags: [FLAGS.preparatifs], unlessFlags: [FLAGS.soiree], script: OUSMANE_REMINDS,
    },
    // Rémi, devant KEDGE le jour de l'oral.
    {
      id: 'remi-kedge', name: 'Rémi', x: 9, y: 30, facing: 'left',
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
    airportSign(29, 5, true),
    ...[16, 18].map((x) => ({ x, y: 29, dialogue: ['Sur la porte : « PAULFIT ».'] })),
    ...[22, 24].map((x) => ({ x, y: 29, dialogue: ['Sur la porte : « RÉMI ».'] })),
  ],
  triggers: [
    // Devant la porte de l'immeuble : Ousmane (voir bordeauxStory.js FRONT_DOOR).
    { x: 5, y: 7, script: FRONT_DOOR },
    // Devant KEDGE, le jour de l'oral : Rémi.
    { x: 8, y: 30, ifFlags: [FLAGS.soireeFinie], unlessFlags: [FLAGS.remiKedge], script: REMI_AT_KEDGE },
    // Ouest : retour au Prytanée (arrivée à sa porte nord).
    ...[6, 7, 8, 9].map((y) => ({
      x: 0,
      y,
      readyDialogue: ['Tu retournes au Prytanée.'],
      warp: { map: 'prytanee', x: 24, y: 1, facing: 'down' },
    })),
    // Sud-est : la route de Paris, libre une fois le diplôme de Bordeaux en poche.
    ...[26, 27, 28, 29].map((y) => ({
      x: 31,
      y,
      ifFlags: [FLAGS.diplomeBordeaux],
      dialogue: ['La route est bloquée.'],
      readyDialogue: ['Ton diplôme de Bordeaux en poche, tu prends la route de Paris !'],
      setFlags: [FLAGS.arriveeParis],
      warp: { map: 'paris', x: 1, y: 6, facing: 'right' },
    })),
    // Est : l'aéroport, débloqué par le diplôme d'anglais.
    ...[6, 7, 8].map((y) => ({
      ...toAirport(31, y),
      ifItems: [ITEMS.diplomeAnglais.id],
      dialogue: ["L'aéroport ! Il te faut ton diplôme d'anglais pour partir : l'oral, c'est à KEDGE."],
    })),
  ],
  // Voiture en panne qui bloque la rue sud (vers Paris) jusqu'à la remise du diplôme de Bordeaux.
  props: [
    {
      type: 'brokenCar', x: 29, y: 27, w: 2, h: 2,
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
