import { parseGrid } from './parseGrid.js';
// Le dessin de la carte : Paris en Gen 4 (scripts/build_paris.py, thème « Paris (monuments et cafés) » du catalogue) ;
// ses collisions s'imposent à la grille du jeu (voir builtGrid). La grille ci-dessous (sourceGrid) suit ce dessin :
// avenue, pavés, jardin, Seine, ponts, portes (sur les portes dessinées).
import BUILT from '../builtMaps/paris.json' with { type: 'json' };
import { builtGrid } from './builtGrid.js';
import { FLAGS, ITEMS } from '../story.js';
import { CLARA, HUGUES_CALL, HUGUES_MESSAGE, INES, INTO_THE_DREAM, LANDLORD, MALIK } from '../parisStory.js';
import { toAirport, airportSign } from './airportLinks.js';

// Hors de la carte : la Seine, l'avenue et la rue sud se prolongent ; des arbres ailleurs.
function outside(x, y, grid) {
  if (y >= 0 && y < grid.length) {
    const edge = grid[y][x < 0 ? 0 : grid[0].length - 1];
    if (['G', 'ɐ', 'ɔ'].includes(edge)) return edge;
  }
  return 'ƀ';
}

const NOT_HOME = ['Tu frappes. Personne ne répond.'];

// Paris — 52 x 48 cases avec sa bordure d'arbres (premier jet de scripts/build_paris.py, retouché à la main dans le
// créateur). Au nord : le grand dôme (Bercy), le Louvre et son drapeau, le musée-gare ; l'avenue les traverse (ouest :
// Bordeaux, est : l'aéroport). Puis ton studio (l'immeuble aux balcons fleuris), le café à terrasse, le jardin au
// bassin, l'opéra. La Seine, deux yachts, deux ponts. Au sud : un immeuble crème, le café au store rayé, Notre-Dame, la
// tour de bureaux vitrée (ton travail). Le trajet : du studio à la tour, par le pont de gauche
// (voir parisStory.js).
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
    // Bercy (le grand dôme) : le concert, avec la place que Clara a rendue (parisStory.js CONCERT).
    {
      x: 9, y: 11, interior: 'bercy',
      lock: { ifItems: [ITEMS.placeConcert.id] },
      lockedDialogue: ['Bercy. Ce soir, il y a un concert… mais sans place, on ne rentre pas.'],
    },
    { x: 39, y: 9, lockedDialogue: ['Le musée est fermé le lundi.'] },
    { x: 21, y: 14, lockedDialogue: ['La file d\'attente du Louvre fait le tour de la cour. Une autre fois.'] },
    { x: 29, y: 14, lockedDialogue: ['La file d\'attente du Louvre fait le tour de la cour. Une autre fois.'] },
    // Ton studio (l'immeuble aux balcons fleuris) : avec les clés du propriétaire.
    {
      x: 6, y: 22, interior: 'parisAppart',
      lock: { ifItems: [ITEMS.clesParis.id] },
      lockedDialogue: ['La porte de l\'immeuble est fermée à clé.'],
    },
    { x: 13, y: 22, lockedDialogue: ['Le café à terrasse. Tu n\'as jamais le temps de t\'y asseoir.'] },
    { x: 41, y: 22, lockedDialogue: ['L\'Opéra est fermé jusqu\'à ce soir.'] },
    // L'immeuble crème : chez Hugues, le soir du match (avec Thomas et de quoi manger).
    { x: 8, y: 40, interior: 'huguesAppart', lock: { ifFlags: [FLAGS.thomasSuit] }, lockedDialogue: NOT_HOME },
    // Le restaurant au store rayé : Thomas y travaille ; on y entre le soir du match.
    {
      x: 14, y: 40, interior: 'bistro',
      lock: { ifFlags: [FLAGS.messageHugues] },
      lockedDialogue: ['Le restaurant au store rayé est complet.'],
    },
    { x: 25, y: 41, lockedDialogue: ['Notre-Dame est en travaux.'] },
    // La tour de bureaux vitrée : ton travail, une fois installé.
    {
      x: 42, y: 41, interior: 'entreprise',
      lock: { ifFlags: [FLAGS.parisCles] },
      lockedDialogue: ['Une grande tour de bureaux. Le badge à l\'entrée ne te laisse pas passer.'],
    },
  ],
  // Les bâtiments sont dans le dessin (scripts/build_paris.py).
  buildings: [],
  // La grande porte de Notre-Dame, sous l'arche (le dessin n'a qu'une ouverture noire) : posée sur les deux rangées
  // au-dessus de la porte du jeu (25, 41), l'image descend d'une case pour couvrir toute l'ouverture.
  props: [{ type: 'porte', image: 'porte-notre-dame', x: 24, y: 39, w: 3, h: 2, dy: 16 }],
  npcs: [
    // Le propriétaire, devant l'immeuble.
    // Le propriétaire, juste devant l'immeuble aux balcons fleuris : Pierre doit le trouver (il ne vient pas à lui).
    { id: 'proprietaire', name: 'Propriétaire', sprite: 'g35', x: 7, y: 23, facing: 'down', script: LANDLORD },
    // La place de concert, de main en main (parisStory.js) : Inès devant l'Opéra, Malik dans la file du Louvre, Clara
    // au café à terrasse.
    { id: 'ines', name: 'Inès', x: 39, y: 23, facing: 'right', script: INES },
    // La file du Louvre, devant sa porte de gauche (21, 14).
    { id: 'file-louvre-1', name: 'Touriste', sprite: 'g21', x: 20, y: 15, facing: 'right', still: true, dialogue: ['La file avance… doucement. Très doucement.'] },
    { id: 'malik', name: 'Malik', x: 19, y: 15, facing: 'right', script: MALIK },
    { id: 'file-louvre-2', name: 'Touriste', sprite: 'g34', x: 18, y: 15, facing: 'right', still: true, dialogue: ['On m\'a dit vingt minutes. Ça fait une heure.'] },
    { id: 'clara', name: 'Clara', x: 15, y: 23, facing: 'left', script: CLARA },
  ],
  events: [
    // En sortant de la tour la première fois : Hugues appelle (la place de concert) ; promu : son message (le match).
    { on: 'enter', ifFlags: [FLAGS.jour1Bureau], unlessFlags: [FLAGS.concertAppel], steps: HUGUES_CALL },
    { on: 'enter', ifFlags: [FLAGS.promotionParis], unlessFlags: [FLAGS.messageHugues], steps: HUGUES_MESSAGE },
    // En sortant de la tour, la Liberté choisie : le rêve.
    { on: 'enter', ifFlags: [FLAGS.liberteParis], unlessFlags: [FLAGS.reveParis], steps: INTO_THE_DREAM },
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
    // Rue sud, vers l'est : elle continue dans Paris, sans rien pour Pierre.
    ...[40, 41, 42, 43, 44, 45].map((y) => ({ x: 51, y, dialogue: ['La rue continue vers d\'autres quartiers. Rien à faire par là.'] })),
  ],
  surroundings: { outside },
  spawn: { x: 1, y: 11, facing: 'right' },
};

// La grille du jeu : celle ci-dessus, accordée aux collisions du dessin.
parisMap.grid = builtGrid(parisMap.sourceGrid, BUILT);
