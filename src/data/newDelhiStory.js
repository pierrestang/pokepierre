import { FLAGS, ITEMS, TRAITS } from './story.js';

// Scénario de New Delhi : un semestre d'échange étudiant, Pierre loge à l'internat. Le plus grand choc culturel du
// voyage : une ville dense et grouillante, une grande joie de vivre, et quelque chose de très ancien. Pas de vertu
// nouvelle (la 8e se gagne à Paris) : Joie de vivre sert à la fête, mais à l'envers (ce sont les autres qui
// donnent à Pierre). Aucune ligne « Objectif : », une seule ellipse.
//   1. L'arrivée : la foule de la grande avenue ; Pierre n'a jamais rien vu de pareil. Au bout de l'avenue, Prophecy
//      (de la bande de Hull, qui enchaîne son échange aux États-Unis par ce semestre) l'accueille ; Harsh, étudiant
//      d'ici, vient se présenter à tous les deux ; on le suit à pied jusqu'à la porte du palais de grès.
//   2. La fête, dans la cour du palais : le grand repas partagé, assis en cercle par terre ; on sert Pierre de tous les
//      côtés (Joie de vivre, à l'envers : il apprend à recevoir). Harsh et Prophecy suivent ensuite Pierre.
//   3. Derrière la vieille porte du fort : le silence, le vieux sage, la pierre gravée. Ni vertu ni mini-jeu.
//   4. « Quelques mois plus tard… » (la seule ellipse de la ville).
//   5. Devant le fort, Prophecy : on rentre à Bordeaux ; à pied jusqu'à l'aéroport, Prophecy avec Pierre ; l'avion.
// Scénettes partagées par la carte et les intérieurs (étapes : voir MapScene.runSteps).

// ---------- 1. L'arrivée ----------

// Au milieu de la foule, quelques pas après l'aéroport (déclencheurs de maps/newDelhi.js).
export const CROWD = [
  { emote: 'player', kind: 'surprise' },
  { say: ['Tant de monde, de bruit, de couleurs… Je n\'ai jamais rien vu de pareil.'] },
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
  { speaker: 'Harsh', say: ['Vous êtes les étudiants en échange, c\'est ça ? Moi c\'est Harsh ! Venez, je vais vous montrer.', 'Ce soir, il y a une fête dans la cour du palais de grès. Suivez-moi !'] },
  HARSH_WALK,
];

// Harsh, s'il attend encore devant la porte du palais (ou qu'on lui reparle en chemin).
export const HARSH_LEADING = [
  { speaker: 'Harsh', say: ['C\'est par ici : la porte du palais de grès. Entrez, la fête a commencé !'] },
];

// ---------- 2. La fête (Joie de vivre) ----------

// Dans la cour du palais, à la nuit tombée (interiors.js delhiCour) : le grand repas partagé. Tout le monde est assis
// en cercle par terre, autour d'un tapis couvert de plats. Prophecy, qui suivait Pierre, devient le PNJ `prophecy-fete`
// et s'assoit ; Harsh fait asseoir Pierre à côté de lui. Joie de vivre, dans le sens renversé : ce sont les autres qui
// donnent, de tous les côtés ; Pierre, débordé, apprend à recevoir (étape `pass` : les assiettes glissent vers lui).
export const MEAL_SEATS = { pierre: [9, 10], harsh: [9, 11], prophecy: [10, 12] };
const LEFT = ['etudiante-fete', 'harsh-fete'];
const ACROSS = ['etudiant-dal', 'grand-mere-fete', 'etudiante-riz', 'voisin-fete'];
export const DELHI_PARTY = [
  { setFlag: FLAGS.courArrivee },
  { say: ['La cour du palais brille de lanternes. Au milieu, tout le monde est assis en cercle par terre, autour d\'un grand repas étalé sur un tapis.'] },
  { speaker: 'Harsh', say: ['Viens, assieds-toi avec nous ! Ici, un invité ne reste jamais le ventre vide.'] },
  { walk: 'prophecy-fete', to: MEAL_SEATS.prophecy, block: true },
  { face: { 'prophecy-fete': 'up' }, sit: { 'prophecy-fete': true } },
  { speaker: 'Prophecy', say: ['Ça sent incroyablement bon…'] },
  { walk: 'harsh-fete', to: MEAL_SEATS.harsh, block: true },
  { face: { 'harsh-fete': 'right' }, sit: { 'harsh-fete': true } },
  { goTo: MEAL_SEATS.pierre, facing: 'right' },
  { sit: { player: true } },
  { pass: 'etudiante-fete' },
  { say: ['À peine assis, une assiette arrive devant toi : du riz, du dal, une galette encore chaude.'] },
  { pass: 'harsh-fete' },
  { speaker: 'Harsh', say: ['Goûte celui-là ! C\'est ma mère qui l\'a préparé ce matin.'] },
  { pass: ACROSS },
  { say: ['Et ça continue. De gauche, de droite, d\'en face : un bol, une galette, encore un peu de riz. On te ressert sans que tu demandes.'] },
  { emote: 'player', kind: 'dots' },
  { speaker: 'Grand-mère', say: ['Non, non, on ne refuse pas ! Chez nous, l\'invité, on le ressert toujours.'] },
  { say: ['Je ne sais même pas quoi faire de toute cette générosité. Juste… l\'accepter, peut-être.'] },
  { say: ['À Fort-de-France, c\'est toi qui menais la danse. Ici, pour une fois, ce sont les autres qui donnent.'] },
  { useTrait: TRAITS.joie },
  { say: ['Tu prends ce qu\'on te tend. Tu goûtes à tout, tu ris, et tu tends à ton tour le plat à ton voisin.'] },
  { pass: LEFT },
  { speaker: 'Harsh', say: ['Tu vois ? Tu es des nôtres, maintenant !'] },
  {
    speaker: 'Harsh',
    say: [
      'Maintenant que vous avez vu la fête, il faut que je vous montre autre chose. Un endroit très ancien. Venez.',
      'C\'est derrière la vieille porte du fort, au bout de l\'avenue.',
    ],
  },
  { sit: { player: false, 'harsh-fete': false, 'prophecy-fete': false } },
  { setFlag: FLAGS.feteDelhi },
];

