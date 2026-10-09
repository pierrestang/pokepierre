import { parseGrid } from './parseGrid.js';
// Le dessin de la carte : l'aéroport redessiné en Gen 4 (scripts/build_airport.py) ; ses collisions s'imposent à la grille
// du jeu (voir builtGrid).
import BUILT from '../builtMaps/airport.json' with { type: 'json' };
import { builtGrid } from './builtGrid.js';
import { FLAGS, ITEMS } from '../story.js';
import { AIRPORT_EXITS } from './airportLinks.js';
import { FLIGHT_TO_HULL } from '../bordeauxStory.js';
import { FLIGHT_TO_HANOI } from '../hullStory.js';
import { FLIGHT_TO_AMSTERDAM } from '../hanoiStory.js';

// L'aéroport (à Bordeaux) : l'hôtesse propose la destination de la suite de l'histoire, et « Autre » (les destinations
// déjà visitées). Une destination n'apparaît que si ses conditions sont remplies (ifFlags / ifItems / ifSouvenirs) ;
// `notWhen` : cachée quand ces conditions-là sont remplies (elle est alors la suite de l'histoire).

// La suite de l'histoire : le prochain vol, tant qu'on n'est pas arrivé (au plus un à la fois).
const NEXT_FLIGHTS = [
  // Hull : le premier vol, avec le diplôme d'anglais, est gardé par Ousmane (voir bordeauxStory.js FLIGHT_TO_HULL).
  { label: 'Hull (Angleterre)', ifItems: [ITEMS.diplomeAnglais.id], unlessFlags: [FLAGS.arriveeHull], steps: FLIGHT_TO_HULL },
  // Hanoï : après les adieux de Hull (personne n'accompagne Pierre).
  { label: 'Hanoï (Vietnam)', ifItems: [ITEMS.diplomeHull.id], ifFlags: [FLAGS.adieuxHull], unlessFlags: [FLAGS.arriveeHanoi], steps: FLIGHT_TO_HANOI },
  // Amsterdam : après l'appel de Romain, six mois après le premier jour à Hanoï (monologue au guichet, voir hanoiStory.js).
  { label: 'Amsterdam (Pays-Bas)', ifFlags: [FLAGS.appelRomain], unlessFlags: [FLAGS.arriveeAmsterdam], steps: FLIGHT_TO_AMSTERDAM },
  // New Delhi : avec le billet que Romain remet à Amsterdam, la nuit au bord du canal.
  {
    label: 'New Delhi (Inde)', ifItems: [ITEMS.billetNewDelhi.id], unlessFlags: [FLAGS.arriveeNewDelhi],
    setFlags: [FLAGS.arriveeNewDelhi], plane: AIRPORT_EXITS.newDelhi,
  },
  // Bordeaux : le semestre de New Delhi fini, depuis l'aéroport de Delhi, avec Prophecy (le stade s'ouvre).
  {
    label: 'Bordeaux (France)', ifFlags: [FLAGS.semestreTermine], unlessFlags: [FLAGS.retourBordeaux],
    setFlags: [FLAGS.retourBordeaux], plane: AIRPORT_EXITS.bordeaux,
  },
];

// « Autre » : les lieux déjà visités (on y retourne en avion), sauf la suite de l'histoire, déjà proposée.
const OTHER_FLIGHTS = [
  { label: 'Bordeaux', ifFlags: [FLAGS.arriveeBordeaux], plane: AIRPORT_EXITS.bordeaux },
  { label: 'Fort-de-France (Martinique)', plane: { map: 'fortDeFrance', x: 15, y: 10, facing: 'down' } },
  { label: 'Saint-Ay', ifFlags: [FLAGS.departFortDeFrance], plane: { map: 'saintAy', x: 5, y: 10, facing: 'left' } },
  { label: 'Montépilloy', ifFlags: [FLAGS.arriveeMontepilloy], plane: { map: 'montepilloy', x: 16, y: 27, facing: 'up' } },
  { label: 'Prytanée', ifFlags: [FLAGS.arriveePrytanee], plane: { map: 'prytanee', x: 16, y: 23, facing: 'up' } },
  { label: 'Hull (Angleterre)', ifFlags: [FLAGS.arriveeHull], plane: AIRPORT_EXITS.hull },
  { label: 'Hanoï (Vietnam)', ifFlags: [FLAGS.arriveeHanoi], plane: AIRPORT_EXITS.hanoi },
  { label: 'Amsterdam (Pays-Bas)', ifFlags: [FLAGS.arriveeAmsterdam], plane: AIRPORT_EXITS.amsterdam },
  { label: 'New Delhi (Inde)', ifFlags: [FLAGS.arriveeNewDelhi], plane: AIRPORT_EXITS.newDelhi },
  { label: 'Paris', ifFlags: [FLAGS.arriveeParis], plane: AIRPORT_EXITS.paris },
  { label: 'Rester ici', dialogue: ['Très bien, reviens me voir quand tu veux !'] },
];

