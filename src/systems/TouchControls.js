import { gameView, FONT } from './screen.js';

// Commandes tactiles (téléphone, tablette) : croix directionnelle à gauche, boutons A (Entrée),
// B (Maj : courir, maintenu) et START (Échap) à droite. Chaque bouton simule la touche du clavier,
// le reste du jeu n'y voit aucune différence. Affichées seulement sur un écran tactile.
const BUTTONS = [
  { id: 'up', key: 'ArrowUp', code: 'ArrowUp', keyCode: 38, label: '▲' },
  { id: 'down', key: 'ArrowDown', code: 'ArrowDown', keyCode: 40, label: '▼' },
  { id: 'left', key: 'ArrowLeft', code: 'ArrowLeft', keyCode: 37, label: '◀' },
  { id: 'right', key: 'ArrowRight', code: 'ArrowRight', keyCode: 39, label: '▶' },
  { id: 'a', key: 'Enter', code: 'Enter', keyCode: 13, label: 'A' },
  { id: 'b', key: 'Shift', code: 'ShiftLeft', keyCode: 16, label: 'B' },
  { id: 'start', key: 'Escape', code: 'Escape', keyCode: 27, label: 'START' },
];

function press(b, type) {
  window.dispatchEvent(new KeyboardEvent(type, { key: b.key, code: b.code, keyCode: b.keyCode, bubbles: true }));
}

export function isTouchDevice() {
  return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
}

export class TouchControls {
  constructor(scene) {
    this.scene = scene;
    scene.input.addPointer(2);                                         // plusieurs doigts à la fois
    this.buttons = BUTTONS.map((b) => {
      const shape = scene.add.circle(0, 0, 10, 0xffffff, 0.22).setStrokeStyle(2, 0xffffff, 0.5).setDepth(120)
        .setInteractive();
      const text = scene.add.text(0, 0, b.label, { fontFamily: FONT, color: '#ffffff', fontStyle: 'bold' })
        .setOrigin(0.5).setDepth(121).setAlpha(0.85);
      let held = false;
      const down = () => { if (!held) { held = true; shape.setFillStyle(0xffffff, 0.45); press(b, 'keydown'); } };
      const up = () => { if (held) { held = false; shape.setFillStyle(0xffffff, 0.22); press(b, 'keyup'); } };
      shape.on('pointerdown', down);
      shape.on('pointerup', up);
      shape.on('pointerout', up);
      return { ...b, shape, text };
    });
    this.layout();
    scene.scale.on('resize', this.layout, this);
  }

  // Dans les bandes noires si elles sont assez larges, sinon par-dessus le bas de l'écran de jeu.
  layout() {
    const { width, height } = this.scene.scale;
    const v = gameView(this.scene.scale);
    const r = Math.max(22, Math.min(width, height) * 0.06);
    const pad = r * 3.4;
    const leftX = Math.max(pad, v.x / 2);
    const rightX = Math.min(width - pad, v.x + v.w + (width - v.x - v.w) / 2);
    const cy = height - pad;
    const place = {
      up: [leftX, cy - r * 1.9], down: [leftX, cy + r * 1.9], left: [leftX - r * 1.9, cy], right: [leftX + r * 1.9, cy],
      a: [rightX + r * 1.2, cy - r * 0.8], b: [rightX - r * 1.2, cy + r * 0.8], start: [width / 2, height - r * 0.9],
    };
    for (const b of this.buttons) {
      const [x, y] = place[b.id];
      const radius = b.id === 'start' ? r * 0.7 : r;
      b.shape.setPosition(x, y).setRadius(radius);
      b.text.setPosition(x, y).setFontSize(Math.round(b.id === 'start' ? r * 0.45 : r * 0.8));
    }
  }
}
