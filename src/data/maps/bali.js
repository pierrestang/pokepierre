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
    'wwwwwwwssssY........Tsssswwwwwww', // 4
    'wwwwww≈≈≈≈≈≈≈≈T.RRR..Yfssswwwwww', // 5
    'wwwwws≈≈≈≈≈≈≈≈Y.WWW.TY.Tssswwwww', // 6
    'wwwwss..........WWW......ssswwww', // 7
    'wwwwss≈≈≈≈≈≈≈≈......TYf.f.sswwww', // 8
    'wwwssf≈≈≈≈≈≈≈≈........T.YY.sswww', // 9
    'wwwss...YTT.YYssss.T...YT..sswww', // 10
    'wwwss.....f.T.ssss....T...Ysswww', // 11
    'wwwssYYY.Y..Y.ssssT...Y....sswww', // 12
    'wwwssY.YssssssssssT...Y....sswww', // 13
    'wwwssf...Y...fssss....Y....sswww', // 14
    'wwwss.TY.T....ssssssssssss.sswww', // 15
    'wwwwss....T...ssssff.Y.Yf.sswwww', // 16
    'wwwwsss..Y..TfssssfT.Yssssssswww', // 17
    'wwwwwsssT.....ssssT.Y.ssssssswww', // 18
    'wwwwwwsssY.Y..ssssf...ssRRRsswww', // 19
    'wwwwwwwssss...ssssT..sssWWWsswww', // 20
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
