import { parseGrid } from './parseGrid.js';
import { FLAGS, ITEMS, TRAITS } from '../story.js';
import { FERRY, FISHER_AT_PIER_END, FISHER_AT_FERRY, MANON } from '../fortDeFranceStory.js';
// Le dessin de la carte : la version DS faite avec le créateur de cartes (scripts/convert_maps_v2.py, thème DS, puis
// retouches dans builder.html) ; ses collisions s'imposent à la grille du jeu (voir builtGrid). La grille et les
// bâtiments d'origine restent la source de la conversion (sourceGrid, sourceBuildings).
import BUILT from '../builtMaps/fort-de-france.json' with { type: 'json' };
import { builtGrid } from './builtGrid.js';

// Le ferry amarré au ponton : départ vers Saint-Ay une fois tout réuni (voir data/fortDeFranceStory.js).
const BOAT_POS = { x: 17, y: 27, w: 4, h: 2 };   // une case d'eau entre le ponton et le ferry

// Fort-de-France — île ronde de départ, bordée de plages, 34 x 33 cases : maison familiale et son jardin fleuri en
// haut, allée de sable (3 cases, centrée sur la porte) jusqu'à la plage, puis ponton en bois (2 cases) jusqu'au ferry, cabane de pêche
// à droite, deux grands sapins isolés (on peut passer derrière) deux grands arbres feuillus (dont un à gauche
// de la maison) et des arbres tropicaux à racines, sur la plage et dans l'herbe, hautes herbes aux formes arrondies,
// buissons et fleurs, rochers dans la mer, drapeau de la Martinique à droite de la maison ; en bas à gauche,
// les six statues du mémorial de l'Anse Caffard (Cap 110), en trois rangées tournées vers la mer.
// Légende : voir src/data/tiles.js (w = mer, s = sable, ĥ = hautes herbes, ƀ = buisson, ç = pavés,
// ƒ = petites fleurs, ŕ = rocher, ø = rocher dans la mer, T = grand arbre, = = ponton, B = ferry,
// ƫ = arbre tropical, ƚ = petit arbre, ƨ = plante à baies fleurie, ɱ / ɲ = plateau du mémorial de l'Anse Caffard (bloquant / praticable), Ŧ = grand arbre feuillu, ɸ = drapeau de la Martinique)
export const fortDeFranceMap = {
  id: 'fortDeFrance',
  name: 'Fort-de-France',
  built: BUILT,
  sourceGrid: parseGrid([
    'wwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwww', // 0
    'wwwwwwwwwwwwwwsssssswwwwwwwwwwwwww', // 1
    'wwwwwwwwwwsssssssssssssswwwwwwwwww', // 2
    'wwøwwwwwsssssss....ssssssswwwwwwww', // 3
    'wwwwwwwss.....RRRRR....sssswwwwøww', // 4
    'wwwwwsss......RRRRR.f....sssswwwww', // 5
    'wwwwwss..ŦŦŦ..WWWWWƒ.fƫƫ..ssswwwww', // 6
    'wwwwsss..ŦŦŦ..WDWWWɸ..ƫƫ..fssswwww', // 7
    'wwwsss...ŦŦŦ..çççM..........ssswww', // 8
    'wwwss....ŦŦŦƨ.ççç.fƒƀ...ƨ....sswww', // 9
    'wwsss.TT......ççç..ƀ.f.......sssww', // 10
    'wwss..TT.f....ççç...ƀ....RRRR.ssww', // 11
    'wwss..ĥĥĥƚ..S.ççç...TT...RRRR.ssww', // 12
    'wwss.ĥĥĥĥ.....ççç...TT...WWWW.ssww', // 13
    'wøss.ɱɱɱɱ..f..ççç........WDWW.ssww', // 14
    'wwss.ɱɱɱɱ.....ççç.ŦŦŦf.....ƫƫ.ssww', // 15
    'wwss.ɱɲɲɱ..ƨ..ççç.ŦŦŦ...ƀƒ.ƫƫ.ssww', // 16
    'wwss.ɱɲɲɱ.....ççç.ŦŦŦ.ĥĥ...ƨ..ssww', // 17
    'wwwss.......ƚ.ççç.ŦŦŦĥĥĥĥƫƫ..sswww', // 18
    'wwwsss...ƫƫ...ççç....ĥĥĥĥƫƫ..sswww', // 19
    'wwwwsss..ƫƫf..ççç.f.ĥ.ĥĥĥĥ..sswwøw', // 20
    'wwwwwsss..ƨƫƫ.ççç.ƨƫƫ..ĥĥ.ssswwwww', // 21
    'wwwwwssss..ƫƫ.ççç..ƫƫ....sssswwwww', // 22
    'wwwwwwwss.ŕ...ççç......sssswwwwwww', // 23
    'wwwwwwwwsssssssssssssssssswwwwwwww', // 24
    'wwwwwøwwwwssss==sssssssswwwwwwwwww', // 25
    'wwwwwwwwwwwwww==wwwwwwwwwøwwwwwwww', // 26
    'wwwwwwwwwwwwww==wBBBBwwwwwwwøwwwww', // 27
    'wwwwwwwwwwwwww==wBBBBwwwwwwwwwwwww', // 28
    'wwwwwwwwwwwwww==wwwwwwwwwwwwwwwwww', // 29
    'wwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwww', // 30
    'wwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwww', // 31
    'wwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwww', // 32
  ]),
  doors: [
    { x: 15, y: 7, interior: 'ffHouse' },
    { x: 26, y: 14, interior: 'ffHut' },
  ],
  // Les bâtiments (maison, cabane, ferry) sont dans le dessin ; la liste d'origine sert à la conversion.
  buildings: [],
  sourceBuildings: [
    { type: 'house', x: 14, y: 4 },
    { type: 'fishingHut', x: 25, y: 11 },
    { type: 'ferry', x: BOAT_POS.x, y: BOAT_POS.y },
  ],
  objects: [
    { x: 12, y: 12, dialogue: ['Fort-de-France — Martinique. Bienvenue sur l\'île !'] },
    { x: 17, y: 8, dialogue: ['La boîte aux lettres de la famille.', "Rien aujourd'hui… Peut-être une carte postale de Saint-Ay, un jour ?"] },
    // Mémorial de l'Anse Caffard (Cap 110) : six statues de pierre blanche tournées vers la mer, en trois
    // rangées (une, deux, trois), au fond d'un petit plateau rocheux herbeux de 4 x 4 cases ; on monte
    // par l'escalier (blanc) jusqu'à l'herbe devant les statues.
    ...Array.from({ length: 8 }, (_, i) => ({
      x: 5 + (i % 4), y: 14 + Math.floor(i / 4),
      dialogue: ["Mémorial de l'Anse Caffard. En mémoire des captifs morts en 1830 et des victimes de l'esclavage."],
    })),
    // Chaque case du bateau réagit quand on lui fait face (Entrée / Espace), et aussi l'eau entre le ponton
    // et le ferry, pour embarquer depuis le ponton.
    ...Array.from({ length: (BOAT_POS.w + 1) * BOAT_POS.h }, (_, i) => ({
      x: BOAT_POS.x - 1 + (i % (BOAT_POS.w + 1)),
      y: BOAT_POS.y + Math.floor(i / (BOAT_POS.w + 1)),
      script: FERRY,
    })),
  ],
  npcs: [
    // Habitants de l'île (sans rôle dans l'histoire).
    {
      id: 'promeneuse', name: 'Promeneuse', x: 9, y: 15, facing: 'left',
      dialogue: [
        'Je viens souvent ici, devant les statues.',
        'Elles regardent vers le large… On ne doit pas oublier ceux qui ne sont jamais arrivés.',
      ],
    },
    {
      id: 'gamin', name: 'Gamin', x: 21, y: 23, facing: 'down',
      dialogue: [
        "J'ai vu des poissons sauter près des rochers !",
        'Un jour, moi aussi je prendrai le ferry. Toi, tu pars quand ?',
      ],
    },
    // Manon attend devant la maison (quête du coquillage, voir data/fortDeFranceStory.js).
    {
      id: 'manon', name: 'Manon', x: 13, y: 9, facing: 'right', color: 0xf0a030,
      unlessFlags: [FLAGS.departFortDeFrance],
      script: MANON,
    },
    // Le capitaine du ferry (l'ancien pêcheur) : au bout du ponton, puis devant le ferry avec sa canne cassée une
    // fois la scène de Papa terminée (voir data/fortDeFranceStory.js).
    {
      id: 'pecheur', name: 'Capitaine du ferry', x: 15, y: 29, facing: 'down', still: true,
      unlessFlags: [FLAGS.papaFait],
      script: FISHER_AT_PIER_END,
    },
    {
      id: 'pecheur', name: 'Capitaine du ferry', x: 15, y: 27, facing: 'up', still: true,
      ifFlags: [FLAGS.papaFait],
      script: FISHER_AT_FERRY,
    },
  ],
  // En sortant de la maison pour la première fois, Manon vient te parler.
  events: [
    {
      on: 'enter',
      ifFlags: [FLAGS.journeeLancee],
      unlessFlags: [FLAGS.manonDemande, FLAGS.departFortDeFrance],
      steps: [{ talk: 'manon' }],
    },
  ],
  // Guirlande de fanions (art/bunting.js) du faîte du toit au haut du mât, et le long de l'avant-toit : elle apparaît
  // quand Pierre reçoit la Joie de vivre (la danse avec Maman, voir data/fortDeFranceStory.js). Points en pixels.
  decals: [{
    kind: 'fanions', x: 15, y: 6, ifSouvenirs: [TRAITS.joie.id],
    cords: [[262, 47, 309, 58, 7], [206, 90, 290, 90, 2, 17]],
  }],
  // Autour de l'île, l'écran est rempli de mer.
  surroundings: 'w',
  spawn: { x: 15, y: 10, facing: 'down' },
};

// Quête de Manon : le coquillage est caché dans une touffe du petit pré près des statues ; on le trouve en marchant
// dessus.
fortDeFranceMap.triggers = [{
  x: 7, y: 12, ifFlags: [FLAGS.manonDemande], unlessFlags: [FLAGS.coquillageTrouve],
  script: [
    { sound: 'rustle' },
    { say: ['Quelque chose brille entre les herbes…'] },
    { give: ITEMS.coquillageNacre, text: 'Tu trouves un coquillage nacré !' },
    { say: ['Manon attend sûrement de le voir.'] },
    { setFlag: FLAGS.coquillageTrouve },
  ],
}];

// La grille du jeu : celle d'origine, accordée aux collisions du dessin.
fortDeFranceMap.grid = builtGrid(fortDeFranceMap.sourceGrid, BUILT);
