import { parseGrid } from './parseGrid.js';
import { FLAGS, ITEMS } from '../story.js';

// Montépilloy (Oise) — village de campagne façon Rouge Feu, 36 x 24 cases : grand-rue en terre nord-sud (route
// du Prytanée au nord, de Saint-Ay au sud) et deux chemins de terre est-ouest ; la maison de la famille (toit
// rouge) et celle de la voisine (toit vert) ; les ruines du château à l'ouest (donjon éventré, courtine percée
// d'une brèche qu'on peut franchir) ; l'école (auvent vert) ; le puits et une petite mare au milieu du village ;
// à l'est, la ferme de M. Bouly (hangar au toit orange de Rubis/Saphir, tonneaux, tracteur, barrière en rondins)
// entourée de champs de blé et d'un champ labouré ; au sud-ouest, la prairie et l'arbre où le chat de Jean se
// cache. Ceinture d'arbres.
// Légende : voir src/data/tiles.js (ç = chemin de terre, U = puits, ~ = mare, O = tonneau, ʬ = blé, ʭ = terre
// labourée, ł = barrière en rondins, T = arbre, ƚ = petit arbre, ƀ = buisson, f = fleurs, ĥ = hautes herbes,
// S = panneau, M = boîte aux lettres, R / W / D = toit, mur, porte des bâtiments ; les ruines sont des R / W)
export const montepilloyMap = {
  id: 'montepilloy',
  name: 'Montépilloy',
  grid: parseGrid([
    'TTTTTTTTTTTTTTççTTTTTTTTTTTTTTTTTTTT', // 0
    'TTTTTTTTTTTTTTççTTTTTTTTTTTTTTTTTTTT', // 1
    'TT.ƚ..........ççS.........ƚ.......TT', // 2
    'TT..RRRRR.....çç....RRRRR.....ʬʬʬʬTT', // 3
    'TT..RRRRR.fff.çç.ff.RRRRR.....ʬʬʬʬTT', // 4
    'TT..WWWWW.fff.çç.ff.WWWWW.....ʬʬʬʬTT', // 5
    'TT..WDWWWMfff.çç...MWDWWW.....ʬʬʬʬTT', // 6
    'TT.ççççççççççççççççççççççççç......TT', // 7
    'TT............çç..................TT', // 8
    'TTRR........U.çç~~~~...łłłłłł.ʬʬʬʬTT', // 9
    'TTRR..R.......çç~~~~f.........ʬʬʬʬTT', // 10
    'TTRRR.R.RRRRR.çç~~~~.RRRRRROO.ʬʬʬʬTT', // 11
    'TTRRW.W.RRRRR.ççf..f.RRRRRR.O.ʬʬʬʬTT', // 12
    'TT.....SWWWWW.çç.....WWWWWW...ʬʬʬʬTT', // 13
    'TT.R....WDWWW.çç....SWWWDWW...ʬʬʬʬTT', // 14
    'TT.ççççççççççççççççççççççççççç....TT', // 15
    'TT............çç..............ʭʭʭʭTT', // 16
    'TTƚ...........çç..ʬʬʬʬʬʬʬʬʬʬʬ.ʭʭʭʭTT', // 17
    'TT..TT..ĥĥĥĥ..çç..ʬʬʬʬʬʬʬʬʬʬʬ.ʬʬʬʬTT', // 18
    'TT..TT..ĥĥĥĥ..ççƀ.ʬʬʬʬʬʬʬʬʬʬʬ.ʬʬʬʬTT', // 19
    'TT......ĥĥĥĥ..çç..ʬʬʬʬʬʬʬʬʬʬʬ.ʬʬʬʬTT', // 20
    'TT.ƀ...ƚ....ƚ.çç..ʬʬʬʬʬʬʬʬʬʬʬ.ʬʬʬʬTT', // 21
    'TTTTTTTTTTTTTTççTTTTTTTTTTTTTTTTTTTT', // 22
    'TTTTTTTTTTTTTTççTTTTTTTTTTTTTTTTTTTT', // 23
  ]),
  doors: [
    { x: 5, y: 6, interior: 'montHouse' },
    // Maison de la voisine : fermée (pas d'intérieur pour l'instant).
    { x: 21, y: 6, lockedDialogue: ['Personne ne répond.'] },
    { x: 24, y: 14, lockedDialogue: ['La grange de M. Bouly, pleine de foin.'] },
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
    { type: 'castleRuin', x: 2, y: 9 },
    { type: 'boulyFarm', x: 21, y: 11 },
  ],
  // Le tracteur de M. Bouly : en panne, puis réparé.
  props: [
    {
      type: 'tractor', x: 27, y: 13, w: 2, h: 2, broken: true,
      unlessFlags: [FLAGS.tracteurRepare],
      dialogue: ['[Texte provisoire] Le tracteur de M. Bouly. Il fume et refuse de démarrer.'],
    },
    {
      type: 'tractor', x: 27, y: 13, w: 2, h: 2,
      ifFlags: [FLAGS.tracteurRepare],
      dialogue: ['[Texte provisoire] Le tracteur de M. Bouly ronronne comme un chat !'],
    },
  ],
  npcs: [
    // Tant que Jean ne t'a rien demandé, M. Bouly se contente de te saluer.
    {
      id: 'bouly-bonjour', name: 'M. Bouly', x: 29, y: 13, facing: 'left', color: 0x7c5c2c,
      unlessFlags: [FLAGS.jeanQuetes],
      dialogue: ['[M. Bouly - texte provisoire] Bonjour mon grand ! Belle journée pour la ferme, hein ?'],
    },
    {
      id: 'bouly', name: 'M. Bouly', x: 29, y: 13, facing: 'left', color: 0x7c5c2c,
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
    { x: 7, y: 13, dialogue: ['Ruines du château de Montépilloy. Le donjon veille sur le village depuis le Moyen Âge.'] },
    { x: 2, y: 12, dialogue: ['Le donjon éventré. Le lierre grimpe entre les pierres.'] },
    { x: 3, y: 12, dialogue: ['Le donjon éventré. Le lierre grimpe entre les pierres.'] },
    { x: 3, y: 14, dialogue: ['Un bloc de pierre tombé de la muraille.'] },
    { x: 20, y: 14, dialogue: ['Ferme de M. Bouly.'] },
    { x: 9, y: 6, dialogue: ['La boîte aux lettres de la famille.'] },
    { x: 19, y: 6, dialogue: ['La boîte aux lettres de la voisine.'] },
    // L'arbre où le chat est coincé (dans la prairie, au sud-ouest).
    {
      x: 5, y: 19,
      dialogue: ["[Texte provisoire] Tu secoues l'arbre... Miaou ! Le chat tombe de l'arbre !"],
      after: ["[Texte provisoire] Il n'y a plus rien dans cet arbre."],
      setFlag: FLAGS.chatTrouve,
    },
    // Le tonneau qui cache la pièce de tracteur (une fois que M. Bouly t'en a parlé).
    { x: 28, y: 12, unlessFlags: [FLAGS.boulyDemande], dialogue: ['[Texte provisoire] Un vieux tonneau de la ferme.'] },
    {
      x: 28, y: 12,
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
      y: 23,
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
  spawn: { x: 14, y: 21, facing: 'up' },
};
