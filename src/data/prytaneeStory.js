import { FLAGS, ITEMS, TRAITS, carryText } from './story.js';

// Scénario du Prytanée (lycée militaire), en trois temps :
//   1. Arrivée et Autonomie : le capitaine envoie Pierre préparer sa chambre (lit, armoire, bureau, dans n'importe
//      quel ordre) ; Tanguy et Geoffrey le guident ; inspection : « Correct. » → Autonomie.
//   2. Le mur, la nuit : Tanguy et Geoffrey font le mur ; Pierre (Esprit d'équipe) les rejoint derrière la porte nord en
//      traversant la cour sans se faire prendre par les rondes (voir systems/Patrols.js) ; au petit matin, au dortoir.
//   3. Le bac : quelques années plus tard, les résultats affichés dans la cour ; le capitaine garde la porte nord, vers
//      Bordeaux (trajet avec l'encart des vertus emportées).
// Scénettes partagées par la carte et le dortoir (étapes : voir MapScene.runSteps).

// Places sur la carte : devant l'internat des garçons, la porte nord (derrière le mur), la porte sud, le poste de
// commandement, le panneau des résultats ; dans la chambre (1er étage) : la case sous l'escalier qui descend au hall.
export const DORM_DOOR_FRONT = { x: 6, y: 8 };
export const NORTH_GATE = [[24, 2], [25, 2]];
export const SOUTH_GATE = [16, 23];
export const RESULTS_BOARD = { x: 17, y: 19 };              // le panneau de bois du bas de la place
const COMMAND_POST = [29, 22];
const DORM_EXIT = [12, 3];                                        // l'escalier du dortoir qui descend au hall

// ---------- 1. Arrivée et Autonomie ----------

// Arrivée par la route de Bonsecours : image d'accueil.
export const ARRIVAL = [
  { opening: { postcard: 'prytanee', text: 'Le Prytanée, La Flèche. La rentrée.' } },
  { setFlag: FLAGS.prytaneeOuverture },
  { say: ['Le capitaine t\'attend devant l\'internat des garçons, en haut à gauche.'] },
];

// Le capitaine, devant l'internat : trois mots, l'objectif, et il s'en va vers son poste sans qu'on l'attende (le
// dortoir est ouvert tout de suite ; entrer au dortoir le fait disparaître, voir interiors.dortoir).
export const CAPTAIN_WELCOME = [
  { speaker: 'Capitaine', say: ['Nouveau. Ici, personne ne fait les choses à ta place.', 'Lit, armoire, affaires. Inspection dans dix minutes.'] },
  { setFlag: FLAGS.capitaineParle },
  { say: ['Objectif : prépare ta chambre, au premier étage de l\'internat.'] },
  { walk: 'capitaine', to: COMMAND_POST, then: [FLAGS.capitaineAccueil] },
];

// L'inspection, dès que les trois tâches sont faites : le capitaine entre, regarde, « Correct. » ; le soir même,
// Tanguy et Geoffrey proposent de faire le mur et sortent devant.
const INSPECTION = [
  // Il monte par l'escalier du dortoir : « Garde à vous ! » ; les trois s'alignent devant leurs lits, face à lui.
  { sound: 'door' },
  { setFlag: FLAGS.chambrePrete },
  { walk: 'capitaine-inspection', to: [7, 6], block: true },
  { face: { 'capitaine-inspection': 'up' } },
  { speaker: 'Capitaine', say: ['GARDE À VOUS !'] },
  { walk: 'tanguy', to: [4, 5] },
  { walk: 'geoffrey', to: [6, 5] },
  { goTo: [9, 5], facing: 'down' },
  { wait: 500 },
  { face: { tanguy: 'down', geoffrey: 'down', player: 'down' } },
  { say: ['Tanguy, Geoffrey et toi, alignés devant vos lits, au garde-à-vous.'] },
  // Il passe tout en revue : l'armoire d'abord (comme le disait Tanguy), le lit, puis le bureau.
  { walk: 'capitaine-inspection', to: [11, 6], block: true },
  { face: { 'capitaine-inspection': 'right' } },
  { speaker: 'Capitaine', say: ['L\'armoire d\'abord. Toujours l\'armoire.', '… Pliée au carré. Je suis presque déçu.'] },
  { walk: 'capitaine-inspection', to: [8, 5], block: true },
  { face: { 'capitaine-inspection': 'up' } },
  { speaker: 'Capitaine', say: ['Le lit. Une pièce de monnaie rebondirait dessus.', 'Je n\'ai pas de pièce. Mais je le sens.'] },
  { walk: 'capitaine-inspection', to: [3, 9], block: true },
  { face: { 'capitaine-inspection': 'up' } },
  { speaker: 'Capitaine', say: ['Les affaires pour demain. Même les chaussettes sont alignées.', 'Qui t\'a appris ça ? … Ne réponds pas.'] },
  { walk: 'capitaine-inspection', to: [7, 7], block: true },
  { face: { 'capitaine-inspection': 'up', player: 'down' } },
  { speaker: 'Capitaine', say: ['Correct. Repos.'] },
  { trait: TRAITS.autonomie },
  { walk: 'capitaine-inspection', to: DORM_EXIT, block: true, then: [FLAGS.inspection] },
  // Le mur, la nuit.
  { black: true },
  { wait: 600 },
  { say: ['Le soir même…'] },
  { setFlag: FLAGS.soirMur },
  { black: false },
  { approach: 'tanguy' },
  { speaker: 'Tanguy', say: ['Ce soir on fait le mur. T\'es avec nous ?'] },
  { speaker: 'Geoffrey', say: ['Les rondes passent toutes les deux minutes, faut juste bien attendre.'] },
  { useTrait: TRAITS.espritEquipe },
  { say: ['Objectif : rejoins Tanguy et Geoffrey derrière le mur, à la porte nord. Gare aux rondes !'] },
  // Ils filent chacun par le plus court chemin vers l'escalier (pas en file : l'un ne refait pas tout le trajet de l'autre),
  // pendant que Pierre a déjà la main ; ils disparaissent en bas (Geoffrey, le plus loin, lève le drapeau à son arrivée).
  { walk: 'tanguy', to: [DORM_EXIT[0], DORM_EXIT[1] + 1] },
  { walk: 'geoffrey', to: DORM_EXIT, then: [FLAGS.murPropose] },
];
const ALL_DONE = { ifFlags: [FLAGS.litFait, FLAGS.armoireRangee, FLAGS.affairesPretes], unlessFlags: [FLAGS.chambrePrete] };

