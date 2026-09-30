// Boîte de dialogue en bas de l'écran : texte affiché progressivement, page par page.
// Entrée / Espace : termine la page en cours d'écriture, sinon passe à la suivante.
// choose(question, options) : pose une question, liste de réponses (flèches haut/bas + Entrée).
// Vit dans la UIScene (pas de zoom) ; les scènes de jeu l'ouvrent via open(pages) ou choose().
// Texte dans la police de Rouge Feu (voir frlgFont.js), deux lignes par page comme dans le jeu : les pages
// trop longues sont coupées automatiquement.

import { gameView } from './screen.js';
import { FRLG_FONT, LINE_HEIGHT, frlgText, wrapText } from './frlgFont.js';
import { sfx } from './audio.js';
import { PORTRAITS } from '../art/spriteSheets.js';
import { portraitOf } from '../data/characters.js';

const CHAR_DELAY = 25; // ms par caractère
// Les dimensions sont en « pixels Game Boy » (u = facteur d'agrandissement de l'écran de jeu).
const HEIGHT = 46;
const LINES = 2;             // lignes par page
const TEXT_LEFT = 9;         // marge du texte dans la boîte
// Couleurs façon Rouge Feu : fond blanc, cadre bleu-gris arrondi.
const FRAME = 0x6888a8;
const FRAME_LIGHT = 0xb8d0e8;

const bitmapText = (scene, text = '') => scene.add.bitmapText(0, 0, FRLG_FONT, text).setLineSpacing(0);

export class DialogBox {
  constructor(scene) {
    this.scene = scene;
    this.pages = [];
    this.pageIndex = 0;
    this.typing = null;
    this.resolve = null;
    this.openedAt = 0;
    this.closedAt = 0;

    this.box = scene.add.graphics();
    this.text = bitmapText(scene);

    // Étiquette du nom de la personne qui parle
    this.speaker = undefined;
    this.nameBg = scene.add.graphics();
    this.nameText = bitmapText(scene);

    // Portrait en pied de la personne qui parle, debout sur le bord droit de la boîte.
    this.portrait = scene.add.image(0, 0, PORTRAITS, 'p0').setOrigin(1, 1).setVisible(false);

    this.arrow = scene.add.triangle(0, 0, 0, 0, 14, 0, 7, 9, 0xe04040);
    scene.tweens.add({ targets: this.arrow, alpha: 0.2, duration: 300, yoyo: true, repeat: -1 });

    this.container = scene.add
      .container(0, 0, [this.portrait, this.box, this.text, this.nameBg, this.nameText, this.arrow])
      .setDepth(100)
      .setVisible(false);

    // Liste de réponses (choose)
    this.choices = null;
    this.choiceIndex = 0;
    this.choiceBox = scene.add.graphics().setDepth(101).setVisible(false);
    this.choiceTexts = [];

    this.layout();
    scene.scale.on('resize', this.layout, this);
    scene.events.once('shutdown', () => scene.scale.off('resize', this.layout, this));

    scene.input.keyboard.addCapture('SPACE,ENTER');
    scene.input.keyboard.on('keydown', (e) => this.onKey(e));
  }

  // Place la boîte en bas de l'écran de jeu (comme dans Rouge Feu), à l'échelle de l'écran.
  // Rappelée à chaque redimensionnement.
  layout() {
    const v = gameView(this.scene.scale);
    const u = v.zoom;
    const H = HEIGHT * u;
    const x = v.x + 2 * u;
    const w = v.w - 4 * u;
    const y = v.y + v.h - H - 2 * u;
    this.u = u;
    this.boxX = x;
    this.boxY = y;
    this.boxW = w;

    this.box.clear();
    this.box.fillStyle(FRAME, 1).fillRoundedRect(x, y, w, H, 4 * u);
    this.box.fillStyle(FRAME_LIGHT, 1).fillRoundedRect(x + u, y + u, w - 2 * u, H - 2 * u, 3.5 * u);
    this.box.fillStyle(0xf8f8f8, 1).fillRoundedRect(x + 2 * u, y + 2 * u, w - 4 * u, H - 4 * u, 3 * u);
    // Réglettes bleu clair sur les côtés, comme dans Rouge Feu
    this.box.fillStyle(FRAME_LIGHT, 1).fillRect(x + 4 * u, y + 7 * u, 1.5 * u, H - 14 * u);
    this.box.fillStyle(FRAME_LIGHT, 1).fillRect(x + w - 5.5 * u, y + 7 * u, 1.5 * u, H - 14 * u);

    this.text.setScale(u).setPosition(x + TEXT_LEFT * u, y + 6 * u);
    this.nameText.setScale(u).setPosition(x + 7 * u, y - 13 * u);
    this.portrait.setScale(u).setPosition(x + w - 6 * u, y + 2 * u);
    this.arrow.setScale(u / 5).setPosition(x + w - 11 * u, y + H - 9 * u);
    this.setSpeaker(this.speaker);
    if (this.choiceTexts?.length) this.showChoices();
  }

  // Largeur disponible pour le texte, en pixels Game Boy (ne dépend pas du zoom).
  get textWidth() {
    return this.boxW / this.u - 2 * TEXT_LEFT;
  }

  // Coupe les pages en pages de deux lignes au plus.
  paginate(pages) {
    const out = [];
    for (const page of pages) {
      const lines = wrapText(this.scene, page, this.textWidth);
      for (let i = 0; i < lines.length; i += LINES) out.push(lines.slice(i, i + LINES).join('\n'));
    }
    return out;
  }

