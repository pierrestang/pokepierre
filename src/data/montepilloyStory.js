import { FLAGS, ITEMS, ROLES } from './story.js';

// Scénario de Montépilloy (voir le document « Montépilloy ») : quelques années après l'arrivée, Pierre vit son
// dernier jour d'école primaire. Deux titres, dans n'importe quel ordre : « Les copains de Montépilloy » (la
// dernière partie de cache-cache, lancée à la sortie de l'école) et « Bricoleur » (le tracteur de M. Bouly, réparé
// avec Jean, son petit frère). Puis, en septembre, il part à pied pour le collège, par la sortie nord.
// Scénettes partagées par la carte du village et les intérieurs (étapes : voir MapScene.runSteps).

// Arrivée en voiture (fin de Saint-Ay), puis l'ellipse : Pierre, face à la mare. Manon vient le chercher (Maman
// le cherche) et rentre à la maison ; il la suit (elle l'attend s'il traîne).
export const MONTEPILLOY_SPOTS = { pond: { x: 19, y: 16 }, houseDoor: [9, 7] };
export const MANON_WALK = [{ walk: 'manon-arrivee', to: MONTEPILLOY_SPOTS.houseDoor, lead: true, then: [FLAGS.manonMaison] }];
export const ELLIPSIS = [
  { black: true },
  { wait: 400 },
  { say: ['Montépilloy, Oise. Quelques années plus tard…'] },
  { setFlag: FLAGS.ellipseMontepilloy },
  { black: false },
  { approach: 'manon-arrivee' },
  { speaker: 'Manon', say: ['Ah, te voilà ! Maman te cherche partout. Viens, suis-moi !'] },
  { setFlag: FLAGS.manonGuide },
  ...MANON_WALK,
];

// À la maison : Maman accueille Pierre, que Manon a ramené.
export const MAMAN_WELCOME = [
  { approach: 'maman-mont' },
  { speaker: 'Maman', say: ['Te voilà ! Dernier jour d\'école primaire ! Après, le collège.', 'Dépêche-toi, tu vas être en retard !'] },
  { setFlag: FLAGS.mamanAccueil },
];

// Le tracteur réparé (dernière quête) : ellipse jusqu'en septembre, la famille devant la maison (voir
// SEPTEMBER_MORNING).
const TO_SEPTEMBER = [
  { black: true },
  { wait: 400 },
  { say: ['Septembre.'] },
  { setFlag: FLAGS.septembre },
  { travel: { map: 'montepilloy', x: 9, y: 7, facing: 'down' } },
];

// Septembre, devant la maison, au matin : la famille dit au revoir à Pierre, cartable sur le dos.
export const SEPTEMBER_MORNING = [
  { say: ['Devant la maison, au matin. Tu as ton cartable sur le dos.'] },
  { speaker: 'Maman', say: ['Premier jour de collège. Tu as tout ?'] },
  { speaker: 'Papa', say: ['Il a tout. Il a même vérifié deux fois.'] },
  { speaker: 'Jean', say: ['Tu me raconteras comment c\'est ?'] },
  { say: ['Le collège est au nord, au bout de la grand-rue.'] },
  { setFlag: FLAGS.departCollege },
];

// La sortie nord : en septembre, Pierre part à pied pour le collège ; avant, ce qu'il reste à faire.
// La suite de l'histoire (le Prytanée) n'est pas encore réécrite : la route y mène en attendant.
export const NORTH_EXIT = [
  { ifFlags: [FLAGS.departCollege], say: ['Tu prends la route du collège, ton cartable sur le dos.'] },
  { ifFlags: [FLAGS.departCollege], setFlag: FLAGS.arriveePrytanee },
  { ifFlags: [FLAGS.departCollege], travel: { map: 'prytanee', x: 14, y: 21, facing: 'up' }, end: true },
  {
    unlessSouvenirs: [ROLES.copainsMontepilloy.id],
    say: ['Les copains t\'attendent pour la dernière partie de cache-cache, à la sortie de l\'école.'],
  },
  { unlessSouvenirs: [ROLES.bricoleur.id], say: ['Et Jean compte sur toi pour réparer le tracteur de M. Bouly.'] },
];

