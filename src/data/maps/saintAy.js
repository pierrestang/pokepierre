import { parseGrid } from './parseGrid.js';
import { FLAGS, ITEMS, ROLES } from '../story.js';
import {
  ARRIVAL, PLANKS, ROPE, CAR, henScript, CABANE_SPOT,
} from '../saintAyStory.js';

// Le ferry (le même qu'à Fort-de-France), amarré à gauche du ponton du lac ; une case d'eau entre les deux.
const BOAT_POS = { x: 0, y: 9, w: 4, h: 2 };

// Saint-Ay (Loiret) — petit village de campagne, 32 x 28 cases, façon Rouge Feu, bâtiments resserrés autour
// de la route de Montépilloy (nord-sud) : rue des maisons (chaumière de la famille et, à côté, l'enclos à
// poules, ouvert vers le bas par une seule case au bout de la rue ; planches gardées par les poules), rue du milieu (maison de
// Felix, chaumière comme celle de la famille), et au sud la clinique (toit d'ardoise) sur la route du bas. Prés de hautes herbes aux formes irrégulières. À l'ouest, le lac
// (rives de terre) touche le bord de la carte : petit ponton et ferry ; au sud du lac, la cabane des cousins
// posée sur deux sapins de la forêt. Au sud-ouest, un coin de hautes herbes caché où traîne la vieille corde
// pendant le chantier de la cabane. Ceinture d'arbres ailleurs.
// Scénario : voir data/saintAyStory.js.
// Légende : voir src/data/tiles.js (ç = chemin, F = barrière, ~ = lac,
// B = ferry, = = ponton, T = arbre, ƚ = petit arbre, ƀ = buisson, f = fleurs, ĥ = hautes herbes,
// S = panneau, M = boîte aux lettres, R / W / D = toit, mur,
// porte des bâtiments)
// La vieille corde : au fond du coin de hautes herbes du sud-ouest, seulement pendant le chantier de la cabane.
const ROPE_SPOT = { x: 2, y: 20 };
const ROPE_CONDITIONS = { ifFlags: [FLAGS.planCabane], unlessItems: [ITEMS.corde.id], unlessFlags: [FLAGS.cabaneFinie] };
const COUSIN_COLORS = { felix: 0x9060d0, joshua: 0x20a0c0, yanis: 0xc0b040 };

