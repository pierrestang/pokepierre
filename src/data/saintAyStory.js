import { FLAGS, ITEMS, ROLES } from './story.js';

// Scénario de Saint-Ay (voir le document « Saint-Ay ») : Pierre devient grand frère à la naissance de
// Fanny, construit une cabane avec ses cousins (planches, corde, emplacement, dans n'importe quel ordre),
// puis part en voiture pour Montépilloy après une nouvelle mutation de Papa.
// Scénettes partagées par la carte du village et les intérieurs (étapes : voir MapScene.runSteps).

const HAS_ROLES = { ifSouvenirs: [ROLES.grandFrere.id, ROLES.cousins.id] };
const CABANE_PLACES = [FLAGS.cabaneArbre, FLAGS.cabaneEtang, FLAGS.cabaneChamp];

// Arrivée : ellipse après la traversée, Papa et Manon retrouvent Pierre au bord du lac.
export const ARRIVAL = [
  { black: true },
  { wait: 700 },
  { say: ['Saint-Ay, Loiret. Quelque temps plus tard…'] },
  { black: false },
  { approach: 'papa' },
  { speaker: 'Papa', say: ['Te voilà enfin ! On te cherche partout.', 'Maman est à l\'hôpital. Le bébé est arrivé ! Suis-nous !'] },
  { approach: 'manon' },
  { speaker: 'Manon', say: ['Vite, viens avec nous !'] },
  { setFlags: [FLAGS.saArrivee, FLAGS.familleSuit] },
];

// L'hôpital — Grand frère : Maman vient d'accoucher de Fanny.
export const BIRTH = [
  { setFlag: FLAGS.familleArrivee },
  { speaker: 'Papa', say: ['Nous y sommes. Maman est là-bas.'] },
  { say: ['Maman est allongée, un bébé dans les bras.'] },
  { speaker: 'Maman', say: ['Te voilà ! Viens voir… Je te présente Fanny.'] },
  { speaker: 'Manon', say: ['Elle est toute petite… Elle me ressemble, non ?'] },
  { speaker: 'Papa', say: ['Elle ne pleure même pas. Elle a déjà tout compris.'] },
  { say: ['Tu t\'approches de Fanny. Elle attrape ton doigt.'] },
  { speaker: 'Maman', say: ['Tu vois ? Elle t\'a déjà choisi. À partir d\'aujourd\'hui, tu vas veiller sur elle.'] },
  { quality: ROLES.grandFrere },
];

// Chez Felix : le plan de la cabane. Joshua et Yanis partent chercher planches et corde.
export const CABANE_PLAN = [
  { setFlag: FLAGS.maisonFelixVisitee },
  { approach: 'felix-maison' },
  { speaker: 'Felix', say: ['Bienvenue chez nous ! J\'ai un plan : on construit une cabane. Rien que pour nous.'] },
  { speaker: 'Joshua', say: ['Il faut des planches. Il y en a plein à la ferme… mais il y a les poules.'] },
  { speaker: 'Yanis', say: ['Et une corde pour les tenir. J\'en ai vu une près de l\'étang.'] },
  { speaker: 'Felix', say: ['Moi, je dirige le chantier. Toi, tu choisis où on la met.'] },
  { say: ['Joshua et Yanis filent dehors.'] },
  { setFlag: FLAGS.planCabane },
];

// Felix dirige le chantier : il propose trois emplacements, puis, tout réuni, la cabane est construite.
export const FELIX_CHANTIER = [
  // Emplacement pas encore choisi : Felix propose.
  { unlessFlags: CABANE_PLACES, speaker: 'Felix', say: ['Pour la cabane, j\'ai trois idées. À toi de choisir !'] },
  {
    unlessFlags: CABANE_PLACES,
    speaker: 'Felix',
    choose: 'Où construit-on la cabane ?',
    choices: [
      { label: 'Le grand arbre', steps: [{ setFlag: FLAGS.cabaneArbre }, { speaker: 'Felix', say: ['Dans le grand arbre, à côté de ta maison. On verra tout le village !'] }] },
      { label: 'Le bord du lac', steps: [{ setFlag: FLAGS.cabaneEtang }, { speaker: 'Felix', say: ['Au bord du lac, sur pilotis. Comme des pêcheurs !'] }] },
      { label: 'Le champ de blé', steps: [{ setFlag: FLAGS.cabaneChamp }, { speaker: 'Felix', say: ['Au milieu du champ, près de la ferme. Personne ne nous trouvera.'] }] },
    ],
  },
  // Il manque encore des matériaux.
  { unlessItems: [ITEMS.planches.id], speaker: 'Felix', say: ['Il nous faut encore les planches : Joshua t\'attend à la ferme.'] },
  { unlessItems: [ITEMS.corde.id], speaker: 'Felix', say: ['Et la corde : Yanis cherche près de l\'étang.'] },
  { unlessItems: [ITEMS.planches.id], end: true },
  { unlessItems: [ITEMS.corde.id], end: true },
  // Tout est réuni : la cabane terminée.
  { speaker: 'Felix', say: ['Tout est prêt ? Alors au travail !'] },
  { black: true },
  { take: ITEMS.planches.id },
  { take: ITEMS.corde.id },
  { wait: 600 },
  { say: ['Les quatre cousins sont assis dans la cabane.'] },
  { speaker: 'Felix', say: ['Voilà. Notre QG.'] },
  { speaker: 'Joshua', say: ['Personne n\'entre sans le mot de passe.'] },
  { speaker: 'Yanis', say: ['On a un mot de passe ?'] },
  { speaker: 'Felix', say: ['Maintenant, oui.', 'Où que tu ailles après, cette cabane restera la nôtre. Cousins pour la vie.'] },
  { quality: ROLES.cousins },
  { setFlag: FLAGS.cabaneFinie },
  { black: false },
];

