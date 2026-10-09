import { FLAGS, ITEMS, TRAITS } from './story.js';

// Scénario d'Amsterdam : le stage chez Corning, avec Romain en colocataire. Pas de vertu nouvelle (la 8e se gagne à
// Paris) : Autonomie sert au stage, Insouciance à la nuit au bord du canal.
//   1. L'arrivée : Romain appelle (téléphone) et donne rendez-vous à la maison commune.
//   2. La maison commune : Romain envoie Pierre chercher son bouquet de fleurs chez le marchand de fleurs.
//   3. Le marchand de fleurs : le vendeur parle un mélange de français et de néerlandais (« Ja » ou « Nee », sans conséquence).
//   4. Retour chez Romain : le bouquet donné, il envoie Pierre à son stage.
//   5. Corning : le patron confie une campagne pour le nouveau produit ; trois choix (cible, slogan, diffusion), le patron
//      encourage ou recadre, sans échec ; la présentation (Autonomie).
//   6. En sortant de Corning : « Quelques mois plus tard… » (la seule ellipse de la ville) ; la nuit tombe.
//   7. La nuit, au bord du canal, Romain (Insouciance) ; le billet pour New Delhi ; le souvenir du canal ; l'aéroport.
// Scénettes partagées par la carte et les intérieurs (étapes : voir MapScene.runSteps).

// Places sur la carte (voir maps/amsterdam.js) : le quai devant la péniche, où Romain attend la nuit.
export const CANAL_SPOT = [17, 12];

// ---------- 1. L'arrivée ----------

export const ARRIVAL = [
  { emote: 'player', kind: 'surprise' },
  { say: ['Ton téléphone sonne. C\'est Romain !'] },
  { speaker: 'Romain', phone: true, say: ['Pierre, t\'es arrivé ! Rejoins-moi à la maison, la deuxième en haut à gauche.'] },
  { setFlag: FLAGS.appelAmsterdam },
];

// ---------- 2. La maison commune ----------

// En entrant la première fois : Romain accueille Pierre et lui demande son bouquet de fleurs.
export const ROMAIN_WELCOME = [
  { approach: 'romain-maison' },
  {
    speaker: 'Romain',
    say: ['Installe-toi ! Tiens, d\'ailleurs, tu peux me rendre un service ? Va chercher mon bouquet de fleurs chez le marchand de fleurs, j\'ai la flemme d\'y retourner.'],
  },
  { setFlag: FLAGS.romainDemande },
];

// Romain dans la maison commune : il attend son bouquet, le reprend, puis envoie Pierre à son stage.
export const ROMAIN_HOME = [
  { ifFlags: [FLAGS.stageCorning], speaker: 'Romain', say: ['Alors, ce stage ? Le patron est content de toi, j\'en suis sûr.'], end: true },
  { ifFlags: [FLAGS.marchandiseDonnee], speaker: 'Romain', say: ['Ton stage, c\'est chez Corning, le grand manoir de la rue. Le patron t\'attend !'], end: true },
  {
    ifItems: [ITEMS.marchandise.id],
    steps: [
      { take: ITEMS.marchandise.id },
      { say: ['Tu donnes le bouquet de fleurs à Romain.'] },
      {
        speaker: 'Romain',
        say: [
          'Merci, t\'es un chef ! Je te revaudrai ça.',
          'Bon, maintenant, au boulot : ton stage chez Corning commence aujourd\'hui. C\'est le grand manoir de la rue. Le patron t\'attend !',
        ],
      },
      { setFlag: FLAGS.marchandiseDonnee },
    ],
    end: true,
  },
  { speaker: 'Romain', say: ['Le marchand de fleurs, c\'est de l\'autre côté du canal, la maison à gauche avec les fleurs. Passe le pont !'] },
];

// ---------- 3. Le marchand de fleurs ----------

export const VENDOR = [
  { ifItems: [ITEMS.marchandise.id], speaker: 'Vendeur', say: ['Doei ! Bonne journée, hè !'], end: true },
  { ifFlags: [FLAGS.marchandiseAchetee], speaker: 'Vendeur', say: ['Hallo ! Tu dis bonjour à Romain de ma part, ja ?'], end: true },
  { speaker: 'Vendeur', say: ['Hallo ! Tu viens pour le bouquet de Romain, ja ? Attends, je regarde dans le kast…'] },
  { speaker: 'Vendeur', say: ['Voilà, c\'est goed ! Dis-moi, tu es bien le coloc de Romain, ja of nee ?'] },
  {
    choose: 'Que réponds-tu ?',
    choices: [
      { label: 'Ja', steps: [{ speaker: 'Vendeur', say: ['Ha, parfait ! Alors tu lui dis : de volgende fois, il vient lui-même, hè !'] }] },
      { label: 'Nee', steps: [{ speaker: 'Vendeur', say: ['Nee ? Dan is deze niet voor jou ! Allez, je rigole. Tiens, prends-le quand même.'] }] },
    ],
  },
  { give: ITEMS.marchandise, text: 'Tu reçois le bouquet de fleurs de Romain.' },
  { setFlag: FLAGS.marchandiseAchetee },
];

// ---------- 5. Corning : la campagne ----------

