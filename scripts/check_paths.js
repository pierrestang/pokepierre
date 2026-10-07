// Vérifie qu'on ne reste jamais coincé : pour chaque carte et chaque intérieur, à chaque étape de l'histoire
// (les drapeaux de story.js levés un par un, dans l'ordre), tous les points d'arrivée (point de départ,
// sortie d'une porte, arrivée d'un voyage) doivent communiquer entre eux, et chaque porte, sortie,
// passage, objet et PNJ actif doit rester accessible.
// Les obstacles conditionnels (props, PNJ) comptent dès que leurs drapeaux le permettent ; les conditions
// d'objets et de souvenirs sont ignorées (obstacle supposé présent). Les PNJ qui marchent ou se déplacent
// pendant une scénette ne sont pas suivis.
//
// Usage : node scripts/check_paths.js
import { MAPS } from '../src/data/maps/index.js';
import { interiors } from '../src/data/maps/interiors.js';
import { FLAGS } from '../src/data/story.js';
import { createWalkableCheck } from '../src/systems/collision.js';

const ORDER = Object.values(FLAGS);

const flagsOk = (c, raised) => (c.ifFlags ?? []).every((f) => raised.has(f)) && !(c.unlessFlags ?? []).some((f) => raised.has(f));

// Arrivées de voyage (`travel` des scénettes, `warp` des passages) vers chaque carte ou intérieur, partout.
const arrivals = {};
const seen = new Set();
(function walk(node, fromMap) {
  if (!node || typeof node !== 'object' || seen.has(node)) return;
  seen.add(node);
  for (const key of ['travel', 'warp']) {
    const t = node[key];
    // `cutscene` : arrivée dans une scénette qui fait elle-même repartir le joueur (ex. assis dans la cabane).
    if (t && typeof t === 'object' && Number.isInteger(t.x) && !t.cutscene) {
      const target = t.interior ?? t.map;
      if (target) (arrivals[target] ??= []).push({ x: t.x, y: t.y, why: `arrivée (${key})`, cond: node });
    }
  }
  Object.values(node).forEach((v) => walk(v, fromMap));
}({ MAPS, interiors }));

const places = [
  ...Object.values(MAPS).map((m) => ({ id: m.id, map: m, kind: 'carte' })),
  ...Object.entries(interiors).map(([id, m]) => ({ id, map: m, kind: 'intérieur' })),
];

