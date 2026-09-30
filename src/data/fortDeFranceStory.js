import { FLAGS, ITEMS, QUALITIES } from './story.js';

// Scénario de Fort-de-France (voir le document « Scénario de Fort-de-France ») : le dernier jour sur l'île,
// Pierre reçoit trois qualités de sa famille (dans n'importe quel ordre), offre une canne au pêcheur
// (quête ouverte par celle de Papa), puis embarque avec toute la famille pour Saint-Ay.
// Scénettes partagées par la carte de l'île et les intérieurs (étapes : voir MapScene.runSteps).

const PECHEUR = 'Pêcheur';
const ALL_QUALITIES = Object.values(QUALITIES).map((q) => q.id);

// Toutes les conditions du départ : les trois qualités et la canne offerte.
export const READY_TO_LEAVE = { ifSouvenirs: ALL_QUALITIES, ifFlags: [FLAGS.canneOfferte] };

// Départ : réplique du pêcheur, puis pont du ferry et traversée (FerryScene, `deck`).
export const DEPARTURE = [
  { say: ["Le ferry est prêt. Ta famille t'attend à bord."], speaker: PECHEUR },
  { setFlag: FLAGS.departFortDeFrance },
  { travel: { map: 'saintAy', x: 11, y: 24, facing: 'left', ferry: true, deck: true } },
];

// Ce qu'il reste à faire, rappelé par le pêcheur tant qu'une qualité manque.
const REMINDERS = [
  {
    unlessSouvenirs: [QUALITIES.joie.id], speaker: PECHEUR,
    say: ["Ta mère t'attend au salon avant qu'on éteigne la musique."],
  },
  {
    unlessSouvenirs: [QUALITIES.pragmatisme.id], speaker: PECHEUR,
    say: ["Ton père est encore à sa cabane, il a besoin d'un coup de main."],
  },
  {
    unlessSouvenirs: [QUALITIES.complicite.id], speaker: PECHEUR,
    say: ["Ta sœur te cherchait tout à l'heure, elle avait l'air de préparer un coup."],
  },
];

// Le pêcheur, au bout du ponton, avant la scène de Papa.
export const FISHER_AT_PIER_END = [
  {
    speaker: PECHEUR,
    say: ["Ça mord bien ce matin ! Tu vois ce ferry ? C'est lui qui vous emmènera à Saint-Ay, toute la famille."],
  },
  ...REMINDERS,
];

// Le pêcheur devant le ferry, sa canne cassée à la main (après la scène de Papa). Les étapes sont
// testées dans l'ordre ; `end` arrête la scénette.
export const FISHER_AT_FERRY = [
  { ...READY_TO_LEAVE, say: DEPARTURE[0].say, speaker: PECHEUR },
  { ...READY_TO_LEAVE, setFlag: FLAGS.departFortDeFrance },
  { ...READY_TO_LEAVE, travel: DEPARTURE[2].travel },
  // Canne rapportée de la caisse « À DONNER ».
  {
    ifItems: [ITEMS.canneAPeche.id], unlessFlags: [FLAGS.canneOfferte], speaker: PECHEUR,
    say: [
      "Pour moi ? Elle est encore mieux que l'ancienne !",
      "Merci, petit. Tu peux dire à ton père qu'il a bien fait de faire le tri.",
    ],
  },
  { ifItems: [ITEMS.canneAPeche.id], unlessFlags: [FLAGS.canneOfferte], take: ITEMS.canneAPeche.id, setFlag: FLAGS.canneOfferte },
  { ...READY_TO_LEAVE, say: ['Allez, monte. Ta famille t\'attend.'], speaker: PECHEUR, end: true },
  // Canne cassée déjà montrée : il la montre encore.
  {
    ifFlags: [FLAGS.canneMontree], unlessFlags: [FLAGS.canneOfferte], unlessItems: [ITEMS.canneAPeche.id],
    say: ['Le pêcheur te montre sa canne, cassée en deux.'],
  },
  {
    ifFlags: [FLAGS.canneMontree], unlessFlags: [FLAGS.canneOfferte], unlessItems: [ITEMS.canneAPeche.id],
    speaker: PECHEUR, say: ['Pas de canne, pas de pêche. Et pas de pêche, pas de moral.'],
  },
  // Première rencontre devant le ferry.
  {
    unlessFlags: [FLAGS.canneMontree, FLAGS.canneOfferte], speaker: PECHEUR,
    say: [
      "Ah, te voilà… Regarde-moi ça. Trente ans qu'elle tenait. Elle a choisi aujourd'hui pour me lâcher.",
      'Pas de canne, pas de pêche. Et pas de pêche, pas de moral.',
    ],
  },
  { unlessFlags: [FLAGS.canneOfferte], setFlag: FLAGS.canneMontree },
  ...REMINDERS,
];

// Le ferry, face au joueur : il n'embarque qu'une fois tout réuni.
export const FERRY = [
  ...DEPARTURE.map((step) => ({ ...READY_TO_LEAVE, ...step })),
  { say: ["Le ferry n'embarque pas encore. Le pêcheur, sur le ponton, sait ce qu'il te reste à faire."] },
];

// Manon — Complicité : elle attend devant la maison et vient te parler à la sortie ; elle a caché un
// coquillage dans les hautes herbes de l'île.
export const MANON = [
  { ifSouvenirs: [QUALITIES.complicite.id], speaker: 'Manon', say: ["Chut… c'est notre secret."], end: true },
  { ifItems: [ITEMS.coquillageNacre.id], speaker: 'Manon', say: ["Tu l'as trouvé !"] },
  { ifItems: [ITEMS.coquillageNacre.id], say: ['Manon sort de sa poche un deuxième coquillage, identique.'] },
  {
    ifItems: [ITEMS.coquillageNacre.id], speaker: 'Manon',
    say: ["Un pour toi, un pour moi. Comme ça, où qu'on aille, on garde un bout de l'île. Et c'est notre secret."],
  },
  { ifItems: [ITEMS.coquillageNacre.id], quality: QUALITIES.complicite, end: true },
  { ifFlags: [FLAGS.manonDemande], speaker: 'Manon', say: ["C'est dans les hautes herbes. Trouve-le."], end: true },
  // Première fois, à la sortie de la maison.
  { speaker: 'Manon', say: ['Psst. Viens.'] },
  {
    speaker: 'Manon',
    say: [
      "J'ai caché un truc sur l'île avant qu'on parte. Personne ne le sait. Même pas Papa.",
      'Surtout pas Papa, il le mettrait dans la caisse « À DONNER ».',
      "C'est dans les hautes herbes. Trouve-le.",
    ],
  },
  { setFlag: FLAGS.manonDemande },
];
