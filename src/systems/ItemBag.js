import { gameView, SCREEN_W, SCREEN_H } from './screen.js';
import { FRLG_FONT, frlgText } from './frlgFont.js';
import { sfx } from './audio.js';
import { items } from './items.js';
import { ITEM_ICONS, itemIcon } from '../art/uiIcons.js';

// Menu Start > OBJETS : le sac, dans le style du panneau PNJ. Les objets en deux colonnes, chacun avec son
// icône (voir art/uiIcons.js). Flèches : choisir ; Échap : fermer.
const BAR = 16;
const ROWS = 5;                 // objets par colonne
const ROW_H = 30;

export class ItemBag {
  constructor(scene) {
    this.scene = scene;
    this.isOpen = false;
    this.objects = [];
    const onResize = () => this.isOpen && this.render();
    scene.scale.on('resize', onResize);
    scene.events.once('shutdown', () => scene.scale.off('resize', onResize));
  }

  open() {
    this.list = items.list();
    this.index = 0;
    this.isOpen = true;
    this.render();
  }

  close() {
    this.isOpen = false;
    this.objects.forEach((o) => o.destroy());
    this.objects = [];
  }

  add(o) {
    this.objects.push(o.setDepth(120));
    return o;
  }

  render() {
    this.objects.forEach((o) => o.destroy());
    this.objects = [];
    const s = this.scene;
    const v = gameView(s.scale);
    const u = v.zoom;
    const X = (x) => v.x + x * u;
    const Y = (y) => v.y + y * u;
    const text = (t, x, y, color = 0x303038) => this.add(s.add.bitmapText(X(x), Y(y), FRLG_FONT, frlgText(s, t)).setScale(u).setTintFill(color));
    const icon = (id, x, y, scale = 1) => {
      const frame = itemIcon(id);
      if (frame) this.add(s.add.image(X(x), Y(y), ITEM_ICONS, frame).setScale(u * scale));
    };

    const g = this.add(s.add.graphics());
    g.fillStyle(0xf8f8f0, 1).fillRect(X(0), Y(0), SCREEN_W * u, SCREEN_H * u);
    g.fillStyle(0xe87830, 1).fillRect(X(0), Y(0), SCREEN_W * u, BAR * u);
    g.fillStyle(0xe87830, 1).fillRect(X(0), Y(SCREEN_H - BAR), SCREEN_W * u, BAR * u);

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
      icon(item.id, x + 14, y + (ROW_H - 2) / 2);
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
