import { parseGrid } from './parseGrid.js';
// Le dessin de la carte : Paris en Gen 4 (scripts/build_paris.py, thème « Paris (monuments et cafés) » du catalogue) ;
// ses collisions s'imposent à la grille du jeu (voir builtGrid). La grille ci-dessous (sourceGrid) suit ce dessin :
// avenue, pavés, jardin, Seine, ponts, portes (sur les portes dessinées).
import BUILT from '../builtMaps/paris.json' with { type: 'json' };
import { builtGrid } from './builtGrid.js';
import { FLAGS } from '../story.js';
import { toAirport, airportSign } from './airportLinks.js';

// Hors de la carte : la Seine, l'avenue et la rue sud se prolongent ; des arbres ailleurs.
function outside(x, y, grid) {
  if (y >= 0 && y < grid.length) {
    const edge = grid[y][x < 0 ? 0 : grid[0].length - 1];
    if (['G', 'ɐ', 'ɔ'].includes(edge)) return edge;
  }
  return 'ƀ';
}

const NOT_HOME = ['[Texte provisoire] Personne ne répond...'];

// Paris — 52 x 48 cases avec sa bordure d'arbres (premier jet de scripts/build_paris.py, retouché à la main dans le
// créateur). Au nord : le grand dôme (Bercy), le Louvre et son drapeau, le musée-gare ; l'avenue les traverse (ouest :
// Bordeaux, est : l'aéroport). Puis ton appartement (l'immeuble aux balcons fleuris), le bistrot (le café à terrasse), le
// jardin au bassin, l'opéra. La Seine, deux yachts, deux ponts. Au sud : un immeuble crème, le café au store rayé,
// Notre-Dame, la tour de bureaux vitrée (l'entreprise) ; la rue sud mène à Toulon (est).
// Légende : voir src/data/tiles.js (ɔ = pavés, . = jardin, G = Seine, D = porte, ƀ = arbres).
export const parisMap = {
  id: 'paris',
  name: 'Paris',
  built: BUILT,
  sourceGrid: parseGrid([
    'ƀƀƀƀƀƀƀƀƀƀƀƀƀƀƀƀƀƀƀƀƀƀƀƀƀƀƀƀƀƀƀƀƀƀƀƀƀƀƀƀƀƀƀƀƀƀƀƀƀƀƀƀ', // 0  bordure : arbres (dessinés)
    'ƀƀƀƀƀƀƀƀƀƀƀƀƀƀƀƀƀƀƀƀƀƀƀƀƀƀƀƀƀƀƀƀƀƀƀƀƀƀƀƀƀƀƀƀƀƀƀƀƀƀƀƀ', // 1
    'ƀƀ....................ɔɔɔɔɔɔɔ.....................ƀƀ', // 2  le dôme (Bercy), le Louvre, le musée-gare
    'ƀƀ.ɔɔɔɔɔɔɔɔɔɔɔɔɔɔ.....ɔɔɔɔɔɔɔ.....ɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔ.ƀƀ', // 3
    'ƀƀ.ɔɔɔɔɔɔɔɔɔɔɔɔɔɔ.....ɔɔɔɔɔɔ......ɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔ.ƀƀ', // 4
    'ƀƀ.ɔɔɔɔɔɔɔɔɔɔɔɔɔɔ.....ɔɔɔɔɔɔ......ɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔ.ƀƀ', // 5
    'ƀƀ.ɔɔɔɔɔɔɔɔɔɔɔɔɔɔ.....ɔɔɔɔɔɔ......ɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔ.ƀƀ', // 6
    'ƀƀ.ɔɔɔɔɔɔɔɔɔɔɔɔɔɔ.....ɔɔɔɔɔɔ......ɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔ.ƀƀ', // 7
    'ƀƀ.ɔɔɔɔɔɔɔɔɔɔɔɔɔɔ.....ɔ...........ɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔ.ƀƀ', // 8
    'ƀƀ.ɔɔɔɔɔɔɔɔɔɔɔɔɔɔ.....ɔ...........ɔɔɔɔɔDɔɔɔɔɔɔɔɔɔ.ƀƀ', // 9  porte : le musée-gare (39)
    '...ɔɔɔɔɔɔɔɔɔɔɔɔɔɔ.................ɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔ...', // 10  l'avenue (ouverte aux deux bouts, rangées 10 à 13 : ouest Bordeaux, est aéroport)
    'ɔɔɔɔɔɔɔɔɔDɔɔɔɔɔɔɔ.................ɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔ', // 11  porte : Bercy (9)
    'ɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔ.................ɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔ', // 12
    'ɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔ.................ɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔ', // 13
    'ƀƀ.ɔɔɔɔɔɔɔɔɔɔɔɔɔɔ....D.......D....ɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔ.ƀƀ', // 14  portes : le Louvre (21, 29) ; le jardin au bassin
    'ƀƀ.ɔɔɔɔɔɔɔɔɔɔɔɔɔɔ.................ɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔ.ƀƀ', // 15
    'ƀƀ.ɔɔɔɔɔɔɔɔɔɔɔɔɔɔ.................ɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔ.ƀƀ', // 16
    'ƀƀ.ɔɔɔɔɔɔɔɔɔɔɔɔɔɔ.................ɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔ.ƀƀ', // 17
    'ƀƀ.ɔɔɔɔɔɔɔɔɔɔɔɔɔɔ.................ɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔ.ƀƀ', // 18
    'ƀƀ.ɔɔɔɔɔɔɔɔɔɔɔɔɔɔ.................ɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔ.ƀƀ', // 19
    'ƀƀ.ɔɔɔɔɔɔɔɔɔɔɔɔɔɔ.................ɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔ.ƀƀ', // 20
    'ƀƀ.ɔɔɔɔɔɔɔɔɔɔɔɔɔɔ.................ɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔ.ƀƀ', // 21
    'ƀƀ.ɔɔɔDɔɔɔɔɔɔDɔɔɔ.................ɔɔɔɔɔɔɔDɔɔɔɔɔɔɔ.ƀƀ', // 22  portes : ton appartement (6), le bistrot (13), l'opéra (41)
    'ƀƀ.ɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔ.ƀƀ', // 23
    'ƀƀ.ɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔ.ƀƀ', // 24
    'ƀƀ.ɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔ.ƀƀ', // 25
    'GGGGGGGGɔɔɔGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGɔɔɔGGGGGGGG', // 26  la Seine et ses deux ponts (8-10, 41-43)
    'GGGGGGGGɔɔɔGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGɔɔɔGGGGGGGG', // 27
    'GGGGGGGGɔɔɔGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGɔɔɔGGGGGGGG', // 28
    'GGGGGGGGɔɔɔGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGɔɔɔGGGGGGGG', // 29
    'ƀƀ......ɔɔɔ..............................ɔɔɔ......ƀƀ', // 30
    'ƀƀ......ɔɔɔ..............................ɔɔɔ......ƀƀ', // 31
    'ƀƀ......ɔɔɔ..............................ɔɔɔ......ƀƀ', // 32
    'ƀƀ.ɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔ.ƀƀ', // 33
    'ƀƀ.ɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔ.ƀƀ', // 34
    'ƀƀ.ɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔ.ƀƀ', // 35
    'ƀƀ.ɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔ.ƀƀ', // 36
    'ƀƀ.ɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔ.ƀƀ', // 37
    'ƀƀ.ɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔ.ƀƀ', // 38
    'ƀƀ.ɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔ.ƀƀ', // 39
    'ƀƀ.ɔɔɔɔɔDɔɔɔɔɔDɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔ...', // 40  portes : immeuble (8), café (14) ; rue sud ouverte à l'est (Toulon), rangées 40 à 45
    'ƀƀ.ɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔDɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔDɔɔɔɔɔɔ...', // 41  portes : Notre-Dame (25), l'entreprise (42)
    'ƀƀ.ɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔ', // 42
    'ƀƀ.ɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔ', // 43
    'ƀƀ.ɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔ', // 44
    'ƀƀ.....................................ɔ............', // 45
    'ƀƀƀƀƀƀƀƀƀƀƀƀƀƀƀƀƀƀƀƀƀƀƀƀƀƀƀƀƀƀƀƀƀƀƀƀƀƀƀƀƀƀƀƀƀƀƀƀƀƀƀƀ', // 46  bordure
    'ƀƀƀƀƀƀƀƀƀƀƀƀƀƀƀƀƀƀƀƀƀƀƀƀƀƀƀƀƀƀƀƀƀƀƀƀƀƀƀƀƀƀƀƀƀƀƀƀƀƀƀƀ', // 47
  ]),
  doors: [
    // Bercy (le grand dôme, en haut à gauche) : le concert, après le verre avec Hugues et Thomas.
    {
      x: 9, y: 11, interior: 'bercy',
      lock: { ifFlags: [FLAGS.verreBistro] },
      lockedDialogue: ['[Texte provisoire] Pas de concert ce soir à Bercy.'],
    },
    { x: 39, y: 9, lockedDialogue: ['[Texte provisoire] Le musée est fermé le lundi.'] },
    { x: 21, y: 14, lockedDialogue: ['[Texte provisoire] La file d\'attente du Louvre fait le tour de la cour. Une autre fois !'] },
    { x: 29, y: 14, lockedDialogue: ['[Texte provisoire] La file d\'attente du Louvre fait le tour de la cour. Une autre fois !'] },
    // Ton appartement (l'immeuble aux balcons fleuris) : après avoir dit au chef que tu emménages.
    {
      x: 6, y: 22, interior: 'parisAppart',
      lock: { ifFlags: [FLAGS.emmenagementParis] },
      lockedDialogue: ["[Texte provisoire] C'est ton futur appartement. Va d'abord manger au bistrot !"],
    },
    { x: 13, y: 22, interior: 'bistro' },   // le bistrot (le café à terrasse) : ta première mission à Paris
    { x: 41, y: 22, lockedDialogue: ["[Texte provisoire] L'Opéra est fermé jusqu'à ce soir."] },
    { x: 8, y: 40, lockedDialogue: NOT_HOME },
    { x: 14, y: 40, lockedDialogue: ['[Texte provisoire] Le café est complet ! Essaie le bistrot, de l\'autre côté de la Seine.'] },
    { x: 25, y: 41, lockedDialogue: ['[Texte provisoire] Notre-Dame est en travaux.'] },
    // L'entreprise (la tour de bureaux vitrée) : une fois l'offre trouvée sur l'ordinateur.
    {
      x: 42, y: 41, interior: 'entreprise',
      lock: { ifFlags: [FLAGS.rechercheTravail] },
      lockedDialogue: ["[Texte provisoire] Une grande entreprise. Tu n'as rien à y faire pour l'instant."],
    },
  ],
  // Les bâtiments sont dans le dessin (scripts/build_paris.py).
  buildings: [],
  events: [
    // À l'arrivée : ta première mission.
    {
      on: 'enter',
      unlessFlags: [FLAGS.repasParis, FLAGS.parisAccueil],
      steps: [
        { say: ['[Texte provisoire] Bienvenue à Paris !', "Première mission : aller manger au bistrot (le café à terrasse, à gauche, avant la Seine)."] },
        { setFlag: FLAGS.parisAccueil },
      ],
    },
  ],
  // Panneau « Aéroport » (dessiné) à côté de la sortie est.
  objects: [airportSign(45, 13, true)],
  triggers: [
    // Ouest : retour à Bordeaux par la route (arrivée dans la rue sud).
    ...[10, 11, 12, 13].map((y) => ({
      x: 0,
      y,
      readyDialogue: ['Tu reprends la route de Bordeaux.'],
      warp: { map: 'bordeaux', x: 30, y: 30, facing: 'left' },
    })),
    // Est : l'aéroport.
    ...[10, 11, 12, 13].map((y) => toAirport(51, y)),
    // Rue sud, vers l'est : Toulon, une fois la rupture conventionnelle acceptée.
    ...[40, 41, 42, 43, 44, 45].map((y) => ({
      x: 51,
      y,
      ifFlags: [FLAGS.ruptureConventionnelle],
      dialogue: ['[Texte provisoire] La route du sud... Tu as encore des choses à faire à Paris.'],
      readyDialogue: ['Tu prends la route du sud, direction Toulon et la mer !'],
      setFlags: [FLAGS.arriveeToulon],
      warp: { map: 'toulon', x: 1, y: 6, facing: 'right' },
    })),
  ],
  surroundings: { outside },
  spawn: { x: 1, y: 11, facing: 'right' },
};

// La grille du jeu : celle ci-dessus, accordée aux collisions du dessin.
parisMap.grid = builtGrid(parisMap.sourceGrid, BUILT);
