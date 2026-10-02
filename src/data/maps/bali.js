import { parseGrid } from './parseGrid.js';
import { toAirport } from './airportLinks.js';

// Bali — île tropicale (comme Fort-de-France, en plus grand et plus verdoyant), 32 x 26 cases :
// plages bordées de palmiers, bosquets d'arbres tropicaux, rizières en terrasses, chemin du ponton à la porte
// du temple, cabane de plage.
// Légende : voir src/data/tiles.js (≈ = rizière, ƫ = arbre tropical, Ŧ = grand arbre, Y = palmier, = = ponton)
export const baliMap = {
  id: 'bali',
  name: 'Bali',
  grid: parseGrid([
    'wwwwwwwwwwwwwwwwwwwwwwwwwwwwwwww', // 0
    'wwwwwwwwwwwwwwwwwwwwwwwwwwwwwwww', // 1
    'wwwwwwwwwwwwsssssssswwwwwwwwwwww', // 2
    'wwwwwwwwwsssssssssssssswwwwwwwww', // 3
    'wwwwwwwsY..........f...Yswwwwwww', // 4
    'wwwwwwss.......RRR......sswwwwww', // 5  porte du temple balinais
    'wwwwwss≈≈≈≈≈≈ƨ.WWW.ƨ.....sswwwww', // 6  rizières en terrasses
    'wwwwss.≈≈≈≈≈≈..WWW........Yswwww', // 7
    'wwwwss.........ççç......ƫƫsswwww', // 8  chemin du ponton au temple, jungle
    'wwwwsY.≈≈≈≈≈≈f.ççç..ƫƫ..ƫƫsswwww', // 9
    'wwwwss.≈≈≈≈≈≈..ççç..ƫƫ....sswwww', // 10
    'wwwwss........ƨççç....ƨ...sswwww', // 11
    'wwwwss..ƫƫ.....ççç.....ƫƫ.Yswwww', // 12
    'wwwwss..ƫƫ.....ççç.ŦŦŦ.ƫƫ.sswwww', // 13
    'wwwwss.f....ƫƫ.ççç.ŦŦŦ....sswwww', // 14
    'wwwwsY......ƫƫ.ççç.ŦŦŦ...fsswwww', // 15
    'wwwwss..ĥĥĥĥ...ççç.ŦŦŦ....sswwww', // 16
    'wwwwssƫƫĥĥĥĥ...ççç....RRR.sswwww', // 17  cabane de plage
    'wwwwssƫƫ.....f.çççƨ...WWW.sswwww', // 18
    'wwwwwss...ƨ....ççç....WDWsswwwww', // 19
    'wwwwwwss.......çççççççççYswwwwww', // 20
    'wwwwwwwwsssssssssssssssswwwwwwww', // 21
    'wwwwwwwwwwwsssssssssswwwwwwwwwww', // 22
    'wwwwwwwwwwwwwww==wwwwwwwwwwwwwww', // 23  ponton (retour à l'aéroport)
    'wwwwwwwwwwwwwww==wwwwwwwwwwwwwww', // 24
    'wwwwwwwwwwwwwww==wwwwwwwwwwwwwww', // 25
  ]),
  doors: [
    { x: 23, y: 19, interior: 'baliCabane' },    // la cabane près de la mer
  ],
  buildings: [
    { type: 'baliGate', x: 15, y: 5 },
    { type: 'beachHut', x: 22, y: 17 },
  ],
  objects: [
    ...[15, 16, 17].map((x) => ({ x, y: 7, dialogue: ['[Texte provisoire] Une porte de temple balinaise, ornée d\'offrandes fleuries.'] })),
  ],
  // Bout du ponton : retour à l'aéroport.
  triggers: [toAirport(15, 25), toAirport(16, 25)],
  surroundings: 'w',
  spawn: { x: 15, y: 23, facing: 'up' },
};
