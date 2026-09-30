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
const BOAT_POS = { x: 14, y: 25, w: 4, h: 2 };

// Fort-de-France — île ronde de départ, bordée de larges plages, 30 x 31 cases : maison familiale et son jardin fleuri en
// haut, allée de sable (3 cases, centrée sur la porte) jusqu'à la plage, puis ponton en bois (2 cases) jusqu'au ferry, cabane de pêche
// à droite, trois grands sapins isolés (on peut passer derrière) et deux grands arbres feuillus (dont un à gauche
// de la maison), hautes herbes aux formes arrondies,
// buissons et fleurs, rochers dans la mer, drapeau de la Martinique à droite de la maison ; en bas à gauche,
// les six statues du mémorial de l'Anse Caffard (Cap 110), en trois rangées tournées vers la mer.
// Légende : voir src/data/tiles.js (w = mer, s = sable, ĥ = hautes herbes, ƀ = buisson, ç = pavés,
// ƒ = petites fleurs, ŕ = rocher, ø = rocher dans la mer, T = grand arbre, = = ponton, B = ferry,
// ɱ / ɲ = plateau du mémorial de l'Anse Caffard (bloquant / praticable), Ŧ = grand arbre feuillu, ɸ = drapeau de la Martinique)
export const fortDeFranceMap = {
  id: 'fortDeFrance',
  name: 'Fort-de-France',
  grid: parseGrid([
    'wwwwwwwwwwwwwwwwwwwwwwwwwwwwww', // 0
    'wwwwwwwwwwwwwwwwwwwwwwwwwwwwww', // 1
    'wwwwwwwwwwsssssssssswwwwwwwwww', // 2
    'wwøwwwwwsssssssssssssswwwwwwww', // 3
    'wwwwwwssss..RRRRR...sssswwwøww', // 4
    'wwwwwsssŦŦŦ.RRRRR.f.ssssswwwww', // 5
    'wwwwssssŦŦŦ.WWWWWƒ.f.ssssswwww', // 6
    'wwwwssssŦŦŦ.WDWWWɸ....f.sswwww', // 7
    'wwwssss.ŦŦŦ.çççM....TT..ssswww', // 8
    'wwwsss...f.ƒççç.fƒƀ.TT..ssswww', // 9
    'wwwsssTT....ççç..ƀ.f....ssswww', // 10
    'wwsss.TT.f.Sççç...ƀ..RRRRsssww', // 11
    'wwsss.ĥĥĥ...ççç...TT.RRRRsssww', // 12
    'wwss.ĥĥĥĥ...ççç...TT.WWWWsssww', // 13
    'wøss.ɱɱɱɱ..fççç.ŦŦŦ..WDWWsssww', // 14
    'wwws.ɱɱɱɱ...ççç.ŦŦŦf....ssswww', // 15
    'wwws.ɱɲɲɱ.TTççç.ŦŦŦ.ƀƒ.sssswww', // 16
    'wwws.ɱɲɲɱ.TTççç.ŦŦŦĥĥĥssssswww', // 17
    'wwws.......fççç.f.ĥĥĥĥsssswwøw', // 18
    'wwwssssssssssssssssĥĥssssswwww', // 19
    'wwwwwssssssssssssssŕssssswwwww', // 20
    'wwwwwwssssŕssssssssssssswwwwww', // 21
    'wwwwwwwwsssssssssssssswwwwwwww', // 22
    'wwwwwøwwwwss==sswwwwwwwwwwwwww', // 23
    'wwwwwwwwwwww==wwwwwwwøwwwwwwww', // 24
    'wwwwwwwwwwww==BBBBwwwwwwøwwwww', // 25
    'wwwwwwwwwwww==BBBBwwwwwwwwwwww', // 26
    'wwwwwwwwwwww==wwwwwwwwwwwwwwww', // 27
    'wwwwwwwwwwwwwwwwwwwwwwwwwwwwww', // 28
    'wwwwwwwwwwwwwwwwwwwwwwwwwwwwww', // 29
    'wwwwwwwwwwwwwwwwwwwwwwwwwwwwww', // 30
  ]),
  doors: [
    { x: 13, y: 7, interior: 'ffHouse' },
    { x: 22, y: 14, interior: 'ffHut' },
  ],
  buildings: [
    { type: 'house', x: 12, y: 4 },
    { type: 'fishingHut', x: 21, y: 11 },
    { type: 'ferry', x: BOAT_POS.x, y: BOAT_POS.y },
  ],
  objects: [
    { x: 11, y: 11, dialogue: ['Fort-de-France — Martinique. Bienvenue sur l\'île !'] },
    { x: 15, y: 8, dialogue: ['La boîte aux lettres de la famille.', "Rien aujourd'hui… Peut-être une carte postale de Saint-Ay, un jour ?"] },
    { x: 17, y: 7, dialogue: ['Le drapeau rouge, vert et noir de la Martinique flotte au vent.'] },
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
      id: 'gamin', name: 'Gamin', x: 19, y: 21, facing: 'down',
      dialogue: [
        "J'ai vu des poissons sauter près des rochers !",
        'Un jour, moi aussi je prendrai le ferry. Toi, tu pars quand ?',
      ],
    },
    {
      id: 'pecheur', name: 'Pêcheur', x: 14, y: 23, facing: 'down', still: true,
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
  spawn: { x: 13, y: 10, facing: 'down' },
};