const found = new Map();      // problème -> étapes où il se pose
for (const { id, map, kind } of places) {
  const { grid } = map;
  const H = grid.length;
  const W = grid[0].length;
  const tileOk = createWalkableCheck(grid);
  for (let step = 0; step <= ORDER.length; step++) {
    const raised = new Set(ORDER.slice(0, step));
    const blocked = new Set();
    for (const p of map.props ?? []) {
      if (!flagsOk(p, raised)) continue;
      for (let y = p.y; y < p.y + p.h; y++) for (let x = p.x; x < p.x + p.w; x++) blocked.add(`${x},${y}`);
    }
    // Les PNJ qu'on pousse (`push`, ex. les poules de l'enclos) ne bloquent pas : on les écarte.
    for (const n of map.npcs ?? []) if (flagsOk(n, raised) && !n.push) blocked.add(`${n.x},${n.y}`);
    const openDoors = new Set((map.doors ?? []).filter((d) => d.when && flagsOk(d.when, raised)).map((d) => `${d.x},${d.y}`));
    const free = (x, y) => (tileOk(x, y) || openDoors.has(`${x},${y}`)) && !blocked.has(`${x},${y}`);

    // Points à relier : arrivées, et cases devant ce qu'on doit pouvoir atteindre.
    const entries = [];
    const targets = [];
    if (map.spawn && free(map.spawn.x, map.spawn.y)) entries.push({ ...map.spawn, why: 'point de départ' });
    for (const d of map.doors ?? []) {
      if (d.when && !flagsOk(d.when, raised)) continue;
      if (d.lock && !flagsOk(d.lock, raised)) continue;
      if (d.interior) entries.push({ x: d.x, y: d.y + 1, why: `sortie de ${d.interior}` });
      targets.push({ x: d.x, y: d.y, why: `porte ${d.interior ?? '(fermée)'}`, onTile: true });
    }
    for (const a of arrivals[id] ?? []) if (flagsOk(a.cond, raised)) entries.push(a);
    grid.forEach((row, y) => row.forEach((c, x) => { if (c === 'E') targets.push({ x, y, why: 'tapis de sortie', onTile: true }); }));
    for (const t of map.triggers ?? []) if (t.warp && flagsOk(t, raised)) targets.push({ x: t.x, y: t.y, why: `passage vers ${t.warp.map ?? t.warp.interior}`, onTile: true });
    // Objets d'une même scénette (ex. les cases du ferry) : il suffit d'en atteindre un.
    const groups = new Map();
    for (const o of map.objects ?? []) {
      if (!(o.script || o.item) || !flagsOk(o, raised)) continue;
      const key = o.script ?? o;
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key).push(o);
    }
    for (const group of groups.values()) targets.push({ x: group[0].x, y: group[0].y, why: 'objet', cells: group.map((o) => [o.x, o.y]) });
    for (const n of map.npcs ?? []) if ((n.script || n.dialogue) && flagsOk(n, raised)) targets.push({ x: n.x, y: n.y, why: `PNJ ${n.name}` });
    for (const p of map.props ?? []) if (p.script && flagsOk(p, raised)) targets.push({ x: p.x, y: p.y + p.h - 1, w: p.w, why: `prop ${p.type}` });

    const live = entries.filter((e) => free(e.x, e.y));
    if (!live.length) continue;
    // Zone atteignable depuis la première arrivée.
    const reach = new Set();
    const todo = [[live[0].x, live[0].y]];
    while (todo.length) {
      const [x, y] = todo.pop();
      const k = `${x},${y}`;
      if (reach.has(k) || x < 0 || y < 0 || x >= W || y >= H || !free(x, y)) continue;
      reach.add(k);
      todo.push([x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]);
    }
    const near = (t) => {
      const cells = t.cells ?? [];
      if (!t.cells) for (let dx = 0; dx < (t.w ?? 1); dx++) cells.push([t.x + dx, t.y]);
      return cells.some(([x, y]) => (t.onTile && reach.has(`${x},${y}`))
        || [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => reach.has(`${x + dx},${y + dy}`)
          // Par-dessus un comptoir ('#') : on parle à la personne de l'autre côté (MapScene.tryInteract).
          || (grid[y + dy]?.[x + dx] === '#' && reach.has(`${x + 2 * dx},${y + 2 * dy}`))));
    };
    const report = (msg) => {
      const key = `${kind} ${id}: ${msg}`;
      if (!found.has(key)) found.set(key, []);
      found.get(key).push(step);
    };
    for (const e of live.slice(1)) if (!reach.has(`${e.x},${e.y}`)) report(`${e.why} en (${e.x}, ${e.y}) coupée de ${live[0].why} en (${live[0].x}, ${live[0].y})`);
    for (const t of targets) if (!near(t)) report(`${t.why} en (${t.x}, ${t.y}) inaccessible depuis ${live[0].why} en (${live[0].x}, ${live[0].y})`);
  }
}
const stepName = (i) => (i === 0 ? 'début' : ORDER[i - 1]);
for (const [key, steps] of found) {
  const until = steps.at(-1) === ORDER.length ? 'la fin' : `« ${stepName(steps.at(-1))} »`;
  console.log(`${key}\n    de « ${stepName(steps[0])} » à ${until}`);
}
console.log(found.size ? `\n${found.size} problème(s).` : 'Aucun blocage trouvé.');
