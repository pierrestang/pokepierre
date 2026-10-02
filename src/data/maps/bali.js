import { parseGrid } from './parseGrid.js';
import { toAirport } from './airportLinks.js';

// Bali — île tropicale (comme Fort-de-France, en plus grand et plus verdoyant), 32 x 26 cases :
// plages, jungle de palmiers, rizières en terrasses, porte balinaise, cabane de plage, ponton.
// Légende : voir src/data/tiles.js (≈ = rizière, Y = palmier, = = ponton)
export const baliMap = {
  id: 'bali',
  name: 'Bali',
  grid: parseGrid([
    'wwwwwwwwwwwwwwwwwwwwwwwwwwwwwwww', // 0
    'wwwwwwwwwwwwwwwwwwwwwwwwwwwwwwww', // 1
    'wwwwwwwwwwwwsssssssswwwwwwwwwwww', // 2
    'wwwwwwwwwsssssssssssssswwwwwwwww', // 3
    'wwwwwwwssssY........ƚsssswwwwwww', // 4
    'wwwwww≈≈≈≈≈≈≈≈ƚ.RRR..Yfssswwwwww', // 5
    'wwwwws≈≈≈≈≈≈≈≈Y.WWW.ƚY.ƚssswwwww', // 6
    'wwwwss..........WWW......ssswwww', // 7
    'wwwwss≈≈≈≈≈≈≈≈......ƚYf.f.sswwww', // 8
    'wwwssf≈≈≈≈≈≈≈≈........ƚ.YY.sswww', // 9
    'wwwss...Yƚƚ.YYssss.ƚ...Yƚ..sswww', // 10
    'wwwss.....f.ƚ.ssss....ƚ...Ysswww', // 11
    'wwwssYYY.Y..Y.ssssƚ...Y....sswww', // 12
    'wwwssY.Yssssssssssƚ...Y....sswww', // 13
    'wwwssf...Y...fssss....Y....sswww', // 14
    'wwwss.ƚY.ƚ....ssssssssssss.sswww', // 15
    'wwwwss....ƚ...ssssff.Y.Yf.sswwww', // 16
    'wwwwsss..Y..ƚfssssfƚ.Yssssssswww', // 17
    'wwwwwsssƚ.....ssssƚ.Y.ssssssswww', // 18
    'wwwwwwsssY.Y..ssssf...ssRRRsswww', // 19
    'wwwwwwwssss...ssssƚ..sssWWWsswww', // 20
    'wwwwwwwwwsssssssssssssssWDWsswww', // 21
    'wwwwwwwwwwwwsssssssswwssssssswww', // 22
    'wwwwwwwwwwwwwww==wwwwwwwwwwwwwww', // 23
    'wwwwwwwwwwwwwww==wwwwwwwwwwwwwww', // 24
    'wwwwwwwwwwwwwww==wwwwwwwwwwwwwww', // 25
  ]),
  doors: [
    { x: 25, y: 21, interior: 'baliCabane' },    // la cabane près de la mer
  ],
  buildings: [
    { type: 'baliGate', x: 16, y: 5 },
    { type: 'beachHut', x: 24, y: 19 },
  ],
  objects: [
    ...[16, 17, 18].map((x) => ({ x, y: 7, dialogue: ['[Texte provisoire] Une porte de temple balinaise, ornée d\'offrandes fleuries.'] })),
  ],
  // Bout du ponton : retour à l'aéroport.
  triggers: [toAirport(15, 25), toAirport(16, 25)],
  surroundings: 'w',
  spawn: { x: 15, y: 23, facing: 'up' },
};
