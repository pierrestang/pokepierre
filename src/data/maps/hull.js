import { parseGrid } from './parseGrid.js';
// Le dessin de la carte : fait avec le créateur de cartes ; ses collisions s'imposent à la grille du jeu (voir builtGrid).
// La grille (sourceGrid) en est tirée : portes, pavés, eau, ponton.
import BUILT from '../builtMaps/hull.json' with { type: 'json' };
import { builtGrid } from './builtGrid.js';
import { toAirport } from './airportLinks.js';
import { FLAGS, ITEMS, TRAITS } from '../story.js';
import {
  ARRIVAL, OUSMANE_WALK, DAWN, NEXT_DAY, RESULTS, FAREWELL, HULL_SPOTS, NIGHT, DAWN_TIME,
} from '../hullStory.js';

// Hors de la carte : la grande rue se prolonge à l'est et à l'ouest, l'estuaire au sud, les arbres ailleurs.
function outside(x, y, grid) {
  if (y >= grid.length - 6) return '~';
  if (y >= 0 && y < grid.length) {
    const edge = grid[y][x < 0 ? 0 : grid[0].length - 1];
    if (['ɔ', '.', '=', '~'].includes(edge)) return edge;
  }
  return 'ƀ';
}

const NOT_HOME = ["Ce n'est pas chez toi."];
const INSOUCIANCE = TRAITS.insouciance.id;
// Les adieux, devant chez Léo : une fois le diplôme en poche, jusqu'à ce que chacun ait annoncé son départ.
const FAREWELL_TIME = { ifItems: [ITEMS.diplomeHull.id], unlessFlags: [FLAGS.adieuxHull] };

