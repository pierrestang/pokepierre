import { SCREEN_W, SCREEN_H } from './screen.js';
import { sfx } from './audio.js';
import { items } from './items.js';
import { ITEM_ICONS, itemIcon } from '../art/uiIcons.js';
import { FullScreenPanel, BAR } from './FullScreenPanel.js';

// Menu Start > OBJETS (ou touche I) : le sac, dans le style du panneau PNJ. Les objets en deux colonnes, chacun
// avec son icône (voir art/uiIcons.js). Flèches : choisir ; Échap : fermer.
const ROWS = 5;                 // objets par colonne
const ROW_H = 30;

export class ItemBag extends FullScreenPanel {
  open() {
    this.list = items.list();
    this.index = 0;
    this.isOpen = true;
    this.render();
  }

  render() {
    this.begin();
    const { scene: s, u, X, Y } = this;
    const text = (t, x, y, color) => this.text(t, x, y, color);
    const g = this.add(s.add.graphics());
    this.drawBars(g, 0xe87830, 0xf8f8f0);

    const perPage = 2 * ROWS;
    const page = Math.floor(this.index / perPage);
    const pages = Math.max(1, Math.ceil(this.list.length / perPage));
    text(`SAC — OBJETS (${this.list.length})`, 6, 1, 0xffffff);
    text(`Page ${page + 1} / ${pages}`, SCREEN_W - 70, 1, 0xffffff);
    text('Flèches : choisir   Échap : fermer', 6, SCREEN_H - BAR + 1, 0xffffff);

    if (!this.list.length) {
      text("Ton sac est vide. Tu n'as encore aucun objet.", 20, SCREEN_H / 2 - 8);
      return;
    }
    this.list.slice(page * perPage, (page + 1) * perPage).forEach((item, j) => {
      const i = page * perPage + j;
      const x = j < ROWS ? 6 : SCREEN_W / 2 + 2;
      const y = BAR + 4 + (j % ROWS) * ROW_H;
      if (i === this.index) {
        g.fillStyle(0xf8c890, 1).fillRoundedRect(X(x - 2), Y(y), (SCREEN_W / 2 - 8) * u, (ROW_H - 2) * u, 2 * u);
      }
      const frame = itemIcon(item.id);
      if (frame) this.add(s.add.image(X(x + 14), Y(y + (ROW_H - 2) / 2), ITEM_ICONS, frame).setScale(u));
      text(item.name, x + 32, y + 8);
    });
  }

  // Touche pendant que le sac est ouvert. Renvoie vrai quand il se ferme.
  onKey(e) {
    if (e.key === 'Escape' || e.key === 'Enter' || e.key === ' ') {
      sfx('select');
      this.close();
      return true;
    }
    const delta = { ArrowDown: 1, ArrowUp: -1, ArrowRight: ROWS, ArrowLeft: -ROWS }[e.key];
    if (!delta || !this.list.length) return false;
    this.index = Math.min(this.list.length - 1, Math.max(0, this.index + delta));
    sfx('select');
    this.render();
    return false;
  }
}
