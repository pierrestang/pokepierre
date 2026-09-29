import { parseGrid } from './parseGrid.js';
import { FLAGS } from '../story.js';

const BOAT_POS = { x: 8, y: 17, w: 3, h: 2 };

// Saint-Ay — 24 x 20 cases (calqué sur la disposition de Rouge Feu).
// Légende : voir src/data/tiles.js
export const saintAyMap = {
  id: 'saintAy',
  name: 'Saint-Ay',
  grid: parseGrid([
    'TTTTTTTTTTTTPPTTTTTTTTTT', // 0  sortie nord vers la route
    'TTTTTTTTTTTTPPTTTTTTTTTT', // 1
    'TTPPPPPPPPPPPPPPPPPPPPTT', // 2
    'TTP........P........PPTT', // 3  pelouses des maisons
    'TTP..RRRRR.P..RRRRR.PPTT', // 4  toits
    'TTP..RRRRR.P..RRRRR.PPTT', // 5
    'TTP..WWWWW.P..WWWWW.PPTT', // 6  murs
    'TTP.MWDWWW.P.MWDWWW.PPTT', // 7  boîtes aux lettres + portes
    'TTP........P........PPTT', // 8
    'TTPPPPPPPPPPPPPPPPPPPPTT', // 9
    'TTPP.......PPRRRRRRRPPTT', // 10 jardin / toit de l'hôpital
    'TTPP.FFFFS.PPRRRRRRRPPTT', // 11 clôture + panneau
    'TTPP.ffff..PPWWWWWWWPPTT', // 12 fleurs / murs de l'hôpital
    'TTPP.ffff..PPWWWDWWWPPTT', // 13 porte de l'hôpital
    'TTPP.S.....PPPPPPPPPPPTT', // 14 panneau du jardin
    'TTPPPPPPPPPP..........TT', // 15 pelouse du bas
    'TTPPPPPPPPPP.FFFSFF...TT', // 16 clôture + panneau
    'TTPPPPP~BBBP..........TT', // 17 étang + bateau
    'TTPPPPP~BBBPPPPPPPPPPPTT', // 18
    'TTTTTTT~~~~TTTTTTTTTTTTT', // 19
  ]),
  // Portes -> intérieur. Au retour, le joueur réapparaît sous la porte.
  doors: [
    { x: 6,  y: 7,  interior: 'playerHouse' },
    {
      x: 15, y: 7, interior: 'felixHouse',
      lock: { ifFlags: [FLAGS.felixInvite] },
      lockedDialogue: ['[Texte provisoire] Personne ne répond...'],
    },
    {
      x: 16, y: 13, interior: 'hospital',
      lock: { ifFlags: [FLAGS.familleSuit] },
      lockedDialogue: ["[Texte provisoire] L'hôpital... Ce n'est pas encore le moment d'entrer."],
    },
  ],
  // Dessin des bâtiments (coin haut-gauche, en cases) ; la collision reste dans la grille.
  buildings: [
    { type: 'house', x: 5,  y: 4 },
    { type: 'house', x: 14, y: 4 },
    { type: 'hospital', x: 13, y: 10 },
    { type: 'boat', x: BOAT_POS.x, y: BOAT_POS.y },
  ],
  // Le bateau de l'étang ramène à Fort-de-France (face au bateau + Entrée).
  objects: Array.from({ length: BOAT_POS.w * BOAT_POS.h }, (_, i) => ({
    x: BOAT_POS.x + (i % BOAT_POS.w),
    y: BOAT_POS.y + Math.floor(i / BOAT_POS.w),
    readyDialogue: ['Tu reprends le bateau pour Fort-de-France.'],
    warp: { map: 'fortDeFrance', x: 10, y: 16, facing: 'up' },
  })),
  // Felix attend à la sortie de l'hôpital ; après son invitation, il te suit jusqu'à chez lui.
  npcs: [
    {
      id: 'felix', name: 'Felix', x: 17, y: 14, facing: 'left', color: 0x9060d0,
      ifFlags: [FLAGS.familleArrivee],
      unlessFlags: [FLAGS.felixInvite],
      dialogue: [
        "[Felix - texte provisoire] Salut ! Moi c'est Felix. Je viens d'emménager avec ma famille.",
        'On habite dans la maison 2, en haut à droite. Viens nous rendre visite !',
      ],
      souvenir: { id: 'souvenir-felix', name: 'Souvenir de Felix' },
    },
  ],
  // En sortant de l'hôpital : Felix vient te parler.
  events: [
    {
      on: 'enter',
      ifFlags: [FLAGS.familleArrivee],
      unlessFlags: [FLAGS.felixInvite],
      steps: [{ talk: 'felix' }, { setFlag: FLAGS.felixInvite }],
    },
  ],
  // Sortie nord : la route de Montépilloy, une fois tout fini à Saint-Ay (visite chez Felix).
  triggers: [12, 13].map((x) => ({
    x,
    y: 0,
    ifFlags: [FLAGS.maisonFelixVisitee],
    dialogue: ["[Texte provisoire] Tu as encore des choses à faire à Saint-Ay."],
    readyDialogue: ['Tu prends la route de Montépilloy.'],
    setFlags: [FLAGS.arriveeMontepilloy],
    warp: { map: 'montepilloy', x: 11, y: 22, facing: 'up' },
  })),
  spawn: { x: 6, y: 8, facing: 'down' },
};