// Missions : les planches de la ferme (gardées par les poules) et la vieille corde près du ponton.
export const PLANKS = [
  { unlessFlags: [FLAGS.planCabane], say: ['Un tas de planches. De quoi construire quelque chose…'], end: true },
  { ifItems: [ITEMS.planches.id], say: ['Il reste plein de planches.'], end: true },
  { ifFlags: [FLAGS.cabaneFinie], say: ['Il reste plein de planches.'], end: true },
  { give: ITEMS.planches, text: 'Tu récupères des planches.' },
  { speaker: 'Joshua', say: ['Tu as survécu aux poules ? Respect.'] },
];
export const ROPE = [
  { unlessFlags: [FLAGS.planCabane], say: ['Une vieille corde, enroulée autour de la bitte d\'amarrage.'], end: true },
  { ifItems: [ITEMS.corde.id], say: ['Une bitte d\'amarrage en bois.'], end: true },
  { ifFlags: [FLAGS.cabaneFinie], say: ['Une bitte d\'amarrage en bois.'], end: true },
  { give: ITEMS.corde, text: 'Tu trouves une vieille corde près du ponton.' },
  { speaker: 'Yanis', say: ['Parfait. Ça tiendra… sûrement.'] },
];
// Une poule garde le tas de planches : elle s'enfuit quand on lui parle.
export const henScript = (flag) => [
  { say: ['Cot cot ! La poule s\'enfuit en battant des ailes.'] },
  { setFlag: flag },
];

// Les cousins à la cabane : avant l'annonce, puis l'adieu, puis après.
export const FELIX_AT_CABANE = [
  { ifFlags: [FLAGS.adieuCousins], speaker: 'Felix', say: ['La cabane t\'attendra. Allez, file, ta famille t\'attend sur la route du nord.'], end: true },
  { unlessFlags: [FLAGS.annonceMutation], speaker: 'Felix', say: ['Notre QG ! Reviens quand tu veux.'], end: true },
  { speaker: 'Felix', say: ['Alors c\'est vrai, tu pars ?'] },
  { speaker: 'Joshua', say: ['Montépilloy, c\'est pas le bout du monde.'] },
  { speaker: 'Yanis', say: ['C\'est où, Montépilloy ?'] },
  { speaker: 'Felix', say: ['La cabane t\'attendra. Et le mot de passe ne change pas.'] },
  { setFlag: FLAGS.adieuCousins },
];

// L'annonce, en rentrant à la maison au toit de chaume avec les deux rôles.
export const ANNOUNCEMENT = [
  { say: ['Papa est assis à la table, une lettre à la main. Maman berce Fanny.'] },
  { speaker: 'Papa', say: ['J\'ai reçu ma nouvelle affectation.'] },
  { speaker: 'Manon', say: ['Encore ?'] },
  { speaker: 'Papa', say: ['L\'armée ne demande pas notre avis. On part pour Montépilloy.'] },
  { speaker: 'Maman', say: ['On y arrivera, comme à chaque fois. Tous ensemble.'] },
  { speaker: 'Papa', say: ['Et cette fois, pas de ferry. On prend la voiture.'] },
  { setFlag: FLAGS.annonceMutation },
];
export const ANNOUNCEMENT_EVENT = { ...HAS_ROLES, unlessFlags: [FLAGS.annonceMutation] };

// Le départ : la voiture chargée sur la route du nord.
export const CAR = [
  {
    unlessFlags: [FLAGS.adieuCousins],
    say: ['La voiture est chargée. Va d\'abord dire au revoir à tes cousins, à la cabane.'],
    end: true,
  },
  { black: true },
  { wait: 600 },
  { say: ['Route du nord. La voiture est chargée. Tu montes à l\'arrière, à côté de Manon et de Fanny.'] },
  { speaker: 'Maman', say: ['Regarde bien Saint-Ay.'] },
  { speaker: 'Papa', say: ['Elle ne va pas bouger. On reviendra.'] },
  { say: ['Manon te montre son coquillage.'] },
  { speaker: 'Manon', say: ['Tu as toujours le tien ?'] },
  { say: ['Par la vitre arrière : le lac, l\'hôpital, puis la cabane des cousins qui disparaît derrière les arbres.'] },
  { say: ['Tu emportes : Grand frère et Cousins pour la vie.'] },
  { say: ['Montépilloy.'] },
  { setFlag: FLAGS.arriveeMontepilloy },
  { travel: { map: 'montepilloy', x: 11, y: 22, facing: 'up' } },
];

// Positions des cousins autour de la cabane, selon l'emplacement choisi.
export const CABANE_SPOTS = {
  [FLAGS.cabaneArbre]: { decal: { x: 2, y: 3 }, felix: [3, 4, 'down'], joshua: [2, 4, 'down'], yanis: [2, 5, 'right'] },
  [FLAGS.cabaneEtang]: { decal: { x: 6, y: 16 }, felix: [9, 15, 'left'], joshua: [11, 15, 'left'], yanis: [13, 15, 'left'] },
  [FLAGS.cabaneChamp]: { decal: { x: 10, y: 19 }, felix: [10, 15, 'down'], joshua: [12, 15, 'down'], yanis: [13, 15, 'left'] },
};
