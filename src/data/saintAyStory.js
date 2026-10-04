import { FLAGS, ITEMS, TRAITS } from './story.js';
import { MONTEPILLOY_SPOTS } from './montepilloyStory.js';

// Scénario de Saint-Ay (voir le document « Scénarios Poké-Pierre — Fort-de-France & Saint-Ay ») : Pierre gagne
// Patience à la naissance de Fanny, puis Esprit d'équipe en construisant une cabane avec ses cousins (planches et
// corde dans n'importe quel ordre), et part en voiture pour Montépilloy après une nouvelle mutation de Papa.
// Pas de PNJ qui suit Pierre : ils disent où les rejoindre, partent à l'écran, et l'attendent sur place.
// Scénettes partagées par la carte du village et les intérieurs (étapes : voir MapScene.runSteps).

const HAS_TRAITS = { ifSouvenirs: [TRAITS.patience.id, TRAITS.espritEquipe.id] };
// La cabane des cousins : posée sur deux blocs de sapins de la forêt au sud du lac (cases 2 à 5, rangées 18
// et 19). Pied de l'échelle : la case où l'on monte, devant le sapin de droite (praticable une fois la cabane
// construite, voir les portes `when`) ; la plateforme bloque les 4 x 3 cases au-dessus (de x - 1 à x + 2).
export const CABANE_SPOT = { x: 4, y: 19 };
// Quelques années après la cabane : Pierre au bord du lac (voir CABANE_FETE, MANON_NEWS).
export const LAKE_SPOT = { x: 10, y: 14 };

// Arrivée : image d'accueil de Saint-Ay, le ferry a accosté au ponton du lac. Papa et Manon retrouvent Pierre,
// lui disent de les rejoindre à la clinique et partent devant, l'un derrière l'autre (ils y sont à son arrivée).
export const CLINIC_DOOR = [19, 21];                                  // case devant la porte de la clinique
export const ARRIVAL = [
  { opening: { postcard: 'saintAy', text: 'Saint-Ay, Loiret. Quelque temps plus tard…' } },
  { approach: 'papa' },
  {
    speaker: 'Papa',
    say: [
      'Te voilà enfin ! On te cherche partout.',
      'Maman est à la clinique : le bébé est arrivé ! Rejoins-nous là-bas, c\'est le bâtiment au toit d\'ardoise, en bas du village.',
    ],
  },
  { approach: 'manon' },
  { speaker: 'Manon', say: ['Vite, dépêche-toi !'] },
  { setFlag: FLAGS.saArrivee },
  { walkLine: ['papa', 'manon'], to: CLINIC_DOOR, then: [FLAGS.familleSuit] },
];

// La clinique : Maman vient d'accoucher de Fanny. Pierre s'approche du berceau ; à lui de tendre la main
// (FANNY_CRADLE, Patience).
export const BIRTH = [
  { setFlag: FLAGS.familleArrivee },
  { speaker: 'Papa', say: ['Te voilà ! Maman est là-bas.'] },
  { say: ['Maman est allongée dans son lit. Dans le lit d\'à côté, une petite tête brune dépasse de la couverture.'] },
  { speaker: 'Maman', say: ['Te voilà ! Viens voir… Je te présente Fanny.'] },
  { speaker: 'Manon', say: ['Elle est toute petite… Elle me ressemble, non ?'] },
  { speaker: 'Papa', say: ['Elle ne pleure même pas. Elle a déjà tout compris.'] },
  { goTo: [3, 4], facing: 'up' },                                   // devant le berceau de Fanny
  { speaker: 'Maman', say: ['Approche-toi. Tends-lui la main, doucement.'] },
];

// Le berceau de Fanny — Patience : Pierre tend un doigt (A), elle l'attrape et ne le lâche pas tout de suite.
export const FANNY_CRADLE = [
  { ifSouvenirs: [TRAITS.patience.id], say: ['Fanny dort, son petit poing serré.'], end: true },
  { say: ['Tu tends un doigt vers Fanny…'] },
  { emote: 'player', kind: 'surprise' },
  { say: ['Elle l\'attrape ! Et elle serre fort. Tu attends… elle ne le lâche pas tout de suite.'] },
  { speaker: 'Maman', say: ['Elle a de la poigne, celle-là.', 'À partir d\'aujourd\'hui, tu vas veiller sur elle.'] },
  { trait: TRAITS.patience },
];

// En sortant de la clinique : la famille rentre à la maison ; Felix vient chercher Pierre et part devant.
export const CLINIC_EXIT = [
  { setFlag: FLAGS.familleRentree },
  { talk: 'felix' },
  { walk: 'felix', to: [18, 13], then: [FLAGS.felixInvite] },
];

