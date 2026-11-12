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

// Écran titre, façon Pokémon Émeraude : fond lisse en dégradé jaune-orange (les teintes de l'icône Dracolosse), une
// lueur jaune qui respire doucement, logo « PokéPierre » qui descend avec un rebond, « VERSION HORIZONS » dessous à la
// manière de « VERSION EMERAUDE » (blanc, gros contour noir, relief, la deuxième ligne plus grande, en arc) ;
// « APPUYEZ SUR START » clignote.
// Entrée / Espace / clic / toucher : le menu (cadre pixel art) prend la place de « APPUYEZ SUR START », sur le même
// écran. Échap / Retour (ou un toucher hors du cadre) y revient. Après la fin du jeu (`credits`), le générique défile
// d'abord par-dessus l'écran (une touche le passe).
// Tout est placé sur l'écran de jeu (SCREEN_W x SCREEN_H), agrandi par la caméra (facteur entier sur ordinateur) ; le
// fond, le logo, le sous-titre et les textes sont redessinés à la résolution de l'écran (un pixel d'image par pixel
// d'écran, voir fit) : lisses, pas pixelisés.

// ---------- Textes ----------
const SUBTITLE = ['VERSION', 'HORIZONS'];      // deux lignes en arc sous le logo
const PRESS_START = 'APPUYEZ SUR START';
const COPYRIGHT = '© 2026 PIERRE';
const CONFIRM_ERASE = 'Effacer la partie en cours ?';

// ---------- Fichiers ----------
// Logo : scripts/build_title_logo.py (depuis assets-source/logo-titre.png), `scale` pixels d'image par pixel de jeu.
const LOGO = { key: 'title-logo', url: 'assets/ui/title-logo.png', scale: 4 };
// Polices de l'écran titre (Google Fonts, licence libre OFL ; chargées dans index.html et main.js) : Lilita One pour
// les textes, Montserrat Black (900) pour le sous-titre, proche des lettres de « VERSION EMERAUDE ».
const TITLE_FONT = '"Lilita One", "Arial Black", sans-serif';
const SUBTITLE_FONT = '900 {size}px "Montserrat", "Arial Black", sans-serif';
// Musique en fichier (ex. 'assets/audio/title.ogg', dans public/) ; null : la musique synthétisée du titre (audio.js).
const MUSIC_FILE = null;

// ---------- Couleurs ----------
// Fond : dégradé radial, du centre (SKY_CENTER, en fractions de l'écran) vers les bords, couleurs prises sur l'icône.
const SKY = ['#f9c414', '#fa9914', '#f96e18'];
const SKY_CENTER = { x: 0.5, y: 0.42 };
const GLOW = 'rgba(255, 226, 120, 0.55)';      // lueur jaune au centre, qui respire (GLOW_MS)
// Textes blancs à contour brun très foncé ; sous-titre blanc à contour et relief noirs.
const INK = '#ffffff';
const INK_STROKE = '#2a1406';
const SUB_INK = '#ffffff';
const SUB_STROKE = '#0c0c10';
const MENU = { border: 0x5a2a0c, line: 0xf3b24a, fill: 0xfff8ea, text: '#3a1e0c', disabled: '#bca48e', header: '#b0541a' };

