// Exporte les intérieurs du jeu (grille, meubles d'origine, points de l'histoire) en JSON, pour
// scripts/build_interiors.py. Usage : node scripts/export_interiors.mjs > interieurs.json
import { interiors } from '../src/data/maps/interiors.js';
import { MAPS } from '../src/data/maps/index.js';
import { getTile } from '../src/data/tiles.js';

// La ville de chaque intérieur : la carte dont une porte y mène.
const cityOf = {};
const visit = (node, city, seen = new Set()) => {
  if (!node || typeof node !== 'object' || seen.has(node)) return;
  seen.add(node);
  if (typeof node.interior === 'string' && !(node.interior in cityOf)) cityOf[node.interior] = city;
  for (const value of Object.values(node)) visit(value, city, seen);
};
for (const [id, map] of Object.entries(MAPS)) visit(map.doors, id);

const points = (list = []) => list.map(({ id, name, x, y }) => ({ id, name, x, y }));
const out = Object.fromEntries(Object.entries(interiors).map(([id, room]) => {
  const grid = room.sourceGrid ?? room.grid;
  const codes = [...new Set(grid.flat())];
  return [id, {
    id,
    name: room.name,
    city: cityOf[id] ?? null,
    frlg: Boolean(room.frlg),
    grid: grid.map((row) => row.join('')),
    solid: Object.fromEntries(codes.map((c) => [c, Boolean(getTile(c).solid)])),
    decor: (room.decor ?? []).map(({ kind, x, y }) => ({ kind, x, y })),
    spawn: room.spawn ?? null,
    npcs: points(room.npcs),
    objects: points(room.objects),
  }];
}));
process.stdout.write(JSON.stringify(out));
