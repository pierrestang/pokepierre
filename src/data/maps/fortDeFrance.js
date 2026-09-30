import { parseGrid } from './parseGrid.js';
import { FLAGS, ITEMS } from '../story.js';

// Le ferry amarré au ponton : départ vers Saint-Ay une fois les souvenirs de la famille réunis.
const BOAT = {
  requiresSouvenirs: ['souvenir-maman', 'souvenir-papa', 'souvenir-manon'],
  dialogue: ["Tu n'es pas encore prêt à partir."],
  readyDialogue: ['Tu as réuni les souvenirs de ta famille.', 'Tu embarques sur le ferry pour Saint-Ay !'],
  setFlags: [FLAGS.departFortDeFrance],
  // Arrivée : au bord de l'étang de Saint-Ay, à côté de son bateau.
  warp: { map: 'saintAy', x: 11, y: 17, facing: 'left', ferry: true },   // traversée en ferry
};
const BOAT_POS = { x: 16, y: 27, w: 4, h: 2 };

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
  grid: parseGrid([
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
    'wøss.ɱɱɱɱ..f..ççç.ŦŦŦ....WDWW.ssww', // 14
    'wwss.ɱɱɱɱ.....ççç.ŦŦŦf.....ƫƫ.ssww', // 15
    'wwss.ɱɲɲɱ..ƨ..ççç.ŦŦŦ...ƀƒ.ƫƫ.ssww', // 16
    'wwss.ɱɲɲɱ.....ççç.ŦŦŦĥĥĥĥĥ.ƨ..ssww', // 17
    'wwwss.......ƚ.ççç....ĥĥĥĥƫƫ..sswww', // 18
    'wwwsss...ƫƫ...ççç....ĥĥĥĥƫƫ..sswww', // 19
    'wwwwsss..ƫƫf..ççç.f.ĥĥĥĥĥĥ..sswwøw', // 20
    'wwwwwsss..ƫƫƨ.ççç.ƨƫƫĥĥĥĥ.ssswwwww', // 21
    'wwwwwssss.ƫƫ..ççç..ƫƫ....sssswwwww', // 22
    'wwwwwwwss.ŕ...ççç......sssswwwwwww', // 23
    'wwwwwwwwsssssssssssssssssswwwwwwww', // 24
    'wwwwwøwwwwssss==sssssssswwwwwwwwww', // 25
    'wwwwwwwwwwwwww==wwwwwwwwwøwwwwwwww', // 26
    'wwwwwwwwwwwwww==BBBBwwwwwwwwøwwwww', // 27
    'wwwwwwwwwwwwww==BBBBwwwwwwwwwwwwww', // 28
    'wwwwwwwwwwwwww==wwwwwwwwwwwwwwwwww', // 29
    'wwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwww', // 30
    'wwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwww', // 31
    'wwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwww', // 32
  ]),
  doors: [
    { x: 15, y: 7, interior: 'ffHouse' },
    { x: 26, y: 14, interior: 'ffHut' },
  ],
  buildings: [
    { type: 'house', x: 14, y: 4 },
    { type: 'fishingHut', x: 25, y: 11 },
    { type: 'ferry', x: BOAT_POS.x, y: BOAT_POS.y },
  ],
  objects: [
    { x: 12, y: 12, dialogue: ['Fort-de-France — Martinique. Bienvenue sur l\'île !'] },
    { x: 17, y: 8, dialogue: ['La boîte aux lettres de la famille.', "Rien aujourd'hui… Peut-être une carte postale de Saint-Ay, un jour ?"] },
    { x: 19, y: 7, dialogue: ['Le drapeau rouge, vert et noir de la Martinique flotte au vent.'] },
    // Mémorial de l'Anse Caffard (Cap 110) : six statues de pierre blanche tournées vers la mer, en trois
    // rangées (une, deux, trois), au fond d'un petit plateau rocheux herbeux de 4 x 4 cases ; on monte
    // par l'escalier (blanc) jusqu'à l'herbe devant les statues.
    ...Array.from({ length: 8 }, (_, i) => ({
      x: 5 + (i % 4), y: 14 + Math.floor(i / 4),
      dialogue: [
        'Des statues de pierre blanche, tête baissée, regardent la mer.',
        "Mémorial de l'Anse Caffard : en souvenir des captifs du naufrage de 1830, au large du Diamant.",
      ],
    })),
    // Chaque case du bateau réagit quand on lui fait face (Entrée / Espace).
    ...Array.from({ length: BOAT_POS.w * BOAT_POS.h }, (_, i) => ({
      x: BOAT_POS.x + (i % BOAT_POS.w),
      y: BOAT_POS.y + Math.floor(i / BOAT_POS.w),
      ...BOAT,
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
    {
      id: 'pecheur', name: 'Pêcheur', x: 16, y: 25, facing: 'down', still: true,
      dialogue: ["Ça mord bien ce matin ! Tu vois ce ferry ? C'est lui qui t'emmènera à Saint-Ay.", 'Mais pas avant d\'avoir dit au revoir à ta famille, hein !'],
    },
  ],
  // Coquillage caché dans les hautes herbes, trouvé une seule fois.
  triggers: [
    {
      x: 7, y: 12, unlessFlags: [FLAGS.coquillageTrouve], setFlags: [FLAGS.coquillageTrouve],
      readyDialogue: ['Quelque chose brille entre les herbes…'], item: ITEMS.coquillageNacre,
    },
  ],
  // Autour de l'île, l'écran est rempli de mer.
  surroundings: 'w',
  spawn: { x: 15, y: 10, facing: 'down' },
};
