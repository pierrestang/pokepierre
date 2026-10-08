import { parseGrid } from './parseGrid.js';
// Le dessin de la carte : la version Gen 4 faite avec le créateur de cartes (scripts/convert_maps_v2.py, thème Gen 4,
// scripts/g4_theme.py) ; ses collisions s'imposent à la grille du jeu (voir builtGrid). La grille et les bâtiments
// d'origine restent la source de la conversion (sourceGrid, sourceBuildings).
import BUILT from '../builtMaps/montepilloy.json' with { type: 'json' };
import { builtGrid } from './builtGrid.js';
import { FLAGS, ITEMS } from '../story.js';
import {
  ARRIVAL, HIDE_AND_SEEK, FOUND_MARGAUX, FOUND_ETIENNE, BOULY, SEPTEMBER_MORNING, NORTH_EXIT, JEAN_AT_TRACTOR, JEAN_TRACTOR,
  BENOIT_SAD,
} from '../montepilloyStory.js';

// Montépilloy (Oise) — village de campagne façon Rouge Feu, 36 x 30 cases (agrandie en octobre 2026 : scripts/
// script ponctuel, retiré depuis ; dimensions paires pour la bordure d'arbres). Chemins de terre : la grand-rue nord-sud, sur trois cases (la route du collège au nord, la route de Saint-Ay au sud), la rue des maisons et la rue de l'école. Les maisons
// bordent la grand-rue de chaque côté : la famille à gauche, la voisine à droite, l'école à droite en dessous. À
// gauche, la ferme de M. Bouly, un enclos rectangulaire à clôture blanche ouvert à droite sur la grand-rue (deux
// cases, panneau juste à l'intérieur) : la grange (toit orange de Rubis/Saphir, tonneaux à l'intérieur) et le
// tracteur, le chemin de l'entrée devant la grange, puis le champ de blé. À droite, sous la rue de l'école, la
// prairie aux hautes herbes et la mare. Ceinture d'arbres. Scénario : voir data/montepilloyStory.js.
// Légende : voir src/data/tiles.js (ç = chemin de terre, ~ = mare, ʬ = blé, F = clôture, T = arbre (blocs de
// 2 x 2), ƀ = buisson, f = fleurs, ĥ = hautes herbes, S = panneau, M = boîte aux lettres, R / W / D = toit, mur,
// porte des bâtiments)
export const montepilloyMap = {
  id: 'montepilloy',
  name: 'Montépilloy',
  built: BUILT,
  sourceGrid: parseGrid([
    'TTTTTTTTTTTTTT.çççTTTTTTTTTTTTTTTTTT', // 0
    'TTTTTTTTTTTTTT.çççTTTTTTTTTTTTTTTTTT', // 1
    'TTTTTĥĥĥ.ĥĥĥĥ.Sççç..ĥ.ĥĥĥĥĥĥĥĥĥĥĥĥTT', // 2
    'TTTTTĥ...RRRRR.ççç.RRRRR.....ĥĥĥĥĥTT', // 3
    'TTĥ..ĥff.RRRRR.ççç.RRRRR.ff...ĥĥĥĥTT', // 4
    'TTĥƀƀ.ff.WWWWW.ççç.WWWWW.ff.....ĥĥTT', // 5
    'TTĥĥ....WDWWMW.ççç.WWWWDM........ĥTT', // 6
    'TTĥĥ...ççççççççççççççççççç...ƀ....TT', // 7
    'TTĥ....ççççççççççççççççççç........TT', // 8
    'TT.............ççç................TT', // 9
    'TTFFFFFFFFFFFFFççç.RRRRR..TT..TTTTTT', // 10
    'TTF...........Fççç.RRRRR.fTT..TTTTTT', // 11
    'TTFRRRRRRR....Fççç.WWWWW.f..ƀ....ĥTT', // 12
    'TTFRRRRRRR....Fççç.WWWWW.........ĥTT', // 13
    'TTFWWWWWWW....FççççççççççççDçç..ĥĥTT', // 14
    'TTFWWWW..W...SFççççççççççççççç..ĥĥTT', // 15
    'TTF..çççççDççççççç.ĥĥĥ.ĥ.f..TTĥĥĥĥTT', // 16
    'TTF..ççççççççççççç..ĥĥĥĥĥf..TTĥĥĥĥTT', // 17
    'TTF..ççççççççççççç...ĥĥĥ.f..TTĥĥ.ĥTT', // 18
    'TTF..ççççççççççççç.f~~~~~~..TT.ĥĥĥTT', // 19
    'TTFʬʬʬʬʬʬʬʬʬʬʬFççç.f~~~~~~~......ĥTT', // 20
    'TTFʬʬʬʬʬʬʬʬʬʬʬFçççĥ~~~~~~~~.......TT', // 21
    'TTFʬʬʬʬʬʬʬʬʬʬʬFçççĥ~~~~~~~~...TTTTTT', // 22
    'TTFʬʬʬʬʬʬʬʬʬʬʬFçççĥĥ~~~~~~ĥĥ..TTTTTT', // 23
    'TTFʬʬʬʬʬʬʬʬʬʬʬFçççĥĥ~~~~~~....TTTTTT', // 24
    'TTFʬʬʬʬʬʬʬʬʬʬʬFççç.ĥĥ.~~~.f.ĥĥ.ĥĥĥTT', // 25
    'TTFʬʬʬʬʬʬʬʬʬʬʬFççç.ĥĥ.~~~ĥfĥĥĥĥĥĥĥTT', // 26
    'TTFFFFFFFFFFFFFççç.ĥĥĥĥĥĥĥĥĥĥĥĥĥƀƀTT', // 27
    'TTTTTTTTTTTTTT.çççTTTTTTTTTTTTTTTTTT', // 28
    'TTTTTTTTTTTTTT.çççTTTTTTTTTTTTTTTTTT', // 29
  ]),
  doors: [
    { x: 9, y: 6, interior: 'montHouse' },
    // Maison de la voisine : fermée (pas d'intérieur pour l'instant). Porte sur la rangée du soubassement de la maison
    // jaune (on frappe depuis la rue).
    { x: 23, y: 6, lockedDialogue: ['Personne ne répond.'] },
    // La grange : le grand bâtiment orange (retouché dans le créateur, octobre 2026), sa porte grise en bas.
    { x: 10, y: 16, interior: 'boulyBarn' },
    // L'école (la verrière) : sa porte dessinée, déplacée dans le créateur.
    { x: 27, y: 14, interior: 'school' },
  ],
  // Les bâtiments sont dans le dessin ; la liste d'origine sert à la conversion.
  buildings: [],
  sourceBuildings: [
    { type: 'house', x: 9, y: 3 },
    { type: 'greenHouse', x: 19, y: 3 },
    { type: 'school', x: 19, y: 10 },
    { type: 'boulyFarm', x: 3, y: 12 },
  ],
  props: [
    // Le tracteur de M. Bouly (image Gen 4, scripts/build_props.py), garé devant la ferme : en panne, puis parti faire un
    // tour avec Jean, et de retour en septembre.
    {
      type: 'tractor', image: 'tracteur', x: 4, y: 17, w: 2, h: 2,
      unlessFlags: [FLAGS.tracteurRepare],
      dialogue: ['Le tracteur de M. Bouly. Il refuse de démarrer.'],
    },
    {
      type: 'tractor', image: 'tracteur', x: 4, y: 17, w: 2, h: 2,
      ifFlags: [FLAGS.septembre],
      dialogue: ['Le tracteur de M. Bouly ronronne.'],
    },
  ],
  npcs: [
    // Tant que Jean ne t'a rien demandé, M. Bouly se contente de te saluer.
    {
      id: 'bouly-bonjour', name: 'M. Bouly', x: 13, y: 16, facing: 'down', color: 0x7c5c2c,
      unlessFlags: [FLAGS.jeanQuetes],
      dialogue: ['Bonjour mon grand ! Belle journée pour la ferme, hein ?'],
    },
    {
      id: 'bouly', name: 'M. Bouly', x: 13, y: 16, facing: 'down', color: 0x7c5c2c,
      ifFlags: [FLAGS.jeanQuetes], unlessFlags: [FLAGS.tracteurRepare],
      script: BOULY,
    },
    {
      id: 'bouly-fin', name: 'M. Bouly', x: 13, y: 16, facing: 'down', color: 0x7c5c2c,
      ifFlags: [FLAGS.septembre],
      dialogue: ['Ton petit frère a de l\'or dans les mains. Il vient me voir tous les mercredis, maintenant !'],
    },
    // Jean, sous le tracteur, attend son assistant ; la réparation finie, il part faire un tour avec M. Bouly.
    {
      id: 'jean', name: 'Jean', x: JEAN_AT_TRACTOR[0], y: JEAN_AT_TRACTOR[1], facing: 'up', color: 0x3c7c5c,
      ifFlags: [FLAGS.jeanQuetes], unlessFlags: [FLAGS.tracteurRepare],
      script: JEAN_TRACTOR,
    },
    // Après le cache-cache, Benoît est assis seul au bord de la mare, en bas à droite, jusqu'au matin de septembre
    // (facultatif, voir montepilloyStory.js BENOIT_SAD).
    {
      id: 'benoit-grange', name: 'Benoît', x: 26, y: 24, facing: 'left', still: true, color: 0xa07040,
      ifFlags: [FLAGS.copainsPartent], unlessFlags: [FLAGS.septembre],
      script: BENOIT_SAD,
    },
    // À la sortie de l'école, Margaux lance le cache-cache (voir HIDE_AND_SEEK).
    {
      id: 'margaux-sortie', name: 'Margaux', x: 25, y: 15, facing: 'left', color: 0xf08080,
      ifFlags: [FLAGS.ecoleCm2], unlessFlags: [FLAGS.cacheCache],
      dialogue: ['Dernière partie de cache-cache avant les vacances !'],
    },
    // Septembre, devant la maison : la famille dit au revoir à Pierre (voir SEPTEMBER_MORNING) ; une fois Pierre
    // allé au collège, elle est rentrée (voir la maison).
    {
      id: 'maman-septembre', name: 'Maman', x: 9, y: 8, facing: 'up', color: 0xe86fa0,
      ifFlags: [FLAGS.septembre], unlessFlags: [FLAGS.collegeOuverture],
      dialogue: ['Allez, file ! Tu ne vas pas être en retard le premier jour.'],
    },
    {
      id: 'papa-septembre', name: 'Papa', x: 11, y: 8, facing: 'up', color: 0x3f6fd8,
      ifFlags: [FLAGS.septembre], unlessFlags: [FLAGS.collegeOuverture],
      dialogue: ['Le collège, c\'est tout droit, par la sortie nord.'],
    },
    {
      id: 'jean-septembre', name: 'Jean', x: 12, y: 7, facing: 'left', color: 0x3c7c5c,
      ifFlags: [FLAGS.septembre], unlessFlags: [FLAGS.collegeOuverture],
      dialogue: ['Tu me raconteras, hein ?'],
    },
  ],
  objects: [
    { x: 14, y: 2, dialogue: ['Nord : route du collège Bonsecours.'] },
    // Une carte postale de Felix (Saint-Ay).
    {
      x: 12, y: 6,
      dialogue: [
        'Une carte postale ! Elle vient de Felix.',
        '« Pierre, la cabane tient toujours. Yanis a oublié le mot de passe, pas nous.',
        'Joshua veut changer les planches, on a dit non, c\'est les tiennes. Reviens vite. Felix. »',
      ],
    },
    { x: 24, y: 6, dialogue: ['La boîte aux lettres de la voisine.'] },
    { x: 13, y: 15, dialogue: ['Ferme de M. Bouly.'] },
    // Cache-cache : Étienne dans l'arbre de la prairie (Margaux, voir les passages).
    { x: 28, y: 23, ifFlags: [FLAGS.cacheCache], unlessFlags: [FLAGS.trouveEtienne], script: FOUND_ETIENNE },
  ],
  events: [
    { on: 'enter', ifFlags: [FLAGS.arriveeMontepilloy], unlessFlags: [FLAGS.ellipseMontepilloy], steps: ARRIVAL },
    { on: 'enter', ifFlags: [FLAGS.ecoleCm2], unlessFlags: [FLAGS.cacheCache], steps: HIDE_AND_SEEK },
    { on: 'enter', ifFlags: [FLAGS.septembre], unlessFlags: [FLAGS.departCollege], steps: SEPTEMBER_MORNING },
  ],
  triggers: [
    // Porte sud : la route de Saint-Ay (voir maps/routeMontepilloy.js).
    ...[15, 16, 17].map((x) => ({ x, y: 29, warp: { map: 'routeMontepilloy', x: 10, y: 1, facing: 'down' } })),
    // Cache-cache : Margaux, derrière les bottes de foin, au fond du champ de la ferme (on tombe sur elle en y
    // entrant).
    ...[[12, 23], [13, 23], [12, 24], [13, 24], [12, 25], [13, 25], [12, 26], [13, 26]].map(([x, y]) => ({
      x, y, ifFlags: [FLAGS.cacheCache], unlessFlags: [FLAGS.trouveMargaux], script: FOUND_MARGAUX,
    })),
    // Porte nord : ce qu'il reste à faire, puis septembre, puis la route du collège, à pied (voir NORTH_EXIT).
    ...[15, 16, 17].map((x) => ({ x, y: 0, script: NORTH_EXIT })),
  ],
  spawn: { x: 16, y: 27, facing: 'up' },
};

// La grille du jeu : celle d'origine, accordée aux collisions du dessin.
montepilloyMap.grid = builtGrid(montepilloyMap.sourceGrid, BUILT);
