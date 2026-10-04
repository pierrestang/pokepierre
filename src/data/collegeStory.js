import { FLAGS, ITEMS, TRAITS } from './story.js';

// Scénario du collège Bonsecours (voir le document « Scénarios Poké-Pierre — Montépilloy & Le collège ») : suite
// directe de Montépilloy, au village d'à côté (Pierre y va à pied et rentre chez lui le soir). Une seule vertu,
// Insouciance, apportée par Rémi. Ordre : arrivée (le surveillant), l'embrouille du casier, puis en salle
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
    unlessSouvenirs: [TRAITS.insouciance.id], speaker: 'Surveillant',
    say: ['Le cours de maths va commencer : file en classe, avec ton colocataire de casier. Et pas de bruit, hein !'], end: true,
  },
  { unlessItems: [ITEMS.brevet.id], speaker: 'Surveillant', say: ['Ton prof de maths t\'attend à son bureau : il a ton brevet.'], end: true },
  { speaker: 'Surveillant', say: ['Ton brevet en poche ! Avec ça, tu peux candidater au Prytanée, au bout de la route du nord.'] },
];

// Arrivée : Pierre arrive à pied par la route du sud ; image d'accueil. Le surveillant l'attend dans le hall.
export const COLLEGE_ARRIVAL = [
  { opening: { postcard: 'routeBonsecours', text: 'Premier jour de collège.' } },
  { say: ['Le collège Bonsecours, au bout de l\'allée. Le surveillant doit t\'attendre à l\'entrée.'] },
  { setFlag: FLAGS.collegeOuverture },
];

// Première entrée dans le hall : le surveillant accueille Pierre et l'envoie à son casier, puis monte au couloir des
// casiers (escalier de droite du hall), où on le retrouve.
const HALL_STAIRS_RIGHT = [13, 2];
export const COLLEGE_WELCOME = [
  { approach: 'surveillant-hall' },
  {
    speaker: 'Surveillant',
    say: [
      'Bienvenue au collège Bonsecours ! C\'est moi le surveillant.',
      'Avant le premier cours, va ranger tes affaires dans ton casier : le casier 12, au couloir des casiers, en haut de l\'escalier de droite.',
      'Ta classe, c\'est la 6e B, en salle de maths. Et ce soir, tu rentres à Montépilloy par la route du sud.',
    ],
  },
  { walk: 'surveillant-hall', to: HALL_STAIRS_RIGHT, block: true },
  { setFlag: FLAGS.collegeArrivee },
];

// L'embrouille du casier : Pierre et Rémi posent la main sur le casier 12 en même temps ; le surveillant tranche,
// ils le partagent. Rémi le prend à la rigolade.
// Places dans le couloir des casiers : à droite du casier 12 (Rémi), la place du surveillant, l'escalier vers le hall
// (par où Rémi file en classe).
export const LOCKER_SIDE = [7, 3];
export const SURVEILLANT_SPOT = [12, 5];
const CORRIDOR_STAIRS = [13, 2];
const LOCKER_FIGHT = [
  { say: ['Le casier 12. Le tien, d\'après ton papier. Tu poses la main sur la porte…'] },
  { setFlag: FLAGS.remiArrive },
  { walk: 'remi', to: LOCKER_SIDE, block: true },
  { face: { remi: 'left', player: 'right' } },
  { say: ['… et un garçon, arrivé en courant, pose la main dessus en même temps que toi.'] },
  { speaker: 'Rémi', say: ['Hé ! C\'est mon casier, ça. Le 12.'] },
  { say: ['Tu lui montres ton papier : casier 12. C\'est le tien !'] },
  { speaker: 'Rémi', say: ['Le mien aussi dit 12 ! Regarde !', 'J\'étais là avant, de toute façon.'] },
  { say: ['Le ton monte. Chacun jure que c\'est le sien.'] },
  { approach: 'surveillant-couloir' },
  { speaker: 'Surveillant', say: ['Ça suffit, vous deux !', 'Puisque vous le voulez tous les deux, vous le partagez. Point.'] },
  { walk: 'surveillant-couloir', to: SURVEILLANT_SPOT },
  { setFlag: FLAGS.casierPartage },
  { face: { 'remi-casier': 'left', player: 'right' } },
  { speaker: 'Rémi', say: ['Bon, colocataire, tu mets tes affaires en haut ou en bas ?'] },
  {
    choose: 'Que lui réponds-tu ?',
    choices: [
      { label: 'En haut.', steps: [{ speaker: 'Rémi', say: ['En haut, parfait. Moi j\'aime bien le bas : c\'est plus près de mes chaussures.'] }] },
      { label: 'Comme tu veux.', steps: [{ speaker: 'Rémi', say: ['Cool. Je prends le bas, alors : c\'est plus près de mes chaussures.'] }] },
    ],
  },
  { say: ['Rémi rigole. Toi, tu hausses les épaules : il a l\'air d\'un sacré numéro, celui-là.'] },
  { speaker: 'Rémi', say: ['Allez, on file en maths, ça va sonner !'] },
  { walk: 'remi-casier', to: CORRIDOR_STAIRS, block: true, then: [FLAGS.remiEnClasse] },
];

