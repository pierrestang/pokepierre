import { FLAGS, ITEMS, TRAITS, carryText } from './story.js';

// Scénario de Hull : les années d'études avec la bande. Ousmane, Léo et Anaïs connaissent Pierre depuis Bordeaux (des
// retrouvailles) ; Romain, Prophecy et Charlotte le rencontrent ici.
//   1. L'arrivée, Ousmane au bout de la grande rue, la coloc ; Léo a appelé ; chez Léo, la soirée est lancée (la nuit tombe).
//   2. Premier pub : la tournée (chaque commande, puis le barman, en anglais) ; une erreur, on retourne redemander.
//   3. Deuxième pub : une partie de fléchettes contre un habitué (systems/Darts.js) ; pari gagné : tournée générale.
//   De chez Léo au premier pub, puis d'un bar à l'autre jusqu'à l'Asylum, Léo part devant en éclaireur et entre le
//   premier ; Pierre le suit, Ousmane, Charlotte et Anaïs suivent Pierre à la queue leu leu (data/story.js FOLLOWERS).
//   4. L'Asylum (Joie de vivre), puis le petit matin devant la boîte : Insouciance ; rentrer dormir.
//   5. La veille de l'examen, les révisions à la bibliothèque (tour de table, choix sans mauvaise réponse bloquante).
//   6. Le lendemain, les résultats devant l'université : le diplôme d'anglais de Hull.
//   7. Les adieux devant chez Léo : chacun part en échange ; Léo et Ousmane restent. Puis l'avion pour Hanoï.
// Scénettes partagées par la carte et les intérieurs.

// Bout ouest de la grande rue (l'arrivée) ; la coloc (case devant la porte) ; les portes de la soirée, où Léo entre
// le premier (voir maps/hull.js) : le premier pub, le second, l'Asylum.
export const HULL_SPOTS = {
  arrival: [4, 34],
  colocDoor: [11, 32],
  pubADoor: [28, 20],
  pubBDoor: [33, 31],
  asylumDoor: [29, 8],
};

// ---------- 1. L'arrivée ----------

// Arrivée : image d'accueil (l'estuaire sous la pluie), Ousmane attend au bout de la grande rue et te montre la coloc (il
// marche devant).
export const ARRIVAL = [
  { opening: { postcard: 'hull', text: 'Hull, Angleterre.' } },
  { say: ['Ousmane t\'attend au bout de la grande rue.'] },
  { approach: 'ousmane-arrivee' },
  {
    speaker: 'Ousmane',
    say: [
      'T\'es enfin là ! Bienvenue en Angleterre. Oui, il pleut. Il pleut tout le temps.',
      'Léo et Anaïs sont déjà là. Toute la promo de KEDGE a atterri ici.',
      'Viens, je te montre la coloc.',
    ],
  },
  { setFlag: FLAGS.hullAccueil },
  { walk: 'ousmane-arrivee', to: HULL_SPOTS.colocDoor, lead: true, then: [FLAGS.ousmaneRentre] },
];
// Si tu t'es éloigné avant qu'Ousmane n'arrive à la coloc, il reprend sa marche.
export const OUSMANE_WALK = [{ walk: 'ousmane-arrivee', to: HULL_SPOTS.colocDoor, lead: true, then: [FLAGS.ousmaneRentre] }];

// Dans la coloc : Léo a appelé.
export const LEO_CALLED = [
  { approach: 'ousmane-coloc' },
  { speaker: 'Ousmane', say: ['Au fait, Léo a appelé. Il veut te voir, il a un plan.', 'Il habite en haut de Newland Avenue, à droite : la petite maison juste après le pub.'] },
  { setFlag: FLAGS.leoAppel },
];

