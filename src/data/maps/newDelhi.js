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

// New Delhi — capitale de l'Inde, 40 x 34 cases avec sa bordure de palmiers. Au nord, le long de la grande avenue :
// l'université (le bâtiment à coupole et lanternes dorées), le palais de grès, la porte du fort, le minaret. Les jardins :
// la grande arche (India Gate), le bassin aux lotus, la fontaine octogonale. Au sud : maisons à toit plat et à coupole,
// la tente du bazar, les étals et le stand de chai. Légende : voir src/data/tiles.js (ɔ = pavés, ɐ = avenue, . = jardin,
// ~ = bassin, D = porte, Y = palmiers).
export const newDelhiMap = {
  id: 'newDelhi',
  name: 'New Delhi',
  built: BUILT,
  sourceGrid: parseGrid([
    'YYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYY', // 0  bordure : palmiers (dessinés)
    'YYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYY', // 1
    'YY....................................YY', // 2  les pavés du nord
    'YY.ɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɔɔɔɔ.YY', // 3  l'université, le palais de grès, la porte du fort, le minaret
    'YYɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɔɔɔɔɔɔɔɔɔɔɔɔ.YY', // 4
    'YYɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɔɔɔɔɔɔɔɔɔɔɔɔɔ.YY', // 5
    'YYɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɔɔɔɔɔɔɔɔɔɔɔɔɔ.YY', // 6
    'YYɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɔɔɔɔɔɔɔɔɔɔɔɔɔ.YY', // 7
    'YYɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɔɔɔɔɔɔɔɔɔɔɔɔɔ.YY', // 8
    'YYɐɐɐɐɐɐɔɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɔɔɔDɔɔɔɔɔɔɔɔɔ.YY', // 9  porte : la porte du fort (27)
    'YYɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɔɔɔɔɔɔɔɔɔɔɔɔɔ.YY', // 10
    'YYɐɐɐɐɐɐɐɐɐɐɐɐɐɐDɐɐɐɐɐɐɐɔɔɔɔɔɔɔɔɔɔɔɔɔ.YY', // 11  porte : le palais (16)
    'YYɐɐɐɐDɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɔɔɔɔɔɔɔɔɔɔɔ.YY', // 12  porte : l'université (6)
    'YYɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɔɔɔɔɔɔɔɔɔɔɔ.YY', // 13
    '..ɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɔɔɔɔɔɐɐɐɔɔ...', // 14  la grande avenue (vers l'aéroport, la bordure y est ouverte, rangées 14 à 17)
    'ɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐ.......ɐɐɐɐɔɔɔɐɐɐɐɐɐɐɐɐ', // 15
    'ɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐ.ɔ~~~~ɔ..ɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐ', // 16
    'ɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐ.ɔ~~~~~~ɔ.ɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐ', // 17
    'YYɐɐɐɐɐ...ɐɐɐ...~~~~~~~~ɔ.ɐɐɐɐɐɐɐɐɐɐɔ.YY', // 18  les jardins : India Gate, le bassin aux lotus et son île (banian)
    'YY......ɔ.ɐɐɐ..ɔ~~ɔ..ɔ~~~ɔ.ɐɐɐɐɔɔɔɔɔɔ.YY', // 19  la place de grès : la tente du bazar, le stand de chai
    'YY........ɐɐɐ..~~.....~~~~.ɔɔɔɔɔɔɔɔɔɔ.YY', // 20
    'YY........ɐɐɐ..~~ɔ...ɔ~~~ɔ.ɔɔɔɔɔɔɔɔɔɔ.YY', // 21
    'YY.ɐɐɐɐɐ..ɐɐɐ..ɔ~~~~~~~~ɔ..ɔɔɔɔɔɔDɔɔɔ.YY', // 22  porte : la tente du bazar (33)
    'YYɐɐ.ɐɐɐɐɐɐɐɐɐ..ɔ~~~~~~ɔ...ɔɔɔɔɔɔɔɔɔɔ.YY', // 23  les maisons du sud
    'YYɐɐɐɐɐɐɐɐɐɐɐɐɐ...ɔ~~~ɔ...ɔɔɔɔɔɔɔɔɔɔɔ.YY', // 24
    'YYɐɐɐɐɐɐɐɐɐɐɐɐɐɐ.........ɔɔɔɔɔɔɔɔɔɔɔɔ.YY', // 25
    'YYɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɔɔɔɔɔɔɔɔɔɔɔɔ.YY', // 26
    'YYɐɐɐDɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɔɔɔɔɔɔɔɔɔɔɔɔ.YY', // 27  porte : la maison à toit plat (5)
    'YYɐɐɐɐɐɐɐɐɐɐɐɐɐɐDɐɐɐɐɐɐɐɐɐɔɔɔɔɔɔɔɔɔɔɔ.YY', // 28  porte : la maison à coupole (16)
    'YYɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɔɔɔɔɔɔɔɔɔɔ.YY', // 29
    'YY.ɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɔɔɔɔɔɔ.YY', // 30
    'YY....................................YY', // 31  herbe sous les palmiers du bas
    'YYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYY', // 32
    'YYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYY', // 33
  ]),
  doors: [
    { x: 6, y: 12, interior: 'delhiUniversity' },   // ton université d'échange (la coupole aux lanternes dorées)
    { x: 16, y: 11, lockedDialogue: ['[Texte provisoire] Le palais est fermé aux visiteurs.'] },
    { x: 27, y: 9, lockedDialogue: ['[Texte provisoire] La porte du fort est fermée.'] },
    { x: 33, y: 22, lockedDialogue: ['[Texte provisoire] Le bazar est fermé pour aujourd\'hui.'] },
    { x: 5, y: 27, lockedDialogue: NOT_HOME },
    { x: 16, y: 28, lockedDialogue: NOT_HOME },
  ],
  // Les bâtiments sont dans le dessin (scripts/build_new_delhi.py).
  buildings: [],
  npcs: [
    // Harsh, étudiant à l'université : il t'attend à la sortie et propose d'aller dans le désert.
    {
      id: 'harsh', ...HARSH, x: 8, y: 13, facing: 'left',
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
      id: 'harsh-retour', ...HARSH, x: 8, y: 13, facing: 'left',
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
  objects: [airportSign(2, 18, false), airportSign(22, 15, true)],
  triggers: [14, 15, 16, 17].flatMap((y) => [toAirport(0, y), toAirport(39, y)]),
  surroundings: { outside },
  spawn: { x: 1, y: 16, facing: 'right' },
};

// La grille du jeu : celle ci-dessus, accordée aux collisions du dessin.
newDelhiMap.grid = builtGrid(newDelhiMap.sourceGrid, BUILT);
