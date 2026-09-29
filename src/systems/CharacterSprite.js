import Phaser from 'phaser';
import { TILE_SIZE } from '../data/tiles.js';

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

// Personnage provisoire (joueur ou PNJ) : carré coloré + petit indicateur de direction.
export class CharacterSprite extends Phaser.GameObjects.Container {
  // options.hat : toque de diplômé (carré noir + pompon doré) sur le dessus.
  constructor(scene, x, y, color, facing = 'down', { hat = false } = {}) {
    super(scene, ...tileCenter(x, y));
    const stroke = Phaser.Display.Color.IntegerToColor(color).darken(40).color;
    this.indicator = scene.add.rectangle(0, 0, 4, 4, 0xffffff);
    this.add([scene.add.rectangle(0, 0, 12, 12, color).setStrokeStyle(1, stroke), this.indicator]);
    if (hat) {
      this.add([
        scene.add.rectangle(0, -7, 14, 3, 0x101014),
        scene.add.rectangle(0, -5, 6, 3, 0x101014),
        scene.add.rectangle(5, -5, 1, 4, 0xe8c040),
      ]);
    }
    scene.add.existing(this);
    this.setDepth(10);
    this.setFacing(facing);
  }

  setFacing(dir) {
    this.facing = dir;
    const { dx, dy } = DIRECTIONS[dir];
    this.indicator.setPosition(dx * 4, dy * 4);
  }
}
