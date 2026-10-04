import { FLAGS, ITEMS, TRAITS, traitsOfCity } from './story.js';

// Scénario de Fort-de-France (voir le document « Scénarios Poké-Pierre — Fort-de-France & Saint-Ay ») : le dernier
// jour sur l'île, Pierre reçoit trois traits de sa famille (dans n'importe quel ordre), offre une canne au capitaine
// du ferry, l'ancien pêcheur (quête ouverte par celle de Papa), puis embarque avec toute la famille pour Saint-Ay.
// Maman, au salon, rappelle le programme ; le capitaine garde le départ.
// Scénettes partagées par la carte de l'île et les intérieurs (étapes : voir MapScene.runSteps).

const CAPITAINE = 'Capitaine du ferry';
const CITY_TRAITS = traitsOfCity('fortDeFrance').map((q) => q.id);

// Toutes les conditions du départ : les trois traits et la canne offerte.
export const READY_TO_LEAVE = { ifSouvenirs: CITY_TRAITS, ifFlags: [FLAGS.canneOfferte] };

// Départ : réplique du capitaine, puis pont du ferry et traversée (FerryScene, `deck`).
export const DEPARTURE = [
  { say: ["Le ferry est prêt. Ta famille t'attend à bord."], speaker: CAPITAINE },
  { setFlag: FLAGS.departFortDeFrance },
  { travel: { map: 'saintAy', x: 5, y: 10, facing: 'left', ferry: true, deck: true } },
];

// Ce qu'il reste à faire, rappelé par le capitaine tant qu'un trait manque.
const REMINDERS = [
  {
    unlessSouvenirs: [TRAITS.joie.id], speaker: CAPITAINE,
    say: ["Ta mère t'attend au salon avant qu'on éteigne la musique."],
  },
  {
    unlessSouvenirs: [TRAITS.pragmatisme.id], speaker: CAPITAINE,
    say: ["Ton père est encore à sa cabane, il a besoin d'un coup de main."],
  },
  {
    unlessSouvenirs: [TRAITS.confiance.id], speaker: CAPITAINE,
    say: ["Ta sœur te cherchait tout à l'heure, elle avait l'air de préparer un coup."],
  },
];

// Le capitaine, au bout du ponton, avant la scène de Papa.
export const FISHER_AT_PIER_END = [
  {
    speaker: CAPITAINE,
    say: ["Ça mord bien ce matin ! Tu vois ce ferry ? C'est moi qui le pilote cet après-midi : je vous emmène à Saint-Ay, toute la famille."],
  },
  ...REMINDERS,
];

// Le capitaine devant le ferry, sa canne cassée à la main (après la scène de Papa). Les étapes sont
// testées dans l'ordre ; `end` arrête la scénette. Il explique d'abord que le ferry ne part pas sans sa canne (même si
// Pierre en a déjà une), puis demande si on a quelque chose pour lui : « Oui », il reçoit la canne et, la famille prête,
// on embarque aussitôt.
const HAS_ROD = { ifItems: [ITEMS.canneAPeche.id], unlessFlags: [FLAGS.canneOfferte] };
const ROD_GIVEN = { ifFlags: [FLAGS.canneOfferte] };
// Canne offerte mais famille pas encore prête : il rappelle ce qu'il reste à faire.
const NOT_READY_YET = [
  { ...ROD_GIVEN, speaker: CAPITAINE, say: ['On part dès que toute ta famille est prête.'] },
  ...REMINDERS.map((step) => ({ ...step, ...ROD_GIVEN })),
  { ...ROD_GIVEN, end: true },
];
const BOARD = DEPARTURE.map((step) => ({ ...READY_TO_LEAVE, ...step }));
// « Oui » : la canne de la caisse « À DONNER ».
const GIVE_ROD = [
  { emote: 'pecheur', kind: 'surprise' },
  {
    speaker: CAPITAINE,
    say: [
      "Pour moi ? Elle est encore mieux que l'ancienne !",
      "Merci, petit. Tu peux dire à ton père qu'il a bien fait de faire le tri.",
    ],
  },
  { take: ITEMS.canneAPeche.id, setFlag: FLAGS.canneOfferte },
  ...BOARD,
  ...NOT_READY_YET,
];
export const FISHER_AT_FERRY = [
  ...BOARD,
  ...NOT_READY_YET,
  // La canne cassée : le ferry est bloqué.
  {
    unlessFlags: [FLAGS.canneMontree], speaker: CAPITAINE,
    say: ["Ah, te voilà… Regarde-moi ça. Trente ans qu'elle tenait. Elle a choisi aujourd'hui pour me lâcher."],
  },
  { ifFlags: [FLAGS.canneMontree], say: ['Le capitaine te montre sa canne, cassée en deux.'] },
  { speaker: CAPITAINE, say: ['Pas de canne, pas de capitaine. Le ferry ne part pas sans moi.'] },
  { setFlag: FLAGS.canneMontree },
  // Avec la canne de la caisse : il demande, on choisit.
  { ...HAS_ROD, speaker: CAPITAINE, say: ['Hm ? Tu as quelque chose pour moi ?'] },
  {
    ...HAS_ROD,
    choose: 'Tu lui donnes la canne à pêche ?',
    choices: [
      { label: 'Oui', steps: GIVE_ROD },
      { label: 'Non', steps: [{ speaker: CAPITAINE, say: ['Ah… Bon. Le ferry attendra, alors.'] }, { end: true }] },
    ],
  },
  { ...HAS_ROD, end: true },
  // Sans canne : il pousse Pierre à en chercher une.
  { speaker: CAPITAINE, say: ["Ton père en a toute une collection, dans sa cabane de pêche. Il en aurait pas une en trop, des fois ?"] },
  ...REMINDERS,
];

