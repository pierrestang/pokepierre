import Phaser from 'phaser';
import { MAPS, START_MAP } from '../data/maps/index.js';
import { interiors } from '../data/maps/interiors.js';
import { SCREEN_W, SCREEN_H, touchScreen } from '../systems/screen.js';
import { FRLG_FONT_LIGHT, frlgText } from '../systems/frlgFont.js';
import { FLAGS } from '../data/story.js';
import { flags } from '../systems/flags.js';
import { hasSave, loadPosition, eraseSave } from '../systems/save.js';
import { options as audioOptions, playMusic, setSeaAmbience, sfx, stopMusic } from '../systems/audio.js';
import { CREDITS } from '../data/credits.js';

// Écran titre, façon Pokémon Émeraude : ciel en dégradé (bleu profond, bleu-vert, vert émeraude) traversé de nuages
// pixelisés en parallaxe, logo « PokéPierre » qui descend avec un rebond,
// « VERSION HORIZONS » dessous, en arc ; « APPUYEZ SUR START » clignote.
// Entrée / Espace / clic / toucher : le menu (cadre pixel art) prend la place de « APPUYEZ SUR START », sur le même
// écran. Échap / Retour (ou un toucher hors du cadre) y revient. Après la fin du jeu (`credits`), le générique défile
// d'abord par-dessus l'écran (une touche le passe).
// Tout est placé sur l'écran de jeu (SCREEN_W x SCREEN_H), agrandi par la caméra (facteur entier sur ordinateur) : le
// ciel et les nuages en pixel art (1 pixel de jeu) ; le logo (image haute résolution) et les textes (police
// vectorielle) en pixels plus fins, de TEXT_PIXEL pixels d'écran.

// ---------- Textes ----------
const SUBTITLE = ['VERSION', 'HORIZONS'];      // deux lignes en arc sous le logo
const PRESS_START = 'APPUYEZ SUR START';
const COPYRIGHT = '© 2026 PIERRE';
const CONFIRM_ERASE = 'Effacer la partie en cours ?';

// ---------- Fichiers ----------
// Logo : scripts/build_title_logo.py (depuis assets-source/logo-titre.png), `scale` pixels d'image par pixel de jeu.
const LOGO = { key: 'title-logo', url: 'assets/ui/title-logo.png', scale: 4 };
// Police des textes de l'écran titre (Google Fonts, licence libre OFL ; chargée dans index.html et main.js).
const TITLE_FONT = '"Lilita One", "Arial Black", sans-serif';
// Musique en fichier (ex. 'assets/audio/title.ogg', dans public/) ; null : la musique synthétisée du titre (audio.js).
const MUSIC_FILE = null;

// ---------- Couleurs ----------
// Ciel, de haut en bas : chaque bande passe à la suivante par une rangée tramée (damier).
const SKY = [0x14509c, 0x185ca4, 0x1a68a8, 0x1c74a8, 0x1e7ea4, 0x20889c, 0x229094, 0x24988c, 0x26a084, 0x2aa87c];
const CLOUD = 0x6cc0d4;
const CLOUD_LIGHT = 0x9cdce4;
const CLOUD_SHADE = 0x58acc4;
// Textes blancs dégradés vers le gris en bas, à contour sombre.
const INK = ['#ffffff', '#ffffff', '#c8ccd8'];
const INK_STROKE = '#101830';
const MENU = { border: 0x183c34, line: 0x8cc8a4, fill: 0xf0fcf2, text: '#203830', disabled: '#9cb0a6', header: '#3c7860' };

