import Phaser from 'phaser';
import { CharacterSprite, DIRECTIONS, tileCenter } from './CharacterSprite.js';
import { lookOf } from '../data/characters.js';
import { TILE_SIZE } from '../data/tiles.js';

// Rondes de nuit, façon dresseurs Pokémon : des militaires font le tour d'un circuit (plusieurs points de passage,
// en boucle ; deux points : un aller-retour), lampe à la main ; devant eux, un cône de lumière. Si Pierre se tient dans
// un cône, il est pris (la scène joue `caught`, voir MapScene.caughtBy). À chaque point de passage, ils s'arrêtent et
// balaient les côtés avec leur lampe avant de repartir.
// map.patrols : { ifFlags?, unlessFlags?, name?, guards: [{ id, path: [[x, y], …], range?, sprite? }],
//                 caught: { speaker, say: [pages], back: { x, y, facing } } }
const STEP_MS = 420;        // un pas, un peu plus lent que Pierre
const LOOK_MS = 520;        // un regard sur le côté, au point de passage
const RANGE = 3;            // portée de la lampe, en cases
const SIDES = { up: ['left', 'right'], down: ['right', 'left'], left: ['up', 'down'], right: ['down', 'up'] };

const sign = (n) => Math.sign(n);
const ANGLE = { right: 0, down: Math.PI / 2, left: Math.PI, up: -Math.PI / 2 };

// Faisceau de la lampe, vers la droite (tourné selon la direction), long de `tiles` cases (il s'arrête au premier
// obstacle) : un pinceau qui s'évase depuis la main, plus clair au centre (couches superposées) et qui s'éteint vers le
// bout, où il fait une petite flaque de lumière au sol. La détection, elle, se fait par cases (voir cone).
function beamTexture(scene, tiles) {
  const key = `lamp-beam-v2-${tiles}`;
  if (scene.textures.exists(key)) return key;
  const L = tiles * TILE_SIZE + 6;
  const half = (t) => Math.min(22, 1.5 + t * 0.5);
  const h = Math.ceil(2 * half(L)) + 8;
  const tex = scene.textures.createCanvas(key, L + 4, h);
  const ctx = tex.getContext();
  const cy = h / 2;
  const fade = ctx.createLinearGradient(0, 0, L, 0);
  fade.addColorStop(0, 'rgba(255, 244, 200, 1)');
  fade.addColorStop(0.7, 'rgba(255, 236, 170, 0.55)');
  fade.addColorStop(1, 'rgba(255, 228, 150, 0)');
  ctx.fillStyle = fade;
  for (const [k, a] of [[1.15, 0.1], [1, 0.12], [0.75, 0.14], [0.45, 0.16]]) {
    ctx.globalAlpha = a;
    ctx.beginPath();
    ctx.moveTo(0, cy - 1);
    ctx.lineTo(L, cy - half(L) * k);
    ctx.lineTo(L, cy + half(L) * k);
    ctx.lineTo(0, cy + 1);
    ctx.closePath();
    ctx.fill();
  }
  ctx.globalAlpha = 1;
  const px = Math.max(8, L - 10);
  const pool = ctx.createRadialGradient(px, cy, 1, px, cy, 12);
  pool.addColorStop(0, 'rgba(255, 240, 190, 0.22)');
  pool.addColorStop(1, 'rgba(255, 240, 190, 0)');
  ctx.fillStyle = pool;
  ctx.fillRect(px - 12, cy - 12, 24, 24);
  tex.refresh();
  return key;
}
function dirTo([x, y], [tx, ty]) {
  if (tx !== x) return tx > x ? 'right' : 'left';
  return ty > y ? 'down' : 'up';
}

export class Patrols {
  constructor(scene, spec) {
    this.scene = scene;
    this.spec = spec;
    this.guards = spec.guards.map((g) => {
      const [x, y] = g.path[0];
      const facing = dirTo(g.path[0], g.path[1]);
      const sprite = new CharacterSprite(scene, x, y, lookOf({ id: g.id, name: spec.name ?? 'Militaire', sprite: g.sprite }), facing);
      // La lumière passe par-dessus le voile de la nuit (voir MapScene.applyAmbience) : le faisceau, et la lampe elle-même,
      // un petit point chaud dans la main.
      const beam = scene.add.image(0, 0, beamTexture(scene, 1)).setOrigin(0, 0.5).setDepth(41)
        .setBlendMode(Phaser.BlendModes.ADD);
      const lamp = scene.add.container(0, 0).setDepth(41);
      for (const [w, a] of [[9, 0.25], [4, 0.6]]) lamp.add(scene.add.ellipse(0, 0, w, w, 0xfff0b0, a).setBlendMode(Phaser.BlendModes.ADD));
      // Circuit : en boucle à partir de trois points, aller-retour sur deux.
      const loop = g.loop ?? g.path.length > 2;
      return { ...g, x, y, facing, target: 1, step: 1, loop, sprite, beam, lamp, looks: [], moving: false, waitUntil: 0 };
    });
  }

