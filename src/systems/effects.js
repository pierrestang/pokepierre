import Phaser from 'phaser';
import { TILE_SIZE } from '../data/tiles.js';
import { drawTallGrassCover } from '../art/tileArt.js';
import { sfx } from './audio.js';

// Effets « modernes » de l'extérieur, dans une esthétique 2D rétro :
// touffes de hautes herbes devant les personnages (et qui frémissent), poussière de sable et feuilles
// sous les pas, vaguelettes qui défilent sur la mer, lumière selon l'heure de la journée.

const S = TILE_SIZE;
const WATER = ['w', '~', 'G'];

// ---------- Hautes herbes ----------

// Touffes fixées à chaque case de hautes herbes, affichées devant le personnage qui s'y tient.
export class GrassCovers {
  constructor(scene, map) {
    this.scene = scene;
    this.map = map;
    this.at = (x, y) => map.grid[y]?.[x];
    this.covers = new Map();
  }

  cover(x, y) {
    const id = `${x},${y}`;
    if (!this.covers.has(id)) {
      const key = `grass-cover-${this.map.id}-${id}`;
      if (!this.scene.textures.exists(key)) {
        const g = this.scene.make.graphics({}, false);
        drawTallGrassCover(g, x, y, this.at);
        g.generateTexture(key, S, 10);
        g.destroy();
      }
      // Juste devant un personnage debout sur cette case (profondeur 10 + y / 10000, joueur + 0.001).
      const image = this.scene.add.image(x * S, y * S + 6, key).setOrigin(0).setVisible(false)
        .setDepth(10 + (y * S + S / 2) / 10000 + 0.002);
      this.covers.set(id, image);
    }
    return this.covers.get(id);
  }

  // Affiche les touffes des cases occupées par les personnages (`sprites`), cache les autres.
  update(sprites) {
    const shown = new Set();
    for (const sprite of sprites) {
      for (const { x, y } of sprite.tiles()) {
        if (this.at(x, y) !== 'ĥ') continue;
        shown.add(`${x},${y}`);
        this.cover(x, y).setVisible(true);
      }
    }
    for (const [id, image] of this.covers) if (!shown.has(id)) image.setVisible(false);
  }

  // Frémissement quand on entre dans une case : les touffes se couchent un instant, des brins s'envolent.
  rustle(x, y) {
    sfx('rustle');
    const image = this.cover(x, y);
    this.scene.tweens.killTweensOf(image);
    image.setScale(1, 1).setY(y * S + 6);
    this.scene.tweens.add({ targets: image, scaleY: 0.8, y: y * S + 8, duration: 90, yoyo: true, ease: 'Sine.easeOut' });
    burst(this.scene, x * S + S / 2, y * S + 10, [0x9ce07c, 0x5cb45c, 0xb0ec8c], 4, 7);
  }
}

// ---------- Particules ----------

// Petits éclats de `colors` qui jaillissent de (x, y), retombent et s'effacent.
function burst(scene, x, y, colors, count, height) {
  for (let i = 0; i < count; i++) {
    const p = scene.add.rectangle(x + Phaser.Math.Between(-5, 5), y, 1, 1, Phaser.Utils.Array.GetRandom(colors))
      .setDepth(10 + y / 10000 + 0.003);
    const dx = Phaser.Math.Between(-7, 7);
    scene.tweens.add({ targets: p, x: p.x + dx, duration: 380, ease: 'Linear' });
    scene.tweens.add({ targets: p, y: y - Phaser.Math.Between(3, height), duration: 180, ease: 'Quad.easeOut', yoyo: true });
    scene.tweens.add({ targets: p, alpha: 0, delay: 200, duration: 180, onComplete: () => p.destroy() });
  }
}

// Poussière sous les pas sur le sable, pétales dans les fleurs.
export function stepEffect(scene, code, x, y) {
  const fx = x * S + S / 2;
  const fy = y * S + S - 2;
  if (code === 's') burst(scene, fx, fy, [0xf0dca0, 0xe0c488, 0xfff4d0], 3, 4);
  else if (code === 'f' || code === 'ƒ') burst(scene, fx, fy, [0xf04030, 0xf8f8f8, 0xf8d030], 2, 5);
}

