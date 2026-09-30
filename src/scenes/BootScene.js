import Phaser from 'phaser';
import { preloadSpriteSheets, registerSpriteSheets } from '../art/spriteSheets.js';
import { preloadFrlg } from '../art/frlgArt.js';
import { preloadFrlgFont } from '../systems/frlgFont.js';

// Point d'entrée : charge les images, puis affiche l'écran titre (qui lance ensuite l'interface et la partie).
export class BootScene extends Phaser.Scene {
  constructor() {
    super('Boot');
  }

  preload() {
    preloadSpriteSheets(this);
    preloadFrlg(this);
    preloadFrlgFont(this);
  }

  create() {
    registerSpriteSheets(this);
    this.scene.start('Title');
  }
}