// ---------- La maison : toute la famille ----------

// Maman : sa réplique suit la journée (avant l'école, après l'école).
export const MAMAN = [
  { ifFlags: [FLAGS.ecoleCm2], speaker: 'Maman', say: ['Alors, ce dernier jour ? Profite de tes copains, l\'été passe vite.'], end: true },
  { speaker: 'Maman', say: ['Dernier jour d\'école primaire ! Après, le collège.'] },
];

export const PAPA = [
  { speaker: 'Papa', say: ['Le dernier jour, déjà. On est arrivés à Montépilloy, tu tenais à peine sur le siège arrière.'] },
];

// ---------- L'école et le cache-cache ----------

// En entrant à l'école : dernier jour de CM2.
export const LAST_DAY = [
  { say: ['C\'est le dernier jour de CM2.'] },
  { setFlag: FLAGS.ecoleCm2 },
];

// À la sortie des classes, Margaux lance la dernière partie, dans tout le village.
export const HIDE_AND_SEEK = [
  { approach: 'margaux-sortie' },
  { speaker: 'Margaux', say: ['Dernière partie avant les vacances. Mais cette fois, dans tout le village !'] },
  { black: true },
  { wait: 500 },
  { say: ['… huit, neuf, dix !'] },
  { setFlag: FLAGS.cacheCache },
  { black: false },
];

// Margaux, derrière les bottes de foin de la ferme ; Étienne, dans l'arbre de la prairie à côté de la mare.
// Une fois trouvés, ils suivent Pierre jusqu'à la fin de la partie.
export const FOUND_MARGAUX = [
  { emote: 'player', kind: 'surprise' },
  { say: ['Margaux était accroupie derrière les bottes de foin.'] },
  { speaker: 'Margaux', say: ['Trouvée… L\'an prochain, au collège, on sera peut-être dans la même classe.'] },
  { setFlag: FLAGS.trouveMargaux },
];

export const FOUND_ETIENNE = [
  { emote: 'player', kind: 'surprise' },
  { say: ['Des feuilles tombent… Étienne est perché dans l\'arbre !'] },
  { speaker: 'Étienne', say: ['Perdu ! L\'an prochain, on ira au collège ensemble. Tu m\'attends le matin ?'] },
  { setFlag: FLAGS.trouveEtienne },
];

// Benoît, le dernier, dans un tonneau de la grange (à gauche, pas celui de la pièce du tracteur) : il ne se
// trahit qu'une fois les deux autres trouvés.
const BENOIT_LEFT = { ifFlags: [FLAGS.cacheCache, FLAGS.trouveMargaux, FLAGS.trouveEtienne], unlessSouvenirs: [ROLES.copainsMontepilloy.id] };
export const BENOIT_BARREL = [0, 4];
export const BARREL_MOVES = {
  on: 'enter',
  ...BENOIT_LEFT,
  steps: [
    { emote: BENOIT_BARREL, kind: 'dots' },
    { say: ['Un tonneau, au fond à gauche, bouge tout seul…'] },
  ],
};
export const FOUND_BENOIT = [
  { emote: 'player', kind: 'surprise' },
  { speaker: 'Benoît', say: ['Tu m\'as trouvé… Bon, c\'était ma dernière partie avec vous. L\'an prochain, je ne serai pas au collège avec vous.'] },
  { speaker: 'Margaux', say: ['Alors on la refait l\'été prochain. Promis ?'] },
  { quality: ROLES.copainsMontepilloy },
  { say: ['Les copains retournent à l\'école récupérer leurs cartables.'] },
];
export const BENOIT_HIDING = { ...BENOIT_LEFT, x: BENOIT_BARREL[0], y: BENOIT_BARREL[1], script: FOUND_BENOIT };

