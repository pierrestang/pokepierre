import { FLAGS, ITEMS, TRAITS, carryText } from './story.js';

// Scénario de Hull : les années d'études avec la bande (qui connaît déjà Pierre depuis Bordeaux : des retrouvailles).
//   1. L'arrivée en bus, Ousmane à l'arrêt, la coloc ; Léo a appelé ; chez Léo, la soirée est lancée (la nuit tombe).
//   2. Premier pub : la tournée (chaque commande, puis le barman, en anglais) ; une erreur, on retourne redemander.
//   3. Deuxième pub : une partie de fléchettes contre un habitué (systems/Darts.js), gagnée ou perdue.
//   4. L'Asylum, puis le petit matin devant la boîte : Lâcher-prise ; rentrer dormir.
//   5. La veille de l'examen, les révisions à la bibliothèque (tour de table, choix sans mauvaise réponse bloquante).
//   6. Le lendemain, les résultats devant l'université : le diplôme d'anglais de Hull.
//   7. Les adieux devant chez Léo : chacun part en échange ; Léo et Ousmane restent. Puis l'avion pour Hanoï.
// Pas de PNJ qui suit Pierre : la bande l'attend à chaque étape. Scénettes partagées par la carte et les intérieurs.

// Arrêt de bus, bout ouest de la grande rue ; colocs et maisons de Newland Avenue (cases devant les portes).
export const HULL_SPOTS = {
  busStop: [5, 36],
  colocDoor: [2, 24],
  leoDoor: [25, 18],
};

// ---------- 1. L'arrivée ----------

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

// Dans la coloc : Léo a appelé.
export const LEO_CALLED = [
  { approach: 'ousmane-coloc' },
  { speaker: 'Ousmane', say: ['Au fait, Léo a appelé. Il veut te voir, il a un plan.', 'Il habite la maison au toit d\'ardoise, en haut de Newland Avenue, à droite.'] },
  { setFlag: FLAGS.leoAppel },
];

// Chez Léo : la soirée est lancée, rendez-vous au pub ; Romain et Prophecy viendront à l'Asylum.
export const LEO_PLAN = [
  { approach: 'leo-maison' },
  { speaker: 'Léo', say: ['Ce soir, on sort. Tout le monde.'] },
  { speaker: 'Romain', say: ['Nous, on vous rejoint à l\'Asylum.'] },
  { speaker: 'Prophecy', say: ['On a nos propres plans avant.'] },
  { speaker: 'Léo', say: ['Les autres sont déjà au pub, en haut de Newland Avenue. On y va !'] },
  { black: true },
  { say: ['La nuit tombe sur Hull.'] },
  { setFlag: FLAGS.leoPlan },
  { black: false },
  { say: ['Objectif : rejoins la bande au pub, en haut de Newland Avenue.'] },
];

// ---------- 2. Premier pub : la tournée ----------

// La bande à table : chacun sa commande (en français) ; au comptoir, le barman la demande en anglais.
const DRINKS = ['A pint of Guinness', 'A pint of cider', 'A gin and tonic', 'A glass of red wine', 'A pint of lager', 'A whisky'];
export const ORDERS = [
  { id: 'leo-pub', name: 'Léo', drink: 'A pint of Guinness', line: 'Une Guinness, évidemment.', flag: FLAGS.servieLeo, him: 'lui' },
  { id: 'ousmane-pub', name: 'Ousmane', drink: 'A pint of cider', line: 'Un cidre, s\'il te plaît.', flag: FLAGS.servieOusmane, him: 'lui' },
  { id: 'charlotte-pub', name: 'Charlotte', drink: 'A gin and tonic', line: 'Un gin tonic !', flag: FLAGS.servieCharlotte, him: 'lui' },
  { id: 'anais-pub', name: 'Anaïs', drink: 'A glass of red wine', line: 'Un verre de vin rouge.', flag: FLAGS.servieAnais, him: 'lui' },
];
const ALL_SERVED = ORDERS.map((o) => o.flag);

export const PUB_A_WELCOME = [
  { speaker: 'Léo', say: ['Première tournée, c\'est le nouveau !'] },
  { say: ['Objectif : ramène la tournée. Demande à chacun ce qu\'il veut, puis commande au comptoir.'] },
];

// Ce que chacun dit à table : sa commande (on peut la redemander autant qu'on veut).
export const orderScript = ({ name, line, flag }) => [
  { ifFlags: [flag], speaker: name, say: ['Merci ! Le reste arrive ?'], end: true },
  { speaker: name, say: [line] },
];

