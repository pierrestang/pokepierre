import { fortDeFranceMap } from './fortDeFrance.js';
import { saintAyMap } from './saintAy.js';
import { montepilloyMap } from './montepilloy.js';
import { routeBonsecoursMap } from './routeBonsecours.js';
import { prytaneeMap } from './prytanee.js';
import { bordeauxMap } from './bordeaux.js';
import { hullMap } from './hull.js';
import { hanoiMap } from './hanoi.js';
import { amsterdamMap } from './amsterdam.js';
import { newDelhiMap } from './newDelhi.js';
import { rajasthanMap } from './rajasthan.js';
import { airportMap } from './airport.js';
import { parisMap } from './paris.js';
import { toulonMap } from './toulon.js';
import { caminoMap } from './camino.js';
import { corseMap } from './corse.js';
import { baliMap } from './bali.js';
import { sriLankaMap } from './sriLanka.js';
import { thailandMap } from './thailand.js';
import { nepalMap } from './nepal.js';

// Cartes extérieures, par id. L'ordre du jeu : Fort-de-France -> Saint-Ay -> Montépilloy -> (route et collège Bonsecours) -> Prytanée -> Bordeaux -> Hull -> Hanoï -> Amsterdam -> (Hull) -> New Delhi -> Rajasthan -> Bordeaux (stade) -> Paris -> Toulon (Chemin de Saint-Jacques, Corse) -> Bali -> Sri Lanka -> Thaïlande -> Népal.
// Les voyages en avion passent par l'aéroport (depuis Bordeaux).
export const MAPS = {
  [fortDeFranceMap.id]: fortDeFranceMap,
  [saintAyMap.id]: saintAyMap,
  [montepilloyMap.id]: montepilloyMap,
  [routeBonsecoursMap.id]: routeBonsecoursMap,
  [prytaneeMap.id]: prytaneeMap,
  [bordeauxMap.id]: bordeauxMap,
  [hullMap.id]: hullMap,
  [hanoiMap.id]: hanoiMap,
  [amsterdamMap.id]: amsterdamMap,
  [newDelhiMap.id]: newDelhiMap,
  [rajasthanMap.id]: rajasthanMap,
  [airportMap.id]: airportMap,
  [parisMap.id]: parisMap,
  [toulonMap.id]: toulonMap,
  [caminoMap.id]: caminoMap,
  [corseMap.id]: corseMap,
  [baliMap.id]: baliMap,
  [sriLankaMap.id]: sriLankaMap,
  [thailandMap.id]: thailandMap,
  [nepalMap.id]: nepalMap,
};

export const START_MAP = fortDeFranceMap.id;
