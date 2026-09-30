import Phaser from 'phaser';
import { gameView, SCREEN_W, SCREEN_H } from '../systems/screen.js';
import { FRLG_SHEETS } from '../art/frlgArt.js';

// Traversée en ferry, comme l'écran de voyage des îles Sevii dans Rouge Feu : entre deux bandes noires,
// la mer défile vers la gauche et le ferry file vers la droite dans son sillage, en tanguant.
// Au bout de quelques secondes, fondu au noir puis arrivée (`next` : { sceneKey, data }).
const DURATION = 3600;
const FADE_MS = 400;
const BAND = 36;            // hauteur des bandes noires (en pixels de l'écran de jeu)
const SPEED = 3;            // défilement de la mer, en pixels par image

export class FerryScene extends Phaser.Scene {
  constructor() {
    super('Ferry');
  }

  create({ next }) {
    const cam = this.cameras.main;
    cam.setBackgroundColor(0x000000);
    const fit = () => {
      const v = gameView(this.scale);
      cam.setViewport(v.x, v.y, v.w, v.h);
      cam.setZoom(v.zoom);
      cam.centerOn(SCREEN_W / 2, SCREEN_H / 2);
    };
    fit();
    this.scale.on('resize', fit);
    this.events.once('shutdown', () => this.scale.off('resize', fit));

    this.sea = this.add.tileSprite(0, BAND, SCREEN_W, SCREEN_H - 2 * BAND, FRLG_SHEETS.travelSea).setOrigin(0);
    const ferry = this.add.image(SCREEN_W / 2 + 30, SCREEN_H / 2, FRLG_SHEETS.ferryWake);
    this.tweens.add({ targets: ferry, y: ferry.y + 2, duration: 500, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });

    cam.fadeIn(FADE_MS);
    this.time.delayedCall(DURATION, () => {
      cam.fadeOut(FADE_MS);
      cam.once('camerafadeoutcomplete', () => this.scene.start(next.sceneKey, next.data));
    });
  }

  update() {
    this.sea.tilePositionX += SPEED;
  }
}
