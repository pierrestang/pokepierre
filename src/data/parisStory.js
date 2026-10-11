import { FLAGS, ITEMS, TRAITS, carryText } from './story.js';

// Scénario de Paris, la dernière ville : pour la première fois, Pierre doit vraiment s'installer, et il n'est pas prêt.
// Le travail reste hors champ (aucune scène de bureau) : la tour de bureaux est le fil rouge, son ascenseur s'ouvre
// étage par étage. La boucle : Pierre passe au bureau, ressort, vit une mini-quête à lui dans Paris, revient, et
// l'étage suivant s'allume. Au dernier, le directeur lui offre une belle place ; il la refuse : la Liberté, 8e et
// dernière vertu. Aucune ligne « Objectif : » ; deux ellipses, « Un an plus tard », après le concert et après le match.
//   1. L'arrivée devant l'immeuble aux balcons fleuris : le propriétaire et les clés du studio.
//   2. Premier passage au bureau : le hall plein de collègues, le collègue blasé ; l'ascenseur ne monte pas.
//   3. Le concert : la place d'Antoine, un collègue, a passé de main en main (Tam, puis Louis, qui la rend) ; Bercy ; un an plus tard.
//   4. Au bureau, le 1er étage s'allume : la promotion.
//   5. Le match : Hugues invite, Thomas finit son service au restaurant, la finale France-Argentine chez Hugues ; un an plus tard.
//   6. Au bureau, le dernier étage s'allume : le directeur, la Liberté ; en sortant, le rêve (reveStory.js).
// Scénettes partagées par la carte et les intérieurs (étapes : voir MapScene.runSteps).

// Les collègues de la tour, de jeunes adultes (interiors.js entreprise) : Camille accueille Pierre le premier jour et
// l'appelle ensuite à l'accueil ; Guillaume, le blasé, reste près de la machine à café.
const CAMILLE = 'Camille';
const GUILLAUME = 'Guillaume';
const MANAGER = 'Manager';
// La foule de Bercy (interiors.js bercy).
const CROWD = Array.from({ length: 18 }, (_, i) => `fan-${i}`);

// ---------- 1. L'arrivée ----------

// Pierre arrive par la route de Bordeaux (bord ouest) ; personne ne vient le chercher. Le propriétaire attend juste
// devant l'immeuble aux balcons fleuris (7, 23) : c'est à Pierre de le trouver et de lui parler.
const KEYS = [
  { speaker: 'Propriétaire', say: ['Bienvenue ! C\'est petit, mais vous verrez, on s\'y fait.', 'Votre bureau ? La grande tour de verre, de l\'autre côté de la Seine, tout en bas à droite.'] },
  { give: ITEMS.clesParis, text: 'Le propriétaire te tend les clés du studio.' },
  { say: ['Bon. Un appartement, un bureau. C\'est ça, maintenant.'] },
  { setFlag: FLAGS.parisCles },
];

// Le propriétaire : les clés, puis où est le bureau (la tour de verre, de l'autre côté de la Seine).
export const LANDLORD = [
  { unlessFlags: [FLAGS.parisCles], steps: KEYS, end: true },
  { ifFlags: [FLAGS.liberteParis], speaker: 'Propriétaire', say: ['Vous avez l\'air… plus léger, aujourd\'hui.'], end: true },
  { speaker: 'Propriétaire', say: ['Votre bureau ? La grande tour de verre, de l\'autre côté de la Seine, tout en bas à droite.'] },
];

// ---------- 2. Le bureau ----------

