import { parseGrid } from './parseGrid.js';
// Le dessin de la carte : Amsterdam en Gen 4 (scripts/build_amsterdam.py, d'après la carte retouchée à la main dans le
// créateur : maisons de canal au toit rose, manoir à pignons, fontaine, canaux, arbres d'automne dorés) ; ses collisions
// s'imposent à la grille du jeu (voir builtGrid). La grille ci-dessous (sourceGrid) suit ce dessin : rue, quais, canaux,
// ponts, portes.
import BUILT from '../builtMaps/amsterdam.json' with { type: 'json' };
import { builtGrid } from './builtGrid.js';
import { toAirport, airportSign } from './airportLinks.js';
import { FLAGS } from '../story.js';

// Hors de la carte : la rue et les canaux se prolongent, la forêt ailleurs.
function outside(x, y, grid) {
  if (y >= 0 && y < grid.length) {
    const edge = grid[y][x < 0 ? 0 : grid[0].length - 1];
    if (edge === 'ɐ' || edge === '~') return edge;
  }
  return 'T';
}

const NOT_HOME = ['[Texte provisoire] Personne ne répond...'];

// Amsterdam — 36 x 30 cases avec sa bordure d'arbres d'automne. Au nord, le long de la grande rue : une maison de canal,
// le manoir à pignons (CORNING), la maison de canal à la porte en cœur (votre maison commune), la maison à pignon rouge.
// Le premier canal (une péniche, deux ponts de planches), puis les maisons de canal du sud (le coffee shop, à gauche :
// porte et fleurs) et la place à la fontaine ; le quai sud et le second canal. Légende : voir src/data/tiles.js
// (ɔ = pavés, ɐ = rue, ~ = canal, I = pont, D = porte, T = arbres).
export const amsterdamMap = {
  id: 'amsterdam',
  name: 'Amsterdam',
  built: BUILT,
  sourceGrid: parseGrid([
    'TTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTT', // 0  bordure : forêt d'automne (dessinée)
    'TTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTT', // 1
    'TTɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔTT', // 2  maisons du nord
    'TTɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔTT', // 3
    'TTɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔTT', // 4
    'TTɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔTT', // 5
    'TTɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔTT', // 6
    'TTɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔTT', // 7
    'TTɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔTT', // 8
    'TTɔɔɔɔɔɔɔɔɔɔɔDɔɔɔɔɔɔDɔɔɔɔɔɔDɔɔɔɔɔɔTT', // 9  portes : Corning (13), maison commune (20), maison à pignon (27)
    'ɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐ', // 10  grande rue (vers l'aéroport, la bordure y est ouverte)
    'ɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐ', // 11
    'TTɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔTT', // 12  quai nord
    '~~~~~~II~~~~~~~~~~~~~~~~~~~II~~~~~~~', // 13  premier canal, ponts de planches (x 6-7, 27-28)
    '~~~~~~II~~~~~~~~~~~~~~~~~~~II~~~~~~~', // 14
    '~~~~~~II~~~~~~~~~~~~~~~~~~~II~~~~~~~', // 15
    'TTɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔTT', // 16  quai
    'TTɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔTT', // 17  maisons du sud, place à la fontaine
    'TTɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔTT', // 18
    'TTɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔTT', // 19
    'TTɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔTT', // 20
    'TTɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔTT', // 21
    'TTɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔTT', // 22
    'TTɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔTT', // 23
    'TTɔɔDɔɔɔɔɔɔɔɔɔDɔɔɔɔɔɔɔɔɔDɔɔɔɔɔɔɔɔɔTT', // 24  portes : coffee shop (4), petite maison (14), maison de canal (24)
    'TTɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔTT', // 25  quai sud
    '~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~', // 26  second canal
    '~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~', // 27
    'TTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTT', // 28  bordure
    'TTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTT', // 29
  ]),
  doors: [
    { x: 13, y: 9, interior: 'corning' },                       // le manoir à pignons : CORNING
    // La maison commune (avec Romain) : ouverte quand Romain t'a donné rendez-vous.
    {
      x: 20, y: 9, interior: 'maisonCommune',
      lock: { ifFlags: [FLAGS.romainDemande] },
      lockedDialogue: ["[Texte provisoire] C'est votre maison commune, mais il n'y a personne pour l'instant."],
    },
    { x: 27, y: 9, lockedDialogue: NOT_HOME },                  // la maison à pignon rouge
    // Le coffee shop : une fois que Romain t'a demandé la marchandise.
    {
      x: 4, y: 24, interior: 'coffeeShop',
      lock: { ifFlags: [FLAGS.romainDemande] },
      lockedDialogue: ["[Texte provisoire] Rien à faire ici pour l'instant."],
    },
    { x: 14, y: 24, lockedDialogue: NOT_HOME },                 // la petite maison de canal
    { x: 24, y: 24, lockedDialogue: NOT_HOME },                 // la maison de canal du sud
  ],
  // Les bâtiments sont dans le dessin (scripts/build_amsterdam.py).
  buildings: [],
  npcs: [
    // Romain t'attend à la sortie de CORNING, après ton premier rendez-vous avec Laurent.
    {
      id: 'romain-dehors', name: 'Romain', x: 14, y: 10, facing: 'left', color: 0xc0602c,
      ifFlags: [FLAGS.stageCorning],
      unlessFlags: [FLAGS.romainDemande],
      dialogue: [
        '[Romain - texte provisoire] Hé ! Tu sors du boulot ?',
        'Tu peux passer au coffee shop acheter la marchandise ?',
        'Rejoins-moi ensuite à notre maison commune (la maison à la porte en cœur, juste à droite de Corning).',
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
  // Panneaux « Aéroport » (dessinés) à côté des sorties ; les deux bouts de la grande rue mènent à l'aéroport.
  objects: [airportSign(2, 12, false), airportSign(33, 12, true)],
  triggers: [toAirport(0, 10), toAirport(0, 11), toAirport(35, 10), toAirport(35, 11)],
  surroundings: { outside },
  spawn: { x: 1, y: 10, facing: 'right' },
};

// La grille du jeu : celle ci-dessus, accordée aux collisions du dessin.
amsterdamMap.grid = builtGrid(amsterdamMap.sourceGrid, BUILT);
