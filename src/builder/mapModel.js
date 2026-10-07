// Cartes du créateur de cartes (builder.html) : format, création, redimensionnement, dessin.
// Partagé par l'éditeur (canvas de la page) et par le jeu (texture Phaser, voir systems/builtMaps.js).
//
// Une carte : { version, id, name, width, height, sheets: [idDePlanche…], layers: { sol, decor, dessus },
//               solid: [0|1…], spawn: { x, y, facing } }
// Chaque calque est un tableau de width x height cases (ligne par ligne) : -1 pour une case vide, sinon
// `planche * SHEET_STRIDE + case`, où `planche` est la position de la planche dans `sheets` et `case` le numéro
// de la case dans la planche (de gauche à droite, puis de haut en bas ; voir public/assets/v2/catalog.json).
// Une case peut aussi être une pile [réf, réf…] (de bas en haut) : des objets superposés (une fleur sur un rocher,
// les branches de deux arbres qui se touchent…).
// `solid` : 1 sur les cases où l'on ne passe pas.

export const TILE = 16;
export const SHEET_STRIDE = 100000;
export const EMPTY = -1;
// Une pile garde au plus MAX_STACK cases (les plus hautes).
export const MAX_STACK = 6;

// Ce qu'on range dans une case pour une pile [réf…] : -1 si vide, la réf seule, sinon la pile (bornée).
export const cellOf = (stack) => (stack.length > 1 ? stack.slice(-MAX_STACK) : stack.length ? stack[0] : EMPTY);

// Calques, du bas vers le haut. `dessus` est dessiné par-dessus les personnages (ex. le haut des arbres).
export const LAYERS = [
  { id: 'sol', name: 'Sol' },
  { id: 'decor', name: 'Décor' },
  { id: 'dessus', name: 'Au-dessus de Pierre' },
];

export function blankMap({ id = 'nouvelle-carte', name = 'Nouvelle carte', width = 30, height = 20 } = {}) {
  const cells = () => new Array(width * height).fill(EMPTY);
  return {
    version: 1,
    id,
    name,
    width,
    height,
    sheets: [],
    layers: Object.fromEntries(LAYERS.map((l) => [l.id, cells()])),
    solid: new Array(width * height).fill(0),
    spawn: { x: Math.floor(width / 2), y: Math.floor(height / 2), facing: 'down' },
  };
}

// Identifiant de fichier à partir du nom : minuscules, sans accents, tirets.
export function slugify(name) {
  return name.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
    .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'carte';
}

// Référence d'une case de planche dans la carte (ajoute la planche à `map.sheets` si besoin).
export function refOf(map, sheetId, index) {
  let slot = map.sheets.indexOf(sheetId);
  if (slot < 0) slot = map.sheets.push(sheetId) - 1;
  return slot * SHEET_STRIDE + index;
}

// Les cases d'une case de calque, de bas en haut (une pile, une seule, ou aucune).
export function stackOf(cell) {
  if (Array.isArray(cell)) return cell;
  return cell === EMPTY || cell === undefined ? [] : [cell];
}

// La case du dessus d'une case de calque.
export function topRef(cell) {
  const stack = stackOf(cell);
  return stack.length ? stack[stack.length - 1] : EMPTY;
}

export function decodeRef(map, ref) {
  if (Array.isArray(ref)) ref = topRef(ref);
  if (ref === EMPTY || ref === undefined) return null;
  return { sheet: map.sheets[Math.floor(ref / SHEET_STRIDE)], index: ref % SHEET_STRIDE };
}

// Nouvelle taille : le contenu reste ancré en haut à gauche ; ce qui dépasse est perdu, le reste est vide.
export function resizeMap(map, width, height) {
  const copy = (cells, fill) => {
    const out = new Array(width * height).fill(fill);
    for (let y = 0; y < Math.min(height, map.height); y++) {
      for (let x = 0; x < Math.min(width, map.width); x++) out[y * width + x] = cells[y * map.width + x];
    }
    return out;
  };
  return {
    ...map,
    width,
    height,
    layers: Object.fromEntries(Object.entries(map.layers).map(([id, cells]) => [id, copy(cells, EMPTY)])),
    solid: copy(map.solid, 0),
    spawn: { ...map.spawn, x: Math.min(map.spawn.x, width - 1), y: Math.min(map.spawn.y, height - 1) },
  };
}

// Dessine des calques de la carte dans un contexte 2D. `images` : { idDePlanche: image } ; `cols(sheetId)` :
// nombre de cases par ligne de la planche ; `scale` : taille d'affichage d'une case, en pixels.
export function drawLayers(ctx, map, layerIds, images, cols, scale = TILE, { x0 = 0, y0 = 0, x1 = map.width, y1 = map.height } = {}) {
  ctx.imageSmoothingEnabled = false;
  for (const id of layerIds) {
    const cells = map.layers[id];
    for (let y = y0; y < y1; y++) {
      for (let x = x0; x < x1; x++) {
        for (const ref of stackOf(cells[y * map.width + x])) {
          const tile = decodeRef(map, ref);
          const image = tile && images[tile.sheet];
          if (!image) continue;
          const c = cols(tile.sheet);
          ctx.drawImage(image, (tile.index % c) * TILE, Math.floor(tile.index / c) * TILE, TILE, TILE,
            x * scale, y * scale, scale, scale);
        }
      }
    }
  }
}

// Bords d'une carte du créateur que le jeu ne montre pas : la dernière rangée, la première et la dernière colonne,
// quand elles portent la bordure d'arbres (planche « lisieres ») : le bas et les côtés extérieurs des arbres restent
// cachés. Renvoie { left, right, bottom } en cases (0 ou 1).
export function hiddenEdges(built) {
  const none = { left: 0, right: 0, bottom: 0 };
  if (!built) return none;
  const W = built.width;
  const H = built.height;
  const tree = (x, y) => [built.layers.decor[y * W + x], built.layers.dessus[y * W + x]].some((cell) => (Array.isArray(cell) ? cell : [cell])
    .some((r) => r >= 0 && built.sheets[Math.floor(r / SHEET_STRIDE)] === 'lisieres'));
  const any = (cells) => cells.some(([x, y]) => tree(x, y));
  const range = (n) => [...Array(n).keys()];
  return {
    left: any(range(H).map((y) => [0, y])) ? 1 : 0,
    right: any(range(H).map((y) => [W - 1, y])) ? 1 : 0,
    bottom: any(range(W).map((x) => [x, H - 1])) ? 1 : 0,
  };
}
