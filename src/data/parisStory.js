import { FLAGS, ITEMS, TRAITS, carryText } from './story.js';

// Scénario de Paris, la dernière ville : pour la première fois, Pierre doit vraiment s'installer, et il n'est pas prêt.
// Le travail reste hors champ (aucune scène de bureau) : la tour de bureaux est le fil rouge, son ascenseur s'ouvre
// étage par étage. La boucle : Pierre passe au bureau, ressort, vit une mini-quête à lui dans Paris, revient, et
// l'étage suivant s'allume. Au dernier, le directeur lui offre une belle place ; il la refuse : la Liberté, 8e et
// dernière vertu. Aucune ligne « Objectif : », pas d'ellipse.
//   1. L'arrivée devant l'immeuble aux balcons fleuris : le propriétaire et les clés du studio.
//   2. Premier passage au bureau : le hall plein de collègues, le collègue blasé ; l'ascenseur ne monte pas.
//   3. Le concert : la place promise par Hugues a passé de main en main (Inès, Malik, Clara) ; Bercy.
//   4. Au bureau, le 1er étage s'allume : la promotion.
//   5. Le match : Hugues invite, Thomas finit son service au restaurant, France-Argentine chez Hugues.
//   6. Au bureau, le dernier étage s'allume : le directeur, la Liberté ; en sortant, le rêve (reveStory.js).
// Scénettes partagées par la carte et les intérieurs (étapes : voir MapScene.runSteps).

const COLLEGUE = 'Collègue';
const MANAGER = 'Manager';
// La foule de Bercy (interiors.js bercy).
const CROWD = Array.from({ length: 18 }, (_, i) => `fan-${i}`);

// ---------- 1. L'arrivée ----------

// Pierre arrive par la route de Bordeaux (bord ouest) et marche jusqu'à l'immeuble (6, 23) ; le propriétaire attend à
// côté de la porte.
export const ARRIVAL = [
  { goTo: [6, 23], facing: 'up' },
  { approach: 'proprietaire' },
  { speaker: 'Propriétaire', say: ['Bienvenue ! C\'est petit, mais vous verrez, on s\'y fait. Le bureau n\'est pas loin.'] },
  { give: ITEMS.clesParis, text: 'Le propriétaire te tend les clés du studio.' },
  { say: ['Bon. Un appartement, un bureau. C\'est ça, maintenant.'] },
  { setFlag: FLAGS.parisCles },
];

// Le propriétaire ensuite : où est le bureau (la tour de verre, de l'autre côté de la Seine).
export const LANDLORD = [
  { ifFlags: [FLAGS.liberteParis], speaker: 'Propriétaire', say: ['Vous avez l\'air… plus léger, aujourd\'hui.'], end: true },
  { speaker: 'Propriétaire', say: ['Votre bureau ? La grande tour de verre, de l\'autre côté de la Seine, tout en bas à droite.'] },
];

// ---------- 2. Le bureau ----------

// Premier passage : le hall de la tour, vivant ; le collègue blasé vient à Pierre.
export const OFFICE_FIRST = [
  { say: ['Le hall de la tour. Cette fois, ton badge passe.'] },
  { approach: 'collegue' },
  { speaker: COLLEGUE, say: ['Dix ans que je fais ce trajet. On s\'habitue, tu verras.'] },
  { setFlag: FLAGS.jour1Bureau },
];

// Le collègue blasé, près de la machine à café.
export const COLLEAGUE = [
  { ifFlags: [FLAGS.liberteParis], speaker: COLLEGUE, say: ['Tu pars ? Vraiment ? … Tu sais quoi, je t\'envie un peu.'], end: true },
  { ifFlags: [FLAGS.promotionParis], speaker: COLLEGUE, say: ['Alors, monsieur du premier étage ? On ne te voit plus, en bas.'], end: true },
  { speaker: COLLEGUE, say: ['Dix ans que je fais ce trajet. On s\'habitue, tu verras.'] },
];

// Les collègues du hall, debout : ils parlent à Pierre comme à quelqu'un qui travaille là.
export const HALL_LINES = {
  tot: ['Salut Pierre ! Encore là de bonne heure, toi.'],
  point: ['Tiens, Pierre, tu passes au point d\'équipe tout à l\'heure ?'],
  bonne: ['Bonne journée, hein ! On se voit en haut.'],
  cafe: ['La machine à café est encore en panne. Comme tous les lundis.'],
};

