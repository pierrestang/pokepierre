import { parseGrid } from './parseGrid.js';
// Le dessin de la carte : New Delhi en Gen 4 (scripts/build_new_delhi.py, thème « New Delhi (palais moghols) » du
// catalogue) ; ses collisions s'imposent à la grille du jeu (voir builtGrid). La grille ci-dessous (sourceGrid) suit ce
// dessin : avenue, trottoirs, jardins, bassin, portes (sur les portes dessinées).
import BUILT from '../builtMaps/new-delhi.json' with { type: 'json' };
import { builtGrid } from './builtGrid.js';
import { getTile } from '../tiles.js';
import { FLAGS } from '../story.js';
import {
  CROWD, GOING_HOME, HARSH_GOODBYE, HARSH_LEADING, HARSH_WALK, NEIGHBOURS, PASSERS_BY, PROPHECY_WELCOME,
} from '../newDelhiStory.js';
import { toAirport, airportSign } from './airportLinks.js';

// Hors de la carte : la grande avenue se prolonge, les palmiers ailleurs.
function outside(x, y, grid) {
  if (y >= 0 && y < grid.length) {
    const edge = grid[y][x < 0 ? 0 : grid[0].length - 1];
    if (edge === 'ɐ') return edge;
  }
  return 'Y';
}

// La foule de la grande avenue : chacun va et vient entre deux cases ([id, sprite, de, à, réplique]) ; quelques-uns
// restent sur place et regardent autour d'eux. Pas d'étals ni d'animaux : le dépaysement, c'est la foule.
const CROWD_WALKERS = [
  ['passant-1', 'g14', [9, 14], [17, 14], 'curieux'],
  ['passante-1', 'g42', [14, 17], [7, 17], 'grandMere'],
  ['passant-2', 'g86', [21, 13], [11, 13], 'presse'],
  ['passante-2', 'g40', [10, 15], [18, 15], 'photo'],
  ['passant-3', 'g79', [25, 16], [31, 16], 'marcheur'],
  ['passante-3', 'g82', [33, 17], [25, 17], 'conseil'],
  ['passant-4', 'g38', [30, 14], [37, 14], 'rieur'],
  ['passante-4', 'g24', [20, 14], [26, 14], 'etudiante'],
  ['passant-5', 'g58', [36, 16], [32, 13], 'curieux'],
  ['passante-5', 'g50', [5, 13], [5, 17], 'silencieux'],
  ['passant-8', 'g99', [6, 14], [13, 14], 'conseil'],
  ['passante-8', 'g100', [16, 16], [9, 16], 'grandMere'],
  ['passant-9', 'g111', [27, 17], [37, 17], 'presse'],
  ['passante-9', 'g61', [22, 14], [14, 15], 'curieux'],
  ['passant-10', 'g95', [34, 13], [29, 16], 'marcheur'],
  ['passante-10', 'g88', [19, 13], [25, 13], 'etudiante'],
  ['passant-11', 'g60', [8, 13], [8, 17], 'photo'],
  ['passante-11', 'g102', [31, 15], [38, 15], 'rieur'],
];
const CROWD_STANDING = [
  ['passant-6', 'g98', 12, 16, 'down', 'rieur'],
  ['passante-6', 'g19', 21, 12, 'down', 'conseil'],
  ['passant-7', 'g45', 35, 15, 'left', 'silencieux'],
  ['passante-7', 'g37', 23, 13, 'down', 'grandMere'],
  ['passante-12', 'g104', 16, 13, 'down', 'etudiante'],
];
// Le quartier du sud (les maisons, l'internat, la place du bazar) : des habitants, plus calmes que l'avenue
// ([id, nom, sprite, de, à, réplique] pour ceux qui marchent, [id, nom, sprite, x, y, regard, réplique] sinon).
const SOUTH_WALKERS = [
  ['habitant-ancien', 'Habitant', 'g72', [3, 29], [12, 29], 'ancien'],
  ['habitante-1', 'Habitante', 'g50', [9, 31], [20, 31], 'voisine'],
  ['livreur', 'Livreur', 'g96', [22, 30], [36, 30], 'livreur'],
  ['etudiant-internat', 'Étudiant', 'g106', [2, 25], [2, 30], 'internat'],
  ['enfant-1', 'Enfant', 'g23', [22, 28], [28, 28], 'enfants'],
  ['enfant-2', 'Enfant', 'g57', [28, 29], [22, 29], 'enfants'],
];
const SOUTH_STANDING = [
  ['vendeur-bazar', 'Vendeur', 'g112', 35, 23, 'left', 'bazar'],
  ['habitante-2', 'Habitante', 'g108', 10, 27, 'down', 'ancien'],
  ['habitant-2', 'Habitant', 'g90', 31, 26, 'down', 'voisine'],
];
const south = [
  ...SOUTH_WALKERS.map(([id, name, sprite, from, to, line]) => ({
    id, name, sprite, x: from[0], y: from[1], facing: 'down', route: [from, to], dialogue: NEIGHBOURS[line],
  })),
  ...SOUTH_STANDING.map(([id, name, sprite, x, y, facing, line]) => ({
    id, name, sprite, x, y, facing, fidget: true, dialogue: NEIGHBOURS[line],
  })),
];

