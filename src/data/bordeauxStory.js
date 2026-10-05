import { FLAGS, ITEMS, TRAITS } from './story.js';

// Scénario de Bordeaux (les études), en cinq temps :
//   1. Les clés : l'agence, puis Ousmane, le coloc, devant l'immeuble ; ils entrent ensemble.
//   2. La coupure : l'appartement dans le noir ; Pierre (Ingéniosité) relève le compteur. Pas de vertu à Bordeaux.
//   3. La soirée d'intégration : l'enceinte chez Paulfit, les gobelets chez Rémi ; la fête dans l'appartement.
//   4. Le diplôme d'anglais : l'oral à KEDGE (Rémi devant la porte).
//   5. Le départ : l'aéroport (sortie est), Ousmane au guichet ; vol pour Hull.
// Scénettes partagées par la carte, les intérieurs et l'aéroport (étapes : voir MapScene.runSteps).

const AGENT = 'Agent immobilier';
const PROF = "Professeure d'anglais";
const APARTMENT = { interior: 'appartement', x: 6, y: 8, facing: 'up' };

// ---------- 1. Les clés ----------

export const ARRIVAL = [
  { opening: { postcard: 'bordeaux', text: 'Bordeaux, Gironde. Les études commencent.' } },
  { setFlag: FLAGS.bordeauxOuverture },
  { say: ['Objectif : récupère les clés à l\'agence.'] },
];

export const AGENT_KEYS = [
  { ifItems: [ITEMS.clesAppartement.id], speaker: AGENT, say: ['L\'immeuble est juste à gauche.'], end: true },
  { speaker: AGENT, say: ['Vos parents ont tout réglé. Voici les clés, l\'immeuble est juste à gauche.'] },
  { give: ITEMS.clesAppartement },
  { say: ['Objectif : va à l\'appartement.'] },
];

// Ousmane attend devant la porte de l'immeuble ; avec les clés, il entre avec Pierre.
const OUSMANE_MEETS = [
  { approach: 'ousmane-porte' },
  { speaker: 'Ousmane', say: ['Salut, moi c\'est Ousmane, ton coloc. Alors, on va voir ça ?'] },
  { setFlag: FLAGS.ousmaneRencontre },
  { sound: 'door' },
  { travel: APARTMENT },
];
export const OUSMANE_AT_DOOR = [
  { ifItems: [ITEMS.clesAppartement.id], steps: OUSMANE_MEETS, end: true },
  { speaker: 'Ousmane', say: ['Salut ! Moi c\'est Ousmane, ton coloc. T\'as les clés ? L\'agence est juste à droite.'] },
];

// ---------- 2. La coupure ----------

// L'appartement dans le noir (voir interiors.appartement, `dark`) ; le compteur est au fond de la pièce, à chercher à tâtons.
export const BLACKOUT = [
  { say: ['Il fait tout noir. L\'interrupteur ne répond pas.'] },
  { speaker: 'Ousmane', say: ['C\'est quoi ce délire ? On appelle quelqu\'un ?'] },
  { speaker: 'Pierre', say: ['Non.'] },
  { useTrait: TRAITS.ingeniosite },
  { setFlag: FLAGS.coupure },
  { say: ['Objectif : trouve le compteur électrique.'] },
];

// Le compteur, au fond de la pièce : la lumière revient ; Ousmane lance la soirée et sort attendre devant l'immeuble.
export const METER = [
  { ifFlags: [FLAGS.coupureReparee], say: ['Le compteur électrique. Tout est rétabli.'], end: true },
  { say: ['Le compteur électrique. Le disjoncteur est tombé… Tu le relèves.'] },
  { sound: 'confirm' },
  { setFlag: FLAGS.coupureReparee },
  { approach: 'ousmane-coupure' },
  { speaker: 'Ousmane', say: ['T\'es sérieux, tu savais faire ça ?'] },
  {
    speaker: 'Ousmane',
    say: [
      'Bon. Les nouveaux élèves de KEDGE arrivent, on fait la soirée ici. Il nous manque tout.',
      'Paulfit a une enceinte, Rémi a des gobelets.',
      'Paulfit habite le studio au nord, Rémi l\'appart près du campus.',
    ],
  },
  { walk: 'ousmane-coupure', to: [6, 9], block: true, then: [FLAGS.preparatifs] },
  { say: ['Objectif : récupère l\'enceinte chez Paulfit et les gobelets chez Rémi.'] },
];

// ---------- 3. La soirée d'intégration ----------