// En salle de maths, une fois Rémi arrivé : il vient voir Pierre et l'invite à aller parler à Camille.
export const REMI_SEAT = [9, 5];
export const REMI_INVITE = [
  { approach: 'remi-classe' },
  { speaker: 'Rémi', say: ['Tiens, tu vois la fille, là ? Elle est dans notre classe.', 'Vas-y, va lui dire un mot. Et détends-toi.'] },
  { setFlag: FLAGS.remiInvite },
];

// Le casier 12 : l'embrouille, puis, une fois l'Insouciance reçue, votre QG (et l'autocollant de Rémi, objet-souvenir).
export const LOCKER = [
  { unlessFlags: [FLAGS.casierPartage], steps: LOCKER_FIGHT, end: true },
  { unlessSouvenirs: [TRAITS.insouciance.id], say: ['Le casier 12, à Rémi et toi. Tes affaires en haut, les siennes en bas.'], end: true },
  { ifItems: [ITEMS.autocollant.id], say: ['Le casier 12 : votre QG, à Rémi et toi. L\'autocollant de Rémi brille sur la porte.'], end: true },
  { say: ['Le casier 12 : votre QG, à Rémi et toi. Rémi a collé un autocollant de Pokémon à l\'intérieur de la porte.'] },
  { speaker: 'Rémi', say: ['Il m\'en restait un. Tiens, pour toi : comme ça, on a le même.'] },
  { give: ITEMS.autocollant, text: 'Rémi te donne un autocollant. Un souvenir de votre QG.' },
];

// Rémi, en classe : il pousse Pierre vers la fille, puis, l'Insouciance reçue, le casier devient leur QG.
export const REMI = [
  { ifSouvenirs: [TRAITS.insouciance.id], speaker: 'Rémi', say: ['Le casier, c\'est notre QG. On se retrouve là à chaque récré !'], end: true },
  { speaker: 'Rémi', say: ['Vas-y, va lui dire un mot. Et détends-toi. Elle va pas te manger.'] },
];

