import { FLAGS, ITEMS, TRAITS } from './story.js';

// Scénario du collège Bonsecours (voir le document « Scénarios Poké-Pierre — Montépilloy & Le collège ») : suite
// directe de Montépilloy, au village d'à côté (Pierre y va à pied et rentre chez lui le soir). Une seule vertu,
// Audace, apportée par Rémy. Ordre : arrivée (le surveillant), l'embrouille du casier, puis en salle
// de maths la scène de la fille (dialogue à choix) et la remarque du prof, enfin le brevet remis par le prof, qui
// ouvre la route du Prytanée.
// Scénettes partagées par la route de Bonsecours et les intérieurs du collège (étapes : voir MapScene.runSteps).

// Le surveillant, PNJ d'accueil : il rappelle l'objectif du moment (dans le hall, puis au couloir des casiers).
export const SURVEILLANT = [
  {
    unlessFlags: [FLAGS.casierPartage], speaker: 'Surveillant',
    say: ['Avant le premier cours, va ranger tes affaires dans ton casier : le casier 12, au couloir des casiers.'], end: true,
  },
  {
    unlessSouvenirs: [TRAITS.audace.id], speaker: 'Surveillant',
    say: ['Le cours de maths va commencer : file en classe, avec ton colocataire de casier. Et pas de bruit, hein !'], end: true,
  },
  { unlessItems: [ITEMS.brevet.id], speaker: 'Surveillant', say: ['Ton prof de maths t\'attend à son bureau : il a ton brevet.'], end: true },
  { speaker: 'Surveillant', say: ['Ton brevet en poche ! Avec ça, tu peux candidater au Prytanée, au bout de la route du nord.'] },
];

// Arrivée : Pierre arrive à pied par la route du sud ; image d'accueil. Le surveillant l'attend dans le hall.
export const COLLEGE_ARRIVAL = [
  { opening: { postcard: 'routeBonsecours', text: 'Premier jour de collège.' } },
  { say: ['Le collège Bonsecours, au bout de l\'allée. Ton premier jour commence !'] },
  { setFlag: FLAGS.collegeOuverture },
];

// Première entrée dans le hall : le surveillant accueille Pierre et l'envoie à son casier, puis monte au couloir des
// casiers (l'escalier du hall), où on le retrouve.
const HALL_STAIRS = [13, 2];
export const COLLEGE_WELCOME = [
  { approach: 'surveillant-hall' },
  {
    speaker: 'Surveillant',
    say: [
      'Bienvenue au collège Bonsecours ! C\'est moi le surveillant.',
      'Avant le premier cours, va ranger tes affaires dans ton casier : le casier 12, au couloir des casiers, en haut de l\'escalier.',
      'Ta classe, c\'est la 6e B, en salle de maths : l\'étage au-dessus des casiers.',
      'Ici, on monte un étage par salle : les casiers, les maths, les sciences, et le français tout en haut.',
    ],
  },
  { walk: 'surveillant-hall', to: HALL_STAIRS, block: true },
  { setFlag: FLAGS.collegeArrivee },
];

