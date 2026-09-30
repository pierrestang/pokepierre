import { parseGrid } from './parseGrid.js';
import { FLAGS, ITEMS } from '../story.js';

// Le bateau amarré au ponton : départ vers Saint-Ay une fois les souvenirs de la famille réunis.
const BOAT = {
  requiresSouvenirs: ['souvenir-maman', 'souvenir-papa', 'souvenir-manon'],
  dialogue: ["Tu n'es pas encore prêt à partir."],
  readyDialogue: ['Tu as réuni les souvenirs de ta famille.', 'Tu embarques pour Saint-Ay !'],
  setFlags: [FLAGS.departFortDeFrance],
  // Arrivée : au bord de l'étang de Saint-Ay, à côté de son bateau.
  warp: { map: 'saintAy', x: 11, y: 17, facing: 'left' },
};
const BOAT_POS = { x: 16, y: 23, w: 3, h: 2 };

// Fort-de-France — île ovale de départ, 30 x 27 cases : maison familiale et son jardin fleuri en
// haut, allée pavée de la porte jusqu'au bord de la pelouse, puis large ponton en bois (4 cases) jusqu'au bateau, cabane de pêche
// et son potager entouré de petits rondins à droite, deux grands sapins isolés (on peut passer derrière), hautes herbes aux formes arrondies,
// palmiers sur la plage, rochers dans la mer.
// Légende : voir src/data/tiles.js (w = mer, s = sable, ĥ = hautes herbes, ƀ = buisson, ç = pavés,
// ł = rondins, ν = potager, ƒ = petites fleurs, ŕ = rocher, ø = rocher dans la mer, Y = palmier, = = ponton, B = bateau)
export const fortDeFranceMap = {
  id: 'fortDeFrance',
  name: 'Fort-de-France',
  grid: parseGrid([
    'wwwwwwwwwwwwwwwwwwwwwwwwwwwwww', // 0
    'wwwwwwwwwwwwwwwwwwwwwwwwwwwwww', // 1
    'wwwwwwwwwwwwsssssswwwwwwwwwwww', // 2
    'wwøwwwwwwsssssssssssswwwwwwwww', // 3
    'wwwwwww.TT.f.....ƀ..ssswwwwøww', // 4
    'wwwwwss.TT..RRRRR.....ssswwwww', // 5
    'wwwwssTT...ƒRRRRRƒ.f...ssYwwww', // 6
    'wwwsssTT....WWWWW.......ssswww', // 7
    'wwwss.......WDWWW...łłłłłsswww', // 8
    'wwssƒ....f.ƒfçç.fƒ..łνννłsssww', // 9
    'wwsY...ƒ.....çç.....łłłłł.ssww', // 10
    'wwss.......S.çç.M.ƀ.....ƒ.ssww', // 11
    'wwss..ĥĥĥ....çç......RRR.ƀssww', // 12
    'wwsƀ.ĥĥĥĥĥ...çç......WWW..ssww', // 13
    'wøssĥĥĥĥĥĥ.f.çç.f....WDW.sssww', // 14
    'wwssĥĥĥĥĥ....çç...ƒ......sYsww', // 15
    'wwwssĥĥĥ.....çç......ƒ..ssswww', // 16
    'wwwssʂs...ƀ..çç....ĥĥĥ.ssƥswww', // 17
    'wwwwssss...f.çç.f.ĥĥĥĥĥssʈwwøw', // 18
    'wwwwYsssƒs..====...ĥĥĥssswwwww', // 19
    'wwwwwwwssʂss====sssŕssYswwwwww', // 20
    'wwwwwwwwwsŕs====ssɕsɕwwwwwwwww', // 21
    'wwwwwwwwwwww====sswwwwwwwwwwww', // 22
    'wwwwwøwwwwww====BBBwwwwwwwwwww', // 23
    'wwwwwwwwwwww====BBBwwøwwwwwwww', // 24
    'wwwwwwwwwwww====wwwwwwwwøwwwww', // 25
    'wwwwwwwwwwwwwwwwwwwwwwwwwwwwww', // 26
  ]),
  doors: [
    { x: 13, y: 8, interior: 'ffHouse' },
    { x: 22, y: 14, interior: 'ffHut' },
  ],
  buildings: [
    { type: 'house', x: 12, y: 5 },
    { type: 'beachHut', x: 21, y: 12 },
    { type: 'boat', x: BOAT_POS.x, y: BOAT_POS.y },
  ],
  objects: [
    { x: 11, y: 11, dialogue: ['Fort-de-France — Martinique. Bienvenue sur l\'île !'] },
    { x: 16, y: 11, dialogue: ['[Texte provisoire] La boîte aux lettres de la famille.'] },
    // Chaque case du bateau réagit quand on lui fait face (Entrée / Espace).
    ...Array.from({ length: BOAT_POS.w * BOAT_POS.h }, (_, i) => ({
      x: BOAT_POS.x + (i % BOAT_POS.w),
      y: BOAT_POS.y + Math.floor(i / BOAT_POS.w),
      ...BOAT,
    })),
  ],
  npcs: [
    {
      id: 'pecheur', name: 'Pêcheur', x: 15, y: 21, facing: 'right', still: true,
      look: { skin: 0xc89060, hair: 0x302420, top: 0xf0d050, bottom: 0x3c4c6c, accessory: 'cap', capColor: 0x2c6cb0 },
      dialogue: ['[Texte provisoire] Ça mord bien ce matin ! Le bateau pour Saint-Ay attend juste à côté.'],
    },
  ],
  // Coquillage caché dans les hautes herbes, trouvé une seule fois.
  triggers: [
    {
      x: 6, y: 14, unlessFlags: [FLAGS.coquillageTrouve], setFlags: [FLAGS.coquillageTrouve],
      readyDialogue: ['Quelque chose brille entre les herbes…'], item: ITEMS.coquillageNacre,
    },
  ],
  // Autour de l'île, l'écran est rempli de mer.
  surroundings: 'w',
  spawn: { x: 13, y: 10, facing: 'down' },
};