// La scène de la fille → Insouciance : dialogue à choix, trois répliques à chaque étape (trop coincée, trop forcée,
// détendue). Les mauvaises ne bloquent pas : petite gêne, et Rémi dédramatise ; la bonne fait avancer l'échange.
const RELAX = 'Rémi, derrière toi, souffle : « Relâche, là. Respire. »';
const line = (question, choices, answer, wrong) => ({ quiz: { question, choices, answer, wrong: { ...wrong, default: [RELAX] } } });
export const CAMILLE = [
  { unlessFlags: [FLAGS.remiInvite], say: ['Une fille de ta classe sort ses cahiers.'], end: true },
  { ifSouvenirs: [TRAITS.insouciance.id], speaker: 'Camille', say: ['On se met à côté, comme promis ! Moi, les maths, c\'est pas mon fort.'], end: true },
  { comeBeside: 'remi-classe' },
  { faceTo: 'camille' },
  { say: ['Rémi te suit, l\'air de rien.', 'La fille sort ses cahiers. Elle lève les yeux vers toi.'] },
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
  line('Et maintenant ?', ['On mange ensemble, promis ?', 'Bon… au revoir.', 'On se met à côté en maths ?'], 'On se met à côté en maths ?', {
    'Bon… au revoir.': ['Camille cligne des yeux. « Déjà ? On vient à peine de… bon. »', RELAX],
    'On mange ensemble, promis ?': ['« Promis » ? Camille recule d\'un pas. « On verra… »', RELAX],
  }),
  { speaker: 'Camille', say: ['Ça marche ! Je suis nulle en calcul, tu m\'aideras.'] },
  { say: ['Camille sourit.'] },
  { speaker: 'Rémi', say: ['Tu vois ? Tu te prends trop la tête.'] },
  { trait: TRAITS.insouciance },
  { speaker: 'Rémi', say: ['Bon. Notre casier, c\'est notre QG, maintenant. Et toi, t\'es mon pote.'] },
  { walk: 'remi-classe', to: REMI_SEAT, block: true },
  // Le prof les rappelle à l'ordre, depuis son bureau.
  { emote: 'prof-maths', kind: 'surprise' },
  { speaker: 'Professeur', say: ['Pierre ! Rémi ! Vous faites trop de bruit.', 'Si vous continuez comme ça, vous n\'aurez jamais votre brevet !'] },
  // Ellipse : quatre ans plus tard, la fin de la troisième. Le prof appelle Pierre pour son brevet (voir PROF).
  { black: true },
  { wait: 600 },
  { say: ['Quatre ans plus tard… La fin de la troisième.'] },
  { setFlag: FLAGS.finTroisieme },
  { black: false },
  { faceTo: 'prof-maths' },
  { emote: 'prof-maths', kind: 'surprise' },
  { speaker: 'Professeur', say: ['Pierre ! Viens me voir à mon bureau, j\'ai quelques questions pour toi.'] },
];

// Le prof de maths : à la fin de la troisième (après l'ellipse), il pose trois calculs simples (une erreur ne bloque pas : il fait
// recompter), puis remet le diplôme du brevet, qui ouvre la route du Prytanée.
const calcul = (question, choices, answer) => ({
  quiz: { speaker: 'Professeur', question, choices, answer, wrong: { default: ['Hmm… Recompte tranquillement.'] } },
});
export const PROF = [
  { ifItems: [ITEMS.brevet.id], speaker: 'Professeur', say: ['Avec ton brevet, tu peux candidater au Prytanée. Bonne chance, Pierre !'], end: true },
  { unlessFlags: [FLAGS.finTroisieme], speaker: 'Professeur', say: ['Sors ton cahier, Pierre : aujourd\'hui, calcul mental !'], end: true },
  { speaker: 'Professeur', say: ['Ah, Pierre ! Trois petits calculs, pour voir si tu as écouté malgré tout le bruit.'] },
  calcul('Combien font 7 plus 5 ?', ['11', '12', '13'], '12'),
  calcul('Et 6 fois 3 ?', ['18', '16', '21'], '18'),
  calcul('Dernier : 20 moins 8 ?', ['14', '10', '12'], '12'),
  { speaker: 'Professeur', say: ['Parfait ! Comme quoi, malgré le bruit… Tu as mérité ton diplôme du brevet.'] },
  { give: ITEMS.brevet, text: 'Tu reçois ton diplôme du brevet !' },
  { setFlag: FLAGS.bonsecoursFini },
  { speaker: 'Professeur', say: ['Avec ça, tu peux candidater au Prytanée, au bout de la route du nord. Bonne chance !'] },
];
