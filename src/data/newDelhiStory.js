import { FLAGS, ITEMS, TRAITS } from './story.js';

// Scénario de New Delhi : un semestre d'échange étudiant, Pierre loge à l'internat. Le plus grand choc culturel du
// voyage : une ville dense et grouillante, une grande joie de vivre, et quelque chose de très ancien. Pas de vertu
// nouvelle (la 8e est réservée à Paris) : Joie de vivre sert à la fête, mais à l'envers (ce sont les autres qui
// entraînent Pierre). Aucune ligne « Objectif : », une seule ellipse.
//   1. L'arrivée : la foule de la grande avenue ; Pierre n'a jamais rien vu de pareil. Au bout de l'avenue, Prophecy
//      (de la bande de Hull, qui enchaîne son échange aux États-Unis par ce semestre) l'accueille ; Harsh, étudiant
//      d'ici, vient se présenter à tous les deux.
//   2. La fête, dans la grande salle de l'université : Harsh et les étudiants entraînent Pierre (Joie de vivre) ; la
//      danse de Fort-de-France. Harsh et Prophecy suivent ensuite Pierre.
//   3. Derrière la vieille porte du fort : le silence, le vieux sage, la pierre gravée. Ni vertu ni mini-jeu.
//   4. « Quelques mois plus tard… » (la seule ellipse de la ville).
//   5. Devant le fort, Prophecy : on rentre à Bordeaux ; l'avion.
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

// Au bout de l'avenue, Prophecy (retrouvailles prévues) ; puis Harsh vient vers eux deux : il ne connaît ni l'un ni
// l'autre. Il les entraîne jusqu'à l'université, où la fête a commencé.
export const PROPHECY_WELCOME = [
  { emote: 'prophecy', kind: 'surprise' },
  { approach: 'prophecy' },
  { speaker: 'Prophecy', say: ['Pierre ! Te voilà enfin ! Ça y est, on y est. L\'Inde, pour de vrai.'] },
  { emerge: { id: 'harsh', name: 'Harsh', from: [[25, 12], [21, 13], [30, 18]] } },
  { speaker: 'Harsh', say: ['Vous êtes les étudiants en échange, c\'est ça ? Moi c\'est Harsh ! Venez, je vais vous montrer.'] },
  { black: true },
  { setFlag: FLAGS.prophecyDelhi },
  { say: ['Harsh vous entraîne à travers la foule, jusqu\'à la grande salle de l\'université. La musique s\'entend de loin.'] },
  { travel: { interior: 'delhiUniversity', x: 5, y: 9, facing: 'up' } },
];

// ---------- 2. La fête (Joie de vivre) ----------

// Dans la salle : `prophecy-fete` part danser tout de suite ; Pierre reste près de la porte, puis Harsh et une
// étudiante viennent le chercher.
export const DANCE_FLOOR = [7, 5];
export const DELHI_PARTY = [
  { say: ['La musique fait trembler le sol. Tout le monde danse, chante, tape dans ses mains.'] },
  { speaker: 'Harsh', say: ['Ce soir, c\'est la fête ! Venez, chez nous on sait faire la fête !'] },
  { speaker: 'Prophecy', say: ['Moi, j\'y vais !'] },
  { walk: 'prophecy-fete', to: DANCE_FLOOR, block: true },
  { emote: 'player', kind: 'dots' },
  { say: ['Toi, tu restes près de la porte. Trop de bruit, trop de monde, des pas que tu ne connais pas.'] },
  { approach: 'harsh-fete' },
  { speaker: 'Harsh', say: ['Eh, Pierre ! Ici, personne ne regarde les autres danser. Allez, viens !'] },
  { comeBeside: 'etudiante-fete' },
  { speaker: 'Étudiante', say: ['Viens, on te montre ! C\'est facile : tu fais comme nous.'] },
  { say: ['Pour une fois, ce n\'est pas toi qui entraînes les autres. Ce sont eux qui t\'entraînent.'] },
  { useTrait: TRAITS.joie },
  { say: ['Tu te laisses porter.'] },
  { dance: ['harsh-fete', 'etudiante-fete'] },
  { say: ['Tu ris, tu rates tous les pas, et ça n\'a aucune importance.'] },
  { speaker: 'Harsh', say: ['Tu vois ? Tu es des nôtres, maintenant !'] },
  { approach: 'prophecy-fete' },
  {
    speaker: 'Harsh',
    say: [
      'Maintenant que vous avez vu la fête, il faut que je vous montre autre chose. Un endroit très ancien. Venez.',
      'C\'est derrière la vieille porte du fort, au bout de l\'avenue.',
    ],
  },
  { setFlag: FLAGS.feteDelhi },
];

// Les étudiants qui dansent (la fête continue à chaque visite).
export const STUDENTS = {
  etudiante: ['Tu reviens danser ? Il y a toujours une fête quelque part, ici !'],
  musique: ['C\'est ma chanson préférée ! Enfin… elles sont toutes ma chanson préférée.'],
  rythme: ['Un, deux, trois… et on tourne ! Tu vois, tu as le rythme !'],
  chanteur: ['Le prochain qui s\'assoit chante devant tout le monde !'],
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

// Devant la porte du fort, le semestre fini : Prophecy amorce le retour (il partage le cursus de Pierre) ; l'aéroport de
// Delhi, où l'hôtesse propose le vol pour Bordeaux (maps/airport.js).
export const GOING_HOME = [
  { approach: 'prophecy-depart' },
  {
    speaker: 'Prophecy',
    say: ['Bon, la parenthèse indienne se termine. On rentre à Bordeaux finir nos études. Tu te rends compte, on revient là où tout a commencé ?'],
  },
  { approach: 'harsh-depart' },
  { speaker: 'Harsh', say: ['Vous allez me manquer, tous les deux. Revenez quand vous voulez : ici, vous serez toujours chez vous.'] },
  { black: true },
  { wait: 700 },
  { setFlag: FLAGS.semestreTermine },
  { say: ['Ta valise bouclée, tu prends la route de l\'aéroport avec Prophecy. Le vol pour Bordeaux t\'attend au guichet.'] },
  { travel: { map: 'airport', x: 10, y: 12, facing: 'up' } },
];