// ---------- Mouvements ----------
const LOGO_Y = 50;                 // centre du logo à l'arrivée
// Sous-titre, une ligne par entrée : hauteur de son milieu (au sommet de l'arc), largeur visée (la taille de la
// police s'y ajuste) et arc (une lettre à d px du milieu descend de curve x d² px et penche d'autant).
const SUBTITLE_LINES = [
  { y: 104, width: 118, curve: 0.0012 },
  { y: 128, width: 178, curve: 0.0022 },
];
const SUBTITLE_SPACING = -0.04;    // espace entre les lettres, en fraction de la taille (négatif : serrées)
const SUBTITLE_DEPTH = 0.1;        // relief vers le bas à droite, en fraction de la taille
const SUBTITLE_STROKE = 0.13;      // épaisseur du contour noir, en fraction de la taille
const GLOW_MS = 4000;              // respiration de la lueur (un aller-retour)
const LOGO_DROP_MS = 1100;
const FADE_IN_MS = 700;
const FADE_OUT_MS = 350;
const BLINK_MS = 1200;             // clignotement de « APPUYEZ SUR START » (un aller-retour)
const BLINK_ALPHA = 0.35;          // opacité au plus bas du clignotement (reste lisible)
const PROMPT_Y = 186;              // « APPUYEZ SUR START » et le menu, centrés à cette hauteur
const PROMPT_SIZE = 15;
const COPYRIGHT_SIZE = 11;
const MENU_LINE = 13;

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

    // Fond, lueur, logo et sous-titre : textures dessinées à la résolution de l'écran par fit().
    this.sky = this.add.image(0, 0, '__DEFAULT').setOrigin(0);
    this.glow = this.add.image(0, 0, '__DEFAULT').setOrigin(0);
    this.logo = this.add.image(SCREEN_W / 2, -40, LOGO.key);
    this.subtitle = this.add.image(0, 0, '__DEFAULT').setOrigin(0).setAlpha(0);
    this.prompt = this.titleText(SCREEN_W / 2, PROMPT_Y, PRESS_START, PROMPT_SIZE);
    this.titleText(SCREEN_W / 2, SCREEN_H - 12, COPYRIGHT, COPYRIGHT_SIZE);
    this.menu = this.add.container(0, 0).setVisible(false);

    // Arrivée : fondu depuis le noir, le logo tombe et rebondit, puis le sous-titre.
    const cam = this.cameras.main;
    cam.setBackgroundColor(0x000000).fadeIn(FADE_IN_MS);
    this.tweens.add({
      targets: this.logo, y: LOGO_Y, duration: LOGO_DROP_MS, delay: 200, ease: 'Bounce.easeOut',
      onComplete: () => this.tweens.add({ targets: this.subtitle, alpha: 1, duration: 400 }),
    });
    this.blink = this.tweens.add({ targets: this.prompt, alpha: BLINK_ALPHA, duration: BLINK_MS / 2, yoyo: true, repeat: -1 });
    this.tweens.add({ targets: this.glow, alpha: 0.35, duration: GLOW_MS / 2, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });

    this.fit();
    this.scale.on('resize', this.fit, this);
    this.events.once('shutdown', () => this.scale.off('resize', this.fit, this));
    this.input.keyboard.on('keydown', (e) => this.onKey(e));
    this.input.on('pointerdown', (pointer) => this.onPointer(pointer));
    if (this.withCredits) this.rollCredits();
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
    // Tout est redessiné à un pixel d'image par pixel d'écran : net malgré le rendu pixel art du jeu (sans lissage).
    const res = Math.max(1, zoom);
    this.textResolution = res;
    this.texts.forEach((t) => t.active && t.setResolution(res));
    this.sky.setTexture(this.skyTexture(res)).setScale(1 / res);
    this.glow.setTexture(this.glowTexture(res)).setScale(1 / res);
    this.subtitle.setTexture(this.subtitleTexture(res)).setScale(1 / res);
    this.scaleLogo(res);
  }

  // Le logo réduit (avec lissage) à `res` pixels par pixel de jeu.
  scaleLogo(res) {
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

  // Toile de l'écran de jeu à `res` pixels par pixel de jeu, dessinée une fois par résolution.
  canvasTexture(name, res, draw, h = SCREEN_H) {
    const w = Math.round(SCREEN_W * res);
    const key = `${name}-${w}`;
    if (!this.textures.exists(key)) {
      const tex = this.textures.createCanvas(key, w, Math.round(h * res));
      const ctx = tex.getContext();
      ctx.scale(res, res);
      draw(ctx);
      tex.refresh();
    }
    return key;
  }

  // Le fond : dégradé radial lisse, jaune au centre, orange vif sur les bords.
  skyTexture(res) {
    return this.canvasTexture('title-sky', res, (ctx) => {
      const cx = SCREEN_W * SKY_CENTER.x;
      const cy = SCREEN_H * SKY_CENTER.y;
      const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, Math.hypot(SCREEN_W, SCREEN_H) * 0.55);
      SKY.forEach((c, i) => g.addColorStop(i / (SKY.length - 1), c));
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, SCREEN_W, SCREEN_H);
    });
  }

  // La lueur : halo jaune clair au centre, transparent vers les bords.
  glowTexture(res) {
    return this.canvasTexture('title-glow', res, (ctx) => {
      const cx = SCREEN_W * SKY_CENTER.x;
      const cy = SCREEN_H * SKY_CENTER.y;
      const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, SCREEN_W * 0.42);
      g.addColorStop(0, GLOW);
      g.addColorStop(1, 'rgba(255, 226, 120, 0)');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, SCREEN_W, SCREEN_H);
    });
  }

  // « VERSION HORIZONS » à la manière de « VERSION EMERAUDE » : lettres blanches très grasses, serrées, posées sur un
  // arc (SUBTITLE_LINES), entourées d'un gros contour noir commun avec un relief vers le bas à droite. Deux passes : tout
  // le noir (relief et contours) d'abord, puis le blanc, pour que les contours des lettres voisines se fondent.
  subtitleTexture(res) {
    return this.canvasTexture('title-subtitle', res, (ctx) => {
      const letters = SUBTITLE.flatMap((text, i) => this.arcLetters(ctx, text, SUBTITLE_LINES[i]));
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.lineJoin = 'round';
      const each = (fn) => letters.forEach((l) => {
        ctx.save();
        ctx.font = l.font;
        ctx.translate(l.x, l.y);
        ctx.rotate(l.angle);
        fn(l);
        ctx.restore();
      });
      ctx.fillStyle = SUB_STROKE;
      ctx.strokeStyle = SUB_STROKE;
      each((l) => {
        ctx.lineWidth = l.size * SUBTITLE_STROKE * 2;
        const depth = l.size * SUBTITLE_DEPTH;
        for (let k = 0; k <= 4; k++) {
          const o = (depth * k) / 4;
          ctx.strokeText(l.c, o, o);
          ctx.fillText(l.c, o, o);
        }
      });
      ctx.fillStyle = SUB_INK;
      each((l) => ctx.fillText(l.c, 0, 0));
    });
  }

  // Les lettres d'une ligne du sous-titre : taille ajustée à la largeur visée, position et inclinaison sur l'arc.
  arcLetters(ctx, text, { y, width, curve }) {
    const fontAt = (size) => SUBTITLE_FONT.replace('{size}', size);
    ctx.font = fontAt(100);
    const chars = [...text];
    const raw = chars.map((c) => ctx.measureText(c).width / 100);
    const per = (size) => raw.map((w) => (w + SUBTITLE_SPACING) * size);
    const size = width / (per(1).reduce((a, b) => a + b, 0) - SUBTITLE_SPACING);
    const advances = per(size);
    let x = -width / 2;
    return chars.map((c, i) => {
      const d = x + (advances[i] - SUBTITLE_SPACING * size) / 2;
      x += advances[i];
      return { c, size, font: fontAt(size), x: SCREEN_W / 2 + d, y: y + curve * d * d, angle: Math.atan(2 * curve * d) };
    });
  }

  // Texte lisse dans la police du titre, centré sur (x, y). Par défaut blanc (INK) à contour sombre ; `stroke` null :
  // sans contour.
  titleText(x, y, text, size, color = INK, stroke = INK_STROKE) {
    const t = this.add.text(x, y, text, {
      fontFamily: TITLE_FONT, fontSize: `${size}px`, color,
      resolution: this.textResolution ?? 1,
      ...(stroke && { stroke, strokeThickness: Math.max(3, Math.round(size / 3.5)) }),
    }).setOrigin(0.5);
    this.texts.push(t);
    return t;
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

// Cadre de menu façon boîte de dialogue : bord brun aux coins coupés, fond crème, liseré orangé intérieur.
function drawMenuFrame(g, x, y, w, h) {
  g.fillStyle(MENU.border, 1);
  g.fillRect(x + 1, y, w - 2, h).fillRect(x, y + 1, w, h - 2);
  g.fillStyle(MENU.fill, 1).fillRect(x + 1, y + 1, w - 2, h - 2);
  g.fillStyle(MENU.line, 1);
  g.fillRect(x + 2, y + 2, w - 4, 1).fillRect(x + 2, y + h - 3, w - 4, 1);
  g.fillRect(x + 2, y + 2, 1, h - 4).fillRect(x + w - 3, y + 2, 1, h - 4);
}
