// Cases que l'histoire utilise sur chaque carte dessinée avec le créateur (pour scripts/g4_enrich.py et
// scripts/fdf_ds_v2.py : le mobilier n'y va jamais). Parcourt toute la carte du jeu (PNJ, objets, portes,
// déclencheurs, props, scénettes et leurs étapes) : chaque objet { x, y } (et son emprise w x h), chaque paire [x, y]
// (destinations de `walk`, `goTo`, `pace`, `route`…), et chaque case des circuits des rondes (`patrols` : les gardes
// vont tout droit d'un point de passage à l'autre). Les arrivées sur la carte depuis ailleurs (`travel`, `warp`) aussi.
//
// Usage : node scripts/export_story_points.mjs  -> { idDuJeu: [[x, y], …], … }
import { MAPS } from '../src/data/maps/index.js';
import { interiors } from '../src/data/maps/interiors.js';

const out = {};
const isInt = (v) => Number.isInteger(v) && v >= 0;

function collect(map) {
  const W = map.built.width;
  const H = map.built.height;
  const cells = new Set();
  const add = (x, y) => { if (isInt(x) && isInt(y) && x < W && y < H) cells.add(`${x},${y}`); };
  const seen = new Set();
  (function walk(node) {
    if (!node || typeof node !== 'object' || seen.has(node)) return;
    seen.add(node);
    if (Array.isArray(node)) {
      if (node.length === 2 && isInt(node[0]) && isInt(node[1])) add(node[0], node[1]);
      node.forEach(walk);
      return;
    }
    // Une autre carte (voyage, sortie) : ses coordonnées ne sont pas celles d'ici.
    if (node.map && node.map !== map.id) return;
    if (node.interior) return;
    if (isInt(node.x) && isInt(node.y)) {
      for (let j = 0; j < (node.h ?? 1); j++) for (let i = 0; i < (node.w ?? 1); i++) add(node.x + i, node.y + j);
    }
    Object.values(node).forEach(walk);
  }(map));
  for (const guard of map.patrols?.guards ?? []) {
    const path = [...guard.path, ...((guard.loop ?? guard.path.length > 2) ? [guard.path[0]] : [])];
    for (let k = 0; k + 1 < path.length; k++) {
      const [x0, y0] = path[k];
      const [x1, y1] = path[k + 1];
      for (let x = Math.min(x0, x1); x <= Math.max(x0, x1); x++) {
        for (let y = Math.min(y0, y1); y <= Math.max(y0, y1); y++) add(x, y);
      }
    }
  }
  return cells;
}

const cellsOf = Object.fromEntries(Object.values(MAPS).filter((m) => m.built).map((m) => [m.id, collect(m)]));
// Arrivées depuis n'importe où (scénettes de voyage, passages, intérieurs).
const seen = new Set();
(function walk(node) {
  if (!node || typeof node !== 'object' || seen.has(node)) return;
  seen.add(node);
  for (const key of ['travel', 'warp']) {
    const t = node[key];
    if (t && typeof t === 'object' && cellsOf[t.map] && isInt(t.x) && isInt(t.y)) cellsOf[t.map].add(`${t.x},${t.y}`);
  }
  Object.values(node).forEach(walk);
}({ MAPS, interiors }));
for (const [id, cells] of Object.entries(cellsOf)) out[id] = [...cells].map((c) => c.split(',').map(Number));
process.stdout.write(JSON.stringify(out));
