import { parseGrid } from './parseGrid.js';

// Corse — petit village de montagne dans le maquis, 24 x 20 cases (comme Montépilloy).
// Légende : voir src/data/tiles.js (▲ = rocher, ♣ = maquis, ¢ = chèvre, T = châtaignier)
export const corseMap = {
  id: 'corse',
  name: 'Corse',
  grid: parseGrid([
    '▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲', // 0  montagnes
    '▲▲.▲▲▲▲▲..▲▲▲..▲....▲▲▲▲', // 1
    '▲......................▲', // 2  village
    '▲..RRRRR..RRRRR..RRRRR.▲', // 3  maisons de pierre : tes parents, Léo et Théo, une maison fermée
    '▲..RRRRR..RRRRR..RRRRR.▲', // 4
    '▲..WWWWW..WWWWW..WWWWW▲▲', // 5
    '▲..WWDWW..WWDWW..WWDWW.▲', // 6  portes
    '▲.CCCCCCCCCCCCCCCCCCCC.▲', // 7  ruelle du village
    '▲▲ƚ.....ƚ..CC..ƚ.....ƚ▲▲', // 8
    '▲▲♣♣♣♣.♣.▲♣CC.♣.♣▲♣♣..▲▲', // 9  maquis
    '▲.ƚ.♣ƚ..♣.♣CC♣.ƚ♣♣¢.♣..▲', // 10
    '▲.ƚ...¢.♣♣.CC.♣♣..♣...▲▲', // 11
    '▲.▲♣♣.♣.♣..CC♣♣.♣♣...♣.▲', // 12
    '▲▲.♣♣♣▲♣♣ƚ.CC♣ƚ.¢...♣♣▲▲', // 13
    '▲.♣...♣...ƚCC.♣........▲', // 14
    '▲.ƚ...▲....CCƚ..♣....ƚ▲▲', // 15
    '▲▲..▲.♣.¢..CC♣....♣♣ƚ..▲', // 16
    '▲.♣♣..▲.ƚ.♣CC▲...ƚ.ƚ♣.▲▲', // 17
    '▲▲....♣♣.♣♣CC▲..ƚ...♣♣▲▲', // 18
    '▲.........▲CC▲.........▲', // 19 chemin vers le port (retour à Toulon)
  ]),
  doors: [
    { x: 5,  y: 6, interior: 'corseParents' },   // la maison de tes parents
    { x: 12, y: 6, interior: 'corseVoisins' },   // Léo et Théo, les voisins
    { x: 19, y: 6, lockedDialogue: ['[Texte provisoire] Personne ne répond...'] },
  ],
  buildings: [
    { type: 'stoneHouse', x: 3,  y: 3, variant: 1 },
    { type: 'stoneHouse', x: 10, y: 3, variant: 0 },
    { type: 'stoneHouse', x: 17, y: 3, variant: 2 },
  ],
  triggers: [11, 12].map((x) => ({
    x,
    y: 19,
    readyDialogue: ['Tu redescends au port et reprends le ferry pour Toulon.'],
    warp: { map: 'toulon', x: 10, y: 14, facing: 'up' },
  })),
  surroundings: '▲',
  spawn: { x: 11, y: 18, facing: 'up' },
};
