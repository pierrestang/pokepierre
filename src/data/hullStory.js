import { FLAGS, ITEMS, TRAITS } from './story.js';

// Scénario de Hull (voir le document « Hull ») : Pierre vit ses années d'études avec sa bande de potes français.
// Une soirée menée par Léo à travers la ville (la file s'allonge : Ousmane, puis Charlotte et Anaïs ; deux
// pubs, puis l'Asylum où attendent Romain et Paul), la sortie au petit matin, puis les révisions à la
// bibliothèque et l'examen qui ouvre le vol pour Hanoï. Les étapes s'enchaînent dans un ordre fixe.
// Scénettes partagées par la carte et les intérieurs (étapes : voir MapScene.runSteps).

const BANDE = TRAITS.bandeHull.id;

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

// La soirée de Léo, étape par étape : il attend devant la porte d'où l'on sort (`from`), marche jusqu'à la porte
// suivante (`door`) en menant la bande (il attend si l'on traîne), y entre (`entered`) ; on le retrouve dedans.
// `hint` : ce qu'il dit si on lui parle en chemin.
export const LEO_ROUTE = [
  {
    from: HULL_SPOTS.leoDoor, door: [2, 23], ifFlags: [FLAGS.leoPlan], unlessFlags: [FLAGS.ousmaneSuit], entered: FLAGS.leoColoc,
    hint: ['D\'abord, on passe chercher Ousmane à votre coloc, en bas de Newland Avenue. Suis-moi !'],
  },
  {
    from: [3, 24], door: [8, 23], ifFlags: [FLAGS.ousmaneSuit], unlessFlags: [FLAGS.amiesSuivent], entered: FLAGS.leoColoc2,
    hint: ['Maintenant, Charlotte et Anaïs, la coloc juste à côté. Suis-moi !'],
  },
  {
    from: [9, 24], door: [8, 17], ifFlags: [FLAGS.amiesSuivent], unlessFlags: [FLAGS.pinteCommandee], entered: FLAGS.leoPubA,
    hint: ['Premier pub, un peu plus haut sur Newland Avenue. La première pinte est pour toi !'],
  },
  {
    from: [9, 18], door: [19, 23], ifFlags: [FLAGS.pinteCommandee], unlessFlags: [FLAGS.tableTrouvee], entered: FLAGS.leoPubB,
    hint: ['Deuxième pub, de l\'autre côté de l\'avenue. Les autres nous gardent une table !'],
  },
  {
    from: [20, 24], door: [23, 12], ifFlags: [FLAGS.tableTrouvee], unlessFlags: [FLAGS.asylumFini], entered: FLAGS.leoAsylum,
    hint: ['Direction l\'Asylum, la boîte du campus, tout en haut. Romain et Paul y sont déjà !'],
  },
];

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
  { speaker: 'Ousmane', say: ['Au fait, Léo a appelé. Il veut te voir, il a un plan.', 'Il habite la maison au toit d\'ardoise, en haut de Newland Avenue, à droite.', 'Moi je me prépare. Passez me chercher.'] },
  { setFlag: FLAGS.leoAppel },
];
export const OUSMANE_JOINS = [
  { approach: 'ousmane-coloc' },
  { speaker: 'Léo', say: ['Ousmane ! La soirée commence, on n\'attend plus que toi.'] },
  { speaker: 'Ousmane', say: ['Prêt ! On y va.'] },
  { speaker: 'Léo', say: ['Prochaine étape : Charlotte et Anaïs, la coloc juste à côté. Suivez-moi !'] },
  { walk: 'leo-in-0', to: [3, 7], block: true },
  { setFlag: FLAGS.ousmaneSuit },
];

// Chez Léo : Romain et Paul viendront par leurs propres moyens ; Léo lance la soirée, la nuit tombe.
export const LEO_PLAN = [
  { approach: 'leo-maison' },
  { speaker: 'Romain', say: ['Vous sortez ce soir ? On vous rejoint à l\'Asylum.'] },
  { speaker: 'Paul', say: ['On a nos propres plans avant.'] },
  { speaker: 'Léo', say: ['Ce soir, on sort. Tout le monde. On passe d\'abord chercher Ousmane à votre coloc. Suis-moi !'] },
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
  { speaker: 'Léo', say: ['Premier pub, un peu plus haut sur Newland Avenue. Suivez-moi !'] },
  { walk: 'leo-in-1', to: [3, 7], block: true },
  { setFlag: FLAGS.amiesSuivent },
];