// L'embrouille du casier : Pierre et Rémy posent la main sur le casier 12 en même temps ; le surveillant tranche,
// ils le partagent. Rémy le prend à la rigolade.
// Places dans le couloir des casiers : à droite du casier 12 (Rémy), la place du surveillant, l'escalier qui monte à la
// salle de maths (par où Rémy file en classe).
export const LOCKER_SIDE = [7, 3];
export const SURVEILLANT_SPOT = [12, 5];
const CORRIDOR_STAIRS = [0, 2];
const LOCKER_FIGHT = [
  { say: ['Le casier 12. Le tien, d\'après ton papier. Tu poses la main sur la porte…'] },
  { setFlag: FLAGS.remiArrive },
  { walk: 'remi', to: LOCKER_SIDE, block: true },
  { face: { remi: 'left', player: 'right' } },
  { say: ['… et un garçon, arrivé en courant, pose la main dessus en même temps que toi.'] },
  { speaker: 'Rémy', say: ['Hé ! C\'est mon casier, ça. Le 12.'] },
  { say: ['Tu lui montres ton papier : casier 12. C\'est le tien !'] },
  { speaker: 'Rémy', say: ['Le mien aussi dit 12 ! Regarde !', 'J\'étais là avant, de toute façon.'] },
  { say: ['Le ton monte. Chacun jure que c\'est le sien.'] },
  { approach: 'surveillant-couloir' },
  { speaker: 'Surveillant', say: ['Ça suffit, vous deux !', 'Puisque vous le voulez tous les deux, vous le partagez. Point.'] },
  { walk: 'surveillant-couloir', to: SURVEILLANT_SPOT },
  { setFlag: FLAGS.casierPartage },
  { face: { 'remi-casier': 'left', player: 'right' } },
  { speaker: 'Rémy', say: ['Bon, colocataire, tu mets tes affaires en haut ou en bas ?'] },
  {
    choose: 'Que lui réponds-tu ?',
    choices: [
      { label: 'En haut.', steps: [{ speaker: 'Rémy', say: ['En haut, parfait. Moi j\'aime bien le bas : c\'est plus près de mes chaussures.'] }] },
      { label: 'Comme tu veux.', steps: [{ speaker: 'Rémy', say: ['Cool. Je prends le bas, alors : c\'est plus près de mes chaussures.'] }] },
    ],
  },
  { say: ['Rémy rigole. Toi, tu hausses les épaules : il a l\'air d\'un sacré numéro, celui-là.'] },
  { speaker: 'Rémy', say: ['Allez, en maths ! C\'est l\'escalier au bout du couloir, ça va sonner !'] },
  { walk: 'remi-casier', to: CORRIDOR_STAIRS, block: true, then: [FLAGS.remiEnClasse] },
];

// En salle de maths, une fois Rémy arrivé : le cours n'a pas commencé (le prof range ses copies) ; Rémy vient voir Pierre
// et le pousse à aller dire salut à Camille, nouvelle elle aussi (il l'accompagne).
export const REMI_SEAT = [8, 5];                                  // derrière son pupitre, face au tableau
export const REMI_INVITE = [
  { say: ['La salle de maths. Le cours n\'a pas encore commencé : le prof range ses copies, ça discute de table en table.'] },
  { approach: 'remi-classe' },
  {
    speaker: 'Rémy',
    say: [
      'Le cours commence dans cinq minutes. Tu vois la fille, au milieu de la classe ? Elle est en 6e B avec nous.',
      'Elle connaît personne non plus. Va lui dire salut, je viens avec toi.',
    ],
  },
  { setFlag: FLAGS.remiInvite },
];

// Le casier 12 : l'embrouille, puis, une fois l'Audace reçue, votre QG (et l'autocollant de Rémy, objet-souvenir).
export const LOCKER = [
  { unlessFlags: [FLAGS.casierPartage], steps: LOCKER_FIGHT, end: true },
  { unlessSouvenirs: [TRAITS.audace.id], say: ['Le casier 12, à Rémy et toi. Tes affaires en haut, les siennes en bas.'], end: true },
  { ifItems: [ITEMS.autocollant.id], say: ['Le casier 12 : votre QG, à Rémy et toi. L\'autocollant de Rémy brille sur la porte.'], end: true },
  { say: ['Le casier 12 : votre QG, à Rémy et toi. Rémy a collé un autocollant de Pokémon à l\'intérieur de la porte.'] },
  // Rémy descend de la salle de maths, vient à côté de Pierre, lui donne le sien, puis remonte en classe.
  { setFlag: FLAGS.remyAutocollant },
  { approach: 'remy-autocollant' },
  { speaker: 'Rémy', say: ['Ah, tu l\'as vu ? Il m\'en restait un. Tiens, pour toi : comme ça, on a le même.'] },
  { give: ITEMS.autocollant, text: 'Rémy te donne un autocollant. Un souvenir de votre QG.' },
  { speaker: 'Rémy', say: ['Allez, je file, ça va sonner !'] },
  { walk: 'remy-autocollant', to: CORRIDOR_STAIRS, block: true, then: [FLAGS.remyRepart] },
];

