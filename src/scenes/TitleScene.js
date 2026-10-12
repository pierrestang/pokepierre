import Phaser from 'phaser';
import { MAPS, START_MAP } from '../data/maps/index.js';
import { interiors } from '../data/maps/interiors.js';
import { FONT, touchScreen } from '../systems/screen.js';
import { FRLG_FONT, FRLG_FONT_LIGHT, frlgText } from '../systems/frlgFont.js';
import { FLAGS } from '../data/story.js';
import { flags } from '../systems/flags.js';
import { hasSave, loadPosition, eraseSave } from '../systems/save.js';
import { playMusic, setSeaAmbience, sfx } from '../systems/audio.js';
import { CREDITS } from '../data/credits.js';

// Écran titre : en fond, la traversée des villes déjà atteintes (Fort-de-France seule pour une nouvelle partie), voir
// TitleBackground.js ; le titre et le menu restent fixes au centre, sur leur voile semi-transparent. « Nouvelle partie » / « Continuer la partie » :
// flèches haut/bas pour choisir, Entrée ou Espace pour valider. Après la fin du jeu (`credits`), le générique défile
// d'abord par-dessus l'écran titre (une touche le passe).
export class TitleScene extends Phaser.Scene {
  constructor() {
    super('Title');
  }

  init(data) {
    this.withCredits = Boolean(data?.credits);
  }

  create() {
    this.canContinue = hasSave();
    playMusic('title');
    setSeaAmbience(true);

    // Fond : la traversée des villes déjà atteintes (scène TitleBackground, lancée dessous ; voir TitleBackground.js).
    this.scene.launch('TitleBackground');
    this.scene.sendToBack('TitleBackground');
    this.events.once('shutdown', () => this.scene.stop('TitleBackground'));
    const background = [];

    // Interface (seconde caméra, sans zoom)
    this.shade = this.add.graphics();
    this.title = this.add.text(0, 0, 'Poképierre', {
      fontFamily: FONT, fontSize: '96px', fontStyle: 'bold', color: '#f8e070',
      stroke: '#2c3858', strokeThickness: 12,
      shadow: { offsetX: 0, offsetY: 8, color: '#1c2438', fill: true, stroke: true, blur: 0 },
    }).setOrigin(0.5);
    this.subtitle = this.add.text(0, 0, 'Génération 1', {
      fontFamily: FONT, fontSize: '26px', color: '#ffffff', stroke: '#2c3858', strokeThickness: 6,
    }).setOrigin(0.5);
    this.panel = this.add.graphics();
    this.optionTexts = [];
    this.hint = this.add.text(0, 0, touchScreen ? 'Touche une option pour la choisir' : '↑ ↓ pour choisir · Entrée pour valider', {
      fontFamily: FONT, fontSize: '18px', color: '#ffffff', stroke: '#2c3858', strokeThickness: 4,
    }).setOrigin(0.5);
    this.tweens.add({ targets: this.hint, alpha: 0.35, duration: 700, yoyo: true, repeat: -1 });
    this.tweens.add({ targets: this.title, scale: 1.03, duration: 1400, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });

    this.uiCam = this.cameras.add(0, 0, this.scale.width, this.scale.height);
    this.uiCam.ignore(background);                       // (le fond est dans sa propre scène)
    // Décor animé ajouté ensuite (feuilles qui tombent) : seulement dans la caméra du fond.
    const hideFromUi = (obj) => {
      if (!this.creatingMenu) this.uiCam.ignore(obj);
    };
    this.events.on('addedtoscene', hideFromUi);
    this.events.once('shutdown', () => this.events.off('addedtoscene', hideFromUi));
    this.uiObjects = [this.shade, this.title, this.subtitle, this.panel, this.hint];

    this.showMainMenu();
    if (this.withCredits) this.rollCredits();
    this.input.keyboard.on('keydown', (e) => this.onKey(e));
    this.scale.on('resize', this.layout, this);
    this.events.once('shutdown', () => this.scale.off('resize', this.layout, this));
  }