const PATRON = 'Patron';
// Une étape de la campagne : la question, puis la réaction du patron à chaque choix (aucun ne bloque).
const step = (question, choices) => ({
  speaker: PATRON,
  choose: question,
  choices: choices.map(([label, reply]) => ({ label, steps: [{ speaker: PATRON, say: reply }] })),
});
export const CAMPAIGN = [
  { ifFlags: [FLAGS.stageCorning], speaker: PATRON, say: ['Continue comme ça, Pierre. L\'équipe parle encore de ta démonstration.'], end: true },
  {
    speaker: PATRON,
    say: [
      'Bienvenue chez Corning ! Pour ton premier jour, je te confie une vraie mission : prépare-moi une campagne pour notre nouveau produit.',
      'Un verre pour écrans de téléphone. Presque incassable. À toi de le faire connaître.',
    ],
  },
  step('D\'abord, la cible. À qui on le vend ?', [
    ['Aux fabricants de téléphones', ['Exactement. Ce sont eux qui achètent le verre. Bon instinct.']],
    ['Aux grands-mères', ['Ha ! Elles cassent leur écran aussi, c\'est vrai. Mais ce sont les fabricants qui achètent. On part sur eux.']],
    ['À tout le monde', ['Tout le monde, c\'est personne. On vise les fabricants de téléphones, d\'accord ?']],
  ]),
  step('Ensuite, le slogan.', [
    ['Lâchez-le. Il tiendra.', ['Court, et ça donne envie d\'essayer. J\'adore.']],
    ['Le verre qui ne casse pas.', ['Clair. Un peu sage, mais clair. On le garde.']],
    ['Du verre, mais en mieux.', ['Mmh… « en mieux », ça ne dit pas en quoi. On garde l\'idée, on retravaillera la phrase.']],
  ]),
  step('Et pour le diffuser ?', [
    ['Une vidéo de chute en ligne', ['Une vidéo où le téléphone tombe et l\'écran tient ? Ça, ça se partage.']],
    ['Un salon professionnel', ['Les fabricants y sont tous, c\'est vrai. Solide.']],
    ['Des affiches dans le métro', ['Joli, mais les fabricants ne prennent pas le métro pour choisir leur verre. On ajoutera une vidéo.']],
  ]),
  { say: ['Tu rassembles tout sur trois pages, sans demander d\'aide à personne.'] },
  { useTrait: TRAITS.autonomie },
  { say: ['Devant toute l\'équipe, tu présentes ta campagne… et tu lâches ton propre téléphone par terre. L\'écran tient.'] },
  { speaker: PATRON, say: ['Pas mal du tout pour un premier jour ! Tu as l\'instinct du marketing, toi.'] },
  { setFlag: FLAGS.stageCorning },
];

// ---------- 6. Quelques mois plus tard ----------

// En sortant de Corning, la campagne présentée : l'ellipse ; la nuit tombe sur Amsterdam, Romain attend au canal.
export const MONTHS_LATER = [
  { black: true },
  { wait: 800 },
  { say: ['Quelques mois plus tard…'] },
  { setFlag: FLAGS.moisAmsterdam },
  { black: false },
];

// ---------- 7. La nuit au bord du canal ----------

// Le souvenir du canal (carnet).
const PHOTO = { id: 'souvenir-canal', name: 'Photo du canal' };
export const CANAL_NIGHT = [
  { say: ['Romain est assis au bord du quai, les jambes au-dessus de l\'eau. Les lumières des péniches tremblent sur le canal.'] },
  // Pierre s'assoit à côté de Romain : tous les deux regardent le canal.
  { goTo: [CANAL_SPOT[0] - 1, CANAL_SPOT[1]], facing: 'down' },
  { face: { player: 'down', 'romain-canal': 'down' } },
  { speaker: 'Romain', say: ['Viens t\'asseoir deux minutes. Regarde-moi ça.'] },
  { speaker: 'Romain', say: ['Y a six mois, t\'étais à l\'autre bout du monde, à Hanoï. Et nous à Bordeaux. Et là, on est posés ensemble à Amsterdam.'] },
  { speaker: 'Romain', say: ['Profite, va. Demain c\'est encore le stage, mais là, maintenant, on est bien.'] },
  { useTrait: TRAITS.insouciance },
  { say: ['Tu oublies le stage de demain. Il y a juste l\'eau, les lumières, et Romain qui rigole.'] },
  { speaker: 'Romain', say: ['Attends, bouge pas.'] },
  { say: ['Romain sort son téléphone et vous prend en photo, tous les deux, devant le canal.'] },
  { souvenir: PHOTO },
  { speaker: 'Romain', say: ['Au fait, j\'ai une nouvelle pour toi. Ton prochain échange, c\'est à New Delhi, en Inde ! Tiens, voilà ton billet d\'avion.'] },
  { give: ITEMS.billetNewDelhi, text: 'Romain te donne ton billet d\'avion pour New Delhi.' },
  { say: ['Une ville de plus. Et à chaque fois, des gens que je quitte. Je me demande ce qu\'ils deviennent, tous.'] },
  { black: true },
  { wait: 700 },
  { setFlag: FLAGS.canalNuit },
  { say: ['Le lendemain, ton billet en poche, tu prends la route de l\'aéroport.'] },
  { travel: { map: 'airport', x: 10, y: 12, facing: 'up' } },
];
