import { SCREEN_W, SCREEN_H } from './screen.js';
import { sfx } from './audio.js';
import { items } from './items.js';
import { flags } from './flags.js';
import { wrapText, textWidth, frlgText, LINE_HEIGHT } from './frlgFont.js';
import { ITEM_ICONS, itemIcon } from '../art/uiIcons.js';
import { ITEMS } from '../data/story.js';
import { OBJECTS, SOUVENIRS } from '../data/bag.js';
import { FullScreenPanel, BAR } from './FullScreenPanel.js';

// Menu Start > OBJETS (ou touche I) : le sac, dans le style du panneau PNJ, en deux onglets (data/bag.js) : « Objets »
// (ce qui sert encore) et « Souvenirs » (ce qui ne sert plus ; un souvenir y passe tout seul quand sa quête est finie),
// chacun avec son icône (voir art/uiIcons.js) ; sous la liste, le court texte du souvenir choisi.
// Gauche / droite : changer d'onglet ; haut / bas : choisir ; Échap : fermer.
const ROWS = 4;                 // objets par colonne
const ROW_H = 30;
const TABS = ['Objets', 'Souvenirs'];

// Le nom actuel d'un objet (une sauvegarde garde le nom qu'il avait quand on l'a reçu).
const NAMES = Object.fromEntries(Object.values(ITEMS).map((i) => [i.id, i.name]));
const isSouvenir = (id) => {
  const s = SOUVENIRS.find((x) => x.id === id);
  return Boolean(s) && (!s.after || flags.has(s.after));
};
const rank = (id) => {
  const i = [...OBJECTS, ...SOUVENIRS.map((s) => s.id)].indexOf(id);
  return i < 0 ? 999 : i;
};

export class ItemBag extends FullScreenPanel {
  open() {
    this.tab = 0;
    this.index = 0;
    this.isOpen = true;
    this.render();
  }

  // Les objets de l'onglet, dans l'ordre du jeu (un objet inconnu, d'une très vieille sauvegarde, n'est pas montré).
  list() {
    return items.list()
      .filter((i) => i.id in NAMES && isSouvenir(i.id) === (this.tab === 1))
      .sort((a, b) => rank(a.id) - rank(b.id))
      .map((i) => ({ id: i.id, name: NAMES[i.id] }));
  }

  render() {
    this.begin();
    const { scene: s, u, X, Y } = this;
    const text = (t, x, y, color) => this.text(t, x, y, color);
    const g = this.add(s.add.graphics());
    this.drawBars(g, 0xe87830, 0xf8f8f0);
    const list = this.list();

    // Les deux onglets, dans le bandeau du haut ; l'onglet ouvert sur fond clair.
    let tx = 6;
    TABS.forEach((name, i) => {
      const label = name.toUpperCase();
      const w = textWidth(s, frlgText(s, label)) + 6;
      if (i === this.tab) g.fillStyle(0xf8f8f0, 1).fillRoundedRect(X(tx - 3), Y(2), w * u, (BAR - 2) * u, 2 * u);
      text(label, tx, 1, i === this.tab ? 0xe87830 : 0xffffff);
      tx += w + 8;
    });
    const perPage = 2 * ROWS;
    const page = Math.floor(this.index / perPage);
    const pages = Math.max(1, Math.ceil(list.length / perPage));
    text(`${list.length} · ${page + 1}/${pages}`, SCREEN_W - 52, 1, 0xffffff);
    text('Gauche, droite : onglet   Haut, bas : choisir   Échap : fermer', 6, SCREEN_H - BAR + 1, 0xffffff);

    if (!list.length) {
      text(this.tab === 0 ? "Rien dans le sac pour l'instant." : "Pas encore de souvenirs.", 20, BAR + 50);
      return;
    }
    list.slice(page * perPage, (page + 1) * perPage).forEach((item, j) => {
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

    // Onglet Souvenirs : sous la liste, dans un cadre, le court texte du souvenir choisi.
    if (this.tab !== 1) return;
    const about = SOUVENIRS.find((x) => x.id === list[this.index].id)?.text ?? '';
    const top = BAR + 4 + ROWS * ROW_H + 2;
    g.lineStyle(u, 0xe87830, 1).strokeRoundedRect(X(4), Y(top), (SCREEN_W - 8) * u, (SCREEN_H - BAR - top - 3) * u, 3 * u);
    wrapText(s, about, SCREEN_W - 24).slice(0, 3).forEach((line, k) => text(line, 12, top + 3 + k * LINE_HEIGHT));
  }

  // Touche pendant que le sac est ouvert. Renvoie vrai quand il se ferme.
  onKey(e) {
    if (e.key === 'Escape' || e.key === 'Enter' || e.key === ' ') {
      sfx('select');
      this.close();
      return true;
    }
    if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
      const tab = e.key === 'ArrowRight' ? 1 : 0;
      if (tab === this.tab) return false;
      this.tab = tab;
      this.index = 0;
      sfx('select');
      this.render();
      return false;
    }
    const delta = { ArrowDown: 1, ArrowUp: -1 }[e.key];
    const n = this.list().length;
    if (!delta || !n) return false;
    this.index = Math.min(n - 1, Math.max(0, this.index + delta));
    sfx('select');
    this.render();
    return false;
  }
}
