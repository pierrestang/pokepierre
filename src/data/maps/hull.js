import { parseGrid } from './parseGrid.js';
import { toAirport } from './airportLinks.js';
import { FLAGS, ITEMS, TRAITS } from '../story.js';
import {
  ARRIVAL, OUSMANE_WALK, DAWN, NEXT_DAY, RESULTS, FAREWELL, HULL_SPOTS, NIGHT, DAWN_TIME,
} from '../hullStory.js';

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
const LACHER_PRISE = TRAITS.lacherPrise.id;
// Les adieux, devant chez Léo : une fois le diplôme en poche, jusqu'à ce que chacun ait annoncé son départ.
const FAREWELL_TIME = { ifItems: [ITEMS.diplomeHull.id], unlessFlags: [FLAGS.adieuxHull] };

// Hull (Angleterre), façon Rouge Feu, 30 x 48 cases. En haut, le campus (université, jardin et bassin derrière,
// deux terrains de football, bibliothèque Brynmor Jones, The Asylum) ; Newland Avenue descend tout droit,
// bordée de maisons mitoyennes, de pubs, d'un café et des colocations (Pierre et Ousmane, Charlotte et Anaïs,
// Léo avec Romain et Prophecy) ; le pont ferroviaire en briques « NEWLAND AVENUE » ; la grande rue est-ouest (arrêt
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
    'ƀƀƀƀƀƀƀƀƀƀƀƀƀƀƀƀƀƀƀƀƀƀƀƀƀƀƀƀƀƀ', // 0
    'ƀFFFFFFFFFffffffffffFFFFFFFFFƀ', // 1
    'ƀFRRRRRRRFƀ.~~~~~~.ƀFRRRRRRRFƀ', // 2
    'ƀFRRRRRRRFƀ.~~~~~~.ƀFRRRRRRRFƀ', // 3
    'ƀFRRRRRRRFff......ffFRRRRRRRFƀ', // 4
    'ƀFRRRRRRRFRRRRRRRRR.FRRRRRRRFƀ', // 5
    'ƀFRRRRRRRFRRRRRRRRR.FRRRRRRRFƀ', // 6
    'ƀFRRRRRRRFWWWWWWWWW.FRRRRRRRFƀ', // 7
    'ƀFFFFFFFFFWWWWDWWWW.FFFFFFFFFƀ', // 8
    'ƀRRRRRRRɔɔɔɔSɔɔɔɔɔɔɔɔɔRRRRRɔɔƀ', // 9
    'ƀRRRRRRRɔlɔɔɔɔɔɔɔɔɔɔlɔRRRRRɔɔƀ', // 10
    'ƀWWWWWWWɔɔɔɔɔɔɔɔɔɔɔɔɔɔWWWWWɔɔƀ', // 11
    'ƀWWWDWWWɔɔɔɔɔɔɔɔɔɔɔɔɔɔWDWWWɔɔƀ', // 12
    'ƀɔɔɔɔɔɔɔɔɔɔɔɔɔɐɐɔɔɔɔɔɔɔɔɔɔɔɔɔƀ', // 13
    'ƀRRRRRɔRRRRRɔɔɐɐɔɔRRRRRɔRRRRRƀ', // 14
    'ƀRRRRRɔRRRRRɔɔɐɐɔɔRRRRRɔRRRRRƀ', // 15
    'ƀWWWWWɔWWWWWlɔɐɐɔlWWWWWɔWWWWWƀ', // 16
    'ƀWDWWWɔWDWWWɔɔɐɐɔɔWDWWWɔWDWWWƀ', // 17
    'ƀɔɔɔɔɔɔɔɔɔɔɔɔɔɐɐɔɔɔɔɔɔɔɔɔɔɔɔɔƀ', // 18
    'ƀɔɔɔɔɔɔɔɔɔɔɔɔɔɐɐɔɔɔɔɔɔɔɔɔɔɔɔɔƀ', // 19
    'ƀRRRRRɔRRRRRɔɔɐɐɔɔRRRRRɔRRRRRƀ', // 20
    'ƀRRRRRɔRRRRRɔɔɐɐɔɔRRRRRɔRRRRRƀ', // 21
    'ƀWWWWWɔWWWWWlɔɐɐɔlWWWWWɔWWWWWƀ', // 22
    'ƀWDWWWɔWDWWWɔɔɐɐɔɔWDWWWɔWDWWWƀ', // 23
    'ƀɔɔɔɔɔɔɔɔɔɔɔɔɔɐɐɔɔɔɔɔɔɔɔɔɔɔɔɔƀ', // 24
    'ƀɔɔɔɔɔɔɔɔɔɔɔɔɔɐɐɔɔɔɔɔɔɔɔɔɔɔɔɔƀ', // 25
    'ƀRRRRRɔRRRRRɔɔɐɐɔɔRRRRRɔRRRRRƀ', // 26
    'ƀRRRRRɔRRRRRɔɔɐɐɔɔRRRRRɔRRRRRƀ', // 27
    'ƀWWWWWɔWWWWWlɔɐɐɔlWWWWWɔWWWWWƀ', // 28
    'ƀWDWWWɔWDWWWɔɔɐɐɔɔWDWWWɔWDWWWƀ', // 29
    'ƀɔɔɔɔɔɔɔɔɔɔɔɔɔɐɐɔɔɔɔɔɔɔɔɔɔɔɔɔƀ', // 30
    'ƀʕʕʕʕʕʕʕʕʕʕʕʕɔɐɐɔʕʕʕʕʕʕʕʕʕʕʕʕƀ', // 31
    'ƀʕʕʕʕʕʕʕʕʕʕʕʕɔɐɐɔʕʕʕʕʕʕʕʕʕʕʕʕƀ', // 32
    'ƀɔɔɔɔɔlɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔlɔɔɔɔɔɔƀ', // 33
    'ɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐ', // 34
    'ɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐ', // 35
    'ƀɔɔɔɔɔɔɔɔbSɔɔɔɔɔɔɔɔbɔɔɔɔɔɔɔɔɔƀ', // 36
    'ƀqqqɔRRRRRRR........ɔɔɔɔɔɔɔɔɔƀ', // 37
    'ƀqqqɔRRRRRRR.ƀ....ƀ.ɔRRRRRRɔɔƀ', // 38
    'ƀɔɔɔɔRRRRRRR..ffff..ɔRRRRRRɔɔƀ', // 39
    'ƀɔɔɔɔWWWWWWW........ɔWWWWWWɔɔƀ', // 40
    'ƀɔɔɔɔWWWDWWW.ƀ....ƀ.ɔWDWWWWɔlƀ', // 41
    'ƀɔɔɔɔɔɔɔɔɔɔɔlɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔƀ', // 42
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
      lock: { ifFlags: [FLAGS.lendemainHull] },
      lockedDialogue: ['La bibliothèque Brynmor Jones. Silence, on révise !'],
    },
    {
      x: 23, y: 12, interior: 'hullAsylum',
      lock: { ifFlags: [FLAGS.flechettesJouees], unlessFlags: [FLAGS.asylumFini] },
      lockedDialogue: ["The Asylum, la boîte de l'université. Ça ouvre à 22 h !"],
    },
    { x: 2, y: 17, lockedDialogue: NOT_HOME },
    {
      x: 8, y: 17, interior: 'hullPubA',
      lock: { ifFlags: [FLAGS.leoPlan], unlessFlags: [FLAGS.asylumFini] },
      lockedDialogue: ["The pub is closed. Le pub n'ouvre que le soir."],
    },
    { x: 19, y: 17, lockedDialogue: ['Un café de Newland Avenue. Fermé pour la journée.'] },
    {
      x: 25, y: 17, interior: 'hullHouse',       // chez Léo, avec Romain et Prophecy
      lock: { ifFlags: [FLAGS.leoAppel] },
      lockedDialogue: ["La maison de Léo, Romain et Prophecy. Personne ne répond pour l'instant."],
    },
    {
      x: 2, y: 23, interior: 'hullColoc',        // la coloc de Pierre et Ousmane
      lock: { ifFlags: [FLAGS.hullAccueil] },
      lockedDialogue: NOT_HOME,
    },
    { x: 8, y: 23, lockedDialogue: ['La coloc de Charlotte et Anaïs. Personne ne répond.'] },
    {
      x: 19, y: 23, interior: 'hullPubB',
      lock: { ifFlags: [FLAGS.tourneeServie], unlessFlags: [FLAGS.asylumFini] },
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
    // Le panneau de l'université : les résultats de l'examen, le jour venu.
    { x: 12, y: 9, ifFlags: [FLAGS.jourResultats], unlessItems: [ITEMS.diplomeHull.id], script: RESULTS },
    { x: 12, y: 9, dialogue: ['Université de Hull. Au fond, le jardin et son bassin.'] },
    { x: 10, y: 36, dialogue: ['À Hull, les cabines sont crème. Allez savoir pourquoi.'] },
  ]),
  npcs: [
    // Arrivée : Ousmane attend à l'arrêt de bus, puis marche devant jusqu'à la coloc.
    {
      id: 'ousmane-arrivee', name: 'Ousmane', x: HULL_SPOTS.busStop[0], y: HULL_SPOTS.busStop[1], facing: 'left',
      ifFlags: [FLAGS.arriveeHull], unlessFlags: [FLAGS.ousmaneRentre],
      dialogue: ['Viens, je te montre la coloc.'],
    },
    // Au petit matin, toute la bande devant l'Asylum.
    ...[['leo-aube', 'Léo', 22, 13, 'right', 'Demain, bibliothèque. Tout le monde.'],
      ['ousmane-aube', 'Ousmane', 21, 12, 'down', 'Allez, on rentre se coucher.'],
      ['charlotte-aube', 'Charlotte', 20, 13, 'right', 'Les exams… on en reparle demain.'],
      ['anais-aube', 'Anaïs', 27, 13, 'left', 'Je sens plus mes pieds.'],
      ['romain-aube', 'Romain', 18, 13, 'right', 'Quelle nuit !'],
      ['prophecy-aube', 'Prophecy', 19, 12, 'down', 'On refait ça quand ?']].map(([id, name, x, y, facing, line]) => ({
      id, name, x, y, facing, ...DAWN_TIME, dialogue: [line],
    })),
    // Le jour des résultats : Léo devant l'université.
    {
      id: 'leo-resultats', name: 'Léo', x: 13, y: 9, facing: 'left',
      ifFlags: [FLAGS.jourResultats], unlessItems: [ITEMS.diplomeHull.id],
      dialogue: ['Les résultats sont sur le panneau. Va voir !'],
    },
    // Les adieux, devant chez Léo : chacun part en échange (voir hullStory.js FAREWELL).
    ...[['leo-adieux', 'Léo', 24, 18, 'down'], ['ousmane-adieux', 'Ousmane', 26, 18, 'down'],
      ['charlotte-adieux', 'Charlotte', 22, 19, 'right'], ['anais-adieux', 'Anaïs', 21, 18, 'right'],
      ['prophecy-adieux', 'Prophecy', 27, 19, 'left'], ['romain-adieux', 'Romain', 20, 19, 'right']].map(([id, name, x, y, facing]) => ({
      id, name, x, y, facing, ...FAREWELL_TIME, script: FAREWELL,
    })),
    // Léo et Ousmane restent à Hull : ils gardent la maison.
    {
      id: 'leo-maison-garde', name: 'Léo', x: 24, y: 18, facing: 'down',
      ifFlags: [FLAGS.adieuxHull], unlessFlags: [FLAGS.arriveeHanoi], dialogue: ['Hanoï, hein. Nous on garde la maison.'],
    },
    {
      id: 'ousmane-maison-garde', name: 'Ousmane', x: 26, y: 18, facing: 'down',
      ifFlags: [FLAGS.adieuxHull], unlessFlags: [FLAGS.arriveeHanoi], dialogue: ['Reviens avec des histoires.'],
    },
  ],
  events: [
    { on: 'enter', ifFlags: [FLAGS.arriveeHull], unlessFlags: [FLAGS.hullAccueil], steps: ARRIVAL },
    { on: 'enter', ifFlags: [FLAGS.hullAccueil], unlessFlags: [FLAGS.ousmaneRentre], steps: OUSMANE_WALK },
    { on: 'enter', ifFlags: [FLAGS.asylumFini], unlessSouvenirs: [LACHER_PRISE], steps: DAWN },
    // En sortant de la bibliothèque : le lendemain, les résultats.
    { on: 'enter', ifFlags: [FLAGS.revisions], unlessFlags: [FLAGS.jourResultats], steps: NEXT_DAY },
  ],
  // La grande rue mène à l'aéroport par ses deux bouts.
  triggers: [toAirport(0, 34), toAirport(0, 35), toAirport(29, 34), toAirport(29, 35)],
  night: { ...NIGHT, lights: [[9, 16, 0xffc060], [20, 22, 0xffc060], [25, 10, 0xd070ff], [14, 7, 0xffe0a0]] },
  dawn: DAWN_TIME,
  rain: {},
  surroundings: { outside, border: 'ƀ', borderSkip: ['ɐ', '~'] },
  spawn: { x: 1, y: 35, facing: 'right' },
};
