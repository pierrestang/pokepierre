import { FLAGS, ITEMS, TRAITS } from './story.js';

// Scénario de Fort-de-France (voir le document « Scénarios Poké-Pierre — Fort-de-France & Saint-Ay ») : le dernier
// jour sur l'île, Pierre aide Papa et retrouve le coquillage de Manon (dans n'importe quel ordre), puis danse avec Maman
// (Joie de vivre) ; il offre une canne au capitaine du ferry, l'ancien pêcheur (quête ouverte par celle de Papa), puis
// embarque avec toute la famille pour Saint-Ay.
// Maman, au salon, rappelle le programme ; le capitaine garde le départ.
// Scénettes partagées par la carte de l'île et les intérieurs (étapes : voir MapScene.runSteps).

const CAPITAINE = 'Capitaine du ferry';

// Départ, dès la canne offerte : fondu au noir, puis pont du ferry et traversée (FerryScene, `deck`).
export const DEPARTURE = [
  { black: true },
  { setFlag: FLAGS.departFortDeFrance },
  { travel: { map: 'saintAy', x: 5, y: 10, facing: 'left', ferry: true, deck: true } },
];

// Tant que la famille n'a pas fini sa journée (Papa, Manon, puis la danse de Maman), le capitaine ne parle pas de sa
// canne : il envoie seulement Pierre voir sa mère.
const GO_SEE_MOM = { speaker: CAPITAINE, say: ["Ah, le petit ! Ta mère te cherche. File la voir à la maison."] };

// Le capitaine, au bout du ponton, avant la scène de Papa.
export const FISHER_AT_PIER_END = [GO_SEE_MOM];

// Le capitaine devant le ferry, sa canne cassée à la main (après la scène de Papa). Les étapes sont
// testées dans l'ordre ; `end` arrête la scénette. Tant que la famille n'a pas fini (la danse de Maman vient en
// dernier), il envoie seulement Pierre voir sa mère. Ensuite, il montre sa canne cassée : le ferry ne part pas sans
// elle (même si Pierre en a déjà une) ; « Oui », il reçoit la canne de la caisse et on embarque aussitôt.
const HAS_ROD = { ifItems: [ITEMS.canneAPeche.id] };
// « Oui » : la canne de la caisse « À DONNER », puis le départ.
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
  ...DEPARTURE,
];
export const FISHER_AT_FERRY = [
  { unlessSouvenirs: [TRAITS.joie.id], ...GO_SEE_MOM, end: true },
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
  // Sans canne : il pousse Pierre à en chercher une.
  { speaker: CAPITAINE, say: ["Ton père en a toute une collection, dans son atelier. Il en aurait pas une en trop, des fois ?"] },
];

// Le ferry, face au joueur : on embarque par le capitaine, une fois la canne offerte.
export const FERRY = [
  { say: ["Le ferry n'embarque pas encore. Le capitaine, sur le ponton, sait ce qu'il te reste à faire."] },
];

// Manon, une fois la quête de Papa finie aussi, envoie Pierre au salon, chez Maman (Papa de même, voir interiors.ffHut).
const MANON_TO_SALON = {
  ifFlags: [FLAGS.papaFait, FLAGS.secretManon], unlessSouvenirs: [TRAITS.joie.id],
  speaker: 'Manon', say: ['Maman t\'attend au salon.'],
};

// Manon, son secret partagé, renvoie vers Papa tant que le tri des cannes n'est pas fait.
const MANON_TO_PAPA = {
  ifFlags: [FLAGS.secretManon], unlessFlags: [FLAGS.papaFait],
  speaker: 'Manon', say: ['Papa trie ses cannes à son atelier. Va l\'aider !'],
};

// Manon : elle attend devant la maison et vient te parler à la sortie ; elle a caché un
// coquillage dans les hautes herbes de l'île.
export const MANON = [
  { ifFlags: [FLAGS.secretManon], speaker: 'Manon', say: ["Chut… c'est notre secret."] },
  MANON_TO_SALON,
  MANON_TO_PAPA,
  { ifFlags: [FLAGS.secretManon], end: true },
  { ifItems: [ITEMS.coquillageNacre.id], emote: 'manon', kind: 'surprise' },
  { ifItems: [ITEMS.coquillageNacre.id], speaker: 'Manon', say: ["Tu l'as trouvé !"] },
  { ifItems: [ITEMS.coquillageNacre.id], say: ['Manon sort de sa poche un deuxième coquillage, identique.'] },
  {
    ifItems: [ITEMS.coquillageNacre.id], speaker: 'Manon',
    say: ["Un pour toi, un pour moi. Comme ça, où qu'on aille, on garde un bout de l'île. Et c'est notre secret."],
  },
  { ifItems: [ITEMS.coquillageNacre.id], emote: 'manon', kind: 'dots' },
  { ifItems: [ITEMS.coquillageNacre.id], setFlag: FLAGS.secretManon },
  MANON_TO_SALON,
  MANON_TO_PAPA,
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
      "C'est dans les hautes herbes, dans le petit pré, à côté des statues. Trouve-le.",
    ],
  },
  { speaker: 'Manon', say: ['Passe dans les touffes une par une. Et ne dis rien à personne !'] },
  { setFlag: FLAGS.manonDemande },
];

// Maman — Joie de vivre : au salon, elle rappelle le programme ; une fois Papa et Manon aidés (le tri des cannes, le
// coquillage), elle t'entraîne dans une danse.
const OTHERS_DONE = [FLAGS.papaFait, FLAGS.secretManon];
export const MAMAN_FDF = [
  {
    ifSouvenirs: [TRAITS.joie.id], unlessFlags: [FLAGS.canneOfferte], speaker: 'Maman',
    say: ['Le capitaine du ferry avait l\'air embêté, au ponton. Passe le voir.'], end: true,
  },
  // La danse, une fois les deux autres scènes faites.
  { ifFlags: OTHERS_DONE, speaker: 'Maman', say: ['Te voilà ! Tu as l\'air tout content… Tu as donné un coup de main à tout le monde, toi.', 'Tu entends cette chanson ? Viens danser avec moi !'] },
  { ifFlags: OTHERS_DONE, dance: 'maman' },
  { ifFlags: OTHERS_DONE, speaker: 'Maman', say: ['On part cet après-midi, et alors ? Là où on va, on rira aussi. Garde toujours ça avec toi.'] },
  { ifFlags: OTHERS_DONE, trait: TRAITS.joie, end: true },
  // Rappel du programme.
  {
    unlessFlags: [FLAGS.papaFait], speaker: 'Maman',
    say: ['Ton père trie ses affaires à son atelier, à droite de la plage. Va lui donner un coup de main.'],
  },
  {
    unlessFlags: [FLAGS.secretManon], speaker: 'Maman',
    say: ['Ta sœur mijote quelque chose dehors… Va voir ce qu\'elle prépare.'],
  },
  { speaker: 'Maman', say: ['Après, reviens me voir.'] },
];

// La cinématique d'ouverture du jeu, dans la chambre (interiors.js ffHouseUp) : l'image d'accueil de l'île et le bruit
// des vagues, puis Maman appelle d'en bas. Rejouée telle quelle à la toute fin (reveStory.js WAKE_UP).
export const OPENING_CINEMATIC = [
  { sea: true },
  { opening: { postcard: 'fortDeFrance', text: "C'est le dernier matin à Fort-de-France." } },
  { sea: false },
  { wait: 300 },
  { speaker: 'Maman', say: ['Pierre ! Le ferry part cet après-midi ! Descends !'] },
];
