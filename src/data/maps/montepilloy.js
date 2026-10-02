import { parseGrid } from './parseGrid.js';
import { FLAGS, ITEMS } from '../story.js';

// Montépilloy (Oise) — village de campagne façon Rouge Feu, 32 x 28 cases. Chemins de terre de deux cases : la
// grand-rue nord-sud (Prytanée au nord, Saint-Ay au sud), la rue des maisons (la famille à l'ouest, la voisine à
// l'est) et la rue de l'école, qui mène aussi à la ferme. Entre les deux rues : un jardin et des sapins à l'ouest,
// l'école à l'est. Au sud-ouest, la prairie aux hautes herbes, l'arbre où le chat de Jean se cache et la mare, en
// bas à gauche. Au sud-est, la ferme de M. Bouly, un seul enclos à clôture blanche ouvert en haut (deux cases) :
// la grange (toit orange de Rubis/Saphir, tonneaux à l'intérieur) et le tracteur, puis le champ de blé.
// Ceinture d'arbres.
// Légende : voir src/data/tiles.js (ç = chemin de terre, ~ = mare, ʬ = blé, F = clôture, T = arbre (blocs de
// 2 x 2), ƀ = buisson, f = fleurs, ĥ = hautes herbes, S = panneau, M = boîte aux lettres, R / W / D = toit, mur,
// porte des bâtiments)
export const montepilloyMap = {
  id: 'montepilloy',
  name: 'Montépilloy',
  grid: parseGrid([
    'TTTTTTTTTTTTTTççTTTTTTTTTTTTTTTT', // 0
    'TTTTTTTTTTTTTTççTTTTTTTTTTTTTTTT', // 1
    'TT.ƀ.......ƀ..ççS..ƀ........TTTT', // 2
    'TT.RRRRR......çç.......RRRRRTTTT', // 3
    'TT.RRRRR.ff...çç....ff.RRRRRTTTT', // 4
    'TT.WWWWW.ff...çç....ff.WWWWWTTTT', // 5
    'TT.WDWWWM.....çç......MWDWWW..TT', // 6
    'TT.çççççççççççççççççççççççççç.TT', // 7
    'TT.çççççççççççççççççççççççççç.TT', // 8
    'TT..ff......f.çç....f.RRRRR...TT', // 9
    'TTTT..TT.ff...çç.ff...RRRRR.TTTT', // 10
    'TTTT..TT.f.ƀ..çç.f.ƀ..WWWWW.TTTT', // 11
    'TT..ĥ....ĥ....çç......WDWWW...TT', // 12
    'TT.çççççççççççççççççççççççççç.TT', // 13
    'TT.çççççççççççççççççççççççççç.TT', // 14
    'TT....ĥ.......ççSFFFFFFFççFFFFTT', // 15
    'TTƀĥĥ...TT.ĥ..çç.F......çç...FTT', // 16
    'TT....ĥ.TT..ĥ.çç.FRRRRRRçç...FTT', // 17
    'TT.ĥ..........ççƀFRRRRRRçç...FTT', // 18
    'TTf.......ĥĥ..çç.FWWWWWWçç...FTT', // 19
    'TT.~~~~~f.....çç.FWWWDWWçç...FTT', // 20
    'TT.~~~~~f...ĥ.çç.FçççççççççççFTT', // 21
    'TT.~~~~~..TT..çç.FʬʬʬʬʬʬʬʬʬʬʬFTT', // 22
    'TT.~~~~~..TTƀ.ççfFʬʬʬʬʬʬʬʬʬʬʬFTT', // 23
    'TTf.....f.....çç.FʬʬʬʬʬʬʬʬʬʬʬFTT', // 24
    'TT...ĥ...ĥ..ĥ.çç.FFFFFFFFFFFFFTT', // 25
    'TTTTTTTTTTTTTTççTTTTTTTTTTTTTTTT', // 26
    'TTTTTTTTTTTTTTççTTTTTTTTTTTTTTTT', // 27
  ]),
  doors: [
    { x: 4, y: 6, interior: 'montHouse' },
    // Maison de la voisine : fermée (pas d'intérieur pour l'instant).
    { x: 24, y: 6, lockedDialogue: ['Personne ne répond.'] },
    { x: 21, y: 20, interior: 'boulyBarn' },
    {
      x: 23, y: 12, interior: 'school',
      lock: { ifFlags: [FLAGS.manonEcole] },
      lockedDialogue: ["L'école est fermée pour l'instant."],
    },
  ],
  buildings: [
    { type: 'house', x: 3, y: 3 },
    { type: 'greenHouse', x: 23, y: 3 },
    { type: 'school', x: 22, y: 9 },
    { type: 'boulyFarm', x: 18, y: 17 },
  ],
  // Le tracteur de M. Bouly : en panne, puis réparé.
  props: [
    {
      type: 'tractor', x: 26, y: 18, w: 2, h: 2,
      unlessFlags: [FLAGS.tracteurRepare],
      dialogue: ['[Texte provisoire] Le tracteur de M. Bouly. Il refuse de démarrer.'],
    },
    {
      type: 'tractor', x: 26, y: 18, w: 2, h: 2,
      ifFlags: [FLAGS.tracteurRepare],
      dialogue: ['[Texte provisoire] Le tracteur de M. Bouly ronronne comme un chat !'],
    },
  ],
  npcs: [
    // Tant que Jean ne t'a rien demandé, M. Bouly se contente de te saluer.
    {
      id: 'bouly-bonjour', name: 'M. Bouly', x: 26, y: 16, facing: 'left', color: 0x7c5c2c,
      unlessFlags: [FLAGS.jeanQuetes],
      dialogue: ['[M. Bouly - texte provisoire] Bonjour mon grand ! Belle journée pour la ferme, hein ?'],
    },
    {
      id: 'bouly', name: 'M. Bouly', x: 26, y: 16, facing: 'left', color: 0x7c5c2c,
      ifFlags: [FLAGS.jeanQuetes],
      dialogue: [
        "[M. Bouly - texte provisoire] Bonjour mon grand ! Mon tracteur est tombé en panne...",
        "Il lui manque une pièce. Elle doit traîner quelque part dans la ferme, peut-être dans un des tonneaux de la grange ?",
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
      id: 'chat', name: 'Chat', x: 10, y: 18, facing: 'up', color: 0xe89030,
      ifFlags: [FLAGS.chatTrouve],
      dialogue: ['Miaou !'],
    },
  ],
  objects: [
    { x: 16, y: 2, dialogue: ['Nord : route du Prytanée.'] },
    { x: 8, y: 6, dialogue: ['La boîte aux lettres de la famille.'] },
    { x: 22, y: 6, dialogue: ['La boîte aux lettres de la voisine.'] },
    { x: 16, y: 15, dialogue: ['Ferme de M. Bouly.'] },
    // L'arbre où le chat est coincé (dans la prairie, au sud-ouest du village).
    {
      x: 9, y: 17,
      dialogue: ["[Texte provisoire] Tu secoues l'arbre... Miaou ! Le chat tombe de l'arbre !"],
      after: ["[Texte provisoire] Il n'y a plus rien dans cet arbre."],
      setFlag: FLAGS.chatTrouve,
    },
  ],
  triggers: [
    // Porte sud : retour vers Saint-Ay (arrivée à sa sortie nord).
    ...[14, 15].map((x) => ({
      x,
      y: 27,
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
  spawn: { x: 14, y: 25, facing: 'up' },
};
