// Boîte de dialogue en bas de l'écran : texte affiché progressivement, page par page.
// Entrée / Espace : termine la page en cours d'écriture, sinon passe à la suivante.
// choose(question, options) : pose une question, liste de réponses (flèches haut/bas + Entrée).
// Vit dans la UIScene (pas de zoom) ; les scènes de jeu l'ouvrent via open(pages) ou choose().

const CHAR_DELAY = 25; // ms par caractère
const MARGIN = 12;
const HEIGHT = 120;
const MAX_WIDTH = 900;

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
    this.text = scene.add.text(0, 0, '', {
      fontFamily: 'monospace',
      fontSize: '22px',
      color: '#303030',
      lineSpacing: 6,
    });

    // Étiquette du nom de la personne qui parle
    this.nameBg = scene.add.graphics();
    this.nameText = scene.add.text(0, 0, '', {
      fontFamily: 'monospace', fontSize: '18px', color: '#ffffff', fontStyle: 'bold',
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

  // Place la boîte en bas de l'écran, centrée, largeur plafonnée. Rappelée à chaque redimensionnement.
  layout() {
    const { width, height } = this.scene.scale;
    const w = Math.min(width - MARGIN * 2, MAX_WIDTH);
    const x = (width - w) / 2;
    const y = height - HEIGHT - MARGIN;
    this.boxX = x;
    this.boxY = y;

    this.box.clear();
    this.box.fillStyle(0x283048, 1).fillRoundedRect(x, y, w, HEIGHT, 10);
    this.box.fillStyle(0xf8f8f8, 1).fillRoundedRect(x + 4, y + 4, w - 8, HEIGHT - 8, 7);
    this.box.lineStyle(2, 0x6878a8, 1).strokeRoundedRect(x + 8, y + 8, w - 16, HEIGHT - 16, 5);

    this.text.setPosition(x + 24, y + 20).setWordWrapWidth(w - 48);
    this.nameText.setPosition(x + 22, y - 26);
    this.arrow.setPosition(x + w - 32, y + HEIGHT - 28);
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
    const lineH = 30;
    const texts = this.choices.map((label) =>
      this.scene.add.text(0, 0, label, { fontFamily: 'monospace', fontSize: '20px', color: '#303030' }).setDepth(102),
    );
    const w = Math.max(...texts.map((t) => t.width)) + 56;
    const h = texts.length * lineH + 20;
    const x = this.boxX + Math.min(this.scene.scale.width - MARGIN * 2, MAX_WIDTH) - w;
    const y = this.boxY - h - 8;
    this.choiceBox.clear().setVisible(true);
    this.choiceBox.fillStyle(0x283048, 1).fillRoundedRect(x, y, w, h, 8);
    this.choiceBox.fillStyle(0xf8f8f8, 1).fillRoundedRect(x + 3, y + 3, w - 6, h - 6, 6);
    texts.forEach((t, i) => t.setPosition(x + 14, y + 12 + i * lineH));   // « ▶ » ajouté devant
    this.choiceTexts = texts;
    this.renderChoices();
  }

  renderChoices() {
    this.choiceTexts.forEach((t, i) => {
      const selected = i === this.choiceIndex;
      t.setText((selected ? '▶ ' : '  ') + this.choices[i]);
      t.setColor(selected ? '#d04040' : '#303030');
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
    const w = this.nameText.width + 20;
    this.nameBg.fillStyle(0x283048, 1).fillRoundedRect(this.boxX + 12, this.boxY - 32, w, 30, 6);
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
      else if (e.key === 'Enter' || e.key === ' ') return this.close(this.choiceIndex);
      else return;
      return this.renderChoices();
    }

    if (e.key !== 'Enter' && e.key !== ' ') return;
    if (this.typing) return this.finishTyping();
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