// Le comptoir : le barman demande chaque commande en anglais ; une erreur, et la personne concernée proteste.
const CHEERS = [
  { say: ['Le barman pose les verres sur un plateau. Tu rapportes la tournée à la table.'] },
  { hop: ['player', ...ORDERS.map((o) => o.id)], times: 2 },
  { speaker: 'Ousmane', say: ['Santé !'] },
  { speaker: 'Léo', say: ['Cheers ! Allez, on finit ça et on file au pub d\'en face.'] },
  { say: ['Objectif : suis la bande au pub suivant, de l\'autre côté de l\'avenue.'] },
  { setFlag: FLAGS.tourneeServie },
];
export const PUB_A_BAR = [
  { ifFlags: [FLAGS.tourneeServie], speaker: 'Barman', say: ['Cheers, mate!'], end: true },
  { speaker: 'Barman', say: ['Right, a round for your table? Go on, then.'] },
  ...ORDERS.map(({ name, drink, flag, him }) => ({
    unlessFlags: [flag],
    steps: [{
      speaker: 'Barman',
      choose: `And for ${name}?`,
      choices: DRINKS.map((d) => (d === drink
        ? { label: d, steps: [{ setFlag: flag }] }
        : {
          label: d,
          steps: [
            { speaker: name, say: ['Euh, c\'est pas ça ?'] },
            { say: [`Retourne ${him} redemander sa commande.`] },
            { end: true },
          ],
        })),
    }],
  })),
  { ifFlags: ALL_SERVED, steps: CHEERS },
];

// ---------- 3. Deuxième pub : les fléchettes ----------

export const DARTS = [
  { speaker: 'Habitué', say: ['Hey, the new guy! Tu joues ?'] },
  {
    choose: 'Une partie de fléchettes ?',
    choices: [
      {
        label: 'Allez !',
        steps: [
          { darts: { opponent: 'Habitué', win: ['Well played, mate! Tu reviens quand tu veux.'], lose: ['Not bad! La prochaine fois, peut-être.'] } },
          { speaker: 'Léo', say: ['On file à l\'Asylum !'] },
          { say: ['Objectif : rejoins la bande à l\'Asylum, tout en haut, sur le campus.'] },
          { setFlag: FLAGS.flechettesJouees },
        ],
      },
      { label: 'Pas maintenant.', steps: [{ speaker: 'Habitué', say: ['Suit yourself. Je suis là, près de la cible.'] }] },
    ],
  },
];

// ---------- 4. L'Asylum, puis le petit matin ----------

// Romain et Prophecy sont déjà là ; rejoindre tout le monde sur la piste, dernière chanson, sortie.
export const ASYLUM_ENTER = [
  { approach: 'romain-asylum' },
  { speaker: 'Romain', say: ['Vous en avez mis du temps !'] },
  { speaker: 'Léo', say: ['Tout le monde sur la piste !'] },
];
const BAND_ASYLUM = ['romain-asylum', 'prophecy-asylum', 'leo-asylum', 'ousmane-asylum', 'charlotte-asylum', 'anais-asylum'];
export const ASYLUM_DANCE = [
  { speaker: 'Léo', say: ['C\'est notre chanson ! Venez tous !'] },
  { gather: BAND_ASYLUM, area: [4, 4, 4, 3] },
  { say: ['Toute la bande danse sur la piste.'] },
  { dance: BAND_ASYLUM },
  { say: ['La musique ralentit… Dernière chanson.'] },
  { black: true },
  { wait: 800 },
  { setFlag: FLAGS.asylumFini },
  { travel: { map: 'hull', x: 23, y: 13, facing: 'down' } },
];

// Au petit matin, devant l'Asylum, toute la bande : Léo part dans la mauvaise direction ; Lâcher-prise.
export const DAWN = [
  { say: ['Ciel bleuté, les réverbères s\'éteignent. Toute la bande est devant l\'Asylum.'] },
  { approach: 'leo-aube' },
  { speaker: 'Léo', say: ['Ok guys, zis night was very, very beautiful. Now we go \'ome. Follow me, I know ze way!'] },
  { walk: 'leo-aube', to: [19, 11], block: true },
  { speaker: 'Ousmane', say: ['Léo… c\'est de l\'autre côté.'] },
  { speaker: 'Charlotte', say: ['Au fait… les exams, c\'est après-demain.'] },
  { speaker: 'Anaïs', say: ['Ne dis pas ça maintenant.'] },
  { speaker: 'Léo', say: ['Demain, bibliothèque. Tout le monde.'] },
  { trait: TRAITS.lacherPrise },
  { say: ['Objectif : rentre dormir à la coloc.'] },
];

// Rentré à la coloc : on dort ; le lendemain, veille d'examen.
export const SLEEP = [
  { say: ['Tu t\'écroules sur ton lit.'] },
  { black: true },
  { wait: 800 },
  { say: ['Le lendemain, veille d\'examen…'] },
  { setFlag: FLAGS.lendemainHull },
  { black: false },
  { say: ['Objectif : rejoins la bande à la bibliothèque Brynmor Jones, sur le campus.'] },
];

// ---------- 5. Les révisions ----------

