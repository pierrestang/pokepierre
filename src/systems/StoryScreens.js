import { gameView, SCREEN_W, SCREEN_H } from './screen.js';
import { FullScreenPanel, BAR } from './FullScreenPanel.js';
import { POSTCARDS } from '../art/uiIcons.js';
import { sfx } from './audio.js';

// Écrans des scénettes, affichés par la UIScene par-dessus le jeu (voir MapScene.runSteps) :
//  - carte postale d'ouverture d'une ville (image d'accueil, au-dessus de la boîte de dialogue) ;
//  - saisie d'un mot (ex. le mot de passe de la cabane), façon nom du rival.

// Carte postale de la ville `id` (atlas POSTCARDS, 256 x 160) en plein écran de jeu : agrandie pour couvrir les
// 360 x 240 px (rognée sur les côtés, sans déformation), affichée d'un coup pour qu'on ne voie pas la carte avant.
// Renvoie une fonction qui la retire en fondu.
export function showPostcard(scene, id) {
  const g = scene.add.graphics().setDepth(96);
  const image = scene.add.image(0, 0, POSTCARDS, id).setOrigin(0.5).setDepth(97);
  const { width, height } = image.frame;
  const cover = Math.max(SCREEN_W / width, SCREEN_H / height);
  const cropW = SCREEN_W / cover;
  const cropH = SCREEN_H / cover;
  image.setCrop((width - cropW) / 2, (height - cropH) / 2, cropW, cropH);
  const draw = () => {
    const v = gameView(scene.scale);
    g.clear();
    g.fillStyle(0x000000, 1).fillRect(v.x, v.y, v.w, v.h);
    image.setScale(cover * v.zoom).setPosition(v.x + v.w / 2, v.y + v.h / 2);
  };
  draw();
  scene.scale.on('resize', draw);
  return () => new Promise((resolve) => {
    scene.tweens.add({
      targets: [g, image],
      alpha: 0,
      duration: 700,
      onComplete: () => {
        scene.scale.off('resize', draw);
        g.destroy();
        image.destroy();
        resolve();
      },
    });
  });
}

// Saisie d'un mot, façon nom du rival : grille de lettres (flèches + Entrée), EFFACER et OK ; on peut aussi taper
// au clavier (lettres, Retour arrière, Entrée). `open({ title, max })` renvoie une promesse du mot choisi (non vide).
const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
const COLS = 9;
const CELLS = [...LETTERS, ' ', 'EFFACER', 'OK'];
export class WordEntry extends FullScreenPanel {
  open({ title, max = 8 }) {
    this.title = title;
    this.max = max;
    this.word = '';
    this.index = 0;
    this.isOpen = true;
    this.render();
    return new Promise((resolve) => {
      this.listener = (e) => {
        const word = this.onKey(e);
        if (word !== null) resolve(word);
      };
      this.scene.input.keyboard.on('keydown', this.listener);
    });
  }

  close() {
    super.close();
    this.scene.input.keyboard.off('keydown', this.listener);
  }

  render() {
    this.begin();
    const { scene: s, u, X, Y } = this;
    const g = this.add(s.add.graphics());
    this.drawBars(g, 0x4878c0, 0xf0f0e8);
    this.text(this.title, 6, 1, 0xffffff);
    this.text('Flèches : choisir   Entrée : valider', 6, SCREEN_H - BAR + 1, 0xffffff);
    // Le mot, une case par lettre.
    const boxW = 14;
    const x0 = SCREEN_W / 2 - (this.max * boxW) / 2;
    for (let i = 0; i < this.max; i++) {
      g.fillStyle(0x303038, 1).fillRect(X(x0 + i * boxW + 2), Y(52), (boxW - 4) * u, u);
      const c = this.word[i];
      if (c) this.text(c, x0 + i * boxW + 4, 36);
    }
    // Grille des lettres.
    CELLS.forEach((cell, i) => {
      const special = cell.length > 1;
      const x = special ? (cell === 'OK' ? 250 : 150) : 50 + (i % COLS) * 30;
      const y = special ? 180 : 76 + Math.floor(i / COLS) * 26;
      const w = special || cell === ' ' ? 54 : 22;
      if (i === this.index) g.fillStyle(0xf8c890, 1).fillRoundedRect(X(x - 4), Y(y - 2), w * u, 20 * u, 2 * u);
      this.text(cell === ' ' ? 'ESPACE' : cell, x, y);
    });
  }

  // Renvoie le mot une fois validé, sinon null.
  onKey(e) {
    const move = { ArrowRight: 1, ArrowLeft: -1, ArrowDown: COLS, ArrowUp: -COLS }[e.key];
    if (move) {
      this.index = Math.min(CELLS.length - 1, Math.max(0, this.index + move));
      sfx('select');
      this.render();
      return null;
    }
    let cell = null;
    if (e.key === 'Enter' || e.key === ' ') cell = CELLS[this.index];
    else if (e.key === 'Backspace') cell = 'EFFACER';
    else if (/^[a-zA-Z]$/.test(e.key)) cell = e.key.toUpperCase();
    if (!cell) return null;
    if (cell === 'OK') {
      const word = this.word.trim();
      if (!word) {
        sfx('bump');
        return null;
      }
      sfx('confirm');
      this.close();
      return word;
    }
    if (cell === 'EFFACER') this.word = this.word.slice(0, -1);
    else if (this.word.length < this.max) this.word += cell;
    else {
      sfx('bump');
      return null;
    }
    sfx('select');
    // Mot complet : le curseur saute sur OK.
    if (this.word.length === this.max) this.index = CELLS.length - 1;
    this.render();
    return null;
  }
}
