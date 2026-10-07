import { parseGrid } from './parseGrid.js';
// Le dessin de la carte : l'aéroport redessiné en Gen 4 (scripts/build_airport.py) ; ses collisions s'imposent à la grille
// du jeu (voir builtGrid).
import BUILT from '../builtMaps/airport.json' with { type: 'json' };
import { builtGrid } from './builtGrid.js';
import { FLAGS, ITEMS, TOULON_QUESTS, visitedFlag } from '../story.js';
import { FLIGHT_TO_HULL } from '../bordeauxStory.js';
import { FLIGHT_TO_HANOI } from '../hullStory.js';

// L'aéroport (à Bordeaux) : l'hôtesse propose la destination de la suite de l'histoire, et « Autre » (les destinations
// déjà visitées). Une destination n'apparaît que si ses conditions sont remplies (ifFlags / ifItems / ifSouvenirs) ;
// `notWhen` : cachée quand ces conditions-là sont remplies (elle est alors la suite de l'histoire).

// La suite de l'histoire : le prochain vol, tant qu'on n'est pas arrivé (au plus un à la fois).
const BACK_TO_HULL = { ifFlags: [FLAGS.mailLu], unlessItems: [ITEMS.billetNewDelhi.id], unlessFlags: [FLAGS.arriveeNewDelhi] };
const NEXT_FLIGHTS = [
  // Hull : le premier vol, avec le diplôme d'anglais, est gardé par Ousmane (voir bordeauxStory.js FLIGHT_TO_HULL).
  { label: 'Hull (Angleterre)', ifItems: [ITEMS.diplomeAnglais.id], unlessFlags: [FLAGS.arriveeHull], steps: FLIGHT_TO_HULL },
  // Hanoï : après les adieux de Hull (personne au guichet).
  { label: 'Hanoï (Vietnam)', ifItems: [ITEMS.diplomeHull.id], ifFlags: [FLAGS.adieuxHull], unlessFlags: [FLAGS.arriveeHanoi], steps: FLIGHT_TO_HANOI },
  {
    label: 'Amsterdam (Pays-Bas)', ifFlags: [FLAGS.travailTermine], unlessFlags: [FLAGS.arriveeAmsterdam],
    setFlags: [FLAGS.arriveeAmsterdam], plane: { map: 'amsterdam', x: 1, y: 6, facing: 'right' },
  },
  // Le mail d'Amsterdam : retour à l'université de Hull, qui donne le billet pour New Delhi.
  { label: 'Hull (Angleterre)', ...BACK_TO_HULL, plane: { map: 'hull', x: 1, y: 35, facing: 'right' } },
  {
    label: 'New Delhi (Inde)', ifItems: [ITEMS.billetNewDelhi.id], unlessFlags: [FLAGS.arriveeNewDelhi],
    setFlags: [FLAGS.arriveeNewDelhi], plane: { map: 'newDelhi', x: 1, y: 6, facing: 'right' },
  },
  { label: 'Bali (Indonésie)', ...TOULON_QUESTS, unlessFlags: [visitedFlag('bali')], plane: { map: 'bali', x: 15, y: 23, facing: 'up' } },
  { label: 'Sri Lanka', ifItems: [ITEMS.objetMagiqueBali.id], unlessFlags: [visitedFlag('sriLanka')], plane: { map: 'sriLanka', x: 1, y: 10, facing: 'right' } },
  { label: 'Thaïlande', ifItems: [ITEMS.objetMagiqueSriLanka.id], unlessFlags: [visitedFlag('thailand')], plane: { map: 'thailand', x: 1, y: 6, facing: 'right' } },
  { label: 'Népal', ifItems: [ITEMS.objetMagiqueThailande.id], unlessFlags: [visitedFlag('nepal')], plane: { map: 'nepal', x: 1, y: 12, facing: 'right' } },
  {
    label: 'Nouveau pays',
    ifItems: [ITEMS.objetMagiqueNepal.id],
    dialogue: ["[Texte provisoire] Ce vol n'est pas encore ouvert : la suite du voyage arrive bientôt !"],
  },
];

// « Autre » : les lieux déjà visités (on y retourne en avion), sauf la suite de l'histoire, déjà proposée.
const OTHER_FLIGHTS = [
  { label: 'Fort-de-France (Martinique)', plane: { map: 'fortDeFrance', x: 15, y: 10, facing: 'down' } },
  { label: 'Saint-Ay', ifFlags: [FLAGS.departFortDeFrance], plane: { map: 'saintAy', x: 5, y: 10, facing: 'left' } },
  { label: 'Montépilloy', ifFlags: [FLAGS.arriveeMontepilloy], plane: { map: 'montepilloy', x: 16, y: 27, facing: 'up' } },
  { label: 'Prytanée', ifFlags: [FLAGS.arriveePrytanee], plane: { map: 'prytanee', x: 16, y: 23, facing: 'up' } },
  { label: 'Hull (Angleterre)', ifFlags: [FLAGS.arriveeHull], notWhen: BACK_TO_HULL, plane: { map: 'hull', x: 1, y: 35, facing: 'right' } },
  { label: 'Hanoï (Vietnam)', ifFlags: [FLAGS.arriveeHanoi], plane: { map: 'hanoi', x: 1, y: 6, facing: 'right' } },
  { label: 'Amsterdam (Pays-Bas)', ifFlags: [FLAGS.arriveeAmsterdam], plane: { map: 'amsterdam', x: 1, y: 6, facing: 'right' } },
  { label: 'New Delhi (Inde)', ifFlags: [FLAGS.arriveeNewDelhi], plane: { map: 'newDelhi', x: 1, y: 6, facing: 'right' } },
  { label: 'Paris', ifFlags: [FLAGS.arriveeParis], plane: { map: 'paris', x: 1, y: 6, facing: 'right' } },
  { label: 'Toulon', ifFlags: [FLAGS.arriveeToulon], plane: { map: 'toulon', x: 1, y: 6, facing: 'right' } },
  { label: 'Bali (Indonésie)', ifFlags: [visitedFlag('bali')], plane: { map: 'bali', x: 15, y: 23, facing: 'up' } },
  { label: 'Sri Lanka', ifFlags: [visitedFlag('sriLanka')], plane: { map: 'sriLanka', x: 1, y: 10, facing: 'right' } },
  { label: 'Thaïlande', ifFlags: [visitedFlag('thailand')], plane: { map: 'thailand', x: 1, y: 6, facing: 'right' } },
  { label: 'Népal', ifFlags: [visitedFlag('nepal')], plane: { map: 'nepal', x: 1, y: 12, facing: 'right' } },
  { label: 'Rester ici', dialogue: ['Très bien, reviens me voir quand tu veux !'] },
];

