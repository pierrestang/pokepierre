import { fortDeFranceMap } from './fortDeFrance.js';
import { applyNpcEdits } from './npcEdits.js';
import { saintAyMap } from './saintAy.js';
import { routeMontepilloyMap } from './routeMontepilloy.js';
import { montepilloyMap } from './montepilloy.js';
import { routeBonsecoursMap } from './routeBonsecours.js';
import { prytaneeMap } from './prytanee.js';
import { bordeauxMap } from './bordeaux.js';
import { hullMap } from './hull.js';
import { hanoiMap } from './hanoi.js';
import { amsterdamMap } from './amsterdam.js';
import { newDelhiMap } from './newDelhi.js';
import { airportMap } from './airport.js';
import { parisMap } from './paris.js';
import { reveMap } from './reve.js';

// Cartes extérieures, par id. L'ordre du jeu : Fort-de-France -> Saint-Ay -> (route de Montépilloy) -> Montépilloy -> (route et collège Bonsecours) -> Prytanée -> Bordeaux -> Hull -> Hanoï -> Amsterdam -> New Delhi -> Bordeaux (stade) -> Paris (la fin : le rêve, le réveil à Fort-de-France).
// Les voyages en avion passent par l'aéroport (depuis Bordeaux).
export const MAPS = {
  [fortDeFranceMap.id]: fortDeFranceMap,
  [saintAyMap.id]: saintAyMap,
  [routeMontepilloyMap.id]: routeMontepilloyMap,
  [montepilloyMap.id]: montepilloyMap,
  [routeBonsecoursMap.id]: routeBonsecoursMap,
  [prytaneeMap.id]: prytaneeMap,
  [bordeauxMap.id]: bordeauxMap,
  [hullMap.id]: hullMap,
  [hanoiMap.id]: hanoiMap,
  [amsterdamMap.id]: amsterdamMap,
  [newDelhiMap.id]: newDelhiMap,
  [airportMap.id]: airportMap,
  [parisMap.id]: parisMap,
  [reveMap.id]: reveMap,
};

// PNJ placés dans le créateur de cartes (déplacés, figurants ajoutés : voir npcEdits.js).
for (const map of Object.values(MAPS)) if (map.built) applyNpcEdits(map, map.built);

export const START_MAP = fortDeFranceMap.id;
