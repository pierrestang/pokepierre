import { parseGrid } from './parseGrid.js';
import { FLAGS } from '../story.js';

// Route de Bonsecours — entre Montépilloy (au sud) et le Prytanée (au nord), 24 x 30 cases : un chemin de terre
// qui traverse la cour du collège Bonsecours (clôture blanche, portails au sud et au nord). Au bout, deux
// sentinelles gardent la route du Prytanée tant que la quête Bonsecours n'est pas finie.
// Légende : voir src/data/tiles.js (ç = chemin, F = clôture, ĥ = hautes herbes, ŕ = rocher)
const GUARD = { name: 'Sentinelle', color: 0x3c5c2c, facing: 'down', unlessFlags: [FLAGS.bonsecoursFini] };
const GUARD_LINES = ["[Texte provisoire] Halte ! Le Prytanée n'accueille que les élèves qui ont fini leur année à Bonsecours."];

export const routeBonsecoursMap = {
  id: 'routeBonsecours',
  name: 'Route de Bonsecours',
  grid: parseGrid([
    'TTTTTTTTTTççTTTTTTTTTTTT', // 0  nord : le Prytanée (gardé tant que la quête Bonsecours n'est pas finie)
    'TTTTTTTTTTççTTTTTTTTTTTT', // 1
    'TTTTTTTT..çççççççç....TT', // 2
    'TTTTTTTT..çççççççç.f..TT', // 3
    'TTTT..ĥĥĥĥ..ĥĥĥĥççTT..TT', // 4
    'TTTT..ĥĥĥĥ..ĥĥĥĥççTT..TT', // 5
    'TT.f........ĥĥĥĥçç..f.TT', // 6
    'TT..FFFFFFFFFFFFççFF..TT', // 7  cour du collège (clôture blanche, portails nord et sud)
    'TT..FƀRRRRRRRƀ..ççƀF..TT', // 8  collège Bonsecours
    'TT..F.RRRRRRR...çç.F..TT', // 9
    'TT..F.WWWWWWW...çç.F..TT', // 10
    'TT..F.WWWDWWWS..çç.F..TT', // 11
    'TT..F.çççççççççççç.F..TT', // 12  allée devant le collège
    'TT..F.çççççççççççç.F..TT', // 13
    'TT..Fffff.çç.......F..TT', // 14
    'TT..Fffff.çç.fff..ƀF..TT', // 15
    'TT..Fffff.çç.fff...F..TT', // 16
    'TT..FFFFFFççFFFFFFFF..TT', // 17
    'TTTT..f...çç......TT..TT', // 18
    'TTTT...ŕ..çç.ĥĥĥĥ.TT..TT', // 19
    'TTTTTT....çç.ĥĥĥĥ.TT..TT', // 20
    'TTTTTT..f.çç.ĥĥĥĥ.TT..TT', // 21
    'TT........çç.....f....TT', // 22
    'TT..ĥĥĥĥĥ.çç.......ŕ..TT', // 23
    'TT..ĥĥĥĥĥ.çç..TTTT....TT', // 24
    'TT.ŕĥĥĥĥĥ.çç..TTTT....TT', // 25
    'TT..ĥĥĥĥĥ.ççS.f....f..TT', // 26
    'TT........çç..........TT', // 27
    'TTTTTTTTTTççTTTTTTTTTTTT', // 28  sud : Montépilloy
    'TTTTTTTTTTççTTTTTTTTTTTT', // 29
  ]),
  doors: [
    { x: 9, y: 11, interior: 'bonsecours' },
  ],
  buildings: [
    { type: 'lab', x: 6, y: 8 },
  ],
  npcs: [
    { ...GUARD, id: 'sentinelle-1', x: 10, y: 2, dialogue: GUARD_LINES },
    { ...GUARD, id: 'sentinelle-2', x: 11, y: 2, dialogue: GUARD_LINES },
  ],
  objects: [
    { x: 13, y: 11, dialogue: ['Collège Bonsecours.'] },
    { x: 12, y: 26, dialogue: ['Route de Bonsecours — Sud : Montépilloy. Nord : Prytanée.'] },
  ],
  triggers: [
    // Sud : retour à Montépilloy.
    ...[10, 11].map((x) => ({ x, y: 29, warp: { map: 'montepilloy', x: 14, y: 1, facing: 'down' } })),
    // Nord : le Prytanée, une fois la quête Bonsecours finie.
    ...[10, 11].map((x) => ({
      x,
      y: 0,
      ifFlags: [FLAGS.bonsecoursFini],
      dialogue: GUARD_LINES,
      readyDialogue: ['Ton année au collège Bonsecours terminée, tu prends la route du Prytanée.'],
      setFlags: [FLAGS.arriveePrytanee],
      warp: { map: 'prytanee', x: 14, y: 22, facing: 'up' },
    })),
  ],
  surroundings: 'T',
  spawn: { x: 10, y: 27, facing: 'up' },
};
