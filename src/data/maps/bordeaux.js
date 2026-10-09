import { parseGrid } from './parseGrid.js';
// Le dessin de la carte : la version Gen 4 faite avec le créateur de cartes (scripts/convert_maps_v2.py, thème Gen 4,
// scripts/g4_theme.py) ; ses collisions s'imposent à la grille du jeu (voir builtGrid). La grille et les bâtiments
// d'origine restent la source de la conversion (sourceGrid, sourceBuildings).
import BUILT from '../builtMaps/bordeaux.json' with { type: 'json' };
import { builtGrid } from './builtGrid.js';
import { toAirport, airportSign } from './airportLinks.js';
import { FLAGS, ITEMS } from '../story.js';
import {
  ARRIVAL, FRONT_DOOR, MONTHS_LATER, OUSMANE_AFTER_ORAL, OUSMANE_AT_DOOR, OUSMANE_REMINDS, REMI_AT_KEDGE, CYCLIST,
  ANTITHEFT_KEY, BACK_FROM_DELHI,
} from '../bordeauxStory.js';

// Les gardiens des sorties est : leurs répliques, et l'arrêt quand Pierre passe à côté d'eux (il se tourne vers lui, parle,
// et Pierre recule d'un pas).
const AIRPORT_GUARD = ["Halte ! Par ici, c'est l'aéroport.", "Pas de diplôme d'anglais, pas d'avion. L'oral, c'est à KEDGE, de l'autre côté de la Garonne."];
const ROAD_WORKER = ['Holà ! Travaux sur la route de Paris, personne ne passe.', 'Reviens plus tard. On aura peut-être fini… peut-être.'];
const stopped = (id, speaker, lines, facing, back) => [
  { face: { [id]: facing } },
  { emote: id, kind: 'surprise' },
  { speaker, say: lines },
  { goTo: back, facing: 'right' },
];

// Hors de la carte (bandes qui complètent l'écran) : la Garonne, les rues et les trottoirs
// de chaque rangée se prolongent ; ailleurs, herbe près de l'eau, sol de ville sinon.
function outside(x, y, grid) {
  const W = grid[0].length;
  const H = grid.length;
  if (y >= 0 && y < H) {
    const edge = grid[y][x < 0 ? 0 : W - 1];
    if (['G', 'ɐ', 'ɔ'].includes(edge)) return edge;
  }
  const riverRows = grid.map((row, i) => (row[0] === 'G' ? i : null)).filter((i) => i !== null);
  const distance = Math.min(...riverRows.map((r) => Math.abs(r - y)));
  return distance <= 4 ? '.' : 'ɔ';
}