// Une tâche de la chambre (texte, drapeau), puis l'inspection si c'était la dernière.
const task = (text, flag) => [
  { say: [text] },
  { setFlag: flag },
  { ...ALL_DONE, steps: INSPECTION },
];
export const MAKE_BED = task('Pierre fait son lit.', FLAGS.litFait);
export const TIDY_WARDROBE = task('Pierre range ses affaires.', FLAGS.armoireRangee);
export const PREPARE_DESK = task('Pierre prépare ses affaires pour demain.', FLAGS.affairesPretes);

// Tanguy et Geoffrey, déjà dans la chambre : ils guident Pierre vers ce qu'il reste à faire.
export const TANGUY_GUIDE = [
  { speaker: 'Tanguy', say: ['Le capitaine regarde toujours l\'armoire en premier.'] },
  { unlessFlags: [FLAGS.armoireRangee], speaker: 'Tanguy', say: ['La tienne, c\'est celle de droite.'] },
];
export const GEOFFREY_GUIDE = [
  { unlessFlags: [FLAGS.litFait], speaker: 'Geoffrey', say: ['Ton lit, c\'est celui du milieu. Au carré, hein.'] },
  { unlessFlags: [FLAGS.affairesPretes], speaker: 'Geoffrey', say: ['Et prépare tes affaires pour demain, sur le bureau.'] },
  { ifFlags: [FLAGS.litFait, FLAGS.affairesPretes], speaker: 'Geoffrey', say: ['Il reste l\'armoire. Demande à Tanguy, c\'est un maniaque.'] },
];

// Facultatif, de l'arrivée jusqu'au bac : dans le hall de l'internat, un nouveau a le mal du pays ; le pas de danse de
// Maman (Joie de vivre) le fait rire. Objet-souvenir du Prytanée : son insigne.
export const HOMESICK = [
  { ifItems: [ITEMS.insigne.id], speaker: 'Nouveau', say: ['T\'es fou. Mais ça fait du bien.'], end: true },
  { say: ['Un nouvel élève, une lettre à la main.'] },
  { speaker: 'Nouveau', say: ['Ma mère me manque. Ici, personne ne rigole jamais.'] },
  { useTrait: TRAITS.joie },
  { say: ['Tu lui apprends le pas de danse de Maman, au milieu du hall.', 'Il rit… puis il danse aussi.'] },
  { speaker: 'Nouveau', say: ['T\'es fou. Mais ça fait du bien. Tiens, garde ça : j\'en ai deux.'] },
  { give: ITEMS.insigne, text: 'Tu reçois un insigne du Prytanée !' },
];

// ---------- 2. Le mur, la nuit ----------

// Rondes de la cour (voir systems/Patrols.js) : trois militaires, lampe à la main.
export const NIGHT = { ifFlags: [FLAGS.murPropose], unlessFlags: [FLAGS.murReussi] };
export const PATROLS = {
  ...NIGHT,
  guards: [
    // Chacun fait le tour d'un circuit, en boucle, et balaie les côtés à chaque angle.
    { id: 'ronde-1', path: [[4, 9], [16, 9], [16, 15], [4, 15]] },                  // autour des jardins ouest et du milieu
    { id: 'ronde-2', sprite: 'g8', path: [[29, 15], [19, 15], [19, 9], [29, 9]] },   // une militaire, autour du jardin est
    { id: 'ronde-3', path: [[23, 9], [23, 5], [25, 5], [25, 9]] },                 // dans l'allée de la porte nord
  ],
  caught: { speaker: 'Militaire', say: ['Hé, toi ! Retour au dortoir !'], back: { ...DORM_DOOR_FRONT, facing: 'down' } },
};