// De retour au bureau après le concert : le bouton du 1er étage s'est allumé (un collègue le dit).
export const MANAGER_CALLS = [
  { approach: 'collegue-point' },
  { speaker: 'Collègue', say: ['Pierre ! Le manager te cherchait. Il t\'attend au 1er étage : l\'ascenseur, au fond.'] },
];

// Au 1er étage : la promotion (pas de scène de travail).
export const PROMOTION = [
  { approach: 'manager' },
  { speaker: MANAGER, say: ['Pierre ! Tu t\'en sors très bien. À partir d\'aujourd\'hui, tu travailles ici, avec moi.'] },
  { say: ['Une promotion. Un bureau plus grand, plus haut.'] },
  { setFlag: FLAGS.promotionParis },
];

export const MANAGER_TALK = [
  { ifFlags: [FLAGS.liberteParis], speaker: MANAGER, say: ['Je ne comprends pas, Pierre. Mais… bonne chance.'], end: true },
  { ifFlags: [FLAGS.directeurInvite], speaker: MANAGER, say: ['Le directeur t\'attend. Dernier étage.'], end: true },
  { speaker: MANAGER, say: ['Bienvenue au 1er étage. Tu verras, la vue est plus belle d\'ici.'] },
];

// De retour au bureau après le match : le dernier étage s'allume.
export const DIRECTOR_CALLS = [
  { approach: 'collegue-point' },
  { speaker: 'Collègue', say: ['Pierre ! Le directeur veut te voir. Dernier étage, rien que ça !'] },
  { setFlag: FLAGS.directeurInvite },
];

// ---------- 3. Le concert : la place qui a voyagé ----------

// En sortant de la tour la première fois : Hugues appelle.
export const HUGUES_CALL = [
  { emote: 'player', kind: 'surprise' },
  { say: ['Ton téléphone sonne. C\'est Hugues.'] },
  {
    speaker: 'Hugues',
    phone: true,
    say: [
      'Pierre ! Ce soir, concert à Bercy. Je t\'avais promis une place… mais je l\'ai passée à Inès pour qu\'elle te la donne, et… bref, elle a un peu voyagé.',
      'Inès est devant l\'Opéra. Elle saura où elle est passée !',
    ],
  },
  { setFlag: FLAGS.concertAppel },
];

// De main en main : chacun dit à qui il l'a passée (avant l'appel de Hugues, ce sont des Parisiens comme les autres).
export const INES = [
  { ifFlags: [FLAGS.placeInes], speaker: 'Inès', say: ['Malik, dans la file du Louvre. Bonne chance !'], end: true },
  { ifFlags: [FLAGS.concertAppel], speaker: 'Inès', say: ['La place de Hugues ? Ah… Je l\'ai donnée à Malik, il en rêvait. Il fait la queue au Louvre, comme d\'habitude.'] },
  { ifFlags: [FLAGS.concertAppel], setFlag: FLAGS.placeInes, end: true },
  { speaker: 'Inès', say: ['L\'Opéra ouvre ce soir. J\'attends une amie.'] },
];
export const MALIK = [
  { ifFlags: [FLAGS.placeMalik], speaker: 'Malik', say: ['Clara, au café à terrasse. Elle ne l\'a pas encore utilisée, promis !'], end: true },
  { ifFlags: [FLAGS.placeInes], speaker: 'Malik', say: ['Ta place ? Mince… Je l\'ai laissée à Clara, au café à terrasse, à côté de ton immeuble. Elle adore ce chanteur.'] },
  { ifFlags: [FLAGS.placeInes], setFlag: FLAGS.placeMalik, end: true },
  { speaker: 'Malik', say: ['Deux heures de queue pour le Louvre. Mais ça vaut le coup, il paraît.'] },
];
export const CLARA = [
  { ifFlags: [FLAGS.placeClara], speaker: 'Clara', say: ['Bon concert ! Tu me raconteras.'], end: true },
  {
    ifFlags: [FLAGS.placeMalik],
    steps: [
      { speaker: 'Clara', say: ['Oh, c\'était la tienne ? Je suis désolée ! Tiens, reprends-la.'] },
      { give: ITEMS.placeConcert, text: 'Clara te rend la place de concert.' },
      { speaker: 'Clara', say: ['Bercy, c\'est le grand dôme, en haut à gauche. Ça commence bientôt !'] },
      { setFlag: FLAGS.placeClara },
    ],
    end: true,
  },
  { speaker: 'Clara', say: ['Un café en terrasse, au soleil… Le vrai luxe parisien.'] },
];