// ---------- La quête de Jean : Bricoleur ----------

// Jean, à l'étage : une fois la partie de cache-cache finie, il emmène Pierre comme assistant (il le suit
// jusqu'au tracteur).
export const JEAN = [
  {
    unlessFlags: [FLAGS.cacheCache], speaker: 'Jean',
    say: ['Dépêche-toi, tu vas être en retard à l\'école ! Ce soir, j\'aurai un truc à te demander.'], end: true,
  },
  {
    unlessSouvenirs: [ROLES.copainsMontepilloy.id], speaker: 'Jean',
    say: ['Tu ne devais pas jouer à cache-cache avec les copains ? Finis ta partie, après j\'ai besoin de toi.'], end: true,
  },
  { speaker: 'Jean', say: ['Le tracteur de M. Bouly est en panne. Je peux le réparer, mais il me faut un assistant.'] },
  { say: ['Jean attrape sa caisse à outils et te suit.'] },
  { setFlag: FLAGS.jeanQuetes },
];

// « Passe-moi la clé ! » : Jean, sous le tracteur, réclame trois outils ; Pierre les prend dans la caisse.
const TOOLS = ['La clé de 12', 'Le tournevis plat', 'Le gros marteau', 'Le petit marteau', 'Une cuillère'];
const WRONG_TOOL = {
  'Une cuillère': ['Ça, c\'est une cuillère. Qui a mis une cuillère dans ma caisse ?'],
  'Le gros marteau': ['Le gros ? Tu veux casser le tracteur ?'],
  default: ['Non, pas ça ! Regarde bien dans la caisse.'],
};
const tool = (question, answer) => ({ quiz: { speaker: 'Jean', question, answer, choices: TOOLS, wrong: WRONG_TOOL } });

// Jean, devant le tracteur pendant la réparation (le tracteur occupe les cases x 10-11, y 12-13).
export const JEAN_AT_TRACTOR = [10, 14];

const REPAIR = [
  { speaker: 'M. Bouly', say: ['La pièce ! Jean, à toi de jouer.'] },
  { take: ITEMS.pieceTracteur.id },
  { setFlag: FLAGS.jeanTracteur },
  { walk: 'jean', to: JEAN_AT_TRACTOR, block: true },
  { say: ['Jean pose sa caisse à outils devant le tracteur et se met au travail.'] },
  { speaker: 'Jean', say: ['Passe-moi la clé !'] },
  tool('La clé de 12 !', 'La clé de 12'),
  tool('Le tournevis plat !', 'Le tournevis plat'),
  tool('Le marteau… non, le petit !', 'Le petit marteau'),
  { sound: 'engine' },
  { say: ['Le moteur tousse… puis repart !'] },
  { speaker: 'Jean', say: ['Tu vois ? À nous deux, on répare tout. T\'es un bricoleur, toi aussi.'] },
  { quality: ROLES.bricoleur },
  { setFlag: FLAGS.tracteurRepare },
  ...TO_SEPTEMBER,
];

// M. Bouly, à la ferme : il dit seulement bonjour tant que Jean ne t'a rien demandé (PNJ à part, voir la carte).
export const BOULY = [
  { ifItems: [ITEMS.pieceTracteur.id], steps: REPAIR, end: true },
  {
    unlessFlags: [FLAGS.boulyDemande], speaker: 'M. Bouly',
    say: [
      'Ah, Jean et son assistant ! Mon tracteur est en panne : il lui manque une pièce.',
      'Elle doit traîner quelque part… peut-être dans un des tonneaux de la grange ?',
    ],
  },
  { unlessFlags: [FLAGS.boulyDemande], setFlag: FLAGS.boulyDemande, end: true },
  { speaker: 'M. Bouly', say: ['La pièce doit être dans un des tonneaux de la grange.'] },
];

// La pièce, au fond du tonneau du fond à droite de la grange (une fois que M. Bouly en a parlé).
export const PART_BARREL = { x: 8, y: 3 };
