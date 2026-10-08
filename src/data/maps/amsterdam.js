import { parseGrid } from './parseGrid.js';
// Le dessin de la carte : Amsterdam en Gen 4 (première version par scripts/build_amsterdam.py, puis retouchée à la main
// dans le créateur : maisons remontées, place à la fontaine fleurie, jardinières du quai sud) ; ses collisions
// s'imposent à la grille du jeu (voir builtGrid). La grille ci-dessous (sourceGrid) suit ce dessin : rue, quais, canaux,
// ponts, portes (sur les portes dessinées).
import BUILT from '../builtMaps/amsterdam.json' with { type: 'json' };
import { builtGrid } from './builtGrid.js';
import { toAirport, airportSign } from './airportLinks.js';
import { FLAGS } from '../story.js';
import { ARRIVAL, CANAL_NIGHT, CANAL_SPOT, MONTHS_LATER } from '../amsterdamStory.js';

// Hors de la carte : la rue et les canaux se prolongent, la forêt ailleurs.
function outside(x, y, grid) {
  if (y >= 0 && y < grid.length) {
    const edge = grid[y][x < 0 ? 0 : grid[0].length - 1];
    if (edge === 'ɐ' || edge === '~') return edge;
  }
  return 'T';
}

const NOT_HOME = ['Tu frappes. Personne ne répond… « Niemand thuis », peut-être.'];

// Amsterdam — 36 x 30 cases avec sa bordure d'arbres d'automne. Au nord, le long de la grande rue : une maison de canal,
// le manoir à pignons (CORNING), la maison de canal à la porte en cœur (la maison commune, « la deuxième en haut à
// gauche »), la maison à pignon rouge. Le premier canal (une péniche, deux ponts de planches), puis, au sud : le coffee
// shop (porte et fleurs), une maison de canal aux fleurs, la place à la fontaine fleurie, une maison de canal et une
// maison à pignon ; le quai sud, ses jardinières, et le second canal. Scénario : data/amsterdamStory.js.
// Légende : voir src/data/tiles.js (ɔ = pavés, ɐ = rue, ~ = canal, I = pont, D = porte, T = arbres).
export const amsterdamMap = {
  id: 'amsterdam',
  name: 'Amsterdam',
  built: BUILT,
  sourceGrid: parseGrid([
    'TTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTT', // 0  bordure : arbres d'automne (dessinés)
    'TTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTT', // 1
    'TTɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔTT', // 2
    'TTɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔTT', // 3
    'TTɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔTT', // 4
    'TTɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔTT', // 5
    'TTɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔTT', // 6
    'TTɔɔɔɔɔɔɔɔɔɔɔDɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔTT', // 7  porte de Corning (le manoir, 13)
    'TTɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔDɔɔɔɔɔDɔɔɔɔɔTT', // 8  portes : maison commune (22), maison à pignon (28)
    'TTɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔTT', // 9
    'ɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐ', // 10  grande rue (vers l'aéroport, la bordure y est ouverte)
    'ɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐ', // 11
    'ɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔ', // 12  quai nord (panneaux de l'aéroport)
    '~~~~~~II~~~~~~~~~~~~~~~~~~~II~~~~~~~', // 13  premier canal, ponts de planches (x 6-7, 27-28)
    '~~~~~~II~~~~~~~~~~~~~~~~~~~II~~~~~~~', // 14
    '~~~~~~II~~~~~~~~~~~~~~~~~~~II~~~~~~~', // 15
    'TTɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔTT', // 16  quai
    'TTɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔTT', // 17
    'TTɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔTT', // 18
    'TTɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔTT', // 19
    'TTɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔTT', // 20
    'TTɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔTT', // 21
    'TTɔɔDɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔDɔɔɔɔɔɔDɔɔɔɔTT', // 22  portes : coffee shop (4), maison de canal (22), maison à pignon (29)
    'TTɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔTT', // 23  quai sud
    'TTɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔTT', // 24
    'TTɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔTT', // 25
    'ɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔ', // 26
    '~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~', // 27  second canal
    '~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~', // 28
    '~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~', // 29
  ]),
  doors: [
    // CORNING (le manoir à pignons) : le stage commence une fois la marchandise rendue à Romain.
    {
      x: 13, y: 7, interior: 'corning',
      lock: { ifFlags: [FLAGS.marchandiseDonnee] },
      lockedDialogue: ['Les bureaux de Corning. Ton stage commence bientôt : va d\'abord t\'installer chez Romain.'],
    },
    { x: 22, y: 8, interior: 'maisonCommune' },                 // la maison commune (la deuxième en haut à gauche)
    { x: 28, y: 8, lockedDialogue: NOT_HOME },                  // la maison à pignon rouge
    // Le coffee shop : une fois que Romain t'a demandé sa marchandise.
    {
      x: 4, y: 22, interior: 'coffeeShop',
      lock: { ifFlags: [FLAGS.romainDemande] },
      lockedDialogue: ['Un coffee shop. Rien à y faire pour l\'instant.'],
    },
    { x: 22, y: 22, lockedDialogue: NOT_HOME },                 // la maison de canal du sud
    { x: 29, y: 22, lockedDialogue: NOT_HOME },                 // la maison à pignon du sud
  ],
  // Les bâtiments sont dans le dessin.
  buildings: [],
  npcs: [
    // Quelques mois plus tard, la nuit : Romain, assis au bord du quai, devant la péniche.
    {
      id: 'romain-canal', name: 'Romain', x: CANAL_SPOT[0], y: CANAL_SPOT[1], facing: 'down', still: true, color: 0xc0602c,
      ifFlags: [FLAGS.moisAmsterdam], unlessFlags: [FLAGS.canalNuit],
      script: CANAL_NIGHT,
    },
  ],
  events: [
    // L'arrivée : Romain appelle.
    { on: 'enter', ifFlags: [FLAGS.arriveeAmsterdam], unlessFlags: [FLAGS.appelAmsterdam], steps: ARRIVAL },
    // En sortant de Corning, la campagne présentée : quelques mois plus tard (la nuit tombe).
    { on: 'enter', ifFlags: [FLAGS.stageCorning], unlessFlags: [FLAGS.moisAmsterdam], steps: MONTHS_LATER },
  ],
  // La nuit au bord du canal (forcée, quelle que soit l'heure) : réverbères allumés, appliques des portes, fenêtres de la
  // péniche.
  night: {
    ifFlags: [FLAGS.moisAmsterdam], unlessFlags: [FLAGS.canalNuit], doorLamps: true,
    lights: [[15, 14, 0xffc060], [17, 14, 0xffc060], [19, 14, 0xffd890]],
  },
  // Panneaux « Aéroport » (dessinés) à côté des sorties ; les deux bouts de la grande rue mènent à l'aéroport.
  objects: [airportSign(2, 12, false), airportSign(33, 12, true)],
  triggers: [toAirport(0, 10), toAirport(0, 11), toAirport(35, 10), toAirport(35, 11)],
  surroundings: { outside },
  spawn: { x: 1, y: 10, facing: 'right' },
};

// La grille du jeu : celle ci-dessus, accordée aux collisions du dessin.
amsterdamMap.grid = builtGrid(amsterdamMap.sourceGrid, BUILT);
