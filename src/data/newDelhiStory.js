import { FLAGS, ITEMS, TRAITS } from './story.js';

// Scénario de Delhi : un semestre d'échange étudiant, Pierre loge à l'internat. Le plus grand choc culturel du
// voyage : une ville dense et grouillante, une grande joie de vivre, et quelque chose de très ancien. Pas de vertu
// nouvelle (la 8e se gagne à Paris) : Joie de vivre sert à la fête, mais à l'envers (ce sont les autres qui
// donnent à Pierre). Aucune ligne « Objectif : », une seule ellipse.
//   1. L'arrivée : la foule de la grande avenue ; Pierre n'a jamais rien vu de pareil. Au bout de l'avenue, Prophecy
//      (de la bande de Hull, qui enchaîne son échange aux États-Unis par ce semestre) l'accueille ; Harsh, étudiant
//      d'ici, vient se présenter à tous les deux ; on le suit à pied jusqu'à la porte du palais de grès.
//   2. La fête, dans la cour du palais : le grand repas partagé, assis en cercle par terre ; on sert Pierre de tous les
//      côtés (Joie de vivre, à l'envers : il apprend à recevoir). Harsh et Prophecy suivent ensuite Pierre.
//   3. Derrière la vieille porte du fort : le silence, le vieux sage, le talisman indien (une pierre gravée). Ni vertu ni mini-jeu.
//   4. En sortant du fort : « Quelques mois plus tard… » (la seule ellipse de la ville).
//   5. Devant le fort, Prophecy : on rentre à Bordeaux ; à pied jusqu'à l'aéroport, Prophecy avec Pierre ; l'avion.
// Scénettes partagées par la carte et les intérieurs (étapes : voir MapScene.runSteps).

// ---------- 1. L'arrivée ----------

// Au milieu de la foule, quelques pas après l'aéroport (déclencheurs de maps/newDelhi.js).
// Les tuk-tuks, la foule, le bruit : Pierre s'y retrouve grâce à Adaptation (reçue à Hanoï) ; c'est ce qui ouvre la suite
// (Prophecy ne l'attend qu'après, voir maps/newDelhi.js).
export const CROWD = [
  { emote: 'player', kind: 'surprise' },
  { say: ['Des tuk-tuks qui klaxonnent, une foule qui te bouscule, du bruit de partout… Je n\'ai jamais rien vu de pareil.'] },
  { useTrait: TRAITS.adaptation },
  { say: ['Tu respires, tu observes, et tu fais comme les gens d\'ici : tu te glisses dans le flot, sans lutter.'] },
  { say: ['Prophecy m\'a écrit : il m\'attend au bout de la grande avenue, vers l\'est.'] },
  { setFlag: FLAGS.delhiFoule },
];

// Les passants de la grande avenue : un mot chacun.
export const PASSERS_BY = {
  curieux: ['Oh, un étranger ! Tu viens d\'où ? … La France ! Bienvenue, bienvenue !'],
  presse: ['Pardon, pardon ! Ici, tout le monde est pressé, mais personne n\'est en retard.'],
  photo: ['Une photo avec moi ? Mes cousins ne vont jamais me croire !'],
  conseil: ['Première fois ici ? Ça se voit, tu regardes partout ! Garde les yeux ouverts, tu ne verras jamais tout.'],
  etudiante: ['Tu es nouveau à l\'université ? Tu vas voir, ici, on n\'est jamais seul.'],
  grandMere: ['Mange bien, mon garçon ! Tu es tout maigre.'],
  marcheur: ['Le soir, l\'avenue est encore plus pleine. Si, si, c\'est possible !'],
  rieur: ['Ha ha ! Tu as l\'air perdu. Ne t\'en fais pas : tout le monde se perd ici, au début.'],
  silencieux: ['Le passant te sourit et te fait signe de passer devant.'],
};

// Les habitants du quartier sud (maisons, internat, place du bazar).
export const NEIGHBOURS = {
  ancien: ['Ici, tout le monde se connaît. Bientôt, on te connaîtra aussi.'],
  voisine: ['Tu es l\'étudiant français de l\'internat ? Bienvenue dans le quartier !'],
  livreur: ['Pardon ! Je livre tout le quartier, et je suis en retard… comme tous les jours !'],
  internat: ['L\'internat, c\'est la maison à toit plat. Le soir, on fait un peu de bruit. Désolé d\'avance !'],
  enfants: ['On joue au ballon ! Tu veux être dans notre équipe ?'],
  bazar: ['Le bazar ouvre demain matin. Il y aura du monde, crois-moi !'],
};

