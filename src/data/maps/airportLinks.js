// Tous les voyages en avion passent par l'aéroport (situé à Bordeaux).
export const AIRPORT_ARRIVAL = { map: 'airport', x: 10, y: 12, facing: 'up' };    // devant les portes vitrées

// Case de sortie d'une ville qui mène à l'aéroport.
export const toAirport = (x, y) => ({
  x,
  y,
  readyDialogue: ["Tu te rends à l'aéroport."],
  warp: AIRPORT_ARRIVAL,
});

// Panneau « Aéroport » à examiner (posé sur une tuile '>' ou '<' à côté de la sortie).
export const airportSign = (x, y, toRight) => ({
  x,
  y,
  dialogue: [toRight ? 'Aéroport →' : '← Aéroport'],
});