// Rémy, en classe (on le trouve à sa place jusqu'au brevet) : il pousse Pierre vers la fille, puis, l'Audace reçue, le
// casier devient leur QG ; à la fin de la troisième, il encourage Pierre pour le brevet.
export const REMI = [
  { ifItems: [ITEMS.brevet.id], speaker: 'Rémy', say: ['Le Prytanée ? T\'es un ouf. Tu m\'enverras une photo en uniforme !'], end: true },
  { ifFlags: [FLAGS.finTroisieme], speaker: 'Rémy', say: ['Le prof veut te voir pour le brevet. Français, maths, anglais : t\'es prêt, vas-y !'], end: true },
  { ifSouvenirs: [TRAITS.audace.id], speaker: 'Rémy', say: ['Le casier, c\'est notre QG. On se retrouve là à chaque récré !'], end: true },
  { speaker: 'Rémy', say: ['Vas-y, je te suis. Le cours va bientôt commencer.'] },
];

// La scène de la fille → Audace : dialogue à choix, trois répliques à chaque étape (trop guindée, trop lourde,
// naturelle). Les mauvaises ne bloquent pas : petit flottement, Rémy lance un « joker » ; la bonne fait avancer l'échange.
const RELAX = 'Rémy, derrière toi, chuchote : « Joker. On la refait, tranquille. »';
const line = (question, choices, answer, wrong) => ({ quiz: { question, choices, answer, wrong: { ...wrong, default: [RELAX] } } });
export const CAMILLE = [
  { unlessFlags: [FLAGS.remiInvite], say: ['Une fille de ta classe sort ses cahiers.'], end: true },
  { ifSouvenirs: [TRAITS.audace.id], speaker: 'Camille', say: ['En français, on se met ensemble, c\'est promis ! D\'ici là, je survis aux maths.'], end: true },
  { comeBeside: 'remi-classe' },
  { faceTo: 'camille' },
  { say: ['Rémy te suit, l\'air de rien.', 'La fille sort ses cahiers. Elle lève les yeux vers toi.'] },
  line('Que lui dis-tu ?', ['Salut ! T\'es en 6e B ?', 'Bonjour. Enchanté.', 'Salut, beauté !'], 'Salut ! T\'es en 6e B ?', {
    'Bonjour. Enchanté.': ['Elle hausse un sourcil. « Euh… enchantée aussi ? »', RELAX],
    'Salut, beauté !': ['Elle te regarde, gênée. « … Pardon ? »', RELAX],
  }),
  { speaker: 'Camille', say: ['Oui ! Moi, c\'est Camille. Tu viens de Montépilloy, toi ?'] },
  line('Que réponds-tu ?', ['Affirmatif.', 'Oui, le village d\'à côté !', 'Oui, j\'y suis célèbre.'], 'Oui, le village d\'à côté !', {
    'Affirmatif.': ['« Affirmatif » ? Camille se retient de rire. Tu parles comme un robot.', RELAX],
    'Oui, j\'y suis célèbre.': ['Camille hoche la tête, pas très convaincue. « Ah… d\'accord. »', RELAX],
  }),
  { speaker: 'Camille', say: ['C\'est pas loin ! Moi, j\'habite juste derrière le collège.'] },
  line('Et maintenant ?', ['On mange ensemble, promis ?', 'Bon… au revoir.', 'On se met ensemble en français ?'], 'On se met ensemble en français ?', {
    'Bon… au revoir.': ['Camille cligne des yeux. « Déjà ? On vient à peine de… bon. »', RELAX],
    'On mange ensemble, promis ?': ['« Promis » ? Camille recule d\'un pas. « On verra… »', RELAX],
  }),
  { speaker: 'Camille', say: ['Ça marche ! En rédaction, je suis forte : je t\'aiderai. Et toi, tu m\'aides en maths ?'] },
  { say: ['Camille sourit.'] },
  { speaker: 'Rémy', say: ['Trop facile. Je savais que t\'allais gérer.'] },
  { trait: TRAITS.audace },
  { speaker: 'Rémy', say: ['Bon. Notre casier, c\'est notre QG, maintenant. Et toi, t\'es mon pote.'] },
  { walk: 'remi-classe', to: REMI_SEAT, block: true },
  // Le prof les rappelle à l'ordre, depuis son bureau.
  { emote: 'prof-maths', kind: 'surprise' },
  { allFace: 'prof-maths' },                                       // toute la classe se tourne vers le prof
  { speaker: 'Professeur', say: ['Pierre ! Rémy ! Vous faites trop de bruit.', 'Si vous continuez comme ça, vous n\'aurez jamais votre brevet !'] },
  // Ellipse : quatre ans plus tard, la fin de la troisième. Le prof appelle Pierre pour son brevet (voir PROF).
  { black: true },
  { wait: 600 },
  { say: ['Quatre ans plus tard… La fin de la troisième.'] },
  { setFlag: FLAGS.finTroisieme },
  { black: false },
  { faceTo: 'prof-maths' },
  { emote: 'prof-maths', kind: 'surprise' },
  { allFace: 'prof-maths' },
  { speaker: 'Professeur', say: ['Pierre ! Viens me voir à mon bureau : c\'est l\'heure de ton oral du brevet.'] },
];