// Au bout de l'avenue, Prophecy (retrouvailles prévues) ; puis Harsh vient vers eux deux : il ne connaît ni l'un ni
// l'autre. Puis il part devant, à pied, vers la porte du palais de grès (la cour de la fête) ; Prophecy suit Pierre, et
// tous deux suivent Harsh (rien n'est automatique : on marche jusqu'à la cour).
export const PALACE_DOOR_FRONT = [16, 12];
// Harsh part devant (il attend Pierre s'il traîne), puis entre dans la cour.
export const HARSH_WALK = { walk: 'harsh', to: PALACE_DOOR_FRONT, lead: true, then: [FLAGS.harshCour] };
export const PROPHECY_WELCOME = [
  { emote: 'prophecy', kind: 'surprise' },
  { approach: 'prophecy' },
  { speaker: 'Prophecy', say: ['Pierre ! Te voilà enfin ! Ça y est, on y est. L\'Inde, pour de vrai.'] },
  { setFlag: FLAGS.prophecyDelhi },
  { approach: 'harsh' },
  { speaker: 'Harsh', say: ['Vous êtes les étudiants en échange, c\'est ça ? Moi c\'est Harsh ! Venez, je vais vous montrer.', 'Aujourd\'hui, il y a une fête dans la cour du palais de grès. Suivez-moi !'] },
  HARSH_WALK,
];

// Harsh, s'il attend encore devant la porte du palais (ou qu'on lui reparle en chemin).
export const HARSH_LEADING = [
  { speaker: 'Harsh', say: ['C\'est par ici : la porte du palais de grès. Entrez, la fête a commencé !'] },
];

// ---------- 2. La fête (Joie de vivre) ----------

// Dans la cour du palais, en plein jour (interiors.js delhiCour) : le grand repas partagé. Tout le monde est assis
// en cercle par terre, autour d'un tapis couvert de plats. Prophecy, qui suivait Pierre, devient le PNJ `prophecy-fete`
// et s'assoit ; Harsh fait asseoir Pierre à côté de lui. Joie de vivre, dans le sens renversé : ce sont les autres qui
// donnent, de tous les côtés ; Pierre, débordé, apprend à recevoir (étape `pass` : les assiettes glissent vers lui).
export const MEAL_SEATS = { pierre: [9, 10], harsh: [9, 11], prophecy: [10, 12] };
// La sortie de la cour (au-dessus du tapis de sortie, en bas au milieu).
const COUR_EXIT = [11, 16];
const LEFT = ['etudiante-fete', 'harsh-fete'];
const ACROSS = ['ben-fete', 'grand-mere-fete', 'margaux-fete', 'voisin-fete'];
export const DELHI_PARTY = [
  { setFlag: FLAGS.courArrivee },
  { say: ['Le repas d\'intégration des étudiants français : tout le monde est assis en cercle, autour d\'un grand repas.'] },
  { walk: 'prophecy-fete', to: MEAL_SEATS.prophecy, block: true },
  { face: { 'prophecy-fete': 'up' }, sit: { 'prophecy-fete': true } },
  { walk: 'harsh-fete', to: MEAL_SEATS.harsh, block: true },
  { face: { 'harsh-fete': 'right' }, sit: { 'harsh-fete': true } },
  { goTo: MEAL_SEATS.pierre, facing: 'right' },
  { sit: { player: true } },
  {
    speaker: 'Harsh',
    say: ['Bienvenue à l\'université ! On est tellement heureux de vous recevoir. Vous connaissez notre dicton ? Atithi Devo Bhava : l\'invité est un dieu. Ici, vous êtes chez vous.'],
  },
  { pass: 'etudiante-fete' },
  { pass: 'harsh-fete' },
  { pass: ACROSS },
  // La bande de Delhi, les cinq autres étudiants français de l'échange : une réplique chacun.
  { speaker: 'Ben', say: ['Franchement, je m\'attendais pas à un accueil pareil !'] },
  { speaker: 'Aaron', say: ['Goûtez-moi ça, c\'est une tuerie.'] },
  { speaker: 'Margaux', say: ['On est à l\'autre bout du monde, vous réalisez ?'] },
  { speaker: 'Brieux', say: ['Moi j\'ai déjà envie de rester un an de plus.'] },
  { speaker: 'Jules', say: ['Bon, qui m\'explique comment on mange ça ?'] },
  { emote: 'player', kind: 'dots' },
  { say: ['Je ne sais même pas quoi faire de toute cette générosité. Juste… l\'accepter, peut-être.'] },
  { useTrait: TRAITS.joie },
  { say: ['Tu goûtes à tout, tu ris, et tu tends à ton tour le plat à ton voisin.'] },
  { pass: LEFT },
  { sit: { player: false, 'harsh-fete': false, 'prophecy-fete': false } },
  { speaker: 'Harsh', say: ['Venez, je veux vous montrer un endroit très ancien : derrière la vieille porte du fort, de l\'autre côté de l\'avenue !'] },
  // Harsh part seul, le premier ; le joueur reprend la main pendant qu'il s'en va (fin de la scénette), et Prophecy le
  // suit dès que Harsh a quitté la cour (FOLLOWERS). Pierre sort de la cour et traverse l'avenue lui-même.
  { walk: 'harsh-fete', to: COUR_EXIT, block: true },
  { setFlag: FLAGS.feteDelhi },
];

