import { parseGrid } from './parseGrid.js';
// Le dessin de la carte : Hanoï redessiné en Gen 4 par scripts/build_hanoi.py (sol du convertisseur, bâtiments et
// mobilier du catalogue du créateur) ; ses collisions s'imposent à la grille du jeu (voir builtGrid). La grille
// ci-dessous (sourceGrid) suit ce dessin : sols, lac, portes.
import BUILT from '../builtMaps/hanoi.json' with { type: 'json' };
import { builtGrid } from './builtGrid.js';
import { toAirport, airportSign } from './airportLinks.js';
import { FLAGS, ITEMS } from '../story.js';

// Hors de la carte : la grande rue se prolonge (vers l'aéroport), la forêt ailleurs.
function outside(x, y, grid) {
  if (y >= 0 && y < grid.length) {
    const edge = grid[y][x < 0 ? 0 : grid[0].length - 1];
    if (edge === 'ɐ') return edge;
  }
  return 'T';
}

const NOT_HOME = ['[Texte provisoire] Personne ne répond...'];

// Hanoï — capitale du Vietnam, 36 x 30 cases avec sa bordure de sapins : maisons-tubes le long des deux rues, le lac
// Hoàn Kiếm et son îlot, le temple (palais doré), le petit marché. Légende : voir src/data/tiles.js (ɔ = pavés,
// ɐ = rue, ~ = lac, = = ponton, D = porte, T = sapins).
export const hanoiMap = {
  id: 'hanoi',
  name: 'Hanoï',
  built: BUILT,
  sourceGrid: parseGrid([
    'TTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTT', // 0  sapins : bordure de la carte
    'TTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTT', // 1
    'TTɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔTT', // 2  maisons nord (portes en rangée 6 : ta maison, la 2e ; l'agence, la 4e)
    'TTɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔTT', // 3
    'TTɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔTT', // 4
    'TTɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔTT', // 5
    'TTɔɔDɔɔɔɔDɔɔɔɔDɔɔɔɔɔDɔɔɔDɔɔɔɔDɔɔɔɔTT', // 6
    'TTɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔTT', // 7
    'ɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐ', // 8  grande rue (vers l'aéroport, la bordure y est ouverte)
    'ɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐ', // 9
    'TTɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔTT', // 10  trottoir, panneaux aéroport
    'TT.................ɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔTT', // 11
    'TT..~~~~~~~~=~~~~..ɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔTT', // 12  lac Hoàn Kiếm, ponton vers l'îlot de la cloche ; place du temple
    'TT..~~~~~~~...~~~..ɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔTT', // 13
    'TT..~~~~~~~...~~~..ɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔTT', // 14
    'TT..~~~~~~~...~~~..ɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔTT', // 15
    'TT..~~~~~~~~~~~~~..ɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔTT', // 16
    'TT.................ɔɔɔɔɔDɔɔɔɔɔɔɔɔɔTT', // 17  porte du temple (palais doré)
    'TTɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔTT', // 18
    'TTɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔTT', // 19  maisons sud, marché
    'TTɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔTT', // 20
    'TTɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔTT', // 21
    'TTɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔTT', // 22
    'TTɔɔDɔɔɔɔDɔɔɔDɔɔɔɔɔɔɔɔɔɔDɔɔɔɔDɔɔɔɔTT', // 23
    'TTɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐTT', // 24  rue sud
    'TTɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐTT', // 25
    'TTɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔTT', // 26
    'TTɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔTT', // 27
    'TTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTT', // 28  sapins
    'TTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTT', // 29
  ]),
  doors: [
    { x: 4, y: 6,  lockedDialogue: NOT_HOME },
    { x: 9, y: 6,  interior: 'hanoiHome' },          // ta maison
    { x: 14, y: 6,  lockedDialogue: NOT_HOME },
    { x: 20, y: 6,  interior: 'travelAgency' },       // agence de voyage
    { x: 24, y: 6,  lockedDialogue: NOT_HOME },
    { x: 29, y: 6,  lockedDialogue: NOT_HOME },
    // Le temple (palais doré) : on y entre en guidant les touristes.
    {
      x: 24, y: 17, interior: 'temple',
      lock: { ifFlags: [FLAGS.touristesSuivent] },
      lockedDialogue: ['[Texte provisoire] Le temple est un lieu de recueillement.'],
    },
    { x: 4, y: 23, lockedDialogue: NOT_HOME },
    { x: 9, y: 23, lockedDialogue: NOT_HOME },
    { x: 13, y: 23, lockedDialogue: NOT_HOME },
    { x: 24, y: 23, lockedDialogue: NOT_HOME },
    { x: 29, y: 23, lockedDialogue: NOT_HOME },
  ],
  // Les bâtiments sont dans le dessin (scripts/build_hanoi.py).
  buildings: [],
  npcs: [
    // Devant l'agence, après ton premier jour : deux touristes à guider jusqu'au temple.
    {
      id: 'touriste-1', name: 'Anna', x: 19, y: 7, facing: 'right', color: 0xe0a0d0,
      ifFlags: [FLAGS.travailEtape1],
      unlessFlags: [FLAGS.touristesSuivent],
      dialogue: [
        "[Anna - texte provisoire] Bonjour ! Tu travailles à l'agence ?",
        'Tu pourrais nous emmener visiter le temple ?',
        "D'accord ! Tu acceptes de les guider jusqu'au temple.",
      ],
      setFlag: FLAGS.touristesSuivent,
    },
    {
      id: 'touriste-2', name: 'Tom', x: 18, y: 7, facing: 'right', color: 0x80c0e0,
      ifFlags: [FLAGS.travailEtape1],
      unlessFlags: [FLAGS.touristesSuivent],
      dialogue: ["[Tom - texte provisoire] On aimerait tellement voir le temple !"],
    },
    // Après la visite, ils restent de chaque côté du temple.
    {
      id: 'touriste-1-merci', name: 'Anna', x: 23, y: 18, facing: 'right', color: 0xe0a0d0,
      ifFlags: [FLAGS.visiteTerminee],
      dialogue: ['[Anna - texte provisoire] Merci encore pour la visite !'],
    },
    {
      id: 'touriste-2-merci', name: 'Tom', x: 25, y: 18, facing: 'left', color: 0x80c0e0,
      ifFlags: [FLAGS.visiteTerminee],
      dialogue: ['[Tom - texte provisoire] Super visite, merci !'],
    },
  ],
  events: [
    // En sortant de l'agence après le premier jour : Anna t'interpelle.
    {
      on: 'enter',
      ifFlags: [FLAGS.travailEtape1],
      unlessFlags: [FLAGS.touristesSuivent],
      steps: [{ talk: 'touriste-1' }],
    },
    // En sortant du temple avec l'objet de chance : les touristes te remercient.
    {
      on: 'enter',
      ifFlags: [FLAGS.touristesSuivent],
      ifItems: [ITEMS.objetChance.id],
      unlessFlags: [FLAGS.visiteTerminee],
      steps: [
        { speaker: 'Anna', say: ['[Anna - texte provisoire] Quel temple magnifique ! Merci pour la visite.'] },
        { speaker: 'Tom', say: ['[Tom - texte provisoire] Oui, merci beaucoup !'] },
        { setFlag: FLAGS.visiteTerminee },
      ],
    },
  ],
  // Les deux bouts de la rue mènent à l'aéroport.
  // Panneaux « Aéroport » à côté des sorties.
  objects: [airportSign(3, 10, false), airportSign(32, 10, true)],
  triggers: [toAirport(0, 8), toAirport(0, 9), toAirport(35, 8), toAirport(35, 9)],
  surroundings: { outside },
  spawn: { x: 1, y: 8, facing: 'right' },
};

// La grille du jeu : celle ci-dessus, accordée aux collisions du dessin.
hanoiMap.grid = builtGrid(hanoiMap.sourceGrid, BUILT);
