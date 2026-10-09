import { parseGrid } from './parseGrid.js';
// Le dessin de la carte : Hanoï en Gen 4 (première version par scripts/build_hanoi.py, puis retouché dans le créateur :
// bâtiments de Johto, pagode, pont, portique) ; ses collisions s'imposent à la grille du jeu (voir builtGrid). La grille
// ci-dessous (sourceGrid) suit ce dessin : sols, lac, portes.
import BUILT from '../builtMaps/hanoi.json' with { type: 'json' };
import { builtGrid } from './builtGrid.js';
import { toAirport, airportSign } from './airportLinks.js';
import { FLAGS, ITEMS } from '../story.js';
import {
  ARRIVAL, CHESS_PLAYERS, MAILBOX, MR_LAM, PASSANT, PASSANTE, SIX_MONTHS_LATER, TOURISTS_MEET, TOURISTS_THANKS, VENDEUSE,
} from '../hanoiStory.js';

// Hors de la carte : la grande rue se prolonge (vers l'aéroport), la forêt ailleurs.
function outside(x, y, grid) {
  if (y >= 0 && y < grid.length) {
    const edge = grid[y][x < 0 ? 0 : grid[0].length - 1];
    if (edge === 'ɐ') return edge;
  }
  return 'T';
}

const NOT_HOME = ['Tu frappes. Personne ne répond… ou alors, en vietnamien.'];
// Les deux touristes (sprites d'origine) : ils s'appellent tous les deux « Touriste » à l'écran.
const TOURIST_1 = { name: 'Touriste', sprite: 'g24', color: 0xe0a0d0 };
const TOURIST_2 = { name: 'Touriste', sprite: 'g22', color: 0x80c0e0 };
// Après la visite, et jusqu'à l'ellipse des six mois : les touristes restent devant le temple.
const AFTER_VISIT = { ifFlags: [FLAGS.visiteTerminee], unlessFlags: [FLAGS.sixMoisHanoi] };

