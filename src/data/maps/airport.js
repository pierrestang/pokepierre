import { parseGrid } from './parseGrid.js';
import { FLAGS, ITEMS, TOULON_QUESTS } from '../story.js';

// L'aéroport (à Bordeaux) : la dame du guichet propose toutes les destinations déjà débloquées.
// Une destination n'apparaît que si ses conditions sont remplies (ifFlags / ifItems / ifSouvenirs).
const DESTINATIONS = [
  { label: 'Fort-de-France (Martinique)', warp: { map: 'fortDeFrance', x: 15, y: 10, facing: 'down' } },
  { label: 'Saint-Ay', ifFlags: [FLAGS.departFortDeFrance], warp: { map: 'saintAy', x: 5, y: 10, facing: 'left' } },
  { label: 'Montépilloy', ifFlags: [FLAGS.arriveeMontepilloy], warp: { map: 'montepilloy', x: 14, y: 25, facing: 'up' } },
  { label: 'Prytanée', ifFlags: [FLAGS.arriveePrytanee], warp: { map: 'prytanee', x: 14, y: 21, facing: 'up' } },
  { label: 'Bordeaux', warp: { map: 'bordeaux', x: 30, y: 6, facing: 'left' } },
  {
    label: 'Hull (Angleterre)',
    ifItems: [ITEMS.diplomeAnglais.id],
    setFlags: [FLAGS.arriveeHull],
    warp: { map: 'hull', x: 1, y: 35, facing: 'right' },
  },
  {
    label: 'Hanoï (Vietnam)',
    ifItems: [ITEMS.diplomeHull.id],
    ifSouvenirs: ['role-bande-hull'],
    setFlags: [FLAGS.arriveeHanoi],
    warp: { map: 'hanoi', x: 1, y: 6, facing: 'right' },
  },
  {
    label: 'Amsterdam (Pays-Bas)',
    ifFlags: [FLAGS.travailTermine],
    setFlags: [FLAGS.arriveeAmsterdam],
    warp: { map: 'amsterdam', x: 1, y: 6, facing: 'right' },
  },
  {
    label: 'New Delhi (Inde)',
    ifItems: [ITEMS.billetNewDelhi.id],
    setFlags: [FLAGS.arriveeNewDelhi],
    warp: { map: 'newDelhi', x: 1, y: 6, facing: 'right' },
  },
  {
    label: 'Paris',
    ifFlags: [FLAGS.arriveeParis],
    warp: { map: 'paris', x: 1, y: 6, facing: 'right' },
  },
  { label: 'Toulon', ifFlags: [FLAGS.arriveeToulon], warp: { map: 'toulon', x: 1, y: 6, facing: 'right' } },
  { label: 'Bali (Indonésie)', ...TOULON_QUESTS, warp: { map: 'bali', x: 15, y: 23, facing: 'up' } },
  {
    label: 'Sri Lanka',
    ifItems: [ITEMS.objetMagiqueBali.id],
    warp: { map: 'sriLanka', x: 1, y: 11, facing: 'right' },
  },
  {
    label: 'Thaïlande',
    ifItems: [ITEMS.objetMagiqueSriLanka.id],
    warp: { map: 'thailand', x: 1, y: 6, facing: 'right' },
  },
  {
    label: 'Népal',
    ifItems: [ITEMS.objetMagiqueThailande.id],
    warp: { map: 'nepal', x: 1, y: 12, facing: 'right' },
  },
  {
    label: 'Nouveau pays',
    ifItems: [ITEMS.objetMagiqueNepal.id],
    dialogue: ["[Texte provisoire] Ce vol n'est pas encore ouvert : la suite du voyage arrive bientôt !"],
  },
  { label: 'Rester ici', dialogue: ['[Hôtesse - texte provisoire] Très bien, reviens me voir quand tu veux !'] },
];

// Aéroport — 24 x 16 cases : tarmac et avions derrière la baie vitrée, terminal, guichet.
// Légende : voir src/data/tiles.js (_ = sol du terminal, | = baie vitrée, # = comptoir,
// % = sièges, @ = tableau des départs)
export const airportMap = {
  id: 'airport',
  name: 'Aéroport',
  grid: parseGrid([
    'AAAAAAAAAAAAAAAAAAAAAAAA', // 0  tarmac
    'AAARRRRRRAAAAAARRRRRRAAA', // 1  avions
    'AAARRRRRRAAAAAARRRRRRAAA', // 2
    'AAARRRRRRAAAAAARRRRRRAAA', // 3
    '||||||||||||||||||||||||', // 4  baie vitrée
    'X_________@@@@_________X', // 5  tableau des départs
    'X______________________X', // 6
    'X_______###_####_______X', // 7  guichet (l'hôtesse au milieu)
    'X______________________X', // 8
    'X______________________X', // 9
    'X__%%%%%________%%%%%__X', // 10 sièges
    'X__%%%%%________%%%%%__X', // 11
    'X______________________X', // 12
    'X______________________X', // 13
    'X______________________X', // 14
    'XXXXXXXXXXX__XXXXXXXXXXX', // 15 portes vers Bordeaux
  ]),
  doors: [],
  buildings: [
    { type: 'plane', x: 3,  y: 1 },
    { type: 'plane', x: 15, y: 1 },
  ],
  npcs: [
    {
      id: 'hotesse', name: 'Hôtesse', x: 11, y: 7, facing: 'down', color: 0x2c5cb0,
      dialogue: ["[Hôtesse - texte provisoire] Bonjour ! Bienvenue à l'aéroport."],
      ask: { question: 'Où souhaites-tu partir ?', choices: DESTINATIONS },
    },
  ],
  triggers: [11, 12].map((x) => ({
    x,
    y: 15,
    readyDialogue: ["Tu sors de l'aéroport."],
    warp: { map: 'bordeaux', x: 30, y: 6, facing: 'left' },
  })),
  surroundings: 'A',
  buildingGround: 'A', // les avions sont posés sur le tarmac
  spawn: { x: 11, y: 13, facing: 'up' },
};