// Hull (Angleterre), 40 x 50 cases, redessinée dans le créateur (octobre 2026 ; la grille du jeu est tirée du dessin).
// En haut, le campus : la bibliothèque Brynmor Jones (immeuble à jardinières), l'université (manoir de pierre) et
// The Asylum (boutique au store rayé), avec le panneau des résultats. Newland Avenue descend tout droit : chez Léo (avec
// Romain et Prophecy, la longère au toit d'ardoise) et, en face, un café et le premier pub ; plus bas, la coloc de Pierre
// et Ousmane, celle de Charlotte et Anaïs, et le second pub. Les pubs sont les immeubles à jardinières de l'avenue. La grande rue est-ouest mène à l'aéroport par ses deux
// bouts ; le square et sa fontaine, le quai, l'estuaire de la Humber. Il pleut (le jour) ; la ville passe en nuit
// pendant la soirée de Léo, puis au petit matin à la sortie de l'Asylum.
// Scénario : voir data/hullStory.js.
// Légende : voir src/data/tiles.js (ɔ = pavés, ~ = eau, = = ponton, B = bateau, l = réverbère, S = panneau,
// W / D = bâtiment, porte)
export const hullMap = {
  id: 'hull',
  name: 'Hull',
  built: BUILT,
  sourceGrid: parseGrid([
    'ƀƀƀƀƀƀƀƀƀƀƀƀƀƀƀƀƀƀƀƀƀƀƀƀƀƀƀƀƀƀƀƀƀƀƀƀƀƀƀƀ', // 0  arbres : bord de l'écran
    'ƀƀƀƀƀƀƀƀƀƀƀƀƀƀƀƀƀƀƀƀƀƀƀƀƀƀƀƀƀƀƀƀƀƀƀƀƀƀƀƀ', // 1
    'ƀƀ....................................ƀƀ', // 2  le campus
    'ƀƀ....................................ƀƀ', // 3
    'ƀƀ...WWWWW............................ƀƀ', // 4
    'ƀƀ...WWWWW...WWWWWWWWW..WWWWWWWWWWWWW.ƀƀ', // 5
    'ƀƀ...WWWWW...WWWWWWWWW..WWWWWWWWWWWWW.ƀƀ', // 6
    'ƀƀ...WWWWW...WWWWWWWWW..WWWWWWWWWWWWW.ƀƀ', // 7
    'ƀƀ...WWDWW...WWWWDWWWW..WWWWWDWWWWWWW.ƀƀ', // 8  portes : la bibliothèque (7), l'université (17), The Asylum (29)
    'ƀƀ....ɔɔɔ.......ɔɔɔ.........ɔɔɔ.......ƀƀ', // 9
    'ƀƀ....ɔɔɔ.....l.ɔɔɔ.l.......ɔɔɔ.......ƀƀ', // 10
    'ƀƀ....ɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔ.......ƀƀ', // 11  Newland Avenue part du campus et descend
    'ƀƀ.....ɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔ........ƀƀ', // 12
    'ƀƀ..........SS.ɔɔɔɔɔ..................ƀƀ', // 13  le panneau de l'université (résultats)
    'ƀƀ..............ɔɔɔ...................ƀƀ', // 14
    'ƀƀ.............ɔɔɔɔɔ..................ƀƀ', // 15
    'ƀƀ.ɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔWWWWWWWɔɔɔɔɔ.ƀƀ', // 16
    'ƀƀ.ɔWWWWWWWWWWWɔɔɔɔɔɔWWWWWWWWWWWWWWWɔ.ƀƀ', // 17
    'ƀƀ.ɔWWWWWWWWWWWɔɔɔɔɔɔWWWWWWWWWWWWWWWɔ.ƀƀ', // 18
    'ƀƀ.ɔWWWWWWWWWWWɔɔɔɔɔɔWWWWWWWWWWWWWWWɔ.ƀƀ', // 19
    'ƀƀ.ɔɔɔɔɔWDWɔɔɔɔɔɔɔɔɔlWDWWWWWDWWWWDWWɔ.ƀƀ', // 20  portes : le premier pub (9), le second pub (22), chez Léo (28), le café (33)
    'ƀƀ.ɔlɔɔɔɔɔɔɔɔɔlɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔ.ƀƀ', // 21
    'ƀƀ.ɔlɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔ.ƀƀ', // 22
    'ƀƀ.............ɔɔɔɔɔ..................ƀƀ', // 23
    'ƀƀ..............ɔɔɔ...................ƀƀ', // 24
    'ƀƀ..............ɔɔɔ...................ƀƀ', // 25
    'ƀƀ.............ɔɔɔɔɔ..................ƀƀ', // 26
    'ƀƀ.ɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔWWWWWWW.ƀƀ', // 27
    'ƀƀ.WWWWWWɔWWWWɔɔɔɔɔɔɔWWWWɔWWWWWWWWWWW.ƀƀ', // 28
    'ƀƀ.WWWWWWɔWWWWɔɔɔɔɔɔɔWWWWɔWWWWWWWWWWW.ƀƀ', // 29
    'ƀƀ.ɔWWWWWɔWWWWɔɔɔɔɔɔɔWWWWɔWWWWWWWWWWW.ƀƀ', // 30
    'ƀƀ.ɔWWWWWɔWDWWWɔɔɔɔɔlWDWWɔWDWWWWWDWWW.ƀƀ', // 31  portes : ta coloc (11), Charlotte et Anaïs (22), deux maisons (27, 33)
    'ɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔ', // 32  la grande rue : aéroport aux deux bouts (rangées 32-35)
    'ɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔlɔɔɔ', // 33
    'ɔɔɔɔɔɔɔɔɔɔɔɔɔɔ........ɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔ', // 34
    'ɔɔɔɔɔɔɔɔɔɔɔɔɔ..........ɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔ', // 35
    '.......ɔɔɔɔɔɔ...WWWW...ɔɔɔɔɔɔ...........', // 36  le square et sa fontaine
    '..WWWW..ɔɔɔɔɔ...WWWW...ɔɔɔɔɔ..WWWW......', // 37
    '..WWWW..ɔɔɔɔɔ...WWWW...ɔɔɔɔɔ..WWWW......', // 38
    '..WWWW..ɔɔɔɔɔɔ........ɔɔɔɔɔɔ..WWWW......', // 39
    '.......ɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔ...........', // 40
    '========================================', // 41  le quai
    '========================================', // 42
    '========BBBBBBBB======BBBBBBBB====BBBBB=', // 43
    '~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~', // 44  l'estuaire de la Humber
    '~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~', // 45
    '~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~', // 46
    '~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~', // 47
    '~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~', // 48
    '~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~', // 49
  ]),
  doors: [
    { x: 17, y: 8, interior: 'hullUniversity' },                  // le manoir de pierre, au centre du campus
    {
      x: 7, y: 8, interior: 'hullLibrary',                        // l'immeuble à jardinières, à gauche du campus
      lock: { ifFlags: [FLAGS.lendemainHull] },
      lockedDialogue: ['La bibliothèque Brynmor Jones. Silence, on révise !'],
    },
    {
      x: 29, y: 8, interior: 'hullAsylum',                        // la boutique au store rayé, à droite du campus
      lock: { ifFlags: [FLAGS.flechettesJouees], unlessFlags: [FLAGS.asylumFini] },
      lockedDialogue: ["The Asylum, la boîte de l'université. Ça ouvre à 22 h !"],
    },
    {
      x: 9, y: 20, interior: 'hullHouse',                         // chez Léo, avec Romain et Prophecy : la longère
      lock: { ifFlags: [FLAGS.leoAppel] },
      lockedDialogue: ["La maison de Léo, Romain et Prophecy. Personne ne répond pour l'instant."],
    },
    { x: 22, y: 20, lockedDialogue: ['Un café de Newland Avenue. Fermé pour la journée.'] },
    {
      x: 28, y: 20, interior: 'hullPubA',                         // l'immeuble à jardinières, en haut de l'avenue
      lock: { ifFlags: [FLAGS.leoPlan], unlessFlags: [FLAGS.asylumFini] },
      lockedDialogue: ["The pub is closed. Le pub n'ouvre que le soir."],
    },
    { x: 33, y: 20, lockedDialogue: NOT_HOME },
    {
      x: 11, y: 31, interior: 'hullColoc',                        // la coloc de Pierre et Ousmane
      lock: { ifFlags: [FLAGS.hullAccueil] },
      lockedDialogue: NOT_HOME,
    },
    { x: 22, y: 31, lockedDialogue: ['La coloc de Charlotte et Anaïs. Personne ne répond.'] },
    { x: 27, y: 31, lockedDialogue: NOT_HOME },
    {
      x: 33, y: 31, interior: 'hullPubB',                         // l'immeuble à jardinières, plus bas
      lock: { ifFlags: [FLAGS.tourneeServie], unlessFlags: [FLAGS.asylumFini] },
      lockedDialogue: ["The pub is closed. Le pub n'ouvre que le soir."],
    },
  ],
  // Les bâtiments sont dans le dessin ; la liste d'origine sert à la conversion.
  buildings: [],
  // Redessinée à la main (octobre 2026) : plus de bâtiments d'origine à convertir.
  sourceBuildings: [],
  objects: [
    // Le panneau de l'université : les résultats de l'examen, le jour venu.
    ...[12, 13].flatMap((x) => [
      { x, y: 13, ifFlags: [FLAGS.jourResultats], unlessItems: [ITEMS.diplomeHull.id], script: RESULTS },
      { x, y: 13, dialogue: ['Université de Hull. Le campus, en haut de Newland Avenue.'] },
    ]),
  ],
  npcs: [
    // Arrivée : Ousmane attend au bout de la grande rue, puis marche devant jusqu'à la coloc.
    {
      id: 'ousmane-arrivee', name: 'Ousmane', x: HULL_SPOTS.arrival[0], y: HULL_SPOTS.arrival[1], facing: 'left',
      ifFlags: [FLAGS.arriveeHull], unlessFlags: [FLAGS.ousmaneRentre],
      dialogue: ['Viens, je te montre la coloc.'],
    },
    // Au petit matin, toute la bande devant l'Asylum, de part et d'autre de la porte : la rangée du dessous reste libre
    // pour Léo, qui part dans la mauvaise direction (vers l'est, voir hullStory.js DAWN).
    ...[['leo-aube', 'Léo', 30, 10, 'left', 'Demain, bibliothèque. Tout le monde.'],
      ['ousmane-aube', 'Ousmane', 27, 9, 'down', 'Allez, on rentre se coucher.'],
      ['charlotte-aube', 'Charlotte', 26, 9, 'down', 'Les exams… on en reparle demain.'],
      ['anais-aube', 'Anaïs', 31, 9, 'down', 'Je sens plus mes pieds.'],
      ['romain-aube', 'Romain', 32, 9, 'down', 'Quelle nuit !'],
      ['prophecy-aube', 'Prophecy', 25, 9, 'down', 'On refait ça quand ?']].map(([id, name, x, y, facing, line]) => ({
      id, name, x, y, facing, ...DAWN_TIME, dialogue: [line],
    })),
    // Le jour des résultats : Léo devant l'université.
    {
      id: 'leo-resultats', name: 'Léo', x: 14, y: 13, facing: 'left',
      ifFlags: [FLAGS.jourResultats], unlessItems: [ITEMS.diplomeHull.id],
      dialogue: ['Les résultats sont sur le panneau. Va voir !'],
    },
    // Les adieux, devant chez Léo : chacun part en échange (voir hullStory.js FAREWELL).
    ...[['leo-adieux', 'Léo', 8, 21, 'down'], ['ousmane-adieux', 'Ousmane', 10, 21, 'down'],
      ['charlotte-adieux', 'Charlotte', 7, 22, 'right'], ['anais-adieux', 'Anaïs', 6, 21, 'right'],
      ['prophecy-adieux', 'Prophecy', 11, 22, 'left'], ['romain-adieux', 'Romain', 6, 22, 'right']].map(([id, name, x, y, facing]) => ({
      id, name, x, y, facing, ...FAREWELL_TIME, script: FAREWELL,
    })),
    // Léo et Ousmane restent à Hull : ils gardent la maison.
    {
      id: 'leo-maison-garde', name: 'Léo', x: 8, y: 21, facing: 'down',
      ifFlags: [FLAGS.adieuxHull], unlessFlags: [FLAGS.arriveeHanoi], dialogue: ['Hanoï, hein. Nous on garde la maison.'],
    },
    {
      id: 'ousmane-maison-garde', name: 'Ousmane', x: 10, y: 21, facing: 'down',
      ifFlags: [FLAGS.adieuxHull], unlessFlags: [FLAGS.arriveeHanoi], dialogue: ['Reviens avec des histoires.'],
    },
  ],
  events: [
    { on: 'enter', ifFlags: [FLAGS.arriveeHull], unlessFlags: [FLAGS.hullAccueil], steps: ARRIVAL },
    { on: 'enter', ifFlags: [FLAGS.hullAccueil], unlessFlags: [FLAGS.ousmaneRentre], steps: OUSMANE_WALK },
    { on: 'enter', ifFlags: [FLAGS.asylumFini], unlessSouvenirs: [INSOUCIANCE], steps: DAWN },
    // En sortant de la bibliothèque : le lendemain, les résultats.
    { on: 'enter', ifFlags: [FLAGS.revisions], unlessFlags: [FLAGS.jourResultats], steps: NEXT_DAY },
  ],
  // La grande rue mène à l'aéroport par ses deux bouts.
  triggers: [32, 33, 34, 35].flatMap((y) => [toAirport(0, y), toAirport(39, y)]),
  // Les deux pubs, l'Asylum et l'université éclairés pendant la soirée.
  night: { ...NIGHT, lights: [[28, 19, 0xffc060], [33, 30, 0xffc060], [29, 7, 0xd070ff], [17, 7, 0xffe0a0]] },
  dawn: DAWN_TIME,
  rain: {},
  surroundings: { outside, border: 'ƀ', borderSkip: ['ɔ', '~'] },
  spawn: { x: 1, y: 35, facing: 'right' },
};

// La grille du jeu : celle d'origine, accordée aux collisions du dessin.
hullMap.grid = builtGrid(hullMap.sourceGrid, BUILT);
