import {
  TILE, EMPTY, LAYERS, blankMap, slugify, refOf, decodeRef, resizeMap, drawLayers, stackOf, topRef, cellOf, hiddenEdges,
} from './mapModel.js';
import { createAssistant } from './assistant.js';
import { createStudio } from './studio.js';
import { createNpcLayer } from './npcs.js';

// Créateur de cartes (builder.html) : on peint la carte case par case avec les planches V2
// (public/assets/v2, préparées par scripts/build_v2_tiles.py), sur trois calques, puis on règle les collisions et le
// point de départ. En développement, « Enregistrer » écrit la carte dans le projet (src/data/builtMaps, voir
// vite.config.js) ; sur le site publié, dans le navigateur. « Tester » ouvre la carte dans le jeu (?carte=test).

const BASE = import.meta.env.BASE_URL;
const PALETTE_ZOOMS = [1, 2, 3];
const ZOOMS = [0.5, 0.75, 1, 1.5, 2, 3, 4, 6, 8];
const PAN_STEP = 96;                         // déplacement aux flèches, en pixels d'écran (x4 avec Maj)
const HISTORY = 100;
const ERASE_SIZES = [1, 2, 3, 5];            // côté du carré gommé, en cases
// Rayons de la palette, dans l'ordre (le rayon de chaque planche : `group` dans catalog.json).
const INTERIOR_SHEETS = ['interieurs', 'dppt-int', 'hgss-int', 'jesus-3', 'jared-bateaux'];
const PALETTE_GROUPS = ['Sols et chemins', 'Eau', 'Végétation', 'Relief', 'Bâtiments', 'Mobilier urbain', 'Décor',
  'Intérieurs', 'Cases assemblées'];
const KEYS = {
  mode: 'pokepierre.builder.mode',
  current: 'pokepierre.builder.current',     // la carte en cours (rouverte au rechargement de la page)
  dirty: 'pokepierre.builder.dirty',         // la carte en cours a des modifications non enregistrées
  base: 'pokepierre.builder.base',           // version enregistrée d'où vient la carte en cours ({ id, etag }), ou null
  library: 'pokepierre.builder.maps',        // cartes enregistrées dans le navigateur (site publié)
  test: 'pokepierre.builder.test',           // la carte à tester dans le jeu
  aside: 'pokepierre.builder.aside',         // largeur du panneau des planches
  eraseSize: 'pokepierre.builder.eraseSize', // taille de la gomme
};

const $ = (id) => document.getElementById(id);
const store = {
  get(key) {
    try { return JSON.parse(localStorage.getItem(key)); } catch { return null; }
  },
  set(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* stockage plein ou indisponible */ }
  },
};

const state = {
  catalog: null,
  images: {},
  map: null,
  layer: 'sol',
  tool: 'brush',
  sheet: null,
  stamp: null,              // { w, h, tiles: [{ sheet, index } | null] }
  paletteSel: null,         // { x0, y0, x1, y1 } en cases de la planche affichée
  zoom: 2,
  eraseSize: 1,             // côté du carré gommé (ERASE_SIZES)
  paletteZoom: 1,            // ×1 : la planche occupe toute la largeur du panneau
  hidden: new Set(),        // calques masqués
  autoLayer: true,          // calque choisi tout seul (sol / décor / au-dessus de Pierre) et collisions automatiques
  ox: 0,                    // décalage de la carte dans la vue, en pixels d'écran
  oy: 0,
  grid: true,
  showSolid: false,
  hover: null,              // case survolée { x, y }
  drag: null,               // geste en cours sur la carte
  undo: [],
  redo: [],
  projectSave: false,       // le serveur de développement peut enregistrer dans le projet
  dirty: false,
  // Version enregistrée d'où vient la carte en cours : { id, etag } (etag : empreinte du fichier du projet, voir
  // vite.config.js ; null dans le navigateur), ou null pour une carte jamais enregistrée. Elle garde son identifiant
  // (son fichier) même renommée, et on ne remplace pas sans le dire une version enregistrée qui a changé depuis.
  base: null,
  lastMoved: null,          // l'élément qu'on vient de déplacer (outil Déplacer) : Suppr le supprime
  clipboard: null,          // bloc copié (Ctrl+C, Ctrl+D) : { w, h, whole, cells: [{ dx, dy, refs, solid }] }
  pasting: false,           // la copie suit la souris : un clic la pose (Échap pour arrêter)
  mode: 'simple',           // 'simple' : matières et éléments (studio.js) ; 'detail' : planches et calques, case par case
};

// ---------- Planches ----------

const sheetInfo = (id) => state.catalog.sheets.find((s) => s.id === id);
const colsOf = (id) => sheetInfo(id)?.cols ?? 8;

async function loadCatalog() {
  state.catalog = await (await fetch(`${BASE}assets/v2/catalog.json`)).json();
  state.catalog.sheets.forEach((s) => { s.emptySet = new Set(s.empty); });
}

// Images des planches, chargées à la demande (la planche affichée dans la palette, celles de la carte ouverte) : il y
// en a pour une quinzaine de Mo en tout.
const sheetLoads = {};
function loadSheet(id) {
  if (!sheetLoads[id]) {
    sheetLoads[id] = new Promise((resolve) => {
      const s = sheetInfo(id);
      if (!s) return resolve(null);
      // Objet de chaque case (planches Gen 4 rangées par type), chargé avec l'image : voir elementsOf.
      const elements = s.elementsFile
        ? fetch(`${BASE}assets/v2/${s.elementsFile}`).then((r) => r.json()).then((e) => { s.elementMap = e; }).catch(() => {})
        : Promise.resolve();
      const image = new Image();
      image.onload = () => elements.then(() => {
        state.images[id] = image;
        requestDraw();
        resolve(image);
      });
      image.onerror = () => resolve(null);
      image.src = `${BASE}assets/v2/${s.file}`;
    });
  }
  return sheetLoads[id];
}

// ---------- Analyse des cases ----------
// Pour chaque case d'une planche : entièrement opaque (un sol) ou non (un objet), et la part de pixels pleins
// (les ombres semi-transparentes ne comptent pas) : un objet qui couvre bien sa case bloque le passage.
const tileStatsCache = {};

function tileStats(sheet) {
  if (tileStatsCache[sheet]) return tileStatsCache[sheet];
  const image = state.images[sheet];
  const s = sheetInfo(sheet);
  const c = document.createElement('canvas');
  c.width = s.cols * TILE;
  c.height = s.rows * TILE;
  const cx = c.getContext('2d', { willReadFrequently: true });
  cx.drawImage(image, 0, 0);
  const data = cx.getImageData(0, 0, c.width, c.height).data;
  const n = s.cols * s.rows;
  const opaque = new Uint8Array(n);
  const cover = new Float32Array(n);
  const solidPx = new Uint8Array(n * TILE * TILE);     // pixels pleins de chaque case (pour l'outil Déplacer)
  for (let i = 0; i < n; i++) {
    const x0 = (i % s.cols) * TILE;
    const y0 = Math.floor(i / s.cols) * TILE;
    let full = 0;
    for (let y = 0; y < TILE; y++) {
      for (let x = 0; x < TILE; x++) {
        const a = data[((y0 + y) * c.width + x0 + x) * 4 + 3];
        if (a === 255) full++;
        if (a >= 128) solidPx[i * TILE * TILE + y * TILE + x] = 1;
      }
    }
    opaque[i] = full === TILE * TILE ? 1 : 0;
    cover[i] = full / (TILE * TILE);
  }
  tileStatsCache[sheet] = { opaque, cover, solidPx };
  return tileStatsCache[sheet];
}
const isOpaque = (t) => Boolean(tileStats(t.sheet).opaque[t.index]);
const coverOf = (t) => tileStats(t.sheet).cover[t.index];

// ---------- Éléments des planches ----------
// Planches dont on connaît les éléments : chaque case y appartient à un élément (un arbre, une maison, un bloc de
// sol…) d'un type connu. Bibliothèque Gen 4 rangée par type : objets séparés au pixel près par
// scripts/build_g4_library.py (element_map, fichier <planche>.elements.json) ; planche « objets » et autotiles :
// emplacements du catalogue. Le calque et les collisions de chaque case posée en découlent (placementOf).
const elementCache = {};

function elementsOf(sheet) {
  if (sheet in elementCache) return elementCache[sheet];
  const s = sheetInfo(sheet);
  let result = null;
  if (s.elementMap) {
    const owner = new Int32Array(s.cols * s.rows).fill(-1);
    let i = 0;
    for (const [id, count] of s.elementMap.owner) owner.fill(id, i, (i += count));
    result = { owner, list: s.elementMap.elements.map(([x0, y0, x1, y1]) => ({ x0, y0, x1, y1, kind: s.category })) };
  } else if (s.elements) {
    const owner = new Int32Array(s.cols * s.rows).fill(-1);
    const list = s.elements.map(([x, y, w, h, kind], id) => {
      for (let r = y; r < y + h; r++) owner.fill(id, r * s.cols + x, r * s.cols + x + w);
      return { x0: x, y0: y, x1: x + w - 1, y1: y + h - 1, kind };
    });
    result = { owner, list };
  }
  elementCache[sheet] = result;
  return result;
}

// Où va une case posée et si elle bloque : { layer, solid } (solid : 1 bloque, 0 libère, null ne change rien).
// Planche aux éléments connus : d'après le type de l'élément et la rangée de la case dans l'élément, quelle que
// soit la sélection.
//   sols : case pleine -> Sol ; bord transparent -> par-dessus le sol (Décor), sans bloquer.
//   eau : comme un sol, mais on ne passe pas.
//   fleurs et plantes, ponts et pontons : Décor, on passe dessus.
//   herbes : hautes herbes et touffes, on passe dessus.
//   arbres : les 2 rangées du bas dans le Décor, la cime au-dessus de Pierre ; bâtiments : les deux tiers du bas ;
//   clôtures : tout sauf la rangée du haut, et même un poteau fin bloque ; le reste (mobilier, rochers, bateaux,
//   meubles…) : la moitié du bas.
//   Dans le Décor, une case bloque si l'objet la remplit vraiment (pas une ombre, pas un bord presque vide).
// Autres planches : une case pleine est un sol ; sinon, d'après sa rangée `dy` dans la sélection `stamp` (le pied,
// environ 60 % des rangées du bas, dans le Décor ; le haut au-dessus de Pierre).
function placementOf(tile, stamp, dy) {
  if (!state.autoLayer) return { layer: state.layer, solid: state.layer === 'decor' ? 1 : null };
  const s = sheetInfo(tile.sheet);
  const known = elementsOf(tile.sheet);
  const opaque = isOpaque(tile);
  const cover = coverOf(tile);
  if (!known) {
    if (opaque || stamp?.tiles.every((t) => !t || isOpaque(t))) return { layer: 'sol', solid: 0 };
    const h = stamp?.h ?? 1;
    const footRows = Math.max(1, Math.round(h * 0.6));
    if ((dy ?? h - 1) < h - footRows) return { layer: 'dessus', solid: null };
    return { layer: 'decor', solid: cover >= (h * (stamp?.w ?? 1) === 1 ? 0.45 : 0.3) ? 1 : null };
  }
  const el = known.list[known.owner[tile.index]];
  const kind = el?.kind ?? s.category ?? (opaque ? 'sols' : 'objet');
  if (kind === 'sols' || kind === 'int-sols') return opaque ? { layer: 'sol', solid: 0 } : { layer: 'decor', solid: null };
  if (kind === 'eau') return { layer: opaque ? 'sol' : 'decor', solid: 1 };
  if (kind === 'plantes' || kind === 'ponts') return { layer: 'decor', solid: 0 };
  if (kind === 'herbes') return { layer: opaque ? 'sol' : 'decor', solid: 0 };   // hautes herbes, touffes
  const h = el ? el.y1 - el.y0 + 1 : 1;
  const w = el ? el.x1 - el.x0 + 1 : 1;
  const row = el ? Math.floor(tile.index / s.cols) - el.y0 : 0;
  const foot = kind === 'arbres' ? Math.min(2, h)
    : kind === 'batiments' ? (h <= 3 ? h : Math.max(2, Math.round(h * 0.65)))
      : kind === 'clotures' ? Math.max(1, h - 1)
        : (h <= 2 ? h : Math.max(1, Math.round(h * 0.5)));
  if (row < h - foot) return { layer: 'dessus', solid: null };
  const minCover = kind === 'clotures' ? 0.12 : w * h === 1 ? 0.45 : 0.3;     // un poteau de clôture fin bloque
  return { layer: 'decor', solid: cover >= minCover ? 1 : null };
}

