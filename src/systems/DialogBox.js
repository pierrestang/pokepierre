// Boîte de dialogue en bas de l'écran : texte affiché progressivement, page par page.
// Entrée / Espace : termine la page en cours d'écriture, sinon passe à la suivante.
// choose(question, options) : pose une question, liste de réponses (flèches haut/bas + Entrée).
// open(pages, { item }) : montre aussi l'icône de l'objet (voir art/uiIcons.js) dans un cadre au-dessus de la boîte.
// open(pages, { speaker, phone: true }) : la personne parle au téléphone, une petite icône de téléphone (dessinée dans le
// code) précède son nom.
// Vit dans la UIScene (pas de zoom) ; les scènes de jeu l'ouvrent via open(pages) ou choose().
// Texte dans la police de Rouge Feu (voir frlgFont.js), deux lignes par page comme dans le jeu : les pages
// trop longues sont coupées automatiquement.

import { gameView } from './screen.js';
import { FRLG_FONT, LINE_HEIGHT, frlgText, wrapText } from './frlgFont.js';
import { sfx } from './audio.js';
import { drawFrame, FRAME, FRAME_LIGHT, FRAME_FILL } from './frame.js';
import { ITEM_ICONS, itemIcon } from '../art/uiIcons.js';

const CHAR_DELAY = 25; // ms par caractère
// Les dimensions sont en « pixels Game Boy » (u = facteur d'agrandissement de l'écran de jeu).
const HEIGHT = 46;
const LINES = 2;             // lignes par page
const TEXT_LEFT = 9;         // marge du texte dans la boîte

// Icône de téléphone (appel) : un petit portable vu de face, 6 x 11 pixels Game Boy, et ses ondes.
const PHONE_W = 11;          // place prise devant le nom (icône, ondes et marge)
function drawPhone(g, x, y, u) {
  const px = (dx, dy, w, h, color) => g.fillStyle(color, 1).fillRect(x + dx * u, y + dy * u, w * u, h * u);
  px(0, 0, 6, 11, 0x303848);                     // boîtier (contour sombre)
  px(1, 1, 4, 5, 0x88c8f0);                      // écran
  px(1, 7, 4, 3, 0x586078);                      // clavier
  px(2, 8, 1, 1, 0xd0d8e8);
  px(4, 8, 1, 1, 0xd0d8e8);
  px(7, 2, 1, 1, 0xe04040);                      // ondes de la sonnerie
  px(8, 1, 1, 1, 0xe04040);
  px(8, 3, 1, 1, 0xe04040);
}

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
    this.phone = false;                 // la personne appelle au téléphone (icône devant le nom)
    this.nameBg = scene.add.graphics();
    this.nameText = bitmapText(scene);

    // Pas de portrait (comme dans les jeux DS) : seuls le nom et le texte s'affichent.

    // Icône de l'objet reçu, dans un petit cadre posé sur le bord haut de la boîte, à droite.
    this.icon = null;
    this.iconBg = scene.add.graphics();
    this.iconImage = scene.add.image(0, 0, ITEM_ICONS).setVisible(false);

    this.arrow = scene.add.triangle(0, 0, 0, 0, 14, 0, 7, 9, 0xe04040);
    scene.tweens.add({ targets: this.arrow, alpha: 0.2, duration: 300, yoyo: true, repeat: -1 });

    this.container = scene.add
      .container(0, 0, [this.box, this.text, this.nameBg, this.nameText, this.iconBg, this.iconImage, this.arrow])
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
    drawFrame(this.box, x, y, w, H, u, 4);
    // Réglettes bleu clair sur les côtés, comme dans Rouge Feu
    this.box.fillStyle(FRAME_LIGHT, 1).fillRect(x + 4 * u, y + 7 * u, 1.5 * u, H - 14 * u);
    this.box.fillStyle(FRAME_LIGHT, 1).fillRect(x + w - 5.5 * u, y + 7 * u, 1.5 * u, H - 14 * u);

    this.text.setScale(u).setPosition(x + TEXT_LEFT * u, y + 6 * u);
    this.nameText.setScale(u).setPosition(x + 7 * u, y - 13 * u);
    this.arrow.setScale(u / 5).setPosition(x + w - 11 * u, y + H - 9 * u);
    this.setSpeaker(this.speaker, this.phone);
    this.setIcon(this.icon);
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
  open(pages, { speaker, item = null, phone = false } = {}) {
    this.pages = this.paginate(Array.isArray(pages) ? pages : [pages]);
    this.pageIndex = 0;
    this.openedAt = performance.now();
    this.setSpeaker(speaker, phone);
    this.setIcon(item ? itemIcon(item.id) : null);
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
    drawFrame(this.choiceBox, x, y, w, h, u);
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

  setSpeaker(speaker, phone = false) {
    this.speaker = speaker;
    this.phone = Boolean(speaker && phone);
    this.nameBg.clear();
    this.nameText.setText(speaker ? frlgText(this.scene, speaker) : '');
    if (!speaker) return;
    // Petit cartouche blanc cerclé, posé sur le bord haut de la boîte ; au téléphone, l'icône prend place devant le nom.
    const u = this.u;
    const iconW = this.phone ? PHONE_W * u : 0;
    const w = this.nameText.width + 8 * u + iconW;
    const x = this.boxX + 3 * u;
    const y = this.boxY - 14 * u;
    this.nameText.setPosition(x + 4 * u + iconW, y + u);
    this.nameBg.fillStyle(FRAME, 1).fillRoundedRect(x, y, w, 15 * u, 3 * u);
    this.nameBg.fillStyle(FRAME_FILL, 1).fillRoundedRect(x + u, y + u, w - 2 * u, 13 * u, 2.5 * u);
    if (this.phone) drawPhone(this.nameBg, x + 4 * u, y + 2 * u, u);
  }

  setIcon(icon) {
    this.icon = icon;
    this.iconBg.clear();
    this.iconImage.setVisible(icon !== null);
    if (!icon) return;
    const u = this.u;
    const size = 30 * u;
    const x = this.boxX + this.boxW - size - 4 * u;
    const y = this.boxY - size - 2 * u;
    drawFrame(this.iconBg, x, y, size, size, u);
    this.iconImage.setTexture(ITEM_ICONS, icon).setScale(u).setPosition(x + size / 2, y + size / 2);
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
