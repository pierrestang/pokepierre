import { FLAGS, ITEMS, ROLES } from './story.js';

// Scénario de Hull (voir le document « Hull ») : Pierre vit ses années d'études avec sa bande de potes français.
// Une soirée menée par Léo à travers la ville (la file s'allonge : Ousmane, puis Charlotte et Anaïs ; deux
// pubs, puis l'Asylum où attendent Romain et Paul), la sortie au petit matin, puis les révisions à la
// bibliothèque et l'examen qui ouvre le vol pour Hanoï. Les étapes s'enchaînent dans un ordre fixe.
// Scénettes partagées par la carte et les intérieurs (étapes : voir MapScene.runSteps).

const BANDE = ROLES.bandeHull.id;

// Arrêt de bus, bout ouest de la grande rue ; colocs et bars de Newland Avenue (cases devant les portes).
export const HULL_SPOTS = {
  busStop: [5, 36],
  colocDoor: [2, 24],
  leoDoor: [24, 18],
  coloc2Door: [8, 24],
  pubADoor: [8, 18],
  pubBDoor: [19, 24],
  asylumDoor: [23, 13],
};

// Arrivée en bus : écran noir, il pleut, Ousmane attend à l'arrêt et te montre la coloc (il marche devant).
export const ARRIVAL = [
  { black: true },
  { wait: 700 },
  { say: ['Hull, Angleterre.'] },
  { black: false },
  { say: ['Il pleut. Ousmane attend à l\'arrêt de bus.'] },
  { approach: 'ousmane-arrivee' },
  { speaker: 'Ousmane', say: ['T\'es enfin là ! Bienvenue en Angleterre. Oui, il pleut. Il pleut tout le temps.', 'Viens, je te montre la coloc.'] },
  { setFlag: FLAGS.hullAccueil },
  { walk: 'ousmane-arrivee', to: HULL_SPOTS.colocDoor, lead: true, then: [FLAGS.ousmaneRentre] },
];
// Si tu t'es éloigné avant qu'Ousmane n'arrive à la coloc, il reprend sa marche.
export const OUSMANE_WALK = [{ walk: 'ousmane-arrivee', to: HULL_SPOTS.colocDoor, lead: true, then: [FLAGS.ousmaneRentre] }];

// Dans la coloc de Pierre et Ousmane : le déclenchement, puis Ousmane rejoint la file.
export const LEO_CALLED = [
  { approach: 'ousmane-coloc' },
  { speaker: 'Ousmane', say: ['Au fait, Léo a appelé. Il veut te voir, il a un plan.', 'Moi je me prépare. Passez me chercher.'] },
  { setFlag: FLAGS.leoAppel },
];
export const OUSMANE_JOINS = [
  { approach: 'ousmane-coloc' },
  { speaker: 'Ousmane', say: ['Prêt ! On y va.'] },
  { setFlag: FLAGS.ousmaneSuit },
];

// Chez Léo : Romain et Paul viendront par leurs propres moyens ; Léo lance la soirée, la nuit tombe.
export const LEO_PLAN = [
  { approach: 'leo-maison' },
  { speaker: 'Romain', say: ['Vous sortez ce soir ? On vous rejoint à l\'Asylum.'] },
  { speaker: 'Paul', say: ['On a nos propres plans avant.'] },
  { speaker: 'Léo', say: ['Ce soir, on sort. Tout le monde. Suis-moi !'] },
  { black: true },
  { say: ['La nuit tombe sur Hull.'] },
  { setFlag: FLAGS.leoPlan },
  { black: false },
];

// La coloc de Charlotte et Anaïs : elles rejoignent la file.
export const GIRLS_JOIN = [
  { approach: 'charlotte-coloc' },
  { speaker: 'Charlotte', say: ['Enfin ! On vous attendait.'] },
  { speaker: 'Anaïs', say: ['On y va ?'] },
  { setFlag: FLAGS.amiesSuivent },
];

// Premier pub : commander une pinte au bar (on parle au barman par-dessus le comptoir).
export const PUB_A_BAR = [
  { ifFlags: [FLAGS.pinteCommandee], speaker: 'Barman', say: ['Cheers, mate!'], end: true },
  {
    speaker: 'Barman',
    choose: 'What can I get you?',
    choices: [
      {
        label: 'Une pinte, please !',
        steps: [
          { say: ['Le barman te tend une pinte bien fraîche.'] },
          { speaker: 'Ousmane', say: ['Santé ! Allez, deuxième pub.'] },
          { setFlag: FLAGS.pinteCommandee },
        ],
      },
      { label: 'Rien, merci', steps: [{ speaker: 'Barman', say: ['No worries.'] }] },
    ],
  },
];