// ---------- Palette ----------

const palette = $('palette');
const pctx = palette.getContext('2d');

// Échelle de dessin de la palette (pixels par pixel de planche). En ×1, la planche est étirée en CSS sur toute la
// largeur du panneau ; on la dessine alors assez grande (échelle entière) pour rester nette. Une image de navigateur
// ne dépasse pas 32 767 px de haut : une très haute planche (Bâtiments) est dessinée plus petite, puis agrandie en CSS.
const MAX_CANVAS = 32_000;

function paletteScale() {
  const s = sheetInfo(state.sheet);
  const wanted = state.paletteZoom !== 1 ? state.paletteZoom
    : Math.ceil($('palette-wrap').clientWidth * window.devicePixelRatio / (s.cols * TILE));
  return Math.max(1, Math.min(wanted, Math.floor(MAX_CANVAS / (s.rows * TILE))));
}

function showSheet(id) {
  state.sheet = id;
  // Planche d'origine masquée (pipette sur une case d'une carte générée) : ajoutée à la liste, à part.
  if (![...$('sheet').options].some((o) => o.value === id)) {
    let group = $('sheet').querySelector('optgroup[data-hidden]');
    if (!group) {
      group = document.createElement('optgroup');
      group.label = "Planches d'origine (cartes générées)";
      group.dataset.hidden = '1';
      $('sheet').append(group);
    }
    group.append(new Option(sheetInfo(id)?.name ?? id, id));
  }
  $('sheet').value = id;
  const s = sheetInfo(id);
  if (!state.images[id]) loadSheet(id).then(() => { if (state.sheet === id) drawPalette(); });
  const scale = paletteScale();
  palette.width = s.cols * TILE * scale;
  palette.height = s.rows * TILE * scale;
  palette.classList.toggle('fit', state.paletteZoom === 1);
  palette.style.width = state.paletteZoom === 1 ? '' : `${s.cols * TILE * state.paletteZoom}px`;
  $('sheet-size').textContent = `${s.cols} × ${s.rows}`;
  $('palette-zoom').textContent = `×${state.paletteZoom}`;
  drawPalette();
}

function drawPalette() {
  const s = sheetInfo(state.sheet);
  const z = TILE * palette.width / (s.cols * TILE);
  pctx.imageSmoothingEnabled = false;
  pctx.clearRect(0, 0, palette.width, palette.height);
  if (state.images[s.id]) pctx.drawImage(state.images[s.id], 0, 0, s.cols * z, s.rows * z);
  // Cases vides de la planche : voilées (on ne peut pas les choisir).
  pctx.fillStyle = 'rgba(29, 33, 41, 0.85)';
  for (const i of s.empty) pctx.fillRect((i % s.cols) * z, Math.floor(i / s.cols) * z, z, z);
  const sel = state.paletteSel;
  if (sel && sel.sheet === s.id) {
    const x = Math.min(sel.x0, sel.x1) * z;
    const y = Math.min(sel.y0, sel.y1) * z;
    const w = (Math.abs(sel.x1 - sel.x0) + 1) * z;
    const h = (Math.abs(sel.y1 - sel.y0) + 1) * z;
    pctx.lineWidth = 2;
    pctx.strokeStyle = '#fff';
    pctx.strokeRect(x + 1, y + 1, w - 2, h - 2);
    pctx.strokeStyle = '#e8473f';
    pctx.strokeRect(x + 3, y + 3, w - 6, h - 6);
  }
}

function paletteCell(e) {
  const r = palette.getBoundingClientRect();
  const s = sheetInfo(state.sheet);
  const z = r.width / s.cols;
  return {
    x: Math.max(0, Math.min(s.cols - 1, Math.floor((e.clientX - r.left) / z))),
    y: Math.max(0, Math.min(s.rows - 1, Math.floor((e.clientY - r.top) / z))),
  };
}

palette.addEventListener('pointerdown', (e) => {
  palette.setPointerCapture(e.pointerId);
  const c = paletteCell(e);
  state.paletteSel = { sheet: state.sheet, x0: c.x, y0: c.y, x1: c.x, y1: c.y, active: true };
  drawPalette();
});
palette.addEventListener('pointermove', (e) => {
  const sel = state.paletteSel;
  if (!sel?.active) return;
  const c = paletteCell(e);
  sel.x1 = c.x;
  sel.y1 = c.y;
  drawPalette();
});
palette.addEventListener('pointerup', () => {
  const sel = state.paletteSel;
  if (!sel?.active) return;
  sel.active = false;
  const s = sheetInfo(sel.sheet);
  const x0 = Math.min(sel.x0, sel.x1);
  const y0 = Math.min(sel.y0, sel.y1);
  const w = Math.abs(sel.x1 - sel.x0) + 1;
  const h = Math.abs(sel.y1 - sel.y0) + 1;
  const tiles = [];
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const index = (y0 + y) * s.cols + x0 + x;
      tiles.push(s.emptySet.has(index) ? null : { sheet: s.id, index });
    }
  }
  setStamp({ w, h, tiles });
  // Choisir dans la palette, c'est pour poser : retour au pinceau (sauf l'outil Zone, qui garde la sélection).
  if (state.tool !== 'rect') setTool('brush');
});

// Double-clic dans la palette (planche aux éléments connus) : tout l'élément sous la souris, sans les morceaux de ses
// voisins qui tombent dans son rectangle (une maison de 7 x 7 d'un seul geste).
palette.addEventListener('dblclick', (e) => {
  const s = sheetInfo(state.sheet);
  const known = elementsOf(s.id);
  const c = paletteCell(e);
  const id = known?.owner[c.y * s.cols + c.x];
  if (id === undefined || id < 0) return;
  const el = known.list[id];
  const w = el.x1 - el.x0 + 1;
  const h = el.y1 - el.y0 + 1;
  const tiles = [];
  for (let y = el.y0; y <= el.y1; y++) {
    for (let x = el.x0; x <= el.x1; x++) {
      const index = y * s.cols + x;
      tiles.push(known.owner[index] === id && !s.emptySet.has(index) ? { sheet: s.id, index } : null);
    }
  }
  state.paletteSel = { sheet: s.id, x0: el.x0, y0: el.y0, x1: el.x1, y1: el.y1 };
  drawPalette();
  setStamp({ w, h, tiles });
  if (state.tool !== 'rect') setTool('brush');
});

function setStamp(stamp) {
  state.stamp = stamp;
  const preview = $('stamp-preview');
  preview.width = stamp.w * TILE;
  preview.height = stamp.h * TILE;
  const ctx = preview.getContext('2d');
  ctx.imageSmoothingEnabled = false;
  stamp.tiles.forEach((t, i) => {
    if (!t) return;
    const c = colsOf(t.sheet);
    ctx.drawImage(state.images[t.sheet], (t.index % c) * TILE, Math.floor(t.index / c) * TILE, TILE, TILE,
      (i % stamp.w) * TILE, Math.floor(i / stamp.w) * TILE, TILE, TILE);
  });
  const scale = Math.min(96 / preview.width, 96 / preview.height, 4);
  preview.style.width = `${preview.width * scale}px`;
  preview.style.height = `${preview.height * scale}px`;
  $('stamp-info').textContent = `${stamp.w} × ${stamp.h} case${stamp.w * stamp.h > 1 ? 's' : ''} — `
    + `${sheetInfo(stamp.tiles.find(Boolean)?.sheet)?.name ?? ''}`;
}

// ---------- Carte : affichage ----------

const view = $('view');
const canvas = $('map');
const ctx = canvas.getContext('2d');
let frameRequested = false;

function requestDraw() {
  if (frameRequested) return;
  frameRequested = true;
  requestAnimationFrame(() => {
    frameRequested = false;
    draw();
  });
}

function fitCanvas() {
  const dpr = window.devicePixelRatio || 1;
  canvas.width = Math.round(view.clientWidth * dpr);
  canvas.height = Math.round(view.clientHeight * dpr);
  canvas.style.width = `${view.clientWidth}px`;
  canvas.style.height = `${view.clientHeight}px`;
  requestDraw();
}

// Taille d'une case à l'écran, en pixels CSS.
const cellSize = () => TILE * state.zoom;

function centerMap() {
  const m = state.map;
  // Zoom qui fait tenir toute la carte dans la vue.
  const fit = Math.min(view.clientWidth / (m.width * TILE), view.clientHeight / (m.height * TILE)) * 0.92;
  state.zoom = [...ZOOMS].reverse().find((z) => z <= fit) ?? ZOOMS[0];
  state.ox = Math.round((view.clientWidth - m.width * cellSize()) / 2);
  state.oy = Math.round((view.clientHeight - m.height * cellSize()) / 2);
  showZoom();
  requestDraw();
}

function showZoom() {
  $('zoom').textContent = `${Math.round(state.zoom * 100)} %`;
}

function zoomStep(dir) {
  const i = ZOOMS.indexOf(state.zoom);
  const r = canvas.getBoundingClientRect();
  zoomTo(ZOOMS[Math.max(0, Math.min(ZOOMS.length - 1, i + dir))], r.left + r.width / 2, r.top + r.height / 2);
}

function pan(dx, dy) {
  state.ox += dx;
  state.oy += dy;
  requestDraw();
}

// Le motif de la sélection, répété à partir de la case (ax, ay) : la case qui tombe en (x, y).
function stampAt(ax, ay, x, y) {
  const s = state.stamp;
  if (!s) return null;
  const dx = (((x - ax) % s.w) + s.w) % s.w;
  const dy = (((y - ay) % s.h) + s.h) % s.h;
  return s.tiles[dy * s.w + dx];
}