const crowd = [
  ...CROWD_WALKERS.map(([id, sprite, from, to, line]) => ({
    id, name: id.startsWith('passante') ? 'Passante' : 'Passant', sprite, x: from[0], y: from[1], facing: 'down',
    route: [from, to], dialogue: PASSERS_BY[line],
  })),
  ...CROWD_STANDING.map(([id, sprite, x, y, facing, line]) => ({
    id, name: id.startsWith('passante') ? 'Passante' : 'Passant', sprite, x, y, facing, fidget: true,
    dialogue: PASSERS_BY[line],
  })),
];

// New Delhi — capitale de l'Inde, 40 x 34 cases avec sa bordure de palmiers : un semestre d'échange (voir
// newDelhiStory.js). Au nord, le long de la grande avenue : l'université (le bâtiment à coupole et lanternes dorées),
// le palais de grès, la porte du fort, le minaret. Les jardins : la grande arche (India Gate), le bassin aux lotus. Au
// sud : l'internat (la maison à toit plat), une maison à coupole, la tente du bazar. La grande avenue est pleine de
// monde. Légende : voir src/data/tiles.js (ɔ = pavés, ɐ = avenue, . = jardin, ~ = bassin, D = porte, Y = palmiers).
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
    { x: 6, y: 12, lockedDialogue: ['L\'université, où tu passes le semestre. Les cours reprennent demain.'] },
    // Le palais de grès : sa cour, où se tient la fête (après la rencontre avec Harsh).
    {
      x: 16, y: 11, interior: 'delhiCour',
      lock: { ifFlags: [FLAGS.prophecyDelhi] },
      lockedDialogue: ['Le palais est fermé aux visiteurs.'],
    },
    // La vieille porte du fort : le vieux sage, après la fête.
    {
      x: 27, y: 9, interior: 'delhiFort',
      lock: { ifFlags: [FLAGS.feteDelhi] },
      lockedDialogue: ['Une vieille porte de pierre, plus ancienne que tout le reste de la ville. Elle est fermée.'],
    },
    { x: 33, y: 22, lockedDialogue: ['La tente du bazar est fermée pour aujourd\'hui.'] },
    { x: 5, y: 27, lockedDialogue: ['L\'internat de l\'université, où tu loges pour le semestre.'] },
    { x: 16, y: 28, lockedDialogue: ['Tu frappes. Personne ne répond.'] },
  ],
  // Les bâtiments sont dans le dessin (scripts/build_new_delhi.py).
  buildings: [],
  npcs: [
    ...crowd,
    ...south,
    // Prophecy attend Pierre au bout de l'avenue (déclencheurs plus bas : on ne peut pas le manquer).
    { id: 'prophecy', name: 'Prophecy', x: 29, y: 15, facing: 'left', unlessFlags: [FLAGS.prophecyDelhi], script: PROPHECY_WELCOME },
    // Harsh : il arrive de la foule à l'est quand Prophecy a retrouvé Pierre, puis part devant vers la porte du palais
    // de grès (la cour de la fête), où il entre (voir newDelhiStory.js PROPHECY_WELCOME).
    {
      id: 'harsh', name: 'Harsh', x: 37, y: 12, facing: 'left',
      ifFlags: [FLAGS.prophecyDelhi], unlessFlags: [FLAGS.harshCour], script: HARSH_LEADING,
    },
    // Le semestre fini, devant la porte du fort : le retour à Bordeaux ; ensuite Prophecy suit Pierre (FOLLOWERS) et
    // Harsh reste dire au revoir.
    {
      id: 'prophecy-depart', name: 'Prophecy', x: 26, y: 11, facing: 'right',
      ifFlags: [FLAGS.moisDelhi], unlessFlags: [FLAGS.departDelhi], script: GOING_HOME,
    },
    {
      id: 'harsh-depart', name: 'Harsh', x: 28, y: 11, facing: 'left',
      ifFlags: [FLAGS.moisDelhi], unlessFlags: [FLAGS.retourBordeaux], dialogue: HARSH_GOODBYE,
    },
  ],
  events: [
    // « Quelques mois plus tard… » : Pierre ressort du fort, Prophecy et Harsh l'attendent.
    { on: 'enter', ifFlags: [FLAGS.moisDelhi], unlessFlags: [FLAGS.departDelhi], steps: GOING_HOME },
    // Harsh n'est pas encore arrivé à la porte du palais (partie reprise en chemin) : il repart devant.
    { on: 'enter', ifFlags: [FLAGS.prophecyDelhi], unlessFlags: [FLAGS.harshCour], steps: [HARSH_WALK] },
  ],
  // Panneaux « Aéroport » (dessinés) à côté des sorties ; les deux bouts de la grande avenue mènent à l'aéroport.
  objects: [airportSign(2, 18, false), airportSign(22, 15, true)],
  triggers: [14, 15, 16, 17].flatMap((y) => [toAirport(0, y), toAirport(39, y)]),
  surroundings: { outside },
  spawn: { x: 1, y: 16, facing: 'right' },
};