  showMainMenu() {
    this.setMenu(
      [
        { label: 'Nouvelle partie', action: () => this.onNewGame() },
        { label: 'Continuer la partie', action: () => this.continueGame(), disabled: !this.canContinue },
        { label: 'Créateur', action: () => { window.location.href = `${import.meta.env.BASE_URL}builder.html`; } },
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
        if (this.creditsShown) return;                                 // le toucher passe d'abord le générique
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
    // Titre à la largeur de l'écran (téléphone en portrait).
    const titleSize = Math.min(96, Math.floor(width * 0.16), Math.floor(height * 0.17));
    this.title.setFontSize(titleSize).setStroke('#2c3858', titleSize / 8).setPosition(cx, height * 0.24);
    // « Génération 1 » : proportionné au titre (moins de la moitié de sa taille), juste sous lui.
    const subSize = Math.min(44, Math.floor(width * 0.09), Math.floor(titleSize * 0.46));
    this.subtitle.setFontSize(subSize).setStroke('#2c3858', Math.max(4, subSize / 5))
      .setPosition(cx, height * 0.24 + titleSize * 0.62 + subSize * 0.6);

    const scale = height < 600 || width < 380 ? 2 : 3;
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

  // Le générique : fond noir, les rubriques (en or) et leurs lignes montent lentement du bas de l'écran ; à la fin, ou
  // à la première touche, il s'efface sur l'écran titre.
  rollCredits() {
    const { width, height } = this.scale;
    const scale = height < 600 || width < 380 ? 2 : 3;
    const lineH = 16 * scale;
    this.creatingMenu = true;                                          // objets d'interface (voir create)
    const back = this.add.rectangle(0, 0, width * 4, height * 4, 0x000000).setOrigin(0).setDepth(200);
    const lines = [];
    let y = height + lineH;
    for (const [heading, rows] of CREDITS) {
      lines.push(this.add.bitmapText(width / 2, y, FRLG_FONT_LIGHT, frlgText(this, heading)).setOrigin(0.5, 0).setScale(scale)
        .setTint(0xf8d048).setDepth(201));
      y += lineH * 1.3;
      for (const row of rows) {
        lines.push(this.add.bitmapText(width / 2, y, FRLG_FONT_LIGHT, frlgText(this, row)).setOrigin(0.5, 0).setScale(scale)
          .setTint(0xe8e8f0).setDepth(201));
        y += lineH;
      }
      y += lineH * 1.6;
    }
    this.creatingMenu = false;
    this.cameras.main.ignore([back, ...lines]);
    const distance = y;                                                // jusqu'à ce que la dernière ligne sorte en haut
    this.credits = { back, lines };
    this.creditsShown = true;
    this.creditsTween = this.tweens.add({
      targets: lines, y: `-=${distance}`, duration: distance * 22, ease: 'Linear', onComplete: () => this.endCredits(),
    });
    this.input.once('pointerdown', () => this.endCredits());
  }

  endCredits() {
    if (!this.credits) return;
    const { back, lines } = this.credits;
    this.credits = null;
    this.creditsTween?.stop();
    this.tweens.add({
      targets: [back, ...lines], alpha: 0, duration: 900,
      onComplete: () => {
        [back, ...lines].forEach((o) => o.destroy());
        this.creditsShown = false;
      },
    });
  }

  onKey(e) {
    if (this.credits) return this.endCredits();                       // une touche passe le générique
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
    // Une ancienne sauvegarde sur un lieu retiré du jeu (les villes d'après Paris, le bistrot, Bercy…) : reprise à Paris.
    const gone = (saved?.scene === 'Interior' && !interiors[saved.data?.interior])
      || (saved?.scene === 'Overworld' && !MAPS[saved.data?.mapId]);
    if (gone) return this.launchGame('Overworld', { mapId: 'paris', spawn: { x: 6, y: 23, facing: 'down' } });
    // Après la fin du jeu : dans la chambre de Fort-de-France (le ferry permet ensuite de quitter l'île).
    if (flags.has(FLAGS.finVue)) {
      return this.launchGame('Interior', { interior: 'ffHouseUp', fromMap: START_MAP, spawn: { x: 2, y: 5, facing: 'left' } });
    }
    if (saved) return this.launchGame(saved.scene, { ...saved.data, spawn: saved.spawn });
    // Progression sans position enregistrée : reprise à l'arrivée de la dernière ville atteinte.
    if (flags.has(FLAGS.departFortDeFrance)) {
      return this.launchGame('Overworld', { mapId: 'saintAy', spawn: { x: 5, y: 10, facing: 'left' } });
    }
    this.launchGame('Overworld', { mapId: START_MAP });
  }

  launchGame(sceneKey, data) {
    // Le fond animé s'arrête avant que la partie commence (et non une image plus tard, à l'arrêt du titre) : il ne doit
    // plus libérer de dessins de carte (builtMaps.js applyBuiltLook) une fois la carte du jeu affichée.
    this.scene.stop('TitleBackground');
    if (!this.scene.isActive('UI')) this.scene.launch('UI');
    this.scene.start(sceneKey, data);
  }
}
