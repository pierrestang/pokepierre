import { FLAGS, ITEMS, TRAITS, carryText } from './story.js';

// Scénario de Hanoï : pour la première fois, Pierre arrive seul dans une ville dont il ne parle pas la langue.
//   1. L'arrivée : personne ne l'attend ; dans la boîte aux lettres, une carte de Léo et de la bande de Hull.
//   2. L'agence : le patron (français) l'accueille pour son premier jour et lui tend les consignes, écrites en vietnamien.
//   3. Dans la rue, les passants ne peuvent pas l'aider ; M. Lam, au bord du lac, parle un peu français et traduit les
//      consignes (guider deux touristes au temple) : Adaptation.
//   4. Les deux touristes (qui attendent dans la grande rue dès l'arrivée) le suivent jusqu'au temple ; l'une panique, son téléphone est à plat (Insouciance) ; l'objet de
//      chance sur l'autel ; leurs remerciements en sortant.
//   5. Le patron le remercie ; en sortant de l'agence, six mois plus tard, Romain appelle : il l'attend à Amsterdam.
//   6. Au guichet de l'aéroport, le vol pour Amsterdam, en écho au départ de Hull.
//   Facultatif : les papis qui jouent aux échecs chinois au bord du lac (Audace) ; une pièce de leur jeu.
// Scénettes partagées par la carte, les intérieurs et l'aéroport (étapes : voir MapScene.runSteps).

const PATRON = 'Patron';
const TOURISTE = 'Touriste';

// Places sur la carte (voir maps/hanoi.js) : dans la grande rue, un peu plus loin que l'agence (après ta maison), où
// attendent les touristes dès l'arrivée ; devant le temple.
export const HANOI_SPOTS = {
  touristsWait: [25, 8],
  templeFront: [26, 17],
};

// ---------- 1. L'arrivée ----------

export const ARRIVAL = [
  { opening: { postcard: 'hanoi', text: 'Hanoï, Vietnam.' } },
  { setFlag: FLAGS.hanoiOuverture },
  {
    say: [
      'Personne ne t\'attend à la sortie de l\'aéroport. Pas d\'Ousmane, pas de Léo.',
      'Ta maison est la petite maison violette de la grande rue. Ton nouveau travail commence aujourd\'hui, à l\'agence de voyage : la maison noire, un peu plus loin.',
    ],
  },
];

// La boîte aux lettres, à côté de ta maison : une carte de Hull.
export const MAILBOX = [
  'Une carte postale ! Elle vient de Hull.',
  '« Pierre ! Alors, Hanoï ? Ici il pleut toujours, rien n\'a changé.',
  'La maison t\'attend quand tu veux. Léo et toute la bande. »',
];

// ---------- 2. L'agence ----------

// Le patron parle français : il accueille Pierre et lui tend les consignes du jour… en vietnamien.
export const PATRON_WELCOME = [
  { ifFlags: [FLAGS.consignesTraduites], speaker: PATRON, say: ['Les touristes t\'attendent dans la grande rue, un peu plus loin. Le temple, c\'est de l\'autre côté du lac !'], end: true },
  { ifFlags: [FLAGS.travailEtape1], speaker: PATRON, say: ['Toujours pas lu tes consignes ? Demande dehors, quelqu\'un saura bien te les lire.'], end: true },
  {
    speaker: PATRON,
    say: [
      'Ah, Pierre ! Bienvenue à l\'agence. Un Français dans l\'équipe, enfin quelqu\'un à qui parler !',
      'Ton premier jour commence maintenant. Les consignes de la journée sont là-dessus : c\'est l\'équipe du matin qui les a écrites.',
    ],
  },
  { give: ITEMS.consignesVietnamien, text: 'Le patron te tend un papier.' },
  { say: ['Tout est écrit en vietnamien. Tu n\'y comprends pas un mot.'] },
  { speaker: PATRON, say: ['Moi, j\'ai des clients au téléphone. Débrouille-toi : tu verras, c\'est formateur !'] },
  { setFlag: FLAGS.travailEtape1 },
];

// Le retour à l'agence, après la visite : le patron remercie Pierre.
export const PATRON_THANKS = [
  { ifFlags: [FLAGS.travailTermine], speaker: PATRON, say: ['Ça fait plaisir de t\'avoir dans l\'équipe, Pierre.'], end: true },
  {
    speaker: PATRON,
    say: [
      'Les touristes sont passés me voir. Ils ne parlent que de toi !',
      'Premier jour, pas un mot de vietnamien, et tu t\'en sors comme un chef. Merci, Pierre.',
    ],
  },
  { setFlag: FLAGS.travailTermine },
];