function draw() {
  if (!state.map) return;                    // pas encore de carte (premier affichage, rechargement à chaud)
  showAssistantZone();
  updateSelectionBar();
  const dpr = window.devicePixelRatio || 1;
  const m = state.map;
  const cs = cellSize();
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.setTransform(dpr, 0, 0, dpr, Math.round(state.ox * dpr), Math.round(state.oy * dpr));

  // Cases visibles seulement.
  const range = {
    x0: Math.max(0, Math.floor(-state.ox / cs)),
    y0: Math.max(0, Math.floor(-state.oy / cs)),
    x1: Math.min(m.width, Math.ceil((view.clientWidth - state.ox) / cs)),
    y1: Math.min(m.height, Math.ceil((view.clientHeight - state.oy) / cs)),
  };
  // Damier sous la carte (cases vides).
  ctx.fillStyle = '#2f3440';
  ctx.fillRect(range.x0 * cs, range.y0 * cs, (range.x1 - range.x0) * cs, (range.y1 - range.y0) * cs);
  ctx.fillStyle = '#383e4b';
  for (let y = range.y0; y < range.y1; y++) {
    for (let x = range.x0 + ((range.x0 + y) % 2); x < range.x1; x += 2) ctx.fillRect(x * cs, y * cs, cs, cs);
  }
  // Calques au-dessus du calque actif : un peu transparents, pour voir ce qu'on peint.
  const active = state.autoLayer ? LAYERS.length : LAYERS.findIndex((l) => l.id === state.layer);
  LAYERS.forEach((l, i) => {
    if (state.hidden.has(l.id)) return;
    ctx.globalAlpha = i > active ? 0.55 : 1;
    drawLayers(ctx, m, [l.id], state.images, colsOf, cs, range);
  });
  ctx.globalAlpha = 1;
  // Les bords cachés dans le jeu (bordure d'arbres : dernière rangée, colonnes des côtés ; MapScene.hiddenEdges) :
  // assombris ici.
  const edges = hiddenEdges(m);
  ctx.fillStyle = 'rgba(12, 14, 22, 0.55)';
  if (edges.bottom) ctx.fillRect(0, (m.height - 1) * cs, m.width * cs, cs);
  if (edges.left) ctx.fillRect(0, 0, cs, (m.height - edges.bottom) * cs);
  if (edges.right) ctx.fillRect((m.width - 1) * cs, 0, cs, (m.height - edges.bottom) * cs);

  // Collisions.
  if (state.showSolid || state.tool === 'solid') {
    ctx.fillStyle = 'rgba(232, 71, 63, 0.42)';
    for (let y = range.y0; y < range.y1; y++) {
      for (let x = range.x0; x < range.x1; x++) if (m.solid[y * m.width + x]) ctx.fillRect(x * cs, y * cs, cs, cs);
    }
  }

  // Grille.
  if (state.grid && cs >= 8) {
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.09)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let x = range.x0; x <= range.x1; x++) { ctx.moveTo(x * cs + 0.5, range.y0 * cs); ctx.lineTo(x * cs + 0.5, range.y1 * cs); }
    for (let y = range.y0; y <= range.y1; y++) { ctx.moveTo(range.x0 * cs, y * cs + 0.5); ctx.lineTo(range.x1 * cs, y * cs + 0.5); }
    ctx.stroke();
  }
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.35)';
  ctx.strokeRect(-0.5, -0.5, m.width * cs + 1, m.height * cs + 1);

  // Départ de Pierre.
  const sp = m.spawn;
  ctx.fillStyle = '#e8473f';
  ctx.beginPath();
  ctx.arc((sp.x + 0.5) * cs, (sp.y + 0.5) * cs, cs * 0.32, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#fff';
  ctx.font = `600 ${Math.max(9, cs * 0.4)}px system-ui`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('P', (sp.x + 0.5) * cs, (sp.y + 0.53) * cs);

  npcs.draw(ctx, cs);
  drawCursor(cs);
  if (state.mode === 'simple') studio.drawGhost(ctx, cs);
}

const hoverObject = { key: null, cells: null };

// Aperçu de l'outil sous la souris (et de la zone en cours de tracé).
function drawCursor(cs) {
  const h = state.hover;
  const drag = state.drag;
  if (drag?.tool === 'rect' && state.mode === 'simple') {
    const r = rectOf(drag.start, drag.last);
    outline(r.x0, r.y0, r.x1 - r.x0 + 1, r.y1 - r.y0 + 1, cs);
    return;
  }
  if (drag?.tool === 'rect') {
    const r = rectOf(drag.start, drag.last);
    ctx.globalAlpha = 0.7;
    for (let y = r.y0; y <= r.y1; y++) for (let x = r.x0; x <= r.x1; x++) drawStampTile(stampAt(r.x0, r.y0, x, y), x, y, cs);
    ctx.globalAlpha = 1;
    outline(r.x0, r.y0, r.x1 - r.x0 + 1, r.y1 - r.y0 + 1, cs);
    return;
  }
  if (drag?.tool === 'select') {
    const r = rectOf(drag.start, drag.last);
    outline(r.x0, r.y0, r.x1 - r.x0 + 1, r.y1 - r.y0 + 1, cs);
    return;
  }
  if (drag?.tool === 'move') {
    // L'élément suit la souris (il est retiré de la carte pendant le glissé).
    if (drag.deleted || !inside(drag.last.x, drag.last.y)) return;   // lâché ici, il serait supprimé : on ne le montre plus
    const { dx, dy } = clampShift(drag.bounds, drag.last.x - drag.start.x, drag.last.y - drag.start.y);
    ctx.globalAlpha = 0.85;
    for (const l of OBJECT_LAYERS) {
      for (const c of drag.cells) for (const r of c.refs[l]) drawStampTile(decodeRef(state.map, r), c.x + dx, c.y + dy, cs);
    }
    ctx.globalAlpha = 1;
    const b = drag.bounds;
    outline(b.x0 + dx, b.y0 + dy, b.x1 - b.x0 + 1, b.y1 - b.y0 + 1, cs);
    return;
  }
  if (state.tool === 'move' && state.pasting && h && state.clipboard) {
    const clip = state.clipboard;
    ctx.globalAlpha = 0.75;
    for (const c of clip.cells) {
      for (const l of OBJECT_LAYERS) for (const t of c.tiles[l]) drawStampTile(t, h.x + c.dx, h.y + c.dy, cs);
    }
    ctx.globalAlpha = 1;
    outline(h.x, h.y, clip.w, clip.h, cs);
    return;
  }
  if (state.moveSel) {                       // la zone choisie : celle de l'outil Déplacer et de l'assistant
    const r = state.moveSel;
    outline(r.x0, r.y0, r.x1 - r.x0 + 1, r.y1 - r.y0 + 1, cs);
  }
  if (state.tool === 'move' && state.lastMoved?.length) {
    const b = boundsOf(state.lastMoved);
    outline(b.x0, b.y0, b.x1 - b.x0 + 1, b.y1 - b.y0 + 1, cs);
  }
  if (!h) return;
  if (state.tool === 'move') {
    // Au survol : l'élément qui sera pris (gardé tant que la souris reste sur la même case et que la carte ne change pas).
    const key = `${h.x},${h.y},${[...state.hidden]}`;
    if (hoverObject.key !== key) Object.assign(hoverObject, { key, cells: objectAt(h.x, h.y) });
    const { cells } = hoverObject;
    if (cells?.length && (cells.length <= MAX_OBJECT_CELLS || cells.element)) {
      const b = boundsOf(cells);
      outline(b.x0, b.y0, b.x1 - b.x0 + 1, b.y1 - b.y0 + 1, cs);
    } else if (!state.moveSel) outline(h.x, h.y, 1, 1, cs);
    return;
  }
  if (state.mode === 'simple' && drag?.tool === 'rect') return;
  if (state.mode === 'simple' && ['brush', 'erase'].includes(state.tool)) {
    const cells = studio.brushCells(h.x, h.y);
    const b = cells.reduce((r, [x, y]) => ({ x0: Math.min(r.x0, x), y0: Math.min(r.y0, y), x1: Math.max(r.x1, x), y1: Math.max(r.y1, y) }),
      { x0: Infinity, y0: Infinity, x1: -Infinity, y1: -Infinity });
    if (cells.length) outline(b.x0, b.y0, b.x1 - b.x0 + 1, b.y1 - b.y0 + 1, cs);
    return;
  }
  if (state.mode === 'simple' && state.tool === 'place') return;
  if (state.tool === 'erase') {
    const { x0, y0, n } = eraseSquare(h.x, h.y);
    outline(x0, y0, n, n, cs);
    return;
  }
  if (state.tool === 'brush' && state.stamp) {
    const { w, h: sh } = state.stamp;
    ctx.globalAlpha = 0.7;
    for (let y = 0; y < sh; y++) for (let x = 0; x < w; x++) drawStampTile(state.stamp.tiles[y * w + x], h.x + x, h.y + y, cs);
    ctx.globalAlpha = 1;
    outline(h.x, h.y, w, sh, cs);
  } else {
    outline(h.x, h.y, 1, 1, cs);
  }
}

function drawStampTile(t, x, y, cs) {
  const m = state.map;
  if (!t || x < 0 || y < 0 || x >= m.width || y >= m.height) return;
  const c = colsOf(t.sheet);
  ctx.drawImage(state.images[t.sheet], (t.index % c) * TILE, Math.floor(t.index / c) * TILE, TILE, TILE, x * cs, y * cs, cs, cs);
}

function outline(x, y, w, h, cs) {
  ctx.lineWidth = 2;
  ctx.strokeStyle = '#fff';
  ctx.strokeRect(x * cs, y * cs, w * cs, h * cs);
  ctx.strokeStyle = '#e8473f';
  ctx.lineWidth = 1;
  ctx.strokeRect(x * cs + 2, y * cs + 2, w * cs - 4, h * cs - 4);
}

// ---------- Carte : édition ----------

const inside = (x, y) => x >= 0 && y >= 0 && x < state.map.width && y < state.map.height;
const rectOf = (a, b) => ({ x0: Math.min(a.x, b.x), y0: Math.min(a.y, b.y), x1: Math.max(a.x, b.x), y1: Math.max(a.y, b.y) });

function snapshot() {
  const m = state.map;
  return JSON.stringify({ layers: m.layers, solid: m.solid, spawn: m.spawn, sheets: m.sheets, width: m.width, height: m.height,
    studio: m.studio ?? null, npcEdits: m.npcEdits ?? null });
}
function remember() {
  state.undo.push(snapshot());
  if (state.undo.length > HISTORY) state.undo.shift();
  state.redo = [];
  updateHistoryButtons();
}
// Retire le dernier pas d'historique (une commande de l'assistant qui n'a rien changé).
function forget() {
  state.undo.pop();
  updateHistoryButtons();
}
function restore(from, to) {
  state.moveSel = null;
  state.lastMoved = null;
  if (!from.length) return;
  to.push(snapshot());
  Object.assign(state.map, JSON.parse(from.pop()));
  syncFields();
  studio.render();
  changed();
  updateHistoryButtons();
}
function updateHistoryButtons() {
  $('undo').disabled = !state.undo.length;
  $('redo').disabled = !state.redo.length;
}

// Pose une case en (x, y), là où placementOf la range. Une case opaque remplace ce qu'il y avait ; une case
// transparente (un objet) se superpose (pile de 4 au plus). Collisions : celles de placementOf (un sol ne libère
// pas une case qui porte encore un objet).
function putTile(x, y, tile, placement) {
  if (!inside(x, y) || !tile) return;
  const m = state.map;
  const i = y * m.width + x;
  const { layer, solid } = placement;
  const cells = m.layers[layer];
  const ref = refOf(m, tile.sheet, tile.index);
  const stack = stackOf(cells[i]);
  if (isOpaque(tile) || !stack.length) cells[i] = ref;
  else if (stack[stack.length - 1] !== ref) {
    cells[i] = cellOf([...stack, ref]);
  }
  if (solid === 1) m.solid[i] = 1;
  else if (solid === 0 && (layer !== 'sol' || !stackOf(m.layers.decor[i]).length)) m.solid[i] = 0;
}

// Enlève la case du dessus : sur le calque actif, ou (calque auto) sur le calque le plus haut qui a quelque chose.
function eraseTile(x, y) {
  if (!inside(x, y)) return;
  const m = state.map;
  const i = y * m.width + x;
  const order = state.autoLayer ? ['dessus', 'decor', 'sol'] : [state.layer];
  const layer = order.find((id) => !state.hidden.has(id) && stackOf(m.layers[id][i]).length);
  if (!layer) return;
  const stack = stackOf(m.layers[layer][i]).slice(0, -1);
  m.layers[layer][i] = cellOf(stack);
  if (layer === 'decor' && !stack.length) m.solid[i] = groundBlocks(i) ? 1 : 0;   // un bateau ôté : l'eau bloque encore
}

