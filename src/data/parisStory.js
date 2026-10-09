import { FLAGS, ITEMS, TRAITS, carryText } from './story.js';

// Scénario de Paris, la dernière ville : pour la première fois, Pierre doit vraiment s'installer, et il n'est pas prêt.
// Une routine qui ne lui ressemble pas ; il grimpe les étages de la tour de bureaux en trois jours, puis refuse la place
// que le directeur lui offre : la Liberté, 8e et dernière vertu. Aucune ligne « Objectif : ».
//   1. L'arrivée devant l'immeuble aux balcons fleuris : le propriétaire et les clés.
//   2. Jour 1 : le rez-de-chaussée de la tour (le collègue), le soir, « Le lendemain… ».
//   3. Jour 2 : le manager fait monter Pierre au 1er étage (promotion), le soir, « Le lendemain… ».
//   4. Jour 3 : le bureau du directeur, au dernier étage : la Liberté.
//   5. En sortant de la tour : le rêve (voir reveStory.js).
// Le trajet de l'appartement à la tour est le même chaque matin (à pied, ou à vélo), de l'autre côté de la Seine.
// Scénettes partagées par la carte et les intérieurs (étapes : voir MapScene.runSteps).

const COLLEGUE = 'Collègue';
const MANAGER = 'Manager';

// ---------- 1. L'arrivée ----------

// Pierre arrive par la route de Bordeaux (bord ouest) et marche jusqu'à l'immeuble (6, 23) ; le propriétaire attend à
// côté de la porte.
export const ARRIVAL = [
  { goTo: [6, 23], facing: 'up' },
  { approach: 'proprietaire' },
  { speaker: 'Propriétaire', say: ['Bienvenue ! C\'est petit, mais vous verrez, on s\'y fait. Le bureau n\'est pas loin.'] },
  { give: ITEMS.clesParis, text: 'Le propriétaire te tend les clés.' },
  { say: ['Bon. Un appartement, un bureau. C\'est ça, maintenant.'] },
  { setFlag: FLAGS.parisCles },
];

// Le propriétaire ensuite : où est le bureau (la tour de verre, de l'autre côté de la Seine).
export const LANDLORD = [
  { ifFlags: [FLAGS.liberteParis], speaker: 'Propriétaire', say: ['Vous avez l\'air… plus léger, aujourd\'hui.'], end: true },
  { speaker: 'Propriétaire', say: ['Votre bureau ? La grande tour de verre, de l\'autre côté de la Seine, tout en bas à droite.'] },
];

// La soirée, en rentrant : la pensée du soir, puis « Le lendemain… » ; Pierre ressort au matin devant l'immeuble.
const nextMorning = (thought, flag) => [
  { say: [thought] },
  { black: true },
  { wait: 800 },
  { say: ['Le lendemain…'] },
  { setFlag: flag },
  { travel: { map: 'paris', x: 6, y: 23, facing: 'down' } },
];
export const EVENING_1 = nextMorning('Une journée. Puis une autre. Toutes pareilles.', FLAGS.jour2);
export const EVENING_2 = nextMorning('Ils sont contents de moi. Pourquoi je ne le suis pas, moi ?', FLAGS.jour3);

// ---------- 2. Jour 1 : le rez-de-chaussée ----------

// Le collègue, près de la machine à café (2, 4) : il vient à Pierre.
export const DAY_1 = [
  { say: ['Le hall de la tour. Ton poste t\'attend derrière le comptoir.'] },
  { approach: 'collegue' },
  { speaker: COLLEGUE, say: ['Dix ans que je fais ce trajet. On s\'habitue, tu verras.'] },
  { say: ['Des mails, des tableaux, des réunions. L\'après-midi passe sans que tu t\'en rendes compte.'] },
  { black: true },
  { wait: 700 },
  { black: false },
  { speaker: COLLEGUE, say: ['Dix-huit heures ! Allez, on rentre.'] },
  { setFlag: FLAGS.jour1Bureau },
];