// Un vol : le trajet en avion (FerryScene.playPlane), puis l'arrivée. On ne propose pas la ville dont l'aéroport est
// celui où l'on se trouve (memo `aeroport`, voir airportLinks.js).
const flight = ({ plane, ...choice }) => (plane
  ? { ...choice, unlessMemo: { aeroport: plane.map }, warp: { ...plane, plane: true } }
  : choice);

const DESTINATIONS = [
  ...NEXT_FLIGHTS.map(flight),
  // Seule (aucun vol de l'histoire en attente), « Autre » s'ouvre directement (voir MapScene.runAsk).
  { label: 'Autre', ask: { question: 'Quelle destination ?', choices: OTHER_FLIGHTS.map(flight) } },
];

// Aéroport — 22 x 14 cases (la carte tient en entier dans l'écran : on voit toujours les avions), en Gen 4 : le tarmac
// et ses avions derrière la baie vitrée, le tableau des départs, le guichet (l'hôtesse derrière son comptoir, on lui parle
// par-dessus), la file entre les poteaux à cordon, la salle d'attente, les portes vers Bordeaux. Un intérieur : pas de vélo.
// Légende : voir src/data/tiles.js (A = tarmac, | = baie vitrée, # = comptoir, _ = sol du terminal).
export const airportMap = {
  id: 'airport',
  name: 'Aéroport',
  indoor: true,
  surroundings: false,                        // autour de la carte, du noir (comme les intérieurs), pas de forêt
  built: BUILT,
  sourceGrid: parseGrid([
    'AAAAAAAAAAAAAAAAAAAAAA', // 0  tarmac et avions
    'AAAAAAAAAAAAAAAAAAAAAA', // 1
    'AAAAAAAAAAAAAAAAAAAAAA', // 2
    'AAAAAAAAAAAAAAAAAAAAAA', // 3
    '||||||||||||||||||||||', // 4  baie vitrée, tableau des départs
    '||||||||||||||||||||||', // 5
    'XXXXXXXXXXXXXXXXXXXXXX', // 6  le côté du personnel : l'hôtesse (x 10), deux plantes
    'XXXXXXX#######XXXXXXXX', // 7  guichet ('#' : on parle à l'hôtesse par-dessus) ; cordons de chaque côté
    'X____________________X', // 8
    'X___XXXXX__XXXXX_____X', // 9  la file (poteaux à cordon, ouverte en x 9-10)
    'X_XXXXX________XXXXX_X', // 10 salle d'attente : dossiers des sièges
    'X_XXXXXX______XXXXXX_X', // 11 assises, petites valises
    'X____________________X', // 12
    'XXXXXXXXXX__XXXXXXXXXX', // 13 portes vers Bordeaux
  ]),
  doors: [],
  buildings: [],
  npcs: [
    // Ousmane attend devant le guichet le jour du départ pour Hull.
    {
      id: 'ousmane-aeroport', name: 'Ousmane', x: 11, y: 8, facing: 'left',
      ifItems: [ITEMS.diplomeAnglais.id], unlessFlags: [FLAGS.arriveeHull],
      dialogue: ['Le guichet, c\'est juste là. Prends ton billet pour Hull.'],
    },
    {
      id: 'hotesse', name: 'Hôtesse', x: 10, y: 6, facing: 'down', color: 0x2c5cb0,
      dialogue: ["Bonjour ! Bienvenue à l'aéroport."],
      ask: { question: 'Où souhaites-tu partir ?', choices: DESTINATIONS },
    },
    // Des voyageurs dans la salle d'attente.
    { id: 'voyageur-1', name: 'Voyageur', x: 4, y: 12, facing: 'up', dialogue: ['Mon vol a deux heures de retard. Encore.'] },
    { id: 'voyageuse-1', name: 'Voyageuse', x: 13, y: 10, facing: 'down', dialogue: ['Je pars voir ma fille au Canada !'] },
  ],
  triggers: [10, 11].map((x) => ({
    x,
    y: 13,
    readyDialogue: ["Tu sors de l'aéroport."],
    warp: { airportExit: true },                // dans la ville d'où l'on vient (voir airportLinks.js)
  })),
  // Les écrans du guichet, de part et d'autre de l'hôtesse.
  objects: [8, 12].map((x) => ({ x, y: 7, dialogue: ['Sur l\'écran, les départs du jour : Hull, Hanoï, Amsterdam, New Delhi… Le monde entier.'] })),
  spawn: { x: 10, y: 12, facing: 'up' },
};

// La grille du jeu : celle d'origine, accordée aux collisions du dessin.
airportMap.grid = builtGrid(airportMap.sourceGrid, BUILT);