  get isOpen() {
    return this.container.visible;
  }

  // Ouvre le dialogue ; la promesse se résout quand la dernière page est fermée.
  open(pages, { speaker } = {}) {
    this.pages = this.paginate(Array.isArray(pages) ? pages : [pages]);
    this.pageIndex = 0;
    this.openedAt = performance.now();
    this.setSpeaker(speaker);
    this.container.setVisible(true);
    this.showPage();
    return new Promise((resolve) => { this.resolve = resolve; });
  }

  // Pose une question ; la promesse se résout avec l'index de la réponse choisie.
  choose(question, options, { speaker } = {}) {
    this.choices = options;
    this.choiceIndex = 0;
    return this.open([question], { speaker });
  }

  showChoices() {
    this.hideChoices();
    const u = this.u;
    const lineH = LINE_HEIGHT * u;
    const texts = this.choices.map((label) =>
      bitmapText(this.scene, frlgText(this.scene, '▶ ' + label)).setScale(u).setDepth(102),
    );
    const w = Math.max(...texts.map((t) => t.width)) + 12 * u;
    const h = texts.length * lineH + 6 * u;
    const x = this.boxX + this.boxW - w;
    const y = this.boxY - h - 2 * u;
    this.choiceBox.clear().setVisible(true);
    this.choiceBox.fillStyle(FRAME, 1).fillRoundedRect(x, y, w, h, 3 * u);
    this.choiceBox.fillStyle(FRAME_LIGHT, 1).fillRoundedRect(x + u, y + u, w - 2 * u, h - 2 * u, 2.5 * u);
    this.choiceBox.fillStyle(0xf8f8f8, 1).fillRoundedRect(x + 2 * u, y + 2 * u, w - 4 * u, h - 4 * u, 2 * u);
    texts.forEach((t, i) => t.setPosition(x + 5 * u, y + 3 * u + i * lineH));
    this.choiceTexts = texts;
    this.renderChoices();
  }

  renderChoices() {
    this.choiceTexts.forEach((t, i) => {
      const selected = i === this.choiceIndex;
      // Flèche devant la réponse choisie ; les autres gardent sa place (deux espaces = largeur de « ▶ »).
      t.setText(frlgText(this.scene, (selected ? '▶ ' : '   ') + this.choices[i]));
    });
  }

  hideChoices() {
    this.choiceTexts.forEach((t) => t.destroy());
    this.choiceTexts = [];
    this.choiceBox.setVisible(false);
  }

  setSpeaker(speaker) {
    const portrait = speaker ? portraitOf(speaker) : null;
    this.portrait.setVisible(portrait !== null);
    if (portrait) this.portrait.setTexture(portrait.key, portrait.frame);
    this.speaker = speaker;
    this.nameBg.clear();
    this.nameText.setText(speaker ? frlgText(this.scene, speaker) : '');
    if (!speaker) return;
    // Petit cartouche blanc cerclé, posé sur le bord haut de la boîte.
    const u = this.u;
    const w = this.nameText.width + 8 * u;
    const x = this.boxX + 3 * u;
    const y = this.boxY - 14 * u;
    this.nameBg.fillStyle(FRAME, 1).fillRoundedRect(x, y, w, 15 * u, 3 * u);
    this.nameBg.fillStyle(0xf8f8f8, 1).fillRoundedRect(x + u, y + u, w - 2 * u, 13 * u, 2.5 * u);
  }

  showPage() {
    const full = this.pages[this.pageIndex];
    this.text.setText('');
    this.arrow.setVisible(false);
    let i = 0;
    this.typing?.remove();
    this.typing = this.scene.time.addEvent({
      delay: CHAR_DELAY,
      repeat: full.length - 1,
      callback: () => {
        i++;
        this.text.setText(full.slice(0, i));
        if (i % 3 === 1 && full[i - 1] !== ' ') sfx('blip');     // petit bip du texte, comme dans Pokémon
        if (i >= full.length) this.finishTyping();
      },
    });
  }

  finishTyping() {
    this.typing?.remove();
    this.typing = null;
    this.text.setText(this.pages[this.pageIndex]);
    const asking = this.choices && this.pageIndex === this.pages.length - 1;
    this.arrow.setVisible(!asking);
    if (asking) this.showChoices();
  }

  onKey(e) {
    // Ignore la touche qui vient d'ouvrir le dialogue.
    if (!this.isOpen || e.timeStamp <= this.openedAt) return;

    // Choix affiché : flèches pour choisir, Entrée / Espace pour valider.
    if (this.choices && this.choiceTexts.length) {
      const n = this.choices.length;
      if (e.key === 'ArrowUp') this.choiceIndex = (this.choiceIndex - 1 + n) % n;
      else if (e.key === 'ArrowDown') this.choiceIndex = (this.choiceIndex + 1) % n;
      else if (e.key === 'Enter' || e.key === ' ') {
        sfx('confirm');
        return this.close(this.choiceIndex);
      } else return;
      sfx('select');
      return this.renderChoices();
    }

    if (e.key !== 'Enter' && e.key !== ' ') return;
    if (this.typing) return this.finishTyping();
    sfx('select');
    if (this.pageIndex < this.pages.length - 1) {
      this.pageIndex++;
      return this.showPage();
    }
    this.close();
  }

  close(result) {
    this.container.setVisible(false);
    this.hideChoices();
    this.choices = null;
    this.closedAt = performance.now();
    const resolve = this.resolve;
    this.resolve = null;
    resolve?.(result);
  }
}
