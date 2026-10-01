import { FLAGS, ITEMS, ROLES } from './story.js';

// Scénario de Saint-Ay (voir le document « Saint-Ay ») : Pierre devient grand frère à la naissance de
// Fanny, construit une cabane avec ses cousins (planches, corde, emplacement, dans n'importe quel ordre),
// puis part en voiture pour Montépilloy après une nouvelle mutation de Papa.
// Scénettes partagées par la carte du village et les intérieurs (étapes : voir MapScene.runSteps).

const HAS_ROLES = { ifSouvenirs: [ROLES.grandFrere.id, ROLES.cousins.id] };
// La cabane des cousins : perchée dans les sapins au sud du lac. Pied de l'échelle (la case où l'on monte) ;
// la plateforme bloque les 4 x 3 cases au-dessus (de x - 1 à x + 2), l'image déborde d'une demi-case de
// chaque côté.
export const CABANE_SPOT = { x: 5, y: 19 };

// Arrivée : ellipse après la traversée, Papa et Manon retrouvent Pierre au bord du lac.
export const ARRIVAL = [
  { black: true },
  { wait: 700 },
  { say: ['Saint-Ay, Loiret. Quelque temps plus tard…'] },
  { black: false },
  { approach: 'papa' },
  { speaker: 'Papa', say: ['Te voilà enfin ! On te cherche partout.', 'Maman est à la clinique. Le bébé est arrivé ! Suis-nous !'] },
  { approach: 'manon' },
  { speaker: 'Manon', say: ['Vite, viens avec nous !'] },
  { setFlags: [FLAGS.saArrivee, FLAGS.familleSuit] },
];

// La clinique — Grand frère : Maman vient d'accoucher de Fanny.
export const BIRTH = [
  { setFlag: FLAGS.familleArrivee },
  { speaker: 'Papa', say: ['Nous y sommes. Maman est là-bas.'] },
  { say: ['Maman est allongée dans son lit. Dans le lit d\'à côté, une petite tête rousse dépasse de la couverture.'] },
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
  { speaker: 'Yanis', say: ['Et une corde pour les tenir. J\'en ai vu une dans les hautes herbes, tout au sud-ouest.'] },
  { speaker: 'Felix', say: ['Moi, je dirige le chantier. On la perche dans les sapins, au sud du lac.'] },
  { say: ['Joshua et Yanis filent dehors.'] },
  { setFlag: FLAGS.planCabane },
];

// Felix dirige le chantier : tout réuni, la cabane est construite.
export const FELIX_CHANTIER = [
  // Il manque encore des matériaux.
  { unlessItems: [ITEMS.planches.id], speaker: 'Felix', say: ['Il nous faut encore les planches : Joshua t\'attend à la ferme.'] },
  { unlessItems: [ITEMS.corde.id], speaker: 'Felix', say: ['Et la corde : Yanis dit qu\'elle traîne dans les hautes herbes, au sud-ouest.'] },
  { unlessItems: [ITEMS.planches.id], end: true },
  { unlessItems: [ITEMS.corde.id], end: true },
  // Tout est réuni : la cabane est construite, puis les quatre cousins s'y installent (voir CABANE_FETE).
  { speaker: 'Felix', say: ['Tout est prêt ? Alors au travail !'] },
  { black: true },
  { take: ITEMS.planches.id },
  { take: ITEMS.corde.id },
  { wait: 600 },
  { setFlag: FLAGS.cabaneFinie },
  // Pierre arrive assis à sa place, derrière le banc (la scène le fait ressortir) : `cutscene` pour
  // scripts/check_paths.js.
  { travel: { interior: 'cabane', x: 2, y: 2, facing: 'down', cutscene: true } },
];