// ---------- Déplacer un élément ----------
// Un élément = ce qu'on voit d'un seul tenant sur la carte (Décor et Au-dessus de Pierre) : à partir de la case cliquée,
// on suit les pixels pleins qui se touchent, d'une case à l'autre ; s'y ajoutent les cases posées avec elles (même
// planche, même « ancre » : position sur la carte moins position sur la planche), comme une ombre détachée. Dans une
// case, seules les couches qui touchent l'élément sont prises (une fleur sous un arbre reste en place).
// Le calque Sol compte aussi pour les objets qui y ont été posés (un ponton, une éolienne de la bibliothèque), pas
// pour le vrai sol (herbe, chemins, eau).
const OBJECT_LAYERS = ['sol', 'decor', 'dessus'];
const MAX_OBJECT_CELLS = 80;                 // au-delà, l'outil Déplacer trace une zone au lieu de prendre l'objet
const GROUND_KINDS = new Set(['sols', 'int-sols', 'eau', 'herbes']);

// Case d'objet (et non de sol) ? Sur le calque Sol : seulement un élément connu d'un type « objet ».
function isObjectRef(l, ref) {
  if (l !== 'sol') return true;
  const tile = decodeRef(state.map, ref);
  const known = tile && elementsOf(tile.sheet);
  if (!known) return false;
  const kind = known.list[known.owner[tile.index]]?.kind ?? sheetInfo(tile.sheet).category;
  return Boolean(kind) && !GROUND_KINDS.has(kind);
}

// Planches rangées sans ordre spatial (cases assemblées, recolorées, catalogue du mode simple, transitions) : deux
// cases voisines dans la planche ne sont pas posées ensemble ; leur « ancre » regrouperait des objets sans rapport.
const PACKED_SHEETS = new Set(['auto', 'catalogue', 'transitions']);

function anchorKey(x, y, ref) {
  const tile = decodeRef(state.map, ref);
  if (!tile || PACKED_SHEETS.has(tile.sheet)) return null;
  const cols = colsOf(tile.sheet);
  return `${tile.sheet}@${x - (tile.index % cols)},${y - Math.floor(tile.index / cols)}`;
}

// Pixels pleins d'une case de planche (16 x 16), ou null si la planche n'est pas encore chargée.
function tilePixels(ref) {
  const tile = decodeRef(state.map, ref);
  if (!tile || !state.images[tile.sheet]) return null;
  const px = tileStats(tile.sheet).solidPx;
  return px.subarray(tile.index * TILE * TILE, (tile.index + 1) * TILE * TILE);
}

// L'élément sous (x, y) : [{ x, y, refs: { decor: [...], dessus: [...] } }], ou null.
// `repair` : au clic (pas au survol), la fiche d'un élément reconnu à son dessin est réparée.
function objectAt(x, y, repair = false) {
  const m = state.map;
  if (!inside(x, y)) return null;
  // Un élément posé en mode simple : exactement ses cases (même collé à un autre objet).
  const placed = studio.elementCellsAt(x, y, repair);
  if (placed) return placed;
  const layers = OBJECT_LAYERS.filter((l) => !state.hidden.has(l));
  const atCache = new Map();
  let at = (cx, cy) => {
    const i = cy * m.width + cx;
    if (!atCache.has(i)) {
      atCache.set(i, layers.flatMap((l) => stackOf(m.layers[l][i]).filter((ref) => isObjectRef(l, ref))
        .map((ref) => ({ l, ref, px: tilePixels(ref) }))));
    }
    return atCache.get(i);
  };
  if (!at(x, y).length) return null;
  // Un objet ne déborde pas sur la forêt qui le touche (une maison collée à la bordure d'arbres), sauf si c'est la
  // forêt qu'on prend.
  const forestSeed = assistant.isForestRef(at(x, y).at(-1).ref);
  if (!forestSeed) {
    for (const [i, list] of atCache) atCache.set(i, list.filter((e) => !assistant.isForestRef(e.ref)));
    const baseAt = at;
    at = (cx, cy) => baseAt(cx, cy).filter((e) => !assistant.isForestRef(e.ref));
  }
  if (!at(x, y).length) return null;
  const W = m.width * TILE;
  const taken = new Map();                         // « x,y,calque,ref » -> { x, y, l, ref }
  const visited = new Set();                      // pixels vus (un objet n'en touche que quelques milliers)
  const keys = new Set();
  const pixels = [];
  const box = { x0: x, y0: y, x1: x, y1: y };
  // Prendre une couche : ses pixels pleins deviennent des points de départ du parcours.
  const take = (cx, cy, l, ref) => {
    const id = `${cx},${cy},${l},${ref}`;
    if (taken.has(id)) return;
    taken.set(id, { x: cx, y: cy, l, ref });
    const anchor = anchorKey(cx, cy, ref);
    if (anchor) keys.add(anchor);
    Object.assign(box, { x0: Math.min(box.x0, cx), y0: Math.min(box.y0, cy), x1: Math.max(box.x1, cx), y1: Math.max(box.y1, cy) });
    const px = at(cx, cy).find((e) => e.l === l && e.ref === ref)?.px;
    if (px) for (let k = 0; k < TILE * TILE; k++) if (px[k]) pixels.push((cy * TILE + (k >> 4)) * W + cx * TILE + (k & 15));
  };
  // Pixel plein (sur une couche quelconque) en (px, py) ? Les couches qui le couvrent sont prises.
  const fillPixel = (p) => {
    const px = p % W;
    const py = (p - px) / W;
    const cx = px >> 4;
    const cy = py >> 4;
    let full = false;
    const k = (py & 15) * TILE + (px & 15);
    for (const e of at(cx, cy)) {
      if (e.px && e.px[k] && joinable(cx, cy, e)) {
        full = true;
        if (!e.taken) {
          e.taken = true;
          take(cx, cy, e.l, e.ref);
        }
      }
    }
    return full;
  };
  const top = at(x, y).at(-1);
  // Les pixels qui se touchent ne relient que les cases d'un même objet : celles posées avec lui (même ancre dans une
  // planche ordinaire) ; une case d'une planche rangée sans ordre (cases recolorées…) seulement si l'objet en est fait.
  // Deux objets collés (une boîte aux lettres contre une maison) restent distincts.
  const seedPacked = !anchorKey(x, y, top.ref);
  const joinable = (cx, cy, e) => {
    const anchor = anchorKey(cx, cy, e.ref);
    return anchor ? keys.has(anchor) : seedPacked;
  };
  take(x, y, top.l, top.ref);
  let grew = true;
  while (grew) {
    grew = false;
    // Parcours des pixels pleins qui se touchent.
    while (pixels.length) {
      const p = pixels.pop();
      if (visited.has(p)) continue;
      visited.add(p);
      if (!fillPixel(p)) continue;
      const px = p % W;
      if (px > 0) pixels.push(p - 1);
      if (px < W - 1) pixels.push(p + 1);
      if (p >= W) pixels.push(p - W);
      if (p + W < W * m.height * TILE) pixels.push(p + W);
    }
    // Couches posées avec celles déjà prises (même ancre) : ombres, morceaux détachés, tout près de l'élément.
    for (let cy = Math.max(0, box.y0 - 4); cy <= Math.min(m.height - 1, box.y1 + 4); cy++) {
      for (let cx = Math.max(0, box.x0 - 4); cx <= Math.min(m.width - 1, box.x1 + 4); cx++) {
        for (const { l, ref } of at(cx, cy)) {
          const anchor = anchorKey(cx, cy, ref);
          if (anchor && !taken.has(`${cx},${cy},${l},${ref}`) && keys.has(anchor)) {
            take(cx, cy, l, ref);
            grew = true;
          }
        }
      }
    }
  }
  const cells = new Map();
  for (const { x: cx, y: cy, l, ref } of taken.values()) {
    const key = `${cx},${cy}`;
    if (!cells.has(key)) cells.set(key, { x: cx, y: cy, refs: { sol: [], decor: [], dessus: [] } });
    cells.get(key).refs[l].push(ref);
  }
  return [...cells.values()];
}

// Tous les objets (Décor, Au-dessus de Pierre) d'un rectangle.
function objectsIn(r) {
  const m = state.map;
  const cells = [];
  for (let y = r.y0; y <= r.y1; y++) {
    for (let x = r.x0; x <= r.x1; x++) {
      const refs = {};
      for (const l of OBJECT_LAYERS) {
        refs[l] = state.hidden.has(l) ? [] : stackOf(m.layers[l][y * m.width + x]).filter((ref) => isObjectRef(l, ref));
      }
      if (OBJECT_LAYERS.some((l) => refs[l].length)) cells.push({ x, y, refs });
    }
  }
  return cells;
}

const boundsOf = (cells) => cells.reduce((b, c) => ({ x0: Math.min(b.x0, c.x), y0: Math.min(b.y0, c.y),
  x1: Math.max(b.x1, c.x), y1: Math.max(b.y1, c.y) }), { x0: Infinity, y0: Infinity, x1: -Infinity, y1: -Infinity });

// Le sol de la case bloque-t-il à lui seul (eau) ?
function groundBlocks(i) {
  const tile = decodeRef(state.map, topRef(state.map.layers.sol[i]));
  if (!tile) return false;
  if (elementsOf(tile.sheet)) return placementOf(tile).solid === 1;
  const row = Math.floor(tile.index / colsOf(tile.sheet));
  return tile.sheet === 'dppt' && row >= 5 && row < 17;          // eau de la planche DPPt
}

const setStack = (cells, i, stack) => { cells[i] = cellOf(stack); };

// Enlève l'élément de la carte (gardé avec ses collisions, pour le reposer).
function liftObject(cells) {
  const m = state.map;
  return cells.map((c) => {
    const i = c.y * m.width + c.x;
    for (const l of OBJECT_LAYERS) {
      const stack = [...stackOf(m.layers[l][i])];
      for (const r of c.refs[l]) {
        const k = stack.lastIndexOf(r);
        if (k >= 0) stack.splice(k, 1);                 // une réf absente (pile déjà tronquée) : rien à retirer
      }
      setStack(m.layers[l], i, stack);
    }
    if (c.refs.sol.length && !stackOf(m.layers.sol[i]).length) m.layers.sol[i] = groundAround(c.x, c.y, cells);
    const holds = c.refs.decor.length || c.refs.sol.length;
    const solid = holds ? m.solid[i] : null;
    if (holds && !stackOf(m.layers.decor[i]).length) m.solid[i] = groundBlocks(i) ? 1 : 0;
    return { ...c, solid };
  });
}

// Sol à remettre sous un objet qui remplaçait le sol (un ponton sur l'eau) : le sol le plus fréquent autour.
function groundAround(x, y, cells) {
  const m = state.map;
  const own = new Set(cells.map((c) => c.y * m.width + c.x));
  const count = new Map();
  for (let r = 1; r <= 3 && !count.size; r++) {
    for (let dy = -r; dy <= r; dy++) {
      for (let dx = -r; dx <= r; dx++) {
        const nx = x + dx;
        const ny = y + dy;
        const ni = ny * m.width + nx;
        if (!inside(nx, ny) || own.has(ni)) continue;
        const ground = stackOf(m.layers.sol[ni]).find((ref) => !isObjectRef('sol', ref));
        if (ground !== undefined) count.set(ground, (count.get(ground) ?? 0) + 1);
      }
    }
  }
  return count.size ? [...count].sort((a, b) => b[1] - a[1])[0][0] : EMPTY;
}

// Repose l'élément décalé de (dx, dy), par-dessus ce qui est déjà là ; il garde ses collisions (un pont reste
// franchissable, un tronc bloquant).
function dropObject(cells, dx, dy) {
  const m = state.map;
  for (const c of cells) {
    const x = c.x + dx;
    const y = c.y + dy;
    if (!inside(x, y)) continue;
    const i = y * m.width + x;
    for (const l of OBJECT_LAYERS) if (c.refs[l].length) setStack(m.layers[l], i, [...stackOf(m.layers[l][i]), ...c.refs[l]]);
    if (c.solid === 1) m.solid[i] = 1;
    else if (c.solid === 0 && [...c.refs.sol, ...c.refs.decor].some((r) => {
      const t = decodeRef(m, r);
      return elementsOf(t.sheet) && placementOf(t).solid === 0;
    })) m.solid[i] = 0;
  }
}

