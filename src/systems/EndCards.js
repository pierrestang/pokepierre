import { FullScreenPanel } from './FullScreenPanel.js';
import { SCREEN_W, SCREEN_H } from './screen.js';
import { textWidth, wrapText, LINE_HEIGHT } from './frlgFont.js';

// Les cartons de la toute fin (étape `cards` des scénettes, voir MapScene) : sur fond noir (le rideau de l'UIScene),
// des textes centrés qui apparaissent en fondu, l'un après l'autre. Chaque carton reste au moins HOLD_MS, puis jusqu'à
// un appui (touche ou toucher), au plus AUTO_MS ; il s'efface avant le suivant.
const LIGHT = 0xe8e8f0;
const DIM = 0xa0a0b8;
const MAX_W = SCREEN_W - 48;
const HOLD_MS = 2500;
const AUTO_MS = 14000;

export class EndCards extends FullScreenPanel {
  // `cards` : [{ text, source? }] ; la promesse se résout sur le noir, le dernier carton effacé.
  async play(cards, curtain) {
    const scene = this.scene;
    const wait = (ms) => new Promise((resolve) => scene.time.delayedCall(ms, resolve));
    const tween = (targets, props, duration) => new Promise((resolve) => scene.tweens.add({ targets, ...props, duration, onComplete: resolve }));
    curtain.setAlpha(1);
    this.isOpen = true;
    for (const card of cards) {
      this.card = card;
      this.render();
      await tween(this.objects, { alpha: 1 }, 1400);
      await wait(HOLD_MS);
      await this.waitForPress(AUTO_MS);
      await tween(this.objects, { alpha: 0 }, 1200);
      await wait(600);
    }
    this.close();
  }

  // Un appui (touche ou toucher), ou `ms` écoulées.
  waitForPress(ms) {
    const { scene } = this;
    return new Promise((resolve) => {
      const done = () => {
        scene.input.keyboard.off('keydown', done);
        scene.input.off('pointerdown', done);
        timer.remove();
        resolve();
      };
      const timer = scene.time.delayedCall(ms, done);
      scene.input.keyboard.once('keydown', done);
      scene.input.once('pointerdown', done);
    });
  }

  render() {
    if (!this.card) return;
    const alpha = this.objects[0]?.alpha ?? 0;
    this.begin();
    const { text, source } = this.card;
    const lines = wrapText(this.scene, text, MAX_W);
    const rows = [...lines.map((l) => [l, LIGHT]), ...(source ? [['', LIGHT], [source, DIM]] : [])];
    const top = Math.round((SCREEN_H - rows.length * LINE_HEIGHT) / 2);
    rows.forEach(([line, color], i) => {
      if (line) this.text(line, Math.round((SCREEN_W - textWidth(this.scene, line)) / 2), top + i * LINE_HEIGHT, color).setAlpha(alpha);
    });
  }
}
