import { parseGrid } from './parseGrid.js';

// Corse — petit village de montagne au milieu des châtaigniers et du maquis, 24 x 20 cases.
// Légende : voir src/data/tiles.js (Ŧ = vieux châtaignier, ĥ = maquis, ŕ = rocher, ¢ = chèvre, F = clôture)
export const corseMap = {
  id: 'corse',
  name: 'Corse',
  grid: parseGrid([
    'TTTTTTTTTTTTTTTTTTTTTTTT', // 0
    'TTTTTTTTTTTTTTTTTTTTTTTT', // 1
    'TTŕ..................ŕTT', // 2
    'TT.RRRRR..ŦŦŦ...RRRRR.TT', // 3  tes parents, le vieux châtaignier, Léo et Théo
    'TTfRRRRR..ŦŦŦ..fRRRRR.TT', // 4
    'TT.WWWWWffŦŦŦf..WWWWWfTT', // 5
    'TTfWDWWW..ŦŦŦ...WDWWWfTT', // 6
    'TT.çççççççççççççççççç.TT', // 7  ruelle du village
    'TT.çççççççççççççççççç.TT', // 8
    'TTƀ........çç.ƀ....ĥĥĥTT', // 9
    'TT.......ƀ.çç......ĥĥĥTT', // 10
    'TT.FFFFFF..çç..RRRRR..TT', // 11  enclos des chèvres, maison fermée
    'TT.F..¢.F..çç.fRRRRRŕ.TT', // 12
    'TT.F.¢..F.ŕçç..WWWWW.ƀTT', // 13
    'TT.F...¢Ff.çç..WDWWW..TT', // 14
    'TT.FFFFFF..ççççççç....TT', // 15
    'TTĥĥĥĥĥ....çççççççĥĥĥĥTT', // 16  maquis
    'TTĥĥĥĥĥ..ƀ.ççSƀ...ĥĥĥĥTT', // 17
    'TTTTTTTTTT.çç.TTTTTTTTTT', // 18  chemin du port (retour à Toulon)
    'TTTTTTTTTT.çç.TTTTTTTTTT', // 19
  ]),
  doors: [
    { x: 4, y: 6, interior: 'corseParents' },   // la maison de tes parents
    { x: 17, y: 6, interior: 'corseVoisins' },  // Léo et Théo, les voisins
    { x: 16, y: 14, lockedDialogue: ['[Texte provisoire] Personne ne répond...'] },
  ],
  buildings: [
    { type: 'house', x: 3, y: 3 },
    { type: 'slateHouse', x: 16, y: 3 },
    { type: 'cottage', x: 15, y: 11 },
  ],
  objects: [
    { x: 13, y: 17, dialogue: ['Village — Le port est en contrebas.'] },
  ],
  triggers: [11, 12].map((x) => ({
    x,
    y: 19,
    readyDialogue: ['Tu redescends au port et reprends le ferry pour Toulon.'],
    warp: { map: 'toulon', x: 10, y: 14, facing: 'up' },
  })),
  surroundings: 'T',
  spawn: { x: 11, y: 18, facing: 'up' },
};
