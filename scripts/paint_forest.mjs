// Dessine la forêt d'une carte du créateur (studio.forest, arbre studio.trees) comme le pinceau Forêt du créateur
// (src/builder/studio.js renderForest, règle de src/builder/forestLayout.js) : de l'herbe sous les arbres, un arbre rond
// entier par bloc de 2 x 2, un buisson sur une case qu'aucun arbre ne couvre ; les cases de forêt bloquent. Pour une
// carte écrite par un script (ex. scripts/build_amsterdam.py), dont la forêt n'a encore aucun dessin.
//
// Usage : node scripts/paint_forest.mjs <id de la carte>   (src/data/builtMaps/<id>.json, réécrit)
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { layoutForest, roundTreePieces, treeOrder } from '../src/builder/forestLayout.js';
import { refOf, stackOf, cellOf } from '../src/builder/mapModel.js';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const id = process.argv[2];
const file = `${ROOT}src/data/builtMaps/${id}.json`;
const m = JSON.parse(readFileSync(file, 'utf8'));
const lis = JSON.parse(readFileSync(`${ROOT}public/assets/v2/lisieres.json`, 'utf8'));
const W = m.width;
const d = m.studio;
const variant = lis.variants.find((v) => v.id === d.trees) ?? lis.variants[0];
const bushRow = variant.row ?? lis.variants[0].row;
const push = (layer, i, ref) => { m.layers[layer][i] = cellOf([...stackOf(m.layers[layer][i]), ref]); };

const set = new Set(d.forest.map(([x, y]) => y * W + x));
const isF = (x, y) => x >= 0 && y >= 0 && x < W && y < m.height && set.has(y * W + x);
const { blocks, inBlock, touchesOpen } = layoutForest(W, m.height, isF);
const grass = refOf(m, 'dppt', 4);
for (const c of set) {
  const x = c % W;
  const y = Math.floor(c / W);
  m.layers.sol[c] = grass;
  m.layers.decor[c] = -1;
  m.solid[c] = 1;
  if (!inBlock(x, y) && touchesOpen(x, y)) push('decor', c, refOf(m, 'lisieres', bushRow * lis.cols + lis.bush.col));
}
for (const [bx, by, dy] of [...blocks].sort(treeOrder)) {
  for (const p of roundTreePieces(lis, variant, bx, by, dy)) {
    if (p.x < 0 || p.y < 0 || p.x >= W || p.y >= m.height) continue;
    const c = p.y * W + p.x;
    push(p.trunk || set.has(c) ? 'decor' : 'dessus', c, refOf(m, 'lisieres', p.index));
  }
}
writeFileSync(file, `${JSON.stringify(m)}\n`);
console.log(`${id} : forêt dessinée (${blocks.length} arbres)`);
