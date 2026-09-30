import { parseGrid } from './parseGrid.js';
import { toAirport, airportSign } from './airportLinks.js';

// Hors de la carte : Newland Avenue se prolonge vers le sud, trottoirs ailleurs.
function outside(x, y, grid) {
  if (y >= grid.length && (x === 14 || x === 15)) return 'ɐ';
  if (y >= 0 && y < grid.length) {
    const edge = grid[y][x < 0 ? 0 : grid[0].length - 1];
    if (['ɐ', 'ɔ'].includes(edge)) return edge;
  }
  return 'ɔ';
}

const NOT_HOME = ['Personne ne répond...'];
const BAR_CLOSED = ["Le bar n'ouvre qu'en fin d'après-midi. Reviens ce soir !"];

// Hull — le quartier de l'université et de Newland Avenue, façon Rouge Feu, 30 x 36 cases : en haut, le campus
// (université, jardin et bassin derrière, deux terrains de football, bibliothèque Brynmor Jones, The Asylum, la
// boîte du syndicat étudiant) ; Newland Avenue descend tout droit du campus jusqu'au bas de l'écran, bordée de
// maisons mitoyennes, de bars et de colocations d'étudiants (dont celle de Romain et Paul) ; à l'entrée de la
// rue, le pont ferroviaire en briques où est peint « NEWLAND AVENUE », puis l'arrêt du bus vers l'aéroport.
// Légende : voir src/data/tiles.js (ɐ = chaussée, ɔ = trottoir, ʕ = remblai du pont, F = barrière, ~ = bassin,
// f = fleurs, ƚ = petit arbre, l = réverbère, q = bus, S = panneau, R / W / D = toit, mur, porte)
export const hullMap = {
  id: 'hull',
  name: 'Hull',
  grid: parseGrid([
    'ƚƚƚƚƚƚƚƚƚƚƚƚƚƚƚƚƚƚƚƚƚƚƚƚƚƚƚƚƚƚ', // 0
    'ƚFFFFFFFFFffffffffffFFFFFFFFFƚ', // 1
    'ƚFRRRRRRRFƚ.~~~~~~.ƚFRRRRRRRFƚ', // 2
    'ƚFRRRRRRRFƚ.~~~~~~.ƚFRRRRRRRFƚ', // 3
    'ƚFRRRRRRRFff......ffFRRRRRRRFƚ', // 4
    'ƚFRRRRRRRFRRRRRRRRR.FRRRRRRRFƚ', // 5
    'ƚFRRRRRRRFRRRRRRRRR.FRRRRRRRFƚ', // 6
    'ƚFRRRRRRRFWWWWWWWWW.FRRRRRRRFƚ', // 7
    'ƚFFFFFFFFFWWWWDWWWW.FFFFFFFFFƚ', // 8
    'ƚRRRRRRRɔɔɔɔSɔɔɔɔɔɔɔɔɔRRRRRɔɔƚ', // 9
    'ƚRRRRRRRɔlɔɔɔɔɔɔɔɔɔɔlɔRRRRRɔɔƚ', // 10
    'ƚWWWWWWWɔɔɔɔɔɔɔɔɔɔɔɔɔɔWWWWWɔɔƚ', // 11
    'ƚWWWDWWWɔɔɔɔɔɔɔɔɔɔɔɔɔɔWDWWWɔɔƚ', // 12
    'ƚɔɔɔɔɔɔɔɔɔɔɔɔɔɐɐɔɔɔɔɔɔɔɔɔɔɔɔɔƚ', // 13
    'ƚRRRRRɔRRRRRɔɔɐɐɔɔRRRRRɔRRRRRƚ', // 14
    'ƚRRRRRɔRRRRRɔɔɐɐɔɔRRRRRɔRRRRRƚ', // 15
    'ƚWWWWWɔWWWWWlɔɐɐɔlWWWWWɔWWWWWƚ', // 16
    'ƚWDWWWɔWDWWWɔɔɐɐɔɔWDWWWɔWDWWWƚ', // 17
    'ƚɔɔɔɔɔɔɔɔɔɔɔɔɔɐɐɔɔɔɔɔɔɔɔɔɔɔɔɔƚ', // 18
    'ƚɔɔɔɔɔɔɔɔɔɔɔɔɔɐɐɔɔɔɔɔɔɔɔɔɔɔɔɔƚ', // 19
    'ƚRRRRRɔRRRRRɔɔɐɐɔɔRRRRRɔRRRRRƚ', // 20
    'ƚRRRRRɔRRRRRɔɔɐɐɔɔRRRRRɔRRRRRƚ', // 21
    'ƚWWWWWɔWWWWWlɔɐɐɔlWWWWWɔWWWWWƚ', // 22
    'ƚWDWWWɔWDWWWɔɔɐɐɔɔWDWWWɔWDWWWƚ', // 23
    'ƚɔɔɔɔɔɔɔɔɔɔɔɔɔɐɐɔɔɔɔɔɔɔɔɔɔɔɔɔƚ', // 24
    'ƚɔɔɔɔɔɔɔɔɔɔɔɔɔɐɐɔɔɔɔɔɔɔɔɔɔɔɔɔƚ', // 25
    'ƚRRRRRɔRRRRRɔɔɐɐɔɔRRRRRɔRRRRRƚ', // 26
    'ƚRRRRRɔRRRRRɔɔɐɐɔɔRRRRRɔRRRRRƚ', // 27
    'ƚWWWWWɔWWWWWlɔɐɐɔlWWWWWɔWWWWWƚ', // 28
    'ƚWDWWWɔWDWWWɔɔɐɐɔɔWDWWWɔWDWWWƚ', // 29
    'ƚɔɔɔɔɔɔɔɔɔɔɔɔɔɐɐɔɔɔɔɔɔɔɔɔɔɔɔɔƚ', // 30
    'ƚʕʕʕʕʕʕʕʕʕʕʕʕɔɐɐɔʕʕʕʕʕʕʕʕʕʕʕʕƚ', // 31
    'ƚʕʕʕʕʕʕʕʕʕʕʕʕɔɐɐɔʕʕʕʕʕʕʕʕʕʕʕʕƚ', // 32
    'ƚɔɔɔɔɔɔɔɔɔɔɔɔɔɐɐɔɔɔqqqɔɔɔɔɔɔɔƚ', // 33
    'ƚɔɔɔɔɔɔɔɔɔɔɔ<ɔɐɐɔɔɔqqqɔɔɔɔɔɔɔƚ', // 34
    'ƚɔɔɔɔɔɔɔɔɔɔɔɔɔɐɐɔɔɔɔɔɔɔɔɔɔɔɔɔƚ', // 35
  ]),
  doors: [
    { x: 14, y: 8, interior: 'hullUniversity' },
    { x: 4, y: 12, lockedDialogue: ['La bibliothèque Brynmor Jones. Silence, on révise !'] },
    { x: 23, y: 12, lockedDialogue: ["The Asylum, la boîte de l'université. Ça ouvre à 22 h !"] },
    { x: 2, y: 17, lockedDialogue: NOT_HOME },
    { x: 8, y: 17, lockedDialogue: BAR_CLOSED },
    { x: 19, y: 17, lockedDialogue: ['Un café de Newland Avenue. Fermé pour la journée.'] },
    { x: 25, y: 17, lockedDialogue: NOT_HOME },
    { x: 2, y: 23, interior: 'hullHouse' },   // la colocation de Romain et Paul
    { x: 8, y: 23, lockedDialogue: ["Une colocation d'étudiants. Ça sent les pâtes et le café froid."] },
    { x: 19, y: 23, lockedDialogue: BAR_CLOSED },
    { x: 25, y: 23, lockedDialogue: ["Une colocation. Quelqu'un joue de la guitare à l'étage."] },
    { x: 2, y: 29, lockedDialogue: NOT_HOME },
    { x: 8, y: 29, lockedDialogue: NOT_HOME },
    { x: 19, y: 29, lockedDialogue: NOT_HOME },
    { x: 25, y: 29, lockedDialogue: NOT_HOME },
  ],
  buildings: [
    { type: 'footballPitch', x: 2, y: 2, w: 7, h: 6 },
    { type: 'footballPitch', x: 21, y: 2, w: 7, h: 6 },
    { type: 'university', x: 10, y: 5 },
    { type: 'lab', x: 1, y: 9 },
    { type: 'asylum', x: 22, y: 9 },
    { type: 'house', x: 1, y: 14 },
    { type: 'pub', x: 7, y: 14 },
    { type: 'school', x: 18, y: 14 },
    { type: 'slateHouse', x: 24, y: 14 },
    { type: 'slateHouse', x: 1, y: 20 },
    { type: 'house', x: 7, y: 20 },
    { type: 'pub', x: 18, y: 20 },
    { type: 'cottage', x: 24, y: 20 },
    { type: 'greenHouse', x: 1, y: 26 },
    { type: 'house', x: 7, y: 26 },
    { type: 'slateHouse', x: 18, y: 26 },
    { type: 'house', x: 24, y: 26 },
    { type: 'bus', x: 19, y: 33, variant: 'hull' },
  ],
  // Le tablier du pont ferroviaire, au-dessus de la rue (on passe dessous).
  decals: [{ kind: 'railBridge', x: 12, y: 31, w: 6, above: true }],
  // Le bus local, à l'entrée de Newland Avenue : navette pour l'aéroport.
  objects: [19, 20, 21].flatMap((x) => [33, 34].map((y) => ({
    ...toAirport(x, y),
    readyDialogue: ["Tu prends le bus pour l'aéroport."],
  }))).concat([
    airportSign(12, 34, false),
    { x: 12, y: 9, dialogue: ['Université de Hull. Au fond, le jardin et son bassin.'] },
  ]),
  // Le bas de Newland Avenue mène à l'aéroport.
  triggers: [toAirport(14, 35), toAirport(15, 35)],
  surroundings: { outside, border: 'ƚ', borderSkip: ['ɐ'] },
  spawn: { x: 14, y: 34, facing: 'up' },
};