// ---------- 3. La traduction ----------

// Les passants : avec le papier, ils voudraient bien aider, mais ne lisent pas pour lui (ils ne parlent pas français).
const CONSIGNES = { ifItems: [ITEMS.consignesVietnamien.id], unlessFlags: [FLAGS.consignesTraduites] };
const passer = (id, gesture, idle) => [
  {
    ...CONSIGNES,
    steps: [
      { say: ['Tu montres ton papier.'] },
      { emote: id, kind: 'dots' },
      { say: [gesture] },
    ],
    end: true,
  },
  { say: [idle] },
];
export const PASSANTE = passer('passante', 'Elle lit, te regarde, relit… puis joint les mains devant elle, désolée. Elle ne parle pas français.',
  'Une passante te sourit et continue son chemin, un panier au bras.');
export const VENDEUSE = passer('vendeuse', 'La vendeuse hausse les épaules en riant, et te tend une mangue à la place.',
  'La vendeuse te montre ses fruits et te dit quelque chose en vietnamien. Tu hoches la tête, poliment.');
export const PASSANT = passer('passant', 'Il fronce les sourcils, retourne le papier dans tous les sens, puis te le rend avec un petit salut d\'excuse.',
  'Un passant vérifie la chaîne de son vélo. Il ne fait pas attention à toi.');

// M. Lam, sur le petit îlot du lac, près de la cloche : il a appris le français à l'école, il y a longtemps. Il traduit les consignes.
export const MR_LAM = [
  { ifFlags: [FLAGS.consignesTraduites], speaker: 'M. Lam', say: ['Le temple au toit rouge, de l\'autre côté du lac. Bonne visite, jeune homme !'], end: true },
  { unlessItems: [ITEMS.consignesVietnamien.id], speaker: 'M. Lam', say: ['Bonjour, bonjour ! Le lac est beau, ce matin, n\'est-ce pas ?'], end: true },
  { say: ['Tu montres ton papier au vieux monsieur, près de la cloche.'] },
  { speaker: 'M. Lam', say: ['Oh ! Tu parles français ? Je l\'ai appris à l\'école, il y a… très longtemps.', 'Voyons voir. Mes yeux ne sont plus tout jeunes…'] },
  {
    speaker: 'M. Lam',
    say: [
      '« Aller chercher les deux touristes qui attendent dans la grande rue, un peu plus loin que l\'agence. Leur faire visiter le temple. Ne pas les perdre. »',
      'Le temple, c\'est le grand bâtiment au toit rouge, de l\'autre côté du lac.',
    ],
  },
  { say: ['Tu ne parles pas un mot de vietnamien… et pourtant, tu as trouvé ton chemin.'] },
  { trait: TRAITS.adaptation },
  { setFlag: FLAGS.consignesTraduites },
];

// ---------- 4. Les touristes et le temple ----------

// Dans la grande rue, un peu plus loin que l'agence : les deux touristes attendent leur guide dès l'arrivée de Pierre.
// Avant que M. Lam ait lu les consignes, Pierre ne sait pas que c'est lui ; ensuite, ils le suivent jusqu'au temple.
export const TOURISTS_MEET = [
  {
    unlessFlags: [FLAGS.consignesTraduites], speaker: TOURISTE,
    say: ['Bonjour ! On attend notre guide. L\'agence nous a dit de patienter ici, dans la grande rue.'], end: true,
  },
  { speaker: TOURISTE, say: ['Bonjour ! C\'est vous, notre guide ? On vous attendait !', 'On aimerait tellement voir le temple !'] },
  { say: ['Tu leur fais signe de te suivre.'] },
  { setFlag: FLAGS.touristesSuivent },
];