// Premier pub : commander une pinte au bar (on parle au barman par-dessus le comptoir). Le barman la tire à la
// pompe et la fait glisser jusqu'à toi ; toute la bande trinque, puis Léo repart vers le deuxième pub.
const BAND = ['player', 'ousmane', 'charlotte', 'anais'];
export const PUB_A_BAR = [
  { ifFlags: [FLAGS.pinteCommandee], speaker: 'Barman', say: ['Cheers, mate!'], end: true },
  {
    speaker: 'Barman',
    choose: 'What can I get you?',
    choices: [
      {
        label: 'Une pinte, please !',
        steps: [
          { speaker: 'Barman', say: ['One pint, coming right up!'] },
          { walk: 'barman-a', to: [2, 2], block: true },
          { face: { 'barman-a': 'down' } },
          { say: ['Le barman tire la pinte à la pompe…'] },
          { slide: 'pint', from: [2, 3], to: 'player' },
          { say: ['… et la fait glisser sur le comptoir jusqu\'à toi.'] },
          { speaker: 'Ousmane', say: ['Santé !'] },
          { hop: [...BAND, 'leo-in-2'], times: 2 },
          { speaker: 'Léo', say: ['Allez, deuxième pub, de l\'autre côté de l\'avenue ! J\'ai réservé une table. Suivez-moi !'] },
          { walk: 'leo-in-2', to: [4, 7], block: true },
          { setFlag: FLAGS.pinteCommandee },
        ],
      },
      { label: 'Rien, merci', steps: [{ speaker: 'Barman', say: ['No worries.'] }] },
    ],
  },
];

// Deuxième pub : la table que Léo a réservée, les verres déjà servis. La bande s'installe autour et trinque, puis
// Léo repart vers l'Asylum.
export const PUB_B_TABLE = [
  { ifFlags: [FLAGS.tableTrouvee], say: ['Votre table, avec vos verres.'], end: true },
  { say: ['Voilà votre table, les verres déjà servis !'] },
  { gather: ['ousmane', 'charlotte', 'anais', 'leo-in-3'], area: [6, 3, 3, 3] },
  { speaker: 'Charlotte', say: ['Léo a pensé à tout ! Dernier verre, et direction l\'Asylum.'] },
  { speaker: 'Anaïs', say: ['Santé !'] },
  { hop: [...BAND, 'leo-in-3'], times: 2 },
  { speaker: 'Léo', say: ['Romain et Paul nous attendent à l\'Asylum, tout en haut, sur le campus. Suivez-moi !'] },
  { walk: 'leo-in-3', to: [5, 7], block: true },
  { setFlag: FLAGS.tableTrouvee },
];
export const PUB_B_OTHER = [{ say: ['Des inconnus. Ce n\'est pas votre table : la vôtre est au fond à droite.'] }];

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
  { trait: TRAITS.bandeHull },
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
  { speaker: 'Anaïs', say: ['On est prêts. L\'examen d\'anglais, c\'est à l\'université : le professeur nous attend !'] },
  { setFlag: FLAGS.revisions },
];

// L'examen d'anglais, à l'université : trois questions très faciles (reposées tant que la réponse est fausse),
// puis le Diplôme de Hull.
const TRY_AGAIN = { default: ['Hmm… Not quite. Try again!'] };
export const EXAM = [
  { speaker: 'Professor', say: ['Welcome to your English exam! Three questions. Good luck!'] },
  { say: ['Tu t\'assois. La feuille d\'examen est posée devant toi.'] },
  {
    quiz: {
      speaker: 'Professor',
      question: 'Question 1/3 : « chat », in English ?',
      choices: ['Dog', 'Cat', 'Bird'],
      answer: 'Cat',
      wrong: TRY_AGAIN,
    },
  },
  { speaker: 'Professor', say: ['Correct!'] },
  {
    quiz: {
      speaker: 'Professor',
      question: 'Question 2/3 : I ___ a student.',
      choices: ['am', 'is', 'are'],
      answer: 'am',
      wrong: TRY_AGAIN,
    },
  },
  { speaker: 'Professor', say: ['Very good!'] },
  {
    quiz: {
      speaker: 'Professor',
      question: 'Question 3/3 : « Merci », in English ?',
      choices: ['Hello', 'Sorry', 'Thank you'],
      answer: 'Thank you',
      wrong: TRY_AGAIN,
    },
  },
  { black: true },
  { wait: 900 },
  { say: ['Quelques jours plus tard, les résultats…'] },
  { black: false },
  { speaker: 'Professor', say: ['Three out of three! Congratulations! Voici ton diplôme.'] },
  { give: ITEMS.diplomeHull, text: 'Tu as reçu : le Diplôme de Hull.' },
  { speaker: 'Professor', say: ['Well done! Le bus rouge, à l\'arrêt de la grande rue, t\'emmènera à l\'aéroport.'] },
];

// Conditions des ambiances de la carte : nuit pendant la soirée, petit matin à la sortie de l'Asylum.
export const NIGHT = { ifFlags: [FLAGS.leoPlan], unlessFlags: [FLAGS.asylumFini] };
export const DAWN_TIME = { ifFlags: [FLAGS.asylumFini], unlessSouvenirs: [BANDE] };
