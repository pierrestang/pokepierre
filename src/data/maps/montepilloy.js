import { parseGrid } from './parseGrid.js';
import { FLAGS, ITEMS } from '../story.js';

// Montépilloy (Oise) — village médiéval façon Rouge Feu, 30 x 24 cases : grand-rue pavée nord-sud (route du
// Prytanée au nord, de Saint-Ay au sud), deux rues pavées et la place du puits ; la maison de la famille (toit
// rouge) et celle de la voisine (toit vert) ; la butte rocheuse des ruines du château, avec son escalier ;
// l'école (auvent vert) ; la ferme de M. Bouly (grange orange, tonneaux, tracteur, champ de blé) ; au sud, la
// prairie et l'arbre où le chat de Jean se cache. Ceinture d'arbres.
// Légende : voir src/data/tiles.js (ɔ = pavés, U = puits, O = tonneau, ʬ = blé, F = barrière, ɟ / ɺ = butte
// rocheuse (bloquante / praticable), T = arbre, ƚ = petit arbre, ƀ = buisson, f = fleurs, ĥ = hautes herbes,
// S = panneau, M = boîte aux lettres, R / W / D = toit, mur, porte des bâtiments)
export const montepilloyMap = {
  id: 'montepilloy',
  name: 'Montépilloy',
  grid: parseGrid([
    'TTTTTTTTTTTTTTɔɔTTTTTTTTTTTTTT', // 0
    'TTTTTTTTTTTTTTɔɔTTTTTTTTTTTTTT', // 1
    'TT.ƚ..........ɔɔS.........ƚ.TT', // 2
    'TT..RRRRR....ƚɔɔ....RRRRR...TT', // 3
    'TT..RRRRR.fff.ɔɔ.ff.RRRRR...TT', // 4
    'TT..WWWWW.fff.ɔɔ.ff.WWWWW...TT', // 5
    'TT..WDWWWMfff.ɔɔ...MWDWWW...TT', // 6
    'TT.ɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔ.TT', // 7
    'TT.ɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔ.TT', // 8
    'TT........ɔɔɔɔɔɔɔɔɔɔ........TT', // 9
    'TT.ɟɟɟɟ...ɔɔɔɔɔɔɔUɔɔ........TT', // 10
    'TT.ɟɟɟɟ.RRRRRɔɔɔɔɔɔɔRRRR.OO.TT', // 11
    'TT.ɟɺɺɟ.RRRRR.ɔɔ....RRRR..O.TT', // 12
    'TT.ɟɺɺɟSWWWWW.ɔɔ..S.WWWW....TT', // 13
    'TT......WDWWW.ɔɔ....WDWW....TT', // 14
    'TTƀɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔ.TT', // 15
    'TT.ɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔ.TT', // 16
    'TTƚ...........ɔɔ..FFFFFFFFF.TT', // 17
    'TT..TT..ĥĥĥĥ..ɔɔ..FʬʬʬʬʬʬʬF.TT', // 18
    'TT..TT..ĥĥĥĥ..ɔɔƀ.FʬʬʬʬʬʬʬF.TT', // 19
    'TT......ĥĥĥĥ..ɔɔ..FʬʬʬʬʬʬʬF.TT', // 20
    'TT.ƀ...ƚ....ƚ.ɔɔ..FFFFFFFFF.TT', // 21
    'TTTTTTTTTTTTTTɔɔTTTTTTTTTTTTTT', // 22
    'TTTTTTTTTTTTTTɔɔTTTTTTTTTTTTTT', // 23
  ]),
  doors: [
    { x: 5, y: 6, interior: 'montHouse' },
    // Maison de la voisine : fermée (pas d'intérieur pour l'instant).
    { x: 21, y: 6, lockedDialogue: ['Personne ne répond.'] },
    { x: 21, y: 14, lockedDialogue: ['La grange de M. Bouly, pleine de foin.'] },
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
    { type: 'fishingHut', x: 20, y: 11 },
  ],
  // Le tracteur de M. Bouly : en panne, puis réparé.
  props: [
    {
      type: 'tractor', x: 24, y: 13, w: 2, h: 2, broken: true,
      unlessFlags: [FLAGS.tracteurRepare],
      dialogue: ['[Texte provisoire] Le tracteur de M. Bouly. Il fume et refuse de démarrer.'],
    },
    {
      type: 'tractor', x: 24, y: 13, w: 2, h: 2,
      ifFlags: [FLAGS.tracteurRepare],
      dialogue: ['[Texte provisoire] Le tracteur de M. Bouly ronronne comme un chat !'],
    },
  ],
  npcs: [
    // Tant que Jean ne t'a rien demandé, M. Bouly se contente de te saluer.
    {
      id: 'bouly-bonjour', name: 'M. Bouly', x: 24, y: 12, facing: 'down', color: 0x7c5c2c,
      unlessFlags: [FLAGS.jeanQuetes],
      dialogue: ['[M. Bouly - texte provisoire] Bonjour mon grand ! Belle journée pour la ferme, hein ?'],
    },
    {
      id: 'bouly', name: 'M. Bouly', x: 24, y: 12, facing: 'down', color: 0x7c5c2c,
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
    { x: 18, y: 13, dialogue: ['Ferme de M. Bouly.'] },
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
    { x: 26, y: 12, unlessFlags: [FLAGS.boulyDemande], dialogue: ['[Texte provisoire] Un vieux tonneau de la ferme.'] },
    {
      x: 26, y: 12,
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