// Hanoï — capitale du Vietnam, 36 x 30 cases avec sa bordure de sapins. Le long de la grande rue, au nord : une maison
// violette, la maison noire (l'agence de voyage), ta maison (la seconde maison violette, la boîte aux lettres à sa
// droite) et la maison bleue aux lanternes. Au milieu : le lac Hoàn Kiếm, son îlot à la cloche et son pont de bois ; le
// temple (toit rouge, murs violets) à droite. Au sud : le portique rouge, les étals, la maison sur pilotis et la grande
// maison bleue. Légende : voir src/data/tiles.js (ɔ = pavés, ɐ = rue, ~ = lac, D = porte, T = sapins).
export const hanoiMap = {
  id: 'hanoi',
  name: 'Hanoï',
  built: BUILT,
  sourceGrid: parseGrid([
    'TTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTT', // 0  sapins : bordure de la carte
    'TTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTT', // 1
    'TTɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔTT', // 2
    'TTɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔTT', // 3
    'TTɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔTT', // 4
    'TTɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔDɔɔɔɔɔɔɔɔɔɔɔɔɔTT', // 5
    'TTɔɔDɔɔɔɔɔɔDɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔTT', // 6
    'TTɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔDɔɔɔɔTT', // 7  portes : maison violette (4), agence (12), ta maison (20), maison bleue (29)
    'ɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐ', // 8  grande rue (vers l'aéroport, la bordure y est ouverte)
    'ɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐ', // 9
    'TTɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔTT', // 10
    'TT.................ɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔTT', // 11
    'TT....~~~~~~~~~~...ɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔTT', // 12  lac Hoàn Kiếm et son pont
    'TT...~~~~~~...~~...ɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔTT', // 13
    'TT...~~~~.....~~...ɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔTT', // 14
    'TT..~~~~~.....~~...ɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔTT', // 15
    'TT..~~~~~...~~~~...ɔɔɔɔɔɔɔDɔɔɔɔɔɔɔTT', // 16  porte du temple (toit rouge, 26, 16)
    'TT...~~~~..~~~~....ɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔTT', // 17
    'TTɔɔɔɔɔ~~~~~~~ɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔTT', // 18
    'TTɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔTT', // 19
    'TTɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔTT', // 20
    'TTɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔTT', // 21
    'TTɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔTT', // 22
    'TTɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔTT', // 23  porte de la grande maison bleue (27, 23)
    'TTɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐDɐɐɐɐɐɐɐTT', // 24  rue sud
    'TTɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐTT', // 25
    'TTɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔTT', // 26
    'TTɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔTT', // 27
    'TTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTT', // 28  sapins
    'TTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTT', // 29
  ]),
  doors: [
    { x: 4, y: 6, lockedDialogue: NOT_HOME },        // la maison violette
    { x: 11, y: 6, interior: 'travelAgency' },       // l'agence de voyage (la maison noire)
    { x: 20, y: 5, interior: 'hanoiHome' },          // ta maison (la seconde maison violette, porte en retrait)
    { x: 29, y: 7, lockedDialogue: NOT_HOME },       // la maison bleue aux lanternes
    // Le temple (toit rouge) : on y entre en guidant les touristes.
    {
      x: 26, y: 16, interior: 'temple',
      lock: { ifFlags: [FLAGS.touristesSuivent] },
      lockedDialogue: ['Le temple. Un lieu de recueillement : on ne le visite qu\'accompagné d\'un guide.'],
    },
    { x: 26, y: 24, lockedDialogue: NOT_HOME },      // la grande maison bleue
  ],
  // Les bâtiments sont dans le dessin.
  buildings: [],
  npcs: [
    // Dans la grande rue, un peu plus loin que l'agence (après ta maison) : deux touristes attendent leur guide, dès
    // l'arrivée (les consignes traduites par M. Lam disent où les trouver).
    {
      id: 'touriste-1', ...TOURIST_1, x: 25, y: 8, facing: 'down',
      ifFlags: [FLAGS.arriveeHanoi], unlessFlags: [FLAGS.touristesSuivent],
      script: TOURISTS_MEET,
    },
    {
      id: 'touriste-2', ...TOURIST_2, x: 26, y: 8, facing: 'down',
      ifFlags: [FLAGS.arriveeHanoi], unlessFlags: [FLAGS.touristesSuivent],
      script: TOURISTS_MEET,
    },
    // Après la visite, ils restent de chaque côté de la porte du temple.
    { id: 'touriste-1-merci', ...TOURIST_1, x: 25, y: 17, facing: 'right', ...AFTER_VISIT, dialogue: ['Merci encore ! J\'ai tout regardé, pour de vrai.'] },
    { id: 'touriste-2-merci', ...TOURIST_2, x: 27, y: 17, facing: 'left', ...AFTER_VISIT, dialogue: ['Le meilleur guide de Hanoï !'] },
    // Les passants de la rue : ils ne parlent pas français.
    { id: 'passante', name: 'Passante', sprite: 'g19', x: 22, y: 9, facing: 'down', script: PASSANTE },
    { id: 'vendeuse', name: 'Vendeuse', sprite: 'g70', x: 18, y: 23, facing: 'up', still: true, script: VENDEUSE },
    { id: 'passant', name: 'Passant', sprite: 'g14', x: 15, y: 25, facing: 'right', script: PASSANT },
    // M. Lam, sur le banc au bord du lac : il parle un peu français.
    { id: 'm-lam', name: 'M. Lam', sprite: 'g129', x: 7, y: 10, facing: 'left', still: true, script: MR_LAM },
    // Facultatif : deux papis jouent aux échecs chinois au bord du lac (Audace).
    { id: 'papi-1', name: 'Papi', sprite: 'g39', x: 18, y: 12, facing: 'right', still: true, script: CHESS_PLAYERS },
    { id: 'papi-2', name: 'Papi', sprite: 'g48', x: 20, y: 12, facing: 'left', still: true, script: CHESS_PLAYERS },
  ],
  events: [
    // L'arrivée : personne n'attend Pierre.
    { on: 'enter', ifFlags: [FLAGS.arriveeHanoi], unlessFlags: [FLAGS.hanoiOuverture], steps: ARRIVAL },
    // En sortant du temple avec l'objet de chance : les touristes te remercient.
    {
      on: 'enter',
      ifFlags: [FLAGS.touristesSuivent],
      ifItems: [ITEMS.objetChance.id],
      unlessFlags: [FLAGS.visiteTerminee],
      steps: TOURISTS_THANKS,
    },
    // En sortant du bureau du patron, remercié : six mois plus tard, l'appel de Romain.
    { on: 'enter', ifFlags: [FLAGS.travailTermine], unlessFlags: [FLAGS.sixMoisHanoi], steps: SIX_MONTHS_LATER },
  ],
  objects: [
    // La boîte aux lettres, à droite de ta maison (dessinée) : une carte de la bande de Hull.
    { x: 24, y: 7, dialogue: MAILBOX },
    // Panneaux « Aéroport » à côté des sorties.
    airportSign(3, 10, false),
    airportSign(32, 10, true),
  ],
  // Les deux bouts de la rue mènent à l'aéroport.
  triggers: [toAirport(0, 8), toAirport(0, 9), toAirport(35, 8), toAirport(35, 9)],
  surroundings: { outside },
  spawn: { x: 1, y: 8, facing: 'right' },
};

// La grille du jeu : celle ci-dessus, accordée aux collisions du dessin.
hanoiMap.grid = builtGrid(hanoiMap.sourceGrid, BUILT);