export const saintAyMap = {
  id: 'saintAy',
  name: 'Saint-Ay',
  grid: parseGrid([
    'TTTTTTTTTTTTTTççTTTTTTTTTTTTTTTT', // 0
    'TTTTTTTTTTTTTTççTTTTTTTTTTTTTTTT', // 1
    'TTTT.....ĥĥ..Sçç..............TT', // 2
    'TTTTfff.ĥĥĥĥ..çç.RRRRR.FFFFF..TT', // 3
    'TT..fff..ĥĥĥ..çç.RRRRR.F...F..TT', // 4
    'TT..fff...ĥ...çç.WWWWW.F...F..TT', // 5
    '~~~.ççççççççççççMWDWWW.F...F..TT', // 6
    '~~~~çççççççççççççççççççFFçFF..TT', // 7
    '~~~~~==~..ĥĥ..çç......çççç....TT', // 8
    'BBBB~==~~ĥĥĥĥ.çç.RRRRR.....ĥĥ.TT', // 9
    'BBBB~==~~~ĥĥĥ.çç.RRRRR....ĥĥĥ.TT', // 10
    '~~~~~==~~~ĥĥ..çç.WWWWW.....ĥĥ.TT', // 11
    '~~~~~~~~~~ĥĥ..ççMWDWWW......ĥ.TT', // 12
    '~~~~~~~~~~ççççççççççççç.......TT', // 13
    '~~~~~~~~~~ççççççççççççç.......TT', // 14
    '~~~~~~~......Sçç..............TT', // 15
    'TTTTTTTT...ĥĥ.ççf..........ĥĥ.TT', // 16
    'TTTTTTTT..ĥĥĥĥççf.RRRRR...ĥĥĥ.TT', // 17
    'TTTTTTTT.ĥĥĥĥ.ççf.RRRRR..ĥĥĥĥ.TT', // 18
    'TTTTTTTT..ĥĥĥĥçç..WWWWW...ĥĥĥ.TT', // 19
    'TTĥĥĥĥĥ....ĥĥ.çç.SWDWWW....ĥĥ.TT', // 20
    'TTĥĥĥĥ........ççççççççç.......TT', // 21
    'TT.ĥĥĥĥ.......ççççççççç.......TT', // 22
    'TTĥĥĥĥĥ..ĥĥ.......ĥĥĥ.........TT', // 23
    'TT.ĥĥĥ..ĥĥĥĥ.....ĥĥĥĥĥ........TT', // 24
    'TT..ĥĥ...ĥĥ.......ĥĥĥĥĥ.......TT', // 25
    'TTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTT', // 26
    'TTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTT', // 27
  ]),
  // Portes -> intérieur. Au retour, le joueur réapparaît sous la porte. Sans intérieur : porte fermée.
  doors: [
    { x: 18, y: 6, interior: 'playerHouse' },
    {
      x: 18, y: 12, interior: 'felixHouse',
      lock: { ifFlags: [FLAGS.felixInvite] },
      lockedDialogue: ['Personne ne répond.'],
    },
    {
      x: 19, y: 20, interior: 'hospital',
      lock: { ifFlags: [FLAGS.familleSuit] },
      lockedDialogue: ["La clinique de Saint-Ay. Tu n'as rien à y faire pour l'instant."],
    },
    // L'échelle de la cabane : on y monte (porte sans case 'D', ouverte une fois la cabane construite).
    { ...CABANE_SPOT, interior: 'cabane', when: { ifFlags: [FLAGS.cabaneFinie] } },
  ],
  // Bâtiments (coin haut-gauche, en cases) ; la collision reste dans la grille.
  buildings: [
    { type: 'cottage', x: 17, y: 3 },
    { type: 'cottage', x: 17, y: 9 },          // maison des cousins : même extérieur que celle de Pierre
    { type: 'slateHouse', x: 18, y: 17 },      // la clinique : toit d'ardoise, porte rouge
    { type: 'ferry', x: BOAT_POS.x, y: BOAT_POS.y },
  ],
  // Obstacles qui dépendent de l'histoire.
  props: [
    // Le tas de planches de l'enclos à poules, gardé par les poules ; il disparaît une fois les planches ramassées.
    {
      type: 'planks', x: 26, y: 4, w: 1, h: 1, unlessItems: [ITEMS.planches.id], unlessFlags: [FLAGS.cabaneFinie],
      script: PLANKS,
    },
    // La cabane des cousins, une fois construite, perchée dans les sapins au sud du lac.
    {
      type: 'cabane', x: CABANE_SPOT.x - 1, y: CABANE_SPOT.y - 3, w: 4, h: 3, ifFlags: [FLAGS.cabaneFinie],
      dialogue: ['La cabane des cousins. On y monte par l\'échelle.'],
    },
    // La voiture chargée attend devant la maison après l'annonce de Papa : on y monte pour partir, elle roule
    // jusqu'à la route du nord et monte vers Montépilloy. Elle disparaît une fois le trajet fait, et ne bloque que
    // la rangée du bas de la route (on passe derrière).
    { type: 'familyCar', x: 19, y: 7, w: 3, h: 1, facing: 'left', turnUp: 15, ifFlags: [FLAGS.annonceMutation], unlessFlags: [FLAGS.arriveeMontepilloy], script: CAR },
  ],
  // Décor lié à l'histoire : la corde dans les hautes herbes (pendant le chantier).
  decals: [
    { kind: 'rope', ...ROPE_SPOT, ...ROPE_CONDITIONS },
  ],
  objects: [
    { x: 13, y: 2, dialogue: ['Nord : route de Montépilloy.'] },
    { x: 13, y: 15, dialogue: ['Saint-Ay, Loiret. Bienvenue au village !'] },
    { x: 17, y: 20, dialogue: ['Clinique de Saint-Ay.'] },
    { x: 16, y: 6, dialogue: ['La boîte aux lettres de la famille.'] },
    { x: 16, y: 12, dialogue: ['La boîte aux lettres de Felix et de ses frères et sœur.'] },
    { ...ROPE_SPOT, ...ROPE_CONDITIONS, script: ROPE },
    // Le ferry qui a amené la famille de Fort-de-France.
    ...Array.from({ length: (BOAT_POS.w + 1) * BOAT_POS.h }, (_, i) => ({
      x: BOAT_POS.x + (i % (BOAT_POS.w + 1)),
      y: BOAT_POS.y + Math.floor(i / (BOAT_POS.w + 1)),
      dialogue: ['Le ferry de Fort-de-France. Ta vie est ici, maintenant.'],
    })),
  ],
  npcs: [
    // Arrivée : Papa et Manon arrivent en courant (ils suivent ensuite Pierre jusqu'à la clinique).
    {
      id: 'papa', name: 'Papa', x: 10, y: 7, facing: 'left', color: 0x3f6fd8,
      ifFlags: [FLAGS.departFortDeFrance], unlessFlags: [FLAGS.familleSuit],
      dialogue: ["Maman est à la clinique. Suis-nous !"],
    },
    {
      id: 'manon', name: 'Manon', x: 11, y: 6, facing: 'left', color: 0xf0a030,
      ifFlags: [FLAGS.departFortDeFrance], unlessFlags: [FLAGS.familleSuit],
      dialogue: ['Vite, viens avec nous !'],
    },
    // En sortant de la clinique, Felix (ton cousin) vient à ta rencontre, puis te suit jusqu'à chez lui.
    {
      id: 'felix', name: 'Felix', x: 17, y: 21, facing: 'right', color: COUSIN_COLORS.felix,
      ifSouvenirs: [ROLES.grandFrere.id], unlessFlags: [FLAGS.felixInvite],
      dialogue: ["Cousin ! Ça y est, on a emménagé ! La maison au toit de chaume, sur la rue du milieu, juste sous la vôtre. Viens, les autres t'attendent !"],
    },
    // Chantier de la cabane : Joshua devant l'enclos à poules, Yanis près du lac.
    {
      id: 'joshua', name: 'Joshua', x: 26, y: 8, facing: 'left', color: COUSIN_COLORS.joshua,
      ifFlags: [FLAGS.planCabane], unlessFlags: [FLAGS.cabaneFinie],
      script: [
        { ifItems: [ITEMS.planches.id], speaker: 'Joshua', say: ['Avec ces planches, on va faire un vrai QG.'], end: true },
        { speaker: 'Joshua', say: ['Les planches sont au fond de l\'enclos à poules… derrière les poules.'] },
      ],
    },
    {
      id: 'yanis', name: 'Yanis', x: 4, y: 6, facing: 'right', color: COUSIN_COLORS.yanis,
      ifFlags: [FLAGS.planCabane], unlessFlags: [FLAGS.cabaneFinie],
      script: [
        { ifItems: [ITEMS.corde.id], speaker: 'Yanis', say: ['Parfait. Ça tiendra… sûrement.'], end: true },
        { speaker: 'Yanis', say: ["J'ai vu une vieille corde dans les hautes herbes, tout au sud-ouest. Derrière le lac."] },
      ],
    },
    // Les poules gardent le tas de planches (coin de l'enclos) ; effrayées, elles filent de l'autre côté.
    { id: 'poule-1', name: 'Poule', x: 25, y: 4, facing: 'right', unlessFlags: [FLAGS.pouleEnfuie1], script: henScript(FLAGS.pouleEnfuie1) },
    { id: 'poule-1b', name: 'Poule', x: 24, y: 6, facing: 'down', ifFlags: [FLAGS.pouleEnfuie1], dialogue: ['Cot… cot.'] },
    { id: 'poule-2', name: 'Poule', x: 26, y: 5, facing: 'up', unlessFlags: [FLAGS.pouleEnfuie2], script: henScript(FLAGS.pouleEnfuie2) },
    { id: 'poule-2b', name: 'Poule', x: 26, y: 6, facing: 'left', ifFlags: [FLAGS.pouleEnfuie2], dialogue: ['Cot… cot.'] },
    { id: 'poule-3', name: 'Poule', x: 24, y: 4, facing: 'down', dialogue: ['Cot cot !'] },
  ],
  events: [
    // Arrivée après la traversée : écran noir, puis Papa et Manon te trouvent au bord du lac.
    { on: 'enter', ifFlags: [FLAGS.departFortDeFrance], unlessFlags: [FLAGS.saArrivee], steps: ARRIVAL },
    // En sortant de la clinique : Felix vient te parler, puis te suit.
    {
      on: 'enter',
      ifSouvenirs: [ROLES.grandFrere.id],
      unlessFlags: [FLAGS.felixInvite],
      steps: [{ talk: 'felix' }, { setFlag: FLAGS.felixInvite }],
    },
  ],
  triggers: [
    // Route du nord : on part en voiture (voir la voiture de la famille) ; ensuite, la route de Montépilloy à pied.
    ...[14, 15].map((x) => ({
      x,
      y: 0,
      ifFlags: [FLAGS.arriveeMontepilloy],
      dialogue: ['La route de Montépilloy. On y partira en voiture, avec la famille.'],
      warp: { map: 'routeMontepilloy', x: 10, y: 28, facing: 'up' },
    })),
    // La corde se ramasse aussi en marchant dessus.
    { ...ROPE_SPOT, ...ROPE_CONDITIONS, script: ROPE },
  ],
  spawn: { x: 5, y: 10, facing: 'left' },
};
