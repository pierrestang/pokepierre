import { parseGrid } from './parseGrid.js';
import { toAirport, airportSign } from './airportLinks.js';
import { FLAGS, ROLES } from '../story.js';
import { ARRIVAL, OUSMANE_WALK, DAWN, HULL_SPOTS, NIGHT, DAWN_TIME } from '../hullStory.js';

// Hors de la carte : Newland Avenue et la grande rue se prolongent, l'estuaire au sud, trottoirs ailleurs.
function outside(x, y, grid) {
  if (y >= grid.length - 5) return '~';
  if (y >= 0 && y < grid.length) {
    const edge = grid[y][x < 0 ? 0 : grid[0].length - 1];
    if (['ɐ', 'ɔ', '~'].includes(edge)) return edge;
  }
  return 'ɔ';
}

const NOT_HOME = ["Ce n'est pas chez toi."];
const BANDE = ROLES.bandeHull.id;

// Hull (Angleterre), façon Rouge Feu, 30 x 48 cases. En haut, le campus (université, jardin et bassin derrière,
// deux terrains de football, bibliothèque Brynmor Jones, The Asylum) ; Newland Avenue descend tout droit,
// bordée de maisons mitoyennes, de pubs, d'un café et des colocations (Pierre et Ousmane, Charlotte et Anaïs,
// Léo avec Romain et Paul) ; le pont ferroviaire en briques « NEWLAND AVENUE » ; la grande rue est-ouest (arrêt
// du bus rouge à l'ouest, aéroport aux deux bouts, cabines crème) ; Hull Minster, un square et The Deep sur le
// quai ; l'estuaire de la Humber, la marina et le pont de la Humber au loin. Il pleut (le jour) ; la ville passe
// en nuit pendant la soirée de Léo, puis au petit matin à la sortie de l'Asylum.
// Scénario : voir data/hullStory.js.
// Légende : voir src/data/tiles.js (ɐ = chaussée, ɔ = trottoir, ʕ = remblai du pont, F = barrière, ~ = eau,
// = = ponton, B = bateau, b = cabine crème, q = bus, l = réverbère, S = panneau, f = fleurs, ƚ = petit arbre,
// R / W / D = toit, mur, porte)
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
    'ƚɔɔɔɔɔlɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔlɔɔɔɔɔɔƚ', // 33
    'ɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐ', // 34
    'ɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐ', // 35
    'ƚɔɔɔɔɔɔɔɔbSɔɔɔɔɔɔɔɔbɔɔɔɔɔɔɔɔɔƚ', // 36
    'ƚqqqɔRRRRRRR........ɔɔɔɔɔɔɔɔɔƚ', // 37
    'ƚqqqɔRRRRRRR.ƚ....ƚ.ɔRRRRRRɔɔƚ', // 38
    'ƚɔɔɔɔRRRRRRR..ffff..ɔRRRRRRɔɔƚ', // 39
    'ƚɔɔɔɔWWWWWWW........ɔWWWWWWɔɔƚ', // 40
    'ƚɔɔɔɔWWWDWWW.ƚ....ƚ.ɔWDWWWWɔlƚ', // 41
    'ƚɔɔɔɔɔɔɔɔɔɔɔlɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔƚ', // 42
    '~~~~~~~~~~~~~~~==~~~~~~~~~~~~~', // 43
    '~~~~~~~~~~BBB~~==~~BBB~~~~~~~~', // 44
    '~~~~~~~~~~BBB~~==~~BBB~~~~~~~~', // 45
    '~~~~~~~~~~~~~~~==~~~~~~~~~~~~~', // 46
    '~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~', // 47
  ]),
  doors: [
    { x: 14, y: 8, interior: 'hullUniversity' },
    {
      x: 4, y: 12, interior: 'hullLibrary',
      lock: { ifSouvenirs: [BANDE] },
      lockedDialogue: ['La bibliothèque Brynmor Jones. Silence, on révise !'],
    },
    {
      x: 23, y: 12, interior: 'hullAsylum',
      lock: { ifFlags: [FLAGS.tableTrouvee], unlessFlags: [FLAGS.asylumFini] },
      lockedDialogue: ["The Asylum, la boîte de l'université. Ça ouvre à 22 h !"],
    },
    { x: 2, y: 17, lockedDialogue: NOT_HOME },
    {
      x: 8, y: 17, interior: 'hullPubA',
      lock: { ifFlags: [FLAGS.amiesSuivent], unlessFlags: [FLAGS.asylumFini] },
      lockedDialogue: ["The pub is closed. Le pub n'ouvre que le soir."],
    },
    { x: 19, y: 17, lockedDialogue: ['Un café de Newland Avenue. Fermé pour la journée.'] },
    {
      x: 25, y: 17, interior: 'hullHouse',       // chez Léo, avec Romain et Paul
      lock: { ifFlags: [FLAGS.leoAppel] },
      lockedDialogue: ["La maison de Léo, Romain et Paul. Personne ne répond pour l'instant."],
    },
    {
      x: 2, y: 23, interior: 'hullColoc',        // la coloc de Pierre et Ousmane
      lock: { ifFlags: [FLAGS.hullAccueil] },
      lockedDialogue: NOT_HOME,
    },
    {
      x: 8, y: 23, interior: 'hullColoc2',       // la coloc de Charlotte et Anaïs
      lock: { ifFlags: [FLAGS.leoPlan] },
      lockedDialogue: ['La coloc de Charlotte et Anaïs. « On se prépare ! »'],
    },
    {
      x: 19, y: 23, interior: 'hullPubB',
      lock: { ifFlags: [FLAGS.pinteCommandee], unlessFlags: [FLAGS.asylumFini] },
      lockedDialogue: ["The pub is closed. Le pub n'ouvre que le soir."],
    },
    { x: 25, y: 23, lockedDialogue: NOT_HOME },
    { x: 2, y: 29, lockedDialogue: NOT_HOME },
    { x: 8, y: 29, lockedDialogue: NOT_HOME },
    { x: 19, y: 29, lockedDialogue: NOT_HOME },
    { x: 25, y: 29, lockedDialogue: NOT_HOME },
    { x: 8, y: 41, lockedDialogue: ['Hull Minster, la grande église de la vieille ville. Fermée à cette heure.'] },
    { x: 22, y: 41, lockedDialogue: ["The Deep. L'aquarium ouvre à 10 h."] },
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
    { type: 'bus', x: 1, y: 37, variant: 'hull' },
    { type: 'minster', x: 5, y: 37 },
    { type: 'theDeep', x: 21, y: 38 },
    { type: 'boat', x: 10, y: 44 },
    { type: 'boat', x: 19, y: 44 },
  ],
  decals: [
    { kind: 'railBridge', x: 12, y: 31, w: 6, above: true },   // le tablier du pont : on passe dessous
    { kind: 'humberBridge', x: 21, y: 46, w: 8 },               // le pont de la Humber, au loin
  ],
  // Le bus rouge, au bout ouest de la grande rue : navette pour l'aéroport.
  objects: [1, 2, 3].flatMap((x) => [37, 38].map((y) => ({
    ...toAirport(x, y),
    readyDialogue: ["Tu prends le bus rouge pour l'aéroport."],
  }))).concat([
    { x: 12, y: 9, dialogue: ['Université de Hull. Au fond, le jardin et son bassin.'] },
    { x: 10, y: 36, dialogue: ['À Hull, les cabines sont crème. Allez savoir pourquoi.'] },
  ]),
  npcs: [
    // Arrivée : Ousmane attend à l'arrêt de bus, puis marche devant jusqu'à la coloc.
    {
      id: 'ousmane-arrivee', name: 'Ousmane', x: HULL_SPOTS.busStop[0], y: HULL_SPOTS.busStop[1], facing: 'left',
      ifFlags: [FLAGS.arriveeHull], unlessFlags: [FLAGS.ousmaneRentre],
      dialogue: ['Viens, je te montre la coloc. Suis-moi !'],
    },
    // Soirée : Léo attend devant l'étape suivante et y marche devant toi.
    ...[
      [HULL_SPOTS.leoDoor, [FLAGS.leoPlan], [FLAGS.ousmaneSuit]],
      [[3, 24], [FLAGS.ousmaneSuit], [FLAGS.amiesSuivent]],
      [[9, 24], [FLAGS.amiesSuivent], [FLAGS.pinteCommandee]],
      [[9, 18], [FLAGS.pinteCommandee], [FLAGS.tableTrouvee]],
      [[20, 24], [FLAGS.tableTrouvee], [FLAGS.asylumFini]],
    ].map(([[x, y], ifFlags, unlessFlags], i) => ({
      id: `leo-${i}`, name: 'Léo', x, y, facing: 'down', ifFlags, unlessFlags,
      dialogue: ['Allez, suis-moi ! La soirée ne fait que commencer.'],
    })),
    // Au petit matin, devant l'Asylum.
    {
      id: 'leo-aube', name: 'Léo', x: 22, y: 13, facing: 'right',
      ifFlags: [FLAGS.asylumFini], unlessSouvenirs: [BANDE],
      dialogue: ['Demain, bibliothèque. Tout le monde.'],
    },
  ],
  events: [
    { on: 'enter', ifFlags: [FLAGS.arriveeHull], unlessFlags: [FLAGS.hullAccueil], steps: ARRIVAL },
    { on: 'enter', ifFlags: [FLAGS.hullAccueil], unlessFlags: [FLAGS.ousmaneRentre], steps: OUSMANE_WALK },
    // Léo marche vers l'étape suivante de la soirée.
    ...[
      [[3, 24], [FLAGS.leoPlan], [FLAGS.ousmaneSuit]],
      [[9, 24], [FLAGS.ousmaneSuit], [FLAGS.amiesSuivent]],
      [[9, 18], [FLAGS.amiesSuivent], [FLAGS.pinteCommandee]],
      [[20, 24], [FLAGS.pinteCommandee], [FLAGS.tableTrouvee]],
      [[22, 13], [FLAGS.tableTrouvee], [FLAGS.asylumFini]],
    ].map(([to, ifFlags, unlessFlags], i) => ({
      on: 'enter', ifFlags, unlessFlags, steps: [{ walk: `leo-${i}`, to, lead: true }],
    })),
    { on: 'enter', ifFlags: [FLAGS.asylumFini], unlessSouvenirs: [BANDE], steps: DAWN },
  ],
  // La grande rue mène à l'aéroport par ses deux bouts.
  triggers: [toAirport(0, 34), toAirport(0, 35), toAirport(29, 34), toAirport(29, 35)],
  night: { ...NIGHT, lights: [[9, 16, 0xffc060], [20, 22, 0xffc060], [25, 10, 0xd070ff], [14, 7, 0xffe0a0]] },
  dawn: DAWN_TIME,
  rain: {},
  surroundings: { outside, border: 'ƚ', borderSkip: ['ɐ', '~'] },
  spawn: { x: 1, y: 35, facing: 'right' },
};
