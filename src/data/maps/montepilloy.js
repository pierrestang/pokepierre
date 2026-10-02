import { parseGrid } from './parseGrid.js';
import { FLAGS, ITEMS } from '../story.js';

// Montépilloy (Oise) — village de campagne façon Rouge Feu, 32 x 32 cases. Chemins de terre de deux cases : la
// grand-rue nord-sud (Prytanée au nord, Saint-Ay au sud), la rue des maisons et la rue du bas. Les maisons bordent
// la grand-rue de chaque côté : la famille à gauche, la voisine à droite, l'école à droite en dessous ; un jardin
// en face de l'école. En bas à gauche, la ferme de M. Bouly, un enclos rectangulaire à clôture blanche ouvert en
// haut (deux cases, panneau devant) : la grange (toit orange de Rubis/Saphir, tonneaux à l'intérieur) et le
// tracteur, puis le champ de blé. En bas à droite, la prairie aux hautes herbes, la mare et l'arbre où le chat de
// Jean se cache. Ceinture d'arbres.
// Légende : voir src/data/tiles.js (ç = chemin de terre, ~ = mare, ʬ = blé, F = clôture, T = arbre (blocs de
// 2 x 2), ƀ = buisson, f = fleurs, ĥ = hautes herbes, S = panneau, M = boîte aux lettres, R / W / D = toit, mur,
// porte des bâtiments)
export const montepilloyMap = {
  id: 'montepilloy',
  name: 'Montépilloy',
  grid: parseGrid([
    'TTTTTTTTTTTTTTççTTTTTTTTTTTTTTTT', // 0
    'TTTTTTTTTTTTTTççTTTTTTTTTTTTTTTT', // 1
    'TTTT..........ççS.........TT..TT', // 2
    'TTTT....RRRRR.çç.RRRRR....TT..TT', // 3
    'TT...ff.RRRRR.çç.RRRRR.ff...TTTT', // 4
    'TT.ƀ.ff.WWWWW.çç.WWWWW.ff...TTTT', // 5
    'TT.....MWDWWW.çç.WDWWWM.......TT', // 6
    'TT....çççççççççççççççççç...ƀ..TT', // 7
    'TT....çççççççççççççççççç......TT', // 8
    'TT............çç..............TT', // 9
    'TTTT....ff....çç.RRRRR..TT....TT', // 10
    'TTTT.ƀ..f..ff.çç.RRRRR..TT....TT', // 11
    'TT....f...ƀ.f.çç.WWWWW.ff...TTTT', // 12
    'TT............çç.WDWWW......TTTT', // 13
    'TT..çççççççççççççççççççççççç..TT', // 14
    'TT..çççççççççççççççççççççççç..TT', // 15
    'TT.......ççS..çç..............TT', // 16
    'TTFFFFFFFççFFFçç............ĥ.TT', // 17
    'TTF......çç..Fçç.ĥĥ..ĥĥ...TT..TT', // 18
    'TTFRRRRRRçç..Fçç..........TT..TT', // 19
    'TTFRRRRRRçç..Fçç........f.....TT', // 20
    'TTFWWWWWWçç..Fçç..f~~~~~~...ĥ.TT', // 21
    'TTFWWWDWWçç..Fççĥ.f~~~~~~....ĥTT', // 22
    'TTFççççççççççFçç...~~~~~~f....TT', // 23
    'TTFʬʬʬʬʬʬʬʬʬʬFçç.ĥ.~~~~~~f....TT', // 24
    'TTFʬʬʬʬʬʬʬʬʬʬFçç...f...f.....ƀTT', // 25
    'TTFʬʬʬʬʬʬʬʬʬʬFççTT........TT..TT', // 26
    'TTFʬʬʬʬʬʬʬʬʬʬFççTT...ĥĥ...TT..TT', // 27
    'TTFʬʬʬʬʬʬʬʬʬʬFçç.......fĥ....ĥTT', // 28
    'TTFFFFFFFFFFFFçç...ĥ........ĥ.TT', // 29
    'TTTTTTTTTTTTTTççTTTTTTTTTTTTTTTT', // 30
    'TTTTTTTTTTTTTTççTTTTTTTTTTTTTTTT', // 31
  ]),
  doors: [
    { x: 9, y: 6, interior: 'montHouse' },
    // Maison de la voisine : fermée (pas d'intérieur pour l'instant).
    { x: 18, y: 6, lockedDialogue: ['Personne ne répond.'] },
    { x: 6, y: 22, interior: 'boulyBarn' },
    {
      x: 18, y: 13, interior: 'school',
      lock: { ifFlags: [FLAGS.manonEcole] },
      lockedDialogue: ["L'école est fermée pour l'instant."],
    },
  ],
  buildings: [
    { type: 'house', x: 8, y: 3 },
    { type: 'greenHouse', x: 17, y: 3 },
    { type: 'school', x: 17, y: 10 },
    { type: 'boulyFarm', x: 3, y: 19 },
  ],
  // Le tracteur de M. Bouly : en panne, puis réparé.
  props: [
    {
      type: 'tractor', x: 11, y: 19, w: 2, h: 2,
      unlessFlags: [FLAGS.tracteurRepare],
      dialogue: ['[Texte provisoire] Le tracteur de M. Bouly. Il refuse de démarrer.'],
    },
    {
      type: 'tractor', x: 11, y: 19, w: 2, h: 2,
      ifFlags: [FLAGS.tracteurRepare],
      dialogue: ['[Texte provisoire] Le tracteur de M. Bouly ronronne comme un chat !'],
    },
  ],
  npcs: [
    // Tant que Jean ne t'a rien demandé, M. Bouly se contente de te saluer.
    {
      id: 'bouly-bonjour', name: 'M. Bouly', x: 11, y: 18, facing: 'left', color: 0x7c5c2c,
      unlessFlags: [FLAGS.jeanQuetes],
      dialogue: ['[M. Bouly - texte provisoire] Bonjour mon grand ! Belle journée pour la ferme, hein ?'],
    },
    {
      id: 'bouly', name: 'M. Bouly', x: 11, y: 18, facing: 'left', color: 0x7c5c2c,
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
      id: 'chat', name: 'Chat', x: 26, y: 20, facing: 'up', color: 0xe89030,
      ifFlags: [FLAGS.chatTrouve],
      dialogue: ['Miaou !'],
    },
  ],
  objects: [
    { x: 16, y: 2, dialogue: ['Nord : route du Prytanée.'] },
    { x: 7, y: 6, dialogue: ['La boîte aux lettres de la famille.'] },
    { x: 22, y: 6, dialogue: ['La boîte aux lettres de la voisine.'] },
    { x: 11, y: 16, dialogue: ['Ferme de M. Bouly.'] },
    // L'arbre où le chat est coincé (dans la prairie, au sud-est du village).
    {
      x: 26, y: 19,
      dialogue: ["[Texte provisoire] Tu secoues l'arbre... Miaou ! Le chat tombe de l'arbre !"],
      after: ["[Texte provisoire] Il n'y a plus rien dans cet arbre."],
      setFlag: FLAGS.chatTrouve,
    },
  ],
  triggers: [
    // Porte sud : retour vers Saint-Ay (arrivée à sa sortie nord).
    ...[14, 15].map((x) => ({
      x,
      y: 31,
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
  spawn: { x: 14, y: 29, facing: 'up' },
};