// Suppr / ⌫ avec l'outil Déplacer : l'élément qu'on glisse, celui qu'on vient de lâcher, la zone choisie, ou sinon
// l'élément sous la souris. Ses collisions partent avec lui (l'eau reste bloquante).
function deleteObject() {
  if (state.tool !== 'move') return false;
  const drag = state.drag;
  if (drag?.tool === 'move') {
    drag.deleted = true;
    requestDraw();
    return true;
  }
  const cells = state.lastMoved ?? (state.moveSel ? objectsIn(state.moveSel) : state.hover && objectAt(state.hover.x, state.hover.y));
  if (!cells?.length) return false;
  remember();
  liftObject(cells);
  state.lastMoved = null;
  state.moveSel = null;
  hoverObject.key = null;
  changed();
  setStatus('Élément supprimé');
  return true;
}

// ---------- Copier, coller, dupliquer ----------
// Une zone choisie (outil Déplacer) est copiée en entier : ses trois calques et ses collisions, qui remplacent ceux
// des cases où on la pose. Un élément (celui qu'on vient de déplacer, ou celui sous la souris) est copié seul, sans
// le sol dessous : il se pose par-dessus ce qui est là, avec ses collisions.
function selectionCells() {
  const m = state.map;
  if (state.moveSel) {
    const r = state.moveSel;
    const cells = [];
    for (let y = r.y0; y <= r.y1; y++) {
      for (let x = r.x0; x <= r.x1; x++) {
        const i = y * m.width + x;
        cells.push({ x, y, refs: Object.fromEntries(OBJECT_LAYERS.map((l) => [l, [...stackOf(m.layers[l][i])]])), solid: m.solid[i] });
      }
    }
    return { cells, whole: true };
  }
  const cells = state.lastMoved ?? (state.hover && objectAt(state.hover.x, state.hover.y));
  if (!cells?.length) return null;
  return { cells: cells.map((c) => ({ ...c, solid: m.solid[c.y * m.width + c.x] })), whole: false };
}

function copySelection() {
  const sel = selectionCells();
  if (!sel) return false;
  const b = boundsOf(sel.cells);
  state.clipboard = {
    whole: sel.whole, w: b.x1 - b.x0 + 1, h: b.y1 - b.y0 + 1,
    // Cases notées par planche et numéro (pas par leur référence dans la carte) : on peut coller dans une autre carte.
    cells: sel.cells.map((c) => ({
      dx: c.x - b.x0, dy: c.y - b.y0, solid: c.solid,
      tiles: Object.fromEntries(OBJECT_LAYERS.map((l) => [l, c.refs[l].map((r) => decodeRef(state.map, r)).filter(Boolean)])),
    })),
  };
  setStatus(`Copié : ${state.clipboard.w} × ${state.clipboard.h} cases`, 'ok');
  return true;
}

// Mode « coller » : la copie suit la souris (son coin haut-gauche sur la case survolée), chaque clic en pose une.
function startPasting() {
  if (!state.clipboard) return false;
  setTool('move');
  state.pasting = true;
  state.moveSel = null;
  state.lastMoved = null;
  setStatus('Clic : poser la copie (autant de fois qu\'on veut) · Échap : arrêter');
  requestDraw();
  return true;
}

function stopPasting() {
  if (!state.pasting) return;
  state.pasting = false;
  setStatus('');
  requestDraw();
}

function pasteAt(x0, y0) {
  const clip = state.clipboard;
  const m = state.map;
  remember();
  for (const c of clip.cells) {
    const x = x0 + c.dx;
    const y = y0 + c.dy;
    if (!inside(x, y)) continue;
    const i = y * m.width + x;
    for (const l of OBJECT_LAYERS) {
      const refs = c.tiles[l].map((t) => refOf(m, t.sheet, t.index));
      if (clip.whole) setStack(m.layers[l], i, refs);
      else if (refs.length) setStack(m.layers[l], i, [...stackOf(m.layers[l][i]), ...refs]);
    }
    if (clip.whole || c.solid === 1) m.solid[i] = c.solid;
  }
  hoverObject.key = null;
  changed();
}

function duplicateSelection() {
  return copySelection() && startPasting();
}

function updateSelectionBar() {
  const show = state.tool === 'move' && !state.pasting && Boolean(state.moveSel || state.lastMoved?.length);
  if ($('selbar').hidden === show) $('selbar').hidden = !show;     // le DOM seulement s'il change
}

// Décalage de déplacement, l'élément restant entièrement dans la carte.
function clampShift(b, dx, dy) {
  const m = state.map;
  return { dx: Math.max(-b.x0, Math.min(m.width - 1 - b.x1, dx)), dy: Math.max(-b.y0, Math.min(m.height - 1 - b.y1, dy)) };
}

// Pinceau : la sélection posée à partir de (x, y) ; pendant un glissé, calée sur la grille du premier coup
// (une sélection de 2 x 2 se répète proprement, sans se chevaucher).
function brushAt(x, y, anchor) {
  const s = state.stamp;
  if (!s) return;
  const bx = anchor.x + Math.floor((x - anchor.x) / s.w) * s.w;
  const by = anchor.y + Math.floor((y - anchor.y) / s.h) * s.h;
  for (let dy = 0; dy < s.h; dy++) {
    for (let dx = 0; dx < s.w; dx++) {
      const t = s.tiles[dy * s.w + dx];
      if (t) putTile(bx + dx, by + dy, t, placementOf(t, s, dy));
    }
  }
}

// Pot de peinture : toutes les cases reliées qui ont la même case que celle cliquée, sur le calque actif.
function floodFill(x, y) {
  const m = state.map;
  const s = state.stamp;
  const last = s ? s.tiles.findLastIndex(Boolean) : -1;
  const layer = last >= 0 ? placementOf(s.tiles[last], s, Math.floor(last / s.w)).layer : state.layer;
  const cells = m.layers[layer];
  const key = (cell) => JSON.stringify(cell ?? EMPTY);
  const target = key(cells[y * m.width + x]);
  const seen = new Uint8Array(m.width * m.height);
  const stack = [[x, y]];
  while (stack.length) {
    const [cx, cy] = stack.pop();
    if (!inside(cx, cy) || seen[cy * m.width + cx] || key(cells[cy * m.width + cx]) !== target) continue;
    seen[cy * m.width + cx] = 1;
    const t = stampAt(x, y, cx, cy);
    if (t) putTile(cx, cy, t, placementOf(t, s, (((cy - y) % s.h) + s.h) % s.h));
    stack.push([cx + 1, cy], [cx - 1, cy], [cx, cy + 1], [cx, cy - 1]);
  }
}

function pickAt(x, y) {
  const m = state.map;
  // La case visible la plus haute (calque auto), sinon celle du calque actif d'abord.
  const top = LAYERS.map((l) => l.id).reverse();
  const order = state.autoLayer ? top : [state.layer, ...top];
  for (const id of order) {
    const tile = decodeRef(m, m.layers[id][y * m.width + x]);
    if (!tile) continue;
    if (!state.autoLayer) setLayer(id);
    setStamp({ w: 1, h: 1, tiles: [tile] });
    showSheet(tile.sheet);
    const c = colsOf(tile.sheet);
    state.paletteSel = { sheet: tile.sheet, x0: tile.index % c, y0: Math.floor(tile.index / c), x1: tile.index % c, y1: Math.floor(tile.index / c) };
    drawPalette();
    scrollPaletteTo(Math.floor(tile.index / c));
    setTool('brush');
    return;
  }
}

function scrollPaletteTo(row) {
  const wrap = $('palette-wrap');
  const y = row * palette.getBoundingClientRect().height / sheetInfo(state.sheet).rows;
  if (y < wrap.scrollTop || y > wrap.scrollTop + wrap.clientHeight - 40) wrap.scrollTop = y - wrap.clientHeight / 3;
}

function cellAt(e) {
  const r = canvas.getBoundingClientRect();
  const cs = cellSize();
  return { x: Math.floor((e.clientX - r.left - state.ox) / cs), y: Math.floor((e.clientY - r.top - state.oy) / cs) };
}

let spaceDown = false;

