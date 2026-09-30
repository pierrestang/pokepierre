// Boîte de dialogue en bas de l'écran : texte affiché progressivement, page par page.
// Entrée / Espace : termine la page en cours d'écriture, sinon passe à la suivante.
// choose(question, options) : pose une question, liste de réponses (flèches haut/bas + Entrée).
// Vit dans la UIScene (pas de zoom) ; les scènes de jeu l'ouvrent via open(pages) ou choose().

import { gameView, FONT } from './screen.js';
import { sfx } from './audio.js';

const CHAR_DELAY = 25; // ms par caractère
// Les dimensions sont en « pixels Game Boy » (u = facteur d'agrandissement de l'écran de jeu).
const HEIGHT = 46;
// Couleurs façon Rouge Feu : fond blanc, cadre bleu-gris arrondi, texte bleu ardoise ombré.
const FRAME = 0x6888a8;
const FRAME_LIGHT = 0xb8d0e8;
const TEXT_STYLE = {
  fontFamily: FONT, fontSize: '24px', color: '#404c68', lineSpacing: 8,
  shadow: { offsetX: 2, offsetY: 2, color: '#c8d4e0', fill: true, blur: 0 },
};

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
    this.text = scene.add.text(0, 0, '', TEXT_STYLE);

    // Étiquette du nom de la personne qui parle
    this.nameBg = scene.add.graphics();
    this.nameText = scene.add.text(0, 0, '', {
      fontFamily: FONT, fontSize: '18px', color: '#ffffff', fontStyle: 'bold',
    });

    this.arrow = scene.add.triangle(0, 0, 0, 0, 14, 0, 7, 9, 0xe04040);
    scene.tweens.add({ targets: this.arrow, alpha: 0.2, duration: 300, yoyo: true, repeat: -1 });

    this.container = scene.add
      .container(0, 0, [this.box, this.text, this.nameBg, this.nameText, this.arrow])
      .setDepth(100)
      .setVisible(false);

    // Liste de réponses (choose)
    this.choices = null;
    this.choiceIndex = 0;
    this.choiceBox = scene.add.graphics().setDepth(101).setVisible(false);
    this.choiceTexts = [];

    this.layout();
    scene.scale.on('resize', this.layout, this);

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

    this.text
      .setFontSize(6 * u)
      .setLineSpacing(2 * u)
      .setShadow(Math.max(1, Math.round(u / 2)), Math.max(1, Math.round(u / 2)), '#c8d4e0', 0, false, true)
      .setPosition(x + 9 * u, y + 6 * u)
      .setWordWrapWidth(w - 18 * u);
    this.nameText.setFontSize(4 * u).setPosition(x + 6 * u, y - 5.5 * u);
    this.arrow.setScale(u / 5).setPosition(x + w - 11 * u, y + H - 9 * u);
    this.setSpeaker(this.nameText.text || undefined);
  }

  get isOpen() {
    return this.container.visible;
  }

  // Ouvre le dialogue ; la promesse se résout quand la dernière page est fermée.
  open(pages, { speaker } = {}) {
    this.pages = Array.isArray(pages) ? pages : [pages];
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
    const lineH = 9 * u;
    const texts = this.choices.map((label) =>
      this.scene.add.text(0, 0, '▶ ' + label, { ...TEXT_STYLE, fontSize: `${6 * u}px` }).setDepth(102),
    );
    const w = Math.max(...texts.map((t) => t.width)) + 12 * u;
    const h = texts.length * lineH + 8 * u;
    const x = this.boxX + this.boxW - w;
    const y = this.boxY - h - 2 * u;
    this.choiceBox.clear().setVisible(true);
    this.choiceBox.fillStyle(FRAME, 1).fillRoundedRect(x, y, w, h, 3 * u);
    this.choiceBox.fillStyle(FRAME_LIGHT, 1).fillRoundedRect(x + u, y + u, w - 2 * u, h - 2 * u, 2.5 * u);
    this.choiceBox.fillStyle(0xf8f8f8, 1).fillRoundedRect(x + 2 * u, y + 2 * u, w - 4 * u, h - 4 * u, 2 * u);
    texts.forEach((t, i) => t.setPosition(x + 5 * u, y + 4 * u + i * lineH));   // « ▶ » ajouté devant
    this.choiceTexts = texts;
    this.renderChoices();
  }

  renderChoices() {
    this.choiceTexts.forEach((t, i) => {
      const selected = i === this.choiceIndex;
      t.setText((selected ? '▶ ' : '  ') + this.choices[i]);
      t.setColor(selected ? '#d04040' : '#404c68');
    });
  }

  hideChoices() {
    this.choiceTexts.forEach((t) => t.destroy());
    this.choiceTexts = [];
    this.choiceBox.setVisible(false);
  }

  setSpeaker(speaker) {
    this.nameBg.clear();
    this.nameText.setText(speaker ?? '');
    if (!speaker) return;
    const u = this.u;
    const w = this.nameText.width + 6 * u;
    this.nameBg.fillStyle(FRAME, 1).fillRoundedRect(this.boxX + 3 * u, this.boxY - 7 * u, w, 7.5 * u, 2 * u);
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
