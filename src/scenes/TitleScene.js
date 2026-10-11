import Phaser from 'phaser';
import { MAPS, START_MAP } from '../data/maps/index.js';
import { interiors } from '../data/maps/interiors.js';
import { renderMap, createSurroundings } from '../systems/tileRenderer.js';
import { applyBuiltLook } from '../systems/builtMaps.js';
import { startSeaShimmer, startFallingLeaves } from '../systems/effects.js';
import { FONT, touchScreen } from '../systems/screen.js';
import { FRLG_FONT, frlgText } from '../systems/frlgFont.js';
import { FLAGS } from '../data/story.js';
import { flags } from '../systems/flags.js';
import { hasSave, loadPosition, eraseSave } from '../systems/save.js';
import { playMusic, setSeaAmbience, sfx } from '../systems/audio.js';
import { CREDITS } from '../data/credits.js';

// Écran titre : la carte de la partie en cours (sa ville ; Fort-de-France pour une nouvelle partie) défile doucement en
// fond (caméra zoomée), avec son dessin Gen 4 ; le titre et le menu sont affichés par une seconde caméra sans zoom. « Nouvelle partie » / « Continuer la partie » :
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

    // Fond : la carte de la partie en cours, avec ses vaguelettes et ses feuilles qui tombent.
    const map = MAPS[this.backgroundMapId()] ?? MAPS[START_MAP];
    const fill = map.surroundings ?? 'T';
    this.cameras.main.setBackgroundColor(fill === 'w' ? 0x4078e0 : 0x000000);
    if (map.built) applyBuiltLook(this, map);
    renderMap(this, map);
    for (const o of map.overlays ?? []) {
      this.add.image(o.x, o.y, o.sheet, o.frame(this)).setOrigin(0).setDepth(o.depth ?? 10 + (o.y + o.h) / 10000);
    }
    // Autour de la carte : la mer animée (ajoutée par renderMap) ou son décor répété, comme en jeu.
    if (fill && fill !== 'w') {
      const around = createSurroundings(this, map, fill);
      around.resize(map.grid[0].length * 16 + 2 * this.scale.width, map.grid.length * 16 + 2 * this.scale.height);
    }
    startSeaShimmer(this, map);
    startFallingLeaves(this, map);
    const background = [...this.children.list];

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
    this.uiCam.ignore(background);
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
    this.panBackground(map);
  }

  // La ville de la partie en cours (celle d'un bâtiment pour un intérieur, l'arrivée d'un voyage), sinon Fort-de-France.
  backgroundMapId() {
    if (!this.canContinue) return START_MAP;
    const saved = loadPosition();
    const data = saved?.data ?? {};
    const id = data.mapId ?? data.fromMap ?? data.next?.data?.mapId ?? START_MAP;
    return MAPS[id] ? id : 'paris';                   // un lieu retiré du jeu (ancienne sauvegarde) : Paris
  }

  // Lent travelling sur la carte, d'un bout à l'autre et retour.
  panBackground(map) {
    const cam = this.cameras.main;
    const w = map.grid[0].length * 16;
    const h = map.grid.length * 16;
    // Assez zoomé pour que la carte remplisse l'écran, et la caméra reste dans la carte (rien autour).
    const zoom = Math.max(2, Math.ceil(this.scale.height / h), Math.ceil(this.scale.width / w));
    cam.setZoom(zoom);
    cam.setBounds(0, 0, w, h);
    cam.centerOn(w * 0.3, h * 0.45);
    this.tweens.add({ targets: cam, scrollX: cam.scrollX + w * 0.4, duration: 26000, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
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
    this.subtitle.setFontSize(Math.min(26, Math.floor(width * 0.058))).setPosition(cx, height * 0.24 + titleSize * 0.83);

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
      lines.push(this.add.bitmapText(width / 2, y, FRLG_FONT, frlgText(this, heading)).setOrigin(0.5, 0).setScale(scale)
        .setTint(0xf8d048).setDepth(201));
      y += lineH * 1.3;
      for (const row of rows) {
        lines.push(this.add.bitmapText(width / 2, y, FRLG_FONT, frlgText(this, row)).setOrigin(0.5, 0).setScale(scale)
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
      targets: lines, y: `-=${distance}`, duration: distance * 28, ease: 'Linear', onComplete: () => this.endCredits(),
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
    if (saved) return this.launchGame(saved.scene, { ...saved.data, spawn: saved.spawn });
    // Progression sans position enregistrée : reprise à l'arrivée de la dernière ville atteinte.
    if (flags.has(FLAGS.departFortDeFrance)) {
      return this.launchGame('Overworld', { mapId: 'saintAy', spawn: { x: 5, y: 10, facing: 'left' } });
    }
    this.launchGame('Overworld', { mapId: START_MAP });
  }

  launchGame(sceneKey, data) {
    if (!this.scene.isActive('UI')) this.scene.launch('UI');
    this.scene.start(sceneKey, data);
  }
}
