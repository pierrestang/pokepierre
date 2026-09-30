import { TILE_SIZE, getTile } from '../data/tiles.js';
import { drawTile, drawTall, tallObject, drawTallKind } from '../art/tileArt.js';
import { drawBuilding } from '../art/buildingArt.js';

// Point unique de rendu des cartes.
// Aujourd'hui : pixel art procédural (src/art/), cuit une fois dans une texture par carte.
// Plus tard : remplacer ce corps par un Phaser Tilemap + tileset — le reste du jeu
// n'appelle que renderMap(scene, map).
export function renderMap(scene, map) {
  const key = `map-${map.id}`;
  const { grid } = map;
  const width = grid[0].length * TILE_SIZE;
  const height = grid.length * TILE_SIZE;

  if (!scene.textures.exists(key)) {
    const g = scene.make.graphics({}, false);
    const at = (x, y) => grid[y]?.[x];
    grid.forEach((row, y) => {
      row.forEach((code, x) => {
        // `buildingGround` : sol imposé sous les bâtiments (sinon deviné d'après les voisins).
        const drawn = map.buildingGround && ['R', 'W', 'D'].includes(code) ? map.buildingGround : code;
        drawTile(g, drawn, x, y, at, getTile(drawn).color);
      });
    });
    (map.buildings ?? []).filter((b) => b.type !== 'boat').forEach((b) => drawBuilding(g, b));
    g.generateTexture(key, width, height);
    g.destroy();
  }

  const image = scene.add.image(0, 0, key).setOrigin(0).setDepth(0);
  addTallObjects(scene, map);
  addBoats(scene, map);
  return image;
}

// Bateaux : une image à part, qui tangue doucement sur l'eau.
function addBoats(scene, map) {
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

// Sapins et palmiers : une image chacun, triée en profondeur comme les personnages (depth 10 + y / 10000),
// pour qu'ils passent devant les personnages situés derrière eux.
function addTallObjects(scene, map) {
  const { grid } = map;
  const at = (x, y) => grid[y]?.[x];
  grid.forEach((row, y) => row.forEach((code, x) => {
    const o = tallObject(code, x, y, at);
    if (!o) return;
    const key = `tall-${o.kind}`;
    if (!scene.textures.exists(key)) {
      const g = scene.make.graphics({}, false);
      drawTallKind(g, o.kind);
      g.generateTexture(key, o.w, o.h);
      g.destroy();
    }
    scene.add.image(o.x, o.y, key).setOrigin(0).setDepth(10 + o.baseY / 10000);
  }));
}

// Texture répétable d'une tuile (clé `tile-<code>`), dessinée comme sur les cartes.
// Les sapins forment des blocs de 2x2 cases : leur motif fait 32x32.
function tileSpan(code) {
  return code === 'T' ? 2 : 1;
}

function tileTexture(scene, code) {
  const key = `tile-${code}`;
  if (!scene.textures.exists(key)) {
    const n = tileSpan(code);
    const g = scene.make.graphics({}, false);
    // Deux fois la hauteur du motif : ce qui dépasse vers le haut (cime des sapins) raccorde la répétition.
    for (let y = 0; y < n * 2; y++) {
      for (let x = 0; x < n; x++) drawTile(g, code, x, y, () => code, getTile(code).color);
    }
    for (let y = 0; y < n * 2; y++) {
      for (let x = 0; x < n; x++) drawTall(g, code, x, y, () => code);
    }
    g.generateTexture(key, n * TILE_SIZE, n * TILE_SIZE);
    g.destroy();
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

      const g = scene.make.graphics({}, false);
      g.translateCanvas(-x0 * TILE_SIZE, -y0 * TILE_SIZE);
      for (let y = y0; y <= y1; y++) {
        for (let x = x0; x <= x1; x++) {
          if (inMap(x, y)) continue;
          const code = at(x, y);
          drawTile(g, code, x, y, at, getTile(code).color);
        }
      }
      for (let y = y0; y <= y1; y++) {
        for (let x = x0; x <= x1; x++) if (!inMap(x, y)) drawTall(g, at(x, y), x, y, at);
      }
      image?.destroy();
      if (scene.textures.exists(key)) scene.textures.remove(key);
      g.generateTexture(key, (x1 - x0 + 1) * TILE_SIZE, (y1 - y0 + 1) * TILE_SIZE);
      g.destroy();
      image = scene.add.image(x0 * TILE_SIZE, y0 * TILE_SIZE, key).setOrigin(0).setDepth(-1);
    },
  };
}