canvas.addEventListener('contextmenu', (e) => e.preventDefault());
canvas.addEventListener('pointerdown', (e) => {
  canvas.setPointerCapture(e.pointerId);
  const c = cellAt(e);
  // Déplacer la vue : clic droit, clic molette, ou Espace + clic.
  if (e.button === 1 || e.button === 2 || spaceDown) {
    state.drag = { tool: 'pan', x: e.clientX, y: e.clientY, ox: state.ox, oy: state.oy };
    view.classList.add('pan');
    return;
  }
  if (e.button !== 0) return;
  const tool = state.tool;
  if (tool === 'npc') {                       // PNJ : choisir, glisser, poser un figurant (src/builder/npcs.js)
    npcs.pointerDown(c);
    requestDraw();
    return;
  }
  if (state.mode === 'simple' && tool === 'place') {
    studio.clickPlace().then((r) => { if (r) setStatus(r.text, r.kind); requestDraw(); });
    return;
  }
  if (state.mode === 'simple' && ['brush', 'rect', 'fill', 'erase'].includes(tool)) {
    if (!inside(c.x, c.y)) return;
    remember();
    studio.beginStroke();
    state.drag = { tool, start: c, last: c, simple: true };
    if (tool === 'brush') studio.paintAt(c.x, c.y);
    if (tool === 'fill') studio.fillFrom(c.x, c.y);
    if (tool === 'erase') {
      const el = studio.eraseAt(c.x, c.y);
      if (el) { state.drag.removed = el; setStatus('Élément retiré', 'ok'); }
    }
    requestDraw();
    return;
  }
  if (tool === 'pick') {
    if (inside(c.x, c.y)) pickAt(c.x, c.y);
    return;
  }
  if (tool === 'move' && state.pasting) {
    if (inside(c.x, c.y)) pasteAt(c.x, c.y);
    return;
  }
  state.lastMoved = null;
  if (tool === 'move') {
    // Dans la zone sélectionnée : on la déplace ; sur un élément : on le prend ; ailleurs : on trace une zone.
    const sel = state.moveSel;
    const inSel = sel && c.x >= sel.x0 && c.x <= sel.x1 && c.y >= sel.y0 && c.y <= sel.y1;
    // Maj : toujours tracer une zone, même en partant d'un objet.
    let cells = inSel ? objectsIn(sel) : e.shiftKey ? null : objectAt(c.x, c.y, true);
    // Un « objet » démesuré (des objets collés les uns aux autres) : on trace une zone plutôt que de tout emporter.
    if (!inSel && cells?.length > MAX_OBJECT_CELLS && !cells.element) cells = null;
    if (cells?.length) {
      remember();
      // Alt : on en pose une copie (l'original reste en place, avec ses collisions).
      const lifted = e.altKey ? cells.map((cell) => ({ ...cell, solid: state.map.solid[cell.y * state.map.width + cell.x] }))
        : liftObject(cells);
      state.drag = { tool: 'move', start: c, last: c, cells: lifted, bounds: boundsOf(lifted), sel: inSel ? sel : null,
        copy: e.altKey };
    } else {
      state.moveSel = null;
      state.drag = { tool: 'select', start: c, last: c };
    }
    requestDraw();
    return;
  }
  remember();
  state.drag = { tool, start: c, last: c, solidValue: null };
  applyAt(c, e);
});
canvas.addEventListener('pointermove', (e) => {
  const drag = state.drag;
  if (drag?.tool === 'pan') {
    state.ox = drag.ox + e.clientX - drag.x;
    state.oy = drag.oy + e.clientY - drag.y;
    requestDraw();
    return;
  }
  const c = cellAt(e);
  if (npcs.pointerMove(c)) {
    state.hover = inside(c.x, c.y) ? c : null;
    $('coords').textContent = state.hover ? `x ${c.x}, y ${c.y}` : '—';
    return;
  }
  const moved = !state.hover || state.hover.x !== c.x || state.hover.y !== c.y;
  state.hover = inside(c.x, c.y) ? c : null;
  $('coords').textContent = state.hover ? `x ${c.x}, y ${c.y}` : '—';
  if (moved) {
    const i = c.y * state.map.width + c.x;
    const parts = state.hover ? LAYERS.map((l) => {
      const stack = stackOf(state.map.layers[l.id][i]);
      if (!stack.length) return null;
      const tile = decodeRef(state.map, topRef(stack));
      return `${l.name} : ${sheetInfo(tile.sheet)?.name ?? tile.sheet} n° ${tile.index}${stack.length > 1 ? ` (+${stack.length - 1})` : ''}`;
    }).filter(Boolean) : [];
    if (state.hover && state.map.solid[i]) parts.push('bloquée');
    if (state.hover) {
      const e = hiddenEdges(state.map);
      if ((e.bottom && c.y === state.map.height - 1) || (e.left && c.x === 0) || (e.right && c.x === state.map.width - 1)) {
        parts.push('bord caché dans le jeu');
      }
    }
    $('tile-info').textContent = state.hover ? parts.join(' · ') || 'vide' : '';
  }
  if (state.mode === 'simple' && state.tool === 'place' && moved && state.hover) studio.hover(c.x, c.y);
  if (drag && moved) {
    // Tracé continu : on remplit les cases sautées entre deux mouvements de souris.
    const steps = Math.max(Math.abs(c.x - drag.last.x), Math.abs(c.y - drag.last.y));
    for (let i = 1; i <= steps; i++) {
      const p = { x: Math.round(drag.last.x + ((c.x - drag.last.x) * i) / steps), y: Math.round(drag.last.y + ((c.y - drag.last.y) * i) / steps) };
      if (!['rect', 'move', 'select'].includes(drag.tool)) applyAt(p, e);
    }
    drag.last = c;
  }
  if (moved || drag) requestDraw();
});
canvas.addEventListener('pointerleave', () => {
  state.hover = null;
  requestDraw();
});
const endDrag = () => {
  if (npcs.dragging()) {
    npcs.pointerUp();
    return;
  }
  const drag = state.drag;
  state.drag = null;
  view.classList.remove('pan');
  if (!drag || drag.tool === 'pan') return;
  if (drag.simple) {
    if (drag.tool === 'rect') studio.paintRect(rectOf(drag.start, drag.last));
    studio.endStroke();
    if (state.undo.at(-1) === snapshot()) {
      state.undo.pop();
      updateHistoryButtons();
    } else changed();
    requestDraw();
    return;
  }
  if (drag.tool === 'select') {
    const r = rectOf(drag.start, drag.last);
    state.moveSel = inside(r.x0, r.y0) || inside(r.x1, r.y1) ? {
      x0: Math.max(0, r.x0), y0: Math.max(0, r.y0),
      x1: Math.min(state.map.width - 1, r.x1), y1: Math.min(state.map.height - 1, r.y1) } : null;
    requestDraw();
    return;
  }
  if (drag.tool === 'move') {
    // Lâché hors de la carte (ou Suppr pendant le glissé) : l'élément est supprimé (il a déjà été retiré).
    if (drag.deleted || !inside(drag.last.x, drag.last.y)) {
      if (drag.copy) state.undo.pop();          // une copie jetée : rien n'a changé
      else {
        state.moveSel = null;
        changed();
        setStatus(drag.cells.length ? 'Élément supprimé' : '');
      }
      updateHistoryButtons();
      requestDraw();
      return;
    }
    const { dx, dy } = clampShift(drag.bounds, drag.last.x - drag.start.x, drag.last.y - drag.start.y);
    if (!drag.copy || dx || dy) dropObject(drag.cells, dx, dy);       // copie lâchée sur place : rien à poser
    if (drag.sel) state.moveSel = { x0: drag.sel.x0 + dx, y0: drag.sel.y0 + dy, x1: drag.sel.x1 + dx, y1: drag.sel.y1 + dy };
    // L'élément lâché reste choisi : Suppr le supprime.
    state.lastMoved = drag.sel ? null : drag.cells.map((c) => ({ ...c, x: c.x + dx, y: c.y + dy }));
    if ((dx || dy) && !drag.copy) {
      // Un élément posé en mode simple : sa note suit le dessin. Une porte du jeu dans ce qu'on a déplacé ne bouge pas
      // avec (elle est dans les données du jeu) : on prévient.
      if (!drag.sel) studio.elementMoved(drag.start.x, drag.start.y, dx, dy);
      const b = drag.bounds;
      assistant.terrain.importantCells().then((points) => {
        const doors = points.filter(([px, py, what]) => what === 'porte' && px >= b.x0 && px <= b.x1 && py >= b.y0 && py <= b.y1);
        if (doors.length) {
          setStatus(`Attention : la porte du jeu en ${doors[0][0]},${doors[0][1]} n'a pas bougé (données du jeu) : `
            + 'remets la maison en place, ou demande de déplacer la porte.', 'err');
        }
      });
    }
    if (dx || dy) changed();
    else state.undo.pop();                       // simple clic : rien n'a bougé
    updateHistoryButtons();
    requestDraw();
    return;
  }
  if (drag.tool === 'rect') {
    const r = rectOf(drag.start, drag.last);
    const s = state.stamp;
    for (let y = r.y0; y <= r.y1; y++) {
      for (let x = r.x0; x <= r.x1; x++) {
        const t = s && stampAt(r.x0, r.y0, x, y);
        if (t) putTile(x, y, t, placementOf(t, s, (((y - r.y0) % s.h) + s.h) % s.h));
      }
    }
  }
  // Un geste qui n'a rien changé (clic hors de la carte, gomme sur du vide…) : pas d'étape d'annulation.
  if (state.undo.at(-1) === snapshot()) {
    state.undo.pop();
    updateHistoryButtons();
    requestDraw();
    return;
  }
  changed();
};
canvas.addEventListener('pointerup', endDrag);
canvas.addEventListener('pointercancel', endDrag);

// Cases gommées autour de (x, y) : un carré de eraseSize de côté, centré sur la souris.
function eraseSquare(x, y) {
  const n = state.eraseSize;
  const x0 = x - Math.floor((n - 1) / 2);
  const y0 = y - Math.floor((n - 1) / 2);
  return { x0, y0, n };
}

function setEraseSize(n) {
  state.eraseSize = n;
  store.set(KEYS.eraseSize, n);
  document.querySelectorAll('[data-erase]').forEach((b) => b.classList.toggle('on', Number(b.dataset.erase) === n));
  requestDraw();
}

function applyAt(c, e) {
  const drag = state.drag;
  if (drag.simple) {
    if (!inside(c.x, c.y) || drag.removed) return;
    if (drag.tool === 'brush') studio.paintAt(c.x, c.y);
    if (drag.tool === 'erase') studio.eraseAt(c.x, c.y);
    requestDraw();
    return;
  }
  if (drag.tool === 'erase') {                  // la gomme mord aussi sur la carte depuis un bord
    const { x0, y0, n } = eraseSquare(c.x, c.y);
    for (let y = y0; y < y0 + n; y++) for (let x = x0; x < x0 + n; x++) eraseTile(x, y);
    requestDraw();
    return;
  }
  if (!inside(c.x, c.y)) return;
  const m = state.map;
  const i = c.y * m.width + c.x;
  switch (drag.tool) {
    case 'brush': brushAt(c.x, c.y, drag.start); break;
    case 'fill': if (c === drag.start) floodFill(c.x, c.y); break;
    case 'solid':
      // Le premier clic décide : bloquer (ou libérer si la case l'était, ou avec Maj) ; le glissé continue pareil.
      if (drag.solidValue === null) drag.solidValue = e.shiftKey ? 0 : m.solid[i] ? 0 : 1;
      m.solid[i] = drag.solidValue;
      break;
    case 'spawn': m.spawn = { ...m.spawn, x: c.x, y: c.y }; break;
    default: break;
  }
  requestDraw();
}

// Zoom à la molette, autour de la souris.
view.addEventListener('wheel', (e) => {
  e.preventDefault();
  if (!e.ctrlKey && Math.abs(e.deltaX) > Math.abs(e.deltaY)) {          // pavé tactile : défilement horizontal
    state.ox -= e.deltaX;
    requestDraw();
    return;
  }
  const i = ZOOMS.indexOf(state.zoom);
  const next = ZOOMS[Math.max(0, Math.min(ZOOMS.length - 1, i + (e.deltaY < 0 ? 1 : -1)))];
  zoomTo(next, e.clientX, e.clientY);
}, { passive: false });

function zoomTo(next, clientX, clientY) {
  if (next === state.zoom) return;
  const r = canvas.getBoundingClientRect();
  const px = clientX - r.left;
  const py = clientY - r.top;
  const k = next / state.zoom;
  state.ox = px - (px - state.ox) * k;
  state.oy = py - (py - state.oy) * k;
  state.zoom = next;
  showZoom();
  requestDraw();
}

// ---------- Outils, calques, champs ----------

function setTool(tool) {
  if (tool !== 'move') state.pasting = false;
  if (tool !== 'place' && studio.ui.element) { studio.ui.element = null; studio.render(); }
  state.tool = tool;
  $('erasebar').hidden = tool !== 'erase';
  document.querySelectorAll('[data-tool]').forEach((b) => b.classList.toggle('on', b.dataset.tool === tool));
  npcs.renderPanel();
  requestDraw();
}

function setAutoLayer(on) {
  state.autoLayer = on;
  document.querySelectorAll('#layer-mode button').forEach((b) => b.classList.toggle('on', (b.dataset.mode === 'auto') === on));
  $('layers').classList.toggle('auto', on);
  requestDraw();
}

function setLayer(id) {
  state.layer = id;
  document.querySelectorAll('.layer').forEach((b) => b.classList.toggle('on', b.dataset.layer === id));
  requestDraw();
}

function buildLayerButtons() {
  const hints = { sol: 'herbe, chemins, eau', decor: 'arbres, rochers, maisons — bloquant', dessus: 'cimes, toits — devant Pierre' };
  $('layers').innerHTML = '';
  LAYERS.forEach((l, i) => {
    const row = document.createElement('div');
    row.className = 'layer';
    row.dataset.layer = l.id;
    row.title = `Calque actif (${i + 1})`;
    row.innerHTML = `<div class="full"><b>${i + 1}. ${l.name}</b><small>${hints[l.id]}</small></div>`
      + `<b class="short">${{ sol: 'Sol', decor: 'Décor', dessus: 'Dessus' }[l.id]}</b>`;
    const eye = document.createElement('button');
    eye.className = 'eye';
    eye.title = 'Afficher / masquer ce calque';
    eye.innerHTML = '<svg class="i" viewBox="0 0 24 24"><path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z"/>'
      + '<circle cx="12" cy="12" r="3"/></svg>';
    eye.onclick = (e) => {
      e.stopPropagation();
      if (state.hidden.has(l.id)) state.hidden.delete(l.id);
      else state.hidden.add(l.id);
      eye.classList.toggle('off', state.hidden.has(l.id));
      row.classList.toggle('hidden', state.hidden.has(l.id));
      requestDraw();
    };
    row.append(eye);
    // En automatique, la pastille masque ou affiche le calque ; en manuel, elle choisit le calque où poser.
    row.onclick = () => {
      if (state.autoLayer) eye.click();
      else setLayer(l.id);
    };
    $('layers').append(row);
  });
}