// Derrière le mur (la porte nord) : les deux copains, puis le retour au dortoir au petit matin.
export const BEHIND_THE_WALL = [
  { face: { player: 'up' } },
  { speaker: 'Tanguy', say: ['T\'en as mis du temps !'] },
  { black: true },
  { wait: 700 },
  { setFlag: FLAGS.murReussi },
  { travel: { interior: 'dortoir', x: 8, y: 6, facing: 'right' } },
];

// Au dortoir, au petit matin : le capitaine monte demander qui est sorti ; Pierre (Audace) affirme sans ciller que
// personne n'est sorti et qu'ils n'ont rien vu ; le capitaine acquiesce et repart sur un bon mot. Puis l'ellipse
// jusqu'aux résultats du bac.
export const MORNING = [
  { say: ['Au petit matin, au dortoir.'] },
  { sound: 'door' },
  { walk: 'capitaine-matin', to: [9, 6], block: true },
  { face: { 'capitaine-matin': 'left', player: 'right' } },
  { speaker: 'Capitaine', say: ['Trois lits vides cette nuit, d\'après la ronde. Qui est sorti ?'] },
  { useTrait: TRAITS.audace },
  { say: ['Tu te lèves, au garde-à-vous, et tu regardes le capitaine droit dans les yeux.'] },
  { speaker: 'Pierre', say: ['Personne n\'est sorti, mon capitaine. On n\'a rien vu, rien entendu.'] },
  { speaker: 'Capitaine', say: ['Rien vu, rien entendu… Bien.'] },
  { speaker: 'Capitaine', say: ['Alors la prochaine fois que « personne » sort, dites-lui d\'essuyer ses rangers : il a laissé de la boue jusqu\'à son lit.'] },
  { walk: 'capitaine-matin', to: DORM_EXIT, block: true },
  { speaker: 'Geoffrey', say: ['Personne a rien vu. On remet ça quand vous voulez les gars !'] },
  { setFlag: FLAGS.murMatin },
  { black: true },
  { wait: 800 },
  { say: ['Quelques années plus tard…'] },
  { setFlag: FLAGS.ellipseBac },
  { black: false },
  // Le jour des résultats : les deux copains réveillent Pierre, puis filent en bas (Pierre a la main pendant qu'ils partent).
  { allFace: 'tanguy-jourj' },
  { speaker: 'Tanguy', say: ['Debout, Pierre ! C\'est aujourd\'hui : la liste du bac est affichée dans la cour.'] },
  { speaker: 'Geoffrey', say: ['On descend voir. Si j\'y suis pas, je refais le mur… mais pour de bon.'] },
  { say: ['Objectif : va voir les résultats du bac, sur le panneau de la place d\'armes.'] },
  { walk: 'tanguy-jourj', to: [12, 4] },
  { walk: 'geoffrey-jourj', to: [12, 3], then: [FLAGS.bacDescente] },
];

// ---------- 3. Le bac ----------

// La liste des résultats, sur un panneau dressé dans la cour ; Tanguy et Geoffrey de chaque côté.
export const BAC_RESULTS = [
  { say: ['La liste des résultats du baccalauréat est affichée. Tu cherches ton nom…'] },
  { face: { 'tanguy-bac': 'left', 'geoffrey-bac': 'right' } },
  { speaker: 'Tanguy', say: ['T\'es dessus !'] },
  { speaker: 'Geoffrey', say: ['On y est tous les trois. Même moi.'] },
  { give: ITEMS.baccalaureat, text: 'Diplôme obtenu : Baccalauréat !' },
  { say: ['Le capitaine t\'attend à la porte nord, la route de Bordeaux.'] },
];

// Les vertus reçues ici (encart du trajet).
const CARRY = carryText('prytanee');

// Le capitaine garde le départ, à la porte nord : il faut le bac ; puis le trajet jusqu'à Bordeaux.
const DEPARTURE = [
  { faceTo: 'capitaine-depart' },
  { speaker: 'Capitaine', say: ['Bordeaux, hein. Tu feras ton lit là-bas aussi.'] },
  { setFlag: FLAGS.arriveeBordeaux },
  { travel: { map: 'bordeaux', x: 1, y: 6, facing: 'right', car: true, carry: CARRY } },
];
export const CAPTAIN_AT_GATE = [
  { ifItems: [ITEMS.baccalaureat.id], steps: DEPARTURE, end: true },
  { speaker: 'Capitaine', say: ['Les résultats sont affichés sur le panneau de la place d\'armes. Va voir.'] },
];

// La porte nord : derrière le mur la nuit, le départ pour Bordeaux une fois le bac en poche.
export const NORTH_GATE_SCRIPT = [
  { ...NIGHT, steps: BEHIND_THE_WALL, end: true },
  { ifFlags: [FLAGS.ellipseBac], unlessFlags: [FLAGS.arriveeBordeaux], ifItems: [ITEMS.baccalaureat.id], steps: DEPARTURE, end: true },
  { ifFlags: [FLAGS.ellipseBac], unlessFlags: [FLAGS.arriveeBordeaux], speaker: 'Capitaine', say: ['Pas si vite. Les résultats d\'abord, dans la cour.'] },
];