export const PAULFIT = [
  { ifItems: [ITEMS.enceinte.id], speaker: 'Paulfit', say: ['Dos droit, hein ! Et tu me la rends entière.'], end: true },
  { ifFlags: [FLAGS.soiree], speaker: 'Paulfit', say: ['Alors, elle a tenu le coup, mon enceinte ?'], end: true },
  { unlessFlags: [FLAGS.preparatifs], speaker: 'Paulfit', say: ['Salut ! Paulfit. Aujourd\'hui, c\'est jambes. Repasse plus tard.'], end: true },
  { speaker: 'Paulfit', say: ['L\'enceinte ? Ok, mais tu la portes comme un vrai, dos droit.'] },
  {
    choose: 'Comment tu la portes ?',
    choices: [
      { label: 'Dos droit, genoux pliés.', steps: [{ speaker: 'Paulfit', say: ['Voilà ! T\'as fait ça toute ta vie, toi.'] }] },
      { label: 'À une main, tranquille.', steps: [{ speaker: 'Paulfit', say: ['À une main ?! Prends-la à deux. Et dos droit.'] }] },
      { label: 'Tu me la portes ?', steps: [{ speaker: 'Paulfit', say: ['Bien essayé. C\'est de la muscu gratuite, profite.'] }] },
    ],
  },
  { give: ITEMS.enceinte },
];

export const REMI_CUPS = [
  { ifItems: [ITEMS.gobelets.id], speaker: 'Rémi', say: ['Have fun ce soir ! Enfin… amuse-toi bien, quoi.'], end: true },
  { ifFlags: [FLAGS.soiree], speaker: 'Rémi', say: ['What a night ! Enfin… quelle soirée.'], end: true },
  { unlessFlags: [FLAGS.preparatifs], speaker: 'Rémi', say: ['Hey ! Moi c\'est Rémi. Je reviens d\'un échange aux USA, ça se voit, non ?'], end: true },
  { speaker: 'Rémi', say: ['C\'est so random, les gobelets sont dans le closet.'] },
  {
    choose: 'Que lui réponds-tu ?',
    choices: [
      { label: 'Le closet ?', steps: [{ speaker: 'Rémi', say: ['Le placard, sorry. Six mois aux States, ça laisse des traces.'] }] },
      { label: 'Thanks, bro.', steps: [{ speaker: 'Rémi', say: ['You\'re welcome, bro ! On parle la même langue, toi et moi.'] }] },
      { label: 'Parle français !', steps: [{ speaker: 'Rémi', say: ['Okay, okay… Les gobelets. Dans le placard. Voilà. Happy ?'] }] },
    ],
  },
  { give: ITEMS.gobelets },
];

// Les deux objets réunis : la soirée commence (fondu, l'appartement en mode fête).
const PARTY_START = [
  { speaker: 'Ousmane', say: ['On est bons. Rentre, ça commence.'] },
  { black: true },
  { wait: 600 },
  { take: ITEMS.enceinte.id },
  { take: ITEMS.gobelets.id },
  { setFlag: FLAGS.soiree },
  { travel: { ...APARTMENT, y: 7 } },
];
const BOTH = [ITEMS.enceinte.id, ITEMS.gobelets.id];

// Ousmane, devant l'immeuble pendant les préparatifs : il rappelle ce qui manque.
export const OUSMANE_REMINDS = [
  { ifItems: BOTH, steps: PARTY_START, end: true },
  { speaker: 'Ousmane', say: ['Alors, ça avance ?'] },
  { unlessItems: [ITEMS.enceinte.id], speaker: 'Ousmane', say: ['Il manque l\'enceinte : Paulfit, le studio au nord.'] },
  { unlessItems: [ITEMS.gobelets.id], speaker: 'Ousmane', say: ['Et les gobelets : Rémi, l\'appart près du campus.'] },
];

// La case devant la porte de l'immeuble : la rencontre avec Ousmane (avec les clés), puis le début de la soirée.
export const FRONT_DOOR = [
  { ifItems: [ITEMS.clesAppartement.id], unlessFlags: [FLAGS.ousmaneRencontre], steps: OUSMANE_MEETS, end: true },
  { ifFlags: [FLAGS.preparatifs], unlessFlags: [FLAGS.soiree], ifItems: BOTH, steps: [{ approach: 'ousmane-rappel' }, ...PARTY_START] },
];

export const PARTY = [{ say: ['La soirée d\'intégration bat son plein. L\'enceinte de Paulfit trône au milieu du salon.'] }];