// Chez Léo : Léo présente Pierre à Romain et Prophecy (ils ne le connaissent pas encore) ; la soirée est lancée,
// rendez-vous au pub ; Romain et Prophecy viendront à l'Asylum.
export const LEO_PLAN = [
  { approach: 'leo-maison' },
  { speaker: 'Léo', say: ['Pierre ! Comme à la soirée de Bordeaux, mais en pire côté météo. Ce soir, on sort, tout le monde !'] },
  { speaker: 'Léo', say: ['Romain, Prophecy : voilà Pierre, de la promo de KEDGE.'] },
  { speaker: 'Romain', say: ['Ah, c\'est toi, Pierre ! Léo nous a parlé de toi.', 'Nous, on vous rejoint à l\'Asylum.'] },
  { speaker: 'Prophecy', say: ['Salut, Pierre.', 'Il me faut au moins une heure pour choisir mes chaussures. Romain m\'attend.'] },
  { speaker: 'Léo', say: ['Les autres sont déjà au pub, juste à côté. Je passe devant, suis-moi !'] },
  { black: true },
  { say: ['La nuit tombe sur Hull.'] },
  { setFlag: FLAGS.leoPlan },
  { black: false },
  { say: ['Objectif : suis Léo jusqu\'au pub, juste à côté.'] },
];

// Dehors, à chaque étape de la soirée : Léo part devant jusqu'à la porte du bar suivant et entre le premier (il attend
// Pierre s'il traîne) ; la bande suit Pierre (voir maps/hull.js, events).
export const LEO_SCOUT_A = [{ walk: 'leo-pub', to: HULL_SPOTS.pubADoor, lead: true, then: [FLAGS.leoEntrePubA] }];
export const LEO_SCOUT_B = [{ walk: 'leo-pub', to: HULL_SPOTS.pubBDoor, lead: true, then: [FLAGS.leoEntrePubB] }];
export const LEO_SCOUT_ASYLUM = [{ walk: 'leo-pub', to: HULL_SPOTS.asylumDoor, lead: true, then: [FLAGS.leoEntreAsylum] }];

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
  { speaker: 'Léo', say: ['Première tournée, c\'est toi qui régales !'] },
  { speaker: 'Anaïs', say: ['Comme à Bordeaux, mais c\'est toi qui régales cette fois !'] },
  { speaker: 'Charlotte', say: ['Moi, c\'est Charlotte, la coloc d\'Anaïs. Alors c\'est toi, le fameux Pierre ?'] },
  { say: ['Objectif : ramène la tournée. Demande à chacun ce qu\'il veut, puis commande au comptoir.'] },
];

// Tapis de sortie des deux pubs (voir interiors.js hullPubA, hullPubB) : Léo y file devant la bande.
const PUB_A_EXIT = [1, 11];
const PUB_B_EXIT = [3, 9];

// Ce que chacun dit à table : sa commande (on peut la redemander autant qu'on veut).
export const orderScript = ({ name, line, flag }) => [
  { ifFlags: [flag], speaker: name, say: ['Merci ! Le reste arrive ?'], end: true },
  { speaker: name, say: [line] },
];