// Premier passage : le hall de la tour, vivant ; le collègue blasé vient à Pierre.
// Le premier jour : en passant les portes, une collègue vient accueillir Pierre ; puis le collègue blasé.
export const OFFICE_FIRST = [
  { say: ['Le hall de la tour. Cette fois, ton badge passe.'] },
  { approach: 'collegue-accueil' },
  {
    speaker: CAMILLE,
    say: [
      'Salut ! Tu dois être Pierre ? Moi, c\'est Camille. Bienvenue dans l\'équipe !',
      'Ici, c\'est le hall : l\'accueil, le salon, la machine à café. Les étages, ça viendra. Tu vas voir, on est une bonne équipe.',
    ],
  },
  { approach: 'collegue' },
  { speaker: GUILLAUME, say: ['Dix ans que je fais ce trajet. On s\'habitue, tu verras.'] },
  { speaker: CAMILLE, say: ['Pour un premier jour, c\'est tout ! Rentre te reposer, on se voit demain.'] },
  { setFlag: FLAGS.jour1Bureau },
];

// Guillaume, le collègue blasé, près de la machine à café.
export const COLLEAGUE = [
  { ifFlags: [FLAGS.liberteParis], speaker: GUILLAUME, say: ['Tu pars ? Vraiment ? … Tu sais quoi, je t\'envie un peu.'], end: true },
  { ifFlags: [FLAGS.promotionParis], speaker: GUILLAUME, say: ['Alors, monsieur du premier étage ? On ne te voit plus, en bas.'], end: true },
  { speaker: GUILLAUME, say: ['Dix ans que je fais ce trajet. On s\'habitue, tu verras.'] },
];

// Les collègues du hall, debout : ils parlent à Pierre comme à quelqu'un qui travaille là.
export const HALL_LINES = {
  tot: ['Salut Pierre ! Encore là de bonne heure, toi.'],
  point: ['Tiens, Pierre, tu passes au point d\'équipe tout à l\'heure ?'],
  bonne: ['Bonne journée, hein ! On se voit en haut.'],
  cafe: ['La machine à café est encore en panne. Comme tous les lundis.'],
};

// De retour au bureau après le concert : le bouton du premier étage s'est allumé (Camille le dit).
// (Camille, près de l'entrée : elle n'a que quelques pas à faire.)
export const MANAGER_CALLS = [
  { approach: 'collegue-accueil' },
  { speaker: CAMILLE, say: ['Pierre ! Le manager te cherchait. Il t\'attend au premier étage : l\'ascenseur, au fond.'] },
];

// Au 1er étage : la promotion (pas de scène de travail).
export const PROMOTION = [
  { approach: 'manager' },
  { speaker: MANAGER, say: ['Pierre ! Tu t\'en sors très bien. À partir d\'aujourd\'hui, tu travailles ici, avec moi.'] },
  { say: ['Une promotion. Un bureau plus grand, plus haut.'] },
  { speaker: MANAGER, say: ['Allez, file te changer les idées. On commence demain !'] },
  { setFlag: FLAGS.promotionParis },
];

export const MANAGER_TALK = [
  { ifFlags: [FLAGS.liberteParis], speaker: MANAGER, say: ['Je ne comprends pas, Pierre. Mais… bonne chance.'], end: true },
  { ifFlags: [FLAGS.directeurInvite], speaker: MANAGER, say: ['Le directeur t\'attend. Dernier étage.'], end: true },
  { speaker: MANAGER, say: ['Bienvenue au 1er étage. Tu verras, la vue est plus belle d\'ici.'] },
];

// De retour au bureau après le match : le dernier étage s'allume.
export const DIRECTOR_CALLS = [
  { approach: 'collegue-accueil' },
  { speaker: CAMILLE, say: ['Pierre ! Le directeur veut te voir. Dernier étage, rien que ça !'] },
  { setFlag: FLAGS.directeurInvite },
];

// ---------- 3. Le concert : la place qui a voyagé ----------

// À l'arrivée à Paris : le propriétaire du studio appelle et dit où il attend.
export const LANDLORD_CALL = [
  { say: ['Ton téléphone vibre. C\'est le propriétaire de ton studio.'] },
  {
    speaker: 'Propriétaire', phone: true,
    say: ['Bonjour ! Je vous attends devant l\'immeuble aux balcons fleuris : descendez la rue, c\'est sur votre gauche.'],
  },
  { setFlag: FLAGS.appelProprietaire },
];