// À Bercy : la place est contrôlée, Pierre avance dans la fosse, le chanteur chante.
export const CONCERT = [
  { take: ITEMS.placeConcert.id },
  { say: ['Tu montres ta place à l\'entrée. La salle est pleine.'] },
  { goTo: [6, 9], facing: 'up' },
  { say: ['Le concert commence !'] },
  {
    speaker: 'Chanteur',
    say: [
      'J\'garde le meilleur et j\'ai tourné les pages, j\'ai pas de rancœur et j\'oublie jamais rien.',
      'J\'ai passé l\'été sous la neige et l\'hiver à la plage, tu ferais quoi à ma place ?',
      'Donc, y\'a plus rien qui m\'attache, c\'est un jour la baie ou le Taj, moi j\'voulais répondre à ces messages…',
    ],
  },
  { cheer: CROWD },
  { say: ['Le concert se termine.'] },
  { say: ['Allez, faut que je rentre. Demain, grosse journée.'] },
  { setFlag: FLAGS.concertParis },
];

// ---------- 5. Le match ----------

// En sortant de la tour, promu : un message de Hugues.
export const HUGUES_MESSAGE = [
  { emote: 'player', kind: 'surprise' },
  { say: ['Ton téléphone vibre. Un message de Hugues.'] },
  {
    speaker: 'Hugues',
    phone: true,
    say: [
      'Match ce soir chez moi ! Passe prendre Thomas en chemin, et ramenez de quoi manger.',
      'Thomas finit son service au resto au store rayé, de l\'autre côté de la Seine. Moi, c\'est l\'immeuble crème, juste à côté !',
    ],
  },
  { say: ['Enfin un truc normal.'] },
  { setFlag: FLAGS.messageHugues },
];

// Au restaurant : Thomas finit son service, récupère de quoi manger, et suit Pierre (story.js FOLLOWERS).
export const THOMAS_SERVICE = [
  { approach: 'thomas' },
  {
    speaker: 'Thomas',
    say: ['Ah, Pierre ! Deux secondes, je récupère de quoi manger et j\'arrive. Hugues va encore hurler devant sa télé, tu vas voir !'],
  },
  { give: ITEMS.platsMatch, text: 'Thomas te tend de quoi manger.' },
  { setFlag: FLAGS.thomasSuit },
];

// Chez Hugues : le salon, la télé allumée, des amis devant. France-Argentine.
const WATCHERS = ['hugues', 'ami-match-1', 'ami-match-2', 'amie-match', 'thomas'];
export const MATCH = [
  { setFlag: FLAGS.matchArrivee },
  { speaker: 'Hugues', say: ['Les voilà ! Allez, posez tout, ça va commencer, j\'attends ce match depuis des semaines !'] },
  { take: ITEMS.platsMatch.id },
  { walk: 'thomas', to: [7, 5], block: true },
  { face: { thomas: 'up' } },
  { goTo: [6, 6], facing: 'up' },
  { say: ['Le match commence ! C\'est France-Argentine.'] },
  { speaker: 'Ami', say: ['Allez les Bleus !'] },
  { speaker: 'Amie', say: ['Non mais tu as vu cette passe ?!'] },
  { speaker: 'Hugues', say: ['Contre l\'Argentine, ça se gagne, allez !'] },
  { say: ['Buuut !'] },
  { cheer: WATCHERS },
  { speaker: 'Hugues', say: ['Allez la France !'] },
  { say: ['Mais l\'Argentine revient. Une fois… puis une deuxième.'] },
  { emote: 'hugues', kind: 'dots' },
  { speaker: 'Hugues', say: ['Non… c\'est pas possible…'] },
  { say: ['Le match se termine.'] },
  { speaker: 'Thomas', say: ['Bon. On les aura la prochaine fois. Allez, il reste à manger !'] },
  { say: ['On a perdu, mais c\'était une belle soirée pour le GOAT…'] },
  { setFlag: FLAGS.matchParis },
];

export const HUGUES_AFTER = ['Perdu contre l\'Argentine… Mais quelle soirée, hein ? Reviens quand tu veux.'];

// ---------- 6. Le directeur ----------

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

// ---------- 7. En sortant de la tour : le rêve ----------

// Pierre fait un pas dehors et s'arrête ; l'écran se brouille, la ville s'estompe, la lumière change.
export const INTO_THE_DREAM = [
  { goTo: [42, 43], facing: 'down' },
  { wait: 600 },
  { dream: 4500 },
  { setFlag: FLAGS.reveParis },
  { travel: { map: 'reve', x: 14, y: 10, facing: 'down' } },
];