// ---------- Mouvements ----------
// Nuages : une bande par couche, du fond (lente) au premier plan (rapide), en pixels de jeu par seconde.
const CLOUD_LAYERS = [
  { y: 0, h: 30, speed: 2, alpha: 0.5, seed: 3 },
  { y: 34, h: 30, speed: 3, alpha: 0.55, seed: 5 },
  { y: 70, h: 32, speed: 4, alpha: 0.6, seed: 7 },
  { y: 106, h: 34, speed: 6, alpha: 0.65, seed: 11 },
  { y: 146, h: 36, speed: 8, alpha: 0.7, seed: 13 },
  { y: 188, h: 40, speed: 11, alpha: 0.75, seed: 17 },
];
const LOGO_Y = 50;                 // centre du logo à l'arrivée
const SUBTITLE_Y = 90;             // milieu de « VERSION » (au sommet de l'arc) ; « HORIZONS » une ligne plus bas
const SUBTITLE_SIZE = 20;          // taille des deux lignes du sous-titre
const SUBTITLE_CURVE = 0.003;      // arc du sous-titre : une lettre à d px du milieu descend de SUBTITLE_CURVE x d² px
const LOGO_DROP_MS = 1100;
const FADE_IN_MS = 700;
const FADE_OUT_MS = 350;
const BLINK_MS = 1000;             // clignotement de « APPUYEZ SUR START » (un aller-retour)
const PROMPT_Y = 178;              // « APPUYEZ SUR START » et le menu, centrés à cette hauteur
const MENU_LINE = 13;
const TEXT_PIXEL = 2;              // taille d'un pixel du logo et des textes, en pixels d'écran (plus grand : plus pixelisé)

// Les trois choix, dans l'ordre affiché.
const MENU_ORDER = ['continue', 'new', 'builder'];

export class TitleScene extends Phaser.Scene {
  constructor() {
    super('Title');
  }

  init(data) {
    this.withCredits = Boolean(data?.credits);
  }

  preload() {
    this.load.image(LOGO.key, `${import.meta.env.BASE_URL}${LOGO.url}`);
    if (MUSIC_FILE) this.load.audio('title-music', `${import.meta.env.BASE_URL}${MUSIC_FILE}`);
  }

  create() {
    this.canContinue = hasSave();
    this.state = 'press';
    this.texts = [];
    this.startMusic();
    setSeaAmbience(false);

    this.add.image(0, 0, this.skyTexture()).setOrigin(0);
    this.clouds = CLOUD_LAYERS.map((layer, i) =>
      this.add.tileSprite(0, layer.y, SCREEN_W, layer.h, this.cloudTexture(i, layer)).setOrigin(0).setAlpha(layer.alpha));
    this.logo = this.add.image(SCREEN_W / 2, -40, LOGO.key);
    // Sous-titre sur deux lignes en arc, qui suivent la courbure du logo (le haut au centre).
    this.subtitle = this.add.container(0, 0, [
      ...this.arcText(SUBTITLE[0], SUBTITLE_Y),
      ...this.arcText(SUBTITLE[1], SUBTITLE_Y + SUBTITLE_SIZE + 1),
    ]).setAlpha(0);
    this.prompt = this.titleText(SCREEN_W / 2, PROMPT_Y, PRESS_START, 12);
    this.titleText(SCREEN_W / 2, SCREEN_H - 11, COPYRIGHT, 10);
    this.menu = this.add.container(0, 0).setVisible(false);

    // Arrivée : fondu depuis le noir, le logo tombe et rebondit, puis le sous-titre.
    const cam = this.cameras.main;
    cam.setBackgroundColor(0x000000).fadeIn(FADE_IN_MS);
    this.tweens.add({
      targets: this.logo, y: LOGO_Y, duration: LOGO_DROP_MS, delay: 200, ease: 'Bounce.easeOut',
      onComplete: () => this.tweens.add({ targets: this.subtitle, alpha: 1, duration: 400 }),
    });
    this.blink = this.tweens.add({ targets: this.prompt, alpha: 0.15, duration: BLINK_MS / 2, yoyo: true, repeat: -1 });

    this.fit();
    this.scale.on('resize', this.fit, this);
    this.events.once('shutdown', () => this.scale.off('resize', this.fit, this));
    this.input.keyboard.on('keydown', (e) => this.onKey(e));
    this.input.on('pointerdown', (pointer) => this.onPointer(pointer));
    if (this.withCredits) this.rollCredits();
  }