// Chez Felix : le plan de la cabane. Joshua et Yanis partent chercher planches et corde ; Felix dirige et rappelle ce
// qu'il reste à faire.
export const CABANE_PLAN = [
  { setFlag: FLAGS.maisonFelixVisitee },
  { approach: 'felix-maison' },
  { speaker: 'Felix', say: ['Bienvenue chez nous ! J\'ai un plan : on construit une cabane. Rien que pour nous.'] },
  { speaker: 'Joshua', say: ['Il faut des planches. Il y en a plein dans l\'enclos à poules… mais il y a les poules.'] },
  { speaker: 'Yanis', say: ['Et une corde pour les tenir. J\'en ai vu une dans les hautes herbes, tout au sud-ouest.'] },
  { speaker: 'Felix', say: ['Moi, je dirige le chantier. On la perche dans les sapins, au sud du lac.'] },
  { say: ['Joshua et Yanis filent dehors.'] },
  { setFlag: FLAGS.planCabane },
];

// Felix dirige le chantier : tout réuni, la cabane est construite.
export const FELIX_CHANTIER = [
  // Il manque encore des matériaux.
  { unlessItems: [ITEMS.planches.id], speaker: 'Felix', say: ['Il nous faut encore les planches : Joshua t\'attend devant l\'enclos à poules. Écarte les poules du tas !'] },
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

// Dans la cabane toute neuve (voir interiors.cabane) : les quatre cousins assis derrière les deux longues
// tables. Chacun parle en sautillant, puis toute la bande saute de joie. Pierre se retrouve debout devant
// les tables, toujours dans la cabane.
export const CABANE_FETE = [
  { black: true },
  { wait: 500 },
  { black: false },
  { say: ['La cabane est finie. Les quatre cousins s\'installent au QG.'] },
  { hop: 'felix-cabane' },
  { speaker: 'Felix', say: ['Voilà. Notre QG.'] },
  { hop: 'joshua-cabane' },
  { speaker: 'Joshua', say: ['Personne n\'entre sans le mot de passe.'] },
  { hop: 'yanis-cabane', times: 2 },
  { speaker: 'Yanis', say: ['On a un mot de passe ?'] },
  { face: { 'felix-cabane': 'right', player: 'left' } },
  { speaker: 'Felix', say: ['Pas encore. Pierre, à toi de le choisir !'] },
  { askWord: { title: 'MOT DE PASSE DU QG ?', key: 'motDePasse', max: 8 } },
  { speaker: 'Felix', say: ['« {motDePasse} »… Parfait. Personne ne le saura.'] },
  { hop: 'joshua-cabane' },
  { speaker: 'Joshua', say: ['{motDePasse}. Retenu.'] },
  { speaker: 'Felix', say: ['Où que tu ailles après, cette cabane restera la nôtre. On est une équipe.'] },
  { face: { 'felix-cabane': 'down', player: 'down' } },
  { cheer: ['felix-cabane', 'player', 'joshua-cabane', 'yanis-cabane'] },
  { trait: TRAITS.espritEquipe },
  // Ellipse : quelques années plus tard, Pierre au bord du lac ; Manon vient le chercher (voir MANON_NEWS).
  { black: true },
  { wait: 600 },
  { say: ['Quelques années plus tard…'] },
  { setFlag: FLAGS.ellipseSaintAy },
  { travel: { map: 'saintAy', ...LAKE_SPOT, facing: 'left' } },
];

// Quelques années plus tard, au bord du lac : Manon vient chercher Pierre, puis rentre devant à la maison, où Papa
// fait son annonce (ANNOUNCEMENT).
export const MANON_NEWS = [
  { approach: 'manon-lac' },
  { speaker: 'Manon', say: ['Ah, te voilà ! Papa a une nouvelle à nous annoncer. Viens vite à la maison !'] },
  { walk: 'manon-lac', to: [18, 7], then: [FLAGS.manonNouvelle] },
];

// Missions : les planches de l'enclos à poules (gardées par les poules) et la vieille corde cachée dans les hautes
// herbes du sud-ouest (elle n'apparaît qu'une fois le chantier lancé).
export const PLANKS = [
  { unlessFlags: [FLAGS.planCabane], say: ['Un tas de planches. De quoi construire quelque chose…'], end: true },
  { give: ITEMS.planches, text: 'Tu récupères des planches.' },
  { speaker: 'Joshua', say: ['Tu as survécu aux poules ? Respect.'] },
];
export const ROPE = [
  { give: ITEMS.corde, text: 'Tu trouves une vieille corde, cachée dans les hautes herbes.' },
];
// Les poules collées au tas de planches : on les pousse (A, face à elles) d'une case dans le sens où l'on regarde,
// pour dégager le tas (voir MapScene.pushNpc). Poussée jusqu'à la porte de l'enclos, une poule s'échappe.
export const ENCLOS_EXIT = [26, 7];
export const henPush = (flag) => ({ exit: [ENCLOS_EXIT], flag, escaped: ['La poule file hors de l\'enclos en caquetant !'] });

// Les cousins à la cabane : avant l'annonce, puis l'adieu, puis après.
export const FELIX_AT_CABANE = [
  { ifFlags: [FLAGS.adieuCousins], speaker: 'Felix', say: ['La cabane t\'attendra. Allez, file, ta famille t\'attend à la voiture, devant ta maison.'], end: true },
  { unlessFlags: [FLAGS.annonceMutation], speaker: 'Felix', say: ['Notre QG ! Reviens quand tu veux.'], end: true },
  { speaker: 'Felix', say: ['Alors c\'est vrai, tu pars ?'] },
  { speaker: 'Joshua', say: ['Montépilloy, c\'est pas le bout du monde.'] },
  { speaker: 'Yanis', say: ['C\'est où, Montépilloy ?'] },
  { speaker: 'Felix', say: ['La cabane t\'attendra. Et le mot de passe ne change pas : « {motDePasse} ».'] },
  { setFlag: FLAGS.adieuCousins },
];

// L'annonce, en rentrant à la maison au toit de chaume avec les deux traits.
// Quelques années ont passé (voir CABANE_FETE) : Fanny court partout et coupe Papa une fois.
export const ANNOUNCEMENT = [
  { say: ['Papa est assis à la table, une lettre à la main. Fanny a bien grandi : elle court partout dans le salon.'] },
  { speaker: 'Papa', say: ['J\'ai reçu ma nouvelle affectation. On part à Monté…'] },
  { hop: 'fanny-maison', times: 3 },
  { speaker: 'Papa', say: ['Fanny, repose ça !'] },
  { say: ['Fanny repose le vase… à peu près droit.'] },
  { speaker: 'Papa', say: ['Bon. Je disais : on part pour Montépilloy.'] },
  { speaker: 'Manon', say: ['Encore ?'] },
  { speaker: 'Papa', say: ['L\'armée ne demande pas notre avis.'] },
  { speaker: 'Fanny', say: ['Je pourrai emmener mes poupées ?'] },
  { speaker: 'Maman', say: ['On y arrivera, comme à chaque fois. Tous ensemble.'] },
  { speaker: 'Papa', say: ['Et cette fois, pas de ferry. On prend la voiture.'] },
  { setFlag: FLAGS.annonceMutation },
];
export const ANNOUNCEMENT_EVENT = { ...HAS_TRAITS, unlessFlags: [FLAGS.annonceMutation] };

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
  { say: ['Tu emportes : Patience et Esprit d\'équipe.'] },
  { setFlag: FLAGS.arriveeMontepilloy },
  { travel: { map: 'montepilloy', ...MONTEPILLOY_SPOTS.pond, facing: 'down', car: true } },
];


// Le vieux pêcheur du lac, méfiant : il ne parle qu'à quelqu'un de confiance (premier usage d'un trait). Il donne
// alors l'objet-souvenir de Saint-Ay, un galet du lac.
export const OLD_FISHER = [
  { ifItems: [ITEMS.galetLac.id], speaker: 'Vieux pêcheur', say: ['Prends soin de ce galet. Et de ta petite sœur.'], end: true },
  { unlessSouvenirs: [TRAITS.confiance.id], say: ['Le vieil homme te tourne le dos. Il ne parle pas aux inconnus.'], end: true },
  { speaker: 'Vieux pêcheur', say: ['Hm ? Je ne parle pas aux inconnus, moi.'] },
  { useTrait: TRAITS.confiance },
  { say: ['Tu t\'assois à côté de lui sans rien dire, comme avec Manon quand vous gardiez un secret.'] },
  { speaker: 'Vieux pêcheur', say: ['… T\'as l\'air d\'un gamin de confiance, toi.', 'Ce galet, je l\'ai trouvé au fond du lac quand j\'avais ton âge. Il porte bonheur. Garde-le.'] },
  { give: ITEMS.galetLac, text: 'Le vieux pêcheur te donne un galet tout lisse.' },
];
