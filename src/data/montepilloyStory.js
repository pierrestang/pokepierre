import { FLAGS, ITEMS, TRAITS, carryText } from './story.js';

// Scénario de Montépilloy (voir le document « Scénarios Poké-Pierre — Montépilloy & Le collège ») : quelques
// années après l'arrivée, Pierre vit son dernier jour d'école primaire. Deux quêtes, dans n'importe quel ordre après
// l'école : la dernière partie de cache-cache, lancée à la sortie de l'école, et Ingéniosité (le tracteur de
// M. Bouly, réparé avec Jean, son petit frère). La sortie nord garde le départ ; en septembre, Pierre part à pied
// pour le collège, au village d'à côté. Pas de PNJ qui suit Pierre : ils partent devant.
// Scénettes partagées par la carte du village et les intérieurs (étapes : voir MapScene.runSteps).

// Le cache-cache terminé et Ingéniosité reçue : la journée est faite.
const DAY_DONE = { ifFlags: [FLAGS.copainsPartent], ifSouvenirs: [TRAITS.ingeniosite.id] };

// La dernière des deux quêtes finie (cache-cache ou tracteur) : la journée se termine, Pierre rentre dîner (DINNER).
const END_OF_DAY = [
  { ...DAY_DONE, say: ['Le soleil se couche sur Montépilloy. Il est temps de rentrer à la maison.'] },
  { ...DAY_DONE, setFlag: FLAGS.finJournee },
];

// Arrivée en voiture (fin de Saint-Ay), puis l'ellipse : image d'accueil, Pierre au bord de la mare.
export const MONTEPILLOY_SPOTS = { pond: { x: 19, y: 16 }, houseDoor: [9, 7] };
export const ARRIVAL = [
  { opening: { postcard: 'montepilloy', text: 'Montépilloy, Oise. Quelques années plus tard…' } },
  { setFlag: FLAGS.ellipseMontepilloy },
  { say: ['Te voilà au bord de la mare. La maison est en haut du village : toute la famille y est.'] },
];

// À la maison : Maman accueille Pierre la première fois, et présente Jean (né à Montépilloy, 8 ans).
export const MAMAN_WELCOME = [
  { approach: 'maman-mont' },
  {
    speaker: 'Maman',
    say: [
      'Te voilà ! Dernier jour d\'école primaire ! Après, le collège.',
      'Et ton petit frère Jean ne te lâchera pas : à huit ans, il veut déjà tout réparer dans la maison.',
      'Dépêche-toi, tu vas être en retard ! L\'école est en bas de la grand-rue, à droite.',
    ],
  },
  { setFlag: FLAGS.mamanAccueil },
];

// ---------- La maison : toute la famille ----------

