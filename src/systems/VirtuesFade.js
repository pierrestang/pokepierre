import { FullScreenPanel } from './FullScreenPanel.js';
import { SCREEN_W } from './screen.js';
import { textWidth } from './frlgFont.js';
import { TRAITS } from '../data/story.js';

// Fin du jeu (étape `virtuesFade` des scénettes, voir MapScene) : le décor s'efface dans un fondu au noir lent (le
// rideau de l'UIScene) ; pendant ce temps, le carnet des huit vertus s'affiche une à une, de la Joie de vivre à la
// Liberté, qui s'illumine en dernier avec sa phrase. Puis tout s'éteint : noir complet.
const STEP_MS = 650;          // une vertu de plus toutes les STEP_MS
const LIGHT = 0xe8e8f0;
const GOLD = 0xf8d048;

export class VirtuesFade extends FullScreenPanel {
  // Joue le fondu ; la promesse se résout sur le noir complet (le rideau reste noir).
  async play(curtain) {
    const scene = this.scene;
    const wait = (ms) => new Promise((resolve) => scene.time.delayedCall(ms, resolve));
    const tween = (targets, props, duration) => new Promise((resolve) => scene.tweens.add({ targets, ...props, duration, onComplete: resolve }));
    this.isOpen = true;
    this.begin();
    const traits = Object.values(TRAITS);
    const top = 40;
    const lines = traits.map((t, i) => {
      const x = Math.round((SCREEN_W - textWidth(scene, t.name)) / 2);
      return this.text(t.name, x, top + i * 18, LIGHT).setAlpha(0);
    });
    // Le décor s'efface lentement (pas de flash) ; les vertus apparaissent une à une pendant ce temps.
    const darkening = tween(curtain, { alpha: 1 }, STEP_MS * traits.length + 600);
    for (const line of lines) {
      tween(line, { alpha: 1 }, 500);
      await wait(STEP_MS);
    }
    await darkening;
    // La Liberté, la dernière, s'illumine : or, petite pulsation, et sa phrase dessous.
    const last = lines[lines.length - 1];
    last.setTintFill(GOLD);
    scene.tweens.add({ targets: last, alpha: { from: 1, to: 0.55 }, duration: 600, yoyo: true, repeat: 3 });
    const phrase = traits[traits.length - 1].phrase;
    const words = phrase.split(' ');
    const half = Math.ceil(words.length / 2);
    const rows = [words.slice(0, half).join(' '), words.slice(half).join(' ')];
    const sentence = rows.map((row, i) => this.text(row, Math.round((SCREEN_W - textWidth(scene, row)) / 2),
      top + traits.length * 18 + 14 + i * 16, LIGHT).setAlpha(0));
    await tween(sentence, { alpha: 1 }, 900);
    await wait(3200);
    // Tout s'éteint : noir complet.
    await tween([...lines, ...sentence], { alpha: 0 }, 1600);
    await wait(800);
    this.close();
  }

  render() {}
}