// Feuilles qui tombent de temps en temps des arbres visibles.
export function startFallingLeaves(scene, map) {
  const trees = [];
  map.grid.forEach((row, y) => row.forEach((c, x) => { if (c === 'T' || c === 'Y') trees.push([x, y]); }));
  if (!trees.length) return;
  scene.time.addEvent({
    delay: 900,
    loop: true,
    callback: () => {
      const [tx, ty] = Phaser.Utils.Array.GetRandom(trees);
      const x = tx * S + Phaser.Math.Between(0, S);
      const y = ty * S - Phaser.Math.Between(4, 14);
      const leaf = scene.add.rectangle(x, y, 2, 1, Phaser.Utils.Array.GetRandom([0x9cd850, 0x6cb844, 0xc8e070]))
        .setDepth(40).setAlpha(0.9);
      const drift = Phaser.Math.Between(-14, 14);
      scene.tweens.add({ targets: leaf, y: y + 22, duration: 2200, ease: 'Linear' });
      scene.tweens.add({ targets: leaf, x: x + drift, duration: 550, yoyo: true, repeat: 1, ease: 'Sine.easeInOut' });
      scene.tweens.add({ targets: leaf, alpha: 0, delay: 1600, duration: 600, onComplete: () => leaf.destroy() });
    },
  });
}

// ---------- Mer animée ----------