// Bordeaux — grande ville traversée par la Garonne, 32 x 40 cases (redessinée dans le créateur, octobre 2026 ; la grille
// du jeu est tirée du dessin). Scénario : voir data/bordeauxStory.js.
// Légende : voir src/data/tiles.js (A = rue, C = trottoir/quai, G = rivière, I = pont)
export const bordeauxMap = {
  id: 'bordeaux',
  name: 'Bordeaux',
  built: BUILT,
  sourceGrid: parseGrid([
    'ƀƀƀƀƀƀƀƀƀƀƀƀƀƀƀƀƀƀƀƀƀƀƀƀƀƀƀƀƀƀƀƀ', // 0  4 rangées ajoutées en haut dans le créateur (octobre 2026)
    'ƀƀƀƀƀƀƀƀƀƀƀƀƀƀƀƀƀƀƀƀƀƀƀƀƀƀƀƀƀƀƀƀ', // 1
    'ƀƀƀƀƀƀƀƀƀƀƀƀƀƀƀƀƀƀƀƀƀƀƀƀƀƀƀƀƀƀƀƀ', // 2
    'ƀƀƀƀƀƀƀƀƀƀƀƀƀƀƀƀƀƀƀƀƀƀƀƀƀƀƀƀƀƀƀƀ', // 3
    'ƀƀƀƀƀƀƀƀƀƀƀƀƀƀƀƀƀƀƀƀƀƀƀƀƀƀƀƀƀƀƀƀ', // 4  arbres : bord de l'écran
    'ƀƀƀƀƀƀƀƀƀƀƀƀƀƀƀƀƀƀƀƀƀƀƀƀƀƀƀƀƀƀƀƀ', // 5
    'ƀƀ.............ɔɔɔɔɔɔɔɔɔɔɔɔ...ƀƀ', // 6
    'ƀƀ..WWWW.WWWWWɔɔɔɔɔɔɔɔɔɔɔɔɔɔ..ƀƀ', // 7
    'ƀƀ..WWWWWWWWWWɔɔɔɔɔɔɔɔɔɔɔɔɔɔ..ƀƀ', // 8
    'ƀƀ.ɔWWWWWWWWWWɔɔWWWWWWWWWWWɔ.ƀƀƀ', // 9
    '...ɔWDWWWWWDWWɔɔWWWWWDWWWWWɔɔ...', // 10  portes : ton immeuble (5), l'agence (11) ; ouest : Prytanée
    'ɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔWWWWWWWWWWWɔɔɔɔɔ', // 11
    'ɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔWWWWWWWWWWɔɔɔɔɔɔ', // 12
    'ɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔWWWWWWWWɔɔɔɔɔƀƀ', // 13
    'ƀƀ.ɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔWW.WWɔɔɔɔɔ.ƀƀ', // 14  porte du stade
    'ƀƀ....ɔɔɔɔ....ɔɔɔɔɔɔɔɔɔɔɔɔɔɔ..ƀƀ', // 15
    'ƀƀ.....ɔɔ...WW..ɔɔɔɔɔɔɔɔɔɔ....ƀƀ', // 16
    'ƀƀ.....ɔɔ..............ɔɔ...GGGG', // 17
    '.......ɔɔ.WWW.WWW.WWW..ɔɔ.WWGGGG', // 18
    'GGGGGGGIIGGGGGGGGGGGGGGɔɔGGGGGGG', // 19  la Garonne et ses deux ponts (x 7-8, 23-24)
    'GGGGGGGIIGGGGGGGGGGGGGGIIGGGGGGG', // 20
    'GGGGGGGIIGGGGGGGGGGGGGGIIGGGGGGG', // 21
    'ƀƀƀGGGGIIGGGGGGGGGGGGGGIIGGGGGGG', // 22
    'GGGGGGGIIGGGGGGGGGGGGGGIIGGGGGGG', // 23
    'ƀƀIIIIIɔɔGGGGGGGGGGGGGGIIGGGGGGG', // 24
    'ƀƀĥĥĥĥ.ɔɔ......WW.WWW..ɔɔ.WGGGGG', // 25  hautes herbes du recoin (x 2-5) : la clé du cycliste
    'ƀƀĥĥĥĥ.ɔɔ..............ɔɔ.WGGGGG', // 26
    'ƀƀĥĥɔɔɔɔɔɔɔɔɔɔ........ɔɔɔɔ......', // 27
    'ƀƀĥɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔ..ƀƀ', // 28
    'ƀƀĥɔWWWWWWWWWɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔ.ƀƀƀ', // 29
    'ƀƀĥɔWWWWWWWWWɔɔɔWWWWɔɔWWWWɔɔɔɔɔɔ', // 30
    'ƀƀĥɔWWWWWWWWWɔɔɔWWWWɔɔWWWWWɔɔɔɔɔ', // 31
    'ƀƀ.ɔWWWWWWWWWɔɔɔWWWWɔɔWWWWWɔɔɔɔɔ', // 32
    'ƀƀ.ɔɔɔɔɔDWɔɔɔɔɔɔWDWWɔɔWDWWWɔĥĥĥĥ', // 33  portes : KEDGE (8), le studio de Paul (17), Rémi (23) ; est : route de Paris
    'ƀƀ.ɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔĥĥƀƀ', // 34
    'ƀƀ.ɔɔɔɔɔɔɔɔɔɔɔɔ...ɔɔɔɔɔɔɔɔĥĥĥĥƀƀ', // 35
    'ƀƀ..ɔɔɔɔɔɔɔɔɔɔ.........ĥĥĥĥĥĥĥƀƀ', // 36
    'ƀƀ...................ĥĥĥĥĥĥĥĥĥƀƀ', // 37
    'ƀƀƀƀƀƀƀƀƀƀƀƀƀƀƀƀƀƀƀƀƀƀƀƀƀƀƀƀƀƀƀƀ', // 38  arbres : bord de l'écran
    'ƀƀƀƀƀƀƀƀƀƀƀƀƀƀƀƀƀƀƀƀƀƀƀƀƀƀƀƀƀƀƀƀ', // 39
  ]),
  doors: [
    // Ton immeuble (en haut à gauche) : il faut les clés de l'agence.
    {
      x: 5, y: 10, interior: 'appartement',
      lock: { ifItems: [ITEMS.clesAppartement.id] },
      lockedDialogue: ["C'est ton futur immeuble, mais tu n'as pas les clés. Va à l'agence."],
    },
    { x: 11, y: 10, interior: 'agence' },                          // la boutique à auvent
    // Le stade (la rotonde) : la remise des diplômes, une fois le semestre de New Delhi terminé.
    {
      x: 21, y: 10, interior: 'stade',
      lock: { ifFlags: [FLAGS.semestreTermine] },
      lockedDialogue: ["Le stade est fermé : la remise des diplômes n'a pas encore lieu."],
    },
    // KEDGE (le grand bâtiment de pierre, en bas à gauche) : l'oral d'anglais, quelques mois après la soirée.
    {
      x: 8, y: 33, interior: 'kedge',
      lock: { ifFlags: [FLAGS.soireeFinie] },
      lockedDialogue: ["L'oral d'anglais, c'est pas aujourd'hui."],
    },
    { x: 17, y: 33, interior: 'studioPaulfit' },                  // le studio de Paul
    { x: 23, y: 33, interior: 'appartRemi' },                     // l'appartement de Rémi, près du campus
  ],
  // Les bâtiments sont dans le dessin ; la liste d'origine sert à la conversion.
  buildings: [],
  // Redessinée à la main (octobre 2026) : plus de bâtiments d'origine à convertir.
  sourceBuildings: [],
  npcs: [
    // Ousmane, le coloc : devant l'immeuble à l'arrivée, puis pendant les préparatifs de la soirée.
    {
      id: 'ousmane-porte', name: 'Ousmane', x: 6, y: 11, facing: 'left',
      ifFlags: [FLAGS.bordeauxOuverture], unlessFlags: [FLAGS.ousmaneRencontre], script: OUSMANE_AT_DOOR,
    },
    {
      id: 'ousmane-rappel', name: 'Ousmane', x: 6, y: 11, facing: 'left',
      ifFlags: [FLAGS.preparatifs], unlessFlags: [FLAGS.soiree], script: OUSMANE_REMINDS,
    },
    // L'agent de sécurité garde le chemin de l'aéroport (x 30, rangées 10-12) tant que Pierre n'a pas son diplôme
    // d'anglais ; l'ouvrier, la route de Paris (x 30, rangées 30-33) jusqu'au diplôme de Bordeaux. Passer à côté :
    // ils arrêtent Pierre, qui recule (voir triggers).
    {
      id: 'agent-aeroport', name: 'Agent de sécurité', sprite: 'g87', x: 30, y: 11, facing: 'left',
      unlessItems: [ITEMS.diplomeAnglais.id], dialogue: AIRPORT_GUARD,
    },
    {
      id: 'ouvrier-route', name: 'Ouvrier', sprite: 'g79', x: 30, y: 31, facing: 'left',
      unlessFlags: [FLAGS.diplomeBordeaux], dialogue: ROAD_WORKER,
    },
    // Le cycliste du quai nord, assis sur son vélo (facultatif : le vélo de Pierre, voir bordeauxStory.js CYCLIST).
    { id: 'cycliste', name: 'Cycliste', sprite: 'g18', x: 17, y: 17, facing: 'down', script: CYCLIST },   // devant la fontaine
    // Rémi, devant KEDGE le jour de l'oral.
    {
      id: 'remi-kedge', name: 'Rémi', x: 9, y: 34, facing: 'left',
      ifFlags: [FLAGS.soireeFinie], unlessItems: [ITEMS.diplomeAnglais.id], dialogue: ['T\'inquiète, c\'est easy.'],
    },
    // Ousmane, devant KEDGE à la sortie de l'oral : il montre le chemin de l'aéroport, puis part devant.
    {
      id: 'ousmane-kedge', name: 'Ousmane', x: 10, y: 34, facing: 'left',
      ifItems: [ITEMS.diplomeAnglais.id], unlessFlags: [FLAGS.ousmaneDiplome],
      dialogue: ['L\'aéroport est par la sortie est. On se retrouve au guichet !'],
    },
  ],
  events: [
    { on: 'enter', ifFlags: [FLAGS.arriveeBordeaux], unlessFlags: [FLAGS.bordeauxOuverture], steps: ARRIVAL },
    // En sortant de la soirée.
    { on: 'enter', ifFlags: [FLAGS.soiree], unlessFlags: [FLAGS.soireeFinie], steps: MONTHS_LATER },
    // En sortant de KEDGE avec le diplôme d'anglais : Ousmane.
    { on: 'enter', ifItems: [ITEMS.diplomeAnglais.id], unlessFlags: [FLAGS.ousmaneDiplome], steps: OUSMANE_AFTER_ORAL },
    // De retour de New Delhi (le vol, avec Prophecy) : Prophecy indique le stade.
    { on: 'enter', ifFlags: [FLAGS.retourBordeaux], unlessFlags: [FLAGS.stadeIndique], steps: BACK_FROM_DELHI },
  ],
  // Panneaux « Aéroport » à côté des sorties ; les noms sur les portes.
  objects: [
    airportSign(29, 9, true),
    // La boîte aux lettres, à gauche de l'immeuble (dessinée) : la vraie lettre promise par Joshua, à Saint-Ay.
    {
      x: 3, y: 10,
      dialogue: [
        'Une carte postale ! Elle vient de Joshua.',
        '« Pierre, je t\'avais promis une vraie lettre, avec un timbre. Voilà le timbre. La lettre, c\'est cette carte.',
        'Felix dit que la cabane tient toujours. Yanis a encore oublié le mot de passe. Joshua. »',
      ],
    },
    ...[16, 18].map((x) => ({ x, y: 33, dialogue: ['Sur la porte : « PAUL ».'] })),
    ...[22, 24].map((x) => ({ x, y: 33, dialogue: ['Sur la porte : « RÉMI ».'] })),
  ],
  triggers: [
    // À côté de l'agent et de l'ouvrier : ils arrêtent Pierre, qui recule d'un pas.
    ...[10, 12].map((y) => ({
      x: 30, y, unlessItems: [ITEMS.diplomeAnglais.id],
      script: stopped('agent-aeroport', 'Agent de sécurité', AIRPORT_GUARD, y < 11 ? 'up' : 'down', [29, y]),
    })),
    ...[30, 32, 33].map((y) => ({
      x: 30, y, unlessFlags: [FLAGS.diplomeBordeaux],
      script: stopped('ouvrier-route', 'Ouvrier', ROAD_WORKER, y < 31 ? 'up' : 'down', [29, y]),
    })),
    // La clé d'antivol du cycliste, dans les hautes herbes du recoin sud-ouest (une fois qu'il en a parlé).
    {
      x: 3, y: 25, ifFlags: [FLAGS.veloCherche], unlessItems: [ITEMS.cleAntivol.id, ITEMS.velo.id], script: ANTITHEFT_KEY,
    },
    // Devant la porte de l'immeuble : Ousmane (voir bordeauxStory.js FRONT_DOOR).
    { x: 5, y: 11, script: FRONT_DOOR },
    // Devant KEDGE, le jour de l'oral : Rémi.
    { x: 8, y: 34, ifFlags: [FLAGS.soireeFinie], unlessFlags: [FLAGS.remiKedge], script: REMI_AT_KEDGE },
    // Ouest : retour au Prytanée (arrivée à sa porte nord).
    ...[10, 11, 12, 13].map((y) => ({
      x: 0,
      y,
      readyDialogue: ['Tu retournes au Prytanée.'],
      warp: { map: 'prytanee', x: 24, y: 1, facing: 'down' },
    })),
    // Sud-est : la route de Paris, libre une fois le diplôme de Bordeaux en poche.
    ...[30, 31, 32, 33].map((y) => ({
      x: 31,
      y,
      ifFlags: [FLAGS.diplomeBordeaux],
      dialogue: ['La route est bloquée.'],
      readyDialogue: ['Ton diplôme de Bordeaux en poche, tu prends la route de Paris !'],
      setFlags: [FLAGS.arriveeParis],
      warp: { map: 'paris', x: 1, y: 11, facing: 'right' },   // le bord ouest de Paris, côté Bordeaux
    })),
    // Est : l'aéroport, débloqué par le diplôme d'anglais.
    ...[10, 11, 12].map((y) => ({
      ...toAirport(31, y),
      ifItems: [ITEMS.diplomeAnglais.id],
      dialogue: ["L'aéroport ! Il te faut ton diplôme d'anglais pour partir : l'oral, c'est à KEDGE."],
    })),
  ],
  // Arbres seulement tout au bord de l'écran, sauf là où passent la rivière et les rues.
  surroundings: { outside, border: 'ƀ', borderSkip: ['G', 'ɐ'] },
  spawn: { x: 1, y: 10, facing: 'right' },
};

// La grille du jeu : celle d'origine, accordée aux collisions du dessin.
bordeauxMap.grid = builtGrid(bordeauxMap.sourceGrid, BUILT);