// Tour de table : Léo en franglais, Charlotte sérieuse, Prophecy… Prophecy. Aucune réponse ne bloque.
export const LIBRARY = [
  { say: ['La bande révise autour d\'une table. Tour de table !'] },
  { speaker: 'Léo', say: ['Moi d\'abord : « J\'ai checké le planning, on a un meeting ASAP. » En vrai français ?'] },
  {
    choose: 'Que réponds-tu ?',
    choices: [
      { label: 'On se réunit au plus vite.', steps: [{ speaker: 'Léo', say: ['Exactement. Bon, moi je continuerai à parler comme ça.'] }] },
      { label: 'Réunion ASAP, checké.', steps: [{ speaker: 'Léo', say: ['C\'est ce que j\'ai dit, bro !'] }] },
      { label: 'Je parle pas business.', steps: [{ speaker: 'Léo', say: ['Moi non plus, en vrai.'] }] },
    ],
  },
  { speaker: 'Charlotte', say: ['Question sérieuse : le present perfect, on l\'emploie quand ?'] },
  {
    choose: 'Que réponds-tu ?',
    choices: [
      { label: 'Passé lié au présent.', steps: [{ speaker: 'Charlotte', say: ['Parfait. Tu vas l\'avoir, cet examen.'] }] },
      { label: 'Quand on est parfait.', steps: [{ speaker: 'Charlotte', say: ['… On reprend la fiche ensemble, Pierre.'] }] },
      { label: 'Quand le prof le dit.', steps: [{ speaker: 'Charlotte', say: ['Pas faux. Mais non.'] }] },
    ],
  },
  { speaker: 'Prophecy', say: ['Question importante : si je dis « ze » au lieu de « the », ça passe ?'] },
  {
    choose: 'Que réponds-tu ?',
    choices: [
      { label: 'C\'est le charme français.', steps: [{ speaker: 'Prophecy', say: ['Je le savais !'] }] },
      { label: 'Non.', steps: [{ speaker: 'Prophecy', say: ['T\'es dur, là.'] }] },
      { label: 'Ça dépend du correcteur.', steps: [{ speaker: 'Prophecy', say: ['Donc oui.'] }] },
    ],
  },
  { speaker: 'Charlotte', say: ['T\'es prêt.'] },
  { setFlag: FLAGS.revisions },
  { say: ['Objectif : va voir les résultats demain, devant l\'université.'] },
];

// En sortant de la bibliothèque : le lendemain.
export const NEXT_DAY = [
  { black: true },
  { wait: 700 },
  { say: ['Le lendemain…'] },
  { setFlag: FLAGS.jourResultats },
  { black: false },
  { say: ['Objectif : va voir les résultats devant l\'université.'] },
];

// ---------- 6. Les résultats ----------

export const RESULTS = [
  { say: ['Les résultats de l\'examen d\'anglais sont affichés. Tu cherches ton nom…'] },
  { faceTo: 'leo-resultats' },
  { speaker: 'Léo', say: ['Diplôme de Hull, bro !'] },
  { give: ITEMS.diplomeHull, text: 'Diplôme obtenu : Anglais de Hull !' },
  { speaker: 'Léo', say: ['Toute la bande se retrouve devant chez moi. Viens !'] },
  { say: ['Objectif : retrouve la bande devant chez Léo.'] },
];

// ---------- 7. Les adieux ----------

export const FAREWELL = [
  { say: ['Toute la bande est là, devant chez Léo. Chacun part en échange.'] },
  { speaker: 'Charlotte', say: ['Moi, c\'est le Canada !'] },
  { speaker: 'Anaïs', say: ['Bali !'] },
  { speaker: 'Prophecy', say: ['Les États-Unis. Je vais enfin parler anglais pour de vrai.'] },
  { speaker: 'Romain', say: ['Hong Kong !'] },
  { say: ['Et toi, c\'est Hanoï, au Vietnam.'] },
  { speaker: 'Léo', say: ['Hanoï, hein. Nous on garde la maison.'] },
  { speaker: 'Ousmane', say: ['Reviens avec des histoires.'] },
  { setFlag: FLAGS.adieuxHull },
  { say: ['Objectif : va à l\'aéroport. Le bus rouge part de l\'arrêt de la grande rue.'] },
];

// Les vertus reçues à Hull (encart du trajet).
const CARRY = carryText('hull');
// Le vol pour Hanoï : personne au guichet.
export const FLIGHT_TO_HANOI = [
  { setFlag: FLAGS.arriveeHanoi },
  { travel: { map: 'hanoi', x: 1, y: 6, facing: 'right', plane: true, carry: CARRY } },
];

// Ambiances de la carte : nuit pendant la soirée, petit matin à la sortie de l'Asylum.
export const NIGHT = { ifFlags: [FLAGS.leoPlan], unlessFlags: [FLAGS.asylumFini] };
export const DAWN_TIME = { ifFlags: [FLAGS.asylumFini], unlessFlags: [FLAGS.lendemainHull] };
