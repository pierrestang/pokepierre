import { CharacterSprite, DIRECTIONS, tileCenter } from './CharacterSprite.js';

const STEP_DURATION = 150; // ms par case

const KEY_TO_DIR = { ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right' };

// Joueur : déplacement case par case, interpolé. Maintenir la flèche = continuer d'avancer.
export class Player {
  constructor(scene, { x, y, facing = 'down' }, { isWalkable, onStep, onMoveStart }) {
    this.scene = scene;
    this.tileX = x;
    this.tileY = y;
    this.facing = facing;
    this.moving = false;
    this.frozen = false;
    this.isWalkable = isWalkable;
    this.onStep = onStep;
    this.onMoveStart = onMoveStart;

    this.sprite = new CharacterSprite(scene, x, y, 0xe53935, facing);

    this.cursors = scene.input.keyboard.createCursorKeys();
    // Un appui très bref peut être relâché avant la frame suivante : on le mémorise.
    this.queued = null;
    scene.input.keyboard.on('keydown', (e) => {
      const dir = KEY_TO_DIR[e.key];
      if (dir) this.queued = dir;
    });
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
    if (!this.isWalkable(nx, ny)) return;

    this.moving = true;
    this.onMoveStart?.(this.tileX, this.tileY);
    const [px, py] = tileCenter(nx, ny);
    this.scene.tweens.add({
      targets: this.sprite,
      x: px,
      y: py,
      duration: STEP_DURATION,
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