// Facultatif : la cachette imbattable de Margaux, le placard d'entretien du couloir des casiers (poignée cassée), jusqu'à
// la fin de la troisième. Ingéniosité ouvre le loquet ; Margaux retourne ensuite en salle de maths.
const STUCK_HANDLE = 'La poignée tourne dans le vide.';
export const CLOSET = [
  { ifFlags: [FLAGS.margauxTrouvee], say: [STUCK_HANDLE], end: true },
  { ifFlags: [FLAGS.finTroisieme], say: [STUCK_HANDLE], end: true },
  { say: [STUCK_HANDLE] },
  { useTrait: TRAITS.ingeniosite },
  { say: ['Tu glisses ta règle dans la fente et tu fais jouer le loquet… Clac !'] },
  { speaker: 'Margaux', say: ['Quoi ?! Personne m\'avait jamais trouvée !', 'Bon. L\'été prochain, je trouve mieux. Promis.'] },
  { setFlag: FLAGS.margauxTrouvee },
];

// Le prof de maths : à la fin de la troisième (après l'ellipse), l'oral du brevet, en face à face à son bureau. « Prêt ? »,
// Pierre utilise Audace, puis trois questions, une par matière : français, maths, anglais (une erreur ne bloque pas : il
// fait réfléchir) ; il remet le diplôme du brevet, qui ouvre la route du Prytanée.
const question = (subject, text, choices, answer, hint) => ({
  quiz: { speaker: 'Professeur', question: `${subject} : ${text}`, choices, answer, wrong: { default: [hint] } },
});
export const PROF = [
  { ifItems: [ITEMS.brevet.id], speaker: 'Professeur', say: ['Avec ton brevet, tu peux candidater au Prytanée. Bonne chance, Pierre !'], end: true },
  { unlessFlags: [FLAGS.finTroisieme], speaker: 'Professeur', say: ['Sors ton cahier, Pierre : aujourd\'hui, calcul mental !'], end: true },
  { speaker: 'Professeur', say: ['Prêt ?'] },
  { useTrait: TRAITS.audace },
  { speaker: 'Professeur', say: ['Trois questions, trois matières. On commence par le français.'] },
  question('Français', 'quel est le participe passé du verbe « prendre » ?', ['Prendu', 'Pris', 'Prit'], 'Pris',
    'Hmm… « J\'ai… mon cartable. » Réfléchis.'),
  { speaker: 'Professeur', say: ['Très bien. Maintenant, les maths : mon rayon.'] },
  question('Maths', 'combien font 7 fois 8 ?', ['54', '56', '64'], '56', 'Hmm… Recompte tranquillement.'),
  { speaker: 'Professeur', say: ['Et pour finir, l\'anglais. Ça pourra te servir, un jour.'] },
  question('Anglais', 'comment dit-on « bonjour, je m\'appelle Pierre » ?', ['Goodbye, I am Pierre', 'Hello, my name is Pierre', 'Hello, I have Pierre'],
    'Hello, my name is Pierre', 'Hmm… Pas tout à fait. Relis bien.'),
  { speaker: 'Professeur', say: ['Parfait ! Comme quoi, malgré le bruit… Tu as mérité ton diplôme du brevet.'] },
  { give: ITEMS.brevet, text: 'Tu reçois ton diplôme du brevet !' },
  { setFlag: FLAGS.bonsecoursFini },
  { speaker: 'Professeur', say: ['Avec ça, tu peux candidater au Prytanée, au bout de la route du nord. Bonne chance !'] },
];
