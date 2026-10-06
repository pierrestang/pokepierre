import { refOf, decodeRef, stackOf, EMPTY, TILE } from './mapModel.js';
import { layoutForest } from './forestLayout.js';

// Mode simple du créateur de cartes : on peint des matières et on pose des éléments entiers, dans le thème d'une ville.
// - Matières (herbe, chemin, sable, hautes herbes, mer, étang, fleurs, pavés, forêt) : les bords se font tout seuls
//   (planche « transitions », voir assistant.js) ; la forêt se peint par blocs de 2 x 2, en rangées d'arbres entiers
//   (forestLayout.js), refaites à chaque coup de pinceau.
// - Éléments (maisons, arbres, plantes, mobilier, bateaux) : posés d'un clic, avec leurs collisions, leur porte, la
//   partie au-dessus de Pierre (toit, cime) ; refusés (contour rouge) s'ils chevauchent un obstacle, une case importante
//   (porte, PNJ…) ou s'ils ne sont pas sur leur sol (un bateau sur l'eau). Un élément posé se reprend à la gomme.
// - Thème : les matières et les éléments de la ville choisie (ses pavés, sa forêt, ses maisons dans sa palette) ;
//   « Libre » propose tout. Catalogue : public/assets/v2/catalogue.json (scripts/build_catalogue.py).
//
// Ce que le mode simple a posé est noté dans la carte (`studio` : thème, cases de forêt, éléments posés), pour refaire
// la lisière et reprendre un élément ; le jeu l'ignore.

const FLOWER_TILES = [['autotiles-g4', 64], ['autotiles-g4', 35], ['dppt', 3]];
const SIZES = [1, 2, 3, 5];

