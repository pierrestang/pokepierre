import { parseGrid } from './parseGrid.js';
import { FLAGS } from '../story.js';
import {
  ELLIPSIS, HIDE_AND_SEEK, FOUND_MARGAUX, FOUND_ETIENNE, BOULY, SEPTEMBER_MORNING, SCHOOL_BUS, NORTH_EXIT,
} from '../montepilloyStory.js';

// Montépilloy (Oise) — village de campagne façon Rouge Feu, 32 x 26 cases. Chemins de terre de deux cases : la
// grand-rue nord-sud (le collège au nord, Saint-Ay au sud), la rue des maisons et la rue de l'école. Les maisons
// bordent la grand-rue de chaque côté : la famille à gauche, la voisine à droite, l'école à droite en dessous. À
// gauche, la ferme de M. Bouly, un enclos rectangulaire à clôture blanche ouvert à droite sur la grand-rue (deux
// cases, panneau juste à l'intérieur) : la grange (toit orange de Rubis/Saphir, tonneaux à l'intérieur) et le
// tracteur, le chemin de l'entrée devant la grange, puis le champ de blé. À droite, sous la rue de l'école, la
// prairie aux hautes herbes et la mare. Ceinture d'arbres. Scénario : voir data/montepilloyStory.js.
// Légende : voir src/data/tiles.js (ç = chemin de terre, ~ = mare, ʬ = blé, F = clôture, T = arbre (blocs de
// 2 x 2), ƀ = buisson, f = fleurs, ĥ = hautes herbes, S = panneau, M = boîte aux lettres, R / W / D = toit, mur,
// porte des bâtiments)
export const montepilloyMap = {
  id: 'montepilloy',
  name: 'Montépilloy',
  grid: parseGrid([
    'TTTTTTTTTTTTTTççTTTTTTTTTTTTTTTT', // 0
    'TTTTTTTTTTTTTTççTTTTTTTTTTTTTTTT', // 1
    'TTTT.........Sçç..............TT', // 2
    'TTTT....RRRRR.çç.RRRRR........TT', // 3
    'TT...ff.RRRRR.çç.RRRRR.ff.....TT', // 4
    'TT.ƀ.ff.WWWWW.çç.WWWWW.ff.....TT', // 5
    'TT.....MWDWWW.çç.WDWWWM.......TT', // 6
    'TT....çççççççççççççççççç...ƀ..TT', // 7
    'TT....çççççççççççççççççç......TT', // 8
    'TT............çç..............TT', // 9
    'TTFFFFFFFFFFFFçç.RRRRR..TT..TTTT', // 10
    'TTF..........Fçç.RRRRR.fTT..TTTT', // 11
    'TTFRRRRRR....Fçç.WWWWW.f..ƀ...TT', // 12
    'TTFRRRRRR....Fçç.WDWWW........TT', // 13
    'TTFWWWWWW....Fçççççççççççççç..TT', // 14
    'TTFWWWDWW...SFçççççççççççççç..TT', // 15
    'TTF.çççççççççççç....ĥĥ.f..TTĥ.TT', // 16
    'TTF.çççççççççççç.f~~~~~~..TT.ĥTT', // 17
    'TTFʬʬʬʬʬʬʬʬʬʬFçç.f~~~~~~......TT', // 18
    'TTFʬʬʬʬʬʬʬʬʬʬFççĥ.~~~~~~f.ĥ...TT', // 19
    'TTFʬʬʬʬʬʬʬʬʬʬFçç..~~~~~~f...TTTT', // 20
    'TTFʬʬʬʬʬʬʬʬʬʬFçç..f...f..ĥ..TTTT', // 21
    'TTFʬʬʬʬʬʬʬʬʬʬFçç....ĥ...f.ĥ...TT', // 22
    'TTFFFFFFFFFFFFçç...ĥ.ĥ.ĥ.....ƀTT', // 23
    'TTTTTTTTTTTTTTççTTTTTTTTTTTTTTTT', // 24
    'TTTTTTTTTTTTTTççTTTTTTTTTTTTTTTT', // 25
  ]),
  doors: [
    { x: 9, y: 6, interior: 'montHouse' },
    // Maison de la voisine : fermée (pas d'intérieur pour l'instant).
    { x: 18, y: 6, lockedDialogue: ['Personne ne répond.'] },
    { x: 6, y: 15, interior: 'boulyBarn' },
    { x: 18, y: 13, interior: 'school' },
  ],
  buildings: [
    { type: 'house', x: 8, y: 3 },
    { type: 'greenHouse', x: 17, y: 3 },
    { type: 'school', x: 17, y: 10 },
    { type: 'boulyFarm', x: 3, y: 12 },
  ],
  props: [
    // Le tracteur de M. Bouly : en panne, puis réparé.
    {
      type: 'tractor', x: 10, y: 12, w: 2, h: 2,
      unlessFlags: [FLAGS.tracteurRepare],
      dialogue: ['Le tracteur de M. Bouly. Il refuse de démarrer.'],
    },
    {
      type: 'tractor', x: 10, y: 12, w: 2, h: 2,
      ifFlags: [FLAGS.tracteurRepare],
      dialogue: ['Le tracteur de M. Bouly ronronne.'],
    },
    // En septembre, le car scolaire attend en haut de la grand-rue, entre les deux maisons.
    {
      type: 'bus', variant: 'school', x: 14, y: 2, w: 3, h: 2,
      ifFlags: [FLAGS.departCollege], unlessFlags: [FLAGS.arriveePrytanee],
      script: SCHOOL_BUS,
    },
  ],
  npcs: [
    // Tant que Jean ne t'a rien demandé, M. Bouly se contente de te saluer.
    {
      id: 'bouly-bonjour', name: 'M. Bouly', x: 11, y: 14, facing: 'down', color: 0x7c5c2c,
      unlessFlags: [FLAGS.jeanQuetes],
      dialogue: ['Bonjour mon grand ! Belle journée pour la ferme, hein ?'],
    },
    {
      id: 'bouly', name: 'M. Bouly', x: 11, y: 14, facing: 'down', color: 0x7c5c2c,
      ifFlags: [FLAGS.jeanQuetes], unlessFlags: [FLAGS.tracteurRepare],
      script: BOULY,
    },
    {
      id: 'bouly-fin', name: 'M. Bouly', x: 11, y: 14, facing: 'down', color: 0x7c5c2c,
      ifFlags: [FLAGS.tracteurRepare],
      dialogue: ['Merci à vous deux ! Ton petit frère a de l\'or dans les mains.'],
    },
    // À la sortie de l'école, Margaux lance le cache-cache (voir HIDE_AND_SEEK).
    {
      id: 'margaux-sortie', name: 'Margaux', x: 20, y: 14, facing: 'left', color: 0xf08080,
      ifFlags: [FLAGS.ecoleCm2], unlessFlags: [FLAGS.cacheCache],
      dialogue: ['Dernière partie avant les vacances !'],
    },
    // Septembre, devant la maison : la famille dit au revoir à Pierre (voir SEPTEMBER_MORNING).
    {
      id: 'maman-septembre', name: 'Maman', x: 8, y: 8, facing: 'up', color: 0xe86fa0,
      ifFlags: [FLAGS.septembre],
      dialogue: ['Allez, file ! Le car ne va pas t\'attendre.'],
    },
    {
      id: 'papa-septembre', name: 'Papa', x: 10, y: 8, facing: 'up', color: 0x3f6fd8,
      ifFlags: [FLAGS.septembre],
      dialogue: ['Le car est en haut de la grand-rue.'],
    },
    {
      id: 'jean-septembre', name: 'Jean', x: 11, y: 7, facing: 'left', color: 0x3c7c5c,
      ifFlags: [FLAGS.septembre],
      dialogue: ['Tu me raconteras, hein ?'],
    },
  ],
  objects: [
    { x: 13, y: 2, dialogue: ['Nord : route du collège.'] },
    { x: 7, y: 6, dialogue: ['La boîte aux lettres de la famille.'] },
    { x: 22, y: 6, dialogue: ['La boîte aux lettres de la voisine.'] },
    { x: 12, y: 15, dialogue: ['Ferme de M. Bouly.'] },
    // Cache-cache : Étienne dans l'arbre de la prairie (Margaux, voir les passages).
    { x: 26, y: 17, ifFlags: [FLAGS.cacheCache], unlessFlags: [FLAGS.trouveEtienne], script: FOUND_ETIENNE },
  ],
  events: [
    { on: 'enter', ifFlags: [FLAGS.arriveeMontepilloy], unlessFlags: [FLAGS.ellipseMontepilloy], steps: ELLIPSIS },
    { on: 'enter', ifFlags: [FLAGS.ecoleCm2], unlessFlags: [FLAGS.cacheCache], steps: HIDE_AND_SEEK },
    { on: 'enter', ifFlags: [FLAGS.septembre], unlessFlags: [FLAGS.departCollege], steps: SEPTEMBER_MORNING },
  ],
  triggers: [
    // Porte sud : retour vers Saint-Ay (arrivée à sa sortie nord).
    ...[14, 15].map((x) => ({
      x,
      y: 25,
      readyDialogue: ['Tu prends la route de Saint-Ay.'],
      warp: { map: 'saintAy', x: 14, y: 1, facing: 'down' },
    })),
    // Cache-cache : Margaux, derrière les bottes de foin, au fond du champ de la ferme (on tombe sur elle en y
    // entrant).
    ...[[11, 21], [12, 21], [11, 22], [12, 22]].map(([x, y]) => ({
      x, y, ifFlags: [FLAGS.cacheCache], unlessFlags: [FLAGS.trouveMargaux], script: FOUND_MARGAUX,
    })),
    // Porte nord : ce qu'il reste à faire, puis, en septembre, le car scolaire qui attend juste à côté.
    ...[14, 15].map((x) => ({ x, y: 0, script: NORTH_EXIT })),
  ],
  spawn: { x: 14, y: 23, facing: 'up' },
};
