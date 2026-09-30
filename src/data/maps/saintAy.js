import { parseGrid } from './parseGrid.js';
import { FLAGS } from '../story.js';

// Le bateau de l'étang : arrivée de Fort-de-France (le joueur débarque sur la berge, à droite).
const BOAT_POS = { x: 8, y: 24, w: 3, h: 2 };

// Saint-Ay (Loiret) — petit village de campagne, 40 x 32 cases, façon Rouge Feu : la grand-rue nord-sud
// (route de Montépilloy) croise deux rues ; en haut, la chaumière de la famille et la maison de Felix, avec
// leurs parterres ; en bas, la maison verte des voisins, le potager, l'hôpital et la maison bleue ; au sud,
// l'étang (arrivée en bateau), un grand arbre, la ferme au toit orange et ses champs. Tout autour, des
// champs de blé et de terre labourée clôturés de blanc, et une ceinture d'arbres.
// Légende : voir src/data/tiles.js (ç = chemin, ʬ = blé, ʭ = terre labourée, F = barrière, ~ = étang,
// B = bateau, T = arbre, Ŧ = grand arbre feuillu, ƚ = petit arbre, ƀ = buisson, f = fleurs, ĥ = hautes herbes,
// S = panneau, M = boîte aux lettres, R / W / D = toit, mur, porte des bâtiments)
export const saintAyMap = {
  id: 'saintAy',
  name: 'Saint-Ay',
  grid: parseGrid([
    'TTTTTTTTTTTTTTTTTTççTTTTTTTTTTTTTTTTTTTT', // 0
    'TTTTTTTTTTTTTTTTTTççTTTTTTTTTTTTTTTTTTTT', // 1
    'TTFFFFFF...ĥĥĥĥĥƚ.ççS..ĥĥĥĥĥ....FFFFFFTT', // 2
    'TTFʬʬʬʬF.ƚƀĥĥĥĥĥ..çç.ƚ.ĥĥĥĥĥ.ƀƚ.FʬʬʬʬFTT', // 3
    'TTFʬʬʬʬF..........çç...ƀ........FʬʬʬʬFTT', // 4
    'TTFʬʬʬʬFRRRRR.....çç....RRRRR...FʬʬʬʬFTT', // 5
    'TTFʬʬʬʬFRRRRR.fff.çç.ff.RRRRR...FʬʬʬʬFTT', // 6
    'TTFʬʬʬʬFWWWWW.fff.çç.ff.WWWWW...FʬʬʬʬFTT', // 7
    'TTFFFFFFWDWWWMfff.çç.ff.WDWWWM..FFFFFFTT', // 8
    'TT..çççççççççççççççççççççççççççççççç..TT', // 9
    'TT..çççççççççççççççççççççççççççççççç..TT', // 10
    'TT..ƀƀ......FFFFFSçç.............FFFFFTT', // 11
    'TTTT..RRRRR.FʭʭʭF.çç.RRRRR.RRRRRRFʭʭʭFTT', // 12
    'TTTT..RRRRR.FʭʭʭF.çç.RRRRR.RRRRRRFʭʭʭFTT', // 13
    'TTTT..WWWWW.FʭʭʭF.çç.WWWWW.WWWWWWFʭʭʭFTT', // 14
    'TTTT..WDWWW.FFFFF.ççSWWDWW.WWDWWWFFFFFTT', // 15
    'TT..çççççççççççççççççççççççççççççççç..TT', // 16
    'TT..çççççççççççççççççççççççççççççççç..TT', // 17
    'TT...........ŦŦŦTTçç..................TT', // 18
    'TTĥĥ.........ŦŦŦTTçç.ffff.RRRRFFFFFFFFTT', // 19
    'TTĥĥ~~~~~~~..ŦŦŦ.ƚçç.ffff.RRRRFʬʬʬʬʬʬFTT', // 20
    'TTĥĥ~~~~~~~..ŦŦŦ..çç.ffff.WWWWFʬʬʬʬʬʬFTT', // 21
    'TTĥĥ~~~~~~~.......çç.....ƚWDWWFʬʬʬʬʬʬFTT', // 22
    'TTĥĥ~~~~~~~ççççççççççççççççç..FʬʬʬʬʬʬFTT', // 23
    'TTĥĥ~~~~BBBççççççççççççççççç..FʬʬʬʬʬʬFTT', // 24
    'TTĥĥ~~~~BBB.................ƀ.FʬʬʬʬʬʬFTT', // 25
    'TTĥĥ~~~~~~~.ƚ...ƀ...FFFFFFFF..FʬʬʬʬʬʬFTT', // 26
    'TTĥĥ~~~~~~~....ƚ....FʭʭʭʭʭʭF..FʬʬʬʬʬʬFTT', // 27
    'TTĥĥĥĥĥĥĥĥĥĥĥ.......FʭʭʭʭʭʭF..FFFFFFFFTT', // 28
    'TT...........ƀ......FFFFFFFF..........TT', // 29
    'TTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTT', // 30
    'TTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTT', // 31
  ]),
  // Portes -> intérieur. Au retour, le joueur réapparaît sous la porte. Sans intérieur : porte fermée.
  doors: [
    { x: 9, y: 8, interior: 'playerHouse' },
    {
      x: 25, y: 8, interior: 'felixHouse',
      lock: { ifFlags: [FLAGS.felixInvite] },
      lockedDialogue: ['[Texte provisoire] Personne ne répond...'],
    },
    {
      x: 23, y: 15, interior: 'hospital',
      lock: { ifFlags: [FLAGS.familleSuit] },
      lockedDialogue: ["[Texte provisoire] L'hôpital... Ce n'est pas encore le moment d'entrer."],
    },
    { x: 7, y: 15, lockedDialogue: ['La maison des voisins. Personne ne répond.'] },
    { x: 29, y: 15, lockedDialogue: ["Un mot est collé sur la porte : « Parti au marché d'Orléans. »"] },
    { x: 27, y: 22, lockedDialogue: ['La ferme. On entend les poules caqueter derrière la porte.'] },
  ],
  // Bâtiments (coin haut-gauche, en cases) ; la collision reste dans la grille.
  buildings: [
    { type: 'cottage', x: 8, y: 5 },
    { type: 'slateHouse', x: 24, y: 5 },
    { type: 'house', x: 6, y: 12 },
    { type: 'clinic', x: 21, y: 12 },
    { type: 'blueHouse', x: 27, y: 12 },
    { type: 'fishingHut', x: 26, y: 19 },
    { type: 'boat', x: BOAT_POS.x, y: BOAT_POS.y },
  ],
  objects: [
    { x: 20, y: 2, dialogue: ['Nord : route de Montépilloy.'] },
    { x: 17, y: 11, dialogue: ['Saint-Ay, Loiret. Bienvenue au village !'] },
    { x: 20, y: 15, dialogue: ['Hôpital de Saint-Ay.'] },
    { x: 13, y: 8, dialogue: ['Une boîte aux lettres toute neuve. Le nom de la famille est déjà écrit dessus.'] },
    { x: 29, y: 8, dialogue: ['La boîte aux lettres de la famille de Felix.'] },
    // Le bateau de l'étang ramène à Fort-de-France (face au bateau + Entrée).
    ...Array.from({ length: BOAT_POS.w * BOAT_POS.h }, (_, i) => ({
      x: BOAT_POS.x + (i % BOAT_POS.w),
      y: BOAT_POS.y + Math.floor(i / BOAT_POS.w),
      readyDialogue: ['Tu reprends le bateau pour Fort-de-France.'],
      warp: { map: 'fortDeFrance', x: 15, y: 25, facing: 'up' },
    })),
  ],
  // Felix attend à la sortie de l'hôpital ; après son invitation, il te suit jusqu'à chez lui.
  npcs: [
    {
      id: 'felix', name: 'Felix', x: 25, y: 17, facing: 'left', color: 0x9060d0,
      ifFlags: [FLAGS.familleArrivee],
      unlessFlags: [FLAGS.felixInvite],
      dialogue: [
        "[Felix - texte provisoire] Salut ! Moi c'est Felix. Je viens d'emménager avec ma famille.",
        "On habite dans la maison au toit d'ardoise, en haut à droite. Viens nous rendre visite !",
      ],
      souvenir: { id: 'souvenir-felix', name: 'Souvenir de Felix' },
    },
  ],
  // En sortant de l'hôpital : Felix vient te parler.
  events: [
    {
      on: 'enter',
      ifFlags: [FLAGS.familleArrivee],
      unlessFlags: [FLAGS.felixInvite],
      steps: [{ talk: 'felix' }, { setFlag: FLAGS.felixInvite }],
    },
  ],
  // Sortie nord : la route de Montépilloy, une fois tout fini à Saint-Ay (visite chez Felix).
  triggers: [18, 19].map((x) => ({
    x,
    y: 0,
    ifFlags: [FLAGS.maisonFelixVisitee],
    dialogue: ["[Texte provisoire] Tu as encore des choses à faire à Saint-Ay."],
    readyDialogue: ['Tu prends la route de Montépilloy.'],
    setFlags: [FLAGS.arriveeMontepilloy],
    warp: { map: 'montepilloy', x: 11, y: 22, facing: 'up' },
  })),
  spawn: { x: 11, y: 24, facing: 'left' },
};
