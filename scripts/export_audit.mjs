// Exporte la logique des cartes du jeu dessinées avec le créateur (grilles, PNJ, objets, portes, déclencheurs) pour
// scripts/audit_maps.py.
import { MAPS } from '../src/data/maps/index.js';
import { getTile } from '../src/data/tiles.js';
import { interiors } from '../src/data/maps/interiors.js';
import { existsSync } from 'node:fs';
const out = {};
// Les cartes, et les intérieurs dont le dessin est une carte de builtMaps (la cour de New Delhi, builtMaps/delhi-cour.json).
const drawnAsMaps = Object.entries(interiors)
  .filter(([id, r]) => r.built && r.sourceGrid && !existsSync(new URL(`../src/data/builtInteriors/${id}.json`, import.meta.url))
    && existsSync(new URL(`../src/data/builtMaps/${r.built.id}.json`, import.meta.url)))
  .map(([id, r]) => ({ ...r, id }));
for (const m of [...Object.values(MAPS), ...drawnAsMaps]) {
  if (!m.built) continue;
  const pts = [];
  for (const n of m.npcs ?? []) pts.push({ k: 'npc', id: n.id ?? n.name, x: n.x, y: n.y });
  for (const o of m.objects ?? []) pts.push({ k: 'obj', x: o.x, y: o.y });
  for (const d of m.doors ?? []) pts.push({ k: 'door', x: d.x, y: d.y, when: Boolean(d.when) });   // when : porte d'un décor du jeu (échelle de la cabane)
  for (const t of m.triggers ?? []) pts.push({ k: 'trig', x: t.x, y: t.y });
  for (const p of m.props ?? []) pts.push({ k: 'prop', id: p.type, x: p.x, y: p.y, w: p.w, h: p.h });
  out[m.id] = { file: m.built.id, grid: m.grid.map((r) => r.join('')), source: m.sourceGrid.map((r) => r.join('')),
    spawn: m.spawn ?? m.built.spawn, pts, warps: (m.exits ?? m.warps ?? []).map((w) => [w.x, w.y]),
    tall: Object.fromEntries([...new Set(m.sourceGrid.flat())].map((c) => [c, Boolean(getTile(c).solid)])) };
}
process.stdout.write(JSON.stringify(out));
