import { parseGrid } from './parseGrid.js';
import { FLAGS, ITEMS } from '../story.js';

// Montépilloy (Oise) — village de campagne façon Rouge Feu, 32 x 26 cases. La grand-rue en terre arrive du
// Prytanée au nord, croise la rue des maisons (la famille à l'ouest, la voisine à l'est) puis la rue de l'école,
// et fait un coude avant de descendre vers Saint-Ay au sud. Au milieu, la mare dans un pré fleuri et un bosquet ;
// à l'ouest, l'école. Au sud-ouest, la prairie aux hautes herbes et l'arbre où le chat de Jean se cache. Au
// sud-est, la ferme de M. Bouly, un seul enclos à clôture blanche ouvert en haut (deux cases), au bout de la rue
// de l'école : le hangar (toit orange de Rubis/Saphir), le tracteur et les tonneaux, une allée, puis le champ de
// blé. Ceinture d'arbres.
// Légende : voir src/data/tiles.js (ç = chemin de terre, ~ = mare, O = tonneau, ʬ = blé, F = clôture,
// T = arbre (blocs de 2 x 2), ƀ = buisson, f = fleurs, ĥ = hautes herbes, S = panneau, M = boîte aux lettres,
// R / W / D = toit, mur, porte des bâtiments)
export const montepilloyMap = {
  id: 'montepilloy',
  name: 'Montépilloy',
  grid: parseGrid([
    'TTTTTTTTTTTTTTççTTTTTTTTTTTTTTTT', // 0
    'TTTTTTTTTTTTTTççTTTTTTTTTTTTTTTT', // 1
    'TT.ƀ........ƀ.ççS.........TT..TT', // 2
    'TT.RRRRR......çç....RRRRR.TT..TT', // 3
    'TT.RRRRR.fff..çç.ff.RRRRR...TTTT', // 4
    'TT.WWWWW.fff..çç.ff.WWWWW.f.TTTT', // 5
    'TT.WDWWWM.....çç...MWDWWW..f..TT', // 6
    'TT..ççççççççççççççççççççç.....TT', // 7
    'TT..RRRRR.....çç.f~~~~..TT..ƀ.TT', // 8
    'TTƀ.RRRRR.ff..çç.f~~~~f.TT....TT', // 9
    'TTƀ.WWWWW.f...çç..~~~~....TT..TT', // 10
    'TT..WDWWW.....çç..ff.f.ƀ..TT..TT', // 11
    'TT...ççççççççççççççççççççççS..TT', // 12
    'TT.......ff.çççç.FFFFFFFFççFFFTT', // 13
    'TTĥĥ...ĥ..ĥ.çç...F.......ççOOFTT', // 14
    'TT......ĥ...çç.ƀ.FRRRRRR.çç.OFTT', // 15
    'TT..TT......çç...FRRRRRR.çç..FTT', // 16
    'TT..TT.ĥ..ĥ.çç...FWWWWWW.çç..FTT', // 17
    'TTĥ........ĥçç..fFWWWDWW.çç..FTT', // 18
    'TT.ĥ........çç...FçççççççççççFTT', // 19
    'TT....ĥ.TT..çç...FʬʬʬʬʬʬʬʬʬʬʬFTT', // 20
    'TTƀ.....TT..çç.ƀ.FʬʬʬʬʬʬʬʬʬʬʬFTT', // 21
    'TT.ĥĥ......ĥçç..fFʬʬʬʬʬʬʬʬʬʬʬFTT', // 22
    'TT....ĥ...ĥ.çç...FFFFFFFFFFFFFTT', // 23
    'TTTTTTTTTTTTççTTTTTTTTTTTTTTTTTT', // 24
    'TTTTTTTTTTTTççTTTTTTTTTTTTTTTTTT', // 25
  ]),
  doors: [
    { x: 4, y: 6, interior: 'montHouse' },
    // Maison de la voisine : fermée (pas d'intérieur pour l'instant).
    { x: 21, y: 6, lockedDialogue: ['Personne ne répond.'] },
    { x: 21, y: 18, lockedDialogue: ['La grange de M. Bouly, pleine de foin.'] },
    {
      x: 5, y: 11, interior: 'school',
      lock: { ifFlags: [FLAGS.manonEcole] },
      lockedDialogue: ["L'école est fermée pour l'instant."],
    },
  ],
  buildings: [
    { type: 'house', x: 3, y: 3 },
    { type: 'greenHouse', x: 20, y: 3 },
    { type: 'school', x: 4, y: 8 },
    { type: 'boulyFarm', x: 18, y: 15 },
  ],
  // Le tracteur de M. Bouly : en panne, puis réparé.
  props: [
    {
      type: 'tractor', x: 27, y: 16, w: 2, h: 2, broken: true,
      unlessFlags: [FLAGS.tracteurRepare],
      dialogue: ['[Texte provisoire] Le tracteur de M. Bouly. Il fume et refuse de démarrer.'],
    },
    {
      type: 'tractor', x: 27, y: 16, w: 2, h: 2,
      ifFlags: [FLAGS.tracteurRepare],
      dialogue: ['[Texte provisoire] Le tracteur de M. Bouly ronronne comme un chat !'],
    },
  ],
  npcs: [
    // Tant que Jean ne t'a rien demandé, M. Bouly se contente de te saluer.
    {
      id: 'bouly-bonjour', name: 'M. Bouly', x: 24, y: 14, facing: 'right', color: 0x7c5c2c,
      unlessFlags: [FLAGS.jeanQuetes],
      dialogue: ['[M. Bouly - texte provisoire] Bonjour mon grand ! Belle journée pour la ferme, hein ?'],
    },
    {
      id: 'bouly', name: 'M. Bouly', x: 24, y: 14, facing: 'right', color: 0x7c5c2c,
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
      id: 'chat', name: 'Chat', x: 6, y: 18, facing: 'up', color: 0xe89030,
      ifFlags: [FLAGS.chatTrouve],
      dialogue: ['Miaou !'],
    },
  ],
  objects: [
    { x: 16, y: 2, dialogue: ['Nord : route du Prytanée.'] },
    { x: 8, y: 6, dialogue: ['La boîte aux lettres de la famille.'] },
    { x: 19, y: 6, dialogue: ['La boîte aux lettres de la voisine.'] },
    { x: 27, y: 12, dialogue: ['Ferme de M. Bouly.'] },
    // L'arbre où le chat est coincé (dans la prairie, au sud-ouest du village).
    {
      x: 5, y: 17,
      dialogue: ["[Texte provisoire] Tu secoues l'arbre... Miaou ! Le chat tombe de l'arbre !"],
      after: ["[Texte provisoire] Il n'y a plus rien dans cet arbre."],
      setFlag: FLAGS.chatTrouve,
    },
    // Le tonneau qui cache la pièce de tracteur (une fois que M. Bouly t'en a parlé).
    { x: 28, y: 15, unlessFlags: [FLAGS.boulyDemande], dialogue: ['[Texte provisoire] Un vieux tonneau de la ferme.'] },
    {
      x: 28, y: 15,
      ifFlags: [FLAGS.boulyDemande],
      dialogue: ['[Texte provisoire] Au fond du tonneau... une pièce de tracteur !'],
      after: ['[Texte provisoire] Le tonneau est vide.'],
      item: ITEMS.pieceTracteur,
      setFlag: FLAGS.pieceTrouvee,
    },
  ],
  triggers: [
    // Porte sud : retour vers Saint-Ay (arrivée à sa sortie nord).
    ...[12, 13].map((x) => ({
      x,
      y: 25,
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
  spawn: { x: 12, y: 23, facing: 'up' },
};
