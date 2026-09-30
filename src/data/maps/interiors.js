import { parseGrid } from './parseGrid.js';
import { FLAGS, ITEMS } from '../story.js';

// Ascenseur de l'entreprise parisienne (mêmes cases, en haut à droite, à chaque étage).
const floor = (interior) => ({ interior, x: 11, y: 1, facing: 'down' });
const ELEVATOR = [11, 12].map((x) => ({
  x,
  y: 0,
  ask: {
    question: 'Ascenseur : quel étage ?',
    choices: [
      { label: 'Rez-de-chaussée', warp: floor('entreprise') },
      { label: '1er étage (manager)', warp: floor('entrepriseManager') },
      { label: 'Dernier étage (directeur)', ifFlags: [FLAGS.verreBistro], warp: floor('entrepriseDirecteur') },
      {
        label: 'Dernier étage (directeur)',
        unlessFlags: [FLAGS.verreBistro],
        dialogue: ["[Texte provisoire] Le bouton du dernier étage ne répond pas : l'accès est bloqué pour l'instant."],
      },
      { label: 'Rester ici' },
    ],
  },
}));

// La famille quitte la maison de Fort-de-France une fois partie en bateau.
const HOME_FDF = { unlessFlags: [FLAGS.departFortDeFrance] };

// Intérieurs des bâtiments. `spawn` = position d'arrivée (juste au-dessus du tapis).
export const interiors = {
  // Fort-de-France — la maison familiale, façon Rouge Feu (`frlg`, voir art/frlgArt.js) : mur de deux
  // rangées en haut, meubles des planches (`decor`, cases 'm' bloquantes), télé au mur ; escalier dessiné
  // dans le code. Textes provisoires, à réécrire.
  ffHouse: {
    name: 'Maison familiale',
    frlg: true,
    // Étagère, vitrine, télé murale, fenêtre, cuisine, frigo et escalier contre le mur ; table ; plantes.
    grid: parseGrid([
      'XXXXXXXXXXX',
      'XXXXXXXXXXX',
      'mmmoooommmη',
      'ooooooooooo',
      'mooommmmooo',
      'mooommmmooo',
      'oooooooooom',
      'ooooEEoooom',
    ]),
    decor: [
      { kind: 'blueShelf', x: 0, y: 1 },
      { kind: 'glassCabinet', x: 1, y: 1 },
      { kind: 'tv', x: 3, y: 0 },
      { kind: 'window', x: 5, y: 0 },
      { kind: 'kitchen', x: 7, y: 1 },
      { kind: 'fridge', x: 9, y: 1 },
      { kind: 'plant', x: 0, y: 4 },
      { kind: 'table', x: 4, y: 4 },
      { kind: 'plant', x: 10, y: 6 },
    ],
    spawn: { x: 4, y: 6, facing: 'up' },
    triggers: [
      { x: 10, y: 2, warp: { interior: 'ffHouseUp', x: 8, y: 3, facing: 'down' } },
    ],
    objects: [
      ...[3, 4].map((x) => ({ x, y: 1, dialogue: ['[Texte provisoire] La télé. Un vieux jeu est encore branché sur la console…'] })),
      { x: 9, y: 2, dialogue: ['[Texte provisoire] Le frigo est plein de fruits de la Martinique.'] },
    ],
    npcs: [
      {
        id: 'maman', name: 'Maman', x: 7, y: 3, facing: 'down', color: 0xe86fa0,
        ...HOME_FDF,
        dialogue: [
          '[Maman - texte provisoire] Bonjour ! Ceci est le premier dialogue de Maman.',
          'Deuxième page du dialogue de Maman.',
        ],
        after: ['[Maman - texte provisoire] Dialogue une fois le souvenir obtenu.'],
        souvenir: { id: 'souvenir-maman', name: 'Souvenir de Maman' },
      },
      {
        id: 'papa', name: 'Papa', x: 9, y: 5, facing: 'left', color: 0x3f6fd8,
        ...HOME_FDF,
        dialogue: [
          '[Papa - texte provisoire] Salut ! Ceci est le premier dialogue de Papa.',
          'Deuxième page du dialogue de Papa.',
        ],
        after: ['[Papa - texte provisoire] Dialogue une fois le souvenir obtenu.'],
        souvenir: { id: 'souvenir-papa', name: 'Souvenir de Papa' },
      },
      {
        id: 'manon', name: 'Manon', x: 2, y: 6, facing: 'up', color: 0xf0a030,
        ...HOME_FDF,
        dialogue: [
          '[Manon - texte provisoire] Coucou ! Ceci est le premier dialogue de Manon.',
          'Deuxième page du dialogue de Manon.',
        ],
        after: ['[Manon - texte provisoire] Dialogue une fois le souvenir obtenu.'],
        souvenir: { id: 'souvenir-manon', name: 'Souvenir de Manon' },
      },
    ],
  },

  // Fort-de-France — la chambre de Pierre, à l'étage (invisible de l'extérieur), façon Rouge Feu :
  // lit (dessiné dans le code), bureau au globe, ordinateur, bibliothèque, fenêtre, plantes. Escalier : ξ.
  ffHouseUp: {
    name: 'Chambre de Pierre',
    frlg: true,
    grid: parseGrid([
      'XXXXXXXXX',
      'XXXXXXXXX',
      'Lmmommooξ',
      'Loooooooo',
      'mooooooom',
      'mooooooom',
    ]),
    decor: [
      { kind: 'desk', x: 1, y: 1 },
      { kind: 'computer', x: 2, y: 1 },
      { kind: 'bookshelf', x: 4, y: 0 },
      { kind: 'window', x: 6, y: 0 },
      { kind: 'painting', x: 3, y: 0 },
      { kind: 'plant', x: 0, y: 4 },
      { kind: 'plant', x: 8, y: 4 },
    ],
    spawn: { x: 8, y: 3, facing: 'down' },
    triggers: [
      { x: 8, y: 2, warp: { interior: 'ffHouse', x: 10, y: 3, facing: 'down' } },
    ],
    objects: [
      { x: 0, y: 2, dialogue: ['[Texte provisoire] Ton lit. Il est tout juste fait.'] },
      { x: 1, y: 2, dialogue: ['[Texte provisoire] Ton bureau, avec ton globe et tes cartes du monde.'] },
      { x: 2, y: 2, dialogue: ["[Texte provisoire] Ton ordinateur. Pas le temps de jouer, l'aventure t'attend !"] },
    ],
  },

  // Fort-de-France — la cabane de pêche de Papa, façon Rouge Feu : cannes, caisses de poissons (dessinées
  // dans le code), fenêtre, panneau, plante.
  ffHut: {
    name: 'Cabane de pêche',
    frlg: true,
    grid: parseGrid([
      'XXXXXXX',
      'XXXXXXX',
      'ψψoχχoo',
      'oooooom',
      'χooooom',
      'oooEooo',
    ]),
    decor: [
      { kind: 'window', x: 1, y: 0 },
      { kind: 'notice', x: 4, y: 0 },
      { kind: 'plant', x: 6, y: 3 },
    ],
    spawn: { x: 3, y: 4, facing: 'up' },
    objects: [
      { x: 0, y: 2, dialogue: ['[Texte provisoire] Les cannes à pêche de Papa, bien alignées.'] },
      { x: 1, y: 2, dialogue: ['[Texte provisoire] Les cannes à pêche de Papa, bien alignées.'] },
      { x: 3, y: 2, dialogue: ['[Texte provisoire] Des poissons pêchés ce matin. Ça sent la mer !'] },
      { x: 4, y: 2, dialogue: ['[Texte provisoire] Des poissons pêchés ce matin. Ça sent la mer !'] },
    ],
  },

  // Saint-Ay — maison de gauche : Papa et Manon t'attendent et te demandent de les suivre.
  playerHouse: {
    name: 'Maison de gauche',
    grid: parseGrid([
      'XXXXXXXXXX',
      'XmmoooommX',
      'XooooooooX',
      'XooommoooX',
      'XooommoooX',
      'XooooooooX',
      'XoooEEoooX',
      'XXXXXXXXXX',
    ]),
    spawn: { x: 4, y: 5, facing: 'up' },
    npcs: [
      {
        id: 'papa', name: 'Papa', x: 3, y: 4, facing: 'down', color: 0x3f6fd8,
        unlessFlags: [FLAGS.familleSuit],
        dialogue: ['[Papa - texte provisoire] Suis-nous !'],
      },
      {
        id: 'manon', name: 'Manon', x: 6, y: 4, facing: 'down', color: 0xf0a030,
        unlessFlags: [FLAGS.familleSuit],
        dialogue: ['[Manon - texte provisoire] Suis-nous !'],
      },
    ],
    // En entrant : ils te parlent puis te suivent jusqu'à l'hôpital.
    events: [
      {
        on: 'enter',
        unlessFlags: [FLAGS.familleSuit],
        steps: [
          { speaker: 'Papa', say: ['[Papa - texte provisoire] Te voilà enfin !', 'Maman est à l\'hôpital. Suis-nous !'] },
          { speaker: 'Manon', say: ['[Manon - texte provisoire] Vite, viens avec nous !'] },
          { setFlag: FLAGS.familleSuit },
        ],
      },
    ],
  },

  // Saint-Ay — maison 2 : Felix et sa famille, qui viennent d'emménager.
  felixHouse: {
    name: 'Maison de Felix',
    grid: parseGrid([
      'XXXXXXXXXX',
      'XmooooommX',
      'XmoooooooX',
      'XooooooooX',
      'XoommmoooX',
      'XooooooooX',
      'XoooEEoooX',
      'XXXXXXXXXX',
    ]),
    spawn: { x: 5, y: 5, facing: 'up' },
    npcs: [
      {
        id: 'felix-maison', name: 'Felix', x: 2, y: 5, facing: 'right', color: 0x9060d0,
        ifFlags: [FLAGS.maisonFelixVisitee],
        dialogue: ['[Felix - texte provisoire] Bienvenue chez nous ! Va dire bonjour à tout le monde.'],
      },
      {
        id: 'val', name: 'Val', x: 2, y: 2, facing: 'right', color: 0x5cb85c,
        ifFlags: [FLAGS.felixInvite],
        dialogue: ['[Val - texte provisoire] Bonjour ! Ceci est le premier dialogue de Val.'],
        after: ['[Val - texte provisoire] Dialogue une fois le souvenir obtenu.'],
        souvenir: { id: 'souvenir-val', name: 'Souvenir de Val' },
      },
      {
        id: 'joshua', name: 'Joshua', x: 6, y: 2, facing: 'down', color: 0x20a0c0,
        ifFlags: [FLAGS.felixInvite],
        dialogue: ['[Joshua - texte provisoire] Salut ! Ceci est le premier dialogue de Joshua.'],
        after: ['[Joshua - texte provisoire] Dialogue une fois le souvenir obtenu.'],
        souvenir: { id: 'souvenir-joshua', name: 'Souvenir de Joshua' },
      },
      {
        id: 'yanis', name: 'Yanis', x: 7, y: 4, facing: 'left', color: 0xc0b040,
        ifFlags: [FLAGS.felixInvite],
        dialogue: ['[Yanis - texte provisoire] Coucou ! Ceci est le premier dialogue de Yanis.'],
        after: ['[Yanis - texte provisoire] Dialogue une fois le souvenir obtenu.'],
        souvenir: { id: 'souvenir-yanis', name: 'Souvenir de Yanis' },
      },
    ],
    // Felix, qui te suivait, arrive avec toi et t'accueille.
    events: [
      {
        on: 'enter',
        unlessFlags: [FLAGS.maisonFelixVisitee],
        steps: [{ setFlag: FLAGS.maisonFelixVisitee }, { talk: 'felix-maison' }],
      },
    ],
  },

  // Saint-Ay — l'hôpital (ancien labo). Maman et Fanny y sont ; Papa et Manon arrivent avec toi.
  hospital: {
    name: 'Hôpital',
    grid: parseGrid([
      'XXXXXXXXXXXXXX',
      'XLoLoLooLoLoLX', // lits
      'XooooooooooooX',
      'XooooooooooooX',
      'XooooooooooooX',
      'XooommmmmmoooX', // accueil
      'XooooooooooooX',
      'XooooooooooooX',
      'XooooooooooooX',
      'XooooooEEooooX',
      'XXXXXXXXXXXXXX',
    ]),
    spawn: { x: 7, y: 8, facing: 'up' },
    npcs: [
      {
        id: 'maman-hopital', name: 'Maman', x: 3, y: 2, facing: 'down', color: 0xe86fa0,
        ifFlags: [FLAGS.familleArrivee],
        unlessFlags: [FLAGS.arriveeMontepilloy],
        dialogue: ['[Maman - texte provisoire] Te voilà ! Je suis contente de te voir.'],
      },
      {
        id: 'fanny', name: 'Fanny', x: 10, y: 1, facing: 'down', color: 0x40b0a0, // dans un lit
        ifFlags: [FLAGS.familleArrivee],
        dialogue: [
          '[Fanny - texte provisoire] Bonjour ! Ceci est le premier dialogue de Fanny.',
          'Deuxième page du dialogue de Fanny.',
        ],
        after: ['[Fanny - texte provisoire] Dialogue une fois le souvenir obtenu.'],
        souvenir: { id: 'souvenir-fanny', name: 'Souvenir de Fanny' },
      },
      {
        id: 'papa-hopital', name: 'Papa', x: 6, y: 7, facing: 'right', color: 0x3f6fd8,
        ifFlags: [FLAGS.familleArrivee],
        unlessFlags: [FLAGS.arriveeMontepilloy],
        dialogue: ['[Papa - texte provisoire] Va parler à Fanny.'],
      },
      {
        id: 'manon-hopital', name: 'Manon', x: 9, y: 7, facing: 'left', color: 0xf0a030,
        ifFlags: [FLAGS.familleArrivee],
        unlessFlags: [FLAGS.arriveeMontepilloy],
        dialogue: ['[Manon - texte provisoire] Maman va mieux ?'],
      },
    ],
    events: [
      {
        on: 'enter',
        ifFlags: [FLAGS.familleSuit],
        unlessFlags: [FLAGS.familleArrivee],
        steps: [
          { setFlag: FLAGS.familleArrivee },
          { speaker: 'Papa', say: ['[Papa - texte provisoire] Nous y sommes. Maman est là-bas.'] },
        ],
      },
    ],
  },

  // Montépilloy — la maison de la famille : Maman annonce le premier jour d'école.
  montHouse: {
    name: 'Maison de Montépilloy',
    grid: parseGrid([
      'XXXXXXXXXX',
      'XmmoooommX',
      'XooooooooX',
      'XoommooooX',
      'XoommooooX',
      'XooooooooX',
      'XoooEEoooX',
      'XXXXXXXXXX',
    ]),
    spawn: { x: 4, y: 5, facing: 'up' },
    npcs: [
      {
        id: 'maman-mont', name: 'Maman', x: 6, y: 3, facing: 'left', color: 0xe86fa0,
        dialogue: ["[Maman - texte provisoire] Dépêche-toi, tu vas être en retard à l'école !"],
      },
      // Jean, ton frère : deux quêtes avant de partir pour le Prytanée.
      {
        id: 'jean', name: 'Jean', x: 2, y: 5, facing: 'right', color: 0x3c7c5c,
        unlessFlags: [FLAGS.tracteurRepare],
        dialogue: [
          "[Jean - texte provisoire] Salut frérot ! J'ai besoin de toi pour deux choses.",
          "Notre chat s'est encore sauvé : il doit être perché dans un arbre de la prairie, au sud.",
          "Et M. Bouly, à la ferme, a des soucis avec son tracteur. Tu peux aller l'aider ?",
        ],
        after: ['[Jean - texte provisoire] Alors, tu as retrouvé le chat ? Et le tracteur de M. Bouly ?'],
        setFlag: FLAGS.jeanQuetes,
      },
      {
        id: 'jean-fin', name: 'Jean', x: 2, y: 5, facing: 'right', color: 0x3c7c5c,
        ifFlags: [FLAGS.tracteurRepare],
        dialogue: ['[Jean - texte provisoire] Le tracteur de M. Bouly est réparé ? Génial !'],
      },
      {
        id: 'manon', name: 'Manon', x: 7, y: 4, facing: 'left', color: 0xf0a030,
        unlessFlags: [FLAGS.manonEcole],
        dialogue: ["[Manon - texte provisoire] On va à l'école ensemble ?"],
      },
    ],
    // En entrant : Maman annonce le premier jour d'école, Manon t'accompagne.
    events: [
      {
        on: 'enter',
        unlessFlags: [FLAGS.manonEcole],
        steps: [
          { speaker: 'Maman', say: ["[Maman - texte provisoire] Te voilà ! Aujourd'hui, c'est ton premier jour d'école.", 'Il faut y aller !'] },
          { speaker: 'Manon', say: ["[Manon - texte provisoire] Je t'accompagne, suis-moi !"] },
          { setFlag: FLAGS.manonEcole },
        ],
      },
    ],
  },

  // Montépilloy — l'école : Margot, Étienne et Benoît.
  school: {
    name: 'École',
    grid: parseGrid([
      'XXXXXNNNNXXXXX', // tableau noir
      'XooooooooooooX',
      'XooooommoooooX', // bureau du maître
      'XooooooooooooX',
      'XomoomoomoomoX', // pupitres
      'XooooooooooooX',
      'XomoomoomoomoX',
      'XooooooooooooX',
      'XooooooooooooX',
      'XooooooEEooooX',
      'XXXXXXXXXXXXXX',
    ]),
    spawn: { x: 7, y: 8, facing: 'up' },
    npcs: [
      {
        id: 'manon-ecole', name: 'Manon', x: 8, y: 8, facing: 'left', color: 0xf0a030,
        ifFlags: [FLAGS.arriveeEcole],
        dialogue: ['[Manon - texte provisoire] Va dire bonjour à tout le monde !'],
      },
      {
        id: 'margot', name: 'Margot', x: 4, y: 3, facing: 'down', color: 0xf08080,
        dialogue: ['[Margot - texte provisoire] Bonjour ! Ceci est le premier dialogue de Margot.'],
        after: ['[Margot - texte provisoire] Dialogue une fois le souvenir obtenu.'],
        souvenir: { id: 'souvenir-margot', name: 'Souvenir de Margot' },
      },
      {
        id: 'etienne', name: 'Étienne', x: 9, y: 5, facing: 'left', color: 0x6080a0,
        dialogue: ["[Étienne - texte provisoire] Salut ! Ceci est le premier dialogue d'Étienne."],
        after: ['[Étienne - texte provisoire] Dialogue une fois le souvenir obtenu.'],
        souvenir: { id: 'souvenir-etienne', name: "Souvenir d'Étienne" },
      },
      {
        id: 'benoit', name: 'Benoît', x: 6, y: 7, facing: 'up', color: 0xa07040,
        dialogue: ['[Benoît - texte provisoire] Coucou ! Ceci est le premier dialogue de Benoît.'],
        after: ['[Benoît - texte provisoire] Dialogue une fois le souvenir obtenu.'],
        souvenir: { id: 'souvenir-benoit', name: 'Souvenir de Benoît' },
      },
    ],
    events: [
      {
        on: 'enter',
        ifFlags: [FLAGS.manonEcole],
        unlessFlags: [FLAGS.arriveeEcole],
        steps: [
          { setFlag: FLAGS.arriveeEcole },
          { speaker: 'Manon', say: ["[Manon - texte provisoire] Voilà l'école ! Va rencontrer les autres élèves."] },
        ],
      },
    ],
  },

  // Prytanée — bâtiment 1 : ton dortoir. Tanguy et Geoffrey y sont.
  dortoir: {
    name: 'Dortoir',
    grid: parseGrid([
      'XXXXXXXXXXXXXX',
      'XLLoLLooLLoLLX', // lits
      'XooooooooooooX',
      'XooooooooooooX',
      'XLLoLLooLLoLLX',
      'XooooooooooooX',
      'XmoooooooooomX', // casiers
      'XooooooEEooooX',
      'XXXXXXXXXXXXXX',
    ]),
    spawn: { x: 7, y: 6, facing: 'up' },
    npcs: [
      {
        id: 'tanguy', name: 'Tanguy', x: 3, y: 2, facing: 'down', color: 0x8c6c3c,
        dialogue: ['[Tanguy - texte provisoire] Salut ! Ceci est le premier dialogue de Tanguy.'],
        after: ['[Tanguy - texte provisoire] Dialogue une fois le souvenir obtenu.'],
        souvenir: { id: 'souvenir-tanguy', name: 'Souvenir de Tanguy' },
      },
      {
        id: 'geoffrey', name: 'Geoffrey', x: 10, y: 5, facing: 'left', color: 0x4c7cb0,
        dialogue: ['[Geoffrey - texte provisoire] Bonjour ! Ceci est le premier dialogue de Geoffrey.'],
        after: ['[Geoffrey - texte provisoire] Dialogue une fois le souvenir obtenu.'],
        souvenir: { id: 'souvenir-geoffrey', name: 'Souvenir de Geoffrey' },
      },
    ],
    events: [
      {
        on: 'enter',
        unlessFlags: [FLAGS.dortoirVisite],
        steps: [{ say: ["Tu déposes tes affaires au pied de ton lit."] }, { setFlag: FLAGS.dortoirVisite }],
      },
    ],
  },

  // Prytanée — bâtiment 2 : la salle de cours. Le professeur te remet ton baccalauréat.
  salleCours: {
    name: 'Salle de cours',
    grid: parseGrid([
      'XXXXXNNNNXXXXX', // tableau
      'XooooooooooooX',
      'XooooommoooooX', // bureau de l'instructeur
      'XooooooooooooX',
      'XomoomoomoomoX', // tables
      'XooooooooooooX',
      'XomoomoomoomoX',
      'XooooooooooooX',
      'XooooooooooooX',
      'XooooooEEooooX',
      'XXXXXXXXXXXXXX',
    ]),
    spawn: { x: 7, y: 8, facing: 'up' },
    npcs: [
      {
        id: 'professeur', name: 'Professeur', x: 7, y: 1, facing: 'down', color: 0x6c4c8c,
        dialogue: [
          '[Professeur - texte provisoire] Te voilà ! Félicitations, tu as réussi tes examens.',
          'Voici ton baccalauréat. Il t\'ouvre les portes de la suite : Bordeaux !',
        ],
        after: ['[Professeur - texte provisoire] Le portail nord du Prytanée mène à Bordeaux. Bonne route !'],
        item: ITEMS.baccalaureat,
      },
    ],
  },

  // Bordeaux — l'agence immobilière : l'agent te remet les clés de l'appartement.
  agence: {
    name: 'Agence immobilière',
    grid: parseGrid([
      'XXXXXXXXXX',
      'XmmoooommX',
      'XoommmoooX', // bureau
      'XooooooooX',
      'XooooooooX',
      'XooooooooX',
      'XoooEEoooX',
      'XXXXXXXXXX',
    ]),
    spawn: { x: 4, y: 5, facing: 'up' },
    npcs: [
      {
        id: 'agent', name: 'Agent immobilier', x: 4, y: 3, facing: 'down', color: 0x3c4c6c,
        dialogue: [
          "[Agent - texte provisoire] Bonjour ! Vous venez pour l'appartement ?",
          "Voici vos clés. C'est l'immeuble juste à gauche de l'agence.",
        ],
        after: ["[Agent - texte provisoire] Votre immeuble est juste à gauche de l'agence."],
        item: ITEMS.clesAppartement,
      },
    ],
  },

  // Bordeaux — ton appartement : tu poses tes affaires et rencontres Ousmane, ton colocataire.
  appartement: {
    name: 'Appartement',
    grid: parseGrid([
      'XXXXXXXXXX',
      'XLooommoLX', // deux lits, table
      'XooooooooX',
      'XooooooooX',
      'XmoooooomX',
      'XooooooooX',
      'XoooEEoooX',
      'XXXXXXXXXX',
    ]),
    spawn: { x: 4, y: 5, facing: 'up' },
    npcs: [
      {
        id: 'ousmane', name: 'Ousmane', x: 6, y: 3, facing: 'left', color: 0x2c8c5c,
        dialogue: [
          "[Ousmane - texte provisoire] Salut ! Moi c'est Ousmane, ton colocataire.",
          'Bienvenue à Bordeaux !',
        ],
        after: ['[Ousmane - texte provisoire] Dialogue une fois le souvenir obtenu.'],
        souvenir: { id: 'souvenir-ousmane', name: "Souvenir d'Ousmane" },
      },
    ],
    events: [
      {
        on: 'enter',
        unlessFlags: [FLAGS.appartementVisite],
        steps: [
          { say: ['Tu poses tes affaires dans ta chambre.'] },
          { setFlag: FLAGS.appartementVisite },
          { talk: 'ousmane' },
        ],
      },
    ],
  },

  // Bordeaux — l'école KEDGE : on t'y remet ton diplôme d'anglais.
  kedge: {
    name: 'KEDGE',
    grid: parseGrid([
      'XXXXXXXXXXXXXX',
      'XmmoooooooommX',
      'XooooommmooooX', // accueil
      'XooooooooooooX',
      'XooooooooooooX',
      'XmoooooooooomX',
      'XooooooooooooX',
      'XmoooooooooomX',
      'XooooooooooooX',
      'XooooooEEooooX',
      'XXXXXXXXXXXXXX',
    ]),
    spawn: { x: 7, y: 8, facing: 'up' },
    npcs: [
      {
        id: 'prof-anglais', name: "Professeure d'anglais", x: 7, y: 3, facing: 'down', color: 0xb04c6c,
        dialogue: [
          "[Professeure - texte provisoire] Bienvenue à KEDGE !",
          "Voici ton diplôme d'anglais. Il te permettra d'aller plus loin.",
        ],
        after: ["[Professeure - texte provisoire] Avec ce diplôme, la route vers l'est t'est ouverte."],
        item: ITEMS.diplomeAnglais,
      },
    ],
  },

  // Hull — l'université : un professeur te remet ton diplôme.
  hullUniversity: {
    name: 'Université de Hull',
    grid: parseGrid([
      'XXXXXNNNNXXXXX', // tableau
      'XmmoooooooommX',
      'XooooommmooooX', // bureau du professeur
      'XooooooooooooX',
      'XomoomoomoomoX', // tables
      'XooooooooooooX',
      'XomoomoomoomoX',
      'XooooooooooooX',
      'XooooooooooooX',
      'XooooooEEooooX',
      'XXXXXXXXXXXXXX',
    ]),
    spawn: { x: 7, y: 8, facing: 'up' },
    npcs: [
      {
        id: 'prof-hull', name: 'Professor', x: 7, y: 3, facing: 'down', color: 0x5c3c7c,
        dialogue: [
          '[Professor - texte provisoire] Welcome to Hull! Bienvenue à l\'université.',
          'Congratulations! Voici ton diplôme.',
        ],
        after: ['[Professor - texte provisoire] Well done! La route vers l\'est t\'est ouverte.'],
        item: ITEMS.diplomeHull,
        unlessFlags: [FLAGS.mailLu],
      },
      // De retour après le mail d'Amsterdam : ta nouvelle affectation.
      {
        id: 'prof-hull-echange', name: 'Professor', x: 7, y: 3, facing: 'down', color: 0x5c3c7c,
        ifFlags: [FLAGS.mailLu],
        dialogue: [
          '[Professor - texte provisoire] Welcome back! Voici ta nouvelle affectation :',
          'un échange universitaire à New Delhi, en Inde. Voici ton billet d\'avion !',
          "Le bus rouge devant l'université t'emmènera à l'aéroport.",
        ],
        after: ["[Professor - texte provisoire] Prends le bus rouge pour l'aéroport. Good luck!"],
        item: ITEMS.billetNewDelhi,
      },
    ],
  },

  // Hull — maison à la porte rouge (en haut) : Romain et Paul.
  hullHouse: {
    name: 'Maison de Romain et Paul',
    grid: parseGrid([
      'XXXXXXXXXX',
      'XmmoooommX',
      'XooooooooX',
      'XooommoooX',
      'XooommoooX',
      'XooooooooX',
      'XoooEEoooX',
      'XXXXXXXXXX',
    ]),
    spawn: { x: 4, y: 5, facing: 'up' },
    npcs: [
      {
        id: 'romain', name: 'Romain', x: 2, y: 3, facing: 'right', color: 0xc0602c,
        dialogue: ['[Romain - texte provisoire] Salut ! Ceci est le premier dialogue de Romain.'],
        after: ['[Romain - texte provisoire] Dialogue une fois le souvenir obtenu.'],
        souvenir: { id: 'souvenir-romain', name: 'Souvenir de Romain' },
      },
      {
        id: 'paul', name: 'Paul', x: 7, y: 3, facing: 'left', color: 0x3c8cb0,
        dialogue: ['[Paul - texte provisoire] Hello ! Ceci est le premier dialogue de Paul.'],
        after: ['[Paul - texte provisoire] Dialogue une fois le souvenir obtenu.'],
        souvenir: { id: 'souvenir-paul', name: 'Souvenir de Paul' },
      },
    ],
  },

  // Hanoï — ta maison (maison-tube rose, 2e en haut à gauche).
  hanoiHome: {
    name: 'Ta maison à Hanoï',
    grid: parseGrid([
      'XXXXXXXXXX',
      'XLooommooX', // lit, table basse
      'XooooooooX',
      'XmoooooomX',
      'XooooooooX',
      'XooooooooX',
      'XoooEEoooX',
      'XXXXXXXXXX',
    ]),
    spawn: { x: 4, y: 5, facing: 'up' },
    events: [
      {
        on: 'enter',
        unlessFlags: [FLAGS.travailEtape1],
        steps: [{ say: ["[Texte provisoire] Ta nouvelle maison à Hanoï. Demain, tu commences ton nouveau travail à l'agence de voyage !"] }],
      },
    ],
  },

  // Hanoï — l'agence de voyage : ton nouveau travail commence (étape 1).
  travelAgency: {
    name: 'Agence de voyage',
    grid: parseGrid([
      'XXXXXXXXXXXX',
      'XmmoooooommX',
      'XooommmmoooX', // comptoir
      'XooooooooooX',
      'XmoooooooomX',
      'XooooooooooX',
      'XooooEEooooX',
      'XXXXXXXXXXXX',
    ]),
    spawn: { x: 5, y: 5, facing: 'up' },
    npcs: [
      {
        id: 'patron-agence', name: 'Directrice', x: 5, y: 3, facing: 'down', color: 0xc83c5c,
        unlessFlags: [FLAGS.visiteTerminee],
        dialogue: [
          "[Directrice - texte provisoire] Bienvenue dans l'équipe de l'agence !",
          "C'est ton premier jour : voici l'étape 1 de ton nouveau travail.",
        ],
        after: ['[Directrice - texte provisoire] Bon courage pour ton premier jour !'],
        setFlag: FLAGS.travailEtape1,
      },
      // Après la visite du temple : elle te remercie et te laisse partir.
      {
        id: 'patron-agence-fin', name: 'Directrice', x: 5, y: 3, facing: 'down', color: 0xc83c5c,
        ifFlags: [FLAGS.visiteTerminee],
        dialogue: [
          '[Directrice - texte provisoire] Merci pour ton travail, les touristes sont ravis !',
          "C'est bon, c'est terminé : tu peux partir.",
        ],
        after: ['[Directrice - texte provisoire] Bon voyage !'],
        setFlag: FLAGS.travailTermine,
      },
    ],
  },

  // Hanoï — l'intérieur de la pagode : l'objet de chance est sur l'autel.
  temple: {
    name: 'Temple',
    grid: parseGrid([
      'XXXXXXXXXXXX',
      'XmoommmmoomX', // autel au centre
      'XooooooooooX',
      'XooooooooooX',
      'XmoooooooomX', // piliers
      'XooooooooooX',
      'XmoooooooomX',
      'XooooEEooooX',
      'XXXXXXXXXXXX',
    ]),
    spawn: { x: 5, y: 6, facing: 'up' },
    // Les quatre cases de l'autel réagissent quand on leur fait face.
    objects: [4, 5, 6, 7].map((x) => ({
      x,
      y: 1,
      dialogue: ["[Texte provisoire] Sur l'autel, tu trouves un objet de chance."],
      after: ["[Texte provisoire] L'autel est paisible."],
      item: ITEMS.objetChance,
    })),
  },

  // Amsterdam — le bureau CORNING : Laurent, le patron, te lance dans ton nouveau stage.
  corning: {
    name: 'Corning',
    grid: parseGrid([
      'XXXXXXXXXXXXXX',
      'XmmoooooooommX',
      'XoooommmmooooX', // bureau du patron
      'XooooooooooooX',
      'XmmoommoommooX', // postes de travail
      'XooooooooooooX',
      'XmmoommoommooX',
      'XooooooooooooX',
      'XooooooooooooX',
      'XooooooEEooooX',
      'XXXXXXXXXXXXXX',
    ]),
    spawn: { x: 7, y: 8, facing: 'up' },
    npcs: [
      {
        id: 'laurent', name: 'Laurent', x: 7, y: 3, facing: 'down', color: 0x2c4c8c,
        dialogue: [
          '[Laurent - texte provisoire] Bienvenue chez Corning ! Je suis Laurent, le patron.',
          'Ton stage commence aujourd\'hui. Bienvenue dans l\'équipe !',
        ],
        after: ['[Laurent - texte provisoire] Bon courage pour ton stage !'],
        setFlag: FLAGS.stageCorning,
      },
    ],
  },

  // Amsterdam — le coffee shop : on t'y vend la marchandise pour Romain.
  coffeeShop: {
    name: 'Coffee shop',
    grid: parseGrid([
      'XXXXXXXXXX',
      'XmmmmmmmmX', // comptoir
      'XooooooooX',
      'XmooooommX',
      'XooooooooX',
      'XmoooooomX',
      'XoooEEoooX',
      'XXXXXXXXXX',
    ]),
    spawn: { x: 4, y: 5, facing: 'up' },
    npcs: [
      {
        id: 'vendeur', name: 'Vendeur', x: 4, y: 2, facing: 'down', color: 0x3c9c4c,
        dialogue: [
          '[Vendeur - texte provisoire] Salut ! Tu viens pour la commande de Romain ?',
          'Voilà, tu as acheté la marchandise.',
        ],
        after: ['[Vendeur - texte provisoire] Passe une bonne journée !'],
        item: ITEMS.marchandise,
        setFlag: FLAGS.marchandiseAchetee,
      },
    ],
  },

  // Amsterdam — la maison commune : Romain t'attend pour récupérer la marchandise.
  maisonCommune: {
    name: 'Maison commune',
    grid: parseGrid([
      'XXXXXXXXXX',
      'XLooommoLX', // deux lits, table
      'XooooooooX',
      'XooooooooX',
      'XmoooooouX', // ordinateur à droite
      'XooooooooX',
      'XoooEEoooX',
      'XXXXXXXXXX',
    ]),
    spawn: { x: 4, y: 5, facing: 'up' },
    npcs: [
      {
        id: 'romain-maison', name: 'Romain', x: 6, y: 3, facing: 'left', color: 0xc0602c,
        dialogue: ["[Romain - texte provisoire] Alors, tu es passé au coffee shop ?"],
        after: ['[Romain - texte provisoire] Merci encore !'],
        receive: {
          item: ITEMS.marchandise,
          dialogue: [
            '[Romain - texte provisoire] Super, tu as la marchandise ! Merci beaucoup.',
            "Au fait, tu as dû recevoir un mail. Va voir sur l'ordinateur !",
          ],
          setFlag: FLAGS.marchandiseDonnee,
        },
      },
    ],
    // L'ordinateur (bureau à droite) : le mail n'arrive qu'après toutes les étapes d'Amsterdam.
    objects: [
      {
        x: 8, y: 4,
        unlessFlags: [FLAGS.marchandiseDonnee],
        dialogue: ["[Texte provisoire] C'est ton ordinateur. Aucun nouveau mail pour l'instant."],
      },
      {
        x: 8, y: 4,
        ifFlags: [FLAGS.marchandiseDonnee],
        dialogue: [
          '[Texte provisoire] Nouveau mail ! « Merci de retourner à l\'université de Hull',
          'pour récupérer ta nouvelle affectation. »',
        ],
        after: ["[Texte provisoire] Le mail dit : retourne à l'université de Hull."],
        setFlag: FLAGS.mailLu,
      },
    ],
  },

  // New Delhi — l'université : ton échange universitaire commence.
  delhiUniversity: {
    name: 'Université de Delhi',
    grid: parseGrid([
      'XXXXXNNNNXXXXX', // tableau
      'XmmoooooooommX',
      'XooooommmooooX', // bureau du professeur
      'XooooooooooooX',
      'XomoomoomoomoX',
      'XooooooooooooX',
      'XomoomoomoomoX',
      'XooooooooooooX',
      'XooooooooooooX',
      'XooooooEEooooX',
      'XXXXXXXXXXXXXX',
    ]),
    spawn: { x: 7, y: 8, facing: 'up' },
    npcs: [
      {
        id: 'prof-delhi', name: 'Professeure', x: 7, y: 3, facing: 'down', color: 0xd06020,
        unlessFlags: [FLAGS.potionDonnee],
        dialogue: [
          '[Professeure - texte provisoire] Namaste ! Bienvenue à l\'université.',
          'Tu es le bienvenu dans ce pays : ton échange commence aujourd\'hui !',
        ],
        after: ['[Professeure - texte provisoire] Profite bien de ton échange en Inde !'],
        setFlag: FLAGS.echangeCommence,
      },
      // Au retour du désert : fin du semestre.
      {
        id: 'prof-delhi-fin', name: 'Professeure', x: 7, y: 3, facing: 'down', color: 0xd06020,
        ifFlags: [FLAGS.potionDonnee],
        dialogue: [
          '[Professeure - texte provisoire] Félicitations pour ton semestre !',
          'Bonne chance pour la suite de ton voyage.',
        ],
        after: ["[Professeure - texte provisoire] Bon voyage ! L'aéroport t'attend."],
        setFlag: FLAGS.semestreTermine,
      },
    ],
  },

  // Rajasthan — la tente rayée : la potion magique est posée sur le coffre du fond.
  tente: {
    name: 'Tente',
    grid: parseGrid([
      'XXXXXXXXXX',
      'XmoommoomX', // coffre au centre
      'XooooooooX',
      'XooooooooX',
      'XmoooooomX',
      'XoooEEoooX',
      'XXXXXXXXXX',
    ]),
    spawn: { x: 4, y: 4, facing: 'up' },
    objects: [4, 5].map((x) => ({
      x,
      y: 1,
      dialogue: ['[Texte provisoire] Sur le coffre, une fiole scintille : la potion magique !'],
      after: ['[Texte provisoire] Le coffre est vide.'],
      item: ITEMS.potionMagique,
    })),
  },

  // Bordeaux — le stade : cérémonie de remise des diplômes, foule de diplômés et podium.
  stade: {
    name: 'Stade',
    grid: parseGrid([
      'XXXXXXXXXXXXXXXXXXXX',
      'X%%%%%%%%%%%%%%%%%%X', // tribunes
      'X%%%%%%%%%%%%%%%%%%X',
      'X..................X',
      'X........++........X', // podium
      'X........++........X',
      'X..................X',
      'X..................X',
      'X..................X',
      'X..................X',
      'X..................X',
      'X..................X',
      'X........EE........X',
      'XXXXXXXXXXXXXXXXXXXX',
    ]),
    spawn: { x: 9, y: 11, facing: 'up' },
    npcs: [
      {
        id: 'directeur', name: 'Directeur', x: 11, y: 4, facing: 'left', color: 0x6c1c2c, hat: true,
        unlessFlags: [FLAGS.diplomeBordeaux],
        dialogue: ['[Directeur - texte provisoire] Bienvenue à la cérémonie ! Monte sur le podium pour recevoir ton diplôme.'],
      },
      {
        id: 'directeur-fin', name: 'Directeur', x: 11, y: 4, facing: 'left', color: 0x6c1c2c, hat: true,
        ifFlags: [FLAGS.diplomeBordeaux],
        dialogue: ['[Directeur - texte provisoire] Félicitations, jeune diplômé ! La route de Paris est ouverte.'],
      },
      { id: 'diplome-0', name: 'Diplômé', x: 3, y: 7, facing: 'up', color: 0x202028, hat: true,
        dialogue: ["[Diplômé - texte provisoire] Félicitations à nous tous !"] },
      { id: 'diplome-1', name: 'Diplômé', x: 5, y: 8, facing: 'up', color: 0x2c2c3c, hat: true,
        dialogue: ["[Diplômé - texte provisoire] Quelle belle journée !"] },
      { id: 'diplome-2', name: 'Diplômé', x: 7, y: 7, facing: 'up', color: 0x1c1c24, hat: true,
        dialogue: ["[Diplômé - texte provisoire] On l'a fait !"] },
      { id: 'diplome-3', name: 'Diplômé', x: 12, y: 7, facing: 'up', color: 0x202028, hat: true,
        dialogue: ["[Diplômé - texte provisoire] Je n'en reviens pas, diplômés !"] },
      { id: 'diplome-4', name: 'Diplômé', x: 14, y: 8, facing: 'up', color: 0x2c2c3c, hat: true,
        dialogue: ["[Diplômé - texte provisoire] Félicitations à nous tous !"] },
      { id: 'diplome-5', name: 'Diplômé', x: 16, y: 7, facing: 'up', color: 0x1c1c24, hat: true,
        dialogue: ["[Diplômé - texte provisoire] Quelle belle journée !"] },
      { id: 'diplome-6', name: 'Diplômé', x: 4, y: 10, facing: 'up', color: 0x202028, hat: true,
        dialogue: ["[Diplômé - texte provisoire] On l'a fait !"] },
      { id: 'diplome-7', name: 'Diplômé', x: 6, y: 9, facing: 'up', color: 0x2c2c3c, hat: true,
        dialogue: ["[Diplômé - texte provisoire] Je n'en reviens pas, diplômés !"] },
      { id: 'diplome-8', name: 'Diplômé', x: 13, y: 10, facing: 'up', color: 0x1c1c24, hat: true,
        dialogue: ["[Diplômé - texte provisoire] Félicitations à nous tous !"] },
      { id: 'diplome-9', name: 'Diplômé', x: 15, y: 9, facing: 'up', color: 0x202028, hat: true,
        dialogue: ["[Diplômé - texte provisoire] Quelle belle journée !"] },
      { id: 'diplome-10', name: 'Diplômé', x: 8, y: 10, facing: 'up', color: 0x2c2c3c, hat: true,
        dialogue: ["[Diplômé - texte provisoire] On l'a fait !"] },
      { id: 'diplome-11', name: 'Diplômé', x: 11, y: 9, facing: 'up', color: 0x1c1c24, hat: true,
        dialogue: ["[Diplômé - texte provisoire] Je n'en reviens pas, diplômés !"] },
    ],
    // Monter sur le podium : remise du diplôme de Bordeaux (une seule fois).
    triggers: [[9, 4], [10, 4], [9, 5], [10, 5]].map(([x, y]) => ({
      x,
      y,
      unlessFlags: [FLAGS.diplomeBordeaux],
      dialogue: ['[Texte provisoire] Tu repenses avec émotion à ta remise de diplôme.'],
      readyDialogue: [
        '[Texte provisoire] Tu montes sur le podium sous les applaudissements !',
        'Le directeur te remet ton diplôme.',
      ],
      item: ITEMS.diplomeBordeaux,
      setFlags: [FLAGS.diplomeBordeaux],
    })),
  },

  // Paris — le bistrot : tu y manges et rencontres le cuisinier, gentil et drôle.
  bistro: {
    name: 'Bistrot',
    grid: parseGrid([
      'XXXXXXXXXXXX',
      'XmmmmoommmmX', // cuisine
      'XooooooooooX',
      'XmoomoomoomX', // tables
      'XooooooooooX',
      'XmoomoomoomX',
      'XooooEEooooX',
      'XXXXXXXXXXXX',
    ]),
    spawn: { x: 5, y: 5, facing: 'up' },
    // Après la promotion : Hugues et Thomas t'attendent pour trinquer.
    events: [
      {
        on: 'enter',
        ifFlags: [FLAGS.promotion],
        unlessFlags: [FLAGS.verreBistro],
        steps: [
          { speaker: 'Hugues', say: ['[Hugues - texte provisoire] Le voilà ! On fête ta promotion !'] },
          { speaker: 'Thomas', say: ['[Thomas - texte provisoire] Viens trinquer avec nous, et raconte-nous tout !'] },
          { setFlag: FLAGS.verreBistro },
        ],
      },
    ],
    npcs: [
      {
        id: 'hugues', name: 'Hugues', x: 8, y: 2, facing: 'left', color: 0x7c4c2c,
        ifFlags: [FLAGS.promotion],
        dialogue: ['[Hugues - texte provisoire] Santé ! Bravo pour ta promotion !'],
        after: ['[Hugues - texte provisoire] Encore un petit verre ?'],
        souvenir: { id: 'souvenir-hugues', name: "Souvenir d'Hugues" },
      },
      {
        id: 'thomas', name: 'Thomas', x: 9, y: 4, facing: 'left', color: 0x2c7c9c,
        ifFlags: [FLAGS.promotion],
        dialogue: ['[Thomas - texte provisoire] On est fiers de toi ! À la tienne !'],
        after: ['[Thomas - texte provisoire] Ce soir il y a un concert à Bercy, tu devrais y aller !'],
        souvenir: { id: 'souvenir-thomas', name: 'Souvenir de Thomas' },
      },
      {
        id: 'cuisinier', name: 'Cuisinier', x: 5, y: 1, facing: 'down', color: 0xf4f4f4,
        dialogue: [
          '[Cuisinier - texte provisoire] Bonjour bonjour ! Bienvenue dans mon bistrot !',
          "Aujourd'hui, c'est boeuf bourguignon... et le boeuf, c'est moi qui l'ai motivé ce matin !",
          'Installe-toi, je t\'apporte ça tout de suite. Bon appétit !',
        ],
        after: ['[Cuisinier - texte provisoire] Alors, c\'était bon ? Reviens quand tu veux, la maison ne mord pas !'],
        souvenir: { id: 'souvenir-cuisinier', name: 'Souvenir du cuisinier' },
        setFlag: FLAGS.repasParis,
        ask: {
          question: 'Dis-moi, tu as emménagé dans le coin ?',
          unlessFlags: [FLAGS.emmenagementParis],
          choices: [
            {
              label: 'Oui, je suis nouveau à Paris !',
              reply: ["Oui ! Je suis nouveau à Paris, j'emménage juste après manger."],
              dialogue: ['[Cuisinier - texte provisoire] Bienvenue dans le quartier, voisin ! Passe me voir quand tu veux.'],
              setFlags: [FLAGS.emmenagementParis],
            },
          ],
        },
      },
    ],
  },

  // Paris — ton appartement (immeuble en haut à droite) : l'ordinateur pour chercher un travail.
  parisAppart: {
    name: 'Ton appartement',
    grid: parseGrid([
      'XXXXXXXXXX',
      'XLooommooX', // lit, table
      'XooooooooX',
      'XooooooooX',
      'XmoooooouX', // ordinateur à droite
      'XooooooooX',
      'XoooEEoooX',
      'XXXXXXXXXX',
    ]),
    spawn: { x: 4, y: 5, facing: 'up' },
    events: [
      {
        on: 'enter',
        unlessFlags: [FLAGS.rechercheTravail],
        steps: [{ say: ["[Texte provisoire] Ton nouvel appartement parisien ! Il y a un ordinateur sur le bureau."] }],
      },
    ],
    objects: [
      {
        x: 8, y: 4,
        unlessFlags: [FLAGS.rechercheTravail],
        ask: {
          question: 'Chercher un travail ?',
          choices: [
            {
              label: 'Oui',
              dialogue: [
                '[Texte provisoire] Une offre correspond à ton profil !',
                "Rends-toi à l'entreprise, le grand bâtiment à droite de la tour Eiffel.",
              ],
              setFlags: [FLAGS.rechercheTravail],
            },
            { label: 'Non', dialogue: ['[Texte provisoire] Tu éteins l\'ordinateur. Plus tard, peut-être.'] },
          ],
        },
      },
      {
        x: 8, y: 4,
        ifFlags: [FLAGS.rechercheTravail],
        dialogue: ["[Texte provisoire] Ton rendez-vous : l'entreprise, à droite de la tour Eiffel."],
      },
    ],
  },

  // Paris — l'entreprise (tour de bureaux à droite de la tour Eiffel) : ton nouveau travail commence.
  entreprise: {
    name: 'Entreprise',
    grid: parseGrid([
      'XXXXXXXXXXX¤¤X', // ascenseur en haut à droite
      'XmmooooooooooX',
      'XoooommmmooooX', // accueil
      'XooooooooooooX',
      'XmmoommoommooX', // bureaux
      'XooooooooooooX',
      'XmmoommoommooX',
      'XooooooooooooX',
      'XooooooEEooooX',
      'XXXXXXXXXXXXXX',
    ]),
    spawn: { x: 7, y: 7, facing: 'up' },
    npcs: [
      {
        id: 'responsable-paris', name: 'Responsable', x: 7, y: 3, facing: 'down', color: 0x2c3c6c,
        dialogue: [
          "[Responsable - texte provisoire] Bonjour ! On t'attendait.",
          "Bienvenue dans l'entreprise : ton nouveau travail commence aujourd'hui !",
        ],
        after: ["[Responsable - texte provisoire] Au travail ! L'ascenseur mène aux étages."],
        setFlag: FLAGS.travailParis,
      },
    ],
    objects: ELEVATOR,
  },

  // Paris — l'entreprise, 1er étage : le manager (promotion).
  entrepriseManager: {
    name: 'Entreprise - 1er étage',
    grid: parseGrid([
      'XXXXXXXXXXX¤¤X', // ascenseur
      'XooooooooooooX',
      'XoooommmmooooX', // bureau
      'XooooooooooooX',
      'XmmoooooooommX',
      'XooooooooooooX',
      'XmmoooooooommX',
      'XooooooooooooX',
      'XooooooooooooX',
      'XXXXXXXXXXXXXX',
    ]),
    spawn: { x: 11, y: 1, facing: 'down' },
    npcs: [
      {
        id: 'manager', name: 'Manager', x: 7, y: 3, facing: 'down', color: 0x3c6c9c,
        unlessFlags: [FLAGS.promotion],
        dialogue: ['[Manager - texte provisoire] Bonjour ! Je suis ton manager.'],
        ask: {
          question: 'Demander une promotion ?',
          ifFlags: [FLAGS.travailParis],
          choices: [
            {
              label: 'Oui',
              reply: ["J'aimerais demander une promotion."],
              dialogue: ['[Manager - texte provisoire] Tu la mérites ! Promotion accordée, félicitations !'],
              setFlags: [FLAGS.promotion],
            },
            { label: 'Non', dialogue: ['[Manager - texte provisoire] Reviens me voir quand tu veux.'] },
          ],
        },
      },
      {
        id: 'manager-fin', name: 'Manager', x: 7, y: 3, facing: 'down', color: 0x3c6c9c,
        ifFlags: [FLAGS.promotion],
        dialogue: ['[Manager - texte provisoire] Encore bravo ! Va fêter ta promotion au bistrot, tes amis t\'y attendent.'],
      },
    ],
    objects: ELEVATOR,
  },

  // Paris — l'entreprise, dernier étage : le directeur (rupture conventionnelle, après le concert).
  entrepriseDirecteur: {
    name: 'Entreprise - dernier étage',
    grid: parseGrid([
      'XXXXXXXXXXX¤¤X', // ascenseur
      'XooooooooooooX',
      'XoooommmmooooX', // bureau
      'XooooooooooooX',
      'XmmoooooooommX',
      'XooooooooooooX',
      'XmmoooooooommX',
      'XooooooooooooX',
      'XooooooooooooX',
      'XXXXXXXXXXXXXX',
    ]),
    spawn: { x: 11, y: 1, facing: 'down' },
    npcs: [
      {
        id: 'directeur-paris', name: 'Directeur', x: 7, y: 3, facing: 'down', color: 0x3c2c4c,
        unlessFlags: [FLAGS.concertBercy],
        dialogue: ['[Directeur - texte provisoire] Ah, notre nouvelle recrue promue ! Profite bien de Paris.'],
      },
      {
        id: 'directeur-paris-concert', name: 'Directeur', x: 7, y: 3, facing: 'down', color: 0x3c2c4c,
        ifFlags: [FLAGS.concertBercy],
        unlessFlags: [FLAGS.ruptureConventionnelle],
        dialogue: ['[Directeur - texte provisoire] Tu voulais me voir ?'],
        ask: {
          question: 'Demander une rupture conventionnelle ?',
          choices: [
            {
              label: 'Oui',
              reply: ["J'aimerais demander une rupture conventionnelle."],
              dialogue: [
                "[Directeur - texte provisoire] C'est d'accord. Merci pour tout ton travail !",
                'Bonne chance pour la suite : la route du sud mène à Toulon.',
              ],
              setFlags: [FLAGS.ruptureConventionnelle],
            },
            { label: 'Non', dialogue: ['[Directeur - texte provisoire] Très bien. Ma porte reste ouverte.'] },
          ],
        },
      },
      {
        id: 'directeur-paris-fin', name: 'Directeur', x: 7, y: 3, facing: 'down', color: 0x3c2c4c,
        ifFlags: [FLAGS.ruptureConventionnelle],
        dialogue: ['[Directeur - texte provisoire] Bonne route vers Toulon !'],
      },
    ],
    objects: ELEVATOR,
  },

  // Paris — Bercy (Accor Arena) : le concert.
  bercy: {
    name: 'Bercy',
    grid: parseGrid([
      'XXXXXXXXXXXXXXXXXX',
      'XmmmmmmmmmmmmmmmmX', // écrans et enceintes
      'Xmm++++++++++++mmX', // scène
      'Xoo++++++++++++ooX',
      'XooooooooooooooooX',
      'XooooooooooooooooX',
      'XooooooooooooooooX',
      'XooooooooooooooooX',
      'XooooooooooooooooX',
      'XooooooooooooooooX',
      'XooooooooEEooooooX',
      'XXXXXXXXXXXXXXXXXX',
    ]),
    spawn: { x: 9, y: 9, facing: 'up' },
    events: [
      {
        on: 'enter',
        ifFlags: [FLAGS.verreBistro],
        unlessFlags: [FLAGS.concertBercy],
        steps: [
          { say: ["[Texte provisoire] Les lumières s'éteignent... la foule hurle !"] },
          { speaker: 'Chanteur', say: ['[Chanteur - texte provisoire] Bonsoir Paris ! Vous êtes prêts ?!'] },
          { say: ['[Texte provisoire] Quel concert incroyable ! Une soirée inoubliable.'] },
          { setFlag: FLAGS.concertBercy },
        ],
      },
    ],
    npcs: [
      { id: 'chanteur', name: 'Chanteur', x: 9, y: 2, facing: 'down', color: 0xd83060, dialogue: ['[Chanteur - texte provisoire] Merci Paris !'] },
      { id: 'guitariste', name: 'Guitariste', x: 6, y: 2, facing: 'down', color: 0x3c3c3c, dialogue: ['[Guitariste - texte provisoire] Yeah !'] },
      { id: 'batteur', name: 'Batteur', x: 12, y: 2, facing: 'down', color: 0x5c2c8c, dialogue: ['[Batteur - texte provisoire] Boum boum !'] },
      ...[[3, 5], [5, 6], [7, 5], [11, 5], [13, 6], [15, 5], [4, 7], [8, 7], [12, 7], [14, 8]].map(([x, y], i) => ({
        id: `fan-${i}`, name: 'Fan', x, y, facing: 'up', color: [0xe86040, 0x40a0e8, 0xe8c040, 0x60c060][i % 4],
        dialogue: [['[Fan - texte provisoire] Quel son !', '[Fan - texte provisoire] Encore ! Encore !'][i % 2]],
      })),
    ],
  },

  // Toulon — l'appartement de Yanis.
  yanisAppart: {
    name: 'Appartement de Yanis',
    grid: parseGrid([
      'XXXXXXXXXX',
      'XLooommoLX',
      'XooooooooX',
      'XooooooooX',
      'XmoooooomX',
      'XooooooooX',
      'XoooEEoooX',
      'XXXXXXXXXX',
    ]),
    spawn: { x: 4, y: 5, facing: 'up' },
    npcs: [
      {
        id: 'yanis-toulon', name: 'Yanis', x: 6, y: 3, facing: 'left', color: 0xc0b040,
        dialogue: [
          '[Yanis - texte provisoire] Pierre ! Te voilà enfin à Toulon !',
          'Installe-toi, fais comme chez toi. Bienvenue au bord de la mer !',
        ],
        after: ['[Yanis - texte provisoire] Alors, tu as vu la plage ?'],
        souvenir: { id: 'souvenir-yanis-toulon', name: 'Souvenir de Yanis à Toulon' },
        setFlag: FLAGS.chezYanis,
        // Première quête de Toulon : le Chemin de Saint-Jacques avec Yanis.
        ask: {
          question: 'Partir faire le Chemin de Saint-Jacques-de-Compostelle avec Yanis ?',
          unlessFlags: [FLAGS.caminoEnCours],
          choices: [
            {
              label: 'Oui',
              reply: ["Allez, on part faire le Chemin de Saint-Jacques !"],
              dialogue: ["[Yanis - texte provisoire] ¡Vamos ! Direction la côte nord de l'Espagne !"],
              setFlags: [FLAGS.caminoEnCours],
              warp: { map: 'camino', x: 1, y: 10, facing: 'right' },
            },
            { label: 'Non', dialogue: ['[Yanis - texte provisoire] Quand tu veux, je suis prêt !'] },
          ],
        },
      },
    ],
  },

  // Corse — la maison de tes parents.
  corseParents: {
    name: 'Maison de tes parents',
    grid: parseGrid([
      'XXXXXXXXXX',
      'XmmoooommX',
      'XooooooooX',
      'XooommoooX',
      'XooommoooX',
      'XooooooooX',
      'XoooEEoooX',
      'XXXXXXXXXX',
    ]),
    spawn: { x: 4, y: 5, facing: 'up' },
    events: [
      {
        on: 'enter',
        unlessFlags: [FLAGS.parentsCorse],
        steps: [
          { speaker: 'Maman', say: ['[Maman - texte provisoire] Mon grand ! Quelle joie de te voir en Corse !'] },
          { speaker: 'Papa', say: ['[Papa - texte provisoire] Bienvenue dans le maquis ! Va aussi dire bonjour à Léo et Théo, à côté.'] },
          { setFlag: FLAGS.parentsCorse },
        ],
      },
    ],
    npcs: [
      {
        id: 'maman-corse', name: 'Maman', x: 2, y: 3, facing: 'right', color: 0xe86fa0,
        dialogue: ['[Maman - texte provisoire] Reste manger, j\'ai préparé du fiadone !'],
      },
      {
        id: 'papa-corse', name: 'Papa', x: 7, y: 3, facing: 'left', color: 0x3f6fd8,
        dialogue: ['[Papa - texte provisoire] Le maquis sent bon aujourd\'hui, hein ?'],
      },
    ],
  },

  // Corse — la maison voisine : Léo et Théo.
  corseVoisins: {
    name: 'Maison de Léo et Théo',
    grid: parseGrid([
      'XXXXXXXXXX',
      'XmmoooommX',
      'XooooooooX',
      'XooommoooX',
      'XooommoooX',
      'XooooooooX',
      'XoooEEoooX',
      'XXXXXXXXXX',
    ]),
    spawn: { x: 4, y: 5, facing: 'up' },
    npcs: [
      {
        id: 'leo', name: 'Léo', x: 2, y: 3, facing: 'right', color: 0x4c9c5c,
        dialogue: ['[Léo - texte provisoire] Salut ! Ceci est le premier dialogue de Léo.'],
        after: ['[Léo - texte provisoire] Dialogue une fois le souvenir obtenu.'],
        souvenir: { id: 'souvenir-leo', name: 'Souvenir de Léo' },
      },
      {
        id: 'theo', name: 'Théo', x: 7, y: 3, facing: 'left', color: 0xc07c3c,
        dialogue: ['[Théo - texte provisoire] Hé ! Ceci est le premier dialogue de Théo.'],
        after: ['[Théo - texte provisoire] Dialogue une fois le souvenir obtenu.'],
        souvenir: { id: 'souvenir-theo', name: 'Souvenir de Théo' },
      },
    ],
  },

  // Bali — la cabane près de la mer : l'objet magique.
  baliCabane: {
    name: 'Cabane',
    grid: parseGrid([
      'XXXXXXXX',
      'XmoommoX', // coffre au centre
      'XooooooX',
      'XooooooX',
      'XoooEEoX',
      'XXXXXXXX',
    ]),
    spawn: { x: 4, y: 3, facing: 'up' },
    objects: [4, 5].map((x) => ({
      x,
      y: 1,
      dialogue: ['[Texte provisoire] Dans le coffre de bois, un objet scintille : un objet magique !'],
      after: ['[Texte provisoire] Le coffre est vide.'],
      item: ITEMS.objetMagiqueBali,
    })),
  },

  // Sri Lanka — l'intérieur du temple (stupa) : l'objet magique sur l'autel.
  sriLankaTemple: {
    name: 'Temple',
    grid: parseGrid([
      'XXXXXXXXXXXX',
      'XmoommmmoomX', // autel
      'XooooooooooX',
      'XmoooooooomX',
      'XooooooooooX',
      'XooooEEooooX',
      'XXXXXXXXXXXX',
    ]),
    spawn: { x: 5, y: 4, facing: 'up' },
    npcs: [
      {
        id: 'moine', name: 'Moine', x: 2, y: 2, facing: 'right', color: 0xe88820,
        dialogue: ["[Moine - texte provisoire] Ayubowan. L'objet sacré t'attend sur l'autel."],
      },
    ],
    objects: [4, 5, 6, 7].map((x) => ({
      x,
      y: 1,
      dialogue: ["[Texte provisoire] Sur l'autel, entre les fleurs de lotus, un objet magique rayonne !"],
      after: ["[Texte provisoire] L'autel est paisible."],
      item: ITEMS.objetMagiqueSriLanka,
    })),
  },

  // Thaïlande — l'intérieur du wat : l'objet magique au pied du Bouddha doré.
  watInterieur: {
    name: 'Wat',
    grid: parseGrid([
      'XXXXXXXXXXXX',
      'XmoommmmoomX', // autel
      'XooooooooooX',
      'XmoooooooomX',
      'XooooooooooX',
      'XooooEEooooX',
      'XXXXXXXXXXXX',
    ]),
    spawn: { x: 5, y: 4, facing: 'up' },
    npcs: [
      {
        id: 'moine-thai', name: 'Moine', x: 2, y: 2, facing: 'right', color: 0xe88820,
        dialogue: ["[Moine - texte provisoire] Sawasdee. L'objet magique repose au pied du Bouddha."],
      },
    ],
    objects: [4, 5, 6, 7].map((x) => ({
      x,
      y: 1,
      dialogue: ["[Texte provisoire] Au pied du grand Bouddha doré, un objet magique brille !"],
      after: ["[Texte provisoire] L'autel est paisible."],
      item: ITEMS.objetMagiqueThailande,
    })),
  },

  // Népal — le monastère du grand stupa : l'objet magique parmi les lampes à beurre.
  monastere: {
    name: 'Monastère',
    grid: parseGrid([
      'XXXXXXXXXXXX',
      'XmoommmmoomX', // autel
      'XooooooooooX',
      'XmoooooooomX',
      'XooooooooooX',
      'XooooEEooooX',
      'XXXXXXXXXXXX',
    ]),
    spawn: { x: 5, y: 4, facing: 'up' },
    npcs: [
      {
        id: 'moine-nepal', name: 'Moine', x: 2, y: 2, facing: 'right', color: 0x9c2830,
        dialogue: ["[Moine - texte provisoire] Namaste. L'objet sacré t'attend sur l'autel, parmi les lampes."],
      },
    ],
    objects: [4, 5, 6, 7].map((x) => ({
      x,
      y: 1,
      dialogue: ["[Texte provisoire] Parmi les lampes à beurre, un objet magique rayonne !"],
      after: ["[Texte provisoire] L'autel est paisible."],
      item: ITEMS.objetMagiqueNepal,
    })),
  },
};
