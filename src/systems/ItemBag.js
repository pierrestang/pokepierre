import { SCREEN_W, SCREEN_H } from './screen.js';
import { sfx } from './audio.js';
import { items } from './items.js';
import { flags } from './flags.js';
import { wrapText, textWidth, frlgText, LINE_HEIGHT } from './frlgFont.js';
import { ITEM_ICONS, itemIcon } from '../art/uiIcons.js';
import { souvenirs } from './souvenirs.js';
import { ITEMS, TRAITS, MAX_TRAITS } from '../data/story.js';
import { MAPS } from '../data/maps/index.js';
import { ABOUT, CARNET, SOUVENIRS } from '../data/bag.js';
import { FullScreenPanel, BAR } from './FullScreenPanel.js';

// Menu Start > SAC (ou touche I) : le sac en trois onglets (data/bag.js) : « Objets » (ce qui sert encore), « Souvenirs »
// (ce qui ne sert plus ; un souvenir y passe tout seul quand sa quête est finie ; aussi les souvenirs du carnet, comme la
// photo du canal), chacun avec son icône (art/uiIcons.js), et « Vertus » (le carnet des vertus : chaque vertu reçue, sa
// phrase, sa ville et ses utilisations).
// La grille se remplit ligne par ligne (gauche, puis droite), dans l'ordre où Pierre a reçu les objets ; sous la grille,
// la phrase de l'objet choisi, comme dans Pokémon. Flèches : choisir (à gauche de la colonne de gauche, ou à droite de
// celle de droite : l'autre onglet) ; Tab : changer d'onglet ; Échap : fermer.
const ROWS = 4;                 // objets par colonne
const ROW_H = 30;
const TABS = ['Objets', 'Souvenirs', 'Vertus'];

// Le nom actuel d'un objet (une sauvegarde garde le nom qu'il avait quand on l'a reçu).
const NAMES = Object.fromEntries(Object.values(ITEMS).map((i) => [i.id, i.name]));
const isSouvenir = (id) => {
  const s = SOUVENIRS.find((x) => x.id === id);
  return Boolean(s) && (!s.after || flags.has(s.after));
};

export class ItemBag extends FullScreenPanel {
  open() {
    this.tab = 0;
    this.index = 0;
    this.isOpen = true;
    this.render();
  }

  // Ce que montre l'onglet : { id, name, icon, about }. Objets et souvenirs dans l'ordre où Pierre les a reçus (celui du
  // sac ; un objet inconnu, d'une très vieille sauvegarde, n'est pas montré) ; les vertus dans l'ordre du jeu.
  list() {
    if (this.tab === 2) {
      const times = (n) => (n ? `utilisée ${n} fois` : 'pas encore utilisée');
      return Object.values(TRAITS).filter((t) => souvenirs.has(t.id)).map((t) => ({
        id: t.id, name: t.name, icon: null,
        about: `« ${t.phrase} » ${MAPS[t.city]?.name ?? t.city}, ${times(souvenirs.uses(t.id))}.`,
      }));
    }
    const bag = items.list()
      .filter((i) => i.id in NAMES && isSouvenir(i.id) === (this.tab === 1))
      .map((i) => ({ id: i.id, name: NAMES[i.id], icon: itemIcon(i.id), about: ABOUT[i.id] ?? '' }));
    if (this.tab === 0) return bag;
    const carnet = CARNET.filter((c) => souvenirs.has(c.id))
      .map((c) => ({ id: c.id, name: souvenirs.list().find((x) => x.id === c.id)?.name ?? c.id, icon: c.icon, about: c.text }));
    return [...bag, ...carnet];
  }

  render() {
    this.begin();
    const { scene: s, u, X, Y } = this;
    const text = (t, x, y, color) => this.text(t, x, y, color);
    const g = this.add(s.add.graphics());
    this.drawBars(g, 0xe87830, 0xf8f8f0);
    const list = this.list();

    // Les onglets, dans le bandeau du haut ; l'onglet ouvert sur fond clair.
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
    const count = this.tab === 2 ? `${list.length} sur ${MAX_TRAITS}` : `${list.length} · ${page + 1}/${pages}`;
    text(count, SCREEN_W - textWidth(s, frlgText(s, count)) - 6, 1, 0xffffff);
    text('Flèches : choisir   Tab : onglet   Échap : fermer', 6, SCREEN_H - BAR + 1, 0xffffff);

    if (!list.length) {
      text(["Rien dans le sac pour l'instant.", 'Pas encore de souvenirs.', 'Ton carnet des vertus est encore vide.'][this.tab], 20, BAR + 50);
      return;
    }
    list.slice(page * perPage, (page + 1) * perPage).forEach((item, j) => {
      const i = page * perPage + j;
      const x = j % 2 ? SCREEN_W / 2 + 2 : 6;                    // ligne par ligne : gauche, puis droite
      const y = BAR + 4 + Math.floor(j / 2) * ROW_H;
      if (i === this.index) {
        g.fillStyle(0xf8c890, 1).fillRoundedRect(X(x - 2), Y(y), (SCREEN_W / 2 - 8) * u, (ROW_H - 2) * u, 2 * u);
      }
      if (item.icon) this.add(s.add.image(X(x + 14), Y(y + (ROW_H - 2) / 2), ITEM_ICONS, item.icon).setScale(u));
      text(item.name, item.icon || this.tab !== 2 ? x + 32 : x + 8, y + 8);
    });

    // Sous la grille, dans un cadre : la phrase de l'objet choisi.
    const { about } = list[this.index];
    const top = BAR + 4 + ROWS * ROW_H + 2;
    g.lineStyle(u, 0xe87830, 1).strokeRoundedRect(X(4), Y(top), (SCREEN_W - 8) * u, (SCREEN_H - BAR - top - 3) * u, 3 * u);
    wrapText(s, about, SCREEN_W - 24).slice(0, 3).forEach((line, k) => text(line, 12, top + 3 + k * LINE_HEIGHT));
  }

  setTab(tab) {
    if (tab === this.tab) return;
    this.tab = tab;
    this.index = 0;
    sfx('select');
    this.render();
  }

  // Touche pendant que le sac est ouvert. Renvoie vrai quand il se ferme.
  onKey(e) {
    if (e.key === 'Escape' || e.key === 'Enter' || e.key === ' ') {
      sfx('select');
      this.close();
      return true;
    }
    if (e.key === 'Tab') {
      e.preventDefault?.();
      this.setTab((this.tab + 1) % TABS.length);
      return false;
    }
    const n = this.list().length;
    const right = this.index % 2 === 1;
    // Gauche depuis la colonne de gauche, droite depuis celle de droite (ou un onglet vide) : l'onglet d'à côté.
    if (e.key === 'ArrowLeft' && (!right || !n)) return this.setTab(Math.max(0, this.tab - 1)), false;
    if (e.key === 'ArrowRight' && (right || this.index + 1 >= n)) return this.setTab(Math.min(TABS.length - 1, this.tab + 1)), false;
    const delta = { ArrowDown: 2, ArrowUp: -2, ArrowRight: 1, ArrowLeft: -1 }[e.key];
    if (!delta || !n) return false;
    const next = this.index + delta;
    if (next < 0 || next >= n) return false;
    this.index = next;
    sfx('select');
    this.render();
    return false;
  }
}