// Au temple : Pierre avance de trois pas (les touristes entrent derrière lui, on les voit tous), puis se retourne ; l'une
// des touristes panique, son téléphone est à plat ; Pierre (Insouciance) lui dit de profiter du moment.
export const TEMPLE_PANIC = [
  { goTo: [6, 6], facing: 'up' },
  { wait: 400 },
  { face: { player: 'down' } },
  { speaker: TOURISTE, say: ['Oh non… Mon téléphone est à plat ! Pas une seule photo du temple…', 'Tout ce voyage, et je ne pourrai rien montrer. Je veux rentrer à l\'hôtel.'] },
  { useTrait: TRAITS.insouciance },
  { speaker: 'Pierre', say: ['Laisse tomber les photos. Regarde autour de toi : tu y es, là, maintenant. Profite.'] },
  { say: ['Elle range son téléphone, lève les yeux vers les statues… et sourit.'] },
  { speaker: TOURISTE, say: ['Vous avez raison. Je m\'en souviendrai mieux comme ça.'] },
  { setFlag: FLAGS.templeCalme },
];

// L'autel : l'objet de chance.
export const ALTAR = {
  dialogue: ['Sur l\'autel, entre deux bâtons d\'encens, une petite amulette porte-bonheur. Un gardien te fait signe : elle est pour toi.'],
  after: ['L\'autel est paisible. L\'encens fume doucement.'],
};

// En sortant du temple (avec ou sans l'objet de chance) : les touristes remercient Pierre, et l'envoient raconter sa
// journée au patron de l'agence.
export const TOURISTS_THANKS = [
  { speaker: TOURISTE, say: ['Merci pour la visite ! Sans téléphone, j\'ai tout regardé. Vraiment regardé.'] },
  { speaker: TOURISTE, say: ['Un super guide. Et même pas besoin de parler vietnamien !', 'On va dire à ton patron, à l\'agence, que tu es le meilleur. Va vite lui raconter !'] },
  { setFlag: FLAGS.visiteTerminee },
];

// ---------- 5. Six mois plus tard : l'appel de Romain ----------

// En sortant du bureau du patron : l'ellipse, puis Romain appelle (il quitte Hong Kong). Il attend Pierre à Amsterdam.
export const SIX_MONTHS_LATER = [
  { black: true },
  { wait: 800 },
  { say: ['Six mois plus tard…'] },
  { setFlag: FLAGS.sixMoisHanoi },
  { black: false },
  { emote: 'player', kind: 'surprise' },
  { say: ['Ton téléphone sonne. C\'est Romain !'] },
  {
    speaker: 'Romain',
    phone: true,
    say: [
      'Pierre ! Ça y est, je viens de prendre mon avion. Hong Kong, c\'est fini !',
      'J\'ai trop hâte que tu arrives à Amsterdam pour le stage. On va bien se marrer.',
      'Je t\'attends là-bas, hein. Ne rate pas ton vol !',
    ],
  },
  { setFlag: FLAGS.appelRomain },
];

// ---------- 6. Le départ ----------

// Les vertus reçues à Hanoï (encart du trajet).
const CARRY = carryText('hanoi');
// Au guichet de l'aéroport, le vol pour Amsterdam : en écho au départ de Hull.
export const FLIGHT_TO_AMSTERDAM = [
  {
    say: [
      'Il y a quelques mois, à Hull, tu prenais ce même billet, le ventre noué, parce que personne ne t\'accompagnait.',
      'Aujourd\'hui, tu as traversé une ville entière sans en parler la langue. Tu n\'as plus peur de l\'inconnu. Tu t\'adaptes.',
    ],
  },
  { setFlag: FLAGS.arriveeAmsterdam },
  { travel: { map: 'amsterdam', x: 1, y: 10, facing: 'right', plane: true, carry: CARRY } },
];

// ---------- Facultatif : les papis du lac (Audace) ----------

// Deux papis jouent aux échecs chinois et ne parlent pas français : Pierre ose s'asseoir et joue par gestes.
export const CHESS_PLAYERS = [
  { ifItems: [ITEMS.pieceEchecs.id], say: ['Les papis te saluent d\'un signe de tête, et reprennent leur partie.'], end: true },
  { say: ['Deux papis jouent aux échecs chinois au bord du lac. Ils parlent vite, en vietnamien, sans lever les yeux du plateau.'] },
  { useTrait: TRAITS.audace },
  {
    say: [
      'Tu t\'assois sur un petit tabouret, à côté d\'eux. Tu montres une pièce, puis une case, l\'air de demander.',
      'Le premier papi éclate de rire et te montre comment avance le cheval. L\'autre tape sur la table pour te faire jouer.',
      'Une partie plus tard, tu as perdu… mais tout le monde rit.',
    ],
  },
  { give: ITEMS.pieceEchecs, text: 'Le papi te glisse une pièce de son jeu dans la main : le cheval.' },
];
