import { parseGrid } from './parseGrid.js';
// Le dessin de la carte : la version Gen 4 faite avec le créateur de cartes (scripts/convert_maps_v2.py, thème Gen 4,
// scripts/g4_theme.py) ; ses collisions s'imposent à la grille du jeu (voir builtGrid). La grille et les bâtiments
// d'origine restent la source de la conversion (sourceGrid, sourceBuildings).
import BUILT from '../builtMaps/bonsecours.json' with { type: 'json' };
import { builtGrid } from './builtGrid.js';
import { FLAGS, carryText } from '../story.js';
import { COLLEGE_ARRIVAL } from '../collegeStory.js';

// Bonsecours, le village d'à côté — entre Montépilloy (au sud) et le Prytanée (au nord), 24 x 30 cases : la route
// (x 11-12 sur la carte redessinée) traverse la cour du collège Bonsecours (clôture, portails au sud et au nord). Pierre
// y arrive à pied par le sud (voir data/collegeStory.js). Au bout, deux militaires barrent la route du Prytanée tant que
// Pierre n'a pas son brevet ; ensuite l'un d'eux s'écarte et lui annonce que les portes du Prytanée sont ouvertes.
// Légende : voir src/data/tiles.js (ç = chemin, F = clôture, ĥ = hautes herbes, ŕ = rocher)
const GUARD = { name: 'Militaire', color: 0x3c5c2c, facing: 'down', unlessFlags: [FLAGS.bonsecoursFini] };
const GUARD_LINES = ["Halte ! La route du Prytanée est réservée aux candidats. Reviens avec ton diplôme du brevet."];

export const routeBonsecoursMap = {
  id: 'routeBonsecours',
  name: 'Bonsecours',
  built: BUILT,
  sourceGrid: parseGrid([
    'TTTTTTTTTTççTTTTTTTTTTTT', // 0  nord : le Prytanée (gardé tant que la quête Bonsecours n'est pas finie)
    'TTTTTTTTTTççTTTTTTTTTTTT', // 1
    'TTTTTTTT..ççççççççĥĥ..TT', // 2
    'TTTTTTTT..ççççççççĥf..TT', // 3
    'TTTT............ççTTĥ.TT', // 4
    'TTTT...ĥ.......ĥççTTĥ.TT', // 5
    'TT.f............ççĥĥf.TT', // 6
    'TT..FFFFFFFFFFFFççFF..TT', // 7  cour du collège (clôture blanche, portails nord et sud)
    'TT..FƀRRRRRRRƀ..ççƀF..TT', // 8  collège Bonsecours
    'TT..F.RRRRRRR...çç.F..TT', // 9
    'TT..F.WWWDWWW...çç.F..TT', // 10
    'TT..F.WWW.WWWS..çç.F..TT', // 11
    'TT..F.çççççççççççç.F..TT', // 12  allée devant le collège
    'TT..F.çççççççççççç.F..TT', // 13
    'TT..Fffff.çç.......F..TT', // 14
    'TT..Fffff.çç.fff..ƀF..TT', // 15
    'TT..Fffff.çç.fff...F..TT', // 16
    'TT..FFFFFFççFFFFFFFF..TT', // 17
    'TTTT.ĥf...çç......TT..TT', // 18
    'TTTTĥĥ.ŕ..çç....ĥ.TT..TT', // 19
    'TTTTTT....çç....ĥ.TT..TT', // 20
    'TTTTTTĥ.f.çç....ĥ.TT..TT', // 21
    'TT.ĥĥĥĥ...çç.....f....TT', // 22
    'TT.ĥĥĥĥĥ..çç.......ŕ..TT', // 23
    'TT...ĥĥĥĥĥçç..TTTT....TT', // 24
    'TT.ŕĥĥ.ĥĥĥçç..TTTT....TT', // 25
    'TT..ĥĥ.ĥĥ.ççS.f....f..TT', // 26
    'TT........çç..........TT', // 27
    'TTTTTTTTTTççTTTTTTTTTTTT', // 28  sud : Montépilloy
    'TTTTTTTTTTççTTTTTTTTTTTT', // 29
  ]),
  doors: [
    { x: 9, y: 10, interior: 'bonsecours' },
  ],
  // Les bâtiments sont dans le dessin ; la liste d'origine sert à la conversion.
  buildings: [],
  sourceBuildings: [
    { type: 'lab', x: 6, y: 8 },
  ],
  npcs: [
    { ...GUARD, id: 'sentinelle-1', x: 11, y: 2, dialogue: GUARD_LINES },
    { ...GUARD, id: 'sentinelle-2', x: 12, y: 2, dialogue: GUARD_LINES },
    // Le brevet en poche : un militaire s'est écarté sur le bas-côté et laisse passer.
    {
      id: 'militaire-ouvert', name: 'Militaire', x: 13, y: 2, facing: 'left', color: 0x3c5c2c,
      ifFlags: [FLAGS.bonsecoursFini],
      dialogue: ['Ton brevet ? Garde-à-vous… C\'est en règle.', 'Les portes du Prytanée te sont ouvertes. Droit devant, et tiens-toi bien !'],
    },
  ],
  objects: [
    { x: 13, y: 11, dialogue: ['Collège Bonsecours.'] },
    { x: 12, y: 26, dialogue: ['Route de Bonsecours — Sud : Montépilloy. Nord : Prytanée.'] },
  ],
  // Premier jour : Pierre arrive par la route du sud (image d'accueil ; le surveillant l'attend dans le hall).
  events: [{ on: 'enter', ifFlags: [FLAGS.departCollege], unlessFlags: [FLAGS.collegeOuverture], steps: COLLEGE_ARRIVAL }],
  triggers: [
    // Sud : retour à Montépilloy.
    ...[11, 12].map((x) => ({ x, y: 29, warp: { map: 'montepilloy', x: 16, y: 1, facing: 'down' } })),
    // Nord : le Prytanée, une fois la quête Bonsecours finie ; au premier départ, l'encart des vertus emportées, comme
    // à la fin des trajets.
    ...[11, 12].map((x) => ({
      x,
      y: 0,
      script: [
        { unlessFlags: [FLAGS.bonsecoursFini], say: GUARD_LINES, end: true },
        { say: ['Ton brevet en poche, tu prends la route du Prytanée pour y candidater.'] },
        { unlessFlags: [FLAGS.arriveePrytanee], say: [carryText('routeBonsecours')] },
        { setFlag: FLAGS.arriveePrytanee },
        { travel: { map: 'prytanee', x: 16, y: 24, facing: 'up' } },
      ],
    })),
  ],
  surroundings: 'T',
  spawn: { x: 11, y: 27, facing: 'up' },
};

// La grille du jeu : celle d'origine, accordée aux collisions du dessin.
routeBonsecoursMap.grid = builtGrid(routeBonsecoursMap.sourceGrid, BUILT);
