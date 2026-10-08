import { parseGrid } from './parseGrid.js';
// Le dessin de la carte : New Delhi en Gen 4 (scripts/build_new_delhi.py, thème « New Delhi (palais moghols) » du
// catalogue) ; ses collisions s'imposent à la grille du jeu (voir builtGrid). La grille ci-dessous (sourceGrid) suit ce
// dessin : avenue, trottoirs, jardins, bassin, portes (sur les portes dessinées).
import BUILT from '../builtMaps/new-delhi.json' with { type: 'json' };
import { builtGrid } from './builtGrid.js';
import { FLAGS } from '../story.js';
import { toAirport, airportSign } from './airportLinks.js';

const HARSH = { name: 'Harsh', color: 0x8c3cb0 };

// Hors de la carte : la grande avenue se prolonge, les palmiers ailleurs.
function outside(x, y, grid) {
  if (y >= 0 && y < grid.length) {
    const edge = grid[y][x < 0 ? 0 : grid[0].length - 1];
    if (edge === 'ɐ') return edge;
  }
  return 'Y';
}

const NOT_HOME = ['[Texte provisoire] Personne ne répond...'];

// New Delhi — capitale de l'Inde, 36 x 30 cases avec sa bordure de palmiers. Au nord, le long de la grande avenue :
// l'université (le bâtiment à coupole et lanternes dorées), le palais de grès, la porte du fort, le minaret. Les jardins :
// la grande arche (India Gate), le bassin aux lotus, la fontaine octogonale. Au sud : maisons à toit plat et à coupole,
// la tente du bazar, les étals et le stand de chai. Légende : voir src/data/tiles.js (ɔ = pavés, ɐ = avenue, . = jardin,
// ~ = bassin, D = porte, Y = palmiers).
export const newDelhiMap = {
  id: 'newDelhi',
  name: 'New Delhi',
  built: BUILT,
  sourceGrid: parseGrid([
    'YYYYYYYYYYYY............YYYYYYYYYYYY', // 0  bordure : palmiers (dessinés) ; le palais monte jusqu'en haut
    'YYYYYYYYYYYY............YYYYYYYYYYYY', // 1
    'YYɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔYY', // 2
    'YYɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔYY', // 3
    'YYɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔYY', // 4
    'YYɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔYY', // 5
    'YYɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔYY', // 6
    'YYɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔYY', // 7
    'YYɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔYY', // 8
    'YYɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔYY', // 9
    'YYɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔYY', // 10
    'YYɔɔɔɔDɔɔɔɔɔɔɔɔɔɔDɔɔɔɔɔɔɔɔDɔɔɔɔɔɔɔYY', // 11  portes : université (6), palais (17), porte du fort (26)
    'ɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐ', // 12  grande avenue (vers l'aéroport, la bordure y est ouverte)
    'ɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐ', // 13
    'YYɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔYY', // 14  trottoir (panneaux de l'aéroport)
    'YY................................YY', // 15  jardins : India Gate, bassin aux lotus (x 16-21), fontaine
    'YY..............~~~~~~............YY', // 16
    'YY..............~~~~~~............YY', // 17
    'YY................................YY', // 18
    'YYɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔYY', // 19  allée
    'YYɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔYY', // 20
    'YYɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔYY', // 21
    'YYɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔYY', // 22
    'YYɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔYY', // 23
    'YYɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔYY', // 24
    'YYɔɔDɔɔɔɔDɔɔɔɔDɔɔɔɔɔɔɔɔɔɔɔɔɔɔDɔɔɔɔYY', // 25  portes : maison à toit plat (4), maison à coupole (9), bazar (14), maison de grès (29)
    'YYɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐYY', // 26  rue sud
    'YYɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐYY', // 27
    'YYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYY', // 28  bordure
    'YYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYY', // 29
  ]),
  doors: [
    { x: 6, y: 11, interior: 'delhiUniversity' },   // ton université d'échange (la coupole aux lanternes dorées)
    { x: 17, y: 11, lockedDialogue: ['[Texte provisoire] Le palais est fermé aux visiteurs.'] },
    { x: 26, y: 11, lockedDialogue: ['[Texte provisoire] La porte du fort est fermée.'] },
    { x: 4, y: 25, lockedDialogue: NOT_HOME },
    { x: 9, y: 25, lockedDialogue: NOT_HOME },
    { x: 14, y: 25, lockedDialogue: ['[Texte provisoire] Le bazar est fermé pour aujourd\'hui.'] },
    { x: 29, y: 25, lockedDialogue: NOT_HOME },
  ],
  // Les bâtiments sont dans le dessin (scripts/build_new_delhi.py).
  buildings: [],
  npcs: [
    // Harsh, étudiant à l'université : il t'attend à la sortie et propose d'aller dans le désert.
    {
      id: 'harsh', ...HARSH, x: 8, y: 12, facing: 'left',
      ifFlags: [FLAGS.echangeCommence],
      unlessFlags: [FLAGS.potionDonnee],
      dialogue: [
        "[Harsh - texte provisoire] Salut ! Moi c'est Harsh, j'étudie à l'université avec toi.",
        'Ça te dirait de venir avec moi dans le désert du Rajasthan ?',
      ],
      after: ['[Harsh - texte provisoire] Alors, on part dans le désert ?'],
      setFlag: FLAGS.harshRencontre,
      ask: {
        question: 'Aller dans le désert avec Harsh ?',
        choices: [
          {
            label: 'Oui',
            dialogue: ['[Harsh - texte provisoire] Génial ! En route pour le Rajasthan !'],
            setFlags: [FLAGS.arriveeRajasthan],
            warp: { map: 'rajasthan', x: 2, y: 10, facing: 'right' },
          },
          { label: 'Non', dialogue: ['[Harsh - texte provisoire] Dommage ! Reviens me voir si tu changes d\'avis.'] },
        ],
      },
    },
    {
      id: 'harsh-retour', ...HARSH, x: 8, y: 12, facing: 'left',
      ifFlags: [FLAGS.potionDonnee],
      dialogue: ['[Harsh - texte provisoire] Quel voyage ! Va raconter ça à la professeure.'],
    },
  ],
  events: [
    // En sortant de l'université après le premier cours : Harsh t'aborde.
    {
      on: 'enter',
      ifFlags: [FLAGS.echangeCommence],
      unlessFlags: [FLAGS.harshRencontre],
      steps: [{ talk: 'harsh' }],
    },
  ],
  // Panneaux « Aéroport » (dessinés) à côté des sorties ; les deux bouts de la grande avenue mènent à l'aéroport.
  objects: [airportSign(2, 14, false), airportSign(33, 14, true)],
  triggers: [toAirport(0, 12), toAirport(0, 13), toAirport(35, 12), toAirport(35, 13)],
  surroundings: { outside },
  spawn: { x: 1, y: 12, facing: 'right' },
};

// La grille du jeu : celle ci-dessus, accordée aux collisions du dessin.
newDelhiMap.grid = builtGrid(newDelhiMap.sourceGrid, BUILT);