// Le collègue, selon le moment.
export const COLLEAGUE = [
  { ifFlags: [FLAGS.liberteParis], speaker: COLLEGUE, say: ['Tu pars ? Vraiment ? … Tu sais quoi, je t\'envie un peu.'], end: true },
  { ifFlags: [FLAGS.jour3], speaker: COLLEGUE, say: ['Alors, monsieur du premier étage ? Ton bureau, c\'est en haut maintenant. L\'ascenseur, au fond.'], end: true },
  { ifFlags: [FLAGS.promotionParis], speaker: COLLEGUE, say: ['Il est tard. Rentre, va.'], end: true },
  { ifFlags: [FLAGS.jour2], speaker: COLLEGUE, say: ['Le même café, la même machine, le même bonjour. Tu vois, on s\'habitue.'], end: true },
  { ifFlags: [FLAGS.jour1Bureau], speaker: COLLEGUE, say: ['Dix-huit heures, je te dis ! Rentre chez toi.'], end: true },
  { speaker: COLLEGUE, say: ['Dix ans que je fais ce trajet. On s\'habitue, tu verras.'] },
];

// ---------- 3. Jour 2 : le manager ----------

// En entrant au rez-de-chaussée : le manager attend devant l'ascenseur et fait monter Pierre.
export const DAY_2 = [
  { say: ['Le même trajet. Le même hall.'] },
  { approach: 'manager-rdc' },
  { speaker: MANAGER, say: ['Pierre, monte une minute.'] },
  { black: true },
  { travel: { interior: 'entrepriseManager', x: 6, y: 7, facing: 'up' } },
];

// Au 1er étage, la suite : la promotion, puis la fin de la journée.
export const PROMOTION = [
  { faceTo: 'manager' },
  { speaker: MANAGER, say: ['Tu t\'en sors très bien. À partir d\'aujourd\'hui, tu travailles ici, avec moi.'] },
  { say: ['Un bureau plus grand, plus haut. Les heures passent pareil.'] },
  { black: true },
  { wait: 700 },
  { black: false },
  { speaker: MANAGER, say: ['Il est tard, Pierre. À demain.'] },
  { setFlag: FLAGS.promotionParis },
];

// ---------- 4. Jour 3 : le directeur ----------

// Au 1er étage, le troisième matin : le manager envoie Pierre au dernier étage.
export const DAY_3 = [
  { faceTo: 'manager' },
  { speaker: MANAGER, say: ['Ah, Pierre. Le directeur veut te voir. Dernier étage, l\'ascenseur est à gauche.'] },
  { setFlag: FLAGS.directeurInvite },
];

export const MANAGER_TALK = [
  { ifFlags: [FLAGS.liberteParis], speaker: MANAGER, say: ['Je ne comprends pas, Pierre. Mais… bonne chance.'], end: true },
  { ifFlags: [FLAGS.directeurInvite], speaker: MANAGER, say: ['Le directeur t\'attend. Dernier étage.'], end: true },
  { ifFlags: [FLAGS.promotionParis], speaker: MANAGER, say: ['Il est tard, Pierre. À demain.'], end: true },
  { speaker: MANAGER, say: ['Tu t\'en sors très bien.'] },
];

// Le bureau du directeur : la belle place, et le refus de Pierre (la Liberté).
export const DIRECTOR = [
  { approach: 'directeur' },
  {
    speaker: 'Directeur',
    say: ['Entre, Pierre, assieds-toi. Ça fait un moment que je te regarde, et je dois dire que tu te débrouilles vraiment bien. Il y a une belle place pour toi ici, tu sais.'],
  },
  { emote: 'player', kind: 'dots' },
  { speaker: 'Pierre', say: ['C\'est gentil, vraiment… Mais je crois que ce n\'est pas ma place. Il faut que je parte.'] },
  { trait: TRAITS.liberte, quiet: true },
  { useTrait: TRAITS.liberte },
  { say: [carryText('paris')] },
  { setFlag: FLAGS.liberteParis },
];

export const DIRECTOR_AFTER = ['La porte est ouverte, Pierre. Dans les deux sens.'];

// ---------- 5. En sortant de la tour : le rêve ----------

// Pierre fait un pas dehors et s'arrête ; l'écran se brouille, la ville s'estompe, la lumière change.
export const INTO_THE_DREAM = [
  { goTo: [42, 43], facing: 'down' },
  { wait: 600 },
  { dream: 4500 },
  { setFlag: FLAGS.reveParis },
  { travel: { map: 'reve', x: 14, y: 10, facing: 'down' } },
];