// Le comptoir : le barman demande chaque commande en anglais ; une erreur, et la personne concernée proteste.
// Tout servi : on trinque ; Léo file devant vers le pub suivant, les autres se lèvent et suivent Pierre.
const CHEERS = [
  { say: ['Le barman pose les verres sur un plateau. Tu rapportes la tournée à la table.'] },
  { hop: ['player', ...ORDERS.map((o) => o.id)], times: 2 },
  { speaker: 'Ousmane', say: ['Santé !'] },
  { speaker: 'Léo', say: ['Cheers ! Allez, on finit ça et on file au pub d\'en bas. Je passe devant !'] },
  { walk: 'leo-pub', to: PUB_A_EXIT, block: true },
  { say: ['Objectif : suis Léo jusqu\'au pub suivant, plus bas dans l\'avenue. La bande te suit.'] },
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

// En arrivant, la bande (qui suivait Pierre) s'attable ; l'habitué propose une partie.
const BAND_PUB = ['leo-pub', 'ousmane-pub', 'charlotte-pub', 'anais-pub'];
export const PUB_B_SEATS = { 'ousmane-pub': [9, 5], 'charlotte-pub': [6, 6], 'anais-pub': [9, 6] };

// Facultatif : le pari (Audace). Gagné, l'habitué offre une tournée générale (toute la bande saute de joie) ; perdu, il
// propose une revanche, autant de fois qu'on veut tant qu'on est dans ce pub (ici, puis en lui reparlant, voir
// HABITUE_AFTER).
const LOST = ['Not bad! La prochaine fois, peut-être.'];
const BET_WON = [
  { speaker: 'Habitué', say: ['A round for everyone! Une tournée générale, c\'est moi qui offre !'] },
  { cheer: ['player', ...BAND_PUB] },
  { speaker: 'Ousmane', say: ['Pierre, t\'es une légende.'] },
  { setFlag: FLAGS.tourneeOfferte },
];
const betGame = (rematches) => ({
  darts: {
    opponent: 'Habitué', win: ['Well played, mate! Un pari, c\'est un pari.'], lose: LOST,
    onWin: BET_WON, onLose: rematches > 0 ? rematch(rematches - 1) : [],
  },
});
function rematch(rematches) {
  return [{
    speaker: 'Habitué',
    choose: 'Revanche ?',
    choices: [{ label: 'Oui', steps: [betGame(rematches)] }, { label: 'Pas maintenant', steps: [] }],
  }];
}
const REMATCHES = 8;                              // revanches enchaînées sans reparler à l'habitué
export const HABITUE_AFTER = [
  { ifFlags: [FLAGS.tourneeOfferte], speaker: 'Habitué', say: ['Good game, mate! Cheers!'], end: true },
  ...rematch(REMATCHES),
];

export const DARTS = [
  { speaker: 'Habitué', say: ['Hey, the new guy! Tu joues ?'] },
  {
    choose: 'Une partie de fléchettes ?',
    choices: [
      {
        label: 'Allez !',
        steps: [
          // Le pari déjà gagné : la partie, sans pari.
          { ifFlags: [FLAGS.tourneeOfferte], darts: { opponent: 'Habitué', win: ['Well played, mate! Tu reviens quand tu veux.'], lose: LOST } },
          {
            unlessFlags: [FLAGS.tourneeOfferte],
            steps: [
              { speaker: 'Habitué', say: ['Un pari ? Si tu gagnes, je paie une tournée à toute ta bande.'] },
              { useTrait: TRAITS.audace },
              { say: ['Tu tends la main. Pari tenu.'] },
              betGame(REMATCHES),
            ],
          },
          { speaker: 'Léo', say: ['On file à l\'Asylum ! Je passe devant, suivez Pierre !'] },
          { walk: 'leo-pub', to: PUB_B_EXIT, block: true },
          { say: ['Objectif : suis Léo jusqu\'à l\'Asylum, tout en haut, sur le campus. La bande te suit.'] },
          { setFlag: FLAGS.flechettesJouees },
        ],
      },
      { label: 'Pas maintenant.', steps: [{ speaker: 'Habitué', say: ['Suit yourself. Je suis là, près de la cible.'] }] },
    ],
  },
];

// En entrant au second pub derrière Léo : la bande qui suivait Pierre s'attable, puis l'habitué l'aborde.
export const PUB_B_ENTER = [
  { setFlag: FLAGS.bandePubB },
  { walkAll: Object.entries(PUB_B_SEATS) },
  { approach: 'habitue' },
  ...DARTS,
];

// ---------- 4. L'Asylum, puis le petit matin ----------

// La bande (qui suivait Pierre) entre derrière lui ; Romain et Prophecy sont déjà là, Léo aussi (entré le premier) ;
// rejoindre tout le monde sur la piste, dernière chanson, sortie.
export const ASYLUM_SPOTS = { 'ousmane-pub': [11, 13], 'charlotte-pub': [13, 13], 'anais-pub': [10, 14] };
export const ASYLUM_ENTER = [
  { setFlag: FLAGS.bandeAsylum },
  { walkAll: Object.entries(ASYLUM_SPOTS) },
  { approach: 'romain-asylum' },
  { speaker: 'Romain', say: ['Vous en avez mis du temps !'] },
  { speaker: 'Léo', say: ['Tout le monde sur la piste !'] },
];
const BAND_ASYLUM = ['romain-asylum', 'prophecy-asylum', ...BAND_PUB];
// La piste de danse de l'Asylum (cases x, y, largeur, hauteur ; voir interiors.js hullAsylum).
export const DANCE_FLOOR = [6, 7, 9, 5];
export const ASYLUM_DANCE = [
  { speaker: 'Léo', say: ['C\'est notre chanson ! Venez tous !'] },
  { useTrait: TRAITS.joie },
  { say: ['Tu entraînes toute la bande sur la piste, comme Maman au salon.'] },
  { gather: BAND_ASYLUM, area: DANCE_FLOOR },
  { say: ['Toute la bande danse sur la piste.'] },
  { dance: BAND_ASYLUM },
  { say: ['La musique ralentit… Dernière chanson.'] },
  { black: true },
  { wait: 800 },
  { setFlag: FLAGS.asylumFini },
  { travel: { map: 'hull', x: 29, y: 9, facing: 'down' } },
];

// Au petit matin, devant l'Asylum, toute la bande : Léo part dans la mauvaise direction ; Insouciance.
export const DAWN = [
  { say: ['Ciel bleuté, les réverbères s\'éteignent. Toute la bande est devant l\'Asylum.'] },
  { approach: 'leo-aube' },
  { speaker: 'Léo', say: ['Ok guys, zis night was very, very beautiful. Now we go \'ome. Follow me, I know ze way!'] },
  { walk: 'leo-aube', to: [21, 11], block: true },
  { speaker: 'Ousmane', say: ['Léo… c\'est de l\'autre côté.'] },
  { speaker: 'Charlotte', say: ['Au fait… les exams, c\'est après-demain.'] },
  { speaker: 'Anaïs', say: ['Ne dis pas ça maintenant.'] },
  { speaker: 'Léo', say: ['Demain, bibliothèque. Tout le monde.'] },
  { trait: TRAITS.insouciance },
  // Chacun rentre chez soi : la bande quitte la rue (Léo, Romain et Prophecy chez eux, Ousmane à la coloc).
  { say: ['Tout le monde rentre se coucher.'] },
  { black: true },
  { wait: 500 },
  { setFlag: FLAGS.bandeRentree },
  { black: false },
  { say: ['Objectif : rentre dormir à la coloc.'] },
];

// Rentré à la coloc (Ousmane y est déjà) : on dort ; le lendemain, veille d'examen, Ousmane te réveille et t'envoie à la
// bibliothèque.
export const SLEEP = [
  { speaker: 'Ousmane', say: ['Enfin ! Allez, au lit.'] },
  { say: ['Tu t\'écroules sur ton lit.'] },
  { black: true },
  { wait: 800 },
  { say: ['Le lendemain, veille d\'examen…'] },
  { setFlag: FLAGS.lendemainHull },
  { black: false },
  { approach: 'ousmane-apres' },
  {
    speaker: 'Ousmane',
    say: [
      'Debout ! Les exams, c\'est demain. Toute la bande révise à la bibliothèque Brynmor Jones.',
      'C\'est la longère au toit d\'ardoise, en haut de Newland Avenue, à gauche. On se retrouve là-bas !',
    ],
  },
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
  { say: ['Objectif : va à l\'aéroport, au bout de la grande rue.'] },
];

// Les vertus reçues à Hull (encart du trajet).
const CARRY = carryText('hull');
// Le vol pour Hanoï : personne au guichet, Pierre part seul (Autonomie).
export const FLIGHT_TO_HANOI = [
  { useTrait: TRAITS.autonomie },
  { say: ['Pour la première fois, personne ne t\'accompagne. Tu prends ton billet pour Hanoï.'] },
  { setFlag: FLAGS.arriveeHanoi },
  { travel: { map: 'hanoi', x: 1, y: 6, facing: 'right', plane: true, carry: CARRY } },
];

// Ambiances de la carte : nuit pendant la soirée, petit matin à la sortie de l'Asylum.
export const NIGHT = { ifFlags: [FLAGS.leoPlan], unlessFlags: [FLAGS.asylumFini] };
export const DAWN_TIME = { ifFlags: [FLAGS.asylumFini], unlessFlags: [FLAGS.lendemainHull] };
