// Exporte les cartes extérieures du jeu (grille, bâtiments, solidité des cases) en JSON, pour
// scripts/convert_maps_v2.py. Usage : node scripts/export_maps.mjs fortDeFrance saintAy … > maps.json
import { MAPS } from '../src/data/maps/index.js';
import { getTile } from '../src/data/tiles.js';

const ids = process.argv.slice(2);
const out = ids.map((id) => {
  const map = MAPS[id];
  // Une carte qui utilise le dessin du créateur garde sa grille d'origine (sourceGrid) pour être refaite.
  const grid = map.sourceGrid ?? map.grid;
  const codes = [...new Set(grid.flat())];
  return {
    id,
    name: map.name,
    grid: grid.map((row) => row.join('')),
    solid: Object.fromEntries(codes.map((c) => [c, Boolean(getTile(c).solid)])),
    buildings: (map.sourceBuildings ?? map.buildings ?? []).map(({ type, x, y }) => ({ type, x, y })),
    spawn: map.spawn ?? null,
  };
});
process.stdout.write(JSON.stringify(out));
