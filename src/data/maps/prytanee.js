import { parseGrid } from './parseGrid.js';
// Le dessin de la carte : la version Gen 4 faite avec le créateur de cartes (scripts/convert_maps_v2.py, thème Gen 4,
// scripts/g4_theme.py) ; ses collisions s'imposent à la grille du jeu (voir builtGrid). La grille et les bâtiments
// d'origine restent la source de la conversion (sourceGrid, sourceBuildings).
import BUILT from '../builtMaps/prytanee.json' with { type: 'json' };
import { builtGrid } from './builtGrid.js';
import { FLAGS, ITEMS } from '../story.js';
import {
  ARRIVAL, BAC_RESULTS, CAPTAIN_AT_GATE, CAPTAIN_WELCOME, DORM_DOOR_FRONT, NIGHT, NORTH_GATE, NORTH_GATE_SCRIPT, PATROLS,
  RESULTS_BOARD, SOUTH_GATE,
} from '../prytaneeStory.js';

const CAPTAIN = { name: 'Capitaine', color: 0x3c5c2c };
// Le jour, hors de la nuit du mur (deux variantes, une condition chacune : avant le soir, après le retour).
const BY_DAY = [{ unlessFlags: [FLAGS.soirMur] }, { ifFlags: [FLAGS.murReussi] }];
// Quelques années plus tard, jusqu'au départ pour Bordeaux.
const AFTER_BAC = { ifFlags: [FLAGS.ellipseBac], unlessFlags: [FLAGS.arriveeBordeaux] };
// Tanguy et Geoffrey, devant le panneau une fois descendus de la chambre.
const AT_BOARD = { ifFlags: [FLAGS.bacDescente], unlessFlags: [FLAGS.arriveeBordeaux] };

