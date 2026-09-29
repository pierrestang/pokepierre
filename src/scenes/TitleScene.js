import Phaser from 'phaser';
import { START_MAP } from '../data/maps/index.js';
import { FLAGS } from '../data/story.js';
import { flags } from '../systems/flags.js';
import { hasSave, loadPosition, eraseSave } from '../systems/save.js';

const FONT = 'monospace';

// Écran titre : « Nouvelle partie » / « Continuer la partie ».
// Flèches haut/bas pour choisir, Entrée ou Espace pour valider.
export class TitleScene extends Phaser.Scene {
  constructor() {
    super('Title');
  }

  create() {
    this.canContinue = hasSave();
    this.cameras.main.setBackgroundColor('#1d3b5c');

    this.title = this.add.text(0, 0, 'Poképierre', {
      fontFamily: FONT, fontSize: '64px', fontStyle: 'bold', color: '#f8e8a8',
      stroke: '#283048', strokeThickness: 8,
    }).setOrigin(0.5);
    this.subtitle = this.add.text(0, 0, 'De Fort-de-France à Saint-Ay', {
      fontFamily: FONT, fontSize: '20px', color: '#b8d8f8',
    }).setOrigin(0.5);
    this.panel = this.add.graphics();
    this.optionTexts = [];
    this.hint = this.add.text(0, 0, '↑ ↓ pour choisir · Entrée pour valider', {
      fontFamily: FONT, fontSize: '16px', color: '#b8d8f8',
    }).setOrigin(0.5);

    this.showMainMenu();
    this.input.keyboard.on('keydown', (e) => this.onKey(e));
    this.scale.on('resize', this.layout, this);
    this.events.once('shutdown', () => this.scale.off('resize', this.layout, this));
  }

  showMainMenu() {
    this.setMenu(
      [
        { label: 'Nouvelle partie', action: () => this.onNewGame() },
        { label: 'Continuer la partie', action: () => this.continueGame(), disabled: !this.canContinue },
      ],
      this.canContinue ? 1 : 0,
    );
  }

  // Une partie existe déjà : on demande confirmation avant de l'effacer.
  onNewGame() {
    if (!this.canContinue) return this.startNewGame();
    this.setMenu(
      [
        { label: 'Effacer la partie en cours ?', header: true },
        { label: 'Non', action: () => this.showMainMenu() },
        { label: 'Oui, recommencer', action: () => this.startNewGame() },
      ],
      1,
    );
  }

  setMenu(options, selected) {
    this.optionTexts.forEach((t) => t.destroy());
    this.options = options;
    this.selected = selected;
    this.optionTexts = options.map((o) =>
      this.add.text(0, 0, o.label, { fontFamily: FONT, fontSize: '26px' }).setOrigin(0.5),
    );
    this.layout();
  }

  layout() {
    const { width, height } = this.scale;
    const cx = width / 2;
    this.title.setPosition(cx, height * 0.28);
    this.subtitle.setPosition(cx, height * 0.28 + 56);

    const lineH = 48;
    const top = height * 0.52;
    const panelW = Math.min(width - 32, 460);
    const panelH = this.options.length * lineH + 32;
    this.panel.clear();
    this.panel.fillStyle(0x283048, 1).fillRoundedRect(cx - panelW / 2, top - 16, panelW, panelH, 12);
    this.panel.fillStyle(0xf8f8f8, 1).fillRoundedRect(cx - panelW / 2 + 4, top - 12, panelW - 8, panelH - 8, 9);

    this.optionTexts.forEach((t, i) => {
      const o = this.options[i];
      const isSelected = i === this.selected;
      t.setPosition(cx, top + i * lineH + lineH / 2 - 4);
      t.setText(isSelected ? `▶ ${o.label}` : o.label);
      t.setColor(o.header ? '#6878a8' : o.disabled ? '#b0b0b0' : isSelected ? '#d04040' : '#303030');
    });
    this.hint.setPosition(cx, top + panelH + 24);
  }

  onKey(e) {
    const selectable = this.options
      .map((o, i) => (o.header || o.disabled ? null : i))
      .filter((i) => i !== null);
    const pos = selectable.indexOf(this.selected);
    if (e.key === 'ArrowUp') this.selected = selectable[(pos - 1 + selectable.length) % selectable.length];
    else if (e.key === 'ArrowDown') this.selected = selectable[(pos + 1) % selectable.length];
    else if (e.key === 'Enter' || e.key === ' ') return this.options[this.selected].action();
    else return;
    this.layout();
  }

  startNewGame() {
    eraseSave();
    this.launchGame('Overworld', { mapId: START_MAP });
  }

  continueGame() {
    const saved = loadPosition();
    if (saved) return this.launchGame(saved.scene, { ...saved.data, spawn: saved.spawn });
    // Progression sans position enregistrée : reprise à l'arrivée de la dernière ville atteinte.
    if (flags.has(FLAGS.departFortDeFrance)) {
      return this.launchGame('Overworld', { mapId: 'saintAy', spawn: { x: 11, y: 17, facing: 'left' } });
    }
    this.launchGame('Overworld', { mapId: START_MAP });
  }

  launchGame(sceneKey, data) {
    if (!this.scene.isActive('UI')) this.scene.launch('UI');
    this.scene.start(sceneKey, data);
  }
}