// Un an après le concert, puis un an après le match : Camille appelle, la tour attend Pierre.
export const MANAGER_REMINDER = [
  { say: ['Ton téléphone vibre. C\'est Camille, du bureau.'] },
  { speaker: CAMILLE, phone: true, say: ['Pierre ? Le manager te cherche ! Passe à la tour dès que tu peux : premier étage.'] },
  { setFlag: FLAGS.rappelManager },
];
export const DIRECTOR_REMINDER = [
  { say: ['Ton téléphone vibre. C\'est Camille, du bureau.'] },
  { speaker: CAMILLE, phone: true, say: ['Pierre ! Le directeur veut te voir. À la tour, dernier étage, rien que ça !'] },
  { setFlag: FLAGS.rappelDirecteur },
];

// En sortant de la tour la première fois : Antoine, un collègue de la tour, appelle.
export const ANTOINE_CALL = [
  { emote: 'player', kind: 'surprise' },
  { say: ['Ton téléphone sonne. C\'est Antoine, du bureau.'] },
  {
    speaker: 'Antoine',
    phone: true,
    say: [
      'Pierre ! Ce soir, concert à Bercy. J\'avais une place pour toi… mais je l\'ai passée à Tam pour qu\'il te la donne, et… bref, elle a un peu voyagé.',
      'Tam est devant l\'Opéra. Il saura où elle est passée !',
    ],
  },
  { setFlag: FLAGS.concertAppel },
];

// De main en main : chacun dit à qui il l'a passée (avant l'appel de Hugues, ce sont des Parisiens comme les autres).
export const TAM = [
  { ifFlags: [FLAGS.placeTam], speaker: 'Tam', say: ['Louis, dans la file du Louvre. Bonne chance !'], end: true },
  { ifFlags: [FLAGS.concertAppel], speaker: 'Tam', say: ['La place d\'Antoine ? Ah… Je l\'ai donnée à Louis, il en rêvait. Il fait la queue au Louvre, comme d\'habitude.'] },
  { ifFlags: [FLAGS.concertAppel], setFlag: FLAGS.placeTam, end: true },
  { speaker: 'Tam', say: ['L\'Opéra ouvre ce soir. J\'attends une amie.'] },
];
// Louis, le dernier maillon (Antoine → Tam → Louis) : il rend la place à Pierre.
export const LOUIS = [
  { ifFlags: [FLAGS.placeLouis], speaker: 'Louis', say: ['Bon concert ! Tu me raconteras.'], end: true },
  // Une ancienne partie où Clara avait déjà rendu la place (ou le concert passé) : rien à rendre.
  { ifItems: [ITEMS.placeConcert.id], speaker: 'Louis', say: ['Bon concert ! Tu me raconteras.'], end: true },
  { ifFlags: [FLAGS.concertParis], speaker: 'Louis', say: ['Alors, ce concert ? Raconte !'], end: true },
  {
    ifFlags: [FLAGS.placeTam],
    steps: [
      { speaker: 'Louis', say: ['Ta place ? Ah, c\'était la tienne ! Je l\'ai gardée bien au chaud, promis. Tiens, reprends-la.'] },
      { give: ITEMS.placeConcert, text: 'Louis te rend la place de concert.' },
      { speaker: 'Louis', say: ['Bercy, c\'est le grand dôme, en haut à gauche. Ça commence bientôt !'] },
      { setFlag: FLAGS.placeLouis },
    ],
    end: true,
  },
  { speaker: 'Louis', say: ['Deux heures de queue pour le Louvre. Mais ça vaut le coup, il paraît.'] },
];