// Un vol : le trajet en avion (FerryScene.playPlane), puis l'arrivée.
const flight = ({ plane, ...choice }) => (plane ? { ...choice, warp: { ...plane, plane: true } } : choice);

const DESTINATIONS = [
  ...NEXT_FLIGHTS.map(flight),
  // Seule (aucun vol de l'histoire en attente), « Autre » s'ouvre directement (voir MapScene.runAsk).
  { label: 'Autre', ask: { question: 'Quelle destination ?', choices: OTHER_FLIGHTS.map(flight) } },
];

// Aéroport — 24 x 18 cases, en Gen 4 : le tarmac et ses avions derrière la baie vitrée, le tableau des départs, le guichet
// (l'hôtesse derrière son comptoir, on lui parle par-dessus), la file entre les poteaux à cordon, la salle d'attente, les
// portes vers Bordeaux. Légende : voir src/data/tiles.js (A = tarmac, | = baie vitrée, # = comptoir, _ = sol du terminal).
export const airportMap = {
  id: 'airport',
  name: 'Aéroport',
  built: BUILT,
  sourceGrid: parseGrid([
    'AAAAAAAAAAAAAAAAAAAAAAAA', // 0  tarmac et avions
    'AAAAAAAAAAAAAAAAAAAAAAAA', // 1
    'AAAAAAAAAAAAAAAAAAAAAAAA', // 2
    'AAAAAAAAAAAAAAAAAAAAAAAA', // 3
    'AAAAAAAAAAAAAAAAAAAAAAAA', // 4
    '||||||||||||||||||||||||', // 5  baie vitrée, tableau des départs
    '||||||||||||||||||||||||', // 6
    'XX____XXXXXXXXXXXX____XX', // 7  tapis à bagages
    'XXXXXX____________XXXXXX', // 8  l'hôtesse (x 11), derrière le guichet ; cordons de chaque côté
    'X_____############_____X', // 9  guichet ('#' : on parle à l'hôtesse par-dessus)
    'X______________________X', // 10
    'X_____XXXXX__XXXXX_____X', // 11 la file (poteaux à cordon, ouverte en x 11-12)
    'X______________________X', // 12
    'X_XXXXXX________XXXXXX_X', // 13 salle d'attente
    'X______________________X', // 14
    'XXXXXXX_________XXXXXX_X', // 15
    'X______________________X', // 16
    'XXXXXXXXXXX__XXXXXXXXXXX', // 17 portes vers Bordeaux
  ]),
  doors: [],
  buildings: [],
  npcs: [
    // Ousmane attend devant le guichet le jour du départ pour Hull.
    {
      id: 'ousmane-aeroport', name: 'Ousmane', x: 13, y: 10, facing: 'left',
      ifItems: [ITEMS.diplomeAnglais.id], unlessFlags: [FLAGS.arriveeHull],
      dialogue: ['Le guichet, c\'est juste là. Prends ton billet pour Hull.'],
    },
    {
      id: 'hotesse', name: 'Hôtesse', x: 11, y: 8, facing: 'down', color: 0x2c5cb0,
      dialogue: ["Bonjour ! Bienvenue à l'aéroport."],
      ask: { question: 'Où souhaites-tu partir ?', choices: DESTINATIONS },
    },
    // Des voyageurs dans la salle d'attente.
    { id: 'voyageur-1', name: 'Voyageur', x: 7, y: 14, facing: 'up', dialogue: ['Mon vol a deux heures de retard. Encore.'] },
    { id: 'voyageuse-1', name: 'Voyageuse', x: 17, y: 12, facing: 'down', dialogue: ['Je pars voir ma fille au Canada !'] },
  ],
  triggers: [11, 12].map((x) => ({
    x,
    y: 17,
    readyDialogue: ["Tu sors de l'aéroport."],
    warp: { map: 'bordeaux', x: 30, y: 6, facing: 'left' },
  })),
  objects: [
    ...[9, 10, 11, 12, 13, 14].map((x) => ({ x, y: 6, dialogue: ['Le tableau des départs. Hull, Hanoï, Amsterdam, New Delhi… Le monde entier.'] })),
  ],
  spawn: { x: 11, y: 16, facing: 'up' },
};

// La grille du jeu : celle d'origine, accordée aux collisions du dessin.
airportMap.grid = builtGrid(airportMap.sourceGrid, BUILT);