// Deuxième pub : retrouver la table de la bande, avec les verres.
export const PUB_B_TABLE = [
  { ifFlags: [FLAGS.tableTrouvee], say: ['Votre table, avec vos verres.'], end: true },
  { say: ['Voilà la table de la bande, avec vos verres !'] },
  { speaker: 'Charlotte', say: ['On vous a gardé des places. Dernier verre, et direction l\'Asylum !'] },
  { setFlag: FLAGS.tableTrouvee },
];
export const PUB_B_OTHER = [{ say: ['Des inconnus. Ce n\'est pas votre table.'] }];

// L'Asylum : Romain et Paul sont déjà là ; rejoindre tout le monde sur la piste, dernière chanson, sortie.
export const ASYLUM_ENTER = [
  { approach: 'romain-asylum' },
  { speaker: 'Romain', say: ['Vous en avez mis du temps !'] },
  { speaker: 'Léo', say: ['Tout le monde sur la piste !'] },
];
const BAND_ASYLUM = ['romain-asylum', 'paul-asylum', 'leo-asylum', 'ousmane', 'charlotte', 'anais'];
export const ASYLUM_DANCE = [
  { speaker: 'Léo', say: ['C\'est notre chanson ! Venez tous !'] },
  { gather: BAND_ASYLUM, area: [4, 4, 4, 3] },
  { say: ['Toute la bande danse sur la piste.'] },
  { dance: BAND_ASYLUM },
  { say: ['La musique ralentit… Dernière chanson.'] },
  { black: true },
  { wait: 800 },
  { setFlag: FLAGS.asylumFini },
  { travel: { map: 'hull', x: HULL_SPOTS.asylumDoor[0], y: HULL_SPOTS.asylumDoor[1], facing: 'down' } },
];

// La sortie, au petit matin : Léo part dans la mauvaise direction, puis « La bande de Hull » ; Ousmane et Pierre
// rentrent se coucher, et le lendemain matin Pierre est devant la coloc (voir NEXT_MORNING).
export const DAWN = [
  { say: ['Ciel bleuté, les réverbères s\'éteignent. La bande est devant l\'Asylum.'] },
  { approach: 'leo-aube' },
  { speaker: 'Léo', say: ['Ok guys, zis night was very, very beautiful. Now we go \'ome. Follow me, I know ze way!'] },
  { walk: 'leo-aube', to: [19, 11], block: true },
  { speaker: 'Ousmane', say: ['Léo… c\'est de l\'autre côté.'] },
  { speaker: 'Charlotte', say: ['Au fait… les exams, c\'est dans trois jours.'] },
  { speaker: 'Anaïs', say: ['Ne dis pas ça maintenant.'] },
  { speaker: 'Léo', say: ['Demain, bibliothèque. Tout le monde.'] },
  { speaker: 'Ousmane', say: ['Allez, on rentre se coucher.'] },
  { quality: ROLES.bandeHull },
  { say: ['Ousmane et toi rentrez à la coloc.'] },
  { black: true },
  { wait: 700 },
  { say: ['Le lendemain matin…'] },
  { travel: { map: 'hull', x: HULL_SPOTS.colocDoor[0], y: HULL_SPOTS.colocDoor[1], facing: 'down' } },
];

// Le lendemain matin, devant la coloc : direction la bibliothèque.
export const NEXT_MORNING = [
  { say: ['Devant la coloc. Les révisions t\'attendent à la bibliothèque Brynmor Jones, en haut, sur le campus.'] },
  { setFlag: FLAGS.lendemainHull },
];

// Le lendemain, à la bibliothèque (retour en plein jour).
export const LIBRARY = [
  { say: ['Léo, Ousmane, Charlotte et Anaïs travaillent déjà autour d\'une table.'] },
  { say: ['Tu t\'assois. Un livre apparaît devant toi, les pages tournent.'] },
  { black: true },
  { wait: 900 },
  { say: ['Trois heures plus tard…'] },
  { black: false },
  { speaker: 'Léo', say: ['J\'ai lu la même page six fois.'] },
  { setFlag: FLAGS.revisions },
];

// L'examen, à l'université : fondu sur la salle d'examen, puis le Diplôme de Hull.
export const EXAM = [
  { speaker: 'Professor', say: ['Good luck!'] },
  { black: true },
  { wait: 1200 },
  { black: false },
  { speaker: 'Professor', say: ['Congratulations! Voici ton diplôme.'] },
  { give: ITEMS.diplomeHull, text: 'Tu as reçu : le Diplôme de Hull.' },
  { speaker: 'Professor', say: ['Well done! Le bus rouge t\'emmènera à l\'aéroport.'] },
];

// Conditions des ambiances de la carte : nuit pendant la soirée, petit matin à la sortie de l'Asylum.
export const NIGHT = { ifFlags: [FLAGS.leoPlan], unlessFlags: [FLAGS.asylumFini] };
export const DAWN_TIME = { ifFlags: [FLAGS.asylumFini], unlessSouvenirs: [BANDE] };