// Sur la carte : Harsh attend devant la porte du fort (newDelhi.js) ; quand Pierre arrive devant la porte (Prophecy le
// suit), ils entrent ensemble (Harsh les suit à nouveau, story.js FOLLOWERS).
export const FORT_DOOR_FRONT = [27, 10];
export const JOIN_HARSH = [
  { face: { player: 'right', 'harsh-fete': 'left' } },
  { speaker: 'Harsh', say: ['Vous voilà. C\'est ici : la vieille porte du fort. Entrons.'] },
  { setFlag: FLAGS.harshRejoint },
  { face: { player: 'up' } },
  { travel: { interior: 'delhiFort' } },
];

// Les convives, assis autour du repas (le repas continue à chaque visite).
export const GUESTS = {
  etudiante: ['Tu reviens ? Il y a toujours une place pour toi, et toujours de quoi manger !'],
  // La bande de Delhi : les cinq autres étudiants français de l'échange (répliques du repas d'intégration).
  ben: ['Franchement, je m\'attendais pas à un accueil pareil !'],
  aaron: ['Goûtez-moi ça, c\'est une tuerie.'],
  margaux: ['On est à l\'autre bout du monde, vous réalisez ?'],
  brieux: ['Moi j\'ai déjà envie de rester un an de plus.'],
  jules: ['Bon, qui m\'explique comment on mange ça ?'],
  ensemble: ['Ici, on ne mange jamais seul. C\'est ça, le meilleur ingrédient.'],
  grandMere: ['Encore un peu de dal ? Ici, une assiette vide, ça n\'existe pas.'],
  voisin: ['Encore une galette ? Si, si, j\'insiste !'],
};

// ---------- 3. Le vieux sage ----------

// Derrière la porte du fort, le bruit de la ville s'éteint (la musique se tait) ; le vieux sage attend sur la terrasse
// et vient à Pierre quand il arrive en haut des marches. Rien à réussir : un moment suspendu.
export const FORT_SILENCE = [
  { say: ['Derrière toi, le bruit de la ville s\'est éteint d\'un coup. Il n\'y a plus que le vent entre les vieilles pierres.'] },
  { speaker: 'Harsh', say: ['Ces murs sont là depuis plus de mille ans. Ici, on parle doucement.', 'Le vieux sage est là-haut, en haut des marches. Monte le voir.'] },
];

export const SAGE = [
  { wait: 600 },
  { approach: 'vieux-sage' },
  {
    speaker: 'Vieux sage',
    say: [
      'Tu viens de loin, et tu iras plus loin encore. Mais souviens-toi : ce n\'est pas la destination qui compte, c\'est ce que le chemin dépose en toi.',
      'Chaque lieu que tu traverses, chaque visage que tu quittes, rien ne se perd. Tout cela voyage avec toi, ici.',
    ],
  },
  { say: ['En disant « ici », il pose la main sur son cœur.'] },
  { wait: 600 },
  { give: ITEMS.talismanIndien, text: 'Le vieux sage glisse dans ta main un talisman : une petite pierre, polie par les années, où l\'on a gravé un chemin qui tourne sur lui-même.' },
  { speaker: 'Vieux sage', say: ['Garde-la sur toi. Elle vient de loin, comme toi.'] },
  { say: ['Le poids dans ma paume… c\'est le même que le coquillage de Manon, dans l\'herbe près des statues de Fort-de-France. Comme si le voyage bouclait quelque chose.'] },
  { speaker: 'Harsh', say: ['Viens, on redescend. La ville nous attend dehors.'] },
  { setFlag: FLAGS.sageDelhi },
];

// ---------- 4. L'ellipse ----------

// En sortant du fort (Harsh et Prophecy le suivent encore) : « Quelques mois plus tard… », puis le retour (GOING_HOME).
export const MONTHS_LATER = [
  { black: true },
  { wait: 800 },
  { say: ['Quelques mois plus tard…'] },
  { setFlag: FLAGS.moisDelhi },
  { black: false },
];

export const SAGE_AFTER = ['Rien ne se perd, jeune voyageur. Rien.'];

// ---------- 5. Le retour ----------

// Devant la porte du fort, le semestre fini : Prophecy amorce le retour (il partage le cursus de Pierre) ; Harsh dit au
// revoir. Puis on marche jusqu'à l'aéroport (un bout de la grande avenue), Prophecy suit Pierre ; à l'aéroport de Delhi,
// l'hôtesse propose le vol pour Bordeaux (maps/airport.js).
export const GOING_HOME = [
  { approach: 'prophecy-depart' },
  {
    speaker: 'Prophecy',
    say: ['Bon, la parenthèse indienne se termine. On file à Bordeaux pour la remise des diplômes. Toi, tu reviens là où tout a commencé !'],
  },
  { approach: 'harsh-depart' },
  { speaker: 'Harsh', say: ['Vous allez me manquer, tous les deux. Revenez quand vous voulez : ici, vous serez toujours chez vous.'] },
  { faceTo: 'prophecy-depart' },
  { speaker: 'Prophecy', say: ['Allez, les valises sont prêtes. L\'aéroport, c\'est au bout de la grande avenue. On y va !'] },
  { setFlags: [FLAGS.departDelhi, FLAGS.semestreTermine] },
];

export const HARSH_GOODBYE = ['Vous allez me manquer, tous les deux. L\'aéroport, c\'est au bout de la grande avenue. Bon voyage !'];
