import { parseGrid } from './parseGrid.js';
import { FLAGS, ITEMS } from '../story.js';

// Montépilloy — ville médiévale entourée de remparts, avec la ferme de M. Bouly, 32 x 24 cases.
// Légende : voir src/data/tiles.js (K = rempart, C = pavés, U = puits, O = tonneau, ¥ = blé)
export const montepilloyMap = {
  id: 'montepilloy',
  name: 'Montépilloy',
  grid: parseGrid([
    'KKKKKKKKKKKCCKKKKKKKKKKKKKKKKKKK', // 0  remparts, porte nord vers le Prytanée
    'K.......CCCCCCCC..............TK', // 1
    'K.TRRRRRCCCCCCCCRRRRRT...RRRRR.K', // 2  toits des deux maisons, grange de la ferme
    'K.TRRRRRCCCCCCCCRRRRRT...RRRRR.K', // 3
    'K.TWWWWWCCCCCCCCWWWWWT...WWWWW.K', // 4
    'K..WDWWWCCCCCCCCWDWWW....WWDWW.K', // 5  portes
    'K...C...CCCCCCCC.C.............K', // 6
    'K...CCCCCCCCCCCCCCCC.........OOK', // 7
    'K.ff....CCCUCCCC....ff.......O.K', // 8  puits sur la place, tonneaux de la ferme
    'K.......CCCCCCCC..............TK', // 9
    'K.O.....CCCCCCRRRRRRR..........K', // 10
    'K.OO....CCCCCCRRRRRRR..FFFFFFFFK', // 11 toit de l'école, champ de blé clôturé
    'K.......CCCCCCWWWWWWW..F¥¥¥¥¥¥FK', // 12
    'K..T....CCCCCCWWWDWWW..F¥¥¥¥¥¥FK', // 13 porte de l'école
    'K..T....CCCCCCCCCCCC...F¥¥¥¥¥¥FK', // 14
    'K.ff......CCCC....ff...F¥¥¥¥¥¥FK', // 15
    'K..T......CCCC......T..F¥¥¥¥¥¥FK', // 16
    'K.O.......CCCC.....OO..FFFFFFFFK', // 17
    'K.........CCCC.................K', // 18
    'K....f....CCCC....f..........f.K', // 19
    'K..T......CCCC......T....T.....K', // 20 prairie (le chat est dans un de ces arbres)
    'K......T..CCCC..T...........T..K', // 21
    'K.T.......CCCCf.......T.f......K', // 22
    'KKKKKKKKKKKCCKKKKKKKKKKKKKKKKKKK', // 23 porte sud vers Saint-Ay
  ]),
  doors: [
    { x: 4,  y: 5,  interior: 'montHouse' },
    // Deuxième maison : fermée (pas d'intérieur pour l'instant).
    { x: 17, y: 5, lockedDialogue: ['[Texte provisoire] Personne ne répond...'] },
    { x: 27, y: 5, lockedDialogue: ["[Texte provisoire] La grange de M. Bouly, pleine de foin."] },
    {
      x: 17, y: 13, interior: 'school',
      lock: { ifFlags: [FLAGS.manonEcole] },
      lockedDialogue: ["[Texte provisoire] L'école est fermée pour l'instant."],
    },
  ],
  buildings: [
    { type: 'medievalHouse', x: 3,  y: 2 },
    { type: 'medievalHouse', x: 16, y: 2 },
    { type: 'school',        x: 14, y: 10 },
    { type: 'barn',          x: 25, y: 2 },
  ],
  // Le tracteur de M. Bouly : en panne, puis réparé.
  props: [
    {
      type: 'tractor', x: 24, y: 7, w: 2, h: 2, broken: true,
      unlessFlags: [FLAGS.tracteurRepare],
      dialogue: ['[Texte provisoire] Le tracteur de M. Bouly. Il fume et refuse de démarrer.'],
    },
    {
      type: 'tractor', x: 24, y: 7, w: 2, h: 2,
      ifFlags: [FLAGS.tracteurRepare],
      dialogue: ['[Texte provisoire] Le tracteur de M. Bouly ronronne comme un chat !'],
    },
  ],
  npcs: [
    // Tant que Jean ne t'a rien demandé, M. Bouly se contente de te saluer.
    {
      id: 'bouly-bonjour', name: 'M. Bouly', x: 26, y: 8, facing: 'left', color: 0x7c5c2c,
      unlessFlags: [FLAGS.jeanQuetes],
      dialogue: ['[M. Bouly - texte provisoire] Bonjour mon grand ! Belle journée pour la ferme, hein ?'],
    },
    {
      id: 'bouly', name: 'M. Bouly', x: 26, y: 8, facing: 'left', color: 0x7c5c2c,
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
      id: 'chat', name: 'Chat', x: 20, y: 21, facing: 'up', color: 0xe89030,
      ifFlags: [FLAGS.chatTrouve],
      dialogue: ['Miaou !'],
    },
  ],
  objects: [
    // L'arbre où le chat est coincé (dans la prairie, au sud).
    {
      x: 20, y: 20,
      dialogue: ["[Texte provisoire] Tu secoues l'arbre... Miaou ! Le chat tombe de l'arbre !"],
      after: ["[Texte provisoire] Il n'y a plus rien dans cet arbre."],
      setFlag: FLAGS.chatTrouve,
    },
    // Le tonneau qui cache la pièce de tracteur (une fois que M. Bouly t'en a parlé).
    { x: 29, y: 8, unlessFlags: [FLAGS.boulyDemande], dialogue: ['[Texte provisoire] Un vieux tonneau de la ferme.'] },
    {
      x: 29, y: 8,
      ifFlags: [FLAGS.boulyDemande],
      dialogue: ['[Texte provisoire] Au fond du tonneau... une pièce de tracteur !'],
      after: ['[Texte provisoire] Le tonneau est vide.'],
      item: ITEMS.pieceTracteur,
      setFlag: FLAGS.pieceTrouvee,
    },
  ],
  triggers: [
    // Porte sud : retour vers Saint-Ay (arrivée à sa sortie nord).
    ...[11, 12].map((x) => ({
      x,
      y: 23,
      readyDialogue: ['Tu prends la route de Saint-Ay.'],
      warp: { map: 'saintAy', x: 12, y: 1, facing: 'down' },
    })),
    // Porte nord : la route du Prytanée, une fois arrivé à l'école et les quêtes de Jean terminées.
    ...[11, 12].map((x) => ({
      x,
      y: 0,
      ifFlags: [FLAGS.arriveeEcole, FLAGS.chatTrouve, FLAGS.tracteurRepare],
      dialogue: [
        '[Texte provisoire] Tu as encore des choses à faire à Montépilloy :',
        'aide Jean à retrouver le chat, et M. Bouly à réparer son tracteur.',
      ],
      readyDialogue: ['Tu prends la route du Prytanée.'],
      setFlags: [FLAGS.arriveePrytanee],
      warp: { map: 'prytanee', x: 11, y: 18, facing: 'up' },
    })),
  ],
  spawn: { x: 11, y: 22, facing: 'up' },
};