// « Redimensionner » n'apparaît que si la taille tapée diffère de celle de la carte.
// Taille d'une carte : toujours paire (6 à 200 cases). Les arbres des bordures font 2 x 2 cases : sur une carte de
// taille impaire, les bordures de deux côtés opposés ne tombent pas sur la même grille et les arbres se décalent.
function evenSize(value, fallback) {
  const n = Math.max(6, Math.min(200, Number(value) || fallback));
  return n % 2 ? n + 1 : n;
}

function sizeEdited() {
  $('resize').hidden = Number($('map-w').value) === state.map.width && Number($('map-h').value) === state.map.height;
}

function syncFields() {
  $('map-name').value = state.map.name;
  $('map-w').value = state.map.width;
  $('map-h').value = state.map.height;
  sizeEdited();
}

let saveDraftTimer = null;
function changed() {
  hoverObject.key = null;
  state.dirty = true;
  store.set(KEYS.dirty, true);
  setStatus('Modifications non enregistrées');
  clearTimeout(saveDraftTimer);
  saveDraftTimer = setTimeout(() => store.set(KEYS.current, state.map), 400);
  requestDraw();
}

function setStatus(text, kind = '') {
  const s = $('status');
  s.textContent = text;
  s.className = kind;
}

// Ouvre une carte. `base` : la version enregistrée d'où elle vient ; `dirty` : elle a des modifications non
// enregistrées (un brouillon repris au rechargement de la page le reste).
function loadMap(map, { base = null, dirty = false } = {}) {
  hoverObject.key = null;
  state.moveSel = null;
  state.lastMoved = null;
  state.map = map;
  map.sheets.forEach(loadSheet);
  state.undo = [];
  state.redo = [];
  setBase(base);
  state.dirty = dirty;
  store.set(KEYS.dirty, dirty);
  updateHistoryButtons();
  syncFields();
  centerMap();
  store.set(KEYS.current, map);
  npcs.reset();
  studio.load().then(() => studio.render());
  if (dirty) setStatus('Brouillon repris : modifications non enregistrées');
}

function setBase(base) {
  state.base = base;
  store.set(KEYS.base, base);
}

// ---------- Enregistrer, ouvrir, tester ----------

// Deux collections dans le projet (voir vite.config.js) : les cartes, et les intérieurs du jeu (dessinés par
// scripts/build_interiors.py, qu'on retouche ici ; une pièce enregistrée ici est marquée « retouchée »).
const API = (kind) => (kind === 'interieur' ? '/__builder/interieurs' : '/__builder/maps');
const isInterior = () => state.base?.kind === 'interieur';

async function detectProjectSave() {
  try {
    const res = await fetch('/__builder/maps');
    state.projectSave = res.ok && Array.isArray(await res.json());
  } catch {
    state.projectSave = false;
  }
}

// Enregistre la carte. Une carte déjà enregistrée garde son identifiant (son fichier, celui que le jeu lit) même si on
// la renomme ; une carte nouvelle le tire de son nom. On demande avant d'écraser une autre carte du même nom, ou une
// version du projet qui a changé depuis l'ouverture (carte régénérée par scripts/convert_maps_v2.py, autre onglet).
async function save({ force = false } = {}) {
  const m = state.map;
  m.name = $('map-name').value.trim() || 'Sans nom';
  m.id = state.base?.id ?? slugify(m.name);
  if (state.projectSave) {
    let res;
    let out;
    try {
      const headers = { 'Content-Type': 'application/json', 'If-Match': state.base?.etag ?? 'none' };
      if (force) headers['X-Force'] = '1';
      res = await fetch(`${API(state.base?.kind)}/${m.id}`, { method: 'POST', headers, body: JSON.stringify(m) });
      out = await res.json();
    } catch (error) {
      setStatus(`Échec de l'enregistrement : ${error.message}`, 'err');
      return;
    }
    if (res.status === 409) {
      const question = out.error === 'existe'
        ? `Une carte « ${m.id} » existe déjà dans le projet. La remplacer par celle-ci ?`
        : `La carte « ${m.name} » a changé dans le projet depuis que tu l'as ouverte (régénérée par un script, ou `
          + 'enregistrée depuis un autre onglet). L\'écraser avec ta version ?';
      if (window.confirm(question)) save({ force: true });
      else setStatus('Pas enregistrée : la version du projet est gardée (Ouvrir pour la reprendre)', 'err');
      return;
    }
    if (!res.ok) {
      setStatus(`Échec de l'enregistrement : ${out.error}`, 'err');
      return;
    }
    setBase({ id: m.id, etag: out.etag, kind: state.base?.kind });
    if (isInterior()) m.retouche = true;
    setStatus(`Enregistrée dans le projet : ${out.file}${isInterior() ? ' (retouchée : build_interiors.py la garde)' : ''}`, 'ok');
  } else {
    const library = store.get(KEYS.library) ?? {};
    if (library[m.id] && state.base?.id !== m.id && !force
      && !window.confirm(`Une carte « ${m.id} » existe déjà dans ce navigateur. La remplacer par celle-ci ?`)) return;
    library[m.id] = m;
    store.set(KEYS.library, library);
    setBase({ id: m.id, etag: null });
    setStatus('Enregistrée dans ce navigateur', 'ok');
  }
  state.dirty = false;
  store.set(KEYS.dirty, false);
  store.set(KEYS.current, m);
}

async function listMaps() {
  const local = Object.values(store.get(KEYS.library) ?? {}).map((m) => ({ id: m.id, name: m.name, width: m.width, height: m.height, where: 'navigateur' }));
  if (!state.projectSave) return local;
  try {
    const project = (await (await fetch('/__builder/maps')).json()).map((m) => ({ ...m, where: 'projet' }));
    const rooms = await fetch('/__builder/interieurs').then((r) => (r.ok ? r.json() : [])).catch(() => []);
    const interiors = rooms.map((m) => ({ ...m, where: 'intérieur', kind: 'interieur' }))
      .sort((a, b) => a.name.localeCompare(b.name, 'fr'));
    return [...project, ...local.filter((l) => !project.some((p) => p.id === l.id)), ...interiors];
  } catch {
    return local;
  }
}

// Une carte du projet et sa version, ou null.
async function fetchProjectMap(id, kind) {
  try {
    const res = await fetch(`${API(kind)}/${id}`);
    return res.ok ? { map: await res.json(), etag: res.headers.get('ETag') } : null;
  } catch {
    return null;
  }
}

async function openMap(entry) {
  if (entry.where === 'projet' || entry.kind === 'interieur') {
    const found = await fetchProjectMap(entry.id, entry.kind);
    if (found) loadMap(found.map, { base: { id: entry.id, etag: found.etag, kind: entry.kind } });
  } else {
    const map = (store.get(KEYS.library) ?? {})[entry.id];
    if (map) loadMap(map, { base: { id: entry.id, etag: null } });
  }
  if (state.base?.id === entry.id && entry.kind === 'interieur') {
    setMode('detail');                     // un intérieur se retouche case par case (planches « Intérieurs »)
    const first = $('sheet').querySelector('option[value="interieurs"]');
    if (first) { $('sheet').value = 'interieurs'; showSheet('interieurs'); }
    setStatus(`Intérieur ouvert : ${state.map.name}${entry.retouche ? ' (déjà retouché)' : ''}. Planches : rayon Intérieurs.`, 'ok');
  } else if (state.base?.id === entry.id) setStatus(`Carte ouverte : ${state.map.name}`, 'ok');
}

async function showOpenDialog() {
  const list = $('map-list');
  list.innerHTML = '<li><small>Chargement…</small></li>';
  $('open-dialog').showModal();
  const maps = await listMaps();
  list.innerHTML = '';
  if (!maps.length) list.innerHTML = '<li><small>Aucune carte enregistrée pour l\'instant.</small></li>';
  for (const entry of maps) {
    const li = document.createElement('li');
    const name = document.createElement('span');
    name.textContent = entry.name;
    const meta = document.createElement('small');
    meta.textContent = `${entry.width} × ${entry.height} · ${entry.where}${entry.retouche ? ' · retouché' : ''}`
      + `${entry.id === state.base?.id ? ' · ouverte' : ''}`;
    li.append(name, meta);
    li.onclick = async () => {
      $('open-dialog').close();
      if (state.dirty && !window.confirm('Des modifications ne sont pas enregistrées. Ouvrir quand même ?')) return;
      openMap(entry);
    };
    list.append(li);
  }
}

function testMap() {
  store.set(KEYS.test, { ...state.map, name: $('map-name').value.trim() || state.map.name });
  window.open(`${BASE}?carte=test`, 'pokepierre-test');
}

// ---------- Démarrage ----------

