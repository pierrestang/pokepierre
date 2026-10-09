import { parseGrid } from './parseGrid.js';
// Le dessin de la carte : le rêve de la fin du jeu (scripts/build_reve.py, planches du Pokémon Gaia Project : Monde
// Distorsion et ruines de la Colonne Lance) ; ses collisions s'imposent à la grille du jeu (voir builtGrid).
import BUILT from '../builtMaps/reve.json' with { type: 'json' };
import { builtGrid } from './builtGrid.js';
import { FLAGS } from '../story.js';
import { CENTER, PRESENT, REUNION, towardCenter } from '../reveStory.js';

// Les présents se tiennent sur le pourtour de la plate-forme, à quatre cases de Pierre (24 places sur 32, régulièrement
// espacées), tournés vers lui.
const RING = (() => {
  const [cx, cy] = CENTER;
  const cells = [];
  for (let x = cx - 4; x <= cx + 4; x++) cells.push([x, cy - 4]);
  for (let y = cy - 3; y <= cy + 4; y++) cells.push([cx + 4, y]);
  for (let x = cx + 3; x >= cx - 4; x--) cells.push([x, cy + 4]);
  for (let y = cy + 3; y >= cy - 3; y--) cells.push([cx - 4, y]);
  return cells.filter((_, i) => i % 4 !== 3);
})();

// Le rêve — 28 x 22 cases : une grande plate-forme de brique flotte dans le bleu, quatre colonnes brisées à ses coins ;
// autour, des îlots, des arbres qui poussent de travers, un tourbillon, deux tablettes gravées. Une brume pâle dérive
// (effects.js startDreamMist). Pierre au centre ; le joueur n'a pas la main (voir reveStory.js).
export const reveMap = {
  id: 'reve',
  name: '',
  built: BUILT,
  sourceGrid: parseGrid(Array.from({ length: BUILT.height }, () => '.'.repeat(BUILT.width))),
  doors: [],
  buildings: [],
  npcs: PRESENT.map(([id, name], i) => ({
    id, name, x: RING[i][0], y: RING[i][1], facing: towardCenter(RING[i]), still: true,
    dialogue: ['…'],
  })),
  events: [{ on: 'enter', unlessFlags: [FLAGS.finDuJeu], steps: REUNION }],
  mist: true,
  music: { song: 'title', volume: 0.35 },
  surroundings: false,
  spawn: { x: CENTER[0], y: CENTER[1], facing: 'down' },
};

// La grille du jeu : accordée aux collisions du dessin (la plate-forme seule est praticable).
reveMap.grid = builtGrid(reveMap.sourceGrid, BUILT);