// Maman : sa réplique suit la journée (avant l'école, après, une fois les deux quêtes finies) et rappelle ce qu'il
// reste à faire.
export const MAMAN = [
  {
    unlessFlags: [FLAGS.ecoleCm2], speaker: 'Maman',
    say: ['Dernier jour d\'école primaire ! Après, le collège.', 'File, l\'école est en bas de la grand-rue, à droite.'], end: true,
  },
  {
    ...DAY_DONE, speaker: 'Maman',
    say: ['Quelle journée ! Les vacances commencent… et à la rentrée, le collège.'], end: true,
  },
  { unlessFlags: [FLAGS.copainsPartent], speaker: 'Maman', say: ['Tes copains jouent à cache-cache dans tout le village. File les trouver !'] },
  { unlessSouvenirs: [TRAITS.ingeniosite.id], speaker: 'Maman', say: ['Et Jean cherche un assistant, là-haut dans sa chambre. Il a encore une réparation en tête…'] },
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

// À la sortie des classes, Margaux lance la dernière partie, dans tout le village (fond noir gardé : c'est Pierre
// qui ferme les yeux).
export const HIDE_AND_SEEK = [
  { approach: 'margaux-sortie' },
  { speaker: 'Margaux', say: ['Dernière partie avant les vacances. Mais cette fois, dans tout le village !'] },
  { black: true },
  { wait: 500 },
  { say: ['… huit, neuf, dix !'] },
  { setFlag: FLAGS.cacheCache },
  { black: false },
];

// Margaux, derrière les bottes de foin de la ferme ; Étienne, dans l'arbre de la prairie près de la mare ; Benoît,
// dans le tonneau du fond à gauche de la grange. Dans n'importe quel ordre : chacun trouvé suit Pierre ; le dernier
// clôt la partie (la promesse) ; les copains filent récupérer leurs cartables et disparaissent : on retrouve Margaux et
// Étienne dans la classe, Benoît seul devant la grange (BENOIT_SAD). Le tonneau de Benoît ne s'ouvre qu'à plusieurs : il est toujours le dernier.
const GAME_OVER = {
  ifFlags: [FLAGS.trouveMargaux, FLAGS.trouveEtienne, FLAGS.trouveBenoit],
  unlessFlags: [FLAGS.copainsPartent],
  steps: [
    { speaker: 'Margaux', say: ['Alors on la refait l\'été prochain. Promis ?'] },
    { speaker: 'Étienne', say: ['C\'était trop cool, cette partie !'] },
    { speaker: 'Margaux', say: ['Allez, on file à l\'école récupérer nos cartables !'] },
    { unlessSouvenirs: [TRAITS.ingeniosite.id], speaker: 'Benoît', say: ['Au fait, ton petit frère te cherche !'] },
    { sound: 'door' },
    { setFlag: FLAGS.copainsPartent },
    ...END_OF_DAY,
  ],
};

export const FOUND_MARGAUX = [
  { emote: 'player', kind: 'surprise' },
  { say: ['Quelque chose bouge derrière les bottes de foin…'] },
  { emerge: { id: 'margaux', name: 'Margaux', from: [[12, 22], [11, 22], [12, 21], [11, 21]] } },
  { speaker: 'Margaux', say: ['Zut, trouvée ! Les bottes de foin, c\'était trop facile…', 'L\'an prochain, au collège, je me trouverai une cachette imbattable. Je viens avec toi chercher les autres !'] },
  { setFlag: FLAGS.trouveMargaux },
  GAME_OVER,
];

export const FOUND_ETIENNE = [
  { emote: 'player', kind: 'surprise' },
  { say: ['Des feuilles tombent… Étienne est perché dans l\'arbre !'] },
  { emerge: { id: 'etienne', name: 'Étienne', from: [[26, 17]] } },
  { speaker: 'Étienne', say: ['Perdu ! Le collège, c\'est en septembre. Paraît qu\'il y a des casiers, j\'espère qu\'on sera dans la même classe.', 'Je t\'aide à chercher les autres !'] },
  { setFlag: FLAGS.trouveEtienne },
  GAME_OVER,
];

// Benoît, dans le tonneau du fond à gauche de la grange (pas celui de la pièce du tracteur, au fond à droite) : le
// couvercle ne s'ouvre qu'à plusieurs, une fois Margaux et Étienne trouvés (ils suivent Pierre) : Esprit d'équipe.
const BENOIT_LEFT = { ifFlags: [FLAGS.cacheCache], unlessFlags: [FLAGS.trouveBenoit] };
const STUCK = 'Le couvercle ne bouge pas. On dirait qu\'on le retient de l\'intérieur… Il faudrait être plusieurs pour le soulever.';
export const BENOIT_BARREL = [0, 4];
export const FOUND_BENOIT = [
  { unlessFlags: [FLAGS.trouveMargaux], say: [STUCK], end: true },
  { unlessFlags: [FLAGS.trouveEtienne], say: [STUCK], end: true },
  { useTrait: TRAITS.espritEquipe },
  { say: ['Margaux et Étienne t\'aident à tirer sur le couvercle… Il cède !'] },
  { emote: 'player', kind: 'surprise' },
  { emerge: { id: 'benoit', name: 'Benoît', from: [BENOIT_BARREL] } },
  { speaker: 'Benoît', say: ['Tu m\'as trouvé… c\'était ma dernière partie avec vous. L\'an prochain, je ne serai pas au collège avec vous.'] },
  { setFlag: FLAGS.trouveBenoit },
  GAME_OVER,
];
export const BENOIT_HIDING = { ...BENOIT_LEFT, x: BENOIT_BARREL[0], y: BENOIT_BARREL[1], script: FOUND_BENOIT };

// ---------- La quête de Jean → Ingéniosité ----------

// Jean, devant le tracteur (le tracteur occupe les cases x 10-11, y 12-13) ; l'escalier de la chambre des enfants.
export const JEAN_AT_TRACTOR = [10, 14];
const JEAN_UPSTAIRS_STAIRS = [12, 2];

// Jean, à l'étage de la maison : après l'école, il lance la quête, descend l'escalier et part devant à la ferme (il y
// est, sous le tracteur, à l'arrivée de Pierre).
export const JEAN = [
  {
    unlessFlags: [FLAGS.ecoleCm2], speaker: 'Jean',
    say: ['Salut grand frère ! Je répare le grille-pain. Enfin… je l\'ai démonté. Presque pareil.', 'Dépêche-toi, tu vas être en retard à l\'école !'], end: true,
  },
  { speaker: 'Jean', say: ['Le tracteur de M. Bouly est en panne. Je peux le réparer, mais il me faut un assistant.', 'Rejoins-moi à la ferme !'] },
  { walk: 'jean-maison', to: JEAN_UPSTAIRS_STAIRS, block: true, then: [FLAGS.jeanQuetes] },
];

// « Passe-moi la clé ! » : Jean, sous le tracteur, réclame trois outils ; Pierre les prend dans la caisse.
const TOOLS = ['La clé de 12', 'Le tournevis plat', 'Le gros marteau', 'Le petit marteau', 'Une cuillère'];
const WRONG_TOOL = {
  'Une cuillère': ['Ça, c\'est une cuillère. Qui a mis une cuillère dans ma caisse ?'],
  'Le gros marteau': ['Le gros ? Tu veux casser le tracteur ?'],
  default: ['Non, pas ça ! Regarde bien dans la caisse.'],
};
const tool = (question, answer) => ({ quiz: { speaker: 'Jean', question, answer, choices: TOOLS, wrong: WRONG_TOOL } });

// La réparation, une fois la pièce rapportée (à M. Bouly ou à Jean, voir BOULY et JEAN_TRACTOR).
const REPAIR = [
  { take: ITEMS.pieceTracteur.id },
  { say: ['Jean ouvre sa caisse à outils et se glisse sous le tracteur.'] },
  { speaker: 'Jean', say: ['Passe-moi la clé !'] },
  tool('La clé de 12 !', 'La clé de 12'),
  tool('Le tournevis plat !', 'Le tournevis plat'),
  tool('Le marteau… non, le petit !', 'Le petit marteau'),
  { sound: 'engine' },
  { say: ['Le moteur tousse… puis repart !'] },
  { speaker: 'Jean', say: ['À nous deux, on répare tout.', 'Il sent le gasoil, c\'est trop bien.'] },
  { trait: TRAITS.ingeniosite },
  { speaker: 'M. Bouly', say: ['Bravo, les garçons ! Allez, Jean, grimpe : on va faire un tour de tracteur !'] },
  { black: true },
  { setFlag: FLAGS.tracteurRepare },
  { sound: 'engine' },
  { say: ['M. Bouly emmène Jean faire un tour de tracteur dans les champs.'] },
  { black: false },
  { say: ['La caisse à outils de Jean est restée là.'] },
  ...END_OF_DAY,
];

// M. Bouly, à la ferme : il dit seulement bonjour tant que Jean ne t'a rien demandé (PNJ à part, voir la carte) ;
// ensuite, il parle de la pièce qui manque.
export const BOULY = [
  { ifItems: [ITEMS.pieceTracteur.id], speaker: 'M. Bouly', say: ['La pièce ! Jean, à toi de jouer.'] },
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

// Jean, sous le tracteur : il attend la pièce ; on peut aussi la lui donner directement.
export const JEAN_TRACTOR = [
  { ifItems: [ITEMS.pieceTracteur.id], speaker: 'Jean', say: ['La pièce ! Parfait, passe-la-moi.'] },
  { ifItems: [ITEMS.pieceTracteur.id], steps: REPAIR, end: true },
  { speaker: 'Jean', say: ['Il manque une pièce à ce tracteur. Va voir M. Bouly, il sait peut-être où elle est.'] },
];


// Facultatif : après le cache-cache, Benoît est assis seul devant la grange ; Pierre le fait rire (Joie de vivre).
export const BENOIT_SAD = [
  { ifFlags: [FLAGS.benoitConsole], speaker: 'Benoît', say: ['Le vase… j\'y pense encore.'], end: true },
  { speaker: 'Benoît', say: ['Margaux et Étienne iront au collège ensemble. Moi, je pars ailleurs. Je connaîtrai personne.'] },
  { useTrait: TRAITS.joie },
  { say: ['Tu lui racontes la fois où Fanny a failli casser le vase de Maman… Benoît éclate de rire.'] },
  { speaker: 'Benoît', say: ['T\'es bête… Merci. Je t\'écrirai.'] },
  { setFlag: FLAGS.benoitConsole },
];

// Objet-souvenir : la cuillère de la caisse à outils de Jean, restée devant le tracteur après la réparation (la caisse
// disparaît une fois la cuillère prise).
export const TOOLBOX = [
  { say: ['La caisse à outils de Jean. Tout au fond, entre deux clés… la cuillère !'] },
  { give: ITEMS.cuillere, text: 'Tu prends la cuillère. Un souvenir de votre réparation.' },
];

// ---------- Le départ → le collège ----------

// Le soir de la dernière vertu, à la maison : le dîner en famille, puis l'ellipse jusqu'en septembre, devant la maison.
export const DINNER = [
  { say: ['Le soir, toute la famille est à table.'] },
  { speaker: 'Jean', say: ['On a réparé le tracteur de M. Bouly ! Enfin… surtout moi.'] },
  { speaker: 'Papa', say: ['Bravo, les garçons. Profitez bien de l\'été.'] },
  { speaker: 'Maman', say: ['Et en septembre, c\'est le collège !'] },
  { black: true },
  { wait: 600 },
  { setFlag: FLAGS.septembre },
  { travel: { map: 'montepilloy', x: 9, y: 7, facing: 'down' } },
];

// Septembre, devant la maison, au matin : la famille dit au revoir à Pierre, cartable sur le dos.
export const SEPTEMBER_MORNING = [
  { opening: { postcard: 'montepilloySeptembre', text: 'Quelques mois plus tard… Septembre.' } },
  { say: ['Devant la maison, au matin. Tu as ton cartable sur le dos.'] },
  { speaker: 'Maman', say: ['Premier jour de collège. Tu as tout ?'] },
  { speaker: 'Papa', say: ['Il a tout. Il a même vérifié deux fois.'] },
  { speaker: 'Jean', say: ['Tu me raconteras comment c\'est ?'] },
  { say: ['Le collège est au village d\'à côté : tu y vas à pied, par la sortie nord.'] },
  { setFlag: FLAGS.departCollege },
];

// La sortie nord, gardienne du départ : elle rappelle ce qu'il reste à faire ; en septembre, Pierre part à pied pour
// le collège.
export const NORTH_EXIT = [
  { ifFlags: [FLAGS.departCollege], say: ['Tu prends la route du collège, ton cartable sur le dos.'] },
  // Le premier départ : l'encart des vertus emportées, comme à la fin des trajets.
  { ifFlags: [FLAGS.departCollege], unlessFlags: [FLAGS.collegeOuverture], say: [carryText('montepilloy')] },
  { ifFlags: [FLAGS.departCollege], travel: { map: 'routeBonsecours', x: 10, y: 27, facing: 'up' }, end: true },
  { ...DAY_DONE, say: ['Il se fait tard : rentre plutôt dîner à la maison.'], end: true },
  { say: ['Ta journée n\'est pas finie.'] },
  { unlessFlags: [FLAGS.ecoleCm2], say: ['C\'est le dernier jour de CM2 : file à l\'école, en bas de la grand-rue !'], end: true },
  { unlessFlags: [FLAGS.copainsPartent], say: ['Tes copains t\'attendent pour leur partie de cache-cache.'] },
  { unlessSouvenirs: [TRAITS.ingeniosite.id], say: ['Et Jean a un tracteur à réparer avec toi.'] },
];
