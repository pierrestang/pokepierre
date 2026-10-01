import { TILE_SIZE, getTile } from '../data/tiles.js';
import { drawTile, drawTall, tallObject, drawTallKind, tallFrames, setGroundProvided } from '../art/tileArt.js';
import { drawBuilding } from '../art/buildingArt.js';
import {
  drawFrlgGround, drawFrlgOverlay, addFrlgBuilding, frlgBuildingFloor, isFrlgOnly,
  frlgTree, drawFrlgTree, FRLG_BUILDINGS, FRLG_TREE, FRLG_SHEETS, addSeaLayer, frlgTropicalTree, frlgBerryPlant,
  drawFrlgInteriorGround, drawFrlgInteriorDecor, FRLG_INTERIOR_ONLY,
} from '../art/frlgArt.js';
import { inFullTreeBlock } from '../data/treeBlocks.js';

const S = TILE_SIZE;

// Point unique de rendu des cartes : chaque carte est cuite une fois dans une texture (canvas).
// Couches (voir art/frlgArt.js) : sol Rouge Feu, dessin procédural (art/tileArt.js) pour le reste,
// objets Rouge Feu. Bâtiments Rouge Feu, arbres et objets hauts : images à part, triées en profondeur. Le reste du jeu n'appelle que renderMap(scene, map).
export function renderMap(scene, map) {
  // Pièce dessinée d'un seul tenant (`backdrop` : { sheet, frame }, ex. l'intérieur de la cabane) ; la grille
  // ne sert alors qu'aux collisions.
  if (map.backdrop) return scene.add.image(0, 0, map.backdrop.sheet, map.backdrop.frame(scene)).setOrigin(0).setDepth(0);
  const key = `map-${map.id}`;
  const { grid } = map;
  if (!scene.textures.exists(key)) {
    bakeRegion(scene, key, { x0: 0, y0: 0, w: grid[0].length, h: grid.length }, (x, y) => grid[y]?.[x], {
      buildings: map.buildings ?? [],
      buildingGround: map.buildingGround,
      interior: map.frlg ? map : null,
    });
  }
  const image = scene.add.image(0, 0, key).setOrigin(0).setDepth(0);
  // Mer animée sous la carte, dès qu'il y a de la mer sur la carte ou autour.
  if (map.surroundings === 'w' || grid.some((row) => row.includes('w'))) {
    addSeaLayer(scene, grid[0].length * S, grid.length * S);
  }
  (map.buildings ?? []).forEach((b) => addFrlgBuilding(scene, b));
  addTallObjects(scene, map);
  addBoats(scene, map);
  return image;
}

// Cuit les cases [x0, x0 + w[ x [y0, y0 + h[ dans la texture `key` (coin haut-gauche = case x0, y0).
// `skip(x, y)` : cases laissées transparentes ; `inlineTrees` : arbres et palmiers dessinés dans la
// texture (décor autour des cartes) plutôt qu'en objets triés en profondeur.
// `interior` : un intérieur Rouge Feu (murs, parquet, meubles de frlg-rooms.png, voir art/frlgArt.js).
function bakeRegion(scene, key, { x0, y0, w, h }, at, { buildings = [], buildingGround, skip = () => false, inlineTrees = false, interior = null } = {}) {
  const textures = scene.textures;
  const floor = frlgBuildingFloor(buildings);
  const tex = textures.createCanvas(key, w * S, h * S);
  const ctx = tex.getContext();
  ctx.imageSmoothingEnabled = false;
  ctx.translate(-x0 * S, -y0 * S);
  const cells = [];
  for (let y = y0; y < y0 + h; y++) for (let x = x0; x < x0 + w; x++) if (!skip(x, y)) cells.push([x, y]);

  // 1. Sol Rouge Feu
  const provided = new Set();
  for (const [x, y] of cells) {
    if (interior) {
      drawFrlgInteriorGround(ctx, textures, x, y, at);
      provided.add(`${x},${y}`);
    } else if (drawFrlgGround(ctx, textures, x, y, at, floor)) provided.add(`${x},${y}`);
  }

  // 2. Dessin procédural (sans son sol là où Rouge Feu en a posé un)
  const g = scene.make.graphics({}, false);
  g.translateCanvas(-x0 * S, -y0 * S);
  for (const [x, y] of cells) {
    const code = at(x, y);
    if (interior ? FRLG_INTERIOR_ONLY.has(code) : isFrlgOnly(code) || floor(x, y)) continue;
    const drawn = buildingGround && ['R', 'W', 'D'].includes(code) ? buildingGround : code;
    setGroundProvided(provided.has(`${x},${y}`));
    drawTile(g, drawn, x, y, at, getTile(drawn).color);
  }
  setGroundProvided(false);
  buildings.filter((b) => !FLOATING.includes(b.type) && !FRLG_BUILDINGS[b.type]).forEach((b) => drawBuilding(g, b));
  stamp(scene, g, ctx, x0, y0, w, h);

  // 3. Objets Rouge Feu (les bâtiments Rouge Feu sont des images à part, voir renderMap)
  if (interior) drawFrlgInteriorDecor(ctx, textures, interior);
  else for (const [x, y] of cells) drawFrlgOverlay(ctx, textures, x, y, at);

  if (inlineTrees) {
    const tall = scene.make.graphics({}, false);
    tall.translateCanvas(-x0 * S, -y0 * S);
    for (const [x, y] of cells) {
      const tree = frlgTree(at(x, y), x, y, at);
      if (tree) drawFrlgTree(ctx, textures, tree.x, tree.y);
      else if (at(x, y) !== 'T' || !inFullTreeBlock(x, y, at)) drawTall(tall, at(x, y), x, y, at);
    }
    stamp(scene, tall, ctx, x0, y0, w, h);
  }
  tex.refresh();
  return tex;
}