function bindUi() {
  document.querySelectorAll('[data-tool]').forEach((b) => { b.onclick = () => setTool(b.dataset.tool); });
  $('sheet').onchange = (e) => {
    showSheet(e.target.value);
    $('palette-wrap').scrollTop = 0;
  };
  $('undo').onclick = () => restore(state.undo, state.redo);
  $('redo').onclick = () => restore(state.redo, state.undo);
  $('grid').onclick = () => {
    state.grid = !state.grid;
    $('grid').classList.toggle('on', state.grid);
    requestDraw();
  };
  $('show-solid').onclick = () => {
    state.showSolid = !state.showSolid;
    $('show-solid').classList.toggle('on', state.showSolid);
    requestDraw();
  };
  $('map-name').onchange = () => {
    state.map.name = $('map-name').value.trim() || state.map.name;
    changed();
  };
  $('map-w').oninput = sizeEdited;
  $('map-h').oninput = sizeEdited;
  $('resize').onclick = () => {
    const w = evenSize($('map-w').value, state.map.width);
    const h = evenSize($('map-h').value, state.map.height);
    if (w === state.map.width && h === state.map.height) return;
    remember();
    state.map = resizeMap(state.map, w, h);
    syncFields();
    centerMap();
    changed();
    setStatus(`Taille : ${w} × ${h} (toujours paire : les arbres des bordures font 2 × 2 cases)`);
  };
  $('save').onclick = save;
  $('open').onclick = showOpenDialog;
  $('open-cancel').onclick = () => $('open-dialog').close();
  $('new').onclick = () => $('new-dialog').showModal();
  $('new-dialog').addEventListener('close', () => {
    if ($('new-dialog').returnValue !== 'ok') return;
    if (state.dirty && !window.confirm('Des modifications ne sont pas enregistrées. Créer une nouvelle carte quand même ?')) return;
    const name = $('new-name').value.trim() || 'Nouvelle carte';
    const width = evenSize($('new-w').value, 30);
    const height = evenSize($('new-h').value, 20);
    loadMap(blankMap({ id: slugify(name), name, width, height }));
    setStatus('Nouvelle carte');
  });
  // Un bouton cliqué ne garde pas le focus (Espace et les flèches restent pour la carte).
  document.addEventListener('click', (e) => { if (e.target.closest('button')) e.target.closest('button').blur(); });
  $('test').onclick = testMap;
  document.querySelectorAll('#layer-mode button').forEach((b) => { b.onclick = () => setAutoLayer(b.dataset.mode === 'auto'); });
  document.querySelectorAll('[data-erase]').forEach((b) => { b.onclick = () => setEraseSize(Number(b.dataset.erase)); });
  $('sel-dup').onclick = duplicateSelection;
  $('sel-del').onclick = () => { deleteObject(); requestDraw(); };
  setEraseSize(ERASE_SIZES.includes(store.get(KEYS.eraseSize)) ? store.get(KEYS.eraseSize) : 1);
  $('zoom-in').onclick = () => zoomStep(1);
  $('zoom-out').onclick = () => zoomStep(-1);
  $('zoom-fit').onclick = centerMap;
  // Panneau des planches élargi en tirant son bord droit.
  const main = document.querySelector('main');
  const setAside = (w) => {
    const width = Math.round(Math.max(260, Math.min(w, window.innerWidth - 420)));
    main.style.setProperty('--aside', `${width}px`);
    return width;
  };
  const savedAside = store.get(KEYS.aside);
  if (savedAside) setAside(savedAside);
  const grip = $('aside-resize');
  grip.onpointerdown = (e) => {
    e.preventDefault();
    grip.setPointerCapture(e.pointerId);
    grip.classList.add('on');
    const left = main.getBoundingClientRect().left;
    grip.onpointermove = (ev) => {
      store.set(KEYS.aside, setAside(ev.clientX - left));
      requestDraw();
    };
    grip.onpointerup = () => {
      grip.classList.remove('on');
      grip.onpointermove = null;
    };
  };
  grip.ondblclick = () => {
    main.style.removeProperty('--aside');
    store.set(KEYS.aside, null);
    requestDraw();
  };
  // En ×1, la palette suit la largeur du panneau.
  let paletteWidth = 0;
  new ResizeObserver(() => {
    const w = $('palette-wrap').clientWidth;
    if (state.paletteZoom === 1 && state.sheet && w !== paletteWidth) showSheet(state.sheet);
    paletteWidth = w;
  }).observe($('palette-wrap'));
  $('palette-zoom').onclick = () => {
    state.paletteZoom = PALETTE_ZOOMS[(PALETTE_ZOOMS.indexOf(state.paletteZoom) + 1) % PALETTE_ZOOMS.length];
    showSheet(state.sheet);
  };
  $('back').onclick = () => { window.location.href = BASE; };

  window.addEventListener('keydown', (e) => {
    if (e.target.matches('input, select, textarea')) return;
    const k = e.key.toLowerCase();
    if ((e.ctrlKey || e.metaKey) && k === 'z') {
      e.preventDefault();
      if (e.shiftKey) restore(state.redo, state.undo);
      else restore(state.undo, state.redo);
      return;
    }
    if ((e.ctrlKey || e.metaKey) && k === 'y') { e.preventDefault(); restore(state.redo, state.undo); return; }
    if ((e.ctrlKey || e.metaKey) && k === 's') { e.preventDefault(); save(); return; }
    if ((e.ctrlKey || e.metaKey) && k === 'c') { if (copySelection()) e.preventDefault(); return; }
    if ((e.ctrlKey || e.metaKey) && k === 'v') { if (startPasting()) e.preventDefault(); return; }
    if ((e.ctrlKey || e.metaKey) && k === 'd') { e.preventDefault(); duplicateSelection(); return; }
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    if (e.key === ' ') { spaceDown = true; view.classList.add('pan'); e.preventDefault(); return; }
    const arrows = { ArrowLeft: [1, 0], ArrowRight: [-1, 0], ArrowUp: [0, 1], ArrowDown: [0, -1] };
    if (arrows[e.key]) {
      e.preventDefault();
      const step = PAN_STEP * (e.shiftKey ? 4 : 1);
      pan(arrows[e.key][0] * step, arrows[e.key][1] * step);
      return;
    }
    const tools = { b: 'brush', r: 'rect', g: 'fill', e: 'erase', i: 'pick', m: 'move', c: 'solid', s: 'spawn', n: 'npc' };
    if (e.key === 'Escape') {
      stopPasting();
      state.moveSel = null;
      state.lastMoved = null;
      requestDraw();
    }
    if ((e.key === 'Delete' || e.key === 'Backspace') && deleteObject()) {
      e.preventDefault();
      return;
    }
    if (tools[k]) setTool(tools[k]);
    if (['1', '2', '3'].includes(k)) {
      setAutoLayer(false);
      setLayer(LAYERS[Number(k) - 1].id);
    }
    if (k === 'a') setAutoLayer(!state.autoLayer);
    if (e.key === '[' || e.key === ']') {
      const i = ERASE_SIZES.indexOf(state.eraseSize) + (e.key === ']' ? 1 : -1);
      setEraseSize(ERASE_SIZES[Math.max(0, Math.min(ERASE_SIZES.length - 1, i))]);
      setTool('erase');
    }
    if (k === 'h') $('grid').click();
    if (k === 'v') $('show-solid').click();
    if (k === '0') centerMap();
    if (k === '+' || k === '=') zoomStep(1);
    if (k === '-') zoomStep(-1);
  });
  window.addEventListener('keyup', (e) => {
    if (e.key === ' ') {
      spaceDown = false;
      if (state.drag?.tool !== 'pan') view.classList.remove('pan');
    }
  });
  window.addEventListener('beforeunload', (e) => {
    if (state.dirty) e.preventDefault();
  });
  new ResizeObserver(fitCanvas).observe(view);
}

// ---------- Assistant (src/builder/assistant.js) ----------
// La zone : celle choisie avec l'outil Déplacer (sinon toute la carte). Chaque commande est un seul pas d'historique.
const assistant = createAssistant({
  state, base: BASE, colsOf, loadSheet, remember, forget, changed,
  selection: () => state.moveSel,
});

const studio = createStudio({
  state, base: BASE, loadSheet, colsOf, remember, changed, requestDraw, terrain: assistant.terrain,
  setTool: (t) => setTool(t), objectAt, liftObject, setStatus,
});

const npcs = createNpcLayer({ state, base: BASE, remember, changed, requestDraw, setStatus });

function setMode(mode) {
  state.mode = mode;
  store.set(KEYS.mode, mode);
  document.body.classList.toggle('simple', mode === 'simple');
  document.querySelectorAll('#mode-switch button').forEach((b) => b.classList.toggle('on', b.dataset.mode === mode));
  if (mode === 'simple' && ['pick', 'solid'].includes(state.tool)) setTool('brush');
  if (mode === 'detail' && state.tool === 'place') setTool('move');
  requestDraw();
}

function showAssistantZone() {
  const z = state.moveSel;
  const text = z ? `zone ${z.x0},${z.y0} → ${z.x1},${z.y1}` : 'toute la carte';
  if ($('asst-zone').textContent !== text) $('asst-zone').textContent = text;   // le DOM seulement s'il change
  if ($('asst-zone-clear').hidden !== !z) $('asst-zone-clear').hidden = !z;
}

async function runAssistant(command) {
  if (!command) return;
  $('asst-log').className = '';
  $('asst-log').textContent = '…';
  try {
    const r = await command();
    $('asst-log').textContent = r.text;
    $('asst-log').className = r.kind;
    setStatus(r.text, r.kind);                      // aussi en bas : l'assistant peut être replié (mode simple)
  } catch (err) {
    $('asst-log').textContent = `Erreur : ${err.message}`;
    $('asst-log').className = 'warn';
  }
  document.querySelector('[data-asst=regen]').disabled = !assistant.hasSow();
}

function bindAssistant() {
  const density = () => Number($('asst-density').value) / 100;
  const actions = {
    path: () => assistant.straightenPath(),
    transitions: () => assistant.fixTransitions(),
    sow: () => assistant.sowTall(density()),
    regen: () => assistant.regenerate(density()),
    forest: () => assistant.borderTrees(),
  };
  document.querySelectorAll('[data-asst]').forEach((b) => { b.onclick = () => runAssistant(actions[b.dataset.asst]); });
  $('studio-border').onclick = () => runAssistant(actions.forest);
  $('asst-density').oninput = () => { $('asst-density-val').textContent = `${$('asst-density').value} %`; };
  $('asst-form').onsubmit = (e) => {
    e.preventDefault();
    const text = $('asst-input').value.trim();
    if (!text) return;
    const cmd = assistant.parse(text, density());
    if (!cmd) {
      $('asst-log').className = 'warn';
      $('asst-log').textContent = 'Je n\'ai pas compris. Essaie : « régularise le chemin », « corrige les transitions », « refais la bordure d\'arbres », '
        + '« sème des hautes herbes, 30 % », « régénère cette zone ».';
      return;
    }
    runAssistant(cmd.run);
  };
  $('asst-toggle').onclick = (e) => {
    if (e.target.closest('button')) return;
    $('assistant').classList.toggle('closed');
  };
  $('asst-zone-clear').onclick = () => {
    state.moveSel = null;
    requestDraw();
  };
}

async function start() {
  await Promise.all([loadCatalog(), detectProjectSave()]);
  const select = $('sheet');
  // Planches rangées par rayon (bibliothèque Gen 4 par type d'élément, voir scripts/build_g4_library.py CATEGORIES),
  // puis les cases assemblées. Les planches d'origine masquées (remplacées par les planches par type) restent chargées
  // pour dessiner les cartes, mais ne sont pas proposées.
  // Les planches d'intérieur d'origine (masquées) restent proposées dans le rayon « Intérieurs », avec les cases des
  // intérieurs du jeu (planche « interieurs », scripts/build_interiors.py) : pour retoucher une pièce.
  const shown = state.catalog.sheets.filter((sh) => !sh.hidden || INTERIOR_SHEETS.includes(sh.id));
  const groupOf = (sh) => (INTERIOR_SHEETS.includes(sh.id) ? 'Intérieurs'
    : sh.group ?? (sh.id === 'auto' ? 'Cases assemblées' : 'Autres planches'));
  const groups = [...PALETTE_GROUPS, ...new Set(shown.map(groupOf))].filter((g, i, all) => all.indexOf(g) === i);
  for (const label of groups) {
    const sheets = shown.filter((sh) => groupOf(sh) === label);
    if (!sheets.length) continue;
    const group = document.createElement('optgroup');
    group.label = label;
    for (const sh of sheets) group.append(new Option(sh.name, sh.id));
    select.append(group);
  }
  buildLayerButtons();
  bindUi();
  bindAssistant();
  studio.bind();
  npcs.bind();
  document.querySelectorAll('#mode-switch button').forEach((b) => { b.onclick = () => setMode(b.dataset.mode); });
  setMode(store.get(KEYS.mode) ?? 'simple');
  if (state.mode === 'simple') $('assistant').classList.add('closed');      // replié : la carte d'abord
  setLayer('sol');
  setAutoLayer(true);
  setTool('brush');
  $('grid').classList.add('on');
  showSheet(select.querySelector('option').value);          // la première planche proposée (Sols et chemins)
  fitCanvas();
  // Le brouillon du navigateur, s'il a des modifications ; sinon la version enregistrée (les cartes générées par
  // scripts/convert_maps_v2.py peuvent avoir changé depuis, et leurs cases assemblées avec).
  // Un brouillon modifié dont la version du projet a changé depuis (carte régénérée par un script) : on demande lequel
  // garder ; le brouillon gardé reste « non enregistré », et l'enregistrer redemandera avant d'écraser.
  const draft = store.get(KEYS.current);
  const dirty = Boolean(store.get(KEYS.dirty));
  const base = store.get(KEYS.base);
  const project = draft && state.projectSave ? await fetchProjectMap(base?.id ?? draft.id, base?.kind) : null;
  if (!draft) loadMap(blankMap());
  else if (project && !dirty) loadMap(project.map, { base: { id: base?.id ?? draft.id, etag: project.etag, kind: base?.kind } });
  else if (project && base?.etag !== project.etag
    && !window.confirm(`Ton brouillon de « ${draft.name} » n'est pas enregistré, mais la carte a changé dans le projet `
      + 'depuis (régénérée par un script ?).\n\nOK : garder ton brouillon.\nAnnuler : reprendre la version du projet.')) {
    loadMap(project.map, { base: { id: base?.id ?? draft.id, etag: project.etag, kind: base?.kind } });
  } else loadMap(draft, { base, dirty });
  if (!state.projectSave) setStatus('Les cartes sont enregistrées dans ce navigateur');
}

// Accès console en développement (tests manuels) : window.builder.
if (import.meta.env.DEV) window.builder = { state, studio, assistant, setMode, setTool, setStamp, brushAt, eraseTile, placementOf, elementsOf, objectAt, anchorKey, loadSheet, loadMap, blankMap, changed };

start();
