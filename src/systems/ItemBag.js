import { SCREEN_W, SCREEN_H } from './screen.js';
import { sfx } from './audio.js';
import { items } from './items.js';
import { flags, meetsConditions } from './flags.js';
import { wrapText, textWidth, frlgText, LINE_HEIGHT } from './frlgFont.js';
import { ITEM_ICONS, itemIcon, traitIcon } from '../art/uiIcons.js';
import { souvenirs } from './souvenirs.js';
import { ITEMS, TRAITS, MAX_TRAITS } from '../data/story.js';
import { MAPS } from '../data/maps/index.js';
import { ABOUT, CARNET, OBJECTS, SOUVENIRS } from '../data/bag.js';
import { FullScreenPanel, BAR } from './FullScreenPanel.js';

// Menu Start > SAC (ou touche I) : le sac en trois onglets (data/bag.js) : « Objets » (ce qui sert encore), « Souvenirs »
// (ce qui ne sert plus ; un souvenir y passe tout seul quand sa quête est finie ; aussi les souvenirs du carnet, comme la
// photo du canal), chacun avec son icône (art/uiIcons.js), et « Vertus » (le carnet des vertus : chaque vertu reçue, sa
// phrase, sa ville et ses utilisations).
// La grille se remplit ligne par ligne (gauche, puis droite), dans l'ordre où Pierre a reçu les objets ; sous la grille,
// la phrase de l'objet choisi, comme dans Pokémon.
// Clavier : ← → changent d'onglet de partout (en boucle) ; ↑ ↓ parcourent la grille de l'onglet, case par case ; Entrée
// ouvre la fiche de l'objet (grande icône, nom, phrase entière) ; Échap ferme la fiche, puis le sac. Chaque onglet garde
// la place de son curseur (même d'une ouverture du sac à l'autre). Le bandeau montre l'onglet ouvert au milieu, en
// surbrillance et souligné, et ses deux voisins de part et d'autre.
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
    this.tab ??= 0;
    this.cursors ??= TABS.map(() => 0);
    this.detail = false;
    this.index = Math.min(this.cursors[this.tab], Math.max(0, this.slots().length - 1));
    this.isOpen = true;
    this.render();
  }

  // Les cases de l'onglet, dans l'ordre du jeu, une par objet, souvenir ou vertu à trouver : { id, name, icon, about,
  // used? } quand c'est trouvé (`used` : donné ou employé, le jeu l'a repris : grisé), null pour une case vide (rien ne dit
  // ce qui manque). `found` / `total` : le compteur du bandeau.
  slots() {
    const item = (id, extra = {}) => ({ id, name: NAMES[id], icon: itemIcon(id), about: ABOUT[id] ?? '', ...extra });
    if (this.tab === 2) {
      const times = (n) => (n ? `utilisée ${n} fois` : 'pas encore utilisée');
      return Object.values(TRAITS).map((t) => (souvenirs.has(t.id) ? {
        id: t.id, name: t.name, icon: traitIcon(t.id),
        about: `« ${t.phrase} » ${MAPS[t.city]?.name ?? t.city}, ${times(souvenirs.uses(t.id))}.`,
      } : null));
    }
    if (this.tab === 0) {
      // Grisé dès qu'il ne sert plus, même s'il est encore dans le sac (les clés de Bordeaux une fois à Hull).
      const slots = OBJECTS.map((o) => (o.used && meetsConditions(o.used) ? item(o.id, { used: true }) : items.has(o.id) ? item(o.id) : null));
      // Un souvenir qui sert encore (un diplôme avant la fin de sa quête) : à la suite, hors compteur.
      const pending = items.list().filter((i) => i.id in NAMES && SOUVENIRS.some((x) => x.id === i.id) && !isSouvenir(i.id))
        .map((i) => item(i.id, { extra: true }));
      return [...slots, ...pending];
    }
    return [
      ...SOUVENIRS.map((x) => (items.has(x.id) && isSouvenir(x.id) ? item(x.id) : null)),
      ...CARNET.map((c) => (souvenirs.has(c.id)
        ? { id: c.id, name: souvenirs.list().find((x) => x.id === c.id)?.name ?? c.id, icon: c.icon, about: c.text } : null)),
    ];
  }

  render() {
    this.begin();
    const { scene: s, u, X, Y } = this;
    const text = (t, x, y, color) => this.text(t, x, y, color);
    const g = this.add(s.add.graphics());
    this.drawBars(g, 0xe87830, 0xf8f8f0);
    const list = this.slots();

    // Les onglets, dans le bandeau du haut : l'onglet ouvert au milieu, sur fond clair et souligné ; à gauche et à droite,
    // ses voisins (« < SOUVENIRS », « VERTUS > »), là où mènent les flèches ← et →.
    const n = TABS.length;
    const width = (label) => textWidth(s, frlgText(s, label));
    const active = TABS[this.tab].toUpperCase();
    const mid = 150;
    const aw = width(active);
    g.fillStyle(0xf8f8f0, 1).fillRoundedRect(X(mid - aw / 2 - 4), Y(2), (aw + 8) * u, (BAR - 2) * u, 2 * u);
    g.fillStyle(0xe87830, 1).fillRect(X(mid - aw / 2), Y(BAR - 3), aw * u, u);
    text(active, mid - aw / 2, 1, 0xe87830);
    const prev = `< ${TABS[(this.tab + n - 1) % n].toUpperCase()}`;
    const next = `${TABS[(this.tab + 1) % n].toUpperCase()} >`;
    text(prev, mid - aw / 2 - 14 - width(prev), 1, 0xffffff);
    text(next, mid + aw / 2 + 14, 1, 0xffffff);
    // Le compteur : trouvés sur le total de l'onglet (« 3/16 »), et la page.
    const perPage = 2 * ROWS;
    const page = Math.floor(this.index / perPage);
    const pages = Math.max(1, Math.ceil(list.length / perPage));
    const counted = list.filter((slot) => !slot?.extra);
    const found = counted.filter(Boolean).length;
    const count = `${found}/${this.tab === 2 ? MAX_TRAITS : counted.length}${pages > 1 ? `  ${page + 1}/${pages}` : ''}`;
    text(count, SCREEN_W - textWidth(s, frlgText(s, count)) - 6, 1, 0xffffff);
    text(this.detail ? 'Entrée ou Échap : retour à la liste' : '← → onglet   ↑ ↓ choisir   Entrée : voir   Échap : fermer',
      6, SCREEN_H - BAR + 1, 0xffffff);

    // La grille : chaque case trouvée (icône et nom ; grisée si l'objet a été donné ou employé), les autres vides.
    list.slice(page * perPage, (page + 1) * perPage).forEach((item, j) => {
      const i = page * perPage + j;
      const x = j % 2 ? SCREEN_W / 2 + 2 : 6;                    // ligne par ligne : gauche, puis droite
      const y = BAR + 4 + Math.floor(j / 2) * ROW_H;
      const w = (SCREEN_W / 2 - 8) * u;
      const h = (ROW_H - 2) * u;
      if (i === this.index) g.fillStyle(0xf8c890, 1).fillRoundedRect(X(x - 2), Y(y), w, h, 2 * u);
      if (!item) {
        g.lineStyle(u, 0xd8d0c0, 1).strokeRoundedRect(X(x - 2), Y(y), w, h, 2 * u);
        return;
      }
      if (item.icon) {
        this.add(s.add.image(X(x + 14), Y(y + (ROW_H - 2) / 2), ITEM_ICONS, item.icon).setScale(u).setAlpha(item.used ? 0.4 : 1));
      }
      text(item.name, x + 32, y + 8).setAlpha(item.used ? 0.45 : 1);
    });

    // Sous la grille, dans un cadre : la phrase de l'objet choisi (rien pour une case vide).
    const about = list[this.index]?.about ?? '';
    const top = BAR + 4 + ROWS * ROW_H + 2;
    g.lineStyle(u, 0xe87830, 1).strokeRoundedRect(X(4), Y(top), (SCREEN_W - 8) * u, (SCREEN_H - BAR - top - 3) * u, 3 * u);
    wrapText(s, about, SCREEN_W - 24).slice(0, 3).forEach((line, k) => text(line, 12, top + 3 + k * LINE_HEIGHT));
    if (this.detail && list[this.index]) this.drawDetail(list[this.index]);
  }

  // La fiche de l'objet choisi (Entrée), par-dessus la grille (son propre fond, ajouté après les cases) : grande icône,
  // nom, et la phrase entière.
  drawDetail(item) {
    const { scene: s, u, X, Y } = this;
    const g = this.add(s.add.graphics());
    const left = 24;
    const top = BAR + 8;
    const w = SCREEN_W - 2 * left;
    const h = ROWS * ROW_H - 8;
    g.fillStyle(0xf8f8f0, 1).fillRoundedRect(X(left), Y(top), w * u, h * u, 4 * u);
    g.lineStyle(u, 0xe87830, 1).strokeRoundedRect(X(left), Y(top), w * u, h * u, 4 * u);
    if (item.icon) {
      this.add(s.add.image(X(left + 24), Y(top + 24), ITEM_ICONS, item.icon).setScale(2 * u).setAlpha(item.used ? 0.4 : 1));
    }
    this.text(item.name, left + 48, top + 10, 0xe87830);
    if (item.used) this.text('(ne sert plus)', left + 48, top + 10 + LINE_HEIGHT);
    wrapText(s, item.about ?? '', w - 16).slice(0, 4)
      .forEach((line, k) => this.text(line, left + 8, top + 48 + k * LINE_HEIGHT));
  }

  // Onglet suivant ou précédent (en boucle), au curseur qu'on y avait laissé.
  setTab(tab) {
    if (tab === this.tab) return;
    this.cursors[this.tab] = this.index;
    this.tab = tab;
    this.index = Math.min(this.cursors[tab], Math.max(0, this.slots().length - 1));
    this.detail = false;
    sfx('select');
    this.render();
  }

  // Touche pendant que le sac est ouvert. Renvoie vrai quand il se ferme.
  onKey(e) {
    const n = this.slots().length;
    if (this.detail) {
      if (['Escape', 'Enter', ' ', 'Backspace'].includes(e.key)) {
        this.detail = false;
        sfx('select');
        this.render();
      }
      return false;
    }
    if (e.key === 'Escape' || e.key === 'i' || e.key === 'I') {
      this.cursors[this.tab] = this.index;
      sfx('select');
      this.close();
      return true;
    }
    if (e.key === 'Enter' || e.key === ' ') {
      if (!this.slots()[this.index]) return false;            // case vide : rien à voir
      this.detail = true;
      sfx('select');
      this.render();
      return false;
    }
    const tabs = TABS.length;
    if (e.key === 'ArrowLeft') return this.setTab((this.tab + tabs - 1) % tabs), false;
    if (e.key === 'ArrowRight' || e.key === 'Tab') {
      e.preventDefault?.();
      return this.setTab((this.tab + 1) % tabs), false;
    }
    const delta = { ArrowDown: 1, ArrowUp: -1 }[e.key];
    if (!delta || !n) return false;
    const next = this.index + delta;
    if (next < 0 || next >= n) return false;
    this.index = next;
    this.cursors[this.tab] = next;
    sfx('select');
    this.render();
    return false;
  }
}