// Copie un dessin procédural (Graphics) sur le canvas, puis le détruit.
function stamp(scene, g, ctx, x0, y0, w, h) {
  const tmp = `__stamp-${Math.random()}`;
  g.generateTexture(tmp, w * S, h * S);
  g.destroy();
  ctx.drawImage(scene.textures.get(tmp).getSourceImage(), x0 * S, y0 * S);
  scene.textures.remove(tmp);
}

// Bateaux et ferry : une image à part, qui tangue doucement sur l'eau.
const FLOATING = ['boat', 'ferry'];

function addBoats(scene, map) {
  // Ferry des îles Sevii (Rouge Feu, 69 x 40) : sur une emprise de 4 x 2 cases, proue à droite.
  for (const b of (map.buildings ?? []).filter((d) => d.type === 'ferry')) {
    const image = scene.add.image(b.x * TILE_SIZE - 2, b.y * TILE_SIZE - 6, FRLG_SHEETS.ferry).setOrigin(0)
      .setDepth(10 + (b.y * TILE_SIZE + 30) / 10000);
    scene.tweens.add({ targets: image, y: image.y + 1, duration: 900, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
  }
  for (const b of (map.buildings ?? []).filter((d) => d.type === 'boat')) {
    const key = 'building-boat';
    if (!scene.textures.exists(key)) {
      const g = scene.make.graphics({}, false);
      g.translateCanvas(-b.x * TILE_SIZE + 4, -b.y * TILE_SIZE + 2);
      drawBuilding(g, b);
      g.generateTexture(key, 56, 36);
      g.destroy();
    }
    const image = scene.add.image(b.x * TILE_SIZE - 4, b.y * TILE_SIZE - 2, key).setOrigin(0)
      .setDepth(10 + (b.y * TILE_SIZE + 30) / 10000);
    scene.tweens.add({ targets: image, y: image.y + 1, duration: 900, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
  }
}

// Grands arbres Rouge Feu, sapins d'une case et palmiers : une image chacun, triée en profondeur comme
// les personnages (depth 10 + y / 10000), pour qu'ils passent devant les personnages situés derrière eux.
function addTallObjects(scene, map) {
  const { grid } = map;
  const at = (x, y) => grid[y]?.[x];
  grid.forEach((row, y) => row.forEach((code, x) => {
    const tropical = frlgTropicalTree(scene, code, x, y, at) ?? frlgBerryPlant(scene, code, x, y);
    if (tropical) {
      scene.add.image(tropical.x, tropical.y, tropical.key).setOrigin(0).setDepth(10 + tropical.baseY / 10000);
      return;
    }
    const tree = frlgTree(code, x, y, at);
    if (tree) {
      const key = 'tall-frlg-tree';
      if (!scene.textures.exists(key)) {
        const tex = scene.textures.createCanvas(key, FRLG_TREE.w, FRLG_TREE.h);
        drawFrlgTree(tex.getContext(), scene.textures, 0, 0);
        tex.refresh();
      }
      scene.add.image(tree.x, tree.y, key).setOrigin(0).setDepth(10 + tree.baseY / 10000);
      return;
    }
    const o = tallObject(code, x, y, at);
    if (!o || o.kind === 'pine32') return;
    // Une texture par image ; un objet animé (drapeau au vent) change d'image régulièrement.
    const frames = tallFrames(o.kind);
    const keys = Array.from({ length: frames }, (_, f) => `tall-${o.kind}-${f}`);
    keys.forEach((key, f) => {
      if (scene.textures.exists(key)) return;
      const g = scene.make.graphics({}, false);
      drawTallKind(g, o.kind, f);
      g.generateTexture(key, o.w, o.h);
      g.destroy();
    });
    const image = scene.add.image(o.x, o.y, keys[0]).setOrigin(0).setDepth(10 + o.baseY / 10000);
    if (frames > 1) {
      let f = 0;
      scene.time.addEvent({ delay: 220, loop: true, callback: () => image.setTexture(keys[(f = (f + 1) % frames)]) });
    }
  }));
}

// Texture répétable d'une tuile (clé `tile-<code>`), dessinée comme sur les cartes. Les sapins forment
// des blocs de 2 x 2 cases et la mer a un motif de vagues sur 2 x 2 : leur motif fait 32 x 32.
function tileSpan(code) {
  return code === 'T' || code === 'w' ? 2 : 1;
}

function tileTexture(scene, code) {
  const key = `tile-${code}`;
  if (!scene.textures.exists(key)) {
    const n = tileSpan(code);
    // Deux fois la hauteur du motif : ce qui dépasse vers le haut (cime des arbres) raccorde la répétition.
    const tall = bakeRegion(scene, `${key}-x2`, { x0: 0, y0: 0, w: n, h: 2 * n }, () => code, { inlineTrees: true });
    const tex = scene.textures.createCanvas(key, n * S, n * S);
    tex.getContext().drawImage(tall.getSourceImage(), 0, 0);
    tex.refresh();
    scene.textures.remove(`${key}-x2`);
  }
  return key;
}

// Remplit tout l'écran autour de la carte. `spec` vaut :
//  - un code de tuile (ex. 'T') : cette tuile répétée partout, alignée sur la grille ;
//  - { outside(x, y, grid), border?, borderSkip? } : `outside` donne le code de chaque case
//    hors carte (ex. prolonger une rivière), `border` une tuile posée sur la rangée tout au bord
//    de l'écran, sauf sur les cases dont le code est dans `borderSkip`.
// Rappeler `resize(viewW, viewH)` quand la vue change.
export function createSurroundings(scene, map, spec) {
  return typeof spec === 'string' ? repeatedSurroundings(scene, map, spec) : ruleSurroundings(scene, map, spec);
}

// Bornes (en cases) de la zone visible, la carte étant centrée.
function visibleTiles(map, viewW, viewH) {
  const mapW = map.grid[0].length * TILE_SIZE;
  const mapH = map.grid.length * TILE_SIZE;
  return {
    x0: Math.floor((mapW / 2 - viewW / 2) / TILE_SIZE),
    y0: Math.floor((mapH / 2 - viewH / 2) / TILE_SIZE),
    x1: Math.ceil((mapW / 2 + viewW / 2) / TILE_SIZE) - 1,
    y1: Math.ceil((mapH / 2 + viewH / 2) / TILE_SIZE) - 1,
  };
}

function repeatedSurroundings(scene, map, code) {
  const fill = scene.add.tileSprite(0, 0, 1, 1, tileTexture(scene, code)).setOrigin(0).setDepth(-1);
  return {
    resize(viewW, viewH) {
      const { x0, y0, x1, y1 } = visibleTiles(map, viewW, viewH);
      // Calé sur des coordonnées paires, comme les blocs de sapins de la carte.
      fill.setPosition(Math.floor((x0 - 1) / 2) * 2 * TILE_SIZE, Math.floor((y0 - 1) / 2) * 2 * TILE_SIZE);
      fill.setSize((x1 - x0 + 5) * TILE_SIZE, (y1 - y0 + 5) * TILE_SIZE);
    },
  };
}

function ruleSurroundings(scene, map, { outside, border, borderSkip = [] }) {
  const { grid } = map;
  const W = grid[0].length;
  const H = grid.length;
  const key = `surround-${map.id}`;
  let image = null;

  return {
    resize(viewW, viewH) {
      const { x0, y0, x1, y1 } = visibleTiles(map, viewW, viewH);
      const inMap = (x, y) => x >= 0 && y >= 0 && x < W && y < H;
      const base = (x, y) => (inMap(x, y) ? grid[y][x] : outside(x, y, grid));
      const onEdge = (x, y) => x === x0 || x === x1 || y === y0 || y === y1;
      const at = (x, y) => {
        const code = base(x, y);
        if (!inMap(x, y) && border && onEdge(x, y) && !borderSkip.includes(code)) return border;
        return code;
      };

      image?.destroy();
      if (scene.textures.exists(key)) scene.textures.remove(key);
      bakeRegion(scene, key, { x0, y0, w: x1 - x0 + 1, h: y1 - y0 + 1 }, at, { skip: inMap, inlineTrees: true });
      image = scene.add.image(x0 * TILE_SIZE, y0 * TILE_SIZE, key).setOrigin(0).setDepth(-1);
    },
  };
}