// À Bercy : la place est contrôlée, Pierre avance dans la fosse, le chanteur chante (paroles écrites par Pierre).
// À la fin : « Un an plus tard… », Pierre ressort devant Bercy.
export const CONCERT = [
  { take: ITEMS.placeConcert.id },
  { say: ['Tu montres ta place à l\'entrée. La salle est pleine.'] },
  { goTo: [6, 9], facing: 'up' },
  { say: ['Le concert commence !'] },
  {
    speaker: 'Chanteur',
    say: [
      // Les paroles, telles que Pierre les a écrites.
      'J’garde le meilleur et j’ai tourné les pages, j’ai pas de rancoeur et j’oublie jamais rien,',
      'J’ai passé l’été sous la neige et l’hiver à la plage, tu ferais quoi à ma place ?',
      'Donc nique y a plus rien qui m’attache, c’est un jour la baie ou le Taj,',
      'Moi je voulais répondre à tes ssage-me, des fois je me perds dans des phases',
    ],
  },
  { cheer: CROWD },
  { say: ['Le concert se termine.'] },
  { say: ['Allez, faut que je rentre. Demain, grosse journée.'] },
  { setFlag: FLAGS.concertParis },
  { black: true },
  { wait: 700 },
  { say: ['Un an plus tard…'] },
  { travel: { map: 'paris', x: 9, y: 12, facing: 'down' } },
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

// Chez Hugues : le salon, la télé allumée, ses amis devant (Philippe, Nico et un autre ami). La finale France-Argentine,
// comme elle s'est jouée : 2-0 pour l'Argentine, la France revient à 2-2, 3-2 en prolongation, 3-3, puis les tirs au but
// perdus. Hugues et Thomas portent les réactions. À la fin : « Un an plus tard… », Pierre ressort devant chez Hugues.
const WATCHERS = ['hugues', 'philippe', 'nico', 'ami-match', 'thomas'];
export const MATCH = [
  { setFlag: FLAGS.matchArrivee },
  { speaker: 'Hugues', say: ['Les voilà ! Allez, posez tout, ça va commencer, j\'attends ce match depuis des semaines !'] },
  { take: ITEMS.platsMatch.id },
  { walk: 'thomas', to: [7, 5], block: true },
  { face: { thomas: 'up' } },
  { goTo: [6, 6], facing: 'up' },
  { say: ['Le match commence ! C\'est la finale : France-Argentine.'] },
  { speaker: 'Philippe', say: ['Allez les Bleus !'] },
  { speaker: 'Hugues', say: ['Contre l\'Argentine, ça se gagne, allez !'] },
  // 0-2
  { say: ['Penalty pour l\'Argentine… Messi le transforme. 1-0.'] },
  { emote: 'hugues', kind: 'dots' },
  { speaker: 'Hugues', say: ['Non, non, non… On n\'a pas encore touché un ballon !'] },
  { say: ['Contre éclair argentin… Di María, tout seul. 2-0.'] },
  { speaker: 'Thomas', say: ['Ça fait mal, là. Très mal.'] },
  { speaker: 'Hugues', say: ['Deschamps change deux joueurs avant la mi-temps ! C\'est la panique !'] },
  { say: ['À la mi-temps, le salon est silencieux.'] },
  { speaker: 'Nico', say: ['Quelqu\'un veut encore une part ?'] },
  { speaker: 'Hugues', say: ['Pas faim.'] },
  // 2-2
  { say: ['Quatre-vingtième minute. Penalty pour la France ! Mbappé… 2-1 !'] },
  { cheer: WATCHERS },
  { speaker: 'Hugues', say: ['IL Y A UN MATCH !'] },
  { say: ['Une minute plus tard, Mbappé reprend de volée… 2-2 !'] },
  { cheer: WATCHERS },
  { speaker: 'Thomas', say: ['Je le crois pas ! Deux buts en deux minutes !'] },
  { hop: 'hugues', times: 3 },
  // 3-2 en prolongation
  { say: ['Prolongation. Cent-huitième minute… Messi, encore lui. 3-2 pour l\'Argentine.'] },
  { emote: 'hugues', kind: 'dots' },
  { speaker: 'Hugues', say: ['Pas lui… Pas maintenant…'] },
  // 3-3
  { say: ['Cent-dix-huitième minute. Main dans la surface : penalty ! Mbappé… 3-3 !'] },
  { cheer: WATCHERS },
  { speaker: 'Thomas', say: ['Un triplé en finale ! Il n\'est pas humain !'] },
  { say: ['Dernière seconde : Kolo Muani, seul face au gardien… Arrêté !'] },
  { speaker: 'Hugues', say: ['NOOON ! Il l\'avait au bout du pied !'] },
  // Les tirs au but
  { say: ['Les tirs au but.'] },
  { speaker: 'Thomas', say: ['Je ne regarde pas. Dis-moi quand c\'est fini.'] },
  { say: ['Mbappé marque. Coman, arrêté. Tchouaméni, à côté…'] },
  { say: ['Montiel s\'avance… et marque. L\'Argentine est championne du monde.'] },
  { emote: 'hugues', kind: 'dots' },
  { speaker: 'Hugues', say: ['Non… c\'est pas possible…'] },
  { speaker: 'Thomas', say: ['On est passés si près… Bon. On les aura la prochaine fois. Allez, il reste à manger !'] },
  { say: ['On a perdu, mais c\'était une belle soirée pour le GOAT…'] },
  { setFlag: FLAGS.matchParis },
  { black: true },
  { wait: 700 },
  { say: ['Un an plus tard…'] },
  { travel: { map: 'paris', x: 8, y: 41, facing: 'down' } },
];

export const HUGUES_AFTER = ['Ces tirs au but… Je ne les ai toujours pas digérés. Reviens quand tu veux.'];

// ---------- 6. Le directeur ----------

// Le bureau du directeur : il est seul, assis à son fauteuil ; c'est Pierre qui va à lui (interiors.js
// entrepriseDirecteur). La belle place ; Pierre va à la baie vitrée et refuse ; le directeur se lève et le rejoint (la
// Liberté).
export const DIRECTOR_AFTER = ['La porte est ouverte, Pierre. Dans les deux sens.'];
const WINDOW = [7, 3];                                // devant la baie vitrée, en haut à droite
export const DIRECTOR = [
  { ifFlags: [FLAGS.liberteParis], speaker: 'Directeur', say: DIRECTOR_AFTER, end: true },
  {
    speaker: 'Directeur',
    say: [
      'Ah, Pierre. Ça fait un moment que je vous observe, et je dois dire que vous vous débrouillez vraiment bien.',
      'Il y a une belle place pour vous ici, vous savez.',
    ],
  },
  { emote: 'player', kind: 'dots' },
  { goTo: WINDOW, facing: 'up' },
  {
    speaker: 'Pierre',
    say: [
      'C\'est beau, d\'ici. On voit où tout le monde va.',
      'Mais moi, j\'ai passé ma vie à regarder par la fenêtre d\'une voiture, d\'un ferry, d\'un avion. Si je m\'assois derrière cette vitre, je crois que je vais oublier comment on part.',
    ],
  },
  { sit: { directeur: false } },                       // il se lève
  { approach: 'directeur' },
  {
    speaker: 'Directeur',
    say: [
      'Vous savez, moi aussi j\'ai regardé par cette fenêtre à votre âge. Et je me suis assis.',
      'Je ne vous dirai pas si j\'ai eu raison. Allez-y, Pierre. Et envoyez-moi une carte postale.',
    ],
  },
  { trait: TRAITS.liberte, quiet: true },
  { useTrait: TRAITS.liberte },
  { say: [carryText('paris')] },
  { say: ['Il est temps de sortir de cette tour.'] },
  { setFlag: FLAGS.liberteParis },
];

// ---------- 7. En sortant de la tour : le rêve ----------

// Le joueur garde la main une vingtaine de pas dans Paris (maps/paris.js, événement `walk`) ; puis Pierre s'arrête,
// l'écran se brouille, la ville s'estompe, la lumière change.
export const INTO_THE_DREAM = [
  { wait: 600 },
  { dream: 4500 },
  { setFlag: FLAGS.reveParis },
  { travel: { map: 'reve', x: 14, y: 10, facing: 'down' } },
];
