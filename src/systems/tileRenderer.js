import { TILE_SIZE, getTile } from '../data/tiles.js';
import { drawTile } from '../art/tileArt.js';
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
    (map.buildings ?? []).forEach((b) => drawBuilding(g, b));
    g.generateTexture(key, width, height);
    g.destroy();
  }

  return scene.add.image(0, 0, key).setOrigin(0).setDepth(0);
}

// Texture 16x16 d'une seule tuile (clé `tile-<code>`), dessinée comme sur les cartes.
function tileTexture(scene, code) {
  const key = `tile-${code}`;
  if (!scene.textures.exists(key)) {
    const g = scene.make.graphics({}, false);
    drawTile(g, code, 0, 0, () => code, getTile(code).color);
    g.generateTexture(key, TILE_SIZE, TILE_SIZE);
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
      fill.setPosition((x0 - 1) * TILE_SIZE, (y0 - 1) * TILE_SIZE);
      fill.setSize((x1 - x0 + 3) * TILE_SIZE, (y1 - y0 + 3) * TILE_SIZE);
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
      image?.destroy();
      if (scene.textures.exists(key)) scene.textures.remove(key);
      g.generateTexture(key, (x1 - x0 + 1) * TILE_SIZE, (y1 - y0 + 1) * TILE_SIZE);
      g.destroy();
      image = scene.add.image(x0 * TILE_SIZE, y0 * TILE_SIZE, key).setOrigin(0).setDepth(-1);
    },
  };
}
