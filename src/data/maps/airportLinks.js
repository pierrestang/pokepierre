// Tous les voyages en avion passent par l'aéroport : une seule carte, mais l'aéroport de la ville d'où l'on vient. Le jeu
// retient cette ville (memo `aeroport`, voir MapScene.travel) : les portes de l'aéroport ramènent dans cette ville
// (warp `airportExit`), et la liste des vols ne la propose pas.
export const AIRPORT_ARRIVAL = { map: 'airport', x: 10, y: 12, facing: 'up' };    // devant les portes vitrées

// En sortant de l'aéroport de chaque ville : à côté de ses sorties vers l'aéroport (Bordeaux sans souvenir : anciennes
// parties). C'est aussi là qu'atterrissent les vols.
export const AIRPORT_EXITS = {
  bordeaux: { map: 'bordeaux', x: 30, y: 10, facing: 'left' },
  hull: { map: 'hull', x: 1, y: 35, facing: 'right' },
  hanoi: { map: 'hanoi', x: 1, y: 8, facing: 'right' },
  amsterdam: { map: 'amsterdam', x: 1, y: 10, facing: 'right' },
  newDelhi: { map: 'newDelhi', x: 1, y: 16, facing: 'right' },
  paris: { map: 'paris', x: 50, y: 11, facing: 'left' },
};

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
