import { parseGrid } from './parseGrid.js';
import { toAirport, airportSign } from './airportLinks.js';

// Hors de la carte : l'Himalaya au-dessus, le sentier se prolonge, la vallée ailleurs.
function outside(x, y, grid) {
  if (y < 5) return 'Ñ';
  if (y >= 0 && y < grid.length && grid[y][x < 0 ? 0 : grid[0].length - 1] === 'C') return 'C';
  return '.';
}

// Népal — vallée au pied de l'Himalaya : sommets enneigés, grand stupa aux yeux de Bouddha,
// drapeaux de prière, maisons de pierre, champs en terrasses, chèvres, 32 x 26 cases.
// Légende : voir src/data/tiles.js (Ñ = sommet enneigé, ñ = neige, ¶ = drapeaux de prière,
// ň = drapeau népalais, ≈ = champ en terrasse, ¢ = chèvre)
export const nepalMap = {
  id: 'nepal',
  name: 'Népal',
  grid: parseGrid([
    'ÑÑÑÑÑÑÑÑÑÑÑÑÑÑÑÑÑÑÑÑÑÑÑÑÑÑÑÑÑÑÑÑ', // 0
    'ÑÑÑÑÑÑÑÑÑÑÑÑÑÑÑÑÑÑÑÑÑÑÑÑÑÑÑÑÑÑÑÑ', // 1
    'ÑÑÑÑÑÑÑÑÑÑÑÑÑÑÑÑÑÑÑÑÑÑÑÑÑÑÑÑÑÑÑÑ', // 2
    'ñÑñÑñÑñÑñÑÑÑñÑÑÑÑÑÑÑñÑñññññññÑÑÑ', // 3
    'ññññññññññññññññññññññññññññññññ', // 4
    '..RRRRR....CCCCCCCCC....RRRRR...', // 5
    '..RRRRR.T..¶CRRRRRC¶....RRRRR...', // 6
    '..WWWWW....CCRRRRRCC.T..WWWWW...', // 7
    '..WWDWW....CCRRRRRCC....WWDWW...', // 8
    '...........¶CWWWWWC¶............', // 9
    '.T.¢.....T.CCWWDWWCC..T.......T.', // 10
    '.<.........CňCCCCCCC.......¢....', // 11
    'CCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCC', // 12
    'CCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCC', // 13
    '......¢........C.........¢......', // 14
    '..≈≈≈≈≈≈≈≈...RRRRR....≈≈≈≈≈≈≈≈..', // 15
    '.............RRRRR..............', // 16
    '..≈≈≈≈≈≈≈≈...WWWWW....≈≈≈≈≈≈≈≈..', // 17
    '.............WWDWW..............', // 18
    '..≈≈≈≈≈≈≈≈............≈≈≈≈≈≈≈≈..', // 19
    '.TTT....TT...TTTT.......T......¢', // 20
    '......T.T...TT.T....T.T..T...¢..', // 21
    'T.....T....T.T¢..T.............T', // 22
    '..T...T.....¢T.T..T..........TT.', // 23
    '..¢..TT..T..T....T.......T......', // 24
    'TTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTT', // 25
  ]),
  doors: [
    { x: 15, y: 10, interior: 'monastere' },     // le monastère du grand stupa : l'objet magique
    { x: 4,  y: 8,  lockedDialogue: ['[Texte provisoire] Namaste ! Personne à la maison.'] },
    { x: 26, y: 8,  lockedDialogue: ['[Texte provisoire] Namaste ! Personne à la maison.'] },
    { x: 15, y: 18, lockedDialogue: ['[Texte provisoire] Namaste ! Personne à la maison.'] },
  ],
  buildings: [
    { type: 'boudhanath', x: 13, y: 6 },
    { type: 'stoneHouse', x: 2, y: 5, variant: 0 },
    { type: 'stoneHouse', x: 24, y: 5, variant: 2 },
    { type: 'stoneHouse', x: 13, y: 15, variant: 1 },
  ],
  objects: [airportSign(1, 11, false)],
  // Ouest : le sentier mène à l'aéroport.
  triggers: [toAirport(0, 12), toAirport(0, 13)],
  surroundings: { outside, border: 'T', borderSkip: ['C', 'Ñ'] },
  spawn: { x: 1, y: 12, facing: 'right' },
};