export function createStudio(api) {
  const { state } = api;
  let cat = null;                                  // catalogue.json
  let lis = null;                                  // lisieres.json
  const ui = { material: 'chemin', element: null, size: 2 };

  async function load() {
    if (cat) return;
    [cat, lis] = await Promise.all(['catalogue', 'lisieres'].map((id) => fetch(`${api.base}assets/v2/${id}.json`).then((r) => r.json())));
    await Promise.all(['catalogue', 'lisieres', 'dppt', 'autotiles-g4', 'transitions', 'auto'].map((id) => api.loadSheet(id)));
    await api.terrain.ready();
  }

  const data = () => {
    const m = state.map;
    if (!m.studio) m.studio = { theme: guessTheme(m), forest: [], elements: [] };
    m.studio.fence ??= [];
    return m.studio;
  };
  function guessTheme(m) {
    return cat.themes[m.id] ? m.id : 'libre';
  }
  const theme = () => cat.themes[data().theme] ?? cat.themes.libre;
  const material = () => theme().materials.find((x) => x.id === ui.material) ?? theme().materials[0];
  const elementDef = (id, themeId) => (cat.themes[themeId] ?? cat.themes.libre).elements.find((e) => e.id === id);
  const catRef = (k) => refOf(state.map, 'catalogue', k);

  // ---------- Petites aides sur les piles de cases ----------
  const push = (layer, i, ref) => {
    const m = state.map;
    const stack = stackOf(m.layers[layer][i]);
    m.layers[layer][i] = stack.length ? [...stack, ref].slice(-6) : ref;
  };
  const removeRefs = (layer, i, test) => {
    const m = state.map;
    const rest = stackOf(m.layers[layer][i]).filter((r) => !test(r));
    m.layers[layer][i] = rest.length > 1 ? rest : rest.length ? rest[0] : EMPTY;
  };
  const isFlower = (r) => {
    const t = decodeRef(state.map, r);
    return Boolean(t && FLOWER_TILES.some(([s, k]) => s === t.sheet && k === t.index));
  };
  const sheetOf = (r) => decodeRef(state.map, r)?.sheet;

  // ---------- Éléments posés ----------

  // Cases occupées par les éléments posés : index -> élément.
  function occupancy() {
    const m = state.map;
    const occ = new Map();
    for (const el of data().elements) {
      const def = elementDef(el.id, el.theme);
      if (!def) continue;
      def.tiles.forEach((row, j) => row.forEach((k, i) => {
        const x = el.x + i;
        const y = el.y + j;
        if (k >= 0 && x >= 0 && y >= 0 && x < m.width && y < m.height && (j >= def.over || def.solid[j][i])) occ.set(y * m.width + x, el);
      }));
    }
    return occ;
  }

  // Peut-on poser l'élément `def` avec son coin en haut à gauche en (x0, y0) ? { ok, why }
  async function canPlace(def, x0, y0) {
    const m = state.map;
    const cls = api.terrain.classes();
    const occ = occupancy();
    const important = new Set((await api.terrain.importantCells()).map(([x, y]) => `${x},${y}`));
    for (let j = 0; j < def.h; j++) {
      for (let i = 0; i < def.w; i++) {
        if (def.tiles[j][i] < 0) continue;
        const x = x0 + i;
        const y = y0 + j;
        const foot = j >= def.over;
        if (x < 0 || x >= m.width || y >= m.height || (y < 0 && foot)) return { ok: false, why: 'dépasse de la carte' };
        if (y < 0) continue;
        const k = y * m.width + x;
        if (!foot) continue;
        if (occ.has(k)) return { ok: false, why: 'chevauche un élément déjà posé' };
        const water = cls[k] === 'sea' || cls[k] === 'pond';
        if (def.place === 'water' && !water) return { ok: false, why: 'se pose sur l\'eau' };
        if (def.place === 'land' && water) return { ok: false, why: 'se pose sur la terre ferme' };
        if (def.solid[j][i] && def.place === 'land' && m.solid[k]) return { ok: false, why: 'chevauche un obstacle' };
        if (def.solid[j][i] && important.has(`${x},${y}`)) return { ok: false, why: 'bloquerait une case importante (porte, PNJ, départ…)' };
      }
    }
    return { ok: true };
  }

  function placeElement(def, x0, y0) {
    const m = state.map;
    const prev = [];
    def.tiles.forEach((row, j) => row.forEach((k, i) => {
      const x = x0 + i;
      const y = y0 + j;
      if (k < 0 || x < 0 || y < 0 || x >= m.width || y >= m.height) return;
      const c = y * m.width + x;
      push(j >= def.over ? 'decor' : 'dessus', c, catRef(k));
      if (def.solid[j][i]) { prev.push([c, m.solid[c]]); m.solid[c] = 1; }
      if (j >= def.over) removeRefs('decor', c, isFlower);        // pas de fleurs sous une maison
    }));
    data().elements.push({ id: def.id, theme: data().theme, x: x0, y: y0, prev });
  }

  function removeElement(el) {
    const m = state.map;
    const def = elementDef(el.id, el.theme);
    const d = data();
    d.elements = d.elements.filter((e) => e !== el);
    if (!def) return;
    def.tiles.forEach((row, j) => row.forEach((k, i) => {
      const x = el.x + i;
      const y = el.y + j;
      if (k < 0 || x < 0 || y < 0 || x >= m.width || y >= m.height) return;
      const c = y * m.width + x;
      const ref = catRef(k);
      for (const layer of ['decor', 'dessus']) {
        const stack = stackOf(m.layers[layer][c]);
        const at = stack.lastIndexOf(ref);
        if (at >= 0) {
          stack.splice(at, 1);
          m.layers[layer][c] = stack.length > 1 ? stack : stack.length ? stack[0] : EMPTY;
          break;
        }
      }
    }));
    for (const [c, v] of el.prev ?? []) m.solid[c] = v;
  }

  // ---------- Forêt ----------

  const forestMaterial = () => theme().materials.find((x) => x.kind === 'forest');
  const lisVariant = (id) => lis.variants.find((v) => v.id === id);

  // Refait toute la forêt peinte : tissu dense à l'intérieur, arbres entiers sur les blocs de lisière.
  function renderForest(oldCells) {
    const m = state.map;
    const W = m.width;
    const d = data();
    const fm = forestMaterial() ?? cat.themes.libre.materials.find((x) => x.kind === 'forest');
    const fillRefs = new Set();
    for (const t of Object.values(cat.themes)) {
      for (const x of t.materials) if (x.kind === 'forest') x.tiles.flat().forEach((k) => fillRefs.add(catRef(k)));
    }
    const mine = (r) => fillRefs.has(r) || sheetOf(r) === 'lisieres';
    // Effacer l'ancien rendu (cases de forêt d'avant et deux rangées au-dessus : les cimes).
    const touched = new Set();
    for (const [x, y] of [...oldCells, ...d.forest]) {
      for (let dy = -2; dy <= 0; dy++) if (y + dy >= 0 && y + dy < m.height && x < W) touched.add((y + dy) * W + x);
    }
    for (const c of touched) { removeRefs('decor', c, mine); removeRefs('dessus', c, mine); }
    const set = new Set(d.forest.filter(([x, y]) => x < W && y < m.height).map(([x, y]) => y * W + x));
    for (const [x, y] of oldCells) if (x < W && y < m.height && !set.has(y * W + x)) m.solid[y * W + x] = 0;
    const variant = lisVariant(fm.variant) ?? lis.variants[0];
    const isF = (x, y) => x >= 0 && y >= 0 && x < W && y < m.height && set.has(y * W + x);
    const { blocks, inBlock, touchesOpen } = layoutForest(W, m.height, isF);
    const grass = refOf(m, 'dppt', 4);
    const lisRef = (col, row) => refOf(m, 'lisieres', (variant.row + row) * lis.cols + col);
    for (const c of set) {
      const x = c % W;
      const y = Math.floor(c / W);
      const s = stackOf(m.layers.sol[c]);
      m.layers.sol[c] = s.length > 1 ? [grass, ...s.slice(1)] : grass;
      m.solid[c] = 1;
      // Le tissu ne reste que derrière ; au bord, l'herbe (et un buisson hors des blocs).
      if (!touchesOpen(x, y)) push('decor', c, catRef(fm.tiles[y % 2][x % 2]));
      else if (!inBlock(x, y)) push('decor', c, lisRef(lis.bush.col, 0));
    }
    // Un arbre entier par bloc, de haut en bas (la cime du dessous passe devant le tronc du dessus).
    for (const [bx, by] of blocks) {
      for (let k = 0; k < lis.tree.h; k++) {
        const y = by - 2 + k;
        if (y < 0) continue;
        for (let dx = 0; dx < lis.tree.w; dx++) {
          const c = y * W + bx + dx;
          push(k >= 2 || set.has(c) ? 'decor' : 'dessus', c, lisRef(lis.tree.col + dx, k));
        }
      }
    }
  }

  // ---------- Clôtures ----------

  // Toutes les cases de clôture posées (des deux styles), pour les retrouver dans le Décor.
  const fenceRefs = () => {
    const out = new Set();
    for (const t of Object.values(cat.themes)) {
      for (const x of t.materials) if (x.kind === 'fence') Object.values(x.pieces).forEach((k) => out.add(refOf(state.map, 'dppt', k)));
    }
    return out;
  };

  // Redessine les clôtures autour des cases touchées : chaque case prend l'angle, le bout ou la jonction qui va avec
  // ses voisines (la règle de g4_theme.paint_objects).
  function renderFences(touched) {
    const m = state.map;
    const W = m.width;
    const d = data();
    const fm = theme().materials.find((x) => x.kind === 'fence') ?? cat.themes.libre.materials.find((x) => x.kind === 'fence');
    const set = new Set(d.fence.map(([x, y]) => y * W + x));
    const refs = fenceRefs();
    const around = new Set();
    for (const [x, y] of touched) {
      for (const [dx, dy] of [[0, 0], [1, 0], [-1, 0], [0, 1], [0, -1]]) {
        if (x + dx >= 0 && y + dy >= 0 && x + dx < W && y + dy < m.height) around.add((y + dy) * W + x + dx);
      }
    }
    const isF = (x, y) => x >= 0 && y >= 0 && x < W && y < m.height && set.has(y * W + x);
    // Montant : collé à droite de la case si le bout de son côté tourne vers la gauche (le côté droit d'un enclos).
    const side = (x, y) => {
      for (const step of [-1, 1]) {
        let k = y;
        while (isF(x, k + step)) k += step;
        if (isF(x - 1, k) && !isF(x + 1, k)) return 'vr';
        if (isF(x + 1, k)) return 'v';
      }
      return 'v';
    };
    // Tout le côté vertical dont une case a changé (son montant peut passer de gauche à droite).
    for (const c of [...around]) {
      const x = c % W;
      for (const step of [-1, 1]) for (let k = Math.floor(c / W) + step; isF(x, k); k += step) around.add(k * W + x);
    }
    for (const c of around) {
      const had = stackOf(m.layers.decor[c]).some((r) => refs.has(r));
      removeRefs('decor', c, (r) => refs.has(r));
      const x = c % W;
      const y = Math.floor(c / W);
      if (!set.has(c)) { if (had) m.solid[c] = 0; continue; }
      const n = isF(x, y - 1);
      const s = isF(x, y + 1);
      const w = isF(x - 1, y);
      const e = isF(x + 1, y);
      const kind = (w || e) && (n || s) ? `${s ? 't' : 'b'}${e ? 'l' : 'r'}` : w || e ? 'h' : n || s ? side(x, y) : 'post';
      push('decor', c, refOf(m, 'dppt', fm.pieces[kind]));
      m.solid[c] = 1;
    }
  }

  // ---------- Peindre ----------

  // Cases du pinceau autour de (x, y) ; la forêt se peint par blocs de 2 x 2 calés sur la grille.
  function brushCells(x, y, forest, erase = false) {
    const m = state.map;
    const out = [];
    const n = forest ? Math.max(2, ui.size + (ui.size % 2)) : !erase && material().kind === 'fence' ? 1 : ui.size;
    let x0 = x - Math.floor((n - 1) / 2);
    let y0 = y - Math.floor((n - 1) / 2);
    if (forest) { x0 -= ((x0 % 2) + 2) % 2; y0 -= ((y0 % 2) + 2) % 2; }
    for (let j = 0; j < n; j++) {
      for (let i = 0; i < n; i++) if (x0 + i >= 0 && y0 + j >= 0 && x0 + i < m.width && y0 + j < m.height) out.push([x0 + i, y0 + j]);
    }
    return out;
  }

  let stroke = null;                               // { cls, cells: Set, oldForest }

  function beginStroke() {
    stroke = { cls: api.terrain.classes(), cells: new Set(), oldForest: data().forest.slice(), occ: occupancy(), fenceTouched: [] };
  }

  // Peint la matière choisie (ou, gomme : l'herbe) sur les cases [x, y].
  function paintCells(cells, erase = false) {
    if (!stroke) beginStroke();
    const m = state.map;
    const W = m.width;
    const mat = erase ? theme().materials[0] : material();
    const d = data();
    const fresh = [];
    for (const [x, y] of cells) {
      const c = y * W + x;
      if (stroke.occ.has(c)) continue;                         // un élément posé protège sa case
      fresh.push(c);
      stroke.cells.add(c);
      // La clôture quitte la case (sauf si on peint de la clôture).
      if (mat.kind !== 'fence' && d.fence.some(([a, b]) => a === x && b === y)) {
        d.fence = d.fence.filter(([a, b]) => a !== x || b !== y);
        stroke.fenceTouched.push([x, y]);
      }
      if (mat.kind === 'fence') {
        if (m.solid[c] && !d.fence.some(([a, b]) => a === x && b === y)) continue;      // pas sur un obstacle
        if (!d.fence.some(([a, b]) => a === x && b === y)) d.fence.push([x, y]);
        removeRefs('decor', c, isFlower);
        stroke.fenceTouched.push([x, y]);
        continue;
      }
      // La forêt quitte la case (sauf si on peint de la forêt).
      if (mat.kind !== 'forest' && d.forest.some(([a, b]) => a === x && b === y)) d.forest = d.forest.filter(([a, b]) => a !== x || b !== y);
      const sol = stackOf(m.layers.sol[c]);
      if (mat.kind === 'overlay') {
        if (stroke.cls[c] !== 'grass' || m.solid[c]) continue;
        removeRefs('decor', c, isFlower);
        push('decor', c, refOf(m, mat.tile[0], mat.tile[1]));
        continue;
      }
      if (mat.kind === 'forest') {
        if (!d.forest.some(([a, b]) => a === x && b === y)) d.forest.push([x, y]);
        removeRefs('decor', c, isFlower);
        stroke.cls[c] = 'grass';
        continue;
      }
      removeRefs('decor', c, isFlower);
      if (mat.kind === 'plain' || mat.kind === 'kit') {
        api.terrain.paint(stroke.cls, [c], mat.kind === 'plain' ? 'grass' : mat.terrain);
      } else if (mat.kind === 'tile') {
        const [sh, k] = mat.tiles[y % mat.tiles.length][x % mat.tiles[0].length];
        m.layers.sol[c] = sol.length > 1 ? [refOf(m, sh, k), ...sol.slice(1)] : refOf(m, sh, k);
        stroke.cls[c] = mat.cls ?? 'other';
      } else if (mat.kind === 'pattern') {
        const k = mat.tiles[y % mat.tiles.length][x % mat.tiles[0].length];
        if (mat.solid) {
          const g = refOf(m, 'dppt', 4);
          m.layers.sol[c] = sol.length > 1 ? [g, ...sol.slice(1)] : g;
          removeRefs('decor', c, (r) => sheetOf(r) === 'catalogue');
          push('decor', c, catRef(k));
          stroke.cls[c] = 'grass';
        } else {
          m.layers.sol[c] = sol.length > 1 ? [catRef(k), ...sol.slice(1)] : catRef(k);
          stroke.cls[c] = 'other';
        }
      }
      m.solid[c] = mat.solid ? 1 : 0;
    }
    api.terrain.retileAround(stroke.cls, fresh);
    if (mat.center) themedCenter(mat, fresh);
    if (stroke.fenceTouched.length) { renderFences(stroke.fenceTouched); stroke.fenceTouched = []; }
    if (mat.kind === 'forest' || cells.some(([x, y]) => stroke.oldForest.some(([a, b]) => a === x && b === y))) renderForest(stroke.oldForest);
  }

  function endStroke() {
    stroke = null;
  }

  // La mer d'une ville (Fort-de-France : son océan) à la place de la case pleine de DPPt, autour des cases peintes.
  function themedCenter(mat, cells) {
    const m = state.map;
    const W = m.width;
    const t = { sea: [6, 6], pond: [1, 6] }[mat.terrain];
    const plain = refOf(m, 'dppt', t[1] * api.colsOf('dppt') + t[0]);
    for (const c0 of cells) {
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          const x = (c0 % W) + dx;
          const y = Math.floor(c0 / W) + dy;
          if (x < 0 || y < 0 || x >= W || y >= m.height) continue;
          const c = y * W + x;
          const sol = stackOf(m.layers.sol[c]);
          // Une case du rivage qui a un coin d'eau claire : sa version avec l'océan.
          const tile = decodeRef(m, sol[0]);
          const swap = tile?.sheet === 'auto' && mat.swap?.[`${tile.index}:${(y % 2) * 2 + (x % 2)}`];
          if (swap !== undefined && swap !== false) {
            m.layers.sol[c] = sol.length > 1 ? [catRef(swap), ...sol.slice(1)] : catRef(swap);
            continue;
          }
          if (sol[0] !== plain) continue;
          const [sh, k] = mat.center[(y % 2) * 2 + (x % 2)];
          m.layers.sol[c] = sol.length > 1 ? [refOf(m, sh, k), ...sol.slice(1)] : refOf(m, sh, k);
        }
      }
    }
  }

  // Remplir : la matière choisie sur toutes les cases reliées de la même matière que celle cliquée.
  function fillFrom(x, y) {
    const m = state.map;
    const W = m.width;
    beginStroke();
    const cls = stroke.cls;
    const start = y * W + x;
    const want = cls[start];
    const seen = new Set([start]);
    const todo = [start];
    while (todo.length) {
      const c = todo.pop();
      for (const n of [c - 1, c + 1, c - W, c + W]) {
        if (n < 0 || n >= W * m.height || seen.has(n) || Math.abs((n % W) - (c % W)) > 1) continue;
        if (cls[n] !== want || stroke.occ.has(n) || (m.solid[n] && !['sea', 'pond', 'lagoon'].includes(want))) continue;
        seen.add(n);
        todo.push(n);
      }
    }
    paintCells([...seen].map((c) => [c % W, Math.floor(c / W)]));
  }

  // ---------- Panneau ----------

  function thumb(def, size = 56) {
    const cv = document.createElement('canvas');
    const k = Math.min(size / (def.w * TILE), size / (def.h * TILE), 2);
    cv.width = Math.ceil(def.w * TILE * k);
    cv.height = Math.ceil(def.h * TILE * k);
    const g = cv.getContext('2d');
    g.imageSmoothingEnabled = false;
    const img = state.images.catalogue;
    def.tiles.forEach((row, j) => row.forEach((t, i) => {
      if (t < 0 || !img) return;
      g.drawImage(img, (t % cat.cols) * TILE, Math.floor(t / cat.cols) * TILE, TILE, TILE, i * TILE * k, j * TILE * k, TILE * k, TILE * k);
    }));
    return cv;
  }

  function materialSwatch(mat) {
    const cv = document.createElement('canvas');
    cv.width = cv.height = 32;
    const g = cv.getContext('2d');
    g.imageSmoothingEnabled = false;
    const draw = (sheet, k, x, y) => {
      const img = state.images[sheet];
      if (!img) return;
      const c = api.colsOf(sheet);
      g.drawImage(img, (k % c) * TILE, Math.floor(k / c) * TILE, TILE, TILE, x, y, TILE, TILE);
    };
    const grass = () => { for (const [x, y] of [[0, 0], [16, 0], [0, 16], [16, 16]]) draw('dppt', 4, x, y); };
    if (mat.kind === 'plain') grass();
    else if (mat.kind === 'kit' && !mat.center) {
      const t = { path: [1, 1, 'dppt'], beach: [6, 1, 'dppt'], sea: [6, 6, 'dppt'], pond: [1, 6, 'dppt'], tall: [1, 2, 'autotiles-g4'] }[mat.terrain];
      const c = api.colsOf(t[2]);
      for (const [x, y] of [[0, 0], [16, 0], [0, 16], [16, 16]]) draw(t[2], t[1] * c + t[0], x, y);
    } else if (mat.kind === 'tile' || mat.center) {
      const tiles = mat.center ? [[mat.center[0], mat.center[1]], [mat.center[2], mat.center[3]]] : mat.tiles;
      for (let j = 0; j < 2; j++) for (let i = 0; i < 2; i++) { const [sh, k] = tiles[j % tiles.length][i % tiles[0].length]; draw(sh, k, i * 16, j * 16); }
    } else if (mat.kind === 'fence') {
      grass();
      draw('dppt', mat.pieces.h, 0, 8);
      draw('dppt', mat.pieces.tr, 16, 8);
    } else if (mat.kind === 'overlay') {
      grass();
      for (const [x, y] of [[0, 0], [16, 0], [0, 16], [16, 16]]) draw(mat.tile[0], mat.tile[1], x, y);
    } else {
      grass();
      const rows = mat.tiles;
      for (let j = 0; j < 2; j++) for (let i = 0; i < 2; i++) draw('catalogue', rows[j % rows.length][i % rows[0].length], i * 16, j * 16);
    }
    return cv;
  }

  const CATS = [['maisons', 'Maisons'], ['arbres', 'Arbres'], ['plantes', 'Plantes'], ['mobilier', 'Mobilier'], ['eau', 'Sur l\'eau']];

  function render() {
    const root = document.getElementById('studio');
    if (!root || !cat || !state.map) return;
    const d = data();
    const sel = document.getElementById('studio-theme');
    sel.innerHTML = Object.entries(cat.themes).map(([id, t]) => `<option value="${id}">${t.name}</option>`).join('');
    sel.value = d.theme;
    const mats = document.getElementById('studio-materials');
    mats.innerHTML = '';
    for (const mat of theme().materials) {
      const b = document.createElement('button');
      b.className = `swatch${ui.material === mat.id && !ui.element ? ' on' : ''}`;
      b.title = `${mat.name}${mat.solid ? ' (on ne passe pas)' : ''}`;
      b.append(materialSwatch(mat));
      const s = document.createElement('span');
      s.textContent = mat.name;
      b.append(s);
      b.onclick = () => { ui.material = mat.id; ui.element = null; api.setTool('brush'); render(); };
      mats.append(b);
    }
    const els = document.getElementById('studio-elements');
    els.innerHTML = '';
    for (const [cid, cname] of CATS) {
      const list = theme().elements.filter((e) => e.cat === cid);
      if (!list.length) continue;
      const h = document.createElement('div');
      h.className = 'studio-cat';
      h.textContent = cname;
      els.append(h);
      const grid = document.createElement('div');
      grid.className = 'studio-grid';
      for (const def of list) {
        const b = document.createElement('button');
        b.className = `elem${ui.element === def.id ? ' on' : ''}`;
        b.title = `${def.name} (${def.w} × ${def.h})`;
        b.append(thumb(def));
        b.onclick = () => { ui.element = def.id; api.setTool('place'); render(); };
        grid.append(b);
      }
      els.append(grid);
    }
    document.querySelectorAll('[data-bsize]').forEach((b) => b.classList.toggle('on', Number(b.dataset.bsize) === ui.size));
  }

  function bind() {
    document.getElementById('studio-theme').addEventListener('change', (e) => {
      api.remember();
      data().theme = e.target.value;
      if (!theme().materials.some((x) => x.id === ui.material)) ui.material = 'chemin';
      ui.element = null;
      api.changed();
      render();
    });
    document.querySelectorAll('[data-bsize]').forEach((b) => b.addEventListener('click', () => { ui.size = Number(b.dataset.bsize); render(); }));
  }

  // Aperçu de l'élément sous la souris (vert : posable, rouge : refusé, avec la raison).
  let ghost = null;                                // { x, y, ok, why }
  async function hover(x, y) {
    const def = ui.element && theme().elements.find((e) => e.id === ui.element);
    if (!def) { ghost = null; return; }
    const x0 = x - Math.floor(def.w / 2);
    const y0 = y - def.h + 1;
    if (ghost && ghost.x === x0 && ghost.y === y0) return;
    ghost = { x: x0, y: y0, ok: true, pending: true };
    const r = await canPlace(def, x0, y0);
    if (ghost && ghost.x === x0 && ghost.y === y0) { ghost = { x: x0, y: y0, ...r }; api.requestDraw(); }
  }

  function drawGhost(ctx, cs) {
    const def = ui.element && theme().elements.find((e) => e.id === ui.element);
    if (!def || !ghost || state.tool !== 'place') return;
    const img = state.images.catalogue;
    ctx.globalAlpha = 0.8;
    def.tiles.forEach((row, j) => row.forEach((t, i) => {
      if (t >= 0 && img) ctx.drawImage(img, (t % cat.cols) * TILE, Math.floor(t / cat.cols) * TILE, TILE, TILE, (ghost.x + i) * cs, (ghost.y + j) * cs, cs, cs);
    }));
    ctx.globalAlpha = 1;
    ctx.lineWidth = 2;
    ctx.strokeStyle = ghost.ok ? '#4ade80' : '#f87171';
    def.solid.forEach((row, j) => row.forEach((s, i) => {
      if (s) ctx.strokeRect((ghost.x + i) * cs + 2, (ghost.y + j) * cs + 2, cs - 4, cs - 4);
    }));
    ctx.strokeRect(ghost.x * cs, ghost.y * cs, def.w * cs, def.h * cs);
  }

  async function clickPlace() {
    const def = ui.element && theme().elements.find((e) => e.id === ui.element);
    if (!def || !ghost) return null;
    const r = await canPlace(def, ghost.x, ghost.y);
    if (!r.ok) return { text: `${def.name} : pas ici, ${r.why}.`, kind: 'err' };
    api.remember();
    placeElement(def, ghost.x, ghost.y);
    api.changed();
    ghost = null;
    return { text: `${def.name} posé${def.cat === 'maisons' ? 'e' : ''}.`, kind: 'ok' };
  }

  // Gomme : sur un élément posé, on le retire ; ailleurs, on repeint de l'herbe.
  function eraseAt(x, y) {
    const el = occupancy().get(y * state.map.width + x);
    if (el) { removeElement(el); stroke = null; return el; }
    paintCells(brushCells(x, y, false, true), true);
    return null;
  }

  return {
    load, render, bind, hover, drawGhost, clickPlace, eraseAt, fillFrom, beginStroke, endStroke,
    paintAt: (x, y) => paintCells(brushCells(x, y, material().kind === 'forest')),
    paintRect: (r) => {
      const forest = material().kind === 'forest';
      const cells = [];
      const x0 = forest ? r.x0 - (r.x0 % 2) : r.x0;
      const y0 = forest ? r.y0 - (r.y0 % 2) : r.y0;
      const x1 = forest ? r.x1 + 1 - (r.x1 % 2) : r.x1;
      const y1 = forest ? r.y1 + 1 - (r.y1 % 2) : r.y1;
      const fence = material().kind === 'fence';        // une clôture : le tour du rectangle seulement
      for (let y = Math.max(0, y0); y <= Math.min(state.map.height - 1, y1); y++) {
        for (let x = Math.max(0, x0); x <= Math.min(state.map.width - 1, x1); x++) {
          if (!fence || x === x0 || x === x1 || y === y0 || y === y1) cells.push([x, y]);
        }
      }
      beginStroke();
      paintCells(cells);
    },
    brushCells: (x, y) => brushCells(x, y, !ui.element && state.tool !== 'erase' && material().kind === 'forest', state.tool === 'erase'),
    get ui() { return ui; },
    SIZES,
  };
}
