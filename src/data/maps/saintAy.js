import { parseGrid } from './parseGrid.js';
import { FLAGS } from '../story.js';

// Le ferry (le même qu'à Fort-de-France), amarré à gauche du ponton du lac : arrivée de Fort-de-France,
// le joueur débarque sur le ponton. Une case d'eau entre le ponton et le ferry.
const BOAT_POS = { x: 0, y: 9, w: 4, h: 2 };

// Saint-Ay (Loiret) — petit village de campagne, 30 x 24 cases, façon Rouge Feu : la route de Montépilloy
// (nord-sud) croise la rue des maisons (chaumière de la famille, maison de Felix) et la rue de l'hôpital ;
// potager, champs de blé et de terre labourée clôturés de blanc, hautes herbes. À l'ouest, le lac touche le
// bord de la carte : petit ponton et ferry (arrivée de Fort-de-France). Ceinture d'arbres ailleurs.
// Légende : voir src/data/tiles.js (ç = chemin, ʬ = blé, ʭ = terre labourée, F = barrière, ~ = étang,
// B = ferry, = = ponton, T = arbre, Ŧ = grand arbre feuillu, ƚ = petit arbre, ƀ = buisson, f = fleurs, ĥ = hautes herbes,
// S = panneau, M = boîte aux lettres, R / W / D = toit, mur, porte des bâtiments)
export const saintAyMap = {
  id: 'saintAy',
  name: 'Saint-Ay',
  grid: parseGrid([
    'TTTTTTTTTTTTTTççTTTTTTTTTTTTTT', // 0
    'TTTTTTTTTTTTTTççTTTTTTTTTTTTTT', // 1
    'TTƚ.RRRRR.....ççSRRRRR.FFFFFTT', // 2
    'TT..RRRRR.fff.çç.RRRRR.FʬʬʬFTT', // 3
    'TT..WWWWW.fff.çç.WWWWW.FʬʬʬFTT', // 4
    'TT..WDWWWMfff.ççMWDWWW.FʬʬʬFTT', // 5
    'TTçççççççççççççççççççççFʬʬʬFTT', // 6
    'TTçççççççççççççççççççççFʬʬʬFTT', // 7
    '~~~~~==~.FFFFFçç.......FFFFFTT', // 8
    'BBBB~==~.FʭʭʭFçç.RRRRR.....ƚTT', // 9
    'BBBB~==~.FʭʭʭFçç.RRRRR.FFFFFTT', // 10
    '~~~~~==~.FʭʭʭFçç.WWWWW.FʭʭʭFTT', // 11
    '~~~~~~~~SFFFFFççSWWDWW.FʭʭʭFTT', // 12
    '~~~~~~~~çççççççççççççççFʭʭʭFTT', // 13
    '~~~~~~~~çççççççççççççççFFFFFTT', // 14
    '~~~~~~~~....................TT', // 15
    '~~~~~~~~.ĥĥĥĥ...FFFFFFFFFFFFTT', // 16
    '~~~~~~~~.ĥĥĥĥ...FʬʬʬʬʬʬʬʬʬʬFTT', // 17
    '~~~~~~~~.ĥĥĥĥ...FʬʬʬʬʬʬʬʬʬʬFTT', // 18
    '~~~~~~~~........FʬʬʬʬʬʬʬʬʬʬFTT', // 19
    'TTĥĥĥĥĥĥƚ....ƚ..FʬʬʬʬʬʬʬʬʬʬFTT', // 20
    'TTĥĥĥĥĥĥ...ƀ....FFFFFFFFFFFFTT', // 21
    'TTTTTTTTTTTTTTTTTTTTTTTTTTTTTT', // 22
    'TTTTTTTTTTTTTTTTTTTTTTTTTTTTTT', // 23
  ]),
  // Portes -> intérieur. Au retour, le joueur réapparaît sous la porte. Sans intérieur : porte fermée.
  doors: [
    { x: 5, y: 5, interior: 'playerHouse' },
    {
      x: 18, y: 5, interior: 'felixHouse',
      lock: { ifFlags: [FLAGS.felixInvite] },
      lockedDialogue: ['[Texte provisoire] Personne ne répond...'],
    },
    {
      x: 19, y: 12, interior: 'hospital',
      lock: { ifFlags: [FLAGS.familleSuit] },
      lockedDialogue: ["[Texte provisoire] L'hôpital... Ce n'est pas encore le moment d'entrer."],
    },
  ],
  // Bâtiments (coin haut-gauche, en cases) ; la collision reste dans la grille.
  buildings: [
    { type: 'cottage', x: 4, y: 2 },
    { type: 'slateHouse', x: 17, y: 2 },
    { type: 'clinic', x: 17, y: 9 },
    { type: 'ferry', x: BOAT_POS.x, y: BOAT_POS.y },
  ],
  objects: [
    { x: 16, y: 2, dialogue: ['Nord : route de Montépilloy.'] },
    { x: 8, y: 12, dialogue: ['Saint-Ay, Loiret. Bienvenue au village !'] },
    { x: 16, y: 12, dialogue: ['Hôpital de Saint-Ay.'] },
    { x: 9, y: 5, dialogue: ['Une boîte aux lettres toute neuve. Le nom de la famille est déjà écrit dessus.'] },
    { x: 16, y: 5, dialogue: ['La boîte aux lettres de la famille de Felix.'] },
    // Le ferry ramène à Fort-de-France (face au ferry ou à l'eau qui le sépare du ponton + Entrée).
    ...Array.from({ length: (BOAT_POS.w + 1) * BOAT_POS.h }, (_, i) => ({
      x: BOAT_POS.x + (i % (BOAT_POS.w + 1)),
      y: BOAT_POS.y + Math.floor(i / (BOAT_POS.w + 1)),
      readyDialogue: ['Tu reprends le ferry pour Fort-de-France.'],
      warp: { map: 'fortDeFrance', x: 15, y: 26, facing: 'up', ferry: true },
    })),
  ],
  // Felix attend à la sortie de l'hôpital ; après son invitation, il te suit jusqu'à chez lui.
  npcs: [
    {
      id: 'felix', name: 'Felix', x: 21, y: 13, facing: 'left', color: 0x9060d0,
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
  triggers: [14, 15].map((x) => ({
    x,
    y: 0,
    ifFlags: [FLAGS.maisonFelixVisitee],
    dialogue: ["[Texte provisoire] Tu as encore des choses à faire à Saint-Ay."],
    readyDialogue: ['Tu prends la route de Montépilloy.'],
    setFlags: [FLAGS.arriveeMontepilloy],
    warp: { map: 'montepilloy', x: 11, y: 22, facing: 'up' },
  })),
  spawn: { x: 5, y: 10, facing: 'left' },
};