  update(time, delta) {
    // Nuages : décalage entier (pixels nets), chaque couche à sa vitesse.
    this.clouds.forEach((c, i) => {
      c.scroll = (c.scroll ?? 0) + (CLOUD_LAYERS[i].speed * delta) / 1000;
      c.tilePositionX = Math.floor(c.scroll);
    });
  }

  // Écran de jeu centré dans la fenêtre : facteur entier sur ordinateur, le plus grand possible au doigt.
  fit() {
    const { width, height } = this.scale;
    const ratio = Math.min(width / SCREEN_W, height / SCREEN_H);
    const zoom = touchScreen ? Math.floor(ratio * 100) / 100 : Math.max(1, Math.floor(ratio));
    const w = Math.round(SCREEN_W * zoom);
    const h = Math.round(SCREEN_H * zoom);
    const cam = this.cameras.main;
    cam.setViewport(Math.floor((width - w) / 2), Math.floor((height - h) / 2), w, h);
    cam.setZoom(zoom).centerOn(SCREEN_W / 2, SCREEN_H / 2);
    // Logo et textes redessinés à une case de TEXT_PIXEL pixels d'écran (sans lissage) : légèrement pixelisés.
    this.textResolution = Math.max(1, zoom / TEXT_PIXEL);
    this.texts.forEach((t) => t.active && t.setResolution(this.textResolution));
    this.pixelateLogo(this.textResolution);
  }

  // Le logo réduit (avec lissage) à `res` pixels par pixel de jeu, puis affiché sans lissage.
  pixelateLogo(res) {
    const src = this.textures.get(LOGO.key).getSourceImage();
    const w = Math.round((src.width / LOGO.scale) * res);
    const h = Math.round((src.height / LOGO.scale) * res);
    const key = `${LOGO.key}-${w}`;
    if (!this.textures.exists(key)) {
      const tex = this.textures.createCanvas(key, w, h);
      const ctx = tex.getContext();
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(src, 0, 0, w, h);
      tex.refresh();
    }
    this.logo.setTexture(key).setScale(1 / res);
  }

  // ---------- Décor ----------

  // Le ciel : bandes de couleur, tramées à chaque passage.
  skyTexture() {
    const key = 'title-sky';
    if (this.textures.exists(key)) return key;
    const tex = this.textures.createCanvas(key, SCREEN_W, SCREEN_H);
    const ctx = tex.getContext();
    const band = SCREEN_H / SKY.length;
    for (let y = 0; y < SCREEN_H; y++) {
      const i = Math.min(SKY.length - 1, Math.floor(y / band));
      const edge = i < SKY.length - 1 && y >= Math.floor((i + 1) * band) - 2;
      for (let x = 0; x < SCREEN_W; x += edge ? 1 : SCREEN_W) {
        const next = edge && (x + y) % 2 === 0;
        ctx.fillStyle = hex(next ? SKY[i + 1] : SKY[i]);
        ctx.fillRect(x, y, edge ? 1 : SCREEN_W, 1);
      }
    }
    tex.refresh();
    return key;
  }