// Prytanée (lycée militaire, La Flèche), 36 x 28 cases, tout en tuiles et bâtiments de Rouge Feu, dans une enceinte de
// barrières blanches ceinte de sapins. Au nord : l'internat des garçons (grand immeuble vert, trois niveaux, voir les
// intérieurs dortoirHall, dortoir, dortoirEtage2), les salles de cours (bâtiment à colonnes) et l'internat des filles
// (fermé) ; entre les deux derniers, l'allée de la porte nord (Bordeaux, et « derrière le mur »). Au centre, la place
// d'armes dallée, son drapeau tricolore (même mât que celui de la Martinique) entre quatre carrés d'herbe symétriques ; tout
// le reste de la cour est dallé. Au sud : l'infirmerie, le poste de
// commandement et la porte sud (route de Bonsecours), gardée par un militaire. Scénario : voir data/prytaneeStory.js.
// Légende : voir src/data/tiles.js (ɔ = pavés, ʘ = drapeau français, F = barrière, T = sapins, ƀ = buisson,
// f = fleurs, S = panneau, R / W / D = toit, mur, porte)
export const prytaneeMap = {
  id: 'prytanee',
  name: 'Prytanée',
  built: BUILT,
  sourceGrid: parseGrid([
    'TTTTTTTTTTTTTTTTTTTTTTTTɔɔTTTTTTTTTT', // 0  nord : porte vers Bordeaux
    'TTTTTTTTTTTTTTTTTTTTTTTTɔɔTTTTTTTTTT', // 1
    'TTFFFFFFFFFFFFFFFFFFFFFFɔɔFFFFFFFFTT', // 2  enceinte
    'TTF.RRRRRRR.RRRRRRRRRRRƀɔɔRRRRRRRFTT', // 3  internat des garçons, salles de cours, internat des filles
    'TTF.RRRRRRR.RRRRRRRRRRR.ɔɔRRRRRRRFTT', // 4
    'TTF.RRRRRRR.RRRRRRRRRRR.ɔɔRRRRRRRFTT', // 5
    'TTF.WWWWWWW.WWWWWWWWWWW.ɔɔWWWDWWWFTT', // 6
    'TTF.WWDWWWW.WDWWWWWWWWW.ɔɔWWWWWWWFTT', // 7
    'TTF.WWWWWWW.WWWWWWWWWWW.ɔɔWWWWWWWFTT', // 8
    'TTF.WWWWWWW.ffffWWWffff.ɔɔWWWWWWWFTT', // 9
    'TTF.WWW.WWWSffffW.WffffSɔɔWWW.WWWFTT', // 10
    'TTFɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔFTT', // 11  allée
    'TTFɔɔɔɔɔɔƀ.....ɔɔɔɔɔ.....ƀɔɔɔɔɔɔɔFTT', // 12
    'TTFɔɔɔɔɔɔ......ɔɔɔɔɔ......ɔɔɔɔɔɔɔFTT', // 13
    'TTFɔɔɔɔɔɔ......ɔɔɔɔɔ......ɔɔɔɔɔɔɔFTT', // 14
    'TTFɔɔɔɔɔɔ....ffɔɔɔɔɔff....ɔɔɔɔɔɔɔFTT', // 15
    'TTFɔɔɔɔɔɔɔɔɔɔɔɔɔɔʘɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔFTT', // 16  place d'armes : drapeau, quatre jardins
    'TTFɔɔɔɔɔɔ....ffɔɔɔɔɔff....ɔɔɔɔɔɔɔFTT', // 17
    'TTFɔRRRRR......ɔɔɔɔɔ......RRRRRRRFTT', // 18  infirmerie, poste de commandement
    'TTFɔRRRRRĥĥĥĥĥĥɔɔɔɔɔ......RRRRRRRFTT', // 19
    'TTFɔWWWWWƀ..ĥĥĥɔɔɔɔɔĥ....ƀWWWWDWWFTT', // 20
    'TTFSWWDWWɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔSWWW.WWWFTT', // 21
    'TTFɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔɔFTT', // 22  allée
    'TTFFFFFFFFFFFFFFɔɔFFFFFFFFFFFFFFFFTT', // 23  porte sud : route de Bonsecours
    'TTTTTTTTTTTTTTTTɔɔTTTTTTTTTTTTTTTTTT', // 24
    'TTTTTTTTTTTTTTTTɔɔTTTTTTTTTTTTTTTTTT', // 25
  ]),
  doors: [
    // L'internat des garçons : ouvert dès que le capitaine a parlé.
    {
      x: 6, y: 7, interior: 'dortoirHall',
      lock: { ifFlags: [FLAGS.capitaineParle] },
      lockedDialogue: ['Le capitaine t\'attend devant l\'internat.'],
    },
    { x: 13, y: 7, lockedDialogue: ['Les salles de cours. Fermées à cette heure-ci.'] },
    { x: 29, y: 6, lockedDialogue: ['L\'internat des filles. Fermé aux garçons, même aux plus polis.'] },
    { x: 6, y: 21, lockedDialogue: ['L\'infirmerie. Fermée : personne ne s\'est foulé la cheville aujourd\'hui.'] },
    { x: 30, y: 20, lockedDialogue: ['Poste de commandement. Accès réservé.'] },
  ],
  npcs: [
    // Le capitaine accueille Pierre devant l'internat, puis repart vers son poste (voir prytaneeStory.js).
    {
      id: 'capitaine', ...CAPTAIN, x: DORM_DOOR_FRONT.x + 1, y: DORM_DOOR_FRONT.y, facing: 'down',
      unlessFlags: [FLAGS.capitaineAccueil],
      script: CAPTAIN_WELCOME,
    },
    // Le militaire de faction à la porte sud (le jour).
    {
      id: 'sentinelle-sud', name: 'Militaire', x: SOUTH_GATE[0] - 1, y: SOUTH_GATE[1] - 1, facing: 'right',
      unlessFlags: [FLAGS.soirMur], still: true,
      dialogue: ['Prytanée national militaire. On se tient droit en passant le portail, merci.'],
    },
    {
      id: 'sentinelle-sud-apres', name: 'Militaire', x: SOUTH_GATE[0] - 1, y: SOUTH_GATE[1] - 1, facing: 'right',
      ifFlags: [FLAGS.murReussi], still: true,
      dialogue: ['Rien à signaler. Comme toutes les nuits, hein ?'],
    },
    // Deux militaires dans la cour, le jour (la nuit, ce sont les rondes) : l'un garde le drapeau, l'autre fait sa ronde
    // autour du jardin sud-ouest, devant l'infirmerie.
    ...BY_DAY.flatMap((when) => [
      {
        id: 'militaire-drapeau', name: 'Militaire', sprite: 'g87', x: 15, y: 16, facing: 'right', still: true, ...when,
        dialogue: ['Le drapeau ne touche jamais le sol. Jamais. Même quand il pleut.'],
      },
      {
        id: 'militaire-cour', name: 'Militaire', sprite: 'g87', x: 12, y: 22, facing: 'right', route: [[12, 22], [15, 22], [15, 16], [8, 16], [8, 17], [6, 17]], ...when,
        dialogue: ['Lever des couleurs tous les matins à 7 h. Même le dimanche. Surtout le dimanche.'],
      },
    ]),
    // La nuit : Tanguy et Geoffrey attendent derrière le mur, de l'autre côté de la porte nord.
    { id: 'tanguy-mur', name: 'Tanguy', x: NORTH_GATE[0][0], y: 1, facing: 'down', ...NIGHT, dialogue: ['T\'en as mis du temps !'] },
    { id: 'geoffrey-mur', name: 'Geoffrey', x: NORTH_GATE[1][0], y: 1, facing: 'down', ...NIGHT, dialogue: ['Chut !'] },
    // Quelques années plus tard : Tanguy et Geoffrey de part et d'autre du panneau des résultats ; le capitaine à la porte
    // nord.
    {
      id: 'tanguy-bac', name: 'Tanguy', x: RESULTS_BOARD.x + 2, y: RESULTS_BOARD.y + 1, facing: 'left', ...AT_BOARD,
      script: [
        { ifItems: [ITEMS.baccalaureat.id], speaker: 'Tanguy', say: ['Le bac en poche ! On se reverra, hein ?'], end: true },
        { speaker: 'Tanguy', say: ['Viens voir la liste !'] },
      ],
    },
    {
      id: 'geoffrey-bac', name: 'Geoffrey', x: RESULTS_BOARD.x - 1, y: RESULTS_BOARD.y + 1, facing: 'right', ...AT_BOARD,
      script: [{ speaker: 'Geoffrey', say: ['Fais ton lit à Bordeaux, sinon le capitaine le saura.'] }],
    },
    { id: 'capitaine-depart', ...CAPTAIN, x: NORTH_GATE[0][0] - 1, y: 4, facing: 'right', ...AFTER_BAC, script: CAPTAIN_AT_GATE },
  ],
  events: [
    { on: 'enter', ifFlags: [FLAGS.arriveePrytanee], unlessFlags: [FLAGS.prytaneeOuverture], steps: ARRIVAL },
  ],
  // La nuit du mur : cour assombrie, une applique au-dessus de chaque porte ; rondes avec leur lampe.
  night: { ...NIGHT, doorLamps: true },
  patrols: PATROLS,
  // Quelques années plus tard : le panneau des résultats du bac, dressé sur la place d'armes (on le lit par-dessous).
  props: [{
    type: 'resultsBoard', x: RESULTS_BOARD.x, y: RESULTS_BOARD.y, w: 2, h: 1, ifFlags: [FLAGS.ellipseBac],
    script: [
      { ifItems: [ITEMS.baccalaureat.id], say: ['Les résultats du baccalauréat. Ton nom y est.'], end: true },
      ...BAC_RESULTS,
    ],
  }],
  // Les bâtiments sont dans le dessin ; la liste d'origine sert à la conversion.
  buildings: [],
  sourceBuildings: [
    { type: 'mansion', x: 4, y: 3 },                // internat des garçons
    { type: 'museum', x: 12, y: 3 },                // salles de cours
    { type: 'mansion', x: 26, y: 3 },               // internat des filles
    { type: 'dayCare', x: 4, y: 18 },               // infirmerie
    { type: 'lab', x: 26, y: 18 },                  // poste de commandement
  ],
  objects: [
    { x: 8, y: 7, dialogue: ['Internat des garçons.'] },
    { x: 28, y: 6, dialogue: ['Internat des filles. Au nord : la porte du Prytanée.'] },
    { x: 4, y: 21, dialogue: ['Infirmerie.'] },
    { x: 25, y: 20, dialogue: ['Poste de commandement.'] },
    { x: 17, y: 13, dialogue: ['Le drapeau tricolore flotte en haut du mât.'] },
  ],
  triggers: [
    // Porte sud : la route de Bonsecours.
    ...[SOUTH_GATE[0], SOUTH_GATE[0] + 1].map((x) => ({
      x,
      y: 25,
      ifFlags: [FLAGS.arriveePrytanee],           // on n'y vient que par la route de Bonsecours
      readyDialogue: ['Tu prends la route de Bonsecours.'],
      warp: { map: 'routeBonsecours', x: 11, y: 1, facing: 'down' },
    })),
    // La porte nord : derrière le mur, la nuit ; le départ pour Bordeaux, gardé par le capitaine.
    ...NORTH_GATE.map(([x, y]) => ({ x, y, script: NORTH_GATE_SCRIPT })),
    // Sortie nord (une fois parti, en revenant de Bordeaux par l'aéroport).
    ...NORTH_GATE.map(([x]) => ({
      x,
      y: 0,
      ifFlags: [FLAGS.arriveeBordeaux],
      dialogue: ['Tu ne peux pas quitter le Prytanée sans ton baccalauréat.'],
      readyDialogue: ['Direction Bordeaux !'],
      warp: { map: 'bordeaux', x: 1, y: 10, facing: 'right' },
    })),
  ],
  spawn: { x: SOUTH_GATE[0], y: SOUTH_GATE[1], facing: 'up' },
};

// La grille du jeu : celle d'origine, accordée aux collisions du dessin.
prytaneeMap.grid = builtGrid(prytaneeMap.sourceGrid, BUILT);
