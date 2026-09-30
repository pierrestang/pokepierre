import Phaser from 'phaser';
import { TILE_SIZE } from '../data/tiles.js';
import { characterTexture, lookFromColor } from '../art/characterArt.js';
import { sheetOf } from '../art/spriteSheets.js';

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
// `appearance` : `{ sprite: 't4' | 'f0' … }` (planches fournies, voir art/spriteSheets.js), une apparence
// dessinée (voir art/characterArt.js, ex. le chat) ou une simple couleur de haut.
export class CharacterSprite extends Phaser.GameObjects.Container {
  constructor(scene, x, y, appearance, facing = 'down', { hat = false } = {}) {
    super(scene, ...tileCenter(x, y));
    if (appearance?.sprite) {
      // TownsPeople2 : pieds sur l'avant-dernière ligne de l'image ; Rouge Feu : sur la dernière.
      const sheet = sheetOf(appearance.sprite);
      const foot = sheet.key === 'townsfolk' ? 1 : 0;
      this.prefix = `${appearance.sprite}-`;
      this.image = scene.add.image(0, TILE_SIZE / 2 + foot, sheet.key, `${this.prefix}${facing}-0`).setOrigin(0.5, 1);
    } else {
      const look = typeof appearance === 'number' ? lookFromColor(appearance, { hat }) : appearance;
      this.prefix = '';
      this.image = scene.add.image(0, TILE_SIZE / 2, characterTexture(scene, look), `${facing}-0`).setOrigin(0.5, 1);
    }
    this.add(this.image);
    this.foot = 0;
    scene.add.existing(this);
    this.setFacing(facing);
    this.updateDepth();
  }

  setFacing(dir) {
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
