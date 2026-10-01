import { parseGrid } from './parseGrid.js';
import { FLAGS, ITEMS, ROLES } from '../story.js';
import {
  ARRIVAL, PLANKS, ROPE, CAR, henScript, FELIX_AT_CABANE, CABANE_SPOTS,
} from '../saintAyStory.js';

// Le ferry (le même qu'à Fort-de-France), amarré à gauche du ponton du lac ; une case d'eau entre les deux.
const BOAT_POS = { x: 0, y: 9, w: 4, h: 2 };

// Saint-Ay (Loiret) — petit village de campagne, 30 x 24 cases, façon Rouge Feu : la route de Montépilloy
// (nord-sud) croise la rue des maisons (chaumière de la famille avec son grand arbre, maison de Felix) et la
// rue de l'hôpital ; potager, champs de blé et de terre labourée clôturés de blanc ; au sud, la ferme et sa
// cour (planches gardées par les poules). À l'ouest, le lac touche le bord de la carte : petit ponton, ferry,
// bitte d'amarrage. Au sud-ouest, un coin de hautes herbes caché où traîne la vieille corde pendant le
// chantier de la cabane. Ceinture d'arbres ailleurs.
// Scénario : voir data/saintAyStory.js.
// Légende : voir src/data/tiles.js (ç = chemin, ʬ = blé, ʭ = terre labourée, F = barrière, ~ = lac,
// B = ferry, = = ponton, T = arbre, ƚ = petit arbre, ƀ = buisson, f = fleurs, ĥ = hautes herbes,
// S = panneau, M = boîte aux lettres, ʀ = tas de planches, ɓ = bitte d'amarrage, R / W / D = toit, mur,
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
    'TTTTRRRRR.....ççSRRRRR.FFFFFTT', // 2
    'TTTTRRRRR.fff.çç.RRRRR.FʬʬʬFTT', // 3
    'TT..WWWWW.fff.çç.WWWWW.FʬʬʬFTT', // 4
    'TT..WDWWWMfff.ççMWDWWW.FʬʬʬFTT', // 5
    'TTçççççççççççççççççççççFʬʬʬFTT', // 6
    'TTçççççççççççççççççççççFʬʬʬFTT', // 7
    '~~~~~==~ɓFFFFFçç.......FFFFFTT', // 8
    'BBBB~==~.FʭʭʭFçç.RRRRR.....ƚTT', // 9
    'BBBB~==~.FʭʭʭFçç.RRRRR.FFFFFTT', // 10
    '~~~~~==~.FʭʭʭFçç.WWWWW.FʭʭʭFTT', // 11
    '~~~~~~~~.FFFFFççSWWDWW.FʭʭʭFTT', // 12
    '~~~~~~~~çççççççççççççççFʭʭʭFTT', // 13
    '~~~~~~~~çççççççççççççççFFFFFTT', // 14
    '~~~~~~~~......ççS.....FFFFFFTT', // 15
    '~~~~~~~~.FFFFFçç.RRRR.F...ʀFTT', // 16
    '~~~~~~~~.FʬʬʬFçç.RRRR.F....FTT', // 17
    '~~~~~~~~.FʬʬʬFçç.WWWW.F....FTT', // 18
    '~~~~~~~~.FʬʬʬFçç.WDWW.F....FTT', // 19
    'TTĥĥĥĥĥĥ.FʬʬʬFçççççççç.....FTT', // 20
    'TTĥĥĥĥĥĥ.FFFFF..ƚ....ƀFFFFFFTT', // 21
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
      lockedDialogue: ["L'hôpital de Saint-Ay. Tu n'as rien à y faire pour l'instant."],
    },
    { x: 18, y: 19, lockedDialogue: ['La ferme. On entend les poules caqueter derrière la porte.'] },
  ],
  // Bâtiments (coin haut-gauche, en cases) ; la collision reste dans la grille.
  buildings: [
    { type: 'cottage', x: 4, y: 2 },
    { type: 'slateHouse', x: 17, y: 2 },
    { type: 'clinic', x: 17, y: 9 },
    { type: 'fishingHut', x: 17, y: 16 },
    { type: 'ferry', x: BOAT_POS.x, y: BOAT_POS.y },
  ],
  // La voiture chargée attend devant la maison après l'annonce de Papa : on y monte pour partir. Elle
  // disparaît une fois le trajet fait.
  props: [
    { type: 'familyCar', x: 10, y: 6, w: 3, h: 2, facing: 'right', ifFlags: [FLAGS.annonceMutation], unlessFlags: [FLAGS.arriveeMontepilloy], script: CAR },
  ],
  // Décors liés à l'histoire : la corde dans les hautes herbes (pendant le chantier), la cabane à l'emplacement choisi.
  decals: [
    { kind: 'rope', ...ROPE_SPOT, ...ROPE_CONDITIONS },
    ...Object.entries(CABANE_SPOTS).map(([flag, spot]) => ({
      kind: 'cabane', ...spot.decal, place: { [FLAGS.cabaneArbre]: 'arbre', [FLAGS.cabaneEtang]: 'etang', [FLAGS.cabaneChamp]: 'champ' }[flag],
      ifFlags: [flag],
    })),
  ],
  objects: [
    { x: 16, y: 2, dialogue: ['Nord : route de Montépilloy.'] },
    { x: 16, y: 15, dialogue: ['Saint-Ay, Loiret. Bienvenue au village !'] },
    { x: 16, y: 12, dialogue: ['Hôpital de Saint-Ay.'] },
    { x: 9, y: 5, dialogue: ['La boîte aux lettres de la famille.'] },
    { x: 16, y: 5, dialogue: ['La boîte aux lettres de Felix et de ses frères et sœur.'] },
    { x: 26, y: 16, script: PLANKS },
    { x: 8, y: 8, dialogue: ["Une bitte d'amarrage en bois."] },
    { ...ROPE_SPOT, ...ROPE_CONDITIONS, script: ROPE },
    // Le ferry qui a amené la famille de Fort-de-France.
    ...Array.from({ length: (BOAT_POS.w + 1) * BOAT_POS.h }, (_, i) => ({
      x: BOAT_POS.x + (i % (BOAT_POS.w + 1)),
      y: BOAT_POS.y + Math.floor(i / (BOAT_POS.w + 1)),
      dialogue: ['Le ferry de Fort-de-France. Ta vie est ici, maintenant.'],
    })),
  ],
  npcs: [
    // Arrivée : Papa et Manon arrivent en courant (ils suivent ensuite Pierre jusqu'à l'hôpital).
    {
      id: 'papa', name: 'Papa', x: 10, y: 7, facing: 'left', color: 0x3f6fd8,
      ifFlags: [FLAGS.departFortDeFrance], unlessFlags: [FLAGS.familleSuit],
      dialogue: ["Maman est à l'hôpital. Suis-nous !"],
    },
    {
      id: 'manon', name: 'Manon', x: 11, y: 6, facing: 'left', color: 0xf0a030,
      ifFlags: [FLAGS.departFortDeFrance], unlessFlags: [FLAGS.familleSuit],
      dialogue: ['Vite, viens avec nous !'],
    },
    // En sortant de l'hôpital, Felix (ton cousin) vient à ta rencontre, puis te suit jusqu'à chez lui.
    {
      id: 'felix', name: 'Felix', x: 21, y: 13, facing: 'left', color: COUSIN_COLORS.felix,
      ifSouvenirs: [ROLES.grandFrere.id], unlessFlags: [FLAGS.felixInvite],
      dialogue: ["Cousin ! Ça y est, on a emménagé ! La maison au toit d'ardoise, en haut à droite. Viens, les autres t'attendent !"],
    },
    // Chantier de la cabane : Joshua à la ferme, Yanis près du lac.
    {
      id: 'joshua', name: 'Joshua', x: 21, y: 19, facing: 'right', color: COUSIN_COLORS.joshua,
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
    // Les cousins à la cabane, une fois construite (selon l'emplacement choisi).
    ...Object.entries(CABANE_SPOTS).flatMap(([flag, spot]) => [
      {
        id: 'felix-cabane', name: 'Felix', x: spot.felix[0], y: spot.felix[1], facing: spot.felix[2], color: COUSIN_COLORS.felix,
        ifFlags: [flag, FLAGS.cabaneFinie], script: FELIX_AT_CABANE,
      },
      {
        id: 'joshua-cabane', name: 'Joshua', x: spot.joshua[0], y: spot.joshua[1], facing: spot.joshua[2], color: COUSIN_COLORS.joshua,
        ifFlags: [flag, FLAGS.cabaneFinie], dialogue: ["Personne n'entre sans le mot de passe."],
      },
      {
        id: 'yanis-cabane', name: 'Yanis', x: spot.yanis[0], y: spot.yanis[1], facing: spot.yanis[2], color: COUSIN_COLORS.yanis,
        ifFlags: [flag, FLAGS.cabaneFinie], dialogue: ['On a vraiment un mot de passe ?'],
      },
    ]),
  ],
  events: [
    // Arrivée après la traversée : écran noir, puis Papa et Manon te trouvent au bord du lac.
    { on: 'enter', ifFlags: [FLAGS.departFortDeFrance], unlessFlags: [FLAGS.saArrivee], steps: ARRIVAL },
    // En sortant de l'hôpital : Felix vient te parler, puis te suit.
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
