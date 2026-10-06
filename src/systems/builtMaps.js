import { TILE, LAYERS, drawLayers, stackOf } from '../builder/mapModel.js';
import { builtGrid } from '../data/maps/builtGrid.js';

// Cartes faites avec le créateur de cartes (builder.html), jouables dans le jeu :
// - enregistrées dans le projet : src/data/builtMaps/<id>.json ;
// - en cours d'essai : le bouton « Tester » du créateur les passe par le navigateur (localStorage).
// Le jeu les ouvre avec l'adresse ?carte=<id> (?carte=test : la carte en cours d'essai).
// Une carte du créateur devient une carte du jeu « à fond dessiné » (voir tileRenderer.renderMap `backdrop`) :
// sol et décor cuits dans une image, le calque « au-dessus de Pierre » dans une autre, par-dessus les personnages ;
// la grille ne sert qu'aux collisions ('.' on passe, 'X' bloqué).

const SAVED = import.meta.glob('../data/builtMaps/*.json', { eager: true, import: 'default' });
const TEST_KEY = 'pokepierre.builder.test';
const sheetKey = (id) => `v2-${id}`;

// Id de la carte demandée dans l'adresse (?carte=…), ou null.
export function requestedBuiltMap() {
  return new URLSearchParams(window.location.search).get('carte');
}

export function loadBuiltMap(id) {
  if (id === 'test') {
    try {
      return JSON.parse(localStorage.getItem(TEST_KEY));
    } catch {
      return null;
    }
  }
  return Object.entries(SAVED).find(([path]) => path.endsWith(`/${id}.json`))?.[1] ?? null;
}

// Planches à charger (dans BootScene.preload) pour afficher la carte.
export function preloadBuiltMap(scene, data) {
  for (const id of data.sheets) scene.load.image(sheetKey(id), `${import.meta.env.BASE_URL}assets/v2/${id}.png`);
}

// Dessin d'une carte du créateur cuit dans des textures : le fond (sol et décor) et, s'il y en a, le calque
// « au-dessus de Pierre » ; renvoie { backdrop, overlays } au format des cartes du jeu (voir tileRenderer.renderMap).
function bakeLayers(scene, data, id) {
  const images = Object.fromEntries(data.sheets.map((s) => [s, scene.textures.get(sheetKey(s)).getSourceImage()]));
  const cols = (s) => Math.floor(images[s].width / TILE);
  const bake = (key, layerIds) => {
    if (scene.textures.exists(key)) scene.textures.remove(key);
    const tex = scene.textures.createCanvas(key, data.width * TILE, data.height * TILE);
    drawLayers(tex.getContext(), data, layerIds, images, cols);
    tex.refresh();
  };
  bake(`${id}-fond`, LAYERS.filter((l) => l.id !== 'dessus').map((l) => l.id));
  const hasTop = data.layers.dessus?.some((cell) => stackOf(cell).length > 0);
  if (hasTop) bake(`${id}-dessus`, ['dessus']);
  return {
    backdrop: { sheet: `${id}-fond`, frame: () => undefined },
    topLayer: hasTop ? `${id}-dessus` : null,
    // Le calque « au-dessus de Pierre », par-dessus tous les personnages.
    overlays: hasTop ? [{ sheet: `${id}-dessus`, frame: () => undefined, x: 0, y: 0, h: 1e6 }] : [],
  };
}

// Planches de toutes les cartes du jeu dessinées avec le créateur (map.built), à charger au démarrage.
export function preloadBuiltLooks(scene, maps) {
  for (const map of Object.values(maps)) if (map.built) preloadBuiltMap(scene, map.built);
}

// Une carte du jeu dessinée avec le créateur (map.built) : son dessin remplace le rendu Rouge Feu (une seule fois).
export function applyBuiltLook(scene, map) {
  if (map.backdrop) return;
  const look = bakeLayers(scene, map.built, `jeu-${map.id}`);
  map.backdrop = look.backdrop;
  map.topLayer = look.topLayer;
  map.overlays = [...(map.overlays ?? []), ...look.overlays];
}

// Le personnage debout en (x, y) est-il caché par le calque « au-dessus de Pierre » (toit, cime) ? Plus de la moitié
// des pixels de sa silhouette (sa case et le haut de sa tête, au-dessus) sous un dessin plein. Calculé une fois par case.
const coverCache = new Map();
export function hiddenUnderTop(scene, key, x, y) {
  if (!key || !scene.textures.exists(key)) return false;
  const id = `${key}:${x},${y}`;
  if (!coverCache.has(id)) {
    const source = scene.textures.get(key).getSourceImage();
    const left = x * TILE + 3;
    const top = Math.max(0, y * TILE - 6);
    const w = 10;
    const h = y * TILE + TILE - top;
    let hidden = false;
    if (left >= 0 && left + w <= source.width && top + h <= source.height) {
      const data = source.getContext('2d', { willReadFrequently: true }).getImageData(left, top, w, h).data;
      let full = 0;
      for (let i = 3; i < data.length; i += 4) if (data[i] > 160) full++;
      hidden = full > 0.5 * w * h;
    }
    coverCache.set(id, hidden);
  }
  return coverCache.get(id);
}

// La carte du jeu dessinée avec ce dessin du créateur (même identifiant : saint-ay, hull…), ou null.
export function gameMapOf(maps, data) {
  return Object.values(maps).find((m) => m.built?.id === data.id && m.sourceGrid) ?? null;
}

// Essai d'une carte du jeu dans son contexte (PNJ, portes, scénettes) : le dessin en cours remplace le sien, et la grille
// du jeu est recalculée sur ses collisions.
export function useBuiltLook(map, data) {
  map.built = data;
  map.grid = builtGrid(map.sourceGrid, data);
  delete map.backdrop;
}

// Pendant un essai depuis le créateur, la partie est lue (drapeaux, objets : l'histoire là où on en est) mais rien
// n'est enregistré : la vraie sauvegarde reste intacte (les clés du créateur restent inscriptibles).
export function protectSave() {
  const write = Storage.prototype.setItem;
  const remove = Storage.prototype.removeItem;
  const guarded = (key) => key.startsWith('pokepierre.') && !key.startsWith('pokepierre.builder.');
  Storage.prototype.setItem = function setItem(key, value) {
    if (this === window.localStorage && guarded(key)) return;
    write.call(this, key, value);
  };
  Storage.prototype.removeItem = function removeItem(key) {
    if (this === window.localStorage && guarded(key)) return;
    remove.call(this, key);
  };
}

// Cuit la carte dans des textures et la renvoie au format des cartes du jeu (voir data/maps).
export function bakeBuiltMap(scene, data) {
  const id = `carte-${data.id}`;
  const look = bakeLayers(scene, data, id);

  const grid = [];
  for (let y = 0; y < data.height; y++) {
    grid.push(Array.from({ length: data.width }, (_, x) => (data.solid[y * data.width + x] ? 'X' : '.')));
  }
  return {
    id,
    name: data.name,
    builder: true,                                  // carte d'essai : ni sauvegarde, ni carte du voyage
    built: data,                                    // son dessin (bords cachés : voir MapScene.hiddenEdges)
    grid,
    ...look,
    spawn: data.spawn,
    npcs: [],
  };
}