// Vaguelettes claires qui défilent lentement sur toutes les cases d'eau (carte et décor autour),
// par-dessus les vagues dessinées : la mer ondule. `outsideIsSea` : le décor autour de la carte est la mer.
export function startSeaShimmer(scene, map, outsideIsSea) {
  const { grid } = map;
  const W = grid[0].length * S;
  const H = grid.length * S;
  const water = [];
  grid.forEach((row, y) => row.forEach((c, x) => { if (WATER.includes(c)) water.push([x, y]); }));
  if (!water.length && !outsideIsSea) return;

  if (!scene.textures.exists('sea-shimmer')) {
    const g = scene.make.graphics({}, false);
    g.fillStyle(0xd8ecff, 1);
    for (const [x, y, w] of [[2, 3, 4], [11, 9, 3], [20, 4, 5], [27, 13, 3], [6, 17, 4], [16, 22, 5], [24, 27, 3], [3, 26, 3]]) {
      g.fillRect(x, y, w, 1);
      g.fillRect(x + 1, y - 1, w - 2, 1);
    }
    g.generateTexture('sea-shimmer', 32, 32);
    g.destroy();
  }
  const margin = 20 * S;
  const layer = scene.add.tileSprite(-margin, -margin, W + 2 * margin, H + 2 * margin, 'sea-shimmer')
    .setOrigin(0).setDepth(1).setAlpha(0.35);

  // Masque : seulement sur l'eau.
  const shape = scene.make.graphics({}, false);
  shape.fillStyle(0xffffff);
  water.forEach(([x, y]) => shape.fillRect(x * S, y * S, S, S));
  if (outsideIsSea) {
    shape.fillRect(-margin, -margin, W + 2 * margin, margin);
    shape.fillRect(-margin, H, W + 2 * margin, margin);
    shape.fillRect(-margin, 0, margin, H);
    shape.fillRect(W, 0, margin, H);
  }
  layer.setMask(shape.createGeometryMask());

  // Défilement lent en diagonale, par pixels entiers (rendu net), avec une respiration de l'opacité.
  let t = 0;
  scene.time.addEvent({
    delay: 120,
    loop: true,
    callback: () => {
      t++;
      layer.tilePositionX = t % 32;
      layer.tilePositionY = Math.floor(t / 2) % 32;
    },
  });
  scene.tweens.add({ targets: layer, alpha: 0.18, duration: 1800, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
}

// ---------- Lumière selon l'heure ----------

// Matin doré, plein jour neutre, soirée orangée, nuit bleutée (heure réelle de l'ordinateur).
// `game.timeOfDay` (console) permet de forcer : 'matin' | 'jour' | 'soir' | 'nuit'.
const LIGHTS = {
  matin: [1.06, 0, 0, 0, 0, 0, 1.0, 0, 0, 0, 0, 0, 0.9, 0, 0, 0, 0, 0, 1, 0],
  jour: null,
  soir: [1.08, 0, 0, 0, 0, 0, 0.88, 0, 0, 0, 0, 0, 0.72, 0, 0, 0, 0, 0, 1, 0],
  nuit: [0.78, 0, 0, 0, 0, 0, 0.84, 0, 0, 0, 0, 0, 1.0, 0, 0, 0, 0, 0, 1, 0],
};

export function currentTimeOfDay(game) {
  if (game.timeOfDay) return game.timeOfDay;
  const h = new Date().getHours();
  if (h >= 6 && h < 9) return 'matin';
  if (h >= 9 && h < 18) return 'jour';
  if (h >= 18 && h < 21) return 'soir';
  return 'nuit';
}

export function applyTimeOfDay(cam, game) {
  if (!cam.postFX) return;
  const matrix = LIGHTS[currentTimeOfDay(game)];
  if (!matrix) return;
  cam.postFX.addColorMatrix().set(matrix);
}

// ---------- Vie de l'île ----------

// Petite texture dessinée une fois (clé `key`), par une fonction (g) => void.
function ensureTexture(scene, key, w, h, draw) {
  if (scene.textures.exists(key)) return key;
  const g = scene.make.graphics({}, false);
  draw(g);
  g.generateTexture(key, w, h);
  g.destroy();
  return key;
}

const px = (g, c, x, y, w = 1, h = 1) => { g.fillStyle(c, 1); g.fillRect(x, y, w, h); };

// Mouettes qui traversent le ciel de temps en temps, leur ombre glisse sur le sol.
export function startSeagulls(scene, map) {
  const W = map.grid[0].length * S;
  const H = map.grid.length * S;
  for (const [key, up] of [['gull-0', true], ['gull-1', false]]) {
    ensureTexture(scene, key, 9, 5, (g) => {
      const k = 0x384050;
      if (up) { px(g, k, 0, 0); px(g, k, 1, 1); px(g, k, 2, 2); px(g, k, 6, 2); px(g, k, 7, 1); px(g, k, 8, 0); }
      else { px(g, k, 0, 3); px(g, k, 1, 2); px(g, k, 2, 2); px(g, k, 6, 2); px(g, k, 7, 2); px(g, k, 8, 3); }
      px(g, 0xf8f8f8, 3, 2, 3, 2);
      px(g, k, 3, 3, 3, 1);
      px(g, 0xf0a030, 6, 2);
    });
  }
  const fly = () => {
    const fromLeft = Math.random() < 0.5;
    const y = Phaser.Math.Between(S * 2, H - S * 4);
    const x0 = fromLeft ? -20 : W + 20;
    const x1 = fromLeft ? W + 20 : -20;
    const gull = scene.add.image(x0, y, 'gull-0').setDepth(45).setFlipX(!fromLeft);
    const shadow = scene.add.ellipse(x0, y + 26, 7, 2, 0x000000, 0.18).setDepth(2);
    let frame = 0;
    const flap = scene.time.addEvent({ delay: 220, loop: true, callback: () => gull.setTexture(`gull-${(frame = 1 - frame)}`) });
    const duration = Phaser.Math.Between(9000, 13000);
    scene.tweens.add({ targets: [gull, shadow], x: x1, duration, ease: 'Linear', onComplete: () => { flap.remove(); gull.destroy(); shadow.destroy(); } });
    scene.tweens.add({ targets: gull, y: y - 6, duration: 1400, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
  };
  scene.time.addEvent({ delay: 7000, loop: true, callback: () => { if (Math.random() < 0.7) fly(); } });
  scene.time.delayedCall(1500, fly);
}

// Un crabe qui se promène de côté sur le sable.
export function startCrabs(scene, map) {
  const spots = [];
  map.grid.forEach((row, y) => row.forEach((c, x) => {
    if (c === 's' && row[x - 1] === 's' && row[x + 1] === 's') spots.push([x, y]);
  }));
  if (!spots.length) return;
  for (const key of ['crab-0', 'crab-1']) {
    ensureTexture(scene, key, 9, 6, (g) => {
      const k = 0x802018;
      const open = key.endsWith('0');
      px(g, k, 1, 1, 7, 4);
      px(g, 0xe84830, 2, 2, 5, 2);
      px(g, 0xf87850, 3, 2, 2, 1);
      px(g, k, 0, open ? 0 : 1, 2, 2);                                  // pinces
      px(g, k, 7, open ? 0 : 1, 2, 2);
      px(g, 0x181818, 3, 1); px(g, 0x181818, 5, 1);                     // yeux
      px(g, k, 1, 5); px(g, k, 3, 5); px(g, k, 5, 5); px(g, k, 7, 5);   // pattes
    });
  }
  const [cx, cy] = Phaser.Utils.Array.GetRandom(spots);
  const crab = scene.add.image(cx * S + 8, cy * S + 10, 'crab-0').setDepth(10 + (cy * S + 10) / 10000);
  let frame = 0;
  scene.time.addEvent({ delay: 260, loop: true, callback: () => crab.setTexture(`crab-${(frame = 1 - frame)}`) });
  const wander = () => {
    const dx = Phaser.Math.Between(-12, 12);
    scene.tweens.add({
      targets: crab, x: Phaser.Math.Clamp(crab.x + dx, cx * S - 8, cx * S + 24), duration: 1400, ease: 'Linear',
      onComplete: () => scene.time.delayedCall(Phaser.Math.Between(800, 2500), wander),
    });
  };
  wander();
}

// Un poisson saute hors de l'eau de temps en temps, avec des ronds dans l'eau.
export function startJumpingFish(scene, map) {
  const sea = [];
  map.grid.forEach((row, y) => row.forEach((c, x) => {
    if (c === 'w' && row[x - 1] === 'w' && row[x + 1] === 'w' && map.grid[y - 1]?.[x] === 'w') sea.push([x, y]);
  }));
  if (!sea.length) return;
  ensureTexture(scene, 'fish', 6, 3, (g) => {
    px(g, 0x284878, 0, 0, 5, 3);
    px(g, 0xa8c8e8, 1, 1, 3, 1);
    px(g, 0x284878, 5, 1);
  });
  const ring = (x, y) => {
    const c = scene.add.ellipse(x, y, 4, 2).setStrokeStyle(1, 0xe0f0ff, 0.9).setDepth(2);
    scene.tweens.add({ targets: c, scaleX: 3, scaleY: 3, alpha: 0, duration: 700, onComplete: () => c.destroy() });
  };
  scene.time.addEvent({
    delay: 4200,
    loop: true,
    callback: () => {
      if (Math.random() < 0.35) return;
      const [tx, ty] = Phaser.Utils.Array.GetRandom(sea);
      const x = tx * S + 8;
      const y = ty * S + 10;
      const dir = Math.random() < 0.5 ? -1 : 1;
      const fish = scene.add.image(x, y, 'fish').setDepth(3).setFlipX(dir < 0);
      ring(x, y);
      scene.tweens.add({ targets: fish, x: x + dir * 12, duration: 600, ease: 'Linear' });
      scene.tweens.add({
        targets: fish, y: y - 9, duration: 300, yoyo: true, ease: 'Quad.easeOut',
        onComplete: () => { ring(fish.x, y); fish.destroy(); },
      });
      scene.tweens.add({ targets: fish, angle: dir * 60, duration: 600 });
    },
  });
}

// Écume du rivage : une deuxième image de l'écume, en alternance avec celle de la carte (le bord bouge).
export function startShoreFoam(scene, map) {
  const at = (x, y) => map.grid[y]?.[x];
  const land = (x, y) => { const n = at(x, y); return n !== undefined && !['w', '~', '=', 'B', 'ø'].includes(n); };
  const edges = { top: [0, -1], bottom: [0, 1], left: [-1, 0], right: [1, 0] };
  for (const side of Object.keys(edges)) {
    ensureTexture(scene, `foam-${side}`, S, S, (g) => {
      const horizontal = side === 'top' || side === 'bottom';
      const inner = side === 'top' || side === 'left' ? 0 : S - 4;
      for (let i = 0; i < S; i++) {
        const wave = (i % 5 === 0 ? 1 : 0) + (i % 7 === 3 ? 1 : 0);
        const depth = 3 + wave;
        const x = horizontal ? i : side === 'left' ? 0 : S - depth;
        const y = horizontal ? (side === 'top' ? 0 : S - depth) : i;
        g.fillStyle(0xf8fcff, 1);
        g.fillRect(x, y, horizontal ? 1 : depth, horizontal ? depth : 1);
      }
      g.fillStyle(0xc8e0f8, 1);
      for (let i = 2; i < S; i += 5) {
        if (horizontal) g.fillRect(i, inner === 0 ? 5 : S - 6, 1, 1);
        else g.fillRect(inner === 0 ? 5 : S - 6, i, 1, 1);
      }
    });
  }
  const overlays = [];
  map.grid.forEach((row, y) => row.forEach((c, x) => {
    if (c !== 'w') return;
    for (const [side, [dx, dy]] of Object.entries(edges)) {
      if (land(x + dx, y + dy)) overlays.push(scene.add.image(x * S, y * S, `foam-${side}`).setOrigin(0).setDepth(1.5).setVisible(false));
    }
  }));
  if (!overlays.length) return;
  scene.time.addEvent({ delay: 650, loop: true, callback: () => overlays.forEach((o) => o.setVisible(!o.visible)) });
}

// Traces de pas dans le sable, qui s'effacent peu à peu.
export function footprint(scene, x, y, facing) {
  const vertical = facing === 'up' || facing === 'down';
  const g = scene.add.graphics().setDepth(1.6);
  g.fillStyle(0xc8a868, 0.8);
  if (vertical) { g.fillRect(x * S + 5, y * S + 9, 2, 3); g.fillRect(x * S + 9, y * S + 5, 2, 3); }
  else { g.fillRect(x * S + 4, y * S + 11, 3, 2); g.fillRect(x * S + 9, y * S + 8, 3, 2); }
  scene.tweens.add({ targets: g, alpha: 0, delay: 1800, duration: 1600, onComplete: () => g.destroy() });
}

// Fenêtres éclairées le soir et la nuit (lueur chaude sur les vitres).
const WINDOWS = {
  house: [[41, 45, 12, 8], [59, 45, 12, 8]],
  beachHut: [[34, 29, 6, 6]],
};
export function lightWindows(scene, map, game) {
  const time = currentTimeOfDay(game);
  if (time !== 'soir' && time !== 'nuit') return;
  for (const b of map.buildings ?? []) {
    for (const [wx, wy, w, h] of WINDOWS[b.type] ?? []) {
      const x = b.x * S + wx;
      const y = b.y * S + wy;
      scene.add.ellipse(x + w / 2, y + h + 4, w * 2.2, h * 1.4, 0xffd870, 0.16).setDepth(1.7);
      const glass = scene.add.rectangle(x, y, w, h, 0xffe890, 0.85).setOrigin(0).setDepth(1.8);
      scene.tweens.add({ targets: glass, alpha: 0.7, duration: 1600, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    }
  }
}

// Bulle « ! » au-dessus de ce à quoi le joueur fait face (personnage ou objet à examiner).
export class InteractHint {
  constructor(scene) {
    this.scene = scene;
    ensureTexture(scene, 'hint-bubble', 9, 11, (g) => {
      px(g, 0x283048, 1, 0, 7, 9);
      px(g, 0x283048, 0, 1, 9, 7);
      px(g, 0xffffff, 1, 1, 7, 7);
      px(g, 0xffffff, 2, 0, 5, 1);
      px(g, 0x181820, 4, 2, 1, 3);                                       // ! noir
      px(g, 0x181820, 4, 6, 1, 1);
      px(g, 0x283048, 3, 9, 3, 1);                                       // pointe de la bulle
      px(g, 0xffffff, 4, 9, 1, 1);
      px(g, 0x283048, 4, 10, 1, 1);
    });
    this.image = scene.add.image(0, 0, 'hint-bubble').setOrigin(0.5, 1).setDepth(55).setVisible(false);
    this.target = null;
    this.baseY = 0;
    // Petit rebond d'un pixel, par pixels entiers (rendu net).
    const bounce = (time) => {
      if (this.image.visible) this.image.y = this.baseY - (Math.floor(time / 380) % 2);
    };
    scene.events.on('update', bounce);
    scene.events.once('shutdown', () => scene.events.off('update', bounce));
  }

  // `tile` : case visée ou null ; `tall` : un personnage (bulle au-dessus de sa tête).
  show(tile, tall) {
    const key = tile ? `${tile.x},${tile.y},${tall}` : null;
    if (key === this.target) return;
    this.target = key;
    if (!tile) return this.image.setVisible(false);
    this.baseY = tile.y * S + (tall ? -3 : 1);
    this.image.setPosition(tile.x * S + S / 2, this.baseY).setVisible(true);
  }
}