// En quittant la fête : le lendemain matin, l'appartement en désordre ; Ousmane dort. Facultatif (Autonomie) : tout
// ranger, dans n'importe quel ordre ; Ousmane se réveille et donne l'objet-souvenir de Bordeaux, la photo de la soirée.
// On peut aussi sortir tout de suite : quelques mois plus tard (MONTHS_LATER), l'appartement est rangé.
export const PARTY_END = [
  { black: true },
  { wait: 600 },
  { setFlag: FLAGS.lendemainSoiree },
  { black: false },
  { say: ['Le lendemain matin. L\'appartement est sens dessus dessous. Ousmane dort sur le canapé.'] },
];
const TIDY_FLAGS = [FLAGS.gobeletsRanges, FLAGS.salonRange, FLAGS.litFaitBordeaux];
const OUSMANE_WAKES = [
  { speaker: 'Ousmane', say: ['Attends… t\'as tout rangé ? Tout seul ?', 'Tiens, j\'ai trouvé ça sous le canapé.'] },
  { give: ITEMS.photoSoiree, text: 'Tu reçois la photo de la soirée !' },
];
// Une tâche du rangement (la première : Autonomie), puis le réveil d'Ousmane si c'était la dernière.
const tidy = (text, flag) => [
  { unlessFlags: TIDY_FLAGS, useTrait: TRAITS.autonomie },
  { say: [text] },
  { setFlag: flag },
  { ifFlags: TIDY_FLAGS, steps: OUSMANE_WAKES },
];
export const TIDY_CUPS = tidy('Pierre ramasse les gobelets.', FLAGS.gobeletsRanges);
export const TIDY_LIVING_ROOM = tidy('Pierre range le salon.', FLAGS.salonRange);
export const TIDY_BED = tidy('Pierre fait son lit.', FLAGS.litFaitBordeaux);
export const OUSMANE_ASLEEP = [
  { ifItems: [ITEMS.photoSoiree.id], speaker: 'Ousmane', say: ['Attends… t\'as tout rangé ? Tout seul ?'], end: true },
  { say: ['Ousmane dort sur le canapé.'] },
];

// En sortant de la soirée : quelques mois plus tard.
export const MONTHS_LATER = [
  { black: true },
  { wait: 700 },
  { say: ['Quelques mois plus tard…'] },
  { setFlag: FLAGS.soireeFinie },
  { black: false },
  { say: ['Objectif : passe l\'oral d\'anglais à KEDGE.'] },
];

// ---------- 4. Le diplôme d'anglais ----------

export const REMI_AT_KEDGE = [
  { face: { 'remi-kedge': 'left', player: 'right' } },
  { speaker: 'Rémi', say: ['T\'inquiète, c\'est easy.'] },
  { setFlag: FLAGS.remiKedge },
  { face: { player: 'up' } },
];

// L'oral : trois questions à choix ; les mauvaises réponses (du franglais) font sourire, et on réessaie.
const oral = (question, choices, answer, wrong) => ({ quiz: { speaker: PROF, question, choices, answer, wrong: { ...wrong, default: ['Try again!'] } } });
export const ENGLISH_ORAL = [
  { ifItems: [ITEMS.diplomeAnglais.id], speaker: PROF, say: ['Avec ça, la route vers l\'est t\'est ouverte.'], end: true },
  { speaker: PROF, say: ['Welcome to your English oral! Three questions. Ready?'] },
  { useTrait: TRAITS.audace },
  oral('« Je suis en retard », in English?', ['I am in retard.', 'I am late.', 'I am en retard, my friend.'], 'I am late.', {
    'I am in retard.': ['Oh dear… Non. Vraiment pas. Try again!'],
    'I am en retard, my friend.': ['Very French. Try again!'],
  }),
  oral('« Ça marche ! », in English?', ['It walks!', 'Deal!', 'That runs, my love!'], 'Deal!', {
    'It walks!': ['Ça marche… à pied ? Try again!'],
    'That runs, my love!': ['Charming. But no. Try again!'],
  }),
  oral('« J\'ai hâte ! », in English?', ['I have haste!', 'I am hasted!', 'I can\'t wait!'], 'I can\'t wait!', {
    'I have haste!': ['Hmm, lost in translation. Try again!'],
    'I am hasted!': ['Pardon? Try again!'],
  }),
  { speaker: PROF, say: ['Excellent! Well done, Pierre.'] },
  { give: ITEMS.diplomeAnglais, text: 'Diplôme obtenu : Anglais KEDGE !' },
  { speaker: PROF, say: ['Avec ça, la route vers l\'est t\'est ouverte.'] },
  { say: ['Objectif : va à l\'aéroport, sortie est.'] },
];

// ---------- 5. Le départ ----------

// Au guichet de l'aéroport, le vol pour Hull : Ousmane garde le départ.
export const FLIGHT_TO_HULL = [
  { faceTo: 'ousmane-aeroport' },
  { speaker: 'Ousmane', say: ['Hull, hein. Je pars une semaine avant toi, je te garde une place à la coloc.'] },
  { setFlag: FLAGS.arriveeHull },
  { travel: { map: 'hull', x: 1, y: 35, facing: 'right', plane: true } },
];