  // Case occupée par un militaire (ou celle où il est en train d'aller).
  occupies(x, y) {
    return this.guards.some((g) => g.x === x && g.y === y);
  }

  // Cases éclairées : droit devant sur `range` cases (jusqu'au premier obstacle), une de plus de chaque côté à
  // partir de la deuxième, pour faire un cône.
  cone(g) {
    const { dx, dy } = DIRECTIONS[g.facing];
    const tiles = [];
    for (let d = 1; d <= (g.range ?? RANGE); d++) {
      const cx = g.x + dx * d;
      const cy = g.y + dy * d;
      if (!this.scene.tileWalkable(cx, cy)) break;
      const spread = d === 1 ? 0 : 1;
      for (let s = -spread; s <= spread; s++) {
        const tx = cx + (dx ? 0 : s);
        const ty = cy + (dx ? s : 0);
        if (this.scene.tileWalkable(tx, ty)) tiles.push([tx, ty, d]);
      }
    }
    return tiles;
  }

  // Appelé à chaque image. `paused` : scénette, dialogue ou menu en cours (les militaires attendent).
  update(paused) {
    const now = this.scene.time.now;
    if (!paused) for (const g of this.guards) this.advance(g, now);
    this.draw();
    if (paused) return null;
    // Pris : Pierre (arrêté sur sa case) dans un cône.
    const p = this.scene.player;
    if (p.moving) return null;
    return this.guards.find((g) => this.cone(g).some(([x, y]) => x === p.tileX && y === p.tileY)) ?? null;
  }

  advance(g, now) {
    if (g.moving || now < g.waitUntil) return;
    // Au point de passage : les regards sur les côtés, un à un, puis vers le point suivant.
    if (g.looks.length) {
      g.facing = g.looks.shift();
      g.sprite.setFacing(g.facing);
      g.waitUntil = now + LOOK_MS;
      return;
    }
    const [tx, ty] = g.path[g.target];
    if (g.x === tx && g.y === ty) {
      // Point suivant du circuit (en boucle, ou demi-tour au bout d'un aller-retour).
      const n = g.path.length;
      if (g.loop) g.target = (g.target + 1) % n;
      else {
        if (g.target + g.step < 0 || g.target + g.step >= n) g.step = -g.step;
        g.target += g.step;
      }
      const next = dirTo([g.x, g.y], g.path[g.target]);
      g.looks = [...SIDES[g.facing].filter((d) => d !== next).slice(0, 1), next];
      g.waitUntil = now + 250;
      return;
    }
    const nx = g.x + sign(tx - g.x);
    const ny = g.y + (nx === g.x ? sign(ty - g.y) : 0);
    const p = this.scene.player;
    if (p.tileX === nx && p.tileY === ny) {
      g.waitUntil = now + 200;                                     // Pierre est sur le chemin : il attend
      return;
    }
    g.facing = dirTo([g.x, g.y], [nx, ny]);
    g.sprite.setFacing(g.facing);
    g.x = nx;
    g.y = ny;
    g.moving = true;
    g.sprite.walkStep(STEP_MS);
    const [px, py] = tileCenter(nx, ny);
    this.scene.tweens.add({
      targets: g.sprite, x: px, y: py, duration: STEP_MS,
      onUpdate: () => g.sprite.updateDepth(),
      onComplete: () => { g.moving = false; },
    });
  }

  // Faisceaux des lampes : ils suivent le militaire pendant son pas et tournent avec lui (le faisceau part de sa main) ;
  // ils s'arrêtent au premier obstacle (mur, barrière), comme la détection.
  draw() {
    for (const g of this.guards) {
      const { dx, dy } = DIRECTIONS[g.facing];
      const range = g.range ?? RANGE;
      let free = 0;
      while (free < range && this.scene.tileWalkable(g.x + dx * (free + 1), g.y + dy * (free + 1))) free++;
      // La main tient la lampe un peu de côté et devant ; de dos (vers le haut), elle est cachée par le corps et le
      // faisceau part de devant sa tête.
      const hx = g.sprite.x + dx * 6 + (dy ? 4 : 0);
      const hy = g.sprite.y + (dy < 0 ? -10 : 2 + dy * 4);
      g.lamp.setPosition(hx, hy).setVisible(g.facing !== 'up');
      if (g.beamTiles !== free) {
        g.beamTiles = free;
        g.beam.setTexture(beamTexture(this.scene, Math.max(free, 0.4)));
      }
      g.beam.setPosition(hx, hy).setRotation(ANGLE[g.facing]);
    }
  }
}
