import { CharacterSprite, DIRECTIONS, tileCenter } from './CharacterSprite.js';
import { pierreLook } from '../data/characters.js';
import { sfx } from './audio.js';

// Vitesse de marche façon Pokémon (≈ 220 ms par case), course en maintenant Maj, vélo (voir systems/bike.js).
export const WALK_DURATION = 220;
export const RUN_DURATION = 120;
export const BIKE_DURATION = 75;
const BUMP_EVERY = 320;   // ms entre deux « bump » contre un obstacle

const KEY_TO_DIR = { ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right' };

// Joueur : déplacement case par case, interpolé. Maintenir la flèche = continuer d'avancer,
// Maj = courir, à vélo : plus vite encore. Contre un obstacle : pas sur place et petit bruit sourd, comme dans Pokémon.
export class Player {
  constructor(scene, { x, y, facing = 'down' }, { isWalkable, onStep, onMoveStart }) {
    this.scene = scene;
    this.tileX = x;
    this.tileY = y;
    this.facing = facing;
    this.moving = false;
    this.frozen = false;
    this.riding = false;              // à vélo (voir systems/bike.js)
    this.isWalkable = isWalkable;
    this.onStep = onStep;
    this.onMoveStart = onMoveStart;

    this.sprite = new CharacterSprite(scene, x, y, pierreLook(), facing);
    this.sprite.updateDepth(0.001);

    this.cursors = scene.input.keyboard.createCursorKeys();
    this.bumpAt = 0;
    // Un appui très bref peut être relâché avant la frame suivante : on le mémorise.
    this.queued = null;
    scene.input.keyboard.on('keydown', (e) => {
      const dir = KEY_TO_DIR[e.key];
      if (dir) this.queued = dir;
    });
  }

  // Monter sur le vélo ou en descendre (l'image et la vitesse ; les règles sont dans systems/bike.js).
  setRiding(on) {
    this.riding = on;
    this.sprite.setBike(on);
  }

  // Case située juste devant le joueur.
  facingTile() {
    const { dx, dy } = DIRECTIONS[this.facing];
    return { x: this.tileX + dx, y: this.tileY + dy };
  }

  heldDirection() {
    const c = this.cursors;
    if (c.up.isDown) return 'up';
    if (c.down.isDown) return 'down';
    if (c.left.isDown) return 'left';
    if (c.right.isDown) return 'right';
    return null;
  }

  update() {
    if (this.moving || this.frozen) return;
    const dir = this.heldDirection() ?? this.queued;
    this.queued = null;
    if (!dir) return;

    this.facing = dir;
    this.sprite.setFacing(dir);

    const { dx, dy } = DIRECTIONS[dir];
    const nx = this.tileX + dx;
    const ny = this.tileY + dy;
    if (!this.isWalkable(nx, ny)) {
      const now = this.scene.time.now;
      if (now >= this.bumpAt) {
        this.bumpAt = now + BUMP_EVERY;
        sfx('bump');
        this.sprite.walkStep(BUMP_EVERY * 0.8);                       // pas sur place
      }
      return;
    }

    const duration = this.riding ? BIKE_DURATION : this.cursors.shift.isDown ? RUN_DURATION : WALK_DURATION;
    this.moving = true;
    this.onMoveStart?.(this.tileX, this.tileY, nx, ny, duration);
    const [px, py] = tileCenter(nx, ny);
    this.sprite.walkStep(duration);
    this.scene.tweens.add({
      targets: this.sprite,
      x: px,
      y: py,
      duration,
      onUpdate: () => this.sprite.updateDepth(0.001),
      onComplete: () => {
        this.tileX = nx;
        this.tileY = ny;
        this.moving = false;
        this.onStep?.(nx, ny);
        // Si la touche est toujours maintenue, update() relance le pas suivant.
      },
    });
  }
}
