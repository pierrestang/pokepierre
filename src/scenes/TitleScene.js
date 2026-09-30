import Phaser from 'phaser';
import { MAPS, START_MAP } from '../data/maps/index.js';
import { renderMap } from '../systems/tileRenderer.js';
import { startSeaShimmer, startFallingLeaves } from '../systems/effects.js';
import { FONT } from '../systems/screen.js';
import { FRLG_FONT, frlgText } from '../systems/frlgFont.js';
import { FLAGS } from '../data/story.js';
import { flags } from '../systems/flags.js';
import { hasSave, loadPosition, eraseSave } from '../systems/save.js';
import { playMusic, setSeaAmbience, sfx } from '../systems/audio.js';

// Écran titre : l'île de Fort-de-France défile doucement en fond (caméra zoomée), le titre et le menu
// sont affichés par une seconde caméra sans zoom. « Nouvelle partie » / « Continuer la partie » :
// flèches haut/bas pour choisir, Entrée ou Espace pour valider.
export class TitleScene extends Phaser.Scene {
  constructor() {
    super('Title');
  }

  create() {
    this.canContinue = hasSave();
    playMusic('title');
    setSeaAmbience(true);

    // Fond : la carte de l'île, avec ses vaguelettes et ses feuilles qui tombent.
    const map = MAPS[START_MAP];
    this.cameras.main.setBackgroundColor(0x4078e0);
    renderMap(this, map);
    // Autour de l'île, la même mer animée qu'en jeu (ajoutée par renderMap).
    startSeaShimmer(this, map, false);
    startFallingLeaves(this, map);
    const background = [...this.children.list];

    // Interface (seconde caméra, sans zoom)
    this.shade = this.add.graphics();
    this.title = this.add.text(0, 0, 'Poképierre', {
      fontFamily: FONT, fontSize: '96px', fontStyle: 'bold', color: '#f8e070',
      stroke: '#2c3858', strokeThickness: 12,
      shadow: { offsetX: 0, offsetY: 8, color: '#1c2438', fill: true, stroke: true, blur: 0 },
    }).setOrigin(0.5);
    this.subtitle = this.add.text(0, 0, 'De Fort-de-France à Saint-Ay', {
      fontFamily: FONT, fontSize: '26px', color: '#ffffff', stroke: '#2c3858', strokeThickness: 6,
    }).setOrigin(0.5);
    this.panel = this.add.graphics();
    this.optionTexts = [];
    this.hint = this.add.text(0, 0, '↑ ↓ pour choisir · Entrée pour valider', {
      fontFamily: FONT, fontSize: '18px', color: '#ffffff', stroke: '#2c3858', strokeThickness: 4,
    }).setOrigin(0.5);
    this.tweens.add({ targets: this.hint, alpha: 0.35, duration: 700, yoyo: true, repeat: -1 });
    this.tweens.add({ targets: this.title, scale: 1.03, duration: 1400, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });

    this.uiCam = this.cameras.add(0, 0, this.scale.width, this.scale.height);
    this.uiCam.ignore(background);
    // Décor animé ajouté ensuite (feuilles qui tombent) : seulement dans la caméra du fond.
    const hideFromUi = (obj) => {
      if (!this.creatingMenu) this.uiCam.ignore(obj);
    };
    this.events.on('addedtoscene', hideFromUi);
    this.events.once('shutdown', () => this.events.off('addedtoscene', hideFromUi));
    this.uiObjects = [this.shade, this.title, this.subtitle, this.panel, this.hint];

    this.showMainMenu();
    this.input.keyboard.on('keydown', (e) => this.onKey(e));
    this.scale.on('resize', this.layout, this);
    this.events.once('shutdown', () => this.scale.off('resize', this.layout, this));
    this.panBackground(map);
  }

  // Lent travelling sur l'île, d'un bout à l'autre et retour.
  panBackground(map) {
    const cam = this.cameras.main;
    const zoom = Math.max(2, Math.ceil(this.scale.height / (map.grid.length * 16)));
    cam.setZoom(zoom);
    const w = map.grid[0].length * 16;
    const h = map.grid.length * 16;
    cam.centerOn(w * 0.3, h * 0.45);
    this.tweens.add({ targets: cam, scrollX: cam.scrollX + w * 0.4, duration: 26000, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
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
    this.creatingMenu = true;                                          // textes d'interface (voir create)
    // Options dans la police de Rouge Feu, comme les menus du jeu.
    this.optionTexts = options.map((o) =>
      this.add.bitmapText(0, 0, FRLG_FONT, frlgText(this, o.label)).setOrigin(0.5),
    );
    this.creatingMenu = false;
    this.cameras.main.ignore(this.optionTexts);
    // Au doigt (téléphone) : toucher une option la choisit.
    this.optionTexts.forEach((t, i) => {
      const o = options[i];
      if (o.header || o.disabled) return;
      t.setInteractive().on('pointerdown', () => {
        sfx('confirm');
        this.selected = i;
        o.action();
      });
    });
    this.layout();
  }

  layout() {
    const { width, height } = this.scale;
    this.cameras.main.ignore(this.uiObjects);
    this.uiCam?.setSize(width, height);
    const cx = width / 2;
    this.shade.clear();
    this.shade.fillStyle(0x10182c, 0.35).fillRect(0, 0, width, height);
    this.title.setPosition(cx, height * 0.24);
    this.subtitle.setPosition(cx, height * 0.24 + 80);

    const scale = height < 600 ? 2 : 3;
    const lineH = 17 * scale;
    const top = height * 0.52;
    const panelW = Math.min(width - 32, 480);
    const panelH = this.options.length * lineH + 36;
    const x = cx - panelW / 2;
    this.panel.clear();
    this.panel.fillStyle(0x6888a8, 1).fillRoundedRect(x, top - 18, panelW, panelH, 16);
    this.panel.fillStyle(0xb8d0e8, 1).fillRoundedRect(x + 4, top - 14, panelW - 8, panelH - 8, 13);
    this.panel.fillStyle(0xf8f8f8, 1).fillRoundedRect(x + 10, top - 8, panelW - 20, panelH - 20, 10);

    this.optionTexts.forEach((t, i) => {
      const o = this.options[i];
      const isSelected = i === this.selected;
      t.setScale(scale).setPosition(cx, top + i * lineH + lineH / 2);
      t.setText(frlgText(this, isSelected ? `▶ ${o.label}` : o.label));
      t.setAlpha(o.disabled ? 0.45 : 1);
      if (o.header) t.setTint(0x8098d8);
    });
    this.hint.setPosition(cx, top + panelH + 30);
  }

  onKey(e) {
    const selectable = this.options
      .map((o, i) => (o.header || o.disabled ? null : i))
      .filter((i) => i !== null);
    const pos = selectable.indexOf(this.selected);
    if (e.key === 'ArrowUp') this.selected = selectable[(pos - 1 + selectable.length) % selectable.length];
    else if (e.key === 'ArrowDown') this.selected = selectable[(pos + 1) % selectable.length];
    else if (e.key === 'Enter' || e.key === ' ') {
      sfx('confirm');
      return this.options[this.selected].action();
    } else return;
    sfx('select');
    this.layout();
  }

  startNewGame() {
    eraseSave();
    // Réveil dans la chambre, à l'étage de la maison de Fort-de-France (voir l'événement de ffHouseUp).
    this.launchGame('Interior', { interior: 'ffHouseUp', fromMap: START_MAP });
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