// Les convives, assis autour du repas (le repas continue à chaque visite).
export const GUESTS = {
  etudiante: ['Tu reviens ? Il y a toujours une place pour toi, et toujours de quoi manger !'],
  riz: ['Reprends du riz, va ! Il en reste plein la marmite.'],
  dal: ['Le dal, c\'est la recette de ma grand-mère. Elle ne la donne à personne !'],
  ensemble: ['Ici, on ne mange jamais seul. C\'est ça, le meilleur ingrédient.'],
  grandMere: ['Mange, mon garçon, mange ! Tu es tout maigre.'],
  voisin: ['Encore une galette ? Si, si, j\'insiste !'],
};

// ---------- 3. Le vieux sage ----------

// Derrière la porte du fort, le bruit de la ville s'éteint (la musique se tait) ; le vieux sage attend sur la terrasse
// et vient à Pierre quand il arrive en haut des marches. Rien à réussir : un moment suspendu.
export const FORT_SILENCE = [
  { say: ['Derrière toi, le bruit de la ville s\'est éteint d\'un coup. Il n\'y a plus que le vent entre les vieilles pierres.'] },
  { speaker: 'Harsh', say: ['Ces murs sont là depuis plus de mille ans. Ici, on parle doucement.'] },
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
  { give: ITEMS.pierreGravee, text: 'Le vieux sage glisse dans ta main une petite pierre, polie par les années, où l\'on a gravé un chemin qui tourne sur lui-même.' },
  { ifItems: [ITEMS.galetLac.id], say: ['Elle est lisse et tiède, comme le galet du lac de Saint-Ay. Comme le coquillage de Manon.'] },
  { unlessItems: [ITEMS.galetLac.id], say: ['Elle est lisse et tiède, comme le coquillage de Manon, à Fort-de-France.'] },
  { wait: 800 },
  // ---------- 4. L'ellipse ----------
  { black: true },
  { setFlag: FLAGS.sageDelhi },
  { wait: 800 },
  { say: ['Quelques mois plus tard…'] },
  { setFlag: FLAGS.moisDelhi },
  { travel: { map: 'newDelhi', x: 27, y: 10, facing: 'down' } },
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
    say: ['Bon, la parenthèse indienne se termine. On rentre à Bordeaux finir nos études. Tu te rends compte, on revient là où tout a commencé ?'],
  },
  { approach: 'harsh-depart' },
  { speaker: 'Harsh', say: ['Vous allez me manquer, tous les deux. Revenez quand vous voulez : ici, vous serez toujours chez vous.'] },
  { faceTo: 'prophecy-depart' },
  { speaker: 'Prophecy', say: ['Allez, les valises sont prêtes. L\'aéroport, c\'est au bout de la grande avenue. On y va !'] },
  { setFlags: [FLAGS.departDelhi, FLAGS.semestreTermine] },
];

export const HARSH_GOODBYE = ['Vous allez me manquer, tous les deux. L\'aéroport, c\'est au bout de la grande avenue. Bon voyage !'];
