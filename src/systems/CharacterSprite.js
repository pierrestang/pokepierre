import Phaser from 'phaser';
import { TILE_SIZE } from '../data/tiles.js';
import { characterTexture, lookFromColor } from '../art/characterArt.js';
import { sheetOf } from '../art/spriteSheets.js';
import { BED_LOWER } from '../art/frlgArt.js';

export const DIRECTIONS = {
  up:    { dx: 0,  dy: -1 },
  down:  { dx: 0,  dy: 1 },
  left:  { dx: -1, dy: 0 },
  right: { dx: 1,  dy: 0 },
};

export const OPPOSITE = { up: 'down', down: 'up', left: 'right', right: 'left' };

export function tileCenter(x, y) {
  return [x * TILE_SIZE + TILE_SIZE / 2, y * TILE_SIZE + TILE_SIZE / 2];
}

// Personnage animé (joueur ou PNJ) posé sur sa case, la tête dépasse au-dessus.
// `appearance` : `{ sprite: 'g198' … }` (planches fournies, voir art/spriteSheets.js), une apparence
// dessinée (voir art/characterArt.js, ex. le chat) ou une simple couleur de haut.
// `bed` : { px, py, child? } : couché dans le lit dont l'image commence en (px, py) (voir frlgArt.bedAt).
export class CharacterSprite extends Phaser.GameObjects.Container {
  constructor(scene, x, y, appearance, facing = 'down', { hat = false, bed = null } = {}) {
    super(scene, ...tileCenter(x, y));
    if (appearance?.sprite) {
      // Pieds sur la dernière ligne de l'image.
      const sheet = sheetOf(appearance.sprite);
      this.prefix = `${appearance.sprite}-`;
      this.image = scene.add.image(0, TILE_SIZE / 2, sheet.key, `${this.prefix}${facing}-0`).setOrigin(0.5, 1);
    } else {
      const look = typeof appearance === 'number' ? lookFromColor(appearance, { hat }) : appearance;
      this.prefix = '';
      this.image = scene.add.image(0, TILE_SIZE / 2, characterTexture(scene, look), `${facing}-0`).setOrigin(0.5, 1);
    }
    this.add(this.image);
    this.foot = 0;
    scene.add.existing(this);
    this.setFacing(facing);
    if (bed) this.lieInBed(bed);
    this.updateDepth();
  }

  // Couché sur le dos, la tête sur l'oreiller : le bas du lit est redessiné par-dessus le corps, avec la
  // bosse du corps sous la couverture (plus courte pour un enfant).
  lieInBed({ px, py, child = false }) {
    this.setFacing('down');
    this.inBed = true;
    this.setPosition(px + 12, py);
    this.image.setOrigin(0.5, 0).setPosition(0, -4);
    const textures = this.scene.textures;
    const frame = 'bed-lower';
    if (!textures.get(BED_LOWER.sheet).has(frame)) {
      textures.get(BED_LOWER.sheet).add(frame, 0, BED_LOWER.sx, BED_LOWER.sy, BED_LOWER.w, BED_LOWER.h);
    }
    this.add(this.scene.add.image(-12, 13, BED_LOWER.sheet, frame).setOrigin(0));
    const bottom = child ? 21 : 25;
    const g = this.scene.add.graphics();
    g.fillStyle(0xa8a8f8).fillRect(-5, 16, 9, bottom - 16).fillRect(-4, bottom, 7, 1);
    g.fillStyle(0x7078d8).fillRect(4, 17, 1, bottom - 17).fillRect(-4, bottom + 1, 7, 1).fillRect(3, bottom, 1, 1);
    this.add(g);
  }

  setFacing(dir) {
    if (this.inBed) return;
    this.facing = dir;
    this.image.setFrame(`${this.prefix}${dir}-0`);
  }

  // Un pas animé de `duration` ms : pied gauche puis pied droit en alternance, retour debout à la fin.
  walkStep(duration) {
    this.foot = 1 - this.foot;
    this.image.setFrame(`${this.prefix}${this.facing}-${1 + this.foot}`);
    this.walkTimer?.remove();
    this.walkTimer = this.scene.time.delayedCall(duration * 0.6, () => this.image.setFrame(`${this.prefix}${this.facing}-0`));
  }

  // Les personnages plus bas à l'écran passent devant ceux du dessus (`bias` : le joueur devant ses suiveurs).
  updateDepth(bias = 0) {
    this.setDepth(10 + this.y / 10000 + bias);
  }

  // Case sous les pieds du personnage (pendant un pas, celle dont il est le plus proche).
  tile() {
    return { x: Math.floor(this.x / TILE_SIZE), y: Math.floor(this.y / TILE_SIZE) };
  }

  // Cases touchées par le personnage : une seule à l'arrêt, les deux pendant un pas.
  tiles() {
    const xs = [Math.floor((this.x - 7) / TILE_SIZE), Math.floor((this.x + 7) / TILE_SIZE)];
    const ys = [Math.floor((this.y - 7) / TILE_SIZE), Math.floor((this.y + 7) / TILE_SIZE)];
    const out = [];
    for (const tx of new Set(xs)) for (const ty of new Set(ys)) out.push({ x: tx, y: ty });
    return out;
  }
}