// Dans la cabane toute neuve (rs-cabane.png, voir interiors.cabane) : les quatre cousins assis derrière les
// bancs, autour du tronc. Chacun parle en sautillant, puis toute la bande saute de joie. On ressort au pied
// de l'échelle.
export const CABANE_FETE = [
  { black: true },
  { wait: 500 },
  { black: false },
  { say: ['La cabane est finie. Les quatre cousins s\'installent autour du tronc.'] },
  { hop: 'felix-cabane' },
  { speaker: 'Felix', say: ['Voilà. Notre QG.'] },
  { hop: 'joshua-cabane' },
  { speaker: 'Joshua', say: ['Personne n\'entre sans le mot de passe.'] },
  { hop: 'yanis-cabane', times: 2 },
  { speaker: 'Yanis', say: ['On a un mot de passe ?'] },
  { face: { 'felix-cabane': 'right', player: 'left' } },
  { speaker: 'Felix', say: ['Maintenant, oui.', 'Où que tu ailles après, cette cabane restera la nôtre. Cousins pour la vie.'] },
  { face: { 'felix-cabane': 'down', player: 'down' } },
  { cheer: ['felix-cabane', 'player', 'joshua-cabane', 'yanis-cabane'] },
  { quality: ROLES.cousins },
  { black: true },
  { wait: 400 },
  { travel: { map: 'saintAy', x: CABANE_SPOT.x, y: CABANE_SPOT.y + 1, facing: 'down' } },
];

// Missions : les planches de la ferme (gardées par les poules) et la vieille corde cachée dans les hautes
// herbes du sud-ouest (elle n'apparaît qu'une fois le chantier lancé).
export const PLANKS = [
  { unlessFlags: [FLAGS.planCabane], say: ['Un tas de planches. De quoi construire quelque chose…'], end: true },
  { ifItems: [ITEMS.planches.id], say: ['Il reste plein de planches.'], end: true },
  { ifFlags: [FLAGS.cabaneFinie], say: ['Il reste plein de planches.'], end: true },
  { give: ITEMS.planches, text: 'Tu récupères des planches.' },
  { speaker: 'Joshua', say: ['Tu as survécu aux poules ? Respect.'] },
];
export const ROPE = [
  { give: ITEMS.corde, text: 'Tu trouves une vieille corde, cachée dans les hautes herbes.' },
];
// Une poule garde le tas de planches : elle s'enfuit quand on lui parle.
export const henScript = (flag) => [
  { say: ['Cot cot ! La poule s\'enfuit en battant des ailes.'] },
  { setFlag: flag },
];

// Les cousins à la cabane : avant l'annonce, puis l'adieu, puis après.
export const FELIX_AT_CABANE = [
  { ifFlags: [FLAGS.adieuCousins], speaker: 'Felix', say: ['La cabane t\'attendra. Allez, file, ta famille t\'attend à la voiture, devant ta maison.'], end: true },
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

// Le départ : la voiture chargée devant la maison.
export const CAR = [
  {
    unlessFlags: [FLAGS.adieuCousins],
    say: ['La voiture est chargée. Va d\'abord dire au revoir à tes cousins, à la cabane.'],
    end: true,
  },
  { say: ['La voiture est chargée. Tu montes à l\'arrière, à côté de Manon et de Fanny.'] },
  { drive: 'familyCar' },
  { black: true },
  { wait: 400 },
  { speaker: 'Maman', say: ['Regarde bien Saint-Ay.'] },
  { speaker: 'Papa', say: ['Elle ne va pas bouger. On reviendra.'] },
  { say: ['Manon te montre son coquillage.'] },
  { speaker: 'Manon', say: ['Tu as toujours le tien ?'] },
  { say: ['Par la vitre arrière : le lac, la clinique, puis la cabane des cousins qui disparaît derrière les arbres.'] },
  { say: ['Tu emportes : Grand frère et Cousins pour la vie.'] },
  { setFlag: FLAGS.arriveeMontepilloy },
  { travel: { map: 'montepilloy', x: 14, y: 21, facing: 'up', car: true } },
];

