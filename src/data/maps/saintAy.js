import { parseGrid } from './parseGrid.js';
import { FLAGS, ITEMS, ROLES } from '../story.js';
import {
  ARRIVAL, PLANKS, ROPE, CAR, henScript, CABANE_SPOT,
} from '../saintAyStory.js';

// Le ferry (le même qu'à Fort-de-France), amarré à gauche du ponton du lac ; une case d'eau entre les deux.
const BOAT_POS = { x: 0, y: 9, w: 4, h: 2 };

// Saint-Ay (Loiret) — petit village de campagne, 30 x 24 cases, façon Rouge Feu : la route de Montépilloy
// (nord-sud) croise la rue des maisons (chaumière de la famille, maison de Felix) et la rue de la clinique ;
// prés de hautes herbes aux formes irrégulières ; au sud, la grande
// ferme, son chemin tout droit jusque dans la cour aux poules (planches gardées par les poules). À l'ouest, le lac
// (rives de terre) touche le bord de la carte : petit ponton et ferry ; au sud du lac, la cabane des cousins
// posée sur deux sapins de la forêt (blocs de la grille), une rangée de sapins à sa droite. Au sud-ouest, un coin de hautes herbes caché où traîne la vieille corde pendant le
// chantier de la cabane. Ceinture d'arbres ailleurs.
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
    'TTTTTTTTTTTTTTççTTTTTTTTTTTTTT', // 0
    'TTTTTTTTTTTTTTççTTTTTTTTTTTTTT', // 1
    'TTTTRRRRR.....ççSRRRRR..ĥĥ..TT', // 2
    'TTTTRRRRR.fff.çç.RRRRR.ĥĥĥĥ.TT', // 3
    'TT..WWWWW.fff.çç.WWWWW..ĥĥĥĥTT', // 4
    'TT..WDWWWMfff.ççMWDWWW...ĥĥĥTT', // 5
    'TTççççççççççççççççççççç.ĥĥĥ.TT', // 6
    'TTçççççççççççççççççççççĥĥĥ..TT', // 7
    '~~~~~==~..ĥĥ..çç........ĥĥĥ.TT', // 8
    'BBBB~==~.ĥĥĥĥ.çç.RRRRR....ĥ.TT', // 9
    'BBBB~==~ĥĥĥĥĥ.çç.RRRRR..ĥĥ..TT', // 10
    '~~~~~==~.ĥĥĥ..çç.WWWWW.ĥĥĥĥ.TT', // 11
    '~~~~~~~~..ĥĥ..ççSWWDWW..ĥĥĥĥTT', // 12
    '~~~~~~~~ççççççççççççççç..ĥĥĥTT', // 13
    '~~~~~~~~ççççççççççççççç..ĥĥ.TT', // 14
    '~~~~~~~~.....SççRRRRRRFFFFFFTT', // 15
    'TTTTTTTT...ĥĥ.ççRRRRRRF....FTT', // 16
    'TTTTTTTT..ĥĥĥĥççWWWWWWF....FTT', // 17
    'TTTTTTTT.ĥĥĥĥ.ççWDWWWWF....FTT', // 18
    'TTTTTTTT..ĥĥĥĥçç...WWWF....FTT', // 19
    'TTĥĥĥĥĥ....ĥĥ.çççççççççç...FTT', // 20
    'TTĥĥĥĥ................FFFFFFTT', // 21
    'TTTTTTTTTTTTTTTTTTTTTTTTTTTTTT', // 22
    'TTTTTTTTTTTTTTTTTTTTTTTTTTTTTT', // 23
  ]),
  // Portes -> intérieur. Au retour, le joueur réapparaît sous la porte. Sans intérieur : porte fermée.
  doors: [
    { x: 5, y: 5, interior: 'playerHouse' },
    {
      x: 18, y: 5, interior: 'felixHouse',
      lock: { ifFlags: [FLAGS.felixInvite] },
      lockedDialogue: ['Personne ne répond.'],
    },
    {
      x: 19, y: 12, interior: 'hospital',
      lock: { ifFlags: [FLAGS.familleSuit] },
      lockedDialogue: ["La clinique de Saint-Ay. Tu n'as rien à y faire pour l'instant."],
    },
    { x: 17, y: 18, lockedDialogue: ['La ferme. On entend les poules caqueter derrière la porte.'] },
    // L'échelle de la cabane : on y monte (porte sans case 'D', ouverte une fois la cabane construite).
    { ...CABANE_SPOT, interior: 'cabane', when: { ifFlags: [FLAGS.cabaneFinie] } },
  ],
  // Bâtiments (coin haut-gauche, en cases) ; la collision reste dans la grille.
  buildings: [
    { type: 'cottage', x: 4, y: 2 },
    { type: 'slateHouse', x: 17, y: 2 },
    { type: 'clinic', x: 17, y: 9 },
    { type: 'farm', x: 16, y: 15 },
    { type: 'ferry', x: BOAT_POS.x, y: BOAT_POS.y },
  ],
  // Obstacles qui dépendent de l'histoire.
  props: [
    // Le tas de planches de la ferme, gardé par les poules ; il disparaît une fois les planches ramassées.
    {
      type: 'planks', x: 26, y: 16, w: 1, h: 1, unlessItems: [ITEMS.planches.id], unlessFlags: [FLAGS.cabaneFinie],
      script: PLANKS,
    },
    // La cabane des cousins, une fois construite, perchée dans les sapins au sud du lac.
    {
      type: 'cabane', x: CABANE_SPOT.x - 1, y: CABANE_SPOT.y - 3, w: 4, h: 3, ifFlags: [FLAGS.cabaneFinie],
      dialogue: ['La cabane des cousins. On y monte par l\'échelle.'],
    },
    // La voiture chargée attend devant la maison après l'annonce de Papa : on y monte pour partir. Elle
    // disparaît une fois le trajet fait, et ne bloque que la rangée du bas de la route (on passe derrière).
    { type: 'familyCar', x: 10, y: 7, w: 3, h: 1, facing: 'right', ifFlags: [FLAGS.annonceMutation], unlessFlags: [FLAGS.arriveeMontepilloy], script: CAR },
  ],
  // Décor lié à l'histoire : la corde dans les hautes herbes (pendant le chantier).
  decals: [
    { kind: 'rope', ...ROPE_SPOT, ...ROPE_CONDITIONS },
  ],
  objects: [
    { x: 16, y: 2, dialogue: ['Nord : route de Montépilloy.'] },
    { x: 13, y: 15, dialogue: ['Saint-Ay, Loiret. Bienvenue au village !'] },
    { x: 16, y: 12, dialogue: ['Clinique de Saint-Ay.'] },
    { x: 9, y: 5, dialogue: ['La boîte aux lettres de la famille.'] },
    { x: 16, y: 5, dialogue: ['La boîte aux lettres de Felix et de ses frères et sœur.'] },
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
      id: 'felix', name: 'Felix', x: 21, y: 13, facing: 'left', color: COUSIN_COLORS.felix,
      ifSouvenirs: [ROLES.grandFrere.id], unlessFlags: [FLAGS.felixInvite],
      dialogue: ["Cousin ! Ça y est, on a emménagé ! La maison au toit d'ardoise, en haut à droite. Viens, les autres t'attendent !"],
    },
    // Chantier de la cabane : Joshua à la ferme, Yanis près du lac.
    {
      id: 'joshua', name: 'Joshua', x: 18, y: 19, facing: 'down', color: COUSIN_COLORS.joshua,
      ifFlags: [FLAGS.planCabane], unlessFlags: [FLAGS.cabaneFinie],
      script: [
        { ifItems: [ITEMS.planches.id], speaker: 'Joshua', say: ['Avec ces planches, on va faire un vrai QG.'], end: true },
        { speaker: 'Joshua', say: ['Les planches sont au fond de la cour… derrière les poules.'] },
      ],
    },
    {
      id: 'yanis', name: 'Yanis', x: 3, y: 7, facing: 'right', color: COUSIN_COLORS.yanis,
      ifFlags: [FLAGS.planCabane], unlessFlags: [FLAGS.cabaneFinie],
      script: [
        { ifItems: [ITEMS.corde.id], speaker: 'Yanis', say: ['Parfait. Ça tiendra… sûrement.'], end: true },
        { speaker: 'Yanis', say: ["J'ai vu une vieille corde dans les hautes herbes, tout au sud-ouest. Derrière le lac."] },
      ],
    },
    // Les poules gardent le tas de planches ; effrayées, elles filent au fond de la cour.
    { id: 'poule-1', name: 'Poule', x: 25, y: 16, facing: 'right', unlessFlags: [FLAGS.pouleEnfuie1], script: henScript(FLAGS.pouleEnfuie1) },
    { id: 'poule-1b', name: 'Poule', x: 23, y: 18, facing: 'down', ifFlags: [FLAGS.pouleEnfuie1], dialogue: ['Cot… cot.'] },
    { id: 'poule-2', name: 'Poule', x: 26, y: 17, facing: 'up', unlessFlags: [FLAGS.pouleEnfuie2], script: henScript(FLAGS.pouleEnfuie2) },
    { id: 'poule-2b', name: 'Poule', x: 24, y: 20, facing: 'left', ifFlags: [FLAGS.pouleEnfuie2], dialogue: ['Cot… cot.'] },
    { id: 'poule-3', name: 'Poule', x: 23, y: 16, facing: 'down', dialogue: ['Cot cot !'] },
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
    // Route du nord : on part en voiture (voir la voiture de la famille).
    ...[14, 15].map((x) => ({ x, y: 0, dialogue: ['La route de Montépilloy. On y partira en voiture, avec la famille.'] })),
    // La corde se ramasse aussi en marchant dessus.
    { ...ROPE_SPOT, ...ROPE_CONDITIONS, script: ROPE },
  ],
  spawn: { x: 5, y: 10, facing: 'left' },
};
