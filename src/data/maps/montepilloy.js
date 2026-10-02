import { parseGrid } from './parseGrid.js';
import { FLAGS, ITEMS } from '../story.js';

// Montépilloy (Oise) — village de campagne façon Rouge Feu, 36 x 30 cases : grand-rue en terre nord-sud (route
// du Prytanée au nord, de Saint-Ay au sud) et deux chemins de terre est-ouest ; la maison de la famille (toit
// rouge) et celle de la voisine (toit vert), un bosquet au nord-est ; une prairie aux hautes herbes à l'ouest ;
// l'école (auvent vert) et une petite mare au milieu du village. En bas, à gauche de la grand-rue, la prairie et
// l'arbre où le chat de Jean se cache ; à droite, la ferme de M. Bouly dans un seul enclos à clôture blanche
// (entrée en haut, au bout du chemin) : le hangar (toit orange de Rubis/Saphir), le tracteur et les tonneaux,
// puis le champ de blé, rectangulaire, en dessous. Ceinture d'arbres.
// Légende : voir src/data/tiles.js (ç = chemin de terre, ~ = mare, O = tonneau, ʬ = blé, F = clôture,
// T = arbre (blocs de 2 x 2), ƀ = buisson, f = fleurs, ĥ = hautes herbes, S = panneau, M = boîte aux lettres,
// R / W / D = toit, mur, porte des bâtiments)
export const montepilloyMap = {
  id: 'montepilloy',
  name: 'Montépilloy',
  grid: parseGrid([
    'TTTTTTTTTTTTTTççTTTTTTTTTTTTTTTTTTTT', // 0
    'TTTTTTTTTTTTTTççTTTTTTTTTTTTTTTTTTTT', // 1
    'TT.ƀ..........ççS.........ƀ.TT....TT', // 2
    'TT..RRRRR.....çç....RRRRR...TT.f..TT', // 3
    'TT..RRRRR.fff.çç.ff.RRRRR.......TTTT', // 4
    'TT..WWWWW.fff.çç.ff.WWWWW....ff.TTTT', // 5
    'TT..WDWWWMfff.çç...MWDWWW.........TT', // 6
    'TT.ççççççççççççççççççççççççç......TT', // 7
    'TT............çç.................ƀTT', // 8
    'TTĥ..fĥ.......çç~~~~..f.....f.....TT', // 9
    'TTTT...ĥ......çç~~~~f...TT....TT..TT', // 10
    'TTTT.ĥ..RRRRR.çç~~~~....TT....TT..TT', // 11
    'TT..ĥ..fRRRRR.ççf..f.f.....f......TT', // 12
    'TTĥ..ĥ.ĥWWWWW.çç....ƀ.......ƀ....fTT', // 13
    'TT.ĥ..ĥ.WDWWW.çç..................TT', // 14
    'TT.çççççççççççççççççççççççççççççç.TT', // 15
    'TT.ĥ..........çç.FFFFFFFFçFFFFFFFFTT', // 16
    'TT......ĥĥ...ĥçç.F......Sç.......FTT', // 17
    'TT..TT........çç.FRRRRRR.ç...OO..FTT', // 18
    'TT..TT......ĥ.çç.FRRRRRR.ç....O..FTT', // 19
    'TTĥ...........çç.FWWWWWW.ç.......FTT', // 20
    'TT.ƀ...ĥĥ.....çç.FWWWDWW.ç.......FTT', // 21
    'TT........TT..çç.FçççççççççççççççFTT', // 22
    'TT.ĥ......TT..çç.FʬʬʬʬʬʬʬʬʬʬʬʬʬʬʬFTT', // 23
    'TT..ĥ..ff.....çç.FʬʬʬʬʬʬʬʬʬʬʬʬʬʬʬFTT', // 24
    'TT.......ĥ..ĥ.çç.FʬʬʬʬʬʬʬʬʬʬʬʬʬʬʬFTT', // 25
    'TTĥ...ĥ.......çç.FʬʬʬʬʬʬʬʬʬʬʬʬʬʬʬFTT', // 26
    'TT..........ƀ.çç.FFFFFFFFFFFFFFFFFTT', // 27
    'TTTTTTTTTTTTTTççTTTTTTTTTTTTTTTTTTTT', // 28
    'TTTTTTTTTTTTTTççTTTTTTTTTTTTTTTTTTTT', // 29
  ]),
  doors: [
    { x: 5, y: 6, interior: 'montHouse' },
    // Maison de la voisine : fermée (pas d'intérieur pour l'instant).
    { x: 21, y: 6, lockedDialogue: ['Personne ne répond.'] },
    { x: 21, y: 21, lockedDialogue: ['La grange de M. Bouly, pleine de foin.'] },
    {
      x: 9, y: 14, interior: 'school',
      lock: { ifFlags: [FLAGS.manonEcole] },
      lockedDialogue: ["L'école est fermée pour l'instant."],
    },
  ],
  buildings: [
    { type: 'house', x: 4, y: 3 },
    { type: 'greenHouse', x: 20, y: 3 },
    { type: 'school', x: 8, y: 11 },
    { type: 'boulyFarm', x: 18, y: 18 },
  ],
  // Le tracteur de M. Bouly : en panne, puis réparé.
  props: [
    {
      type: 'tractor', x: 26, y: 19, w: 2, h: 2, broken: true,
      unlessFlags: [FLAGS.tracteurRepare],
      dialogue: ['[Texte provisoire] Le tracteur de M. Bouly. Il fume et refuse de démarrer.'],
    },
    {
      type: 'tractor', x: 26, y: 19, w: 2, h: 2,
      ifFlags: [FLAGS.tracteurRepare],
      dialogue: ['[Texte provisoire] Le tracteur de M. Bouly ronronne comme un chat !'],
    },
  ],
  npcs: [
    // Tant que Jean ne t'a rien demandé, M. Bouly se contente de te saluer.
    {
      id: 'bouly-bonjour', name: 'M. Bouly', x: 28, y: 18, facing: 'down', color: 0x7c5c2c,
      unlessFlags: [FLAGS.jeanQuetes],
      dialogue: ['[M. Bouly - texte provisoire] Bonjour mon grand ! Belle journée pour la ferme, hein ?'],
    },
    {
      id: 'bouly', name: 'M. Bouly', x: 28, y: 18, facing: 'down', color: 0x7c5c2c,
      ifFlags: [FLAGS.jeanQuetes],
      dialogue: [
        "[M. Bouly - texte provisoire] Bonjour mon grand ! Mon tracteur est tombé en panne...",
        "Il lui manque une pièce. Elle doit traîner quelque part dans la ferme, peut-être dans un tonneau ?",
      ],
      after: ['[M. Bouly - texte provisoire] Merci encore ! Mon tracteur roule comme au premier jour.'],
      setFlag: FLAGS.boulyDemande,
      receive: {
        item: ITEMS.pieceTracteur,
        dialogue: ["[M. Bouly - texte provisoire] La pièce ! C'est exactement celle-là. Merci, mon grand !"],
        setFlag: FLAGS.tracteurRepare,
      },
    },
    // Le chat de Jean, une fois tombé de son arbre.
    {
      id: 'chat', name: 'Chat', x: 6, y: 20, facing: 'up', color: 0xe89030,
      ifFlags: [FLAGS.chatTrouve],
      dialogue: ['Miaou !'],
    },
  ],
  objects: [
    { x: 16, y: 2, dialogue: ['Nord : route du Prytanée.'] },
    { x: 9, y: 6, dialogue: ['La boîte aux lettres de la famille.'] },
    { x: 19, y: 6, dialogue: ['La boîte aux lettres de la voisine.'] },
    { x: 24, y: 17, dialogue: ['Ferme de M. Bouly.'] },
    // L'arbre où le chat est coincé (dans la prairie, au sud-ouest du village).
    {
      x: 5, y: 19,
      dialogue: ["[Texte provisoire] Tu secoues l'arbre... Miaou ! Le chat tombe de l'arbre !"],
      after: ["[Texte provisoire] Il n'y a plus rien dans cet arbre."],
      setFlag: FLAGS.chatTrouve,
    },
    // Le tonneau qui cache la pièce de tracteur (une fois que M. Bouly t'en a parlé).
    { x: 30, y: 19, unlessFlags: [FLAGS.boulyDemande], dialogue: ['[Texte provisoire] Un vieux tonneau de la ferme.'] },
    {
      x: 30, y: 19,
      ifFlags: [FLAGS.boulyDemande],
      dialogue: ['[Texte provisoire] Au fond du tonneau... une pièce de tracteur !'],
      after: ['[Texte provisoire] Le tonneau est vide.'],
      item: ITEMS.pieceTracteur,
      setFlag: FLAGS.pieceTrouvee,
    },
  ],
  triggers: [
    // Porte sud : retour vers Saint-Ay (arrivée à sa sortie nord).
    ...[14, 15].map((x) => ({
      x,
      y: 29,
      readyDialogue: ['Tu prends la route de Saint-Ay.'],
      warp: { map: 'saintAy', x: 14, y: 1, facing: 'down' },
    })),
    // Porte nord : la route du Prytanée, une fois arrivé à l'école et les quêtes de Jean terminées.
    ...[14, 15].map((x) => ({
      x,
      y: 0,
      ifFlags: [FLAGS.arriveeEcole, FLAGS.chatTrouve, FLAGS.tracteurRepare],
      dialogue: [
        '[Texte provisoire] Tu as encore des choses à faire à Montépilloy :',
        'aide Jean à retrouver le chat, et M. Bouly à réparer son tracteur.',
      ],
      readyDialogue: ['Tu prends la route du Prytanée.'],
      setFlags: [FLAGS.arriveePrytanee],
      warp: { map: 'prytanee', x: 14, y: 21, facing: 'up' },
    })),
  ],
  spawn: { x: 14, y: 27, facing: 'up' },
};