// La grille du jeu : celle ci-dessus, accordée aux collisions du dessin.
newDelhiMap.grid = builtGrid(newDelhiMap.sourceGrid, BUILT);

// À la colonne 4, sur toute la hauteur praticable de la carte, quelques pas après l'aéroport : Pierre découvre la foule.
// Prophecy, lui, ne repère Pierre que quand il arrive à 5 cases ou moins de lui (dans le carré de 11 x 11 cases autour
// de lui, sa case exceptée ; on peut aussi lui parler).
const walkable = (x, y) => {
  const code = newDelhiMap.grid[y]?.[x];
  return code !== undefined && !getTile(code).solid && code !== 'D';
};
const column = (x, spec) => newDelhiMap.grid.map((row, y) => ({ x, y, ...spec })).filter(({ y }) => walkable(x, y));
const PROPHECY_AT = [29, 15];
const around = ([cx, cy], r, spec) => Array.from({ length: (2 * r + 1) ** 2 }, (_, i) => ({
  x: cx - r + (i % (2 * r + 1)), y: cy - r + Math.floor(i / (2 * r + 1)), ...spec,
})).filter(({ x, y }) => (x !== cx || y !== cy) && walkable(x, y));
newDelhiMap.triggers.push(
  ...column(4, { ifFlags: [FLAGS.arriveeNewDelhi], unlessFlags: [FLAGS.delhiFoule], script: CROWD }),
  ...around(PROPHECY_AT, 5, { unlessFlags: [FLAGS.prophecyDelhi], script: PROPHECY_WELCOME }),
);