  // Une bande de nuages en escalier (marches de 2 px), qui se raccorde d'un bord à l'autre (défilement en boucle).
  cloudTexture(index, { h, seed }) {
    const key = `title-clouds-${index}`;
    if (this.textures.exists(key)) return key;
    const tex = this.textures.createCanvas(key, SCREEN_W, h);
    const ctx = tex.getContext();
    let r = seed;
    const rand = () => ((r = (r * 9301 + 49297) % 233280) / 233280);
    // Des traînées de nuages (ovales très étirés, contour en marches de 2 px), à des hauteurs un peu différentes.
    const covered = Array.from({ length: h }, () => new Array(SCREEN_W).fill(false));
    for (let x = Math.floor(rand() * 40); x < SCREEN_W; x += 40 + Math.floor(rand() * 120)) {
      const w = 24 + Math.floor(rand() * 80);
      const rh = Math.floor(h * (0.18 + rand() * 0.2));
      const cy = h / 2 + Math.round((rand() - 0.5) * (h - 2 * rh));
      for (let dx = 0; dx < w; dx++) {
        const t = Math.abs(dx - (dx % 2) + 1 - w / 2) / (w / 2);                   // par colonnes de 2 px
        const half = Math.floor((rh * Math.sqrt(Math.max(0, 1 - t * t))) / 2) * 2;
        const col = (x + dx) % SCREEN_W;
        for (let y = Math.max(0, cy - half); y < Math.min(h, cy + half); y++) covered[y][col] = true;
      }
    }
    const at = (x, y) => y >= 0 && y < h && covered[y][x];
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < SCREEN_W; x++) {
        if (!covered[y][x]) continue;
        // Liseré clair en haut, ombre en bas, plein au milieu.
        ctx.fillStyle = hex(!at(x, y - 2) ? CLOUD_LIGHT : !at(x, y + 2) ? CLOUD_SHADE : CLOUD);
        ctx.fillRect(x, y, 1, 1);
      }
    }
    tex.refresh();
    return key;
  }

  // Texte lisse dans la police du titre, centré sur (x, y). Par défaut blanc dégradé (INK) à contour sombre ;
  // `color` : une couleur simple, `stroke` null : sans contour.
  titleText(x, y, text, size, color = INK, stroke = INK_STROKE) {
    const gradient = Array.isArray(color);
    const t = this.add.text(x, y, text, {
      fontFamily: TITLE_FONT, fontSize: `${size}px`, color: gradient ? color[0] : color,
      resolution: this.textResolution ?? 1,
      ...(stroke && { stroke, strokeThickness: Math.max(2, Math.round(size / 5)) }),
    }).setOrigin(0.5);
    if (gradient) {
      const g = t.context.createLinearGradient(0, 0, 0, t.height);
      color.forEach((c, i) => g.addColorStop(i / (color.length - 1), c));
      t.setFill(g);
    }
    this.texts.push(t);
    return t;
  }

  // Une ligne du sous-titre en arc, lettre par lettre : centrée à l'écran, son milieu à `y` ; chaque lettre descend et
  // s'incline selon sa distance au milieu (SUBTITLE_CURVE), comme posée sur un cercle.
  arcText(text, y) {
    const measure = document.createElement('canvas').getContext('2d');
    measure.font = `${SUBTITLE_SIZE}px ${TITLE_FONT}`;
    const spacing = 1;
    const advances = [...text].map((c) => measure.measureText(c).width + spacing);
    const total = advances.reduce((a, b) => a + b, 0) - spacing;
    let x = -total / 2;
    return [...text].map((c, i) => {
      const d = x + (advances[i] - spacing) / 2;
      x += advances[i];
      return this.titleText(SCREEN_W / 2 + d, y + SUBTITLE_CURVE * d * d, c, SUBTITLE_SIZE)
        .setAngle(Phaser.Math.RadToDeg(Math.atan(2 * SUBTITLE_CURVE * d)));
    });
  }

  // ---------- Musique ----------

  startMusic() {
    if (!MUSIC_FILE || !this.cache.audio.exists('title-music')) return playMusic('title');
    stopMusic();
    if (!audioOptions.music) return;
    const music = this.sound.add('title-music', { loop: true, volume: 0.5 });
    music.play();
    this.events.once('shutdown', () => music.destroy());
  }

  // ---------- Menu ----------

  mainMenu() {
    const entries = {
      continue: { label: 'Continuer la partie', action: () => this.leave(() => this.continueGame()), disabled: !this.canContinue },
      new: { label: 'Nouvelle partie', action: () => this.onNewGame() },
      builder: {
        label: 'Créateur',
        action: () => this.leave(() => { window.location.href = `${import.meta.env.BASE_URL}builder.html`; }),
      },
    };
    const list = MENU_ORDER.map((id) => entries[id]);
    const first = list.findIndex((o) => !o.disabled);
    this.setMenu(list, this.canContinue ? MENU_ORDER.indexOf('continue') : first, true);
  }

  // Une partie existe déjà : on demande confirmation avant de l'effacer.
  onNewGame() {
    if (!this.canContinue) return this.leave(() => this.startNewGame());
    this.setMenu([
      { label: CONFIRM_ERASE, header: true },
      { label: 'Non', action: () => this.mainMenu() },
      { label: 'Oui, recommencer', action: () => this.leave(() => this.startNewGame()) },
    ], 1, false);
  }

  setMenu(options, selected, isMain) {
    this.menu.removeAll(true);
    this.texts = this.texts.filter((t) => t.active);
    this.options = options;
    this.selected = selected;
    this.isMainMenu = isMain;

    const labels = options.map((o) => {
      const t = this.titleText(0, 0, o.label, 10, o.header ? MENU.header : o.disabled ? MENU.disabled : MENU.text, null)
        .setOrigin(0, 0.5);
      this.menu.add(t);
      return t;
    });
    const w = Math.ceil(Math.max(...labels.map((t) => t.width))) + 28;
    const h = options.length * MENU_LINE + 10;
    const x = Math.round((SCREEN_W - w) / 2);
    const y = Math.round(PROMPT_Y - h / 2);
    this.menuBox = new Phaser.Geom.Rectangle(x, y, w, h);
    const frame = this.add.graphics();
    drawMenuFrame(frame, x, y, w, h);
    this.menu.addAt(frame, 0);
    labels.forEach((t, i) => t.setPosition(x + 16, y + 5 + i * MENU_LINE + MENU_LINE / 2 + 1));
    this.cursor = this.add.graphics();
    this.menu.add(this.cursor);
    this.drawCursor();
  }

  // La flèche ▶ devant l'option choisie (triangle de 4 x 7 px).
  drawCursor() {
    const { x, y } = this.menuBox;
    const cy = y + 5 + this.selected * MENU_LINE + MENU_LINE / 2 - 3;
    this.cursor.clear().fillStyle(MENU.border, 1);
    for (let i = 0; i < 4; i++) this.cursor.fillRect(x + 7 + i, cy + i, 1, 7 - 2 * i);
  }

  // Index de l'option sous un point de l'écran de jeu (ou -1).
  optionAt(px, py) {
    if (!this.menuBox.contains(px, py)) return -1;
    const i = Math.floor((py - this.menuBox.y - 5) / MENU_LINE);
    return i >= 0 && i < this.options.length ? i : -1;
  }

  selectable() {
    return this.options.map((o, i) => (o.header || o.disabled ? null : i)).filter((i) => i !== null);
  }

  openMenu() {
    this.state = 'menu';
    sfx('confirm');
    this.blink.pause();
    this.tweens.add({ targets: this.prompt, alpha: 0, duration: 200 });
    this.mainMenu();
    this.menu.setVisible(true).setAlpha(0);
    this.tweens.add({ targets: this.menu, alpha: 1, duration: 200, delay: 120 });
  }

  // Retour : de la confirmation au menu, du menu à « APPUYEZ SUR START ».
  back() {
    sfx('select');
    if (!this.isMainMenu) return this.mainMenu();
    this.state = 'press';
    this.tweens.add({ targets: this.menu, alpha: 0, duration: 150, onComplete: () => this.menu.setVisible(false) });
    this.prompt.setAlpha(1);
    this.blink.restart();
  }

  choose(i) {
    const o = this.options[i];
    if (!o || o.header || o.disabled) return;
    this.selected = i;
    this.drawCursor();
    sfx('confirm');
    o.action();
  }

  move(dir) {
    const list = this.selectable();
    const pos = list.indexOf(this.selected);
    this.selected = list[(pos + dir + list.length) % list.length];
    sfx('select');
    this.drawCursor();
  }

  // Fondu court vers la suite.
  leave(then) {
    this.state = 'leaving';
    this.cameras.main.fadeOut(FADE_OUT_MS, 0, 0, 0);
    this.cameras.main.once('camerafadeoutcomplete', then);
  }

  onKey(e) {
    if (this.credits) return this.endCredits();                       // une touche passe le générique
    if (this.creditsShown) return;
    const key = e.key.length === 1 ? e.key.toLowerCase() : e.key;
    if (this.state === 'press') {
      if (key === 'Enter' || key === ' ') this.openMenu();
    } else if (this.state === 'menu') {
      if (key === 'ArrowUp' || key === 'z') this.move(-1);
      else if (key === 'ArrowDown' || key === 's') this.move(1);
      else if (key === 'Enter' || key === ' ') this.choose(this.selected);
      else if (key === 'Escape' || key === 'Backspace') this.back();
    }
  }

  onPointer(pointer) {
    if (this.credits || this.creditsShown) return;                    // le toucher passe d'abord le générique
    const p = this.cameras.main.getWorldPoint(pointer.x, pointer.y);
    if (this.state === 'press') this.openMenu();
    else if (this.state === 'menu') {
      const i = this.optionAt(p.x, p.y);
      if (i >= 0) this.choose(i);
      else if (!this.menuBox.contains(p.x, p.y)) this.back();
    }
  }

  // ---------- Générique ----------

  // Fond noir, les rubriques (en or) et leurs lignes montent lentement du bas de l'écran ; à la fin, ou à la première
  // touche, il s'efface sur l'écran titre.
  rollCredits() {
    const lineH = 16;
    const back = this.add.rectangle(0, 0, SCREEN_W, SCREEN_H, 0x000000).setOrigin(0).setDepth(200);
    const lines = [];
    let y = SCREEN_H + lineH;
    for (const [heading, rows] of CREDITS) {
      lines.push(this.add.bitmapText(SCREEN_W / 2, y, FRLG_FONT_LIGHT, frlgText(this, heading)).setOrigin(0.5, 0)
        .setTint(0xf8d048).setDepth(201));
      y += lineH * 1.3;
      for (const row of rows) {
        lines.push(this.add.bitmapText(SCREEN_W / 2, y, FRLG_FONT_LIGHT, frlgText(this, row)).setOrigin(0.5, 0)
          .setTint(0xe8e8f0).setDepth(201));
        y += lineH;
      }
      y += lineH * 1.6;
    }
    const distance = y;                                                // jusqu'à ce que la dernière ligne sorte en haut
    this.credits = { back, lines };
    this.creditsShown = true;
    this.creditsTween = this.tweens.add({
      targets: lines, y: `-=${distance}`, duration: distance * 55, ease: 'Linear', onComplete: () => this.endCredits(),
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

  // ---------- Lancement de la partie ----------

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
    if (!this.scene.isActive('UI')) this.scene.launch('UI');
    this.scene.start(sceneKey, data);
  }
}

const hex = (color) => `#${color.toString(16).padStart(6, '0')}`;

// Cadre de menu façon boîte de dialogue : bord sombre aux coins coupés, fond vert très pâle, liseré vert intérieur.
function drawMenuFrame(g, x, y, w, h) {
  g.fillStyle(MENU.border, 1);
  g.fillRect(x + 1, y, w - 2, h).fillRect(x, y + 1, w, h - 2);
  g.fillStyle(MENU.fill, 1).fillRect(x + 1, y + 1, w - 2, h - 2);
  g.fillStyle(MENU.line, 1);
  g.fillRect(x + 2, y + 2, w - 4, 1).fillRect(x + 2, y + h - 3, w - 4, 1);
  g.fillRect(x + 2, y + 2, 1, h - 4).fillRect(x + w - 3, y + 2, 1, h - 4);
}
