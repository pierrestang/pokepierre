import { parseGrid } from './parseGrid.js';
import { toAirport, airportSign } from './airportLinks.js';

// Hors de la carte : l'Himalaya au-dessus, le sentier se prolonge, la vallée ailleurs.
function outside(x, y, grid) {
  if (y < 3) return 'Ñ';
  if (y === 3) return 'ñ';
  if (y >= 0 && y < grid.length && grid[y][x < 0 ? 0 : grid[0].length - 1] === 'ç') return 'ç';
  return 'T';
}

// Népal — vallée au pied de l'Himalaya : sommets enneigés et forêt de sapins, grand stupa aux yeux de Bouddha
// sur sa place pavée, drapeaux de prière, maisons, champs en terrasses, chèvres, 32 x 26 cases.
// Légende : voir src/data/tiles.js (Ñ = sommet enneigé, ñ = neige, ¶ = drapeaux de prière,
// ň = drapeau népalais, ≈ = champ en terrasse, ¢ = chèvre)
export const nepalMap = {
  id: 'nepal',
  name: 'Népal',
  grid: parseGrid([
    'ÑÑÑÑÑÑÑÑÑÑÑÑÑÑÑÑÑÑÑÑÑÑÑÑÑÑÑÑÑÑÑÑ', // 0  l'Himalaya
    'ÑÑÑÑÑÑÑÑÑÑÑÑÑÑÑÑÑÑÑÑÑÑÑÑÑÑÑÑÑÑÑÑ', // 1
    'ÑÑÑÑÑÑÑÑÑÑÑÑÑÑÑÑÑÑÑÑÑÑÑÑÑÑÑÑÑÑÑÑ', // 2
    'ññññññññññññññññññññññññññññññññ', // 3
    'TTTTTTTTTT............TTTTTTTTTT', // 4  forêt de sapins au pied des montagnes
    'TTTTTTTTTT.ɔɔɔɔɔɔɔɔɔ..TTTTTTTTTT', // 5
    '..RRRRR....¶ɔRRRRRɔ¶......RRRRR.', // 6  maisons de pierre, grand stupa (monastère)
    '..RRRRR.f..ɔɔRRRRRɔɔ..f...RRRRR.', // 7
    '..WWWWW....ɔɔRRRRRɔɔ......WWWWW.', // 8
    '..WDWWW..f.¶ɔWWWWWɔ¶....ƀ.WDWWW.', // 9
    '...çç..ƀ...ɔɔWWDWWɔɔ...f...çç...', // 10
    '.<.çç......ɔňɔɔɔɔɔɔɔ.......çç...', // 11
    'çççççççççççççççççççççççççççççççç', // 12  sentier (ouest : l'aéroport)
    'çççççççççççççççççççççççççççççççç', // 13
    '......¢....çç............¢......', // 14
    '..≈≈≈≈≈≈≈≈.ççRRRRR...≈≈≈≈≈≈≈≈...', // 15  champs en terrasses, maison du bas
    '.f.........ççRRRRR.f............', // 16
    '..≈≈≈≈≈≈≈≈.ççWWWWW...≈≈≈≈≈≈≈≈...', // 17
    '...........ççWDWWWƀ...........f.', // 18
    '..≈≈≈≈≈≈≈≈.ççççç.....≈≈≈≈≈≈≈≈...', // 19
    '.ƀ..¢......ççççç..¢.f.........ƀ.', // 20
    '................................', // 21
    'TTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTT', // 22  forêt
    'TTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTT', // 23
    'TTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTT', // 24
    'TTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTT', // 25
  ]),
  doors: [
    { x: 15, y: 10, interior: 'monastere' },     // le monastère du grand stupa : l'objet magique
    { x: 3, y: 9, lockedDialogue: ['[Texte provisoire] Namaste ! Personne à la maison.'] },
    { x: 27, y: 9, lockedDialogue: ['[Texte provisoire] Namaste ! Personne à la maison.'] },
    { x: 14, y: 18, lockedDialogue: ['[Texte provisoire] Namaste ! Personne à la maison.'] },
  ],
  buildings: [
    { type: 'boudhanath', x: 13, y: 6 },
    { type: 'slateHouse', x: 2, y: 6 },
    { type: 'house', x: 26, y: 6 },
    { type: 'greenHouse', x: 13, y: 15 },
  ],
  objects: [airportSign(1, 11, false)],
  // Ouest : le sentier mène à l'aéroport.
  triggers: [toAirport(0, 12), toAirport(0, 13)],
  surroundings: { outside },
  spawn: { x: 1, y: 12, facing: 'right' },
};