// Le ferry, face au joueur : il n'embarque qu'une fois tout réuni.
export const FERRY = [
  ...DEPARTURE.map((step) => ({ ...READY_TO_LEAVE, ...step })),
  { say: ["Le ferry n'embarque pas encore. Le capitaine, sur le ponton, sait ce qu'il te reste à faire."] },
];

// Manon, une fois la quête de Papa finie aussi, envoie Pierre au salon, chez Maman (Papa de même, voir interiors.ffHut).
const MANON_TO_SALON = {
  ifSouvenirs: [TRAITS.pragmatisme.id, TRAITS.confiance.id], unlessSouvenirs: [TRAITS.joie.id],
  speaker: 'Manon', say: ['Maman t\'attend au salon.'],
};

// Manon — Confiance : elle attend devant la maison et vient te parler à la sortie ; elle a caché un
// coquillage dans les hautes herbes de l'île.
export const MANON = [
  { ifSouvenirs: [TRAITS.confiance.id], speaker: 'Manon', say: ["Chut… c'est notre secret."] },
  MANON_TO_SALON,
  { ifSouvenirs: [TRAITS.confiance.id], end: true },
  { ifItems: [ITEMS.coquillageNacre.id], emote: 'manon', kind: 'surprise' },
  { ifItems: [ITEMS.coquillageNacre.id], speaker: 'Manon', say: ["Tu l'as trouvé !"] },
  { ifItems: [ITEMS.coquillageNacre.id], say: ['Manon sort de sa poche un deuxième coquillage, identique.'] },
  {
    ifItems: [ITEMS.coquillageNacre.id], speaker: 'Manon',
    say: ["Un pour toi, un pour moi. Comme ça, où qu'on aille, on garde un bout de l'île. Et c'est notre secret."],
  },
  { ifItems: [ITEMS.coquillageNacre.id], emote: 'manon', kind: 'dots' },
  { ifItems: [ITEMS.coquillageNacre.id], trait: TRAITS.confiance },
  MANON_TO_SALON,
  { ifItems: [ITEMS.coquillageNacre.id], end: true },
  {
    ifFlags: [FLAGS.manonDemande], speaker: 'Manon',
    say: ["C'est dans les hautes herbes. Un indice : le petit pré, à côté des statues."], end: true,
  },
  // Première fois, à la sortie de la maison.
  { emote: 'player', kind: 'surprise' },
  { speaker: 'Manon', say: ['Psst. Viens.'] },
  {
    speaker: 'Manon',
    say: [
      "J'ai caché un truc sur l'île avant qu'on parte. Personne ne le sait. Même pas Papa.",
      'Surtout pas Papa, il le mettrait dans la caisse « À DONNER ».',
      "C'est dans les hautes herbes. Trouve-le.",
    ],
  },
  { speaker: 'Manon', say: ['Passe dans les touffes une par une. Et ne dis rien à personne !'] },
  { setFlag: FLAGS.manonDemande },
];

// Maman — Joie de vivre : au salon, elle rappelle le programme ; une fois Papa et Manon aidés (Pragmatisme et
// Confiance), elle t'entraîne dans une danse.
const OTHERS_DONE = [TRAITS.pragmatisme.id, TRAITS.confiance.id];
export const MAMAN_FDF = [
  { ...READY_TO_LEAVE, speaker: 'Maman', say: ['Tout est prêt ! File au ponton, le ferry n\'attend plus que toi.'], end: true },
  {
    ifSouvenirs: [TRAITS.joie.id], unlessFlags: [FLAGS.canneOfferte], speaker: 'Maman',
    say: ['Le capitaine du ferry avait l\'air embêté, au ponton. Passe le voir.'], end: true,
  },
  // La danse, une fois les deux autres traits reçus.
  { ifSouvenirs: OTHERS_DONE, speaker: 'Maman', say: ['Te voilà ! Ton père et ta sœur m\'ont tout raconté.', 'Tu entends cette chanson ? Viens danser avec moi !'] },
  { ifSouvenirs: OTHERS_DONE, dance: 'maman' },
  { ifSouvenirs: OTHERS_DONE, speaker: 'Maman', say: ['On part cet après-midi, et alors ? Là où on va, on rira aussi. Garde toujours ça avec toi.'] },
  { ifSouvenirs: OTHERS_DONE, trait: TRAITS.joie, end: true },
  // Rappel du programme.
  {
    unlessSouvenirs: [TRAITS.pragmatisme.id], speaker: 'Maman',
    say: ['Ton père trie ses affaires à sa cabane de pêche, à droite de la plage. Va lui donner un coup de main.'],
  },
  {
    unlessSouvenirs: [TRAITS.confiance.id], speaker: 'Maman',
    say: ['Ta sœur mijote quelque chose dehors… Va voir ce qu\'elle prépare.'],
  },
  { speaker: 'Maman', say: ['Après, reviens me voir.'] },
];
