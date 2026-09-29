import Phaser from 'phaser';

// Point d'entrée : affiche l'écran titre (qui lance ensuite l'interface et la partie).
export class BootScene extends Phaser.Scene {
  constructor() {
    super('Boot');
  }

  create() {
    this.scene.start('Title');
  }
}
